# Lua Scripting & Redis Functions: Triệt tiêu Race Condition trong 1 nhịp nguyên tử

Ở Module `R06`, chúng ta đã thấy giới hạn cứng của `MULTI / EXEC`: bên trong khối giao dịch, mọi câu lệnh chỉ trả về chữ `QUEUED` nên bạn **không thể đọc số dư hiện tại ra để rẽ nhánh `if / else`**. Còn nếu đọc ra ứng dụng bằng `GET`, kiểm tra trong JS/Python rồi mới gửi `DECRBY` ngược lại, khoảng trống mạng `0.5ms` giữa 2 lệnh chính là mảnh đất màu mỡ cho lỗi kinh hoàng **TOCTOU (*Time-of-Check to Time-of-Use*) Race Condition**!

**Redis Lua Scripting (`EVAL` / `EVALSHA`)** ra đời để chấm dứt hoàn toàn bài toán này:

- [>] Bạn gửi một hàm ngắn viết bằng ngôn ngữ **Lua 5.1** vào chạy **ngay bên trong bộ nhớ của tiến trình Redis**.
- [+] Vì Redis thực thi toàn bộ kịch bản Lua trên chính **luồng Event Loop đơn**, từ dòng đầu tiên đến chữ `return` cuối cùng của script được đảm bảo ==nguyên tử & cô lập 100%== — không một lệnh nào của bất kỳ client nào khác có thể xen vào giữa!
- [!] Hơn nữa, bạn gom cả chuỗi Đọc → Tính toán → Ghi có điều kiện vào đúng **1 vòng mạng (1 RTT)** duy nhất!

```visual
kind: illustration
diagram: redis:r07
alt: So sánh lỗi bán âm kho do Check-Then-Act ở phía ứng dụng với hộp thực thi nguyên tử Lua Sandbox bên trong luồng chính Redis 8
badge: Lập trình phía Server · Lua Atomic
title: Hộp Cát Nguyên Tử Lua Sandbox — Đọc, Rẽ Nhánh & Ghi Trong 1 Nhịp Duy Nhất
subtitle: Cách KEYS[] + ARGV[] đi vào trình thông dịch Lua nhúng sẵn của Redis mà không cho phép bất kỳ lệnh ngoại lai nào chen ngang
caption: Nhấn vào sơ đồ để phóng to — đối chiếu lỗi đua tranh TOCTOU qua mạng với thực thi nguyên tử khép kín của EVAL / EVALSHA
callouts:
  - num: 1
    label: Triệt Tiêu Khoảng Trống Mạng TOCTOU
    desc: Thay vì GET đem về Node.js kiểm tra rồi mới DECRBY (bị request khác chen ngang), Lua kiểm tra if cur >= qty và trừ ngay tại chỗ trên RAM.
    tone: rose
  - num: 2
    label: Luật Thép Tách Bạch KEYS[] và ARGV[]
    desc: Mọi tên khoá bắt buộc truyền qua mảng KEYS[1..N] (chỉ số bắt đầu từ 1!) để Redis Cluster kiểm tra Hash Slot trước khi chạy; tham số phụ truyền qua ARGV[].
    tone: amber
  - num: 3
    label: Bộ Nhớ Đệm SHA1 (EVALSHA) & Redis Functions
    desc: Nạp script một lần để sau đó chỉ truyền mã băm 40 ký tự SHA1 qua EVALSHA (hoặc đăng ký thư viện FCALL trên Redis 7/8), tiết kiệm băng thông tối đa.
    tone: emerald
```

## 1. Đối chiếu trực diện: Lỗi bán lố ở App vs Kịch bản Lua bất khả xâm phạm

> [!ANALOGY] Hình dung giao dịch tại quầy thủ quỹ ngân hàng
> - **Check-Then-Set ở phía App:** Bạn gọi điện hỏi thủ quỹ *"Tài khoản còn đủ 5 triệu không?"* → Thủ quỹ đáp *"Còn"* → Bạn cúp máy, 2 giây sau gọi lại bảo *"Trừ 5 triệu nhé!"* — nhưng trong 2 giây đó vợ bạn ở máy ATM khác đã rút mất 4 triệu rồi!
> - **`EVAL` Lua Script:** Bạn đưa tờ uỷ nhiệm chi ghi rõ *"Nếu số dư >= 5 triệu thì rút ngay 5 triệu, không đủ thì huỷ"* trực tiếp vào tay thủ quỹ — một người duy nhất kiểm tra sổ và gạch tiền liền tay trước khi gọi số thứ tự khách tiếp theo!

```visual
kind: compare
title: Trừ Tồn Kho Flash-Sale — Bẫy Race Condition vs Chuẩn Nguyên Tử Lua
subtitle: Chú ý chỉ số mảng trong Lua bắt đầu từ 1 (KEYS[1], ARGV[1]), không phải 0 như JS/Python!
left:
  badge: DÍNH LỖI BÁN LỐ (OVERSELLING)
  title: Check-Then-Act ngoài Node.js / Python
  tone: rose
  lang: ts
  code: |
    // NGUY HIỂM: 2 request cùng đọc thấy cur = 1!
    const cur = Number((await redis.get(skuKey)) ?? 0);
    if (cur >= qty) {
      // Khoảng trống 0.5ms cho request khác lọt vào!
      await redis.decrby(skuKey, qty); // -> Âm kho!
      return true;
    }
    return false;
  bullets:
    - "Tốn **2 vòng mạng RTT** và hoàn toàn không có tính cô lập giữa lệnh đọc với lệnh ghi."
    - "Dưới tải 1,000 req/s, kho chỉ còn 10 món nhưng có thể bán lố thành 45 đơn hàng!"
right:
  badge: NGUYÊN TỬ 100% TRÊN SERVER
  title: Kịch Bản Lua Thực Thi Qua EVAL / EVALSHA
  tone: emerald
  lang: redis
  code: |
    EVAL "
      local cur = tonumber(redis.call('GET', KEYS[1]) or '0')
      local qty = tonumber(ARGV[1])
      if cur >= qty then
        return redis.call('DECRBY', KEYS[1], qty)
      else
        return -1
      end
    " 1 stock:sku:iphone16 2
  bullets:
    - "`redis.call('GET', ...)` trả về chuỗi hoặc `false`/`nil`; luôn ép kiểu số bằng **`tonumber(...)`** trước khi so sánh `>=`!"
    - "Trả về số tồn kho còn lại nếu thành công, hoặc `-1` nếu không đủ hàng — **tuyệt đối không bao giờ âm kho**."
```

## 2. Ba kịch bản Lua "gối đầu giường" của mọi Kỹ sư Hệ thống

```visual
kind: groups
title: Ba Mẫu Lua Script Kinh Điển Nhất Trong Thiết Kế Hệ Thống Phân Tán [!badge:emerald:Production]
columns: 3
items:
  - num: 1
    title: Safe Lock Release (Nhả khoá an toàn)
    badge: Distributed Lock
    tone: emerald
    bullets:
      - "Khi lấy khoá: `SET lock:res <my_uuid> NX EX 30`."
      - "Khi nhả khoá: **Bắt buộc dùng Lua** so khớp `GET == my_uuid` rồi mới `DEL`, tránh xoá nhầm khoá của tiến trình khác khi mình bị trễ!"
    code: |
      if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
      else
        return 0
      end
    codeLang: redis
  - num: 2
    title: Atomic Rate Limiter Window
    badge: INCR + EXPIRE lần 1
    tone: sky
    bullets:
      - "Gộp `INCR` và đặt `EXPIRE` ngay khi `count == 1` trong cùng 1 kịch bản Lua để khoá không bao giờ bị mất TTL (rò rỉ vĩnh viễn)."
    code: |
      local c = redis.call('INCR', KEYS[1])
      if c == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return c
    codeLang: redis
  - num: 3
    title: Tiết kiệm băng thông với EVALSHA
    badge: Cache mã nguồn SHA1
    tone: amber
    bullets:
      - "Thay vì gửi lại đoạn văn bản Lua dài `2KB` ở mỗi request, dùng `SCRIPT LOAD` (hoặc `ioredis.defineCommand`) để chỉ gửi mã băm SHA1 40 ký tự qua **`EVALSHA`**."
      - "Từ Redis 7 → Redis 8 còn có **`FUNCTION LOAD` / `FCALL`** lưu bền vững thư viện hàm vào cả AOF/Replica!"
```

## 3. Quy tắc chuyển đổi kiểu dữ liệu RESP ↔ Lua & Luật thép viết Script

Khi gọi `redis.call()` hoặc `redis.pcall()` bên trong Lua, hãy nhớ 4 quy tắc ép kiểu đặc thù để không dính bug ngầm:
- **Mảng trong Lua đếm từ `1`:** Khoá đầu tiên là **`KEYS[1]`**, đối số đầu tiên là **`ARGV[1]`** (gọi `KEYS[0]` sẽ ra `nil`!).
- **Mọi phần tử trong `ARGV[]` và giá trị `GET`/`HGET` đều là chuỗi (`string`):** Phép so sánh `"9" >= "10"` theo thứ tự chuỗi trong Lua sẽ ra **`true`** (vì ký tự `'9' > '1'`)! Luôn bọc **`tonumber(...)`** khi làm việc với con số.
- **`nil` của RESP (`GET` khoá không tồn tại) sang Lua thành `false` boolean:** Trong Lua, chỉ có `false` và `nil` mang tính sai (*falsy*), còn **số `0` và chuỗi rỗng `""` đều là `true` (*truthy*)**! Vì vậy viết `tonumber(redis.call('GET', KEYS[1]) or '0')` hoạt động cực kỳ mượt mà.
- **`redis.call` vs `redis.pcall`:** `redis.call` gặp lỗi sẽ dừng script ngay và ném lỗi về client; `redis.pcall` bắt lỗi lại thành bảng `{ err = "..." }` để script tự xử lý tiếp.

> [!TRAP] Ba điều CẤM KỴ tuyệt đối bên trong kịch bản Lua của Redis!
> 1. **CẤM gán cứng (hardcode) hoặc tự ghép tên khoá động bên trong Lua:** Mọi khoá mà script chạm tới **bắt buộc phải khai báo tường minh qua `KEYS[1..N]`**. Trên Redis Cluster, máy chủ kiểm tra danh sách `KEYS` trước khi chạy để đảm bảo tất cả nằm cùng 1 Hash Slot (ví dụ dùng Hash Tag `acc:{bank}:alice` và `acc:{bank}:bob`).
> 2. **CẤM viết vòng lặp nặng hoặc xử lý lâu quá vài mili-giây:** Khi Lua đang chạy, toàn bộ Event Loop bị giữ độc quyền (ngưỡng khẩn cấp mặc định `lua-time-limit` là `5000ms`). Giữ script ngắn gọn dưới 20–30 dòng!
> 3. **CẤM sinh giá trị ngẫu nhiên không tất định (`math.random`, thời gian hệ thống ngoài):** Mọi tham số như `nowMs` hay `uuid` hãy tạo sẵn ở tầng ứng dụng rồi truyền vào qua **`ARGV[]`** để việc nhân bản sang Replica/AOF hoàn toàn tất định (*deterministic*).

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - Dùng **`EVAL script numkeys key1 ... arg1 ...`** khi logic ghi phụ thuộc vào kết quả vừa đọc ra (trừ kho, mở khoá phân tán, giới hạn tốc độ).
> - Nhớ 3 luật vàng của Lua trong Redis: **Chỉ số bắt đầu từ `1`** (`KEYS[1]`, `ARGV[1]`) · **Luôn `tonumber()` trước khi so sánh số** · **Không bao giờ ghép tên khoá ngầm ngoài `KEYS[]`**.
> - Trong thực tế với `ioredis` / `redis-py`, thư viện sẽ tự động dùng **`EVALSHA`** kèm cơ chế nạp lại `NOSCRIPT` tự động cho bạn!

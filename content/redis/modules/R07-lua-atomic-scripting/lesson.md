# Lua Scripting & Redis Functions: Triệt tiêu Race Condition trong 1 nhịp nguyên tử

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Giả sử cửa hàng còn đúng **1 chiếc điện thoại cuối cùng** trong kho (`stock = 1`), nhưng đúng 12h00 trưa có **2 khách hàng bấm nút "Mua ngay" cùng một mili-giây** từ 2 máy chủ API khác nhau:
> - Nếu viết code kiểu thông thường ở phía ứng dụng (Python, Node.js, Go, Java): Bước 1 gọi `GET stock` về thấy bằng `1` (`>= 1`, đủ hàng!) → Bước 2 gửi lệnh `DECR stock` để trừ kho. Vì giữa Bước 1 và Bước 2 có khoảng trễ mạng `0.5ms`, **cả 2 máy chủ đều kịp đọc thấy `1` trước khi người kia kịp trừ**, dẫn đến cả hai cùng trừ kho xuống **`-1`**! Bạn vừa bán 2 đơn cho 1 món hàng duy nhất — lỗi này gọi là ==TOCTOU Race Condition== (*Time-of-Check to Time-of-Use* — khoảng hở tử thần giữa lúc kiểm tra và lúc hành động).
> - **Redis Lua Scripting (`EVAL` / `EVALSHA`)** giải quyết triệt để bằng cách nhúng sẵn trình thông dịch ngôn ngữ **Lua** siêu nhẹ ngay bên trong tiến trình Redis. Bạn gửi tờ hướng dẫn *"Đọc tồn kho -> Nếu `>= số lượng mua` thì trừ ngay, ngược lại báo hết hàng"* chạy thẳng trên luồng đơn của Redis: **không một lệnh nào khác trên đời có thể chen vào giữa**, vừa ==nguyên tử 100%==, vừa chỉ tốn đúng **1 chuyến mạng (1 RTT)**!

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
    desc: Thay vì GET đem về ứng dụng kiểm tra rồi mới DECRBY (bị request khác chen ngang), Lua kiểm tra if cur >= qty và trừ ngay tại chỗ trên RAM.
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

## 1. Đối chiếu trực tiếp: Race Condition ở tầng Ứng dụng vs Lua Script nguyên tử

> [!ANALOGY] Hình dung giao dịch qua điện thoại vs Đưa giấy ủy nhiệm trực tiếp cho Thủ quỹ
> - **Đọc rồi mới Ghi từ App:** Bạn gọi điện hỏi thủ quỹ *"Còn đủ 5 triệu không?"* → Nghe đáp *"Còn"*, bạn cúp máy, 2 giây sau gọi lại bảo *"Trừ 5 triệu nhé!"* — nhưng trong 2 giây đó người thân cầm thẻ phụ đã rút mất 4 triệu ở cây ATM khác rồi!
> - **Lua Script (`EVAL`):** Bạn trao tờ phiếu ghi sẵn điều kiện vào tận tay người thủ quỹ duy nhất của ngân hàng — thủ quỹ nhìn sổ và gạch tiền liền tay trong cùng một tích tắc trước khi gọi khách tiếp theo!

```visual
kind: compare
title: Trừ Tồn Kho Flash-Sale — Bẫy Race Condition vs Chuẩn Nguyên Tử Lua
subtitle: Chú ý chỉ số mảng trong ngôn ngữ Lua đếm từ 1 (KEYS[1], ARGV[1]), không phải từ 0!
left:
  badge: DÍNH LỖI BÁN VƯỢT TỒN KHO (OVERSELLING)
  title: Check-Then-Act ở tầng App (Python / JS / Go)
  tone: rose
  lang: python
  code: |
    # NGUY HIỂM: 2 worker cùng đọc thấy cur == 1!
    cur = int(r.get(sku_key) or 0)
    if cur >= qty:
        # Khoảng trống mạng 0.5ms cho request khác lọt vào!
        r.decrby(sku_key, qty)  # -> Âm kho (-1)!
        return True
    return False
  bullets:
    - "Tốn **2 chuyến mạng RTT** và hoàn toàn mất tính cô lập giữa câu lệnh đọc với câu lệnh ghi."
    - "Dưới tải 1,000 req/s, kho chỉ còn 10 chiếc nhưng có thể bán lố thành 45 đơn hàng!"
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
    - "`redis.call('GET', ...)` trả về chuỗi văn bản hoặc `false`; luôn ép kiểu số bằng **`tonumber(...)`** trước khi so sánh `>=`!"
    - "Trả về số tồn kho còn lại nếu thành công, hoặc `-1` nếu không đủ hàng — **tuyệt đối không bao giờ âm kho**."
```

## 2. Ba mẫu Lua Script thực chiến & Cách gọi thanh lịch từ SDK (`redis-py` & `ioredis`)

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
      - "Khi nhả khoá: **Bắt buộc dùng Lua** kiểm tra `GET == my_uuid` rồi mới `DEL`, tránh xoá nhầm khoá của worker khác!"
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
      - "Gộp `INCR` và đặt `EXPIRE` ngay khi `count == 1` trong cùng 1 kịch bản Lua để bộ đếm không bao giờ bị quên gắn hạn sống."
    code: |
      local c = redis.call('INCR', KEYS[1])
      if c == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return c
    codeLang: redis
  - num: 3
    title: Tối ưu băng thông với EVALSHA & Functions
    badge: Cache mã băm SHA1
    tone: amber
    bullets:
      - "Thay vì gửi đi gửi lại đoạn code Lua dài mỗi request, `SCRIPT LOAD` trả về mã băm 40 ký tự để gọi nhanh qua ==`EVALSHA`==."
      - "Từ Redis 7 → Redis 8 còn có **`FUNCTION LOAD` / `FCALL`** lưu bền vững thư viện hàm vào AOF và tự đồng bộ sang Replica!"
```

Khi đi làm thực tế, bạn **không cần tự tính mã SHA-1 thủ công** — cả Python `redis-py` lẫn Node.js `ioredis` đều cung cấp hàm bọc tự động dùng `EVALSHA` (và tự nạp lại nếu máy chủ Redis vừa khởi động mới):

```python
# Python (redis-py): Đăng ký hàm Lua 1 lần, gọi mượt như hàm Python bình thường!
RESERVE_STOCK_LUA = """
local cur = tonumber(redis.call('GET', KEYS[1]) or '0')
local qty = tonumber(ARGV[1])
if cur >= qty then
    return redis.call('DECRBY', KEYS[1], qty)
end
return -1
"""
reserve_stock = r.register_script(RESERVE_STOCK_LUA)
remaining = reserve_stock(keys=["stock:sku:iphone16"], args=[2])  # Tự động chạy EVALSHA!
```

## 3. Quy tắc chuyển đổi kiểu dữ liệu RESP ↔ Lua & 3 điều cấm kỵ

Khi viết `redis.call()` bên trong Lua, hãy ghim kỹ 4 quy tắc đặc thù của ngôn ngữ Lua để tránh lỗi ngầm:
- **Mảng trong Lua đếm từ `1` (không phải `0`):** Khóa đầu tiên là ==`KEYS[1]`==, tham số đầu tiên là ==`ARGV[1]`== (gọi `KEYS[0]` sẽ nhận về `nil`!).
- **Mọi phần tử trong `ARGV[]` và kết quả `GET`/`HGET` đều là chuỗi (`string`):** Trong Lua, so sánh hai chuỗi `"9" >= "10"` sẽ ra **`true`** (vì ký tự `'9'` lớn hơn ký tự `'1'`)! Luôn ép kiểu bằng **`tonumber(...)`** trước khi tính toán.
- **`(nil)` của Redis chuyển sang Lua thành boolean `false`:** Trong Lua, số `0` và chuỗi rỗng `""` đều mang nghĩa `true` (*truthy*), chỉ có `false` và `nil` là sai (*falsy*) — nhờ vậy câu lệnh `tonumber(redis.call('GET', KEYS[1]) or '0')` hoạt động hoàn hảo!
- **`redis.call` vs `redis.pcall`:** `redis.call` dừng ngay và ném lỗi về ứng dụng; `redis.pcall` bắt lỗi lại dưới dạng bảng `{ err = "..." }` để script tự xử lý.

> [!WARNING] Ba điều CẤM TUYỆT ĐỐI bên trong kịch bản Lua trên Production!
> 1. **CẤM tự ghép chuỗi tên khóa ngầm bên trong Lua:** Mọi khóa mà script đọc/ghi ==bắt buộc phải truyền tường minh qua mảng `KEYS[1..N]`== (cấm viết kiểu `redis.call('GET', 'user:' .. ARGV[1])`). Trên **Redis Cluster**, máy chủ cần đọc danh sách `KEYS` trước khi chạy để kiểm tra tất cả khóa có nằm chung một phân mảnh (*Hash Slot*) hay không!
> 2. **CẤM viết vòng lặp dài hoặc tính toán nặng quá vài mili-giây:** Khi Lua đang chạy, toàn bộ luồng chính bị giữ độc quyền — một script chạy mất `500ms` sẽ chặn đứng toàn bộ hệ thống suốt nửa giây! Hãy giữ script ngắn gọn dưới 30 dòng.
> 3. **CẤM tự sinh giá trị ngẫu nhiên/thời gian ngoài ở trong script:** Những giá trị như `now_ms` hay `uuid` hãy tạo sẵn ở ứng dụng rồi truyền vào qua **`ARGV[]`** để đảm bảo tính tất định (*deterministic*).

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - Dùng **`EVAL` / `EVALSHA`** bất cứ khi nào bước Ghi phụ thuộc trực tiếp vào kết quả vừa Đọc ra (trừ tồn kho, nhả khóa phân tán, giới hạn tốc độ).
> - Ba luật vàng của Redis Lua: **Mảng bắt đầu từ `1` (`KEYS[1]`, `ARGV[1]`)** · **Luôn bọc `tonumber()` khi so sánh số** · **Mọi tên khóa phải đi qua `KEYS[]`**.
> - Tận dụng `r.register_script(...)` (`redis-py`) hoặc `redis.defineCommand(...)` (`ioredis`) để tự động hóa `EVALSHA`.

# Điều phối Phân tán: Distributed Locks chuẩn Lua, Fencing Token & Bộ tứ Rate Limiter

Khi ứng dụng của bạn chạy trên duy nhất 1 tiến trình Node.js hay Java, một biến cờ hoặc `Mutex` trong bộ nhớ là đủ để ngăn hai luồng trừ tiền khách hàng hai lần. Nhưng ngay khoảnh khắc bạn nhân bản dịch vụ lên **`12` Pod Kubernetes**, hai request nhấn đúp nút *"Thanh toán"* cách nhau `3ms` sẽ rơi vào hai Pod hoàn toàn khác nhau — không chia sẻ RAM, không biết sự tồn tại của nhau! Đó là lúc **Redis đứng ở trung tâm như Trọng tài Đơn luồng Nguyên tử** cho hai bài toán sống còn: **Khoá phân tán (*Distributed Lock*)** và **Giới hạn lưu lượng (*Rate Limiting*)**.

> [!ANALOGY] Ẩn dụ Chìa Khoá Phòng Họp Có Thẻ Tên & Đồng Hồ Cát
> Hãy tưởng tượng 10 nhân viên cùng muốn vào 1 buồng gọi điện thoại cách âm:
> - Nếu ai vào chỉ chốt cửa mà **không có đồng hồ cát tự bung chốt (`PX`)**: người đó ngất xỉu bên trong thì căn phòng bị khoá chết vĩnh viễn (**Deadlock**).
> - Nếu ai ra khỏi phòng cứ bấm nút mở toang cửa từ xa mà **không đối chiếu thẻ tên (`UUID`)**: Anh A ngồi quá giờ nên đồng hồ cát đã tự mở cửa cho Chị B vào ngồi; đúng lúc đó Anh A tỉnh dậy bấm nút mở cửa → **lộ mặt Chị B để Anh C lao vào cùng lúc!**

## 1. Giải phẫu Khoá Phân tán An toàn Tuyệt đối trên Redis

90% các bài hướng dẫn sơ sài trên mạng dạy viết Distributed Lock sai cách (dùng `SETNX` rời rạc hoặc nhả khoá bằng `DEL` trần trụi). Hãy nắm vững **3 Quy tắc Bất di Bất dịch** của một khoá phân tán chuẩn công nghiệp:

```visual
kind: illustration
diagram: "redis:r11"
badge: "Distributed Coordination · R11"
title: "Chu trình Khoá Phân tán Nguyên tử & Bộ Giới hạn Tốc độ Lua"
subtitle: "Từ bước chiếm khoá SET NX PX gắn định danh duy nhất đến bước Compare-And-Delete bằng kịch bản Lua"
caption: "Mọi thao tác Kiểm-tra-rồi-Hành-động (Check-Then-Act) trên Redis đều phải gom vào 1 lệnh nguyên tử hoặc 1 kịch bản EVAL Lua."
callouts:
  - num: 1
    label: "Acquire: SET key uuid NX PX"
    desc: "Gộp nguyên tử điều kiện chưa tồn tại (NX), thời gian thuê tự huỷ (PX) và mã định danh duy nhất của chủ khoá (UUID)."
    tone: cyan
  - num: 2
    label: "Release: Lua Compare-And-Delete"
    desc: "Chỉ xoá khoá khi giá trị đang lưu khớp chính xác UUID của mình — ngăn chặn xoá nhầm khoá của Pod kế tiếp."
    tone: emerald
  - num: 3
    label: "Fencing Token & Lua Rate Limit"
    desc: "Dùng số thứ tự tăng dần bảo vệ tầng lưu trữ đích và dùng Lua thực thi cửa sổ trượt / xô thẻ bài trong 1 RTT."
    tone: amber
```

### Ba tai nạn kinh điển nếu làm tắt và cách hoá giải triệt để

```visual
kind: compare
title: "Khoá Phân Tán Ngây Thơ (Chờ Ngày Gây Hoạ) vs Khoá Phân Tán Chuẩn SRE"
subtitle: "Chỉ lệch 1 chi tiết nhỏ là hệ thống tài chính đối mặt nguy cơ trừ đúp tiền (Double Spend)"
left:
  badge: "NGUY HIỂM CHẾT NGƯỜI"
  title: "SETNX rời rạc & Nhả khoá bằng DEL trần"
  tone: rose
  code: |
    // 1. Nếu sập giữa 2 dòng -> Deadlock vĩnh viễn!
    const ok = await redis.setNx('lock:order:88', '1');
    if (ok) await redis.expire('lock:order:88', 5);

    // ... Pod A bị GC Pause 6 giây (khoá đã sang tay Pod B) ...
    // 2. Xoá mù quáng -> Xoá luôn khoá đang hợp lệ của Pod B!
    await redis.del('lock:order:88');
  lang: shell
  bullets:
    - "**Lỗi 1 (Deadlock):** `SETNX` và `EXPIRE` không nguyên tử; Pod mất điện ở giữa làm khoá sống mãi mãi (`TTL = -1`)."
    - "**Lỗi 2 (Giá trị cố định `'1'`):** Không phân biệt được ai là chủ sở hữu thực sự đang giữ khoá."
    - "**Lỗi 3 (Xoá nhầm dây chuyền):** Dùng `DEL` không kiểm tra chủ sở hữu phá vỡ hoàn toàn tính loại trừ tương hỗ (*Mutual Exclusion*)."
right:
  badge: "CHUẨN CÔNG NGHIỆP"
  title: "SET uuid NX PX + Lua Compare-And-Delete"
  tone: emerald
  code: |
    -- Bước 1: Chiếm khoá nguyên tử kèm UUID riêng cho từng lần gọi
    SET lock:order:88 "f47ac10b-pod-03" NX PX 5000

    -- Bước 2: Giải phóng khoá nguyên tử bằng EVAL Lua
    EVAL 'if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end' 1 lock:order:88 "f47ac10b-pod-03"
  lang: redis
  bullets:
    - "**Nguyên tử lúc chiếm:** `NX` + `PX` thực thi trong đúng 1 bước trên Event Loop."
    - "**Định danh theo từng lượt thuê:** Dùng `crypto.randomUUID()` mới cho mỗi lần gọi (không dùng chung hostname tĩnh!)."
    - "**Nguyên tử lúc nhả:** Kịch bản Lua chạy không bị ngắt quãng giữa `GET` và `DEL`."
```

> [!TIP] Cuộc tranh luận lịch sử: Redlock vs. Fencing Token (Martin Kleppmann)
> Nếu Master Redis vừa cấp khoá cho Pod A xong thì sập nguồn **trước khi kịp sao chép sang Replica**, Replica lên làm Master mới sẽ cấp tiếp khoá đó cho Pod B! Thuật toán **Redlock** thử giải quyết bằng cách lấy đa số khoá (`3/5` nút Redis độc lập), nhưng chuyên gia hệ phân tán **Martin Kleppmann** chỉ ra rằng ngay cả Redlock cũng vẫn bị đánh bại nếu tiến trình gặp **GC Pause dài** hoặc đồng hồ hệ thống nhảy cóc (*Clock Jump*).
> - **Khi dùng Khoá để Tối ưu Hiệu năng** (chống Cache Stampede, tránh chạy trùng Cronjob gửi mail): **1 nút Redis + `SET NX PX` + Lua Release** (kèm luồng *Watchdog* tự gia hạn `PEXPIRE` nếu tác vụ chưa xong) là quá đủ, nhanh và đơn giản!
> - **Khi dùng Khoá cho Đúng đắn Tuyệt đối** (chống ghi đè số dư, xuất kho): Phải cấp kèm **Fencing Token** (`INCR fencing:order:88` sinh số thứ tự đơn điệu `33`, `34`...) và truyền xuống PostgreSQL (`UPDATE ... WHERE fencing_token < 34`) để tầng lưu trữ đích tự từ chối luồng đến muộn (`33`)!

## 2. Bộ tứ Thuật toán Rate Limiting Thực chiến trên Redis

Bảo vệ API khỏi bị cào dữ liệu, chống dò mật khẩu (*Brute-force Login*) hay giữ nhịp gọi sang cổng thanh toán đối tác đều cần một bộ **Rate Limiter phân tán** chia sẻ chung trạng thái giữa mọi Pod API:

```visual
kind: groups
title: "So Sánh 4 Kiến Trúc Rate Limiter Trên Redis 8"
subtitle: "Đánh đổi giữa chi phí bộ nhớ, độ chính xác ở mép cửa sổ và khả năng cho phép Burst ngắn hạn"
columns: 2
items:
  - num: 1
    title: "Fixed Window Counter"
    badge: "Rẻ nhất · O(1)"
    tone: sky
    desc: "Đếm số request trong từng khung thời gian cố định (mỗi phút 1 khoá hoặc INCR + EXPIRE NX)."
    bullets:
      - "Chỉ tốn đúng **1 khoá String số nguyên** cho mỗi user/IP."
      - "Nhược điểm **Boundary Burst x2**: Khách bắn 100 req lúc `00:59` và 100 req lúc `01:01` -> lọt **200 req trong 2 giây**!"
    code: |
      INCR rl:login:203.0.113.9
      EXPIRE rl:login:203.0.113.9 60 NX
    codeLang: redis
  - num: 2
    title: "Sliding Window Log (ZSet)"
    badge: "Chính xác tuyệt đối"
    tone: emerald
    desc: "Lưu dấu thời gian mili-giây của từng request vào Sorted Set, trượt cửa sổ liên tục theo thời gian thực."
    bullets:
      - "Triệt tiêu hoàn toàn lỗi vọt gấp đôi ở mép cửa sổ."
      - "Tốn RAM theo số lượng request (`O(N)` phần tử/user) -> hợp cho giới hạn vừa phải (vd `100 req/phút`)."
    code: |
      ZREMRANGEBYSCORE rl:api:u42 -inf 1699999940000
      ZADD rl:api:u42 1700000000000 "req-991"
      ZCARD rl:api:u42
      PEXPIRE rl:api:u42 60000
    codeLang: redis
  - num: 3
    title: "Token Bucket (Lua + Hash)"
    badge: "Chuẩn API Gateway"
    tone: amber
    desc: "Xô chứa tối đa B thẻ bài, tự động châm thêm R thẻ mỗi giây; mỗi request lấy đi 1 thẻ."
    bullets:
      - "Cho phép lưu lượng vọt ngắn hạn hợp lệ (**Controlled Burst** lên tới dung tích xô `B`) trong khi vẫn giữ tốc độ trung bình `R req/s`."
      - "Chỉ lưu 2 trường Hash (`tokens`, `last_refill_ms`), bắt buộc chạy trong `EVAL` Lua."
    code: |
      HSET bucket:u42 tokens 18 last_ms 1700000000000
    codeLang: redis
  - num: 4
    title: "Atomic Quota / Inventory Guard"
    badge: "Chống Oversell Flash Sale"
    tone: rose
    desc: "Kiểm tra số lượng tồn kho / hạn mức còn lại và trừ nguyên tử trong cùng 1 kịch bản Lua."
    bullets:
      - "Nếu dùng `DECRBY` trần trụi rồi mới kiểm tra `< 0` để cộng trả lại (`INCRBY`), kho hàng dễ bị nhấp nháy âm giả tạo làm từ chối oan khách đến sau."
      - "Dùng Lua kiểm tra `tonumber(stock) >= qty` trước khi trừ giúp tồn kho không bao giờ âm!"
    code: |
      EVAL 'local s=tonumber(redis.call("GET",KEYS[1]) or "0")
      if s>=tonumber(ARGV[1]) then return redis.call("DECRBY",KEYS[1],ARGV[1]) end
      return -1' 1 stock:ps5 2
    codeLang: redis
```

## 3. Quy tắc Viết Kịch bản Lua (`EVAL` / `EVALSHA`) Không Làm Đóng Băng Cụm

Lua Script là siêu năng lực của Redis vì toàn bộ kịch bản chạy **nguyên tử như một giao dịch ACID không thể bị chen ngang**, nhưng cũng vì thế mà một vòng lặp chậm trong Lua sẽ khoá cứng toàn bộ Redis cho mọi khách hàng khác!

- [>] **Quy tắc 1 — Tuyệt đối truyền tên khoá qua `KEYS[...]`, tham số qua `ARGV[...]`:** Không bao giờ ghép chuỗi tên khoá cứng bên trong code Lua (ví dụ cấm viết `redis.call('GET', 'user:' .. ARGV[1])`). Trong môi trường **Redis Cluster**, Redis cần đọc mảng `KEYS` trước khi chạy để định tuyến đúng Hash Slot và kiểm tra lỗi `CROSSSLOT`!
- [>] **Quy tắc 2 — Ngắn gọn dưới `1ms`, cấm vòng lặp không chặn trên:** Không chạy `KEYS *`, không duyệt hàng vạn phần tử trong Lua.
- [>] **Quy tắc 3 — Dùng `EVALSHA` (hoặc Redis 7+ `FUNCTION LOAD`) trên Production:** Thay vì gửi đi gửi lại chuỗi mã nguồn Lua dài `2KB` ở mọi request tốn băng thông mạng, ứng dụng nạp kịch bản 1 lần lấy mã băm SHA-1 (`SCRIPT LOAD`) rồi gọi `EVALSHA <sha1> ...` siêu nhẹ!

```lua
-- Kịch bản Lua chuẩn cho Token Bucket / Atomic Quota (lưu tại lua/token-bucket-ratelimiter.lua)
-- KEYS[1] = khoá xô thẻ bài | ARGV[1] = sức chứa tối đa | ARGV[2] = số thẻ cần rút
local current = tonumber(redis.call("GET", KEYS[1]) or ARGV[1])
local requested = tonumber(ARGV[2])

if current < requested then
  return -1
end

local remaining = current - requested
redis.call("SET", KEYS[1], tostring(remaining), "EX", 60)
return remaining
```

> [!REMEMBER] Ghi nhớ cốt lõi từ R11
> 1. **Chiếm khoá phân tán:** Luôn dùng **`SET <lockKey> <uniqueUuid> NX PX <leaseMs>`** — không bao giờ tách rời `SETNX` và `EXPIRE`.
> 2. **Nhả khoá phân tán:** Bắt buộc dùng **Lua Compare-And-Delete** (`GET == myUuid` rồi mới `DEL`) để không bao giờ xoá nhầm khoá của tiến trình khác sau khi bị GC Pause.
> 3. **Chọn Rate Limiter theo nhu cầu:** Chặn brute-force đơn giản → **Fixed Window** (`INCR` + `EXPIRE ... NX`); chống vọt mép cửa sổ tuyệt đối → **Sliding Window ZSet**; cho phép burst êm ái chuẩn Gateway → **Lua Token Bucket**.

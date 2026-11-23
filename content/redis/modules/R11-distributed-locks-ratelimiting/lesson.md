# Điều phối Phân tán: Distributed Locks chuẩn Lua, Fencing Token và các thuật toán Rate Limiter

> [!NOTE] Khái niệm cốt lõi & Bài toán thực tế
> Khi ứng dụng chạy trên 1 tiến trình duy nhất, các khóa nội bộ (`threading.Lock` trong Python hay `sync.Mutex` trong Go) đủ để ngăn hai luồng cùng sửa một tài nguyên. Nhưng khi mở rộng dịch vụ lên **10 container trên nhiều máy chủ khác nhau**, hai yêu cầu thanh toán cách nhau vài mili-giây có thể rơi vào 2 máy chủ độc lập. Lúc này hệ thống cần **Redis làm điểm điều phối tập trung**:
> - **`Distributed Lock` (Khóa phân tán):** Cơ chế chiếm quyền độc quyền một tài nguyên qua lệnh nguyên tử `SET key <uuid> NX PX <ms>`. Giá trị `uuid` định danh duy nhất chủ sở hữu, còn `PX` đảm bảo khóa tự hết hạn nếu container giữ khóa bị sập (tránh Deadlock). Khi giải phóng khóa, bắt buộc phải dùng **Lua script** kiểm tra đúng `uuid` của mình rồi mới xóa để tránh xóa nhầm khóa của tiến trình kế tiếp.
> - **`GC Pause` & `Fencing Token`:** Nếu tiến trình giữ khóa bị tạm dừng (ví dụ *Garbage Collection Pause*) vượt quá thời gian thuê `PX`, khóa sẽ hết hạn và chuyển sang tiến trình khác. Để ngăn tiến trình cũ tỉnh dậy ghi đè dữ liệu muộn, mỗi lần cấp khóa cần kèm một **số thứ tự tăng dần đơn điệu (`Fencing Token`: `33`, `34`, `35`...)** để Database đích từ chối các ghi nhận có token nhỏ hơn token mới nhất.
> - **`Rate Limiter` (Giới hạn tốc độ):** Giới hạn số yêu cầu tối đa từ một tài khoản hoặc IP trong một khoảng thời gian (chống brute-force đăng nhập, chống quá tải API).

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

## 1. Giải phẫu Khóa Phân tán Chuẩn SRE (Tránh 3 tai nạn kinh điển)

```visual
kind: compare
title: "Khóa Phân Tán Không An Toàn vs Khóa Phân Tán Chuẩn Production"
subtitle: "Thiếu kiểm tra UUID khi giải phóng khóa có thể dẫn đến xóa nhầm khóa của worker khác đang giữ tài nguyên"
left:
  badge: "KHÔNG AN TOÀN"
  title: "SETNX rời rạc & Nhả khoá bằng DEL trần"
  tone: rose
  code: |
    # 1. Nếu sập giữa 2 dòng -> Khoá chết vĩnh viễn!
    if r.setnx("lock:order:88", "1"):
        r.expire("lock:order:88", 5)

    # ... Worker A bị khựng 6 giây (khoá đã hết hạn & sang tay Worker B) ...
    # 2. Xoá mù quáng -> Xoá luôn khoá đang hợp lệ của Worker B!
    r.delete("lock:order:88")
  lang: python
  bullets:
    - "**Lỗi 1 (Deadlock):** `SETNX` và `EXPIRE` tách rời; mất điện ở giữa làm khoá sống vĩnh viễn (`TTL = -1`)."
    - "**Lỗi 2 (Giá trị tĩnh `'1'`):** Không biết ai mới là chủ sở hữu thực sự của khoá."
    - "**Lỗi 3 (Xoá nhầm khoá người khác):** Gọi `DEL` thẳng thừng phá vỡ hoàn toàn tính loại trừ lẫn nhau."
right:
  badge: "CHUẨN CÔNG NGHIỆP"
  title: "SET uuid NX PX + Lua Compare-And-Delete"
  tone: emerald
  code: |
    -- Bước 1: Chiếm khoá nguyên tử kèm UUID riêng cho từng lượt thuê
    SET lock:order:88 "f47ac10b-worker-03" NX PX 5000

    -- Bước 2: Giải phóng khoá nguyên tử bằng EVAL Lua
    EVAL 'if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end' 1 lock:order:88 "f47ac10b-worker-03"
  lang: redis
  bullets:
    - "**Nguyên tử lúc chiếm:** ==`SET key uuid NX PX ms`== thực thi trọn gói trong 1 nhịp."
    - "**Định danh duy nhất mỗi lượt gọi:** Sinh `uuid4()` mới cho từng lần mượn khoá."
    - "**Nguyên tử lúc nhả:** Kịch bản Lua đối chiếu khớp đúng `uuid` mới xoá."
```

> [!TIP] Cuộc tranh luận Redlock vs Fencing Token & Các thư viện chuẩn không cần tự viết tay
> - **Khi dùng khóa để tránh làm việc thừa** (chống Cache Stampede, tránh 2 máy cùng chạy 1 Cronjob gửi báo cáo): **1 nút Redis + `SET NX PX` + Lua Unlock** là gọn nhẹ và hiệu quả nhất! Trong **Python `redis-py`**, hàm có sẵn **`with r.lock("lock:order:88", timeout=10):`** đã tự động sinh `UUID` và nhả khóa bằng Lua chuẩn xác cho bạn! Trên **Java**, **`Redisson` (`RLock`)** còn tích hợp sẵn *Watchdog* tự động gia hạn khóa nếu công việc chạy lâu hơn dự kiến; trên **Go** có **`redsync`**; trên **Node.js** có **`redlock`**.
> - **Khi dùng khóa để bảo vệ dữ liệu tài chính tuyệt đối** (tránh mất khóa khi Master sập chưa kịp chép sang Replica hoặc khi gặp GC Pause): Hãy kết hợp cấp thêm ==Fencing Token (`INCR fencing:order:88`)== và kiểm tra điều kiện `WHERE last_token < :token` ngay trong câu lệnh `UPDATE` của PostgreSQL!

## 2. Bộ tứ Thuật toán Rate Limiting Thực chiến trên Redis

```visual
kind: groups
title: "So Sánh 4 Kiến Trúc Rate Limiter Trên Redis 8"
subtitle: "Đánh đổi giữa chi phí bộ nhớ, độ chính xác ở mép cửa sổ và khả năng cho phép lưu lượng dồn ngắn hạn (Burst)"
columns: 2
items:
  - num: 1
    title: "Fixed Window Counter (Cửa sổ cố định)"
    badge: "Rẻ nhất · O(1)"
    tone: sky
    desc: "Đếm số request trong từng khung giờ cố định (mỗi phút 1 khoá hoặc INCR + EXPIRE NX)."
    bullets:
      - "Chỉ tốn đúng **1 khoá String số nguyên** cho mỗi user/IP."
      - "Nhược điểm **Vọt gấp đôi ở mép phút**: Khách gửi 100 req lúc `00:59` và 100 req lúc `01:01` -> lọt **200 req chỉ trong 2 giây**!"
    code: |
      INCR rl:login:203.0.113.9
      EXPIRE rl:login:203.0.113.9 60 NX
    codeLang: redis
  - num: 2
    title: "Sliding Window Log (Cửa sổ trượt ZSet)"
    badge: "Chính xác tuyệt đối"
    tone: emerald
    desc: "Lưu dấu thời gian mili-giây của từng request vào Sorted Set, trượt cửa sổ liên tục."
    bullets:
      - "Triệt tiêu hoàn toàn lỗ hổng vọt gấp đôi ở ranh giới phút."
      - "Tốn RAM theo số lượng request (`O(N)` phần tử/user) -> hợp cho hạn mức vừa phải (như `100 req/phút`)."
    code: |
      ZREMRANGEBYSCORE rl:api:u42 -inf 1699999940000
      ZADD rl:api:u42 1700000000000 "req-991"
      ZCARD rl:api:u42
      PEXPIRE rl:api:u42 60000
    codeLang: redis
  - num: 3
    title: "Token Bucket (Xô thẻ bài Lua)"
    badge: "Chuẩn API Gateway"
    tone: amber
    desc: "Xô chứa tối đa B thẻ bài, tự động châm thêm R thẻ mỗi giây; mỗi request rút đi 1 thẻ."
    bullets:
      - "Cho phép khách gửi dồn ngắn hạn hợp lệ (**Controlled Burst** tới dung tích `B`) mà vẫn giữ tốc độ trung bình `R req/s`."
      - "Chỉ tốn 2 trường nhỏ (`tokens`, `last_ms`), chạy nguyên tử trong `EVAL` Lua."
    code: |
      HSET bucket:u42 tokens 18 last_ms 1700000000000
    codeLang: redis
  - num: 4
    title: "Atomic Quota Guard (Hạn mức nguyên tử)"
    badge: "Chống bán lố Flash Sale"
    tone: rose
    desc: "Kiểm tra hạn mức còn lại và trừ ngay trong cùng 1 kịch bản Lua."
    bullets:
      - "Kiểm tra `tonumber(stock) >= qty` trước khi trừ giúp hạn mức không bao giờ nhấp nháy xuống số âm."
    code: |
      EVAL 'local s=tonumber(redis.call("GET",KEYS[1]) or "0")
      if s>=tonumber(ARGV[1]) then return redis.call("DECRBY",KEYS[1],ARGV[1]) end
      return -1' 1 stock:ps5 2
    codeLang: redis
```

## 3. Triển khai trong dự án thực tế: Kịch bản Lua & Hệ sinh thái Thư viện

Khi tích hợp Rate Limiter vào dự án thực tế, bạn có thể dùng kịch bản Lua gọn nhẹ bên dưới hoặc tận dụng các thư viện chuẩn đã kiểm chứng:
- **Python (`FastAPI` / `Flask` / `Django`):** **`slowapi`** / **`limits`** (cấu hình hậu thuẫn bởi `redis://` hỗ trợ cả Fixed Window, Moving Window), hoặc **`fastapi-limiter`**.
- **Node.js / TypeScript:** **`rate-limiter-flexible`** hoặc **`@upstash/ratelimit`**.
- **Go:** **`go-redis/redis_rate`** (cài đặt sẵn thuật toán GCRA / Token Bucket bằng Lua cực chuẩn).

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

> [!WARNING] Quy tắc bắt buộc khi gọi Lua trên Redis Cluster
> Mọi tên khóa phải truyền qua **`KEYS[1]`** (tuyệt đối không tự nối chuỗi tên khóa bên trong Lua) và giữ kịch bản chạy hoàn tất trong `< 1ms` để không làm nghẽn các kết nối khác!

> [!REMEMBER] Ghi nhớ cốt lõi từ R11
> 1. **Chiếm khóa phân tán:** Luôn gộp nguyên tử ==`SET <lockKey> <uniqueUuid> NX PX <leaseMs>`==.
> 2. **Nhả khóa phân tán:** Bắt buộc dùng ==Lua Compare-And-Delete== (`GET == myUuid` rồi mới `DEL`, hoặc dùng `r.lock()` của `redis-py` / `Redisson`) kèm **Fencing Token** khi cần bảo vệ tuyệt đối tầng Database.
> 3. **Chọn Rate Limiter:** Chặn dò mật khẩu đơn giản -> **Fixed Window**; chính xác tuyệt đối -> **Sliding Window ZSet**; cho phép dồn tải ngắn hạn chuẩn API Gateway -> **Lua Token Bucket**.

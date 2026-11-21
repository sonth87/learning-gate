# Sorted Sets (ZSet) & Đường cao tốc nhiều tầng Skip List O(log N)

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Hãy thử giải bài toán quen thuộc này bằng SQL truyền thống: một tựa game hoặc sàn thương mại điện tử có **5 triệu người tham gia đua Top**, mỗi giây có hàng nghìn người được cộng điểm mới và đồng thời hàng vạn người bấm xem **"Top 10 toàn server"** kèm **"Tôi đang đứng hạng mấy?"**. Trên PostgreSQL, câu lệnh `ORDER BY score DESC` kết hợp cập nhật liên tục sẽ làm nghẽn cứng cây chỉ mục chỉ trong vài phút!
>
> **Sorted Set (`ZSet` — Tập hợp có thứ tự theo điểm số)** chính là "vũ khí ngôi vương" giúp Redis giải bài toán trên trong **chưa tới `0.2 mili-giây`** nhờ ghép đôi 2 cấu trúc dữ liệu chạy song hành bên dưới cùng 1 khóa:
> - **Mỗi phần tử (`member`) là duy nhất** (như tên tài khoản `"player:chi"`), nhưng luôn gắn kèm một con số thực gọi là **điểm sắp xếp (`score`**, ví dụ `980` điểm hoặc mốc thời gian Unix Timestamp).
> - **Bảng băm (`Hash Table` nội bộ):** Giúp hỏi điểm của một người bất kỳ (`ZSCORE`) trả kết quả ngay lập tức ==`O(1)`==.
> - **Danh sách nhảy nhiều tầng (`Skip List`):** Hãy hình dung **hệ thống tàu điện ngầm có các tầng tàu tốc hành** — tầng thấp nhất đi qua từng ga lẻ, tầng 2 nhảy cóc mỗi 5 ga, tầng 3 nhảy mỗi 25 ga, tầng 4 nhảy mỗi 100 ga. Nhờ đi tàu tốc hành từ tầng cao xuống tầng thấp, Redis tìm vị trí chèn điểm hoặc đếm thứ hạng giữa **10 triệu người chơi** chỉ mất khoảng ~23 bước nhảy (==`O(log N)`==)!

```visual
kind: illustration
src: "/illustrations/redis/redis-skiplist-express.jpg"
diagram: "redis:r04"
alt: "Đoàn tàu cao tốc nhiều tầng (Skip List Express Lanes) nhảy vọt qua hàng vạn ga lẻ kết hợp bảng băm O(1) của Redis Sorted Set"
badge: "Ngôi vương cấu trúc dữ liệu · Sorted Set"
title: "Giải Phẫu Cấu Trúc Kép Của ZSet — Hash Table O(1) + Skip List O(log N)"
subtitle: "Vì sao Redis chọn Skip List kèm con trỏ span thay vì cây Đỏ-Đen (Red-Black Tree) của C++ std::map?"
caption: "Nhấn vào sơ đồ hoặc ảnh ẩn dụ tuyến tàu tốc hành để phóng to — theo dõi đường nhảy từ tầng cao tốc L3 xuống tầng cơ sở L0 và cách tính thứ hạng ZRANK"
callouts:
  - num: 1
    label: "Hash Table Nội Bộ (member -> score)"
    desc: "Giúp lệnh ZSCORE tra cứu điểm của bất kỳ người chơi nào trong đúng O(1) tức thì mà không cần dò trên cây hay danh sách."
    tone: cyan
  - num: 2
    label: "Skip List Nhiều Tầng Kèm Độ Dài Nhảy (span)"
    desc: "Tầng cao nhảy bước lớn như tàu tốc hành, tầng thấp dò chi tiết; nhờ lưu khoảng cách span trên mỗi cung nhảy, Redis tính thứ hạng ZRANK cũng trong O(log N)!"
    tone: amber
  - num: 3
    label: "Duyệt Dải Hai Chiều Mượt Mà (Range Scan)"
    desc: "Bắt được điểm đầu dải trong O(log N), sau đó chỉ việc trượt dọc liên kết tuyến tính L0 (hoặc lùi qua backward pointer cho REV) để lấy M phần tử với chi phí O(log N + M)."
    tone: emerald
```

## 1. Tại sao tác giả Redis chọn Skip List thay vì Cây nhị phân cân bằng (Red-Black Tree)?

> [!ANALOGY] Hình dung tuyến tàu điện tốc hành có ghi sẵn "số trạm vượt qua" (`span`)
> Nếu bạn đi tàu tốc hành tầng 3 nhảy một mạch từ Ga đầu đến Ga 800, trên vé tàu Redis có ghi sẵn con số **`span = 800`** (bước nhảy này đã bỏ qua đúng 800 người đứng trước). Khi đáp xuống đúng vị trí của người chơi `"Chi"`, Redis chỉ việc cộng nhẩm các con số `span` trên đường đi là biết ngay `"Chi"` đang đứng **Hạng #892** mà không cần đếm tay từ người số 1!

So với cây Đỏ-Đen (*Red-Black Tree*), **Skip List** trong Redis thắng áp đảo ở 3 điểm thực dụng:
1. **Cắt lát danh sách (`ZRANGE`) cực kỳ tự nhiên:** Khi đã đáp xuống nút bắt đầu trong `O(log N)`, việc lấy tiếp `10` người kế tiếp chỉ là đi thẳng một mạch trên đường ray tầng đáy (`L0`) với chi phí `O(log N + 10)`, không phải leo lên tụt xuống các nhánh cây phức tạp.
2. **Tính thứ hạng trực tiếp (`ZRANK` / `ZREVRANK`) trong `O(log N)`:** Nhờ trường đếm khoảng cách `span` gắn trên từng mũi tên nhảy.
3. **Tự động nén `listpack` cho ZSet nhỏ:** Khi ZSet có `<= 128` phần tử ngắn (`<= 64 bytes`), Redis vẫn gói gọn toàn bộ trong 1 mảng phẳng `listpack` siêu tiết kiệm RAM trước khi bật bộ đôi `Hash Table + Skip List`.

*(Quy tắc xử lý đồng điểm — **Tie-breaking**: Khi hai thành viên có **cùng điểm `score` bằng nhau**, ZSet tự động xếp theo thứ tự bảng chữ cái từ điển `A -> Z` của tên `member`!)*

## 2. Chuẩn hóa lệnh `ZRANGE` hợp nhất trên Redis 6.2 → Redis 8

Trước đây người học rất dễ rối vì có tới 6–7 câu lệnh đọc ZSet khác nhau (`ZREVRANGE`, `ZRANGEBYSCORE`...). Trên **Redis 8**, bạn chỉ cần nắm vững ==1 câu lệnh trung tâm `ZRANGE` kết hợp các cờ `REV` và `BYSCORE`== cực kỳ mạch lạc:

```visual
kind: anatomy
title: Bản Đồ Lệnh Sorted Set Thực Chiến Chuẩn Redis 8
subtitle: Ưu tiên cú pháp ZRANGE hợp nhất kèm cờ REV / BYSCORE / LIMIT rõ nghĩa
items:
  - keyword: ZADD [NX|XX|GT|LT|CH]
    role: O(log N) · Chèn & lọc điều kiện
    tone: emerald
    summary: Thêm hoặc cập nhật điểm — lưu ý **`score` luôn đứng TRƯỚC `member`** (`ZADD key score member`).
    bullets:
      - "**`GT` (*Greater Than*):** Chỉ cập nhật nếu điểm mới **cao hơn** kỷ lục cũ (bảo vệ High Score!)."
      - "**`LT` (*Less Than*):** Chỉ cập nhật nếu điểm mới **thấp hơn** (ví dụ kỷ lục chạy marathon ít giây nhất)."
      - "**`NX` / `XX`:** Chỉ thêm mới nếu chưa có / chỉ cập nhật nếu đã có · **`CH`:** Trả về tổng số phần tử bị thay đổi điểm."
    example: |
      ZADD lb:game GT 2500 "player:an"
      ZINCRBY lb:game 150 "player:binh"
    lang: redis
  - keyword: ZRANGE ... [REV] [BYSCORE]
    role: O(log N + M) · Lấy dải hợp nhất
    tone: sky
    summary: Đọc theo thứ hạng `0..9` (mặc định) hoặc lọc theo khoảng điểm (`BYSCORE`), đảo chiều từ cao xuống thấp bằng cờ `REV`.
    bullets:
      - "Thêm `WITHSCORES` để lấy kèm điểm; thêm `LIMIT offset count` khi dùng `BYSCORE` để phân trang."
      - "Dùng `-inf` / `+inf` cho âm/dương vô cực và dấu ngoặc đơn `(100` cho khoảng mở lớn hơn hẳn `100`."
    example: |
      ZRANGE lb:game 0 9 REV WITHSCORES
      ZRANGE jobs:due -inf 1700005000 BYSCORE LIMIT 0 20
    lang: redis
  - keyword: ZSCORE & ZREVRANK
    role: O(1) & O(log N) · Hồ sơ cá nhân
    tone: cyan
    summary: Đọc tức thì điểm số (`ZSCORE` — `O(1)`) và thứ hạng từ cao xuống thấp đếm từ `0` (`ZREVRANK` — `O(log N)`, hạng `0` là Top 1!).
    example: |
      ZSCORE lb:game "player:an"
      ZREVRANK lb:game "player:an"
    lang: redis
  - keyword: ZPOPMIN / ZREMRANGEBYSCORE
    role: O(log N * M) · Bốc việc & Dọn cửa sổ
    tone: amber
    summary: Lấy và xoá nguyên tử phần tử có điểm nhỏ nhất (`ZPOPMIN` — cực hợp bốc việc đến hạn sớm nhất!) hoặc xoá sạch các mục cũ ngoài khung thời gian (`ZREMRANGEBYSCORE`).
    example: |
      ZREMRANGEBYSCORE rl:u:42 -inf 1700000000
      ZPOPMIN jobs:delayed 1
    lang: redis
```

## 3. Ba bài toán kiến trúc kinh điển giải bằng ZSet (Python & TypeScript)

```visual
kind: groups
title: Ba Vũ Khí Kiến Trúc Từ Sorted Set Mọi Kỹ Sư Backend Đều Gặp [!badge:amber:System Design]
columns: 3
items:
  - num: 1
    title: Real-Time Leaderboard
    badge: Game / E-Commerce
    tone: emerald
    bullets:
      - "Cộng điểm trực tiếp bằng `ZINCRBY` (`O(log N)`)."
      - "Lấy Top 10 bằng `ZRANGE lb 0 9 REV WITHSCORES` và thứ hạng riêng của người dùng bằng `ZREVRANK lb user_id`."
  - num: 2
    title: Sliding Window Rate Limiter
    badge: API Gateway
    tone: sky
    bullets:
      - "Mỗi request lưu `score = timestamp_ms`, `member = req_uuid`."
      - "Xoá các request cũ hơn 60 giây trước bằng `ZREMRANGEBYSCORE`, sau đó đếm `ZCARD` xem đã vượt hạn mức chưa!"
  - num: 3
    title: Delayed Job Scheduler
    badge: Tác vụ hẹn giờ
    tone: cyan
    bullets:
      - "Hẹn gửi email sau 15 phút: ==đặt `score = now + 900`== (`ZADD delayed <due_ts> <job_id>`)."
      - "Các thư viện như `RQ Scheduler`, `ARQ`, `BullMQ` đều dùng chính mẫu ZSet này để kích hoạt job đúng giây!"
```

Hãy xem cách triển khai bộ giới hạn tốc độ **Cửa sổ trượt (*Sliding Window Rate Limiter* — tối đa 100 request / 60 giây)** gọn nhẹ trên cả **Python (`redis-py`)** và **Node.js (`ioredis`)**:

```python
# Python (redis-py): Kiểm tra Sliding Window Rate Limit trong 1 chuyến Pipeline
import time, uuid

def allow_request(r, user_id: str, limit: int = 100, window_ms: int = 60_000) -> bool:
    key = f"rl:sliding:{user_id}"
    now_ms = int(time.time() * 1000)
    pipe = r.pipeline()  # Gom các lệnh chạy tuần tự trong 1 chuyến mạng
    pipe.zremrangebyscore(key, "-inf", now_ms - window_ms)
    pipe.zadd(key, {f"{now_ms}:{uuid.uuid4().hex[:8]}": now_ms})
    pipe.zcard(key)
    pipe.expire(key, 65)
    _, _, current_count, _ = pipe.execute()
    return current_count <= limit
```

> [!WARNING] Coi chừng thứ tự đối số của `ZADD` và giới hạn làm tròn số thực 64-bit!
> - Trên Redis CLI thuần, **`ZADD key score member`** đặt điểm `score` **TRƯỚC** tên `member` (còn trong Python `redis-py` hàm `r.zadd(key, {member: score})` truyền qua `dict` nên tránh được nhầm lẫn!).
> - Điểm `score` trong ZSet là số thực dấu phẩy động chuẩn IEEE 754 `double` 64-bit: nó chỉ biểu diễn **chính xác tuyệt đối số nguyên tới ==`2^53` (`9,007,199,254,740,992` — 16 chữ số)==**. Tuyệt đối đừng nhét nguyên mã Snowflake ID 64-bit (`~10^18`, 19 chữ số) vào làm `score` kẻo bị làm tròn mất các chữ số hàng đơn vị!

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - **Cấu trúc kép ZSet:** `Hash Table` cho `ZSCORE` **`O(1)`** + `Skip List` cho `ZADD`, `ZINCRBY`, `ZRANK`/`ZREVRANK` **`O(log N)`** và `ZRANGE` **`O(log N + M)`**.
> - Ưu tiên cú pháp hợp nhất **`ZRANGE key start stop REV WITHSCORES`** trên Redis 8 và tận dụng cờ **`GT` / `LT` / `NX`** ngay trong `ZADD`.
> - Biến điểm `score` thành **Unix Timestamp** giúp ZSet hóa thân thành **Sliding Window Rate Limiter** và **Delayed Job Queue** chuẩn mực.

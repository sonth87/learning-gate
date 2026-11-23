# Sorted Sets (ZSet) và cấu trúc Skip List O(log N)

> [!NOTE] Khái niệm cốt lõi & Bài toán thực tế
> Với bài toán bảng xếp hạng có **5 triệu người chơi**, mỗi giây có hàng nghìn lượt cập nhật điểm và hàng vạn truy vấn xem **"Top 10"** kèm **"Thứ hạng hiện tại của một user"**, câu lệnh SQL `ORDER BY score DESC` trên PostgreSQL sẽ nhanh chóng nghẽn do chi phí ghi đĩa và cập nhật chỉ mục B-Tree liên tục.
>
> **Sorted Set (`ZSet` — Tập hợp có thứ tự theo điểm số)** giải quyết bài toán này trong **chưa tới `0.2 mili-giây`** bằng cách kết hợp 2 cấu trúc dữ liệu bên dưới cùng một khóa:
> - **Mỗi phần tử (`member`) là duy nhất**, luôn gắn kèm một số thực dấu phẩy động gọi là **điểm sắp xếp (`score`)** (ví dụ `980` điểm hoặc mốc thời gian Unix Timestamp).
> - **Bảng băm (`Hash Table` nội bộ):** Ánh xạ `member -> score` giúp tra cứu điểm của một thành viên bất kỳ (`ZSCORE`) đạt ==`O(1)`==.
> - **Danh sách nhảy nhiều tầng (`Skip List`):** Duy trì thứ tự các phần tử theo `score` bằng nhiều tầng con trỏ nhảy bước (tầng cao nhảy bước dài, tầng đáy nối tuần tự từng phần tử), giúp tìm kiếm, chèn mới hoặc tính thứ hạng giữa **10 triệu phần tử** chỉ mất ~23 bước so sánh (==`O(log N)`==).
>
> *Liên hệ trực quan:* Có thể hình dung Skip List giống như mạng lưới tàu điện có nhiều tuyến tốc hành ở tầng trên (nhảy qua nhiều ga cùng lúc) kết hợp tuyến dừng từng ga ở tầng đáy để tiếp cận đúng vị trí nhanh nhất.

```visual
kind: illustration
src: "/illustrations/redis/redis-skiplist-express.jpg"
diagram: "redis:r04"
alt: "Cấu trúc kép của Redis Sorted Set gồm bảng băm Hash Table O(1) và danh sách nhảy nhiều tầng Skip List O(log N)"
badge: "Cấu trúc dữ liệu · Sorted Set"
title: "Giải Phẫu Cấu Trúc Kép Của ZSet — Hash Table O(1) + Skip List O(log N)"
subtitle: "Vì sao Redis chọn Skip List kèm con trỏ span thay vì cây Đỏ-Đen (Red-Black Tree) của C++ std::map?"
caption: "Nhấn vào sơ đồ để phóng to — theo dõi đường tìm kiếm từ tầng cao L3 xuống tầng cơ sở L0 và cách tính thứ hạng ZRANK"
callouts:
  - num: 1
    label: "Hash Table Nội Bộ (member -> score)"
    desc: "Giúp lệnh ZSCORE tra cứu điểm của bất kỳ người chơi nào trong đúng O(1) tức thì mà không cần dò trên cây hay danh sách."
    tone: cyan
  - num: 2
    label: "Skip List Nhiều Tầng Kèm Độ Dài Nhảy (span)"
    desc: "Tầng cao nhảy bước lớn giúp bỏ qua hàng loạt phần tử, tầng thấp dò chi tiết; nhờ lưu khoảng cách span trên mỗi liên kết, Redis tính thứ hạng ZRANK cũng trong O(log N)!"
    tone: amber
  - num: 3
    label: "Duyệt Dải Hai Chiều Mượt Mà (Range Scan)"
    desc: "Bắt được điểm đầu dải trong O(log N), sau đó chỉ việc trượt dọc liên kết tuyến tính L0 (hoặc lùi qua backward pointer cho REV) để lấy M phần tử với chi phí O(log N + M)."
    tone: emerald
```

## 1. Tại sao tác giả Redis chọn Skip List thay vì Cây nhị phân cân bằng (Red-Black Tree)?

> [!NOTE] Cơ chế tính thứ hạng nhanh bằng trường `span` trên Skip List
> Trên mỗi liên kết nhảy tiến ở các tầng của Skip List, Redis lưu thêm một số nguyên **`span`** cho biết liên kết đó đã bỏ qua bao nhiêu nút ở tầng đáy (`L0`). Trong quá trình đi từ tầng cao xuống vị trí của phần tử `"Chi"`, Redis chỉ cần cộng dồn các giá trị `span` đã đi qua để trả về chính xác thứ hạng (ví dụ **Hạng #892**) trong `O(log N)` mà không phải đếm tuần tự từ đầu danh sách.

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
title: Ba Bài Toán Kiến Trúc Tiêu Biểu Giải Bằng Sorted Set [!badge:amber:System Design]
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

> [!REMEMBER] Ghi nhớ cốt lõi
> - **Cấu trúc kép ZSet:** `Hash Table` cho `ZSCORE` **`O(1)`** + `Skip List` cho `ZADD`, `ZINCRBY`, `ZRANK`/`ZREVRANK` **`O(log N)`** và `ZRANGE` **`O(log N + M)`**.
> - Ưu tiên cú pháp hợp nhất **`ZRANGE key start stop REV WITHSCORES`** trên Redis 8 và tận dụng cờ **`GT` / `LT` / `NX`** ngay trong `ZADD`.
> - Biến điểm `score` thành **Unix Timestamp** giúp ZSet hóa thân thành **Sliding Window Rate Limiter** và **Delayed Job Queue** chuẩn mực.

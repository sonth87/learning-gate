# Sorted Sets (ZSet) & Đường cao tốc nhiều tầng Skip List O(log N)

Nếu phải bầu chọn **1 cấu trúc dữ liệu "ăn tiền" nhất** khiến mọi kiến trúc sư Backend mê mẩn Redis, câu trả lời gần như chắc chắn là **Sorted Set (`ZSet`)**. Trong JavaScript hay Python chuẩn, bạn có `Map`/`Set` để tra cứu `O(1)` nhưng **không có thứ tự**, hoặc có mảng sắp xếp nhưng chèn vào giữa tốn `O(N)`.

**Redis ZSet** phá vỡ sự đánh đổi đó bằng cách **kết hợp 2 cấu trúc dữ liệu chạy song song bên dưới cùng 1 khoá**:

- [>] Mỗi phần tử (`member`) là **duy nhất** như Set, nhưng luôn đi kèm một điểm số thực 64-bit IEEE 754 (**`score`**) dùng để sắp xếp tự động từ nhỏ đến lớn.
- [+] Tra điểm của một cá nhân bất kỳ (`ZSCORE`) mất đúng ==`O(1)`== nhờ **Hash Table** nội bộ!
- [+] Cập nhật điểm (`ZADD`/`ZINCRBY`), tìm thứ hạng (`ZRANK`/`ZREVRANK`) hay cắt dải Top K / dải thời gian (`ZRANGE`) giữa **10 triệu phần tử** chỉ mất ==`O(log N)`== (~23 bước nhảy trên RAM!) nhờ cấu trúc **Skip List (Danh sách nhảy nhiều tầng)**.

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

## 1. Tại sao tác giả Redis chọn Skip List thay vì Red-Black Tree / AVL Tree?

> [!ANALOGY] Hình dung tuyến metro 4 tầng
> Nếu chỉ có 1 tuyến tàu điện dừng ở tất cả 1,000 nhà ga (Linked List thường), đi từ ga 1 đến ga 890 phải dừng 890 lần. **Skip List** xây thêm các tầng tàu tốc hành bên trên: tầng 4 chỉ dừng mỗi 100 ga, tầng 3 mỗi 25 ga, tầng 2 mỗi 5 ga. Muốn tới ga 890, bạn nhảy tàu tầng 4 tới ga 800, xuống tầng 3 tới 875, xuống tầng 2 tới 890 — tổng cộng chưa tới 15 bước nhảy!

So với cây nhị phân tự cân bằng (*Red-Black Tree*), **Skip List (`zskiplist` trong `t_zset.c`)** thắng áp đảo ở 3 điểm thực dụng:
1. **Truy vấn đoạn (`ZRANGE`, `ZRANGE ... BYSCORE`) cực kỳ tự nhiên:** Khi đã định vị nút bắt đầu ở `O(log N)`, việc lấy tiếp `M` phần tử kế bên chỉ là bước đi thẳng trên danh sách liên kết tầng đáy (`L0`), không cần leo lên tụt xuống các nhánh cha-con phức tạp.
2. **Đếm thứ hạng chính xác `ZRANK` trong `O(log N)`:** Mỗi mũi tên nhảy ở tầng cao của Redis lưu kèm con số **`span`** (bước nhảy này vượt qua bao nhiêu phần tử ở dưới). Cộng dồn `span` trên đường đi cho ra ngay vị trí xếp hạng thứ mấy giữa hàng triệu người!
3. **Nén tự động cho ZSet nhỏ:** Y hệt Hash, khi ZSet có `<= 128` phần tử (`zset-max-listpack-entries`) và chuỗi `<= 64 bytes`, Redis xếp gọn trong 1 **`listpack`** phẳng trước khi nâng cấp lên bộ đôi `dict + skiplist`.

*(Lưu ý tinh tế về đồng điểm — **Tie-breaking**: Khi hai thành viên có **cùng `score` bằng nhau**, ZSet tự động xếp thứ tự từ điển nhị phân `lexicographical` theo tên `member`!)*

## 2. Chuẩn hoá lệnh `ZRANGE` hợp nhất trên Redis 6.2 → Redis 8

Trước đây, người học phải nhớ một rừng lệnh rối rắm (`ZRANGE`, `ZREVRANGE`, `ZRANGEBYSCORE`, `ZREVRANGEBYSCORE`, `ZRANGEBYLEX`...). Trên **Redis 8**, chỉ cần **1 lệnh trung tâm `ZRANGE`** kết hợp các cờ trực quan:

```visual
kind: anatomy
title: Bản Đồ Lệnh Sorted Set Thực Chiến Chuẩn Redis 8
subtitle: Ưu tiên cú pháp ZRANGE hợp nhất kèm cờ REV / BYSCORE / LIMIT rõ nghĩa
items:
  - keyword: ZADD [NX|XX|GT|LT|CH]
    role: O(log N) · Chèn & lọc điều kiện
    tone: emerald
    summary: Thêm hoặc cập nhật điểm `score` đứng TRƯỚC tên `member` (`ZADD key score member`).
    bullets:
      - "**`GT` (*Greater Than*):** Chỉ cập nhật nếu điểm mới **cao hơn** điểm hiện tại (bảo vệ kỷ lục High Score!)."
      - "**`LT` (*Less Than*):** Chỉ cập nhật nếu điểm mới **thấp hơn** (kỷ lục thời gian hoàn thành nhanh nhất)."
      - "**`NX` / `XX`:** Chỉ thêm mới nếu chưa có / chỉ sửa nếu đã tồn tại · **`CH`:** Trả về tổng số phần tử thay đổi (thay vì chỉ đếm phần tử mới)."
    example: |
      ZADD lb:game GT 2500 "player:an"
      ZINCRBY lb:game 150 "player:binh"
    lang: redis
  - keyword: ZRANGE ... [REV] [BYSCORE]
    role: O(log N + M) · Lấy dải hợp nhất
    tone: sky
    summary: Một câu lệnh cân trọn đọc theo chỉ số thứ hạng (mặc định) hoặc đọc theo khoảng điểm (`BYSCORE`), đảo chiều cao xuống thấp bằng `REV`.
    bullets:
      - "Thêm `WITHSCORES` để lấy kèm điểm; thêm `LIMIT offset count` khi lọc `BYSCORE` để phân trang giống SQL."
      - "Dùng `-inf` / `+inf` cho vô cực và dấu ngoặc đơn `(100` cho khoảng mở `> 100`."
    example: |
      ZRANGE lb:game 0 9 REV WITHSCORES
      ZRANGE jobs:due -inf 1700005000 BYSCORE LIMIT 0 20
    lang: redis
  - keyword: ZSCORE & ZREVRANK
    role: O(1) & O(log N) · Hồ sơ cá nhân
    tone: cyan
    summary: Đọc tức thì điểm số (`ZSCORE` — `O(1)`) và thứ hạng từ cao xuống thấp tính từ `0` (`ZREVRANK` — `O(log N)`).
    example: |
      ZSCORE lb:game "player:an"
      ZREVRANK lb:game "player:an"
    lang: redis
  - keyword: ZPOPMIN / ZPOPMAX / ZREMRANGEBYSCORE
    role: O(log N * M) · Bốc việc & Dọn cửa sổ
    tone: amber
    summary: Lấy và xoá nguyên tử phần tử nhỏ nhất/lớn nhất (`ZPOPMIN`/`ZPOPMAX`) hoặc cắt bỏ toàn bộ mục ngoài cửa sổ thời gian (`ZREMRANGEBYSCORE`).
    example: |
      ZREMRANGEBYSCORE rl:u:42 -inf 1700000000
      ZPOPMIN jobs:delayed 1
    lang: redis
```

## 3. Ba bài toán kiến trúc kinh điển giải bằng ZSet chỉ trong vài dòng code

```visual
kind: groups
title: Ba Vũ Khí Kiến Trúc Từ Sorted Set Mọi Senior Backend Phải Biết [!badge:amber:System Design]
columns: 3
items:
  - num: 1
    title: Real-Time Leaderboard
    badge: Game / E-Commerce
    tone: emerald
    bullets:
      - "Cộng điểm trực tiếp bằng `ZINCRBY` (`O(log N)`)."
      - "Lấy Top 10 toàn server bằng `ZRANGE lb 0 9 REV WITHSCORES` + hạng của riêng tôi bằng `ZREVRANK lb me`."
  - num: 2
    title: Sliding Window Rate Limiter
    badge: API Gateway
    tone: sky
    bullets:
      - "Mỗi request lưu `score = nowMs`, `member = reqUuid`."
      - "Xoá các request cũ hơn 60s trước bằng `ZREMRANGEBYSCORE key -inf (nowMs - 60000)`, sau đó đếm `ZCARD key` xem đã vượt ngưỡng chưa!"
  - num: 3
    title: Delayed Job Scheduler
    badge: Tác vụ hẹn giờ
    tone: violet
    bullets:
      - "Đặt lịch gửi thông báo sau 15 phút: `ZADD delayed <now + 900s> <jobId>`."
      - "Worker quét các việc có `score <= now` hoặc gọi `ZPOPMIN` kiểm tra mốc thời gian để thực thi đúng hẹn."
```

```ts
// Ví dụ TypeScript (ioredis): Kiểm tra Sliding Window Rate Limit (tối đa 100 req / 60s)
async function checkSlidingWindow(userId: string, nowMs = Date.now()): Promise<boolean> {
  const key = `rl:sliding:${userId}`;
  const windowStart = nowMs - 60_000;
  await redis
    .multi()
    .zremrangebyscore(key, '-inf', windowStart)
    .zadd(key, nowMs, `${nowMs}-${Math.random().toString(36).slice(2, 8)}`)
    .zcard(key)
    .expire(key, 65)
    .exec();
  // Nếu kết quả ZCARD <= 100 -> cho phép đi tiếp!
  return true;
}
```

> [!TRAP] Coi chừng thứ tự đối số của `ZADD` vs `ZINCRBY` và giới hạn số thực 64-bit!
> - Trong **`ZADD key score member`** và **`ZINCRBY key increment member`**, con số điểm luôn đứng **TRƯỚC** tên thành viên (ngược với `HSET key field value`!).
> - Điểm `score` trong ZSet là số thực dấu phẩy động chuẩn IEEE 754 `double` 64-bit: nó biểu diễn chính xác số nguyên tới **`2^53` (`9,007,199,254,740,992` — 16 chữ số thập phân)**, giống hệt `Number.MAX_SAFE_INTEGER` trong JavaScript! Đừng nhét ID Snowflake 64-bit đầy đủ (`~10^18`) vào `score` kẻo bị làm tròn mất các chữ số cuối.

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - **Cấu trúc kép ZSet:** `Hash Table` cho `ZSCORE` **`O(1)`** + `Skip List` cho `ZADD`, `ZINCRBY`, `ZRANK`/`ZREVRANK` **`O(log N)`** và `ZRANGE` **`O(log N + M)`**.
> - Dùng **`ZRANGE key start stop REV WITHSCORES`** trên Redis 8 thay cho `ZREVRANGE` cũ; dùng cờ **`GT` / `LT` / `NX`** ngay trong `ZADD` để lọc điều kiện nguyên tử.
> - Điểm `score` bằng Unix Timestamp biến ZSet thành **Sliding Window Rate Limiter** và **Delayed Job Queue** cực kỳ thanh lịch.

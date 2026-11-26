# Thẻ đối chiếu mô hình DTS

> **Chỉ tham chiếu, không chép.** Tài liệu này tóm tắt cách Designed to Scale (DTS, tác giả Dilum Sanjaya, `designed-to-scale.vercel.app`) dùng mô hình hình ảnh để dạy 40 chủ đề. DTS không có giấy phép sử dụng lại. Mọi câu chữ dưới đây do dự án tự viết; không có đoạn giảng, câu callout hay dữ liệu scene nào của DTS được sao chép. Scene của `sdmastery` tự dựng bằng `StageScene` của repo. Chương trình và id bài: [`../02-curriculum.md`](../02-curriculum.md). Điều khoản nguồn: [`../01-sources-and-credits.md`](../01-sources-and-credits.md).

## 1. Cách đối chiếu

- Nguồn khảo sát: bản bundle tiếng Anh của DTS tại thời điểm 2026-11-26 (40 bài, 9 chương). Dữ liệu cấu trúc (id, level, số bước, loại thành phần, metric) được trích bằng script đọc file như dữ liệu văn bản, không chạy mã của site. Nội dung mỗi bước được đọc rồi viết lại ngắn gọn bằng lời của dự án.
- Việc trích loại thành phần dùng nhận dạng gần đúng (tên hàm dựng entity thay đổi theo bài); khi cần chắc chắn, mở lại bài DTS tương ứng. Bước có node hỏng hoặc quá tải được suy ra từ danh sách thay đổi của bước và cờ nhiệt, nên có thể sót.
- Số liệu xuất hiện trong "Trình tự bước" (ms, %, RPS) là giá trị DTS viết tay cho từng bước, ghi lại chỉ để hiểu độ lớn và trình tự. **Không đưa các số này vào bài**: số trong bài của sdmastery do engine tính hoặc do tác giả tự chọn làm tham số (`01-sources-and-credits.md` §2).
- Mỗi thẻ có mục "Nâng cấp của mình": phần dự án thêm so với DTS (mô phỏng theo tải và thời gian, tương tác, bài tập chấm điểm). Giá trị khác biệt của sdmastery nằm ở các mục này.

## 2. Ngữ pháp hình ảnh của DTS và ánh xạ sang repo

Quy mô: 40 bài, 445 bước (trung bình khoảng 11.1 bước/bài), 8 đến 15 phút/bài; level: beginner 17, intermediate 20, advanced 3. Mỗi bước có tiêu đề ngắn, chapter tag, vài đoạn giảng, callout (tùy chọn), danh sách thay đổi, bộ metric và một scene. Metric do tác giả đặt cố định cho từng bước (không do mô hình tính ra) — đây là chỗ khác biệt lớn nhất với engine của dự án.

### 2.1 Loại thành phần trong scene (entity)

| Loại DTS | Dùng để | Tương ứng ở repo (`src/components/scale-workbench/types.ts`) | Ghi chú cho sdmastery |
|---|---|---|---|
| block (glyph: server, balancer, globe, cache…) | Dịch vụ, LB, DNS, cache, gateway: khối có biểu tượng, nhãn, "pill" thẻ | `StageNode.shape = 'block'` (hoặc `box`, `gate`) + `icon: StageIconKind` | Chỉ `block` hiện có `loadPct`; M3 mở cho cả db/device/crowd |
| db | Cơ sở dữ liệu, kho lưu trữ | `shape = 'db'` hoặc `'cylinder'` | Cần overlay trạng thái (M3) |
| device | Điện thoại, laptop, người dùng đơn lẻ | `shape = 'device'` hoặc `'laptop'` |  |
| crowd (có số lượng, nhãn) | Nhiều người dùng gộp một khối | `shape = 'crowd'` | Số người dùng gắn với `LoadProfile` |
| queue (hàng đợi trước node) | Các ô xếp hàng chờ xử lý | Chưa có `shape` riêng | Đề xuất lớp "queue pile" vẽ sau lớp entity (M3, T3.3), độ dài lấy từ engine |
| panel (dòng chữ, hoặc biểu đồ bars/hockey) | Thẻ ghi chú, bảng số, biểu đồ nhỏ | `StageScene.noteCard` (`StageNoteCard`) hoặc `StageTelemetryItem` | Biểu đồ hockey dựng bằng sparkline tự vẽ của `SimTimeline` |
| zone (tấm nền có nhãn) | Nhóm theo data center, availability zone, tầng | `StageZoneSlab` (`scene.zones`) |  |
| ghost (khối mờ) | Chỗ đã bỏ hoặc sẽ thêm | `StageNode.dimmed = true` |  |
| ring (vòng băm) | Consistent hashing | Không có trong `isometric` | Dựng ở Data view (SVG 2D riêng), không ép vào isometric |

### 2.2 Đường nối và packet (flow)

| DTS | Ý nghĩa | Repo |
|---|---|---|
| Link nét liền (có hoặc không đầu mũi tên hai chiều) | Đường đi bình thường | `StageLink.style = 'solid'` |
| Link nét đứt | Đường tùy chọn hoặc bất đồng bộ | `style = 'dashed'` |
| Link tắt (off) | Đường không còn dùng ở bước này | `style = 'off'` |
| Link nhịp tim (beat) | Heartbeat giữa hai node | `style = 'heartbeat'` |
| Link bị cắt (cut) | Partition mạng | `style = 'cut'` |
| Tỉ lệ lỗi trên link (`fail`) | Một phần packet rơi | `style = 'danger'` + `PacketKind = 'error'`; engine tính tỉ lệ rơi thật |
| Flow kind: req / res | Yêu cầu và phản hồi | `PacketKind` `'request'` / `'response'` |
| Flow kind: write | Ghi dữ liệu | `PacketKind` `'mutation'` |
| Flow kind: slow, heavy, mine, poison, kill, empty, ping, push, msg | Biến thể theo ngữ cảnh bài (request chậm/nặng, thông điệp độc, polling rỗng, heartbeat, push, tin nhắn…) | Chưa có; đề xuất mở rộng `PacketKind` với `retry`, `timeout`, `dropped`, `event`, `heartbeat` theo BRIEF §2.5 và dùng màu theo loại |
| `rate` và `bounce` | Mật độ packet và quay đầu sớm (cache hit) | `StagePacket.speed/offset/reverse`; `'cache-hit'` quay đầu sớm; mật độ do engine (1 chấm = N req/s) |

### 2.3 Chapter tag, callout, metric, thay đổi

Chapter tag của bước (số bước trên 40 bài): `problem` 120, `technique` 106, `solution` 97, `recap` 40, `insight` 39, `setup` 23, `tradeoff` 20. Gợi ý ánh xạ sang `StepCategory` (đề xuất, cần chốt khi viết `sdLessonBuilder`):

| DTS chapter | `StepCategory` đề xuất | Ghi chú |
|---|---|---|
| setup | `SETUP` | Dựng bối cảnh |
| problem | `PROBLEM`; nếu là ca "Case: …" thì `PITFALL` | Tải tăng, node đỏ, lỗi lan |
| solution | `TECHNIQUE` | Biện pháp xử lý |
| technique | `MECHANISM` | Cơ chế hoạt động của một kỹ thuật |
| insight | `MECHANISM` + callout `key-idea` | Quan sát nâng nhận thức |
| tradeoff | `TECHNIQUE` + callout `compare` | Cái giá của một lựa chọn |
| recap | `RECAP` | Tóm tắt cuối bài |

Callout (số lần): `tip` 183, `insight` 112, `warn` 108, `next` 39. Ánh xạ `CalloutKind` của repo: `insight` → `key-idea`, `tip` → `good-to-know`, `warn` → `watch-out`, `next` → không cần callout (dùng điều hướng sang bài kế).

Danh sách thay đổi của bước dùng tiền tố `+` (thêm), `~` (đổi), `−` (bỏ): tương ứng `StepDiffItem.op` (`+`, `~`, `-`) / `whatChanged`. Metric cố định của DTS tương ứng `StageTelemetryItem` / `telemetry`; ở sdmastery các giá trị này do engine tính. Tag trên node có tông green, red, amber, violet, gray: tương ứng `StageNode.badge.tone` (`ok`, `bad`, `warn`, `default`); trạng thái hỏng (DOWN) tương ứng `StageNode.dead`.

### 2.4 Điều DTS có và không có, so với kế hoạch của dự án

- Có: sơ đồ động theo bước, đủ 9 chương từ nền tảng tới thiết kế hệ thống hoàn chỉnh; nhắc tới circuit breaker, bulkhead, jitter, idempotency, outbox, hot key, Little's Law, hockey stick, Raft/quorum, Bloom filter, read-your-writes, WebSocket.
- Không có: mô phỏng theo tải thật (metric viết tay), núm chỉnh tham số, tiêm lỗi do người học, quiz và bài tập chấm điểm; geohash/quadtree; vector clock và CRDT; multi-region sâu; chi phí.
- Hệ quả: dự án chỉ lấy "khái niệm nào dùng mô hình gì" và "trình tự bước sư phạm" làm tham chiếu; phần mô phỏng, tương tác, bài tập là giá trị riêng.

## 3. Chỉ mục 40 bài DTS

| # | Id DTS | Tiêu đề (DTS) | Chương | Level | Phút | Bước | Bài chính trong chương trình | Bài một phần |
|---|---|---|---|---|---|---|---|---|
| 1 | `request-lifecycle` | How a Request Travels | 01 Foundations | beginner | 10 | 10 | S1-06 | S1-01, S1-03 |
| 2 | `latency-throughput` | Latency & Throughput | 01 Foundations | beginner | 11 | 10 | S1-07 | S1-03, S1-04 |
| 3 | `napkin-math` | Napkin Math | 01 Foundations | beginner | 10 | 9 | S0-05 | — |
| 4 | `vertical-horizontal` | Vertical vs Horizontal Scaling | 02 Scaling | beginner | 11 | 11 | S4-01 | — |
| 5 | `load-balancing` | Load Balancing | 02 Scaling | beginner | 12 | 12 | S2-01 | — |
| 6 | `stateless` | Stateless Services | 02 Scaling | beginner | 10 | 10 | S2-06 | — |
| 7 | `caching` | Caching | 02 Scaling | beginner | 14 | 13 | S2-02 | S4-02 |
| 8 | `cdn` | Content Delivery | 02 Scaling | beginner | 10 | 10 | S4-03 | — |
| 9 | `sql-nosql` | SQL vs NoSQL | 03 Data & Storage | beginner | 11 | 10 | S2-07 | — |
| 10 | `indexes` | Indexes | 03 Data & Storage | beginner | 12 | 11 | S4-04 | — |
| 11 | `storage-engines` | Storage Engines | 03 Data & Storage | intermediate | 14 | 13 | S4-08 | — |
| 12 | `replication` | Replication | 03 Data & Storage | beginner | 12 | 11 | S2-08 | S2-03 |
| 13 | `sharding` | Sharding | 03 Data & Storage | intermediate | 11 | 9 | S2-09 | S2-03 |
| 14 | `consistent-hashing` | Consistent Hashing | 03 Data & Storage | intermediate | 10 | 10 | S2-10 | — |
| 15 | `unique-ids` | Unique IDs at Scale | 03 Data & Storage | intermediate | 13 | 12 | S3-05 | — |
| 16 | `cap` | CAP & Consistency | 03 Data & Storage | intermediate | 12 | 11 | S3-01 | S1-04, S3-02, S3-06, S6-03 |
| 17 | `consensus` | Consensus & Leader Election | 03 Data & Storage | advanced | 14 | 12 | S3-03 | — |
| 18 | `transactions` | Transactions & Isolation | 03 Data & Storage | intermediate | 14 | 13 | S3-07 | S3-04 |
| 19 | `files` | Files & Media | 03 Data & Storage | intermediate | 14 | 13 | S2-12 | — |
| 20 | `apis` | REST, RPC & GraphQL | 04 Communication | beginner | 11 | 10 | S1-08 | — |
| 21 | `queues` | Message Queues | 04 Communication | beginner | 12 | 11 | S2-04 | S1-02, S4-06 |
| 22 | `pubsub` | Pub/Sub & Events | 04 Communication | beginner | 10 | 10 | S2-11 | S1-02, S2-04, S4-06 |
| 23 | `realtime` | Real-time Updates | 04 Communication | beginner | 11 | 10 | S4-09 | — |
| 24 | `redundancy` | Redundancy & Failover | 05 Reliability | intermediate | 12 | 12 | S3-09 | — |
| 25 | `rate-limiting` | Rate Limiting | 05 Reliability | intermediate | 10 | 9 | S4-05 | S4-10 |
| 26 | `timeouts-retries` | Timeouts & Retries | 05 Reliability | intermediate | 11 | 11 | S4-11 | — |
| 27 | `observability` | Observability | 05 Reliability | intermediate | 11 | 9 | S4-07 | S6-06 |
| 28 | `microservices` | Monolith vs Microservices | 06 Architecture | intermediate | 14 | 12 | S5-01 | — |
| 29 | `service-discovery` | Service Discovery & Gateways | 06 Architecture | intermediate | 13 | 13 | S5-04 | — |
| 30 | `sagas` | Sagas & Distributed Transactions | 06 Architecture | advanced | 13 | 11 | S3-04 | — |
| 31 | `batch-stream` | Batch & Stream Processing | 06 Architecture | intermediate | 15 | 14 | S5-05 | — |
| 32 | `authentication` | Authentication | 07 Security | intermediate | 13 | 12 | S6-08 | — |
| 33 | `authorization` | Authorization | 07 Security | intermediate | 13 | 13 | S6-09 | — |
| 34 | `encryption` | Encryption & Secrets | 07 Security | intermediate | 13 | 12 | S6-10 | — |
| 35 | `testing` | Testing | 08 Shipping | beginner | 12 | 11 | S6-11 | — |
| 36 | `cicd` | CI/CD & Deployments | 08 Shipping | intermediate | 13 | 11 | S6-12 | — |
| 37 | `hld-lld` | HLD & LLD | 09 Whole Systems | beginner | 8 | 8 | S6-01 | S6-02 |
| 38 | `design-url-shortener` | Design a URL Shortener | 09 Whole Systems | intermediate | 14 | 12 | S5-02 | S1-05 |
| 39 | `design-news-feed` | Design a News Feed | 09 Whole Systems | intermediate | 14 | 12 | S5-03 | — |
| 40 | `design-chat` | Design a Chat System | 09 Whole Systems | advanced | 14 | 12 | S7-01 | S6-04 |

## 4. Thẻ từng bài (theo thứ tự chương)

### Chương 01 — Foundations

#### 1. `request-lifecycle` — How a Request Travels

- **Level / thời lượng:** beginner, 10 phút, 10 bước. Chương 01 Foundations.
- **Ý chính:** Tách một lần tải trang thành các chặng có thời gian cụ thể (DNS, kết nối, server, query, tải về) để thấy thời gian thực sự nằm ở đâu.
- **Metric theo dõi:** `dns`, `connect`, `request`, `download`, `total`.
- **Trình tự bước:**
  1. `problem` — Người dùng than trang chậm nhưng chưa biết chậm ở chặng nào.
  2. `technique` — Tra DNS để lấy địa chỉ, tốn khoảng 20 ms.
  3. `technique` — Mở kết nối: bắt tay cần vài round trip, khoảng 60 ms; kết quả DNS được cache.
  4. `technique` — Gửi request, cộng một round trip và vài chục ms xử lý ở server.
  5. `technique` — Server hỏi tiếp database, thêm chặng query.
  6. `solution` — Response quay về; trang sẵn sàng sau khoảng 155 ms.
  7. `technique` — Một trang kéo theo hàng chục request phụ; HTTP/2 dồn chúng lên một kết nối, tổng khoảng 275 ms.
  8. `problem` — Ca query chậm: một truy vấn gợi ý kéo thời gian DB từ 15 lên 400 ms.
  9. `problem` — Ca người dùng ở xa: RTT 200 ms nhân lên mọi chặng cần round trip.
  10. `recap` — Tổng kết bằng biểu đồ thời gian từng chặng.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device. Ghi chú: bước có node quá tải (heat): 8.
- **Điểm mô hình đáng học:** Thời gian cộng dồn theo chặng; số round trip quan trọng hơn băng thông; mỗi metric là một đoạn của waterfall.
- **Nâng cấp của mình:** Tracer bấm vào packet để mở waterfall (S1-06, S1-03); núm RTT và thời gian query; bài `estimate` cộng chặng; bài `timeline-read` chỉ ra chặng chiếm nhiều nhất.
- **Map sang bài:** chính S1-06; một phần S1-01, S1-03.

#### 2. `latency-throughput` — Latency & Throughput

- **Level / thời lượng:** beginner, 11 phút, 10 bước. Chương 01 Foundations.
- **Ý chính:** Latency (một request mất bao lâu) và throughput (hoàn thành bao nhiêu request mỗi giây) là hai câu hỏi khác nhau; server bận gần hết công suất thì latency tăng dựng đứng.
- **Metric theo dõi:** `p50`, `p99`, `throughput`, `util`.
- **Trình tự bước:**
  1. `setup` — Định nghĩa hai đại lượng bằng một client và một server.
  2. `problem` — Tải tăng 7 lần: throughput tăng theo, server bận 70%, bắt đầu có hàng đợi ngắn.
  3. `problem` — Tải tăng thêm một phần ba: server bận 96%, throughput gần chạm trần nhưng latency tăng khoảng 7 lần (đường hockey stick).
  4. `insight` — Trung bình che giấu đuôi chậm; giới thiệu p50 và p99, và xác suất một trang nhiều request gặp ít nhất một request chậm.
  5. `solution` — Thêm lõi CPU để hạ utilization: latency giảm dù throughput không đổi.
  6. `insight` — Khoảng cách địa lý đặt ra mức sàn cho latency (ví dụ chuyển server sang châu Âu thêm ~75 ms).
  7. `insight` — Little's Law: số request đang xử lý cùng lúc bằng throughput nhân latency.
  8. `problem` — Fan-out tới 100 server: trang phải đợi server chậm nhất nên đuôi p99 của từng server thành trải nghiệm bình thường.
  9. `tradeoff` — Batching đổi một chút latency lấy throughput lớn hơn nhiều.
  10. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), crowd, db, panel (thẻ chữ hoặc biểu đồ), queue (hàng đợi trước node). Ghi chú: bước có node quá tải (heat): 3, 8.
- **Điểm mô hình đáng học:** Hockey stick theo utilization; p99 thay cho trung bình; Little's Law; tail latency khi fan-out; trade-off của batching.
- **Nâng cấp của mình:** Chạy đúng đường cong này bằng engine (M/M/c) với núm tải; bài `predict` đoán p99 khi ρ tăng; `tune-to-limit` chọn mức utilization mục tiêu; kiểm Little's Law bằng test bất biến (S1-07).
- **Map sang bài:** chính S1-07; một phần S1-03, S1-04.

#### 3. `napkin-math` — Napkin Math

- **Level / thời lượng:** beginner, 10 phút, 9 bước. Chương 01 Foundations.
- **Ý chính:** Đổi một ý tưởng sản phẩm thành số máy chủ, dung lượng và băng thông bằng phép tính đủ gọn để làm tay.
- **Metric theo dõi:** `dau`, `avg`, `peak`, `servers`, `storage`.
- **Trình tự bước:**
  1. `problem` — Đặt câu hỏi: một server có đủ không?
  2. `technique` — Từ số người dùng hằng ngày suy ra RPS trung bình.
  3. `insight` — Thiết kế cho đỉnh (khoảng 3 lần trung bình) chứ không cho trung bình.
  4. `solution` — Chia đỉnh cho công suất mỗi server, chừa headroom để ra số server.
  5. `technique` — Ước lượng dung lượng dữ liệu theo ngày, năm và hệ số sao chép.
  6. `technique` — Ước lượng băng thông ra ngoài và vai trò của CDN.
  7. `technique` — Ước lượng phần dữ liệu nóng có thể nằm trong RAM làm cache.
  8. `insight` — Danh sách các con số nên nhớ.
  9. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), crowd, zone.
- **Điểm mô hình đáng học:** Chuỗi suy luận DAU → RPS → peak → số server → storage → băng thông → RAM; làm tròn có chủ ý.
- **Nâng cấp của mình:** Estimator tương tác (S0-05) với nút đưa kết quả vào mô phỏng; bài `estimate` chấm sai số ±30%; đề bài dùng chính brief của S0-07.
- **Map sang bài:** chính S0-05.

### Chương 02 — Scaling

#### 4. `vertical-horizontal` — Vertical vs Horizontal Scaling

- **Level / thời lượng:** beginner, 11 phút, 11 bước. Chương 02 Scaling.
- **Ý chính:** Khi một server quá tải có hai hướng: mua máy to hơn (scale up) hoặc thêm máy (scale out); mỗi hướng có trần, chi phí và điểm hỏng riêng.
- **Metric theo dõi:** `users`, `rps`, `p95`, `errors`, `cost`.
- **Trình tự bước:**
  1. `setup` — Khởi đầu với một server, ít người dùng.
  2. `problem` — Người dùng tăng đột biến, CPU 100% và request bắt đầu timeout.
  3. `solution` — Scale up: máy nhiều vCPU hơn, CPU xuống 30%, chi phí tăng.
  4. `tradeoff` — Đụng trần: máy lớn nhất vẫn không đủ và giá tăng nhanh hơn công suất.
  5. `problem` — Một máy duy nhất là điểm hỏng đơn; khi nó chết, lỗi lên 100%.
  6. `solution` — Scale out: nhiều máy vừa; công suất tăng, chi phí cũng tăng.
  7. `problem` — Ban đêm tải thấp nhưng tài nguyên vẫn chạy cả ngày.
  8. `solution` — Autoscaling bám theo nhu cầu, giảm chi phí trung bình.
  9. `problem` — Ca flash sale: máy mới cần vài phút khởi động nên vẫn có lỗi.
  10. `problem` — Câu hỏi mới: ai chia người dùng cho các máy (dẫn sang load balancing).
  11. `recap` — Tóm tắt up và out.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), crowd, ghost (khối mờ). Ghi chú: bước có thành phần ngừng hoạt động: 5, 10.
- **Điểm mô hình đáng học:** Cặp trần-và-SPOF của scale up; chi phí theo giờ; độ trễ khởi động của autoscaling; chi phí là một metric ngang với p95.
- **Nâng cấp của mình:** Hiển thị cost view theo giờ; autoscaling theo profile diurnal; ca flash sale với cold start; bài `tune-to-limit` (tối thiểu chi phí đạt SLO); ca "thêm app vô ích khi DB nghẽn" (Amdahl) ở S4-01.
- **Map sang bài:** chính S4-01.

#### 5. `load-balancing` — Load Balancing

- **Level / thời lượng:** beginner, 12 phút, 12 bước. Chương 02 Scaling.
- **Ý chính:** Một địa chỉ chung cho nhiều server, kèm các quy tắc chia request, kiểm tra sức khỏe và dự phòng cho chính bộ cân bằng.
- **Metric theo dõi:** `users`, `rps`, `p95`, `errors`, `healthy`.
- **Trình tự bước:**
  1. `problem` — Ba server nhưng người dùng chỉ biết một địa chỉ, tải dồn vào một máy.
  2. `solution` — Đặt load balancer phía trước, tải chia đều khoảng 35% mỗi máy.
  3. `technique` — Round robin: lần lượt từng máy.
  4. `problem` — Request không đồng đều: một máy gặp nhiều request nặng và bão hòa.
  5. `technique` — Least connections: chuyển request tới máy ít việc nhất, hạ độ trễ.
  6. `technique` — Health check loại máy hỏng khỏi pool.
  7. `problem` — Chính load balancer là điểm hỏng đơn.
  8. `solution` — Thêm bản dự phòng (standby) với heartbeat giữa hai máy.
  9. `solution` — Failover trong vài giây: standby nhận địa chỉ ảo (VIP).
  10. `technique` — Định tuyến theo nội dung request (ví dụ theo URL path).
  11. `technique` — Triển khai không downtime: rút máy khỏi pool, cập nhật, thêm lại.
  12. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), crowd. Ghi chú: bước có thành phần ngừng hoạt động: 6, 7, 9.
- **Điểm mô hình đáng học:** Thuật toán chia tải phụ thuộc đặc tính request; health check; cặp active/standby với heartbeat; draining.
- **Nâng cấp của mình:** Đổi thuật toán khi đang chạy và xem p95; tiêm lỗi vào server và vào LB; bài `spot-bottleneck` tìm SPOF; `fix-challenge` với ngân sách số máy.
- **Map sang bài:** chính S2-01.

#### 6. `stateless` — Stateless Services

- **Level / thời lượng:** beginner, 10 phút, 10 bước. Chương 02 Scaling.
- **Ý chính:** Request kế tiếp phải chạy được trên bất kỳ server nào; muốn vậy trạng thái (session, file) phải nằm ngoài server ứng dụng.
- **Metric theo dõi:** `ok`, `survive`, `scale`, `extra`.
- **Trình tự bước:**
  1. `setup` — Người dùng đăng nhập vào một server.
  2. `problem` — Request sau rơi vào server khác và bị yêu cầu đăng nhập lại.
  3. `solution` — Cách 1: sticky session, luôn dẫn một người về một server.
  4. `problem` — Khi server đó chết, session và giỏ hàng mất theo.
  5. `solution` — Cách 2: đưa session ra kho riêng, mọi server đọc chung.
  6. `insight` — Mất server không còn là sự cố đối với người dùng.
  7. `technique` — Cách 3: để request mang token đã ký, bỏ được cả kho session.
  8. `problem` — Ca file lưu trên đĩa cục bộ: server khác không thấy file.
  9. `solution` — Đưa file lên object storage dùng chung.
  10. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db. Ghi chú: bước có thành phần ngừng hoạt động: 4, 6.
- **Điểm mô hình đáng học:** Server không giữ state thì thay thế được tự do; ba chỗ để state (store ngoài, token, object storage).
- **Nâng cấp của mình:** Sticky session so với session store trong cùng một sim; tiêm lỗi vào server A; bài `predict` ai mất giỏ hàng; thêm lựa chọn token và so chi phí (hop thêm, thu hồi token).
- **Map sang bài:** chính S2-06.

#### 7. `caching` — Caching

- **Level / thời lượng:** beginner, 14 phút, 13 bước. Chương 02 Scaling.
- **Ý chính:** Giữ các câu trả lời được hỏi nhiều ở nơi nhanh hơn database; lợi ích do hit ratio quyết định, rủi ro là dữ liệu cũ và hàng loạt miss cùng lúc.
- **Metric theo dõi:** `p95`, `hitRate`, `dbLoad`, `fresh`.
- **Trình tự bước:**
  1. `problem` — Mọi trang đều chạm database, CPU DB rất cao.
  2. `insight` — Quan sát: một số ít mục chiếm phần lớn lượt truy cập.
  3. `solution` — Đặt cache phía trước; khoảng 80% lượt đọc không tới DB.
  4. `technique` — Hit ratio là yếu tố chính: nâng từ 80% lên 95% hạ tải DB rất nhiều.
  5. `problem` — Dữ liệu đổi nhưng cache còn bản cũ.
  6. `solution` — Xóa bản cache khi ghi và đặt TTL.
  7. `tradeoff` — Bộ nhớ đầy: loại bỏ phần ít dùng gần đây nhất (LRU).
  8. `problem` — Ca cache stampede: khóa nóng hết hạn, hàng nghìn miss đồng thời đẩy DB lên 100%.
  9. `solution` — Chỉ một request nạp lại, làm mới sớm và TTL có độ lệch ngẫu nhiên.
  10. `problem` — Ca truy vấn id không tồn tại làm một nửa lượt đọc luôn miss.
  11. `solution` — Cache cả kết quả "không có" và dùng Bloom filter.
  12. `insight` — Cache có ở nhiều lớp, từ trình duyệt tới DB.
  13. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có node quá tải (heat): 1, 2, 8, 10.
- **Điểm mô hình đáng học:** λ vào DB bằng λ × (1 − hit ratio); stampede và penetration là hai kiểu hỏng khác nhau; TTL, invalidation, eviction là ba núm.
- **Nâng cấp của mình:** Hit ratio nóng dần sau restart (warm-up); `tune-to-limit` chỉnh TTL và kích thước cache; stampede có thể bật/tắt jitter và singleflight; so cache-aside với write-through (S4-02).
- **Map sang bài:** chính S2-02; một phần S4-02.

#### 8. `cdn` — Content Delivery

- **Level / thời lượng:** beginner, 10 phút, 10 bước. Chương 02 Scaling.
- **Ý chính:** Sao chép nội dung dùng chung ra các máy gần người dùng để giảm latency theo khoảng cách và giảm tải cho origin.
- **Metric theo dõi:** `lon`, `syd`, `origin`, `hitRate`.
- **Trình tự bước:**
  1. `problem` — Người dùng ở xa origin nên mọi round trip đều dài.
  2. `insight` — Phần lớn byte giống nhau cho mọi người dùng.
  3. `solution` — Đặt edge server gần người dùng; 90% request được trả ngay tại edge.
  4. `technique` — Lần đầu edge nguội nên vẫn phải hỏi origin.
  5. `problem` — Cập nhật logo nhưng edge còn bản cũ.
  6. `solution` — Đặt tên file theo phiên bản (hash) để mọi phiên bản là một URL mới và cache được lâu.
  7. `insight` — Đột biến lưu lượng hứng ở edge, origin gần như không đổi.
  8. `problem` — Ca trang cá nhân tuyệt đối không cache dùng chung (Cache-Control: private).
  9. `technique` — Thêm tầng origin shield để origin chỉ bị hỏi một lần mỗi file.
  10. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), panel (thẻ chữ hoặc biểu đồ).
- **Điểm mô hình đáng học:** Cache theo địa lý; tên file có phiên bản thay cho purge; phân biệt nội dung công khai và cá nhân; tầng shield.
- **Nâng cấp của mình:** Hai người dùng ở hai vùng với RTT khác nhau; edge nguội/ấm trên timeline; spike ×20 và so tải origin; bài `predict` hit ratio theo loại nội dung.
- **Map sang bài:** chính S4-03.

### Chương 03 — Data & Storage

#### 9. `sql-nosql` — SQL vs NoSQL

- **Level / thời lượng:** beginner, 11 phút, 10 bước. Chương 03 Data & Storage.
- **Ý chính:** Bảng, tài liệu hay khóa-giá trị: mỗi loại store giỏi một việc và phải nhường một việc; hệ thống thật thường dùng nhiều loại.
- **Metric theo dõi:** `joins`, `tx`, `schema`, `scaleOut`.
- **Trình tự bước:**
  1. `setup` — Dữ liệu trong bảng quan hệ.
  2. `technique` — Giao dịch: nhiều thao tác thành công hoặc thất bại cùng nhau.
  3. `problem` — Khi catalog lớn dần, bảng có hàng trăm cột phần lớn trống.
  4. `solution` — Document store cho catalog, mỗi bản ghi có hình dạng riêng.
  5. `technique` — Key-value cho session, chỉ tra theo khóa.
  6. `tradeoff` — Những gì NoSQL phải nhường (join, giao dịch rộng, ràng buộc).
  7. `solution` — Dùng mỗi loại ở nơi nó hợp.
  8. `problem` — Ca tìm kiếm "giày chạy bộ đỏ": thêm search engine đồng bộ từ DB qua change stream.
  9. `insight` — Các loại store chuyên dụng khác.
  10. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), crowd, db. Ghi chú: bước có node quá tải (heat): 3.
- **Điểm mô hình đáng học:** Chọn store theo mô hình truy cập; polyglot persistence; change stream để đồng bộ sang search.
- **Nâng cấp của mình:** Cùng một dữ liệu hiển thị ở ba mô hình (memory-2d); bài `design-constraint` chọn store theo yêu cầu; không cần sim tải.
- **Map sang bài:** chính S2-07.

#### 10. `indexes` — Indexes

- **Level / thời lượng:** beginner, 12 phút, 11 bước. Chương 03 Data & Storage.
- **Ý chính:** Cùng một truy vấn có thể mất hai giây hoặc hai mili giây tùy có chỉ mục phù hợp hay không; chỉ mục có giá phải trả ở thao tác ghi.
- **Metric theo dõi:** `p95`, `rows`, `writeCost`, `indexes`.
- **Trình tự bước:**
  1. `problem` — Tìm một người dùng theo email mất hai giây vì phải quét cả bảng.
  2. `insight` — Hình dung bằng danh bạ điện thoại sắp xếp theo tên.
  3. `solution` — Thêm chỉ mục B-tree: số hàng đọc từ 50 triệu xuống 1.
  4. `technique` — Vì sao B-tree luôn thấp (ít tầng) dù dữ liệu lớn.
  5. `tradeoff` — Mỗi chỉ mục làm thao tác ghi tốn thêm.
  6. `technique` — Chỉ mục nhiều cột: thứ tự cột quyết định truy vấn nào dùng được.
  7. `problem` — Ca truy vấn mà chỉ mục không giúp được (ký tự đại diện đứng đầu).
  8. `problem` — Ca chỉ mục không ai dùng vì điều kiện chọn quá nhiều hàng, chỉ tốn ghi.
  9. `technique` — Dùng EXPLAIN để xem kế hoạch và bỏ chỉ mục thừa.
  10. `technique` — Covering index: đủ cột ngay trong chỉ mục, khỏi đọc bảng.
  11. `recap` — Tóm tắt.
- **Thành phần scene dùng:** panel (thẻ chữ hoặc biểu đồ).
- **Điểm mô hình đáng học:** Rows read là metric trung tâm; chi phí ghi của chỉ mục; thứ tự cột; EXPLAIN.
- **Nâng cấp của mình:** Hiển thị B-tree bằng memory-2d, tìm kiếm từng bước; sim có số hàng đọc và ghi/insert; `fix-challenge` chọn bộ chỉ mục tối thiểu cho tập truy vấn cho trước.
- **Map sang bài:** chính S4-04.

#### 11. `storage-engines` — Storage Engines

- **Level / thời lượng:** intermediate, 14 phút, 13 bước. Chương 03 Data & Storage.
- **Ý chính:** Điều database thật sự làm với một lần ghi: ghi nhật ký trước, rồi mới cập nhật dữ liệu; và vì sao có engine tối ưu cho đọc, có engine tối ưu cho ghi.
- **Metric theo dõi:** `crashSafe`, `wps`, `diskPattern`, `lookupCost`.
- **Trình tự bước:**
  1. `setup` — Bộ nhớ nhanh nhưng mất khi tắt; đĩa bền nhưng chậm.
  2. `problem` — Trả lời "đã lưu" khi mới ghi vào bộ nhớ thì mất dữ liệu khi mất điện và có trang ghi dở.
  3. `solution` — Write-ahead log: ghi nhật ký rồi fsync trước, sau mới sao dữ liệu ra trang.
  4. `tradeoff` — Mức chắc chắn của "đã lưu": group commit gộp nhiều giao dịch vào một fsync.
  5. `technique` — Checkpoint cắt ngắn nhật ký để khôi phục sau crash nhanh.
  6. `insight` — Engine cổ điển: trang và B-tree, cập nhật tại chỗ.
  7. `problem` — Ca ghi cực nhiều và rải rác làm checkpoint không theo kịp.
  8. `solution` — LSM-tree: không cập nhật tại chỗ; ghi vào memtable rồi xả thành file sắp xếp.
  9. `problem` — Đọc phải xem nhiều file; Bloom filter và chỉ mục nhỏ mỗi file giúp.
  10. `technique` — Compaction gộp file ở nền, bỏ giá trị cũ và dấu xóa.
  11. `tradeoff` — So B-tree với LSM.
  12. `insight` — Ca lưu theo cột cho truy vấn phân tích.
  13. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), panel (thẻ chữ hoặc biểu đồ), zone. Ghi chú: bước có node quá tải (heat): 2, 7.
- **Điểm mô hình đáng học:** WAL đảm bảo độ bền; ghi tuần tự so với ghi ngẫu nhiên; read/write/space amplification; row so với column.
- **Nâng cấp của mình:** memory-2d minh họa memtable, SSTable, compaction; sim có đỉnh latency khi compaction; `predict` engine nào thắng ở tải ghi cao hay đọc cao; `order` các bước khôi phục sau crash.
- **Map sang bài:** chính S4-08.

#### 12. `replication` — Replication

- **Level / thời lượng:** beginner, 12 phút, 11 bước. Chương 03 Data & Storage.
- **Ý chính:** Giữ nhiều bản sao của database trên nhiều máy để tăng khả năng đọc và để sống sót khi máy hỏng; cái giá là bản sao có thể chậm hơn bản gốc.
- **Metric theo dõi:** `dbLoad`, `reads`, `lag`, `writes`.
- **Trình tự bước:**
  1. `problem` — Một database gánh hết đọc và ghi.
  2. `solution` — Thêm follower nhận luồng sao chép từ leader.
  3. `solution` — Chuyển đọc sang follower, CPU leader giảm mạnh.
  4. `problem` — Follower chậm hơn leader nên người dùng thấy dữ liệu cũ.
  5. `technique` — Đọc bản của chính mình: tạm định tuyến về leader sau khi ghi.
  6. `problem` — Leader hỏng, ghi bị lỗi.
  7. `solution` — Failover: nâng một follower lên làm leader, thêm follower mới.
  8. `problem` — Ca báo cáo 20 phút làm chậm ứng dụng; tách replica riêng cho phân tích.
  9. `problem` — Ca migration xóa nhầm dữ liệu lan sang mọi replica; cần snapshot và nhật ký lưu trữ.
  10. `insight` — Ba cách sao chép (đồng bộ, bán đồng bộ, bất đồng bộ).
  11. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có thành phần ngừng hoạt động: 6; bước có node quá tải (heat): 1, 2, 8.
- **Điểm mô hình đáng học:** Replication lag là đại lượng liên tục; read-your-writes; sao chép không thay cho backup; đồng bộ so với bất đồng bộ.
- **Nâng cấp của mình:** Hai làn thời gian leader/follower trên Time view; lag theo tải ghi; `timeline-read` chỉ ra lần đọc nào stale; `postmortem` cho ca xóa cột.
- **Map sang bài:** chính S2-08; một phần S2-03.

#### 13. `sharding` — Sharding

- **Level / thời lượng:** intermediate, 11 phút, 9 bước. Chương 03 Data & Storage.
- **Ý chính:** Khi dữ liệu hoặc lượng ghi vượt khả năng một máy, chia chúng ra nhiều máy theo khóa; chọn khóa sai tạo hot spot.
- **Metric theo dõi:** `shards`, `perShard`, `hottest`, `size`.
- **Trình tự bước:**
  1. `problem` — Dữ liệu quá lớn cho một máy.
  2. `solution` — Chia theo khoảng id vào 4 shard; mỗi shard nhận một phần tải.
  3. `problem` — Theo khoảng tạo hot spot: người dùng mới dồn vào một shard.
  4. `solution` — Băm khóa rồi chia: tải đều.
  5. `problem` — Ca người nổi tiếng làm một shard nhận 70% lưu lượng.
  6. `solution` — Giải pháp: cache cho đọc nóng, tách một khóa thành nhiều khóa con.
  7. `tradeoff` — Truy vấn cắt ngang mọi shard phải đợi shard chậm nhất.
  8. `problem` — Thêm shard với phép chia dư làm gần như mọi hàng phải chuyển.
  9. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có node quá tải (heat): 1, 3, 5.
- **Điểm mô hình đáng học:** Shard key là quyết định khó đảo ngược; range so với hash; hot key; truy vấn scatter-gather; chi phí resharding.
- **Nâng cấp của mình:** Heatmap theo shard; phân phối Zipf để tạo hot key; `spot-bottleneck` chỉ shard nóng; `tune-to-limit` chọn số shard và chiến lược; nối với consistent hashing ở bài kế.
- **Map sang bài:** chính S2-09; một phần S2-03.

#### 14. `consistent-hashing` — Consistent Hashing

- **Level / thời lượng:** intermediate, 10 phút, 10 bước. Chương 03 Data & Storage.
- **Ý chính:** Thêm hoặc bớt máy chỉ dời một phần nhỏ dữ liệu, nhờ đặt cả máy và khóa lên cùng một vòng băm.
- **Metric theo dõi:** `nodes`, `moved`, `maxShare`.
- **Trình tự bước:**
  1. `problem` — Băm rồi chia dư làm gần như mọi khóa đổi chỗ khi số máy đổi.
  2. `technique` — Uốn không gian băm thành vòng; mỗi máy chiếm một điểm.
  3. `technique` — Mỗi khóa thuộc về máy gặp đầu tiên theo chiều kim đồng hồ.
  4. `solution` — Thêm một máy: chỉ cung trước nó đổi chủ.
  5. `technique` — Bớt một máy: khóa của nó chuyển sang máy kế tiếp.
  6. `problem` — Vị trí ngẫu nhiên khiến một số cung dài, tải lệch.
  7. `solution` — Virtual node: mỗi máy chiếm nhiều điểm để chia đều hơn.
  8. `technique` — Sao chép mỗi khóa lên vài máy kế tiếp để chịu được một máy hỏng.
  9. `insight` — Ca mở rộng cụm cache: tỉ lệ miss sau thay đổi giảm từ 80% xuống 20%.
  10. `recap` — Tóm tắt.
- **Thành phần scene dùng:** db, panel (thẻ chữ hoặc biểu đồ), ring (vòng băm). Ghi chú: bước có node quá tải (heat): 6.
- **Điểm mô hình đáng học:** Chỉ khoảng 1/N khóa dời; vnode cân bằng; vòng là cấu trúc dữ liệu (không phải sơ đồ khối).
- **Nâng cấp của mình:** Hash ring tương tác ở Data view; so mod N với ring bằng đếm khóa dời; cache cluster miss spike làm DB quá tải; test bất biến "dời khoảng 1/N khóa".
- **Map sang bài:** chính S2-10.

#### 15. `unique-ids` — Unique IDs at Scale

- **Level / thời lượng:** intermediate, 13 phút, 12 bước. Chương 03 Data & Storage.
- **Ý chính:** Đặt tên duy nhất cho mỗi bản ghi mà không bắt mọi máy xếp hàng chờ một bộ đếm.
- **Metric theo dõi:** `collide`, `idSize`, `sortable`, `idDep`.
- **Trình tự bước:**
  1. `setup` — Mỗi hàng cần một định danh.
  2. `problem` — Hai shard có bộ đếm riêng nên sinh trùng id.
  3. `solution` — Cách 1: một bộ đếm chung (ticket server) nhưng thành điểm hỏng đơn.
  4. `technique` — Xin id theo lô để giảm số round trip, đổi lại mất thứ tự thời gian chặt.
  5. `solution` — Cách 2: mỗi máy tự sinh số ngẫu nhiên 128 bit, không cần phối hợp.
  6. `problem` — Ca id ngẫu nhiên làm chỉ mục khóa chính bị chèn rải rác.
  7. `solution` — Đặt thời gian ở phần đầu id (UUID v7) để chèn tuần tự lại.
  8. `solution` — Cách 3: Snowflake 64 bit gồm thời gian, mã máy, số thứ tự.
  9. `problem` — Ca đồng hồ lùi: máy sinh id phải chờ để không trùng.
  10. `tradeoff` — Ca id làm lộ thông tin (đếm được số đơn): dùng id công khai ngẫu nhiên, khóa nội bộ có thứ tự.
  11. `tradeoff` — Chọn loại id theo công việc.
  12. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có node quá tải (heat): 9.
- **Điểm mô hình đáng học:** Duy nhất so với sắp xếp được so với không đoán được; phối hợp tập trung so với tự sinh; phụ thuộc vào đồng hồ.
- **Nâng cấp của mình:** Bố cục bit của Snowflake ở memory-2d; hai shard với counter riêng sinh trùng; đồng hồ lùi làm máy phát tạm dừng; `estimate` số id trên mili giây mỗi máy.
- **Map sang bài:** chính S3-05.

#### 16. `cap` — CAP & Consistency

- **Level / thời lượng:** intermediate, 12 phút, 11 bước. Chương 03 Data & Storage.
- **Ý chính:** Khi mạng bị chia cắt, các bản sao dữ liệu buộc phải chọn giữa đúng (consistent) và truy cập được (available); phần còn lại là một phổ trade-off.
- **Metric theo dõi:** `consistent`, `available`, `errors`, `conflicts`.
- **Trình tự bước:**
  1. `setup` — Hai vùng có hai bản sao dữ liệu.
  2. `problem` — Mạng giữa hai vùng bị đứt.
  3. `technique` — Lựa chọn 1: giữ nhất quán, một phía từ chối phục vụ và người dùng thấy lỗi.
  4. `technique` — Lựa chọn 2: giữ khả dụng, cả hai phía nhận ghi và cùng một ghế bị bán hai lần.
  5. `technique` — Khi mạng nối lại, hai bên trao đổi các ghi bị lỡ và giải quyết xung đột.
  6. `problem` — Ca "bản ghi mới nhất" tính theo đồng hồ nào: đồng hồ lệch làm giữ nhầm bản cũ.
  7. `insight` — CAP thật sự nói gì và không nói gì.
  8. `technique` — Quorum (N, W, R) để chỉnh trade-off.
  9. `technique` — Ca thanh toán và ca lượt thích dùng mức khác nhau.
  10. `insight` — Nhất quán là một phổ nhiều mức.
  11. `recap` — Tóm tắt.
- **Thành phần scene dùng:** db, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có thành phần ngừng hoạt động: 2.
- **Điểm mô hình đáng học:** CAP chỉ áp dụng lúc có partition; quorum W + R > N; Last-Write-Wins nguy hiểm khi đồng hồ lệch; chọn mức theo nghiệp vụ.
- **Nâng cấp của mình:** Kéo cắt link giữa hai vùng trên isometric; núm W và R; `timeline-read` chỉ ra lần đọc stale; radar CAP/PACELC (S3-01, S3-02); vector clock và CRDT cho phần hợp nhất (S3-06, S3-08).
- **Map sang bài:** chính S3-01; một phần S1-04, S3-02, S3-06, S6-03.

#### 17. `consensus` — Consensus & Leader Election

- **Level / thời lượng:** advanced, 14 phút, 12 bước. Chương 03 Data & Storage.
- **Ý chính:** Cách một nhóm server đồng ý về một leader và một lịch sử duy nhất, kể cả khi một số máy không liên lạc được.
- **Metric theo dõi:** `leaders`, `term`, `writes`, `canLose`.
- **Trình tự bước:**
  1. `setup` — Một leader và hai follower.
  2. `problem` — Mạng đứt khiến hai node cùng nhận mình là leader, có hai lịch sử khác nhau.
  3. `solution` — Quy tắc: mọi quyết định cần đa số (2 trên 3).
  4. `technique` — Bầu leader: node không thấy heartbeat trở thành ứng viên của term mới và thắng khi đủ phiếu.
  5. `technique` — Một lần ghi chỉ được coi là đã commit khi đa số đã lưu.
  6. `solution` — Leader cũ thấy term mới hơn thì nhường lại và bỏ các bản ghi chưa xác nhận.
  7. `insight` — Chọn số node (thường bằng số availability zone).
  8. `problem` — Ca leader tạm dừng rồi tỉnh dậy và ghi như thể còn nắm quyền.
  9. `solution` — Fencing token: mỗi lần ghi mang term, kho từ chối term cũ.
  10. `tradeoff` — Giá phải trả: thêm một vòng đa số cho mỗi lần ghi; bầu cử làm ghi dừng khoảng một giây.
  11. `insight` — Thực tế thường dùng consensus qua các hệ thống khác (service coordination, DB).
  12. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, panel (thẻ chữ hoặc biểu đồ), zone. Ghi chú: bước có node quá tải (heat): 8.
- **Điểm mô hình đáng học:** Đa số (quorum) loại trừ split brain; term tăng đơn điệu; commit theo đa số; fencing token.
- **Nâng cấp của mình:** Mô phỏng Raft theo sự kiện với term, log, heartbeat; bài `order` sắp xếp bước bầu cử; `predict` ai là leader sau partition; test bất biến "không bao giờ có hai leader trong cùng một term".
- **Map sang bài:** chính S3-03.

#### 18. `transactions` — Transactions & Isolation

- **Level / thời lượng:** intermediate, 14 phút, 13 bước. Chương 03 Data & Storage.
- **Ý chính:** Hai người cùng đặt một ghế trong cùng một mili giây; cách database giữ cho các thay đổi đồng thời vẫn đúng.
- **Metric theo dõi:** `seatsLeft`, `sold`, `oversold`, `lockWait`.
- **Trình tự bước:**
  1. `setup` — Còn một ghế.
  2. `problem` — Cả hai cùng đọc "còn 1" rồi cùng ghi "còn 0": ghế bán hai lần.
  3. `insight` — Chỉ bọc BEGIN...COMMIT chưa đủ để chặn.
  4. `solution` — Khóa dòng khi quyết định (FOR UPDATE): người sau chờ.
  5. `technique` — Hoặc gộp kiểm tra và đổi vào một câu UPDATE.
  6. `technique` — Hoặc lạc quan: kiểm tra số phiên bản khi ghi, sai thì thử lại.
  7. `insight` — Các mức isolation.
  8. `problem` — Ca khóa một dòng chưa tồn tại: kiểm tra rồi chèn vẫn trùng.
  9. `problem` — Ca deadlock: hai giao dịch khóa theo thứ tự ngược nhau, database hủy một.
  10. `solution` — Ràng buộc UNIQUE là chốt chặn cuối cùng.
  11. `problem` — Ca giữ khóa trong lúc gọi thanh toán làm cạn connection pool.
  12. `solution` — Giữ chỗ, thanh toán ngoài giao dịch, rồi xác nhận.
  13. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có node quá tải (heat): 2, 3, 8, 9, 11.
- **Điểm mô hình đáng học:** Lost update; pessimistic so với optimistic; isolation; deadlock; không giữ lock qua cuộc gọi ngoài.
- **Nâng cấp của mình:** Timeline hai giao dịch trên một dòng dữ liệu; `timeline-read` chỉ ra giao dịch nào thua; `postmortem` cho ca pool cạn; metric `lockWait` và `oversold`.
- **Map sang bài:** chính S3-07; một phần S3-04.

#### 19. `files` — Files & Media

- **Level / thời lượng:** intermediate, 14 phút, 13 bước. Chương 03 Data & Storage.
- **Ý chính:** Ảnh và video không nên nằm trong database; chúng đi đâu thay vào đó và đi tới nơi, quay về bằng cách nào.
- **Metric theo dõi:** `dbGrowth`, `appTraffic`, `imgLoad`, `storeCost`.
- **Trình tự bước:**
  1. `setup` — Ảnh lưu thẳng trong database.
  2. `problem` — Hai terabyte mỗi ngày làm DB, replica và backup phình ra.
  3. `solution` — Lưu byte trong object storage, database chỉ giữ một dòng metadata.
  4. `problem` — Ca video 2 GB qua kết nối di động giữ server ứng dụng hàng phút.
  5. `solution` — Upload trực tiếp lên storage bằng presigned URL.
  6. `technique` — Chia file lớn thành nhiều phần để thử lại từng phần và tiếp tục khi đứt.
  7. `technique` — Sinh các phiên bản người dùng thực sự tải (thumbnail, transcode) bằng hàng đợi và worker.
  8. `solution` — Phục vụ từ edge để giảm thời gian tải.
  9. `technique` — Video: chia đoạn ngắn ở nhiều chất lượng để player tự chọn.
  10. `problem` — Ca dòng không có file và file không có dòng: trạng thái trên dòng, xóa hai pha, dọn rác định kỳ.
  11. `tradeoff` — File cũ chuyển sang lưu trữ rẻ hơn theo vòng đời.
  12. `problem` — Ca bucket ai cũng liệt kê được: chặn truy cập công khai, dùng URL ký, quyền tối thiểu.
  13. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, panel (thẻ chữ hoặc biểu đồ), queue (hàng đợi trước node).
- **Điểm mô hình đáng học:** Tách byte khỏi metadata; presigned URL; multipart; xử lý bất đồng bộ; lifecycle để giảm chi phí.
- **Nâng cấp của mình:** Estimator tăng trưởng storage và chi phí theo lifecycle; sim upload qua app so với trực tiếp; `fix-challenge` dựng pipeline upload với ngân sách; liên kết S2-04 và S4-03.
- **Map sang bài:** chính S2-12.

### Chương 04 — Communication

#### 20. `apis` — REST, RPC & GraphQL

- **Level / thời lượng:** beginner, 11 phút, 10 bước. Chương 04 Communication.
- **Ý chính:** Ba cách để chương trình yêu cầu nhau và chi phí của mỗi cách khi chạy trên điện thoại dùng 4G.
- **Metric theo dõi:** `trips`, `payload`, `screenMs`, `unused`.
- **Trình tự bước:**
  1. `setup` — Hai chương trình cần một hợp đồng giao tiếp.
  2. `technique` — REST: tài nguyên và các động từ HTTP.
  3. `problem` — Trên điện thoại REST gọi nhiều lần và tải thừa dữ liệu.
  4. `solution` — GraphQL cho hỏi đúng thứ cần: ba round trip thành một.
  5. `tradeoff` — Truy vấn linh hoạt có thể rất đắt nên cần giới hạn độ sâu và chi phí.
  6. `technique` — Trong data center: RPC (gRPC, protobuf).
  7. `technique` — Ca danh sách hai triệu phần tử: phân trang theo con trỏ.
  8. `problem` — Ca đổi tên trường làm app cũ hỏng: thêm trường mới và dùng phiên bản khi thay đổi gây hỏng.
  9. `insight` — Chọn cái nào ở đâu.
  10. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), device, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có thành phần ngừng hoạt động: 3, 8.
- **Điểm mô hình đáng học:** Round trip và payload là đơn vị chi phí; cursor pagination; tương thích ngược khi đổi API.
- **Nâng cấp của mình:** Waterfall so sánh số round trip của ba kiểu; núm RTT và kích thước payload; `estimate` thời gian màn hình sẵn sàng; không cần live-sim.
- **Map sang bài:** chính S1-08.

#### 21. `queues` — Message Queues

- **Level / thời lượng:** beginner, 12 phút, 11 bước. Chương 04 Communication.
- **Ý chính:** Trả lời người dùng ngay, làm việc chậm sau, và không để mất việc nào trên đường đi.
- **Metric theo dõi:** `respond`, `backlog`, `workers`, `lost`.
- **Trình tự bước:**
  1. `problem` — Việc chậm đặt trong request làm người dùng chờ 30 giây.
  2. `solution` — Đặt hàng đợi ở giữa: API trả lời trong chưa đầy một giây.
  3. `insight` — Spike tải thành backlog thay vì thành lỗi.
  4. `technique` — Thêm worker để xả backlog.
  5. `problem` — Worker chết giữa chừng làm mất job đang chạy.
  6. `solution` — Chỉ xác nhận (ack) khi xong; job chưa ack được giao lại.
  7. `technique` — Thông điệp độc: sau vài lần lỗi thì chuyển vào dead-letter queue.
  8. `problem` — Ca thứ tự bị đảo giữa các sự kiện của cùng một tài khoản.
  9. `solution` — Chia partition theo khóa để giữ thứ tự theo từng tài khoản.
  10. `technique` — Khi backlog không bao giờ hết: cảnh báo tuổi job cũ nhất và giới hạn hàng đợi.
  11. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, panel (thẻ chữ hoặc biểu đồ), queue (hàng đợi trước node). Ghi chú: bước có thành phần ngừng hoạt động: 5, 7; bước có node quá tải (heat): 8.
- **Điểm mô hình đáng học:** Queue hấp thụ burst nhưng không tạo ra công suất; ack và redelivery; DLQ; thứ tự theo khóa.
- **Nâng cấp của mình:** Hàng đợi chất trước node (queue pile); `tune-to-limit` số worker; `timeline-read` job nào mất/trùng; nối với back-pressure (S4-10).
- **Map sang bài:** chính S2-04; một phần S1-02, S4-06.

#### 22. `pubsub` — Pub/Sub & Events

- **Level / thời lượng:** beginner, 10 phút, 10 bước. Chương 04 Communication.
- **Ý chính:** Thông báo "có việc đã xảy ra" và để ai quan tâm thì phản ứng, không ai phải chờ ai.
- **Metric theo dõi:** `checkout`, `knows`, `breaks`, `subs`.
- **Trình tự bước:**
  1. `problem` — Dịch vụ checkout gọi trực tiếp bốn dịch vụ khác.
  2. `problem` — Dịch vụ email chết làm không ai mua được hàng.
  3. `solution` — Phát một sự kiện lên bus thay vì gọi bốn lần; checkout nhanh hơn rõ rệt.
  4. `insight` — Phân biệt queue (mỗi việc một người nhận) với topic (mọi người đăng ký đều nhận).
  5. `solution` — Tính năng mới chỉ cần đăng ký, không sửa dịch vụ đơn hàng.
  6. `insight` — Subscriber hỏng thì sự kiện chờ sẵn, khi sống lại tự bắt kịp.
  7. `tradeoff` — Cái giá của sự kiện.
  8. `problem` — Ca đã lưu đơn nhưng chưa phát sự kiện: dùng bảng outbox và relay.
  9. `insight` — Ca phát lại lịch sử cho hệ phân tích.
  10. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), crowd, db, panel (thẻ chữ hoặc biểu đồ), queue (hàng đợi trước node). Ghi chú: bước có thành phần ngừng hoạt động: 2, 6.
- **Điểm mô hình đáng học:** Giảm coupling về thời gian; queue so với topic; outbox để không mất sự kiện; replay.
- **Nâng cấp của mình:** Sim hỏng một subscriber so với gọi sync; ca crash giữa lưu và phát; `postmortem`; nối vào Design Case notification (S7-03).
- **Map sang bài:** chính S2-11; một phần S1-02, S2-04, S4-06.

#### 23. `realtime` — Real-time Updates

- **Level / thời lượng:** beginner, 11 phút, 10 bước. Chương 04 Communication.
- **Ý chính:** Cách server báo cho client biết việc vừa xảy ra: chat, tỉ số trực tiếp, thông báo.
- **Metric theo dõi:** `delay`, `rpm`, `wasted`, `conns`.
- **Trình tự bước:**
  1. `problem` — Bob gửi tin, Alice làm sao biết?
  2. `technique` — Polling: hỏi lại sau mỗi vài giây.
  3. `problem` — Polling một triệu điện thoại tạo nửa triệu request mỗi giây, phần lớn rỗng.
  4. `solution` — Long polling: server giữ request mở đến khi có tin.
  5. `technique` — Server-Sent Events: một phản hồi không kết thúc.
  6. `technique` — WebSocket: hai chiều trên một kết nối bền.
  7. `insight` — Mở rộng: server nào đang giữ socket của Alice; dùng pub/sub giữa các server.
  8. `problem` — Ca Alice ngoại tuyến: lưu trước, đồng bộ lại khi kết nối, kèm push notification.
  9. `technique` — Presence: nhịp tim và khóa hết hạn.
  10. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có thành phần ngừng hoạt động: 8; bước có node quá tải (heat): 3.
- **Điểm mô hình đáng học:** Chi phí của hỏi lặp lại; kết nối bền làm server có state; định tuyến tin tới đúng server; presence theo TTL.
- **Nâng cấp của mình:** `estimate` RPS và tỉ lệ rỗng của polling; sim số kết nối và độ trễ; ca một gateway chết gây reconnect storm (nối S7-01).
- **Map sang bài:** chính S4-09.

### Chương 05 — Reliability

#### 24. `redundancy` — Redundancy & Failover

- **Level / thời lượng:** intermediate, 12 phút, 12 bước. Chương 05 Reliability.
- **Ý chính:** Mọi thứ rồi sẽ hỏng; thiết kế sao cho không một lỗi đơn lẻ nào làm cả hệ thống ngừng.
- **Metric theo dõi:** `avail`, `downtime`, `spofs`, `survives`.
- **Trình tự bước:**
  1. `setup` — Tính độ khả dụng khi chỉ có một bản của mỗi thành phần.
  2. `problem` — Mỗi hộp đơn lẻ là một điểm hỏng đơn; đánh dấu ba điểm.
  3. `solution` — Dự phòng: cặp load balancer, server thứ hai, follower cho DB.
  4. `problem` — Ca các bản sao cùng nằm một data center nên hỏng cùng lúc.
  5. `solution` — Rải qua các availability zone, mỗi tầng một bản trong mỗi zone.
  6. `solution` — Zone A mất điện: failover, chuyển toàn bộ sang zone B.
  7. `technique` — Hỏi hai câu: bao lâu khôi phục (RTO) và mất bao nhiêu dữ liệu (RPO).
  8. `insight` — Failover chưa từng thử thì có thể không chạy.
  9. `problem` — Ca lỗi phần mềm xuất hiện ở mọi nơi cùng lúc sau một release.
  10. `solution` — Canary: đưa phiên bản mới cho một phần nhỏ trước, tự rollback nếu lỗi.
  11. `technique` — Vượt ra ngoài zone: nhiều vùng với định tuyến toàn cầu và độ trễ sao chép.
  12. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), crowd, panel (thẻ chữ hoặc biểu đồ), zone. Ghi chú: bước có thành phần ngừng hoạt động: 4, 6, 8, 9.
- **Điểm mô hình đáng học:** Khả dụng nhân qua các thành phần nối tiếp; lỗi tương quan; RTO/RPO; canary giảm blast radius.
- **Nâng cấp của mình:** Phân tích cấu trúc tự phát hiện SPOF (articulation point); tắt zone bằng một click; `estimate` availability từ sơ đồ; `postmortem` cho ca bản phát hành lỗi.
- **Map sang bài:** chính S3-09.

#### 25. `rate-limiting` — Rate Limiting

- **Level / thời lượng:** intermediate, 10 phút, 9 bước. Chương 05 Reliability.
- **Ý chính:** Cho mỗi client một ngân sách công bằng để một script chạy quá đà không làm quá tải dịch vụ của mọi người.
- **Metric theo dõi:** `abuser`, `served`, `apiCpu`, `limited`.
- **Trình tự bước:**
  1. `problem` — Một script gửi quá nhiều request làm mọi người chậm.
  2. `solution` — Đặt bộ giới hạn ở cổng vào, API CPU giảm từ 99% xuống khoảng 45%.
  3. `technique` — Cách đếm: token bucket.
  4. `technique` — So cửa sổ cố định, cửa sổ trượt và bucket.
  5. `problem` — Nhiều gateway cần chung một bộ đếm nên dùng store dùng chung.
  6. `technique` — Báo cho client biết cách cư xử (Retry-After, header giới hạn).
  7. `problem` — Ca một khách hàng có mười nghìn người dùng: hạn mức theo tenant theo gói.
  8. `technique` — Khi mọi người cùng tăng đột biến: loại bỏ request ưu tiên thấp.
  9. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device, panel (thẻ chữ hoặc biểu đồ).
- **Điểm mô hình đáng học:** Token bucket (rate và burst); độ chính xác khi phân tán; header phản hồi; shed theo ưu tiên.
- **Nâng cấp của mình:** Núm rate/burst trên sim; abuser là một nguồn tải riêng; bài `tune-to-limit` chọn hạn mức; cặp với back-pressure (S4-10) và case Rate Limiter (S7-02).
- **Map sang bài:** chính S4-05; một phần S4-10.

#### 26. `timeouts-retries` — Timeouts & Retries

- **Level / thời lượng:** intermediate, 11 phút, 11 bước. Chương 05 Reliability.
- **Ý chính:** Gọi một dịch vụ đang gặp khó an toàn: bỏ cuộc đúng lúc, thử lại cẩn thận và biết khi nào dừng.
- **Metric theo dõi:** `success`, `p99`, `payLoad`, `threads`.
- **Trình tự bước:**
  1. `problem` — Một dịch vụ chậm kéo theo dịch vụ gọi nó cạn thread.
  2. `solution` — Đặt timeout và có phương án dự phòng.
  3. `technique` — Thử lại các lỗi thoáng qua.
  4. `problem` — Thử lại ngay lập tức nhiều lần thành bão retry làm tải gấp bốn.
  5. `solution` — Backoff có jitter và ngân sách retry.
  6. `technique` — Circuit breaker: tạm ngừng gọi, mỗi lần gọi lỗi chỉ mất 1 ms thay vì 800 ms.
  7. `solution` — Nửa mở rồi đóng lại khi dịch vụ hồi phục.
  8. `technique` — Retry không được tính tiền hai lần: dùng idempotency key.
  9. `technique` — Truyền hạn chót (deadline) đi cùng request để không làm việc không kịp.
  10. `technique` — Bulkhead: pool riêng cho mỗi phụ thuộc.
  11. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có thành phần ngừng hoạt động: 6; bước có node quá tải (heat): 1, 2, 10.
- **Điểm mô hình đáng học:** Vòng phản hồi dương của retry; jitter; máy trạng thái breaker; idempotency; cô lập tài nguyên.
- **Nâng cấp của mình:** Vòng phản hồi retry nằm sẵn trong engine (λ tick sau cộng retry); breaker là cổng trên link; `fix-challenge` đạt SLO với ngân sách retry; War-Room "retry storm sau deploy".
- **Map sang bài:** chính S4-11.

#### 27. `observability` — Observability

- **Level / thời lượng:** intermediate, 11 phút, 9 bước. Chương 05 Reliability.
- **Ý chính:** Metric, log, trace: cách biết hệ thống sai ở đâu, vì sao, và nhanh.
- **Metric theo dõi:** `detect`, `locate`, `p99`, `signals`.
- **Trình tự bước:**
  1. `problem` — "Checkout chậm" nhưng chậm ở đâu?
  2. `technique` — Metric theo thời gian, RED trên mọi service.
  3. `technique` — Cảnh báo theo điều người dùng cảm nhận: SLO và mức đốt ngân sách lỗi.
  4. `technique` — Log kể chuyện từng dòng, có request id.
  5. `solution` — Trace theo một request qua nhiều service, tìm ra service chiếm phần lớn thời gian.
  6. `solution` — Sửa rồi chứng minh bằng số.
  7. `problem` — Ca 3 giờ sáng lỗi tăng vọt do thay đổi cấu hình; rollback.
  8. `insight` — Học từ sự cố qua post-mortem.
  9. `recap` — Tóm tắt.
- **Thành phần scene dùng:** panel (thẻ chữ hoặc biểu đồ).
- **Điểm mô hình đáng học:** Ba trụ cột bổ sung nhau; SLO và error budget; trace id lan truyền; post-mortem có hành động.
- **Nâng cấp của mình:** Trace waterfall và dashboard lấy từ chính sim (số thật của engine); `timeline-read` đọc sự cố; `postmortem` có chấm; nền cho War-Room.
- **Map sang bài:** chính S4-07; một phần S6-06.

### Chương 06 — Architecture

#### 28. `microservices` — Monolith vs Microservices

- **Level / thời lượng:** intermediate, 14 phút, 12 bước. Chương 06 Architecture.
- **Ý chính:** Một codebase hay nhiều service: mỗi bên mua được gì, trả giá gì, và chuyển giữa hai bên thế nào.
- **Metric theo dõi:** `deploys`, `blast`, `hops`, `opsCost`.
- **Trình tự bước:**
  1. `setup` — Một ứng dụng, một lần triển khai.
  2. `problem` — Năm mươi kỹ sư dùng chung một codebase: lỗi ở nơi này làm nơi khác ngừng hoạt động.
  3. `solution` — Tách theo năng lực nghiệp vụ, mỗi team một service, có gateway phía trước.
  4. `technique` — Mỗi service sở hữu dữ liệu của mình.
  5. `problem` — Mạng nằm giữa các service: nhiều hop, nhiều điểm timeout.
  6. `problem` — Ca distributed monolith: service đọc dữ liệu nhau và phải phát hành cùng nhau.
  7. `problem` — Ca trang lịch sử đơn gọi hai mươi lần sang catalog.
  8. `solution` — Giữ bản đọc cục bộ cập nhật bằng sự kiện.
  9. `technique` — Ca thay đổi API làm hỏng service láng giềng; contract test chặn ở CI.
  10. `insight` — Chọn mô hình nào.
  11. `technique` — Di chuyển dần theo strangler fig.
  12. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), crowd, db, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có thành phần ngừng hoạt động: 2; bước có node quá tải (heat): 5, 6, 7.
- **Điểm mô hình đáng học:** Ranh giới theo nghiệp vụ; mỗi service một DB; chi phí mạng; contract; strangler.
- **Nâng cấp của mình:** Evolution timeline v1 → vN; đếm hop và p99 của một trang; ca distributed monolith dạng biểu đồ phụ thuộc; bài `order` các bước strangler.
- **Map sang bài:** chính S5-01.

#### 29. `service-discovery` — Service Discovery & Gateways

- **Level / thời lượng:** intermediate, 13 phút, 13 bước. Chương 06 Architecture.
- **Ý chính:** Cách các service tìm nhau khi instance liên tục đến và đi, kèm một cửa chung cho thế giới bên ngoài.
- **Metric theo dõi:** `deadCalls`, `instances`, `lookup`.
- **Trình tự bước:**
  1. `setup` — Orders cần gọi Payments.
  2. `problem` — Instance được thay và địa chỉ cũ không còn: một nửa lời gọi lỗi.
  3. `solution` — Service registry: instance đăng ký và gửi heartbeat.
  4. `insight` — Instance tự vào ra; thiếu ba nhịp thì bị gỡ.
  5. `technique` — Client-side so với server-side discovery.
  6. `technique` — Discovery qua DNS với TTL ngắn.
  7. `problem` — Ca nhận traffic trước khi sẵn sàng.
  8. `solution` — Readiness check, slow start và draining khi tắt.
  9. `insight` — Registry chết thì sao: chạy ba node, còn đa số vẫn trả lời.
  10. `problem` — Mỗi team lặp lại cùng đoạn mã retry, TLS, metric.
  11. `solution` — Service mesh: sidecar gánh phần đó.
  12. `technique` — Ở rìa hệ thống: API gateway.
  13. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), crowd, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có thành phần ngừng hoạt động: 9; bước có node quá tải (heat): 7.
- **Điểm mô hình đáng học:** Heartbeat và TTL; readiness khác liveness; slow start; mesh chuyển phần hạ tầng ra khỏi code.
- **Nâng cấp của mình:** Sim churn instance; metric `deadCalls`; `spot-bottleneck` tìm điểm hỏng đơn của registry; ca DNS TTL chặn failover làm War-Room.
- **Map sang bài:** chính S5-04.

#### 30. `sagas` — Sagas & Distributed Transactions

- **Level / thời lượng:** advanced, 13 phút, 11 bước. Chương 06 Architecture.
- **Ý chính:** Một hành động nhiều service, nhiều database: giữ cho toàn bộ "được cả hoặc không" mà không cần một giao dịch lớn.
- **Metric theo dõi:** `allOrNothing`, `blocked`, `coord`.
- **Trình tự bước:**
  1. `problem` — Một chuyến đi cần ba database khác nhau.
  2. `technique` — Two-phase commit: điều phối viên hỏi sẵn sàng rồi chốt.
  3. `problem` — Điều phối viên chết sau bước hỏi làm khóa treo.
  4. `solution` — Saga: commit từng bước cục bộ, lỗi thì chạy hoàn tác ngược.
  5. `technique` — Orchestration: một service điều khiển và lưu trạng thái saga.
  6. `technique` — Choreography: service phản ứng theo sự kiện của bước trước.
  7. `tradeoff` — Cái giá: không có cô lập giữa các bước, nên cần trạng thái "đã giữ chỗ".
  8. `insight` — Ca crash giữa chừng rồi chạy tiếp: gửi lại bước phải an toàn nhờ idempotency key.
  9. `problem` — Ca bước hoàn tác cũng lỗi: thử lại, cuối cùng chuyển người xử lý.
  10. `technique` — Ca timeout nghĩa là "không biết" nên phải hỏi trạng thái.
  11. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có thành phần ngừng hoạt động: 3, 9; bước có node quá tải (heat): 3.
- **Điểm mô hình đáng học:** Compensation thay cho rollback; orchestration so với choreography; idempotency; timeout là trạng thái chưa biết.
- **Nâng cấp của mình:** Timeline saga có chèn lỗi ở từng bước; bài `order` thứ tự hoàn tác; `postmortem` đơn trùng; liên kết với payment (S7-06).
- **Map sang bài:** chính S3-04.

#### 31. `batch-stream` — Batch & Stream Processing

- **Level / thời lượng:** intermediate, 15 phút, 14 bước. Chương 06 Architecture.
- **Ý chính:** Xử lý hàng tỉ sự kiện: ban đêm theo lô lớn, hoặc liên tục khi sự kiện đến.
- **Metric theo dõi:** `freshness`, `prodLoad`, `eventsDay`, `exact`.
- **Trình tự bước:**
  1. `problem` — Chạy phân tích trên database sản xuất làm chậm ứng dụng.
  2. `solution` — Batch: thu thập trước, tính sau; kho dữ liệu cho phân tích.
  3. `technique` — Chia việc theo map, shuffle, reduce.
  4. `problem` — Ca một khóa chiếm 40% dữ liệu làm một reducer chạy hàng giờ.
  5. `solution` — Gộp sớm ở mapper và chia nhỏ khóa nóng.
  6. `problem` — Một ngày trễ là quá trễ.
  7. `solution` — Stream: tính ngay khi sự kiện đến.
  8. `technique` — Đếm theo cửa sổ thời gian.
  9. `problem` — Ca sự kiện đến muộn và trùng: watermark và khử trùng theo id.
  10. `problem` — Ca bộ xử lý không theo kịp, lag tăng.
  11. `solution` — Mở rộng theo partition.
  12. `technique` — Ca đếm người xem duy nhất: dùng sketch (HyperLogLog) thay cho tập chính xác.
  13. `insight` — Batch và stream chạy cùng nhau.
  14. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), crowd, db, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có node quá tải (heat): 4, 10.
- **Điểm mô hình đáng học:** Hot key trong reduce; windowing; late data; lag là metric; sketch đổi độ chính xác lấy bộ nhớ.
- **Nâng cấp của mình:** Lag theo partition trên timeline; `predict` thời gian job; `tune-to-limit` số partition; sim hot key với phân phối Zipf.
- **Map sang bài:** chính S5-05.

### Chương 07 — Security

#### 32. `authentication` — Authentication

- **Level / thời lượng:** intermediate, 13 phút, 12 bước. Chương 07 Security.
- **Ý chính:** Chứng minh một người là ai mà không biến chính hệ thống thành nguồn làm lộ mật khẩu.
- **Metric theo dõi:** `leak`, `stuffing`, `mfa`.
- **Trình tự bước:**
  1. `problem` — Một bảng đầy mật khẩu là rủi ro lớn.
  2. `solution` — Lưu hash chậm có salt riêng cho từng người.
  3. `technique` — Sau đăng nhập dùng session.
  4. `technique` — Ca quên mật khẩu: token một lần, hết hạn sau 15 phút, trả lời giống nhau với email lạ.
  5. `problem` — Credential stuffing: bot thử mật khẩu bị lộ ở nơi khác.
  6. `solution` — Làm cho việc đoán tốn kém: giới hạn tốc độ, từ chối mật khẩu đã lộ.
  7. `solution` — Yếu tố thứ hai.
  8. `problem` — Ca trang đăng nhập giả chuyển tiếp thời gian thực lấy luôn mã một lần.
  9. `solution` — Passkey: không có gì để gõ, không có gì để lấy cắp.
  10. `technique` — Hoặc giao cho nhà cung cấp danh tính.
  11. `problem` — Ca token bị đánh cắp: access token ngắn hạn, refresh token thu hồi được.
  12. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có node quá tải (heat): 5, 8.
- **Điểm mô hình đáng học:** Hash chậm có salt; rate limit cho đăng nhập; phishing chống bằng passkey; token ngắn hạn.
- **Nâng cấp của mình:** Tương tác chọn biện pháp theo kịch bản tấn công; số liệu đơn giản (tỉ lệ stuffing thành công) từ sim sự kiện nhỏ; phần còn lại dùng quiz và cards.
- **Map sang bài:** chính S6-08.

#### 33. `authorization` — Authorization

- **Level / thời lượng:** intermediate, 13 phút, 13 bước. Chương 07 Security.
- **Ý chính:** Biết ai là ai chưa cho biết họ được xem, được làm gì; kiểm tra điều đó ở mọi nơi.
- **Metric theo dõi:** `exposed`, `checks`, `privilege`.
- **Trình tự bước:**
  1. `problem` — Đã đăng nhập không đồng nghĩa với được phép.
  2. `solution` — Kiểm tra quyền sở hữu ở mỗi request: truy vấn gắn với tổ chức của người gọi.
  3. `problem` — Ca trường "role" do client gửi lên được lưu và người gọi thành admin; dùng allow-list.
  4. `technique` — Cho database cũng thực thi tenant (row-level security).
  5. `technique` — Vai trò: mỗi loại người dùng làm được gì.
  6. `technique` — Quan hệ: chia sẻ và nhóm.
  7. `technique` — Quyết định ở một nơi (policy service).
  8. `problem` — Ca một service giữ khóa vạn năng và lỗi injection làm lộ mọi bảng.
  9. `solution` — Quyền tối thiểu: credential riêng, chỉ đọc.
  10. `problem` — Ca confused deputy: báo cáo chạy với quyền của service chứ không phải của người dùng.
  11. `solution` — Hành động với danh nghĩa người dùng.
  12. `technique` — Audit log: ai xem gì, cảnh báo truy cập bất thường.
  13. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có node quá tải (heat): 3, 8, 10.
- **Điểm mô hình đáng học:** Kiểm tra quyền theo từng đối tượng, không chỉ theo route; allow-list; least privilege; confused deputy.
- **Nâng cấp của mình:** Bài `spot-bottleneck` (chỉ lỗ hổng) trên luồng cho trước; chọn cách sửa; không cần live-sim.
- **Map sang bài:** chính S6-09.

#### 34. `encryption` — Encryption & Secrets

- **Level / thời lượng:** intermediate, 13 phút, 12 bước. Chương 07 Security.
- **Ý chính:** Bảo vệ dữ liệu trên đường truyền, trên đĩa, và cả khóa, mật khẩu mà các service dùng.
- **Metric theo dõi:** `inTransit`, `atRest`, `secrets`.
- **Trình tự bước:**
  1. `problem` — HTTP thường trên Wi-Fi công cộng.
  2. `solution` — TLS mã hóa đường truyền; kẻ nghe chỉ thấy bản mã.
  3. `problem` — Ca chứng chỉ hết hạn lúc 3 giờ sáng: tự gia hạn và cảnh báo hết hạn.
  4. `technique` — Mã hóa cả bên trong data center bằng mutual TLS.
  5. `problem` — Ca bản backup nằm trong bucket công khai.
  6. `solution` — Mã hóa dữ liệu khi lưu, giữ khóa ở KMS.
  7. `technique` — Xoay khóa mà không phải mã hóa lại toàn bộ (bọc lại data key).
  8. `problem` — Ca khóa API commit vào repo công khai.
  9. `solution` — Secrets manager với xoay khóa tự động và quét trong CI.
  10. `technique` — Ca số thẻ: dùng token hóa.
  11. `technique` — Mã hóa đầu-cuối: ngay cả server cũng không đọc được.
  12. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), device, panel (thẻ chữ hoặc biểu đồ).
- **Điểm mô hình đáng học:** Ba trạng thái dữ liệu (đang truyền, đang lưu, đang dùng); khóa tách khỏi dữ liệu; vòng đời chứng chỉ.
- **Nâng cấp của mình:** `order` trình tự bắt tay TLS; chọn nơi áp dụng mã hóa cho từng đường dữ liệu; không cần live-sim.
- **Map sang bài:** chính S6-10.

### Chương 08 — Shipping

#### 35. `testing` — Testing

- **Level / thời lượng:** beginner, 12 phút, 11 bước. Chương 08 Shipping.
- **Ý chính:** Biết một thay đổi an toàn trước khi người dùng phát hiện: nhiều test nhanh cho logic và ít test chậm cho phần còn lại.
- **Metric theo dõi:** `feedback`, `covers`, `escaped`.
- **Trình tự bước:**
  1. `setup` — Thay đổi này có an toàn không?
  2. `problem` — Bấm thử bằng tay bỏ sót lỗi và khách hàng phát hiện trước team.
  3. `solution` — Unit test: kiểm một phần riêng lẻ.
  4. `technique` — Test double thay cho các phần còn lại.
  5. `solution` — Integration test với thành phần thật như database trong container.
  6. `technique` — Contract test giữa các team.
  7. `solution` — End-to-end test đi qua toàn hành trình, chạy chậm.
  8. `insight` — Kim tự tháp test.
  9. `problem` — Ca test chập chờn làm mọi người quen bỏ qua kết quả đỏ.
  10. `technique` — Test tải và test lỗi.
  11. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, panel (thẻ chữ hoặc biểu đồ).
- **Điểm mô hình đáng học:** Chi phí và độ tin cậy của từng mức test; test double; contract; flaky là nợ kỹ thuật.
- **Nâng cấp của mình:** `order` xếp test theo tốc độ; mô phỏng chi phí phản hồi; không cần live-sim.
- **Map sang bài:** chính S6-11.

#### 36. `cicd` — CI/CD & Deployments

- **Level / thời lượng:** intermediate, 13 phút, 11 bước. Chương 08 Shipping.
- **Ý chính:** Đưa mọi thay đổi lên production nhanh và an toàn, và lùi lại cũng nhanh như vậy.
- **Metric theo dõi:** `deploys`, `leadTime`, `failRate`, `restore`.
- **Trình tự bước:**
  1. `setup` — Triển khai bằng tay.
  2. `problem` — Ca "chạy được trên máy tôi" nhưng bản build không khởi động.
  3. `solution` — Tích hợp liên tục: build và test trên máy sạch cho mỗi push.
  4. `technique` — Build một lần, đưa cùng artifact qua các môi trường.
  5. `solution` — Continuous delivery: staging tự động rồi lên production.
  6. `technique` — Blue-green: hai nhóm, chuyển toàn bộ lưu lượng sang nhóm mới.
  7. `technique` — Canary: cho một phần nhỏ người dùng, so với bản cũ, tăng dần hoặc rollback.
  8. `problem` — Ca migration làm hỏng bản cũ: mở rộng, chuyển, rồi co lại qua nhiều lần triển khai.
  9. `technique` — Feature flag: triển khai không có nghĩa là phát hành.
  10. `insight` — Đo bản thân việc giao hàng.
  11. `recap` — Tóm tắt.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device, panel (thẻ chữ hoặc biểu đồ), zone. Ghi chú: bước có thành phần ngừng hoạt động: 2; bước có node quá tải (heat): 8.
- **Điểm mô hình đáng học:** Artifact bất biến; blue-green so với canary; migration tương thích hai chiều; flag tách deploy khỏi release.
- **Nâng cấp của mình:** Canary chạy trên sim với lỗi tiêm vào và so error rate; bài `postmortem` cho ca migration; sơ đồ pipeline isometric.
- **Map sang bài:** chính S6-12.

### Chương 09 — Whole Systems

#### 37. `hld-lld` — HLD & LLD

- **Level / thời lượng:** beginner, 8 phút, 8 bước. Chương 09 Whole Systems.
- **Ý chính:** Cùng một hệ thống ở hai mức phóng đại: bản đồ các dịch vụ, và bên trong một dịch vụ.
- **Metric theo dõi:** `zoom`, `unit`, `output`.
- **Trình tự bước:**
  1. `setup` — Một hệ thống, hai mức nhìn.
  2. `technique` — High-level design: bản đồ các dịch vụ.
  3. `tradeoff` — Quyết định ở mức HLD là trade-off.
  4. `solution` — Low-level design: bên trong một hộp.
  5. `technique` — Quyết định ở mức LLD: trạng thái, schema, trường hợp biên.
  6. `insight` — Chỗ hai mức gặp nhau: hợp đồng.
  7. `tradeoff` — Ca thiết kế sai mức: lội quá sâu hoặc nói quá chung.
  8. `recap` — Tóm tắt.
- **Thành phần scene dùng:** .
- **Điểm mô hình đáng học:** Chọn mức chi tiết đúng; hợp đồng ở ranh giới; HLD là trade-off, LLD là cấu trúc.
- **Nâng cấp của mình:** Hai mức zoom ở memory-2d và isometric (S6-01); chuyển qua lại; `design-constraint` chọn mức nên đào sâu.
- **Map sang bài:** chính S6-01; một phần S6-02.

#### 38. `design-url-shortener` — Design a URL Shortener

- **Level / thời lượng:** intermediate, 14 phút, 12 bước. Chương 09 Whole Systems.
- **Ý chính:** Thiết kế đầu-cuối đầu tiên: từ một dòng yêu cầu tới hệ thống phục vụ hàng tỉ lượt chuyển hướng.
- **Metric theo dõi:** `redirectMs`, `dbQps`, `codeKind`, `linksKept`.
- **Trình tự bước:**
  1. `setup` — Đề bài: rút gọn đường dẫn.
  2. `setup` — Đặt con số: tần suất ghi, đọc, đỉnh, dung lượng sau 5 năm.
  3. `solution` — Bản đơn giản nhất: API không state và bảng link theo mã.
  4. `problem` — Sinh mã bằng băm bị va chạm.
  5. `solution` — Đếm rồi mã hóa base 62 bằng bộ đếm cấp theo lô.
  6. `problem` — Ca mã đoán được vì tuần tự: xáo id trước khi mã hóa.
  7. `solution` — Đọc chiếm đa số nên đặt cache.
  8. `tradeoff` — Chọn 301 hay 302.
  9. `solution` — Dữ liệu vài terabyte: chia partition và sao chép qua các zone.
  10. `technique` — Đếm click mà không làm chậm chuyển hướng: sự kiện sang stream.
  11. `problem` — Ca spam: giới hạn tốc độ, kiểm tra đích, hết hạn.
  12. `recap` — Thiết kế hoàn chỉnh.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device, panel (thẻ chữ hoặc biểu đồ).
- **Điểm mô hình đáng học:** Con số dẫn thiết kế; mã không va chạm; đọc nhiều thì cache; đường nóng giữ nguyên khi thêm tính năng.
- **Nâng cấp của mình:** Design Case có Brief từ S0-07, Evolution timeline v1 → vN, chạy 4.000 RPS; `estimate` bước con số; so sánh 301 và 302 bằng số.
- **Map sang bài:** chính S5-02; một phần S1-05.

#### 39. `design-news-feed` — Design a News Feed

- **Level / thời lượng:** intermediate, 14 phút, 12 bước. Chương 09 Whole Systems.
- **Ý chính:** Bài đăng của mọi người bạn theo dõi trong 200 ms, và câu hỏi nên làm việc lúc đọc hay lúc đăng.
- **Metric theo dõi:** `feedMs`, `readWork`, `fanout`, `postDelay`.
- **Trình tự bước:**
  1. `setup` — Đề bài: trang chủ có feed.
  2. `setup` — Đặt con số: lượt tải feed, lượt đăng, số người theo dõi.
  3. `solution` — Bản nháp: dựng feed khi được hỏi bằng cách truy vấn tác giả rồi gộp.
  4. `problem` — Công việc đổ sai chỗ: hàng triệu lượt tra mỗi giây, shard quá tải.
  5. `solution` — Đảo lại: phát bài tới feed của người theo dõi lúc đăng.
  6. `technique` — Chỉ lưu id bài, giới hạn độ dài, lấy nội dung theo lô lúc đọc.
  7. `problem` — Ca năm mươi triệu người theo dõi: ghi gấp bội, backlog.
  8. `solution` — Lai: push cho phần lớn, pull cho tài khoản nổi tiếng.
  9. `tradeoff` — Ca feed không ai đọc: chỉ phát cho người dùng gần đây.
  10. `technique` — Cuộn trang bằng con trỏ thay vì số trang.
  11. `insight` — Ca cache feed bị xóa: dựng lại theo yêu cầu có điều tiết.
  12. `recap` — Thiết kế hoàn chỉnh.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), panel (thẻ chữ hoặc biểu đồ), queue (hàng đợi trước node). Ghi chú: bước có node quá tải (heat): 4.
- **Điểm mô hình đáng học:** Chuyển công việc từ đọc sang ghi; fan-out; hybrid; cursor; dựng lại có điều tiết.
- **Nâng cấp của mình:** Sim fan-out on read/write/hybrid với phân phối follower Zipf; `tune-to-limit` ngưỡng celebrity; Design Case với Evolution timeline.
- **Map sang bài:** chính S5-03.

#### 40. `design-chat` — Design a Chat System

- **Level / thời lượng:** advanced, 14 phút, 12 bước. Chương 09 Whole Systems.
- **Ý chính:** Hai mươi triệu kết nối mở và một lời hứa: mọi tin đến nơi, đúng thứ tự, đúng một lần.
- **Metric theo dõi:** `deliverMs`, `conns`, `canLoseMsg`, `ordered`.
- **Trình tự bước:**
  1. `setup` — Đề bài: ứng dụng chat.
  2. `setup` — Đặt con số: tin mỗi giây, dung lượng, số kết nối đỉnh.
  3. `solution` — Bản nháp: một server, hai socket.
  4. `problem` — Hàng trăm server: gateway chỉ giữ socket, logic chat tách ra dịch vụ không state.
  5. `solution` — Sổ đăng ký ai đang kết nối ở đâu, làm mới bằng heartbeat.
  6. `solution` — Ghi vào kho tin theo hội thoại trước khi chuyển đi; số thứ tự theo hội thoại.
  7. `problem` — Ca người nhận ngoại tuyến: push và đồng bộ theo số thứ tự khi nối lại.
  8. `problem` — Ca gửi hai lần hiện một lần: id tin sinh ở thiết bị, retry dùng lại id; biên nhận.
  9. `technique` — Chat nhóm: lưu một lần, giao cho nhiều thành viên.
  10. `tradeoff` — Hiện diện và "đang gõ" theo luật khác, không lưu.
  11. `problem` — Ca một gateway chết: ứng dụng nối lại với backoff và jitter, đồng bộ từ số cuối.
  12. `recap` — Thiết kế hoàn chỉnh.
- **Thành phần scene dùng:** block (khối server/dịch vụ, có glyph), db, device, panel (thẻ chữ hoặc biểu đồ). Ghi chú: bước có thành phần ngừng hoạt động: 7, 11.
- **Điểm mô hình đáng học:** Kết nối bền làm gateway có state; registry; thứ tự theo hội thoại; idempotent theo id tin; reconnect storm.
- **Nâng cấp của mình:** Case S7-01 với sim gateway chết gây reconnect; `postmortem`; kiểm bất biến "mỗi tin được lưu đúng một lần".
- **Map sang bài:** chính S7-01; một phần S6-04.

## 5. Mẫu hình chung rút ra

- Hầu hết bài theo nhịp: bối cảnh → vấn đề (thường là một thành phần đỏ, hàng đợi dồn hoặc lỗi lan) → giải pháp → một hoặc hai ca ("Case: …") phát hiện ra giới hạn của giải pháp → tóm tắt. Nhịp này khớp với vòng học Xem → Đoán → Phá → Sửa → Giải thích của dự án; ở sdmastery các bước "Case" nên là chỗ người học tự tiêm lỗi hoặc tự chỉnh tham số.
- Cùng một nhóm primitive tái xuất hiện ở nhiều bài (LB, app, cache, DB, queue, storage); chỉ khác trạng thái và kết nối. Xác nhận lựa chọn `SystemModel` là một đồ thị có tham số, scene là phép chiếu của nó.
- Một số khái niệm cần góc nhìn khác ngoài sơ đồ khối: vòng băm (Data view), lịch sử đọc/ghi nhiều client (Time view), biểu đồ latency theo utilization (Capacity view), bố cục bit và B-tree (`memory-2d`).
- Metric mỗi bài chỉ có 3 đến 5 chỉ số, chọn đúng chỉ số làm nên câu chuyện (ví dụ `hitRate`, `lag`, `oversold`). Gợi ý: bài của dự án khai báo trước các metric chính để người học biết cần nhìn đâu.
- Các bài về bảo mật, kiểm thử và CI/CD dùng sơ đồ chủ yếu như minh họa luồng; phần học nằm ở việc chọn đúng biện pháp. Ở sdmastery các bài này không ép mô phỏng (xem guidelines §1).

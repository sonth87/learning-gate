## 1. Bài toán Video Streaming: bất đối xứng giữa tải lên và phát lại

```step
category: SETUP
short: Bức tranh tổng
scene: s1-overview
callout:
  kind: key-idea
  title: Hai đường đi tách biệt
  vi: "Luồng tải lên (Write) tốn CPU để chuyển mã nên đi bất đồng bộ qua hàng đợi. Luồng xem video (Read) chiếm hơn 85–99% lưu lượng nên đi qua CDN Edge."
whatChanged:
  - "+ Tách luồng Upload → Queue → Workers → Blob khỏi luồng CDN Edge"
telemetry:
  - label: "Tỷ lệ đọc / ghi"
    value: "85% / 15% (thực tế > 100:1)"
  - label: "Độ phân giải"
    value: "4 bậc (360p–1080p)"
```

Một nền tảng Video Streaming phục vụ hai nhóm người dùng với đặc tính tải hoàn toàn trái ngược:

- **Tác giả tải video lên (Upload):** File gốc kích thước lớn (vài trăm MB đến hàng GB), cần kiểm tra định dạng và chuyển mã sang nhiều độ phân giải. Quá trình này tốn nhiều CPU và mất hàng chục giây đến vài phút.
- **Người xem phát video (Playback):** Yêu cầu độ trễ khởi phát thấp (dưới 1–2 giây), phát mượt không giật hình khi tốc độ mạng thay đổi, và phục vụ hàng trăm nghìn người xem cùng lúc cho một video thịnh hành.

Vì vậy, kiến trúc chuẩn tách hẳn hai đường: luồng ghi xử lý bất đồng bộ qua `transcode_queue` và `workers`, còn luồng đọc dựa vào `cdn` đặt trước `blob`.

## 2. Tải lên trực tiếp theo mảnh (Direct Chunked Upload)

```step
category: MECHANISM
short: Upload theo mảnh
scene: s2-upload
callout:
  kind: technique
  title: Không đẩy byte qua API
  vi: "Dùng Presigned URL để trình duyệt đẩy từng mảnh 5–10 MB trực tiếp lên Object Storage, giải phóng Upload Gateway."
whatChanged:
  - "+ Upload Gateway cấp Presigned URL thay vì trung chuyển file"
  - "~ Hỗ trợ nối lại từng mảnh khi mạng di động chập chờn"
telemetry:
  - label: "Kích thước chunk"
    value: "5–10 MB"
  - label: "Tải qua API"
    value: "Chỉ metadata"
    tone: ok
```

Nếu cho file video 2 GB đi xuyên qua máy chủ ứng dụng rồi mới đẩy sang Object Storage, băng thông và bộ nhớ của tầng API sẽ bị chiếm dụng trong nhiều phút. Cách giải quyết:

1. Client gọi `upload` để xin phiên tải lên và nhận danh sách **Presigned URL** (có thời hạn ngắn, gắn quyền ghi duy nhất vào bucket tạm).
2. Client cắt video thành các mảnh (chunk) 5–10 MB và tải song song trực tiếp lên Object Storage. Nếu rớt mạng ở mảnh thứ 42, client chỉ cần tải lại đúng mảnh đó.
3. Khi đủ mảnh, `upload` xác nhận hoàn tất và đẩy một thông điệp nhẹ chứa `videoId` vào `transcode_queue`.

## 3. Chuyển mã bất đồng bộ và DAG đa độ phân giải

```step
category: MECHANISM
short: Chuyển mã DAG
scene: s3-transcode
callout:
  kind: good-to-know
  vi: "Chia video gốc thành nhiều đoạn độc lập (theo GOP) giúp nhiều Transcode Worker xử lý song song thay vì đợi một máy nén hết cả file dài."
whatChanged:
  - "+ Workers kéo job từ transcode_queue để nén 4 độ phân giải"
  - "~ Kết quả xuất thành đoạn 4–6 giây kèm manifest lưu vào Blob"
telemetry:
  - label: "Worker mặc định"
    value: "2 × 140 ops/s"
  - label: "Đầu ra"
    value: "1080p, 720p, 480p, 360p"
```

Một file video gốc (ví dụ MP4 4K) không thể phát trực tiếp cho mọi thiết bị vì người dùng 4G yếu sẽ bị đứng hình liên tục. `workers` chạy quy trình chuyển mã gồm các bước:

- Tách video gốc thành các đoạn nhỏ theo ranh giới khung hình chính (GOP — Group of Pictures).
- Nén song song thành nhiều phiên bản chất lượng: **1080p** (~5 Mbps), **720p** (~2,5 Mbps), **480p** (~1 Mbps), **360p** (~500 Kbps).
- Ghi toàn bộ các đoạn video (`.ts` hoặc `.m4s`) cùng tệp chỉ mục manifest (`.m3u8` cho HLS, `.mpd` cho DASH) vào `blob`.

Việc tách theo hàng đợi giúp tách rời trải nghiệm người tải lên (nhận phản hồi "Đang xử lý" ngay lập tức) khỏi thời gian nén CPU nặng nề.

## 4. Adaptive Bitrate Streaming (HLS và DASH)

```step
category: TECHNIQUE
short: Adaptive Bitrate
scene: s4-abr
callout:
  kind: key-idea
  title: Chuyển chất lượng mượt mà
  vi: "Trình phát tự đo băng thông sau mỗi đoạn 4–6 giây và chọn độ phân giải phù hợp từ manifest mà không cần tải lại từ đầu."
whatChanged:
  - "+ Client đọc manifest rồi tải từng đoạn 4–6 giây qua CDN"
telemetry:
  - label: "Độ dài segment"
    value: "4–6 giây"
  - label: "Giao thức"
    value: "HTTP (HLS / DASH)"
```

Thay vì mở một kết nối tải liên tục cả bộ phim, **Adaptive Bitrate (ABR)** dùng giao thức HTTP thông thường:

1. Trình phát tải tệp manifest (`.m3u8` hoặc `.mpd`) liệt kê đường dẫn các chất lượng sẵn có.
2. Trình phát tải đoạn 1 ở mức 720p. Nếu thấy tải xong nhanh và bộ đệm đầy, đoạn 2 sẽ tự động nâng lên 1080p.
3. Khi người dùng vào thang máy làm băng thông tụt xuống, đoạn 3 lập tức hạ xuống 360p để giữ phát liên tục.

Vì mỗi đoạn chỉ là một tệp tĩnh nhỏ qua HTTP, toàn bộ hạ tầng CDN tiêu chuẩn đều có thể lưu đệm (cache) dễ dàng.

## 5. Mô phỏng trực tiếp: đột biến tải lên và bão hoà Worker

```step
category: PROBLEM
short: Spike tải lên
scene: s5-live
live: streaming
callout:
  kind: watch-out
  title: Hàng đợi tăng khi Worker hụt hơi
  vi: "Trong đợt spike 2.600 req/s ở giây 15, 15% tải ghi (~390 ops/s) vượt quá năng lực 280 ops/s của 2 Worker, khiến độ trễ đuôi tăng vọt."
whatChanged:
  - "~ Spike tải từ 400 lên 2.600 req/s bắt đầu từ giây 15"
  - "~ Quan sát thanh chỉnh số Worker và dung lượng đệm CDN"
telemetry:
  - label: "Đỉnh spike"
    value: "2.600 req/s"
    tone: warn
  - label: "Năng lực 2 Worker"
    value: "280 ops/s"
    tone: bad
```

Ở kịch bản mô phỏng trực tiếp, lưu lượng tăng đột biến từ 400 lên 2.600 req/s tại giây thứ 15 và giữ trong 25 giây:

- **Nhánh ghi (15%):** Đạt khoảng 390 req/s, trong khi 2 `workers` chỉ xử lý tối đa 2 × 140 = 280 ops/s. `transcode_queue` giữ phần dư nhưng thời gian chờ và độ trễ đuôi vượt ngưỡng SLO 150 ms.
- **Nhánh đọc (85%):** Đạt khoảng 2.210 req/s. Khi `cdn` có dung lượng đệm mặc định (20.000 key trên tập nóng 40.000 key), một phần đáng kể miss vẫn rơi xuống `blob`.

Hãy thử tăng số `workers` lên 4 và mở rộng `capacityKeys` của `cdn` lên 40.000 để xem độ trễ p99 hạ xuống ổn định.

## 6. Phân phối CDN Edge và tối ưu chi phí băng thông

```step
category: TECHNIQUE
short: Tối ưu CDN
scene: s6-cdn-cost
activity: S7-05.A1
gate: optional
callout:
  kind: key-idea
  title: CDN bảo vệ Origin và túi tiền
  vi: "Video viral tuân theo phân phối lệch: 20% video nóng chiếm hơn 80% lượt xem. Giữ Hit Ratio CDN trên 90% giúp cắt giảm mạnh chi phí Egress từ Origin."
whatChanged:
  - "+ CDN Edge hấp thụ 90–95% lượt đọc đoạn video phổ biến"
  - "~ Origin Shield gộp các Cache Miss cùng lúc từ nhiều vùng"
telemetry:
  - label: "CDN Hit Ratio mục tiêu"
    value: "≥ 92%"
    tone: ok
  - label: "Lưu trữ đa bản"
    value: "≈ 2×–2,5× file gốc"
```

Chi phí lớn nhất của nền tảng video nằm ở **băng thông Egress** (lưu lượng truyền ra ngoài Internet) và **lưu trữ đa phiên bản**:

- **Lưu trữ:** 4 bản (1080p, 720p, 480p, 360p) cộng thêm bản gốc thường chiếm khoảng 2× đến 2,5× dung lượng file gốc. Có thể nén bằng codec mới hơn (AV1/HEVC) cho video nhiều lượt xem, hoặc áp dụng **chuyển mã theo yêu cầu (Just-in-Time)** cho video ít người xem.
- **Origin Shield:** Đặt một lớp đệm trung gian giữa các điểm CDN Edge toàn cầu và `blob` để khi một video mới vừa viral ở 20 quốc gia cùng lúc, `blob` chỉ phải phục vụ 1 lần thay vì 20 lần.

## 7. Tìm giới hạn bền vững của cấu hình hiện tại

```step
category: TECHNIQUE
short: Tìm ngưỡng tải
scene: s6-cdn-cost
activity: S7-05.A2
gate: required
callout:
  kind: technique
  title: Tính tải tối đa từ điểm nghẽn
  vi: "Lấy năng lực của thành phần có mức sử dụng cao nhất chia cho tỷ trọng lưu lượng đi qua nó."
whatChanged:
  - "~ Kiểm tra ngưỡng lưu lượng tối đa trước khi p99 > 150 ms"
telemetry:
  - label: "Mục tiêu p99"
    value: "≤ 150 ms"
  - label: "Mục tiêu lỗi"
    value: "≤ 1%"
```

Trước khi chạy mô phỏng để tìm giới hạn, hãy quan sát tác động của cả hai nhánh lên độ trễ p99:

- Nhánh đọc (85%) đi qua `cdn` (20.000 trên 40.000 key nóng), phần Cache Miss rơi xuống `blob`.
- Nhánh ghi (15%) đi qua `upload` và `transcode_queue` tới `workers`.

Hãy dùng bài tập tương tác để tìm ngưỡng tải tối đa mà hệ thống vẫn giữ p99 ≤ 150 ms và tỷ lệ lỗi ≤ 1% (xung quanh mức 3.600 req/s).

## 8. Sai lầm phổ biến: chuyển mã đồng bộ và bỏ qua CDN

```step
category: PITFALL
short: Sai lầm thiết kế
scene: s7-pitfall
callout:
  kind: watch-out
  title: Không giữ kết nối HTTP chờ chuyển mã
  vi: "Chuyển mã một video 10 phút có thể mất vài phút; giữ kết nối HTTP đồng bộ làm cạn Thread Pool và Timeout hàng loạt."
whatChanged:
  - "~ Mô phỏng nghẽn khi Upload Gateway xử lý đồng bộ"
telemetry:
  - label: "Upload Gateway ρ"
    value: "≈ 0,98 (quá tải)"
    tone: bad
```

Hai sai lầm thường gặp khi xây dựng hệ thống video từ đầu:

1. **Chuyển mã đồng bộ ngay trong request upload:** Chỉ cần vài chục người tải lên cùng lúc, toàn bộ worker/thread của API sẽ bị treo cứng chờ FFmpeg chạy xong.
2. **Phục vụ video trực tiếp từ Object Storage không qua CDN:** Độ trễ khởi phát tăng cao ở các vùng địa lý xa, đồng thời chi phí Egress từ đám mây đắt hơn nhiều lần so với CDN chuyên dụng.

## 9. Tóm tắt kiến trúc Video Streaming

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Bốn trụ cột chính
  vi: "Presigned URL cho upload, Queue + Worker cho chuyển mã song song, HLS/DASH cho Adaptive Bitrate, và CDN Edge để gánh 90%+ lượt xem."
whatChanged:
  - "+ Tổng kết toàn bộ luồng dữ liệu và điểm tối ưu chi phí"
telemetry:
  - label: "Upload"
    value: "Chunked Presigned URL"
  - label: "Phát lại"
    value: "ABR + CDN Edge"
```

Khi thiết kế nền tảng Video Streaming trong phỏng vấn hoặc thực tế, hãy luôn bám sát 4 quyết định cốt lõi:

1. **Tải lên trực tiếp theo mảnh:** Dùng Presigned URL đẩy thẳng lên Object Storage để tầng API luôn nhẹ.
2. **Chuyển mã bất đồng bộ qua hàng đợi:** Chia nhỏ theo GOP, nén đa độ phân giải song song và tự mở rộng Worker theo độ sâu hàng đợi.
3. **Adaptive Bitrate (HLS/DASH):** Đóng gói đoạn 4–6 giây qua HTTP để trình phát tự đổi chất lượng theo băng thông.
4. **CDN + Origin Shield:** Đẩy tỷ lệ Cache Hit lên trên 90% để giảm độ trễ cho người xem và tiết kiệm chi phí Egress ở Origin.

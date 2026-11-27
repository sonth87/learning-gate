## 1. Sao chép Leader-Follower: tách tải đọc và duy trì bản sao dự phòng

```step
category: SETUP
short: Leader-Follower
scene: s1-leader-follower
callout:
  kind: key-idea
  title: Một điểm ghi, nhiều điểm đọc
  vi: "Mọi thao tác làm thay đổi dữ liệu đều đi vào Leader; các Follower nhận luồng nhật ký từ Leader để phục vụ truy vấn đọc và sẵn sàng thay thế khi Leader hỏng."
whatChanged:
  - "+ App Router tách 25% ghi vào Primary và 75% đọc sang Read Replicas"
  - "+ Primary truyền liên tục dòng nhật ký WAL sang cụm Read Replicas"
telemetry:
  - label: "Luồng ghi (Leader)"
    value: "400 ops/s"
    tone: ok
  - label: "Luồng đọc (Replicas)"
    value: "1.200 ops/s"
    tone: ok
  - label: "Replication Lag nền"
    value: "≈ 0,5 ms"
    tone: ok
```

Ở bài S2-03, ta đã thấy **Read Replica** giúp nhân rộng năng lực đọc cho cơ sở dữ liệu. Mô hình nền tảng đằng sau đó là **Sao chép Leader-Follower** (còn gọi là Primary-Replica):

- **Leader (Primary):** máy duy nhất tiếp nhận các giao dịch ghi (`INSERT`, `UPDATE`, `DELETE`), kiểm tra ràng buộc toàn vẹn và ghi biến đổi vào nhật ký tuần tự (**Write-Ahead Log — WAL** trong PostgreSQL hoặc **Binlog** trong MySQL).
- **Follower (Read Replica):** kéo luồng nhật ký từ Leader về và áp lại đúng thứ tự thay đổi lên dữ liệu cục bộ để trả lời các câu lệnh `SELECT`.

Khi lưu lượng vừa phải (1.600 req/s), Follower áp kịp dòng WAL ngay khi nhận được, nên độ lệch thời gian giữa hai bên chỉ khoảng nửa mili-giây mạng nội bộ.

## 2. Cơ chế phát sinh độ trễ sao chép (Replication Lag)

```step
category: MECHANISM
short: Độ trễ sao chép
scene: s2-wal-pipeline
callout:
  kind: good-to-know
  title: Lag không phải hằng số cố định
  vi: "Replication Lag co giãn liên tục theo chênh lệch giữa tốc độ ghi mới trên Leader và tốc độ áp lại nhật ký trên từng Follower."
whatChanged:
  - "+ Tách 5 bước từ lúc Leader ghi WAL đến lúc dữ liệu hiển thị trên Follower"
  - "~ Hàng đợi áp nhật ký tại Follower là nơi gây trễ lớn nhất khi tải tăng"
telemetry:
  - label: "Điều kiện ổn định"
    value: "w_Leader ≤ apply_Follower"
    tone: ok
  - label: "Khi vượt ngưỡng"
    value: "Lag tích luỹ theo giây"
    tone: warn
```

Trong chế độ **sao chép bất đồng bộ (Asynchronous Replication)** mặc định của hầu hết hệ quản trị, Leader trả lời thành công cho ứng dụng ngay ở bước 2 (khi đã lưu xong WAL trên đĩa của chính nó), không đợi Follower áp xong.

**Độ trễ sao chép (Replication Lag)** là khoảng thời gian từ lúc giao dịch cam kết trên Leader đến lúc bản ghi đó đọc thấy được trên Follower. Lag tăng vọt khi gặp một trong ba tình huống:
1. **Đợt ghi tăng đột biến** (ví dụ chạy job cập nhật lô hàng loạt hàng nghìn dòng mỗi giây).
2. **Follower quá bận phục vụ truy vấn đọc** (CPU/I/O cao làm tốc độ áp WAL `applyRps` tụt xuống dưới tốc độ ghi `wP` của Leader).
3. **Giao dịch dài hoặc truy vấn báo cáo nặng** giữ khoá trên Follower làm luồng áp nhật ký phải đứng chờ.

## 3. Quan sát tải ghi tăng vọt: Replication Lag vượt ngưỡng gây đọc cũ (Stale Read)

```step
category: PROBLEM
short: Đọc dữ liệu cũ
scene: s3-live-lag
live: lag-surge
callout:
  kind: watch-out
  title: Dữ liệu chưa tới kịp trông giống hệt dữ liệu bị mất
  vi: "Người dùng vừa đổi mật khẩu hoặc địa chỉ giao hàng, tải lại trang mà trúng Follower đang trễ 2 giây sẽ thấy thông tin cũ và tưởng hệ thống lưu lỗi."
whatChanged:
  - "~ Từ t = 15..45 s, tải tăng lên 4.000 req/s (1.000 lượt ghi/giây)"
  - "~ Read Replicas bật cảnh báo LAG do tốc độ ghi vượt năng lực áp nhật ký"
```

Quan sát kịch bản mô phỏng khi lưu lượng tăng lên đỉnh 4.000 req/s trong khoảng **t = 15..45 s**:

- Lượng ghi vào `Primary` đạt `0,25 × 4.000 = 1.000` lượt/giây (`ρ ≈ 0,45`, Primary xử lý rất nhẹ nhàng).
- Cùng lúc, 2 máy `Read Replicas` phải gánh 3.000 lượt đọc/giây (`ρ ≈ 0,83`), khiến năng lực áp lại nhật ký thực tế giảm xuống khoảng 910 lượt ghi/giây.
- Phần chênh `1.000 − 910 = 90` lượt ghi/giây xếp hàng chờ áp trên Follower: `lagMs` vọt qua ngưỡng 200 ms lên hơn 1.400 ms, bật nhãn **LAG** và kéo tỷ lệ **đọc dữ liệu cũ (`staleReadPct`)** tăng cao suốt đợt đỉnh tải, trước khi tự xả về 0,5 ms sau giây 45.

Hãy thử kéo thanh **Số Read Replica** từ 2 lên 4: mức bận đọc giảm một nửa giúp Follower dành lại I/O cho luồng áp WAL, hạ mạnh độ trễ sao chép.

## 4. Đảm bảo Read-Your-Writes và Monotonic Reads ở tầng định tuyến

```step
category: TECHNIQUE
short: Đọc bản vừa ghi
scene: s4-ryw
activity: S2-08.A1
gate: optional
callout:
  kind: technique
  title: Chỉ ghim về Leader đúng người vừa ghi
  vi: "Định tuyến có chọn lọc giúp người tác giả luôn thấy ngay thay đổi của mình, trong khi 95% lượt đọc của người xem khác vẫn hưởng lợi từ Read Replicas."
whatChanged:
  - "+ App Router ghim lượt đọc của người vừa sửa dữ liệu về Primary trong cửa sổ ngắn"
  - "+ Theo dõi số thứ tự nhật ký LSN để ngăn hiện tượng đọc lùi thời gian"
telemetry:
  - label: "Bảo đảm 1"
    value: "Read-Your-Writes"
    tone: ok
  - label: "Bảo đảm 2"
    value: "Monotonic Reads"
    tone: ok
```

Ta không cần tắt toàn bộ Read Replica để tránh lỗi giao diện hiển thị dữ liệu cũ. Thay vào đó, tầng `App Router` áp dụng hai bảo đảm nhất quán theo phiên:

1. **Read-Your-Writes (Đọc thấy bản mình vừa ghi):**
   - *Theo cửa sổ thời gian:* khi người dùng An vừa cập nhật hồ sơ, ứng dụng gắn dấu mốc thời gian ghi cuối (trong token/session); trong 5–10 giây kế tiếp, mọi lượt đọc hồ sơ của riêng An được đẩy thẳng vào `Leader`, còn người dùng khác xem trang An vẫn đọc từ `Follower`.
   - *Theo vị trí nhật ký (WAL LSN / GTID):* phản hồi ghi trả về số thứ tự log `LSN = 980`; ở lượt đọc kế, Router chỉ chọn Follower nào đã áp tới `LSN ≥ 980`, nếu chưa có thì hỏi `Leader`.
2. **Monotonic Reads (Đọc đơn điệu, không lùi ngược):** gắn người dùng cố định vào một Follower (theo mã phiên) hoặc kiểm tra LSN tối thiểu đã thấy, tránh việc lần đọc đầu trúng Follower mới (thấy bình luận) nhưng bấm F5 lại rơi vào Follower trễ hơn (bình luận biến mất).

## 5. Ba chế độ sao chép: Bất đồng bộ, Bán đồng bộ và Đồng bộ hoàn toàn

```step
category: MECHANISM
short: Đồng bộ & Async
scene: s5-sync-modes
callout:
  kind: compare
  title: Cân bằng giữa Độ trễ ghi và Mất dữ liệu khi sập (RPO)
  vi: "Sao chép bán đồng bộ (Semi-synchronous) là điểm cân bằng phổ biến cho dữ liệu quan trọng: ít nhất một bản dự phòng luôn giữ đủ nhật ký mới nhất."
whatChanged:
  - "+ Đối chiếu 3 mức xác nhận nhật ký giữa Leader và các Follower"
  - "~ Cấu hình Semi-sync yêu cầu tối thiểu 1 Follower xác nhận đã lưu WAL"
telemetry:
  - label: "Async"
    value: "Nhanh nhất · RPO > 0"
    tone: warn
  - label: "Semi-sync (1 standby)"
    value: "RPO = 0 · trễ +1 RTT"
    tone: ok
```

Tuỳ mức độ nhạy cảm của dữ liệu, hệ quản trị cho phép chọn thời điểm Leader trả lời thành công cho lệnh `COMMIT`:

| Chế độ | Khi nào Leader báo COMMIT xong? | Ưu điểm | Đánh đổi |
|---|---|---|---|
| **Asynchronous** (Bất đồng bộ) | Ngay khi Leader ghi xong đĩa cục bộ | Độ trễ ghi thấp nhất; Follower chậm không kéo Leader chậm | Nếu Leader hỏng đĩa đột ngột, các giao dịch chưa kịp truyền đi bị mất (`RPO > 0`) |
| **Semi-synchronous** (Bán đồng bộ) | Leader + **ít nhất 1** Follower ghi xong WAL | Đảm bảo luôn còn tối thiểu 1 Follower giữ đủ dữ liệu (`RPO = 0`) | Tốn thêm 1 vòng mạng nội bộ (~1–2 ms) cho mỗi giao dịch ghi |
| **Synchronous** (Đồng bộ hết) | Đợi **tất cả** Follower xác nhận | Mọi bản sao luôn giống hệt nhau | Chỉ 1 Follower chậm hoặc đứt mạng là toàn bộ lệnh ghi bị treo |

## 6. Quan sát sự cố Leader dừng hoạt động: đọc vẫn sống, ghi bị gián đoạn

```step
category: PROBLEM
short: Leader ngừng
scene: s6-live-failover
live: failover
activity: S2-08.A2
gate: optional
callout:
  kind: watch-out
  title: Tách đọc/ghi giúp giảm bán kính sự cố nhưng chưa tự khôi phục ghi
  vi: "Khi Primary ngừng chạy mà chưa thăng cấp bản sao, các lượt đọc trên Read Replicas vẫn thành công nhưng toàn bộ lượt ghi đều thất bại."
whatChanged:
  - "~ Tại t = 20 s, Primary dừng hoạt động đột ngột đến t = 38 s"
  - "~ 80% lưu lượng (đọc) giữ thành công; 20% lưu lượng (ghi) báo lỗi"
```

Trong kịch bản mô phỏng thứ hai (2.500 req/s ổn định, gồm 80% đọc và 20% ghi), tại **t = 20 s** máy `Primary` ngừng hoạt động:

- Toàn bộ 2.000 lượt đọc/giây đi qua đường `app → replica` tiếp tục được phục vụ bình thường vì các `Read Replicas` hoạt động độc lập.
- Toàn bộ 500 lượt ghi/giây đi vào `app → primary` bị từ chối ngay lập tức, làm tỷ lệ lỗi toàn cục nhảy từ 0% lên đúng **20%** (bằng tỷ trọng ghi của hệ thống).
- Trạng thái mất khả năng ghi này kéo dài suốt khoảng thời gian phát hiện lỗi và chuyển đổi dự phòng (**RTO — Recovery Time Objective**).

## 7. Quy trình chuyển đổi dự phòng (Failover) và bẫy hai Leader (Split-Brain)

```step
category: TECHNIQUE
short: Quy trình bầu
scene: s7-failover-steps
callout:
  kind: watch-out
  title: Rủi ro Split-Brain khi mạng chập chờn
  vi: "Nếu Leader cũ chỉ bị nghẽn mạng tạm thời mà chưa bị cắt quyền ghi khi Follower đã thăng cấp, hệ thống sẽ có hai Leader cùng nhận ghi và làm hỏng dữ liệu."
whatChanged:
  - "+ Chuẩn hoá 4 bước Failover tự động của bộ điều phối (Orchestrator)"
  - "+ Bắt buộc bước cô lập (Fencing) Leader cũ trước khi mở ghi ở Leader mới"
telemetry:
  - label: "Tiêu chí chọn Leader mới"
    value: "WAL LSN cao nhất"
    tone: ok
  - label: "Cơ chế chống Split-Brain"
    value: "Fencing / Epoch Token"
    tone: warn
```

Để khôi phục luồng ghi khi Leader ngừng phản hồi, bộ điều phối cụm (như Patroni, Orchestrator hoặc RDS Multi-AZ) thực hiện 4 bước **Failover**:

1. **Phát hiện ngừng hoạt động:** nhịp tim (heartbeat) thất bại liên tục quá ngưỡng (thường 10–15 giây để tránh báo động giả do GC hoặc nghẽn mạng ngắn).
2. **Cô lập Leader cũ (Fencing / STONITH):** thu hồi quyền ghi trên tầng lưu trữ dùng chung, gắn số hiệu nhiệm kỳ (**epoch / fencing token**) tăng dần hoặc tắt nguồn máy cũ để chắc chắn nó không thể tiếp tục nhận lệnh ghi lẻ tẻ (**tránh Split-Brain**).
3. **Thăng cấp Follower (Promote):** chọn bản sao có vị trí nhật ký `LSN` mới nhất, áp nốt phần WAL còn tồn rồi chuyển sang chế độ đọc/ghi làm Leader mới.
4. **Cập nhật định tuyến:** trỏ VIP, bản ghi DNS TTL ngắn hoặc cấu hình ProxySQL của `App Router` sang Leader mới; các Follower còn lại đổi nguồn sao chép theo Leader mới.

## 8. Sai lầm phổ biến: nhầm lẫn Replication với Backup

```step
category: PITFALL
short: Cần bản sao lưu
scene: s8-not-backup
activity: S2-08.A3
gate: required
callout:
  kind: key-idea
  title: Replication chống hỏng phần cứng, Backup chống lỗi con người và phần mềm
  vi: "Câu lệnh DROP TABLE hay DELETE thiếu mệnh đề WHERE là giao dịch hợp lệ nên sẽ được sao chép sang toàn bộ Read Replicas chỉ sau vài trăm mili-giây."
whatChanged:
  - "~ Lệnh xoá nhầm trên Primary lan qua luồng WAL sang mọi Read Replicas"
  - "+ Dùng Snapshot định kỳ kèm kho lưu trữ WAL để khôi phục theo mốc giờ (PITR)"
telemetry:
  - label: "Lỗi phần cứng 1 máy"
    value: "Failover sang Replica"
    tone: ok
  - label: "Lỗi xoá nhầm dữ liệu"
    value: "Khôi phục từ PITR"
    tone: warn
```

Có 3 Read Replicas không có nghĩa là dữ liệu đã an toàn trước mọi rủi ro. **Replication** được thiết kế để phản chiếu trung thực trạng thái hiện tại, nên một bản phát hành mã lỗi hoặc câu lệnh migration xoá nhầm cột/bảng trên `Primary` sẽ được truyền nguyên vẹn sang tất cả `Follower` gần như tức khắc.

Để bảo vệ dữ liệu trọn vẹn, kiến trúc sản xuất luôn kết hợp cả hai lớp:
- **Replication (Multi-AZ):** duy trì tính sẵn sàng cao (HA) để chuyển đổi nhanh trong vài chục giây khi hỏng ổ đĩa, mất nguồn hoặc bảo trì máy chủ.
- **Backup + Point-in-Time Recovery (PITR):** chụp ảnh toàn bộ đĩa (Snapshot) định kỳ ra kho lưu trữ bất biến (Object Storage) kèm lưu trữ liên tục các đoạn tệp WAL, cho phép tua ngược cơ sở dữ liệu về đúng giây ngay trước khi câu lệnh xoá nhầm được chạy.

## 9. Tóm tắt: danh mục kiểm tra khi thiết kế cụm Replication

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Ba câu hỏi bắt buộc trước khi bật Read Replicas
  vi: "Ứng dụng xử lý thế nào khi Follower trễ 2 giây? Làm sao người vừa ghi đọc lại đúng dữ liệu mới? Và nếu Leader sập ngay lúc này thì mất tối đa bao nhiêu bản ghi?"
whatChanged:
  - "+ Tổng hợp cơ chế vận hành cụm Leader–Follower an toàn ở quy mô lớn"
telemetry:
  - label: "Đọc sau khi vừa ghi"
    value: "Định tuyến về Leader"
    tone: ok
  - label: "Dữ liệu tài chính"
    value: "Semi-sync + PITR"
    tone: ok
```

Ghi nhớ bốn điểm cốt lõi của bài học:

1. **Replication Lag là tất yếu ở chế độ bất đồng bộ:** khi tải ghi tăng hoặc Follower quá bận đọc, hàng đợi áp WAL dài ra làm xuất hiện lượt đọc dữ liệu cũ (`Stale Read`).
2. **Bảo vệ trải nghiệm người dùng bằng định tuyến thông minh:** dùng cửa sổ thời gian hoặc vị trí `WAL LSN` để định tuyến về Leader cho **Read-Your-Writes**, và ghim phiên/kiểm LSN cho **Monotonic Reads**.
3. **Chọn mức đồng bộ theo mục tiêu RPO:** dùng **Semi-synchronous** (đợi ít nhất 1 Follower lưu xong WAL) cho đơn hàng và tài chính để không mất giao dịch đã cam kết khi Leader hỏng.
4. **Failover an toàn cần Fencing và PITR:** luôn khoá quyền ghi của Leader cũ để chặn **Split-Brain**, và duy trì bản sao lưu **PITR** độc lập vì sao chép không cứu được lỗi xoá nhầm dữ liệu.

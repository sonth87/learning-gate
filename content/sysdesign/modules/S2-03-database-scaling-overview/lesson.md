## 1. Vì sao Database thường chạm điểm nghẽn trước tầng ứng dụng?

```step
category: SETUP
short: Nghẽn ở DB
scene: s1-single
callout:
  kind: key-idea
  title: Khác biệt giữa có và không trạng thái
  vi: "Tầng App không giữ dữ liệu nên thêm máy là tăng ngay thông lượng; tầng Database phải bảo toàn dữ liệu trên đĩa và tính nhất quán nên khó nhân bản tự do."
whatChanged:
  - "+ Cụm 6 máy App (12.000 req/s) gửi toàn bộ truy vấn vào 1 Database đơn lẻ"
  - "~ Database chạm ngưỡng ρ ≈ 1 và đồng thời là điểm lỗi đơn (SPOF)"
telemetry:
  - label: "Năng lực App"
    value: "12.000 req/s"
    tone: ok
  - label: "Database đơn"
    value: "1.500 req/s · SPOF"
    tone: bad
```

Khi lưu lượng truy cập tăng gấp nhiều lần, tầng cơ sở dữ liệu hầu như luôn trở thành điểm nghẽn sớm nhất vì ba nguyên nhân vật lý và kiến trúc:

1. **Tốc độ I/O lưu trữ bền vững.** Truy xuất bộ nhớ RAM chỉ mất cỡ trăm nano-giây, trong khi đọc ghi SSD và đồng bộ nhật ký xuống đĩa (`fsync`) chậm hơn từ hàng trăm đến hàng nghìn lần.
2. **Trạng thái dùng chung (Shared State).** Các máy chủ ứng dụng phi trạng thái xử lý độc lập nhau, còn Database phải duy trì khóa dòng, chỉ mục và thứ tự giao dịch nhất quán cho mọi người dùng.
3. **Điểm lỗi đơn (Single Point of Failure).** Dù phía trước có 10 máy App khoẻ mạnh, nếu máy Database duy nhất ngừng hoạt động thì toàn bộ hệ thống đều trả lỗi.

## 2. Bậc 1 — Nâng cấp dọc (Vertical Scale-up): nhanh gọn nhưng sớm đụng trần

```step
category: TECHNIQUE
short: Scale-up dọc
scene: s2-vertical
callout:
  kind: good-to-know
  vi: "Ở giai đoạn đầu, nâng cấp máy Database lớn hơn thường rẻ hơn nhiều so với chi phí kỹ sư vận hành một hệ phân tán phức tạp."
whatChanged:
  - "~ Tăng cỡ máy Primary DB (sizeFactor) thêm vCPU, RAM và băng thông NVMe"
  - "~ Không cần sửa mã nguồn ứng dụng, giữ nguyên giao dịch ACID"
telemetry:
  - label: "Đổi mã nguồn"
    value: "0 dòng"
    tone: ok
  - label: "Đường cong giá"
    value: "Tăng nhanh hơn hiệu năng"
    tone: warn
```

**Vertical Scaling (Scale-up)** là nâng cấp phần cứng cho cùng một máy Database: tăng từ 8 vCPU / 32 GB RAM lên 64 vCPU / 512 GB RAM và đĩa NVMe IOPS cao hơn.

Ưu điểm lớn nhất là **không phát sinh độ phức tạp phân tán**: mọi câu truy vấn `JOIN`, khoá ngoại và giao dịch ACID giữ nguyên như cũ. Với phần lớn sản phẩm giai đoạn đầu hoặc tải có ngưỡng dự đoán được, kết hợp tối ưu chỉ mục với nâng cấp dọc là hướng đi hợp lý nhất.

Tuy nhiên, nâng cấp dọc có ba rào cản rõ rệt: phần cứng một máy có trần vật lý hữu hạn, giá thuê các cỡ máy cực lớn tăng nhanh hơn mức tăng thông lượng, và một máy chủ duy nhất vẫn là điểm lỗi đơn kèm thời gian gián đoạn khi khởi động lại.

## 3. Bậc 2 — Read Replicas: tách luồng đọc ra khỏi luồng ghi

```step
category: MECHANISM
short: Read Replicas
scene: s3-replica
callout:
  kind: key-idea
  title: Khai thác tỷ lệ đọc áp đảo
  vi: "Đa số ứng dụng web có 80%–95% truy vấn là đọc. Đẩy lượt đọc sang các bản sao giúp nhân rộng năng lực đọc gần như tuyến tính."
whatChanged:
  - "+ Thêm cụm Read Replicas nhận luồng sao chép bất đồng bộ từ Primary DB"
  - "~ App gửi mọi lệnh ghi (15%) vào Primary và chia lệnh đọc (85%) sang Replicas"
telemetry:
  - label: "Tỷ lệ đọc : ghi"
    value: "85% : 15%"
  - label: "Chế độ đồng bộ"
    value: "Async Replication"
    tone: warn
```

Trong kiến trúc **Primary – Read Replica** (hay Leader – Follower), chỉ một máy **Primary** tiếp nhận lệnh ghi (`INSERT`, `UPDATE`, `DELETE`), sau đó truyền luồng nhật ký thay đổi sang một hoặc nhiều **Read Replicas** để phục vụ riêng truy vấn `SELECT`.

Tầng ứng dụng dùng bộ định tuyến truy vấn (Database Router) tách hai đường đi. Nhờ sao chép bất đồng bộ (`Asynchronous Replication`), Primary trả kết quả ghi ngay mà không phải chờ các bản sao xác nhận qua mạng.

Đánh đổi cốt lõi là **độ trễ sao chép (Replication Lag)**: trong vài chục đến vài trăm mili-giây sau khi cập nhật, truy vấn đọc rơi vào Read Replica có thể nhìn thấy giá trị cũ. Cơ chế xử lý chi tiết hiện tượng này và quy trình nâng bản sao lên thay khi Primary hỏng sẽ được khảo sát sâu ở bài `S2-08`.

## 4. Mô phỏng tải 500 → 8.000 req/s: so sánh Scale-up và Read Replicas

```step
category: PROBLEM
short: Chạy tải 8k RPS
scene: s4-live-ramp
live: ramp
activity: S2-03.A1
gate: optional
callout:
  kind: watch-out
  title: Nâng nhầm nút không gỡ được nghẽn
  vi: "Khi lưu lượng đọc chiếm 85%, chỉ nâng cỡ máy Primary không giúp giảm tải cho Read Replica đang gánh toàn bộ truy vấn SELECT."
whatChanged:
  - "~ Tải tăng tuyến tính từ 500 lên 8.000 req/s trong 60 giây"
  - "~ Cấu hình gốc (1 Replica 2.200 ops/s) bão hoà ngay quanh mốc 2.590 req/s"
telemetry:
  - label: "Trần cấu hình gốc"
    value: "≈ 2.595 req/s"
    tone: warn
  - label: "Tải đọc ở đỉnh"
    value: "6.800 req/s"
    tone: bad
  - label: "Tải ghi ở đỉnh"
    value: "1.200 req/s"
    tone: ok
```

Hãy quan sát mô phỏng khi lưu lượng tăng từ 500 lên 8.000 req/s với 85% lượt đọc:

- Ở đỉnh 8.000 req/s, hệ thống sinh ra `0,85 × 8.000 = 6.800` lượt đọc/giây và `0,15 × 8.000 = 1.200` lượt ghi/giây.
- Với cấu hình khởi điểm gồm 1 Primary (`1.500 ops/s`) và 1 Read Replica (`2.200 ops/s`), Read Replica chạm ngưỡng `ρ = 1` ngay khi tổng lưu lượng vừa vượt khoảng `2.200 / 0,85 ≈ 2.588 req/s`.
- Nếu bạn thử kéo `Primary sizeFactor` lên `×4` mà giữ nguyên 1 Read Replica, chi phí tăng vọt nhưng độ trễ `p99` và tỷ lệ lỗi không giảm, vì 6.800 lượt đọc/giây vẫn dồn vào một bản sao đọc duy nhất. Ngược lại, tăng lên `4` Read Replicas (`8.800 ops/s`) đưa `ρ` đọc về khoảng `0,77`.

## 5. Giới hạn của Read Replica khi tải ghi hoặc dung lượng vượt trần

```step
category: PITFALL
short: Trần tải ghi
scene: s5-write-wall
callout:
  kind: watch-out
  title: Read Replica không mở rộng được thông lượng ghi
  vi: "Dù bạn thêm 10 Read Replicas, 100% lệnh ghi vẫn đổ dồn vào một máy Primary duy nhất và cả 10 bản sao đều phải ghi lặp lại toàn bộ luồng dữ liệu đó."
whatChanged:
  - "~ Khi tỷ lệ ghi tăng cao, Primary chạm ρ = 1,00 dù các Read Replicas còn rảnh"
telemetry:
  - label: "ρ của Primary"
    value: "1,00 (nghẽn ghi)"
    tone: bad
  - label: "ρ của Replicas"
    value: "0,42 (dư năng lực)"
    tone: ok
```

Read Replica giải quyết gọn bài toán đọc, nhưng hoàn toàn đứng ngoài hai tình huống sau:

1. **Lưu lượng ghi vượt trần một máy.** Trong các hệ thống thu thập sự kiện IoT, nhắn tin thời gian thực hoặc đặt đơn giờ cao điểm, nếu lượng ghi đạt 4.000–50.000 lệnh/giây vượt cả cỡ máy Primary lớn nhất, việc thêm Read Replica không chia bớt được lệnh ghi nào cho Primary.
2. **Dung lượng bảng vượt sức chứa một máy.** Mỗi Read Replica lưu bản sao đầy đủ 100% dữ liệu. Khi dữ liệu phình lên hàng chục terabyte, chỉ mục B-tree không còn nằm vừa trong RAM của một máy chủ, làm cả thao tác ghi lẫn sao chép và sao lưu đều chậm đi rõ rệt.

## 6. Bậc 3 — Phân mảnh ngang (Sharding): chia nhỏ cả dữ liệu lẫn tải ghi

```step
category: MECHANISM
short: Sharding ngang
scene: s6-live-shard
live: sharded
callout:
  kind: compare
  title: Mở rộng lớn đi kèm chi phí kỹ thuật cao
  vi: "Sharding chia tải ghi tuyến tính theo số phân mảnh, nhưng làm mất phép JOIN tự nhiên xuyên máy và biến việc đổi số shard thành bài toán di cư dữ liệu nặng nề."
whatChanged:
  - "+ Chuyển sang kịch bản 50% đọc / 50% ghi (4.000 lượt ghi/giây ở đỉnh 8.000 req/s)"
  - "~ Tăng Số phân mảnh từ 1 lên 4 chia đều tải xuống còn 2.000 req/s mỗi shard"
telemetry:
  - label: "Năng lực 1 shard"
    value: "2.600 ops/s"
  - label: "Cụm 4 shards"
    value: "10.400 ops/s"
    tone: ok
```

**Sharding (Horizontal Partitioning)** chia tập dữ liệu thành nhiều phần nhỏ không giao nhau, mỗi phần nằm trên một máy chủ cơ sở dữ liệu độc lập gọi là một **Shard**. Ứng dụng định tuyến theo khoá phân mảnh (ví dụ `hash(user_id) mod N`) để cả đọc lẫn ghi của người dùng đó chỉ chạm đúng một shard.

Trong mô phỏng trực tiếp ở trên (50% đọc, 50% ghi), khi để `1` shard (`2.600 ops/s`), cụm quá tải sớm khi lưu lượng tăng lên 8.000 req/s. Kéo thanh trượt lên `4` shards nâng tổng năng lực lên `10.400 ops/s`, hấp thụ trọn 4.000 lượt ghi/giây và 4.000 lượt đọc/giây với `ρ ≈ 0,77`.

Đổi lại, Sharding kéo theo truy vấn xuyên phân mảnh tốn kém, giao dịch nhiều shard phức tạp và nguy cơ lệch tải do khoá nóng (sẽ học chi tiết ở `S2-09` và `S2-10`).

## 7. Áp dụng thực tế: chọn cấu hình theo tải đọc, tải ghi và ngân sách

```step
category: TECHNIQUE
short: Chọn đúng bậc
scene: s7-ladder
activity: S2-03.A2
gate: required
callout:
  kind: technique
  title: Không nhảy cóc lên Sharding
  vi: "Luôn đi tuần tự từ giải pháp chi phí vận hành thấp tới cao: tối ưu truy vấn và chỉ mục, thêm Cache, nâng cấp dọc hợp lý, tách Read Replica, và chỉ Sharding khi hết đường."
whatChanged:
  - "+ Đối chiếu chi phí và năng lực trên cả hai kịch bản: cao điểm đọc và cao điểm ghi"
telemetry:
  - label: "Ngân sách tối đa"
    value: "≤ 5,00 USD/giờ"
  - label: "Mục tiêu p99"
    value: "≤ 120 ms"
    tone: ok
```

Khi quyết định phương án mở rộng cho một hệ thống cụ thể, hãy tách riêng nhu cầu đọc và nhu cầu ghi:

- Tính **tải ghi đỉnh** `λ_write = λ × (1 − readRatio)` để định cỡ `Primary` (hoặc kiểm tra xem một máy Primary nâng cấp dọc còn gánh nổi hay phải chuyển sang Sharding).
- Tính **tải đọc đỉnh** `λ_read = λ × readRatio` (sau khi trừ phần Cache Hit nếu có) để tính số lượng `Read Replicas` cần thiết, đồng thời đảm bảo có ít nhất hai bản sao phục vụ dự phòng.

Hãy thực hiện bài tập bên dưới để cân đối cỡ máy Primary và số lượng Read Replicas sao cho vượt qua cả đợt cao điểm 8.000 req/s thiên về đọc lẫn đợt 5.000 req/s dồn dập lệnh ghi trong ngân sách cho phép.

## 8. Tóm tắt: thang mở rộng cơ sở dữ liệu

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Dấu hiệu chuyển bậc
  vi: "Chỉ mục & Cache khi truy vấn lặp; Scale-up khi cần sức mạnh tức thì; Read Replica khi đọc nghẽn; Sharding khi ghi hoặc dung lượng đĩa vượt trần một máy."
whatChanged:
  - "+ Tổng kết 4 bậc mở rộng Database cùng giới hạn của từng bậc"
telemetry:
  - label: "Mở rộng đọc"
    value: "Cache + Read Replicas"
    tone: ok
  - label: "Mở rộng ghi"
    value: "Scale-up → Sharding"
    tone: warn
```

Bốn bậc mở rộng cơ sở dữ liệu theo thứ tự ưu tiên triển khai:

| Bậc mở rộng | Giải quyết bài toán | Giới hạn / Đánh đổi chính |
|---|---|---|
| **1. Tối ưu truy vấn & Cache** | Giảm chi phí I/O mỗi lệnh và chặn lượt đọc lặp | Phải quản lý hết hạn và làm mới bộ nhớ đệm |
| **2. Vertical Scale-up** | Tăng năng lực đọc và ghi ngay, giữ trọn ACID | Trần phần cứng hữu hạn, giá tăng nhanh, vẫn là SPOF |
| **3. Read Replicas** | Mở rộng thông lượng đọc và sẵn sàng dự phòng | Xuất hiện Replication Lag, không tăng thông lượng ghi |
| **4. Sharding** | Mở rộng tuyến tính cả thông lượng ghi lẫn dung lượng | Phức tạp ở truy vấn xuyên shard, khoá nóng và chia lại shard |

Ba bài tiếp theo (`S2-08`, `S2-09`, `S2-10`) sẽ đi sâu vào cơ chế bên trong của Replication, Sharding và vòng băm nhất quán.

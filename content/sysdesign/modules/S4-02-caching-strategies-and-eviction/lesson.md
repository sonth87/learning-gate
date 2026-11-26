## 1. Ba chiến lược Cache cốt lõi: Cache-Aside, Write-Through và Write-Behind

```step
category: SETUP
short: Ba mẫu Cache
scene: s1-patterns
callout:
  kind: key-idea
  title: Chọn mẫu theo tỷ lệ đọc/ghi và mức nhất quán
  vi: "Không có chiến lược Cache tốt nhất cho mọi hệ thống. Mỗi mẫu đánh đổi giữa độ trễ đọc, độ trễ ghi và rủi ro dữ liệu cũ."
whatChanged:
  - "+ Thiết lập luồng App → Redis Cache → Primary DB với 90% đọc, 10% ghi"
  - "~ Cache-Aside nạp lười khi đọc miss và tách biệt khỏi đường ghi"
telemetry:
  - label: "Mẫu mặc định"
    value: "Cache-Aside"
    tone: ok
  - label: "Tải đọc / ghi"
    value: "90% / 10%"
```

Ở mức cơ bản, bộ nhớ đệm trong RAM nhanh hơn hàng trăm đến hàng nghìn lần so với đọc đĩa ở Database. Tuy nhiên, khi đưa vào sản xuất, câu hỏi quan trọng nhất là **làm sao giữ Cache và Database đồng bộ** khi dữ liệu liên tục thay đổi.

**Cache-Aside (Lazy Loading)** là mẫu phổ biến nhất: ứng dụng tự kiểm tra Cache trước. Nếu có dữ liệu (Hit), trả về ngay. Nếu không (Miss), ứng dụng tự truy vấn Database, ghi kết quả vào Cache kèm thời hạn TTL rồi trả về cho người dùng. Mẫu này giúp Cache chỉ chứa dữ liệu thực sự được hỏi, và nếu cụm Cache gặp sự cố, ứng dụng vẫn đọc thẳng Database được. Đánh đổi là lần đọc đầu tiên bị chậm và dữ liệu trong Cache có thể cũ nếu Database bị cập nhật từ nơi khác.

## 2. Write-Through: ưu tiên nhất quán, đánh đổi độ trễ ghi

```step
category: MECHANISM
short: Write-Through
scene: s2-write-through
callout:
  kind: compare
  title: Đọc nhanh nhưng ghi phải đợi hai bước
  vi: "Write-Through giữ Cache luôn khớp Database ngay sau khi ghi, nhưng mỗi thao tác ghi phải chờ cả hai tầng xác nhận."
whatChanged:
  - "~ Luồng ghi đi đồng bộ: App → Cache → Primary DB"
  - "~ Dữ liệu vừa ghi sẵn sàng ngay cho các lần đọc kế tiếp"
telemetry:
  - label: "Độ nhất quán"
    value: "Cao"
    tone: ok
  - label: "Độ trễ ghi"
    value: "Cộng dồn 2 tầng"
    tone: warn
```

Khi hệ thống yêu cầu người dùng vừa cập nhật xong phải đọc thấy ngay dữ liệu mới (read-after-write), **Write-Through** đưa Cache vào thẳng đường ghi. Ứng dụng ghi vào Cache, và tầng Cache đồng bộ ghi xuống Database trước khi báo thành công.

Nhờ vậy, Cache và Database luôn khớp nhau, không có hiện tượng vừa ghi xong đọc lại thấy bản cũ. Nhưng cái giá phải trả là độ trễ ghi tăng lên vì phải chờ cả mạng tới Cache lẫn thời gian ghi đĩa của Database. Ngoài ra, với hệ thống ghi nhiều nhưng ít đọc lại (write-heavy), việc đẩy mọi bản ghi vào RAM sẽ chiếm chỗ của các khóa thực sự nóng.

## 3. Write-Behind: tối ưu tốc độ ghi bằng hàng đợi nền

```step
category: TECHNIQUE
short: Write-Behind
scene: s3-write-behind
callout:
  kind: watch-out
  title: Cẩn trọng rủi ro mất dữ liệu trong RAM
  vi: "Write-Behind cho tốc độ ghi cực nhanh và gộp lô xuống Database, nhưng dữ liệu chưa kịp xả ra đĩa sẽ mất nếu nút Cache tắt đột ngột."
whatChanged:
  - "~ Đường cache-db chuyển sang ghi nền bất đồng bộ theo lô"
  - "~ Tải tức thời lên Primary DB giảm mạnh nhờ gộp nhiều thay đổi"
telemetry:
  - label: "Độ trễ ghi API"
    value: "~0,5 ms"
    tone: ok
  - label: "Rủi ro mất tin"
    value: "Nếu RAM sập sớm"
    tone: bad
```

Với các tác vụ ghi liên tục như bộ đếm lượt xem, trạng thái trực tuyến hoặc bảng xếp hạng, **Write-Behind (Write-Back)** đảo ngược quy trình: ứng dụng chỉ ghi vào Cache rồi nhận phản hồi thành công ngay lập tức. Sau đó, một tiến trình nền gom nhiều thay đổi liên tiếp thành từng lô (batch) để xả dần xuống Database.

Nhờ gom lô, một khóa được cập nhật 100 lần trong 5 giây có thể chỉ tốn 1 câu lệnh `UPDATE` xuống đĩa. Tuy nhiên, tính nhất quán trở nên phức tạp hơn và bắt buộc phải có bản sao lưu (replication) cho tầng Cache để tránh mất dữ liệu chưa kịp xả.

## 4. Cache Invalidation: TTL có Jitter, xóa khóa khi ghi và khóa phiên bản

```step
category: TECHNIQUE
short: Invalidation
scene: s4-invalidation
callout:
  kind: technique
  title: Kết hợp xóa chủ động và TTL phòng hờ
  vi: "Chỉ dùng TTL dễ tạo cửa sổ dữ liệu cũ; chỉ xóa khi ghi dễ sót luồng phụ. Kết hợp cả hai là cách an toàn nhất."
whatChanged:
  - "~ Giá đổi ở DB nhưng Cache còn giữ bản cũ nếu quên xóa khóa"
  - "+ Áp dụng xóa khóa sau khi ghi DB kèm TTL có độ lệch ngẫu nhiên"
telemetry:
  - label: "Cách 1"
    value: "TTL + Jitter"
  - label: "Cách 2"
    value: "Xóa khóa / Version"
    tone: ok
```

Khi giá sản phẩm hoặc hồ sơ người dùng thay đổi trong Database, bản lưu trong Cache trở thành dữ liệu cũ. Có ba cơ chế làm mới chính:

1. **Theo thời gian (TTL):** Đặt hạn dùng cho mỗi khóa, cộng thêm độ lệch ngẫu nhiên (jitter) như `3600 + random(0, 300)` giây để tránh hàng loạt khóa hết hạn cùng lúc gây sụt tải xuống Database.
2. **Xóa chủ động theo sự kiện:** Ngay sau khi cập nhật Database thành công, ứng dụng gọi lệnh xóa khóa tương ứng trong Cache để lần đọc sau tự nạp bản mới.
3. **Gắn phiên bản vào khóa:** Đưa số phiên bản vào tên khóa (ví dụ `product:42:v7`). Khi dữ liệu đổi, chỉ cần tăng phiên bản lên `v8`; khóa cũ tự bị bỏ qua mà không cần xóa thủ công.

## 5. Chính sách loại bỏ LRU, LFU và mô phỏng thiếu dung lượng Cache

```step
category: PROBLEM
short: Thiếu RAM & LRU
scene: s5-eviction-live
live: eviction
activity: S4-02.A1
gate: optional
callout:
  kind: watch-out
  title: Bộ nhớ Cache quá nhỏ gây vòng lặp đẩy khóa nóng
  vi: "Khi dung lượng Cache nhỏ hơn tập dữ liệu nóng, LRU liên tục đẩy khóa vừa nạp ra ngoài trước khi nó kịp được đọc lại."
whatChanged:
  - "~ Tập dữ liệu nóng 80.000 key nhưng Cache chỉ chứa tối đa 20.000 key"
  - "~ Tải tăng từ 600 lên 4.200 req/s đẩy DB vượt 1.400 req/s"
telemetry:
  - label: "Dung lượng Cache"
    value: "20.000 / 80.000 key"
    tone: warn
  - label: "Năng lực DB"
    value: "1.400 req/s"
```

RAM luôn hữu hạn. Khi Cache đầy, hệ thống phải chọn mục để loại bỏ: **LRU (Least Recently Used)** xóa mục lâu nhất chưa được chạm tới, phù hợp đa số mẫu truy cập theo thời gian; **LFU (Least Frequently Used)** xóa mục có tần suất hỏi thấp nhất, giữ lại các mục phổ biến lâu dài tốt hơn nhưng tốn chi phí theo dõi bộ đếm.

Trong mô phỏng trực tiếp này, tập dữ liệu nóng gồm 80.000 key nhưng Redis Cache chỉ được cấp chỗ cho 20.000 key. Quan sát diễn biến khi tải tăng dần và thử mở rộng `capacityKeys` lên 80.000 key để xem Hit Ratio và tải Database thay đổi ra sao.

## 6. Chặn truy vấn ID không tồn tại bằng Negative Caching và Bloom Filter

```step
category: PITFALL
short: Penetration
scene: s6-penetration
activity: S4-02.A2
gate: optional
callout:
  kind: key-idea
  title: Không để truy vấn rỗng xuyên thẳng xuống Database
  vi: "Nếu 50% lượt đọc hỏi các ID không tồn tại, Cache thông thường sẽ miss toàn bộ vì không có gì để lưu lại."
whatChanged:
  - "~ Các ID không tồn tại đi xuyên qua Cache xuống quét Primary DB"
  - "+ Dùng Negative Caching (TTL ngắn) kết hợp Bloom Filter chặn ở cửa vào"
telemetry:
  - label: "Lỗi thường gặp"
    value: "Cache Penetration"
    tone: bad
  - label: "Lá chắn RAM nhẹ"
    value: "Bloom Filter"
    tone: ok
```

Một lỗi phổ biến khác là **Cache Penetration**: người dùng hoặc script gửi liên tục các truy vấn có ID không hề tồn tại (ví dụ `user:-1` hoặc mã ngẫu nhiên). Vì không tìm thấy trong Database, ứng dụng không ghi vào Cache, khiến mọi lượt hỏi lặp lại đều xuyên thẳng xuống Database.

Hai lớp phòng vệ hiệu quả gồm:
- **Negative Caching:** Lưu chính trạng thái không tồn tại (ví dụ giá trị đánh dấu `NULL` với TTL ngắn 30–60 giây) vào Cache để các lần hỏi tiếp theo trả về ngay.
- **Bloom Filter:** Cấu trúc mảng bit nhỏ gọn đặt trước tầng tra cứu. Nếu Bloom Filter báo ID chưa từng tồn tại, hệ thống từ chối ngay ở RAM mà không cần chạm tới Database.

## 7. Tổng kết: thiết kế tầng Cache bền vững

```step
category: RECAP
short: Tóm tắt
scene: s7-recap
activity: S4-02.A3
gate: required
callout:
  kind: key-idea
  title: Bốn nguyên tắc vận hành Cache
  vi: "Chọn đúng mẫu ghi, cấp đủ dung lượng cho tập nóng, kết hợp xóa khóa với TTL Jitter và chặn ID rỗng bằng Bloom Filter."
whatChanged:
  - "+ Hoàn thành đối chiếu Cache-Aside, Write-Through, Write-Behind và LRU"
telemetry:
  - label: "Mục tiêu Hit Ratio"
    value: "≈ 90%+"
    tone: ok
  - label: "Chặn miss giả"
    value: "Negative + Bloom"
    tone: ok
```

Để vận hành Cache hiệu quả trong hệ thống phân tán, hãy kiểm tra đủ bốn yếu tố: chọn đúng mẫu ghi theo yêu cầu nhất quán (Cache-Aside cho đa số ca đọc nhiều, Write-Through khi cần đồng bộ tức thì, Write-Behind cho tải ghi lớn chấp nhận mất nhẹ), định cỡ RAM đủ chứa tập dữ liệu nóng để tránh LRU đẩy khóa liên tục, kết hợp xóa khóa khi ghi với TTL có jitter, và bảo vệ Database khỏi truy vấn ID không tồn tại bằng Negative Caching cùng Bloom Filter.

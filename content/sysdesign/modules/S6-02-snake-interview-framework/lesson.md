## 1. Cấu trúc 5 chặng SNAKE cho buổi thiết kế 45 phút

```step
category: SETUP
short: Khung SNAKE
scene: s1-timeline
callout:
  kind: key-idea
  title: Kiểm soát nhịp độ 45 phút
  vi: "Không có cấu trúc khiến người thiết kế dễ nhảy cóc từ câu hỏi sang tên công nghệ và hết giờ trước khi chạm đến nút nghẽn. SNAKE chia 45 phút thành 5 chặng có mục tiêu rõ."
whatChanged:
  - "+ Chia 45 phút thành 5 chặng SNAKE kèm 5 phút dự phòng"
telemetry:
  - label: "Chặng chuẩn bị (S + N + A)"
    value: "15–20 phút"
    tone: ok
  - label: "Chặng kiến trúc (K + E)"
    value: "20–25 phút"
    tone: ok
```

Một buổi thiết kế hệ thống thường chỉ kéo dài 45 phút. Nếu không có lộ trình, kỹ sư rất dễ mất 20 phút đầu để tranh luận chi tiết vụn vặt rồi vội vàng vẽ sơ đồ thiếu căn cứ. Khung **SNAKE** giải quyết điều này bằng 5 bước tuần tự:

1. **S — Scope (5–7 phút):** Chốt yêu cầu, phạm vi và ràng buộc.
2. **N — Numbers (5–7 phút):** Tính nhanh tải, lưu trữ, băng thông và RAM.
3. **A — API (5 phút):** Định nghĩa hợp đồng giao tiếp trước khi vẽ hộp.
4. **K — Key Components (10–12 phút):** Dựng kiến trúc tổng thể cho luồng đọc và ghi.
5. **E — Elaborate (10–12 phút):** Đào sâu 2–3 nút nghẽn và kịch bản lỗi.

Luôn giữ lại khoảng 5 phút dự phòng cho các câu hỏi mở rộng.

## 2. Chặng S (Scope): khoanh vùng phạm vi và giả định chủ động

```step
category: TECHNIQUE
short: Scope (S)
scene: s2-scope-numbers
callout:
  kind: good-to-know
  title: Đề xuất giả định chủ động
  vi: "Thay vì hỏi trống không, hãy nêu giả định hợp lý (ví dụ 100M DAU, 92% đọc) để đối phương xác nhận hoặc điều chỉnh. Khoanh vùng rõ phần ngoài phạm vi giúp giữ nhịp."
whatChanged:
  - "+ Tách rõ tính năng bắt buộc, mở rộng và ngoài phạm vi"
telemetry:
  - label: "Thời lượng chặng S"
    value: "5–7 phút"
    tone: ok
  - label: "Tỉ lệ đọc/ghi mẫu"
    value: "92% đọc · 8% ghi"
    tone: ok
```

Ở chặng **Scope**, hãy tách rõ tính năng bắt buộc (must-have), tính năng mở rộng (nice-to-have) và những phần **nằm ngoài phạm vi (out-of-scope)** để không bị loãng thời gian.

## 3. Chặng N (Numbers): 4 phép tính nhanh dẫn đường kiến trúc

```step
category: TECHNIQUE
short: Numbers (N)
scene: s2-scope-numbers
callout:
  kind: good-to-know
  title: Con số quyết định cấu trúc hệ thống
  vi: "Mọi con số ở bước N sẽ dẫn dắt trực tiếp bước K: tải đọc lớn dẫn đến Cache, dữ liệu phình to dẫn đến Sharding, và lưu lượng media lớn dẫn đến CDN."
whatChanged:
  - "+ Quy đổi DAU và kích thước bản ghi thành RPS, TB/năm và băng thông"
telemetry:
  - label: "Hệ số đỉnh tải"
    value: "3× trung bình"
    tone: warn
  - label: "Quy tắc 80/20 Cache"
    value: "20% key nóng"
    tone: ok
```

Sang chặng **Numbers**, thực hiện 4 phép tính nhanh trên bảng:
- **Lưu lượng:** Từ DAU nhân số lượt thao tác chia `86.400` giây để ra RPS trung bình, nhân `3` ra đỉnh tải, rồi xác định tỉ lệ đọc/ghi.
- **Lưu trữ:** Số bản ghi mỗi ngày × kích thước bản ghi × `365` × số năm (ví dụ 5 năm) để biết khi nào cần Sharding.
- **Băng thông:** Tách riêng dữ liệu chữ (MB/s) và dữ liệu media (GB/s) để quyết định dùng CDN.
- **Bộ nhớ Cache:** Tính dung lượng RAM cho khoảng 20% dữ liệu được truy cập nhiều nhất.

## 4. Chặng A (API): chốt hợp đồng giao tiếp trước khi vẽ hộp

```step
category: MECHANISM
short: API Contract (A)
scene: s3-api-components
callout:
  kind: key-idea
  title: Định nghĩa ranh giới rõ ràng
  vi: "API rõ ràng giúp định hình ngay các khối thành phần phía sau và tránh sửa lại sơ đồ giữa chừng."
whatChanged:
  - "+ Chốt hợp đồng REST/RPC kèm Cursor Pagination và Idempotency Key"
telemetry:
  - label: "Phân trang bảng tin"
    value: "Cursor-based"
    tone: ok
  - label: "Bảo vệ lệnh ghi"
    value: "Idempotency Key"
    tone: ok
```

Ở chặng **API**, viết ra 3–4 endpoint cốt lõi kèm tham số và cấu trúc trả về (ví dụ `POST /v1/posts` có `idempotency_key`, `GET /v1/feed?cursor=...&limit=20` dùng phân trang theo con trỏ thay vì `OFFSET`).

## 5. Chặng K (Key Components): dựng luồng đọc, ghi và media

```step
category: MECHANISM
short: Kiến trúc (K)
scene: s3-api-components
callout:
  kind: key-idea
  title: Tách luồng đọc và luồng ghi
  vi: "Trên sơ đồ tổng thể, luôn tách bạch đường đi của luồng đọc, luồng ghi và luồng tệp media dựa trên số liệu ở bước N."
whatChanged:
  - "+ Dựng luồng Đọc (qua Cache) và luồng Ghi (xuống DB + Queue)"
telemetry:
  - label: "Luồng đọc"
    value: "LB → API → Cache"
    tone: ok
  - label: "Luồng ghi"
    value: "API → DB + Queue"
    tone: ok
```

Ở chặng **Key Components**, vẽ đường đi đầu-cuối cho từng luồng chính dựa trên con số đã tính: Load Balancer đứng trước cụm API không trạng thái, bộ nhớ đệm Cache gánh phần lớn lượt đọc, Database lưu trữ bền vững và CDN phục vụ media.

## 6. Chặng E (Elaborate): đào sâu điểm nghẽn và thực hành chốt cấu hình

```step
category: RECAP
short: Đào sâu & Chốt
scene: s4-elaborate
activity: S6-02.A1
gate: optional
callout:
  kind: watch-out
  title: Tập trung vào 2–3 điểm nóng nhất
  vi: "Không cố gắng giải thích mọi hộp trên sơ đồ. Hãy chọn đúng nơi dễ nghẽn nhất (như hot key, fan-out, SPOF hoặc Replication Lag) để phân tích sâu và bảo vệ sự đánh đổi."
whatChanged:
  - "+ Chọn 3 trọng tâm đào sâu: Hot Key, Độ tin cậy (No SPOF) và Chi phí"
  - "+ Thực hành biến số liệu chặng Numbers của Feed thành cấu hình thực tế"
telemetry:
  - label: "Số chủ đề đào sâu"
    value: "2–3 điểm nóng"
    tone: ok
  - label: "Mục tiêu thực hành"
    value: "p99 ≤ 110 ms, ≤ 1,40$/h"
    tone: ok
```

Chặng **Elaborate** quyết định chiều sâu của bản thiết kế. Với bài toán Bảng tin, các điểm cần đào sâu gồm: chiến lược Fan-out kết hợp (đẩy trước cho người dùng thường, kéo khi xem cho tài khoản có hàng triệu người theo dõi), loại bỏ điểm lỗi đơn ở tầng API và giữ chi phí nằm trong ngân sách.

Hãy thực hiện bài tập bên cạnh để chuyển trực tiếp các thông số vừa tính ở chặng Numbers thành cấu hình cụm Feed API và Feed Cache đạt chuẩn.

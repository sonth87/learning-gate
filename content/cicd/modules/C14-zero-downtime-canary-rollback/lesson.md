# Phát hành Không gián đoạn (Zero-Downtime), Canary & Rollback Tự động

Hãy hình dung ứng dụng Node.js của bạn đang xử lý 2.000 đơn hàng mỗi phút. Bạn merge một tính năng mới lên `main`, pipeline CI báo xanh mượt, và đẩy bản cập nhật lên Production. Đột nhiên trong 20 giây tiếp theo, khách hàng nhận hàng loạt lỗi `502 Bad Gateway`, hoặc tệ hơn: một lỗi `TypeError: Cannot read properties of undefined` lọt qua Unit Test vì dữ liệu thật trên Production có một trường `discountCode: null` mà bộ mock ở local chưa từng nghĩ tới!

Làm thế nào để các đội ngũ kỹ thuật hàng đầu phát hành 30 lần/ngày mà khách hàng **không bao giờ thấy trang lỗi** (`Zero-Downtime`) và nếu có sự cố thì hệ thống **tự động quay lui trong chưa đầy 30 giây** (`Automated Rollback`)? Bí quyết nằm ở 4 nguyên tắc triển khai hiện đại dưới đây.

---

## 1. Thẻ Image Bất biến (Immutable Image Tags) — Điều kiện tiên quyết để Rollback

Sai lầm kinh điển nhất của người mới dùng Docker trong CI/CD là đóng gói và đẩy đè lên thẻ `:latest`:

```bash
# PHẢN MẪU NGUY HIỂM: Ghi đè thẻ :latest mỗi lần chạy CI
docker build -t ghcr.io/acme/shop-api:latest .
docker push ghcr.io/acme/shop-api:latest
```

Thẻ `:latest` trong Docker giống hệt như việc bạn xuất bản gói npm mà... xoá đi ghi đè mãi vào phiên bản `1.0.0`! Khi bản mới bị lỗi lúc 2 giờ sáng:
1. Bản Image ổn định trước đó đã mất nhãn tham chiếu dễ đọc.
2. Các Node trên cụm Kubernetes có `imagePullPolicy: IfNotPresent` có thể kéo bản cũ ở Node A nhưng kéo bản mới ở Node B, gây ra trạng thái hỗn loạn không đồng nhất.

**Chuẩn mực Production**: Mỗi commit đi qua CI phải tạo ra một thẻ **bất biến (Immutable Tag)** gắn chặt với mã băm Git SHA (`ghcr.io/acme/shop-api:sha-${{ github.sha }}`) hoặc Semantic Version (`v1.4.2`). Khi cần Rollback, hệ thống chỉ việc trỏ Deployment quay về đúng mã `sha-<commit_cũ>` đã được lưu trữ nguyên vẹn trên Container Registry.

---

## 2. So sánh 3 Chiến lược Phát hành: Rolling Update vs Blue-Green vs Canary

Thay vì tắt toàn bộ máy chủ cũ rồi mới bật máy chủ mới (gây chết dịch vụ — *Recreate*), hệ sinh thái Kubernetes và **Argo Rollouts** (`argoproj.io/v1alpha1`) cung cấp 3 chiến lược điều phối lưu lượng thông minh:

| Chiến lược | Cách thức chuyển lưu lượng | Ưu điểm nổi bật | Chi phí & Hạn chế |
| :--- | :--- | :--- | :--- |
| **Rolling Update** (Mặc định K8s) | Thay thế cuốn chiếu từng Pod cũ sang Pod mới (kết hợp `readinessProbe` + `preStop`). | Không tốn gấp đôi hạ tầng, tích hợp sẵn trong `Deployment`. | Khó kiểm soát chính xác % lưu lượng (ví dụ muốn thử đúng 5% user); tốc độ rollback phụ thuộc thời gian khởi tạo lại Pod. |
| **Blue-Green** | Dựng song song cụm **Green** (bản mới) cạnh cụm **Blue** (đang chạy thật). Kiểm thử qua `previewService` trước khi gạt công tắc `activeService` 100% sang Green. | Chuyển đổi và Rollback **tức thì (< 1 giây)** chỉ bằng cách đổi nhãn Selector của Service; cho phép QA test trực tiếp trên môi trường thật qua cổng Preview. | Tạm thời tốn **gấp đôi (2x)** tài nguyên CPU/RAM trong lúc giữ cả hai cụm Blue và Green. |
| **Canary** (Chim hoàng yến) | Nhỏ giọt lưu lượng từng nấc: `5%` $\rightarrow$ nghỉ nghe ngóng `2m` $\rightarrow$ `25%` $\rightarrow$ `100%`. | Giới hạn **bán kính ảnh hưởng (Blast Radius)** cực nhỏ: nếu bản mới lỗi, 95% khách hàng còn lại hoàn toàn bình an! | Cần bộ điều phối nâng cao (Argo Rollouts / Service Mesh / Ingress Controller) và hệ thống đo lường tỷ lệ lỗi thực tế. |

Trong Argo Rollouts, một cấu hình **Blue-Green** có cổng xem trước được viết cực kỳ tường minh:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: shop-api
spec:
  replicas: 4
  strategy:
    blueGreen:
      activeService: shop-api-active     # Lưu lượng khách hàng thật
      previewService: shop-api-preview   # Cổng nội bộ để chạy E2E/QA trước khi mở cổng
      autoPromotionEnabled: false        # Đợi xác nhận (hoặc job CI promote) mới gạt sang Active
```

Trong khi đó, chiến lược **Canary** chia nhỏ từng bước (`steps`) rõ ràng giữa `setWeight` (phần trăm lưu lượng) và `pause` (khoảng dừng quan sát metric HTTP 5xx / độ trễ p99):

```yaml
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: "2m" }
        - setWeight: 25
        - pause: { duration: "5m" }
        - setWeight: 100
```

---

## 3. Hậu kiểm Smoke Test & Quay lui Tự động (Automated Rollback)

Một sai lầm phổ biến khác là coi lệnh `deploy` trả về exit code `0` đồng nghĩa với "phát hành thành công". Thực tế, lệnh cập nhật cấu hình chỉ mới gửi yêu cầu cho cụm máy chủ; ứng dụng Node.js bên trong có thể đang bị treo kết nối Redis hoặc thiếu biến môi trường dẫn tới trả mã `503 Service Unavailable` ở endpoint `/readyz`.

Quy trình khép kín chuẩn SRE luôn gồm 2 chốt chặn nối tiếp ngay sau bước Deploy:

1. **Post-Deploy Smoke Test**: Dùng `curl` kiểm tra điểm cuối sức khoẻ thực sự (`/readyz` hoặc `/healthz`) kèm đủ bộ cờ bắt buộc:
   - `--fail` (hoặc `-f`): **Quan trọng bậc nhất!** Mặc định `curl` nhận HTTP `500 Internal Server Error` vẫn thoát với mã `0` (gây *False Green*!). Cờ `--fail` ép `curl` trả exit code `22` ngay khi mã HTTP $\ge 400$.
   - `--silent --show-error` (`-sS`): Tắt thanh tiến trình ồn ào nhưng vẫn in rõ thông báo lỗi nếu đứt mạng.
   - `--retry 5 --retry-delay 3`: Chờ nhịp khởi động ấm (warm-up) của Load Balancer / Ingress tránh báo động giả.
2. **Job `rollback` tự động kích hoạt khi thất bại**: Trong GitHub Actions, một job `rollback` khai báo `needs: [deploy-prod, smoke-test]` kèm điều kiện `if: failure()` sẽ lập tức thức dậy ngay khi `deploy-prod` hoặc `smoke-test` gãy, tự động chạy lệnh quay lui về bản ổn định trước đó và bắn cảnh báo khẩn cấp cho đội trực ca (On-call).

Kết hợp **Immutable SHA Tag + Canary/Blue-Green + `curl --fail` Smoke Test + `if: failure()` Rollback**, bạn biến mỗi lần phát hành từ một "canh bạc nín thở" thành một quy trình kỹ thuật êm ái, tự phục hồi ngay cả khi có lỗi lọt lưới!

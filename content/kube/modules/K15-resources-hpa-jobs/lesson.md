# Quản trị Tài nguyên, Hạng ưu tiên QoS, Tự động co giãn HPA & Tác vụ nền Job/CronJob

Trên máy tính cá nhân, một tiến trình Node.js có thể thoải mái chiếm bao nhiêu CPU và RAM tuỳ thích. Nhưng trên cụm Kubernetes dùng chung nơi 40 dịch vụ cùng chia sẻ tài nguyên của các Worker Node, một đoạn code xuất báo cáo Excel bị rò rỉ bộ nhớ (Memory Leak) hoặc lặp vô hạn tính toán JSON khổng lồ có thể "hút cạn máu" toàn bộ máy chủ, làm chết lây cả các dịch vụ thanh toán quan trọng đang nằm cùng Node!

Trong bài học này, bạn sẽ làm chủ bộ ba trụ cột quản trị năng lực của Kubernetes: định mức **`resources` (`requests` vs `limits`) & QoS**, tự động nhân bản theo tải thực tế với **`HorizontalPodAutoscaler` (`autoscaling/v2`)**, và chạy tác vụ một lần / định kỳ với **`Job` & `CronJob` (`batch/v1`)**.

---

## 1. Phân biệt sống còn: `resources.requests` vs `resources.limits`

Mọi container chuẩn Production đều phải khai báo rõ hai ngưỡng dưới mục `resources:`:

| Thông số | Ai sử dụng con số này? | Đơn vị chuẩn trong K8s | Điều gì xảy ra khi ứng dụng vượt ngưỡng? |
| --- | --- | --- | --- |
| **`requests`** *(Mức đặt cọc tối thiểu)* | **`kube-scheduler`** (lúc tìm Node xếp chỗ cho Pod). | CPU: **`250m`** (`= 0.25 vCPU`, vì `1000m = 1 core`).<br>RAM: **`256Mi`** (`Mebibytes`, luỹ thừa cơ số 2; tránh nhầm với `M` cơ số 10!). | Không bị phạt trực tiếp — đây là phần tài nguyên được đảm bảo dành riêng cho Pod trên Node. Nếu không Node nào còn trống đủ `requests`, Pod đứng ở trạng thái `Pending`. |
| **`limits`** *(Trần giới hạn cứng tối đa)* | **Nhân Linux (`cgroups`)** trên Worker Node đang chạy Pod. | CPU: **`500m`** (`0.5 core`).<br>RAM: **`512Mi`** (hoặc `1Gi = 1024Mi`). | • **Vượt trần CPU (`limits.cpu`):** Bị **hãm tốc độ (CPU Throttling)** — ứng dụng phản hồi chậm đi nhưng **KHÔNG bị giết**.<br>• **Vượt trần RAM (`limits.memory`):** Nhân Linux kích hoạt **OOM Killer** bắn chết container ngay lập tức với **`Exit Code 137` (`OOMKilled`)**! |

*(Liên hệ Node.js thực tế: Nếu bạn đặt `limits.memory: 512Mi`, hãy cấu hình biến môi trường `NODE_OPTIONS="--max-old-space-size=384"` cho V8 Heap thấp hơn trần khoảng 25% để chừa không gian cho bộ nhớ đệm C++/Buffers, giúp Garbage Collector kịp dọn rác trước khi đụng trần OOM Killer!)*

---

## 2. Ba hạng dịch vụ ưu tiên khi Node cạn kiệt RAM: **QoS Classes**

Dựa vào cách bạn viết `requests` và `limits`, Kubernetes tự động xếp hạng từng Pod vào một trong 3 tầng **Quality of Service (QoS)**. Khi một Worker Node bất ngờ cạn sạch RAM vật lý, `kubelet` sẽ nhìn vào hạng QoS này để quyết định **"đuổi (Evict) ai trước, giữ ai lại cuối cùng"**:

1. **`BestEffort` *(Dễ bị đuổi đầu tiên)*:** Pod hoàn toàn **không khai báo** bất kỳ `requests` hay `limits` nào cả. Khi thiếu RAM, nhóm này bị khai tử đầu tiên không thương tiếc.
2. **`Burstable` *(Linh hoạt — Phổ biến nhất cho Web/API)*:** Có khai báo `requests` nhỏ hơn `limits` (ví dụ `requests: 256Mi`, `limits: 512Mi`). Bình thường tiết kiệm tài nguyên, lúc cao điểm được phép bứt tốc lên tới `limits`.
3. **`Guaranteed` *(Ưu tiên bảo vệ tối thượng)*:** Mọi container trong Pod đều đặt **`requests.cpu` bằng khít `limits.cpu` VÀ `requests.memory` bằng khít `limits.memory`** (ví dụ cả hai đều là `cpu: 500m`, `memory: 512Mi`). Dành riêng cho Database, cổng thanh toán cốt lõi (`payment-core`) — gần như không bao giờ bị trục xuất trừ khi hệ điều hành sập!

---

## 3. Tự động co giãn theo lưu lượng thật: `HorizontalPodAutoscaler` (`autoscaling/v2`)

Thay vì trực đêm gõ tay `kubectl scale` mỗi dịp khuyến mãi rồi sáng hôm sau lại thu nhỏ để đỡ tốn tiền máy chủ, **`HorizontalPodAutoscaler` (HPA)** liên tục hỏi số liệu thực tế từ **Metrics Server** mỗi 15 giây và tự động điều chỉnh số `replicas` của `Deployment`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: shop-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: shop-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**Lưu ý bắt buộc để HPA hoạt động:** Công thức phần trăm `averageUtilization: 70` được tính bằng `(Lượng CPU thực dùng trung bình) / (resources.requests.cpu)`. Do đó, nếu `Deployment/shop-api` quên khai báo **`resources.requests.cpu`**, HPA sẽ báo lỗi `<unknown>/70%` và hoàn toàn tê liệt không thể nhân bản!

---

## 4. Chạy tác vụ một lần & định kỳ: `Job` và `CronJob` (`batch/v1`)

`Deployment` được sinh ra cho các máy chủ lắng nghe liên tục 24/7: hễ tiến trình kết thúc là nó bật lại ngay. Nhưng với các tác vụ kịch bản ngắn hạn trong Node.js như **chạy nâng cấp lược đồ DB (`npm run migrate:deploy`)**, kết xuất báo cáo doanh thu cuối ngày hay sao lưu dữ liệu lúc 2 giờ sáng, chúng ta cần tiến trình **chạy xong việc rồi thoát mã `0` (`Completed`) và dừng hẳn**:

- **`Job` (`batch/v1`):** Chạy 1 lần cho tới khi hoàn thành thành công.
  - Bắt buộc đặt `spec.template.spec.restartPolicy` là **`Never`** hoặc **`OnFailure`** (Kubernetes cấm dùng giá trị mặc định `Always` trong `Job`!).
  - Dùng `backoffLimit: 3` để giới hạn số lần thử lại tối đa nếu kịch bản gặp lỗi mạng tạm thời, tránh lặp lỗi vô tận.
- **`CronJob` (`batch/v1`):** Lập lịch tự động đẻ ra các `Job` theo biểu thức thời gian Unix Cron 5 trường quen thuộc (`phút giờ ngày tháng thứ`, ví dụ `"0 2 * * *"` là 02:00 sáng hàng ngày):
  - Trường cực kỳ quan trọng trong thực tế là **`concurrencyPolicy: Forbid`**: nếu kỳ chạy báo cáo lúc 02:00 hôm nay bị kẹt kéo dài quá lâu chưa xong, tới kỳ kế tiếp K8s sẽ **không chồng thêm một Job thứ hai chạy đè lên**, ngăn chặn tình trạng khoá bảng Database hay gửi trùng email hàng loạt cho khách hàng!

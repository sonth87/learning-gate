# Quản trị Tài nguyên, Hạng ưu tiên QoS, Tự động co giãn HPA & Tác vụ nền Job/CronJob

Trên máy tính cá nhân, một tiến trình Node.js có thể thoải mái chiếm bao nhiêu CPU và RAM tuỳ thích. Nhưng trên cụm Kubernetes dùng chung nơi 40 dịch vụ cùng chia sẻ tài nguyên của các Worker Node, một đoạn code xuất báo cáo Excel bị rò rỉ bộ nhớ (*Memory Leak*) hoặc lặp vô hạn tính toán JSON khổng lồ có thể "hút cạn máu" toàn bộ máy chủ, làm chết lây cả các dịch vụ thanh toán quan trọng đang nằm cùng Node!

Trong bài học này, bạn sẽ làm chủ bộ ba trụ cột quản trị năng lực của Kubernetes: định mức **`resources` ({sky:`requests`} vs {amber:`limits`}) & QoS**, tự động nhân bản theo tải thực tế với ==`HorizontalPodAutoscaler` (`autoscaling/v2`)==, và chạy tác vụ một lần / định kỳ với **`Job` & `CronJob` (`batch/v1`)**.

## 1. Phân biệt sống còn: `resources.requests` vs `resources.limits`

Mọi container chuẩn Production đều phải khai báo rõ hai ngưỡng dưới mục `resources:`. Về đơn vị đo lường trong Kubernetes:

- [>] **CPU tính bằng Millicores (`m`):** `1000m = 1 vCPU` (1 nhân ảo trọn vẹn) → **`500m = 0.5 vCPU`**, **`250m = 0.25 vCPU`**.
- [>] **RAM tính bằng luỹ thừa cơ số 2 (`Mi`, `Gi`):** **`256Mi`** (*Mebibytes*), `512Mi`, `1Gi = 1024Mi` (tránh nhầm với `M` cơ số 10!).

```visual
kind: compare
title: "Giải Phẫu resources.requests (Đặt Cọc) vs resources.limits (Trần Cứng)"
subtitle: Một bên phục vụ xếp lịch chỗ ngồi trên Control Plane, một bên do nhân Linux cưỡng chế lúc đang chạy!
left:
  badge: "kube-scheduler ĐỌC · Đặt Cọc"
  title: resources.requests (Mức đảm bảo tối thiểu)
  tone: sky
  code: |
    resources:
      requests:
        cpu: "250m"      # Đặt cọc 0.25 vCPU
        memory: "256Mi"  # Đặt cọc 256 Mebibytes RAM
  lang: yaml
  bullets:
    - "Thành phần ==`kube-scheduler`== dùng con số `requests` để tìm Worker Node còn đủ chỗ trống xếp cho Pod mới"
    - "Không bị phạt khi vượt `requests` — đây là phần tài nguyên được dành riêng đảm bảo cho Pod"
    - "Nếu không Node nào trên cụm còn trống đủ `requests`, Pod đứng chờ ở trạng thái **`Pending`**"
right:
  badge: "Linux cgroups CƯỠNG CHẾ · Trần Tối Đa"
  title: resources.limits (Giới hạn cứng không thể vượt)
  tone: amber
  code: |
    resources:
      limits:
        cpu: "500m"      # Trần 0.5 vCPU -> Vượt bị Throttling
        memory: "512Mi"  # Trần 512Mi -> Vượt bị OOMKilled (137)!
  lang: yaml
  bullets:
    - "**Vượt `limits.cpu`:** CPU là tài nguyên nén được nên chỉ bị ==hãm xung nhịp (CPU Throttling)== — phản hồi chậm đi nhưng **KHÔNG bị giết**"
    - "**Vượt `limits.memory`:** RAM không thể nén nên nhân Linux kích hoạt **OOM Killer** bắn chết container ngay lập tức với ==`OOMKilled` (Exit Code 137)==!"
```

> [!TIP] Mẹo vàng cấu hình V8 Heap cho Node.js trên Kubernetes
> Nếu bạn đặt `limits.memory: 512Mi`, hãy truyền biến môi trường `NODE_OPTIONS="--max-old-space-size=384"` cho V8 Heap thấp hơn trần khoảng **25%** để chừa không gian cho bộ nhớ đệm C++/Buffers, giúp trình dọn rác *Garbage Collector* kịp thu hồi bộ nhớ trước khi đụng trần OOM Killer!

## 2. Ba hạng dịch vụ ưu tiên khi Node cạn kiệt RAM: **QoS Classes**

Dựa vào cách bạn viết `requests` và `limits`, Kubernetes tự động xếp hạng từng Pod vào một trong 3 tầng **Quality of Service (QoS)**. Khi một Worker Node bất ngờ cạn sạch RAM vật lý, `kubelet` sẽ nhìn vào hạng QoS này để quyết định **"đuổi (*Evict*) ai trước, bảo vệ ai tới cùng"**:

```visual
kind: groups
title: Ba Hạng Ưu Tiên Bảo Vệ QoS Khi Worker Node Thiếu Bộ Nhớ
subtitle: Thứ tự bị trục xuất (Eviction) đi từ BestEffort -> Burstable -> Guaranteed
columns: 3
items:
  - num: 1
    icon: trash
    title: BestEffort
    badge: Bị đuổi ĐẦU TIÊN
    tone: rose
    desc: Pod thả nổi hoàn toàn không định mức tài nguyên.
    bullets:
      - "Hoàn toàn **không khai báo** bất kỳ `requests` hay `limits` nào"
      - "Khi máy chủ thiếu RAM vật lý, nhóm này bị khai tử đầu tiên không thương tiếc"
    footer: Chỉ dùng cho job thử nghiệm không quan trọng
  - num: 2
    icon: activity
    title: Burstable
    badge: Linh hoạt · Phổ biến nhất
    tone: sky
    desc: Đặt cọc mức nền vừa phải, cho phép bứt tốc giờ cao điểm.
    bullets:
      - "Khai báo `requests` **nhỏ hơn** `limits` (ví dụ `requests: 256Mi`, `limits: 512Mi`)"
      - "Bình thường tiết kiệm chi phí Node, lúc đông khách được phép tăng tốc lên tới `limits`"
    footer: Tiêu chuẩn cho phần lớn Web / REST API
  - num: 3
    icon: shield-check
    title: Guaranteed
    badge: Bảo vệ TỐI THƯỢNG
    tone: emerald
    desc: Đặc quyền bất khả xâm phạm cho dịch vụ lõi sinh tử.
    bullets:
      - "**Mọi container trong Pod** đều khai báo cả CPU lẫn Memory sao cho ==`requests` bằng khít tuyệt đối `limits`== (`cpu: 500m`, `memory: 512Mi`)"
      - "Gần như không bao giờ bị trục xuất trừ khi chính hệ điều hành sập"
    footer: Dành riêng cho Database & cổng thanh toán payment-core
```

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

> [!WARNING] Điều kiện tiên quyết bắt buộc để HPA hoạt động!
> Công thức phần trăm `averageUtilization: 70` được HPA tính bằng `(Lượng CPU thực dùng trung bình) / (resources.requests.cpu)`. Do đó, nếu `Deployment/shop-api` **quên khai báo ==`resources.requests.cpu`==**, mẫu số không xác định khiến HPA báo lỗi `<unknown>/70%` và hoàn toàn tê liệt không thể nhân bản Pod!

## 4. Chạy tác vụ một lần & định kỳ: `Job` và `CronJob` (`batch/v1`)

`Deployment` được sinh ra cho các máy chủ lắng nghe liên tục 24/7: hễ tiến trình kết thúc là nó bật lại ngay. Nhưng với các kịch bản ngắn hạn trong Node.js như **chạy nâng cấp lược đồ DB (`npm run migrate:deploy`)**, kết xuất báo cáo doanh thu cuối ngày hay sao lưu dữ liệu lúc 02:00 sáng, chúng ta cần tiến trình **chạy xong việc rồi thoát mã `0` (`Completed`) và dừng hẳn**:

```visual
kind: groups
title: So Sánh Job (Chạy 1 Lần) & CronJob (Lập Lịch Định Kỳ) — API batch/v1
columns: 2
items:
  - num: 1
    icon: play
    title: Job (batch/v1)
    badge: Chạy xong -> Completed
    tone: emerald
    desc: Thực thi tác vụ một lần duy nhất cho tới khi hoàn tất thành công.
    bullets:
      - "Trường `spec.template.spec.restartPolicy` **chỉ chấp nhận 2 giá trị hợp lệ là ==`Never`== hoặc ==`OnFailure`==** (API Server từ chối thẳng giá trị mặc định `Always`!)"
      - "Dùng **`backoffLimit: 3`** để khoá số lần thử lại tối đa khi gặp lỗi mạng tạm thời, tránh lặp lỗi vô tận"
    code: |
      spec:
        backoffLimit: 3
        template:
          spec:
            restartPolicy: OnFailure
    codeLang: yaml
    footer: Chuẩn cho DB Migration, Seed dữ liệu, Xử lý lô một lần
  - num: 2
    icon: refresh
    title: CronJob (batch/v1)
    badge: Unix Cron 5 trường
    tone: violet
    desc: Tự động đẻ ra các đối tượng Job theo lịch hẹn định kỳ.
    bullets:
      - "Dùng biểu thức Cron 5 trường (`phút giờ ngày tháng thứ`, ví dụ `\"0 2 * * *\"` là 02:00 sáng hàng ngày)"
      - "Cấu hình sống còn ==`concurrencyPolicy: Forbid`==: nếu kỳ chạy lúc 02:00 hôm nay bị kẹt chưa xong, K8s sẽ **bỏ qua kỳ kế tiếp thay vì bật chồng 2 Job chạy đè nhau**!"
    code: |
      spec:
        schedule: "0 2 * * *"
        concurrencyPolicy: Forbid
    codeLang: yaml
    footer: Ngăn khoá bảng Database hoặc gửi trùng email hàng loạt!
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`kube-scheduler`** đọc `resources.requests` (`500m = 0.5 vCPU`) · Vượt `limits.cpu` = **CPU Throttling** (không chết), vượt `limits.memory` = **`OOMKilled` (`Exit Code 137`)**.
> - Hạng ưu tiên cao nhất **`Guaranteed` QoS** đòi hỏi mọi container trong Pod có `requests.cpu === limits.cpu` và `requests.memory === limits.memory`.
> - **HPA (`autoscaling/v2`)** bắt buộc phải có `resources.requests.cpu` · **`Job`** chỉ cho phép `restartPolicy: Never | OnFailure` · **`CronJob`** dùng `concurrencyPolicy: Forbid` để chống chạy chồng chéo.

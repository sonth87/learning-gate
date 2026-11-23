# Quản trị Tài nguyên, Hạng ưu tiên QoS, Tự động co giãn HPA & Tác vụ nền Job/CronJob

Trên máy tính cá nhân, một tiến trình Python hay Node.js có thể thoải mái chiếm bao nhiêu CPU và RAM tùy thích. Nhưng trên cụm Kubernetes dùng chung nơi 40 dịch vụ cùng chia sẻ tài nguyên của các Worker Node, một worker xử lý dữ liệu bị rò rỉ bộ nhớ (*Memory Leak*) hoặc tính toán JSON khổng lồ có thể "hút cạn máu" toàn bộ máy chủ, làm vạ lây cả các dịch vụ thanh toán quan trọng đang nằm cùng Node!

Trong bài học này, bạn sẽ nắm trọn bộ ba trụ cột quản trị năng lực của Kubernetes: định mức **`resources` (`requests` vs `limits`) & QoS**, tự động nhân bản theo tải thực tế với ==`HorizontalPodAutoscaler` (`autoscaling/v2`)==, và chạy tác vụ một lần / định kỳ với **`Job` & `CronJob` (`batch/v1`)**.

```visual
kind: illustration
diagram: "kube:k15"
src: "/illustrations/kube/k8s-oom-vs-throttling.jpg"
alt: "So sánh CPU Throttling với Memory OOMKilled (Exit Code 137), cơ chế tự động co giãn HPA v2 và tác vụ định kỳ Job/CronJob"
title: "Cơ Chế Quản Trị Tài Nguyên: CPU Throttling vs OOM 137, Co Giãn HPA & Tác Vụ CronJob"
subtitle: "Định mức chính xác phần cứng cho từng Pod, tự động nhân bản theo tải thực tế và thực thi tác vụ nền chạy tới khi hoàn tất"
caption: "Sự khác biệt quan trọng giữa vượt trần CPU (chỉ hãm xung) và vượt trần RAM (bị giết OOM 137), vòng lặp co giãn HPA v2 và lịch trình CronJob"
callouts:
  - num: 1
    label: "requests/limits — Hãm xung CPU vs Bắn hạ OOM 137"
    desc: "kube-scheduler dựa vào requests để xếp chỗ; lúc chạy nếu vượt limits.cpu chỉ bị chậm đi, nhưng vượt limits.memory sẽ nổ OOMKilled 137!"
    tone: amber
  - num: 2
    label: "HPA (autoscaling/v2) — Tự động co giãn theo tải"
    desc: "Đọc số liệu thực tế từ Metrics Server để tự động tăng/giảm số bản sao Deployment; bắt buộc Pod phải khai báo trước requests.cpu."
    tone: emerald
  - num: 3
    label: "Job & CronJob — Tác vụ nền chạy tới Exit Code 0"
    desc: "Khác với Deployment chạy mãi mãi, Job thực thi xong tác vụ là dừng ở trạng thái Completed và ngăn chạy chồng chéo bằng Forbid."
    tone: cyan
```

## 1. Phân biệt `resources.requests` và `resources.limits`

> [!NOTE] Phân biệt `resources.requests` (mức đảm bảo) và `resources.limits` (giới hạn tối đa)
> - **`resources.requests`:** Lượng tài nguyên tối thiểu mà Pod yêu cầu được cấp phát. Thành phần **`kube-scheduler`** chỉ dựa vào con số `requests` này để tìm Worker Node còn đủ chỗ trống xếp lịch cho Pod, và HPA cũng dùng `requests` làm mẫu số tính phần trăm tải.
> - **`resources.limits`:** Ngưỡng tiêu thụ tối đa mà container không được phép vượt quá trong quá trình chạy thực tế, được nhân Linux **`cgroups`** kiểm soát trực tiếp. Nếu Node còn dư tài nguyên, Pod được phép dùng vượt `requests` nhưng sẽ bị chặn lại tại vạch `limits`. *(Có thể hình dung `requests` như phần chỗ ngồi đặt trước để Scheduler xếp lên Node, còn `limits` là cầu dao trần tối đa khi đang vận hành.)*

Về đơn vị đo lường trong Kubernetes:
- [>] **CPU tính bằng Millicores (`m`):** `1000m = 1 vCPU` (1 nhân ảo trọn vẹn) → **`500m = 0.5 vCPU`**, **`250m = 0.25 vCPU`**.
- [>] **RAM tính bằng lũy thừa cơ số 2 (`Mi`, `Gi`):** **`256Mi`** (*Mebibytes*), `512Mi`, `1Gi = 1024Mi` (luôn dùng chữ `Mi` / `Gi` có chữ `i` cho rõ nghĩa nhị phân!).

```visual
kind: compare
title: "So Sánh resources.requests (Đặt Chỗ) vs resources.limits (Giới Hạn Cứng)"
subtitle: Một bên phục vụ xếp lịch chỗ ngồi trên Control Plane, một bên do nhân Linux cưỡng chế lúc đang chạy!
left:
  badge: "kube-scheduler ĐỌC · Đặt Chỗ"
  title: resources.requests (Mức đảm bảo tối thiểu)
  tone: sky
  code: |
    resources:
      requests:
        cpu: "250m"      # Giữ chỗ 0.25 vCPU
        memory: "256Mi"  # Giữ chỗ 256 Mebibytes RAM
  lang: yaml
  bullets:
    - "Thành phần ==`kube-scheduler`== dùng con số `requests` để tìm Worker Node còn đủ chỗ trống xếp cho Pod mới"
    - "Đồng thời **HPA dùng chính `requests`** làm mẫu số để tính phần trăm tải!"
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
    - "**Vượt `limits.cpu`:** CPU là tài nguyên nén được nên chỉ bị ==hãm xung nhịp (`CPU Throttling`)== — phản hồi chậm đi đôi chút nhưng **KHÔNG bị giết**"
    - "**Vượt `limits.memory`:** RAM không thể nén nên nhân Linux kích hoạt **OOM Killer**, bắn chết container ngay lập tức với ==`OOMKilled` (`Exit Code 137`)==!"
```

> [!TIP] Kinh nghiệm đặt `limits` thực chiến năm 2026 cho Python & Node.js
> - **Về RAM:** Luôn đặt `requests.memory` sát thực tế và `limits.memory` dư khoảng 25–40% cho đỉnh tải ngắn hạn (với Node.js đặt `NODE_OPTIONS="--max-old-space-size=..."` ~75% trần; với Python AI/Pandas tính kỹ dung lượng mô hình nạp vào RAM).
> - **Về CPU:** Đừng siết `limits.cpu` quá thấp (ví dụ `100m`), vì lúc khởi động ứng dụng FastAPI / TypeScript cần bứt tốc nạp hàng trăm module — siết quá chặt sẽ gây *CPU Throttling* làm thời gian khởi động chậm gấp 5 lần!

## 2. Cơ chế ưu tiên khi Node thiếu RAM: **3 hạng QoS Classes**

Dựa vào cách bạn khai báo `requests` và `limits`, Kubernetes tự động xếp hạng từng Pod vào một trong 3 cấp **Quality of Service (QoS)**. Khi một Worker Node bất ngờ cạn kiệt RAM vật lý, `kubelet` sẽ dựa vào cấp QoS này để quyết định thứ tự trục xuất Pod (*Eviction*) nhằm giải phóng bộ nhớ cho hệ thống:

```visual
kind: groups
title: 3 Hạng QoS Classes Khi Worker Node Thiếu Bộ Nhớ
subtitle: Thứ tự bị trục xuất khỏi Node (Eviction) đi từ BestEffort -> Burstable -> Guaranteed
columns: 3
items:
  - num: 1
    icon: trash
    title: BestEffort
    badge: Bị đuổi ĐẦU TIÊN
    tone: rose
    desc: Mức ưu tiên thấp nhất khi không khai báo tài nguyên.
    bullets:
      - "Hoàn toàn **không khai báo** bất kỳ `requests` hay `limits` nào"
      - "Khi máy chủ thiếu RAM vật lý, nhóm này bị loại bỏ đầu tiên ngay lập tức"
    footer: Chỉ dùng cho job nháp thử nghiệm không quan trọng
  - num: 2
    icon: activity
    title: Burstable
    badge: Linh hoạt · Phổ biến nhất
    tone: sky
    desc: Đặt mức nền vừa phải, cho phép dùng thêm khi Node còn dư tài nguyên.
    bullets:
      - "Khai báo `requests` **nhỏ hơn** `limits` (ví dụ `requests: 256Mi`, `limits: 512Mi`)"
      - "Bình thường tiết kiệm chi phí Node, lúc đông khách được phép tăng tốc lên tới `limits`"
    footer: Tiêu chuẩn cho phần lớn Web / FastAPI / Node REST API
  - num: 3
    icon: shield-check
    title: Guaranteed
    badge: Ưu tiên cao nhất
    tone: emerald
    desc: Mức bảo vệ cao nhất cho các dịch vụ lõi quan trọng.
    bullets:
      - "**Mọi container trong Pod** đều khai báo cả CPU lẫn Memory sao cho ==`requests` bằng khít tuyệt đối `limits`== (`cpu: 500m`, `memory: 512Mi`)"
      - "Được bảo vệ tới cùng, gần như không bao giờ bị trục xuất khỏi Node"
    footer: Dành riêng cho Database & cổng thanh toán payment-core
```

## 3. Tự động co giãn theo lưu lượng thật: `HorizontalPodAutoscaler` (`autoscaling/v2`)

Thay vì thức đêm gõ tay `kubectl scale` mỗi dịp Flash Sale rồi sáng hôm sau lại giảm tay cho đỡ tốn tiền Cloud, **`HorizontalPodAutoscaler` (HPA)** liên tục đọc chỉ số thực tế từ **Metrics Server** mỗi 15 giây và tự động tăng/giảm số `replicas` của `Deployment`:

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
> Con số `averageUtilization: 70` được HPA tính bằng `(CPU thực dùng trung bình) / (resources.requests.cpu)`. Do đó, nếu `Deployment/shop-api` **quên khai báo ==`resources.requests.cpu`==**, phép chia mất mẫu số khiến HPA báo `<unknown>/70%` và hoàn toàn tê liệt không thể nhân bản Pod!

## 4. Chạy tác vụ một lần & định kỳ: `Job` và `CronJob` (`batch/v1`)

`Deployment` sinh ra cho Web Server chạy 24/7 (thoát là bật lại). Nhưng với các tác vụ ngắn hạn như **chạy Database Migration (`alembic upgrade head` trong Python hoặc `prisma migrate deploy` trong Node.js)**, tổng hợp báo cáo cuối ngày hay huấn luyện lô dữ liệu lúc `02:00` sáng, ta cần tiến trình **chạy xong việc rồi thoát mã `0` (`Completed`) và nghỉ ngơi**:

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
      - "Trường `spec.template.spec.restartPolicy` **chỉ chấp nhận 2 giá trị hợp lệ là **`Never`** hoặc **`OnFailure`** (API Server từ chối thẳng giá trị mặc định `Always`!)"
      - "Dùng **`backoffLimit: 3`** để khóa số lần thử lại tối đa khi gặp lỗi mạng tạm thời, tránh lặp lỗi vô tận"
    code: |
      spec:
        backoffLimit: 3
        template:
          spec:
            restartPolicy: OnFailure
    codeLang: yaml
    footer: Chuẩn cho DB Migration (Alembic / Prisma), Seed dữ liệu
  - num: 2
    icon: refresh
    title: CronJob (batch/v1)
    badge: Unix Cron 5 trường
    tone: cyan
    desc: Tự động đẻ ra các đối tượng Job theo lịch hẹn định kỳ.
    bullets:
      - "Dùng biểu thức Cron 5 trường (`phút giờ ngày tháng thứ`, ví dụ `\"0 2 * * *\"` là 02:00 sáng hàng ngày)"
      - "Cấu hình quan trọng ==`concurrencyPolicy: Forbid`==: nếu kỳ chạy lúc 02:00 hôm nay còn chưa xong, K8s sẽ **bỏ qua kỳ kế tiếp thay vì bật chồng 2 Job chạy đè nhau**!"
    code: |
      spec:
        schedule: "0 2 * * *"
        concurrencyPolicy: Forbid
    codeLang: yaml
    footer: Ngăn khóa bảng Database hoặc gửi trùng email hàng loạt!
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`kube-scheduler`** đọc `resources.requests` (`500m = 0.5 vCPU`) · Vượt `limits.cpu` = **CPU Throttling** (chậm nhưng không chết), vượt `limits.memory` = **`OOMKilled` (`Exit Code 137`)**.
> - Hạng ưu tiên cao nhất **`Guaranteed` QoS** đòi hỏi mọi container trong Pod có `requests.cpu == limits.cpu` và `requests.memory == limits.memory`.
> - **HPA (`autoscaling/v2`)** bắt buộc phải có `resources.requests.cpu` · **`Job`** chỉ cho phép `restartPolicy: Never | OnFailure` · **`CronJob`** dùng `concurrencyPolicy: Forbid` chống chạy chồng chéo.

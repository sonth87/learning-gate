# Deployment, Tự chữa lành, Rolling Update không gián đoạn & Rollback tức thì

Ở bài `K08`, bạn đã biết cách viết một `Pod` đơn lẻ. Nhưng có một quy luật sắt đá trong thực tế: ==trên Production, không bao giờ triển khai ứng dụng bằng Pod trần (naked Pod)!==

Để biến những chiếc Pod mỏng manh thành một dịch vụ bất tử có khả năng {emerald:tự hồi sinh}, {sky:co giãn nhiều bản sao} và {violet:nâng cấp không gián đoạn (Zero-Downtime)}, chúng ta trao quyền giám hộ cho **`Deployment`** (`apiVersion: apps/v1`).

## 1. Chuỗi phân cấp quyền lực: `Deployment` → `ReplicaSet` → `Pod`

```visual
kind: compare
title: Tại Sao Cấm Kỵ Chạy Naked Pod Trên Production?
subtitle: Sự khác biệt sinh tử khi một Worker Node bất ngờ sập nguồn lúc nửa đêm
left:
  badge: "NGUY HIỂM · Naked Pod (Pod trần)"
  title: Mồ côi không người giám hộ
  tone: rose
  code: |
    apiVersion: v1
    kind: Pod
    metadata:
      name: shop-web
  lang: yaml
  bullets:
    - "Nếu Worker Node chứa nó mất điện hoặc ai đó lỡ gõ `kubectl delete pod shop-web`, Pod **chết vĩnh viễn không bao giờ sống lại**"
    - "Không thể tự nhân bản lên 3–5 bản sao để chịu tải cao"
    - "Muốn đổi phiên bản Image phải tắt Pod cũ gây gián đoạn dịch vụ (Downtime)"
right:
  badge: "CHUẨN PRODUCTION · Deployment"
  title: Tự chữa lành, Co giãn & Xoay vòng êm ái
  tone: emerald
  code: |
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: shop-api
    spec:
      replicas: 3
  lang: yaml
  bullets:
    - "**Self-Healing:** Node sập làm mất 1 Pod -> `ReplicaSet` tự động đẻ bù Pod mới sang Node khoẻ mạnh"
    - "**Horizontal Scaling:** Tăng/giảm từ 3 lên 10 bản sao chỉ bằng 1 lệnh"
    - "**Rolling Update & Rollback:** Nâng cấp phiên bản mới không rớt request nào và quay lui tức thì trong 2 giây!"
```

```visual
kind: flow
title: Chuỗi Uỷ Quyền 3 Tầng Tự Động Của Deployment
subtitle: Bạn chỉ viết và nộp duy nhất tệp Deployment — hai tầng phía dưới được K8s điều phối hoàn toàn tự động
steps:
  - icon: rocket
    badge: Tầng 1 · Bạn quản lý
    title: Deployment
    desc: Quản lý chiến lược chuyển đổi giữa các phiên bản (Rolling Update) & lưu lịch sử Revision để Rollback
    code: "kubectl apply -f deploy.yaml"
    tone: violet
    edge: tự tạo & điều phối
  - icon: layers
    badge: Tầng 2 · Trung gian ngầm
    title: ReplicaSet
    desc: Quản đốc điểm danh quân số của MỘT phiên bản cụ thể — luôn canh gác đảm bảo đủ đúng số Pod sống
    code: "replicas: 3"
    tone: sky
    edge: đếm qua matchLabels
  - icon: boxes
    badge: Tầng 3 · Tiến trình thực
    title: Pods (Hậu tố ngẫu nhiên)
    desc: Các Pod thực thi mang tên động; nếu 1 Pod sập, ReplicaSet lập tức tạo Pod mới thay thế
    code: "shop-api-6b7f8c9-x92lm"
    tone: emerald
```

## 2. Nguyên tắc khớp nối sống còn: `selector.matchLabels` và `template.metadata.labels`

Trong một `Deployment` (`apiVersion: apps/v1`), có hai vị trí khai báo nhãn bắt buộc phải ăn khớp chặt chẽ với nhau:

```yaml Khớp nối selector.matchLabels (A) với template.metadata.labels (B)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: shop-api          # (A) Kính lúp để Deployment/ReplicaSet nhận diện "con của mình"
  template:
    metadata:
      labels:
        app: shop-api        # (B) Con dấu đóng lên trán từng Pod lúc mới đẻ ra!
    spec:
      containers:
        - name: api
          image: ghcr.io/acme/shop-api:1.2.0
```

> [!WARNING] Lỗi Validation kinh điển khi lệch nhãn `(A)` và `(B)`
> Hãy tưởng tượng `(B)` (`spec.template.metadata.labels`) là thẻ tên đeo lên áo từng Pod sinh ra, còn `(A)` (`spec.selector.matchLabels`) là bộ lọc điểm danh quân số. **Mọi cặp khoá-giá trị trong `(A)` BẮT BUỘC phải có mặt y hệt trong `(B)`!**
> Nếu `(A)` ghi `{ app: "web" }` mà `(B)` lại ghi `{ app: "frontend" }`, Kubernetes API Server sẽ từ chối ngay lập tức với lỗi:
> ==`Invalid value: 'selector' does not match template 'labels'`==.

## 3. Chiến lược nâng cấp không gián đoạn: `RollingUpdate` (`maxUnavailable: 0`)

Khi bạn nâng `image` từ `1.2.0` lên `1.3.0`, mặc định Kubernetes dùng chiến lược **`RollingUpdate`**. Để đảm bảo ==Zero-Downtime tuyệt đối== không bao giờ hụt năng lực phục vụ ở giờ cao điểm, ta kết hợp bộ đôi tham số vàng:

- [x] **`maxUnavailable: 0`:** Trong suốt lúc nâng cấp, số Pod sẵn sàng phục vụ (`Ready`) **không được phép tụt xuống thấp hơn `replicas` ban đầu** dù chỉ 1 Pod! (Ví dụ với `replicas: 4`, cụm luôn giữ tối thiểu `4 - 0 = 4` Pod sẵn sàng).
- [x] **`maxSurge: 1`:** Cho phép cụm bật vọt thêm tối đa `1` Pod mới vượt trên mức `replicas` (với `replicas: 3` là tạm thời lên `4` Pod; với `replicas: 4` là bật vọt lên tối đa **`5` Pod**). Chỉ khi Pod mới báo `Ready`, K8s mới tắt 1 Pod cũ!

```visual
kind: flow
title: Diễn Biến RollingUpdate Không Gián Đoạn (maxUnavailable = 0, maxSurge = 1)
subtitle: Ví dụ với replicas = 4 — luôn giữ tối thiểu 4 Pod Ready và cho phép vọt lên tối đa 5 Pod lúc chuyển giao
steps:
  - icon: check
    badge: Bước 1 · Ổn định
    title: ReplicaSet v1 (4 Pod)
    desc: Phiên bản cũ v1.2.0 đang phục vụ ổn định với đủ 4/4 Pod Ready
    code: "v1: 4 Ready | v2: 0"
    tone: sky
    edge: đổi sang image 1.3.0
  - icon: zap
    badge: Bước 2 · Surge (+1)
    title: Bật Thêm 1 Pod Mới
    desc: Tạo ReplicaSet v2 bật trước 1 Pod mới — tổng số Pod tạm vọt lên 4 + 1 = 5 Pod
    code: "v1: 4 Ready | v2: 1 Creating"
    tone: violet
    edge: chờ Pod mới Ready
  - icon: refresh
    badge: Bước 3 · Xoay Vòng
    title: Mới Khỏe Mới Tắt Cũ
    desc: Khi Pod v2 báo Ready, K8s mới rút 1 Pod v1 — lặp lại cuốn chiếu đến hết 4 Pod
    code: "Luôn >= 4 Pod Ready!"
    tone: emerald
    edge: lưu lịch sử Revision
  - icon: rollback
    badge: Bước 4 · Giữ Lịch Sử
    title: ReplicaSet Cũ Hạ Về 0
    desc: ReplicaSet v2 đạt 4/4; ReplicaSet v1 hạ về 0 bản sao nhưng vẫn giữ lại để Rollback tức thì
    code: "v2: 4 Ready | v1: 0 (Saved)"
    tone: amber
```

```yaml Cấu hình chiến lược RollingUpdate an toàn tuyệt đối trong Deployment.spec
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
```

## 4. Co giãn nóng (`scale`) và Cứu hoả khẩn cấp (`rollout undo`)

Nhờ `Deployment` giữ lại các `ReplicaSet` cũ (hạ số bản sao về `0`) trong lịch sử theo `spec.revisionHistoryLimit` (mặc định lưu **10 bản**), nếu bản `2.0.0-crash` vừa đẩy lên dính lỗi `TypeError` rơi vào `CrashLoopBackOff`, bạn không cần chờ CI/CD build lại mất 10 phút mà có thể ==quay ngược thời gian trong 2 giây==!

```visual
kind: groups
title: Bảng Lệnh Điều Hành Co Giãn & Rollback Khẩn Cấp [!badge:emerald:Thực Chiến]
columns: 2
items:
  - num: 1
    icon: activity
    title: Co Giãn Quân Số Tức Thì (Scale)
    badge: Horizontal Scaling
    tone: sky
    bullets:
      - "Cập nhật ngay trạng thái mong muốn lên **5 Pod** khi lưu lượng tăng vọt"
      - "`ReplicaSet` lập tức tạo bù (hoặc cắt bớt) để hội tụ đúng **5 Pod** đang chạy"
    code: |
      kubectl scale deployment/shop-api --replicas=5
    codeLang: bash
  - num: 2
    icon: rollback
    title: Kiểm Tra Lịch Sử & Quay Lui 2 Giây (Undo)
    badge: Emergency Rollback
    tone: emerald
    bullets:
      - "`rollout status`: Theo dõi tiến trình xoay vòng trực tiếp tới khi hoàn tất 100%"
      - "`rollout history`: Xem danh sách các Revision đã lưu"
      - "==`kubectl rollout undo`==: Hạ `ReplicaSet` lỗi về `0` và nâng bản ổn định liền trước lên lại ngay lập tức (hoặc thêm `--to-revision=N`)"
    code: |
      kubectl rollout status deployment/checkout
      kubectl rollout history deployment/checkout
      kubectl rollout undo deployment/checkout
    codeLang: bash
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - Chuỗi uỷ quyền chuẩn: **`Deployment`** (quản lý phiên bản & lịch sử) → **`ReplicaSet`** (đếm và giữ quân số Pod) → **`Pod`**.
> - Mọi nhãn trong `spec.selector.matchLabels` bắt buộc phải khớp trong `spec.template.metadata.labels`.
> - `maxUnavailable: 0` + `maxSurge: 1` bảo đảm không hụt quân số khi nâng cấp · Co giãn bằng `kubectl scale ... --replicas=5` · Cứu hoả tức khắc bằng **`kubectl rollout undo deployment/<tên>`**.

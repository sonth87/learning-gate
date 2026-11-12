# Pod, Labels, Namespaces & Kéo Image từ Kho riêng tư

Khi mới chuyển từ Docker sang Kubernetes, câu hỏi đầu tiên mà hầu hết lập trình viên Node.js thắc mắc là: *"Tại sao Kubernetes không quản lý trực tiếp từng Container cho gọn, mà lại đẻ thêm khái niệm **Pod** bọc ở bên ngoài?"*

Hiểu thấu đáo thiết kế của ==Pod==, hệ thống gắn thẻ {sky:Labels}, vách ngăn {violet:Namespaces} và chứng chỉ kéo Image {amber:`imagePullSecrets`} sẽ giúp bạn nắm chắc viên gạch nguyên tử của toàn bộ hệ sinh thái Kubernetes.

## 1. Tại sao đơn vị nhỏ nhất là Pod chứ không phải Container?

> [!ANALOGY] Hãy hình dung như sau
> Hãy coi **Pod** như một **"vỏ kén"** (hoặc một chiếc máy tính lô-gic siêu nhỏ). Trong **95% trường hợp thực tế**, một Pod chỉ bọc **đúng 1 container chính** (ví dụ API Node.js của bạn). Nhưng trong 5% trường hợp nâng cao, ứng dụng chính cần một tiến trình trợ lý sát sườn gọi là **Sidecar Container** (như đại lý thu gom log Fluent Bit, proxy mã hoá Envoy/Istio, hoặc trình đồng bộ chứng chỉ Vault).

```visual
kind: layers
title: Không Gian Chia Sẻ Bên Trong Cùng Một Pod vs Hai Pod Khác Nhau
subtitle: Mọi container trong cùng một Pod dùng chung Network Namespace (chung IP & localhost) và không được mở trùng cổng!
columns:
  - title: Bên Trong Cùng 1 Pod (Main + Sidecar)
    badge: Chung IP · Gọi qua localhost
    tone: emerald
    layers:
      - label: Container Chính (api — cổng 3000) + Sidecar (log-shipper)
        sub: Sidecar gọi thẳng localhost:3000 — hai container trong cùng 1 Pod KHÔNG ĐƯỢC mở trùng cổng 3000 trên 0.0.0.0!
        note: Phối hợp sát sườn
        tone: emerald
      - label: Chung một Network Namespace (1 Địa chỉ IP + Loopback 127.0.0.1)
        sub: Toàn bộ container trong vỏ kén Pod chia sẻ cùng một địa chỉ IP nội bộ và một bảng cổng mạng duy nhất
        note: Không cần qua mạng ngoài
        tone: sky
      - label: Chung ổ đĩa tạm (Shared Volume emptyDir)
        sub: Container chính ghi tệp log ra đĩa, Sidecar đọc và đẩy đi ngay lập tức ở tốc độ ổ cứng cục bộ
        note: Chia sẻ tệp tức thì
        tone: cyan
    footer: Đơn vị nguyên tử nhỏ nhất được kube-scheduler xếp chỗ lên cùng một Worker Node
  - title: Hai Pod Khác Nhau Trên Cụm
    badge: Khác IP hoàn toàn · Cô lập mạng
    tone: violet
    layers:
      - label: Pod A (shop-web — IP 10.244.1.12:80)
        sub: Sở hữu Network Namespace riêng, có thể mở cổng 80 hoặc 3000 hoàn toàn độc lập với Pod khác
        note: Vỏ kén độc lập #1
        tone: violet
      - label: Pod B (payment-api — IP 10.244.2.35:3000)
        sub: Có địa chỉ IP riêng biệt hoàn toàn — không bao giờ gọi sang Pod A qua localhost được
        note: Vỏ kén độc lập #2
        tone: amber
      - label: Mạng ảo toàn cụm (Cluster CNI + Service DNS)
        sub: Hai Pod khác nhau giao tiếp thông qua mạng cụm (thực tế luôn đi qua tên miền Service ổn định)
        note: Kết nối qua Service
        tone: slate
    footer: Có thể nằm trên cùng một Worker Node hoặc rải sang hai Worker Node khác nhau
```

```yaml Manifest Pod chuẩn đính kèm nhãn phân loại (metadata.labels)
apiVersion: v1
kind: Pod
metadata:
  name: shop-web
  labels:
    app: shop-web
    tier: frontend
spec:
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      ports:
        - containerPort: 80
```

## 2. Labels & Selectors: Sợi dây liên kết lỏng (Loose Coupling) của cả cụm

Trên một cụm Kubernetes chạy 500 Pod đủ loại (Frontend, Order API, Payment Worker, Redis...), Kubernetes **không dùng danh sách tên cứng** để gom nhóm chúng, vì tên Pod sinh tự động thay đổi liên tục mỗi lần cập nhật (`shop-api-7d9f8b-xk2lp`). Thay vào đó, K8s dùng ==`metadata.labels`== — các cặp khoá-giá trị (`key: value`) để truy vấn động tương tự thẻ Issue trên GitHub:

```visual
kind: groups
title: Ba Chiều Nhãn (Labels) Phổ Biến & Cách Toàn Cụm Truy Vấn Chúng
subtitle: Labels + Selectors là cơ chế kết nối lỏng trung tâm giúp Service, Deployment và NetworkPolicy tìm đúng Pod
columns: 3
items:
  - num: 1
    icon: network
    title: "app (hoặc app.kubernetes.io/name)"
    badge: Định danh dịch vụ
    tone: sky
    bullets:
      - "Ví dụ giá trị: `shop-api`, `postgres`, `redis`"
      - "**`Service`** dùng nhãn này để tìm các Pod nhận chia tải HTTP"
      - "**`Deployment`** dùng nhãn này để điểm danh đủ quân số bản sao"
  - num: 2
    icon: shield
    title: tier
    badge: Phân tầng kiến trúc
    tone: violet
    bullets:
      - "Ví dụ giá trị: `frontend`, `backend`, `cache`"
      - "**`NetworkPolicy`** dựa vào đây để khoá tường lửa nội bộ (chỉ cho tầng `backend` gọi vào `cache`)"
  - num: 3
    icon: search
    title: env
    badge: Lọc theo môi trường
    tone: emerald
    bullets:
      - "Ví dụ giá trị: `dev`, `staging`, `production`"
      - "Lọc siêu tốc trên CLI bằng cờ `-l`:"
    code: |
      kubectl get pods -l env=staging,tier=backend
    codeLang: bash
```

> [!WARNING] Nhãn (`labels`) KHÔNG PHẢI là vật trang trí!
> Chỉ một ký tự viết sai chính tả trong `metadata.labels` (ví dụ gõ nhầm `app: shop-backned` thay vì `app: shop-backend`) sẽ khiến **`Service` mất trắng kết nối tới Pod ngay lập tức**!

## 3. Namespaces: Chia cụm vật lý thành nhiều không gian tên độc lập

Nếu hai đội dự án (`team-a` và `team-b`) hoặc hai môi trường (`staging` và `production`) dùng chung một cụm vật lý, làm sao cả hai cùng tạo được `Service` trùng tên `api-svc` hay `shop-api` mà không đè lên nhau? Câu trả lời là **Namespaces** — các vách ngăn lô-gic bên trong cụm:

```visual
kind: groups
title: Phân Vùng Cụm Bằng Namespaces — Tránh Đụng Độ Tên & Khoá Hạn Ngạch
columns: 3
items:
  - num: 1
    icon: box
    title: default
    badge: Mặc định ban đầu
    tone: slate
    bullets:
      - "Không gian mặc định khi bạn không truyền cờ `-n` hoặc không khai báo `metadata.namespace`"
      - "Tiện cho việc học nhanh trên máy local, nhưng hạn chế nhét mọi dịch vụ Production chung vào đây"
  - num: 2
    icon: settings
    title: kube-system
    badge: Nội tạng hệ thống
    tone: rose
    bullets:
      - "Nơi ở của các thành phần sống còn như **`coredns`**, **`kube-proxy`**, CNI mạng"
      - "**Tuyệt đối không** triển khai ứng dụng kinh doanh vào `kube-system`!"
  - num: 3
    icon: layers
    title: "Namespace Tự Tạo (staging, payments...)"
    badge: Chuẩn đa đội dự án
    tone: emerald
    bullets:
      - "Tên `Pod`, `Deployment`, `Service`, `ConfigMap`, `Secret` **chỉ cần duy nhất trong phạm vi 1 Namespace**"
      - "Dễ dàng áp hạn ngạch tổng CPU/RAM (`ResourceQuota`) và phân quyền RBAC riêng cho từng đội"
```

Khi gộp nhiều tài nguyên liên quan vào **cùng một tệp YAML**, ta dùng dòng ==ba dấu gạch ngang `---`== để phân tách giữa các document:

```yaml Gộp Namespace và Pod trong cùng 1 tệp YAML bằng dấu phân tách ---
apiVersion: v1
kind: Namespace
metadata:
  name: staging
---
apiVersion: v1
kind: Pod
metadata:
  name: worker-pod
  namespace: staging
spec:
  containers:
    - name: worker
      image: node:22-alpine
```

Trên dòng lệnh Imperative để thử nghiệm nhanh, bạn có thể tạo Namespace và chạy Pod trực tiếp kèm cờ `-n`:

```bash
kubectl create ns payments
kubectl run fraud-check --image=node:22-alpine -n payments
```

## 4. Kéo Image từ Kho riêng tư (Private Registry) với `imagePullSecrets`

Các Image công cộng như `node:22-alpine` ai kéo cũng được, nhưng mã nguồn thương mại luôn nằm trong kho riêng tư (**GitHub Container Registry `ghcr.io`**, **AWS ECR**, **Harbor** hoặc `private.registry.local`). Nếu thiếu xác thực, Pod sẽ kẹt cứng ở lỗi ==`ErrImagePull` / `ImagePullBackOff`== (`401 Unauthorized`).

```visual
kind: flow
title: Quy Trình 2 Bước Xác Thực Kéo Image Riêng Tư Không Dính ImagePullBackOff
steps:
  - icon: key
    badge: Bước 1 · Tạo thẻ
    title: Secret dockerconfigjson
    desc: Tạo Secret kiểu kubernetes.io/dockerconfigjson chứa thông tin đăng nhập Registry
    code: "name: regcred"
    tone: amber
    edge: gắn vào Pod spec
  - icon: file-code
    badge: Bước 2 · Đính kèm
    title: spec.imagePullSecrets
    desc: Tham chiếu tên Secret vào mảng imagePullSecrets của Pod hoặc Deployment template
    code: "imagePullSecrets: [regcred]"
    tone: sky
    edge: kubelet xác thực
  - icon: container
    badge: Bước 3 · Tải thành công
    title: Running Container
    desc: kubelet trình thẻ cho Private Registry, kéo Image mượt mà và khởi chạy Pod
    code: "1/1 Running"
    tone: emerald
```

```yaml Đính kèm spec.imagePullSecrets để kéo Image nội bộ
apiVersion: v1
kind: Pod
metadata:
  name: shop-private-api
spec:
  imagePullSecrets:
    - name: regcred
  containers:
    - name: api
      image: private.registry.local/shop/api:1.4.2
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - Các container trong **cùng một Pod** chia sẻ chung IP + `localhost` + bảng cổng (không được bind trùng cổng `3000`!) và có thể dùng chung ổ đĩa `emptyDir`.
> - **`metadata.labels`** là sợi dây liên kết lỏng để `Service`, `Deployment`, `NetworkPolicy` tìm đúng Pod; **`---`** ngăn cách nhiều tài nguyên trong cùng 1 tệp YAML.
> - Quên cấp quyền kéo Image riêng tư gây lỗi **`ErrImagePull` / `ImagePullBackOff`** — khắc phục bằng **`spec.imagePullSecrets`** trỏ tới Secret `kubernetes.io/dockerconfigjson`.

# Pod, Labels, Namespaces & Kéo Image từ Kho riêng tư

Khi mới chuyển từ Docker sang Kubernetes, câu hỏi đầu tiên mà hầu hết lập trình viên (**Python, Node.js, Go...**) đều thắc mắc là: *"Tại sao Kubernetes không quản lý trực tiếp từng Container cho gọn, mà lại đẻ thêm khái niệm **Pod** bọc ở bên ngoài?"*

Hiểu thấu đáo thiết kế "vỏ kén" của ==Pod==, hệ thống thẻ từ **Labels**, vách ngăn tầng lầu **Namespaces** và thẻ thông hành `imagePullSecrets` sẽ giúp bạn nắm chắc viên gạch nguyên tử của toàn bộ hệ sinh thái Kubernetes.

```visual
kind: illustration
diagram: "kube:k08"
alt: "Không gian mạng chia sẻ localhost bên trong Pod (Main + Sidecar), cơ chế khớp nhãn Labels/Selectors và ranh giới Namespace"
title: "Giải Phẫu Pod Sandbox, Ma Trận Nhãn Labels/Selectors & Vách Ngăn Namespace"
subtitle: "Cách các container trong cùng 1 Pod chia sẻ địa chỉ IP/localhost và cách toàn cụm liên kết lỏng qua hệ thống nhãn động"
caption: "Cấu trúc không gian cô lập của Pod chia sẻ Network Namespace & ổ đĩa emptyDir, bộ lọc chọn lọc theo nhãn và ranh giới phân tách tài nguyên giữa các Namespace"
callouts:
  - num: 1
    label: "Pod Sandbox — Dùng chung IP & Loopback localhost"
    desc: "Container chính và Sidecar chia sẻ cùng một Network Namespace nên gọi nhau thẳng qua 127.0.0.1 và dùng chung ổ đĩa tạm emptyDir."
    tone: emerald
  - num: 2
    label: "Labels & Selectors — Sợi dây liên kết lỏng"
    desc: "Thay vì trỏ vào tên Pod ngẫu nhiên hay đổi, Service và Deployment quét tìm đúng nhóm Pod thông qua các cặp nhãn key: value."
    tone: sky
  - num: 3
    label: "Namespace — Ranh giới phạm vi tên & hạn mức"
    desc: "Tách biệt môi trường staging và production trên cùng một cụm vật lý; ConfigMap và Secret không tự động chia sẻ xuyên qua Namespace."
    tone: cyan
```

## 1. Tại sao đơn vị nhỏ nhất trên K8s là `Pod` chứ không phải `Container`?

> [!NOTE] Mô hình tư duy "Vỏ kén Đậu Hà Lan" (`Pod`)
> Trong tiếng Anh, *pod* nghĩa là vỏ quả đậu bọc một hoặc vài hạt đậu bên trong. Hãy coi **Pod** như một **"căn hộ mini dùng chung một địa chỉ IP"**:
> - Trong **95% trường hợp thực tế**, một Pod chỉ bọc **đúng 1 container chính** (ví dụ API FastAPI hoặc Node.js của bạn).
> - Trong **5% trường hợp nâng cao**, ứng dụng chính cần một tiến trình trợ lý sát sườn gọi là **Sidecar Container** (như đại lý gom log Fluent Bit, proxy mã hóa Envoy, hay Cloud SQL Auth Proxy). Vì nằm chung trong 1 vỏ Pod, hai container này gọi nhau siêu tốc qua `localhost` và đọc chung một thư mục tạm mà không cần đi vòng ra mạng ngoài!

```visual
kind: layers
title: Không Gian Chia Sẻ Bên Trong Cùng Một Pod vs Hai Pod Khác Nhau
subtitle: Mọi container trong cùng một Pod dùng chung Network Namespace (chung IP & localhost) và không được mở trùng cổng!
columns:
  - title: Bên Trong Cùng 1 Pod (Main + Sidecar)
    badge: Chung IP · Gọi qua localhost
    tone: emerald
    layers:
      - label: Container Chính (api :3000/:8000) + Sidecar (log-shipper)
        sub: Sidecar gọi thẳng localhost:3000 — hai container chung Pod KHÔNG ĐƯỢC mở trùng cùng một số cổng!
        note: Phối hợp sát sườn
        tone: emerald
      - label: Chung một Network Namespace (1 Địa chỉ IP + Loopback 127.0.0.1)
        sub: Toàn bộ container trong vỏ Pod chia sẻ cùng một địa chỉ IP nội bộ và một bảng cổng mạng duy nhất
        note: Không cần qua mạng ngoài
        tone: sky
      - label: Chung ổ đĩa tạm (Shared Volume emptyDir)
        sub: Container chính ghi tệp tạm ra đĩa, Sidecar đọc và xử lý ngay ở tốc độ ổ cứng cục bộ
        note: Chia sẻ tệp tức thì
        tone: cyan
    footer: Đơn vị nguyên tử nhỏ nhất được kube-scheduler xếp chỗ lên cùng một Worker Node
  - title: Hai Pod Khác Nhau Trên Cụm
    badge: Khác IP hoàn toàn · Cô lập mạng
    tone: cyan
    layers:
      - label: Pod A (shop-web — IP 10.244.1.12:80)
        sub: Sở hữu Network Namespace riêng, có thể mở cổng 80 hoặc 3000 hoàn toàn độc lập với Pod khác
        note: Vỏ Pod độc lập #1
        tone: cyan
      - label: Pod B (payment-api — IP 10.244.2.35:8000)
        sub: Có địa chỉ IP riêng biệt hoàn toàn — không bao giờ gọi sang Pod A qua localhost được
        note: Vỏ Pod độc lập #2
        tone: amber
      - label: Mạng ảo toàn cụm (Cluster CNI + Service DNS)
        sub: Hai Pod khác nhau giao tiếp thông qua mạng cụm (thực tế luôn gọi qua tên miền Service ổn định)
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

## 2. Labels & Selectors: Sợi dây liên kết lỏng (`Loose Coupling`) của cả cụm

Trên một cụm Kubernetes chạy 500 Pod đủ loại (Frontend React, Order API Node.js, Recommendation AI Python, Redis...), Kubernetes **không dùng danh sách tên cứng** để gom nhóm chúng, vì tên Pod sinh tự động thay đổi liên tục mỗi lần cập nhật (`shop-api-7d9f8b-xk2lp`). Thay vào đó, K8s dùng ==`metadata.labels`== — những chiếc thẻ dán mang cặp khóa-giá trị (`key: value`) để truy vấn động:

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
      - "Ví dụ giá trị: `shop-api`, `ai-recommender`, `redis`"
      - "**`Service`** dùng nhãn này để tìm các Pod nhận chia tải HTTP"
      - "**`Deployment`** dùng nhãn này để điểm danh đủ quân số bản sao"
  - num: 2
    icon: shield
    title: tier
    badge: Phân tầng kiến trúc
    tone: cyan
    bullets:
      - "Ví dụ giá trị: `frontend`, `backend`, `cache`"
      - "**`NetworkPolicy`** dựa vào đây để khóa tường lửa nội bộ (chỉ cho tầng `backend` gọi vào `cache`)"
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

> [!WARNING] Nhãn (`labels`) KHÔNG PHẢI là vật trang trí cho đẹp!
> Chỉ một ký tự viết sai chính tả trong `metadata.labels` (ví dụ gõ nhầm `app: shop-backned` thay vì `app: shop-backend`) sẽ khiến **`Service` mất trắng kết nối tới Pod ngay lập tức**!

## 3. Namespaces: Chia tòa nhà Cụm thành các tầng lầu độc lập

Nếu hai đội dự án (`team-a` và `team-b`) hoặc hai môi trường (`staging` và `production`) dùng chung một cụm vật lý, làm sao cả hai cùng tạo được `Service` trùng tên `api-svc` mà không đè lên nhau? Câu trả lời là **Namespaces** — các tầng lầu lô-gic riêng biệt bên trong cùng một tòa nhà cụm:

```visual
kind: groups
title: Phân Vùng Cụm Bằng Namespaces — Tránh Đụng Độ Tên & Khóa Hạn Ngạch
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
    badge: Phòng máy hệ thống
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

Khi gộp nhiều tài nguyên liên quan vào **cùng một tệp YAML**, ta dùng dòng ==ba dấu gạch ngang `---`== để phân tách giữa các đối tượng:

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
      image: python:3.12-slim
      command: ["python", "-c", "import time; time.sleep(3600)"]
```

Trên dòng lệnh để thử nghiệm nhanh, bạn có thể tạo Namespace và chạy Pod kèm cờ `-n`:

```bash
kubectl create ns payments
kubectl run fraud-check --image=node:22-alpine -n payments
```

> [!TIP] Mẹo tiết kiệm hàng trăm lần gõ `-n payments` với `kubens`
> Trong công việc hàng ngày, bạn có thể chuyển thẳng Namespace mặc định của phiên làm việc sang `payments` bằng công cụ `kubens payments` (hoặc `kubectl config set-context --current --namespace=payments`), kết hợp mở giao diện `k9s` để quan sát Pod trực quan theo từng Namespace!

## 4. Kéo Image từ Kho riêng tư (`Private Registry`) với `imagePullSecrets`

Các Image công cộng như `python:3.12-slim` hay `node:22-alpine` ai kéo cũng được, nhưng Image sản phẩm của công ty luôn nằm trong kho riêng tư (**GitHub Container Registry `ghcr.io`**, **AWS ECR**, **Google Artifact Registry**, **Harbor**). Nếu thiếu thẻ thông hành xác thực, Pod sẽ kẹt cứng ở lỗi ==`ErrImagePull` / `ImagePullBackOff`== (`401 Unauthorized`).

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
> - Các container trong **cùng một Pod** chia sẻ chung IP + `localhost` + bảng cổng (không được mở trùng số cổng!) và có thể dùng chung ổ đĩa tạm `emptyDir`.
> - **`metadata.labels`** là thẻ từ liên kết lỏng để `Service`, `Deployment`, `NetworkPolicy` tìm đúng Pod; dấu **`---`** ngăn cách nhiều tài nguyên trong cùng 1 tệp YAML.
> - Quên cấp quyền kéo Image riêng tư gây lỗi **`ErrImagePull` / `ImagePullBackOff`** — khắc phục bằng ==`spec.imagePullSecrets`== trỏ tới Secret `kubernetes.io/dockerconfigjson`.

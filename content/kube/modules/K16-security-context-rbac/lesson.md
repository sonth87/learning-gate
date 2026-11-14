# Bảo mật Pod & Phân quyền truy cập: SecurityContext, Pod Security Admission & RBAC

Nếu một tin tặc khai thác thành công lỗ hổng thực thi mã từ xa (*RCE* — ví dụ qua một gói npm độc hại hoặc lỗ hổng giải mã dữ liệu đầu vào) bên trong container Node.js của bạn, điều gì sẽ xảy ra tiếp theo?

```visual
kind: layers
title: Hai Số Phận Trái Ngược Khi Container Node.js Dính Lỗ Hổng RCE
subtitle: "Sự khác biệt giữa mất trắng toàn bộ cụm máy chủ trong 30 giây và nhốt chặt kẻ tấn công trong chiếc hộp rỗng"
columns:
  - title: Cụm Mặc Định Cẩu Thả (Default Cluster)
    badge: Thất thủ toàn cụm trong 30 giây!
    tone: rose
    layers:
      - label: "Tiến trình chạy quyền tối cao uid=0 (root)"
        sub: Tự do cài thêm công cụ dò quét và can thiệp tiến trình
        note: Nguy hiểm tột độ
        tone: rose
      - label: Hệ thống tệp gốc (/) cho phép ghi thoải mái
        sub: Tải và cài cắm mã độc / backdoor trực tiếp xuống ổ đĩa
        note: Writable RootFS
        tone: amber
      - label: Giữ nguyên hơn 30 quyền nhân Linux (Capabilities)
        sub: Có sẵn NET_RAW giả mạo gói tin ARP/ICMP nội bộ
        note: Dễ leo thang
        tone: rose
      - label: Gắn sẵn thẻ ServiceAccount Token quyền cluster-admin
        sub: Đọc /var/run/secrets/kubernetes.io/serviceaccount/token xoá sạch cụm!
        note: Container Breakout
        tone: rose
    footer: Một lỗ hổng nhỏ ở Web API kéo sập toàn bộ hạ tầng công ty
  - title: Cụm Gia Cố Chuẩn Mực (Hardened 2026)
    badge: 3 Lớp Phòng Thủ Chiều Sâu (Defense in Depth)
    tone: emerald
    layers:
      - label: "Lớp 1 · securityContext: Non-Root (uid=1000) & Read-Only /"
        sub: "allowPrivilegeEscalation: false + capabilities.drop: [\"ALL\"]"
        note: Khoá chặt nhân Linux
        tone: emerald
      - label: "Lớp 2 · Pod Security Admission (PSA): restricted"
        sub: Cưỡng chế tự động bằng nhãn ngay trên Namespace từ API Server
        note: Chặn Pod ẩu từ cửa
        tone: sky
      - label: "Lớp 3 · RBAC Least Privilege & Tắt Auto-Mount Token"
        sub: "automountServiceAccountToken: false hoặc Role quyền tối thiểu"
        note: Vô hiệu hoá API Server
        tone: violet
    footer: Tin tặc bị nhốt cứng ở uid=1000, không ghi được đĩa, không gọi được K8s API!
```

Bài học này giúp bạn dựng lên trọn vẹn **3 lớp phòng thủ chiều sâu (*Defense in Depth*)** chuẩn Kubernetes hiện đại năm 2026 (K8s v1.30+).

```visual
kind: illustration
diagram: "kube:k16"
alt: "Ba lớp phòng thủ chiều sâu gồm securityContext (Non-Root, Read-Only RootFS, drop ALL), Pod Security Admission và phân quyền tối thiểu RBAC"
title: "Giải Phẫu Phòng Thủ Chiều Sâu: Hardened SecurityContext, PSA Restricted & RBAC"
subtitle: "Nhốt chặt mọi nguy cơ tấn công RCE trong chiếc hộp phi đặc quyền, khoá ghi ổ đĩa gốc và thu hồi quyền gọi K8s API"
caption: "Kiến trúc gia cố securityContext cấp nhân Linux, cổng kiểm duyệt Pod Security Admission trên Namespace và chuỗi phân quyền RBAC tối thiểu"
callouts:
  - num: 1
    label: "securityContext — Non-Root, Read-Only / & Drop ALL"
    desc: "Ép chạy uid=1000, khoá chỉ đọc cây thư mục gốc (chỉ gắn emptyDir ở /tmp) và thu hồi sạch mọi Linux Capabilities thừa."
    tone: emerald
  - num: 2
    label: "Pod Security Admission (PSA) & Seccomp"
    desc: "Gắn nhãn chuẩn restricted ngay trên Namespace để API Server tự động chặn đứng mọi Pod cấu hình cẩu thả ngay từ cửa."
    tone: violet
  - num: 3
    label: "RBAC Least Privilege — ServiceAccount -> RoleBinding -> Role"
    desc: "Tắt tự động gắn token nếu không cần gọi API cụm, hoặc chỉ cấp đúng quyền đọc tối thiểu trên từng Namespace thay vì cluster-admin."
    tone: amber
```

## 1. Lớp giáp thứ nhất: Gia cố `securityContext` ở cấp Pod & Container

Ở bài `K05`, bạn đã quen với dòng `USER node` trong Dockerfile. Tuy nhiên, Kubernetes không mù quáng tin tưởng Dockerfile (vì ai đó có thể vô tình đẩy một bản image quên `USER node` lên cụm). Ta khoá chặt ngay trên YAML qua trường **`securityContext`** ở hai tầng:

- [x] **Ở cấp Pod (`spec.securityContext`):** Áp dụng chung cho mọi container và quyền sở hữu ổ đĩa gắn vào Pod (`runAsNonRoot: true`, `runAsUser: 1000`, `fsGroup: 2000`, `seccompProfile.type: RuntimeDefault`).
- [x] **Ở cấp từng Container (`spec.containers[].securityContext`):** Khoá chặt đặc quyền nhân Linux:
  - **`allowPrivilegeEscalation: false`:** Cấm tuyệt đối tiến trình con leo thang đặc quyền qua cờ `setuid` (`sudo`, `su`).
  - ==`capabilities.drop: ["ALL"]`==: Từ khoá viết hoa `ALL` thu hồi toàn bộ hơn 30 quyền đặc thù của nhân Linux (`NET_RAW`, `SYS_ADMIN`...) mà Web API Node.js không bao giờ cần tới.
  - ==`readOnlyRootFilesystem: true`==: Khoá toàn bộ hệ thống tệp gốc `/` của container thành **Chỉ đọc**!

> [!TIP] Mẫu thiết kế chuẩn cho Node.js khi bật `readOnlyRootFilesystem: true`
> Một số thư viện Node.js (như xử lý tệp tải lên với `multer`, xuất PDF, hoặc trình chạy `npm`) vẫn cần ghi tệp nháp vào thư mục `/tmp`. Giải pháp chuẩn mực là khoá cứng gốc `/` bằng `readOnlyRootFilesystem: true` rồi **gắn riêng một ổ đĩa tạm `emptyDir: {}` vào đúng đường dẫn `/tmp`**:

```yaml
spec:
  automountServiceAccountToken: false
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: api
      image: ghcr.io/acme/shop-api:2.0.0
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
      volumeMounts:
        - name: tmp-dir
          mountPath: /tmp
  volumes:
    - name: tmp-dir
      emptyDir: {}
```

> [!WARNING] Ba tử huyệt bảo mật tuyệt đối tránh xa!
> Trừ khi bạn đang viết phần mềm hạ tầng cấp thấp của hệ thống, **tuyệt đối cấm dùng**: `privileged: true`, `hostNetwork: true`, và gắn ổ đĩa `hostPath: /var/run/docker.sock` — vì bất kỳ container nào nắm giữ chúng đều tương đương quyền `root` trực tiếp trên máy chủ vật lý!

## 2. Lớp giáp thứ hai: Cưỡng chế tự động bằng **Pod Security Admission (`PSA`)**

Làm sao đảm bảo cả 50 lập trình viên trong công ty không ai quên viết `securityContext`?

Trước năm 2022, Kubernetes từng dùng tài nguyên cũ `PodSecurityPolicy` (`policy/v1beta1`), nhưng cơ chế đó quá rườm rà nên **đã bị gỡ bỏ vĩnh viễn kể từ Kubernetes v1.25+**. Ngày nay (K8s v1.30+ / 2026), cơ chế tích hợp chính thức thay thế là ==Pod Security Admission (`PSA`)== — áp dụng trực tiếp bằng các **nhãn (`labels`) ngay trên `Namespace`** theo 3 mức **Pod Security Standards (`PSS`)**:

```visual
kind: groups
title: Ba Mức Chuẩn Pod Security Standards (PSS) Của PSA [!badge:emerald:K8s v1.25+ Chuẩn Mới]
subtitle: Gắn nhãn trực tiếp trên Namespace để API Server tự động kiểm duyệt mọi Pod được tạo ra
columns: 3
items:
  - num: 1
    icon: shield-alert
    title: privileged
    badge: Mở hoàn toàn
    tone: rose
    desc: Không giới hạn đặc quyền, cho phép can thiệp sâu vào nhân máy chủ.
    bullets:
      - "Cho phép mọi quyền hệ thống ở cấp Node"
      - "Chỉ được dùng cho `kube-system`, CNI plugin mạng, hoặc agent thu gom log cấp phần cứng"
    footer: Tuyệt đối cấm dùng cho ứng dụng kinh doanh
  - num: 2
    icon: shield
    title: baseline
    badge: Chặn nguy cơ thô bạo
    tone: amber
    desc: Ngăn chặn các cấu hình leo thang nguy hiểm rõ rệt nhất.
    bullets:
      - "Cấm thẳng `privileged: true`, `hostNetwork`, `hostPID` và gắn ổ đĩa `hostPath`"
      - "Hợp cho môi trường thử nghiệm nội bộ hoặc phần mềm bên thứ ba cũ chưa kịp bỏ quyền `root`"
    footer: Mức đệm chuyển tiếp an toàn cơ bản
  - num: 3
    icon: shield-check
    title: restricted
    badge: Tiêu chuẩn vàng 2026
    tone: emerald
    desc: Thực thi khắt khe nhất mọi quy tắc gia cố chống leo thang đặc quyền.
    bullets:
      - "Bắt buộc **`runAsNonRoot: true`**, **`allowPrivilegeEscalation: false`**, **`capabilities.drop: [\"ALL\"]`** và **`seccompProfile`**!"
      - "API Server từ chối thẳng mọi Pod thiếu cấu hình bảo mật"
    footer: Khuyến nghị bắt buộc cho production, payments, orders
```

Chỉ cần gắn nhãn lên `Namespace`, API Server sẽ lập tức chặn đứng mọi Pod vi phạm (`enforce`) và hiện cảnh báo sớm (`warn`):

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: payments
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/warn: restricted
```

## 3. Lớp giáp thứ ba: Phân quyền tối thiểu với **RBAC** (`ServiceAccount` + `Role` + `RoleBinding`)

Khác với tài khoản con người (*User*), mỗi Pod chạy bên trong cụm được định danh bằng một **`ServiceAccount`**. Mặc định, Kubernetes tự động gắn tệp thẻ xác thực vào `/var/run/secrets/kubernetes.io/serviceaccount/token` của mọi Pod.

- [!] **Quy tắc số 1 cho Web API thông thường:** Nếu Pod hoàn toàn không cần giao tiếp với Kubernetes API Server, hãy đặt ngay ==`automountServiceAccountToken: false`== trên `ServiceAccount` hoặc `Pod spec` để triệt tiêu hoàn toàn nguy cơ lộ thẻ xác thực nội bộ!
- [>] **Quy tắc số 2 khi cần gọi K8s API:** Áp dụng mô hình **RBAC (`rbac.authorization.k8s.io/v1`)** theo nguyên lý **Đặc quyền tối thiểu (*Least Privilege*)** — **tuyệt đối cấm cấp ký tự đại diện tất cả `"*"` (Wildcard) hay quyền `cluster-admin`** cho `ServiceAccount` của ứng dụng!

```visual
kind: flow
title: Mô Hình 3 Mảnh Ghép Phân Quyền Tối Thiểu RBAC (Least Privilege)
subtitle: "Phân biệt rõ phạm vi 1 Namespace (Role + RoleBinding) và phạm vi toàn cụm (ClusterRole + ClusterRoleBinding)"
footer: "Tuyệt đối liệt kê tường minh verbs và resources — KHÔNG BAO GIỜ dùng verbs: [\"*\"] hoặc cluster-admin cho Pod ứng dụng!"
steps:
  - icon: key
    badge: 1. Ai gọi? (Subject)
    title: ServiceAccount (v1)
    desc: Danh tính định danh riêng gắn cho Pod qua trường serviceAccountName
    code: "sa: job-runner"
    tone: sky
    edge: gắn vào subjects
  - icon: workflow
    badge: 2. Cầu nối quyền
    title: RoleBinding / ClusterRoleBinding
    desc: Nối danh tính ServiceAccount (subjects) với bộ quyền hạn tương ứng (roleRef)
    code: "kind: RoleBinding"
    tone: violet
    edge: tham chiếu roleRef
  - icon: lock
    badge: 3. Được làm gì?
    title: Role vs ClusterRole
    desc: Role chỉ hiệu lực trong 1 Namespace · ClusterRole hiệu lực toàn cụm (Nodes, PVs)
    code: 'verbs: ["get", "list"]'
    tone: emerald
    edge: kiểm duyệt tại cửa
  - icon: server
    badge: Đích đến an toàn
    title: Kubernetes API Server
    desc: Chỉ cho phép đúng thao tác đọc pods trong Namespace được cấp phép
    code: 'resources: ["pods"]'
    tone: cyan
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`PodSecurityPolicy` đã bị khai tử từ K8s v1.25**, thay thế chính thức bằng **Pod Security Admission (`PSA`)** gắn nhãn mức **`restricted`** trên `Namespace`.
> - Gia cố container chuẩn mực: `runAsNonRoot: true`, `allowPrivilegeEscalation: false`, **`capabilities.drop: ["ALL"]`**, và `readOnlyRootFilesystem: true` (kèm volume `emptyDir: {}` gắn vào `/tmp`).
> - Tắt thẻ dư thừa bằng **`automountServiceAccountToken: false`** · Phân biệt **`Role`** (trong 1 Namespace) vs **`ClusterRole`** (toàn cụm, gồm cả `Nodes`/`PV`) · Cấm tuyệt đối wildcard `"*"`!

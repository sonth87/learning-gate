# Bảo mật Pod & Phân quyền truy cập: SecurityContext, Pod Security Admission & RBAC

Nếu một tin tặc khai thác thành công lỗ hổng thực thi mã từ xa (RCE — ví dụ qua một gói npm độc hại hoặc lỗ hổng giải mã dữ liệu đầu vào) bên trong container Node.js của bạn, điều gì sẽ xảy ra tiếp theo?

- **Trên một cụm cẩu thả mặc định:** Tin tặc thấy mình đang có quyền tối cao `uid=0 (root)`, hệ thống tệp cho phép tải thêm mã độc thoải mái, lại còn đọc được một chiếc thẻ `ServiceAccount Token` gắn sẵn trong `/var/run/secrets/kubernetes.io/serviceaccount/token` có quyền `cluster-admin`! Chỉ mất 30 giây, kẻ tấn công leo thang thoát khỏi container (Container Breakout) và chiếm quyền kiểm soát toàn bộ cụm máy chủ!
- **Trên một cụm được gia cố chuẩn mực (Hardened Cluster):** Tin tặc bị nhốt cứng ở người dùng thường `uid=1000`, ổ đĩa gốc bị khoá chỉ đọc (`Read-only`), nhân Linux tước sạch mọi quyền `capabilities`, và tài khoản của Pod không hề có quyền gọi vào API Server!

Bài học này giúp bạn dựng lên **3 lớp phòng thủ chiều sâu (Defense in Depth)** chuẩn Kubernetes hiện đại năm 2026: **`securityContext`**, **Pod Security Admission (`PSA`)** và phân quyền **RBAC tối thiểu (`Least Privilege`)**.

---

## 1. Lớp giáp thứ nhất: Gia cố `securityContext` ở cấp Pod & Container

Ở bài `K05`, bạn đã quen với việc thêm dòng `USER node` vào Dockerfile. Tuy nhiên, Kubernetes không mù quáng tin tưởng vào Dockerfile (vì ai đó có thể vô tình đẩy một bản image quên `USER node` lên cụm). Ta khoá chặt ngay trên tệp YAML qua trường **`securityContext`** ở hai tầng:

1. **Ở cấp Pod (`spec.securityContext`):** Áp dụng chung cho mọi container và quyền sở hữu ổ đĩa gắn vào Pod (`runAsNonRoot: true`, `runAsUser: 1000`, `fsGroup: 2000`, `seccompProfile.type: RuntimeDefault`).
2. **Ở cấp từng Container (`spec.containers[].securityContext`):** Khoá chặt quyền hạn tiến trình nhân Linux:
   - **`allowPrivilegeEscalation: false`:** Cấm tuyệt đối tiến trình con leo thang đặc quyền qua cờ `setuid` (như lệnh `sudo` hay `su`).
   - **`capabilities.drop: ["ALL"]`:** Gỡ bỏ toàn bộ hơn 30 quyền đặc thù của nhân Linux (`NET_RAW`, `SYS_ADMIN`...) mà một ứng dụng Web Node.js không bao giờ cần tới.
   - **`readOnlyRootFilesystem: true`:** Khoá toàn bộ hệ thống tệp gốc `/` của container thành **Chỉ đọc**! Kẻ tấn công dù chiếm được shell cũng không thể tải hoặc ghi cài cắm backdoor xuống ổ đĩa.

### Mẹo thực tế cho Node.js khi bật `readOnlyRootFilesystem: true`:
Một số thư viện Node.js (như xử lý file tạm với `multer`, xuất PDF, hoặc trình chạy `npm`) vẫn cần ghi tệp nháp vào thư mục `/tmp`. Giải pháp chuẩn mực là khoá gốc `/` bằng `readOnlyRootFilesystem: true` rồi gắn riêng một ổ đĩa RAM tạm thời **`emptyDir: {}`** vào đúng đường dẫn `/tmp`:

```yaml
spec:
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

*(Tuyệt đối tránh xa 3 tử huyệt bảo mật trừ khi viết phần mềm hạ tầng đặc biệt: `privileged: true`, `hostNetwork: true`, và gắn ổ đĩa `hostPath: /var/run/docker.sock` — vì bất kỳ ai có quyền đó đều tương đương `root` trên máy chủ vật lý!)*

---

## 2. Lớp giáp thứ hai: Cưỡng chế tự động bằng **Pod Security Admission (`PSA`)**

Làm sao đảm bảo cả 50 lập trình viên trong công ty không ai quên viết `securityContext`?

Trước năm 2022, Kubernetes từng dùng tài nguyên cũ `PodSecurityPolicy` (`policy/v1beta1`), nhưng cơ chế đó quá rườm rà nên **đã bị gỡ bỏ vĩnh viễn từ Kubernetes v1.25+**. Ngày nay (K8s v1.30+), trình kiểm soát chuẩn tích hợp sẵn là **Pod Security Admission (PSA)** áp dụng trực tiếp bằng các nhãn (Labels) ngay trên **`Namespace`** dựa theo 3 mức **Pod Security Standards (PSS)**:

| Mức chuẩn PSS | Ý nghĩa kiểm soát | Dùng cho Namespace nào? |
| --- | --- | --- |
| **`privileged`** | Không giới hạn gì cả (cho phép mọi quyền hệ thống). | Chỉ dùng cho `kube-system`, CNI mạng, trình thu gom log cấp Node. |
| **`baseline`** | Chặn các nguy cơ leo thang thô bạo (`privileged: true`, `hostNetwork`, `hostPath`). | Môi trường thử nghiệm nội bộ, ứng dụng bên thứ ba cũ chưa sửa được root. |
| **`restricted`** | **Tiêu chuẩn vàng năm 2026:** Bắt buộc `runAsNonRoot: true`, `allowPrivilegeEscalation: false`, `capabilities.drop: ["ALL"]` và `seccompProfile`! | Toàn bộ các Namespace chạy dịch vụ kinh doanh (`production`, `payments`, `orders`). |

Chỉ cần gắn nhãn lên `Namespace`, API Server sẽ lập tức từ chối mọi Pod vi phạm (`enforce`) hoặc in cảnh báo (`warn`):

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: payments
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/warn: restricted
```

---

## 3. Lớp giáp thứ ba: Phân quyền tối thiểu với **RBAC** (`ServiceAccount` + `Role` + `RoleBinding`)

Khác với tài khoản con người (User), mỗi Pod chạy bên trong cụm được định danh thông qua một **`ServiceAccount`**. Nếu Pod của bạn chỉ là một Web API thuần tuý không hề cần gọi vào Kubernetes API Server, hãy tắt việc tự động gắn thẻ token bằng **`automountServiceAccountToken: false`**.

Trong trường hợp Pod thực sự cần đọc thông tin từ cụm (ví dụ một trình chạy tác vụ chỉ cần xem danh sách Pod hoặc đọc một `ConfigMap`), ta áp dụng mô hình **RBAC (`rbac.authorization.k8s.io/v1`)** theo nguyên lý **Đặc quyền tối thiểu (Least Privilege)** gồm 3 mảnh ghép:

1. **`ServiceAccount` (`v1`):** Danh tính định danh gắn cho Pod (`serviceAccountName: job-runner`).
2. **`Role` (trong 1 Namespace) hoặc `ClusterRole` (toàn cụm):** Tờ giấy liệt kê rõ được phép làm hành động gì (`verbs: ["get", "list", "watch"]`) trên tài nguyên nào (`resources: ["pods"]`). **Tuyệt đối không dùng ký tự đại diện tất cả `"*"` (Wildcard)!**
3. **`RoleBinding` / `ClusterRoleBinding`:** Sợi dây nối danh tính `ServiceAccount` (`subjects`) với quyền hạn `Role` (`roleRef`).

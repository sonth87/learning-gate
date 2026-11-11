# Pod, Labels, Namespaces & Kéo Image từ Kho riêng tư

Khi mới chuyển từ Docker sang Kubernetes, câu hỏi đầu tiên mà hầu hết lập trình viên Node.js thắc mắc là: *"Tại sao Kubernetes không quản lý trực tiếp từng Container cho gọn, mà lại đẻ thêm khái niệm **Pod** bọc ở bên ngoài?"*

Hiểu thấu đáo thiết kế của **Pod**, hệ thống gắn thẻ **Labels**, vách ngăn **Namespaces** và chứng chỉ kéo Image **`imagePullSecrets`** sẽ giúp bạn nắm chắc viên gạch nguyên tử của toàn bộ hệ sinh thái Kubernetes.

---

## 1. Tại sao đơn vị nhỏ nhất là Pod chứ không phải Container?

Hãy hình dung **Pod** giống như một "vỏ kén" (hoặc một chiếc máy tính lô-gic siêu nhỏ). Trong **95% trường hợp thực tế**, một Pod chỉ bọc **đúng 1 container chính** (ví dụ API Node.js của bạn). Tuy nhiên, trong 5% trường hợp nâng cao, ứng dụng chính cần một tiến trình trợ lý sát sườn gọi là **Sidecar Container** (như đại lý thu gom log Fluent Bit, proxy mã hoá Envoy/Istio, hoặc trình đồng bộ chứng chỉ Vault):

- Mọi container nằm chung trong **cùng một Pod** được chia sẻ **chung một Network Namespace**: chúng có **cùng một địa chỉ IP duy nhất** và gọi sang nhau trực tiếp qua **`localhost`**!
- Chúng cũng có thể gắn chung một ổ đĩa tạm `emptyDir` để container chính ghi tệp và container Sidecar đọc ngay lập tức.
- Ngược lại, **hai Pod khác nhau** luôn có hai địa chỉ IP khác nhau hoàn toàn.

```yaml
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

---

## 2. Labels & Selectors: Sợi dây liên kết lỏng (Loose Coupling) của cả cụm

Trên một cụm Kubernetes chạy 500 Pod đủ loại (Frontend, Order API, Payment Worker, Redis...), Kubernetes **không dùng danh sách tên cứng** để gom nhóm chúng, vì tên Pod sinh tự động thay đổi liên tục mỗi lần cập nhật (`shop-api-7d9f8b-xk2lp`).

Thay vào đó, Kubernetes dùng **Labels** — các cặp khoá-giá trị (`key: value`) gắn dưới `metadata.labels`, hoạt động giống hệt cách bạn gắn thẻ phân loại Issue trên GitHub hoặc từ khoá `keywords` trong `package.json`:

| Nhãn phổ biến | Ví dụ giá trị | Ai sử dụng nhãn này? |
| --- | --- | --- |
| `app` (hoặc `app.kubernetes.io/name`) | `shop-api`, `postgres` | `Service` tìm các Pod để chia tải HTTP; `Deployment` điểm danh đủ quân số |
| `tier` | `frontend`, `backend`, `cache` | `NetworkPolicy` khoá tường lửa (chỉ cho `backend` gọi vào `cache`) |
| `env` | `dev`, `staging`, `production` | Lọc nhanh trên CLI: `kubectl get pods -l env=staging,tier=backend` |

> **Cảnh báo cực kỳ quan trọng:** Nhãn (`labels`) không phải là vật trang trí cho đẹp! Một ký tự viết sai chính tả trong `labels` (ví dụ `app: shop-backned`) sẽ làm `Service` mất trắng kết nối tới Pod ngay lập tức!

---

## 3. Namespaces: Chia cụm vật lý thành nhiều không gian tên độc lập

Nếu cả công ty dùng chung một cụm Kubernetes cho cả hai môi trường `staging` và `production`, làm sao để cả hai cùng tạo được dịch vụ tên là `shop-api` mà không đè lên nhau? Câu trả lời là **Namespaces** — các vách ngăn lô-gic bên trong cùng một cụm:

- **`default`:** Không gian mặc định nếu bạn không truyền cờ `-n` hay `metadata.namespace`.
- **`kube-system`:** Nơi ở của các thành phần hệ thống sống còn như `coredns`, `kube-proxy`, CNI mạng — tuyệt đối không triển khai ứng dụng kinh doanh vào đây!
- **Các Namespace tự tạo (`staging`, `payments`, `production`):** Giúp phân tách tên tài nguyên, giới hạn hạn ngạch tổng CPU/RAM (`ResourceQuota`) và phân quyền RBAC theo từng đội dự án.

Khi làm việc với nhiều tài nguyên liên quan trong **cùng một tệp YAML**, bạn có thể ngăn cách chúng bằng dòng ba dấu gạch ngang **`---`** (khai báo `Namespace` ở trên, rồi khai báo `Pod` đặt `metadata.namespace` ở dưới):

```yaml
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

Trên dòng lệnh Imperative để thử nghiệm nhanh, bạn cũng có thể tạo Namespace và chạy Pod trực tiếp:
```bash
kubectl create ns payments
kubectl run fraud-check --image=node:22-alpine -n payments
```

---

## 4. Kéo Image từ Kho riêng tư (Private Registry) với `imagePullSecrets`

Các Image công cộng như `node:22-alpine` hay `nginx:1.27-alpine` ai kéo cũng được. Nhưng mã nguồn thương mại của công ty bạn luôn đóng gói đẩy lên kho riêng tư (**GitHub Container Registry `ghcr.io`**, **AWS ECR**, **Harbor** hoặc `private.registry.local`).

Nếu Kubelet trên Worker Node cố kéo Image riêng tư mà không có thẻ căn cước xác thực, Pod sẽ kẹt ngay ở trạng thái lỗi quen thuộc **`ErrImagePull` → `ImagePullBackOff`** (`401 Unauthorized`). Quy trình chuẩn gồm 2 bước:

1. Tạo một Secret kiểu chuyên dụng `kubernetes.io/dockerconfigjson` (ví dụ đặt tên là `regcred`).
2. Tham chiếu tên Secret đó vào mảng **`spec.imagePullSecrets`** của Pod (hoặc `spec.template.spec.imagePullSecrets` của Deployment):

```yaml
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

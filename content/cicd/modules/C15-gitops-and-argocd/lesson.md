# GitOps Thực chiến với ArgoCD (Pull-Based CD)

Trong suốt các bài trước, khi muốn đưa ứng dụng lên máy chủ hoặc cụm Kubernetes, chúng ta thường nghĩ theo lối mòn **Push-based CD (Mô hình Đẩy)**: runner của GitHub Actions hoặc GitLab CI cầm khoá quản trị cụm K8s (`KUBECONFIG` hoặc Cloud Admin Role), rồi chạy trực tiếp lệnh `kubectl set image` hoặc `helm upgrade` từ bên ngoài chọc thẳng vào cụm Production.

Mô hình Đẩy đó hoạt động ổn khi bạn có 1 dịch vụ nhỏ, nhưng khi doanh nghiệp mở rộng lên 30 microservices và yêu cầu chuẩn bảo mật tài chính (PCI-DSS, SOC2), Push-based CD bộc lộ hàng loạt tử huyệt. Đó là lúc kiến trúc **Pull-based GitOps** với **ArgoCD** trở thành tiêu chuẩn vàng của thế giới Cloud-Native.

---

## 1. Tại sao Push-based `kubectl apply` từ CI là một Phản mẫu Bảo mật?

Hãy so sánh trực diện hai mô hình như cách bạn quản lý cấu hình trong dự án Node.js:
- **Push-based CD** giống như việc cho phép máy laptop của mọi cộng tác viên SSH thẳng vào server Production để sửa code bằng tay mỗi khi họ chạy test xong.
- **Pull-based GitOps** giống như việc mọi thay đổi bắt buộc phải đi qua `package-lock.json` trên nhánh `main`, và một trình điều phối (Controller) nằm sẵn **bên trong** cụm Production tự động kéo trạng thái chuẩn đó về đối chiếu liên tục 24/7!

| Tiêu chí | Push-based CD (`kubectl` trong CI) | Pull-based GitOps (ArgoCD trong K8s) |
| :--- | :--- | :--- |
| **Vị trí giữ chìa khoá K8s Admin** | Lưu trong Secrets của GitHub/GitLab bên ngoài đám mây — nếu lộ CI là mất trắng toàn cụm K8s! | **Không bao giờ rời khỏi cụm K8s!** ArgoCD chạy ngay trong namespace `argocd` nội bộ. |
| **Mở cổng tường lửa API Server** | Phải mở cổng Kubernetes API Server ra Internet (hoặc duy trì VPN phức tạp cho CI Runner). | Cụm K8s khoá kín cổng vào (Inbound); ArgoCD chủ động gọi chiều ra (Outbound HTTPS) tới Git. |
| **Phát hiện lệch cấu hình (Drift)** | Mù hoàn toàn! Nếu ai đó gõ tay `kubectl edit` lúc nửa đêm, CI không hề hay biết. | Phát hiện ngay lập tức (`OutOfSync`) và tự động ghi đè lại theo đúng Git (`selfHeal: true`). |
| **Lịch sử kiểm toán & Rollback** | Rải rác trong log của hàng trăm lần chạy CI. | Toàn bộ trạng thái hạ tầng nằm gọn trong `git log`; Rollback đơn giản là `git revert`! |

---

## 2. Tách bạch 2 Kho chứa: App Repo vs GitOps Config Repo

Trong kiến trúc GitOps chuẩn mực, chúng ta tách riêng **Kho mã nguồn ứng dụng (`shop-api`)** và **Kho cấu hình triển khai (`shop-gitops`)** (chứa Kustomize overlays hoặc Helm values cho `dev`, `staging`, `prod`). Tại sao không nhét chung vào một repo?
1. **Tránh vòng lặp CI vô tận**: Nếu CI sửa file YAML ngay trong `shop-api` rồi `git push`, chính commit đó lại kích hoạt lại toàn bộ pipeline test/build của ứng dụng!
2. **Phân tách quyền hạn rõ ràng**: Lập trình viên có quyền merge code vào `shop-api`, nhưng chỉ CI Bot và nhóm SRE/Platform mới có quyền ghi vào nhánh `main` của `shop-gitops`.

Nhiệm vụ của GitHub Actions trên `shop-api` lúc này trở nên cực kỳ gọn nhẹ và an toàn:
1. Chạy Test, quét bảo mật, đóng gói Docker Image gắn thẻ bất biến `ghcr.io/acme/shop-api:sha-<commit>` và đẩy lên Registry.
2. Checkout kho `shop-gitops`, dùng `kustomize edit set image` (hoặc `yq`) cập nhật thẻ image mới trong `overlays/prod/kustomization.yaml`, sau đó `git commit` và `git push`. **Hoàn toàn không có bóng dáng `KUBECONFIG` hay `kubectl` nào trong CI!**

---

## 3. Giải phẫu đối tượng ArgoCD `Application` (`argoproj.io/v1alpha1`)

Bên trong cụm Kubernetes, bạn định nghĩa mối liên kết giữa kho GitOps và cụm đích thông qua Custom Resource `kind: Application` của ArgoCD:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: shop-api-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/acme/shop-gitops.git
    targetRevision: main
    path: overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true       # Xoá tài nguyên trên K8s nếu file YAML tương ứng đã bị xoá trên Git
      selfHeal: true    # Tự động khôi phục về chuẩn Git nếu ai đó sửa tay trực tiếp trên cụm!
    syncOptions:
      - CreateNamespace=true
```

Nếu đội của bạn sử dụng **Helm Chart** thay vì Kustomize, khối `spec.source` chỉ cần chỉ định thêm danh sách file cấu hình ghi đè theo môi trường thông qua `helm.valueFiles`:

```yaml
  source:
    repoURL: https://github.com/acme/shop-gitops.git
    targetRevision: main
    path: charts/shop-api
    helm:
      valueFiles:
        - values-prod.yaml
```

Hai cờ `prune: true` và `selfHeal: true` chính là "linh hồn" của GitOps:
- Thiếu `prune: true`, khi bạn xoá một `CronJob` cũ trên Git, nó vẫn âm thầm sống sót như "bóng ma" trên cụm K8s.
- Thiếu `selfHeal: true`, khi một kỹ sư trực đêm nóng vội gõ `kubectl scale deployment shop-api --replicas=10` để chữa cháy tạm thời mà quên cập nhật vào Git, cấu hình thực tế sẽ trôi dạt (Configuration Drift) khỏi nguồn sự thật duy nhất (Single Source of Truth).

---

## 4. Điều phối Thứ tự Triển khai bằng Sync Waves (`argocd.argoproj.io/sync-wave`)

Khi ArgoCD đồng bộ cả một thư mục gồm hàng chục file YAML cùng lúc, điều gì xảy ra nếu `Deployment` của ứng dụng mới khởi chạy **trước khi** `Job` nâng cấp cơ sở dữ liệu (`db-migrate`) kịp thêm cột mới vào bảng PostgreSQL? Các Pod ứng dụng sẽ đồng loạt báo lỗi truy vấn SQL!

ArgoCD giải quyết bài toán thứ tự phụ thuộc này bằng Annotation **`argocd.argoproj.io/sync-wave`** nhận giá trị chuỗi số nguyên (mặc định mọi tài nguyên có wave `"0"`). ArgoCD sẽ thực thi tuần tự từ **số âm nhỏ nhất tăng dần lên số dương**, và **đợi mọi tài nguyên ở Wave trước đạt trạng thái Healthy (hoặc Job chạy `Succeeded`) rồi mới chuyển sang Wave tiếp theo**:

- **Wave `"-2"`**: `Namespace`, `ServiceAccount`, `ConfigMap` nền tảng.
- **Wave `"-1"`**: Kubernetes `Job` chạy `db-migrate` (ví dụ `npx prisma migrate deploy` cho kịch bản Expand tương thích ngược).
- **Wave `"0"`**: `Deployment` `shop-api` và `Service`.
- **Wave `"1"`**: `Ingress` hoặc Job kiểm tra hậu kiểm sau khi dịch vụ đã sẵn sàng.

Chỉ với vài dòng annotation chuẩn xác trong Git, toàn bộ kịch bản phát hành phức tạp đa tầng được ArgoCD dàn dựng nhịp nhàng mà không cần viết một dòng bash script điều khiển tay nào trong CI!

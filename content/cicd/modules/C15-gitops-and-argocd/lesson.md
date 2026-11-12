# GitOps Thực chiến với ArgoCD (Pull-Based CD)

Trong các bài trước, khi muốn đưa ứng dụng lên cụm Kubernetes, chúng ta thường tiếp cận theo lối mòn **Push-based CD (Mô hình Đẩy)**: máy chủ GitHub Actions hoặc GitLab Runner cầm chìa khoá quản trị tối cao của cụm K8s (`KUBECONFIG` / Cloud Admin Role), rồi từ bên ngoài gõ thẳng lệnh `kubectl set image` hoặc `helm upgrade` chọc vào cụm Production.

Mô hình Đẩy ({rose:Push-based CD}) đó chạy ổn với 1 dịch vụ nhỏ, nhưng khi doanh nghiệp mở rộng lên 30 microservices kèm tiêu chuẩn kiểm toán tài chính (*PCI-DSS, SOC2*), nó bộc lộ hàng loạt tử huyệt bảo mật. Đó là lúc kiến trúc ==Pull-based GitOps== với {emerald:ArgoCD} và {sky:Single Source of Truth trên Git} trở thành tiêu chuẩn vàng của thế giới Cloud-Native.

---

## 1. Tại sao Push-based `kubectl apply` từ CI là một Phản mẫu Bảo mật?

> [!ANALOGY] Hãy hình dung sự khác biệt cốt lõi
> - **Push-based CD** giống như cấp tài khoản SSH `root` cho máy tính bên ngoài tự chui vào server Production sửa cấu hình mỗi khi chạy test xong.
> - **Pull-based GitOps** đặt một **Trình điều phối (ArgoCD Controller) nằm sẵn ngay BÊN TRONG cụm Kubernetes**: nó chủ động kéo trạng thái chuẩn từ kho Git (*Single Source of Truth*) về đối chiếu và tự động chữa lành liên tục 24/7!

```visual
kind: layers
title: "Đối Chiếu Kiến Trúc: Push-Based CD (Ngoài Cụm) vs Pull-Based GitOps (Trong Cụm)"
subtitle: Đảo ngược chiều kết nối để xoá bỏ hoàn toàn chìa khoá K8s Admin nằm phơi trên đường ống CI bên ngoài
columns:
  - title: "Push-Based CD (kubectl / helm trong CI)"
    badge: Phản mẫu khi mở rộng · Rủi ro cao
    tone: rose
    layers:
      - label: "Chìa khoá KUBECONFIG nằm phơi trên GitHub / GitLab"
        sub: "Nếu Runner CI bị xâm nhập là tin tặc chiếm trọn quyền Admin toàn cụm K8s!"
        note: Lộ ranh giới bảo mật
        tone: rose
      - label: "Phải mở cổng tường lửa Kubernetes API Server ra ngoài"
        sub: "Cho phép kết nối chiều vào (Inbound) từ dải IP công cộng của CI Runner"
        note: Bề mặt tấn công rộng
        tone: amber
      - label: "Mù hoàn toàn trước sai lệch cấu hình (Configuration Drift)"
        sub: "Ai đó gõ tay kubectl edit / scale lúc 2 giờ sáng, đường ống CI không hề hay biết"
        note: Lệch chuẩn âm thầm
        tone: slate
    footer: Lịch sử triển khai nằm rải rác trong hàng trăm trang log CI rời rạc
  - title: "Pull-Based GitOps (ArgoCD trong K8s)"
    badge: Chuẩn vàng Cloud-Native · Zero-Trust
    tone: emerald
    layers:
      - label: "Quyền quản trị K8s KHÔNG BAO GIỜ rời khỏi cụm nội bộ"
        sub: "ArgoCD chạy ngay trong namespace argocd bên trong cụm Production"
        note: Khoá kín đặc quyền
        tone: emerald
      - label: "Đóng kín tường lửa chiều vào · Chỉ gọi HTTPS chiều ra"
        sub: "ArgoCD chủ động kéo (Outbound Pull) tệp cấu hình từ kho Git về cụm"
        note: Cụm K8s tàng hình
        tone: sky
      - label: "Tự động phát hiện lệch chuẩn & Tự chữa lành (selfHeal: true)"
        sub: "Báo OutOfSync tức thì và ghi đè cụm về đúng trạng thái khai báo trong Git"
        note: Đồng bộ liên tục 24/7
        tone: cyan
    footer: Toàn bộ lịch sử hạ tầng nằm gọn trong git log · Rollback chuẩn là git revert!
```

---

## 2. Tách bạch 2 Kho chứa: App Repo vs GitOps Config Repo

Trong kiến trúc GitOps chuẩn mực, chúng ta tách riêng **Kho mã nguồn ứng dụng (`shop-api`)** và **Kho cấu hình triển khai (`shop-gitops`)** (chứa Kustomize overlays hoặc Helm values cho `dev`, `staging`, `prod`):

- [x] **Tránh vòng lặp CI vô tận:** Nếu CI sửa file YAML ngay trong `shop-api` rồi `git push`, chính commit đó lại kích hoạt ngược lại toàn bộ pipeline lint/test/build của ứng dụng!
- [x] **Tách biệt quyền hạn rõ ràng:** Lập trình viên merge code tính năng vào `shop-api`, nhưng chỉ CI Bot và nhóm SRE/Platform mới có quyền ghi vào nhánh `main` của `shop-gitops`.

```visual
kind: flow
title: Chu Trình GitOps Khép Kín Qua 2 Kho Chứa (App Repo → Config Repo → ArgoCD)
subtitle: Đường ống CI hoàn toàn không có bóng dáng KUBECONFIG hay câu lệnh kubectl nào!
steps:
  - icon: code
    badge: "Kho 1 · App Repo"
    title: shop-api (CI)
    desc: Chạy Test, quét DevSecOps & đóng gói ảnh gắn thẻ bất biến sha-<commit>
    code: "shop-api:sha-9a4e1b"
    tone: sky
    edge: docker push
  - icon: cloud
    badge: Kho chứa ảnh
    title: Container Registry
    desc: Lưu trữ bất biến bức ảnh container kèm chữ ký chứng thực nguồn gốc
    code: "ghcr.io/acme/shop-api"
    tone: violet
    edge: kustomize edit / yq
  - icon: folder-git
    badge: "Kho 2 · Config Repo"
    title: shop-gitops
    desc: CI commit cập nhật tag ảnh mới vào overlays/prod/kustomization.yaml
    code: "git commit && git push"
    tone: amber
    edge: ArgoCD Pull (HTTPS)
  - icon: refresh
    badge: Bên trong cụm K8s
    title: ArgoCD Controller
    desc: Phát hiện commit mới trên shop-gitops và đồng bộ Pod trong cụm về chuẩn Git
    code: "Synced & Healthy"
    tone: emerald
```

---

## 3. Giải phẫu đối tượng ArgoCD `Application` (`argoproj.io/v1alpha1`)

Bên trong cụm Kubernetes, bạn định nghĩa mối liên kết giữa kho `shop-gitops` và cụm đích thông qua Custom Resource `kind: Application`:

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
      prune: true       # Xoá tài nguyên trên K8s nếu file YAML tương ứng đã bị xoá khỏi Git
      selfHeal: true    # Tự động khôi phục về chuẩn Git nếu ai đó sửa tay trực tiếp trên cụm!
    syncOptions:
      - CreateNamespace=true
```

Nếu đội của bạn dùng **Helm Chart** thay vì Kustomize, khối `spec.source` chỉ định tệp ghi đè cấu hình theo môi trường qua trường ==`helm.valueFiles`==:

```yaml
  source:
    repoURL: https://github.com/acme/shop-gitops.git
    targetRevision: main
    path: charts/shop-api
    helm:
      valueFiles:
        - values-prod.yaml
```

```visual
kind: anatomy
title: Giải Phẫu Các Cờ Điều Khiển Linh Hồn Trong ArgoCD Application
subtitle: Nắm chắc sự khác biệt giữa prune, selfHeal, CreateNamespace và sóng đồng bộ sync-wave
items:
  - keyword: "automated.prune: true"
    role: Dọn dẹp tài nguyên mồ côi
    tone: amber
    summary: Tự động xoá bỏ tài nguyên trên cụm Kubernetes khi tệp YAML định nghĩa nó bị xoá khỏi kho Git.
    bullets:
      - "Nếu để `prune: false`, các `CronJob` hay `ConfigMap` cũ đã xoá trên Git vẫn sống dai dẳng như \"bóng ma\" trên cụm!"
    example: "prune: true"
    lang: yaml
  - keyword: "automated.selfHeal: true"
    role: Chống trôi dạt cấu hình
    tone: emerald
    summary: Giám sát các tài nguyên đang quản lý và tự động ghi đè về chuẩn Git nếu ai đó gõ tay `kubectl edit` / `scale` trên cụm.
    bullets:
      - "Nhờ `selfHeal: true`, thao tác Rollback chuẩn trong GitOps bắt buộc là ==`git revert`== trên kho GitOps (chứ không phải gõ tay `kubectl set image`!)"
    example: "selfHeal: true"
    lang: yaml
  - keyword: "CreateNamespace=true"
    role: Tự khởi tạo Namespace đích
    tone: sky
    summary: Tuỳ chọn nằm trong mảng `spec.syncPolicy.syncOptions` cho phép ArgoCD tự tạo `destination.namespace` ở lần đồng bộ đầu tiên.
    bullets:
      - "Tránh lỗi đồng bộ thất bại do Namespace `production` chưa được tạo sẵn bằng tay"
    example: "syncOptions:\n  - CreateNamespace=true"
    lang: yaml
  - keyword: "spec.source.helm.valueFiles"
    role: Ghi đè cấu hình Helm Chart
    tone: cyan
    summary: Tương đương cờ `-f values-prod.yaml` của Helm CLI khi `spec.source.path` trỏ vào thư mục chứa Helm Chart.
    bullets:
      - "Cho phép dùng chung 1 Chart gốc cho cả `values-staging.yaml` và `values-prod.yaml`"
    example: "helm:\n  valueFiles:\n    - values-prod.yaml"
    lang: yaml
  - keyword: "argocd.argoproj.io/sync-wave"
    role: Điều phối thứ tự sóng triển khai
    tone: violet
    summary: Annotation nhận chuỗi số nguyên (mặc định `\"0\"`), thực thi tuần tự từ **số âm nhỏ nhất tăng dần lên số dương**.
    bullets:
      - "ArgoCD **đợi tất cả tài nguyên ở Wave nhỏ hơn đạt `Healthy` / `Succeeded`** rồi mới áp dụng Wave lớn hơn!"
    example: "metadata:\n  annotations:\n    argocd.argoproj.io/sync-wave: \"-1\""
    lang: yaml
```

---

## 4. Điều phối Thứ tự Triển khai bằng Sync Waves (`argocd.argoproj.io/sync-wave`)

Khi ArgoCD đồng bộ cả một thư mục gồm hàng chục tệp YAML, điều gì xảy ra nếu `Deployment` của ứng dụng mới khởi chạy **trước khi** `Job` nâng cấp cơ sở dữ liệu (`db-migrate`) kịp thêm cột mới vào PostgreSQL? Các Pod ứng dụng sẽ đồng loạt sập vì truy vấn SQL lỗi!

Annotation ==`argocd.argoproj.io/sync-wave`== giải quyết gọn đẹp bài toán phụ thuộc đa tầng mà không cần viết bash script trong CI:
- [>] **Wave `"-2"`**: `Namespace`, `ServiceAccount`, `ConfigMap` nền tảng.
- [>] **Wave `"-1"`**: Kubernetes `Job` chạy `db-migrate` (ví dụ `npx prisma migrate deploy` cho pha Expand tương thích ngược) — ArgoCD chờ Job này báo **`Succeeded`** hoàn toàn!
- [>] **Wave `"0"` (mặc định)**: `Deployment` `shop-api` và `Service` bắt đầu lăn bánh an toàn.
- [>] **Wave `"1"`**: `Ingress` hoặc Job kiểm tra hậu kiểm sau khi dịch vụ đã `Healthy`.

```visual
kind: troubleshoot
title: Bẫy Vận Hành GitOps & ArgoCD Thường Gặp Ngoài Đời Thực
items:
  - symptom: "Gõ tay kubectl set image để Rollback khẩn cấp nhưng 5 giây sau Pod lại tự quay về bản lỗi!"
    badge: Bẫy selfHeal
    tone: rose
    cause: "Ứng dụng đang bật syncPolicy.automated.selfHeal: true nên ArgoCD coi thao tác sửa tay trên cụm là Configuration Drift và lập tức ghi đè lại theo kho Git."
    fix: "Trong mô hình GitOps, mọi thao tác Rollback phải thực hiện bằng git revert commit cập nhật tag ảnh trên kho cấu hình GitOps."
    cmd: "git revert HEAD && git push origin main"
  - symptom: "Đã xoá tệp cronjob-cleanup.yaml trên kho Git nhưng CronJob vẫn tiếp tục chạy mỗi đêm trên K8s"
    badge: Thiếu prune
    tone: amber
    cause: "Cờ automated.prune đang để mặc định false nên ArgoCD không xoá tài nguyên cũ khỏi cụm."
    fix: "Bật tường minh prune: true bên dưới spec.syncPolicy.automated."
    cmd: "automated:\n  prune: true\n  selfHeal: true"
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Pull-based GitOps (ArgoCD)** đặt tác nhân triển khai **bên trong cụm K8s**, loại bỏ hoàn toàn việc lưu `KUBECONFIG` trên CI.
> - Bật cặp đôi **`prune: true`** (xoá tài nguyên mồ côi đã xoá khỏi Git) + **`selfHeal: true`** (tự khôi phục khi ai đó sửa tay trên cụm) và **`CreateNamespace=true`** trong `syncOptions`.
> - Rollback chuẩn GitOps là **`git revert`** trên kho GitOps · Dùng **`argocd.argoproj.io/sync-wave: "-1"`** để ép Job migrate DB chạy `Succeeded` trước Deployment ở wave `"0"`.

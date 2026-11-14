# Quản lý Cấu hình & Bí mật trong K8s: ConfigMap, Secret & Bảo mật thực chiến

Khi phát triển ứng dụng Node.js trên máy cá nhân, bạn thường tạo tệp `.env` hoặc `config/production.json`. Nhưng khi vận hành 30 Pod trên Kubernetes chạy xuyên suốt Dev, Staging và Production:

- [!] Bạn **không thể** đóng cứng chuỗi kết nối Database hay địa chỉ CORS vào bên trong Container Image bằng `ENV` của Dockerfile (vì mỗi môi trường mỗi khác!).
- [!] Bạn càng **tuyệt đối không được** nhét mật khẩu cơ sở dữ liệu hay khoá ký JWT vào Dockerfile hay kho Git công khai.

Theo triết lý **12-Factor App**, Kubernetes tách bạch cấu hình thành cặp bài trùng: {sky:`ConfigMap`} cho các thông số công khai thông thường và {amber:`Secret`} cho các dữ liệu nhạy cảm.

```visual
kind: groups
title: Phân Tách Cấu Hình Chuẩn 12-Factor App — ConfigMap vs Secret
subtitle: Tách riêng giúp áp quyền RBAC nghiêm ngặt và bật mã hoá phần cứng KMS riêng cho dữ liệu nhạy cảm
columns: 2
items:
  - num: 1
    icon: file-code
    title: ConfigMap (apiVersion v1)
    badge: Cấu hình KHÔNG nhạy cảm
    tone: sky
    bullets:
      - "Lưu cặp khoá-giá trị văn bản rõ trong mục **`data:`**"
      - "Phù hợp cho biến đơn lẻ (`LOG_LEVEL`, `CORS_ORIGIN`, `PORT`) hoặc nguyên tệp cấu hình nhiều dòng (`nginx.conf`, `feature-flags.json`)"
    footer: Có thể lưu thẳng tệp ConfigMap YAML trên kho Git dự án
  - num: 2
    icon: lock
    title: Secret (apiVersion v1)
    badge: Dữ liệu NHẠY CẢM
    tone: amber
    bullets:
      - "Mặc định dùng `type: Opaque` (ngoài ra có `kubernetes.io/tls`, `kubernetes.io/dockerconfigjson`)"
      - "Dành riêng cho mật khẩu DB, API Key, khoá ký JWT, chứng chỉ TLS"
      - "Cho phép ghi chuỗi đọc được qua **`stringData:`** — API Server tự chuyển sang Base64 lưu vào `data:`"
    footer: TUYỆT ĐỐI KHÔNG commit Secret dạng văn bản thường/Base64 lên Git!
```

## 1. `ConfigMap`: Tách cấu hình không nhạy cảm ra khỏi mã nguồn

```visual
kind: illustration
diagram: "kube:k12"
alt: "Tách cấu hình 12-Factor bằng ConfigMap và Secret nạp vào Pod qua biến môi trường envFrom so với gắn ổ đĩa chỉ đọc tmpfs"
title: "Giải Phẫu Nạp Cấu Hình & Bí Mật: envFrom Tĩnh vs Ổ Đĩa Tmpfs Tự Đồng Bộ"
subtitle: "Giữ Container Image bất biến xuyên suốt Dev, Staging và Production bằng cách tiêm cấu hình động từ bên ngoài"
caption: "Sự khác biệt cốt lõi giữa nạp vào process.env lúc khởi tạo (không tự cập nhật nóng) và gắn thành tệp chỉ đọc trên RAM tmpfs (tự đồng bộ sau ~60s)"
callouts:
  - num: 1
    label: "Tách bạch ConfigMap công khai & Secret nhạy cảm"
    desc: "ConfigMap lưu tham số rõ ràng; Secret lưu mật khẩu/chứng chỉ và cần bật mã hoá KMS hoặc External Secrets thay vì chỉ tin vào Base64."
    tone: sky
  - num: 2
    label: "Cơ chế env / envFrom — Đóng băng lúc khởi chạy"
    desc: "Biến nạp vào process.env không tự đổi khi sửa ConfigMap trên cụm; bắt buộc chạy kubectl rollout restart để nhận giá trị mới."
    tone: violet
  - num: 3
    label: "Gắn Volume chỉ đọc trên tmpfs — Tự động đồng bộ"
    desc: "Secret gắn dạng tệp nằm trên bộ nhớ RAM (tmpfs) không chạm ổ cứng và được kubelet tự động đồng bộ lại sau khoảng 60 giây."
    tone: emerald
```

```yaml Manifest ConfigMap chuẩn chứa các thông số môi trường công khai
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  LOG_LEVEL: "info"
  CORS_ORIGIN: "https://shop.example.com"
```

Có hai cách phổ biến nhất để nạp `ConfigMap` vào bên trong Pod — hãy chú ý sự khác biệt lớn về khả năng **cập nhật nóng (hot-reload)** giữa chúng:

```visual
kind: compare
title: Hai Cơ Chế Nạp ConfigMap Vào Pod — Biến Môi Trường vs Gắn Tệp Volume
subtitle: Nắm rõ hành vi cập nhật khi bạn sửa ConfigMap trên cụm đang chạy!
left:
  badge: "CÁCH 1 · Nạp vào process.env (envFrom)"
  title: Bất biến suốt vòng đời tiến trình
  tone: sky
  code: |
    containers:
      - name: api
        image: ghcr.io/acme/shop-api:1.4.0
        envFrom:
          - configMapRef:
              name: api-config
  lang: yaml
  bullets:
    - "==`envFrom`== nạp trọn gói **tất cả** các khoá trong `api-config` thành `process.env.LOG_LEVEL`, `process.env.CORS_ORIGIN` (hoặc nạp lẻ bằng `configMapKeyRef`)"
    - "**KHÔNG tự động đổi** khi bạn sửa `ConfigMap`! Biến môi trường OS chỉ nạp 1 lần lúc khởi tạo container"
    - "Muốn nhận giá trị mới, cần chạy **`kubectl rollout restart deployment/...`**"
right:
  badge: "CÁCH 2 · Gắn thành tệp (volumeMounts)"
  title: Gắn ổ đĩa ảo cấu hình (tự đồng bộ tệp)
  tone: emerald
  code: |
    containers:
      - name: web
        image: nginx:1.27-alpine
        volumeMounts:
          - name: conf-vol
            mountPath: /etc/nginx/conf.d
            readOnly: true
    volumes:
      - name: conf-vol
        configMap:
          name: nginx-conf
  lang: yaml
  bullets:
    - "Biến mỗi khoá trong `ConfigMap` thành một tệp văn bản trong thư mục `/etc/nginx/conf.d`"
    - "Kubelet tự đồng bộ lại nội dung tệp sau khoảng ~1 phút khi `ConfigMap` thay đổi (trừ khi mount lẻ `subPath`)"
    - "Luôn bật **`readOnly: true`** để ngăn ứng dụng vô tình (hoặc bị tấn công) ghi đè tệp cấu hình!"
```

## 2. `Secret`: Hiểu đúng sự thật về `Base64` để không sập bẫy ảo tưởng an toàn!

Khi tạo Manifest `Secret`, trường tiện lợi ==`stringData:`== cho phép bạn truyền chuỗi văn bản thường (write-only), và Kubernetes API Server sẽ tự động chuyển sang chuỗi `Base64` cất vào `data:`:

```yaml Khai báo Secret với stringData & nạp lẻ từng khoá qua secretKeyRef
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData:
  DB_PASSWORD: "placeholder-change-me"
---
# Trích đoạn nạp vào một biến môi trường cụ thể trong Pod / Deployment:
#   env:
#     - name: DATABASE_PASSWORD
#       valueFrom:
#         secretKeyRef:
#           name: db-credentials
#           key: DB_PASSWORD
```

> [!WARNING] Cảnh báo bảo mật số 1 năm 2026: `Base64` KHÔNG PHẢI là Mã hoá (Encryption)!
> Rất nhiều người thấy chuỗi `cGxhY2Vob2xkZXI=` trong `data:` của `Secret` liền yên tâm commit thẳng tệp `secret.yaml` lên GitHub! Đó là một sai lầm chết người: ==Base64 chỉ là phép biểu diễn ký tự (encoding)==, bất kỳ ai cũng giải mã về văn bản gốc trong 0.5 giây bằng `echo "..." | base64 -d` hoặc `Buffer.from(..., 'base64').toString()`!

```visual
kind: groups
title: 3 Lớp Phòng Thủ Chuẩn Production Cho Kubernetes Secret Năm 2026 [!badge:amber:Chuẩn GitOps]
columns: 3
items:
  - num: 1
    icon: database
    title: Encryption at Rest cho etcd
    badge: Bảo vệ ổ cứng Control Plane
    tone: violet
    bullets:
      - "Bật chế độ mã hoá dữ liệu `Secret` trước khi ghi xuống đĩa của `etcd` bằng khoá phần cứng đám mây (**AWS KMS / GCP KMS / Azure Key Vault**)"
  - num: 2
    icon: shield-alert
    title: Phân Quyền RBAC Tối Thiểu
    badge: Least Privilege
    tone: amber
    bullets:
      - "Khoá chặt quyền `get`, `list`, `watch` đối với tài nguyên `secrets` — không cấp tràn lan cho tài khoản lập trình viên thông thường hay ServiceAccount mặc định"
  - num: 3
    icon: key
    title: External Secrets / Sealed Secrets
    badge: Tuyệt đối sạch Git
    tone: emerald
    bullets:
      - "Dùng **External Secrets Operator (ESO)** tự động kéo mật khẩu từ AWS Secrets Manager / HashiCorp Vault vào cụm"
      - "Hoặc mã hoá bất đối xứng bằng **Sealed Secrets / SOPS** trước khi đưa vào luồng GitOps!"
```

## 3. Khởi tạo trực tiếp trên CLI bằng `kubectl create`

Khi thao tác thực tế mà không muốn lưu mật khẩu ra tệp YAML trung gian trên ổ cứng, bạn có thể khởi tạo trực tiếp từ dòng lệnh bằng `--from-literal`:

```bash
kubectl create configmap app-cfg --from-literal=PORT=3000
kubectl create secret generic jwt-sec --from-literal=JWT_PUBLIC_KID=kid-2026
```

## 4. Chẩn đoán lỗi cấu hình & Tư duy Fail-Fast Validation trong Node.js

```visual
kind: troubleshoot
title: Bảng Chẩn Đoán Sự Cố Cấu Hình ConfigMap & Secret Thực Chiến
items:
  - symptom: "Pod đứng im ở trạng thái 0/1 với STATUS: CreateContainerConfigError"
    badge: Chặn trước khi chạy
    tone: rose
    cause: "Pod tham chiếu tới một `Secret` hoặc `ConfigMap` chưa được tạo trên cùng Namespace, hoặc gõ sai tên khoá `key` trong `secretKeyRef` / `configMapKeyRef`."
    fix: "Xem dòng lỗi chính xác ở cuối bảng Events của lệnh describe, rồi tạo đúng Secret/ConfigMap còn thiếu."
    cmd: "kubectl describe pod billing-worker && kubectl get secret,cm"
  - symptom: "Pod vẫn báo 1/1 Running nhưng văng lỗi 500 giữa chừng khi có khách gọi API"
    badge: Bẫy thiếu biến envFrom
    tone: amber
    cause: "Dùng `envFrom` nạp sỉ cả `ConfigMap` mà bên trong vô tình thiếu mất khoá `REDIS_URL` — K8s vẫn cho container khởi chạy vào `node dist/server.js`!"
    fix: "Kiểm tra lược đồ `process.env` bằng thư viện `zod` hoặc `envalid` ngay dòng đầu tiên của `main.ts` (Fail-Fast Validation) để thiếu biến là báo lỗi rõ trong `kubectl logs` tức khắc."
    cmd: "kubectl logs deployment/shop-api"
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`ConfigMap`** (`data:`) lưu thông số công khai · **`Secret`** (`stringData:` → `data:`) lưu thông tin nhạy cảm; **`Base64` chỉ là encoding, KHÔNG PHẢI encryption** — trên Production dùng **External Secrets Operator** hoặc **Sealed Secrets / SOPS**.
> - Nạp trọn gói bằng **`envFrom`** (`configMapRef` / `secretRef`) vào `process.env` **không tự đổi nóng** khi sửa ConfigMap — cần chạy `kubectl rollout restart deployment/...`.
> - Tham chiếu sai tên Secret hoặc sai `key` trong `secretKeyRef` sẽ chặn Pod ngay ở trạng thái ==`CreateContainerConfigError`==.

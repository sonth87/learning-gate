# Quản lý Cấu hình & Bí mật trong K8s: ConfigMap, Secret & Bảo mật thực chiến

Khi phát triển ứng dụng Node.js trên máy cá nhân, có thể bạn đã quen với việc tạo tệp `.env` hoặc tệp `config/production.json`. Nhưng khi vận hành 30 Pod trên Kubernetes chạy xuyên suốt Dev, Staging và Production:
- Bạn **không thể** đóng cứng chuỗi kết nối Database hay địa chỉ CORS vào bên trong Container Image (vì mỗi môi trường mỗi khác!).
- Bạn càng **tuyệt đối không được** nhét mật khẩu cơ sở dữ liệu hay khoá ký JWT vào Dockerfile hay kho Git công khai.

Kubernetes cung cấp một cặp bài trùng tách biệt rạch ròi theo triết lý **12-Factor App**: **`ConfigMap`** cho các thông số cấu hình thông thường và **`Secret`** cho các dữ liệu nhạy cảm.

---

## 1. `ConfigMap`: Tách cấu hình không nhạy cảm ra khỏi mã nguồn

Một `ConfigMap` (`apiVersion: v1`) lưu trữ dữ liệu dưới dạng các cặp khoá-giá trị chuỗi trong mục `data:`. Nó có thể chứa các biến đơn lẻ (`LOG_LEVEL`, `CORS_ORIGIN`) hoặc thậm chí nguyên cả nội dung một tệp cấu hình nhiều dòng (`nginx.conf`, `feature-flags.json`):

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  LOG_LEVEL: "info"
  CORS_ORIGIN: "https://shop.example.com"
```

### Hai cách phổ biến nhất để nạp `ConfigMap` vào Pod:
1. **Nạp thành biến môi trường (`process.env`) qua `envFrom` (hoặc `configMapKeyRef`):**
   ```yaml
   containers:
     - name: api
       image: ghcr.io/acme/shop-api:1.4.0
       envFrom:
         - configMapRef:
             name: api-config
   ```
   Toàn bộ khoá trong `api-config` lập tức trở thành `process.env.LOG_LEVEL` và `process.env.CORS_ORIGIN`! *Lưu ý nhỏ:* biến môi trường chỉ được nạp lúc tiến trình khởi chạy — nếu bạn sửa `ConfigMap`, bạn cần chạy `kubectl rollout restart deployment/...` để Pod nhận giá trị môi trường mới.
2. **Gắn thành tệp cấu hình trong ổ đĩa ảo (`volumes` + `volumeMounts`):**
   ```yaml
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
   ```
   Luôn bật `readOnly: true` trên `volumeMounts` để ngăn tiến trình ứng dụng vô tình (hoặc bị tấn công) sửa ngược tệp cấu hình!

---

## 2. `Secret`: Hiểu đúng sự thật về `Base64` để không sập bẫy ảo tưởng an toàn!

`Secret` có cấu trúc rất giống `ConfigMap`, thường dùng kiểu mặc định `type: Opaque` cho mật khẩu ứng dụng, API Key, chuỗi kết nối DB:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData:
  DB_PASSWORD: "placeholder-change-me"
```

- Khi viết Manifest YAML, trường **`stringData:`** cho phép bạn ghi chuỗi văn bản rõ (Kubernetes API Server sẽ tự động mã hoá sang Base64 lưu vào `data:` khi nhận tệp).
- Khi nạp vào một biến môi trường cụ thể trong Pod (ví dụ mã nguồn đợi `DATABASE_PASSWORD` nhưng khoá trong Secret tên là `DB_PASSWORD`), ta dùng **`valueFrom.secretKeyRef`**:
  ```yaml
  env:
    - name: DATABASE_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: DB_PASSWORD
  ```
  *(Nếu gõ sai tên Secret hoặc sai tên `key`, Pod sẽ bị chặn ngay trước lúc khởi động với trạng thái lỗi **`CreateContainerConfigError`**!)*

### ⚠️ Cảnh báo bảo mật quan trọng nhất năm 2026: Base64 KHÔNG PHẢI là Mã hoá (Encryption)!
Nhiều người nhìn thấy chuỗi `cGxhY2Vob2xkZXI=` trong `Secret` liền yên tâm commit thẳng tệp `secret.yaml` lên GitHub! Đó là một sai lầm chết người: bất kỳ ai cũng giải mã được Base64 trong 0.5 giây bằng `echo "..." | base64 -d` (hoặc `Buffer.from(..., 'base64').toString()` trong Node.js)!

Trong kiến trúc Production chuẩn mực:
1. **Bật Encryption at Rest cho `etcd`:** Cấu hình cụm mã hoá dữ liệu Secret bằng khoá KMS phần cứng (AWS KMS / GCP KMS) khi lưu xuống đĩa cứng của Control Plane.
2. **Phân quyền RBAC chặt chẽ:** Không cấp quyền `get`/`list` tài nguyên `secrets` cho các tài khoản thông thường.
3. **Không lưu Secret thật dạng văn bản trên Git:** Sử dụng **External Secrets Operator (ESO)** để tự động kéo mật khẩu trực tiếp từ AWS Secrets Manager / HashiCorp Vault về tạo Secret trong cụm, hoặc mã hoá bất đối xứng bằng **Sealed Secrets / SOPS**!

---

## 3. Khởi tạo trực tiếp trên CLI bằng `kubectl create`

Khi thao tác thực tế mà không muốn lưu mật khẩu ra tệp YAML trung gian trên ổ cứng, bạn có thể tạo trực tiếp từ dòng lệnh:

```bash
kubectl create configmap app-cfg --from-literal=PORT=3000
kubectl create secret generic jwt-sec --from-literal=JWT_PUBLIC_KID=kid-2026
```

---

## 4. Liên hệ tư duy Node.js: Kiểm tra biến môi trường ngay lúc khởi động (Fail-Fast Validation)

Nếu một khoá trong `secretKeyRef` bị gõ sai tên, Kubernetes sẽ chặn đứng ngay ở bước tạo container (`CreateContainerConfigError`). Tuy nhiên, nếu bạn dùng `envFrom` để nạp sỉ cả một `ConfigMap` mà bên trong vô tình thiếu mất biến `REDIS_URL`, Pod vẫn khởi chạy vào `node dist/server.js` rồi mới văng lỗi giữa chừng khi có khách gọi API! Vì vậy, thói quen tốt nhất của kỹ sư Node.js trên Kubernetes là kết hợp `ConfigMap`/`Secret` với bước kiểm tra lược đồ biến môi trường (như dùng thư viện `zod` hoặc `envalid` kiểm tra `process.env` ngay dòng đầu tiên của `main.ts`) để nếu thiếu cấu hình, ứng dụng báo lỗi rõ ràng trong `kubectl logs` ngay tức khắc.


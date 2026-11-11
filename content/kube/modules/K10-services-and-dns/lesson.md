# Kubernetes Service, Phân giải tên miền CoreDNS & Kết nối đa tầng

Ở bài `K09`, bạn đã thấy sức mạnh tự chữa lành của `Deployment`: hễ một Pod chết, `ReplicaSet` lập tức tạo ra Pod mới thay thế. Nhưng chính tính chất "sinh diệt liên tục" đó lại đẻ ra một bài toán mạng hóc búa:

**Mỗi lần Pod được tạo lại, nó nhận một địa chỉ IP nội bộ hoàn toàn mới** (ví dụ Pod cũ là `10.244.1.15`, Pod mới sinh ra ở Node khác lại là `10.244.2.48`)! Nếu Frontend hay API khác lưu cứng địa chỉ IP của Pod, chỉ sau một đợt Rolling Update toàn bộ kết nối sẽ đứt gãy sạch.

Tài nguyên **`Service`** giải quyết triệt để vấn đề này bằng cách đặt một **địa chỉ IP ảo cố định (Virtual IP — ClusterIP)** kèm một **tên miền DNS bất biến** đứng chắn phía trước nhóm các Pod hay thay đổi đó.

---

## 1. Ba loại Service cốt lõi: `ClusterIP` vs `NodePort` vs `LoadBalancer`

| Loại `spec.type` | Phạm vi truy cập | Trường hợp sử dụng thực tế |
| --- | --- | --- |
| **`ClusterIP`** *(Mặc định)* | **Chỉ nội bộ bên trong cụm K8s** (bên ngoài Internet không thể gọi thẳng vào). | 90% dịch vụ nội bộ: Order API, Payment Service, PostgreSQL, Redis. |
| **`NodePort`** | Mở một cổng tĩnh trong dải **`30000–32767`** trên card mạng của mọi Worker Node (`<NodeIP>:30080`). | Thử nghiệm trên cụm local (`kind`, `minikube`), môi trường lab nội bộ hoặc đấu nối phần cứng cân bằng tải vật lý tại chỗ (on-prem). |
| **`LoadBalancer`** | Tự động gọi API của đám mây (AWS ALB/NLB, GCP, Azure) thuê một bộ cân bằng tải có IP Public thật. | Thường chỉ cấp **1 chiếc duy nhất** cho bộ điều khiển cửa ngõ (Ingress / Gateway Controller) để tiết kiệm chi phí đám mây. |

---

## 2. Phân biệt rạch ròi 3 con số cổng: `port`, `targetPort` và `nodePort`

Rất nhiều sự cố `502 Bad Gateway` hoặc `Connection Refused` bắt nguồn từ việc nhầm lẫn giữa các trường cổng trong `Service`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: shop-api-svc
spec:
  type: ClusterIP
  selector:
    app: shop-api         # Tìm mọi Pod khoẻ mạnh (Ready) đang mang nhãn app=shop-api
  ports:
    - name: http
      port: 80            # 1) Cổng trên chính chiếc Service này (khách gọi http://shop-api-svc:80)
      targetPort: 3000    # 2) Cổng mà code Node.js thực sự lắng nghe BÊN TRONG Pod (app.listen(3000))
      # nodePort: 30080   # 3) (Chỉ có khi type: NodePort) Cổng mở trên vỏ máy Worker Node (30000-32767)
```

### Cơ chế ghép nối qua đối tượng `Endpoints` / `EndpointSlice`
Kubernetes không chuyển gói tin một cách mù quáng! Mỗi khi bạn tạo `Service`, K8s liên tục quét tìm các Pod thoả mãn đồng thời:
1. Khớp toàn bộ nhãn trong `spec.selector` (`app: shop-api`), **VÀ**
2. Đang ở trạng thái sẵn sàng **`Ready = true`**.

Danh sách `IP:targetPort` của các Pod đạt chuẩn được ghi trực tiếp vào bảng **`Endpoints`** (xem bằng lệnh `kubectl get endpoints shop-api-svc`). Nếu bạn gõ lệch nhãn `selector` hoặc sai `targetPort`, cột `ENDPOINTS` sẽ hiện **`<none>`** — dấu hiệu nhận biết số 1 của lỗi mất kết nối mạng trong K8s!

---

## 3. Quy chuẩn tên miền CoreDNS: Cùng Namespace vs Xuyên Namespace

Bên trong mọi cụm Kubernetes đều chạy sẵn máy chủ tên miền **CoreDNS** (ở namespace `kube-system`). Ngay khoảnh khắc bạn tạo một `Service`, tên miền đầy đủ (FQDN) của nó lập tức có hiệu lực theo cấu trúc chuẩn:

```text
<tên-service>.<tên-namespace>.svc.cluster.local
```

- **Nếu 2 dịch vụ nằm CÙNG một Namespace** (ví dụ cả `frontend` và `shop-api-svc` đều ở `production`): Bạn chỉ cần viết ngắn gọn `http://shop-api-svc` (vì cổng `port: 80` là mặc định HTTP!).
- **Nếu gọi XUYÊN qua Namespace khác** (ví dụ `api` ở namespace `storefront` cần gọi vào cơ sở dữ liệu `postgres-svc` nằm ở namespace `database`): Bạn **bắt buộc ghi kèm tên namespace** (hoặc viết trọn vẹn FQDN):
  ```text
  postgres-svc.database.svc.cluster.local:5432
  ```

---

## 4. Tạo nhanh Service từ Deployment bằng `kubectl expose`

Trong các bài kiểm tra thực hành (như chứng chỉ CKAD) hoặc khi dựng nhanh môi trường thử nghiệm, bạn có thể xuất bản một `Deployment` đang chạy thành `Service` chỉ bằng một dòng lệnh gọn gàng:

```bash
kubectl expose deployment catalog \
  --name=catalog-svc \
  --port=80 \
  --target-port=4000
```
Lệnh này tự động sao chép chính xác bộ nhãn `selector` của `Deployment/catalog` sang cho `Service/catalog-svc`, giúp giảm thiểu tối đa rủi ro gõ lệch nhãn bằng tay!

---

## 5. Mẹo dùng tên cổng có nghĩa (Named Ports) như biến hằng số trong Node.js

Trong dự án Node.js lớn, bạn không rải con số `3000` cứng ở khắp 15 tệp mã nguồn mà thường gom về một hằng số `HTTP_PORT`. Kubernetes cũng cho phép bạn đặt tên cổng ngay trên Container của `Deployment` (ví dụ `name: http`, `containerPort: 3000`), rồi ở `Service` chỉ cần viết `targetPort: http`. Lợi ích lớn nhất là khi đội Backend nâng cấp framework và đổi sang cổng `8080`, bạn chỉ cần sửa duy nhất `containerPort: 8080` trong `Deployment` mà không bao giờ sợ `Service` bị lệch cổng gây lỗi `502 Bad Gateway`!


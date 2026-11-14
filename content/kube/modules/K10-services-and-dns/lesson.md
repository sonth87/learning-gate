# Kubernetes Service, Phân giải tên miền CoreDNS & Kết nối đa tầng

Ở bài `K09`, bạn đã thấy sức mạnh tự chữa lành của `Deployment`: hễ một Pod chết, `ReplicaSet` lập tức tạo ra Pod mới thay thế. Nhưng chính tính chất "sinh diệt liên tục" đó lại đẻ ra một bài toán mạng hóc búa:

- [!] **Mỗi lần Pod được khởi tạo lại, nó nhận một địa chỉ IP nội bộ hoàn toàn mới** (ví dụ Pod cũ là `10.244.1.15`, Pod mới sinh ra ở Node khác lại là `10.244.2.48`)!
- [>] Nếu Frontend hay microservice khác lưu cứng IP của Pod, chỉ sau một đợt Rolling Update toàn bộ kết nối sẽ đứt gãy sạch.

Tài nguyên **`Service`** (`apiVersion: v1`) giải quyết triệt để bài toán này bằng cách đặt một ==địa chỉ IP ảo cố định (Virtual IP — ClusterIP)== kèm một {sky:tên miền DNS bất biến} đứng chắn phía trước và tự động cân bằng tải tới các Pod khoẻ mạnh.

```visual
kind: illustration
diagram: "kube:k10"
src: "/illustrations/kube/k8s-service-ingress-routing.jpg"
alt: "So sánh 3 kiểu Service (ClusterIP, NodePort, LoadBalancer), phân giải CoreDNS và định tuyến EndpointSlice tới các Pod khoẻ mạnh"
title: "Giải Phẫu Kubernetes Service: Địa Chỉ Ảo ClusterIP, CoreDNS & EndpointSlice"
subtitle: "Neo giữ điểm truy cập mạng bất biến phía trước hàng chục địa chỉ IP Pod sinh diệt liên tục"
caption: "Ba lớp kiểu Service lồng nhau, cơ chế phân giải tên miền nội bộ qua CoreDNS và cách kube-proxy chỉ chia tải vào các Pod đạt Ready=true"
callouts:
  - num: 1
    label: "Ba kiểu Service: ClusterIP, NodePort & LoadBalancer"
    desc: "ClusterIP phục vụ 90% giao tiếp nội bộ; NodePort mở cổng 30000-32767 trên Node; LoadBalancer thuê thêm IP công cộng từ đám mây."
    tone: sky
  - num: 2
    label: "CoreDNS phân giải tên miền svc.cluster.local"
    desc: "Các dịch vụ trong cùng Namespace gọi nhau gọn nhẹ qua http://shop-api-svc mà không cần quan tâm IP thực tế của từng Pod."
    tone: violet
  - num: 3
    label: "EndpointSlice tự động lọc các Pod Ready=true"
    desc: "Mọi Pod đang lỗi hoặc chưa vượt qua kiểm tra sẵn sàng sẽ tự động bị rút khỏi danh sách nhận lưu lượng của Service VIP."
    tone: emerald
```

## 1. Ba loại Service cốt lõi: `ClusterIP` vs `NodePort` vs `LoadBalancer`

```visual
kind: groups
title: So Sánh 3 Kiểu Service Cốt Lõi Trong Kubernetes (spec.type)
subtitle: Nếu bạn không ghi trường spec.type trong YAML, Kubernetes mặc định chọn kiểu ClusterIP an toàn nhất
columns: 3
items:
  - num: 1
    icon: shield-check
    title: ClusterIP (Mặc định)
    badge: Chỉ nội bộ trong cụm
    tone: emerald
    bullets:
      - "**Phạm vi:** Chỉ các thành phần bên trong cụm K8s mới gọi được (Internet ngoài không thể gọi thẳng)"
      - "Kiểu mặc định khi bỏ trống `spec.type`"
      - "**Ứng dụng:** 90% dịch vụ nội bộ — Order API, Payment Service, PostgreSQL, Redis"
    footer: Mặc định vàng cho giao tiếp Đông-Tây (East-West) nội bộ
  - num: 2
    icon: server
    title: NodePort
    badge: Dải cổng 30000–32767
    tone: amber
    bullets:
      - "**Phạm vi:** Mở một cổng tĩnh trong dải ==`30000–32767`== trên card mạng của mọi Worker Node (`<NodeIP>:30080`)"
      - "**Ứng dụng:** Thử nghiệm cụm local (`kind`, `minikube`), phòng lab nội bộ hoặc đấu nối cân bằng tải phần cứng tại chỗ (on-prem)"
    footer: Bao hàm sẵn tính năng của ClusterIP ở bên dưới
  - num: 3
    icon: cloud
    title: LoadBalancer
    badge: IP Public trên Đám mây
    tone: sky
    bullets:
      - "**Phạm vi:** Gọi API của Cloud (AWS ALB/NLB, GCP, Azure) thuê một bộ cân bằng tải có IP Public thật ngoài Internet"
      - "**Ứng dụng:** Thường chỉ cấp **1 chiếc duy nhất** cho bộ điều khiển cửa ngõ (Ingress / Gateway Controller) để tiết kiệm chi phí Cloud"
    footer: Tránh tạo tràn lan cho từng microservice lẻ vì tốn phí hàng tháng
```

## 2. Phân biệt rạch ròi 3 con số cổng: `port`, `targetPort` và `nodePort`

Rất nhiều sự cố `502 Bad Gateway` hoặc `Connection Refused` bắt nguồn từ việc nhầm lẫn giữa các trường cổng trong `Service`:

```visual
kind: anatomy
title: Giải Phẫu Bộ Lọc Nhãn & 3 Con Số Cổng Trong Manifest Service
subtitle: Nhớ quy tắc ngắn gọn — port là mặt tiền của Service, còn targetPort là cửa phòng bên trong Pod!
items:
  - keyword: selector
    role: Bộ lọc tìm Pod đích
    tone: violet
    summary: Quét tìm mọi Pod đang sẵn sàng (Ready = true) mang bộ nhãn khớp với selector này.
    bullets:
      - "Nếu gõ lệch nhãn so với Pod `metadata.labels`, danh sách đích sẽ trống rỗng (`ENDPOINTS = <none>`)"
    example: "selector:\n  app: shop-api"
    lang: yaml
  - keyword: port
    role: Cổng mặt tiền trên Service
    tone: sky
    summary: Cổng mở trên chính chiếc Virtual IP của Service để các dịch vụ khác gọi vào.
    bullets:
      - "Ví dụ đặt `port: 80` thì khách nội bộ gọi gọn gàng `http://shop-api-svc` (hoặc `http://shop-api-svc:80`)"
    example: "port: 80"
    lang: yaml
  - keyword: targetPort
    role: Cổng thực tế bên trong Pod
    tone: emerald
    summary: Cổng mà tiến trình ứng dụng Node.js thực sự lắng nghe bên trong container của Pod.
    bullets:
      - "Phải khớp chính xác với con số trong `app.listen(3000)` của mã nguồn!"
    example: "targetPort: 3000"
    lang: yaml
  - keyword: nodePort
    role: Cổng vỏ máy Worker Node
    tone: amber
    summary: "Chỉ xuất hiện khi dùng `type: NodePort` (hoặc `LoadBalancer`), mở trên IP của các máy Worker."
    bullets:
      - "Bắt buộc nằm trong dải cổng mặc định **`30000–32767`** của Kubernetes"
    example: "nodePort: 30080"
    lang: yaml
```

```yaml Manifest Service hoàn chỉnh định tuyến từ cổng 80 vào cổng 3000 của Pod
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

### Cơ chế ghép nối động qua `Endpoints` / `EndpointSlice`

Kubernetes không chuyển gói tin một cách mù quáng! Khi bạn tạo `Service`, K8s liên tục quét các Pod thoả mãn **đồng thời 2 điều kiện**: (1) Khớp toàn bộ nhãn `spec.selector` **VÀ** (2) Đang ở trạng thái **`Ready = true`**, rồi ghi danh sách `IP:targetPort` vào đối tượng **`Endpoints` / `EndpointSlice`**.

```visual
kind: flow
title: Đường Đi Của Gói Tin Qua Service & Chốt Kiểm Tra Endpoints
steps:
  - icon: globe
    badge: 1. Gọi tên DNS
    title: Client Pod
    desc: Gọi tên miền cố định của Service ở cổng mặt tiền port 80
    code: "http://shop-api-svc:80"
    tone: sky
    edge: CoreDNS -> VIP
  - icon: network
    badge: 2. Cổng mặt tiền
    title: Service (ClusterIP)
    desc: Giữ Virtual IP bất biến, tra bảng định tuyến của kube-proxy
    code: "port: 80"
    tone: violet
    edge: lọc selector + Ready
  - icon: check
    badge: 3. Danh bạ đích sống
    title: Endpoints / EndpointSlice
    desc: Chỉ giữ danh sách IP:targetPort của các Pod khớp nhãn VÀ Ready = true
    code: "10.244.1.15:3000, 10.244.2.48:3000"
    tone: amber
    edge: cân bằng tải tới targetPort
  - icon: container
    badge: 4. Cửa phòng trong Pod
    title: Pod Node.js
    desc: Tiến trình Node.js nhận gói tin tại cổng thực tế app.listen(3000)
    code: "targetPort: 3000"
    tone: emerald
```

> [!WARNING] Chẩn đoán nhanh sự cố mất mạng: `ENDPOINTS = <none>`
> Hãy luôn chạy `kubectl get endpoints shop-api-svc` đầu tiên khi gọi Service bị lỗi! Nếu các Pod vẫn đang `1/1 Running` nhưng cột `ENDPOINTS` hiển thị ==`<none>`==, nguyên nhân số 1 là **nhãn trong `spec.selector` của Service bị gõ lệch không khớp với `metadata.labels` trên các Pod**!

## 3. Quy chuẩn tên miền CoreDNS: Cùng Namespace vs Xuyên Namespace

Bên trong mọi cụm Kubernetes đều chạy sẵn máy chủ tên miền **CoreDNS** (ở namespace `kube-system`). Ngay khoảnh khắc bạn tạo một `Service`, tên miền đầy đủ (**FQDN**) của nó lập tức có hiệu lực theo cấu trúc chuẩn:
==`<service-name>.<namespace-name>.svc.cluster.local`==

```visual
kind: compare
title: Quy Tắc Gọi Tên Miền CoreDNS — Nội Bộ Namespace vs Xuyên Namespace
subtitle: Không bao giờ cần nhớ IP — chỉ cần gọi đúng tên Service và Namespace theo chuẩn CoreDNS
left:
  badge: "CÙNG NAMESPACE · Viết ngắn gọn"
  title: Gọi thẳng bằng <tên-service>
  tone: emerald
  code: |
    # Cả frontend và shop-api-svc cùng ở namespace "production":
    API_URL="http://shop-api-svc"
  lang: bash
  bullets:
    - "Chỉ cần gọi trực tiếp tên Service (`shop-api-svc`), CoreDNS tự động nối hậu tố namespace hiện tại"
    - "Vì Service mở `port: 80` (mặc định của HTTP) nên thậm chí không cần ghi `:80`"
right:
  badge: "XUYÊN NAMESPACE · Bắt buộc kèm Namespace"
  title: "<service>.<namespace>.svc.cluster.local"
  tone: sky
  code: |
    # Web ở "frontend" gọi Redis ở namespace "cache":
    REDIS_HOST="redis-master.cache.svc.cluster.local"

    # API ở "storefront" gọi Postgres ở namespace "database":
    DB_URI="postgres://postgres-svc.database.svc.cluster.local:5432"
  lang: bash
  bullets:
    - "Khi gọi sang một Namespace khác, **bắt buộc phải ghi kèm tên Namespace đích**"
    - "Chuẩn đầy đủ (FQDN) luôn tuân theo 5 thành phần: `<tên-service>.<tên-namespace>.svc.cluster.local`"
```

## 4. Tạo nhanh Service từ Deployment bằng `kubectl expose`

Trong các kỳ thi thực hành (như CKAD) hoặc khi dựng nhanh môi trường thử nghiệm, bạn có thể xuất bản một `Deployment` đang chạy thành `Service` chỉ bằng một dòng lệnh Imperative gọn gàng:

```bash
kubectl expose deployment catalog \
  --name=catalog-svc \
  --port=80 \
  --target-port=4000
```

Lệnh ==`kubectl expose`== tự động sao chép chính xác bộ nhãn `selector` của `Deployment/catalog` sang cho `Service/catalog-svc`, giúp loại bỏ hoàn toàn rủi ro gõ lệch nhãn bằng tay!

## 5. Mẹo dùng tên cổng có nghĩa (Named Ports) như biến hằng số trong Node.js

> [!TIP] Đặt tên cổng (`Named Ports`) để không bao giờ dính `502 Bad Gateway` khi đổi cổng
> Giống như việc gom con số `3000` vào một hằng số `HTTP_PORT` trong dự án TypeScript, Kubernetes cho phép bạn đặt tên cổng ngay trên Container của `Deployment` (`name: http`, `containerPort: 3000`), rồi ở `Service` chỉ cần viết **`targetPort: http`**. Khi đội Backend nâng cấp framework đổi sang cổng `8080`, bạn chỉ cần sửa duy nhất `containerPort: 8080` trong `Deployment` mà `Service` vẫn tự động ăn khớp 100%!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **3 kiểu Service:** `ClusterIP` (mặc định, chỉ nội bộ cụm) · `NodePort` (cổng tĩnh `30000–32767` trên Node) · `LoadBalancer` (thuê Cloud LB có IP Public).
> - **3 cổng:** `port` (mặt tiền trên Service) · `targetPort` (cổng tiến trình lắng nghe trong Pod) · `nodePort` (`30000–32767` trên máy Node).
> - **CoreDNS FQDN:** `<service>.<namespace>.svc.cluster.local` · Lệch nhãn `selector` làm `kubectl get endpoints` hiện `<none>` · Xuất bản nhanh bằng `kubectl expose`.

# Sao chép Bất đồng bộ (PSYNC2), Chống Split-Brain & Tự động Chuyển đổi Dự phòng với Sentinel HA

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Lưu dữ liệu xuống ổ cứng ở bài `R13` giúp bạn không mất dữ liệu khi bật lại máy, nhưng **nếu cả máy chủ vật lý cháy nguồn lúc 8 giờ tối**, bạn vẫn bị sập dịch vụ (*Downtime*) suốt 20 phút chờ dựng máy mới! Để hệ thống **tự động chữa lành trong vài giây** mà không cần con người thức dậy lúc nửa đêm (**`High Availability` — Sẵn sàng cao**), Redis sử dụng bộ ba khái niệm rất dễ hình dung:
> - **`Master` (Bản chính) & `Replica` (Bản sao dự phòng):** Giống **1 Bếp trưởng** đứng nấu chính (nhận mọi lệnh Ghi) và đọc to từng thao tác qua bộ đàm cho **2 Bếp phó (`Replicas`)** chép lại y hệt trên bàn phụ (giúp gánh phụ các lệnh Đọc và sẵn sàng lên thay bất cứ lúc nào).
> - **`PSYNC2` & `Replication Backlog` (Cuộn băng ghi âm chống chép lại từ đầu):** Nếu bộ đàm của Bếp phó bị nhiễu sóng mất tiếng 3 giây, Bếp phó chỉ cần tua nghe lại **cuộn băng ghi âm các thao tác gần nhất (`repl-backlog-size`)** để làm bù vài món bị thiếu (*Partial Resync*), thay vì phải đổ cả nồi súp đi chép lại từ con số 0 (*Full Resync*)!
> - **`Redis Sentinel` (Hội đồng 3 Trọng tài canh gác tự động):** Một nhóm **số lẻ `>= 3` tiến trình giám sát độc lập** liên tục hỏi thăm sức khỏe Bếp trưởng:
>   - 1 Trọng tài thấy im lặng -> mới là nghi ngờ cá nhân (**`SDOWN`** — *Subjectively Down*, biết đâu dây mạng của chính trọng tài đó bị lỏng?).
>   - **Đủ đa số `2/3` Trọng tài (`Quorum`)** cùng xác nhận Bếp trưởng bất tỉnh -> kết luận khách quan (**`ODOWN`** — *Objectively Down*) và lập tức ==tự động trao mũ Bếp trưởng mới cho người Bếp phó cập nhật đầy đủ nhất==, đồng thời báo địa chỉ mới cho toàn bộ ứng dụng!
> - **`Split-Brain` (Hiện tượng "Não chẻ đôi" — 2 Vua cùng tồn tại):** Khi đứt cáp mạng giữa hai phòng máy làm Bếp trưởng cũ bị cô lập nhưng chưa chết hẳn, dẫn tới 2 nơi cùng nhận đơn hàng gây mất dữ liệu lúc nối mạng lại.

```visual
kind: illustration
diagram: "redis:r14"
badge: "Replication & Sentinel HA · R14"
title: "Cơ chế Đồng bộ PSYNC2 (Replication Backlog) & Chu trình Failover của Cụm 3 Sentinel"
subtitle: "Cách thức Partial Resynchronization cứu mạng nội bộ và cách 3 Sentinel ngăn chặn thảm hoạ Split-Brain"
caption: "Ứng dụng dùng thư viện hỗ trợ Sentinel (redis-py / ioredis / go-redis) kết nối qua cổng 26379 để luôn tự động tìm ra địa chỉ Master hiện hành."
callouts:
  - num: 1
    label: "PSYNC2 & repl-backlog-size"
    desc: "Bộ đệm vòng lưu các byte lệnh gần nhất theo replicationId + offset; nếu quá nhỏ (mặc định 1MB) sẽ gây bão Full Resync khi chập chờn mạng."
    tone: cyan
  - num: 2
    label: "SDOWN -> ODOWN -> Raft Failover"
    desc: "1 Sentinel thấy quá hạn là SDOWN; đủ quorum=2 xác nhận là ODOWN; bầu Leader đạt đa số majority (2/3) mới thực thi REPLICAOF NO ONE."
    tone: amber
  - num: 3
    label: "Chống Split-Brain (min-replicas)"
    desc: "Cấu hình min-replicas-to-write 1 và min-replicas-max-lag 10 buộc Master cũ bị cô lập mạng tự khoá ghi sau 10 giây."
    tone: rose
```

## 1. Giải phẫu Cơ chế Sao chép `PSYNC2` & Cách chặn "Bão Full Resync"

Mặc định sao chép trong Redis là **bất đồng bộ (*Async Replication*)**: Master ghi xong vào RAM là trả lời `OK` ngay cho ứng dụng (`< 0.5ms`), rồi lập tức truyền dòng lệnh sang các Replica ở nền. Khi Replica kết nối lại sau sự cố mạng, có 2 kịch bản:

- [>] **Full Resynchronization (Rất tốn tài nguyên):** Khi kết nối lần đầu hoặc bị tụt quá xa, Master phải gọi `BGSAVE` đóng gói toàn bộ kho RAM gửi qua mạng cho Replica nạp lại từ đầu (trên mạng nội bộ nhanh, có thể bật `repl-diskless-sync yes` để truyền thẳng qua socket không qua đĩa).
- [>] **Partial Resynchronization (`PSYNC2` — Nhẹ nhàng trong chớp mắt):** Master giữ bộ đệm vòng **`repl-backlog-size`** trên RAM. Nếu vị trí đọc (`offset`) của Replica vẫn nằm trong cuộn băng này, Master chỉ gửi bù đúng vài MB lệnh bị lỡ!
- [!] **Cạm bẫy cấu hình mặc định:** Mặc định `repl-backlog-size` của Redis chỉ có **`1mb`**! Với hệ thống ghi `20MB/s`, chỉ chập chờn mạng `0.1 giây` là tràn bộ đệm `1mb`, bắt toàn bộ Replica phải chạy Full Resync! Trên Production, luôn nâng ==`repl-backlog-size` lên `64mb – 256mb`==.

## 2. Quy trình 4 Bước Tự động Chuyển đổi Dự phòng (Failover) của Cụm 3 Sentinel

Redis Sentinel chạy ở cổng mặc định **`26379`**, canh gác và thực hiện chuyển đổi dự phòng hoàn toàn tự động trong khoảng `6–12 giây`:

```visual
kind: flow
title: "4 Bước Chuyển Đổi Dự Phòng Tự Động (Automatic Failover) Của Cụm 3 Sentinel"
subtitle: "Toàn bộ quá trình từ lúc Master mất liên lạc tới lúc Replica lên ngôi diễn ra không cần con người can thiệp"
footer: "Khi Master cũ khởi động lại sau sự cố, Sentinel tự động chuyển nó thành Replica đi theo Master mới!"
steps:
  - icon: alert
    badge: "Bước 1 · SDOWN"
    title: "Nghi Ngờ Cá Nhân"
    desc: "Sentinel-1 gửi PING không thấy Master trả lời quá ngưỡng down-after-milliseconds (vd 5000ms)."
    code: "+sdown master mymaster"
    tone: amber
    edge: "hỏi ý kiến đồng đội"
  - icon: users
    badge: "Bước 2 · ODOWN"
    title: "Xác Nhận Đa Số"
    desc: "Đủ số lượng quorum Sentinel (vd 2/3 nút) cùng xác nhận Master đã mất liên lạc thực sự."
    code: "+odown master #quorum 2/2"
    tone: rose
    edge: "bầu Trưởng ban"
  - icon: award
    badge: "Bước 3 · Bầu Cử"
    title: "Chọn Bản Sao Tốt Nhất"
    desc: "Sentinel Leader (đạt >= N/2+1 phiếu) chọn Replica có dữ liệu mới nhất (offset cao nhất)."
    code: "+vote-for-leader ..."
    tone: cyan
    edge: "thăng cấp ngôi vương"
  - icon: rocket
    badge: "Bước 4 · Thăng Cấp"
    title: "REPLICAOF NO ONE"
    desc: "Phong Replica thắng cuộc lên làm Master mới và phát thông báo +switch-master cho mọi ứng dụng."
    code: "REPLICAOF NO ONE"
    tone: emerald
```

## 3. Khóa van chống mất dữ liệu Split-Brain & Kết nối từ Ứng dụng Thực tế

> [!WARNING] Làm sao ngăn chặn Master cũ bị cô lập mạng vẫn tiếp tục nhận đơn hàng rồi làm mất sạch?
> Nếu đường cáp mạng giữa hai khu vực bị đứt: phía bên kia `2/3` Sentinel đã phong `Replica-1` lên làm **Master Mới**, nhưng phía bên này một vài container ứng dụng vẫn nhìn thấy **Master Cũ** và tiếp tục ghi đơn hàng vào đó — tới khi nối mạng lại, Master Cũ bị giáng xuống làm Replica nên xóa sạch số đơn hàng vừa nhận!
> Cách khóa van an toàn trong `redis.conf` của Master: đặt ==`min-replicas-to-write 1` và `min-replicas-max-lag 10`== — nếu Master không thấy ít nhất 1 Replica phản hồi trong vòng 10 giây, nó sẽ **tự động khóa ghi (`NOREPLICAS`)** ngay lập tức để bảo vệ tính toàn vẹn!

```conf
# Cấu hình chống Split-Brain & tối ưu Backlog trên Master:
min-replicas-to-write 1
min-replicas-max-lag 10
repl-backlog-size 64mb
```

Khi viết code ứng dụng với **Sentinel**, bạn **không trỏ cứng IP của Master**, mà đưa danh sách 3 cổng Sentinel (`26379`) cho thư viện SDK tự động tìm Master hiện hành:

```python
# Python (redis-py): Tự động tìm Master (để Ghi) và Replica (để chia tải Đọc) qua Sentinel!
from redis.sentinel import Sentinel

sentinel = Sentinel(
    [("10.0.1.11", 26379), ("10.0.1.12", 26379), ("10.0.1.13", 26379)],
    socket_timeout=0.5,
)
master = sentinel.master_for("mymaster", decode_responses=True)
replica = sentinel.slave_for("mymaster", decode_responses=True)

master.set("order:501", "paid", ex=3600)
print(replica.get("order:501"))
```

> [!TIP] Thực tế trên Cloud: Tự dựng Sentinel hay dùng Managed HA (ElastiCache / Memorystore)?
> - Nếu bạn tự vận hành trên máy chủ Linux hoặc Kubernetes (**Bitnami Redis / Spotahome Redis Operator**), hiểu sâu **Sentinel + StatefulSet** là kỹ năng bắt buộc để xử lý sự cố.
> - Nếu chạy trên đám mây công cộng (**AWS ElastiCache for Valkey/Redis Multi-AZ**, **GCP Memorystore**, **Redis Cloud**, **Upstash**), nhà cung cấp đã bọc sẵn tầng phát hiện lỗi và tự động đổi DNS về Replica dự phòng bên dưới — nhưng bạn **vẫn cần hiểu nguyên lý bất đồng bộ và lệnh `WAIT 1 1000`** để biết rằng chuyển đổi dự phòng lúc sập phần cứng vẫn có thể trễ vài mili-giây dữ liệu cuối cùng!

## 4. Triển khai StatefulSet + Headless Service cho Redis HA trên Kubernetes

Trên Kubernetes, các nút cơ sở dữ liệu có trạng thái bắt buộc dùng **`StatefulSet`** kèm **Headless Service (`clusterIP: None`)** để mỗi nút giữ nguyên tên miền nội bộ cố định (`redis-ha-0`, `redis-ha-1`, `redis-ha-2`) và ổ đĩa riêng biệt:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: redis-ha-headless
spec:
  clusterIP: None
  selector:
    app: redis-ha
  ports:
    - name: redis
      port: 6379
      targetPort: 6379
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-ha
spec:
  serviceName: redis-ha-headless
  replicas: 3
  selector:
    matchLabels:
      app: redis-ha
  template:
    metadata:
      labels:
        app: redis-ha
    spec:
      containers:
        - name: redis
          image: redis:8.0-alpine
          ports:
            - containerPort: 6379
```

> [!REMEMBER] Ghi nhớ cốt lõi từ R14
> 1. Nâng **`repl-backlog-size` lên `64mb–256mb`** và giữ **`replica-read-only yes`** trên các Replica để tận dụng **PSYNC2 Partial Resync** êm ái.
> 2. Luôn triển khai ==số lẻ `>= 3` nút Sentinel== trên 3 máy chủ/vùng độc lập để đảm bảo bầu cử đa số không bị hòa phiếu.
> 3. Khống chế cửa sổ mất dữ liệu khi đứt cáp mạng (*Split-Brain*) bằng cặp cấu hình **`min-replicas-to-write 1`** + **`min-replicas-max-lag 10`**.

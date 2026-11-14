# Sao chép Bất đồng bộ (PSYNC2), Chống Split-Brain & Tự động Chuyển đổi Dự phòng với Sentinel HA

Bật RDB và Hybrid AOF ở bài trước cứu bạn khỏi **mất dữ liệu khi khởi động lại**, nhưng không cứu bạn khỏi **ngừng trệ dịch vụ (*Downtime*)**: nếu bo mạch chủ của máy chạy Redis cháy khét lúc 20h tối, bạn mất ít nhất 15–30 phút dựng máy mới và chép lại ổ đĩa! Để đạt cam kết sẵn sàng cao (**High Availability `99.99%`** — thời gian gián đoạn cả năm dưới 52 phút), Redis kết hợp hai trụ cột: **Sao chép Master–Replica (`PSYNC2`)** và **Hệ thống Giám sát Tự động Chuyển đổi Dự phòng (`Redis Sentinel`)**.

> [!ANALOGY] Ẩn dụ Bếp Trưởng, Hai Bếp Phó & Hội Đồng 3 Giám Khảo Độc Lập
> - **Master & Replicas:** Bếp trưởng (*Master*) đứng nấu chính và đọc to từng bước vào bộ đàm cho 2 Bếp phó (*Replicas*) làm theo y hệt trên bàn phụ. Nếu rớt sóng bộ đàm 3 giây, Bếp phó chỉ cần nhìn lại **cuộn băng ghi âm 5 phút gần nhất (`repl-backlog`)** để làm bù chứ không phải đổ hết nồi súp đi nấu lại từ đầu!
> - **3 Sentinels:** Nếu chỉ 1 Giám khảo thấy Bếp trưởng im lặng thì mới là nghi ngờ cá nhân (**`SDOWN`** — biết đâu chính tai nghe của vị giám khảo đó bị tuột dây?). Phải khi **tối thiểu 2/3 Giám khảo cùng xác nhận** Bếp trưởng bất tỉnh (**`ODOWN`**), hội đồng mới bầu ra 1 Trưởng ban đứng lên trao mũ Bếp trưởng cho người Bếp phó có sổ ghi chép đầy đủ nhất!

## 1. Giải phẫu Cơ chế Sao chép `PSYNC2` & Bão Full Resync

Mặc định sao chép trong Redis là **bất đồng bộ (*Asynchronous Replication*)**: Master ghi xong vào RAM là trả lời `OK` ngay cho ứng dụng, đồng thời đẩy luồng lệnh sang các Replica ở nền để giữ độ trễ dưới `0.5ms`. Hãy quan sát toàn bộ cấu trúc đồng bộ và bầu cử HA:

```visual
kind: illustration
diagram: "redis:r14"
badge: "Replication & Sentinel HA · R14"
title: "Cơ chế Đồng bộ PSYNC2 (Replication Backlog) & Chu trình Failover của Cụm 3 Sentinel"
subtitle: "Cách thức Partial Resynchronization cứu mạng nội bộ và cách 3 Sentinel ngăn chặn thảm hoạ Split-Brain"
caption: "Ứng dụng dùng thư viện hỗ trợ Sentinel (ioredis / go-redis) kết nối qua cổng 26379 để luôn tự động tìm ra địa chỉ Master hiện hành."
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

### Bí mật tránh "Bão Full Resync" trên Production

Khi Replica kết nối vào Master, có hai con đường đồng bộ:
- [>] **Full Resynchronization (Rất nặng):** Lần đầu kết nối hoặc khi lệch quá xa, Master phải gọi `BGSAVE` tạo ảnh RDB truyền toàn bộ qua mạng cho Replica nạp lại từ con số 0 (trên mạng 10Gbps truyền trực tiếp không qua đĩa bằng **`repl-diskless-sync yes`**).
- [>] **Partial Resynchronization (`PSYNC2` — Siêu nhẹ):** Master duy trì một bộ đệm vòng trên RAM gọi là **Replication Backlog** (`repl-backlog-size`). Nếu mạng chập chờn 5 giây rồi nối lại, Replica gửi `(replid, offset)` của nó lên; nếu `offset` đó vẫn còn nằm trong Backlog, Master chỉ bắn bù đúng vài MB lệnh bị thiếu!
- [!] **Cạm bẫy chết người:** Giá trị mặc định `repl-backlog-size` của Redis chỉ vỏn vẹn **`1mb`**! Với hệ thống ghi `20MB/s`, chỉ đứt mạng `0.1 giây` là tràn bộ đệm `1mb`, ép Replica phải **Full Resync** làm nổ RAM Copy-on-Write trên Master! Trên Production, luôn nâng **`repl-backlog-size 64mb` – `256mb`**.

## 2. Quy trình 4 Bước Tự động Chuyển đổi Dự phòng (Failover) của Redis Sentinel

Redis Sentinel là tiến trình độc lập (thường lắng nghe ở cổng **`26379`**) chuyên canh gác sức khoẻ các nút Redis, thông báo địa chỉ Master mới cho Client SDK và tự động điều phối Failover không cần con người can thiệp:

```visual
kind: flow
title: "4 Bước Chuyển Đổi Dự Phòng Tự Động (Automatic Failover) Của Cụm 3 Sentinel"
subtitle: "Toàn bộ quá trình từ lúc Master đứt mạng tới lúc Replica lên ngôi thường hoàn tất trong 6–12 giây"
footer: "Khi Master cũ sống dậy sau sự cố, Sentinel tự động giáng cấp nó thành Replica của Master mới (không gây tranh chấp quyền lực)!"
steps:
  - icon: alert
    badge: "Bước 1 · SDOWN"
    title: "Bất Tỉnh Chủ Quan"
    desc: "Sentinel-1 gửi PING không thấy Master trả lời quá ngưỡng down-after-milliseconds (vd 5000ms)."
    code: "+sdown master mymaster"
    tone: amber
    edge: "hỏi ý kiến đồng đội"
  - icon: users
    badge: "Bước 2 · ODOWN"
    title: "Bất Tỉnh Khách Quan"
    desc: "Đủ số lượng quorum Sentinel (vd 2/3 nút) cùng xác nhận Master đã không thể liên lạc."
    code: "+odown master #quorum 2/2"
    tone: rose
    edge: "bầu Leader Raft"
  - icon: award
    badge: "Bước 3 · Bầu Cử"
    title: "Chọn Ứng Viên Tốt Nhất"
    desc: "Sentinel Leader (thắng >= N/2+1 phiếu) chấm điểm các Replica theo: replica-priority -> offset mới nhất -> runid."
    code: "+vote-for-leader ..."
    tone: violet
    edge: "thăng cấp ngôi vương"
  - icon: rocket
    badge: "Bước 4 · Thăng Cấp"
    title: "REPLICAOF NO ONE"
    desc: "Phong Replica thắng cuộc lên Master mới, trỏ các Replica còn lại sang nó và phát sự kiện +switch-master cho Client."
    code: "REPLICAOF NO ONE"
    tone: emerald
```

## 3. Hoá giải Cơn Ác mộng "Não Chia Đôi" (*Split-Brain*) trong Mạng Phân vùng

> [!TRAP] Kịch bản Split-Brain làm mất sạch dữ liệu ghi mới diễn ra như thế nào?
> Giả sử cụm của bạn trải trên 2 phòng máy (AZ-1 chứa `Master` + `Sentinel-1` + một số Pod API cũ; AZ-2 chứa `Replica-1`, `Replica-2`, `Sentinel-2`, `Sentinel-3`). Đường cáp quang giữa AZ-1 và AZ-2 bị đứt!
> - Bên AZ-2 có `2/3` Sentinel nên hợp lệ phong `Replica-1` lên làm **Master Mới**.
> - Nhưng bên AZ-1, **Master Cũ chưa hề chết** — các Pod API kẹt cùng AZ-1 vẫn hồn nhiên ghi đơn hàng vào Master Cũ!
> - 5 phút sau cáp quang nối lại: Sentinel giáng cấp Master Cũ thành Replica của Master Mới → **Master Cũ xoá trắng toàn bộ dữ liệu để đồng bộ theo Master Mới, làm bay màu toàn bộ 5 phút đơn hàng vừa nhận ở AZ-1!**

Cách khóa van giảm thiểu tối đa thiệt hại Split-Brain ngay trong `redis.conf` của Master:

```conf
# Bắt buộc có ít nhất 1 Replica đang kết nối khoẻ mạnh với độ trễ <= 10 giây
# Nếu Master bị cô lập khỏi toàn bộ các Replica quá 10s -> Tự động TỪ CHỐI GHI (NOREPLICAS)!
min-replicas-to-write 1
min-replicas-max-lag 10
```

Ngoài ra, với những giao dịch cực kỳ nhạy cảm, ứng dụng có thể gọi lệnh **`WAIT 1 1000`** ngay sau lệnh `SET`: bắt kết nối hiện tại chờ cho tới khi **ít nhất `1` Replica xác nhận đã nhận xong dữ liệu** (hoặc quá hạn `1000ms`) rồi mới trả kết quả cho người dùng!

## 4. Triển khai StatefulSet + Headless Service cho Redis HA trên Kubernetes

Khác với ứng dụng Web phi trạng thái dùng `Deployment` (tên Pod ngẫu nhiên đổi liên tục kiểu `web-7f8b9-x2k`), các nút Redis HA bắt buộc phải triển khai bằng **`StatefulSet`** đi kèm **Headless Service (`clusterIP: None`)** để mỗi nút giữ nguyên danh tính DNS cố định (`redis-ha-0.redis-ha-headless`, `redis-ha-1.redis-ha-headless`...) và gắn riêng ổ đĩa `PVC` không bị tráo lẫn khi khởi động lại:

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
> 1. **Tăng `repl-backlog-size` lên `64mb–256mb`** và bật **`replica-read-only yes`** trên mọi Replica để tránh bão Full Resync và tránh ghi nhầm làm lệch dữ liệu bản sao.
> 2. **Luôn triển khai số lẻ `>= 3` Sentinel** trên 3 vùng lỗi độc lập: phân biệt rõ **`quorum`** (cần để xác nhận `ODOWN`) và **`majority = N/2 + 1`** (cần để bầu Leader thực thi Failover).
> 3. **Chống Split-Brain trên Master** bằng cặp lá chắn **`min-replicas-to-write 1`** + **`min-replicas-max-lag 10`** để Master bị cô lập mạng tự khoá ghi sau 10 giây.

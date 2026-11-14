# Giải phẫu Bộ nhớ jemalloc, 8 Chính sách Eviction (LRU vs LFU) & Quy tắc 65% Headroom trên K8s

Trong thế giới cơ sở dữ liệu trên đĩa cứng (PostgreSQL, MySQL), cạn bộ nhớ đệm chỉ làm truy vấn chậm đi đôi chút. Trong thế giới **In-Memory của Redis**, chạm trần bộ nhớ mà cấu hình sai đồng nghĩa với **sập toàn bộ tầng ghi (`OOM command not allowed`)** hoặc bị **Linux Kernel bắn chết ngay lập tức (`OOMKilled - Exit Code 137`)**! Hiểu tường tận cách trình cấp phát **`jemalloc`** vận hành, lý do thuật toán **LFU vượt trội LRU** và công thức **65% Headroom** là ranh giới phân định người chỉ biết gõ `SET/GET` với một Kỹ sư Hạ tầng thực thụ.

> [!ANALOGY] Ẩn dụ Tủ Sách Quán Cà Phê Giới Hạn 100 Cuốn
> Quán cà phê chỉ có 1 kệ chứa tối đa **100 cuốn sách** (`maxmemory`). Khi có cuốn thứ 101 mới mua về:
> - **`noeviction`:** Chủ quán lắc đầu từ chối nhận sách mới! (Hợp làm Két sắt giữ đơn hàng/queue, cấm vứt bừa).
> - **`allkeys-lru` (Least Recently Used):** Vứt cuốn **lâu ngày nhất chưa ai chạm vào** — nhưng nếu hôm qua có một vị khách tò mò lật lướt qua toàn bộ 100 cuốn truyện cổ ít ai đọc (*Cache Pollution*), những cuốn Best-seller vừa nghỉ 5 phút lại bị vứt nhầm!
> - **`allkeys-lfu` (Least Frequently Used):** Vứt cuốn có **tổng tần suất được đọc thấp nhất** — bảo vệ tuyệt đối những cuốn Best-seller thực sự được khách tìm đọc hàng trăm lần mỗi ngày!

## 1. Kiến trúc Bộ nhớ Bên trong Tiến trình Redis & Chỉ số Phân mảnh

Không phải cứ bạn lưu `2GB` dữ liệu chuỗi là tiến trình `redis-server` chỉ tiêu tốn đúng `2GB` RAM của hệ điều hành! Hãy giải phẫu 4 vùng tiêu thụ bộ nhớ và cơ chế lấy mẫu trục xuất của Redis:

```visual
kind: illustration
diagram: "redis:r12"
badge: "Memory & Eviction Internals · R12"
title: "Giải phẫu Không gian RAM jemalloc, 24-bit redisObject & Luồng Trục xuất"
subtitle: "Sự chênh lệch giữa used_memory và used_memory_rss cùng thuật toán lấy mẫu xấp xỉ Approximated LFU"
caption: "Redis không dùng danh sách liên kết đôi tốn 16-24 bytes/khoá cho LRU mà nhúng khéo léo dấu thời gian/tần suất vào đúng 24 bit sẵn có của header redisObject!"
callouts:
  - num: 1
    label: "used_memory vs used_memory_rss"
    desc: "used_memory là byte logic do jemalloc cấp; used_memory_rss là trang RAM vật lý Linux thực giữ (tính cả phân mảnh và trang Copy-on-Write)."
    tone: cyan
  - num: 2
    label: "Approximated LFU (Morris Counter)"
    desc: "Lấy mẫu ngẫu nhiên maxmemory-samples=10 khoá, dùng 8 bit đếm xác suất logarit (đo tới ~1 triệu lượt truy cập) và 16 bit giảm dần theo phút."
    tone: emerald
  - num: 3
    label: "65% K8s Pod Headroom"
    desc: "Luôn đặt maxmemory khoảng 65%-70% giới hạn RAM của Container để chừa 30%-35% khoảng thở cho BGSAVE fork COW, Output Buffer và jemalloc."
    tone: amber
```

### Đọc vị `mem_fragmentation_ratio` trong `INFO memory`

Tỷ số `mem_fragmentation_ratio = used_memory_rss / used_memory` là nhịp tim sức khoẻ RAM mà mọi SRE đều cài cảnh báo Prometheus:

- [>] **`1.0` – `1.4` (Lý tưởng):** `jemalloc` chia ô nhớ khít khao, độ hao hụt tự nhiên thấp.
- [>] **`> 1.5` (Phân mảnh cao):** Thường xảy ra sau khi bạn vừa xoá hàng vạn khoá kích thước nhỏ xen kẽ các khoá lớn khiến các trang nhớ `jemalloc` lỗ chỗ như phô mai Thuỵ Sĩ không trả về cho OS được. **Thuốc đặc trị:** Bật dọn phân mảnh chủ động trực tuyến **`activedefrag yes`** trên Redis!
- [!] **`< 1.0` (BÁO ĐỘNG ĐỎ — Đang tràn sang ổ cứng Swap!):** Khi `used_memory_rss` nhỏ hơn cả `used_memory`, nghĩa là máy chủ đã cạn sạch RAM vật lý và Linux đang đẩy từng trang nhớ của Redis xuống ổ cứng **Swap**! Độ trễ từ `0.2ms` sẽ nổ tung lên `500ms` — phải ngắt Swap (`vm.swappiness=0` / tắt swap trên K8s) và mở rộng RAM ngay lập tức!

## 2. Ma trận 8 Chính sách Trục xuất (`maxmemory-policy`) & Lý do LFU lên ngôi

Khi `used_memory` chạm ngưỡng `maxmemory`, Redis tra cứu chỉ thị `maxmemory-policy` để quyết định số phận câu lệnh ghi tiếp theo:

```visual
kind: groups
title: "Phân Nhóm 8 Chính Sách maxmemory-policy Trong Redis 8"
subtitle: "Chọn sai 1 dòng cấu hình có thể làm bay màu giỏ hàng hoặc làm nghẽn cứng cổng thanh toán"
columns: 2
items:
  - num: 1
    title: "Nhóm allkeys-* (Quét toàn bộ khoá)"
    badge: "Chuẩn Pure Cache"
    tone: emerald
    desc: "Cho phép Redis thu hồi bất kỳ khoá nào (kể cả khoá lập trình viên lỡ quên đặt EXPIRE)."
    bullets:
      - "**`allkeys-lfu` (Khuyên dùng số 1 cho Cache):** Giữ lại các khoá có tần suất truy cập thực tế cao nhất, chống ô nhiễm cache khi có luồng quét hàng loạt."
      - "**`allkeys-lru`:** Thu hồi khoá có thời gian nhàn rỗi (`IDLETIME`) lâu nhất trong tập lấy mẫu."
      - "**`allkeys-random`:** Xoá ngẫu nhiên khi mọi khoá có xác suất đọc ngang nhau."
    code: |
      maxmemory 2gb
      maxmemory-policy allkeys-lfu
      maxmemory-samples 10
    codeLang: redis-conf
  - num: 2
    title: "Nhóm noeviction (Cấm xoá tuyệt đối)"
    badge: "Chuẩn Queue / Stream / Lock"
    tone: rose
    desc: "Mặc định gốc của Redis: bảo toàn 100% dữ liệu, trả lỗi OOM cho lệnh ghi mới khi đầy RAM."
    bullets:
      - "**Bắt buộc dùng** khi Redis đóng vai trò Message Broker (`Streams`), Distributed Lock, Rate Limiter hoặc Session tiền tệ chưa lưu xuống DB."
      - "Lệnh đọc (`GET`, `XREADGROUP`) và lệnh xoá (`DEL`, `UNLINK`) vẫn hoạt động bình thường để bạn giải cứu."
    code: |
      maxmemory 4gb
      maxmemory-policy noeviction
    codeLang: redis-conf
  - num: 3
    title: "Nhóm volatile-* (Chỉ xoá khoá có TTL)"
    badge: "Hybrid Instance"
    tone: amber
    desc: "Chỉ thu hồi các khoá có đặt thời hạn hết hạn (EXPIRE), giữ bất khả xâm phạm các khoá persistent (TTL = -1)."
    bullets:
      - "Gồm **`volatile-lfu`**, **`volatile-lru`**, **`volatile-ttl`** (ưu tiên xoá khoá sắp hết hạn nhất) và **`volatile-random`**."
      - "**Cạm bẫy:** Nếu không còn khoá nào mang TTL để xoá, nhóm `volatile-*` tự động cư xử giống hệt `noeviction` (văng lỗi OOM)!"
    code: |
      # Tách riêng cụm Cache và cụm Durable tốt hơn dùng chung volatile-*!
      maxmemory-policy volatile-lfu
    codeLang: redis-conf
  - num: 4
    title: "Bộ 3 Cờ Giải phóng Nền (Lazyfree)"
    badge: "Chống gai Latency P99"
    tone: violet
    desc: "Chuyển tác vụ thu hồi vùng nhớ từ luồng chính sang luồng nền bio_lazy_free."
    bullets:
      - "`lazyfree-lazy-eviction yes`: Không chặn luồng chính khi trục xuất khoá lúc đầy RAM."
      - "`lazyfree-lazy-expire yes`: Không chặn luồng chính khi khoá lớn tự hết hạn TTL."
      - "`lazyfree-lazy-server-del yes`: Không chặn luồng chính khi lệnh `SET` ghi đè lên một khoá cũ khổng lồ!"
    code: |
      lazyfree-lazy-eviction yes
      lazyfree-lazy-expire yes
      lazyfree-lazy-server-del yes
    codeLang: redis-conf
```

> [!TIP] Bí mật kỹ thuật tinh xảo: Làm sao Redis đo tần suất LFU tới hàng triệu lượt chỉ bằng... 8 bit?
> Mỗi khoá trong Redis đều có cấu trúc đầu mục `redisObject` chứa đúng **24 bit trường `lru`**. Ở chế độ LFU, Salvatore Sanfilippo chia 24 bit này thành: **16 bit cao** lưu dấu thời gian theo phút để giảm dần độ nóng khi khoá ngừng được gọi (`lfu-decay-time`), và **8 bit thấp** (`0..255`) chạy thuật toán **Bộ đếm xác suất logarit Morris Counter** (`lfu-log-factor 10`)! Khoá mới tạo bắt đầu ở mức `freq = 5` (để không bị trục xuất oan ngay mili-giây chào đời). Càng lên cao, xác suất tăng thêm `1` đơn vị càng khó theo hàm mũ — bạn có thể kiểm tra trực tiếp bằng lệnh `OBJECT FREQ <key>` (ở chế độ LFU) hoặc `OBJECT IDLETIME <key>` (ở chế độ LRU)!

## 3. Quy tắc Sống còn trên Kubernetes: Trần `maxmemory` = 65%–70% Pod Memory Limit

Rất nhiều đội DevOps cấu hình Container K8s `resources.limits.memory: 4Gi` rồi hồn nhiên đặt luôn `maxmemory 4gb` trong `redis.conf` — và rồi cứ 3 giờ sáng lúc `BGSAVE` chụp ảnh nền, Pod Redis lại nổ tung với **`OOMKilled (Exit Code 137)`**!

```yaml
# Cấu hình chuẩn Production cho Pod Redis trên Kubernetes (Tuân thủ 65%-70% Headroom)
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cache
spec:
  serviceName: redis-cache-headless
  replicas: 1
  selector:
    matchLabels:
      app: redis-cache
  template:
    metadata:
      labels:
        app: redis-cache
    spec:
      containers:
        - name: redis
          image: redis:8.0-alpine
          args:
            - "--maxmemory"
            - "2688mb"              # ~65% của 4096Mi -> Chừa 1.4GiB đệm an toàn!
            - "--maxmemory-policy"
            - "allkeys-lfu"
            - "--lazyfree-lazy-eviction"
            - "yes"
          ports:
            - containerPort: 6379
          resources:
            requests:
              cpu: "500m"
              memory: 4Gi           # Guaranteed QoS cho RAM (requests == limits)
            limits:
              memory: 4Gi
```

**Tại sao bắt buộc phải chừa 30%–35% khoảng thở (*Headroom*) bên trên `maxmemory`?**
1. **Trang nhớ Copy-on-Write (`fork()`) khi chạy `BGSAVE` / `BGREWRITEAOF`:** Trong lúc tiến trình con ghi RDB ra đĩa, các trang bộ nhớ bị luồng ghi mới sửa đổi sẽ được nhân bản trên RAM vật lý.
2. **Client & Replication Output Buffers:** Bộ đệm đầu ra chứa dữ liệu trả về cho hàng ngàn kết nối khách hàng và luồng đồng bộ sang Replica (`client-output-buffer-limit`) nằm ngoài hạn ngạch trục xuất khoá hoặc cần biên độ co giãn tức thời.
3. **Chi phí quản trị & phân mảnh của `jemalloc`:** Độ chênh `used_memory_rss - used_memory` (thường `10%–20%`).

> [!REMEMBER] Ghi nhớ cốt lõi từ R12
> 1. **Tách bạch vai trò:** Cụm **Pure Cache** luôn đặt `maxmemory` rõ ràng kèm **`allkeys-lfu`** + `maxmemory-samples 10`. Cụm **Queue / Stream / Lock** bắt buộc đặt **`noeviction`** và giám sát chặt ngưỡng 80% RAM.
> 2. **Bật đủ bộ 3 `lazyfree-*` (`eviction`, `expire`, `server-del`)** để việc giải phóng khoá lớn không bao giờ làm đơ Event Loop đơn luồng.
> 3. **Quy tắc 65%–70% Headroom trên Docker/K8s:** Với Pod giới hạn `4Gi` (`4096Mi`), chỉ cấp `maxmemory` khoảng `2.6GB–2.8GB` và đặt `requests.memory == limits.memory` để bảo vệ Redis khỏi cgroup OOMKiller.

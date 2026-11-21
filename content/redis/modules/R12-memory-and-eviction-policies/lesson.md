# Giải phẫu Bộ nhớ jemalloc, 8 Chính sách Eviction (LRU vs LFU) & Quy tắc 65% Headroom trên K8s

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Với cơ sở dữ liệu trên ổ cứng (như PostgreSQL), thiếu RAM thì máy chạy chậm đi một chút. Nhưng với **Redis sống hoàn toàn trên RAM**, khi bộ nhớ chạm trần giới hạn (`maxmemory`) mà cấu hình sai, hệ thống sẽ ngay lập tức **từ chối mọi lệnh ghi mới (`OOM command not allowed`)** hoặc bị nhân hệ điều hành Linux **cắt cầu dao giết chết tiến trình (`OOMKilled - Exit Code 137`)**! Để vận hành Redis êm ru suốt nhiều năm, hãy nắm rõ 4 khái niệm cốt lõi sau:
> - **`jemalloc` (Trình quản lý chia ô nhớ):** Giống người thủ kho thông minh bên dưới Redis, chuyên cắt các dải RAM thành từng khay vừa vặn (`8B`, `16B`, `32B`...) để hạn chế tối đa khoảng trống lãng phí (*phân mảnh bộ nhớ — Memory Fragmentation*).
> - **`Eviction` (Cơ chế đào thải tự động khi đầy kệ):** Khi tủ sách `maxmemory` chỉ chứa được 100 cuốn mà bạn cất cuốn thứ 101 vào, Redis phải chọn: từ chối nhận thêm (`noeviction`) hay tự động vứt bớt 1 cuốn cũ đi để nhường chỗ?
> - **`LRU` (*Least Recently Used*) vs `LFU` (*Least Frequently Used*):**
>   - **`LRU`** vứt cuốn sách **lâu ngày nhất chưa ai chạm tới** — nhược điểm là nếu hôm qua có 1 người tò mò lật lướt qua 100 cuốn sách cũ ít ai đọc, các cuốn Best-seller vừa nghỉ ngơi 5 phút lại bị vứt nhầm!
>   - **`LFU`** vứt cuốn sách có **tổng tần suất được mượn đọc thấp nhất** — ==bảo vệ tuyệt đối những khóa "nóng" thực sự được khách hàng truy cập hàng trăm lần mỗi ngày==!
> - **`Headroom` (Khoảng thở RAM dự phòng 30%–35%):** Trên Docker/Kubernetes, nếu container được cấp tối đa `4 GB` RAM, bạn chỉ được đặt `maxmemory` cho dữ liệu Redis khoảng **`2.6 GB` (`65%`)**; `35%` còn lại là phao cứu sinh dành cho bộ đệm kết nối mạng và quá trình chụp ảnh sao lưu nền!

```visual
kind: illustration
diagram: "redis:r12"
badge: "Memory & Eviction Internals · R12"
title: "Giải phẫu Không gian RAM jemalloc, 24-bit redisObject & Luồng Giải phóng (Eviction)"
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

## 1. Đọc vị sức khỏe RAM qua `INFO memory` & Chỉ số Phân mảnh

Không phải cứ bạn lưu `2GB` chuỗi dữ liệu là tiến trình `redis-server` chỉ tiêu tốn đúng `2GB` RAM vật lý! Tỷ số **`mem_fragmentation_ratio = used_memory_rss / used_memory`** trong lệnh `INFO memory` là chiếc nhiệt kế sức khỏe RAM mà mọi kỹ sư đều phải biết đọc:

- [>] **`1.0` – `1.4` (Khỏe mạnh lý tưởng):** `jemalloc` sắp xếp các ô nhớ khít khao, độ hao hụt tự nhiên thấp.
- [>] **`> 1.5` (Phân mảnh bộ nhớ cao):** Thường xuất hiện sau khi xóa hàng vạn khóa nhỏ xen kẽ các khóa lớn khiến các trang nhớ lỗ chỗ như miếng phô mai, chưa trả lại cho hệ điều hành được. **Cách xử lý êm ái:** Bật tính năng chống phân mảnh tự động trực tuyến **`activedefrag yes`**!
- [!] **`< 1.0` (BÁO ĐỘNG ĐỎ — Đang tràn xuống ổ cứng Swap!):** Khi RAM vật lý thực giữ (`rss`) nhỏ hơn cả dữ liệu Redis đang quản lý, nghĩa là máy chủ đã cạn sạch RAM và hệ điều hành đang đẩy bộ nhớ của Redis xuống ổ cứng **Swap**! Độ trễ từ `0.2ms` sẽ vọt lên `500ms` — cần tắt Swap (`vm.swappiness=0`) và bổ sung RAM ngay lập tức!

## 2. So sánh 8 chính sách Đào thải (`maxmemory-policy`): Chọn đúng cho từng vai trò

Khi `used_memory` chạm ngưỡng `maxmemory`, Redis dựa vào cấu hình `maxmemory-policy` để quyết định xử lý lệnh ghi mới:

```visual
kind: groups
title: "Phân Nhóm 8 Chính Sách maxmemory-policy Trong Redis 8"
subtitle: "Chọn sai 1 dòng cấu hình có thể làm bay màu đơn hàng trong hàng đợi hoặc làm nghẽn cứng API!"
columns: 2
items:
  - num: 1
    title: "Nhóm allkeys-* (Đào thải trên toàn bộ khoá)"
    badge: "Chuẩn Pure Cache"
    tone: emerald
    desc: "Cho phép Redis thu hồi bất kỳ khoá nào ít giá trị nhất (kể cả khoá lỡ quên đặt EXPIRE)."
    bullets:
      - "==`allkeys-lfu` (Khuyên dùng số 1 cho Cache)==: Giữ lại các khoá có tần suất truy cập thực tế cao nhất, chống ô nhiễm cache khi có tác vụ quét hàng loạt."
      - "**`allkeys-lru`:** Đào thải khoá lâu chưa được chạm vào nhất trong tập lấy mẫu."
      - "**`allkeys-random`:** Xoá ngẫu nhiên khi mọi khoá có tần suất đọc ngang nhau."
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
      - "**Bắt buộc dùng** khi Redis đóng vai trò Hàng đợi (`Streams` / `BullMQ` / `Celery`), Khoá phân tán (`Lock`), hoặc trạng thái phiên thanh toán."
      - "Các lệnh đọc (`GET`, `XREADGROUP`) và lệnh xoá (`DEL`, `UNLINK`) vẫn chạy bình thường để bạn giải phóng chỗ."
    code: |
      maxmemory 4gb
      maxmemory-policy noeviction
    codeLang: redis-conf
  - num: 3
    title: "Nhóm volatile-* (Chỉ xoá khoá có gắn TTL)"
    badge: "Dùng chung hỗn hợp"
    tone: amber
    desc: "Chỉ thu hồi các khoá có đặt thời hạn sống (EXPIRE), giữ nguyên các khoá vĩnh viễn (TTL = -1)."
    bullets:
      - "Gồm **`volatile-lfu`**, **`volatile-lru`**, **`volatile-ttl`** (ưu tiên xoá khoá sắp hết hạn nhất) và **`volatile-random`**."
      - "**Lưu ý:** Nếu trong RAM không còn khoá nào có gắn TTL để xoá, nhóm `volatile-*` sẽ báo lỗi OOM y hệt `noeviction`! Tốt nhất nên tách riêng máy chủ Cache và máy chủ Queue."
    code: |
      maxmemory-policy volatile-lfu
    codeLang: redis-conf
  - num: 4
    title: "Bộ 3 Cờ Giải phóng Nền (Lazyfree)"
    badge: "Chống giật độ trễ P99"
    tone: cyan
    desc: "Chuyển việc thu hồi vùng nhớ nặng nhọc từ luồng chính sang luồng nền bio_lazy_free."
    bullets:
      - "`lazyfree-lazy-eviction yes`: Không chặn luồng chính khi đào thải khoá lúc đầy RAM."
      - "`lazyfree-lazy-expire yes`: Không chặn luồng chính khi khoá lớn hết hạn TTL."
      - "`lazyfree-lazy-server-del yes`: Không chặn luồng chính khi lệnh `SET` ghi đè lên một khoá cũ khổng lồ!"
    code: |
      lazyfree-lazy-eviction yes
      lazyfree-lazy-expire yes
      lazyfree-lazy-server-del yes
    codeLang: redis-conf
```

> [!TIP] Bí mật thú vị: Làm sao Redis đếm tần suất LFU tới hàng triệu lượt mà chỉ tốn... 8 bit?
> Thay vì tốn thêm hàng chục byte cho mỗi khóa, Redis tận dụng khéo léo **24 bit có sẵn** trong đầu mục quản lý mỗi khóa: **16 bit đầu** lưu mốc thời gian theo phút để giảm dần độ "nóng" nếu khóa ngừng được đọc (`lfu-decay-time`), còn **8 bit cuối** (`0..255`) chạy **bộ đếm xác suất logarit (Morris Counter)**! Khóa mới tạo khởi đầu ở mức `5` để không bị đào thải oan ngay lúc vừa sinh ra. Bạn có thể tự soi độ nóng của khóa bằng lệnh `OBJECT FREQ <key>` (khi bật LFU) hoặc thời gian nhàn rỗi bằng `OBJECT IDLETIME <key>` (khi bật LRU)!

## 3. Quy tắc sống còn trên Docker/Kubernetes: Đặt `maxmemory` = 65%–70% giới hạn Container

Một sai lầm rất phổ biến khi triển khai container là cấp cho Pod Kubernetes `limits.memory: 4Gi` rồi đặt luôn `maxmemory 4gb` trong `redis.conf` — dẫn tới cứ đêm khuya lúc Redis chạy sao lưu nền là Pod bị giết đột ngột với lỗi ==`OOMKilled (Exit Code 137)`==!

```yaml
# Cấu hình chuẩn Production cho Pod Redis trên Kubernetes (Chừa 35% khoảng thở Headroom)
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
            - "2688mb"              # ~65% của 4096Mi -> Chừa ~1.4GiB đệm an toàn!
            - "--maxmemory-policy"
            - "allkeys-lfu"
            - "--lazyfree-lazy-eviction"
            - "yes"
          ports:
            - containerPort: 6379
          resources:
            requests:
              cpu: "500m"
              memory: 4Gi           # Đặt requests == limits để đạt mức ưu tiên Guaranteed QoS!
            limits:
              memory: 4Gi
```

**Ba lý do bắt buộc phải dành ra 30%–35% khoảng trống RAM bên trên `maxmemory`:**
1. **Bộ nhớ nhân bản tạm thời (*Copy-on-Write*) khi chụp ảnh đĩa (`BGSAVE`):** Sẽ phân tích chi tiết ở bài `R13` ngay kế tiếp.
2. **Bộ đệm đầu ra cho khách hàng & bản sao (*Output & Replication Buffers*):** Chứa dữ liệu đang xếp hàng gửi qua mạng cho hàng ngàn kết nối.
3. **Chi phí quản lý & phân mảnh tự nhiên của `jemalloc`** (`10%–20%`).

> [!REMEMBER] Ghi nhớ cốt lõi từ R12
> 1. **Phân vai rõ ràng:** Cụm **Pure Cache** chọn **`allkeys-lfu`** + `maxmemory-samples 10`; cụm **Queue / Stream / Lock** bắt buộc giữ **`noeviction`**.
> 2. Luôn bật đủ bộ 3 ==`lazyfree-lazy-eviction`, `lazyfree-lazy-expire`, `lazyfree-lazy-server-del`== để tránh giật cục khi thu hồi khóa lớn.
> 3. **Quy tắc 65%–70% Headroom:** Với container giới hạn `4Gi`, chỉ đặt `maxmemory` khoảng `2.6GB–2.8GB` và gán `requests.memory == limits.memory`.

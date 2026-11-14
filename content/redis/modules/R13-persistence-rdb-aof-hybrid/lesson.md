# Lưu trữ Bền vững: RDB Snapshot, Copy-on-Write, Multi-Part AOF & Hybrid Preamble

Một định kiến sai lầm rất phổ biến là *"Redis lưu trên RAM nên cúp điện là bay sạch dữ liệu"*. Thực tế, Redis cung cấp một tầng **Lưu trữ Bền vững (*Persistence*)** cực kỳ tinh vi xuống ổ cứng NVMe/SSD, cho phép bạn tuỳ chọn linh hoạt trên dải quang phổ từ **Pure Ephemeral Cache** (không chạm đĩa một byte nào) cho tới **Durable Store** (mất điện đột ngột chỉ mất tối đa `< 1 giây` dữ liệu và nạp lại `20GB` chỉ trong vài giây lúc bật máy!).

> [!ANALOGY] Ẩn dụ Chụp Ảnh Toàn Cảnh Kho Hàng vs. Ghi Nhật Ký Xuất Nhập Từng Dòng
> - **RDB (*Redis Database Snapshot*):** Cứ mỗi 15 phút, thủ kho bấm máy ảnh chụp 1 tấm hình nén siêu gọn toàn bộ các kệ hàng tại đúng khoảnh khắc đó (`dump.rdb`). Khôi phục cực nhanh, gửi đi sao lưu S3 cực nhẹ, nhưng nếu cháy kho ở phút thứ 14 thì mất 14 phút thay đổi!
> - **AOF (*Append-Only File*):** Cuốn sổ nhật ký ghi nối đuôi từng thao tác một (`SET a 1`, `INCR a`...). An toàn tới từng giây, nhưng ghi suốt 1 tháng cuốn sổ dày cộp 50GB — nếu khởi động lại mà ngồi đọc diễn lại từ trang 1 thì mất cả buổi sáng!
> - **Hybrid RDB + AOF Preamble (Chuẩn Redis 7+/8):** Định kỳ kẹp **tấm ảnh chụp RDB ở trang đầu cuốn sổ**, và chỉ ghi nối đuôi các dòng AOF mới phát sinh sau tấm ảnh đó!

## 1. Giải phẫu Cơ chế `fork()` Copy-on-Write & Hybrid Persistence

Làm thế nào Redis có thể kết xuất một tệp ảnh chụp `16GB` dữ liệu tại đúng một thời điểm cố định (*Point-in-Time Snapshot*) ra đĩa cứng suốt 20 giây liền mà **luồng chính vẫn tiếp tục phục vụ `80.000` lệnh đọc/ghi mỗi giây không hề bị chặn**? Câu trả lời nằm ở tuyệt kỹ **`fork()` + Copy-on-Write (COW)** của nhân Linux:

```visual
kind: illustration
src: "/illustrations/redis/redis-rdb-aof-persistence.jpg"
diagram: "redis:r13"
alt: "Cơ chế lưu trữ bền vững RDB Copy-on-Write kết hợp nhật ký AOF Hybrid trong Redis 8"
badge: "Persistence Internals · R13"
title: "Giải phẫu Luồng BGSAVE Copy-on-Write & Cấu trúc Multi-Part Hybrid AOF"
subtitle: "Cách tiến trình con dùng chung bảng trang bộ nhớ ảo (Page Table) với tiến trình cha và cấu trúc RDB Preamble + AOF Tail"
caption: "Trên Redis 7.0+ và Redis 8, tệp AOF được tách thành thư mục appendonlydir gồm tệp gốc (base RDB), tệp tăng trưởng (incr AOF) và tệp manifest quản lý nguyên tử."
callouts:
  - num: 1
    label: "BGSAVE & OS fork() Copy-on-Write"
    desc: "Tiến trình cha chỉ nhân bản bảng Page Table (vài mili-giây); trang RAM 4KB chỉ bị copy thực sự khi có lệnh ghi mới sửa đúng trang đó."
    tone: cyan
  - num: 2
    label: "AOF appendfsync everysec"
    desc: "Ghi nối đuôi vào Page Cache của OS và gọi fsync() xuống đĩa mỗi 1 giây ở luồng nền bio_aof_fsync — cân bằng vàng giữa tốc độ và RPO <= 1s."
    tone: amber
  - num: 3
    label: "Hybrid RDB Preamble (Multi-Part AOF)"
    desc: "Khi chạy BGREWRITEAOF, phần nền được nén thành định dạng nhị phân RDB gọn nhẹ, theo sau là luồng lệnh AOF mới nhất — khởi động nhanh gấp 5-10 lần!"
    tone: emerald
```

### Cảnh báo sinh tử: `BGSAVE` vs. `SAVE`

- [+] **`BGSAVE` (Background Save — Luôn dùng trên Production):** Gọi lời gọi hệ thống `fork()` sinh tiến trình con `redis-rdb-bgsave` âm thầm ghi tệp tạm rồi đổi tên nguyên tử (`rename`) đè lên `dump.rdb`.
- [!] **`SAVE` (Synchronous Save — CẤM TUYỆT ĐỐI trên Production):** Chạy thẳng trên luồng chính, khoá cứng 100% khách hàng cho tới khi ghi xong đĩa! Trong thực tế, các SRE thường vô hiệu hoá luôn lệnh `SAVE` bằng ACL hoặc `rename-command`.

## 2. Đối chiếu Ba Chế độ Đồng bộ Đĩa `appendfsync` của AOF

Khi bạn gõ `SET order:99 paid` và bật `appendonly yes`, Redis tuần tự hoá câu lệnh sang định dạng RESP rồi gọi `write()` đẩy vào **OS Kernel Page Cache** (vẫn nằm trên RAM của hệ điều hành). Bước quyết định dữ liệu đã thực sự khắc lên chip nhớ NVMe hay chưa nằm ở lời gọi **`fsync()`**:

```visual
kind: compare
title: "Cạm Bẫy Đốt Cháy IOPS Đĩa (appendfsync always) vs Điểm Cân Bằng Vàng (everysec)"
subtitle: "Hiểu rõ ranh giới giữa lệnh write() vào bộ đệm Kernel và lệnh fsync() ép ghi vật lý xuống SSD"
left:
  badge: "SÁT THỦ THÔNG LƯỢNG"
  title: "appendfsync always (Ép đĩa từng lệnh)"
  tone: rose
  code: |
    appendonly yes
    # Mỗi lệnh ghi (hoặc mỗi micro-batch pipeline) đều phải
    # chờ ổ đĩa vật lý xoay/ghi xong mới trả OK cho Client!
    appendfsync always
  lang: redis-conf
  bullets:
    - "**Thông lượng sụp đổ 50–100 lần:** Kéo hiệu năng Redis từ `90.000 ops/s` tụt xuống ngang tốc độ IOPS tuần tự của ổ đĩa (đặc biệt thê thảm trên ổ mạng EBS/Cloud Disk độ trễ `1–3ms`)."
    - "**Tuổi thọ SSD giảm nhanh** do áp lực flush liên tục."
    - "Nếu nghiệp vụ đòi hỏi `RPO = 0` tuyệt đối cho từng giao dịch lẻ, PostgreSQL với Group Commit WAL là công cụ phù hợp hơn."
right:
  badge: "CHUẨN PRODUCTION"
  title: "appendfsync everysec + Hybrid RDB Preamble"
  tone: emerald
  code: |
    appendonly yes
    appendfsync everysec
    aof-use-rdb-preamble yes
    auto-aof-rewrite-percentage 100
    auto-aof-rewrite-min-size 64mb
  lang: redis-conf
  bullets:
    - "**Hiệu năng gần như RAM thuần:** Luồng chính chỉ `write()` vào Page Cache cực nhanh, luồng phụ `bio_aof_fsync` gom cả giây lại gọi `fsync()` đúng 1 lần!"
    - "**RPO <= 1 giây:** Ngay cả khi toàn bộ máy chủ rút phích điện đột ngột (Kernel Panic / mất nguồn), bạn chỉ mất tối đa 1 giây cuối cùng (nếu chỉ tiến trình Redis crash còn Linux vẫn sống thì **mất 0 giây** vì dữ liệu đã nằm trong OS Page Cache!)."
    - "**Multi-Part AOF (Redis 7+/8):** Không tốn thêm bộ nhớ đệm ghép nối lúc Rewrite và xoá file cũ cực êm."
```

*(Chế độ thứ ba là `appendfsync no`: giao phó hoàn toàn cho Linux tự xả Page Cache mỗi ~30 giây — nhanh nhất nhưng có thể mất tới 30 giây dữ liệu khi cúp điện).*

## 3. Tinh chỉnh Nhân Linux Bắt buộc Để `BGSAVE` / `BGREWRITEAOF` Không Gây Sự cố

Đã có không ít hệ thống cấu hình `redis.conf` chuẩn chỉ nhưng vẫn ngã ngựa lúc 2 giờ sáng vì hai tham số mặc định của nhân Linux:

```visual
kind: anatomy
title: "3 Thiết Lập Hạ Tầng Sống Còn Khi Vận Hành Redis Persistence"
subtitle: "Từ tắt Persistence cho Pure Cache đến cấu hình sysctl nhân Linux trên máy chủ host"
items:
  - keyword: 'save ""'
    role: "Tắt sạch RDB cho cụm Pure Cache"
    tone: sky
    summary: "Mặc định Redis BẬT sẵn RDB (`save 3600 1 300 100 60 10000`) ngay cả khi bạn không khai báo gì trong redis.conf!"
    bullets:
      - "Nếu cụm Redis chỉ thuần làm Cache (dữ liệu gốc nằm hết ở Postgres), việc để RDB tự `fork()` mỗi phút ở tải cao chỉ gây tốn gấp đôi RAM Copy-on-Write và đốt I/O đĩa vô ích!"
      - "Để tắt triệt để cả hai cơ chế trên Pure Cache, phải khai báo tường minh cả `save \"\"` VÀ `appendonly no`."
    example: |
      save ""
      appendonly no
    lang: redis-conf
  - keyword: "vm.overcommit_memory=1"
    role: "Linux Kernel sysctl (Chống lỗi fork OOM)"
    tone: amber
    summary: "Ngăn nhân Linux từ chối lệnh `fork()` khi Redis đang dùng hơn 50% tổng RAM của máy chủ."
    bullets:
      - "Ở mặc định `overcommit_memory = 0`, khi tiến trình `20GB` trên máy `32GB` gọi `fork()`, Linux sợ tiến trình con sẽ đòi thêm đủ `20GB` mới (`20 + 20 = 40GB > 32GB`) nên từ chối thẳng thừng với lỗi `Can't save in background: fork: Cannot allocate memory` dù thực tế Copy-on-Write chỉ tốn thêm vài trăm MB!"
      - "Đặt `sysctl vm.overcommit_memory=1` trên Host Node để cho phép cấp phát lạc quan chuẩn COW."
    example: |
      sysctl -w vm.overcommit_memory=1
    lang: shell
  - keyword: "THP = never"
    role: "Tắt Transparent Huge Pages trên Host"
    tone: rose
    summary: "Giữ kích thước trang bộ nhớ ở mức chuẩn `4KB` thay vì gộp thành trang khổng lồ `2MB`."
    bullets:
      - "Nếu bật THP (`2MB`/trang), trong lúc `BGSAVE` đang chạy, ứng dụng chỉ sửa đúng **1 byte** của 1 khoá nhỏ cũng ép Linux phải copy nhân bản nguyên cả khối **`2MB` (`512` lần lớn hơn `4KB`)**, gây gai độ trễ hàng chục mili-giây và nổ tung RAM!"
    example: |
      echo never > /sys/kernel/mm/transparent_hugepage/enabled
    lang: shell
```

## 4. Triển khai Container Redis Bền vững với Docker Compose v2

Khi đóng gói Redis có bật AOF/RDB trên Docker hoặc Kubernetes, toàn bộ dữ liệu bền vững được ghi mặc định vào thư mục **`/data`** bên trong container (`dir /data`). Nếu quên gắn **Named Volume** (hoặc `PersistentVolumeClaim` trên K8s) vào `/data`, một câu lệnh cập nhật phiên bản image mới sẽ xoá sạch toàn bộ dữ liệu tích luỹ!

```yaml
services:
  redis-durable:
    image: redis:8.0-alpine
    container_name: redis-durable
    command:
      - "redis-server"
      - "--appendonly"
      - "yes"
      - "--appendfsync"
      - "everysec"
      - "--aof-use-rdb-preamble"
      - "yes"
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

> [!REMEMBER] Ghi nhớ cốt lõi từ R13
> 1. **Pure Cache:** Tắt sạch ghi đĩa bằng **`save ""`** + **`appendonly no`** để tiết kiệm RAM Copy-on-Write và I/O.
> 2. **Durable State / Streams / Session:** Bật **`appendonly yes`** + **`appendfsync everysec`** + **`aof-use-rdb-preamble yes`** kết hợp lịch `save` RDB để vừa có `RPO <= 1s`, vừa khởi động lại siêu nhanh, vừa có tệp `.rdb` gọn nhẹ để sao lưu lên Object Storage (S3/GCS).
> 3. **Tuyệt đối dùng `BGSAVE` / `BGREWRITEAOF`**, không bao giờ gõ `SAVE` đồng bộ; trên Host Linux luôn bật `vm.overcommit_memory = 1` và tắt `Transparent Huge Pages (never)`.

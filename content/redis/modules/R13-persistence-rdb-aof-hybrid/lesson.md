# Lưu trữ Bền vững: RDB Snapshot, Copy-on-Write, Multi-Part AOF & Hybrid Preamble

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Người mới học thường truyền tai nhau một hiểu lầm tai hại: *"Redis lưu trên RAM nên cúp điện là mất sạch 100% dữ liệu!"*. Sự thật là Redis có cơ chế **Lưu trữ Bền vững xuống ổ cứng (*Persistence*)** cực kỳ thông minh, kết hợp hai phương pháp kinh điển mà bạn có thể hình dung ngay qua đời thực:
> - **`RDB` (*Redis Database Snapshot* — Ảnh chụp toàn cảnh kho hàng):** Giống như cứ 15 phút người thủ kho lại bấm máy ảnh chụp **1 tấm hình nén gọn gàng toàn bộ kệ hàng** tại đúng giây phút đó lưu thành file `dump.rdb`. Ưu điểm: file siêu nhẹ, chép đi sao lưu đám mây (S3/GCS) cực nhanh, bật máy nạp lại 20GB chỉ mất vài giây. Nhược điểm: nếu mất điện ở phút thứ 14 thì mất 14 phút thay đổi mới nhất!
> - **`AOF` (*Append-Only File* — Cuốn nhật ký ghi chép từng giao dịch):** Giống cuốn sổ thu ngân — hễ có ai sửa dữ liệu (`SET`, `INCR`, `HSET`...), Redis ghi nối thêm 1 dòng vào cuối sổ và mỗi giây chốt mực xuống ổ cứng SSD một lần (**`appendfsync everysec`**). Dù sập nguồn đột ngột cũng **chỉ mất tối đa `<= 1 giây`**!
> - **`Hybrid RDB + AOF` (Kết hợp lai trên Redis 7/8):** Cứ định kỳ khi cuốn sổ nhật ký quá dày, Redis tự động kẹp **tấm ảnh nén RDB lên trang đầu cuốn sổ**, và chỉ ghi nối các dòng nhật ký AOF mới phát sinh ở phần đuôi — ==vừa an toàn từng giây, vừa khởi động lại nhanh như chớp==!
> - **`fork()` & `Copy-on-Write` (`CoW` — Chụp bản sao không dừng phục vụ):** Khi chụp ảnh `BGSAVE`, hệ điều hành Linux tạo một "tiến trình phụ tá" dùng chung bảng mục lục RAM với tiến trình chính chỉ mất vài mili-giây; tiến trình chính vẫn tiếp tục phục vụ 100,000 khách/giây, chỉ đúng ô nhớ nào khách vừa sửa đổi thì Linux mới chép riêng trang 4KB đó ra để không làm nhòe tấm ảnh đang chụp!

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

## 1. Phân biệt sinh tử: `BGSAVE` (Chạy nền) vs `SAVE` (Đóng băng Server)

- [+] **`BGSAVE` (*Background Save* — Luôn dùng trên Production):** Gọi `fork()` đẻ tiến trình con âm thầm xuất dữ liệu ra tệp tạm rồi đổi tên đè lên `dump.rdb` an toàn trong khi luồng chính vẫn trả lời khách bình thường.
- [!] **`SAVE` (*Synchronous Save* — CẤM TUYỆT ĐỐI trên Production):** Bắt chính người đầu bếp duy nhất bỏ hết khách hàng để ngồi ghi đĩa suốt hàng chục giây! Trên thực tế, kỹ sư vận hành luôn khóa cứng lệnh `SAVE` qua phân quyền ACL.

## 2. Đối chiếu 3 chế độ chốt ổ đĩa `appendfsync` của nhật ký AOF

Khi bạn chạy lệnh ghi và bật `appendonly yes`, Redis đẩy câu lệnh vào bộ đệm trang của hệ điều hành (*OS Page Cache* — vẫn trên RAM) rồi dựa vào chỉ thị **`appendfsync`** để quyết định khi nào ép khắc vật lý xuống chip nhớ SSD (`fsync()`):

```visual
kind: compare
title: "Cạm Bẫy Đốt Cháy Ổ Đĩa (appendfsync always) vs Điểm Cân Bằng Vàng (everysec)"
subtitle: "Hiểu rõ ranh giới giữa lệnh write() vào bộ đệm hệ điều hành và lệnh fsync() ép ghi vật lý xuống SSD"
left:
  badge: "SÁT THỦ THÔNG LƯỢNG"
  title: "appendfsync always (Ép đĩa ở mọi lệnh)"
  tone: rose
  code: |
    appendonly yes
    # Mỗi lệnh ghi đều phải chờ ổ đĩa vật lý
    # xác nhận ghi xong mới trả OK cho ứng dụng!
    appendfsync always
  lang: redis-conf
  bullets:
    - "**Thông lượng sụt giảm 50–100 lần:** Kéo tốc độ Redis từ `100,000 ops/s` tụt xuống ngang tốc độ ghi vật lý của ổ đĩa mạng (chỉ còn vài nghìn lệnh/giây)."
    - "**Làm mòn ổ SSD rất nhanh** do ép ghi liên tục."
    - "Nếu nghiệp vụ bắt buộc không được mất dù chỉ 1 giao dịch khi rút phích điện (như sổ cái ngân hàng), hãy ghi giao dịch gốc vào PostgreSQL!"
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
    - "**Tốc độ gần như RAM thuần:** Luồng chính không phải chờ đĩa; luồng phụ `bio_aof_fsync` gom trọn 1 giây gọi `fsync()` đúng 1 lần!"
    - "==Tối đa chỉ mất <= 1 giây dữ liệu== nếu cả máy chủ mất nguồn điện đột ngột (còn nếu chỉ tiến trình Redis văng lỗi mà HĐH Linux vẫn sống thì **mất 0 giây**!)."
    - "**Multi-Part AOF (Redis 7/8):** Tự động nén gọn nhật ký khi kích thước tăng gấp đôi (`100%`) mà không làm phình bộ nhớ tạm."
```

*(Chế độ thứ ba là `appendfsync no`: để mặc hệ điều hành tự xả xuống đĩa khoảng ~30 giây một lần — nhanh nhất nhưng rủi ro mất 30 giây dữ liệu khi mất điện).*

## 3. Ba thiết lập Hạ tầng quan trọng để `BGSAVE` không gặp lỗi lúc nửa đêm

```visual
kind: anatomy
title: "3 Thiết Lập Hạ Tầng Sống Còn Khi Vận Hành Redis Persistence"
subtitle: "Từ tắt ghi đĩa cho Pure Cache đến hai tham số nhân Linux giúp fork() mượt mà"
items:
  - keyword: 'save ""'
    role: "Tắt sạch RDB cho cụm Pure Cache"
    tone: sky
    summary: "Mặc định Redis TỰ BẬT sẵn RDB ngay cả khi bạn không viết dòng save nào trong redis.conf!"
    bullets:
      - "Nếu cụm Redis chỉ thuần làm bộ đệm tạm (dữ liệu gốc nằm hết ở PostgreSQL), tắt ghi đĩa giúp tiết kiệm 100% I/O đĩa và tránh tốn RAM Copy-on-Write."
      - "Để tắt hoàn toàn, phải khai báo rõ cả hai dòng: ==`save \"\"` và `appendonly no`==."
    example: |
      save ""
      appendonly no
    lang: redis-conf
  - keyword: "vm.overcommit_memory=1"
    role: "Tham số Linux chống lỗi fork() thiếu RAM"
    tone: amber
    summary: "Cho phép Linux cấp phát bộ nhớ lạc quan để `BGSAVE` không bị từ chối khi Redis dùng trên 50% RAM máy chủ."
    bullets:
      - "Nếu để mặc định `0`, một tiến trình Redis `20GB` trên máy `32GB` gọi `fork()` sẽ bị Linux từ chối vì tưởng nhầm tiến trình con cần thêm hẳn `20GB` mới, dù thực tế Copy-on-Write chỉ tốn vài trăm MB!"
    example: |
      sysctl -w vm.overcommit_memory=1
    lang: shell
  - keyword: "THP = never"
    role: "Tắt Transparent Huge Pages trên máy chủ"
    tone: rose
    summary: "Giữ kích thước trang bộ nhớ nhỏ gọn `4KB` thay vì gộp thành khối khổng lồ `2MB`."
    bullets:
      - "Nếu bật THP (`2MB`/trang), trong lúc đang `BGSAVE`, ứng dụng chỉ sửa đúng **1 byte** cũng bắt Linux nhân bản nguyên cả tảng `2MB` (gấp 512 lần!), gây giật độ trễ nặng."
    example: |
      echo never > /sys/kernel/mm/transparent_hugepage/enabled
    lang: shell
```

## 4. Triển khai Container Redis Bền vững với Docker Compose v2

Khi chạy Redis có bật lưu trữ bền vững trên Docker hoặc Kubernetes, mọi tệp RDB và thư mục `appendonlydir` đều nằm trong **`/data`**. Đừng bao giờ quên gắn **Volume lưu trữ bền vững** vào `/data`, nếu không mỗi lần cập nhật container mới sẽ xóa trắng toàn bộ dữ liệu!

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
      - "127.0.0.1:6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

> [!REMEMBER] Ghi nhớ cốt lõi từ R13
> 1. **Cụm Pure Cache:** Tắt hẳn ghi đĩa bằng **`save ""`** + **`appendonly no`** để tối ưu RAM và I/O.
> 2. **Cụm Durable State / Streams / Session:** Bật ==`appendonly yes` + `appendfsync everysec` + `aof-use-rdb-preamble yes`== kèm lịch chụp RDB định kỳ để sao lưu ra Object Storage (S3/GCS).
> 3. Chỉ dùng **`BGSAVE` / `BGREWRITEAOF`** chạy nền (cấm gõ `SAVE` đồng bộ), và trên máy chủ Linux luôn cấu hình `vm.overcommit_memory=1` + tắt `THP`.

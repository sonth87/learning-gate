# Cô lập Kernel, Khoá trần RAM (OOM 137), Mạng riêng & Lưu trữ bền vững

Nhiều người lầm tưởng Docker là một "chiếc hộp ảo hoá phép thuật", nhưng thực chất toàn bộ sức mạnh của Container được xây dựng trên hai cơ chế nguyên bản có sẵn trong nhân hệ điều hành **Linux Kernel**: ==Namespaces== ({sky:cô lập tầm nhìn}) và ==Control Groups (`cgroups`)== ({amber:khoá trần tài nguyên}). Hiểu thấu hai trụ cột này, bạn không chỉ làm chủ Docker mà còn nắm trọn gốc rễ cách **Kubernetes** điều phối hàng nghìn Pod sau này!

```visual
kind: illustration
diagram: "kube:k02"
alt: "Giải phẫu Linux Namespaces, cgroups v2 khoá trần RAM/CPU (OOM Exit 137) và Named Volume so với Bind Mount"
title: "Giải Phẫu Nhân Linux: Namespaces Cô Lập, cgroups v2 Khoá Tải & Lưu Trữ Bền Vững"
subtitle: "Ba cơ chế cấp nhân biến một tiến trình Linux thông thường thành đơn vị vận hành an toàn và giữ dữ liệu lâu dài"
caption: "Tường ngăn tầm nhìn Namespaces, bộ giới hạn phần cứng cgroups v2 (CPU Throttling vs OOMKilled 137) và cách gắn ổ đĩa vượt thoát lớp ghi tạm"
callouts:
  - num: 1
    label: "Linux Namespaces — Rèm che tầm nhìn"
    desc: "Tách biệt không gian PID, mạng (eth0), cây thư mục gốc (/) và hostname để tiến trình tưởng mình đang sở hữu máy riêng."
    tone: sky
  - num: 2
    label: "cgroups v2 — Trần cứng CPU & Bộ nhớ RAM"
    desc: "Vượt hạn mức CPU chỉ bị hãm xung (Throttling), nhưng vượt trần --memory sẽ bị nhân Linux bắn SIGKILL (9) gây mã thoát 137."
    tone: amber
  - num: 3
    label: "Named Volume (Production) vs Bind Mount (Dev)"
    desc: "Đưa dữ liệu Database ra khỏi lớp ghi tạm mỏng manh để tồn tại nguyên vẹn ngay cả khi xoá bỏ container cũ."
    tone: emerald
```

## 1. Hai trụ cột của Container: Namespaces vs `cgroups`

> [!ANALOGY] Hãy hình dung một khu chung cư cao cấp
> **Namespaces** giống như **tường cách âm và rèm che cửa** của từng căn hộ (căn hộ nào chỉ nhìn thấy đồ đạc trong căn hộ đó), còn **`cgroups`** chính là **cầu dao tổng & đồng hồ đo điện nước** (ngăn một căn hộ chập điện làm nổ cầu chì của cả toà nhà!).

```visual
kind: layers
title: Giải Phẫu Hai Trụ Cột Nhân Linux Tạo Nên Container
subtitle: Namespaces quyết định tiến trình NHÌN THẤY gì · cgroups v2 quyết định tiến trình DÙNG TỐI ĐA bao nhiêu
columns:
  - title: "Linux Namespaces (Tấm rèm che mắt)"
    badge: Cô lập tầm nhìn không gian
    tone: sky
    layers:
      - label: "PID Namespace — Không gian Tiến trình"
        sub: "Tiến trình node tưởng mình là PID 1 duy nhất, không thấy tiến trình của máy chủ"
        note: Cô lập PID
        tone: sky
      - label: "NET Namespace — Không gian Mạng riêng"
        sub: "Sở hữu card mạng ảo eth0, bảng định tuyến và cổng 3000 độc lập hoàn toàn"
        note: Cô lập Port/IP
        tone: cyan
      - label: "MNT Namespace — Cây thư mục gốc riêng"
        sub: "Có thư mục gốc / riêng từ Image, không nhìn thấy tệp nhạy cảm trên Host"
        note: Cô lập Filesystem
        tone: emerald
    footer: "Trả lời câu hỏi: Tiến trình được phép NHÌN THẤY những gì?"
  - title: "Control Groups — cgroups v2 (Đồng hồ đo tải)"
    badge: Khoá cứng hạn mức phần cứng
    tone: amber
    layers:
      - label: "Memory Controller (--memory=256m)"
        sub: "Chặn đứng worker bị memory leak không cho ăn sạch RAM vật lý của máy chủ"
        note: Khoá trần RAM
        tone: rose
      - label: "CPU Controller (--cpus=0.50)"
        sub: "Giới hạn thời lượng CPU tối đa được phép chiếm dụng mỗi chu kỳ"
        note: Khoá trần CPU
        tone: amber
      - label: "Block I/O & PIDs Limit"
        sub: "Ngăn một container đọc/ghi đĩa quá mức hoặc fork bomb làm treo hệ thống"
        note: Bảo vệ Host
        tone: violet
    footer: "Trả lời câu hỏi: Tiến trình được phép TIÊU THỤ TỐI ĐA bao nhiêu?"
```

## 2. Khoá trần RAM và bí ẩn con số `Exit Code 137` (OOMKilled)

> [!WARNING] Mặc định nguy hiểm của `docker run`
> Khi bạn chạy `docker run` **không kèm cờ `--memory`**, container **KHÔNG hề bị giới hạn RAM** (`no limit`)! Một API xuất báo cáo Excel hay xử lý ảnh bằng Node.js bị rò rỉ bộ nhớ có thể nuốt trọn toàn bộ RAM trống của server, kéo sập luôn cả Database lẫn cổng SSH!

Để đặt trần RAM cứng an toàn qua `cgroups`, hãy truyền cờ `--memory` (hoặc `-m`):

```bash
# Khoá cứng trần RAM 256MB + cấu hình V8 Heap ~75% trần để chạy GC kịp thời
docker run -d --name worker-safe \
  --memory=512m \
  -e NODE_OPTIONS="--max-old-space-size=384" \
  node:22-alpine
```

```visual
kind: flow
title: "Giải Mã Sự Cố OOMKilled & Công Thức POSIX Tạo Ra Exit Code 137"
subtitle: "Chuyện gì xảy ra ở cấp độ nhân Linux ngay khoảnh khắc tiến trình vượt quá vạch --memory?"
footer: "Công thức chuẩn POSIX khi tiến trình chết bởi tín hiệu N: Exit Code = 128 + N -> 128 + 9 (SIGKILL) = 137!"
steps:
  - icon: flame
    badge: Bước 1 · Vượt ngưỡng
    title: Memory Leak
    desc: Tiến trình Node.js xin cấp phát RAM vượt quá trần cgroup (ví dụ > 256MB)
    code: "> 256m limit"
    tone: amber
    edge: cgroup từ chối
  - icon: shield-alert
    badge: Bước 2 · Nhân can thiệp
    title: Kernel OOM Killer
    desc: Linux Out-Of-Memory Killer lập tức ra tay bảo vệ sự sống của máy chủ
    code: OOM Killer
    tone: rose
    edge: bắn tín hiệu số 9
  - icon: zap
    badge: Bước 3 · Tín hiệu tử hình
    title: SIGKILL (Signal 9)
    desc: Ngắt điện tiến trình tức khắc, không thể bắt hay trì hoãn trong code JS
    code: "SIGKILL = 9"
    tone: violet
    edge: "128 + 9"
  - icon: alert
    badge: Bước 4 · Dấu vết để lại
    title: Exited (137)
    desc: Hiện rõ trong docker ps -a báo hiệu container chết do tràn bộ nhớ (OOMKilled)
    code: "Exit Code 137"
    tone: rose
```

> [!TIP] Mẹo vàng sống còn cho lập trình viên Node.js (V8 Garbage Collector)
> Bộ máy V8 mặc định tự ước lượng kích thước Heap dựa trên **tổng RAM vật lý của máy chủ** (máy chủ 16GB khiến V8 tưởng mình dư dả tới 4GB!) nên lười thu gom rác khi chạy trong container nhỏ. Khi khoá `--memory=512m`, hãy luôn đặt kèm ==`NODE_OPTIONS="--max-old-space-size=384"`== (~70%–75% trần container, chừa chỗ cho Stack & Buffers) để ép V8 chủ động dọn Garbage Collection trước khi chạm vạch tử thần `137`!

Trong tệp `compose.yaml` (Docker Compose v2), bạn khai báo hạn mức này trực quan dưới khối `deploy.resources.limits`:

```yaml
services:
  api:
    image: node:22-alpine
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "0.50"    # Giới hạn tối đa 50% của 1 nhân CPU
          memory: 256M    # Trần RAM cứng 256MB qua cgroups v2
```

## 3. Mạng Bridge tuỳ chỉnh (User-Defined Bridge) & DNS tự động

Nhiều người thắc mắc vì sao không để mặc các container nằm chung trên mạng `bridge` có sẵn lúc cài Docker? Câu trả lời nằm ở **máy chủ DNS nội bộ**:

```visual
kind: compare
title: "Mạng bridge Mặc Định vs Mạng User-Defined Bridge Tự Tạo"
subtitle: "Chỉ mất 1 lệnh docker network create nhưng giải phóng bạn khỏi cơn ác mộng địa chỉ IP động!"
left:
  badge: "HẠN CHẾ LỊCH SỬ · Default bridge"
  title: "Không phân giải được tên Container"
  tone: rose
  code: |
    # Nằm trên mạng bridge mặc định:
    # KHÔNG THỂ gọi redis://redis-session:6379!
    # Phải mò IP nội bộ 172.17.0.3 (đổi liên tục khi bật lại)
    docker run -d --name redis-session redis:7-alpine
  lang: shell
  bullets:
    - "Các container trên mạng `bridge` mặc định **không thể gọi nhau bằng tên container**"
    - "Mọi dự án trên cùng máy bị gom chung một rổ mạng, thiếu tính cô lập"
right:
  badge: "CHUẨN THỰC CHIẾN · User-Defined Bridge"
  title: "Bật sẵn Embedded DNS tự động"
  tone: emerald
  code: |
    docker network create shop-net

    docker run -d --name redis-session --network shop-net redis:7-alpine
    docker run -d --name shop-api --network shop-net \
      -e REDIS_URL=redis://redis-session:6379 \
      shop-api:1.0.0
  lang: shell
  bullets:
    - "Docker tự động nhúng **Embedded DNS** vào mạng `shop-net`"
    - "Từ trong `shop-api`, tên miền ==`redis-session`== tự phân giải thẳng ra IP hiện tại của container Redis!"
```

## 4. Giữ dữ liệu bền vững: Named Volume vs Bind Mount

Lớp ghi tạm (*writable layer*) của container gắn chặt với sinh mạng của container đó: hễ bạn chạy `docker rm shop-db` để nâng cấp PostgreSQL từ `16.2` lên `16.4`, toàn bộ dữ liệu khách hàng nằm trong lớp ghi tạm sẽ **bốc hơi vĩnh viễn**! Để tách vòng đời dữ liệu khỏi vòng đời tiến trình, hãy chọn đúng cơ chế lưu trữ:

```visual
kind: groups
title: "So Sánh 3 Cơ Chế Lưu Trữ Trong Docker [!badge:sky:Storage Guide]"
columns: 3
items:
  - num: 1
    icon: layers
    title: Writable Layer (Mặc định)
    badge: Tạm bợ · Mất khi xoá
    tone: slate
    bullets:
      - "Lớp mỏng nằm trên cùng mỗi container"
      - "**Bốc hơi sạch 100%** ngay khi gõ `docker rm`"
      - "Chỉ hợp chứa tệp nháp tạm thời không quan trọng"
    footer: Tuyệt đối cấm lưu Database tại đây!
  - num: 2
    icon: database
    title: Named Volume (Khuyên dùng)
    badge: Chuẩn Database bền vững
    tone: emerald
    bullets:
      - "Do **Docker Engine** tự quản lý ở vùng tối ưu (`/var/lib/docker/volumes/...`)"
      - "Hiệu năng I/O cực nhanh (kể cả trên macOS/Windows)"
      - "**Bất tử trước `docker rm -f`** — chỉ xoá khi gọi `docker volume rm` hoặc `compose down -v`"
    footer: Lựa chọn số 1 cho PostgreSQL, Redis, MinIO
  - num: 3
    icon: folder-git
    title: Bind Mount (Gắn thư mục Host)
    badge: Cẩn thận bẫy che khuất!
    tone: amber
    bullets:
      - "Ánh xạ thẳng một đường dẫn cụ thể trên máy chủ vào container (`./src:/app/src`)"
      - "I/O chậm trên Mac/Windows nếu chứa hàng vạn tệp nhỏ"
      - "**Bẫy kinh điển:** `-v $(pwd):/app` sẽ ==che khuất hoàn toàn `/app/node_modules`== đã cài sẵn trong Image -> lỗi `Cannot find module`!"
    footer: Nên ưu tiên compose watch thay cho mount cả /app
```

Cách khởi tạo và gắn một **Named Volume** chuẩn mực cho PostgreSQL 16:

```bash
# 1. Tạo ổ đĩa định danh độc lập với vòng đời container
docker volume create pg-data

# 2. Gắn pg-data vào đúng đường dẫn lưu dữ liệu của PostgreSQL
docker run -d --name shop-db \
  -e POSTGRES_PASSWORD=dev-only-placeholder \
  -v pg-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

Từ giây phút này, dù bạn có `docker rm -f shop-db` rồi khởi chạy một container Postgres phiên bản mới gắn lại vào `-v pg-data:/var/lib/postgresql/data`, toàn bộ bảng biểu và giao dịch vẫn còn nguyên vẹn 100%!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Namespaces** = Cô lập tầm nhìn (`PID`, `NET`, `MNT`) · **`cgroups`** = Khoá hạn mức tài nguyên (`--memory`, `--cpus`).
> - Mặc định container không giới hạn RAM; vượt trần `--memory` sẽ bị Kernel bắn `SIGKILL (9)` -> **`Exited (137)`** (`128 + 9`). Với Node.js, nhớ đặt `--max-old-space-size` ~75% trần RAM!
> - Luôn tạo **User-Defined Bridge** (`docker network create`) để có DNS tự động theo tên container, và dùng **Named Volume** để bảo toàn dữ liệu Database qua các lần `docker rm`.

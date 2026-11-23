# Cô lập Kernel, Khóa trần RAM (OOM 137), Mạng riêng & Lưu trữ bền vững

Container không phải là máy ảo hay cơ chế ảo hóa phần cứng riêng biệt; thực chất nó hoạt động dựa trên **hai cơ chế có sẵn trong nhân Linux Kernel**: ==Linux Namespaces== (cô lập không gian nhìn thấy) và ==Control Groups (`cgroups`)== (giới hạn mức tiêu thụ RAM/CPU). Hiểu rõ hai cơ chế nền tảng này trước khi dùng các cờ lệnh sẽ giúp bạn hiểu luôn bản chất cách **Kubernetes** vận hành Pod sau này.

```visual
kind: illustration
diagram: "kube:k02"
alt: "Sơ đồ Linux Namespaces, cgroups v2 giới hạn RAM/CPU (OOM Exit 137) và Named Volume so với Bind Mount"
title: "Cơ Chế Nhân Linux: Cô Lập Bằng Namespaces, Giới Hạn Bằng cgroups v2 & Lưu Trữ Bền Vững"
subtitle: "Ba cơ chế cấp nhân biến một tiến trình Linux thông thường thành đơn vị vận hành an toàn và giữ dữ liệu lâu dài"
caption: "Cơ chế cô lập tầm nhìn Namespaces, giới hạn tài nguyên phần cứng cgroups v2 (CPU Throttling vs OOMKilled 137) và tách dữ liệu khỏi lớp ghi tạm"
callouts:
  - num: 1
    label: "Linux Namespaces — Cô lập không gian nhìn"
    desc: "Tách biệt không gian PID, mạng (eth0), cây thư mục gốc (/) và hostname để mỗi container hoạt động như một môi trường độc lập."
    tone: sky
  - num: 2
    label: "cgroups v2 — Giới hạn tài nguyên CPU & RAM"
    desc: "Vượt hạn mức CPU chỉ bị hãm xung chậm lại (Throttling), nhưng vượt trần --memory sẽ bị Kernel ngắt bằng SIGKILL (9) sinh mã thoát 137."
    tone: amber
  - num: 3
    label: "Named Volume (Production) vs Bind Mount (Dev)"
    desc: "Đưa dữ liệu Database ra khỏi lớp ghi tạm mỏng manh để tồn tại nguyên vẹn ngay cả khi xóa bỏ container cũ."
    tone: emerald
```

## 1. Cơ chế cô lập Container: Linux `Namespaces` (cô lập tầm nhìn) và `cgroups` (giới hạn tài nguyên)

> [!NOTE] Hai trụ cột của nhân Linux tạo nên Container
> - **Linux Namespaces (Cô lập tầm nhìn):** Kernel tạo ra các không gian tách biệt cho từng tiến trình về danh sách tiến trình (`PID`), giao diện mạng (`NET`), hệ thống tệp (`MNT`) và tên máy (`UTS`). Nhờ đó, ứng dụng bên trong chỉ nhìn thấy đúng tài nguyên được cấp cho riêng nó (`PID 1`, `eth0`, `/`) mà không nhìn thấy tiến trình của máy chủ hay container khác.
> - **Control Groups — `cgroups` (Giới hạn phần cứng):** Trong khi Namespaces cô lập tầm nhìn, `cgroups` đặt hạn mức tiêu thụ vật lý tối đa (RAM, CPU, I/O) cho mỗi container, ngăn một tiến trình bị rò rỉ bộ nhớ chiếm hết tài nguyên và làm sập toàn bộ máy chủ.
> - Có thể hình dung đơn giản: `Namespaces` giống các bức tường ngăn cách từng căn hộ trong tòa nhà, còn `cgroups` giống cầu dao điện nước riêng lắp cho mỗi căn hộ.

```visual
kind: layers
title: Hai Cơ Chế Nhân Linux Tạo Nên Container
subtitle: Namespaces quyết định tiến trình NHÌN THẤY gì · cgroups v2 quyết định tiến trình TIÊU THỤ TỐI ĐA bao nhiêu
columns:
  - title: "Linux Namespaces (Cô lập không gian nhìn)"
    badge: Cô lập không gian nhìn thấy
    tone: sky
    layers:
      - label: "PID Namespace — Không gian Tiến trình"
        sub: "Tiến trình Python/Node thấy mình là PID 1 trong phạm vi riêng, không thấy tiến trình của máy chủ"
        note: Cô lập PID
        tone: sky
      - label: "NET Namespace — Không gian Mạng riêng"
        sub: "Sở hữu card mạng ảo eth0, bảng định tuyến và cổng 3000/8000 độc lập hoàn toàn"
        note: Cô lập Port/IP
        tone: cyan
      - label: "MNT Namespace — Cây thư mục gốc riêng"
        sub: "Có thư mục gốc / riêng từ Image, không nhìn thấy tệp nhạy cảm trên Host"
        note: Cô lập Filesystem
        tone: emerald
    footer: "Trả lời câu hỏi: Tiến trình được phép NHÌN THẤY những gì?"
  - title: "Control Groups — cgroups v2 (Giới hạn tài nguyên)"
    badge: Khóa cứng hạn mức phần cứng
    tone: amber
    layers:
      - label: "Memory Controller (--memory=512m)"
        sub: "Chặn đứng worker bị memory leak không cho nuốt sạch RAM vật lý của máy chủ"
        note: Giới hạn RAM
        tone: rose
      - label: "CPU Controller (--cpus=0.50)"
        sub: "Giới hạn thời lượng CPU tối đa được phép chiếm dụng trong mỗi chu kỳ"
        note: Hạn mức CPU
        tone: amber
      - label: "Block I/O & PIDs Limit"
        sub: "Ngăn một container đọc/ghi đĩa quá mức hoặc tạo tiến trình vô hạn (fork bomb)"
        note: Bảo vệ Host
        tone: cyan
    footer: "Trả lời câu hỏi: Tiến trình được phép DÙNG TỐI ĐA bao nhiêu?"
```

## 2. Tại sao tràn RAM lại sinh ra đúng con số `Exit Code 137` (`OOMKilled`)?

> [!WARNING] Mặc định của `docker run`: Không có giới hạn RAM
> Khi bạn gõ `docker run` **mà không truyền cờ `--memory`**, container **KHÔNG hề bị giới hạn RAM** (`no limit`)! Một worker Python nạp nhầm bảng Pandas 10GB lên RAM hay API Node.js xuất báo cáo bị rò rỉ bộ nhớ sẽ chiếm cạn RAM của server, kéo sập luôn cả Database lẫn kết nối SSH quản trị!

Chuyện gì xảy ra khi bạn đặt giới hạn `--memory=512m` và ứng dụng cố tình xin vượt vạch `512 MB`? Khác với **CPU** (vượt hạn mức `--cpus` chỉ bị chạy chậm lại gọi là *CPU Throttling*, không chết), **RAM là tài nguyên không thể nén**. Ngay khoảnh khắc chạm trần bộ nhớ:
1. Trình bảo vệ của nhân Linux tên là **OOM Killer** (*Out-Of-Memory Killer*) lập tức ngắt tiến trình bằng tín hiệu cưỡng bức **`SIGKILL` (tín hiệu số `9`)**.
2. Theo quy ước toán học chuẩn Unix/POSIX, khi tiến trình bị dừng bởi tín hiệu số `N`, mã thoát trả về luôn là `128 + N`. Với `N = 9`, ta có đúng con số nổi tiếng nhất giới DevOps: ==`128 + 9 = Exit Code 137 (OOMKilled)`==!

```visual
kind: flow
title: "Cơ Chế Xảy Ra Sự Cố OOMKilled & Công Thức POSIX Tạo Ra Exit Code 137"
subtitle: "Chuyện gì xảy ra ở cấp độ nhân Linux ngay khoảnh khắc tiến trình vượt quá hạn mức --memory?"
footer: "Công thức chuẩn POSIX khi tiến trình chết bởi tín hiệu N: Exit Code = 128 + N -> 128 + 9 (SIGKILL) = 137!"
steps:
  - icon: flame
    badge: Bước 1 · Vượt hạn mức
    title: Tràn Bộ Nhớ RAM
    desc: Tiến trình Python / Node.js xin cấp phát RAM vượt quá trần cgroup (> 512m)
    code: "> 512m limit"
    tone: amber
    edge: cgroup từ chối
  - icon: shield-alert
    badge: Bước 2 · Nhân can thiệp
    title: Kernel OOM Killer
    desc: Linux Out-Of-Memory Killer lập tức ngắt tiến trình để bảo vệ máy chủ vật lý
    code: OOM Killer
    tone: rose
    edge: bắn tín hiệu số 9
  - icon: zap
    badge: Bước 3 · Tín hiệu cưỡng bức
    title: SIGKILL (Signal 9)
    desc: Ngắt điện tiến trình tức khắc, không thể try/catch hay trì hoãn trong code
    code: "SIGKILL = 9"
    tone: cyan
    edge: "128 + 9"
  - icon: alert
    badge: Bước 4 · Dấu vết để lại
    title: Exited (137)
    desc: Hiện rõ trong docker ps -a (hoặc K8s OOMKilled) báo hiệu chết do vượt trần RAM!
    code: "Exit Code 137"
    tone: rose
```

Cách đặt khóa trần RAM an toàn qua `cgroups` khi chạy thực tế:

```bash
# Khóa cứng trần RAM 512MB (với Node.js, đặt thêm V8 Heap ~75% trần để GC dọn rác kịp thời)
docker run -d --name worker-safe \
  --memory=512m \
  -e NODE_OPTIONS="--max-old-space-size=384" \
  node:22-alpine
```

> [!TIP] Kinh nghiệm chống `Exit 137` cho cả Node.js lẫn Python / AI
> - **Với Node.js:** Bộ máy V8 hay nhìn nhầm tổng RAM của máy chủ lớn (16GB) nên lười dọn rác. Khi đặt `--memory=512m`, hãy kèm `NODE_OPTIONS="--max-old-space-size=384"` (~75% trần) để ép Garbage Collector dọn trước khi chạm giới hạn!
> - **Với Python (`FastAPI` / `Gunicorn` / `Pandas`):** Mỗi worker process nhân bản riêng một bản bộ nhớ trên RAM (ví dụ mở `--workers 4` mà mỗi worker nạp mô hình ML 300MB = ngốn 1.2GB!). Trong môi trường Container & Kubernetes, hãy giữ ít worker mỗi container (1–2 worker) và ưu tiên mở rộng bằng cách tăng số lượng container!

Trong tệp `compose.yaml` (Docker Compose v2), bạn khai báo giới hạn này gọn gàng dưới khối `deploy.resources.limits`:

```yaml
services:
  api:
    image: node:22-alpine
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "0.50"    # Giới hạn tối đa 50% của 1 nhân CPU (vượt chỉ chậm, không chết)
          memory: 256M    # Giới hạn RAM cứng 256MB qua cgroups v2 (vượt -> Exit 137)
```

## 3. Mạng Bridge tùy chỉnh (User-Defined Bridge) & Danh bạ DNS tự động

Nhiều người thắc mắc vì sao không để mặc các container nằm chung trên mạng `bridge` có sẵn lúc cài Docker? Câu trả lời nằm ở **danh bạ tên miền DNS tự động**:

```visual
kind: compare
title: "Mạng bridge Mặc Định vs Mạng User-Defined Bridge Tự Tạo"
subtitle: "Chỉ mất 1 lệnh docker network create nhưng giải phóng bạn khỏi cơn ác mộng nhớ địa chỉ IP động!"
left:
  badge: "HẠN CHẾ LỊCH SỬ · Default bridge"
  title: "Không gọi được nhau bằng tên Container"
  tone: rose
  code: |
    # Nằm trên mạng bridge mặc định:
    # KHÔNG THỂ gọi redis://redis-session:6379!
    # Phải mò IP nội bộ 172.17.0.3 (đổi liên tục khi bật lại)
    docker run -d --name redis-session redis:7-alpine
  lang: shell
  bullets:
    - "Các container trên mạng `bridge` mặc định **không tự phân giải được tên của nhau**"
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
    - "Docker tự động nhúng **Embedded DNS** vào mạng riêng `shop-net`"
    - "Từ trong `shop-api`, tên ==`redis-session`== tự động phân giải thẳng ra IP hiện tại của container Redis!"
```

## 4. Giữ dữ liệu bền vững: Named Volume vs Bind Mount

Lớp ghi tạm (*writable layer*) trên nóc mỗi container gắn chặt với sinh mạng của container đó: hễ bạn gõ `docker rm shop-db` để nâng cấp PostgreSQL từ `16.2` lên `16.4`, toàn bộ dữ liệu khách hàng nằm trong lớp ghi tạm sẽ **bốc hơi vĩnh viễn**! Để tách dữ liệu bền vững ra khỏi lớp ghi tạm của container, hãy chọn đúng cơ chế lưu trữ:

```visual
kind: groups
title: "So Sánh 3 Cơ Chế Lưu Trữ Trong Docker [!badge:sky:Storage Guide]"
columns: 3
items:
  - num: 1
    icon: layers
    title: Writable Layer (Mặc định)
    badge: Tạm bợ · Mất khi xóa
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
      - "Hiệu năng đọc/ghi cực nhanh (kể cả trên macOS/Windows)"
      - "==Bền vững qua các lần `docker rm -f`== — chỉ xóa khi gọi rõ `docker volume rm` hoặc `compose down -v`"
    footer: Lựa chọn số 1 cho PostgreSQL, Redis, MinIO
  - num: 3
    icon: folder-git
    title: Bind Mount (Gắn thư mục Host)
    badge: Cẩn thận bẫy che khuất!
    tone: amber
    bullets:
      - "Ánh xạ thẳng một đường dẫn cụ thể trên máy chủ vào container (`./src:/app/src`)"
      - "Chậm trên Mac/Windows nếu đồng bộ hàng vạn tệp nhỏ"
      - "**Bẫy kinh điển:** `-v $(pwd):/app` sẽ **che khuất hoàn toàn `/app/node_modules` hoặc `/app/.venv`** đã cài sẵn trong Image!"
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

Từ giây phút này, dù bạn có `docker rm -f shop-db` rồi khởi chạy một container Postgres phiên bản mới gắn lại vào ==`-v pg-data:/var/lib/postgresql/data`==, toàn bộ bảng biểu và giao dịch vẫn còn nguyên vẹn 100%!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Namespaces** = Cô lập không gian nhìn (`PID`, `NET`, `MNT`) · **`cgroups`** = Giới hạn hạn mức tài nguyên (`--memory`, `--cpus`).
> - Mặc định container không giới hạn RAM; vượt trần `--memory` sẽ bị Kernel ngắt tiến trình bằng `SIGKILL (9)` → **`Exited (137)`** (`128 + 9`).
> - Luôn tạo **User-Defined Bridge** (`docker network create`) để có DNS tự động theo tên container, và dùng **Named Volume** để bảo toàn dữ liệu Database qua các lần `docker rm`.

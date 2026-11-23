# Vì sao code chạy trên máy bạn nhưng sập ngay trên server?

Dù bạn xuất phát từ **Python (`FastAPI`, `Django`)**, **Node.js / TypeScript (`Express`, `Next.js`)** hay **Go / Java**, chắc chắn bạn đã từng gặp câu nói kinh điển ám ảnh mọi đội kỹ thuật: *"Ơ lạ nhỉ, trên máy em vẫn chạy ngon mà!"*

- [>] Ở máy cá nhân macOS, bạn chạy **Python 3.12** (hoặc **Node v22.12**), gõ lệnh chạy thử mượt mà không một cảnh báo.
- [!] Đẩy code lên máy chủ Ubuntu (hoặc gửi cho đồng nghiệp dùng Windows), ứng dụng sập ngay lúc khởi động: bên Python nổ lỗi thiếu thư viện C hệ thống `libpq-dev` khi cài `psycopg` hoặc lệch bản `glibc`; bên Node.js văng `ERR_DLOPEN_FAILED` ở gói xử lý ảnh `sharp`, lệch múi giờ `UTC` vs `Asia/Ho_Chi_Minh`, hoặc server vẫn kẹt ở runtime đời cũ!

Các tệp khóa gói như `uv.lock` / `requirements.txt` (Python) hay `package-lock.json` (Node.js) chỉ khóa phiên bản thư viện ngôn ngữ, nhưng **hoàn toàn bất lực** trước hệ điều hành bên dưới và thư viện C của máy chủ. **Container (theo chuẩn mở OCI)** ra đời để đóng băng trọn gói ứng dụng + runtime + thư viện hệ thống thành một đơn vị duy nhất: **siêu nhẹ**, **khởi động tức thì** và ==chạy đồng nhất 100% ở mọi nơi==.

```visual
kind: flow
title: Luồng Cốt Lõi Của Container — Đóng Gói Một Lần, Chạy Đồng Nhất Mọi Nơi
subtitle: Ba thực thể nền tảng biến mã nguồn (Python, Node.js, Go...) trên máy dev thành tiến trình chạy ổn định trên Production
steps:
  - icon: file-code
    badge: Bước 1 · Công thức
    title: Dockerfile
    desc: Tệp văn bản mô tả từng bước chọn OS nền, cài Python/Node runtime và chép code
    code: Dockerfile
    tone: sky
    edge: docker build
  - icon: package
    badge: Bước 2 · Image chỉ đọc
    title: Container Image
    desc: Gói nhị phân bất biến xếp chồng từ nhiều lớp chỉ đọc (read-only layers)
    code: shop-api:1.4.2
    tone: cyan
    edge: docker pull / push
  - icon: cloud
    badge: Kho trung tâm
    title: Container Registry
    desc: Kho lưu trữ và phân phối Image theo tên & tag (Docker Hub, GHCR, AWS ECR)
    code: ghcr.io/acme/shop-api
    tone: amber
    edge: docker run
  - icon: play
    badge: Bước 3 · Tiến trình sống
    title: Running Container
    desc: Tiến trình Linux cô lập đang chạy thực tế trên RAM + 1 lớp ghi tạm mỏng
    code: Up / PID 1
    tone: emerald
```

## 1. Phân biệt Máy ảo (VM) với Container, và Image với Container đang chạy

Trước khi gõ bất kỳ câu lệnh nào, hãy nắm chắc **hai cặp khái niệm nền tảng nhất** trong hệ sinh thái container:

> [!NOTE] Phân biệt Máy ảo (Virtual Machine) và Container
> - **Máy ảo (VM):** Hypervisor giả lập phần cứng để mỗi VM khởi chạy một bản hệ điều hành khách đầy đủ (**Guest OS Kernel** riêng biệt, tốn hàng GB RAM/ổ đĩa và mất vài chục giây đến cả phút để khởi động).
> - **Container:** Là một tiến trình Linux thông thường được cô lập về không gian nhìn (`Namespaces`) và giới hạn tài nguyên (`cgroups`), **dùng chung nhân Linux có sẵn của máy chủ (Host Linux Kernel)**. Nhờ bỏ qua tầng Guest OS, container chỉ nặng vài chục MB và khởi động trong **~50–80 mili-giây**. Có thể hình dung đơn giản: VM giống như xây nguyên một căn nhà tự cấp điện nước riêng, còn Container giống các căn hộ riêng tư dùng chung hạ tầng điện nước của cả tòa nhà.

> [!TIP] Phân biệt Container Image (chỉ đọc) và Container (đang chạy)
> - **Container Image:** Là gói phần mềm đóng băng **bất biến, chỉ đọc (Read-Only)** nằm trên ổ đĩa (tương tự bản thiết kế `class` trong lập trình hướng đối tượng), chứa mã nguồn, runtime và thư viện hệ thống.
> - **Container:** Là một **tiến trình đang thực thi (`instance`) trên RAM** được khởi tạo từ Image, gắn thêm **1 lớp ghi tạm mỏng (Read-Write layer)** ở trên cùng để ứng dụng ghi dữ liệu tạm. Từ **1 Image duy nhất**, bạn có thể khởi chạy hàng chục Container song song mà không tốn thêm dung lượng nhân bản các lớp nền bên dưới (tương tự như từ một khuôn mẫu có thể đúc ra nhiều sản phẩm độc lập).

```visual
kind: illustration
diagram: "kube:k00"
src: "/illustrations/kube/docker-vm-vs-container.jpg"
alt: "So sánh kiến trúc Máy ảo Hypervisor với Container chia sẻ Host Kernel và các lớp ảnh chỉ đọc OverlayFS"
title: "So Sánh Kiến Trúc: Máy Ảo (VM) vs Container Dùng Chung Nhân Linux & Lớp Ảnh Chỉ Đọc"
subtitle: "Loại bỏ hoàn toàn nhân hệ điều hành khách (Guest OS) để bật tiến trình cô lập trong vài chục mili-giây"
caption: "Đối chiếu ngăn xếp Hypervisor/Guest OS của VM với Docker Container dùng chung Host Kernel và cơ chế xếp chồng Read-Only Image Layers"
callouts:
  - num: 1
    label: "Ngăn xếp Máy ảo (VM) — Kèm Guest OS riêng biệt"
    desc: "Mỗi VM phải gánh riêng một nhân Guest OS đầy đủ bên trên tầng Hypervisor giả lập phần cứng, tiêu tốn hàng GB RAM."
    tone: rose
  - num: 2
    label: "Container — Dùng chung Host Linux Kernel"
    desc: "Mọi tiến trình container gọi thẳng syscall vào nhân Linux sẵn có của máy chủ, cô lập gọn nhẹ bằng Namespaces và cgroups."
    tone: emerald
  - num: 3
    label: "Các lớp Image bất biến & Lớp ghi tạm mỏng"
    desc: "Hàng chục container dùng chung các Read-Only Layers bên dưới và chỉ gắn thêm 1 lớp R/W mỏng ở trên cùng khi chạy."
    tone: sky
```

| Quen thuộc ở Python & Node.js | Khái niệm trong Container | Vai trò thực chất |
| --- | --- | --- |
| `pyproject.toml` / `package.json` + hướng dẫn cài OS | **`Dockerfile`** | Bản công thức văn bản mô tả từng bước chuẩn bị OS, runtime (Python/Node), chép code |
| Môi trường `.venv` / `node_modules` đóng băng kèm cả Linux | **Container Image** | Đơn vị đóng gói **chỉ đọc (read-only)** theo chuẩn OCI xếp chồng từ các lớp bất biến |
| Tiến trình sống `uvicorn main:app` / `node server.js` | **Container** | Tiến trình Linux thực thi từ Image, gắn thêm **1 lớp ghi tạm mỏng** ở trên cùng |
| Kho `PyPI` (`uv add`) / `npm` (`npm install`) | **Container Registry** | Kho trung tâm (Docker Hub, GHCR, ECR) để `docker pull` / `docker push` |

```visual
kind: layers
title: Tại Sao Container Khởi Động Trong Vài Chục Mili-Giây? (VM vs Container)
subtitle: Container KHÔNG PHẢI máy ảo thu nhỏ — nó chính là tiến trình Linux được cô lập khéo léo trên cùng nhân máy chủ
columns:
  - title: Virtual Machine (Máy ảo truyền thống)
    badge: Nặng hàng chục GB · Bật mất hàng phút
    tone: rose
    layers:
      - label: Ứng dụng + Thư viện (Python / Node / Java)
        note: Mã nguồn dịch vụ
        tone: cyan
      - label: Guest OS Kernel riêng biệt (Full Ubuntu/Windows)
        sub: Mỗi VM phải khởi động lại toàn bộ nhân hệ điều hành từ đầu
        note: Ngốn RAM & CPU thừa!
        tone: rose
      - label: Hypervisor (VMware / KVM / VirtualBox)
        note: Giả lập phần cứng ảo
        tone: amber
      - label: Host OS & Máy chủ vật lý (Server)
        note: Hạ tầng vật lý gốc
        tone: slate
    footer: Phù hợp khi cần cô lập hoàn toàn khác hệ điều hành (ví dụ chạy Windows trên máy chủ Linux)
  - title: OCI Container (Docker / containerd / Podman)
    badge: Siêu nhẹ (~MB) · Bật trong vài chục ms
    tone: emerald
    layers:
      - label: Tiến trình App + Thư viện (python:3.12-slim / node:22-alpine)
        sub: Che tầm nhìn bằng Linux Namespaces · Khóa hạn mức RAM/CPU bằng cgroups
        note: Cô lập gọn nhẹ
        tone: sky
      - label: Container Runtime (Docker Engine / containerd)
        note: Không có Guest OS!
        tone: emerald
      - label: Dùng chung Host Linux Kernel
        sub: Mọi container gọi thẳng syscall vào nhân Linux sẵn có của máy chủ
        note: Tốc độ tiệm cận Native
        tone: cyan
      - label: Máy chủ vật lý / Cloud VM
        note: Hạ tầng vật lý gốc
        tone: slate
    footer: Tiết kiệm tài nguyên tối đa · Chạy hàng trăm microservice đa ngôn ngữ trên cùng 1 node
```

## 2. Cấu trúc tên gọi Image & Các Container Engine phổ biến năm 2026

Khi bạn gặp chuỗi `ghcr.io/acme/shop-api:1.4.2`, `python:3.12-slim` hay `redis:7-alpine`, cấu trúc của nó rất giống tên gói kèm phiên bản mà bạn vẫn dùng hằng ngày:

```visual
kind: groups
title: "Cấu Trúc Tên Gọi Image — [registry]/[namespace]/[repo]:[tag]"
subtitle: "Ví dụ chuẩn: ghcr.io/acme/shop-api:1.4.2 hoặc viết gọn python:3.12-slim (= docker.io/library/python:3.12-slim)"
columns: 2
items:
  - num: 1
    title: Registry Host & Namespace
    badge: Kho lưu trữ
    tone: sky
    bullets:
      - "`ghcr.io/acme` chỉ định kho GitHub Container Registry của tổ chức `acme`"
      - "Nếu viết gọn `redis:7-alpine` hay `python:3.12-slim`, công cụ tự hiểu ngầm là **`docker.io/library/...`** trên Docker Hub chính thức"
  - num: 2
    title: Tag Phiên Bản & Biến Thể (-alpine vs -slim)
    badge: Bắt buộc ghim rõ
    tone: amber
    bullets:
      - "Nếu **bỏ trống `:tag`** (chỉ gõ `docker pull node` hay `docker pull python`), Docker tự gắn nhãn mặc định ==`:latest`== — **tuyệt đối tránh trên Production** vì hôm sau build lại có thể nhảy phiên bản gây sập app!"
      - "Với **Node.js / Go / Redis**, đuôi **`-alpine`** (Alpine Linux `musl`, ~5MB nền) rất được ưa chuộng; còn với **Python / AI / FastAPI**, cộng đồng ưu tiên **`python:3.12-slim`** (Debian `glibc` gọn nhẹ) để cài mượt các gói biên dịch C (`numpy`, `pydantic-core`, `psycopg`) không bị chậm!"
```

> [!NOTE] Hệ sinh thái Container Engine năm 2026: Không chỉ có mỗi Docker Desktop!
> Vì định dạng Image đã được chuẩn hóa mở (**OCI — Open Container Initiative**), mọi kiến thức và câu lệnh trong khóa học này đều tương thích xuyên suốt 3 bộ máy phổ biến nhất hiện nay:
> - **Docker Desktop:** Phổ biến nhất trên Windows (WSL2) và macOS, có giao diện GUI trực quan cho người mới bắt đầu.
> - **OrbStack (Khuyên dùng trên macOS Apple Silicon):** Thay thế trực tiếp Docker Desktop trên máy Mac — khởi động trong **2 giây**, tốn cực ít RAM/pin và mạng tệp tin nhanh vượt trội, giữ nguyên 100% lệnh `docker` và `docker compose`.
> - **Podman:** Bộ máy chuẩn doanh nghiệp trên Linux/RHEL với kiến trúc **không tiến trình nền (`daemonless`)** và mặc định **không cần quyền tối cao (`rootless`)**, chỉ cần đặt `alias docker=podman` là gõ y hệt câu lệnh Docker!

## 3. Vòng đời 4 bước của Container & Trải nghiệm đa ngôn ngữ đầu tay

```visual
kind: flow
title: Vòng Đời Tiến Trình Container Trên Dòng Lệnh (CLI Lifecycle)
steps:
  - icon: upload
    badge: 1. Tải Image
    title: Pull
    code: docker pull redis:7-alpine
    tone: sky
    edge: tạo + bật
  - icon: play
    badge: 2. Chạy ngầm
    title: Run (Up)
    code: docker run -d --name cache
    tone: emerald
    edge: SIGTERM (10s)
  - icon: shield
    badge: 3. Dừng êm
    title: Stop (Exited)
    code: docker stop cache
    tone: amber
    edge: giải phóng tên
  - icon: trash
    badge: 4. Xóa bỏ
    title: Remove
    code: docker rm cache
    tone: rose
```

Ưu điểm nổi bật khi thực hành là **máy tính của bạn không cần cài sẵn Python 3.12, Node 22 hay Redis** — chỉ một dòng `docker run` là bạn chạy được mọi ngôn ngữ ngay lập tức trong không gian sạch sẽ:

```bash
# Chạy thử nhanh câu lệnh Python 3.12 ngay trong container rồi tự dọn sạch (--rm):
docker run --rm python:3.12-slim python -c "import sys; print('Hello from Python', sys.version.split()[0])"

# Hoặc chạy dịch vụ Redis / Node.js chạy ngầm lâu dài ở hậu cảnh (-d):
docker run -d --name cache-dev redis:7-alpine
```

```visual
kind: groups
title: Bảng Lệnh Điều Khiển Vòng Đời Hàng Ngày [!badge:emerald:Cheat Sheet]
columns: 2
items:
  - num: 1
    title: Tải & Chạy Container Mới
    badge: Pull & Run
    tone: emerald
    bullets:
      - "**`-d` (`--detach`):** Chạy ngầm ở hậu cảnh (background), trả lại dấu nhắc Terminal ngay"
      - "**`--name`:** Đặt tên cố định dễ nhớ (tránh tên ngẫu nhiên kiểu `sleepy_euler`)"
    code: |
      docker pull redis:7-alpine                # Tải các layer vào cache máy
      docker images                             # Xem danh sách Image đang có
      docker run -d --name cache-dev redis:7-alpine
    codeLang: shell
  - num: 2
    title: Quan Sát Trạng Thái Sống & Đã Tắt
    badge: Inspect Status
    tone: sky
    bullets:
      - "`docker ps` **chỉ hiện container ĐANG CHẠY** (`Up`)"
      - "Muốn thấy cả container **đã dừng (`Exited`)** bắt buộc thêm cờ ==`-a`=="
      - "`Exited (0)` = hoàn tất bình thường · `Exited (1)` / `(137)` = sập do lỗi code hoặc tràn RAM"
    code: |
      docker ps      # Chỉ hiện container đang chạy (running)
      docker ps -a   # Hiện TẤT CẢ (gồm cả Exited đã tắt)
    codeLang: shell
  - num: 3
    title: Dừng Lịch Sự (SIGTERM) vs Rút Phích (SIGKILL)
    badge: Graceful Shutdown
    tone: amber
    bullets:
      - "**`docker stop`** gửi ==`SIGTERM`== vào PID 1, cho FastAPI / Node.js tối đa 10 giây đóng kết nối DB êm ái trước khi thoát"
      - "**`docker kill`** bắn thẳng `SIGKILL` ngắt điện tức khắc — chỉ dùng khi tiến trình treo cứng"
    code: |
      docker stop cache-dev   # Gửi SIGTERM -> chờ 10s -> Graceful Shutdown
      docker kill cache-dev   # Bắn thẳng SIGKILL rút điện ngay lập tức
    codeLang: shell
  - num: 4
    title: Dọn Dẹp Container (Giữ Nguyên Image)
    badge: Cleanup
    tone: rose
    bullets:
      - "`docker rm` **chỉ xóa Container** (tiến trình và lớp ghi tạm), còn **Image gốc vẫn nằm nguyên** trong `docker images` để lần sau khởi tạo lại tức thì!"
      - "Thêm `-f` để vừa ép dừng vừa xóa gọn trong 1 lệnh ở máy dev"
    code: |
      docker rm cache-dev      # Xóa container đã dừng (giải phóng tên)
      docker rm -f cache-dev   # Ép dừng + xóa ngay lập tức
    codeLang: shell
```

## 4. Bẫy thường gặp & Tư duy Hạ tầng Bất biến chuẩn 2026

```visual
kind: troubleshoot
title: Khắc Phục Nhanh Lỗi Kinh Điển Của Người Mới Học Container
items:
  - symptom: 'Conflict. The container name "/api" is already in use'
    badge: Bẫy số 1
    tone: amber
    cause: Container cũ bị lỗi thoát sau 0.1s nên không hiện trong `docker ps`, nhưng vỏ `Exited` của nó vẫn đang giữ tên `api`.
    fix: Liệt kê toàn bộ bằng `docker ps -a` để xem mã thoát, sau đó xóa bản cũ trước khi chạy lại.
    cmd: docker ps -a && docker rm -f api
  - symptom: Bản build hôm nay tự nhiên lỗi dù không sửa dòng code nào
    badge: Reproducibility
    tone: rose
    cause: Dùng `python:latest` hoặc `node:latest` khiến CI tự kéo phiên bản Major mới vừa phát hành trên Docker Hub.
    fix: Luôn ghim phiên bản cụ thể kèm biến thể gọn nhẹ (ví dụ `python:3.12-slim`, `node:22.12-alpine` hoặc `redis:7.4-alpine`).
```

> [!WARNING] Nguyên tắc vàng của Hạ tầng Bất biến (Immutable Infrastructure)
> Tuyệt đối không chui vào bên trong một container đang chạy để gõ `pip install`, `npm install` hay sửa tay tệp code trên Production — vì lần tới khi container khởi tạo lại từ Image gốc, mọi chỉnh sửa tay sẽ biến mất sạch! Muốn cập nhật code, hãy luôn đi đúng vòng tuần hoàn: **sửa code → build Image mới (tăng tag version) → thay thế container cũ bằng container mới**.

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - **VM** = Chạy kèm **Guest OS** riêng biệt (nặng, khởi động chậm) · **Container** = Dùng chung **Host Linux Kernel**, khởi động trong vài chục mili-giây.
> - **Image** = Đơn vị đóng gói **chỉ đọc** (`Read-only layers`) · **Container** = Tiến trình sống + 1 lớp ghi tạm mỏng (`docker rm` xóa Container nhưng không làm mất Image!).
> - Bỏ trống `:tag` = tự gắn `:latest` · Node/Go chuộng **`-alpine`**, Python/FastAPI chuộng **`-slim`** · Xem cả container đã tắt bằng `docker ps -a`.

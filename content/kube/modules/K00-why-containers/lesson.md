# Vì sao code chạy trên máy bạn nhưng sập ngay trên server?

Nếu bạn xuất phát từ hệ sinh thái **Node.js / TypeScript**, chắc chắn bạn đã từng gặp kịch bản kinh điển *"Trên máy em vẫn chạy ngon mà!"*:

- [>] Ở máy Mac cá nhân, bạn dùng **Node v22.12**, gõ `npm run dev` mượt mà không một cảnh báo.
- [!] Đẩy code lên máy chủ Ubuntu (hoặc gửi cho đồng nghiệp dùng Windows), ứng dụng sập ngay lúc khởi động vì `ERR_DLOPEN_FAILED` ở gói `sharp` / `bcrypt`, lệch múi giờ `UTC` vs `Asia/Ho_Chi_Minh`, thiếu thư viện C `libvips` / `openssl`, hoặc server vẫn kẹt ở **Node v18**.

`package-lock.json` chỉ khoá phiên bản các gói JS trong `node_modules`, nhưng **hoàn toàn bất lực** trước hệ điều hành bên dưới, kiến trúc CPU (`arm64` vs `x86_64`) hay thư viện hệ thống. **Container** ra đời để đóng băng toàn bộ ứng dụng + runtime + hệ thống tệp thành một đơn vị duy nhất: {sky:siêu nhẹ}, {amber:dễ di chuyển} và ==bất biến ở mọi nơi==.

```visual
kind: flow
title: Luồng Cốt Lõi Của Docker — Build Một Lần, Chạy Mọi Nơi
subtitle: Ba thực thể nền tảng biến mã nguồn trên máy dev thành tiến trình chạy đồng nhất trên Production
steps:
  - icon: file-code
    badge: Bước 1 · Công thức
    title: Dockerfile
    desc: Tệp văn bản mô tả từng bước chọn OS, cài Node runtime và chép code
    code: Dockerfile
    tone: sky
    edge: docker build
  - icon: package
    badge: Bước 2 · Bản mẫu chỉ đọc
    title: Container Image
    desc: Khuôn mẫu nhị phân bất biến xếp chồng từ nhiều lớp (read-only layers)
    code: shop-api:1.4.2
    tone: violet
    edge: docker pull / push
  - icon: cloud
    badge: Kho trung tâm
    title: Container Registry
    desc: Kho lưu trữ và phân phối Image theo tên & tag (Docker Hub, GHCR, ECR)
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

## 1. Bản đồ tư duy: Từ Node.js / npm sang Docker & Khác biệt với Máy ảo (VM)

```visual
kind: illustration
diagram: "kube:k00"
src: "/illustrations/kube/docker-vm-vs-container.jpg"
alt: "So sánh kiến trúc Máy ảo Hypervisor với Container chia sẻ Host Kernel và các lớp ảnh chỉ đọc OverlayFS"
title: "Giải Phẫu Kỹ Thuật: Máy Ảo (VM) vs Container Dùng Chung Nhân Linux & Lớp Ảnh Chỉ Đọc"
subtitle: "Loại bỏ hoàn toàn nhân hệ điều hành khách (Guest OS) để bật tiến trình cô lập trong vài chục mili-giây"
caption: "Đối chiếu ngăn xếp Hypervisor/Guest OS của VM với Docker Container dùng chung Host Kernel và cơ chế xếp chồng Read-Only Image Layers"
callouts:
  - num: 1
    label: "Ngăn xếp Máy ảo (VM) cồng kềnh"
    desc: "Mỗi VM phải gánh riêng một nhân Guest OS đầy đủ bên trên tầng Hypervisor giả lập phần cứng, tiêu tốn hàng GB RAM."
    tone: rose
  - num: 2
    label: "Container dùng chung Host Linux Kernel"
    desc: "Mọi tiến trình container gọi thẳng syscall vào nhân Linux sẵn có của máy chủ, cô lập gọn nhẹ bằng Namespaces và cgroups."
    tone: emerald
  - num: 3
    label: "Các lớp Image bất biến & Lớp ghi tạm"
    desc: "Hàng chục container có thể dùng chung các Read-Only Layers bên dưới và chỉ gắn thêm 1 lớp R/W mỏng ở trên cùng."
    tone: sky
```

> [!ANALOGY] Hãy hình dung như sau (Ánh xạ từ Node.js quen thuộc)
> Nếu **Container Image** giống như một **bản thiết kế + gói `.tgz` đã đóng băng cả Node lẫn Linux**, thì **Container** chính là **tiến trình sống** khi bạn bấm chạy bản thiết kế đó. Bạn có thể bật 10 Container độc lập từ cùng 1 Image trong tích tắc mà không tốn thêm dung lượng nhân bản lớp nền!

| Quen thuộc ở Node.js | Khái niệm trong Docker | Vai trò thực chất |
| --- | --- | --- |
| `package.json` + hướng dẫn cài `README.md` | **`Dockerfile`** | Bản công thức văn bản mô tả từng bước chuẩn bị OS, runtime, chép code |
| Gói nén `.tgz` + `package-lock.json` đóng băng cả OS | **Container Image** | Khuôn mẫu ==chỉ đọc (read-only)== xếp chồng từ các lớp (layers) bất biến |
| Tiến trình sống khi gõ `node dist/server.js` | **Container** | Tiến trình Linux thực thi từ Image, gắn thêm **1 lớp ghi tạm mỏng** ở trên cùng |
| Kho `registry.npmjs.org` (`npm publish` / `install`) | **Container Registry** | Kho trung tâm (Docker Hub, GHCR, ECR) để `docker pull` / `docker push` |

```visual
kind: layers
title: Tại Sao Container Khởi Động Trong Vài Chục Mili-Giây? (VM vs Container)
subtitle: Container KHÔNG PHẢI máy ảo — nó không cõng nhân hệ điều hành khách (Guest OS Kernel) riêng biệt
columns:
  - title: Virtual Machine (Máy ảo truyền thống)
    badge: Nặng hàng chục GB · Bật mất hàng phút
    tone: rose
    layers:
      - label: Ứng dụng + Thư viện (App & Bins/Libs)
        note: Mã nguồn dịch vụ
        tone: violet
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
    footer: Phù hợp khi cần cô lập hoàn toàn khác hệ điều hành (ví dụ chạy Windows trên Linux)
  - title: Docker Container (Chuẩn Cloud-Native)
    badge: Siêu nhẹ (~MB) · Bật trong vài chục ms
    tone: emerald
    layers:
      - label: Tiến trình Ứng dụng + Bins/Libs (Node 22 + Alpine)
        sub: Che mắt tầm nhìn bằng Linux Namespaces · Khoá hạn mức bằng cgroups
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
    footer: Tiết kiệm tài nguyên tối đa · Chạy hàng trăm microservice trên cùng 1 node
```

## 2. Giải phẫu định danh của một Container Image

Khi bạn gặp chuỗi `ghcr.io/acme/shop-api:1.4.2` hoặc `redis:7-alpine`, cấu trúc của nó giống hệt scoped package kèm version trong npm:

```visual
kind: groups
title: "4 Thành Phần Trong Tên Đầy Đủ Của Image — [registry]/[namespace]/[repo]:[tag]"
subtitle: "Ví dụ chuẩn: ghcr.io/acme/shop-api:1.4.2 hoặc viết gọn redis:7-alpine (= docker.io/library/redis:7-alpine)"
columns: 2
items:
  - num: 1
    title: Registry Host & Namespace
    badge: Kho lưu trữ
    tone: sky
    bullets:
      - "`ghcr.io/acme` chỉ định kho GitHub Container Registry của tổ chức `acme`"
      - "Nếu viết gọn `redis:7-alpine`, Docker tự hiểu ngầm là **`docker.io/library/redis:7-alpine`** (Docker Hub chính thức)"
  - num: 2
    title: Tag Phiên Bản & Biến Thể -alpine
    badge: Bắt buộc ghim rõ
    tone: amber
    bullets:
      - "Nếu **bỏ trống `:tag`** (chỉ gõ `docker pull node`), Docker tự gắn nhãn mặc định ==`:latest`== — **cấm kỵ trên Production** vì mất tính tái lập!"
      - "Đuôi **`-alpine`** dùng Alpine Linux (~5MB, thư viện `musl` + `apk`), kéo giảm Image Node từ **~1.1 GB** xuống chỉ còn **~135 MB**"
```

## 3. Vòng đời 5 bước của Container & Bảng lệnh cốt lõi

```visual
kind: flow
title: Vòng Đời Tiến Trình Container Trên Dòng Lệnh (CLI Lifecycle)
steps:
  - icon: upload
    badge: 1. Tải khuôn
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
    badge: 4. Xoá xác
    title: Remove
    code: docker rm cache
    tone: rose
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
      - "**`--name`:** Đặt tên cố định dễ gọi script (tránh tên ngẫu nhiên kiểu `sleepy_euler`)"
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
      - "`Exited (0)` = hoàn tất bình thường · `Exited (1)` / `(137)` = sập do lỗi hoặc hết RAM"
    code: |
      docker ps      # Chỉ hiện container đang chạy (running)
      docker ps -a   # Hiện TẤT CẢ (gồm cả Exited đã tắt)
    codeLang: shell
  - num: 3
    title: Dừng Lịch Sự (SIGTERM) vs Rút Phích (SIGKILL)
    badge: Graceful Shutdown
    tone: amber
    bullets:
      - "**`docker stop`** gửi ==`SIGTERM`== vào PID 1, cho ứng dụng tối đa 10 giây đóng kết nối DB êm ái trước khi thoát"
      - "**`docker kill`** bắn thẳng ==`SIGKILL`== ngắt điện tức khắc — chỉ dùng khi tiến trình treo cứng"
    code: |
      docker stop cache-dev   # Gửi SIGTERM -> chờ 10s -> Graceful Shutdown
      docker kill cache-dev   # Bắn thẳng SIGKILL rút điện ngay lập tức
    codeLang: shell
  - num: 4
    title: Dọn Dẹp Container (Giữ Nguyên Image)
    badge: Cleanup
    tone: rose
    bullets:
      - "`docker rm` **chỉ xoá Container** (lớp ghi tạm), còn bản gốc **Image vẫn nằm nguyên** trong `docker images` để lần sau bật tức thì!"
      - "Thêm `-f` để vừa ép dừng vừa xoá gọn trong 1 lệnh ở máy dev"
    code: |
      docker rm cache-dev      # Xoá container đã dừng (giải phóng tên)
      docker rm -f cache-dev   # Ép dừng + xoá ngay lập tức
    codeLang: shell
```

## 4. Bẫy thường gặp & Tư duy thực chiến chuẩn 2026

```visual
kind: troubleshoot
title: Khắc Phục Nhanh Lỗi Kinh Điển Của Người Mới Học Docker
items:
  - symptom: 'Conflict. The container name "/api" is already in use'
    badge: Bẫy số 1
    tone: amber
    cause: Container cũ bị lỗi thoát sau 0.1s nên không hiện trong `docker ps`, nhưng xác `Exited` của nó vẫn đang giữ tên `api`.
    fix: Liệt kê toàn bộ bằng `docker ps -a` để xem mã thoát, sau đó xoá xác cũ trước khi chạy lại.
    cmd: docker ps -a && docker rm -f api
  - symptom: Bản build hôm nay tự nhiên lỗi dù không sửa dòng code nào
    badge: Reproducibility
    tone: rose
    cause: Dùng `node` hoặc `node:latest` khiến CI tự kéo phiên bản Major mới vừa phát hành trên Docker Hub.
    fix: Luôn ghim phiên bản cụ thể kèm biến thể nhẹ (ví dụ `node:22.12-alpine` hoặc `redis:7.4-alpine`).
```

> [!TIP] Mẹo thực chiến chuẩn Docker Engine v27+ (2026)
> - [x] **Cú pháp phân nhóm tường minh:** `docker container ls` và `docker image ls` hoạt động song song với bí danh kinh điển `docker ps` và `docker images` — bạn sẽ gặp cả hai trong pipeline CI/CD.
> - [x] **Tư duy Hạ tầng Bất biến (*Immutable Infrastructure*):** Tuyệt đối không `exec` vào container đang sống để sửa tay code/config. Khi cần nâng cấp, hãy **build Image mới → xoá container cũ → bật container mới**!

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - **Image** = Khuôn mẫu **chỉ đọc** (Read-only layers) · **Container** = Tiến trình sống + 1 lớp ghi tạm.
> - Container **chia sẻ chung Host Linux Kernel** (cô lập bằng `Namespaces` + `cgroups`), không cõng Guest OS như VM.
> - Bỏ trống `:tag` = tự gắn `:latest` · Thoát thành công không lỗi = `Exited (0)` · `docker rm` không làm mất Image gốc!

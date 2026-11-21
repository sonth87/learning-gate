# Ánh xạ cổng, Biến môi trường, Đọc Log & Khám bên trong Container

Ở bài `K00`, bạn đã khởi chạy thành công `nginx:1.27-alpine` ở chế độ ngầm (`Up`). Nhưng nếu mở trình duyệt gõ `http://localhost:80`, bạn sẽ nhận ngay dòng báo lỗi lạnh lùng **`ERR_CONNECTION_REFUSED`**! Tại sao container rõ ràng đang sống mà bên ngoài lại không gọi vào được?

Hãy quay lại hình ảnh **căn hộ khép kín** ở bài trước: khi mới sinh ra, mỗi container nằm trong một **phòng mạng riêng biệt (Network Namespace)** với địa chỉ IP nội bộ riêng, đóng kín mọi cánh cửa với bên ngoài theo nguyên lý ==cô lập mạng mặc định==. Muốn khách từ trình duyệt bên ngoài bước vào được căn hộ đó, bạn phải chủ động nối một "đường dây chuông cửa" từ cổng lễ tân máy chủ vào đúng cửa phòng bên trong!

```visual
kind: flow
title: "Luồng Gói Tin Qua Cầu Nối Mạng -p HOST_PORT:CONTAINER_PORT"
subtitle: "Quy tắc bất di bất dịch: luôn đọc từ NGOÀI cổng lễ tân máy chủ (trái) đi VÀO TRONG cửa căn hộ container (phải)"
footer: "Hai container khác nhau có thể cùng mở cổng 3000 (hoặc 8000) ở bên trong, miễn là Host Port bên trái khác nhau (-p 3001:3000 và -p 3002:3000)"
steps:
  - icon: globe
    badge: Trình duyệt / Client
    title: Gọi vào Máy chủ
    desc: Người dùng mở trình duyệt gọi vào cổng trên máy tính của bạn
    code: "localhost:8080"
    tone: sky
    edge: "-p 8080:3000"
  - icon: network
    badge: Vế trái · Host Port
    title: Cổng Lễ Tân Máy Chủ (8080)
    desc: Do bạn tự chọn cổng trống trên máy mình; cấm 2 container trùng Host Port
    code: "Host :8080"
    tone: amber
    edge: NAT qua eth0
  - icon: container
    badge: Vế phải · Container Port
    title: Cửa Phòng Nội Bộ (3000)
    desc: Khớp chính xác cổng mà code Python/Node bên trong đang lắng nghe
    code: "0.0.0.0:3000"
    tone: emerald
```

## 1. Bắc cầu mạng `-p HOST_PORT:CONTAINER_PORT` & Bẫy kinh điển `127.0.0.1` vs `0.0.0.0`

```visual
kind: illustration
diagram: "kube:k01"
alt: "Sơ đồ ánh xạ cổng NAT -p 8080:3000, tiêm biến môi trường -e và luồng thu gom log stdout/stderr"
title: "Giải Phẫu Giao Tiếp Container: Cầu Nối Mạng (-p), Tiêm Biến (-e) & Dòng Chảy Log"
subtitle: "Ba kênh tương tác chuẩn 12-Factor giữa máy chủ bên ngoài và không gian mạng cô lập của Container"
caption: "Cơ chế chuyển tiếp gói tin từ cổng máy chủ qua eth0 vào 0.0.0.0:3000, nạp cấu hình động vào os.environ / process.env và thu gom luồng stdout/stderr"
callouts:
  - num: 1
    label: "Ánh xạ cổng -p 8080:3000 từ ngoài vào trong"
    desc: "Vế trái là cổng mở trên máy chủ (duy nhất), chuyển tiếp NAT qua card mạng ảo eth0 vào cổng nội bộ ở vế phải."
    tone: sky
  - num: 2
    label: "Lắng nghe 0.0.0.0 & Nhận cấu hình qua biến môi trường"
    desc: "Ứng dụng FastAPI / Node.js phải bind trên 0.0.0.0 để đón lưu lượng từ eth0 (tránh bẫy 127.0.0.1) và đọc biến từ cờ -e."
    tone: cyan
  - num: 3
    label: "Luồng xuất chuẩn stdout/stderr ra Docker Logs"
    desc: "Mọi dòng log in ra màn hình chuẩn được Docker Log Driver thu thẳng vào bộ đệm để đọc qua docker logs kể cả khi đã sập."
    tone: amber
```

Hãy luôn đọc cờ ==`-p HOST_PORT:CONTAINER_PORT`== (`--publish`) xuôi theo chiều bước chân của gói tin đi **từ ngoài máy chủ vào trong container**:

```bash
# Mở cổng 8080 trên máy bạn (trái) -> nối dây vào cổng 80 của Nginx bên trong container (phải)
docker run -d --name shop-nginx -p 8080:80 nginx:1.27-alpine

# Mở http://localhost:9090 ngoài trình duyệt -> vẫn nối vào cổng 80 nội bộ của container thứ hai!
docker run -d --name web-ui -p 9090:80 nginx:1.27-alpine
```

- [>] **Bên trái dấu `:` (`8080` hoặc `9090`) — *Host Port*:** Số cổng tại quầy lễ tân máy chủ (`http://localhost:8080`). Trên cùng một máy tính, **không thể có 2 tiến trình chiếm chung 1 Host Port** cùng lúc.
- [>] **Bên phải dấu `:` (`80`, `3000` hoặc `8000`) — *Container Port*:** Số cổng thực tế mà server Python/Node bên trong đang mở (`--port 8000` hoặc `app.listen(3000)`). Vì mỗi căn hộ container có không gian mạng độc lập, 10 container hoàn toàn có thể cùng mở cổng `3000` hoặc `8000` ở vế phải!

> [!WARNING] Mô hình tư duy giúp không bao giờ mắc lỗi `127.0.0.1` vs `0.0.0.0`!
> Rất nhiều bạn chạy `uvicorn main:app` (Python FastAPI) hoặc `vite dev` / `fastify` (Node.js) với `-p 8000:8000` chuẩn chỉ, nhưng mở trình duyệt vẫn bị đánh bật ra ngoài! Vì sao?
> - Bên trong phòng kín của container có **2 ngõ nhận tin**: vòng lặp tự kỷ nội bộ **`127.0.0.1` (`localhost`)** và cửa chính thông ra hành lang cầu nối Docker **`eth0`**.
> - Nếu server mặc định chỉ lắng nghe trên **`127.0.0.1`**, nó giống hệt người **đeo tai nghe nói chuyện một mình trong phòng khóa cửa** — chỉ tiến trình nằm sẵn bên trong cùng container đó mới gọi được!
> - Khi bạn đặt ==`0.0.0.0`== ("lắng nghe trên **tất cả** mọi cánh cửa mạng hiện có trong phòng"), server mới mở cửa `eth0` để đón lưu lượng đi từ cờ `-p` vào!

```visual
kind: compare
title: "Bẫy Mạng Kinh Điển Của Python (Uvicorn/Flask) & Node.js (Fastify/Vite): 127.0.0.1 vs 0.0.0.0"
subtitle: "Tại sao đã truyền đúng -p 8000:8000 (hoặc 3000:3000) mà trình duyệt bên ngoài vẫn báo lỗi từ chối kết nối?"
left:
  badge: "CÁCH SAI · Đóng kín cửa phòng eth0"
  title: "Mặc định chỉ nghe trên 127.0.0.1"
  tone: rose
  code: |
    # Python Uvicorn mặc định bind 127.0.0.1!
    uvicorn app.main:app --port 8000

    # Hoặc Node.js Fastify / Vite mặc định:
    app.listen({ port: 3000, host: "127.0.0.1" });
  lang: shell
  bullets:
    - "`127.0.0.1` bên trong container **chỉ nhận gói tin sinh ra từ chính bên trong container đó**"
    - "Gói tin từ trình duyệt máy chủ đi qua cầu `-p` bước vào qua cửa **`eth0`** nên bị chặn đứng ngay ngoài thềm (`Empty reply` / `Connection reset`)!"
right:
  badge: "CÁCH CHUẨN · Mở cửa cho cầu nối Docker"
  title: "Bắt buộc lắng nghe trên 0.0.0.0"
  tone: emerald
  code: |
    # Python FastAPI / Uvicorn chuẩn Container:
    uvicorn app.main:app --host 0.0.0.0 --port 8000

    # Node.js Express / Fastify chuẩn Container:
    app.listen({ port: 3000, host: "0.0.0.0" });
  lang: shell
  bullets:
    - "**`0.0.0.0`** cho phép HTTP server đón nhận kết nối từ mọi giao diện mạng bên trong container (bao gồm card mạng ảo `eth0`)"
    - "Tương tự với Flask (`--host=0.0.0.0`), Django (`0.0.0.0:8000`) hay Vite (`--host 0.0.0.0`)"
```

## 2. Truyền cấu hình động qua `-e` (`os.environ` & `process.env`)

> [!NOTE] Triết lý 12-Factor App — Một khuôn Image chạy khắp mọi môi trường
> Bạn không bao giờ muốn đóng gói cứng địa chỉ Database `localhost` vào trong Image rồi lên Staging lại phải sửa code build lại! Một Container Image chuẩn phải giữ nguyên bất biến xuyên suốt **Dev → Staging → Production**, còn mọi thông số thay đổi (URL Database, mức log, cổng chạy) được bơm từ ngoài vào lúc khởi chạy qua **biến môi trường (`-e`)**.

Khi truyền cờ `-e` (`--env`), Docker gắn thẳng các cặp `KEY=VALUE` vào bảng môi trường của tiến trình Linux:

```bash
docker run -d --name order-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  -e PORT=3000 \
  node:22-alpine
```

- [x] **Đọc tự nhiên ở mọi ngôn ngữ:** Trong **Python**, bạn đọc ngay bằng `os.environ["LOG_LEVEL"]` (hoặc `pydantic-settings`); trong **Node.js**, bạn đọc qua `process.env.LOG_LEVEL` — không cần phải chép tệp `.env` nhạy cảm vào trong Image!
- [x] **Gom gọn ở máy cá nhân:** Khi chạy thử ở laptop có 15 biến cấu hình, hãy gom vào tệp ngoài và nạp một lần bằng `--env-file .env.local`.

## 3. Theo dõi nhật ký `stdout`/`stderr` với `docker logs`

Trong thế giới container, ứng dụng **không tự mở tệp `logs/app.log` ghi ngầm vào ổ đĩa tạm bên trong** (vì xóa container là mất sạch lịch sử lỗi, hoặc tệp phình to làm đầy cứng ổ đĩa server). Thay vào đó:

- [>] Cứ in thẳng ra màn hình chuẩn: `logging.StreamHandler()` / `print(..., flush=True)` trong Python hoặc `console.log` / `pino` trong Node.js → Docker Engine tự động thu gom toàn bộ luồng **`stdout`** và **`stderr`**.
- [!] **Vũ khí cứu mạng khi container vừa bật đã tắt:** ==`docker logs` vẫn đọc được trọn vẹn lịch sử báo lỗi ngay cả khi container đã sập (`Exited (1)`)==, miễn là bạn chưa xóa nó bằng `docker rm`!

```bash
docker logs payment-worker                # In toàn bộ lịch sử stdout/stderr từ lúc khởi chạy
docker logs -f --tail 50 payment-worker   # Xem trực tiếp (-f follow) 50 dòng mới nhất theo thời gian thực
```

> [!TIP] Mẹo nhỏ cho lập trình viên Python khi đọc `docker logs`
> Python mặc định gom bộ đệm (*buffer*) đầu ra khi chạy không gắn màn hình tương tác, làm dòng `print()` có thể hiện trễ vài giây trong `docker logs -f`. Khi đóng gói Python, đặt biến môi trường `PYTHONUNBUFFERED=1` sẽ giúp từng dòng log hiện ra tức thì theo thời gian thực!

## 4. Khám xét bên trong Container đang sống với `docker exec`

Khi cần kiểm tra nhanh tiến trình đang chạy dưới tài khoản nào, biến môi trường nạp vào đã đúng chưa hoặc thử kết nối mạng từ bên trong, ta dùng ==`docker exec`==:

```bash
# Chạy 1 lệnh đơn lẻ rồi thoát ngay (KHÔNG cần -it, dùng rất gọn trong script CI/CD):
docker exec shop-api ps         # Kiểm tra PID 1, cột USER và COMMAND thực tế
docker exec shop-api printenv   # Liệt kê toàn bộ biến môi trường đang nạp
docker exec shop-api whoami     # Xem container đang chạy dưới tài khoản nào

# Mở phiên shell tương tác bên trong container tối giản (luôn ưu tiên "sh" thay vì "bash"):
docker exec -it shop-api sh
```

- **`-i` (`--interactive`):** Giữ luồng bàn phím `stdin` luôn mở để nhận từng ký tự bạn gõ.
- **`-t` (`--tty`):** Cấp phát màn hình đầu cuối ảo để hiển thị dấu nhắc `/app $` gọn đẹp.

```visual
kind: groups
title: "Bộ Công Cụ Giao Tiếp & Khám Bệnh Container [!badge:emerald:Cheat Sheet]"
columns: 2
items:
  - num: 1
    icon: file
    title: "Container Đã Sập (Exited)"
    badge: Dùng docker logs
    tone: amber
    bullets:
      - "`docker exec` **KHÔNG THỂ chạy** trên container đã `Exited`!"
      - "Phản xạ số 1 luôn là đọc `stderr` lưu lại trước lúc chết bằng `docker logs`"
    code: |
      docker ps -a              # Xem mã lỗi Exited (1)
      docker logs shop-api      # Đọc Traceback Python / Stack trace Node
    codeLang: shell
  - num: 2
    icon: search
    title: "Soi Hồ Sơ JSON Chi Tiết"
    badge: Dùng docker inspect
    tone: sky
    bullets:
      - "Trả về cấu trúc JSON đầy đủ: IP nội bộ, Mounts, Ports, `State.ExitCode`"
      - "Hoạt động trên **cả container đang `Up` lẫn container đã `Exited`**"
    code: |
      docker inspect shop-api
    codeLang: shell
  - num: 3
    icon: terminal
    title: "Container Đang Sống (Up)"
    badge: Dùng docker exec
    tone: emerald
    bullets:
      - "Bơm một tiến trình phụ vào không gian Namespaces đang hoạt động"
      - "Thêm `-it` khi người thật gõ lệnh; bỏ `-it` trong pipeline tự động"
    code: |
      docker exec shop-api ps
      docker exec -it shop-api sh
    codeLang: shell
  - num: 4
    icon: trash
    title: "Dọn Nhiều Vỏ Container Cùng Lúc"
    badge: Dùng docker rm
    tone: cyan
    bullets:
      - "`docker rm` nhận danh sách nhiều tên cách nhau bởi dấu cách"
      - "Giúp dọn sạch hàng loạt job tạm đã hoàn thành trong 1 dòng lệnh"
    code: |
      docker rm job-1 job-2
    codeLang: shell
```

## 5. Bẫy thường gặp & Lưu ý chuẩn vận hành 2026

```visual
kind: troubleshoot
title: Ba Sự Cố Thực Tế Khi Vận Hành Cổng, Shell & Mật Khẩu
items:
  - symptom: 'Bind for 0.0.0.0:8080 failed: port is already allocated'
    badge: Trùng Host Port
    tone: amber
    cause: Cổng bên trái (`8080`) trên máy chủ đang bị một container cũ (`old-proxy`) hoặc tiến trình local khác chiếm giữ.
    fix: Kiểm tra bằng `docker ps`, xóa container cũ đang giữ cổng hoặc đổi vế trái sang cổng trống khác (`-p 8081:80`).
    cmd: docker ps && docker rm -f old-proxy
  - symptom: 'OCI runtime exec failed: executable file not found in $PATH ("bash")'
    badge: Image Alpine / Slim
    tone: sky
    cause: Các image tối giản hiện đại (`node:22-alpine`, `nginx:1.27-alpine`, `redis:7-alpine`) chỉ cài sẵn `/bin/sh`, không cài `bash`.
    fix: Đổi thói quen từ `bash` sang gọi `sh` khi mở shell tương tác trên nền tối giản.
    cmd: docker exec -it shop-api sh
  - symptom: Lộ mật khẩu DB trong lịch sử dòng lệnh (.zsh_history)
    badge: Bảo mật Secret
    tone: rose
    cause: Truyền trực tiếp mật khẩu nhạy cảm dạng rõ qua `-e DB_PASS=...` trên máy chủ dùng chung.
    fix: Chỉ dùng `-e` cho cấu hình không nhạy cảm hoặc máy dev; lên Production bắt buộc dùng Docker Compose Secrets hoặc Kubernetes Secrets.
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - Luôn đọc **`-p HOST_PORT:CONTAINER_PORT`** (ngoài máy chủ trước `:` → trong container sau `:`), và server Python/Node bên trong phải lắng nghe trên **`0.0.0.0`**.
> - Biến truyền qua **`-e KEY=VALUE`** vào thẳng `os.environ` / `process.env` · Log đẩy ra `stdout`/`stderr` đọc bằng **`docker logs`** kể cả khi container đã `Exited`.
> - **`docker exec`** chỉ chạy được khi container đang `Up` (nhớ dùng `sh` thay vì `bash` trên nền Alpine)!

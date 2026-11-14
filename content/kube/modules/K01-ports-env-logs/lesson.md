# Ánh xạ cổng, Biến môi trường, Đọc Log & Khám bên trong Container

Ở bài `K00`, bạn đã khởi chạy thành công `nginx:1.27-alpine` ở chế độ ngầm (`Up`). Nhưng nếu mở trình duyệt gõ `http://localhost:80`, bạn sẽ nhận ngay cái gáo nước lạnh **`ERR_CONNECTION_REFUSED`**! Tại sao container rõ ràng đang sống mà bên ngoài lại không gọi vào được?

Câu trả lời nằm ở nguyên lý ==cô lập mặc định==: khi mới sinh ra, mỗi container nằm trong một {sky:Network Namespace} riêng biệt với địa chỉ IP nội bộ riêng, đóng kín mọi cánh cửa với card mạng máy chủ cho đến khi bạn chủ động {emerald:bắc cầu mạng}.

```visual
kind: flow
title: "Luồng Gói Tin Qua Cầu Nối Mạng -p HOST_PORT:CONTAINER_PORT"
subtitle: "Quy tắc bất di bất dịch: luôn đọc từ NGOÀI máy chủ (trái) đi VÀO TRONG container (phải)"
footer: "Hai container khác nhau có thể cùng lắng nghe cổng 3000 bên trong, miễn là Host Port bên trái khác nhau (-p 3001:3000 và -p 3002:3000)"
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
    title: Cổng Máy Chủ (8080)
    desc: Do người vận hành tự chọn cổng trống; cấm 2 container trùng Host Port
    code: "Host :8080"
    tone: amber
    edge: NAT qua eth0
  - icon: container
    badge: Vế phải · Container Port
    title: Cổng Nội Bộ (3000)
    desc: Khớp chính xác cổng mà code bên trong đang app.listen(3000)
    code: "0.0.0.0:3000"
    tone: emerald
```

## 1. Bắc cầu mạng với `-p HOST_PORT:CONTAINER_PORT`

```visual
kind: illustration
diagram: "kube:k01"
alt: "Sơ đồ ánh xạ cổng NAT -p 8080:3000, tiêm biến môi trường -e vào process.env và luồng thu gom log stdout/stderr"
title: "Giải Phẫu Giao Tiếp Container: Cầu Nối Mạng (-p), Tiêm Biến (-e) & Dòng Chảy Log"
subtitle: "Ba kênh tương tác chuẩn 12-Factor giữa máy chủ bên ngoài và không gian mạng cô lập của Container"
caption: "Cơ chế chuyển tiếp gói tin từ cổng máy chủ qua eth0 vào 0.0.0.0:3000, nạp cấu hình động vào process.env và thu gom luồng stdout/stderr"
callouts:
  - num: 1
    label: "Ánh xạ cổng -p 8080:3000 từ ngoài vào trong"
    desc: "Vế trái là cổng mở trên máy chủ (duy nhất), chuyển tiếp NAT qua card mạng ảo eth0 vào cổng nội bộ ở vế phải."
    tone: sky
  - num: 2
    label: "Lắng nghe 0.0.0.0 & Nhận cấu hình qua process.env"
    desc: "Ứng dụng Node.js phải bind trên 0.0.0.0 để đón lưu lượng từ eth0 (tránh bẫy 127.0.0.1) và đọc biến động truyền từ cờ -e."
    tone: violet
  - num: 3
    label: "Luồng xuất chuẩn stdout/stderr ra Docker Logs"
    desc: "Mọi dòng console.log và console.error trên tiến trình chính được Docker Log Driver thu thẳng vào bộ đệm để đọc qua docker logs."
    tone: amber
```

Hãy luôn đọc cờ `-p` (`--publish`) xuôi theo chiều request đi **từ ngoài máy chủ vào trong container**:

```bash
# Mở cổng 8080 trên máy bạn -> chuyển tiếp vào cổng 80 của Nginx trong container
docker run -d --name shop-nginx -p 8080:80 nginx:1.27-alpine

# Tương tự: mở http://localhost:9090 ngoài trình duyệt -> nối vào cổng 80 nội bộ
docker run -d --name web-ui -p 9090:80 nginx:1.27-alpine
```

- [>] **Bên trái dấu `:` (`8080` hoặc `9090`) — *Host Port*:** Cổng mở thực tế trên máy chủ (`http://localhost:8080`). Trên cùng một máy, **không thể có 2 container chiếm chung 1 Host Port** cùng lúc.
- [>] **Bên phải dấu `:` (`80` hoặc `3000`) — *Container Port*:** Cổng mà tiến trình bên trong (`app.listen(3000)` hoặc Nginx `listen 80;`) thực sự lắng nghe. Vì mỗi container có không gian mạng riêng, 10 container hoàn toàn có thể cùng lắng nghe cổng `3000` ở vế phải!

```visual
kind: compare
title: "Bẫy Mạng Kinh Điển Của Node.js / Fastify / Vite: 127.0.0.1 vs 0.0.0.0"
subtitle: "Tại sao đã truyền đúng -p 3000:3000 mà trình duyệt bên ngoài vẫn báo lỗi từ chối kết nối?"
left:
  badge: "CÁCH SAI · Chỉ nghe Loopback nội bộ"
  title: "Lắng nghe trên 127.0.0.1 (localhost)"
  tone: rose
  code: |
    // Fastify hoặc Vite dev mặc định hay bind 127.0.0.1
    app.listen({ port: 3000, host: "127.0.0.1" });
  lang: javascript
  bullets:
    - "`127.0.0.1` bên trong container **chỉ nhận gói tin sinh ra từ chính container đó**"
    - "Lưu lượng từ máy chủ đi qua cầu nối `-p 3000:3000` tiến vào qua card mạng ảo **`eth0`** nên bị từ chối thẳng thừng!"
right:
  badge: "CÁCH CHUẨN · Mở cho mọi giao diện mạng"
  title: "Bắt buộc lắng nghe trên 0.0.0.0"
  tone: emerald
  code: |
    // Đón nhận gói tin chuyển tiếp qua card mạng ảo eth0
    app.listen({ port: 3000, host: "0.0.0.0" });
  lang: javascript
  bullets:
    - "==`0.0.0.0`== cho phép HTTP server nhận kết nối từ mọi network interface bên trong container (bao gồm `eth0`)"
    - "Với Vite khi chạy trong Docker, luôn truyền thêm cờ `--host 0.0.0.0`"
```

## 2. Truyền cấu hình động qua `-e` (ánh xạ thẳng vào `process.env`)

> [!ANALOGY] Triết lý 12-Factor App
> Một Container Image duy nhất sau khi đóng gói phải chạy xuyên suốt **Dev -> Staging -> Production** mà **không bao giờ phải sửa code hay build lại**. Mọi tham số khác biệt (URL Database, mức log, cổng chạy) được bơm từ bên ngoài vào lúc khởi chạy!

Khi truyền cờ `-e` (`--env`), Docker gắn thẳng các cặp `KEY=VALUE` vào bảng môi trường của tiến trình Linux:

```bash
docker run -d --name order-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  node:22-alpine   # Mã nguồn đọc ngay qua process.env.NODE_ENV & process.env.PORT
```

- [x] **Đọc tự nhiên từ `process.env`:** Code Node.js truy cập tức thì `process.env.NODE_ENV` và `process.env.PORT` — không cần cài gói `dotenv` hay gọi `fs.readFileSync(".env")` trên đĩa cứng.
- [x] **Gom nhiều biến ở máy cá nhân:** Khi phát triển cục bộ có hàng chục biến cấu hình, hãy gom vào tệp và nạp gọn bằng `--env-file .env.local`.

## 3. Khám bệnh không cần mở nắp hộp: `docker logs`

Trong kiến trúc container chuẩn, ứng dụng **tuyệt đối không tự ghi log ra tệp `logs/app.log` nằm kín trong ổ đĩa tạm** (xoá container là mất sạch dấu vết, hoặc tệp phình to làm tràn ổ cứng máy chủ). Thay vào đó:

- [>] Mọi dòng `console.log(...)` đẩy ra luồng chuẩn **`stdout`** và `console.error(...)` đẩy ra **`stderr`** đều được Docker Engine tự động thu gom.
- [!] **Vũ khí cứu mạng khi container sập:** ==`docker logs` vẫn đọc được toàn bộ lịch sử lỗi ngay cả khi container đã tắt (`Exited (1)`)==, chừng nào bạn chưa xoá xác container bằng `docker rm`!

```bash
docker logs payment-worker                # In toàn bộ lịch sử stdout/stderr từ lúc khởi chạy
docker logs -f --tail 50 payment-worker   # Xem trực tiếp (follow) 50 dòng mới nhất theo thời gian thực
```

## 4. Bước vào bên trong container đang sống với `docker exec`

Khi cần kiểm tra trực tiếp tiến trình đang chạy dưới user nào, biến môi trường thực tế là gì hoặc gõ lệnh chẩn đoán mạng, ta dùng `docker exec`:

```bash
# Chạy 1 lệnh đơn lẻ rồi thoát ngay (KHÔNG cần -it, chạy tốt trong script CI/CD):
docker exec shop-api ps         # Kiểm tra PID 1, cột USER và COMMAND thực tế
docker exec shop-api printenv   # Liệt kê toàn bộ biến môi trường đang nạp
docker exec shop-api whoami     # Xem container đang chạy dưới tài khoản nào

# Mở phiên shell tương tác bên trong container Alpine (dùng "sh", không phải "bash"):
docker exec -it shop-api sh
```

- **`-i` (`--interactive`):** Giữ luồng nhập chuẩn `stdin` luôn mở để nhận từng phím bạn gõ.
- **`-t` (`--tty`):** Cấp phát thiết bị đầu cuối ảo để hiển thị dấu nhắc `/app $` rõ ràng.

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
      docker logs shop-api      # Đọc stack trace Node.js
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
    title: "Dọn Nhiều Xác Container Cùng Lúc"
    badge: Dùng docker rm
    tone: violet
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
    cause: Cổng bên trái (`8080`) trên máy chủ đang bị một container cũ (`old-proxy`) hoặc tiến trình Node local chiếm giữ.
    fix: Kiểm tra bằng `docker ps`, xoá container cũ đang giữ cổng hoặc đổi vế trái sang cổng trống khác (`-p 8081:80`).
    cmd: docker ps && docker rm -f old-proxy
  - symptom: 'OCI runtime exec failed: executable file not found in $PATH ("bash")'
    badge: Image Alpine
    tone: sky
    cause: Các image tối giản hiện đại (`node:22-alpine`, `nginx:1.27-alpine`, `redis:7-alpine`) chỉ cài sẵn `/bin/sh` (`ash`), không cài `bash`.
    fix: Đổi thói quen từ `bash` sang gọi `sh` khi mở shell tương tác trên nền Alpine.
    cmd: docker exec -it shop-api sh
  - symptom: Lộ mật khẩu DB trong lịch sử dòng lệnh (.zsh_history)
    badge: Bảo mật Secret
    tone: rose
    cause: Truyền trực tiếp mật khẩu nhạy cảm dạng rõ qua `-e DB_PASS=...` trên máy chủ dùng chung.
    fix: Chỉ dùng `-e` cho cấu hình không nhạy cảm hoặc máy dev; lên Production bắt buộc dùng Docker Compose Secrets hoặc Kubernetes Secrets.
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - Luôn đọc **`-p HOST_PORT:CONTAINER_PORT`** (ngoài máy chủ trước `:` -> trong container sau `:`), và HTTP server bên trong phải lắng nghe trên ==`0.0.0.0`==.
> - Biến truyền qua **`-e KEY=VALUE`** vào thẳng `process.env` · Log đẩy ra `stdout`/`stderr` đọc bằng **`docker logs`** kể cả khi container đã `Exited`.
> - **`docker exec`** chỉ chạy được khi container đang `Up` (nhớ dùng `sh` thay vì `bash` trên Alpine)!

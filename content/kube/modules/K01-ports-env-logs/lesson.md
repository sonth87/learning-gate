# Ánh xạ cổng, Biến môi trường, Đọc Log & Khám bên trong Container

Ở bài `K00`, bạn đã khởi chạy thành công `nginx:1.27-alpine` ở chế độ ngầm. Nhưng nếu mở trình duyệt gõ `http://localhost:80`, trình duyệt sẽ báo ngay **`ERR_CONNECTION_REFUSED`**! Tại sao container rõ ràng đang `Up` mà bên ngoài lại không gọi vào được?

Câu trả lời nằm ở nguyên lý **cô lập mặc định**: khi mới sinh ra, mỗi container giống như một căn phòng kín có địa chỉ IP nội bộ riêng, không mở bất kỳ cánh cửa nào thông ra card mạng của máy chủ cho đến khi bạn chủ động bắc cầu.

---

## 1. Bắc cầu mạng với `-p HOST_PORT:CONTAINER_PORT`

Hãy luôn đọc cờ `-p` (`--publish`) theo chiều của luồng request đi **từ ngoài máy chủ vào trong container**:

```bash
docker run -d --name shop-nginx -p 8080:80 nginx:1.27-alpine
#                                  ^^^^ ^^
#              Cổng trên máy bạn (Host)  Cổng tiến trình lắng nghe bên trong Container
```

| Vế cấu hình | Ý nghĩa thực tế | Ai quyết định số cổng này? |
| --- | --- | --- |
| **Bên trái (`8080`)** — *Host Port* | Cổng mở trên máy tính của bạn (`localhost:8080`). Trên một máy chủ, **không thể có 2 container cùng chiếm 1 Host Port** tại một thời điểm. | Do người vận hành (`docker run -p`) tuỳ ý chọn cổng còn trống |
| **Bên phải (`80` hoặc `3000`)** — *Container Port* | Cổng mà code bên trong (`app.listen(3000)` hoặc Nginx `listen 80;`) thực sự đang lắng nghe. | Do mã nguồn ứng dụng bên trong container quyết định |

### Hai cái bẫy mạng kinh điển của lập trình viên Node.js:
1. **Lỗi `port is already allocated`:** Cổng bên trái (`8080`) đang bị một container cũ (ví dụ `old-proxy`) hoặc một tiến trình Node local chiếm giữ. Bạn cần kiểm tra bằng `docker ps`, tắt/xoá container cũ (`docker rm -f old-proxy`), hoặc đổi vế trái sang cổng khác (`-p 8081:80`).
2. **Bẫy lắng nghe `127.0.0.1` trong code Node.js / Vite:** Nếu trong code Fastify hay Vite bạn viết `app.listen({ port: 3000, host: '127.0.0.1' })`, tiến trình chỉ nhận gói tin sinh ra từ *bên trong* chính container đó — cầu nối `-p 3000:3000` đi qua card mạng ảo `eth0` của container sẽ bị từ chối! Bên trong container, server HTTP **bắt buộc phải lắng nghe trên `0.0.0.0`** (`app.listen(3000, '0.0.0.0')`).

---

## 2. Truyền cấu hình động qua `-e` (ánh xạ thẳng vào `process.env`)

Theo triết lý **12-Factor App**, một Container Image duy nhất sau khi build xong phải chạy được ở cả ba môi trường **Dev → Staging → Production** mà không cần sửa code hay build lại. Toàn bộ sự khác biệt (URL cơ sở dữ liệu, mức ghi log, cổng lắng nghe) được bơm vào lúc khởi chạy qua cờ `-e` (`--env`):

```bash
docker run -d --name order-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  node:22-alpine
```

Bên trong mã nguồn Node.js, các giá trị này xuất hiện tức thì trong đối tượng quen thuộc `process.env.NODE_ENV` và `process.env.PORT` — không cần cài thư viện `dotenv` đọc file `.env` trên đĩa cứng nữa! Nếu có hàng chục biến ở môi trường phát triển cục bộ, bạn có thể gom vào tệp và nạp qua `--env-file .env.local`.

---

## 3. Khám bệnh không cần mở nắp hộp: `docker logs`

Trong kiến trúc container chuẩn, ứng dụng **không tự ghi log ra file `logs/app.log` nằm kín bên trong ổ đĩa tạm của container** (vì khi xoá container là mất sạch log, hoặc file phình to làm đầy ổ máy chủ). Thay vào đó, mọi dòng `console.log(...)` đẩy ra **`stdout`** và mọi dòng `console.error(...)` đẩy ra **`stderr`** đều được Docker Engine tự động thu gom.

```bash
docker logs payment-worker              # In toàn bộ lịch sử stdout/stderr từ lúc bật
docker logs -f --tail 50 payment-worker # Xem trực tiếp (follow) 50 dòng cuối theo thời gian thực
```

Điểm tuyệt vời nhất: **`docker logs` hoạt động ngay cả khi container đã sập (`Exited`)!** Khi một container vừa bật lên đã tắt ngóm với mã lỗi `Exited (1)`, thao tác phản xạ đầu tiên của kỹ sư DevOps luôn là gõ `docker logs <tên-container>` để đọc chính xác dòng `Error: Missing STRIPE_WEBHOOK_SECRET` hay stack trace từ Node.js.

---

## 4. Bước vào bên trong container đang sống với `docker exec`

Đôi khi log không đủ và bạn cần kiểm tra trực tiếp xem bên trong container đang chạy dưới tài khoản nào, biến môi trường thực nhận là gì, hoặc mở một phiên shell tương tác để kiểm tra kết nối mạng:

```bash
# Chạy một lệnh đơn lẻ bên trong container đang sống rồi thoát ngay:
docker exec shop-api ps
docker exec shop-api printenv
docker exec shop-api whoami

# Hoặc mở cửa sổ shell tương tác (lưu ý image Alpine dùng "sh", không có sẵn "bash"):
docker exec -it shop-api sh
```

- Cờ **`-i` (`--interactive`)** giữ luồng nhập chuẩn `stdin` luôn mở để nhận phím bạn gõ.
- Cờ **`-t` (`--tty`)** cấp phát thiết bị đầu cuối ảo để hiển thị dấu nhắc lệnh `/app $` đẹp đẽ.
- Khi dùng lệnh một phát ăn ngay như `docker exec shop-api ps`, bạn không bắt buộc phải truyền `-it` (đặc biệt quan trọng trong script CI/CD không có bàn phím TTY!).

| Tình huống chẩn đoán | Câu lệnh chuẩn nên dùng | Lưu ý thực tế |
| --- | --- | --- |
| Container vừa chạy đã sập (`Exited`) | `docker logs <tên>` | `docker exec` **không** chạy được trên container đã dừng! |
| Muốn xem cấu hình JSON chi tiết (IP, Mounts, Ports, ExitCode) | `docker inspect <tên>` | Hoạt động với cả container đang chạy lẫn đã dừng |
| Container đang `Up` nhưng nghi chạy nhầm user hay sai lệnh gốc | `docker exec <tên> ps` | Quan sát rõ PID 1, cột `USER` và `COMMAND` |
| Dọn cùng lúc nhiều container tác vụ cũ đã dừng | `docker rm job-1 job-2` | `docker rm` nhận danh sách nhiều tên cách nhau bởi dấu cách |

---

## 5. Lưu ý chuẩn vận hành 2026

- **Alpine không có `bash` mặc định:** Hầu hết các image tối giản hiện đại (`node:22-alpine`, `nginx:1.27-alpine`, `redis:7-alpine`) chỉ cài sẵn `/bin/sh` (`ash`). Nếu bạn quen tay gõ `docker exec -it shop-api bash`, Docker sẽ báo `executable file not found in $PATH` — hãy tập thói quen dùng `sh`.
- **Bảo mật thông tin nhạy cảm trên dòng lệnh:** Trên máy chủ nhiều người dùng chung, truyền mật khẩu dài trực tiếp qua `-e DB_PASS=...` có thể bị lộ trong lịch sử shell (`.zsh_history`). Ở Production, ta sẽ nâng cấp lên **Docker Compose Secrets** hoặc **Kubernetes Secrets** ở các chương sau.

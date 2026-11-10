# Viết Dockerfile đầu tiên chuẩn mực cho ứng dụng Node.js 22

Nếu `docker run` giúp bạn mượn các Image đóng gói sẵn của cộng đồng như Nginx, Redis hay PostgreSQL, thì **`Dockerfile`** chính là nơi bạn tự tay viết "bản công thức" để biến mã nguồn Express, Fastify, NestJS hoặc Next.js của chính mình thành một Container Image bất biến, sẵn sàng triển khai lên bất kỳ máy chủ hay cụm Kubernetes nào.

Hãy hình dung `Dockerfile` giống như một kịch bản tự động cài đặt máy chủ sạch từ con số 0: mỗi dòng chỉ thị viết hoa (`FROM`, `WORKDIR`, `COPY`, `ENV`, `RUN`, `EXPOSE`, `CMD`) sẽ tạo ra một bước biến đổi xác định trên hệ thống tệp của Image.

---

## 1. Bảng giải phẫu 7 chỉ thị cốt lõi trong Dockerfile

| Chỉ thị | Tương đương khi làm tay trên Linux / Node.js | Quy tắc vàng năm 2026 |
| --- | --- | --- |
| **`FROM`** | Chọn hệ điều hành + phiên bản Node cài sẵn | Luôn ghim rõ phiên bản như `FROM node:22-alpine`. Tuyệt đối tránh `FROM node:latest`! |
| **`WORKDIR`** | `mkdir -p /app && cd /app` | Luôn đặt `WORKDIR /app` trước khi `COPY` hay `RUN` để không xả rác ra thư mục gốc `/` của Linux |
| **`ENV`** | Thiết lập biến cố định vào `process.env` | Đặt `ENV NODE_ENV=production` để Express/React tắt chế độ debug tốn RAM và tối ưu tốc độ |
| **`COPY`** | Sao chép tệp từ máy ngoài vào trong Image | Ưu tiên tuyệt đối `COPY` tường minh thay vì `ADD` (vì `ADD` tự giải nén/tải URL dễ gây bất ngờ bảo mật) |
| **`RUN`** | Thực thi lệnh lúc **đang đóng gói (`docker build`)** | Dùng `RUN npm ci` thay vì `npm install` để cài đúng 100% phiên bản trong `package-lock.json` |
| **`EXPOSE`** | Tài liệu hoá cổng lắng nghe (ví dụ `3000`) | Mang tính khai báo cổng nội bộ (vẫn cần `-p` khi `docker run` nếu muốn mở ra máy chủ) |
| **`CMD`** | Câu lệnh khởi chạy mặc định lúc **`docker run`** | **Bắt buộc dùng JSON Exec Form** `CMD ["node", "src/index.js"]` thay vì Shell Form! |

---

## 2. Lựa chọn Base Image cho Node.js: Full vs `slim` vs `alpine`

Khi lên Docker Hub tìm image `node`, bạn sẽ thấy hàng chục biến thể khác nhau của cùng phiên bản **Node 22 LTS**:

- **`node:22` (Debian Full ~1.1 GB):** Cài sẵn đủ thứ công cụ biên dịch, Python, Git, ImageMagick. Quá nặng nề để đẩy qua mạng và chứa bề mặt lỗ hổng bảo mật (CVE) lớn không cần thiết.
- **`node:22-bookworm-slim` (~220 MB):** Lược bỏ công cụ thừa nhưng vẫn giữ thư viện C chuẩn **`glibc`**. Rất hợp khi dự án phụ thuộc vào các native binary đóng sẵn chỉ hỗ trợ `glibc` (một số bản Prisma cũ hoặc thư viện AI/ML).
- **`node:22-alpine` (~135 MB):** Dựa trên **Alpine Linux** dùng thư viện **`musl`**, cực nhẹ, tải siêu nhanh trên CI/CD và ít lỗ hổng hệ điều hành nhất — là **lựa chọn mặc định phổ biến nhất** cho REST/GraphQL API hiện đại.

---

## 3. Vì sao trong Dockerfile bắt buộc dùng `npm ci` thay vì `npm install`?

Ở máy cá nhân khi phát triển tính năng mới, bạn gõ `npm install` để thêm thư viện và cập nhật `package-lock.json`. Nhưng bên trong `Dockerfile`, mục tiêu tối thượng là **tính tất định (determinism)** — build hôm nay hay 6 tháng sau đều phải ra đúng từng dòng code phụ thuộc:

1. `npm ci` (*Clean Install*) **đọc nghiêm ngặt `package-lock.json`**. Nếu `package.json` và `package-lock.json` lệch nhau (do ai đó sửa tay quên lock), `npm ci` lập tức báo lỗi dừng build ngay tại chỗ thay vì âm thầm cài đại phiên bản mới!
2. `npm ci` bỏ qua bước giải bài toán phụ thuộc (dependency resolution) nên tốc độ cài đặt trên CI/CD nhanh hơn đáng kể so với `npm install`.

---

## 4. Bẫy chết người: Shell Form vs JSON Exec Form ở chỉ thị `CMD`

Hãy nhìn hai dòng `CMD` tưởng chừng y hệt nhau dưới đây:

```dockerfile
# CÁCH SAI (Shell Form):
CMD node src/index.js

# CÁCH CHUẨN (JSON Exec Form — mảng chuỗi dấu nháy kép hợp lệ):
CMD ["node", "src/index.js"]
```

Khi bạn viết dạng chuỗi thường `CMD node src/index.js`, Docker âm thầm bọc lệnh của bạn vào trong trình thông dịch shell: `/bin/sh -c "node src/index.js"`. Hệ quả tai hại:
- Tiến trình giữ vị trí **PID 1** bên trong container là `/bin/sh` chứ **không phải** `node`!
- Khi bạn gõ `docker stop` hoặc khi Kubernetes thực hiện Rolling Update thay Pod mới, hệ điều hành gửi tín hiệu **`SIGTERM`** tới **PID 1** (`/bin/sh`).
- Trình `/bin/sh` mặc định trên Alpine **không chuyển tiếp `SIGTERM`** xuống tiến trình con `node`! Mọi đoạn code `process.on('SIGTERM', () => server.close())` bạn dày công viết đều bị vô hiệu hoá hoàn toàn; container đứng đơ 10 giây rồi bị bắn hạ thô bạo bằng `SIGKILL` (`137`), làm đứt ngang các giao dịch thanh toán đang xử lý!
- Lưu ý cú pháp: JSON Exec Form bắt buộc dùng **dấu nháy kép `"..."`** (viết nháy đơn `['node', 'src/index.js']` là sai chuẩn JSON và gây lỗi). Đồng thời hãy gọi trực tiếp `["node", "src/index.js"]` thay vì `["npm", "start"]` để không kẹp thêm tiến trình `npm` trung gian.

---

## 5. Đóng gói Image bằng `docker build -t`

Sau khi hoàn chỉnh `Dockerfile` ở thư mục gốc dự án, ta biên dịch nó thành một Container Image gắn nhãn phiên bản cụ thể (Semantic Versioning):

```bash
docker build -t shop-api:1.0.0 .
```

- **`-t shop-api:1.0.0` (`--tag`):** Đặt tên kho và phiên bản rõ ràng. Bạn có thể gắn nhiều cờ `-t` cùng lúc (ví dụ gắn cả `:1.0.0` lẫn mã commit Git `:sha-a1b2c3d`).
- **Dấu chấm `.` ở cuối lệnh:** Chính là đường dẫn **Build Context** — thư mục mà Docker CLI gom gửi sang bộ máy BuildKit để thực hiện các lệnh `COPY`. Quên dấu `.` nhỏ bé này là lỗi gõ lệnh kinh điển nhất của mọi người mới học Docker!

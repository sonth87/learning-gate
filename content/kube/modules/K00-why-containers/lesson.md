# Vì sao code chạy trên máy bạn nhưng lỗi trên server?

Nếu bạn đã quen viết ứng dụng **Node.js**, chắc hẳn bạn từng gặp cảnh: ở máy cá nhân gõ `npm start` chạy mượt mà, nhưng khi đẩy code lên máy chủ (hoặc máy đồng nghiệp) thì ứng dụng sập ngay lập tức vì lệch phiên bản Node (`v18` vs `v22`), thiếu thư viện C++ ngầm của hệ điều hành (`sharp`, `bcrypt`), hoặc khác biến môi trường.

## 1. Ánh xạ từ thế giới Node.js / npm sang Container

| Khái niệm quen thuộc ở Node.js | Tương đương trong Docker | Vai trò cốt lõi |
| --- | --- | --- |
| `package.json` + kịch bản cài đặt | `Dockerfile` | Công thức khai báo cách đóng gói môi trường và mã nguồn |
| `package-lock.json` + gói `.tgz` bất biến | **Container Image** | Bản chụp đóng băng **chỉ đọc (read-only)** gồm OS tối giản + Node runtime + `node_modules` + code |
| Tiến trình đang chạy khi gõ `node server.js` | **Container** | Một tiến trình sống được khởi tạo từ Image, có lớp ghi tạm riêng |
| npm Registry (`registry.npmjs.org`) | **Container Registry** (Docker Hub, GHCR) | Kho lưu trữ để `docker pull` / `docker push` các Image |

> ** Hiểu đúng bản chất:** Container **không phải** là một máy ảo (Virtual Machine) nặng nề chứa cả nhân hệ điều hành riêng. Container thực chất chỉ là một tiến trình Linux bình thường nhưng được bao bọc bởi tường ngăn cô lập.

## 2. Vòng đời cơ bản của một Container

Khi bạn chạy lệnh dưới đây:

```bash
docker run -d --name demo-web nginx:1.27-alpine
```

Docker Engine sẽ thực hiện tuần tự:
1. Kiểm tra xem máy đã có sẵn bản chụp `nginx:1.27-alpine` chưa; nếu chưa thì tải (`pull`) từ Registry về.
2. Tạo một không gian chạy cô lập tên `demo-web` dựa trên các lớp chỉ đọc của Image đó.
3. Chạy tiến trình chính bên trong dưới chế độ chạy ngầm (`-d` / detached).

Để quan sát và dọn dẹp vòng đời container:
- `docker ps`: chỉ liệt kê các container **đang chạy** (`running`).
- `docker ps -a`: liệt kê **tất cả** container, kể cả những container đã dừng (`exited`).
- `docker stop <tên>`: gửi tín hiệu dừng lịch sự cho tiến trình bên trong.
- `docker rm <tên>`: xoá hẳn container đã dừng (hoặc `docker rm -f <tên>` để vừa dừng vừa xoá).

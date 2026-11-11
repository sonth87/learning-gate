# Vì sao code chạy trên máy bạn nhưng sập trên server?

Nếu bạn xuất phát từ hệ sinh thái **Node.js / TypeScript**, chắc chắn bạn đã ít nhất một lần nếm trải cơn ác mộng kinh điển mang tên *"Trên máy em vẫn chạy ngon mà!"*:

- Ở máy Mac cá nhân, bạn dùng **Node v22.12**, chạy `npm run dev` mượt mà không một cảnh báo.
- Khi đẩy code lên máy chủ Ubuntu sản xuất (hoặc gửi cho đồng nghiệp dùng Windows), ứng dụng sập ngay lúc khởi động với lỗi `ERR_DLOPEN_FAILED` ở gói `sharp` / `bcrypt`, lệch múi giờ `UTC` so với `Asia/Ho_Chi_Minh`, thiếu thư viện hệ thống `libvips` / `openssl`, hoặc máy chủ vẫn đang kẹt ở **Node v18** cũ kỹ.

`package-lock.json` chỉ giúp bạn khoá phiên bản các gói JavaScript trong thư mục `node_modules`, nhưng nó **hoàn toàn bất lực** trước sự khác biệt của hệ điều hành bên dưới, phiên bản Node runtime, các thư viện C/C++ biên dịch theo kiến trúc CPU (`arm64` trên Apple Silicon vs `x86_64` trên Linux server), hay quyền hạn thư mục. **Container** ra đời để đóng băng toàn bộ phần còn thiếu đó thành một khối duy nhất, bất biến và chạy giống hệt nhau ở mọi nơi.

---

## 1. Bản đồ tư duy: Từ Node.js / npm sang Docker

Để không bị choáng ngợp bởi thuật ngữ DevOps, hãy ánh xạ trực tiếp sang công việc làm web hàng ngày của bạn:

| Khái niệm quen thuộc ở Node.js | Khái niệm trong Docker | Vai trò thực chất |
| --- | --- | --- |
| `package.json` + hướng dẫn cài đặt `README.md` | **`Dockerfile`** | Bản công thức văn bản mô tả từng bước chuẩn bị hệ điều hành, cài runtime, chép code |
| Gói nén `.tgz` + `package-lock.json` đã đóng băng cả Node lẫn OS | **Container Image** | Khuôn mẫu nhị phân **chỉ đọc (read-only)** xếp chồng từ nhiều lớp (layers) bất biến |
| Tiến trình sống khi bạn gõ `node dist/server.js` | **Container** | Một tiến trình Linux đang thực thi được sinh ra từ Image, gắn thêm một lớp ghi tạm mỏng ở trên cùng |
| Kho `registry.npmjs.org` (`npm publish` / `npm install`) | **Container Registry** (Docker Hub, GHCR, ECR) | Kho lưu trữ trung tâm để tải (`docker pull`) hoặc đẩy (`docker push`) các Image theo tên và tag |

> **Hiểu đúng bản chất cốt lõi:** Container **KHÔNG PHẢI** là một máy ảo (Virtual Machine — VM) nặng hàng chục GB. Một VM phải cõng thêm cả một nhân hệ điều hành khách (Guest OS Kernel) riêng biệt, tốn hàng phút để khởi động. Ngược lại, **Container chỉ là một tiến trình bình thường** dùng chung nhân Linux với máy chủ, nhưng bị nhân Linux che mắt bằng **Namespaces** (chỉ thấy file, mạng, PID của riêng nó) và khoá hạn mức tài nguyên bằng **cgroups**. Nhờ vậy, một container `nginx:1.27-alpine` hay `redis:7-alpine` bật lên chỉ trong **vài chục mili-giây**!

---

## 2. Giải phẫu định danh của một Container Image

Khi bạn thấy chuỗi `ghcr.io/acme/shop-api:1.4.2` hoặc `redis:7-alpine`, cấu trúc của nó giống hệt cách đặt tên scoped package kèm version trong npm:

```text
[registry-host]/[namespace]/[repository]:[tag]
   docker.io   /  library  /   redis    : 7-alpine
```

- Nếu bạn viết ngắn gọn `redis:7-alpine`, Docker ngầm hiểu kho mặc định là Docker Hub (`docker.io/library/redis:7-alpine`).
- Nếu bạn **bỏ quên phần tag** (chỉ gõ `docker pull node`), Docker sẽ tự động gắn nhãn mặc định `:latest`. Trong môi trường thực tế năm 2026, dùng `:latest` bị coi là lỗi cấu hình nghiêm trọng vì bạn đánh mất tính tái lập (reproducibility) — hôm nay build ra Node 22 nhưng vài tháng sau CI tự tải Node 24 làm sập hệ thống.
- Đuôi `-alpine` chỉ biến thể dùng **Alpine Linux** siêu gọn (~5MB nền tảng, dùng thư viện `musl` và trình quản lý gói `apk`), giúp giảm kích thước Image Node.js từ hơn **1.1 GB** xuống còn khoảng **135 MB**.

---

## 3. Vòng đời 5 bước của một Container trên CLI

Làm việc với Docker hàng ngày xoay quanh 5 thao tác điều khiển vòng đời tiến trình rất trực quan:

### Bước 1: Tải khuôn mẫu về máy (`docker pull`)
```bash
docker pull redis:7-alpine
docker images
```
Các lớp (layers) của Image được tải về và lưu vào bộ nhớ đệm cục bộ. Nếu sau đó bạn tải một Image khác dùng chung nền Alpine 3.20, Docker thông minh bỏ qua lớp nền đã có sẵn, tiết kiệm băng thông tối đa.

### Bước 2: Khởi tạo và chạy tiến trình (`docker run`)
```bash
docker run -d --name cache-dev redis:7-alpine
```
- **`-d` (`--detach`):** Chạy ngầm ở hậu cảnh (background) và trả lại dấu nhắc Terminal ngay lập tức — tương tự việc quản lý dịch vụ qua PM2 thay vì treo cứng cửa sổ dòng lệnh.
- **`--name cache-dev`:** Đặt tên định danh dễ nhớ. Nếu bỏ qua cờ này, Docker sẽ tự sinh tên ngẫu nhiên kiểu `sleepy_euler` rất khó viết script tự động.

### Bước 3: Quan sát tiến trình đang sống và đã tắt (`docker ps`)
```bash
docker ps       # Chỉ hiện container ĐANG CHẠY (status = Up / running)
docker ps -a    # Hiện TẤT CẢ container, bao gồm cả container ĐÃ DỪNG (Exited)
```
Đây là bẫy số 1 của người mới: bạn chạy một container bị lỗi cấu hình khiến tiến trình Node.js thoát ngay sau 0.1 giây. Khi gõ `docker ps` thấy trống trơn, bạn tưởng container "chưa từng được tạo", bèn gõ lại `docker run --name api ...` và lập tức ăn lỗi:
`Conflict. The container name "/api" is already in use`.
Thực tế, xác container cũ vẫn nằm ở trạng thái **Exited** — chỉ khi gõ `docker ps -a` bạn mới nhìn thấy nó cùng mã thoát (`Exited (0)` là hoàn tất bình thường, khác `0` như `Exited (1)` hay `Exited (137)` là gặp sự cố).

### Bước 4: Dừng tiến trình lịch sự (`docker stop`)
```bash
docker stop cache-dev
```
`docker stop` gửi tín hiệu **`SIGTERM`** vào tiến trình gốc (PID 1) để ứng dụng có tối đa 10 giây đóng kết nối Database, xả nốt các HTTP request đang xử lý dở (Graceful Shutdown) trước khi thoát. Ngược lại, `docker kill` bắn thẳng **`SIGKILL`** rút phích điện tức khắc — chỉ dùng khi tiến trình bị treo cứng không phản hồi.

### Bước 5: Dọn dẹp hoàn toàn (`docker rm`)
```bash
docker rm cache-dev      # Xoá hẳn container đã dừng (giải phóng tên "cache-dev")
docker rm -f cache-dev   # Vừa ép dừng vừa xoá ngay trong 1 lệnh (rất tiện ở môi trường dev)
```
Lưu ý quan trọng: `docker rm` chỉ xoá **Container** (lớp ghi tạm và siêu dữ liệu tiến trình), còn bản gốc **Container Image** (`redis:7-alpine`) vẫn nằm nguyên trong `docker images` để lần sau `docker run` bật lên tức thì không cần tải lại mạng!

---

## 4. Ghi chú thực chiến chuẩn 2026

- **Docker Engine v27+ / Docker Desktop 4.34+:** Các câu lệnh phân nhóm tường minh như `docker container ls`, `docker image ls` hoạt động song song với các bí danh kinh điển `docker ps`, `docker images`. Khi đọc tài liệu hoặc script CI/CD, bạn sẽ gặp cả hai cách viết này.
- **Tư duy Bất biến (Immutable Infrastructure):** Khác với máy chủ truyền thống nơi bạn SSH vào sửa tay file cấu hình, một Container được thiết kế như "thực thể dùng một lần": khi cần nâng cấp code hay đổi cấu hình, ta xoá container cũ và tạo container mới từ Image mới thay vì chỉnh sửa chắp vá bên trong container đang sống.

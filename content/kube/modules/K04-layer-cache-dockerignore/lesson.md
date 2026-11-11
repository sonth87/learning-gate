# Tối ưu tốc độ Build gấp 20 lần với Layer Cache, `.dockerignore` & Build Args

Bạn đã viết được `Dockerfile` đầu tiên chạy ngon lành ở bài `K03`. Thế nhưng chỉ vài ngày sau, cả nhóm bắt đầu than trời: *"Mỗi lần em chỉ sửa đúng 1 chữ chính tả trong `src/routes/health.js` mà chạy `docker build` lại phải ngồi chờ tải và cài lại `npm ci` mất gần 2 phút!"*, chưa kể dung lượng Image phình lên gần 900 MB và vô tình dính cả tệp `.env` chứa mật khẩu máy cá nhân!

Bài học này giải quyết triệt để cả ba vấn đề đó bằng cơ chế **Layer Cache** của BuildKit và lá chắn **`.dockerignore`**.

---

## 1. Quy luật bất biến của Docker Layer Cache

Mỗi chỉ thị `FROM`, `WORKDIR`, `COPY`, `RUN` trong `Dockerfile` tạo ra một **lớp (layer) chỉ đọc** xếp chồng lên lớp trước đó. Khi bạn chạy lại `docker build`, bộ máy BuildKit kiểm tra từ trên xuống dưới:

- Với lệnh `COPY`: BuildKit tính mã băm (checksum SHA256) của toàn bộ tệp nguồn được chép vào. Nếu không một byte nào thay đổi, nó báo **`CACHED` (0.0 giây)**!
- **Quy tắc dây chuyền (Domino Invalidation):** Ngay khoảnh khắc **một lớp bị mất cache** (vì tệp trong `COPY` vừa sửa), **TOÀN BỘ các lớp đứng phía dưới nó đều bị buộc phải chạy lại từ đầu**, bất kể câu lệnh ở dưới không hề đổi chữ nào!

Hãy so sánh hai thứ tự viết dưới đây để thấy sự khác biệt một trời một vực:

```dockerfile
# ❌ THỨ TỰ TỒI: Sửa 1 dòng trong src/server.js -> COPY . . đổi mã băm -> RUN npm ci MẤT CACHE!
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci

# ✅ THỨ TỰ CHUẨN: Tách riêng file khai báo thư viện lên TRƯỚC khi chép mã nguồn!
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
```

Với thứ tự chuẩn ở dưới, 99% các lần sửa code hàng ngày chỉ động vào thư mục `src/`. Khi đó `package.json` và `package-lock.json` giữ nguyên 100% mã băm → bước nặng nhất `RUN npm ci` được lấy thẳng từ Cache trong **0.0 giây**!

---

## 2. Lá chắn `.dockerignore`: Bảo vệ tốc độ lẫn Bí mật

Khi bạn gõ `docker build -t shop-api:1.0.0 .`, bước đầu tiên Docker làm là đóng gói thư mục `.` (**Build Context**) gửi cho trình biên dịch. Nếu thiếu tệp **`.dockerignore`**, ba thảm hoạ sẽ xảy ra cùng lúc:

1. **Chậm nghẽn và lỗi kiến trúc nhị phân:** Cả thư mục `node_modules` nặng 500 MB trên máy Mac (`darwin-arm64`) bị gửi vào và chép đè lên container Linux (`linux-musl`) khi chạy `COPY . .`.
2. **Làm vỡ cache vô cớ:** Thư mục `.git` đổi nội dung mỗi khi bạn `git commit` khiến dòng `COPY . .` luôn mất cache dù code thực tế không đổi.
3. **Rò rỉ bí mật nghiêm trọng:** Các tệp `.env`, `.env.local`, `*.pem` nằm lặng lẽ trên ổ cứng bị chép thẳng vào trong lớp Image!

### Cú pháp loại trừ và quy tắc phủ định `!` trong `.dockerignore`
Tệp `.dockerignore` đọc tuần tự từ trên xuống dưới; **quy tắc xuất hiện sau sẽ ghi đè quy tắc trước đó**, cho phép dùng dấu chấm than `!` để giữ lại ngoại lệ tinh tế:

```dockerignore
node_modules
.git
.env
.env.*
coverage
dist

# Chặn mọi tài liệu Markdown nội bộ, NHƯNG giữ lại duy nhất README.md ở thư mục gốc:
*.md
!README.md
```

> **Cẩn thận bẫy chặn nhầm:** Đừng bao giờ viết `*.json` bừa bãi trong `.dockerignore` vì nó sẽ chặn mất luôn cả `package.json`, `package-lock.json` và các tệp cấu hình ứng dụng trong `src/`!

---

## 3. Phân biệt `ARG` (lúc Build) và `ENV` (lúc Run)

| Thuộc tính | **`ARG`** (*Build Argument*) | **`ENV`** (*Environment Variable*) |
| --- | --- | --- |
| **Tồn tại ở giai đoạn nào?** | **Chỉ tồn tại trong lúc `docker build`** (biến mất khi container khởi chạy!) | Tồn tại cả lúc `docker build` (từ dòng khai báo trở xuống) **VÀ lúc container chạy thật (`process.env`)** |
| **Cách ghi đè từ CLI** | `docker build --build-arg APP_VERSION=1.2.3 .` | `docker run -e NODE_ENV=staging ...` |
| **Có chứa được Secret không?** | **KHÔNG!** Hiển thị rõ trong `docker history` | **KHÔNG!** Hiển thị rõ trong `docker inspect` |

Một mẫu thiết kế cực kỳ phổ biến trên CI/CD để đóng dấu phiên bản phát hành vào API `/healthz`: dùng `ARG` nhận số phiên bản từ Git tag lúc build, rồi gán nối tiếp sang `ENV` để `process.env.APP_VERSION` đọc được lúc chạy:

```dockerfile
FROM node:22-alpine
WORKDIR /app
ARG APP_VERSION=1.0.0
ENV APP_VERSION=$APP_VERSION
```

---

## 4. Gộp và dọn sạch bộ nhớ đệm trình quản lý gói hệ thống (`apk` / `apt-get`)

Đôi khi ứng dụng Node.js cần cài thêm một tiện ích hệ thống nhỏ như `curl`, `openssl` hay `tzdata`. Vì mỗi dòng `RUN` là một lớp bất biến cộng dồn dung lượng:

- **Trên Alpine (`apk`):** Luôn dùng cờ `--no-cache` ngay trong một dòng duy nhất:
  ```dockerfile
  # Chuẩn gọn: tải chỉ mục trực tiếp trên RAM, không lưu rác cache vào layer
  RUN apk add --no-cache curl
  ```
  Tránh viết tách hai dòng `RUN apk update` rồi `RUN apk add curl` (vừa lưu lại rác chỉ mục làm nặng Image, vừa dễ dính lỗi stale cache 404 khi gói trên máy chủ Alpine cập nhật bản mới).
- **Trên Debian/Ubuntu (`apt-get`):** Luôn nối liền `apt-get update && apt-get install -y --no-install-recommends ... && rm -rf /var/lib/apt/lists/*` trong **cùng một lệnh `RUN`**.

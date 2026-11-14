# Viết Dockerfile đầu tiên chuẩn mực cho ứng dụng Node.js 22

Nếu `docker run` giúp bạn mượn sẵn Image cộng đồng như Nginx, Redis hay PostgreSQL, thì **`Dockerfile`** chính là nơi bạn tự viết **"bản công thức tự động"** biến mã nguồn Express, Fastify, NestJS hoặc Next.js thành một **Container Image bất biến** chạy đồng nhất từ laptop lên Kubernetes.

> [!ANALOGY] Hãy hình dung như sau
> Hãy coi `Dockerfile` như kịch bản lắp ráp máy chủ sạch từ con số 0: mỗi dòng chỉ thị viết hoa (`FROM`, `WORKDIR`, `COPY`, `RUN`, `CMD`) đắp thêm **một lớp (layer) xác định** lên hệ thống tệp của Image.

```visual
kind: flow
title: Hành Trình Đóng Gói Ứng Dụng Node.js Từ Mã Nguồn Thành Image
steps:
  - icon: folder-git
    badge: Thư mục dự án
    title: Build Context (.)
    desc: Mã nguồn + package-lock.json + Dockerfile gửi sang BuildKit
    code: "."
    tone: sky
    edge: FROM -> WORKDIR
  - icon: layers
    badge: Build-time
    title: Lắp Ráp Từng Layer
    desc: Chép manifest, chạy RUN npm ci, thiết lập ENV production
    code: RUN npm ci
    tone: violet
    edge: docker build -t
  - icon: package
    badge: Artifact bất biến
    title: Image Gắn Tag Rõ Ràng
    desc: Sẵn sàng chạy với tiến trình Node giữ trực tiếp PID 1
    code: shop-api:1.0.0
    tone: emerald
```

## 1. Giải phẫu 7 chỉ thị cốt lõi trong Dockerfile

```visual
kind: illustration
diagram: "kube:k03"
alt: "Dây chuyền chỉ thị Dockerfile từ FROM đến CMD và sự khác biệt giữa Exec Form với Shell Form đối với tín hiệu PID 1"
title: "Giải Phẫu Dây Chuyền Dockerfile & Cơ Chế Bắt Tín Hiệu Dừng Của PID 1"
subtitle: "Phân định rạch ròi các bước đóng gói lúc Build-time với lệnh khởi chạy tiến trình chuẩn Exec Form lúc Run-time"
caption: "Chuỗi lắp ráp các lớp chỉ thị Dockerfile chuẩn Node 22 LTS và lý do bắt buộc viết CMD dạng mảng JSON để nhận trực tiếp tín hiệu SIGTERM"
callouts:
  - num: 1
    label: "Chuỗi chỉ thị đắp từng lớp lúc Build-time"
    desc: "FROM, WORKDIR, COPY và RUN npm ci thực thi tuần tự trong lúc đóng gói để tạo ra các lớp ảnh bất biến."
    tone: sky
  - num: 2
    label: "Bẫy Shell Form làm mù tín hiệu dừng"
    desc: "Viết CMD npm start khiến /bin/sh chiếm ghế PID 1 và nuốt mất tín hiệu SIGTERM, làm container treo 10s rồi bị rút điện SIGKILL."
    tone: rose
  - num: 3
    label: "Chuẩn Exec Form trao thẳng ghế PID 1 cho Node"
    desc: "Cú pháp mảng JSON CMD [\"node\", \"server.js\"] giúp tiến trình Node nhận trực tiếp SIGTERM để đóng kết nối êm ái không rớt request."
    tone: emerald
```

```visual
kind: anatomy
title: 7 Chỉ Thị Nền Tảng Mọi Kỹ Sư Backend Phải Thuộc Lòng
subtitle: Đọc từ trên xuống dưới theo đúng thứ tự xuất hiện chuẩn mực trong một Dockerfile thực tế
items:
  - keyword: FROM
    role: Lớp nền khởi đầu
    tone: amber
    summary: Chọn hệ điều hành gốc và phiên bản Node runtime cài sẵn.
    bullets:
      - Luôn là chỉ thị mở đầu (trừ khi khai báo biến `ARG` trước đó)
      - Luôn ghim rõ phiên bản, **tuyệt đối tránh `FROM node:latest`**!
    example: FROM node:22-alpine
    lang: dockerfile
  - keyword: WORKDIR
    role: Thư mục làm việc
    tone: sky
    summary: Tương đương `mkdir -p /app && cd /app` cho mọi bước phía sau.
    bullets:
      - Tự tạo thư mục nếu chưa tồn tại
      - Ngăn việc vô tình xả rác mã nguồn thẳng ra thư mục gốc `/` của Linux
    example: WORKDIR /app
    lang: dockerfile
  - keyword: ENV
    role: Biến môi trường bền vững
    tone: cyan
    summary: Gắn biến cố định vào `process.env` tồn tại cả lúc build lẫn lúc chạy container.
    bullets:
      - Luôn bật `NODE_ENV=production` để framework tối ưu bộ nhớ và tốc độ
    example: ENV NODE_ENV=production
    lang: dockerfile
  - keyword: COPY
    role: Chép tệp minh bạch
    tone: emerald
    summary: Sao chép tệp/thư mục từ **Build Context** bên ngoài vào bên trong Image.
    bullets:
      - "**Ưu tiên tuyệt đối `COPY` thay vì `ADD`** (`ADD` tự giải nén `.tar` và tải URL ngầm dễ gây rủi ro bảo mật)"
    example: COPY package*.json ./
    lang: dockerfile
  - keyword: RUN
    role: Thực thi lúc đóng gói
    tone: violet
    summary: Chạy câu lệnh Linux **ngay trong lúc `docker build`** để cài gói hoặc biên dịch TS, tạo ra một layer mới.
    bullets:
      - Dùng `RUN npm ci` thay cho `npm install` để khóa chặt 100% theo lockfile
    example: RUN npm ci --omit=dev
    lang: dockerfile
  - keyword: EXPOSE
    role: Tài liệu hoá cổng
    tone: sky
    summary: Khai báo siêu dữ liệu (metadata) rằng dịch vụ bên trong lắng nghe ở cổng nào.
    bullets:
      - "**KHÔNG tự động mở cổng ra ngoài máy chủ** — lúc chạy thật vẫn phải truyền cờ `-p 3000:3000`"
    example: EXPOSE 3000
    lang: dockerfile
  - keyword: CMD
    role: Lệnh khởi chạy mặc định
    tone: emerald
    summary: Câu lệnh thực thi khi container khởi động lúc gõ **`docker run`**.
    bullets:
      - "**Bắt buộc viết dạng mảng JSON Exec Form** với dấu nháy kép `\"...\"` để `node` giữ **PID 1**"
    example: CMD ["node", "src/index.js"]
    lang: dockerfile
```

## 2. Chọn Base Image nào cho Node.js 22: Full vs `slim` vs `alpine`?

```visual
kind: groups
title: So Sánh 3 Biến Thể Image Chính Thức Của Node 22 LTS
columns: 3
items:
  - num: 1
    title: node:22 (Debian Full)
    badge: ~1.1 GB · Tránh dùng Prod
    tone: rose
    bullets:
      - Cài sẵn Python, Git, trình biên dịch C++, ImageMagick...
      - Kéo mạng rất chậm trên CI/CD
      - Bề mặt lỗ hổng bảo mật (CVE) phình to không cần thiết
    footer: Chỉ hợp làm stage tạm để compile gói nặng
  - num: 2
    title: node:22-bookworm-slim
    badge: ~220 MB · Chuẩn glibc
    tone: sky
    bullets:
      - Đã gọt bỏ công cụ thừa nhưng giữ thư viện C chuẩn **`glibc`**
      - Tương thích cao với các native binary đóng sẵn yêu cầu `glibc` (AI/ML, một số driver C++ đặc thù)
    footer: Khuyên dùng khi vướng thư viện native kén musl
  - num: 3
    title: node:22-alpine
    badge: ~135 MB · Khuyên dùng
    tone: emerald
    bullets:
      - Nền **Alpine Linux** siêu gọn dùng thư viện **`musl`**
      - Tải cực nhanh, tốn ít ổ cứng và ít CVE hệ điều hành nhất
      - Lựa chọn mặc định phổ biến số 1 cho REST / GraphQL API hiện đại
    footer: Mặc định vàng cho Microservices Node.js
```

## 3. Vì sao trong Dockerfile bắt buộc dùng `npm ci` thay vì `npm install`?

Ở máy cá nhân khi thêm thư viện mới, bạn dùng `npm install`. Nhưng bên trong `Dockerfile`, mục tiêu tối thượng là ==tính tất định (determinism)== — build hôm nay hay 6 tháng sau đều phải ra đúng từng dòng phụ thuộc:

- [x] **Khóa cứng theo `package-lock.json`:** Nếu `package.json` và `package-lock.json` lệch nhau (do ai đó sửa tay quên cập nhật lock), **`npm ci` báo lỗi dừng build ngay lập tức** thay vì âm thầm cài đại phiên bản mới!
- [x] **Nhanh và sạch cho CI/Docker:** `npm ci` (*Clean Install*) bỏ qua bước tính toán lại cây phụ thuộc nên cài đặt nhanh và ổn định hơn hẳn `npm install`.

## 4. Bẫy chết người số 1: Shell Form vs JSON Exec Form ở `CMD`

```visual
kind: compare
title: "Giải Phẫu PID 1 & Tín Hiệu Dừng SIGTERM Khi Viết CMD"
subtitle: Chỉ khác nhau cặp ngoặc vuông JSON nhưng quyết định ứng dụng tắt êm hay đứt ngang giao dịch của khách hàng!
left:
  badge: "CÁCH SAI · Shell Form"
  title: Docker âm thầm bọc vào /bin/sh -c
  tone: rose
  code: |
    # Bị biến thành: /bin/sh -c "node src/index.js"
    CMD node src/index.js

    # Cũng SAI chuẩn JSON (dùng nháy đơn):
    CMD ['node', 'src/index.js']
  lang: dockerfile
  bullets:
    - "Tiến trình giữ ==PID 1== là `/bin/sh` chứ **không phải** `node`"
    - "Khi `docker stop` hay K8s Rolling Update gửi `SIGTERM` tới PID 1, `/bin/sh` trên Alpine **nuốt luôn tín hiệu**, không chuyển xuống `node`!"
    - "Hàm `process.on('SIGTERM')` bị vô hiệu hoá; container treo đơ 10s rồi bị bắn hạ bằng **`SIGKILL (137)`** làm rớt request đang xử lý"
right:
  badge: "CÁCH CHUẨN · JSON Exec Form"
  title: Gọi thẳng tiến trình Node làm PID 1
  tone: emerald
  code: |
    # Mảng JSON hợp lệ dùng dấu nháy kép "..."
    CMD ["node", "src/index.js"]
  lang: dockerfile
  bullets:
    - "Chính tiến trình **`node` giữ trực tiếp ==PID 1==** trong không gian tên container"
    - "Nhận thẳng tín hiệu `SIGTERM` từ hệ điều hành để đóng HTTP server & trả kết nối DB êm ái (*Graceful Shutdown*)"
    - "Gọi trực tiếp `[\"node\", ...]` thay vì `[\"npm\", \"start\"]` để không kẹp thêm tiến trình `npm` trung gian"
```

## 5. Đóng gói Image hoàn chỉnh với `docker build -t`

```dockerfile Dockerfile chuẩn cơ bản (Node 22 LTS)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

Biên dịch `Dockerfile` ở thư mục hiện tại thành Image mang nhãn Semantic Versioning rõ ràng:

```bash
docker build -t shop-api:1.0.0 .   # Đừng quên dấu chấm "." ở cuối lệnh!
```

> [!WARNING] Cẩn thận dấu chấm `.` nhỏ bé ở cuối lệnh `docker build`!
> Dấu ==`.`== ở cuối lệnh chính là đường dẫn **Build Context** — thư mục mà Docker CLI gom gửi sang bộ máy BuildKit để tìm `Dockerfile` và thực hiện các lệnh `COPY`. Quên dấu `.` là lỗi cú pháp kinh điển nhất khi mới gõ `docker build`!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Ưu tiên `COPY` hơn `ADD`** · **Ưu tiên `RUN npm ci` hơn `npm install`** · **Ghim rõ `FROM node:22-alpine`**.
> - `EXPOSE 3000` chỉ là tài liệu khai báo cổng, **không** tự publish cổng ra ngoài host.
> - Luôn viết **`CMD ["node", "src/index.js"]`** (mảng JSON dấu nháy kép) để `node` nhận **PID 1** và xử lý được `SIGTERM`.

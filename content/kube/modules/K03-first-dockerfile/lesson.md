# Viết Dockerfile đầu tiên chuẩn Production (Node.js 22 & Python 3.12 + uv)

Nếu `docker run` giúp bạn mượn sẵn Image cộng đồng như Nginx, Redis hay PostgreSQL, thì **`Dockerfile`** chính là nơi bạn tự viết **"bản công thức tự động"** biến mã nguồn **Node.js (`Express`, `NestJS`)** hay **Python (`FastAPI`, `Django`)** của chính bạn thành một **Container Image bất biến** chạy đồng nhất từ laptop lên Kubernetes.

> [!NOTE] Cơ chế xếp lớp (Layers) trong Dockerfile
> `Dockerfile` là kịch bản khai báo từng bước tạo môi trường chạy ứng dụng từ một Base Image có sẵn: mỗi dòng chỉ thị viết hoa (`FROM`, `WORKDIR`, `COPY`, `RUN`, `CMD`) tạo ra **một lớp (layer) chỉ đọc xác định** chồng lên hệ thống tệp của Image. Quy luật này giống hệt nhau dù bạn viết bằng Node.js, Python hay Go.

```visual
kind: flow
title: Hành Trình Đóng Gói Ứng Dụng Từ Mã Nguồn Thành Image Chuẩn OCI
steps:
  - icon: folder-git
    badge: Thư mục dự án
    title: Build Context (.)
    desc: Mã nguồn + tệp lockfile (package-lock.json / uv.lock) + Dockerfile gửi sang BuildKit
    code: "."
    tone: sky
    edge: FROM -> WORKDIR
  - icon: layers
    badge: Build-time
    title: Lắp Ráp Từng Layer
    desc: Chép lockfile, khóa chặt cài đặt bằng npm ci hoặc uv sync --frozen
    code: RUN npm ci / uv sync
    tone: cyan
    edge: docker build -t
  - icon: package
    badge: Artifact bất biến
    title: Image Gắn Tag Rõ Ràng
    desc: Sẵn sàng chạy với tiến trình chính giữ trực tiếp ghế PID 1 (Exec Form)
    code: shop-api:1.0.0
    tone: emerald
```

## 1. 7 chỉ thị cốt lõi trong mọi Dockerfile

```visual
kind: illustration
diagram: "kube:k03"
alt: "Dây chuyền chỉ thị Dockerfile từ FROM đến CMD và sự khác biệt giữa Exec Form với Shell Form đối với tín hiệu PID 1"
title: "Cấu Trúc Chỉ Thị Dockerfile & Cơ Chế Bắt Tín Hiệu Dừng Của PID 1"
subtitle: "Phân định rạch ròi các bước đóng gói lúc Build-time với lệnh khởi chạy tiến trình chuẩn Exec Form lúc Run-time"
caption: "Chuỗi lắp ráp các lớp chỉ thị Dockerfile chuẩn mực và lý do bắt buộc viết CMD dạng mảng JSON để nhận trực tiếp tín hiệu SIGTERM"
callouts:
  - num: 1
    label: "Chuỗi chỉ thị đắp từng lớp lúc Build-time"
    desc: "FROM, WORKDIR, COPY và RUN thực thi tuần tự trong lúc đóng gói để tạo ra các lớp ảnh bất biến."
    tone: sky
  - num: 2
    label: "Shell Form làm mất tín hiệu dừng SIGTERM"
    desc: "Viết CMD dạng chuỗi khiến /bin/sh chiếm PID 1 và nuốt mất tín hiệu SIGTERM, làm container treo 10s rồi bị ngắt bằng SIGKILL."
    tone: rose
  - num: 3
    label: "Exec Form trao trực tiếp PID 1 cho ứng dụng"
    desc: "Cú pháp mảng JSON CMD [\"node\", ...] hoặc [\"uvicorn\", ...] giúp ứng dụng nhận trực tiếp SIGTERM để đóng kết nối êm ái."
    tone: emerald
```

```visual
kind: anatomy
title: 7 Chỉ Thị Nền Tảng Mọi Kỹ Sư Backend & AI Phải Thuộc Lòng
subtitle: Đọc từ trên xuống dưới theo đúng thứ tự xuất hiện chuẩn mực trong một Dockerfile thực tế
items:
  - keyword: FROM
    role: Lớp nền khởi đầu
    tone: amber
    summary: Chọn hệ điều hành gốc và phiên bản runtime cài sẵn (Node 22, Python 3.12...).
    bullets:
      - Luôn là chỉ thị mở đầu (trừ khi khai báo biến `ARG` trước đó)
      - Luôn ghim rõ phiên bản cụ thể, ==tuyệt đối tránh `FROM ...:latest`==!
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
    summary: Gắn biến cố định tồn tại cả lúc build lẫn lúc chạy container.
    bullets:
      - Với Node.js bật `NODE_ENV=production`; với Python bật `PYTHONUNBUFFERED=1` và `PYTHONDONTWRITEBYTECODE=1`
    example: ENV NODE_ENV=production
    lang: dockerfile
  - keyword: COPY
    role: Chép tệp minh bạch
    tone: emerald
    summary: Sao chép tệp/thư mục từ **Build Context** bên ngoài vào bên trong Image.
    bullets:
      - "**Ưu tiên tuyệt đối `COPY` thay vì `ADD`** (`ADD` tự giải nén `.tar` và tải URL ngầm dễ gây bất ngờ bảo mật)"
    example: COPY package*.json ./
    lang: dockerfile
  - keyword: RUN
    role: Thực thi lúc đóng gói
    tone: cyan
    summary: Chạy câu lệnh Linux **ngay trong lúc `docker build`** để cài thư viện hoặc biên dịch, đắp thêm một layer mới.
    bullets:
      - Luôn cài đặt bám sát 100% tệp khóa phiên bản (`RUN npm ci --omit=dev` hoặc `RUN uv sync --frozen --no-dev`)
    example: RUN npm ci --omit=dev
    lang: dockerfile
  - keyword: EXPOSE
    role: Tài liệu hóa cổng
    tone: sky
    summary: Khai báo siêu dữ liệu (metadata) rằng dịch vụ bên trong lắng nghe ở cổng nào.
    bullets:
      - "**KHÔNG tự động mở cổng ra ngoài máy chủ** — lúc chạy thật vẫn phải truyền cờ `-p 3000:3000` (hoặc `-p 8000:8000`)"
    example: EXPOSE 3000
    lang: dockerfile
  - keyword: CMD
    role: Lệnh khởi chạy mặc định
    tone: emerald
    summary: Câu lệnh thực thi khi container khởi động lúc gõ **`docker run`**.
    bullets:
      - "**Bắt buộc viết dạng mảng JSON Exec Form** với dấu nháy kép `\"...\"` để ứng dụng giữ trực tiếp **PID 1**"
    example: CMD ["node", "src/index.js"]
    lang: dockerfile
```

## 2. Chọn Base Image chuẩn năm 2026: Khi nào chọn `-alpine`, khi nào chọn `-slim`?

```visual
kind: groups
title: Chiến Lược Chọn Base Image Theo Từng Hệ Sinh Thái Ngôn Ngữ
columns: 3
items:
  - num: 1
    title: Full Image (node:22 / python:3.12)
    badge: ~1.0–1.1 GB · Tránh dùng Prod
    tone: rose
    bullets:
      - Cài sẵn đủ trình biên dịch C++, Git, công cụ mạng dư thừa
      - Kéo mạng rất chậm khi mở rộng Pod trên CI/CD & Kubernetes
      - Bề mặt lỗ hổng bảo mật hệ điều hành (CVE) phình to
    footer: Chỉ hợp làm stage tạm khi bắt buộc compile gói C++ đặc thù
  - num: 2
    title: Debian Slim (python:3.12-slim / node:22-bookworm-slim)
    badge: ~150–220 MB · Vàng cho Python!
    tone: sky
    bullets:
      - "Đã gọt sạch công cụ thừa nhưng giữ thư viện C chuẩn **`glibc`**"
      - "**Lựa chọn số 1 cho Python / FastAPI / AI:** tải thẳng gói nhị phân `manylinux` wheel (`pydantic-core`, `numpy`, `psycopg`) cực nhanh, không bị lỗi biên dịch lại như trên `musl`!"
    footer: Mặc định vàng cho Python 3.12 & Node có native addon glibc
  - num: 3
    title: Alpine Linux (node:22-alpine)
    badge: ~135 MB · Vàng cho Node / Go
    tone: emerald
    bullets:
      - Nền **Alpine Linux** siêu nhỏ dùng thư viện **`musl`**
      - Tải cực nhanh, tốn ít ổ cứng và rất ít CVE hệ điều hành
      - Lựa chọn phổ biến số 1 cho REST / GraphQL API thuần Node.js, Nginx, Redis
    footer: Mặc định vàng cho Microservices Node.js & Go
```

## 3. Tính tất định (Determinism): Khóa chặt Lockfile & Bẫy `CMD` Shell Form vs Exec Form

Ở máy cá nhân khi thêm thư viện mới, bạn hay gõ `npm install` hoặc `pip install fastapi`. Nhưng bên trong `Dockerfile`, mục tiêu quan trọng là ==tính tất định (determinism)== — build hôm nay hay 6 tháng sau đều phải ra đúng từng byte phụ thuộc:

- [x] **Với Node.js:** Dùng **`RUN npm ci --omit=dev`** thay vì `npm install` — nếu `package-lock.json` bị lệch, lệnh sẽ báo lỗi dừng ngay thay vì âm thầm tự nâng phiên bản gói!
- [x] **Với Python hiện đại (2026):** Dùng trình quản lý siêu tốc **`uv`** với **`RUN uv sync --frozen --no-dev`** (nhanh gấp 10–50 lần `pip`, khóa chặt tuyệt đối theo `uv.lock`)!

Tiếp theo là lỗi phổ biến ở dòng cuối cùng `CMD`:

```visual
kind: compare
title: "Ảnh Hưởng Của Cách Viết CMD Tới PID 1 & Tín Hiệu Dừng SIGTERM"
subtitle: Chỉ khác nhau cặp ngoặc vuông JSON nhưng quyết định ứng dụng tắt êm hay làm đứt ngang giao dịch của khách hàng!
left:
  badge: "CÁCH SAI · Shell Form"
  title: Docker âm thầm bọc vào /bin/sh -c
  tone: rose
  code: |
    # Bị biến thành: /bin/sh -c "node src/index.js"
    CMD node src/index.js

    # Hoặc bên Python viết dạng chuỗi:
    CMD uvicorn app.main:app --host 0.0.0.0 --port 8000
  lang: dockerfile
  bullets:
    - "Tiến trình giữ **PID 1** là `/bin/sh` chứ **không phải** `node` hay `uvicorn`"
    - "Khi `docker stop` hay Kubernetes cuộn phiên bản gửi `SIGTERM` tới PID 1, `/bin/sh` **nuốt mất tín hiệu**, không chuyển tiếp xuống app!"
    - "Container treo đơ hết 10s rồi bị ngắt bằng **`SIGKILL (137)`**, cắt đứt mọi request đang xử lý dở"
right:
  badge: "CÁCH CHUẨN · JSON Exec Form"
  title: Trao trực tiếp PID 1 cho ứng dụng
  tone: emerald
  code: |
    # Mảng JSON hợp lệ dùng dấu nháy kép "..."
    CMD ["node", "src/index.js"]

    # Hoặc FastAPI / Uvicorn chuẩn Exec Form:
    CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
  lang: dockerfile
  bullets:
    - "Chính tiến trình **`node` / `uvicorn` giữ trực tiếp ==PID 1==** trong không gian tên container"
    - "Nhận thẳng tín hiệu `SIGTERM` từ nhân Linux để đóng HTTP server & trả kết nối DB êm ái (*Graceful Shutdown*)"
    - "Luôn dùng dấu nháy kép `\"...\"` đúng chuẩn JSON (dùng nháy đơn `'...'` sẽ bị coi lại thành lỗi Shell Form!)"
```

## 4. Hai mẫu Dockerfile hoàn chỉnh: Node.js 22 LTS & Python 3.12 (`uv` + `FastAPI`)

Hãy đối chiếu hai bản công thức chuẩn mực dưới đây — bạn sẽ thấy cấu trúc tư duy của chúng **giống hệt nhau từng bước một**:

```dockerfile Dockerfile chuẩn cơ bản — Node.js 22 LTS (Express / Fastify)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

```dockerfile Dockerfile chuẩn hiện đại 2026 — Python 3.12 + uv + FastAPI
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.6 /uv /uvx /bin/
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY app/ ./app/
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

> [!TIP] Giải thích 3 thiết lập quan trọng trong Python Dockerfile
> - `PYTHONDONTWRITEBYTECODE=1`: Ngăn Python sinh hàng trăm tệp rác `.pyc` vô ích vào lớp ghi của container.
> - `PYTHONUNBUFFERED=1`: Đẩy thẳng mọi dòng `print()` / `logging` ra `docker logs` tức thì không bị trễ bộ đệm.
> - `--host 0.0.0.0`: Bắt buộc mở cửa `eth0` để nhận kết nối từ cờ `-p 8000:8000` hoặc từ Kubernetes Service!

## 5. Đóng gói Image với `docker build -t`

Biên dịch `Dockerfile` ở thư mục hiện tại thành Image mang nhãn Semantic Versioning rõ ràng:

```bash
docker build -t shop-api:1.0.0 .   # Đừng quên dấu chấm "." ở cuối lệnh!
```

> [!WARNING] Cẩn thận dấu chấm `.` nhỏ bé ở cuối lệnh `docker build`!
> Dấu ==`.`== ở cuối lệnh chính là đường dẫn **Build Context** — thư mục mà Docker CLI gom gửi sang bộ máy BuildKit để tìm `Dockerfile` và thực hiện các lệnh `COPY`. Quên dấu `.` là lỗi phổ biến nhất khi mới gõ `docker build`!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Ưu tiên `COPY` hơn `ADD`** · Khóa chặt lockfile bằng **`RUN npm ci --omit=dev`** (Node) hoặc **`RUN uv sync --frozen --no-dev`** (Python) · Ghim rõ `FROM node:22-alpine` hoặc `FROM python:3.12-slim`.
> - `EXPOSE` chỉ là tài liệu khai báo cổng, **không** tự mở cổng ra ngoài máy chủ.
> - Luôn viết ==`CMD ["...", "..."]`== (mảng JSON dấu nháy kép) để ứng dụng nhận trực tiếp **PID 1** và xử lý mượt mà tín hiệu dừng `SIGTERM`.

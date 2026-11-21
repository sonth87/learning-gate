# Multi-stage Build, Non-Root User & HEALTHCHECK chuẩn Production

Khi đóng gói dự án thực tế (**TypeScript / NestJS / Next.js** hoặc **Python FastAPI có gói biên dịch C / Rust**), bạn luôn đối mặt với một nghịch lý kinh điển:

- [>] **Lúc biên dịch & cài đặt (`builder`):** Bắt buộc phải có `typescript`, `esbuild`, trình quản lý `uv`/`pip`, hoặc bộ biên dịch C `gcc`, `build-essential`, `libpq-dev` — tổng dung lượng ngốn từ **700 MB đến 1.2 GB**.
- [>] **Lúc chạy thật trên Production (`runner`):** Ứng dụng chỉ cần đúng thư mục thành phẩm **`dist/`** (hoặc môi trường `.venv` sạch gọn) cùng các thư viện chạy thật!

Nhét tất cả máy móc xây dựng vào chung một Image vừa làm chậm gấp 5 lần tốc độ kéo Image khi Kubernetes mở rộng Pod, vừa dâng sẵn trình biên dịch và quyền `root` cho kẻ tấn công! ==Multi-stage Build== (**gọt nhẹ tới 85% dung lượng**), **hạ quyền Non-Root (`UID 1000`)** và **tự khám `HEALTHCHECK`** chính là bộ ba tiêu chuẩn vàng cho mọi Image Production năm 2026.

```visual
kind: illustration
diagram: "kube:k05"
src: "/illustrations/kube/docker-multistage-distillery.jpg"
alt: "Xưởng chưng cất Multi-stage Dockerfile từ builder 1.1GB sang runner 140MB chạy quyền non-root UID 1000"
title: "Xưởng Chưng Cất Multi-Stage: Từ Builder Nặng 1.1 GB Sang Runner Tinh Gọn ~140 MB"
subtitle: "Giữ lại toàn bộ trình biên dịch ở xưởng tạm và chỉ gắp đúng thành phẩm sang Image Production hạ quyền Non-Root"
caption: "Quy trình chưng cất 2 giai đoạn giúp giảm 80–90% dung lượng Image, xóa bỏ công cụ build dư thừa và khóa chặt quyền Non-Root (UID 1000)"
callouts:
  - num: 1
    label: "Stage 1 (builder) — Xưởng chế tạo tự hủy"
    desc: "Chứa đầy đủ TypeScript / uv / trình biên dịch C để tạo thành phẩm dist/ hoặc .venv, sau đó tự động bị bỏ lại hoàn toàn."
    tone: amber
  - num: 2
    label: "Cầu nối chọn lọc COPY --from=builder"
    desc: "Chỉ gắp sang đúng thư mục chạy thật (gọt devDependencies bằng npm prune --omit=dev hoặc uv sync --no-dev) kèm --chown."
    tone: sky
  - num: 3
    label: "Stage 2 (runner) — Tinh gọn & Hạ quyền UID 1000"
    desc: "Image cuối siêu nhẹ, chạy dưới tài khoản thường (USER node / appuser, không phải root) và tích hợp sẵn cảm biến HEALTHCHECK."
    tone: emerald
```

## 1. Tư duy nhà máy lắp ráp: Multi-stage Dockerfile (`builder` → `runner`)

> [!NOTE] Mô hình tư duy: Gian bếp sơ chế & Đĩa thức ăn dọn lên bàn khách
> Một `Dockerfile` được phép chứa **nhiều chỉ thị `FROM`**. Mỗi dòng `FROM` mở ra một căn phòng mới tinh: toàn bộ vỏ rau, dao thớt và nồi niêu cồng kềnh nằm lại ở gian bếp sơ chế (**`AS builder`**), chỉ có phần món ăn tinh tươm được gắp sang chiếc đĩa sạch ở giai đoạn cuối cùng (**`AS runner`**) để mang ra phục vụ Production!

```visual
kind: layers
title: "Dây Chuyền Multi-Stage Build Chuẩn Production (Builder -> Runner)"
subtitle: "Toàn bộ trình biên dịch, công cụ build và gói dev ở Stage 1 tự động bị bỏ lại, không đi vào Image cuối!"
columns:
  - title: "STAGE 1: builder (Gian bếp sơ chế tạm)"
    badge: "~850 MB – 1.1 GB · Tự bỏ sau khi build"
    tone: amber
    layers:
      - label: "FROM ... AS builder"
        note: Mở xưởng build
        tone: slate
      - label: "Cài đặt đầy đủ công cụ build & dependencies"
        sub: "Node: RUN npm ci · Python: uv sync --frozen --no-dev"
        note: Đủ đồ nghề biên dịch
        tone: amber
      - label: "Biên dịch & Gọt sạch gói thừa"
        sub: "Node: npm run build && npm prune --omit=dev"
        note: Tinh chế thành phẩm
        tone: cyan
    footer: "Không một lớp rác build nào của Stage 1 lọt vào Image phát hành!"
  - title: "STAGE 2: runner (Image xuất xưởng)"
    badge: "~135–160 MB · Nhẹ gấp 6 lần & An toàn"
    tone: emerald
    layers:
      - label: "FROM node:22-alpine (hoặc python:3.12-slim) AS runner"
        sub: "Khởi tạo nền sạch mới tinh, không có gcc, git hay trình biên dịch"
        note: Sạch bóng rác build
        tone: emerald
      - label: "COPY --from=builder --chown=..."
        sub: "Chỉ gắp sang đúng thành phẩm chạy thật (dist/ + node_modules hoặc .venv + app/)"
        note: Chỉ lấy tinh hoa
        tone: sky
      - label: "USER node / appuser  (UID 1000 — Non-Root)"
        sub: "Hạ đặc quyền khỏi root trước khi mở cổng >= 1024 (3000 / 8000)"
        note: Khóa chặt bảo mật
        tone: emerald
      - label: 'CMD ["node", "dist/main.js"] / ["uvicorn", ...]'
        note: PID 1 chuẩn mực
        tone: cyan
    footer: "Tải siêu tốc trên Kubernetes · Giảm tối đa bề mặt lỗ hổng CVE!"
```

### Mẫu 1: Multi-stage chuẩn Production cho **Node.js 22 / TypeScript**

```dockerfile Dockerfile Multi-stage chuẩn Production (Node 22 LTS)
# ==================== STAGE 1: builder (Xưởng chế tạo) ====================
FROM node:22-alpine AS builder
WORKDIR /app

# 1. Cài đầy đủ cả dependencies lẫn devDependencies để có trình biên dịch tsc
COPY package.json package-lock.json ./
RUN npm ci

# 2. Chép cấu hình + mã nguồn TypeScript và biên dịch ra /app/dist
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 3. Gọt bỏ toàn bộ devDependencies theo chuẩn npm 10+ hiện đại
RUN npm prune --omit=dev

# ==================== STAGE 2: runner (Đóng hộp thành phẩm) ====================
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Chỉ gắp thành phẩm từ stage "builder" sang và gán quyền sở hữu rõ ràng
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Mẫu 2: Multi-stage chuẩn Production cho **Python 3.12 + `uv` + `FastAPI`**

Với Python, giai đoạn `builder` dùng image có sẵn `uv` (và trình biên dịch nếu cần build C-extension), sau đó stage `runner` chỉ gắp sang đúng thư mục môi trường ảo `/app/.venv` — Image cuối thậm chí **không cần chứa cả `pip` hay `uv`**, vừa nhẹ vừa cực kỳ bảo mật:

```dockerfile Dockerfile Multi-stage chuẩn Production (Python 3.12 + uv + FastAPI)
# ==================== STAGE 1: builder ====================
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY app ./app

# ==================== STAGE 2: runner ====================
FROM python:3.12-slim AS runner
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PATH="/app/.venv/bin:$PATH"

# Tạo tài khoản phi đặc quyền appuser (UID 1000) vì python:3.12-slim chưa tạo sẵn như Node
RUN useradd --create-home --uid 1000 appuser

COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv
COPY --from=builder --chown=appuser:appuser /app/app /app/app

USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

> [!TIP] Chuẩn cú pháp gọt gói dev hiện đại năm 2026
> Bên Node.js 22 (npm 10+), hãy luôn viết ==`npm prune --omit=dev`== (cờ `--omit=dev` thay thế cho cờ cũ thời npm v6 đã ngưng khuyến khích). Bên Python `uv`, chỉ cần truyền `--no-dev` vào `uv sync` là toàn bộ `pytest`, `ruff`, `mypy` sẽ được loại sạch khỏi `.venv`!

## 2. Hạ quyền khỏi `root` với `USER` (`UID 1000`): Chốt chặn bảo mật sống còn

Một sự thật khiến nhiều người mới giật mình: ==nếu không khai báo dòng `USER`, mọi Docker container mặc định đều chạy dưới quyền tối cao `root` (`UID 0`)!==

```visual
kind: compare
title: "Chạy Mặc Định Dưới Quyền root (UID 0) vs Hạ Quyền Non-Root (UID 1000)"
subtitle: "Hạ quyền bảo vệ máy chủ khỏi nguy cơ leo thang đặc quyền khi ứng dụng chẳng may dính lỗ hổng RCE!"
left:
  badge: "RỦI RO NGHIÊM TRỌNG · Mặc định UID 0 (root)"
  title: "Bỏ quên chỉ thị USER trong Dockerfile"
  tone: rose
  code: |
    # Không có dòng USER -> chạy thẳng bằng root (UID 0)!
    EXPOSE 80
    CMD ["node", "dist/main.js"]
  lang: dockerfile
  bullets:
    - "`UID 0` trong container ánh xạ thẳng với `UID 0` của nhân Linux trên nhiều cấu hình máy chủ"
    - "Nếu dính lỗ hổng RCE hoặc Container Escape, kẻ tấn công chiếm trọn quyền tối cao"
    - "Bị cụm Kubernetes bật **Pod Security Admission `restricted`** từ chối thẳng thừng không cho chạy!"
right:
  badge: "CHUẨN PRODUCTION · Non-Root UID 1000"
  title: "Chuyển sang USER node / appuser + Cổng >= 1024"
  tone: emerald
  code: |
    COPY --from=builder --chown=node:node /app/dist ./dist
    USER node
    EXPOSE 3000
    CMD ["node", "dist/main.js"]
  lang: dockerfile
  bullets:
    - "Image `node:22-alpine` đã tạo sẵn ==`USER node`== (`UID 1000`); với `python:3.12-slim` chỉ cần thêm `useradd -u 1000 appuser` rồi gọi `USER appuser`"
    - "**Lưu ý cổng Linux:** Tài khoản thường (`UID >= 1000`) **không được mở cổng đặc quyền `< 1024`** (cố mở cổng `80` hay `443` sẽ sập ngay với lỗi `EACCES` / `PermissionError`!)"
    - "Luôn để ứng dụng lắng nghe ở cổng cao như **`3000`**, **`8000`** hoặc **`8080`**"
```

## 3. Tự khám sức khỏe định kỳ bằng chỉ thị `HEALTHCHECK` (Không cần cài `curl`!)

Hãy hình dung sự cố âm ỉ nguy hiểm nhất trên Production: kết nối tới Redis bị treo hoặc vòng lặp xử lý bị kẹt cứng (*deadlock*) khiến mọi request gọi vào đều quay vòng `504 Timeout`, nhưng bản thân tiến trình `node` hay `python` **vẫn chưa thoát** nên `docker ps` vẫn báo xanh rờn `Up 3 days`!

Chỉ thị ==`HEALTHCHECK`== dạy cho Docker Engine cách chủ động gõ cửa HTTP bên trong định kỳ — và mẹo hay nhất là **dùng ngay thư viện chuẩn có sẵn của Node 22 / Python 3.12** để khỏi phải cài thêm `curl` vào stage `runner`:

```dockerfile
# Cách 1 — Trên Node.js 22 (tận dụng hàm fetch() toàn cục có sẵn):
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

# Cách 2 — Trên Python 3.12 (tận dụng urllib.request có sẵn trong stdlib):
# HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
#   CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=2)"]
```

```visual
kind: anatomy
title: "Giải Phẫu Chỉ Thị HEALTHCHECK Không Cần Cài curl / wget"
subtitle: "Giữ Image cuối sạch bóng công cụ tải mạng dư thừa để tăng cường bảo mật tối đa"
items:
  - keyword: "--interval & --timeout"
    role: Nhịp khám & Hạn giờ
    tone: sky
    summary: "Cứ mỗi `30s` Docker gõ cửa kiểm tra 1 lần; nếu quá `3s` không phản hồi thì tính là 1 lần thất bại."
    bullets:
      - "`--start-period=10s` ân xá 10 giây đầu lúc ứng dụng đang khởi động kết nối DB"
      - "`--retries=3` cho phép trượt liên tiếp 3 lần trước khi chính thức gắn nhãn `(unhealthy)`"
  - keyword: "Native fetch / urllib"
    role: Không cần cài thêm curl
    tone: emerald
    summary: "Tận dụng `fetch()` của Node 22 hoặc `urllib.request` của Python 3.12 thay vì chạy `apk add curl` / `apt-get install curl`."
    bullets:
      - "**Lợi ích bảo mật kép:** Không có `curl` / `wget` ở stage `runner` khiến kẻ tấn công không có công cụ tải mã độc về nếu ứng dụng lỡ dính lỗi RCE!"
  - keyword: "exit 0 vs exit 1"
    role: Quy ước mã thoát sống còn
    tone: amber
    summary: "Docker phán quyết sức khỏe container hoàn toàn dựa vào mã thoát của lệnh kiểm tra."
    bullets:
      - "==`exit 0`== → **Khỏe mạnh (`healthy`)**: cột `STATUS` trong `docker ps` hiện rõ `Up 2 minutes (healthy)`"
      - "**`exit 1`** → **Bất ổn (`unhealthy`)**: báo động cho Docker Compose (`condition: service_healthy`) hoặc hệ thống giám sát xử lý kịp thời"
```

> [!WARNING] Vì sao trong `HEALTHCHECK` lại gọi được `127.0.0.1`?
> Ở bài `K01`, ta biết bên ngoài máy chủ không gọi vào `127.0.0.1` của container được. Nhưng câu lệnh `HEALTHCHECK` được Docker chạy **ngay bên trong chính căn phòng mạng của container đó**, nên kiểm tra qua `http://127.0.0.1:3000/healthz` (hoặc `:8000/healthz`) là hoàn toàn hợp lệ và nhanh nhất!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Multi-stage Build:** Biên dịch ở `FROM ... AS builder`, gọt gói dev (`RUN npm prune --omit=dev` hoặc `uv sync --no-dev`), rồi gắp thành phẩm sang `runner` bằng **`COPY --from=builder`**.
> - Mặc định container chạy `root` (`UID 0`) → luôn hạ quyền bằng **`USER node`** / **`USER appuser`** (`UID 1000`) và lắng nghe ở cổng **`>= 1024`** (`3000` / `8000` / `8080`).
> - **`HEALTHCHECK`** dùng `node -e "fetch(...)"` hoặc `python -c "import urllib.request..."` gọn sạch không cần `curl`: trả về **`0`** = `healthy` · khác `0` = `unhealthy`.

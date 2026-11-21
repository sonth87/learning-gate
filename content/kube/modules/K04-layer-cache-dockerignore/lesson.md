# Tối ưu tốc độ Build gấp 20 lần với Layer Cache, `.dockerignore` & Build Args

Bạn đã viết được `Dockerfile` đầu tiên chạy ngon lành ở bài `K03`. Thế nhưng chỉ vài ngày sau, cả nhóm bắt đầu than trời: *"Mỗi lần em chỉ sửa đúng 1 chữ chính tả trong `src/routes/health.js` (hoặc `app/routers/health.py`) mà chạy `docker build` lại phải ngồi chờ tải lại toàn bộ thư viện mất gần 2 phút!"* — chưa kể Image phình lên gần 900 MB và vô tình dính cả tệp `.env` chứa mật khẩu cá nhân!

Bài học này giải quyết triệt để cả ba nỗi đau đó bằng cơ chế ==Layer Cache== (**tăng tốc gấp 20–50 lần**) của BuildKit, lá chắn ==`.dockerignore`== (**chống rò rỉ bí mật & rác môi trường ảo**) và cách phân tách tham số **Build-time `ARG`** / **Run-time `ENV`**.

```visual
kind: illustration
diagram: "kube:k04"
alt: "Cơ chế lá chắn .dockerignore và quy tắc sụp đổ dây chuyền Domino của BuildKit Layer Cache"
title: "Giải Phẫu Tối Ưu BuildKit: Lá Chắn .dockerignore & Tháp Bộ Đệm Layer Cache"
subtitle: "Chặn rác ngay từ cửa Build Context và sắp xếp thứ tự chỉ thị thông minh để tái sử dụng 100% lớp cài đặt thư viện"
caption: "Cách tệp .dockerignore lọc sạch node_modules/.venv/.env và sự đối lập tốc độ giữa thứ tự COPY sai lầm (~120s) với thứ tự tách riêng lockfile (~0.8s)"
callouts:
  - num: 1
    label: "Lá chắn .dockerignore lọc sạch Build Context"
    desc: "Loại bỏ node_modules, .venv, .git và tệp mật khẩu .env trước khi gửi sang BuildKit, vừa bảo mật vừa chống xung đột binary khác hệ điều hành."
    tone: amber
  - num: 2
    label: "Hiệu ứng Domino khi đặt COPY . . quá sớm"
    desc: "Chỉ sửa 1 ký tự trong code cũng làm đổi mã băm SHA-256, kéo sập toàn bộ cache của bước cài thư viện (npm ci / uv sync) nặng nề bên dưới."
    tone: rose
  - num: 3
    label: "Tháp Cache chuẩn: Tách Lockfile lên trước"
    desc: "Đưa bước ít thay đổi (lockfile + cài gói) lên trên và đẩy COPY mã nguồn xuống cuối giúp rút thời gian build lại còn chưa tới 1 giây."
    tone: emerald
```

## 1. Quy luật bất biến của Docker Layer Cache (Hiệu ứng Domino)

> [!NOTE] Mô hình tư duy chồng gạch Lego
> Mỗi chỉ thị `FROM`, `WORKDIR`, `COPY`, `RUN` trong `Dockerfile` giống như **đặt thêm một viên gạch Lego lên chồng tháp**. Nếu bạn rút viên gạch ở tầng 2 ra sửa, toàn bộ các tầng 3, 4, 5 bên trên bắt buộc phải tháo ra lắp lại từ đầu; nhưng nếu bạn chỉ thay viên gạch trên nóc cùng, toàn bộ phần móng nặng nề bên dưới giữ nguyên bất động!

Khi bạn gõ `docker build`, bộ máy BuildKit kiểm tra tuần tự từ trên xuống dưới:

- [x] **So khớp mã băm SHA256:** Với lệnh `COPY`, BuildKit tính checksum toàn bộ tệp nguồn được chép. Nếu không một byte nào đổi, nó tái sử dụng ngay lớp cũ — báo **`CACHED` (`0.0s`)**!
- [!] **Quy tắc sụp đổ dây chuyền (*Domino Invalidation*):** Ngay khoảnh khắc **một layer thứ `k` bị mất cache** (do tệp nguồn vừa sửa), ==TOÀN BỘ các layer `k+1, k+2...` đứng phía dưới nó đều buộc phải chạy lại từ đầu==, dù câu lệnh ở dưới không đổi một chữ nào!

```visual
kind: layers
title: "Hiệu Ứng Domino Khi Bạn Chỉ Sửa 1 Dòng Code Trong Dự Án"
subtitle: "Quy tắc số 1: Đưa bước ÍT THAY ĐỔI (lockfile -> cài gói) lên trên · Đẩy bước HAY SỬA NHẤT (COPY code) xuống cuối!"
columns:
  - title: "THỨ TỰ SAI — Chép tất cả từ quá sớm"
    badge: Build lại mất ~120 giây!
    tone: rose
    layers:
      - label: "1. FROM base & WORKDIR /app"
        note: "CACHED (0.0s)"
        tone: emerald
      - label: "2. COPY . .  (Dính tệp code vừa sửa 1 chữ!)"
        sub: "Checksum SHA256 thay đổi -> Mất cache ngay tại tầng này"
        note: "CACHE MISS!"
        tone: rose
      - label: "3. RUN npm ci / uv sync  (Bị vạ lây Domino!)"
        sub: "Dù không thêm thư viện nào, Docker vẫn phải cài lại toàn bộ từ đầu"
        note: "Chạy lại ~120s"
        tone: amber
      - label: '4. CMD ["..."]'
        note: Tạo lại metadata
        tone: slate
    footer: "Mỗi lần sửa code là 2 phút ngồi chờ tải lại thư viện!"
  - title: "THỨ TỰ CHUẨN — Tách riêng Lockfile lên trước"
    badge: Build xong trong ~0.8 giây!
    tone: emerald
    layers:
      - label: "1. FROM base & WORKDIR /app"
        note: "CACHED (0.0s)"
        tone: emerald
      - label: "2. COPY package*.json (hoặc pyproject.toml uv.lock)"
        sub: "99% lần sửa code hàng ngày không động tới tệp khai báo thư viện"
        note: "CACHED (0.0s)"
        tone: emerald
      - label: "3. RUN npm ci --omit=dev (hoặc uv sync --frozen)"
        sub: "Bước nặng nhất được lấy thẳng từ bộ nhớ đệm trong tích tắc!"
        note: "CACHED (0.0s)!"
        tone: cyan
      - label: "4. COPY . .  (Chỉ chép lại mã nguồn nhẹ tênh ở tầng cuối)"
        sub: "Mất cache ở bước cuối cùng không hề chạm tới tầng thư viện bên trên"
        note: "Chạy ~0.8s"
        tone: sky
    footer: "Tăng tốc độ đóng gói trên máy cá nhân & CI/CD gấp 20–50 lần!"
```

Hãy xem cùng một nguyên lý Layer Cache áp dụng mượt mà cho cả **Node.js** lẫn **Python (`uv` + `FastAPI`)**:

```dockerfile Dockerfile tối ưu Layer Cache — Node.js 22 LTS
FROM node:22-alpine
WORKDIR /app

# Bước ít đổi: chép riêng manifest & cài thư viện trước
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Bước đổi liên tục mỗi phút: đặt ở dưới cùng!
COPY . .
CMD ["node", "src/index.js"]
```

```dockerfile Dockerfile tối ưu Layer Cache — Python 3.12 + uv + FastAPI
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.6 /uv /uvx /bin/
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PATH="/app/.venv/bin:$PATH"

# 1. Chỉ chép 2 tệp khóa gói trước -> giữ nguyên Cache khi sửa code trong app/!
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# 2. Chép mã nguồn Python ở tầng cuối cùng (build lại mất < 1 giây)
COPY app/ ./app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 2. Lá chắn `.dockerignore`: Bảo vệ Tốc độ lẫn Bí mật

> [!WARNING] Docker KHÔNG tự động đọc `.gitignore`!
> Khi bạn gõ `docker build -t shop-api:1.0.0 .`, Docker gom toàn bộ thư mục `.` (**Build Context**) gửi sang BuildKit. Nếu quên tạo tệp **`.dockerignore`**, cả `node_modules` (500 MB), `.venv` (400 MB), `.git` lẫn tệp mật khẩu `.env` trên máy bạn sẽ lao thẳng vào trong Image!

```visual
kind: groups
title: "Ba Thảm Họa Được Chặn Đứng Nhờ Tệp .dockerignore"
columns: 3
items:
  - num: 1
    icon: cpu
    title: "Chặn node_modules & .venv Máy Chủ"
    badge: Tránh lệch kiến trúc
    tone: amber
    bullets:
      - "Ngăn gửi hàng trăm MB thư viện biên dịch cho MacBook (`darwin-arm64`) vào Build Context"
      - "Tránh việc `COPY . .` chép đè binary macOS làm hỏng `node_modules` hoặc `.venv` Linux vừa cài trong Image!"
  - num: 2
    icon: folder-git
    title: "Chặn .git & __pycache__"
    badge: Giữ vững Cache
    tone: sky
    bullets:
      - "Mỗi lần bạn gõ `git commit` hay chạy pytest, dữ liệu trong `.git/`, `__pycache__/`, `coverage/` lại thay đổi"
      - "Chặn chúng giúp lệnh `COPY . .` không bị vỡ cache oan uổng"
  - num: 3
    icon: shield-alert
    title: "Chặn Tuyệt Đối .env & *.pem"
    badge: Chống rò rỉ Secret
    tone: rose
    bullets:
      - "Ngăn khóa bí mật `.env`, `.env.local`, `*.pem` trên ổ cứng lọt vào các lớp Image"
      - "**Nhớ kỹ:** Đã lỡ `COPY .env` ở layer 2 thì `RUN rm -f .env` ở layer 3 **KHÔNG xóa được** dữ liệu thật vẫn nằm trong bản chụp layer 2!"
```

### Cú pháp loại trừ đa ngôn ngữ và quy tắc ngoại lệ `!` trong `.dockerignore`

Tệp `.dockerignore` được xét duyệt tuần tự từ trên xuống dưới; **quy tắc viết sau ghi đè quy tắc viết trước**, cho phép bạn dùng dấu chấm than ==`!`== ngay đầu dòng để giữ lại tệp ngoại lệ:

```dockerignore
# Thư mục môi trường gói của Node.js & Python:
node_modules
.venv
venv
__pycache__
.pytest_cache

# Lịch sử Git, báo cáo test & bí mật cục bộ:
.git
.env
.env.*
coverage
dist

# Chặn toàn bộ tài liệu Markdown nội bộ, NHƯNG giữ lại duy nhất README.md:
*.md
!README.md
```

- [!] **Cẩn thận bẫy chặn nhầm:** Tuyệt đối không viết bừa `*.json` hay `*.toml` vào `.dockerignore`, vì nó sẽ chặn mất luôn cả `package.json`, `package-lock.json` hoặc `pyproject.toml` khiến `docker build` gãy ngay lập tức!

## 3. Phân biệt `ARG` (lúc Build) và `ENV` (lúc Run)

```visual
kind: compare
title: "Đối Chiếu Rạch Ròi: ARG (Build Argument) vs ENV (Environment Variable)"
subtitle: "Cả ARG lẫn ENV đều KHÔNG PHẢI nơi chứa mật khẩu (lộ rõ trong docker history & docker inspect)!"
left:
  badge: "CHỈ SỐNG LÚC BUILD · ARG"
  title: "Tham số đóng gói tạm thời"
  tone: cyan
  code: |
    # Truyền từ CLI lúc đóng gói:
    # docker build --build-arg APP_VERSION=1.2.3 .
    ARG APP_VERSION=1.0.0
  lang: dockerfile
  bullets:
    - "**Chỉ tồn tại trong quá trình `docker build`**"
    - "**Biến mất hoàn toàn** khi container khởi chạy thực tế (`os.getenv('APP_VERSION')` hay `process.env.APP_VERSION` sẽ trống nếu chỉ khai báo `ARG`!)"
    - "**Cấm chứa Secret:** Ai có Image đều đọc lại được qua `docker history`"
right:
  badge: "SỐNG TỚI LÚC CHẠY · ENV"
  title: "Biến môi trường gắn vào Image"
  tone: emerald
  code: |
    # Mẫu thiết kế chuẩn CI/CD: nối ARG sang ENV!
    FROM node:22-alpine
    WORKDIR /app
    ARG APP_VERSION=1.0.0
    ENV APP_VERSION=$APP_VERSION
  lang: dockerfile
  bullets:
    - "Tồn tại cả lúc `docker build` (từ dòng khai báo trở xuống) **lẫn lúc chạy thật trong tiến trình**"
    - "Ghi đè linh hoạt lúc chạy bằng `docker run -e APP_VERSION=...`"
    - "**Cấm chứa Secret:** Hiển thị phơi bày trong `docker inspect`"
```

## 4. Cài đặt gói hệ thống (`apk` / `apt-get`) sạch gọn trong 1 Layer

Đôi khi ứng dụng cần thêm thư viện C hoặc tiện ích nhỏ như `curl`, `libpq5`, `tzdata`. Vì mỗi dòng `RUN` tạo ra một layer bất biến cộng dồn dung lượng (xóa ở dòng `RUN` sau không làm giảm kích thước dòng `RUN` trước!), hãy luôn gộp gọn trong **một lệnh `RUN` duy nhất**:

```dockerfile
# Trên nền Alpine Linux (apk): cờ --no-cache tải chỉ mục trên RAM, không lưu rác vào /var/cache/apk/
RUN apk add --no-cache curl

# Trên nền Debian Slim như python:3.12-slim (apt-get): nối update + install + xóa lists trong CÙNG 1 dòng RUN
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libpq5 \
  && rm -rf /var/lib/apt/lists/*
```

> [!TIP] BuildKit Secret Mounts khi cần tải gói nội bộ lúc `docker build`
> Nếu trong lúc `RUN npm ci` hoặc `RUN uv sync` bạn bắt buộc cần token đọc kho gói riêng tư của công ty, đừng truyền qua `ARG NPM_TOKEN`! Hãy dùng tính năng chuẩn BuildKit `RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci` để token chỉ được gắn tạm trên RAM đúng giây cài đặt và **không bao giờ lưu lại dấu vết trong bất kỳ layer nào của Image**.

```visual
kind: troubleshoot
title: Hai Cái Bẫy Phình Dung Lượng & Lộ Bí Mật Giữa Các Layer
items:
  - symptom: Lỡ COPY .env ở dòng trên rồi chạy RUN rm -f .env ở dòng dưới
    badge: Bất biến Layer
    tone: rose
    cause: Mỗi layer là một bản chụp chỉ đọc độc lập. Lệnh `rm` ở layer 3 chỉ đặt một dấu ẩn (whiteout) lên bề mặt, còn nội dung thật của `.env` vẫn nằm nguyên vẹn trong layer 2!
    fix: Xóa bỏ dòng COPY nhạy cảm, chặn `.env` bằng `.dockerignore` và xoay vòng (rotate) ngay khóa bí mật đã lộ.
  - symptom: Tách rời 2 dòng RUN apk update và RUN apk add curl trên Alpine
    badge: Lỗi Stale Cache 404
    tone: amber
    cause: Dòng `RUN apk update` vừa để lại rác chỉ mục làm nặng Image, vừa bị kẹt trong cache cũ nhiều tuần khiến `RUN apk add curl` sau đó tải nhầm bản gói đã xóa trên kho Alpine (lỗi 404).
    fix: Luôn gộp thành 1 dòng chuẩn duy nhất `RUN apk add --no-cache curl`.
    cmd: RUN apk add --no-cache curl
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Thứ tự vàng tối ưu Layer Cache:** Chép lockfile (`package*.json` hoặc `pyproject.toml uv.lock`) → cài gói (`RUN npm ci` / `RUN uv sync --frozen`) → cuối cùng mới `COPY` mã nguồn.
> - Luôn tạo **`.dockerignore`** chặn `node_modules`, `.venv`, `__pycache__`, `.git`, `.env` (dùng dấu **`!`** đầu dòng như `!README.md` để giữ ngoại lệ).
> - **`ARG`** chỉ sống lúc `docker build` · **`ENV`** sống tới lúc container chạy · Trên Alpine luôn dùng ==`RUN apk add --no-cache <gói>`==.

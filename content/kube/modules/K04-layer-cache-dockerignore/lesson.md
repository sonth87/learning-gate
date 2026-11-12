# Tối ưu tốc độ Build gấp 20 lần với Layer Cache, `.dockerignore` & Build Args

Bạn đã viết được `Dockerfile` đầu tiên chạy ngon lành ở bài `K03`. Thế nhưng chỉ vài ngày sau, cả nhóm bắt đầu than trời: *"Mỗi lần em chỉ sửa đúng 1 chữ chính tả trong `src/routes/health.js` mà chạy `docker build` lại phải ngồi chờ tải `npm ci` mất gần 2 phút!"* — chưa kể Image phình lên gần 900 MB và vô tình dính cả tệp `.env` chứa mật khẩu cá nhân!

Bài học này giải quyết triệt để cả ba nỗi đau đó bằng cơ chế ==Layer Cache== ({emerald:tăng tốc gấp 20 lần}) của BuildKit, lá chắn ==`.dockerignore`== ({rose:chống rò rỉ bí mật}) và cách phân tách tham số {violet:Build-time `ARG`} / {sky:Run-time `ENV`}.

## 1. Quy luật bất biến của Docker Layer Cache (Hiệu ứng Domino)

Mỗi chỉ thị `FROM`, `WORKDIR`, `COPY`, `RUN` trong `Dockerfile` tạo ra một **lớp (layer) chỉ đọc** xếp chồng lên lớp trước đó. Khi bạn gõ `docker build`, bộ máy BuildKit kiểm tra tuần tự từ trên xuống dưới:

- [x] **So khớp mã băm SHA256:** Với lệnh `COPY`, BuildKit tính checksum toàn bộ tệp nguồn. Nếu không một byte nào đổi, nó tái sử dụng ngay lớp cũ — báo **`CACHED` (`0.0s`)**!
- [!] **Quy tắc sụp đổ dây chuyền (*Domino Invalidation*):** Ngay khoảnh khắc **một layer thứ `k` bị mất cache** (do tệp nguồn vừa sửa), ==TOÀN BỘ các layer `k+1, k+2...` đứng phía dưới nó đều buộc phải chạy lại từ đầu==, dù câu lệnh ở dưới không đổi một chữ nào!

```visual
kind: layers
title: "Hiệu Ứng Domino Khi Bạn Chỉ Sửa 1 Chữ Trong src/routes/health.js"
subtitle: "Quy tắc số 1: Đưa bước ÍT THAY ĐỔI (package*.json -> npm ci) lên trên · Đẩy bước HAY SỬA NHẤT (COPY . .) xuống cuối!"
columns:
  - title: "THỨ TỰ SAI — Chép tất cả từ quá sớm"
    badge: Build lại mất ~120 giây!
    tone: rose
    layers:
      - label: "1. FROM node:22-alpine & WORKDIR /app"
        note: "CACHED (0.0s)"
        tone: emerald
      - label: "2. COPY . .  (Dính tệp src/routes/health.js vừa sửa!)"
        sub: "Checksum SHA256 thay đổi -> Mất cache ngay tại tầng này"
        note: "CACHE MISS!"
        tone: rose
      - label: "3. RUN npm ci  (Bị vạ lây hiệu ứng Domino!)"
        sub: "Dù không thêm thư viện nào, Docker vẫn tải & cài lại toàn bộ từ đầu"
        note: "Chạy lại ~120s"
        tone: amber
      - label: '4. CMD ["node", "src/index.js"]'
        note: Tạo lại metadata
        tone: slate
    footer: "Mỗi lần sửa code là 2 phút ngồi nhìn màn hình chờ npm ci!"
  - title: "THỨ TỰ CHUẨN — Tách riêng Manifest lên trước"
    badge: Build xong trong ~0.8 giây!
    tone: emerald
    layers:
      - label: "1. FROM node:22-alpine & WORKDIR /app"
        note: "CACHED (0.0s)"
        tone: emerald
      - label: "2. COPY package.json package-lock.json ./"
        sub: "99% lần sửa code hàng ngày không động tới 2 tệp khai báo gói này"
        note: "CACHED (0.0s)"
        tone: emerald
      - label: "3. RUN npm ci --omit=dev"
        sub: "Bước nặng nhất được lấy thẳng từ bộ nhớ đệm trong tích tắc!"
        note: "CACHED (0.0s)!"
        tone: cyan
      - label: "4. COPY . .  (Chỉ chép lại mã nguồn nhẹ tênh ở tầng cuối)"
        sub: "Mất cache ở bước cuối cùng không còn ảnh hưởng tới npm ci bên trên"
        note: "Chạy ~0.8s"
        tone: sky
    footer: "Tăng tốc độ đóng gói trên máy cá nhân & CI/CD gấp 20–50 lần!"
```

```dockerfile Dockerfile sắp xếp chuẩn tối ưu Layer Cache
FROM node:22-alpine
WORKDIR /app

# Bước ít đổi: chép riêng manifest & cài thư viện trước
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Bước đổi liên tục mỗi phút: đặt ở dưới cùng!
COPY . .
CMD ["node", "src/index.js"]
```

## 2. Lá chắn `.dockerignore`: Bảo vệ Tốc độ lẫn Bí mật

> [!WARNING] Docker KHÔNG tự động đọc `.gitignore`!
> Khi bạn gõ `docker build -t shop-api:1.0.0 .`, Docker gom toàn bộ thư mục `.` (**Build Context**) gửi sang BuildKit. Nếu quên tạo tệp **`.dockerignore`**, cả `node_modules`, `.git` lẫn tệp mật khẩu `.env` trên máy bạn sẽ lao thẳng vào trong Image!

```visual
kind: groups
title: "Ba Thảm Hoạ Được Chặn Đứng Nhờ Tệp .dockerignore"
columns: 3
items:
  - num: 1
    icon: cpu
    title: "Chặn node_modules Máy Chủ"
    badge: Tránh lệch kiến trúc
    tone: amber
    bullets:
      - "Ngăn gửi 500 MB `node_modules` của MacBook (`darwin-arm64`) vào Build Context"
      - "Tránh việc `COPY . .` chép đè binary macOS làm hỏng `node_modules` Linux (`linux-musl`) vừa cài!"
  - num: 2
    icon: folder-git
    title: "Chặn Thư Mục .git"
    badge: Giữ vững Cache
    tone: sky
    bullets:
      - "Mỗi lần bạn gõ `git commit`, dữ liệu bên trong `.git/` lại thay đổi"
      - "Chặn `.git` giúp lệnh `COPY . .` không bị vỡ cache oan uổng khi mã nguồn thực tế giữ nguyên"
  - num: 3
    icon: shield-alert
    title: "Chặn Tuyệt Đối .env & *.pem"
    badge: Chống rò rỉ Secret
    tone: rose
    bullets:
      - "Ngăn khoá bí mật `.env`, `.env.local`, `*.pem` trên ổ cứng lọt vào các lớp Image"
      - "**Nhớ kỹ:** Đã lỡ `COPY .env` ở layer 2 thì `RUN rm -f .env` ở layer 3 **KHÔNG xoá được** dữ liệu thật trong gói tar của layer 2!"
```

### Cú pháp loại trừ và quy tắc ngoại lệ `!` trong `.dockerignore`

Tệp `.dockerignore` được xét duyệt tuần tự từ trên xuống dưới; **quy tắc viết sau ghi đè quy tắc viết trước**, cho phép bạn dùng dấu chấm than ==`!`== ngay đầu dòng để giữ lại tệp ngoại lệ:

```dockerignore
node_modules
.git
.env
.env.*
coverage
dist

# Chặn toàn bộ tài liệu Markdown nội bộ, NHƯNG giữ lại duy nhất README.md:
*.md
!README.md
```

- [!] **Cẩn thận bẫy chặn nhầm:** Tuyệt đối không viết bừa `*.json` vào `.dockerignore`, vì nó sẽ chặn mất luôn cả `package.json`, `package-lock.json` và `tsconfig.json` khiến `docker build` gãy ngay lập tức!

## 3. Phân biệt `ARG` (lúc Build) và `ENV` (lúc Run)

```visual
kind: compare
title: "Đối Chiếu Rạch Ròi: ARG (Build Argument) vs ENV (Environment Variable)"
subtitle: "Cả ARG lẫn ENV đều KHÔNG PHẢI nơi chứa mật khẩu (lộ rõ trong docker history & docker inspect)!"
left:
  badge: "CHỈ SỐNG LÚC BUILD · ARG"
  title: "Tham số đóng gói tạm thời"
  tone: violet
  code: |
    # Truyền từ CLI lúc đóng gói:
    # docker build --build-arg APP_VERSION=1.2.3 .
    ARG APP_VERSION=1.0.0
  lang: dockerfile
  bullets:
    - "**Chỉ tồn tại trong quá trình `docker build`**"
    - "**Biến mất hoàn toàn** khi container khởi chạy thực tế (`process.env.APP_VERSION` sẽ là `undefined` nếu chỉ khai báo `ARG`!)"
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
    - "Tồn tại cả lúc `docker build` (từ dòng khai báo trở xuống) **lẫn lúc chạy thật trong `process.env`**"
    - "Ghi đè linh hoạt lúc chạy bằng `docker run -e APP_VERSION=...`"
    - "**Cấm chứa Secret:** Hiển thị phơi bày trong `docker inspect`"
```

## 4. Cài đặt gói hệ thống (`apk` / `apt-get`) sạch gọn trong 1 Layer

Đôi khi ứng dụng cần thêm tiện ích nhỏ như `curl`, `openssl` hay `tzdata`. Vì mỗi dòng `RUN` tạo ra một layer bất biến cộng dồn dung lượng (xoá ở dòng `RUN` sau không làm giảm kích thước dòng `RUN` trước!), hãy luôn gộp gọn trong **một lệnh `RUN` duy nhất**:

```dockerfile
# Trên nền Alpine Linux (apk): cờ --no-cache tải chỉ mục trên RAM, không lưu rác vào /var/cache/apk/
RUN apk add --no-cache curl

# Trên nền Debian / Ubuntu (apt-get): nối update + install + xoá lists trong CÙNG 1 dòng RUN
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
```

```visual
kind: troubleshoot
title: Hai Cái Bẫy Phình Dung Lượng & Lộ Bí Mật Giữa Các Layer
items:
  - symptom: Lỡ COPY .env ở dòng trên rồi chạy RUN rm -f .env ở dòng dưới
    badge: Bất biến Layer
    tone: rose
    cause: Mỗi layer là một bản chụp chỉ đọc độc lập. Lệnh `rm` ở layer 3 chỉ đặt một dấu ẩn (whiteout) lên bề mặt, còn nội dung thật của `.env` vẫn nằm nguyên vẹn trong layer 2!
    fix: Xoá bỏ dòng COPY nhạy cảm, chặn `.env` bằng `.dockerignore` và xoay vòng (rotate) ngay khoá bí mật đã lộ.
  - symptom: Tách rời 2 dòng RUN apk update và RUN apk add curl trên Alpine
    badge: Lỗi Stale Cache 404
    tone: amber
    cause: Dòng `RUN apk update` vừa để lại rác chỉ mục làm nặng Image, vừa bị kẹt trong cache cũ nhiều tuần khiến `RUN apk add curl` sau đó tải nhầm bản gói đã xoá trên kho Alpine (lỗi 404).
    fix: Luôn gộp thành 1 dòng chuẩn duy nhất `RUN apk add --no-cache curl`.
    cmd: RUN apk add --no-cache curl
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Thứ tự vàng tối ưu Layer Cache:** `COPY package*.json ./` -> `RUN npm ci` -> cuối cùng mới `COPY . .`.
> - Luôn tạo **`.dockerignore`** chặn `node_modules`, `.git`, `.env` (dùng dấu **`!`** ở đầu dòng như `!README.md` để giữ ngoại lệ).
> - **`ARG`** chỉ sống lúc `docker build` · **`ENV`** sống tới lúc container chạy (`process.env`) · Trên Alpine luôn dùng **`RUN apk add --no-cache <gói>`**.

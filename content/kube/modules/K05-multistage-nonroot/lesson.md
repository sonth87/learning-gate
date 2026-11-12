# Multi-stage Build, Non-Root User & HEALTHCHECK chuẩn Production

Khi đóng gói dự án **TypeScript, NestJS, Next.js hoặc Vite**, bạn luôn đối mặt với một nghịch lý kinh điển:

- [>] **Lúc biên dịch (`npm run build`):** Bắt buộc phải có `typescript`, `@types/node`, `esbuild`, `eslint`, mã nguồn `.ts` và đôi khi cả bộ biên dịch C++ `python3 make g++` — tổng dung lượng ngốn từ **700 MB đến 1.2 GB**.
- [>] **Lúc chạy thật trên Production (`node dist/main.js`):** Node.js chỉ cần đúng thư mục kết quả **`dist/`** vài trăm KB cùng các gói `dependencies` chạy thật (đã gọt sạch `devDependencies`).

Nhét tất cả vào một Image đơn lẻ vừa làm chậm gấp 5 lần tốc độ kéo Image khi Kubernetes mở rộng Pod, vừa dâng sẵn trình biên dịch và công cụ dò quét cho kẻ tấn công! ==Multi-stage Build== ({emerald:nhẹ gấp 6 lần}), {amber:hạ quyền `USER node`} và {sky:tự khám `HEALTHCHECK`} chính là bộ ba tiêu chuẩn vàng cho mọi Image Production năm 2026.

## 1. Tư duy nhà máy lắp ráp: Multi-stage Dockerfile (`builder` -> `runner`)

> [!ANALOGY] Xưởng chế tạo & Hộp thành phẩm xuất xưởng
> Một `Dockerfile` được phép chứa **nhiều chỉ thị `FROM`**. Mỗi dòng `FROM` mở ra một giai đoạn (*stage*) mới tinh: mọi mùn cưa, máy móc cồng kềnh nằm lại ở xưởng **`builder`**, chỉ có thành phẩm tinh gọn ở stage cuối cùng (**`runner`**) mới được đóng hộp xuất xưởng!

```visual
kind: layers
title: "Dây Chuyền Multi-Stage Build Cho Ứng Dụng TypeScript / Node 22"
subtitle: "Toàn bộ trình biên dịch tsc, mã nguồn .ts và devDependencies ở Stage 1 tự động bị vứt bỏ khỏi Image cuối!"
columns:
  - title: "STAGE 1: builder (Xưởng chế tạo tạm)"
    badge: "~850 MB · Tự huỷ sau khi build"
    tone: amber
    layers:
      - label: "FROM node:22-alpine AS builder"
        note: Mở xưởng build
        tone: slate
      - label: "COPY package*.json ./ && RUN npm ci"
        sub: "Cài ĐẦY ĐỦ cả dependencies lẫn devDependencies (typescript, eslint...)"
        note: Full node_modules
        tone: amber
      - label: "COPY tsconfig.json src/ && RUN npm run build"
        sub: "Biên dịch toàn bộ mã nguồn TypeScript sang JavaScript thuần tại /app/dist"
        note: Sinh ra /app/dist
        tone: violet
      - label: "RUN npm prune --omit=dev"
        sub: "Chuẩn npm 10+ (Node 22): gọt sạch toàn bộ gói devDependencies ngay tại chỗ!"
        note: Gọt nhẹ gọn
        tone: cyan
    footer: "Không một lớp nào của Stage 1 đi thẳng vào Image phát hành!"
  - title: "STAGE 2: runner (Image xuất xưởng)"
    badge: "~145 MB · Nhẹ gấp 6 lần & An toàn"
    tone: emerald
    layers:
      - label: "FROM node:22-alpine AS runner"
        sub: "Khởi tạo nền Alpine mới tinh, bật ENV NODE_ENV=production"
        note: Sạch bóng rác build
        tone: emerald
      - label: "COPY --from=builder --chown=node:node ..."
        sub: "Chỉ gắp sang đúng 3 thứ: package.json, node_modules (đã prune) và dist/"
        note: Chỉ lấy thành phẩm
        tone: sky
      - label: "USER node  (UID 1000 — Non-Root)"
        sub: "Hạ đặc quyền khỏi root trước khi mở cổng 3000"
        note: Khoá chặt bảo mật
        tone: emerald
      - label: 'CMD ["node", "dist/main.js"]'
        note: PID 1 chuẩn mực
        tone: cyan
    footer: "Tải siêu tốc trên Kubernetes · Giảm tối đa bề mặt lỗ hổng CVE!"
```

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

# 3. Gọt bỏ toàn bộ devDependencies theo chuẩn npm hiện đại (thay cho --production cũ)
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

> [!TIP] Chuẩn cú pháp npm hiện đại trên Node 22 (npm 10+)
> Để loại bỏ `devDependencies` sau khi đã chạy `npm run build`, hãy luôn viết ==`npm prune --omit=dev`== (hoặc `npm ci --omit=dev` nếu không cần bước biên dịch). Cờ cũ `--production` đã bị npm chính thức đánh dấu lỗi thời (*deprecated*) và sẽ xả cảnh báo vàng trên log CI/CD!

## 2. Hạ quyền khỏi `root` với `USER node`: Chốt chặn bảo mật sống còn

Một sự thật khiến nhiều kỹ sư giật mình: **nếu không khai báo chỉ thị `USER`, mọi Docker container mặc định đều chạy dưới quyền tối cao `root` (`UID 0`)!**

```visual
kind: compare
title: "Chạy Mặc Định Dưới Quyền root (UID 0) vs Hạ Quyền USER node (UID 1000)"
subtitle: "Mọi biến thể chính thức node:22-alpine và node:22-slim đều đã tạo sẵn tài khoản phi đặc quyền tên là node!"
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
    - "`UID 0` trong container ánh xạ thẳng với `UID 0` của nhân Linux nếu không bật UserNS Remapping"
    - "Nếu dính lỗ hổng RCE hoặc Container Escape, kẻ tấn công chiếm trọn quyền điều khiển"
    - "Bị cụm Kubernetes bật **Pod Security Admission `restricted`** từ chối thẳng thừng không cho chạy!"
right:
  badge: "CHUẨN PRODUCTION · Non-Root UID 1000"
  title: "Chuyển sang USER node + Cổng >= 1024"
  tone: emerald
  code: |
    COPY --from=builder --chown=node:node /app/dist ./dist
    USER node
    EXPOSE 3000
    CMD ["node", "dist/main.js"]
  lang: dockerfile
  bullets:
    - "Chạy dưới tài khoản phi đặc quyền ==`USER node`== (`UID 1000`, `GID 1000`) có sẵn trong official image"
    - "**Lưu ý cổng Linux:** Non-root (`UID >= 1000`) **không được mở cổng đặc quyền `< 1024`** (cố mở cổng `80` hay `443` sẽ sập ngay với lỗi `EACCES: permission denied`!)"
    - "Luôn để ứng dụng lắng nghe trên cổng cao như **`3000`** hoặc **`8080`**"
```

## 3. Tự khám sức khoẻ định kỳ bằng chỉ thị `HEALTHCHECK`

Hãy hình dung sự cố âm ỉ nguy hiểm nhất trên Production: kết nối tới Redis bị treo hoặc Event Loop bị deadlock khiến mọi request vào cổng `3000` đều quay vòng 504 Timeout, nhưng bản thân tiến trình `node` **vẫn chưa thoát** nên `docker ps` vẫn báo xanh rờn `Up 3 days`!

Chỉ thị `HEALTHCHECK` dạy cho Docker Engine cách chủ động gọi HTTP vào bên trong để xác nhận ứng dụng thực sự còn phục vụ được khách hàng:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
```

```visual
kind: anatomy
title: "Giải Phẫu Chỉ Thị HEALTHCHECK Không Cần Cài curl Trên Node.js 22"
subtitle: "Tận dụng hàm fetch() toàn cục có sẵn của Node 22 để giữ Image cuối sạch bóng công cụ tải mạng dư thừa"
items:
  - keyword: "--interval & --timeout"
    role: Nhịp khám & Hạn giờ
    tone: sky
    summary: "Cứ mỗi `30s` Docker gõ cửa kiểm tra 1 lần; nếu quá `3s` không phản hồi thì tính là 1 lần thất bại."
    bullets:
      - "`--start-period=10s` ân xá 10 giây đầu lúc ứng dụng đang khởi động kết nối DB"
      - "`--retries=3` cho phép trượt liên tiếp 3 lần trước khi chính thức gắn nhãn `(unhealthy)`"
  - keyword: "node -e fetch(...)"
    role: Tận dụng Node 22 Native
    tone: emerald
    summary: "Dùng ngay hàm `fetch()` tích hợp sẵn toàn cục trên Node 22 thay vì phải chạy `apk add curl`."
    bullets:
      - "**Lợi ích bảo mật kép:** Không cài `curl` / `wget` ở stage `runner` khiến kẻ tấn công không có công cụ tải mã độc về nếu ứng dụng lỡ dính lỗi RCE!"
  - keyword: "exit 0 vs exit 1"
    role: Quy ước mã thoát sống còn
    tone: amber
    summary: "Docker phán quyết sức khoẻ container hoàn toàn dựa vào mã thoát của lệnh kiểm tra."
    bullets:
      - "==`exit 0`== -> **Khoẻ mạnh (`healthy`)**: cột `STATUS` trong `docker ps` hiện rõ `Up 2 minutes (healthy)`"
      - "==`exit 1`== -> **Bất ổn (`unhealthy`)**: báo động cho Docker Compose (`condition: service_healthy`) hoặc hệ thống giám sát xử lý kịp thời"
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Multi-stage Build:** Biên dịch ở `FROM ... AS builder`, gọt gói dev bằng **`RUN npm prune --omit=dev`**, rồi nhấc thành phẩm sang `runner` bằng **`COPY --from=builder`**.
> - Mặc định container chạy `root` (`UID 0`) -> luôn hạ quyền bằng **`USER node`** (`UID 1000`) và lắng nghe ở cổng **`>= 1024`** (`3000` / `8080`, tránh cổng `80` gây lỗi `EACCES`).
> - **`HEALTHCHECK`** dùng `node -e "fetch(...)"` gọn sạch không cần `curl`: trả về **`0`** = `healthy` · trả về **`1`** = `unhealthy`.

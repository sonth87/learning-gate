# Multi-stage Build, Non-Root User & HEALTHCHECK chuẩn Production

Khi làm việc với dự án **TypeScript, NestJS, Next.js hoặc Vite**, bạn luôn rơi vào một nghịch lý quen thuộc:
- **Lúc biên dịch (`npm run build`):** Bạn bắt buộc cần `typescript`, `@types/node`, `esbuild`, `eslint`, mã nguồn gốc `.ts` và thậm chí cả trình biên dịch C++ `python3 make g++` — tổng dung lượng có thể lên tới **700 MB – 1.2 GB**.
- **Lúc chạy thật trên máy chủ Production (`node dist/main.js`):** Node.js chỉ cần đúng thư mục kết quả **`dist/`** vài trăm KB và các thư viện chạy thật (`dependencies` đã lọc bỏ toàn bộ `devDependencies`).

Nếu nhét tất cả vào một Image đơn lẻ truyền thống, bạn vừa tốn gấp 5 lần chi phí lưu trữ/băng thông mạng mỗi khi Kubernetes kéo Image mở rộng Pod, vừa tặng không cho kẻ tấn công trình biên dịch và công cụ dò quét ngay bên trong container! **Multi-stage Build** sinh ra để giải quyết trọn vẹn bài toán này.

---

## 1. Tư duy nhà máy lắp ráp: Multi-stage Dockerfile (`builder` → `runner`)

Một tệp `Dockerfile` duy nhất được phép chứa **nhiều chỉ thị `FROM`**. Mỗi chữ `FROM` mở ra một giai đoạn (stage) hoàn toàn mới với cây thư mục sạch tinh; chỉ những gì ở **stage cuối cùng** mới đi vào Image xuất xưởng, còn toàn bộ rác trung gian ở các stage trước tự động bị vứt bỏ!

```dockerfile
# ==================== STAGE 1: builder (Xưởng chế tạo) ====================
FROM node:22-alpine AS builder
WORKDIR /app

# 1. Cài ĐẦY ĐỦ cả dependencies lẫn devDependencies (để có trình biên dịch tsc)
COPY package.json package-lock.json ./
RUN npm ci

# 2. Chép mã nguồn TypeScript và biên dịch ra thư mục /app/dist
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 3. Gọt bỏ toàn bộ devDependencies ngay sau khi đã build xong!
RUN npm prune --omit=dev

# ==================== STAGE 2: runner (Đóng hộp thành phẩm) ====================
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Chỉ gắp đúng thành phẩm sang từ stage "builder", bỏ lại toàn bộ .ts và cache thừa
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

> **Cập nhật cú pháp chuẩn npm hiện đại (Node 22 / npm 10+):** Để loại bỏ `devDependencies`, hãy luôn dùng **`npm prune --omit=dev`** (hoặc cài mới bằng `npm ci --omit=dev`). Cờ cũ `--production` đã bị npm đánh dấu lỗi thời (deprecated) và sẽ phát sinh cảnh báo trên log CI/CD!

---

## 2. Hạ quyền khỏi `root` với `USER node`: Chốt chặn bảo mật sống còn

Một sự thật khiến nhiều lập trình viên giật mình: **mặc định mọi Docker container đều chạy dưới quyền `root` (`UID 0`)!**

Dù đã có Namespaces bao bọc, `UID 0` bên trong container vẫn ánh xạ với `UID 0` của nhân Linux nếu không bật User Namespace Remapping. Nếu ứng dụng web bị khai thác lỗ hổng đọc/ghi tệp tuỳ ý hoặc lỗ hổng nhân Linux (Container Escape), tiến trình chạy bằng `root` sẽ gây hậu quả thảm khốc gấp bội. Hơn nữa, ở cấp độ Kubernetes Production bật chính sách **Pod Security Admission `restricted`**, bất kỳ Image nào chạy dưới `UID 0` sẽ bị **cụm từ chối thẳng thừng không cho phép khởi chạy**!

May mắn thay, toàn bộ các Image chính thức `node:22-alpine` và `node:22-slim` đều đã tạo sẵn một tài khoản phi đặc quyền tên là **`node` (`UID 1000`, `GID 1000`)**:

1. Khi chép tệp vào stage cuối, dùng `--chown=node:node` nếu ứng dụng cần quyền sở hữu rõ ràng (hoặc tốt hơn nữa là để code chỉ đọc, không cho phép tự sửa mã nguồn lúc chạy).
2. Đặt dòng **`USER node`** trước `CMD` ở stage cuối cùng.
3. Chú ý: tài khoản non-root (`UID >= 1000`) trên Linux không được mở các cổng đặc quyền `< 1024` (như cổng `80` hay `443`). Hãy luôn để Node.js lắng nghe trên cổng cao như **`3000`** hoặc **`8080`**!

---

## 3. Tự khám sức khoẻ định kỳ bằng chỉ thị `HEALTHCHECK`

Hãy tưởng tượng một tình huống oái oăm: kết nối tới Redis bị kẹt hoặc vòng lặp bất đồng bộ bị deadlock khiến mọi request vào cổng `3000` đều treo cứng 504 Timeout, nhưng bản thân tiến trình `node` **chưa sập** nên `docker ps` vẫn báo `Up 3 days`!

Chỉ thị `HEALTHCHECK` dạy cho Docker Engine cách chủ động gõ cửa kiểm tra ứng dụng thực sự còn phản hồi HTTP hay không:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
```

### Tại sao trên Node 22 ta gọi `node -e "fetch(...)"` thay vì cài `curl`?
- Từ Node 18 trở đi và ổn định tuyệt đối trên **Node 22**, hàm `fetch()` đã có sẵn toàn cục (built-in global) mà không cần cài bất kỳ thư viện nào!
- Dùng chính `node` để kiểm tra giúp bạn **không phải chạy `apk add curl`** ở stage `runner` — giữ cho Image cuối cùng sạch bóng công cụ tải tệp từ mạng (chống kẻ tấn công lợi dụng `curl`/`wget` tải mã độc về chạy nếu ứng dụng dính lỗi RCE).
- Khi kiểm tra thành công (`exit 0`), cột `STATUS` trong `docker ps` hiện rõ **`Up 2 minutes (healthy)`**; nếu thất bại liên tiếp quá `retries`, trạng thái đổi thành **`(unhealthy)`** để Docker Compose (với `condition: service_healthy`) hoặc hệ thống giám sát hành động kịp thời.

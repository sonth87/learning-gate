import { PracticeExercise } from '../types/kube.types';

export const PRACTICE_EXERCISES: PracticeExercise[] = [
  // =========================================================================
  // LAB 01: MULTI-STAGE DOCKERFILE, LAYER CACHE & NON-ROOT
  // =========================================================================
  {
    id: 'prac-1-dockerfile',
    stageId: 'stage-1',
    level: 'basic',
    category: 'dockerfile',
    title:
      'Lab 01: Tối ưu Dockerfile Multi-stage (<100MB), Khóa Layer Cache & Hạ quyền Non-Root',
    scenario:
      'Dự án Node.js/TypeScript của công ty đang dùng một Dockerfile sơ sài nặng 920MB, mỗi lần sửa 1 dòng code đều mất 6 phút tải lại npm install và chạy dưới quyền root nguy hiểm. Hãy viết lại Dockerfile chuẩn sản xuất 2 giai đoạn (Multi-stage Build).',
    requirements: [
      'Giai đoạn 1 đặt tên là builder (FROM node:20-alpine AS builder) và WORKDIR /usr/src/app',
      'Copy riêng package.json package-lock.json ./ trước rồi chạy RUN npm ci để khóa bộ nhớ đệm Layer Cache',
      'Sau đó mới COPY . . và chạy lệnh biên dịch RUN npm run build',
      'Giai đoạn 2 đặt tên là runner (FROM node:20-alpine AS runner), khai báo ENV NODE_ENV=production',
      'Bắt buộc hạ quyền xuống tài khoản thường bằng lệnh USER node',
      'Dùng COPY --from=builder để nhặt thành phẩm và khởi chạy bằng CMD ["node", "dist/server.js"]',
    ],
    filename: 'Dockerfile',
    starterCode: `# HÃY HOÀN THIỆN DOCKERFILE MULTI-STAGE CHUẨN DOANH NGHIỆP:
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# TODO 1: Copy riêng package.json và package-lock.json rồi chạy npm ci để khóa Cache


# TODO 2: Copy toàn bộ mã nguồn và biên dịch


# GIAI ĐOẠN 2: PHÒNG TRƯNG BÀY (RUNNER)
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# TODO 3: Hạ quyền bảo mật xuống tài khoản 'node' và COPY --from=builder


EXPOSE 3000
CMD ["node", "dist/server.js"]`,
    solutionCode: `# =====================================================================
# GIAI ĐOẠN 1: NHÀ XƯỞNG CHẾ BIẾN (BUILDER STAGE)
# =====================================================================
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Bước 1: Chỉ copy trước 2 file khai báo thư viện (ít khi thay đổi)
# Giúp khóa chặt bộ nhớ đệm Layer Cache — không phải tải lại 250MB node_modules
COPY package.json package-lock.json ./
RUN npm ci

# Bước 2: Copy toàn bộ mã nguồn và biên dịch TypeScript -> JavaScript
COPY . .
RUN npm run build && npm prune --omit=dev

# =====================================================================
# GIAI ĐOẠN 2: PHÒNG TRƯNG BÀY SẢN XUẤT (PRODUCTION RUNNER STAGE)
# =====================================================================
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Bước 3: Hạ quyền từ root xuống tài khoản 'node' (UID 1000) để bảo mật
USER node

# Bước 4: Chỉ nhặt đúng thành phẩm đã tinh chế từ xưởng 'builder' sang
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/package.json ./

EXPOSE 3000
CMD ["node", "dist/server.js"]`,
    hints: [
      'Đặt dòng COPY package.json package-lock.json ./ ngay phía trên dòng RUN npm ci.',
      'Sau khi RUN npm ci xong mới viết COPY . . và RUN npm run build.',
      'Ở Stage 2 (runner), thêm dòng USER node và dùng COPY --from=builder /usr/src/app/dist ./dist.',
    ],
    architectureGuide: {
      whyItMatters:
        'Trong môi trường CI/CD thực tế, một ngày đội ngũ kỹ sư có thể đẩy code 30–50 lần. Nếu không khóa Layer Cache và tách Multi-stage, mỗi lần build sẽ tốn 5–6 phút tải mạng và tạo ra một Image nặng gần 1GB chứa đầy trình biên dịch thừa thãi.',
      realWorldAnalogy:
        'Giống như làm bánh kem nhiều tầng và tách riêng "Nhà bếp đầy bột mì, vỏ trứng" (Builder) khỏi "Hộp bánh sang trọng giao cho khách" (Runner). Nếu bạn để bước nhào bột ở dưới đáy hộp, mỗi khi đổi chữ viết trên mặt bánh bạn không cần phải nướng lại cốt bánh!',
      commonPitfall:
        'Lỗi kinh điển nhất của người mới là viết `COPY . .` ngay đầu file trước `RUN npm ci`. Chỉ cần sửa 1 dấu chấm phẩy trong file code, Docker thấy tầng `COPY . .` thay đổi nên xóa sạch bộ nhớ đệm của tầng `RUN npm ci` bên dưới!',
    },
    stepByStepGuide: [
      {
        stepNumber: 1,
        stepTitle: 'Khóa bộ nhớ đệm thư viện ở Giai đoạn 1 (TODO 1)',
        explanation:
          'Ngay dưới dòng `WORKDIR /usr/src/app` của giai đoạn `builder`, hãy copy riêng 2 file khai báo thư viện rồi chạy `npm ci`. Vì 2 file này hiếm khi đổi, Docker sẽ lưu tầng này vào Cache.',
        codeSnippet: `COPY package.json package-lock.json ./
RUN npm ci`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Copy mã nguồn và biên dịch ra thư mục dist (TODO 2)',
        explanation:
          'Sau khi đã có thư viện, copy toàn bộ code nguồn vào và chạy lệnh biên dịch `npm run build` cùng `npm prune --omit=dev` để loại bỏ các thư viện chỉ dùng lúc dev (devDependencies).',
        codeSnippet: `COPY . .
RUN npm run build && npm prune --omit=dev`,
      },
      {
        stepNumber: 3,
        stepTitle: 'Hạ quyền Non-Root & Nhặt thành phẩm sang Runner (TODO 3)',
        explanation:
          'Ở giai đoạn 2 (`AS runner`), tuyệt đối không chạy dưới quyền `root`. Hãy gọi `USER node` và dùng cờ `--from=builder` để chỉ lấy thư mục `dist` và `node_modules` gọn nhẹ sang.',
        codeSnippet: `USER node

COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/package.json ./`,
      },
    ],
    cliVerificationChecks: [
      {
        command: 'docker build -t shop-web:v1.0 .',
        purpose: 'Đóng gói Image và kiểm tra tốc độ Layer Cache khi chạy lần 2',
        expectedOutput:
          '[+] Building 1.8s (14/14) FINISHED\n => CACHED [builder 3/5] COPY package.json package-lock.json ./\n => CACHED [builder 4/5] RUN npm ci',
      },
      {
        command: 'docker images shop-web:v1.0',
        purpose: 'Kiểm tra dung lượng Image sau khi áp dụng Multi-stage Build',
        expectedOutput:
          'REPOSITORY   TAG       IMAGE ID       CREATED          SIZE\nshop-web     v1.0      8f9c2a1b4d3e   10 seconds ago   58.4MB',
      },
      {
        command: 'docker run --rm shop-web:v1.0 whoami',
        purpose: 'Xác minh Container đang chạy dưới quyền user thường (không phải root)',
        expectedOutput: 'node',
      },
    ],
    solutionAnnotations: [
      {
        section: 'FROM node:20-alpine AS builder',
        explanation:
          'Sử dụng bản Alpine Linux siêu nhẹ (~40MB thay vì ~1GB của bản Debian đầy đủ) và đặt bí danh là xưởng "builder".',
      },
      {
        section: 'COPY package.json package-lock.json ./ && RUN npm ci',
        explanation:
          'Tách biệt tầng cài đặt thư viện khỏi tầng mã nguồn. Chừng nào không cài thêm gói mới, bước này tốn 0.0 giây nhờ Cache.',
      },
      {
        section: 'USER node',
        explanation:
          'Chuyển quyền thực thi sang tài khoản bình thường `node`. Nếu hacker khai thác được lỗ hổng web, chúng cũng không có quyền `root` để phá hủy máy chủ.',
      },
      {
        section: 'COPY --from=builder --chown=node:node ...',
        explanation:
          'Chỉ gắp đúng thành phẩm từ xưởng `builder` sang phòng `runner`, bỏ lại toàn bộ mã nguồn `.ts` và công cụ biên dịch nặng nề.',
      },
    ],
    validationRules: [
      {
        id: 'rule-cache',
        description:
          'Tách riêng COPY package.json và RUN npm ci để khóa bộ nhớ đệm Layer Cache',
        mustContain: ['COPY package.json', 'RUN npm ci'],
      },
      {
        id: 'rule-multistage',
        description:
          'Sử dụng Multi-stage Build (AS builder, AS runner và COPY --from=builder)',
        mustContain: ['AS builder', 'AS runner', 'COPY --from=builder'],
      },
      {
        id: 'rule-nonroot',
        description:
          'Hạ quyền bảo mật từ root xuống tài khoản thường bằng USER node',
        mustContain: ['USER node'],
      },
    ],
  },

  // =========================================================================
  // LAB 02: .DOCKERIGNORE & DOCKER HEALTHCHECK
  // =========================================================================
  {
    id: 'prac-2-dockerignore-health',
    stageId: 'stage-1',
    level: 'basic',
    category: 'dockerfile',
    title:
      'Lab 02: Thiết kế .dockerignore Chặn Rác/Mật Khẩu & Cấu hình HEALTHCHECK Tự Khám Bệnh',
    scenario:
      'Mỗi khi lập trình viên gõ lệnh `docker build .`, Docker mất 45 giây chỉ để gửi 600MB thư mục `node_modules` và `.git` vào Build Context, thậm chí làm lộ cả file mật khẩu `.env` vào trong Image! Ngoài ra, khi ứng dụng bị treo cứng, `docker ps` vẫn báo `Up 2 hours` chứ không biết đường cảnh báo. Hãy viết kết hợp danh sách chặn `.dockerignore` và chỉ thị `HEALTHCHECK` trong Dockerfile.',
    requirements: [
      'Trong phần .dockerignore: Chặn thư mục node_modules, .git, dist và các file nhạy cảm .env*',
      'Trong phần Dockerfile: Bổ sung chỉ thị HEALTHCHECK với --interval=30s --timeout=5s --retries=3',
      'Sử dụng lệnh wget hoặc curl kiểm tra đường dẫn http://localhost:3000/health/live || exit 1',
      'Khởi chạy bằng cú pháp mảng JSON chuẩn Exec Form: CMD ["node", "dist/server.js"] để nhận đúng tín hiệu tắt máy SIGTERM',
    ],
    filename: 'Dockerfile & .dockerignore',
    starterCode: `# ==========================================================
# PHẦN 1: NỘI DUNG FILE .dockerignore
# TODO 1: Liệt kê các thư mục rác và file mật khẩu cấm đưa vào Image
# ==========================================================
node_modules
# Điền thêm .git, dist và .env* ở dưới:



# ==========================================================
# PHẦN 2: NỘI DUNG FILE Dockerfile
# ==========================================================
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
USER node
COPY --chown=node:node ./dist ./dist
COPY --chown=node:node ./node_modules ./node_modules

EXPOSE 3000

# TODO 2: Khai báo HEALTHCHECK định kỳ 30s kiểm tra http://localhost:3000/health/live


# TODO 3: Khởi chạy bằng Exec Form JSON Array để nhận tín hiệu SIGTERM
CMD ____________________`,
    solutionCode: `# ==========================================================
# PHẦN 1: NỘI DUNG FILE .dockerignore
# ==========================================================
node_modules
npm-debug.log
.git
.gitignore
dist
coverage
.env
.env.*
Dockerfile
docker-compose.yml

# ==========================================================
# PHẦN 2: NỘI DUNG FILE Dockerfile
# ==========================================================
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
USER node
COPY --chown=node:node ./dist ./dist
COPY --chown=node:node ./node_modules ./node_modules

EXPOSE 3000

# Bác sĩ nội trú kiểm tra sức khỏe mỗi 30 giây, quá 3 lần thất bại sẽ đánh dấu unhealthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health/live || exit 1

# Bắt buộc dùng Exec Form (mảng JSON) để tiến trình node nhận trực tiếp tín hiệu SIGTERM
CMD ["node", "dist/server.js"]`,
    hints: [
      'Ở phần 1 (.dockerignore), thêm các dòng `.git`, `dist`, `.env` hoặc `.env.*`.',
      'Ở phần 2, viết `HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/health/live || exit 1`.',
      'Ở dòng cuối, viết `CMD ["node", "dist/server.js"]`.',
    ],
    architectureGuide: {
      whyItMatters:
        'Khi chạy `docker build .`, dấu chấm `.` có nghĩa là gửi toàn bộ thư mục hiện tại tới Docker Daemon. Nếu thiếu `.dockerignore`, cả GB rác và khóa bí mật `.env` sẽ bị đóng gói thẳng vào Image. Đồng thời, nếu viết `CMD node server.js` (Shell Form) thay vì `CMD ["node", "server.js"]` (Exec Form), tiến trình `/bin/sh` sẽ nuốt mất tín hiệu `SIGTERM` làm Container không thể tắt êm ái!',
      realWorldAnalogy:
        '`.dockerignore` giống như "Danh sách hàng cấm bay ở cửa an ninh sân bay" (chặn vật liệu nổ `.env` và hành lý quá khổ `node_modules`). Còn `HEALTHCHECK` là "Thiết bị đo nhịp tim đeo tay" báo ngay khi bệnh nhân ngất xỉu dù mắt vẫn mở.',
      commonPitfall:
        'Quên thêm `.env` vào `.dockerignore` khiến mật khẩu Database Production nằm vĩnh viễn trong lịch sử các tầng (Layers) của Docker Image — bất kỳ ai kéo Image về dùng lệnh `docker history` hoặc `docker inspect` đều đọc được!',
    },
    stepByStepGuide: [
      {
        stepNumber: 1,
        stepTitle: 'Hoàn thiện danh sách chặn trong .dockerignore (TODO 1)',
        explanation:
          'Liệt kê các thư mục nặng (`node_modules`, `.git`, `dist`) và các tệp cấu hình nhạy cảm (`.env`, `.env.*`) để loại bỏ hoàn toàn khỏi Build Context.',
        codeSnippet: `node_modules
.git
dist
.env
.env.*`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Cấu hình chỉ thị HEALTHCHECK tự động khám sức khỏe (TODO 2)',
        explanation:
          'Sử dụng `HEALTHCHECK` với chu kỳ `--interval=30s`, thời gian chờ `--timeout=5s`, số lần thử `--retries=3` gọi vào endpoint `/health/live`. Nếu lệnh trả về `exit 1`, Docker sẽ đánh dấu Container là `(unhealthy)`.',
        codeSnippet: `HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health/live || exit 1`,
      },
      {
        stepNumber: 3,
        stepTitle: 'Sử dụng Exec Form cho chỉ thị CMD (TODO 3)',
        explanation:
          'Viết `CMD ["node", "dist/server.js"]` dưới dạng mảng JSON để Node.js chạy ở PID 1, nhận trực tiếp tín hiệu `SIGTERM` khi dừng Container để đóng kết nối Database an toàn (Graceful Shutdown).',
        codeSnippet: `CMD ["node", "dist/server.js"]`,
      },
    ],
    cliVerificationChecks: [
      {
        command: 'docker ps',
        purpose: 'Quan sát cột STATUS hiển thị trạng thái sức khỏe (healthy) của Container',
        expectedOutput:
          'CONTAINER ID   IMAGE           STATUS                    PORTS                    NAMES\n4b19e2c0a11f   shop-web:v1.0   Up 2 minutes (healthy)    0.0.0.0:3000->3000/tcp   shop-web',
      },
      {
        command: 'docker inspect --format="{{json .State.Health.Status}}" shop-web',
        purpose: 'Trích xuất trạng thái Healthcheck tự động trong script giám sát',
        expectedOutput: '"healthy"',
      },
    ],
    solutionAnnotations: [
      {
        section: 'node_modules / .git / .env.*',
        explanation:
          'Giảm kích thước Build Context gửi sang Docker Engine từ hàng trăm MB xuống chỉ còn vài trăm KB mã nguồn thuần túy, đồng thời bảo vệ tuyệt đối file mật khẩu `.env`.',
      },
      {
        section: 'HEALTHCHECK --interval=30s ... CMD wget -qO- ... || exit 1',
        explanation:
          'Cứ mỗi 30 giây Docker tự động bắn một request kiểm tra cổng 3000 bên trong Container. Nếu treo quá 3 lần liên tiếp, trạng thái chuyển sang `unhealthy`.',
      },
      {
        section: 'CMD ["node", "dist/server.js"]',
        explanation:
          'Cú pháp Exec Form giúp tiến trình ứng dụng nhận trực tiếp tín hiệu `SIGTERM` từ hệ điều hành mà không bị lớp vỏ `/bin/sh -c` chặn mất.',
      },
    ],
    validationRules: [
      {
        id: 'rule-ignore',
        description:
          'Chặn đầy đủ node_modules, .git, dist và .env trong danh sách .dockerignore',
        mustContain: ['node_modules', '.git', 'dist', '.env'],
      },
      {
        id: 'rule-healthcheck',
        description:
          'Khai báo HEALTHCHECK kiểm tra đường dẫn /health/live kèm || exit 1',
        mustContain: ['HEALTHCHECK', '/health/live', 'exit 1'],
      },
      {
        id: 'rule-execform',
        description:
          'Sử dụng cú pháp mảng JSON Exec Form: CMD ["node", "dist/server.js"]',
        mustContain: ['CMD ["node", "dist/server.js"]'],
        mustNotContain: ['____'],
      },
    ],
  },

  // =========================================================================
  // LAB 03: DOCKER COMPOSE MULTI-CONTAINER + VOLUME + HEALTHY DEPENDENCY
  // =========================================================================
  {
    id: 'prac-3-compose',
    stageId: 'stage-1',
    level: 'basic',
    category: 'compose',
    title:
      'Lab 03: Viết docker-compose.yml Đa Tầng (Web + PostgreSQL + Redis) Có Két Sắt Volume',
    scenario:
      'Thiết lập môi trường phát triển Local gồm 3 Container: backend-api (mở cổng 8080:3000), postgres-db (lưu dữ liệu bền vững vào két sắt Volume pgdata) và redis-cache, kết nối chung trong mạng nội bộ shop-network.',
    requirements: [
      'Cấu hình ports của backend-api nối cổng máy thật 8080 vào cổng 3000 của Container ("8080:3000")',
      'Cấu hình biến môi trường DB_HOST=postgres-db và REDIS_HOST=redis-cache',
      'Khai báo depends_on để đợi postgres-db và redis-cache bật trước',
      'Gắn két sắt Volume pgdata:/var/lib/postgresql/data cho container postgres-db để xóa container không mất dữ liệu',
    ],
    filename: 'docker-compose.yml',
    starterCode: `services:
  backend-api:
    build: .
    container_name: shop-backend-api
    # TODO 1: Mở cổng 8080 máy thật nối vào cổng 3000 của Container
    ports:
      - "____:____"
    environment:
      - NODE_ENV=development
      # TODO 2: Khai báo DB_HOST gọi thẳng tên service postgres-db
      - DB_HOST=________
      - REDIS_HOST=redis-cache
    depends_on:
      - postgres-db
      - redis-cache
    networks:
      - shop-network

  postgres-db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secretpassword
      - POSTGRES_DB=shopdb
    # TODO 3: Gắn két sắt pgdata vào /var/lib/postgresql/data
    volumes:
      - ____________________
    networks:
      - shop-network

  redis-cache:
    image: redis:7-alpine
    networks:
      - shop-network

volumes:
  pgdata:

networks:
  shop-network:`,
    solutionCode: `services:
  backend-api:
    build: .
    container_name: shop-backend-api
    restart: unless-stopped
    ports:
      - "8080:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres-db
      - DB_PORT=5432
      - REDIS_HOST=redis-cache
      - REDIS_PORT=6379
    depends_on:
      - postgres-db
      - redis-cache
    networks:
      - shop-network

  postgres-db:
    image: postgres:16-alpine
    container_name: shop-postgres-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secretpassword
      - POSTGRES_DB=shopdb
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - shop-network

  redis-cache:
    image: redis:7-alpine
    container_name: shop-redis-cache
    restart: unless-stopped
    networks:
      - shop-network

volumes:
  pgdata:

networks:
  shop-network:
    driver: bridge`,
    hints: [
      'Cú pháp ánh xạ cổng là "8080:3000" (Cổng máy thật : Cổng Container).',
      'Trong mạng Docker Compose, các Container gọi nhau bằng tên service: DB_HOST=postgres-db.',
      'Cú pháp gắn Volume cho Postgres là pgdata:/var/lib/postgresql/data.',
    ],
    architectureGuide: {
      whyItMatters:
        'Trong thực tế, một ứng dụng không bao giờ đứng một mình mà luôn cần Cơ sở dữ liệu (PostgreSQL) và Bộ nhớ đệm (Redis). Docker Compose cho phép dựng toàn bộ kiến trúc nhiều tầng này chỉ bằng 1 lệnh `docker compose up -d`, tự động tạo mạng ảo riêng kèm máy chủ DNS nội bộ.',
      realWorldAnalogy:
        'Giống như "Bản thiết kế căn hộ khép kín": phòng khách (`backend-api`), phòng bếp (`postgres-db`) và tủ lạnh (`redis-cache`) nằm chung trong một hành lang nội bộ (`shop-network`). Đặc biệt, sổ sách quan trọng trong bếp được cất vào "Két sắt ngoài đời thật" (`pgdata`) để dù có đập bếp xây lại thì dữ liệu vẫn nguyên vẹn!',
      commonPitfall:
        'Nhiều lập trình viên cấu hình `DB_HOST=localhost` trong container `backend-api` và bị lỗi `ECONNREFUSED 127.0.0.1:5432`. Hãy nhớ: `localhost` bên trong container `backend-api` chính là bản thân container đó chứ không phải máy thật hay container `postgres-db`!',
    },
    stepByStepGuide: [
      {
        stepNumber: 1,
        stepTitle: 'Nối cổng máy thật vào cổng Container (TODO 1)',
        explanation:
          'Tại mục `ports` của `backend-api`, khai báo `"8080:3000"`. Vế trái (`8080`) là cổng trên máy tính của bạn (`http://localhost:8080`), vế phải (`3000`) là cổng mà ứng dụng Node.js đang lắng nghe bên trong Container.',
        codeSnippet: `    ports:
      - "8080:3000"`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Khai báo địa chỉ Database qua DNS nội bộ (TODO 2)',
        explanation:
          'Nhờ chung mạng `shop-network`, Docker tự động phân giải tên dịch vụ `postgres-db` thành địa chỉ IP nội bộ của container Database. Hãy điền `DB_HOST=postgres-db`.',
        codeSnippet: `      - DB_HOST=postgres-db
      - REDIS_HOST=redis-cache`,
      },
      {
        stepNumber: 3,
        stepTitle: 'Gắn két sắt Named Volume cho PostgreSQL (TODO 3)',
        explanation:
          'Mặc định PostgreSQL lưu toàn bộ bảng biểu tại đường dẫn `/var/lib/postgresql/data` bên trong Container. Hãy nối két sắt `pgdata` vào đường dẫn này để khi chạy `docker compose down` dữ liệu không bị bốc hơi.',
        codeSnippet: `    volumes:
      - pgdata:/var/lib/postgresql/data`,
      },
    ],
    cliVerificationChecks: [
      {
        command: 'docker compose up -d',
        purpose: 'Khởi tạo mạng nội bộ, két sắt Volume và bật cả 3 Container chạy ngầm',
        expectedOutput:
          '[+] Running 5/5\n ✔ Network shop-network          Created\n ✔ Volume "pgdata"               Created\n ✔ Container shop-postgres-db    Started\n ✔ Container shop-redis-cache    Started\n ✔ Container shop-backend-api    Started',
      },
      {
        command: 'docker volume ls',
        purpose: 'Kiểm tra két sắt lưu trữ bền vững pgdata đã tồn tại độc lập trên máy chủ',
        expectedOutput: 'DRIVER    VOLUME NAME\nlocal     project_pgdata',
      },
    ],
    solutionAnnotations: [
      {
        section: 'ports: ["8080:3000"]',
        explanation:
          'Chỉ mở cổng cho `backend-api` ra ngoài máy chủ. Hai dịch vụ nhạy cảm là `postgres-db` và `redis-cache` không khai báo `ports` để tránh bị truy cập trái phép từ bên ngoài.',
      },
      {
        section: 'DB_HOST=postgres-db',
        explanation:
          'Sử dụng cơ chế Service Discovery (DNS tự động của Docker Network) để gọi thẳng tên dịch vụ thay vì dùng địa chỉ IP tĩnh dễ thay đổi.',
      },
      {
        section: 'volumes: [pgdata:/var/lib/postgresql/data]',
        explanation:
          'Ánh xạ Named Volume `pgdata` do Docker quản lý vào thư mục dữ liệu gốc của PostgreSQL.',
      },
    ],
    validationRules: [
      {
        id: 'rule-ports',
        description:
          'Ánh xạ cổng 8080 máy thật vào cổng 3000 của Container ("8080:3000")',
        mustContain: ['8080:3000'],
      },
      {
        id: 'rule-dns',
        description:
          'Gọi trực tiếp tên service DB_HOST=postgres-db qua DNS nội bộ',
        mustContain: ['DB_HOST=postgres-db'],
      },
      {
        id: 'rule-volume',
        description:
          'Bảo toàn dữ liệu Postgres bằng Volume pgdata:/var/lib/postgresql/data',
        mustContain: ['pgdata:/var/lib/postgresql/data'],
      },
    ],
  },

  // =========================================================================
  // LAB 04: K8S DEPLOYMENT + ROLLING UPDATE + SERVICE
  // =========================================================================
  {
    id: 'prac-4-k8s-deployment',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'k8s-core',
    title:
      'Lab 04: Viết Bộ Manifest K8s Cốt Lõi: Deployment (RollingUpdate Zero-Downtime) + Service',
    scenario:
      'Chuyển đổi ứng dụng shop-web lên cụm Kubernetes ở namespace production với 3 bản sao Pod, nâng cấp cuốn chiếu Zero-Downtime (maxSurge: 1, maxUnavailable: 0) và nối vào Tổng đài Service cổng 80 → targetPort 3000.',
    requirements: [
      'Khai báo replicas: 3 và chiến lược RollingUpdate với maxSurge: 1, maxUnavailable: 0',
      'Đảm bảo nhãn app: shop-web khớp hoàn toàn ở cả 3 nơi: matchLabels, template.metadata.labels và Service selector',
      'Tiêm cấu hình từ ConfigMap tên là web-app-config thông qua envFrom.configMapRef',
      'Cấu hình Service mở port: 80 và chuyển tiếp vào targetPort: 3000',
    ],
    filename: 'k8s-deployment-service.yaml',
    starterCode: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-deployment
  namespace: production
spec:
  # TODO 1: Duy trì 3 bản sao Pod và cấu hình RollingUpdate Zero-Downtime
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: shop-web
  template:
    metadata:
      labels:
        # TODO 2: Dán thẻ tên cho Pod khớp với matchLabels
        app: ________
    spec:
      containers:
        - name: web-container
          image: myregistry.io/shop-web:v1.2.0
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: web-app-config
---
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
  namespace: production
spec:
  type: ClusterIP
  selector:
    # TODO 3: Cấu hình selector và targetPort cho Tổng đài Service
    app: ________
  ports:
    - port: 80
      targetPort: ____`,
    solutionCode: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-deployment
  namespace: production
  labels:
    app: shop-web
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: shop-web
  template:
    metadata:
      labels:
        app: shop-web
    spec:
      containers:
        - name: web-container
          image: myregistry.io/shop-web:v1.2.0
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: web-app-config
---
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: shop-web
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 3000`,
    hints: [
      'Điền app: shop-web vào cả template.metadata.labels và spec.selector của Service.',
      'Điền targetPort: 3000 để khớp với containerPort: 3000 của Pod.',
    ],
    architectureGuide: {
      whyItMatters:
        'Trong Kubernetes, Pod có vòng đời phù du — mỗi lần tự phục hồi hoặc nâng cấp phiên bản, Pod cũ bị xóa và Pod mới sinh ra với một địa chỉ IP hoàn toàn mới. Do đó, ta bắt buộc phải dùng `Deployment` để quản lý quân số tự động và dùng `Service` làm tổng đài giữ IP tĩnh gom lưu lượng vào các Pod qua nhãn `labels`.',
      realWorldAnalogy:
        '`Deployment` là "Quản lý nhân sự cam kết luôn có đủ 3 nhân viên trực quầy", còn `Service` là "Số điện thoại tổng đài cố định 1900-xxxx". Nhãn `app: shop-web` chính là "Thẻ nhân viên đeo trước ngực": ai đeo đúng thẻ này thì Tổng đài mới chuyển cuộc gọi tới!',
      commonPitfall:
        'Viết lệch chữ hoa/thường hoặc dư dấu gạch ngang ở nhãn `selector` của Service (ví dụ Pod dán `app: shop-web` nhưng Service tìm `app: web-shop`). Khi đó Kubernetes không báo lỗi cú pháp YAML, các Pod vẫn `Running` xanh mượt, nhưng danh sách `Endpoints` của Service trống rỗng (`<none>`) làm sập toàn bộ truy cập!',
    },
    stepByStepGuide: [
      {
        stepNumber: 1,
        stepTitle: 'Kiểm tra chiến lược nâng cấp cuốn chiếu Zero-Downtime (TODO 1)',
        explanation:
          'Với `replicas: 3`, cấu hình `maxSurge: 1` (cho phép bật dư thêm 1 Pod bản mới lên thành 4 Pod) và `maxUnavailable: 0` (cấm làm giảm số Pod sẵn sàng xuống dưới 3). Nhờ đó hệ thống không mất một giây phục vụ nào lúc nâng cấp.',
        codeSnippet: `  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Dán thẻ tên (Labels) cho khuôn đúc Pod (TODO 2)',
        explanation:
          'Tại `spec.template.metadata.labels`, bắt buộc phải điền `app: shop-web` trùng khớp 100% với `spec.selector.matchLabels` ở phía trên.',
        codeSnippet: `  template:
    metadata:
      labels:
        app: shop-web`,
      },
      {
        stepNumber: 3,
        stepTitle: 'Nối Tổng đài Service vào đúng nhãn và đúng cổng Container (TODO 3)',
        explanation:
          'Ở đối tượng `Service`, khai báo `selector.app: shop-web` để gom tất cả Pod có thẻ này, và chuyển tiếp từ `port: 80` của Service vào `targetPort: 3000` (nơi Container đang mở `containerPort: 3000`).',
        codeSnippet: `  selector:
    app: shop-web
  ports:
    - port: 80
      targetPort: 3000`,
      },
    ],
    cliVerificationChecks: [
      {
        command: 'kubectl apply -f k8s-deployment-service.yaml',
        purpose: 'Triển khai cùng lúc Deployment và Service lên namespace production',
        expectedOutput:
          'deployment.apps/web-app-deployment created\nservice/web-app-service created',
      },
      {
        command: 'kubectl get endpoints web-app-service -n production',
        purpose:
          'Kiểm tra xem Tổng đài Service đã tìm thấy địa chỉ IP của cả 3 Pod chưa',
        expectedOutput:
          'NAME              ENDPOINTS                                         AGE\nweb-app-service   10.244.1.12:3000,10.244.2.15:3000,10.244.3.19:3000   15s',
      },
    ],
    solutionAnnotations: [
      {
        section: 'maxSurge: 1 / maxUnavailable: 0',
        explanation:
          'Công thức vàng cho Zero-Downtime Deployment: luôn bật Pod mới lên trước, đợi khỏe mạnh hoàn toàn rồi mới rút Pod cũ.',
      },
      {
        section: 'selector.matchLabels <-> template.metadata.labels <-> Service.selector',
        explanation:
          'Sợi dây liên kết 3 chiều bằng nhãn `app: shop-web`. Cả 3 vị trí này phải khớp nhau từng ký tự.',
      },
      {
        section: 'port: 80 -> targetPort: 3000',
        explanation:
          'Các dịch vụ khác trong cụm gọi vào `http://web-app-service:80`, và `kube-proxy` sẽ âm thầm định tuyến gói tin vào cổng `3000` của từng Pod.',
      },
    ],
    validationRules: [
      {
        id: 'rule-rolling',
        description:
          'Khai báo replicas: 3, maxSurge: 1 và maxUnavailable: 0',
        mustContain: ['replicas: 3', 'maxSurge: 1', 'maxUnavailable: 0'],
      },
      {
        id: 'rule-labels',
        description:
          'Đồng bộ nhãn app: shop-web không còn chỗ trống ____',
        mustContain: ['app: shop-web', 'name: web-app-config'],
        mustNotContain: ['____'],
      },
      {
        id: 'rule-targetport',
        description:
          'Cấu hình Tổng đài Service chuyển tiếp port: 80 vào targetPort: 3000',
        mustContain: ['port: 80', 'targetPort: 3000'],
      },
    ],
  },

  // =========================================================================
  // LAB 05: CONFIGMAP & SECRET INJECTION
  // =========================================================================
  {
    id: 'prac-5-configmap-secret',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'k8s-core',
    title:
      'Lab 05: Tách Biệt Cấu Hình & Mật Khẩu: Tạo ConfigMap + Secret & Tiêm Vào Pod',
    scenario:
      'Để dùng chung duy nhất 1 Docker Image cho cả 3 môi trường (Dev, Staging, Production), bạn không được viết cứng cấu hình hay mật khẩu vào code. Hãy viết file YAML khởi tạo `ConfigMap` (chứa cấu hình thông thường), `Secret` (chứa mật khẩu nhạy cảm) và tiêm cả hai vào trong Pod.',
    requirements: [
      'Tạo đối tượng kind: ConfigMap tên là web-app-config chứa PORT: "3000" và LOG_LEVEL: "info"',
      'Tạo đối tượng kind: Secret tên là web-app-secret (type: Opaque) với stringData chứa DB_PASSWORD và JWT_SECRET',
      'Trong Pod/Deployment, nạp toàn bộ ConfigMap bằng envFrom.configMapRef (name: web-app-config)',
      'Nạp biến mật khẩu DB_PASSWORD từ Secret bằng valueFrom.secretKeyRef (name: web-app-secret, key: DB_PASSWORD)',
    ],
    filename: 'k8s-configmap-secret.yaml',
    starterCode: `apiVersion: v1
kind: ConfigMap
metadata:
  name: web-app-config
  namespace: production
data:
  # TODO 1: Khai báo PORT: "3000" và LOG_LEVEL: "info"
  PORT: "____"
  LOG_LEVEL: "____"
  FEATURE_FLASH_SALE: "true"
---
apiVersion: v1
kind: Secret
metadata:
  name: web-app-secret
  namespace: production
type: Opaque
stringData:
  # TODO 2: Khai báo khóa mật khẩu DB_PASSWORD
  ___________: "SuperSecretProdDbPass2026!"
  JWT_SECRET: "JwtSigningKey998877"
---
apiVersion: v1
kind: Pod
metadata:
  name: shop-web-pod
  namespace: production
spec:
  containers:
    - name: web-container
      image: myregistry.io/shop-web:v1.2.0
      # TODO 3: Tiêm toàn bộ ConfigMap web-app-config vào biến môi trường
      envFrom:
        - configMapRef:
            name: ______________
      env:
        # TODO 4: Tiêm riêng biến DB_PASSWORD từ Secret web-app-secret
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ______________
              key: DB_PASSWORD`,
    solutionCode: `apiVersion: v1
kind: ConfigMap
metadata:
  name: web-app-config
  namespace: production
data:
  PORT: "3000"
  LOG_LEVEL: "info"
  FEATURE_FLASH_SALE: "true"
  API_BASE_URL: "https://api.shop.com"
---
apiVersion: v1
kind: Secret
metadata:
  name: web-app-secret
  namespace: production
type: Opaque
stringData:
  DB_PASSWORD: "SuperSecretProdDbPass2026!"
  JWT_SECRET: "JwtSigningKey998877"
---
apiVersion: v1
kind: Pod
metadata:
  name: shop-web-pod
  namespace: production
spec:
  containers:
    - name: web-container
      image: myregistry.io/shop-web:v1.2.0
      envFrom:
        - configMapRef:
            name: web-app-config
      env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: web-app-secret
              key: DB_PASSWORD`,
    hints: [
      'Ở TODO 1, điền PORT: "3000" và LOG_LEVEL: "info".',
      'Ở TODO 2, điền tên khóa là DB_PASSWORD.',
      'Ở TODO 3 và TODO 4, điền name: web-app-config và name: web-app-secret.',
    ],
    architectureGuide: {
      whyItMatters:
        'Nguyên tắc số 3 của Twelve-Factor App quy định: cấu hình phải được tách hoàn toàn khỏi mã nguồn. Nhờ `ConfigMap` và `Secret`, cùng một Image `shop-web:v1.2.0` khi chạy ở cụm Dev sẽ tự nhận Database Dev, khi chạy ở cụm Production sẽ tự nhận Database Production mà không cần đóng gói lại Image.',
      realWorldAnalogy:
        '`ConfigMap` giống như "Bảng thông báo dán công khai trên tường văn phòng" (giờ làm việc, số cổng, chế độ bật/tắt tính năng). Còn `Secret` là "Phong bì niêm phong chứa mật khẩu két sắt" chỉ trao tận tay cho nhân viên có thẩm quyền bên trong phòng kín (Pod).',
      commonPitfall:
        'Trong Kubernetes `ConfigMap`, mọi giá trị trong mục `data` bắt buộc phải là chuỗi ký tự (String). Nếu bạn viết `PORT: 3000` (số nguyên không có dấu ngoặc kép `"3000"`), Kubernetes API Server sẽ báo lỗi kiểu dữ liệu ngay lập tức!',
    },
    stepByStepGuide: [
      {
        stepNumber: 1,
        stepTitle: 'Hoàn thiện bảng thông báo ConfigMap (TODO 1)',
        explanation:
          'Đặt các giá trị cấu hình không nhạy cảm vào `data` của `ConfigMap`. Nhớ bọc giá trị số hoặc boolean trong dấu ngoặc kép `"3000"`.',
        codeSnippet: `data:
  PORT: "3000"
  LOG_LEVEL: "info"
  FEATURE_FLASH_SALE: "true"`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Khai báo khóa mật khẩu trong Secret (TODO 2)',
        explanation:
          'Sử dụng trường `stringData` giúp bạn viết chuỗi văn bản thuần (Kubernetes sẽ tự động mã hóa sang Base64 khi lưu vào sổ cái etcd). Điền tên khóa `DB_PASSWORD`.',
        codeSnippet: `stringData:
  DB_PASSWORD: "SuperSecretProdDbPass2026!"
  JWT_SECRET: "JwtSigningKey998877"`,
      },
      {
        stepNumber: 3,
        stepTitle: 'Tiêm ConfigMap và Secret vào Container (TODO 3 & TODO 4)',
        explanation:
          'Dùng `envFrom.configMapRef` để nạp toàn bộ các cặp khóa-giá trị của `web-app-config` cùng lúc, và dùng `valueFrom.secretKeyRef` để móc chính xác khóa `DB_PASSWORD` từ `web-app-secret`.',
        codeSnippet: `      envFrom:
        - configMapRef:
            name: web-app-config
      env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: web-app-secret
              key: DB_PASSWORD`,
      },
    ],
    cliVerificationChecks: [
      {
        command: 'kubectl apply -f k8s-configmap-secret.yaml',
        purpose: 'Khởi tạo ConfigMap, Secret và Pod trên cụm K8s',
        expectedOutput:
          'configmap/web-app-config created\nsecret/web-app-secret created\npod/shop-web-pod created',
      },
      {
        command: 'kubectl exec shop-web-pod -n production -- printenv | grep -E "PORT|LOG_LEVEL|DB_PASSWORD"',
        purpose: 'Kiểm tra các biến môi trường đã được tiêm thành công vào bên trong Container',
        expectedOutput:
          'PORT=3000\nLOG_LEVEL=info\nDB_PASSWORD=SuperSecretProdDbPass2026!',
      },
    ],
    solutionAnnotations: [
      {
        section: 'kind: ConfigMap (PORT: "3000")',
        explanation:
          'Lưu trữ cấu hình dạng văn bản rõ (Plaintext). Khi sửa ConfigMap, bạn có thể rollout restart Deployment để nhận cấu hình mới trong vài giây.',
      },
      {
        section: 'kind: Secret (stringData)',
        explanation:
          'Dùng riêng cho mật khẩu, Token, khóa API. Tránh việc lộ mật khẩu dạng chữ rõ khi kỹ sư khác chạy lệnh xem cấu hình Deployment.',
      },
      {
        section: 'envFrom.configMapRef & valueFrom.secretKeyRef',
        explanation:
          'Hai cơ chế chuẩn để biến dữ liệu trong ConfigMap/Secret thành biến môi trường (`process.env.PORT`, `process.env.DB_PASSWORD`) bên trong ứng dụng.',
      },
    ],
    validationRules: [
      {
        id: 'rule-cm',
        description:
          'Khai báo ConfigMap web-app-config với PORT: "3000" và LOG_LEVEL: "info"',
        mustContain: ['kind: ConfigMap', 'PORT: "3000"', 'LOG_LEVEL: "info"'],
      },
      {
        id: 'rule-secret',
        description: 'Khai báo Secret web-app-secret chứa khóa DB_PASSWORD',
        mustContain: ['kind: Secret', 'DB_PASSWORD:'],
      },
      {
        id: 'rule-inject',
        description:
          'Tiêm đúng tên web-app-config và web-app-secret vào Container (không còn ____)',
        mustContain: ['name: web-app-config', 'name: web-app-secret'],
        mustNotContain: ['____'],
      },
    ],
  },

  // =========================================================================
  // LAB 06: K8S INGRESS HTTPS TLS & MULTI-PATH ROUTING
  // =========================================================================
  {
    id: 'prac-6-ingress-tls',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'k8s-core',
    title:
      'Lab 06: Mở Cổng Đón Khách Internet: Cấu hình Ingress NGINX Có Chứng Chỉ HTTPS (TLS) & Phân Luồng Đường Dẫn',
    scenario:
      'Các Service `ClusterIP` chỉ gọi được nội bộ bên trong cụm Kubernetes. Để khách hàng ngoài Internet gõ tên miền `https://shop.com` vào được giao diện Web (`frontend-service:80`) và gõ `https://shop.com/api` vào được máy chủ xử lý (`web-app-service:80`), bạn cần cấu hình Cổng Lễ Tân `Ingress` kèm chứng chỉ bảo mật HTTPS (`tls`).',
    requirements: [
      'Khai báo ingressClassName: nginx để chỉ định bộ điều khiển NGINX Ingress Controller',
      'Cấu hình khối tls cho tên miền shop.com sử dụng chứng chỉ lưu trong Secret tên là shop-tls-secret',
      'Cấu hình định tuyến cho host: shop.com: đường dẫn /api chuyển vào service web-app-service (port: 80)',
      'Đường dẫn gốc / chuyển vào service frontend-service (port: 80)',
    ],
    filename: 'k8s-ingress-tls.yaml',
    starterCode: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-main-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  # TODO 1: Chỉ định bộ điều khiển Ingress là nginx
  ingressClassName: _____
  tls:
    - hosts:
        - shop.com
      # TODO 2: Khai báo tên Secret chứa chứng chỉ HTTPS là shop-tls-secret
      secretName: _______________
  rules:
    - host: shop.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                # TODO 3: Chuyển luồng /api vào tổng đài web-app-service cổng 80
                name: _______________
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                # TODO 4: Chuyển luồng / vào tổng đài frontend-service cổng 80
                name: ________________
                port:
                  number: 80`,
    solutionCode: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-main-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "20m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - shop.com
      secretName: shop-tls-secret
  rules:
    - host: shop.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: web-app-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80`,
    hints: [
      'Điền ingressClassName: nginx ở TODO 1.',
      'Điền secretName: shop-tls-secret ở TODO 2.',
      'Điền name: web-app-service cho đường dẫn /api và name: frontend-service cho đường dẫn /.',
    ],
    architectureGuide: {
      whyItMatters:
        'Nếu dùng `Service` kiểu `LoadBalancer` cho từng dịch vụ nhỏ, 20 microservices sẽ phải thuê 20 bộ cân bằng tải đám mây (tốn hàng trăm USD mỗi tháng). `Ingress` giúp gom toàn bộ tên miền và đường dẫn vào duy nhất 1 cổng đón khách thông minh ở tầng HTTP/HTTPS (Layer 7).',
      realWorldAnalogy:
        '`Ingress` chính là "Quầy Lễ Tân Đại Sảnh Tòa Nhà". Khách hàng chỉ cần nhớ 1 địa chỉ duy nhất `https://shop.com`: ai hỏi mua hàng (`/`) Lễ tân chỉ vào quầy `frontend-service`, ai hỏi xử lý đơn (`/api`) Lễ tân chỉ vào quầy `web-app-service`.',
      commonPitfall:
        'Tạo đối tượng `Ingress` nhưng quên cài đặt **Ingress Controller** (như `ingress-nginx`) trên cụm hoặc bỏ trống `ingressClassName: nginx`. Khi đó tờ khai `Ingress` chỉ nằm trên giấy mà cột `ADDRESS` mãi mãi trống trơn!',
    },
    stepByStepGuide: [
      {
        stepNumber: 1,
        stepTitle: 'Chỉ định Ingress Controller (TODO 1)',
        explanation:
          'Điền `ingressClassName: nginx` để báo cho bộ điều khiển NGINX Ingress Controller trong cụm tiếp nhận và thực thi bản quy tắc định tuyến này.',
        codeSnippet: `spec:
  ingressClassName: nginx`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Kích hoạt khóa bảo mật HTTPS/TLS (TODO 2)',
        explanation:
          'Tại mục `tls`, liên kết tên miền `shop.com` với `secretName: shop-tls-secret` (nơi chứa cặp khóa `tls.crt` và `tls.key` do Cert-Manager / Let\'s Encrypt cấp).',
        codeSnippet: `  tls:
    - hosts:
        - shop.com
      secretName: shop-tls-secret`,
      },
      {
        stepNumber: 3,
        stepTitle: 'Phân luồng đường dẫn /api và / vào đúng Service (TODO 3 & TODO 4)',
        explanation:
          'Cấu hình nhánh `/api` trỏ về `name: web-app-service` (cổng `80`) và nhánh `/` trỏ về `name: frontend-service` (cổng `80`).',
        codeSnippet: `          - path: /api
            pathType: Prefix
            backend:
              service:
                name: web-app-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80`,
      },
    ],
    cliVerificationChecks: [
      {
        command: 'kubectl get ingress shop-main-ingress -n production',
        purpose: 'Kiểm tra Ingress đã được cấp địa chỉ IP Public (cột ADDRESS) và mở cổng 80, 443',
        expectedOutput:
          'NAME                CLASS   HOSTS      ADDRESS          PORTS     AGE\nshop-main-ingress   nginx   shop.com   203.0.113.50     80, 443   30s',
      },
      {
        command: 'curl -I https://shop.com/api/health',
        purpose: 'Kiểm tra đường truyền HTTPS từ ngoài Internet đi xuyên qua Ingress vào Backend Pod',
        expectedOutput: 'HTTP/2 200\nserver: nginx\ncontent-type: application/json',
      },
    ],
    solutionAnnotations: [
      {
        section: 'ingressClassName: nginx',
        explanation:
          'Xác định rõ bộ điều khiển nào chịu trách nhiệm thực thi file Ingress này.',
      },
      {
        section: 'tls.secretName: shop-tls-secret',
        explanation:
          'Thực hiện giải mã SSL/TLS (TLS Termination) ngay tại cửa ngõ Ingress để các Pod bên trong chỉ cần giao tiếp HTTP nhẹ nhàng.',
      },
      {
        section: 'path: /api & path: / (pathType: Prefix)',
        explanation:
          'Định tuyến dựa trên tiền tố URL (Path-based Routing): tiết kiệm chi phí thuê LoadBalancer đám mây.',
      },
    ],
    validationRules: [
      {
        id: 'rule-class',
        description: 'Khai báo ingressClassName: nginx',
        mustContain: ['ingressClassName: nginx'],
      },
      {
        id: 'rule-tls',
        description: 'Cấu hình chứng chỉ HTTPS với secretName: shop-tls-secret',
        mustContain: ['secretName: shop-tls-secret', 'shop.com'],
      },
      {
        id: 'rule-backends',
        description:
          'Định tuyến chính xác /api vào web-app-service và / vào frontend-service',
        mustContain: ['name: web-app-service', 'name: frontend-service'],
        mustNotContain: ['_____'],
      },
    ],
  },

  // =========================================================================
  // LAB 07: PERSISTENTVOLUMECLAIM (PVC) & STATEFUL DATABASE
  // =========================================================================
  {
    id: 'prac-7-pvc-storage',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'k8s-enterprise',
    title:
      'Lab 07: Cấp Phát Ổ Đĩa Đám Mây Vĩnh Viễn: PersistentVolumeClaim (PVC) Cho Database',
    scenario:
      'Nếu chạy PostgreSQL trong một Pod thông thường mà không gắn ổ đĩa ngoài, ngay khi Pod khởi động lại hoặc chuyển sang Worker Node khác, toàn bộ đơn hàng của khách sẽ mất trắng! Hãy viết phiếu yêu cầu cấp phát ổ đĩa `PersistentVolumeClaim (PVC)` dung lượng `20Gi` trên tầng ổ cứng nhanh `fast-ssd` và gắn (`volumeMounts`) vào Pod Database.',
    requirements: [
      'Tạo đối tượng kind: PersistentVolumeClaim tên là postgres-data-pvc',
      'Khai báo accessModes: ["ReadWriteOnce"] và storageClassName: fast-ssd',
      'Yêu cầu dung lượng ổ đĩa storage: 20Gi trong mục resources.requests',
      'Trong Pod/StatefulSet, gắn volume vào đường dẫn mountPath: /var/lib/postgresql/data và trỏ claimName: postgres-data-pvc',
    ],
    filename: 'k8s-pvc-database.yaml',
    starterCode: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data-pvc
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  # TODO 1: Chọn hạng ổ đĩa tự động cấp phát là fast-ssd
  storageClassName: ________
  resources:
    requests:
      # TODO 2: Yêu cầu dung lượng ổ cứng là 20Gi
      storage: ____
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-db
  namespace: production
spec:
  serviceName: "postgres-db-svc"
  replicas: 1
  selector:
    matchLabels:
      app: postgres-db
  template:
    metadata:
      labels:
        app: postgres-db
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: db-persistent-storage
              # TODO 3: Gắn ổ đĩa vào đúng thư mục lưu dữ liệu của PostgreSQL
              mountPath: __________________________
      volumes:
        - name: db-persistent-storage
          persistentVolumeClaim:
            # TODO 4: Liên kết với phiếu yêu cầu PVC postgres-data-pvc ở trên
            claimName: _________________`,
    solutionCode: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data-pvc
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 20Gi
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-db
  namespace: production
spec:
  serviceName: "postgres-db-svc"
  replicas: 1
  selector:
    matchLabels:
      app: postgres-db
  template:
    metadata:
      labels:
        app: postgres-db
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          volumeMounts:
            - name: db-persistent-storage
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: db-persistent-storage
          persistentVolumeClaim:
            claimName: postgres-data-pvc`,
    hints: [
      'Điền storageClassName: fast-ssd ở TODO 1 và storage: 20Gi ở TODO 2.',
      'Điền mountPath: /var/lib/postgresql/data ở TODO 3.',
      'Điền claimName: postgres-data-pvc ở TODO 4.',
    ],
    architectureGuide: {
      whyItMatters:
        'Khác với Docker trên 1 máy lẻ, một cụm Kubernetes có nhiều máy chủ Worker Node. Nếu Pod Database đang chạy ở Node 1 bị sập và được Scheduler chuyển sang Node 2, ổ cứng cục bộ của Node 1 không thể đi theo! Nhờ `PVC` và `StorageClass`, ổ đĩa mạng đám mây (AWS EBS / GCP PD / Ceph) sẽ tự động rút khỏi Node 1 và cắm sang Node 2 theo chân Pod.',
      realWorldAnalogy:
        '`PersistentVolumeClaim (PVC)` là "Phiếu đăng ký thuê tủ két sắt 20GB". `StorageClass (fast-ssd)` là "Hệ thống cấp tủ tự động của ngân hàng". Dù nhân viên Pod có chuyển sang ngồi ở chi nhánh (Worker Node) nào thì chiếc két sắt đó vẫn đi theo.',
      commonPitfall:
        'Ghi sai tên `storageClassName` không tồn tại trên cụm (khiến PVC bị treo mãi ở trạng thái `Pending`), hoặc gắn lệch đường dẫn `mountPath` không trùng với thư mục mà Database thực sự ghi dữ liệu.',
    },
    stepByStepGuide: [
      {
        stepNumber: 1,
        stepTitle: 'Khai báo hạng ổ đĩa và dung lượng trong PVC (TODO 1 & TODO 2)',
        explanation:
          'Điền `storageClassName: fast-ssd` và `storage: 20Gi` vào phiếu yêu cầu `PersistentVolumeClaim`. Chế độ `ReadWriteOnce` cho phép 1 Node gắn ổ đĩa này để đọc/ghi.',
        codeSnippet: `  storageClassName: fast-ssd
  resources:
    requests:
      storage: 20Gi`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Cắm ổ đĩa vào thư mục dữ liệu của PostgreSQL (TODO 3)',
        explanation:
          'Trong `volumeMounts` của Container, chỉ định `mountPath: /var/lib/postgresql/data` để mọi thay đổi dữ liệu của Postgres đều được ghi thẳng xuống ổ đĩa mạng.',
        codeSnippet: `          volumeMounts:
            - name: db-persistent-storage
              mountPath: /var/lib/postgresql/data`,
      },
      {
        stepNumber: 3,
        stepTitle: 'Nối Volume của Pod với phiếu PVC (TODO 4)',
        explanation:
          'Ở mục `volumes` cuối Pod, trỏ `claimName: postgres-data-pvc` khớp với tên của đối tượng `PersistentVolumeClaim` ở đầu file.',
        codeSnippet: `      volumes:
        - name: db-persistent-storage
          persistentVolumeClaim:
            claimName: postgres-data-pvc`,
      },
    ],
    cliVerificationChecks: [
      {
        command: 'kubectl get pvc postgres-data-pvc -n production',
        purpose: 'Kiểm tra phiếu PVC đã được cấp phát ổ đĩa thực tế (STATUS = Bound) chưa',
        expectedOutput:
          'NAME                STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE\npostgres-data-pvc   Bound    pvc-8f92a1b4-3c4d-4e5f-9a1b-2c3d4e5f6a7b   20Gi       RWO            fast-ssd       12s',
      },
    ],
    solutionAnnotations: [
      {
        section: 'kind: PersistentVolumeClaim (storage: 20Gi)',
        explanation:
          'Tách biệt yêu cầu dung lượng của lập trình viên khỏi hạ tầng phần cứng bên dưới.',
      },
      {
        section: 'storageClassName: fast-ssd',
        explanation:
          'Kích hoạt cơ chế Dynamic Provisioning: tự động gọi API của Cloud Provider để cắt một ổ cứng SSD 20GB mà không cần quản trị viên tạo tay.',
      },
      {
        section: 'kind: StatefulSet + mountPath: /var/lib/postgresql/data',
        explanation:
          'Sử dụng `StatefulSet` thay vì `Deployment` cho Database để giữ định danh mạng ổn định (`postgres-db-0`) và gắn chặt với ổ đĩa bền vững.',
      },
    ],
    validationRules: [
      {
        id: 'rule-pvc-spec',
        description:
          'Khai báo PVC với storageClassName: fast-ssd và dung lượng storage: 20Gi',
        mustContain: ['storageClassName: fast-ssd', 'storage: 20Gi'],
      },
      {
        id: 'rule-mountpath',
        description:
          'Gắn ổ đĩa đúng vào mountPath: /var/lib/postgresql/data',
        mustContain: ['mountPath: /var/lib/postgresql/data'],
      },
      {
        id: 'rule-claimname',
        description:
          'Liên kết chính xác claimName: postgres-data-pvc',
        mustContain: ['claimName: postgres-data-pvc'],
        mustNotContain: ['____'],
      },
    ],
  },

  // =========================================================================
  // LAB 08: RESOURCES REQUESTS/LIMITS, PROBES & HPA AUTOSCALING
  // =========================================================================
  {
    id: 'prac-8-probes-hpa',
    stageId: 'stage-3',
    level: 'master',
    category: 'k8s-enterprise',
    title:
      'Lab 08: Định Mức Tài Nguyên (Requests/Limits), Bác Sĩ Trực Probes & Tự Động Co Giãn HPA',
    scenario:
      'Chuẩn bị cho chiến dịch khuyến mãi 0h00: Hãy cấu hình hợp đồng điện nước (requests/limits), bài kiểm tra sẵn sàng tiếp khách (readinessProbe), bắt mạch sống chết (livenessProbe) và HPA tự nhân bản từ 2 lên 20 Pod khi CPU vượt 70%.',
    requirements: [
      'Khai báo resources.requests (cpu: "250m", memory: "256Mi") và limits (cpu: "500m", memory: "512Mi")',
      'Cấu hình readinessProbe (/health/ready) và livenessProbe (/health/live) kiểm tra cổng 3000',
      'Cấu hình HorizontalPodAutoscaler với minReplicas: 2, maxReplicas: 20 và averageUtilization: 70',
    ],
    filename: 'enterprise-probes-hpa.yaml',
    starterCode: `# Khối cấu hình Container trong Deployment:
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              # TODO 1: Khóa trần RAM ở mức "512Mi"
              memory: "_____"
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 20
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app-deployment
  # TODO 2: Cấu hình co giãn từ 2 đến 20 Pod khi CPU vượt 70%
  minReplicas: 2
  maxReplicas: __
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: __`,
    solutionCode: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-deployment
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: shop-web
  template:
    metadata:
      labels:
        app: shop-web
    spec:
      containers:
        - name: web-container
          image: myregistry.io/shop-web:v1.2.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 20
            periodSeconds: 10
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app-deployment
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70`,
    hints: [
      'Điền memory: "512Mi" vào mục limits ở TODO 1.',
      'Điền maxReplicas: 20 và averageUtilization: 70 vào khối HorizontalPodAutoscaler ở TODO 2.',
    ],
    architectureGuide: {
      whyItMatters:
        'Nếu thiếu `resources.requests`, bộ lập lịch `kube-scheduler` sẽ bị mù thông tin và nhồi nhét quá nhiều Pod vào 1 máy chủ, đồng thời bộ co giãn tự động `HPA` sẽ không thể tính được phần trăm CPU (`% Utilization = CPU thực dùng / CPU requests`). Nếu thiếu `readinessProbe`, người dùng sẽ bị nhận lỗi `502 Bad Gateway` mỗi khi Pod mới đang khởi động!',
      realWorldAnalogy:
        '`Requests` là "Mức điện nước tối thiểu cam kết lúc thuê nhà", `Limits` là "Cầu dao tự ngắt khi dùng quá tải". `Readiness Probe` là "Biển hiệu Mở cửa/Đang dọn dẹp trước quầy", còn `HPA` là "Hệ thống tự động gọi thêm 18 nhân viên thời vụ khi khách xếp hàng đông lúc 0h00".',
      commonPitfall:
        'Đặt `limits.memory` quá thấp so với mức RAM khởi động của ứng dụng khiến Linux Kernel chém chết Pod ngay lập tức với lỗi `OOMKilled (Exit Code 137)`.',
    },
    stepByStepGuide: [
      {
        stepNumber: 1,
        stepTitle: 'Thiết lập cầu dao tự ngắt RAM ở mục Limits (TODO 1)',
        explanation:
          'Điền `memory: "512Mi"` vào `resources.limits`. Nếu Pod bị rò rỉ bộ nhớ (Memory Leak) vượt quá 512MB, chỉ mình Pod đó bị khởi động lại chứ không làm treo cứng cả máy chủ Worker Node.',
        codeSnippet: `            limits:
              cpu: "500m"
              memory: "512Mi"`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Cấu hình biên độ co giãn và ngưỡng kích hoạt HPA (TODO 2)',
        explanation:
          'Tại đối tượng `HorizontalPodAutoscaler`, đặt `maxReplicas: 20` và ngưỡng kích hoạt `averageUtilization: 70`. Khi trung bình CPU vượt 70% so với mức `requests` (250m), K8s sẽ tự động đẻ thêm Pod.',
        codeSnippet: `  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70`,
      },
    ],
    cliVerificationChecks: [
      {
        command: 'kubectl get hpa web-app-hpa -n production',
        purpose: 'Quan sát mức tải CPU hiện tại so với ngưỡng 70% và số lượng Replicas đang chạy',
        expectedOutput:
          'NAME          REFERENCE                       TARGETS   MINPODS   MAXPODS   REPLICAS   AGE\nweb-app-hpa   Deployment/web-app-deployment   42%/70%   2         20        2          5m',
      },
    ],
    solutionAnnotations: [
      {
        section: 'requests (250m/256Mi) & limits (500m/512Mi)',
        explanation:
          'Bảo vệ cụm máy chủ khỏi hiện tượng "Hàng xóm ồn ào" (Noisy Neighbor) và cung cấp mẫu số chuẩn để HPA tính toán phần trăm tải.',
      },
      {
        section: 'readinessProbe vs livenessProbe',
        explanation:
          '`readinessProbe` thất bại chỉ tạm ngắt khách khỏi Pod đó (không giết Pod); `livenessProbe` thất bại mới khởi động lại Pod bị treo.',
      },
      {
        section: 'HorizontalPodAutoscaler (min: 2, max: 20, cpu: 70%)',
        explanation:
          'Tự động nhân bản Pod lúc cao điểm và tự động thu gọn về 2 Pod lúc nửa đêm để tiết kiệm chi phí hạ tầng Cloud.',
      },
    ],
    validationRules: [
      {
        id: 'rule-resources',
        description: 'Khai báo đầy đủ requests (256Mi) và limits (512Mi)',
        mustContain: ['256Mi', '512Mi'],
      },
      {
        id: 'rule-probes',
        description:
          'Thiết lập cả readinessProbe và livenessProbe ở cổng 3000',
        mustContain: ['readinessProbe', 'livenessProbe'],
      },
      {
        id: 'rule-hpa',
        description:
          'Cấu hình HPA minReplicas: 2, maxReplicas: 20 và averageUtilization: 70',
        mustContain: [
          'minReplicas: 2',
          'maxReplicas: 20',
          'averageUtilization: 70',
        ],
      },
    ],
  },

  // =========================================================================
  // LAB 09: RBAC LEAST PRIVILEGE & NETWORKPOLICY FIREWALL
  // =========================================================================
  {
    id: 'prac-9-rbac-netpol',
    stageId: 'stage-4',
    level: 'master',
    category: 'k8s-enterprise',
    title:
      'Lab 09: Bảo Mật Đa Lớp: Phân Quyền RBAC Tối Thiểu & Tường Lửa Nội Khu NetworkPolicy',
    scenario:
      'Mặc định trong Kubernetes, mọi Pod trong cụm đều có thể kết nối mạng tự do tới bất kỳ Pod nào khác — nếu Pod Frontend bị tin tặc chiếm quyền, chúng có thể chọc thẳng vào Pod Database (`postgres-db:5432`)! Hãy thiết lập danh tính `ServiceAccount` có quyền chỉ đọc (`get`, `list`, `watch`) và dựng tường lửa `NetworkPolicy` chỉ cho phép duy nhất các Pod có nhãn `app: shop-web` được phép kết nối vào cổng `5432` của `postgres-db`.',
    requirements: [
      'Tạo ServiceAccount tên là shop-readonly-sa và Role chỉ cấp quyền verbs: ["get", "list", "watch"] đối với pods',
      'Tạo NetworkPolicy tên là postgres-ZeroTrust-firewall áp dụng cho Pod có nhãn app: postgres-db',
      'Trong mục ingress.from.podSelector, chỉ cho phép các Pod có nhãn app: shop-web đi vào',
      'Chỉ mở duy nhất cổng protocol: TCP, port: 5432',
    ],
    filename: 'k8s-rbac-networkpolicy.yaml',
    starterCode: `apiVersion: v1
kind: ServiceAccount
metadata:
  name: shop-readonly-sa
  namespace: production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader-role
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["pods", "configmaps"]
    # TODO 1: Chỉ cấp quyền đọc ("get", "list", "watch"), cấm quyền xóa "delete"
    verbs: ["get", "list", "_____"]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-zerotrust-firewall
  namespace: production
spec:
  # Áp dụng bức tường lửa này để bảo vệ Pod Database:
  podSelector:
    matchLabels:
      app: postgres-db
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              # TODO 2: Chỉ cho phép các Pod có thẻ tên app: shop-web đi vào
              app: ________
      ports:
        - protocol: TCP
          # TODO 3: Chỉ mở đúng cổng 5432 của PostgreSQL
          port: ____`,
    solutionCode: `apiVersion: v1
kind: ServiceAccount
metadata:
  name: shop-readonly-sa
  namespace: production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader-role
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["pods", "configmaps"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: bind-readonly-sa
  namespace: production
subjects:
  - kind: ServiceAccount
    name: shop-readonly-sa
    namespace: production
roleRef:
  kind: Role
  name: pod-reader-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-zerotrust-firewall
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: postgres-db
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: shop-web
      ports:
        - protocol: TCP
          port: 5432`,
    hints: [
      'Ở TODO 1, điền "watch" vào danh sách verbs: ["get", "list", "watch"].',
      'Ở TODO 2, điền app: shop-web để chỉ cho phép Backend API kết nối vào Database.',
      'Ở TODO 3, điền port: 5432.',
    ],
    architectureGuide: {
      whyItMatters:
        'Bảo mật chuẩn doanh nghiệp (Zero-Trust Security) trên Kubernetes dựa trên 2 trụ cột: **RBAC** (kiểm soát ai được phép gọi Kubernetes API Server) và **NetworkPolicy** (kiểm soát Pod nào được phép truyền gói tin sang Pod nào ở tầng mạng CNI như Calico/Cilium).',
      realWorldAnalogy:
        '`RBAC` là "Thẻ từ nhân viên chỉ mở được cửa phòng làm việc chứ không mở được phòng máy chủ trung tâm". Còn `NetworkPolicy` là "Trạm gác bảo vệ trước cửa kho tiền (`postgres-db`)" — chỉ nhân viên mặc đồng phục `app: shop-web` đi qua cửa số `5432` mới được vào, mọi người lạ đều bị chặn đứng!',
      commonPitfall:
        'Cấp quyền `cluster-admin` hoặc `verbs: ["*"]` cho Pod ứng dụng, hoặc để mạng phẳng hoàn toàn không có `NetworkPolicy`, khiến một lỗ hổng nhỏ ở tầng giao diện có thể leo thang chiếm toàn bộ cơ sở dữ liệu.',
    },
    stepByStepGuide: [
      {
        stepNumber: 1,
        stepTitle: 'Giới hạn quyền chỉ đọc trong RBAC Role (TODO 1)',
        explanation:
          'Trong đối tượng `Role`, chỉ cấp 3 hành động đọc: `verbs: ["get", "list", "watch"]`. Tuyệt đối không cấp `create`, `update` hay `delete`.',
        codeSnippet: `rules:
  - apiGroups: [""]
    resources: ["pods", "configmaps"]
    verbs: ["get", "list", "watch"]`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Chỉ định danh sách trắng (Whitelist) Pod được phép gọi vào DB (TODO 2)',
        explanation:
          'Tại `spec.ingress.from.podSelector.matchLabels` của `NetworkPolicy`, điền `app: shop-web`. Ngay khi áp dụng chính sách này, mọi Pod không có nhãn `app: shop-web` sẽ bị từ chối kết nối tới `postgres-db`.',
        codeSnippet: `    - from:
        - podSelector:
            matchLabels:
              app: shop-web`,
      },
      {
        stepNumber: 3,
        stepTitle: 'Khóa chặt cổng giao tiếp 5432 (TODO 3)',
        explanation:
          'Chỉ mở duy nhất cổng `port: 5432` (giao thức `TCP`) của PostgreSQL.',
        codeSnippet: `      ports:
        - protocol: TCP
          port: 5432`,
      },
    ],
    cliVerificationChecks: [
      {
        command: 'kubectl auth can-i delete pods --as=system:serviceaccount:production:shop-readonly-sa -n production',
        purpose: 'Kiểm tra xem ServiceAccount có bị chặn quyền xóa Pod đúng như thiết kế RBAC không',
        expectedOutput: 'no',
      },
      {
        command: 'kubectl get networkpolicy postgres-zerotrust-firewall -n production',
        purpose: 'Xác nhận tường lửa NetworkPolicy đang bảo vệ Pod postgres-db',
        expectedOutput:
          'NAME                          POD-SELECTOR      AGE\npostgres-zerotrust-firewall   app=postgres-db   20s',
      },
    ],
    solutionAnnotations: [
      {
        section: 'ServiceAccount + Role + RoleBinding',
        explanation:
          'Bộ ba phân quyền RBAC theo nguyên tắc Đặc quyền tối thiểu (Principle of Least Privilege).',
      },
      {
        section: 'podSelector.matchLabels: { app: postgres-db }',
        explanation:
          'Đối tượng mục tiêu cần được bảo vệ bởi bức tường lửa NetworkPolicy.',
      },
      {
        section: 'ingress.from.podSelector: { app: shop-web } (port: 5432)',
        explanation:
          'Cô lập mạng nội bộ (Micro-segmentation): chỉ tầng Backend API mới được chạm tới cổng 5432 của Database.',
      },
    ],
    validationRules: [
      {
        id: 'rule-rbac',
        description:
          'Cấp quyền chỉ đọc verbs: ["get", "list", "watch"] trong Role',
        mustContain: ['"get"', '"list"', '"watch"'],
      },
      {
        id: 'rule-netpol-from',
        description:
          'Cấu hình NetworkPolicy chỉ cho phép Pod có nhãn app: shop-web',
        mustContain: ['kind: NetworkPolicy', 'app: postgres-db', 'app: shop-web'],
      },
      {
        id: 'rule-netpol-port',
        description: 'Chỉ mở cổng port: 5432 cho kết nối vào PostgreSQL',
        mustContain: ['port: 5432'],
        mustNotContain: ['____'],
      },
    ],
  },

  // =========================================================================
  // LAB 10: GITHUB ACTIONS CI/CD + TRIVY SCAN + ARGOCD GITOPS MANIFEST
  // =========================================================================
  {
    id: 'prac-10-cicd-gitops',
    stageId: 'stage-4',
    level: 'master',
    category: 'k8s-enterprise',
    title:
      'Lab 10: Khép Kín Dây Chuyền Tự Động: Pipeline CI (Trivy Security Gate) & ArgoCD GitOps',
    scenario:
      'Ở cấp độ Master, không ai còn gõ tay lệnh `docker build` hay `kubectl apply` trên máy cá nhân nữa! Hãy hoàn thiện cấu hình cổng quét bảo mật `Trivy` trong GitHub Actions (chặn đứng các Image có lỗ hổng `CRITICAL`) và viết tờ khai `ArgoCD Application` có tính năng tự động đồng bộ (`automated: { prune: true, selfHeal: true }`) từ kho Git vào cụm Kubernetes.',
    requirements: [
      'Trong bước quét bảo mật Trivy của CI Pipeline, cấu hình severity: CRITICAL,HIGH và exit-code: "1" để chặn ngay nếu phát hiện lỗ hổng nghiêm trọng',
      'Trong đối tượng ArgoCD Application (kind: Application), trỏ targetRevision: main và path: charts/shop-web',
      'Kích hoạt đồng bộ tự động syncPolicy.automated với prune: true (xóa tài nguyên thừa) và selfHeal: true (tự khôi phục nếu ai sửa tay trên cụm)',
    ],
    filename: 'ci-and-argocd-gitops.yaml',
    starterCode: `# =====================================================================
# PHẦN 1: BƯỚC QUÉT BẢO MẬT TRIVY TRONG GITHUB ACTIONS (.github/workflows/ci.yml)
# =====================================================================
      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: "myregistry.io/shop-web:v1.4.0"
          format: "table"
          # TODO 1: Đặt exit-code: "1" để dừng ngay Pipeline nếu có lỗ hổng CRITICAL,HIGH
          exit-code: "___"
          severity: "CRITICAL,HIGH"
---
# =====================================================================
# PHẦN 2: CẤU HÌNH ĐỒNG BỘ TỰ ĐỘNG ARGOCD GITOPS (argocd-app.yaml)
# =====================================================================
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: shop-web-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/shop-gitops-config.git
    targetRevision: main
    # TODO 2: Trỏ đường dẫn tới thư mục Helm Chart là charts/shop-web
    path: _______________
    helm:
      valueFiles:
        - values-prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      # TODO 3: Bật prune: true và selfHeal: true để ArgoCD tự động đồng bộ 100%
      prune: ____
      selfHeal: ____`,
    solutionCode: `# =====================================================================
# PHẦN 1: BƯỚC QUÉT BẢO MẬT TRIVY TRONG GITHUB ACTIONS (.github/workflows/ci.yml)
# =====================================================================
      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: "myregistry.io/shop-web:v1.4.0"
          format: "table"
          exit-code: "1"
          ignore-unfixed: true
          vuln-type: "os,library"
          severity: "CRITICAL,HIGH"
---
# =====================================================================
# PHẦN 2: CẤU HÌNH ĐỒNG BỘ TỰ ĐỘNG ARGOCD GITOPS (argocd-app.yaml)
# =====================================================================
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: shop-web-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/shop-gitops-config.git
    targetRevision: main
    path: charts/shop-web
    helm:
      valueFiles:
        - values-prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true`,
    hints: [
      'Ở TODO 1, điền exit-code: "1" để đánh trượt (fail) pipeline khi Trivy phát hiện lỗi CRITICAL.',
      'Ở TODO 2, điền path: charts/shop-web.',
      'Ở TODO 3, điền prune: true và selfHeal: true.',
    ],
    architectureGuide: {
      whyItMatters:
        'Mô hình GitOps với ArgoCD biến kho lưu trữ Git thành "Nguồn sự thật duy nhất" (Single Source of Truth). Kỹ sư không cần cấp quyền truy cập trực tiếp vào cụm Kubernetes Production cho CI server nữa; thay vào đó, ArgoCD nằm bên trong cụm sẽ chủ động kéo (Pull) cấu hình từ Git về và tự động vá lại mọi sai lệch (`selfHeal: true`).',
      realWorldAnalogy:
        '`Trivy` với `exit-code: "1"` là "Máy soi chiếu an ninh tự động khóa băng chuyền ngay khi phát hiện hàng cấm". Còn `ArgoCD` (`selfHeal: true`) là "Người quản gia trung thành đối chiếu bản vẽ thiết kế trên Git mỗi 3 phút": ai tự ý xê dịch bàn ghế trên cụm thực tế sẽ bị Quản gia lập tức kê lại đúng y như bản vẽ trên Git!',
      commonPitfall:
        'Chạy Trivy nhưng để mặc định `exit-code: "0"`, khiến Trivy chỉ in ra cảnh báo đỏ trên màn hình log rồi vẫn cho phép đẩy chiếc Image chứa lỗ hổng bảo mật thẳng lên Production!',
    },
    stepByStepGuide: [
      {
        stepNumber: 1,
        stepTitle: 'Chặn đứng Image lỗi bằng cổng bảo mật Trivy (TODO 1)',
        explanation:
          'Đặt `exit-code: "1"` kết hợp với `severity: "CRITICAL,HIGH"`. Khi phát hiện lỗ hổng nghiêm trọng hoặc chạy quyền root, Trivy sẽ trả về mã lỗi 1 để dừng ngay dây chuyền CI trước khi kịp đẩy Image lên kho.',
        codeSnippet: `          exit-code: "1"
          severity: "CRITICAL,HIGH"`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Trỏ đường dẫn Helm Chart trong kho GitOps (TODO 2)',
        explanation:
          'Tại mục `spec.source.path` của đối tượng `Application`, điền `path: charts/shop-web` kèm tệp ghi đè `values-prod.yaml` dành riêng cho môi trường Production.',
        codeSnippet: `  source:
    repoURL: https://github.com/my-org/shop-gitops-config.git
    targetRevision: main
    path: charts/shop-web`,
      },
      {
        stepNumber: 3,
        stepTitle: 'Bật chế độ tự động dọn rác & tự chữa lành GitOps (TODO 3)',
        explanation:
          'Bật `prune: true` (khi xóa 1 file trên Git thì ArgoCD cũng tự xóa đối tượng đó trên K8s) và `selfHeal: true` (khi ai đó gõ lệnh sửa tay trên cụm làm lệch với Git, ArgoCD tự động ghi đè lại theo chuẩn trên Git).',
        codeSnippet: `  syncPolicy:
    automated:
      prune: true
      selfHeal: true`,
      },
    ],
    cliVerificationChecks: [
      {
        command: 'kubectl get application shop-web-production -n argocd',
        purpose: 'Kiểm tra trạng thái đồng bộ GitOps (SYNC STATUS = Synced, HEALTH = Healthy)',
        expectedOutput:
          'NAME                  SYNC STATUS   HEALTH STATUS\nshop-web-production   Synced        Healthy',
      },
    ],
    solutionAnnotations: [
      {
        section: 'exit-code: "1" & severity: "CRITICAL,HIGH"',
        explanation:
          'Biến công cụ quét bảo mật thành một cổng chặn tự động (Quality/Security Gate) trong DevSecOps.',
      },
      {
        section: 'source.path: charts/shop-web + valueFiles: [values-prod.yaml]',
        explanation:
          'Sử dụng khuôn đúc Helm Chart kết hợp file thông số riêng cho môi trường Production.',
      },
      {
        section: 'automated: { prune: true, selfHeal: true }',
        explanation:
          'Đảm bảo trạng thái thực tế trên cụm Kubernetes luôn khớp 100% với lịch sử commit trên kho Git, chống mọi thao tác sửa tay trái phép (Configuration Drift).',
      },
    ],
    validationRules: [
      {
        id: 'rule-trivy',
        description:
          'Cấu hình Trivy với exit-code: "1" và severity: "CRITICAL,HIGH"',
        mustContain: ['exit-code: "1"', 'CRITICAL,HIGH'],
      },
      {
        id: 'rule-argopath',
        description: 'Trỏ đúng đường dẫn Helm Chart path: charts/shop-web',
        mustContain: ['path: charts/shop-web', 'values-prod.yaml'],
      },
      {
        id: 'rule-syncpolicy',
        description:
          'Kích hoạt tự động đồng bộ GitOps với prune: true và selfHeal: true',
        mustContain: ['prune: true', 'selfHeal: true'],
        mustNotContain: ['____'],
      },
    ],
  },
];

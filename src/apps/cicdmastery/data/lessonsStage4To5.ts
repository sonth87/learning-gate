import { CicdLesson } from '../types/cicd.types';

export const LESSONS_STAGE_4_TO_5: CicdLesson[] = [
  {
    id: 'cicd-L4-1-full-flow-3-zero-downtime-3-pieces',
    stageId: 'cicd-stage-4',
    order: 12,
    title: '4.1. Bộ 3 Mảnh ghép Code & Cấu hình để Đạt Zero-Downtime Tuyệt đối (Full Flow #3: Dockerfile + Graceful Shutdown + K8s Manifest)',
    shortTitle: '4.1. Full Flow #3: Zero-Downtime 3 Mảnh ghép',
    level: 'pro',
    estimatedMinutes: 35,
    pdfRef: 'Mục 4.1, Hình 4.1 & Tình huống B7 — Trang 11, 12, 13 & 21',
    summary:
      'Để không bị rớt bất kỳ kết nối nào (không bị lỗi 502 Bad Gateway) trong lúc CI/CD đang cập nhật phiên bản mới, cả 3 tầng Đóng gói Docker → Mã nguồn Ứng dụng → Cấu hình Hạ tầng Kubernetes phải khớp với nhau tuyệt đối.',
    keyObjectives: [
      'Nắm vững Nguyên tắc vàng trong Dockerfile: Không bao giờ dùng dạng Shell (ENTRYPOINT "npm start") vì Shell nuốt mất tín hiệu SIGTERM — luôn dùng Exec Form kết hợp dumb-init/tini.',
      'Hiểu cách mã nguồn Backend (src/server.ts) xử lý Readiness Probe (/health/ready trả 503 draining) và bắt tín hiệu SIGTERM gọi server.close() để giữ sống các giao dịch đang dở.',
      'Làm chủ cấu hình k8s/deployment.yaml với maxUnavailable: 0, terminationGracePeriodSeconds: 35, readinessProbe và preStop: sleep 5.',
    ],
    svgBlueprint: 'svg-zero-downtime-sigterm',
    theorySections: [
      {
        heading: '1. Tại sao Dù đã bật RollingUpdate trên Kubernetes vẫn bị lỗi 502 Bad Gateway? (Hình 4.1 & Tình huống B7)',
        body: 'Khi Kubernetes quyết định tắt Pod cũ (v1.0), nó thực hiện SONG SONG cùng lúc 2 việc: (1) Gửi tín hiệu SIGTERM vào tiến trình bên trong Container, và (2) Cập nhật danh sách IP (Endpoints) gửi tới NGINX Ingress / Load Balancer để ngừng đổ lưu lượng vào Pod đó. Tuy nhiên, việc đồng bộ bảng định tuyến của Ingress mất khoảng 1–3 giây, trong khi ứng dụng Node.js/Go/Java vừa nhận SIGTERM ở mili-giây đầu tiên đã lập tức đóng cổng HTTP! Kết quả là các request đang bay tới trong 1–3 giây đó đâm vào cổng đã đóng và trả về lỗi 502 Bad Gateway.',
      },
      {
        heading: '2. Giải thích Tại sao Cần Đủ Cả 3 Mảnh ghép mới Đạt Zero-Downtime Thực sự (PDF Trang 13)',
        body: 'Thiếu bất kỳ mảnh ghép nào trong 3 mảnh ghép dưới đây cũng sẽ làm đứt giao dịch của khách hàng lúc đang Deploy:',
        bulletPoints: [
          'Nếu thiếu Mảnh ghép 1 (dumb-init + Exec Form trong Dockerfile): Khi gọi CMD "npm start" (Shell Form), trình khởi chạy /bin/sh chiếm PID 1 và không chuyển tiếp tín hiệu SIGTERM vào code Node.js. Kết quả là hàm process.on("SIGTERM") ở Mảnh ghép 2 không bao giờ chạy, đợi hết 35 giây thì Kernel giết cứng bằng SIGKILL làm đứt toàn bộ giao dịch.',
          'Nếu thiếu Mảnh ghép 2 (server.close() trong src/server.ts): Ứng dụng nhận SIGTERM và tắt phụp ngay lập tức ở mili-giây đầu tiên, làm các câu lệnh SQL đang ghi dở vào Database (ví dụ đang thanh toán đơn hàng) bị ngắt giữa chừng.',
          'Nếu thiếu Mảnh ghép 3 (maxUnavailable: 0 + preStop: sleep 5 trong k8s/deployment.yaml): Bộ cân bằng tải (Load Balancer / NGINX Ingress) chưa kịp cập nhật danh sách IP mới đã gửi nhầm request của khách hàng vào Pod vừa đóng cổng HTTP, sinh ra lỗi 502 Bad Gateway.',
        ],
      },
    ],
    visualAnalogy: {
      title: 'Đóng Quầy Thu Ngân Siêu Thị Giờ Cao Điểm Không Làm Khách Phàn Nàn',
      realWorldScenario:
        'Hãy hình dung cách đổi ca nhân viên tại quầy thu ngân siêu thị mà không đuổi khách đang đứng giữa chừng:',
      mappingPoints: [
        {
          realWorld: 'Bước 1: Nhân viên ca mới phải mở quầy bên cạnh và bật đèn xanh sẵn sàng trước (maxUnavailable: 0 + Readiness Probe)',
          cicdEquivalent: 'Mảnh ghép 3: maxUnavailable: 0 + readinessProbe (/health/ready = 200 OK)',
          explanation: 'Pod v2.0 mới phải sống và kết nối xong DB trước khi Pod v1.0 cũ được phép chuẩn bị nghỉ.',
        },
        {
          realWorld: 'Bước 2: Đặt biển "Ngừng nhận thêm khách mới" ở đầu hàng và đứng chờ 5 giây cho khách đang đi tới kịp rẽ sang quầy mới (preStop: sleep 5)',
          cicdEquivalent: 'Mảnh ghép 3: lifecycle.preStop: sleep 5',
          explanation: 'Chờ 5 giây để NGINX Ingress rút sạch IP của Pod cũ khỏi bảng định tuyến trước khi phát tín hiệu SIGTERM.',
        },
        {
          realWorld: 'Bước 3: Loa thông báo truyền thẳng tới tai thu ngân (dumb-init PID 1) → Thu ngân tính tiền nốt cho khách đang đứng tại quầy rồi mới khóa két (server.close)',
          cicdEquivalent: 'Mảnh ghép 1 & 2: dumb-init Exec Form + process.on("SIGTERM") → server.close() → dbPool.end()',
          explanation: 'Ngừng nhận kết nối TCP mới nhưng giữ sống các HTTP request đang xử lý dở cho đến khi trả kết quả xong.',
        },
      ],
      mentalModelTip:
        'Công thức bất bại chống 502 Bad Gateway: [Readiness Probe] + [preStop: sleep 5] + [dumb-init Exec Form] + [server.close() → dbPool.end()] < [terminationGracePeriodSeconds: 35].',
    },
    diagrams: [
      {
        id: 'diag-full-flow-3',
        title: 'Hình 4.1: Chuỗi 5 Bước Phối hợp giữa Hạ tầng & Ứng dụng để Đạt Zero-Downtime Thực sự (0% Rớt Request)',
        subtitle: 'Bấm vào từng mảnh ghép để xem sự ăn khớp giữa Dockerfile, Backend Code và Kubernetes Manifest',
        type: 'pipeline',
        svgBlueprint: 'svg-zero-downtime-sigterm',
        nodes: [
          {
            id: 'zd-step-1',
            badge: 'Mảnh ghép 1/3',
            title: 'Dockerfile Multi-Stage & dumb-init',
            subtitle: 'USER node + ENTRYPOINT ["dumb-init", "--"]',
            detail:
              'Stage 1 biên dịch TS sang JS và chạy npm prune --omit=dev. Stage 2 chạy bằng tài khoản non-root (node), cài dumb-init làm PID 1 và bắt buộc dùng Exec Form CMD ["node", "dist/server.js"] để chuyển tiếp SIGTERM.',
            highlightColor: 'sky',
          },
          {
            id: 'zd-step-2',
            badge: 'Mảnh ghép 2/3',
            title: 'Backend Readiness & SIGTERM Handler',
            subtitle: '/health/ready (503 draining) + server.close()',
            detail:
              'Endpoint /health/ready kiểm tra SELECT 1 vào DB và trả về 503 ngay khi isShuttingDown=true. Khi nhận SIGTERM, gọi server.close() để xử lý nốt request đang dở rồi mới đóng dbPool và redisClient.',
            highlightColor: 'emerald',
          },
          {
            id: 'zd-step-3',
            badge: 'Mảnh ghép 3/3 (Pha Mở)',
            title: 'K8s RollingUpdate & Readiness Probe',
            subtitle: 'maxSurge: 1, maxUnavailable: 0',
            detail:
              'Bắt buộc Pod v2.0 mới phải khởi chạy và trả về 200 OK tại /health/ready trong 2 lần liên tiếp (successThreshold: 2) trước khi được phép tắt Pod v1.0 cũ.',
            highlightColor: 'amber',
          },
          {
            id: 'zd-step-4',
            badge: 'Mảnh ghép 3/3 (Pha Đóng)',
            title: 'preStop Hook (sleep 5) & Grace Period 35s',
            subtitle: 'Chờ Ingress rút IP → SIGTERM → Thoát êm ái',
            detail:
              'Khi tắt Pod cũ, K8s chạy preStop: sleep 5 chờ NGINX Ingress rút xong IP của Pod khỏi bảng định tuyến rồi mới gửi SIGTERM, cho phép tối đa 35s trước khi SIGKILL.',
            highlightColor: 'violet',
          },
        ],
        caption: 'Full Flow #3 (PDF Trang 11–13): Ba mảnh ghép bắt buộc phải đi cùng nhau để triệt tiêu 100% lỗi 502 Bad Gateway.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L4-1-piece-1-dockerfile',
        title: 'Full Flow #3 (Mảnh ghép 1/3): Dockerfile Chuẩn Multi-Stage + Non-Root User + dumb-init (PDF Trang 11)',
        language: 'dockerfile',
        description:
          'Tối ưu Docker Layer Cache, xóa devDependencies, hạ quyền xuống non-root user và dùng dumb-init + Exec Form để bảo toàn tín hiệu SIGTERM:',
        code: `# --- STAGE 1: BUILDER (Chứa đầy đủ công cụ biên dịch TypeScript/Go/Java, nhưng không đưa lên Production) ---
FROM node:20-alpine AS builder
WORKDIR /app
# Copy file khai báo thư viện trước để tận dụng tối đa Docker Layer Cache khi chỉ sửa code trong thư mục src/
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build && npm prune --omit=dev # Biên dịch sang JS rồi xóa toàn bộ devDependencies nặng nề

# --- STAGE 2: PRODUCTION RUNTIME (Siêu nhẹ, bảo mật, chạy bằng tài khoản non-root và giữ nguyên tín hiệu OS) ---
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init # Cài đặt dumb-init làm PID 1 để chuyển tiếp SIGTERM chính xác vào Node.js
WORKDIR /app
ENV NODE_ENV=production
USER node # Hạ quyền xuống user 'node' (UID 1000) để chống leo thang đặc quyền nếu ứng dụng bị khai thác
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
EXPOSE 3000
# BẮT BUỘC dùng Exec Form (ngoặc vuông) kết hợp dumb-init; tuyệt đối không viết CMD "npm start"
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "node", "dist/server.js" ]`,
        outputOrImpact: 'Image giảm từ >900MB xuống ~110MB, chạy non-root an toàn và chuyển tiếp 100% tín hiệu SIGTERM vào Node.js.',
        annotations: [
          { line: 5, explanation: 'Copy package*.json và chạy npm ci ở layer trước để tái sử dụng 100% Docker Layer Cache khi chỉ sửa src/.' },
          { line: 9, explanation: 'npm prune --omit=dev loại bỏ toàn bộ thư viện chỉ dùng lúc build (TypeScript, Jest, ESLint).' },
          { line: 13, explanation: 'dumb-init đóng vai trò PID 1 nhẹ nhàng chuyển tiếp tín hiệu SIGTERM xuống tiến trình con.' },
          { line: 16, explanation: 'USER node hạ quyền xuống UID 1000 chống tấn công Container Escape leo thang đặc quyền.' },
          { line: 21, explanation: 'Exec Form (ngoặc vuông) gọi trực tiếp binary mà không qua /bin/sh nên không bị nuốt mất SIGTERM.' },
        ],
      },
      {
        id: 'code-L4-1-piece-2-3-server-k8s',
        title: 'Full Flow #3 (Mảnh ghép 2/3 & 3/3): Mã nguồn Backend (src/server.ts) & k8s/deployment.yaml (PDF Trang 12–13)',
        language: 'typescript',
        description:
          'Sự phối hợp nhịp nhàng giữa Readiness Probe, bộ xử lý SIGTERM trong Express và cấu hình RollingUpdate + preStop Hook trên Kubernetes:',
        code: `// === MẢNH GHÉP 2/3: src/server.ts ===
import express from 'express';
import { dbPool, redisClient } from './infra';
const app = express();
let isShuttingDown = false; // Cờ trạng thái báo hiệu tiến trình đang trong pha chuẩn bị tắt

// [1] ENDPOINT READINESS PROBE: Kubernetes gọi mỗi 3 giây để quyết định có đổ lưu lượng người dùng vào Pod này không
app.get('/health/ready', async (req, res) => {
  if (isShuttingDown) return res.status(503).json({ status: 'draining' }); // Báo 503 ngay khi bắt đầu tắt để ngắt luồng
  await dbPool.query('SELECT 1'); // Kiểm tra kết nối Database thực tế đã sẵn sàng chưa
  return res.status(200).json({ status: 'ready' });
});

const server = app.listen(3000);

// [2] XỬ LÝ GRACEFUL SHUTDOWN KHI NHẬN TÍN HIỆU SIGTERM TỪ KUBERNETES / DOCKER
process.on('SIGTERM', async () => {
  isShuttingDown = true;
  // Ngừng nhận kết nối TCP mới, nhưng GIỮ SỐNG các request đang xử lý dở (ví dụ đang thanh toán đơn hàng)
  server.close(async () => {
    await dbPool.end(); // Chỉ đóng kết nối Database sau khi toàn bộ HTTP request đang chạy đã trả kết quả xong
    await redisClient.quit();
    process.exit(0); // Thoát sạch với mã 0
  });
});

/* === MẢNH GHÉP 3/3: k8s/deployment.yaml ===
apiVersion: apps/v1
kind: Deployment
metadata: { name: order-service, namespace: production }
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:
    spec:
      terminationGracePeriodSeconds: 35
      containers:
        - name: app
          image: registry.company.com/order-service:a1b2c3d
          readinessProbe:
            httpGet: { path: /health/ready, port: 3000 }
            periodSeconds: 3
            successThreshold: 2
          lifecycle:
            preStop: { exec: { command: [ "/bin/sh", "-c", "sleep 5" ] } }
*/`,
        outputOrImpact: 'Đạt Zero-Downtime tuyệt đối (0% lỗi 502 Bad Gateway) ngay cả khi triển khai giữa giờ cao điểm.',
        annotations: [
          { line: 9, explanation: 'Trả về HTTP 503 ngay khi đang tắt để Load Balancer ngừng gửi kết nối mới.' },
          { line: 20, explanation: 'server.close() chờ toàn bộ các HTTP request đang xử lý dở hoàn tất rồi mới chạy callback đóng DB.' },
          { line: 35, explanation: 'maxUnavailable: 0 bắt buộc Pod v2.0 mới phải Ready trước khi tắt Pod v1.0 cũ.' },
          { line: 47, explanation: 'preStop: sleep 5 cho NGINX Ingress đủ 5 giây rút IP của Pod cũ khỏi bảng định tuyến trước khi phát SIGTERM.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Áp dụng Bộ 3 Mảnh ghép Zero-Downtime',
        githubActionsWay: 'Build Dockerfile Multi-stage trong GitHub Actions và rollout k8s/deployment.yaml lên EKS/GKE.',
        gitlabCiWay: 'Build Dockerfile Multi-stage trong GitLab CI và rollout k8s/deployment.yaml lên cụm K8s.',
        architecturalNote: 'Bộ 3 mảnh ghép này độc lập với công cụ CI/CD và là tiêu chuẩn bắt buộc cho mọi hệ thống chạy trên Kubernetes / Docker.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L4-1-npm-start-shell',
        title: 'Viết CMD "npm start" hoặc ENTRYPOINT "node server.js" dạng chuỗi (Shell Form) trong Dockerfile',
        severity: 'critical',
        symptom: 'Dù đã viết hàm process.on("SIGTERM") rất kỹ trong code Node.js, nhưng khi K8s tắt Pod thì hàm đó không bao giờ chạy, Pod bị treo đúng 35 giây rồi bị giết cứng bằng SIGKILL (Exit code 137)!',
        whyItHappens: 'Khi viết dạng chuỗi không có ngoặc vuông, Docker bọc lệnh trong /bin/sh -c. Trình /bin/sh chiếm PID 1 và nuốt mất tín hiệu SIGTERM; ngoài ra bản thân trình quản lý gói npm cũng không chuyển tiếp SIGTERM xuống tiến trình node con.',
        wrongConfig: `CMD "npm start"`,
        rightConfig: `ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "node", "dist/server.js" ]`,
        fixExplanation: 'Nguyên tắc vàng (PDF Trang 11): Không bao giờ dùng dạng Shell hay npm start — luôn dùng Exec Form (ngoặc vuông) gọi trực tiếp node kèm dumb-init/tini.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L4-1',
        title: 'Tỷ lệ Lỗi 502 Bad Gateway Khi Deploy Giữa Giờ Cao Điểm (1.000 RPS)',
        claim: 'Áp dụng đủ 3 mảnh ghép trong Full Flow #3 giúp giảm số lượng request lỗi 502 từ 50–100 request mỗi lần deploy xuống đúng bằng 0.',
        methodology: 'Thử tải bằng k6 ở mức 1.000 request/giây trong khi chạy lệnh kubectl rollout restart.',
        metrics: [
          {
            label: 'Đủ 3 Mảnh ghép (dumb-init + server.close + preStop sleep 5)',
            valueText: '0 request lỗi (100% HTTP 200 OK)',
            barPercent: 100,
            isOptimal: true,
            note: 'Ingress rút IP xong xuôi rồi ứng dụng mới đóng cổng.',
          },
          {
            label: 'Thiếu preStop Hook hoặc dùng CMD "npm start"',
            valueText: '50–100 request bị lỗi 502 Bad Gateway / lần deploy',
            barPercent: 15,
            isOptimal: false,
            note: 'Request bay vào Pod đúng 1–3 giây giao thời khi cổng HTTP vừa đóng.',
          },
        ],
        takeaway: 'Zero-Downtime thực sự là sự kết hợp chính xác đến từng giây giữa OS Signal, Application Code và K8s Networking.',
      },
    ],
    bestPractices: [
      'Đảm bảo terminationGracePeriodSeconds (ví dụ 35s) luôn lớn hơn tổng thời gian của preStop sleep (5s) cộng với thời gian xử lý tối đa của 1 request (ví dụ 25s).',
      'Trong hàm xử lý SIGTERM, tuyệt đối chỉ gọi dbPool.end() bên trong callback của server.close() để không ngắt kết nối DB khi HTTP request đang chạy dở.',
    ],
    relatedSimulators: [
      {
        label: 'Mô phỏng Trực tiếp Lỗi 502 vs. Zero-Downtime 3 Mảnh ghép',
        targetTab: 'simulator',
      },
      {
        label: 'Mở IDE Xem Trọn Bộ 3 File của Full Flow #3',
        targetTab: 'blueprints',
        targetId: 'full-flow-3-zero-downtime-suite',
      },
    ],
  },
  {
    id: 'cicd-L4-3-approval-gates-and-ai-review',
    stageId: 'cicd-stage-4',
    order: 13,
    title: '4.3 & 4.4. Quy trình Phê duyệt Đa tầng (CODEOWNERS & Approval Gates) + Tích hợp AI Review (Full Flow #4: CodeRabbit & Qodo PR-Agent)',
    shortTitle: '4.3 & 4.4. Approval Gates & AI Review',
    level: 'pro',
    estimatedMinutes: 30,
    pdfRef: 'Mục 4.3, 4.4 & Full Flow #4 — Trang 13, 14, 15 & 16',
    summary:
      'Thiết kế luồng Phê duyệt Đa tầng 3 chốt (.github/CODEOWNERS, QA Staging Gate, Protected Environments + OIDC) cho doanh nghiệp/ngân hàng, và tích hợp AI Reviewer tự động (CodeRabbit .coderabbit.yaml & Self-Hosted Qodo PR-Agent) làm "Người gác cổng đầu tiên".',
    keyObjectives: [
      'So sánh Quy trình Đơn giản (Lean / Fast-Track Pipeline) cho Startup và Quy trình Phê duyệt Đa tầng (3 Gates) cho Core Banking / E-commerce lớn.',
      'Viết tệp .github/CODEOWNERS phân quyền phê duyệt bắt buộc theo từng vùng thư mục nhạy cảm (/src/modules/payment/, /db/migrations/, /.github/workflows/).',
      'Làm chủ cấu hình Full Flow #4 (.coderabbit.yaml với path_instructions chuyên biệt và .github/workflows/ai-pr-agent.yml chạy nội bộ).',
    ],
    svgBlueprint: 'svg-expand-contract-ai-gate',
    theorySections: [
      {
        heading: '1. So sánh Quy trình Đơn giản (Lean) vs. Quy trình Phê duyệt Đa tầng (3 Gates — PDF Trang 13 & 14)',
        body: 'Tùy theo quy mô đội ngũ và mức độ nhạy cảm của dự án, kiến trúc sư CI/CD sẽ thiết kế luồng đi theo một trong hai mô hình:',
        bulletPoints: [
          'Quy trình Đơn giản (Lean / Fast-Track Pipeline — Dành cho Startup, Dịch vụ nội bộ): Lập trình viên mở PR → AI & CI tự động chạy Lint + Unit Test → 1 đồng nghiệp Review & Merge vào main → Pipeline tự động đóng gói Docker và đẩy thẳng lên Staging & Production kèm Smoke Test.',
          'Quy trình Phê duyệt Đa tầng (Multi-Stage Approval Pipeline — Dành cho Doanh nghiệp, Core Banking, Thương mại điện tử lớn): Một bản phát hành phải đi qua 3 chốt kiểm duyệt (Gates) độc lập: (1) Chốt 1 — Code Review Gate (.github/CODEOWNERS bắt buộc đúng nhóm Kiến trúc sư, DBA hoặc DevSecOps ký Approve khi chạm vào thư mục nhạy cảm); (2) Chốt 2 — QA Verification Gate (Pipeline dừng ở trạng thái Waiting sau khi lên Staging chờ QA nghiệm thu); (3) Chốt 3 — Release Manager Gate (Protected Environments chỉ cho phép nhóm Release-Approvers bấm nút Approve & Deploy kèm cờ prevent_self_review: true không cho người vừa đẩy commit tự duyệt cho chính mình).',
        ],
      },
      {
        heading: '2. Tích hợp AI trong Review Commit & Pull Request (Full Flow #4 — PDF Trang 14, 15 & 16)',
        body: 'Sự xuất hiện của các tác nhân AI chuyên biệt cho CI/CD như CodeRabbit, Qodo Merge (PR-Agent mã nguồn mở), GitHub Copilot Code Review và GitLab Duo đã thay đổi hoàn toàn khâu kiểm duyệt mã nguồn. AI đảm nhận vai trò "Người gác cổng đầu tiên" (First-responder Reviewer) ngay khi PR vừa mở:',
        bulletPoints: [
          'Luồng phối hợp 3 bước (Hình 4.4): [1. Mở / Push PR: Dev đẩy commit mới lên nhánh feature/*] → [2. AI Reviewer (CodeRabbit): Tóm tắt luồng & vẽ Sequence Diagram, bắt lỗi N+1 Query, Race Condition, Security & gợi ý bản vá] → [3. Tương tác & Sửa nhanh: Dev bấm "Commit suggestion" hoặc chat với @coderabbitai để tự động sinh thêm Unit Test].',
          'Huấn luyện quy chuẩn riêng theo thư mục (path_instructions trong .coderabbit.yaml): Biến AI thành chuyên gia DBA tự động! Ví dụ cấu hình cho db/migrations/**/*.sql: "Cảnh báo ĐỎ nếu có lệnh DROP COLUMN, RENAME COLUMN hoặc tạo Index không có từ khóa CONCURRENTLY gây khóa bảng Production". Nếu dev viết CREATE INDEX idx_user_email ON users(email); thiếu CONCURRENTLY, AI lập tức bình luận ngay tại dòng đó và đưa ra nút bấm sửa thành CREATE INDEX CONCURRENTLY.',
          'Sự kiện types: [opened, synchronize]: Kích hoạt AI ở cả hai thời điểm: khi PR vừa được tạo (opened) và mỗi khi lập trình viên đẩy thêm commit mới vào nhánh PR đó (synchronize) để kiểm tra xem bản vá mới đã giải quyết triệt để lỗi chưa.',
        ],
      },
    ],
    visualAnalogy: {
      title: 'Trợ lý Kiểm toán AI Sơ duyệt 24/7 & 3 Chữ ký Số Phân quyền Ngân hàng',
      realWorldScenario:
        'Hãy hình dung quy trình phê duyệt một hợp đồng tín dụng lớn tại ngân hàng:',
      mappingPoints: [
        {
          realWorld: 'Trợ lý AI đọc lướt toàn bộ 100 trang hợp đồng trong 10 giây, đánh dấu ngay các điều khoản rủi ro trước khi trình sếp',
          cicdEquivalent: 'AI Reviewer (.coderabbit.yaml / Self-Hosted Qodo PR-Agent)',
          explanation: 'Tự động vẽ Sequence Diagram, bắt lỗi N+1 Query, SQLi và lệnh CREATE INDEX thiếu CONCURRENTLY ngay khi mở PR.',
        },
        {
          realWorld: 'Phụ lục Thuế phải do Trưởng phòng Thuế ký; Phụ lục Pháp lý phải do Trưởng phòng Pháp chế ký (.github/CODEOWNERS)',
          cicdEquivalent: 'Chốt 1: .github/CODEOWNERS (/src/modules/payment/ → @fintech-architects; /db/migrations/ → @dba-team)',
          explanation: 'Nút Merge chỉ sáng lên khi có đúng chữ ký của nhóm chuyên trách thư mục đó.',
        },
        {
          realWorld: 'Người soạn thảo hợp đồng không được phép tự ký duyệt xuất tiền cho chính mình (Segregation of Duties)',
          cicdEquivalent: 'Chốt 3: Protected Environments + prevent_self_review: true + OIDC AWS',
          explanation: 'Đảm bảo nguyên tắc kiểm toán quốc tế PCI-DSS / SOC2.',
        },
      ],
      mentalModelTip:
        'Không để AI làm việc của Linter! Hãy dùng ESLint/Prettier bắt lỗi dấu chấm phẩy, còn trong .coderabbit.yaml đặt profile: "chill" để AI tập trung 100% vào lỗi Logic, Security, Race Condition và DB Lock.',
    },
    diagrams: [
      {
        id: 'diag-approval-and-ai-review',
        title: 'Luồng Phối hợp giữa AI Reviewer (CodeRabbit / PR-Agent), 3 Chốt Approval Gates & Đường ống CI',
        subtitle: 'Tái hiện sơ đồ trang 14 & cấu hình Full Flow #4 (PDF Trang 14–16)',
        type: 'pipeline',
        svgBlueprint: 'svg-expand-contract-ai-gate',
        nodes: [
          {
            id: 'gate-0-ai',
            badge: 'First-Responder AI',
            title: 'AI Reviewer (CodeRabbit / PR-Agent)',
            subtitle: 'Sequence Diagram • N+1 • SQLi • DB Lock',
            detail:
              'Kích hoạt khi PR opened hoặc synchronize. Lọc bỏ dist/ và lockfile, áp dụng path_instructions riêng cho src/api/**/*.ts và db/migrations/**/*.sql để bắt lỗi nặng (profile: chill).',
            highlightColor: 'violet',
          },
          {
            id: 'gate-1-codeowners',
            badge: 'Chốt 1: Code Review Gate',
            title: '.github/CODEOWNERS',
            subtitle: 'Phân quyền duyệt theo vùng thư mục',
            detail:
              'Chạm vào /src/modules/payment/ bắt buộc @company/fintech-architects duyệt; chạm /db/migrations/ bắt buộc @company/dba-team duyệt; sửa /.github/workflows/ bắt buộc @company/devops-sec-leads duyệt.',
            highlightColor: 'sky',
          },
          {
            id: 'gate-2-qa',
            badge: 'Chốt 2: QA Staging Gate',
            title: 'Triển khai Staging & Kiểm thử E2E',
            subtitle: 'Playwright E2E + QA Nghiệm thu',
            detail:
              'Sau khi Merge vào main, Pipeline tự động đẩy lên Staging và chạy kiểm thử tự động E2E kết hợp QA xác nhận.',
            highlightColor: 'amber',
          },
          {
            id: 'gate-3-prod',
            badge: 'Chốt 3: Release Manager Gate',
            title: 'Protected Prod + OIDC Rollout',
            subtitle: 'prevent_self_review: true + AWS OIDC',
            detail:
              'Dừng tại environment: production chờ Release Manager bấm Approve, sau đó xin JWT Token ngắn hạn qua OIDC để rollout lên cụm EKS Production.',
            highlightColor: 'emerald',
          },
        ],
        caption: 'Mục 4.3 & 4.4 (PDF Trang 13–16): Kết hợp AI Reviewer tốc độ cao với 3 chốt phân quyền chuẩn doanh nghiệp.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L4-3-codeowners-prod-gate',
        title: 'Cấu hình Phân quyền .github/CODEOWNERS & Cổng Duyệt Production + OIDC (PDF Trang 14)',
        language: 'yaml',
        description:
          'Bộ cấu hình thực tế bảo vệ các thư mục trọng yếu và khóa cổng phát hành Production:',
        code: `# --- PHẦN A: Tệp .github/CODEOWNERS (Tự động chỉ định bắt buộc ai phải bấm Approve PR theo từng vùng mã nguồn) ---
*                       @company/backend-seniors    # Mặc định mọi file cần ít nhất 1 Senior Dev duyệt
/src/modules/payment/   @company/fintech-architects # Chạm vào logic Thanh toán bắt buộc Kiến trúc sư duyệt
/db/migrations/         @company/dba-team           # Thay đổi cấu trúc bảng DB bắt buộc nhóm DBA duyệt
/.github/workflows/     @company/devops-sec-leads   # Sửa file CI/CD bắt buộc nhóm DevSecOps duyệt

# --- PHẦN B: .github/workflows/prod-release.yml (Chặn chờ Release Manager duyệt + Xác thực AWS qua OIDC) ---
permissions:
  id-token: write # Bắt buộc cấp quyền sinh JWT Token ngắn hạn để xác thực OIDC với AWS (Không dùng Secret Key tĩnh)
  contents: read
jobs:
  deploy-production:
    needs: [ "deploy-staging", "e2e-playwright-test" ]
    runs-on: ubuntu-24.04
    # Gắn với Environment 'production' (đã cấu hình Required Reviewers + Prevent Self-Review trong GitHub Settings)
    environment: { name: production, url: https://api.company.com }
    steps:
      - name: 1. Assume AWS Production Role via Passwordless OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsProdDeployRole
          aws-region: ap-southeast-1
      - name: 2. Rollout Verified Image to EKS Production Cluster
        run: ./scripts/rollout-prod.sh "\${{ github.sha }}"`,
        outputOrImpact: 'Không một dòng code nhạy cảm hay thay đổi file CI nào có thể lọt lên Production mà không có chữ ký của đúng chuyên gia.',
        annotations: [
          { line: 3, explanation: 'Mọi PR sửa code trong /src/modules/payment/ tự động yêu cầu chữ ký của nhóm @company/fintech-architects.' },
          { line: 5, explanation: 'Bảo vệ chính tệp cấu hình CI/CD (/.github/workflows/) khỏi bị sửa trái phép.' },
          { line: 16, explanation: 'Gắn với Protected Environment production có bật Required Reviewers và Prevent Self-Review.' },
        ],
      },
      {
        id: 'code-L4-4-full-flow-4-coderabbit-pr-agent',
        title: 'Full Flow #4: Cấu hình AI Review CodeRabbit (.coderabbit.yaml) & Self-Hosted Qodo PR-Agent (PDF Trang 15)',
        language: 'yaml',
        description:
          'Huấn luyện AI Reviewer bằng Tiếng Việt, lọc bỏ file rác, ép quy chuẩn theo từng thư mục và tự chạy PR-Agent nội bộ:',
        code: `# --- PHẦN A: Tệp .coderabbit.yaml (Đặt ở gốc kho Git để điều khiển hành vi AI Review trên từng PR & Commit) ---
language: "vi-VN" # Yêu cầu AI viết toàn bộ nhận xét, biểu đồ luồng và gợi ý sửa lỗi bằng Tiếng Việt
reviews:
  profile: "chill" # Chọn 'chill' để AI chỉ tập trung bắt lỗi nặng (Logic/Security/Perf), bỏ qua lỗi vặt
  request_changes_workflow: true # Tự động đánh dấu 'Request Changes' chặn Merge nếu phát hiện lỗ hổng nghiêm trọng
  high_level_summary: true # Tự động sinh bản tóm tắt PR và biểu đồ Sequence Diagram ở đầu trang
  auto_review: { enabled: true, drafts: false, base_branches: [ "main", "develop" ] }
  # Loại trừ các file tự sinh/lockfile để tiết kiệm Token và giúp AI tập trung 100% vào code nghiệp vụ
  path_filters: [ "!**/dist/**", "!**/*.lock", "!**/package-lock.json", "!**/__snapshots__/**" ]
  # Huấn luyện quy chuẩn riêng cho từng vùng thư mục của dự án
  path_instructions:
    - path: "src/api/**/*.ts"
      instructions: "Kiểm tra lỗi SQL Injection, N+1 Query trong vòng lặp, bắt buộc validate input bằng Zod và kiểm tra quyền truy cập."
    - path: "db/migrations/**/*.sql"
      instructions: "Cảnh báo ĐỎ nếu có lệnh DROP COLUMN, RENAME COLUMN hoặc tạo Index không có từ khóa CONCURRENTLY gây khóa bảng Production."

# --- PHẦN B: .github/workflows/ai-pr-agent.yml (Tự chạy AI PR-Agent mã nguồn mở ngay trong CI Runner nội bộ) ---
on:
  pull_request: { types: [ opened, synchronize ] } # Chạy khi mở PR mới hoặc khi dev đẩy thêm commit vào PR
jobs:
  ai_review_step:
    runs-on: ubuntu-24.04
    permissions: { issues: write, pull-requests: write, contents: read }
    steps:
      - name: Run Automated AI Describe, Review & Code Suggestions
        uses: Codium-ai/pr-agent@v0.24
        env:
          OPENAI_KEY: \${{ secrets.INTERNAL_LLM_API_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          pr_reviewer.extra_instructions: "Chỉ nhận xét các lỗi tiềm ẩn về Race Condition, Memory Leak, Security; trả lời bằng Tiếng Việt."`,
        outputOrImpact: 'Biến AI thành chuyên gia DBA và Bảo mật tự động kiểm tra từng dòng code trước khi Tech Lead vào review.',
        annotations: [
          { line: 4, explanation: 'profile: "chill" giảm nhiễu (Noise), chỉ bắt các lỗi kiến trúc/bảo mật thực sự quan trọng.' },
          { line: 9, explanation: 'path_filters loại bỏ các file lock và snapshot để giữ Context Window của AI luôn sắc bén.' },
          { line: 15, explanation: 'Chặn ngay lỗi viết lệnh CREATE INDEX quên từ khóa CONCURRENTLY làm treo bảng Database.' },
          { line: 19, explanation: 'types: [opened, synchronize] chạy lại AI mỗi khi lập trình viên đẩy thêm commit sửa lỗi vào PR.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Phân quyền CODEOWNERS & AI Review',
        githubActionsWay: '.github/CODEOWNERS + GitHub Copilot Code Review / CodeRabbit / Qodo PR-Agent.',
        gitlabCiWay: '.gitlab/CODEOWNERS + Approval Rules + GitLab Duo Self-Hosted / Qodo PR-Agent.',
        architecturalNote: 'Với các tổ chức Tài chính/Ngân hàng cấm gửi code ra ngoài, dùng Qodo PR-Agent hoặc GitLab Duo Self-Hosted kết nối tới AWS Bedrock Private VPC hoặc vLLM nội bộ.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L4-4-create-index-lock',
        title: 'Chạy lệnh CREATE INDEX trên bảng lớn (hàng chục triệu dòng) mà thiếu từ khóa CONCURRENTLY',
        severity: 'critical',
        symptom: 'Khi CI/CD chạy bước Database Migration trên Production, toàn bộ các API INSERT/UPDATE/DELETE vào bảng users bị treo cứng suốt 10 phút!',
        whyItHappens: 'Trong PostgreSQL, lệnh CREATE INDEX thông thường khóa ghi toàn bộ bảng (ShareLock) cho đến khi đánh xong chỉ mục. Phải dùng CREATE INDEX CONCURRENTLY để đánh chỉ mục ngầm không khóa bảng.',
        wrongConfig: `CREATE INDEX idx_user_email ON users(email);`,
        rightConfig: `CREATE INDEX CONCURRENTLY idx_user_email ON users(email);`,
        fixExplanation: 'Đó chính là lý do trong Full Flow #4 ta huấn luyện path_instructions cho thư mục db/migrations/ để AI tự động bắt lỗi này ngay trên PR!',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L4-4',
        title: 'Thời gian Review Pull Request khi Kết hợp AI First-Responder (profile: chill) + Tech Lead',
        claim: 'AI bắt sẵn 80% lỗi N+1 Query, thiếu validate Zod và lỗi Migration chỉ trong 45 giây sau khi mở PR.',
        methodology: 'So sánh thời gian từ lúc mở PR đến khi hoàn tất vòng review đầu tiên.',
        metrics: [
          {
            label: 'AI Review sơ duyệt (45s) + Tech Lead duyệt kiến trúc',
            valueText: 'Giảm 60% thời gian chờ Review PR',
            barPercent: 92,
            isOptimal: true,
            note: 'Dev sửa xong hết các lỗi kỹ thuật trước khi Tech Lead vào đọc.',
          },
          {
            label: 'Con người đọc thủ công từ đầu đến cuối',
            valueText: 'Mất 30–45 phút soi từng dòng null check & SQL',
            barPercent: 30,
            isOptimal: false,
            note: 'Dễ bỏ sót lỗi Race Condition hoặc thiếu CONCURRENTLY.',
          },
        ],
        takeaway: 'Kết hợp Linter (bắt lỗi trình bày) + AI Reviewer (bắt lỗi logic/DB/bảo mật) + Con người (duyệt kiến trúc nghiệp vụ).',
      },
    ],
    bestPractices: [
      'Luôn cấu hình .github/CODEOWNERS cho ít nhất 3 vùng nhạy cảm: /.github/workflows/, /db/migrations/ và các module thanh toán/xác thực.',
      'Trong .coderabbit.yaml, luôn bật profile: "chill" và loại trừ các file lock/snapshot qua path_filters để tránh gây mệt mỏi (Noise) cho đội ngũ.',
    ],
    relatedSimulators: [
      {
        label: 'Mở IDE Khám phá Full Flow #4 (.coderabbit.yaml & PR-Agent)',
        targetTab: 'blueprints',
        targetId: 'full-flow-4-ai-review-codeowners',
      },
    ],
  },
  {
    id: 'cicd-L5-1-architectural-decisions-a1-a2-a3',
    stageId: 'cicd-stage-5',
    order: 14,
    title: 'Phần II (Chuyên đề A1, A2, A3): Quyết định Kiến trúc — Delivery vs. Deployment, Đóng gói Docker trong CI (DinD vs. Socket vs. Kaniko) & Chọn Công cụ',
    shortTitle: 'Chuyên đề A1–A3: Kiến trúc & Kaniko',
    level: 'master',
    estimatedMinutes: 30,
    pdfRef: 'Phần II — Chuyên đề A1, A2, A3 (Trang 16 & 17 / 21)',
    summary:
      'Phân tích sâu 3 bài toán kiến trúc kinh điển: (A1) Khi nào bắt buộc dùng Continuous Delivery (duyệt tay) vs. Continuous Deployment; (A2) So sánh bảo mật và hiệu năng của Docker-in-Docker (dind), Docker Socket Binding và Kaniko/BuildKit Rootless; (A3) Tiêu chí lựa chọn GitLab CI, GitHub Actions và Jenkins.',
    keyObjectives: [
      'Hiểu nguyên tắc Phân tách nhiệm vụ (Segregation of Duties) theo chuẩn PCI-DSS, SOC2, ISO 27001 trong Chuyên đề A1.',
      'So sánh cơ chế hoạt động, ưu điểm và rủi ro bảo mật (Container Escape --privileged, chiếm quyền docker.sock) giữa DinD, Socket Binding và Kaniko/Buildah/BuildKit Rootless (Bảng A2).',
      'Nắm vững ưu thế của GitLab CI, GitHub Actions (ghim Commit SHA chống Supply Chain Attack) và Jenkins (Chuyên đề A3).',
    ],
    svgBlueprint: 'svg-devsecops-oidc',
    theorySections: [
      {
        heading: '1. Chuyên đề A1: Khi nào nên dừng ở Continuous Delivery (duyệt tay) và khi nào tiến tới Continuous Deployment (tự động 100%)? (PDF Trang 16)',
        body: 'Không phải lúc nào tự động hóa 100% lên Production cũng là lựa chọn đúng. Quyết định phụ thuộc vào quy định tuân thủ và độ tin cậy của lưới kiểm thử:',
        bulletPoints: [
          'Bắt buộc dùng Continuous Delivery (Manual Approval Gate) khi: Hệ thống thuộc lĩnh vực Tài chính - Ngân hàng, Thanh toán, Y tế chịu sự điều chỉnh của chuẩn kiểm toán (PCI-DSS, SOC2, ISO 27001) — yêu cầu nguyên tắc Phân tách nhiệm vụ (Segregation of Duties): người viết code và người bấm nút duyệt đưa lên Production phải là hai cá nhân độc lập; hoặc khi cần phát hành đồng bộ theo lịch sự kiện kinh doanh, hoặc khi độ phủ Automated E2E Test chưa đủ tin cậy.',
          'Áp dụng Continuous Deployment (Full Auto) khi: Hệ thống SaaS/Microservices đã có lưới Automated Test đa tầng vững chắc, áp dụng Feature Flags (tách rời hành động Deploy gói cài đặt kỹ thuật khỏi hành động Bật tính năng cho người dùng), và có hệ thống Canary tự động hoàn tác khi chỉ số lỗi vượt ngưỡng.',
        ],
      },
      {
        heading: '2. Chuyên đề A2: Đóng gói Docker Image bên trong CI Runner — So sánh DinD, Docker Socket Binding và Kaniko / BuildKit Rootless (PDF Trang 16 & 17)',
        body: 'Khi bản thân CI Runner đang chạy trong một Container (trên Kubernetes hoặc Docker Host), việc gọi lệnh docker build bên trong Runner đặt ra bài toán lớn về bảo mật và hiệu năng:',
        bulletPoints: [
          '1. Docker-in-Docker (dind): Khởi chạy một tiến trình Docker Daemon con hoàn toàn mới bên trong Container của CI Job. Ưu điểm: Cô lập môi trường tốt giữa các Job chạy song song; không làm rác máy chủ Host. Nhược điểm & Rủi ro: Đòi hỏi bật cờ --privileged (Quyền tối cao cấp Kernel) → Nguy cơ Container Escape chiếm quyền máy chủ; mất Layer Cache sau khi Job tắt.',
          '2. Docker Socket Binding (/var/run/docker.sock): Mount trực tiếp file socket của Docker Daemon trên máy chủ Host vào bên trong Container của Job CI. Ưu điểm: Tốc độ build cực nhanh vì dùng chung trực tiếp Docker Layer Cache sẵn có trên ổ cứng máy Host. Nhược điểm & Rủi ro: Rủi ro an ninh nghiêm trọng — đoạn script chạy trong CI có toàn quyền điều khiển Docker của máy Host (có thể xóa container khác hoặc mount thư mục gốc / của Host).',
          '3. Kaniko / Buildah / BuildKit Rootless: Thực thi từng chỉ thị trong Dockerfile và đóng gói các Layer hoàn toàn trong Userspace mà không cần Docker Daemon. Ưu điểm: Chuẩn mực an toàn nhất cho K8s Runner — không cần --privileged, không cần chạm vào docker.sock. Nhược điểm: Cần cấu hình đẩy/kéo Remote Cache từ Container Registry để tối ưu tốc độ.',
        ],
      },
      {
        heading: '3. Chuyên đề A3: Tiêu chí lựa chọn giữa GitLab CI/CD, GitHub Actions và Jenkins (PDF Trang 17)',
        body: 'Mỗi công cụ có thế mạnh kiến trúc riêng biệt:',
        bulletPoints: [
          'GitLab CI/CD: Vượt trội ở tính đồng bộ "All-in-One DevSecOps". Các tính năng quản lý Environments, Resource Groups (chống xung đột deploy), Container Registry, Parent-Child Pipelines cho Monorepo và phân quyền bảo mật doanh nghiệp được tích hợp sẵn rất chặt chẽ mà không phụ thuộc vào plugin bên ngoài.',
          'GitHub Actions: Vượt trội ở kho Marketplace phong phú giúp ghép nối quy trình cực nhanh. Tuy nhiên, khi dùng trong doanh nghiệp cần ghim cứng phiên bản Action bên thứ ba bằng mã băm Commit SHA đầy đủ (ví dụ: uses: actions/checkout@b4ffde65... thay vì @v4) để phòng chống tấn công chuỗi cung ứng (Supply Chain Attack) nếu tài khoản tác giả Action bị chiếm đoạt.',
          'Jenkins: Cực kỳ linh hoạt cho các hệ thống On-premise lâu năm cần tùy biến sâu bằng Groovy Pipeline. Tuy nhiên chi phí bảo trì cao: máy chủ Jenkins Controller là điểm lỗi đơn (SPOF) và hệ sinh thái hàng nghìn Plugin dễ gặp xung đột phiên bản hoặc lỗ hổng bảo mật khi nâng cấp.',
        ],
      },
    ],
    visualAnalogy: {
      title: 'Ba Cách Đóng Thùng Hàng Trong Tòa Nhà Chung Cư (DinD vs. Socket vs. Kaniko)',
      realWorldScenario:
        'Hãy hình dung bạn thuê một căn hộ (Container CI) trong tòa nhà chung cư (Máy chủ Host / K8s Node):',
      mappingPoints: [
        {
          realWorld: 'Đòi Ban quản lý giao quyền Admin tối cao của cả tòa nhà để xây một nhà máy con trong phòng (DinD --privileged)',
          cicdEquivalent: '1. Docker-in-Docker (dind với cờ --privileged)',
          explanation: 'Rất nguy hiểm vì người thuê phòng có quyền cấp Kernel, có thể phá tường sang căn hộ khác (Container Escape).',
        },
        {
          realWorld: 'Nối thẳng dây điều khiển vào phòng kỹ thuật trung tâm của tòa nhà (Mount /var/run/docker.sock)',
          cicdEquivalent: '2. Docker Socket Binding (/var/run/docker.sock)',
          explanation: 'Dùng ké máy móc rất nhanh, nhưng người thuê phòng có thể bấm nút tắt điện các căn hộ khác hoặc đọc toàn bộ dữ liệu tòa nhà!',
        },
        {
          realWorld: 'Dùng bộ dụng cụ đóng gói cầm tay gọn nhẹ ngay trên bàn làm việc của mình (Kaniko / BuildKit Rootless)',
          cicdEquivalent: '3. Kaniko / Buildah / BuildKit Rootless (Userspace)',
          explanation: 'Không cần quyền Admin (--privileged), không chạm vào phòng kỹ thuật (docker.sock) — an toàn tuyệt đối cho cụm Kubernetes.',
        },
      ],
      mentalModelTip:
        'Khi chạy CI Runner trên Kubernetes: Tuyệt đối ưu tiên Kaniko hoặc BuildKit Rootless thay vì bật --privileged hay mount /var/run/docker.sock.',
    },
    diagrams: [
      {
        id: 'diag-dind-socket-kaniko',
        title: 'Bảng A2: So sánh 3 Phương pháp Đóng gói Docker Image bên trong CI Runner',
        subtitle: 'Bấm vào từng phương pháp để phân tích Cơ chế hoạt động, Ưu điểm và Rủi ro bảo mật',
        type: 'comparison-boxes',
        svgBlueprint: 'svg-devsecops-oidc',
        nodes: [
          {
            id: 'b-dind',
            badge: '1. Docker-in-Docker',
            title: 'dind (--privileged)',
            subtitle: 'Docker Daemon con trong Container',
            detail:
              'Cô lập tốt giữa các Job nhưng đòi hỏi bật cờ --privileged (quyền tối cao cấp Kernel) → Nguy cơ Container Escape chiếm quyền máy chủ; mất Layer Cache sau khi Job tắt.',
            highlightColor: 'amber',
          },
          {
            id: 'b-socket',
            badge: '2. Socket Binding',
            title: 'Mount /var/run/docker.sock',
            subtitle: 'Dùng chung Daemon của máy Host',
            detail:
              'Tốc độ build cực nhanh nhờ dùng trực tiếp Layer Cache trên ổ cứng Host, nhưng rủi ro an ninh nghiêm trọng: script trong CI có toàn quyền xóa container khác hoặc mount thư mục gốc / của Host.',
            highlightColor: 'rose',
          },
          {
            id: 'b-kaniko',
            badge: '3. Chuẩn K8s An toàn',
            title: 'Kaniko / Buildah / BuildKit Rootless',
            subtitle: 'Đóng gói Layer trong Userspace',
            detail:
              'Thực thi từng chỉ thị Dockerfile hoàn toàn trong Userspace mà không cần Docker Daemon, không cần --privileged, không chạm vào docker.sock. Kết hợp Remote Cache từ Registry.',
            highlightColor: 'emerald',
          },
        ],
        caption: 'Chuyên đề A2 (PDF Trang 16–17): Lựa chọn cơ chế đóng gói Container an toàn trên hạ tầng Kubernetes Runner.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L5-1-kaniko-and-sha-pinning',
        title: 'Đóng gói Docker An toàn bằng Kaniko (Không cần --privileged) & Ghim Commit SHA trên GitHub Actions',
        language: 'yaml',
        description:
          'Minh họa 2 kỹ thuật bảo mật thực chiến từ Chuyên đề A2 và A3:',
        code: `# --- A. GITLAB CI: Dùng Kaniko đóng gói Docker Image trong Userspace kèm Remote Cache ---
build_with_kaniko_rootless:
  stage: package
  image:
    name: gcr.io/kaniko-project/executor:v1.23.2-debug
    entrypoint: [""]
  script:
    - /kaniko/executor
      --context "\${CI_PROJECT_DIR}"
      --dockerfile "\${CI_PROJECT_DIR}/Dockerfile"
      --destination "\${CI_REGISTRY_IMAGE}:\${CI_COMMIT_SHORT_SHA}"
      --cache=true
      --cache-repo="\${CI_REGISTRY_IMAGE}/cache"

# --- B. GITHUB ACTIONS: Ghim cứng mã băm Commit SHA đầy đủ chống Supply Chain Attack (Chuyên đề A3) ---
steps:
  # Không dùng @v4 chung chung với các Action bên thứ ba nhạy cảm; ghim cứng Commit SHA 40 ký tự:
  - name: Checkout Code Safely (Pinned Commit SHA)
    uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1`,
        outputOrImpact: 'Loại bỏ hoàn toàn nguy cơ Container Escape trên K8s Runner và phòng chống tấn công chuỗi cung ứng.',
        annotations: [
          { line: 8, explanation: 'Kaniko đọc Dockerfile và đẩy thẳng Image + Layer Cache lên Registry mà không cần Docker Daemon hay quyền root/privileged.' },
          { line: 19, explanation: 'Ghim cứng mã băm SHA 40 ký tự đảm bảo dù tài khoản tác giả Action bị hack và trỏ lại tag @v4 sang mã độc thì Pipeline của bạn vẫn an toàn.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'So sánh Kiến trúc GitLab CI vs. GitHub Actions vs. Jenkins (Chuyên đề A3)',
        githubActionsWay: 'Kho Marketplace khổng lồ, ghép nối cực nhanh; cần ghim Commit SHA cho 3rd-party Actions.',
        gitlabCiWay: 'All-in-One DevSecOps đồng bộ (Environments, Resource Groups, Registry, Parent-Child Pipelines) không phụ thuộc plugin ngoài.',
        architecturalNote: 'Jenkins cực kỳ linh hoạt cho On-premise lâu năm (Groovy Pipeline) nhưng Controller là điểm lỗi đơn (SPOF) và tốn chi phí bảo trì Plugin.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L5-1-docker-sock-escape',
        title: 'Mount /var/run/docker.sock vào CI Runner dùng chung cho nhiều dự án',
        severity: 'critical',
        symptom: 'Một lập trình viên viết lệnh docker run -v /:/host alpine cat /host/etc/shadow trong file CI và đọc được toàn bộ file hệ thống của máy chủ vật lý!',
        whyItHappens: 'Quyền truy cập vào /var/run/docker.sock tương đương với quyền root tối cao trên máy chủ Host!',
        wrongConfig: `volumes: ["/var/run/docker.sock:/var/run/docker.sock"]`,
        rightConfig: `# Chuyển sang dùng Kaniko hoặc BuildKit Rootless trên K8s Runner`,
        fixExplanation: 'Bảng A2 (PDF Trang 17): Docker Socket Binding tiềm ẩn rủi ro an ninh nghiêm trọng vì cho phép điều khiển toàn bộ Docker của máy Host.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L5-1',
        title: 'Đánh giá Độ An toàn & Tốc độ của Kaniko + Remote Cache trên Kubernetes',
        claim: 'Kaniko kết hợp --cache=true đạt tốc độ tương đương 90% so với Docker Daemon truyền thống nhưng an toàn tuyệt đối (0 quyền privileged).',
        methodology: 'Đo trên K8s Cluster chạy 20 Job build đồng thời.',
        metrics: [
          {
            label: 'Kaniko / BuildKit Rootless + Remote Registry Cache',
            valueText: 'An toàn 100% (No Privileged) + Tốc độ cao',
            barPercent: 95,
            isOptimal: true,
            note: 'Chuẩn mực công nghiệp cho K8s Runner.',
          },
          {
            label: 'Docker-in-Docker (dind --privileged) không cache',
            valueText: 'Rủi ro Container Escape + Mất cache khi tắt Job',
            barPercent: 30,
            isOptimal: false,
            note: 'Phải tải lại toàn bộ layer mới mỗi khi khởi tạo Pod.',
          },
        ],
        takeaway: 'Luôn dùng Kaniko hoặc BuildKit Rootless kèm Remote Cache khi vận hành CI trên Kubernetes.',
      },
    ],
    bestPractices: [
      'Trong doanh nghiệp lớn, luôn ghim phiên bản GitHub Actions bên thứ ba bằng mã băm Commit SHA 40 ký tự.',
      'Tuân thủ nghiêm ngặt Segregation of Duties (Continuous Delivery có Manual Gate) cho các hệ thống chịu chuẩn kiểm toán tài chính/y tế.',
    ],
  },
  {
    id: 'cicd-L5-2-troubleshooting-scenarios-b1-to-b7',
    stageId: 'cicd-stage-5',
    order: 15,
    title: 'Phần II (Tình huống B1 → B7): Cẩm nang Chẩn đoán & Xử lý 7 Sự cố Vận hành CI/CD Thực tế',
    shortTitle: 'Tình huống B1–B7: Xử lý Sự cố Thực chiến',
    level: 'master',
    estimatedMinutes: 45,
    pdfRef: 'Phần II — Tình huống B1 đến B7 (Trang 17, 18, 19, 20 & 21)',
    summary:
      'Tổng hợp trọn vẹn 7 kịch bản xử lý sự cố thực chiến từ trang 17 đến trang 21: (B1) Tối ưu Pipeline từ 42 phút xuống dưới 6 phút; (B2) Xử lý Deployment Race Condition ghi đè code cũ lên code mới; (B3) Quy trình 4 bước ứng cứu lộ Secret trên Git; (B4) Trị dứt điểm Flaky Tests; (B5) 5 nguyên nhân "Works on Local, Fails on CI"; (B6) Bảo mật & giảm nhiễu AI Review; (B7) Xử lý dứt điểm lỗi 502 Bad Gateway.',
    keyObjectives: [
      'Thuộc lòng Quy trình 6 bước cắt giảm thời gian Pipeline từ 42 phút xuống dưới 6 phút (Tình huống B1).',
      'Nắm vững cấu hình khóa Concurrency tách biệt giữa CI (cancel-in-progress: true) và CD (cancel-in-progress: false) để chống ghi đè phiên bản (Tình huống B2).',
      'Thực hiện đúng thứ tự 4 bước ứng cứu lộ lọt Secret (Tình huống B3), 3 giải pháp trị Flaky Tests (Tình huống B4) và khắc phục 5 mã lỗi Works on Local / Fails on CI (Tình huống B5).',
    ],
    svgBlueprint: 'svg-zero-downtime-sigterm',
    theorySections: [
      {
        heading: '1. Tình huống B1: Pipeline ban đầu chạy 4 phút nhưng sau 1 năm phình lên 42 phút — Quy trình tối ưu xuống dưới 6 phút (PDF Trang 17 & 18)',
        body: 'Quy trình chuẩn xử lý điểm nghẽn hiệu năng Pipeline gồm các bước:',
        bulletPoints: [
          '1. Phân tích thời gian từng công đoạn (Timeline Profiling): Bóc tách xem 42 phút tiêu tốn vào đâu: khởi tạo Runner, tải thư viện, chạy Test hay đóng gói Docker Image.',
          '2. Tối ưu tầng Dependencies & Cấu trúc Dockerfile (Cắt giảm 60% thời gian I/O): Bật Dependency Cache gắn khóa theo hashFiles(lockfile) với chính sách pull-only cho các Job thông thường. Sắp xếp lại thứ tự các chỉ thị trong Dockerfile từ ít thay đổi nhất lên trên, thường xuyên thay đổi xuống dưới: thực hiện COPY package*.json ./ và RUN npm ci ở layer trước, sau đó mới COPY src/ ./src/ ở layer sau. Khi chỉ sửa code trong src/, Docker tái sử dụng 100% layer node_modules từ Cache.',
          '3. Dùng Multi-stage Build và thiết lập file .dockerignore: Loại bỏ .git, node_modules, coverage để giảm dung lượng Image từ hơn 1GB xuống ~100MB, giúp đẩy/kéo qua mạng nhanh gấp 10 lần.',
          '4. Chuyển từ Tuần tự sang Đồ thị DAG & Test Sharding: Cho phép Lint, SAST, Unit Test chạy đồng thời ngay từ đầu; chia bộ Integration Test nặng thành 4–8 luồng song song (parallel: 6).',
          '5. Thiết kế chốt Fail-Fast: Đặt các bước kiểm tra siêu nhẹ (Linter, Typecheck — chỉ mất 15 giây) lên đầu tiên; nếu lỗi cú pháp thì dừng ngay toàn bộ Pipeline trước khi khởi tạo các container Database nặng nề.',
          '6. Nâng cấp hạ tầng Runner: Sử dụng Self-hosted Runner gắn ổ cứng NVMe và đặt Registry Mirror ngay trong cùng mạng nội bộ (VPC) để loại bỏ độ trễ băng thông quốc tế.',
        ],
      },
      {
        heading: '2. Tình huống B2 (Out-of-order Deployment Race Condition) & Tình huống B3 (Ứng cứu Lộ Secret Git) (PDF Trang 18 & 19)',
        body: 'Hai sự cố nghiêm trọng nhất liên quan đến triển khai và bảo mật:',
        bulletPoints: [
          'Tình huống B2 (Hai PR merge cách nhau 30s — Commit A trước, B sau; B xong trước lên Prod rồi A mới xong và ghi đè code cũ lên B!): Nguyên nhân là Deployment Race Condition do cho phép nhiều Pipeline cùng chạy bước Deploy một lúc. Nguyên tắc sống còn: Với các Job kiểm thử (CI) trên nhánh PR, bật cancel-in-progress: true để tiết kiệm tài nguyên. Nhưng với Job Deploy lên Production (CD), tuyệt đối KHÔNG được hủy ngang (cancel-in-progress: false) vì ngắt đột ngột khi Helm/Terraform đang chạy dở sẽ làm hỏng trạng thái hạ tầng (State Lock Corruption). Thay vào đó, phải đưa vào hàng đợi khóa tuần tự (group: production-deploy-lock hoặc resource_group với process_mode=newest_first).',
          'Tình huống B3 (Vô tình commit DB Password & AWS Secret Key lên Git và in ra CI Log): Khẳng định kỹ thuật: Chạy lệnh git rm rồi tạo commit mới hoàn toàn KHÔNG có tác dụng bảo mật vì mật khẩu vẫn nằm nguyên vẹn trong .git/objects của commit trước! Quy trình 4 bước theo đúng thứ tự ưu tiên: (Bước 1) Thu hồi và Xoay vòng khóa ngay lập tức (Revoke & Rotate First trên AWS IAM, đổi mật khẩu DB, thay khóa JWT — làm đầu tiên trước khi dọn Git!); (Bước 2) Xóa vĩnh viễn khỏi lịch sử Git bằng git-filter-repo + git push --force --all và xóa bản ghi CI Console Log; (Bước 3) Rà soát nhật ký truy cập (Security Audit trên AWS CloudTrail & DB Log); (Bước 4) Cài đặt pre-commit hook chạy gitleaks protect --staged trên máy dev kết hợp quét trên CI.',
        ],
      },
      {
        heading: '3. Tình huống B4 (Flaky Tests), B5 (Works on Local, Fails on CI) & B6 (AI Review Privacy & Noise) (PDF Trang 19, 20 & 21)',
        body: 'Giải quyết triệt để các nỗi ám ảnh hàng ngày của đội ngũ kỹ sư:',
        bulletPoints: [
          'Tình huống B4 (Flaky Tests — không sửa code nhưng chạy 10 lần thì 2 lần Fail ngẫu nhiên): 4 nguyên nhân gốc rễ: (1) Ô nhiễm dữ liệu (Shared State) khi nhiều luồng test ghi/xóa chung 1 bảng DB; (2) Độ trễ bất đồng bộ (Async Race Condition) do dùng sleep(1000) cứng nhưng CPU của CI chậm hơn máy cá nhân; (3) Phụ thuộc múi giờ (máy cá nhân UTC+7 nhưng Container CI là UTC+0); (4) Gọi mạng ra dịch vụ ngoài không ổn định. Giải pháp: (1) Cách ly ngay (Quarantine) sang Suite riêng và sửa trong 48h; (2) Cô lập DB cho mỗi Worker bằng Testcontainers hoặc Transaction ROLLBACK sau afterEach(); (3) Đặt cứng TZ=UTC, dùng FakeTimers và thay sleep() cứng bằng Polling có điều kiện waitFor().',
          'Tình huống B5 (5 nguyên nhân "Works on Local, Fails on CI" — Bảng B5 Trang 20): (1) Lỗi Module not found dù file tồn tại (macOS/Windows không phân biệt hoa-thường còn Linux phân biệt tuyệt đối UserSvc.ts != usersvc.ts → bật git config core.ignorecase false + ESLint import/no-unresolved); (2) Tiến trình tự ngắt với Exit code 137 = 128 + 9 SIGKILL (vượt trần RAM bị Linux Kernel OOM Killer tiêu diệt → cấu hình NODE_OPTIONS="--max-old-space-size=3072", giảm số worker hoặc tăng RAM Runner); (3) Lỗi Exec format error hoặc lỗi C++ (máy Mac Apple Silicon arm64 đóng gói nhầm file nhị phân vào Image/Cache của CI chạy Linux amd64 → thêm node_modules vào .dockerignore); (4) Job đứng im đến Timeout (CLI chờ nhập phím [Y/n] TTY Prompt → đặt CI=true và truyền cờ --yes / --non-interactive); (5) Lỗi /bin/sh^M: bad interpreter (Windows lưu file .sh với ký tự xuống dòng CRLF \\r\\n → tạo file .gitattributes với *.sh text eol=lf).',
          'Tình huống B6 (Bảo mật & giảm nhiễu AI Review): (1) Bật Zero-Data Retention hoặc tự chạy Self-Hosted Qodo PR-Agent / GitLab Duo kết nối tới AWS Bedrock Private VPC / vLLM nội bộ; (2) Không để AI làm việc của Linter, chuyển từ chế độ assertive sang chill và lọc bỏ thư mục tự sinh qua path_filters.',
        ],
      },
    ],
    visualAnalogy: {
      title: 'Phòng Cấp cứu & Điều hành Khẩn cấp (Incident War-Room)',
      realWorldScenario:
        'Hãy hình dung cách xử lý khi chìa khóa két sắt bị lộ (B3) hoặc khi 2 đoàn tàu cùng lao vào 1 đường ray đơn (B2):',
      mappingPoints: [
        {
          realWorld: 'Khi mất chìa khóa nhà: Việc đầu tiên là THAY Ổ KHÓA NGAY LẬP TỨC, chứ không phải đi tìm xóa ảnh chụp chìa khóa trước!',
          cicdEquivalent: 'Tình huống B3 Bước 1: Revoke & Rotate AWS Key / DB Password TRƯỚC khi chạy git-filter-repo',
          explanation: 'Bot tự động của tin tặc quét GitHub chỉ mất 3 giây để lấy khóa, nên phải vô hiệu hóa khóa trên IAM trước tiên.',
        },
        {
          realWorld: 'Trên đường ray vào ga (Production CD), không bao giờ được lật đổ đoàn tàu đang chạy dở (cancel-in-progress: false) mà phải xếp hàng ở đèn tín hiệu',
          cicdEquivalent: 'Tình huống B2: CI PR dùng cancel-in-progress: true | CD Prod dùng cancel-in-progress: false + resource_group',
          explanation: 'Bảo vệ trạng thái Terraform/Helm State Lock không bị hỏng và chống Commit cũ ghi đè Commit mới.',
        },
        {
          realWorld: 'Mã lỗi 137 = Bảo vệ tòa nhà (Linux OOM Killer) rút cầu dao (SIGKILL số 9: 128 + 9 = 137) vì phòng dùng quá tải điện (RAM)',
          cicdEquivalent: 'Tình huống B5 (#2): Exit code 137 (OOM Killer)',
          explanation: 'Nhìn thấy Exit code 137 là biết ngay tiến trình ngốn vượt trần RAM của Container.',
        },
      ],
      mentalModelTip:
        'Công thức nhớ nhanh mã thoát Linux: Exit code > 128 nghĩa là tiến trình bị giết bởi tín hiệu hệ điều hành (128 + Signal Number). Vì SIGKILL = 9 nên 128 + 9 = 137 (OOM Killer / Timeout Kill)!',
    },
    diagrams: [
      {
        id: 'diag-scenarios-b1-b7',
        title: 'Bản đồ Chẩn đoán Nhanh 7 Tình huống Thực chiến (B1 → B7)',
        subtitle: 'Bấm vào từng tình huống để xem Nguyên nhân gốc rễ và Giải pháp kỹ thuật bắt buộc',
        type: 'comparison-boxes',
        svgBlueprint: 'svg-zero-downtime-sigterm',
        nodes: [
          {
            id: 'sc-b1-b2',
            badge: 'Tình huống B1 & B2',
            title: 'Tối ưu 42p → 4p & Chống Ghi đè Deploy',
            subtitle: '6 Bước Tối ưu I/O-DAG & Khóa Concurrency',
            detail:
              'B1: Profiling → Cache pull-only + Dockerfile Layer Order → Multi-stage + .dockerignore → DAG + Sharding → Fail-Fast 15s → NVMe Runner. B2: Tách Concurrency CI (cancel: true) và CD (cancel: false + newest_first).',
            highlightColor: 'emerald',
          },
          {
            id: 'sc-b3-b4',
            badge: 'Tình huống B3 & B4',
            title: 'Ứng cứu Lộ Secret & Trị Flaky Tests',
            subtitle: 'Revoke First → git-filter-repo & Cô lập DB/UTC',
            detail:
              'B3: (1) Revoke & Rotate khóa ngay → (2) git-filter-repo + xóa CI Log → (3) Audit CloudTrail → (4) gitleaks pre-commit. B4: Quarantine 48h, cô lập DB bằng Testcontainers/Rollback, đặt TZ=UTC + waitFor().',
            highlightColor: 'rose',
          },
          {
            id: 'sc-b5-b6-b7',
            badge: 'Tình huống B5, B6 & B7',
            title: '5 Lỗi Local≠CI, AI Privacy & 502 K8s',
            subtitle: 'Case-sensitive • Exit 137 • arm64 • CRLF • preStop',
            detail:
              'B5: core.ignorecase false, Exit 137 OOM, arm64 vs amd64 (.dockerignore), CI=true --yes, .gitattributes eol=lf. B6: Self-hosted PR-Agent + profile chill. B7: preStop sleep 5 + SIGTERM server.close() + Exec Form.',
            highlightColor: 'sky',
          },
        ],
        caption: 'Phần II (PDF Trang 17–21): Bộ quy trình chuẩn xử lý các sự cố CI/CD thực tế.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L5-2-b2-concurrency-lock',
        title: 'Tình huống B2: Cấu hình Khóa Concurrency Chống Ghi đè Phiên bản trên GitHub Actions & GitLab CI (PDF Trang 18)',
        language: 'yaml',
        description:
          'Tách biệt hoàn toàn hành vi Concurrency giữa nhánh PR (Hủy bản cũ để tiết kiệm tài nguyên) và nhánh Production (Xếp hàng đợi an toàn, không hủy ngang, chỉ giữ bản mới nhất):',
        code: `# --- 1. GitHub Actions: Tách biệt Concurrency cho CI (Hủy bản cũ) và CD (Xếp hàng đợi an toàn) ---
jobs:
  ci_verify:
    concurrency:
      group: ci-\${{ github.workflow }}-\${{ github.ref }}
      cancel-in-progress: true # Nhánh PR: Hủy ngay lần test cũ nếu dev vừa push code mới
  cd_production:
    environment: production
    concurrency:
      group: production-deploy-lock
      cancel-in-progress: false # Production: Không hủy ngang; xếp hàng đợi tuần tự an toàn!

# --- 2. GitLab CI: Kết hợp resource_group với process_mode=newest_first ---
deploy_production:
  stage: deploy
  resource_group: production-cluster # Tự động bỏ qua các pipeline cũ đang chờ trong hàng đợi`,
        outputOrImpact: 'Loại bỏ 100% hiện tượng Out-of-order Deployment (Commit A cũ ghi đè lên Commit B mới) và bảo vệ an toàn cho Terraform/Helm State.',
        annotations: [
          { line: 6, explanation: 'Ở bước kiểm thử CI trên PR, bật cancel-in-progress: true để hủy ngay các lần chạy thừa.' },
          { line: 11, explanation: 'Ở bước CD Production, bắt buộc đặt cancel-in-progress: false để không ngắt ngang khi đang rollout.' },
          { line: 16, explanation: 'Trên GitLab CI, resource_group với process_mode=newest_first chỉ cho phép bản mới nhất trong hàng đợi được chạy tiếp.' },
        ],
      },
      {
        id: 'code-L5-2-b5-local-vs-ci-fixes',
        title: 'Tình huống B5: Bộ Cấu hình Khắc phục Triệt để 5 Lỗi "Works on Local, Fails on CI" (PDF Trang 20)',
        language: 'bash',
        description:
          '5 cấu hình chuẩn để đồng nhất môi trường giữa máy cá nhân (macOS Apple Silicon / Windows) và CI Runner (Linux amd64):',
        code: `# [Lỗi 1] Module not found (UserSvc.ts vs usersvc.ts): Ép Git phân biệt chữ Hoa - Thường trên macOS/Windows
git config core.ignorecase false

# [Lỗi 2] Tiến trình tự ngắt với Exit code 137 (128 + 9 SIGKILL do Linux OOM Killer): Giới hạn Heap RAM cho Node.js
export NODE_OPTIONS="--max-old-space-size=3072"

# [Lỗi 3] Exec format error (Mac arm64 nhị phân lọt vào Linux amd64): Tạo file .dockerignore loại bỏ node_modules
echo -e ".git\nnode_modules\ncoverage\ndist" > .dockerignore

# [Lỗi 4] Job đứng im đến khi Timeout (Chờ nhập phím [Y/n] TTY): Luôn bật CI=true và cờ --non-interactive
CI=true npx prisma migrate deploy --non-interactive

# [Lỗi 5] Lỗi /bin/sh^M: bad interpreter (Ký tự xuống dòng CRLF của Windows): Tạo file .gitattributes ở thư mục gốc
echo "*.sh text eol=lf" > .gitattributes`,
        outputOrImpact: 'Chấm dứt hoàn toàn 5 căn bệnh kinh điển khiến code chạy tốt ở máy cá nhân nhưng gãy trên CI.',
        annotations: [
          { line: 2, explanation: 'Bắt Git nhận diện ngay việc đổi tên file từ usersvc.ts sang UserSvc.ts trên macOS/Windows.' },
          { line: 5, explanation: 'Ngăn Node.js vượt trần RAM của Container dẫn đến bị Linux Kernel OOM Killer giết bằng SIGKILL (137).' },
          { line: 14, explanation: '*.sh text eol=lf ép Git luôn chuyển đổi mọi file script .sh về chuẩn xuống dòng LF của Unix.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Xử lý Hàng đợi Triển khai khi Nhiều PR Merge Liên tiếp (Tình huống B2)',
        githubActionsWay: 'Khi đặt concurrency: { group: prod-lock, cancel-in-progress: false }, GitHub giữ tối đa 1 job đang chạy + 1 job mới nhất trong hàng đợi (tự động hủy các job trung gian đang chờ).',
        gitlabCiWay: 'Dùng resource_group: prod-cluster kết hợp cấu hình process_mode: newest_first qua GitLab API/UI.',
        architecturalNote: 'Cả hai nền tảng đều giải quyết rất thông minh: không hủy ngang bản đang chạy dở, nhưng tự động nhảy cóc qua các bản cũ đang xếp hàng để chạy bản mới nhất.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L5-2-git-rm-secret',
        title: 'Tưởng rằng chạy git rm .env && git commit -m "remove secret" là đã xóa được mật khẩu bị lộ',
        severity: 'critical',
        symptom: 'Sau khi xóa file chứa AWS Secret Key ở commit mới, tài khoản AWS của công ty vẫn bị tin tặc chiếm quyền tạo máy chủ đào tiền ảo!',
        whyItHappens: 'Git là hệ thống lưu trữ theo lịch sử bất biến. Lệnh git rm chỉ xóa file ở trạng thái HEAD hiện tại, còn toàn bộ nội dung mật khẩu vẫn nằm nguyên vẹn trong thư mục .git/objects của commit liền trước (chỉ cần gõ git log -p là thấy)!',
        wrongConfig: `git rm config/secrets.json
git commit -m "fix: remove accidental secret"
git push`,
        rightConfig: `# BƯỚC 1 (QUAN TRỌNG NHẤT): Lập tức Vô hiệu hóa & Xoay vòng khóa trên AWS IAM / Đổi mật khẩu DB!
# BƯỚC 2: Dùng git-filter-repo xóa vĩnh viễn blob khỏi toàn bộ lịch sử và ép ghi đè:
git filter-repo --path config/secrets.json --invert-paths
git push --force --all`,
        fixExplanation: 'Tình huống B3 (PDF Trang 19): Coi mọi thông tin nhạy cảm đã chạm vào Git là đã bị lộ hoàn toàn — phải Revoke & Rotate khóa đầu tiên trước khi dọn dẹp Git!',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L5-2-b1',
        title: 'Kết quả Tối ưu Hóa Tình huống B1: Từ 42 Phút Xuống Dưới 6 Phút',
        claim: 'Áp dụng đồng bộ 6 bước chẩn đoán và tối ưu trong Tình huống B1 giúp giảm gần 90% thời gian chạy Pipeline.',
        methodology: 'Đối chiếu từng công đoạn trước và sau khi tối ưu (Tình huống B1 — PDF Trang 17–18).',
        metrics: [
          {
            label: 'Sau tối ưu (Cache pull-only + Layer Cache + DAG + 6x Shards)',
            valueText: '4 phút 50 giây (Giảm 88%)',
            barPercent: 95,
            isOptimal: true,
            note: 'Lint 15s → 6x Test Shards 2p30s → Multi-stage Docker 1p → Deploy 1p.',
          },
          {
            label: 'Trước tối ưu (Chạy tuần tự + Không Cache + Image 1.2GB)',
            valueText: '42 phút 00 giây',
            barPercent: 12,
            isOptimal: false,
            note: 'Tải thư viện 8p + Test đơn luồng 24p + Build & Push 1.2GB Image 10p.',
          },
        ],
        takeaway: 'Mọi Pipeline chậm đều có thể được đưa về dưới 6 phút nếu bóc tách đúng điểm nghẽn I/O, Layer Cache và Parallelism.',
      },
    ],
    bestPractices: [
      'Luôn cài đặt pre-commit hook chạy gitleaks protect --staged ngay trên máy lập trình viên để chặn lộ Secret trước khi commit được tạo.',
      'Khi phát hiện Flaky Test, lập tức cách ly (Quarantine) sang một Suite riêng và bắt buộc sửa dứt điểm trong 48 giờ, không để làm mất niềm tin vào nhánh main.',
    ],
    relatedSimulators: [
      {
        label: 'Vào Phòng Mô phỏng Xử lý Sự cố Thực chiến (War-Room B1–B7)',
        targetTab: 'warroom',
      },
    ],
  },
];

import { PracticeExercise } from '../types/kube.types';

export const PRACTICE_EXERCISES: PracticeExercise[] = [
  {
    id: 'prac-1-dockerfile',
    stageId: 'stage-1',
    level: 'basic',
    category: 'dockerfile',
    title: 'Bài tập 1: Tối ưu Dockerfile Multi-stage (<100MB), Khóa Layer Cache & Hạ quyền Non-Root',
    scenario: 'Dự án Node.js/TypeScript của công ty đang dùng một Dockerfile sơ sài nặng 920MB, mỗi lần sửa 1 dòng code đều mất 6 phút tải lại npm install và chạy dưới quyền root nguy hiểm. Hãy viết lại Dockerfile chuẩn sản xuất 2 giai đoạn (Multi-stage Build).',
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
    solutionCode: `FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --production

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

USER node

COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/package.json ./

EXPOSE 3000
CMD ["node", "dist/server.js"]`,
    hints: [
      'Đặt dòng COPY package.json package-lock.json ./ ngay phía trên dòng RUN npm ci.',
      'Ở Stage 2 (runner), thêm dòng USER node và dùng COPY --from=builder /usr/src/app/dist ./dist.',
    ],
    validationRules: [
      {
        id: 'rule-cache',
        description: 'Tách riêng COPY package.json và RUN npm ci để khóa bộ nhớ đệm Layer Cache',
        mustContain: ['COPY package.json', 'RUN npm ci'],
      },
      {
        id: 'rule-multistage',
        description: 'Sử dụng Multi-stage Build (AS builder, AS runner và COPY --from=builder)',
        mustContain: ['AS builder', 'AS runner', 'COPY --from=builder'],
      },
      {
        id: 'rule-nonroot',
        description: 'Hạ quyền bảo mật từ root xuống tài khoản thường bằng USER node',
        mustContain: ['USER node'],
      },
    ],
  },

  {
    id: 'prac-2-compose',
    stageId: 'stage-1',
    level: 'basic',
    category: 'compose',
    title: 'Bài tập 2: Viết docker-compose.yml Bật Cùng Lúc Web + PostgreSQL + Redis Có Két Sắt Volume',
    scenario: 'Thiết lập môi trường phát triển Local gồm 3 Container: backend-api (mở cổng 8080:3000), postgres-db (lưu dữ liệu bền vững vào két sắt Volume pgdata) và redis-cache, kết nối chung trong mạng nội bộ shop-network.',
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
    ports:
      - "8080:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres-db
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
    volumes:
      - pgdata:/var/lib/postgresql/data
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
    hints: [
      'Cú pháp ánh xạ cổng là "8080:3000" (Cổng máy thật : Cổng Container).',
      'Cú pháp gắn Volume cho Postgres là pgdata:/var/lib/postgresql/data.',
    ],
    validationRules: [
      {
        id: 'rule-ports',
        description: 'Ánh xạ cổng 8080 máy thật vào cổng 3000 của Container ("8080:3000")',
        mustContain: ['8080:3000'],
      },
      {
        id: 'rule-dns',
        description: 'Gọi trực tiếp tên service DB_HOST=postgres-db qua DNS nội bộ',
        mustContain: ['DB_HOST=postgres-db'],
      },
      {
        id: 'rule-volume',
        description: 'Bảo toàn dữ liệu Postgres bằng Volume pgdata:/var/lib/postgresql/data',
        mustContain: ['pgdata:/var/lib/postgresql/data'],
      },
    ],
  },

  {
    id: 'prac-3-k8s-deployment',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'k8s-core',
    title: 'Bài tập 3: Viết Bộ Manifest K8s Chuẩn Thực Chiến (Deployment + RollingUpdate + Service)',
    scenario: 'Chuyển đổi ứng dụng shop-web lên cụm Kubernetes ở namespace production với 3 bản sao Pod, nâng cấp cuốn chiếu Zero-Downtime (maxSurge: 1, maxUnavailable: 0) và nối vào Tổng đài Service cổng 80 → targetPort 3000.',
    requirements: [
      'Khai báo replicas: 3 và chiến lược RollingUpdate với maxSurge: 1, maxUnavailable: 0',
      'Đảm bảo nhãn app: shop-web khớp hoàn toàn ở cả 3 nơi: matchLabels, template.metadata.labels và Service selector',
      'Tiêm cấu hình từ ConfigMap tên là web-app-config thông qua envFrom.configMapRef',
      'Cấu hình Service mở port: 80 và chuyển tiếp vào targetPort: 3000',
    ],
    filename: 'k8s-production-manifest.yaml',
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
    - port: 80
      targetPort: 3000`,
    hints: [
      'Điền app: shop-web vào cả template.metadata.labels và spec.selector của Service.',
      'Điền targetPort: 3000 để khớp với containerPort: 3000 của Pod.',
    ],
    validationRules: [
      {
        id: 'rule-rolling',
        description: 'Khai báo replicas: 3, maxSurge: 1 và maxUnavailable: 0',
        mustContain: ['replicas: 3', 'maxSurge: 1', 'maxUnavailable: 0'],
      },
      {
        id: 'rule-labels',
        description: 'Đồng bộ nhãn app: shop-web không còn chỗ trống ____',
        mustContain: ['app: shop-web', 'name: web-app-config'],
        mustNotContain: ['____'],
      },
      {
        id: 'rule-targetport',
        description: 'Cấu hình Tổng đài Service chuyển tiếp port: 80 vào targetPort: 3000',
        mustContain: ['port: 80', 'targetPort: 3000'],
      },
    ],
  },

  {
    id: 'prac-4-probes-hpa',
    stageId: 'stage-3',
    level: 'master',
    category: 'k8s-enterprise',
    title: 'Bài tập 4: Thiết lập Định mức Tài nguyên (Requests/Limits), Bác sĩ trực Probes & Co giãn HPA',
    scenario: 'Chuẩn bị cho chiến dịch khuyến mãi 0h00: Hãy cấu hình hợp đồng điện nước (requests/limits), bài kiểm tra sẵn sàng tiếp khách (readinessProbe), bắt mạch sống chết (livenessProbe) và HPA tự nhân bản từ 2 lên 20 Pod khi CPU vượt 70%.',
    requirements: [
      'Khai báo resources.requests (cpu: "250m", memory: "256Mi") và limits (cpu: "500m", memory: "512Mi")',
      'Cấu hình readinessProbe và livenessProbe kiểm tra cổng 3000',
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
    solutionCode: `          resources:
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
      'Điền memory: "512Mi" vào mục limits.',
      'Điền maxReplicas: 20 và averageUtilization: 70 vào khối HorizontalPodAutoscaler.',
    ],
    validationRules: [
      {
        id: 'rule-resources',
        description: 'Khai báo đầy đủ requests (256Mi) và limits (512Mi)',
        mustContain: ['256Mi', '512Mi'],
      },
      {
        id: 'rule-probes',
        description: 'Thiết lập cả readinessProbe và livenessProbe ở cổng 3000',
        mustContain: ['readinessProbe', 'livenessProbe'],
      },
      {
        id: 'rule-hpa',
        description: 'Cấu hình HPA minReplicas: 2, maxReplicas: 20 và averageUtilization: 70',
        mustContain: ['minReplicas: 2', 'maxReplicas: 20', 'averageUtilization: 70'],
      },
    ],
  },
];

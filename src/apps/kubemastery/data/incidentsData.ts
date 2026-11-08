import { IncidentScenario } from '../types/kube.types';

export const INCIDENT_SCENARIOS: IncidentScenario[] = [
  {
    id: 'incident-1-local-docker',
    number: 1,
    title: 'Sự cố 1: Docker Build mất 10 phút do vỡ Layer Cache & Chạy quyền Root',
    statusBadge: 'Cache Miss + Root Risk',
    severity: 'P2 - Medium',
    alertMessage: 'Đội lập trình viên phản ánh mỗi lần sửa 1 dòng code nhỏ và gõ docker build đều mất 8–10 phút tải lại npm install, đồng thời Image nặng 890MB và chạy quyền root.',
    essenceOfProblem: 'Đặt câu lệnh COPY . . phía trên lệnh cài thư viện (RUN npm ci) trong Dockerfile làm vỡ hoàn toàn Layer Cache mỗi khi sửa code, và thiếu hạ quyền USER node.',
    symptoms: [
      'Gõ lệnh docker build mất 8–10 phút mỗi lần dù chỉ sửa 1 dấu chấm trong file code JS/TS.',
      'Gõ docker run -p 3000:3000 báo lỗi: Bind for 0.0.0.0:3000 failed: port is already allocated.',
      'Trên Linux báo lỗi: permission denied while trying to connect to the Docker daemon socket.',
    ],
    diagnosticSteps: [
      {
        stepOrder: 1,
        stepTitle: 'Bước 1: Quan sát tiến trình Docker Build & Các container đang chiếm cổng',
        command: 'docker ps -a && docker build -t shop-api:v1.0 .',
        terminalOutput: `CONTAINER ID   IMAGE          COMMAND                  STATUS         PORTS                    NAMES
a91c34f82e10   redis:alpine   "docker-entrypoint.s…"   Up 2 hours     0.0.0.0:3000->6379/tcp   old-test-container

[+] Building 412.8s (8/8) FINISHED
 => [1/4] FROM docker.io/library/node:20-alpine                                    0.0s
 => [2/4] WORKDIR /usr/src/app                                                     0.0s
 => [3/4] COPY . .                                                                 1.2s
 => [4/4] RUN npm ci   # <-- [CẢNH BÁO: CACHE MISS! Phải tải lại 280MB thư viện]  411.6s`,
        clueExplanation: 'Nhìn vào bước [3/4] COPY . . nằm trước [4/4] RUN npm ci khiến bộ nhớ đệm Cache của bước cài thư viện bị hủy sạch!',
      },
      {
        stepOrder: 2,
        stepTitle: 'Bước 2: Kiểm tra kích thước các tầng bánh (Layers) và tài khoản chạy trong Image',
        command: 'docker history shop-api:v1.0 && docker run --rm shop-api:v1.0 whoami',
        terminalOutput: `IMAGE          CREATED          CREATED BY                                      SIZE
f48a9c12b031   10 seconds ago   CMD ["node" "dist/server.js"]                   0B
91c82a71d402   12 seconds ago   RUN npm ci                                      315MB
23b10d84e119   7 minutes ago    COPY . .                                        42MB
root   # <-- [NGUY HIỂM: Container đang chạy dưới quyền tối cao root!]`,
        clueExplanation: 'Container đang chạy dưới quyền root (nếu bị tấn công hacker sẽ chiếm quyền máy chủ) và chưa tách riêng bước COPY package.json.',
      },
      {
        stepOrder: 3,
        stepTitle: 'Bước 3: Kiểm tra lỗi xung đột cổng 3000 trên máy thật',
        command: 'docker run -d -p 3000:3000 --name web shop-api:v1.0',
        terminalOutput: `docker: Error response from daemon: driver failed programming external connectivity on endpoint web:
Bind for 0.0.0.0:3000 failed: port is already allocated.`,
        clueExplanation: 'Cổng 3000 trên máy thật đang bị container old-test-container chiếm giữ. Cần tắt container cũ hoặc đổi sang -p 8080:3000.',
      },
      {
        stepOrder: 4,
        stepTitle: 'Bước 4: Kiểm tra quyền truy cập Docker Socket trên Linux',
        command: 'groups $USER',
        terminalOutput: `skyline : skyline adm cdrom sudo dip plugdev
# Nếu thiếu nhóm 'docker', chạy: sudo usermod -aG docker $USER (rồi đăng xuất/đăng nhập lại)`,
        clueExplanation: 'Tối ưu lại Dockerfile bằng cách đưa COPY package.json package-lock.json ./ lên trước RUN npm ci và thêm USER node.',
      },
    ],
    rootCausesAndSolutions: [
      {
        causeTitle: '1. Build chậm do vỡ Layer Cache',
        detail: 'Đặt lệnh COPY . . phía trên lệnh cài thư viện làm mất Cache mỗi khi sửa code. Hãy tách bước COPY package.json package-lock.json ./ lên trước RUN npm ci.',
        fixCommandOrCode: 'COPY package.json package-lock.json ./\nRUN npm ci\nCOPY . .',
      },
      {
        causeTitle: '2. Xung đột cổng (Port allocated) & Quyền root',
        detail: 'Dùng docker ps tìm container chiếm cổng để tắt đi hoặc đổi cổng ngoài (-p 8080:3000), đồng thời bổ sung USER node vào Dockerfile.',
        fixCommandOrCode: 'USER node',
      },
    ],
    configFileName: 'Dockerfile',
    brokenConfig: `FROM node:20-alpine
WORKDIR /usr/src/app

# SAI LẦM 1: Copy toàn bộ mã nguồn ngay ở đầu làm vỡ Cache của bước npm ci!
COPY . .
RUN npm ci
RUN npm run build

# SAI LẦM 2: Để mặc định quyền quản trị tối cao 'root' (thiếu lệnh USER node)
EXPOSE 3000
CMD ["node", "dist/server.js"]`,
    fixedConfig: `FROM node:20-alpine
WORKDIR /usr/src/app

# CHUẨN HÓA 1: Chỉ copy riêng file khai báo thư viện trước để khóa Layer Cache
COPY package.json package-lock.json ./
RUN npm ci

# Sau khi thư viện đã khóa vào Cache mới copy mã nguồn
COPY . .
RUN npm run build

# CHUẨN HÓA 2: Hạ quyền xuống tài khoản thường 'node'
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]`,
    requiredSnippets: ['COPY package.json', 'RUN npm ci', 'COPY . .', 'USER node'],
    verificationSuccessLog: `[+] Building 1.8s (9/9) FINISHED
 => [2/5] WORKDIR /usr/src/app                                        0.0s
 => [3/5] COPY package.json package-lock.json ./                      0.0s
 => [4/5] RUN npm ci                                                  0.0s (CACHED 100%!)
 => [5/5] COPY . .                                                    0.4s
 => [6/6] USER node                                                   0.0s
✓ Thành công! Thời gian build giảm từ 412s xuống 1.8s nhờ Layer Cache & đã hạ quyền USER node an toàn!`,
  },

  {
    id: 'incident-2-imagepullbackoff',
    number: 2,
    title: 'Sự cố 2: Pod bị kẹt ở trạng thái ImagePullBackOff / ErrImagePull',
    statusBadge: 'ImagePullBackOff',
    severity: 'P1 - High',
    alertMessage: 'Vừa triển khai bản cập nhật thanh toán lên cụm Production nhưng cả 3 Pod mới đều kẹt cứng ở trạng thái ImagePullBackOff!',
    essenceOfProblem: 'Người công nhân Containerd trên máy chủ Worker không thể tải được "File .zip" (Docker Image) từ kho chứa trên mạng (Registry) về máy do gõ sai Tag hoặc thiếu phong bì mật khẩu imagePullSecrets.',
    symptoms: [
      'Cột STATUS khi gõ kubectl get pods hiển thị ErrImagePull rồi chuyển sang ImagePullBackOff.',
      'Pod không thể khởi tạo được bất kỳ container nào (READY 0/1).',
    ],
    diagnosticSteps: [
      {
        stepOrder: 1,
        stepTitle: 'Bước 1 — Quan sát trạng thái tổng thể (Nhìn sắc diện)',
        command: 'kubectl get pods -n production -o wide',
        terminalOutput: `NAME                                  READY   STATUS             RESTARTS   AGE   IP            NODE
shop-payment-deploy-6b8f9d4c2-9x2la   0/1     ImagePullBackOff   0          3m    10.244.1.45   worker-node-1
shop-payment-deploy-6b8f9d4c2-k41mp   0/1     ErrImagePull       0          3m    10.244.2.19   worker-node-2`,
        clueExplanation: 'Cột STATUS báo rõ ErrImagePull và ImagePullBackOff. Tiến trình đang kẹt ngay ở bước tải file .zip Image về máy chủ.',
      },
      {
        stepOrder: 2,
        stepTitle: 'Bước 2 — Đọc hồ sơ bệnh án hệ thống (Events)',
        command: 'kubectl describe pod shop-payment-deploy-6b8f9d4c2-9x2la -n production',
        terminalOutput: `Events:
  Type     Reason     Age                  From               Message
  ----     ------     ----                 ----               -------
  Normal   Scheduled  3m10s                default-scheduler  Successfully assigned production/shop-payment-deploy-6b8f9d4c2-9x2la to worker-node-1
  Normal   Pulling    95s (x4 over 3m8s)   kubelet            Pulling image "myregistry.io/shop-payment:v1.5.0"
  Warning  Failed     94s (x4 over 3m7s)   kubelet            Failed to pull image "myregistry.io/shop-payment:v1.5.0": rpc error: code = Unknown desc = failed to pull and unpack image: manifest for myregistry.io/shop-payment:v1.5.0 not found & unauthorized: authentication required
  Warning  Failed     80s (x6 over 3m6s)   kubelet            Error: ImagePullBackOff`,
        clueExplanation: 'Mục Events chỉ rõ 2 lỗi: Bản v1.5.0 chưa tồn tại trên kho (trên kho mới đẩy bản v1.4.0) VÀ kho Private Registry yêu cầu mật khẩu (unauthorized: authentication required)!',
      },
      {
        stepOrder: 3,
        stepTitle: 'Bước 3 — Kiểm tra phong bì mật khẩu Registry Secret trong Namespace',
        command: 'kubectl get secrets -n production',
        terminalOutput: `NAME                  TYPE                                  DATA   AGE
regcred               kubernetes.io/dockerconfigjson        1      15d`,
        clueExplanation: 'Phong bì mật khẩu "regcred" đã có sẵn trong namespace production, nhưng trong file YAML của Deployment đã quên khai báo imagePullSecrets: [{name: regcred}]!',
      },
      {
        stepOrder: 4,
        stepTitle: 'Bước 4 — Sửa lại đúng Tag v1.4.0 và gắn imagePullSecrets: regcred',
        command: 'kubectl apply -f payment-deployment.yaml',
        terminalOutput: `Hãy sửa image thành myregistry.io/shop-payment:v1.4.0 và bổ sung imagePullSecrets: - name: regcred ở khung soạn thảo bên phải!`,
        clueExplanation: 'Sửa cả 2 nguyên nhân trong file YAML để Containerd tải được Image thành công.',
      },
    ],
    rootCausesAndSolutions: [
      {
        causeTitle: '1. Gõ sai tên Image hoặc Tag phiên bản',
        detail: 'Khai báo shop-payment:v1.5.0 trong YAML nhưng trên Registry mới chỉ đẩy lên bản v1.4.0.',
        fixCommandOrCode: 'image: myregistry.io/shop-payment:v1.4.0',
      },
      {
        causeTitle: '2. Kho chứa Image ở chế độ Riêng tư (Private Registry) thiếu Secret',
        detail: 'Cần khai báo mục imagePullSecrets: [{name: regcred}] vào trong spec của Pod.',
        fixCommandOrCode: 'imagePullSecrets:\n  - name: regcred',
      },
    ],
    configFileName: 'payment-deployment.yaml',
    brokenConfig: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-payment-deploy
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: shop-payment
  template:
    metadata:
      labels:
        app: shop-payment
    spec:
      # LỖI 1: Quên khai báo imagePullSecrets để mở khóa kho Private Registry (regcred)
      containers:
        - name: payment-container
          # LỖI 2: Gõ nhầm tag v1.5.0 (trên kho chỉ mới có bản v1.4.0)
          image: myregistry.io/shop-payment:v1.5.0
          ports:
            - containerPort: 3000`,
    fixedConfig: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-payment-deploy
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: shop-payment
  template:
    metadata:
      labels:
        app: shop-payment
    spec:
      imagePullSecrets:
        - name: regcred
      containers:
        - name: payment-container
          image: myregistry.io/shop-payment:v1.4.0
          ports:
            - containerPort: 3000`,
    requiredSnippets: ['myregistry.io/shop-payment:v1.4.0', 'imagePullSecrets', 'regcred'],
    forbiddenSnippets: ['v1.5.0'],
    verificationSuccessLog: `Events:
  Normal   Pulling    2s   kubelet   Pulling image "myregistry.io/shop-payment:v1.4.0" using secret "regcred"
  Normal   Pulled     1s   kubelet   Successfully pulled image "myregistry.io/shop-payment:v1.4.0" in 1.1s
  Normal   Created    1s   kubelet   Created container payment-container
  Normal   Started    0s   kubelet   Started container payment-container
✓ Cả 2 Pod shop-payment đã chuyển sang trạng thái 1/1 Running!`,
  },

  {
    id: 'incident-3-crashloop',
    number: 3,
    title: 'Sự cố 3: Pod bị lặp vòng sập liên tục — CrashLoopBackOff',
    statusBadge: 'CrashLoopBackOff',
    severity: 'P0 - Critical',
    alertMessage: 'Pod đơn hàng (order-service) tải được Image về nhưng cứ bật lên vài giây là tự sập, cột RESTARTS đã tăng lên 12 lần!',
    essenceOfProblem: 'K8s đã giải nén thành Container và bấm nút khởi chạy, nhưng tiến trình chính bên trong bị lỗi thoát ra (Exit) do thiếu biến môi trường DATABASE_URL VÀ cấu hình Liveness Probe quá gắt (kiểm tra ở giây thứ 3 khi app cần 20 giây khởi động).',
    symptoms: [
      'Trạng thái báo CrashLoopBackOff, cột RESTARTS tăng dần (1, 2, 5, 12...).',
      'K8s cố gắng cứu bằng cách khởi động lại liên tục nhưng cứ bật lên là lại sập.',
    ],
    diagnosticSteps: [
      {
        stepOrder: 1,
        stepTitle: 'Bước 1 — Quan sát trạng thái tổng thể & Số lần RESTARTS',
        command: 'kubectl get pods -n production',
        terminalOutput: `NAME                                READY   STATUS             RESTARTS        AGE
order-service-deploy-84c9d7-m29xp   0/1     CrashLoopBackOff   12 (42s ago)    14m`,
        clueExplanation: 'Cột STATUS báo CrashLoopBackOff và RESTARTS = 12. Container đã bật lên được nhưng tự chết bên trong.',
      },
      {
        stepOrder: 2,
        stepTitle: 'Bước 2 — Đọc hồ sơ bệnh án hệ thống (Events)',
        command: 'kubectl describe pod order-service-deploy-84c9d7-m29xp -n production',
        terminalOutput: `Events:
  Warning  Unhealthy  2m (x12 over 14m)  kubelet  Liveness probe failed: Get "http://10.244.1.88:3000/healthz": dial tcp 10.244.1.88:3000: connect: connection refused
  Normal   Killing    2m (x12 over 14m)  kubelet  Container order-api failed liveness probe, will be restarted
  Warning  BackOff    15s (x45 over 12m) kubelet  Back-off restarting failed container`,
        clueExplanation: 'Liveness probe đang kiểm tra quá sớm (initialDelaySeconds: 2) và giết Pod trước khi nó kịp mở mắt!',
      },
      {
        stepOrder: 3,
        stepTitle: 'Bước 3 — Đọc lời trăn trối cuối cùng của ứng dụng (logs --previous)',
        command: 'kubectl logs order-service-deploy-84c9d7-m29xp -n production --previous',
        terminalOutput: `[2026-11-08T15:10:02Z] INFO  Starting Order Service v2.1...
[2026-11-08T15:10:03Z] FATAL Error: Missing required environment variable DATABASE_URL!
    at loadConfig (/usr/src/app/dist/config.js:18:11)
    at main (/usr/src/app/dist/server.js:9:5)
Process exited with code 1`,
        clueExplanation: 'Lời trăn trối chỉ rõ: Ứng dụng tìm biến môi trường DATABASE_URL không thấy nên tự ném Fatal Error và thoát với Exit Code 1!',
      },
      {
        stepOrder: 4,
        stepTitle: 'Bước 4 — Bổ sung biến DATABASE_URL và nới giãn initialDelaySeconds lên 25s',
        command: 'kubectl apply -f order-deployment.yaml',
        terminalOutput: `Hãy thêm biến DATABASE_URL vào mục env và tăng initialDelaySeconds của livenessProbe từ 2 lên 25 ở khung YAML bên phải!`,
        clueExplanation: 'Khắc phục đồng thời lỗi thiếu biến môi trường DB và nới thời gian chờ khởi động cho Liveness Probe.',
      },
    ],
    rootCausesAndSolutions: [
      {
        causeTitle: '1. Thiếu biến môi trường DATABASE_URL lúc khởi động',
        detail: 'Ứng dụng gọi vào biến DATABASE_URL không thấy nên ném Exception và dừng chương trình.',
        fixCommandOrCode: '- name: DATABASE_URL\n  value: "postgres://admin:secret@postgres-db:5432/shopdb"',
      },
      {
        causeTitle: '2. Cấu hình Liveness Probe quá gắt',
        detail: 'Ứng dụng cần 15–20 giây khởi động nhưng livenessProbe kiểm tra ngay ở giây thứ 2. Tăng initialDelaySeconds lên 25.',
        fixCommandOrCode: 'initialDelaySeconds: 25',
      },
    ],
    configFileName: 'order-deployment.yaml',
    brokenConfig: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-deploy
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
        - name: order-api
          image: myregistry.io/order-service:v2.1.0
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            # LỖI 1: Thiếu khai báo biến môi trường DATABASE_URL
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3000
            # LỖI 2: Kiểm tra quá sớm ở giây thứ 2 khiến K8s giết Pod khi đang khởi động!
            initialDelaySeconds: 2
            periodSeconds: 10`,
    fixedConfig: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-deploy
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
        - name: order-api
          image: myregistry.io/order-service:v2.1.0
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              value: "postgres://admin:secret@postgres-db:5432/shopdb"
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3000
            initialDelaySeconds: 25
            periodSeconds: 10`,
    requiredSnippets: ['DATABASE_URL', 'initialDelaySeconds: 25'],
    forbiddenSnippets: ['initialDelaySeconds: 2\n'],
    verificationSuccessLog: `[2026-11-08T15:14:00Z] INFO  Starting Order Service v2.1...
[2026-11-08T15:14:04Z] INFO  Connected to PostgreSQL at postgres-db:5432/shopdb
[2026-11-08T15:14:05Z] INFO  HTTP Server listening on 0.0.0.0:3000
✓ Liveness Probe /healthz trả về 200 OK! Pod order-service-deploy đạt trạng thái 1/1 Running (0 Restarts)!`,
  },

  {
    id: 'incident-4-oomkilled',
    number: 4,
    title: 'Sự cố 4: Container bị tiêu diệt đột ngột do tràn bộ nhớ — OOMKilled (Exit Code 137)',
    statusBadge: 'OOMKilled (Exit 137)',
    severity: 'P0 - Critical',
    alertMessage: 'Dịch vụ xuất báo cáo PDF/Java (report-worker) cứ chạy được vài phút là đột ngột tắt phụp và khởi động lại mà trong log ứng dụng không hề có dòng báo lỗi nào!',
    essenceOfProblem: 'Ứng dụng bên trong Container tiêu thụ lượng RAM vượt quá mức trần cho phép (resources.limits.memory: 128Mi) đã ký hợp đồng trong YAML. Để bảo vệ máy chủ Worker, nhân Linux kích hoạt OOM Killer bắn hạ tiến trình ngay tức khắc với mã thoát 137.',
    symptoms: [
      'Số lần RESTARTS tăng lên hoặc báo CrashLoopBackOff nhưng đọc kubectl logs không thấy lỗi code.',
      'Khi gõ kubectl describe pod, mục Last State: Terminated ghi rõ Reason: OOMKilled và Exit Code: 137.',
    ],
    diagnosticSteps: [
      {
        stepOrder: 1,
        stepTitle: 'Bước 1 — Quan sát trạng thái Pod và lượng RAM tiêu thụ thực tế',
        command: 'kubectl get pods -n production && kubectl top pods -n production',
        terminalOutput: `NAME                             READY   STATUS    RESTARTS      AGE
report-worker-5f7b9c6d4-v82jk    1/1     Running   6 (18s ago)   22m

NAME                             CPU(cores)   MEMORY(bytes)
report-worker-5f7b9c6d4-v82jk    180m         126Mi   # <-- Sát mức trần 128Mi!`,
        clueExplanation: 'Pod vừa bị khởi động lại 6 lần và mức RAM đang chạm sát trần 128Mi.',
      },
      {
        stepOrder: 2,
        stepTitle: 'Bước 2 — Đọc hồ sơ bệnh án tìm mục Last State: Terminated',
        command: 'kubectl describe pod report-worker-5f7b9c6d4-v82jk -n production',
        terminalOutput: `Containers:
  report-worker:
    Image:          myregistry.io/report-worker:v1.0.0
    State:          Running
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Sun, 08 Nov 2026 22:10:00 +0700
      Finished:     Sun, 08 Nov 2026 22:13:12 +0700`,
        clueExplanation: 'Bằng chứng thép: Reason: OOMKilled kèm Exit Code: 137 (128 + 9 SIGKILL). Nhân Linux đã bắn hạ container vì vượt trần RAM!',
      },
      {
        stepOrder: 3,
        stepTitle: 'Bước 3 — Kiểm tra nhật ký trước khi chết (logs --previous)',
        command: 'kubectl logs report-worker-5f7b9c6d4-v82jk -n production --previous',
        terminalOutput: `[INFO] Generating monthly invoice PDF batch (350MB memory required)...
# Bị ngắt đột ngột không kịp in dòng lỗi vì bị SIGKILL (9) từ nhân Linux!`,
        clueExplanation: 'Bản thân tác vụ xử lý PDF/JVM cần tối thiểu 350–512MB RAM để vận hành bình thường nhưng bạn chỉ cấp limits.memory: 128Mi quá keo kiệt.',
      },
      {
        stepOrder: 4,
        stepTitle: 'Bước 4 — Nâng định mức requests.memory lên 256Mi và limits.memory lên 512Mi',
        command: 'kubectl apply -f report-worker-deployment.yaml',
        terminalOutput: `Hãy nâng resources.requests.memory lên "256Mi" và resources.limits.memory lên "512Mi" ở khung YAML bên phải!`,
        clueExplanation: 'Cung cấp mức trần RAM hợp lý (512Mi) để ứng dụng không bị OOM Killer tiêu diệt.',
      },
    ],
    rootCausesAndSolutions: [
      {
        causeTitle: '1. Đặt mức trần (Limits) quá keo kiệt',
        detail: 'Ứng dụng cần tối thiểu 350–512MB RAM để vận hành bình thường nhưng chỉ cấp limits.memory: 128Mi. Hãy nâng Limit trong YAML lên 512Mi.',
        fixCommandOrCode: 'limits:\n  memory: "512Mi"',
      },
      {
        causeTitle: '2. Rò rỉ bộ nhớ trong mã nguồn (Memory Leak)',
        detail: 'Nếu nâng lên 1Gi–2Gi mà RAM vẫn phình to không giảm, hãy dùng kubectl top pods theo dõi và phối hợp lập trình viên rà soát code.',
        fixCommandOrCode: 'kubectl top pods -n production',
      },
    ],
    configFileName: 'report-worker-deployment.yaml',
    brokenConfig: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: report-worker
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: report-worker
  template:
    metadata:
      labels:
        app: report-worker
    spec:
      containers:
        - name: report-worker
          image: myregistry.io/report-worker:v1.0.0
          resources:
            requests:
              cpu: "100m"
              memory: "64Mi"
            limits:
              cpu: "500m"
              # LỖI: Trần RAM 128Mi quá keo kiệt khiến tiến trình bị OOMKilled (Exit Code 137)!
              memory: "128Mi"`,
    fixedConfig: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: report-worker
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: report-worker
  template:
    metadata:
      labels:
        app: report-worker
    spec:
      containers:
        - name: report-worker
          image: myregistry.io/report-worker:v1.0.0
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"`,
    requiredSnippets: ['512Mi'],
    forbiddenSnippets: ['128Mi'],
    verificationSuccessLog: `NAME                             CPU(cores)   MEMORY(bytes)   STATUS
report-worker-7c8d9e1f2-k19za    195m         348Mi / 512Mi   1/1 Running (0 Restarts)
✓ Thành công! Tiến trình xuất báo cáo PDF chạy mượt ở mức 348Mi RAM mà không còn bị OOMKilled (137)!`,
  },

  {
    id: 'incident-5-pending',
    number: 5,
    title: 'Sự cố 5: Pod nằm chờ vô thời hạn ở trạng thái Pending',
    statusBadge: 'Pending (<none> Node)',
    severity: 'P1 - High',
    alertMessage: 'Pod phân tích dữ liệu (analytics-job) nộp lên cụm đã 15 phút nhưng vẫn giữ nguyên trạng thái Pending, cột NODE trống rỗng <none>!',
    essenceOfProblem: 'Bản thiết kế Pod đã nộp lên API Server, nhưng Trưởng phòng điều phối (kube-scheduler) nhìn khắp các máy chủ Worker trong cụm mà không tìm được máy nào đủ tiêu chuẩn nhận Pod này do yêu cầu CPU quá cao (requests.cpu: 16) và gắn nhãn nodeSelector sai.',
    symptoms: [
      'Pod giữ nguyên trạng thái Pending suốt nhiều phút, cột NODE để trống <none>.',
      'Mục Events trong kubectl describe pod báo Warning FailedScheduling.',
    ],
    diagnosticSteps: [
      {
        stepOrder: 1,
        stepTitle: 'Bước 1 — Quan sát trạng thái Pod và cột NODE',
        command: 'kubectl get pods -n production -o wide',
        terminalOutput: `NAME                             READY   STATUS    RESTARTS   AGE   IP       NODE     NOMINATED NODE
analytics-worker-6d4f8b9-p01kx   0/1     Pending   0          15m   <none>   <none>   <none>`,
        clueExplanation: 'Cột STATUS báo Pending và cột NODE là <none>: Trưởng phòng Scheduler chưa xếp được Pod này vào bất kỳ máy chủ nào.',
      },
      {
        stepOrder: 2,
        stepTitle: 'Bước 2 — Đọc hồ sơ bệnh án tìm dòng Warning FailedScheduling',
        command: 'kubectl describe pod analytics-worker-6d4f8b9-p01kx -n production',
        terminalOutput: `Events:
  Type     Reason            Age                 From               Message
  ----     ------            ----                ----               -------
  Warning  FailedScheduling  45s (x12 over 15m)  default-scheduler  0/3 nodes are available: 3 Insufficient cpu, 3 node(s) didn't match Pod's node affinity/selector.`,
        clueExplanation: 'Scheduler báo rõ 2 lý do: (1) Cả 3 máy chủ đều không đủ CPU (Insufficient cpu) vì Pod đòi tới 16 cores, và (2) Không máy nào khớp nhãn nodeSelector (disktype=quantum-nvme)!',
      },
      {
        stepOrder: 3,
        stepTitle: 'Bước 3 — Kiểm tra cấu hình CPU và nhãn thực tế của các máy chủ Worker',
        command: 'kubectl get nodes --show-labels',
        terminalOutput: `NAME            STATUS   ROLES    AGE   VERSION   LABELS
worker-node-1   Ready    worker   45d   v1.30.0   disktype=ssd-nvme,kubernetes.io/hostname=worker-node-1
worker-node-2   Ready    worker   45d   v1.30.0   disktype=ssd-nvme,kubernetes.io/hostname=worker-node-2
worker-node-3   Ready    worker   45d   v1.30.0   disktype=ssd-nvme,kubernetes.io/hostname=worker-node-3`,
        clueExplanation: 'Các máy chủ trong cụm mang nhãn disktype=ssd-nvme và mỗi máy có 4 CPU cores.',
      },
      {
        stepOrder: 4,
        stepTitle: 'Bước 4 — Giảm requests.cpu xuống "500m" và sửa nodeSelector thành disktype: ssd-nvme',
        command: 'kubectl apply -f analytics-deployment.yaml',
        terminalOutput: `Hãy sửa requests.cpu thành "500m" và nodeSelector disktype thành "ssd-nvme" ở khung YAML bên phải!`,
        clueExplanation: 'Đưa mức yêu cầu CPU và nhãn máy chủ về đúng thực tế hạ tầng hiện có.',
      },
    ],
    rootCausesAndSolutions: [
      {
        causeTitle: '1. Cạn kiệt tài nguyên phần cứng (Insufficient cpu / memory)',
        detail: 'Mức yêu cầu tối thiểu (resources.requests.cpu: "16") lớn hơn phần tài nguyên còn dư trên từng máy chủ. Giảm xuống "500m".',
        fixCommandOrCode: 'requests:\n  cpu: "500m"',
      },
      {
        causeTitle: '2. Ràng buộc vị trí máy chủ quá khắt khe (NodeSelector)',
        detail: 'Cấu hình bắt buộc Pod chạy trên máy có nhãn disktype: quantum-nvme không tồn tại. Sửa lại thành disktype: ssd-nvme.',
        fixCommandOrCode: 'nodeSelector:\n  disktype: ssd-nvme',
      },
    ],
    configFileName: 'analytics-deployment.yaml',
    brokenConfig: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-worker
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: analytics-worker
  template:
    metadata:
      labels:
        app: analytics-worker
    spec:
      nodeSelector:
        # LỖI 1: Nhãn này không tồn tại trên bất kỳ máy chủ Worker nào (thực tế là ssd-nvme)
        disktype: quantum-nvme
      containers:
        - name: analytics
          image: myregistry.io/analytics:v1.2.0
          resources:
            requests:
              # LỖI 2: Yêu cầu tới 16 nhân CPU vượt quá khả năng của máy chủ 4 cores!
              cpu: "16"
              memory: "512Mi"`,
    fixedConfig: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-worker
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: analytics-worker
  template:
    metadata:
      labels:
        app: analytics-worker
    spec:
      nodeSelector:
        disktype: ssd-nvme
      containers:
        - name: analytics
          image: myregistry.io/analytics:v1.2.0
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"`,
    requiredSnippets: ['ssd-nvme', '500m'],
    forbiddenSnippets: ['quantum-nvme', 'cpu: "16"'],
    verificationSuccessLog: `Events:
  Normal  Scheduled  1s  default-scheduler  Successfully assigned production/analytics-worker-78f9a-z12k to worker-node-2
  Normal  Pulled     0s  kubelet            Container image "myregistry.io/analytics:v1.2.0" already present on machine
  Normal  Started    0s  kubelet            Started container analytics
✓ Trưởng phòng Scheduler đã phân công Pod về worker-node-2 thành công! Trạng thái: 1/1 Running!`,
  },

  {
    id: 'incident-6-config-error',
    number: 6,
    title: 'Sự cố 6: Lỗi CreateContainerConfigError (Thiếu hoặc Sai tên ConfigMap / Secret)',
    statusBadge: 'CreateContainerConfigError',
    severity: 'P1 - High',
    alertMessage: 'Image đã tải về xong xuôi nhưng Pod kẹt ở trạng thái CreateContainerConfigError ngay trước giây phút bấm nút khởi tạo Container!',
    essenceOfProblem: 'Kubelet phát hiện các tài liệu cấu hình (ConfigMap hoặc Secret) được tham chiếu trong file YAML của Pod chưa được tạo lên cụm hoặc bị gõ sai chính tả tên.',
    symptoms: [
      'Cột STATUS báo rõ CreateContainerConfigError.',
      'Mục Events trong kubectl describe pod báo Error: configmap "..." not found hoặc secret "..." not found.',
    ],
    diagnosticSteps: [
      {
        stepOrder: 1,
        stepTitle: 'Bước 1 — Quan sát trạng thái Pod trên cụm',
        command: 'kubectl get pods -n production',
        terminalOutput: `NAME                               READY   STATUS                       RESTARTS   AGE
web-app-deployment-5d8c9f7-q18zw   0/1     CreateContainerConfigError   0          4m`,
        clueExplanation: 'Cột STATUS báo CreateContainerConfigError: Image đã tải xong nhưng vướng lỗi cấu hình biến môi trường.',
      },
      {
        stepOrder: 2,
        stepTitle: 'Bước 2 — Đọc hồ sơ bệnh án Events để tìm tên ConfigMap/Secret bị thiếu',
        command: 'kubectl describe pod web-app-deployment-5d8c9f7-q18zw -n production',
        terminalOutput: `Events:
  Normal   Pulled   4m                kubelet  Successfully pulled image "myregistry.io/shop-web:v1.2.0"
  Warning  Failed   12s (x18 over 4m) kubelet  Error: configmap "webapp-cfg-typo" not found`,
        clueExplanation: 'Kubelet báo lỗi không tìm thấy ConfigMap có tên "webapp-cfg-typo".',
      },
      {
        stepOrder: 3,
        stepTitle: 'Bước 3 — Kiểm tra danh sách ConfigMap và Secret thực tế đang có trong Namespace',
        command: 'kubectl get configmap,secret -n production',
        terminalOutput: `NAME                         DATA   AGE
configmap/web-app-config     3      10d

NAME                         TYPE     DATA   AGE
secret/db-secret             Opaque   2      10d`,
        clueExplanation: 'Trên cụm thực tế ConfigMap mang tên "web-app-config" và Secret mang tên "db-secret", nhưng trong YAML của Deployment lại gõ sai chính tả thành "webapp-cfg-typo"!',
      },
      {
        stepOrder: 4,
        stepTitle: 'Bước 4 — Sửa lại đúng tên configMapRef: web-app-config',
        command: 'kubectl apply -f web-deployment.yaml',
        terminalOutput: `Hãy sửa tên configMapRef từ "webapp-cfg-typo" thành "web-app-config" ở khung YAML bên phải!`,
        clueExplanation: 'Đồng bộ chính xác tên ConfigMap với tài nguyên đang có trong namespace production.',
      },
    ],
    rootCausesAndSolutions: [
      {
        causeTitle: 'Quên tạo hoặc gõ sai chính tả tên ConfigMap / Secret',
        detail: 'Khai báo cho Pod đọc biến môi trường từ ConfigMap nhưng gõ sai tên hoặc tạo nhầm sang Namespace khác. Kiểm tra bằng kubectl get configmap,secret -n [NAMESPACE].',
        fixCommandOrCode: 'configMapRef:\n  name: web-app-config',
      },
    ],
    configFileName: 'web-deployment.yaml',
    brokenConfig: `apiVersion: apps/v1
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
          envFrom:
            - configMapRef:
                # LỖI: Gõ sai chính tả tên ConfigMap (tên đúng trên cụm là web-app-config)
                name: webapp-cfg-typo`,
    fixedConfig: `apiVersion: apps/v1
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
          envFrom:
            - configMapRef:
                name: web-app-config`,
    requiredSnippets: ['name: web-app-config'],
    forbiddenSnippets: ['webapp-cfg-typo'],
    verificationSuccessLog: `Events:
  Normal  Created  1s  kubelet  Created container web-container (injected 3 env vars from web-app-config)
  Normal  Started  0s  kubelet  Started container web-container
✓ Đã tiêm thành công biến môi trường từ ConfigMap web-app-config! Trạng thái: 1/1 Running!`,
  },

  {
    id: 'incident-7-network-selector',
    number: 7,
    title: 'Sự cố 7: Pod báo Running xanh mượt nhưng không thể truy cập được từ bên ngoài',
    statusBadge: 'Running (502 Bad Gateway)',
    severity: 'P0 - Critical',
    alertMessage: 'Cả 3 Pod shop-web đều báo 1/1 Running xanh mượt, không sập, không lỗi code, nhưng khách hàng truy cập shop.com lại nhận lỗi 502 Bad Gateway / Connection Refused!',
    essenceOfProblem: 'Đường dây liên lạc từ người dùng qua Ingress → Service → Pod bị đứt gãy do 2 lỗi kinh điển: (1) Lệch nhãn Selector ở Service (app: web-shop thay vì app: shop-web) khiến ENDPOINTS trống rỗng <none>, và (2) Sai số hiệu cổng targetPort (8080 thay vì 3000).',
    symptoms: [
      'kubectl get pods báo 1/1 Running, 0 Restarts.',
      'Gọi qua trình duyệt hoặc Ingress báo 502 Bad Gateway / Connection Refused.',
      'Chạy kubectl get endpoints trả về cột ENDPOINTS là <none>.',
    ],
    diagnosticSteps: [
      {
        stepOrder: 1,
        stepTitle: 'Bước 1 — Quan sát trạng thái Pod & Nhãn (Labels) thực tế của Pod',
        command: 'kubectl get pods -n production --show-labels',
        terminalOutput: `NAME                                  READY   STATUS    RESTARTS   AGE   LABELS
web-app-deployment-7d9f8b6c4-a12bx    1/1     Running   0          25m   app=shop-web
web-app-deployment-7d9f8b6c4-c89mz    1/1     Running   0          25m   app=shop-web
web-app-deployment-7d9f8b6c4-f44qp    1/1     Running   0          25m   app=shop-web`,
        clueExplanation: 'Cả 3 Pod đều đang chạy khỏe mạnh và mang thẻ tên (label) là app=shop-web.',
      },
      {
        stepOrder: 2,
        stepTitle: 'Bước 2 — Thử kết nối thẳng vào Pod (bỏ qua Service/Ingress) để khoanh vùng',
        command: 'kubectl port-forward pod/web-app-deployment-7d9f8b6c4-a12bx 8080:3000 -n production',
        terminalOutput: `Forwarding from 127.0.0.1:8080 -> 3000
Handling connection for 8080 -> HTTP/1.1 200 OK (Ứng dụng mở cổng 3000 trên 0.0.0.0 hoàn toàn bình thường!)`,
        clueExplanation: 'Kết nối thẳng vào cổng 3000 của Pod vào được bình thường → Pod hoàn toàn vô tội! Lỗi chắc chắn nằm ở cấu hình Service!',
      },
      {
        stepOrder: 3,
        stepTitle: 'Bước 3 — Kiểm tra danh bạ của Tổng đài Service (kubectl get endpoints)',
        command: 'kubectl get endpoints web-app-service -n production && kubectl describe svc web-app-service -n production',
        terminalOutput: `NAME              ENDPOINTS   AGE
web-app-service   <none>      25m   # <-- [BÁO ĐỘNG ĐỎ: Danh bạ Tổng đài trống rỗng!]

Selector:          app=web-shop     # <-- Lệch nhãn với Pod (app=shop-web)!
Port:              http  80/TCP
TargetPort:        8080/TCP         # <-- Gõ nhầm cổng 8080 trong khi Container mở cổng 3000!`,
        clueExplanation: 'Phát hiện 2 lỗi chí mạng ở Service: Selector gõ nhầm thành "app: web-shop" làm ENDPOINTS báo <none>, và targetPort gõ nhầm thành 8080 thay vì 3000!',
      },
      {
        stepOrder: 4,
        stepTitle: 'Bước 4 — Sửa lại selector thành app: shop-web và targetPort: 3000',
        command: 'kubectl apply -f web-service.yaml',
        terminalOutput: `Hãy sửa selector.app thành "shop-web" và targetPort thành 3000 ở khung YAML bên phải!`,
        clueExplanation: 'Khớp từng chữ cái của thẻ tên Selector và đúng số hiệu cổng Container 3000.',
      },
    ],
    rootCausesAndSolutions: [
      {
        causeTitle: '1. Lệch nhãn nhận diện (Selector Mismatch — Lỗi phổ biến số 1)',
        detail: 'Trong Pod dán nhãn app: shop-web nhưng trong Service mục selector lại gõ nhầm thành app: web-shop khiến ENDPOINTS là <none>.',
        fixCommandOrCode: 'selector:\n  app: shop-web',
      },
      {
        causeTitle: '2. Lệch số hiệu cổng (targetPort Mismatch) hoặc nghe ở 127.0.0.1',
        detail: 'Container lắng nghe ở cổng 3000 nhưng Service cấu hình targetPort: 8080. Ngoài ra trong code phải đảm bảo lắng nghe ở 0.0.0.0 chứ không phải 127.0.0.1.',
        fixCommandOrCode: 'targetPort: 3000',
      },
    ],
    configFileName: 'web-service.yaml',
    brokenConfig: `apiVersion: v1
kind: Service
metadata:
  name: web-app-service
  namespace: production
spec:
  type: ClusterIP
  selector:
    # LỖI 1: Lệch nhãn với Pod (Pod đang mang nhãn app: shop-web) khiến ENDPOINTS = <none>
    app: web-shop
  ports:
    - name: http
      port: 80
      # LỖI 2: Gõ nhầm sang cổng 8080 đang đóng kín (Container thực tế lắng nghe ở cổng 3000)
      targetPort: 8080`,
    fixedConfig: `apiVersion: v1
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
      port: 80
      targetPort: 3000`,
    requiredSnippets: ['app: shop-web', 'targetPort: 3000'],
    forbiddenSnippets: ['app: web-shop', 'targetPort: 8080'],
    verificationSuccessLog: `$ kubectl get endpoints web-app-service -n production
NAME              ENDPOINTS                                            AGE
web-app-service   10.244.1.12:3000,10.244.2.15:3000,10.244.3.19:3000   26m
✓ Thông mạch ngay lập tức! Tổng đài Service đã tìm thấy cả 3 IP Pod ở cổng 3000 và website shop.com hoạt động 200 OK!`,
  },

  {
    id: 'incident-8-terminating-stuck',
    number: 8,
    title: 'Sự cố 8: Pod bị kẹt ở trạng thái Terminating không chịu biến mất & Xử lý SIGTERM',
    statusBadge: 'Stuck Terminating',
    severity: 'P2 - Medium',
    alertMessage: 'Khi nâng cấp ứng dụng hoặc xóa Pod cũ, Pod legacy-worker cứ treo mãi ở trạng thái Terminating hàng chục phút không tắt hẳn!',
    essenceOfProblem: 'Khi K8s muốn tắt Pod, nó gửi tín hiệu SIGTERM và chờ mặc định 30 giây. Sự cố xảy ra khi: (1) Tiến trình bên trong dùng dạng shell string CMD "node server.js" khiến tín hiệu SIGTERM bị /bin/sh nuốt mất không tới được Node.js, hoặc (2) Máy chủ Worker bị sập nguồn (NodeNotReady) mất liên lạc với Control Plane.',
    symptoms: [
      'Pod cũ treo ở trạng thái Terminating rất lâu khi nâng cấp hoặc xóa.',
      'Nếu do sập máy chủ, gõ kubectl get nodes sẽ thấy một máy chủ báo NotReady.',
    ],
    diagnosticSteps: [
      {
        stepOrder: 1,
        stepTitle: 'Bước 1 — Quan sát Pod bị kẹt Terminating và trạng thái các Worker Nodes',
        command: 'kubectl get pods -n production && kubectl get nodes',
        terminalOutput: `NAME                             READY   STATUS        RESTARTS   AGE
legacy-worker-6c8f9b-x11k        1/1     Terminating   0          45m

NAME            STATUS     ROLES    AGE
worker-node-1   Ready      worker   60d
worker-node-2   NotReady   worker   60d   # <-- Quản đốc Kubelet trên máy 2 mất liên lạc!`,
        clueExplanation: 'Pod đang treo ở trạng thái Terminating và máy chủ worker-node-2 báo NotReady.',
      },
      {
        stepOrder: 2,
        stepTitle: 'Bước 2 — Kiểm tra sức khỏe máy chủ Worker bằng kubectl describe node',
        command: 'kubectl describe node worker-node-2',
        terminalOutput: `Conditions:
  Type             Status    Reason              Message
  ----             ------    ------              -------
  Ready            Unknown   NodeStatusUnknown   Kubelet stopped posting node status.`,
        clueExplanation: 'Quản đốc Kubelet trên worker-node-2 ngừng gửi báo cáo nên Ban giám đốc K8s chưa thể xác nhận Pod đã tắt thật chưa.',
      },
      {
        stepOrder: 3,
        stepTitle: 'Bước 3 — Kiểm tra cách viết CMD trong Dockerfile và cấu hình Graceful Shutdown',
        command: 'kubectl logs legacy-worker-6c8f9b-x11k -n production',
        terminalOutput: `Running via /bin/sh -c "node dist/worker.js" (PID 1 is /bin/sh, NOT node!)
# Khi nhận SIGTERM, /bin/sh không chuyển tiếp tín hiệu cho tiến trình con node!`,
        clueExplanation: 'Để ứng dụng nhận được tín hiệu tắt êm đẹp (SIGTERM) và đóng kết nối DB an toàn, cần dùng cú pháp mảng JSON CMD ["node", "dist/worker.js"] và cấu hình terminationGracePeriodSeconds hợp lý.',
      },
      {
        stepOrder: 4,
        stepTitle: 'Bước 4 — Chuẩn hóa terminationGracePeriodSeconds & Lệnh cưỡng chế khi khẩn cấp',
        command: 'kubectl delete pod legacy-worker-6c8f9b-x11k --grace-period=0 --force -n production',
        terminalOutput: `Hãy cấu hình terminationGracePeriodSeconds: 30 và command dạng mảng ["node", "dist/worker.js"] ở khung YAML bên phải!`,
        clueExplanation: 'Đảm bảo tiến trình chính mang PID 1 nhận trực tiếp SIGTERM để tắt êm đẹp trong vòng 30 giây.',
      },
    ],
    rootCausesAndSolutions: [
      {
        causeTitle: '1. Máy chủ Worker sập nguồn mất liên lạc (NodeNotReady)',
        detail: 'Kiểm tra sức khỏe máy chủ bằng kubectl describe node [TÊN_NODE] và khôi phục Kubelet/mạng máy chủ.',
        fixCommandOrCode: 'kubectl describe node worker-node-2',
      },
      {
        causeTitle: '2. Ứng dụng không xử lý tín hiệu SIGTERM hoặc cần giải phóng khẩn cấp',
        detail: 'Chạy ứng dụng ở PID 1 bằng mảng JSON ["node", "dist/worker.js"], cấu hình terminationGracePeriodSeconds: 30. Trong trường hợp khẩn cấp dùng lệnh cưỡng chế --grace-period=0 --force.',
        fixCommandOrCode: 'kubectl delete pod [TÊN_POD] --grace-period=0 --force',
      },
    ],
    configFileName: 'legacy-worker-deployment.yaml',
    brokenConfig: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: legacy-worker
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: legacy-worker
  template:
    metadata:
      labels:
        app: legacy-worker
    spec:
      # LỖI 1: Đặt thời gian chờ tắt quá dài (3600 giây = 1 tiếng)
      terminationGracePeriodSeconds: 3600
      containers:
        - name: worker
          image: myregistry.io/legacy-worker:v1.0.0
          # LỖI 2: Chạy qua /bin/sh -c làm tiến trình node không nhận được tín hiệu SIGTERM!
          command: ["/bin/sh", "-c", "node dist/worker.js"]`,
    fixedConfig: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: legacy-worker
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: legacy-worker
  template:
    metadata:
      labels:
        app: legacy-worker
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: worker
          image: myregistry.io/legacy-worker:v1.0.0
          command: ["node", "dist/worker.js"]`,
    requiredSnippets: ['terminationGracePeriodSeconds: 30', '["node", "dist/worker.js"]'],
    forbiddenSnippets: ['terminationGracePeriodSeconds: 3600', '/bin/sh'],
    verificationSuccessLog: `[2026-11-08T15:30:01Z] INFO  Received SIGTERM on PID 1 (node). Closing DB pool gracefully...
[2026-11-08T15:30:02Z] INFO  Clean shutdown completed in 1.2s (Exit Code 0).
✓ Pod cũ đã tắt êm đẹp trong 1.2s mà không còn bị treo ở trạng thái Terminating!`,
  },
];

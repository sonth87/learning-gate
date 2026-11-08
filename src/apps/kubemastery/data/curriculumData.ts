import { KubeLesson, KubeStageMeta } from '../types/kube.types';

export const KUBE_STAGES: KubeStageMeta[] = [
  {
    id: 'stage-1',
    number: 1,
    title: 'Giai đoạn 1: Cội nguồn & Làm chủ Docker (Móng nhà)',
    subtitle: 'Giải mã bản chất OCI/CRI, Namespaces/cgroups/UnionFS, tối ưu Dockerfile Multi-stage, Volumes & Docker Compose',
    coreKnowledge: [
      'Sự thật về "File Zip" (Image) và "Thư mục giải nén" (Container), chuẩn quốc tế OCI & CRI',
      'Cơ chế kỹ thuật dưới đáy: Linux Namespaces, cgroups & UnionFS (OverlayFS)',
      'Quy tắc viết Dockerfile chuẩn hóa, cơ chế Layer Caching & kỹ thuật Multi-stage Build',
      'Lưu trữ dữ liệu bền vững: Docker Volumes vs. Bind Mounts & Quản lý đa container với Docker Compose',
    ],
    practicalGoals: [
      'Tự đóng gói được ứng dụng Node.js, Python, Go hoặc Java thành OCI Image chuẩn',
      'Tối ưu kích thước Image từ ~1GB xuống còn dưới 100MB và khóa Layer Cache tiết kiệm 90% thời gian build',
      'Viết docker-compose.yml bật cùng lúc Web App + PostgreSQL + Redis chỉ bằng 1 lệnh mà tắt bật không mất dữ liệu',
    ],
    milestone: 'Ứng dụng chạy mượt trên máy cá nhân, tắt bật container mà dữ liệu Database không bị mất.',
    color: 'sky',
  },
  {
    id: 'stage-2',
    number: 2,
    title: 'Giai đoạn 2: Nhập môn Kubernetes (Kiến trúc & Object Cơ bản)',
    subtitle: 'Control Plane vs. Worker Node, Control Loop, Pod, Deployment, Service, ConfigMap & Secret',
    coreKnowledge: [
      'Kiến trúc cụm Cluster: Control Plane (API Server, etcd, Scheduler, Controller) và Worker Node (Kubelet, Kube-proxy, Containerd)',
      'Mô hình Declarative (Khai báo trạng thái mong muốn) vận hành qua Control Loop đối soát 24/7',
      'Các Object nền tảng: Pod (Vỏ kén/Căn hộ), ReplicaSet, Deployment (Rolling Update) & Namespace',
      'Kết nối mạng với Service (ClusterIP, NodePort, LoadBalancer) và tách biệt cấu hình qua ConfigMap & Secret',
    ],
    practicalGoals: [
      'Dựng cụm K8s thực hành và hiểu rõ luồng đi của lệnh kubectl apply từ API Server xuống Kubelet',
      'Chuyển đổi thành công cụm ứng dụng từ Docker Compose sang các file YAML chuẩn của K8s',
      'Cập nhật phiên bản mới không gây gián đoạn (Rolling Update) và quay lui (Rollback) khi lỗi',
    ],
    milestone: 'Triển khai được ứng dụng nhiều bản sao lên K8s và truy cập thành công từ trình duyệt bên ngoài.',
    color: 'emerald',
  },
  {
    id: 'stage-3',
    number: 3,
    title: 'Giai đoạn 3: Kubernetes Nâng cao (Vận hành Doanh nghiệp)',
    subtitle: 'Ingress Controller SSL/TLS, Lưu trữ PV/PVC/StorageClass, StatefulSet/DaemonSet, Probes & Tự động co giãn HPA',
    coreKnowledge: [
      'Định tuyến tên miền & chứng chỉ bảo mật SSL/TLS với Ingress Controller (Nginx, Traefik)',
      'Lưu trữ bền vững: PersistentVolume (PV), PersistentVolumeClaim (PVC) & StorageClass cấp đất tự động',
      'Quản lý ứng dụng đặc thù: StatefulSet (cho Database phân tán), DaemonSet, Job & CronJob',
      'Kiểm tra sức khỏe tự động (Startup, Liveness, Readiness Probes) & Mở rộng tự động HPA (Horizontal Pod Autoscaler)',
    ],
    practicalGoals: [
      'Cấu hình nhiều tên miền trỏ về cùng một cụm K8s có HTTPS tự động qua 1 Ingress duy nhất',
      'Cấp phát ổ cứng động cho Database trên K8s và thiết lập giới hạn tài nguyên (Requests/Limits) chuẩn xác',
      'Thiết lập cơ chế tự nhân bản Pod từ 2 lên 20 khi CPU vượt ngưỡng 70% lúc khuyến mãi 0h00',
    ],
    milestone: 'Hệ thống có khả năng tự chịu lỗi khi sập máy chủ, tự co giãn theo tải thực tế mà không cần người can thiệp.',
    color: 'amber',
  },
  {
    id: 'stage-4',
    number: 4,
    title: 'Giai đoạn 4: K8s Master, Cloud Native & Chẩn đoán Sự cố Thực chiến',
    subtitle: 'Helm Charts, GitOps với ArgoCD + CI/CD, Giám sát Prometheus/Grafana, RBAC/NetworkPolicy & Phác đồ Bắt bệnh 8 Sự cố',
    coreKnowledge: [
      'Quản lý gói ứng dụng với Helm Charts & Tự động hóa triển khai hiện đại theo mô hình GitOps với ArgoCD + CI/CD',
      'Giám sát & Gom log tập trung: Prometheus, Grafana, Loki / ELK Stack',
      'Bảo mật cụm: Phân quyền RBAC & Tường lửa nội bộ NetworkPolicy',
      'Quy trình 4 Bước "Khám Bệnh" & Giải pháp triệt để cho 8 Sự cố kinh điển trên Production',
    ],
    practicalGoals: [
      'Thiết lập quy trình CI/CD + GitOps: Lập trình viên vừa Merge code, hệ thống tự build Image và ArgoCD tự đồng bộ lên K8s',
      'Nắm vững phác đồ bắt bệnh nhanh cho Pending, ImagePullBackOff, CrashLoopBackOff, OOMKilled (137), Lệch Selector & Terminating',
      'Làm chủ toàn bộ bảng lệnh thực chiến "gối đầu giường" của kỹ sư DevOps/SRE',
    ],
    milestone: 'Làm chủ toàn diện chu trình DevOps/SRE chuẩn doanh nghiệp lớn và xử lý sự cố trong vài phút.',
    color: 'violet',
  },
];

export const KUBE_LESSONS: KubeLesson[] = [
  {
    id: 'lesson-1-1-essence-oci-cri',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 1,
    title: 'Bài 1.1: Cội nguồn Bản chất — Sự thật về "File Zip" (Image), "Thư mục giải nén" (Container) & Chuẩn OCI/CRI',
    shortDescription: 'Giải mã tận gốc mối quan hệ giữa Container, Image, Docker, Containerd, chuẩn quốc tế OCI, cổng CRI và vị Tổng chỉ huy Kubernetes để không bao giờ học vẹt.',
    estimatedMinutes: 15,
    theorySections: [
      {
        heading: '1.1. Sự thật về "File Zip" (Image) và "Thư mục giải nén" (Container)',
        paragraphs: [
          'Trong phát triển phần mềm truyền thống, một ứng dụng chạy tốt trên máy lập trình viên thường xuyên bị lỗi khi đưa lên máy chủ do khác biệt về phiên bản hệ điều hành, thư viện đi kèm hoặc biến môi trường ("Trên máy em vẫn chạy ngon mà!"). Công nghệ Container ra đời để chấm dứt triệt để vấn đề này thông qua hai khái niệm cốt lõi:',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Container Image (Hình ảnh đóng gói):',
            text: 'Là một gói dữ liệu đóng băng, chỉ cho phép đọc (Read-Only). Bên trong nó chứa toàn bộ mã nguồn ứng dụng, các thư viện phụ thuộc, biến môi trường và cả một hệ điều hành thu nhỏ (như Ubuntu hoặc Alpine Linux). Liên tưởng hóa: Image chính xác là một "File .zip đặc biệt" hoặc một "Đĩa phim Blu-ray gốc". Khi nằm trên ổ cứng, nó hoàn toàn tĩnh và không ai có thể sửa đổi trực tiếp nội dung bên trong.',
          },
          {
            boldPrefix: 'Container (Môi trường thực thi):',
            text: 'Là trạng thái sống của Image khi được khởi chạy trên máy tính. Khi bạn bấm lệnh chạy, hệ thống sẽ "giải nén" file Image vào một vùng nhớ cô lập hoàn toàn và đặt thêm một lớp cho phép ghi dữ liệu tạm (Writable Layer) lên trên cùng. Liên tưởng hóa: Container giống như một "Thư mục đã giải nén và đang chạy" hoặc một "Căn bếp biệt lập đang đỏ lửa". Điểm kỳ diệu là từ 1 file Image gốc (1 file .zip), bạn có thể giải nén ra 10, 100 hay 1.000 Container giống hệt nhau chạy song song mà không bao giờ sợ dữ liệu của chúng đè lên nhau hay làm hỏng file .zip gốc.',
          },
        ],
      },
      {
        heading: '1.2. Chuẩn chung Quốc tế (OCI & CRI): Vì sao K8s không chỉ chạy mỗi Docker?',
        paragraphs: [
          'Một thắc mắc rất phổ biến là: "Khi nói Kubernetes quản lý các container, có phải là đang nói đến container của Docker không?". Câu trả lời là: Đúng trong thói quen giao tiếp hàng ngày, nhưng về mặt kỹ thuật, Container và Image là một chuẩn chung của toàn ngành công nghệ chứ không thuộc độc quyền của Docker.',
          'Tổ chức OCI (Open Container Initiative) đã ban hành quy chuẩn quốc tế quy định cấu trúc một Image và một Container phải như thế nào. Song song đó, Kubernetes sử dụng một cổng giao tiếp chuẩn hóa gọi là CRI (Container Runtime Interface). Bất kỳ công cụ nào tuân thủ chuẩn OCI và CRI đều có thể tạo và chạy container trên Kubernetes:',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Docker:',
            text: 'Công cụ nổi tiếng nhất thế giới dành cho lập trình viên. Nó tích hợp mọi thứ từ việc "nén" code thành Image (build), tải Image (pull) cho đến khởi chạy Container.',
          },
          {
            boldPrefix: 'Containerd & CRI-O:',
            text: 'Là các công cụ chạy container (Container Runtime) gọn nhẹ, lược bỏ các tính năng rườm rà dành cho người dùng cá nhân để tối ưu tốc độ cho máy chủ. Hiện nay, Kubernetes sử dụng Containerd (vốn là lõi công nghệ tách ra từ chính Docker) làm công cụ mặc định để giải nén và chạy container trên các máy chủ.',
          },
        ],
      },
    ],
    analogyCards: {
      title: 'Bảng Liên tưởng Đa chiều: Thế giới Container & Kubernetes',
      scenario: 'So sánh trực quan qua 3 lăng kính quen thuộc: File Giải nén (.zip), File Đa phương tiện (.mp4) và Chuỗi Rạp Chiếu Phim toàn quốc.',
      mappings: [
        {
          technicalTerm: 'Chuẩn chung (OCI)',
          analogyName: 'Định dạng .zip quốc tế / Chuẩn .mp4 / Đĩa phim kỹ thuật số',
          explanation: 'Quy chuẩn quốc tế giúp Image đóng gói bởi Docker có thể giải nén mượt mà bằng Containerd hay CRI-O trên bất kỳ đám mây nào.',
        },
        {
          technicalTerm: 'Container Image',
          analogyName: 'File app.zip đóng băng (Read-Only) / Cuộn phim gốc',
          explanation: 'Gói dữ liệu tĩnh chỉ đọc nằm trên ổ cứng hoặc kho Registry, chứa trọn bộ code + thư viện + HĐH tối giản.',
        },
        {
          technicalTerm: 'Docker / Containerd',
          analogyName: 'Phần mềm WinRAR, 7-Zip / Đầu đọc đĩa & Máy chiếu phim',
          explanation: 'Người thợ trực tiếp đứng tại 1 máy chủ để nén mã nguồn thành Image hoặc giải nén Image thành Container.',
        },
        {
          technicalTerm: 'Container đang chạy',
          analogyName: 'Thư mục đã giải nén đang chạy / Suất chiếu thực tế phục vụ khán giả',
          explanation: 'Trạng thái sống trên RAM/CPU có gắn thêm lớp ghi tạm (Writable Layer) trên cùng.',
        },
        {
          technicalTerm: 'Kubernetes (K8s)',
          analogyName: 'Tổng giám đốc chuỗi rạp chiếu phim toàn quốc (Người cầm lái)',
          explanation: 'Không trực tiếp nén hay giải nén file nào cả; quan sát hàng trăm máy chủ từ trên cao và ra mệnh lệnh cho Containerd tự động giải nén, nhân bản hoặc bù đắp khi máy chủ cháy nguồn.',
        },
      ],
      summaryCallout: 'ĐÚC KẾT BỨC TRANH TOÀN CẢNH: Docker (hoặc Containerd) là người thợ trực tiếp đứng tại một máy chủ cụ thể. Trong khi đó, Kubernetes (K8s — bắt nguồn từ tiếng Hy Lạp nghĩa là "Người cầm lái/Hoa tiêu") là vị Tổng chỉ huy đứng ở trên cao điều phối hàng trăm máy chủ: "Máy chủ B vừa cháy nguồn rồi, Máy chủ C hãy lập tức bảo Containerd giải nén 5 bản mới để thay thế ngay!".',
    },
    animatedFlowId: 'code-to-k8s-pipeline',
    codeExamples: [
      {
        id: 'ex-1-1-docker-cli',
        filename: 'terminal-docker-vs-containerd.sh',
        language: 'bash',
        purpose: 'Trải nghiệm quy trình Nén thành Image (.zip) và Giải nén thành nhiều Container song song từ 1 Image gốc',
        code: `# 1. Nén mã nguồn ở thư mục hiện tại thành gói OCI Image (File .zip đóng băng)
docker build -t shop-payment:v1.0 .

# 2. Từ 1 file Image gốc, giải nén ra 3 Container chạy độc lập ở 3 cổng khác nhau
docker run -d -p 8081:3000 --name payment-1 shop-payment:v1.0
docker run -d -p 8082:3000 --name payment-2 shop-payment:v1.0
docker run -d -p 8083:3000 --name payment-3 shop-payment:v1.0

# 3. Kiểm tra danh sách các Container đang sống
docker ps`,
        annotations: [
          { line: 2, keyword: 'docker build -t', explanation: 'Đóng gói toàn bộ code + thư viện theo Dockerfile thành Image chỉ đọc mang nhãn shop-payment:v1.0.' },
          { line: 5, keyword: 'docker run -d -p', explanation: 'Giải nén Image vào vùng nhớ cô lập, chạy ngầm (-d) và nối cổng máy thật (8081, 8082, 8083) vào cổng 3000 bên trong từng container.' },
          { line: 10, keyword: 'docker ps', explanation: 'Liệt kê toàn bộ các container đang chạy song song mà không hề đè dữ liệu lên nhau.' },
        ],
      },
    ],
    gotchas: [
      {
        title: 'Sửa trực tiếp file bên trong Container đang chạy (docker exec)',
        severity: 'critical',
        symptom: 'Kỹ sư dùng docker exec -it chui vào trong container sửa lỗi code trực tiếp. Hôm sau container khởi động lại hoặc cập nhật, toàn bộ bản sửa biến mất sạch!',
        rootCause: 'Mọi thay đổi khi container đang chạy chỉ nằm ở lớp ghi tạm (Writable Layer) trên đỉnh. Khi xóa container, lớp ghi tạm này bị hủy, còn file Image gốc (.zip) vẫn giữ nguyên nội dung cũ.',
        wrongApproach: 'docker exec -it web vi /usr/src/app/server.js # Sửa tay trong container đang sống',
        rightApproach: 'Sửa trong mã nguồn gốc → Chạy lại docker build -t myapp:v1.1 . → Tạo container mới từ Image v1.1',
      },
    ],
    relatedIncidentId: 'incident-1-local-docker',
    relatedPracticeId: 'prac-1-dockerfile',
  },

  {
    id: 'lesson-1-2-kernel-control-loop',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 2,
    title: 'Bài 1.2: Cơ chế Kỹ thuật Dưới đáy — Linux Namespaces, cgroups, UnionFS & Vòng lặp Control Loop',
    shortDescription: 'Tại sao người ta chuyển từ Máy ảo (VM) nặng hàng chục GB sang Container chỉ vài chục MB? Giải mã 3 công nghệ lõi của Linux Kernel và triết lý Declarative của K8s.',
    estimatedMinutes: 15,
    theorySections: [
      {
        heading: '1.3. Ba công nghệ lõi của Linux Kernel tạo nên Container',
        paragraphs: [
          'Tại sao người ta lại chuyển từ Máy ảo (Virtual Machine - VM) sang Container? Một máy ảo truyền thống phải giả lập toàn bộ phần cứng (CPU ảo, RAM ảo, ổ cứng ảo) và cài đặt một hệ điều hành hoàn chỉnh (nặng hàng chục GB, khởi động mất vài phút). Ngược lại, Container dùng chung nhân hệ điều hành (Linux Kernel) của máy chủ vật lý và chỉ tiêu tốn vài chục MB, khởi động trong tích tắc nhờ 3 công nghệ lõi của Linux:',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Linux Namespaces (Bức tường cô lập tầm nhìn):',
            text: 'Tạo ra các không gian tách biệt về tiến trình (PID), mạng (Network), điểm gắn ổ đĩa (Mount). Mỗi container khi nhìn ra xung quanh đều tưởng rằng mình đang sở hữu riêng một chiếc máy chủ độc lập, hoàn toàn không nhìn thấy các container hàng xóm.',
          },
          {
            boldPrefix: 'Control Groups - cgroups (Trạm kiểm soát định mức tài nguyên):',
            text: 'Ngăn chặn tình trạng một container bị lỗi ngốn sạch 100% RAM và CPU làm chết cả máy chủ. Cgroups đóng vai trò như đồng hồ điện nước, khóa chặt giới hạn phần cứng mà mỗi container được phép tiêu thụ.',
          },
          {
            boldPrefix: 'Union File Systems - UnionFS (Cơ chế xếp chồng lớp bánh):',
            text: 'Giúp Docker Image được cấu tạo từ nhiều lớp (Layers) xếp chồng lên nhau. Nếu 10 ứng dụng khác nhau cùng dùng hệ điều hành nền Ubuntu, máy chủ chỉ cần lưu đúng 1 lớp Ubuntu gốc trên ổ cứng và dùng chung cho cả 10 ứng dụng, tiết kiệm hàng chục GB dung lượng lưu trữ.',
          },
        ],
      },
      {
        heading: '1.4. Triết lý Declarative (Khai báo trạng thái mong muốn) & Vòng lặp Control Loop',
        paragraphs: [
          'Đối với Kubernetes, triết lý kỹ thuật quan trọng nhất của nó là mô hình Declarative (Khai báo trạng thái mong muốn) vận hành qua Control Loop (Vòng lặp đối soát liên tục).',
          'Thay vì bạn phải gõ từng lệnh thủ công kiểu "Bước 1 tạo container A, bước 2 tạo container B" (Imperative), bạn chỉ cần đưa cho K8s một bản thiết kế YAML ghi rõ: "Trạng thái mong muốn của tôi là luôn có 4 bản sao ứng dụng Web hoạt động". K8s sẽ chạy một vòng lặp vĩnh cửu: kiểm tra thực tế đang có mấy bản, nếu thấy chỉ còn 3 bản (do 1 máy chủ vừa sập), nó tự động kích hoạt tạo thêm 1 bản mới để luôn cân bằng con số 4.',
        ],
      },
    ],
    analogyCards: {
      title: 'Liên tưởng Hóa: Biệt thự riêng (VM) vs. Chung cư cao cấp (Container)',
      scenario: 'So sánh kiến trúc Máy ảo truyền thống và Container chạy trên Linux Kernel.',
      mappings: [
        {
          technicalTerm: 'Linux Namespaces',
          analogyName: 'Bức tường cách âm & Cửa khóa riêng từng căn hộ',
          explanation: 'Giúp người trong căn hộ A không nhìn thấy tiến trình hay mạng của căn hộ B dù ở chung một tòa nhà máy chủ.',
        },
        {
          technicalTerm: 'Control Groups (cgroups)',
          analogyName: 'Aptomat & Đồng hồ điện nước riêng từng hộ',
          explanation: 'Nếu căn hộ A chập điện hay xài quá công suất RAM (limits.memory), aptomat tự ngắt riêng hộ đó (OOMKilled 137) chứ không làm mất điện cả tòa nhà.',
        },
        {
          technicalTerm: 'UnionFS (OverlayFS)',
          analogyName: 'Cốt bánh kem nhiều tầng dùng chung nền',
          explanation: 'Chia sẻ các lớp Read-Only bên dưới giữa hàng chục container, chỉ tạo lớp kem mỏng Writable ở trên đỉnh.',
        },
        {
          technicalTerm: 'Declarative & Control Loop',
          analogyName: 'Máy điều hòa nhiệt độ tự động (Thermostat)',
          explanation: 'Bạn chỉ cần bấm chọn "Mong muốn 24°C" (Declarative YAML). Cảm biến (Control Loop) thấy phòng nóng lên 26°C sẽ tự bật lốc lạnh kéo về đúng 24°C.',
        },
      ],
      summaryCallout: 'Nhờ Namespaces + cgroups + UnionFS, một máy chủ RAM 16GB chỉ chạy được 4–6 Máy ảo (VM) nhưng có thể chạy mượt mà 80–150 Containers!',
    },
    animatedFlowId: 'linux-kernel-isolation',
    codeExamples: [
      {
        id: 'ex-1-2-cgroups-limits',
        filename: 'docker-cgroups-and-layers.sh',
        language: 'bash',
        purpose: 'Kiểm chứng Namespaces, định mức cgroups và các tầng bánh UnionFS bằng lệnh thực tế',
        code: `# 1. Chạy container với trạm kiểm soát cgroups: khóa trần 256MB RAM và 0.5 CPU
docker run -d --name app-limited --memory="256m" --cpus="0.5" alpine sleep 3600

# 2. Kiểm tra tường cô lập PID Namespace: bên trong container, sleep luôn mang PID 1!
docker exec app-limited ps aux

# 3. Xem các tầng bánh kem (UnionFS Layers) của một Image
docker history node:20-alpine`,
        annotations: [
          { line: 2, keyword: '--memory="256m" --cpus="0.5"', explanation: 'Cấu hình trực tiếp cgroups của nhân Linux để khóa trần RAM ở 256MB và tối đa nửa nhân CPU.' },
          { line: 5, keyword: 'ps aux', explanation: 'Nhờ PID Namespace, container chỉ nhìn thấy đúng tiến trình của riêng nó với PID = 1 chứ không thấy hàng trăm tiến trình của máy chủ.' },
          { line: 8, keyword: 'docker history', explanation: 'Hiển thị từng lớp bánh (Layer) xếp chồng lên nhau cùng dung lượng của từng lớp.' },
        ],
      },
    ],
    gotchas: [
      {
        title: 'Chạy Container không đặt giới hạn RAM/CPU (Quên cấu hình cgroups Limits)',
        severity: 'critical',
        symptom: 'Một dịch vụ xử lý ảnh bị rò rỉ bộ nhớ (Memory Leak) phình lên 16GB RAM, làm treo cứng toàn bộ máy chủ và kéo sập cả 20 dịch vụ khác đang chạy chung!',
        rootCause: 'Mặc định Docker và K8s không giới hạn mức trần cgroups nếu bạn không khai báo. Container được phép ngốn tới giọt RAM cuối cùng của máy chủ.',
        wrongApproach: 'Chạy container hoặc Pod mà bỏ trống mục resources.limits.memory',
        rightApproach: 'Luôn khai báo resources.requests và resources.limits (ví dụ memory: 512Mi) trong mọi file YAML Production',
      },
    ],
    relatedIncidentId: 'incident-4-oomkilled',
  },

  {
    id: 'lesson-1-3-dockerfile-multistage',
    stageId: 'stage-1',
    level: 'basic',
    order: 3,
    title: 'Bài 1.3: Viết Dockerfile Chuẩn Hóa — Layer Caching (Tầng bánh kem) & Multi-stage Build',
    shortDescription: 'Tránh sai lầm kinh điển làm vỡ Layer Cache và lỗ hổng chạy quyền root. Nắm vững mẫu Dockerfile Multi-stage chuẩn doanh nghiệp nén ứng dụng xuống dưới 100MB.',
    estimatedMinutes: 20,
    theorySections: [
      {
        heading: '3.1 & 4.1. Giải mã Dockerfile, Layer Caching & Multi-stage Build',
        paragraphs: [
          'Một sai lầm kinh điển của người mới là dùng câu lệnh COPY . . (sao chép toàn bộ mã nguồn) ngay ở đầu file trước khi chạy lệnh cài đặt thư viện (npm install), đồng thời chạy ứng dụng bằng quyền quản trị tối cao (root). Điều này khiến Docker mất hoàn toàn khả năng tận dụng Cache (sửa 1 dấu chấm trong code cũng phải tải lại hàng trăm MB thư viện) và tạo lỗ hổng bảo mật nghiêm trọng.',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Dockerfile (Tờ công thức chế biến):',
            text: 'Là một file văn bản chứa danh sách các câu lệnh theo thứ tự từ trên xuống dưới để hướng dẫn Docker cách đóng gói ứng dụng thành Image. Giống như tờ công thức dạy nấu ăn từng bước: Bước 1 lấy nồi, Bước 2 cho nước, Bước 3 bỏ gia vị, Bước 4 đun sôi.',
          },
          {
            boldPrefix: 'Image Layer & Caching (Các tầng bánh kem & Bộ nhớ đệm):',
            text: 'Mỗi dòng lệnh trong Dockerfile tạo ra một lớp (Layer) chồng lên lớp trước đó. Nếu bạn sửa dòng lệnh ở tầng thứ 5, Docker rất thông minh sẽ lấy lại nguyên vẹn 4 tầng đầu tiên từ bộ nhớ đệm (Cache) chứ không làm lại từ đầu. Giống như làm bánh kem nhiều tầng; nếu khách đổi ý muốn đổi màu kem trang trí trên đỉnh, người thợ chỉ cần sửa tầng trên cùng chứ không cần nướng lại cốt bánh ở đáy.',
          },
          {
            boldPrefix: 'Multi-stage Build (Dây chuyền sản xuất tách biệt nhà xưởng và phòng trưng bày):',
            text: 'Để biên dịch code (như Java, Go, React, TypeScript), bạn cần rất nhiều bộ công cụ nặng nề (cờ lê, búa, máy hàn). Nếu đóng gói cả đống công cụ này vào Image cuối cùng thì Image sẽ nặng hàng GB. Multi-stage Build cho phép dùng một container thứ nhất làm "Nhà xưởng" (AS builder) để biên dịch ra file chạy cuối cùng, sau đó chỉ nhặt đúng file chạy gọn nhẹ đó bỏ sang một container thứ hai siêu sạch làm "Phòng trưng bày" (AS runner) để đem đi chạy thực tế.',
          },
        ],
      },
    ],
    analogyCards: {
      title: 'Liên tưởng Hóa: Nhà xưởng Biên dịch vs. Phòng Trưng bày Siêu sạch',
      scenario: 'Quy trình đóng gói ứng dụng Node.js/TypeScript từ 850MB xuống còn dưới 65MB và chống hacker chiếm quyền.',
      mappings: [
        {
          technicalTerm: 'COPY package*.json ./ trước COPY . .',
          analogyName: 'Khóa cốt bánh thư viện vào tủ lạnh Cache',
          explanation: 'Khi sửa code JS/TS, file package.json không đổi → Docker lấy ngay tầng npm ci từ Cache trong 0 giây!',
        },
        {
          technicalTerm: 'FROM node:20-alpine AS builder',
          analogyName: 'Giai đoạn 1: Nhà xưởng chế tạo đầy máy móc',
          explanation: 'Chứa TypeScript compiler, devDependencies và mã nguồn thô để biên dịch ra thư mục thành phẩm dist/.',
        },
        {
          technicalTerm: 'FROM node:20-alpine AS runner + COPY --from=builder',
          analogyName: 'Giai đoạn 2: Phòng trưng bày sạch bóng',
          explanation: 'Bỏ lại toàn bộ rác và máy móc ở Nhà xưởng, chỉ nhặt đúng thành phẩm dist/ và node_modules production đem sang.',
        },
        {
          technicalTerm: 'USER node',
          analogyName: 'Thu hồi chìa khóa Tổng quản trị (root)',
          explanation: 'Hạ quyền ứng dụng xuống tài khoản thường để nếu hacker khai thác được lỗ hổng web cũng không thể chiếm quyền điều khiển máy chủ.',
        },
      ],
      summaryCallout: 'Quy tắc bất di bất dịch khi viết Dockerfile: Đặt những thứ ÍT THAY ĐỔI NHẤT (HĐH nền, cài thư viện) ở trên cùng, và những thứ HAY THAY ĐỔI NHẤT (COPY mã nguồn) ở dưới cùng!',
    },
    animatedFlowId: 'dockerfile-layer-cache',
    codeExamples: [
      {
        id: 'ex-1-3-dockerfile-prod',
        filename: 'Dockerfile (Multi-stage Build Chuẩn Sản Xuất)',
        language: 'dockerfile',
        purpose: 'Mục đích: Đóng gói ứng dụng siêu nhẹ (<100MB), tận dụng tối đa Cache & hạ quyền bảo mật (Trang 10–11 PDF)',
        code: `# =====================================================================
# GIAI ĐOẠN 1 (STAGE 1): NHÀ XƯỞNG BIÊN DỊCH (BUILDER)
# Liên tưởng: Đây là nhà xưởng chứa đầy máy móc nặng nề để chế tạo sản phẩm
# =====================================================================
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# MẸO TỐI ƯU CACHE QUAN TRỌNG NHẤT: Chỉ copy riêng 2 file khai báo tên thư viện vào trước!
# Vì sao? Nếu bạn chỉ sửa code JS/TS mà không cài thêm thư viện mới, file package.json không đổi
# -> Docker sẽ lấy ngay tầng Cache có sẵn của bước 'RUN npm ci' bên dưới (tiết kiệm 3-5 phút tải mạng).
COPY package.json package-lock.json ./
RUN npm ci

# Sau khi tầng thư viện đã được khóa vào Cache, mới copy toàn bộ mã nguồn vào để biên dịch
COPY . .
RUN npm run build && npm prune --production

# =====================================================================
# GIAI ĐOẠN 2 (STAGE 2): PHÒNG TRƯNG BÀY CHẠY THỰC TẾ (PRODUCTION RUNNER)
# Liên tưởng: Bỏ lại toàn bộ rác và máy móc ở Nhà xưởng, chỉ mang thành phẩm sang phòng sạch
# =====================================================================
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# NGUYÊN TẮC BẢO MẬT: Tuyệt đối không để mặc định quyền 'root' (tránh hacker chiếm quyền máy chủ)
USER node

# [COPY --from=builder]: Chỉ nhặt đúng thành phẩm đã biên dịch từ tầng 'builder' ở trên đem xuống
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/package.json ./

EXPOSE 3000
CMD ["node", "dist/server.js"]`,
        annotations: [
          { line: 5, keyword: 'FROM node:20-alpine AS builder', explanation: 'Chọn HĐH nền Alpine siêu nhẹ (5MB), đặt tên tầng là builder.' },
          { line: 6, keyword: 'WORKDIR /usr/src/app', explanation: 'Tạo và bước vào thư mục làm việc trong Container (như lệnh cd).' },
          { line: 11, keyword: 'COPY package.json package-lock.json ./', explanation: 'Tách riêng file khai báo thư viện để khóa bộ nhớ đệm Cache cho bước cài đặt.' },
          { line: 12, keyword: 'RUN npm ci', explanation: 'Thực thi lệnh cài đặt thư viện chuẩn xác theo lockfile trong lúc đóng gói Image.' },
          { line: 15, keyword: 'COPY . .', explanation: 'Dấu chấm 1: thư mục máy thật | Dấu chấm 2: thư mục WORKDIR trong Container.' },
          { line: 27, keyword: 'USER node', explanation: 'Hạ quyền từ root xuống tài khoản thường có tên là node để đảm bảo an toàn bảo mật.' },
          { line: 30, keyword: 'COPY --from=builder --chown=node:node', explanation: 'Chỉ nhặt đúng thành phẩm từ tầng builder sang và cấp quyền sở hữu file cho tài khoản node.' },
          { line: 34, keyword: 'EXPOSE 3000', explanation: 'Nhãn ghi chú cho đồng nghiệp biết ứng dụng lắng nghe ở cổng 3000.' },
          { line: 35, keyword: 'CMD ["node", "dist/server.js"]', explanation: 'Lệnh bấm nút khởi động chính thức ở chế độ tiền cảnh (PID 1) ngay khi giải nén Container.' },
        ],
      },
    ],
    gotchas: [
      {
        title: 'Đặt lệnh COPY . . phía trên lệnh RUN npm install / pip install',
        severity: 'critical',
        symptom: 'Mỗi lần gõ lệnh docker build đều mất 5–10 phút tải lại toàn bộ thư viện dù bạn chỉ sửa đúng 1 dòng chữ trong file code.',
        rootCause: 'Khi COPY . . nằm ở đầu, bất kỳ file code nào thay đổi cũng làm tầng COPY . . bị đổi mã băm, khiến toàn bộ các tầng bên dưới nó (bao gồm RUN npm install) bị hủy Cache hoàn toàn.',
        wrongApproach: 'COPY . .\nRUN npm install',
        rightApproach: 'COPY package.json package-lock.json ./\nRUN npm ci\nCOPY . .',
      },
    ],
    relatedIncidentId: 'incident-1-local-docker',
    relatedPracticeId: 'prac-1-dockerfile',
  },

  {
    id: 'lesson-1-4-volumes-network-compose',
    stageId: 'stage-1',
    level: 'basic',
    order: 4,
    title: 'Bài 1.4: Lưu trữ Bền vững (Volume vs. Bind Mount), Mạng Nội bộ & Bản giao hưởng Docker Compose',
    shortDescription: 'Làm sao để xóa sạch Container mà dữ liệu khách hàng trong PostgreSQL vẫn nguyên vẹn 100%? Cách bật cả dàn nhạc Web + DB + Redis nối mạng tự động chỉ bằng 1 lệnh.',
    estimatedMinutes: 20,
    theorySections: [
      {
        heading: '3.1. Docker Volume vs. Bind Mount & Docker Network',
        paragraphs: [
          'Khi một Container bị xóa, toàn bộ dữ liệu phát sinh bên trong lớp ghi tạm của nó sẽ biến mất hoàn toàn. Để giữ lại dữ liệu quan trọng (như dữ liệu Database) và kết nối các container với nhau, Docker cung cấp:',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Docker Volume (Két sắt gửi ngân hàng):',
            text: 'Giống như chiếc "Két sắt chuyên dụng" do chính Docker quản lý nằm ở khu vực an toàn trên ổ cứng máy chủ. Container bị đập bỏ thì két sắt vẫn còn nguyên, khi tạo container mới chỉ cần cắm lại chìa khóa vào két sắt cũ.',
          },
          {
            boldPrefix: 'Bind Mount (Cửa thông phòng):',
            text: 'Giống như một "Cửa thông phòng" nối trực tiếp một thư mục bất kỳ trên máy tính của bạn vào thẳng bên trong Container. Bạn sửa code trên máy tính thì trong Container thay đổi ngay lập tức (rất chuộng dùng khi đang lập trình).',
          },
          {
            boldPrefix: 'Docker Network (Hệ thống tổng đài nội bộ):',
            text: 'Mặc định các container nằm trong một mạng ảo gọi là Bridge — giống như các phòng ban kết nối chung vào một cục phát Wi-Fi nội bộ, có thể gọi tên nhau trực tiếp mà người ngoài Internet không thể tự ý xông vào nếu bạn không mở cổng (Port Mapping -p).',
          },
          {
            boldPrefix: 'Docker Compose (Bản nhạc giao hưởng cho máy cá nhân):',
            text: 'Thay vì phải gõ 5 câu lệnh dài dòng để bật từng container (Web, Database, Cache, Worker, Nginx) và nối mạng cho chúng, bạn viết tất cả vào 1 file docker-compose.yml và gõ đúng 1 lệnh docker compose up để cả dàn nhạc cùng tấu lên một lúc.',
          },
        ],
      },
    ],
    analogyCards: {
      title: 'Liên tưởng Hóa: Két sắt Ngân hàng, Cửa thông phòng & Bản nhạc Giao hưởng',
      scenario: 'Vận hành hệ sinh thái 3 dịch vụ (Backend API + PostgreSQL + Redis) trên máy cá nhân.',
      mappings: [
        {
          technicalTerm: 'pgdata:/var/lib/postgresql/data',
          analogyName: 'Cắm chìa khóa vào Két sắt pgdata bên ngoài',
          explanation: 'Dù bạn gõ docker compose down xóa hết các container, dữ liệu bảng biểu trong két sắt pgdata vẫn an toàn 100%.',
        },
        {
          technicalTerm: 'ports: ["8080:3000"]',
          analogyName: 'Mở cửa sổ giao dịch (Cổng máy thật : Cổng Container)',
          explanation: 'Người ngoài gõ localhost:8080 trên máy thật sẽ được dẫn thẳng vào cổng 3000 của ứng dụng bên trong Container.',
        },
        {
          technicalTerm: 'DB_HOST=postgres-db',
          analogyName: 'Danh bạ điện thoại nội bộ tự động (Service DNS)',
          explanation: 'Trong cùng mạng shop-network, Backend gọi thẳng tên dịch vụ "postgres-db" làm địa chỉ mạng mà không cần tra IP.',
        },
      ],
      summaryCallout: 'Cẩn thận với lệnh docker compose down -v (có cờ -v): cờ -v nghĩa là đập bỏ luôn cả chiếc Két sắt Volume! Khi tắt bật thông thường chỉ dùng docker compose down.',
    },
    animatedFlowId: 'docker-volume-vs-bind',
    codeExamples: [
      {
        id: 'ex-1-4-docker-compose',
        filename: 'docker-compose.yml (Chuẩn Môi Trường Local)',
        language: 'yaml',
        purpose: 'Mục đích: Bật cùng lúc 3 Container (Web + DB + Redis) nối mạng tự động bằng 1 lệnh (Trang 12–13 PDF)',
        code: `services:
  # ---------------- CONTAINER 1: ỨNG DỤNG BACKEND ----------------
  backend-api:
    build:
      context: .
      dockerfile: Dockerfile       # <-- Bảo Docker tự đọc file Dockerfile ở trên để đóng gói thành Image
    container_name: shop-backend-api
    ports:
      - "8080:3000"                # <-- [CỔNG MÁY THẬT : CỔNG CONTAINER]: Gõ localhost:8080 sẽ vào cổng 3000 của App
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres-db        # <-- ĐIỂM KỲ DIỆU: Gọi thẳng tên service 'postgres-db' làm địa chỉ mạng!
      - DB_PORT=5432
      - REDIS_HOST=redis-cache
    depends_on:
      - postgres-db                # <-- [depends_on]: Bắt buộc bật Database và Redis lên trước rồi mới bật Backend
      - redis-cache
    networks:
      - shop-network

  # ---------------- CONTAINER 2: CƠ SỞ DỮ LIỆU POSTGRESQL ----------------
  postgres-db:
    image: postgres:16-alpine      # <-- Dùng luôn Image có sẵn trên Docker Hub, không cần tự viết Dockerfile
    container_name: shop-postgres-db
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secretpassword
      - POSTGRES_DB=shopdb
    volumes:
      # Liên tưởng: Nối thư mục chứa dữ liệu của Postgres vào "Két sắt pgdata" bên ngoài.
      # Nhờ dòng này, dù bạn xóa sạch Container thì dữ liệu khách hàng vẫn nguyên vẹn 100%!
      - pgdata:/var/lib/postgresql/data
    networks:
      - shop-network

  # ---------------- CONTAINER 3: BỘ NHỚ ĐỆM REDIS ----------------
  redis-cache:
    image: redis:7-alpine
    container_name: shop-redis-cache
    networks:
      - shop-network

volumes:
  pgdata:                          # <-- Khai báo tạo chiếc "Két sắt" lưu trữ tên là pgdata trên ổ cứng máy chủ

networks:
  shop-network:                    # <-- Khai báo tạo mạng Wi-Fi nội bộ cho 3 anh em nói chuyện với nhau`,
        annotations: [
          { line: 9, keyword: '"8080:3000"', explanation: 'Ánh xạ cổng 8080 trên máy tính cá nhân vào cổng 3000 bên trong container backend-api.' },
          { line: 12, keyword: 'DB_HOST=postgres-db', explanation: 'Gọi thẳng tên service postgres-db nhờ cơ chế phân giải DNS tự động của mạng shop-network.' },
          { line: 15, keyword: 'depends_on:', explanation: 'Đảm bảo thứ tự khởi chạy: bật Database và Redis trước rồi mới bật Backend.' },
          { line: 32, keyword: 'pgdata:/var/lib/postgresql/data', explanation: 'Gắn chiếc két sắt pgdata vào thư mục lưu dữ liệu thực tế của PostgreSQL để bảo toàn dữ liệu.' },
        ],
      },
    ],
    gotchas: [
      {
        title: 'Trong Container Backend lại cấu hình DB_HOST=localhost',
        severity: 'critical',
        symptom: 'Backend báo lỗi ECONNREFUSED 127.0.0.1:5432 dù container Postgres đang chạy xanh mượt bên cạnh.',
        rootCause: 'Do Linux Network Namespace, "localhost" bên trong container Backend chính là bản thân container Backend đó chứ không phải máy chủ hay container Postgres!',
        wrongApproach: 'DB_HOST=localhost hoặc DB_HOST=127.0.0.1',
        rightApproach: 'DB_HOST=postgres-db (Dùng đúng tên service khai báo trong docker-compose.yml)',
      },
    ],
    relatedPracticeId: 'prac-2-compose',
  },

  {
    id: 'lesson-2-1-k8s-cluster-architecture',
    stageId: 'stage-2',
    level: 'basic',
    order: 5,
    title: 'Bài 2.1: Kiến trúc Cụm Kubernetes — Ban Giám đốc (Control Plane) & Nhà xưởng (Worker Nodes)',
    shortDescription: 'Khám phá bộ máy Công ty Vận tải Đa quốc gia K8s: 4 phòng ban tại Tổng hành dinh (API Server, etcd, Scheduler, Controller) và 3 nhân sự thường trực tại mỗi Nhà xưởng.',
    estimatedMinutes: 20,
    theorySections: [
      {
        heading: '3.2. Khối Tổng hành dinh điều hành (Control Plane — Ban Giám đốc)',
        paragraphs: [
          'Một cụm Kubernetes (Cluster) được ví như một Công ty Vận tải Đa quốc gia gồm hai khối: Khối Tổng hành dinh điều hành (Control Plane) và Khối các Chi nhánh nhà xưởng trực tiếp làm việc (Worker Nodes). Tại Tổng hành dinh có 4 phòng ban cốt lõi:',
        ],
        bulletPoints: [
          {
            boldPrefix: 'kube-apiserver (Quầy Lễ tân & Cổng giao tiếp duy nhất):',
            text: 'Mọi mệnh lệnh từ kỹ sư hay báo cáo từ các máy chủ đều bắt buộc phải đi qua bàn lễ tân này để kiểm tra giấy tờ bảo mật trước khi xử lý.',
          },
          {
            boldPrefix: 'etcd (Két sắt lưu trữ Sổ cái tối mật):',
            text: 'Cơ sở dữ liệu lưu trữ toàn bộ trạng thái và bản thiết kế của cả cụm K8s. Nếu mất etcd, cả cụm K8s sẽ "mất trí nhớ".',
          },
          {
            boldPrefix: 'kube-scheduler (Trưởng phòng Điều phối nhân sự):',
            text: 'Khi có yêu cầu chạy một Pod mới, vị trưởng phòng này sẽ nhìn khắp các máy chủ Worker xem máy nào đang dư RAM, dư CPU, phù hợp điều kiện nhất để phân công Pod đó về máy chủ đó.',
          },
          {
            boldPrefix: 'kube-controller-manager (Đội Thanh tra giám sát 24/7):',
            text: 'Liên tục đi tuần tra đối chiếu thực tế với bản thiết kế trong etcd. Phát hiện thiếu Pod nào là lập tức yêu cầu tạo bù ngay.',
          },
        ],
      },
      {
        heading: '3.2. Khối Các Nhà xưởng thực thi (Worker Nodes)',
        paragraphs: [
          'Worker Node là các máy chủ vật lý hoặc máy ảo chịu trách nhiệm chạy ứng dụng thực tế. Trên mỗi nhà xưởng luôn có 3 nhân sự thường trực:',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Kubelet (Quản đốc phân xưởng):',
            text: 'Nằm vùng tại từng máy chủ Worker, nhận lệnh trực tiếp từ Ban giám đốc (API Server), ra lệnh cho Container Runtime giải nén container và báo cáo tình hình sức khỏe của xưởng về trung tâm.',
          },
          {
            boldPrefix: 'Kube-proxy (Nhân viên trực tổng đài mạng tại xưởng):',
            text: 'Quản lý bảng chỉ đường mạng (iptables/IPVS) trên mỗi máy chủ, giúp các gói tin tìm đến đúng địa chỉ Pod dù Pod đó nằm ở máy chủ nào.',
          },
          {
            boldPrefix: 'Container Runtime - Containerd (Người công nhân vận hành máy):',
            text: 'Trực tiếp kéo Image về và bật/tắt Container.',
          },
        ],
      },
    ],
    analogyCards: {
      title: 'Sơ đồ Tổ chức Công ty Vận tải Đa quốc gia Kubernetes',
      scenario: 'Cách một mệnh lệnh YAML được phê duyệt tại Tổng hành dinh và thi công tại Nhà xưởng.',
      mappings: [
        {
          technicalTerm: 'kube-apiserver',
          analogyName: 'Quầy Lễ tân Trung tâm',
          explanation: 'Cổng giao tiếp duy nhất kiểm duyệt mọi lệnh YAML; không ai được tự ý đi tắt vào kho hay xuống xưởng.',
        },
        {
          technicalTerm: 'etcd',
          analogyName: 'Két sắt lưu trữ Sổ cái tối mật',
          explanation: 'Lưu toàn bộ trạng thái cụm; bắt buộc phải sao lưu (snapshot) định kỳ.',
        },
        {
          technicalTerm: 'kube-scheduler',
          analogyName: 'Trưởng phòng Điều phối Nhân sự',
          explanation: 'Chỉ làm nhiệm vụ chấm điểm và chọn máy chủ còn dư RAM/CPU cho Pod, chứ không trực tiếp bật Pod.',
        },
        {
          technicalTerm: 'Kubelet',
          analogyName: 'Quản đốc Phân xưởng tại từng Node',
          explanation: 'Nhận lệnh từ API Server, sai khiến Containerd bật Pod và gửi nhịp tim (Heartbeat) báo cáo sức khỏe máy chủ.',
        },
      ],
      summaryCallout: 'Nếu Quản đốc Kubelet trên một máy chủ ngừng gửi báo cáo về Quầy lễ tân API Server, máy chủ đó sẽ bị đánh dấu là NotReady và sau 5 phút K8s sẽ tự động di tản các Pod sang máy chủ khác!',
    },
    animatedFlowId: 'k8s-control-loop',
    codeExamples: [
      {
        id: 'ex-2-1-cluster-inspect',
        filename: 'inspect-cluster-architecture.sh',
        language: 'bash',
        purpose: 'Các câu lệnh quan sát Tổng hành dinh Control Plane và danh sách Nhà xưởng Worker Nodes',
        code: `# 1. Xem danh sách toàn bộ các máy chủ Worker Nodes, địa chỉ IP và phiên bản nhân
kubectl get nodes -o wide

# 2. Quan sát các phòng ban của Ban Giám Đốc (Control Plane) nằm trong namespace kube-system
kubectl get pods -n kube-system -o wide

# 3. Xem chi tiết sức khỏe, dung lượng CPU/RAM còn dư của một máy chủ Worker
kubectl describe node worker-node-1`,
        annotations: [
          { line: 2, keyword: 'kubectl get nodes -o wide', explanation: 'Kiểm tra cột STATUS của từng máy chủ xem đang Ready hay NotReady.' },
          { line: 5, keyword: '-n kube-system', explanation: 'Nơi cư trú của kube-apiserver, etcd, kube-scheduler, kube-controller-manager và kube-proxy.' },
          { line: 8, keyword: 'kubectl describe node', explanation: 'Xem bảng Allocatable (CPU/RAM thực tế có thể cấp) và danh sách các Pod đang chạy trên máy chủ đó.' },
        ],
      },
    ],
    gotchas: [
      {
        title: 'Nhầm tưởng kube-scheduler là người trực tiếp tải Image và bật Container',
        severity: 'warning',
        symptom: 'Khi Pod bị lỗi ImagePullBackOff, người mới lại đi kiểm tra log của kube-scheduler.',
        rootCause: 'Scheduler chỉ ghi tên máy chủ được chọn (nodeName) vào hồ sơ Pod. Việc kéo Image và bật Container là do Kubelet + Containerd trên máy chủ Worker thực hiện.',
        wrongApproach: 'Tìm lỗi kéo Image ở kube-scheduler',
        rightApproach: 'Chạy kubectl describe pod [TÊN_POD] để đọc báo cáo Events từ Kubelet trên Worker Node',
      },
    ],
    relatedIncidentId: 'incident-5-pending',
  },

  {
    id: 'lesson-2-2-pod-deployment-service',
    stageId: 'stage-2',
    level: 'basic',
    order: 6,
    title: 'Bài 2.2: Các Thực thể Cốt lõi — Pod (Căn hộ), Deployment (Quản lý ca trực) & Service (Tổng đài cố định)',
    shortDescription: 'Vì sao không bao giờ tạo Pod lẻ tẻ bằng tay? Cách kết nối chuỗi mắt xích sống còn Deployment → Pod ← Service thông qua Thẻ tên (Labels & Selectors).',
    estimatedMinutes: 25,
    theorySections: [
      {
        heading: '3.3. Giải mã Pod, Deployment & ReplicaSet',
        paragraphs: [
          'Trong Kubernetes, bạn làm việc thông qua các Thực thể (Objects) chuẩn mực:',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Pod (Vỏ kén / Căn hộ chung cư nhỏ nhất):',
            text: 'Kubernetes không quản lý trực tiếp từng Container lẻ tẻ, mà bọc một (hoặc một vài) Container có quan hệ mật thiết vào trong một chiếc vỏ gọi là Pod. Nếu Container là một người thuê nhà, thì Pod là một "Căn hộ khép kín". Thông thường mỗi căn hộ chỉ có 1 người ở (1 Pod = 1 Container). Đôi khi có thêm 1 người trợ lý ở cùng căn hộ đó (gọi là Sidecar Container, ví dụ người chuyên đi thu gom log). Những người trong cùng một căn hộ Pod sẽ dùng chung một số nhà (chung địa chỉ IP) và dùng chung tủ đồ (chung ổ đĩa lưu trữ).',
          },
          {
            boldPrefix: 'Deployment & ReplicaSet (Hợp đồng Quản lý Nhân sự & Quản lý Ca trực):',
            text: 'Bạn hầu như không bao giờ tạo Pod lẻ tẻ bằng tay, vì nếu Pod đó chết, nó sẽ chết luôn không ai cứu. Thay vào đó, bạn tạo một Deployment. Deployment quản lý ReplicaSet để đảm bảo lúc nào cũng duy trì đúng số lượng Pod bạn yêu cầu, đồng thời hỗ trợ nâng cấp phiên bản mới theo kiểu cuốn chiếu (Rolling Update): bật 1 Pod phiên bản mới lên chạy ổn định rồi mới tắt 1 Pod phiên bản cũ đi, lặp lại cho đến hết để người dùng không hề thấy web bị sập một giây nào.',
          },
        ],
      },
      {
        heading: '3.3. Service (Tổng đài Số điện thoại Cố định) & ConfigMap / Secret',
        paragraphs: [
          'Các Pod trong K8s có tính chất "sinh tử vô thường" — khi một Pod chết đi và được Deployment tạo lại bằng một Pod mới, Pod mới sẽ mang một địa chỉ IP hoàn toàn mới. Nếu ứng dụng Frontend gọi trực tiếp vào IP của Pod Backend thì mỗi lần Pod Backend khởi động lại là Frontend mất liên lạc!',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Service (Số điện thoại tổng đài cố định 1900-xxxx):',
            text: 'Dù các nhân viên trực điện thoại (Pods) phía sau có đổi ca hay thay người mới liên tục, khách hàng chỉ cần gọi vào đúng một số tổng đài Service duy nhất, tổng đài sẽ tự tìm đến đúng các nhân viên đang trực thông qua thẻ tên (Labels & Selectors). Gồm 3 loại: ClusterIP (nội bộ), NodePort (mở cổng 30000–32767 trên tường rào máy chủ) và LoadBalancer (thuê thiết bị cân bằng tải đám mây).',
          },
          {
            boldPrefix: 'ConfigMap & Secret (Bảng thông báo chung & Phong bì mật):',
            text: 'K8s cung cấp ConfigMap (chứa cấu hình thông thường như PORT, LOG_LEVEL) và Secret (chứa mật khẩu, khóa API nhạy cảm) để tiêm thẳng vào trong Pod lúc Pod bắt đầu chạy mà không cần nén cứng vào Docker Image.',
          },
        ],
      },
    ],
    analogyCards: {
      title: 'Liên tưởng Hóa: Căn hộ Khép kín, Hợp đồng Nhân sự & Tổng đài 1900',
      scenario: 'Cách các đối tượng trong Kubernetes nhận diện và phối hợp với nhau qua Thẻ tên (Labels).',
      mappings: [
        {
          technicalTerm: 'Pod (1 Pod = 1 App + Sidecar)',
          analogyName: 'Căn hộ chung cư nhỏ nhất (Chung IP & Tủ đồ)',
          explanation: 'Đơn vị nhỏ nhất trên K8s; mang tính chất dùng một lần (sinh tử vô thường).',
        },
        {
          technicalTerm: 'Deployment (replicas: 3)',
          analogyName: 'Hợp đồng cam kết quân số & Nâng cấp cuốn chiếu',
          explanation: 'Chết 1 Pod tự đẻ bù 1 Pod mới; nâng cấp từ v1 lên v2 không gây gián đoạn (Zero Downtime).',
        },
        {
          technicalTerm: 'Service (selector: app=shop-web)',
          analogyName: 'Tổng đài điện thoại cố định dò theo Thẻ tên',
          explanation: 'Cung cấp IP/DNS tĩnh và chia tải đều vào cổng targetPort của các Pod khớp nhãn.',
        },
        {
          technicalTerm: 'ConfigMap & Secret',
          analogyName: 'Bảng thông báo dán tường & Phong bì niêm phong',
          explanation: 'Giúp dùng chung 1 Docker Image duy nhất cho cả 3 môi trường Dev, Staging và Production.',
        },
      ],
      summaryCallout: 'Mắt xích quan trọng số 1 trong YAML của K8s là Thẻ tên (Labels): Nhãn metadata.labels của Pod BẮT BUỘC phải khớp từng chữ cái với matchLabels của Deployment và selector của Service!',
    },
    animatedFlowId: 'k8s-network-traffic',
    codeExamples: [
      {
        id: 'ex-2-2-manifest-core',
        filename: 'k8s-production-manifest.yaml (Phần ConfigMap + Deployment + Service)',
        language: 'yaml',
        purpose: 'Mẫu khai báo chuẩn thực chiến kết nối ConfigMap, Deployment (3 Pods) và Service (Trang 14–15 PDF)',
        code: `# KHỐI 1 — CONFIGMAP: Bảng thông báo chứa các biến cấu hình không nhạy cảm
apiVersion: v1
kind: ConfigMap
metadata:
  name: web-app-config
  namespace: production
data:
  PORT: "3000"
  LOG_LEVEL: "info"
  CACHE_TTL: "3600"
---
# KHỐI 2 — DEPLOYMENT: Hợp đồng duy trì quân số & nâng cấp cuốn chiếu
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-deployment
  namespace: production
spec:
  replicas: 3                        # <-- Cam kết lúc nào cũng phải có đúng 3 Pod sống
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                    # <-- Cho phép bật dư thêm tối đa 1 Pod (thành 4 Pod) lúc chuyển giao
      maxUnavailable: 0              # <-- Tuyệt đối không được làm hụt quân số dưới 3 Pod ở bất kỳ giây nào
  selector:
    matchLabels:
      app: shop-web                  # <-- [QUAN TRỌNG]: Dây xích nối Deployment với các Pod mang thẻ tên 'app: shop-web'
  template:
    metadata:
      labels:
        app: shop-web                # <-- Thẻ tên dán lên ngực áo của Pod (BẮT BUỘC khớp với matchLabels ở trên)
    spec:
      containers:
        - name: web-container
          image: myregistry.io/shop-web:v1.2.0
          ports:
            - containerPort: 3000    # <-- Cổng mà code bên trong Container đang lắng nghe
          envFrom:
            - configMapRef:
                name: web-app-config # <-- Bê toàn bộ biến trong ConfigMap ở Khối 1 tiêm vào Pod
---
# KHỐI 3 — SERVICE: Số điện thoại tổng đài cố định
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: shop-web                    # <-- Tổng đài tìm các Pod mang thẻ tên 'app: shop-web'
  ports:
    - port: 80                       # <-- Số tổng đài nội bộ (cổng của Service)
      targetPort: 3000               # <-- Cổng thực tế của Container bên trong Pod`,
        annotations: [
          { line: 19, keyword: 'replicas: 3', explanation: 'Cam kết duy trì 3 bản sao Pod hoạt động liên tục.' },
          { line: 23, keyword: 'maxSurge: 1 / maxUnavailable: 0', explanation: 'Cấu hình nâng cấp cuốn chiếu Zero-Downtime: bật 1 Pod mới khỏe rồi mới tắt 1 Pod cũ.' },
          { line: 27, keyword: 'app: shop-web', explanation: 'Nhãn liên kết sống còn giữa Deployment, Pod template và Service selector.' },
          { line: 39, keyword: 'configMapRef: name: web-app-config', explanation: 'Tiêm toàn bộ các biến PORT, LOG_LEVEL, CACHE_TTL vào Pod làm biến môi trường.' },
          { line: 54, keyword: 'port: 80 / targetPort: 3000', explanation: 'Gói tin gọi vào cổng 80 của Service sẽ được chuyển tiếp tới cổng 3000 của Pod.' },
        ],
      },
    ],
    gotchas: [
      {
        title: 'Lệch nhãn Selector giữa Service và Pod (Selector Mismatch)',
        severity: 'critical',
        symptom: 'Tất cả Pod đều báo Running xanh mượt, nhưng gọi qua Service hoặc Ingress thì bị từ chối kết nối hoàn toàn.',
        rootCause: 'Trong Pod dán nhãn app: shop-web nhưng trong Service mục selector lại gõ nhầm thành app: web-shop, khiến danh bạ ENDPOINTS của Service trống rỗng (<none>).',
        wrongApproach: 'Pod label: app: shop-web | Service selector: app: web-shop',
        rightApproach: 'Chạy kubectl get endpoints [TÊN_SERVICE] để kiểm tra và sửa nhãn khớp nhau 100%',
      },
    ],
    relatedIncidentId: 'incident-7-network-selector',
    relatedPracticeId: 'prac-3-k8s-deployment',
  },

  {
    id: 'lesson-3-1-ingress-storage-statefulset',
    stageId: 'stage-3',
    level: 'advanced',
    order: 7,
    title: 'Bài 3.1: Vận hành Doanh nghiệp — Lễ tân Ingress SSL/TLS, Kho đất PV/PVC/StorageClass & StatefulSet',
    shortDescription: 'Làm sao định tuyến 20 tên miền HTTPS chỉ bằng 1 cổng chính duy nhất? Cách cấp phát ổ cứng tự động trên Cloud và vận hành Database phân tán với StatefulSet.',
    estimatedMinutes: 25,
    theorySections: [
      {
        heading: '3.3. Ingress & Ingress Controller (Quầy Lễ tân Tòa nhà Thông minh)',
        paragraphs: [
          'Nếu bạn có 20 dịch vụ web khác nhau mà dùng 20 cái Service kiểu LoadBalancer, bạn sẽ phải thuê 20 thiết bị cân bằng tải đám mây vô cùng đắt đỏ. Thay vào đó, bạn chỉ cần đặt duy nhất một Ingress Controller (như Nginx hoặc Traefik) ở cổng chính như một "Quầy Lễ tân Tòa nhà".',
          'Khi khách hàng vào qua tên miền api.congty.com, lễ tân chỉ vào Service Backend; khi khách vào shop.congty.com/khuyen-mai, lễ tân chỉ vào Service Khuyến mãi, đồng thời lễ tân cũng lo luôn việc kiểm tra chứng chỉ bảo mật HTTPS (SSL/TLS).',
        ],
      },
      {
        heading: '3.3. PV, PVC, StorageClass & StatefulSet vs. DaemonSet',
        paragraphs: [
          'Trong K8s, việc quản lý ổ cứng và ứng dụng có trạng thái (Database) được thiết kế vô cùng chặt chẽ:',
        ],
        bulletPoints: [
          {
            boldPrefix: 'PersistentVolume (PV) — Miếng đất thực tế:',
            text: 'Là ổ đĩa cứng vật lý hoặc ổ đĩa đám mây đã được chuẩn bị trong kho.',
          },
          {
            boldPrefix: 'PersistentVolumeClaim (PVC) — Tờ đơn xin cấp ổ cứng:',
            text: 'Lập trình viên đệ trình lên K8s ("Tôi xin 1 ổ đĩa 20GB tốc độ cao cho Pod Database"). K8s tự lấy tờ đơn PVC này ghép nối với một ổ đĩa PV phù hợp.',
          },
          {
            boldPrefix: 'StorageClass — Hệ thống chia lô cấp đất tự động:',
            text: 'Quản trị viên không cần tạo sẵn từng ổ đĩa PV bằng tay nữa; hễ lập trình viên nộp đơn PVC xin 20GB, StorageClass tự động gọi API lên AWS/GCP cắt ngay một ổ đĩa 20GB mới tinh và gắn vào Pod trong vài giây.',
          },
          {
            boldPrefix: 'StatefulSet (Đội nhân sự Định danh cố định) vs. DaemonSet (Bảo vệ trực mọi tầng):',
            text: 'Deployment coi mọi Pod như đàn gia súc vô danh (web-a8f9x). Nhưng Database phân tán (MySQL Cluster, Kafka, Elasticsearch) đòi hỏi mỗi Pod phải có tên gọi cố định db-0, db-1, db-2 và ổ cứng riêng biệt — đó là lúc dùng StatefulSet. Trong khi đó, DaemonSet đảm bảo trên mỗi máy chủ Worker Node luôn có đúng 1 Pod chạy ngầm (như gắn camera an ninh / nhân viên thu gom log ở mỗi tầng lầu).',
          },
        ],
      },
    ],
    analogyCards: {
      title: 'Liên tưởng Hóa: Lễ tân Tòa nhà, Hệ thống Chia lô Tự động & Đội nhân sự Định danh',
      scenario: 'Quản lý tên miền HTTPS và lưu trữ dữ liệu bền vững cho hệ thống doanh nghiệp.',
      mappings: [
        {
          technicalTerm: 'Ingress Controller',
          analogyName: 'Quầy Lễ tân Tòa nhà Thông minh',
          explanation: 'Tiết kiệm hàng chục thiết bị LoadBalancer đám mây bằng cách gom toàn bộ tên miền & SSL/TLS về 1 cửa ngõ.',
        },
        {
          technicalTerm: 'PVC + StorageClass + PV',
          analogyName: 'Phiếu xin đất + Máy chia lô tự động + Miếng đất thực tế',
          explanation: 'Tách biệt hoàn toàn việc xin dung lượng của Developer với hạ tầng phần cứng bên dưới.',
        },
        {
          technicalTerm: 'StatefulSet (db-0, db-1)',
          analogyName: 'Nhân sự có số thẻ định danh & Tủ khóa cố định',
          explanation: 'Dù db-0 có sập và sống lại ở máy chủ khác, nó vẫn giữ nguyên tên db-0 và gắn lại đúng chiếc ổ cứng cũ của riêng nó.',
        },
        {
          technicalTerm: 'DaemonSet',
          analogyName: 'Camera an ninh / Nhân viên thu gom rác ở mỗi tầng lầu',
          explanation: 'Cứ thêm 1 máy chủ Worker Node mới vào cụm là K8s tự động cử ngay 1 Pod giám sát/thu gom log tới máy đó.',
        },
      ],
      summaryCallout: 'Quy tắc chọn Object: Web/API không lưu trạng thái → Dùng Deployment. Database/Kafka cần tên và ổ cứng cố định → Dùng StatefulSet. Agent gom log/giám sát mọi máy chủ → Dùng DaemonSet.',
    },
    animatedFlowId: 'pvc-storage-dynamic',
    codeExamples: [
      {
        id: 'ex-3-1-ingress-pvc',
        filename: 'ingress-and-pvc-production.yaml',
        language: 'yaml',
        purpose: 'Cấu hình Lễ tân Ingress HTTPS và Tờ đơn xin cấp ổ cứng động PVC',
        code: `# 1. INGRESS: Quầy lễ tân định tuyến tên miền HTTPS vào Tổng đài Service
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ingress
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - shop.congty.com
      secretName: shop-tls-cert
  rules:
    - host: shop.congty.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-app-service
                port:
                  number: 80
---
# 2. PVC: Tờ đơn xin cấp ổ cứng 20GB tốc độ cao thông qua StorageClass
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data-pvc
  namespace: production
spec:
  storageClassName: fast-ssd-sc      # <-- Hệ thống chia lô tự động cắt ổ đĩa SSD
  accessModes:
    - ReadWriteOnce                  # <-- Ổ đĩa gắn độc quyền cho 1 Node tại 1 thời điểm
  resources:
    requests:
      storage: 20Gi                  # <-- Dung lượng ổ cứng yêu cầu`,
        annotations: [
          { line: 10, keyword: 'ingressClassName: nginx', explanation: 'Chỉ định sử dụng Nginx Ingress Controller làm lễ tân đứng ở cổng chính.' },
          { line: 11, keyword: 'tls:', explanation: 'Kích hoạt bảo mật HTTPS và lưu chứng chỉ SSL vào Secret shop-tls-cert.' },
          { line: 22, keyword: 'name: web-app-service', explanation: 'Khi khách gõ shop.congty.com, lễ tân chuyển tiếp vào cổng 80 của Tổng đài web-app-service.' },
          { line: 34, keyword: 'storageClassName: fast-ssd-sc', explanation: 'Yêu cầu StorageClass tự động cắt một ổ đĩa SSD 20GB mà không cần Admin tạo PV thủ công.' },
        ],
      },
    ],
    gotchas: [
      {
        title: 'Dùng Deployment chung 1 PVC ReadWriteOnce cho nhiều bản sao Database',
        severity: 'critical',
        symptom: 'Khi mở rộng Database lên 2 Pod ở 2 máy chủ khác nhau, Pod thứ 2 bị kẹt lỗi Multi-Attach error for volume hoặc làm hỏng dữ liệu ổ cứng.',
        rootCause: 'Các bản sao trong Deployment dùng chung 1 tờ đơn PVC, trong khi Database đòi hỏi mỗi bản sao phải có ổ cứng độc lập.',
        wrongApproach: 'Dùng Deployment cho cụm Database nhiều bản sao',
        rightApproach: 'Dùng StatefulSet kèm volumeClaimTemplates để mỗi Pod (db-0, db-1) được cấp riêng 1 PVC độc lập',
      },
    ],
    relatedIncidentId: 'incident-5-pending',
  },

  {
    id: 'lesson-3-2-probes-resources-hpa',
    stageId: 'stage-3',
    level: 'advanced',
    order: 8,
    title: 'Bài 3.2: Ba Bài Khám Y Tế Định Kỳ (Probes), Định mức Điện Nước (Requests/Limits) & Co Giãn Tự Động HPA',
    shortDescription: 'Làm sao phát hiện Container báo Running nhưng bên trong đã chết lâm sàng (Deadlock)? Cách thiết lập Bác sĩ trực Probes và điều động nhân viên thời vụ HPA lúc 0h00.',
    estimatedMinutes: 25,
    theorySections: [
      {
        heading: '3.3. Probes — Startup, Liveness, Readiness (Ba bài kiểm tra y tế định kỳ)',
        paragraphs: [
          'Nhiều khi Container vẫn báo trạng thái Running (đang chạy), nhưng thực chất ứng dụng bên trong đã bị treo cứng (Deadlock) không phản hồi được nữa. K8s cung cấp 3 cơ chế khám sức khỏe tự động:',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Startup Probe (Kiểm tra khởi động):',
            text: 'Dành cho các ứng dụng nặng (như Java Spring Boot cũ) cần 1–2 phút để khởi động xong. Khi Startup Probe báo thành công thì hai bài kiểm tra dưới mới bắt đầu hoạt động.',
          },
          {
            boldPrefix: 'Liveness Probe (Bắt mạch sống chết):',
            text: 'K8s định kỳ gõ cửa hỏi "Còn sống không?". Nếu ứng dụng bị treo không trả lời sau 3 lần hỏi, K8s kết luận ứng dụng đã chết lâm sàng và lập tức khởi động lại (Restart) container đó.',
          },
          {
            boldPrefix: 'Readiness Probe (Kiểm tra sẵn sàng tiếp khách):',
            text: 'Ứng dụng vẫn sống nhưng đang bận tải dữ liệu lớn hoặc đang mất kết nối tạm thời tới Database. Khi Readiness Probe báo thất bại, K8s KHÔNG giết Pod, mà chỉ tạm thời rút tên Pod đó khỏi tổng đài Service để ngưng gửi khách hàng mới vào, đợi khi nào Pod khỏe lại mới cho nhận khách tiếp.',
          },
        ],
      },
      {
        heading: '3.3. HPA — Horizontal Pod Autoscaler (Cơ chế điều động nhân viên thời vụ tự động)',
        paragraphs: [
          'Vào ngày thường, cửa hàng của bạn chỉ cần 2 Pod là đủ phục vụ. Nhưng vào lúc 0h00 đêm ngày khuyến mãi lớn, lượng khách tăng gấp 10 lần làm CPU vọt lên 90%. Thay vì kỹ sư phải thức đêm canh gõ lệnh, HPA tự động theo dõi chỉ số CPU/RAM và lập tức nhân bản từ 2 Pod lên 20 Pod. Đến 2h00 sáng khi khách đã đi ngủ hết, HPA tự động thu gọn về lại 2 Pod để tiết kiệm tiền thuê máy chủ.',
        ],
      },
    ],
    analogyCards: {
      title: 'Liên tưởng Hóa: Đội Bác sĩ Trực 3 Ca, Hợp đồng Điện nước & Nhân sự Thời vụ',
      scenario: 'Bảo vệ ứng dụng khỏi tình trạng chết lâm sàng, tràn RAM và quá tải giờ cao điểm.',
      mappings: [
        {
          technicalTerm: 'Liveness Probe vs. Readiness Probe',
          analogyName: 'Bắt mạch sống chết (Restart) vs. Biển báo "Đang bận" (Ngắt khách)',
          explanation: 'Trượt Liveness → Giết và bật lại Container. Trượt Readiness → Rút tên khỏi Tổng đài Service nhưng giữ nguyên Container.',
        },
        {
          technicalTerm: 'resources.requests vs. limits',
          analogyName: 'Mức lương sàn tối thiểu vs. Mức trần khóa van (cgroups)',
          explanation: 'Scheduler dựa vào requests để tìm máy chủ xếp chỗ; Kernel dựa vào limits để bắn hạ Pod nếu ngốn quá trần RAM (OOMKilled 137).',
        },
        {
          technicalTerm: 'HPA (Horizontal Pod Autoscaler)',
          analogyName: 'Quản lý tự động thuê thêm nhân viên thời vụ lúc đông khách',
          explanation: 'Tự động tăng/giảm số lượng Pod dựa trên phần trăm CPU/RAM so với mức requests.',
        },
      ],
      summaryCallout: 'LƯU Ý SỐNG CÒN: HPA tính phần trăm CPU dựa trên thông số resources.requests.cpu của Pod! Nếu bạn quên khai báo requests.cpu trong Deployment, HPA sẽ mù thông số (<unknown>/70%) và không bao giờ tự nhân bản được!',
    },
    animatedFlowId: 'rolling-update-hpa',
    codeExamples: [
      {
        id: 'ex-3-2-probes-hpa',
        filename: 'probes-resources-and-hpa.yaml',
        language: 'yaml',
        purpose: 'Cấu hình chuẩn mực: Định mức phần cứng (Requests/Limits) + Bác sĩ trực (Probes) + Mở rộng tự động (HPA)',
        code: `# Phần bên trong spec.containers của Deployment:
          resources:
            requests:                # <-- [MỨC TỐI THIỂU]: Để Trưởng phòng Scheduler tìm máy chủ còn đủ chỗ
              cpu: "250m"            # 0.25 nhân CPU
              memory: "256Mi"        # 256 MB RAM
            limits:                  # <-- [MỨC TRẦN TỐI ĐA]: Vượt mức RAM này sẽ bị OOMKilled (Exit Code 137)
              cpu: "500m"
              memory: "512Mi"
          readinessProbe:            # <-- [KHÁM SẴN SÀNG]: Đỗ bài này mới được Tổng đài Service gửi khách vào
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:             # <-- [BẮT MẠCH SỐNG CHẾT]: Trượt 3 lần liên tiếp sẽ tự động Restart Pod
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 20
            periodSeconds: 15
            failureThreshold: 3
---
# KHỐI HPA — Tự động nhân bản từ 2 lên 20 Pod khi CPU vượt 70%
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
        annotations: [
          { line: 3, keyword: 'requests:', explanation: 'Cam kết tài nguyên tối thiểu; bắt buộc phải có để Scheduler xếp lịch và HPA tính toán phần trăm tải.' },
          { line: 6, keyword: 'limits:', explanation: 'Trần tài nguyên khóa bằng cgroups; vượt quá 512Mi RAM sẽ bị OOMKilled (Exit 137).' },
          { line: 9, keyword: 'readinessProbe:', explanation: 'Kiểm tra /health/ready mỗi 10 giây; nếu DB đứt kết nối tạm thời, rút Pod khỏi Service để không trả lỗi cho khách.' },
          { line: 15, keyword: 'livenessProbe:', explanation: 'Đợi 20 giây sau khi bật mới bắt mạch; nếu 3 lần không phản hồi thì khởi động lại container.' },
          { line: 35, keyword: 'averageUtilization: 70', explanation: 'Khi CPU trung bình vượt 70% mức requests, HPA tự động tăng số Pod lên tối đa 20.' },
        ],
      },
    ],
    gotchas: [
      {
        title: 'Cấu hình Liveness Probe quá gắt (initialDelaySeconds quá ngắn)',
        severity: 'critical',
        symptom: 'Ứng dụng không hề có lỗi code nhưng cứ bật lên được 10 giây là bị K8s giết rồi khởi động lại liên tục (CrashLoopBackOff).',
        rootCause: 'Ứng dụng cần 35 giây để khởi động xong, nhưng livenessProbe lại kiểm tra ngay ở giây thứ 5. K8s thấy chưa trả lời liền tưởng bị treo và ra tay giết Pod ngay khi nó chưa kịp mở mắt!',
        wrongApproach: 'initialDelaySeconds: 3 cho ứng dụng nặng cần 30s khởi động',
        rightApproach: 'Tăng initialDelaySeconds lên 30–45s hoặc bổ sung startupProbe bảo vệ lúc khởi động',
      },
    ],
    relatedIncidentId: 'incident-3-crashloop',
    relatedPracticeId: 'prac-4-probes-hpa',
  },

  {
    id: 'lesson-4-1-helm-gitops-cicd-security',
    stageId: 'stage-4',
    level: 'master',
    order: 9,
    title: 'Bài 4.1: Đỉnh cao Cloud Native — Helm Charts, GitOps với ArgoCD + CI/CD, Giám sát & Bảo mật Cụm',
    shortDescription: 'Làm chủ chu trình DevOps/SRE chuẩn doanh nghiệp lớn: Đóng gói bằng Helm, tự động hóa từ lúc Merge code tới ArgoCD GitOps, giám sát Prometheus/Grafana và khóa tường lửa NetworkPolicy.',
    estimatedMinutes: 25,
    theorySections: [
      {
        heading: 'Giai đoạn 4: Hệ sinh thái Cloud Native Chuẩn Doanh Nghiệp Lớn',
        paragraphs: [
          'Khi vận hành hàng chục dịch vụ trên nhiều môi trường (Dev, Staging, Production), việc copy-paste hàng trăm file YAML rời rạc sẽ nhanh chóng trở thành cơn ác mộng. Các doanh nghiệp hiện đại chuẩn hóa bằng 4 mảnh ghép đỉnh cao:',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Quản lý gói ứng dụng với Helm Charts:',
            text: 'Giống như trình quản lý gói npm/apt cho Kubernetes. Thay vì sửa tay từng file YAML, bạn đóng gói toàn bộ Deployment + Service + Ingress + HPA thành một bộ khuôn mẫu (Chart) và chỉ cần thay đổi các thông số trong file values.yaml cho từng môi trường.',
          },
          {
            boldPrefix: 'Tự động hóa triển khai hiện đại theo mô hình GitOps với ArgoCD + CI/CD:',
            text: 'Lập trình viên vừa gộp code (Merge), GitHub Actions / GitLab CI tự động chạy test, đóng gói Docker Image Multi-stage, quét bảo mật Trivy và cập nhật tag Image mới vào Git Repo cấu hình. ArgoCD nằm bên trong cụm K8s liên tục canh gác Git Repo, phát hiện có phiên bản mới liền tự động đồng bộ (Sync) lên cụm K8s!',
          },
          {
            boldPrefix: 'Giám sát & Gom log tập trung (Prometheus + Grafana + Loki):',
            text: 'Prometheus thu thập chỉ số sức khỏe toàn cụm theo thời gian thực, Grafana vẽ bảng điều khiển trực quan và bắn cảnh báo qua Telegram/Slack ngay khi Pod bị OOMKilled hay CrashLoopBackOff, còn Loki gom toàn bộ log về một chỗ.',
          },
          {
            boldPrefix: 'Bảo mật cụm (RBAC & NetworkPolicy):',
            text: 'RBAC phân quyền chặt chẽ ai được phép xem/xóa tài nguyên nào, còn NetworkPolicy dựng tường lửa nội bộ (ví dụ: Chỉ cho phép Pod Backend gọi vào Pod Database cổng 5432, cấm tuyệt đối Pod Frontend chọc thẳng vào Database).',
          },
        ],
      },
    ],
    analogyCards: {
      title: 'Liên tưởng Hóa: Khuôn đúc Helm, Quản gia GitOps ArgoCD & Tường lửa Nội bộ',
      scenario: 'Tự động hóa và bảo mật toàn diện từ lúc lập trình viên bấm nút Merge PR đến khi ứng dụng chạy trên Production.',
      mappings: [
        {
          technicalTerm: 'Helm Chart & values.yaml',
          analogyName: 'Bản hợp đồng mẫu in sẵn có chỗ điền thông số',
          explanation: 'Dùng chung 1 bộ khuôn YAML chuẩn, chỉ cần truyền values-dev.yaml (2 Pods) hoặc values-prod.yaml (10 Pods).',
        },
        {
          technicalTerm: 'ArgoCD (GitOps Controller)',
          analogyName: 'Quản gia canh gác Sổ thiết kế Git 24/7',
          explanation: 'Lấy Git làm nguồn sự thật duy nhất (Single Source of Truth); ai sửa tay trên cụm sẽ bị ArgoCD tự động khôi phục về đúng bản trong Git.',
        },
        {
          technicalTerm: 'NetworkPolicy',
          analogyName: 'Thẻ từ phân vùng thang máy nội bộ tòa nhà',
          explanation: 'Mặc định mọi Pod trong K8s đều gọi được nhau; NetworkPolicy khóa chặt để chỉ đúng dịch vụ được cấp phép mới nói chuyện được với Database.',
        },
      ],
      summaryCallout: 'Bạn có thể trải nghiệm trực tiếp toàn bộ dây chuyền CI/CD + Docker Cache + Trivy Scan + ArgoCD GitOps ngay tại phân hệ "Giả lập CI/CD & GitOps" của ứng dụng!',
    },
    animatedFlowId: 'code-to-k8s-pipeline',
    codeExamples: [
      {
        id: 'ex-4-1-netpol-argocd',
        filename: 'network-policy-database-lock.yaml',
        language: 'yaml',
        purpose: 'Tường lửa nội bộ NetworkPolicy: Chỉ cho phép Pod Backend gọi vào cổng 5432 của Pod Database',
        code: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-only-backend-to-db
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: postgres-db               # <-- Áp dụng bức tường bảo vệ quanh các Pod Database
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: shop-backend      # <-- CHỈ mở cửa cho các Pod mang thẻ tên 'app: shop-backend'
      ports:
        - protocol: TCP
          port: 5432                 # <-- Và chỉ cho phép đi vào đúng cổng 5432`,
        annotations: [
          { line: 8, keyword: 'app: postgres-db', explanation: 'Xác định đối tượng được bảo vệ là các Pod cơ sở dữ liệu PostgreSQL.' },
          { line: 15, keyword: 'app: shop-backend', explanation: 'Mọi kết nối từ các Pod khác (như Frontend hay Pod bị hacker chiếm quyền) đều bị chặn đứng.' },
        ],
      },
    ],
    gotchas: [
      {
        title: 'Dùng nhãn image: myapp:latest trên môi trường Production',
        severity: 'critical',
        symptom: 'Không biết đang chạy phiên bản code nào, khi cập nhật K8s không kéo Image mới về và khi lỗi không thể Rollback chính xác.',
        rootCause: 'Nhãn :latest bị ghi đè liên tục và không phản ánh mã commit Git.',
        wrongApproach: 'image: myregistry.io/shop-web:latest',
        rightApproach: 'Luôn gắn tag bất biến theo phiên bản hoặc Git SHA (ví dụ image: myregistry.io/shop-web:v1.2.4-a8f9c2)',
      },
    ],
  },

  {
    id: 'lesson-4-2-troubleshooting-playbook',
    stageId: 'stage-4',
    level: 'master',
    order: 10,
    title: 'Bài 4.2: Cẩm nang Chẩn đoán Sự cố Thực chiến — Quy trình 4 Bước "Khám Bệnh" & 8 Căn bệnh Kinh điển',
    shortDescription: 'Phương pháp luận chuẩn của chuyên gia Kubernetes thực thụ: Cách nhận diện triệu chứng, khoanh vùng nguyên nhân từ ngoài vào trong và xử lý dứt điểm 8 sự cố phổ biến nhất.',
    estimatedMinutes: 30,
    theorySections: [
      {
        heading: '5.1. Quy trình 4 Bước "Khám Bệnh" Cho Mọi Sự Cố Trên Kubernetes',
        paragraphs: [
          'Khả năng phân biệt một kỹ sư mới học và một chuyên gia Kubernetes thực thụ nằm ở tốc độ nhận diện triệu chứng, khoanh vùng nguyên nhân và xử lý sự cố khi hệ thống gặp trục trặc. Khi một ứng dụng trên K8s không hoạt động như ý muốn, đừng đoán mò. Hãy đi từ ngoài vào trong theo đúng 4 bước tuần tự sau:',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Bước 1 — Quan sát trạng thái tổng thể (Nhìn sắc diện):',
            text: 'Chạy lệnh kubectl get pods -n [NAMESPACE] -o wide để xem cột STATUS đang báo gì, cột RESTARTS có tăng liên tục không và Pod đang nằm ở máy chủ (Node) nào.',
          },
          {
            boldPrefix: 'Bước 2 — Đọc hồ sơ bệnh án hệ thống (Events):',
            text: 'Chạy lệnh kubectl describe pod [TÊN_POD] -n [NAMESPACE] và kéo xuống mục Events ở dưới cùng. Đây là nơi K8s ghi lại toàn bộ nhật ký điều phối (tải Image thành công hay thất bại, gắn ổ cứng có được không, khám sức khỏe Probe có đỗ không).',
          },
          {
            boldPrefix: 'Bước 3 — Kiểm tra nhật ký nội bộ của ứng dụng (Application Logs):',
            text: 'Nếu K8s báo đã bật được Container lên nhưng ứng dụng bên trong tự chết, hãy đọc log do chính code sinh ra bằng lệnh kubectl logs [TÊN_POD] -n [NAMESPACE] (thêm cờ --previous nếu muốn xem log của lần sập ngay trước đó).',
          },
          {
            boldPrefix: 'Bước 4 — Kiểm tra đường truyền mạng & Dịch vụ (Service/Ingress):',
            text: 'Nếu Pod chạy khỏe mạnh mà người ngoài không vào được, hãy kiểm tra danh sách IP đích bằng lệnh kubectl get endpoints [TÊN_SERVICE] và thử kết nối thẳng bằng kubectl port-forward.',
          },
        ],
      },
      {
        heading: '5.2. Tóm lược 8 Căn bệnh Kinh điển trong Thực tế Vận hành',
        paragraphs: [
          'Mọi sự cố trong thực tế đều quy về 8 kịch bản cốt lõi mà bạn có thể thực hành giải cứu trực tiếp tại phân hệ "8 Tình huống Sự cố":',
        ],
        bulletPoints: [
          {
            boldPrefix: 'Sự cố 1 (Local Docker):',
            text: 'Build chậm 10 phút do đặt COPY . . sai chỗ làm vỡ Cache; lỗi port is already allocated do trùng cổng; lỗi permission denied socket trên Linux.',
          },
          {
            boldPrefix: 'Sự cố 2 (ImagePullBackOff / ErrImagePull):',
            text: 'Sai tên/Tag Image hoặc kho Private Registry nhưng thiếu phong bì mật khẩu imagePullSecrets.',
          },
          {
            boldPrefix: 'Sự cố 3 (CrashLoopBackOff):',
            text: 'Thiếu biến môi trường/đứt kết nối DB lúc khởi động, lệnh CMD thoát ngay không chạy Foreground, hoặc Liveness Probe quá gắt.',
          },
          {
            boldPrefix: 'Sự cố 4 (OOMKilled — Exit Code 137):',
            text: 'Ứng dụng ngốn RAM vượt mức trần resources.limits.memory nên bị nhân Linux bắn hạ tức khắc.',
          },
          {
            boldPrefix: 'Sự cố 5 (Pending vô thời hạn):',
            text: 'Cạn kiệt CPU/RAM trên Node (Insufficient cpu/memory), kẹt chờ ổ cứng PVC chưa Bound, hoặc ràng buộc nodeSelector không khớp máy nào.',
          },
          {
            boldPrefix: 'Sự cố 6 (CreateContainerConfigError):',
            text: 'Tham chiếu tới ConfigMap hoặc Secret chưa được tạo, gõ sai tên hoặc tạo nhầm Namespace.',
          },
          {
            boldPrefix: 'Sự cố 7 (Pod Running xanh mượt nhưng lỗi Web):',
            text: 'Lệch nhãn Selector ở Service làm ENDPOINTS trống rỗng (<none>), sai cổng targetPort, hoặc code chỉ nghe ở 127.0.0.1 thay vì 0.0.0.0.',
          },
          {
            boldPrefix: 'Sự cố 8 (Kẹt Terminating hoặc NodeNotReady):',
            text: 'Máy chủ Worker sập nguồn mất liên lạc với Control Plane, hoặc ứng dụng không xử lý tín hiệu SIGTERM / kẹt tháo ổ đĩa mạng.',
          },
        ],
      },
    ],
    analogyCards: {
      title: 'Phác đồ Chẩn đoán Y khoa 4 Bước trên Kubernetes',
      scenario: 'Đối chiếu 4 câu lệnh chẩn đoán cốt lõi với quy trình khám bệnh tại bệnh viện.',
      mappings: [
        {
          technicalTerm: 'kubectl get pods -o wide',
          analogyName: 'Bước 1: Nhìn sắc diện & Đếm số lần ngất (RESTARTS)',
          explanation: 'Phân loại ngay bệnh nhân thuộc nhóm Pending, ImagePullBackOff, CrashLoopBackOff hay Running.',
        },
        {
          technicalTerm: 'kubectl describe pod [TÊN_POD]',
          analogyName: 'Bước 2: Đọc Hồ sơ Bệnh án Hệ thống (Events & Last State)',
          explanation: 'Tìm nguyên nhân FailedScheduling, Failed to pull image hoặc Reason: OOMKilled (Exit Code 137).',
        },
        {
          technicalTerm: 'kubectl logs [TÊN_POD] --previous',
          analogyName: 'Bước 3: Nghe lời trăn trối cuối cùng trước khi ngất',
          explanation: 'Đọc stacktrace lỗi code hoặc lỗi thiếu biến DATABASE_URL của phiên bản container vừa bị sập.',
        },
        {
          technicalTerm: 'kubectl get endpoints [TÊN_SERVICE]',
          analogyName: 'Bước 4: Kiểm tra danh bạ Tổng đài điện thoại',
          explanation: 'Nếu trả về <none> nghĩa là Tổng đài Service đang bị đứt dây nối với Pod do lệch nhãn Selector.',
        },
      ],
      summaryCallout: 'Hãy chuyển ngay sang tab "8 Tình huống Sự cố (War-Room)" trên thanh công cụ để trực tiếp gõ lệnh khám bệnh và sửa file YAML cứu hệ thống như một kỹ sư SRE thực thụ!',
    },
    animatedFlowId: 'troubleshooting-flowchart',
    codeExamples: [
      {
        id: 'ex-4-2-diagnostic-commands',
        filename: 'sre-4-step-diagnostics.sh',
        language: 'bash',
        purpose: 'Bộ 4 câu lệnh khám bệnh chuẩn mực và lệnh Rollback khẩn cấp khi nâng cấp lỗi (Trang 16, 21 PDF)',
        code: `# BƯỚC 1: Quan sát trạng thái tổng thể (Nhìn sắc diện & cột RESTARTS)
kubectl get pods -n production -o wide

# BƯỚC 2: Đọc hồ sơ bệnh án hệ thống (Kéo xuống mục Events & Last State)
kubectl describe pod shop-web-7d9f8b-x92k -n production

# BƯỚC 3: Đọc lời trăn trối của container ở lần sập ngay trước đó (trị CrashLoopBackOff)
kubectl logs shop-web-7d9f8b-x92k -n production --previous

# BƯỚC 4: Kiểm tra danh bạ IP của Tổng đài Service & Kéo cổng trực tiếp vào Pod
kubectl get endpoints web-app-service -n production
kubectl port-forward pod/shop-web-7d9f8b-x92k 8080:3000 -n production

# CỨU HỘ KHẨN CẤP: Quay lui (Rollback) ngay về phiên bản ổn định trước đó
kubectl rollout undo deployment/web-app-deployment -n production`,
        annotations: [
          { line: 2, keyword: 'kubectl get pods -n production -o wide', explanation: 'Xem nhanh STATUS, số lần RESTARTS, IP của Pod và máy chủ Worker chứa Pod.' },
          { line: 5, keyword: 'kubectl describe pod', explanation: 'Đọc mục Events ở cuối cùng và kiểm tra Exit Code (ví dụ 137 = OOMKilled).' },
          { line: 8, keyword: '--previous', explanation: 'Cờ cực kỳ quan trọng để xem log của phiên bản vừa bị sập trước khi K8s khởi động lại Pod.' },
          { line: 11, keyword: 'kubectl get endpoints', explanation: 'Xác minh xem Service có tìm thấy IP của các Pod phía sau không hay bị lệch nhãn Selector.' },
          { line: 15, keyword: 'kubectl rollout undo', explanation: 'Quay lui khẩn cấp Deployment về bản ReplicaSet ổn định ngay trước đó trong vài giây.' },
        ],
      },
    ],
    gotchas: [
      {
        title: 'Ứng dụng bên trong Container chỉ lắng nghe ở 127.0.0.1 (Localhost)',
        severity: 'critical',
        symptom: 'Pod báo Running xanh mượt, Service Endpoints đã có đủ IP, nhưng gọi từ ngoài vào luôn bị Connection Refused!',
        rootCause: 'Trong code Node.js/Python/Go viết app.listen(3000, "127.0.0.1"), khiến ứng dụng chỉ nhận kết nối từ chính bên trong ruột container đó và từ chối mọi gói tin từ mạng K8s bên ngoài gọi vào.',
        wrongApproach: "app.listen(3000, '127.0.0.1')",
        rightApproach: "app.listen(3000, '0.0.0.0') # Lắng nghe trên mọi giao diện mạng của Container",
      },
    ],
    relatedIncidentId: 'incident-7-network-selector',
  },
];

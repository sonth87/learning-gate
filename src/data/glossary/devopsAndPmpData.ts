import { GlossaryTerm } from '@/types/glossary.types';
import { REDIS_GLOSSARY_ENTRIES } from '@/apps/redismastery/data/redisGlossaryData';
import { GLOSSARY_ANALOGY_ITEMS } from '@/apps/kubemastery/data/glossaryAndCheatsheetData';
import { CICD_GLOSSARY_TERMS } from '@/apps/cicdmastery/data/cicdAssessmentsAndGlossaryData';

const MAPPED_REDIS_TERMS: GlossaryTerm[] = REDIS_GLOSSARY_ENTRIES.map((entry) => {
  const firstToken = entry.term.split(/[\s/([•]+/)[0]?.trim() || entry.term;
  const aliases = [
    entry.term,
    firstToken,
    ...entry.term
      .split(/[/(),•]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 3),
  ];
  return {
    id: `redis_${entry.id}`,
    term: entry.term,
    aliases: Array.from(new Set(aliases)),
    category: 'ecosystem',
    level: 'basic',
    stageId: 'stage-6',
    shortSummary: `${entry.category} · Độ phức tạp ${entry.complexity} (${entry.complexityDetail})`,
    detailedExplanation: entry.summary,
    analogy: entry.analogy,
    syntaxExample: entry.cliExample,
    commonGotcha: entry.productionDanger,
    relatedTerms: [],
  };
});

const MAPPED_KUBE_TERMS: GlossaryTerm[] = GLOSSARY_ANALOGY_ITEMS.map((item) => {
  const cleanTitle = item.term.replace(/\s*\([^)]*\)/g, '').trim();
  const parts = cleanTitle
    .split(/&|vs\.|\/|,/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);
  return {
    id: `kube_${item.id}`,
    term: item.term,
    aliases: Array.from(new Set([item.term, cleanTitle, ...parts])),
    category: 'ecosystem',
    level: 'basic',
    stageId: 'stage-7',
    shortSummary: `${item.category} — ${item.analogyTag}`,
    detailedExplanation: item.technicalDefinition,
    analogy: item.vividAnalogy,
    syntaxExample: item.exampleCommandOrYaml,
    relatedTerms: [],
  };
});

const MAPPED_CICD_TERMS: GlossaryTerm[] = CICD_GLOSSARY_TERMS.map((item) => {
  const cleanTitle = item.term.replace(/\s*\([^)]*\)/g, '').trim();
  const parenMatch = item.term.match(/\(([^)]+)\)/);
  const aliases = [item.term, cleanTitle];
  if (parenMatch && parenMatch[1].length >= 2) {
    aliases.push(parenMatch[1].trim());
  }
  return {
    id: `cicd_${item.id}`,
    term: item.term,
    aliases: Array.from(new Set(aliases)),
    category: 'ecosystem',
    level: item.level,
    stageId: 'stage-7',
    shortSummary: item.shortDef,
    detailedExplanation: item.deepExplanation,
    analogy: `Thuộc nhóm ${item.category} trong kiến trúc CI/CD hiện đại.`,
    syntaxExample: item.codeExample || `# ${item.term}`,
    relatedTerms: [],
  };
});

const EXTRA_COURSE_TERMS: GlossaryTerm[] = [
  // Docker & Kubernetes Core Terms
  {
    id: 'k8s_pod',
    term: 'Pod (Kubernetes Pod)',
    aliases: ['Pod', 'Pods', 'kind: Pod'],
    category: 'ecosystem',
    level: 'fundamental',
    stageId: 'stage-7',
    shortSummary:
      'Đơn vị triển khai nhỏ nhất trong Kubernetes, bao bọc một hoặc nhiều container dùng chung Network Namespace (IP/Port) và Volume.',
    detailedExplanation:
      'Các container trong cùng 1 Pod giao tiếp với nhau qua `localhost` và cùng chia sẻ vòng đời. Pod mang tính tạm thời (ephemeral): khi Node lỗi hoặc Pod bị xóa, Kubernetes tạo Pod mới với địa chỉ IP mới.',
    analogy:
      'Giống một căn hộ chung cư nơi các container ở cùng nhà dùng chung số điện thoại cố định (IP) và tủ lạnh chung (Shared Volume).',
    syntaxExample: `apiVersion: v1\nkind: Pod\nmetadata:\n  name: web-pod\nspec:\n  containers:\n    - name: app\n      image: nginx:1.27-alpine`,
    commonGotcha:
      'Không triển khai Pod lẻ trực tiếp trên Production vì Pod tự lẻ không có cơ chế tự tạo lại (Self-healing) khi Node sập; hãy luôn quản lý qua Deployment, StatefulSet hoặc DaemonSet.',
    relatedTerms: ['k8s_deployment', 'k8s_service'],
  },
  {
    id: 'k8s_deployment',
    term: 'Deployment',
    aliases: ['Deployment', 'kind: Deployment', 'ReplicaSet'],
    category: 'ecosystem',
    level: 'fundamental',
    stageId: 'stage-7',
    shortSummary:
      'Bộ điều khiển (Controller) quản lý các ứng dụng Stateless, đảm bảo duy trì đúng số lượng Pod (`replicas`) và hỗ trợ Rolling Update / Rollback.',
    detailedExplanation:
      'Deployment quản lý ReplicaSet ở tầng dưới. Khi bạn cập nhật tag Image mới, Deployment tạo ReplicaSet mới, nâng dần số Pod mới (maxSurge) và hạ dần số Pod cũ (maxUnavailable) để không gây gián đoạn dịch vụ.',
    analogy:
      'Giống quản đốc dây chuyền tự động: luôn đảm bảo có đúng N nhân viên trực quầy và thay ca từng người một khi nâng cấp đồng phục.',
    syntaxExample: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  replicas: 3\n  strategy:\n    type: RollingUpdate`,
    commonGotcha:
      'Phải cấu hình `readinessProbe` thì Rolling Update mới biết khi nào Pod mới thực sự sẵn sàng nhận traffic trước khi tắt Pod cũ.',
    relatedTerms: ['k8s_pod', 'k8s_statefulset', 'k8s_probes'],
  },
  {
    id: 'k8s_statefulset',
    term: 'StatefulSet',
    aliases: ['StatefulSet', 'kind: StatefulSet'],
    category: 'ecosystem',
    level: 'advanced',
    stageId: 'stage-7',
    shortSummary:
      'Workload Controller dành cho ứng dụng Stateful (Database, Redis, Kafka) cần định danh mạng cố định (`web-0`, `web-1`) và ổ đĩa PVC riêng biệt cho từng Pod.',
    detailedExplanation:
      'Khác với Deployment (các Pod có tên ngẫu nhiên và dùng chung/không dùng ổ đĩa), StatefulSet cấp tên thứ tự cố định, kết hợp với Headless Service (`clusterIP: None`) và `volumeClaimTemplates` để mỗi Pod gắn chặt với PVC riêng kể cả khi khởi động lại trên Node khác.',
    analogy:
      'Giống các két sắt cá nhân được đánh số cố định #0, #1, #2: nhân viên #0 nghỉ rồi quay lại vẫn mở đúng két sắt #0 của mình.',
    syntaxExample: `apiVersion: apps/v1\nkind: StatefulSet\nspec:\n  serviceName: redis-headless\n  replicas: 3\n  volumeClaimTemplates:\n    - metadata: { name: data }`,
    commonGotcha:
      'Khi xóa StatefulSet hoặc scale down, Kubernetes không tự động xóa PVC để tránh mất dữ liệu Database.',
    relatedTerms: ['k8s_deployment', 'k8s_pvc'],
  },
  {
    id: 'k8s_service',
    term: 'Service (ClusterIP / NodePort / LoadBalancer)',
    aliases: ['Service', 'ClusterIP', 'NodePort', 'LoadBalancer', 'kind: Service', 'kube-proxy'],
    category: 'ecosystem',
    level: 'fundamental',
    stageId: 'stage-7',
    shortSummary:
      'Điểm truy cập mạng ổn định (Virtual IP + DNS cố định) đứng trước tập hợp các Pod được chọn qua `selector` nhãn.',
    detailedExplanation:
      '`ClusterIP` (mặc định) chỉ truy cập nội bộ cụm; `NodePort` mở cổng tĩnh 30000-32767 trên mọi Node; `LoadBalancer` yêu cầu Cloud Provider cấp bộ cân bằng tải ngoài; `Headless Service` (`clusterIP: None`) trả thẳng danh sách IP từng Pod qua DNS.',
    analogy:
      'Giống số tổng đài cố định 1900-xxxx của công ty: nhân viên trực bên dưới thay đổi ca liên tục nhưng khách hàng chỉ cần bấm đúng 1 số tổng đài.',
    syntaxExample: `apiVersion: v1\nkind: Service\nspec:\n  type: ClusterIP\n  selector:\n    app: payment-api\n  ports:\n    - port: 80\n      targetPort: 8080`,
    commonGotcha:
      'Nếu `selector` của Service không khớp chính xác với `metadata.labels` của Pod, danh sách `Endpoints` sẽ rỗng và gây lỗi kết nối.',
    relatedTerms: ['k8s_pod', 'k8s_ingress'],
  },
  {
    id: 'k8s_ingress',
    term: 'Ingress & Ingress Controller',
    aliases: ['Ingress', 'Ingress Controller', 'kind: Ingress'],
    category: 'ecosystem',
    level: 'basic',
    stageId: 'stage-7',
    shortSummary:
      'Lớp định tuyến HTTP/HTTPS (Layer 7) vào cụm Kubernetes theo tên miền (`host`), đường dẫn (`path`) và xử lý chứng chỉ TLS.',
    detailedExplanation:
      'Tài nguyên `Ingress` chỉ là bản khai báo quy tắc định tuyến; cụm bắt buộc phải chạy một `Ingress Controller` (như NGINX Ingress, Traefik, Cilium) thì các quy tắc đó mới thực sự hoạt động.',
    analogy:
      'Giống quầy lễ tân tòa nhà: nhìn tên công ty và phòng ban trên phong bì (`api.example.com/v1`) để chuyển thẳng lên đúng tầng Service tương ứng.',
    syntaxExample: `apiVersion: networking.k8s.io/v1\nkind: Ingress\nspec:\n  ingressClassName: nginx\n  rules:\n    - host: api.example.com`,
    relatedTerms: ['k8s_service'],
  },
  {
    id: 'k8s_configmap_secret',
    term: 'ConfigMap & Secret',
    aliases: ['ConfigMap', 'Secret', 'kind: ConfigMap', 'kind: Secret'],
    category: 'ecosystem',
    level: 'basic',
    stageId: 'stage-7',
    shortSummary:
      'Tách biệt cấu hình môi trường (`ConfigMap`) và dữ liệu nhạy cảm (`Secret`) ra khỏi Container Image để dùng chung một Image cho Dev, Staging và Production.',
    detailedExplanation:
      'Có thể nạp vào Pod dưới dạng biến môi trường (`env` / `envFrom`) hoặc gắn thành file trong thư mục (`volumeMounts`). Lưu ý: Secret mặc định chỉ mã hóa Base64 nên cần bật Encryption at Rest cho etcd và dùng External Secrets / SealedSecrets khi lưu trên Git.',
    analogy:
      'Image là chiếc máy pha cà phê tiêu chuẩn, còn ConfigMap/Secret là khay nguyên liệu và công thức riêng của từng cửa hàng lắp vào lúc chạy.',
    syntaxExample: `envFrom:\n  - configMapRef:\n      name: app-config\n  - secretRef:\n      name: app-secrets`,
    commonGotcha:
      'Khi cập nhật ConfigMap/Secret, biến môi trường (`env`) trong Pod đang chạy KHÔNG tự đổi cho tới khi Pod được khởi động lại.',
    relatedTerms: ['k8s_pod', 'k8s_deployment'],
  },
  {
    id: 'k8s_pvc',
    term: 'PersistentVolume (PV) & PersistentVolumeClaim (PVC)',
    aliases: ['PVC', 'PersistentVolume', 'PersistentVolumeClaim', 'StorageClass'],
    category: 'ecosystem',
    level: 'basic',
    stageId: 'stage-7',
    shortSummary:
      'Cơ chế lưu trữ bền vững trong Kubernetes: `PV` là ổ đĩa thực tế, `PVC` là phiếu yêu cầu dung lượng của Pod, và `StorageClass` tự động cấp phát ổ đĩa động (Dynamic Provisioning).',
    detailedExplanation:
      'Thay vì gắn cứng đường dẫn ổ đĩa vào cấu hình Pod, lập trình viên chỉ tạo `PVC` yêu cầu (ví dụ `10Gi`, `ReadWriteOnce`) và `StorageClass` (AWS EBS, GCP PD, Ceph) sẽ tự tạo ổ đĩa `PV` tương ứng.',
    analogy:
      'PVC giống phiếu đăng ký thuê tủ đồ 10GB; StorageClass là hệ thống tự động tạo tủ mới và giao chìa khóa ngay khi nhận phiếu.',
    syntaxExample: `apiVersion: v1\nkind: PersistentVolumeClaim\nspec:\n  accessModes: [ReadWriteOnce]\n  storageClassName: gp3\n  resources:\n    requests: { storage: 20Gi }`,
    relatedTerms: ['k8s_statefulset'],
  },
  {
    id: 'k8s_probes',
    term: 'Liveness, Readiness & Startup Probes',
    aliases: ['Liveness Probe', 'Readiness Probe', 'Startup Probe', 'livenessProbe', 'readinessProbe', 'startupProbe'],
    category: 'ecosystem',
    level: 'basic',
    stageId: 'stage-7',
    shortSummary:
      '3 cơ chế kiểm tra sức khỏe Pod của Kubelet: `startupProbe` chờ khởi động xong, `readinessProbe` quyết định có nhận traffic không, `livenessProbe` quyết định có khởi động lại container bị treo không.',
    detailedExplanation:
      'Nếu `readinessProbe` thất bại, K8s rút IP của Pod khỏi Service Endpoints (không kill Pod). Nếu `livenessProbe` thất bại, Kubelet sẽ kill và restart container.',
    analogy:
      'Startup = chờ bác sĩ mở phòng khám; Readiness = biển "Đang nhận bệnh nhân / Tạm nghỉ"; Liveness = kiểm tra bác sĩ còn tỉnh táo hay đã ngất để gọi cấp cứu.',
    syntaxExample: `readinessProbe:\n  httpGet: { path: /readyz, port: 8080 }\n  periodSeconds: 5\nlivenessProbe:\n  httpGet: { path: /healthz, port: 8080 }\n  periodSeconds: 10`,
    commonGotcha:
      'Không kiểm tra kết nối Database bên trong `livenessProbe`: nếu DB chập chờn 3 giây, mọi Pod sẽ đồng loạt tự restart gây sập toàn hệ thống (Cascading Failure).',
    relatedTerms: ['k8s_deployment', 'k8s_pod'],
  },
  {
    id: 'k8s_crashloop_oom',
    term: 'CrashLoopBackOff & OOMKilled (Exit Code 137)',
    aliases: ['CrashLoopBackOff', 'OOMKilled', 'ImagePullBackOff', 'Exit Code 137'],
    category: 'ecosystem',
    level: 'basic',
    stageId: 'stage-7',
    shortSummary:
      '`CrashLoopBackOff` là trạng thái container khởi động rồi thoát lỗi lặp đi lặp lại; `OOMKilled` (Exit Code 137) xảy ra khi container dùng vượt giới hạn RAM (`resources.limits.memory`).',
    detailedExplanation:
      'Để chẩn đoán: chạy `kubectl describe pod <name>` để xem `Last State` / `Events`, và `kubectl logs <name> --previous` để đọc log của lần chạy bị sập ngay trước đó.',
    analogy:
      'CrashLoopBackOff là xe đề máy lên rồi tắt máy liên tục; OOMKilled là cầu chì tự ngắt điện khi thiết bị tiêu thụ vượt công suất định mức.',
    syntaxExample: `kubectl describe pod api-7c8d9\nkubectl logs api-7c8d9 --previous`,
    relatedTerms: ['k8s_pod', 'k8s_probes'],
  },

  // Redis Core Terms
  {
    id: 'redis_cache_aside',
    term: 'Cache-Aside & Singleflight (Chống Cache Stampede)',
    aliases: ['Cache-Aside', 'Singleflight', 'Cache Stampede', 'Cache Penetration', 'Cache Avalanche'],
    category: 'ecosystem',
    level: 'basic',
    stageId: 'stage-6',
    shortSummary:
      'Mô hình ứng dụng đọc Redis trước, nếu Cache Miss mới đọc Database rồi nạp lại vào Redis kèm TTL + Jitter và khóa Singleflight.',
    detailedExplanation:
      '3 rủi ro cache lớn: (1) Stampede (Hot key hết hạn khiến hàng nghìn request cùng đập vào DB -> dùng Singleflight / Soft TTL); (2) Penetration (Truy vấn ID không tồn tại -> cache giá trị NULL ngắn hạn hoặc dùng Bloom Filter); (3) Avalanche (Hàng loạt key hết hạn cùng giây -> cộng thêm TTL Jitter ngẫu nhiên).',
    analogy:
      'Khi thực đơn ở quầy lễ tân hết hạn, chỉ cử đúng 1 nhân viên chạy xuống bếp hỏi thực đơn mới (Singleflight), các khách khác đứng đợi 20ms nhận chung kết quả thay vì 500 khách cùng ùa vào bếp.',
    syntaxExample: `SET product:101 "{...}" EX 3600\n# Cộng jitter ngẫu nhiên: TTL = 3600 + random(0, 300)`,
    commonGotcha:
      'Khi cập nhật dữ liệu trong DB, hãy XÓA cache (`DEL`/`UNLINK`) sau khi commit DB thay vì cập nhật đè vào cache để tránh Race Condition làm bẩn dữ liệu.',
    relatedTerms: [],
  },
  {
    id: 'redis_persistence',
    term: 'RDB Snapshot & AOF (Append-Only File)',
    aliases: ['RDB', 'AOF', 'BGSAVE', 'appendfsync', 'RDB + AOF'],
    category: 'ecosystem',
    level: 'basic',
    stageId: 'stage-6',
    shortSummary:
      'Hai cơ chế lưu trữ bền vững xuống đĩa của Redis: `RDB` chụp ảnh toàn bộ bộ nhớ theo định kỳ (nhỏ gọn, khôi phục nhanh) và `AOF` ghi nhật ký từng lệnh thay đổi (bền vững cao, tối đa mất 1 giây với `everysec`).',
    detailedExplanation:
      'Từ Redis 7/8, cấu hình chuẩn Production là bật kết hợp cả RDB + Multi-Part AOF (`aof-use-rdb-preamble yes`): file AOF chứa phần nền RDB nén gọn kèm phần đuôi lệnh mới phát sinh.',
    analogy:
      'RDB giống bản sao kê chốt sổ cuối ngày, còn AOF giống cuốn sổ nhật ký ghi từng giao dịch ngay khi phát sinh.',
    syntaxExample: `save 3600 1 300 100 60 10000\nappendonly yes\nappendfsync everysec\naof-use-rdb-preamble yes`,
    commonGotcha:
      '`BGSAVE` và `BGREWRITEAOF` dùng cơ chế `fork()` Copy-on-Write của Linux, nên cần chừa trống tối thiểu 30-50% RAM trên máy chủ để không bị tràn bộ nhớ khi đang ghi đĩa.',
    relatedTerms: [],
  },

  // PMP Exam & Project Management Terms
  {
    id: 'pmp_servant_leadership',
    term: 'Servant Leadership (Lãnh đạo Phục vụ)',
    aliases: ['Servant Leadership', 'Servant Leader', 'Psychological Safety'],
    category: 'concept',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Phong cách lãnh đạo cốt lõi trong kỳ thi PMP: tháo gỡ rào cản (Impediments), bảo vệ nhóm khỏi nhiễu loạn bên ngoài, huấn luyện và trao quyền cho nhóm tự tổ chức (Self-organizing Team).',
    detailedExplanation:
      'Trong đề thi PMP, khi nhóm gặp khó khăn, PM không ra lệnh áp đặt hay đẩy việc cho cấp trên (Sponsor/HR), mà tìm hiểu nguyên nhân gốc rễ, hỗ trợ đào tạo và tạo môi trường an toàn tâm lý (Psychological Safety).',
    analogy:
      'Người làm vườn chăm sóc đất, ánh sáng và nhổ cỏ dại (gỡ Impediment) để cây tự vươn lên, thay vì nắm ngọn cây kéo lên.',
    syntaxExample: `Mindset PMP:\n1. Assess / Analyze root cause first\n2. Collaborate with the team\n3. Remove impediments & coach`,
    commonGotcha:
      'Trong đề thi PMP, các đáp án sa thải nhân sự, báo cáo thẳng lên Sponsor, hoặc tự ý quyết định một mình mà không hỏi nhóm hầu như luôn là đáp án bẫy.',
    relatedTerms: ['pmp_agile_artifacts', 'pmp_change_control'],
  },
  {
    id: 'pmp_agile_artifacts',
    term: 'Product Backlog, Sprint Backlog & Definition of Done (DoD)',
    aliases: ['Product Backlog', 'Sprint Backlog', 'Definition of Done', 'DoD', 'Retrospective', 'WIP Limit'],
    category: 'concept',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      '`Product Backlog` do Product Owner sắp xếp độ ưu tiên theo giá trị kinh doanh; `Sprint Backlog` do Developers cam kết và sở hữu trong Sprint; `Definition of Done (DoD)` là tiêu chuẩn chất lượng bắt buộc để Increment được coi là hoàn thành.',
    detailedExplanation:
      'Sự khác biệt thường gặp trong đề thi: Acceptance Criteria áp dụng riêng cho từng User Story, còn Definition of Done (DoD) áp dụng chung cho mọi hạng mục trong Increment. Trong Sprint đang chạy, không tự ý nhồi thêm việc từ bên ngoài nếu chưa qua thống nhất với PO và Developers.',
    analogy:
      'Product Backlog là danh sách món ăn nhà hàng ưu tiên phục vụ; Sprint Backlog là thực đơn bếp đang nấu trong ca hiện tại; DoD là tiêu chuẩn vệ sinh an toàn thực phẩm bắt buộc trước khi bưng ra bàn.',
    syntaxExample: `Product Owner -> Sắp xếp Product Backlog (Value)\nDevelopers    -> Ước lượng & sở hữu Sprint Backlog\nScrum Master  -> Bảo vệ quy trình & gỡ Impediments`,
    relatedTerms: ['pmp_servant_leadership'],
  },
  {
    id: 'pmp_evm',
    term: 'Earned Value Management (EVM: CPI & SPI)',
    aliases: ['Earned Value Management', 'EVM', 'CPI', 'SPI', 'Critical Path', 'Fast Tracking', 'Crashing'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary:
      'Đo lường sức khỏe tiến độ và chi phí dự án: `SPI = EV / PV` (< 1 là chậm tiến độ), `CPI = EV / AC` (< 1 là vượt ngân sách).',
    detailedExplanation:
      'Khi dự án chậm tiến độ trên đường găng (`Critical Path`), có 2 kỹ thuật rút ngắn lịch trình: `Fast Tracking` (chạy song song các việc vốn làm tuần tự -> tăng rủi ro làm lại/Rework) và `Crashing` (bổ sung nguồn lực vào tác vụ trên đường găng -> tăng chi phí trực tiếp).',
    analogy:
      'CPI cho biết mỗi 1 đồng bỏ ra thu về được bao nhiêu giá trị công việc; SPI cho biết tốc độ thực tế đạt bao nhiêu phần trăm so với kế hoạch.',
    syntaxExample: `CV = EV - AC   |   CPI = EV / AC  (>= 1.0: Tốt)\nSV = EV - PV   |   SPI = EV / PV  (>= 1.0: Đúng hạn)`,
    commonGotcha:
      'Nén tiến độ (Crashing / Fast Tracking) chỉ có tác dụng khi áp dụng lên các công việc nằm trên Đường găng (Critical Path, Float = 0).',
    relatedTerms: ['pmp_change_control', 'pmp_risk_issue'],
  },
  {
    id: 'pmp_risk_issue',
    term: 'Risk Register vs. Issue Log',
    aliases: ['Risk Register', 'Issue Log', 'Secondary Risk', 'Residual Risk', 'Contingency Reserve', 'Management Reserve'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary:
      '`Risk` (Rủi ro) là sự kiện chưa xảy ra (quản lý trong `Risk Register` kèm kế hoạch ứng phó); `Issue` (Vấn đề) là sự kiện ĐÃ xảy ra ở hiện tại (ghi vào `Issue Log` và xử lý ngay).',
    detailedExplanation:
      '`Contingency Reserve` dùng cho rủi ro đã nhận diện (Known-Unknowns, nằm trong Cost Baseline, PM được quyền sử dụng); `Management Reserve` dùng cho rủi ro chưa biết trước (Unknown-Unknowns, ngoài Cost Baseline, cần phê duyệt qua Change Control).',
    analogy:
      'Dự báo trời sắp mưa là Risk (chuẩn bị áo mưa trong Risk Register). Trời đã đổ mưa làm ướt hàng là Issue (ghi vào Issue Log và xử lý ngay).',
    syntaxExample: `Chưa xảy ra (Có thể / Nguy cơ) -> Cập nhật Risk Register\nĐã xảy ra (Hiện tại đang lỗi)  -> Ghi Issue Log & giải quyết`,
    relatedTerms: ['pmp_change_control', 'pmp_evm'],
  },
  {
    id: 'pmp_change_control',
    term: 'Perform Integrated Change Control & CCB',
    aliases: ['Change Control Board', 'CCB', 'Change Request', 'Project Charter', 'Stakeholder Register', 'WBS', 'Work Breakdown Structure'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary:
      'Quy trình kiểm soát thay đổi chuẩn Predictive trong PMP: khi có yêu cầu thay đổi phạm vi/tiến độ/chi phí (Baseline), PM phải đánh giá tác động (Assess Impact) trước, sau đó tạo `Change Request` trình `CCB` phê duyệt rồi mới cập nhật Baseline.',
    detailedExplanation:
      'Trước khi Baseline được chốt thì chưa cần gửi Change Request lên CCB. Sau khi Baseline đã được phê duyệt, không ai (kể cả Sponsor hay khách hàng) được tự ý sửa phạm vi mà bỏ qua bước phân tích tác động và quy trình Change Control.',
    analogy:
      'Sau khi bản vẽ thiết kế nhà đã ký duyệt (Baseline), mọi yêu cầu đập tường hay thêm tầng đều phải tính lại kết cấu và ký phụ lục thay đổi (Change Request) trước khi thi công.',
    syntaxExample: `1. Lắng nghe & Phân tích tác động (Scope, Time, Cost, Quality, Risk)\n2. Đệ trình Change Request lên CCB\n3. Nếu Approved -> Cập nhật Baselines & Thông báo Stakeholders`,
    relatedTerms: ['pmp_risk_issue', 'pmp_servant_leadership'],
  },
];

export const DEVOPS_AND_PMP_GLOSSARY: GlossaryTerm[] = [
  ...EXTRA_COURSE_TERMS,
  ...MAPPED_REDIS_TERMS,
  ...MAPPED_KUBE_TERMS,
  ...MAPPED_CICD_TERMS,
];

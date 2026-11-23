import type { BilingualText, CalloutKind } from '@/components/scale-workbench/types';
import type {
  CuratedStepPayload,
  ModuleCuratedBlueprint,
} from '@/features/devops-course/scale/courseLessonBuilder';

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

function pickStep<T>(items: T[], s: number, total: number): T {
  if (items.length === 0) {
    throw new Error('pickStep requires non-empty array');
  }
  if (total <= 1 || s <= 0) return items[0];
  if (s >= total - 1) return items[items.length - 1];
  const idx = Math.min(items.length - 2, Math.max(1, s));
  return items[Math.min(items.length - 1, idx)];
}

function makeCallout(
  kind: CalloutKind,
  titleVi: string,
  titleEn: string,
  textVi: string,
  textEn: string
): NonNullable<CuratedStepPayload['callout']> {
  return {
    kind,
    title: bi(titleVi, titleEn),
    text: bi(textVi, textEn),
  };
}

export const KUBE_LEVEL_TITLES: Record<number, BilingualText> = {
  0: bi('Nền tảng Container & Vòng đời Docker', 'Container Fundamentals & Lifecycle'),
  1: bi('Đóng gói Image (Dockerfile & Compose v2)', 'Production Packaging (Dockerfile & Compose)'),
  2: bi('Kiến trúc Kubernetes, Pod & Deployment', 'K8s Architecture, Pods & Deployments'),
  3: bi('Kết nối Mạng & Cấu hình (Service, Gateway API)', 'Networking & Config (Service, Gateway, Secret)'),
  4: bi('Lưu trữ Bền vững, Health Probes & HPA', 'Storage, Health Probes & HPA Autoscaling'),
  5: bi('Bảo mật Cụm, RBAC, NetworkPolicy & Helm/Kustomize', 'Security, RBAC, NetworkPolicy & Packaging'),
  6: bi('Chẩn đoán & Xử lý Sự cố Kubernetes', 'Cluster Troubleshooting & Remediation'),
};

export const KUBE_BLUEPRINTS: Record<string, ModuleCuratedBlueprint> = {
  K00: {
    id: 'K00',
    titleEn: 'Why "Works on My Machine" Breaks — OCI Containers Explained',
    subtitleEn:
      'Compare Guest-OS VMs vs shared-kernel Containers, Image vs Container, and run Node.js & Python identically everywhere.',
    durationMin: 13,
    difficulty: 'Beginner',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Phân biệt bản chất giữa Máy ảo (kèm Guest OS nặng nề) và Container (dùng chung Host Linux Kernel)',
        'Contrast heavyweight Guest-OS VMs with lightweight shared-kernel Containers'
      ),
      bi(
        'Phân biệt rõ Container Image (gói chỉ đọc bất biến) và Container (tiến trình đang chạy có lớp ghi mỏng)',
        'Distinguish immutable read-only Images from running Container processes'
      ),
      bi(
        'Nắm bức tranh công cụ 2026 (Docker Desktop, OrbStack, Podman) và vòng đời pull → run → ps -a → stop → rm',
        'Navigate modern OCI engines (Docker, OrbStack, Podman) and the core CLI lifecycle'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const isTrap = isLast;
      return {
        telemetry: [
          {
            label: bi('KHỞI ĐỘNG', 'STARTUP TIME'),
            value:
              s === 1
                ? bi('VM ~45s vs Cont ~80ms', 'VM ~45s vs Cont ~80ms')
                : bi('~80 ms (tiến trình Kernel)', '~80 ms (OS process)'),
            tone: 'ok',
          },
          {
            label: bi('ĐỒNG NHẤT MÔI TRƯỜNG', 'ENV PARITY'),
            value:
              s === 0
                ? bi('Lệch OS → Đóng băng OCI', 'OS drift → OCI freeze')
                : bi('100% (Python / Node / Go)', '100% (Python / Node / Go)'),
            tone: 'ok',
          },
          {
            label: bi('THẺ PHIÊN BẢN', 'IMAGE TAG'),
            value:
              s === 2 || isLast
                ? bi('Ghim rõ (!= :latest)', 'Pinned (!= :latest)')
                : bi('OCI Image bất biến', 'Immutable OCI Image'),
            tone: s === 2 ? 'warn' : 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Đóng băng cả mã nguồn (Python/Node) lẫn thư viện C của Linux thành OCI Image bất biến',
                  'Bundled app code (Python/Node) + Linux system libs into a single immutable OCI Image'
                ),
              },
            ],
            [
              {
                op: '-',
                text: bi(
                  'Loại bỏ hoàn toàn tầng Guest OS nặng hàng GB của Máy ảo — dùng chung Host Linux Kernel',
                  'Eliminated heavyweight Guest OS kernels by sharing the Host Linux Kernel safely'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Chọn đúng biến thể nền: python:3.12-slim (glibc) cho Python/AI và node:22-alpine cho Node.js',
                  'Matched runtime variants: python:3.12-slim (glibc wheels) and node:22-alpine'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Điều khiển vòng đời chuẩn: docker run -d → docker ps -a → docker stop (SIGTERM) → docker rm',
                  'Executed full container lifecycle preserving the read-only base Image across docker rm'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Áp dụng Hạ tầng Bất biến: không sửa tay trong container sống — luôn build Image mới rồi thay thế!',
                  'Enforced Immutable Infrastructure: never patch live containers manually; rebuild and replace'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Mục tiêu cốt lõi của Container',
              'Core Purpose of Containers',
              'Nếu uv.lock hay package-lock.json chỉ khóa gói ngôn ngữ, thì Container đóng băng luôn cả hệ thống tệp Linux và runtime bên dưới để dev và production chạy đồng nhất.',
              'Lockfiles only pin language packages; an OCI Container freezes the entire Linux filesystem + runtime so dev and production behave identically.'
            ),
            makeCallout(
              'compare',
              'Phân biệt Máy ảo (VM) và Container',
              'Virtual Machine (VM) vs Container',
              'Máy ảo khởi chạy riêng một Guest OS đầy đủ nên nặng hàng GB; Container là tiến trình cô lập dùng chung Host Linux Kernel nên nhẹ và bật trong vài chục ms, còn Image là gói chỉ đọc bất biến (tương tự nhà riêng tự cấp điện nước vs căn hộ dùng chung hạ tầng tòa nhà).',
              'VMs boot a separate Guest OS; Containers are isolated processes sharing the Host Linux Kernel, started from a read-only Image (like detached houses vs shared-utility apartments).'
            ),
            makeCallout(
              'technique',
              'Góc nhìn 2026: Engine & Tag',
              '2026 Engines & Tag Discipline',
              'Trên macOS, OrbStack nhẹ và nhanh hơn hẳn Docker Desktop; trên Linux có Podman rootless. Với Python/FastAPI hãy ưu tiên python:3.12-slim thay vì alpine để cài wheel C siêu tốc!',
              'In 2026, OrbStack (macOS) and rootless Podman (Linux) run the exact same OCI images. Prefer python:3.12-slim for Python C-wheels and node:22-alpine for Node.js.'
            ),
            makeCallout(
              'watch-out',
              'Nhớ cờ -a khi tìm container tắt',
              'Remember -a for Exited Containers',
              'docker ps chỉ hiện container đang sống (Up). Khi container vừa bật đã thoát lỗi, hãy gõ docker ps -a để thấy trạng thái Exited, và nhớ docker rm chỉ xóa Container chứ không mất Image gốc!',
              'docker ps hides stopped containers! Run docker ps -a to inspect Exited (1)/(137) containers, and remember docker rm never deletes the underlying Image.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production',
              'Production Golden Rule',
              'Hạ tầng bất biến (Immutable Infrastructure): Ghim cứng phiên bản tag (cấm :latest) và không bao giờ chui vào container đang chạy để sửa code tay!',
              'Immutable Infrastructure rule: Always pin explicit image tags (never :latest) and replace containers from fresh images rather than mutating running ones.'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'dev',
              shape: 'device',
              tone: s === 0 ? 'blue' : 'neutral',
              x: -245,
              y: 10,
              highlighted: s === 0 || s === 2,
              label: bi('Laptop · Python / Node', 'Laptop · Python / Node'),
              badge:
                s === 2
                  ? { text: bi('OrbStack / Docker', 'OrbStack / Docker'), tone: 'ok' }
                  : undefined,
            },
            {
              id: 'img',
              shape: 'db',
              tone: s === 1 || s === 2 ? 'purple' : 'blue',
              x: -5,
              y: -28,
              highlighted: s === 1 || s === 2 || isTrap,
              label: bi('OCI Image (Read-Only)', 'OCI Image (Read-Only)'),
              badge: {
                text:
                  s === 2
                    ? bi('python:3.12-slim · ghim tag', 'python:3.12-slim · pinned')
                    : bi('Bất biến (Read-Only)', 'Immutable Read-Only'),
                tone: 'ok',
              },
            },
            {
              id: 'srv',
              shape: 'block',
              tone: 'green',
              x: 235,
              y: 15,
              icon: 'cpu',
              highlighted: s === 3 || isLast,
              label: bi('Prod Linux Host', 'Prod Linux Host'),
              badge: {
                text:
                  s === 3
                    ? bi('Up · SIGTERM Stop êm', 'Up · Graceful SIGTERM')
                    : bi('Chạy giống hệt 100%', '100% identical run'),
                tone: 'ok',
              },
            },
          ],
          links: [
            { id: 'l1', from: 'dev', to: 'img', label: bi('docker build / push', 'docker build / push') },
            { id: 'l2', from: 'img', to: 'srv', label: bi('docker run -d', 'docker run -d') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.45, offset: 0.48 },
          ],
        },
        defaultCode: `docker run --rm python:3.12-slim python -c "print('OCI Ready!')"\ndocker run -d --name cache-dev redis:7-alpine\ndocker ps -a`,
      };
    },
  },

  K01: {
    id: 'K01',
    titleEn: 'Port Mapping (-p), 0.0.0.0 Binding, Env Vars, Logs & Exec',
    subtitleEn:
      'Bridge host-to-container network ports, avoid the 127.0.0.1 trap in FastAPI/Node, inject -e config, and stream logs.',
    durationMin: 13,
    difficulty: 'Beginner',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Đọc đúng chiều -p HOST_PORT:CONTAINER_PORT và hiểu vì sao phải bind 0.0.0.0 thay vì 127.0.0.1 trong Network Namespace cô lập',
        'Master -p HOST:CONTAINER port mapping and why 0.0.0.0 is mandatory over 127.0.0.1'
      ),
      bi(
        'Tiêm cấu hình 12-Factor qua -e (os.environ / process.env), đọc docker logs khi container đã sập và kiểm tra bằng docker exec',
        'Inject 12-Factor env vars via -e, read crash logs via docker logs, and debug live via docker exec'
      ),
    ],
    buildStep: (s, total) => {
      const loopbackTrap = s === 1;
      const isLogs = s === 3;
      const isExec = s === 4;
      return {
        telemetry: [
          {
            label: bi('ÁNH XẠ CỔNG', 'PORT FORWARD'),
            value: bi('-p 8080:3000 (Ngoài→Trong)', '-p 8080:3000 (Host→Cont)'),
            tone: 'ok',
          },
          {
            label: bi('ĐỊA CHỈ LẮNG NGHE', 'BIND ADDRESS'),
            value: loopbackTrap
              ? bi('0.0.0.0 (Cấm 127.0.0.1!)', '0.0.0.0 (Never 127.0.0.1!)')
              : bi('0.0.0.0:3000 / :8000', '0.0.0.0:3000 / :8000'),
            tone: loopbackTrap ? 'warn' : 'ok',
          },
          {
            label: bi('KÊNH QUAN SÁT', 'OBSERVABILITY'),
            value: isLogs
              ? bi('stdout/stderr → docker logs', 'stdout/stderr → docker logs')
              : isExec
                ? bi('docker exec -it <name> sh', 'docker exec -it <name> sh')
                : bi('12-Factor -e ENV', '12-Factor -e ENV'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Mỗi container khởi tạo trong một Network Namespace khép kín — cần ánh xạ cổng -p từ máy chủ vào',
                  'Containers start in an isolated network namespace requiring explicit -p host-to-container port forwarding'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Đổi từ 127.0.0.1 sang --host 0.0.0.0 (Uvicorn / Node) để mở cửa card mạng eth0 đón lưu lượng từ cờ -p',
                  'Bound FastAPI Uvicorn / Node server to 0.0.0.0 so eth0 accepts port-forwarded packets'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Truyền tham số động bằng cờ -e nạp thẳng vào os.environ (Python) và process.env (Node.js)',
                  'Injected runtime environment variables via -e directly into os.environ and process.env'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Đẩy log ra stdout/stderr (kèm PYTHONUNBUFFERED=1 cho Python) để đọc lại qua docker logs kể cả khi Exited',
                  'Streamed unbuffered stdout/stderr logs readable via docker logs even after container crash'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Dùng docker exec -it <tên> sh khám container đang Up và docker inspect soi hồ sơ JSON',
                  'Inspected live container state with docker exec sh and full metadata via docker inspect'
                ),
              },
            ],
            [
              {
                op: '-',
                text: bi(
                  'Tránh truyền mật khẩu nhạy cảm trực tiếp trên lệnh -e gây lộ trong lịch sử shell; dùng sh thay cho bash trên Alpine',
                  'Avoided cleartext secrets in CLI history and used /bin/sh on minimal Alpine/Slim images'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Nguyên tắc ánh xạ cổng (-p)',
              'Port Mapping Principle (-p)',
              'Hãy đọc -p 8080:3000 xuôi từ ngoài vào trong: cổng 8080 mở trên máy chủ (trái) chuyển tiếp lưu lượng qua cầu nối mạng vào cổng 3000 bên trong container (phải).',
              'Always read -p 8080:3000 from outside in: port 8080 on your Host machine forwards across the virtual bridge to port 3000 inside the container.'
            ),
            makeCallout(
              'watch-out',
              'Lỗi phổ biến của Uvicorn / Fastify / Vite: bind 127.0.0.1',
              'Classic Gotcha: Binding 127.0.0.1 Inside Containers',
              'Nghe trên 127.0.0.1 trong container chỉ nhận kết nối nội bộ từ chính container đó, bỏ qua lưu lượng đi vào qua eth0! Luôn đặt --host 0.0.0.0 để mở lắng nghe trên mọi giao diện mạng.',
              'Listening on 127.0.0.1 inside an isolated container ignores traffic arriving on eth0! Always bind Uvicorn, Flask, Fastify, and Vite to 0.0.0.0.'
            ),
            makeCallout(
              'technique',
              'Một Image dùng chung cho mọi môi trường (-e)',
              '12-Factor Config via -e',
              'Không bao giờ đóng cứng URL Database vào code! Truyền qua -e để Python đọc từ os.environ và Node.js đọc từ process.env mà không cần build lại Image.',
              'Keep images environment-agnostic: inject URLs and flags at runtime with -e (or --env-file locally) into os.environ / process.env.'
            ),
            makeCallout(
              'technique',
              'Container sập rồi vẫn đọc được Log!',
              'Logs Survive Container Crashes!',
              'Khi container vừa chạy 0.2s đã tắt (Exited 1), docker exec sẽ từ chối chạy — nhưng docker logs <tên> vẫn giữ nguyên toàn bộ Traceback giúp bạn chẩn đoán lỗi!',
              'docker exec cannot enter an Exited container, but docker logs <name> preserves the full stdout/stderr crash trace until docker rm.'
            ),
            makeCallout(
              'technique',
              'Kiểm tra trực tiếp bằng sh trên nền tối giản',
              'Use sh on Minimal Images',
              'Các image nhẹ như node:22-alpine hay nginx-alpine không cài bash. Hãy tập thói quen gõ docker exec -it <tên> sh khi cần mở shell kiểm tra!',
              'Minimal Alpine images omit bash to save space — always reach for docker exec -it <name> sh when opening an interactive shell.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production',
              'Production Golden Rule',
              'Mở đúng cổng ngoài:trong (-p), lắng nghe trên 0.0.0.0, xuất log ra stdout/stderr (bật PYTHONUNBUFFERED=1 cho Python) và không lộ mật khẩu trên dòng lệnh -e.',
              'Bind 0.0.0.0, stream unbuffered logs to stdout/stderr, map -p HOST:CONTAINER cleanly, and keep production secrets out of raw CLI arguments.'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'usr',
              shape: 'device',
              tone: s === 0 ? 'blue' : 'neutral',
              x: -245,
              y: 10,
              highlighted: s === 0,
              label: bi('Browser :8080', 'Browser :8080'),
            },
            {
              id: 'nat',
              shape: 'block',
              tone: 'blue',
              x: -10,
              y: -25,
              icon: 'globe',
              highlighted: s === 0 || loopbackTrap,
              label: bi('Host Port 8080', 'Host Port 8080'),
              badge: { text: bi('-p 8080:3000', '-p 8080:3000'), tone: 'ok' },
            },
            {
              id: 'cnt',
              shape: 'block',
              tone: loopbackTrap ? 'orange' : 'green',
              x: 230,
              y: 15,
              icon: 'terminal',
              highlighted: s >= 1,
              label: bi('0.0.0.0:3000 / :8000', '0.0.0.0:3000 / :8000'),
              badge: {
                text: isLogs
                  ? bi('stdout → docker logs', 'stdout → docker logs')
                  : isExec
                    ? bi('docker exec sh', 'docker exec sh')
                    : s === 2
                      ? bi('-e ENV Injected', '-e ENV Injected')
                      : bi('eth0 Open (0.0.0.0)', 'eth0 Open (0.0.0.0)'),
                tone: 'ok',
              },
            },
          ],
          links: [
            { id: 'l1', from: 'usr', to: 'nat', label: bi('HTTP GET', 'HTTP GET') },
            { id: 'l2', from: 'nat', to: 'cnt', label: bi('veth → eth0', 'veth → eth0') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.48 },
          ],
        },
      };
    },
  },

  K02: {
    id: 'K02',
    titleEn: 'Kernel Namespaces, cgroups Memory Caps (OOM 137) & Volumes',
    subtitleEn:
      'Understand Linux Namespaces (visibility isolation) vs cgroups (resource limits), Exit 137 OOMKills, and Named Volumes.',
    durationMin: 14,
    difficulty: 'Beginner',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Phân biệt rõ Linux Namespaces (cô lập không gian nhìn) và cgroups (giới hạn tài nguyên RAM/CPU)',
        'Separate Linux Namespaces (visibility isolation) from cgroups (hardware resource limits)'
      ),
      bi(
        'Giải mã công thức Exit Code 137 = 128 + 9 (SIGKILL OOM) và bảo toàn dữ liệu Database bằng Named Volume',
        'Decode Exit 137 (128 + SIGKILL 9) OOMKills and persist stateful DB files on Named Volumes'
      ),
    ],
    buildStep: (s, total) => {
      const isOom = s === 2;
      const isNet = s === 3;
      const isVol = s >= 4;
      return {
        telemetry: [
          {
            label: bi('CÔ LẬP TẦM NHÌN', 'VISIBILITY ISOLATION'),
            value: bi('Namespaces (PID · NET · MNT)', 'Namespaces (PID · NET · MNT)'),
            tone: 'ok',
          },
          {
            label: bi('GIỚI HẠN PHẦN CỨNG', 'RESOURCE LIMITS'),
            value: isOom
              ? bi('Vượt --memory → Exit 137!', 'Over --memory → Exit 137!')
              : bi('cgroups v2 (--memory/--cpus)', 'cgroups v2 (--memory/--cpus)'),
            tone: isOom ? 'bad' : 'ok',
          },
          {
            label: bi('DỮ LIỆU BỀN VỮNG', 'PERSISTENCE'),
            value: isNet
              ? bi('User Bridge + Auto DNS', 'User Bridge + Auto DNS')
              : bi('Named Volume (-v pg-data)', 'Named Volume (-v pg-data)'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Container thực chất là tiến trình Linux gắn Namespaces + cgroups v2, không phải máy ảo',
                  'Unmasked containers as native Linux processes isolated by Namespaces and bounded by cgroups v2'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Kết hợp Namespaces cô lập tầm nhìn PID/Mạng với cgroups giới hạn mức tiêu thụ CPU/RAM',
                  'Combined Namespace visibility isolation with cgroup CPU/Memory quotas'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Khóa --memory=512m chặn rò rỉ RAM; vượt ngưỡng bị Kernel bắn SIGKILL (9) → Exit Code 137 (128+9)',
                  'Capped RAM via --memory=512m; exceeding it triggers Kernel SIGKILL (9) -> Exit Code 137'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Tạo mạng riêng docker network create shop-net để bật sẵn danh bạ Embedded DNS theo tên container',
                  'Created user-defined bridge network enabling automatic container-name DNS resolution'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Tách dữ liệu PostgreSQL ra Named Volume để sống sót nguyên vẹn qua mọi lệnh docker rm -f',
                  'Mounted persistent Named Volume decoupling database files from the ephemeral writable layer'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Hai trụ cột nhân Linux tạo nên Container',
              'Two Native Linux Kernel Primitives',
              'Toàn bộ khả năng cô lập của Docker lẫn Kubernetes dựa trên 2 cơ chế của nhân Linux: Namespaces ("được nhìn thấy gì?") và cgroups ("được tiêu thụ tối đa bao nhiêu?").',
              'Every container in Docker and Kubernetes is built on two Linux Kernel primitives: Namespaces (what it can see) and cgroups (how much it can consume).'
            ),
            makeCallout(
              'compare',
              'Namespaces (cô lập tầm nhìn) vs cgroups (giới hạn tài nguyên)',
              'Namespaces (Isolation) vs cgroups (Resource Limits)',
              'Namespaces cô lập cây tiến trình và mạng để mỗi container chỉ thấy phần của mình; cgroups khóa trần RAM/CPU để một worker rò rỉ bộ nhớ không làm sập cả máy chủ (tương tự vách ngăn căn hộ và cầu dao điện riêng).',
              'Namespaces isolate sightlines while cgroups cap CPU/RAM so one leaky worker cannot starve the server (like apartment walls vs per-unit circuit breakers).'
            ),
            makeCallout(
              'watch-out',
              'Nguyên nhân mã thoát Exit Code 137 (OOMKilled)',
              'Why OOMKills Always Show Exit Code 137',
              'Mặc định docker run KHÔNG khóa trần RAM! Khi đặt --memory mà tiến trình vượt vạch, Kernel bắn SIGKILL (số 9) → theo công thức Unix 128 + 9 sinh ra đúng mã thoát 137!',
              'By default docker run has NO memory cap! Once --memory is set, exceeding it triggers Kernel SIGKILL (signal 9) -> POSIX formula 128 + 9 = Exit Code 137.'
            ),
            makeCallout(
              'technique',
              'Đừng dùng mạng bridge mặc định thiếu DNS!',
              'Always Create a User-Defined Bridge',
              'Mạng bridge mặc định không phân giải tên container. Chỉ cần 1 lệnh docker network create shop-net là API gọi thẳng redis://redis-session:6379 không cần mò IP!',
              'The legacy default bridge lacks DNS. Run docker network create <net> so containers resolve each other cleanly by name.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production',
              'Production Golden Rule',
              'Luôn khóa trần RAM (--memory), dùng mạng riêng có DNS và cất dữ liệu Database vào Named Volume (cẩn thận Bind Mount -v $(pwd):/app đè mất .venv / node_modules!).',
              'Always cap container memory, use user-defined networks, and store databases on Named Volumes (beware bind-mounting over /app/.venv or node_modules!).'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'cg',
              shape: 'block',
              tone: isOom ? 'rose' : 'orange',
              x: -225,
              y: -15,
              icon: 'shield',
              highlighted: s === 1 || isOom,
              label: bi('cgroups Limits', 'cgroups Limits'),
              badge: {
                text: isOom
                  ? bi('SIGKILL 9 → Exit 137!', 'SIGKILL 9 → Exit 137!')
                  : bi('Max 512 MiB RAM', 'Max 512 MiB RAM'),
                tone: isOom ? 'bad' : 'ok',
              },
            },
            {
              id: 'app',
              shape: 'block',
              tone: 'blue',
              x: 5,
              y: 18,
              icon: 'cpu',
              highlighted: s === 0 || s === 1 || isNet,
              label: bi('Container PID 1', 'Container PID 1'),
              badge: {
                text: isNet
                  ? bi('shop-net DNS ✔', 'shop-net DNS ✔')
                  : bi('Isolated Namespaces', 'Isolated Namespaces'),
                tone: 'ok',
              },
            },
            {
              id: 'vol',
              shape: 'db',
              tone: 'green',
              x: 235,
              y: -18,
              highlighted: isVol,
              label: bi('Named Volume', 'Named Volume'),
              badge: isVol
                ? { text: bi('Sống qua docker rm!', 'Survives docker rm!'), tone: 'ok' }
                : undefined,
            },
          ],
          links: [
            {
              id: 'l1',
              from: 'cg',
              to: 'app',
              style: isOom ? 'danger' : 'solid',
              label: bi('enforce quota', 'enforce quota'),
            },
            {
              id: 'l2',
              from: 'app',
              to: 'vol',
              label: bi('/var/lib/postgresql/data', '/var/lib/postgresql/data'),
            },
          ],
          packets: [
            ...(isOom
              ? [{ id: 'pe', linkId: 'l1', kind: 'error' as const, speed: 0.45 }]
              : []),
            { id: 'p1', linkId: 'l2', kind: 'mutation', speed: 0.46 },
          ],
        },
      };
    },
  },

  K03: {
    id: 'K03',
    titleEn: 'Writing Your First Clean Production Dockerfile (Node 22 & Python 3.12 + uv)',
    subtitleEn:
      'Pin deterministic base tags (-alpine vs -slim), lock dependencies (npm ci / uv sync), and preserve SIGTERM via JSON Exec CMD.',
    durationMin: 14,
    difficulty: 'Beginner',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Chọn đúng Base Image ghim phiên bản (node:22-alpine cho Node.js, python:3.12-slim cho Python/FastAPI)',
        'Choose deterministic base tags: node:22-alpine for Node.js and python:3.12-slim for Python/FastAPI'
      ),
      bi(
        'Khóa chặt phụ thuộc (npm ci / uv sync --frozen) và viết CMD dạng mảng JSON Exec Form để PID 1 nhận trực tiếp SIGTERM',
        'Lock dependencies deterministically and use JSON Exec Form CMD so PID 1 handles SIGTERM gracefully'
      ),
    ],
    buildStep: (s, total) => {
      const isCmdStep = s === 3;
      const isMultiLang = s === 4;
      const activeByStep: number[][] = [
        [0, 1, 2, 3, 4],
        [0, 1, 2],
        [0],
        [3, 4],
        [0, 3, 4],
        [0, 1, 2, 3, 4],
      ];
      return {
        telemetry: [
          {
            label: bi('BASE IMAGE', 'BASE IMAGE'),
            value: isMultiLang
              ? bi('node:22-alpine · python:3.12-slim', 'node:22-alpine · python:3.12-slim')
              : bi('Ghim phiên bản rõ ràng', 'Pinned explicit tag'),
            tone: 'ok',
          },
          {
            label: bi('KHÓA THƯ VIỆN', 'LOCKED DEPS'),
            value: bi('npm ci / uv sync --frozen', 'npm ci / uv sync --frozen'),
            tone: 'ok',
          },
          {
            label: bi('CÚ PHÁP CMD', 'CMD FORM'),
            value: isCmdStep
              ? bi('Exec ["..."] (!= /bin/sh)', 'Exec ["..."] (!= /bin/sh)')
              : bi('PID 1 nhận SIGTERM êm', 'PID 1 receives SIGTERM'),
            tone: isCmdStep ? 'warn' : 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Biến quy trình cài đặt thủ công thành kịch bản lắp ráp từng lớp (Layer) tự động trong Dockerfile',
                  'Automated OS, runtime, and dependency setup as deterministic Dockerfile layers'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Thiết lập chuỗi 7 chỉ thị chuẩn: FROM → WORKDIR → ENV → COPY → RUN → EXPOSE → CMD',
                  'Structured the 7 foundational instructions in clean build-to-runtime order'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Chọn python:3.12-slim (glibc cho wheel C/AI) và node:22-alpine (siêu nhẹ ~135MB cho JS)',
                  'Selected python:3.12-slim for glibc wheel compatibility and node:22-alpine for lean JS APIs'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Đổi CMD từ Shell Form sang mảng JSON Exec Form giúp node / uvicorn giữ trực tiếp PID 1 nhận SIGTERM',
                  'Replaced Shell Form with JSON Exec Form CMD so node/uvicorn runs as PID 1 and catches SIGTERM'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Bổ sung cấu hình vàng cho Python 3.12 + uv + FastAPI (PYTHONUNBUFFERED=1, --host 0.0.0.0)',
                  'Added production Python 3.12 + uv + FastAPI recipe alongside Node.js 22 LTS'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Đóng gói thành phẩm bằng docker build -t shop-api:1.0.0 . (luôn nhớ dấu chấm Build Context!)',
                  'Built versioned OCI image via docker build -t shop-api:1.0.0 . with explicit build context'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Dockerfile tạo các lớp ảnh bất biến tuần tự',
              'Dockerfile Builds Deterministic Layers',
              'Mỗi dòng FROM, COPY, RUN tạo ra 1 lớp chỉ đọc chồng lên nhau. Viết tốt một lần, cả dự án Node.js lẫn Python FastAPI đều build ra Image giống hệt 100% ở mọi máy!',
              'Each FROM, COPY, and RUN instruction stacks a read-only layer. Whether packaging Node.js or Python FastAPI, the mental model is 100% identical.'
            ),
            makeCallout(
              'technique',
              'Ưu tiên COPY hơn ADD, nhớ EXPOSE chỉ là tài liệu',
              'Prefer COPY over ADD; EXPOSE is Metadata Only',
              'Luôn dùng COPY minh bạch thay vì ADD (tự giải nén ngầm), và nhớ EXPOSE 3000/8000 không tự mở cổng ra máy chủ — lúc chạy vẫn cần cờ -p!',
              'Always prefer explicit COPY over magic ADD, and remember EXPOSE documents the port without publishing it to the host.'
            ),
            makeCallout(
              'compare',
              'Tại sao Node chuộng -alpine còn Python chuộng -slim?',
              'Why -alpine for Node vs -slim for Python?',
              'Node.js thuần chạy mượt trên Alpine (musl ~135MB). Còn hệ sinh thái Python (pydantic-core, numpy, psycopg) đóng sẵn gói wheel cho glibc, nên python:3.12-slim vừa gọn vừa cài nhanh gấp chục lần!',
              'Pure JS thrives on musl-based node:22-alpine, whereas Python binary wheels target glibc — making python:3.12-slim far faster and cleaner for FastAPI/AI.'
            ),
            makeCallout(
              'watch-out',
              'Lỗi PID 1 khi viết CMD thiếu ngoặc vuông JSON',
              'The Shell-Form CMD PID 1 Trap',
              'Viết CMD node server.js làm /bin/sh giữ PID 1 và nuốt mất tín hiệu dừng SIGTERM! Bắt buộc viết mảng JSON nháy kép: CMD ["node", "src/index.js"] hoặc CMD ["uvicorn", ...].',
              'Shell-form CMD wraps your app in /bin/sh as PID 1, swallowing SIGTERM on stop! Always write double-quoted JSON Exec Form: CMD ["uvicorn", ...].'
            ),
            makeCallout(
              'technique',
              'Cấu hình Python 3.12 + uv + FastAPI chuẩn 2026',
              'Modern Python 3.12 + uv + FastAPI Pattern',
              'Kết hợp uv sync --frozen --no-dev với PYTHONUNBUFFERED=1 (log tức thì) và --host 0.0.0.0 giúp container Python khởi động nhanh, sạch và chuẩn Production ngay từ bài đầu!',
              'Pair uv sync --frozen --no-dev with PYTHONUNBUFFERED=1 and --host 0.0.0.0 for blazing-fast, production-grade FastAPI containers.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production',
              'Production Golden Rule',
              'Ghim cứng tag ở FROM, khóa chặt lockfile (npm ci / uv sync --frozen), dùng JSON Exec Form cho CMD và đừng bao giờ quên dấu chấm "." cuối lệnh docker build!',
              'Pin FROM tags, enforce lockfiles (npm ci / uv sync --frozen), use JSON Exec CMD for PID 1, and pass "." as the build context.'
            ),
          ],
          s,
          total
        ),
        memoryScene: {
          kind: 'tape',
          title: bi(
            'Dây chuyền 5 Bước Trong Dockerfile Chuẩn (Node.js 22 & Python 3.12)',
            '5-Stage Deterministic Dockerfile Pipeline (Node 22 & Python 3.12)'
          ),
          subtitle: isCmdStep
            ? bi(
                'Bước #5 bắt buộc dùng JSON Exec Form ["..."] để tiến trình giữ trực tiếp PID 1!',
                'Stage #5 must use JSON Exec Form ["..."] so your server owns PID 1 and receives SIGTERM!'
              )
            : bi(
                'Mỗi chỉ thị đóng băng một lớp (layer) tất định từ hệ điều hành nền tới lệnh chạy PID 1',
                'Each instruction freezes a reproducible layer from base runtime to PID 1 entrypoint'
              ),
          cells: [
            '1. FROM pinned',
            '2. WORKDIR /app',
            '3. COPY lockfile',
            '4. RUN ci / uv',
            '5. CMD ["exec"]',
          ],
          activeIndices: activeByStep[Math.min(activeByStep.length - 1, s)],
          pointers: isCmdStep
            ? [
                { index: 3, label: 'Locked Deps ✔', tone: 'blue' },
                { index: 4, label: 'PID 1 SIGTERM ✔', tone: 'green' },
              ]
            : s === 2
              ? [{ index: 0, label: 'node:22-alpine / python:3.12-slim', tone: 'green' }]
              : [
                  { index: 0, label: 'No :latest!', tone: 'orange' },
                  { index: 4, label: 'JSON Exec Form', tone: 'green' },
                ],
          outputPill: {
            label: bi('KẾT QUẢ ĐÓNG GÓI', 'BUILD ARTIFACT'),
            value: isMultiLang
              ? bi('Node 22 & FastAPI uv Ready', 'Node 22 & FastAPI uv Ready')
              : bi('shop-api:1.0.0 (PID 1 Clean)', 'shop-api:1.0.0 (PID 1 Clean)'),
            tone: 'green',
          },
        },
        defaultCode: `FROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nEXPOSE 3000\nCMD ["node", "src/index.js"]`,
      };
    },
  },

  K04: {
    id: 'K04',
    titleEn: '20× Faster Builds with Layer Caching, .dockerignore & ARG/ENV',
    subtitleEn:
      'Order Dockerfile instructions from least-changed lockfiles to most-changed code and strip node_modules/.venv/.env.',
    durationMin: 13,
    difficulty: 'Beginner',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Đặt COPY lockfile (package*.json / uv.lock) + RUN cài gói TRƯỚC COPY mã nguồn để đạt 100% Cache Hit khi sửa code',
        'Copy lockfiles and install dependencies BEFORE copying source code to preserve BuildKit Layer Cache'
      ),
      bi(
        'Dùng .dockerignore chặn node_modules, .venv, .git, .env và phân biệt rạch ròi ARG (Build) vs ENV (Run)',
        'Block node_modules, .venv, and .env via .dockerignore and separate build-time ARG from runtime ENV'
      ),
    ],
    buildStep: (s, total) => {
      const isDomino = s === 1;
      const isIgnore = s === 2;
      const isArgEnv = s === 3;
      return {
        telemetry: [
          {
            label: bi('BUILD LẠI KHI SỬA CODE', 'REBUILD TIME'),
            value: isDomino
              ? bi('Sai: 120s → Đúng: 0.8s!', 'Bad: 120s → Optimal: 0.8s!')
              : bi('120s → 0.8s (Cache Hit!)', '120s → 0.8s (Cache Hit!)'),
            tone: 'ok',
          },
          {
            label: bi('BUILD CONTEXT', 'BUILD CONTEXT'),
            value: isIgnore
              ? bi('500 MB → 1.2 MB (.dockerignore)', '500 MB → 1.2 MB (.dockerignore)')
              : bi('Sạch bóng .venv / node_modules', 'Clean of .venv / node_modules'),
            tone: 'ok',
          },
          {
            label: bi('BÍ MẬT TRONG LAYER', 'SECRETS IN IMAGE'),
            value: isArgEnv
              ? bi('Cấm đặt ở ARG / ENV!', 'Never put in ARG / ENV!')
              : bi('0 tệp .env lọt vào Image', '0 .env files leaked'),
            tone: isArgEnv ? 'warn' : 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Khai thác bộ đệm BuildKit Layer Cache tăng tốc đóng gói gấp 20–50 lần trên cả máy dev lẫn CI',
                  'Leveraged BuildKit content-addressed Layer Cache for sub-second code rebuilds'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Đưa COPY package*.json / uv.lock lên trên RUN cài gói, đẩy COPY mã nguồn hay sửa xuống tầng cuối cùng để tránh mất cache dây chuyền',
                  'Moved lockfile COPY + dependency install above source COPY to prevent cascading cache invalidation'
                ),
              },
            ],
            [
              {
                op: '-',
                text: bi(
                  'Thêm .dockerignore chặn sạch node_modules, .venv, __pycache__, .git và tệp mật khẩu .env ngay từ cửa',
                  'Filtered out node_modules, .venv, .git, and .env secrets from Build Context via .dockerignore'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Phân tách ARG (chỉ sống lúc build) với ENV (sống tới lúc chạy) và tuyệt đối không lưu mật khẩu vào cả hai',
                  'Distinguished build-only ARG from runtime ENV and kept secrets out of docker history'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Gộp cài đặt gói hệ thống vào 1 lệnh RUN duy nhất (apk add --no-cache / apt-get + rm lists)',
                  'Combined OS package update, install, and cache cleanup into a single atomic RUN layer'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Nguyên tắc hủy cache theo tầng của BuildKit',
              'Layer Cache Invalidation Principle',
              'Khi một lớp thay đổi, mọi lớp đứng sau nó đều mất cache và phải build lại từ đầu! Vì vậy hãy đặt bước ít đổi nhất lên trên và bước sửa thường xuyên xuống cuối (tương tự xếp chồng gạch từ móng lên nóc).',
              'Mutating an early layer invalidates every layer stacked after it! Always order Dockerfile instructions from least-frequently to most-frequently changed.'
            ),
            makeCallout(
              'technique',
              'Công thức chung cho cả npm ci lẫn uv sync',
              'Universal Rule for Both npm ci and uv sync',
              'Chép riêng package*.json (hoặc pyproject.toml + uv.lock) → chạy cài đặt thư viện → cuối cùng mới COPY mã nguồn. Sửa 100 tệp code cũng chỉ mất 0.8 giây build lại!',
              'Copy only lockfiles first -> install dependencies -> copy app source last. Code edits hit 100% cache on heavy dependency layers!'
            ),
            makeCallout(
              'watch-out',
              'Docker KHÔNG tự đọc .gitignore — Xóa ở layer sau không cứu được .env!',
              'Docker Ignores .gitignore — Later rm Never Erases Earlier Layers!',
              'Nếu quên .dockerignore và lỡ COPY .env ở layer 2, lệnh RUN rm .env ở layer 3 chỉ che mặt ngoài chứ tệp mật khẩu vẫn nằm nguyên trong bản chụp layer 2!',
              'Docker never reads .gitignore! Once .env is copied into layer 2, RUN rm .env in layer 3 only adds a whiteout marker — the secret remains extractable.'
            ),
            makeCallout(
              'compare',
              'ARG biến mất sau lúc build · ENV đi theo lúc chạy',
              'Build-Time ARG vs Runtime ENV',
              'ARG chỉ sống trong lúc docker build; muốn đọc được trong code lúc chạy phải nối ENV APP_VERSION=$APP_VERSION. Và nhớ cả hai đều lộ rõ qua docker history!',
              'ARG vanishes after docker build; promote non-sensitive metadata via ENV KEY=$KEY, and use BuildKit --mount=type=secret for private package tokens.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production',
              'Production Golden Rule',
              'Luôn có tệp .dockerignore đầu dự án, tách tầng lockfile lên trước mã nguồn và dùng RUN apk add --no-cache (hoặc gộp apt-get && rm -rf lists) trong 1 dòng duy nhất.',
              'Ship a strict .dockerignore, isolate lockfile layers ahead of source code, and clean OS package caches inside the exact same RUN instruction.'
            ),
          ],
          s,
          total
        ),
        memoryScene: {
          kind: 'tape',
          title: bi(
            'Tháp Layer Cache Tối Ưu (Ít thay đổi ➔ Thay đổi mỗi phút)',
            'Optimal BuildKit Layer Ordering (Stable ➔ Frequently Edited)'
          ),
          subtitle: isIgnore
            ? bi(
                '.dockerignore chặn sạch node_modules, .venv & .env trước khi bước vào tầng #2!',
                '.dockerignore strips node_modules, .venv & .env before BuildKit evaluates Layer #2!'
              )
            : bi(
                'Sửa code trong src/ hoặc app/ chỉ chạy lại tầng #4 — 3 tầng nặng đầu tiên đạt Cache Hit 0.0s!',
                'Editing src/ or app/ only rebuilds Layer #4 — Layers #1..#3 hit cache in 0.0s!'
              ),
          cells: [
            '1. FROM base',
            '2. COPY lockfile',
            '3. RUN ci / uv',
            '4. COPY src/app',
          ],
          activeIndices: isDomino ? [0, 1, 2] : isIgnore ? [1, 3] : [0, 1, 2, 3],
          pointers: [
            { index: 2, label: '⚡ CACHED (0.0s)', tone: 'green' },
            { index: 3, label: isIgnore ? 'Filtered Context ✔' : 'Rebuild (~0.8s)', tone: 'orange' },
          ],
          outputPill: {
            label: bi('HIỆU SUẤT BUILD', 'BUILD SPEEDUP'),
            value: bi('Nhanh gấp ~25× (Cache Hit)', '~25× Faster (Cache Hit)'),
            tone: 'green',
          },
        },
      };
    },
  },

  K05: {
    id: 'K05',
    titleEn: 'Multi-Stage Builds, Non-Root USER & Native HEALTHCHECK',
    subtitleEn:
      'Shrink Node.js & Python images by ~85%, drop root UID 0 privileges, and run curl-free healthchecks.',
    durationMin: 14,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Tách giai đoạn biên dịch (AS builder) khỏi stage chạy thực tế tinh gọn (AS runner) cho cả TypeScript lẫn Python uv',
        'Separate heavy compiler/uv builder stage from minimal production runtime stage'
      ),
      bi(
        'Hạ quyền Non-Root (USER node / appuser UID 1000, cổng >= 1024) và viết HEALTHCHECK không cần cài curl',
        'Drop root privileges via UID 1000 on ports >= 1024 and configure native curl-free HEALTHCHECKs'
      ),
    ],
    buildStep: (s, total) => {
      const isNonRoot = s === 2;
      const isHealth = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('DUNG LƯỢNG IMAGE', 'IMAGE SIZE'),
            value: bi('1.1 GB → ~140 MB (-87%)', '1.1 GB → ~140 MB (-87%)'),
            tone: 'ok',
          },
          {
            label: bi('ĐẶC QUYỀN CHẠY', 'RUNTIME USER'),
            value: isNonRoot
              ? bi('UID 1000 · Cổng >= 1024!', 'UID 1000 · Port >= 1024!')
              : bi('Non-Root (node / appuser)', 'Non-Root (node / appuser)'),
            tone: isNonRoot ? 'warn' : 'ok',
          },
          {
            label: bi('CẢM BIẾN SỨC KHỎE', 'HEALTHCHECK'),
            value: isHealth
              ? bi('Native fetch / urllib (0 curl)', 'Native fetch / urllib (0 curl)')
              : bi('Exit 0 = healthy', 'Exit 0 = healthy'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '-',
                text: bi(
                  'Giải bài toán nghịch lý đóng gói: cần công cụ nặng lúc build nhưng cần Image siêu nhẹ lúc chạy',
                  'Solved the packaging paradox: full toolchains during build, zero bloat at runtime'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Dùng COPY --from=builder chỉ gắp dist/ (Node) hoặc .venv/ (Python uv) sang stage runner sạch tinh',
                  'Copied only compiled artifacts / pruned .venv across stages via COPY --from=builder'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Chuyển khỏi root (UID 0) sang USER node / appuser (UID 1000) và mở cổng >= 1024 (3000 / 8000)',
                  'Dropped root UID 0 via USER node/appuser (UID 1000) listening on unprivileged ports >= 1024'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Thêm HEALTHCHECK tận dụng sẵn Node fetch() / Python urllib.request không cần cài thêm curl/wget',
                  'Added curl-free HEALTHCHECK using built-in Node 22 fetch() / Python stdlib urllib.request'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Tách stage builder (biên dịch) và stage runner (chạy thực tế)',
              'Separate Builder Stage from Lean Runtime Stage',
              'Multi-stage Dockerfile cho phép dùng nhiều dòng FROM: trình biên dịch C++, TypeScript, uv nằm lại ở stage builder, chỉ thành phẩm tinh gọn được COPY sang stage runner (tương tự tách khu sơ chế khỏi đĩa món ăn phục vụ).',
              'Multi-stage Dockerfiles let you leave TypeScript compilers, gcc, and build caches behind in the builder stage — shipping only lean runtime artifacts.'
            ),
            makeCallout(
              'technique',
              'Áp dụng mượt cho cả TypeScript lẫn Python uv',
              'Works Seamlessly for TypeScript & Python uv',
              'Bên Node dùng npm prune --omit=dev rồi chép dist/; bên Python dùng image uv tạo .venv rồi COPY --from=builder /app/.venv sang python:3.12-slim — sạch cả pip lẫn uv!',
              'Prune dev packages via npm prune --omit=dev (Node) or uv sync --no-dev (Python), copying only dist/ or .venv into a clean runtime base.'
            ),
            makeCallout(
              'watch-out',
              'Mặc định container chạy root (UID 0) — Hạ quyền nhớ tránh cổng 80!',
              'Containers Default to root (UID 0) — Watch Privileged Ports!',
              'Luôn khai báo USER node (hoặc useradd -u 1000 appuser). Lưu ý tài khoản UID >= 1000 không được mở cổng < 1024: cố mở cổng 80 sẽ sập lỗi EACCES, hãy dùng cổng 3000/8000!',
              'Without USER, containers run as UID 0! Switch to UID 1000 and bind ports >= 1024 (3000/8000) to avoid EACCES permission errors on port 80.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production',
              'Production Golden Rule',
              'Bộ ba chuẩn mực 2026: Multi-stage gọt 85% dung lượng + Non-Root UID 1000 (--chown) + HEALTHCHECK dùng thư viện gốc (không cài curl làm mồi cho hacker!).',
              '2026 Production Triad: Multi-stage slimming + Non-root UID 1000 with --chown + curl-free native HEALTHCHECKs returning exit 0.'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'b',
              shape: 'block',
              tone: 'yellow',
              x: -225,
              y: -15,
              icon: 'code',
              dimmed: s >= 2,
              highlighted: s <= 1,
              label: bi('Stage: builder', 'Stage: builder'),
              badge: { text: bi('tsc / uv / gcc (1.1GB)', 'tsc / uv / gcc (1.1GB)') },
            },
            {
              id: 'r',
              shape: 'block',
              tone: 'green',
              x: 45,
              y: 18,
              icon: 'shield',
              highlighted: s >= 1,
              label: bi('Stage: runner', 'Stage: runner'),
              badge: {
                text: isHealth
                  ? bi('HEALTHCHECK ✔ · 140MB', 'HEALTHCHECK ✔ · 140MB')
                  : bi('UID 1000 · ~140MB', 'UID 1000 · ~140MB'),
                tone: 'ok',
              },
            },
            {
              id: 'reg',
              shape: 'db',
              tone: 'blue',
              x: 255,
              y: -22,
              highlighted: isHealth,
              label: bi('Prod Registry', 'Prod Registry'),
            },
          ],
          links: [
            { id: 'l1', from: 'b', to: 'r', label: bi('COPY --from=builder', 'COPY --from=builder') },
            { id: 'l2', from: 'r', to: 'reg', label: bi('push slim image', 'push slim image') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'pointer', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.45, offset: 0.5 },
          ],
        },
      };
    },
  },

  K06: {
    id: 'K06',
    titleEn: 'Local Multi-Service Orchestration with Docker Compose v2',
    subtitleEn:
      'Wire FastAPI/Node API, PostgreSQL, and Redis over service-name DNS with condition: service_healthy startup ordering.',
    durationMin: 13,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Viết compose.yaml chuẩn Compose v2 (bỏ khóa version:, gọi docker compose) và nối mạng qua tên dịch vụ DNS',
        'Write modern compose.yaml manifests (no obsolete version:) and connect via service-name DNS'
      ),
      bi(
        'Kết hợp pg_isready + condition: service_healthy, bảo vệ Named Volume trước down -v và dùng compose watch',
        'Gate API startup on pg_isready service_healthy, protect Named Volumes, and hot-sync via compose watch'
      ),
    ],
    buildStep: (s, total) => {
      const isDnsStep = s === 2;
      const isVolStep = s === 3;
      const isHealthStep = s === 4;
      const isWatchStep = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('PHÂN GIẢI DNS', 'INTERNAL DNS'),
            value: isDnsStep
              ? bi('postgres:5432 (!= localhost)', 'postgres:5432 (!= localhost)')
              : bi('postgres:5432 · cache-redis:6379', 'postgres:5432 · cache-redis:6379'),
            tone: isDnsStep ? 'warn' : 'ok',
          },
          {
            label: bi('CHỐT KHỞI ĐỘNG', 'STARTUP GATE'),
            value: bi('condition: service_healthy', 'condition: service_healthy'),
            tone: 'ok',
          },
          {
            label: bi('TRẢI NGHIỆM DEV', 'DEV WORKFLOW'),
            value: isWatchStep
              ? bi('compose watch + profiles', 'compose watch + profiles')
              : bi('compose.yaml (Compose v2)', 'compose.yaml (Compose v2)'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Gom toàn bộ API, PostgreSQL, Redis, mạng và ổ đĩa vào 1 tệp khai báo compose.yaml duy nhất',
                  'Unified API, PostgreSQL, Redis, networks, and volumes into a single declarative compose.yaml'
                ),
              },
            ],
            [
              {
                op: '-',
                text: bi(
                  'Loại bỏ khóa version: "3.8" lỗi thời và chuyển hẳn sang plugin Go chuẩn docker compose up -d',
                  'Dropped obsolete version: key and adopted built-in Go plugin docker compose up -d'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Kết nối giữa các container bằng chính tên khóa dưới services: (postgres, cache-redis) thay vì localhost',
                  'Wired inter-container URLs using exact Compose service names instead of localhost'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Khai báo pgdata ở cả hai nơi (trong service postgres và khối volumes: cuối tệp) để giữ bền dữ liệu',
                  'Declared top-level Named Volume pgdata preserving database state across compose down'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Gắn healthcheck pg_isready kèm depends_on: condition: service_healthy chống sập API lúc DB mới bật',
                  'Added pg_isready healthcheck with condition: service_healthy preventing premature DB connections'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Bật develop.watch đồng bộ nóng mã nguồn không đè .venv/node_modules và dùng profiles ẩn công cụ nặng',
                  'Enabled develop.watch hot-sync and optional debug profiles for Grafana/Prometheus'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Bước đệm hoàn hảo từ Docker đơn lẻ lên Kubernetes',
              'The Declarative Bridge to Kubernetes',
              'Thay vì nhớ hàng chục cờ docker run rời rạc, compose.yaml dạy bạn tư duy Khai báo (Declarative): mô tả toàn bộ kiến trúc hệ thống trong 1 tệp YAML duy nhất!',
              'compose.yaml shifts you from imperative CLI flags to declarative multi-service architecture — the exact mindset Kubernetes builds upon.'
            ),
            makeCallout(
              'technique',
              'Chuẩn Compose v2 năm 2026: Không gạch ngang, không version:',
              '2026 Compose v2 Standard: Space CLI & No version: Key',
              'Đặt tên tệp chuẩn là compose.yaml, xóa bỏ dòng version: "3.8" cũ ở đầu tệp, và luôn gõ docker compose up -d (cách nhau dấu cách, chạy mượt trên cả OrbStack & Docker).',
              'Name your file compose.yaml, omit the obsolete top-level version: field, and invoke docker compose up -d.'
            ),
            makeCallout(
              'watch-out',
              '80% lỗi kết nối trong Compose là do viết DB_HOST: localhost!',
              '80% of Compose Connection Errors Come from localhost!',
              'Bên trong container api, localhost chỉ là chính container api đó! Muốn gọi sang Postgres hay Redis, bắt buộc dùng tên dịch vụ: postgres:5432 và cache-redis:6379.',
              'Inside the api container, localhost points to api itself! Always connect to sibling containers by their service key (e.g., postgres:5432).'
            ),
            makeCallout(
              'watch-out',
              'Phân biệt quan trọng: compose down vs compose down -v',
              'Critical Distinction: down vs down -v',
              'docker compose down chỉ dọn container & mạng, giữ an toàn 100% dữ liệu DB. Chỉ thêm cờ -v khi bạn thực sự muốn xóa trắng toàn bộ Named Volume!',
              'docker compose down preserves Named Volumes safely; adding -v wipes database volumes clean — use -v only for intentional resets!'
            ),
            makeCallout(
              'technique',
              'depends_on trơn chỉ chờ "vừa bật", chưa chờ "sẵn sàng SQL"!',
              'Plain depends_on Only Waits for Process Start, Not SQL Readiness!',
              'PostgreSQL mất vài giây nạp đĩa mới mở cổng 5432. Hãy luôn ghép healthcheck: pg_isready với condition: service_healthy để Prisma / SQLAlchemy không bao giờ sập lúc khởi động!',
              'Combine pg_isready healthchecks with depends_on: condition: service_healthy so your API waits until Postgres actually accepts queries.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production / Local Dev',
              'Golden Rule for Multi-Service Dev',
              'Dùng tên dịch vụ cho DNS nội bộ, khóa khởi động bằng service_healthy, bảo vệ Named Volume và ưu tiên docker compose watch thay cho mount đè cả thư mục /app.',
              'Use service-name DNS, gate boot order with service_healthy, persist DBs on Named Volumes, and use docker compose watch for clean hot-reload.'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'api',
              shape: 'block',
              tone: 'green',
              x: -195,
              y: 0,
              icon: 'globe',
              highlighted: s === 0 || isDnsStep || isWatchStep,
              label: bi('api (FastAPI / Node)', 'api (FastAPI / Node)'),
              badge: {
                text: isWatchStep
                  ? bi('compose watch sync', 'compose watch sync')
                  : bi('waits service_healthy', 'waits service_healthy'),
                tone: 'ok',
              },
            },
            {
              id: 'pg',
              shape: 'db',
              tone: 'blue',
              x: 185,
              y: -52,
              highlighted: isDnsStep || isVolStep || isHealthStep,
              label: bi('postgres:5432', 'postgres:5432'),
              badge: {
                text: isVolStep
                  ? bi('Volume: pgdata', 'Volume: pgdata')
                  : bi('pg_isready ✔', 'pg_isready ✔'),
                tone: 'ok',
              },
            },
            {
              id: 'rd',
              shape: 'db',
              tone: 'purple',
              x: 185,
              y: 58,
              highlighted: isDnsStep,
              label: bi('cache-redis:6379', 'cache-redis:6379'),
            },
          ],
          links: [
            { id: 'l1', from: 'api', to: 'pg', label: bi('Service DNS', 'Service DNS') },
            {
              id: 'l2',
              from: 'api',
              to: 'rd',
              style: 'dashed',
              label: bi('Service DNS', 'Service DNS'),
            },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'cache-hit', speed: 0.46, offset: 0.48 },
          ],
        },
      };
    },
  },

  K07: {
    id: 'K07',
    titleEn: 'Kubernetes Architecture, 6-Tier Map & Reconciliation Loop',
    subtitleEn:
      'Know when you need K8s, master the Container -> Pod -> Deployment -> Service -> Gateway map, and trace the Control Loop.',
    durationMin: 15,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Biết rõ khi nào chưa cần K8s (Compose / Cloud Run) và thuộc lòng bản đồ 6 tầng: Container → Pod → ReplicaSet → Deployment → Service → Ingress/Gateway',
        'Know when Compose/Cloud Run suffices vs K8s and master the 6-tier object hierarchy'
      ),
      bi(
        'Hiểu kiến trúc Control Plane vs Worker Node (chỉ apiserver chạm etcd), Vòng lặp Đối soát 24/7 và bộ công cụ kind / k3s / k9s',
        'Trace Control Plane vs Worker Nodes, the Reconciliation Loop, 4 YAML root keys, and 2026 tools (kind, k3s, k9s)'
      ),
    ],
    buildStep: (s, total) => {
      const isHierarchy = s === 1;
      const isControlPlane = s === 2;
      const isLoop = s === 3;
      const isTools = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('KHO TRẠNG THÁI', 'STATE STORE'),
            value: bi('etcd (chỉ qua API Server)', 'etcd (via API Server only)'),
            tone: 'ok',
          },
          {
            label: bi('TRÁI TIM K8S', 'CORE ENGINE'),
            value: isLoop
              ? bi('Current → Desired (24/7)', 'Current → Desired (24/7)')
              : bi('Reconciliation Loop', 'Reconciliation Loop'),
            tone: 'ok',
          },
          {
            label: bi('HỆ SINH THÁI 2026', '2026 TOOLING'),
            value: isTools
              ? bi('kind · k3s · k9s · kubectx', 'kind · k3s · k9s · kubectx')
              : bi('apiVersion · kind · metadata · spec', '4 Root YAML Keys'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Bước từ quản lý 1 máy chủ đơn lẻ (Compose) lên hệ điều hành điều phối cụm đa máy chủ tự chữa lành',
                  'Scaled beyond single-host Docker Compose to multi-node self-healing orchestration'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Định vị rõ khi nào dùng Compose / Cloud Run và xếp thẳng hàng 6 tầng: Container → Pod → ReplicaSet → Deployment → Service → Gateway',
                  'Mapped right-sized hosting choices and the 6-tier Kubernetes object hierarchy'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Tách bạch Control Plane (điều phối: apiserver, etcd, scheduler, controller) và Worker Node (thực thi: kubelet, containerd)',
                  'Separated Control Plane components from Worker Node execution agents'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Vận hành Vòng lặp Đối soát liên tục 24/7: Node #2 sập mất 1 Pod → tự động tạo bù sang Node #3',
                  'Activated declarative Reconciliation Loop automatically rescheduling lost Pods across healthy Nodes'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Chuẩn hóa 4 trường gốc YAML (apiVersion: v1 / apps/v1, kind, metadata, spec)',
                  'Standardized on the 4 mandatory YAML root fields using stable v1 and apps/v1 APIs'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Trang bị cụm thực hành siêu nhẹ (kind, k3s, minikube) cùng bộ trợ thủ Terminal k9s + kubectx/kubens',
                  'Equipped modern local clusters (kind, k3s) and TUI productivity tools (k9s, kubectx, kubens)'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Nguyên lý điều phối khai báo của Kubernetes',
              'Kubernetes Declarative Control Loop',
              'Thay vì tự bật từng container thủ công lúc sự cố, bạn chỉ khai báo trạng thái mong muốn (replicas: 3) — K8s liên tục đối soát và tự tạo bù Pod 24/7 (tương tự máy điều hòa tự giữ nhiệt độ cài đặt).',
              'Instead of babysitting servers manually at 3 AM, you declare Desired State (replicas: 3) and Kubernetes continuously reconciles reality to match.'
            ),
            makeCallout(
              'compare',
              'Khi nào chưa cần dùng Kubernetes?',
              'Know When You Do NOT Need Kubernetes Yet',
              '1 VPS nhỏ → Docker Compose là đủ. MVP muốn tự co giãn không lo hạ tầng → Cloud Run / Fly.io. Chỉ lên K8s khi cần điều phối đa dịch vụ, tự chữa lành đa máy chủ và không khóa chặt Cloud!',
              '1 server -> Docker Compose. Zero-ops serverless -> Cloud Run / Fly.io. Choose Kubernetes when running multi-service architectures needing multi-node self-healing and cloud portability.'
            ),
            makeCallout(
              'watch-out',
              'Luật bất khả xâm phạm của Control Plane: Chỉ API Server được chạm etcd!',
              'Golden Architecture Law: ONLY API Server Touches etcd!',
              'Không một thành phần nào (kể cả scheduler, controller hay kubelet trên Worker Node) được đọc/ghi thẳng vào kho etcd — tất cả bắt buộc đi qua cổng kube-apiserver!',
              'Neither kubelet, kube-scheduler, nor controllers ever talk directly to etcd — every read and write flows strictly through kube-apiserver.'
            ),
            makeCallout(
              'technique',
              'Vòng lặp Đối soát (Reconciliation Loop): Observe → Diff → Act',
              'The Declarative Reconciliation Loop',
              'Mỗi giây Controller đều hỏi: "Thực tế (Current = 2 Pod) có khớp Bản thiết kế (Desired = 3 Pod) không?". Hễ lệch là lập tức yêu cầu Scheduler xếp chỗ tạo bù!',
              'Controllers run an infinite Observe -> Diff -> Act loop: whenever Current State drifts from Desired State, K8s schedules replacement Pods automatically.'
            ),
            makeCallout(
              'technique',
              'Thuộc lòng 4 khóa gốc sát lề trái của mọi tệp YAML',
              '4 Root Fields in Every K8s Manifest',
              'Mọi đối tượng K8s luôn bắt đầu bằng: apiVersion (v1 cho Pod/Service, apps/v1 cho Deployment), kind, metadata và spec!',
              'Every Kubernetes manifest starts with four root keys: apiVersion (v1 or apps/v1), kind, metadata, and spec.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng & Bộ đồ nghề 2026',
              'Production & 2026 Tooling Rule',
              'Dựng cụm học trên máy trong 20s bằng kind (hoặc k3s), dùng k9s + kubectx/kubens để lướt cụm cực nhanh, và luôn xem Events ở cuối kubectl describe khi thấy bất thường!',
              'Spin up local clusters in seconds with kind or k3s, navigate fast with k9s + kubectx/kubens, and always check kubectl describe Events first.'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'ctl',
              shape: 'device',
              tone: isTools ? 'blue' : 'neutral',
              x: -255,
              y: 12,
              highlighted: s === 0 || s === 4 || isTools,
              label: bi(isTools ? 'kubectl · k9s' : 'kubectl apply', isTools ? 'kubectl · k9s' : 'kubectl apply'),
            },
            {
              id: 'api',
              shape: 'block',
              tone: 'blue',
              x: -55,
              y: -32,
              icon: 'shield',
              highlighted: isHierarchy || isControlPlane || isLoop,
              label: bi('API Server', 'API Server'),
              badge: { text: bi('Cổng trung tâm duy nhất', 'Sole Central Hub'), tone: 'ok' },
            },
            {
              id: 'etcd',
              shape: 'db',
              tone: 'purple',
              x: 155,
              y: -58,
              highlighted: isControlPlane || s === 4,
              label: bi('etcd (Desired State)', 'etcd (Desired State)'),
            },
            {
              id: 'node',
              shape: 'block',
              tone: 'green',
              x: 185,
              y: 52,
              icon: 'cpu',
              highlighted: isLoop || isTools,
              label: bi('kubelet · containerd', 'kubelet · containerd'),
              badge: {
                text: isLoop
                  ? bi('Self-Heal: 2→3 Ready!', 'Self-Heal: 2→3 Ready!')
                  : bi('Reconcile Pods', 'Reconcile Pods'),
                tone: 'ok',
              },
            },
          ],
          links: [
            { id: 'l1', from: 'ctl', to: 'api', label: bi('YAML spec', 'YAML spec') },
            { id: 'l2', from: 'api', to: 'etcd', label: bi('persist state', 'persist state') },
            { id: 'l3', from: 'api', to: 'node', label: bi('watch & sync', 'watch & sync') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.45, offset: 0.33 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.45, offset: 0.66 },
          ],
        },
      };
    },
  },

  K08: {
    id: 'K08',
    titleEn: 'Pods, Labels, Selectors, Namespaces & ImagePullSecrets',
    subtitleEn:
      'Understand the Pod "shared localhost" wrapper, loose-coupled Label Selectors, Namespace boundaries, and private registry auth.',
    durationMin: 13,
    difficulty: 'Intermediate',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Hiểu vì sao Pod là đơn vị triển khai nhỏ nhất (chia sẻ chung IP/localhost và emptyDir giữa container chính & Sidecar)',
        'Understand Pod as the atomic wrapper sharing IP/localhost and volumes between main & sidecar containers'
      ),
      bi(
        'Kết nối lỏng qua Labels & Selectors, phân tầng cụm bằng Namespace và kéo ảnh nội bộ qua imagePullSecrets',
        'Bind resources via Label Selectors, isolate envs via Namespaces, and authenticate via imagePullSecrets'
      ),
    ],
    buildStep: (s, total) => {
      const isPodStep = s === 1;
      const isLabelStep = s === 2;
      const isNsStep = s === 3;
      const isPullStep = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('ĐƠN VỊ NGUYÊN TỬ', 'ATOMIC UNIT'),
            value: isPodStep
              ? bi('Pod (Chung IP & localhost)', 'Pod (Shared IP & localhost)')
              : bi('Pod (95% bọc 1 container)', 'Pod (95% wrap 1 container)'),
            tone: 'ok',
          },
          {
            label: bi('LIÊN KẾT NHÃN', 'LABEL SELECTOR'),
            value: bi('app=checkout, tier=backend', 'app=checkout, tier=backend'),
            tone: isLabelStep ? 'warn' : 'ok',
          },
          {
            label: bi('KHO RIÊNG TƯ', 'PRIVATE REGISTRY'),
            value: isPullStep
              ? bi('imagePullSecrets: [regcred]', 'imagePullSecrets: [regcred]')
              : bi('Cô lập theo Namespace', 'Namespace-scoped'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Làm quen viên gạch nguyên tử của K8s: Pod bọc ngoài container kèm hệ thống thẻ từ Labels',
                  'Introduced Pods as Kubernetes’ atomic scheduling unit tagged with key-value Labels'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Chia sẻ chung Network Namespace (localhost) và ổ tạm emptyDir giữa container chính và Sidecar',
                  'Shared localhost network namespace and emptyDir volume between main app and Sidecar'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Gắn thẻ metadata.labels (app, tier, env) để Service và Deployment truy vấn động không phụ thuộc tên Pod',
                  'Attached structured key-value Labels enabling loose-coupled Service & Deployment selection'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Phân vùng cụm thành các Namespace (staging, payments) ngăn cách bằng dấu --- trong YAML',
                  'Partitioned cluster logically into Namespaces separated cleanly with --- YAML dividers'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Đính kèm spec.imagePullSecrets trỏ tới Secret dockerconfigjson để kéo Image nội bộ không bị lỗi 401',
                  'Configured spec.imagePullSecrets to pull private GHCR/ECR images without ImagePullBackOff'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Pod: Đơn vị triển khai nhỏ nhất dùng chung IP & localhost',
              'Pod: Atomic Unit Sharing IP & Localhost',
              '95% thời gian 1 Pod chỉ bọc đúng 1 container (FastAPI hoặc Node.js). Khi cần trợ lý Sidecar, Pod cho phép hai container dùng chung 127.0.0.1 và ổ đĩa tạm emptyDir cực tiện!',
              '95% of Pods wrap a single container, while the Pod sandbox lets optional Sidecar helpers share localhost and local emptyDir storage effortlessly.'
            ),
            makeCallout(
              'watch-out',
              'Hai container chung 1 Pod KHÔNG ĐƯỢC mở trùng số cổng!',
              'Containers in the Same Pod Share One Port Table!',
              'Vì dùng chung 1 địa chỉ IP và localhost, nếu cả hai container trong cùng 1 Pod đều mở cổng 3000 sẽ đụng cổng sập ngay! Còn hai Pod khác nhau thì mở cổng 3000 vô tư.',
              'Containers inside one Pod share a single network namespace — binding the same port twice collides immediately, whereas separate Pods have distinct IPs.'
            ),
            makeCallout(
              'watch-out',
              'Gõ lệch 1 chữ trong metadata.labels = Mất mạng tức khắc!',
              'One Typo in metadata.labels Breaks Traffic!',
              'K8s không tìm Pod theo tên mà lọc hoàn toàn qua nhãn (Labels). Sai 1 ký tự ở app: checkout sẽ khiến Service không nhìn thấy Pod đó nữa!',
              'Controllers and Services discover Pods strictly by Label Selectors — a single character typo orphans the Pod from traffic.'
            ),
            makeCallout(
              'technique',
              'Dùng kubens chuyển Namespace nhanh trong 1 lệnh',
              'Switch Namespaces Effortlessly with kubens',
              'Tuyệt đối không nhét ứng dụng kinh doanh vào kube-system! Hãy tách riêng staging / production và dùng kubens để khỏi phải gõ lặp lại -n mỗi lần.',
              'Never deploy apps into kube-system! Isolate workloads per Namespace and use kubens to switch active context cleanly.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production',
              'Production Golden Rule',
              'Đặt chuẩn bộ nhãn (app, tier, env), tách môi trường bằng Namespace, và luôn gắn imagePullSecrets cùng Namespace với Pod khi kéo Image từ kho riêng tư!',
              'Standardize Labels, scope workloads by Namespace, and ensure dockerconfigjson imagePullSecrets exist in the same Namespace as the Pod.'
            ),
          ],
          s,
          total
        ),
        memoryScene: {
          kind: 'refs',
          leftTitle: bi('Bộ lọc Selector & Thẻ xác thực', 'Selectors & Registry Auth'),
          rightTitle: bi(
            isNsStep ? 'Các Pod trong Namespace: payments' : 'Các Pod đang chạy trên Cụm',
            isNsStep ? 'Pods in Namespace: payments' : 'Running Pods in Cluster'
          ),
          names: [
            {
              id: 's1',
              name: 'selector: app=checkout',
              note: bi('khớp nhãn tự động', 'matches labels'),
              targetId: 'p1',
              style: 'solid',
            },
            {
              id: 's2',
              name: isPullStep ? 'imagePullSecrets: regcred' : 'selector: app=ai-worker',
              note: isPullStep
                ? bi('xác thực GHCR/ECR ✔', 'GHCR/ECR auth ✔')
                : bi('tách biệt hoàn toàn', 'isolated'),
              targetId: 'p2',
              style: isPullStep ? 'dashed' : 'solid',
            },
          ],
          objects: [
            {
              id: 'p1',
              typeTag: isPodStep ? 'Pod (Main + Sidecar)' : 'Pod (payments)',
              value: 'checkout-7d9f (1/1 Running)',
              fields: isPodStep
                ? ['shared localhost:3000 + emptyDir', 'labels: app=checkout, tier=backend']
                : ['labels: app=checkout, env=prod'],
              tone: 'green',
              badge: bi('Matched ✔', 'Matched ✔'),
            },
            {
              id: 'p2',
              typeTag: 'Pod (Python FastAPI)',
              value: 'ai-worker-4b2a (1/1 Running)',
              fields: isPullStep
                ? ['image: ghcr.io/acme/ai:1.4', 'pullSecret: regcred (200 OK)']
                : ['labels: app=ai-worker, env=prod'],
              tone: isPullStep ? 'purple' : 'blue',
              badge: isPullStep ? bi('Private Pull ✔', 'Private Pull ✔') : undefined,
            },
          ],
        },
      };
    },
  },

  K09: {
    id: 'K09',
    titleEn: 'Deployments, Self-Healing, Rolling Updates & Instant Rollback',
    subtitleEn:
      'Never deploy naked Pods in production — manage zero-downtime rollouts and 2-second rollbacks via Deployments.',
    durationMin: 14,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Nắm phân cấp 3 tầng (Deployment → ReplicaSet → Pod) và khớp khít selector.matchLabels với template.metadata.labels',
        'Master Deployment -> ReplicaSet -> Pod hierarchy and align selector.matchLabels with Pod template labels'
      ),
      bi(
        'Cấu hình RollingUpdate không gián đoạn (maxUnavailable: 0, maxSurge: 1) và quay lui 2 giây bằng kubectl rollout undo',
        'Configure zero-downtime RollingUpdates (maxUnavailable: 0, maxSurge: 1) and 2-second rollbacks'
      ),
    ],
    buildStep: (s, total) => {
      const isLabelMatch = s === 2;
      const isRolling = s === 3;
      const isUndo = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('CHIẾN LƯỢC CUỘN', 'ROLLOUT STRATEGY'),
            value: bi('maxUnavailable: 0 · maxSurge: 1', 'maxUnavailable: 0 · maxSurge: 1'),
            tone: 'ok',
          },
          {
            label: bi('QUÂN SỐ SẴN SÀNG', 'READY REPLICAS'),
            value: isRolling
              ? bi('4 → tạm vọt 5 → 4 Ready', '4 → surge 5 → 4 Ready')
              : bi('3 / 3 Ready (Self-Healing)', '3 / 3 Ready (Self-Healing)'),
            tone: 'ok',
          },
          {
            label: bi('KHÔI PHỤC PHIÊN BẢN', 'FAST ROLLBACK'),
            value: isUndo
              ? bi('rollout undo (~2 giây!)', 'rollout undo (~2 sec!)')
              : isLabelMatch
                ? bi('selector == template.labels', 'selector == template.labels')
                : bi('Lưu 10 Revision lịch sử', 'Keeps 10 Revisions'),
            tone: isLabelMatch ? 'warn' : 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '-',
                text: bi(
                  'Loại bỏ hoàn toàn Naked Pod mồ côi — đặt mọi dịch vụ dưới quyền giám hộ tự hồi sinh của Deployment',
                  'Eliminated fragile naked Pods in favor of self-healing apps/v1 Deployments'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Thiết lập chuỗi ủy quyền 3 tầng: Deployment (quản lý phiên bản) → ReplicaSet (đếm quân số) → Pod',
                  'Established the 3-tier control chain: Deployment -> ReplicaSet -> Pods'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Khóa khớp tuyệt đối spec.selector.matchLabels với spec.template.metadata.labels để vượt kiểm duyệt API Server',
                  'Aligned spec.selector.matchLabels strictly with spec.template.metadata.labels'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Đặt maxUnavailable: 0 và maxSurge: 1 để bật Pod mới khỏe mạnh xong xuôi rồi mới rút Pod cũ',
                  'Configured maxUnavailable: 0 and maxSurge: 1 guaranteeing zero capacity dip during rollout'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Co giãn nóng bằng kubectl scale và khôi phục bản ổn định trước đó trong 2 giây với kubectl rollout undo',
                  'Executed instant horizontal scaling and 2-second emergency rollback via kubectl rollout undo'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Phân cấp 3 tầng: Deployment → ReplicaSet → Pod',
              '3-Tier Hierarchy: Deployment -> ReplicaSet -> Pod',
              'Pod đơn lẻ chết là mất vĩnh viễn! Khi bọc trong Deployment, ReplicaSet tự động duy trì đủ số bản sao 24/7, còn Deployment điều phối chuyển giao phiên bản mới êm ái (tương tự quản lý → tổ trưởng → nhân viên).',
              'Naked Pods die permanently on node failure. A Deployment delegates headcount to ReplicaSets while orchestrating zero-downtime version transitions.'
            ),
            makeCallout(
              'technique',
              'Bạn chỉ viết YAML cho Deployment — đừng sửa tay ReplicaSet!',
              'Manage Only the Deployment YAML — Never Edit ReplicaSets Directly!',
              'ReplicaSet và tên Pod ngẫu nhiên bên dưới hoàn toàn do Deployment tự sinh ra và điều khiển. Mọi cập nhật Image hay số bản sao đều thực hiện ở cấp Deployment!',
              'Treat ReplicaSets and hashed Pods as managed internals — always apply image and replica changes at the Deployment level.'
            ),
            makeCallout(
              'watch-out',
              'Lệch nhãn giữa selector.matchLabels và template.metadata.labels!',
              'Selector vs Pod Template Label Mismatch!',
              'selector.matchLabels là điều kiện lọc tìm Pod quản lý, còn template.metadata.labels là bộ nhãn gắn lên Pod khi tạo mới. Thiếu hoặc lệch nhau 1 chữ là API Server từ chối thẳng!',
              'Every key-value pair in spec.selector.matchLabels must appear identically in spec.template.metadata.labels or validation fails immediately.'
            ),
            makeCallout(
              'technique',
              'Mở Pod mới trước khi tắt Pod cũ (maxUnavailable: 0)',
              'Start Replacement Pods Before Terminating Old Ones',
              'Với maxUnavailable: 0 và maxSurge: 1, K8s bắt buộc đợi Pod v2 mới báo Ready xong xuôi mới tắt 1 Pod v1 cũ — năng lực phục vụ không bao giờ hụt dù chỉ 1 giây!',
              'Setting maxUnavailable: 0 with maxSurge: 1 ensures a new v2 Pod passes Readiness before any v1 Pod is terminated.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production',
              'Production Golden Rule',
              'Không bao giờ chạy Pod trần; luôn đặt maxUnavailable: 0 kèm readinessProbe, và giữ sẵn lệnh khôi phục 2 giây: kubectl rollout undo deployment/<tên>!',
              'Never run naked Pods; pair maxUnavailable: 0 with readinessProbes, and keep kubectl rollout undo ready for 2-second incident recovery.'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'dep',
              shape: 'block',
              tone: 'purple',
              x: -240,
              y: 0,
              icon: 'layers',
              highlighted: s <= 2 || isUndo,
              label: bi('Deployment', 'Deployment'),
              badge: {
                text: isUndo
                  ? bi('rollout undo (2s!)', 'rollout undo (2s!)')
                  : bi('maxUnavailable: 0', 'maxUnavailable: 0'),
                tone: 'ok',
              },
            },
            {
              id: 'rs2',
              shape: 'block',
              tone: 'green',
              x: 55,
              y: -62,
              icon: 'zap',
              highlighted: isRolling || !isUndo,
              label: bi('ReplicaSet v2', 'ReplicaSet v2'),
              badge: {
                text: isUndo
                  ? bi('Rolled back → 0', 'Rolled back → 0')
                  : bi('Scaling UP (3 Ready)', 'Scaling UP (3 Ready)'),
                tone: isUndo ? 'warn' : 'ok',
              },
            },
            {
              id: 'rs1',
              shape: 'block',
              tone: isUndo ? 'green' : 'neutral',
              x: 55,
              y: 66,
              icon: 'clock',
              dimmed: !isUndo && s === 3,
              highlighted: isUndo,
              label: bi('ReplicaSet v1', 'ReplicaSet v1'),
              badge: {
                text: isUndo
                  ? bi('Restored 3/3 ✔', 'Restored 3/3 ✔')
                  : bi('Saved Revision (0)', 'Saved Revision (0)'),
                tone: isUndo ? 'ok' : 'default',
              },
            },
          ],
          links: [
            { id: 'l1', from: 'dep', to: 'rs2', label: bi('rollout v2', 'rollout v2') },
            {
              id: 'l2',
              from: 'dep',
              to: 'rs1',
              style: isUndo ? 'solid' : 'dashed',
              label: bi(isUndo ? 'instant restore!' : 'keep history', isUndo ? 'instant restore!' : 'keep history'),
            },
          ],
          packets: [
            { id: 'p1', linkId: isUndo ? 'l2' : 'l1', kind: 'response', speed: 0.48 },
          ],
        },
      };
    },
  },

  K10: {
    id: 'K10',
    titleEn: 'Kubernetes Services (ClusterIP / NodePort / LoadBalancer) & CoreDNS',
    subtitleEn:
      'Place a stable switchboard VIP and CoreDNS name (<svc>.<ns>.svc.cluster.local) in front of ephemeral Pods.',
    durationMin: 14,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Phân biệt rõ 3 kiểu Service (ClusterIP nội bộ, NodePort 30000–32767, LoadBalancer đám mây)',
        'Distinguish ClusterIP (internal default), NodePort (30000–32767), and cloud LoadBalancer Services'
      ),
      bi(
        'Tách bạch port vs targetPort, kiểm tra EndpointSlice và gọi chuẩn tên miền CoreDNS xuyên Namespace',
        'Separate Service port from container targetPort, verify Endpoints, and use cross-Namespace CoreDNS FQDNs'
      ),
    ],
    buildStep: (s, total) => {
      const isTypes = s === 1;
      const isPorts = s === 2;
      const isDns = s === 3;
      return {
        telemetry: [
          {
            label: bi('TÊN MIỀN COREDNS', 'COREDNS FQDN'),
            value: isDns
              ? bi('<svc>.<ns>.svc.cluster.local', '<svc>.<ns>.svc.cluster.local')
              : bi('http://shop-api-svc', 'http://shop-api-svc'),
            tone: 'ok',
          },
          {
            label: bi('KIỂU MẶC ĐỊNH', 'DEFAULT TYPE'),
            value: isTypes
              ? bi('ClusterIP (90% nội bộ)', 'ClusterIP (90% internal)')
              : bi('ClusterIP VIP bất biến', 'Stable ClusterIP VIP'),
            tone: 'ok',
          },
          {
            label: bi('ÁNH XẠ CỔNG', 'PORT MAPPING'),
            value: isPorts
              ? bi('port: 80 → targetPort: 3000/8000', 'port: 80 → targetPort: 3000/8000')
              : bi('Chỉ nối tới Pod Ready=true', 'Routes only to Ready Pods'),
            tone: isPorts ? 'warn' : 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Đặt điểm truy cập ổn định Service (ClusterIP VIP) đứng trước dàn Pod có địa chỉ IP thay đổi liên tục',
                  'Placed a stable Service Virtual IP in front of ephemeral, constantly-rescheduled Pod IPs'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Chọn đúng 3 cấp mở cửa: ClusterIP (nội bộ cụm), NodePort (30000–32767) và LoadBalancer (IP Public Cloud)',
                  'Matched ClusterIP, NodePort, and LoadBalancer types to internal, lab, and cloud edge use cases'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Khớp chính xác targetPort của Service với cổng lắng nghe thật bên trong Pod (3000 Node / 8000 FastAPI)',
                  'Aligned Service targetPort with container listening port and verified live EndpointSlices'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Gọi dịch vụ xuyên Namespace qua tên miền chuẩn CoreDNS <service>.<namespace>.svc.cluster.local',
                  'Connected across Namespaces using deterministic 5-part CoreDNS FQDNs'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Tạo nhanh bằng kubectl expose chống lệch nhãn và đặt Named Ports (targetPort: http) linh hoạt',
                  'Used kubectl expose to clone selectors safely and Named Ports to decouple port numbers'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Service: Địa chỉ IP ảo và DNS ổn định trước Pod',
              'Service: Stable Virtual IP & DNS in Front of Pods',
              'Mỗi lần Pod tái tạo là đổi IP mới! Không bao giờ gọi thẳng IP của Pod — hãy gọi qua tên Service để CoreDNS và EndpointSlice định tuyến tới các Pod đang khỏe mạnh (tương tự gọi vào số tổng đài cố định).',
              'Pod IPs change on every rollout! Always connect via a Service name so CoreDNS and EndpointSlices route only to healthy Ready Pods.'
            ),
            makeCallout(
              'compare',
              '90% dịch vụ thực tế chỉ cần mặc định ClusterIP!',
              '90% of Microservices Should Stay ClusterIP!',
              'Database, Redis, AI Worker và các API nội bộ luôn dùng ClusterIP kín đáo. Đừng mở LoadBalancer riêng cho từng dịch vụ lẻ vì vừa tốn phí Cloud vừa phơi bày bề mặt tấn công!',
              'Keep backend APIs, databases, and caches on internal ClusterIP Services; expose a single shared entrypoint via Ingress / Gateway API.'
            ),
            makeCallout(
              'watch-out',
              'port là cổng trên Service VIP · targetPort là cổng trong Pod',
              'port vs targetPort + Empty Endpoints Check',
              'Nếu gọi Service báo lỗi, hãy gõ ngay kubectl get endpoints <svc>: thấy <none> là bạn gõ lệch nhãn selector; thấy có IP mà vẫn lỗi là targetPort lệch với cổng code đang nghe!',
              'Run kubectl get endpoints <svc> first on connection failures: <none> means a selector typo; IPs present with Connection Refused means a targetPort mismatch.'
            ),
            makeCallout(
              'technique',
              'Cùng Namespace gọi tên ngắn · Khác Namespace nối thêm .<ns>',
              'Short Names Intra-Namespace · FQDN Cross-Namespace',
              'Cùng Namespace chỉ cần gọi http://shop-api-svc. Gọi sang Namespace khác bắt buộc ghi rõ: redis-master.cache.svc.cluster.local!',
              'Same-namespace calls use http://shop-api-svc; cross-namespace calls must include the target namespace (<svc>.<ns>.svc.cluster.local).'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production',
              'Production Golden Rule',
              'Mặc định dùng ClusterIP nội bộ, đặt tên cổng Named Ports (targetPort: http) để đổi ngôn ngữ/cổng không bao giờ đứt mạng, và kiểm tra Endpoints sau mỗi lần triển khai.',
              'Default to internal ClusterIP, reference Named Ports (targetPort: http) for zero-breakage port changes, and verify Endpoints on rollout.'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'fe',
              shape: 'device',
              tone: isDns ? 'blue' : 'neutral',
              x: -245,
              y: 10,
              highlighted: s === 0 || isDns,
              label: bi('Client Pod', 'Client Pod'),
              badge: isDns
                ? { text: bi('Cross-NS FQDN', 'Cross-NS FQDN'), tone: 'ok' }
                : undefined,
            },
            {
              id: 'svc',
              shape: 'block',
              tone: 'blue',
              x: -10,
              y: -25,
              icon: 'globe',
              highlighted: s <= 2,
              label: bi('ClusterIP :80', 'ClusterIP :80'),
              badge: {
                text: isTypes
                  ? bi('ClusterIP / NodePort / LB', 'ClusterIP / NodePort / LB')
                  : bi('CoreDNS VIP ổn định', 'Stable CoreDNS VIP'),
                tone: 'ok',
              },
            },
            {
              id: 'pods',
              shape: 'crowd',
              tone: 'green',
              x: 235,
              y: 15,
              highlighted: isPorts || s >= total - 1,
              label: bi('Ready Pods :3000/:8000', 'Ready Pods :3000/:8000'),
              badge: {
                text: bi('EndpointSlice (Ready=true)', 'EndpointSlice (Ready=true)'),
                tone: 'ok',
              },
            },
          ],
          links: [
            { id: 'l1', from: 'fe', to: 'svc', label: bi('http://shop-api-svc:80', 'http://shop-api-svc:80') },
            { id: 'l2', from: 'svc', to: 'pods', label: bi('targetPort: http', 'targetPort: http') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.48 },
          ],
        },
      };
    },
  },

  K11: {
    id: 'K11',
    titleEn: 'Exposing Apps to the Internet: Ingress, TLS & 2026 Gateway API',
    subtitleEn:
      'Consolidate L7 HTTPS routing behind 1 LoadBalancer and navigate the 2026 shift from Ingress NGINX to Gateway API.',
    durationMin: 14,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Dùng chung 1 Cloud LoadBalancer cho hàng chục dịch vụ qua Ingress / Gateway Controller kèm giải mã TLS (cert-manager)',
        'Share 1 Cloud LoadBalancer across N microservices with edge TLS termination via cert-manager'
      ),
      bi(
        'Nắm vững cả networking.k8s.io/v1 Ingress lẫn bước ngoặt 2026 chuyển từ Ingress NGINX sang Gateway API (Envoy, Cilium, Traefik)',
        'Master standard v1 Ingress AND the 2026 ecosystem transition from Ingress NGINX to Gateway API HTTPRoute'
      ),
    ],
    buildStep: (s, total) => {
      const isCtrlWarn = s === 1;
      const isIngressSpec = s === 2;
      const isGateway2026 = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('CỬA NGÕ LAYER 7', 'L7 ENTRYPOINT'),
            value: isGateway2026
              ? bi('Gateway API (HTTPRoute)', 'Gateway API (HTTPRoute)')
              : bi('Ingress + Controller TLS', 'Ingress + Controller TLS'),
            tone: 'ok',
          },
          {
            label: bi('CHI PHÍ CLOUD LB', 'CLOUD LB COST'),
            value: bi('1 IP chung cho 20+ dịch vụ', '1 Shared IP for 20+ svcs'),
            tone: 'ok',
          },
          {
            label: bi('XU HƯỚNG 2026', '2026 STANDARD'),
            value: isGateway2026
              ? bi('Envoy · Cilium · Traefik', 'Envoy · Cilium · Traefik')
              : isIngressSpec
                ? bi('pathType: Prefix + TLS Secret', 'pathType: Prefix + TLS Secret')
                : bi('Bản khai báo YAML + Controller', 'YAML Rule + Controller Pod'),
            tone: isCtrlWarn ? 'warn' : 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '-',
                text: bi(
                  'Gom 20 bộ cân bằng tải đắt đỏ về đúng 1 cổng gác HTTPS tầng 7 thông minh đứng đầu cụm',
                  'Consolidated 20 costly cloud LoadBalancers into a single shared Layer-7 HTTPS entrypoint'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Phân biệt rõ bản khai báo quy tắc (Ingress/HTTPRoute YAML) với bộ thực thi lưu lượng (Controller Pod)',
                  'Separated declarative routing manifests from the live data-plane Controller Pod executing them'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Cấu hình networking.k8s.io/v1 Ingress chuẩn: ingressClassName, pathType: Prefix và chứng chỉ TLS Secret',
                  'Configured v1 Ingress with ingressClassName, mandatory pathType, and TLS termination Secret'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Chuyển dịch chuẩn 2026 sang Gateway API (Gateway + HTTPRoute chia Canary weight gốc trên Envoy/Cilium/Traefik)',
                  'Adopted 2026 Gateway API separating infra Gateways from dev-owned HTTPRoutes with native Canary weights'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Một điểm nhận HTTPS duy nhất cho nhiều dịch vụ nội bộ',
              'One Shared HTTPS Entrypoint for Many Microservices',
              'Thay vì thuê 20 IP công cộng tốn kém, mọi lưu lượng HTTPS đi vào 1 cổng duy nhất, giải mã SSL tập trung rồi rẽ nhánh /api sang Node, /ai sang Python FastAPI!',
              'Terminate HTTPS once at the cluster edge and route /api, /ai, and / cleanly to internal ClusterIP Services.'
            ),
            makeCallout(
              'watch-out',
              'Ingress/HTTPRoute YAML sẽ không hoạt động nếu thiếu Controller',
              'An Ingress YAML Does Nothing Without a Running Controller!',
              'kind: Ingress chỉ là bản khai báo quy tắc định tuyến. Cụm bắt buộc phải cài sẵn Pod Controller đang chạy thực tế (như Envoy Gateway, Cilium, Traefik) để mở cổng tiếp nhận lưu lượng!',
              'Ingress/HTTPRoute manifests are purely declarative rules — your cluster must run an active Controller Pod to actually accept traffic.'
            ),
            makeCallout(
              'technique',
              '4 trường bắt buộc của networking.k8s.io/v1 Ingress',
              '4 Must-Have Fields in v1 Ingress',
              'Luôn ghi rõ spec.ingressClassName, pathType (Prefix hoặc Exact), cấu trúc backend.service.port.number và spec.tls[].secretName (do cert-manager tự gia hạn)!',
              'Always specify ingressClassName, explicit pathType, backend.service.port.number, and cert-manager TLS Secrets.'
            ),
            makeCallout(
              'good-to-know',
              'Chuyển dịch năm 2026: Từ Ingress NGINX sang chuẩn Gateway API',
              '2026 Industry Shift: Ingress NGINX Retirement -> Gateway API',
              'Dự án cộng đồng Ingress NGINX đang nghỉ hưu! Khi dựng cụm mới năm 2026, hãy ưu tiên Kubernetes Gateway API (Gateway cho Infra + HTTPRoute chia tải Canary gốc cho Dev) trên nền Envoy Gateway, Cilium hoặc Traefik.',
              'With community Ingress NGINX retiring, greenfield 2026 clusters standardize on Kubernetes Gateway API (Gateway + HTTPRoute) backed by Envoy Gateway, Cilium, or Traefik.'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'usr',
              shape: 'crowd',
              tone: 'neutral',
              x: -250,
              y: 10,
              highlighted: s === 0,
              label: bi('HTTPS Users', 'HTTPS Users'),
            },
            {
              id: 'ing',
              shape: 'block',
              tone: isGateway2026 ? 'blue' : 'purple',
              x: -25,
              y: -25,
              icon: 'shield',
              highlighted: s >= 1,
              label: bi(
                isGateway2026 ? 'Gateway API (Envoy/Cilium)' : 'Ingress Controller TLS',
                isGateway2026 ? 'Gateway API (Envoy/Cilium)' : 'Ingress Controller TLS'
              ),
              badge: {
                text: isGateway2026
                  ? bi('HTTPRoute · Canary 90/10', 'HTTPRoute · Canary 90/10')
                  : bi('TLS 443 Termination', 'TLS 443 Termination'),
                tone: 'ok',
              },
            },
            {
              id: 'svc',
              shape: 'block',
              tone: 'green',
              x: 225,
              y: 15,
              icon: 'globe',
              highlighted: isIngressSpec || isGateway2026,
              label: bi('ClusterIP Services', 'ClusterIP Services'),
              badge: { text: bi('/api · /ai · /web', '/api · /ai · /web'), tone: 'ok' },
            },
          ],
          links: [
            { id: 'l1', from: 'usr', to: 'ing', label: bi('HTTPS 443 (1 IP)', 'HTTPS 443 (1 IP)') },
            {
              id: 'l2',
              from: 'ing',
              to: 'svc',
              label: bi(isGateway2026 ? 'HTTPRoute weight' : '/api prefix', isGateway2026 ? 'HTTPRoute weight' : '/api prefix'),
            },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.48 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.48, offset: 0.48 },
          ],
        },
      };
    },
  },

  K12: {
    id: 'K12',
    titleEn: 'Configuration & Secrets: ConfigMap, Secret & Security Realities',
    subtitleEn:
      'Decouple 12-Factor config from images, understand envFrom vs tmpfs volumes, and remember Base64 is NOT encryption.',
    durationMin: 13,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Tách bạch ConfigMap (thông số công khai) và Secret (nhạy cảm), phân biệt nạp tĩnh envFrom với gắn tệp tự đồng bộ volumeMounts',
        'Separate ConfigMaps from Secrets and contrast static envFrom injection against auto-synced readOnly volumes'
      ),
      bi(
        'Nhớ kỹ Base64 chỉ là encoding (không phải mã hóa!) — bảo vệ bằng KMS, RBAC, External Secrets và Fail-Fast Validation (pydantic-settings / zod)',
        'Remember Base64 is NOT encryption — use KMS, External Secrets, and startup schema validation (pydantic-settings / zod)'
      ),
    ],
    buildStep: (s, total) => {
      const isMountStep = s === 1;
      const isBase64Warn = s === 2;
      const isFailFast = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('IMAGE DÙNG CHUNG', 'IMMUTABLE IMAGE'),
            value: bi('1 Image xuyên Dev→Prod', '1 Image across Dev→Prod'),
            tone: 'ok',
          },
          {
            label: bi('BẢN CHẤT BASE64', 'SECRET ENCODING'),
            value: isBase64Warn
              ? bi('Base64 != Encryption (Cấm Git!)', 'Base64 != Encryption (No Git!)')
              : bi('KMS + External Secrets', 'KMS + External Secrets'),
            tone: isBase64Warn ? 'bad' : 'ok',
          },
          {
            label: bi('CẬP NHẬT CẤU HÌNH', 'CONFIG RELOAD'),
            value: isMountStep
              ? bi('envFrom (tĩnh) vs Volume (~60s)', 'envFrom (static) vs Vol (~60s)')
              : bi('Fail-Fast: pydantic / zod', 'Fail-Fast: pydantic / zod'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Tách hoàn toàn tham số môi trường thành ConfigMap (công khai) và Secret (nhạy cảm) ngoài Image',
                  'Decoupled runtime config into ConfigMaps (public) and Secrets (sensitive) outside the image'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Đối chiếu nạp biến môi trường envFrom (cần rollout restart khi đổi) và gắn ổ chỉ đọc readOnly: true (tự đồng bộ)',
                  'Compared static envFrom variables against auto-refreshing readOnly tmpfs volume mounts'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Chặn việc đẩy Secret Base64 thô lên Git — triển khai Encryption at Rest (KMS) và External Secrets / SOPS',
                  'Blocked raw Base64 Secrets from Git, enforcing etcd KMS encryption and External Secrets Operator'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Bắt lỗi thiếu biến ngay giây đầu khởi động bằng pydantic-settings (FastAPI) / zod (Node) và gỡ lỗi CreateContainerConfigError',
                  'Added Fail-Fast env validation (pydantic-settings / zod) and diagnosed CreateContainerConfigError'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Phân biệt ConfigMap (công khai) và Secret (nhạy cảm)',
              'Public ConfigMap vs Sensitive Secret',
              'ConfigMap chứa thông số thường (LOG_LEVEL, PORT) lưu lên Git bình thường. Secret chứa mật khẩu DB / API Key được K8s nạp trên bộ nhớ RAM tmpfs và kiểm soát quyền đọc riêng qua RBAC (tương tự bảng thông báo chung vs hồ sơ mật có khóa).',
              'ConfigMaps store plain settings safe for Git; Secrets hold credentials mounted via RAM-backed tmpfs and guarded by strict RBAC.'
            ),
            makeCallout(
              'compare',
              'Sửa ConfigMap xong mà Pod chưa nhận giá trị mới?',
              'Why Didn’t Editing ConfigMap Update My Running App?',
              'Biến nạp qua env / envFrom chỉ đọc đúng 1 lần lúc container bật — muốn nhận giá trị mới phải chạy kubectl rollout restart! Còn gắn thành tệp Volume thì kubelet tự đồng bộ sau ~60s.',
              'Environment variables (env/envFrom) are frozen at process start — run kubectl rollout restart to refresh! Volume-mounted files auto-sync in ~60s.'
            ),
            makeCallout(
              'watch-out',
              'Base64 chỉ là encoding — bất kỳ ai cũng giải mã trong tích tắc',
              'Base64 Is Encoding, NOT Cryptographic Encryption!',
              'Đừng bao giờ commit tệp Secret YAML lên Git vì nghĩ chuỗi Base64 đã mã hóa! Trên Production hãy dùng External Secrets Operator kéo từ Vault/Cloud KMS hoặc mã hóa bằng SOPS.',
              'Anyone can decode Base64 in milliseconds with base64 -d! Never commit raw Secret YAMLs to Git — use External Secrets Operator or SOPS.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production',
              'Production Golden Rule',
              'Sai tên Secret/key sẽ chặn Pod ở CreateContainerConfigError; còn thiếu biến trong envFrom hãy bắt ngay lúc khởi động bằng pydantic-settings (Python) hoặc zod (Node.js)!',
              'Missing Secret refs trigger CreateContainerConfigError; validate envFrom schemas at boot with pydantic-settings (Python) or zod (Node.js).'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'cm',
              shape: 'db',
              tone: 'blue',
              x: -225,
              y: -48,
              highlighted: s === 0 || isMountStep,
              label: bi('ConfigMap (data:)', 'ConfigMap (data:)'),
              badge: { text: bi('Plain Config · Git OK', 'Plain Config · Git OK'), tone: 'ok' },
            },
            {
              id: 'sec',
              shape: 'db',
              tone: isBase64Warn ? 'rose' : 'orange',
              x: -225,
              y: 55,
              highlighted: s === 0 || isBase64Warn,
              label: bi('Secret (tmpfs RAM)', 'Secret (tmpfs RAM)'),
              badge: {
                text: isBase64Warn
                  ? bi('Base64 != Encrypted!', 'Base64 != Encrypted!')
                  : bi('KMS + ESO Protected', 'KMS + ESO Protected'),
                tone: isBase64Warn ? 'bad' : 'ok',
              },
            },
            {
              id: 'pod',
              shape: 'block',
              tone: 'green',
              x: 195,
              y: 5,
              icon: 'shield',
              highlighted: isMountStep || isFailFast,
              label: bi('App Pod (Python / Node)', 'App Pod (Python / Node)'),
              badge: {
                text: isFailFast
                  ? bi('pydantic / zod Verified ✔', 'pydantic / zod Verified ✔')
                  : bi('envFrom + readOnly Vol', 'envFrom + readOnly Vol'),
                tone: 'ok',
              },
            },
          ],
          links: [
            { id: 'l1', from: 'cm', to: 'pod', label: bi('envFrom / file', 'envFrom / file') },
            {
              id: 'l2',
              from: 'sec',
              to: 'pod',
              style: isBase64Warn ? 'danger' : 'solid',
              label: bi('secretKeyRef / tmpfs', 'secretKeyRef / tmpfs'),
            },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            {
              id: 'p2',
              linkId: 'l2',
              kind: isBase64Warn ? 'error' : 'response',
              speed: 0.45,
              offset: 0.48,
            },
          ],
        },
        defaultCode: `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: api-config\ndata:\n  LOG_LEVEL: "info"\n---\napiVersion: v1\nkind: Secret\nmetadata:\n  name: db-credentials\ntype: Opaque\nstringData:\n  DB_PASSWORD: "placeholder-change-me"`,
      };
    },
  },

  K13: {
    id: 'K13',
    titleEn: 'Persistent Storage: StorageClass, PVC & StatefulSets',
    subtitleEn:
      'Provision cloud SSDs dynamically via StorageClass/PVC and run stateful databases with sticky identities (postgres-0).',
    durationMin: 14,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Hiểu chuỗi cấp phát tự động StorageClass → PVC → PV và 3 chế độ truy cập (RWO 1 Node, ROX chỉ đọc, RWX đa Node)',
        'Trace dynamic StorageClass -> PVC -> PV provisioning and RWO / ROX / RWX access modes'
      ),
      bi(
        'Dùng StatefulSet + volumeClaimTemplates + Headless Service (clusterIP: None) cho Database cần định danh cố định',
        'Combine StatefulSet, volumeClaimTemplates, and Headless Services for sticky database identities'
      ),
    ],
    buildStep: (s, total) => {
      const isPvcFlow = s === 1;
      const isMount = s === 2;
      const isStateful = s === 3;
      const isHeadless = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('CẤP PHÁT ĐỘNG', 'PROVISIONING'),
            value: bi('PVC → StorageClass → PV', 'PVC → StorageClass → PV'),
            tone: 'ok',
          },
          {
            label: bi('CHẾ ĐỘ ĐĨA KHỐI', 'BLOCK ACCESS'),
            value: isPvcFlow
              ? bi('ReadWriteOnce (1 Node)', 'ReadWriteOnce (1 Node)')
              : bi('Bound 1:1 Cloud SSD', 'Bound 1:1 Cloud SSD'),
            tone: 'ok',
          },
          {
            label: bi('ĐỊNH DANH CỐ ĐỊNH', 'STICKY IDENTITY'),
            value: isHeadless
              ? bi('clusterIP: None · pg-0, pg-1', 'clusterIP: None · pg-0, pg-1')
              : bi('postgres-0, postgres-1', 'postgres-0, postgres-1'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Tách ổ đĩa ra khỏi từng máy lẻ để dữ liệu đám mây tự động tháo-lắp đi theo Pod sang mọi Worker Node',
                  'Decoupled storage from local host disks so cloud volumes follow Pods across Worker Nodes'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Khai báo PVC chọn hạng đĩa StorageClass (gp3) để CSI Driver tự cấp phát ổ SSD thật PV ở chế độ ReadWriteOnce',
                  'Submitted PVC against StorageClass triggering automatic CSI provisioning of a Bound cloud PV'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Nối PVC vào Pod qua cặp volumes[].persistentVolumeClaim và volumeMounts[].mountPath',
                  'Mounted Bound PVC into container filesystem path cleanly'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Chuyển Database sang StatefulSet + volumeClaimTemplates để mỗi bản sao (postgres-0, postgres-1) có ổ đĩa độc lập',
                  'Adopted StatefulSet + volumeClaimTemplates giving each DB replica a dedicated PVC and ordered lifecycle'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Gắn Headless Service (clusterIP: None) cấp DNS riêng từng máy và giữ an toàn PVC ngay cả khi xóa StatefulSet',
                  'Paired Headless Service (clusterIP: None) for per-pod DNS and retained PVCs across StatefulSet deletion'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Lưu trữ động qua StorageClass, PVC và PV',
              'Dynamic Storage via StorageClass, PVC & PV',
              'Trên cụm nhiều máy chủ, Pod hôm nay chạy ở máy #1 mai có thể dời sang máy #8. Nhờ PVC + CSI Driver, ổ đĩa đám mây tự động tháo khỏi máy #1 và gắn sang máy #8 theo Pod (tương tự tủ hành lý di động đi theo nhân viên).',
              'When a Pod reschedules from Node #1 to Node #8, CSI detaches the cloud block volume and reattaches it automatically to the new Node.'
            ),
            makeCallout(
              'watch-out',
              'Sai tên StorageClass = Cả PVC lẫn Pod đứng hình mãi ở Pending!',
              'StorageClass Typo = Both PVC and Pod Stuck Pending!',
              'Luôn kiểm tra kubectl get storageclass trước! Và nhớ ổ đĩa khối EBS/PD chuẩn chỉ hỗ trợ ReadWriteOnce (1 Node); muốn nhiều Node cùng ghi (RWX) phải dùng ổ mạng EFS/NFS.',
              'Verify kubectl get storageclass! Cloud block disks (EBS/PD) support ReadWriteOnce; multi-node ReadWriteMany requires network filesystems like EFS/Filestore.'
            ),
            makeCallout(
              'technique',
              'Chia sẻ mô hình AI lớn an toàn với ReadOnlyMany (ROX)',
              'Share Large AI Model Weights via ReadOnlyMany (ROX)',
              'Với dịch vụ Python AI cần 10 Pod trên 5 Node cùng đọc bộ trọng số mô hình vài chục GB mà không sửa đổi, chế độ ReadOnlyMany vừa an toàn vừa tiết kiệm dung lượng!',
              'ReadOnlyMany (ROX) lets dozens of Python inference Pods across nodes mount shared model artifacts safely without write contention.'
            ),
            makeCallout(
              'compare',
              'Vì sao Database dùng Deployment sẽ hỏng dữ liệu ngay?',
              'Why Databases Corrupt Data Under a Plain Deployment',
              'Deployment cho mọi bản sao dùng chung 1 PVC — 2 tiến trình Postgres cùng ghi đè 1 tệp nhị phân sẽ hỏng DB ngay! StatefulSet đúc riêng mỗi Pod 1 ổ PVC (data-postgres-0, data-postgres-1).',
              'Deployments share one PVC across replicas — fatal for binary DB files! StatefulSets mint a dedicated PVC per ordinal via volumeClaimTemplates.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production 2026',
              '2026 Production Golden Rule',
              'StatefulSet đi đôi với Headless Service (clusterIP: None) và cố tình giữ lại PVC khi xóa để bảo vệ dữ liệu; thực tế năm 2026 ưu tiên Cloud Managed DB hoặc Operator như CloudNativePG!',
              'Pair StatefulSets with Headless Services (clusterIP: None); in 2026 production, prefer managed cloud DBs (RDS/Cloud SQL) or mature operators like CloudNativePG.'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'pod',
              shape: 'block',
              tone: 'blue',
              x: -225,
              y: 0,
              icon: 'cpu',
              highlighted: isMount || isStateful || isHeadless,
              label: bi('postgres-0', 'postgres-0'),
              badge: {
                text: isHeadless
                  ? bi('DNS: postgres-0.<svc>', 'DNS: postgres-0.<svc>')
                  : bi('StatefulSet Ordinal #0', 'StatefulSet Ordinal #0'),
                tone: 'ok',
              },
            },
            {
              id: 'pvc',
              shape: 'block',
              tone: 'purple',
              x: 5,
              y: -28,
              icon: 'layers',
              highlighted: s === 0 || isPvcFlow || isMount,
              label: bi('PVC: data-postgres-0', 'PVC: data-postgres-0'),
              badge: { text: bi('ReadWriteOnce · Bound', 'ReadWriteOnce · Bound'), tone: 'ok' },
            },
            {
              id: 'pv',
              shape: 'db',
              tone: 'green',
              x: 235,
              y: 15,
              highlighted: isPvcFlow || isHeadless,
              label: bi('Cloud SSD PV (gp3)', 'Cloud SSD PV (gp3)'),
              badge: isHeadless
                ? { text: bi('Retained on delete ✔', 'Retained on delete ✔'), tone: 'ok' }
                : undefined,
            },
          ],
          links: [
            { id: 'l1', from: 'pod', to: 'pvc', label: bi('volumeMount', 'volumeMount') },
            { id: 'l2', from: 'pvc', to: 'pv', label: bi('StorageClass CSI', 'StorageClass CSI') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.45, offset: 0.48 },
          ],
        },
      };
    },
  },

  K14: {
    id: 'K14',
    titleEn: 'Health Probes (Startup · Readiness · Liveness) & Graceful Shutdown',
    subtitleEn:
      'Prevent traffic from hitting cold pods, avoid DB checks in Liveness, and drain requests cleanly with preStop + SIGTERM.',
    durationMin: 14,
    difficulty: 'Advanced',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Phân biệt rạch ròi: startupProbe (chờ khởi tạo nặng), readinessProbe (ngắt/mở khách, không giết Pod) và livenessProbe (khởi động lại khi treo cứng)',
        'Distinguish startupProbe (slow boot), readinessProbe (traffic gating), and livenessProbe (deadlock restart)'
      ),
      bi(
        'Cấm kiểm tra Database trong livenessProbe gây sập dây chuyền và ghép preStop (sleep 5) + SIGTERM triệt tiêu lỗi 502 lúc tắt Pod',
        'Never query external DBs in livenessProbes, and pair preStop sleep with SIGTERM draining for zero-502 shutdowns'
      ),
    ],
    buildStep: (s, total) => {
      const isThreeProbes = s === 1;
      const isDbTrap = s === 2;
      const isShutdown = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('STARTUP PROBE', 'STARTUP PROBE'),
            value: bi('Ân hạn nạp AI/DB (60s)', 'Protects slow boot (60s)'),
            tone: 'ok',
          },
          {
            label: bi('LIVENESS VS DB', 'LIVENESS VS DB'),
            value: isDbTrap
              ? bi('CẤM gọi DB trong Liveness!', 'NEVER query DB in Liveness!')
              : bi('/healthz nhẹ != /readyz', 'Light /healthz != /readyz'),
            tone: isDbTrap ? 'bad' : 'ok',
          },
          {
            label: bi('TẮT ÊM KHÔNG 502', 'ZERO-502 STOP'),
            value: isShutdown
              ? bi('preStop (5s) → SIGTERM (25s)', 'preStop (5s) → SIGTERM (25s)')
              : bi('preStop + SIGTERM drain', 'preStop + SIGTERM drain'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Vượt qua ảo tưởng "STATUS = Running là đã khỏe" — gắn 3 cảm biến nhịp tim thực tế cho kubelet',
                  'Moved beyond naive PID Running status by wiring 3 lifecycle-aware kubelet health probes'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Phân vai rõ: startupProbe bảo vệ lúc mới bật, readinessProbe rút/nối Service VIP, livenessProbe trị deadlock',
                  'Assigned distinct duties: startup protects boot, readiness gates Service VIPs, liveness restarts deadlocks'
                ),
              },
            ],
            [
              {
                op: '-',
                text: bi(
                  'Tách riêng /healthz nội tại cho Liveness và /readyz kiểm tra DB cho Readiness — chặn đứng bão restart dây chuyền!',
                  'Removed external DB checks from /healthz Liveness preventing Thundering Herd cascading restarts'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Thêm móc đệm lifecycle.preStop (sleep 5) chờ mạng gỡ IP xong mới gửi SIGTERM xả nốt giao dịch trong quỹ 30s',
                  'Added 5s preStop buffer ahead of SIGTERM eliminating race-condition 502 errors during Pod termination'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Vai trò của 3 loại Health Probe',
              'Role of the 3 Health Probes',
              'startupProbe chờ quá trình khởi tạo chậm lần đầu; readinessProbe quyết định Pod có được nhận lưu lượng từ Service hay không mà không giết container; livenessProbe phát hiện deadlock để khởi động lại container (tương tự đun nóng máy đầu ngày, treo biển tạm ngưng nhận đơn khi bận, và khởi động lại khi nhân sự ngất).',
              'startupProbe protects slow boot; readinessProbe gates Service traffic without killing Pods; livenessProbe restarts frozen deadlocked processes.'
            ),
            makeCallout(
              'technique',
              'Ứng dụng Python nạp mô hình AI mất 30s? Hãy bật startupProbe!',
              'Slow AI Model / Cache Warmup? Enable startupProbe!',
              'Chừng nào startupProbe chưa thành công lần đầu, K8s tạm khóa liveness & readiness để Pod không bị giết oan giữa lúc đang tải trọng số mô hình!',
              'startupProbe disables liveness and readiness checks until initial boot finishes (up to periodSeconds * failureThreshold).'
            ),
            makeCallout(
              'watch-out',
              'Sai lầm nghiêm trọng trên Production: Nhét SELECT 1 vào livenessProbe',
              'Critical Production Anti-Pattern: Querying DB Inside livenessProbe',
              'DB chỉ chậm nhẹ 2 giây → liveness trượt → K8s giết đồng loạt cả 20 Pod API → 20 Pod bật dậy dội bão kết nối đánh sập hẳn DB! Chỉ kiểm tra DB ở readinessProbe (/readyz)!',
              'A brief DB hiccup fails liveness across all Pods at once, triggering a massive restart storm that crushes the DB! Check dependencies ONLY in readinessProbe.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Production',
              'Production Golden Rule',
              'Tách /healthz (nhẹ) và /readyz (kiểm DB), đặt preStop: sleep 5 để chờ Ingress gỡ xong IP trước khi nhận SIGTERM (lưu ý preStop tính chung vào quỹ terminationGracePeriodSeconds 30s!).',
              'Separate /healthz from /readyz, and add a 5s preStop hook before SIGTERM (remember preStop shares the 30s terminationGracePeriodSeconds budget!).'
            ),
          ],
          s,
          total
        ),
        memoryScene: {
          kind: 'tape',
          title: bi(
            'Chuỗi 4 Giai Đoạn Sức Khỏe & Tắt Êm Không Rớt Request Của Pod',
            '4-Stage Pod Health & Zero-502 Termination Lifecycle'
          ),
          subtitle: isDbTrap
            ? bi(
                'Cảnh báo: /healthz (Ô #3) chỉ kiểm tra nội tại — mọi kết nối DB/Redis phải đặt ở /readyz (Ô #2)!',
                'Warning: /healthz (#3) checks internal loop only — external DB/Redis checks belong strictly in /readyz (#2)!'
              )
            : bi(
                'Startup đạt ➔ Readiness mở cổng đón khách & Liveness canh deadlock ➔ preStop + SIGTERM đóng êm',
                'Startup passes ➔ Readiness opens Service traffic & Liveness watches loop ➔ preStop + SIGTERM drains'
              ),
          cells: [
            '1. Startup (Boot)',
            '2. Readiness (/readyz)',
            '3. Liveness (/healthz)',
            '4. preStop + SIGTERM',
          ],
          activeIndices: isThreeProbes
            ? [0, 1, 2]
            : isDbTrap
              ? [1, 2]
              : isShutdown
                ? [3]
                : [0, 1, 2, 3],
          pointers: isDbTrap
            ? [
                { index: 1, label: 'Check DB Pool ✔', tone: 'green' },
                { index: 2, label: 'No External DB!', tone: 'rose' },
              ]
            : isShutdown
              ? [{ index: 3, label: 'sleep 5s → Drain (0× 502)', tone: 'green' }]
              : [
                  { index: 1, label: 'Gates Service VIP', tone: 'green' },
                  { index: 3, label: 'Graceful 30s budget', tone: 'blue' },
                ],
          outputPill: {
            label: bi('ĐỘ TIN CẬY LƯU LƯỢNG', 'TRAFFIC RELIABILITY'),
            value: bi('0 lỗi 502 khi Rollout', 'Zero 502s During Rollout'),
            tone: 'green',
          },
        },
      };
    },
  },

  K15: {
    id: 'K15',
    titleEn: 'Resource Requests/Limits, QoS Classes, HPA & Jobs/CronJobs',
    subtitleEn:
      'Right-size CPU/Memory requests for the Scheduler, understand QoS eviction priority, autoscale via HPA, and run CronJobs.',
    durationMin: 14,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Phân biệt rõ requests (căn cứ xếp lịch cho Scheduler & mẫu số HPA) vs limits (giới hạn cgroups: CPU Throttling vs RAM OOM 137) và 3 hạng QoS',
        'Separate Scheduler/HPA requests from cgroup limits (CPU throttling vs OOM 137) and master 3 QoS classes'
      ),
      bi(
        'Cấu hình tự động co giãn HPA (autoscaling/v2) và chạy tác vụ nền Job / CronJob (concurrencyPolicy: Forbid)',
        'Configure autoscaling/v2 HPA and run batch DB migrations/schedules via Job & CronJob (Forbid)'
      ),
    ],
    buildStep: (s, total) => {
      const isReqLim = s === 1;
      const isQos = s === 2;
      const isHpa = s === 3;
      const isBatch = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('CĂN CỨ XẾP CHỖ', 'SCHEDULER & HPA'),
            value: bi('resources.requests (250m)', 'resources.requests (250m)'),
            tone: isHpa ? 'warn' : 'ok',
          },
          {
            label: bi('HẠNG ƯU TIÊN QOS', 'QOS PRIORITY'),
            value: isQos
              ? bi('BestEffort < Burstable < Guaranteed', 'BestEffort < Burstable < Guaranteed')
              : bi('Guaranteed (req == lim)', 'Guaranteed (req == lim)'),
            tone: 'ok',
          },
          {
            label: bi('CO GIÃN & TÁC VỤ', 'SCALE & BATCH'),
            value: isBatch
              ? bi('Job (OnFailure) · Cron (Forbid)', 'Job (OnFailure) · Cron (Forbid)')
              : bi('HPA: min 2 → max 10 Pods', 'HPA: min 2 → max 10 Pods'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Định mức tài nguyên công bằng ngăn một dịch vụ rò rỉ bộ nhớ làm sập toàn bộ các dịch vụ hàng xóm trên cùng Node',
                  'Enforced per-Pod resource governance protecting multi-tenant Worker Nodes from noisy neighbors'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Tách rõ requests (mức đảm bảo cho Scheduler) và limits (giới hạn cgroups: vượt CPU bị chậm, vượt RAM nổ OOM 137)',
                  'Configured requests for scheduling and limits for cgroup caps (CPU throttling vs Memory OOM 137)'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Thiết lập mức ưu tiên Guaranteed QoS (requests == limits) cho dịch vụ thanh toán lõi không bị trục xuất khi thiếu RAM',
                  'Assigned Guaranteed QoS (requests == limits) protecting critical workloads from node-pressure eviction'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Nối HPA (autoscaling/v2) với Metrics Server tự động nhân bản từ 2 lên 10 Pod khi CPU vượt 70% requests',
                  'Wired autoscaling/v2 HPA to Metrics Server scaling replicas dynamically above 70% CPU request utilization'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Chạy DB Migration (Alembic / Prisma) bằng Job (restartPolicy: OnFailure) và khóa chồng chéo CronJob bằng Forbid',
                  'Ran one-off migrations via batch/v1 Job and scheduled non-overlapping tasks via CronJob Forbid'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Phân biệt resources.requests và resources.limits',
              'requests (Scheduling) vs limits (Runtime Cap)',
              'kube-scheduler chỉ nhìn requests để tìm Worker Node còn đủ chỗ trống. Khi đã chạy, vượt limits.cpu chỉ bị hãm tốc (Throttling), nhưng vượt limits.memory sẽ bị OOMKilled 137 (tương tự mức đặt chỗ khi xếp lịch vs cầu dao trần tối đa lúc vận hành).',
              'kube-scheduler places Pods based strictly on requests. At runtime, exceeding CPU limits throttles speed, while exceeding memory limits triggers an instant OOMKill (137).'
            ),
            makeCallout(
              'technique',
              'Đừng siết limits.cpu quá nghẹt lúc khởi động Python / Node!',
              'Avoid Over-Tight CPU Limits That Choke App Startup!',
              'Đặt limits.cpu quá nhỏ (như 50m–100m) khiến lúc khởi động nạp thư viện bị CPU Throttling chậm gấp 5 lần! Hãy tính chuẩn requests.cpu và để dư khoảng thở hợp lý.',
              'Tiny CPU limits cause severe CFS throttling during cold-start imports in FastAPI and Node.js — always right-size requests first.'
            ),
            makeCallout(
              'compare',
              '3 hạng QoS Classes khi máy chủ thiếu RAM vật lý',
              'Three QoS Classes Under Node Memory Pressure',
              'Không khai báo gì = BestEffort (bị trục xuất đầu tiên). requests < limits = Burstable (phổ biến cho API). requests bằng khít limits ở mọi container = Guaranteed (mức ưu tiên bảo vệ cao nhất).',
              'No resources = BestEffort (evicted first). requests < limits = Burstable. Identical requests and limits on all containers = Guaranteed (highest protection).'
            ),
            makeCallout(
              'watch-out',
              'Quên khai báo requests.cpu sẽ làm HPA tê liệt hoàn toàn (<unknown>/70%)!',
              'Missing requests.cpu Breaks HPA (<unknown>/70%)!',
              'HPA tính % tải bằng công thức CPU thực dùng chia cho requests.cpu! Quên viết requests.cpu trong Deployment thì HPA mất mẫu số và đứng nhìn lúc bão truy cập ập vào.',
              'HPA divides live Metrics Server usage by resources.requests.cpu — omitting requests leaves HPA blind with <unknown> utilization!'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng cho Tác vụ nền Job & CronJob',
              'Golden Rule for Batch Jobs & CronJobs',
              'Trong Job (chạy migration Alembic/Prisma), restartPolicy chỉ được viết Never hoặc OnFailure (cấm Always!). Trong CronJob, luôn bật concurrencyPolicy: Forbid để chống 2 kỳ chạy đè nhau!',
              'Jobs require restartPolicy: OnFailure | Never (never Always), and CronJobs should set concurrencyPolicy: Forbid to prevent overlapping runs.'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'met',
              shape: 'db',
              tone: 'yellow',
              x: -235,
              y: 10,
              highlighted: isReqLim || isHpa,
              label: bi('Metrics Server', 'Metrics Server'),
              badge: isReqLim
                ? { text: bi('CPU m · RAM Mi/Gi', 'CPU m · RAM Mi/Gi') }
                : undefined,
            },
            {
              id: 'hpa',
              shape: 'block',
              tone: 'purple',
              x: -5,
              y: -28,
              icon: 'zap',
              highlighted: isHpa || isQos,
              label: bi(
                isBatch ? 'CronJob (Forbid)' : 'HPA Controller',
                isBatch ? 'CronJob (Forbid)' : 'HPA Controller'
              ),
              badge: {
                text: isBatch
                  ? bi('0 2 * * * → Job', '0 2 * * * → Job')
                  : bi('Target CPU: 70% req', 'Target CPU: 70% req'),
                tone: 'ok',
              },
            },
            {
              id: 'dep',
              shape: 'crowd',
              tone: 'green',
              x: 235,
              y: 15,
              highlighted: isQos || isHpa || isBatch,
              label: bi(
                isBatch ? 'Completed Jobs (Exit 0)' : 'Scaled Pods (2→8)',
                isBatch ? 'Completed Jobs (Exit 0)' : 'Scaled Pods (2→8)'
              ),
              badge: isQos
                ? { text: bi('Guaranteed / Burstable', 'Guaranteed / Burstable'), tone: 'ok' }
                : undefined,
            },
          ],
          links: [
            { id: 'l1', from: 'met', to: 'hpa', label: bi('CPU / RPS util', 'CPU / RPS util') },
            { id: 'l2', from: 'hpa', to: 'dep', label: bi('scale / spawn', 'scale / spawn') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'pointer', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.46, offset: 0.48 },
          ],
        },
      };
    },
  },

  K16: {
    id: 'K16',
    titleEn: 'Pod SecurityContext, Pod Security Admission & Least-Privilege RBAC',
    subtitleEn:
      'Build 3-layer Defense-in-Depth: hardened securityContext, PSA restricted labels, and scoped ServiceAccount RBAC.',
    durationMin: 13,
    difficulty: 'Advanced',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Gia cố container bằng runAsNonRoot, readOnlyRootFilesystem (+ emptyDir /tmp), allowPrivilegeEscalation: false và drop: ["ALL"]',
        'Harden containers with runAsNonRoot, readOnlyRootFilesystem (+ /tmp emptyDir), and dropped capabilities'
      ),
      bi(
        'Bật nhãn PSA restricted trên Namespace và nắm rõ bộ 3 RBAC: ServiceAccount ← RoleBinding → Role',
        'Enforce Namespace PSA restricted standards and wire least-privilege ServiceAccount -> RoleBinding -> Role'
      ),
    ],
    buildStep: (s, total) => {
      const isSecCtx = s === 1;
      const isPsa = s === 2;
      const isRbac = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('LỚP 1 · CONTAINER', 'LAYER 1 · CONTAINER'),
            value: bi('Non-Root · RO RootFS · Drop ALL', 'Non-Root · RO RootFS · Drop ALL'),
            tone: 'ok',
          },
          {
            label: bi('LỚP 2 · NAMESPACE PSA', 'LAYER 2 · PSA GATE'),
            value: isPsa
              ? bi('enforce: restricted (K8s 1.25+)', 'enforce: restricted (K8s 1.25+)')
              : bi('PSA restricted', 'PSA restricted'),
            tone: 'ok',
          },
          {
            label: bi('LỚP 3 · QUYỀN RBAC', 'LAYER 3 · RBAC'),
            value: isRbac
              ? bi('Least Privilege (Cấm "*"!)', 'Least Privilege (No "*"!)')
              : bi('automountToken: false', 'automountToken: false'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Dựng 3 lớp phòng thủ chiều sâu (Defense in Depth) nhốt chặt kẻ tấn công ngay cả khi code dính lỗi RCE',
                  'Constructed 3-layer Defense-in-Depth containing RCE exploits inside a privilege-free sandbox'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Khóa cứng securityContext: uid=1000, thu hồi capabilities ALL và khóa chỉ đọc gốc / (gắn emptyDir riêng cho /tmp)',
                  'Locked securityContext: UID 1000, capabilities.drop: ["ALL"], and read-only / with /tmp emptyDir'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Gắn nhãn pod-security.kubernetes.io/enforce: restricted lên Namespace để API Server tự chặn Pod cấu hình ẩu',
                  'Applied PSA enforce=restricted Namespace labels replacing legacy removed PodSecurityPolicy'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Tắt automountServiceAccountToken mặc định và cấp quyền tối thiểu qua bộ 3 ServiceAccount ← RoleBinding → Role',
                  'Disabled unused API tokens and bound dedicated ServiceAccounts to minimal Namespace Roles'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Giả định ứng dụng có thể bị lỗi RCE bất cứ lúc nào!',
              'Assume Breach: Design for RCE Containment',
              'Bảo mật giỏi là khi kẻ tấn công chui được vào tiến trình Python/Node thì thấy mình đang ở quyền uid=1000, không ghi được đĩa gốc /, không có curl và không có token gọi K8s API!',
              'Great cluster security ensures an attacker landing inside your app process is trapped as UID 1000 on a read-only filesystem with zero K8s API tokens.'
            ),
            makeCallout(
              'technique',
              'Bật readOnlyRootFilesystem: true mà FastAPI / Multer cần ghi nháp?',
              'Need Temp Files Under readOnlyRootFilesystem: true?',
              'Đừng mở khóa ghi toàn bộ ổ gốc /! Hãy giữ readOnlyRootFilesystem: true rồi gắn một ổ tạm emptyDir: {} vào đúng thư mục /tmp cho cả Python tempfile lẫn Node multer.',
              'Keep root "/" read-only and mount a scoped emptyDir: {} at /tmp so Python tempfile and Node upload libraries work cleanly.'
            ),
            makeCallout(
              'technique',
              'Pod Security Admission (PSA) chỉ mất 2 dòng nhãn trên Namespace!',
              'Enforce Security Cluster-Wide with 2 Namespace Labels',
              'Từ K8s v1.25+, PodSecurityPolicy cũ đã bị xóa bỏ. Bạn chỉ cần gắn nhãn pod-security.kubernetes.io/enforce: restricted lên Namespace là chặn đứng mọi Pod chạy root!',
              'PodSecurityPolicy is gone; label Namespaces with pod-security.kubernetes.io/enforce: restricted so API Server rejects non-compliant Pods at admission.'
            ),
            makeCallout(
              'good-to-know',
              'Cấu trúc 3 thành phần RBAC & Quy tắc Production',
              '3-Piece RBAC Model & Production Golden Rule',
              '95% API không gọi K8s API → đặt automountServiceAccountToken: false! Nếu cần gọi, nối danh tính ServiceAccount qua RoleBinding tới tập quyền Role cụ thể (tương tự thẻ định danh, quyết định gán quyền và bảng mô tả quyền), tuyệt đối cấm "*"!',
              'Set automountServiceAccountToken: false for normal APIs! Otherwise bind a dedicated ServiceAccount via RoleBinding to an explicit Role (never "*" or cluster-admin).'
            ),
          ],
          s,
          total
        ),
        memoryScene: {
          kind: 'refs',
          leftTitle: bi('Danh tính Pod & Cổng Kiểm Duyệt', 'Pod Identity & Admission Gate'),
          rightTitle: bi('Quyền hạn & Hộp Cát Bảo Vệ', 'Bound Permissions & Sandbox'),
          names: [
            {
              id: 'psa',
              name: isSecCtx
                ? 'securityContext: uid=1000'
                : 'Namespace PSA: restricted',
              note: bi('kiểm duyệt từ cửa API', 'enforced at admission'),
              targetId: 'box1',
              style: 'solid',
            },
            {
              id: 'sa',
              name: 'ServiceAccount: order-sa',
              note: isRbac
                ? bi('nối qua RoleBinding', 'bound via RoleBinding')
                : bi('automountToken: false', 'automountToken: false'),
              targetId: 'r1',
              style: isRbac ? 'solid' : 'dashed',
            },
          ],
          objects: [
            {
              id: 'box1',
              typeTag: 'Hardened Container',
              value: 'readOnlyRootFilesystem: true',
              fields: ['drop: ["ALL"] · allowPrivilegeEscalation: false', 'emptyDir mounted at /tmp'],
              tone: 'green',
              badge: bi('PSA Restricted ✔', 'PSA Restricted ✔'),
            },
            {
              id: 'r1',
              typeTag: 'Role (Namespace: payments)',
              value: 'resources: ["configmaps"]',
              fields: ['verbs: ["get", "list"] · Cấm secrets & "*"!'],
              tone: isRbac ? 'purple' : 'blue',
              badge: bi('Least Privilege ✔', 'Least Privilege ✔'),
            },
          ],
        },
      };
    },
  },

  K17: {
    id: 'K17',
    titleEn: 'Zero-Trust NetworkPolicies & Multi-Env Packaging (Helm vs Kustomize)',
    subtitleEn:
      'Lock down flat pod networks with Default-Deny NetworkPolicies and compare Helm Charts vs Kustomize (kubectl apply -k).',
    durationMin: 14,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Khóa mạng phẳng mặc định bằng Default-Deny NetworkPolicy (podSelector: {}) + mở chọn lọc trên CNI Cilium/Calico (nhớ mở cổng 53 DNS!)',
        'Replace K8s flat networking with Default-Deny + explicit allow NetworkPolicies on Cilium/Calico (preserving port 53 DNS)'
      ),
      bi(
        'So sánh đóng gói đa môi trường năm 2026 giữa Helm Charts (values.yaml) và Kustomize (kubectl apply -k) trong chu trình GitOps ArgoCD/Flux',
        'Compare Helm templating vs native Kustomize overlays (kubectl apply -k) inside ArgoCD/Flux GitOps workflows'
      ),
    ],
    buildStep: (s, total) => {
      const isNetPol = s === 1;
      const isHelm = s === 2;
      const isKustomizeGitOps = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('MẠNG ĐÔNG–TÂY', 'EAST-WEST TRAFFIC'),
            value: isNetPol
              ? bi('podSelector: {} (Default-Deny)', 'podSelector: {} (Default-Deny)')
              : bi('Zero-Trust (Cilium / Calico)', 'Zero-Trust (Cilium / Calico)'),
            tone: 'ok',
          },
          {
            label: bi('ĐÓNG GÓI ĐA MÔI TRƯỜNG', 'PACKAGING 2026'),
            value: isKustomizeGitOps
              ? bi('Helm Chart vs Kustomize (-k)', 'Helm Chart vs Kustomize (-k)')
              : bi('Helm values-prod.yaml', 'Helm values-prod.yaml'),
            tone: 'ok',
          },
          {
            label: bi('ĐỒNG BỘ TỰ ĐỘNG', 'GITOPS ENGINE'),
            value: bi('ArgoCD / Flux Synced', 'ArgoCD / Flux Synced'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Giải quyết 2 bài toán doanh nghiệp: cô lập tường lửa mạng nội bộ và loại bỏ cảnh sao chép thủ công nhiều tệp YAML',
                  'Solved enterprise East-West microsegmentation and eliminated multi-environment YAML copy-paste'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Đặt default-deny-ingress (podSelector: {}) rồi mở cổng TCP 5432 của Postgres duy nhất cho Pod app=shop-api',
                  'Applied default-deny-ingress and whitelisted TCP 5432 strictly from Pods labeled app=shop-api'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Đóng gói tài nguyên thành Helm Chart (Chart.yaml + templates/ + values-prod.yaml) với helm upgrade --install',
                  'Templated multi-resource releases cleanly via Helm Charts and environment-specific values files'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Đối chiếu Helm vs Kustomize (kubectl apply -k overlays/prod) và khép kín tự động qua ArgoCD / Flux GitOps',
                  'Matched Helm charts (3rd-party/complex) and Kustomize overlays (clean internal YAML) to GitOps'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Mặc định mạng Kubernetes cho phép kết nối xuyên mọi Namespace',
              'By Default, Kubernetes Networking Is 100% Flat Allow-All!',
              'Chia Namespace KHÔNG tự dựng tường lửa mạng! Bạn cần NetworkPolicy để kiểm soát truy cập tầng 3/4 giữa các nhóm Pod (tương tự cửa kiểm soát giữa các phòng ban), và cần Helm / Kustomize để quản lý cấu hình chuyên nghiệp.',
              'Namespaces do NOT isolate network traffic! Use NetworkPolicies for L3/L4 microsegmentation and Helm/Kustomize for DRY multi-env manifests.'
            ),
            makeCallout(
              'watch-out',
              'Hai bẫy lớn của NetworkPolicy: CNI thực thi & Cổng 53 CoreDNS!',
              'Two NetworkPolicy Gotchas: CNI Support & Port 53 DNS!',
              '1) Cụm phải chạy CNI có hỗ trợ như Cilium hoặc Calico (flannel thuần sẽ phớt lờ luật!). 2) Khi khóa chiều ra (Egress), nhớ mở cổng UDP/TCP 53 để Pod không bị mù DNS!',
              '1) NetworkPolicy requires an enforcing CNI like Cilium or Calico. 2) When restricting Egress, always allow UDP/TCP port 53 to CoreDNS!'
            ),
            makeCallout(
              'technique',
              'Helm Chart = Khuôn mẫu động + Lịch sử Release đồng bộ',
              'Helm Charts = Reusable Templates + Atomic Rollbacks',
              'Dùng helm upgrade --install -f values-prod.yaml để cập nhật đồng bộ cả chục tài nguyên, và helm rollback <release> <rev> để quay lui nguyên cụm gói trong tích tắc!',
              'Deploy idempotently with helm upgrade --install -f values-prod.yaml and roll back multi-resource releases atomically via helm rollback.'
            ),
            makeCallout(
              'good-to-know',
              'Góc nhìn 2026: Khi nào chọn Helm, khi nào chọn Kustomize (-k)?',
              '2026 Guide: When to Pick Helm vs Kustomize (kubectl apply -k)',
              'Cài gói cộng đồng (Envoy Gateway, Prometheus, CloudNativePG) → dùng Helm. Quản lý microservice nội bộ thích giữ YAML thuần sạch không nhồi {{ ... }} → dùng Kustomize (kubectl apply -k) cùng ArgoCD!',
              'Use Helm for third-party packages and rich parameterization; use built-in Kustomize (kubectl apply -k) for template-free YAML overlays in GitOps!'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'rogue',
              shape: 'device',
              tone: 'rose',
              x: -255,
              y: -58,
              highlighted: isNetPol,
              label: bi('Pod lạ (ns: marketing)', 'Rogue Pod (marketing)'),
            },
            {
              id: 'api',
              shape: 'block',
              tone: 'green',
              x: -225,
              y: 64,
              icon: 'globe',
              highlighted: isHelm || isKustomizeGitOps,
              label: bi('Pod: app=shop-api', 'Pod: app=shop-api'),
              badge:
                isHelm || isKustomizeGitOps
                  ? {
                      text: bi(
                        isKustomizeGitOps ? 'Helm / Kustomize -k' : 'Helm Release v2',
                        isKustomizeGitOps ? 'Helm / Kustomize -k' : 'Helm Release v2'
                      ),
                      tone: 'ok',
                    }
                  : undefined,
            },
            {
              id: 'np',
              shape: 'block',
              tone: 'orange',
              x: 20,
              y: 0,
              icon: 'shield',
              highlighted: s === 0 || isNetPol,
              label: bi('NetworkPolicy (Cilium)', 'NetworkPolicy (Cilium)'),
              badge: { text: bi('Default-Deny + Allow', 'Default-Deny + Allow'), tone: 'ok' },
            },
            {
              id: 'db',
              shape: 'db',
              tone: 'blue',
              x: 250,
              y: 10,
              highlighted: isNetPol,
              label: bi('Postgres :5432', 'Postgres :5432'),
            },
          ],
          links: [
            { id: 'l1', from: 'rogue', to: 'np', style: 'danger', label: bi('blocked!', 'blocked!') },
            { id: 'l2', from: 'api', to: 'np', label: bi('label match', 'label match') },
            { id: 'l3', from: 'np', to: 'db', label: bi('TCP 5432 allowed', 'TCP 5432 allowed') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'error', speed: 0.45 },
            { id: 'p2', linkId: 'l3', kind: 'response', speed: 0.46, offset: 0.45 },
          ],
        },
      };
    },
  },

  K18: {
    id: 'K18',
    titleEn: 'K8s Troubleshooting (Part 1): Pending, ImagePull & CrashLoopBackOff',
    subtitleEn:
      'Follow the 3-step SRE triage funnel (get -> describe Events -> logs --previous) to fix stuck Pods in 90 seconds.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Khoanh vùng tức thì 3 trạng thái kẹt TRƯỚC khi code chạy (Pending, ImagePullBackOff, CreateContainerConfigError → xem describe Events)',
        'Diagnose pre-execution states (Pending, ImagePullBackOff, CreateContainerConfigError) via kubectl describe Events'
      ),
      bi(
        'Bắt trọn Traceback của phiên vừa sập ở CrashLoopBackOff (lùi lũy thừa 10s→5m) bằng cờ quan trọng kubectl logs --previous & k9s',
        'Capture crash tracebacks in CrashLoopBackOff (10s->5m backoff) using kubectl logs --previous and k9s'
      ),
    ],
    buildStep: (s, total) => {
      const isFunnel = s === 1;
      const isFourStates = s === 2;
      const isCrashPrev = s === 3;
      const isLabReady = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('CHƯA CHẠY CODE', 'PRE-START STUCK'),
            value: bi('describe pod → Events', 'describe pod → Events'),
            tone: isFourStates ? 'warn' : 'ok',
          },
          {
            label: bi('CHẠY RỒI SẬP', 'CRASHLOOPBACKOFF'),
            value: isCrashPrev
              ? bi('logs <pod> --previous (-p)', 'logs <pod> --previous (-p)')
              : bi('Backoff 10s → 20s → max 5m', 'Backoff 10s → 20s → max 5m'),
            tone: isCrashPrev ? 'bad' : 'ok',
          },
          {
            label: bi('TRỢ THỦ TUI 2026', '2026 TUI SPEED'),
            value: bi('k9s (phím d / l / p)', 'k9s (keys d / l / p)'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Thay thế thói quen xóa Pod đoán mò bằng Quy trình Chẩn đoán 3 Bước chuẩn SRE: get → describe → logs --previous',
                  'Replaced guesswork restarts with the deterministic 3-Step SRE Triage workflow'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Rẽ nhánh ngay từ giây thứ 5 dựa vào việc container đã từng chạy dòng code nào hay chưa',
                  'Branched diagnosis immediately based on whether the container process ever started'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Phân biệt rạch ròi 4 ca kẹt: Pending (CPU/PVC), ImagePullBackOff (tag/secret), ConfigError (thiếu CM/Secret) và CrashLoop',
                  'Mapped Pending, ImagePullBackOff, CreateContainerConfigError, and CrashLoopBackOff to exact root causes'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Giải mã nhịp nghỉ nhân đôi Exponential Backoff (10s → 300s) và dùng --previous bắt Traceback Python/Node phiên vừa chết',
                  'Decoded 10s->5m exponential backoff and extracted prior-container stack traces via --previous'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Sẵn sàng bước vào 4 ca trực chiến Terminal mô phỏng: tự gõ lệnh bắt bằng chứng trước khi nộp bản vá YAML',
                  'Prepared for hands-on terminal diagnostics + declarative YAML patching across 4 live scenarios'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Đừng xóa Pod đoán mò — Hãy hỏi đúng 1 câu đầu tiên!',
              'Stop Deleting Pods Blindly — Ask One Question First!',
              'Khi thấy Pod báo đỏ, chỉ cần hỏi: "Tiến trình Python/Node của mình ĐÃ ĐƯỢC BẬT LÊN CHƯA?". Chưa bật → đọc Events của describe; Đã bật rồi sập → đọc logs --previous!',
              'Ask one question first: "Did my container process ever start?". If NO -> read kubectl describe Events; if YES -> read kubectl logs --previous!'
            ),
            makeCallout(
              'watch-out',
              'Gõ kubectl logs trên Pod đang Pending hay ImagePullBackOff là vô ích!',
              'kubectl logs Is Empty on Pending, ImagePull, and ConfigError!',
              'Ở 3 trạng thái Pending, ImagePullBackOff và CreateContainerConfigError, container chưa chạy dù chỉ 1ms! 100% nguyên nhân nằm ở bảng Events cuối lệnh kubectl describe pod.',
              'Pending, ImagePullBackOff, and CreateContainerConfigError fail BEFORE container creation — the exact error always lives in kubectl describe Events.'
            ),
            makeCallout(
              'technique',
              'Bản đồ 4 thủ phạm trong 10 giây nhìn cột STATUS',
              '10-Second Status-to-Culprit Cheat Sheet',
              'Pending = thiếu RAM/CPU hoặc sai StorageClass PVC · ImagePullBackOff = sai tag hoặc thiếu imagePullSecrets · CreateContainerConfigError = thiếu Secret/ConfigMap · CrashLoop = lỗi code!',
              'Pending = node capacity/unbound PVC · ImagePull = bad tag/missing pullSecret · ConfigError = missing Secret/CM key · CrashLoop = app exited != 0!'
            ),
            makeCallout(
              'technique',
              'Vì sao bắt buộc thêm cờ --previous (-p) khi bắt CrashLoopBackOff?',
              'Why --previous (-p) Is Crucial During CrashLoopBackOff',
              'Giữa chu kỳ nghỉ lùi lũy thừa (10s → 20s → tối đa 5 phút), container mới tạo lại có thể chưa kịp in gì. Cờ --previous lôi đúng Traceback của phiên vừa sập ngay trước đó!',
              'During backoff restarts, the current container log may be empty — --previous retrieves the exact crash traceback from the terminated instance.'
            ),
            makeCallout(
              'good-to-know',
              'Quy tắc Vàng Trực Chiến (On-Call Rule)',
              'On-Call Golden Rule',
              'Luôn chẩn đoán tìm bằng chứng rõ ràng (describe Events / logs --previous, hoặc phím d / p trên k9s) rồi mới sửa thẳng vào tệp nguồn YAML!',
              'Gather hard evidence first via describe Events or logs --previous (keys d / p in k9s), then fix the declarative manifest.'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'pod',
              shape: 'block',
              tone: isLabReady ? 'orange' : 'rose',
              x: -235,
              y: 8,
              icon: 'alert',
              highlighted: s === 0 || isFourStates,
              label: bi('Stuck Pod', 'Stuck Pod'),
              badge: {
                text: isCrashPrev
                  ? bi('CrashLoop (Exit != 0)', 'CrashLoop (Exit != 0)')
                  : bi('Pending / Pull / Crash', 'Pending / Pull / Crash'),
                tone: 'bad',
              },
            },
            {
              id: 'desc',
              shape: 'block',
              tone: 'blue',
              x: 0,
              y: -32,
              icon: 'terminal',
              highlighted: isFunnel || isCrashPrev,
              label: bi('3-Step Triage CLI', '3-Step Triage CLI'),
              badge: {
                text: isCrashPrev
                  ? bi('logs --previous (-p)', 'logs --previous (-p)')
                  : bi('describe → Events:', 'describe → Events:'),
                tone: 'ok',
              },
            },
            {
              id: 'fix',
              shape: 'block',
              tone: 'green',
              x: 235,
              y: 18,
              icon: 'zap',
              highlighted: isLabReady,
              label: bi('Healthy Running', 'Healthy Running'),
              badge: { text: bi('Ready 1/1 ✔', 'Ready 1/1 ✔'), tone: 'ok' },
            },
          ],
          links: [
            { id: 'l1', from: 'pod', to: 'desc', style: 'danger', label: bi('inspect state', 'inspect state') },
            { id: 'l2', from: 'desc', to: 'fix', label: bi('patch manifest', 'patch manifest') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'error', speed: 0.44 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.5 },
          ],
        },
        defaultCode: `kubectl get pods\nkubectl describe pod web-api\nkubectl logs web-api --previous`,
      };
    },
  },

  K19: {
    id: 'K19',
    titleEn: 'K8s Troubleshooting (Part 2): OOMKilled (137), 502 Bad Gateway & Rollout Rescue',
    subtitleEn:
      'Resolve Exit 137 memory kills, fix 502 empty Service Endpoints, rollback in 3 seconds, and lock in Zero-Downtime.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Xử lý OOMKilled (Exit Code 137 = 128 + 9) bằng nâng limits.memory kết hợp Streaming (Python Generator / Node Streams)',
        'Resolve Exit 137 OOMKills by right-sizing memory.limits and streaming large payloads in Python/Node'
      ),
      bi(
        'Bắt bệnh 502 qua kubectl get endpoints (<none> vs lệch targetPort), khôi phục 3s bằng rollout undo và áp dụng 3 cơ chế Zero-Downtime',
        'Fix 502s via kubectl get endpoints, recover in 3s via rollout undo, and enforce the 3 Zero-Downtime mechanisms'
      ),
    ],
    buildStep: (s, total) => {
      const isOom = s === 1;
      const is502 = s === 2;
      const isUndo = s === 3;
      const isZeroDown = s >= total - 1;
      return {
        telemetry: [
          {
            label: bi('EXIT CODE 137', 'EXIT CODE 137'),
            value: isOom
              ? bi('128 + 9 SIGKILL (OOMKilled!)', '128 + 9 SIGKILL (OOMKilled!)')
              : bi('Limits + Streaming Fix', 'Limits + Streaming Fix'),
            tone: isOom ? 'bad' : 'ok',
          },
          {
            label: bi('CHẨN ĐOÁN LỖI 502', '502 TRIAGE'),
            value: is502
              ? bi('Endpoints = <none> / targetPort', 'Endpoints = <none> / targetPort')
              : bi('selector == labels ✔', 'selector == labels ✔'),
            tone: is502 ? 'warn' : 'ok',
          },
          {
            label: bi('KHÔI PHỤC & UPTIME', 'MTTR & UPTIME'),
            value: isZeroDown
              ? bi('3 Cơ chế · 100% Uptime', '3 Mechanisms · 100% Uptime')
              : bi('rollout undo (~3 giây)', 'rollout undo (~3 sec)'),
            tone: 'ok',
          },
        ],
        whatChanged: pickStep(
          [
            [
              {
                op: '+',
                text: bi(
                  'Làm chủ 4 kịch bản trực chiến phổ biến nhất khi Pod nhìn vẫn Running nhưng khách hàng báo lỗi!',
                  'Mastered the 4 highest-stakes live production incidents beyond initial Pod boot'
                ),
              },
            ],
            [
              {
                op: '~',
                text: bi(
                  'Xử lý triệt để OOMKilled (Exit 137): nâng limits.memory trước mắt và đổi code sang Python StreamingResponse / Node stream.pipeline',
                  'Fixed Exit 137 OOMKills via memory limit right-sizing + chunked streaming in Python & Node.js'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Soi kubectl get endpoints <svc>: sửa lệch nhãn selector (khi hiện <none>) hoặc sửa lệch targetPort (3000/8000)',
                  'Restored live Service traffic by aligning selector labels and container targetPort'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Khôi phục sự cố phát hành lỗi trong 3 giây bằng kubectl rollout undo thay vì ngồi chờ CI build lại 15 phút',
                  'Slashed incident MTTR to 3 seconds using kubectl rollout undo before root-cause debugging'
                ),
              },
            ],
            [
              {
                op: '+',
                text: bi(
                  'Áp dụng đầy đủ 3 cơ chế Zero-Downtime: maxUnavailable: 0 + readinessProbe + lifecycle.preStop (sleep 5)',
                  'Locked in the 3 Zero-Downtime mechanisms: maxUnavailable: 0 + readinessProbe + 5s preStop hook'
                ),
              },
            ],
          ],
          s,
          total
        ),
        callout: pickStep(
          [
            makeCallout(
              'key-idea',
              'Pod hiện 1/1 Running chưa chắc khách hàng đã vào được!',
              '1/1 Running Does Not Guarantee Happy Users!',
              'Những sự cố Production hay gặp nhất nằm ở tràn RAM lúc tải đỉnh (OOM 137), đứt cầu nối nhãn Service (502) hoặc rớt gói tin vài giây lúc cuộn phiên bản mới.',
              'Real-world outages often strike running Pods: peak-load OOMKills (137), broken Service Endpoint wiring (502), or rollout race conditions.'
            ),
            makeCallout(
              'watch-out',
              'Xử lý OOMKilled (Exit 137): Nâng trần RAM + Chuyển sang Streaming',
              'Cure Exit 137 Twice: Right-Size RAM + Stream Chunks!',
              'Tăng limits.memory giúp khắc phục tức thời, nhưng về căn cơ đừng đọc cả tệp 300MB vào 1 biến! Hãy dùng generator/StreamingResponse (FastAPI) hoặc stream.pipeline (Node.js).',
              'Raise memory.limits for immediate relief, then eliminate memory spikes using Python generators/StreamingResponse or Node.js stream.pipeline.'
            ),
            makeCallout(
              'technique',
              'Pod vẫn xanh mà trả về 502? Kiểm tra ngay kubectl get endpoints <svc>',
              'Pods Green but Getting 502? Check kubectl get endpoints Immediately!',
              'Nếu cột ENDPOINTS hiện <none> → chắc chắn Service selector gõ lệch nhãn Pod! Nếu đã có danh sách IP mà vẫn 502 → Service đang trỏ sai số cổng targetPort!',
              'ENDPOINTS = <none> proves a Service selector mismatch (or failing readiness); IPs present with 502 points directly to a wrong targetPort!'
            ),
            makeCallout(
              'watch-out',
              'Sự cố phát hành lỗi giờ cao điểm: Rollback trong 3 giây trước, gỡ lỗi sau',
              'Production Incident Rule: Roll Back in 3 Seconds First, Debug Later',
              'Đừng bắt khách hàng nhìn trang lỗi 15 phút chờ bạn sửa code chạy lại CI! Gõ kubectl rollout undo deployment/<tên> để kéo MTTR về 3 giây ngay lập tức.',
              'Never debug live while users see 500s! Run kubectl rollout undo deployment/<name> to restore service in 3 seconds, then debug calmly in staging.'
            ),
            makeCallout(
              'good-to-know',
              '3 Cơ chế tổng kết khóa học cho 100% Zero-Downtime',
              'Capstone 3 Mechanisms for 100% Zero-Downtime',
              'Mọi Deployment chuẩn Production phải có đủ bộ ba: (1) maxUnavailable: 0 + maxSurge: 1, (2) readinessProbe (/readyz), và (3) lifecycle.preStop (sleep 5) + xử lý SIGTERM!',
              'Every production Deployment needs all three mechanisms: (1) maxUnavailable: 0 + maxSurge: 1, (2) readinessProbe, and (3) a 5s preStop hook + SIGTERM drain!'
            ),
          ],
          s,
          total
        ),
        scene: {
          nodes: [
            {
              id: 'ing',
              shape: 'device',
              tone: is502 ? 'rose' : 'neutral',
              x: -245,
              y: 10,
              highlighted: s === 0 || is502 || isZeroDown,
              label: bi(
                is502 ? 'Gateway (502 Error!)' : 'Gateway (200 OK)',
                is502 ? 'Gateway (502 Error!)' : 'Gateway (200 OK)'
              ),
            },
            {
              id: 'ep',
              shape: 'block',
              tone: is502 ? 'orange' : 'green',
              x: -5,
              y: -25,
              icon: 'shield',
              highlighted: is502 || isUndo || isZeroDown,
              label: bi('Service Endpoints', 'Service Endpoints'),
              badge: {
                text: is502
                  ? bi('Check selector & targetPort!', 'Check selector & targetPort!')
                  : isUndo
                    ? bi('rollout undo (3s!)', 'rollout undo (3s!)')
                    : bi('selector == pod labels ✔', 'selector == pod labels ✔'),
                tone: is502 ? 'warn' : 'ok',
              },
            },
            {
              id: 'pod',
              shape: 'crowd',
              tone: isOom ? 'rose' : 'blue',
              x: 235,
              y: 15,
              highlighted: isOom || isZeroDown,
              label: bi('Production Pods', 'Production Pods'),
              badge: {
                text: isOom
                  ? bi('OOM 137 → Stream Fix', 'OOM 137 → Stream Fix')
                  : bi('Zero-Downtime 3 Mechanisms ✔', 'Zero-Downtime 3 Mechanisms ✔'),
                tone: isOom ? 'bad' : 'ok',
              },
            },
          ],
          links: [
            {
              id: 'l1',
              from: 'ing',
              to: 'ep',
              style: is502 ? 'danger' : 'solid',
              label: bi('Service :80', 'Service :80'),
            },
            {
              id: 'l2',
              from: 'ep',
              to: 'pod',
              label: bi('targetPort: 3000/8000', 'targetPort: 3000/8000'),
            },
          ],
          packets: [
            {
              id: 'p1',
              linkId: 'l1',
              kind: is502 ? 'error' : 'request',
              speed: 0.48,
            },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.48, offset: 0.48 },
          ],
        },
        defaultCode: `kubectl get svc,ep\nkubectl describe pod pdf-exporter\nkubectl rollout undo deploy/frontend -n production`,
      };
    },
  },
};

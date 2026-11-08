import { LessonTopic } from '@/types/curriculum.types';

export const STAGE_7_LESSONS: LessonTopic[] = [
  {
    id: 's7-production-architecture',
    stageId: 'stage-7',
    level: 'master',
    order: 12,
    title: '7.1. Đóng gói Production (Multi-stage Docker với uv, Gunicorn/Uvicorn), Profiling & Bảo mật',
    shortDescription:
      'Tối ưu Docker image từ 1GB xuống ~120MB, công thức tính số Worker (2 x CPU + 1), truy tìm điểm nghẽn CPU/RAM với py-spy & memray và bảo mật hệ thống.',
    estimatedMinutes: 45,
    theoryParagraphs: [
      'Ở chặng cuối cùng (Master), mục tiêu là đưa hệ thống Python lên môi trường Production chịu tải cao, an toàn và quan sát được toàn diện (Observability). Về đóng gói container, việc dùng base image `python:3.12` mặc định sẽ tạo ra image nặng tới ~1GB. Bằng cách áp dụng **Multi-stage Dockerfile** kết hợp `python:3.12-slim` và `uv sync --frozen --no-dev`, dung lượng image giảm xuống chỉ còn **~120MB** và tốc độ build nhanh gấp nhiều lần.',
      'Để vận hành ứng dụng ASGI (như FastAPI) trên máy chủ nhiều nhân CPU, vì mỗi tiến trình Python bị giới hạn bởi 1 khóa GIL, chúng ta dùng **Gunicorn** làm Process Manager đứng trước để quản lý nhiều tiến trình con **UvicornWorker** theo công thức kinh điển: `workers = (2 * CPU_CORES) + 1` (hoặc nhân bản qua Kubernetes Pods / Docker Replicas).',
      'Khi hệ thống trên Production bị chậm hoặc ngốn RAM bất thường, kỹ sư Master không đoán mò mà dùng bộ đôi công cụ Profiling: **`py-spy`** (Sampling Profiler viết bằng Rust có thể gắn trực tiếp vào tiến trình Python đang chạy trên Production mà không cần dừng server hay sửa code) để vẽ Flamegraph tìm điểm nghẽn CPU, và **`memray`** (của Bloomberg) để phát hiện chính xác dòng code gây rò rỉ bộ nhớ (Memory Leak).',
    ],
    analogy: {
      title: 'Đội hình Quản đốc & Nhân viên (Gunicorn + Uvicorn) & Máy chụp CT Không xâm lấn (py-spy)',
      realWorldScenario:
        'Hình dung cách một hệ thống Python Production phục vụ hàng chục nghìn người dùng cùng lúc:',
      mappingPoints: [
        {
          realWorld: 'Cổng điều phối giao thông bên ngoài (`Nginx Reverse Proxy`)',
          pythonEquivalent: 'Nginx xử lý TLS/SSL, nén Gzip và chống DDoS cơ bản',
          explanation: 'Chuyển tiếp các request sạch vào bên trong cụm ứng dụng.',
        },
        {
          realWorld: 'Quản đốc phân xưởng (`Gunicorn Master Process`) trông coi dàn công nhân siêu tốc (`Uvicorn Workers`)',
          pythonEquivalent: '`gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 5`',
          explanation: 'Mỗi `UvicornWorker` là một tiến trình độc lập chạy Event Loop riêng (tận dụng đa nhân CPU). Nếu 1 Worker bị crash, Quản đốc `Gunicorn` lập tức khởi tạo Worker mới thay thế ngay!',
        },
        {
          realWorld: 'Camera nhiệt hồng ngoại đứng ngoài cửa sổ đo xem máy nào đang quá nhiệt (`py-spy`)',
          pythonEquivalent: '`py-spy top --pid 12345` / `py-spy record -o profile.svg --pid 12345`',
          explanation: 'Chẩn đoán chính xác hàm nào đang ngốn 90% CPU ngay trên Production với overhead gần như bằng 0.',
        },
      ],
      mentalModelTip:
        'Nếu triển khai trên **Kubernetes (K8s)**, bạn có thể chạy trực tiếp 1 tiến trình `uvicorn` trên mỗi Container Pod và để K8s Horizontal Pod Autoscaler (HPA) quản lý việc nhân bản số lượng Pod theo số nhân CPU!',
    },
    codeExamples: [
      {
        id: 'ex-s7-1-prod',
        title: 'Cấu hình Lifespan, Rate Limiting Middleware & Healthcheck chuẩn Production',
        description: 'Quản lý vòng đời kết nối Database/Redis và bảo vệ hệ thống trên Production.',
        code: `from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status
import time

# 1. Quản lý vòng đời khởi tạo & giải phóng tài nguyên toàn cục (Lifespan)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi tạo Connection Pool (DB, Redis, HTTP Client) khi Server bật:
    app.state.started_at = time.time()
    print("[STARTUP] Đã kết nối PostgreSQL Pool & Redis")
    yield
    # Tự động đóng toàn bộ kết nối sạch sẽ khi Server nhận tín hiệu SIGTERM:
    print("[SHUTDOWN] Đã đóng toàn bộ kết nối an toàn")

app = FastAPI(title="PyMastery Production API", lifespan=lifespan)

# 2. Middleware đo thời gian xử lý & gắn Header truy vết
@app.middleware("http")
async def add_process_time_header(request: Request, call_next) -> Response:
    start = time.perf_counter()
    response: Response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
    return response

@app.get("/healthz", status_code=status.HTTP_200_OK)
async def healthcheck(request: Request) -> dict:
    uptime = round(time.time() - request.app.state.started_at, 1)
    return {"status": "healthy", "uptime_seconds": uptime}`,
        output: `{"status": "healthy", "uptime_seconds": 1420.5}`,
        annotations: [
          { line: 6, explanation: '`@asynccontextmanager` kết hợp tham số `lifespan` là chuẩn mới thay thế hoàn toàn `@app.on_event("startup")` đã deprecated trong FastAPI.' },
          { line: 11, explanation: 'Mọi tài nguyên khởi tạo trước `yield` đều được đảm bảo giải phóng ở phần sau `yield` khi container dừng (Graceful Shutdown).' },
          { line: 23, explanation: 'Gắn header `X-Process-Time-Ms` giúp hệ thống giám sát (Prometheus/Grafana) theo dõi độ trễ P95/P99.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Viết Multi-stage Dockerfile với uv giảm dung lượng từ 1GB xuống 120MB',
        scenario: 'Tối ưu tốc độ kéo image (pull) khi Auto-scaling trên Cloud và giảm bề mặt tấn công bảo mật.',
        whyPythonFits: 'Stage `builder` cài đặt các gói vào `.venv`, sau đó Stage `runner` (`python:3.12-slim`) chỉ copy đúng thư mục `.venv` và `src/` sang cùng với user không có quyền root (`non-root user`).',
      },
    ],
    tipsAndBestPractices: [
      'Luôn chạy tiến trình Python trong Docker dưới quyền một `non-root user` (ví dụ `USER appuser`) để bảo mật.',
      'Đặt biến môi trường `PYTHONUNBUFFERED=1` và `PYTHONDONTWRITEBYTECODE=1` trong Dockerfile để log được đẩy ra stdout ngay lập tức mà không bị đệm.',
      'Tích hợp `OpenTelemetry` để tự động nối mạch Trace từ Nginx → FastAPI → SQLAlchemy PostgreSQL → Redis.',
    ],
    commonIssues: [
      {
        id: 'issue-s7-startup-deprecated',
        title: 'Dùng @app.on_event("startup") cũ kỹ hoặc quên Graceful Shutdown',
        severity: 'warning',
        symptom: 'Cảnh báo Deprecated trong FastAPI hoặc rò rỉ kết nối Database khi redeploy container.',
        whyItHappens:
          'Cơ chế `on_event("startup")` và `on_event("shutdown")` tách rời nhau khiến việc chia sẻ biến trạng thái và xử lý lỗi khi khởi động không đồng nhất.',
        wrongCode: `# CÚ PHÁP CŨ (Đã Deprecated):\n@app.on_event("startup")\nasync def startup(): ...\n@app.on_event("shutdown")\nasync def shutdown(): ...`,
        rightCode: `# CHUẨN HIỆN ĐẠI: Dùng lifespan với @asynccontextmanager\n@asynccontextmanager\nasync def lifespan(app: FastAPI):\n    await init_resources()\n    yield\n    await close_resources()\n\napp = FastAPI(lifespan=lifespan)`,
        fixExplanation: 'Hàm `lifespan` gói gọn cả khởi tạo lẫn dọn dẹp trong cùng một ngữ cảnh `try/finally` tự nhiên với `yield`.',
      },
    ],
    jsComparison: [
      {
        concept: 'Production Process Manager & Clustering',
        jsTsWay: 'PM2 (pm2 start dist/main.js -i max) hoặc Node.js Cluster module',
        pythonWay: 'Gunicorn quản lý các UvicornWorker: gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 4',
        jsCode: `pm2 start dist/server.js -i max`,
        pythonCode: `gunicorn src.app.main:app -k uvicorn.workers.UvicornWorker -w 5`,
        keyDifference: 'Cả hai đều nhân bản nhiều tiến trình Worker (Pre-fork model) để vượt qua giới hạn 1 CPU core của Event Loop đơn luồng.',
      },
    ],
    relatedTermIds: ['eco-fastapi', 'eco-uv', 'concept-gil', 'concept-context-manager'],
    relatedLessonIds: ['s5-asyncio-gil-concurrency', 's4-sqlalchemy-clean-arch'],
    relatedExerciseIds: ['ex-s5-async-semaphore'],
  },
];

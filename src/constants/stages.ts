import { StageId, StageMeta } from '@/types/curriculum.types';

export const CURRICULUM_STAGES: StageMeta[] = [
  {
    id: 'stage-1',
    number: 1,
    title: 'Giai đoạn 1: Python Fundamentals & Modern Tooling',
    subtitle: 'Môi trường hiện đại (uv, Ruff, Pyright), Mô hình bộ nhớ, Cú pháp, Collections, Hàm & I/O',
    durationWeeks: 'Tuần 1–2',
    goal: 'Viết được chương trình Python độc lập từ con số 0, hiểu mô hình bộ nhớ đối tượng và làm chủ bộ công cụ chuẩn công nghiệp.',
    primaryLevels: ['fundamental', 'basic'],
    milestoneProject: 'Project 1 — CLI Student & Task Management (CRUD, JSON Context Manager, CSV Stats, Pyright)',
  },
  {
    id: 'stage-2',
    number: 2,
    title: 'Giai đoạn 2: Python Core & Advanced Mechanics',
    subtitle: 'Comprehensions, OOP & MRO, Dunder Methods, Generators, Decorators, Context Managers & Typing',
    durationWeeks: 'Tuần 3–5',
    goal: 'Chuyển từ "biết viết cú pháp" sang "hiểu sâu cơ chế bên trong của Python" — bước ngoặt tạo nên Senior Python Developer.',
    primaryLevels: ['basic', 'advanced'],
    milestoneProject: 'Project 2 — Mini Web Framework mô phỏng FastAPI (@route decorator, Middleware, Timer Context Manager)',
  },
  {
    id: 'stage-3',
    number: 3,
    title: 'Giai đoạn 3: Python Professional & Project Engineering',
    subtitle: 'Module/Package, pyproject.toml, pydantic-settings, Structured Logging & Unit Testing với pytest',
    durationWeeks: 'Tuần 6–7',
    goal: 'Tổ chức dự án Python chuẩn doanh nghiệp, quản lý biến môi trường an toàn kiểu, debug và kiểm thử tự động.',
    primaryLevels: ['advanced', 'pro'],
    milestoneProject: 'Project 3 — Bộ Unit Test & Mocking đạt độ phủ >85% với @pytest.fixture & parametrize',
  },
  {
    id: 'stage-4',
    number: 4,
    title: 'Giai đoạn 4: Database & Backend Development với FastAPI',
    subtitle: 'FastAPI Core, Dependency Injection (Depends), Pydantic v2, SQLAlchemy 2.0 Async, Alembic & JWT/Redis',
    durationWeeks: 'Tuần 8–10',
    goal: 'Xây dựng hệ thống RESTful API & Real-time hiệu năng cao theo chuẩn Clean Architecture (Model → Schema → Repo → Service → Router).',
    primaryLevels: ['pro'],
    milestoneProject: 'Project 4 — Student & Course Management API hoàn chỉnh (JWT, RBAC, PostgreSQL Async, Redis, BackgroundTasks)',
  },
  {
    id: 'stage-5',
    number: 5,
    title: 'Giai đoạn 5: Concurrency, AsyncIO & System Programming',
    subtitle: 'Giải phẫu GIL vs Event Loop, AsyncIO Coroutines, Threading, Multiprocessing & Celery Distributed Queue',
    durationWeeks: 'Tuần 11–12',
    goal: 'Hiểu bản chất Concurrency vs Parallelism trong CPython, vượt qua giới hạn GIL và xử lý hàng nghìn tác vụ đồng thời.',
    primaryLevels: ['pro', 'master'],
    milestoneProject: 'Project 5 — Async Web Crawler xử lý 1.000 URL đồng thời (httpx, Semaphore, Exponential Backoff, Batch Insert)',
  },
  {
    id: 'stage-6',
    number: 6,
    title: 'Giai đoạn 6: Các Nhánh Chuyên sâu (AI/LLM, Data, Automation, Vision)',
    subtitle: 'NumPy/PyTorch & RAG LLM, Polars & Airflow ETL, Playwright Automation, OpenCV/YOLO',
    durationWeeks: 'Tuần 13–18',
    goal: 'Mở rộng sang các lĩnh vực Python thống trị thế giới: AI/RAG Engineering, Data Engineering tốc độ cao và Automation.',
    primaryLevels: ['pro', 'master'],
    milestoneProject: 'Project 6/7 — AI Document Assistant (RAG + Vector DB + FastAPI) & High-speed File Pipeline',
  },
  {
    id: 'stage-7',
    number: 7,
    title: 'Giai đoạn 7: Production & System Architecture',
    subtitle: 'Multi-stage Docker với uv, Gunicorn + Uvicorn Workers, Observability (py-spy, memray, OpenTelemetry) & Security',
    durationWeeks: 'Tuần 19–24',
    goal: 'Đóng gói, triển khai, giám sát điểm nghẽn CPU/RAM và bảo mật hệ thống Python chịu tải cao trên Production.',
    primaryLevels: ['master'],
    milestoneProject: 'Project 8 — Production Backend System (Multi-stage Docker ~120MB, Nginx, Prometheus/Grafana, CI/CD)',
  },
];

export const STAGE_MAP: Record<StageId, StageMeta> = CURRICULUM_STAGES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<StageId, StageMeta>
);

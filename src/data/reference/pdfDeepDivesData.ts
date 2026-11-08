import { SkillLevel } from '@/types/curriculum.types';

export interface EcosystemMappingRow {
  category: string;
  jsTsStack: string;
  modernPythonStack: string;
  whyRecommended: string;
}

export interface ConcurrencyMatrixRow {
  workloadType: string;
  pythonTool: string;
  nodeJsEquivalent: string;
  gilMechanismAndImpact: string;
  recommendedLevel: SkillLevel;
}

export interface CleanArchFileNode {
  path: string;
  name: string;
  layer: string;
  description: string;
  jsEquivalent: string;
  sampleCode: string;
}

export interface PortfolioProjectMilestone {
  order: number;
  title: string;
  coreTopics: string;
  priority: 'Bắt buộc' | 'Rất cao' | 'Cao' | 'Theo định hướng' | 'Nâng cao';
  level: SkillLevel;
  description: string;
  keyDeliverables: string[];
}

export const ECOSYSTEM_MAPPING_TABLE: EcosystemMappingRow[] = [
  {
    category: 'Quản lý phiên bản & Gói thư viện',
    jsTsStack: 'nvm + npm / pnpm / yarn',
    modernPythonStack: 'uv (viết bằng Rust, thay thế cả pip, venv, pyenv, poetry)',
    whyRecommended: 'Tốc độ cài đặt gói nhanh gấp 10–100 lần pip, tự động quản lý cả Python version lẫn Virtual Environment.',
  },
  {
    category: 'File cấu hình dự án & Lockfile',
    jsTsStack: 'package.json + pnpm-lock.yaml',
    modernPythonStack: 'pyproject.toml + uv.lock (hoặc poetry.lock)',
    whyRecommended: 'Chuẩn PEP 621 tập trung toàn bộ cấu hình dependencies, Ruff, Pyright, Pytest vào một file duy nhất.',
  },
  {
    category: 'Môi trường cô lập',
    jsTsStack: 'Thư mục node_modules/ cục bộ',
    modernPythonStack: 'Virtual Environment (thư mục .venv/ nội bộ trong project)',
    whyRecommended: 'Cô lập hoàn toàn thư viện giữa các dự án, không làm bẩn Python hệ điều hành.',
  },
  {
    category: 'Linter & Formatter',
    jsTsStack: 'ESLint + Prettier / Biome',
    modernPythonStack: 'Ruff (1 công cụ duy nhất viết bằng Rust thay thế Flake8, Black, isort)',
    whyRecommended: 'Chạy kiểm tra và format hàng chục nghìn dòng code chỉ trong vài chục mili-giây.',
  },
  {
    category: 'Static Type Checker',
    jsTsStack: 'tsc --noEmit (TypeScript Compiler)',
    modernPythonStack: 'Pyright (của Microsoft, cùng lõi Pylance) hoặc mypy',
    whyRecommended: 'Bắt lỗi kiểu dữ liệu tĩnh chính xác trước khi chạy chương trình.',
  },
  {
    category: 'Runtime Validation & DTO',
    jsTsStack: 'Zod / class-validator / Joi',
    modernPythonStack: 'Pydantic v2 (lõi viết bằng Rust, tích hợp mặc định trong FastAPI)',
    whyRecommended: 'Vừa khai báo kiểu cho IDE, vừa kiểm tra/ép kiểu dữ liệu JSON lúc Runtime với tốc độ cực cao.',
  },
  {
    category: 'Backend Framework',
    jsTsStack: 'NestJS / Express / Fastify',
    modernPythonStack: 'FastAPI (ASGI, async, DI, tự sinh OpenAPI) hoặc Django',
    whyRecommended: 'Kết hợp sự gọn nhẹ của Fastify với kiến trúc Decorator & Dependency Injection của NestJS.',
  },
  {
    category: 'ORM & Database Migration',
    jsTsStack: 'Prisma / TypeORM / Drizzle',
    modernPythonStack: 'SQLAlchemy 2.0 (strong typing Mapped[T] + async) + Alembic',
    whyRecommended: 'Kiểm soát truy vấn SQL sâu sắc, chống lỗi N+1 query và tự động dò model sinh file migration.',
  },
  {
    category: 'HTTP Client',
    jsTsStack: 'fetch / axios / undici',
    modernPythonStack: 'httpx (hỗ trợ cả sync và async/await) hoặc requests (chỉ sync)',
    whyRecommended: 'httpx hỗ trợ Connection Pooling và bất đồng bộ chuẩn xác cho FastAPI/AsyncIO.',
  },
  {
    category: 'Testing Framework',
    jsTsStack: 'Vitest / Jest',
    modernPythonStack: 'pytest + pytest-asyncio',
    whyRecommended: 'Cơ chế @pytest.fixture tiêm phụ thuộc cực mạnh, cú pháp assert ngắn gọn hơn Jest.',
  },
  {
    category: 'Background Task Queue',
    jsTsStack: 'BullMQ (Redis)',
    modernPythonStack: 'Celery hoặc ARQ / RQ (kết hợp Redis / RabbitMQ)',
    whyRecommended: 'Xử lý tác vụ nền phân tán, retry với exponential backoff và lập lịch Celery Beat.',
  },
  {
    category: 'Production Server',
    jsTsStack: 'PM2 / Node.js Cluster',
    modernPythonStack: 'Gunicorn quản lý các Uvicorn ASGI workers (hoặc Docker replicas)',
    whyRecommended: 'Tận dụng 100% đa nhân CPU theo công thức (2 x CPU cores) + 1.',
  },
];

export const CONCURRENCY_MATRIX: ConcurrencyMatrixRow[] = [
  {
    workloadType: 'I/O-Bound hiện đại (Gọi HTTP, DB, Redis, đọc socket)',
    pythonTool: 'asyncio (httpx, asyncpg, FastAPI)',
    nodeJsEquivalent: 'Node.js Event Loop chuẩn (Promise.all)',
    gilMechanismAndImpact: 'Chạy trên 1 Thread, 1 CPU core. Chuyển ngữ cảnh cực nhẹ, chịu tải hàng chục nghìn kết nối đồng thời.',
    recommendedLevel: 'pro',
  },
  {
    workloadType: 'I/O-Bound thư viện cũ (SDK chỉ có bản sync, đọc đĩa)',
    pythonTool: 'threading / asyncio.to_thread() / ThreadPoolExecutor',
    nodeJsEquivalent: 'Thread Pool nội bộ của libuv',
    gilMechanismAndImpact: 'Các lệnh I/O ở tầng C sẽ nhả khóa GIL, giúp các thread chờ I/O song song hiệu quả mà không chặn Event Loop.',
    recommendedLevel: 'pro',
  },
  {
    workloadType: 'CPU-Bound nặng (Resize ảnh, băm mật khẩu, tính toán lớn)',
    pythonTool: 'multiprocessing / ProcessPoolExecutor',
    nodeJsEquivalent: 'worker_threads hoặc child_process',
    gilMechanismAndImpact: 'Tạo các tiến trình độc lập, mỗi tiến trình có GIL riêng và vùng nhớ riêng, tận dụng 100% đa nhân CPU.',
    recommendedLevel: 'master',
  },
  {
    workloadType: 'Tác vụ nền kéo dài (Gửi 10.000 email, xuất video, train AI)',
    pythonTool: 'Celery / ARQ + Redis / RabbitMQ',
    nodeJsEquivalent: 'BullMQ + Redis Worker',
    gilMechanismAndImpact: 'Tách hẳn khỏi Web Server sang các Worker chuyên biệt, hỗ trợ retry, dead-letter queue và mở rộng ngang.',
    recommendedLevel: 'master',
  },
];

export const CLEAN_ARCH_FILES: CleanArchFileNode[] = [
  {
    path: 'src/app/main.py',
    name: 'main.py',
    layer: 'Application Entry & Lifespan',
    description: 'Khởi tạo thực thể FastAPI, đăng ký Middlewares, quản lý vòng đời kết nối (Lifespan) và gắn kết các APIRouter.',
    jsEquivalent: 'src/main.ts + app.module.ts trong NestJS',
    sampleCode: `from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.v1 import students
from app.core.database import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()

app = FastAPI(title="My Python Backend", lifespan=lifespan)
app.include_router(students.router, prefix="/api/v1")`,
  },
  {
    path: 'src/app/core/config.py',
    name: 'config.py',
    layer: 'Core Configuration',
    description: 'Quản lý biến môi trường .env an toàn kiểu dữ liệu với pydantic-settings (Fail-fast ngay khi khởi động nếu thiếu cấu hình).',
    jsEquivalent: '@nestjs/config + Zod env validation',
    sampleCode: `from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    access_token_expire_minutes: int = 30
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()`,
  },
  {
    path: 'src/app/core/database.py',
    name: 'database.py',
    layer: 'Core Database Infrastructure',
    description: 'Khởi tạo SQLAlchemy AsyncEngine, async_sessionmaker và hàm Dependency get_async_session() có chứa yield.',
    jsEquivalent: 'PrismaService / TypeOrmModule',
    sampleCode: `from typing import AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_async_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session`,
  },
  {
    path: 'src/app/models/student.py',
    name: 'student.py (Model)',
    layer: '1. Tầng Database Entities (SQLAlchemy 2.0)',
    description: 'Định nghĩa cấu trúc bảng cơ sở dữ liệu bằng cú pháp Mapped[T] và mapped_column() của SQLAlchemy 2.0.',
    jsEquivalent: 'schema.prisma / TypeORM @Entity()',
    sampleCode: `from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class Student(Base):
    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))`,
  },
  {
    path: 'src/app/schemas/student.py',
    name: 'student.py (Schema / DTO)',
    layer: '2. Tầng DTO & Validation (Pydantic v2)',
    description: 'Kiểm tra dữ liệu JSON đầu vào và định hình dữ liệu đầu ra với ConfigDict(from_attributes=True).',
    jsEquivalent: 'TypeScript Interface + Zod Schema',
    sampleCode: `from pydantic import BaseModel, ConfigDict, EmailStr, Field

class StudentCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)

class StudentResponse(StudentCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)`,
  },
  {
    path: 'src/app/repositories/student_repo.py',
    name: 'student_repo.py (Repository)',
    layer: '3. Tầng Truy vấn Dữ liệu (Data Access Layer)',
    description: 'Đóng gói toàn bộ câu lệnh SQLAlchemy (select, add, commit) tách biệt khỏi logic nghiệp vụ và HTTP.',
    jsEquivalent: 'StudentRepository trong NestJS',
    sampleCode: `from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.student import Student
from app.schemas.student import StudentCreate

class StudentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, payload: StudentCreate) -> Student:
        student = Student(**payload.model_dump())
        self.session.add(student)
        await self.session.commit()
        await self.session.refresh(student)
        return student`,
  },
  {
    path: 'src/app/services/student_service.py',
    name: 'student_service.py (Service)',
    layer: '3.5. Tầng Nghiệp vụ (Business Logic Layer)',
    description: 'Điều phối quy tắc nghiệp vụ, kiểm tra trùng lặp email, gọi Repository và kích hoạt tác vụ nền.',
    jsEquivalent: 'StudentService (@Injectable) trong NestJS',
    sampleCode: `from fastapi import HTTPException, status
from app.repositories.student_repo import StudentRepository
from app.schemas.student import StudentCreate

class StudentService:
    def __init__(self, repo: StudentRepository) -> None:
        self.repo = repo

    async def register_student(self, payload: StudentCreate):
        return await self.repo.create(payload)`,
  },
  {
    path: 'src/app/api/v1/students.py',
    name: 'students.py (API Router)',
    layer: '4. Tầng Giao vận HTTP (Controllers / Routers)',
    description: 'Định nghĩa endpoint HTTP, kết nối Schema + Repository/Service thông qua Depends() và trả về HTTP Status chuẩn.',
    jsEquivalent: 'StudentController (@Controller) trong NestJS',
    sampleCode: `from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.repositories.student_repo import StudentRepository
from app.schemas.student import StudentCreate, StudentResponse

router = APIRouter(prefix="/students", tags=["Students"])

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def register_student(
    payload: StudentCreate,
    db: AsyncSession = Depends(get_async_session),
):
    repo = StudentRepository(db)
    return await repo.create(payload)`,
  },
];

export const PORTFOLIO_MILESTONES: PortfolioProjectMilestone[] = [
  {
    order: 1,
    title: 'Project 1 — CLI Student & Task Management',
    coreTopics: 'Python Fundamentals + uv, Ruff, Pyright, Context Manager',
    priority: 'Bắt buộc',
    level: 'fundamental',
    description: 'Ứng dụng dòng lệnh quản lý sinh viên và công việc: CRUD danh sách, lưu/đọc file JSON an toàn với with, thống kê từ CSV.',
    keyDeliverables: ['Khởi tạo bằng uv init', 'Đọc/ghi JSON với Context Manager', '100% pass ruff check & pyright'],
  },
  {
    order: 2,
    title: 'Project 2 — High-Speed File Processing Tool & Mini Router',
    coreTopics: 'OOP, Decorator, Generator (yield), Context Manager',
    priority: 'Bắt buộc',
    level: 'advanced',
    description: 'Công cụ đọc/chuyển đổi file CSV, JSON, Log dung lượng hàng GB bằng pathlib và yield mà chỉ tốn vài MB RAM, kèm Mini Web Router dùng Decorator.',
    keyDeliverables: ['Streaming file lớn với yield', 'Decorator @route & @measure_time', 'Custom Context Manager'],
  },
  {
    order: 3,
    title: 'Project 3 — Mini Async Web Crawler (1.000 URLs)',
    coreTopics: 'Type Hints (Pyright), AsyncIO, httpx, Semaphore',
    priority: 'Bắt buộc',
    level: 'pro',
    description: 'Thu thập dữ liệu 1.000 URL đồng thời với httpx.AsyncClient, giới hạn 20 kết nối bằng asyncio.Semaphore và retry exponential backoff.',
    keyDeliverables: ['Kiểm soát luồng với Semaphore(20)', 'Tự động retry khi lỗi mạng', 'Lưu kết quả theo lô (Batch insert)'],
  },
  {
    order: 4,
    title: 'Project 4 — Bộ Unit Test & Mocking (>85% Coverage)',
    coreTopics: 'Package src-layout, pytest, @pytest.fixture, monkeypatch',
    priority: 'Bắt buộc',
    level: 'pro',
    description: 'Xây dựng bộ kiểm thử tự động toàn diện cho Crawler và File Tool sử dụng fixture tiêm phụ thuộc và parametrize.',
    keyDeliverables: ['Sử dụng @pytest.fixture với yield', '@pytest.mark.parametrize', 'Mock HTTP request không gọi mạng thật'],
  },
  {
    order: 5,
    title: 'Project 5 — Student & Course Management REST API',
    coreTopics: 'FastAPI, Pydantic v2, SQLAlchemy 2.0 Async, PostgreSQL, Alembic',
    priority: 'Rất cao',
    level: 'pro',
    description: 'Hệ thống Backend Clean Architecture hoàn chỉnh: CRUD phân trang, xác thực JWT (Access + Refresh Token), phân quyền RBAC Admin/Student.',
    keyDeliverables: ['Kiến trúc 4 tầng src-layout', 'SQLAlchemy 2.0 Async + Alembic migration', 'Integration Test với httpx.AsyncClient'],
  },
  {
    order: 6,
    title: 'Project 6 — Real-time Chat & Notification Backend',
    coreTopics: 'FastAPI WebSocket, Redis Pub/Sub, Caching',
    priority: 'Rất cao',
    level: 'pro',
    description: 'Hệ thống phòng chat thời gian thực nhiều người dùng sử dụng FastAPI WebSocket kết hợp Redis Pub/Sub để đồng bộ giữa nhiều Worker.',
    keyDeliverables: ['Connection Manager cho WebSocket', 'Redis Pub/Sub broadcast', 'Redis Cache-aside pattern'],
  },
  {
    order: 7,
    title: 'Project 7 — Distributed Task Processing & AI RAG Assistant',
    coreTopics: 'Threading, Multiprocessing, Celery + LLM API, Vector DB, RAG',
    priority: 'Cao',
    level: 'master',
    description: 'Hệ thống xử lý hàng đợi phân tán với Celery + Multiprocessing kết hợp trợ lý hỏi đáp tài liệu nội bộ sử dụng kiến trúc RAG.',
    keyDeliverables: ['Celery Worker + Beat + Dead-letter queue', 'Vector Embeddings search + Structured LLM Output', 'Tách biệt CPU-bound sang ProcessPool'],
  },
  {
    order: 8,
    title: 'Project 8 — Production-Ready Backend System',
    coreTopics: 'Multi-stage Docker với uv, Gunicorn/Uvicorn, Prometheus/Grafana, CI/CD',
    priority: 'Nâng cao',
    level: 'master',
    description: 'Đóng gói toàn bộ hệ thống với Multi-stage Dockerfile (~120MB), Nginx Reverse Proxy, giám sát OpenTelemetry và GitHub Actions CI/CD.',
    keyDeliverables: ['Multi-stage Dockerfile tối ưu với uv', 'Gunicorn + UvicornWorker (2xCPU + 1)', 'Profiling với py-spy & memray'],
  },
];

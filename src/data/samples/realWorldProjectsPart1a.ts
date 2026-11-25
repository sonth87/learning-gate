import { RealWorldProject } from '@/types/realWorldProject.types';

export const REAL_WORLD_PROJECTS_PART_1A: RealWorldProject[] = [
  // ==========================================================================
  // 1. REST API / BACKEND SERVICE (FASTAPI)
  // ==========================================================================
  {
    id: 'rw-fastapi-best-practices',
    groupId: 'rest-api',
    title: 'FastAPI Best Practices (Domain-Driven Structure)',
    repoName: 'zhanymkanov/fastapi-best-practices',
    url: 'https://github.com/zhanymkanov/fastapi-best-practices',
    kind: 'production-template',
    complexity: 'pro',
    scaleLabel: 'Modular Monolith API',
    summary:
      'Tài liệu & cấu trúc chuẩn mực cho dự án FastAPI cỡ vừa và lớn, tập trung vào tư duy tách domain và tránh lỗi async/sync.',
    purpose:
      'Giúp bạn biết cách tổ chức một Backend API thật khi dự án có nhiều tính năng (Auth, Posts, Payments...) thay vì nhồi hết vào 1 file main.py.',
    howItWorks: [
      'Client gửi HTTP Request -> đi vào router.py của từng domain (vd: posts/router.py).',
      'schemas.py dùng Pydantic tự động kiểm tra dữ liệu đầu vào (sai kiểu -> trả lỗi 422 ngay).',
      'dependencies.py kiểm tra token đăng nhập hoặc quyền hạn trước khi vào hàm xử lý.',
      'service.py chạy logic nghiệp vụ và gọi DB qua models.py / SQLAlchemy.',
      'Alembic quản lý lịch sử thay đổi bảng Database (migration) an toàn giữa các môi trường.',
    ],
    directoryTree: `src/
├── main.py              # Khởi tạo app FastAPI & gắn các router
├── config.py            # Đọc biến môi trường (.env) bằng Pydantic Settings
├── database.py          # Kết nối DB & session
└── posts/               # Tách riêng theo từng Domain nghiệp vụ
    ├── router.py        # Định nghĩa API endpoints (/posts)
    ├── schemas.py       # Khuôn dữ liệu Request/Response (Pydantic)
    ├── models.py        # Bảng Database (SQLAlchemy)
    ├── service.py       # Logic nghiệp vụ thuần túy
    ├── dependencies.py  # Kiểm tra quyền, lấy user hiện tại
    └── exceptions.py    # Lỗi riêng của domain posts`,
    libraries: [
      {
        name: 'FastAPI',
        role: 'Web Framework tạo REST API',
        whyNeeded:
          'Tự sinh tài liệu Swagger UI (/docs) và hỗ trợ async cực nhanh dựa trên Python Type Hints.',
      },
      {
        name: 'Pydantic v2 & pydantic-settings',
        role: 'Validate dữ liệu & đọc config (.env)',
        whyNeeded:
          'Đảm bảo dữ liệu JSON từ client gửi lên và biến môi trường luôn đúng kiểu trước khi chạy.',
      },
      {
        name: 'SQLAlchemy 2.0 + Alembic',
        role: 'ORM thao tác DB & Migration',
        whyNeeded:
          'SQLAlchemy giúp viết truy vấn DB bằng Python; Alembic lưu lại lịch sử thêm/sửa cột bảng DB.',
      },
    ],
    readingFocus:
      'Đọc phần "Project Structure" và "Async vs Sync routes" để hiểu vì sao không được gọi hàm chặn (time.sleep, requests.get) trong hàm async def.',
    tags: ['FastAPI', 'Pydantic', 'Alembic', 'Backend'],
    chapters: [
      {
        chapter: 'Phần 1',
        title: 'Project Structure (Chia thư mục theo Domain)',
        summaryVi:
          'Thay vì gom tất cả routers vào 1 thư mục, hãy chia theo nghiệp vụ: auth/, posts/, payments/. Mỗi thư mục có đủ router, schemas, service, models riêng.',
        url: 'https://github.com/zhanymkanov/fastapi-best-practices#project-structure',
      },
      {
        chapter: 'Phần 2',
        title: 'Async Routes vs Sync Routes (Event Loop)',
        summaryVi:
          'Giải thích cơ chế: hàm `async def` chạy trực tiếp trên Event Loop (nếu gọi I/O đồng bộ sẽ làm treo cả server), còn hàm `def` thường sẽ được FastAPI đẩy vào ThreadPool an toàn.',
        url: 'https://github.com/zhanymkanov/fastapi-best-practices#async-routes',
      },
      {
        chapter: 'Phần 3',
        title: 'Dependencies Beyond Dependency Injection',
        summaryVi:
          'Dùng `Depends()` không chỉ để lấy DB session mà còn để kiểm tra bài viết có tồn tại không, user có quyền sửa bài đó không trước khi vào route.',
        url: 'https://github.com/zhanymkanov/fastapi-best-practices#dependencies',
      },
      {
        chapter: 'Phần 4',
        title: 'Pydantic BaseSettings & Alembic Migrations',
        summaryVi:
          'Tách cấu hình môi trường bằng `BaseSettings` và quy tắc đặt tên khóa ngoại/index rõ ràng cho Alembic.',
        url: 'https://github.com/zhanymkanov/fastapi-best-practices#pydantic',
      },
    ],
    ideFiles: [
      {
        path: 'src/config.py',
        roleDescription:
          'Đọc cấu hình từ file .env bằng pydantic-settings. Nếu thiếu biến bắt buộc (như DATABASE_URL), ứng dụng sẽ báo lỗi rõ ràng ngay lúc khởi động.',
        keyPatterns: ['BaseSettings', 'SettingsConfigDict', 'Environment Variables'],
        language: 'python',
        code: `"""Quản lý cấu hình ứng dụng bằng Pydantic Settings (Dành cho người mới)."""

# pydantic_settings là thư viện chuẩn giúp đọc biến môi trường từ file .env
# và tự động ép kiểu (ví dụ: chuỗi "8000" -> số nguyên 8000).
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppConfig(BaseSettings):
    # Tên môi trường hiện tại: local, staging, hoặc production
    ENVIRONMENT: str = "local"
    # Chuỗi kết nối PostgreSQL bất đồng bộ (dùng driver asyncpg)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app_db"
    # Khóa bí mật để ký JWT Token đăng nhập
    JWT_SECRET_KEY: str = "change-me-in-production"
    # Số bài viết tối đa trả về trên 1 trang
    DEFAULT_PAGE_LIMIT: int = 20

    # Cấu hình để Pydantic tự tìm và đọc file .env ở thư mục gốc
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Khởi tạo đối tượng settings dùng chung cho toàn dự án
settings = AppConfig()`,
      },
      {
        path: 'src/posts/schemas.py',
        roleDescription:
          'Định nghĩa khuôn dữ liệu (Schemas) bằng Pydantic v2: kiểm tra dữ liệu khách gửi lên (PostCreate) và lọc dữ liệu trả về (PostResponse).',
        keyPatterns: ['Pydantic BaseModel', 'Field Validation', 'ConfigDict'],
        language: 'python',
        code: `"""Schemas kiểm tra dữ liệu đầu vào/đầu ra cho domain Posts."""

from datetime import datetime
# BaseModel là lớp gốc của Pydantic để định nghĩa cấu trúc JSON
# Field giúp đặt điều kiện ràng buộc (độ dài tối thiểu, tối đa, mô tả...)
from pydantic import BaseModel, ConfigDict, Field


class PostCreate(BaseModel):
    """Dữ liệu bắt buộc khi người dùng gửi request tạo bài viết mới."""

    # min_length=5: Nếu tiêu đề ngắn hơn 5 ký tự, FastAPI tự động trả lỗi HTTP 422
    title: str = Field(..., min_length=5, max_length=120, description="Tiêu đề bài viết")
    content: str = Field(..., min_length=10, description="Nội dung chi tiết")
    is_published: bool = Field(default=True, description="Trạng thái xuất bản")


class PostResponse(BaseModel):
    """Dữ liệu JSON trả về cho client (ẩn các trường nhạy cảm trong DB)."""

    id: int
    title: str
    content: str
    author_id: int
    created_at: datetime

    # from_attributes=True cho phép Pydantic đọc trực tiếp từ đối tượng SQLAlchemy Model
    model_config = ConfigDict(from_attributes=True)`,
      },
      {
        path: 'src/posts/dependencies.py',
        roleDescription:
          'Sử dụng cơ chế Dependency Injection của FastAPI để tái sử dụng logic tìm bài viết và kiểm tra quyền sở hữu trước khi vào Router.',
        keyPatterns: ['Depends()', 'HTTPException 404/403', 'Guard Pattern'],
        language: 'python',
        code: `"""Các hàm Dependency dùng để kiểm tra dữ liệu & quyền hạn trước khi vào Route."""

# Depends là cơ chế "tiêm phụ thuộc" đặc sản của FastAPI
# HTTPException dùng để dừng xử lý và trả mã lỗi HTTP (404, 403...) về client
from fastapi import Depends, HTTPException, status
from posts import service


async def valid_post_id(post_id: int) -> dict:
    """Kiểm tra post_id có tồn tại trong DB không. Nếu không -> trả lỗi 404 ngay."""
    post = await service.get_post_by_id(post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy bài viết #{post_id}",
        )
    return post


async def valid_owned_post(
    # FastAPI sẽ tự động chạy hàm valid_post_id ở trên trước rồi truyền kết quả vào đây!
    post: dict = Depends(valid_post_id),
    current_user_id: int = 101,  # Giả lập ID người dùng đang đăng nhập từ JWT Token
) -> dict:
    """Đảm bảo chỉ tác giả bài viết mới có quyền sửa hoặc xóa."""
    if post["author_id"] != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền chỉnh sửa bài viết của người khác",
        )
    return post`,
      },
      {
        path: 'src/posts/service.py',
        roleDescription:
          'Tầng Service chứa logic nghiệp vụ thuần túy và thao tác dữ liệu, hoàn toàn không phụ thuộc vào HTTP Request/Response.',
        keyPatterns: ['Service Layer', 'Async Business Logic'],
        language: 'python',
        code: `"""Tầng xử lý logic nghiệp vụ (Service Layer) của domain Posts."""

from datetime import datetime, timezone
from posts.schemas import PostCreate

# Kho dữ liệu giả lập trong RAM để minh họa (thực tế sẽ gọi SQLAlchemy AsyncSession)
_FAKE_POSTS_DB: dict[int, dict] = {
    1: {
        "id": 1,
        "title": "Cách tổ chức dự án FastAPI chuẩn Domain-Driven",
        "content": "Tách riêng router, schemas, service và dependencies cho từng domain.",
        "author_id": 101,
        "created_at": datetime(2025, 3, 1, 9, 0, tzinfo=timezone.utc),
    }
}


async def get_post_by_id(post_id: int) -> dict | None:
    """Truy vấn bài viết theo ID."""
    return _FAKE_POSTS_DB.get(post_id)


async def create_new_post(payload: PostCreate, author_id: int) -> dict:
    """Tạo bài viết mới và lưu vào cơ sở dữ liệu."""
    next_id = len(_FAKE_POSTS_DB) + 1
    record = {
        "id": next_id,
        "title": payload.title.strip(),
        "content": payload.content,
        "author_id": author_id,
        "created_at": datetime.now(timezone.utc),
    }
    _FAKE_POSTS_DB[next_id] = record
    return record`,
      },
      {
        path: 'src/posts/router.py',
        roleDescription:
          'Định nghĩa các API Endpoint cho domain Posts. Nhờ đã tách Schemas, Dependencies và Service nên file Router cực kỳ ngắn gọn, dễ đọc.',
        keyPatterns: ['APIRouter', 'response_model', 'status_code'],
        language: 'python',
        code: `"""Router khai báo các đường dẫn HTTP API cho domain Posts."""

from fastapi import APIRouter, Depends, status
from posts import dependencies, schemas, service

# APIRouter giúp gom nhóm toàn bộ endpoint có chung tiền tố /posts
router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("/{post_id}", response_model=schemas.PostResponse)
async def read_post(
    # Nhờ Depends(valid_post_id), nếu bài viết không tồn tại thì đã dừng ở bước 404 rồi
    post: dict = Depends(dependencies.valid_post_id),
) -> dict:
    """Lấy chi tiết một bài viết theo ID."""
    return post


@router.post(
    "",
    response_model=schemas.PostResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_post(payload: schemas.PostCreate) -> dict:
    """Tạo bài viết mới (Pydantic tự động validate payload trước khi vào hàm)."""
    return await service.create_new_post(payload=payload, author_id=101)


@router.put("/{post_id}", response_model=schemas.PostResponse)
async def update_post(
    payload: schemas.PostCreate,
    # Kiểm tra cả 2 điều kiện: bài viết tồn tại VÀ thuộc về người đang đăng nhập
    post: dict = Depends(dependencies.valid_owned_post),
) -> dict:
    """Cập nhật bài viết của chính mình."""
    post["title"] = payload.title
    post["content"] = payload.content
    return post`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-fastapi-get',
        label: 'GET /posts/1 (200 OK)',
        kind: 'curl',
        command: 'curl -X GET http://localhost:8000/posts/1',
        description: 'Lấy bài viết #1 qua dependency valid_post_id',
        httpMeta: {
          method: 'GET',
          endpoint: '/posts/1',
          statusCode: 200,
          statusText: '200 OK',
          latencyMs: 9,
        },
        stdout: `{
  "id": 1,
  "title": "Cách tổ chức dự án FastAPI chuẩn Domain-Driven",
  "content": "Tách riêng router, schemas, service và dependencies cho từng domain.",
  "author_id": 101,
  "created_at": "2025-03-01T09:00:00Z"
}`,
      },
      {
        id: 'cmd-rw-fastapi-403',
        label: 'PUT /posts/1 (403 Forbidden)',
        kind: 'curl',
        command: 'curl -X PUT http://localhost:8000/posts/1 -d \'{"title":"Hack"}\'',
        description: 'Khi user khác cố sửa bài viết không phải của mình',
        httpMeta: {
          method: 'PUT',
          endpoint: '/posts/1',
          statusCode: 403,
          statusText: '403 Forbidden',
          latencyMs: 6,
        },
        stdout: `{
  "detail": "Bạn không có quyền chỉnh sửa bài viết của người khác"
}`,
      },
    ],
  },
  {
    id: 'rw-clean-arch-fastapi',
    groupId: 'rest-api',
    title: 'Clean Architecture FastAPI Project Template',
    repoName: 'Peopl3s/clean-architecture-fastapi-project-template',
    url: 'https://github.com/Peopl3s/clean-architecture-fastapi-project-template',
    kind: 'production-template',
    complexity: 'master',
    scaleLabel: 'Enterprise Microservice',
    summary:
      'Mẫu CookieCutter áp dụng Clean Architecture cho FastAPI, cho phép bật/tắt PostgreSQL, Redis, Kafka/RabbitMQ và Docker.',
    purpose:
      'Minh họa cách tách biệt hoàn toàn Logic Nghiệp vụ (Domain) khỏi Framework và Database để dự án lớn dễ bảo trì, dễ thay đổi công nghệ.',
    howItWorks: [
      'Presentation Layer (FastAPI) nhận request và chuyển thành DTO đầu vào.',
      'Application Layer (Use Cases) điều phối quy trình nghiệp vụ mà không phụ thuộc vào FastAPI hay SQL.',
      'Domain Layer chứa Entities và quy tắc cốt lõi thuần Python.',
      'Infrastructure Layer thực thi việc lưu PostgreSQL, cache Redis hoặc bắn message sang Kafka/RabbitMQ.',
    ],
    directoryTree: `src/
├── domain/              # Entities & Business Rules thuần Python (không import FastAPI/DB)
├── application/         # Use Cases & Interfaces (Port)
├── infrastructure/      # Triển khai thật: PostgreSQL, Redis, Kafka/RabbitMQ
├── presentation/        # FastAPI routers, schemas, HTTP handlers
└── tests/               # Unit tests (logic) + Integration tests (API & DB)
docker-compose.yml       # Dựng nhanh DB, Redis, Broker để chạy local`,
    libraries: [
      {
        name: 'Cookiecutter',
        role: 'Công cụ sinh khung dự án tự động',
        whyNeeded:
          'Hỏi bạn vài câu (dùng Redis không? dùng Kafka không?) rồi tự tạo bộ thư mục chuẩn.',
      },
      {
        name: 'PostgreSQL + Redis + Dishka/Depends',
        role: 'Database, Cache & Dependency Injection Container',
        whyNeeded:
          'Gắn kết Interface ở tầng Application với bản triển khai thật ở tầng Infrastructure.',
      },
    ],
    readingFocus:
      'Mở thư mục template xem cách tầng presentation gọi application qua Dependency Injection mà không chạm trực tiếp vào infrastructure.',
    tags: ['Clean Architecture', 'FastAPI', 'Docker', 'Redis', 'Kafka'],
    chapters: [
      {
        chapter: 'Tầng 1',
        title: 'Domain Layer (Trái tim nghiệp vụ thuần Python)',
        summaryVi:
          'Chứa Entities và Value Objects. Không import bất kỳ thư viện web (FastAPI) hay database (SQLAlchemy) nào để có thể test độc lập 100%.',
      },
      {
        chapter: 'Tầng 2',
        title: 'Application Layer (Use Cases & Ports)',
        summaryVi:
          'Định nghĩa các hành động của hệ thống (vd: CreateUserUseCase) và các Interface (Protocol/ABC) yêu cầu lưu trữ hoặc gửi sự kiện.',
      },
      {
        chapter: 'Tầng 3',
        title: 'Infrastructure Layer (Adapters: Postgres, Redis, Kafka)',
        summaryVi:
          'Hiện thực hóa các Interface của tầng Application bằng công nghệ thật: SQLAlchemyRepository, RedisCache, KafkaEventPublisher.',
      },
      {
        chapter: 'Tầng 4',
        title: 'Presentation Layer (FastAPI Controllers)',
        summaryVi:
          'Nhận HTTP Request, gọi Use Case tương ứng và chuyển kết quả thành HTTP JSON Response.',
      },
    ],
    ideFiles: [
      {
        path: 'src/domain/user_entity.py',
        roleDescription:
          'Tầng Domain: Chỉ dùng Python chuẩn (@dataclass), chứa quy tắc nghiệp vụ cốt lõi mà không phụ thuộc vào FastAPI hay SQLAlchemy.',
        keyPatterns: ['@dataclass', 'Pure Domain Entity', 'Zero Framework Dependency'],
        language: 'python',
        code: `"""Tầng Domain: Thực thể User thuần Python, không phụ thuộc DB hay Web Framework."""

from dataclasses import dataclass


@dataclass
class UserEntity:
    id: str
    email: str
    is_active: bool = True

    def deactivate(self) -> None:
        """Quy tắc nghiệp vụ nằm ngay trong Domain Entity."""
        if not self.is_active:
            raise ValueError("Tài khoản này đã bị vô hiệu hóa từ trước.")
        self.is_active = False`,
      },
      {
        path: 'src/application/ports.py',
        roleDescription:
          'Tầng Application: Khai báo hợp đồng giao tiếp (Protocol/Interface) mà tầng Infrastructure phải thực thi.',
        keyPatterns: ['typing.Protocol', 'Dependency Inversion Principle'],
        language: 'python',
        code: `"""Hợp đồng (Port/Interface) giúp tầng Application không phụ thuộc cứng vào Postgres hay Redis."""

# Protocol trong typing giúp định nghĩa Interface theo kiểu Duck Typing hiện đại
from typing import Protocol
from domain.user_entity import UserEntity


class UserRepositoryPort(Protocol):
    """Bất kỳ Database nào (Postgres, Mongo, hay InMemory) chỉ cần có 2 hàm này là dùng được."""

    async def get_by_email(self, email: str) -> UserEntity | None: ...

    async def save(self, user: UserEntity) -> None: ...`,
      },
      {
        path: 'src/application/register_user_usecase.py',
        roleDescription:
          'Use Case điều phối luồng đăng ký người dùng: kiểm tra trùng email rồi lưu qua UserRepositoryPort.',
        keyPatterns: ['Use Case / Interactor', 'Constructor Injection'],
        language: 'python',
        code: `"""Use Case: Đăng ký người dùng mới (Tầng Application)."""

import uuid
from application.ports import UserRepositoryPort
from domain.user_entity import UserEntity


class RegisterUserUseCase:
    def __init__(self, repo: UserRepositoryPort) -> None:
        # Nhận vào Interface (Port), không quan tâm bên dưới là Postgres hay RAM
        self._repo = repo

    async def execute(self, email: str) -> UserEntity:
        clean_email = email.strip().lower()
        existing = await self._repo.get_by_email(clean_email)
        if existing is not None:
            raise ValueError(f"Email '{clean_email}' đã được đăng ký!")

        new_user = UserEntity(id=f"usr_{uuid.uuid4().hex[:8]}", email=clean_email)
        await self._repo.save(new_user)
        return new_user`,
      },
      {
        path: 'src/infrastructure/postgres_user_repo.py',
        roleDescription:
          'Tầng Infrastructure: Triển khai thực tế của UserRepositoryPort để lưu dữ liệu vào Database.',
        keyPatterns: ['Repository Adapter', 'Infrastructure Implementation'],
        language: 'python',
        code: `"""Tầng Infrastructure: Bộ lưu trữ thực thi UserRepositoryPort."""

from domain.user_entity import UserEntity


class PostgresUserRepository:
    """Triển khai cụ thể kết nối DB (ở đây mô phỏng bằng dict để dễ chạy thử)."""

    def __init__(self) -> None:
        self._storage: dict[str, UserEntity] = {}

    async def get_by_email(self, email: str) -> UserEntity | None:
        return self._storage.get(email)

    async def save(self, user: UserEntity) -> None:
        self._storage[user.email] = user`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-clean-arch-run',
        label: 'Chạy UseCase Kiểm thử',
        kind: 'pytest',
        command: 'uv run pytest tests/test_register_usecase.py -v',
        description: 'Kiểm thử tầng Application độc lập không cần bật DB thật',
        stdout: `============================= test session starts ==============================
collected 2 items

tests/test_register_usecase.py::test_register_new_user_success PASSED    [ 50%]
tests/test_register_usecase.py::test_register_duplicate_email_raises PASSED [100%]

============================== 2 passed in 0.04s ===============================`,
      },
    ],
  },
  {
    id: 'rw-pbl-restful-microservice',
    groupId: 'rest-api',
    title: 'Build a RESTful Microservice in Python (PBL)',
    repoName: 'project-based-learning',
    url: 'https://github.com/practical-tutorials/project-based-learning#python',
    kind: 'pbl-tutorial',
    complexity: 'basic',
    scaleLabel: 'Mini Service (Tự code từ đầu)',
    summary:
      'Bài thực hành từng bước từ danh sách project-based-learning: tự tay xây dựng một RESTful Microservice hoàn chỉnh từ con số 0.',
    purpose:
      'Giúp người mới hiểu bản chất một API server hoạt động ra sao: nhận URL, đọc tham số, xử lý CRUD và trả mã HTTP (200, 201, 404).',
    howItWorks: [
      'Khởi tạo HTTP server lắng nghe trên cổng local (vd: localhost:5000).',
      'Định nghĩa các route GET/POST/PUT/DELETE cho tài nguyên.',
      'Đọc payload JSON từ request, lưu/truy vấn dữ liệu và trả về JSON response.',
    ],
    directoryTree: `microservice/
├── app.py               # Khai báo routes và khởi chạy server
├── storage.py           # Lưu trữ và truy vấn danh sách items
├── requirements.txt     # Danh sách thư viện cần cài
└── test_app.py          # Kiểm tra các endpoint hoạt động đúng`,
    libraries: [
      {
        name: 'Flask / FastAPI',
        role: 'Micro-framework tạo HTTP API',
        whyNeeded:
          'Thay vì tự parse socket/HTTP thô bằng tay, framework giúp map thẳng URL vào hàm Python.',
      },
      {
        name: 'pytest',
        role: 'Kiểm thử tự động các endpoint API',
        whyNeeded:
          'Giúp tự động kiểm tra API trả về đúng status code 200/201/404 mỗi khi sửa code.',
      },
    ],
    readingFocus:
      'Đọc file app.py trong IDE để thấy rõ cách ánh xạ 4 phương thức HTTP (GET, POST, PUT, DELETE) vào 4 hàm Python.',
    tags: ['PBL', 'REST API', 'Beginner Friendly'],
    chapters: [
      {
        chapter: 'Bước 1',
        title: 'Thiết kế RESTful Endpoints & HTTP Status Codes',
        summaryVi:
          'Hiểu quy ước chuẩn: GET /items (lấy danh sách -> 200), POST /items (tạo mới -> 201), GET /items/<id> (không thấy -> 404), DELETE /items/<id> (xóa -> 204).',
      },
      {
        chapter: 'Bước 2',
        title: 'Xử lý JSON Request & Response',
        summaryVi:
          'Đọc dữ liệu client gửi lên từ body JSON, kiểm tra trường bắt buộc và trả về chuỗi JSON kèm header Content-Type: application/json.',
      },
      {
        chapter: 'Bước 3',
        title: 'Đóng gói Docker & Viết Unit Test',
        summaryVi:
          'Viết test client gọi thử các API mà không cần mở trình duyệt, sau đó đóng gói vào Dockerfile để deploy.',
      },
    ],
    ideFiles: [
      {
        path: 'microservice/app.py',
        roleDescription:
          'File chính của RESTful Microservice: minh họa trọn vẹn 4 thao tác CRUD (Create, Read, Update, Delete) qua HTTP JSON.',
        keyPatterns: ['@app.get', '@app.post', 'jsonify', 'HTTP Status Codes'],
        language: 'python',
        code: `"""RESTful Microservice quản lý danh sách Sách (Giải thích chi tiết cho người mới)."""

# Flask là micro-framework cực kỳ phổ biến để học bản chất Web/API
# jsonify: chuyển dict/list của Python thành chuỗi chuẩn JSON trả về cho client
# request: đối tượng chứa dữ liệu mà client (trình duyệt/mobile app) gửi lên
from flask import Flask, jsonify, request

app = Flask(__name__)

# Dữ liệu mẫu lưu trong RAM (khi học xong bước này bạn sẽ thay bằng SQLite/PostgreSQL)
BOOKS_DB: dict[int, dict] = {
    1: {"id": 1, "title": "Fluent Python", "author": "Luciano Ramalho"},
    2: {"id": 2, "title": "Clean Architecture", "author": "Robert C. Martin"},
}


@app.get("/api/books")
def list_books():
    """[READ] GET /api/books -> Trả về toàn bộ danh sách sách (HTTP 200 OK)."""
    return jsonify(list(BOOKS_DB.values())), 200


@app.get("/api/books/<int:book_id>")
def get_book(book_id: int):
    """[READ ONE] Tìm sách theo ID. Nếu không có -> trả về lỗi HTTP 404 Not Found."""
    book = BOOKS_DB.get(book_id)
    if book is None:
        return jsonify({"error": f"Không tìm thấy sách có id={book_id}"}), 404
    return jsonify(book), 200


@app.post("/api/books")
def create_book():
    """[CREATE] Nhận JSON từ client để thêm sách mới -> trả về HTTP 201 Created."""
    payload = request.get_json(silent=True) or {}
    if not payload.get("title") or not payload.get("author"):
        return jsonify({"error": "Thiếu trường 'title' hoặc 'author'"}), 400

    new_id = max(BOOKS_DB.keys(), default=0) + 1
    new_book = {
        "id": new_id,
        "title": str(payload["title"]).strip(),
        "author": str(payload["author"]).strip(),
    }
    BOOKS_DB[new_id] = new_book
    return jsonify(new_book), 201


@app.delete("/api/books/<int:book_id>")
def delete_book(book_id: int):
    """[DELETE] Xóa sách theo ID."""
    if book_id not in BOOKS_DB:
        return jsonify({"error": "Sách không tồn tại"}), 404
    deleted = BOOKS_DB.pop(book_id)
    return jsonify({"deleted": deleted["id"]}), 200`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-micro-list',
        label: 'GET /api/books',
        kind: 'curl',
        command: 'curl -s http://localhost:5000/api/books',
        description: 'Lấy danh sách sách hiện có',
        stdout: `[
  {"author": "Luciano Ramalho", "id": 1, "title": "Fluent Python"},
  {"author": "Robert C. Martin", "id": 2, "title": "Clean Architecture"}
]`,
      },
    ],
  },

  // ==========================================================================
  // 2. FULL-STACK WEB APP (DJANGO & FLASK)
  // ==========================================================================
  {
    id: 'rw-pbl-flask-microblog',
    groupId: 'fullstack-web',
    title: 'Build a Microblog with Flask (The Flask Mega-Tutorial — Đủ 23 Chương)',
    repoName: 'miguelgrinberg/microblog',
    url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world',
    kind: 'pbl-tutorial',
    complexity: 'basic',
    scaleLabel: 'Full-Stack Web App (23 Chapters)',
    summary:
      'Chuỗi 23 bài hướng dẫn kinh điển của Miguel Grinberg (được dẫn từ project-based-learning): xây dựng mạng xã hội Microblog từ Hello World đến Database, Auth, Followers, Full-Text Search, Background Jobs, Docker và REST API.',
    purpose:
      'Dạy người mới toàn bộ vòng đời phát triển một ứng dụng Web thực tế qua 23 chương tăng dần độ khó: bạn sẽ hiểu rõ tại sao cần từng thư viện (Jinja2, Flask-WTF, SQLAlchemy, Alembic, Flask-Login, Redis/RQ) khi dự án lớn lên.',
    howItWorks: [
      'Chặng 1 (Chương 1–4): Dựng app Flask, render giao diện HTML với Jinja2 Templates, xử lý Form với Flask-WTF và thiết kế Database với SQLAlchemy + Flask-Migrate (Alembic).',
      'Chặng 2 (Chương 5–11): Xây hệ thống Đăng nhập (Flask-Login), trang cá nhân + Avatar (Gravatar), xử lý lỗi, tính năng Follow/Unfollow người dùng, phân trang, gửi Email đặt lại mật khẩu và giao diện Bootstrap.',
      'Chặng 3 (Chương 12–16): Hiển thị múi giờ local, Đa ngôn ngữ (I18n với Flask-Babel), dịch trực tiếp bằng AJAX, tái cấu trúc dự án theo chuẩn Application Factory & Blueprints (Chương 15), và tìm kiếm toàn văn (Elasticsearch).',
      'Chặng 4 (Chương 17–23): Triển khai lên Linux Server, Heroku, Docker Containers; thêm Popup thông báo thời gian thực, Background Jobs với Redis Queue (RQ) và cung cấp RESTful API.',
    ],
    directoryTree: `microblog/
├── app/
│   ├── __init__.py      # [Ch.15] Application Factory create_app() khởi tạo DB, Login, Mail
│   ├── models.py        # [Ch.4,5,8,21,22] Bảng User, Post, followers, Notification, Task
│   ├── auth/            # [Ch.5,10,15] Blueprint xử lý Đăng nhập, Đăng ký, Quên mật khẩu
│   │   ├── routes.py
│   │   └── forms.py     # [Ch.3,5] Flask-WTF validate form & chống tấn công CSRF
│   ├── main/            # [Ch.15] Blueprint chính: dòng thời gian, khám phá, trang cá nhân
│   │   └── routes.py
│   ├── api/             # [Ch.23] Blueprint cung cấp REST API có xác thực Token
│   │   └── users.py
│   ├── tasks.py         # [Ch.22] Tác vụ chạy nền với RQ (xuất bài viết gửi qua email)
│   └── templates/       # [Ch.2,11] Giao diện HTML kế thừa từ base.html
├── migrations/          # [Ch.4] Lịch sử nâng cấp bảng Database (Alembic)
├── config.py            # [Ch.3] Đọc biến môi trường SECRET_KEY, DATABASE_URL, MAIL_SERVER
├── Dockerfile           # [Ch.19] Đóng gói container chạy với Gunicorn
└── microblog.py         # [Ch.1] Điểm khởi chạy ứng dụng`,
    libraries: [
      {
        name: 'Flask + Jinja2 + Blueprints',
        role: 'Web Framework, Template HTML & Chia module (Ch.1, 2, 15)',
        whyNeeded:
          'Flask điều hướng URL; Jinja2 gắn dữ liệu Python vào HTML; Blueprints tách project lớn thành các phân khu độc lập (auth, main, api).',
      },
      {
        name: 'Flask-WTF + WTForms',
        role: 'Xây dựng & Kiểm tra Form nhập liệu (Ch.3)',
        whyNeeded:
          'Tự động sinh mã CSRF Token chống giả mạo request và kiểm tra email/mật khẩu hợp lệ.',
      },
      {
        name: 'Flask-SQLAlchemy + Flask-Migrate',
        role: 'ORM Database & Quản lý Migration (Ch.4)',
        whyNeeded:
          'Thao tác bảng User/Post bằng class Python và nâng cấp cấu trúc bảng an toàn qua từng chương mà không mất dữ liệu.',
      },
      {
        name: 'Flask-Login + Werkzeug Security',
        role: 'Quản lý phiên đăng nhập & Băm mật khẩu (Ch.5)',
        whyNeeded:
          'Không bao giờ lưu mật khẩu thô vào DB; Werkzeug băm mật khẩu một chiều còn Flask-Login giữ trạng thái đăng nhập.',
      },
      {
        name: 'Flask-Mail + Redis + RQ',
        role: 'Gửi Email & Hàng đợi tác vụ nền (Ch.10, 22)',
        whyNeeded:
          'Đẩy việc gửi mail và xuất dữ liệu nặng sang tiến trình RQ Worker chạy ngầm để web phản hồi tức thì.',
      },
    ],
    readingFocus:
      'Xem danh sách đủ 23 Chương ngay bên dưới để nắm lộ trình từ cơ bản đến nâng cao, và bấm "Mở trong VS Code IDE" để đọc code mẫu có chú thích tiếng Việt của Microblog.',
    tags: ['PBL', 'Flask', '23 Chapters', 'SQLAlchemy', 'Full-stack'],
    chapters: [
      {
        chapter: 'Chapter 1',
        title: 'Hello, World!',
        summaryVi:
          'Cài đặt Flask trong môi trường ảo, tạo package `app/`, viết route đầu tiên `@app.route("/")` và file khởi chạy `microblog.py`.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world',
      },
      {
        chapter: 'Chapter 2',
        title: 'Templates (Giao diện HTML động với Jinja2)',
        summaryVi:
          'Tách mã HTML ra khỏi file Python bằng `render_template()`, dùng `{{ ... }}`, vòng lặp `{% for %}` và kế thừa khung giao diện chung `base.html`.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-ii-templates',
      },
      {
        chapter: 'Chapter 3',
        title: 'Web Forms (Xử lý Form & Chống CSRF với Flask-WTF)',
        summaryVi:
          'Tạo file `config.py` (chứa `SECRET_KEY`), dùng `FlaskForm` định nghĩa form đăng nhập có kiểm tra dữ liệu (`DataRequired`) và hiển thị thông báo `flash()`.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-iii-web-forms',
      },
      {
        chapter: 'Chapter 4',
        title: 'Database (SQLAlchemy ORM & Alembic Migrations)',
        summaryVi:
          'Thiết kế bảng `User` và `Post` (quan hệ 1-Nhiều) trong `models.py`, dùng `flask db migrate` và `flask db upgrade` để tạo bảng SQLite/Postgres.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-iv-database',
      },
      {
        chapter: 'Chapter 5',
        title: 'User Logins (Băm mật khẩu & Quản lý phiên với Flask-Login)',
        summaryVi:
          'Dùng `generate_password_hash` / `check_password_hash`, tích hợp `UserMixin`, chặn trang nội bộ bằng `@login_required` và xây trang Đăng ký tài khoản.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-v-user-logins',
      },
      {
        chapter: 'Chapter 6',
        title: 'Profile Page and Avatars',
        summaryVi:
          'Tạo trang hồ sơ `/user/<username>`, tự động lấy ảnh đại diện từ dịch vụ Gravatar qua mã MD5 email, ghi nhận thời점 `last_seen` và form sửa tiểu sử `about_me`.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-vi-profile-page-and-avatars',
      },
      {
        chapter: 'Chapter 7',
        title: 'Error Handling (Trang lỗi 404/500 & Ghi Log)',
        summaryVi:
          'Tùy biến trang lỗi 404/500 thân thiện, tự động `db.session.rollback()` khi lỗi DB, và cấu hình `RotatingFileHandler` + gửi email cảnh báo khi server gặp lỗi 500.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-vii-error-handling',
      },
      {
        chapter: 'Chapter 8',
        title: 'Followers (Quan hệ Nhiều-Nhiều & Unit Testing)',
        summaryVi:
          'Thiết kế bảng phụ `followers` kết nối User với User (Many-to-Many), viết truy vấn SQL JOIN lấy bảng tin (timeline) từ những người đang theo dõi và viết Unit Test.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-viii-followers',
      },
      {
        chapter: 'Chapter 9',
        title: 'Pagination (Đăng bài mới & Phân trang bảng tin)',
        summaryVi:
          'Thêm form đăng bài viết trên trang chủ, trang `/explore` khám phá toàn bộ bài viết, và dùng `db.paginate()` để chia nhỏ danh sách kèm nút Trang trước / Trang sau.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-ix-pagination',
      },
      {
        chapter: 'Chapter 10',
        title: 'Email Support (Khôi phục mật khẩu bằng JWT & Flask-Mail)',
        summaryVi:
          'Tích hợp `Flask-Mail`, tạo token khôi phục mật khẩu có thời hạn bằng `pyjwt` và đẩy việc gửi email vào luồng nền (`Thread`) để web không bị khựng.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-x-email-support',
      },
      {
        chapter: 'Chapter 11',
        title: 'Facelift (Làm đẹp giao diện với Bootstrap)',
        summaryVi:
          'Thay toàn bộ giao diện HTML thô bằng hệ thống Grid, Navbar, Card và Alert chuẩn mực của Bootstrap CSS.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xi-facelift',
      },
      {
        chapter: 'Chapter 12',
        title: 'Dates and Times (Đồng bộ múi giờ UTC & Hiển thị giờ địa phương)',
        summaryVi:
          'Nguyên tắc vàng: Server luôn lưu giờ chuẩn UTC, còn trình duyệt của từng người dùng tự chuyển sang múi giờ địa phương của họ (vd: "5 phút trước").',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xii-dates-and-times',
      },
      {
        chapter: 'Chapter 13',
        title: 'I18n and L10n (Đa ngôn ngữ với Flask-Babel)',
        summaryVi:
          'Đánh dấu chuỗi cần dịch bằng `_("...")`, trích xuất ra file `.po` / `.mo` để ứng dụng tự động hiển thị ngôn ngữ theo trình duyệt người dùng.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xiii-i18n-and-l10n',
      },
      {
        chapter: 'Chapter 14',
        title: 'Ajax (Dịch bài viết trực tiếp không cần tải lại trang)',
        summaryVi:
          'Tự động nhận diện ngôn ngữ bài viết (`langdetect`), tạo API `/translate` gọi dịch vụ dịch thuật và dùng JavaScript `fetch()` cập nhật văn bản ngay trên trang.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xiv-ajax',
      },
      {
        chapter: 'Chapter 15',
        title: 'A Better Application Structure (Blueprints & Application Factory)',
        summaryVi:
          'Bước ngoặt kiến trúc: chia dự án thành các `Blueprint` (`errors/`, `auth/`, `main/`) và dùng hàm `create_app(config_class)` giúp dễ dàng khởi tạo nhiều môi trường test/prod.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xv-a-better-application-structure',
      },
      {
        chapter: 'Chapter 16',
        title: 'Full-Text Search (Tìm kiếm toàn văn với Elasticsearch)',
        summaryVi:
          'Đồng bộ tự động dữ liệu bài viết từ SQLAlchemy sang Elasticsearch mỗi khi thêm/sửa/xóa để tìm kiếm từ khóa cực nhanh.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xvi-full-text-search',
      },
      {
        chapter: 'Chapter 17',
        title: 'Deployment on Linux (Ubuntu, Gunicorn, Nginx, Supervisor & SSL)',
        summaryVi:
          'Triển khai thực tế lên máy chủ Linux với Gunicorn WSGI server, Supervisor tự khởi động lại khi crash và Nginx làm Reverse Proxy có chứng chỉ HTTPS.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xvii-deployment-on-linux',
      },
      {
        chapter: 'Chapter 18',
        title: 'Deployment on Heroku (PaaS Cloud Deployment)',
        summaryVi:
          'Cấu hình `Procfile`, gắn Postgres & Redis managed trên nền tảng đám mây PaaS và đẩy log ra stdout.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xviii-deployment-on-heroku',
      },
      {
        chapter: 'Chapter 19',
        title: 'Deployment on Docker Containers',
        summaryVi:
          'Viết `Dockerfile` và `boot.sh`, đóng gói ứng dụng thành container image chạy đồng bộ cùng MySQL/Postgres, Redis và Elasticsearch.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xix-deployment-on-docker-containers',
      },
      {
        chapter: 'Chapter 20',
        title: 'Some JavaScript Magic (Hover Popover xem nhanh hồ sơ)',
        summaryVi:
          'Khi rê chuột lên tên người dùng bất kỳ, trình duyệt gọi AJAX tải thông tin tóm tắt và hiển thị khung Popover nổi ngay tại chỗ.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xx-some-javascript-magic',
      },
      {
        chapter: 'Chapter 21',
        title: 'User Notifications (Hệ thống Tin nhắn riêng & Thông báo)',
        summaryVi:
          'Xây dựng tính năng nhắn tin cá nhân giữa các user và cập nhật huy hiệu số tin nhắn chưa đọc (badge) theo thời gian thực mà không cần F5.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xxi-user-notifications',
      },
      {
        chapter: 'Chapter 22',
        title: 'Background Jobs (Hàng đợi tác vụ nền với Redis Queue - RQ)',
        summaryVi:
          'Tích hợp Redis và `rq` để chạy ngầm tác vụ xuất toàn bộ bài viết của user ra file rồi gửi email kèm thanh tiến trình % trực tiếp trên web.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xxii-background-jobs',
      },
      {
        chapter: 'Chapter 23',
        title: 'Application Programming Interfaces (Xây dựng REST API & Token Auth)',
        summaryVi:
          'Tạo Blueprint `app/api/` cung cấp RESTful JSON API đầy đủ cho phép ứng dụng Mobile hoặc CLI bên thứ ba đăng nhập lấy Bearer Token và thao tác dữ liệu.',
        url: 'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xxiii-application-programming-interfaces-apis',
      },
    ],
    ideFiles: [
      {
        path: 'config.py',
        roleDescription:
          '[Chapter 3 & 4] File cấu hình trung tâm: đọc SECRET_KEY, DATABASE_URL, cấu hình Email và Redis từ biến môi trường.',
        keyPatterns: ['os.environ.get', 'SQLAlchemy URI', 'Config Class'],
        language: 'python',
        code: `"""[Chapter 3, 4, 10, 22] Cấu hình trung tâm của ứng dụng Flask Microblog."""

import os

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    # SECRET_KEY dùng đểFlask-WTF ký CSRF token chống giả mạo form (Chapter 3)
    SECRET_KEY = os.environ.get("SECRET_KEY") or "ban-nen-doi-khoa-bi-mat-nay"

    # DATABASE_URL: Nếu không đặt biến môi trường thì mặc định dùng file SQLite app.db (Chapter 4)
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or (
        "sqlite:///" + os.path.join(basedir, "app.db")
    )

    # Số bài viết hiển thị trên mỗi trang khi phân trang (Chapter 9)
    POSTS_PER_PAGE = 10

    # Cấu hình Redis URL phục vụ hàng đợi tác vụ nền RQ (Chapter 22)
    REDIS_URL = os.environ.get("REDIS_URL") or "redis://"`,
      },
      {
        path: 'app/__init__.py',
        roleDescription:
          '[Chapter 15] Mô hình Application Factory (create_app): khởi tạo Flask, gắn Database, LoginManager và đăng ký các Blueprint (auth, main, api).',
        keyPatterns: ['create_app() Factory', 'SQLAlchemy', 'LoginManager', 'Blueprints'],
        language: 'python',
        code: `"""[Chapter 15] Khởi tạo ứng dụng theo mẫu Application Factory & Blueprints."""

from flask import Flask
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from config import Config

# Khởi tạo các extension ở cấp module (chưa gắn chặt vào 1 app cụ thể)
db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
# Nếu người dùng chưa đăng nhập mà vào trang @login_required -> chuyển hướng tới auth.login
login.login_view = "auth.login"


def create_app(config_class=Config) -> Flask:
    """Hàm Factory tạo instance Flask — giúp dễ dàng tạo app riêng khi chạy Unit Test."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Gắn các thư viện mở rộng vào ứng dụng
    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)

    # Đăng ký từng phân khu (Blueprint) độc lập: Auth, Main và REST API (Ch.15 & Ch.23)
    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")

    from app.main import bp as main_bp
    app.register_blueprint(main_bp)

    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    return app`,
      },
      {
        path: 'app/models.py',
        roleDescription:
          '[Chapter 4, 5, 8] Định nghĩa bảng User và Post bằng SQLAlchemy ORM, tích hợp băm mật khẩu (Werkzeug) và quan hệ Follow Nhiều-Nhiều.',
        keyPatterns: ['UserMixin', 'Password Hashing', 'Many-to-Many Followers'],
        language: 'python',
        code: `"""[Chapter 4, 5, 8] Định nghĩa các bảng Database (User, Post, Followers)."""

from datetime import datetime, timezone
from hashlib import md5
# UserMixin cung cấp sẵn các thuộc tính is_authenticated, is_active cho Flask-Login
from flask_login import UserMixin
# generate_password_hash băm mật khẩu 1 chiều an toàn; check_password_hash kiểm tra lúc đăng nhập
from werkzeug.security import check_password_hash, generate_password_hash
from app import db

# [Chapter 8] Bảng trung gian biểu diễn quan hệ Nhiều-Nhiều: User A theo dõi User B
followers = db.Table(
    "followers",
    db.Column("follower_id", db.Integer, db.ForeignKey("user.id"), primary_key=True),
    db.Column("followed_id", db.Integer, db.ForeignKey("user.id"), primary_key=True),
)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    about_me = db.Column(db.String(140))
    last_seen = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password: str) -> None:
        """[Chapter 5] Băm mật khẩu trước khi lưu vào DB."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """[Chapter 5] Kiểm tra mật khẩu người dùng nhập có khớp bản băm không."""
        return check_password_hash(self.password_hash or "", password)

    def avatar(self, size: int = 128) -> str:
        """[Chapter 6] Sinh link ảnh đại diện tự động từ dịch vụ Gravatar theo MD5 email."""
        digest = md5(self.email.lower().encode("utf-8")).hexdigest()
        return f"https://www.gravatar.com/avatar/{digest}?d=identicon&s={size}"


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(140), nullable=False)
    timestamp = db.Column(
        db.DateTime, index=True, default=lambda: datetime.now(timezone.utc)
    )
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), index=True)`,
      },
      {
        path: 'app/main/routes.py',
        roleDescription:
          '[Chapter 5, 6, 9] Các route chính của ứng dụng: trang bảng tin có phân trang, đăng bài viết mới và xem trang hồ sơ cá nhân.',
        keyPatterns: ['@login_required', 'db.paginate()', 'Post-Redirect-Get'],
        language: 'python',
        code: `"""[Chapter 5, 6, 9] Các đường dẫn chính của Microblog (Bảng tin & Trang cá nhân)."""

from datetime import datetime, timezone
from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required
from app import db
from app.models import Post, User

bp = Blueprint("main", __name__)


@bp.before_app_request
def before_request() -> None:
    """[Chapter 6] Tự động cập nhật thời điểm hoạt động cuối mỗi khi user mở trang."""
    if current_user.is_authenticated:
        current_user.last_seen = datetime.now(timezone.utc)
        db.session.commit()


@bp.route("/", methods=["GET", "POST"])
@bp.route("/index", methods=["GET", "POST"])
@login_required  # [Chapter 5] Chặn người chưa đăng nhập, tự chuyển về trang /auth/login
def index():
    """[Chapter 9] Hiển thị form đăng bài & danh sách bài viết có phân trang."""
    page = request.args.get("page", 1, type=int)
    posts = db.paginate(
        db.select(Post).order_by(Post.timestamp.desc()),
        page=page,
        per_page=10,
        error_out=False,
    )
    return render_template("index.html", title="Bảng tin", posts=posts.items)`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-flask-migrate',
        label: 'Chạy DB Migration (Ch.4)',
        kind: 'run',
        command: 'uv run flask db upgrade',
        description: 'Áp dụng lịch sử Alembic migration để tạo bảng User, Post, followers',
        stdout: `INFO  [alembic.runtime.migration] Context impl SQLiteImpl.
INFO  [alembic.runtime.migration] Will assume non-transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 780739b227a7, users table
INFO  [alembic.runtime.migration] Running upgrade 780739b227a7 -> d95892a66d20, posts and followers`,
      },
      {
        id: 'cmd-rw-flask-tests',
        label: 'Chạy Unit Tests (Ch.8)',
        kind: 'pytest',
        command: 'uv run pytest tests.py -v',
        description: 'Kiểm thử băm mật khẩu, avatar Gravatar và logic Follow/Unfollow',
        stdout: `============================= test session starts ==============================
collected 4 items

tests.py::UserModelCase::test_password_hashing PASSED                    [ 25%]
tests.py::UserModelCase::test_avatar PASSED                              [ 50%]
tests.py::UserModelCase::test_follow PASSED                              [ 75%]
tests.py::UserModelCase::test_follow_posts PASSED                        [100%]

============================== 4 passed in 0.12s ===============================`,
      },
    ],
  },
  {
    id: 'rw-cookiecutter-django',
    groupId: 'fullstack-web',
    title: 'Cookiecutter Django (Production Full-Stack Standard)',
    repoName: 'cookiecutter/cookiecutter-django',
    url: 'https://github.com/cookiecutter/cookiecutter-django',
    kind: 'production-template',
    complexity: 'pro',
    scaleLabel: 'Full-Stack Production App',
    summary:
      'Chuẩn mực lâu năm cho dự án Django thực tế: custom user model, tách settings theo môi trường, Celery + Redis, Docker và CI/CD.',
    purpose:
      'Cho người học thấy một web app hoàn chỉnh (có giao diện, admin, đăng nhập, gửi email nền, lưu ảnh) khi đưa lên production cần những mảnh ghép gì.',
    howItWorks: [
      'Browser gửi request -> Nginx/Gunicorn chuyển vào Django URLs & Views.',
      'Settings được tách làm base.py (chung), local.py (dev), production.py (chạy thật, bảo mật cao).',
      'Tác vụ nặng (gửi mail xác nhận) được đẩy sang Celery Worker chạy ngầm qua Redis.',
      'File tĩnh/ảnh upload được đẩy lên Cloud Storage (AWS S3) thay vì lưu cứng trên server.',
    ],
    directoryTree: `my_project/
├── config/
│   ├── settings/        # Tách biệt base.py, local.py, production.py
│   └── urls.py          # Bảng định tuyến URL gốc của toàn trang
├── my_project/
│   ├── users/           # Custom User Model (nên tạo ngay từ đầu dự án!)
│   ├── templates/       # Giao diện HTML (Django Templates)
│   └── static/          # CSS, JS, hình ảnh
├── compose/             # Cấu hình Docker cho local & production
└── .github/workflows/   # CI/CD tự động chạy test khi push code`,
    libraries: [
      {
        name: 'Django + django-environ',
        role: 'Full-stack Web Framework & Cấu hình 12-Factor App',
        whyNeeded:
          'Có sẵn ORM, trang Admin quản trị, hệ thống Auth/Session và đọc biến môi trường an toàn.',
      },
      {
        name: 'django-allauth',
        role: 'Đăng ký, đăng nhập, quên mật khẩu, OAuth',
        whyNeeded:
          'Không phải tự code lại luồng xác thực email, Google/GitHub login dễ sai sót bảo mật.',
      },
      {
        name: 'Celery + Sentry',
        role: 'Chạy tác vụ ngầm & Theo dõi lỗi production',
        whyNeeded:
          'Celery gửi email không làm chậm web; Sentry báo ngay lỗi về Slack/Email khi user gặp bug.',
      },
    ],
    readingFocus:
      'Mở thư mục config/settings/ và app users/ để hiểu tại sao dự án Django thật luôn tách settings và custom User ngay ngày đầu.',
    tags: ['Django', 'Full-stack', 'Celery', 'Docker'],
    chapters: [
      {
        chapter: 'Mảnh ghép 1',
        title: 'Split Settings (base.py, local.py, production.py)',
        summaryVi:
          'Dùng `django-environ` đọc biến môi trường. Ở local bật DEBUG=True và trang bắt lỗi chi tiết; lên production bắt buộc bật HTTPS, HSTS, Secure Cookies.',
      },
      {
        chapter: 'Mảnh ghép 2',
        title: 'Custom User Model (AUTH_USER_MODEL = "users.User")',
        summaryVi:
          'Django khuyên luôn tạo class User riêng kế thừa AbstractUser ngay từ commit đầu tiên để dễ dàng đổi đăng nhập bằng Email thay vì Username.',
      },
      {
        chapter: 'Mảnh ghép 3',
        title: 'Docker Compose & Celery Background Worker',
        summaryVi:
          'Đóng gói đồng bộ các container: django, postgres, redis, celeryworker, celerybeat và traefik/nginx.',
      },
    ],
    ideFiles: [
      {
        path: 'config/settings/base.py',
        roleDescription:
          'File cấu hình gốc dùng chung cho mọi môi trường. Dùng django-environ để đọc biến môi trường theo chuẩn 12-Factor App.',
        keyPatterns: ['django-environ', 'AUTH_USER_MODEL', 'Split Settings'],
        language: 'python',
        code: `"""Cấu hình nền tảng (base.py) được kế thừa bởi cả local.py và production.py."""

from pathlib import Path
# django-environ giúp đọc biến môi trường từ hệ điều hành hoặc file .env và ép kiểu tự động
import environ

BASE_DIR = Path(__file__).resolve(strict=True).parent.parent.parent
env = environ.Env()

# Luôn trỏ AUTH_USER_MODEL về Custom User Model của dự án ngay từ đầu
AUTH_USER_MODEL = "users.User"

# Kết nối Database đọc tự động từ biến DATABASE_URL (vd: postgres://user:pass@postgres:5432/db)
DATABASES = {"default": env.db("DATABASE_URL", default="postgres:///my_project")}
DATABASES["default"]["ATOMIC_REQUESTS"] = True  # Tự động bọc mỗi HTTP request trong 1 DB Transaction

# Cấu hình Celery dùng Redis làm trạm trung chuyển tin nhắn (Broker)
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://redis:6379/0")
CELERY_TIMEZONE = "UTC"`,
      },
      {
        path: 'my_project/users/models.py',
        roleDescription:
          'Định nghĩa Custom User Model kế thừa AbstractUser, dùng trường name hợp nhất thay vì first_name/last_name cứng nhắc.',
        keyPatterns: ['AbstractUser', 'Custom User Model', 'get_absolute_url'],
        language: 'python',
        code: `"""Custom User Model chuẩn của Cookiecutter Django."""

from django.contrib.auth.models import AbstractUser
from django.db.models import CharField
from django.urls import reverse
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Mô hình người dùng tùy chỉnh cho dự án."""

    # Gộp họ tên thành 1 trường name linh hoạt cho quốc tế hóa (thay vì tách cứng first/last)
    name = CharField(_("Name of User"), blank=True, max_length=255)
    first_name = None  # type: ignore[assignment]
    last_name = None  # type: ignore[assignment]

    def get_absolute_url(self) -> str:
        """Trả về đường dẫn trang hồ sơ của user."""
        return reverse("users:detail", kwargs={"username": self.username})`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-django-check',
        label: 'Kiểm tra hệ thống Django',
        kind: 'run',
        command: 'uv run python manage.py check --deploy',
        description: 'Kiểm tra các tiêu chuẩn bảo mật trước khi đưa lên production',
        stdout: `System check identified no issues (0 silenced).
[OK] SECURE_SSL_REDIRECT = True
[OK] SESSION_COOKIE_SECURE = True
[OK] CSRF_COOKIE_SECURE = True
[OK] AUTH_USER_MODEL = 'users.User'`,
      },
    ],
  },
  {
    id: 'rw-pbl-django-tdd',
    groupId: 'fullstack-web',
    title: 'Build a Todo List with Django and TDD (Obey the Testing Goat)',
    repoName: 'hjwp/book-example',
    url: 'https://www.obeythetestinggoat.com/pages/book.html',
    kind: 'pbl-tutorial',
    complexity: 'advanced',
    scaleLabel: 'Web App + Test-Driven Dev',
    summary:
      'Cuốn sách/tutorial mở nổi tiếng trong project-based-learning: xây dựng ứng dụng Todo bằng Django theo phương pháp Test-Driven Development (viết test trước, viết code sau).',
    purpose:
      'Rèn thói quen kỹ sư chuyên nghiệp: dùng Functional Test (Selenium) kiểm tra từ góc nhìn người dùng và Unit Test kiểm tra từng View/Model.',
    howItWorks: [
      'Bước 1 (Red): Viết một bài test mô tả tính năng mong muốn -> chạy test thấy báo lỗi (vì chưa code).',
      'Bước 2 (Green): Viết code Django (View/Model/Template) vừa đủ để bài test chạy xanh.',
      'Bước 3 (Refactor): Dọn dẹp code cho sạch sẽ mà test vẫn xanh.',
    ],
    directoryTree: `superlists/
├── lists/
│   ├── models.py        # Bảng List & Item lưu công việc cần làm
│   ├── views.py         # Xử lý hiển thị & thêm đầu việc mới
│   ├── forms.py         # Kiểm tra không cho thêm việc rỗng hoặc trùng lặp
│   └── tests/           # Chia nhỏ test_views.py, test_models.py, test_forms.py
└── functional_tests/    # Test Selenium mở trình duyệt bấm thật như người dùng`,
    libraries: [
      {
        name: 'Django TestCase',
        role: 'Công cụ chạy Unit Test tích hợp sẵn',
        whyNeeded:
          'Tự động tạo DB tạm thời để test nhanh và xóa sạch sau mỗi bài test.',
      },
      {
        name: 'Selenium WebDriver',
        role: 'Kiểm thử giao diện trình duyệt tự động',
        whyNeeded:
          'Mở trình duyệt thật, gõ chữ vào ô input, bấm Enter và kiểm tra xem item mới có hiện lên bảng không.',
      },
    ],
    readingFocus:
      'Đọc hai file trong IDE để thấy chu trình "Vòng lặp TDD kép": Functional Test ở ngoài dẫn đường cho Unit Test ở trong.',
    tags: ['PBL', 'Django', 'TDD', 'Testing'],
    chapters: [
      {
        chapter: 'Phần 1 (Ch.1–7)',
        title: 'Nhập môn TDD, Functional Tests vs Unit Tests & Xây MVP',
        summaryVi:
          'Viết bài test Selenium đầu tiên, tạo Django project, học chu trình Red-Green-Refactor, lưu Item vào SQLite và tách URL cho từng danh sách công việc.',
        url: 'https://www.obeythetestinggoat.com/pages/book.html',
      },
      {
        chapter: 'Phần 2 (Ch.8–16)',
        title: 'Làm đẹp với Bootstrap, Deploy Staging, Form Validation & JS',
        summaryVi:
          'Kiểm thử giao diện CSS, tự động hóa deploy lên server với Ansible/Docker, dùng Django Forms chặn dữ liệu rỗng/trùng và viết test cho JavaScript.',
        url: 'https://www.obeythetestinggoat.com/pages/book.html',
      },
      {
        chapter: 'Phần 3 (Ch.17–26)',
        title: 'Mocking, Custom Auth, Outside-In TDD & Continuous Integration',
        summaryVi:
          'Sử dụng `unittest.mock` để cô lập dịch vụ gửi email đăng nhập, quản lý danh sách theo chủ sở hữu và dựng CI server.',
        url: 'https://www.obeythetestinggoat.com/pages/book.html',
      },
    ],
    ideFiles: [
      {
        path: 'lists/tests/test_views.py',
        roleDescription:
          'Unit Test viết TRƯỚC khi viết code xử lý: kiểm tra gửi POST tạo công việc mới phải lưu vào DB và chuyển hướng (302) đúng.',
        keyPatterns: ['TestCase', 'self.client.post', 'assertRedirects'],
        language: 'python',
        code: `"""[TDD Bước 1 - Red] Viết Unit Test kiểm tra View trước khi viết logic."""

from django.test import TestCase
from lists.models import Item, List


class NewListViewTest(TestCase):
    def test_can_save_a_POST_request(self) -> None:
        """Khi người dùng gửi form thêm việc mới, dữ liệu phải được lưu vào bảng Item."""
        self.client.post("/lists/new", data={"item_text": "Mua sữa tươi"})

        self.assertEqual(Item.objects.count(), 1)
        new_item = Item.objects.first()
        assert new_item is not None
        self.assertEqual(new_item.text, "Mua sữa tươi")

    def test_redirects_after_POST(self) -> None:
        """Sau khi POST thành công, luôn Redirect (302) về trang danh sách để tránh gửi trùng."""
        response = self.client.post("/lists/new", data={"item_text": "Học TDD với Django"})
        created_list = List.objects.first()
        assert created_list is not None
        self.assertRedirects(response, f"/lists/{created_list.id}/")`,
      },
      {
        path: 'lists/views.py',
        roleDescription:
          '[TDD Bước 2 - Green] Viết code View và Model vừa đủ gọn để toàn bộ bài Unit Test ở trên chạy xanh.',
        keyPatterns: ['Post/Redirect/Get', 'Django ORM create()'],
        language: 'python',
        code: `"""[TDD Bước 2 - Green] Code xử lý View thỏa mãn các bài test trong test_views.py."""

from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from lists.models import Item, List


def view_list(request: HttpRequest, list_id: int) -> HttpResponse:
    """Hiển thị toàn bộ các đầu việc thuộc một danh sách."""
    our_list = List.objects.get(id=list_id)
    return render(request, "list.html", {"list": our_list})


def new_list(request: HttpRequest) -> HttpResponse:
    """Tạo danh sách mới kèm đầu việc đầu tiên rồi redirect sang trang xem danh sách."""
    nulist = List.objects.create()
    Item.objects.create(text=request.POST["item_text"], list=nulist)
    return redirect(f"/lists/{nulist.id}/")`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-tdd-unit',
        label: 'Chạy Django Unit Tests',
        kind: 'pytest',
        command: 'uv run python manage.py test lists',
        description: 'Chạy bộ Unit Test kiểm tra View & Model của app lists',
        stdout: `Found 2 test(s).
Creating test database for alias 'default'...
System check identified no issues (0 silenced).
..
----------------------------------------------------------------------
Ran 2 tests in 0.018s

OK
Destroying test database for alias 'default'...`,
      },
    ],
  },
];

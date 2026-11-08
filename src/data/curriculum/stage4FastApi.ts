import { LessonTopic } from '@/types/curriculum.types';

export const STAGE_4_LESSONS: LessonTopic[] = [
  {
    id: 's4-fastapi-di-pydantic',
    stageId: 'stage-4',
    level: 'pro',
    order: 8,
    title: '4.1. FastAPI Core, Hệ thống Dependency Injection (Depends) & Pydantic v2 Validation',
    shortDescription:
      'Xây dựng RESTful API hiệu năng cao, tự động sinh OpenAPI Swagger, kiểm soát dữ liệu chặt chẽ với Pydantic v2 và tiêm phụ thuộc bằng Depends().',
    estimatedMinutes: 45,
    theoryParagraphs: [
      '**FastAPI** là chuẩn mực hiện đại để xây dựng Backend API bằng Python. Điểm sáng giá nhất của FastAPI là nó tận dụng trực tiếp **Type Hints** và **Pydantic v2** để thực hiện cùng lúc 3 việc mà không cần viết lặp lại code: (1) Parse & Validate dữ liệu từ Path, Query, Header, JSON Body; (2) Tuần tự hóa và lọc dữ liệu trả về qua `response_model` (ngăn rò rỉ `password_hash`); và (3) Tự động sinh tài liệu tương tác OpenAPI (`/docs`).',
      'Hệ thống **Dependency Injection (`Depends`)** của FastAPI vừa cực kỳ đơn giản vừa mạnh mẽ: một Dependency chỉ đơn giản là một hàm (hoặc Callable class) có thể nhận các tham số giống hệt một API endpoint. Khi hàm Dependency sử dụng `yield` (như `get_async_session`), FastAPI tự động chạy phần trước `yield` trước khi vào route handler và chạy phần sau `yield` (đóng kết nối DB) ngay khi kết thúc request.',
      'Trong **Pydantic v2**, lõi kiểm tra dữ liệu (`pydantic-core`) được viết hoàn toàn bằng **Rust**, nhanh gấp 5–50 lần Pydantic v1. Bạn sử dụng `@field_validator` để kiểm tra từng trường riêng lẻ và `@model_validator(mode="after")` để kiểm tra chéo nhiều trường (ví dụ: `end_date` phải lớn hơn `start_date`).',
    ],
    analogy: {
      title: 'Trạm Kiểm soát Hải quan Tự động (Pydantic v2) & Dây chuyền Tiếp tế (Depends)',
      realWorldScenario:
        'Hình dung một Request HTTP bay từ Internet vào hệ thống Backend FastAPI của bạn:',
      mappingPoints: [
        {
          realWorld: 'Cổng hải quan tự động bằng tia X ở biên giới (`Pydantic Schema`)',
          pythonEquivalent: '`payload: StudentCreate` trong tham số hàm Route',
          explanation: 'Dữ liệu JSON thô đi qua cổng được quét bằng lõi Rust: sai email hay thiếu tuổi bị chặn ngay tại cửa với mã `422 Unprocessable Entity`, còn hợp lệ thì được đóng gói thành Object sạch sẽ trao cho hàm xử lý.',
        },
        {
          realWorld: 'Trợ lý hậu cần chuẩn bị sẵn hồ sơ người dùng và kết nối DB (`Depends`)',
          pythonEquivalent: '`current_user: User = Depends(get_current_user)`',
          explanation: 'Bác sĩ phẫu thuật (Route Handler) chỉ việc chìa tay nhận đúng dụng cụ đã khử trùng sẵn. Đặc biệt khi chạy Unit Test, bạn có thể tráo dụng cụ giả (`app.dependency_overrides`) chỉ bằng 1 dòng lệnh!',
        },
      ],
      mentalModelTip:
        'Luôn tách biệt rõ ràng: **Pydantic Schema** (`schemas/student.py`) dùng cho dữ liệu giao tiếp API (DTO), còn **SQLAlchemy Model** (`models/student.py`) dùng để ánh xạ bảng Database!',
    },
    codeExamples: [
      {
        id: 'ex-s4-1-fastapi',
        title: 'Pydantic v2 Validator & FastAPI Dependency Injection chuẩn Clean Architecture',
        description: 'Kết hợp kiểm tra dữ liệu đầu vào, lọc dữ liệu đầu ra và tiêm phụ thuộc.',
        code: `from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

router = APIRouter(prefix="/students", tags=["Students"])

# 1. Tầng DTO / Schema với Pydantic v2
class StudentCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    gpa: float = Field(ge=0.0, le=4.0)

    @field_validator("full_name")
    @classmethod
    def normalize_name(cls, v: str) -> str:
        return " ".join(v.strip().split()).title()

class StudentResponse(StudentCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)  # Đọc trực tiếp từ ORM Entity!

# 2. Dependency Injection kiểm tra API Key hoặc JWT Token
async def verify_admin_token(x_token: str = "secret-admin-token") -> str:
    if x_token != "secret-admin-token":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return x_token

# 3. Route Handler gọn gàng, tự sinh OpenAPI docs
@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def register_student(
    payload: StudentCreate,
    _admin: str = Depends(verify_admin_token),
) -> dict:
    # Giả lập trả về ORM entity (có cả trường nhạy cảm internal_secret)
    return {
        "id": 101,
        "email": payload.email,
        "full_name": payload.full_name,
        "gpa": payload.gpa,
        "internal_secret": "sẽ bị response_model tự động lọc bỏ!",
    }`,
        output: `{"id": 101, "email": "an@py.dev", "full_name": "Nguyễn Văn An", "gpa": 3.8}`,
        annotations: [
          { line: 12, explanation: '`@field_validator` tự động chuẩn hóa khoảng trắng và viết hoa chữ cái đầu của `full_name`.' },
          { line: 19, explanation: '`ConfigDict(from_attributes=True)` (thay cho `orm_mode = True` của v1) cho phép chuyển thẳng đối tượng SQLAlchemy sang JSON.' },
          { line: 28, explanation: '`response_model=StudentResponse` đảm bảo trường nhạy cảm `internal_secret` ở dòng 39 không bao giờ bị lộ ra ngoài response.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Ghi đè Dependency (Dependency Override) khi viết Integration Test',
        scenario: 'Chạy test các API yêu cầu đăng nhập JWT hoặc gọi cổng thanh toán bên thứ ba mà không cần token thật.',
        whyPythonFits: 'Chỉ cần gán `app.dependency_overrides[get_current_user] = lambda: fake_admin_user` là toàn bộ các API dùng `Depends(get_current_user)` tự động nhận user test!',
      },
    ],
    tipsAndBestPractices: [
      'Luôn tách các schema thành `StudentCreate` (dữ liệu nhận vào), `StudentUpdate` (các trường tùy chọn `None`), và `StudentResponse` (dữ liệu trả ra có `id`, `created_at` nhưng tuyệt đối không có `hashed_password`).',
      'Sử dụng `Annotated[AsyncSession, Depends(get_db)]` (Python 3.9+) để tạo type alias `DbSessionDep` dùng lại khắp các router cực gọn.',
    ],
    commonIssues: [
      {
        id: 'issue-s4-pydantic-v1-v2',
        title: 'Bẫy dùng cú pháp cũ của Pydantic v1 trong dự án Pydantic v2',
        severity: 'warning',
        symptom: 'Cảnh báo `PydanticDeprecatedSince20` khi gọi `.dict()`, `.parse_obj()` hoặc `class Config: orm_mode = True`.',
        whyItHappens:
          'Pydantic v2 đã tái cấu trúc toàn bộ phương thức cốt lõi dưới tiền tố `model_*` để tránh trùng tên với các trường dữ liệu của người dùng (ví dụ bảng có cột tên là `dict` hoặc `json`).',
        wrongCode: `# Cú pháp cũ Pydantic v1 (Đã lỗi thời):\ndata = payload.dict()\nclass UserOut(BaseModel):\n    class Config:\n        orm_mode = True`,
        rightCode: `# Cú pháp chuẩn Pydantic v2:\ndata = payload.model_dump()\nclass UserOut(BaseModel):\n    model_config = ConfigDict(from_attributes=True)`,
        fixExplanation: 'Dùng `.model_dump()` thay cho `.dict()`, `.model_dump_json()` thay cho `.json()`, và `ConfigDict(from_attributes=True)` thay cho `orm_mode`.',
      },
    ],
    jsComparison: [
      {
        concept: 'Kiến trúc Controller + DTO + Dependency Injection',
        jsTsWay: 'NestJS (@Controller, @Post, @Body, ValidationPipe + class-validator / Zod + @Injectable)',
        pythonWay: 'FastAPI (APIRouter, @router.post, Pydantic BaseModel + Depends)',
        jsCode: `@Post()\ncreate(@Body() dto: CreateStudentDto) {\n  return this.service.create(dto);\n}`,
        pythonCode: `@router.post("/", response_model=StudentResponse)\nasync def create(dto: StudentCreate, svc = Depends(get_service)):\n    return await svc.create(dto)`,
        keyDifference: 'FastAPI không cần tạo Module đăng ký Provider phức tạp như NestJS IoC Container — hàm `Depends()` kết nối trực tiếp và dễ dàng override khi test.',
      },
    ],
    relatedTermIds: ['eco-fastapi', 'eco-pydantic', 'dunder-call', 'kw-yield'],
    relatedLessonIds: ['s4-sqlalchemy-clean-arch', 's5-asyncio-gil-concurrency'],
    relatedExerciseIds: ['ex-s4-pydantic-validator'],
  },
  {
    id: 's4-sqlalchemy-clean-arch',
    stageId: 'stage-4',
    level: 'pro',
    order: 9,
    title: '4.2. SQLAlchemy 2.0 Async, Alembic Migration & Kiến trúc Phân tầng Clean Architecture',
    shortDescription:
      'Làm chủ cú pháp Mapped[T] của SQLAlchemy 2.0, chống lỗi N+1 Query với selectinload và kết nối hoàn chỉnh 4 tầng Model → Schema → Repository → Router.',
    estimatedMinutes: 45,
    theoryParagraphs: [
      '**SQLAlchemy 2.0** đã lột xác hoàn toàn với cú pháp khai báo kiểu mạnh (`Mapped[int]`, `mapped_column()`) tương thích 100% với Pyright/IDE và hỗ trợ bất đồng bộ toàn diện thông qua `AsyncEngine` và `AsyncSession` (kết hợp driver `asyncpg` siêu nhanh cho PostgreSQL).',
      'Khi truy vấn các bảng có quan hệ (`1-n` hoặc `n-n`, ví dụ một `Student` đăng ký nhiều `Course`), kẻ thù số một về hiệu năng là lỗi **N+1 Query** (1 câu lệnh lấy 50 sinh viên + 50 câu lệnh lẻ tẻ lấy khóa học của từng người). Đặc biệt trong chế độ Async của SQLAlchemy 2.0, việc truy cập thuộc tính quan hệ chưa nạp trước sẽ ném lỗi `MissingGreenlet`. Giải pháp chuẩn là luôn nạp chủ động (Eager Loading) bằng `select(Student).options(selectinload(Student.courses))`.',
      'Để dự án dễ bảo trì và mở rộng, chúng ta áp dụng **Layered / Clean Architecture** gồm 4 tầng rõ rệt: **Model** (SQLAlchemy DB Entities) → **Schema** (Pydantic DTO) → **Repository** (Đóng gói truy vấn SQL) → **Service** (Logic nghiệp vụ) → **API Router** (Giao vận HTTP).',
    ],
    analogy: {
      title: 'Kiến trúc 4 Tầng Nhà hàng Chuẩn 5 Sao & Chống chạy lắt nhắt N+1 chuyến (selectinload)',
      realWorldScenario:
        'Tại sao không viết toàn bộ cả câu lệnh SQL lẫn kiểm tra HTTP vào chung một file `main.py`?',
      mappingPoints: [
        {
          realWorld: 'Bàn tiếp tân nhận phiếu gọi món (`API Router` + `Pydantic Schema`)',
          pythonEquivalent: '`src/app/api/v1/students.py` & `schemas/student.py`',
          explanation: 'Chỉ lo việc giao tiếp HTTP, kiểm tra định dạng phiếu gọi món và trả mã trạng thái `200/201/404`.',
        },
        {
          realWorld: 'Bếp trưởng điều phối công thức (`Service Layer`)',
          pythonEquivalent: '`src/app/services/student_service.py`',
          explanation: 'Chứa quy tắc nghiệp vụ thuần túy (VD: Kiểm tra sinh viên đủ điều kiện học bổng, gửi email chào mừng).',
        },
        {
          realWorld: 'Thủ kho chuyên xuất/nhập nguyên liệu (`Repository Layer` + `SQLAlchemy Model`)',
          pythonEquivalent: '`src/app/repositories/student_repo.py` & `models/student.py`',
          explanation: 'Chỉ tập trung viết câu lệnh `select()`, `session.add()` tối ưu nhất với PostgreSQL.',
        },
        {
          realWorld: 'Đi chợ gom 1 chuyến xe tải (`selectinload`) thay vì chạy xe máy 100 chuyến lẻ (`N+1 Query`)',
          pythonEquivalent: '`select(Student).options(selectinload(Student.enrollments))`',
          explanation: 'Chỉ dùng đúng 2 câu truy vấn SQL (`SELECT ... WHERE student_id IN (...)`) thay vì N+1 câu truy vấn.',
        },
      ],
      mentalModelTip:
        'Bạn có thể khám phá trực tiếp sơ đồ cây thư mục `src-layout` và code kết nối 4 tầng ở mục **Tài liệu & Chuyên đề PDF -> Clean Architecture** trên thanh điều hướng!',
    },
    codeExamples: [
      {
        id: 'ex-s4-2-sqla',
        title: 'SQLAlchemy 2.0 Mapped Entity & Async Repository chống lỗi N+1 Query',
        description: 'Mẫu code chuẩn công nghiệp trích xuất trực tiếp từ Chuyên đề 3 của Cẩm nang.',
        code: `from sqlalchemy import String, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, selectinload

# 1. TẦNG MODEL (src/app/models/student.py)
class Base(DeclarativeBase):
    pass

class Student(Base):
    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))

# 2. TẦNG REPOSITORY (src/app/repositories/student_repo.py)
class StudentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_email(self, email: str) -> Student | None:
        stmt = select(Student).where(Student.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, email: str, full_name: str) -> Student:
        student = Student(email=email, full_name=full_name)
        self.session.add(student)
        await self.session.commit()
        await self.session.refresh(student)
        return student`,
        output: `Student(id=1, email='an@py.dev', full_name='An Nguyễn')`,
        annotations: [
          { line: 11, explanation: '`Mapped[int]` vừa khai báo cột `INTEGER NOT NULL` cho SQL, vừa báo kiểu `int` chính xác cho Pyright.' },
          { line: 21, explanation: 'Trong SQLAlchemy 2.0, luôn dùng hàm `select(Model)` hiện đại thay vì `session.query(Model)` cũ của bản 1.x.' },
          { line: 29, explanation: '`await self.session.refresh(student)` nạp lại `id` tự tăng từ Database sau khi `commit()`.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Quản lý phiên bản cấu trúc Database tự động với Alembic',
        scenario: 'Khi thêm cột `phone_number` vào model `Student`, tự động dò sự khác biệt và sinh file migration nâng cấp/hạ cấp DB.',
        whyPythonFits: 'Lệnh `alembic revision --autogenerate -m "add phone"` đối chiếu trực tiếp `Base.metadata` của SQLAlchemy với PostgreSQL thực tế.',
      },
    ],
    tipsAndBestPractices: [
      'Không bao giờ gọi `session.query()` (cú pháp Legacy 1.x) trong dự án mới — hãy dùng `await session.execute(select(...))` hoặc `await session.scalars(select(...))`.',
      'Đặt `expire_on_commit=False` khi cấu hình `async_sessionmaker` để các thuộc tính của đối tượng vẫn đọc được sau khi `await session.commit()` mà không kích hoạt I/O ngầm.',
    ],
    commonIssues: [
      {
        id: 'issue-s4-missing-greenlet',
        title: 'Lỗi MissingGreenlet khi truy cập thuộc tính quan hệ trong SQLAlchemy Async',
        severity: 'critical',
        symptom: '`sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called; can\'t call await_only() here.`',
        whyItHappens:
          'Trong môi trường Async, khi bạn truy cập `student.courses` mà chưa nạp trước, SQLAlchemy cố gắng thực hiện Lazy Load đồng bộ ngầm định nhưng bị chặn để bảo vệ Event Loop.',
        wrongCode: `# Chưa nạp trước courses:\nstudent = await session.get(Student, 1)\nprint(student.courses)  # NỔ LỖI MissingGreenlet!`,
        rightCode: `stmt = select(Student).options(selectinload(Student.courses)).where(Student.id == 1)\nstudent = (await session.scalars(stmt)).first()\nprint(student.courses)  # An toàn và cực nhanh!`,
        fixExplanation: 'Luôn dùng `selectinload()` (cho quan hệ 1-N / N-N) hoặc `joinedload()` (cho quan hệ N-1) khi làm việc với `AsyncSession`.',
      },
    ],
    jsComparison: [
      {
        concept: 'ORM & Eager Loading',
        jsTsWay: 'Prisma: prisma.student.findUnique({ where: { id: 1 }, include: { courses: true } })',
        pythonWay: 'SQLAlchemy 2.0: select(Student).options(selectinload(Student.courses)).where(Student.id == 1)',
        jsCode: `const user = await prisma.student.findUnique({\n  where: { id: 1 },\n  include: { courses: true }\n});`,
        pythonCode: `stmt = select(Student).options(selectinload(Student.courses)).where(Student.id == 1)\nuser = await session.scalar(stmt)`,
        keyDifference: 'SQLAlchemy 2.0 cho phép bạn kiểm soát chính xác chiến lược nạp (`selectinload` dùng 2 query vs `joinedload` dùng `LEFT OUTER JOIN`) và quản lý Transaction sâu hơn Prisma.',
      },
    ],
    relatedTermIds: ['eco-sqlalchemy', 'eco-fastapi', 'eco-pydantic', 'concept-asyncio'],
    relatedLessonIds: ['s4-fastapi-di-pydantic', 's5-asyncio-gil-concurrency'],
    relatedExerciseIds: ['ex-s4-pydantic-validator'],
  },
];

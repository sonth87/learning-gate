import { LessonTopic } from '@/types/curriculum.types';

export const STAGE_3_LESSONS: LessonTopic[] = [
  {
    id: 's3-modules-testing',
    stageId: 'stage-3',
    level: 'pro',
    order: 7,
    title: '3.1. Kiến trúc Module & Package (src-layout), pydantic-settings & Kiểm thử với pytest',
    shortDescription:
      'Tổ chức dự án quy mô doanh nghiệp, quản lý biến môi trường .env an toàn kiểu, cấu hình Structured Logging và làm chủ @pytest.fixture / parametrize.',
    estimatedMinutes: 40,
    theoryParagraphs: [
      'Khi dự án vượt quá vài file đơn lẻ, việc hiểu rõ cách Python nạp module (`sys.path`, `__init__.py`) là bắt buộc. Chuẩn công nghiệp hiện nay sử dụng cấu trúc `src-layout` (`src/app/...`) và luôn ưu tiên **Absolute Import** (`from app.services.user import UserService`) thay vì Relative Import nhiều tầng (`from ...services import`).',
      'Thay vì rải rác `os.getenv("DB_URL")` khắp nơi trong code và chỉ phát hiện thiếu biến môi trường khi khách hàng gọi tới đúng hàm đó lúc nửa đêm, chúng ta dùng `pydantic-settings`: toàn bộ biến môi trường từ file `.env` được kiểm tra kiểu dữ liệu ngay giây đầu tiên khi ứng dụng khởi động (**Fail-fast at Startup**).',
      'Về kiểm thử tự động, `pytest` là tiêu chuẩn vàng của thế giới Python. Không cần các lớp `TestCase` rườm rà, bạn chỉ cần viết hàm `test_*` dùng câu lệnh `assert` tự nhiên, kết hợp `@pytest.fixture` để tiêm phụ thuộc (Dependency Injection cho test) và `@pytest.mark.parametrize` để chạy hàng chục kịch bản biên chỉ với 1 hàm duy nhất.',
    ],
    analogy: {
      title: 'Danh sách Kiểm tra Trước Chuyến bay (pydantic-settings) & Phòng Thí nghiệm Tự động (pytest.fixture)',
      realWorldScenario:
        'Hãy so sánh một dự án nghiệp dư và một hệ thống chuẩn Production:',
      mappingPoints: [
        {
          realWorld: 'Phi công kiểm tra đủ nhiên liệu và áp suất trước khi cất cánh (`pydantic-settings`)',
          pythonEquivalent: '`class Settings(BaseSettings): database_url: PostgresDsn`',
          explanation: 'Nếu thiếu `DATABASE_URL` hoặc sai định dạng port trong `.env`, máy bay từ chối cất cánh ngay lập tức kèm thông báo rõ ràng, thay vì bay lên trời rồi mới phát hiện hết xăng!',
        },
        {
          realWorld: 'Kỹ thuật viên chuẩn bị sẵn ống nghiệm sạch trước ca test và tự động rửa sau ca (`@pytest.fixture`)',
          pythonEquivalent: '`@pytest.fixture def db_session(): ... yield session ... session.rollback()`',
          explanation: 'Mỗi bài test luôn nhận được một môi trường sạch tinh tươm mà không cần copy-paste code khởi tạo.',
        },
      ],
      mentalModelTip:
        'Trong môi trường Production, hãy thay thế hoàn toàn `print()` bằng module `logging` (hoặc `structlog`) xuất định dạng JSON để dễ dàng truy vết theo `request_id`.',
    },
    codeExamples: [
      {
        id: 'ex-s3-1-pytest',
        title: 'Quản lý cấu hình với BaseSettings & Kiểm thử toàn diện với pytest',
        description: 'Cách viết cấu hình an toàn kiểu và kiểm thử tham số hóa chuyên nghiệp.',
        code: `import pytest
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# 1. Cấu hình biến môi trường an toàn kiểu (Fail-fast)
class AppSettings(BaseSettings):
    app_name: str = "PyMastery API"
    database_url: str
    redis_ttl_seconds: int = Field(default=300, ge=10)
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# 2. Fixture cấp phát tài nguyên có dọn dẹp tự động bằng yield
@pytest.fixture
def sample_cart() -> list[dict]:
    cart = [{"sku": "BOOK-01", "price": 150_000, "qty": 2}]
    yield cart
    cart.clear()  # Teardown tự động sau khi hàm test chạy xong

# 3. Chạy 1 hàm test với nhiều bộ dữ liệu biên bằng @pytest.mark.parametrize
@pytest.mark.parametrize(
    "subtotal,discount_code,expected",
    [
        (200_000, "VIP10", 180_000),
        (200_000, "NONE", 200_000),
        (0, "VIP10", 0),
    ],
)
def test_calculate_total(subtotal: int, discount_code: str, expected: int) -> None:
    rate = 0.10 if discount_code == "VIP10" else 0.0
    assert int(subtotal * (1 - rate)) == expected`,
        output: `3 passed in 0.04s`,
        annotations: [
          { line: 6, explanation: '`BaseSettings` tự động đọc biến môi trường `DATABASE_URL` (không phân biệt hoa thường) và ép kiểu.' },
          { line: 13, explanation: '`@pytest.fixture` biến hàm `sample_cart` thành tài nguyên có thể tiêm tự động vào bất kỳ hàm `test_*` nào khai báo tham số `sample_cart`.' },
          { line: 20, explanation: '`@pytest.mark.parametrize` tách biệt hoàn toàn dữ liệu kiểm thử khỏi logic kiểm thử.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Cô lập hoàn toàn Database trong Integration Test',
        scenario: 'Chạy 200 bài test API có ghi dữ liệu vào PostgreSQL mà không làm bẩn dữ liệu của nhau.',
        whyPythonFits: 'Dùng `@pytest.fixture` bọc mỗi bài test trong một Database Transaction và gọi `await session.rollback()` ngay sau dòng `yield`.',
      },
    ],
    tipsAndBestPractices: [
      'Luôn cấu hình `ruff check --fix` và `pyright` chạy tự động trong pre-commit hook và GitHub Actions.',
      'Dùng `breakpoint()` tích hợp sẵn của Python để dừng chương trình và kiểm tra biến trực tiếp ngay tại dòng nghi ngờ lỗi.',
    ],
    commonIssues: [
      {
        id: 'issue-s3-circular-import',
        title: 'Lỗi Circular Import (Import vòng tròn giữa 2 module)',
        severity: 'critical',
        symptom: '`ImportError: cannot import name X from partially initialized module Y (most likely due to a circular import)`',
        whyItHappens:
          'Module `A` ở dòng đầu tiên import `B`, trong khi module `B` ở dòng đầu tiên lại import ngược lại `A` khi `A` chưa kịp chạy xong định nghĩa class.',
        wrongCode: `# file: models/user.py\nfrom app.models.order import Order  # Order lại import ngược User ở đầu file!\nclass User: ...`,
        rightCode: `from __future__ import annotations\nfrom typing import TYPE_CHECKING\n\nif TYPE_CHECKING:\n    # Chỉ import cho Pyright/IDE kiểm tra kiểu, không chạy lúc Runtime!\n    from app.models.order import Order`,
        fixExplanation: 'Sử dụng `if TYPE_CHECKING:` kết hợp `from __future__ import annotations` nếu chỉ cần dùng class kia để khai báo Type Hints, hoặc tách phần dùng chung sang module thứ 3 (`core/common.py`).',
      },
    ],
    jsComparison: [
      {
        concept: 'Unit Testing & Dependency Mocking',
        jsTsWay: 'Vitest / Jest: beforeEach(), afterEach(), test.each([...])',
        pythonWay: 'pytest: @pytest.fixture (với yield) và @pytest.mark.parametrize',
        jsCode: `test.each([[1, 2, 3], [2, 3, 5]])('add(%i, %i)', (a, b, exp) => {\n  expect(a + b).toBe(exp);\n});`,
        pythonCode: `@pytest.mark.parametrize("a,b,exp", [(1, 2, 3), (2, 3, 5)])\ndef test_add(a, b, exp):\n    assert a + b == exp`,
        keyDifference: 'Cơ chế `@pytest.fixture` của Python có thể lắp ghép chồng lên nhau (fixture gọi fixture) linh hoạt hơn nhiều so với `beforeEach` toàn cục của Jest.',
      },
    ],
    relatedTermIds: ['eco-pytest', 'eco-uv', 'eco-pydantic', 'kw-yield'],
    relatedLessonIds: ['s2-typing-dataclasses', 's4-fastapi-di-pydantic'],
    relatedExerciseIds: ['ex-s3-pytest-fixture'],
  },
];

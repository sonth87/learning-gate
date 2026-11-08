import { PracticeExercise } from '@/types/practice.types';

export const PACK_4_EXERCISES: PracticeExercise[] = [
  {
    id: 'ex-s3-pydantic-settings-env',
    title: 'Bài 46: Quản lý Biến Môi trường .env Fail-Fast lúc Khởi động với BaseSettings',
    category: 'architecture',
    stageId: 'stage-3',
    level: 'pro',
    relatedLessonId: 's3-modules-testing',
    problemStatement:
      'Trong Node.js/Express, lập trình viên thường dùng `process.env.DB_PORT` rải rác khắp code và chỉ phát hiện biến môi trường bị thiếu hoặc sai kiểu khi khách hàng gọi đúng API đó lúc 2 giờ sáng. Hãy thiết kế lớp cấu hình `AppSettings` kế thừa `BaseSettings` (từ `pydantic_settings`) sử dụng `SettingsConfigDict(env_file=".env", extra="ignore")`, tự động ép kiểu `db_port: int = 5432`, bắt buộc có `database_url: str`, và dùng `SecretStr` cho `jwt_secret` để không bị lộ mật khẩu khi in log.',
    realWorldContext:
      'Nguyên lý "Fail-Fast at Startup" trong kiến trúc Twelve-Factor App: Nếu thiếu `DATABASE_URL` hoặc `JWT_SECRET` trên server Production, ứng dụng phải từ chối khởi động ngay lập tức kèm thông báo lỗi rõ ràng từ Pydantic thay vì chạy nửa vời.',
    requirements: [
      'Kế thừa `BaseSettings` từ `pydantic_settings`',
      'Cấu hình `model_config = SettingsConfigDict(env_file=".env", extra="ignore")`',
      'Khai báo `database_url: str`, `db_port: int = 5432`, và `jwt_secret: SecretStr`',
    ],
    starterCode: `import os
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# Code kiểu cũ nguy hiểm: dùng os.getenv rải rác, không ép kiểu, lộ secret khi log
class AppSettings(BaseSettings):
    # TODO: Cấu hình model_config với SettingsConfigDict(env_file=".env", extra="ignore")
    # TODO: Khai báo database_url: str, db_port: int = 5432, jwt_secret: SecretStr
    database_url: str = os.getenv("DATABASE_URL", "")
    pass
`,
    solutionCode: `from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    db_port: int = 5432
    jwt_secret: SecretStr
`,
    hints: [
      'Gợi ý 1: Xóa `import os` và `os.getenv(...)` vì `BaseSettings` tự động đọc từ biến môi trường của hệ điều hành và file `.env`.',
      'Gợi ý 2: Khai báo `model_config = SettingsConfigDict(env_file=".env", extra="ignore")` ngay đầu thân class `AppSettings`.',
      'Gợi ý 3: Khai báo 3 trường `database_url: str`, `db_port: int = 5432`, và `jwt_secret: SecretStr`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Cấu hình nguồn nạp `.env` với `SettingsConfigDict`',
        codeSnippet: `class AppSettings(BaseSettings):\n    model_config = SettingsConfigDict(env_file=".env", extra="ignore")`,
        explanation:
          'Cờ `extra="ignore"` cực kỳ quan trọng trong thực tế: khi file `.env` dùng chung với Docker Compose có thêm các biến như `POSTGRES_USER`, ứng dụng Python sẽ bỏ qua các biến thừa thay vì báo lỗi `extra_forbidden`.',
      },
      {
        stepTitle: 'Bước 2: Ép kiểu tự động và che giấu bí mật bằng `SecretStr`',
        codeSnippet: `    database_url: str\n    db_port: int = 5432\n    jwt_secret: SecretStr`,
        explanation:
          'Khi bạn `print(settings)`, trường `jwt_secret` sẽ hiển thị là `SecretStr(\'**********\')` trên Sentry/Datadog logs. Chỉ khi nào cần ký JWT thật sự mới gọi `settings.jwt_secret.get_secret_value()`.',
      },
    ],
    commonMistakes: [
      'Vẫn gán `= os.getenv("DATABASE_URL", "")` bên trong `BaseSettings` — điều này vô hiệu hóa cơ chế kiểm tra bắt buộc (Required Validation) của Pydantic vì chuỗi rỗng `""` vẫn được tính là một `str` hợp lệ!',
      'Dùng kiểu `str` thường cho `jwt_secret` hoặc `api_key`, dẫn đến khi crash và dump biến cấu hình lên hệ thống log tập trung thì toàn bộ khóa bí mật bị lộ.',
    ],
    testCases: [
      {
        id: 'tc-46-1',
        description: 'Cấu hình chuẩn BaseSettings và SettingsConfigDict(env_file=".env", extra="ignore")',
        inputDescription: 'AppSettings(database_url="postgresql://...", jwt_secret="super-secret")',
        expectedOutput: "AppSettings(database_url='postgresql://...', db_port=5432, jwt_secret=SecretStr('**********'))",
        requiredPatterns: [
          'BaseSettings',
          'SettingsConfigDict(',
          'env_file=".env"',
          'extra="ignore"',
          'model_config',
        ],
        forbiddenPatterns: [
          {
            pattern: 'os.getenv',
            reason: 'Không dùng `os.getenv` thủ công bên trong `BaseSettings` — hãy để Pydantic tự nạp và validate!',
          },
          {
            pattern: 'os.environ',
            reason: 'Không truy cập `os.environ` trực tiếp khi đã dùng `BaseSettings`!',
          },
        ],
      },
      {
        id: 'tc-46-2',
        description: 'Khai báo đúng Type Hints cho database_url, db_port và bảo vệ jwt_secret bằng SecretStr',
        inputDescription: 'str(settings.jwt_secret)',
        expectedOutput: "'**********'",
        requiredPatterns: ['database_url: str', 'db_port: int = 5432', 'jwt_secret: SecretStr'],
      },
    ],
  },
  {
    id: 'ex-s3-circular-import-fix',
    title: 'Bài 47: Giải cứu Lỗi ImportError do Circular Import bằng TYPE_CHECKING',
    category: 'debug-rescue',
    stageId: 'stage-3',
    level: 'pro',
    relatedLessonId: 's3-modules-testing',
    problemStatement:
      'Lập trình viên từ TypeScript/Java sang Python rất hay gặp lỗi `ImportError: cannot import name ... (most likely due to a circular import)` khi module `models/user.py` import `Order` để gõ Type Hint, còn `models/order.py` lại import `User`. Trong TS có `import type { Order }`, còn trong Python chuẩn công nghiệp là dùng `from __future__ import annotations` kết hợp với chốt chặn `if TYPE_CHECKING:`. Hãy sửa đoạn code bên dưới để loại bỏ Circular Import lúc Runtime!',
    realWorldContext:
      'Trong các dự án SQLAlchemy hoặc Domain-Driven Design có quan hệ 2 chiều (`User.orders` <-> `Order.user`), `if TYPE_CHECKING:` là vũ khí bắt buộc để IDE/Mypy/Pyright hiểu đầy đủ kiểu dữ liệu mà Python Runtime không hề phải nạp module chéo nhau.',
    requirements: [
      'Bật `from __future__ import annotations` ở dòng đầu tiên để hoãn đánh giá Type Hints (Postponed Evaluation)',
      'Import `TYPE_CHECKING` từ module `typing`',
      'Đặt lệnh `from app.models.order import Order` vào bên trong khối `if TYPE_CHECKING:`',
    ],
    starterCode: `# LỖI: Import trực tiếp ở top-level gây Circular Import khi order.py cũng import User!
from app.models.order import Order

class User:
    def __init__(self, username: str) -> None:
        self.username = username
        self.orders: list[Order] = []

    def add_order(self, order: Order) -> int:
        # TODO: Sửa phần import ở đầu file dùng __future__.annotations và if TYPE_CHECKING:
        self.orders.append(order)
        return len(self.orders)
`,
    solutionCode: `from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.order import Order

class User:
    def __init__(self, username: str) -> None:
        self.username = username
        self.orders: list[Order] = []

    def add_order(self, order: Order) -> int:
        self.orders.append(order)
        return len(self.orders)
`,
    hints: [
      'Gợi ý 1: Thêm `from __future__ import annotations` ở dòng đầu tiên của file để Python biến mọi Type Hint thành chuỗi ký tự lúc Runtime.',
      'Gợi ý 2: Thêm `from typing import TYPE_CHECKING`.',
      'Gợi ý 3: Bọc dòng `from app.models.order import Order` vào bên trong khối `if TYPE_CHECKING:`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Hoãn đánh giá chú thích kiểu với `from __future__ import annotations` (PEP 563)',
        codeSnippet: `from __future__ import annotations\nfrom typing import TYPE_CHECKING`,
        explanation:
          'Nhờ dòng này, Python không thực thi biểu thức `list[Order]` hay `order: Order` lúc định nghĩa class `User`, nên không bị lỗi `NameError: name "Order" is not defined` khi `Order` chưa được nạp ở Runtime.',
      },
      {
        stepTitle: 'Bước 2: Nhốt import chỉ phục vụ Type Hint vào `if TYPE_CHECKING:`',
        codeSnippet: `if TYPE_CHECKING:\n    from app.models.order import Order`,
        explanation:
          'Hằng số `TYPE_CHECKING` luôn bằng `False` khi chạy ứng dụng thực tế (`python`/`uvicorn`), nhưng được trình kiểm tra kiểu tĩnh (Pyright, Mypy, VS Code Pylance) coi là `True`. Tương đương hoàn hảo với `import type` của TypeScript!',
      },
    ],
    commonMistakes: [
      'Dùng `if TYPE_CHECKING:` nhưng quên `from __future__ import annotations` (hoặc quên đặt `"Order"` trong ngoặc kép), dẫn đến lúc chạy thật bị văng lỗi `NameError: name "Order" is not defined`.',
      'Nhét `from app.models.order import Order` vào bên trong từng hàm — cách đó chỉ cần thiết khi bạn thực sự cần khởi tạo đối tượng `Order()` lúc Runtime, còn nếu chỉ để gõ Type Hint thì phải dùng `if TYPE_CHECKING:`.',
    ],
    testCases: [
      {
        id: 'tc-47-1',
        description: 'Sử dụng from __future__ import annotations và if TYPE_CHECKING:',
        inputDescription: 'u = User("alice"); u.add_order(mock_order)',
        expectedOutput: '1',
        requiredPatterns: [
          'from __future__ import annotations',
          'TYPE_CHECKING',
          'if TYPE_CHECKING:',
          '    from app.models.order import Order',
        ],
      },
      {
        id: 'tc-47-2',
        description: 'Giữ nguyên chữ ký hàm và Type Hints sạch sẽ trên class User',
        inputDescription: 'User.__annotations__',
        expectedOutput: "{'orders': 'list[Order]'}",
        requiredPatterns: ['list[Order]', 'order: Order', 'return len(self.orders)'],
      },
    ],
  },
  {
    id: 'ex-s3-pytest-fixture-teardown',
    title: 'Bài 48: Viết @pytest.fixture Cấp phát & Tự động Rollback Database bằng yield',
    category: 'code-gym',
    stageId: 'stage-3',
    level: 'pro',
    relatedLessonId: 's3-modules-testing',
    problemStatement:
      'Trong Jest/Mocha (JS) hoặc JUnit (Java), bạn phải tách rời `beforeEach()` và `afterEach()` và dùng biến toàn cục để truyền kết nối DB giữa hai hàm. Pytest giải quyết cực kỳ thanh lịch bằng **Generator Fixture**: chỉ cần một hàm gắn `@pytest.fixture` có từ khóa `yield` ở giữa! Hãy viết fixture `db_session()` khởi tạo `session = FakeDBSession()`, gọi `session.begin()`, trao `session` cho hàm test bằng `yield session`, và đảm bảo luôn gọi `session.rollback()` và `session.close()` trong khối `finally:`.',
    realWorldContext:
      'Mọi bài Integration Test làm việc với Database trong dự án thực tế đều dùng mô hình Transaction Rollback Fixture này: mỗi hàm test chạy trong một giao dịch cô lập và tự động hoàn tác sạch sẽ ngay cả khi bài test đó bị lỗi (`AssertionError`).',
    requirements: [
      'Đánh dấu hàm `db_session` bằng decorator `@pytest.fixture`',
      'Khởi tạo `session = FakeDBSession()` và gọi `session.begin()`',
      'Sử dụng `try: ... yield session` kết hợp khối `finally:` để gọi `session.rollback()` và `session.close()`',
    ],
    starterCode: `import pytest

class FakeDBSession:
    def __init__(self) -> None:
        self.in_tx = False
        self.closed = False
    def begin(self) -> None:
        self.in_tx = True
    def rollback(self) -> None:
        self.in_tx = False
    def close(self) -> None:
        self.closed = True

# TODO: Gắn @pytest.fixture và viết hàm db_session() dùng try / yield session / finally
def db_session():
    pass
`,
    solutionCode: `import pytest

class FakeDBSession:
    def __init__(self) -> None:
        self.in_tx = False
        self.closed = False
    def begin(self) -> None:
        self.in_tx = True
    def rollback(self) -> None:
        self.in_tx = False
    def close(self) -> None:
        self.closed = True

@pytest.fixture
def db_session():
    session = FakeDBSession()
    session.begin()
    try:
        yield session
    finally:
        session.rollback()
        session.close()
`,
    hints: [
      'Gợi ý 1: Đặt `@pytest.fixture` ngay phía trên `def db_session():`.',
      'Gợi ý 2: Khởi tạo `session = FakeDBSession()` và gọi `session.begin()` ở phần Setup.',
      'Gợi ý 3: Dùng `try:\n        yield session\n    finally:\n        session.rollback()\n        session.close()` để đảm bảo dù test fail thì DB vẫn được dọn dẹp.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Pha Setup trước từ khóa `yield`',
        codeSnippet: `@pytest.fixture\ndef db_session():\n    session = FakeDBSession()\n    session.begin()`,
        explanation:
          'Khi một hàm test khai báo tham số `def test_create_user(db_session):`, Pytest tự động phát hiện tên tham số trùng với tên fixture, chạy phần code từ đầu hàm đến `yield session` và tiêm đối tượng `session` vào hàm test.',
      },
      {
        stepTitle: 'Bước 2: Pha Teardown an toàn tuyệt đối sau `yield` với `try...finally`',
        codeSnippet: `    try:\n        yield session\n    finally:\n        session.rollback()\n        session.close()`,
        explanation:
          'Ngay khi hàm test chạy xong (hoặc văng ngoại lệ vì `assert` sai), Pytest quay trở lại điểm `yield` và chạy khối `finally:`. Việc này xóa bỏ hoàn toàn nhu cầu dùng biến toàn cục giữa `beforeEach` và `afterEach`.',
      },
    ],
    commonMistakes: [
      'Dùng `return session` thay vì `yield session` — nếu dùng `return`, toàn bộ phần dọn dẹp (`rollback`, `close`) phía dưới trở thành Dead Code không bao giờ chạy!',
      'Không bọc `yield session` trong `try...finally:` — nếu bài test văng ngoại lệ chưa bắt, phần code sau `yield` có nguy cơ bị bỏ qua trong một số ngữ cảnh generator thủ công.',
    ],
    testCases: [
      {
        id: 'tc-48-1',
        description: 'Khai báo @pytest.fixture và trao quyền bằng yield session',
        inputDescription: 'gen = db_session(); s = next(gen); s.in_tx',
        expectedOutput: 'True',
        requiredPatterns: ['@pytest.fixture', 'def db_session', 'session.begin()', 'yield session'],
        forbiddenPatterns: [
          {
            pattern: 'return session',
            reason: 'Hãy dùng `yield session` thay vì `return session` để Pytest thực thi phần Teardown sau khi test chạy xong!',
          },
        ],
      },
      {
        id: 'tc-48-2',
        description: 'Đảm bảo Teardown với try...finally gọi rollback() và close()',
        inputDescription: ' Sau khi kết thúc test: (s.in_tx, s.closed)',
        expectedOutput: '(False, True)',
        requiredPatterns: ['try:', 'finally:', 'session.rollback()', 'session.close()'],
      },
    ],
  },
  {
    id: 'ex-s3-pytest-parametrize',
    title: 'Bài 49: Kiểm thử Hàng loạt Kịch bản Biên với @pytest.mark.parametrize & pytest.raises',
    category: 'code-gym',
    stageId: 'stage-3',
    level: 'pro',
    relatedLessonId: 's3-modules-testing',
    problemStatement:
      'Thay vì copy-paste 5 hàm test gần giống hệt nhau hoặc dùng vòng lặp `for` bên trong hàm test (khiến 1 case đầu tạch là các case sau không được chạy), Pytest cung cấp `@pytest.mark.parametrize` để tách mỗi bộ dữ liệu thành một test case độc lập, và `with pytest.raises(ValueError):` để kiểm tra ngoại lệ. Hãy hoàn thiện 2 hàm test cho hàm `apply_discount(price, percent)`.',
    realWorldContext:
      'Data-Driven Testing (Kiểm thử hướng dữ liệu) là tiêu chuẩn bắt buộc khi kiểm thử các hàm tính phí, thuế, chiết khấu tài chính có nhiều trường hợp biên (0%, 100%, số âm, vượt quá 100%).',
    requirements: [
      'Gắn `@pytest.mark.parametrize("price,percent,expected", [(100.0, 0, 100.0), (200.0, 25, 150.0), (50.0, 100, 0.0)])` cho hàm `test_apply_discount_valid`',
      'Trong `test_apply_discount_invalid`, dùng Context Manager `with pytest.raises(ValueError):` để kiểm tra khi truyền `percent=-10`',
    ],
    starterCode: `import pytest

def apply_discount(price: float, percent: int) -> float:
    if not (0 <= percent <= 100):
        raise ValueError("Percent must be between 0 and 100")
    return price * (100 - percent) / 100.0

# TODO: Gắn @pytest.mark.parametrize("price,percent,expected", [...])
def test_apply_discount_valid(price: float, percent: int, expected: float) -> None:
    pass

def test_apply_discount_invalid() -> None:
    # TODO: Dùng 'with pytest.raises(ValueError):' gọi apply_discount(100.0, -10)
    pass
`,
    solutionCode: `import pytest

def apply_discount(price: float, percent: int) -> float:
    if not (0 <= percent <= 100):
        raise ValueError("Percent must be between 0 and 100")
    return price * (100 - percent) / 100.0

@pytest.mark.parametrize(
    "price,percent,expected",
    [
        (100.0, 0, 100.0),
        (200.0, 25, 150.0),
        (50.0, 100, 0.0),
    ],
)
def test_apply_discount_valid(price: float, percent: int, expected: float) -> None:
    assert apply_discount(price, percent) == expected

def test_apply_discount_invalid() -> None:
    with pytest.raises(ValueError):
        apply_discount(100.0, -10)
`,
    hints: [
      'Gợi ý 1: Đặt `@pytest.mark.parametrize("price,percent,expected", [(100.0, 0, 100.0), (200.0, 25, 150.0), (50.0, 100, 0.0)])` phía trên `test_apply_discount_valid`.',
      'Gợi ý 2: Bên trong `test_apply_discount_valid`, chỉ cần viết `assert apply_discount(price, percent) == expected`.',
      'Gợi ý 3: Bên trong `test_apply_discount_invalid`, viết `with pytest.raises(ValueError):\n        apply_discount(100.0, -10)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Nhân bản kịch bản test độc lập với `@pytest.mark.parametrize`',
        codeSnippet: `@pytest.mark.parametrize(\n    "price,percent,expected",\n    [(100.0, 0, 100.0), (200.0, 25, 150.0), (50.0, 100, 0.0)],\n)\ndef test_apply_discount_valid(price: float, percent: int, expected: float) -> None:\n    assert apply_discount(price, percent) == expected`,
        explanation:
          'Pytest sẽ sinh ra 3 bài test riêng biệt trên báo cáo CI/CD (`test_apply_discount_valid[100.0-0-100.0]`, v.v.). Nếu bộ thứ nhất lỗi, 2 bộ còn lại vẫn được chạy bình thường.',
      },
      {
        stepTitle: 'Bước 2: Bắt ngoại lệ chuẩn xác bằng `with pytest.raises(...)`',
        codeSnippet: `def test_apply_discount_invalid() -> None:\n    with pytest.raises(ValueError):\n        apply_discount(100.0, -10)`,
        explanation:
          'Nếu `apply_discount(100.0, -10)` ném ra `ValueError`, khối `with` sẽ bắt lại và đánh dấu bài test PASS. Ngược lại, nếu hàm im lặng không ném lỗi, Pytest sẽ đánh dấu bài test FAIL!',
      },
    ],
    commonMistakes: [
      'Dùng vòng lặp `for price, percent, expected in cases:` bên trong thân hàm test — khi case đầu tiên thất bại, toàn bộ hàm test dừng lại ngay lập tức và bạn mù thông tin về các case còn lại.',
      'Dùng `try: apply_discount(...) except ValueError: assert True` mà quên xử lý trường hợp hàm KHÔNG ném lỗi (khiến bài test vẫn xanh dù code quên `raise ValueError`).',
    ],
    testCases: [
      {
        id: 'tc-49-1',
        description: 'Sử dụng @pytest.mark.parametrize và assert kết quả tính chiết khấu',
        inputDescription: 'pytest -k test_apply_discount_valid',
        expectedOutput: '3 passed in 0.01s',
        requiredPatterns: [
          '@pytest.mark.parametrize',
          'price,percent,expected',
          'assert apply_discount(price, percent) == expected',
        ],
      },
      {
        id: 'tc-49-2',
        description: 'Sử dụng with pytest.raises(ValueError): để kiểm tra ngoại lệ',
        inputDescription: 'pytest -k test_apply_discount_invalid',
        expectedOutput: '1 passed in 0.01s',
        requiredPatterns: ['with pytest.raises(ValueError):', 'apply_discount(100.0, -10)'],
      },
    ],
  },
  {
    id: 'ex-s3-unittest-mock-async',
    title: 'Bài 50: Cô lập Gọi API Bên ngoài trong Unit Test bằng unittest.mock.AsyncMock',
    category: 'code-gym',
    stageId: 'stage-3',
    level: 'pro',
    relatedLessonId: 's3-modules-testing',
    problemStatement:
      'Unit Test tuyệt đối không được gọi API thanh toán Stripe thật qua mạng (vừa chậm, vừa tốn tiền thật, vừa rớt test khi đứt cáp). Hãy viết hàm test bất đồng bộ `test_process_order_success()` sử dụng `AsyncMock` từ `unittest.mock` để giả lập `gateway.charge = AsyncMock(return_value={"status": "paid", "tx_id": "tx_999"})`, sau đó gọi `await process_order(gateway, 500)` và dùng `gateway.charge.assert_awaited_once_with(500)` để xác minh hàm đã được `await` đúng tham số!',
    realWorldContext:
      'Trong kiến trúc Microservices và FastAPI bất đồng bộ, `AsyncMock` là công cụ chuẩn trong thư viện chuẩn Python (`unittest.mock`) giúp mock các coroutine (`async def`) mà không cần cài thêm thư viện ngoài.',
    requirements: [
      'Khởi tạo mock cho phương thức bất đồng bộ bằng `AsyncMock(return_value={"status": "paid", "tx_id": "tx_999"})`',
      'Gọi `result = await process_order(gateway, 500)` và kiểm tra `assert result == "tx_999"`',
      'Xác minh coroutine đã được await đúng 1 lần với đối số `500` bằng `gateway.charge.assert_awaited_once_with(500)`',
    ],
    starterCode: `from unittest.mock import AsyncMock

class PaymentGateway:
    async def charge(self, amount: int) -> dict:
        raise RuntimeError("Không được gọi cổng thanh toán thật trong Unit Test!")

async def process_order(gateway: PaymentGateway, amount: int) -> str:
    resp = await gateway.charge(amount)
    return resp["tx_id"]

async def test_process_order_success() -> None:
    gateway = PaymentGateway()
    # TODO: Gán gateway.charge = AsyncMock(return_value={"status": "paid", "tx_id": "tx_999"})
    # TODO: Gọi result = await process_order(gateway, 500), assert kết quả và assert_awaited_once_with(500)
    pass
`,
    solutionCode: `from unittest.mock import AsyncMock

class PaymentGateway:
    async def charge(self, amount: int) -> dict:
        raise RuntimeError("Không được gọi cổng thanh toán thật trong Unit Test!")

async def process_order(gateway: PaymentGateway, amount: int) -> str:
    resp = await gateway.charge(amount)
    return resp["tx_id"]

async def test_process_order_success() -> None:
    gateway = PaymentGateway()
    gateway.charge = AsyncMock(return_value={"status": "paid", "tx_id": "tx_999"})
    result = await process_order(gateway, 500)
    assert result == "tx_999"
    gateway.charge.assert_awaited_once_with(500)
`,
    hints: [
      'Gợi ý 1: Thay thế phương thức thật bằng `gateway.charge = AsyncMock(return_value={"status": "paid", "tx_id": "tx_999"})`.',
      'Gợi ý 2: Gọi `result = await process_order(gateway, 500)` và kiểm tra `assert result == "tx_999"`.',
      'Gợi ý 3: Gọi `gateway.charge.assert_awaited_once_with(500)` ở dòng cuối cùng.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Giả lập Coroutine bằng `AsyncMock` thay vì `MagicMock`',
        codeSnippet: `    gateway.charge = AsyncMock(return_value={"status": "paid", "tx_id": "tx_999"})`,
        explanation:
          'Nếu bạn dùng `MagicMock` thường cho một hàm `async def`, lệnh `await gateway.charge(amount)` sẽ văng lỗi `TypeError: object MagicMock can\'t be used in \'await\' expression`. `AsyncMock` tạo ra một đối tượng Awaitable trả về đúng `return_value` khi được `await`.',
      },
      {
        stepTitle: 'Bước 2: Kiểm tra hành vi bất đồng bộ bằng `assert_awaited_once_with`',
        codeSnippet: `    result = await process_order(gateway, 500)\n    assert result == "tx_999"\n    gateway.charge.assert_awaited_once_with(500)`,
        explanation:
          'Không chỉ kiểm tra giá trị trả về, `assert_awaited_once_with(500)` còn đảm bảo code thực sự đã `await` coroutine đó với đúng số tiền `500` chứ không gọi nhầm 2 lần (Double Charge Bug)!',
      },
    ],
    commonMistakes: [
      'Dùng `MagicMock` thay vì `AsyncMock` cho hàm `async def`, dẫn đến lỗi `TypeError` tại biểu thức `await`.',
      'Chỉ kiểm tra `assert result == "tx_999"` mà quên `assert_awaited_once_with(500)` — nếu hàm `process_order` truyền nhầm `amount = 0` lên cổng thanh toán thì bài test vẫn xanh!',
    ],
    testCases: [
      {
        id: 'tc-50-1',
        description: 'Sử dụng AsyncMock với return_value giả lập cổng thanh toán',
        inputDescription: 'await test_process_order_success()',
        expectedOutput: " assertions passed: result == 'tx_999'",
        requiredPatterns: [
          'AsyncMock(',
          'return_value=',
          '"tx_999"',
          'await process_order(gateway, 500)',
        ],
      },
      {
        id: 'tc-50-2',
        description: 'Kiểm tra kết quả trả về và xác minh bằng assert_awaited_once_with(500)',
        inputDescription: 'gateway.charge.await_args_list',
        expectedOutput: '[call(500)]',
        requiredPatterns: ['assert result == "tx_999"', 'assert_awaited_once_with(500)'],
      },
    ],
  },
  {
    id: 'ex-s4-pydantic-validator',
    title: 'Bài 51: Thiết kế Schema Pydantic v2, @field_validator & ConfigDict(from_attributes=True)',
    category: 'architecture',
    stageId: 'stage-4',
    level: 'pro',
    relatedLessonId: 's4-fastapi-di-pydantic',
    problemStatement:
      'Hãy thiết kế cặp Schema chuẩn **Pydantic v2** cho hệ thống Quản lý Khóa học: `CourseCreate` có `title: str = Field(min_length=3, max_length=100)`, `credits: int = Field(ge=1, le=10)`, kèm một `@field_validator("title")` chuẩn hóa tên khóa học bằng `.strip()` và cấm từ khóa `"spam"`. Sau đó định nghĩa `CourseResponse(CourseCreate)` có thêm `id: int` và bật `model_config = ConfigDict(from_attributes=True)` để đọc trực tiếp từ đối tượng SQLAlchemy ORM.',
    realWorldContext:
      'Trong FastAPI, Pydantic v2 (viết lõi bằng Rust `pydantic-core`) vừa kiểm tra ràng buộc miền giá trị, vừa làm sạch dữ liệu đầu vào (`@field_validator`), vừa chuyển đổi mượt mà từ ORM Model sang JSON Response.',
    requirements: [
      'Khai báo `title: str = Field(min_length=3, max_length=100)` và `credits: int = Field(ge=1, le=10)`',
      'Viết `@field_validator("title")` kết hợp `@classmethod` để `.strip()` chuỗi và `raise ValueError` nếu chứa `"spam"`',
      'Trong `CourseResponse`, khai báo `id: int` và `model_config = ConfigDict(from_attributes=True)`',
    ],
    starterCode: `from pydantic import BaseModel, ConfigDict, Field, field_validator

class CourseCreate(BaseModel):
    # TODO: Khai báo title và credits với Field(...)
    # TODO: Viết @field_validator("title") chuẩn hóa .strip() và chặn từ "spam"
    pass

class CourseResponse(CourseCreate):
    # TODO: Khai báo id: int và model_config = ConfigDict(from_attributes=True)
    pass
`,
    solutionCode: `from pydantic import BaseModel, ConfigDict, Field, field_validator

class CourseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    credits: int = Field(ge=1, le=10)

    @field_validator("title")
    @classmethod
    def clean_title(cls, v: str) -> str:
        cleaned = v.strip()
        if "spam" in cleaned.lower():
            raise ValueError("Invalid course title")
        return cleaned

class CourseResponse(CourseCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)
`,
    hints: [
      'Gợi ý 1: Trong `CourseCreate`, khai báo `title: str = Field(min_length=3, max_length=100)` và `credits: int = Field(ge=1, le=10)`.',
      'Gợi ý 2: Dùng `@field_validator("title")` kèm `@classmethod` bên dưới, kiểm tra `if "spam" in cleaned.lower(): raise ValueError(...)` và trả về `cleaned`.',
      'Gợi ý 3: Trong `CourseResponse`, khai báo `id: int` và `model_config = ConfigDict(from_attributes=True)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Kết hợp `Field()` và `@field_validator` chuẩn Pydantic v2',
        codeSnippet: `    @field_validator("title")\n    @classmethod\n    def clean_title(cls, v: str) -> str:\n        cleaned = v.strip()\n        if "spam" in cleaned.lower():\n            raise ValueError("Invalid course title")\n        return cleaned`,
        explanation:
          'Trong Pydantic v2, `@validator` cũ đã được thay bằng `@field_validator`. Khi hàm ném ra `ValueError`, Pydantic tự động bắt lại và gói thành `ValidationError` chuẩn HTTP 422 trong FastAPI.',
      },
      {
        stepTitle: 'Bước 2: Đọc thuộc tính trực tiếp từ SQLAlchemy ORM với `from_attributes=True`',
        codeSnippet: `class CourseResponse(CourseCreate):\n    id: int\n    model_config = ConfigDict(from_attributes=True)`,
        explanation:
          'Cho phép gọi `CourseResponse.model_validate(sqlalchemy_course_obj)` để đọc `obj.id`, `obj.title` qua dấu chấm thay vì bắt buộc đầu vào phải là `dict`.',
      },
    ],
    commonMistakes: [
      'Dùng cú pháp Pydantic v1 đã lỗi thời (`@validator` thay vì `@field_validator`, hoặc `class Config: orm_mode = True` thay vì `model_config = ConfigDict(from_attributes=True)`).',
      'Quên `return cleaned` ở cuối hàm `@field_validator`, khiến trường `title` sau khi validate bị biến thành `None`!',
    ],
    testCases: [
      {
        id: 'tc-51-1',
        description: 'Sử dụng Field, @field_validator("title") và ném ValueError khi không hợp lệ',
        inputDescription: 'CourseCreate(title="  FastAPI Pro  ", credits=4)',
        expectedOutput: "CourseCreate(title='FastAPI Pro', credits=4)",
        requiredPatterns: [
          'Field(',
          '@field_validator("title")',
          '.strip()',
          'raise ValueError',
        ],
        forbiddenPatterns: [
          {
            pattern: '@validator',
            reason: '`@validator` là cú pháp cũ của Pydantic v1! Hãy dùng `@field_validator` của Pydantic v2.',
          },
        ],
      },
      {
        id: 'tc-51-2',
        description: 'Khai báo CourseResponse với ConfigDict(from_attributes=True)',
        inputDescription: 'CourseResponse.model_validate(orm_course)',
        expectedOutput: "CourseResponse(title='FastAPI Pro', credits=4, id=1)",
        requiredPatterns: ['ConfigDict(', 'from_attributes=True', 'model_config'],
        forbiddenPatterns: [
          {
            pattern: 'orm_mode',
            reason: '`orm_mode` là cú pháp cũ của Pydantic v1! Hãy dùng `ConfigDict(from_attributes=True)`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s4-pydantic-model-validator',
    title: 'Bài 52: Kiểm tra Ràng buộc Chéo Nhiều Trường bằng @model_validator(mode="after")',
    category: 'code-gym',
    stageId: 'stage-4',
    level: 'pro',
    relatedLessonId: 's4-fastapi-di-pydantic',
    problemStatement:
      'Một `@field_validator` đơn lẻ chỉ nhìn thấy 1 trường tại một thời điểm. Vậy làm sao kiểm tra quy tắc nghiệp vụ phụ thuộc giữa nhiều trường, ví dụ: trong Schema đặt phòng khách sạn `BookingRequest`, ngày trả phòng `end_day: int` bắt buộc phải lớn hơn ngày nhận phòng `start_day: int`, và nếu `is_vip: bool = True` thì không được dùng mã giảm giá `promo_code`? Hãy sử dụng `@model_validator(mode="after")` của Pydantic v2!',
    realWorldContext:
      'Cross-field Validation (Kiểm tra chéo giữa `start_date < end_date`, `password == confirm_password`, hoặc `min_price <= max_price`) xuất hiện trong hầu hết mọi biểu mẫu API thực tế.',
    requirements: [
      'Gắn decorator `@model_validator(mode="after")` lên phương thức kiểm tra của `BookingRequest`',
      'Nếu `self.end_day <= self.start_day`, ném ra `ValueError("end_day must be greater than start_day")`',
      'Trả về chính đối tượng `return self` ở cuối phương thức `@model_validator(mode="after")`',
    ],
    starterCode: `from pydantic import BaseModel, model_validator

class BookingRequest(BaseModel):
    start_day: int
    end_day: int
    is_vip: bool = False
    promo_code: str | None = None

    # TODO: Viết @model_validator(mode="after") kiểm tra:
    # 1. self.end_day <= self.start_day -> raise ValueError(...)
    # 2. self.is_vip and self.promo_code is not None -> raise ValueError(...)
    # và đừng quên return self!
    pass
`,
    solutionCode: `from pydantic import BaseModel, model_validator

class BookingRequest(BaseModel):
    start_day: int
    end_day: int
    is_vip: bool = False
    promo_code: str | None = None

    @model_validator(mode="after")
    def check_date_and_vip_rules(self) -> "BookingRequest":
        if self.end_day <= self.start_day:
            raise ValueError("end_day must be greater than start_day")
        if self.is_vip and self.promo_code is not None:
            raise ValueError("VIP bookings cannot combine with promo_code")
        return self
`,
    hints: [
      'Gợi ý 1: Đặt `@model_validator(mode="after")` ngay trên `def check_date_and_vip_rules(self):`.',
      'Gợi ý 2: Kiểm tra `if self.end_day <= self.start_day: raise ValueError(...)` và `if self.is_vip and self.promo_code is not None: raise ValueError(...)`.',
      'Gợi ý 3: Bắt buộc phải có `return self` ở dòng cuối cùng của hàm.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Chạy kiểm tra sau khi từng trường riêng lẻ đã hợp lệ (`mode="after"`)',
        codeSnippet: `    @model_validator(mode="after")\n    def check_date_and_vip_rules(self) -> "BookingRequest":`,
        explanation:
          'Với `mode="after"`, Pydantic đã ép kiểu và kiểm tra xong từng trường (`self.start_day` và `self.end_day` chắc chắn đã là `int`). Hàm nhận trực tiếp instance `self` với đầy đủ gợi ý kiểu (Type Hints) thay vì một `dict` thô.',
      },
      {
        stepTitle: 'Bước 2: Kiểm tra điều kiện chéo và trả về `self`',
        codeSnippet: `        if self.end_day <= self.start_day:\n            raise ValueError("end_day must be greater than start_day")\n        if self.is_vip and self.promo_code is not None:\n            raise ValueError("VIP bookings cannot combine with promo_code")\n        return self`,
        explanation:
          'Khác với `@root_validator` rắc rối của Pydantic v1, `@model_validator(mode="after")` đọc tự nhiên như một phương thức OOP thông thường và kết thúc bằng `return self`.',
      },
    ],
    commonMistakes: [
      'Quên `return self` ở cuối hàm `@model_validator(mode="after")`, khiến kết quả khởi tạo `BookingRequest(...)` trả về `None`!',
      'Dùng `@root_validator` của Pydantic v1 đã bị ngừng hỗ trợ.',
    ],
    testCases: [
      {
        id: 'tc-52-1',
        description: 'Sử dụng @model_validator(mode="after") kiểm tra end_day <= start_day',
        inputDescription: 'BookingRequest(start_day=10, end_day=15)',
        expectedOutput: 'BookingRequest(start_day=10, end_day=15, is_vip=False, promo_code=None)',
        requiredPatterns: [
          '@model_validator(mode="after")',
          'self.end_day <= self.start_day',
          'raise ValueError',
          'return self',
        ],
        forbiddenPatterns: [
          {
            pattern: '@root_validator',
            reason: '`@root_validator` là cú pháp cũ của Pydantic v1! Hãy dùng `@model_validator(mode="after")`.',
          },
        ],
      },
      {
        id: 'tc-52-2',
        description: 'Kiểm tra ràng buộc kết hợp giữa self.is_vip và self.promo_code',
        inputDescription: 'BookingRequest(start_day=1, end_day=5, is_vip=True, promo_code="SALE50")',
        expectedOutput: 'ValidationError: VIP bookings cannot combine with promo_code',
        requiredPatterns: ['self.is_vip', 'self.promo_code'],
      },
    ],
  },
  {
    id: 'ex-s4-fastapi-depends-yield',
    title: 'Bài 53: Tiêm Phụ thuộc AsyncSession An toàn trong FastAPI bằng Depends(get_db) có yield',
    category: 'architecture',
    stageId: 'stage-4',
    level: 'pro',
    relatedLessonId: 's4-fastapi-di-pydantic',
    problemStatement:
      'Một lỗi chí mạng làm sập hệ thống FastAPI sau vài giờ chạy tải cao là mở kết nối Database trong từng API endpoint nhưng quên đóng khi xảy ra Exception, dẫn đến lỗi `QueuePool limit of size 5 overflow 10 reached`. Hãy viết hàm Dependency Generator `async def get_db()` sử dụng `async with async_session_maker() as session:` kết hợp `try: yield session` và `except Exception: await session.rollback(); raise`, sau đó tiêm vào endpoint bằng `db: AsyncSession = Depends(get_db)`.',
    realWorldContext:
      'Hệ thống Dependency Injection (`Depends`) của FastAPI cực kỳ thông minh: khi bạn truyền một hàm có `yield` vào `Depends(get_db)`, FastAPI tự động biến phần trước `yield` thành Middleware trước Request và phần sau `yield` (bao gồm đóng kết nối của `async with`) thành khối dọn dẹp sau khi Response đã gửi xong!',
    requirements: [
      'Viết `async def get_db()` mở phiên kết nối bằng `async with async_session_maker() as session:`',
      'Dùng `try: yield session` và bắt `except Exception:` để gọi `await session.rollback()` rồi `raise` lại lỗi',
      'Tiêm dependency vào hàm `create_item_endpoint` bằng cú pháp `db: AsyncSession = Depends(get_db)`',
    ],
    starterCode: `from fastapi import Depends

# Giả lập lớp AsyncSession và factory cho môi trường bài tập
class AsyncSession:
    async def rollback(self) -> None: ...
    async def __aenter__(self) -> "AsyncSession": return self
    async def __aexit__(self, *args) -> None: ...

def async_session_maker() -> AsyncSession:
    return AsyncSession()

async def get_db():
    # TODO: Dùng 'async with async_session_maker() as session:'
    # kết hợp try: yield session và except Exception: await session.rollback(); raise
    pass

# TODO: Bổ sung tham số db: AsyncSession = Depends(get_db) vào chữ ký hàm bên dưới
async def create_item_endpoint(name: str) -> dict:
    return {"name": name, "db_injected": db is not None}
`,
    solutionCode: `from fastapi import Depends

class AsyncSession:
    async def rollback(self) -> None: ...
    async def __aenter__(self) -> "AsyncSession": return self
    async def __aexit__(self, *args) -> None: ...

def async_session_maker() -> AsyncSession:
    return AsyncSession()

async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise

async def create_item_endpoint(name: str, db: AsyncSession = Depends(get_db)) -> dict:
    return {"name": name, "db_injected": db is not None}
`,
    hints: [
      'Gợi ý 1: Trong `async def get_db():`, mở đầu bằng `async with async_session_maker() as session:`.',
      'Gợi ý 2: Bên trong khối `async with`, viết `try:\n            yield session\n        except Exception:\n            await session.rollback()\n            raise`.',
      'Gợi ý 3: Sửa chữ ký hàm endpoint thành `async def create_item_endpoint(name: str, db: AsyncSession = Depends(get_db)) -> dict:`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Quản lý vòng đời `AsyncSession` bằng `async with` và `yield`',
        codeSnippet: `async def get_db():\n    async with async_session_maker() as session:\n        try:\n            yield session\n        except Exception:\n            await session.rollback()\n            raise`,
        explanation:
          'Khi endpoint xử lý xong, luồng điều khiển quay lại sau dòng `yield session`, thoát khỏi khối `async with` và tự động gọi `await session.close()` trả kết nối về Connection Pool. Nếu endpoint gặp lỗi bất kỳ, khối `except` sẽ `rollback()` giao dịch dở dang và `raise` lại lỗi cho FastAPI xử lý.',
      },
      {
        stepTitle: 'Bước 2: Tiêm phụ thuộc với `Depends(get_db)`',
        codeSnippet: `async def create_item_endpoint(name: str, db: AsyncSession = Depends(get_db)) -> dict:`,
        explanation:
          'Nhờ `Depends(get_db)`, khi viết Integration Test bạn có thể dễ dàng ghi đè `app.dependency_overrides[get_db] = override_get_test_db` mà không cần sửa một dòng code nào trong Router!',
      },
    ],
    commonMistakes: [
      'Dùng `return session` thay vì `yield session` trong `get_db()` — nếu dùng `return` bên trong `async with`, phiên kết nối sẽ bị đóng NGAY LẬP TỨC trước khi hàm endpoint kịp chạy truy vấn!',
      'Bắt `except Exception:` để `await session.rollback()` nhưng quên viết lệnh `raise` không đối số ở dòng tiếp theo, khiến lỗi bị nuốt chửng và FastAPI tưởng endpoint chạy thành công.',
    ],
    testCases: [
      {
        id: 'tc-53-1',
        description: 'Viết hàm get_db() dùng async with, yield session và rollback khi lỗi',
        inputDescription: 'gen = get_db(); session = await anext(gen)',
        expectedOutput: '<AsyncSession active>',
        requiredPatterns: [
          'async with async_session_maker() as session:',
          'yield session',
          'await session.rollback()',
          'raise',
        ],
        forbiddenPatterns: [
          {
            pattern: 'return session',
            reason: 'Không dùng `return session` trong `get_db()`! Phải dùng `yield session` để giữ phiên kết nối mở trong suốt thời gian chạy endpoint.',
          },
        ],
      },
      {
        id: 'tc-53-2',
        description: 'Tiêm Dependency vào endpoint bằng Depends(get_db)',
        inputDescription: 'await create_item_endpoint("MacBook", db=session)',
        expectedOutput: "{'name': 'MacBook', 'db_injected': True}",
        requiredPatterns: ['db: AsyncSession = Depends(get_db)'],
      },
    ],
  },
  {
    id: 'ex-s4-fastapi-rbac-guard',
    title: 'Bài 54: Xây dựng Dependency Phân quyền RBAC (require_role("admin")) trả về HTTPException(403)',
    category: 'architecture',
    stageId: 'stage-4',
    level: 'pro',
    relatedLessonId: 's4-fastapi-di-pydantic',
    problemStatement:
      'Trong Express.js bạn thường dùng `app.delete("/users/:id", requireRole("admin"), handler)`. Trong FastAPI, cách thiết kế tương đương là viết một **Parameterized Dependency Factory** (Hàm bậc cao trả về một Dependency): `def require_role(required_role: str)`. Hàm con bên trong `def role_checker(current_user: dict = Depends(get_current_user)) -> dict:` sẽ kiểm tra nếu `current_user.get("role") != required_role` thì lập tức ném `raise HTTPException(status_code=403, detail="Forbidden")`, ngược lại trả về `current_user`.',
    realWorldContext:
      'Kiến trúc phân quyền dựa trên vai trò (Role-Based Access Control - RBAC) giúp bạn bảo vệ hàng chục API quản trị chỉ bằng `user: dict = Depends(require_role("admin"))` mà không phải lặp lại câu lệnh `if user.role != "admin":` ở mọi nơi.',
    requirements: [
      'Viết hàm factory `def require_role(required_role: str)` trả về hàm `role_checker`',
      'Trong `role_checker(current_user: dict = Depends(get_current_user))`, kiểm tra `current_user.get("role") != required_role`',
      'Ném `raise HTTPException(status_code=403, detail="Forbidden")` khi không đủ quyền, hoặc `return current_user` nếu hợp lệ',
    ],
    starterCode: `from fastapi import Depends, HTTPException

def get_current_user() -> dict:
    return {"username": "bob", "role": "viewer"}

def require_role(required_role: str):
    # TODO: Định nghĩa hàm role_checker(current_user: dict = Depends(get_current_user)) -> dict:
    # kiểm tra role, raise HTTPException(status_code=403, detail="Forbidden") nếu sai,
    # và trả về hàm role_checker từ require_role
    pass
`,
    solutionCode: `from fastapi import Depends, HTTPException

def get_current_user() -> dict:
    return {"username": "bob", "role": "viewer"}

def require_role(required_role: str):
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") != required_role:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current_user

    return role_checker
`,
    hints: [
      'Gợi ý 1: Bên trong `require_role(required_role: str)`, định nghĩa hàm lồng nhau `def role_checker(current_user: dict = Depends(get_current_user)) -> dict:`.',
      'Gợi ý 2: Kiểm tra `if current_user.get("role") != required_role:` thì `raise HTTPException(status_code=403, detail="Forbidden")`, ngược lại `return current_user`.',
      'Gợi ý 3: Ở cuối hàm `require_role`, nhớ trả về chính hàm con `return role_checker` (không có dấu ngoặc tròn `()`).',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Ứng dụng Closure để truyền tham số cho Dependency của FastAPI',
        codeSnippet: `def require_role(required_role: str):\n    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:`,
        explanation:
          'Vì `Depends(...)` cần một hàm có thể gọi được (Callable), việc viết `Depends(require_role("admin"))` sẽ gọi `require_role("admin")` lúc khởi động để tạo ra một hàm `role_checker` đã ghi nhớ giá trị `required_role = "admin"` trong Closure.',
      },
      {
        stepTitle: 'Bước 2: Phân biệt rõ mã lỗi HTTP 401 (Chưa xác thực) và 403 (Không đủ quyền)',
        codeSnippet: `        if current_user.get("role") != required_role:\n            raise HTTPException(status_code=403, detail="Forbidden")\n        return current_user\n\n    return role_checker`,
        explanation:
          'Khi người dùng đã đăng nhập hợp lệ (`get_current_user` thành công) nhưng vai trò là `"viewer"` thay vì `"admin"`, chuẩn HTTP RFC bắt buộc trả về `403 Forbidden` (không dùng `401 Unauthorized`).',
      },
    ],
    commonMistakes: [
      'Viết `return role_checker()` (có dấu ngoặc tròn) ở cuối `require_role`, khiến hàm bị thực thi ngay lúc định nghĩa route thay vì đợi lúc có HTTP Request gửi tới.',
      'Trả về `return HTTPException(...)` thay vì `raise HTTPException(...)` — trong FastAPI, `HTTPException` phải được `raise` để ngắt luồng thực thi ngay lập tức!',
    ],
    testCases: [
      {
        id: 'tc-54-1',
        description: 'Tạo Closure role_checker sử dụng Depends(get_current_user)',
        inputDescription: 'checker = require_role("admin"); checker({"username": "alice", "role": "admin"})',
        expectedOutput: "{'username': 'alice', 'role': 'admin'}",
        requiredPatterns: [
          'def require_role(',
          'def role_checker(',
          'Depends(get_current_user)',
          'return current_user',
          'return role_checker',
        ],
      },
      {
        id: 'tc-54-2',
        description: 'Ném HTTPException(status_code=403, detail="Forbidden") khi sai role',
        inputDescription: 'checker = require_role("admin"); checker({"username": "bob", "role": "viewer"})',
        expectedOutput: 'HTTPException(status_code=403, detail="Forbidden")',
        requiredPatterns: ['raise HTTPException', 'status_code=403', '"Forbidden"'],
        forbiddenPatterns: [
          {
            pattern: 'return HTTPException',
            reason: 'Phải dùng `raise HTTPException(...)` chứ không phải `return HTTPException(...)`!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s4-sqlalchemy-mapped-20',
    title: 'Bài 55: Định nghĩa Bảng ORM Chuẩn SQLAlchemy 2.0 với Mapped[T] & mapped_column()',
    category: 'architecture',
    stageId: 'stage-4',
    level: 'pro',
    relatedLessonId: 's4-sqlalchemy-clean-arch',
    problemStatement:
      'Trong SQLAlchemy 1.x cũ (và nhiều câu trả lời lỗi thời của AI), các cột được khai báo bằng `id = Column(Integer, primary_key=True)` khiến trình kiểm tra kiểu tĩnh (Mypy/Pyright) không thể biết `user.id` là `int` hay là một đối tượng `Column`! **SQLAlchemy 2.0** đã cách mạng hóa toàn bộ cú pháp bằng `DeclarativeBase`, `Mapped[T]` và `mapped_column()`. Hãy nâng cấp model `UserORM` sang chuẩn SQLAlchemy 2.0: `id: Mapped[int] = mapped_column(primary_key=True)`, `email: Mapped[str] = mapped_column(String(255), unique=True, index=True)`, và cột có thể `NULL` là `bio: Mapped[str | None] = mapped_column(default=None)`.',
    realWorldContext:
      'Với `Mapped[str | None]`, SQLAlchemy 2.0 tự động suy luận ra cột `bio` trong cơ sở dữ liệu có `nullable=True`, còn `email: Mapped[str]` tự động có `nullable=False` mà không cần gõ lặp lại!',
    requirements: [
      'Khai báo `id: Mapped[int] = mapped_column(primary_key=True)`',
      'Khai báo `email: Mapped[str] = mapped_column(String(255), unique=True, index=True)`',
      'Khai báo `bio: Mapped[str | None] = mapped_column(default=None)`',
    ],
    starterCode: `from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class UserORM(Base):
    __tablename__ = "users"

    # TODO: Thay thế cú pháp cũ hoặc hoàn thiện 3 cột id, email, bio
    # theo chuẩn SQLAlchemy 2.0 (Mapped[...] = mapped_column(...))
    pass
`,
    solutionCode: `from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class UserORM(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    bio: Mapped[str | None] = mapped_column(default=None)
`,
    hints: [
      'Gợi ý 1: Khai báo khóa chính `id: Mapped[int] = mapped_column(primary_key=True)`.',
      'Gợi ý 2: Khai báo `email: Mapped[str] = mapped_column(String(255), unique=True, index=True)`.',
      'Gợi ý 3: Khai báo cột cho phép NULL bằng Union Type: `bio: Mapped[str | None] = mapped_column(default=None)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Suy luận kiểu cột và `NOT NULL` tự động từ `Mapped[T]`',
        codeSnippet: `    id: Mapped[int] = mapped_column(primary_key=True)\n    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)`,
        explanation:
          'Trong SQLAlchemy 2.0, bạn không cần truyền `Integer` vào `mapped_column` cho cột `id` vì SQLAlchemy đọc trực tiếp từ `Mapped[int]`. Đồng thời vì `Mapped[str]` không có `| None`, cột `email` mặc định là `NOT NULL` trong DDL.',
      },
      {
        stepTitle: 'Bước 2: Biểu diễn cột `NULLABLE` bằng `Mapped[str | None]`',
        codeSnippet: `    bio: Mapped[str | None] = mapped_column(default=None)`,
        explanation:
          'Khi Pyright/VS Code nhìn thấy `user.bio`, nó sẽ cảnh báo ngay nếu bạn gọi `user.bio.upper()` mà chưa kiểm tra `if user.bio is not None:` — giúp triệt tiêu lỗi `AttributeError: NoneType` từ lúc gõ code!',
      },
    ],
    commonMistakes: [
      'Vẫn dùng `Column(Integer, primary_key=True)` và `declarative_base()` của SQLAlchemy 1.x — cú pháp legacy này làm mất hoàn toàn khả năng kiểm tra kiểu tĩnh với Pyright/Mypy.',
      'Viết `bio: Mapped[str] = mapped_column(default=None)` mà thiếu `| None` bên trong `Mapped[...]`, khiến SQLAlchemy vẫn tạo cột `NOT NULL` dưới Database!',
    ],
    testCases: [
      {
        id: 'tc-55-1',
        description: 'Khai báo id và email với Mapped[int], Mapped[str] và mapped_column',
        inputDescription: 'UserORM.__table__.columns.keys()',
        expectedOutput: "['id', 'email', 'bio']",
        requiredPatterns: [
          'id: Mapped[int] = mapped_column(primary_key=True)',
          'email: Mapped[str] = mapped_column(String(255), unique=True, index=True)',
        ],
        forbiddenPatterns: [
          {
            pattern: 'Column(',
            reason: 'Không dùng `Column(...)` của SQLAlchemy 1.x! Hãy dùng `Mapped[T]` và `mapped_column(...)` chuẩn SQLAlchemy 2.0.',
          },
        ],
      },
      {
        id: 'tc-55-2',
        description: 'Khai báo cột nullable bio với Mapped[str | None]',
        inputDescription: 'UserORM.__table__.c.bio.nullable',
        expectedOutput: 'True',
        requiredPatterns: ['bio: Mapped[str | None] = mapped_column(default=None)'],
      },
    ],
  },
  {
    id: 'ex-s4-sqlalchemy-n-plus-1',
    title: 'Bài 56: Săn Bug MissingGreenlet & Chống N+1 Query bằng selectinload()',
    category: 'debug-rescue',
    stageId: 'stage-4',
    level: 'pro',
    relatedLessonId: 's4-sqlalchemy-clean-arch',
    problemStatement:
      'Khi dùng **Async SQLAlchemy** trong FastAPI, nếu bạn truy vấn `select(Author)` rồi truy cập thuộc tính quan hệ `author.books`, ứng dụng sẽ sập ngay lập tức với lỗi khét tiếng: `sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called; can\'t call await_only() here`! Nguyên nhân là Async SQLAlchemy cấm Lazy Loading ngầm (vì truy cập thuộc tính `author.books` bằng dấu chấm không có từ khóa `await`, và nếu cho phép sẽ gây ra thảm họa **N+1 Query**). Hãy sửa hàm `get_authors_with_books(session)` bằng cách nạp trước (`Eager Loading`) quan hệ `Author.books` với `.options(selectinload(Author.books))`!',
    realWorldContext:
      'Đây là lỗi số 1 mà 100% lập trình viên Backend Python đều đụng phải khi chuyển sang `AsyncSession`. Dùng `selectinload()` vừa giải cứu lỗi `MissingGreenlet`, vừa gom 100 câu query lẻ thành đúng 1 câu `SELECT ... WHERE author_id IN (...)` siêu tốc.',
    requirements: [
      'Sử dụng `select(Author).options(selectinload(Author.books))` để bật Eager Loading',
      'Thực thi truy vấn bất đồng bộ bằng `result = await session.execute(stmt)`',
      'Trả về danh sách tác giả bằng `return list(result.scalars().all())`',
    ],
    starterCode: `from sqlalchemy import select
from sqlalchemy.orm import selectinload

class Author:
    books = "Author.books_relationship"

async def get_authors_with_books(session) -> list[Author]:
    # BUG: Truy vấn thiếu .options(selectinload(Author.books)) sẽ gây lỗi MissingGreenlet
    # khi Pydantic hoặc Router đọc author.books!
    stmt = select(Author)
    result = await session.execute(stmt)
    # TODO: Sửa lại câu lệnh stmt ở trên có .options(selectinload(Author.books))
    # và trả về list(result.scalars().all())
    pass
`,
    solutionCode: `from sqlalchemy import select
from sqlalchemy.orm import selectinload

class Author:
    books = "Author.books_relationship"

async def get_authors_with_books(session) -> list[Author]:
    stmt = select(Author).options(selectinload(Author.books))
    result = await session.execute(stmt)
    return list(result.scalars().all())
`,
    hints: [
      'Gợi ý 1: Nối chuỗi `.options(selectinload(Author.books))` vào ngay sau `select(Author)`.',
      'Gợi ý 2: Giữ nguyên `result = await session.execute(stmt)`.',
      'Gợi ý 3: Trả về `return list(result.scalars().all())`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Hiểu bản chất lỗi `MissingGreenlet` trong Async ORM',
        codeSnippet: `    stmt = select(Author).options(selectinload(Author.books))`,
        explanation:
          'Trong Python, cú pháp truy cập thuộc tính `author.books` là đồng bộ (không có `await`). Do đó SQLAlchemy Async cố tình chặn Lazy Loading để buộc lập trình viên phải khai báo tường minh những bảng liên kết nào cần nạp qua `selectinload()` hoặc `joinedload()`.',
      },
      {
        stepTitle: 'Bước 2: Trích xuất đối tượng ORM bằng `.scalars().all()`',
        codeSnippet: `    result = await session.execute(stmt)\n    return list(result.scalars().all())`,
        explanation:
          'Trong SQLAlchemy 2.0, `session.execute(select(Author))` trả về các dòng dạng Tuple `(Author,)`. Phương thức `.scalars()` giúp bóc lớp Tuple ngoài cùng để lấy trực tiếp các đối tượng `Author`.',
      },
    ],
    commonMistakes: [
      'Bật `lazy="selectin"` trên mọi relationship ở tầng Model — việc này rất nguy hiểm vì bất kỳ câu truy vấn nhỏ nào lấy `Author` cũng tự động kéo theo hàng loạt bảng con dù API đó không hề cần hiển thị sách.',
      'Quên gọi `.scalars()` trước `.all()`, dẫn đến danh sách trả về là `list[Row[tuple[Author]]]` thay vì `list[Author]`.',
    ],
    testCases: [
      {
        id: 'tc-56-1',
        description: 'Sử dụng select(Author).options(selectinload(Author.books)) chống N+1 và MissingGreenlet',
        inputDescription: 'await get_authors_with_books(async_session)',
        expectedOutput: '[Author(id=1, books=[Book(id=10), Book(id=11)])]',
        requiredPatterns: [
          'select(Author)',
          '.options(',
          'selectinload(Author.books)',
          'await session.execute(stmt)',
        ],
      },
      {
        id: 'tc-56-2',
        description: 'Trả về danh sách đối tượng ORM qua result.scalars().all()',
        inputDescription: 'type(authors[0])',
        expectedOutput: "<class 'Author'>",
        requiredPatterns: ['result.scalars().all()'],
      },
    ],
  },
  {
    id: 'ex-s4-clean-arch-repo',
    title: 'Bài 57: Triển khai Tầng UserRepository Tách biệt Truy vấn SQL khỏi FastAPI Router',
    category: 'architecture',
    stageId: 'stage-4',
    level: 'pro',
    relatedLessonId: 's4-sqlalchemy-clean-arch',
    problemStatement:
      'Một анти-pattern phổ biến là viết tràn lan các câu lệnh `await session.execute(select(User).where(...))` ngay bên trong hàm Router của FastAPI, khiến code nghiệp vụ bị khóa chặt vào SQLAlchemy và cực kỳ khó viết Unit Test. Theo **Clean Architecture / Repository Pattern**, hãy xây dựng lớp `UserRepository` nhận `session` qua `__init__`, cài đặt phương thức `async def get_by_email(self, email: str)` sử dụng `select(User).where(User.email == email)` và trả về `result.scalar_one_or_none()`.',
    realWorldContext:
      'Khi gom toàn bộ truy vấn vào `UserRepository`, tầng Service và Router chỉ cần gọi `await user_repo.get_by_email(email)`. Khi viết Unit Test cho Service, bạn có thể truyền một `InMemoryUserRepository` giả lập chạy trong 0.1ms mà không cần bật PostgreSQL!',
    requirements: [
      'Lưu `self.session = session` trong `__init__(self, session)` của `UserRepository`',
      'Trong `async def get_by_email(self, email: str)`, tạo câu lệnh `stmt = select(User).where(User.email == email)`',
      'Thực thi `result = await self.session.execute(stmt)` và trả về `return result.scalar_one_or_none()`',
    ],
    starterCode: `from sqlalchemy import select

class User:
    email = "email_column"

class UserRepository:
    def __init__(self, session) -> None:
        # TODO: Lưu self.session = session
        pass

    async def get_by_email(self, email: str) -> User | None:
        # TODO: Tạo stmt = select(User).where(User.email == email),
        # await self.session.execute(stmt) và trả về result.scalar_one_or_none()
        pass
`,
    solutionCode: `from sqlalchemy import select

class User:
    email = "email_column"

class UserRepository:
    def __init__(self, session) -> None:
        self.session = session

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
`,
    hints: [
      'Gợi ý 1: Trong `__init__`, gán `self.session = session`.',
      'Gợi ý 2: Trong `get_by_email`, viết `stmt = select(User).where(User.email == email)` và `result = await self.session.execute(stmt)`.',
      'Gợi ý 3: Trả về `return result.scalar_one_or_none()`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Đóng gói `AsyncSession` bên trong Repository',
        codeSnippet: `class UserRepository:\n    def __init__(self, session) -> None:\n        self.session = session`,
        explanation:
          'Repository đóng vai trò như một tập hợp (Collection) các đối tượng Domain. Các tầng phía trên hoàn toàn không cần import `select`, `where` hay biết cơ sở dữ liệu bên dưới là PostgreSQL hay SQLite.',
      },
      {
        stepTitle: 'Bước 2: Sử dụng `.scalar_one_or_none()` cho truy vấn theo cột Unique',
        codeSnippet: `    async def get_by_email(self, email: str) -> User | None:\n        stmt = select(User).where(User.email == email)\n        result = await self.session.execute(stmt)\n        return result.scalar_one_or_none()`,
        explanation:
          'Phương thức `.scalar_one_or_none()` trả về `User` nếu tìm thấy đúng 1 bản ghi, trả về `None` nếu không có bản ghi nào, và ném lỗi `MultipleResultsFound` nếu dữ liệu bị trùng lặp bất thường.',
      },
    ],
    commonMistakes: [
      'Gọi `await self.session.commit()` ngay bên trong mọi hàm nhỏ của Repository — việc commit nên thuộc về tầng Service / Unit of Work để có thể gộp nhiều thao tác Repository vào chung 1 giao dịch nguyên tử (Atomic Transaction).',
      'Ném `HTTPException(status_code=404)` ngay bên trong `UserRepository` — tầng Data Access tuyệt đối không được biết về giao thức HTTP! Hãy trả về `None` để tầng Router/Service quyết định.',
    ],
    testCases: [
      {
        id: 'tc-57-1',
        description: 'Khởi tạo UserRepository với self.session và truy vấn select(User).where(...)',
        inputDescription: 'repo = UserRepository(session); await repo.get_by_email("dev@pymastery.io")',
        expectedOutput: 'User(id=1, email="dev@pymastery.io")',
        requiredPatterns: [
          'self.session = session',
          'select(User).where(User.email == email)',
          'await self.session.execute(stmt)',
        ],
        forbiddenPatterns: [
          {
            pattern: 'HTTPException',
            reason: 'Tầng Repository không được phụ thuộc vào FastAPI `HTTPException`! Hãy trả về `User | None`.',
          },
        ],
      },
      {
        id: 'tc-57-2',
        description: 'Trả về kết quả bằng result.scalar_one_or_none()',
        inputDescription: 'await repo.get_by_email("notfound@pymastery.io")',
        expectedOutput: 'None',
        requiredPatterns: ['result.scalar_one_or_none()'],
      },
    ],
  },
  {
    id: 'ex-s4-response-model-leak',
    title: 'Bài 58: Săn Bug Lộ password_hash trong API bằng Tách biệt UserCreate và UserRead Schema',
    category: 'debug-rescue',
    stageId: 'stage-4',
    level: 'pro',
    relatedLessonId: 's4-fastapi-di-pydantic',
    problemStatement:
      'Một lỗ hổng bảo mật kinh điển (OWASP API3: Excessive Data Exposure) xảy ra khi lập trình viên dùng chung 1 class `UserSchema` cho cả đầu vào đăng ký lẫn đầu ra API, hoặc trả thẳng đối tượng DB từ endpoint mà không khai báo `response_model=UserRead`. Kết quả là trường `password` / `password_hash` bị gửi trả về trình duyệt trong JSON response! Hãy sửa lỗ hổng này bằng cách: tách riêng `UserCreate` (có `password: str`) và `UserRead` (chỉ có `id: int` và `email: str`, KHÔNG có `password`), đồng thời gắn `response_model=UserRead` lên decorator `@app.post("/users", response_model=UserRead)`.',
    realWorldContext:
      'Khi bạn khai báo `response_model=UserRead`, FastAPI sẽ dùng Pydantic để lọc bỏ toàn bộ các trường nhạy cảm (`password_hash`, `is_internal_admin`, `totp_secret`) trước khi serialize thành chuỗi JSON gửi qua mạng.',
    requirements: [
      'Định nghĩa `UserCreate(BaseModel)` có `email: str` và `password: str`',
      'Định nghĩa `UserRead(BaseModel)` CHỈ có `id: int` và `email: str` (tuyệt đối không kế thừa `UserCreate` để tránh kế thừa trường `password`)',
      'Đính kèm `response_model=UserRead` vào `@app.post("/users", response_model=UserRead)`',
    ],
    starterCode: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# LỖ HỔNG BẢO MẬT: Dùng chung 1 Schema hoặc cho UserRead kế thừa UserCreate
# khiến trường password bị lộ ra ngoài JSON Response!
class UserCreate(BaseModel):
    email: str
    password: str

class UserRead(UserCreate):
    id: int

# TODO: Tách UserRead độc lập (chỉ gồm id: int và email: str, kế thừa BaseModel)
# và thêm response_model=UserRead vào @app.post bên dưới
@app.post("/users")
async def register_user(payload: UserCreate) -> dict:
    return {"id": 1, "email": payload.email, "password": payload.password}
`,
    solutionCode: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class UserCreate(BaseModel):
    email: str
    password: str

class UserRead(BaseModel):
    id: int
    email: str

@app.post("/users", response_model=UserRead)
async def register_user(payload: UserCreate) -> dict:
    return {"id": 1, "email": payload.email, "password": payload.password}
`,
    hints: [
      'Gợi ý 1: Sửa `class UserRead(UserCreate):` thành `class UserRead(BaseModel):` để không bị kế thừa trường `password` từ `UserCreate`.',
      'Gợi ý 2: Bên trong `UserRead(BaseModel)`, khai báo `id: int` và `email: str`.',
      'Gợi ý 3: Sửa decorator của hàm thành `@app.post("/users", response_model=UserRead)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Không bao giờ cho `UserRead` kế thừa `UserCreate` khi có trường mật khẩu',
        codeSnippet: `class UserCreate(BaseModel):\n    email: str\n    password: str\n\nclass UserRead(BaseModel):\n    id: int\n    email: str`,
        explanation:
          'Nếu `UserRead` kế thừa `UserCreate`, nó sẽ thừa hưởng luôn trường `password: str`. Thay vào đó, hãy để cả hai kế thừa `BaseModel` (hoặc tạo một `UserBase(BaseModel)` chỉ chứa `email: str` làm cha chung).',
      },
      {
        stepTitle: 'Bước 2: Bật màng lọc đầu ra bằng `response_model=UserRead`',
        codeSnippet: `@app.post("/users", response_model=UserRead)\nasync def register_user(payload: UserCreate) -> dict:\n    return {"id": 1, "email": payload.email, "password": payload.password}`,
        explanation:
          'Ngay cả khi dict hoặc đối tượng ORM trả về từ hàm `register_user` vẫn còn chứa `"password"`, FastAPI sẽ lọc qua `UserRead` và chỉ xuất ra `{"id": 1, "email": "..."}` về phía client.',
      },
    ],
    commonMistakes: [
      'Cho `class UserRead(UserCreate):` vì muốn tiết kiệm 1 dòng khai báo `email: str` — làm vậy sẽ vô tình xuất cả trường `password` ra tài liệu OpenAPI/Swagger và JSON trả về!',
      'Quên khai báo `response_model=UserRead` trên `@app.post(...)` trong khi hàm trả về một `dict` hoặc đối tượng ORM chứa `password_hash`.',
    ],
    testCases: [
      {
        id: 'tc-58-1',
        description: 'Tách biệt UserRead(BaseModel) không kế thừa UserCreate',
        inputDescription: 'UserRead.model_fields.keys()',
        expectedOutput: "dict_keys(['id', 'email'])",
        requiredPatterns: [
          'class UserCreate(BaseModel):',
          'class UserRead(BaseModel):',
          'id: int',
          'email: str',
        ],
        forbiddenPatterns: [
          {
            pattern: 'class UserRead(UserCreate)',
            reason: 'CẤM KỴ: `UserRead` kế thừa `UserCreate` sẽ làm lộ trường `password` ra ngoài API Response!',
          },
        ],
      },
      {
        id: 'tc-58-2',
        description: 'Khai báo chốt chặn response_model=UserRead trên decorator @app.post',
        inputDescription: 'POST /users {"email": "a@b.com", "password": "123"}',
        expectedOutput: '{"id": 1, "email": "a@b.com"}',
        requiredPatterns: ['@app.post("/users", response_model=UserRead)'],
      },
    ],
  },
];

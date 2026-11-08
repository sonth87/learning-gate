import { FlashcardItem } from '@/types/assessment.types';

export const FLASHCARDS_STAGE_3_TO_7: FlashcardItem[] = [
  // ============================================================================
  // STAGE 3: KIẾN TRÚC DỰ ÁN, PACKAGING, LOGGING & TESTING (10 CARDS: fc-51 -> fc-60)
  // ============================================================================
  {
    id: 'fc-51',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Quản lý Dự án & Packaging',
    frontQuestion: 'Cặp bài trùng `pyproject.toml` (PEP 621) và `uv.lock` giải quyết hạn chế chí mạng nào của file `requirements.txt` truyền thống?',
    frontHint: 'Direct Dependencies (Khai báo ý định) vs Transitive Dependencies + Cryptographic Hash Lock (Khóa tái lập 100%).',
    backAnswer:
      '`requirements.txt` trộn lẫn thư viện trực tiếp với thư viện phụ thuộc bắc cầu và không đảm bảo đồng nhất giữa các hệ điều hành. Chuẩn hiện đại dùng **`pyproject.toml`** để khai báo metadata dự án, cấu hình `ruff`/`pytest`/`pyright` và dải phiên bản thư viện chính; còn **`uv.lock`** khóa cứng chính xác phiên bản + mã băm SHA-256 của toàn bộ cây phụ thuộc, đảm bảo mọi máy Dev và CI/CD cài đặt giống nhau 100% (`uv sync --frozen`).',
    backAnalogy:
      '`pyproject.toml` là thực đơn các món khách gọi, còn `uv.lock` là phiếu xuất kho ghi rõ từng gam nguyên liệu kèm mã lô sản xuất chính xác.',
    codeSnippet: `# Cài đặt môi trường Production khớp tuyệt đối 100% với file lock:\n# uv sync --frozen --no-dev`,
    relatedTermIds: ['tool-pyproject-toml', 'tool-uv', 'concept-venv'],
  },
  {
    id: 'fc-52',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Kiến trúc Thư mục & Import',
    frontQuestion: 'Tại sao cấu trúc thư mục `src-layout` (`src/my_app/...`) kết hợp **Absolute Imports** lại an toàn hơn đặt code ngay ở thư mục gốc (`flat-layout`)?',
    frontHint: 'Ngăn chặn lỗi Pytest vô tình import code chưa đóng gói từ thư mục làm việc hiện tại (`sys.path[0] == ""`).',
    backAnswer:
      'Trong Python, thư mục hiện tại (`.` / `""`) luôn đứng đầu danh sách tìm kiếm `sys.path`. Với `flat-layout`, khi chạy test, Python sẽ import trực tiếp thư mục code cục bộ thay vì bản package đã cài đặt, che giấu lỗi thiếu file trong bản build thực tế. Đặt code vào **`src/my_app/`** buộc mọi lệnh import phải đi qua package đã cài đặt (`uv pip install -e .`), và dùng **Absolute Import** (`from my_app.services.auth import ...`) giúp dễ dàng di chuyển file mà không bị gãy đường dẫn.',
    backAnalogy:
      'Buộc nhân viên kiểm thử phải lấy sản phẩm đã đóng hộp trên kệ siêu thị (`src-layout`) để test, thay vì bốc đại nguyên liệu rời ngay trên bàn bếp (`flat-layout`).',
    codeSnippet: `# Luôn ưu tiên Absolute Import rõ ràng từ gốc package:\nfrom my_app.core.config import settings\nfrom my_app.repositories.user_repo import UserRepository`,
    relatedTermIds: ['concept-src-layout', 'kw-import', 'tool-pytest'],
  },
  {
    id: 'fc-53',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Kiến trúc Thư mục & Import',
    frontQuestion: 'File `__init__.py` và danh sách `__all__` đóng vai trò gì trong việc thiết kế Public API của một Python Package?',
    frontHint: 'Biến thư mục thành Regular Package và kiểm soát những gì được phép xuất khẩu ra ngoài.',
    backAnswer:
      'File **`__init__.py`** đánh dấu một thư mục là một **Regular Package** và được chạy ngay khi package đó được import lần đầu. Thay vì bắt người dùng nhớ đường dẫn nội bộ sâu (`from pkg.internal.v2.client import HttpClient`), bạn re-export tại `__init__.py` và khai báo **`__all__ = ["HttpClient"]`** để định nghĩa rõ ràng **Public API chính thức** (đồng thời báo cho `Pyright`/`Ruff` biết những biểu tượng nào là công khai).',
    backAnalogy:
      '`__init__.py` là quầy lễ tân tòa nhà, còn `__all__` là bảng danh mục các dịch vụ công khai mà khách hàng bên ngoài được phép liên hệ.',
    codeSnippet: `# Trong src/my_sdk/__init__.py:\nfrom my_sdk.client import HttpClient\nfrom my_sdk.exceptions import SdkError\n\n__all__ = ["HttpClient", "SdkError"]`,
    relatedTermIds: ['concept-package-init', 'kw-import', 'tool-ruff'],
  },
  {
    id: 'fc-54',
    stageId: 'stage-3',
    level: 'pro',
    category: 'Bẫy Kiến trúc & Type Hints',
    frontQuestion: 'Lỗi **Circular Import** (`ImportError: cannot import name ... from partially initialized module`) xảy ra khi nào và giải pháp chuẩn với `TYPE_CHECKING` là gì?',
    frontHint: 'Module `user.py` import `Order` chỉ để gõ Type Hint, trong khi `order.py` cũng import `User`!',
    backAnswer:
      'Circular Import xảy ra khi Module A đang chạy dở dòng `import B`, còn Module B lại quay ngược lại `from A import X` (lúc này X chưa kịp được định nghĩa trong A). Nếu việc import chỉ phục vụ mục đích **Type Hints**, hãy bật **`from __future__ import annotations`** (trì hoãn đánh giá Type Hint thành chuỗi) và đặt câu lệnh import vào trong khối **`if TYPE_CHECKING:`** (khối này luôn là `False` lúc Runtime nên không bao giờ gây vòng lặp import!).',
    backAnalogy:
      'Hai phòng ban chờ chữ ký của nhau lúc mở cửa (`Runtime`) sẽ gây tắc nghẽn; nhưng nếu chỉ cần đối chiếu bản vẽ trên máy tính (`TYPE_CHECKING`) thì không cần khóa cửa chờ nhau.',
    codeSnippet: `from __future__ import annotations\nfrom typing import TYPE_CHECKING\n\nif TYPE_CHECKING:\n    from my_app.models.order import Order  # Chỉ chạy trên Pyright, bỏ qua lúc Runtime!\n\nclass User:\n    orders: list[Order]`,
    relatedTermIds: ['concept-circular-import', 'concept-type-hints', 'tool-pyright'],
  },
  {
    id: 'fc-55',
    stageId: 'stage-3',
    level: 'pro',
    category: 'Cấu hình & Biến Môi trường',
    frontQuestion: 'Tại sao các dự án Production luôn dùng `pydantic-settings` (`BaseSettings`) thay vì gọi `os.getenv("DB_PORT")` rải rác khắp code?',
    frontHint: 'Triết lý Fail-Fast ngay lúc khởi động ứng dụng + Tự động ép kiểu và kiểm tra hợp lệ `.env`.',
    backAnswer:
      '`os.getenv()` luôn trả về `str | None` và nếu quên cấu hình một biến môi trường quan trọng, ứng dụng vẫn khởi động bình thường rồi mới nổ lỗi lúc 2 giờ sáng khi luồng code đó được gọi. Với **`BaseSettings`** của `pydantic-settings`, toàn bộ biến môi trường và file `.env` được nạp, ép kiểu (`int`, `bool`, `PostgresDsn`, `SecretStr`) và kiểm tra hợp lệ **ngay giây đầu tiên khi khởi động App (Fail-Fast)**.',
    backAnalogy:
      'Kiểm tra toàn bộ nhiên liệu, áp suất lốp và giấy phép bay ngay trên đường băng (`BaseSettings`) thay vì bay lên độ cao 10.000m mới phát hiện quên đổ xăng (`os.getenv`).',
    codeSnippet: `from pydantic import SecretStr\nfrom pydantic_settings import BaseSettings, SettingsConfigDict\n\nclass Settings(BaseSettings):\n    model_config = SettingsConfigDict(env_file=".env", extra="ignore")\n    db_url: str\n    jwt_secret: SecretStr\n    debug: bool = False\n\nsettings = Settings()  # Báo lỗi rõ ràng ngay lập tức nếu thiếu DB_URL!`,
    relatedTermIds: ['eco-pydantic', 'concept-fail-fast', 'eco-fastapi'],
  },
  {
    id: 'fc-56',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Logging & Observability',
    frontQuestion: 'Tại sao nghiêm cấm dùng `print()` trên hệ thống Production và ưu điểm của **Structured Logging** (`logging` / `structlog` xuất JSON) là gì?',
    frontHint: 'Log Levels, Context Variables (`request_id`), và khả năng truy vấn trên Datadog / ELK / Grafana Loki.',
    backAnswer:
      '`print()` ghi ra `stdout` không có cấp độ nghiêm trọng (`DEBUG`, `INFO`, `WARNING`, `ERROR`), không có timestamp/tên module, và không thể lọc hay tắt linh hoạt. Trong hệ thống Production, dùng **`logging`** hoặc **`structlog`** xuất ra định dạng **JSON có cấu trúc** (kèm `request_id`, `user_id`, `latency_ms`) giúp các hệ thống tập trung log như Grafana Loki, Datadog hay Elasticsearch đánh chỉ mục và lọc chính xác hàng triệu dòng log trong tích tắc.',
    backAnalogy:
      '`print()` là hét toáng lên giữa chợ không ai ghi chép; Structured Logging là biên bản sự việc có đóng dấu thời gian, mã hồ sơ và mức độ khẩn cấp lưu vào kho số hóa.',
    codeSnippet: `import logging\nlogger = logging.getLogger(__name__)\n\n# Luôn dùng tham số extra hoặc structlog để gắn ngữ cảnh có cấu trúc:\nlogger.info("Order created", extra={"order_id": 1024, "user_id": 42})`,
    relatedTermIds: ['stdlib-logging', 'concept-observability'],
  },
  {
    id: 'fc-57',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Testing với Pytest',
    frontQuestion: 'Cơ chế **Assert Introspection** của `pytest` hoạt động như thế nào và làm sao để kiểm tra một hàm bắt buộc phải ném ra Exception?',
    frontHint: 'Viết lại cây AST của câu lệnh `assert` bình thường + `with pytest.raises(..., match=...):`.',
    backAnswer:
      'Khác với `unittest` bắt phải nhớ hàng chục hàm `self.assertEqual()`, `self.assertIn()`, `pytest` dùng kỹ thuật **AST Rewriting** để can thiệp vào từ khóa `assert` nguyên bản của Python: khi `assert a == b` thất bại, `pytest` tự động bung chi tiết giá trị thực tế của từng biểu thức con và tô màu phần lệch (diff). Để test ngoại lệ, dùng Context Manager **`with pytest.raises(ValueError, match="...regex..."):`**.',
    backAnalogy:
      'Thay vì chỉ báo "Sai rồi", `pytest` đặt kính lúp chụp lại toàn bộ hiện trường hai bên dấu `==` để bạn thấy ngay lệch ở ký tự nào.',
    codeSnippet: `import pytest\n\ndef test_divide_by_zero() -> None:\n    with pytest.raises(ZeroDivisionError, match="division by zero"):\n        _ = 10 / 0`,
    relatedTermIds: ['tool-pytest', 'kw-assert', 'kw-raise'],
  },
  {
    id: 'fc-58',
    stageId: 'stage-3',
    level: 'pro',
    category: 'Testing với Pytest',
    frontQuestion: 'Cơ chế `@pytest.fixture` có `yield` và tham số `scope` (`"function"`, `"module"`, `"session"`) giúp quản lý tài nguyên kiểm thử như thế nào?',
    frontHint: 'Dependency Injection cho hàm test + Setup trước `yield` / Teardown sau `yield`.',
    backAnswer:
      '`@pytest.fixture` hoạt động theo cơ chế **Dependency Injection**: hàm test chỉ cần khai báo tên fixture trong danh sách tham số là `pytest` tự động khởi tạo và tiêm vào. Phần code trước `yield` là **Setup** (chuẩn bị dữ liệu/kết nối), còn sau `yield` là **Teardown** (xóa bảng/rollback transaction). Tham số `scope="session"` giúp các tài nguyên nặng (như khởi tạo Database Container) chỉ cần tạo **1 lần duy nhất** cho cả đợt chạy test.',
    backAnalogy:
      'Đội hậu cần chuẩn bị sân khấu trước giờ diễn (`trước yield`), bàn giao cho diễn viên (`yield`), và tự động thu dọn đạo cụ sau khi hạ màn (`sau yield`).',
    codeSnippet: `import pytest\n\n@pytest.fixture(scope="function")\ndef db_session():\n    session = create_test_session()\n    try:\n        yield session\n    finally:\n        session.rollback()\n        session.close()`,
    relatedTermIds: ['tool-pytest', 'kw-yield', 'concept-dependency-injection'],
  },
  {
    id: 'fc-59',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Testing với Pytest',
    frontQuestion: 'Làm thế nào để kiểm thử 10 bộ dữ liệu đầu vào/đầu ra (Edge cases) khác nhau cho cùng 1 hàm mà không phải copy-paste 10 hàm test?',
    frontHint: 'Data-driven testing với Decorator `@pytest.mark.parametrize`.',
    backAnswer:
      'Sử dụng **`@pytest.mark.parametrize("input_val, expected", [...])`**. `pytest` sẽ tự động tách mỗi tuple dữ liệu thành một ca kiểm thử (Test Case) độc lập hoàn toàn: nếu ca thứ 3 bị lỗi, các ca từ thứ 4 đến thứ 10 vẫn tiếp tục chạy bình thường và báo cáo rõ chính xác bộ tham số nào gây lỗi (khác hẳn với việc dùng vòng lặp `for` bên trong 1 hàm test sẽ dừng ngay ở lỗi đầu tiên).',
    backAnalogy:
      'Đưa một danh sách 10 kịch bản va chạm khác nhau vào băng chuyền thử nghiệm xe tự động, mỗi kịch bản xuất ra một biên bản đạt/trượt riêng biệt.',
    codeSnippet: `import pytest\n\n@pytest.mark.parametrize(\n    ("raw", "expected"),\n    [("  alice ", "alice"), ("BOB", "bob"), ("", "")],\n)\ndef test_normalize_username(raw: str, expected: str) -> None:\n    assert raw.strip().lower() == expected`,
    relatedTermIds: ['tool-pytest', 'concept-decorator'],
  },
  {
    id: 'fc-60',
    stageId: 'stage-3',
    level: 'pro',
    category: 'Testing & Mocking',
    frontQuestion: 'Quy tắc vàng khi dùng `unittest.mock.patch` ("Patch where it is USED, not where it is defined") có nghĩa là gì?',
    frontHint: 'Liên quan trực tiếp đến cơ chế gắn nhãn tên (Name Binding) của lệnh `from module_a import func`.',
    backAnswer:
      'Khi file `service.py` viết `from payment_sdk import charge_card`, nó đã tạo một nhãn tên cục bộ `service.charge_card` trỏ thẳng tới hàm gốc. Nếu trong test bạn viết `@patch("payment_sdk.charge_card")`, nhãn `service.charge_card` vẫn trỏ vào hàm thật! Do đó, **bắt buộc phải patch tại đúng namespace nơi hàm đó được GỌI**: `@patch("my_app.service.charge_card")` (hoặc dùng `AsyncMock` cho hàm `async def` và fixture `monkeypatch` của `pytest`).',
    backAnalogy:
      'Nếu nhân viên đã lưu số điện thoại thẳng vào danh bạ máy cá nhân (`service.py`), việc bạn sửa số trên cuốn niên giám tổng đài (`payment_sdk.py`) sẽ không có tác dụng — phải sửa ngay trong danh bạ của nhân viên đó.',
    codeSnippet: `from unittest.mock import AsyncMock, patch\n\nasync def test_checkout_calls_gateway() -> None:\n    with patch("my_app.services.order.charge_card", new_callable=AsyncMock) as mock_charge:\n        mock_charge.return_value = {"status": "paid"}\n        res = await process_order(order_id=1)\n        mock_charge.assert_awaited_once()`,
    relatedTermIds: ['tool-pytest', 'concept-pass-by-object-ref', 'kw-import'],
  },

  // ============================================================================
  // STAGE 4: BACKEND ENGINEERING VỚI FASTAPI, PYDANTIC V2 & SQLALCHEMY 2.0 (12 CARDS: fc-61 -> fc-72)
  // ============================================================================
  {
    id: 'fc-61',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Kiến trúc Web Server (ASGI vs WSGI)',
    frontQuestion: 'Sự khác biệt cốt lõi giữa giao thức **ASGI** (`Uvicorn` + `FastAPI`) và **WSGI** (`Gunicorn` + `Flask`/`Django` truyền thống) là gì?',
    frontHint: 'Asynchronous Non-blocking I/O + WebSockets/SSE vs Synchronous Blocking Request-Response.',
    backAnswer:
      '**WSGI** là giao thức đồng bộ (Synchronous) thế hệ cũ: mỗi HTTP request chiếm giữ cứng 1 Thread từ lúc nhận đến khi trả xong response và không hỗ trợ tốt kết nối hai chiều dài hạn. **ASGI (Asynchronous Server Gateway Interface)** là chuẩn bất đồng bộ hiện đại dựa trên Event Loop: một tiến trình `Uvicorn` đơn lẻ có thể xử lý **hàng chục nghìn kết nối đồng thời** (Concurrent I/O, WebSockets, HTTP/2, Server-Sent Events cho AI Streaming) mà không bị nghẽn Thread.',
    backAnalogy:
      'WSGI là mỗi nhân viên phục vụ phải đứng chờ chết chân trước bếp cho đến khi món chín mới được đi tiếp bàn khác; ASGI là nhân viên ghi đơn xong quay ra phục vụ 50 bàn khác ngay lập tức.',
    codeSnippet: `# Khởi chạy ASGI Server Uvicorn với vòng lặp uvloop viết bằng C:\n# uv run uvicorn my_app.main:app --host 0.0.0.0 --port 8000`,
    relatedTermIds: ['eco-fastapi', 'concept-asgi', 'concept-asyncio'],
  },
  {
    id: 'fc-62',
    stageId: 'stage-4',
    level: 'pro',
    category: 'FastAPI Core',
    frontQuestion: 'FastAPI phân biệt đâu là **Path Parameter**, **Query Parameter** và **JSON Request Body** từ chữ ký hàm Route Handler theo quy tắc nào?',
    frontHint: 'Dựa vào tên biến trên URL template và việc kiểu dữ liệu là kiểu nguyên thủy (`int`, `str`) hay lớp kế thừa `pydantic.BaseModel`.',
    backAnswer:
      'FastAPI đọc cây Type Hints (`__annotations__`) của hàm Route và phân giải theo 3 quy tắc: (1) Nếu tên tham số khớp với biến trong đường dẫn URL (`/users/{user_id}`) -> **Path Parameter**; (2) Nếu tham số là kiểu đơn lẻ (`int`, `str`, `bool`, `Enum`) không nằm trên URL -> **Query Parameter** (`?page=1`); (3) Nếu tham số có kiểu kế thừa từ **`pydantic.BaseModel`** -> **JSON Request Body**.',
    backAnalogy:
      'Bưu điện tự động phân loại: mã vùng ghi ngoài phong bì là Path, ghi chú dán thêm là Query, còn kiện hàng đóng thùng tiêu chuẩn (`BaseModel`) bên trong là Body.',
    codeSnippet: `@app.post("/users/{user_id}/items")\nasync def create_item(\n    user_id: int,               # 1. Path Parameter\n    notify: bool = False,       # 2. Query Parameter (?notify=true)\n    payload: ItemCreate = ...,  # 3. JSON Body (Pydantic BaseModel)\n): ...`,
    relatedTermIds: ['eco-fastapi', 'eco-pydantic', 'concept-type-hints'],
  },
  {
    id: 'fc-63',
    stageId: 'stage-4',
    level: 'pro',
    category: 'FastAPI & Dependency Injection',
    frontQuestion: 'Hệ thống Dependency Injection `Depends()` (kết hợp `yield`) trong FastAPI giải quyết những bài toán kiến trúc nào?',
    frontHint: 'Quản lý vòng đời Database Session, xác thực JWT User, phân quyền RBAC và dễ dàng Override khi viết Test.',
    backAnswer:
      '`Depends()` biến các hàm/callable thành một đồ thị phụ thuộc (Dependency Graph) tự động được giải quyết trước khi vào Route. Khi hàm Dependency dùng **`yield session`**, FastAPI chạy phần trước `yield` để cấp phát kết nối DB, tiêm vào Route, và đảm bảo chạy phần sau `yield` để đóng kết nối khi Request kết thúc. Đặc biệt, khi chạy Pytest, bạn có thể thay thế DB thật bằng Mock/Test DB chỉ với 1 dòng: **`app.dependency_overrides[get_db] = get_test_db`**.',
    backAnalogy:
      'Ổ cắm điện tiêu chuẩn (`Depends`): ngày thường cắm vào lưới điện thành phố (Production DB), khi kiểm định an toàn chỉ cần rút ra cắm vào máy phát điện giả lập (`dependency_overrides`).',
    codeSnippet: `CurrentUser = Annotated[User, Depends(get_current_active_user)]\nDbSession = Annotated[AsyncSession, Depends(get_db_session)]\n\n@router.get("/me")\nasync def read_profile(user: CurrentUser, db: DbSession) -> UserRead:\n    return UserRead.model_validate(user)`,
    relatedTermIds: ['eco-fastapi', 'concept-dependency-injection', 'kw-yield'],
  },
  {
    id: 'fc-64',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Pydantic v2 & Data Validation',
    frontQuestion: 'Tại sao Pydantic v2 nhanh gấp 5x–50x so với v1 và tại sao bắt buộc phải tách riêng các Schema `UserCreate`, `UserUpdate`, `UserRead`?',
    frontHint: 'Lõi `pydantic-core` viết bằng Rust + Ngăn chặn lỗ hổng lộ `password_hash` hoặc Mass Assignment.',
    backAnswer:
      'Pydantic v2 viết lại toàn bộ nhân kiểm tra hợp lệ và tuần tự hóa JSON (`model_validate`, `model_validate_json`, `model_dump`) bằng ngôn ngữ **Rust (`pydantic-core`)**. Về kiến trúc, tuyệt đối không dùng chung 1 class cho mọi việc: **`UserCreate`** nhận `password` thô từ client; **`UserModel` (ORM)** lưu `password_hash` xuống DB; còn **`UserRead`** chỉ trả về `id`, `email`, `created_at` để không bao giờ làm lộ mật khẩu băm hay cho phép người dùng tự gửi `is_admin=True` (Mass Assignment).',
    backAnalogy:
      'Tờ khai đăng ký khám bệnh (`UserCreate`), hồ sơ bệnh án mật của bác sĩ (`ORM Model`) và giấy chứng nhận sức khỏe cấp ra ngoài (`UserRead`) phải là 3 biểu mẫu tách biệt.',
    codeSnippet: `from pydantic import BaseModel, EmailStr, Field\n\nclass UserCreate(BaseModel):\n    email: EmailStr\n    password: str = Field(min_length=8, max_length=128)\n\nclass UserRead(BaseModel):\n    id: int\n    email: EmailStr`,
    relatedTermIds: ['eco-pydantic', 'eco-fastapi'],
  },
  {
    id: 'fc-65',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Pydantic v2 & Data Validation',
    frontQuestion: 'Sự khác biệt giữa `@field_validator(..., mode="before" | "after")` và `@model_validator(mode="after")` trong Pydantic v2 là gì?',
    frontHint: 'Kiểm tra từng trường đơn lẻ (trước/sau khi ép kiểu Rust) vs Kiểm tra chéo nhiều trường cùng lúc (Cross-field validation).',
    backAnswer:
      '**`@field_validator`** kiểm tra 1 trường duy nhất: `mode="before"` chạy trên dữ liệu thô trước khi Pydantic ép kiểu (dùng để chuẩn hóa/strip chuỗi), còn `mode="after"` (mặc định, an toàn hơn) chạy sau khi dữ liệu đã đúng kiểu khai báo. **`@model_validator(mode="after")`** nhận toàn bộ `self` sau khi tất cả các trường đã hợp lệ, chuyên dùng để **kiểm tra chéo giữa nhiều trường** (ví dụ: `start_date < end_date` hoặc `password == confirm_password`).',
    backAnalogy:
      '`@field_validator` là kiểm tra từng món hành lý riêng lẻ, còn `@model_validator` là cân tổng trọng lượng của tất cả các túi cộng lại xem có vượt hạn mức của vé không.',
    codeSnippet: `from pydantic import BaseModel, model_validator\n\nclass DateRange(BaseModel):\n    start_ts: int\n    end_ts: int\n\n    @model_validator(mode="after")\n    def check_order(self) -> "DateRange":\n        if self.end_ts <= self.start_ts:\n            raise ValueError("end_ts phải lớn hơn start_ts")\n        return self`,
    relatedTermIds: ['eco-pydantic', 'concept-decorator'],
  },
  {
    id: 'fc-66',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Pydantic v2 & SQLAlchemy',
    frontQuestion: 'Tại sao cần khai báo `model_config = ConfigDict(from_attributes=True)` trên các Pydantic Response Schema khi làm việc với SQLAlchemy ORM?',
    frontHint: 'Đọc dữ liệu bằng thuộc tính `obj.email` (ORM Object) thay vì tra cứu từ điển `obj["email"]` (`dict`).',
    backAnswer:
      'Mặc định, `Pydantic` kỳ vọng dữ liệu đầu vào là một `dict` (truy cập qua `data["field"]`). Tuy nhiên, kết quả trả về từ SQLAlchemy là một **ORM Entity Object** (truy cập qua thuộc tính `user_orm.email`). Bật **`ConfigDict(from_attributes=True)`** (thay thế cho `orm_mode = True` ở Pydantic v1) cho phép `UserRead.model_validate(user_orm)` trích xuất trực tiếp các thuộc tính từ đối tượng ORM sang JSON DTO.',
    backAnalogy:
      'Bộ chuyển đổi đa năng giúp máy đọc mã vạch (`Pydantic`) đọc được cả nhãn dán trên thùng hàng (`Object.attr`) lẫn bảng kê giấy (`dict["key"]`).',
    codeSnippet: `from pydantic import BaseModel, ConfigDict\n\nclass UserRead(BaseModel):\n    model_config = ConfigDict(from_attributes=True)\n    id: int\n    username: str`,
    relatedTermIds: ['eco-pydantic', 'eco-sqlalchemy', 'eco-fastapi'],
  },
  {
    id: 'fc-67',
    stageId: 'stage-4',
    level: 'pro',
    category: 'SQLAlchemy 2.0 & Database',
    frontQuestion: 'Cú pháp khai báo Model bằng `Mapped[T]` và `mapped_column()` trong SQLAlchemy 2.0 khắc phục nhược điểm gì của `Column()` ở bản 1.x?',
    frontHint: 'Hỗ trợ 100% Static Type Checking (`Pyright`/`mypy`) và tự suy luận `nullable=False` từ Type Hint.',
    backAnswer:
      'Ở SQLAlchemy 1.x, viết `name = Column(String, nullable=False)` khiến các công cụ kiểm tra kiểu tĩnh như `Pyright` không biết `user.name` mang kiểu `str` hay `str | None`. Trong **SQLAlchemy 2.0**, cú pháp **`name: Mapped[str] = mapped_column(String(100))`** tự động suy luận cột là `NOT NULL` (`nullable=False`), còn **`bio: Mapped[str | None]`** tự động suy luận là `NULLABLE`, đồng thời giúp IDE gợi ý kiểu chính xác tuyệt đối.',
    backAnalogy:
      'Một bản thiết kế duy nhất vừa làm khuôn đúc bảng SQL dưới Database, vừa làm hợp đồng kiểm tra kiểu dữ liệu trên trình soạn thảo code.',
    codeSnippet: `from sqlalchemy import String\nfrom sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column\n\nclass Base(DeclarativeBase): pass\n\nclass User(Base):\n    __tablename__ = "users"\n    id: Mapped[int] = mapped_column(primary_key=True)\n    email: Mapped[str] = mapped_column(String(255), unique=True)\n    bio: Mapped[str | None] = mapped_column(default=None)`,
    relatedTermIds: ['eco-sqlalchemy', 'concept-type-hints', 'tool-pyright'],
  },
  {
    id: 'fc-68',
    stageId: 'stage-4',
    level: 'pro',
    category: 'SQLAlchemy 2.0 & AsyncIO',
    frontQuestion: 'Tại sao khi dùng `AsyncSession` trong SQLAlchemy 2.0 lại hay gặp lỗi `MissingGreenlet: greenlet_spawn has not been called` và cách phòng tránh?',
    frontHint: 'SQLAlchemy Async nghiêm cấm Implicit Lazy Loading (tự động bắn câu query ngầm khi chấm thuộc tính `user.posts` mà không có `await`).',
    backAnswer:
      'Trong môi trường đồng bộ cũ, khi bạn gọi `user.posts`, SQLAlchemy âm thầm bắn 1 câu SQL ngầm (Implicit I/O). Nhưng trong `AsyncSession`, thao tác I/O bắt buộc phải có `await`, mà cú pháp truy cập thuộc tính `user.posts` của Python thì không thể gắn `await`! Vì vậy SQLAlchemy ném lỗi **`MissingGreenlet`** để cảnh báo bạn đang cố Lazy-load. **Cách khắc phục**: Luôn nạp trước quan hệ bằng `selectinload()` / `joinedload()`, và bật **`expire_on_commit=False`** trên `async_sessionmaker`.',
    backAnalogy:
      'Quy định an toàn bay: Cấm tự ý mở cửa khoang hàng lấy thêm đồ khi máy bay đang bay (`Lazy Load`); mọi hành lý đi kèm phải được khai báo và chất lên tàu từ dưới mặt đất (`Eager Load`).',
    codeSnippet: `from sqlalchemy.orm import selectinload\nfrom sqlalchemy import select\n\nstmt = select(User).options(selectinload(User.posts)).where(User.id == 1)\nuser = (await session.execute(stmt)).scalar_one()`,
    relatedTermIds: ['eco-sqlalchemy', 'concept-asyncio', 'concept-n-plus-one'],
  },
  {
    id: 'fc-69',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Tối ưu Hiệu năng Database',
    frontQuestion: 'Bài toán **N+1 Query Problem** là gì và khi nào nên chọn `selectinload()` thay vì `joinedload()` trong SQLAlchemy?',
    frontHint: '1 câu query lấy danh sách $N$ cha + $N$ câu query lẻ lấy con vs Quan hệ `1-to-Many` và `Many-to-One`.',
    backAnswer:
      '**N+1 Query** xảy ra khi code chạy 1 query lấy 100 `User`, rồi trong vòng lặp truy cập `user.orders` khiến ORM bắn thêm **100 câu query lẻ** nữa (tổng 101 queries, làm sập DB). Cách sửa bằng Eager Loading: (1) Dùng **`joinedload()`** (`LEFT OUTER JOIN` trong 1 query) cho quan hệ **Many-to-One / One-to-One** (`Order -> User`); (2) Dùng **`selectinload()`** (bắn đúng 2 câu query: câu 2 dùng `WHERE user_id IN (...)`) cho quan hệ **One-to-Many / Many-to-Many** (`User -> Orders`) để tránh nhân bản dữ liệu dòng cha qua mạng.',
    backAnalogy:
      'Thay vì chạy ra chợ 100 chuyến để mua từng quả trứng (N+1), `selectinload` là ghi hết 100 mã đơn vào 1 tờ giấy rồi lấy hàng về chỉ trong đúng 1 chuyến xe tải.',
    codeSnippet: `# Tối ưu One-to-Many chỉ với đúng 2 câu SQL (1 cho Users, 1 cho WHERE user_id IN (...)):\nstmt = select(User).options(selectinload(User.orders)).limit(100)`,
    relatedTermIds: ['concept-n-plus-one', 'eco-sqlalchemy'],
  },
  {
    id: 'fc-70',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Database Migrations (Alembic)',
    frontQuestion: 'Quy trình quản lý phiên bản Database bằng **Alembic** hoạt động như thế nào và tại sao bắt buộc phải đọc lại file migration sau khi chạy `--autogenerate`?',
    frontHint: 'So sánh Metadata của SQLAlchemy Model với Schema hiện tại của Database.',
    backAnswer:
      'Alembic quản lý lịch sử thay đổi cấu trúc bảng SQL giống như Git quản lý code (lưu phiên bản hiện tại trong bảng `alembic_version`). Lệnh `alembic revision --autogenerate -m "..."` đối chiếu `Base.metadata` trong code với DB thực tế để sinh hàm `upgrade()` và `downgrade()`. **Bắt buộc phải review lại file sinh ra** vì `--autogenerate` không thể tự đoán được việc **đổi tên cột/bảng** (nó sẽ tưởng là xóa cột cũ + tạo cột mới làm mất dữ liệu!).',
    backAnalogy:
      'Máy tự động soạn bản vẽ cải tạo nhà (`--autogenerate`), nhưng kiến trúc sư trưởng phải kiểm duyệt lại để máy không đập bỏ bức tường chỉ vì đổi tên phòng.',
    codeSnippet: `uv run alembic revision --autogenerate -m "add_users_table"\nuv run alembic upgrade head     # Áp dụng migration mới nhất\nuv run alembic downgrade -1     # Rollback về 1 phiên bản trước`,
    relatedTermIds: ['tool-alembic', 'eco-sqlalchemy'],
  },
  {
    id: 'fc-71',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Kiến trúc Phần mềm (Clean Architecture)',
    frontQuestion: 'Trong kiến trúc phân tầng chuẩn của ứng dụng FastAPI (`Router -> Service -> Repository -> Model/Schema`), trách nhiệm của từng tầng được phân chia như thế nào?',
    frontHint: 'Không viết câu lệnh SQL (`select()`) trong Router và không ném `HTTPException` trong Repository!',
    backAnswer:
      'Tách biệt mối quan tâm (Separation of Concerns) qua 4 tầng: (1) **Router (Controller)**: Chỉ nhận HTTP Request, giải mã DTO qua Pydantic, gọi Service và trả HTTP Status Code; (2) **Service (Use Case / Business Logic)**: Chứa toàn bộ quy tắc nghiệp vụ, điều phối Transaction và gọi các Repository/External API; (3) **Repository (Data Access)**: Chỉ đóng gói các câu truy vấn SQLAlchemy (`select`, `insert`), hoàn toàn không biết gì về HTTP; (4) **Model & Schema**: Thực thể DB (`SQLAlchemy`) và hợp đồng dữ liệu (`Pydantic`).',
    backAnalogy:
      'Lễ tân nhận đơn (`Router`) -> Quản lý duyệt quy trình nghiệp vụ (`Service`) -> Thủ kho vào kệ lấy hàng (`Repository`).',
    codeSnippet: `# Router mỏng, sạch, chỉ làm nhiệm vụ giao vận HTTP:\n@router.post("/orders", status_code=201)\nasync def create_order(dto: OrderCreate, svc: OrderServiceDep) -> OrderRead:\n    return await svc.place_order(dto)`,
    relatedTermIds: ['concept-clean-architecture', 'eco-fastapi', 'eco-sqlalchemy'],
  },
  {
    id: 'fc-72',
    stageId: 'stage-4',
    level: 'pro',
    category: 'FastAPI Background & Security',
    frontQuestion: 'Khi nào dùng `BackgroundTasks` có sẵn của FastAPI và khi nào bắt buộc phải tách sang hệ thống hàng đợi `Celery` / `ARQ` + Redis?',
    frontHint: 'Tác vụ nhẹ chạy chung tiến trình Web Server vs Tác vụ nặng/cần Retry/không được mất khi Pod K8s khởi động lại.',
    backAnswer:
      '**`BackgroundTasks`** của FastAPI chạy ngay trong **cùng tiến trình và bộ nhớ** của Web Server sau khi đã trả HTTP Response — chỉ phù hợp cho tác vụ nhẹ, nhanh, nếu lỡ mất cũng không sao (ví dụ: gửi log phụ, xóa file tạm). Ngược lại, với tác vụ nặng CPU, tốn nhiều giây (xuất báo cáo PDF, gọi AI/LLM, xử lý thanh toán) hoặc **bắt buộc phải có cơ chế lưu trữ bền vững + tự động Retry khi lỗi**, bạn phải đẩy qua **Message Broker (Redis/RabbitMQ) + Worker rời (`Celery`/`ARQ`)**.',
    backAnalogy:
      '`BackgroundTasks` là nhờ nhân viên thu ngân tiện tay lau mặt bàn sau khi khách rời quầy; `Celery` là chuyển đơn hàng xuống xưởng sản xuất riêng biệt có phiếu theo dõi.',
    codeSnippet: `from fastapi import BackgroundTasks\n\n@app.post("/signup")\nasync def signup(email: str, bg: BackgroundTasks):\n    bg.add_task(send_welcome_audit_log, email)  # Chạy ngay sau khi trả Response\n    return {"status": "ok"}`,
    relatedTermIds: ['eco-fastapi', 'eco-celery', 'concept-asyncio'],
  },

  // ============================================================================
  // STAGE 5: CONCURRENCY, ASYNCIO, MULTIPROCESSING & GIL INTERNALS (10 CARDS: fc-73 -> fc-82)
  // ============================================================================
  {
    id: 'fc-73',
    stageId: 'stage-5',
    level: 'pro',
    category: 'CPython Internals & GIL',
    frontQuestion: 'GIL (Global Interpreter Lock) là gì, tại sao CPython cần nó và ảnh hưởng thực tế của nó tới `threading` vs `multiprocessing` là gì?',
    frontHint: 'Bảo vệ bộ đếm tham chiếu bộ nhớ (`ob_refcnt` - Reference Counting) khỏi Race Condition.',
    backAnswer:
      'CPython quản lý bộ nhớ bằng **Reference Counting** (mỗi Object có biến đếm `ob_refcnt`, về 0 là giải phóng ngay). Nếu nhiều OS Thread cùng tăng/giảm biến đếm này đồng thời mà không có khóa sẽ gây hỏng bộ nhớ. **GIL** là một khóa Mutex cấp tiến trình chỉ cho phép **1 Thread thực thi Python Bytecode tại 1 thời điểm**. Hệ quả: `threading` rất tốt cho **I/O-bound** (vì CPython nhả GIL khi chờ mạng/ổ cứng), nhưng vô dụng với **CPU-bound** (phải dùng `multiprocessing` để mỗi Process có GIL và nhân CPU riêng).',
    backAnalogy:
      '4 đầu bếp trong 1 phòng bếp chỉ có 1 con dao duy nhất (`GIL`): khi chờ nồi hầm (`I/O`) thì chuyền dao cho nhau rất tốt, nhưng muốn thái thịt liên tục gấp 4 lần (`CPU-bound`) thì phải mở 4 phòng bếp riêng (`Process`).',
    codeSnippet: `from concurrent.futures import ProcessPoolExecutor\n\n# Vượt qua GIL bằng cách phân tải lên tất cả các nhân CPU vật lý:\nwith ProcessPoolExecutor() as pool:\n    results = list(pool.map(heavy_cpu_task, items))`,
    relatedTermIds: ['concept-gil', 'concept-cpython', 'stdlib-multiprocessing'],
  },
  {
    id: 'fc-74',
    stageId: 'stage-5',
    level: 'master',
    category: 'CPython Internals & GIL (Python 3.13+)',
    frontQuestion: 'PEP 703 (**Free-Threaded Python / No-GIL** từ Python 3.13+ với bản build `python3.13t`) đã thay thế GIL bằng cơ chế kỹ thuật nào?',
    frontHint: 'Biased Reference Counting + Immortal Objects + Per-object Fine-grained Locking.',
    backAnswer:
      'Để gỡ bỏ GIL trong bản build Free-threaded (`python3.13t` / `3.14t`), CPython áp dụng 3 kỹ thuật đột phá: (1) **Biased Reference Counting**: luồng sở hữu đối tượng tăng/giảm refcount cực nhanh không cần nguyên tử hóa (atomic), chỉ luồng khác chạm vào mới dùng atomic; (2) **Immortalization**: các đối tượng bất tử (`None`, `True`, Small Ints) không bao giờ đếm refcount nữa; (3) **Fine-grained Locking**: thay 1 khóa toàn cục bằng khóa nhỏ trên từng `list`/`dict` và bộ cấp phát bộ nhớ `mimalloc` an toàn đa luồng.',
    backAnalogy:
      'Thay vì khóa cổng cả tòa nhà chỉ cho 1 người vào (`GIL`), nay mỗi bàn làm việc có ngăn kéo riêng (`Biased Refcount`) và các vật dụng chung được gắn khóa tự động cục bộ.',
    codeSnippet: `import sys\n# Kiểm tra xem GIL có đang bật ở Runtime hay không (Python 3.13+):\nis_gil_active = sys._is_gil_enabled()\nprint(f"GIL enabled: {is_gil_active}")`,
    relatedTermIds: ['concept-gil', 'concept-cpython'],
  },
  {
    id: 'fc-75',
    stageId: 'stage-5',
    level: 'pro',
    category: 'AsyncIO & Event Loop',
    frontQuestion: 'Cơ chế **Cooperative Multitasking** của `asyncio` Event Loop khác với **Preemptive Multitasking** của OS Threads như thế nào?',
    frontHint: 'Tự nguyện nhường luồng tại điểm `await` vs Bị hệ điều hành cưỡng bức ngắt giữa chừng.',
    backAnswer:
      'Với **OS Threads (Preemptive)**, hệ điều hành có thể ngắt (preempt) luồng tại bất kỳ dòng lệnh nào để chuyển ngữ cảnh (Context Switch tốn kém và dễ gây Race Condition). Ngược lại, **AsyncIO (Cooperative Multitasking)** chạy trên **1 Thread duy nhất**: một Coroutine (`async def`) chỉ nhường quyền điều khiển cho Event Loop tại các điểm **`await`** tường minh khi chờ I/O (nhờ hệ thống `epoll`/`kqueue` của OS báo thức), giúp chịu tải hàng chục nghìn kết nối với chi phí bộ nhớ chỉ vài KB mỗi Task.',
    backAnalogy:
      'OS Threads là trọng tài thổi còi bắt dừng bất chợt giữa chừng; AsyncIO là các vận động viên chạy tiếp sức tự nguyện trao gậy (`await`) tại đúng vạch quy định.',
    codeSnippet: `import asyncio\n\nasync def fetch_user(uid: int) -> dict:\n    await asyncio.sleep(0.1)  # Tự nguyện nhường Event Loop cho Task khác chạy\n    return {"id": uid}`,
    relatedTermIds: ['concept-asyncio', 'kw-async', 'kw-await'],
  },
  {
    id: 'fc-76',
    stageId: 'stage-5',
    level: 'master',
    category: 'AsyncIO & FastAPI Gotchas',
    frontQuestion: 'Tại sao gọi `time.sleep(5)` hoặc `requests.get()` bên trong hàm `async def` lại làm "đóng băng" toàn bộ Server FastAPI?',
    frontHint: 'Khác biệt giữa Synchronous Blocking của Python và Non-blocking I/O mặc định của Node.js.',
    backAnswer:
      'Event Loop của `asyncio` chạy trên 1 Thread duy nhất. Các hàm truyền thống như `time.sleep()`, `requests.get()` hay driver DB đồng bộ `psycopg2` là **Synchronous Blocking**: chúng chặn đứng chính OS Thread hiện tại mà không trả quyền về cho Event Loop, khiến toàn bộ 1.000 request của người dùng khác bị treo cứng theo! **Giải pháp**: Dùng thư viện thuần Async (`asyncio.sleep()`, `httpx.AsyncClient`, `asyncpg`) hoặc đẩy hàm đồng bộ sang ThreadPool bằng **`await asyncio.to_thread(sync_fn)`**.',
    backAnalogy:
      'Đại kiện tướng cờ vua thi đấu cùng lúc 50 bàn (`Event Loop`) nhưng lại ngồi ngủ gật 5 phút ngay tại bàn số 1 (`time.sleep`) khiến cả 49 bàn còn lại phải đứng chờ!',
    codeSnippet: `# SAI: time.sleep(5) hoặc requests.get(url) trong async def\n# ĐÚNG:\nawait asyncio.sleep(5)\nres = await httpx_client.get(url)`,
    relatedTermIds: ['concept-asyncio', 'kw-async', 'eco-fastapi', 'concept-gil'],
  },
  {
    id: 'fc-77',
    stageId: 'stage-5',
    level: 'master',
    category: 'Structured Concurrency (Python 3.11+)',
    frontQuestion: 'Tại sao `asyncio.TaskGroup()` (Structured Concurrency trong Python 3.11+) lại an toàn và ưu việt hơn `asyncio.gather()`?',
    frontHint: 'Điều gì xảy ra với các Task còn lại khi 1 Task con bị lỗi trong `gather()` vs `TaskGroup()`?',
    backAnswer:
      'Với `asyncio.gather(t1, t2, t3)`, nếu `t1` ném ra Exception, `gather` báo lỗi ngay nhưng **`t2` và `t3` vẫn tiếp tục chạy ngầm mồ côi (Orphan Tasks)** gây rò rỉ tài nguyên hoặc ghi dữ liệu dở dang. Ngược lại, **`async with asyncio.TaskGroup() as tg:`** thực thi **Structured Concurrency**: ngay khi 1 Task con nổ lỗi, `TaskGroup` tự động **hủy (`cancel()`) toàn bộ các Task anh em còn lại**, đợi chúng dọn dẹp xong rồi mới gom các lỗi vào `ExceptionGroup` (bắt bằng `except*`).',
    backAnalogy:
      '`gather` là đoàn leo núi mạnh ai nấy chạy khi có người ngã; `TaskGroup` là đội đặc nhiệm nối dây an toàn: 1 người gặp sự cố là cả đội lập tức dừng chiến dịch và rút lui an toàn.',
    codeSnippet: `import asyncio\n\nasync def fetch_dashboard(uid: int):\n    async with asyncio.TaskGroup() as tg:\n        t_profile = tg.create_task(get_profile(uid))\n        t_orders = tg.create_task(get_orders(uid))\n    return t_profile.result(), t_orders.result()`,
    relatedTermIds: ['concept-asyncio', 'kw-async', 'kw-with'],
  },
  {
    id: 'fc-78',
    stageId: 'stage-5',
    level: 'pro',
    category: 'Kiểm soát Đồng thời (Backpressure)',
    frontQuestion: 'Nếu bắn 10.000 HTTP Request đồng thời bằng `TaskGroup`/`gather` sẽ gây lỗi cạn kiệt Socket hoặc bị khóa IP — làm sao giới hạn chỉ chạy tối đa 20 Task cùng lúc?',
    frontHint: 'Sử dụng bộ đếm đèn giao thông `asyncio.Semaphore(20)`.',
    backAnswer:
      'Sử dụng **`sem = asyncio.Semaphore(20)`** kết hợp `async with sem:` bên trong hàm worker. `Semaphore` duy trì một bộ đếm nội bộ: chỉ cho phép tối đa 20 Coroutine đi vào vùng критический (gọi API / truy vấn DB) tại cùng một thời điểm; Coroutine thứ 21 sẽ tự động tạm dừng (`await`) ở cửa cho đến khi 1 trong 20 Coroutine trước hoàn thành và bước ra khỏi khối `async with sem:`.',
    backAnalogy:
      'Bãi đỗ xe thông minh có đúng 20 chỗ (`Semaphore(20)`): khi đủ 20 xe vào trong, thanh chắn tự hạ xuống; hễ 1 xe đi ra thì thanh chắn mới mở cho 1 xe tiếp theo đi vào.',
    codeSnippet: `import asyncio\n\nsem = asyncio.Semaphore(20)  # Tối đa 20 request đồng thời\n\nasync def safe_fetch(client, url: str):\n    async with sem:\n        return await client.get(url)`,
    relatedTermIds: ['concept-asyncio', 'kw-async', 'kw-with'],
  },
  {
    id: 'fc-79',
    stageId: 'stage-5',
    level: 'pro',
    category: 'AsyncIO & Legacy Sync Code',
    frontQuestion: 'Hàm `await asyncio.to_thread(sync_fn, *args)` hoạt động như thế nào để cứu cánh khi bắt buộc phải dùng thư viện đồng bộ cũ (như `boto3`, `Pillow`, `pandas`) trong FastAPI?',
    frontHint: 'Ủy thác hàm Blocking sang `ThreadPoolExecutor` mặc định của Event Loop.',
    backAnswer:
      '`await asyncio.to_thread(func, *args)` tự động đẩy lời gọi hàm đồng bộ `func(*args)` sang một **OS Worker Thread riêng biệt** trong `ThreadPoolExecutor` (đồng thời sao chép cả `contextvars` hiện tại), rồi nhường Event Loop chính để phục vụ các request khác. Khi Worker Thread chạy xong, kết quả được trả ngược về Coroutine một cách mượt mà mà không làm đóng băng Event Loop.',
    backAnalogy:
      'Đầu bếp chính (`Event Loop`) gặp món nướng tốn thời gian liền giao cho phụ bếp ở lò phụ (`to_thread`) canh lửa, khi nào chín thì báo lại.',
    codeSnippet: `import asyncio\nfrom PIL import Image\n\ndef resize_sync(path: str) -> bytes:\n    ...  # Xử lý ảnh đồng bộ\n\nasync def upload_avatar(path: str) -> bytes:\n    return await asyncio.to_thread(resize_sync, path)`,
    relatedTermIds: ['concept-asyncio', 'eco-fastapi', 'concept-gil'],
  },
  {
    id: 'fc-80',
    stageId: 'stage-5',
    level: 'master',
    category: 'Kiến trúc Đồng thời & Song song',
    frontQuestion: 'Quy tắc chọn đúng vũ khí giữa `asyncio`, `ThreadPoolExecutor` (`threading`) và `ProcessPoolExecutor` (`multiprocessing`) cho từng loại bài toán là gì?',
    frontHint: 'I/O-bound có thư viện Async vs I/O-bound thư viện Sync cũ vs CPU-bound tính toán nặng.',
    backAnswer:
      'Ma trận lựa chọn chuẩn kỹ sư hệ thống: (1) **`asyncio` (1 Process, 1 Thread)**: Tối ưu nhất cho **High-concurrency Network I/O** (hàng nghìn kết nối HTTP/DB/WebSocket với thư viện `async`); (2) **`ThreadPoolExecutor` (1 Process, $N$ Threads)**: Dành cho **Blocking Sync I/O** (đọc/ghi đĩa, thư viện `boto3`/`requests` chưa có async); (3) **`ProcessPoolExecutor` ($N$ Processes, $N$ GILs)**: Bắt buộc cho **CPU-bound** (mã hóa, nén dữ liệu, xử lý ảnh/video, thuật toán nặng CPU).',
    backAnalogy:
      '`asyncio` là 1 tổng đài viên điều phối 1.000 cuộc gọi chờ; `threading` là 10 nhân viên bốc xếp hàng lên kệ; `multiprocessing` là 8 cỗ máy nghiền đá chạy độc lập.',
    codeSnippet: `# I/O hiện đại -> asyncio.TaskGroup()\n# I/O thư viện cũ -> await asyncio.to_thread() / ThreadPoolExecutor\n# Nặng CPU -> ProcessPoolExecutor(max_workers=os.cpu_count())`,
    relatedTermIds: ['concept-asyncio', 'concept-gil', 'stdlib-multiprocessing'],
  },
  {
    id: 'fc-81',
    stageId: 'stage-5',
    level: 'master',
    category: 'Multiprocessing & IPC',
    frontQuestion: 'Tại sao truyền một mảng dữ liệu lớn (500MB) qua `ProcessPoolExecutor` lại làm chậm hệ thống thê thảm và giải pháp với `SharedMemory` là gì?',
    frontHint: 'Chi phí tuần tự hóa `pickle` (Serialization/Deserialization) qua ống dẫn IPC giữa các Process.',
    backAnswer:
      'Các Process có không gian bộ nhớ RAM cách ly hoàn toàn. Khi bạn truyền đối số sang Process con, Python phải dùng **`pickle`** để đóng gói (serialize) toàn bộ 500MB thành chuỗi byte, gửi qua ống dẫn IPC (Pipe/Socket), rồi giải nén (unpickle) tạo bản sao mới ở Process con — làm tốn gấp đôi RAM và nghẽn CPU. Giải pháp: Dùng **`multiprocessing.shared_memory.SharedMemory`** (kết hợp NumPy buffer) để nhiều Process cùng đọc/ghi trực tiếp trên **1 vùng RAM vật lý duy nhất (Zero-copy)**.',
    backAnalogy:
      'Thay vì photo cả bộ hồ sơ 10.000 trang rồi gửi chuyển phát nhanh sang từng phòng ban (`pickle`), hãy đặt bộ hồ sơ lên bàn kính ở phòng họp chung để mọi người cùng nhìn (`SharedMemory`).',
    codeSnippet: `from multiprocessing import shared_memory\n# Tạo khối bộ nhớ chia sẻ Zero-copy giữa các Process:\nshm = shared_memory.SharedMemory(create=True, size=1024 * 1024)\n# Sau khi dùng xong nhớ gọi shm.close() và shm.unlink()`,
    relatedTermIds: ['stdlib-multiprocessing', 'concept-gil', 'eco-numpy'],
  },
  {
    id: 'fc-82',
    stageId: 'stage-5',
    level: 'master',
    category: 'Distributed Task Queues (Celery)',
    frontQuestion: 'Làm thế nào để thiết kế một Celery Task xử lý thanh toán đạt chuẩn Production không bao giờ mất đơn hay trừ tiền 2 lần khi Worker bị crash?',
    frontHint: 'Bộ tứ: Idempotency Key + `acks_late=True` + Exponential Backoff with Jitter + Dead-Letter Queue (DLQ).',
    backAnswer:
      '4 nguyên tắc sống còn cho Distributed Worker: (1) **`acks_late=True`**: Chỉ gửi xác nhận xóa message khỏi Broker *sau khi* Task đã chạy xong (nếu Worker sập giữa chừng, Broker sẽ giao lại cho Worker khác); (2) **Idempotency (Tính lũy đẳng)**: Luôn kiểm tra `idempotency_key` / trạng thái đơn trong DB để chạy lại 2 lần cũng chỉ trừ tiền đúng 1 lần; (3) **Exponential Backoff + Jitter**: Tăng dần thời gian chờ khi retry để không dội bom dịch vụ đang lỗi; (4) **DLQ**: Đẩy các task lỗi quá số lần retry vào hàng đợi riêng để cảnh báo.',
    backAnalogy:
      'Shipper chỉ ký xác nhận hoàn tất sau khi đã giao tận tay khách (`acks_late`), và mỗi kiện hàng có mã vạch duy nhất để lỡ quét 2 lần cũng không thu tiền đúp (`Idempotency`).',
    codeSnippet: `@celery_app.task(\n    bind=True,\n    acks_late=True,\n    autoretry_for=(httpx.RequestError,),\n    retry_backoff=True,\n    retry_jitter=True,\n    max_retries=5,\n)\ndef process_payment(self, order_id: int, idempotency_key: str) -> None: ...`,
    relatedTermIds: ['eco-celery', 'concept-idempotency'],
  },

  // ============================================================================
  // STAGE 6: DATA ENGINEERING, AUTOMATION & AI/LLM INTEGRATION (9 CARDS: fc-83 -> fc-91)
  // ============================================================================
  {
    id: 'fc-83',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Data Processing & Vectorization',
    frontQuestion: 'Tại sao kỹ thuật **Vectorization** trong NumPy/Polars lại chạy nhanh gấp 50x–100x so với vòng lặp `for` thuần của Python?',
    frontHint: 'Mảng bộ nhớ C/Rust liên tiếp (Contiguous Memory) + Tập lệnh SIMD của CPU + Không tốn chi phí Unboxing `PyObject`.',
    backAnswer:
      'Trong vòng lặp `for` của Python, mỗi con số là một `PyObject` nặng 28 bytes nằm rải rác trên Heap; ở mỗi bước lặp, PVM phải kiểm tra kiểu động, giải bọc con trỏ và gọi hàm C. Ngược lại, **Vectorization** lưu dữ liệu trong **mảng bộ nhớ liên tiếp (Contiguous C/Rust Buffer)** chứa các số nguyên thủy (`float64`, `int64`) và đẩy toàn bộ phép toán xuống vòng lặp C/Rust cấp thấp kết hợp tập lệnh **SIMD (Single Instruction, Multiple Data)** của CPU để tính 4–8 phần tử chỉ trong 1 nhịp xung nhịp!',
    backAnalogy:
      'Vòng lặp `for` là mở từng hộp quà bọc giấy kiếng ra để đóng dấu từng món; Vectorization là xếp thẳng hàng trên băng chuyền và dập khuôn 16 sản phẩm cùng một lúc (`SIMD`).',
    codeSnippet: `import numpy as np\narr = np.arange(10_000_000, dtype=np.float64)\n# Phép toán Vector hóa chạy trực tiếp bằng C + SIMD trong vài mili-giây:\nresult = arr * 1.1 + 5.0`,
    relatedTermIds: ['eco-numpy', 'concept-vectorization', 'concept-cpython'],
  },
  {
    id: 'fc-84',
    stageId: 'stage-6',
    level: 'pro',
    category: 'NumPy & Memory Layout',
    frontQuestion: 'Cơ chế **Broadcasting** và **Memory View (Zero-copy Slicing)** trong NumPy khác với Slicing của Python `list` như thế nào?',
    frontHint: 'Slicing `list[1:5]` tạo bản sao mới, còn Slicing `ndarray[1:5]` thì sao?',
    backAnswer:
      'Khác với Python `list` (slicing `a[1:5]` luôn cấp phát một `list` mới), slicing trên mảng NumPy **`arr[1:5]` trả về một Memory View (Góc nhìn Zero-copy)** trỏ trực tiếp vào cùng vùng bộ nhớ gốc — sửa phần tử trên `view` sẽ làm thay đổi mảng `arr` gốc (muốn tách rời phải gọi `.copy()`). Ngoài ra, **Broadcasting** cho phép cộng/nhân hai mảng khác kích thước (ví dụ ma trận `(100, 3)` cộng vector `(3,)`) bằng cách tự động kéo giãn chiều có kích thước bằng `1` ảo mà không tốn thêm 1 byte RAM nào.',
    backAnalogy:
      'Memory View giống như nhìn bức tranh gốc qua một khung cửa sổ nhỏ — lấy bút vẽ qua khung cửa sổ là vẽ thẳng lên bức tranh gốc.',
    codeSnippet: `import numpy as np\na = np.array([10, 20, 30, 40])\nview = a[1:3]     # Zero-copy View, KHÔNG tốn thêm RAM!\nview[0] = 999     # a bây giờ trở thành [10, 999, 30, 40]`,
    relatedTermIds: ['eco-numpy', 'concept-slicing', 'concept-vectorization'],
  },
  {
    id: 'fc-85',
    stageId: 'stage-6',
    level: 'master',
    category: 'Data Engineering (Polars vs Pandas)',
    frontQuestion: 'Tại sao thư viện **Polars** (`LazyFrame` + `scan_parquet`) có thể xử lý các tập dữ liệu hàng chục GB nhanh gấp 10x–30x và tốn ít RAM hơn hẳn **Pandas**?',
    frontHint: 'Đa luồng Rust (không bị khóa bởi GIL) + Apache Arrow Columnar Memory + Query Optimizer (Predicate & Projection Pushdown).',
    backAnswer:
      'Pandas truyền thống chạy đơn luồng và thực thi ngay lập tức (Eager), thường ngốn gấp 5x–10x dung lượng file vào RAM. Ngược lại, **Polars** được viết bằng **Rust** trên chuẩn bộ nhớ cột **Apache Arrow**, tự động chạy song song trên **tất cả các nhân CPU**. Khi dùng **`pl.scan_parquet()` (`LazyFrame`)**, Polars xây dựng đồ thị truy vấn và chạy **Query Optimizer**: chỉ đọc đúng những cột cần thiết (**Projection Pushdown**) và lọc bỏ các dòng không thỏa điều kiện ngay từ lúc đọc ổ cứng (**Predicate Pushdown**) trước khi gọi `.collect()`.',
    backAnalogy:
      'Pandas khuân toàn bộ 100 thùng hồ sơ từ kho lên lầu 5 rồi mới chọn ra 2 tờ giấy; Polars (`LazyFrame`) đọc yêu cầu trước rồi xuống kho nhặt đúng 2 tờ giấy đó mang lên.',
    codeSnippet: `import polars as pl\n\nq = (\n    pl.scan_parquet("s3://bucket/transactions/*.parquet")\n    .filter(pl.col("amount") > 1000)\n    .group_by("region")\n    .agg(pl.col("amount").sum().alias("total"))\n)\ndf = q.collect()  # Tối ưu hóa toàn bộ truy vấn rồi thực thi đa luồng Rust`,
    relatedTermIds: ['eco-polars', 'concept-vectorization', 'concept-gil'],
  },
  {
    id: 'fc-86',
    stageId: 'stage-6',
    level: 'pro',
    category: 'AI Engineering & LLM Integration',
    frontQuestion: 'Làm thế nào để ép các mô hình LLM (OpenAI / Gemini / Claude) luôn trả về dữ liệu khớp 100% với cấu trúc kiểu dữ liệu của Backend mà không phải cắt chuỗi Regex thủ công?',
    frontHint: 'Kết hợp **Structured Outputs** (`response_format` / `response_schema`) trực tiếp với lớp `pydantic.BaseModel`.',
    backAnswer:
      'Thay vì dặn LLM bằng lời văn trong prompt ("Hãy trả về JSON...") vốn rất dễ bị lệch cú pháp hoặc thiếu trường, hãy sử dụng tính năng **Structured Outputs / Tool Calling** và truyền trực tiếp class **`pydantic.BaseModel`** vào SDK. Engine của LLM sẽ dùng cơ chế **Constrained Decoding (Finite State Machine trên JSON Schema)** để khóa xác suất sinh token, đảm bảo đầu ra luôn parse thành đối tượng Pydantic hợp lệ 100%.',
    backAnalogy:
      'Thay vì đưa tờ giấy trắng bảo khách tự viết đơn, bạn đưa một biểu mẫu điện tử có sẵn các ô bắt buộc (`Pydantic Schema`) — điền sai khuôn dạng không thể bấm nộp.',
    codeSnippet: `from pydantic import BaseModel\n\nclass InvoiceExtract(BaseModel):\n    vendor_name: str\n    total_amount: float\n    currency: str\n\n# Truyền thẳng class InvoiceExtract vào response_format / response_schema của LLM SDK`,
    relatedTermIds: ['eco-pydantic', 'concept-llm-structured-output'],
  },
  {
    id: 'fc-87',
    stageId: 'stage-6',
    level: 'master',
    category: 'AI Engineering & RAG Architecture',
    frontQuestion: 'Một hệ thống **RAG (Retrieval-Augmented Generation)** chuẩn Production gồm những giai đoạn nào và tại sao nên kết hợp **Hybrid Search + Reranker**?',
    frontHint: 'Ingestion (Chunking -> Embedding -> Vector DB) + Retrieval (Dense Vector + Sparse BM25 -> Cross-Encoder Rerank) + Generation.',
    backAnswer:
      'Quy trình RAG gồm 2 pha: (1) **Ingestion**: Cắt tài liệu theo ngữ nghĩa (**Semantic/Recursive Chunking** có `overlap`), chuyển thành vector qua Embedding Model và lưu vào Vector DB (`Qdrant`/`pgvector`); (2) **Retrieval & Generation**: Tìm kiếm kết hợp **Hybrid Search** (Vector tìm theo ý nghĩa ngữ nghĩa + **BM25** tìm chính xác mã sản phẩm/từ khóa riêng), đưa top 20 kết quả qua mô hình **Reranker (Cross-Encoder)** để chọn ra top 5 đoạn chuẩn nhất nhét vào Prompt cho LLM trả lời kèm trích dẫn.',
    backAnalogy:
      'Thi mở sách: dùng mục lục từ khóa (`BM25`) kết hợp trí nhớ chủ đề (`Vector Search`) để lật nhanh 20 trang có liên quan, rồi đọc kỹ chọn ra 3 đoạn đắt giá nhất (`Reranker`) để chép vào bài thi.',
    codeSnippet: `# Kiến trúc RAG chuẩn:\n# Query -> [Vector Search + BM25] -> Reciprocal Rank Fusion -> Reranker -> LLM Prompt`,
    relatedTermIds: ['concept-rag', 'concept-vector-db', 'eco-pydantic'],
  },
  {
    id: 'fc-88',
    stageId: 'stage-6',
    level: 'master',
    category: 'Vector Databases & Embeddings',
    frontQuestion: 'Phép đo **Cosine Similarity** và thuật toán đánh chỉ mục **HNSW (Hierarchical Navigable Small World)** giúp Vector Database tìm kiếm hàng triệu vector trong vài mili-giây như thế nào?',
    frontHint: 'Góc giữa 2 vector trong không gian nhiều chiều vs Đồ thị nhiều tầng nhảy cóc (Approximate Nearest Neighbor - ANN).',
    backAnswer:
      '**Cosine Similarity** đo độ tương đồng ngữ nghĩa bằng cosin góc giữa 2 vector ($\\frac{A \\cdot B}{\\|A\\| \\|B\\|}$): tiến về `1.0` là cùng nghĩa, `0` là không liên quan (nếu vector đã chuẩn hóa độ dài bằng 1 thì chỉ cần tính tích vô hướng **Dot Product** cực nhanh). Để không phải so sánh vét cạn với 10 triệu vector (`O(N)`), chỉ mục **HNSW** xây dựng một **đồ thị nhiều tầng giống mạng lưới đường cao tốc**: bắt đầu nhảy bước lớn ở tầng cao nhất rồi thu hẹp dần xuống tầng chi tiết bên dưới, đạt tốc độ **`O(log N)`**.',
    backAnalogy:
      'HNSW giống như tìm nhà bằng cách bay máy bay đến đúng thành phố (tầng trên), đi tàu điện về đúng quận (tầng giữa), rồi mới đi bộ vài bước tới đúng số nhà (tầng đáy).',
    codeSnippet: `import numpy as np\n# Khi 2 vector u, v đã được chuẩn hóa (L2-normalized), Cosine Similarity chính là Dot Product:\ncosine_sim = float(np.dot(u_norm, v_norm))`,
    relatedTermIds: ['concept-vector-db', 'concept-rag', 'eco-numpy'],
  },
  {
    id: 'fc-89',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Automation & Web Scraping',
    frontQuestion: 'Khi xây dựng hệ thống thu thập dữ liệu (Web Scraping) bất đồng bộ, khi nào dùng `httpx.AsyncClient` + `selectolax`/`BeautifulSoup` và khi nào phải dùng `Playwright`?',
    frontHint: 'Static SSR HTML (Nhẹ, nhanh gấp 50 lần) vs SPA / JavaScript-rendered DOM & Anti-bot.',
    backAnswer:
      'Nếu trang web trả về sẵn dữ liệu trong HTML tĩnh hoặc gọi JSON API ngầm, hãy dùng **`httpx.AsyncClient`** (tái sử dụng Connection Pool qua `async with`) kết hợp bộ parse HTML để đạt tốc độ hàng trăm trang/giây với lượng RAM tối thiểu. Chỉ dùng trình duyệt không giao diện **`Playwright` (`async_playwright`)** khi trang web là SPA (React/Vue) bắt buộc phải thực thi JavaScript mới hiện dữ liệu hoặc cần tương tác cuộn trang, bấm nút, vượt qua kiểm tra trình duyệt.',
    backAnalogy:
      '`httpx` là cử người chạy xe máy vào lấy thẳng gói hàng đã đóng sẵn; `Playwright` là điều nguyên chiếc xe cẩu chuyên dụng đến lắp ráp tại chỗ.',
    codeSnippet: `import httpx\n\nasync def fetch_pages(urls: list[str]) -> list[str]:\n    async with httpx.AsyncClient(timeout=10.0, http2=True) as client:\n        resps = await asyncio.gather(*(client.get(u) for u in urls))\n        return [r.text for r in resps]`,
    relatedTermIds: ['eco-httpx', 'concept-asyncio'],
  },
  {
    id: 'fc-90',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Real-time Streaming & AI UX',
    frontQuestion: 'Làm thế nào để truyền từng chữ (Token Streaming) từ LLM về trình duyệt theo thời gian thực bằng FastAPI `StreamingResponse` và chuẩn **Server-Sent Events (SSE)**?',
    frontHint: 'Truyền một Async Generator (`async def` + `yield`) vào `StreamingResponse(..., media_type="text/event-stream")`.',
    backAnswer:
      'Thay vì bắt người dùng nhìn màn hình trắng chờ 15 giây cho LLM sinh xong cả bài văn, bạn viết một **Async Generator** (`async def token_generator():`) dùng `yield f"data: {chunk}\\n\\n"` ngay khi nhận được từng mảnh token từ LLM, rồi bọc vào **`StreamingResponse(token_generator(), media_type="text/event-stream")`**. Giao thức **SSE** hoạt động một chiều trên kết nối HTTP chuẩn, nhẹ hơn WebSockets và tự động hỗ trợ kết nối lại.',
    backAnalogy:
      'Phát sóng trực tiếp từng câu bình luận bóng đá ngay khi bóng lăn (`SSE Streaming`), thay vì đợi hết 90 phút mới gửi băng ghi hình (`JSON Response`).',
    codeSnippet: `from fastapi.responses import StreamingResponse\n\nasync def sse_stream(prompt: str):\n    async for chunk in llm_client.stream(prompt):\n        yield f"data: {chunk}\\n\\n"\n    yield "data: [DONE]\\n\\n"\n\n@app.get("/chat/stream")\nasync def chat(prompt: str) -> StreamingResponse:\n    return StreamingResponse(sse_stream(prompt), media_type="text/event-stream")`,
    relatedTermIds: ['eco-fastapi', 'kw-yield', 'concept-asyncio'],
  },
  {
    id: 'fc-91',
    stageId: 'stage-6',
    level: 'master',
    category: 'Data Orchestration (Airflow)',
    frontQuestion: 'Trong **Apache Airflow**, một **DAG (Directed Acyclic Graph)** là gì và tại sao mọi Task trong Data Pipeline bắt buộc phải được thiết kế **Idempotent (Lũy đẳng)**?',
    frontHint: 'Điều gì xảy ra khi bạn chạy lại (Backfill / Retry) một Task ETL cho ngày `2025-05-01`?',
    backAnswer:
      '**DAG** là đồ thị có hướng không chu trình định nghĩa thứ tự phụ thuộc giữa các Task dữ liệu (`extract >> transform >> load`). Trong thực tế, các Task ETL thường xuyên phải chạy lại (Retry khi lỗi mạng hoặc **Backfill** lại dữ liệu lịch sử). Một Task **Idempotent** đảm bảo dù chạy 1 lần hay chạy lại 10 lần cho cùng một phân vùng ngày (`logical_date`), kết quả trong Data Warehouse vẫn chính xác tuyệt đối mà **không bao giờ bị nhân đôi (duplicate) dữ liệu** (bằng kỹ thuật `UPSERT` / `MERGE` hoặc ghi đè phân vùng `INSERT OVERWRITE PARTITION`).',
    backAnalogy:
      'Nút bấm gọi thang máy tầng 5 là Idempotent (bấm 1 lần hay bấm 10 lần thang vẫn đến tầng 5), khác với việc chuyển khoản thủ công không kiểm tra mã giao dịch.',
    codeSnippet: `# Mẫu SQL Idempotent trong Data Pipeline theo ngày chạy:\n# DELETE FROM daily_sales WHERE sale_date = :logical_date;\n# INSERT INTO daily_sales SELECT ... WHERE DATE(created_at) = :logical_date;`,
    relatedTermIds: ['concept-idempotency', 'eco-airflow'],
  },

  // ============================================================================
  // STAGE 7: PRODUCTION DEPLOYMENT, PROFILING, OBSERVABILITY & SECURITY (9 CARDS: fc-92 -> fc-100)
  // ============================================================================
  {
    id: 'fc-92',
    stageId: 'stage-7',
    level: 'master',
    category: 'Docker & Cloud Deployment',
    frontQuestion: 'Làm thế nào để tối ưu hóa một `Dockerfile` cho ứng dụng Python giảm từ ~1.2GB xuống ~120MB, khởi động tức thì và bảo mật chuẩn Production với `uv`?',
    frontHint: 'Multi-stage Build + `python:3.12-slim` + `uv sync --frozen --no-dev` + `UV_COMPILE_BYTECODE=1` + Non-root user.',
    backAnswer:
      'Áp dụng 5 kỹ thuật vàng trong **Multi-stage Dockerfile**: (1) Tầng `builder` cài đặt trình biên dịch C và chạy **`uv sync --frozen --no-dev --no-install-project`** (tận dụng Docker Layer Cache nếu `uv.lock` chưa đổi); (2) Bật **`UV_COMPILE_BYTECODE=1`** để biên dịch sẵn toàn bộ `.pyc` giúp container khởi động nhanh hơn; (3) Tầng `runtime` dùng base image **`python:3.12-slim`** chỉ copy thư mục `.venv` và `src` sang (bỏ lại toàn bộ `gcc`/build tools); (4) Chạy dưới quyền **Non-root User (`USER appuser`)**.',
    backAnalogy:
      'Xây dựng và lắp ráp nội thất tại nhà máy có đầy đủ cần cẩu (`builder stage`), sau đó chỉ vận chuyển ngôi nhà hoàn thiện đặt lên mảnh đất sạch (`runtime slim stage`).',
    codeSnippet: `FROM python:3.12-slim AS builder\nCOPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv\nENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy\nWORKDIR /app\nCOPY pyproject.toml uv.lock ./\nRUN uv sync --frozen --no-dev --no-install-project`,
    relatedTermIds: ['tool-uv', 'concept-docker', 'concept-bytecode'],
  },
  {
    id: 'fc-93',
    stageId: 'stage-7',
    level: 'master',
    category: 'Production Process Management',
    frontQuestion: 'Tại sao trên Production người ta kết hợp `Gunicorn` (với `UvicornWorker`) hoặc chạy nhiều Replica thay vì chỉ chạy 1 tiến trình `uvicorn` đơn lẻ, và công thức số Worker là gì?',
    frontHint: 'Tận dụng toàn bộ các nhân CPU vật lý (vượt qua GIL) + Tự động hồi sinh Worker bị crash.',
    backAnswer:
      'Một tiến trình `uvicorn` chỉ chạy trên **1 nhân CPU duy nhất** (do GIL). Trên máy chủ nhiều nhân (Bare-metal/VM), dùng **`Gunicorn`** làm Master Process quản lý nhiều **`UvicornWorker`** con (thường theo công thức **`workers = (2 * CPU_CORES) + 1`** hoặc `1 worker / 1 vCPU` khi chạy trên Kubernetes nơi K8s đã tự quản lý nhân bản Pod). Master Process chịu trách nhiệm giám sát sức khỏe và tự động khởi tạo lại Worker mới ngay nếu có một Worker bị crash hoặc tràn RAM (`--max-requests`).',
    backAnalogy:
      '`Uvicorn` là 1 đầu bếp siêu tốc; `Gunicorn` là bếp trưởng đứng điều phối 8 đầu bếp `Uvicorn` đứng ở 8 bếp riêng biệt và thay người ngay nếu ai bị ốm.',
    codeSnippet: `# Chạy Multi-process ASGI Server trên máy chủ 4 vCPU:\ngunicorn my_app.main:app -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:8000`,
    relatedTermIds: ['eco-fastapi', 'concept-asgi', 'concept-gil'],
  },
  {
    id: 'fc-94',
    stageId: 'stage-7',
    level: 'master',
    category: 'Lifecycle & Graceful Shutdown',
    frontQuestion: 'Hàm `lifespan` (`@asynccontextmanager`) trong FastAPI phối hợp với tín hiệu `SIGTERM` của Docker/Kubernetes như thế nào để đạt **Zero-Downtime Deployment**?',
    frontHint: 'Khởi tạo Connection Pool trước `yield`, ngừng nhận request mới khi nhận `SIGTERM`, đợi request đang chạy hoàn tất rồi đóng Pool sau `yield`.',
    backAnswer:
      'Thay thế cho `@app.on_event("startup")` đã lỗi thời, FastAPI dùng hàm **`lifespan`** với `@asynccontextmanager`: phần trước `yield` khởi tạo Database Pool, Redis Client và nạp AI Model vào `app.state`. Khi Kubernetes cuộn bản cập nhật mới, nó gửi tín hiệu **`SIGTERM`**: Uvicorn ngừng nhận kết nối mới, đợi các request đang xử lý dở hoàn tất (**Connection Draining**), rồi mới chạy phần code **sau `yield`** của `lifespan` để đóng sạch các kết nối DB/Redis trước khi tắt Pod.',
    backAnalogy:
      'Nhà hàng đến giờ đóng cửa (`SIGTERM`): treo biển "Ngừng nhận khách mới" ngoài cửa, đợi các bàn đang ăn dùng xong bữa rồi mới khóa két sắt và tắt điện (`sau yield`).',
    codeSnippet: `from contextlib import asynccontextmanager\nfrom fastapi import FastAPI\n\n@asynccontextmanager\nasync def lifespan(app: FastAPI):\n    app.state.redis = await init_redis_pool()\n    yield\n    await app.state.redis.aclose()  # Chạy khi nhận SIGTERM Graceful Shutdown\n\napp = FastAPI(lifespan=lifespan)`,
    relatedTermIds: ['eco-fastapi', 'concept-context-manager', 'kw-yield'],
  },
  {
    id: 'fc-95',
    stageId: 'stage-7',
    level: 'master',
    category: 'Performance Profiling (CPU)',
    frontQuestion: 'Khi một Pod Python trên Production đột nhiên ăn 100% CPU, làm thế nào để chụp biểu đồ **Flamegraph** tìm đúng hàm gây nghẽn mà **không cần sửa code hay khởi động lại Server**?',
    frontHint: 'Sử dụng Sampling Profiler viết bằng Rust **`py-spy`** đọc trực tiếp bộ nhớ của PID đang chạy.',
    backAnswer:
      'Các bộ profiler truyền thống như `cProfile` làm chậm ứng dụng 30%–50% và đòi hỏi phải sửa code bọc hàm. **`py-spy`** là một **Sampling Profiler viết bằng Rust** hoạt động bên ngoài tiến trình: bạn chỉ cần truyền `--pid <PID>` của tiến trình Python đang chạy nóng trên Production, `py-spy` sẽ chụp nhanh Call Stack định kỳ với **chi phí overhead gần như bằng 0 (<1%)** và xuất ra biểu đồ lửa (**Flamegraph SVG**) chỉ rõ hàm nào đang ngốn nhiều thời gian CPU nhất.',
    backAnalogy:
      'Chụp ảnh nhiệt từ bên ngoài tòa nhà đang hoạt động (`py-spy`) để phát hiện ngay căn phòng nào đang quá nhiệt mà không cần cắt cầu giao điện.',
    codeSnippet: `# Gắn trực tiếp vào PID đang chạy để xuất Flamegraph trong 30 giây:\npy-spy record -o profile_flamegraph.svg --pid 12345 --duration 30`,
    relatedTermIds: ['tool-py-spy', 'concept-profiling', 'concept-cpython'],
  },
  {
    id: 'fc-96',
    stageId: 'stage-7',
    level: 'master',
    category: 'Memory Profiling & Leak Detection',
    frontQuestion: 'Những nguyên nhân phổ biến nào gây **Memory Leak (Rò rỉ RAM)** trong Python dù đã có Garbage Collector, và tại sao công cụ **`memray`** lại vượt trội hơn `tracemalloc`?',
    frontHint: 'Biến cache toàn cục không giới hạn (`@lru_cache` không có `maxsize`) + Rò rỉ trong C-Extensions (`numpy`/`pandas`) mà `tracemalloc` không nhìn thấy.',
    backAnswer:
      'Rò rỉ RAM trong Python thường do vô tình giữ tham chiếu đối tượng trong biến toàn cục, `dict` cache tự chế không có giới hạn kích thước (quên đặt `maxsize` cho `@functools.lru_cache(maxsize=1024)`), hoặc rò rỉ bên trong các thư viện C/C++. Trong khi `tracemalloc` chỉ thấy được vùng nhớ của CPython, **`memray`** (do Bloomberg phát triển) chặn trực tiếp các lời gọi hệ thống `malloc`/`free` ở tầng C nên **bắt được 100% rò rỉ ở cả code Python lẫn các thư viện C-Extensions**.',
    backAnalogy:
      '`tracemalloc` chỉ kiểm tra hóa đơn chi tiêu nội bộ, còn `memray` đứng ngay tại két sắt ngân hàng kiểm soát mọi đồng tiền chảy ra dù là chi tiêu nội bộ hay chi cho đối tác nước ngoài (`C-Extensions`).',
    codeSnippet: `# Chạy ứng dụng dưới sự giám sát của memray và tạo báo cáo Flamegraph bộ nhớ:\nuv run memray run -o mem_dump.bin -m my_app.worker\nuv run memray flamegraph mem_dump.bin`,
    relatedTermIds: ['tool-memray', 'concept-profiling', 'concept-cpython'],
  },
  {
    id: 'fc-97',
    stageId: 'stage-7',
    level: 'master',
    category: 'Observability & Distributed Tracing',
    frontQuestion: 'Trong kiến trúc Microservices, **OpenTelemetry (OTel)** sử dụng cơ chế gì để nối kết toàn bộ hành trình của 1 Request đi qua FastAPI -> SQLAlchemy -> Redis -> Service B?',
    frontHint: 'Lan truyền ngữ cảnh `traceparent` (`trace_id` + `span_id`) qua `contextvars` và HTTP Headers.',
    backAnswer:
      '**OpenTelemetry** gán cho mỗi Request đầu vào một mã **`trace_id`** duy nhất toàn cục và chia từng công đoạn con (HTTP handler, câu lệnh SQL, lệnh Redis, lời gọi `httpx` sang Service khác) thành các **Span (`span_id`)** có ghi lại thời gian bắt đầu/kết thúc. Nhờ biến ngữ cảnh **`contextvars`** (an toàn tuyệt đối trên `asyncio`) và tiêu chuẩn W3C `traceparent` HTTP Header, bạn có thể nhìn thấy biểu đồ thác nước (Waterfall) trên Jaeger/Grafana Tempo để biết chính xác mili-giây bị chậm nằm ở câu SQL nào.',
    backAnalogy:
      'Gắn thiết bị định vị GPS (`trace_id`) lên kiện hàng từ lúc rời kho, qua trạm trung chuyển, lên máy bay cho đến tận tay khách hàng để biết chính xác kiện hàng bị kẹt ở trạm nào.',
    codeSnippet: `from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor\nfrom opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor\n\nFastAPIInstrumentor.instrument_app(app)\nSQLAlchemyInstrumentor().instrument(engine=async_engine.sync_engine)`,
    relatedTermIds: ['concept-observability', 'eco-fastapi', 'concept-asyncio'],
  },
  {
    id: 'fc-98',
    stageId: 'stage-7',
    level: 'master',
    category: 'Caching & High Availability (Redis)',
    frontQuestion: 'Thảm họa **Cache Stampede (Thundering Herd)** trong Redis xảy ra khi nào và kỹ thuật **TTL Jitter** + **Distributed Lock** ngăn chặn nó ra sao?',
    frontHint: 'Điều gì xảy ra khi 10.000 key cache được nạp cùng lúc hoặc 1 Hot Key hết hạn đúng lúc có 5.000 người đang truy cập?',
    backAnswer:
      '**Cache Stampede** xảy ra khi một key cực nóng (ví dụ trang chủ sự kiện Flash Sale) hoặc hàng loạt key vừa hết hạn (`TTL = 0`) cùng một giây: hàng nghìn request đồng loạt bị **Cache Miss** và ập thẳng xuống Database cùng lúc làm sập DB. Hai lớp phòng thủ chuẩn: (1) **TTL Jitter**: Cộng thêm một số giây ngẫu nhiên `ttl = 3600 + random.randint(0, 300)` để các key không bao giờ hết hạn đồng loạt; (2) **Mutex Lock / Singleflight**: Khi Cache Miss, chỉ cho phép **1 request duy nhất** xuống DB tính toán và nạp lại cache.',
    backAnalogy:
      'Thay vì cho cả 5.000 học sinh tan học đúng 17:00:00 gây vỡ cổng trường (`Cache Stampede`), nhà trường cho các lớp tan lệch nhau vài phút ngẫu nhiên (`TTL Jitter`).',
    codeSnippet: `import random\n\nasync def set_cache_with_jitter(redis, key: str, val: str, base_ttl: int = 3600):\n    jitter = random.randint(0, int(base_ttl * 0.1))  # Cộng nhiễu 0-10% TTL\n    await redis.set(key, val, ex=base_ttl + jitter)`,
    relatedTermIds: ['eco-redis', 'concept-caching'],
  },
  {
    id: 'fc-99',
    stageId: 'stage-7',
    level: 'master',
    category: 'System Design & Rate Limiting',
    frontQuestion: 'Tại sao cài đặt thuật toán **Rate Limiting** (Token Bucket / Sliding Window) trên môi trường nhiều Pod bắt buộc phải thực thi bằng **Redis Lua Script** hoặc pipeline nguyên tử?',
    frontHint: 'Tránh lỗi Race Condition giữa bước `GET` kiểm tra số lượt và bước `INCR` tăng bộ đếm.',
    backAnswer:
      'Nếu bạn lưu bộ đếm Rate Limit trong RAM của từng Pod, kẻ tấn công có thể nhân số lượt gọi lên $N$ lần theo số Pod. Khi đưa lên **Redis dùng chung**, nếu code Python gọi lệnh `GET count` (thấy `99 < 100`) rồi mới gọi `INCR count` ở 2 bước mạng rời nhau, 50 request gửi đến cùng một mili-giây sẽ đều đọc thấy `99` và lọt qua hết (**Race Condition**). Đóng gói logic kiểm tra + tăng bộ đếm vào một **Redis Lua Script** đảm bảo toàn bộ thao tác thực thi **nguyên tử (Atomic 100%)** trên Redis.',
    backAnalogy:
      'Cửa xoay cơ khí vừa đếm người vừa khóa chốt trong cùng 1 chuyển động bánh răng (`Atomic Lua Script`), thay vì để bảo vệ nhìn bằng mắt rồi mới chạy ra đóng cửa.',
    codeSnippet: `# Thuật toán Fixed-Window Rate Limit nguyên tử trên Redis:\n# current = redis.call("INCR", KEYS[1])\n# if current == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end\n# return current <= tonumber(ARGV[2])`,
    relatedTermIds: ['eco-redis', 'concept-security', 'eco-fastapi'],
  },
  {
    id: 'fc-100',
    stageId: 'stage-7',
    level: 'master',
    category: 'Bảo mật Backend Python (OWASP)',
    frontQuestion: 'Ba nguyên tắc bảo mật sống còn trong Backend Python đối với câu lệnh SQL, so sánh chữ ký/Token bí mật, và kiểm tra lỗ hổng thư viện là gì?',
    frontHint: 'Parameterized Queries (Cấm f-string trong SQL) + `secrets.compare_digest()` chống Timing Attack + `pip-audit`/`uv`.',
    backAnswer:
      '3 chốt chặn an ninh bắt buộc: (1) **Chống SQL Injection**: Tuyệt đối không nối chuỗi f-string vào câu lệnh SQL (`f"SELECT ... WHERE name = \'{name}\'"`); luôn dùng ORM hoặc **Bound Parameters** (`text("... WHERE name = :name"), {"name": name}`); (2) **Chống Timing Attack**: Khi so sánh Webhook HMAC Signature hoặc API Key, phải dùng **`secrets.compare_digest(a, b)`** (so sánh trong thời gian hằng số) thay vì `a == b`; (3) **Supply Chain Security**: Quét lỗ hổng CVE trong cây thư viện trên CI/CD bằng `pip-audit` / `ruff` (`S` rules - Bandit).',
    backAnalogy:
      'Không bao giờ cho khách tự viết lệnh vào sổ điều hành bếp (`SQLi`), két sắt phải mất đúng 1 giây để kiểm tra mọi mã số để kẻ trộm không nghe tiếng lạch cạch đoán từng chữ số (`compare_digest`).',
    codeSnippet: `import secrets\nfrom sqlalchemy import text\n\n# 1. So sánh chữ ký bảo mật trong thời gian hằng số (Constant-time):\nis_valid = secrets.compare_digest(received_hmac, expected_hmac)\n# 2. Truy vấn SQL tham số hóa an toàn tuyệt đối:\nstmt = text("SELECT id FROM users WHERE email = :email").bindparams(email=user_input)`,
    relatedTermIds: ['concept-security', 'eco-sqlalchemy', 'tool-ruff'],
  },
];

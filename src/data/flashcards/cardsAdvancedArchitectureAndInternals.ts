import { FlashcardItem } from '@/types/assessment.types';

export const FLASHCARDS_ADVANCED_INTERNALS: FlashcardItem[] = [
  // ============================================================================
  // STAGE 3: KIẾN TRÚC DỰ ÁN, PACKAGING, LOGGING & PYTEST MASTERY (fc-216 -> fc-233)
  // ============================================================================
  {
    id: 'fc-216',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Đóng gói & Build System (PEP 517/518)',
    frontQuestion: 'Bảng `[build-system]` trong `pyproject.toml` (với `hatchling`, `setuptools`, `maturin`) đóng vai trò gì khi đóng gói hoặc cài đặt dự án ở chế độ Editable (`uv sync` / `pip install -e .`)?',
    frontHint: 'Chỉ định Backend chịu trách nhiệm biến mã nguồn `src/` thành gói `.whl` hoặc liên kết vào `.venv`.',
    backAnswer:
      'Chuẩn **PEP 517 / PEP 518** tách biệt công cụ quản lý (`uv`, `pip`) khỏi bộ máy đóng gói (**Build Backend**). Bảng `[build-system]` khai báo công cụ nào sẽ đọc `[project]` để đóng gói mã nguồn: **`hatchling`** (nhẹ, nhanh, mặc định hiện đại cho Python thuần), **`setuptools`** (truyền thống), hoặc **`maturin`** (khi dự án có lõi viết bằng Rust/PyO3). Nếu thiếu `[build-system]`, `uv` / `pip` có thể chỉ cài dependencies mà **không cài đặt chính package `src/my_app` vào `.venv`**!',
    backAnalogy:
      '`[project]` là bản thiết kế sản phẩm, còn `[build-system]` là chỉ định dây chuyền nhà máy nào (`hatchling` hay `maturin`) sẽ lắp ráp sản phẩm đó đóng vào thùng.',
    codeSnippet: `[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"`,
    relatedTermIds: ['tool-pyproject-toml', 'tool-uv'],
  },
  {
    id: 'fc-217',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Đóng gói & CLI Entrypoints',
    frontQuestion: 'Làm thế nào mục `[project.scripts]` trong `pyproject.toml` biến một hàm Python bình thường thành một câu lệnh Terminal (như `ruff`, `pytest`, `uvicorn`)?',
    frontHint: 'Trình cài đặt tự sinh một wrapper script trong `.venv/bin/<tên_lệnh>` gọi thẳng tới `module:function`.',
    backAnswer:
      'Khi bạn khai báo `[project.scripts]` dạng `my-cli = "my_app.cli:main"`, lúc chạy `uv sync` hoặc `pip install -e .`, trình cài đặt sẽ tự động tạo một file thực thi `.venv/bin/my-cli` (hoặc `.exe` trên Windows). Khi gõ `my-cli` trên Terminal, file này tự import hàm `main` từ `my_app.cli` và gọi `sys.exit(main())`.',
    backAnalogy:
      'Gắn một nút bấm vật lý ngoài vỏ máy (`my-cli`) nối dây trực tiếp vào công tắc hàm `main()` bên trong bo mạch (`my_app.cli`).',
    codeSnippet: `# Trong pyproject.toml:
[project.scripts]
 billing-cli = "billing_app.cli:app"

# Chạy ngay trên Terminal mà không cần gõ 'python src/...':
# $ uv run billing-cli --help`,
    relatedTermIds: ['tool-pyproject-toml', 'tool-uv'],
  },
  {
    id: 'fc-218',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Kiến trúc Package (PEP 420)',
    frontQuestion: 'Sự khác biệt giữa **Regular Package** (có file `__init__.py`) và **Namespace Package** (không có `__init__.py` theo PEP 420) là gì?',
    frontHint: 'Cho phép chia nhỏ một không gian tên chung (`company.auth`, `company.billing`) thành nhiều repository độc lập.',
    backAnswer:
      '- **Regular Package**: Thư mục chứa file `__init__.py`. Trong 99% ứng dụng thông thường, bạn **luôn nên tạo `__init__.py`** để tường minh và tránh lỗi công cụ tìm kiếm.\n- **Namespace Package (PEP 420)**: Thư mục cố tình không có `__init__.py`, cho phép nhiều thư viện cài riêng lẻ (`company-auth`, `company-payments`) cùng ghép chung vào một không gian tên gốc `import company.auth` và `import company.payments`.',
    backAnalogy:
      'Regular Package là một tòa nhà nguyên khối có sảnh lễ tân (`__init__.py`); Namespace Package là một khu phố mở cho phép nhiều tòa nhà độc lập cùng mang địa chỉ chung một tên đường.',
    codeSnippet: `# Cấu trúc chuẩn Regular Package (Khuyên dùng cho hầu hết dự án):
# src/
# └── my_app/
#     ├── __init__.py
#     └── main.py`,
    relatedTermIds: ['concept-package-init', 'kw-import'],
  },
  {
    id: 'fc-219',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Quản lý Phiên bản Phụ thuộc',
    frontQuestion: 'Trong `pyproject.toml`, các ký hiệu ràng buộc phiên bản `>=1.2.0,<2.0.0`, `~=1.4.2` (Compatible release) và `==1.4.2` có ý nghĩa gì?',
    frontHint: '`~=1.4.2` tương đương `>=1.4.2,<1.5.0` (chỉ nhận bản vá lỗi Patch, không nhảy Minor).',
    backAnswer:
      '- **`>=1.2.0,<2.0.0`**: Cho phép nâng cấp các bản Minor/Patch trong nhánh `1.x` (tương tự dấu mũ `^1.2.0` trong `package.json`).\n- **`~=1.4.2`**: Toán tử tương thích (PEP 440) — cho phép nâng cấp chữ số cuối cùng (`>=1.4.2,<1.5.0`), tương đương dấu ngã `~1.4.2` trong npm.\n- **`==1.4.2`**: Ghim cứng chính xác phiên bản `1.4.2`.',
    backAnalogy:
      '`>=1.2,<2.0` là cho phép nâng cấp nội thất miễn không đập khung nhà; `~=1.4.2` là chỉ cho phép sơn sửa nhỏ trong cùng thiết kế phòng.',
    codeSnippet: `dependencies = [
    "fastapi>=0.115.0,<1.0.0",
    "pydantic~=2.9.0",       # Tương đương >=2.9.0, <2.10.0
]`,
    relatedTermIds: ['tool-pyproject-toml'],
  },
  {
    id: 'fc-220',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Kiểm thử Chuyên sâu (Pytest)',
    frontQuestion: 'File `conftest.py` trong thư mục `tests/` của `pytest` có cơ chế đặc biệt gì? Tại sao không bao giờ cần viết `import conftest`?',
    frontHint: 'Pytest tự động phát hiện và tiêm (inject) mọi `@pytest.fixture` trong `conftest.py` theo cấp thư mục.',
    backAnswer:
      '`conftest.py` là file cấu hình và chia sẻ **Fixtures** cục bộ của `pytest`. Mọi `@pytest.fixture` khai báo trong `tests/conftest.py` sẽ được `pytest` **tự động khám phá và truyền trực tiếp vào tham số của các hàm `test_*`** trong thư mục đó và các thư mục con mà **tuyệt đối không cần (và không nên) `import conftest`**.',
    backAnalogy:
      'Hệ thống điện nước âm tường của tòa nhà (`conftest.py`): mỗi phòng thí nghiệm (`test_*.py`) chỉ cần mở vòi là có nước dùng ngay mà không cần tự kéo ống.',
    codeSnippet: `# Trong tests/conftest.py:
import pytest

@pytest.fixture
def sample_user() -> dict:
    return {"id": 1, "role": "admin"}

# Trong tests/test_auth.py (Không cần import conftest!):
def test_is_admin(sample_user: dict) -> None:
    assert sample_user["role"] == "admin"`,
    relatedTermIds: ['tool-pytest'],
  },
  {
    id: 'fc-221',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Kiểm thử Chuyên sâu (Pytest)',
    frontQuestion: 'Các cấp độ `scope` của `@pytest.fixture(scope=...)` (`"function"`, `"class"`, `"module"`, `"session"`) và cơ chế dọn dẹp bằng `yield` hoạt động như thế nào?',
    frontHint: 'Phần trước `yield` là Setup, phần sau `yield` là Teardown luôn chạy sau khi test kết thúc!',
    backAnswer:
      '1. **`scope`**: Quyết định tần suất khởi tạo fixture:\n   - `"function"` (mặc định): Tạo mới cho **mỗi hàm test** (cô lập tuyệt đối).\n   - `"module"` / `"session"`: Chỉ tạo **1 lần duy nhất** cho cả file hoặc cả đợt chạy test (dùng cho việc khởi tạo Docker container / Database schema nặng).\n2. **Cơ chế `yield`**: Thay vì `return`, dùng `yield resource` để giao tài nguyên cho hàm test; ngay khi hàm test chạy xong (dù Pass hay Fail), code nằm **sau dòng `yield`** sẽ tự động chạy để đóng kết nối / xóa dữ liệu tạm.',
    backAnalogy:
      'Trước `yield` là dọn bàn bày tiệc mời khách (`test_*`), sau `yield` là đội ngũ tự động vào thu dọn bát đĩa ngay khi khách đứng dậy.',
    codeSnippet: `@pytest.fixture(scope="function")
def db_session():
    session = create_test_session()
    yield session          # Giao session cho hàm test chạy
    session.rollback()     # Tự động chạy sau khi hàm test kết thúc!
    session.close()`,
    relatedTermIds: ['tool-pytest', 'kw-yield'],
  },
  {
    id: 'fc-222',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Kiểm thử Chuyên sâu (Pytest)',
    frontQuestion: 'Làm thế nào để kiểm tra một hàm **bắt buộc phải ném ra đúng ngoại lệ** kèm thông báo lỗi mong muốn trong `pytest`?',
    frontHint: 'Sử dụng Context Manager `with pytest.raises(ValueError, match="..."):`.',
    backAnswer:
      'Dùng **`with pytest.raises(ExpectedException, match=r"regex_pattern"):`**. Nếu dòng code bên trong khối `with` ném đúng ngoại lệ và chuỗi thông báo lỗi khớp với biểu thức `match`, bài test **Pass**; nếu code không ném lỗi hoặc ném sai loại lỗi, `pytest` sẽ đánh **Fail** ngay lập tức.',
    backAnalogy:
      'Diễn tập báo cháy: kích hoạt khói giả và kiểm tra xem còi báo động có kêu đúng tiếng còi quy định hay không.',
    codeSnippet: `import pytest

def withdraw(amount: int) -> int:
    if amount <= 0:
        raise ValueError("Số tiền rút phải lớn hơn 0")
    return amount

def test_withdraw_negative_raises() -> None:
    with pytest.raises(ValueError, match="lớn hơn 0"):
        withdraw(-50)`,
    relatedTermIds: ['tool-pytest', 'kw-raise'],
  },
  {
    id: 'fc-223',
    stageId: 'stage-3',
    level: 'pro',
    category: 'Kiểm thử & Cạm bẫy Mocking',
    frontQuestion: 'Quy tắc vàng khi dùng `unittest.mock.patch()`: Tại sao phải **"Patch tại nơi đối tượng được IMPORT sử dụng, chứ KHÔNG phải nơi đối tượng được định nghĩa gốc"**?',
    frontHint: 'Nếu `service.py` viết `from gateway import charge_card`, thì phải patch `"service.charge_card"`!',
    backAnswer:
      'Khi `service.py` chạy dòng `from gateway import charge_card`, nó đã tạo một nhãn tên `charge_card` nằm ngay trong không gian tên của **`service`**. Nếu trong bài test bạn viết `@patch("gateway.charge_card")`, bạn chỉ thay thế nhãn trong module `gateway`, còn `service.charge_card` vẫn trỏ thẳng vào hàm thật! Do đó, luôn phải patch **tại nơi hàm đó được gọi/tra cứu**: `@patch("my_app.service.charge_card")`.',
    backAnalogy:
      'Nếu nhân viên ở phòng Kế toán (`service`) đã lưu số điện thoại vào danh bạ cá nhân, bạn sửa bảng số ở Tổng đài (`gateway`) cũng vô ích — phải sửa trực tiếp trong danh bạ của phòng Kế toán!',
    codeSnippet: `# Giả sử my_app/order_service.py có dòng:
# from my_app.payment_gateway import send_payment

# ❌ SAI: Vẫn gọi hàm thật trong order_service!
# @patch("my_app.payment_gateway.send_payment")

# ✅ ĐÚNG: Patch ngay tại namespace của module đang sử dụng nó
from unittest.mock import patch
with patch("my_app.order_service.send_payment", return_value={"ok": True}):
    ...`,
    relatedTermIds: ['tool-pytest', 'kw-import'],
  },
  {
    id: 'fc-224',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Kiểm thử Chuyên sâu (Pytest)',
    frontQuestion: 'Các fixture tích hợp sẵn cực mạnh của `pytest` như `tmp_path`, `monkeypatch` và `caplog` giải quyết những bài toán thực tế nào?',
    frontHint: 'Tạo thư mục tạm tự xóa, giả lập biến môi trường `.env` an toàn, và kiểm tra nội dung Log.',
    backAnswer:
      '- **`tmp_path`**: Cung cấp một đối tượng `pathlib.Path` trỏ tới thư mục tạm riêng biệt cho từng hàm test (tự động dọn sạch sau khi test xong) — không bao giờ làm bẩn ổ cứng dự án.\n- **`monkeypatch`**: Cho phép đặt/xóa biến môi trường tạm thời (`monkeypatch.setenv("API_KEY", "test")`) hoặc thay thế thuộc tính object rồi tự động khôi phục 100% khi hàm test kết thúc.\n- **`caplog`**: Bắt toàn bộ bản ghi `logging` phát sinh trong lúc chạy test để kiểm tra `assert "Payment failed" in caplog.text`.',
    backAnalogy:
      'Bộ đạo cụ phim trường tự hủy: dựng phòng giả (`tmp_path`), đổi biển hiệu tạm (`monkeypatch`), thu âm hiện trường (`caplog`), quay xong tự trả lại mặt bằng nguyên trạng.',
    codeSnippet: `def test_export_report(tmp_path, monkeypatch):
    monkeypatch.setenv("APP_ENV", "testing")
    out_file = tmp_path / "report.txt"
    out_file.write_text("OK", encoding="utf-8")
    assert out_file.read_text(encoding="utf-8") == "OK"`,
    relatedTermIds: ['tool-pytest', 'stdlib-pathlib'],
  },
  {
    id: 'fc-225',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Logging & Observability',
    frontQuestion: 'Khi bắt ngoại lệ trong khối `except`, sự khác biệt giữa `logger.error(f"Lỗi: {e}")` và `logger.exception("Lỗi xử lý đơn hàng")` (hoặc `exc_info=True`) là gì?',
    frontHint: 'Mất dấu dòng code gây lỗi vs Ghi lại toàn bộ Stack Trace (Traceback) đầy đủ vào log!',
    backAnswer:
      'Nếu chỉ gọi `logger.error(f"Lỗi: {e}")`, bản ghi log chỉ có thông báo lỗi ngắn ngủi (ví dụ `"division by zero"`), hoàn toàn **mất sạch dấu vết (Traceback)** xem lỗi nổ ra ở file nào, dòng số mấy! Khi nằm trong khối `except`, dùng **`logger.exception("...")`** (hoặc `logger.error("...", exc_info=True)`) sẽ tự động đính kèm toàn bộ Stack Trace vào bản ghi log để gỡ lỗi tức thì.',
    backAnalogy:
      '`logger.error(e)` chỉ báo "Xe bị hỏng", còn `logger.exception()` gửi kèm cả hộp đen hành trình và ảnh chụp vị trí linh kiện bị gãy.',
    codeSnippet: `import logging
logger = logging.getLogger(__name__)

try:
    1 / 0
except ZeroDivisionError:
    # Tự động đính kèm toàn bộ Traceback vào log:
    logger.exception("Lỗi tính toán tỷ lệ chiết khấu")`,
    relatedTermIds: ['stdlib-logging', 'kw-except'],
  },
  {
    id: 'fc-226',
    stageId: 'stage-3',
    level: 'pro',
    category: 'Logging & Tracing (ContextVars)',
    frontQuestion: 'Trong hệ thống Web bất đồng bộ (AsyncIO / FastAPI) xử lý 1.000 request đồng thời trên cùng 1 luồng (Thread), tại sao phải dùng `contextvars.ContextVar` thay vì `threading.local()` để gắn `request_id` vào mọi dòng Log?',
    frontHint: '1 OS Thread chạy hàng trăm Coroutine xen kẽ nhau — `threading.local()` sẽ làm trộn lẫn `request_id` của khách hàng A sang khách hàng B!',
    backAnswer:
      '`threading.local()` lưu dữ liệu theo **OS Thread**. Nhưng trong FastAPI / AsyncIO, **1 Thread duy nhất chạy hàng nghìn Coroutines (`async def`)** chuyển ngữ cảnh tại mỗi điểm `await`. Nếu dùng `threading.local()`, các request sẽ ghi đè `request_id` lên nhau! Module chuẩn **`contextvars.ContextVar`** cô lập trạng thái theo từng **Async Task / Coroutine**, đảm bảo mọi dòng log trong suốt vòng đời một request luôn mang đúng `request_id` của request đó.',
    backAnalogy:
      '`threading.local()` là gắn biển tên lên bàn làm việc (nhiều người ngồi chung bàn sẽ bị nhầm tên); `ContextVar` là đeo thẻ tên trực tiếp lên ngực áo của từng hồ sơ công việc.',
    codeSnippet: `from contextvars import ContextVar

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="system")

async def handle_request(req_id: str) -> str:
    token = request_id_ctx.set(req_id)
    try:
        return f"Logging with request_id={request_id_ctx.get()}"
    finally:
        request_id_ctx.reset(token)`,
    relatedTermIds: ['stdlib-asyncio', 'stdlib-logging'],
  },
  {
    id: 'fc-227',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Ngoại lệ Hiện đại (Python 3.11+)',
    frontQuestion: 'Cú pháp `ExceptionGroup` và `except*` (ra mắt trong Python 3.11) giải quyết bài toán gì khi chạy nhiều tác vụ song song (`asyncio.TaskGroup`)?',
    frontHint: 'Chuyện gì xảy ra khi 3 tác vụ chạy song song cùng lúc thất bại với 3 loại lỗi khác nhau?',
    backAnswer:
      'Với `try / except` truyền thống, tại một thời điểm chỉ bắt và ném được **1 ngoại lệ duy nhất**. Nhưng khi chạy 5 tác vụ đồng thời trong `asyncio.TaskGroup`, nếu 2 tác vụ cùng lỗi (`TimeoutError` và `ValueError`), Python gói cả hai vào một **`ExceptionGroup`**. Cú pháp **`except*`** cho phép lọc và xử lý đồng thời từng nhóm lỗi con bên trong `ExceptionGroup` mà không làm rơi mất lỗi nào!',
    backAnalogy:
      'Thay vì chỉ xử lý được 1 biên bản sự cố mỗi lần, `except*` mở hồ sơ tổng hợp (`ExceptionGroup`) và phân loại từng nhóm sự cố cho đúng bộ phận chuyên trách xử lý cùng lúc.',
    codeSnippet: `try:
    raise ExceptionGroup("Lỗi đa tác vụ", [ValueError("Sai ID"), TimeoutError("Quá hạn")])
except* ValueError as eg:
    print("Đã bắt nhóm lỗi dữ liệu:", eg.exceptions)
except* TimeoutError as eg:
    print("Đã bắt nhóm lỗi mạng:", eg.exceptions)`,
    relatedTermIds: ['kw-try', 'kw-except', 'stdlib-asyncio'],
  },
  {
    id: 'fc-228',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Context Manager Nâng cao',
    frontQuestion: '`contextlib.ExitStack` dùng để làm gì khi bạn cần mở một số lượng động (dynamic) các file hoặc kết nối mà không biết trước có bao nhiêu cái lúc viết code?',
    frontHint: 'Thay thế việc lồng `with a, b, c:` cố định bằng một ngăn xếp quản lý các Context Manager động.',
    backAnswer:
      'Khi số lượng tài nguyên cần mở chỉ biết lúc Runtime (ví dụ danh sách `filenames` do người dùng truyền vào, hoặc bật/tắt một Context Manager theo điều kiện `if`), bạn không thể viết cố định `with open(...)`. **`ExitStack`** cho phép đẩy động từng Context Manager vào ngăn xếp qua **`stack.enter_context(cm)`** và cam kết đóng toàn bộ theo đúng thứ tự ngược lại (**LIFO**) ngay khi thoát khỏi khối `with ExitStack() as stack:`.',
    backAnalogy:
      'Người quản gia cầm móc treo chìa khóa vạn năng (`ExitStack`): bạn mở thêm bao nhiêu căn phòng tùy ý (`enter_context`), khi ra về quản gia tự động khóa lại tất cả từ phòng cuối cùng ra phòng đầu tiên.',
    codeSnippet: `from contextlib import ExitStack
from pathlib import Path

def merge_files(paths: list[Path]) -> str:
    with ExitStack() as stack:
        files = [stack.enter_context(p.open("r", encoding="utf-8")) for p in paths]
        return "\\n".join(f.read() for f in files)`,
    relatedTermIds: ['stdlib-contextlib', 'kw-with'],
  },
  {
    id: 'fc-229',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Context Manager Nâng cao',
    frontQuestion: '`contextlib.suppress(*exceptions)` giúp thay thế đoạn code `try ... except ...: pass` như thế nào cho chuẩn Pythonic?',
    frontHint: 'Nói rõ ý định "Cố tình bỏ qua ngoại lệ cụ thể này" chỉ trong 1 dòng `with`.',
    backAnswer:
      'Thay vì viết 4 dòng `try: ... except FileNotFoundError: pass` (vừa dài dòng vừa dễ bị Linter cảnh báo lỗi nuốt ngoại lệ), bạn dùng **`with suppress(FileNotFoundError):`**. Code vừa ngắn gọn, vừa thể hiện cực kỳ tường minh ý định bỏ qua đúng ngoại lệ đó.',
    backAnalogy:
      'Bật chế độ "Chống ồn chủ động" cho đúng tần số tiếng ồn đã biết trước.',
    codeSnippet: `from contextlib import suppress
import os

# Tự động bỏ qua nếu file tạm không tồn tại, không cần try/except/pass:
with suppress(FileNotFoundError):
    os.remove("temp_cache.tmp")`,
    relatedTermIds: ['stdlib-contextlib', 'kw-with'],
  },
  {
    id: 'fc-230',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Decorators Nâng cao',
    frontQuestion: 'Một **Decorator có nhận tham số** (ví dụ `@retry(max_attempts=3)`) cần bao nhiêu tầng hàm `def` lồng nhau và tại sao luôn phải có `@functools.wraps(func)`?',
    frontHint: '3 tầng hàm: `retry(max_attempts)` -> `decorator(func)` -> `wrapper(*args, **kwargs)`.',
    backAnswer:
      '1. Cần **3 tầng hàm**:\n   - Tầng 1 (`def retry(max_attempts=3):`): Nhận cấu hình tham số và trả về `decorator`.\n   - Tầng 2 (`def decorator(func):`): Nhận hàm gốc `func` và trả về `wrapper`.\n   - Tầng 3 (`def wrapper(*args, **kwargs):`): Thực thi logic bọc quanh `func(*args, **kwargs)`.\n2. **`@wraps(func)`** sao chép `__name__`, `__doc__`, `__annotations__` và `__wrapped__` từ `func` sang `wrapper`. Nếu quên `@wraps(func)`, các framework như **FastAPI** hoặc **Sphinx** sẽ mất sạch chữ ký hàm và docstring!',
    backAnalogy:
      'Tầng 1 là chọn kích cỡ hộp quà (`max_attempts`), tầng 2 là bỏ món quà (`func`) vào hộp, tầng 3 là giấy gói bên ngoài (`wrapper`), và `@wraps` là dán lại đúng nhãn tên món quà gốc lên ngoài vỏ hộp.',
    codeSnippet: `from functools import wraps

def repeat(times: int):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(times - 1):
                func(*args, **kwargs)
            return func(*args, **kwargs)
        return wrapper
    return decorator`,
    relatedTermIds: ['stdlib-functools', 'kw-def'],
  },
  {
    id: 'fc-231',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Generators & Ủy quyền (`yield from`)',
    frontQuestion: 'Cú pháp **`yield from sub_generator`** khác gì so với viết vòng lặp `for item in sub_generator: yield item`?',
    frontHint: 'Ủy quyền trực tiếp kênh giao tiếp 2 chiều (`.send()`, `.throw()`, giá trị `return`) cho generator con.',
    backAnswer:
      'Về mặt cơ bản, `yield from iterable` giúp làm phẳng và nhường quyền phát sinh từng phần tử cho generator con mà không cần viết vòng lặp `for`. Hơn thế nữa, ở tầng sâu, `yield from` thiết lập một **đường ống trực tiếp 2 chiều** giữa người gọi bên ngoài và generator con (truyền thẳng `.send()`, ngoại lệ `.throw()` và bắt được cả giá trị `return` cuối cùng của generator con).',
    backAnalogy:
      'Tổng đài viên chuyển máy trực tiếp (`yield from`) cho chuyên viên kỹ thuật nói chuyện thẳng với khách hàng, thay vì nghe từng câu rồi nhắc lại (`for ... yield`).',
    codeSnippet: `def flatten_tree(node: list):
    for item in node:
        if isinstance(item, list):
            yield from flatten_tree(item)  # Đệ quy generator cực gọn!
        else:
            yield item

print(list(flatten_tree([1, [2, [3, 4]], 5])))  # [1, 2, 3, 4, 5]`,
    relatedTermIds: ['kw-yield', 'kw-from'],
  },
  {
    id: 'fc-232',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Dataclasses Nâng cao',
    frontQuestion: 'Trong `@dataclass(frozen=True, slots=True, kw_only=True)`, 3 tham số `frozen`, `slots`, và `kw_only` mang lại lợi ích gì cho kiến trúc Domain Model?',
    frontHint: 'Bất biến (Immutable + Hashable), giảm 40%+ RAM, và ép truyền tên tham số rõ ràng khi khởi tạo.',
    backAnswer:
      '- **`frozen=True`**: Biến object thành **Immutable (Bất biến)** — mọi nỗ lực gán lại thuộc tính đều ném `FrozenInstanceError`, đồng thời tự sinh hàm `__hash__` để làm key trong `dict` / phần tử trong `set` (rất chuẩn cho **Value Objects** trong DDD).\n- **`slots=True`** (Python 3.10+): Tự sinh `__slots__`, loại bỏ `__dict__` giúp giảm ~40–50% RAM và truy cập thuộc tính nhanh hơn.\n- **`kw_only=True`** (Python 3.10+): Bắt buộc gọi theo tên `Money(amount=100, currency="VND")`, chống truyền nhầm thứ tự đối số.',
    backAnalogy:
      'Đúc một đồng xu nguyên khối (`frozen=True`), khuôn siêu gọn nhẹ (`slots=True`) và khắc nhãn từng mặt rõ ràng (`kw_only=True`).',
    codeSnippet: `from dataclasses import dataclass

@dataclass(frozen=True, slots=True, kw_only=True)
class Money:
    amount: int
    currency: str = "VND"

m = Money(amount=50_000, currency="VND")`,
    relatedTermIds: ['stdlib-dataclasses', 'dunder-slots'],
  },
  {
    id: 'fc-233',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Dataclasses & Khởi tạo (`__post_init__`)',
    frontQuestion: 'Phương thức `__post_init__(self)` trong `@dataclass` được gọi khi nào và dùng để giải quyết bài toán gì?',
    frontHint: 'Chạy ngay sau khi `__init__` tự sinh của dataclass gán xong các thuộc tính.',
    backAnswer:
      'Vì `@dataclass` tự động sinh phương thức `__init__`, bạn không viết trực tiếp `__init__` nữa. Nếu muốn **kiểm tra tính hợp lệ (Validation)** giữa các trường hoặc **tính toán các thuộc tính dẫn xuất** ngay sau khi khởi tạo, bạn định nghĩa **`def __post_init__(self):`**. Hàm `__init__` tự sinh của dataclass sẽ tự động gọi `self.__post_init__()` ở dòng cuối cùng.',
    backAnalogy:
      'Sau khi công nhân lắp xong các bộ phận vào khung xe (`__init__`), kỹ sư kiểm định bước vào chạy bước kiểm tra và hiệu chỉnh cuối cùng (`__post_init__`).',
    codeSnippet: `from dataclasses import dataclass

@dataclass
class DateRange:
    start_day: int
    end_day: int

    def __post_init__(self) -> None:
        if self.end_day < self.start_day:
            raise ValueError("end_day không được nhỏ hơn start_day!")`,
    relatedTermIds: ['stdlib-dataclasses', 'dunder-init'],
  },

  // ============================================================================
  // STAGE 4: CPYTHON INTERNALS, BỘ NHỚ, DESCRIPTORS, METACLASSES & TYPING (fc-234 -> fc-252)
  // ============================================================================
  {
    id: 'fc-234',
    stageId: 'stage-4',
    level: 'advanced',
    category: 'CPython Internals & Object Caching',
    frontQuestion: 'Cơ chế **Small Integer Caching (`-5` đến `256`)** và **String Interning (`sys.intern`)** trong CPython hoạt động như thế nào? Tại sao tuyệt đối không được dùng `is` để so sánh số hoặc chuỗi?',
    frontHint: 'CPython tạo sẵn mảng Singleton cho các số nguyên nhỏ `[-5, 256]` lúc khởi động máy ảo.',
    backAnswer:
      'Để tránh cấp phát bộ nhớ lặp đi lặp lại cho các số nguyên dùng thường xuyên nhất, CPython khởi tạo sẵn một bể đối tượng cố định cho các số từ **`-5` đến `256`**. Do đó ở chế độ tương tác, `a = 256; b = 256; a is b` là `True`, nhưng với số lớn tạo động lúc runtime thì `a is b` có thể là `False`! Tương tự, **`sys.intern(s)`** lưu chuỗi vào bảng chuỗi dùng chung để so sánh bằng con trỏ $O(1)$. Vì đây là chi tiết tối ưu nội bộ của CPython, **luôn dùng `==`** để so sánh giá trị số và chuỗi.',
    backAnalogy:
      'Các con số từ `-5` đến `256` là các con dấu đúc sẵn để trên bàn dùng chung; các con số lớn hơn thì cần lúc nào mới khắc con dấu mới lúc đó.',
    codeSnippet: `import sys
s1 = sys.intern("user_status_active")
s2 = sys.intern("user_status_active")
print(s1 is s2)  # True (So sánh địa chỉ bộ nhớ tức thì O(1))`,
    relatedTermIds: ['concept-cpython', 'kw-is'],
  },
  {
    id: 'fc-235',
    stageId: 'stage-4',
    level: 'pro',
    category: 'CPython Internals & Cấu trúc Bộ nhớ',
    frontQuestion: 'Bên dưới CPython, một `list` cấp phát bộ nhớ như thế nào để đạt tốc độ `.append()` trung bình $O(1)$, và tại sao `sys.getsizeof(my_list)` không tính dung lượng các phần tử bên trong?',
    frontHint: 'Mảng con trỏ `PyObject**` với chiến lược cấp phát dư (Over-allocation: $0, 4, 8, 16, 25, 35...$).',
    backAnswer:
      '1. Trong CPython, `list` không lưu trực tiếp giá trị mà lưu một mảng liên tiếp các **con trỏ 8-byte (`PyObject**`)**. Khi đầy, CPython mở rộng dung lượng theo công thức tăng thêm ~12.5% ($0 \\rightarrow 4 \\rightarrow 8 \\rightarrow 16 \\rightarrow 25 \\rightarrow 35...$) nên phần lớn các lệnh `.append()` chỉ tốn **$O(1)$**.\n2. `sys.getsizeof(lst)` chỉ trả về kích thước phần khung `PyListObject` + mảng con trỏ (**Shallow size**), không cộng đệ quy kích thước của từng đối tượng mà các con trỏ đó trỏ tới.',
    backAnalogy:
      '`sys.getsizeof(list)` chỉ cân trọng lượng của chiếc tủ đựng hồ sơ và các ngăn kẹp, chưa cân trọng lượng của các tập tài liệu cất bên trong.',
    codeSnippet: `import sys
items = [1, 2, 3, 4]
print(sys.getsizeof(items))  # 88 bytes (Khung list + 4 con trỏ 8-byte)`,
    relatedTermIds: ['type-list', 'concept-cpython'],
  },
  {
    id: 'fc-236',
    stageId: 'stage-4',
    level: 'pro',
    category: 'CPython Internals & Compact Dict',
    frontQuestion: 'Từ Python 3.6+, cấu trúc bảng băm của `dict` đã được thiết kế lại (Compact Dict của Raymond Hettinger) như thế nào để vừa giảm 30%+ RAM vừa bảo toàn thứ tự chèn (Insertion Order)?',
    frontHint: 'Tách thành 2 mảng: mảng chỉ mục thưa `dk_indices` (1–8 byte/ô) và mảng dữ liệu đặc `dk_entries` nối đuôi liên tiếp.',
    backAnswer:
      'Trước Python 3.6, `dict` dùng một bảng băm thưa khổng lồ mà mỗi ô (slot) đều tốn 24 bytes (`hash`, `key_ptr`, `value_ptr`) dù đa số ô đang bỏ trống! Thiết kế **Compact Dict** tách làm 2 mảng:\n1. **`dk_indices`**: Bảng băm thưa chỉ lưu các số nguyên nhỏ (1 byte cho dict nhỏ) làm chỉ số trỏ sang mảng `entries`.\n2. **`dk_entries`**: Mảng đặc (dense array) lưu các bộ `(hash, key, value)` nối đuôi nhau theo đúng thứ tự chèn vào. Nhờ vậy vừa tiết kiệm hơn 30% RAM, vừa duyệt cực nhanh trên CPU Cache và tự nhiên giữ nguyên thứ tự chèn!',
    backAnalogy:
      'Thay vì xây 100 phòng kho lớn để trống một nửa, người ta xếp hàng hóa sát nhau theo thứ tự nhập kho (`dk_entries`) và chỉ treo một bảng sơ đồ nhỏ gọn ở cửa (`dk_indices`).',
    codeSnippet: `d = {"first": 1, "second": 2, "third": 3}
# Thứ tự duyệt luôn khớp 100% với thứ tự chèn vào (Chuẩn ngôn ngữ từ Python 3.7+):
print(list(d.keys()))  # ['first', 'second', 'third']`,
    relatedTermIds: ['type-dict', 'concept-cpython'],
  },
  {
    id: 'fc-237',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Tối ưu Bộ nhớ (`__slots__`)',
    frontQuestion: 'Cạm bẫy kế thừa với `__slots__`: Chuyện gì xảy ra nếu Class Cha khai báo `__slots__ = ("x", "y")` nhưng Class Con kế thừa lại quên không khai báo `__slots__`?',
    frontHint: 'Python sẽ âm thầm tạo lại `__dict__` trên mọi thực thể của Class Con, làm mất tác dụng tiết kiệm RAM!',
    backAnswer:
      'Nếu Class Cha có `__slots__ = ("x", "y")` nhưng Class Con `class Child(Parent):` không khai báo `__slots__`, Python sẽ **tự động gắn lại từ điển `__dict__`** cho các instance của `Child`! Để duy trì hiệu quả tiết kiệm RAM xuyên suốt cây kế thừa, Class Con **bắt buộc phải khai báo `__slots__`** (nếu không thêm thuộc tính mới thì khai báo rỗng `__slots__ = ()`, nếu có thêm thì chỉ liệt kê thuộc tính mới `__slots__ = ("z",)`).',
    backAnalogy:
      'Tầng 1 đã thiết kế tối giản không có phòng kho (`__slots__`), nhưng xây tầng 2 quên ghi quy định nên thợ xây lại tự ý xây thêm phòng kho cồng kềnh (`__dict__`).',
    codeSnippet: `class BasePoint:
    __slots__ = ("x", "y")

class Point3D(BasePoint):
    __slots__ = ("z",)  # Chỉ liệt kê thêm thuộc tính mới (không lặp lại "x", "y")!`,
    relatedTermIds: ['dunder-slots', 'dunder-dict'],
  },
  {
    id: 'fc-238',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Quản lý Bộ nhớ & Garbage Collection',
    frontQuestion: 'Tại sao phương thức hủy `__del__(self)` bị coi là nguy hiểm trong Python và tại sao nên dùng Context Manager (`with`) hoặc `weakref.finalize()` thay thế?',
    frontHint: 'Thời điểm chạy `__del__` không xác định, có thể hồi sinh đối tượng (Object Resurrection) hoặc gây rò rỉ trong chu trình tham chiếu.',
    backAnswer:
      '`__del__` không phải là hàm hủy tức thời như C++ destructor: nó chỉ chạy khi bộ đếm tham chiếu về 0 hoặc khi bộ thu gom rác (GC) quét qua. Nguy hiểm hơn, nếu bên trong `__del__` vô tình gán `self` vào một biến toàn cục (**Object Resurrection**), đối tượng sẽ sống lại, hoặc nếu xảy ra ngoại lệ trong `__del__`, ngoại lệ đó chỉ bị in ra `stderr` rồi bị bỏ qua. Do đó, quản lý tài nguyên luôn dùng **`with` (`__enter__`/`__exit__`)** hoặc **`weakref.finalize(obj, callback)`**.',
    backAnalogy:
      'Chờ xe rác đi qua mới khóa van gas (`__del__`) là cực kỳ rủi ro; bạn phải chủ động khóa van ngay khi nấu ăn xong (`with` / Context Manager).',
    codeSnippet: `import weakref

class TempResource:
    pass

res = TempResource()
# Đăng ký callback dọn dẹp an toàn không sợ Reference Cycle:
weakref.finalize(res, print, "Tài nguyên đã được thu hồi an toàn!")`,
    relatedTermIds: ['stdlib-weakref', 'concept-gc'],
  },
  {
    id: 'fc-239',
    stageId: 'stage-4',
    level: 'master',
    category: 'Garbage Collection & Tối ưu Web Server',
    frontQuestion: 'Tại sao các hệ thống Web lớn (như Instagram chạy Gunicorn/Uvicorn Pre-fork) lại gọi `gc.freeze()` ngay trước khi `fork()` các tiến trình Worker?',
    frontHint: 'Ngăn chặn hiệu ứng Copy-on-Write (CoW) làm nhân bản hàng trăm MB RAM chỉ vì bộ đếm `ob_refcnt` / GC header bị sửa!',
    backAnswer:
      'Trên Linux, khi tiến trình Master `fork()` ra 8 tiến trình Worker, tất cả dùng chung các trang bộ nhớ vật lý nhờ cơ chế **Copy-on-Write (CoW)**. Tuy nhiên, trong CPython, mỗi khi bộ thu gom rác (Cyclic GC) chạy quét các đối tượng, nó sẽ **ghi/sửa vào phần Header của `PyObject`** để đánh dấu chu trình. Việc ghi vài byte vào Header khiến hệ điều hành Linux tưởng trang nhớ đã bị sửa và **sao chép toàn bộ trang nhớ 4KB sang vùng RAM riêng**! Gọi **`gc.freeze()`** (Python 3.7+) chuyển toàn bộ các đối tượng đã nạp lúc khởi động sang vùng vĩnh cửu không bị GC đụng tới, giữ nguyên bộ nhớ chia sẻ CoW giữa các Worker.',
    backAnalogy:
      '8 nhân viên cùng đọc chung 1 cuốn từ điển gốc trên bàn kính; nếu 1 người lấy bút chì đánh dấu vào lề trang giấy (GC scan), quản lý buộc phải photo nguyên cuốn từ điển mới cho riêng người đó (mất RAM CoW). `gc.freeze()` ép plastic cuốn từ điển gốc để không ai ghi đè lên nữa.',
    codeSnippet: `import gc

# Trong hook pre_fork của Gunicorn / Master Process sau khi import hết các thư viện lớn:
gc.collect()
gc.freeze()  # Đóng băng các object hiện tại để bảo toàn Copy-on-Write RAM!`,
    relatedTermIds: ['concept-gc', 'concept-cpython'],
  },
  {
    id: 'fc-240',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Metaprogramming & Truy cập Thuộc tính',
    frontQuestion: 'Phân biệt rõ ràng giữa `__getattr__(self, name)` và `__getattribute__(self, name)`. Tại sao viết sai `__getattribute__` lại rất dễ gây lỗi đệ quy vô tận (`RecursionError`)?',
    frontHint: '`__getattr__` chỉ chạy khi KHÔNG tìm thấy thuộc tính; `__getattribute__` chặn MỌI lần truy cập thuộc tính!',
    backAnswer:
      '- **`__getattr__(self, name)`**: Chỉ được gọi như **phương án cứu cánh cuối cùng (Fallback)** khi Python đã tìm khắp `instance.__dict__` và `Class` mà không thấy thuộc tính `name`.\n- **`__getattribute__(self, name)`**: Đón lõng **100% mọi truy cập thuộc tính** `obj.x` ngay từ bước đầu tiên. Nếu bên trong `__getattribute__` bạn viết `return self.__dict__[name]`, việc đọc `self.__dict__` lại kích hoạt chính `__getattribute__` gây **`RecursionError`**! Bắt buộc phải ủy quyền qua `return super().__getattribute__(name)`.',
    backAnalogy:
      '`__getattribute__` là cổng kiểm soát an ninh chặn mọi người ra vào; còn `__getattr__` là bàn hướng dẫn chỉ làm việc khi khách tìm khắp tòa nhà mà không thấy phòng.',
    codeSnippet: `class DynamicConfig:
    def __init__(self, data: dict) -> None:
        self._data = data

    def __getattr__(self, name: str):
        # Chỉ chạy khi 'name' không phải là '_data' hay method có sẵn:
        if name in self._data:
            return self._data[name]
        raise AttributeError(f"Không có cấu hình '{name}'")`,
    relatedTermIds: ['dunder-getattr', 'dunder-dict'],
  },
  {
    id: 'fc-241',
    stageId: 'stage-4',
    level: 'master',
    category: 'Descriptor Protocol Chuyên sâu',
    frontQuestion: 'Trong **Descriptor Protocol**, thứ tự ưu tiên tra cứu thuộc tính `obj.attr` giữa **Data Descriptor**, **`obj.__dict__`**, và **Non-Data Descriptor** là gì? `@functools.cached_property` lợi dụng điều này ra sao?',
    frontHint: 'Data Descriptor (có `__set__`) > `obj.__dict__` > Non-Data Descriptor (chỉ có `__get__`).',
    backAnswer:
      'Thứ tự ưu tiên khi Python tìm `obj.attr`:\n1. **Data Descriptor** trên Class (định nghĩa cả `__get__` và `__set__` hoặc `__delete__`, ví dụ `@property`).\n2. **Từ điển thực thể `obj.__dict__["attr"]`**.\n3. **Non-Data Descriptor** trên Class (chỉ định nghĩa `__get__`, ví dụ các hàm/method thông thường và **`@cached_property`**).\nNhờ thứ tự này, `@cached_property` được viết dưới dạng một **Non-Data Descriptor**: ở lần gọi đầu tiên, `__get__` tính kết quả rồi **ghi thẳng vào `obj.__dict__["attr"]`**. Từ lần thứ 2 trở đi, Python tìm thấy ngay trong `obj.__dict__` (bước 2) nên trả về tức thì mà không cần gọi lại Descriptor (bước 3) nữa!',
    backAnalogy:
      'Lần đầu tiên bạn hỏi trợ lý (`@cached_property` ở bước 3), trợ lý tính xong liền dán kết quả ngay lên màn hình trước mặt bạn (`obj.__dict__` ở bước 2); các lần sau bạn nhìn thẳng vào màn hình là thấy ngay!',
    codeSnippet: `from functools import cached_property

class Report:
    @cached_property
    def expensive_summary(self) -> str:
        print("Đang tính toán nặng (chỉ chạy đúng 1 lần)...")
        return "Báo cáo tổng hợp 2026"

r = Report()
print(r.expensive_summary)  # Tính toán & lưu vào r.__dict__['expensive_summary']
print(r.expensive_summary)  # Đọc thẳng từ r.__dict__ cực nhanh!`,
    relatedTermIds: ['concept-descriptor', 'stdlib-functools', 'dunder-dict'],
  },
  {
    id: 'fc-242',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Descriptor Protocol (`__set_name__`)',
    frontQuestion: 'Phương thức `__set_name__(self, owner, name)` (PEP 487) trong một Descriptor giúp tự động hóa việc gì khi khai báo thuộc tính trong Class?',
    frontHint: 'Descriptor tự động biết nó được gắn vào tên biến nào trong Class mà không cần truyền chuỗi tên lặp lại.',
    backAnswer:
      'Trước Python 3.6, khi viết Descriptor bạn phải truyền tên thuộc tính thủ công kiểu `age = PositiveInt("age")`. Với **`__set_name__(self, owner, name)`**, ngay tại thời điểm Class `owner` được khởi tạo, Python tự động gọi `__set_name__` trên mọi Descriptor nằm trong Class và truyền vào đúng tên biến (`name = "age"`). Nhờ đó bạn chỉ cần viết gọn `age = PositiveInt()`.',
    backAnalogy:
      'Khi lắp ổ cắm thông minh vào tường phòng khách, ổ cắm tự động đọc biển tên phòng (`__set_name__`) để tự đặt tên hiển thị mà không cần bạn gõ tay lại.',
    codeSnippet: `class PositiveNumber:
    def __set_name__(self, owner: type, name: str) -> None:
        self.private_name = f"_{name}"

    def __get__(self, obj, objtype=None):
        return getattr(obj, self.private_name) if obj else self

    def __set__(self, obj, value: float) -> None:
        if value <= 0:
            raise ValueError(f"{self.private_name[1:]} phải > 0")
        setattr(obj, self.private_name, value)`,
    relatedTermIds: ['concept-descriptor'],
  },
  {
    id: 'fc-243',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Metaprogramming (`__init_subclass__`)',
    frontQuestion: 'Tại sao trong 90% trường hợp cần kiểm tra hoặc tự động đăng ký các Class Con (Plugin Registry), ta nên dùng `__init_subclass__` (PEP 487) thay vì viết `Metaclass` phức tạp?',
    frontHint: 'Không gặp xung đột Metaclass (`metaclass conflict`) khi đa kế thừa và code ngắn gọn hơn gấp 5 lần.',
    backAnswer:
      'Viết `class Meta(type):` rất phức tạp và dễ gây lỗi `TypeError: metaclass conflict` khi kết hợp nhiều class có metaclass khác nhau. Phương thức móc **`__init_subclass__(cls, **kwargs)`** đặt trên Class Cha sẽ **tự động được gọi mỗi khi có bất kỳ Class Con nào kế thừa từ nó**, cho phép tự động đăng ký Plugin, kiểm tra quy tắc đặt tên hoặc nhận tham số cấu hình ngay trên dòng khai báo `class StripePlugin(BasePlugin, provider="stripe"):`!',
    backAnalogy:
      'Thay vì phải chế tạo lại cả dây chuyền đúc khuôn (`Metaclass`), bạn chỉ cần gắn một cảm biến tự động ghi danh (`__init_subclass__`) mỗi khi có thành viên mới gia nhập dòng họ.',
    codeSnippet: `class PaymentPlugin:
    registry: dict[str, type["PaymentPlugin"]] = {}

    def __init_subclass__(cls, *, provider: str, **kwargs) -> None:
        super().__init_subclass__(**kwargs)
        PaymentPlugin.registry[provider] = cls

classVNPay(PaymentPlugin, provider="vnpay"):
    pass

print(PaymentPlugin.registry)  # {'vnpay': <class '__main__.classVNPay'>}`,
    relatedTermIds: ['concept-metaclass', 'kw-class'],
  },
  {
    id: 'fc-244',
    stageId: 'stage-4',
    level: 'advanced',
    category: 'Đối tượng Khả gọi (`__call__`)',
    frontQuestion: 'Phương thức dunder `__call__(self, *args, **kwargs)` biến một Object thành cái gì và khi nào nó tốt hơn dùng Closure?',
    frontHint: 'Biến một instance của Class thành một hàm có thể gọi trực tiếp `obj()` nhưng vẫn giữ được trạng thái và các phương thức phụ.',
    backAnswer:
      'Khi một Class định nghĩa **`__call__`**, các instance của nó có thể được gọi trực tiếp có dấu ngoặc tròn ` instance(x, y) ` giống hệt một hàm (`callable(instance) == True`). Nó ưu việt hơn Closure khi bộ hàm cần **lưu trữ trạng thái phức tạp (Stateful callable)**, dễ kiểm tra thuộc tính bên trong khi debug/test (ví dụ: Class-based Decorator, Rate Limiter, hoặc các lớp `nn.Module` trong PyTorch).',
    backAnalogy:
      'Một cỗ máy pha cà phê (`Object`) vừa có các đồng hồ đo áp suất và ngăn chứa hạt (thuộc tính), vừa có một nút bấm chính (`__call__`) để bấm là ra cà phê ngay như một hàm.',
    codeSnippet: `class RateCounter:
    def __init__(self) -> None:
        self.calls = 0

    def __call__(self, x: int) -> int:
        self.calls += 1
        return x * 2

doubler = RateCounter()
print(doubler(5), doubler(10), f"Đã gọi {doubler.calls} lần")  # 10 20 Đã gọi 2 lần`,
    relatedTermIds: ['dunder-call', 'builtin-callable'],
  },
  {
    id: 'fc-245',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Bất biến hóa Dict (`MappingProxyType`)',
    frontQuestion: 'Làm thế nào để tạo một từ điển **Read-only (Chỉ đọc tuyệt đối)** trong Python mà không cần sao chép dữ liệu (`types.MappingProxyType`)?',
    frontHint: 'Chính là kiểu dữ liệu mà Python dùng cho `Class.__dict__` để chặn việc sửa trực tiếp!',
    backAnswer:
      'Python không có kiểu `frozendict` tích hợp, nhưng module chuẩn `types` cung cấp **`MappingProxyType(original_dict)`**. Nó tạo một lớp vỏ bọc chỉ đọc (Read-only dynamic view) quanh từ điển gốc với chi phí bộ nhớ **$O(1)$ (không copy dữ liệu)**. Mọi thao tác đọc `proxy["k"]` hoạt động như `dict`, nhưng nếu ai đó cố gán `proxy["k"] = 1`, Python sẽ ném lỗi `TypeError: "mappingproxy" object does not support item assignment` ngay.',
    backAnalogy:
      'Lồng hộp kính bảo vệ trong suốt lên trên bảng thông báo (`MappingProxyType`): ai đi qua cũng đọc được toàn bộ thông tin bên trong, nhưng không ai thò tay sửa chữ trên bảng được.',
    codeSnippet: `from types import MappingProxyType

_internal_rates = {"USD": 25400, "EUR": 27200}
PUBLIC_RATES = MappingProxyType(_internal_rates)

print(PUBLIC_RATES["USD"])   # 25400
# PUBLIC_RATES["USD"] = 0    # -> TypeError! (Bảo vệ an toàn tuyệt đối)`,
    relatedTermIds: ['type-dict'],
  },
  {
    id: 'fc-246',
    stageId: 'stage-4',
    level: 'master',
    category: 'Buffer Protocol & Zero-Copy (`memoryview`)',
    frontQuestion: 'Đối tượng `memoryview` và **Buffer Protocol** giúp xử lý các khối dữ liệu nhị phân lớn (`bytes`, `bytearray`, NumPy array) mà không tốn RAM sao chép (**Zero-Copy**) như thế nào?',
    frontHint: 'Cắt lát `data[1000:5000000]` trên `bytes` sẽ copy mảng mới, còn cắt lát trên `memoryview(data)` thì sao?',
    backAnswer:
      'Khi bạn cắt lát một đối tượng `bytes` lớn `chunk = raw_bytes[1_000_000:]`, Python phải cấp phát RAM và sao chép hàng triệu byte sang đối tượng `bytes` mới. Ngược lại, **`mv = memoryview(raw_bytes)`** truy cập trực tiếp vào bộ đệm vùng nhớ C bên dưới thông qua **Buffer Protocol**: mọi thao tác cắt lát `mv[1_000_000:]` chỉ tạo một cửa sổ con trỏ nhẹ (**Zero-Copy**, $O(1)$ thời gian và bộ nhớ), cực kỳ quan trọng trong lập trình mạng Socket, giải mã gói tin và xử lý ảnh/video.',
    backAnalogy:
      'Thay vì photo từng chương của cuốn sách dày 10.000 trang ra giấy mới (`bytes` slice), `memoryview` chỉ đặt một khung kính ngắm trượt trực tiếp trên trang sách gốc.',
    codeSnippet: `buf = bytearray(b"HEADER_PAYLOAD_DATA")
mv = memoryview(buf)
payload_view = mv[7:14]       # Zero-copy slice (Không tốn thêm RAM!)
payload_view[:] = b"UPDATED"  # Sửa trực tiếp vùng nhớ gốc của bytearray
print(buf)                    # bytearray(b'HEADER_UPDATED_DATA')`,
    relatedTermIds: ['type-bytes', 'concept-cpython'],
  },
  {
    id: 'fc-247',
    stageId: 'stage-4',
    level: 'advanced',
    category: 'Hệ thống Type Hints Hiện đại (PEP 695)',
    frontQuestion: 'Cú pháp khai báo Generic và `type` alias mới trong **Python 3.12+ (PEP 695)** giúp thay thế `TypeVar("T")` và `Generic[T]` rườm rà trước đây như thế nào?',
    frontHint: '`def first[T](items: list[T]) -> T:` và `type Point[T] = tuple[T, T]`.',
    backAnswer:
      'Trước Python 3.12, để viết hàm hoặc class Generic, bạn phải `from typing import TypeVar, Generic` rồi khai báo `T = TypeVar("T")` ở ngoài. Từ **Python 3.12 (PEP 695)**, cú pháp `[T]` được tích hợp thẳng vào ngôn ngữ (giống hệt `<T>` của TypeScript/Rust):\n- Hàm Generic: **`def first[T](items: Sequence[T]) -> T:`**\n- Class Generic: **`class Box[T]:`**\n- Type Alias: **`type JSONVal = str | int | float | bool | None | list[JSONVal] | dict[str, JSONVal]`** (hỗ trợ đệ quy trực tiếp!).',
    backAnalogy:
      'Giống như chuyển từ việc phải làm giấy đăng ký biến kiểu `TypeVar` ở phường sang việc viết trực tiếp `[T]` ngay tại tên hàm/class như TypeScript.',
    codeSnippet: `# Cú pháp Generic chuẩn Python 3.12+ (PEP 695):
type Pair[T] = tuple[T, T]

def swap[T](pair: Pair[T]) -> Pair[T]:
    a, b = pair
    return (b, a)`,
    relatedTermIds: ['concept-type-hints', 'tool-pyright'],
  },
  {
    id: 'fc-248',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Hệ thống Type Hints (`TypedDict` & `Literal`)',
    frontQuestion: 'Khi nào nên dùng `typing.TypedDict` và `typing.Literal` thay vì viết `dict[str, Any]` hoặc `str` chung chung?',
    frontHint: 'Định kiểu chính xác từng khóa của JSON dict (như `interface` trong TypeScript) và giới hạn tập giá trị cố định.',
    backAnswer:
      '- **`TypedDict`**: Cho phép định nghĩa kiểu dữ liệu chính xác cho từng key của một `dict` thuần (vốn không tốn chi phí khởi tạo object lúc runtime nhưng vẫn được Pyright/VS Code gợi ý từng key và báo lỗi nếu gõ sai tên key, hỗ trợ `NotRequired[...]` cho key tùy chọn).\n- **`Literal["pending", "paid", "failed"]`**: Khóa chặt biến chỉ được nhận một trong các giá trị hằng số cụ thể (giống Union string literals trong TypeScript).',
    backAnalogy:
      '`TypedDict` là bản thiết kế khuôn mẫu cho từ điển JSON, còn `Literal` là công tắc chỉ có đúng 3 nấc cố định.',
    codeSnippet: `from typing import TypedDict, NotRequired, Literal

class OrderPayload(TypedDict):
    order_id: str
    status: Literal["pending", "paid", "cancelled"]
    note: NotRequired[str]  # Key tùy chọn (không bắt buộc có)`,
    relatedTermIds: ['concept-type-hints', 'tool-pyright'],
  },
  {
    id: 'fc-249',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Hệ thống Type Hints (`ParamSpec` & `@overload`)',
    frontQuestion: 'Làm thế nào để giữ nguyên 100% gợi ý kiểu tham số và kiểu trả về của hàm gốc khi viết một **Decorator** bằng `ParamSpec` và `TypeVar`?',
    frontHint: '`P = ParamSpec("P")` bắt toàn bộ `(*args, **kwargs)` và `R = TypeVar("R")` bắt kiểu trả về (hoặc dùng `[**P, R]` trong Python 3.12+).',
    backAnswer:
      'Nếu bạn khai báo decorator trả về `Callable[..., Any]`, VS Code/Pyright sẽ bị "mù" hoàn toàn danh sách tham số của hàm được bọc! Sử dụng **`ParamSpec` (`**P`)** cho phép bắt trọn vẹn cả tham số vị trí (`P.args`) lẫn tham số từ khóa (`P.kwargs`) của hàm gốc, kết hợp với `R` cho kiểu trả về: `Callable[P, R] -> Callable[P, R]`.',
    backAnalogy:
      '`ParamSpec` là tấm khuôn silicon in sao chụp nguyên vẹn từng đường nét chữ ký của hàm gốc xuyên qua lớp vỏ Decorator.',
    codeSnippet: `# Chuẩn Python 3.12+ với cú pháp [**P, R]:
from collections.abc import Callable
from functools import wraps

def log_call[**P, R](func: Callable[P, R]) -> Callable[P, R]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(*args, **kwargs)
    return wrapper`,
    relatedTermIds: ['concept-type-hints', 'tool-pyright'],
  },
  {
    id: 'fc-250',
    stageId: 'stage-4',
    level: 'pro',
    category: 'Hệ thống Type Hints (`Annotated`)',
    frontQuestion: 'Kiểu `typing.Annotated[T, metadata...]` hoạt động như thế nào và tại sao cả **FastAPI** lẫn **Pydantic v2** đều dùng nó làm chuẩn chính thức?',
    frontHint: 'Tách biệt kiểu dữ liệu tĩnh (`int`) cho Type Checker và thông tin kiểm chứng/tiêm phụ thuộc (`Field`, `Depends`) cho Runtime!',
    backAnswer:
      'Trong `Annotated[int, Field(gt=0, le=100)]`, phần tử đầu tiên (`int`) là kiểu dữ liệu dành cho trình kiểm tra kiểu tĩnh (`Pyright`/`Mypy`), còn các phần tử phía sau là **Metadata đính kèm** mà các thư viện như **Pydantic** hay **FastAPI (`Depends`, `Query`, `Path`)** sẽ đọc lúc Runtime thông qua `typing.get_args()`. Nhờ đó bạn có thể tạo các kiểu tái sử dụng cực sạch như `PositiveInt = Annotated[int, Field(gt=0)]` mà không làm hỏng giá trị mặc định của hàm!',
    backAnalogy:
      '`Annotated` là chiếc phong bì tiêu chuẩn (`int`) có dán thêm nhãn hướng dẫn xử lý đặc biệt (`Field(gt=0)`, `Depends(...)`) ở góc ngoài cho hệ thống tự động đọc.',
    codeSnippet: `from typing import Annotated
from pydantic import BaseModel, Field

PositiveAmount = Annotated[int, Field(gt=0, description="Số tiền nguyên dương")]

class Transfer(BaseModel):
    amount: PositiveAmount`,
    relatedTermIds: ['concept-type-hints', 'eco-pydantic', 'eco-fastapi'],
  },
  {
    id: 'fc-251',
    stageId: 'stage-4',
    level: 'master',
    category: 'Hệ thống Type Hints (Variance)',
    frontQuestion: 'Tại sao trong Type Hints cho tham số hàm chỉ đọc dữ liệu, chuẩn chuyên nghiệp khuyên dùng `Sequence[Animal]` hoặc `Mapping[str, Animal]` thay vì `list[Animal]` hay `dict[str, Animal]`?',
    frontHint: '`list` là Invariant (Bất biến kiểu — không nhận `list[Dog]`), còn `Sequence` là Covariant (Đồng biến kiểu — nhận cả `list[Dog]`, `tuple[Dog, ...]`)!',
    backAnswer:
      'Vì `list` cho phép thêm phần tử (`.append()`), nếu hàm nhận `list[Animal]` mà bạn truyền `list[Dog]` vào, bên trong hàm có thể `.append(Cat())` làm hỏng danh sách `Dog` của bạn! Do đó Type Checker quy định `list[T]` là **Invariant** (báo lỗi nếu truyền `list[Dog]` vào nơi cần `list[Animal]`). Ngược lại, **`collections.abc.Sequence[T]`** là giao diện chỉ đọc nên có tính **Covariant**: nó chấp nhận cả `list[Dog]`, `tuple[Cat, ...]` một cách an toàn tuyệt đối!',
    backAnalogy:
      'Nếu bạn cam kết "Chỉ nhìn chứ không bỏ thêm thú lạ vào chuồng" (`Sequence[Animal]`), người ta mới yên tâm giao chuồng Chó (`list[Dog]`) cho bạn xem.',
    codeSnippet: `from collections.abc import Sequence

class Animal: pass
class Dog(Animal): pass

# ✅ Chấp nhận cả list[Dog], tuple[Dog, ...], list[Animal]:
def count_animals(items: Sequence[Animal]) -> int:
    return len(items)`,
    relatedTermIds: ['concept-type-hints', 'tool-pyright'],
  },
  {
    id: 'fc-252',
    stageId: 'stage-4',
    level: 'master',
    category: 'CPython 3.11–3.13+ Internals',
    frontQuestion: 'Cơ chế **Specializing Adaptive Interpreter (PEP 659)** trong Python 3.11+ và **Copy-and-Patch JIT (PEP 744)** trong Python 3.13+ giúp tăng tốc Python như thế nào?',
    frontHint: 'Tự động thay thế lệnh Bytecode tổng quát `BINARY_OP` bằng lệnh chuyên biệt `BINARY_OP_ADD_INT` ngay lúc đang chạy!',
    backAnswer:
      '1. **Specializing Adaptive Interpreter (Python 3.11+)**: Khi một dòng code được chạy lặp lại vài lần với cùng kiểu dữ liệu (ví dụ cộng 2 số `int`), CPython tự động **viết lại chỉ thị Bytecode ngay trên RAM** từ `BINARY_OP` tổng quát sang `BINARY_OP_ADD_INT` chuyên biệt (bỏ qua bước tra cứu kiểu động, giúp Python 3.11+ nhanh hơn 25–60%).\n2. **Copy-and-Patch JIT (Python 3.13+)**: Tiếp tục dịch các chuỗi Bytecode chuyên biệt nóng (hot traces) thành **mã máy (Machine Code)** thực thụ ngay lúc runtime.',
    backAnalogy:
      'Lần đầu khách đến quầy phải kiểm tra đủ giấy tờ (`BINARY_OP`), nhưng khi thấy khách quen ngày nào cũng đi đúng tuyến đó, trạm gác mở luôn làn thu phí tự động không dừng (`BINARY_OP_ADD_INT` + JIT).',
    codeSnippet: `import dis

def compute(x: int, y: int) -> int:
    return x + y

for _ in range(100):
    compute(10, 20)

# Quan sát chỉ thị Bytecode đã được chuyên biệt hóa (adaptive):
dis.dis(compute, adaptive=True)`,
    relatedTermIds: ['concept-cpython', 'concept-bytecode'],
  },

  // ============================================================================
  // STAGE 5: CONCURRENCY, PARALLELISM, GIL & ASYNCIO DEEP DIVE (fc-253 -> fc-270)
  // ============================================================================
  {
    id: 'fc-253',
    stageId: 'stage-5',
    level: 'pro',
    category: 'Đa luồng (Threading) & GIL',
    frontQuestion: 'Câu hỏi phỏng vấn kinh điển: "Vì CPython đã có **GIL (Global Interpreter Lock)** chỉ cho 1 Thread chạy Bytecode tại 1 thời điểm, vậy tại sao phép cộng `counter += 1` giữa nhiều Thread vẫn bị sai số (Race Condition) và bắt buộc phải dùng `threading.Lock`?"',
    frontHint: 'Một dòng code Python `counter += 1` thực chất gồm 4 chỉ thị Bytecode riêng biệt (`LOAD`, `ADD`, `STORE`), và GIL có thể nhả/chuyển luồng ngay giữa chừng!',
    backAnswer:
      'GIL chỉ đảm bảo **từng chỉ thị Bytecode đơn lẻ** không bị xé nhỏ, chứ **không khóa nguyên một dòng code Python**! Phép tính `counter += 1` được dịch ra nhiều bước Bytecode: (1) Đọc `counter` lên Stack $\\rightarrow$ (2) Cộng 1 $\\rightarrow$ (3) Ghi lại vào `counter`. Nếu Thread A vừa đọc `counter = 10` (bước 1) thì hết 5ms (`sys.getswitchinterval()`), GIL chuyển sang Thread B tăng lên `11`, rồi Thread A tỉnh dậy ghi đè số `11` của nó xuống — làm mất 1 lần cộng! Do đó mọi thao tác Đọc-Sửa-Ghi chia sẻ giữa các Thread vẫn **bắt buộc phải bọc trong `with threading.Lock():`**.',
    backAnalogy:
      'GIL chỉ đảm bảo mỗi lần chỉ 1 người được cầm bút viết, nhưng nếu người A đọc số dư trên bảng rồi đi lấy phấn, người B vào viết số mới, lúc người A quay lại xóa bảng viết số của mình lên thì vẫn sai sổ sách như thường!',
    codeSnippet: `import threading

lock = threading.Lock()
counter = 0

def safe_increment() -> None:
    global counter
    with lock:          # Đảm bảo toàn bộ cụm Đọc-Cộng-Ghi là nguyên tử (Atomic)
        counter += 1`,
    relatedTermIds: ['concept-gil', 'stdlib-threading'],
  },
  {
    id: 'fc-254',
    stageId: 'stage-5',
    level: 'master',
    category: 'Free-Threaded Python (PEP 703)',
    frontQuestion: 'Bản **Free-Threaded Python (`python3.13t` / `--disable-gil` theo PEP 703)** đã thay đổi kiến trúc CPython như thế nào để loại bỏ GIL?',
    frontHint: 'Biased Reference Counting + Immortal Objects + Per-object Locks + Bộ cấp phát bộ nhớ `mimalloc`.',
    backAnswer:
      'Để gỡ bỏ GIL mà không làm chậm code đơn luồng, **PEP 703** (Python 3.13t/3.14t) đã đại tu lõi CPython:\n1. **Biased Reference Counting**: Tách bộ đếm tham chiếu thành nhánh nhanh cho luồng sở hữu đối tượng (không cần khóa atomic đắt đỏ) và nhánh atomic cho các luồng khác.\n2. **Immortal Objects (PEP 683)**: Các hằng số như `None`, `True`, `False`, số nguyên nhỏ không bao giờ thay đổi `ob_refcnt`.\n3. **Per-object Fine-grained Locks**: Khóa mịn trên từng `dict`/`list` thay vì khóa toàn bộ trình thông dịch.\n4. Thay bộ cấp phát bộ nhớ sang **`mimalloc`** an toàn đa luồng.',
    backAnalogy:
      'Thay vì khóa cổng toàn bộ khu công nghiệp chỉ cho 1 xe chạy vào (GIL), người ta lắp đèn tín hiệu thông minh tại từng ngã tư nhỏ (Fine-grained locks) để hàng chục xe chạy song song trên mọi làn đường CPU.',
    codeSnippet: `import sys

# Kiểm tra xem trình thông dịch hiện tại có đang bật GIL hay chạy chế độ Free-Threaded:
is_gil_enabled = getattr(sys, "_is_gil_enabled", lambda: True)()
print(f"GIL đang bật: {is_gil_enabled}")`,
    relatedTermIds: ['concept-gil', 'concept-cpython'],
  },
  {
    id: 'fc-255',
    stageId: 'stage-5',
    level: 'pro',
    category: 'Đa tiến trình (`multiprocessing`)',
    frontQuestion: 'Sự khác biệt giữa 3 chế độ khởi tạo tiến trình con trong `multiprocessing`: **`fork`**, **`spawn`** và **`forkserver`** là gì? Tại sao macOS và Linux hiện đại (Python 3.14+) tránh dùng `fork` mặc định?',
    frontHint: 'Chuyện gì xảy ra khi `fork()` một tiến trình đang có các luồng ngầm (như gRPC, OpenMP, PyTorch, Database Pool) đang giữ Lock?',
    backAnswer:
      '- **`fork`**: Nhân bản toàn bộ bộ nhớ tiến trình cha ngay lập tức nhưng **chỉ sao chép duy nhất luồng gọi `fork`**. Nếu một luồng ngầm khác trong cha đang giữ một Mutex Lock đúng lúc `fork`, tiến trình con sinh ra sẽ thấy Lock đó bị khóa vĩnh viễn (vì luồng giữ Lock không tồn tại ở con) gây **Deadlock treo cứng**!\n- **`spawn`** (mặc định trên macOS, Windows, và Linux từ Python 3.14): Khởi động một trình thông dịch Python mới tinh, sạch sẽ và an toàn tuyệt đối.\n- **`forkserver`**: Tạo sẵn một tiến trình server đơn luồng sạch từ đầu để `fork` nhanh mà không sợ dính luồng bẩn.',
    backAnalogy:
      '`fork` là chụp cắt lớp nhà máy đang chạy (dễ kẹt máy nếu đang dở nhịp); `spawn` là mở một phân xưởng mới tinh sạch sẽ từ đầu.',
    codeSnippet: `import multiprocessing as mp

if __name__ == "__main__":
    # Luôn đặt trong if __name__ == "__main__": khi dùng 'spawn' hoặc 'forkserver'
    ctx = mp.get_context("spawn")
    with ctx.Pool(processes=4) as pool:
        results = pool.map(pow, [2, 3, 4], [10, 10, 10])`,
    relatedTermIds: ['stdlib-multiprocessing', 'dunder-name'],
  },
  {
    id: 'fc-256',
    stageId: 'stage-5',
    level: 'master',
    category: 'Đa tiến trình & Bộ nhớ Chia sẻ (`shared_memory`)',
    frontQuestion: 'Tại sao truyền một DataFrame hoặc mảng NumPy 500MB qua `ProcessPoolExecutor` lại rất chậm, và `multiprocessing.shared_memory.SharedMemory` giải quyết triệt để vấn đề này như thế nào?',
    frontHint: 'Chi phí tuần tự hóa `pickle.dumps()` + truyền qua ống IPC Pipe + giải nén `pickle.loads()` ở từng tiến trình con.',
    backAnswer:
      'Mỗi tiến trình có không gian RAM độc lập. Khi truyền tham số vào `ProcessPoolExecutor`, Python phải **tuần tự hóa (Pickle)** toàn bộ mảng 500MB thành chuỗi byte, bơm qua ống dẫn IPC sang từng Worker rồi giải nén lại — vừa chậm vừa làm nổ RAM gấp $N$ lần! Với **`multiprocessing.shared_memory`**, bạn cấp phát một khối RAM chung của hệ điều hành và chỉ truyền **tên khối nhớ (`shm.name`, vài chục byte)** sang các Worker để tất cả cùng gắn mảng NumPy (`np.ndarray(..., buffer=shm.buf)`) đọc/ghi **Zero-Copy**!',
    backAnalogy:
      'Thay vì in sao 10 thùng tài liệu 500MB gửi bưu điện cho 10 chi nhánh (`pickle`), bạn đặt tài liệu vào Phòng đọc chung (`SharedMemory`) và chỉ nhắn mã số phòng cho 10 chi nhánh vào đọc trực tiếp.',
    codeSnippet: `from multiprocessing import shared_memory

# Tạo vùng nhớ chia sẻ 1024 bytes trực tiếp trên RAM hệ điều hành:
shm = shared_memory.SharedMemory(create=True, size=1024)
try:
    shm.buf[:5] = b"HELLO"
    # Tiến trình khác chỉ cần gắn vào qua tên shm.name mà không cần copy dữ liệu!
    existing = shared_memory.SharedMemory(name=shm.name)
    print(bytes(existing.buf[:5]))  # b'HELLO'
    existing.close()
finally:
    shm.close()
    shm.unlink()  # Giải phóng vùng nhớ OS`,
    relatedTermIds: ['stdlib-multiprocessing'],
  },
  {
    id: 'fc-257',
    stageId: 'stage-5',
    level: 'advanced',
    category: 'AsyncIO & Event Loop',
    frontQuestion: 'Điều gì thực sự xảy ra khi bạn gọi một hàm bất đồng bộ `coro = fetch_data()` mà **quên từ khóa `await`** (hoặc quên `asyncio.create_task`)?',
    frontHint: 'Hàm `async def` chưa hề chạy một dòng code nào bên trong cả — nó chỉ trả về một đối tượng Coroutine rồi mengeluarkan cảnh báo `RuntimeWarning: coroutine was never awaited`!',
    backAnswer:
      'Khác hoàn toàn với `async function` trong JavaScript (vốn bắt đầu chạy ngay lập tức khi được gọi và trả về một `Promise` đang chạy!), trong Python việc gọi `fetch_data()` **không thực thi bất kỳ dòng code nào bên trong hàm** mà chỉ tạo ra một **đối tượng Coroutine thụ động** (giống như Generator). Coroutine chỉ thực sự chạy khi bạn **`await fetch_data()`** hoặc lên lịch vào Event Loop bằng **`asyncio.create_task(fetch_data())`**.',
    backAnalogy:
      'Trong JS, gọi hàm `async` là "Châm ngòi pháo chạy luôn"; trong Python, gọi hàm `async` chỉ là "Viết phiếu yêu cầu công việc", phải đưa phiếu đó cho Event Loop (`await` / `create_task`) thì việc mới bắt đầu chạy!',
    codeSnippet: `import asyncio

async def fetch_user(uid: int) -> dict:
    await asyncio.sleep(0.01)
    return {"id": uid}

async def main() -> None:
    # ❌ fetch_user(1)         -> Không chạy! Cảnh báo RuntimeWarning
    # ✅ Lên lịch chạy ngay trên Event Loop:
    task = asyncio.create_task(fetch_user(1))
    user = await task`,
    relatedTermIds: ['stdlib-asyncio', 'kw-async', 'kw-await'],
  },
  {
    id: 'fc-258',
    stageId: 'stage-5',
    level: 'pro',
    category: 'AsyncIO & Structured Concurrency',
    frontQuestion: 'Tại sao trong Python 3.11+, **`asyncio.TaskGroup()`** được khuyên dùng thay thế cho `asyncio.gather()` truyền thống?',
    frontHint: 'Chuyện gì xảy ra với các Task còn lại trong `asyncio.gather()` khi 1 Task bị lỗi? (Orphaned / Zombie Tasks!).',
    backAnswer:
      'Với `asyncio.gather(t1, t2, t3)`, nếu `t1` ném lỗi ngay ở giây thứ 1, `gather()` ném ngoại lệ ra ngoài nhưng **`t2` và `t3` vẫn tiếp tục chạy ngầm không ai kiểm soát (Orphaned Tasks)** gây rò rỉ kết nối hoặc ghi dữ liệu rác! Ngược lại, **`async with asyncio.TaskGroup() as tg:`** áp dụng mô hình **Structured Concurrency**: nếu bất kỳ task con nào lỗi, `TaskGroup` lập tức **gửi tín hiệu hủy (`cancel()`) tới tất cả các task anh em còn lại** và chờ chúng dọn dẹp xong xuôi trước khi thoát khỏi khối `async with`.',
    backAnalogy:
      '`gather()` là cử 3 người đi làm nhiệm vụ, 1 người gặp nạn thì đội trưởng bỏ về luôn mặc kệ 2 người kia lạc trong rừng; `TaskGroup` là cam kết cả đội cùng vào cùng ra, có sự cố là gọi rút quân toàn đội an toàn.',
    codeSnippet: `import asyncio

async def fetch_item(x: int) -> int:
    await asyncio.sleep(0.01)
    return x * 10

async def main() -> list[int]:
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch_item(1))
        t2 = tg.create_task(fetch_item(2))
    # Khi thoát khỏi khối 'async with', cả t1 và t2 chắc chắn đã hoàn tất 100%!
    return [t1.result(), t2.result()]`,
    relatedTermIds: ['stdlib-asyncio', 'kw-async', 'kw-with'],
  },
  {
    id: 'fc-259',
    stageId: 'stage-5',
    level: 'pro',
    category: 'AsyncIO & Cạm bẫy Hủy Task (`CancelledError`)',
    frontQuestion: 'Tại sao kể từ Python 3.8+, `asyncio.CancelledError` kế thừa từ `BaseException` (chứ không phải `Exception`), và tại sao trong khối `except asyncio.CancelledError:` bạn bắt buộc phải `raise` lại nó?',
    frontHint: 'Nếu một Coroutine nuốt mất `CancelledError` mà không `raise` lại, `asyncio.timeout()` và `TaskGroup` sẽ bị treo cứng!',
    backAnswer:
      '1. `CancelledError` được chuyển sang kế thừa từ `BaseException` để các khối `except Exception:` thông thường không vô tình nuốt mất tín hiệu hủy Task.\n2. Nếu bạn chủ động viết `except asyncio.CancelledError:` để đóng tài nguyên lúc Task bị hủy, sau khi dọn dẹp xong bạn **bắt buộc phải gõ `raise` ở dòng cuối** để thông báo cho Event Loop / `TaskGroup` / `asyncio.timeout()` biết rằng Task đã thực sự hủy thành công.',
    backAnalogy:
      'Khi nhận lệnh rút lui (`CancelledError`), bạn được phép thu dọn đồ đạc trong 3 giây rồi phải bấm nút xác nhận đã rút lui (`raise`), không được tắt bộ đàm ngồi lì trong phòng.',
    codeSnippet: `import asyncio

async def worker() -> None:
    try:
        await asyncio.sleep(3600)
    except asyncio.CancelledError:
        print("Đang dọn dẹp kết nối trước khi dừng...")
        raise  # BẮT BUỘC phải raise lại CancelledError!`,
    relatedTermIds: ['stdlib-asyncio', 'kw-try', 'kw-raise'],
  },
  {
    id: 'fc-260',
    stageId: 'stage-5',
    level: 'advanced',
    category: 'AsyncIO & Quản lý Thời gian chờ (`asyncio.timeout`)',
    frontQuestion: 'Cú pháp `async with asyncio.timeout(5.0):` (Python 3.11+) ưu việt hơn hàm `await asyncio.wait_for(coro, timeout=5.0)` cũ ở điểm nào?',
    frontHint: 'Cho phép giới hạn tổng thời gian của CẢ MỘT KHỐI nhiều câu lệnh `await` liên tiếp thay vì chỉ 1 coroutine đơn lẻ!',
    backAnswer:
      '`asyncio.wait_for()` chỉ bọc được 1 coroutine duy nhất và phải tạo thêm một Task phụ. Trong khi đó, Context Manager **`async with asyncio.timeout(5.0):`** cho phép bạn đặt **ngân sách thời gian chung cho cả một chuỗi nhiều bước `await`** (ví dụ: kết nối DB + truy vấn + gọi Redis tổng cộng không quá 5 giây), đồng thời hỗ trợ gia hạn thời gian động bằng `cm.reschedule()`. Khi quá hạn, nó ném ra `TimeoutError` chuẩn.',
    backAnalogy:
      '`wait_for` là bấm giờ cho từng trạm riêng lẻ; còn `asyncio.timeout(5.0)` là bấm đồng hồ đếm ngược chung cho toàn bộ chặng đua 3 trạm liên tiếp.',
    codeSnippet: `import asyncio

async def process_checkout() -> None:
    try:
        async with asyncio.timeout(3.0):  # Tổng thời gian cả 2 bước tối đa 3 giây
            await asyncio.sleep(0.1)      # Bước 1: Kiểm tra tồn kho
            await asyncio.sleep(0.2)      # Bước 2: Trừ tiền ví
    except TimeoutError:
        print("Giao dịch quá thời gian quy định!")`,
    relatedTermIds: ['stdlib-asyncio', 'kw-async', 'kw-with'],
  },
  {
    id: 'fc-261',
    stageId: 'stage-5',
    level: 'pro',
    category: 'AsyncIO & Kiểm soát Tải (`Semaphore` & `Queue`)',
    frontQuestion: 'Nếu bạn dùng `TaskGroup` hoặc `gather` bắn đồng thời **10.000 HTTP requests** cùng lúc mà không giới hạn, chuyện gì sẽ xảy ra và cách dùng `asyncio.Semaphore(50)` để kiểm soát luồng (Backpressure) là gì?',
    frontHint: 'Tràn cạn kiệt File Descriptors của OS (`Too many open files`) hoặc bị server đối tác khóa IP (`429 Too Many Requests`).',
    backAnswer:
      'Khởi tạo 10.000 kết nối mạng cùng lúc sẽ làm sập cả client (hết cổng socket) lẫn server đích. Bằng cách khởi tạo **`sem = asyncio.Semaphore(50)`** và bọc lệnh gọi mạng trong **`async with sem:`**, tại bất kỳ thời điểm nào chỉ có **tối đa 50 request được phép chạy thực sự**, 9.950 coroutine còn lại sẽ xếp hàng chờ nhẹ nhàng; cứ 1 request xong là 1 request tiếp theo được vào ngay.',
    backAnalogy:
      'Trạm thu phí có 50 làn xe (`Semaphore(50)`): dù có 10.000 xe kéo đến cùng lúc thì qua trạm luôn duy trì đúng 50 xe chạy êm ái, không gây vỡ đường cao tốc.',
    codeSnippet: `import asyncio

sem = asyncio.Semaphore(20)  # Giới hạn tối đa 20 request chạy song song

async def safe_fetch(url: str) -> str:
    async with sem:
        await asyncio.sleep(0.05)  # Chỉ tối đa 20 coroutine ở trong khối này cùng lúc
        return f"Done: {url}"`,
    relatedTermIds: ['stdlib-asyncio', 'kw-async'],
  },
  {
    id: 'fc-262',
    stageId: 'stage-5',
    level: 'pro',
    category: 'AsyncIO & Tác vụ Chặn Event Loop',
    frontQuestion: 'Làm thế nào để chạy một hàm **Đồng bộ (Sync I/O)** cũ (như `boto3`, `requests`, đọc file lớn) hoặc hàm tính toán nặng bên trong một hàm `async def` mà không làm đơ toàn bộ Event Loop?',
    frontHint: '`await asyncio.to_thread(sync_func, *args)` hoặc `loop.run_in_executor(process_pool, cpu_func)`.',
    backAnswer:
      '- **Nếu là hàm Sync I/O (như `requests.get`, `boto3`, `time.sleep`, `bcrypt.hashpw`)**: Dùng **`await asyncio.to_thread(sync_func, arg1, arg2)`** (Python 3.9+). Nó tự động đẩy hàm đồng bộ đó sang chạy trên một luồng của `ThreadPoolExecutor` ngầm và trả kết quả về Event Loop khi xong.\n- **Nếu là hàm thuần CPU nặng (vướng GIL)**: Dùng **`await loop.run_in_executor(process_pool, cpu_func, data)`** để đẩy sang tiến trình riêng.',
    backAnalogy:
      'Bếp trưởng Event Loop đang điều phối 100 bàn ăn: gặp món hầm tốn 30 phút canh lửa (`sync_func`), bếp trưởng giao ngay cho bếp phụ ở phòng bên (`asyncio.to_thread`) làm rồi báo lại khi chín, không đứng nhìn nồi hầm làm ngưng trệ cả nhà hàng.',
    codeSnippet: `import asyncio
import time

def legacy_blocking_io(seconds: float) -> str:
    time.sleep(seconds)  # Hàm blocking truyền thống
    return "Hoàn tất I/O"

async def main() -> None:
    # Chạy hàm blocking trên ThreadPool mà KHÔNG làm đơ Event Loop:
    result = await asyncio.to_thread(legacy_blocking_io, 0.1)`,
    relatedTermIds: ['stdlib-asyncio', 'stdlib-threading'],
  },
  {
    id: 'fc-263',
    stageId: 'stage-5',
    level: 'pro',
    category: 'AsyncIO & Bảo vệ Tác vụ (`asyncio.shield`)',
    frontQuestion: 'Hàm `await asyncio.shield(critical_task)` dùng để làm gì khi xử lý các giao dịch quan trọng (như ghi nhận thanh toán vào DB) mà client bên ngoài đột ngột ngắt kết nối?',
    frontHint: 'Chặn tín hiệu `cancel()` từ bên ngoài truyền vào `critical_task` để tác vụ bên trong vẫn chạy nốt tới cùng!',
    backAnswer:
      'Khi người dùng đóng trình duyệt hoặc hết thời gian chờ ở tầng ngoài, coroutine xử lý request sẽ bị hủy (`CancelledError`). Nếu đúng lúc đó bạn đang `await save_payment_record()`, việc hủy ngang xương sẽ khiến tiền đã trừ ở cổng thanh toán nhưng chưa kịp lưu vào DB! Bọc **`await asyncio.shield(save_payment_record())`** sẽ tạo một tấm khiên hấp thụ lệnh hủy từ bên ngoài: coroutine ngoài nhận `CancelledError` nhưng tác vụ `save_payment_record()` bên trong **vẫn tiếp tục chạy ngầm trên Event Loop cho đến khi hoàn tất**.',
    backAnalogy:
      'Tấm khiên chống ngắt điện UPS: dù cầu dao tổng bên ngoài bị ngắt, máy in hóa đơn bên trong tấm khiên vẫn dùng nguồn dự phòng để in xong tờ biên lai đang dở.',
    codeSnippet: `import asyncio

async def commit_payment_to_db(tx_id: str) -> None:
    await asyncio.sleep(0.1)

async def handle_webhook(tx_id: str) -> None:
    # Bảo vệ việc ghi DB không bị hủy giữa chừng nếu client ngắt kết nối:
    await asyncio.shield(commit_payment_to_db(tx_id))`,
    relatedTermIds: ['stdlib-asyncio'],
  },
  {
    id: 'fc-264',
    stageId: 'stage-5',
    level: 'advanced',
    category: 'AsyncIO (`asyncio.Queue` Worker Pool)',
    frontQuestion: 'Mô hình **Producer - Consumer** sử dụng `asyncio.Queue(maxsize=N)` kết hợp `queue.task_done()` và `await queue.join()` hoạt động như thế nào?',
    frontHint: 'Điều tiết tốc độ sinh việc (Backpressure khi hàng đợi đầy) và chờ toàn bộ công việc được xử lý sạch.',
    backAnswer:
      '1. Khởi tạo `q = asyncio.Queue(maxsize=100)`: nếu hàng đợi đã đầy 100 việc, lệnh **`await q.put(item)`** của Producer sẽ tự động tạm dừng chờ đến khi Consumer lấy bớt việc ra (**Backpressure tự nhiên**, không bao giờ tràn RAM).\n2. Một nhóm $K$ Workers chạy vòng lặp `item = await q.get()`, xử lý xong thì gọi **`q.task_done()`** trong khối `finally`.\n3. Luồng chính gọi **`await q.join()`** để chờ đến khi mọi item từng đưa vào hàng đợi đều đã được gọi `task_done()`.',
    backAnalogy:
      'Băng chuyền nhà hàng chỉ có đúng 100 khay (`maxsize=100`): đầu bếp (`put`) làm nhanh quá hết khay sẽ tự dừng tay chờ phục vụ (`get`) bưng đi và bấm nút hoàn tất (`task_done`).',
    codeSnippet: `import asyncio

async def worker(q: asyncio.Queue[int]) -> None:
    while True:
        item = await q.get()
        try:
            await asyncio.sleep(0.01)
        finally:
            q.task_done()  # Báo hiệu đã xử lý xong 1 mục`,
    relatedTermIds: ['stdlib-asyncio'],
  },
  {
    id: 'fc-265',
    stageId: 'stage-5',
    level: 'pro',
    category: 'AsyncIO & Async Generators (`async for`)',
    frontQuestion: 'Sự khác nhau giữa một Generator thông thường (`def` + `yield`) và một **Async Generator** (`async def` + `yield`, duyệt bằng `async for`) là gì?',
    frontHint: 'Bên trong Async Generator bạn có thể `await` gọi mạng/DB ở mỗi bước trước khi `yield` phần tử tiếp theo!',
    backAnswer:
      'Một hàm **`async def`** có chứa từ khóa **`yield`** sẽ trở thành một **Async Generator (`AsyncIterator`)**. Nó cho phép bạn vừa thực hiện các thao tác I/O bất đồng bộ (`await client.get(...)` để lấy từng trang dữ liệu phân trang hoặc đọc luồng SSE/WebSocket), vừa `yield` từng phần tử ra ngoài ngay khi có để nơi gọi xử lý bằng vòng lặp **`async for item in stream:`** với bộ nhớ $O(1)$.',
    backAnalogy:
      'Vừa câu cá (`await` chờ cá cắn câu) vừa thả ngay từng con cá câu được vào thùng cho đầu bếp chế biến (`yield` -> `async for`), không cần câu hết cả hồ mới mang về.',
    codeSnippet: `import asyncio
from collections.abc import AsyncIterator

async def stream_pages(total_pages: int) -> AsyncIterator[dict]:
    for page in range(1, total_pages + 1):
        await asyncio.sleep(0.01)  # Giả lập gọi API lấy từng trang
        yield {"page": page, "items": [page * 10]}

async def consume() -> None:
    async for page_data in stream_pages(3):
        print(page_data["page"])`,
    relatedTermIds: ['stdlib-asyncio', 'kw-async', 'kw-yield'],
  },
  {
    id: 'fc-266',
    stageId: 'stage-5',
    level: 'pro',
    category: 'AsyncIO & Hiệu năng Event Loop (`uvloop`)',
    frontQuestion: 'Thư viện `uvloop` là gì và tại sao `Uvicorn` / `FastAPI` trên Linux & macOS lại dùng `uvloop` thay cho Event Loop mặc định của `asyncio`?',
    frontHint: 'Bản cài đặt Event Loop viết bằng Cython bọc trực tiếp trên thư viện C `libuv` (cùng lõi với Node.js).',
    backAnswer:
      'Event Loop mặc định của module `asyncio` được viết phần lớn bằng Python thuần nên có chi phí điều phối nhất định. **`uvloop`** là bản thay thế trực tiếp (drop-in replacement) viết bằng **Cython trên nền thư viện C `libuv`** (chính là bộ máy Event Loop của Node.js). Khi bật `uvloop` (mặc định khi cài `uvicorn[standard]`), tốc độ xử lý Socket/HTTP của `asyncio` tăng gấp **2–4 lần**, tiệm cận hiệu năng của Go và Node.js.',
    backAnalogy:
      'Giữ nguyên vô-lăng và bàn đạp chuẩn `asyncio`, nhưng thay động cơ bên dưới nắp capo bằng khối động cơ phản lực C `libuv`.',
    codeSnippet: `# Khi cài uvicorn[standard], uvloop được tự động kích hoạt:
# $ uv add "uvicorn[standard]"
# Hoặc bật thủ công cho ứng dụng asyncio thuần:
# import uvloop
# uvloop.run(main())`,
    relatedTermIds: ['stdlib-asyncio', 'eco-fastapi'],
  },
  {
    id: 'fc-267',
    stageId: 'stage-5',
    level: 'advanced',
    category: 'Đồng bộ hóa Luồng (`RLock` vs `Lock`)',
    frontQuestion: 'Sự khác biệt giữa `threading.Lock()` và `threading.RLock()` (Reentrant Lock) là gì? Khi nào dùng `Lock()` thông thường sẽ tự gây **Deadlock** chính mình?',
    frontHint: 'Chuyện gì xảy ra khi hàm `A()` đang giữ `lock` lại gọi hàm `B()` (hoặc đệ quy) mà hàm `B()` cũng yêu cầu `with lock:`?',
    backAnswer:
      '- **`threading.Lock()`**: Khóa đơn giản — nếu **cùng một Thread** đang giữ `lock` mà lại gọi `with lock:` lần thứ 2 (ví dụ hàm đệ quy hoặc phương thức `transfer()` gọi `withdraw()` cùng dùng chung 1 `lock`), Thread đó sẽ **tự đứng chờ chính mình mãi mãi (Self-Deadlock)**!\n- **`threading.RLock()` (Reentrant Lock)**: Cho phép **cùng một Thread sở hữu** có thể đi vào khóa nhiều lần lồng nhau (tăng bộ đếm đệ quy), miễn là số lần nhả khóa khớp với số lần lấy khóa.',
    backAnalogy:
      '`Lock` là ổ khóa tự sập không phân biệt chủ nhà hay khách (chủ nhà đang ở trong phòng mà bấm khóa thêm lần nữa là kẹt luôn); `RLock` nhận diện đúng chủ nhà đang ở bên trong nên cho phép mở/đóng các ngăn tủ con thoải mái.',
    codeSnippet: `import threading

class BankAccount:
    def __init__(self) -> None:
        self._lock = threading.RLock()  # Dùng RLock vì transfer() gọi deposit()
        self.balance = 1000

    def deposit(self, amount: int) -> None:
        with self._lock:
            self.balance += amount

    def add_bonus_and_deposit(self, amount: int) -> None:
        with self._lock:
            self.deposit(amount + 10)   # Cùng 1 thread vào _lock lần 2 an toàn!`,
    relatedTermIds: ['stdlib-threading'],
  },
  {
    id: 'fc-268',
    stageId: 'stage-5',
    level: 'pro',
    category: 'Quản lý Luồng & Tiến trình (`concurrent.futures`)',
    frontQuestion: 'Trong `concurrent.futures`, sự khác nhau giữa `executor.map(fn, items)` và `executor.submit(fn, item)` kết hợp `as_completed(futures)` là gì?',
    frontHint: 'Trả kết quả theo đúng thứ tự đầu vào vs Xử lý ngay lập tức tác vụ nào xong trước!',
    backAnswer:
      '- **`executor.map(fn, items)`**: Trả về kết quả **theo đúng thứ tự của `items` ban đầu**. Nếu tác vụ số 1 mất 10 giây còn tác vụ số 2–100 chỉ mất 0.1 giây, vòng lặp kết quả vẫn phải đứng chờ tác vụ số 1 xong mới đọc được các tác vụ sau!\n- **`futures = [executor.submit(fn, x) for x in items]` + `for fut in as_completed(futures):`**: Trả về **`Future` nào hoàn thành xong trước ngay lập tức**, giúp xử lý kết quả theo thời gian thực và bắt ngoại lệ riêng cho từng tác vụ.',
    backAnalogy:
      '`executor.map` là xếp hàng lấy đồ ăn theo đúng số thứ tự mua vé (số 1 chưa xong thì số 2 phải đợi); `as_completed` là món nào nấu xong trước thì bưng ra phục vụ ngay!',
    codeSnippet: `from concurrent.futures import ThreadPoolExecutor, as_completed

def check_host(host: str) -> str:
    return f"{host}: OK"

with ThreadPoolExecutor(max_workers=4) as pool:
    futures = {pool.submit(check_host, h): h for h in ["a.vn", "b.vn"]}
    for fut in as_completed(futures):
        print(fut.result())  # Xong trước in trước!`,
    relatedTermIds: ['stdlib-threading'],
  },
  {
    id: 'fc-269',
    stageId: 'stage-5',
    level: 'pro',
    category: 'Đa tiến trình & Subinterpreters (PEP 734)',
    frontQuestion: 'Tính năng **Multiple Interpreters / Subinterpreters với Per-Interpreter GIL (PEP 684 / PEP 734)** trong Python 3.12–3.13+ mang lại mô hình song song mới nào nằm giữa `threading` và `multiprocessing`?',
    frontHint: 'Mỗi Subinterpreter có GIL riêng nhưng nằm chung trong CÙNG MỘT tiến trình OS (không tốn RAM khởi tạo tiến trình nặng như `multiprocessing`).',
    backAnswer:
      'Trước đây bạn phải chọn: hoặc `threading` (nhẹ RAM nhưng bị chung 1 GIL), hoặc `multiprocessing` (tận dụng đa nhân CPU nhưng tốn hàng trăm MB RAM nhân bản tiến trình và chậm do Pickle IPC). **PEP 684 / PEP 734** cho phép tạo nhiều **Subinterpreters cô lập nằm ngay trong cùng 1 OS Process**, trong đó **mỗi Subinterpreter có một GIL riêng biệt** để chạy song song 100% trên đa nhân CPU với chi phí khởi tạo cực nhẹ!',
    backAnalogy:
      'Thay vì phải thuê hẳn 8 tòa nhà riêng biệt (`multiprocessing`), nay bạn mở 8 phòng làm việc cách âm có bộ điều khiển riêng (`Subinterpreters`) ngay trong cùng 1 tòa nhà.',
    codeSnippet: `# Mô hình song song trong Python hiện đại:
# 1. I/O-bound (nghìn kết nối):     asyncio (1 Thread, Event Loop)
# 2. I/O-bound thư viện cũ (Sync):  ThreadPoolExecutor
# 3. CPU-bound nặng:                ProcessPoolExecutor / Free-Threaded 3.13t / Subinterpreters`,
    relatedTermIds: ['concept-gil', 'stdlib-multiprocessing'],
  },
  {
    id: 'fc-270',
    stageId: 'stage-5',
    level: 'pro',
    category: 'Mạng & HTTP Client (`httpx.AsyncClient`)',
    frontQuestion: 'Tại sao trong ứng dụng Web bất đồng bộ, việc khởi tạo `async with httpx.AsyncClient() as client:` mới ở **bên trong mỗi hàm xử lý request** lại là một Anti-Pattern nghiêm trọng?',
    frontHint: 'Mất hoàn toàn tác dụng tái sử dụng kết nối TCP/TLS (Connection Pooling) và dễ gây cạn kiệt cổng mạng (Port Exhaustion)!',
    backAnswer:
      '`httpx.AsyncClient` quản lý một **Connection Pool** giữ các kết nối TCP + TLS Keep-Alive mở sẵn tới server đích. Nếu mỗi khi có 1 request đến bạn lại tạo mới một `AsyncClient()` rồi đóng ngay, server sẽ phải thực hiện bắt tay TCP 3 bước + TLS handshake lại từ đầu cho từng request và để lại hàng nghìn socket ở trạng thái `TIME_WAIT`. Chuẩn Production là khởi tạo **1 `AsyncClient` dùng chung (Singleton trong `lifespan` của FastAPI)** cho toàn bộ vòng đời ứng dụng.',
    backAnalogy:
      'Mỗi lần gửi 1 bức thư lại xây mới một con đường cao tốc rồi đập bỏ ngay (`AsyncClient` trong từng hàm), thay vì xây 1 đường cao tốc lúc mở cửa (`lifespan`) cho mọi xe chạy chung suốt ngày.',
    codeSnippet: `from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tạo 1 Connection Pool dùng chung suốt vòng đời server:
    async with httpx.AsyncClient(timeout=10.0) as client:
        app.state.http_client = client
        yield`,
    relatedTermIds: ['eco-fastapi', 'stdlib-asyncio'],
  },
];

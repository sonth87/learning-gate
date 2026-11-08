import { ExamSet } from '@/types/assessment.types';

export const EXAM_SETS_PART_2: ExamSet[] = [
  {
    id: 'exam-engineering-pytest',
    title: 'Đề 5: Kỹ thuật Dự án, Modern Tooling (uv, Ruff, Pyright) & Kiểm thử pytest (Giai đoạn 3)',
    description:
      'Kiểm tra năng lực tổ chức dự án chuẩn công nghiệp: Quản lý môi trường bằng `uv`, chuẩn `pyproject.toml`, kiến trúc `src-layout`, xử lý Circular Import, `pydantic-settings`, và kiểm thử chuyên sâu với `pytest` & `unittest.mock`.',
    targetLevel: 'pro',
    targetStage: 'stage-3',
    durationMinutes: 20,
    passingScorePercent: 75,
    questions: [
      {
        id: 'q-eng-1',
        stageId: 'stage-3',
        level: 'pro',
        question:
          'Tại sao trong các dự án Python hiện đại sử dụng `uv`, bạn BẮT BUỘC phải commit cả file `pyproject.toml` LẪN `uv.lock` lên Git, nhưng tuyệt đối KHÔNG commit thư mục `.venv/`?',
        options: [
          {
            id: 'opt-a',
            text: '`pyproject.toml` khai báo dải phiên bản mong muốn (như `fastapi>=0.115`), còn `uv.lock` khóa chặt phiên bản chính xác cùng mã băm SHA-256 của MỌI thư viện trực tiếp và bắc cầu (transitive dependencies) đa nền tảng — giúp `uv sync --locked` trên CI/CD tái tạo môi trường giống 100% máy dev; trong khi `.venv/` chứa binary đặc thù theo hệ điều hành máy cá nhân!',
            whyRightOrWrong:
              'Chính xác! Tương tự `package.json` và `package-lock.json`/`pnpm-lock.yaml` bên Node.js, cặp `pyproject.toml` + `uv.lock` đảm bảo tính tất định (Reproducible Builds) trên mọi môi trường.',
          },
          {
            id: 'opt-b',
            text: 'Nên đưa `uv.lock` vào `.gitignore` để mỗi lần deploy server tự tải bản mới nhất',
            whyRightOrWrong:
              'Sai! Không khóa lockfile khiến một thư viện phụ thuộc cấp 3 cập nhật ngầm lúc nửa đêm có thể làm sập toàn bộ bản build Production.',
          },
          {
            id: 'opt-c',
            text: 'Nên commit cả `.venv/` lên Git để Docker không cần chạy `uv sync`',
            whyRightOrWrong:
              'Sai! `.venv/` nặng hàng trăm MB và chứa các thư viện C biên dịch riêng cho macOS/Windows của máy dev nên không thể chạy được trên Linux container.',
          },
          {
            id: 'opt-d',
            text: 'Phải dùng song song cả `requirements.txt`, `Pipfile.lock`, `poetry.lock` và `uv.lock`',
            whyRightOrWrong:
              'Sai! Khi đã chuẩn hóa sang `uv`, chỉ cần `pyproject.toml` và `uv.lock` là nguồn sự thật duy nhất (Single Source of Truth).',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Trên môi trường CI/CD và Dockerfile Production, hãy luôn chạy `uv sync --frozen --no-dev` (hoặc `--locked`) để cài đặt đúng tuyệt đối phiên bản trong `uv.lock` mà không cài thừa các công cụ dev như `pytest` hay `ruff`.',
        relatedTermIds: ['eco-uv'],
      },
      {
        id: 'q-eng-2',
        stageId: 'stage-3',
        level: 'pro',
        question:
          'Trong file `pyproject.toml` (chuẩn PEP 621), việc phân tách `[project.dependencies]` và `[dependency-groups]` (hoặc `[project.optional-dependencies]`) giải quyết bài toán thực tế nào?',
        codeSnippet: `[project]\nname = "payment-api"\nversion = "0.1.0"\nrequires-python = ">=3.12"\ndependencies = ["fastapi>=0.115.0", "sqlalchemy>=2.0.35"]\n\n[dependency-groups]\ndev = ["pytest>=8.3.0", "ruff>=0.7.0", "pyright>=1.1.380"]`,
        options: [
          {
            id: 'opt-a',
            text: 'Tách biệt các thư viện chạy thực tế trên Production (`dependencies`) với các công cụ chỉ dùng lúc phát triển/kiểm thử (`dev`), giúp Docker image Production nhẹ hơn, khởi động nhanh hơn và giảm bề mặt tấn công bảo mật!',
            whyRightOrWrong:
              'Chính xác! Tương tự `dependencies` vs `devDependencies` trong `package.json`, khi build image Production ta dùng `uv sync --no-dev` để loại bỏ hoàn toàn `pytest`, `ruff`, `pyright`.',
          },
          {
            id: 'opt-b',
            text: 'Các thư viện trong `dev` sẽ được CPython biên dịch chạy nhanh gấp đôi',
            whyRightOrWrong:
              'Sai! Nhóm `dev` chỉ là phân loại quản lý gói khi cài đặt.',
          },
          {
            id: 'opt-c',
            text: '`pyproject.toml` chỉ đọc được bởi `uv`, các công cụ như `ruff` hay `pytest` bắt buộc phải có file cấu hình rời `.ruff.toml` và `pytest.ini`',
            whyRightOrWrong:
              'Sai! Điểm mạnh nhất của `pyproject.toml` là gom cấu hình của cả `ruff` (`[tool.ruff]`), `pytest` (`[tool.pytest.ini_options]`), và `pyright` (`[tool.pyright]`) vào chung 1 file duy nhất.',
          },
          {
            id: 'opt-d',
            text: 'Trường `requires-python = ">=3.12"` chỉ mang tính trang trí, không được kiểm tra khi cài gói',
            whyRightOrWrong:
              'Sai! `uv` và `pip` dựa vào `requires-python` để từ chối cài đặt trên phiên bản Python thấp hơn và giúp `ruff`/`pyright` tự động hiểu target syntax là Python 3.12.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          '`pyproject.toml` giúp xóa sổ hoàn toàn đám rừng file cấu hình cũ kỹ (`requirements.txt`, `requirements-dev.txt`, `setup.py`, `setup.cfg`, `pytest.ini`, `.flake8`, `.isort.cfg`) về một trung tâm duy nhất.',
        relatedTermIds: ['eco-uv', 'eco-ruff', 'eco-pytest'],
      },
      {
        id: 'q-eng-3',
        stageId: 'stage-3',
        level: 'pro',
        question:
          'Tại sao cấu trúc thư mục `src-layout` (`src/my_app/__init__.py`) lại được khuyến nghị hơn `flat-layout` (`my_app/__init__.py` đặt ngay ở thư mục gốc) khi chạy kiểm thử `pytest`?',
        options: [
          {
            id: 'opt-a',
            text: 'Vì Python mặc định chèn thư mục hiện tại `""` (`.` - root) vào đầu `sys.path`: với `flat-layout`, `pytest` có thể vô tình import trực tiếp code chưa đóng gói ở thư mục gốc và che giấu lỗi thiếu file trong cấu hình đóng gói; còn `src-layout` bắt buộc code phải được cài đặt chuẩn chỉnh (`editable install` vào `.venv`) mới import được!',
            whyRightOrWrong:
              'Chính xác! `src-layout` đảm bảo rằng khi test chạy xanh, gói `my_app` đã được cài đặt và phân giải đường dẫn y hệt như khi triển khai thực tế.',
          },
          {
            id: 'opt-b',
            text: 'Vì CPython 3.12+ cấm đặt code ngoài thư mục `src/`',
            whyRightOrWrong:
              'Sai! CPython không cấm, nhưng `src-layout` là Best Practice của PyPA (Python Packaging Authority) để ngăn lỗi import ngầm từ thư mục làm việc hiện tại.',
          },
          {
            id: 'opt-c',
            text: 'Vì `src-layout` giúp loại bỏ nhu cầu sử dụng file `__init__.py`',
            whyRightOrWrong:
              'Sai! Bên trong `src/my_app/` vẫn nên có `__init__.py` để định nghĩa Regular Package rõ ràng.',
          },
          {
            id: 'opt-d',
            text: 'Để giấu mã nguồn không cho người dùng đọc được',
            whyRightOrWrong:
              'Sai! `src-layout` là chuẩn tổ chức mã nguồn và đóng gói, không phải công cụ mã hóa.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Với `src-layout` (`src/my_app/` + `tests/`), bạn hoàn toàn yên tâm rằng mọi lệnh `from my_app.services import ...` trong `tests/` đều đi qua gói đã cài đặt trong `.venv` chứ không bị nhiễm các file rác ở thư mục gốc.',
        relatedTermIds: ['kw-import', 'eco-uv', 'eco-pytest'],
      },
      {
        id: 'q-eng-4',
        stageId: 'stage-3',
        level: 'pro',
        question:
          'Hai module `user.py` và `order.py` import lẫn nhau ở đầu file dẫn đến lỗi `ImportError: cannot import name \'Order\' from partially initialized module \'order\' (most likely due to a circular import)`. Nếu `user.py` CHỈ cần `Order` để làm Type Hint (không khởi tạo `Order()` lúc runtime), giải pháp chuẩn nhất là gì?',
        codeSnippet: `from __future__ import annotations\nfrom typing import TYPE_CHECKING\n\nif TYPE_CHECKING:\n    from app.models.order import Order\n\nclass User:\n    def get_orders(self) -> list[Order]:\n        ...`,
        options: [
          {
            id: 'opt-a',
            text: 'Kết hợp `from __future__ import annotations` (hoặc đặt kiểu trong chuỗi `"list[Order]"`) và đặt lệnh `from app.models.order import Order` vào trong khối `if TYPE_CHECKING:` — vì hằng số `TYPE_CHECKING` là `True` khi Pyright kiểm tra kiểu tĩnh, nhưng luôn bằng `False` lúc chạy thực tế nên cắt đứt hoàn toàn vòng lặp import!',
            whyRightOrWrong:
              'Chính xác 100%! Lúc runtime `TYPE_CHECKING == False` nên Python không hề thực thi lệnh import vòng tròn đó, trong khi IDE và Pyright vẫn hiểu đầy đủ kiểu `Order`.',
          },
          {
            id: 'opt-b',
            text: 'Xóa bỏ hoàn toàn Type Hints và thay bằng `Any` ở mọi nơi',
            whyRightOrWrong:
              'Sai! Làm vậy sẽ đánh mất toàn bộ sự an toàn kiểu tĩnh và tính năng gợi ý code của IDE.',
          },
          {
            id: 'opt-c',
            text: 'Biến `TYPE_CHECKING` bằng `True` lúc chạy code thực tế và bằng `False` khi kiểm tra kiểu',
            whyRightOrWrong:
              'Sai! Ngược lại hoàn toàn: `typing.TYPE_CHECKING` được gán cứng là `False` ở runtime.',
          },
          {
            id: 'opt-d',
            text: 'Dùng `import *` ở cả hai file để tránh lỗi Circular Import',
            whyRightOrWrong:
              'Sai! `from module import *` vừa làm ô nhiễm namespace, vừa vẫn bị lỗi Circular Import.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Nếu hai module thực sự cần gọi hàm của nhau lúc runtime (chứ không chỉ Type Hints), đó là dấu hiệu kiến trúc bị kết dính (Tight Coupling) — hãy tách phần logic chung sang module thứ 3; còn nếu chỉ cần cho Type Hints thì `if TYPE_CHECKING:` là vũ khí chuẩn mực nhất.',
        relatedTermIds: ['kw-import', 'concept-type-hints'],
      },
      {
        id: 'q-eng-5',
        stageId: 'stage-3',
        level: 'pro',
        question:
          'Tại sao trong các hệ thống Backend Python hiện đại, ta nên dùng `pydantic-settings` (`BaseSettings`) thay vì gọi rải rác `os.getenv("DB_PORT", "5432")` khắp mã nguồn?',
        codeSnippet: `from pydantic_settings import BaseSettings, SettingsConfigDict\n\nclass Settings(BaseSettings):\n    model_config = SettingsConfigDict(env_file=".env", extra="ignore")\n    database_url: str\n    db_port: int = 5432\n    debug: bool = False`,
        options: [
          {
            id: 'opt-a',
            text: 'Vì `os.getenv()` luôn chỉ trả về `str | None` (ví dụ `os.getenv("DEBUG") == "false"` vẫn là chuỗi Truthy `True`!), còn `BaseSettings` tự động đọc `.env`/biến môi trường, ép kiểu chuẩn xác (`"false"` -> `False`, `"5432"` -> `5432`) và áp dụng nguyên lý **Fail-Fast**: báo lỗi `ValidationError` dừng app ngay lúc khởi động nếu thiếu cấu hình bắt buộc như `DATABASE_URL`!',
            whyRightOrWrong:
              'Chính xác! Không gì tệ hơn việc app khởi động thành công nhưng 3 tiếng sau mới sập vì một nhánh code gọi `os.getenv("STRIPE_KEY")` trả về `None` hoặc hiểu nhầm chuỗi `"false"` là `True`!',
          },
          {
            id: 'opt-b',
            text: 'Vì `os.getenv("DEBUG")` trong Python tự động chuyển chuỗi `"false"` thành boolean `False`',
            whyRightOrWrong:
              'Sai! `os.getenv()` luôn trả về kiểu `str` (hoặc `None`), và trong Python `bool("false")` là `True`! Đây là bug kinh điển khi không dùng `pydantic-settings`.',
          },
          {
            id: 'opt-c',
            text: '`BaseSettings` tự động mã hóa file `.env` để có thể commit `.env` lên Git an toàn',
            whyRightOrWrong:
              'Sai! File `.env` chứa secret thật vẫn tuyệt đối không được commit lên Git (chỉ commit `.env.example`).',
          },
          {
            id: 'opt-d',
            text: '`BaseSettings` chỉ hoạt động với FastAPI, không dùng được cho script hay Celery',
            whyRightOrWrong:
              'Sai! `pydantic-settings` là thư viện độc lập, dùng được cho mọi dự án Python (FastAPI, Celery, CLI, AI Pipeline).',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Kết hợp `BaseSettings` với `@functools.lru_cache` trên hàm `get_settings()` giúp toàn bộ ứng dụng có cấu hình định kiểu mạnh, tự động kiểm tra hợp lệ ngay giây đầu tiên khi container khởi chạy.',
        relatedTermIds: ['eco-pydantic', 'concept-type-hints'],
      },
      {
        id: 'q-eng-6',
        stageId: 'stage-3',
        level: 'pro',
        question:
          'Trong `pytest`, một `@pytest.fixture(scope="module")` sử dụng từ khóa `yield` hoạt động theo vòng đời như thế nào?',
        codeSnippet: `@pytest.fixture(scope="module")\ndef db_conn():\n    conn = create_test_db()\n    yield conn\n    conn.drop_all_and_close()`,
        options: [
          {
            id: 'opt-a',
            text: 'Phần trước `yield` (Setup) chỉ chạy ĐÚNG 1 LẦN ở đầu file test đó, truyền `conn` cho tất cả các hàm test trong cùng file dùng chung, và phần sau `yield` (Teardown) tự động chạy 1 lần ở cuối file để dọn dẹp kể cả khi các hàm test bị Fail!',
            whyRightOrWrong:
              'Chính xác! Trong `pytest`: `scope="function"` (mặc định) chạy lại mỗi hàm test; `scope="module"` chạy 1 lần cho mỗi file test; `scope="session"` chạy 1 lần cho toàn bộ đợt chạy `pytest`.',
          },
          {
            id: 'opt-b',
            text: 'Hàm `db_conn` sẽ chạy lại từ đầu cho từng hàm `test_*` riêng lẻ trong file',
            whyRightOrWrong:
              'Sai! Đó là hành vi của `scope="function"` (mặc định), còn ở đây đã khai báo `scope="module"`.',
          },
          {
            id: 'opt-c',
            text: 'Nếu một hàm test bị lỗi (`AssertionError`), dòng `conn.drop_all_and_close()` sau `yield` sẽ bị bỏ qua không chạy',
            whyRightOrWrong:
              'Sai! `pytest` quản lý fixture có `yield` giống như Context Manager — phần Teardown sau `yield` luôn được đảm bảo thực thi kể cả khi test thất bại.',
          },
          {
            id: 'opt-d',
            text: 'Muốn dùng fixture `db_conn`, hàm test phải tự gọi `conn = next(db_conn())` bên trong thân hàm',
            whyRightOrWrong:
              'Sai! Trong `pytest`, bạn chỉ cần khai báo tên tham số trùng với tên fixture `def test_user(db_conn):` là `pytest` tự động Dependency Injection giá trị đã `yield` vào!',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mẹo thực chiến với `pytest`: Khởi tạo container/schema nặng ở `scope="session"`, nhưng tạo DB Transaction/Rollback riêng ở `scope="function"` để test vừa chạy cực nhanh vừa cô lập dữ liệu 100%.',
        relatedTermIds: ['eco-pytest', 'kw-yield'],
      },
      {
        id: 'q-eng-7',
        stageId: 'stage-3',
        level: 'pro',
        question:
          'Decorator `@pytest.mark.parametrize` dưới đây sẽ tạo ra bao nhiêu ca kiểm thử (test cases) độc lập và điều gì xảy ra nếu ca kiểm thử thứ nhất bị Fail?',
        codeSnippet: `@pytest.mark.parametrize(\n    ("amount", "expected_tax"),\n    [\n        (100, 10),\n        (0, 0),\n        (500, 50),\n    ],\n)\ndef test_tax(amount: int, expected_tax: int) -> None:\n    assert calc_tax(amount) == expected_tax`,
        options: [
          {
            id: 'opt-a',
            text: 'Tạo ra **3 test cases độc lập** (`test_tax[100-10]`, `test_tax[0-0]`, `test_tax[500-50]`): nếu ca thứ nhất Fail, `pytest` VẪN tiếp tục chạy đầy đủ ca thứ 2 và thứ 3 (khác hoàn toàn với việc dùng vòng lặp `for` bên trong 1 hàm test sẽ dừng ngay ở lỗi đầu tiên!)',
            whyRightOrWrong:
              'Chính xác! Đây là lý do tuyệt đối không nên dùng vòng lặp `for` cho nhiều bộ dữ liệu bên trong 1 hàm test mà phải dùng `@pytest.mark.parametrize`.',
          },
          {
            id: 'opt-b',
            text: 'Chỉ tính là 1 test case duy nhất và dừng ngay lập tức nếu bộ `(100, 10)` bị lỗi',
            whyRightOrWrong:
              'Sai! Mỗi tuple trong danh sách của `parametrize` được `pytest` tách thành một node kiểm thử độc lập hoàn toàn.',
          },
          {
            id: 'opt-c',
            text: 'Tạo ra 6 test cases (tổ hợp chéo `3 x 2`)',
            whyRightOrWrong:
              'Sai! Chỉ khi bạn xếp chồng 2 decorator `@pytest.mark.parametrize` lên nhau thì mới tạo tích Đề-các (Cartesian product), còn 1 decorator với 3 tuple sẽ tạo đúng 3 test cases.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi vì trong `pytest` phải dùng hàm `expect(x).toBe(y)` thay vì từ khóa `assert`',
            whyRightOrWrong:
              'Sai! Điểm kỳ diệu của `pytest` là **Assertion Rewriting** — bạn chỉ cần viết từ khóa `assert a == b` thuần của Python, `pytest` sẽ tự động phân tích AST để in ra chi tiết giá trị hai vế khi lỗi!',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          '`@pytest.mark.parametrize` kết hợp với cơ chế Assertion Rewriting của `pytest` giúp mã nguồn kiểm thử Python ngắn gọn và giàu thông tin bậc nhất trong các ngôn ngữ lập trình.',
        relatedTermIds: ['eco-pytest', 'concept-decorator'],
      },
      {
        id: 'q-eng-8',
        stageId: 'stage-3',
        level: 'pro',
        question:
          'Làm thế nào để kiểm thử trong `pytest` rằng hàm `withdraw(1000)` BẮT BUỘC phải ném ra lỗi `ValueError` với thông báo chứa cụm từ `"Số dư không đủ"`?',
        codeSnippet: `import pytest\n\n# Cách viết nào dưới đây là chuẩn mực nhất trong pytest?`,
        options: [
          {
            id: 'opt-a',
            text: 'Dùng Context Manager: `with pytest.raises(ValueError, match="Số dư không đủ"): withdraw(1000)`',
            whyRightOrWrong:
              'Chính xác! Nếu `withdraw(1000)` không ném `ValueError` (hoặc ném `ValueError` nhưng nội dung thông báo không khớp biểu thức chính quy `match`), test sẽ Fail ngay lập tức.',
          },
          {
            id: 'opt-b',
            text: 'Dùng `assert withdraw(1000) == ValueError("Số dư không đủ")`',
            whyRightOrWrong:
              'Sai! Khi `withdraw(1000)` ném Exception, nó làm văng lỗi ngay trước khi phép so sánh `==` kịp thực hiện.',
          },
          {
            id: 'opt-c',
            text: 'Bọc toàn bộ file test trong `try ... except Exception: pass`',
            whyRightOrWrong:
              'Sai! Nếu `withdraw(1000)` KHÔNG ném lỗi gì cả, khối `try...except: pass` sẽ âm thầm cho test Pass oan (False Positive)!',
          },
          {
            id: 'opt-d',
            text: 'Dùng `assert withdraw(1000) is None`',
            whyRightOrWrong:
              'Sai! Hàm ném ra ngoại lệ chứ không trả về `None`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Luôn thêm tham số `match="..."` khi dùng `pytest.raises(ValueError, match=...)` để đảm bảo hàm ném lỗi đúng vì lý do nghiệp vụ bạn mong đợi chứ không phải một lỗi `ValueError` vô tình khác bên trong hàm.',
        relatedTermIds: ['eco-pytest', 'kw-with', 'kw-raise'],
      },
      {
        id: 'q-eng-9',
        stageId: 'stage-3',
        level: 'pro',
        question:
          'Quy tắc vàng **"Patch where it is looked up, not where it is defined"** khi dùng `unittest.mock.patch`: Giả sử file `app/payment.py` có dòng `from app.gateway import charge_card`. Trong file test, bạn phải `patch` đường dẫn nào?',
        codeSnippet: `# Trong file app/payment.py:\nfrom app.gateway import charge_card\n\ndef process_order(amount: int) -> str:\n    return charge_card(amount)`,
        options: [
          {
            id: 'opt-a',
            text: 'Phải viết `@patch("app.payment.charge_card")` — Vì lệnh `from app.gateway import charge_card` đã tạo một nhãn dán `charge_card` trực tiếp bên trong namespace của `app.payment`! Nếu bạn patch `"app.gateway.charge_card"`, hàm `process_order` vẫn gọi vào tham chiếu cũ trong `app.payment`!',
            whyRightOrWrong:
              'Chính xác 100%! Đây là cái bẫy khiến hàng loạt lập trình viên bối rối khi thấy mình đã `@patch` nhưng hàm thật vẫn bị gọi. Phải thay thế nhãn dán tại đúng module đang sử dụng nó (`app.payment.charge_card`).',
          },
          {
            id: 'opt-b',
            text: 'Phải viết `@patch("app.gateway.charge_card")` vì hàm gốc được định nghĩa ở `app.gateway`',
            whyRightOrWrong:
              'Sai! Khi `app.payment` đã được nạp bằng `from app.gateway import charge_card`, nó giữ tham chiếu riêng tới hàm gốc. Sửa `app.gateway.charge_card` sau đó không làm thay đổi biến `charge_card` trong `app.payment`!',
          },
          {
            id: 'opt-c',
            text: 'Viết `@patch("charge_card")` không cần tên module',
            whyRightOrWrong:
              'Sai! `patch()` bắt buộc phải có đường dẫn đầy đủ tới module chứa thuộc tính cần thay thế.',
          },
          {
            id: 'opt-d',
            text: 'Không thể mock được hàm nếu đã dùng `from ... import ...`',
            whyRightOrWrong:
              'Sai! Hoàn toàn mock được bằng cách trỏ đích danh vào namespace nơi nó được import tới: `"app.payment.charge_card"`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Hiểu mô hình bộ nhớ nhãn dán của Python sẽ giúp bạn thông suốt ngay: `from app.gateway import charge_card` tương đương `app.payment.charge_card = app.gateway.charge_card`. Do đó muốn đánh tráo hàm mà `app.payment` nhìn thấy, bạn phải tráo nhãn `app.payment.charge_card`!',
        relatedTermIds: ['eco-pytest', 'kw-import', 'concept-pass-by-object-ref'],
      },
      {
        id: 'q-eng-10',
        stageId: 'stage-3',
        level: 'pro',
        question:
          'Tại sao trong code Backend Production (Docker / Kubernetes), bạn phải dùng module `logging` (hoặc `structlog`) xuất định dạng **Structured JSON** kèm `contextvars` (`request_id`) thay vì dùng hàm `print()`?',
        options: [
          {
            id: 'opt-a',
            text: 'Vì `print()` không có cấp độ nghiêm trọng (`INFO`, `WARNING`, `ERROR`), không tự đính kèm Stack Trace chuẩn (`logger.exception()`), và xuất văn bản thô khiến hệ thống giám sát tập trung (Datadog, ELK, Loki) không thể truy vấn/lọc theo các trường như `request_id` hay `user_id` khi hàng trăm request chạy đan xen!',
            whyRightOrWrong:
              'Chính xác! Trên Production, hàng nghìn dòng log từ nhiều coroutine/worker đổ về stdout cùng lúc. Structured JSON Log kèm `request_id` (lưu trong `contextvars.ContextVar`) là cách duy nhất để truy vết toàn bộ hành trình của 1 request.',
          },
          {
            id: 'opt-b',
            text: 'Vì hàm `print()` bị xóa bỏ khi chạy Python với cờ tối ưu hóa `python -O`',
            whyRightOrWrong:
              'Sai! Cờ `python -O` chỉ loại bỏ các câu lệnh `assert`, không xóa `print()`.',
          },
          {
            id: 'opt-c',
            text: 'Vì `print()` tự động gửi log lên Cloud còn `logging` thì chỉ ghi ra file cục bộ',
            whyRightOrWrong:
              'Sai! Theo chuẩn 12-Factor App trong Docker/K8s, `logging.StreamHandler(sys.stdout)` cũng xuất JSON ra `stdout` đểエージェント của K8s thu thập.',
          },
          {
            id: 'opt-d',
            text: 'Khi gọi `logger.error("Lỗi")` bên trong khối `except`, nó luôn tự động đính kèm toàn bộ Traceback mà không cần thêm tham số gì',
            whyRightOrWrong:
              'Sai! `logger.error("Lỗi")` mặc định KHÔNG in Traceback trừ khi bạn truyền `exc_info=True` hoặc gọi `logger.exception("Lỗi")`!',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mẹo thực chiến: Bên trong khối `except Exception:`, hãy luôn gọi `logger.exception(" Xử lý đơn hàng thất bại", extra={"order_id": order_id})` để tự động ghi lại toàn bộ Stack Trace kèm ngữ cảnh lỗi.',
        relatedTermIds: ['kw-try-except-finally'],
      },
    ],
  },
  {
    id: 'exam-fastapi-sqlalchemy',
    title: 'Đề 6: Backend Thực chiến: FastAPI, Pydantic v2 & SQLAlchemy 2.0 Async (Giai đoạn 4)',
    description:
      'Thử thách kiến trúc Backend hiện đại: Dependency Injection có `yield`, bẫy `async def` vs `def` trong FastAPI, Pydantic v2 Validators & `ConfigDict`, lọc dữ liệu nhạy cảm với `response_model`, SQLAlchemy 2.0 `Mapped[T]`, `MissingGreenlet` và N+1 Query.',
    targetLevel: 'pro',
    targetStage: 'stage-4',
    durationMinutes: 25,
    passingScorePercent: 75,
    questions: [
      {
        id: 'q-fa-1',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Trong FastAPI, khi một hàm Dependency `get_db()` sử dụng từ khóa `yield` để cung cấp `AsyncSession`, phần code nằm SAU dòng `yield` sẽ được thực thi vào thời điểm nào?',
        codeSnippet: `async def get_db() -> AsyncGenerator[AsyncSession, None]:\n    async with SessionLocal() as session:\n        yield session\n        # Code dọn dẹp ở đây chạy khi nào?`,
        options: [
          {
            id: 'opt-a',
            text: 'Chạy SAU KHI hàm xử lý route (path operation) đã trả kết quả và dữ liệu phản hồi (`response_model`) đã được chuẩn bị xong (hoặc khi route ném ra Exception) — giúp đảm bảo `session` luôn còn mở trong suốt quá trình xử lý request và đóng lại an toàn ở cuối!',
            whyRightOrWrong:
              'Chính xác! FastAPI biến hàm Dependency có `yield` thành một Context Manager bao quanh toàn bộ vòng đời xử lý của request đó.',
          },
          {
            id: 'opt-b',
            text: 'Chạy ngay lập tức trước khi nhảy vào thân hàm route handler',
            whyRightOrWrong:
              'Sai! Nếu chạy trước khi vào route handler thì `session` đã bị đóng mất trước khi route kịp truy vấn DB!',
          },
          {
            id: 'opt-c',
            text: 'Chỉ chạy khi toàn bộ server Uvicorn tắt (Shutdown)',
            whyRightOrWrong:
              'Sai! Đó là vòng đời `lifespan` của cả ứng dụng, còn `Depends(get_db)` chạy theo từng HTTP Request.',
          },
          {
            id: 'opt-d',
            text: 'Không bao giờ chạy nếu route handler ném ra `HTTPException(status_code=404)`',
            whyRightOrWrong:
              'Sai! Khi có `HTTPException` hay bất kỳ lỗi nào, FastAPI sẽ ném lỗi đó vào điểm `yield` (vì vậy `async with SessionLocal() as session:` hoặc khối `try...finally:` quanh `yield` sẽ luôn chạy dọn dẹp!).',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Lưu ý từ FastAPI 0.106+: Các BackgroundTasks sẽ chạy SAU khi phần teardown của `yield` dependency hoàn tất. Vì vậy trong `BackgroundTasks`, bạn nên tự mở một DB session mới thay vì dùng lại `session` của request!',
        relatedTermIds: ['eco-fastapi', 'kw-yield', 'eco-sqlalchemy'],
      },
      {
        id: 'q-fa-2',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Sự khác biệt cực kỳ quan trọng về cơ chế thực thi của FastAPI khi bạn khai báo một route handler bằng `async def` so với `def` (không có `async`) là gì?',
        codeSnippet: `@app.get("/a")\nasync def route_a(): ...\n\n@app.get("/b")\ndef route_b(): ...`,
        options: [
          {
            id: 'opt-a',
            text: 'Hàm `async def` được chạy TRỰC TIẾP trên luồng chính của Event Loop (nên bắt buộc mọi I/O bên trong phải là non-blocking `await`); trong khi hàm `def` thường được FastAPI tự động đẩy sang chạy trên một **External ThreadPool** (`anyio.to_thread.run_sync`) để tránh làm đóng băng Event Loop khi gọi thư viện đồng bộ!',
            whyRightOrWrong:
              'Chính xác 100%! Vì vậy nếu bạn bắt buộc phải dùng một thư viện đồng bộ cũ (như `requests`, `boto3`, `pytesseract`), khai báo hàm route là `def` thường thực chất AN TOÀN HƠN khai báo `async def` mà quên đẩy ra thread!',
          },
          {
            id: 'opt-b',
            text: 'Khai báo `async def` luôn luôn tự động chạy đa luồng (multi-threading) cho mọi lệnh bên trong nó',
            whyRightOrWrong:
              'Sai lầm chí mạng! `async def` chạy ngay trên 1 luồng duy nhất của Event Loop. Nếu bạn gọi hàm blocking trong `async def`, toàn bộ worker đó bị treo đứng!',
          },
          {
            id: 'opt-c',
            text: 'FastAPI cấm viết hàm `def` thường, bắt buộc mọi endpoint phải là `async def`',
            whyRightOrWrong:
              'Sai! FastAPI hỗ trợ hoàn hảo cả `async def` lẫn `def` tùy thuộc vào việc thư viện bên dưới của bạn là async hay sync.',
          },
          {
            id: 'opt-d',
            text: 'Hàm `def` thường được chạy trong `ProcessPoolExecutor` (đa tiến trình)',
            whyRightOrWrong:
              'Sai! FastAPI dùng ThreadPool (mặc định 40 threads qua AnyIO) cho `def`, không phải ProcessPool.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Quy tắc vàng của FastAPI: Chỉ dùng `async def` khi bạn dùng thư viện bất đồng bộ (`AsyncSession`, `httpx.AsyncClient`). Nếu bên trong chỉ gọi thư viện đồng bộ blocking, hãy khai báo endpoint là `def` thường (hoặc dùng `await asyncio.to_thread()`).',
        relatedTermIds: ['eco-fastapi', 'kw-async', 'concept-asyncio'],
      },
      {
        id: 'q-fa-3',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Trong Pydantic v2, khi bạn cần kiểm tra một quy tắc phụ thuộc giữa NHIỀU trường cùng lúc (ví dụ: `end_date` phải lớn hơn `start_date`, hoặc `password == confirm_password`), bạn phải dùng Decorator nào?',
        codeSnippet: `from pydantic import BaseModel, model_validator\nfrom typing import Self\n\nclass BookingRequest(BaseModel):\n    start_day: int\n    end_day: int\n\n    @model_validator(mode="after")\n    def check_dates(self) -> Self:\n        if self.end_day <= self.start_day:\n            raise ValueError("Ngày kết thúc phải sau ngày bắt đầu")\n        return self`,
        options: [
          {
            id: 'opt-a',
            text: 'Dùng `@model_validator(mode="after")` — Hàm này chạy SAU KHI từng trường riêng lẻ (`start_day`, `end_day`) đã được ép kiểu và kiểm tra hợp lệ xong, cho phép truy cập trực tiếp `self.start_day` và `self.end_day` một cách an toàn kiểu (và bắt buộc `return self` ở cuối)!',
            whyRightOrWrong:
              'Chính xác! Trong Pydantic v2, `@field_validator` dùng để kiểm tra 1 trường đơn lẻ (dùng `@classmethod`), còn `@model_validator(mode="after")` dùng để kiểm tra chéo nhiều trường trên `self`.',
          },
          {
            id: 'opt-b',
            text: 'Dùng `@validator("end_day")` và `@root_validator` như Pydantic v1',
            whyRightOrWrong:
              'Sai! `@validator` và `@root_validator` đã bị khai tử (deprecated) trong Pydantic v2, thay bằng `@field_validator` và `@model_validator`.',
          },
          {
            id: 'opt-c',
            text: 'Trong `@model_validator(mode="after")`, không cần viết `return self` ở cuối hàm',
            whyRightOrWrong:
              'Sai! Nếu quên `return self`, hàm trả về `None` và thực thể model sau khi validate sẽ biến thành `None`!',
          },
          {
            id: 'opt-d',
            text: 'Khi phát hiện dữ liệu không hợp lệ bên trong validator của Pydantic, phải trả về `False` thay vì `raise ValueError`',
            whyRightOrWrong:
              'Sai! Trong Pydantic validator, nếu bạn `return False` thì Pydantic sẽ tưởng bạn muốn gán giá trị `False` cho model! Bắt buộc phải `raise ValueError("...")` (hoặc `PydanticCustomError`).',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Nhớ kỹ 2 quy tắc của Pydantic v2 Validator: (1) Báo lỗi bằng `raise ValueError("...")` (Pydantic sẽ tự bắt và gom vào `ValidationError` chuẩn 422); (2) Luôn `return` giá trị đã kiểm tra (`return v` ở `@field_validator` và `return self` ở `@model_validator(mode="after")`).',
        relatedTermIds: ['eco-pydantic', 'concept-decorator', 'kw-raise'],
      },
      {
        id: 'q-fa-4',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Trong Pydantic v2, cấu hình `model_config = ConfigDict(from_attributes=True, extra="forbid")` mang lại hai tác dụng bảo mật và tích hợp ORM nào?',
        codeSnippet: `from pydantic import BaseModel, ConfigDict\n\nclass UserSchema(BaseModel):\n    model_config = ConfigDict(from_attributes=True, extra="forbid")\n    id: int\n    username: str`,
        options: [
          {
            id: 'opt-a',
            text: '`from_attributes=True` (thay thế `orm_mode = True` của v1) cho phép đọc dữ liệu trực tiếp từ thuộc tính đối tượng ORM SQLAlchemy (`user.id`, `user.username`) ngoài `dict`; còn `extra="forbid"` lập tức từ chối và báo lỗi 422 nếu client gửi kèm bất kỳ trường lạ nào không khai báo trong Schema (chống lỗi Mass Assignment / gõ sai tên trường)!',
            whyRightOrWrong:
              'Chính xác! Mặc định Pydantic có `extra="ignore"` (âm thầm bỏ qua trường thừa). Đặt `extra="forbid"` cho Request Body Schema là Best Practice giúp phát hiện ngay khi Frontend gửi sai tên trường (ví dụ gửi `userName` thay vì `username`).',
          },
          {
            id: 'opt-b',
            text: '`from_attributes=True` cho phép Pydantic tự động chạy câu lệnh SQL `UPDATE` xuống Database',
            whyRightOrWrong:
              'Sai! Pydantic chỉ là thư viện Data Validation & Serialization trong bộ nhớ, hoàn toàn không kết nối hay chạy lệnh SQL xuống Database.',
          },
          {
            id: 'opt-c',
            text: '`extra="forbid"` cho phép lưu các trường thừa vào thuộc tính `model.model_extra`',
            whyRightOrWrong:
              'Sai! Lưu trường thừa là hành vi của `extra="allow"`, còn `extra="forbid"` sẽ ném `ValidationError` ngay lập tức.',
          },
          {
            id: 'opt-d',
            text: 'Trong Pydantic v2 vẫn bắt buộc phải viết `class Config: orm_mode = True` bên trong `BaseModel`',
            whyRightOrWrong:
              'Sai! `class Config:` là cú pháp cũ của Pydantic v1; Pydantic v2 đã chuyển sang thuộc tính `model_config = ConfigDict(...)` có hỗ trợ gợi ý kiểu tĩnh đầy đủ.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mẹo kiến trúc thực chiến: Tạo 2 lớp cơ sở — `RequestSchema` với `ConfigDict(extra="forbid", str_strip_whitespace=True)` để kiểm soát chặt dữ liệu đầu vào, và `ResponseSchema` với `ConfigDict(from_attributes=True)` để chuyển đổi mượt mà từ SQLAlchemy ORM Model.',
        relatedTermIds: ['eco-pydantic', 'eco-sqlalchemy', 'eco-fastapi'],
      },
      {
        id: 'q-fa-5',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Điều gì xảy ra nếu trong FastAPI, bạn trả về trực tiếp đối tượng ORM `User` (có chứa cột `hashed_password`) từ hàm route, NHƯNG có khai báo `@app.get("/me", response_model=UserPublicResponse)` (trong đó `UserPublicResponse` chỉ gồm `id` và `email`)?',
        codeSnippet: `class UserPublicResponse(BaseModel):\n    model_config = ConfigDict(from_attributes=True)\n    id: int\n    email: str\n\n@app.get("/me", response_model=UserPublicResponse)\nasync def get_me(current_user: UserORM = Depends(get_current_user)):\n    return current_user  # current_user có chứa current_user.hashed_password!`,
        options: [
          {
            id: 'opt-a',
            text: 'FastAPI dùng `UserPublicResponse` (chạy trên lõi Rust `pydantic-core`) làm bộ lọc đầu ra: tự động trích xuất đúng `id` và `email` từ `current_user`, LOẠI BỎ hoàn toàn `hashed_password` trước khi đóng gói JSON trả về cho client, đồng thời tự sinh tài liệu OpenAPI chính xác!',
            whyRightOrWrong:
              'Chính xác! Đây là tấm khiên bảo mật quan trọng nhất của FastAPI. Ngược lại, nếu bạn quên khai báo `response_model=UserPublicResponse` (hoặc kiểu trả về `-> UserPublicResponse`), toàn bộ cột nhạy cảm của đối tượng trả về có nguy cơ bị lộ ra ngoài JSON!',
          },
          {
            id: 'opt-b',
            text: 'Ném lỗi `ValidationError` vì `current_user` có thừa thuộc tính `hashed_password`',
            whyRightOrWrong:
              'Sai! Khi đọc từ đối tượng ORM qua `from_attributes=True`, Pydantic chỉ lấy các thuộc tính được khai báo trong `UserPublicResponse` và bỏ qua các thuộc tính khác của ORM.',
          },
          {
            id: 'opt-c',
            text: 'Trường `hashed_password` vẫn bị lộ ra trong JSON trả về vì lệnh `return current_user` trả về thẳng đối tượng ORM',
            whyRightOrWrong:
              'Sai! Trước khi gửi HTTP response, FastAPI luôn ép dữ liệu đi qua `response_model` để lọc và serialize.',
          },
          {
            id: 'opt-d',
            text: 'Xóa vĩnh viễn cột `hashed_password` trong Database của user đó',
            whyRightOrWrong:
              'Sai! Việc lọc `response_model` chỉ diễn ra khi tạo chuỗi JSON trả về HTTP, không đụng chạm tới Database.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Luôn tách biệt ít nhất 3 Schema cho mỗi thực thể: `UserCreate` (nhận `password` thô), `UserORM` (lưu `hashed_password` trong DB), và `UserPublicResponse` (chỉ trả về `id`, `email`, `created_at` — tuyệt đối không có mật khẩu).',
        relatedTermIds: ['eco-fastapi', 'eco-pydantic', 'eco-sqlalchemy'],
      },
      {
        id: 'q-fa-6',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Trong SQLAlchemy 2.0 hiện đại, tại sao cú pháp khai báo Model dùng `Mapped[T]` và `mapped_column()` lại thay thế hoàn toàn cách viết `Column(Integer)` cũ của SQLAlchemy 1.x?',
        codeSnippet: `from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column\n\nclass Base(DeclarativeBase):\n    pass\n\nclass Product(Base):\n    __tablename__ = "products"\n    id: Mapped[int] = mapped_column(primary_key=True)\n    name: Mapped[str] = mapped_column(index=True)\n    bio: Mapped[str | None] = mapped_column(default=None)`,
        options: [
          {
            id: 'opt-a',
            text: 'Vì `Mapped[str | None]` vừa giúp SQLAlchemy 2.0 tự động suy luận kiểu cột SQL (`VARCHAR NULL` cho `str | None`, `NOT NULL` cho `str`), vừa giúp trình kiểm tra kiểu tĩnh Pyright/IDE biết chính xác `product.name` là kiểu `str` chứ không phải đối tượng `Column[Any]` mù mờ như bản 1.x!',
            whyRightOrWrong:
              'Chính xác! Ở SQLAlchemy 1.x (`name = Column(String)`), IDE không thể phân biệt lúc nào `Product.name` là biểu thức cột SQL và lúc nào `product.name` là chuỗi `str` của instance. Descriptor `Mapped[T]` của bản 2.0 giải quyết triệt để cả hai!',
          },
          {
            id: 'opt-b',
            text: '`Mapped[str | None]` vẫn tạo ra cột `NOT NULL` trong Database trừ khi truyền thêm `nullable=True`',
            whyRightOrWrong:
              'Sai! Điểm thông minh nhất của SQLAlchemy 2.0 là tự đọc Union `| None` (hoặc `Optional[...]`) trong `Mapped[str | None]` để tự động đặt `nullable=True` (và nếu viết `Mapped[str]` thì tự động đặt `nullable=False`)!',
          },
          {
            id: 'opt-c',
            text: 'Trong SQLAlchemy 2.0 Async, vẫn nên dùng `session.query(Product).all()` như bản 1.x',
            whyRightOrWrong:
              'Sai! API `session.query()` đã là di sản (legacy) và thậm chí không tồn tại trực tiếp trên `AsyncSession`. Trong bản 2.0, ta luôn dùng `await session.scalars(select(Product))`.',
          },
          {
            id: 'opt-d',
            text: '`mapped_column` chỉ dùng được với cơ sở dữ liệu SQLite',
            whyRightOrWrong:
              'Sai! Dùng chung cho PostgreSQL, MySQL, SQLite, Oracle, SQL Server...',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'SQLAlchemy 2.0 kết hợp `Mapped[T]`, `mapped_column()` và cú pháp truy vấn `select(Model)` thống nhất hoàn toàn giữa Core và ORM, mang lại trải nghiệm Type Safety ngang ngửa Prisma/TypeORM bên TypeScript.',
        relatedTermIds: ['eco-sqlalchemy', 'concept-type-hints'],
      },
      {
        id: 'q-fa-7',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Trong SQLAlchemy 2.0 với `AsyncSession`, tại sao sau khi gọi `await session.commit()`, việc truy cập thuộc tính `user.id` (hoặc trả `user` về cho FastAPI `response_model`) đôi khi lại ném lỗi `sqlalchemy.exc.MissingGreenlet` và cách khắc phục chuẩn nhất là gì?',
        codeSnippet: `# Cấu hình sessionmaker nào giúp ngăn chặn lỗi MissingGreenlet sau khi commit?`,
        options: [
          {
            id: 'opt-a',
            text: 'Vì mặc định SQLAlchemy có `expire_on_commit=True` (đánh dấu mọi thuộc tính của `user` là "hết hạn" sau khi `commit`, khiến lần đọc `user.id` tiếp theo cố gắng phát sinh 1 câu lệnh SQL đồng bộ ngầm định mà không có `await` -> nổ lỗi `MissingGreenlet`!). Khắc phục bằng cách cấu hình `async_sessionmaker(engine, expire_on_commit=False)`!',
            whyRightOrWrong:
              'Chính xác 100%! Trong môi trường Async, việc tự động phát sinh I/O ngầm định khi truy cập thuộc tính (`user.id` hoặc关系 `user.orders`) bị cấm. Đặt `expire_on_commit=False` là cấu hình bắt buộc khi khởi tạo `async_sessionmaker`.',
          },
          {
            id: 'opt-b',
            text: 'Do chưa cài đặt thư viện `greenlet` vào hệ điều hành nên chỉ cần xóa `async/await` đi là xong',
            whyRightOrWrong:
              'Sai! Thông báo `MissingGreenlet` của SQLAlchemy thực chất có nghĩa là: "Bạn vừa vô tình kích hoạt Lazy Load (truy vấn SQL ngầm định) bên ngoài ngữ cảnh `await` hợp lệ!".',
          },
          {
            id: 'opt-c',
            text: 'Không được phép gọi `await session.commit()` trong `AsyncSession`',
            whyRightOrWrong:
              'Sai! `await session.commit()` hoàn toàn cần thiết để lưu thay đổi xuống DB.',
          },
          {
            id: 'opt-d',
            text: 'Phải bọc mọi thuộc tính trong `await user.id`',
            whyRightOrWrong:
              'Sai! `user.id` là một thuộc tính số nguyên `int`, không phải Coroutine để `await`. Chỉ cần `expire_on_commit=False` (hoặc `await session.refresh(user)`) là đọc `user.id` trực tiếp bình thường.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Ghi nhớ 2 nguyên nhân gây lỗi `MissingGreenlet` trong SQLAlchemy Async: (1) Quên đặt `expire_on_commit=False` trong `async_sessionmaker`, và (2) Truy cập thuộc tính quan hệ (`user.posts`) mà chưa nạp trước bằng `options(selectinload(User.posts))`.',
        relatedTermIds: ['eco-sqlalchemy', 'kw-async', 'eco-fastapi'],
      },
      {
        id: 'q-fa-8',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Khi giải quyết bài toán N+1 Query trong SQLAlchemy 2.0 bằng Eager Loading, khi nào bạn nên chọn `selectinload()` và khi nào nên chọn `joinedload()`?',
        codeSnippet: `# Truy vấn 50 Author kèm danh sách Books (1-N) và Profile (1-1)`,
        options: [
          {
            id: 'opt-a',
            text: 'Dùng `selectinload(Author.books)` cho quan hệ **One-to-Many / Many-to-Many** (chạy câu query thứ 2 `WHERE author_id IN (...)` giúp tránh nhân bản dữ liệu của bảng cha qua mạng); và dùng `joinedload(Author.profile)` cho quan hệ **Many-to-One / One-to-One** (gộp bằng `LEFT OUTER JOIN` trong 1 query duy nhất)!',
            whyRightOrWrong:
              'Chính xác! Đây là khuyến nghị chính thức trong tài liệu SQLAlchemy 2.0: nếu dùng `joinedload` cho quan hệ 1-N có 100 bài viết mỗi tác giả, dữ liệu các cột của tác giả sẽ bị lặp lại 100 lần trong kết quả JOIN. `selectinload` giải quyết gọn đẹp bằng 1 câu `SELECT ... WHERE id IN (...)`.',
          },
          {
            id: 'opt-b',
            text: '`selectinload` chạy N câu lệnh SQL riêng lẻ cho N tác giả',
            whyRightOrWrong:
              'Sai! Dù có 100 tác giả thì `selectinload` cũng chỉ gom toàn bộ ID vào ĐÚNG 1 câu lệnh `SELECT ... WHERE author_id IN (1, 2, ..., 100)` (tổng cộng đúng 2 queries: 1 cho Author + 1 cho Books).',
          },
          {
            id: 'opt-c',
            text: '`joinedload` không thể dùng được với `AsyncSession`',
            whyRightOrWrong:
              'Sai! Cả `selectinload` và `joinedload` đều dùng rất tốt với `AsyncSession` (lưu ý nếu dùng `joinedload` với tập hợp 1-N thì phải gọi thêm `.unique()` trên kết quả).',
          },
          {
            id: 'opt-d',
            text: 'Nên tắt hết Eager Loading và tự viết vòng lặp `for` chạy câu lệnh `SELECT` bên trong vòng lặp',
            whyRightOrWrong:
              'Sai! Viết câu lệnh `SELECT` bên trong vòng lặp `for` chính là định nghĩa của thảm họa hiệu năng **N+1 Query**!',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Công thức tối ưu SQLAlchemy 2.0: Quan hệ 1-N / N-N -> `selectinload()`; Quan hệ N-1 / 1-1 -> `joinedload()`.',
        relatedTermIds: ['eco-sqlalchemy'],
      },
      {
        id: 'q-fa-9',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Trong kiến trúc phân tầng (Router -> Service -> Repository) khi thực hiện giao dịch chuyển tiền ngân hàng (trừ tiền tài khoản A và cộng tiền tài khoản B), lệnh `await session.commit()` nên được đặt ở đâu để đảm bảo tính Nguyên tử (Atomicity - ACID)?',
        codeSnippet: `async def transfer_money(session: AsyncSession, from_id: int, to_id: int, amount: int):\n    await account_repo.debit(session, from_id, amount)   # Không commit lẻ ở đây!\n    await account_repo.credit(session, to_id, amount)  # Không commit lẻ ở đây!\n    await audit_repo.log_transfer(session, from_id, to_id, amount)\n    await session.commit()  # Commit toàn bộ Unit of Work một lần duy nhất!`,
        options: [
          {
            id: 'opt-a',
            text: 'Các hàm trong `Repository` chỉ nên gọi `session.add()` / `await session.flush()` (đẩy SQL tạm trong transaction hiện tại để lấy ID/kiểm tra ràng buộc), còn quyền quyết định `await session.commit()` (hoặc `rollback()` qua `async with session.begin():`) phải thuộc về tầng **Service / Use Case** (Unit of Work) để cả 3 thao tác cùng thành công hoặc cùng hoàn tác!',
            whyRightOrWrong:
              'Chính xác 100%! Nếu `account_repo.debit()` tự ý gọi `session.commit()` bên trong nó, thì khi bước `credit()` phía sau bị lỗi, tiền của người gửi đã bị trừ vĩnh viễn mà người nhận không nhận được xu nào!',
          },
          {
            id: 'opt-b',
            text: 'Mỗi hàm nhỏ trong Repository phải tự gọi `await session.commit()` ngay ở dòng cuối cùng của nó',
            whyRightOrWrong:
              'Sai! Commit lẻ tẻ trong từng hàm Repository sẽ phá vỡ hoàn toàn khả năng gom nhiều thao tác vào chung một Database Transaction (Unit of Work).',
          },
          {
            id: 'opt-c',
            text: 'Lệnh `await session.flush()` và `await session.commit()` là hoàn toàn giống nhau',
            whyRightOrWrong:
              'Sai! `flush()` chỉ gửi câu lệnh `INSERT/UPDATE` sang bộ đệm transaction của Database (vẫn có thể `rollback()` hoàn toàn), còn `commit()` chốt vĩnh viễn giao dịch xuống đĩa cứng.',
          },
          {
            id: 'opt-d',
            text: 'Trong SQLAlchemy `AsyncSession`, chế độ `autocommit=True` luôn được bật mặc định sau mỗi câu lệnh',
            whyRightOrWrong:
              'Sai! SQLAlchemy 2.0 luôn hoạt động theo cơ chế Transaction tường minh (autobegin transaction, chỉ lưu vĩnh viễn khi gọi `commit()`).',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Hiểu sự khác biệt giữa `session.flush()` (trong Repository, khi cần lấy `obj.id` tự tăng ngay mà chưa đóng transaction) và `session.commit()` (ở tầng Service/Unit of Work) là dấu hiệu phân biệt rõ nhất giữa Junior và Senior Backend Engineer.',
        relatedTermIds: ['eco-sqlalchemy', 'eco-fastapi'],
      },
      {
        id: 'q-fa-10',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Khi sử dụng **Alembic** (`alembic revision --autogenerate -m "..."`) để tạo file Migration cho SQLAlchemy, điều gì thường xuyên xảy ra nếu bạn quên import một ORM Model vào `env.py` (hoặc `Base.metadata`), hoặc khi bạn đổi tên một cột?',
        options: [
          {
            id: 'opt-a',
            text: 'Nếu quên import Model vào nơi `target_metadata = Base.metadata` được nạp, Alembic sẽ tưởng bảng đó đã bị xóa và sinh ra lệnh `op.drop_table()` cực kỳ nguy hiểm! Đồng thời khi đổi tên cột, `--autogenerate` thường sinh thành `drop_column` (mất sạch dữ liệu!) + `add_column` — nên lập trình viên BẮT BUỘC phải đọc và kiểm duyệt lại mọi file migration trước khi chạy `alembic upgrade head`!',
            whyRightOrWrong:
              'Chính xác! Alembic autogenerate chỉ so sánh trạng thái hiện tại của Database với `Base.metadata` trong RAM. Nó không thể đoán ý định đổi tên (`op.alter_column(..., new_column_name=...)`) và sẽ tưởng bảng chưa import là bảng cần xóa!',
          },
          {
            id: 'opt-b',
            text: 'Alembic `--autogenerate` thông minh tuyệt đối nên có thể tự động chạy trên Production mà không cần con người xem lại file migration',
            whyRightOrWrong:
              'Sai! Tự động chạy `--autogenerate` mà không review code migration là con đường ngắn nhất dẫn đến mất dữ liệu Production.',
          },
          {
            id: 'opt-c',
            text: 'Không nên commit thư mục `alembic/versions/` lên Git',
            whyRightOrWrong:
              'Sai! Toàn bộ lịch sử các file migration trong `alembic/versions/` bắt buộc phải được quản lý chặt chẽ trên Git cùng với mã nguồn.',
          },
          {
            id: 'opt-d',
            text: 'Thay vì dùng Alembic, trên Production ta chỉ cần gọi `Base.metadata.create_all(engine)` mỗi khi khởi động app',
            whyRightOrWrong:
              'Sai! `create_all()` chỉ tạo bảng mới nếu chưa có, hoàn toàn KHÔNG THỂ thêm cột mới hay sửa đổi các bảng đã tồn tại trên Production.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Quy tắc vận hành Database: (1) Đảm bảo file `app/models/__init__.py` import đầy đủ mọi Model và được nạp trong `alembic/env.py`; (2) Luôn mở file migration vừa sinh ra để kiểm tra từng dòng `upgrade()` và `downgrade()` trước khi commit.',
        relatedTermIds: ['eco-sqlalchemy'],
      },
      {
        id: 'q-fa-11',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Trong thiết kế RESTful API với FastAPI, hãy phân biệt chính xác ý nghĩa của bộ 4 mã trạng thái HTTP: `400`, `401`, `403` và `422`?',
        options: [
          {
            id: 'opt-a',
            text: '`422 Unprocessable Entity`: Dữ liệu JSON đúng cú pháp nhưng sai kiểu/ràng buộc Pydantic Schema (FastAPI tự trả về); `400 Bad Request`: Lỗi quy tắc nghiệp vụ hoặc cú pháp request hỏng; `401 Unauthorized`: Chưa đăng nhập hoặc JWT Token hết hạn/không hợp lệ (Chưa xác thực - Authentication); `403 Forbidden`: Đã đăng nhập hợp lệ nhưng tài khoản không đủ quyền truy cập tài nguyên đó (Không có quyền - Authorization)!',
            whyRightOrWrong:
              'Chính xác! Phân biệt rõ `401` (Bạn là ai? Hãy đăng nhập lại!) và `403` (Tôi biết bạn là User A rồi, nhưng bạn không có quyền Admin!), cùng với `422` mặc định của FastAPI/Pydantic khi sai schema.',
          },
          {
            id: 'opt-b',
            text: 'Khi Pydantic validate thất bại, FastAPI mặc định trả về mã `500 Internal Server Error`',
            whyRightOrWrong:
              'Sai! Khi Request Body/Query/Path không vượt qua bước kiểm tra của Pydantic, FastAPI tự động bắt `RequestValidationError` và trả về mã `422 Unprocessable Entity` kèm danh sách chi tiết vị trí trường bị lỗi (`loc`, `msg`, `type`).',
          },
          {
            id: 'opt-c',
            text: '`401` dùng khi user đã đăng nhập nhưng thiếu quyền Admin, còn `403` dùng khi chưa gửi Token',
            whyRightOrWrong:
              'Sai! Ngược lại: `401` là lỗi xác thực danh tính (Authentication), còn `403` là lỗi phân quyền (Authorization).',
          },
          {
            id: 'opt-d',
            text: 'Trong FastAPI, để trả về lỗi HTTP ta dùng lệnh `return HTTPException(status_code=404)`',
            whyRightOrWrong:
              'Sai! `HTTPException` là một lớp Exception của Python — bạn BẮT BUỘC phải ném nó bằng từ khóa `raise HTTPException(status_code=404, detail="...")` chứ không được `return`!',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Cẩn thận lỗi kinh điển: Nếu bạn viết `return HTTPException(status_code=404)` thay vì `raise HTTPException(...)`, FastAPI sẽ cố serialize đối tượng exception đó thành JSON với mã `200 OK` (hoặc nổ lỗi `response_model` 500)! Luôn dùng `raise HTTPException(...)`.',
        relatedTermIds: ['eco-fastapi', 'eco-pydantic', 'kw-raise'],
      },
      {
        id: 'q-fa-12',
        stageId: 'stage-4',
        level: 'pro',
        question:
          'Khi viết Integration Test cho FastAPI bằng `pytest` và `httpx.AsyncClient`, làm thế nào để thay thế Dependency `get_db` (đang kết nối DB thật) hoặc `get_current_user` bằng hàm giả lập (Fake/Test DB) chuẩn xác nhất?',
        codeSnippet: `app.dependency_overrides[get_db] = override_get_test_db\n# Sau khi chạy xong test:\napp.dependency_overrides.clear()`,
        options: [
          {
            id: 'opt-a',
            text: 'Sử dụng từ điển tích hợp sẵn `app.dependency_overrides[original_dep] = fake_dep` của FastAPI (và dọn dẹp bằng `app.dependency_overrides.clear()` trong phần teardown của pytest fixture) — sạch sẽ, an toàn kiểu và không cần đụng tới `unittest.mock.patch` phức tạp!',
            whyRightOrWrong:
              'Chính xác! Đây là lý do hệ thống Dependency Injection `Depends()` của FastAPI được yêu thích: bạn chỉ cần ánh xạ hàm dependency gốc sang hàm test trong `app.dependency_overrides` là mọi route trong toàn ứng dụng tự động nhận dependency mới.',
          },
          {
            id: 'opt-b',
            text: 'Gán khóa theo tên chuỗi: `app.dependency_overrides["get_db"] = override_get_test_db`',
            whyRightOrWrong:
              'Sai! Khóa (key) của `app.dependency_overrides` phải là CHÍNH ĐỐI TƯỢNG HÀM/CALLABLE gốc (`get_db`), không phải chuỗi tên hàm `"get_db"`.',
          },
          {
            id: 'opt-c',
            text: 'Sửa trực tiếp mã nguồn của file router trước mỗi lần chạy pytest',
            whyRightOrWrong:
              'Sai! Không bao giờ sửa code ứng dụng để phục vụ test.',
          },
          {
            id: 'opt-d',
            text: 'Không cần gọi `app.dependency_overrides.clear()` vì FastAPI tự xóa sau mỗi request',
            whyRightOrWrong:
              'Sai! `app.dependency_overrides` gắn vào đối tượng `app` toàn cục, nếu không `.clear()` ở phần teardown sau `yield` của fixture, nó sẽ rò rỉ sang các bài test khác!',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mẫu chuẩn trong `conftest.py`: Tạo một `@pytest.fixture` gán `app.dependency_overrides[get_db] = ...`, sau đó `yield client`, và ở dòng cuối sau `yield` luôn gọi `app.dependency_overrides.clear()`.',
        relatedTermIds: ['eco-fastapi', 'eco-pytest'],
      },
    ],
  },
  {
    id: 'exam-concurrency-gil',
    title: 'Đề 7: Giải phẫu GIL, AsyncIO Event Loop, Multiprocessing & Celery (Giai đoạn 5)',
    description:
      'Chinh phục bài toán khó nhất của Python cấp độ Master: Giải phẫu Global Interpreter Lock (GIL), Bẫy chặn Event Loop, `TaskGroup` vs `gather`, `Semaphore`, Race Condition qua điểm `await`, `ProcessPoolExecutor`, Celery Idempotency và Python 3.13 Free-Threaded (PEP 703).',
    targetLevel: 'master',
    targetStage: 'stage-5',
    durationMinutes: 25,
    passingScorePercent: 80,
    questions: [
      {
        id: 'q-con-1',
        stageId: 'stage-5',
        level: 'master',
        question:
          'Trong một ứng dụng FastAPI đang phục vụ 500 người dùng đồng thời trên 1 Uvicorn Worker, điều gì sẽ xảy ra nếu 1 người dùng gọi vào endpoint dưới đây?',
        codeSnippet: `@app.get("/report")\nasync def export_report():\n    time.sleep(10)  # Hoặc gọi requests.get("https://slow-api.com")\n    return {"status": "done"}`,
        options: [
          {
            id: 'opt-a',
            text: 'Chỉ riêng người dùng gọi `/report` phải chờ 10 giây, 499 người dùng khác vẫn truy cập các API khác bình thường như bên Node.js',
            whyRightOrWrong:
              'Sai! `time.sleep(10)` và `requests.get()` là hàm đồng bộ chặn luồng (Synchronous Blocking), không phải Promise/Coroutine bất đồng bộ!',
          },
          {
            id: 'opt-b',
            text: 'Toàn bộ Event Loop của Uvicorn Worker đó bị ĐÓNG BĂNG hoàn toàn trong 10 giây — cả 499 người dùng khác gọi vào bất kỳ endpoint nào cũng bị treo đứng chờ theo!',
            whyRightOrWrong:
              'Chính xác! Vì hàm khai báo là `async def`, FastAPI chạy nó trực tiếp trên luồng chính của Event Loop. Lệnh `time.sleep(10)` giữ chặt luồng duy nhất đó suốt 10 giây mà không có điểm `await` nào để nhường quyền.',
          },
          {
            id: 'opt-c',
            text: 'FastAPI tự động phát hiện `time.sleep` và chuyển nó sang `ProcessPoolExecutor`',
            whyRightOrWrong:
              'Sai! FastAPI chỉ chạy trong ThreadPool nếu bạn khai báo hàm là `def export_report():` (không có từ khóa `async`). Với `async def`, FastAPI tin tưởng bạn chỉ gọi các lệnh non-blocking!',
          },
          {
            id: 'opt-d',
            text: 'Trình thông dịch CPython ném lỗi `RuntimeError` vì gọi hàm sync trong async',
            whyRightOrWrong:
              'Sai! Python không báo lỗi mà âm thầm chặn đứng Event Loop — đây là lỗi nguy hiểm nhất trên Production.',
          },
        ],
        correctOptionId: 'opt-b',
        overallExplanation:
          'Trong `async def`, bắt buộc phải dùng thư viện non-blocking (`await asyncio.sleep(10)`, `await httpx_client.get()`) hoặc đẩy tác vụ đồng bộ sang luồng riêng bằng `await asyncio.to_thread(sync_func)`.',
        analogyReminder:
          'Kiện tướng cờ vua đấu 50 bàn nhưng lại ngồi ngủ gật 10 phút ở bàn số 1.',
        relatedTermIds: ['concept-asyncio', 'kw-async', 'concept-gil', 'eco-fastapi'],
      },
      {
        id: 'q-con-2',
        stageId: 'stage-5',
        level: 'master',
        question:
          'Bạn cần viết một tính năng tính toán thuật toán thuần Python nặng CPU (ví dụ: tìm số nguyên tố hoặc phân tích cây cú pháp hàng loạt trên 8 nhân CPU). Công cụ nào trong Python giúp tận dụng tối đa cả 8 nhân CPU cùng lúc?',
        options: [
          {
            id: 'opt-a',
            text: '`asyncio.gather()` với 500 Coroutines',
            whyRightOrWrong:
              'Sai! `asyncio` chạy trên 1 Thread và 1 CPU core duy nhất, chỉ tăng tốc khi chờ I/O chứ không làm phép toán CPU nhanh hơn.',
          },
          {
            id: 'opt-b',
            text: '`threading.Thread` hoặc `ThreadPoolExecutor` với 8 threads',
            whyRightOrWrong:
              'Sai! Do khóa **GIL (Global Interpreter Lock)** của CPython mặc định, tại một thời điểm chỉ có 1 thread được chạy Python bytecode, nên 8 threads thuần Python vẫn chỉ tranh nhau 1 nhân CPU!',
          },
          {
            id: 'opt-c',
            text: '`multiprocessing` / `concurrent.futures.ProcessPoolExecutor` (hoặc đẩy sang các Celery Worker riêng biệt)',
            whyRightOrWrong:
              'Chính xác! Mỗi tiến trình (OS Process) có vùng nhớ độc lập và một trình thông dịch CPython + GIL riêng biệt, cho phép chạy song song thực sự (True Parallelism) trên cả 8 nhân CPU.',
          },
          {
            id: 'opt-d',
            text: 'Dùng `Generator` với từ khóa `yield`',
            whyRightOrWrong:
              'Sai! Generator chỉ giúp tiết kiệm RAM chứ không chạy song song đa nhân.',
          },
        ],
        correctOptionId: 'opt-c',
        overallExplanation:
          'Nhớ kỹ ma trận xử lý đồng thời: `asyncio` cho I/O-bound hiện đại; `ThreadPoolExecutor` cho I/O-bound thư viện sync cũ; `ProcessPoolExecutor` cho CPU-bound thuần Python; và `Celery/Task Queue` cho tác vụ nền phân tán.',
        relatedTermIds: ['concept-gil', 'concept-asyncio'],
      },
      {
        id: 'q-con-3',
        stageId: 'stage-5',
        level: 'master',
        question:
          'Tại sao các thư viện tính toán như `NumPy`, `Polars`, `PyTorch`, `bcrypt` hay `zlib` khi chạy trên `ThreadPoolExecutor` (hoặc đa luồng nội bộ) lại KHÔNG bị nghẽn bởi khóa GIL của CPython?',
        options: [
          {
            id: 'opt-a',
            text: 'Vì GIL chỉ bảo vệ việc truy cập các đối tượng Python (`PyObject` reference counting). Khi đi vào hàm C/C++/Rust cấp thấp làm việc trên vùng nhớ mảng thô (raw buffer), các thư viện này chủ động **nhả khóa GIL** (`Py_BEGIN_ALLOW_THREADS` / `py.allow_threads()`) trong suốt lúc tính toán nặng trên nhiều nhân CPU, và chỉ lấy lại GIL khi trả kết quả về Python!',
            whyRightOrWrong:
              'Chính xác 100%! Đây là bí mật giúp hệ sinh thái Data/AI của Python cực nhanh: Python chỉ đóng vai trò nhạc trưởng điều phối, còn lúc tính ma trận hay nén dữ liệu thì lõi C/Rust nhả GIL và bung hết sức mạnh đa luồng!',
          },
          {
            id: 'opt-b',
            text: 'Vì khi `import numpy`, CPython tự động xóa bỏ hoàn toàn GIL cho cả toàn bộ code Python còn lại trong chương trình',
            whyRightOrWrong:
              'Sai! GIL chỉ được nhả tạm thời bên trong khối lệnh C/Rust của thư viện đó, còn code Python thuần ở ngoài vẫn chịu sự quản lý của GIL.',
          },
          {
            id: 'opt-c',
            text: 'Vì `NumPy` ngầm khởi tạo hàng chục tiến trình `multiprocessing` mỗi khi cộng hai mảng',
            whyRightOrWrong:
              'Sai! `NumPy` và `Polars` dùng Thread Pool cấp C/Rust (như OpenBLAS, Rayon) chia sẻ bộ nhớ trực tiếp không tốn chi phí copy của `multiprocessing`.',
          },
          {
            id: 'opt-d',
            text: 'Các thư viện này vẫn bị khóa cứng bởi GIL và chỉ chạy được trên 1 nhân CPU duy nhất',
            whyRightOrWrong:
              'Sai! Các phép nhân ma trận lớn trong `NumPy`/`PyTorch` hay truy vấn `Polars` tự động chạy满 100% tất cả các nhân CPU nhờ nhả GIL.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Hiểu điều này giúp bạn trả lời phỏng vấn Senior cực kỳ sắc bén: "GIL chỉ khóa khi thực thi Python Bytecode. Còn I/O syscall của hệ điều hành và các C/Rust extensions như NumPy, Polars, bcrypt đều nhả GIL!".',
        relatedTermIds: ['concept-gil', 'eco-numpy', 'eco-polars'],
      },
      {
        id: 'q-con-4',
        stageId: 'stage-5',
        level: 'master',
        question:
          'Khi chạy đồng thời nhiều Coroutine trong Python 3.11+, sự khác biệt quan trọng nhất giữa `asyncio.TaskGroup()` (Structured Concurrency) và `asyncio.gather()` khi có 1 task con bị lỗi Exception là gì?',
        codeSnippet: `async with asyncio.TaskGroup() as tg:\n    t1 = tg.create_task(fetch_user(1))\n    t2 = tg.create_task(fetch_orders(1))`,
        options: [
          {
            id: 'opt-a',
            text: 'Nếu `t1` ném Exception, `asyncio.TaskGroup()` sẽ TỰ ĐỘNG hủy (`cancel()`) ngay lập tức tất cả các task anh em còn lại (`t2`) và chờ chúng dọn dẹp xong trước khi thoát khối `async with` (ném `ExceptionGroup`); trong khi `asyncio.gather()` mặc định ném lỗi ra ngay nhưng ĐỂ MẶC các task còn lại tiếp tục chạy ngầm mồ côi (orphan tasks) trong nền!',
            whyRightOrWrong:
              'Chính xác! Với `asyncio.gather()`, nếu 1 task lỗi mà bạn không tự hủy các task còn lại, chúng vẫn tiếp tục chạy ngầm tốn tài nguyên hoặc ghi dữ liệu rác vào DB. `TaskGroup` giải quyết triệt để nhờ mô hình **Structured Concurrency**.',
          },
          {
            id: 'opt-b',
            text: '`asyncio.gather()` mặc định tự động hủy toàn bộ các task anh em ngay khi 1 task bị lỗi giống hệt `TaskGroup`',
            whyRightOrWrong:
              'Sai! `asyncio.gather()` KHÔNG hủy các task còn lại khi 1 task ném lỗi — đây chính là khuyết điểm lịch sử khiến Python 3.11 phải bổ sung `asyncio.TaskGroup()`.',
          },
          {
            id: 'opt-c',
            text: 'Trong `asyncio.gather(..., return_exceptions=True)`, nếu có lỗi thì hàm `gather` vẫn ném Exception ngay lập tức',
            whyRightOrWrong:
              'Sai! Khi bật `return_exceptions=True`, `gather` KHÔNG ném lỗi mà gom chính đối tượng Exception đó vào danh sách kết quả trả về (bạn phải tự kiểm tra `if isinstance(res, Exception):`).',
          },
          {
            id: 'opt-d',
            text: '`TaskGroup` chạy các task tuần tự từng cái một thay vì đồng thời',
            whyRightOrWrong:
              'Sai! Mọi task đưa vào `tg.create_task()` đều được lên lịch chạy đồng thời ngay lập tức trên Event Loop.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Trong Python 3.11+: Hãy ưu tiên dùng `async with asyncio.TaskGroup() as tg:` khi muốn "tất cả cùng thành công hoặc cùng hủy sạch sẽ", và dùng `asyncio.gather(*tasks, return_exceptions=True)` khi muốn thu thập kết quả từng phần kể cả khi một vài task lẻ bị lỗi.',
        relatedTermIds: ['concept-asyncio', 'kw-async', 'kw-with'],
      },
      {
        id: 'q-con-5',
        stageId: 'stage-5',
        level: 'master',
        question:
          'Bạn cần tải dữ liệu từ 10.000 URL bằng `httpx.AsyncClient`. Nếu ném thẳng cả 10.000 Coroutine vào `asyncio.gather()` cùng lúc sẽ gây tràn socket hoặc bị server đích chặn (HTTP 429). Giải pháp chuẩn xác nhất để giới hạn tối đa **50 request chạy đồng thời** tại một thời điểm là gì?',
        codeSnippet: `sem = asyncio.Semaphore(50)\n\nasync def safe_fetch(client: httpx.AsyncClient, url: str) -> str:\n    async with sem:\n        resp = await client.get(url)\n        return resp.text`,
        options: [
          {
            id: 'opt-a',
            text: 'Khởi tạo `sem = asyncio.Semaphore(50)` ở ngoài và bọc lời gọi mạng bên trong `async with sem:` — bộ đếm Semaphore chỉ cho phép tối đa 50 coroutine đi vào vùng `async with` cùng lúc, coroutine thứ 51 sẽ tự động tạm dừng (`await`) chờ đến khi 1 trong 50 coroutine trước thoát ra!',
            whyRightOrWrong:
              'Chính xác! Kết hợp `asyncio.Semaphore(N)` với `async with` là mẫu thiết kế kinh điển để kiểm soát Concurrency Limit / Rate Limiting trong AsyncIO.',
          },
          {
            id: 'opt-b',
            text: 'Khởi tạo `sem = asyncio.Semaphore(50)` ở BÊN TRONG thân hàm `safe_fetch`',
            whyRightOrWrong:
              'Sai lầm rất hay gặp! Nếu tạo `asyncio.Semaphore(50)` bên trong thân hàm `safe_fetch`, mỗi trong số 10.000 task sẽ có 1 Semaphore riêng biệt và cả 10.000 request vẫn bắn đi cùng lúc!',
          },
          {
            id: 'opt-c',
            text: 'Dùng `threading.Lock()` bên trong hàm `async def`',
            whyRightOrWrong:
              'Sai! Tuyệt đối không dùng `threading.Lock()` blocking trong `async def`; hơn nữa Lock chỉ cho phép 1 tác vụ thay vì 50 tác vụ đồng thời.',
          },
          {
            id: 'opt-d',
            text: 'Gọi `time.sleep(1)` trước mỗi request',
            whyRightOrWrong:
              'Sai! `time.sleep(1)` làm đóng băng toàn bộ Event Loop.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Luôn dùng `asyncio.Semaphore(limit)` chia sẻ chung giữa các coroutine để điều tiết tải (Backpressure / Concurrency Throttling) khi gọi API bên thứ 3 hoặc truy vấn Database hàng loạt.',
        relatedTermIds: ['concept-asyncio', 'kw-async', 'kw-with'],
      },
      {
        id: 'q-con-6',
        stageId: 'stage-5',
        level: 'master',
        question:
          'Trong một hàm `async def` của FastAPI, bạn bắt buộc phải gọi một hàm của SDK bên thứ 3 chỉ có phiên bản đồng bộ blocking (ví dụ `boto3_client.upload_file(path, bucket, key)`). Cách gọi nào dưới đây là chuẩn nhất trong Python 3.9+?',
        codeSnippet: `async def upload_avatar(path: str):\n    # Gọi hàm đồng bộ boto3_client.upload_file(path, "my-bucket", "avatar.png") thế nào?`,
        options: [
          {
            id: 'opt-a',
            text: 'Dùng `await asyncio.to_thread(boto3_client.upload_file, path, "my-bucket", "avatar.png")` — tự động đẩy hàm đồng bộ đó sang chạy trên một Worker Thread riêng của `ThreadPoolExecutor` mặc định, giúp Event Loop hoàn toàn rảnh tay phục vụ các request khác!',
            whyRightOrWrong:
              'Chính xác! Lưu ý cú pháp: truyền TÊN HÀM `boto3_client.upload_file` làm đối số đầu tiên và các tham số của nó ở phía sau (`asyncio.to_thread(func, *args, **kwargs)`), KHÔNG gọi trực tiếp `boto3_client.upload_file(...)` bên trong ngoặc!',
          },
          {
            id: 'opt-b',
            text: 'Viết `await asyncio.to_thread(boto3_client.upload_file(path, "my-bucket", "avatar.png"))`',
            whyRightOrWrong:
              'Sai! Đây là cái bẫy cú pháp cực kỳ phổ biến: nếu bạn viết `upload_file(...)` có dấu ngoặc gọi hàm ngay bên trong `to_thread(...)`, Python sẽ CHẠY ĐỒNG BỘ hàm `upload_file` ngay trên luồng Event Loop trước rồi mới truyền kết quả trả về vào `to_thread`!',
          },
          {
            id: 'opt-c',
            text: 'Bọc hàm đồng bộ bằng từ khóa `await boto3_client.upload_file(...)`',
            whyRightOrWrong:
              'Sai! Hàm đồng bộ không trả về Awaitable/Coroutine nên `await` trực tiếp sẽ ném lỗi `TypeError: object ... can\'t be used in \'await\' expression`.',
          },
          {
            id: 'opt-d',
            text: 'Định nghĩa một hàm `async def wrapper(): return boto3_client.upload_file(...)` rồi `await wrapper()`',
            whyRightOrWrong:
              'Sai! Chỉ khoác áo `async def` ra ngoài một hàm blocking KHÔNG biến nó thành non-blocking — nó vẫn chạy trực tiếp trên luồng Event Loop và làm treo server!',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Hãy khắc cốt ghi tâm: Khoác từ khóa `async def` ra ngoài một hàm đồng bộ KHÔNG giúp nó bất đồng bộ! Bạn bắt buộc phải dùng `await asyncio.to_thread(sync_func, arg1, arg2)` để ủy quyền nó sang ThreadPool.',
        relatedTermIds: ['concept-asyncio', 'kw-async'],
      },
      {
        id: 'q-con-7',
        stageId: 'stage-5',
        level: 'master',
        question:
          'Khi một Coroutine bị hủy giữa chừng (do hết thời gian chờ `asyncio.timeout(5.0)` / `asyncio.wait_for()` hoặc do client ngắt kết nối), điều gì xảy ra bên trong Coroutine đó và tại sao phải cẩn thận khi viết `except Exception:`?',
        codeSnippet: `async def worker():\n    try:\n        await long_io_operation()\n    except asyncio.CancelledError:\n        await cleanup_resources()\n        raise  # Tại sao dòng raise này lại quan trọng sống còn?`,
        options: [
          {
            id: 'opt-a',
            text: 'Event Loop ném `asyncio.CancelledError` vào ngay tại điểm `await` đang tạm dừng. Từ Python 3.8+, `CancelledError` kế thừa trực tiếp từ `BaseException` (KHÔNG kế thừa từ `Exception` để tránh bị `except Exception:` vô tình nuốt mất!); nếu bạn bắt `except asyncio.CancelledError:` để dọn dẹp tài nguyên, bạn BẮT BUỘC phải `raise` lại nó ở cuối để cơ chế hủy của `timeout()`/`TaskGroup` không bị treo!',
            whyRightOrWrong:
              'Chính xác 100%! Nếu bạn bắt `CancelledError` mà quên `raise` lại (nuốt lỗi hủy), `asyncio.timeout()` hoặc `TaskGroup` bên ngoài sẽ bị hỏng trạng thái hoặc treo vô tận chờ task kết thúc.',
          },
          {
            id: 'opt-b',
            text: '`asyncio.CancelledError` là lớp con của `Exception` nên mọi khối `except Exception:` đều tự động nuốt mất lệnh hủy task',
            whyRightOrWrong:
              'Sai! Ở Python 3.7 trở về trước thì đúng như vậy và gây ra vô số bug, nên từ Python 3.8+ (PEP 492/bpo-32528), `CancelledError` đã được chuyển sang kế thừa trực tiếp từ `BaseException` (ngang hàng với `KeyboardInterrupt`, `SystemExit`).',
          },
          {
            id: 'opt-c',
            text: 'Bên trong khối `except asyncio.CancelledError:` hoặc `finally:`, không được phép dùng từ khóa `await`',
            whyRightOrWrong:
              'Sai! Hoàn toàn được phép `await` để đóng kết nối/rollback DB trong `finally`, miễn là không nuốt mất `CancelledError`.',
          },
          {
            id: 'opt-d',
            text: 'Khi hết giờ `asyncio.timeout(5.0)`, Python giết chết luồng OS Thread ngay lập tức mà không chạy khối `finally`',
            whyRightOrWrong:
              'Sai! Hủy task trong `asyncio` là **Cooperative Cancellation** thông qua việc ném `CancelledError` tại điểm `await`, nên khối `finally` luôn được chạy đàng hoàng.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Quy tắc vàng khi xử lý hủy Task trong AsyncIO: (1) Dùng `async with asyncio.timeout(5.0):` (Python 3.11+); (2) Đặt code dọn dẹp trong `finally:`; (3) Nếu bắt `except asyncio.CancelledError:`, LUÔN LUÔN gọi `raise` ở dòng cuối cùng.',
        relatedTermIds: ['concept-asyncio', 'kw-try-except-finally', 'kw-raise'],
      },
      {
        id: 'q-con-8',
        stageId: 'stage-5',
        level: 'master',
        question:
          '"AsyncIO chạy đơn luồng (Single-Threaded) nên KHÔNG BAO GIỜ bị lỗi Race Condition và không cần dùng Lock!" — Nhận định này ĐÚNG hay SAI khi xét đoạn code rút tiền dưới đây?',
        codeSnippet: `balance = 100\n\nasync def withdraw(amount: int) -> bool:\n    global balance\n    if balance >= amount:\n        await notify_audit_service(amount)  # Điểm nhường quyền (await point)!\n        balance -= amount\n        return True\n    return False`,
        options: [
          {
            id: 'opt-a',
            text: 'SAI HOÀN TOÀN! Dù chạy trên 1 thread, nhưng ngay tại dòng `await notify_audit_service()`, Coroutine thứ nhất tạm dừng khi chưa kịp trừ `balance`; nếu Coroutine thứ hai nhảy vào chạy lúc đó, nó vẫn thấy `balance == 100 >= 80` và cả hai cùng rút thành công làm số dư bị âm `-60`! Phải dùng `asyncio.Lock()` (hoặc khóa cấp Database `SELECT ... FOR UPDATE`) khi khoảng giữa bước Kiểm tra (Check) và bước Cập nhật (Act) có chứa điểm `await`!',
            whyRightOrWrong:
              'Chính xác! Trong AsyncIO, một đoạn code KHÔNG có `await` thì chạy nguyên tử (atomic) trên 1 thread; nhưng bất kỳ quy trình Check-Then-Act nào vắt ngang qua một hoặc nhiều điểm `await` đều có thể bị Coroutine khác xen vào giữa (Interleaving Race Condition)!',
          },
          {
            id: 'opt-b',
            text: 'ĐÚNG! Vì chỉ có 1 thread nên Coroutine thứ hai không bao giờ được chạy cho đến khi hàm `withdraw` thứ nhất `return`',
            whyRightOrWrong:
              'Sai! Bản chất của `await` chính là nhường quyền điều khiển Event Loop cho các Coroutine khác chạy trong lúc chờ I/O!',
          },
          {
            id: 'opt-c',
            text: 'Chỉ cần dùng `threading.Lock()` để khóa hàm `withdraw` lại',
            whyRightOrWrong:
              'Sai! Vì cả 2 coroutine chạy trên CÙNG 1 OS Thread, dùng `threading.Lock()` trong `async def` sẽ gây Deadlock ngay trên chính luồng Event Loop đó! Phải dùng `asyncio.Lock()`.',
          },
          {
            id: 'opt-d',
            text: 'GIL của Python tự động ngăn chặn lỗi Race Condition ở tầng logic nghiệp vụ',
            whyRightOrWrong:
              'Sai! GIL chỉ bảo vệ cấu trúc bộ nhớ nội bộ của CPython interpreter, hoàn toàn không bảo vệ logic nghiệp vụ Check-Then-Act của ứng dụng.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Trong hệ thống thực tế chạy nhiều Worker/Container: Dùng `asyncio.Lock()` nếu trạng thái nằm trong RAM của 1 tiến trình; và bắt buộc dùng **Database Row Lock** (`select(Account).where(...).with_for_update()`) hoặc Atomic Update (`UPDATE accounts SET balance = balance - :amt WHERE id = :id AND balance >= :amt`) khi trạng thái nằm trong Database!',
        relatedTermIds: ['concept-asyncio', 'kw-async', 'eco-sqlalchemy'],
      },
      {
        id: 'q-con-9',
        stageId: 'stage-5',
        level: 'master',
        question:
          'Khi sử dụng `concurrent.futures.ProcessPoolExecutor` để chạy tác vụ đa tiến trình, tại sao truyền một hàm `lambda`, một kết nối Database đang mở, hoặc một DataFrame khổng lồ 2GB làm tham số lại gây lỗi hoặc làm chậm chương trình nghiêm trọng?',
        options: [
          {
            id: 'opt-a',
            text: 'Vì các tiến trình con (Worker Processes) không chia sẻ bộ nhớ RAM trực tiếp với tiến trình cha: mọi hàm và dữ liệu truyền qua lại qua Pipe/Queue đều phải được tuần tự hóa bằng **`pickle`**! Hàm `lambda` và DB Connection không thể `pickle` được (`PicklingError`), còn copy/pickle 2GB dữ liệu qua IPC giữa các tiến trình sẽ ngốn thời gian và nhân bản RAM gấp nhiều lần!',
            whyRightOrWrong:
              'Chính xác! Đây là giới hạn vật lý của Multiprocessing: (1) Chỉ truyền hàm cấp cao nhất (`top-level def`) và dữ liệu gọn nhẹ (hoặc đường dẫn file / `multiprocessing.shared_memory`) sang tiến trình con; (2) Không bao giờ truyền đối tượng giữ socket/connection qua `ProcessPoolExecutor`.',
          },
          {
            id: 'opt-b',
            text: '`ProcessPoolExecutor` dùng chung 100% không gian bộ nhớ Heap giống hệt `ThreadPoolExecutor` nên không tốn chi phí copy',
            whyRightOrWrong:
              'Sai! `ThreadPoolExecutor` mới chia sẻ bộ nhớ trong cùng 1 tiến trình, còn `ProcessPoolExecutor` tách thành các tiến trình OS độc lập phải giao tiếp qua IPC (Inter-Process Communication / `pickle`).',
          },
          {
            id: 'opt-c',
            text: 'Hàm `lambda` chạy trong `ProcessPoolExecutor` nhanh hơn hàm `def` thông thường',
            whyRightOrWrong:
              'Sai! Module `pickle` chuẩn của Python tra cứu hàm theo tên đầy đủ cấp module (`module.func_name`). Vì `lambda` không có tên cố định ở cấp module nên sẽ ném lỗi `AttributeError: Can\'t pickle local object ...`!',
          },
          {
            id: 'opt-d',
            text: '`ProcessPoolExecutor` chỉ tạo được tối đa 2 tiến trình trên mọi máy chủ',
            whyRightOrWrong:
              'Sai! Mặc định `max_workers` bằng số nhân CPU của máy (`os.cpu_count()`).',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mẹo tối ưu `ProcessPoolExecutor`: Thay vì truyền cả khối dữ liệu lớn 500MB từ tiến trình cha sang tiến trình con, hãy chỉ truyền `file_path` hoặc `chunk_offset` để tiến trình con tự đọc trực tiếp phần của nó (hoặc dùng `multiprocessing.shared_memory`).',
        relatedTermIds: ['concept-gil', 'kw-lambda'],
      },
      {
        id: 'q-con-10',
        stageId: 'stage-5',
        level: 'master',
        question:
          'Trong hệ thống hàng đợi phân tán **Celery** (với Redis/RabbitMQ), tại sao các tác vụ quan trọng như thanh toán hoặc gửi email bắt buộc phải được thiết kế đạt tính **Idempotent** (Lũy đẳng) khi bật cấu hình `task_acks_late = True` và `autoretry_for`?',
        codeSnippet: `@celery_app.task(bind=True, acks_late=True, max_retries=3)\ndef charge_subscription(self, invoice_id: int) -> None:\n    ...`,
        options: [
          {
            id: 'opt-a',
            text: '`acks_late=True` giúp tin nhắn chỉ được xác nhận xóa khỏi Broker SAU KHI task chạy xong (tránh mất task nếu worker bị sập nguồn giữa chừng); nhưng điều này dẫn đến cơ chế **At-Least-Once Delivery**: nếu worker vừa trừ tiền xong ở bước 1 mà bị lỗi mạng ở bước 2 (trước khi kịp gửi ACK), Broker sẽ giao lại task đó lần nữa! Do đó hàm task bắt buộc phải **Idempotent** (kiểm tra trạng thái `invoice.status == "PAID"` hoặc truyền `idempotency_key` để chạy 1 lần hay 3 lần cũng chỉ trừ tiền ĐÚNG 1 LẦN)!',
            whyRightOrWrong:
              'Chính xác 100%! Trong hệ thống phân tán, không thể đạt "Exactly-Once Delivery" thuần túy ở tầng mạng; ta đạt "Exactly-Once Processing" bằng cách kết hợp **At-Least-Once Delivery (`acks_late=True`) + Idempotent Task**!',
          },
          {
            id: 'opt-b',
            text: 'Nên truyền trực tiếp cả đối tượng SQLAlchemy ORM `user_obj` vào `charge_subscription.delay(user_obj)` thay vì truyền `user_id: int`',
            whyRightOrWrong:
              'Sai lầm kinh điển khi dùng Celery! Đối tượng ORM không những không serialize được sang JSON, mà dữ liệu bên trong nó còn trở nên cũ kỹ (stale data) trong thời gian nằm chờ trong hàng đợi Redis. Luôn chỉ truyền ID nguyên thủy (`invoice_id: int`) rồi truy vấn dữ liệu mới nhất từ DB bên trong worker!',
          },
          {
            id: 'opt-c',
            text: 'Mặc định `acks_late=False` đảm bảo không bao giờ mất task ngay cả khi container Celery Worker bị OOM Killed (Out of Memory)',
            whyRightOrWrong:
              'Sai! Với `acks_late=False` (Early Ack), worker báo xóa message ngay khi vừa nhận về — nếu 1 giây sau container bị OOM Killed, task đó biến mất vĩnh viễn!',
          },
          {
            id: 'opt-d',
            text: 'Idempotent có nghĩa là task chỉ được phép chạy trong vòng dưới 1 giây',
            whyRightOrWrong:
              'Sai! Idempotency (Tính lũy đẳng) có nghĩa là thực hiện thao tác $f(x)$ một lần hay nhiều lần với cùng tham số đầu vào đều cho ra cùng một trạng thái hệ thống mà không gây tác dụng phụ trùng lặp.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          '3 nguyên tắc bất di bất dịch khi viết Celery Task: (1) Chỉ truyền tham số JSON nguyên thủy (`id: int/str`), không truyền ORM object; (2) Bật `acks_late=True` để không mất task khi crash; (3) Thiết kế mọi task có tính **Idempotent** (dùng Unique Constraint / Idempotency Key trong DB).',
        relatedTermIds: ['eco-sqlalchemy'],
      },
      {
        id: 'q-con-11',
        stageId: 'stage-5',
        level: 'master',
        question:
          'Khi triển khai ứng dụng FastAPI trên Kubernetes với **4 Pods** (mỗi Pod có 4 Uvicorn Workers = 16 tiến trình độc lập), tại sao việc dùng `asyncio.Lock()` hoặc `threading.Lock()` để chặn 2 request xử lý trùng cùng một `order_id` lại THẤT BẠI, và phải thay bằng giải pháp nào?',
        options: [
          {
            id: 'opt-a',
            text: 'Vì `asyncio.Lock()` và `threading.Lock()` chỉ có hiệu lực bên trong bộ nhớ RAM của ĐÚNG 1 tiến trình worker đơn lẻ — nếu 2 request rơi vào 2 Worker/Pod khác nhau, chúng hoàn toàn không nhìn thấy Lock của nhau! Phải sử dụng **Distributed Lock trên Redis** (`SET lock:order:123 <token> NX PX 10000`) hoặc khóa dòng cấp Database (`SELECT ... FOR UPDATE`)!',
            whyRightOrWrong:
              'Chính xác! Khi mở rộng ngang (Horizontal Scaling) ra nhiều tiến trình Uvicorn hoặc nhiều Pod K8s, mọi cơ chế khóa đồng bộ phải được đưa ra tầng chia sẻ chung (Redis hoặc PostgreSQL).',
          },
          {
            id: 'opt-b',
            text: '`asyncio.Lock()` tự động đồng bộ qua mạng LAN giữa tất cả các Pod Kubernetes',
            whyRightOrWrong:
              'Sai! `asyncio.Lock()` chỉ là một biến đối tượng trong bộ nhớ cục bộ của 1 tiến trình Python duy nhất.',
          },
          {
            id: 'opt-c',
            text: 'Khi dùng Redis Distributed Lock, không bao giờ cần đặt thời gian hết hạn TTL (`EX`/`PX`) cho khóa',
            whyRightOrWrong:
              'Sai! Nếu Pod giữ khóa bị sập nguồn (crash) trước khi kịp mở khóa mà khóa Redis không có TTL (`PX`), tài nguyên đó sẽ bị khóa chết vĩnh viễn (Deadlock toàn hệ thống)!',
          },
          {
            id: 'opt-d',
            text: 'Khi xóa khóa Redis, chỉ cần gọi `DEL lock:order:123` mà không cần kiểm tra xem ai đang giữ khóa',
            whyRightOrWrong:
              'Sai! Nếu Worker A bị treo quá TTL khiến khóa tự mở và Worker B đã lấy được khóa mới, việc Worker A tỉnh dậy và gọi `DEL` mù quáng sẽ xóa nhầm khóa của Worker B! Phải dùng Lua Script kiểm tra `value == my_unique_token` trước khi `DEL`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Khi dùng Redis làm Distributed Lock (thư viện `redis-py` `redis.lock.Lock`), nó tự động sinh `token` ngẫu nhiên (UUID), đặt TTL chống deadlock và dùng Lua script nguyên tử để chỉ chủ sở hữu có khớp `token` mới được mở khóa.',
        relatedTermIds: ['concept-asyncio', 'eco-fastapi'],
      },
      {
        id: 'q-con-12',
        stageId: 'stage-5',
        level: 'master',
        question:
          'Bản dựng **Free-Threaded CPython** (`python3.13t` / `python3.14t` theo chuẩn **PEP 703 — Making the Global Interpreter Lock Optional**) thay đổi kiến trúc thực thi đa luồng của Python như thế nào?',
        options: [
          {
            id: 'opt-a',
            text: 'Loại bỏ khóa GIL toàn cục để các luồng `threading.Thread` có thể chạy Python Bytecode song song thực sự trên nhiều nhân CPU cùng lúc (True Multi-Core Multithreading), đổi lại CPython phải sử dụng **Biased Reference Counting**, bộ cấp phát bộ nhớ `mimalloc` và các khóa mịn cấp đối tượng (per-object fine-grained locks) cho `list`/`dict`/`set`!',
            whyRightOrWrong:
              'Chính xác! PEP 703 là bước ngoặt lịch sử lớn nhất của CPython kể từ khi ra đời: cho phép các luồng chia sẻ trực tiếp bộ nhớ trong 1 tiến trình mà vẫn tận dụng toàn bộ các nhân CPU không cần `multiprocessing`!',
          },
          {
            id: 'opt-b',
            text: 'Khi tắt GIL trong PEP 703, code của người dùng không bao giờ cần dùng `threading.Lock()` nữa vì mọi chuỗi thao tác nghiệp vụ đều tự động thread-safe',
            whyRightOrWrong:
              'Sai! CPython Free-Threaded chỉ đảm bảo các cấu trúc nội bộ (`dict`, `list`) không làm sập máy ảo C (memory corruption), nhưng các thao tác mức ứng dụng của bạn (như đọc-kiểm tra-ghi qua nhiều bước) lại CÀNG DỄ bị Race Condition hơn khi chạy đa nhân thực sự nên vẫn bắt buộc phải dùng `threading.Lock()`!',
          },
          {
            id: 'opt-c',
            text: 'PEP 703 xóa bỏ hoàn toàn từ khóa `async` và `await` khỏi ngôn ngữ Python',
            whyRightOrWrong:
              'Sai! `asyncio` vẫn là lựa chọn tối ưu nhất cho hàng chục nghìn kết nối I/O mạng đồng thời vì chi phí bộ nhớ của Coroutine nhẹ hơn OS Thread rất nhiều.',
          },
          {
            id: 'opt-d',
            text: 'Mọi thư viện C-Extension cũ đều tương thích 100% với chế độ No-GIL mà không cần kiểm tra tính an toàn đa luồng',
            whyRightOrWrong:
              'Sai! Nhiều C-Extension cũ vốn ỷ lại vào việc GIL đang giữ khóa hộ; nếu nạp một C-Extension chưa khai báo hỗ trợ `Py_MOD_GIL_NOT_USED`, CPython sẽ tự động bật lại GIL lúc runtime để đảm bảo an toàn.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'PEP 703 mở ra kỷ nguyên mới cho Python trong bài toán AI Inference, Data Processing và Scientific Computing đa luồng chia sẻ bộ nhớ, trong khi `asyncio` tiếp tục thống trị mảng High-Concurrency Network I/O.',
        relatedTermIds: ['concept-gil', 'concept-asyncio'],
      },
    ],
  },
  {
    id: 'exam-ai-data-production',
    title: 'Đề 8: AI/RAG Engineering, Polars Data Pipeline & Production Architecture (Giai đoạn 6 & 7)',
    description:
      'Sát hạch đỉnh cao Giai đoạn 6 & 7: Vectorization với NumPy, Lazy Evaluation với Polars, Kiến trúc RAG & Structured LLM Output, tối ưu Multi-stage Docker với `uv`, Gunicorn + Uvicorn Workers, Profiling (`py-spy`, `memray`) và Bảo mật Production.',
    targetLevel: 'master',
    targetStage: 'stage-7',
    durationMinutes: 25,
    passingScorePercent: 80,
    questions: [
      {
        id: 'q-prod-1',
        stageId: 'stage-6',
        level: 'master',
        question:
          'Khi xử lý một file dữ liệu lớn 20GB định dạng Parquet bằng **Polars**, tại sao dùng chế độ Lazy (`pl.scan_parquet(...)` + `.collect()`) lại nhanh hơn và tốn ít RAM hơn hàng chục lần so với chế độ Eager (`pl.read_parquet(...)`) của Pandas/Polars?',
        codeSnippet: `q = (\n    pl.scan_parquet("s3://bucket/transactions_20gb.parquet")\n    .filter(pl.col("country") == "VN")\n    .select(["user_id", "amount"])\n)\ndf = q.collect()`,
        options: [
          {
            id: 'opt-a',
            text: 'Vì `scan_parquet()` chưa đọc dữ liệu ngay mà xây dựng một Cây Kế Hoạch Truy Vấn (Query Plan) để bộ tối ưu hóa thực hiện **Predicate Pushdown** (chỉ đọc các khối dữ liệu thỏa `country == "VN"`) và **Projection Pushdown** (chỉ nạp đúng 2 cột `user_id`, `amount` từ đĩa thay vì toàn bộ 100 cột) trước khi thực thi đa luồng bằng Rust tại bước `.collect()`!',
            whyRightOrWrong:
              'Chính xác 100%! Nếu dùng `read_parquet()`, máy chủ sẽ cố nạp toàn bộ 20GB (100 cột, mọi quốc gia) vào RAM ngay lập tức gây lỗi tràn bộ nhớ `OOM (Out Of Memory)` trước khi kịp lọc!',
          },
          {
            id: 'opt-b',
            text: '`scan_parquet()` chỉ đọc 10 dòng đầu tiên của file nên mới nhanh hơn',
            whyRightOrWrong:
              'Sai! Khi gọi `.collect()`, nó trả về đầy đủ 100% các dòng khớp điều kiện trong toàn bộ file 20GB, nhưng bỏ qua việc đọc các cột và các row-group không cần thiết nhờ metadata của Parquet.',
          },
          {
            id: 'opt-c',
            text: 'Định dạng file `.csv` hỗ trợ Projection Pushdown (chỉ đọc 2 cột mà không cần quét các cột khác) tốt hơn `.parquet`',
            whyRightOrWrong:
              'Sai! CSV lưu theo từng dòng (row-oriented text) nên phải quét qua mọi ký tự trên dòng; còn **Parquet** lưu theo cột (Columnar Binary Format) kèm thống kê min/max từng khối nên sinh ra để tối ưu hóa cho Polars/DuckDB!',
          },
          {
            id: 'opt-d',
            text: 'Trong Polars, phải dùng vòng lặp `for row in df.iter_rows():` để tính toán mới đạt tốc độ nhanh nhất',
            whyRightOrWrong:
              'Sai! Lặp từng dòng trong Python phá hủy hoàn toàn sức mạnh Vectorization + SIMD của lõi Rust trong Polars.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Bộ đôi vàng trong Data Engineering hiện đại với Python: Lưu trữ bằng **Apache Parquet** (hoặc Iceberg/Delta) + Xử lý bằng **Polars Lazy API (`scan_parquet` -> biểu thức `pl.col()` -> `collect(streaming=True)`)**.',
        relatedTermIds: ['eco-polars', 'eco-pandas'],
      },
      {
        id: 'q-prod-2',
        stageId: 'stage-6',
        level: 'master',
        question:
          'Tại sao phép tính Vectorization trên mảng **NumPy** (`prices * 1.1`) lại nhanh gấp 50–100 lần so với vòng lặp `for` thuần Python hoặc `df.iterrows()` trên 10 triệu phần tử?',
        codeSnippet: `import numpy as np\narr = np.ones(10_000_000, dtype=np.float64)\nres = arr * 1.1`,
        options: [
          {
            id: 'opt-a',
            text: 'Vì `list` của Python lưu mảng các con trỏ trỏ tới 10 triệu đối tượng `PyObject` nằm rải rác trên Heap (tốn chi phí mở hộp `unboxing`, kiểm tra kiểu và tra cứu hàm `__mul__` lặp lại 10 triệu lần); trong khi `ndarray` của NumPy là một khối bộ nhớ C liên tục (Contiguous C Array) đồng nhất kiểu `float64`, cho phép CPU xử lý hàng loạt bằng tập lệnh **SIMD** cấp phần cứng mà không tốn vòng lặp Bytecode Python!',
            whyRightOrWrong:
              'Chính xác! Sự kết hợp giữa **Spatial Locality** (bộ nhớ liên tục giúp tối ưu CPU L1/L2 Cache), không tốn overhead `PyObject` boxing, và tập lệnh vector **SIMD** (AVX-2/AVX-512/NEON) giúp NumPy/Polars đạt tốc độ tiệm cận C thuần.',
          },
          {
            id: 'opt-b',
            text: 'Vì NumPy tự động đẩy mọi phép nhân mảng sang chạy trên Card đồ họa (GPU CUDA)',
            whyRightOrWrong:
              'Sai! `NumPy` chuẩn chạy hoàn toàn trên CPU (chỉ `PyTorch`/`CuPy`/`JAX` mới chạy trên GPU). Dù chỉ trên CPU, nhờ C + SIMD + Contiguous Memory mà nó đã nhanh gấp hàng chục lần vòng lặp Python.',
          },
          {
            id: 'opt-c',
            text: 'Một mảng `np.ndarray` có thể chứa lẫn lộn cả số, chuỗi và dict trong cùng một vùng nhớ `float64` mà không tốn thêm RAM',
            whyRightOrWrong:
              'Sai! Nếu nhét kiểu hỗn hợp vào NumPy, nó sẽ bị thoái hóa về `dtype=object` (lại trở thành mảng con trỏ `PyObject` và mất sạch tốc độ Vectorization!).',
          },
          {
            id: 'opt-d',
            text: 'Hàm `df.iterrows()` trong Pandas cũng sử dụng SIMD nên nhanh ngang `arr * 1.1`',
            whyRightOrWrong:
              'Sai! `df.iterrows()` là anti-pattern chậm nhất trong Pandas vì ở mỗi dòng nó phải khởi tạo một đối tượng `pd.Series` mới trong Python.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Quy tắc số 1 trong Khoa học Dữ liệu Python: Khi thấy mình đang viết vòng lặp `for` duyệt qua từng dòng của DataFrame/Array để tính toán số học, hãy dừng lại ngay và viết lại bằng biểu thức **Vectorized** (`np.where`, `pl.when().then()`, broadcasting)!',
        relatedTermIds: ['eco-numpy', 'eco-pandas', 'eco-polars'],
      },
      {
        id: 'q-prod-3',
        stageId: 'stage-6',
        level: 'master',
        question:
          'Trong kiến trúc hệ thống **RAG (Retrieval-Augmented Generation)** thực tế, tại sao khi cắt tài liệu dài thành các đoạn nhỏ (Chunking) để tạo Vector Embedding, ta luôn phải cấu hình khoảng gối đầu (**Chunk Overlap**, ví dụ `chunk_size=512, chunk_overlap=64`) và tách theo cấu trúc ngữ nghĩa (Recursive Character / Markdown Header)?',
        options: [
          {
            id: 'opt-a',
            text: 'Nếu cắt cứng theo độ dài mà `chunk_overlap = 0`, một câu quan trọng nằm ngay ranh giới vết cắt sẽ bị chặt làm đôi (ví dụ: chủ ngữ "Thuốc X không được dùng cho..." nằm ở cuối Chunk 1, còn vị ngữ "...phụ nữ mang thai" nằm ở đầu Chunk 2), làm mất ngữ cảnh khiến Vector Embedding sai lệch và LLM trả lời nguy hiểm! `chunk_overlap` giữ lại phần giao thoa giữa 2 chunk liên tiếp để bảo toàn trọn vẹn ý nghĩa tại vết cắt.',
            whyRightOrWrong:
              'Chính xác! Chất lượng của hệ thống RAG phụ thuộc 80% vào chất lượng khâu Chunking + Retrieval ("Garbage In, Garbage Out").',
          },
          {
            id: 'opt-b',
            text: 'Nên truyền nguyên vẹn cuốn sách 500 trang thành 1 Vector Embedding duy nhất để không bao giờ bị đứt câu',
            whyRightOrWrong:
              'Sai! Nhồi cả cuốn sách vào 1 vector duy nhất sẽ làm "loãng ngữ nghĩa" (semantic dilution) khiến phép đo Cosine Similarity không thể tìm ra đoạn chi tiết cụ thể, đồng thời vượt quá giới hạn token của Embedding Model.',
          },
          {
            id: 'opt-c',
            text: 'Có thể trộn lẫn Vector Embedding sinh bởi mô hình `text-embedding-3-small` (1536 chiều) với câu truy vấn sinh bởi mô hình `bge-m3` (1024 chiều) để tính Cosine Similarity trực tiếp',
            whyRightOrWrong:
              'Sai! Không gian vector của hai mô hình Embedding khác nhau là hoàn toàn độc lập (và khác cả số chiều). Mọi tài liệu trong Vector DB và câu truy vấn của người dùng BẮT BUỘC phải dùng chung một Embedding Model!',
          },
          {
            id: 'opt-d',
            text: '`chunk_overlap` càng lớn bằng đúng `chunk_size` thì hệ thống càng tốt',
            whyRightOrWrong:
              'Sai! `chunk_overlap` thường chỉ đặt khoảng 10%–20% của `chunk_size`. Nếu đặt quá lớn sẽ gây trùng lặp dữ liệu hàng loạt trong kết quả Top-K检索.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Để hệ thống RAG đạt độ chính xác cấp Production, hãy kết hợp **Semantic/Recursive Chunking có Overlap** + **Hybrid Search** (kết hợp Vector Search ngữ nghĩa với BM25 Keyword Search cho mã sản phẩm/tên riêng) + **Reranker**.',
        relatedTermIds: ['eco-numpy'],
      },
      {
        id: 'q-prod-4',
        stageId: 'stage-6',
        level: 'master',
        question:
          'Khi tích hợp LLM (OpenAI / Gemini / Anthropic) vào Backend Python để trích xuất dữ liệu có cấu trúc (ví dụ: phân tích CV thành JSON lưu vào DB), tại sao phải dùng tính năng **Structured Outputs với Pydantic Schema** thay vì chỉ dặn trong prompt `"Hãy trả về JSON và đừng nói thêm lời nào khác"`?',
        codeSnippet: `class ResumeInfo(BaseModel):\n    full_name: str\n    years_of_experience: int\n    skills: list[str]\n\n# Truyền trực tiếp class ResumeInfo vào response_format / response_schema của LLM SDK`,
        options: [
          {
            id: 'opt-a',
            text: 'Vì nếu chỉ dặn bằng lời trong prompt, LLM vẫn thường xuyên bọc kết quả trong markdown ````json ... ````, thêm lời chào hỏi, thiếu dấu ngoặc hoặc trả sai kiểu dữ liệu làm nổ lỗi `json.loads()`; trong khi **Structured Outputs** dùng thuật toán **Constrained Decoding (FSM / Context-Free Grammar)** ép xác suất sinh token của LLM ở tầng động cơ suy luận phải tuân thủ 100% JSON Schema sinh từ Pydantic `ResumeInfo`!',
            whyRightOrWrong:
              'Chính xác! Khi truyền trực tiếp class Pydantic `ResumeInfo` vào SDK của OpenAI/Gemini (hoặc thư viện `instructor` / `PydanticAI`), kết quả trả về được đảm bảo đúng định dạng và parse thẳng thành đối tượng `ResumeInfo` an toàn kiểu.',
          },
          {
            id: 'opt-b',
            text: 'Chỉ cần dùng `eval(llm_response_text)` của Python để chuyển văn bản của LLM thành `dict` cho nhanh',
            whyRightOrWrong:
              'Cực kỳ nguy hiểm! Dùng `eval()` trên chuỗi văn bản sinh ra từ LLM hoặc người dùng sẽ mở toang lỗ hổng **Remote Code Execution (RCE)** nếu có chứa mã độc `__import__("os").system(...)`!',
          },
          {
            id: 'opt-c',
            text: 'Pydantic không có phương thức nào để xuất ra JSON Schema cho LLM hiểu',
            whyRightOrWrong:
              'Sai! Pydantic v2 có phương thức tích hợp cực mạnh `ResumeInfo.model_json_schema()` và `ResumeInfo.model_validate_json(raw_json)` chính là xương sống của toàn bộ các LLM SDK hiện nay.',
          },
          {
            id: 'opt-d',
            text: 'Structured Outputs làm LLM mất khả năng đọc hiểu tiếng Việt',
            whyRightOrWrong:
              'Sai! Nó chỉ ràng buộc cấu trúc khung JSON đầu ra, còn nội dung chuỗi tiếng Việt bên trong các trường vẫn được sinh bình thường.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Sự kết hợp giữa **Pydantic v2 (`BaseModel`)** và **Structured Outputs** đã biến LLM từ một công cụ chat tự do thành một hàm phần mềm đáng tin cậy (`def extract_resume(text: str) -> ResumeInfo:`).',
        relatedTermIds: ['eco-pydantic', 'concept-type-hints'],
      },
      {
        id: 'q-prod-5',
        stageId: 'stage-7',
        level: 'master',
        question:
          'Khi viết `Dockerfile` Multi-stage cho ứng dụng Python với `uv`, tại sao thứ tự copy file chuẩn mực lại là: **`COPY pyproject.toml uv.lock ./` -> Chạy `uv sync --locked --no-install-project --no-dev` -> Sau đó mới `COPY src/ ./src/`**?',
        codeSnippet: `ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy\nWORKDIR /app\nCOPY pyproject.toml uv.lock ./\nRUN uv sync --locked --no-install-project --no-dev\nCOPY src/ ./src/\nRUN uv sync --locked --no-dev`,
        options: [
          {
            id: 'opt-a',
            text: 'Để tận dụng tối đa cơ chế **Docker Layer Caching**: vì mã nguồn trong `src/` thay đổi liên tục mỗi ngày còn `pyproject.toml` + `uv.lock` rất ít khi đổi, việc cài đặt toàn bộ thư viện bên thứ 3 ở tầng (layer) TRƯỚC lệnh `COPY src/` giúp các lần `docker build` sau bỏ qua bước tải/cài thư viện và hoàn tất chỉ trong vài giây! Đồng thời `UV_COMPILE_BYTECODE=1` biên dịch sẵn `.pyc` giúp giảm thời gian Cold Start khi container khởi chạy!',
            whyRightOrWrong:
              'Chính xác 100%! Nếu bạn viết `COPY . .` ngay từ đầu rồi mới chạy `uv sync`, thì chỉ cần sửa 1 dấu chấm phẩy trong code `src/` cũng làm vỡ cache (cache invalidation) và bắt Docker tải lại hàng trăm MB thư viện từ đầu!',
          },
          {
            id: 'opt-b',
            text: 'Nên chạy container ở quyền `root` mặc định và cài kèm `gcc`, `git`, `curl` trong image cuối cùng để tiện sửa code trực tiếp trên Production',
            whyRightOrWrong:
              'Sai! Image cuối cùng của Multi-stage build phải là bản `python:3.12-slim` tối giản, không chứa trình biên dịch `gcc` thừa, và BẮT BUỘC chuyển sang chạy dưới quyền non-root (`USER appuser`) để bảo mật.',
          },
          {
            id: 'opt-c',
            text: 'Biến môi trường `UV_COMPILE_BYTECODE=1` làm container khởi động chậm hơn vì phải xóa file `.pyc`',
            whyRightOrWrong:
              'Sai! Ngược lại: `UV_COMPILE_BYTECODE=1` tạo sẵn các file `.pyc` ngay trong lúc `docker build`, giúp container lúc khởi động (`docker run` / K8s scale-up) không mất thời gian biên dịch lại các thư viện lớn như `fastapi`, `sqlalchemy`, `pydantic`.',
          },
          {
            id: 'opt-d',
            text: 'Thứ tự các câu lệnh `COPY` trong `Dockerfile` không ảnh hưởng gì đến tốc độ build',
            whyRightOrWrong:
              'Sai! Docker cache từng layer theo thứ tự từ trên xuống dưới; một khi 1 layer bị thay đổi, toàn bộ các layer nằm bên dưới nó đều phải chạy lại.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          '3 biến môi trường vàng khi đóng gói Docker với `uv` và Python: `UV_COMPILE_BYTECODE=1` (khởi động nhanh), `PYTHONUNBUFFERED=1` (xuất log realtime ra stdout không bị nghẽn buffer), và chạy dưới quyền `USER nonroot`.',
        relatedTermIds: ['eco-uv', 'eco-fastapi'],
      },
      {
        id: 'q-prod-6',
        stageId: 'stage-7',
        level: 'master',
        question:
          'Khi triển khai ứng dụng FastAPI trên một máy chủ VM truyền thống có **4 nhân CPU** (không dùng Kubernetes), kiến trúc Process Manager nào dưới đây kết hợp được cả sự đa nhân (vượt qua GIL) lẫn sự bất đồng bộ (Event Loop)?',
        codeSnippet: `gunicorn app.main:app \\\n    --workers 9 \\\n    --worker-class uvicorn.workers.UvicornWorker \\\n    --bind 0.0.0.0:8000 \\\n    --graceful-timeout 30`,
        options: [
          {
            id: 'opt-a',
            text: 'Dùng **Gunicorn** làm Master Process quản lý nhiều tiến trình con **UvicornWorker** (hoặc `uvicorn --workers N`): mỗi Worker là 1 tiến trình hệ điều hành độc lập (có GIL riêng, chạy trên các nhân CPU khác nhau) và bên trong mỗi Worker lại chạy 1 AsyncIO Event Loop xử lý hàng nghìn kết nối I/O đồng thời! (Lưu ý trên Kubernetes, ta thường chạy `1 Uvicorn process / 1 Pod` và để K8s HPA nhân bản số lượng Pod).',
            whyRightOrWrong:
              'Chính xác! Trên máy chủ Bare-metal/VM đơn lẻ, ta dùng công thức kinh điển của Gunicorn `(2 * CPU_CORES) + 1` workers (hoặc bằng số nhân CPU đối với thuần async) để tận dụng hết đa nhân và tự động khởi động lại worker nếu có tiến trình bị crash.',
          },
          {
            id: 'opt-b',
            text: 'Chỉ chạy duy nhất 1 tiến trình `uvicorn app.main:app` không có `--workers` trên máy chủ 32 nhân CPU là đã tự động dùng hết cả 32 nhân',
            whyRightOrWrong:
              'Sai! Một tiến trình Uvicorn đơn lẻ chỉ chạy Event Loop trên 1 nhân CPU duy nhất — 31 nhân CPU còn lại của máy chủ sẽ ngồi chơi hoàn toàn!',
          },
          {
            id: 'opt-c',
            text: 'Dùng Gunicorn với worker mặc định `SyncWorker` (WSGI) để chạy ứng dụng bất đồng bộ FastAPI (ASGI)',
            whyRightOrWrong:
              'Sai! FastAPI được xây trên chuẩn **ASGI** (Asynchronous Server Gateway Interface), nên nếu chạy bằng Gunicorn thì BẮT BUỘC phải chỉ định `--worker-class uvicorn.workers.UvicornWorker`!',
          },
          {
            id: 'opt-d',
            text: 'Khi chạy nhiều Uvicorn Workers, các biến toàn cục (Global Variables) trong code Python sẽ tự động được đồng bộ giá trị giữa tất cả các Workers',
            whyRightOrWrong:
              'Sai lầm cực kỳ phổ biến! Mỗi Worker là một tiến trình OS có vùng RAM hoàn toàn tách biệt — nếu bạn lưu cache hoặc biến đếm vào một biến `dict` toàn cục trong Python, mỗi Worker sẽ có một bản sao riêng lệch nhau hoàn toàn!',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Nhớ kỹ 2 mô hình triển khai: (1) Trên **VM/Bare-metal**: `Gunicorn + N UvicornWorkers` (đa tiến trình trên 1 máy); (2) Trên **Kubernetes**: `1 Uvicorn Worker mỗi Container/Pod` và dùng K8s ReplicaSet / HorizontalPodAutoscaler để điều phối số lượng Pod.',
        relatedTermIds: ['eco-fastapi', 'concept-gil', 'concept-asyncio'],
      },
      {
        id: 'q-prod-7',
        stageId: 'stage-7',
        level: 'master',
        question:
          'Trong FastAPI hiện đại, tại sao ta dùng hàm `lifespan` với `@asynccontextmanager` để khởi tạo và đóng Database Engine / HTTP Client / ML Model thay vì tạo mới kết nối ở mỗi request hoặc dùng `@app.on_event("startup")` cũ?',
        codeSnippet: `@asynccontextmanager\nasync def lifespan(app: FastAPI):\n    # Khởi tạo tài nguyên dùng chung 1 lần lúc Startup:\n    app.state.http_client = httpx.AsyncClient(timeout=10.0)\n    yield\n    # Giải phóng tài nguyên sạch sẽ lúc Shutdown (khi nhận SIGTERM):\n    await app.state.http_client.aclose()\n\napp = FastAPI(lifespan=lifespan)`,
        options: [
          {
            id: 'opt-a',
            text: '`@app.on_event("startup"/"shutdown")` đã bị khai tử (deprecated). Dùng `lifespan` với `yield` gói trọn cả phần khởi tạo (trước `yield`) và dọn dẹp (sau `yield`) trong cùng một ngữ cảnh an toàn: việc tạo 1 `httpx.AsyncClient` dùng chung trong `lifespan` giúp tái sử dụng **TCP/TLS Connection Pool** (Keep-Alive), nhanh hơn gấp nhiều lần và tránh lỗi cạn kiệt cổng mạng (`Port Exhaustion`) so với việc mở `async with httpx.AsyncClient()` mới ở từng request!',
            whyRightOrWrong:
              'Chính xác! Nếu mỗi request đến API của bạn lại khởi tạo một `httpx.AsyncClient()` mới hoặc `create_async_engine()` mới, server sẽ phải bắt tay TCP + TLS (3-way handshake) lại từ đầu cho mọi request và nhanh chóng làm nổ tung giới hạn socket của hệ điều hành!',
          },
          {
            id: 'opt-b',
            text: 'Nên gọi `create_async_engine(DATABASE_URL)` bên trong hàm xử lý của từng HTTP request để đảm bảo kết nối mới nhất',
            whyRightOrWrong:
              'Sai lầm chí mạng! `AsyncEngine` chứa toàn bộ Connection Pool của Database nên chỉ được khởi tạo ĐÚNG 1 LẦN cho toàn bộ vòng đời ứng dụng (và gọi `await engine.dispose()` ở phần sau `yield` của `lifespan`).',
          },
          {
            id: 'opt-c',
            text: 'Code nằm sau từ khóa `yield` trong hàm `lifespan` sẽ chạy sau mỗi HTTP request',
            whyRightOrWrong:
              'Sai! `lifespan` gắn với vòng đời của cả ứng dụng `FastAPI`: phần trước `yield` chạy 1 lần khi server bật lên, và phần sau `yield` chạy 1 lần khi server nhận tín hiệu tắt (`SIGTERM` / `SIGINT` Graceful Shutdown).',
          },
          {
            id: 'opt-d',
            text: '`lifespan` không cho phép dùng từ khóa `await` bên trong nó',
            whyRightOrWrong:
              'Sai! `lifespan` là một `@asynccontextmanager` (`async def`), sinh ra chính là để chạy các lệnh khởi tạo và đóng kết nối bất đồng bộ `await`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Luôn khởi tạo các tài nguyên nặng (DB Engine Connection Pool, Redis Pool, `httpx.AsyncClient`, mô hình AI/Embedding) trong `lifespan` lúc Startup, và đóng chúng một cách duyên dáng (Graceful Shutdown) ở phần sau `yield`.',
        relatedTermIds: ['eco-fastapi', 'concept-context-manager', 'kw-yield'],
      },
      {
        id: 'q-prod-8',
        stageId: 'stage-7',
        level: 'master',
        question:
          'Một tiến trình Python trên Production đột nhiên ăn 100% CPU hoặc bị rò rỉ bộ nhớ (Memory Leak) tăng dần lên 16GB. Công cụ Profiling chuyên dụng nào cho phép bạn chẩn đoán trực tiếp mà KHÔNG làm sập hay làm chậm hệ thống?',
        options: [
          {
            id: 'opt-a',
            text: 'Dùng **`py-spy`** (`py-spy top --pid <PID>` hoặc xuất biểu đồ lửa **Flamegraph** SVG) để lấy mẫu CPU bên ngoài tiến trình với overhead gần bằng 0 mà không cần sửa code hay khởi động lại server; và dùng **`memray`** (của Bloomberg) hoặc `tracemalloc` để truy vết chính xác dòng code Python hay C-extension nào đang cấp phát bộ nhớ không giải phóng!',
            whyRightOrWrong:
              'Chính xác! `py-spy` (viết bằng Rust) đọc trực tiếp bộ nhớ của tiến trình Python theo cơ chế Sampling Profiler nên hoàn toàn an toàn để gắn vào một PID đang chạy trực tiếp trên Production (`py-spy record -o profile.svg --pid 12345`).',
          },
          {
            id: 'opt-b',
            text: 'Trong Python có Garbage Collector tự động nên KHÔNG BAO GIỜ có thể xảy ra hiện tượng rò rỉ bộ nhớ (Memory Leak)',
            whyRightOrWrong:
              'Sai! Memory Leak trong Python xảy ra rất thường xuyên khi bạn vô tình tích trữ đối tượng vào một `list`/`dict` toàn cục (unbounded cache không có giới hạn `maxsize`), quên đóng tài nguyên, hoặc giữ tham chiếu trong Closure/Callback.',
          },
          {
            id: 'opt-c',
            text: 'Khi dùng `@functools.lru_cache(maxsize=None)` trên một hàm nhận tham số là `request_id` ngẫu nhiên của người dùng, bộ nhớ RAM vẫn hoàn toàn ổn định',
            whyRightOrWrong:
              'Sai! Dùng `@lru_cache(maxsize=None)` (hoặc `@functools.cache`) với tham số đầu vào luôn thay đổi không giới hạn chính là nguyên nhân số 1 gây tràn RAM (OOM) trên Production vì bảng từ điển cache chỉ phình to ra mà không bao giờ xóa bớt!',
          },
          {
            id: 'opt-d',
            text: 'Cách duy nhất để biết hàm nào chậm là chèn `print(time.time())` vào đầu và cuối của tất cả 5.000 hàm trong dự án',
            whyRightOrWrong:
              'Sai! Một bức ảnh Flamegraph từ `py-spy` hoặc `cProfile` sẽ chỉ ra ngay lập tức hàm nào đang chiếm 90% thời gian CPU chỉ trong 10 giây.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Bộ công cụ Chẩn đoán Hiệu năng của Kỹ sư Python Master: **`py-spy`** (Sampling CPU Profiler cho Production, hỗ trợ xuất Flamegraph) + **`memray`** (Memory Profiler tìm rò rỉ RAM của cả Python lẫn C-extensions).',
        relatedTermIds: ['concept-decorator'],
      },
      {
        id: 'q-prod-9',
        stageId: 'stage-7',
        level: 'master',
        question:
          'Hiện tượng **Cache Stampede (Thundering Herd)** xảy ra như thế nào trên hệ thống có lưu lượng truy cập lớn, và làm sao để phòng chống hiệu quả?',
        options: [
          {
            id: 'opt-a',
            text: 'Khi một khóa Redis Cache cực nóng (ví dụ: danh sách Flash Sale ở trang chủ, mất 3 giây để tính từ DB) vừa hết hạn TTL đúng lúc có **5.000 người dùng** truy cập cùng một mili-giây: cả 5.000 request cùng thấy Cache Miss và ĐỒNG LOẠT lao thẳng xuống chạy cùng một câu query nặng trên PostgreSQL làm sập chết Database ngay lập tức! Phòng chống bằng **Singleflight / Distributed Lock** (chỉ cho 1 request xuống DB tính lại, 4.999 request kia chờ kết quả), kết hợp **Probabilistic Early Expiration (Jitter TTL)** hoặc **Stale-While-Revalidate**!',
            whyRightOrWrong:
              'Chính xác 100%! Bên cạnh việc dùng Lock khi rebuild cache, việc cộng thêm một khoảng ngẫu nhiên (Random Jitter, ví dụ `ttl = 300 + random.randint(0, 60)`) khi lưu hàng loạt key vào Redis giúp ngăn chặn hàng nghìn key cùng hết hạn vào đúng 1 giây.',
          },
          {
            id: 'opt-b',
            text: 'Cache Stampede chỉ xảy ra khi dung lượng ổ cứng của máy chủ Redis bị đầy',
            whyRightOrWrong:
              'Sai! Nó xảy ra ngay khi một hot key vừa hết hạn TTL (hoặc khi Redis vừa khởi động lại trống trơn) dưới tải đồng thời cao.',
          },
          {
            id: 'opt-c',
            text: 'Để chống Cache Stampede, ta nên đặt cùng một thời gian hết hạn cố định `ttl = 3600` giây cho tất cả 10.000 sản phẩm được nạp cùng lúc',
            whyRightOrWrong:
              'Sai! Đặt cùng một TTL cố định cho 10.000 khóa được tạo cùng lúc sẽ gây ra hiện tượng **Cache Avalanche** (tất cả 10.000 khóa đồng loạt bốc hơi đúng sau 1 tiếng, đánh sập DB!). Phải cộng thêm Random Jitter vào TTL.',
          },
          {
            id: 'opt-d',
            text: 'Không bao giờ đặt TTL cho bất kỳ khóa nào trong Redis',
            whyRightOrWrong:
              'Sai! Không đặt TTL sẽ làm tràn bộ nhớ Redis và giữ dữ liệu cũ kỹ vĩnh viễn.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Ba lá chắn bảo vệ tầng Cache trên Production: (1) **Random Jitter trên TTL** (tránh hết hạn đồng loạt); (2) **Mutex Lock / Singleflight** khi Cache Miss trên hot key; (3) **Cache Null Value** với TTL ngắn (ví dụ 30 giây) khi ID không tồn tại trong DB để chống tấn công **Cache Penetration**.',
        relatedTermIds: ['concept-asyncio', 'eco-fastapi'],
      },
      {
        id: 'q-prod-10',
        stageId: 'stage-7',
        level: 'master',
        question:
          'Khi kiểm tra chữ ký Webhook (HMAC-SHA256) hoặc API Key bí mật trong Python, tại sao bạn BẮT BUỘC phải dùng `secrets.compare_digest(a, b)` thay vì toán tử `a == b`, và làm thế nào để chống **SQL Injection** tuyệt đối khi bắt buộc phải viết câu lệnh SQL thô (`text()`) trong SQLAlchemy?',
        codeSnippet: `import secrets\nfrom sqlalchemy import text\n\n# 1. So sánh chữ ký bảo mật:\nis_valid = secrets.compare_digest(received_sig, expected_sig)\n\n# 2. Truy vấn SQL thô có tham số:\nstmt = text("SELECT * FROM users WHERE email = :email").bindparams(email=user_input)`,
        options: [
          {
            id: 'opt-a',
            text: 'Toán tử `a == b` dừng ngay ở ký tự khác nhau đầu tiên (Short-circuit evaluation), cho phép hacker đo độ trễ phản hồi (Timing Attack) để đoán dần từng ký tự của mã bí mật; còn `secrets.compare_digest(a, b)` so sánh trong **thời gian hằng số (Constant-Time)**! Và với SQL thô, tuyệt đối cấm dùng f-string `text(f"... {user_input}")` mà phải dùng **Bound Parameters** (`:email` kèm truyền tham số tách biệt) để Database xử lý `user_input` thuần túy như dữ liệu chứ không bao giờ thực thi như lệnh SQL!',
            whyRightOrWrong:
              'Chính xác tuyệt đối! Đây là hai chuẩn mực bảo mật OWASP sống còn mà mọi kỹ sư Backend Python cấp độ Pro/Master đều phải tuân thủ nghiêm ngặt.',
          },
          {
            id: 'opt-b',
            text: 'Hàm `random.choice()` trong module `random` chuẩn là đủ an toàn để sinh mã OTP và Reset Password Token',
            whyRightOrWrong:
              'Sai! Module `random` dùng thuật toán Mersenne Twister (PRNG) hoàn toàn có thể dự đoán được trạng thái tiếp theo nếu biết các kết quả trước đó! Để sinh OTP, API Key, hay Token bảo mật, BẮT BUỘC phải dùng module **`secrets`** (`secrets.token_urlsafe(32)`, `secrets.SystemRandom()`).',
          },
          {
            id: 'opt-c',
            text: 'Chỉ cần bọc chuỗi f-string vào bên trong hàm `sqlalchemy.text(f"SELECT * FROM users WHERE email = \'{user_input}\'")` là SQLAlchemy sẽ tự động lọc sạch SQL Injection',
            whyRightOrWrong:
              'Sai lầm chết người! Khi bạn dùng f-string `f"..."`, Python đã nối chuỗi mã độc (như `\' OR 1=1 --`) vào xong xuôi TRƯỚC KHI hàm `text()` kịp nhìn thấy chuỗi đó! Hàm `text()` hoàn toàn không thể cứu được nếu bạn tự nối chuỗi bằng f-string.',
          },
          {
            id: 'opt-d',
            text: '`secrets.compare_digest(a, b)` chạy nhanh gấp 10 lần `a == b` nên được dùng để tối ưu tốc độ',
            whyRightOrWrong:
              'Sai! Mục đích của `secrets.compare_digest(a, b)` không phải là chạy nhanh hơn, mà là chạy trong **thời gian không đổi** (không phụ thuộc vào việc ký tự đầu tiên hay ký tự cuối cùng bị sai) để triệt tiêu lỗ hổng Timing Side-Channel Attack.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Checklist Bảo mật Python Production: (1) Không bao giờ dùng f-string để ghép câu lệnh SQL (luôn dùng ORM hoặc `:param` bound parameters); (2) Dùng module `secrets` thay vì `random` cho mọi token/OTP; (3) Dùng `secrets.compare_digest()` khi so sánh chữ ký HMAC/API key; (4) Không bao giờ dùng `eval()`, `exec()`, hay `pickle.loads()` trên dữ liệu từ người dùng!',
        relatedTermIds: ['eco-sqlalchemy', 'type-str', 'dunder-eq'],
      },
    ],
  },
];


import { ExamQuestion, ExamSet } from '../../types/assessment.types';
import { SkillLevel, StageId } from '../../types/curriculum.types';

function q(
  id: string,
  stageId: StageId,
  level: SkillLevel,
  category: string,
  tags: string[],
  question: string,
  codeSnippet: string | undefined,
  options: [string, string, string, string],
  why: [string, string, string, string],
  correctIdx: 0 | 1 | 2 | 3,
  overallExplanation: string,
  analogyReminder: string,
  relatedTermIds: string[] = []
): ExamQuestion {
  const ids = ['a', 'b', 'c', 'd'] as const;
  return {
    id,
    stageId,
    level,
    category,
    tags,
    question,
    ...(codeSnippet ? { codeSnippet } : {}),
    options: [0, 1, 2, 3].map((i) => ({
      id: ids[i],
      text: options[i],
      whyRightOrWrong: why[i],
    })),
    correctOptionId: ids[correctIdx],
    overallExplanation,
    analogyReminder,
    relatedTermIds,
  };
}

const CAT_ADV_1 = 'Kiểm thử (Pytest), Decorators, Generators & Context Managers';
const TAGS_ADV_1 = [
  'pytest',
  'decorators',
  'generators',
  'yield',
  'contextlib',
  'dataclasses',
  'packaging',
  'wheel',
];

const SET_1_QUESTIONS: ExamQuestion[] = [
  q(
    'ex-q-381',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Trong `pytest`, sự khác biệt cốt lõi giữa `@pytest.fixture(scope="function")` (mặc định) và `@pytest.fixture(scope="module")` hoặc `scope="session"` là gì?',
    `@pytest.fixture(scope="module")
def db_conn():
    conn = connect_db()
    yield conn
    conn.close()`,
    [
      '`scope="function"` khởi tạo và dọn dẹp fixture mới cho mỗi hàm test riêng biệt; `scope="module"` chỉ khởi tạo 1 lần duy nhất cho toàn bộ file test đó và đóng lại khi tất cả test trong file chạy xong.',
      '`scope="module"` tự động chạy các hàm test song song trên nhiều tiến trình CPU.',
      '`scope="function"` không cho phép sử dụng từ khóa `yield` để teardown.',
      '`scope="session"` tạo lại fixture trước mỗi class test trong dự án.',
    ],
    [
      'Chính xác! Scope quyết định vòng đời (lifecycle) tái sử dụng của fixture: `function` (mỗi test), `class`, `module` (mỗi file `.py`), `package`, hoặc `session` (toàn bộ lần chạy pytest).',
      'Sai. Fixture scope không bật chạy song song đa tiến trình (việc đó của plugin `pytest-xdist`).',
      'Sai. Mọi scope trong pytest đều hỗ trợ `yield` để phân tách phần setup và teardown.',
      'Sai. `session` chỉ khởi tạo 1 lần cho toàn bộ phiên chạy pytest, còn mỗi class là `scope="class"`.',
    ],
    0,
    'Chọn đúng `scope` giúp cân bằng giữa tính cô lập dữ liệu test (`function`) và tốc độ chạy test khi khởi tạo tài nguyên nặng như Docker container hay DB connection (`module`/`session`).',
    'Giống như `beforeEach`/`afterEach` (`scope="function"`) so với `beforeAll`/`afterAll` (`scope="module"`) trong Jest/Vitest.',
    ['pytest-fixture']
  ),
  q(
    'ex-q-382',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Điều gì xảy ra với phần code nằm sau câu lệnh `yield` trong một `pytest` fixture nếu hàm test sử dụng fixture đó bị lỗi (`AssertionError` hoặc ném ngoại lệ)?',
    `@pytest.fixture
def temp_resource():
    res = acquire()
    yield res
    release(res)  # Dòng này có chạy không khi test fail?`,
    [
      'Phần code sau `yield` bị bỏ qua hoàn toàn vì ngoại lệ làm ngắt luồng chạy.',
      'Phần code sau `yield` VẪN luôn được pytest đảm bảo thực thi như một khối `finally` để giải phóng tài nguyên (teardown).',
      'Cần phải bọc `yield res` trong `try...except` thì `release(res)` mới chạy được khi test fail.',
      'Pytest sẽ tự động chạy lại hàm test thêm 1 lần nữa rồi mới gọi `release(res)`.',
    ],
    [
      'Sai. Nếu bỏ qua teardown khi test fail thì sẽ gây rò rỉ kết nối DB hoặc file rác.',
      'Chính xác! Pytest quản lý vòng đời generator fixture và đảm bảo phần sau `yield` luôn được gọi trong pha teardown bất kể test pass hay fail (trừ khi chính phần trước `yield` bị lỗi).',
      'Sai. Pytest tự xử lý cơ chế teardown cho yield fixture mà không bắt buộc lập trình viên viết `try...finally` thủ công (dù viết thêm cũng không sao).',
      'Sai. Pytest không tự retry test mặc định.',
    ],
    1,
    'Khi dùng `yield` trong `@pytest.fixture`, mọi dòng lệnh trước `yield` là bước Setup, giá trị được `yield` được tiêm (inject) vào hàm test, và mọi dòng lệnh sau `yield` là bước Teardown an toàn.',
    'Tương tự như việc註冊 callback cleanup trả về từ `useEffect(() => { ...; return () => cleanup(); })` luôn được gọi khi unmount.',
    ['pytest-fixture']
  ),
  q(
    'ex-q-383',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Trong cấu trúc thư mục kiểm thử của `pytest`, file `conftest.py` đóng vai trò gì và hoạt động theo quy tắc nào?',
    `tests/
├── conftest.py
├── unit/
│   └── test_math.py
└── integration/
    ├── conftest.py
    └── test_api.py`,
    [
      'Phải dùng lệnh `from conftest import my_fixture` ở đầu mỗi file `test_*.py` thì mới dùng được fixture.',
      'Là nơi khai báo các fixture, hook dùng chung; pytest tự động phát hiện (auto-discovery) và tiêm theo tên tham số cho các file test nằm cùng thư mục hoặc thư mục con mà KHÔNG cần `import`.',
      'Chỉ được phép có duy nhất 1 file `conftest.py` ở thư mục gốc của toàn dự án.',
      'Là file cấu hình thay thế hoàn toàn cho `pyproject.toml` để khai báo dependencies.',
    ],
    [
      'Sai. Tuyệt đối không cần và không nên import trực tiếp từ `conftest.py`.',
      'Chính xác! Pytest tự động nạp `conftest.py` theo phân cấp thư mục (hierarchical scoping): fixture ở `tests/integration/conftest.py` chỉ hiển thị cho các test trong `integration/`.',
      'Sai. Có thể đặt nhiều `conftest.py` ở các thư mục con để chia sẻ fixture theo từng tầng (unit vs integration).',
      'Sai. `conftest.py` dành cho runtime fixtures/hooks của pytest, không phải quản lý gói cài đặt.',
    ],
    1,
    '`conftest.py` giúp tổ chức các fixture dùng chung theo phạm vi thư mục một cách sạch sẽ nhờ cơ chế Dependency Injection dựa trên tên tham số của pytest.',
    'Giống như Context Provider trong React: đặt ở nhánh cây thư mục nào thì tất cả component (test file) bên dưới nhánh đó tự động truy cập được.',
    ['pytest-fixture']
  ),
  q(
    'ex-q-384',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Khi kết hợp hai decorator `@pytest.mark.parametrize` xếp chồng lên nhau như đoạn code dưới đây, `pytest` sẽ sinh ra tổng cộng bao nhiêu test case để thực thi?',
    `import pytest

@pytest.mark.parametrize("x", [1, 2])
@pytest.mark.parametrize("y", ["a", "b", "c"])
def test_cartesian(x, y):
    assert isinstance(x, int) and isinstance(y, str)`,
    [
      '2 test cases (chạy theo danh sách ngắn hơn).',
      '5 test cases (cộng tổng `2 + 3`).',
      '6 test cases (tích Đề-các `2 x 3` gồm mọi tổ hợp của `x` và `y`).',
      'Báo lỗi `SyntaxError` vì chỉ được phép dùng một `@pytest.mark.parametrize` trên mỗi hàm.',
    ],
    [
      'Sai. Pytest không cắt bớt như hàm `zip()`.',
      'Sai. Đây không phải phép nối hai danh sách test độc lập.',
      'Chính xác! Xếp chồng nhiều `@pytest.mark.parametrize` sẽ tạo ra tích Đề-các (Cartesian product) của toàn bộ các bộ tham số: `(1,"a"), (2,"a"), (1,"b"), (2,"b"), (1,"c"), (2,"c")` -> 6 cases.',
      'Sai. Pytest hỗ trợ xếp chồng nhiều `parametrize` rất mạnh mẽ.',
    ],
    2,
    '`@pytest.mark.parametrize` vừa có thể truyền nhiều biến cùng lúc `("x,y", [(1,"a"), (2,"b")])`, vừa có thể xếp chồng để kiểm thử vét cạn mọi tổ hợp ma trận đầu vào.',
    'Giống như hai vòng lặp `for x of [1, 2]` lồng với `for y of ["a", "b", "c"]` tạo ra 6 kịch bản test độc lập.',
    ['pytest-parametrize']
  ),
  q(
    'ex-q-385',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Xét bẫy kinh điển khi dùng `unittest.mock.patch` hoặc `monkeypatch`: File `app/service.py` viết `from app.db import fetch_user`. Khi viết test cho hàm trong `app/service.py`, bạn phải patch đường dẫn nào mới có tác dụng?',
    `# app/service.py
from app.db import fetch_user

def get_profile(uid: int):
    return fetch_user(uid)

# tests/test_service.py -> Cần patch ở đâu?`,
    [
      'Phải patch tại `"app.db.fetch_user"` vì hàm gốc được định nghĩa ở đó.',
      'Phải patch tại `"app.service.fetch_user"` (patch tại nơi hàm được tra cứu/sử dụng, KHÔNG phải nơi hàm được định nghĩa).',
      'Phải patch tại `"builtins.fetch_user"`.',
      'Không thể mock được khi đã dùng cú pháp `from ... import ...`.',
    ],
    [
      'Sai. Khi `app/service.py` chạy `from app.db import fetch_user`, nó đã tạo một biến tham chiếu cục bộ tên `fetch_user` trong namespace `app.service`. Thay đổi `app.db.fetch_user` sau đó không ảnh hưởng tới tham chiếu đã gắn vào `app.service`.',
      'Chính xác! Quy tắc vàng của Python mocking: "Patch where the object is looked up (imported into), not where it is defined".',
      'Sai. `fetch_user` không nằm trong `builtins`.',
      'Sai. Hoàn toàn mock được bằng cách nhắm đúng namespace của module đang gọi hàm (`app.service.fetch_user`).',
    ],
    1,
    'Vì câu lệnh `from module_a import func` gắn tên `func` trực tiếp vào `__dict__` của `module_b`, nên muốn đánh tráo `func` khi `module_b` chạy thì phải thay thế thuộc tính `module_b.func`.',
    'Giống như một người đã photo danh thiếp đem về bàn làm việc của mình (`app.service`): bạn sửa sổ danh bạ gốc (`app.db`) thì người đó vẫn gọi theo tờ giấy trên bàn họ.',
    ['unittest-mock', 'monkeypatch']
  ),
  q(
    'ex-q-386',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Fixture dựng sẵn `tmp_path` trong `pytest` trả về đối tượng thuộc kiểu dữ liệu nào và có ưu điểm gì khi kiểm thử thao tác file I/O?',
    `def test_export_report(tmp_path):
    out_file = tmp_path / "report.csv"
    out_file.write_text("id,score\\n1,95", encoding="utf-8")
    assert out_file.read_text(encoding="utf-8").startswith("id,score")`,
    [
      'Trả về chuỗi `str` trỏ tới thư mục hiện hành `.` của dự án.',
      'Trả về đối tượng `pathlib.Path` trỏ tới một thư mục tạm riêng biệt duy nhất cho mỗi hàm test và tự động được dọn dẹp sau một số phiên chạy.',
      'Trả về một đối tượng `io.StringIO` chỉ nằm trên RAM, không tạo thư mục thật trên ổ đĩa.',
      'Trả về đối tượng `py.path.local` đã lỗi thời từ Python 2.',
    ],
    [
      'Sai. Ghi vào thư mục dự án sẽ làm bẩn git working tree và gây xung đột khi chạy test song song.',
      'Chính xác! `tmp_path` trả về `pathlib.Path` (cho phép dùng toán tử `/` cực gọn) trỏ tới thư mục tạm cô lập hoàn toàn cho từng test case.',
      'Sai. `tmp_path` tạo thư mục thật trên hệ thống file tạm của OS để kiểm thử I/O thực tế.',
      'Sai. `py.path.local` là của fixture cũ `tmpdir`, còn `tmp_path` hiện đại dùng `pathlib.Path` chuẩn.',
    ],
    1,
    'Sử dụng `tmp_path` kết hợp toán tử `/` của `pathlib.Path` là chuẩn mực hiện đại trong pytest để test đọc/ghi file mà không sợ xung đột đường dẫn hay để lại file rác trong repo.',
    'Giống như khách sạn cấp cho mỗi khách (mỗi hàm test) một phòng riêng sạch sẽ (`tmp_path`), trả phòng xong có bộ phận dọn vệ sinh tự động.',
    ['pytest-tmp-path', 'pathlib']
  ),
  q(
    'ex-q-387',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Khi viết một Decorator trong Python mà QUÊN sử dụng `@functools.wraps(func)` trên hàm wrapper bên trong, hậu quả trực tiếp nào sẽ xảy ra?',
    `def my_logger(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@my_logger
def calculate_tax(amount: float) -> float:
    """Tính thuế GTGT."""
    return amount * 0.1`,
    [
      'Hàm `calculate_tax` không thể nhận được các tham số keyword arguments (`**kwargs`).',
      'Metadata của hàm gốc như `calculate_tax.__name__`, `__doc__`, `__annotations__` và `__wrapped__` bị mất và bị ghi đè thành `"wrapper"`, làm hỏng tài liệu OpenAPI/FastAPI hoặc công cụ introspection.',
      'Hàm `calculate_tax` sẽ bị gọi 2 lần mỗi khi thực thi.',
      'Trình thông dịch Python 3.12+ sẽ ném lỗi `TypeError` ngay lúc import file.',
    ],
    [
      'Sai. `*args, **kwargs` vẫn chuyển tiếp tham số bình thường.',
      'Chính xác! Nếu thiếu `@functools.wraps(func)`, `calculate_tax.__name__` sẽ trả về `"wrapper"` và `__doc__` thành `None`, khiến các framework dựa vào type signature/metadata (như FastAPI, Sphinx, pytest) hoạt động sai.',
      'Sai. Hàm gốc chỉ được gọi 1 lần trong `wrapper`.',
      'Sai. Python không báo lỗi cú pháp hay runtime, đây là lỗi logic ngầm về metadata.',
    ],
    1,
    '`@functools.wraps(func)` sao chép `__module__`, `__name__`, `__qualname__`, `__doc__`, `__annotations__` và gắn thuộc tính `__wrapped__ = func` để giữ nguyên danh tính của hàm gốc.',
    'Giống như đóng gói sản phẩm vào hộp vận chuyển (`wrapper`) nhưng quên dán nhãn tên và hướng dẫn sử dụng của sản phẩm gốc (`@wraps`) ra ngoài vỏ hộp.',
    ['functools-wraps', 'decorator']
  ),
  q(
    'ex-q-388',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Để xây dựng một Decorator nhận tham số cấu hình như `@retry(max_attempts=3)`, cấu trúc hàm chuẩn của nó cần bao nhiêu tầng hàm lồng nhau và thứ tự nhận đối số của từng tầng là gì?',
    `@retry(max_attempts=3)
def fetch_data():
    ...`,
    [
      '2 tầng: Tầng 1 nhận `(func, max_attempts=3)`, tầng 2 nhận `(*args, **kwargs)`.',
      '3 tầng (Decorator Factory): Tầng 1 `retry(max_attempts=3)` nhận cấu hình và trả về `decorator`; Tầng 2 `decorator(func)` nhận hàm gốc và trả về `wrapper`; Tầng 3 `wrapper(*args, **kwargs)` thực thi khi gọi hàm.',
      '1 tầng duy nhất sử dụng `*args` để tự đoán đối số nào là hàm, đối số nào là số nguyên.',
      '4 tầng bắt buộc vì Python yêu cầu tách riêng `*args` và `**kwargs` thành 2 hàm.',
    ],
    [
      'Sai. Khi viết `@retry(max_attempts=3)`, biểu thức `retry(max_attempts=3)` được gọi TRƯỚC để trả về một hàm decorator nhận `func`.',
      'Chính xác! `retry(...)` thực chất là một Decorator Factory (nhà máy sinh decorator): gọi nó với `max_attempts=3` sẽ tạo ra hàm `decorator(func)` nhớ biến `max_attempts` qua closure.',
      'Sai. Một tầng không thể vừa được gọi trực tiếp `@retry(3)` vừa bọc hàm khi thực thi.',
      'Sai. Chỉ cần 3 tầng: Factory -> Decorator -> Wrapper.',
    ],
    1,
    'Hiểu rõ biểu thức `@retry(max_attempts=3)` tương đương với `fetch_data = retry(max_attempts=3)(fetch_data)` giúp bạn nắm vững cấu trúc 3 tầng của Decorator Factory.',
    'Giống như currying trong JS/TS: `const retry = (maxAttempts) => (fn) => (...args) => { ... }`.',
    ['decorator-factory', 'closure']
  ),
  q(
    'ex-q-389',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Khi triển khai một Class-based Decorator (dùng class để trang trí cho một hàm và lưu trạng thái như số lần hàm được gọi), phương thức dunder nào bắt buộc phải được định nghĩa để instance của class có thể được gọi như một hàm?',
    `class CountCalls:
    def __init__(self, func):
        self.func = func
        self.calls = 0

    # Cần định nghĩa phương thức nào ở đây?`,
    [
      '`def __enter__(self, *args, **kwargs):`',
      '`def __call__(self, *args, **kwargs):`',
      '`def __new__(cls, *args, **kwargs):`',
      '`def __iter__(self):`',
    ],
    [
      'Sai. `__enter__` dùng cho Context Manager (`with` statement).',
      'Chính xác! Khi viết `@CountCalls` trước hàm `greet`, `greet` trở thành một instance của `CountCalls`. Để gọi được `greet("An")`, instance đó phải là một Callable thông qua `__call__(self, *args, **kwargs)`.',
      'Sai. `__new__` chỉ chạy lúc khởi tạo đối tượng `CountCalls(func)`, không chạy mỗi khi hàm được gọi.',
      'Sai. `__iter__` dùng cho đối tượng khả duyệt (Iterable).',
    ],
    1,
    'Mọi đối tượng trong Python có cài đặt phương thức `__call__` đều trở thành `Callable` (`callable(obj) == True`), cho phép kết hợp trạng thái OOP (`self.calls`) với cú pháp hàm gọn gàng.',
    'Giống như một đối tượng vừa có thuộc tính lưu trữ riêng (`self.calls`), vừa có thể bấm nút kích hoạt trực tiếp `obj()` như một hàm.',
    ['dunder-call', 'decorator']
  ),
  q(
    'ex-q-390',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Khi xếp chồng nhiều decorator lên cùng một hàm như đoạn code dưới đây, thứ tự áp dụng lúc ĐỊNH NGHĨA hàm (wrapping order) và thứ tự chạy lúc GỌI hàm (execution order) diễn ra như thế nào?',
    `@dec_a
@dec_b
def process():
    return "core"`,
    [
      'Lúc định nghĩa áp dụng `dec_a` trước rồi `dec_b`; lúc gọi hàm thì `wrapper_b` chạy trước rồi đến `wrapper_a`.',
      'Lúc định nghĩa tương đương `process = dec_a(dec_b(process))` (từ dưới lên / trong ra ngoài); nhưng lúc gọi `process()` thì lớp vỏ ngoài cùng `wrapper_a` nhận cuộc gọi trước rồi mới gọi vào `wrapper_b` (từ trên xuống / ngoài vào trong).',
      'Cả lúc định nghĩa lẫn lúc gọi hàm đều chạy từ trên xuống (`dec_a` rồi `dec_b`).',
      'Thứ tự xếp chồng decorator không ảnh hưởng tới kết quả thực thi.',
    ],
    [
      'Sai. Ngược hoàn toàn: lúc gói là từ trong ra ngoài (`dec_b` gói trước, `dec_a` gói ngoài), lúc gọi là từ ngoài vào trong (`wrapper_a` chạy trước).',
      'Chính xác! `dec_b` bọc trực tiếp hàm `process`, sau đó `dec_a` bọc kết quả đó lại. Khi gọi `process()`, luồng đi xuyên từ vỏ ngoài (`dec_a`) vào vỏ trong (`dec_b`) rồi tới lõi (`process`).',
      'Sai. Lúc định nghĩa phải đánh giá biểu thức bên trong `dec_b(process)` trước rồi mới truyền cho `dec_a`.',
      'Sai. Thứ tự decorator cực kỳ quan trọng (ví dụ `@login_required` phải chạy trước `@audit_action` hay `@cache`).',
    ],
    1,
    'Hãy luôn nhớ công thức đại số: `@A` ở trên `@B` nghĩa là `f = A(B(f))`. Gói từ trong ra ngoài (`B` rồi `A`), bóc vỏ khi gọi từ ngoài vào trong (`A` rồi `B`).',
    'Giống như mặc áo: bạn mặc áo sơ mi (`dec_b`) trước rồi khoác áo ấm (`dec_a`) ra ngoài; nhưng khi người khác chạm vào bạn, họ chạm vào áo khoác (`dec_a`) trước tiên.',
    ['decorator']
  ),
  q(
    'ex-q-391',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'So sánh độ phức tạp bộ nhớ (Space Complexity) và hành vi thực thi giữa hai dòng lệnh dưới đây khi xử lý 100 triệu số nguyên là gì?',
    `squares_list = [x * x for x in range(100_000_000)]
squares_gen  = (x * x for x in range(100_000_000))`,
    [
      'Cả hai đều cấp phát mảng 100 triệu phần tử trên RAM ngay lập tức, chỉ khác nhau ở khả năng chỉnh sửa phần tử.',
      '`squares_list` tính toán toàn bộ ngay lập tức (eager) và tốn bộ nhớ `O(N)` (hàng GB RAM); còn `squares_gen` tạo ra một Generator đối tượng lười (lazy evaluation) chỉ tốn bộ nhớ hằng số `O(1)` (~vài trăm bytes) và chỉ tính từng phần tử khi được `next()` yêu cầu.',
      '`squares_gen` là một `tuple` bất biến chứa 100 triệu phần tử.',
      '`squares_gen` tự động chạy trên GPU nên không tốn RAM hệ thống.',
    ],
    [
      'Sai. Generator expression không lưu toàn bộ phần tử vào RAM.',
      'Chính xác! Ngoặc vuông `[...]` tạo `list` (eager, `O(N)` RAM), trong khi ngoặc tròn `(...)` tạo `generator` (lazy, `O(1)` RAM), tính toán cuốn chiếu từng mục khi duyệt qua.',
      'Sai. Trong Python không có "tuple comprehension"; cú pháp `(x for x in ...)` tạo ra một `generator` object.',
      'Sai. Generator chạy trên CPU bình thường theo cơ chế tạm dừng trạng thái frame (`yield`).',
    ],
    1,
    'Generator Expression là vũ khí tối thượng khi truyền vào các hàm tổng hợp như `sum(x * x for x in data)` hoặc `any(...)`, giúp xử lý luồng dữ liệu khổng lồ với lượng RAM gần bằng 0.',
    'List giống như in sẵn toàn bộ 100 triệu trang sách chất đầy kho (`O(N)`); Generator giống như máy in theo yêu cầu chỉ in đúng trang bạn đang đọc (`O(1)`).',
    ['generator', 'lazy-evaluation']
  ),
  q(
    'ex-q-392',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Đoạn code dưới đây sẽ in ra kết quả gì và tại sao (bẫy cạn kiệt Generator - Single-pass Exhaustion)?',
    `gen = (x * 2 for x in [1, 2, 3])
first_sum = sum(gen)
second_sum = sum(gen)
print(first_sum, second_sum)`,
    [
      '`12 12`',
      '`12 0`',
      '`6 6`',
      'Ném ngoại lệ `StopIteration` ở dòng `second_sum = sum(gen)`.',
    ],
    [
      'Sai. Generator là một Iterator chỉ duyệt được 1 lần duy nhất, không thể tự tua lại từ đầu.',
      'Chính xác! Lần gọi `sum(gen)` đầu tiên đã tiêu thụ hết toàn bộ các phần tử của generator (`2 + 4 + 6 = 12`). Đến lần gọi `sum(gen)` thứ hai, generator đã cạn kiệt (exhausted) nên trả về `StopIteration` ngay lập tức, và `sum([])` trả về `0`.',
      'Sai. Giá trị nhân đôi của `[1, 2, 3]` có tổng là `12`, và lần hai bằng `0`.',
      'Sai. Hàm `sum()` tự bắt `StopIteration` để kết thúc vòng lặp và trả về giá trị khởi tạo mặc định là `0`.',
    ],
    1,
    'Khác với `list` (là một Iterable có thể tạo Iterator mới nhiều lần qua `__iter__`), một `Generator` chính là một `Iterator` (`iter(gen) is gen`). Khi đã duyệt hết một lần, nó sẽ rỗng vĩnh viễn.',
    'Giống như ly trà sữa uống một lần: hút hết ở lượt đầu (`first_sum = 12`), lượt thứ hai hút lại chính cái ly đó thì chẳng còn giọt nào (`second_sum = 0`).',
    ['generator', 'iterator']
  ),
  q(
    'ex-q-393',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Trong hàm generator, cú pháp `yield from sub_gen` có tác dụng gì vượt trội so với việc chỉ viết `yield sub_gen`?',
    `def chain_streams(a, b):
    yield from a
    yield from b

print(list(chain_streams([1, 2], [3, 4])))`,
    [
      '`yield sub_gen` trả về chính đối tượng list/generator con như một phần tử đơn lẻ; còn `yield from sub_gen` ủy quyền (delegate) việc sinh từng phần tử bên trong `sub_gen` ra ngoài, đồng thời chuyển tiếp hai chiều cả `.send()`, `.throw()` và nhận giá trị `return` của generator con. Kết quả in ra `[1, 2, 3, 4]`.',
      '`yield from` chạy hai generator `a` và `b` song song trên 2 luồng khác nhau.',
      'Hai cú pháp hoàn toàn giống nhau, `yield from` chỉ là bí danh thẩm mỹ.',
      '`yield from` chỉ dùng được với danh sách kiểu chuỗi `str`.',
    ],
    [
      'Chính xác! `yield from` mở phẳng (flatten) một tầng ủy quyền tới iterable/sub-generator con và nối thông đường ống giao tiếp hai chiều giữa caller và sub-generator.',
      'Sai. `yield from` thực thi tuần tự hết `a` rồi mới sang `b`.',
      'Sai. Nếu dùng `yield a; yield b` thì kết quả sẽ là `[[1, 2], [3, 4]]` thay vì `[1, 2, 3, 4]`.',
      'Sai. `yield from` hoạt động với bất kỳ đối tượng `Iterable` hoặc `Generator` nào.',
    ],
    0,
    '`yield from` (PEP 380) vừa giúp làm phẳng các vòng lặp generator đệ quy (như duyệt cây thư mục, AST), vừa là nền tảng lịch sử dẫn tới cơ chế `await` coroutine sau này.',
    'Tương tự như `yield* subGenerator` trong JavaScript/TypeScript.',
    ['yield-from', 'generator']
  ),
  q(
    'ex-q-394',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Khi tự cài đặt một Context Manager bằng class với `__enter__` và `__exit__(self, exc_type, exc_val, exc_tb)`, điều gì xảy ra nếu phương thức `__exit__` trả về giá trị `True` khi có ngoại lệ phát sinh bên trong khối `with`?',
    `class SuppressZeroDiv:
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is ZeroDivisionError:
            return True
        return False

with SuppressZeroDiv():
    x = 1 / 0
print("Done")`,
    [
      'Ngoại lệ `ZeroDivisionError` vẫn làm chương trình bị crash ngay lập tức.',
      'Ngoại lệ `ZeroDivisionError` bị nuốt/triệt tiêu (suppressed) hoàn toàn và chương trình tiếp tục chạy dòng `print("Done")` bình thường.',
      'Khối `with` sẽ tự động chạy lại phép chia `1 / 0` từ đầu.',
      'Python ném lỗi `RuntimeError` vì `__exit__` không được phép trả về kiểu `bool`.',
    ],
    [
      'Sai. Trả về `False` hoặc `None` thì ngoại lệ mới được ném tiếp ra ngoài; trả về `True` sẽ chặn ngoại lệ đó lại.',
      'Chính xác! Theo giao thức Context Manager của Python, nếu `__exit__` trả về một giá trị truthy (`True`), trình thông dịch hiểu rằng ngoại lệ đã được xử lý xong và sẽ nuốt ngoại lệ đó, chạy tiếp câu lệnh sau khối `with`.',
      'Sai. Context manager không có cơ chế retry tự động cho thân khối `with`.',
      'Sai. Giao thức `__exit__` được thiết kế đặc biệt để kiểm tra giá trị boolean trả về.',
    ],
    1,
    'Mặc định hàm Python không có `return` sẽ trả về `None` (falsy), nên ngoại lệ luôn được lan truyền ra ngoài. Chỉ trả về `True` trong `__exit__` khi bạn thực sự chủ đích nuốt một loại lỗi cụ thể (như `contextlib.suppress(FileNotFoundError)`).',
    'Giống như nhân viên bảo vệ ở cửa ra (`__exit__`): nếu giơ biển xanh (`True`) nghĩa là "Sự cố đã được giải quyết nội bộ, không cần báo cảnh sát bên ngoài".',
    ['context-manager', 'dunder-exit']
  ),
  q(
    'ex-q-395',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Khi viết một Context Manager gọn nhẹ bằng `@contextlib.contextmanager` và từ khóa `yield`, tại sao bạn BẮT BUỘC phải bọc câu lệnh `yield` trong khối `try...finally` nếu muốn đảm bảo tài nguyên luôn được giải phóng?',
    `from contextlib import contextmanager

@contextmanager
def open_session():
    session = create_session()
    try:
        yield session
    finally:
        session.close()`,
    [
      'Vì khác với `@pytest.fixture`, nếu thân khối `with open_session():` ném ra ngoại lệ, `@contextmanager` sẽ ném (inject) chính ngoại lệ đó vào ngay tại điểm `yield` thông qua `gen.throw()`; nếu không có `try...finally`, dòng `session.close()` phía sau `yield` sẽ không bao giờ chạy!',
      'Vì Python bắt buộc mặt cú pháp: mọi hàm có `yield` đều phải nằm trong `try...finally`.',
      'Vì `try...finally` giúp tự động nuốt mọi ngoại lệ xảy ra bên trong khối `with`.',
      'Thực ra không cần `try...finally`, `@contextmanager` tự động chạy các dòng sau `yield` giống hệt `pytest.fixture`.',
    ],
    [
      'Chính xác! Đây là điểm khác biệt cực kỳ quan trọng giữa `@contextlib.contextmanager` và `@pytest.fixture`: khi có lỗi trong khối `with`, `@contextmanager` gọi `generator.throw(exc)` ngay tại dòng `yield`. Không có `finally`, luồng chạy sẽ thoát khỏi hàm ngay tại `yield` và bỏ qua phần dọn dẹp!',
      'Sai. Generator thông thường không bắt buộc phải có `try...finally`.',
      'Sai. `try...finally` không nuốt ngoại lệ, nó chạy khối `finally` rồi vẫn ném ngoại lệ ra ngoài như bình thường.',
      'Sai. `@contextmanager` KHÔNG tự chạy phần sau `yield` nếu ngoại lệ làm thoát khỏi điểm `yield` mà không có `finally`.',
    ],
    0,
    'Khi dùng `@contextlib.contextmanager`, luôn áp dụng mẫu chuẩn: khởi tạo trước `try`, đặt `yield resource` bên trong `try:`, và đặt lệnh giải phóng trong `finally:`.',
    'Tại điểm `yield`, khối `with` có thể ném trả lại một quả lựu đạn (exception) vào trong hàm; chỉ có lớp giáp `finally` mới đảm bảo bạn kịp khóa van gas trước khi thoát.',
    ['contextlib', 'context-manager']
  ),
  q(
    'ex-q-396',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Khi bạn cần mở một số lượng động (dynamic/unknown number) các context managers (ví dụ: mở danh sách N file hoặc N kết nối bất đồng bộ mà N chỉ biết lúc runtime), công cụ nào trong thư viện chuẩn `contextlib` được thiết kế chuyên biệt cho bài toán này?',
    `from contextlib import ExitStack, AsyncExitStack

def process_files(filenames: list[str]):
    with ExitStack() as stack:
        files = [stack.enter_context(open(fn)) for fn in filenames]
        # Làm việc với danh sách files...`,
    [
      '`contextlib.suppress`',
      '`contextlib.ExitStack` (cho đồng bộ) và `contextlib.AsyncExitStack` (cho bất đồng bộ `async with`).',
      '`contextlib.redirect_stdout`',
      '`contextlib.nullcontext`',
    ],
    [
      'Sai. `suppress` chỉ dùng để bỏ qua các ngoại lệ được chỉ định.',
      'Chính xác! `ExitStack` và `AsyncExitStack` duy trì một ngăn xếp (LIFO stack) các callbacks/context managers được đăng ký động qua `enter_context()` / `enter_async_context()`, đảm bảo đóng tất cả theo đúng thứ tự ngược lại ngay cả khi có lỗi ở bước thứ k.',
      'Sai. `redirect_stdout` chỉ dùng để chuyển hướng luồng in chuẩn.',
      'Sai. `nullcontext` chỉ là một context manager rỗng không làm gì cả.',
    ],
    1,
    '`ExitStack` và `AsyncExitStack` được sử dụng rộng rãi bên dưới lòng FastAPI và các framework MCP/HTTP client để quản lý danh sách các lifespan/dependencies lồng nhau một cách an toàn.',
    'Giống như một khay xếp chồng đĩa (LIFO Stack): bạn mở bao nhiêu tài nguyên thì xếp vào khay bấy nhiêu cái, lúc kết thúc khối `with` khay sẽ tự động đóng lần lượt từ cái mở sau cùng về cái mở đầu tiên.',
    ['exitstack', 'contextlib']
  ),
  q(
    'ex-q-397',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Đoạn code khai báo `@dataclass` dưới đây sẽ gặp chuyện gì khi chạy trên Python?',
    `from dataclasses import dataclass

@dataclass
class Team:
    name: str
    members: list[str] = []`,
    [
      'Hoạt động bình thường và tạo một danh sách rỗng riêng cho mỗi `Team`.',
      'Tất cả các `Team` sẽ dùng chung một danh sách `members` giống như lỗi hàm `def __init__(self, members=[])`.',
      'Ném ngay ngoại lệ `ValueError: mutable default <class \'list\'> for field members is not allowed: use default_factory` ngay tại thời điểm định nghĩa class!',
      'Tự động chuyển `members` thành kiểu `tuple` bất biến.',
    ],
    [
      'Sai. `@dataclass` chủ động ngăn chặn lỗi mutable default argument.',
      'Sai. Đó là hành vi của hàm `def` truyền thống, còn `@dataclass` phát hiện và cấm thẳng tay hành vi nguy hiểm này.',
      'Chính xác! Để bảo vệ lập trình viên khỏi bẫy dùng chung biến mặc định khả biến (mutable default), `@dataclass` kiểm tra các giá trị mặc định và ném `ValueError` ngay lập tức, buộc bạn phải dùng `field(default_factory=list)`.',
      'Sai. `@dataclass` không tự ý đổi kiểu dữ liệu từ `list` sang `tuple`.',
    ],
    2,
    'Trong `@dataclass`, mọi trường có giá trị mặc định là đối tượng khả biến (`list`, `dict`, `set`) đều phải khai báo qua `field(default_factory=list)` để mỗi instance mới được gọi hàm tạo một bản sao độc lập.',
    '`@dataclass` giống như một người gác cổng nghiêm khắc: thấy bạn định dùng chung một cuốn sổ nháp (`[]`) cho mọi nhân viên là chặn lại ngay và bắt phát cho mỗi người một cuốn mới (`default_factory=list`).',
    ['dataclass', 'mutable-default']
  ),
  q(
    'ex-q-398',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Khi khai báo `@dataclass(frozen=True, slots=True, kw_only=True)` trong Python 3.10+, sự kết hợp của 3 cờ này mang lại những đặc tính kỹ thuật nào cho class?',
    `@dataclass(frozen=True, slots=True, kw_only=True)
class Money:
    amount: int
    currency: str = "VND"`,
    [
      '`frozen=True` chặn gán lại thuộc tính sau khi tạo (và tự sinh `__hash__`); `slots=True` tạo `__slots__` thay vì `__dict__` giúp giảm mạnh RAM và tăng tốc truy cập thuộc tính; `kw_only=True` bắt buộc truyền đối số theo tên `Money(amount=100)`.',
      '`frozen=True` khóa không cho kế thừa class; `slots=True` giới hạn tối đa 2 thuộc tính; `kw_only=True` cấm dùng giá trị mặc định.',
      '`frozen=True` đóng băng toàn bộ bộ nhớ GC; `slots=True` lưu dữ liệu vào SQLite; `kw_only=True` chỉ cho phép truyền kiểu `str`.',
      'Ba cờ này xung đột nhau và không thể bật cùng lúc trên một `@dataclass`.',
    ],
    [
      'Chính xác! Đây là bộ ba hoàn hảo để tạo Value Object / DTO bất biến, tiết kiệm bộ nhớ (nhờ `__slots__`), có thể dùng làm key trong `dict`/`set` (nhờ `frozen=True`), và gọi hàm tự mô tả rõ ràng (nhờ `kw_only=True`).',
      'Sai. Không cờ nào giới hạn số lượng thuộc tính là 2 hay cấm giá trị mặc định (thậm chí `kw_only=True` còn giúp đặt trường không có default sau trường có default!).',
      'Sai. Các cờ này chỉ điều khiển cấu trúc class Python trên RAM.',
      'Sai. Cả 3 cờ hoàn toàn tương thích và rất hay được bật cùng nhau trong code Python hiện đại.',
    ],
    0,
    'Ngoài ra, `kw_only=True` còn giải quyết một nỗi đau lớn khi kế thừa `@dataclass`: lớp con có thể thêm các trường bắt buộc (không có default) ngay cả khi lớp cha đã có các trường mang giá trị mặc định.',
    'Giống như đúc một đồng xu nguyên khối (`frozen=True`), khuôn gọn nhẹ không thừa chi tiết (`slots=True`), và khắc rõ mệnh giá lên từng mặt (`kw_only=True`).',
    ['dataclass', 'slots']
  ),
  q(
    'ex-q-399',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Trong một `@dataclass`, phương thức `__post_init__(self)` được gọi vào thời điểm nào và nếu class được đánh dấu `frozen=True`, làm sao để gán một thuộc tính tính toán dẫn xuất bên trong `__post_init__` mà không bị lỗi `FrozenInstanceError`?',
    `@dataclass(frozen=True)
class User:
    first: str
    last: str
    full_name: str = ""

    def __post_init__(self):
        # Gán self.full_name như thế nào để không bị FrozenInstanceError?`,
    [
      'Chạy trước `__init__`; có thể gán bình thường bằng `self.full_name = f"{self.first} {self.last}"`.',
      'Chạy ngay ở cuối hàm `__init__` do dataclass tự sinh ra; với `frozen=True`, phải dùng `object.__setattr__(self, "full_name", f"{self.first} {self.last}")`.',
      'Chạy khi đối tượng bị Garbage Collector thu hồi; phải dùng `del self.full_name`.',
      'Không thể dùng `__post_init__` khi đã bật `frozen=True`.',
    ],
    [
      'Sai. `__post_init__` chạy ở CUỐI `__init__`, và khi `frozen=True` thì `self.full_name = ...` sẽ kích hoạt `__setattr__` bị khóa và ném `FrozenInstanceError`.',
      'Chính xác! Hàm `__init__` tự sinh sẽ gán các trường đầu vào rồi gọi `self.__post_init__()`. Khi `frozen=True`, muốn thiết lập giá trị dẫn xuất hoặc chuẩn hóa dữ liệu trong `__post_init__`, ta gọi `object.__setattr__(self, "full_name", ...)` để đi vòng qua chốt chặn của dataclass.',
      'Sai. Thu hồi bộ nhớ là `__del__`, không phải `__post_init__`.',
      'Sai. `__post_init__` vẫn dùng rất phổ biến với `frozen=True` để validate hoặc chuẩn hóa dữ liệu.',
    ],
    1,
    '`__post_init__` là nơi lý tưởng để kiểm tra tính hợp lệ (validation) của các trường dữ liệu hoặc tính toán các trường phụ thuộc ngay sau khi các trường cơ bản đã được gán.',
    'Giống như kiểm tra chất lượng và dán tem niêm phong cuối dây chuyền lắp ráp (`__init__`), dùng chìa khóa kỹ thuật của nhà máy (`object.__setattr__`) trước khi xuất xưởng.',
    ['dataclass']
  ),
  q(
    'ex-q-400',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Trong hệ sinh thái đóng gói Python hiện đại (`uv build` / `pyproject.toml`), sự khác biệt bản chất giữa gói **Wheel (`.whl`)** và gói **Source Distribution (`sdist` - `.tar.gz`)** là gì?',
    `dist/
├── my_pkg-0.1.0-py3-none-any.whl
└── my_pkg-0.1.0.tar.gz`,
    [
      'File `.whl` là bản phân phối đã dựng sẵn (built distribution - thực chất là định dạng ZIP chuẩn hóa PEP 427) giúp `uv`/`pip` giải nén thẳng vào `site-packages` cực nhanh mà không cần chạy bước build hay biên dịch C/Rust trên máy người dùng; còn `.tar.gz` (`sdist`) chỉ chứa mã nguồn thô đòi hỏi máy cài đặt phải chạy build backend.',
      'File `.whl` chỉ chạy được trên Windows, còn `.tar.gz` chỉ chạy được trên Linux/macOS.',
      'File `.tar.gz` luôn cài đặt nhanh hơn `.whl` vì dung lượng nén nhỏ hơn.',
      'File `.whl` mã hóa toàn bộ mã nguồn Python thành mã máy nhị phân không thể đọc được.',
    ],
    [
      'Chính xác! Wheel (`.whl`) giúp việc cài đặt diễn ra tức thì (đặc biệt với các thư viện có C/C++/Rust extensions như `pydantic-core`, `polars`, `numpy` đã được biên dịch sẵn thành binary wheel cho từng OS/kiến trúc).',
      'Sai. Định dạng `.whl` là chuẩn đa nền tảng cho mọi hệ điều hành.',
      'Sai. Cài từ `sdist` (`.tar.gz`) chậm hơn rất nhiều vì phải tạo môi trường build cô lập và biên dịch lại từ mã nguồn.',
      'Sai. Với gói thuần Python (`py3-none-any.whl`), bên trong file `.whl` vẫn là các file `.py` bình thường được nén ZIP.',
    ],
    0,
    'Khi nhìn tên file `my_pkg-0.1.0-py3-none-any.whl`, 3 nhãn cuối (`py3-none-any`) cho biết: tương thích Python 3, không phụ thuộc C ABI (`none`), và chạy trên mọi kiến trúc OS/CPU (`any`).',
    '`.tar.gz` (`sdist`) giống như mua bộ gỗ nguyên liệu kèm bản vẽ về tự cưa đóng bàn; còn `.whl` (Wheel) là chiếc bàn đã lắp ráp hoàn chỉnh tại nhà máy, mua về đặt vào phòng là dùng ngay.',
    ['python-wheel', 'packaging']
  ),
  q(
    'ex-q-401',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Để biến một gói Python thành một công cụ dòng lệnh (CLI) có thể chạy trực tiếp bằng tên lệnh (ví dụ gõ `pylearn-cli` trong terminal sau khi cài gói), bạn cần cấu hình mục nào trong file `pyproject.toml` chuẩn PEP 621?',
    `# pyproject.toml
[project]
name = "pylearn"
version = "0.1.0"

# Khai báo bảng nào tiếp theo?`,
    [
      '`[project.scripts]` với cú pháp `pylearn-cli = "pylearn.cli:main"` (trỏ tới `package.module:function`).',
      '`[tool.pytest.ini_options]` với cú pháp `bin = "pylearn/cli.py"`.',
      '`[build-system]` với cú pháp `executable = true`.',
      'Phải tự viết script bash copy file vào `/usr/local/bin` vì `pyproject.toml` không hỗ trợ tạo lệnh CLI.',
    ],
    [
      'Chính xác! Khi cài đặt gói (hoặc chạy `uv run pylearn-cli`), trình cài đặt sẽ đọc `[project.scripts]` và tự động sinh ra một wrapper executable trong thư mục `.venv/bin/` (hoặc `.venv/Scripts/` trên Windows) gọi thẳng tới hàm `main()` trong `pylearn/cli.py`.',
      'Sai. `tool.pytest` chỉ cấu hình cho pytest.',
      'Sai. `build-system` chỉ khai báo trình đóng gói như `hatchling`, `setuptools`, hay `maturin`.',
      'Sai. Entry points `[project.scripts]` là chuẩn chính thống đa nền tảng (tạo cả `.exe` trên Windows và script trên Unix).',
    ],
    0,
    'Cấu hình `[project.scripts]` trong `pyproject.toml` là chuẩn PEP 621 tương đương với trường `"bin"` trong `package.json` của Node.js.',
    'Giống như khai báo `"bin": { "pylearn-cli": "./dist/cli.js" }` trong `package.json` để người dùng gõ lệnh trực tiếp trên terminal.',
    ['pyproject-toml', 'packaging']
  ),
  q(
    'ex-q-402',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Trong `pytest`, nếu bạn muốn kiểm tra xem một hàm có ném ra đúng ngoại lệ `ValueError` kèm theo thông điệp lỗi khớp với biểu thức chính quy (regex) `"Số tiền .* không hợp lệ"` hay không, cách viết nào sau đây là chuẩn xác nhất?',
    `def withdraw(amount: int):
    if amount <= 0:
        raise ValueError(f"Số tiền {amount} không hợp lệ")`,
    [
      '`assert withdraw(-10) == ValueError`',
      '`with pytest.raises(ValueError, match=r"Số tiền .* không hợp lệ"): withdraw(-10)`',
      '`try: withdraw(-10) except Exception: assert True`',
      '`pytest.expect_error(withdraw(-10), ValueError)`',
    ],
    [
      'Sai. Khi `withdraw(-10)` chạy, nó sẽ ném lỗi ngay lập tức làm gãy bài test trước khi kịp so sánh `==`.',
      'Chính xác! `pytest.raises(ExpectedException, match=...)` là một context manager vừa bắt đúng loại ngoại lệ, vừa kiểm tra nội dung chuỗi lỗi bằng regex, và sẽ đánh trượt (fail) bài test nếu hàm KHÔNG ném ra lỗi đó.',
      'Sai. Nếu `withdraw(-10)` bị bug và KHÔNG ném lỗi gì cả, khối `try...except` này vẫn cho bài test pass oan!',
      'Sai. Pytest không có hàm `expect_error`, và truyền `withdraw(-10)` làm đối số sẽ khiến hàm bị gọi trước khi vào hàm kiểm tra.',
    ],
    1,
    'Sử dụng `with pytest.raises(ExcType, match=...):` đảm bảo cả hai chiều: hàm bắt buộc phải ném lỗi, và lỗi đó phải đúng kiểu cũng như đúng thông điệp nghiệp vụ mong đợi.',
    'Tương tự như `expect(() => withdraw(-10)).toThrow(/Số tiền .* không hợp lệ/)` trong Jest/Vitest.',
    ['pytest-raises']
  ),
  q(
    'ex-q-403',
    'stage-3',
    'advanced',
    CAT_ADV_1,
    TAGS_ADV_1,
    'Tại sao cộng đồng Python hiện đại khuyến nghị cấu trúc thư mục dự án theo **`src/` layout** (`src/my_pkg/__init__.py`) thay vì **flat layout** (`my_pkg/__init__.py` đặt ngay ở thư mục gốc cùng cấp với `tests/`)?',
    `project_root/
├── pyproject.toml
├── src/
│   └── my_pkg/
│       └── __init__.py
└── tests/
    └── test_core.py`,
    [
      'Vì Python 3.12+ cấm import các thư mục không nằm trong `src/`.',
      'Vì thư mục hiện hành `""` (thư mục gốc dự án) luôn được tự động thêm vào đầu `sys.path`; nếu dùng flat layout, `pytest` sẽ vô tình import trực tiếp thư mục mã nguồn cục bộ thay vì gói đã được đóng gói/cài đặt (editable/wheel), làm che giấu các lỗi thiếu file trong bản build thực tế.',
      'Vì `src/` layout giúp code chạy nhanh gấp đôi nhờ trình biên dịch JIT.',
      'Vì `git` chỉ theo dõi các file Python nằm trong thư mục tên là `src`.',
    ],
    [
      'Sai. Python không bắt buộc tên thư mục `src/` ở cấp độ ngôn ngữ.',
      'Chính xác! Với `src/` layout, thư mục `my_pkg` không nằm trực tiếp ở `project_root`, nên các bài test bắt buộc phải chạy qua gói đã được cài đặt vào `.venv` (ví dụ qua `uv run pytest`), giúp phát hiện sớm lỗi cấu hình đóng gói hoặc thiếu file dữ liệu.',
      'Sai. Cấu trúc thư mục không làm thay đổi tốc độ thực thi runtime.',
      'Sai. Git theo dõi mọi thư mục không nằm trong `.gitignore`.',
    ],
    1,
    '`src/` layout đảm bảo tính cô lập tuyệt đối: những gì bài test của bạn import chính xác là những gì người dùng cuối nhận được khi cài gói của bạn.',
    'Giống như kiểm thử món ăn đóng hộp bằng cách mở đúng hộp thành phẩm trên kệ siêu thị (`src/` layout installed package), thay vì múc thử trực tiếp từ nồi đang nấu dở trong bếp (flat layout).',
    ['packaging', 'sys-path']
  ),
];

const CAT_ADV_2 = 'CPython Internals, Bộ nhớ, Descriptors & Type System';
const TAGS_ADV_2 = [
  'cpython',
  'memory-gc',
  'slots',
  'descriptors',
  'metaclasses',
  'typing',
  'protocol',
  'generics',
  'weakref',
];

const SET_2_QUESTIONS: ExamQuestion[] = [
  q(
    'ex-q-404',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Trong mã nguồn C của CPython, mọi đối tượng Python trên bộ nhớ Heap đều bắt đầu bằng cấu trúc `PyObject` header gồm 2 trường cốt lõi nào (trên hệ thống 64-bit tốn 16 bytes cơ sở)?',
    `// Include/object.h trong CPython
typedef struct _object {
    Py_ssize_t ob_refcnt;
    PyTypeObject *ob_type;
} PyObject;`,
    [
      '`ob_refcnt` (bộ đếm số lượng tham chiếu trỏ tới đối tượng) và `ob_type` (con trỏ trỏ tới kiểu dữ liệu/class của đối tượng).',
      '`ob_name` (tên biến dạng chuỗi) và `ob_value` (giá trị nhị phân 64-bit).',
      '`ob_stack_ptr` (địa chỉ trên ngăn xếp) và `ob_lock` (mutex khóa riêng cho từng đối tượng).',
      '`ob_prototype` (chuỗi kế thừa kiểu JS) và `ob_hash` (mã băm cố định).',
    ],
    [
      'Chính xác! Đó là lý do trong Python "biến không có kiểu, chỉ có đối tượng mới mang kiểu" (`ob_type`) và bộ nhớ được thu hồi tức thì ngay khi `ob_refcnt` giảm về `0`.',
      'Sai. Đối tượng không hề biết tên biến nào đang trỏ tới nó (`ob_name` không tồn tại).',
      'Sai. Mọi `PyObject` nằm trên Heap chứ không nằm trên C stack.',
      'Sai. Không phải mọi đối tượng đều khả băm (ví dụ `list` không có hash).',
    ],
    0,
    'Hiểu cấu trúc `PyObject` (`ob_refcnt` + `ob_type`) giúp giải thích tại sao một số nguyên `int` đơn giản trong Python lại chiếm tới 28 bytes trên RAM thay vì 4 hay 8 bytes như trong C.',
    'Mỗi đối tượng trên Heap đều đeo một thẻ căn cước gồm 2 thông tin: "Có bao nhiêu dây đang buộc vào tôi?" (`ob_refcnt`) và "Tôi thuộc loài nào?" (`ob_type`).',
    ['pyobject', 'cpython-internals']
  ),
  q(
    'ex-q-405',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Nếu CPython đã có cơ chế Đếm Tham Chiếu (Reference Counting) tự động giải phóng đối tượng ngay khi `ob_refcnt == 0`, tại sao CPython vẫn cần thêm bộ **Cyclic Garbage Collector (`gc` module)** với 3 thế hệ (Generations 0, 1, 2)?',
    `class Node:
    def __init__(self):
        self.peer = None

a = Node()
b = Node()
a.peer = b
b.peer = a
del a, b  # Chuyện gì xảy ra với bộ nhớ của 2 Node này?`,
    [
      'Vì Reference Counting chỉ hoạt động với kiểu số nguyên `int` và chuỗi `str`.',
      'Vì khi hai hay nhiều đối tượng tham chiếu vòng tròn lẫn nhau (reference cycle: `a.peer = b; b.peer = a`), dù đã `del a, b` ở ngoài nhưng `ob_refcnt` của mỗi đối tượng vẫn bằng `1` (không bao giờ về `0`), nên cần Cyclic GC định kỳ quét các container để phát hiện và thu hồi các đảo tham chiếu cô lập.',
      'Vì Cyclic GC dùng để nén các file trên ổ cứng khi đầy.',
      'Vì Reference Counting chỉ chạy khi tắt chương trình Python.',
    ],
    [
      'Sai. Reference Counting hoạt động trên TẤT CẢ mọi `PyObject`.',
      'Chính xác! Reference Counting xử lý ~95% việc giải phóng bộ nhớ tức thì, còn Cyclic GC (chia thành Generation 0, 1, 2 theo giả thuyết thế hệ) chuyên trị bài toán tham chiếu vòng (reference cycles) giữa các đối tượng container (`list`, `dict`, custom objects).',
      'Sai. GC chỉ quản lý bộ nhớ RAM (Heap).',
      'Sai. Reference Counting giảm và giải phóng bộ nhớ ngay tại thời điểm tham chiếu mất đi trong lúc chạy.',
    ],
    1,
    'Sự kết hợp giữa Reference Counting (thu hồi tức thì, xác định) và Generational Cyclic GC (dọn vòng lặp tham chiếu ngầm) tạo nên cơ chế quản lý bộ nhớ lai (hybrid) đặc trưng của CPython.',
    'Hai người nắm tay nhau đứng trên một hòn đảo hoang không ai ở đất liền nối dây tới (`del a, b`): đếm tay thì mỗi người vẫn có 1 người nắm (`refcnt = 1`), nên cần trực thăng tuần tra (`Cyclic GC`) bay qua nhìn toàn cảnh để nhận ra cả hòn đảo đã bị cô lập.',
    ['reference-counting', 'cyclic-gc']
  ),
  q(
    'ex-q-406',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Tại sao trong CPython, phép so sánh danh tính `a is b` với `a = 256; b = 256` luôn trả về `True`, nhưng với số lớn tạo động lúc runtime như `x = int("1000"); y = int("1000")` thì `x is y` lại trả về `False`?',
    `a = int("256")
b = int("256")
x = int("1000")
y = int("1000")
print(a is b, x is y)  # True False`,
    [
      'Vì kiểu `int` trong Python chỉ hỗ trợ giá trị tối đa đến 256 (1 byte).',
      'Vì CPython khởi tạo sẵn và lưu đệm (Small Integer Caching / Singleton Pool) các đối tượng số nguyên nhỏ trong đoạn từ `-5` đến `256` ngay khi khởi động để tái sử dụng; các số ngoài khoảng này được tạo mới trên Heap mỗi lần tính toán.',
      'Vì toán tử `is` tự động chuyển thành `==` khi số nhỏ hơn 256.',
      'Vì hàm `int("1000")` trả về kiểu `float` thay vì `int`.',
    ],
    [
      'Sai. Kiểu `int` trong Python 3 có độ chính xác tùy ý (arbitrary-precision), lớn bao nhiêu cũng được miễn còn RAM.',
      'Chính xác! Do các số từ `-5` đến `256` xuất hiện cực kỳ dày đặc trong các vòng lặp và chỉ số mảng, CPython giữ sẵn một mảng tĩnh các `PyLongObject` này để tránh cấp phát lại bộ nhớ. Do đó tuyệt đối KHÔNG bao giờ dùng `is` để so sánh giá trị số hay chuỗi, phải luôn dùng `==`!',
      'Sai. Toán tử `is` luôn luôn chỉ so sánh địa chỉ bộ nhớ (`id(a) == id(b)`).',
      'Sai. `int("1000")` trả về đối tượng `int` chính hiệu.',
    ],
    1,
    'Lưu ý thêm: nếu gán hằng số `x = 1000; y = 1000` trong cùng một hàm/code block, trình biên dịch bytecode có thể gộp hằng số (constant folding) khiến `x is y` thành `True`, nhưng khi tính toán động lúc runtime chúng sẽ là 2 đối tượng khác địa chỉ. Vì vậy: chỉ dùng `is` cho `None`, `True`, `False` hoặc sentinel objects!',
    'Các số từ `-5` đến `256` giống như tiền lẻ được ngân hàng in sẵn để ngay trên quầy giao dịch dùng chung; còn số lớn như `1000` là séc viết tay mới mỗi lần giao dịch.',
    ['cpython-internals', 'identity-vs-equality']
  ),
  q(
    'ex-q-407',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Khai báo `__slots__ = ("x", "y")` bên trong một class Python mang lại hiệu quả gì về mặt kiến trúc bộ nhớ và có đánh đổi (caveat) quan trọng nào?',
    `class Point2D:
    __slots__ = ("x", "y")
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y`,
    [
      'Loại bỏ từ điển động `__dict__` trên từng instance và thay bằng một mảng con trỏ kích thước cố định (descriptor offset) ngay trong cấu trúc C của đối tượng, giúp giảm 40%–60% RAM khi tạo hàng triệu đối tượng; đổi lại không thể gán thêm thuộc tính tùy ý ngoài `("x", "y")` lúc runtime.',
      'Biến `Point2D` thành class bất biến hoàn toàn giống như `frozen=True` (không thể sửa `p.x = 10`).',
      'Tự động lưu tất cả các đối tượng `Point2D` xuống ổ cứng SSD thay vì RAM.',
      'Cho phép class chạy mà không chịu sự quản lý của GIL.',
    ],
    [
      'Chính xác! Mặc định mỗi instance Python phải cõng một `dict` (`__dict__`) riêng rất tốn RAM. `__slots__` thay thế `__dict__` bằng các slot cố định ở cấp độ C struct và tạo các member descriptors trên class.',
      'Sai. `__slots__` chỉ khóa danh sách TÊN thuộc tính được phép tồn tại, bạn vẫn thay đổi giá trị `p.x = 10` bình thường.',
      'Sai. Đối tượng vẫn nằm trên RAM.',
      'Sai. `__slots__` không liên quan đến GIL.',
    ],
    0,
    'Lưu ý khi kế thừa: nếu lớp con kế thừa từ một lớp có `__slots__` nhưng bản thân lớp con quên khai báo `__slots__ = ()` (hoặc các slot mới), lớp con sẽ tự động tạo lại `__dict__` và làm mất lợi thế tiết kiệm bộ nhớ!',
    'Không dùng `__slots__` giống như phát cho mỗi nhân viên một cái kho chứa đồ co giãn tùy ý (`__dict__`); dùng `__slots__` giống như phát một hộp đựng bút đúc sẵn đúng 2 ngăn `x` và `y` cực kỳ gọn nhẹ.',
    ['dunder-slots', 'memory-optimization']
  ),
  q(
    'ex-q-408',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Khi xây dựng một bộ nhớ đệm (in-memory cache) ánh xạ từ `id` sang đối tượng `User` nặng, tại sao sử dụng `weakref.WeakValueDictionary` lại giúp ngăn chặn lỗi rò rỉ bộ nhớ (Memory Leak) so với dùng một `dict` thông thường?',
    `import weakref

user_cache: weakref.WeakValueDictionary[int, User] = weakref.WeakValueDictionary()`,
    [
      'Vì `dict` thông thường giữ một **tham chiếu mạnh (strong reference)** làm tăng `ob_refcnt` của `User`, khiến đối tượng không bao giờ được giải phóng chừng nào còn nằm trong `dict`; còn `WeakValueDictionary` giữ **tham chiếu yếu (weak reference)** không làm tăng `ob_refcnt`, nên khi không còn nơi nào khác trong chương trình dùng `User` đó nữa, nó sẽ tự động được GC thu hồi và tự biến mất khỏi cache.',
      'Vì `WeakValueDictionary` tự động nén đối tượng `User` bằng thuật toán Gzip.',
      'Vì `WeakValueDictionary` tự động xóa toàn bộ dữ liệu sau mỗi 5 giây.',
      'Vì `dict` thông thường chỉ lưu được tối đa 1000 phần tử.',
    ],
    [
      'Chính xác! Một `dict` toàn cục (`_cache = {}`) không có cơ chế giới hạn kích thước hay TTL là nguyên nhân số 1 gây Memory Leak trong Python. Tham chiếu yếu (`weakref`) cho phép trỏ tới đối tượng mà không ngăn cản việc thu hồi nó khi `ob_refcnt` từ các nguồn khác về 0.',
      'Sai. `weakref` không nén dữ liệu.',
      'Sai. Việc xóa khỏi `WeakValueDictionary` dựa trên vòng đời tham chiếu của đối tượng chứ không dựa trên bộ đếm thời gian cố định.',
      'Sai. `dict` không giới hạn 1000 phần tử.',
    ],
    0,
    'Lưu ý: nếu một class sử dụng `__slots__` và bạn muốn tạo `weakref` tới instance của nó, bạn phải thêm `"__weakref__"` vào tuple `__slots__` (hoặc dùng `@dataclass(slots=True, weakref_slot=True)` trên Python 3.11+).',
    'Tham chiếu mạnh (`dict`) giống như sợi dây xích giữ chặt quả bóng bay không cho bay đi; tham chiếu yếu (`weakref`) giống như ống nhòm quan sát quả bóng: còn người cầm dây thì bạn còn nhìn thấy, người ta buông tay là bóng tự bay mất.',
    ['weakref', 'memory-leak']
  ),
  q(
    'ex-q-409',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Trong **Descriptor Protocol** của Python (cơ chế nền tảng đằng sau `@property`, `@classmethod`, `@staticmethod` và ORM fields), sự khác biệt về **thứ tự ưu tiên tra cứu thuộc tính (`obj.attr`)** giữa **Data Descriptor** (có cả `__get__` và `__set__`/`__delete__`) và **Non-Data Descriptor** (chỉ có `__get__`) so với từ điển `obj.__dict__` của instance là gì?',
    `class DataDesc:
    def __get__(self, obj, owner=None): return "from DataDesc"
    def __set__(self, obj, value): pass

class NonDataDesc:
    def __get__(self, obj, owner=None): return "from NonDataDesc"`,
    [
      'Thứ tự ưu tiên từ cao xuống thấp khi tra cứu `obj.attr`: **(1) Data Descriptor trên Class -> (2) `obj.__dict__` của Instance -> (3) Non-Data Descriptor / thuộc tính thường trên Class**.',
      '`obj.__dict__` luôn luôn được ưu tiên cao nhất trong mọi trường hợp.',
      'Non-Data Descriptor có độ ưu tiên cao hơn Data Descriptor.',
      'Python ném lỗi `AttributeError` nếu tên thuộc tính trong `obj.__dict__` trùng với tên Descriptor trên Class.',
    ],
    [
      'Chính xác! Đây là bí mật cốt lõi nhất của OOP trong Python (`object.__getattribute__`): Data Descriptor chặn đứng mọi truy cập đọc/ghi TRƯỚC cả `obj.__dict__` (để bảo vệ logic kiểm tra kiểu dữ liệu), trong khi Non-Data Descriptor (như một hàm phương thức thông thường hoặc `@cached_property`) có độ ưu tiên THẤP hơn `obj.__dict__`, cho phép ghi đè/lưu cache thẳng vào `obj.__dict__[name]`!',
      'Sai. Nếu `obj.__dict__` ưu tiên cao hơn Data Descriptor thì `@property` có setter sẽ bị vô hiệu hóa nếu ai đó lỡ ghi vào `obj.__dict__`.',
      'Sai. Ngược lại: Data Descriptor > Instance `__dict__` > Non-Data Descriptor.',
      'Sai. Không hề có lỗi, Python phân giải theo đúng chuỗi thứ tự ưu tiên trên.',
    ],
    0,
    'Nhờ quy tắc `Data Descriptor > obj.__dict__ > Non-Data Descriptor`, decorator `@functools.cached_property` được thiết kế là một Non-Data Descriptor (chỉ có `__get__`): lần gọi đầu nó tính kết quả rồi lưu thẳng vào `obj.__dict__["prop_name"]`; từ lần thứ hai trở đi, Python đọc thẳng từ `obj.__dict__` cực nhanh mà không cần gọi lại `__get__` nữa!',
    'Data Descriptor giống như cổng kiểm soát an ninh bắt buộc ở sảnh chính (luôn phải đi qua trước); còn Non-Data Descriptor giống như quầy lễ tân hướng dẫn: nếu trong túi bạn (`obj.__dict__`) đã có sẵn chìa khóa phòng rồi thì bạn đi thẳng lên phòng không cần hỏi lễ tân nữa.',
    ['descriptor-protocol', 'cached-property']
  ),
  q(
    'ex-q-410',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Phương thức dunder `__set_name__(self, owner, name)` (ra mắt từ Python 3.6 - PEP 487) trong một Descriptor giải quyết triệt để vấn đề gì khi thiết kế ORM hoặc Validation fields?',
    `class PositiveNumber:
    def __set_name__(self, owner, name):
        self.private_name = f"_{name}"

    def __get__(self, obj, objtype=None):
        return getattr(obj, self.private_name)

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"{self.private_name[1:]} phải > 0")
        setattr(obj, self.private_name, value)

class Order:
    price = PositiveNumber()     # Không cần viết PositiveNumber("price")!
    quantity = PositiveNumber()`,
    [
      'Tự động được Python gọi ngay tại thời điểm tạo class `owner` (`Order`), truyền vào chính class `Order` và tên biến thuộc tính (`"price"`, `"quantity"`) mà descriptor được gán cho, giúp descriptor biết tên trường của mình mà không bắt lập trình viên phải gõ lặp lại `price = PositiveNumber("price")`.',
      'Dùng để đổi tên class `Order` thành `PositiveNumber` lúc runtime.',
      'Được gọi mỗi khi một instance của `Order` bị xóa bằng lệnh `del`.',
      'Chỉ hoạt động nếu class `Order` kế thừa từ `typing.NamedTuple`.',
    ],
    [
      'Chính xác! Trước khi có `__set_name__`, các thư viện ORM cũ hoặc phải bắt người dùng truyền chuỗi lặp lại `price = Field("price")`, hoặc phải viết một Metaclass phức tạp để quét các thuộc tính. `__set_name__` giúp Descriptor tự nhận biết tên biến được gán cho nó một cách tự nhiên.',
      'Sai. Nó không đổi tên class `owner`.',
      'Sai. Nó chỉ được gọi 1 lần duy nhất cho mỗi thuộc tính vào lúc định nghĩa class (`class Order:` kết thúc).',
      'Sai. Nó hoạt động trên mọi class Python chuẩn.',
    ],
    0,
    'Lưu ý: không bao giờ lưu giá trị của từng instance trực tiếp lên `self.value` của Descriptor (vì Descriptor là biến cấp Class dùng chung cho mọi instance `Order`!). Phải lưu vào `obj` (ví dụ qua `setattr(obj, self.private_name, value)` hoặc `obj.__dict__[self.name] = value`).',
    '`__set_name__` giống như khi nhân viên mới (`PositiveNumber()`) được phân công ngồi vào bàn có biển tên `"price"`, hệ thống tự động báo cho nhân viên đó biết: "Từ giờ bàn của anh tên là `price` nhé!".',
    ['descriptor-protocol', 'set-name']
  ),
  q(
    'ex-q-411',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Trong Python 3.6+, khi bạn chỉ cần tự động đăng ký (register) tất cả các lớp con vào một plugin registry hoặc kiểm tra quy tắc đặt tên hàm của lớp con ngay khi lớp con được định nghĩa, công cụ nào đơn giản và Pythonic hơn nhiều so với việc phải tự viết một **Metaclass**?',
    `class BasePlugin:
    registry: dict[str, type] = {}

    def __init_subclass__(cls, *, plugin_name: str, **kwargs):
        super().__init_subclass__(**kwargs)
        BasePlugin.registry[plugin_name] = cls

class PdfExporter(BasePlugin, plugin_name="pdf"):
    pass`,
    [
      'Hook phương thức lớp `__init_subclass__(cls, **kwargs)` đặt trên lớp cha.',
      'Phương thức `__del__(self)` đặt trên lớp con.',
      'Hàm `globals()` gọi trong `__init__`.',
      'Decorator `@staticmethod` đặt trên hàm tạo.',
    ],
    [
      'Chính xác! `__init_subclass__` (PEP 487) được tự động gọi trên lớp cha mỗi khi có bất kỳ lớp con nào kế thừa nó (thậm chí nhận được cả tham số keyword truyền trên dòng khai báo kế thừa như `plugin_name="pdf"`!), giải quyết 90% nhu cầu từng phải dùng tới Metaclass mà không gây xung đột metaclass.',
      'Sai. `__del__` là finalizer của instance khi thu hồi bộ nhớ.',
      'Sai. `__init__` chỉ chạy khi khởi tạo instance, không chạy khi định nghĩa class.',
      'Sai. `@staticmethod` không phải hook vòng đời tạo class.',
    ],
    0,
    'Quy tắc thực chiến: chỉ viết custom Metaclass (`class Meta(type)`) khi bạn thực sự cần can thiệp vào bản thân quá trình tạo đối tượng class (`__prepare__`, thay đổi `bases` hoặc `namespace` trước khi class hình thành). Còn lại, hãy ưu tiên `__init_subclass__` và `__set_name__`!',
    '`__init_subclass__` giống như quy định của gia tộc (`BasePlugin`): bất cứ hậu duệ nào (`PdfExporter`) vừa chào đời là tự động được ghi tên vào cuốn gia phả (`registry`) kèm biệt danh (`plugin_name="pdf"`).',
    ['init-subclass', 'metaclass']
  ),
  q(
    'ex-q-412',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Trong Python, câu nói *"Mọi class đều là một instance của `type`"* có nghĩa là gì, và cú pháp gọi động `type("User", (Base,), {"role": "admin"})` thực hiện điều gì?',
    ` DynamicUser = type("DynamicUser", (object,), {"role": "admin", "greet": lambda self: "Hi"})
u = DynamicUser()
print(u.role, u.greet(), type(DynamicUser))`,
    [
      'Gọi `type(name, bases, namespace_dict)` với 3 đối số chính là hàm tạo của Metaclass gốc `type`: nó tạo và trả về một **Class mới** ngay tại runtime hoàn toàn tương đương với việc viết từ khóa `class DynamicUser(object): ...`. Kết quả in ra `admin Hi <class \'type\'>`.',
      'Hàm `type()` chỉ dùng để kiểm tra kiểu của 1 biến, truyền 3 đối số sẽ gây lỗi `TypeError`.',
      'Nó tạo ra một từ điển `dict` có 3 phần tử.',
      'Nó biên dịch chuỗi `"DynamicUser"` thành file `.pyc` trên ổ cứng.',
    ],
    [
      'Chính xác! Khi trình thông dịch gặp khối lệnh `class Foo(Bar): x = 1`, bên dưới hậu trường nó thực thi thân class để thu thập từ điển namespace `{"x": 1}`, rồi gọi `Foo = type("Foo", (Bar,), namespace)`. Bản thân class `Foo` là một đối tượng trên RAM có kiểu là `type`!',
      'Sai. `type(obj)` với 1 đối số trả về kiểu của `obj`, nhưng `type(name, bases, dict)` với 3 đối số là constructor tạo class mới.',
      'Sai. Kết quả trả về là một class (kiểu `type`), có thể khởi tạo instance `u = DynamicUser()` ngay.',
      'Sai. Toàn bộ quá trình tạo class diễn ra trên bộ nhớ RAM lúc runtime.',
    ],
    0,
    'Chuỗi quan hệ trong Python: `u` là instance của class `DynamicUser` (`type(u) is DynamicUser`), còn bản thân class `DynamicUser` là instance của metaclass `type` (`type(DynamicUser) is type`).',
    'Nếu `Class` là chiếc khuôn đúc bánh và `Instance` là chiếc bánh, thì `Metaclass` (`type`) chính là nhà máy cơ khí đúc ra những chiếc khuôn bánh đó!',
    ['metaclass', 'type-constructor']
  ),
  q(
    'ex-q-413',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Khi chuyển từ TypeScript sang Python hiện đại, công cụ nào trong module `typing` cho phép biểu diễn **Structural Subtyping (Static Duck Typing)** giống hệt như `interface` của TypeScript — tức là một class chỉ cần có đủ các phương thức/thuộc tính khớp chữ ký là được chấp nhận mà KHÔNG cần kế thừa tường minh?',
    `from typing import Protocol

class Renderable(Protocol):
    def render(self) -> str: ...

class HtmlWidget:  # Không hề kế thừa Renderable!
    def render(self) -> str:
        return "<div>Hello</div>"

def draw(item: Renderable) -> str:
    return item.render()

draw(HtmlWidget())  # Hợp lệ với mypy / pyright!`,
    [
      '`abc.ABC` và `@abc.abstractmethod`',
      '`typing.Protocol` (PEP 544)',
      '`typing.TypedDict`',
      '`typing.NewType`',
    ],
    [
      'Sai. `abc.ABC` là Nominal Subtyping (kế thừa danh nghĩa): bắt buộc `class HtmlWidget(Renderable)` hoặc phải gọi `Renderable.register(HtmlWidget)` tường minh.',
      'Chính xác! `typing.Protocol` mang triết lý structural typing của TypeScript `interface` và Go `interface` vào Python: `HtmlWidget` không cần biết sự tồn tại của `Renderable`, miễn là nó có phương thức `render(self) -> str` là Pyright/Mypy xác nhận hợp lệ.',
      'Sai. `TypedDict` chỉ dùng để định nghĩa kiểu cho từ điển `dict` có các key chuỗi cố định.',
      'Sai. `NewType` dùng để tạo kiểu danh nghĩa phân biệt trên một kiểu có sẵn (như `UserId = NewType("UserId", int)`).',
    ],
    1,
    '`typing.Protocol` là công cụ quan trọng nhất để áp dụng nguyên lý Dependency Inversion (Clean Architecture) trong Python mà không tạo sự phụ thuộc cứng (coupling) giữa các tầng.',
    '`abc.ABC` đòi hỏi phải có "giấy chứng nhận huyết thống" (kế thừa tường minh); còn `typing.Protocol` giống hệt `interface` của TypeScript: "Đi như vịt, kêu như vịt thì chính là vịt!".',
    ['typing-protocol', 'structural-typing']
  ),
  q(
    'ex-q-414',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Mặc định `typing.Protocol` chỉ được kiểm tra bởi các công cụ phân tích tĩnh (như Pyright/Mypy). Nếu bạn muốn sử dụng `isinstance(obj, Renderable)` ngay lúc **runtime**, bạn cần thêm decorator nào và giới hạn của việc kiểm tra runtime đó là gì?',
    `from typing import Protocol, runtime_checkable

@runtime_checkable
class Closable(Protocol):
    def close(self) -> None: ...`,
    [
      'Thêm `@runtime_checkable`; lúc runtime `isinstance(obj, Closable)` chỉ kiểm tra sự TỒN TẠI của tên thuộc tính/phương thức (`hasattr(obj, "close")`), chứ KHÔNG kiểm tra chữ ký tham số hay kiểu trả về của phương thức đó.',
      'Thêm `@dataclass`; lúc runtime nó kiểm tra đầy đủ cả kiểu dữ liệu của từng tham số và kiểu trả về.',
      'Thêm `@staticmethod`; lúc runtime nó biên dịch class sang Rust để kiểm tra kiểu.',
      'Không có cách nào dùng `isinstance()` với `Protocol` lúc runtime.',
    ],
    [
      'Chính xác! `@runtime_checkable` cho phép gọi `isinstance()` và `issubclass()` trên `Protocol`, nhưng vì hiệu năng và bản chất động của Python, nó chỉ kiểm tra đối tượng có thuộc tính `close` hay không chứ không kiểm tra `close` nhận mấy tham số hay trả về kiểu gì.',
      'Sai. `@dataclass` không biến Protocol thành runtime checkable.',
      'Sai. `@staticmethod` dùng cho phương thức trong class.',
      'Sai. `@runtime_checkable` được cung cấp sẵn trong module `typing` cho mục đích này.',
    ],
    0,
    'Hãy cẩn thận khi dùng `@runtime_checkable` trong vòng lặp nóng (hot loop) với các Protocol có nhiều thuộc tính, vì mỗi lệnh `isinstance(x, MyProtocol)` sẽ phải tra cứu từng tên thuộc tính của Protocol trên đối tượng `x`.',
    '`@runtime_checkable` giống như bảo vệ kiểm tra nhanh ở cổng: chỉ nhìn xem bạn có mang thẻ tên `"close"` trên ngực hay không, chứ không đọc chi tiết nội dung bên trong thẻ.',
    ['typing-protocol', 'runtime-checkable']
  ),
  q(
    'ex-q-415',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Trong Python 3.12+ (PEP 695), cú pháp khai báo hàm Generic và Type Alias mới nào đã thay thế cách khai báo `T = TypeVar("T")` và `TypeAlias` rườm rà trước đây?',
    `# Cú pháp PEP 695 (Python 3.12+)
type Vector[T] = list[T]

def first_item[T](items: Sequence[T]) -> T:
    return items[0]`,
    [
      'Dùng ngoặc vuông trực tiếp sau tên hàm `def func[T](...)` / tên class `class Box[T]:` và từ khóa mềm `type Alias[T] = ...` mà không cần phải `from typing import TypeVar, Generic`.',
      'Dùng dấu ngoặc nhọn `def func<T>(...)` giống hệt C++ và TypeScript.',
      'Dùng ký hiệu `@generic("T")` đặt trước hàm.',
      'Bắt buộc phải viết kiểu dữ liệu trong chuỗi comment `# type: [T]`.',
    ],
    [
      'Chính xác! PEP 695 (Python 3.12+) giới thiệu cú pháp `[T]` gọn gàng, có phạm vi từ vựng (lexical scope) rõ ràng và từ khóa `type Name = ...` hỗ trợ cả generic lẫn đệ quy kiểu (recursive types) mà không cần import `TypeVar` hay `Generic`.',
      'Sai. Python sử dụng ngoặc vuông `[T]` cho generics chứ không dùng ngoặc nhọn `<T>`.',
      'Sai. Không có decorator `@generic` chuẩn.',
      'Sai. Type comment là di sản từ thời Python 2.7.',
    ],
    0,
    'PEP 695 còn hỗ trợ ràng buộc kiểu biên trực tiếp trong ngoặc vuông như `def max_val[T: (int, float)](a: T, b: T) -> T:` hoặc `def process[T: BaseModel](model: T) -> T:`.',
    'Giống như generics `<T>` trong TypeScript (`function firstItem<T>(items: T[]): T`), chỉ khác là Python dùng cặp ngoặc vuông `[T]` đồng nhất trên toàn ngôn ngữ.',
    ['pep-695', 'generics']
  ),
  q(
    'ex-q-416',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Tại sao trong hệ thống kiểu (Type System) của Python, nếu `Dog` là lớp con của `Animal`, thì `list[Dog]` lại **KHÔNG** được coi là kiểu con của `list[Animal]` (tức là `list` có tính bất biến kiểu - **Invariant**), trong khi `Sequence[Dog]` lại là kiểu con hợp lệ của `Sequence[Animal]` (**Covariant**)?',
    `class Animal: pass
class Dog(Animal): pass
class Cat(Animal): pass

def add_cat(animals: list[Animal]) -> None:
    animals.append(Cat())

dogs: list[Dog] = [Dog()]
# Tại sao Pyright/Mypy báo lỗi khi gọi add_cat(dogs)?`,
    [
      'Vì `list` là một container **khả biến (mutable)**: nếu cho phép truyền `list[Dog]` vào hàm nhận `list[Animal]`, hàm đó có thể gọi `.append(Cat())` và nhét một con Mèo vào danh sách Chó `dogs`, phá vỡ tính an toàn kiểu! Ngược lại `Sequence` là giao diện **chỉ đọc (read-only)** nên an toàn để đồng biến (Covariant).',
      'Vì lỗi bug của trình kiểm tra kiểu Mypy chưa được sửa.',
      'Vì `Dog` không thể đặt trong `list` mà chỉ đặt được trong `tuple`.',
      'Vì `Sequence` chỉ chấp nhận kiểu dữ liệu nguyên thủy như `int` và `str`.',
    ],
    [
      'Chính xác! Đây là nguyên lý nền tảng của Variance trong lý thuyết kiểu: các cấu trúc khả biến (`list`, `dict`, `set`) phải là **Invariant** (bất biến kiểu) để bảo vệ cả chiều đọc lẫn chiều ghi; còn các giao diện chỉ đọc (`Sequence`, `Mapping`, `Iterable`, `tuple`) là **Covariant** (đồng biến theo kiểu con).',
      'Sai. Đây là thiết kế cố ý hoàn toàn chuẩn xác (cũng là điểm Python chặt chẽ hơn TypeScript vốn cho phép mảng khả biến covariant một cách kém an toàn).',
      'Sai. `list[Dog]` hoàn toàn hợp lệ.',
      'Sai. `Sequence[T]` dùng được cho mọi kiểu `T`.',
    ],
    0,
    'Quy tắc thực chiến cho chữ ký hàm (Function Signatures): ở tham số đầu vào nếu hàm chỉ đọc dữ liệu, hãy khai báo `Sequence[Animal]` hoặc `Iterable[Animal]` thay vì `list[Animal]` để người gọi truyền được cả `list[Dog]`, `tuple[Dog, ...]`, v.v.!',
    'Nếu bạn chỉ cho người ta XEM album ảnh Chó (`Sequence[Dog]`), người muốn xem ảnh Động vật (`Sequence[Animal]`) xem hoàn toàn ổn; nhưng nếu đưa cuốn sổ cho phép DÁN THÊM ảnh Động vật bất kỳ (`list[Animal]`), họ sẽ dán ảnh Mèo vào cuốn sổ chỉ dành riêng cho Chó của bạn!',
    ['type-variance', 'covariance-invariance']
  ),
  q(
    'ex-q-417',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Khi viết một Decorator bọc quanh một hàm bất kỳ, tại sao chỉ dùng `TypeVar` là không đủ để giữ nguyên gợi ý kiểu (autocomplete) các tham số của hàm gốc trên IDE, mà phải dùng `ParamSpec` (`P` hoặc `**P` trong Python 3.12+)?',
    `from typing import Callable

def log_call[**P, R](func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper`,
    [
      'Vì `TypeVar` chỉ đại diện cho một kiểu đơn lẻ, không thể nắm bắt toàn bộ chữ ký danh sách tham số vị trí (`*args`) và tham số từ khóa (`**kwargs`) của một hàm; còn `ParamSpec` (`**P`) được thiết kế đặc biệt để chụp và chuyển tiếp nguyên vẹn toàn bộ parameter specification của `func` sang `wrapper`.',
      'Vì `ParamSpec` giúp hàm chạy nhanh hơn 2 lần lúc runtime.',
      'Vì `TypeVar` đã bị xóa bỏ hoàn toàn khỏi Python 3.12.',
      'Vì `ParamSpec` tự động kiểm tra kiểu dữ liệu của `*args` lúc runtime giống như Pydantic.',
    ],
    [
      'Chính xác! Nhờ `ParamSpec` (PEP 612, và cú pháp `[**P, R]` trong PEP 695), khi bạn trang trí `@log_call` lên hàm `def create_user(name: str, age: int = 18) -> User`, IDE vẫn giữ nguyên gợi ý tên tham số `name`, `age`, kiểu mặc định và kiểu trả về `User`.',
      'Sai. Type hints không làm tăng tốc độ thực thi runtime.',
      'Sai. `TypeVar` vẫn tồn tại cho các kiểu giá trị thông thường (như kiểu trả về `R`).',
      'Sai. `ParamSpec` là công cụ cho static type checker, không tự validate lúc runtime.',
    ],
    0,
    'Nếu decorator của bạn có thêm hoặc bớt tham số đầu tiên (ví dụ tiêm thêm đối tượng `Request` hoặc `self`), bạn có thể kết hợp `Concatenate[Request, P]` cùng với `ParamSpec`.',
    '`ParamSpec` giống như `Parameters<T>` trong TypeScript (`(...args: Parameters<F>) => ReturnType<F>`), giúp sao chép y nguyên khuôn mặt chữ ký tham số của hàm gốc sang hàm bọc.',
    ['paramspec', 'typing-decorator']
  ),
  q(
    'ex-q-418',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Khi định nghĩa kiểu cho một từ điển JSON trả về từ API bằng `typing.TypedDict`, làm thế nào để khai báo một số trường là bắt buộc (required) và một số trường là tùy chọn có thể vắng mặt (optional keys) theo chuẩn Python 3.11+ (PEP 655)?',
    `from typing import TypedDict, NotRequired

class UserPayload(TypedDict):
    id: int
    username: str
    bio: NotRequired[str]`,
    [
      'Sử dụng `NotRequired[T]` cho các key có thể không xuất hiện trong dict (hoặc dùng `total=False` kết hợp `Required[T]`); lưu ý phân biệt rõ: `NotRequired[str]` nghĩa là key `"bio"` có thể vắng mặt, còn `str | None` nghĩa là key `"bio"` bắt buộc phải có mặt dù giá trị có thể là `None`.',
      'Chỉ cần viết `bio: str | None` là key `"bio"` tự động được phép vắng mặt khỏi dict.',
      'Đặt dấu hỏi chấm sau tên trường `bio?: str` giống như TypeScript.',
      '`TypedDict` tự động ép kiểu và xóa các key thừa ngay lúc runtime khi khởi tạo dict.',
    ],
    [
      'Chính xác! Đây là điểm người chuyển từ TS sang Python rất hay nhầm: trong `TypedDict`, `bio: str | None` yêu cầu dict phải có `{"id": 1, "username": "a", "bio": None}`; muốn cho phép bỏ qua luôn key `"bio"` (giống `bio?: string` của TS), phải dùng `NotRequired[str]`.',
      'Sai. `str | None` chỉ cho phép giá trị là `None`, không cho phép thiếu key trong `TypedDict` mặc định (`total=True`).',
      'Sai. Python không có cú pháp `bio?: str` trực tiếp trên tên biến.',
      'Sai. `TypedDict` ở runtime chỉ tạo ra một `dict` bình thường, không hề validate hay xóa key thừa (muốn validate runtime phải dùng Pydantic hoặc `TypeAdapter`).',
    ],
    0,
    '`NotRequired[T]` và `Required[T]` (PEP 655) giúp mô hình hóa chính xác các JSON payload hỗn hợp mà không cần phải tách thành 2 class `TypedDict` kế thừa nhau như thời Python 3.8.',
    '`NotRequired[str]` trong Python chính là `bio?: string` trong TypeScript; còn `bio: str | None` chính là `bio: string | null` (bắt buộc có key).',
    ['typeddict', 'not-required']
  ),
  q(
    'ex-q-419',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Kiểu `typing.Annotated[T, metadata, ...]` (PEP 593) hoạt động như thế nào đối với trình kiểm tra kiểu tĩnh (Mypy/Pyright) và đối với các framework runtime (như FastAPI, Pydantic v2, Typer)?',
    `from typing import Annotated
from fastapi import Query
from pydantic import Field

PositiveInt = Annotated[int, Field(gt=0, description="Số nguyên dương")]`,
    [
      'Trình kiểm tra kiểu tĩnh coi `Annotated[int, ...]` chính xác là kiểu `int` và bỏ qua phần metadata; trong khi lúc runtime, các framework như Pydantic/FastAPI đọc phần metadata đính kèm (`Field(gt=0)`, `Query()`, `Depends()`) qua `typing.get_type_hints(..., include_extras=True)` để thực hiện validation hoặc Dependency Injection!',
      '`Annotated` tự động kiểm tra điều kiện `gt=0` bằng trình thông dịch CPython mà không cần bất kỳ thư viện nào.',
      '`Annotated` biến kiểu `int` thành kiểu chuỗi `str` để lưu phần mô tả.',
      '`Annotated` đã bị khai tử trong Python 3.12.',
    ],
    [
      'Chính xác! `Annotated` là cầu nối tuyệt vời giữa Static Typing và Runtime Metadata: giữ cho giá trị mặc định của hàm sạch sẽ (`def get_items(limit: Annotated[int, Query(le=100)] = 20)`) thay vì phải gán `limit: int = Query(default=20, le=100)`.',
      'Sai. Bản thân CPython không thực thi logic trong metadata của `Annotated`; chính thư viện như Pydantic/FastAPI mới là bên đọc và thực thi.',
      'Sai. Kiểu cơ sở vẫn giữ nguyên là `T` (`int`).',
      'Sai. `Annotated` đang là chuẩn mực hiện đại nhất được FastAPI và Pydantic v2 khuyến nghị mạnh mẽ.',
    ],
    0,
    'Dùng `Annotated` giúp bạn định nghĩa một lần các kiểu dữ liệu miền nghiệp vụ như `EmailStr`, `PositiveAmount`, `CurrentUser = Annotated[User, Depends(get_current_user)]` và tái sử dụng khắp toàn bộ dự án.',
    '`Annotated[int, Field(gt=0)]` giống như tờ tiền mệnh giá `int` có dán thêm một mẩu giấy ghi chú (`Field(gt=0)`): máy đếm tiền (static type checker) chỉ quan tâm mệnh giá `int`, còn nhân viên kiểm ngân (Pydantic/FastAPI) sẽ đọc thêm tờ ghi chú để kiểm tra điều kiện.',
    ['typing-annotated', 'pydantic-v2']
  ),
  q(
    'ex-q-420',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Khi viết một hàm kiểm tra kiểu tùy chỉnh trả về `bool` để thu hẹp kiểu dữ liệu (Type Narrowing), sự khác biệt giữa `typing.TypeGuard[T]` (Python 3.10) và `typing.TypeIs[T]` (Python 3.13 - PEP 742) là gì?',
    `from typing import TypeIs

def is_str_list(val: list[object]) -> TypeIs[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(val: int | str) -> None:
    if is_str(val):
        # Ở đây val là str
        ...
    else:
        # Với TypeIs[str], ở nhánh else này val được thu hẹp thành kiểu gì?`,
    [
      '`TypeIs[T]` thông minh hơn `TypeGuard[T]` vì nó thu hẹp kiểu ở **cả hai nhánh**: trong nhánh `if` biến được thu hẹp thành `T` (`str`), VÀ trong nhánh `else` biến được loại trừ `T` để thu hẹp thành kiểu còn lại (`int`) — giống hệt hành vi của `val is string` trong TypeScript! Còn `TypeGuard[T]` chỉ thu hẹp ở nhánh `if`, nhánh `else` vẫn giữ nguyên `int | str`.',
      '`TypeGuard[T]` tự động ném ngoại lệ nếu kết quả là `False`, còn `TypeIs[T]` thì không.',
      '`TypeIs[T]` chỉ dùng được cho kiểu số nguyên `int`.',
      'Hai kiểu này hoàn toàn giống hệt nhau, chỉ đổi tên cho ngắn gọn.',
    ],
    [
      'Chính xác! Với `TypeGuard`, nhánh `else` không được thu hẹp kiểu. PEP 742 giới thiệu `TypeIs[T]` mang lại hành vi Type Predicate chuẩn xác ở cả nhánh `True` (`if`) lẫn nhánh `False` (`else`), tương đương trực tiếp với `x is T` trong TypeScript.',
      'Sai. Cả hai chỉ là type annotation cho hàm trả về `bool`, không thay đổi hành vi runtime.',
      'Sai. `TypeIs[T]` dùng được với mọi kiểu `T` tương thích với kiểu đầu vào.',
      'Sai. Khác biệt về thu hẹp kiểu ở nhánh `else` và yêu cầu `T` phải tương thích với kiểu đầu vào là lý do chính PEP 742 ra đời.',
    ],
    0,
    'Khi viết các hàm helper kiểm tra kiểu trong Python 3.13+ (hoặc qua `typing_extensions.TypeIs`), hãy ưu tiên dùng `TypeIs[T]` thay cho `TypeGuard[T]` để trình kiểm tra kiểu hiểu đúng cả hai nhánh `if/else`.',
    '`TypeIs[str]` giống hệt chữ ký `function isStr(val: number | string): val is string` trong TypeScript: nếu không phải `str` ở nhánh `if` thì sang nhánh `else` chắc chắn nó phải là `number`.',
    ['typeis', 'typeguard', 'type-narrowing']
  ),
  q(
    'ex-q-421',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Đoạn code dưới đây minh họa hiện tượng gì khi sử dụng Đa kế thừa (Multiple Inheritance) trong Python và thứ tự các dòng được in ra theo thuật toán **C3 Linearization (MRO)** là gì?',
    `class A:
    def ping(self):
        print("A", end=" ")

class B(A):
    def ping(self):
        print("B", end=" ")
        super().ping()

class C(A):
    def ping(self):
        print("C", end=" ")
        super().ping()

class D(B, C):
    def ping(self):
        print("D", end=" ")
        super().ping()

D().ping()`,
    [
      'In ra `D B C A `: hàm `super()` KHÔNG gọi "lớp cha trực tiếp của class hiện tại", mà gọi **lớp tiếp theo trong chuỗi MRO (`D.__mro__` là `[D, B, C, A, object]`)** của đối tượng đang chạy; nhờ đó `super().ping()` bên trong `B` nhảy sang `C` rồi mới về `A`, giúp `A.ping()` chỉ chạy đúng 1 lần!',
      'In ra `D B A ` vì `B` kế thừa trực tiếp từ `A` nên `C` bị bỏ qua hoàn toàn.',
      'In ra `D B A C A ` (hàm của `A` bị gọi lặp lại 2 lần).',
      'Ném lỗi `TypeError: Diamond inheritance is forbidden` lúc tạo class `D`.',
    ],
    [
      'Chính xác! Đây là sức mạnh của **Cooperative Multiple Inheritance**: trong `B.ping()`, mặc dù `B` chỉ khai báo `class B(A)`, nhưng khi gọi trên một instance của `D`, `super()` tra cứu theo `D.__mro__` (`D -> B -> C -> A`), nên sau `B` là `C`, và sau `C` mới là `A`.',
      'Sai. `super()` không bị đóng cứng vào `A` tại thời điểm viết `B`, mà phụ thuộc vào MRO của `self` (`D`).',
      'Sai. Thuật toán C3 Linearization đảm bảo mỗi lớp tổ tiên chung (`A`) trong hình thoi kế thừa chỉ được ghé thăm đúng 1 lần sau khi tất cả các lớp con của nó (`B`, `C`) đã chạy xong.',
      'Sai. Python hỗ trợ đa kế thừa hình thoi (Diamond Inheritance) rất chặt chẽ qua C3 MRO.',
    ],
    0,
    'Hãy ghi nhớ: trong Python, `super()` không có nghĩa là "parent class", mà có nghĩa là **"next class in MRO" (lớp kế tiếp trong hàng đợi MRO của `self`)**.',
    'Giống như truyền mic phát biểu theo danh sách hàng đợi MRO đã xếp sẵn `[D, B, C, A]`: `B` phát biểu xong bấm nút `super()` là chuyển mic cho người đứng ngay sau mình trong hàng (`C`), chứ không chuyển thẳng cho ông tổ `A`.',
    ['mro-c3', 'super-function']
  ),
  q(
    'ex-q-422',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Sự khác biệt chính xác giữa hai phương thức dunder `__getattr__(self, name)` và `__getattribute__(self, name)` trong một class Python là gì?',
    `class DynamicProxy:
    def __init__(self):
        self.real_attr = 42

    def __getattr__(self, name: str):
        return f"Fallback for {name}"`,
    [
      '`__getattribute__` được gọi một cách **vô điều kiện cho MỌI** lần truy cập thuộc tính `obj.x` (dù thuộc tính đó có tồn tại hay không); còn `__getattr__` chỉ được gọi như một **chốt chặn cuối cùng (fallback)** khi quá trình tra cứu bình thường không tìm thấy thuộc tính và sắp sửa ném `AttributeError`.',
      '`__getattr__` chạy cho mọi thuộc tính, còn `__getattribute__` chỉ chạy cho các thuộc tính bắt đầu bằng hai dấu gạch dưới `__`.',
      'Hai phương thức hoàn toàn giống nhau, `__getattr__` là tên viết tắt của `__getattribute__`.',
      'Bên trong `__getattribute__`, ta có thể viết `return self.real_attr` một cách an toàn mà không sợ đệ quy vô tận.',
    ],
    [
      'Chính xác! Với `DynamicProxy` ở trên, khi truy cập `obj.real_attr`, Python tìm thấy trong `obj.__dict__` nên trả về `42` và KHÔNG gọi `__getattr__`. Chỉ khi gọi `obj.missing`, quá trình tìm kiếm thất bại thì `__getattr__(self, "missing")` mới được kích hoạt.',
      'Sai. Ngược lại hoàn toàn.',
      'Sai. Cơ chế kích hoạt và mức độ nguy hiểm đệ quy của hai hàm khác hẳn nhau.',
      'Sai. Nếu viết `self.real_attr` bên trong `__getattribute__`, nó sẽ lại gọi chính `__getattribute__` gây lỗi `RecursionError` ngay lập tức (phải gọi `super().__getattribute__(name)` hoặc `object.__getattribute__(self, name)`).',
    ],
    0,
    'Trong 99% trường hợp cần tạo thuộc tính động hoặc proxy/delegation object, hãy cài đặt `__getattr__` thay vì `__getattribute__` để vừa nhanh cho các thuộc tính có sẵn, vừa tránh bẫy đệ quy vô tận (`RecursionError`).',
    '`__getattribute__` là trạm thu phí chặn kiểm tra 100% mọi chiếc xe đi qua; còn `__getattr__` là đội cứu hộ chỉ xuất hiện khi xe đã đi lạc đường không tìm thấy địa chỉ (`AttributeError`).',
    ['dunder-getattr', 'dunder-getattribute']
  ),
  q(
    'ex-q-423',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Trong CPython 3.11+ (PEP 659), cơ chế **Specializing Adaptive Interpreter** đã giúp tăng tốc độ thực thi Python từ 10%–60% bằng kỹ thuật gì mà vẫn giữ nguyên tính động của ngôn ngữ?',
    `def add(a, b):
    return a + b  # Bytecode BINARY_OP sẽ biến đổi thế nào khi chạy lặp lại với int?`,
    [
      'Khi một chỉ thị bytecode tổng quát (như `BINARY_OP`, `LOAD_ATTR`, `CALL`) được thực thi lặp đi lặp lại với cùng một kiểu dữ liệu (ví dụ toàn số nguyên `int`), trình thông dịch tự động thay thế nóng (quickening) chỉ thị đó ngay tại chỗ bằng phiên bản chuyên biệt hóa cực nhanh (như `BINARY_OP_ADD_INT`), đồng thời giữ chốt kiểm tra (guard) để quay lui (deoptimize) nếu kiểu dữ liệu đột ngột thay đổi.',
      'Bắt buộc lập trình viên phải khai báo kiểu tĩnh cho mọi biến thì code mới chạy được.',
      'Tự động dịch toàn bộ file `.py` sang ngôn ngữ C++ rồi gọi trình biên dịch `gcc` trước khi chạy.',
      'Loại bỏ hoàn toàn cơ chế kiểm tra kiểu của đối tượng lúc runtime.',
    ],
    [
      'Chính xác! Thay vì mỗi lần thực hiện `a + b` đều phải hỏi `type(a)` là gì rồi tra bảng phương thức `__add__` từ đầu, CPython 3.11+ quan sát kiểu dữ liệu lúc chạy và tự chuyên biệt hóa bytecode (ví dụ `BINARY_OP_ADD_INT`, `BINARY_OP_ADD_FLOAT`, `LOAD_ATTR_INSTANCE_VALUE`), kèm inline cache.',
      'Sai. PEP 659 hoàn toàn tự động dựa trên kiểu dữ liệu thực tế lúc runtime, không phụ thuộc vào type annotations.',
      'Sai. Nó biến đổi trực tiếp bytecode trên bộ nhớ mà không cần gọi trình biên dịch C++ ngoài.',
      'Sai. Nó vẫn có bước kiểm tra nhanh (type guard); nếu truyền một `str` vào hàm đang chuyên biệt hóa cho `int`, nó sẽ deoptimize an toàn.',
    ],
    0,
    'Nhờ Specializing Adaptive Interpreter (PEP 659), việc giữ cho các biến và hàm có kiểu dữ liệu đồng nhất (monomorphic) không chỉ giúp code sạch hơn mà còn giúp CPython 3.11+ duy trì trạng thái bytecode chuyên biệt hóa nhanh nhất.',
    'Giống như nhân viên pha chế thấy 100 khách liên tiếp đều gọi Cà phê sữa đá nên để sẵn nguyên liệu ngay tầm tay (`BINARY_OP_ADD_INT`) để pha trong 2 giây; nhưng nếu khách thứ 101 gọi Trà đào thì vẫn mở tủ lấy nguyên liệu chuẩn bình thường (deoptimize).',
    ['cpython-internals', 'pep-659']
  ),
  q(
    'ex-q-424',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Khi nào bạn nên sử dụng hàm `sys.intern(string)` trong CPython và nó mang lại lợi ích hiệu năng gì khi xử lý hàng triệu chuỗi lặp lại (như tên cột, mã danh mục, token)?',
    `import sys

s1 = sys.intern("status_active_verified")
s2 = sys.intern("".join(["status", "_active", "_verified"]))
print(s1 is s2)  # True!`,
    [
      '`sys.intern()` đăng ký chuỗi vào bảng String Interning Pool nội bộ để mọi chuỗi có cùng nội dung đều trỏ về **duy nhất 1 đối tượng trên RAM**; nhờ đó tiết kiệm bộ nhớ lớn và biến phép so sánh chuỗi từ `O(K)` (so từng ký tự) thành `O(1)` (chỉ so sánh địa chỉ con trỏ `s1 is s2`)!',
      '`sys.intern()` mã hóa chuỗi bằng thuật toán SHA-256 để bảo mật mật khẩu.',
      '`sys.intern()` cho phép chỉnh sửa trực tiếp từng ký tự của chuỗi `str` mà không tạo chuỗi mới.',
      '`sys.intern()` tự động dịch chuỗi sang ngôn ngữ mặc định của hệ điều hành.',
    ],
    [
      'Chính xác! Mặc định CPython tự động intern các chuỗi có hình dạng giống tên định danh (identifier-like literals) lúc biên dịch, nhưng các chuỗi đọc từ file/JSON/network lúc runtime thì không. Dùng `sys.intern()` chủ động giúp khử trùng lặp bộ nhớ và tăng tốc tra cứu/so sánh chuỗi cực mạnh.',
      'Sai. `sys.intern` không phải hàm băm mật mã học.',
      'Sai. Chuỗi `str` trong Python luôn bất biến (immutable).',
      'Sai. Không liên quan tới i18n/dịch thuật.',
    ],
    0,
    'Bản thân CPython sử dụng string interning cho tất cả tên biến, tên hàm và tên thuộc tính để việc tra cứu trong các từ điển namespace (`__dict__`) đạt tốc độ so sánh con trỏ nhanh nhất.',
    'Thay vì in 1 triệu bản sao cùng một cuốn từ điển phát cho 1 triệu người (tốn giấy và muốn biết 2 cuốn giống nhau phải đọc so từng trang), thư viện chỉ giữ 1 cuốn gốc tại địa chỉ cố định và phát thẻ tham chiếu (`sys.intern`): thấy cùng mã địa chỉ là biết ngay giống hệt nhau trong tích tắc `O(1)`.',
    ['string-interning', 'cpython-internals']
  ),
  q(
    'ex-q-425',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Sự khác biệt giữa kiểu `typing.Literal["pending", "paid", "cancelled"]` và `enum.StrEnum` khi mô hình hóa tập hợp các giá trị trạng thái cố định là gì?',
    `from typing import Literal
from enum import StrEnum

OrderStatusLiteral = Literal["pending", "paid", "cancelled"]

class OrderStatusEnum(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"`,
    [
      '`Literal[...]` là một ràng buộc kiểu tĩnh thuần túy (lúc runtime giá trị chỉ là chuỗi `"paid"` thông thường, không có namespace nhóm các hằng số nhưng cực tiện cho các hàm nhận chuỗi trực tiếp); còn `StrEnum` tạo ra một class thực sự lúc runtime (cho phép duyệt `list(OrderStatusEnum)`, truy cập `OrderStatusEnum.PAID` an toàn không sợ gõ sai, đồng thời vẫn kế thừa `str` nên serialize JSON trực tiếp được).',
      '`Literal` tự động ném lỗi `ValueError` ngay khi gán biến bằng chuỗi khác trong Python thuần.',
      '`StrEnum` không thể so sánh trực tiếp `OrderStatusEnum.PAID == "paid"` vì khác kiểu.',
      '`Literal` chỉ chấp nhận kiểu chuỗi, không chấp nhận số nguyên hay boolean.',
    ],
    [
      'Chính xác! Trong Python 3.11+, `StrEnum` kế thừa từ cả `str` và `Enum` nên `OrderStatusEnum.PAID == "paid"` là `True` (rất hợp cho tầng Domain/DB), trong khi `Literal["asc", "desc"]` cực kỳ gọn nhẹ cho các tham số hàm hoặc Discriminated Unions trong Pydantic.',
      'Sai. Trong Python thuần (không qua Pydantic), `Literal` chỉ được kiểm tra bởi static type checker như Pyright/Mypy.',
      'Sai. Điểm ăn tiền nhất của `StrEnum` (khác với `Enum` thường) là thành viên của nó đồng thời là một `str`, nên `OrderStatusEnum.PAID == "paid"` trả về `True`!',
      'Sai. `Literal` chấp nhận `int`, `str`, `bytes`, `bool`, thành viên `Enum` và `None` (ví dụ `Literal[200, 404, True]`).',
    ],
    0,
    'Đặc biệt trong Pydantic v2, trường `kind: Literal["card", "bank"]` còn được dùng làm **Discriminator** cho Tagged Union (`Field(discriminator="kind")`), giúp Pydantic chọn đúng model để validate trong `O(1)` thay vì thử từng model.',
    '`Literal["a", "b"]` giống hệt union type `"a" | "b"` của TypeScript; còn `StrEnum` giống như một đối tượng hằng số vừa có namespace chấm thuộc tính, vừa dùng thẳng như chuỗi.',
    ['typing-literal', 'strenum']
  ),
  q(
    'ex-q-426',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Tại sao trong các dự án lớn có nhiều model liên kết chéo nhau, các lập trình viên thường kết hợp `from __future__ import annotations` (PEP 563) với khối `if TYPE_CHECKING:` từ module `typing`?',
    `from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.order import Order  # Không chạy lúc runtime!

class Customer:
    def get_orders(self) -> list[Order]:
        ...`,
    [
      'Vì hằng số `TYPE_CHECKING` luôn bằng `False` lúc chạy chương trình thực tế (runtime) nhưng được trình kiểm tra kiểu (Mypy/Pyright) coi là `True` lúc phân tích tĩnh; kết hợp với `from __future__ import annotations` (biến mọi type hint thành chuỗi đánh giá trễ), kỹ thuật này **triệt tiêu hoàn toàn lỗi Circular Import (import vòng)** và giảm thời gian khởi động ứng dụng!',
      'Vì `if TYPE_CHECKING:` giúp tự động cài đặt gói `app.models.order` nếu bị thiếu.',
      'Vì `TYPE_CHECKING` bằng `True` khi chạy trên môi trường Production và bằng `False` khi chạy `pytest`.',
      'Vì Python bắt buộc mọi câu lệnh `import` đều phải đặt trong khối `if`.',
    ],
    [
      'Chính xác! Khi `Customer` cần tham chiếu kiểu tới `Order` và `Order` cũng tham chiếu kiểu tới `Customer`, việc import lẫn nhau ở đầu file sẽ gây `ImportError` do circular import. Đặt import chỉ phục vụ type hint vào trong `if TYPE_CHECKING:` giúp runtime không bao giờ thực thi dòng import đó.',
      'Sai. Không liên quan tới cài đặt gói.',
      'Sai. Lúc runtime (dù là dev, test hay production), `typing.TYPE_CHECKING` luôn luôn là hằng số `False`.',
      'Sai. Các import dùng thật trong thân hàm lúc runtime vẫn phải đặt ở ngoài `if TYPE_CHECKING:`.',
    ],
    0,
    'Lưu ý: với Pydantic hoặc FastAPI (những thư viện cần giải mã type hints ngay lúc runtime để tạo validator), nếu bạn giấu class bên trong `if TYPE_CHECKING:` thì lúc runtime Pydantic sẽ không tìm thấy class đó trừ khi gọi `model_rebuild()` và cung cấp namespace.',
    '`if TYPE_CHECKING:` giống như câu lệnh `import type { Order } from "./order"` trong TypeScript: chỉ tồn tại cho trình kiểm tra kiểu đọc, còn khi biên dịch/chạy thật thì biến mất hoàn toàn để không gây vòng lặp import.',
    ['type-checking', 'circular-import']
  ),
  q(
    'ex-q-427',
    'stage-4',
    'advanced',
    CAT_ADV_2,
    TAGS_ADV_2,
    'Khi nào bạn bắt buộc phải ghi đè phương thức tạo đối tượng `__new__(cls, *args, **kwargs)` thay vì chỉ dùng phương thức khởi tạo `__init__(self, *args, **kwargs)`?',
    `class UpperStr(str):
    def __new__(cls, value: str):
        return super().__new__(cls, value.upper())`,
    [
      'Khi kế thừa các kiểu dữ liệu **bất biến (immutable)** như `str`, `int`, `tuple` (vì giá trị của chúng đã bị đóng băng ngay lúc cấp phát trong `__new__`, đến lúc vào `__init__` thì đã quá muộn để sửa), hoặc khi triển khai mẫu thiết kế **Singleton / Object Pool / Flyweight** cần trả về một instance đã tồn tại sẵn thay vì tạo mới.',
      'Khi muốn gán các thuộc tính bình thường như `self.name = name` trên một class tự định nghĩa.',
      'Khi muốn đóng kết nối cơ sở dữ liệu lúc đối tượng bị hủy.',
      '`__new__` đã bị loại bỏ trong Python 3, chỉ còn tồn tại trong Python 2.',
    ],
    [
      'Chính xác! `__new__` là bước **Constructor thực sự** (cấp phát và trả về instance `self`), còn `__init__` chỉ là bước **Initializer** (nhận `self` đã được tạo xong từ `__new__` để gán thuộc tính). Với kiểu bất biến như `str` hay `tuple`, hoặc khi muốn kiểm soát việc có tạo đối tượng mới hay trả về đối tượng cache sẵn, bắt buộc phải can thiệp ở `__new__`.',
      'Sai. Gán thuộc tính thông thường chỉ cần thực hiện trong `__init__`.',
      'Sai. Đóng tài nguyên là việc của Context Manager (`__exit__`) hoặc phương thức `.close()`.',
      'Sai. `__new__` là trụ cột cốt lõi của mô hình đối tượng Python 3.',
    ],
    0,
    'Một chi tiết quan trọng: nếu `__new__(cls, ...)` trả về một đối tượng thuộc chính `cls` (hoặc lớp con của `cls`), Python sẽ tự động gọi tiếp `__init__(self, ...)` với cùng các đối số đó.',
    '`__new__` là xưởng đúc tạo ra bức tượng (`self`), còn `__init__` là thợ sơn tô màu lên bức tượng đã đúc xong. Với tượng đá nguyên khối bất biến (`str`, `tuple`), bạn phải định hình ngay ở khâu đúc (`__new__`) chứ đúc xong rồi thì không nặn lại được nữa.',
    ['dunder-new', 'dunder-init']
  ),
];

const CAT_ADV_3 = 'Bất đồng bộ (AsyncIO), Đa luồng, Đa tiến trình & GIL';
const TAGS_ADV_3 = [
  'gil',
  'asyncio',
  'threading',
  'multiprocessing',
  'taskgroup',
  'concurrency',
  'semaphore',
  'contextvars',
];

const SET_3_QUESTIONS: ExamQuestion[] = [
  q(
    'ex-q-428',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    '**GIL (Global Interpreter Lock)** trong CPython chuẩn thực chất khóa cái gì và tại sao nó được thiết kế ngay từ đầu?',
    `# Nhiều luồng OS (threading.Thread) trong cùng 1 tiến trình CPython
# Tại 1 thời điểm có bao nhiêu luồng được thực thi Python bytecode?`,
    [
      'GIL là một khóa mutex cấp độ trình thông dịch đảm bảo tại bất kỳ thời điểm nào trong một tiến trình CPython, **chỉ có duy nhất 1 luồng hệ điều hành (OS thread) được phép thực thi Python bytecode**, nhằm bảo vệ bộ đếm tham chiếu (`ob_refcnt`) và cấu trúc bộ nhớ nội bộ của CPython khỏi race condition mà không cần gắn khóa lên từng đối tượng nhỏ.',
      'GIL khóa không cho chương trình Python mở nhiều hơn 1 kết nối mạng hoặc 1 file cùng lúc.',
      'GIL khóa toàn bộ máy tính, khiến các ứng dụng khác trên hệ điều hành không chạy được khi Python đang chạy.',
      'GIL chỉ tồn tại khi sử dụng thư viện `asyncio`, còn dùng `threading` thì không có GIL.',
    ],
    [
      'Chính xác! Vì mọi thao tác trong Python đều tăng/giảm `ob_refcnt` liên tục, việc dùng một khóa toàn cục đơn giản (GIL) giúp code đơn luồng chạy rất nhanh và giúp việc tích hợp thư viện C dễ dàng hơn, nhưng lại ngăn các luồng Python thuần tận dụng đa nhân CPU song song.',
      'Sai. Một tiến trình Python có thể mở hàng chục nghìn kết nối mạng đồng thời.',
      'Sai. GIL chỉ có phạm vi bên trong từng tiến trình (process) Python riêng lẻ.',
      'Sai. Chính `threading` mới chịu tác động trực tiếp của GIL khi chạy tác vụ CPU-bound, còn `asyncio` vốn chạy trên 1 luồng đơn.',
    ],
    0,
    'Lưu ý cực kỳ quan trọng: GIL **KHÔNG** tự động làm cho code đa luồng của bạn trở nên thread-safe về mặt logic nghiệp vụ! Giữa các chỉ thị bytecode (mặc định khoảng mỗi 5ms - `sys.getswitchinterval()`), CPython vẫn có thể chuyển ngữ cảnh giữa chừng một phép toán phức hợp như `counter += 1`.',
    'GIL giống như một căn phòng bếp có 8 đầu bếp (8 luồng OS trên 8 nhân CPU) nhưng chỉ có **duy nhất 1 con dao thái** (GIL): tại một thời điểm chỉ 1 đầu bếp cầm được dao để thái (chạy bytecode).',
    ['gil', 'cpython-internals']
  ),
  q(
    'ex-q-429',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Tại sao sử dụng đa luồng (`threading.Thread` / `ThreadPoolExecutor`) trong CPython vẫn tăng tốc vượt trội cho các tác vụ **I/O-bound** (gọi mạng, truy vấn DB, đọc/ghi ổ đĩa), nhưng lại không tăng tốc (thậm chí chậm đi) cho tác vụ **CPU-bound** thuần Python?',
    `# I/O-bound: tải 50 trang web bằng ThreadPoolExecutor -> Nhanh gấp chục lần!
# CPU-bound: tính số nguyên tố bằng ThreadPoolExecutor -> Không nhanh hơn 1 luồng!`,
    [
      'Vì ngay trước khi thực hiện lời gọi hệ thống chờ I/O (blocking system call như `recv`, `send`, `read`, `sleep`) hoặc khi vào các hàm C/Rust đã nhả khóa (`Py_BEGIN_ALLOW_THREADS`), CPython **tự động nhả (release) GIL** để các luồng khác chạy; còn với tác vụ CPU-bound thuần Python, các luồng chỉ tranh giành nhau chiếc khóa GIL trên các nhân CPU kèm chi phí context-switch.',
      'Vì các hàm I/O trong Python tự động khởi tạo thêm các tiến trình con (`multiprocessing`) ngầm bên dưới.',
      'Vì GIL tự động bị tắt hoàn toàn mỗi khi máy tính kết nối Internet.',
      'Vì `ThreadPoolExecutor` thực chất là một bí danh của `asyncio.gather`.',
    ],
    [
      'Chính xác! Trong tác vụ I/O-bound, 99% thời gian luồng chỉ nằm đợi phản hồi từ card mạng hoặc ổ đĩa ở tầng OS kernel (không giữ GIL), nên hàng chục luồng có thể đợi I/O song song hoàn hảo.',
      'Sai. I/O đa luồng vẫn chạy trong cùng 1 tiến trình duy nhất.',
      'Sai. GIL không bị tắt toàn cục khi có mạng, chỉ luồng nào đang chờ syscall I/O mới tạm nhả GIL.',
      'Sai. `ThreadPoolExecutor` quản lý các OS threads thực sự của module `threading`.',
    ],
    0,
    'Ngoài I/O, các thư viện tính toán khoa học viết bằng C/C++/Rust như **NumPy, Polars, PyTorch, OpenCV, bcrypt/Argon2** cũng chủ động nhả GIL khi xử lý mảng dữ liệu bên tầng native, cho phép tận dụng đa luồng thật sự!',
    'Giống như đầu bếp sau khi đặt nồi hầm lên bếp chờ 30 phút (I/O-bound) thì đặt con dao (nhả GIL) xuống bàn ngay để đầu bếp khác dùng dao sơ chế món tiếp theo.',
    ['gil', 'io-vs-cpu-bound']
  ),
  q(
    'ex-q-430',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Bản dựng **Free-threaded Python (`python3.13t` / `--disable-gil`)** được giới thiệu theo **PEP 703** thay đổi kiến trúc thực thi đa luồng của CPython như thế nào?',
    `# Chạy với bản dựng python3.13t (hoặc python3.14t)
import sys
print(sys._is_gil_enabled())  # False`,
    [
      'Loại bỏ khóa GIL toàn cục, thay thế bằng cơ chế **Biased Reference Counting**, bộ cấp phát bộ nhớ an toàn đa luồng (`mimalloc`) và các khóa hạt mịn (per-object / fine-grained locks), cho phép nhiều luồng Python thực thi bytecode **song song thực sự (true parallelism)** trên nhiều nhân CPU trong cùng 1 tiến trình.',
      'Xóa bỏ hoàn toàn module `threading` và bắt buộc mọi người chỉ được dùng `asyncio`.',
      'Tắt hoàn toàn bộ thu gom rác Garbage Collector khiến bộ nhớ không bao giờ được giải phóng.',
      'Chỉ cho phép chạy các file Python có dung lượng dưới 10KB.',
    ],
    [
      'Chính xác! PEP 703 (Free-threaded CPython) là cột mốc lịch sử: nhờ Biased Reference Counting (luồng sở hữu đối tượng giảm chi phí atomic) và `mimalloc`, các luồng CPU-bound thuần Python giờ đây có thể chạy song song trên mọi lõi CPU mà không cần nhân bản bộ nhớ qua `multiprocessing`.',
      'Sai. Mục tiêu của PEP 703 chính là làm cho `threading` mạnh mẽ hơn bao giờ hết.',
      'Sai. Bộ quản lý bộ nhớ và GC vẫn hoạt động đầy đủ với cơ chế đồng bộ hóa mới.',
      'Sai. Không có giới hạn kích thước file.',
    ],
    0,
    'Trong Python 3.13+, nếu một C extension cũ chưa khai báo hỗ trợ `Py_MOD_gil_not_used` được import vào tiến trình `python3.13t`, CPython sẽ an toàn bật lại GIL kèm cảnh báo runtime để tránh lỗi hỏng bộ nhớ.',
    'Free-threaded Python giống như nâng cấp căn bếp: phát cho mỗi đầu bếp một con dao riêng và thiết kế lại các ngăn tủ có khóa riêng từng ngăn nhỏ, để cả 8 đầu bếp cùng thái rau song song thực sự.',
    ['pep-703', 'free-threaded-python', 'gil']
  ),
  q(
    'ex-q-431',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Khi dùng `concurrent.futures.ProcessPoolExecutor` trên CPython truyền thống để tăng tốc tác vụ CPU-bound, tại sao truyền một đối tượng dữ liệu cực lớn (ví dụ DataFrame 500MB) làm tham số vào hàm worker lại có thể làm chương trình chạy chậm hơn cả đơn luồng, và giải pháp chuẩn là gì?',
    `from concurrent.futures import ProcessPoolExecutor

# Tại sao truyền big_data (500MB) qua executor.submit(worker, big_data) lại rất tốn kém?`,
    [
      'Vì các tiến trình (processes) có không gian bộ nhớ RAM cô lập hoàn toàn; mọi đối tượng truyền qua tham số và kết quả trả về giữa tiến trình cha và con đều phải được **tuần tự hóa/giải tuần tự hóa bằng `pickle` (IPC serialization overhead)** và sao chép qua đường ống (pipe/queue); giải pháp cho dữ liệu lớn là dùng `multiprocessing.shared_memory` hoặc Apache Arrow / memory-mapped files.',
      'Vì `ProcessPoolExecutor` chỉ chạy trên 1 nhân CPU duy nhất.',
      'Vì `ProcessPoolExecutor` tự động tải dữ liệu lên đám mây trước khi xử lý.',
      'Vì `pickle` chỉ hỗ trợ chuỗi ký tự ASCII dài tối đa 255 ký tự.',
    ],
    [
      'Chính xác! Khác với `ThreadPoolExecutor` (chia sẻ chung bộ nhớ Heap), `ProcessPoolExecutor` phải `pickle.dumps()` đối tượng 500MB ở tiến trình chính, gửi qua IPC pipe, rồi `pickle.loads()` tạo bản sao mới ở tiến trình worker. Với mảng số/buffer lớn, dùng `multiprocessing.shared_memory.SharedMemory` giúp truy cập zero-copy giữa các tiến trình!',
      'Sai. `ProcessPoolExecutor` chạy trên nhiều nhân CPU song song thật sự (mỗi tiến trình có GIL riêng).',
      'Sai. Toàn bộ giao tiếp IPC diễn ra cục bộ trên máy.',
      'Sai. `pickle` hỗ trợ các cấu trúc đối tượng Python phức tạp và kích thước lớn.',
    ],
    0,
    'Ngoài chi phí IPC, `pickle` cũng là lý do bạn KHÔNG thể truyền các hàm `lambda`, hàm lồng nhau cục bộ (nested functions), hoặc các đối tượng giữ kết nối socket/database vào `ProcessPoolExecutor`.',
    '`ThreadPoolExecutor` giống như các đồng nghiệp ngồi chung một phòng cùng nhìn vào 1 tấm bảng trắng chung; còn `ProcessPoolExecutor` là các chi nhánh ở các tòa nhà khác nhau: muốn nhờ xử lý tập tài liệu 500 trang thì phải đóng thùng gửi chuyển phát nhanh (`pickle`) sang tòa nhà bên kia, trừ khi dùng kho dữ liệu dùng chung (`shared_memory`).',
    ['processpoolexecutor', 'shared-memory', 'multiprocessing']
  ),
  q(
    'ex-q-432',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Điểm khác biệt căn bản nhất về hành vi thực thi khi bạn gọi một hàm `async def fetch()` trong **Python** so với khi gọi một hàm `async function fetch()` trong **JavaScript / TypeScript** là gì?',
    `async def fetch():
    print("Bắt đầu chạy!")
    await asyncio.sleep(1)
    return 42

coro = fetch()  # Dòng print("Bắt đầu chạy!") đã thực thi chưa?`,
    [
      'Trong JavaScript, gọi `fetch()` sẽ thực thi đồng bộ phần thân hàm ngay lập tức cho tới câu lệnh `await` đầu tiên và trả về một `Promise` đang chạy (hot); còn trong Python, gọi `fetch()` **KHÔNG chạy bất kỳ dòng code nào trong thân hàm** mà chỉ trả về một đối tượng **Coroutine "lạnh" (cold coroutine)** — nó chỉ bắt đầu chạy khi được `await` hoặc được lên lịch bằng `asyncio.create_task()`!',
      'Trong Python, gọi `fetch()` sẽ tự động chặn (block) luồng chính cho tới khi hàm chạy xong và trả về số `42`.',
      'Hai ngôn ngữ hoàn toàn giống hệt nhau: dòng `print("Bắt đầu chạy!")` đều in ra ngay khi gán `coro = fetch()`.',
      'Trong Python, không được phép gán kết quả của `fetch()` vào biến mà bắt buộc phải viết `await` ngay trên cùng một dòng.',
    ],
    [
      'Chính xác! Đây là cú sốc lớn nhất đối với lập trình viên JS/TS sang Python: `coro = fetch()` trong Python giống như gọi một hàm Generator — nó chỉ tạo ra đối tượng coroutine ở trạng thái treo đầu hàm. Nếu bạn quên `await coro` hoặc `asyncio.create_task(coro)`, hàm sẽ không bao giờ chạy và Python sẽ phát cảnh báo `RuntimeWarning: coroutine \'fetch\' was never awaited`!',
      'Sai. Gọi `fetch()` không hề block và cũng không trả về `42`, mà trả về `<coroutine object fetch>`.',
      'Sai. Chỉ JS mới chạy ngay tới `await` đầu tiên; Python hoàn toàn chưa chạy dòng nào khi mới gọi `fetch()`.',
      'Sai. Hoàn toàn có thể gán coroutine object vào biến `coro = fetch()` rồi sau đó mới `await coro` hoặc truyền vào `asyncio.gather(coro, ...)`.',
    ],
    0,
    'Trong hệ sinh thái `asyncio`, đối tượng trả về từ `asyncio.create_task(fetch())` (kiểu `asyncio.Task`) mới là thứ tương đương trực tiếp với một `Promise` đang chạy (hot) trong JavaScript!',
    'Trong JS, gọi `asyncFn()` giống như đề nổ máy xe chạy ngay tới đèn đỏ đầu tiên (`await`); còn trong Python, gọi `async_fn()` mới chỉ là viết tờ phiếu yêu cầu lái xe (`coroutine`), phải đưa tờ phiếu đó cho điều phối viên Event Loop (`await` / `create_task`) thì xe mới lăn bánh.',
    ['coroutine', 'asyncio-task', 'js-vs-python-async']
  ),
  q(
    'ex-q-433',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Tại sao tài liệu chính thức của Python cảnh báo: khi dùng `asyncio.create_task(coro)` để chạy một tác vụ chạy ngầm ("fire-and-forget" background task) mà **KHÔNG lưu giữ tham chiếu mạnh** tới đối tượng `Task` trả về, tác vụ đó có thể đột ngột biến mất giữa chừng mà không báo lỗi?',
    `# LỖI NGUY HIỂM (Fire-and-forget không giữ tham chiếu):
asyncio.create_task(send_audit_log(data))

# CÁCH CHUẨN CHÍNH THỐNG:
background_tasks: set[asyncio.Task] = set()
task = asyncio.create_task(send_audit_log(data))
background_tasks.add(task)
task.add_done_callback(background_tasks.discard)`,
    [
      'Vì Event Loop của `asyncio` **chỉ giữ một tham chiếu yếu (`weakref`)** tới các đối tượng `Task`; nếu code của bạn không gán biến hay lưu `Task` vào một tập hợp (`set`), bộ thu gom rác (Garbage Collector) có thể thu hồi và hủy `Task` đó ngay trong khi nó đang tạm dừng chờ `await`!',
      'Vì `asyncio.create_task` chỉ hoạt động nếu biến nhận kết quả được đặt tên chính xác là `task`.',
      'Vì `set.add()` là hàm duy nhất kích hoạt cho Event Loop bắt đầu chạy task.',
      'Vì nếu không thêm vào `set`, task sẽ bị chạy lặp lại vô hạn lần.',
    ],
    [
      'Chính xác! Đây là một trong những bug sản xuất (production bug) hiểm hóc nhất của `asyncio`: Event Loop chỉ giữ weak reference tới các task đang chờ. Một task "mồ côi" không ai giữ strong reference có thể bị GC xóa sổ bất cứ lúc nào! Mẫu chuẩn `background_tasks.add(task)` kèm `task.add_done_callback(background_tasks.discard)` giữ task sống đến khi xong rồi tự dọn khỏi `set`.',
      'Sai. Tên biến không quan trọng, quan trọng là đối tượng vẫn còn ít nhất 1 strong reference trong suốt thời gian task chạy.',
      'Sai. `create_task()` đã tự đăng ký task với Event Loop ngay để chạy ở vòng lặp kế tiếp.',
      'Sai. Task không bị lặp vô hạn.',
    ],
    0,
    'Nếu có thể, hãy ưu tiên sử dụng `asyncio.TaskGroup` (Python 3.11+) thay cho các task fire-and-forget rời rạc, vì `TaskGroup` vừa tự giữ tham chiếu an toàn vừa quản lý vòng đời và ngoại lệ của mọi task con.',
    'Event Loop giống như bảng thông báo chỉ dán ảnh chụp (`weakref`) của các công việc; nếu bạn vứt mất hồ sơ gốc (`task`) vào thùng rác ngay sau khi giao việc, lao công (`GC`) đi qua thấy hồ sơ không ai giữ sẽ hủy luôn công việc đang làm dở!',
    ['asyncio-create-task', 'weakref', 'garbage-collection']
  ),
  q(
    'ex-q-434',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Trong Python 3.11+, tại sao **`asyncio.TaskGroup`** (Structured Concurrency) được khuyến nghị thay thế cho **`asyncio.gather()`** trong hầu hết các tác vụ bất đồng bộ đồng thời?',
    `async with asyncio.TaskGroup() as tg:
    t1 = tg.create_task(fetch_user(1))
    t2 = tg.create_task(fetch_orders(1))
# Khi thoát khối async with, cả t1 và t2 chắc chắn đã hoàn tất!`,
    [
      'Vì nếu 1 task trong `asyncio.gather()` ném ngoại lệ, `gather` thoát ngay nhưng **các task anh em còn lại vẫn tiếp tục chạy ngầm mồ côi (orphan tasks)** gây rò rỉ tài nguyên; ngược lại `TaskGroup` đảm bảo **Structured Concurrency**: khi 1 task con lỗi, nó tự động hủy (`cancel`) tất cả các task anh em khác, đợi chúng dọn dẹp xong xuôi rồi mới ném `ExceptionGroup` ra ngoài khối `async with`!',
      'Vì `asyncio.gather()` chỉ chạy tuần tự từng task một chứ không chạy đồng thời.',
      'Vì `TaskGroup` tự động tạo thêm các tiến trình CPU mới cho mỗi task.',
      'Vì `asyncio.gather()` đã bị xóa khỏi thư viện chuẩn từ Python 3.11.',
    ],
    [
      'Chính xác! Với `asyncio.gather()`, khi một task lỗi, các task khác không hề bị hủy tự động mà tiếp tục chạy lơ lửng ở hậu trường. `asyncio.TaskGroup` đảm bảo nguyên tắc vàng của Structured Concurrency: không bao giờ có task con nào sống sót vượt ra ngoài phạm vi khối `async with` đã sinh ra nó.',
      'Sai. Cả `gather` và `TaskGroup` đều chạy đồng thời các task trên Event Loop.',
      'Sai. `TaskGroup` vẫn chạy các coroutine trên cùng Event Loop của luồng hiện tại.',
      'Sai. `asyncio.gather()` vẫn tồn tại để tương thích ngược hoặc khi cần `return_exceptions=True` đơn giản.',
    ],
    0,
    'Khi kết hợp với `except*` (PEP 654), `TaskGroup` còn cho phép xử lý đồng thời nhiều ngoại lệ khác nhau nếu nhiều task cùng gặp lỗi trong quá trình hủy/thực thi.',
    '`asyncio.gather()` giống như thuê một nhóm thợ nhưng khi 1 người gặp tai nạn, quản đốc bỏ về ngay mặc kệ những người còn lại vẫn đang khoan đục trong nhà; còn `TaskGroup` đảm bảo quản đốc ra lệnh dừng toàn bộ đội, thu dọn dụng cụ sạch sẽ rồi mới khóa cửa phòng.',
    ['asyncio-taskgroup', 'structured-concurrency', 'asyncio-gather']
  ),
  q(
    'ex-q-435',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Cú pháp `except* ValueError as eg:` (ra mắt trong Python 3.11 - PEP 654 cùng với `ExceptionGroup`) hoạt động khác với `except ValueError as e:` truyền thống như thế nào khi nhiều tác vụ đồng thời trong `TaskGroup` cùng ném ra ngoại lệ?',
    `try:
    async with asyncio.TaskGroup() as tg:
        tg.create_task(fail_with_value_error_1())
        tg.create_task(fail_with_value_error_2())
        tg.create_task(fail_with_type_error())
except* ValueError as eg:
    print("Số lỗi ValueError:", len(eg.exceptions))
except* TypeError as eg:
    print("Số lỗi TypeError:", len(eg.exceptions))`,
    [
      'Trong một lần `try`, nhiều nhánh `except*` khác nhau **có thể cùng được kích hoạt nối tiếp nhau**: nhánh `except* ValueError` sẽ trích xuất tất cả các `ValueError` (ở đây là 2 lỗi) gom vào một `ExceptionGroup` con `eg`, sau đó phần ngoại lệ còn lại (`TypeError`) tiếp tục đi xuống khớp với nhánh `except* TypeError`!',
      'Chỉ duy nhất nhánh `except*` đầu tiên chạy, các nhánh `except*` phía dưới bị bỏ qua giống hệt `except` thường.',
      'Biến `eg` trong `except* ValueError as eg` là một đối tượng `ValueError` đơn lẻ, không phải `ExceptionGroup`.',
      'Không được phép đặt nhiều hơn một nhánh `except*` trong cùng một khối `try`.',
    ],
    [
      'Chính xác! Trong đồng thời hóa (concurrency), 3 task chạy cùng lúc có thể ném ra cả `ValueError` lẫn `TypeError`. `except*` cho phép "lọc và xử lý từng nhóm lỗi theo kiểu": nhánh đầu bắt hết mọi `ValueError`, nhánh hai bắt hết mọi `TypeError`, và nếu còn lỗi nào chưa được nhánh `except*` nào bắt thì mới ném tiếp ra ngoài!',
      'Sai. Đó là hành vi của `except` truyền thống (chỉ có 1 ngoại lệ tại 1 thời điểm), còn `except*` có thể chạy qua nhiều nhánh cho các loại lỗi khác nhau trong cùng 1 `ExceptionGroup`.',
      'Sai. `eg` trong `except*` luôn luôn là một đối tượng `ExceptionGroup` chứa thuộc tính `eg.exceptions` (một tuple các lỗi khớp kiểu).',
      'Sai. Đặt nhiều nhánh `except*` để phân loại xử lý các nhóm lỗi khác nhau chính là mục đích thiết kế của PEP 654.',
    ],
    0,
    'Lưu ý: không được trộn lẫn `except` thường và `except*` trong cùng một khối `try`, và không được dùng `break`, `continue`, hay `return` nhảy ra khỏi bên trong khối `except*`.',
    '`except` thường giống như cái vợt chỉ bắt được 1 con cá duy nhất; còn `except*` giống như hệ thống lưới phân loại nhiều tầng: tầng 1 giữ lại toàn bộ cá thu (`ValueError`), tầng 2 giữ lại toàn bộ cá ngừ (`TypeError`) từ cùng một mẻ lưới (`ExceptionGroup`).',
    ['exception-group', 'except-star', 'asyncio-taskgroup']
  ),
  q(
    'ex-q-436',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Điều gì xảy ra nếu bên trong một hàm `async def` đang chạy trên Event Loop (ví dụ một route của FastAPI), bạn vô tình gọi hàm đồng bộ chặn luồng như `time.sleep(5)` hoặc `requests.get(url)` hay xử lý ảnh nặng bằng CPU, và giải pháp chuẩn trong Python 3.9+ là gì?',
    `async def handle_webhook(payload: bytes):
    # NGUY HIỂM: hàm đồng bộ nặng / blocking!
    # result = heavy_sync_parse(payload)
    
    # Cách sửa chuẩn trong asyncio (Python 3.9+):
    result = await asyncio.to_thread(heavy_sync_parse, payload)
    return result`,
    [
      'Gọi trực tiếp hàm blocking trong `async def` sẽ **làm đóng băng (freeze) toàn bộ Event Loop** trên luồng đó trong suốt 5 giây — khiến hàng nghìn request/coroutine khác đang chờ trên cùng Event Loop bị treo cứng hoàn toàn! Giải pháp chuẩn cho tác vụ blocking I/O (hoặc C extension nhả GIL) là đẩy sang worker thread qua `await asyncio.to_thread(func, *args)`.',
      'Từ khóa `async def` tự động biến mọi hàm đồng bộ bên trong nó như `time.sleep(5)` thành bất đồng bộ không chặn.',
      'Chỉ cần bọc `time.sleep(5)` trong `asyncio.create_task()` là nó sẽ không chặn Event Loop nữa.',
      'Hàm `asyncio.to_thread()` chạy hàm đó trên máy chủ từ xa qua giao thức SSH.',
    ],
    [
      'Chính xác! Event Loop là kiến trúc **Cooperative Multitasking (đa nhiệm hợp tác)** chạy trên 1 luồng duy nhất: một coroutine chỉ nhường quyền điều khiển khi gặp từ khóa `await` trên một đối tượng non-blocking. Gọi `time.sleep(5)` hay `requests.get()` sẽ khóa cứng luồng OS chứa Event Loop. Dùng `await asyncio.to_thread(...)` giúp đẩy hàm đồng bộ đó sang `ThreadPoolExecutor` mặc định và giải phóng Event Loop ngay!',
      'Sai. `async def` không có phép thuật biến hàm đồng bộ `time.sleep` thành non-blocking (phải dùng `await asyncio.sleep(5)` hoặc thư viện async như `httpx.AsyncClient`).',
      'Sai. `create_task()` vẫn chạy coroutine đó trên chính luồng của Event Loop, nên nếu bên trong nó gọi `time.sleep(5)` thì toàn bộ Event Loop vẫn bị treo cứng 5 giây.',
      'Sai. `asyncio.to_thread()` sử dụng `ThreadPoolExecutor` ngay trong tiến trình hiện tại.',
    ],
    0,
    'Nếu tác vụ blocking là **CPU-bound thuần Python** (như tính toán vòng lặp Python nặng giữ chặt GIL), thì ngay cả `asyncio.to_thread()` cũng sẽ tranh giành GIL với luồng Event Loop; khi đó bạn phải dùng `await loop.run_in_executor(process_pool, cpu_func, arg)` với `ProcessPoolExecutor`!',
    'Event Loop giống như một người thu ngân siêu tốc phục vụ 1000 khách cùng lúc: nếu có 1 khách bắt thu ngân đứng nhìn đồng hồ cát chảy hết 5 phút (`time.sleep`), cả 999 khách phía sau đều chết đứng; thu ngân phải cử ngay nhân viên phụ trách kho (`asyncio.to_thread`) xử lý riêng cho khách đó để mình tiếp tục tính tiền cho hàng đợi.',
    ['asyncio-to-thread', 'event-loop-blocking']
  ),
  q(
    'ex-q-437',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Khi bạn có danh sách 10.000 URL cần tải bằng `httpx.AsyncClient`, nếu ném toàn bộ 10.000 task vào `TaskGroup` hoặc `gather` cùng lúc thì server đích (hoặc giới hạn file descriptors của OS) sẽ bị sập. Công cụ nào của `asyncio` giúp giới hạn **tối đa chỉ có đúng 20 request được chạy đồng thời** tại bất kỳ thời điểm nào?',
    `sem = asyncio.Semaphore(20)

async def fetch_bounded(client, url: str):
    async with sem:
        return await client.get(url)`,
    [
      'Sử dụng `asyncio.Semaphore(20)` kết hợp khối `async with sem:` bao quanh lệnh gọi mạng (Bounded Concurrency).',
      'Sử dụng `asyncio.Lock()` (vì `Lock` cho phép 20 coroutine vào cùng lúc).',
      'Sử dụng `time.sleep(20)` trước mỗi request.',
      'Sử dụng `threading.Barrier(20)`.',
    ],
    [
      'Chính xác! `asyncio.Semaphore(20)` duy trì một bộ đếm nội bộ khởi tạo bằng `20`: mỗi coroutine đi vào `async with sem:` làm giảm bộ đếm đi 1; khi bộ đếm về `0`, coroutine thứ 21 sẽ tạm dừng chờ (nhường Event Loop) và chỉ được đánh thức ngay khi 1 trong 20 coroutine trước đó thoát khỏi khối `async with`!',
      'Sai. `asyncio.Lock()` là một Mutex chỉ cho phép đúng **1** coroutine đi vào tại một thời điểm (tương đương `Semaphore(1)`).',
      'Sai. `time.sleep` làm treo cứng Event Loop.',
      'Sai. `threading.Barrier` là công cụ chặn luồng OS đồng bộ, không dùng cho coroutine.',
    ],
    0,
    '`asyncio.Semaphore(N)` hiệu quả hơn việc cắt mảng thành từng lô cố định 20 phần tử (batching), vì ngay khi 1 request trong 20 cái hoàn thành xong sớm, request thứ 21 được nạp vào lấp chỗ trống ngay lập tức mà không phải chờ cả 19 request kia xong hết!',
    '`Semaphore(20)` giống như bãi đỗ xe tự động có đúng 20 chỗ trống và bảng điện tử ở cổng: đủ 20 xe trong bãi thì thanh chắn hạ xuống; cứ có 1 xe bất kỳ đi ra (`__aexit__`) là thanh chắn mở ngay cho 1 xe tiếp theo đi vào (`__aenter__`).',
    ['asyncio-semaphore', 'bounded-concurrency']
  ),
  q(
    'ex-q-438',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Tại sao kể từ Python 3.8+, ngoại lệ **`asyncio.CancelledError`** lại được đổi sang kế thừa trực tiếp từ **`BaseException`** thay vì kế thừa từ `Exception` như các lỗi thông thường?',
    `async def worker():
    try:
        await do_io()
    except Exception as e:
        # Khối này có bắt được asyncio.CancelledError không?
        logger.error(f"Error: {e}")`,
    [
      'Để ngăn chặn việc các khối `except Exception:` (viết để bắt lỗi nghiệp vụ/mạng thông thường) **vô tình nuốt mất tín hiệu hủy task (`CancelledError`)**, khiến các coroutine không thể bị hủy bởi `task.cancel()`, `asyncio.timeout()`, hoặc `TaskGroup`!',
      'Vì `CancelledError` làm tắt máy tính giống như `SystemExit`.',
      'Vì trong Python 3.8+, lớp `Exception` đã bị xóa bỏ.',
      'Để `CancelledError` không thể bị bắt bởi bất kỳ câu lệnh `except` nào trong Python.',
    ],
    [
      'Chính xác! Trước Python 3.8, rất nhiều lập trình viên viết `try: await ... except Exception: log()` trong vòng lặp `while True:`, vô tình nuốt luôn `CancelledError` khiến task trở thành "zombie" không thể dừng được. Việc chuyển `CancelledError` sang kế thừa `BaseException` (cùng hàng với `KeyboardInterrupt`, `SystemExit`) giúp `except Exception:` không chạm tới nó, đảm bảo tín hiệu hủy luôn xuyên thủng để dừng task an toàn.',
      'Sai. Nó chỉ hủy `Task` hiện tại chứ không tắt tiến trình như `SystemExit`.',
      'Sai. `Exception` vẫn là lớp cơ sở cho mọi lỗi chương trình thông thường.',
      'Sai. Bạn vẫn có thể bắt tường minh `except asyncio.CancelledError:` nếu cần dọn dẹp đặc biệt (nhưng bắt buộc phải `raise` lại nó sau khi dọn xong, hoặc tốt hơn là đặt logic dọn dẹp trong `finally:`).',
    ],
    0,
    'Quy tắc vàng khi xử lý `CancelledError`: nếu bạn bắt `except asyncio.CancelledError:` để ghi log hoặc rollback, bạn **BẮT BUỘC phải `raise` lại** nó ở cuối khối `except` (trừ khi bạn có lý do cực kỳ đặc biệt và hiểu rõ cơ chế `task.uncancel()`).',
    '`except Exception:` giống như lưới chắn rác thông thường trên sông; còn `CancelledError`, `KeyboardInterrupt`, `SystemExit` (`BaseException`) là lệnh xả lũ khẩn cấp của ban chỉ huy: phải đi xuyên qua lưới chắn rác thông thường để đóng đập ngay lập tức.',
    ['cancelled-error', 'base-exception', 'asyncio']
  ),
  q(
    'ex-q-439',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Trong Python 3.11+, cách viết chuẩn và gọn nhất để áp đặt giới hạn thời gian chờ (timeout) 3 giây cho một khối nhiều câu lệnh `await` liên tiếp là gì?',
    `async with asyncio.timeout(3.0):
    user = await fetch_user()
    profile = await fetch_profile(user.id)`,
    [
      'Sử dụng context manager bất đồng bộ `async with asyncio.timeout(3.0):` — nếu tổng thời gian thực thi của cả khối vượt quá 3 giây, nó sẽ hủy các bước đang chờ và ném ra ngoại lệ chuẩn `TimeoutError`.',
      'Sử dụng `with time.timeout(3.0):`.',
      'Sử dụng `@pytest.mark.timeout(3.0)` trong code production.',
      'Gán `asyncio.MAX_TIME = 3.0` ở đầu file.',
    ],
    [
      'Chính xác! `asyncio.timeout(delay)` (ra mắt trong Python 3.11) thay thế cho `asyncio.wait_for()` cũ kỹ: vừa cho phép bọc nhiều dòng lệnh `await` vào chung một ngân sách thời gian 3 giây bằng `async with`, vừa cho phép gia hạn thời gian động qua `cm.reschedule(...)`, và ném ra `TimeoutError` chuẩn của built-in.',
      'Sai. Module `time` không có context manager `timeout` cho asyncio.',
      'Sai. Đó là plugin kiểm thử của pytest.',
      'Sai. Không có hằng số `asyncio.MAX_TIME`.',
    ],
    0,
    'Ngoài `asyncio.timeout(seconds)`, Python 3.11+ còn cung cấp `asyncio.timeout_at(when)` để đặt hạn chót tuyệt đối theo đồng hồ `loop.time()`.',
    '`asyncio.wait_for(coro, 3.0)` cũ chỉ bấm giờ được cho 1 bước chạy đơn lẻ; còn `async with asyncio.timeout(3.0):` giống như bấm đồng hồ đếm ngược 3 giây cho cả một chặng đường gồm nhiều trạm `await` liên tiếp.',
    ['asyncio-timeout', 'asyncio']
  ),
  q(
    'ex-q-440',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Khi một coroutine đang thực hiện một thao tác quan trọng không được phép bị ngắt giữa chừng (ví dụ: ghi nhận thanh toán vào DB sau khi đã trừ tiền cổng thanh toán), hàm `await asyncio.shield(critical_coro())` hoạt động như thế nào nếu task bên ngoài bị gọi `.cancel()`?',
    `async def process_payment():
    await charge_credit_card()
    # Bảo vệ bước lưu DB không bị hủy nếu client ngắt kết nối giữa chừng:
    await asyncio.shield(save_payment_record())`,
    [
      '`asyncio.shield()` bọc tác vụ bên trong một lớp khiên bảo vệ: nếu task bên ngoài bị hủy (`cancel()`), lệnh `await asyncio.shield(...)` ở ngoài vẫn nhận và ném `CancelledError` ngay lập tức, NHƯNG tác vụ `save_payment_record()` bên trong khiên **KHÔNG bị hủy** mà vẫn tiếp tục chạy ngầm trên Event Loop cho đến khi hoàn tất!',
      '`asyncio.shield()` chặn không cho phép bất kỳ ngoại lệ nào xảy ra bên trong `save_payment_record()`.',
      '`asyncio.shield()` làm cho `save_payment_record()` chạy trên một máy chủ dự phòng khác.',
      '`asyncio.shield()` khóa GIL vĩnh viễn cho đến khi hàm chạy xong.',
    ],
    [
      'Chính xác! `shield()` tách biệt việc hủy của caller bên ngoài khỏi tác vụ cốt lõi bên trong: caller bị hủy thì cứ thoát với `CancelledError`, còn coroutine được bọc bên trong `shield()` miễn nhiễm với tín hiệu hủy từ bên ngoài và tiếp tục chạy đến đích.',
      'Sai. Nếu bản thân `save_payment_record()` gặp lỗi nội tại (như mất kết nối DB), ngoại lệ đó vẫn được ném ra như bình thường.',
      'Sai. Nó vẫn chạy trên cùng Event Loop hiện tại.',
      'Sai. `shield()` không can thiệp vào GIL.',
    ],
    0,
    'Lưu ý nâng cao: nếu bạn muốn đảm bảo coroutine bên trong `shield` chạy xong hoàn toàn ngay cả trước khi hàm cha thoát khỏi khối `try...finally`, bạn có thể giữ tham chiếu tới task gốc và `await task` lại một lần nữa bên trong khối `except asyncio.CancelledError:` trước khi `raise` lại `CancelledError`.',
    '`asyncio.shield()` giống như lồng kính chống đạn bảo vệ nhân viên kế toán đang đóng dấu xác nhận giao dịch (`save_payment_record`): dù khách hàng bên ngoài có bấm nút hủy bỏ đi về (`CancelledError`), nhân viên bên trong lồng kính vẫn hoàn tất nốt con dấu để sổ sách không bị lệch.',
    ['asyncio-shield', 'cancelled-error']
  ),
  q(
    'ex-q-441',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Tại sao trong ứng dụng web bất đồng bộ (`asyncio` / FastAPI), bạn KHÔNG THỂ dùng `threading.local()` để lưu trữ thông tin theo từng request (như `request_id` hay `current_user_id` cho việc ghi log), mà bắt buộc phải dùng **`contextvars.ContextVar`** (PEP 567)?',
    `from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="anonymous")`,
    [
      'Vì hàng nghìn request bất đồng bộ trong `asyncio` đều chạy xen kẽ nhau trên **cùng 1 luồng hệ điều hành (single OS thread)** duy nhất; nếu dùng `threading.local()`, tất cả các request sẽ ghi đè lên chung một biến của luồng đó! Ngược lại `contextvars.ContextVar` tự động cô lập và chuyển đổi trạng thái ngữ cảnh theo từng `asyncio.Task` (và tự kế thừa sang các task con được tạo bởi `create_task` hay `to_thread`).',
      'Vì `threading.local()` đã bị xóa khỏi Python 3.',
      'Vì `ContextVar` tự động lưu dữ liệu vào cơ sở dữ liệu Redis.',
      'Vì `threading.local()` chỉ lưu được kiểu số nguyên `int`, không lưu được chuỗi `str`.',
    ],
    [
      'Chính xác! `threading.local()` gắn dữ liệu theo `thread_id`. Trong mô hình Event Loop đơn luồng của `asyncio`, mọi request đều có cùng `thread_id`, nên dùng `threading.local()` sẽ gây rò rỉ dữ liệu chéo giữa người dùng A và người dùng B (cross-request data leak cực kỳ nguy hiểm!). `ContextVar` được tích hợp sâu vào `asyncio` để mỗi `Task` có một bản sao `Context` riêng biệt.',
      'Sai. `threading.local()` vẫn tồn tại cho các ứng dụng đa luồng đồng bộ truyền thống.',
      'Sai. `ContextVar` chỉ lưu dữ liệu trong bộ nhớ RAM của tiến trình hiện tại.',
      'Sai. `threading.local()` lưu được mọi đối tượng Python.',
    ],
    0,
    'Khi gọi `token = request_id_var.set("req-123")` ở middleware đầu request, mọi hàm sâu bên dưới (service, repository, logger) đều đọc được `request_id_var.get()` mà không cần truyền biến `request_id` qua hàng chục tầng tham số hàm; cuối request có thể khôi phục bằng `request_id_var.reset(token)`.',
    'Tương tự như `AsyncLocalStorage` trong Node.js: dù chỉ có 1 nhân viên phục vụ (1 OS thread) chạy qua chạy lại giữa 100 bàn ăn (`asyncio.Task`), `ContextVar` giúp nhân viên tự động đeo đúng sổ ghi chú của từng bàn mỗi khi bước tới bàn đó.',
    ['contextvars', 'asyncio', 'request-tracing']
  ),
  q(
    'ex-q-442',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Khi thiết kế mô hình **Producer - Consumer** bất đồng bộ sử dụng `asyncio.Queue(maxsize=100)`, chuyện gì xảy ra khi hàng đợi đã đầy đủ 100 phần tử mà Producer gọi `await queue.put(item)`, và tại sao tham số `maxsize` lại sống còn trong hệ thống thực tế?',
    `queue: asyncio.Queue[Job] = asyncio.Queue(maxsize=100)

async def producer(job: Job):
    await queue.put(job)  # Chuyện gì xảy ra khi queue đã có 100 phần tử?`,
    [
      'Khi hàng đợi đạt ngưỡng `maxsize=100`, lời gọi `await queue.put(job)` sẽ **tự động tạm dừng (suspend) Producer** cho tới khi Consumer lấy bớt phần tử ra bằng `await queue.get()`, tạo nên cơ chế **Backpressure (áp lực ngược)** tự nhiên giúp ngăn chặn tràn bộ nhớ RAM (`Out-Of-Memory`) khi tốc độ sinh dữ liệu nhanh hơn tốc độ xử lý!',
      'Phần tử thứ 101 sẽ tự động ghi đè và xóa mất phần tử đầu tiên trong hàng đợi.',
      '`await queue.put(job)` sẽ ném ngoại lệ `QueueFull` ngay lập tức.',
      '`asyncio.Queue` sẽ tự động nhân đôi `maxsize` lên 200.',
    ],
    [
      'Chính xác! Một hàng đợi không giới hạn (`maxsize=0` mặc định) là quả bom nổ chậm: nếu DB hoặc API đích bị chậm khiến Consumer xử lý chỉ được 10 mục/giây trong khi Producer đẩy vào 1000 mục/giây, hàng đợi sẽ phình to đến khi sập RAM (OOM Kill). Đặt `maxsize > 0` ép Producer phải giảm tốc độ theo đúng nhịp tiêu thụ của Consumer (Backpressure).',
      'Sai. `asyncio.Queue` chuẩn là FIFO không tự ghi đè (chỉ `collections.deque(maxlen=100)` mới tự đẩy phần tử cũ ra).',
      'Sai. Chỉ phương thức không chờ `queue.put_nowait(job)` mới ném `asyncio.QueueFull`; còn `await queue.put(job)` sẽ lịch sự tạm dừng chờ tới khi có chỗ trống.',
      'Sai. `maxsize` là giới hạn cứng không tự nhân đôi.',
    ],
    0,
    'Khi kết hợp với `queue.task_done()` ở phía Consumer sau mỗi lần xử lý xong một mục, luồng chính có thể gọi `await queue.join()` để đợi cho đến khi toàn bộ các mục trong hàng đợi đã được xử lý hoàn tất 100% trước khi tắt ứng dụng.',
    'Giống như băng chuyền nhà máy chỉ có 100 khay chứa (`maxsize=100`): nếu khâu đóng gói cuối chuyền (`Consumer`) làm chậm khiến cả 100 khay đều đầy, máy cấp phôi đầu chuyền (`Producer`) sẽ tự động tạm dừng chờ có khay trống chứ không đổ tràn sản phẩm ra sàn nhà.',
    ['asyncio-queue', 'backpressure']
  ),
  q(
    'ex-q-443',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Giả sử hai luồng hệ điều hành (`threading.Thread`) cùng thực hiện vòng lặp tăng biến toàn cục `counter += 1` mỗi luồng 1.000.000 lần mà không dùng khóa (`threading.Lock`). Trên CPython chuẩn (có GIL), kết quả cuối cùng của `counter` có chắc chắn luôn bằng `2_000_000` không và tại sao?',
    `counter = 0

def worker():
    global counter
    for _ in range(1_000_000):
        counter += 1  # Có phải là thao tác nguyên tử (atomic) không?`,
    [
      '**KHÔNG chắc chắn** (thường nhỏ hơn `2_000_000` do **Race Condition / Lost Update**): vì câu lệnh `counter += 1` biên dịch ra nhiều bước bytecode (`LOAD_GLOBAL`, `LOAD_CONST`, `BINARY_OP`, `store_GLOBAL`); GIL có thể chuyển ngữ cảnh (context switch) giữa hai luồng ngay sau khi luồng A vừa đọc giá trị cũ nhưng chưa kịp ghi giá trị mới!',
      'Chắc chắn luôn bằng `2_000_000` vì GIL đã bảo vệ mọi dòng code Python thành nguyên tử.',
      'Kết quả luôn bằng `1_000_000` vì luồng thứ hai không bao giờ được chạy.',
      'CPython sẽ ném lỗi `DeadlockError` ngay khi hai luồng cùng chạm vào một biến.',
    ],
    [
      'Chính xác! Đây là hiểu lầm phổ biến nhất về GIL: GIL chỉ đảm bảo từng **chỉ thị C bytecode đơn lẻ** không làm hỏng bộ nhớ nội bộ của trình thông dịch, chứ một dòng lệnh Python như `counter += 1` gồm tới 4 bước đọc-cộng-ghi tách biệt. Nếu không bọc bằng `with lock:`, hai luồng cùng đọc `counter = 10`, cùng cộng 1 và cùng ghi đè `11` (mất 1 lần tăng!).',
      'Sai. GIL bảo vệ trạng thái C nội bộ của interpreter, KHÔNG bảo vệ tính nguyên tử cho phép toán đọc-sửa-ghi (`+=`) của lập trình viên.',
      'Sai. Cả hai luồng đều chạy xen kẽ nhau.',
      'Sai. Race condition diễn ra âm thầm và cho kết quả sai chứ không ném ngoại lệ.',
    ],
    0,
    'Để cập nhật trạng thái dùng chung giữa nhiều OS threads một cách an toàn, bạn bắt buộc phải dùng khóa đồng bộ hóa như `with threading.Lock(): counter += 1`.',
    'Hai người cùng nhìn lên bảng thấy số `10` (`LOAD_GLOBAL`), người A quay đi nhẩm cộng 1 thì bị tạm dừng, người B nhìn bảng cũng thấy `10` cộng 1 viết `11` lên bảng; đến khi người A quay lại cũng xóa bảng viết `11` — thế là 2 lần cộng chỉ tăng được 1 đơn vị!',
    ['race-condition', 'threading-lock', 'gil']
  ),
  q(
    'ex-q-444',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Trong lập trình đa luồng Python, sự khác biệt giữa **`threading.Lock`** (khóa thường) và **`threading.RLock`** (Reentrant Lock - khóa tái nhập) là gì?',
    `lock = threading.Lock()
rlock = threading.RLock()

def outer():
    with lock:
        inner()  # Nếu inner() cũng gọi with lock: thì chuyện gì xảy ra?`,
    [
      'Nếu cùng một luồng đang giữ `threading.Lock()` mà gọi hàm con lại cố lấy chính `lock` đó lần thứ hai, luồng đó sẽ **tự khóa chết chính mình vĩnh viễn (Self-Deadlock)**; còn `threading.RLock()` cho phép **chính luồng đang sở hữu khóa** được phép acquire lại khóa đó nhiều lần (tăng bộ đếm đệ quy nội bộ) miễn là nhả ra (`release`) đủ bấy nhiêu lần.',
      '`RLock` cho phép 2 luồng khác nhau cùng vào miền găng một lúc, còn `Lock` chỉ cho 1 luồng.',
      '`RLock` chỉ dùng cho thao tác đọc (Read Lock), không dùng cho thao tác ghi.',
      '`Lock` nhanh gấp 1000 lần `RLock` vì `Lock` không dùng hệ điều hành.',
    ],
    [
      'Chính xác! `threading.Lock` không quan tâm ai đang giữ khóa: hễ khóa đang đóng là bất kỳ lệnh `acquire()` nào (kể cả từ chính luồng vừa đóng khóa ở hàm cha) đều bị treo chờ mãi mãi. `RLock` ghi nhớ `owning_thread` và `recursion_level`, rất hữu ích khi các phương thức public của một class đều có `@synchronized` và gọi lẫn nhau.',
      'Sai. Với hai luồng KHÁC nhau, `RLock` vẫn chặn tuyệt đối chỉ cho 1 luồng giữ khóa tại một thời điểm giống hệt `Lock`.',
      'Sai. Chữ `R` trong `RLock` là viết tắt của **Reentrant** (Tái nhập), không phải Read.',
      'Sai. Cả hai đều được cài đặt bằng C trong CPython và có tốc độ rất gần nhau.',
    ],
    0,
    'Mặc dù `RLock` giúp tránh self-deadlock khi hàm A (có khóa) gọi hàm B (cũng có khóa trên cùng đối tượng), nhiều kiến trúc sư vẫn thích tách hàm nội bộ `_b_unlocked()` và dùng `Lock` thường để cấu trúc sở hữu khóa rõ ràng hơn.',
    '`Lock` thường giống như cửa phòng tự sập chốt cơ học: kể cả chính bạn đang ở trong phòng mà bước qua cánh cửa phụ yêu cầu mở lại khóa đó thì cũng bị kẹt cứng; còn `RLock` có nhận diện khuôn mặt chủ phòng: thấy đúng người đang giữ phòng đi qua cửa phụ thì cho qua ngay và chỉ đếm thêm +1 lượt.',
    ['threading-lock', 'rlock', 'deadlock']
  ),
  q(
    'ex-q-445',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Một **Async Generator** (hàm được định nghĩa bằng `async def` và bên trong có chứa cả `await` lẫn `yield`) trả về đối tượng gì và phải được duyệt bằng cú pháp nào?',
    `async def stream_pages(client, total_pages: int):
    for page in range(1, total_pages + 1):
        resp = await client.get(f"/items?page={page}")
        yield resp.json()`,
    [
      'Trả về một đối tượng `AsyncGenerator` (implement `__aiter__` và `__anext__`), và phải được duyệt bằng vòng lặp bất đồng bộ **`async for data in stream_pages(client, 5):`** (hoặc async comprehension `[x async for x in ...]`).',
      'Có thể duyệt trực tiếp bằng vòng lặp `for data in await stream_pages(client, 5):` thông thường.',
      'Python cấm sử dụng cả `await` và `yield` trong cùng một hàm `async def`.',
      'Hàm sẽ tải toàn bộ 5 trang cùng lúc vào một `list` rồi mới trả về.',
    ],
    [
      'Chính xác! Kết hợp `async def` + `yield` tạo ra một **Asynchronous Generator** (PEP 525): ở mỗi bước lặp của `async for`, nó thực hiện thao tác I/O bất đồng bộ (`await client.get(...)`) rồi `yield` kết quả từng trang về cho nơi gọi xử lý ngay mà không cần tích trữ toàn bộ vào RAM.',
      'Sai. Bạn không thể `await` trực tiếp lời gọi hàm async generator `await stream_pages(...)` (vì nó trả về `async_generator`, không phải coroutine đơn lẻ), mà phải dùng `async for` hoặc `await anext(agen)`.',
      'Sai. Python 3.6+ (PEP 525) hỗ trợ chính thức Async Generators và đây là cơ chế nền tảng cho streaming responses (như LLM token streaming) và lifespan/yield dependencies trong FastAPI.',
      'Sai. Nó hoạt động theo cơ chế lazy streaming từng trang một.',
    ],
    0,
    'Lưu ý: nếu một Async Generator giữ tài nguyên cần đóng trong khối `finally:`, cách an toàn nhất là bọc nó bằng `async with contextlib.aclosing(stream_pages(...)) as agen:` trước khi chạy `async for` (để đảm bảo nếu vòng lặp `break` sớm thì `agen.aclose()` vẫn được gọi ngay lập tức).',
    'Async Generator giống như `async function*` trong JavaScript/TypeScript được duyệt bằng `for await (const data of streamPages())`.',
    ['async-generator', 'async-for', 'asyncio']
  ),
  q(
    'ex-q-446',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Bên dưới hậu trường của `asyncio.run(main())`, **Event Loop** dựa vào cơ chế nào của hệ điều hành (OS Kernel) để có thể theo dõi đồng thời 10.000 kết nối mạng đang chờ dữ liệu trên chỉ **1 luồng đơn duy nhất** mà không tốn 100% CPU lặp hỏi (`busy-waiting`)?',
    `# Làm sao 1 luồng Event Loop biết chính xác socket nào trong 10.000 sockets vừa có dữ liệu tới?`,
    [
      'Sử dụng cơ chế **I/O Multiplexing không chặn (non-blocking sockets)** của nhân hệ điều hành thông qua module `selectors`: **`epoll`** trên Linux, **`kqueue`** trên macOS/BSD, và **`IOCP`** trên Windows — OS Kernel sẽ đánh thức Event Loop dậy kèm danh sách chính xác những socket nào đã sẵn sàng đọc/ghi trong độ phức tạp `O(1)` theo sự kiện.',
      'Tạo ngầm 10.000 luồng C ẩn bên trong bộ nhớ để mỗi luồng canh gác 1 socket.',
      'Dùng một vòng lặp `while True` chạy liên tục không nghỉ để hỏi từng socket một từ 1 đến 10.000.',
      'Ủy quyền toàn bộ việc đọc socket cho card đồ họa GPU.',
    ],
    [
      'Chính xác! Đây là trái tim của lập trình hướng sự kiện hiện đại (giống hệt `libuv` của Node.js hay `tokio` của Rust): các socket được đặt ở chế độ `setblocking(False)` và đăng ký với `epoll`/`kqueue`/`IOCP`. Khi chưa có dữ liệu, luồng Event Loop ngủ yên ở tầng kernel (0% CPU); ngay khi card mạng nhận gói tin cho socket #4821, kernel đánh thức Event Loop và trả về đúng sự kiện của socket #4821 để chạy tiếp coroutine tương ứng!',
      'Sai. Nếu tạo 10.000 OS threads thì không còn là kiến trúc Event Loop đơn luồng nữa và sẽ tốn hàng GB RAM stack.',
      'Sai. Busy-waiting hỏi từng socket sẽ đốt cháy 100% CPU vô ích.',
      'Sai. GPU không quản lý network sockets.',
    ],
    0,
    'Trên Linux/macOS, bạn còn có thể thay thế Event Loop mặc định của Python bằng thư viện **`uvloop`** (viết bằng Cython bọc trên `libuv`), giúp tăng tốc độ xử lý I/O của `asyncio` ngang ngửa với Go và Node.js (Uvicorn mặc định tự bật `uvloop` khi cài `uvicorn[standard]`).',
    'Thay vì nhân viên lễ tân phải chạy bộ lên gõ cửa từng phòng trong 10.000 phòng khách sạn để hỏi "Khách có cần gì không?" (busy polling), khách sạn lắp bảng chuông báo trung tâm (`epoll`/`kqueue`): lễ tân ngồi yên đọc sách, phòng nào bấm chuông thì bảng sáng đúng số phòng đó lên.',
    ['event-loop', 'io-multiplexing', 'uvloop']
  ),
  q(
    'ex-q-447',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Khi khởi tạo tiến trình con bằng module `multiprocessing` trên **macOS** và **Windows** (nơi phương thức khởi tạo mặc định là **`spawn`** thay vì `fork`), tại sao bạn BẮT BUỘC phải đặt đoạn code khởi chạy tiến trình bên trong chốt chặn `if __name__ == "__main__":`?',
    `from multiprocessing import Process

def compute(x: int):
    print(x * x)

# Chuyện gì xảy ra nếu gọi Process(target=compute, args=(5,)).start()
# ở ngay cấp độ toàn cục (top-level) mà KHÔNG có if __name__ == "__main__":?`,
    [
      'Vì với cơ chế `spawn`, mỗi tiến trình con mới khởi động một trình thông dịch Python mới tinh và **import lại file script chính từ đầu** để lấy định nghĩa hàm `compute`; nếu lệnh `.start()` nằm ở ngoài `if __name__ == "__main__":`, tiến trình con khi import file sẽ lại gọi `.start()` đệ quy vô tận (fork bomb) cho tới khi bị `RuntimeError` chặn lại!',
      'Vì từ khóa `Process` chỉ là một từ khóa hợp lệ bên trong câu lệnh `if`.',
      'Vì nếu không có `if __name__ == "__main__":`, hàm `compute` sẽ tự động bị xóa khỏi bộ nhớ.',
      'Chỉ trên Linux mới cần `if __name__ == "__main__":`, còn trên Windows và macOS thì không cần.',
    ],
    [
      'Chính xác! Khi file chạy trực tiếp thì `__name__` là `"__main__"`, nhưng khi tiến trình con `spawn` import lại file đó thì `__name__` là `"__mp_main__"` (hoặc tên module). Nhờ chốt chặn `if __name__ == "__main__":`, tiến trình con chỉ nạp các định nghĩa hàm/class mà không chạy lại đoạn code sinh thêm tiến trình mới.',
      'Sai. `Process` là một class Python bình thường.',
      'Sai. Hàm `compute` vẫn tồn tại bình thường.',
      'Sai. Ngược lại: Windows và macOS mặc định dùng `spawn` (và kể từ Python 3.14, ngay cả Linux cũng đổi mặc định từ `fork` sang `forkserver`/`spawn` vì `fork` trong tiến trình đa luồng dễ gây deadlock!).',
    ],
    0,
    'Kể từ Python 3.14, phương thức mặc định trên Linux cũng đã được chuyển khỏi `fork` thuần túy sang `forkserver` để tránh lỗi deadlock kinh điển khi tiến trình cha vừa dùng `threading` (hoặc thư viện C có thread ngầm như OpenMP/gRPC) vừa gọi `os.fork()`.',
    '`spawn` giống như thuê nhân viên mới bằng cách phát cho họ cuốn sổ tay quy trình (file `.py`) để đọc từ trang 1: nếu trang 1 ghi "Bất kỳ ai đọc dòng này hãy lập tức đi thuê thêm 1 nhân viên mới", thì nhân viên mới đọc xong lại đi thuê người nữa tạo thành dây chuyền vô tận — trừ khi ghi rõ "Chỉ Giám đốc (`__main__`) mới thực hiện dòng tuyển dụng này".',
    ['multiprocessing-spawn', 'dunder-main']
  ),
  q(
    'ex-q-448',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Khi bạn có một danh sách các tác vụ bất đồng bộ có thời gian hoàn thành rất chênh lệch nhau (task A mất 0.1s, task B mất 5s, task C mất 0.2s) và muốn **xử lý kết quả ngay lập tức theo đúng thứ tự task nào xong trước thì xử lý trước**, hàm nào của `asyncio` phù hợp nhất?',
    `tasks = [fetch_slow(), fetch_fast(), fetch_medium()]
# Làm sao để in kết quả ngay khi từng task hoàn tất (fast -> medium -> slow)?`,
    [
      'Sử dụng `for coro in asyncio.as_completed(tasks): result = await coro` — hàm này trả về các awaitable theo đúng thứ tự hoàn thành thực tế (fastest-first) thay vì thứ tự truyền vào danh sách.',
      'Sử dụng `await asyncio.gather(*tasks)` (vì `gather` trả về từng cái ngay khi xong).',
      'Sử dụng `await asyncio.sleep(0)` trong vòng lặp.',
      'Sắp xếp danh sách `tasks.sort()` trước khi chạy.',
    ],
    [
      'Chính xác! Trong khi `asyncio.gather(*tasks)` phải đợi TẤT CẢ các task chạy xong hết rồi mới trả về một `list` theo thứ tự đầu vào ban đầu, thì `asyncio.as_completed(tasks)` cho phép bạn tiêu thụ kết quả cuốn chiếu ngay khi từng task vừa cán đích (task 0.1s được xử lý ngay ở giây 0.1 mà không phải chờ task 5s).',
      'Sai. `asyncio.gather()` chỉ trả về khi toàn bộ mọi task trong danh sách đã hoàn thành.',
      'Sai. `sleep(0)` chỉ nhường 1 nhịp của Event Loop.',
      'Sai. Bạn không thể biết trước thời gian mạng thực tế để `.sort()` các coroutine chưa chạy.',
    ],
    0,
    'Tương tự bên phía đa luồng/đa tiến trình (`concurrent.futures`), bạn cũng có hàm tương ứng là `concurrent.futures.as_completed(futures)` hoạt động theo đúng triết lý này.',
    '`asyncio.gather()` giống như đoàn du lịch bắt mọi người phải đợi người chậm nhất ra tới xe buýt rồi mới cùng xuất phát; còn `asyncio.as_completed()` giống như quầy trả đồ tại vạch đích cuộc đua: vận động viên nào về đích trước được trao huy chương và phỏng vấn ngay lập tức.',
    ['asyncio-as-completed', 'asyncio-gather']
  ),
  q(
    'ex-q-449',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Trong `asyncio`, đối tượng đồng bộ hóa **`asyncio.Event`** khác với `asyncio.Lock` như thế nào và thường được dùng cho kịch bản nào?',
    `ready_event = asyncio.Event()

async def worker(wid: int):
    await ready_event.wait()
    print(f"Worker {wid} bắt đầu chạy!")

async def coordinator():
    await load_initial_cache()
    ready_event.set()  # Đánh thức tất cả các worker cùng lúc!`,
    [
      '`asyncio.Event` quản lý một cờ boolean nội bộ (mặc định là `False`): nhiều coroutine có thể cùng gọi `await event.wait()` để đứng chờ; ngay khi một coroutine khác gọi `event.set()` (đặt cờ thành `True`), **TẤT CẢ các coroutine đang chờ đều được đánh thức đồng loạt** (broadcast signal) và các lời gọi `wait()` sau đó đi qua ngay lập tức cho tới khi `event.clear()` được gọi.',
      '`event.set()` chỉ đánh thức duy nhất 1 coroutine đầu tiên trong hàng đợi, các coroutine còn lại vẫn phải đứng chờ.',
      '`asyncio.Event` dùng để truyền các gói tin dữ liệu lớn giữa hai tiến trình khác nhau.',
      '`asyncio.Event` tự động đặt lại về `False` ngay sau khi có 1 coroutine đi qua.',
    ],
    [
      'Chính xác! Trong khi `Lock` dùng để loại trừ tương hỗ (chỉ 1 người vào một lúc), thì `Event` dùng để **phát tín hiệu quảng bá (broadcast notification)** một chiều: ví dụ 50 worker cùng chờ tín hiệu "Kết nối DB/Cache khởi tạo xong" (`ready_event.set()`) hoặc tín hiệu "Bắt đầu dừng hệ thống" (`shutdown_event.set()`).',
      'Sai. Đánh thức 1 coroutine là hành vi của `Lock` hoặc `Condition.notify(1)`, còn `Event.set()` mở cổng cho TẤT CẢ mọi coroutine đang `wait()`.',
      'Sai. Truyền dữ liệu là việc của `asyncio.Queue`, còn `Event` chỉ là cờ tín hiệu boolean trong cùng Event Loop.',
      'Sai. Cờ của `Event` giữ nguyên trạng thái `True` sau khi `.set()`, muốn đóng lại phải gọi tường minh `.clear()`.',
    ],
    0,
    '`asyncio.Event` đặc biệt hữu ích khi cài đặt cơ chế Graceful Shutdown hoặc đợi trạng thái sẵn sàng (Readiness) giữa các thành phần bất đồng bộ.',
    '`asyncio.Lock` giống như cửa buồng试 đồ chỉ cho từng người một vào; còn `asyncio.Event` giống như đèn tín hiệu giao thông ở vạch xuất phát trường đua: khi đèn chuyển sang Xanh (`event.set()`), toàn bộ 50 chiếc xe đang nổ máy chờ (`await event.wait()`) đồng loạt phóng đi cùng lúc!',
    ['asyncio-event', 'synchronization-primitives']
  ),
  q(
    'ex-q-450',
    'stage-5',
    'advanced',
    CAT_ADV_3,
    TAGS_ADV_3,
    'Khi nào bạn nên bật **AsyncIO Debug Mode** (`asyncio.run(main(), debug=True)` hoặc biến môi trường `PYTHONASYNCIODEBUG=1`) trong quá trình phát triển và nó giúp phát hiện những lỗi ẩn nào?',
    `# Chạy với debug=True trong môi trường dev/staging:
asyncio.run(main(), debug=True)`,
    [
      'Nó giúp phát hiện và cảnh báo sớm hai lỗi chí mạng trong lập trình bất đồng bộ: **(1) Các coroutine nào chiếm giữ CPU / chặn Event Loop quá lâu** (mặc định > 100ms, cấu hình qua `loop.slow_callback_duration`) và **(2) Truy vết đầy đủ stack trace tại nơi tạo ra các coroutine bị bỏ quên không được `await`** hoặc ngoại lệ chưa được lấy ra.',
      'Nó tự động sửa mọi lỗi `SyntaxError` trong các hàm `async def`.',
      'Nó giúp tăng tốc độ chạy của ứng dụng lên gấp 5 lần trên môi trường Production.',
      'Nó tự động chuyển đổi tất cả các thư viện đồng bộ như `requests` thành `httpx`.',
    ],
    [
      'Chính xác! Trong môi trường bình thường, nếu một lập trình viên vô tình gọi một hàm đồng bộ mất 250ms bên trong `async def`, hệ thống chỉ âm thầm bị giảm thông lượng mà không báo lỗi gì. Khi bật `debug=True`, `asyncio` sẽ đo thời gian từng bước callback và in ngay cảnh báo `Executing <Task ...> took 0.250 seconds` chỉ rõ hàm nào đang làm nghẽn Event Loop!',
      'Sai. `SyntaxError` là lỗi cú pháp lúc biên dịch, không thể tự sửa.',
      'Sai. Chế độ `debug=True` có thêm chi phí đo đạc và lưu stack trace nên chạy chậm hơn; chỉ bật ở Dev/Testing/Staging chứ không bật cố định trên Production.',
      'Sai. Nó chỉ giám sát và cảnh báo chứ không tự viết lại thư viện.',
    ],
    0,
    'Bạn còn có thể giảm ngưỡng phát hiện callback chậm bằng `loop.slow_callback_duration = 0.05` (50ms) trong bộ test hiệu năng để đảm bảo không có bất kỳ route bất đồng bộ nào vô tình làm nghẽn Event Loop.',
    'AsyncIO Debug Mode giống như gắn camera bắn tốc độ và đồng hồ bấm giờ lên từng mắt xích của dây chuyền Event Loop: hễ mắt xích nào giữ bóng quá 100ms là còi báo động hú lên chỉ đích danh vị trí gây tắc nghẽn.',
    ['asyncio-debug', 'event-loop-blocking']
  ),
];

export const EXAM_SETS_PART_7: ExamSet[] = [
  {
    id: 'exam-adv-packaging-pytest-decorators',
    title: 'Đề 16 (Advanced): Pytest, Decorators, Generators, Context Managers & Packaging',
    description:
      'Kiểm tra chuyên sâu Giai đoạn 3 (Advanced): Fixtures & Mocking trong Pytest, Decorator Factories & functools.wraps, Lazy Generators & yield from, Context Managers (__exit__, contextlib, ExitStack), Dataclasses nâng cao và chuẩn đóng gói Wheel/pyproject.toml.',
    targetLevel: 'advanced',
    targetStage: 'stage-3',
    durationMinutes: 35,
    passingScorePercent: 75,
    questions: SET_1_QUESTIONS,
  },
  {
    id: 'exam-adv-cpython-memory-descriptors-typing',
    title: 'Đề 17 (Advanced): CPython Internals, Bộ nhớ, Descriptors, Metaclasses & Type System',
    description:
      'Kiểm tra chuyên sâu Giai đoạn 4 (Advanced): Cấu trúc PyObject, Reference Counting & Cyclic GC, __slots__, weakref, Descriptor Protocol (Data vs Non-Data lookup priority), Metaclasses vs __init_subclass__, và Hệ thống Kiểu hiện đại (Protocol, PEP 695 Generics, Variance, ParamSpec, TypeIs).',
    targetLevel: 'advanced',
    targetStage: 'stage-4',
    durationMinutes: 40,
    passingScorePercent: 75,
    questions: SET_2_QUESTIONS,
  },
  {
    id: 'exam-adv-gil-asyncio-concurrency',
    title: 'Đề 18 (Advanced): GIL, Đa luồng, Đa tiến trình & Lập trình Bất đồng bộ (AsyncIO)',
    description:
      'Kiểm tra chuyên sâu Giai đoạn 5 (Advanced): Cơ chế GIL & Free-threaded Python (PEP 703), ThreadPool vs ProcessPool & Shared Memory, Event Loop (epoll/kqueue), Coroutines vs Tasks, TaskGroup & except*, Blocking Event Loop & asyncio.to_thread, Semaphore, CancelledError và ContextVar.',
    targetLevel: 'advanced',
    targetStage: 'stage-5',
    durationMinutes: 35,
    passingScorePercent: 75,
    questions: SET_3_QUESTIONS,
  },
];

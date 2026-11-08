export type LibraryKind = 'stdlib' | 'third-party';

export type LibraryDomainId =
  | 'all'
  | 'file-os'
  | 'data-structures'
  | 'time-format'
  | 'http-web-api'
  | 'validation-config'
  | 'db-orm-cache'
  | 'data-ai'
  | 'cli-log-test';

export interface PythonLibraryGuide {
  id: string;
  name: string;
  title: string;
  kind: LibraryKind;
  domain: Exclude<LibraryDomainId, 'all'>;
  domainLabel: string;
  installCmd: {
    uv: string;
    pip: string;
    poetry: string;
  };
  whatItIs: string;
  problemSolved: string;
  keyApis: {
    symbol: string;
    description: string;
  }[];
  usageCode: string;
  tipsAndTricks: string[];
  alternatives: {
    name: string;
    whenToChoose: string;
  }[];
  nodeJsEquivalent: {
    packages: string;
    explanation: string;
  };
}

export const LIBRARY_DOMAINS: { id: LibraryDomainId; label: string }[] = [
  { id: 'all', label: 'Tất cả lĩnh vực' },
  { id: 'file-os', label: 'File, Đường dẫn & Hệ điều hành' },
  { id: 'data-structures', label: 'Cấu trúc Dữ liệu & Hàm Tiện ích' },
  { id: 'time-format', label: 'Thời gian, JSON, CSV & Regex' },
  { id: 'http-web-api', label: 'Gọi HTTP & Xây dựng Web API' },
  { id: 'validation-config', label: 'Kiểm tra Dữ liệu & Cấu hình (.env)' },
  { id: 'db-orm-cache', label: 'Database ORM, Queue & Bất đồng bộ' },
  { id: 'data-ai', label: 'Xử lý Dữ liệu Lớn, Scraping & AI' },
  { id: 'cli-log-test', label: 'CLI, Logging, Retry & Kiểm thử' },
];

export const PYTHON_LIBRARIES_CATALOG: PythonLibraryGuide[] = [
  // ===========================================================================
  // PHẦN 1: THƯ VIỆN TIÊU CHUẨN (STANDARD LIBRARY — CÓ SẴN KHÔNG CẦN CÀI)
  // ===========================================================================
  {
    id: 'lib-std-pathlib',
    name: 'pathlib',
    title: 'pathlib — Xử lý Đường dẫn, Thư mục & Đọc/Ghi File Hướng đối tượng',
    kind: 'stdlib',
    domain: 'file-os',
    domainLabel: 'File, Đường dẫn & Hệ điều hành',
    installCmd: {
      uv: '# Có sẵn trong Python! Chỉ cần: from pathlib import Path',
      pip: '# Có sẵn trong Python! Chỉ cần: from pathlib import Path',
      poetry: '# Có sẵn trong Python! Chỉ cần: from pathlib import Path',
    },
    whatItIs:
      'Thư viện chuẩn hiện đại (từ Python 3.4+) biến đường dẫn file/thư mục thành đối tượng `Path` thông minh thay vì chuỗi văn bản rời rạc.',
    problemSolved:
      'Giải quyết triệt để lỗi nối chuỗi đường dẫn giữa Windows (`\\`) và macOS/Linux (`/`). Cho phép dùng toán tử `/` cực kỳ trực quan để nối đường dẫn và đọc/ghi file chỉ bằng 1 dòng lệnh.',
    keyApis: [
      {
        symbol: 'Path.cwd() / Path.home()',
        description: 'Lấy thư mục làm việc hiện tại hoặc thư mục người dùng (~).',
      },
      {
        symbol: 'path / "sub" / "file.txt"',
        description: 'Toán tử / tự động nối đường dẫn đúng chuẩn hệ điều hành.',
      },
      {
        symbol: '.read_text() / .write_text()',
        description: 'Đọc hoặc ghi toàn bộ nội dung file văn bản mà không cần mở/đóng `open()` thủ công.',
      },
      {
        symbol: '.exists() / .is_file() / .is_dir()',
        description: 'Kiểm tra sự tồn tại của file hoặc thư mục.',
      },
      {
        symbol: '.mkdir(parents=True, exist_ok=True)',
        description: 'Tạo thư mục nhiều cấp an toàn (giống mkdir -p).',
      },
      {
        symbol: '.glob("*.py") / .rglob("*.json")',
        description: 'Tìm kiếm file theo mẫu trong thư mục hiện tại hoặc đệ quy toàn bộ thư mục con (`rglob`).',
      },
      {
        symbol: '.stem / .suffix / .name / .parent',
        description: 'Tách nhanh tên file không đuôi (`.stem`), phần mở rộng (`.suffix`), tên đầy đủ (`.name`) và thư mục cha (`.parent`).',
      },
    ],
    usageCode: `from pathlib import Path

# 1. Nối đường dẫn bằng toán tử '/' (Tự động chạy đúng trên cả Windows lẫn macOS/Linux)
base_dir = Path.cwd()
data_dir = base_dir / "data" / "exports"

# 2. Tạo thư mục đệ quy (không báo lỗi nếu thư mục đã tồn tại)
data_dir.mkdir(parents=True, exist_ok=True)

# 3. Ghi và đọc file văn bản UTF-8 chỉ bằng 1 dòng lệnh
report_file = data_dir / "summary_2026.txt"
report_file.write_text("Doanh thu tháng: 150,000 USD\\n", encoding="utf-8")
content = report_file.read_text(encoding="utf-8")

# 4. Bóc tách thông tin file cực kỳ tiện lợi (không cần cắt chuỗi thủ công!)
print(report_file.name)    # "summary_2026.txt"
print(report_file.stem)    # "summary_2026" (Tên không kèm đuôi)
print(report_file.suffix)  # ".txt" (Đuôi file)
print(report_file.parent)  # Đường dẫn thư mục cha (.../data/exports)

# 5. Quét đệ quy mọi file .py trong dự án bằng rglob()
for py_file in base_dir.rglob("*.py"):
    print(f"Tìm thấy: {py_file}")`,
    tipsAndTricks: [
      'Luôn truyền `encoding="utf-8"` vào `.read_text(encoding="utf-8")` và `.write_text(..., encoding="utf-8")` vì trên Windows mặc định có thể dùng bảng mã CP1252 gây lỗi tiếng Việt.',
      'Để lấy thư mục chứa chính file code `.py` đang chạy, hãy dùng `HERE = Path(__file__).resolve().parent`.',
      'Dùng `report_file.with_suffix(".json")` để đổi đuôi file từ `.txt` sang `.json` cực gọn!',
    ],
    alternatives: [
      {
        name: 'os & os.path (Thư viện chuẩn cũ)',
        whenToChoose:
          'Chỉ dùng khi bảo trì code cũ (`os.path.join`, `os.makedirs`). Với mọi code mới, luôn dùng `pathlib.Path`.',
      },
      {
        name: 'shutil (Thư viện chuẩn đi kèm)',
        whenToChoose:
          'Kết hợp với `pathlib` khi cần copy cả thư mục (`shutil.copytree`), xóa cây thư mục không rỗng (`shutil.rmtree`) hoặc nén zip (`shutil.make_archive`).',
      },
    ],
    nodeJsEquivalent: {
      packages: 'node:path + node:fs/promises + glob',
      explanation:
        'Gộp cả `path.join()`, `path.parse()`, `fs.readFileSync()`, `fs.mkdirSync({ recursive: true })` và thư viện `glob` vào một đối tượng `Path` duy nhất.',
    },
  },
  {
    id: 'lib-std-collections',
    name: 'collections',
    title: 'collections — Bộ Cấu trúc Dữ liệu Hiệu năng Cao (Counter, defaultdict, deque)',
    kind: 'stdlib',
    domain: 'data-structures',
    domainLabel: 'Cấu trúc Dữ liệu & Hàm Tiện ích',
    installCmd: {
      uv: '# Có sẵn trong Python! Chỉ cần: from collections import Counter, defaultdict, deque',
      pip: '# Có sẵn trong Python! Chỉ cần: from collections import Counter, defaultdict, deque',
      poetry: '# Có sẵn trong Python! Chỉ cần: from collections import Counter, defaultdict, deque',
    },
    whatItIs:
      'Thư viện chuẩn cung cấp các cấu trúc dữ liệu chuyên dụng mở rộng từ `dict`, `list`, `tuple` giúp giải quyết các bài toán đếm tần suất, gom nhóm và hàng đợi với tốc độ C tối ưu.',
    problemSolved:
      'Tránh phải viết vòng lặp kiểm tra `if key not in d:` rườm rà khi gom nhóm dữ liệu, hoặc tránh lỗi hiệu năng chậm `O(n)` khi thêm/xóa phần tử ở đầu danh sách `list.pop(0)`.',
    keyApis: [
      {
        symbol: 'Counter(iterable) & .most_common(k)',
        description: 'Đếm tần suất xuất hiện của mọi phần tử chỉ trong 1 lệnh và lấy top K phần tử nhiều nhất.',
      },
      {
        symbol: 'defaultdict(list / int / set)',
        description: 'Từ điển tự động khởi tạo giá trị mặc định (như mảng rỗng `[]` hoặc `0`) khi truy cập vào key chưa tồn tại.',
      },
      {
        symbol: 'deque(maxlen=N)',
        description: 'Hàng đợi 2 đầu (Double-ended queue) cho phép thêm/xóa ở cả đầu trái (`appendleft`, `popleft`) lẫn đầu phải với tốc độ `O(1)`.',
      },
    ],
    usageCode: `from collections import Counter, defaultdict, deque

# 1. Counter: Đếm tần suất từ hoặc sự kiện và lấy Top 2 xuất hiện nhiều nhất
words = ["python", "fastapi", "python", "uv", "fastapi", "python"]
word_counts = Counter(words)
print(word_counts["python"])        # 3
print(word_counts.most_common(2))   # [('python', 3), ('fastapi', 2)]

# 2. defaultdict(list): Gom nhóm nhân viên theo phòng ban (Không bao giờ bị lỗi KeyError!)
employees = [("Engineering", "An"), ("Sales", "Bình"), ("Engineering", "Chi")]
by_dept: defaultdict[str, list[str]] = defaultdict(list)
for dept, name in employees:
    by_dept[dept].append(name)      # Tự động tạo [] nếu 'dept' chưa có!
print(dict(by_dept))                # {'Engineering': ['An', 'Chi'], 'Sales': ['Bình']}

# 3. deque(maxlen=3): Lưu lịch sử 3 thao tác gần nhất (tự đẩy phần tử cũ nhất ra khi đầy)
recent_logs: deque[str] = deque(maxlen=3)
for action in ["login", "view_item", "add_cart", "checkout"]:
    recent_logs.append(action)
print(list(recent_logs))            # ['view_item', 'add_cart', 'checkout']`,
    tipsAndTricks: [
      'Tuyệt đối không dùng `my_list.pop(0)` cho hàng đợi lớn vì `list` phải dịch chuyển toàn bộ phần tử còn lại trong RAM (`O(n)`). Hãy luôn dùng `deque.popleft()` (`O(1)`).',
      'Hai đối tượng `Counter` có thể cộng/trừ trực tiếp cho nhau: `total = Counter(day1) + Counter(day2)`.',
      'Mẹo tạo cấu trúc Tree lồng nhau vô hạn bằng 1 dòng: `Tree = lambda: defaultdict(Tree)`.',
    ],
    alternatives: [
      {
        name: 'dict.setdefault(key, []).append(val)',
        whenToChoose:
          'Dùng trên `dict` thường khi không muốn import `defaultdict`, nhưng `defaultdict(list)` nhanh và sạch hơn nhiều.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'Map / Object.groupBy() / lodash.countBy',
      explanation:
        'Trong JS/TS không có sẵn `deque` `O(1)` hay `Counter` tích hợp mà thường phải dùng `Object.groupBy` hoặc cài `lodash` / `denque`.',
    },
  },
  {
    id: 'lib-std-itertools-functools',
    name: 'itertools & functools',
    title: 'itertools & functools — Bộ Công cụ Lập trình Hàm, Bộ nhớ Đệm (Cache) & Xử lý Luồng Dữ liệu',
    kind: 'stdlib',
    domain: 'data-structures',
    domainLabel: 'Cấu trúc Dữ liệu & Hàm Tiện ích',
    installCmd: {
      uv: '# Có sẵn trong Python! Chỉ cần: import itertools, functools',
      pip: '# Có sẵn trong Python! Chỉ cần: import itertools, functools',
      poetry: '# Có sẵn trong Python! Chỉ cần: import itertools, functools',
    },
    whatItIs:
      'Hai thư viện chuẩn cực mạnh: `itertools` xử lý vòng lặp/tổ hợp tiết kiệm RAM (Lazy Evaluation), còn `functools` cung cấp các decorator tối ưu hàm như `@lru_cache`, `@cache`, `partial`.',
    problemSolved:
      'Giúp chia nhỏ danh sách lớn thành từng lô (`batched`), ghép nối nhiều danh sách mà không tốn RAM sao chép (`chain`), và tự động lưu cache kết quả hàm đệ quy/tính toán nặng chỉ bằng 1 dòng `@lru_cache`.',
    keyApis: [
      {
        symbol: '@functools.lru_cache(maxsize=128) / @cache',
        description: 'Tự động nhớ kết quả trả về của hàm theo tham số đầu vào (Memoization).',
      },
      {
        symbol: 'itertools.batched(iterable, n) (Python 3.12+)',
        description: 'Chia một danh sách lớn thành các lô (chunk/batch) có tối đa n phần tử (cực hay dùng khi gọi API hoặc insert DB theo lô!).',
      },
      {
        symbol: 'itertools.chain.from_iterable()',
        description: 'Làm phẳng (flatten) danh sách 2 chiều hoặc nối nhiều danh sách lười mà không tạo bản sao trong RAM.',
      },
      {
        symbol: 'itertools.product() / combinations()',
        description: 'Sinh tích Đề-các (thay thế 2–3 vòng lặp for lồng nhau) hoặc tổ hợp chập K.',
      },
      {
        symbol: 'functools.partial(func, arg1=...)',
        description: 'Tạo hàm mới đã gắn cố định trước một số tham số.',
      },
    ],
    usageCode: `from functools import lru_cache
from itertools import batched, chain, product

# 1. @lru_cache: Tự động cache kết quả hàm tính toán nặng (hoặc cấu hình đọc từ đĩa)
@lru_cache(maxsize=256)
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(50))  # Chạy trong 0.0001 giây nhờ cache (nếu không cache sẽ treo máy!)

# 2. itertools.batched (Python 3.12+): Chia 10 ID thành từng lô 4 ID để insert DB
user_ids = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
for batch in batched(user_ids, 4):
    print("Xử lý lô:", batch)
# -> (101, 102, 103, 104) | (105, 106, 107, 108) | (109, 110)

# 3. itertools.chain: Nối nhiều danh sách mà không tốn RAM tạo mảng mới
list_a, list_b = [1, 2], [3, 4]
print(list(chain(list_a, list_b)))  # [1, 2, 3, 4]

# 4. itertools.product: Thay thế vòng lặp for lồng nhau
sizes = ["S", "M"]
colors = ["Đen", "Trắng"]
variants = list(product(sizes, colors))  # [('S', 'Đen'), ('S', 'Trắng'), ...]`,
    tipsAndTricks: [
      'Trong FastAPI, người ta rất hay gắn `@lru_cache` lên hàm `get_settings()` để chỉ đọc file `.env` đúng 1 lần duy nhất trong suốt vòng đời ứng dụng!',
      'Lưu ý: Mọi tham số truyền vào hàm dùng `@lru_cache` phải là kiểu bất biến (Hashable như `str`, `int`, `tuple`), không truyền `list` hay `dict` vào được.',
      'Nếu dùng Python < 3.12 chưa có `itertools.batched`, bạn có thể dùng thư viện `more-itertools` (`chunked`).',
    ],
    alternatives: [
      {
        name: 'more-itertools (Thư viện ngoài: uv add more-itertools)',
        whenToChoose:
          'Mở rộng hơn 100 hàm xử lý chuỗi lặp nâng cao (`chunked`, `windowed`, `unique_everseen`, `first_true`).',
      },
      {
        name: 'cachetools (Thư viện ngoài: uv add cachetools)',
        whenToChoose:
          'Khi bạn cần cache có thời gian hết hạn tự động (**TTL Cache** — ví dụ hết hạn sau 60 giây), vì `@lru_cache` chuẩn không có TTL.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'lodash.chunk / lodash.memoize / Ramda',
      explanation:
        'Tương đương các hàm tiện ích của `lodash` (`_.chunk`, `_.flatten`, `_.memoize`) nhưng được tích hợp sẵn ở tầng C trong Python.',
    },
  },
  {
    id: 'lib-std-datetime-zoneinfo',
    name: 'datetime & zoneinfo',
    title: 'datetime & zoneinfo — Xử lý Ngày giờ, Múi giờ Chuẩn IANA & Khoảng Thời gian',
    kind: 'stdlib',
    domain: 'time-format',
    domainLabel: 'Thời gian, JSON, CSV & Regex',
    installCmd: {
      uv: '# Có sẵn trong Python 3.9+! (Trên Windows nếu thiếu dữ liệu múi giờ: uv add tzdata)',
      pip: '# Có sẵn trong Python 3.9+! (Trên Windows nếu thiếu dữ liệu múi giờ: pip install tzdata)',
      poetry: '# Có sẵn trong Python 3.9+!',
    },
    whatItIs:
      'Bộ đôi thư viện chuẩn xử lý thời gian (`datetime`, `date`, `timedelta`) và múi giờ chuẩn quốc tế IANA (`zoneinfo.ZoneInfo` như `"Asia/Ho_Chi_Minh"`, `"UTC"`).',
    problemSolved:
      'Tránh lỗi lệch múi giờ kinh điển giữa máy lập trình viên (GMT+7) và Server (UTC), tính toán cộng/trừ ngày tháng chính xác và chuyển đổi chuỗi chuẩn ISO 8601.',
    keyApis: [
      {
        symbol: 'datetime.now(timezone.utc) / ZoneInfo("Asia/Ho_Chi_Minh")',
        description: 'Lấy thời gian hiện tại có gắn kèm thông tin múi giờ rõ ràng (Timezone-aware datetime).',
      },
      {
        symbol: 'timedelta(days=7, hours=2, minutes=30)',
        description: 'Biểu diễn khoảng thời gian để cộng/trừ trực tiếp với `datetime` (ví dụ: thời gian hết hạn token).',
      },
      {
        symbol: '.isoformat() & datetime.fromisoformat()',
        description: 'Chuyển đổi qua lại giữa đối tượng `datetime` và chuỗi chuẩn ISO 8601 (`"2026-11-08T14:30:00+07:00"`).',
      },
      {
        symbol: '.strftime(fmt) & datetime.strptime(str, fmt)',
        description: 'Định dạng ngày giờ sang chuỗi tùy chỉnh (`"%d/%m/%Y %H:%M"`) hoặc đọc ngược từ chuỗi.',
      },
    ],
    usageCode: `from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

# 1. QUY TẮC VÀNG: Luôn lấy giờ hiện tại kèm múi giờ (Không gọi datetime.now() trần!)
now_utc = datetime.now(timezone.utc)
vn_tz = ZoneInfo("Asia/Ho_Chi_Minh")
now_vn = now_utc.astimezone(vn_tz)

print("Giờ UTC chuẩn:", now_utc.isoformat())
print("Giờ Việt Nam:", now_vn.strftime("%d/%m/%Y %H:%M:%S %Z"))

# 2. Cộng / Trừ khoảng thời gian với timedelta (VD: Token hết hạn sau 15 phút, Gia hạn 30 ngày)
token_expires_at = now_utc + timedelta(minutes=15)
subscription_end = now_vn + timedelta(days=30)

# 3. Tính khoảng cách giữa 2 mốc thời gian
remaining = token_expires_at - now_utc
print(f"Còn lại: {remaining.total_seconds()} giây")`,
    tipsAndTricks: [
      'Tuyệt đối KHÔNG dùng `datetime.utcnow()` (đã bị ngừng khuyến nghị trong Python 3.12+ vì tạo ra đối tượng Naive datetime thiếu thông tin múi giờ). Luôn dùng `datetime.now(timezone.utc)`!',
      'Trong Backend/Database, luôn lưu thời gian theo **UTC** (`timezone.utc`), và chỉ chuyển sang `ZoneInfo("Asia/Ho_Chi_Minh")` khi hiển thị cho người dùng cuối.',
    ],
    alternatives: [
      {
        name: 'pendulum hoặc whenever (Thư viện ngoài: uv add pendulum / uv add whenever)',
        whenToChoose:
          'Khi bạn muốn cú pháp thân thiện hơn (như `now.add(months=1)`, `now.diff_for_humans()` -> `"2 giờ trước"`), tương tự `dayjs` / `luxon`.',
      },
      {
        name: 'python-dateutil (uv add python-dateutil)',
        whenToChoose:
          'Khi cần cộng trừ theo tháng/năm lịch (`relativedelta(months=+1)`) hoặc parse chuỗi ngày tháng tự do.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'Date / Intl.DateTimeFormat / dayjs / date-fns / Temporal',
      explanation:
        '`datetime` + `zoneinfo` tích hợp sẵn khả năng xử lý múi giờ và `timedelta` mạnh hơn nhiều so với đối tượng `Date` mặc định của JavaScript.',
    },
  },
  {
    id: 'lib-std-json-tomllib-csv',
    name: 'json, tomllib & csv',
    title: 'json, tomllib & csv — Đọc/Ghi Dữ liệu JSON, Cấu hình TOML & Bảng tính CSV',
    kind: 'stdlib',
    domain: 'time-format',
    domainLabel: 'Thời gian, JSON, CSV & Regex',
    installCmd: {
      uv: '# Có sẵn trong Python! Chỉ cần: import json, tomllib, csv',
      pip: '# Có sẵn trong Python! Chỉ cần: import json, tomllib, csv',
      poetry: '# Có sẵn trong Python! Chỉ cần: import json, tomllib, csv',
    },
    whatItIs:
      'Bộ 3 thư viện chuẩn giúp chuyển đổi dữ liệu giữa cấu trúc Python (`dict`, `list`) với các định dạng trao đổi phổ biến nhất: JSON, TOML (từ Python 3.11+) và CSV.',
    problemSolved:
      'Đọc/ghi cấu hình, lưu trữ dữ liệu API và xuất/nhập file CSV mở bằng Excel mà không cần cài thêm bất kỳ gói phụ thuộc nào.',
    keyApis: [
      {
        symbol: 'json.dumps(obj, ensure_ascii=False, indent=2)',
        description: 'Chuyển `dict`/`list` sang chuỗi JSON (`s` = string). Nhớ đặt `ensure_ascii=False` để giữ nguyên dấu tiếng Việt!',
      },
      {
        symbol: 'json.loads(str) / json.load(file)',
        description: 'Đọc chuỗi JSON (`loads`) hoặc file JSON (`load`) thành `dict`/`list` trong Python.',
      },
      {
        symbol: 'tomllib.loads() / tomllib.load(binary_file)',
        description: 'Đọc file cấu hình `.toml` (như `pyproject.toml`) thành `dict` (Lưu ý: mở file ở chế độ nhị phân `"rb"`).',
      },
      {
        symbol: 'csv.DictReader & csv.DictWriter',
        description: 'Đọc và ghi từng dòng CSV dưới dạng `dict` theo tên cột tiêu đề (thay vì phải nhớ chỉ số cột 0, 1, 2).',
      },
    ],
    usageCode: `import csv
import io
import json
import tomllib

# 1. JSON: Luôn truyền ensure_ascii=False để tiếng Việt không bị biến thành \\u1ec7
payload = {"user": "Sơn Trần", "roles": ["admin", "dev"], "active": True}
json_str = json.dumps(payload, ensure_ascii=False, indent=2)
parsed = json.loads(json_str)

# 2. TOML (Python 3.11+): Đọc cấu hình chuẩn
toml_text = """
[database]
host = "localhost"
port = 5432
"""
config = tomllib.loads(toml_text)
print(config["database"]["port"])  # 5432

# 3. CSV DictWriter / DictReader: Làm việc với CSV bằng tên cột rõ ràng
buffer = io.StringIO()
writer = csv.DictWriter(buffer, fieldnames=["id", "name", "score"])
writer.writeheader()
writer.writerow({"id": 1, "name": "An", "score": 9.5})

buffer.seek(0)
for row in csv.DictReader(buffer):
    print(row["name"], row["score"])  # An 9.5`,
    tipsAndTricks: [
      'Bẫy phổ biến nhất của người Việt khi dùng `json.dumps()`: Mặc định `ensure_ascii=True` sẽ biến `"Việt Nam"` thành `"Vi\\u1ec7t Nam"`. Hãy luôn truyền `ensure_ascii=False`!',
      'Khi mở file CSV để ghi trên Windows hoặc để mở bằng Microsoft Excel không bị lỗi font tiếng Việt, hãy mở file với `encoding="utf-8-sig"` (thêm BOM cho Excel) và `newline=""`.',
    ],
    alternatives: [
      {
        name: 'orjson (Thư viện ngoài viết bằng Rust: uv add orjson)',
        whenToChoose:
          'Khi làm Backend hiệu năng cao: `orjson` nhanh gấp 10 lần `json` chuẩn và tự động serialize được cả `datetime`, `UUID`, `dataclass` mà `json` chuẩn báo lỗi `TypeError`!',
      },
      {
        name: 'polars / pandas (uv add polars)',
        whenToChoose:
          'Khi đọc/ghi và phân tích file CSV/Excel/Parquet hàng trăm nghìn đến hàng triệu dòng.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'JSON.stringify + JSON.parse / csv-parse / smol-toml',
      explanation:
        '`json.dumps` = `JSON.stringify`, `json.loads` = `JSON.parse`. Còn `csv` và `tomllib` có sẵn trong Python trong khi Node.js phải cài thêm package ngoài.',
    },
  },
  {
    id: 'lib-std-dataclasses-typing',
    name: 'dataclasses, typing & enum',
    title: 'dataclasses, typing & enum — Định nghĩa Model Dữ liệu Sạch sẽ & Kiểu Tĩnh',
    kind: 'stdlib',
    domain: 'validation-config',
    domainLabel: 'Kiểm tra Dữ liệu & Cấu hình (.env)',
    installCmd: {
      uv: '# Có sẵn trong Python! Chỉ cần: from dataclasses import dataclass',
      pip: '# Có sẵn trong Python! Chỉ cần: from dataclasses import dataclass',
      poetry: '# Có sẵn trong Python! Chỉ cần: from dataclasses import dataclass',
    },
    whatItIs:
      'Bộ công cụ chuẩn giúp định nghĩa các lớp chứa dữ liệu (`@dataclass`), tập hằng số định danh (`Enum`, `StrEnum`) và chú thích kiểu dữ liệu (`typing`) mà không phải viết hàm `__init__`, `__repr__`, `__eq__` lặp đi lặp lại.',
    problemSolved:
      'Giúp code có cấu trúc rõ ràng, được IDE (VS Code Pylance) gợi ý thuộc tính chính xác 100% như `interface` / `type` trong TypeScript, đồng thời giảm 70% lượng code boilerplate của class truyền thống.',
    keyApis: [
      {
        symbol: '@dataclass(slots=True, frozen=True)',
        description: 'Tự sinh `__init__`, `__repr__`, `__eq__`. Thêm `slots=True` để giảm 40% RAM và `frozen=True` để biến đối tượng thành bất biến (Immutable).',
      },
      {
        symbol: 'field(default_factory=list)',
        description: 'Tạo giá trị mặc định an toàn cho các thuộc tính kiểu `list`, `dict`, `set` trong dataclass.',
      },
      {
        symbol: 'StrEnum (Python 3.11+)',
        description: 'Tạo Enum mà bản thân mỗi phần tử vừa là Enum vừa là chuỗi `str` (serialize ra JSON cực tiện).',
      },
      {
        symbol: 'Protocol, Literal, TypeAlias, Any',
        description: 'Định nghĩa Interface theo cấu trúc (`Protocol` giống `interface` trong TS) và kiểu giá trị cố định (`Literal["pending", "paid"]`).',
      },
    ],
    usageCode: `from dataclasses import dataclass, field
from enum import StrEnum
from typing import Literal

# 1. StrEnum (Python 3.11+): Thay thế các chuỗi "magic string" rời rạc
class OrderStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"

# 2. @dataclass: Tự động có hàm khởi tạo, so sánh == và in log đẹp
@dataclass(slots=True, kw_only=True)
class OrderItem:
    sku: str
    price: int
    quantity: int = 1
    tags: list[str] = field(default_factory=list)

    @property
    def subtotal(self) -> int:
        return self.price * self.quantity

item = OrderItem(sku="MBP-M4", price=45_000_000, quantity=2, tags=["apple"])
print(item)           # OrderItem(sku='MBP-M4', price=45000000, quantity=2, tags=['apple'])
print(item.subtotal)  # 90000000`,
    tipsAndTricks: [
      'Từ Python 3.10+, luôn thêm `slots=True` vào `@dataclass(slots=True)` để CPython lưu thuộc tính vào mảng cố định thay vì `__dict__`, giúp tiết kiệm bộ nhớ và truy cập thuộc tính nhanh hơn ~20%.',
      'Không bao giờ viết `tags: list[str] = []` trực tiếp trong class, hãy dùng `field(default_factory=list)` (`dataclass` sẽ tự báo lỗi nhắc bạn nếu bạn quên!).',
      'Lưu ý: `@dataclass` KHÔNG tự động kiểm tra hay ép kiểu dữ liệu lúc chạy (Runtime Validation). Nếu dữ liệu đến từ bên ngoài (JSON/API/User input), hãy dùng **`Pydantic`**!',
    ],
    alternatives: [
      {
        name: 'Pydantic (Thư viện ngoài số 1: uv add pydantic)',
        whenToChoose:
          'Khi dữ liệu đến từ người dùng, API Request/Response, Webhook hoặc biến môi trường cần kiểm tra tính hợp lệ (Validation) và parse JSON tự động.',
      },
      {
        name: 'attrs / msgspec (uv add attrs / uv add msgspec)',
        whenToChoose:
          '`msgspec` cực nhanh khi cần vừa định nghĩa Struct vừa parse JSON/MessagePack với tốc độ cao nhất.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'TypeScript interface / type / enum + class',
      explanation:
        '`@dataclass` giống một `class` trong TypeScript có khai báo thuộc tính `constructor(public sku: string, ...)`, còn `typing.Protocol` giống hệt `interface` của TypeScript.',
    },
  },
  {
    id: 'lib-std-subprocess-shutil-os',
    name: 'subprocess, shutil & os',
    title: 'subprocess, shutil & os — Chạy Lệnh Hệ thống, Thao tác Thư mục Nặng & Biến Môi trường',
    kind: 'stdlib',
    domain: 'file-os',
    domainLabel: 'File, Đường dẫn & Hệ điều hành',
    installCmd: {
      uv: '# Có sẵn trong Python! Chỉ cần: import subprocess, shutil, os',
      pip: '# Có sẵn trong Python! Chỉ cần: import subprocess, shutil, os',
      poetry: '# Có sẵn trong Python! Chỉ cần: import subprocess, shutil, os',
    },
    whatItIs:
      'Bộ thư viện chuẩn dùng để viết script tự động hóa DevOps: `subprocess` gọi các chương trình dòng lệnh bên ngoài (`git`, `docker`, `ffmpeg`), `shutil` sao chép/xóa/nén thư mục lớn, và `os.environ` đọc biến môi trường.',
    problemSolved:
      'Thay thế hoàn toàn các file Bash/PowerShell phức tạp bằng code Python an toàn, bắt được mã lỗi (`returncode`), `stdout`, `stderr` và đặt giới hạn thời gian chạy (`timeout`).',
    keyApis: [
      {
        symbol: 'subprocess.run([...], capture_output=True, text=True, check=True)',
        description: 'Chạy lệnh hệ thống an toàn (truyền mảng tham số để chống lỗi Command Injection), thu kết quả trả về dưới dạng chuỗi.',
      },
      {
        symbol: 'shutil.copytree() / shutil.rmtree() / shutil.which()',
        description: 'Copy toàn bộ cây thư mục, xóa thư mục không rỗng hoặc kiểm tra xem máy đã cài một lệnh CLI nào đó chưa (`shutil.which("docker")`).',
      },
      {
        symbol: 'os.getenv("KEY", "default")',
        description: 'Đọc giá trị biến môi trường của hệ điều hành kèm giá trị mặc định.',
      },
    ],
    usageCode: `import os
import shutil
import subprocess

# 1. Kiểm tra xem máy có cài công cụ 'git' không
if shutil.which("git") is not None:
    # 2. Chạy lệnh bên ngoài an toàn bằng danh sách tham số (KHÔNG dùng shell=True!)
    result = subprocess.run(
        ["git", "status", "--short"],
        capture_output=True,
        text=True,
        check=True,      # Tự ném ngoại lệ CalledProcessError nếu lệnh trả mã lỗi != 0
        timeout=10,      # Tự hủy nếu chạy quá 10 giây
    )
    print("Kết quả git status:", result.stdout.strip())

# 3. Đọc biến môi trường kèm giá trị dự phòng
app_env = os.getenv("APP_ENV", "development")
print(f"Đang chạy ở môi trường: {app_env}")`,
    tipsAndTricks: [
      'Bảo mật sống còn: Luôn truyền lệnh dưới dạng danh sách `["git", "commit", "-m", msg]` và giữ `shell=False` (mặc định). Tuyệt đối không nối chuỗi với `shell=True` khi có dữ liệu từ người dùng (tránh lỗ hổng OS Command Injection)!',
      'Luôn thêm `timeout=...` vào `subprocess.run()` để tiến trình con bị treo không làm treo luôn ứng dụng chính của bạn.',
    ],
    alternatives: [
      {
        name: 'pydantic-settings / python-dotenv (uv add pydantic-settings)',
        whenToChoose:
          'Thay thế việc gọi `os.getenv()` rời rạc bằng một class cấu hình tự động đọc file `.env` và ép kiểu dữ liệu (`int`, `bool`, `list`).',
      },
    ],
    nodeJsEquivalent: {
      packages: 'node:child_process (execFile / spawn) + fs-extra + process.env',
      explanation:
        '`subprocess.run` tương đương `execFileSync` / `execa`, `shutil` tương đương `fs-extra`, còn `os.getenv` tương đương `process.env`.',
    },
  },
  {
    id: 'lib-std-re-secrets-hashlib',
    name: 're, secrets & hashlib',
    title: 're, secrets & hashlib — Biểu thức Chính quy (Regex), Tạo Token Bảo mật & Băm SHA-256',
    kind: 'stdlib',
    domain: 'time-format',
    domainLabel: 'Thời gian, JSON, CSV & Regex',
    installCmd: {
      uv: '# Có sẵn trong Python! Chỉ cần: import re, secrets, hashlib, hmac',
      pip: '# Có sẵn trong Python! Chỉ cần: import re, secrets, hashlib, hmac',
      poetry: '# Có sẵn trong Python! Chỉ cần: import re, secrets, hashlib, hmac',
    },
    whatItIs:
      'Bộ thư viện chuẩn xử lý tìm kiếm/bóc tách văn bản bằng Regex (`re`), sinh mã ngẫu nhiên an toàn mật mã học (`secrets`), và băm dữ liệu/kiểm tra chữ ký Webhook (`hashlib`, `hmac`).',
    problemSolved:
      'Xử lý trích xuất chuỗi phức tạp, tạo API Key / Reset Password Token không thể đoán trước, và xác thực chữ ký HMAC-SHA256 từ Stripe/GitHub Webhook mà không cần cài thư viện ngoài.',
    keyApis: [
      {
        symbol: 're.compile(r"...") / .search() / .findall() / .sub()',
        description: 'Biên dịch mẫu Regex (luôn dùng raw string `r"..."`), tìm kiếm, trích xuất danh sách khớp hoặc thay thế chuỗi.',
      },
      {
        symbol: 'secrets.token_urlsafe(32) / secrets.token_hex(16)',
        description: 'Sinh chuỗi token ngẫu nhiên chuẩn mật mã học (CSPRNG) cho Session ID, API Key, OTP.',
      },
      {
        symbol: 'secrets.compare_digest(a, b)',
        description: 'So sánh 2 chuỗi bí mật với thời gian cố định (chống tấn công Timing Attack).',
      },
      {
        symbol: 'hashlib.sha256(data).hexdigest()',
        description: 'Tính mã băm SHA-256 của chuỗi hoặc file.',
      },
    ],
    usageCode: `import hashlib
import re
import secrets

# 1. Regex (Luôn thêm chữ r ở đầu chuỗi r"..." để không phải gõ 2 dấu gạch chéo \\\\)
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")
text = "Liên hệ hỗ trợ: dev@pylearn.vn hoặc admin@company.com"
emails = EMAIL_PATTERN.findall(text)
print("Emails trích xuất:", emails)

# 2. secrets: Sinh API Key / Token an toàn mật mã học (KHÔNG dùng module random cho bảo mật!)
api_key = f"sk_live_{secrets.token_urlsafe(24)}"
otp_code = f"{secrets.randbelow(1_000_000):06d}"

# 3. hashlib: Tính mã băm SHA-256
digest = hashlib.sha256(b"order_1001_secret").hexdigest()
print("SHA-256:", digest[:16] + "...")`,
    tipsAndTricks: [
      'Không bao giờ dùng module `random` để tạo mật khẩu, OTP hay Session Token vì `random` dùng thuật toán Mersenne Twister có thể bị dự đoán ngược! Luôn dùng **`secrets`**.',
      'Khi viết Regex trong Python, luôn đặt tiền tố **`r`** trước chuỗi (`r"\\d+"`) để Python giữ nguyên ký tự `\\` cho bộ máy Regex.',
      'Lưu ý: `hashlib.sha256` quá nhanh nên KHÔNG dùng để băm mật khẩu người dùng lưu vào DB. Để băm mật khẩu, hãy dùng thư viện ngoài `pwdlib` hoặc ` argon2-cffi` / `bcrypt`!',
    ],
    alternatives: [
      {
        name: 'regex (Thư viện ngoài: uv add regex)',
        whenToChoose:
          'Khi cần các tính năng Regex nâng cao hơn module `re` chuẩn (như khớp theo thuộc tính Unicode `\\p{L}` hoặc chạy đa luồng nhả GIL).',
      },
    ],
    nodeJsEquivalent: {
      packages: 'RegExp + node:crypto (randomBytes, createHash, timingSafeEqual)',
      explanation:
        '`secrets` + `hashlib` tương đương module `node:crypto` trong Node.js.',
    },
  },

  // ===========================================================================
  // PHẦN 2: THƯ VIỆN BÊN THỨ 3 PHỔ BIẾN NHẤT TRONG THỰC TẾ (THIRD-PARTY ECOSYSTEM)
  // ===========================================================================
  {
    id: 'lib-3rd-httpx-requests',
    name: 'httpx (và requests)',
    title: 'httpx & requests — Gọi REST API, HTTP/2, Timeout, Connection Pool & Async Client',
    kind: 'third-party',
    domain: 'http-web-api',
    domainLabel: 'Gọi HTTP & Xây dựng Web API',
    installCmd: {
      uv: 'uv add httpx',
      pip: 'pip install httpx',
      poetry: 'poetry add httpx',
    },
    whatItIs:
      '`httpx` là thư viện HTTP Client thế hệ mới cho Python: giữ nguyên cú pháp cực kỳ dễ dùng của `requests` huyền thoại nhưng hỗ trợ cả chạy đồng bộ (`Client`) lẫn bất đồng bộ (`AsyncClient`), hỗ trợ HTTP/2 và bắt buộc cấu hình Timeout an toàn.',
    problemSolved:
      'Thư viện chuẩn `urllib.request` có sẵn của Python quá dài dòng và thiếu Connection Pooling. `requests` và `httpx` giúp gọi REST API, truyền Query Params, Headers, JSON body, Bearer Token và quản lý phiên kết nối chỉ trong vài dòng code.',
    keyApis: [
      {
        symbol: 'httpx.Client(base_url=..., timeout=10.0) / AsyncClient',
        description: 'Tạo phiên kết nối tái sử dụng TCP Connection Pool (nhanh gấp nhiều lần so với gọi `httpx.get()` rời rạc từng lần).',
      },
      {
        symbol: 'resp = client.get("/users", params={...}) / client.post(..., json={...})',
        description: 'Gửi request GET/POST, tự động mã hóa query params và serialize `dict` thành JSON body kèm header `application/json`.',
      },
      {
        symbol: 'resp.raise_for_status()',
        description: 'Tự động ném ngoại lệ `HTTPStatusError` nếu server trả về mã lỗi 4xx hoặc 5xx (400, 401, 404, 500).',
      },
      {
        symbol: 'resp.json() / resp.status_code / resp.headers',
        description: 'Parse kết quả JSON trả về thành `dict`/`list` và đọc mã trạng thái.',
      },
    ],
    usageCode: `import httpx

# 1. Gọi đồng bộ (Sync) với Context Manager 'with' để tái sử dụng TCP Connection Pool
with httpx.Client(
    base_url="https://api.github.com",
    headers={"Accept": "application/vnd.github+json"},
    timeout=10.0,  # Luôn đặt timeout rõ ràng!
) as client:
    response = client.get("/repos/astral-sh/uv")
    response.raise_for_status()  # Ném lỗi ngay nếu HTTP status >= 400
    data = response.json()
    print(f"Repo: {data['full_name']} | Sao: {data['stargazers_count']:,}")

# 2. Gọi bất đồng bộ (Async) siêu tốc khi dùng trong FastAPI hoặc asyncio:
async def fetch_user(user_id: int) -> dict:
    async with httpx.AsyncClient(timeout=5.0) as aclient:
        resp = await aclient.get(f"https://jsonplaceholder.typicode.com/users/{user_id}")
        resp.raise_for_status()
        return resp.json()`,
    tipsAndTricks: [
      'Cạm bẫy lớn nhất với `requests`: Gọi `requests.get(url)` mà quên truyền `timeout=10` sẽ đợi **vô hạn** nếu server đích bị treo, làm treo toàn bộ ứng dụng! (`httpx` mặc định đặt sẵn timeout 5 giây rất an toàn).',
      'Khác với `axios` trong JS tự ném lỗi khi gặp HTTP 404/500, cả `requests` và `httpx` đều coi việc nhận được phản hồi 404/500 là "gửi request thành công". Hãy luôn gọi **`response.raise_for_status()`** trước khi đọc `response.json()`!',
      'Khi gọi nhiều request liên tiếp tới cùng một server, luôn dùng `with httpx.Client() as client:` (hoặc `requests.Session()`) để tái sử dụng kết nối TLS/TCP.',
    ],
    alternatives: [
      {
        name: 'requests (uv add requests)',
        whenToChoose:
          'Thư viện HTTP đồng bộ phổ biến nhất lịch sử Python. Phù hợp cho script thuần đồng bộ, nhưng nếu dùng chung với `FastAPI` / `asyncio` thì bắt buộc phải chuyển sang `httpx` hoặc `aiohttp`.',
      },
      {
        name: 'aiohttp (uv add aiohttp)',
        whenToChoose:
          'Khi bạn cần bắn hàng nghìn kết nối HTTP bất đồng bộ hoặc WebSockets cùng lúc với hiệu năng nguyên bản cao nhất.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'axios / undici / native fetch()',
      explanation:
        '`httpx.Client` tương đương `axios.create({ baseURL, timeout })`. Lưu ý `resp.raise_for_status()` để bắt lỗi 4xx/5xx giống `axios`.',
    },
  },
  {
    id: 'lib-3rd-pydantic',
    name: 'pydantic & pydantic-settings',
    title: 'Pydantic v2 & pydantic-settings — Kiểm tra Dữ liệu (Validation), Parse JSON & Quản lý Cấu hình .env',
    kind: 'third-party',
    domain: 'validation-config',
    domainLabel: 'Kiểm tra Dữ liệu & Cấu hình (.env)',
    installCmd: {
      uv: 'uv add pydantic pydantic-settings',
      pip: 'pip install pydantic pydantic-settings',
      poetry: 'poetry add pydantic pydantic-settings',
    },
    whatItIs:
      'Thư viện kiểm tra tính hợp lệ dữ liệu (Data Validation) và quản lý cấu hình phổ biến nhất thế giới Python hiện nay. Lõi của Pydantic v2 được viết bằng **Rust (`pydantic-core`)** nên cực nhanh.',
    problemSolved:
      'Dữ liệu từ API Request, Webhook, Database hoặc kết quả trả về từ LLM/AI thường là `dict` thô không đảm bảo đúng kiểu. Pydantic tự động kiểm tra, ép kiểu an toàn, báo lỗi chi tiết từng trường và chuyển đổi qua lại giữa `dict` / JSON và Object có kiểu chặt chẽ.',
    keyApis: [
      {
        symbol: 'class User(BaseModel): ...',
        description: 'Định nghĩa schema dữ liệu bằng chính cú pháp Type Hints chuẩn của Python.',
      },
      {
        symbol: 'Field(ge=0, min_length=3, default=...)',
        description: 'Khai báo ràng buộc dữ liệu (lớn hơn hoặc bằng 0, độ dài chuỗi tối thiểu, regex pattern, mô tả tài liệu OpenAPI).',
      },
      {
        symbol: '.model_validate(dict) & .model_validate_json(json_str)',
        description: 'Kiểm tra và biến `dict` hoặc chuỗi JSON thô thành đối tượng Pydantic (nhanh hơn gọi `json.loads` rồi mới validate!).',
      },
      {
        symbol: '.model_dump() & .model_dump_json()',
        description: 'Xuất đối tượng Pydantic ngược ra `dict` hoặc chuỗi JSON.',
      },
      {
        symbol: '@field_validator / @model_validator',
        description: 'Viết hàm kiểm tra quy tắc nghiệp vụ tùy chỉnh (ví dụ: kiểm tra `end_date > start_date`).',
      },
      {
        symbol: 'BaseSettings (từ pydantic_settings)',
        description: 'Tự động đọc biến môi trường từ hệ thống hoặc file `.env` và kiểm tra kiểu ngay lúc ứng dụng khởi động.',
      },
    ],
    usageCode: `from pydantic import BaseModel, EmailStr, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# 1. Định nghĩa Schema kiểm tra dữ liệu đầu vào (Giống Zod trong TypeScript)
class CreateOrderRequest(BaseModel):
    customer_name: str = Field(min_length=2, max_length=80)
    amount_vnd: int = Field(gt=0, description="Số tiền phải lớn hơn 0")
    coupon_code: str | None = None

    @field_validator("coupon_code")
    @classmethod
    def normalize_coupon(cls, v: str | None) -> str | None:
        return v.strip().upper() if v else None

# Kiểm tra dữ liệu từ JSON (tự động ép kiểu "150000" -> int 150000 hoặc ném ValidationError!)
order = CreateOrderRequest.model_validate_json(
    '{"customer_name": "Minh", "amount_vnd": 150000, "coupon_code": " sale20 "}'
)
print(order.coupon_code)        # "SALE20"
print(order.model_dump())       # {'customer_name': 'Minh', 'amount_vnd': 150000, 'coupon_code': 'SALE20'}

# 2. Quản lý file cấu hình .env chuẩn Production với BaseSettings
class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "sqlite:///./local.db"
    redis_port: int = 6379
    debug: bool = False`,
    tipsAndTricks: [
      'Trong Pydantic v2, nhớ dùng các phương thức mới **`.model_validate()`** và **`.model_dump()`** thay cho `.parse_obj()` và `.dict()` của bản v1 cũ (đã deprecated).',
      'Khi parse chuỗi JSON từ mạng hoặc Redis, hãy gọi thẳng `MyModel.model_validate_json(raw_bytes)` vì Rust sẽ parse JSON và validate trong 1 bước duy nhất, nhanh gấp 3–5 lần `json.loads()`!',
      'Dùng `pydantic-settings` để nếu thiếu biến môi trường bắt buộc (như `DATABASE_URL` hay `SECRET_KEY`), ứng dụng sẽ báo lỗi rõ ràng ngay lúc vừa bật lên thay vì chạy nửa chừng mới crash.',
    ],
    alternatives: [
      {
        name: 'msgspec (uv add msgspec)',
        whenToChoose:
          'Khi cần hiệu năng giải mã JSON/MsgPack cực hạn với bộ nhớ tối thiểu.',
      },
      {
        name: 'marshmallow / attrs',
        whenToChoose:
          'Thư viện serialize thế hệ cũ thường gặp trong các dự án Flask lâu năm.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'zod + dotenv / @t3-oss/env-nextjs',
      explanation:
        '`Pydantic` trong Python tương đương hoàn hảo với `Zod` trong TypeScript (nhưng viết bằng cú pháp `class` và Type Hints tự nhiên của Python), còn `pydantic-settings` tương đương `dotenv` + `zod` kiểm tra `process.env`.',
    },
  },
  {
    id: 'lib-3rd-fastapi',
    name: 'fastapi & uvicorn',
    title: 'FastAPI & Uvicorn — Xây dựng REST API Bất đồng bộ Hiệu năng Cao & Tự sinh Swagger Docs',
    kind: 'third-party',
    domain: 'http-web-api',
    domainLabel: 'Gọi HTTP & Xây dựng Web API',
    installCmd: {
      uv: 'uv add fastapi "uvicorn[standard]"',
      pip: 'pip install fastapi "uvicorn[standard]"',
      poetry: 'poetry add fastapi "uvicorn[standard]"',
    },
    whatItIs:
      'Web Framework hiện đại số 1 của Python để xây dựng RESTful API và Microservices. Kết hợp sức mạnh của `Starlette` (ASGI async core) và `Pydantic` (kiểm tra kiểu dữ liệu).',
    problemSolved:
      'Chỉ cần viết hàm Python có khai báo Type Hints, FastAPI tự động: (1) Kiểm tra dữ liệu đầu vào (Path, Query, JSON Body), (2) Chuyển đổi dữ liệu đầu ra sang JSON, (3) Xử lý bất đồng bộ `async/await` tốc độ cao, và (4) Tự động sinh trang tài liệu tương tác Swagger UI tại `/docs`!',
    keyApis: [
      {
        symbol: 'app = FastAPI() & APIRouter(prefix="/v1")',
        description: 'Khởi tạo ứng dụng chính và tách các nhóm route ra nhiều file module gọn gàng.',
      },
      {
        symbol: '@app.get(...) / @app.post(..., response_model=..., status_code=201)',
        description: 'Định nghĩa endpoint HTTP, tự động lọc và kiểm tra dữ liệu trả về theo `response_model`.',
      },
      {
        symbol: 'Depends(get_db / get_current_user)',
        description: 'Hệ thống Dependency Injection cực kỳ linh hoạt để tiêm Database Session, kiểm tra JWT Auth hoặc phân quyền.',
      },
      {
        symbol: 'HTTPException(status_code=404, detail="...")',
        description: 'Trả về phản hồi lỗi HTTP chuẩn JSON ngay lập tức từ bất kỳ tầng nào.',
      },
    ],
    usageCode: `from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel

app = FastAPI(title="Payment API", version="1.0.0")

class PaymentIn(BaseModel):
    order_id: str
    amount: int

# Dependency Injection: Kiểm tra API Key trong Header hoặc mở DB Session
async def verify_token() -> str:
    return "merchant_verified_01"

@app.post("/payments", status_code=status.HTTP_201_CREATED)
async def create_payment(
    payload: PaymentIn,
    merchant_id: str = Depends(verify_token),
) -> dict:
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Số tiền không hợp lệ")
    return {"status": "success", "merchant": merchant_id, "order_id": payload.order_id}

# Chạy server trên Terminal:
# $ uv run uvicorn main:app --reload --port 8000
# Mở trình duyệt vào: http://localhost:8000/docs để test API trực tiếp!`,
    tipsAndTricks: [
      'Quy tắc sống còn về `async def` vs `def` trong FastAPI: Nếu bên trong route bạn gọi thư viện **bất đồng bộ** (`await httpx`, `await AsyncSession`), hãy khai báo `async def`. Nhưng nếu bên trong bạn gọi thư viện **đồng bộ chặn luồng** (`requests.get`, `time.sleep`, `psycopg2` đồng bộ), hãy khai báo **`def` thường** (không có `async`) để FastAPI tự đẩy vào ThreadPool mà không làm đơ toàn bộ Event Loop!',
      'Tận dụng `lifespan` context manager trên `FastAPI(lifespan=...)` để khởi tạo Connection Pool lúc bật server và đóng sạch lúc tắt server.',
    ],
    alternatives: [
      {
        name: 'Django + Django REST Framework / Django Ninja (uv add django)',
        whenToChoose:
          'Khi bạn muốn một hệ thống "Nguyên khối đủ mọi thứ" (Monolith Batteries-included) có sẵn trang Admin quản trị dữ liệu, Auth, ORM và hệ thống Migration tích hợp sẵn.',
      },
      {
        name: 'Litestar / Flask',
        whenToChoose:
          '`Litestar` là đối thủ async hiện đại của FastAPI tích hợp sẵn DI/DTO mạnh mẽ; còn `Flask` phù hợp cho ứng dụng web đồng bộ siêu nhỏ gọn.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'Fastify / NestJS / Hono / Express + Swagger',
      explanation:
        '`FastAPI` kết hợp sự gọn nhẹ, tốc độ cao của `Fastify`/`Hono` với hệ thống Dependency Injection và OpenAPI Swagger tự động của `NestJS`.',
    },
  },
  {
    id: 'lib-3rd-sqlalchemy-alembic',
    name: 'sqlalchemy & alembic',
    title: 'SQLAlchemy 2.0 & Alembic — ORM Chuẩn Công nghiệp, Truy vấn An toàn Kiểu & Quản lý DB Migration',
    kind: 'third-party',
    domain: 'db-orm-cache',
    domainLabel: 'Database ORM, Queue & Bất đồng bộ',
    installCmd: {
      uv: 'uv add "sqlalchemy>=2.0" alembic asyncpg',
      pip: 'pip install "sqlalchemy>=2.0" alembic asyncpg',
      poetry: 'poetry add "sqlalchemy>=2.0" alembic asyncpg',
    },
    whatItIs:
      'Bộ đôi thống trị mảng cơ sở dữ liệu SQL (PostgreSQL, MySQL, SQLite) trong Python: `SQLAlchemy 2.0` là ORM & SQL Toolkit hỗ trợ cả Sync và Async với cú pháp Type-safe hiện đại (`Mapped[...]`), còn `Alembic` quản lý lịch sử thay đổi bảng (Database Migrations).',
    problemSolved:
      'Giúp ánh xạ bảng SQL thành class Python, chống hoàn toàn lỗi SQL Injection, quản lý Transaction theo mô hình Unit of Work, và tự động sinh file migration (`alembic revision --autogenerate`) mỗi khi bạn thêm/sửa cột trên model.',
    keyApis: [
      {
        symbol: 'DeclarativeBase, Mapped[int], mapped_column(...)',
        description: 'Cú pháp khai báo bảng mới của SQLAlchemy 2.0 hoàn toàn tương thích với trình kiểm tra kiểu tĩnh.',
      },
      {
        symbol: 'select(User).where(User.email == ...)',
        description: 'Cú pháp truy vấn chuẩn SQLAlchemy 2.0 (thay thế hoàn toàn kiểu `session.query(User)` của bản 1.x cũ!).',
      },
      {
        symbol: 'AsyncSession & async_sessionmaker',
        description: 'Thực thi truy vấn cơ sở dữ liệu bất đồng bộ không chặn Event Loop.',
      },
      {
        symbol: 'selectinload() / joinedload()',
        description: 'Nạp trước dữ liệu quan hệ (`1-N`, `N-N`) để tránh lỗi kinh điển **N+1 Queries**.',
      },
    ],
    usageCode: `from sqlalchemy import String, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

# 1. Định nghĩa bảng theo chuẩn SQLAlchemy 2.0 mới nhất (Mapped & mapped_column)
class Base(DeclarativeBase):
    pass

class UserAccount(Base):
    __tablename__ = "user_accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(default=True)

# 2. Truy vấn bằng hàm select() chuẩn 2.0
def find_active_user(session: Session, email: str) -> UserAccount | None:
    stmt = select(UserAccount).where(
        UserAccount.email == email,
        UserAccount.is_active.is_(True),
    )
    return session.scalars(stmt).first()`,
    tipsAndTricks: [
      'Luôn viết code theo chuẩn **SQLAlchemy 2.0** (`Mapped[...]`, `mapped_column()`, `select()`, `session.scalars()`). Không copy các đoạn hướng dẫn cũ trên mạng dùng `Column()` và `session.query()` của bản 1.4 trở về trước.',
      'Khi dùng với `AsyncSession`, luôn cấu hình `expire_on_commit=False` trên `async_sessionmaker` và dùng `selectinload()` khi cần truy cập bảng quan hệ để không gặp lỗi `MissingGreenlet`!',
      'Với Alembic: Chạy `uv run alembic revision --autogenerate -m "add users table"` để tự sinh file migration và `uv run alembic upgrade head` để áp dụng lên DB.',
    ],
    alternatives: [
      {
        name: 'SQLModel (uv add sqlmodel — Cùng tác giả với FastAPI)',
        whenToChoose:
          'Gộp chung `SQLAlchemy` và `Pydantic` vào 1 class duy nhất (1 class vừa là bảng DB vừa là schema API). Rất gọn cho dự án vừa và nhỏ.',
      },
      {
        name: 'Psycopg 3 / asyncpg thuần (uv add "psycopg[binary]" / asyncpg)',
        whenToChoose:
          'Khi bạn muốn viết câu lệnh SQL thuần tối ưu hiệu năng cao mà không dùng tầng ORM.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'Prisma / Drizzle ORM / TypeORM / Knex',
      explanation:
        '`SQLAlchemy 2.0` mạnh mẽ và linh hoạt tương đương `Drizzle ORM` + `TypeORM` kết hợp, còn `Alembic` tương đương `prisma migrate` / `drizzle-kit`.',
    },
  },
  {
    id: 'lib-3rd-polars-pandas',
    name: 'polars & pandas',
    title: 'Polars & Pandas — Phân tích Dữ liệu Bảng (DataFrame), Xử lý CSV / Excel / Parquet Tốc độ Cao',
    kind: 'third-party',
    domain: 'data-ai',
    domainLabel: 'Xử lý Dữ liệu Lớn, Scraping & AI',
    installCmd: {
      uv: 'uv add polars pandas openpyxl',
      pip: 'pip install polars pandas openpyxl',
      poetry: 'poetry add polars pandas openpyxl',
    },
    whatItIs:
      'Hai thư viện xử lý dữ liệu dạng bảng (DataFrame) hàng đầu: `Pandas` là thư viện lâu đời phổ biến nhất trong Data Science, còn `Polars` là thư viện thế hệ mới viết bằng **Rust** chạy đa nhân CPU và hỗ trợ Lazy Evaluation nhanh gấp 5–30 lần Pandas!',
    problemSolved:
      'Giúp đọc/ghi, lọc, gom nhóm (`group_by`), kết nối (`join`), tổng hợp thống kê trên hàng triệu dòng dữ liệu từ CSV, Excel, Parquet hoặc SQL chỉ trong vài dòng biểu thức mà không cần viết vòng lặp `for` chậm chạp.',
    keyApis: [
      {
        symbol: 'pl.read_csv() / pl.scan_csv() (LazyFrame)',
        description: '`scan_csv` đọc lười và tự động tối ưu hóa truy vấn (chỉ đọc đúng các cột và dòng thỏa điều kiện từ ổ cứng!).',
      },
      {
        symbol: 'df.filter(...) / df.select(...) / df.with_columns(...)',
        description: 'Lọc dòng, chọn cột và tính toán tạo cột mới theo biểu thức song song (`pl.col("price") * pl.col("qty")`).',
      },
      {
        symbol: 'df.group_by("category").agg(...)',
        description: 'Gom nhóm và tính tổng, trung bình, min/max trên nhiều cột cùng lúc.',
      },
    ],
    usageCode: `import polars as pl

# Tạo bảng dữ liệu DataFrame và xử lý chuỗi truy vấn biểu thức siêu tốc với Polars
df = pl.DataFrame({
    "dept": ["Tech", "Sales", "Tech", "Sales", "Tech"],
    "employee": ["An", "Bình", "Chi", "Dũng", "Em"],
    "revenue": [120_000, 95_000, 180_000, 110_000, 150_000],
})

summary = (
    df.filter(pl.col("revenue") >= 100_000)
    .with_columns(
        (pl.col("revenue") * 0.1).alias("bonus")
    )
    .group_by("dept")
    .agg(
        pl.len().alias("headcount"),
        pl.col("revenue").sum().alias("total_revenue"),
        pl.col("bonus").mean().alias("avg_bonus"),
    )
    .sort("total_revenue", descending=True)
)
print(summary)`,
    tipsAndTricks: [
      'Quy tắc số 1 khi dùng Pandas/Polars: **Tuyệt đối không dùng vòng lặp `for` duyệt từng dòng (`iterrows`)**! Hãy luôn dùng biểu thức Vector hóa trên cột (`pl.col("a") + pl.col("b")`) để tận dụng SIMD và đa luồng C/Rust.',
      'Khi lưu trữ dữ liệu lớn, hãy lưu định dạng **`.parquet`** (`df.write_parquet("data.parquet")`) thay vì `.csv` — file Parquet nhẹ hơn 5 lần, giữ nguyên kiểu dữ liệu cột và đọc nhanh gấp 20 lần CSV!',
    ],
    alternatives: [
      {
        name: 'DuckDB (uv add duckdb)',
        whenToChoose:
          'Khi bạn muốn viết câu lệnh SQL phân tích trực tiếp trên file CSV / Parquet / JSON hàng chục GB ngay trên máy cá nhân với tốc độ đáng kinh ngạc.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'Arquero / Danfo.js (Nhưng hệ sinh thái Data của Python mạnh hơn vượt trội)',
      explanation:
        'Đây chính là lý do lớn nhất khiến các kỹ sư Backend JS/TS học thêm Python: xử lý Data/Analytics bằng `Polars`, `Pandas`, `DuckDB` nhanh và giàu công cụ hơn bất kỳ ngôn ngữ nào khác.',
    },
  },
  {
    id: 'lib-3rd-pytest',
    name: 'pytest, pytest-asyncio & coverage',
    title: 'Pytest — Khung Kiểm thử Tự động (Unit & Integration Testing), Fixtures & Parametrize',
    kind: 'third-party',
    domain: 'cli-log-test',
    domainLabel: 'CLI, Logging, Retry & Kiểm thử',
    installCmd: {
      uv: 'uv add --dev pytest pytest-asyncio pytest-cov',
      pip: 'pip install pytest pytest-asyncio pytest-cov',
      poetry: 'poetry add --group dev pytest pytest-asyncio pytest-cov',
    },
    whatItIs:
      'Framework kiểm thử tiêu chuẩn thực tế của toàn bộ thế giới Python. Cho phép viết test chỉ bằng từ khóa `assert` tự nhiên thay vì phải kế thừa class phức tạp như `unittest` chuẩn.',
    problemSolved:
      'Giúp kiểm tra hàm bằng lệnh `assert a == b` cực gọn (khi sai, Pytest tự động phân tích và in rõ giá trị hai vế), tái sử dụng dữ liệu mẫu qua `@pytest.fixture` và chạy 1 hàm test với 10 bộ dữ liệu đầu vào qua `@pytest.mark.parametrize`.',
    keyApis: [
      {
        symbol: 'assert actual == expected',
        description: 'Kiểm tra kết quả trực tiếp bằng từ khóa `assert` của Python.',
      },
      {
        symbol: 'with pytest.raises(ValueError, match="..."):',
        description: 'Kiểm tra xem hàm có ném ra đúng ngoại lệ mong muốn khi truyền dữ liệu sai hay không.',
      },
      {
        symbol: '@pytest.mark.parametrize("input,expected", [...])',
        description: 'Chạy tự động cùng 1 hàm kiểm thử qua nhiều kịch bản dữ liệu biên (Data-driven testing).',
      },
      {
        symbol: '@pytest.fixture (và file conftest.py)',
        description: 'Khởi tạo dữ liệu mẫu, DB tạm hoặc HTTP TestClient và tự động tiêm vào hàm test theo tên tham số!',
      },
    ],
    usageCode: `import pytest

def calculate_discount(amount: int, vip: bool = False) -> int:
    if amount < 0:
        raise ValueError("Số tiền không được âm")
    rate = 0.20 if vip else 0.05
    return int(amount * (1 - rate))

# 1. Chạy 1 hàm test với 3 kịch bản dữ liệu khác nhau nhờ @pytest.mark.parametrize
@pytest.mark.parametrize(
    ("amount", "vip", "expected"),
    [
        (100_000, False, 95_000),
        (100_000, True, 80_000),
        (0, True, 0),
    ],
)
def test_calculate_discount_cases(amount: int, vip: bool, expected: int) -> None:
    assert calculate_discount(amount, vip=vip) == expected

# 2. Kiểm tra trường hợp hàm phải ném ra lỗi ValueError
def test_negative_amount_raises() -> None:
    with pytest.raises(ValueError, match="không được âm"):
        calculate_discount(-500)`,
    tipsAndTricks: [
      'Đặt các `@pytest.fixture` dùng chung trong file `tests/conftest.py` — Pytest sẽ tự động nạp file này và cung cấp fixture cho mọi file `test_*.py` mà không cần `import`!',
      'Dùng cờ `uv run pytest -x -vv` để dừng ngay ở bài test lỗi đầu tiên (`-x`) và hiển thị chi tiết sự khác biệt (`-vv`).',
      'Dùng fixture có sẵn `tmp_path` (kiểu `pathlib.Path`) của Pytest khi cần tạo file tạm lúc chạy test — Pytest sẽ tự dọn sạch sau khi test xong.',
    ],
    alternatives: [
      {
        name: 'unittest (Có sẵn trong Standard Library)',
        whenToChoose:
          'Chỉ dùng trong môi trường không được cài gói ngoài, hoặc dùng module `unittest.mock` (`patch`, `MagicMock`, `AsyncMock`) kết hợp bên trong `pytest`!',
      },
      {
        name: 'hypothesis (uv add --dev hypothesis)',
        whenToChoose:
          'Property-based testing: tự động sinh hàng trăm trường hợp dữ liệu ngẫu nhiên hóc búa (số âm, chuỗi rỗng, Unicode lạ) để tìm bug ẩn.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'Vitest / Jest',
      explanation:
        '`pytest` tương đương `Vitest` / `Jest`, nhưng không cần bọc trong `describe()` / `expect(a).toBe(b)` mà chỉ cần viết hàm `def test_...(): assert a == b`.',
    },
  },
  {
    id: 'lib-3rd-rich-typer-loguru',
    name: 'rich, typer & loguru / structlog',
    title: 'Rich, Typer & Loguru — Xây dựng CLI Chuyên nghiệp, Hiển thị Terminal Đẹp & Logging Hiện đại',
    kind: 'third-party',
    domain: 'cli-log-test',
    domainLabel: 'CLI, Logging, Retry & Kiểm thử',
    installCmd: {
      uv: 'uv add rich typer loguru',
      pip: 'pip install rich typer loguru',
      poetry: 'poetry add rich typer loguru',
    },
    whatItIs:
      'Bộ 3 thư viện nâng tầm trải nghiệm dòng lệnh và quan sát hệ thống: `Rich` in bảng, thanh tiến trình (progress bar) và tô màu đối tượng trên Terminal; `Typer` biến hàm có Type Hints thành ứng dụng CLI hoàn chỉnh; `Loguru` (hoặc `structlog`) giúp ghi log có màu sắc, tự xoay vòng file (rotation) và xuất JSON log chỉ với 1 dòng lệnh.',
    problemSolved:
      'Thay thế việc phải cấu hình `argparse` và `logging` chuẩn khá dài dòng của Python bằng cú pháp ngắn gọn, đẹp mắt và sẵn sàng cho Production.',
    keyApis: [
      {
        symbol: 'from rich import print / rich.table.Table / rich.progress.track',
        description: 'In mọi cấu trúc `dict`/`list` có màu sắc thụt lề đẹp mắt và tạo thanh loading chỉ bằng `for x in track(items):`.',
      },
      {
        symbol: 'app = typer.Typer() & @app.command()',
        description: 'Tự động tạo CLI có `--help`, kiểm tra kiểu tham số dòng lệnh dựa trên Type Hints (tương tự FastAPI nhưng cho CLI!).',
      },
      {
        symbol: 'from loguru import logger; logger.add("app.log", rotation="10 MB")',
        description: 'Ghi log có sẵn timestamp, tên file, dòng code, màu sắc và tự động cắt file khi đạt 10MB.',
      },
    ],
    usageCode: `from loguru import logger
from rich.console import Console
from rich.table import Table

console = Console()

# 1. Rich Table: Vẽ bảng báo cáo chuyên nghiệp ngay trên Terminal
table = Table(title="Trạng thái Dịch vụ Hệ thống")
table.add_column("Service", style="cyan", no_wrap=True)
table.add_column("Latency", justify="right", style="emerald")
table.add_row("Auth API", "12 ms")
table.add_row("Payment Worker", "28 ms")
console.print(table)

# 2. Loguru: Ghi log kèm ngữ cảnh (structured context) không cần cấu hình phức tạp
logger.bind(order_id="ORD-99", user_id=42).info("Đã xử lý thanh toán thành công")`,
    tipsAndTricks: [
      'Mẹo debug cực đỉnh với `rich`: Gọi `from rich import inspect; inspect(my_obj, methods=True)` để xem toàn bộ thuộc tính và phương thức của bất kỳ đối tượng nào ngay trên Terminal!',
      'Gọi `from rich.traceback import install; install(show_locals=True)` ở đầu chương trình để khi có lỗi Exception, Terminal hiển thị khung báo lỗi cực đẹp kèm giá trị của từng biến cục bộ tại thời điểm lỗi.',
    ],
    alternatives: [
      {
        name: 'argparse & logging (Có sẵn trong Standard Library)',
        whenToChoose:
          'Dùng khi viết thư viện/công cụ không muốn phụ thuộc vào bất kỳ gói thứ 3 nào.',
      },
      {
        name: 'structlog (uv add structlog) & click (uv add click)',
        whenToChoose:
          '`structlog` là tiêu chuẩn vàng cho hệ thống Microservices lớn cần xuất log định dạng JSON thuần cho Datadog / ELK / Grafana Loki.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'chalk + ora + cli-table3 + commander/cac + pino/winston',
      explanation:
        '`Rich` = `chalk` + `ora` + `cli-table3` gộp lại; `Typer` = `commander`/`yargs`; `Loguru`/`structlog` = `pino`/`winston`.',
    },
  },
  {
    id: 'lib-3rd-tenacity-playwright-celery',
    name: 'tenacity, playwright & arq / celery',
    title: 'Tenacity (Retry), Playwright / Selectolax (Scraping) & Celery / Arq (Background Jobs)',
    kind: 'third-party',
    domain: 'db-orm-cache',
    domainLabel: 'Database ORM, Queue & Bất đồng bộ',
    installCmd: {
      uv: 'uv add tenacity selectolax arq',
      pip: 'pip install tenacity selectolax arq',
      poetry: 'poetry add tenacity selectolax arq',
    },
    whatItIs:
      'Các thư viện vũ khí bí mật của kỹ sư Senior Python: **`tenacity`** tự động thử lại (Retry với Exponential Backoff + Jitter) khi gọi API/DB chập chờn; **`playwright` & `selectolax`** tự động hóa trình duyệt và bóc tách HTML siêu tốc; **`arq` / `celery`** đẩy các tác vụ nặng (gửi email, xuất báo cáo, gọi AI) xuống chạy ngầm qua Redis.',
    problemSolved:
      'Giúp hệ thống tự phục hồi khi mạng lỗi tạm thời mà không cần viết vòng lặp `try...except...time.sleep` thủ công, và tách các tác vụ tốn thời gian ra khỏi luồng phản hồi API chính.',
    keyApis: [
      {
        symbol: '@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, max=10))',
        description: 'Decorator của `tenacity` tự động thử lại tối đa 3 lần với thời gian chờ tăng dần (1s -> 2s -> 4s) khi hàm gặp lỗi.',
      },
      {
        symbol: 'selectolax.parser.HTMLParser (hoặc BeautifulSoup)',
        description: 'Phân tích cây DOM HTML và truy vấn bằng CSS Selector (`tree.css_first("h1.title").text()`), nhanh gấp 10–30 lần BeautifulSoup.',
      },
      {
        symbol: 'arq / celery (@app.task)',
        description: 'Đẩy công việc vào hàng đợi Redis để các tiến trình Worker xử lý ngầm hoặc chạy định kỳ (Cron job).',
      },
    ],
    usageCode: `import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

# Tenacity: Tự động thử lại tối đa 3 lần (chờ 1s, 2s, 4s) nếu gặp lỗi mạng tạm thời!
@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
)
async def call_partner_webhook(url: str, payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()`,
    tipsAndTricks: [
      'Khi dùng `@retry` của `tenacity`, luôn chỉ định rõ `retry=retry_if_exception_type(...)` để chỉ thử lại khi gặp lỗi mạng/timeout hoặc HTTP 502/503/429, KHÔNG thử lại khi gặp lỗi dữ liệu sai 400 Bad Request hay 401 Unauthorized!',
      'Luôn bật `reraise=True` trong `@retry` để sau khi thử hết 3 lần vẫn lỗi thì ném ra đúng ngoại lệ gốc thay vì `RetryError` chung chung.',
    ],
    alternatives: [
      {
        name: 'stamina (uv add stamina)',
        whenToChoose:
          'Lớp bọc cấu hình sẵn các thông số chuẩn Production (Exponential backoff + Jitter + Prometheus metrics) bên trên `tenacity`.',
      },
      {
        name: 'BeautifulSoup4 (uv add beautifulsoup4 lxml)',
        whenToChoose:
          'Thư viện bóc tách HTML/XML kinh điển dễ dùng nhất khi tốc độ không phải yếu tố sống còn.',
      },
    ],
    nodeJsEquivalent: {
      packages: 'p-retry + cheerio / playwright + bullmq',
      explanation:
        '`tenacity` = `p-retry`; `selectolax`/`BeautifulSoup` = `cheerio`; `arq`/`Celery` = `BullMQ`.',
    },
  },
];

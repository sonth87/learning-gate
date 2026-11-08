import { GlossaryTerm } from '@/types/glossary.types';

export const STDLIB_GLOSSARY: GlossaryTerm[] = [
  {
    id: 'mod-sys',
    term: 'sys',
    aliases: ['import sys', 'sys module'],
    category: 'stdlib',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Module hệ thống cung cấp quyền truy cập vào các biến và hàm tương tác chặt chẽ với Python runtime và trình thông dịch CPython.',
    detailedExplanation:
      '`sys` (System-specific parameters and functions) chứa các thành phần cốt lõi của tiến trình đang chạy: `sys.argv` (danh sách tham số dòng lệnh), `sys.path` (danh sách đường dẫn tìm kiếm module), `sys.exit()` (thoát chương trình với mã lỗi), `sys.version` (phiên bản Python hiện tại), `sys.platform` (hệ điều hành thực thi: darwin/linux/win32) và `sys.getsizeof()` (kích thước byte của đối tượng trên RAM).',
    analogy:
      'Bảng đồng hồ và hộp cầu chì trong buồng lái xe: theo dõi trực tiếp trạng thái động cơ (Python runtime), nhiên liệu và điều khiển ngắt điện khẩn cấp.',
    syntaxExample: `import sys\n\n# 1. Nhận tham số dòng lệnh (vd: python main.py --env prod)\nprint("Tên file chạy:", sys.argv[0])\nprint("Tham số truyền vào:", sys.argv[1:])\n\n# 2. Xem đường dẫn tìm module\nprint("Thư mục Python tìm nạp:", sys.path[0])\n\n# 3. Thoát chương trình với mã thành công hoặc lỗi\nif len(sys.argv) < 2:\n    print("Lỗi: Thiếu tham số bắt buộc!", file=sys.stderr)\n    sys.exit(1)  # Mã 1 báo hiệu lỗi cho Shell/Bash`,
    commonGotcha:
      'Tránh lạm dụng `sys.exit()` bên trong các hàm thư viện tái sử dụng; chỉ nên dùng `sys.exit()` ở entry-point chính (file `__main__` hoặc script CLI), còn trong hàm con nên `raise Exception`.',
    jsEquivalent: 'Node.js process (process.argv, process.exit, process.platform)',
    relatedTerms: ['mod-os', 'mod-subprocess', 'fn-print'],
  },
  {
    id: 'mod-os',
    term: 'os',
    aliases: ['import os', 'os module'],
    category: 'stdlib',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Module giao tiếp với hệ điều hành: quản lý biến môi trường, đường dẫn tệp tin, quyền truy cập và tiến trình hệ thống.',
    detailedExplanation:
      '`os` (Operating System interface) cung cấp các hàm độc lập nền tảng để thao tác với tệp và hệ thống: `os.environ` (đọc/ghi biến môi trường .env), `os.listdir()` (liệt kê tệp trong thư mục), `os.mkdir()` / `os.makedirs()` (tạo thư mục), `os.remove()` (xóa file), `os.path.join()` (nối đường dẫn tương thích cả Windows `\\` lẫn Linux/macOS `/`).',
    analogy:
      'Nhân viên lễ tân điều phối tòa nhà: giúp bạn gửi thư đến các phòng ban, xin cấp phòng mới hoặc hỏi xem tòa nhà có bao nhiêu phòng.',
    syntaxExample: `import os\n\n# 1. Đọc biến môi trường an toàn với giá trị mặc định\ndatabase_url = os.environ.get("DATABASE_URL", "sqlite:///local.db")\n\n# 2. Kiểm tra và tạo thư mục nếu chưa tồn tại\nupload_dir = "uploads/avatars"\nif not os.path.exists(upload_dir):\n    os.makedirs(upload_dir, exist_ok=True)\n\n# 3. Nối đường dẫn chuẩn trên mọi hệ điều hành\nfile_path = os.path.join(upload_dir, "user_1.png")\nprint("Đường dẫn chuẩn:", file_path)`,
    commonGotcha:
      'Dùng dấu gạch chéo thô `path = "folder/" + file` sẽ gây lỗi khi chạy trên Windows. Hãy luôn dùng `os.path.join` hoặc thư viện hướng đối tượng `pathlib.Path`.',
    jsEquivalent: 'Node.js fs + path + process.env',
    relatedTerms: ['mod-sys', 'mod-pathlib', 'mod-shutil'],
  },
  {
    id: 'mod-dis',
    term: 'dis',
    aliases: ['import dis', 'dis.dis', 'bytecode disassembler'],
    category: 'stdlib',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary:
      'Bộ dịch ngược Bytecode (Python Bytecode Disassembler) giúp "soi nắp máy" xem CPython thực sự thực thi các chỉ thị máy ảo PVM như thế nào.',
    detailedExplanation:
      'Module `dis` phân tích mã nguồn Python hoặc một hàm thành chuỗi các lệnh bytecode CPython (như `LOAD_CONST`, `STORE_NAME`, `BINARY_OP`, `COMPARE_OP`, `RETURN_VALUE`). Đây là công cụ số 1 để hiểu sâu về tối ưu hiệu năng, cơ chế gán biến, cách Comprehension hoạt động nhanh hơn vòng lặp for thông thường, và vì sao các biến bất biến (immutable) lại an toàn.',
    analogy:
      'Bản chụp X-quang hoặc kính hiển vi phòng thí nghiệm: nhìn xuyên qua lớp da code Python thanh lịch để thấy khung xương chỉ thị máy ảo bên trong.',
    syntaxExample: `import dis\n\ndef add(a, b):\n    return a + b\n\n# Dịch ngược hàm add xem các chỉ thị bytecode của CPython PVM:\ndis.dis(add)\n# Output mẫu:\n# 0 LOAD_FAST    0 (a)      # Nạp tham số a lên stack\n# 2 LOAD_FAST    1 (b)      # Nạp tham số b lên stack\n# 4 BINARY_OP    0 (+)      # Thực hiện phép cộng\n# 8 RETURN_VALUE            # Trả kết quả từ đỉnh stack`,
    commonGotcha:
      'Bytecode là chi tiết hiện thực nội bộ của CPython và có thể thay đổi giữa các phiên bản Python (ví dụ Python 3.11+ tối ưu hóa chuyên biệt với Specializing Adaptive Interpreter). Không dùng `dis` cho logic nghiệp vụ sản xuất.',
    jsEquivalent: 'V8 engine flag: node --print-bytecode',
    relatedTerms: ['concept-cpython', 'concept-bytecode', 'concept-pvm'],
  },
  {
    id: 'mod-math',
    term: 'math',
    aliases: ['import math', 'math module'],
    category: 'stdlib',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Thư viện cung cấp các hằng số và hàm toán học nâng cao chính xác cao theo chuẩn C (C99 standard).',
    detailedExplanation:
      '`math` chứa các hàm giải tích, lượng giác, lũy thừa, logarit và làm tròn chuyên biệt: `math.sqrt()` (căn bậc 2), `math.floor()` / `math.ceil()` (làm tròn sàn/trần), `math.pi`, `math.e`, `math.pow()`, `math.gcd()` (ước chung lớn nhất), và đặc biệt `math.isclose()` để so sánh an toàn 2 số thực dấu phẩy động (float) tránh sai số epsilon.',
    analogy:
      'Máy tính bỏ túi khoa học Casio Fx: tích hợp sẵn mọi công thức lượng giác, căn thức và số học phức tạp chỉ với một nút bấm.',
    syntaxExample: `import math\n\n# 1. Căn bậc hai và làm tròn\nprint("Căn bậc hai:", math.sqrt(64))  # 8.0\nprint("Trần của 4.2:", math.ceil(4.2)) # 5\n\n# 2. So sánh float an toàn tuyệt đối\na = 0.1 + 0.2\nb = 0.3\nprint(a == b)                 # False (do sai số float nhị phân!)\nprint(math.isclose(a, b))     # True (chuẩn xác)`,
    commonGotcha:
      'Hàm `math.sqrt(-1)` sẽ ném lỗi `ValueError: math domain error`. Nếu cần tính số phức (nghiệm ảo), bạn phải dùng module `cmath` (Complex Math).',
    jsEquivalent: 'JavaScript Math (Math.sqrt, Math.floor, Math.PI)',
    relatedTerms: ['type-float', 'type-int', 'fn-round'],
  },
  {
    id: 'mod-random',
    term: 'random',
    aliases: ['import random', 'random module'],
    category: 'stdlib',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Module sinh số ngẫu nhiên giả lập (PRNG dựa trên thuật toán Mersenne Twister), xáo trộn danh sách và bốc thăm phần tử.',
    detailedExplanation:
      '`random` cung cấp các hàm tiện ích sinh dữ liệu ngẫu nhiên phổ biến: `random.random()` (float trong [0.0, 1.0)), `random.randint(a, b)` (nguyên trong [a, b]), `random.choice(seq)` (chọn ngẫu nhiên 1 phần tử), `random.sample(seq, k)` (chọn k phần tử không trùng lặp), `random.shuffle(list)` (xáo trộn tại chỗ in-place).',
    analogy:
      'Chiếc nón kỳ diệu quay số may mắn hoặc người chia bài xáo tung bộ bài Tây.',
    syntaxExample: `import random\n\n# 1. Tung xúc xắc từ 1 đến 6\ndice = random.randint(1, 6)\n\n# 2. Bốc thăm trúng thưởng từ danh sách\nmembers = ["Nam", "Lan", "Hùng", "Mai", "Cường"]\nwinner = random.choice(members)\nprint("Người thắng cuộc:", winner)\n\n# 3. Xáo trộn danh sách bài kiểm tra\nquestions = [1, 2, 3, 4, 5]\nrandom.shuffle(questions)\nprint("Thứ tự câu hỏi mới:", questions)`,
    commonGotcha:
      '`random` là số giả ngẫu nhiên (Pseudo-Random), KHÔNG an toàn cho mật mã hoặc tạo token bảo mật (password, JWT token). Đối với bảo mật, bắt buộc dùng module `secrets`.',
    jsEquivalent: 'Math.random() (hoặc thư viện crypto/lodash shuffle)',
    relatedTerms: ['mod-hashlib', 'type-list'],
  },
  {
    id: 'mod-datetime',
    term: 'datetime',
    aliases: ['import datetime', 'from datetime import datetime', 'date'],
    category: 'stdlib',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Module chuyên dụng thao tác với ngày tháng, giờ phút, khoảng thời gian (timedelta) và múi giờ (timezone).',
    detailedExplanation:
      '`datetime` cung cấp các lớp đối tượng bất biến (immutable) biểu diễn thời gian: `datetime.date` (năm-tháng-ngày), `datetime.time` (giờ-phút-giây-microsecond), `datetime.datetime` (kết hợp cả hai), `datetime.timedelta` (khoảng cách giữa 2 mốc thời gian, dùng để cộng trừ ngày). Hỗ trợ định dạng chuỗi mạnh mẽ qua `strftime()` (object sang string) và `strptime()` (string sang object).',
    analogy:
      'Bộ lịch vạn niên kết hợp đồng hồ bấm giờ: không chỉ chỉ ngày giờ chuẩn xác mà còn tự động tính toán 45 ngày nữa là thứ mấy, tháng mấy.',
    syntaxExample: `from datetime import datetime, timedelta\n\n# 1. Lấy thời điểm hiện tại\nnow = datetime.now()\nprint("Hôm nay là:", now.strftime("%d/%m/%Y %H:%M:%S"))\n\n# 2. Tính toán ngày hết hạn (sau 30 ngày)\nexpiry_date = now + timedelta(days=30)\nprint("Ngày hết hạn:", expiry_date.strftime("%d/%m/%Y"))\n\n# 3. Chuyển chuỗi văn bản thành đối tượng datetime\nbirth_str = "15-08-1995"\nbirth_date = datetime.strptime(birth_str, "%d-%m-%Y")`,
    commonGotcha:
      'Mặc định `datetime.now()` tạo ra đối tượng naive datetime (không có thông tin timezone). Trong ứng dụng web/backend quốc tế, luôn ưu tiên dùng timezone UTC: `datetime.now(timezone.utc)`.',
    jsEquivalent: 'JavaScript Date object / date-fns / dayjs',
    relatedTerms: ['mod-time', 'type-str'],
  },
  {
    id: 'mod-json',
    term: 'json',
    aliases: ['import json', 'json module', 'json.loads', 'json.dumps'],
    category: 'stdlib',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Module chuẩn hóa dữ liệu định dạng JSON (JavaScript Object Notation), chuyển đổi mượt mà giữa Dictionary Python và chuỗi JSON.',
    detailedExplanation:
      '`json` cung cấp 4 hàm cốt lõi: `json.dumps(obj)` (chuyển Python dict/list thành chuỗi JSON string), `json.loads(str)` (phân tích cú pháp chuỗi JSON thành Python dict), `json.dump(obj, file)` (ghi trực tiếp ra tệp tin stream), và `json.load(file)` (đọc trực tiếp từ tệp tin). Tự động ánh xạ: `None` <-> `null`, `True/False` <-> `true/false`, `dict` <-> `object`, `list` <-> `array`.',
    analogy:
      'Thông dịch viên ngôn ngữ quốc tế: chuyển các cuốn sổ tay nội bộ Python thành định dạng bưu thiếp JSON phổ thông mà bất kỳ hệ thống nào (Web, Java, C#, Go) cũng đọc được.',
    syntaxExample: `import json\n\ndata = {\n    "name": "Alex",\n    "roles": ["admin", "developer"],\n    "is_active": True,\n    "profile": None\n}\n\n# Chuyển Python Dict thành chuỗi JSON đẹp mắt có thụt đầu dòng (indent)\njson_str = json.dumps(data, indent=2, ensure_ascii=False)\nprint(json_str)\n\n# Phân tích ngược lại từ chuỗi JSON về Python Dict\nparsed = json.loads(json_str)\nprint("Tên người dùng:", parsed["name"])`,
    commonGotcha:
      'JSON không hỗ trợ Tuple, Set hay datetime nguyên bản. Nếu bạn dump một Dict chứa `datetime` hoặc `set`, Python sẽ ném `TypeError: Object of type set is not JSON serializable`. Cần chuyển sang list hoặc dùng tham số `default=str`.',
    jsEquivalent: 'JSON.stringify() & JSON.parse()',
    relatedTerms: ['type-dict', 'type-list', 'fn-open'],
  },
  {
    id: 'mod-pathlib',
    term: 'pathlib',
    aliases: ['import pathlib', 'from pathlib import Path', 'Path'],
    category: 'stdlib',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary:
      'Thư viện đường dẫn tệp tin hướng đối tượng hiện đại chuẩn PEP 428, thay thế hoàn toàn các hàm xử lý chuỗi rườm rà của `os.path`.',
    detailedExplanation:
      '`pathlib.Path` biến đường dẫn file thành đối tượng thông minh có đầy đủ phương thức: kiểm tra tồn tại `p.exists()`, kiểm tra thư mục `p.is_dir()`, đọc trực tiếp `p.read_text(encoding="utf-8")`, ghi đè `p.write_text()`, tìm kiếm pattern `p.glob("*.py")`, lấy phần mở rộng `p.suffix`, lấy thư mục cha `p.parent`. Đặc biệt hỗ trợ toán tử chia `/` để nối đường dẫn cực kỳ trực quan.',
    analogy:
      'GPS chỉ đường thông minh: bạn chỉ cần bấm nút để kiểm tra xem địa điểm có tồn tại, đọc nội dung bên trong mà không cần lo đường là đường nhựa hay đường ray.',
    syntaxExample: `from pathlib import Path\n\n# 1. Tạo đường dẫn bằng toán tử /\ncurrent_file = Path(__file__).resolve()\nproject_root = current_file.parent.parent\nconfig_path = project_root / "config" / "settings.json"\n\n# 2. Đọc file trực tiếp chỉ trong 1 dòng không cần mở thủ công\nif config_path.exists():\n    content = config_path.read_text(encoding="utf-8")\n    print("Độ dài cấu hình:", len(content))\n\n# 3. Tìm tất cả file Python trong thư mục\nfor py_file in project_root.glob("**/*.py"):\n    print("File mã nguồn:", py_file.name)`,
    commonGotcha:
      'Nhiều thư viện cũ của bên thứ 3 vẫn yêu cầu đường dẫn dạng `str`. Bạn chỉ cần bọc `str(path_obj)` để tương thích ngược 100%.',
    jsEquivalent: 'Node.js path module + fs/promises',
    relatedTerms: ['mod-os', 'fn-open', 'mod-shutil'],
  },
  {
    id: 'mod-collections',
    term: 'collections',
    aliases: ['import collections', 'defaultdict', 'Counter', 'deque', 'namedtuple'],
    category: 'stdlib',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary:
      'Bộ sưu tập các cấu trúc dữ liệu container nâng cao hiệu năng cao: defaultdict, Counter, deque, namedtuple.',
    detailedExplanation:
      '`collections` giải quyết các bài toán dữ liệu thường gặp với hiệu năng tối ưu: `Counter` (tự động đếm tần suất xuất hiện các phần tử), `defaultdict` (tự khởi tạo giá trị mặc định khi truy cập key chưa tồn tại, loại bỏ lỗi KeyError), `deque` (hàng đợi 2 đầu cho phép thêm/xóa ở cả đầu và cuối trong O(1) thay vì O(n) của list thông thường), `namedtuple` (tuple có tên trường dễ đọc như struct).',
    analogy:
      'Hộp đồ nghề chuyên nghiệp của thợ cơ khí: bên cạnh cờ-lê mỏ-lết thông thường (list, dict), nó có máy siết ốc tự động và thước laser chuyên dụng.',
    syntaxExample: `from collections import Counter, defaultdict, deque\n\n# 1. Đếm tần suất từ cực nhanh\nwords = ["apple", "banana", "apple", "cherry", "banana", "apple"]\ncounts = Counter(words)\nprint(counts.most_common(1))  # [('apple', 3)]\n\n# 2. defaultdict gom nhóm không lo KeyError\ngroups = defaultdict(list)\ngroups["fruits"].append("cam")  # Tự khởi tạo list rỗng trước khi append\n\n# 3. deque cho hàng đợi O(1)\nq = deque([1, 2, 3])\nq.appendleft(0)  # Thêm vào đầu O(1)\nq.pop()          # Lấy từ cuối O(1)`,
    commonGotcha:
      'Dùng `list.pop(0)` trên một List lớn sẽ có độ phức tạp O(n) do phải dịch chuyển toàn bộ phần tử sang trái. Với hàng đợi FIFO lớn, bắt buộc phải dùng `collections.deque.popleft()` có tốc độ O(1).',
    jsEquivalent: 'Map, Set, hoặc thư viện immutable.js',
    relatedTerms: ['type-dict', 'type-list', 'type-tuple'],
  },
  {
    id: 'mod-itertools',
    term: 'itertools',
    aliases: ['import itertools', 'chain', 'cycle', 'combinations', 'permutations'],
    category: 'stdlib',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary:
      'Bộ công cụ tạo Iterator hiệu năng cao, tiết kiệm bộ nhớ RAM tuyệt đối thông qua cơ chế nạp lười (Lazy Evaluation).',
    detailedExplanation:
      '`itertools` cung cấp các hàm toán tử tổ hợp và chuỗi vô hạn được viết bằng ngôn ngữ C siêu tốc: `chain(*iterables)` (nối nhiều mảng liên tiếp không tốn bộ nhớ ghép mảng), `combinations(p, r)` (tổ hợp chập r), `permutations(p, r)` (chỉnh hợp chập r), `cycle(iterable)` (lặp vô tận vòng tròn), `count(start, step)` (bộ đếm tăng dần vô hạn), `groupby()` (gom nhóm dữ liệu đã sắp xếp).',
    analogy:
      'Băng chuyền nhà máy tự động: từng sản phẩm được chuyển tiếp liên tục đến khâu kế tiếp theo yêu cầu mà không cần kho chứa trung gian khổng lồ.',
    syntaxExample: `import itertools\n\n# 1. Nối 3 danh sách mà không tạo mảng mới trong RAM\nlist_a = [1, 2]\nlist_b = [3, 4]\nlist_c = [5, 6]\nfor num in itertools.chain(list_a, list_b, list_c):\n    print(num, end=" ")\nprint()\n\n# 2. Sinh tổ hợp 2 chữ cái từ 3 chữ\nchars = ["A", "B", "C"]\ncombos = list(itertools.combinations(chars, 2))\nprint("Tổ hợp đôi:", combos)  # [('A', 'B'), ('A', 'C'), ('B', 'C')]`,
    commonGotcha:
      'Các hàm `itertools` trả về iterator (chỉ duyệt được 1 lần). Sau khi duyệt xong, iterator sẽ cạn kiệt (exhausted). Nếu cần dùng lại nhiều lần, phải chuyển thành `list()` hoặc dùng `itertools.tee()`.',
    jsEquivalent: 'ES6 Generators / itertools-ts',
    relatedTerms: ['kw-yield', 'fn-iter-next', 'fn-zip'],
  },
  {
    id: 'mod-functools',
    term: 'functools',
    aliases: ['import functools', 'lru_cache', 'partial', 'reduce', 'wraps'],
    category: 'stdlib',
    level: 'advanced',
    stageId: 'stage-3',
    shortSummary:
      'Tiện ích bậc cao thao tác với hàm (Higher-order functions): bộ nhớ đệm tự động lru_cache, gán tham số cục bộ partial, và bảo tồn metadata qua wraps.',
    detailedExplanation:
      '`functools` tối ưu hóa phong cách Lập trình Hàm (Functional Programming): `@lru_cache(maxsize=128)` (bộ nhớ đệm ghi nhớ kết quả tính toán đắt đỏ theo giải thuật Least Recently Used), `@wraps` (decorator giữ nguyên `__name__` và `__doc__` của hàm gốc khi viết Custom Decorator), `partial(func, *args)` (tạo hàm mới với một số tham số được cố định trước), `reduce()` (rút gọn danh sách về 1 giá trị duy nhất).',
    analogy:
      'Thư ký ghi chép thông minh: khi sếp hỏi một câu hỏi phức tạp đã từng tính tuần trước, thư ký đọc ngay kết quả trong sổ ghi nhớ mà không cần tính lại.',
    syntaxExample: `from functools import lru_cache, wraps\n\n# 1. Tăng tốc hàm Fibonacci đệ quy từ O(2^n) thành O(n) tức thời\n@lru_cache(maxsize=None)\ndef fib(n: int) -> int:\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint("Fib(100):", fib(100))  # Tính xong tức thời trong chớp mắt!\n\n# 2. Viết decorator chuẩn mực không làm mất tên hàm gốc\ndef my_timer(func):\n    @wraps(func)  # Bảo vệ metadata của func\n    def wrapper(*args, **kwargs):\n        return func(*args, **kwargs)\n    return wrapper`,
    commonGotcha:
      'Các tham số truyền vào hàm có `@lru_cache` bắt buộc phải là kiểu hashable (bất biến như int, str, tuple). Nếu truyền `list` hoặc `dict` vào hàm có cache, Python sẽ ném `TypeError: unhashable type`.',
    jsEquivalent: 'lodash memoize / partial, higher-order functions',
    relatedTerms: ['decl-decorator', 'fn-hash', 'mod-itertools'],
  },
  {
    id: 'mod-re',
    term: 're',
    aliases: ['import re', 'regex', 'regular expression', 're.search', 're.findall'],
    category: 'stdlib',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary:
      'Công cụ xử lý Biểu thức chính quy (Regular Expressions) chuyên nghiệp để tìm kiếm, trích xuất và biến đổi mẫu văn bản phức tạp.',
    detailedExplanation:
      '`re` cung cấp các hàm regex mạnh mẽ: `re.search(pattern, text)` (tìm vị trí khớp đầu tiên), `re.findall(pattern, text)` (lấy danh sách mọi kết quả khớp), `re.sub(pattern, repl, text)` (tìm và thay thế chuỗi), `re.split()` (chia tách chuỗi theo mẫu), `re.compile(pattern)` (biên dịch trước mẫu regex thành đối tượng Regex Object để tối ưu tốc độ lặp lại triệu lần).',
    analogy:
      'Kính hiển vi lọc mẫu DNA: quét toàn bộ văn bản khổng lồ để lọc ra chính xác các mẫu khớp chuỗi (địa chỉ email, số điện thoại, link URL).',
    syntaxExample: `import re\n\ntext = "Liên hệ qua admin@pylearn.dev hoặc support@edu.vn. Hotline: 0988-123-456"\n\n# 1. Trích xuất toàn bộ địa chỉ email\nemails = re.findall(r"[\\w.-]+@[\\w.-]+\\.\\w+", text)\nprint("Danh sách email:", emails)  # ['admin@pylearn.dev', 'support@edu.vn']\n\n# 2. Ẩn thông tin số điện thoại (masking)\nmasked = re.sub(r"\\d{4}-\\d{3}-\\d{3}", "[ĐÃ ẨN]", text)\nprint(masked)`,
    commonGotcha:
      'Luôn luôn đặt ký tự `r` phía trước chuỗi regex (Raw String, vd: `r"\\d+"`) để tránh việc Python hiểu nhầm các ký tự escape như `\\n`, `\\t` gây sai lệch mẫu regex.',
    jsEquivalent: 'JavaScript RegExp (RegExp.exec, String.match, String.replace)',
    relatedTerms: ['type-str', 'mod-pathlib'],
  },
  {
    id: 'mod-subprocess',
    term: 'subprocess',
    aliases: ['import subprocess', 'subprocess.run', 'subprocess.Popen'],
    category: 'stdlib',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary:
      'Module khởi tạo và kiểm soát tiến trình con (child processes), thực thi các lệnh Terminal / Shell hệ thống an toàn và nhận kết quả.',
    detailedExplanation:
      '`subprocess` là phương thức hiện đại chuẩn mực thay thế cho `os.system`. Cung cấp hàm `subprocess.run(["cmd", "arg1"], capture_output=True, text=True, check=True)` cho phép truyền tham số dưới dạng danh sách ngăn chặn triệt để tấn công Shell Injection, nhận dữ liệu stdout, stderr và bắt lỗi Exit Code tự động.',
    analogy:
      'Người quản lý giao việc cho nhân viên cấp dưới làm một nhiệm vụ độc lập, chờ nhân viên báo cáo kết quả và kiểm tra xem có phát sinh sự cố không.',
    syntaxExample: `import subprocess\n\n# Thực thi lệnh git version hoặc lệnh shell an toàn\ntry:\n    result = subprocess.run(\n        ["git", "--version"],\n        capture_output=True,\n        text=True,\n        check=True\n    )\n    print("Phiên bản Git:", result.stdout.strip())\nexcept FileNotFoundError:\n    print("Máy bạn chưa cài đặt Git!")\nexcept subprocess.CalledProcessError as e:\n    print(f"Lệnh thất bại với mã lỗi {e.returncode}: {e.stderr}")`,
    commonGotcha:
      'Tránh dùng `shell=True` khi tham số đầu vào đến từ người dùng không đáng tin cậy, vì nó mở cửa cho lỗ hổng Command Injection cực kỳ nguy hiểm.',
    jsEquivalent: 'Node.js child_process (execFile, spawn)',
    relatedTerms: ['mod-sys', 'mod-os'],
  },
  {
    id: 'mod-shutil',
    term: 'shutil',
    aliases: ['import shutil', 'shutil.copy', 'shutil.rmtree'],
    category: 'stdlib',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Tiện ích tệp tin bậc cao (Shell Utilities) chuyên sao chép file, di chuyển dữ liệu và xóa sạch thư mục nhiều tầng.',
    detailedExplanation:
      '`shutil` bổ sung những gì `os` còn thiếu ở mức độ tệp: `shutil.copy2(src, dst)` (sao chép file kèm bảo tồn thời gian và metadata), `shutil.copytree(src, dst)` (sao chép toàn bộ cây thư mục), `shutil.rmtree(path)` (xóa sạch cả cây thư mục đệ quy, tương đương `rm -rf`), `shutil.move(src, dst)` (di chuyển hoặc đổi tên), `shutil.disk_usage(path)` (kiểm tra dung lượng đĩa trống).',
    analogy:
      'Xe cẩu và đội dọn nhà chuyên nghiệp: bưng nguyên cả tủ hồ sơ hoặc dọn sạch cả căn phòng trong một lệnh.',
    syntaxExample: `import shutil\nfrom pathlib import Path\n\n# 1. Sao chép 1 file kèm metadata\n# shutil.copy2("report.pdf", "backup/report_bak.pdf")\n\n# 2. Xóa sạch 1 thư mục tạm thời (tương đương rm -rf)\ntemp_dir = Path("build_cache")\nif temp_dir.exists():\n    shutil.rmtree(temp_dir)\n    print("Đã dọn dẹp sạch sẽ thư mục cache!")\n\n# 3. Kiểm tra dung lượng ổ đĩa\ntotal, used, free = shutil.disk_usage("/")\nprint(f"Ổ đĩa trống: {free // (2**30)} GB")`,
    commonGotcha:
      '`shutil.rmtree()` xóa vĩnh viễn dữ liệu khỏi ổ đĩa mà không đưa vào Thùng rác (Recycle Bin/Trash). Hãy cực kỳ cẩn trọng khi truyền biến đường dẫn vào hàm này!',
    jsEquivalent: 'npm package fs-extra (fs.copy, fs.remove)',
    relatedTerms: ['mod-os', 'mod-pathlib'],
  },
  {
    id: 'mod-time',
    term: 'time',
    aliases: ['import time', 'time.sleep', 'time.time', 'perf_counter'],
    category: 'stdlib',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Module làm việc với thời gian thực tế hệ thống, UNIX timestamp và đo đạc hiệu năng thực thi độ chính xác nano-giây.',
    detailedExplanation:
      '`time` tương tác với đồng hồ của hệ điều hành: `time.time()` (trả về timestamp UNIX số giây trôi qua từ 01/01/1970 UTC), `time.sleep(seconds)` (tạm dừng luồng thực thi trong số giây chỉ định), và đặc biệt `time.perf_counter()` (đồng hồ đơn điệu monotonic có độ phân giải cao nhất dùng để đo thời gian chạy benchmark thuật toán).',
    analogy:
      'Đồng hồ bấm giây của trọng tài Olympic: bấm chạy khi vận động viên xuất phát và bấm dừng ngay vạch đích để đo từng phần nghìn giây.',
    syntaxExample: `import time\n\n# 1. Đo lường chính xác thời gian thực thi của một đoạn code\nstart_time = time.perf_counter()\n\n# Giả lập công việc xử lý dữ liệu\ntotal = sum(i * i for i in range(1_000_000))\n\nelapsed = time.perf_counter() - start_time\nprint(f"Tổng: {total} | Thời gian chạy: {elapsed:.4f} giây")\n\n# 2. Tạm dừng chương trình 1.5 giây\nprint("Đang chuẩn bị...")\ntime.sleep(1.5)\nprint("Hoàn tất!")`,
    commonGotcha:
      'Để đo thời gian chạy của hàm (benchmark), KHÔNG dùng `time.time()` vì nó phụ thuộc vào đồng hồ hệ thống (có thể bị nhảy lùi khi máy tính đồng bộ giờ NTP). Luôn dùng `time.perf_counter()`.',
    jsEquivalent: 'setTimeout / performance.now()',
    relatedTerms: ['mod-datetime', 'mod-functools'],
  },
  {
    id: 'mod-copy',
    term: 'copy',
    aliases: ['import copy', 'copy.copy', 'copy.deepcopy', 'shallow copy', 'deep copy'],
    category: 'stdlib',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary:
      'Module sao chép đối tượng Python: phân biệt rõ ràng giữa Bản sao nông (Shallow copy) và Bản sao sâu độc lập hoàn toàn (Deep copy).',
    detailedExplanation:
      'Trong Python, phép gán `b = a` chỉ tạo thêm một nhãn tham chiếu trỏ cùng vào một vùng nhớ. Module `copy` cung cấp giải pháp tách biệt: `copy.copy(obj)` tạo Shallow copy (tạo container mới nhưng các đối tượng con lồng bên trong vẫn dùng chung tham chiếu), và `copy.deepcopy(obj)` tạo Deep copy (sao chép đệ quy toàn bộ mọi nhánh cây dữ liệu, hoàn toàn cô lập độc lập).',
    analogy:
      'Shallow copy giống như photocopy bìa tập hồ sơ nhưng tài liệu bên trong vẫn chia sẻ chung; Deep copy là photo toàn bộ từng trang tài liệu để mang về nhà riêng.',
    syntaxExample: `import copy\n\noriginal = [[1, 2], [3, 4]]\n\n# 1. Phép gán = (cùng trỏ 1 nơi)\nsame_ref = original\nsame_ref[0][0] = 999\nprint(original[0][0])  # 999 (bị thay đổi ngoài ý muốn!)\n\n# 2. Deep copy: độc lập 100%\noriginal = [[1, 2], [3, 4]]\ncloned = copy.deepcopy(original)\ncloned[0][0] = 777\nprint(original[0][0])  # 1 (gốc vẫn giữ nguyên vẹn!)`,
    commonGotcha:
      '`copy.deepcopy` có chi phí hiệu năng và RAM lớn đối với các cây đối tượng khổng lồ. Hãy chỉ dùng Deep copy khi thực sự có dữ liệu lồng nhau cần biến đổi độc lập.',
    jsEquivalent: 'structuredClone() (deep) vs {...obj} / Object.assign() (shallow)',
    relatedTerms: ['type-list', 'type-dict', 'concept-pass-by-assignment'],
  },
  {
    id: 'mod-typing',
    term: 'typing',
    aliases: ['import typing', 'type hints', 'Union', 'Optional', 'List', 'Dict', 'Any'],
    category: 'stdlib',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary:
      'Hệ thống Chú thích Kiểu dữ liệu (Type Hints) tĩnh hỗ trợ các công cụ IDE (VS Code, PyCharm) và trình kiểm tra mypy bắt lỗi trước khi chạy.',
    detailedExplanation:
      '`typing` mang sức mạnh định kiểu tĩnh vào ngôn ngữ định kiểu động: `Optional[T]` (có thể là kiểu T hoặc None), `Union[A, B]` (kiểu A hoặc B), `Callable[[int], str]` (hàm nhận int trả về str), `Literal["dark", "light"]` (chỉ nhận đúng các chuỗi hằng số), `TypeVar` và `Generic` (tạo kiểu generic tái sử dụng). Từ Python 3.10+, cú pháp toán tử `|` (như `int | None`) có thể thay thế cho `Optional` và `Union`.',
    analogy:
      'Biển báo tải trọng trên cầu: giúp tài xế và cảnh sát giao thông biết chính xác xe nào được phép qua cầu trước khi xảy ra tai nạn.',
    syntaxExample: `from typing import Optional, List, Dict, Any\n\ndef process_user(user_id: int, tags: List[str] = []) -> Optional[Dict[str, Any]]:\n    if user_id <= 0:\n        return None\n    return {"id": user_id, "tags": tags, "active": True}\n\n# Python 3.10+ cú pháp hiện đại ngắn gọn hơn:\ndef parse_value(val: int | float | None) -> str:\n    return f"Giá trị: {val}"`,
    commonGotcha:
      'Type hints trong Python chỉ mang tính chất tài liệu và gợi ý cho IDE, CPython KHÔNG hề kiểm tra kiểu lúc chạy runtime (chương trình vẫn chạy bình thường kể cả khi sai kiểu). Muốn kiểm tra bắt buộc phải dùng công cụ `mypy` hoặc thư viện `pydantic`.',
    jsEquivalent: 'TypeScript type declarations (interface, type, generics)',
    relatedTerms: ['decl-type', 'fn-type', 'fn-isinstance'],
  },
  {
    id: 'mod-asyncio',
    term: 'asyncio',
    aliases: ['import asyncio', 'asyncio.run', 'asyncio.gather', 'event loop'],
    category: 'stdlib',
    level: 'advanced',
    stageId: 'stage-4',
    shortSummary:
      'Thư viện Lập trình Bất đồng bộ (Asynchronous I/O) chạy đơn luồng dựa trên Vòng lặp Sự kiện (Event Loop) giúp xử lý hàng chục nghìn kết nối mạng đồng thời.',
    detailedExplanation:
      '`asyncio` là xương sống của các framework web hiện đại như FastAPI, Tornado: quản lý bằng Event Loop duy nhất, dùng cú pháp `async def` để định nghĩa Coroutine và `await` để tạm nhường quyền điều khiển khi chờ tác vụ I/O (gọi API, truy vấn database, đọc ghi tệp). Các hàm chính: `asyncio.run()` (chạy coroutine chính), `asyncio.gather()` (chạy song song hàng loạt coroutine), `asyncio.sleep()` (chờ bất đồng bộ).',
    analogy:
      'Một đầu bếp nhà hàng chuyên nghiệp: trong lúc chờ nước sôi (chờ mạng I/O), đầu bếp không đứng nhìn mà quay sang thái hành và ướp thịt, tối đa hóa năng suất.',
    syntaxExample: `import asyncio\n\nasync def fetch_data(source_id: int):\n    print(f"Bắt đầu tải nguồn {source_id}...")\n    await asyncio.sleep(1)  # Giả lập độ trễ mạng\n    return f"Dữ liệu {source_id}"\n\nasync def main():\n    # Chạy đồng thời cả 3 tác vụ cùng lúc\n    results = await asyncio.gather(\n        fetch_data(1),\n        fetch_data(2),\n        fetch_data(3)\n    )\n    print("Tất cả kết quả:", results)\n\n# Chạy Event Loop\nasyncio.run(main())`,
    commonGotcha:
      'Gọi một hàm chặn CPU lâu (CPU-bound) hoặc hàm đồng bộ như `time.sleep()` bên trong Coroutine sẽ làm ĐÔNG CỨNG toàn bộ Event loop! Luôn dùng `await asyncio.sleep()` hoặc đẩy ra thread pool qua `asyncio.to_thread()`.',
    jsEquivalent: 'JavaScript async/await + Promise.all() + Event Loop',
    relatedTerms: ['kw-async', 'kw-await', 'mod-time'],
  },
  {
    id: 'mod-logging',
    term: 'logging',
    aliases: ['import logging', 'logger', 'logging.info', 'logging.error'],
    category: 'stdlib',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary:
      'Hệ thống Ghi nhật ký hoạt động (Logging) chuẩn sản xuất, phân cấp độ nghiêm trọng từ DEBUG, INFO đến WARNING, ERROR, CRITICAL.',
    detailedExplanation:
      '`logging` thay thế hoàn toàn việc lạm dụng lệnh `print` trong dự án thực tế. Cho phép cấu hình ghi ra cả màn hình Console lẫn tệp tin xoay vòng (rotating file), tự động ghi nhận timestamp, tên file, số dòng xảy ra sự kiện, và stack trace ngoại lệ qua `logger.exception()`. Hỗ trợ tắt/mở mức độ log tức thì mà không cần xóa code.',
    analogy:
      'Hộp đen máy bay: ghi nhận liên tục hành trình bay, khi thời tiết tốt chỉ ghi mốc thời gian, khi có chấn động nguy hiểm sẽ lưu toàn bộ thông số chi tiết để cứu hộ.',
    syntaxExample: `import logging\n\n# Cấu hình log cơ bản\nlogging.basicConfig(\n    level=logging.INFO,\n    format="%(asctime)s [%(levelname)s] %(name)s (line %(lineno)d): %(message)s",\n    datefmt="%H:%M:%S"\n)\n\nlogger = logging.getLogger("PaymentGateway")\nlogger.info("Khởi động cổng thanh toán...")\n\ntry:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    logger.exception("Giao dịch thất bại do lỗi toán học:")`,
    commonGotcha:
      'Không nên dùng trực tiếp root logger `logging.info(...)` trong các module con. Hãy luôn tạo logger có tên riêng: `logger = logging.getLogger(__name__)`.',
    jsEquivalent: 'console (info/warn/error) hoặc thư viện winston / pino',
    relatedTerms: ['fn-print', 'kw-try', 'kw-except'],
  },
  {
    id: 'mod-sqlite3',
    term: 'sqlite3',
    aliases: ['import sqlite3', 'sqlite database', 'sqlite3.connect'],
    category: 'stdlib',
    level: 'fundamental',
    stageId: 'stage-2',
    shortSummary:
      'Cơ sở dữ liệu quan hệ SQL nhúng (Embedded Relational Database) tích hợp sẵn trong Python, không cần cài đặt thêm bất kỳ máy chủ database nào.',
    detailedExplanation:
      '`sqlite3` triển khai giao diện DB-API 2.0 chuẩn của Python: lưu trữ toàn bộ cơ sở dữ liệu bên trong một tệp tin `.db` duy nhất trên ổ đĩa (hoặc chạy hoàn toàn trên RAM với `:memory:`). Hỗ trợ đầy đủ cú pháp SQL tiêu chuẩn (SELECT, INSERT, UPDATE, DELETE, Transactions, JOIN, Indexes). Cực kỳ lý tưởng cho người mới bắt đầu học SQL hoặc lưu trữ cấu hình cục bộ của app.',
    analogy:
      'Cuốn sổ kế toán bỏ túi: có các bảng kẻ ô rõ ràng, bạn viết trực tiếp vào sổ mà không cần kết nối tới máy chủ ngân hàng trung ương cồng kềnh.',
    syntaxExample: `import sqlite3\n\n# Kết nối vào file database (tự tạo nếu chưa có)\nconn = sqlite3.connect("students.db")\ncursor = conn.cursor()\n\n# 1. Tạo bảng\ncursor.execute("""\nCREATE TABLE IF NOT EXISTS users (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    name TEXT NOT NULL,\n    score REAL\n)\n""")\n\n# 2. Thêm dữ liệu an toàn với tham số ? (chống SQL Injection)\ncursor.execute("INSERT INTO users (name, score) VALUES (?, ?)", ("Minh", 9.5))\nconn.commit()  # Xác nhận lưu thay đổi\n\n# 3. Truy vấn\ncursor.execute("SELECT id, name, score FROM users")\nfor row in cursor.fetchall():\n    print("Học sinh:", row)\n\nconn.close()`,
    commonGotcha:
      'Quên gọi `conn.commit()` sau khi INSERT/UPDATE/DELETE sẽ khiến dữ liệu bị biến mất khi đóng kết nối! Hoặc hãy dùng cú pháp `with conn:` để tự động commit.',
    jsEquivalent: 'better-sqlite3 / sqlite3 npm',
    relatedTerms: ['kw-with', 'fn-open'],
  },
  {
    id: 'mod-hashlib',
    term: 'hashlib',
    aliases: ['import hashlib', 'sha256', 'md5', 'cryptographic hashing'],
    category: 'stdlib',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary:
      'Thư viện Thuật toán Băm Mật mã an toàn (Cryptographic Hashing): SHA-256, SHA-512, MD5 dùng để kiểm tra tính toàn vẹn dữ liệu và mã hóa mật khẩu.',
    detailedExplanation:
      '`hashlib` cung cấp giao diện đồng nhất cho các thuật toán băm một chiều an toàn (One-way Hash Functions). Một chuỗi dữ liệu đầu vào bất kể dài bao nhiêu đều được biến đổi thành một chuỗi băm hex có độ dài cố định (SHA-256 luôn ra 64 ký tự hex). Thuật toán đảm bảo tính chất tuyết lở (Avalanche Effect): chỉ đổi 1 dấu chấm ở đầu vào sẽ làm toàn bộ chuỗi băm thay đổi hoàn toàn.',
    analogy:
      'Dấu vân tay kỹ thuật số của một văn bản: không ai có thể từ dấu vân tay vẽ lại hình dáng cơ thể người, nhưng chỉ cần đối chiếu vân tay là biết tài liệu có bị sửa đổi hay không.',
    syntaxExample: `import hashlib\n\n# Băm mật khẩu hoặc văn bản bằng SHA-256\npassword = "MySecurePassword123"\n# Bắt buộc chuyển chuỗi str thành chuỗi bytes trước khi băm\nhash_obj = hashlib.sha256(password.encode("utf-8"))\nhex_digest = hash_obj.hexdigest()\n\nprint("Mã băm SHA-256:", hex_digest)\n# Output luôn là chuỗi 64 ký tự không thể giải ngược!`,
    commonGotcha:
      'MD5 và SHA-1 hiện nay đã bị phá vỡ về mặt bảo mật (dễ bị tấn công va chạm Collision Attack). Tuyệt đối không dùng MD5 để lưu mật khẩu hay chữ ký số, hãy dùng tối thiểu SHA-256 hoặc bcrypt/argon2.',
    jsEquivalent: 'Node.js crypto.createHash("sha256")',
    relatedTerms: ['type-bytes', 'fn-hash'],
  },
  {
    id: 'mod-unittest',
    term: 'unittest',
    aliases: ['import unittest', 'TestCase', 'assert', 'unit testing'],
    category: 'stdlib',
    level: 'basic',
    stageId: 'stage-3',
    shortSummary:
      'Framework Kiểm thử Tự động (Unit Testing Framework) tích hợp sẵn theo chuẩn xUnit, giúp lập trình viên viết test bảo vệ code khỏi lỗi hồi quy (regressions).',
    detailedExplanation:
      '`unittest` (đôi khi được gọi là PyUnit) cung cấp lớp `unittest.TestCase` với bộ hàm so sánh phong phú: `assertEqual(a, b)`, `assertTrue(x)`, `assertIn(item, list)`, `assertRaises(Exception)`. Hỗ trợ các hook vòng đời `setUp()` (chạy trước mỗi bài test để khởi tạo fixture) và `tearDown()` (dọn dẹp sau bài test). Tự động quét và chạy mọi test case qua lệnh `python -m unittest`.',
    analogy:
      'Hàng rào kiểm định chất lượng cuối dây chuyền: mỗi sản phẩm ra lò đều phải trải qua hàng chục bài test thả rơi, ngâm nước trước khi được phép xuất xưởng.',
    syntaxExample: `import unittest\n\ndef add(a, b):\n    return a + b\n\nclass TestMathFunctions(unittest.TestCase):\n    def test_add_positive(self):\n        self.assertEqual(add(2, 3), 5)\n        \n    def test_add_negative(self):\n        self.assertEqual(add(-1, 1), 0)\n        \n    def test_add_strings(self):\n        self.assertEqual(add("Hello ", "World"), "Hello World")\n\nif __name__ == "__main__":\n    unittest.main()`,
    commonGotcha:
      'Tên phương thức test bắt buộc phải bắt đầu bằng từ khóa `test_` (ví dụ `test_calculator`). Nếu đặt tên `my_test()`, framework sẽ bỏ qua và không chạy hàm test đó.',
    jsEquivalent: 'Jest / Vitest / Mocha',
    relatedTerms: ['kw-assert', 'kw-class'],
  },
];

import { FlashcardItem } from '@/types/assessment.types';

export const FLASHCARDS_STAGE_1_TO_2: FlashcardItem[] = [
  // ============================================================================
  // STAGE 1: TƯ DUY CỐT LÕI & CÚ PHÁP PYTHON HIỆN ĐẠI (28 CARDS: fc-1 -> fc-28)
  // ============================================================================
  {
    id: 'fc-1',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cơ chế Thực thi CPython',
    frontQuestion: 'Chuỗi thực thi mã nguồn của CPython (từ file `.py` đến khi chạy trên CPU) gồm những bước nào?',
    frontHint: 'Source Code -> AST -> Bytecode -> PVM.',
    backAnswer:
      'CPython không dịch thẳng ra mã máy (Machine Code) như C/Rust mà đi qua 3 bước: (1) Phân tích cú pháp mã nguồn `.py` thành cây cú pháp trừu tượng **AST**; (2) Biên dịch AST thành **Bytecode** (các chỉ thị cấp thấp như `LOAD_FAST`, `BINARY_OP`); (3) Máy ảo **PVM (Python Virtual Machine)** chạy vòng lặp đánh giá từng chỉ thị Bytecode.',
    backAnalogy:
      'Giống như đầu bếp đọc công thức tiếng Việt (`.py`), tóm tắt thành phiếu chế biến chuẩn hóa (Bytecode), rồi trạm bếp tự động (PVM) đọc từng dòng phiếu để nấu.',
    codeSnippet: `import dis\ndef add(a: int, b: int) -> int:\n    return a + b\ndis.dis(add)  # Xem trực tiếp các lệnh Bytecode của hàm`,
    relatedTermIds: ['concept-cpython', 'concept-bytecode', 'concept-pvm'],
  },
  {
    id: 'fc-2',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cơ chế Thực thi CPython',
    frontQuestion: 'Thư mục `__pycache__` và các file `.pyc` được sinh ra để làm gì?',
    frontHint: 'Tăng tốc thời gian Import hay tăng tốc độ chạy thuật toán?',
    backAnswer:
      'File `.pyc` lưu trữ **Bytecode đã biên dịch** của các module được `import`. Ở lần chạy tiếp theo, nếu timestamp của file `.py` không đổi, CPython nạp thẳng `.pyc` vào PVM mà bỏ qua bước Parse AST + Compile. Lưu ý: `.pyc` chỉ giúp **tăng tốc độ khởi động (import)** chứ không làm code chạy nhanh hơn trên PVM.',
    backAnalogy:
      'Giống như lưu sẵn bản dịch công thức nấu ăn trong ngăn kéo (`__pycache__`) để hôm sau vào bếp làm ngay không cần dịch lại từ đầu.',
    codeSnippet: `# Cấu trúc tên file cache chuẩn trong __pycache__/:\n# module_name.cpython-312.pyc`,
    relatedTermIds: ['concept-bytecode', 'concept-cpython', 'kw-import'],
  },
  {
    id: 'fc-3',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Hệ thống Kiểu (Type System)',
    frontQuestion: 'Tại sao nói Python vừa là ngôn ngữ **Dynamically Typed** (Kiểu động) vừa là **Strongly Typed** (Kiểu mạnh)?',
    frontHint: 'So sánh biểu thức `"5" + 3` giữa JavaScript và Python.',
    backAnswer:
      '**Dynamically Typed**: Kiểu dữ liệu gắn với *Đối tượng (Object)* lúc Runtime chứ không gắn cứng với tên biến lúc khai báo. **Strongly Typed**: Python nghiêm cấm tự động ép kiểu ngầm định (implicit coercion) giữa các kiểu không tương thích — biểu thức `"5" + 3` sẽ ném `TypeError` ngay lập tức thay vì nối thành `"53"` như JavaScript.',
    backAnalogy:
      'Nhãn dán trên hộp có thể đổi tự do (Dynamic), nhưng tuyệt đối không cho đổ xăng vào bình nước ngọt nếu không qua phễu chuyển đổi rõ ràng (Strong).',
    codeSnippet: `# "5" + 3  -> TypeError: can only concatenate str (not "int") to str\nresult = int("5") + 3  # 8 (Ép kiểu tường minh)`,
    relatedTermIds: ['concept-strong-dynamic-typing', 'type-int', 'type-str'],
  },
  {
    id: 'fc-4',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Hệ sinh thái & Tooling',
    frontQuestion: '`uv` là gì và tại sao nó thay thế hoàn toàn tổ hợp `pip` + `venv` + `poetry` trong Python hiện đại?',
    frontHint: 'Trình quản lý gói viết bằng Rust của Astral.',
    backAnswer:
      '`uv` là trình quản lý package, virtualenv và phiên bản Python viết bằng **Rust**, nhanh hơn `pip` từ **10x đến 100x** nhờ tải song song và bộ nhớ đệm toàn cục (Global Module Cache dùng Hardlink/Copy-on-Write). Nó tự động quản lý `.venv`, chuẩn hóa `pyproject.toml` và khóa phiên bản chính xác tuyệt đối qua `uv.lock`.',
    backAnalogy:
      'Nếu `pip` là xe đạp giao từng kiện hàng lẻ thì `uv` là tàu cao tốc Shinkansen chở nguyên container có niêm phong mã vạch (`uv.lock`).',
    codeSnippet: `uv init my-app && cd my-app\nuv add fastapi uvicorn\nuv run fastapi dev`,
    relatedTermIds: ['tool-uv', 'tool-pyproject-toml', 'concept-venv'],
  },
  {
    id: 'fc-5',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Hệ sinh thái & Tooling',
    frontQuestion: '`Ruff` đóng vai trò gì trong quy trình phát triển Python chuyên nghiệp?',
    frontHint: 'Thay thế Flake8, Black, isort chỉ bằng 1 công cụ duy nhất.',
    backAnswer:
      '`Ruff` là bộ **Linter kiêm Code Formatter** cực nhanh viết bằng Rust (nhanh hơn Flake8/Black ~100 lần). Nó tích hợp hơn 800 quy tắc kiểm tra chất lượng code (bắt biến thừa, lỗi bảo mật, sắp xếp `import`, chuẩn PEP 8) và định dạng code nhất quán chỉ trong vài mili-giây.',
    backAnalogy:
      'Máy quét laser kiểm tra lỗi chính tả và căn lề toàn bộ cuốn sách 1.000 trang chỉ trong một cái chớp mắt.',
    codeSnippet: `uv run ruff check --fix .   # Tự động bắt lỗi & sửa import\nuv run ruff format .        # Format code chuẩn PEP 8`,
    relatedTermIds: ['tool-ruff', 'tool-uv', 'concept-pep8'],
  },
  {
    id: 'fc-6',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Hệ sinh thái & Tooling',
    frontQuestion: '`Pyright` (hoặc `mypy`) kiểm tra Type Hints ở thời điểm nào và CPython có kiểm tra Type Hints lúc chạy không?',
    frontHint: 'Static Analysis (Compile/IDE-time) vs Runtime.',
    backAnswer:
      'CPython **bỏ qua hoàn toàn Type Hints lúc Runtime** (chỉ lưu vào thuộc tính `__annotations__` mà không chặn nếu truyền sai kiểu). `Pyright` và `mypy` là công cụ phân tích tĩnh (**Static Type Checker**) quét cây AST ngay trên IDE và CI/CD để phát hiện lỗi sai kiểu dữ liệu, lỗi `None` (`Optional`) trước khi code được chạy.',
    backAnalogy:
      'Bản vẽ kỹ thuật (`Type Hints`) được kỹ sư giám sát (`Pyright`) kiểm duyệt tại văn phòng trước khi công nhân (`CPython`) ra công trường thi công.',
    codeSnippet: `def greet(name: str) -> str:\n    return f"Hello, {name.upper()}"\n# Pyright báo lỗi đỏ ngay khi gõ: greet(123)`,
    relatedTermIds: ['tool-pyright', 'concept-type-hints', 'eco-pydantic'],
  },
  {
    id: 'fc-7',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Mô hình Bộ nhớ',
    frontQuestion: 'Cơ chế truyền tham số và gán biến trong Python (Pass-by-Object-Reference) hoạt động như thế nào?',
    frontHint: 'Hãy nhớ hình ảnh "Nhãn dán trên quả bóng bay" vs "Chiếc hộp gỗ".',
    backAnswer:
      'Biến trong Python không phải là chiếc hộp chứa giá trị mà chỉ là **nhãn tên (name binding)** trỏ tới Đối tượng trên Heap. Phép gán `b = a` chỉ dán thêm nhãn `b` vào cùng đối tượng mà `a` đang trỏ tới. Nếu đối tượng là khả biến (`list`, `dict`, `set`), sửa nội dung bên trong qua `b` sẽ làm `a` thấy sự thay đổi đó.',
    backAnalogy:
      'Buộc 2 sợi dây tên `a` và `b` vào cùng 1 quả bóng bay: ai vẽ lên quả bóng thì người kia cũng nhìn thấy.',
    codeSnippet: `a = [1, 2]\nb = a\nb.append(3)\nprint(a)  # [1, 2, 3] (cùng trỏ 1 list trên Heap)`,
    relatedTermIds: ['concept-pass-by-object-ref', 'kw-is', 'concept-shallow-deep-copy'],
  },
  {
    id: 'fc-8',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cú pháp & Toán tử',
    frontQuestion: 'Sự khác biệt cốt lõi giữa toán tử `==` và toán tử `is` trong Python là gì?',
    frontHint: 'Giá trị bên trong (`__eq__`) vs Địa chỉ ô nhớ vật lý (`id()`).',
    backAnswer:
      '`==` so sánh **GIÁ TRỊ** của 2 đối tượng (gọi phương thức `__eq__`), còn `is` so sánh **ĐỊNH DANH Ô NHỚ** (`id(a) == id(b)` — kiểm tra 2 biến có trỏ vào cùng 1 đối tượng vật lý trong RAM hay không). Quy tắc vàng: Luôn dùng `is` / `is not` cho Singleton như `if x is None:`, còn so sánh dữ liệu (`str`, `int`, `list`) phải dùng `==`.',
    backAnalogy:
      '`==` hỏi "Hai chiếc xe có cùng mẫu mã không?", còn `is` hỏi "Hai chiếc chìa khóa có mở cùng 1 chiếc xe duy nhất không?".',
    codeSnippet: `a = [1, 2]\nb = [1, 2]\nprint(a == b)  # True (cùng giá trị)\nprint(a is b)  # False (2 vùng nhớ khác nhau)`,
    relatedTermIds: ['kw-is', 'kw-none', 'dunder-eq'],
  },
  {
    id: 'fc-9',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Mô hình Bộ nhớ',
    frontQuestion: 'Tại sao trong CPython, `a = 256; b = 256; a is b` là `True`, nhưng `x = 1000; y = 1000; x is y` (gõ ở 2 dòng REPL) lại là `False`?',
    frontHint: 'Cơ chế Small Integer Caching (Integer Interning) của CPython.',
    backAnswer:
      'Khi khởi động, CPython tạo sẵn một mảng các đối tượng số nguyên từ **`-5` đến `256`** trong bộ nhớ (Small Integer Cache) vì chúng được dùng cực kỳ thường xuyên. Mọi biến mang giá trị trong đoạn `[-5, 256]` đều trỏ chung vào các Singleton này. Các số ngoài khoảng đó sẽ được cấp phát đối tượng mới trên Heap (trừ khi trình biên dịch gộp hằng số trong cùng 1 code block).',
    backAnalogy:
      'Khách sạn in sẵn thẻ phòng từ tầng 1 đến tầng 256 để phát dùng lại ngay, còn khách VIP tầng 1000 phải đúc thẻ mới riêng mỗi lần.',
    codeSnippet: `a, b = 256, int("256")\nprint(a is b)  # True (nằm trong [-5, 256])\nx, y = 1000, int("1000")\nprint(x is y)  # False -> Đừng bao giờ dùng 'is' để so sánh số!`,
    relatedTermIds: ['concept-cpython', 'kw-is', 'type-int'],
  },
  {
    id: 'fc-10',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Bẫy Ngôn ngữ (JS vs Python)',
    frontQuestion: 'Những giá trị nào là **Falsy** trong Python và điểm khác biệt lớn nhất so với JavaScript là gì?',
    frontHint: 'Chú ý tới mảng rỗng `[]` và object/dict rỗng `{}`!',
    backAnswer:
      'Trong Python, các giá trị Falsy gồm: `None`, `False`, số bằng `0` (`0`, `0.0`, `0j`), và **mọi tập hợp/chuỗi rỗng** (`""`, `[]`, `()`, `{}`, `set()`, `range(0)`). Điểm khác biệt chí mạng với JS/TS: trong JavaScript `Boolean([])` và `Boolean({})` là `true`, còn trong Python `bool([])` và `bool({})` là **`False`**!',
    backAnalogy:
      'JavaScript nhìn thấy cái giỏ rỗng vẫn tính là "có cái giỏ" (`true`), còn Python mở giỏ ra thấy không có hàng bên trong thì kết luận là "trống rỗng" (`False`).',
    codeSnippet: `items: list[int] = []\nif not items:\n    print("Danh sách đang rỗng!")  # Chuẩn Pythonic thay vì len(items) == 0`,
    relatedTermIds: ['type-bool', 'kw-none', 'type-list'],
  },
  {
    id: 'fc-11',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Kiểu Dữ liệu Cốt lõi',
    frontQuestion: 'Tại sao kiểu `int` trong Python không bao giờ bị lỗi tràn số nguyên (Integer Overflow) như `int32`/`int64` trong C/Java?',
    frontHint: 'Arbitrary-precision arithmetic (Số nguyên độ chính xác tùy ý).',
    backAnswer:
      'Kiểu `int` của Python 3 tự động chuyển đổi sang biểu diễn mảng các chữ số cơ số $2^{30}$ (Arbitrary Precision / BigInt tự động) khi giá trị vượt quá giới hạn thanh ghi 64-bit. Bạn có thể tính `2 ** 10_000` chính xác tới từng chữ số mà chỉ bị giới hạn bởi dung lượng RAM.',
    backAnalogy:
      'Thay vì dùng tờ giấy ghi số có đúng 10 ô cố định (64-bit), Python tự động dán nối thêm giấy dài vô tận khi con số phình to.',
    codeSnippet: `huge = 10 ** 100  # Googol (1 theo sau bởi 100 số 0)\nprint(huge + 1)   # Tính chính xác tuyệt đối, không bị tràn số`,
    relatedTermIds: ['type-int', 'concept-arbitrary-precision'],
  },
  {
    id: 'fc-12',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Kiểu Dữ liệu Cốt lõi',
    frontQuestion: 'Tại sao `0.1 + 0.2 == 0.3` lại trả về `False` và cách xử lý chuẩn xác trong hệ thống tài chính/tiền tệ là gì?',
    frontHint: 'Chuẩn số thực nhị phân IEEE 754 vs `decimal.Decimal` / `math.isclose`.',
    backAnswer:
      '`float` dùng chuẩn nhị phân 64-bit IEEE 754 nên không thể biểu diễn chính xác phân số thập phân `0.1` (tương tự `1/3 = 0.3333...` trong hệ 10), dẫn đến `0.1 + 0.2 = 0.30000000000000004`. Giải pháp: Dùng **`decimal.Decimal("0.1")`** (lưu ý truyền chuỗi `str`) cho kế toán/tiền tệ, hoặc dùng `math.isclose(a, b)` cho tính toán khoa học.',
    backAnalogy:
      'Thước đo chia vạch hệ inch (`float` nhị phân) sẽ luôn lệch một chút khi đo vật thể thiết kế theo milimét (`Decimal` hệ thập phân).',
    codeSnippet: `from decimal import Decimal\nimport math\n\nprice = Decimal("0.1") + Decimal("0.2")\nassert price == Decimal("0.3")  # True tuyệt đối\nassert math.isclose(0.1 + 0.2, 0.3)  # True`,
    relatedTermIds: ['type-float', 'stdlib-decimal', 'stdlib-math'],
  },
  {
    id: 'fc-13',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Chuỗi & Định dạng',
    frontQuestion: 'Tại sao nối chuỗi bằng `s += chunk` trong vòng lặp lại chậm (`O(n^2)`) và cú pháp f-string hiện đại có những vũ khí gì?',
    frontHint: 'Tính bất biến (Immutability) của `str` + `"".join()` + `f"{var=}"`.',
    backAnswer:
      '`str` là **bất biến (Immutable)** nên mỗi lần `s += chunk` phải cấp phát vùng nhớ mới và copy lại toàn bộ chuỗi cũ. Để nối nhiều chuỗi trong vòng lặp, hãy gom vào `list` rồi gọi **`"".join(parts)`** (`O(n)`). Với f-string (Python 3.8–3.12+), dùng `f"{user_id=}"` để tự in cả tên biến lẫn giá trị khi debug, và `f"{price:,.2f}"` để định dạng số.',
    backAnalogy:
      '`s += chunk` giống như mỗi lần viết thêm 1 câu lại phải chép tay lại cả quyển vở từ trang 1; còn `"".join()` là viết ra từng tờ rời rồi đóng gáy 1 lần.',
    codeSnippet: `user = "Alice"\nbalance = 1250500.5\nprint(f"{user=} | {balance:,.2f} VND")\n# Output: user='Alice' | 1,250,500.50 VND`,
    relatedTermIds: ['type-str', 'concept-fstring', 'concept-immutability'],
  },
  {
    id: 'fc-14',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Cấu trúc Dữ liệu & Big-O',
    frontQuestion: 'Tại sao `list.append(x)` có độ phức tạp `O(1)` nhưng `list.pop(0)` / `list.insert(0, x)` lại tốn `O(n)`? Cần thay bằng gì cho hàng đợi FIFO?',
    frontHint: 'Mảng động (Dynamic Array) các con trỏ vs `collections.deque`.',
    backAnswer:
      'Bên dưới CPython, `list` là một **mảng động liên tiếp các con trỏ** có cơ chế cấp phát dư (Over-allocation ~12.5%), nên thêm/xóa ở **cuối mảng** (`append`/`pop()`) đạt `O(1)` trung bình. Ngược lại, chèn/xóa ở **đầu mảng** (`pop(0)`, `insert(0, x)`) buộc CPython phải dịch chuyển toàn bộ $N-1$ phần tử còn lại trong RAM (`O(n)`). Với hàng đợi hai đầu (FIFO), luôn dùng **`collections.deque`** (`popleft()` đạt `O(1)`).',
    backAnalogy:
      '`list.pop(0)` giống như rút người đầu hàng rạp chiếu phim khiến cả 1.000 người phía sau phải bước lên 1 bước; `deque` là cửa xoay hai đầu bước ra ngay lập tức.',
    codeSnippet: `from collections import deque\nqueue = deque(["task1", "task2"])\nqueue.append("task3")     # O(1)\nfirst = queue.popleft()   # O(1) - Nhanh hơn list.pop(0) hàng nghìn lần!`,
    relatedTermIds: ['type-list', 'stdlib-collections-deque', 'concept-big-o'],
  },
  {
    id: 'fc-15',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cấu trúc Dữ liệu & Big-O',
    frontQuestion: 'Khi nào một `tuple` là **Hashable** (có thể dùng làm key của `dict` hoặc phần tử của `set`) và tại sao `tuple` nhẹ hơn `list`?',
    frontHint: '`tuple` chứa `list` bên trong có băm (`hash()`) được không?',
    backAnswer:
      '`tuple` là bất biến (Immutable) nên kích thước cố định, không cần cấp phát dư (Over-allocation) như `list` và được CPython tái sử dụng bộ nhớ (Free-list caching). Tuy nhiên, một `tuple` **chỉ Hashable khi và chỉ khi TẤT CẢ các phần tử bên trong nó cũng Hashable**. Ví dụ `(1, "a")` dùng làm key `dict` được, nhưng `(1, [2, 3])` sẽ ném `TypeError: unhashable type: "list"`.',
    backAnalogy:
      'Hộp kính khóa chặt (`tuple`) chỉ có thể niêm phong đóng dấu (`hash`) nếu bên trong chứa đá quý cố định, chứ không thể niêm phong nếu bên trong nhốt một con tắc kè (`list`) cứ đổi màu liên tục.',
    codeSnippet: `coords_cache: dict[tuple[int, int], str] = {}\ncoords_cache[(10, 20)] = "Trạm A"  # Hợp lệ vì tuple(int, int) là hashable`,
    relatedTermIds: ['type-tuple', 'type-dict', 'dunder-hash'],
  },
  {
    id: 'fc-16',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Cấu trúc Dữ liệu & Big-O',
    frontQuestion: 'Bảng băm `dict` trong Python 3.7+ hoạt động thế nào để đạt `O(1)` tra cứu vừa bảo toàn thứ tự chèn, và cách tránh lỗi `KeyError`?',
    frontHint: 'Compact Hash Table + `.get()` / `collections.defaultdict`.',
    backAnswer:
      '`dict` sử dụng cấu trúc **Compact Hash Table** tách làm 2 mảng: mảng chỉ mục băm (Hash Indices) để nhảy thẳng tới vị trí trong `O(1)`, và mảng Entries lưu tuần tự theo đúng thứ tự chèn (Insertion Order). Để tránh `KeyError` khi đọc key chưa tồn tại, hãy dùng `d.get(key, default)` hoặc dùng `collections.defaultdict` / `collections.Counter` khi gom nhóm dữ liệu.',
    backAnalogy:
      '`dict` giống tủ hồ sơ có bảng tra cứu mã số tức thì (`O(1)`), đồng thời các ngăn hồ sơ vẫn xếp đúng thứ tự thời gian nộp.',
    codeSnippet: `from collections import defaultdict\ngroups: defaultdict[str, list[str]] = defaultdict(list)\ngroups["admin"].append("alice")  # Tự tạo list rỗng nếu chưa có key`,
    relatedTermIds: ['type-dict', 'stdlib-collections-defaultdict', 'dunder-getitem'],
  },
  {
    id: 'fc-17',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Cấu trúc Dữ liệu & Big-O',
    frontQuestion: 'Tại sao kiểm tra phần tử tồn tại `x in my_set` lại nhanh gấp hàng nghìn lần `x in my_list`, và các toán tử tập hợp của `set` là gì?',
    frontHint: '`O(1)` Hash Lookup vs `O(n)` Linear Scan.',
    backAnswer:
      '`x in my_list` phải quét tuần tự từng phần tử từ đầu đến cuối (`O(n)`). Ngược lại, `set` là bảng băm chỉ chứa các key duy nhất nên `x in my_set` tính `hash(x)` và nhảy thẳng tới ô nhớ trong thời gian hằng số **`O(1)`**. Ngoài ra, `set` hỗ trợ các toán tử tập hợp toán học cực kỳ trực quan: Hợp (`a | b`), Giao (`a & b`), Hiệu (`a - b`), Hiệu đối xứng (`a ^ b`).',
    backAnalogy:
      '`list` là dò từng dòng danh sách viết tay từ trang 1 đến trang 500; `set` là quét mã căn cước công dân hiện ngay kết quả.',
    codeSnippet: `active_ids = {101, 102, 105}\nbanned_ids = {102, 999}\nvalid_ids = active_ids - banned_ids  # {101, 105} (Hiệu 2 tập hợp)`,
    relatedTermIds: ['type-set', 'concept-big-o', 'dunder-hash'],
  },
  {
    id: 'fc-18',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cú pháp Pythonic',
    frontQuestion: 'Cú pháp Slicing `seq[start:stop:step]` hoạt động theo quy tắc biên nào và làm sao để đảo ngược hoặc copy nhanh một danh sách?',
    frontHint: 'Half-open interval `[start, stop)` giống hàm `range()`.',
    backAnswer:
      'Slicing tuân theo khoảng nửa mở **`[start, stop)`** (bao gồm chỉ số `start` nhưng **không bao gồm** `stop`) và không bao giờ ném lỗi `IndexError` kể cả khi `stop` vượt quá độ dài chuỗi/danh sách. Mẹo kinh điển: `seq[::-1]` đảo ngược toàn bộ danh sách/chuỗi (`step = -1`), còn `seq[:]` tạo một bản sao nông (Shallow Copy) mới.',
    backAnalogy:
      'Cắt ổ bánh mì từ vạch dao số 1 đến sát vạch dao số 4 (`seq[1:4]`) sẽ thu được đúng $4 - 1 = 3$ lát bánh (chỉ số 1, 2, 3).',
    codeSnippet: `nums = [10, 20, 30, 40, 50]\nprint(nums[1:4])   # [20, 30, 40]\nprint(nums[::-1])  # [50, 40, 30, 20, 10]`,
    relatedTermIds: ['concept-slicing', 'type-list', 'type-str'],
  },
  {
    id: 'fc-19',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Cú pháp Pythonic',
    frontQuestion: 'Cơ chế Sequence Unpacking và toán tử dấu sao `*` (`first, *middle, last = items`) giúp giải quyết bài toán gì?',
    frontHint: 'Tương đương nhưng mạnh hơn Destructuring `[first, ...rest]` của JavaScript.',
    backAnswer:
      'Sequence Unpacking cho phép bóc tách bất kỳ Iterable nào (`list`, `tuple`, `str`, `Generator`) vào các biến riêng biệt. Đặc biệt, biến có dấu `*` (**Starred Expression**) có thể đặt ở **đầu, giữa hoặc cuối** để gom toàn bộ các phần tử dư còn lại vào một `list`, giúp code cực kỳ sạch sẽ mà không cần tính chỉ số index thủ công.',
    backAnalogy:
      'Chia bài cho người đầu (`first`) và người cuối (`last`), còn bao nhiêu lá ở giữa gom hết vào cọc bài chung (`*middle`).',
    codeSnippet: `scores = [98, 85, 79, 72, 60]\ntop1, *others, lowest = scores\n# top1 = 98, others = [85, 79, 72], lowest = 60`,
    relatedTermIds: ['concept-unpacking', 'type-tuple', 'type-list'],
  },
  {
    id: 'fc-20',
    stageId: 'stage-1',
    level: 'fundamental',
    category: 'Cú pháp & Toán tử',
    frontQuestion: 'Biểu thức so sánh nối chuỗi (Chained Comparison) `0 <= score < 100` có ưu điểm gì so với `score >= 0 and score < 100`?',
    frontHint: 'Độ dễ đọc toán học và số lần đánh giá biểu thức ở giữa.',
    backAnswer:
      'Python cho phép viết chuỗi so sánh liên tiếp `a < x <= b` giống hệt ký hiệu toán học. Không chỉ ngắn gọn hơn `a < x and x <= b`, CPython còn đảm bảo biểu thức ở giữa (`x`) **chỉ được tính toán đúng 1 lần duy nhất** và áp dụng cơ chế Short-circuit (dừng ngay nếu vế đầu sai).',
    backAnalogy:
      'Cân hành lý 1 lần duy nhất rồi kiểm tra xem kim đồng hồ có nằm giữa vạch 7kg và 23kg hay không, thay vì phải bốc vali lên cân 2 lần.',
    codeSnippet: `if 18 <= user.age < 65:\n    print("Trong độ tuổi lao động")`,
    relatedTermIds: ['kw-and', 'concept-chained-comparison'],
  },
  {
    id: 'fc-21',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Cú pháp Pythonic',
    frontQuestion: 'Toán tử Walrus `:=` (Assignment Expression - PEP 572) dùng khi nào và khác gì phép gán `=` thông thường?',
    frontHint: 'Vừa gán giá trị vào biến vừa trả về chính giá trị đó ngay trong biểu thức điều kiện.',
    backAnswer:
      'Phép gán `x = 5` là một câu lệnh (Statement) không trả về giá trị nên không đặt trong `if (...)` hay Comprehension được. Toán tử **Walrus `:=`** là một biểu thức (Expression) vừa gán giá trị cho biến vừa trả về giá trị đó, cực kỳ hữu ích trong `if (m := pattern.search(text)):`, vòng lặp `while (chunk := f.read(4096)):` hoặc tránh gọi hàm đắt đỏ 2 lần trong List Comprehension.',
    backAnalogy:
      'Vừa chụp ảnh món hàng lưu vào hồ sơ (`:=`), vừa nhìn ngay bức ảnh đó để quyết định có duyệt đơn hay không trong cùng 1 thao tác.',
    codeSnippet: `import re\nif (match := re.search(r"(\\d+)px", "width: 120px")) is not None:\n    print(f"Kích thước: {match.group(1)}")`,
    relatedTermIds: ['op-walrus', 'kw-if', 'kw-while'],
  },
  {
    id: 'fc-22',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Luồng Điều khiển',
    frontQuestion: '`match ... case` (Structural Pattern Matching - PEP 634) trong Python 3.10+ mạnh hơn `switch ... case` của C/Java/JS ở điểm nào?',
    frontHint: 'Khớp cấu trúc hình học dữ liệu (Destructuring) + Điều kiện chắn (Guard `if`).',
    backAnswer:
      '`switch-case` truyền thống chỉ so sánh bằng giá trị vô hướng. Ngược lại, `match ... case` của Python đối sánh **cấu trúc hình thái dữ liệu (Structural Destructuring)**: nó có thể đồng thời kiểm tra kiểu dữ liệu, độ dài `list`/`tuple`, sự tồn tại của các key trong `dict` hoặc thuộc tính Object, trích xuất giá trị vào biến và kết hợp điều kiện phụ (`case [x, y] if x > 0:`).',
    backAnalogy:
      '`switch-case` chỉ đọc nhãn tên ngoài hộp, còn `match-case` là máy chụp X-quang khớp đúng hình dáng các món đồ xếp bên trong hộp rồi tự động nhặt ra.',
    codeSnippet: `match event:\n    case {"type": "click", "coords": (x, y)} if x >= 0:\n        print(f"Click hợp lệ tại ({x}, {y})")\n    case {"type": "quit"}:\n        print("Thoát ứng dụng")\n    case _:\n        print("Sự kiện không xác định")`,
    relatedTermIds: ['kw-match', 'kw-case', 'concept-unpacking'],
  },
  {
    id: 'fc-23',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Luồng Điều khiển',
    frontQuestion: 'Khối `else` đi kèm sau vòng lặp `for ... else` hoặc `while ... else` sẽ chạy trong trường hợp nào?',
    frontHint: 'Hãy đọc từ khóa `else` ở đây theo nghĩa là `no_break` (Không gặp lệnh `break`).',
    backAnswer:
      'Khối `else` gắn với vòng lặp `for`/`while` chỉ được thực thi **khi vòng lặp kết thúc tự nhiên (duyệt hết phần tử mà KHÔNG bị ngắt giữa chừng bởi lệnh `break`)**. Nếu trong vòng lặp có chạy lệnh `break` (hoặc `return`/ném Exception), khối `else` sẽ bị bỏ qua. Giúp loại bỏ hoàn toàn các biến cờ tạm `found = False`.',
    backAnalogy:
      'Lục tung cả căn phòng tìm chìa khóa (`for`): nếu tìm thấy thì dừng ngay (`break`), còn lục hết mọi ngăn kéo mà vẫn **không thấy** thì mới gọi thợ khóa (`else`).',
    codeSnippet: `for server in servers:\n    if server.is_healthy():\n        connect(server)\n        break\nelse:\n    raise RuntimeError("Không tìm thấy server nào hoạt động!")`,
    relatedTermIds: ['kw-for', 'kw-else', 'kw-break'],
  },
  {
    id: 'fc-24',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Bẫy Ngôn ngữ (Gotcha #1)',
    frontQuestion: 'Tại sao Mutable Default Arguments (`def fn(items=[]):`) lại gây rò rỉ dữ liệu giữa các lần gọi hàm?',
    frontHint: 'Giá trị mặc định của tham số được khởi tạo ở thời điểm nào (Define-time hay Call-time)?',
    backAnswer:
      'Trong Python, giá trị mặc định của tham số chỉ được khởi tạo **ĐÚNG MỘT LẦN DUY NHẤT** khi trình thông dịch nạp dòng `def` (Define-time) và lưu trong `fn.__defaults__`. Mọi lần gọi hàm không truyền đối số sẽ dùng chung đúng một `list` đó trong bộ nhớ. Cách sửa chuẩn: Đặt mặc định là `None` và khởi tạo `if items is None: items = []` bên trong thân hàm.',
    backAnalogy:
      'Nhà hàng chỉ mua đúng 1 chiếc bát mặc định từ ngày khai trương — khách trước ăn thừa tương ớt, khách sau vào dùng tiếp chính chiếc bát đó!',
    codeSnippet: `def add_tag(tag: str, tags: list[str] | None = None) -> list[str]:\n    if tags is None:\n        tags = []\n    tags.append(tag)\n    return tags`,
    relatedTermIds: ['concept-mutable-default', 'kw-def', 'kw-none'],
  },
  {
    id: 'fc-25',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Sao chép Dữ liệu',
    frontQuestion: 'Khác biệt giữa Shallow Copy (`a.copy()`, `a[:]`) và Deep Copy (`copy.deepcopy(a)`) là gì?',
    frontHint: 'Điều gì xảy ra khi bên trong `list` có chứa các `list` hoặc `dict` con ở tầng thứ 2?',
    backAnswer:
      '**Shallow Copy** (Sao chép nông) chỉ tạo mới lớp vỏ tập hợp ở cấp 1, còn các đối tượng con bên trong vẫn trỏ chung địa chỉ bộ nhớ với bản gốc. Nếu sửa một `list` con ở tầng 2, cả bản sao lẫn bản gốc đều bị thay đổi. **`copy.deepcopy(a)`** đệ quy nhân bản độc lập toàn bộ các đối tượng ở mọi tầng.',
    backAnalogy:
      'Shallow copy là photo tờ danh bạ (vẫn dẫn về cùng những căn nhà chung), còn Deep copy là xây mới toàn bộ cả ngôi nhà lẫn nội thất bên trong.',
    codeSnippet: `import copy\nmatrix = [[1, 2], [3, 4]]\nshallow = matrix.copy()       # shallow[0] is matrix[0] -> True!\ndeep = copy.deepcopy(matrix)  # deep[0] is matrix[0] -> False (An toàn)`,
    relatedTermIds: ['concept-shallow-deep-copy', 'concept-pass-by-object-ref'],
  },
  {
    id: 'fc-26',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Hàm Built-in Pythonic',
    frontQuestion: 'Tại sao nên dùng `enumerate(items)` thay cho `range(len(items))` và tham số `strict=True` trong `zip(a, b, strict=True)` quan trọng thế nào?',
    frontHint: 'Tránh lỗi lệch độ dài âm thầm (Silent data truncation) khi ghép 2 danh sách.',
    backAnswer:
      '`enumerate(items, start=0)` trả về trực tiếp cặp `(index, value)` sạch đẹp mà không cần truy cập `items[i]` thủ công. Hàm `zip(a, b)` ghép song song các phần tử từ nhiều Iterable nhưng mặc định sẽ **cắt cụt theo danh sách ngắn nhất** mà không báo lỗi. Trong Python 3.10+, luôn bật **`zip(a, b, strict=True)`** để ném `ValueError` ngay nếu 2 danh sách bị lệch độ dài.',
    backAnalogy:
      '`zip` mặc định giống như đóng cặp giày trái-phải mà thừa ra 1 chiếc giày lẻ thì lẳng lặng vứt đi; `strict=True` sẽ báo động ngay khi số giày hai bên không khớp.',
    codeSnippet: `names = ["Alice", "Bob"]\nscores = [95, 88]\nfor idx, (name, score) in enumerate(zip(names, scores, strict=True), start=1):\n    print(f"#{idx}: {name} = {score}")`,
    relatedTermIds: ['builtin-enumerate', 'builtin-zip', 'kw-for'],
  },
  {
    id: 'fc-27',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Hàm Built-in Pythonic',
    frontQuestion: 'Cặp hàm `any()` và `all()` kết hợp với Generator Expression tối ưu hiệu năng kiểm tra điều kiện như thế nào?',
    frontHint: 'Cơ chế đánh giá ngắn mạch (Short-circuit Evaluation) + `O(1)` RAM.',
    backAnswer:
      '`any(iterable)` trả về `True` ngay khi gặp phần tử Truthy **đầu tiên** (dừng kiểm tra phần còn lại). `all(iterable)` trả về `False` ngay khi gặp phần tử Falsy **đầu tiên**. Khi truyền một Generator Expression vào `any(x > 100 for x in data)`, Python vừa không tốn RAM tạo `list` trung gian vừa dừng sớm ngay khi có kết quả.',
    backAnalogy:
      '`any()` là tìm xem trong phòng có ai biết tiếng Nhật không (hỏi trúng 1 người biết là dừng ngay); `all()` là kiểm tra xem cả đoàn đã có mặt đủ chưa (thấy 1 ghế trống là kết luận thiếu ngay).',
    codeSnippet: `passwords = ["secret123", "admin", "p@ssw0rd99"]\nhas_weak_pwd = any(len(p) < 8 for p in passwords)  # True (Dừng ngay ở 'admin')`,
    relatedTermIds: ['builtin-any-all', 'concept-generator'],
  },
  {
    id: 'fc-28',
    stageId: 'stage-1',
    level: 'basic',
    category: 'Quản lý Tài nguyên & File I/O',
    frontQuestion: 'Tại sao thao tác đọc/ghi file bắt buộc phải dùng khối `with` (Context Manager) kết hợp `pathlib.Path` thay vì gọi `f = open(...)` rời rạc?',
    frontHint: 'Giao thức `__enter__` / `__exit__` chống rò rỉ File Descriptor khi xảy ra Exception.',
    backAnswer:
      'Nếu mở file không dùng `with`, khi có Exception xảy ra trước dòng `f.close()`, File Descriptor của hệ điều hành sẽ bị rò rỉ (treo khóa file). Câu lệnh `with` kích hoạt **Context Manager Protocol** (`__enter__` và `__exit__`), đảm bảo file luôn được đóng an toàn ngay khi ra khỏi khối lệnh dù thành công hay lỗi. Kết hợp với `pathlib.Path` giúp nối đường dẫn đa nền tảng bằng toán tử `/`.',
    backAnalogy:
      'Cửa phòng thí nghiệm tự động đóng sập và khóa chốt (`__exit__`) ngay khi bạn bước ra ngoài, kể cả khi bạn vội chạy thoát hiểm.',
    codeSnippet: `from pathlib import Path\nconfig_path = Path("configs") / "settings.json"\nwith config_path.open("r", encoding="utf-8") as f:\n    data = f.read()`,
    relatedTermIds: ['kw-with', 'concept-context-manager', 'stdlib-pathlib'],
  },

  // ============================================================================
  // STAGE 2: PYTHONIC IDIOMS, HÀM NÂNG CAO, OOP & TYPE SYSTEM (22 CARDS: fc-29 -> fc-50)
  // ============================================================================
  {
    id: 'fc-29',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Pythonic Comprehensions',
    frontQuestion: 'Tại sao List/Dict/Set Comprehension được ưa chuộng và chạy nhanh hơn vòng lặp `for` truyền thống kèm `.append()` hoặc `map()`/`filter()`?',
    frontHint: 'Chỉ thị Bytecode chuyên biệt `LIST_APPEND` ở tầng C.',
    backAnswer:
      'List Comprehension `[expr for x in seq if cond]` không chỉ cô đọng, dễ đọc hơn `map(lambda..., filter(lambda...))` mà còn **nhanh hơn vòng lặp `for` + `res.append()` khoảng 20%–35%**. Lý do: CPython biên dịch Comprehension thành chỉ thị bytecode `LIST_APPEND` chuyên biệt chạy trực tiếp trong C mà không tốn chi phí tra cứu phương thức `.append` (Method Lookup) ở mỗi vòng lặp.',
    backAnalogy:
      '`for` + `append` là gắp từng viên gạch bỏ vào xe rùa, còn Comprehension là dây chuyền băng tải đúc gạch liên hoàn.',
    codeSnippet: `# Vừa lọc vừa biến đổi thành Dict trong 1 dòng chuẩn Pythonic:\nuser_map = {u.id: u.email.lower() for u in users if u.is_active}`,
    relatedTermIds: ['concept-comprehension', 'concept-bytecode', 'type-list'],
  },
  {
    id: 'fc-30',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Generators & Iterators',
    frontQuestion: 'Khác biệt giữa List Comprehension `[x*x for x in range(N)]` và Generator Expression `(x*x for x in range(N))` là gì?',
    frontHint: 'Ngoặc vuông `[]` (Eager - Tốn `O(N)` RAM) vs Ngoặc tròn `()` (Lazy - Tốn `O(1)` RAM).',
    backAnswer:
      'List Comprehension (`[...]`) tính toán ngay lập tức và cấp phát toàn bộ $N$ phần tử vào RAM (**Eager Evaluation**, tốn `O(N)` bộ nhớ). Generator Expression (`(...)`) chỉ trả về một đối tượng **Generator** lười biếng (**Lazy Evaluation**, chỉ tốn ~200 bytes RAM `O(1)`), sinh từng phần tử một khi được tiêu thụ bởi `sum()`, `max()`, hoặc vòng lặp `for`.',
    backAnalogy:
      'List Comprehension là in sẵn 1 triệu tờ rơi chất đầy kho; Generator Expression là máy in chỉ in đúng 1 tờ mỗi khi có khách đưa tay nhận.',
    codeSnippet: `# Chỉ tốn ~200 bytes RAM thay vì ~800 MB RAM:\ntotal = sum(x * x for x in range(100_000_000))`,
    relatedTermIds: ['concept-generator', 'concept-comprehension', 'kw-yield'],
  },
  {
    id: 'fc-31',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Generators & Iterators',
    frontQuestion: 'Giao thức Iterator (Iterator Protocol) trong Python gồm 2 phương thức Dunder nào và sự khác biệt giữa **Iterable** và **Iterator** là gì?',
    frontHint: '`__iter__()` vs `__next__()` + ngoại lệ `StopIteration`.',
    backAnswer:
      '**Iterable** (như `list`, `dict`, `str`) là đối tượng có phương thức `__iter__()` trả về một Iterator mới, có thể duyệt đi duyệt lại nhiều lần. **Iterator** là đối tượng lưu trạng thái con trỏ duyệt, cài đặt cả `__iter__()` (trả về chính `self`) và **`__next__()`** (trả về phần tử tiếp theo hoặc ném **`StopIteration`** khi hết dữ liệu). Vòng lặp `for` thực chất gọi `iter(obj)` rồi gọi `next()` liên tục cho đến khi bắt được `StopIteration`.',
    backAnalogy:
      '**Iterable** là cuốn sách trên kệ (nhiều người đọc lại được), còn **Iterator** là chiếc thẻ đánh dấu trang đang kẹp dở (đọc đến trang cuối là hết).',
    codeSnippet: `items = [10, 20]\nit = iter(items)       # Gọi items.__iter__()\nprint(next(it))        # 10 (Gọi it.__next__())\nprint(next(it))        # 20\n# next(it) tiếp theo sẽ ném StopIteration`,
    relatedTermIds: ['dunder-iter', 'concept-iterator', 'kw-for'],
  },
  {
    id: 'fc-32',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Generators & Iterators',
    frontQuestion: 'Hàm Generator (`yield` / `yield from`) hoạt động thế nào và tại sao cần cẩn thận với bẫy "Cạn kiệt sau 1 lần duyệt" (Single-pass Exhaustion)?',
    frontHint: 'Đóng băng Stack Frame tại `yield` và điều gì xảy ra khi duyệt Generator lần thứ 2.',
    backAnswer:
      'Khi hàm có chứa `yield`, gọi hàm không chạy code ngay mà trả về một **Generator Iterator**. Mỗi lần `next()` được gọi, hàm chạy đến `yield`, trả giá trị ra ngoài và **đóng băng toàn bộ biến cục bộ + con trỏ lệnh** cho lần gọi kế tiếp. `yield from sub_gen` giúp ủy quyền trực tiếp cho một generator con. **Cảnh báo**: Vì Generator chính là một Iterator, sau khi duyệt hết 1 lần (ví dụ `list(gen)`), lần duyệt thứ 2 trên cùng `gen` đó sẽ **rỗng hoàn toàn** mà không báo lỗi!',
    backAnalogy:
      'Ống kem đánh răng (`Generator`) bóp ra từng chút một (`yield`), nhưng một khi đã bóp cạn ống thì lần sau bóp tiếp sẽ không còn gì chảy ra nữa.',
    codeSnippet: `def read_chunks(lines: list[str]):\n    for line in lines:\n        yield line.strip()\n\ngen = read_chunks([" a ", " b "])\nprint(list(gen))  # ['a', 'b']\nprint(list(gen))  # [] -> ĐÃ CẠN KIỆT!`,
    relatedTermIds: ['kw-yield', 'concept-generator', 'dunder-iter'],
  },
  {
    id: 'fc-33',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Closures & Phạm vi Biến',
    frontQuestion: 'Tại sao `[lambda: i for i in range(3)]` lại tạo ra 3 hàm đều trả về số `2` (Late-Binding Closure Trap) và cách khắc phục là gì?',
    frontHint: 'Closure trong Python bắt biến theo tham chiếu (By Reference) lúc gọi hàm hay theo giá trị lúc định nghĩa?',
    backAnswer:
      'Closure trong Python tra cứu biến tự do (`i`) theo **tham chiếu ở thời điểm hàm được GỌI (Late Binding)** chứ không đóng băng giá trị lúc hàm được tạo. Khi vòng lặp kết thúc, biến `i` mang giá trị cuối cùng là `2`, nên cả 3 hàm `lambda` cùng đọc `i = 2`. Cách khắc phục: Bắt giá trị ngay lúc định nghĩa bằng tham số mặc định **`[lambda i=i: i for i in range(3)]`** hoặc dùng `functools.partial`.',
    backAnalogy:
      '3 tờ giấy ghi chú cùng viết "Xem giá vàng trên bảng điện tử (`i`)" — đến chiều tối mới đọc thì cả 3 người đều thấy mức giá cuối ngày.',
    codeSnippet: `# SAI: fns = [lambda: i for i in range(3)] -> [2, 2, 2]\n# ĐÚNG (Bắt giá trị vào default argument ngay lập tức):\nfns = [lambda i=i: i for i in range(3)]\nprint([fn() for fn in fns])  # [0, 1, 2]`,
    relatedTermIds: ['concept-closure', 'kw-lambda', 'concept-mutable-default'],
  },
  {
    id: 'fc-34',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Closures & Phạm vi Biến',
    frontQuestion: 'Quy tắc phân giải tên biến **LEGB** trong Python là gì và khi nào cần dùng từ khóa `nonlocal` vs `global`?',
    frontHint: 'Local -> Enclosing -> Global -> Built-in.',
    backAnswer:
      'Python tìm kiếm tên biến theo thứ tự 4 tầng **LEGB**: (1) **Local** (trong hàm hiện tại); (2) **Enclosing** (trong hàm bao ngoài của Closure); (3) **Global** (cấp module `.py`); (4) **Built-in** (`len`, `print`, `Exception`). Mặc định, phép gán `count += 1` trong hàm con sẽ tạo biến Local mới gây lỗi `UnboundLocalError`. Phải khai báo **`nonlocal count`** để sửa biến của hàm bao ngoài (Enclosing), hoặc **`global count`** để sửa biến cấp module.',
    backAnalogy:
      'Tìm đồ trong túi áo mình (Local) -> tìm trong phòng làm việc (Enclosing) -> tìm ở sảnh tòa nhà (Global) -> tìm ngoài siêu thị công cộng (Built-in).',
    codeSnippet: `def make_counter():\n    count = 0\n    def inc() -> int:\n        nonlocal count  # Cho phép gán lại biến 'count' của make_counter\n        count += 1\n        return count\n    return inc`,
    relatedTermIds: ['concept-legb', 'kw-nonlocal', 'kw-global', 'concept-closure'],
  },
  {
    id: 'fc-35',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Decorators & Metaprogramming',
    frontQuestion: 'Decorator hoạt động như thế nào dưới tầng Closure và tại sao bắt buộc phải gắn `@functools.wraps(func)` lên hàm `wrapper`?',
    frontHint: 'Điều gì xảy ra với `func.__name__`, `__doc__` và Type Hints của FastAPI nếu thiếu `@wraps`?',
    backAnswer:
      'Cú pháp `@my_dec` tương đương `fn = my_dec(fn)`: nó truyền hàm gốc `fn` vào Decorator và thay thế bằng hàm `wrapper` bên trong. Nếu không dùng **`@functools.wraps(func)`**, hàm sau khi bọc sẽ bị mất sạch tên gốc (`__name__` biến thành `"wrapper"`), mất Docstring (`__doc__`), mất chữ ký Type Hints (`__annotations__`) và mất con trỏ hàm gốc (`__wrapped__`), làm hỏng tính năng Dependency Injection và sinh tài liệu Swagger của FastAPI/Pytest.',
    backAnalogy:
      'Bọc hộp quà bằng lớp giấy bảo vệ thông minh (`wrapper`) nhưng phải dán lại đúng chiếc nhãn tên và bảng thành phần của món quà gốc (`@wraps`) ra bên ngoài.',
    codeSnippet: `from functools import wraps\nfrom typing import Callable\n\ndef log_call[**P, R](func: Callable[P, R]) -> Callable[P, R]:\n    @wraps(func)\n    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:\n        return func(*args, **kwargs)\n    return wrapper`,
    relatedTermIds: ['concept-decorator', 'concept-closure', 'eco-fastapi'],
  },
  {
    id: 'fc-36',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Decorators & Metaprogramming',
    frontQuestion: 'Tại sao một Decorator có nhận tham số cấu hình (ví dụ `@retry(max_attempts=3)`) lại cần cấu trúc 3 tầng hàm lồng nhau?',
    frontHint: 'Tầng 1 nhận cấu hình (Decorator Factory) -> Tầng 2 nhận `func` -> Tầng 3 nhận `*args, **kwargs`.',
    backAnswer:
      'Khi viết `@retry(max_attempts=3)`, Python **gọi hàm `retry(3)` trước** rồi lấy kết quả trả về làm Decorator thực sự để bọc hàm bên dưới. Do đó cần 3 tầng: (1) **Factory (`retry`)**: nhận tham số cấu hình `max_attempts`; (2) **Decorator (`decorator`)**: nhận hàm gốc `func`; (3) **Wrapper (`wrapper`)**: nhận `*args, **kwargs` mỗi khi hàm được gọi lúc Runtime.',
    backAnalogy:
      'Tầng 1 là đặt thông số cho máy đóng gói (chọn độ dày màng bọc = 3mm) -> Máy xuất ra khuôn bọc (Tầng 2) -> Khuôn bọc ôm lấy sản phẩm (Tầng 3).',
    codeSnippet: `from functools import wraps\n\ndef retry(max_attempts: int = 3):\n    def decorator(func):\n        @wraps(func)\n        def wrapper(*args, **kwargs):\n            for attempt in range(1, max_attempts + 1):\n                try:\n                    return func(*args, **kwargs)\n                except Exception:\n                    if attempt == max_attempts:\n                        raise\n        return wrapper\n    return decorator`,
    relatedTermIds: ['concept-decorator', 'concept-closure'],
  },
  {
    id: 'fc-37',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Quản lý Tài nguyên',
    frontQuestion: 'Làm thế nào để tự viết một Context Manager dùng với từ khóa `with` nhanh nhất bằng `@contextlib.contextmanager`?',
    frontHint: 'Kết hợp Generator `yield` với khối `try ... finally`.',
    backAnswer:
      'Thay vì phải viết một class đầy đủ có `__enter__` và `__exit__`, bạn chỉ cần gắn `@contextlib.contextmanager` lên một hàm Generator: phần code **trước `yield`** đóng vai trò `__enter__`, giá trị được `yield` sẽ gán vào biến sau `as`, và phần code sau `yield` (bắt buộc bọc trong khối **`try ... finally`**) đóng vai trò `__exit__` để dọn dẹp tài nguyên an toàn kể cả khi có Exception bên trong khối `with`.',
    backAnalogy:
      '`yield` là cánh cửa ngăn cách: chuẩn bị phòng trước khi khách vào (`trước yield`), nhường phòng cho khách làm việc (`yield`), và luôn dọn phòng khi khách rời đi (`finally`).',
    codeSnippet: `from contextlib import contextmanager\nimport time\n\n@contextmanager\ndef timer(label: str):\n    start = time.perf_counter()\n    try:\n        yield\n    finally:\n        print(f"{label}: {time.perf_counter() - start:.4f}s")`,
    relatedTermIds: ['concept-context-manager', 'kw-with', 'kw-yield'],
  },
  {
    id: 'fc-38',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Lập trình Hướng đối tượng (OOP)',
    frontQuestion: 'Tại sao Python bắt buộc phải khai báo tham số `self` tường minh ở đầu mỗi Instance Method thay vì ẩn đi như `this` trong Java/C#/JS?',
    frontHint: 'Triết lý "Explicit is better than implicit" và cách CPython chuyển đổi `instance.method(arg)` thành `Class.method(instance, arg)`.',
    backAnswer:
      'Khi bạn gọi `user.greet("Hi")`, CPython thực chất dịch ngầm thành lời gọi hàm trên lớp: **`User.greet(user, "Hi")`** — truyền chính đối tượng `user` vào làm đối số đầu tiên. Nhờ khai báo `self` tường minh, không có sự nhập nhằng giữa biến cục bộ trong hàm và thuộc tính của đối tượng (`self.name`), đồng thời giúp `self` không bị biến thành hành vi kỳ dị phụ thuộc ngữ cảnh gọi như `this` của JavaScript.',
    backAnalogy:
      'Thay vì xưng "tôi" mập mờ qua điện thoại, nhân viên luôn đọc rõ mã định danh của chính mình (`self`) ở đầu mỗi câu giao dịch.',
    codeSnippet: `class Account:\n    def __init__(self, balance: int) -> None:\n        self.balance = balance\n\nacc = Account(100)\n# acc.deposit(50) thực chất là Account.deposit(acc, 50)`,
    relatedTermIds: ['kw-class', 'dunder-init'],
  },
  {
    id: 'fc-39',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Dunder Methods & Data Model',
    frontQuestion: 'Sự khác biệt thực sự giữa `__new__(cls, ...)` và `__init__(self, ...)` trong vòng đời khởi tạo Object là gì?',
    frontHint: 'Ai là người cấp phát vùng nhớ tạo ra `self` và ai là người gán thuộc tính cho `self`?',
    backAnswer:
      '**`__new__(cls, ...)`** mới là **Constructor thực sự**: nó là một static/class-level method chạy TRƯỚC, chịu trách nhiệm cấp phát bộ nhớ và **trả về instance mới (`self`)**. Sau đó, **`__init__(self, ...)`** (Initializer) mới nhận `self` từ `__new__` để gán các thuộc tính ban đầu và không trả về gì (`None`). Bạn chỉ cần ghi đè `__new__` khi thiết kế **Singleton Pattern** hoặc kế thừa các kiểu bất biến (`int`, `str`, `tuple`).',
    backAnalogy:
      '`__new__` là nhà máy đúc ra khung xe ô tô thô rồi bàn giao cho xưởng sơn nội thất `__init__` trang trí màu ghế và lắp biển số.',
    codeSnippet: `class Singleton:\n    _instance = None\n    def __new__(cls):\n        if cls._instance is None:\n            cls._instance = super().__new__(cls)\n        return cls._instance`,
    relatedTermIds: ['dunder-init', 'kw-class'],
  },
  {
    id: 'fc-40',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Dunder Methods & Data Model',
    frontQuestion: 'Khác biệt giữa `__repr__` và `__str__` là gì, và nếu chỉ được cài đặt 1 trong 2 thì nên chọn phương thức nào?',
    frontHint: 'Dành cho Lập trình viên (Debug/Logs) vs Dành cho Người dùng cuối (`print()`).',
    backAnswer:
      '**`__repr__`** tạo chuỗi biểu diễn **rõ ràng, không nhập nhằng dành cho Developer** để debug và ghi log (ví dụ `User(id=1, role="admin")`). **`__str__`** tạo chuỗi hiển thị thân thiện cho người dùng cuối khi gọi `print(obj)` hoặc `f"{obj}"`. **Quy tắc vàng**: Nếu chỉ viết 1 hàm, hãy luôn viết **`__repr__`** — vì nếu thiếu `__str__`, Python sẽ tự động dùng `__repr__` làm phương án dự phòng (fallback)!',
    backAnalogy:
      '`__str__` là tên món ăn mỹ miều trên thực đơn ("Phở Bò Đặc Biệt"), còn `__repr__` là công thức kỹ thuật chi tiết cho đầu bếp (`Pho(beef_grams=150, broth_temp=95)`).',
    codeSnippet: `class Point:\n    def __init__(self, x: int, y: int) -> None:\n        self.x, self.y = x, y\n    def __repr__(self) -> str:\n        return f"Point(x={self.x!r}, y={self.y!r})"`,
    relatedTermIds: ['dunder-repr', 'dunder-init'],
  },
  {
    id: 'fc-41',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Dunder Methods & Data Model',
    frontQuestion: 'Tại sao khi bạn tự định nghĩa `__eq__` cho một Class thì đối tượng của Class đó lập tức không thể bỏ vào `set` hay làm key cho `dict` nữa?',
    frontHint: 'Hợp đồng bất biến giữa `__eq__` và `__hash__` trong Python Data Model.',
    backAnswer:
      'Theo hợp đồng bảng băm: nếu `a == b` là `True` thì bắt buộc `hash(a) == hash(b)`. Khi bạn ghi đè `__eq__` mà không định nghĩa `__hash__`, Python tự động gán **`__hash__ = None`** để ngăn lỗi hỏng cấu trúc bảng băm nếu đối tượng bị sửa đổi. Để đối tượng vừa so sánh bằng giá trị vừa làm key `dict`/`set` được, lớp đó phải **bất biến (Immutable)** và cài đặt `__hash__` dựa trên tuple các thuộc tính (hoặc dùng `@dataclass(frozen=True)`).',
    backAnalogy:
      'Nếu bạn đổi quy tắc nhận diện khuôn mặt (`__eq__`) mà không cập nhật lại hệ thống cấp mã số căn cước (`__hash__`), cục lưu trữ sẽ từ chối xếp hồ sơ vào tủ.',
    codeSnippet: `class UserId:\n    def __init__(self, value: int) -> None:\n        self._val = value\n    def __eq__(self, other: object) -> bool:\n        return isinstance(other, UserId) and self._val == other._val\n    def __hash__(self) -> int:\n        return hash(self._val)`,
    relatedTermIds: ['dunder-eq', 'dunder-hash', 'type-set', 'type-dict'],
  },
  {
    id: 'fc-42',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Dunder Methods & Data Model',
    frontQuestion: 'Phương thức `__call__` giúp biến một Object thành cái gì và ứng dụng thực tế của nó trong kiến trúc phần mềm là gì?',
    frontHint: 'Stateful Callable / Class-based Decorator / FastAPI Parameterized Dependency.',
    backAnswer:
      'Cài đặt `__call__(self, *args, **kwargs)` cho phép một **Instance của Class có thể được gọi trực tiếp như một hàm (`obj()`)**. Nó cực kỳ hữu ích khi bạn cần một hàm có khả năng **lưu giữ trạng thái nội bộ hoặc cấu hình (Stateful Callable)** — ví dụ: Class-based Decorator, bộ kiểm tra quyền `RoleChecker(["admin"])` truyền vào `Depends()` của FastAPI, hoặc các lớp `nn.Module` trong PyTorch.',
    backAnalogy:
      'Một chiếc máy pha cà phê (`Object` có sẵn bình nước và hạt cà phê bên trong) mà bạn chỉ cần bấm nút chạy như một hành động (`machine("espresso")`).',
    codeSnippet: `class RoleChecker:\n    def __init__(self, allowed_roles: list[str]) -> None:\n        self.allowed_roles = allowed_roles\n    def __call__(self, user_role: str) -> bool:\n        return user_role in self.allowed_roles\n\nis_admin = RoleChecker(["admin", "superadmin"])\nprint(is_admin("admin"))  # True (Gọi object như gọi hàm!)`,
    relatedTermIds: ['dunder-call', 'eco-fastapi', 'concept-decorator'],
  },
  {
    id: 'fc-43',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Tối ưu Bộ nhớ & OOP',
    frontQuestion: 'Khai báo `__slots__` trong Class hoạt động như thế nào để giảm 40%–60% dung lượng RAM khi khởi tạo hàng triệu đối tượng?',
    frontHint: 'Thay thế từ điển động `self.__dict__` trên từng instance bằng mảng C cố định (Fixed-size C Struct).',
    backAnswer:
      'Mặc định, mỗi instance của một Class lưu trữ thuộc tính trong một bảng băm riêng gọi là `self.__dict__` — rất linh hoạt nhưng ngốn nhiều RAM (~100+ bytes overhead mỗi object). Khi khai báo **`__slots__ = ("x", "y")`** (hoặc `@dataclass(slots=True)`), CPython loại bỏ hoàn toàn `__dict__` và cấp phát một mảng con trỏ C kích thước cố định cho từng instance, giúp **tiết kiệm 40%–60% RAM** và tăng tốc độ đọc/ghi thuộc tính thêm ~20%.',
    backAnalogy:
      'Thay vì phát cho mỗi hành khách một chiếc tủ nhiều ngăn rỗng cồng kềnh (`__dict__`), hãng bay thiết kế khay nhựa đúc sẵn vừa khít đúng 2 ô để bình nước và hộ chiếu (`__slots__`).',
    codeSnippet: `class Pixel:\n    __slots__ = ("x", "y", "color")\n    def __init__(self, x: int, y: int, color: str) -> None:\n        self.x, self.y, self.color = x, y, color`,
    relatedTermIds: ['dunder-slots', 'concept-dataclass', 'concept-cpython'],
  },
  {
    id: 'fc-44',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Lập trình Hướng đối tượng (OOP)',
    frontQuestion: 'Tại sao trong Python không viết các hàm `get_age()` / `set_age()` kiểu Java mà dùng Decorator `@property`?',
    frontHint: 'Giữ nguyên giao diện truy cập thuộc tính `user.age` nhưng vẫn chèn được logic kiểm tra hợp lệ (Validation) hoặc tính toán động.',
    backAnswer:
      'Trong Python, bạn bắt đầu với thuộc tính công khai đơn giản (`user.age`). Khi sau này cần thêm kiểm tra hợp lệ hoặc tính toán tự động, bạn gắn **`@property`** và **`@age.setter`**. Nhờ Descriptor Protocol bên dưới, code bên ngoài vẫn đọc/gán tự nhiên bằng cú pháp `user.age = 25` mà **không làm gãy API (Zero Breaking Changes)** của toàn bộ dự án.',
    backAnalogy:
      'Vẫn là núm vặn cửa quen thuộc (`user.age = 25`), nhưng bên trong ổ khóa đã được nâng cấp thêm cảm biến vân tay kiểm tra an ninh (`@age.setter`).',
    codeSnippet: `class Product:\n    def __init__(self, price: float) -> None:\n        self._price = price\n    @property\n    def price(self) -> float:\n        return self._price\n    @price.setter\n    def price(self, val: float) -> None:\n        if val < 0:\n            raise ValueError("Giá không được âm")\n        self._price = val`,
    relatedTermIds: ['concept-property', 'concept-decorator', 'kw-class'],
  },
  {
    id: 'fc-45',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Lập trình Hướng đối tượng (OOP)',
    frontQuestion: 'Phân biệt `@classmethod` (nhận `cls`) và `@staticmethod` (không nhận `self` hay `cls`) — khi nào dùng cái nào?',
    frontHint: 'Alternative Constructors (Factory Methods) hỗ trợ kế thừa vs Hàm tiện ích thuần túy.',
    backAnswer:
      '**`@classmethod`** nhận tham số đầu tiên là chính lớp đang gọi (`cls`), cực kỳ mạnh để tạo các **Alternative Constructors (Factory Methods)** như `User.from_json(data)` hoặc `Date.today()` — nếu lớp con `AdminUser` kế thừa và gọi `AdminUser.from_json()`, `cls` sẽ tự động tạo ra đúng instance của `AdminUser`. **`@staticmethod`** chỉ là một hàm bình thường đặt vào bên trong namespace của Class cho gọn, không truy cập được `self` hay `cls`.',
    backAnalogy:
      '`@classmethod` là dây chuyền lắp ráp thông minh biết tự nhìn bản vẽ của chi nhánh hiện tại (`cls`) để xuất xưởng; `@staticmethod` là bảng quy đổi đơn vị treo trên tường nhà máy.',
    codeSnippet: `class User:\n    def __init__(self, name: str) -> None:\n        self.name = name\n    @classmethod\n    def from_email(cls, email: str) -> "User":\n        return cls(name=email.split("@")[0])  # Tự tương thích với mọi Subclass`,
    relatedTermIds: ['concept-classmethod', 'kw-class', 'dunder-init'],
  },
  {
    id: 'fc-46',
    stageId: 'stage-2',
    level: 'advanced',
    category: '8 Câu hỏi Chuyên sâu Giai đoạn 2',
    frontQuestion: 'Thuật toán C3 Linearization trong MRO (Method Resolution Order) giải quyết bài toán đa kế thừa kim cương (Diamond Problem) và hàm `super()` hoạt động thế nào?',
    frontHint: '`super()` không gọi "Lớp Cha trực tiếp" mà gọi "Lớp tiếp theo trong chuỗi `__mro__`".',
    backAnswer:
      'C3 Linearization phẳng hóa đồ thị đa kế thừa thành một danh sách tuyến tính `Class.__mro__` đảm bảo 3 nguyên tắc: (1) Lớp con luôn đứng trước lớp cha; (2) Giữ nguyên thứ tự khai báo từ trái sang phải `class D(B, C)`; (3) Lớp gốc chung chỉ được gọi đúng 1 lần sau cùng. Đặc biệt, **`super()`** tìm phương thức ở **lớp đứng kế tiếp trong danh sách `__mro__`** của đối tượng hiện tại (chứ không phải lớp cha cố định), giúp các lớp Mixin phối hợp nhịp nhàng.',
    backAnalogy:
      'Hỏi bản thân (`D`) -> hỏi Bố bên trái (`B`) -> hỏi Mẹ bên phải (`C`) -> cuối cùng mới hỏi Ông Bà (`A`) đúng 1 lần duy nhất.',
    codeSnippet: `class A: pass\nclass B(A): pass\nclass C(A): pass\nclass D(B, C): pass\nprint(D.__mro__)\n# (<class 'D'>, <class 'B'>, <class 'C'>, <class 'A'>, <class 'object'>)`,
    relatedTermIds: ['concept-mro', 'dunder-init', 'kw-class'],
  },
  {
    id: 'fc-47',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Kiến trúc OOP & Đa hình',
    frontQuestion: 'Abstract Base Classes (`abc.ABC` và `@abstractmethod`) bảo vệ hợp đồng giao diện ở thời điểm nào?',
    frontHint: 'Bắt lỗi ngay lúc khởi tạo đối tượng (`Instantiation-time`) hay đợi đến khi gọi hàm?',
    backAnswer:
      'Nếu chỉ viết `def pay(self): raise NotImplementedError`, lớp con quên cài đặt hàm `pay()` vẫn khởi tạo `obj = SubClass()` bình thường và chỉ nổ lỗi khi luồng chạy thực sự gọi tới `obj.pay()`. Ngược lại, khi kế thừa **`abc.ABC`** và đánh dấu **`@abstractmethod`**, Python sẽ chặn đứng và ném `TypeError: Can\'t instantiate abstract class` **ngay tại thời điểm khởi tạo `SubClass()`** nếu thiếu bất kỳ phương thức trừu tượng nào.',
    backAnalogy:
      'Kiểm định an toàn bay ngay tại cổng nhà chứa máy bay (`abc.ABC` chặn cất cánh nếu thiếu phanh), thay vì bay lên trời rồi lúc đạp phanh mới phát hiện chưa lắp (`NotImplementedError`).',
    codeSnippet: `from abc import ABC, abstractmethod\n\nclass PaymentGateway(ABC):\n    @abstractmethod\n    def charge(self, amount: int) -> bool: ...\n\n# StripeGateway() sẽ báo TypeError ngay nếu chưa cài đặt hàm charge()`,
    relatedTermIds: ['stdlib-abc', 'concept-protocol', 'kw-class'],
  },
  {
    id: 'fc-48',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Hệ thống Kiểu & Kiến trúc',
    frontQuestion: 'Sự khác biệt kiến trúc giữa `typing.Protocol` (Structural Subtyping) và `abc.ABC` (Nominal Subtyping) là gì?',
    frontHint: 'Static Duck Typing giống hệt `interface` của TypeScript và Go!',
    backAnswer:
      '**`abc.ABC` (Nominal Subtyping)** bắt buộc lớp con phải kế thừa tường minh `class Stripe(PaymentABC):`. Ngược lại, **`typing.Protocol` (Structural Subtyping / Static Duck Typing)** kiểm tra dựa trên **hình thái phương thức**: bất kỳ class nào (kể cả từ thư viện bên thứ 3 mà bạn không sửa code được) chỉ cần có hàm khớp chữ ký `def charge(self, amount: int) -> bool` đều được `Pyright`/`mypy` công nhận là thỏa mãn `Protocol` mà **không cần kế thừa**!',
    backAnalogy:
      '`ABC` đòi xem giấy chứng nhận tốt nghiệp đúng trường (`inherits`), còn `Protocol` là kiểm tra tay nghề: "Hễ bơi được và kêu quạc quạc như vịt thì chính là vịt" (Duck Typing có kiểm tra kiểu tĩnh).',
    codeSnippet: `from typing import Protocol\n\nclass Renderable(Protocol):\n    def render(self) -> str: ...\n\nclass HtmlWidget:  # Không cần kế thừa Renderable!\n    def render(self) -> str:\n        return "<div/>"\n\ndef show(item: Renderable) -> None:  # Pyright chấp nhận HtmlWidget!\n    print(item.render())`,
    relatedTermIds: ['concept-protocol', 'stdlib-abc', 'tool-pyright'],
  },
  {
    id: 'fc-49',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Data Classes & Modeling',
    frontQuestion: 'Bộ tham số vàng `@dataclass(slots=True, frozen=True, kw_only=True)` và `field(default_factory=list)` giải quyết những vấn đề gì?',
    frontHint: 'Tự sinh `__init__`, `__repr__`, `__eq__` + Bất biến + Tiết kiệm RAM + Chống lỗi Mutable Default.',
    backAnswer:
      '`@dataclass` tự động sinh `__init__`, `__repr__`, `__eq__`. Kết hợp: **`slots=True`** giảm ~50% RAM; **`frozen=True`** biến Object thành bất biến (Immutable) và tự sinh `__hash__` an toàn; **`kw_only=True`** bắt buộc truyền tên tham số `Order(id=1, items=[])` chống nhầm thứ tự. Đặc biệt, `@dataclass` **cấm viết `items: list[str] = []`** (ném `ValueError` ngay để bảo vệ bạn khỏi bẫy Mutable Default) và bắt buộc dùng **`field(default_factory=list)`**.',
    backAnalogy:
      'Bản thiết kế khuôn đúc tự động vừa khóa chống sửa đổi (`frozen`), vừa ép gọn kích thước (`slots`), vừa phát cho mỗi sản phẩm một giỏ hàng mới tinh (`default_factory`).',
    codeSnippet: `from dataclasses import dataclass, field\n\n@dataclass(slots=True, frozen=True, kw_only=True)\nclass Order:\n    order_id: int\n    tags: list[str] = field(default_factory=list)`,
    relatedTermIds: ['concept-dataclass', 'dunder-slots', 'concept-mutable-default'],
  },
  {
    id: 'fc-50',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Hệ thống Kiểu Hiện đại (Python 3.12+)',
    frontQuestion: 'Cú pháp Type Hints hiện đại trong Python 3.10–3.12+ đã thay đổi như thế nào đối với Generic `[T]`, Union `|` và `Annotated`?',
    frontHint: 'PEP 604 (`X | None`), PEP 695 (`type Alias = ...`, `def fn[T](...)`) và `typing.Annotated` cho FastAPI/Pydantic.',
    backAnswer:
      'Không còn phải import `List`, `Dict`, `Optional`, `Union`, `TypeVar` rườm rà từ `typing` nữa! Python 3.10+ dùng trực tiếp kiểu built-in **`list[str]`**, **`dict[str, int]`** và toán tử hợp **`str | None`**. Python 3.12 (PEP 695) bổ sung cú pháp Generic trực tiếp **`def first[T](items: Sequence[T]) -> T:`** và từ khóa **`type Vector = list[float]`**. Ngoài ra, **`Annotated[int, Gt(0)]`** cho phép đính kèm metadata kiểm tra hợp lệ hoặc Dependency Injection ngay trong Type Hint.',
    backAnalogy:
      'Nâng cấp từ hệ thống biển báo viết tắt rườm rà đời cũ sang bảng ký hiệu quốc tế tối giản, sắc nét tương đương TypeScript 5+.',
    codeSnippet: `from collections.abc import Sequence\nfrom typing import Annotated\n\ntype UserId = int\n\ndef first_item[T](items: Sequence[T]) -> T | None:\n    return items[0] if items else None`,
    relatedTermIds: ['concept-type-hints', 'tool-pyright', 'eco-pydantic'],
  },
];

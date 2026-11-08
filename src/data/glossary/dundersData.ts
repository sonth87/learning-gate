import { GlossaryTerm } from '@/types/glossary.types';

export const DUNDERS_GLOSSARY: GlossaryTerm[] = [
  {
    id: 'dunder-init',
    term: '__init__',
    aliases: ['__init__()', 'initializer'],
    category: 'dunder',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Phương thức khởi tạo trạng thái ban đầu (Initializer) cho đối tượng ngay sau khi cấp phát bộ nhớ.',
    detailedExplanation:
      '`__init__(self, ...)` nhận thực thể `self` đã được tạo bởi `__new__` và gán các thuộc tính ban đầu. `__init__` bắt buộc luôn trả về `None`.',
    analogy:
      'Kỹ thuật viên cài đặt ngôn ngữ, hình nền và danh bạ ban đầu cho chiếc điện thoại mới xuất xưởng.',
    syntaxExample: `class Student:\n    def __init__(self, name: str, gpa: float) -> None:\n        self.name = name\n        self.gpa = gpa`,
    commonGotcha:
      'Không bao giờ viết `return value` trong `__init__`, Python sẽ ném `TypeError: __init__() should return None`.',
    jsEquivalent: 'constructor() { ... }',
    relatedTerms: ['dunder-new', 'dunder-repr', 'decl-class'],
  },
  {
    id: 'dunder-new',
    term: '__new__',
    aliases: ['__new__()', 'constructor'],
    category: 'dunder',
    level: 'master',
    stageId: 'stage-6',
    shortSummary: 'Phương thức tĩnh thực sự cấp phát và sinh ra thực thể Object trong bộ nhớ RAM trước khi `__init__` chạy.',
    detailedExplanation:
      '`__new__(cls, ...)` là phương thức tạo đối tượng (Constructor thực sự). Nó nhận lớp `cls` và trả về instance mới. Thường dùng khi kế thừa kiểu Immutable (như `int`, `str`, `tuple`) hoặc cài đặt Singleton Pattern.',
    analogy:
      'Nhà máy đúc ra chiếc vỏ điện thoại trắng tinh trước khi đưa cho kỹ thuật viên cài đặt phần mềm (`__init__`).',
    syntaxExample: `class Singleton:\n    _instance = None\n    def __new__(cls, *args, **kwargs):\n        if cls._instance is None:\n            cls._instance = super().__new__(cls)\n        return cls._instance`,
    commonGotcha:
      'Nếu `__new__` không trả về một instance của `cls`, thì phương thức `__init__` của class đó sẽ hoàn toàn không được gọi!',
    jsEquivalent: 'Object.create() / Symbol.hasInstance',
    relatedTerms: ['dunder-init', 'decl-class'],
  },
  {
    id: 'dunder-str',
    term: '__str__',
    aliases: ['__str__()'],
    category: 'dunder',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Chuỗi đại diện thân thiện, dễ đọc cho người dùng cuối (End-User) khi gọi `print(obj)` hoặc `str(obj)`.',
    detailedExplanation:
      'Tập trung vào tính dễ đọc và thẩm mỹ cho người dùng. Nếu class không định nghĩa `__str__`, Python sẽ tự động dùng `__repr__` thay thế.',
    analogy:
      'Tên món ăn in trên menu cho khách xem: "Phở Bò Đặc Biệt"',
    syntaxExample: `class User:\n    def __init__(self, name: str) -> None:\n        self.name = name\n    def __str__(self) -> str:\n        return f"Người dùng {self.name}"`,
    commonGotcha:
      'Khác với `__repr__` dùng cho lập trình viên gỡ lỗi, `__str__` hướng tới người dùng cuối.',
    jsEquivalent: 'toString()',
    relatedTerms: ['dunder-repr', 'type-str'],
  },
  {
    id: 'dunder-repr',
    term: '__repr__',
    aliases: ['__repr__()'],
    category: 'dunder',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Chuỗi đại diện kỹ thuật chi tiết phục vụ Developer gỡ lỗi (Debug) khi gõ đối tượng trong REPL hoặc log danh sách.',
    detailedExplanation:
      'Quy tắc vàng: chuỗi `__repr__` lý tưởng nên có cú pháp code rõ ràng để có thể tái tạo lại đối tượng qua `eval(repr(obj)) == obj`. Luôn luôn cài đặt `__repr__` trước `__str__`!',
    analogy:
      'Phiếu kỹ thuật dán trong bếp ghi rõ định lượng: "PhoBo(id=12, tai=50g, nuoc_dung=400ml)" để đầu bếp kiểm tra lỗi.',
    syntaxExample: `class User:\n    def __init__(self, id: int, email: str) -> None:\n        self.id = id\n        self.email = email\n    def __repr__(self) -> str:\n        return f"User(id={self.id!r}, email={self.email!r})"`,
    commonGotcha:
      'Nếu thiếu `__repr__`, khi in `list[User]` ra log bạn chỉ thấy `<User object at 0x104a8f910>` vô dụng khi debug!',
    jsEquivalent: 'util.inspect.custom',
    relatedTerms: ['dunder-str', 'dunder-init'],
  },
  {
    id: 'dunder-len',
    term: '__len__',
    aliases: ['__len__()'],
    category: 'dunder',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Cung cấp độ dài cho đối tượng khi được gọi bởi hàm tích hợp `len(obj)`.',
    detailedExplanation:
      '`__len__(self)` phải trả về một số nguyên `int >= 0`. Nếu class không định nghĩa `__bool__`, Python sẽ tự động dùng kết quả `__len__() > 0` để xác định Truthy/Falsy.',
    analogy:
      'Thước đo nội bộ của chiếc hộp: báo cho hệ thống biết bên trong đang chứa bao nhiêu món đồ.',
    syntaxExample: `class CustomCart:\n    def __init__(self) -> None:\n        self.items = []\n    def __len__(self) -> int:\n        return len(self.items)`,
    commonGotcha:
      '`__len__` bắt buộc trả về số nguyên `>= 0`. Trả về số âm hoặc số thực sẽ ném `ValueError` hoặc `TypeError`.',
    jsEquivalent: 'get length()',
    relatedTerms: ['fn-len', 'dunder-bool'],
  },
  {
    id: 'dunder-getitem',
    term: '__getitem__ & __setitem__',
    aliases: ['__getitem__', '__setitem__', '__getitem__()', '__setitem__()'],
    category: 'dunder',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Cho phép đối tượng truy cập và gán giá trị bằng toán tử ngoặc vuông `obj[key]` (Indexing & Slicing).',
    detailedExplanation:
      '`__getitem__(self, key)` được gọi khi đọc `obj[key]`. `__setitem__(self, key, value)` được gọi khi gán `obj[key] = value`. Nếu `key` là đối tượng `slice`, nó hỗ trợ cú pháp cắt lát `obj[1:5:2]`.',
    analogy:
      'Mở ngăn tủ số `key` để lấy đồ hoặc cất đồ vào đúng ngăn đó.',
    syntaxExample: `class CustomMatrix:\n    def __getitem__(self, coord: tuple[int, int]):\n        row, col = coord\n        return self.data[row][col]`,
    commonGotcha:
      'Nếu key không tồn tại, hãy ném đúng `IndexError` (cho kiểu dãy số) hoặc `KeyError` (cho kiểu từ điển mapping).',
    jsEquivalent: 'Proxy get/set handler',
    relatedTerms: ['dunder-len', 'type-dict'],
  },
  {
    id: 'dunder-iter-next',
    term: '__iter__ & __next__',
    aliases: ['__iter__', '__next__', '__iter__()', '__next__()'],
    category: 'dunder',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Bộ đôi cài đặt Giao thức Duyệt lặp (Iterable & Iterator Protocol) để dùng với vòng lặp `for`.',
    detailedExplanation:
      '`__iter__(self)` trả về đối tượng iterator (có phương thức `__next__`). `__next__(self)` trả về phần tử tiếp theo hoặc ném `StopIteration` khi duyệt xong.',
    analogy:
      '`__iter__` là mở khóa băng chuyền, `__next__` là nhấc từng sản phẩm trên băng chuyền ra.',
    syntaxExample: `class Countdown:\n    def __init__(self, start: int):\n        self.current = start\n    def __iter__(self):\n        return self\n    def __next__(self):\n        if self.current <= 0:\n            raise StopIteration\n        val = self.current\n        self.current -= 1\n        return val`,
    commonGotcha:
      'Một Iterator thường cài đặt cả `__iter__` trả về chính nó `return self` để có thể truyền thẳng vào vòng lặp `for`.',
    jsEquivalent: '[Symbol.iterator]() { return { next() { ... } }; }',
    relatedTerms: ['fn-iter-next', 'kw-for'],
  },
  {
    id: 'dunder-contains',
    term: '__contains__',
    aliases: ['__contains__()'],
    category: 'dunder',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Tùy biến hành vi của toán tử kiểm tra thành viên `in` và `not in` (`item in obj`).',
    detailedExplanation:
      '`__contains__(self, item)` trả về `True` hoặc `False`. Nếu class không định nghĩa `__contains__`, Python sẽ tự động lùi bước lặp qua `__iter__` để tìm tuyến tính.',
    analogy:
      'Nhân viên bảo vệ tra danh sách xem tên khách có trong danh sách mời dự tiệc không.',
    syntaxExample: `class DateRange:\n    def __init__(self, start, end):\n        self.start, self.end = start, end\n    def __contains__(self, date) -> bool:\n        return self.start <= date <= self.end`,
    commonGotcha:
      'Cài đặt `__contains__` bằng phép toán logic O(1) thay vì duyệt mảng O(n) sẽ tăng tốc kiểm tra `in` lên gấp bội.',
    jsEquivalent: 'Set.prototype.has()',
    relatedTerms: ['kw-in', 'type-set'],
  },
  {
    id: 'dunder-call',
    term: '__call__',
    aliases: ['__call__()'],
    category: 'dunder',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Biến một thực thể Object có thể được gọi trực tiếp như một hàm `obj(*args, **kwargs)` (Callable Object).',
    detailedExplanation:
      'Biến Class Instance thành một hàm có trạng thái (Stateful Function). Ứng dụng phổ biến nhất trong FastAPI Dependency Injection (tạo class cấu hình rồi truyền vào `Depends(my_obj)`).',
    analogy:
      'Một chiếc máy pha cafe đã được nạp sẵn loại hạt cafe yêu thích (`__init__`), mỗi lần bạn nhấn nút (`__call__`), nó pha đúng ly cafe đó cho bạn.',
    syntaxExample: `class Multiplier:\n    def __init__(self, factor: int) -> None:\n        self.factor = factor\n    def __call__(self, value: int) -> int:\n        return value * self.factor\n\ndouble = Multiplier(2)\nprint(double(5))  # 10`,
    commonGotcha:
      'Một object có `__call__` sẽ khiến hàm `callable(obj)` trả về `True`.',
    jsEquivalent: 'Function Object / closure',
    relatedTerms: ['fn-callable', 'decl-class'],
  },
  {
    id: 'dunder-enter-exit',
    term: '__enter__ & __exit__',
    aliases: ['__enter__', '__exit__', '__enter__()', '__exit__()'],
    category: 'dunder',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Giao thức Quản lý Ngữ cảnh (Context Manager Protocol) dùng trong khối lệnh `with`.',
    detailedExplanation:
      '`__enter__(self)` chuẩn bị tài nguyên và trả về đối tượng cho mệnh đề `as`. `__exit__(self, exc_type, exc_val, exc_tb)` dọn dẹp tài nguyên. Nếu `__exit__` trả về `True`, nó sẽ triệt tiêu ngoại lệ (suppress exception).',
    analogy:
      'Mượn sách thư viện: `__enter__` là làm thủ tục mượn sách, `__exit__` là trả sách lại vào kho bất kể bạn đọc xong hay làm đổ nước lên sách.',
    syntaxExample: `class Timer:\n    def __enter__(self):\n        self.start = time.perf_counter()\n        return self\n    def __exit__(self, exc_type, exc_val, exc_tb):\n        self.elapsed = time.perf_counter() - self.start\n        print(f"Chạy mất: {self.elapsed:.4f}s")`,
    commonGotcha:
      'Đừng trả về `True` trong `__exit__` trừ khi bạn cố tình muốn nuốt sạch mọi Exception phát sinh bên trong khối `with`!',
    jsEquivalent: '[Symbol.dispose]() (TypeScript 5.2+)',
    relatedTerms: ['kw-with', 'concept-context-manager'],
  },
  {
    id: 'dunder-eq',
    term: '__eq__ & __ne__',
    aliases: ['__eq__', '__ne__', '__eq__()'],
    category: 'dunder',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Tùy biến toán tử so sánh bằng `==` (`__eq__`) và so sánh khác `!=` (`__ne__`).',
    detailedExplanation:
      'Mặc định trong Python, hai instance của class tự tạo so sánh `==` bằng địa chỉ ô nhớ RAM (`id()`). Cài đặt `__eq__` cho phép so sánh dựa trên giá trị các trường dữ liệu.',
    analogy:
      'Hai chiếc vé xem phim: dù in trên 2 tờ giấy khác nhau nhưng nếu cùng hàng ghế và số ghế thì xem như bằng nhau.',
    syntaxExample: `class Point:\n    def __init__(self, x: int, y: int):\n        self.x, self.y = x, y\n    def __eq__(self, other) -> bool:\n        if not isinstance(other, Point):\n            return False\n        return self.x == other.x and self.y == other.y`,
    commonGotcha:
      'Nếu bạn tự định nghĩa `__eq__`, Python sẽ tự động gán `__hash__ = None` (biến object thành Unhashable). Muốn dùng làm key cho Dict, bạn phải tự cài đặt cả `__hash__`.',
    jsEquivalent: 'Không có toán tử nạp chồng (overloading) trong JS',
    relatedTerms: ['dunder-hash', 'kw-is'],
  },
  {
    id: 'dunder-hash',
    term: '__hash__',
    aliases: ['__hash__()'],
    category: 'dunder',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Trả về mã băm số nguyên của đối tượng để dùng làm Key trong Dict hoặc phần tử trong Set.',
    detailedExplanation:
      'Bắt buộc phải đi kèm với `__eq__`: hai đối tượng bằng nhau (`a == b`) thì bắt buộc phải có giá trị hash giống nhau (`hash(a) == hash(b)`). Đối tượng có hash bắt buộc phải BẤT BIẾN (Immutable).',
    analogy:
      'Dấu vân tay định danh duy nhất của công dân.',
    syntaxExample: `class ImmutablePoint:\n    def __init__(self, x: int, y: int):\n        self._x, self._y = x, y\n    def __hash__(self) -> int:\n        return hash((self._x, self._y))\n    def __eq__(self, other):\n        return isinstance(other, ImmutablePoint) and (self._x, self._y) == (other._x, other._y)`,
    commonGotcha:
      'Tuyệt đối không tính toán `__hash__` dựa trên các thuộc tính khả biến (Mutable) có thể thay đổi sau khi tạo!',
    jsEquivalent: 'Không có tương đương trực tiếp',
    relatedTerms: ['fn-hash', 'dunder-eq', 'type-set'],
  },
  {
    id: 'dunder-slots',
    term: '__slots__',
    aliases: ['__slots__'],
    category: 'dunder',
    level: 'master',
    stageId: 'stage-4',
    shortSummary: 'Khóa chặt các thuộc tính của Class, triệt tiêu `__dict__` giúp giảm tới 60% RAM cho hàng triệu Instance.',
    detailedExplanation:
      '`__slots__ = ("name", "age")` báo cho CPython cấp phát một mảng cố định các con trỏ thay vì tạo một `dict` riêng cho từng instance. Giúp tiết kiệm lượng lớn bộ nhớ và tăng nhẹ tốc độ đọc/ghi thuộc tính.',
    analogy:
      'Đóng sẵn các ngăn chứa đồ cố định có kích thước chuẩn thay vì phát cho mỗi người một chiếc balo to cồng kềnh.',
    syntaxExample: `class OptimizedUser:\n    __slots__ = ("id", "username", "email")\n    def __init__(self, id: int, username: str, email: str):\n        self.id = id\n        self.username = username\n        self.email = email`,
    commonGotcha:
      'Khi dùng `__slots__`, bạn không thể gán thêm bất kỳ thuộc tính tùy ý nào mới vào đối tượng lúc runtime (trừ khi `__slots__` có chứa `"__dict__"`).',
    jsEquivalent: 'Cấu trúc V8 Hidden Class / C Struct',
    relatedTerms: ['decl-class', 'decl-dataclass'],
  },
  {
    id: 'dunder-bool',
    term: '__bool__',
    aliases: ['__bool__()'],
    category: 'dunder',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Xác định giá trị chân lý Truthy hoặc Falsy của đối tượng khi nằm trong biểu thức `if obj:`.',
    detailedExplanation:
      '`__bool__(self)` phải trả về `True` hoặc `False`. Nếu class không có `__bool__`, Python tìm `__len__`. Nếu không có cả hai, đối tượng mặc định là `True`.',
    analogy:
      'Cảm biến kiểm tra xem bình xăng còn xăng (`True`) hay đã cạn đáy (`False`).',
    syntaxExample: `class Response:\n    def __init__(self, status_code: int):\n        self.status_code = status_code\n    def __bool__(self) -> bool:\n        return 200 <= self.status_code < 300\n\nres = Response(404)\nif not res:\n    print("Yêu cầu thất bại!")`,
    commonGotcha:
      '`__bool__` bắt buộc phải trả về kiểu `bool`. Trả về số hoặc chuỗi sẽ ném lỗi `TypeError`.',
    jsEquivalent: 'Symbol.toPrimitive',
    relatedTerms: ['kw-if', 'dunder-len'],
  },
  {
    id: 'dunder-getattr',
    term: '__getattr__ & __setattr__',
    aliases: ['__getattr__', '__setattr__', '__getattr__()', '__setattr__()'],
    category: 'dunder',
    level: 'master',
    stageId: 'stage-4',
    shortSummary: 'Đón bắt các truy cập thuộc tính động (Dynamic Attribute Fallback & Interception).',
    detailedExplanation:
      '`__getattr__(self, name)` chỉ được gọi khi thuộc tính KHÔNG tồn tại trong `__dict__` hay class. Ngược lại, `__getattribute__` bắt MỌI truy cập thuộc tính (dễ gây đệ quy vô tận).',
    analogy:
      'Bộ phận chăm sóc khách hàng tiếp nhận các yêu cầu dịch vụ đặc biệt mà lễ tân thông thường không xử lý được.',
    syntaxExample: `class DynamicSettings:\n    def __init__(self, data: dict):\n        self._data = data\n    def __getattr__(self, name: str):\n        if name in self._data:\n            return self._data[name]\n        raise AttributeError(f"Không có cấu hình {name}")`,
    commonGotcha:
      'Trong `__setattr__`, nếu bạn viết `self.x = val` thì nó lại gọi chính `__setattr__` và gây `RecursionError`! Phải dùng `super().__setattr__(name, val)`.',
    jsEquivalent: 'Proxy get() và set() traps',
    relatedTerms: ['fn-hasattr', 'decl-property'],
  },
];

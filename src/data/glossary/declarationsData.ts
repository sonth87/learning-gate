import { GlossaryTerm } from '@/types/glossary.types';

export const DECLARATIONS_GLOSSARY: GlossaryTerm[] = [
  {
    id: 'decl-def-func',
    term: 'def (Function Declaration)',
    aliases: ['def', 'function', 'khai báo hàm'],
    category: 'declaration',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Cú pháp chuẩn khai báo hàm (Function) với tham số, giá trị mặc định, type hints và docstring.',
    detailedExplanation:
      'Cú pháp `def function_name(param1: type, param2: type = default) -> return_type:` tạo đối tượng hàm trong bộ nhớ. Python hỗ trợ Positional-only params (dùng `/`), Keyword-only params (dùng `*`), và biến số lượng tham số (`*args`, `**kwargs`).',
    analogy:
      'Giống như việc viết một bản hướng dẫn kỹ thuật có tem nhãn rõ ràng: đầu vào cần linh kiện gì (type hint), nếu thiếu linh kiện thì dùng loại nào sẵn có (default), và sản phẩm đầu ra sẽ là gì (return type).',
    syntaxExample: `def calculate_order(\n    user_id: int,\n    items: list[str],\n    *,\n    discount: float = 0.0,\n    currency: str = "VND"\n) -> dict:\n    """Tính toán đơn hàng với keyword-only discount."""\n    return {"total": 100000 * (1 - discount), "currency": currency}`,
    commonGotcha:
      'Tuyệt đối không dùng mutable object (list, dict, set) làm giá trị mặc định trong khai báo hàm. Mọi lần gọi hàm sẽ dùng chung cùng một ô nhớ đó!',
    jsEquivalent: 'function calculateOrder(userId, items, { discount = 0.0, currency = "VND" } = {}) {}',
    relatedTerms: ['kw-def', 'decl-type-annotation', 'decl-lambda', 'decl-docstring'],
  },
  {
    id: 'decl-class',
    term: 'class (Class Declaration)',
    aliases: ['class', 'khai báo class', 'khai báo lớp'],
    category: 'declaration',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Cú pháp định nghĩa lớp đối tượng (Class) trong lập trình hướng đối tượng OOP, hỗ trợ đa kế thừa.',
    detailedExplanation:
      '`class MyClass(Base1, Base2):` tạo một đối tượng kiểu (Type Object) kế thừa từ các lớp cha. Thứ tự duyệt kế thừa tuân thủ thuật toán C3 Linearization (Method Resolution Order - MRO).',
    analogy:
      'Class là bản vẽ thiết kế kiến trúc của một ngôi nhà: xác định cấu trúc các phòng, cửa đi vào và hệ thống điện nước. Các instance được tạo ra từ class chính là những ngôi nhà thực tế xây trên khu đất.',
    syntaxExample: `class BankAccount:\n    interest_rate: float = 0.05  # Class attribute\n\n    def __init__(self, account_no: str, balance: float = 0.0) -> None:\n        self.account_no = account_no  # Instance attribute\n        self.balance = balance`,
    commonGotcha:
      'Phân biệt Class Attribute (khai báo trong thân class, dùng chung cho mọi thực thể) và Instance Attribute (gán qua `self.x` trong `__init__`, độc lập cho từng đối tượng).',
    jsEquivalent: 'class BankAccount extends BaseClass {}',
    relatedTerms: ['kw-class', 'dunder-init', 'decl-property', 'decl-classmethod'],
  },
  {
    id: 'decl-type-alias',
    term: 'type (Type Alias PEP 695)',
    aliases: ['type alias', 'khai báo type'],
    category: 'declaration',
    level: 'advanced',
    stageId: 'stage-4',
    shortSummary: 'Cú pháp mới từ Python 3.12 (PEP 695) cho phép định nghĩa Type Alias thanh lịch và lười đánh giá (Lazy).',
    detailedExplanation:
      'Thay vì cú pháp cũ `UserId: TypeAlias = int`, từ Python 3.12 bạn viết trực tiếp `type UserId = int` hoặc generic `type Point[T] = tuple[T, T]`. Type alias này được đánh giá theo kiểu lười (lazy evaluation) nên tránh được lỗi circular imports.',
    analogy:
      'Giống như đặt biệt danh (Nickname) ngắn gọn cho một định dạng phức tạp: thay vì mỗi lần ghi "bản đồ ánh xạ mã vùng với danh sách tọa độ GPS", bạn chỉ cần đặt `type GeoMap = dict[str, list[float]]`.',
    syntaxExample: `type JsonValue = str | int | float | bool | None | list[JsonValue] | dict[str, JsonValue]\ntype Coordinate[T: (int, float)] = tuple[T, T]`,
    commonGotcha:
      'Cú pháp `type MyAlias = ...` yêu cầu Python 3.12 trở lên. Nếu dự án vẫn dùng Python 3.10-3.11, bạn phải dùng `from typing import TypeAlias; MyAlias: TypeAlias = ...`.',
    jsEquivalent: 'type JsonValue = string | number | boolean | null | ...',
    relatedTerms: ['decl-type-annotation', 'decl-generic', 'concept-type-hints'],
  },
  {
    id: 'decl-generic',
    term: 'Generic Type Declaration (PEP 695)',
    aliases: ['Generics', 'TypeVar', 'khai báo generic'],
    category: 'declaration',
    level: 'advanced',
    stageId: 'stage-4',
    shortSummary: 'Khai báo lớp hoặc hàm tổng quát (Generics) sử dụng cú pháp ngoặc vuông `[T]` từ Python 3.12+.',
    detailedExplanation:
      'Từ Python 3.12, không cần khai báo rườm rà `T = TypeVar("T")` và kế thừa `Generic[T]`. Bạn có thể viết trực tiếp `class Stack[T]:` hoặc `def first[T](items: list[T]) -> T:`.',
    analogy:
      'Giống như chiếc khuôn làm bánh trong suốt: chiếc khuôn giữ nguyên hình dáng (`Stack`), nhưng bạn có thể đổ bột socola (`Stack[str]`) hoặc đổ thạch dâu (`Stack[int]`) vào bên trong tùy ý.',
    syntaxExample: `class Stack[T]:\n    def __init__(self) -> None:\n        self._items: list[T] = []\n    def push(self, item: T) -> None:\n        self._items.append(item)\n    def pop(self) -> T:\n        return self._items.pop()`,
    commonGotcha:
      'Generics trong Python chỉ phục vụ Type Checker tĩnh (Mypy, Pyright) và IDE; lúc runtime, Python không thực hiện Type Erasure hay enforce kiểu dữ liệu.',
    jsEquivalent: 'class Stack<T> { push(item: T): void; pop(): T; }',
    relatedTerms: ['decl-type-alias', 'decl-type-annotation'],
  },
  {
    id: 'decl-walrus',
    term: ':= (Walrus Operator PEP 572)',
    aliases: ['walrus', 'assignment expression', 'toán tử gán'],
    category: 'declaration',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Toán tử gán biểu thức (Assignment Expression) vừa gán giá trị cho biến vừa trả về giá trị đó.',
    detailedExplanation:
      'Toán tử `:=` (trông như mắt và cặp ngà của con hải mã - walrus) cho phép bạn gán biến ngay bên trong một biểu thức điều kiện `if` hoặc vòng lặp `while`, tránh việc phải gọi hàm 2 lần hoặc gán biến thừa bên ngoài.',
    analogy:
      'Giống như vừa quét mã vạch sản phẩm (trả về giá trị tính tiền) vừa lập tức lưu số seri vào hệ thống kho mà không phải quét lại lần hai.',
    syntaxExample: `# Không dùng walrus:\nchunk = file.read(1024)\nwhile chunk:\n    process(chunk)\n    chunk = file.read(1024)\n\n# Dùng walrus chuẩn Pythonic:\nwhile (chunk := file.read(1024)):\n    process(chunk)`,
    commonGotcha:
      'Tránh lạm dụng walrus trong các biểu thức quá phức tạp vì sẽ làm giảm khả năng đọc code (Readability) — nguyên tắc cốt lõi của The Zen of Python.',
    jsEquivalent: 'while ((chunk = file.read(1024))) {}',
    relatedTerms: ['kw-while', 'kw-if'],
  },
  {
    id: 'decl-match-case',
    term: 'match ... case (Pattern Matching PEP 634)',
    aliases: ['match', 'case', 'structural pattern matching'],
    category: 'declaration',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Khai báo cấu trúc khớp mẫu nâng cao (Structural Pattern Matching) từ Python 3.10+.',
    detailedExplanation:
      'Cho phép bóc tách cấu trúc (Destructuring) của List, Tuple, Dict, Object, kết hợp Type Checking và điều kiện bảo vệ `if` guard trong từng nhánh `case`. Nhánh mặc định sử dụng ký tự gạch dưới `case _:` wildcard.',
    analogy:
      'Giống như chiếc cổng an ninh sân bay thông minh: tự động soi chiếu và nhận diện nếu hành khách mang hộ chiếu ngoại giao (`case Diplomat()`), hay mang vali có 2 chai nước (`case Bag(bottles=[_, _])`).',
    syntaxExample: `def handle_action(event: dict):\n    match event:\n        case {"type": "click", "x": int(x), "y": int(y)} if x > 0:\n            print(f"Click tại tọa độ dương: {x}, {y}")\n        case {"type": "key", "key": "Enter"}:\n            submit_form()\n        case _:\n            print("Sự kiện chưa được hỗ trợ")`,
    commonGotcha:
      'Trong `case [x, y]:`, `x` và `y` là các biến gán (capture pattern), không phải biến so sánh ngoài phạm vi!',
    jsEquivalent: 'switch (true) { case ... } hoặc thư viện ts-pattern',
    relatedTerms: ['kw-match', 'fn-isinstance'],
  },
  {
    id: 'decl-decorator',
    term: '@decorator (Decorator Declaration)',
    aliases: ['decorator', '@', 'khai báo decorator'],
    category: 'declaration',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Cú pháp `@` bọc một hàm hoặc class bằng một hàm khác để mở rộng tính năng mà không sửa mã gốc.',
    detailedExplanation:
      'Cú pháp `@my_decorator` đặt trên `def target()` thực chất là cú pháp rút gọn của `target = my_decorator(target)`. Decorator tận dụng Closure và First-Class Functions để thực thi logic trước và sau khi hàm mục tiêu chạy.',
    analogy:
      'Giống như lắp vỏ ốp chống sốc cho điện thoại: chiếc điện thoại vẫn giữ nguyên chức năng nghe gọi, nhưng có thêm khả năng chống va đập và chống nước mà không cần mở máy ra hàn sửa linh kiện bên trong.',
    syntaxExample: `import time\nfrom functools import wraps\n\ndef timer(func):\n    @wraps(func)\n    def wrapper(*args, **kwargs):\n        start = time.perf_counter()\n        result = func(*args, **kwargs)\n        print(f"{func.__name__} chạy mất {time.perf_counter() - start:.4f}s")\n        return result\n    return wrapper\n\n@timer\ndef compute():\n    return sum(i * i for i in range(1_000_000))`,
    commonGotcha:
      'Luôn luôn dùng `@functools.wraps(func)` bên trong hàm wrapper, nếu không hàm sẽ bị mất `__name__` và `__doc__`, gây lỗi cho các công cụ auto-doc như Swagger/OpenAPI của FastAPI.',
    jsEquivalent: 'Decorator proposal (@decorator trong TypeScript)',
    relatedTerms: ['decl-property', 'concept-closure', 'decl-def-func'],
  },
  {
    id: 'decl-property',
    term: '@property (Property Getter & Setter)',
    aliases: ['property', '@property', 'getter', 'setter'],
    category: 'declaration',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Biến một phương thức thành thuộc tính truy cập tự nhiên `obj.x` thay vì phải gọi `obj.get_x()`.',
    detailedExplanation:
      'Python áp dụng Descriptor Protocol thông qua `@property` để định nghĩa getter, và `@name.setter` để định nghĩa logic kiểm tra dữ liệu đầu vào (validation) khi gán giá trị `obj.x = val`.',
    analogy:
      'Giống như công tơ mét trên xe: bạn chỉ cần liếc mắt đọc số liệu hiển thị (`obj.speed`), nhưng bên dưới là cả một bộ cảm biến liên tục tính toán vòng quay bánh xe trên giây.',
    syntaxExample: `class Product:\n    def __init__(self, price: float) -> None:\n        self._price = price\n\n    @property\n    def price(self) -> float:\n        return self._price\n\n    @price.setter\n    def price(self, value: float) -> None:\n        if value < 0:\n            raise ValueError("Giá sản phẩm không thể âm!")\n        self._price = value`,
    commonGotcha:
      'Thuộc tính lưu giá trị thực bên dưới phải dùng quy ước dấu gạch dưới `self._price`. Nếu viết `self.price = value` trong setter, bạn sẽ bị lỗi đệ quy vô tận `RecursionError`!',
    jsEquivalent: 'get price() { ... } và set price(val) { ... }',
    relatedTerms: ['decl-class', 'decl-decorator', 'dunder-getattr'],
  },
  {
    id: 'decl-classmethod',
    term: '@classmethod (Class Method Declaration)',
    aliases: ['classmethod', '@classmethod'],
    category: 'declaration',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Khai báo phương thức nhận lớp `cls` thay vì thực thể `self`, thường dùng làm Alternative Constructor.',
    detailedExplanation:
      'Khi gọi `MyClass.from_json(data)`, Python tự động truyền đối tượng Class làm đối số đầu tiên `cls`. Rất hữu ích khi viết các hàm factory tạo đối tượng từ dict, json, file hoặc cấu hình khác nhau.',
    analogy:
      'Giống như xưởng sản xuất: `self` là thao tác của từng chiếc xe máy cụ thể (bóp phanh, bấm còi), còn `cls` là dây chuyền của nhà máy có thể xuất xưởng ra chiếc xe từ bản vẽ xuất khẩu hoặc bản vẽ nội địa.',
    syntaxExample: `class User:\n    def __init__(self, name: str, email: str) -> None:\n        self.name = name\n        self.email = email\n\n    @classmethod\n    def from_dict(cls, data: dict) -> "User":\n        return cls(name=data["name"], email=data["email"])`,
    commonGotcha:
      'Đừng nhầm lẫn giữa `@classmethod` (nhận `cls`) và `@staticmethod` (không nhận bất kỳ tham số ngữ cảnh nào).',
    jsEquivalent: 'static fromDict(data) { return new this(data.name, data.email); }',
    relatedTerms: ['decl-staticmethod', 'decl-class'],
  },
  {
    id: 'decl-staticmethod',
    term: '@staticmethod (Static Method Declaration)',
    aliases: ['staticmethod', '@staticmethod'],
    category: 'declaration',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Khai báo phương thức độc lập trong class, không nhận `self` lẫn `cls`, đóng vai trò hàm tiện ích (Utility).',
    detailedExplanation:
      'Phương thức tĩnh không phụ thuộc vào trạng thái của instance hay class. Nó được đặt vào trong class đơn thuần vì mục đích tổ chức mã nguồn (Namespace encapsulation).',
    analogy:
      'Giống như một cuốn cẩm nang công thức toán học bỏ túi được cất trong ngăn bàn của phòng ban: bất kỳ ai cũng có thể mở ra tra cứu công thức tính thuế mà không cần biết số dư tài khoản của từng nhân viên.',
    syntaxExample: `class MathUtils:\n    @staticmethod\n    def is_even(number: int) -> bool:\n        return number % 2 == 0`,
    commonGotcha:
      'Nếu hàm tiện ích hoàn toàn độc lập và không liên quan chặt chẽ tới class, trong Python chuẩn PEP 8 thường ưu tiên tách ra thành hàm mức module `def is_even()` thay vì cố bọc vào class.',
    jsEquivalent: 'static isEven(number) { return number % 2 === 0; }',
    relatedTerms: ['decl-classmethod', 'decl-class'],
  },
  {
    id: 'decl-dataclass',
    term: '@dataclass (Data Class Declaration PEP 557)',
    aliases: ['dataclass', '@dataclass'],
    category: 'declaration',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Decorator tự động sinh `__init__`, `__repr__`, `__eq__` và so sánh cho lớp lưu trữ dữ liệu.',
    detailedExplanation:
      'Thay vì phải viết lặp đi lặp lại hàng chục dòng boilerplate code gán `self.x = x`, `@dataclass` đọc các type annotations trong thân class và tự sinh phương thức tương ứng. Hỗ trợ `frozen=True` (bất biến) và `slots=True` (tiết kiệm RAM).',
    analogy:
      'Giống như việc điền vào mẫu hồ sơ in sẵn: bạn chỉ cần điền tên các trường dữ liệu và loại giấy tờ, máy tính tự động in ra bản hợp đồng hoàn chỉnh có chữ ký và đóng dấu.',
    syntaxExample: `from dataclasses import dataclass, field\n\n@dataclass(frozen=True, slots=True)\nclass OrderItem:\n    product_id: int\n    quantity: int = 1\n    price: float = field(default=0.0)\n\n# Tự động có __repr__, __eq__, __init__ chuẩn!`,
    commonGotcha:
      'Mặc định `@dataclass` là Mutable. Nếu muốn an toàn luồng và dùng làm key cho Dict hoặc Set, hãy luôn chỉ định `@dataclass(frozen=True)`.',
    jsEquivalent: 'Cấu trúc interface/type trong TypeScript kết hợp Object.freeze()',
    relatedTerms: ['dunder-init', 'dunder-repr', 'decl-class'],
  },
  {
    id: 'decl-type-annotation',
    term: 'Type Annotations (: type & -> return)',
    aliases: ['type hint', 'type annotation', 'khai báo kiểu'],
    category: 'declaration',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Cú pháp chú thích kiểu dữ liệu tĩnh cho biến, tham số hàm và giá trị trả về theo PEP 484.',
    detailedExplanation:
      'Python là ngôn ngữ Dynamic Typing nhưng hỗ trợ Type Hints từ Python 3.5+. Bạn khai báo biến `age: int = 25` và hàm `def fn(x: str) -> list[int]:`. Từ Python 3.9+, dùng trực tiếp `list[int]`, `dict[str, int]` thay vì `from typing import List, Dict`.',
    analogy:
      'Giống như dán nhãn phân loại lên từng hộp đựng đồ đạc trong kho: người bốc vác (IDE, linter) nhìn nhãn là biết ngay bên trong chứa gì mà không cần phải mở nắp bới từng món đồ ra xem.',
    syntaxExample: `def fetch_active_users(\n    limit: int = 50,\n    include_inactive: bool = False\n) -> list[dict[str, str | int]]:\n    return [{"id": 1, "username": "admin"}]`,
    commonGotcha:
      'Type annotations KHÔNG ép kiểu runtime (không ném lỗi nếu truyền sai kiểu lúc chạy). Để kiểm tra và ép kiểu runtime tự động, hãy dùng Pydantic.',
    jsEquivalent: 'TypeScript: function fn(x: string): number[] {}',
    relatedTerms: ['decl-type-alias', 'decl-generic', 'eco-pydantic'],
  },
  {
    id: 'decl-global',
    term: 'global (Global Variable Declaration)',
    aliases: ['global', 'khai báo global'],
    category: 'declaration',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Khai báo bên trong hàm cho phép gán lại (reassign) biến thuộc phạm vi toàn cục của Module.',
    detailedExplanation:
      'Theo quy tắc LEGB, nếu bạn gán giá trị cho một biến trong hàm, Python mặc định biến đó là Local. Từ khóa `global x` báo hiệu cho compiler biết thao tác gán nhắm tới biến `x` ở mức cao nhất của file.',
    analogy:
      'Giống như việc viết thông báo chung lên bảng tin đại sảnh của toàn công ty thay vì chỉ ghi vào sổ tay cá nhân trong phòng làm việc riêng.',
    syntaxExample: `current_env = "development"\n\ndef set_production():\n    global current_env\n    current_env = "production"`,
    commonGotcha:
      'Lạm dụng `global` là anti-pattern nghiêm trọng làm mất tính thuần khiết của hàm, gây khó khăn cho Unit Test và race condition trong đa luồng.',
    jsEquivalent: 'window.variable = ... / globalThis.variable = ...',
    relatedTerms: ['decl-nonlocal', 'kw-global'],
  },
  {
    id: 'decl-nonlocal',
    term: 'nonlocal (Enclosing Scope Declaration)',
    aliases: ['nonlocal', 'khai báo nonlocal'],
    category: 'declaration',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Khai báo bên trong hàm con (Closure) cho phép gán lại biến thuộc phạm vi hàm bao ngoài gần nhất.',
    detailedExplanation:
      'Khi tạo hàm lồng nhau (Nested Functions/Closures), nếu muốn sửa đổi biến của hàm cha (nhưng không phải biến toàn cục `global`), bạn bắt buộc phải dùng `nonlocal`.',
    analogy:
      'Người trong phòng họp nhỏ muốn sửa đổi số liệu ghi trên bảng trắng của phòng làm việc chung của tầng (chứ không phải bảng tin toàn công ty).',
    syntaxExample: `def make_accumulator(initial: int = 0):\n    total = initial\n    def add(amount: int) -> int:\n        nonlocal total\n        total += amount\n        return total\n    return add`,
    commonGotcha:
      '`nonlocal` chỉ tìm biến ở các hàm bao ngoài, nếu biến không tồn tại trong bất kỳ hàm cha nào, Python sẽ ném lỗi `SyntaxError: no binding for nonlocal`.',
    jsEquivalent: 'JavaScript hỗ trợ Closure tự nhiên, không cần từ khóa.',
    relatedTerms: ['decl-global', 'kw-nonlocal', 'concept-closure'],
  },
  {
    id: 'decl-enum',
    term: 'Enum (Enumeration Declaration PEP 435)',
    aliases: ['enum', 'class Enum', 'khai báo enum'],
    category: 'declaration',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Khai báo tập hợp các hằng số định danh duy nhất (Constant Enumeration) an toàn kiểu.',
    detailedExplanation:
      'Kế thừa từ `enum.Enum` (hoặc `StrEnum`, `IntEnum` trong Python 3.11+) tạo ra tập giá trị bất biến, không thể trùng lặp, dễ đọc trong log và ngăn ngừa triệt để lỗi gõ sai chuỗi (magic strings).',
    analogy:
      'Giống như 3 màu của đèn giao thông: Đỏ, Vàng, Xanh. Không thể có màu "đỏ nhạt" hay "xanh lá cây đậm" lọt vào hệ thống điều khiển.',
    syntaxExample: `from enum import StrEnum\n\nclass UserRole(StrEnum):\n    ADMIN = "admin"\n    EDITOR = "editor"\n    VIEWER = "viewer"\n\ndef check_access(role: UserRole):\n    if role is UserRole.ADMIN:\n        print("Toàn quyền hệ thống")`,
    commonGotcha:
      'Nên ưu tiên dùng `StrEnum` (từ Python 3.11+) khi làm việc với JSON hoặc Database để serialize trực tiếp thành chuỗi mà không cần gọi `.value`.',
    jsEquivalent: 'enum UserRole { Admin = "admin", ... } trong TypeScript',
    relatedTerms: ['decl-class', 'decl-type-annotation'],
  },
  {
    id: 'decl-typed-dict',
    term: 'TypedDict (Typed Dictionary PEP 589)',
    aliases: ['TypedDict', 'class TypedDict'],
    category: 'declaration',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Khai báo cấu trúc từ điển Dictionary có định nghĩa kiểu chặt chẽ cho từng khóa (Key-value typing).',
    detailedExplanation:
      'Lúc runtime, đối tượng vẫn là một `dict` Python thông thường (không tốn overhead chuyển đổi như Class), nhưng lúc kiểm tra tĩnh, IDE và Mypy sẽ báo lỗi ngay nếu bạn truyền thiếu key hoặc sai kiểu giá trị.',
    analogy:
      'Giống như mẫu đơn tờ khai thuế: bản chất vẫn là một tờ giấy viết tay, nhưng có từng ô kẻ sẵn tên trường bắt buộc phải điền đúng quy chuẩn.',
    syntaxExample: `from typing import TypedDict, NotRequired\n\nclass UserPayload(TypedDict):\n    id: int\n    name: str\n    email: str\n    avatar_url: NotRequired[str]\n\n# IDE sẽ gợi ý autocomplete chuẩn xác từng key!`,
    commonGotcha:
      'TypedDict chỉ là type hint, lúc chạy (runtime) nó là `dict` thông thường và KHÔNG validate dữ liệu đầu vào. Muốn validate lúc runtime hãy dùng Pydantic.',
    jsEquivalent: 'interface UserPayload { id: number; name: string; avatarUrl?: string; }',
    relatedTerms: ['decl-type-annotation', 'eco-pydantic', 'type-dict'],
  },
  {
    id: 'decl-docstring',
    term: 'Docstrings ("""PEP 257""")',
    aliases: ['docstring', 'tài liệu hàm', 'PEP 257'],
    category: 'declaration',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Chuỗi tài liệu chuẩn đặt ngay đầu hàm, class hoặc module, truy cập được qua thuộc tính `__doc__`.',
    detailedExplanation:
      'Docstring dùng cặp ba dấu nháy `"""..."""`. Các công cụ tự động hóa như Sphinx, MkDocs, FastAPI (Swagger UI) sẽ đọc docstring này để render thành cổng tài liệu API trực tuyến.',
    analogy:
      'Sách hướng dẫn sử dụng đi kèm sản phẩm: bất cứ khi nào người dùng cần hỗ trợ (`help(func)`), tài liệu lập tức mở ra đúng trang giải thích chi tiết.',
    syntaxExample: `def calculate_discount(price: float, rate: float) -> float:\n    """Tính số tiền giảm giá dựa trên tỷ lệ phần trăm.\n\n    Args:\n        price: Giá gốc của sản phẩm (VND).\n        rate: Tỷ lệ giảm giá từ 0.0 đến 1.0.\n\n    Returns:\n        Số tiền được giảm.\n\n    Raises:\n        ValueError: Nếu rate nằm ngoài khoảng [0, 1].\n    """\n    if not 0.0 <= rate <= 1.0:\n        raise ValueError("Tỷ lệ phải từ 0.0 đến 1.0")\n    return price * rate`,
    commonGotcha:
      'Docstring khác với comment thường (`#`). Comment thường bị trình thông dịch bỏ qua khi sinh Bytecode, còn Docstring được lưu trực tiếp vào thuộc tính `func.__doc__` của đối tượng trong RAM.',
    jsEquivalent: 'JSDoc /** ... */',
    relatedTerms: ['decl-def-func', 'decl-class'],
  },
];

export type QuickSyntaxCategoryId =
  | 'all'
  | 'io-vars'
  | 'casting-types'
  | 'operators'
  | 'control-flow'
  | 'loops'
  | 'functions'
  | 'arrays-lists'
  | 'objects-dicts'
  | 'errors-modules';

export interface PythonOrgHeroSlide {
  id: string;
  slideNumber: number;
  title: string;
  subtitle: string;
  replCode: string;
  cleanScriptCode: string;
  output: string;
  explanationPoints: string[];
  jsComparison: string;
}

export interface QuickSyntaxDeclarationItem {
  id: string;
  category: Exclude<QuickSyntaxCategoryId, 'all'>;
  categoryLabel: string;
  title: string;
  badge: string;
  summary: string;
  declarationForms: {
    label: string;
    syntax: string;
    note: string;
  }[];
  codeExample: string;
  output: string;
  detailsAndGotchas: string[];
  jsEquivalent: {
    syntax: string;
    note: string;
  };
}

export const QUICK_SYNTAX_CATEGORIES: {
  id: QuickSyntaxCategoryId;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: 'all',
    label: 'Tất cả Cú pháp & Khai báo',
    shortLabel: 'Tất cả',
    description: 'Toàn bộ các cách khai báo biến, ép kiểu, toán tử, vòng lặp, hàm, mảng (list) và object (dict/class).',
  },
  {
    id: 'io-vars',
    label: '1. Xuất/Nhập, Biến & Chuỗi (f-string)',
    shortLabel: '1. Biến & I/O',
    description: 'print(), input(), gán nhiều biến cùng lúc, hằng số và định dạng chuỗi f-string.',
  },
  {
    id: 'casting-types',
    label: '2. Ép kiểu (Casting) & Kiểm tra Kiểu',
    shortLabel: '2. Ép kiểu',
    description: 'Chuyển đổi qua lại giữa int, float, str, bool, list, tuple, set, dict và kiểm tra isinstance().',
  },
  {
    id: 'operators',
    label: '3. Toán tử (Số học, Logic, 3 ngôi, in, is)',
    shortLabel: '3. Toán tử',
    description: 'Chia lấy nguyên //, lũy thừa **, toán tử logic and/or/not, toán tử 3 ngôi, Walrus :=, in và is.',
  },
  {
    id: 'control-flow',
    label: '4. Điều kiện (if / elif / else & match / case)',
    shortLabel: '4. Điều kiện',
    description: 'Cấu trúc rẽ nhánh if-elif-else, quy tắc Truthy/Falsy và Structural Pattern Matching match-case.',
  },
  {
    id: 'loops',
    label: '5. Vòng lặp (for, while, range, enumerate, zip)',
    shortLabel: '5. Vòng lặp',
    description: 'Duyệt phần tử, lấy cả index với enumerate(), ghép mảng với zip(), vòng lặp while và break/continue.',
  },
  {
    id: 'functions',
    label: '6. Khai báo Hàm (def, *args, **kwargs, lambda)',
    shortLabel: '6. Hàm (def)',
    description: 'Đầy đủ các cách khai báo hàm: tham số mặc định, *args, **kwargs, trả về nhiều giá trị, lambda, yield, async.',
  },
  {
    id: 'arrays-lists',
    label: '7. Mảng / List, Tuple, Set & Comprehension',
    shortLabel: '7. Mảng (List)',
    description: 'Khai báo mảng, cắt lát Slicing [start:stop:step], thêm/xóa/sắp xếp và List Comprehension.',
  },
  {
    id: 'objects-dicts',
    label: '8. Object: Dictionary, Dataclass & Class OOP',
    shortLabel: '8. Object & Dict',
    description: 'Thao tác với Dictionary (key-value), Dataclass và Class hướng đối tượng (__init__, self, @property).',
  },
  {
    id: 'errors-modules',
    label: '9. Bắt lỗi (try/except), File (with) & Import',
    shortLabel: '9. Lỗi & Import',
    description: 'Xử lý ngoại lệ try-except-else-finally, quản lý tài nguyên với with và các kiểu import module.',
  },
];

/**
 * 5 Iconic "Quick & Easy to Learn" Interactive Slides (Inspired by python.org homepage)
 */
export const PYTHON_ORG_HERO_SLIDES: PythonOrgHeroSlide[] = [
  {
    id: 'pyorg-1-io',
    slideNumber: 1,
    title: 'Xuất / Nhập & Định dạng Chuỗi (Simple I/O & f-strings)',
    subtitle: 'Ví dụ #1 & #2 trên trang chủ python.org — In ra màn hình (hỗ trợ sẵn Unicode) và đọc dữ liệu từ bàn phím',
    replCode: `# Simple output (with Unicode)
>>> print("Hello, I'm Python! 🐍 Xin chào Việt Nam!")
Hello, I'm Python! 🐍 Xin chào Việt Nam!

# Input, assignment & f-string interpolation
>>> name = input('What is your name?\\n')
>>> print(f'Hi, {name}.')
What is your name?
Python
Hi, Python.`,
    cleanScriptCode: `# File: hello_io.py (Chạy bằng: uv run hello_io.py)
print("Hello, I'm Python! 🐍 Xin chào Việt Nam!")

# Đọc chuỗi người dùng nhập từ bàn phím (luôn trả về kiểu str)
name = input("What is your name?\\n")

# f-string: đặt chữ f trước dấu nháy để chèn biến/biểu thức vào trong { }
print(f"Hi, {name}.")`,
    output: `Hello, I'm Python! 🐍 Xin chào Việt Nam!
What is your name?
Python
Hi, Python.`,
    explanationPoints: [
      'Không cần khai báo từ khóa let/const/var: chỉ cần viết tên_biến = giá_trị.',
      'Hàm print() tự động xuống dòng ở cuối (có thể đổi bằng tham số end=" ").',
      'Hàm input() tạm dừng chương trình chờ người dùng gõ phím rồi trả về một chuỗi (str).',
      'f-string (f"Hi, {name}") là cách nối chuỗi nhanh và dễ đọc nhất trong Python 3.6+.',
    ],
    jsComparison:
      'Tương đương console.log(`Hi, ${name}.`) và readline / prompt() trong JavaScript.',
  },
  {
    id: 'pyorg-2-fib',
    slideNumber: 2,
    title: 'Hàm, Vòng lặp while & Gán đồng thời (Fibonacci Series)',
    subtitle: 'Ví dụ #3 trên trang chủ python.org — Định nghĩa hàm với def, vòng lặp while và Tuple Unpacking',
    replCode: `# Write Fibonacci series up to n
>>> def fib(n):
...     a, b = 0, 1
...     while a < n:
...         print(a, end=' ')
...         a, b = b, a+b
...     print()
...
>>> fib(1000)
0 1 1 2 3 5 8 13 21 34 55 89 144 233 377 610 987`,
    cleanScriptCode: `# File: fibonacci.py
def fib(n: int) -> None:
    a, b = 0, 1          # Gán cùng lúc 2 biến: a = 0 và b = 1
    while a < n:
        print(a, end=' ') # In trên cùng 1 dòng, cách nhau bởi dấu cách
        a, b = b, a + b   # Tính vế phải (b, a+b) trước rồi gán đồng thời cho a, b!
    print()               # Xuống dòng khi kết thúc vòng lặp

fib(1000)`,
    output: `0 1 1 2 3 5 8 13 21 34 55 89 144 233 377 610 987`,
    explanationPoints: [
      'Khối lệnh trong Python được định hình bằng dấu hai chấm (:) và thụt lề 4 dấu cách (không dùng dấu ngoặc nhọn { } như JS).',
      'a, b = b, a + b là kỹ thuật Tuple Unpacking: Python tính toàn bộ vế phải trước rồi mới gán cùng lúc vào a và b, không cần biến tạm temp!',
      'Tham số end=" " trong print(a, end=" ") giúp in các số nối tiếp nhau trên cùng một dòng thay vì mỗi số một dòng.',
    ],
    jsComparison:
      'Trong JS bạn phải viết [a, b] = [b, a + b] và dùng process.stdout.write(`${a} `).',
  },
  {
    id: 'pyorg-3-comprehension',
    slideNumber: 3,
    title: 'List Comprehension & Hàm enumerate()',
    subtitle: 'Ví dụ #4 trên trang chủ python.org — Biến đổi mảng trong 1 dòng và lấy kèm chỉ số index',
    replCode: `# List comprehensions
>>> fruits = ['Banana', 'Apple', 'Lime']
>>> loud_fruits = [fruit.upper() for fruit in fruits]
>>> print(loud_fruits)
['BANANA', 'APPLE', 'LIME']

# List and the enumerate function
>>> list(enumerate(fruits))
[(0, 'Banana'), (1, 'Apple'), (2, 'Lime')]`,
    cleanScriptCode: `# File: list_magic.py
fruits = ['Banana', 'Apple', 'Lime']

# List Comprehension: [biểu_thức for phần_tử in danh_sách]
loud_fruits = [fruit.upper() for fruit in fruits]
print(loud_fruits)

# Kết hợp thêm điều kiện lọc (if) ngay trong List Comprehension:
long_fruits = [f.upper() for f in fruits if len(f) > 4]
print(long_fruits)

# enumerate() trả về từng cặp (index, value):
print(list(enumerate(fruits)))`,
    output: `['BANANA', 'APPLE', 'LIME']
['BANANA', 'APPLE']
[(0, 'Banana'), (1, 'Apple'), (2, 'Lime')]`,
    explanationPoints: [
      '[fruit.upper() for fruit in fruits] thay thế hoàn hảo cho .map() của JavaScript.',
      '[f.upper() for f in fruits if len(f) > 4] vừa lọc (.filter) vừa biến đổi (.map) chỉ trong 1 bước duy nhất!',
      'enumerate(fruits) ghép chỉ số (0, 1, 2...) với từng phần tử thành cặp tuple (index, item), cực kỳ tiện khi duyệt vòng lặp for idx, val in enumerate(fruits):.',
    ],
    jsComparison:
      'Tương đương fruits.map(f => f.toUpperCase()) và fruits.map((f, i) => [i, f]) trong JS.',
  },
  {
    id: 'pyorg-4-numbers-division',
    slideNumber: 4,
    title: 'Số học, Chia thực `/`, Chia nguyên `//` & Lũy thừa `**`',
    subtitle: 'Ví dụ #5 trên trang chủ python.org — Tính toán trực quan và phân biệt 2 phép chia trong Python',
    replCode: `# Numbers and arithmetic operators
>>> 17 / 3    # classic division returns a float
5.666666666666667

>>> 17 // 3   # floor division discards the fractional part
5
>>> 17 % 3    # the % operator returns the remainder
2
>>> 2 ** 7    # 2 to the power of 7
128`,
    cleanScriptCode: `# File: arithmetic_demo.py
print("Chia thực (/):", 17 / 3)      # Luôn trả về số thực (float)
print("Chia lấy nguyên (//):", 17 // 3) # Làm tròn xuống số nguyên
print("Chia lấy dư (%):", 17 % 3)    # Phần dư
print("Lũy thừa (**):", 2 ** 7)      # 2 mũ 7 = 128

# Lấy cả thương nguyên và số dư cùng lúc bằng divmod():
quotient, remainder = divmod(17, 3)
print(f"17 chia 3 được {quotient}, dư {remainder}")`,
    output: `Chia thực (/): 5.666666666666667
Chia lấy nguyên (//): 5
Chia lấy dư (%): 2
Lũy thừa (**): 128
17 chia 3 được 5, dư 2`,
    explanationPoints: [
      'Phép chia 1 dấu gạch chéo (/) LUÔN trả về float (ví dụ: 4 / 2 trả về 2.0).',
      'Phép chia 2 dấu gạch chéo (//) là chia lấy phần nguyên (Floor Division), cực kỳ hữu ích khi tính chỉ số giữa mảng mid = (left + right) // 2.',
      'Số nguyên int trong Python có độ lớn tùy ý (Arbitrary Precision) — bạn có thể tính 2 ** 1000 mà không bao giờ bị tràn số (Overflow)!',
    ],
    jsComparison:
      'Trong JS bạn phải gọi Math.floor(17 / 3) vì JS không có toán tử chia nguyên //.',
  },
  {
    id: 'pyorg-5-dict-dataclass',
    slideNumber: 5,
    title: 'Dictionary (`dict`) & Object (`dataclass`) Chuẩn Hiện Đại',
    subtitle: 'Cách tạo và truy cập dữ liệu dạng Key-Value (Dict) và Object có kiểu rõ ràng (Dataclass)',
    replCode: `# Dictionary (Key-Value Map)
>>> user = {"id": 101, "name": "Alice", "roles": ["admin", "dev"]}
>>> user["name"]
'Alice'
>>> user.get("email", "chua_co@example.com")
'chua_co@example.com'

# Modern Object with @dataclass
>>> from dataclasses import dataclass
>>> @dataclass
... class Product:
...     name: str
...     price: float
...     in_stock: bool = True
>>> item = Product("MacBook", 1999.0)
>>> item.name
'MacBook'`,
    cleanScriptCode: `from dataclasses import dataclass

# 1. Dictionary: truy cập bằng ngoặc vuông user["name"] hoặc .get()
user = {"id": 101, "name": "Alice", "roles": ["admin", "dev"]}
print("Tên từ dict:", user["name"])
print("Email an toàn:", user.get("email", "chua_co@example.com"))

# 2. Dataclass Object: truy cập bằng dấu chấm item.name (có gợi ý code IDE!)
@dataclass
class Product:
    name: str
    price: float
    in_stock: bool = True

item = Product(name="MacBook", price=1999.0)
print("Object dataclass:", item)
print("Giá:", item.price)`,
    output: `Tên từ dict: Alice
Email an toàn: chua_co@example.com
Object dataclass: Product(name='MacBook', price=1999.0, in_stock=True)
Giá: 1999.0`,
    explanationPoints: [
      'Khác biệt số 1 cần nhớ cho người từ JS sang: Trong Python, dict dùng user["name"] (KHÔNG viết được user.name).',
      'Dùng user.get("key", default) để đọc key an toàn mà không bị văng lỗi KeyError nếu key chưa tồn tại.',
      'Khi muốn có một Object truy cập bằng dấu chấm (item.name, item.price) kèm kiểm tra kiểu tự động, hãy dùng @dataclass hoặc Pydantic BaseModel!',
    ],
    jsComparison:
      'dict tương đương Object/Map trong JS; @dataclass tương đương class + interface trong TypeScript.',
  },
];

/**
 * Comprehensive Catalog of All Declarations & Operations across 9 Core Categories
 */
export const QUICK_SYNTAX_DECLARATIONS: QuickSyntaxDeclarationItem[] = [
  // ===========================================================================
  // 1. XUẤT/NHẬP, BIẾN & CHUỖI (io-vars)
  // ===========================================================================
  {
    id: 'decl-variables-constants',
    category: 'io-vars',
    categoryLabel: '1. Xuất/Nhập, Biến & Chuỗi',
    title: 'Khai báo Biến, Hằng số, Gán nhiều biến & Hoán đổi giá trị',
    badge: 'Variables & Unpacking',
    summary:
      'Python không có từ khóa var/let/const. Biến được tạo ngay khi gán giá trị bằng dấu = và hỗ trợ gán/bóc tách nhiều biến trên cùng 1 dòng.',
    declarationForms: [
      {
        label: 'Khai báo biến thường (snake_case)',
        syntax: 'user_name = "An"\nuser_age = 25',
        note: 'Python tự suy luận kiểu (Dynamic Typing). Quy ước đặt tên chuẩn PEP 8 là chữ thường nối bằng dấu gạch dưới.',
      },
      {
        label: 'Khai báo kèm Type Hint (Khuyên dùng)',
        syntax: 'user_name: str = "An"\nis_active: bool = True',
        note: 'Giúp VS Code / Pyright kiểm tra kiểu và bật gợi ý hàm (IntelliSense) chính xác.',
      },
      {
        label: 'Khai báo Hằng số (UPPER_SNAKE_CASE)',
        syntax: 'from typing import Final\nMAX_RETRIES: Final[int] = 3',
        note: 'Viết hoa toàn bộ tên biến để báo hiệu hằng số; thêm Final để trình kiểm tra kiểu cấm gán lại.',
      },
      {
        label: 'Gán nhiều biến & Hoán đổi (Swap)',
        syntax: 'x, y, z = 10, 20, 30\nx, y = y, x',
        note: 'Hoán đổi giá trị 2 biến chỉ trong 1 dòng, không cần biến tạm temp.',
      },
      {
        label: 'Bóc tách phần còn lại (*rest)',
        syntax: 'first, *middle, last = [1, 2, 3, 4, 5]',
        note: 'first = 1, middle = [2, 3, 4], last = 5 (Tương tự ...rest trong JS).',
      },
      {
        label: 'Giá trị rỗng (Null / Undefined)',
        syntax: 'result: str | None = None',
        note: 'Python chỉ có duy nhất None (viết hoa chữ N), kiểm tra bằng if result is None:.',
      },
    ],
    codeExample: `from typing import Final

# 1. Khai báo biến & hằng số
app_name: str = "PyMastery"
MAX_USERS: Final[int] = 500
current_token: str | None = None

# 2. Gán nhiều biến & Hoán đổi (Swap) không cần biến tạm
a, b = 10, 99
a, b = b, a
print(f"Sau khi hoán đổi: a={a}, b={b}")

# 3. Bóc tách mảng với dấu sao (*rest)
head, *body, tail = [10, 20, 30, 40, 50]
print(f"head={head}, body={body}, tail={tail}")`,
    output: `Sau khi hoán đổi: a=99, b=10
head=10, body=[20, 30, 40], tail=50`,
    detailsAndGotchas: [
      'Dùng biến gạch dưới đơn (_) cho giá trị bạn không quan tâm khi unpack, ví dụ: status, _ = get_response().',
      'Luôn kiểm tra None bằng toán tử định danh: if x is None: hoặc if x is not None: (không dùng == None).',
    ],
    jsEquivalent: {
      syntax: 'let a = 10, b = 99; [a, b] = [b, a]; const [head, ...body] = arr;',
      note: 'Python không cần ngoặc vuông [ ] khi gán/unpack nhiều biến.',
    },
  },
  {
    id: 'decl-strings-fstring',
    category: 'io-vars',
    categoryLabel: '1. Xuất/Nhập, Biến & Chuỗi',
    title: 'Khai báo Chuỗi (str), f-string, Raw String & Thao tác Chuỗi',
    badge: 'Strings & f-strings',
    summary:
      'Tổng hợp mọi cách khai báo chuỗi trong Python (nháy đơn, nháy kép, chuỗi nhiều dòng, chuỗi thô r"", chuỗi định dạng f"") và các hàm xử lý chuỗi hay dùng nhất.',
    declarationForms: [
      {
        label: 'Chuỗi thường & Chuỗi nhiều dòng',
        syntax: 's1 = "Xin chào"\ns2 = """Chuỗi\nnhiều dòng"""',
        note: 'Nháy đơn \' \' và nháy kép " " hoàn toàn giống nhau. 3 dấu nháy """ """ giữ nguyên dấu xuống dòng.',
      },
      {
        label: 'f-string (Chèn biến & Định dạng số)',
        syntax: 'msg = f"Tên: {name}, Giá: {price:,.2f}"\ndebug = f"{x + y = }"',
        note: 'f"{price:,.2f}" tự thêm dấu phẩy ngăn cách hàng nghìn và lấy 2 chữ số thập phân. f"{x=}" in ra cả tên biến lẫn giá trị!',
      },
      {
        label: 'Raw String (Chuỗi thô cho Regex / Đường dẫn)',
        syntax: 'pattern = r"\\d+\\.\\d+"\nwin_path = r"C:\\Users\\Admin"',
        note: 'Tiền tố r"" giữ nguyên dấu gạch chéo ngược \\ mà không biến thành ký tự thoát (\\n, \\t).',
      },
      {
        label: 'Các hàm xử lý chuỗi phổ biến nhất',
        syntax: 's.strip() • s.lower() • s.upper() • s.split(",") • "-".join(items) • s.replace(a, b) • s.startswith("py")',
        note: 'Chuỗi trong Python là bất biến (Immutable) — mọi hàm đều trả về một chuỗi mới.',
      },
    ],
    codeExample: `name = "python mastery"
price = 1250000.5

# 1. Định dạng f-string chuyên nghiệp
print(f"Khóa học: {name.title()} | Học phí: {price:,.2f} VNĐ")
print(f"Debug nhanh biểu thức: {len(name) = }")

# 2. Cắt khoảng trắng, tách mảng (split) và nối chuỗi (join)
raw_csv = "  fastapi, pydantic, uvicorn  "
parts = [p.strip() for p in raw_csv.split(",")]
print("Danh sách sau khi tách:", parts)
print("Nối lại bằng dấu gạch ngang:", " -> ".join(parts))`,
    output: `Khóa học: Python Mastery | Học phí: 1,250,000.50 VNĐ
Debug nhanh biểu thức: len(name) = 14
Danh sách sau khi tách: ['fastapi', 'pydantic', 'uvicorn']
Nối lại bằng dấu gạch ngang: fastapi -> pydantic -> uvicorn`,
    detailsAndGotchas: [
      'Trong Python, hàm join() được gọi từ chuỗi phân cách: ", ".join(list_str) chứ KHÔNG phải list.join(", ") như JS!',
      'Để lấy độ dài chuỗi, gọi hàm tích hợp len(s) (không phải s.length).',
    ],
    jsEquivalent: {
      syntax: '`${name} ${price.toFixed(2)}` • s.trim() • s.split(",") • parts.join(" -> ")',
      note: 'Chú ý: Python dùng len(s) thay vì s.length, và sep.join(arr) thay vì arr.join(sep).',
    },
  },

  // ===========================================================================
  // 2. ÉP KIỂU & KIỂM TRA KIỂU (casting-types)
  // ===========================================================================
  {
    id: 'decl-type-casting',
    category: 'casting-types',
    categoryLabel: '2. Ép kiểu & Kiểm tra Kiểu',
    title: 'Ép kiểu Tường minh (Type Casting) & Kiểm tra Kiểu (`isinstance`)',
    badge: 'Type Conversion',
    summary:
      'Python là ngôn ngữ Strong Typing (Kiểu mạnh): KHÔNG tự động cộng chuỗi với số ("5" + 2 sẽ báo lỗi TypeError). Bạn luôn dùng hàm khởi tạo kiểu để ép kiểu tường minh.',
    declarationForms: [
      {
        label: 'Ép sang Số nguyên (int)',
        syntax: 'n = int("42")        # -> 42\nn2 = int(3.99)       # -> 3 (Cắt bỏ phần thập phân)\nb = int("1010", 2)   # -> 10 (Hệ nhị phân cơ số 2)',
        note: 'Lưu ý: int("3.14") sẽ báo lỗi ValueError! Nếu chuỗi có dấu chấm động, phải ép int(float("3.14")).',
      },
      {
        label: 'Ép sang Số thực (float) & Decimal tiền tệ',
        syntax: 'f = float("3.14")    # -> 3.14\nfrom decimal import Decimal\nmoney = Decimal("19.99")',
        note: 'Dùng float() cho tính toán khoa học; dùng Decimal("...") khi tính tiền tệ để tránh sai số 0.1 + 0.2.',
      },
      {
        label: 'Ép sang Chuỗi (str) & Boolean (bool)',
        syntax: 's = str(2026)        # -> "2026"\nis_ok = bool(1)      # -> True\nis_empty = bool([])  # -> False',
        note: 'Trong Python, 0, "", [], {}, set(), None đều có bool() là False (Falsy).',
      },
      {
        label: 'Chuyển đổi qua lại giữa các Tập hợp (list, tuple, set, dict)',
        syntax: 'unique = list(set([1, 2, 2, 3]))  # Khử trùng lặp -> [1, 2, 3]\nt = tuple([1, 2, 3])              # -> (1, 2, 3)\nd = dict([("a", 1), ("b", 2)])    # -> {"a": 1, "b": 2}',
        note: 'Ép list -> set -> list là mẹo nhanh nhất để lọc bỏ phần tử trùng lặp.',
      },
      {
        label: 'Kiểm tra kiểu dữ liệu an toàn',
        syntax: 'isinstance(x, int)\nisinstance(x, (int, float))',
        note: 'Luôn ưu tiên isinstance(x, ...) thay vì type(x) == ... vì nó hỗ trợ cả kế thừa OOP.',
      },
    ],
    codeExample: `# 1. Chuỗi <-> Số nguyên / Số thực
age_str = "28"
price_str = "99.95"
total = int(age_str) + float(price_str)
print(f"Tổng sau khi ép kiểu: {total} (Kiểu: {type(total).__name__})")

# 2. Chuyển đổi cấu trúc dữ liệu: Khử trùng mảng bằng set()
raw_tags = ["python", "fastapi", "python", "uv", "fastapi"]
unique_tags = list(dict.fromkeys(raw_tags)) # Giữ nguyên thứ tự xuất hiện!
print("Khử trùng giữ thứ tự:", unique_tags)

# 3. Kiểm tra kiểu với isinstance()
val: int | str = 42
if isinstance(val, (int, float)):
    print(f"{val} là kiểu số!")`,
    output: `Tổng sau khi ép kiểu: 127.95 (Kiểu: float)
Khử trùng giữ thứ tự: ['python', 'fastapi', 'uv']
42 là kiểu số!`,
    detailsAndGotchas: [
      'Cẩn thận bẫy bool("False"): Chuỗi "False" có độ dài > 0 nên bool("False") trả về True! Muốn parse chuỗi cấu hình, hãy dùng val.lower() in ("true", "1", "yes").',
      'Muốn khử trùng lặp của list mà vẫn giữ nguyên thứ tự ban đầu, dùng list(dict.fromkeys(items)).',
    ],
    jsEquivalent: {
      syntax: 'Number("42"), parseInt("42", 10), String(2026), Boolean(x), [...new Set(arr)]',
      note: 'Khác với JS ("5" + 2 -> "52"), Python cấm cộng ngầm định giữa str và int.',
    },
  },

  // ===========================================================================
  // 3. TOÁN TỬ (operators)
  // ===========================================================================
  {
    id: 'decl-operators-all',
    category: 'operators',
    categoryLabel: '3. Toán tử',
    title: 'Toán tử Số học, So sánh Bắc cầu, Logic, 3 ngôi, `in`, `is` & Walrus `:=`',
    badge: 'All Operators',
    summary:
      'Python thay thế các ký hiệu &&, ||, !, ===, ? : của họ ngôn ngữ C/JS bằng các từ khóa tiếng Anh tự nhiên cực kỳ dễ đọc.',
    declarationForms: [
      {
        label: 'Số học & Gán rút gọn',
        syntax: '+  -  *  / (chia thực)  // (chia nguyên)  % (lấy dư)  ** (lũy thừa)\nx += 1   (Python KHÔNG có x++ hay x--)',
        note: 'Để tăng 1 đơn vị, luôn viết x += 1.',
      },
      {
        label: 'So sánh & So sánh bắc cầu (Chained Comparison)',
        syntax: '==   !=   <   <=   >   >=\n0 <= score <= 100',
        note: 'Python cho phép viết liền 0 <= score <= 100 giống hệt toán học (tương đương score >= 0 and score <= 100).',
      },
      {
        label: 'Logic: and, or, not (Thay cho &&, ||, !)',
        syntax: 'if is_active and not is_banned:\nname = input_name or "Khách"',
        note: 'Toán tử or trả về giá trị Truthy đầu tiên (rất tiện để đặt giá trị mặc định).',
      },
      {
        label: 'Toán tử 3 ngôi (Ternary Conditional Expression)',
        syntax: 'status = "Đậu" if score >= 50 else "Trượt"',
        note: 'Đọc xuôi theo tiếng Anh: [Giá_trị_Đúng] if [Điều_kiện] else [Giá_trị_Sai].',
      },
      {
        label: 'Toán tử Thành viên (in / not in) & Định danh (is / is not)',
        syntax: '"admin" in roles      # Kiểm tra phần tử có nằm trong list/set/dict/str\nx is None             # Kiểm tra cùng trỏ tới 1 object trong RAM',
        note: 'Dùng == để so sánh GIÁ TRỊ; dùng is để kiểm tra None.',
      },
      {
        label: 'Toán tử Hải mã (Walrus Operator := — Python 3.8+)',
        syntax: 'if (n := len(items)) > 10:\n    print(f"Quá dài ({n} phần tử)")',
        note: 'Vừa gán giá trị vào biến n, vừa dùng giá trị đó để kiểm tra điều kiện ngay trong cùng 1 biểu thức.',
      },
    ],
    codeExample: `score = 85
roles = ["editor", "reviewer"]

# 1. So sánh bắc cầu + Toán tử 3 ngôi
is_valid = 0 <= score <= 100
grade = "Giỏi" if score >= 80 else ("Khá" if score >= 65 else "Trung bình")
print(f"Điểm hợp lệ: {is_valid} | Xếp loại: {grade}")

# 2. Toán tử thành viên (in / not in)
print("Có quyền editor?", "editor" in roles)
print("Không phải admin?", "admin" not in roles)

# 3. Toán tử Walrus (:=) vừa tính vừa gán trong if
data = [10, 20, 30, 40]
if (count := len(data)) >= 3:
    print(f"Mảng đủ điều kiện xử lý với {count} phần tử.")`,
    output: `Điểm hợp lệ: True | Xếp loại: Giỏi
Có quyền editor? True
Không phải admin? True
Mảng đủ điều kiện xử lý với 4 phần tử.`,
    detailsAndGotchas: [
      'Tuyệt đối không dùng is để so sánh số hoặc chuỗi (ví dụ a is 1000 hoặc s is "abc") — hãy luôn dùng == để so sánh giá trị!',
      'Kiểm tra key trong dict: "id" in user_dict chạy với tốc độ O(1) tức thì nhờ bảng băm (Hash Table).',
    ],
    jsEquivalent: {
      syntax: '&& -> and | || -> or | ! -> not | cond ? a : b -> a if cond else b | arr.includes(x) -> x in arr',
      note: 'Toán tử in trong Python dùng chung cho cả Array (list), Set, String và Object key (dict)!',
    },
  },

  // ===========================================================================
  // 4. ĐIỀU KIỆN & RẼ NHÁNH (control-flow)
  // ===========================================================================
  {
    id: 'decl-if-elif-match',
    category: 'control-flow',
    categoryLabel: '4. Điều kiện & Rẽ nhánh',
    title: 'Câu lệnh `if / elif / else` & `match / case` (Pattern Matching)',
    badge: 'Control Flow',
    summary:
      'Cách viết câu lệnh điều kiện rẽ nhánh truyền thống với elif và kỹ thuật khớp mẫu cấu trúc hiện đại (Structural Pattern Matching) từ Python 3.10+.',
    declarationForms: [
      {
        label: 'Cấu trúc if / elif / else chuẩn',
        syntax: 'if temp > 35:\n    print("Nóng")\nelif temp >= 20:\n    print("Mát")\nelse:\n    print("Lạnh")',
        note: 'Python dùng từ khóa rút gọn elif thay vì else if.',
      },
      {
        label: 'Kiểm tra mảng/dict/chuỗi có rỗng hay không (Pythonic)',
        syntax: 'if items:          # Có phần tử (Truthy)\nif not items:      # Rỗng (Falsy)',
        note: 'Chuẩn PEP 8 khuyên viết trực tiếp if items: thay vì if len(items) > 0:.',
      },
      {
        label: 'Structural Pattern Matching (match / case — Python 3.10+)',
        syntax: 'match command:\n    case "start" | "run": ...\n    case {"type": "pay", "amount": amt} if amt > 0: ...\n    case _: ...',
        note: 'Mạnh hơn switch-case truyền thống vì bóc tách được cả cấu trúc mảng/dict và gắn điều kiện if (guard) ngay trên từng nhánh case!',
      },
    ],
    codeExample: `def handle_event(event: dict) -> str:
    # Structural Pattern Matching (Python 3.10+)
    match event:
        case {"type": "login", "user": username}:
            return f"Xin chào {username} đã đăng nhập!"
        case {"type": "payment", "amount": amount} if amount >= 1000:
            return f"Thanh toán VIP: \${amount}"
        case {"type": "payment", "amount": amount}:
            return f"Thanh toán thường: \${amount}"
        case _:
            return "Sự kiện không xác định"

print(handle_event({"type": "login", "user": "sonth"}))
print(handle_event({"type": "payment", "amount": 2500}))`,
    output: `Xin chào sonth đã đăng nhập!
Thanh toán VIP: $2500`,
    detailsAndGotchas: [
      'Trong match / case của Python, KHÔNG cần từ khóa break ở cuối mỗi nhánh — Python tự động thoát khối match ngay khi khớp nhánh đầu tiên.',
      'Nhánh case _: đóng vai trò là default (khớp mọi trường hợp còn lại).',
    ],
    jsEquivalent: {
      syntax: 'if (...) { } else if (...) { } else { } • switch (val) { case ...: break; default: ... }',
      note: 'match/case trong Python không bị hiệu ứng "fall-through" như switch trong JS.',
    },
  },

  // ===========================================================================
  // 5. VÒNG LẶP (loops)
  // ===========================================================================
  {
    id: 'decl-loops-for-while',
    category: 'loops',
    categoryLabel: '5. Vòng lặp',
    title: 'Vòng lặp `for`, `while`, `range()`, `enumerate()` & `zip()`',
    badge: 'Loops & Iteration',
    summary:
      'Python không có vòng lặp C-style for (let i = 0; i < n; i++). Mọi vòng lặp for trong Python đều là for-in duyệt trực tiếp qua từng phần tử hoặc qua bộ sinh số range().',
    declarationForms: [
      {
        label: 'Duyệt trực tiếp từng phần tử trong mảng',
        syntax: 'for item in items:\n    print(item)',
        note: 'Cách tự nhiên và nhanh nhất khi không cần chỉ số index.',
      },
      {
        label: 'Duyệt kèm chỉ số index với enumerate()',
        syntax: 'for idx, item in enumerate(items, start=0):\n    print(idx, item)',
        note: 'Có thể truyền start=1 nếu muốn đánh số thứ tự bắt đầu từ 1.',
      },
      {
        label: 'Lặp theo dãy số với range(start, stop, step)',
        syntax: 'for i in range(5):          # 0, 1, 2, 3, 4\nfor i in range(1, 10, 2):   # 1, 3, 5, 7, 9\nfor i in range(5, 0, -1):   # 5, 4, 3, 2, 1 (Đếm ngược)',
        note: 'Cận cuối stop luôn KHÔNG bao gồm (Exclusive).',
      },
      {
        label: 'Duyệt song song nhiều mảng cùng lúc với zip()',
        syntax: 'for name, score in zip(names, scores):\n    print(name, score)',
        note: 'Ghép từng cặp phần tử ở cùng vị trí của 2 hay nhiều mảng.',
      },
      {
        label: 'Vòng lặp while, break, continue & for...else',
        syntax: 'while count > 0:\n    count -= 1',
        note: 'Nhánh else: gắn sau for/while sẽ chỉ chạy nếu vòng lặp kết thúc tự nhiên (không bị ngắt bởi lệnh break).',
      },
    ],
    codeExample: `names = ["An", "Bình", "Chi"]
scores = [92, 85, 98]

# 1. Lấy cả số thứ tự (từ 1) và giá trị bằng enumerate()
for rank, name in enumerate(names, start=1):
    print(f"Hạng #{rank}: {name}")

# 2. Duyệt song song 2 danh sách bằng zip()
for name, sc in zip(names, scores):
    print(f"Học viên {name} đạt {sc} điểm")

# 3. Đếm ngược bằng range(start, stop, step)
countdown = [n for n in range(3, 0, -1)]
print("Đếm ngược:", countdown)`,
    output: `Hạng #1: An
Hạng #2: Bình
Hạng #3: Chi
Học viên An đạt 92 điểm
Học viên Bình đạt 85 điểm
Học viên Chi đạt 98 điểm
Đếm ngược: [3, 2, 1]`,
    detailsAndGotchas: [
      'Tránh viết for i in range(len(items)): rồi truy cập items[i] — hãy luôn viết for item in items: hoặc for i, item in enumerate(items):.',
      'Trong Python 3.10+, bạn có thể truyền zip(a, b, strict=True) để đảm bảo 2 mảng bắt buộc phải có cùng độ dài.',
    ],
    jsEquivalent: {
      syntax: 'for (const item of items) • items.forEach((item, idx) => ...) • while (cond)',
      note: 'Cẩn thận: for...in trong JS duyệt qua KEY/INDEX, còn for...in trong Python duyệt qua GIÁ TRỊ (giống for...of của JS)!',
    },
  },

  // ===========================================================================
  // 6. KHAI BÁO HÀM (functions)
  // ===========================================================================
  {
    id: 'decl-functions-all',
    category: 'functions',
    categoryLabel: '6. Khai báo Hàm',
    title: 'Đầy đủ các cách Khai báo Hàm (`def`, `*args`, `**kwargs`, `lambda`, `yield`, `async`)',
    badge: 'Function Declarations',
    summary:
      'Mọi biến thể khai báo hàm trong Python từ cơ bản đến nâng cao: tham số mặc định, truyền theo tên (Keyword Arguments), gom tham số (*args, **kwargs), hàm ẩn danh lambda và bất đồng bộ async def.',
    declarationForms: [
      {
        label: '1. Hàm chuẩn có Type Hints & Giá trị mặc định',
        syntax: 'def greet(name: str, title: str = "Bạn") -> str:\n    return f"Chào {title} {name}!"',
        note: 'Có thể gọi theo vị trí greet("An") hoặc gọi chỉ định tên tham số greet(title="Anh", name="An").',
      },
      {
        label: '2. Hàm trả về nhiều giá trị (Tuple Return)',
        syntax: 'def min_max(nums: list[int]) -> tuple[int, int]:\n    return min(nums), max(nums)\nlow, high = min_max([4, 1, 9])',
        note: 'Python tự động đóng gói nhiều giá trị sau return thành 1 Tuple để bạn bóc tách ngay ở nơi gọi.',
      },
      {
        label: '3. Hàm nhận số lượng tham số tùy ý (*args & **kwargs)',
        syntax: 'def log_event(event: str, *tags: str, **meta: Any) -> None:\n    # tags là tuple (...), meta là dict {...}',
        note: '*args gom mọi tham số vị trí thừa vào Tuple; **kwargs gom mọi tham số tên key=val thừa vào Dict.',
      },
      {
        label: '4. Hàm bắt buộc truyền theo tên (Keyword-Only với dấu *)',
        syntax: 'def create_user(email: str, *, is_admin: bool = False) -> dict:',
        note: 'Mọi tham số đứng sau dấu *, bắt buộc người gọi phải viết rõ tên: create_user("a@b.c", is_admin=True).',
      },
      {
        label: '5. Hàm ẩn danh 1 dòng (lambda)',
        syntax: 'square = lambda x: x ** 2\nusers.sort(key=lambda u: u["age"])',
        note: 'lambda chỉ chứa đúng 1 biểu thức duy nhất và tự động trả về kết quả biểu thức đó.',
      },
      {
        label: '6. Generator Function (yield) & Async Coroutine (async def)',
        syntax: 'def count_up(n: int):\n    for i in range(n): yield i\n\nasync def fetch_data(url: str) -> dict:\n    return await client.get(url)',
        note: 'yield tạo phần tử lười (Lazy Evaluation) tiết kiệm RAM; async def dùng với await trong AsyncIO / FastAPI.',
      },
    ],
    codeExample: `# 1. Hàm trả về nhiều giá trị cùng lúc
def analyze_scores(scores: list[int]) -> tuple[int, int, float]:
    return min(scores), max(scores), sum(scores) / len(scores)

lowest, highest, avg = analyze_scores([75, 85, 95])
print(f"Thấp nhất: {lowest}, Cao nhất: {highest}, Trung bình: {avg:.1f}")

# 2. Hàm kết hợp tham số thường, *args và **kwargs
def build_url(base: str, *paths: str, **query_params: str | int) -> str:
    full_path = "/".join([base.rstrip("/"), *paths])
    query = "&".join(f"{k}={v}" for k, v in query_params.items())
    return f"{full_path}?{query}" if query else full_path

print(build_url("https://api.dev", "v1", "users", page=2, limit=20))

# 3. Dùng hàm ẩn danh lambda làm khóa sắp xếp (key)
products = [{"name": "Chuột", "price": 25}, {"name": "Bàn phím", "price": 80}]
cheapest_first = sorted(products, key=lambda p: p["price"])
print("Sắp xếp theo giá:", [p["name"] for p in cheapest_first])`,
    output: `Thấp nhất: 75, Cao nhất: 95, Trung bình: 85.0
https://api.dev/v1/users?page=2&limit=20
Sắp xếp theo giá: ['Chuột', 'Bàn phím']`,
    detailsAndGotchas: [
      'BẪY KINH ĐIỂN: Không bao giờ đặt giá trị mặc định là mảng hay dict rỗng def add(item, bucket=[]) vì mảng mặc định đó chỉ được tạo 1 lần duy nhất và bị dùng chung giữa các lần gọi! Hãy luôn viết def add(item, bucket: list | None = None):.',
      'Nếu một hàm không có câu lệnh return, Python tự động trả về None.',
    ],
    jsEquivalent: {
      syntax: 'function fn(a, b = 1, ...args) { } • const fn = (x) => x ** 2 • async function fetch() { await ... }',
      note: 'Lambda trong Python chỉ viết trên 1 dòng biểu thức; nếu cần nhiều dòng hãy khai báo def bình thường (Python cho phép khai báo def lồng bên trong một def khác!).',
    },
  },

  // ===========================================================================
  // 7. MẢNG / LIST, TUPLE, SET & COMPREHENSION (arrays-lists)
  // ===========================================================================
  {
    id: 'decl-arrays-lists-slicing',
    category: 'arrays-lists',
    categoryLabel: '7. Mảng / List, Tuple, Set',
    title: 'Khai báo & Thao tác Mảng (`list`), Cắt lát Slicing `[::]`, `tuple` & `set`',
    badge: 'Arrays & Collections',
    summary:
      'Trong Python có 3 cấu trúc mảng/tập hợp cốt lõi: list (mảng động thay đổi được), tuple (bộ giá trị cố định bất biến) và set (tập hợp không trùng lặp, tra cứu O(1)).',
    declarationForms: [
      {
        label: 'Khai báo List, Tuple và Set',
        syntax: 'nums: list[int] = [10, 20, 30]    # List (thay đổi được)\ncoords: tuple[int, int] = (10, 20) # Tuple (bất biến - Immutable)\ntags: set[str] = {"py", "ai"}      # Set (khử trùng lặp, O(1) lookup)',
        note: 'Chú ý: Tập hợp rỗng phải viết set() (vì {} là một Dictionary rỗng!). Tuple 1 phần tử phải có dấu phẩy (42,).',
      },
      {
        label: 'Chỉ số âm (Negative Indexing) & Cắt lát (Slicing)',
        syntax: 'nums[-1]         # Phần tử cuối cùng\nnums[1:4]        # Lấy từ index 1 đến 3 (không gồm 4)\nnums[:3]         # 3 phần tử đầu\nnums[-2:]        # 2 phần tử cuối\nnums[::-1]       # Đảo ngược mảng tạo bản sao mới',
        note: 'Cú pháp cắt lát tổng quát: a[start:stop:step]. Không bao giờ văng lỗi IndexError dù stop vượt quá độ dài mảng!',
      },
      {
        label: 'Thêm / Xóa / Tìm / Sắp xếp trên List',
        syntax: 'nums.append(40)       # Thêm 1 phần tử vào cuối (như .push)\nnums.extend([50, 60]) # Nối thêm nhiều phần tử\nlast = nums.pop()     # Lấy và xóa phần tử cuối\nnums.sort()           # Sắp xếp tại chỗ (in-place)\nnew_list = sorted(nums, reverse=True) # Trả về mảng mới đã sắp xếp',
        note: 'Hàm len(nums), sum(nums), min(nums), max(nums) hoạt động trực tiếp trên mọi mảng.',
      },
      {
        label: 'Biến đổi (.map) & Lọc (.filter) bằng List Comprehension',
        syntax: 'squares = [x * x for x in nums]                 # Thay cho .map()\nevens = [x for x in nums if x % 2 == 0]         # Thay cho .filter()\nmapped_evens = [x * 10 for x in nums if x > 15] # Vừa filter vừa map!',
        note: 'Gọn, nhanh hơn .map()/.filter() và là chuẩn mực viết code Python.',
      },
    ],
    codeExample: `nums = [10, 20, 30, 40, 50]

# 1. Truy cập phần tử cuối & Cắt lát (Slicing)
print("Phần tử cuối:", nums[-1])
print("Từ vị trí 1 đến 3:", nums[1:4])
print("Đảo ngược mảng:", nums[::-1])

# 2. Thêm phần tử & Gộp mảng
nums.append(60)
combined = [*nums, 70, 80]  # Toán tử trải mảng * (giống ...spread trong JS)
print("Mảng sau khi gộp:", combined)

# 3. List Comprehension: Lọc các số >= 30 rồi nhân đôi
result = [x * 2 for x in nums if x >= 30]
print("Lọc >= 30 và nhân đôi:", result)

# 4. Phép toán Tập hợp (Set): Giao (&), Hợp (|), Hiệu (-)
backend_devs = {"An", "Bình", "Chi"}
ai_devs = {"Bình", "Dũng"}
print("Làm cả Backend lẫn AI:", backend_devs & ai_devs)`,
    output: `Phần tử cuối: 50
Từ vị trí 1 đến 3: [20, 30, 40]
Đảo ngược mảng: [50, 40, 30, 20, 10]
Mảng sau khi gộp: [10, 20, 30, 40, 50, 60, 70, 80]
Lọc >= 30 và nhân đôi: [60, 80, 100, 120]
Làm cả Backend lẫn AI: {'Bình'}`,
    detailsAndGotchas: [
      'Cẩn thận: nums.sort() sửa trực tiếp mảng gốc và trả về None! Nếu bạn viết a = nums.sort(), biến a sẽ bị gán bằng None. Hãy dùng a = sorted(nums) khi muốn nhận mảng mới.',
      'Để sao chép nông (Shallow Copy) một mảng, dùng copy_list = nums[:] hoặc nums.copy().',
    ],
    jsEquivalent: {
      syntax: 'arr.push(x) -> list.append(x) | arr.slice(1, 4) -> list[1:4] | [...a, ...b] -> [*a, *b]',
      note: 'Trong Python dùng dấu sao đơn (*arr) để spread mảng, và 2 dấu sao (**dict) để spread object/dict.',
    },
  },

  // ===========================================================================
  // 8. OBJECT: DICTIONARY, DATACLASS & CLASS OOP (objects-dicts)
  // ===========================================================================
  {
    id: 'decl-dict-operations',
    category: 'objects-dicts',
    categoryLabel: '8. Object: Dict & Class',
    title: 'Khai báo & Thao tác với Dictionary (`dict` — Key-Value Map)',
    badge: 'Dictionaries (Map)',
    summary:
      'Dictionary (dict) là cấu trúc lưu trữ cặp khóa-giá trị (key-value) tốc độ O(1) trong Python, bảo toàn thứ tự chèn từ Python 3.7+.',
    declarationForms: [
      {
        label: 'Khai báo Dictionary',
        syntax: 'user: dict[str, Any] = {"id": 1, "name": "An"}\nempty_dict = {}',
        note: 'Key trong dict phải là kiểu bất biến (str, int, tuple) và thường đặt trong dấu nháy kép.',
      },
      {
        label: 'Đọc, Thêm, Sửa & Xóa Key',
        syntax: 'name = user["name"]               # Báo lỗi KeyError nếu không có\nemail = user.get("email", "N/A")  # An toàn: trả về "N/A" nếu thiếu\nuser["role"] = "admin"            # Thêm hoặc ghi đè key\nremoved = user.pop("role", None)  # Xóa và lấy giá trị an toàn',
        note: 'Luôn ưu tiên .get(key, default) khi đọc dữ liệu từ JSON/API bên ngoài.',
      },
      {
        label: 'Gộp 2 Dictionary (Merge — Python 3.9+)',
        syntax: 'merged = defaults | custom_config\nmerged_unpack = {**defaults, **custom_config}',
        note: 'Key ở dict bên phải sẽ ghi đè lên key trùng tên ở dict bên trái.',
      },
      {
        label: 'Duyệt Dictionary & Dict Comprehension',
        syntax: 'for k, v in user.items(): ...\nsquares_map = {x: x**2 for x in range(5)}',
        note: '.keys() lấy danh sách khóa, .values() lấy giá trị, .items() lấy từng cặp (key, value).',
      },
    ],
    codeExample: `default_cfg = {"host": "localhost", "port": 8000, "debug": False}
env_cfg = {"port": 9000, "debug": True}

# 1. Gộp 2 dict bằng toán tử | (Python 3.9+)
config = default_cfg | env_cfg
print("Cấu hình sau khi gộp:", config)

# 2. Đọc an toàn với .get() và kiểm tra key với 'in'
timeout = config.get("timeout", 30)
print(f"Host: {config['host']} | Timeout mặc định: {timeout}s")

# 3. Duyệt qua cả key và value bằng .items()
for key, val in config.items():
    print(f"  - {key}: {val}")

# 4. Dict Comprehension: Đảo ngược key <-> value
port_by_service = {"api": 8000, "redis": 6379}
service_by_port = {port: svc for svc, port in port_by_service.items()}
print("Tra cứu theo cổng:", service_by_port)`,
    output: `Cấu hình sau khi gộp: {'host': 'localhost', 'port': 9000, 'debug': True}
Host: localhost | Timeout mặc định: 30s
  - host: localhost
  - port: 9000
  - debug: True
Tra cứu theo cổng: {8000: 'api', 6379: 'redis'}`,
    detailsAndGotchas: [
      'Nhắc lại quy tắc vàng: Trong Python, config["host"] dùng ngoặc vuông (KHÔNG viết config.host cho một dict thường).',
      'Khi cần gom nhóm dữ liệu hoặc đếm tần suất mà không muốn kiểm tra key đã tồn tại chưa, hãy dùng collections.defaultdict hoặc collections.Counter.',
    ],
    jsEquivalent: {
      syntax: 'const obj = { id: 1 }; const merged = { ...a, ...b }; Object.entries(obj).forEach(([k, v]) => ...)',
      note: 'Toán tử gộp dict1 | dict2 trong Python gọn hơn cả { ...dict1, ...dict2 }.',
    },
  },
  {
    id: 'decl-class-dataclass-oop',
    category: 'objects-dicts',
    categoryLabel: '8. Object: Dict & Class',
    title: 'Khai báo Object với `class` OOP, `@dataclass` & Kế thừa',
    badge: 'Classes & Dataclasses',
    summary:
      'Cách định nghĩa Class hướng đối tượng trong Python (__init__, self, @property, @staticmethod) và cách viết gọn gấp 3 lần bằng @dataclass khi lưu trữ dữ liệu.',
    declarationForms: [
      {
        label: '1. Khai báo @dataclass (Nhanh gọn cho Data Object / DTO)',
        syntax: 'from dataclasses import dataclass\n\n@dataclass\nclass User:\n    id: int\n    name: str\n    active: bool = True',
        note: 'Tự động sinh __init__, __repr__ (in đẹp) và __eq__ (so sánh 2 object theo giá trị thuộc tính!).',
      },
      {
        label: '2. Khai báo Class OOP đầy đủ với __init__ và self',
        syntax: 'class BankAccount:\n    def __init__(self, owner: str, balance: float = 0.0) -> None:\n        self.owner = owner\n        self._balance = balance\n\n    def deposit(self, amount: float) -> None:\n        self._balance += amount',
        note: 'Mọi phương thức (instance method) đều có tham số đầu tiên là self (tương đương this trong JS). Khi gọi acc.deposit(50), Python tự truyền acc vào self.',
      },
      {
        label: '3. Thuộc tính tính toán (@property) & Kế thừa (Inheritance)',
        syntax: 'class VipAccount(BankAccount):\n    @property\n    def balance(self) -> float:\n        return self._balance',
        note: '@property biến một hàm thành thuộc tính đọc bằng dấu chấm acc.balance mà không cần cặp ngoặc ()!',
      },
    ],
    codeExample: `from dataclasses import dataclass

# Cách 1: Dùng @dataclass cho các thực thể dữ liệu (DTO / Entity)
@dataclass
class Point:
    x: float
    y: float

p1 = Point(10, 20)
p2 = Point(10, 20)
print(f"In dataclass: {p1} | So sánh bằng giá trị (p1 == p2): {p1 == p2}")

# Cách 2: Class OOP đầy đủ với __init__, self và @property
class Circle:
    def __init__(self, radius: float) -> None:
        self.radius = radius

    @property
    def area(self) -> float:
        return 3.14159 * (self.radius ** 2)

c = Circle(5.0)
print(f"Bán kính: {c.radius} -> Diện tích (gọi như thuộc tính): {c.area:.2f}")`,
    output: `In dataclass: Point(x=10, y=20) | So sánh bằng giá trị (p1 == p2): True
Bán kính: 5.0 -> Diện tích (gọi như thuộc tính): 78.54`,
    detailsAndGotchas: [
      'Khi tạo đối tượng trong Python, KHÔNG dùng từ khóa new: chỉ cần gọi p = Point(10, 20) hoặc c = Circle(5.0).',
      'Khi kế thừa class Child(Parent):, dùng super().__init__(...) để gọi hàm khởi tạo của lớp cha.',
    ],
    jsEquivalent: {
      syntax: 'class Circle { constructor(radius) { this.radius = radius; } get area() { ... } }\nconst c = new Circle(5);',
      note: 'Python dùng def __init__(self, ...) thay cho constructor(...), dùng self thay cho this, và không dùng từ khóa new.',
    },
  },

  // ===========================================================================
  // 9. BẮT LỖI, ĐỌC FILE & IMPORT MODULE (errors-modules)
  // ===========================================================================
  {
    id: 'decl-try-except-with-import',
    category: 'errors-modules',
    categoryLabel: '9. Lỗi, File & Import',
    title: 'Bắt lỗi (`try / except`), Quản lý File (`with`) & Cách `import` Module',
    badge: 'Exceptions, Files & Imports',
    summary:
      'Ba trụ cột để viết chương trình Python hoàn chỉnh: bắt ngoại lệ an toàn với try/except, tự động đóng file/kết nối bằng with và tổ chức code nhiều file bằng import.',
    declarationForms: [
      {
        label: '1. Bắt và Ném Ngoại lệ (try / except / else / finally & raise)',
        syntax: 'try:\n    val = int(raw_input)\nexcept ValueError as err:\n    print(f"Lỗi ép kiểu: {err}")\nelse:\n    print("Chạy khi KHÔNG có lỗi")\nfinally:\n    print("Luôn luôn chạy")',
        note: 'Để chủ động ném lỗi, dùng từ khóa raise ValueError("Thông báo lỗi") (thay cho throw new Error trong JS).',
      },
      {
        label: '2. Đọc / Ghi File tự động đóng bằng Context Manager (with)',
        syntax: 'from pathlib import Path\ncontent = Path("data.txt").read_text(encoding="utf-8")\n\nwith open("data.txt", "w", encoding="utf-8") as f:\n    f.write("Xin chào!")',
        note: 'Khối lệnh with đảm bảo file luôn được đóng (close) ngay cả khi bên trong xảy ra lỗi.',
      },
      {
        label: '3. Các cách Import thư viện / file khác trong dự án',
        syntax: 'import math                           # Gọi: math.sqrt(16)\nfrom datetime import datetime, date   # Gọi trực tiếp: date.today()\nimport numpy as np                    # Đặt bí danh (alias)\nfrom app.services.auth import verify  # Import từ thư mục con',
        note: 'Chạy file chính ở thư mục gốc dự án bằng uv run python -m app.main để tránh lỗi ModuleNotFoundError.',
      },
    ],
    codeExample: `def safe_divide(a: float, b: float) -> float | None:
    try:
        if b == 0:
            raise ZeroDivisionError("Mẫu số không được bằng 0!")
        result = a / b
    except ZeroDivisionError as err:
        print(f"[Cảnh báo] Bắt được lỗi: {err}")
        return None
    else:
        print(f"[Thành công] Phép chia hợp lệ: {a} / {b} = {result}")
        return result
    finally:
        print("-> Kết thúc 1 lượt tính safe_divide.")

safe_divide(10, 2)
safe_divide(10, 0)`,
    output: `[Thành công] Phép chia hợp lệ: 10 / 2 = 5.0
-> Kết thúc 1 lượt tính safe_divide.
[Cảnh báo] Bắt được lỗi: Mẫu số không được bằng 0!
-> Kết thúc 1 lượt tính safe_divide.`,
    detailsAndGotchas: [
      'Không nên viết except: trống không (Bare except) vì nó nuốt luôn cả tín hiệu dừng chương trình (Ctrl+C). Hãy luôn viết ít nhất là except Exception as err:.',
      'Điểm bắt đầu chuẩn của một file script Python là khối if __name__ == "__main__": main() — khối này chỉ chạy khi file đó được thực thi trực tiếp, và không tự chạy khi file đó được import sang file khác.',
    ],
    jsEquivalent: {
      syntax: 'try { ... } catch (err) { ... } finally { ... } • throw new Error(...) • import { x } from "./mod"',
      note: 'Python có thêm nhánh else: trong khối try/except (chỉ chạy khi khối try hoàn tất mà không gặp lỗi nào).',
    },
  },
];

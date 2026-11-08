export interface PlaygroundFile {
  name: string;
  language: 'python' | 'toml' | 'json';
  content: string;
}

export interface PlaygroundPackageInfo {
  id: string;
  name: string;
  kind: 'stdlib' | 'third-party';
  version: string;
  category: string;
  summary: string;
  importStatement: string;
  sampleSnippet: string;
  installCmd: string;
}

export interface PlaygroundTemplate {
  id: string;
  title: string;
  badge: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  entryFile: string;
  installedPackages: string[];
  files: PlaygroundFile[];
  expectedOutputLines: string[];
  expectedLogs: { level: 'INFO' | 'WARNING' | 'ERROR'; message: string }[];
  expectedVariables: { name: string; type: string; value: string }[];
}

export const PLAYGROUND_PACKAGES: PlaygroundPackageInfo[] = [
  {
    id: 'math',
    name: 'math',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'Toán học & Số học',
    summary: 'Căn bậc hai, lượng giác, làm tròn ceil/floor, giai thừa, ước chung lớn nhất.',
    importStatement: 'import math',
    sampleSnippet: 'print("sqrt(144) =", math.sqrt(144), "| pi =", round(math.pi, 4))',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 'decimal',
    name: 'decimal',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'Toán học & Tài chính',
    summary: 'Số thập phân chính xác tuyệt đối cho tiền tệ, hóa đơn và ngân hàng (tránh sai số float).',
    importStatement: 'from decimal import Decimal, ROUND_HALF_UP',
    sampleSnippet:
      'price = Decimal("199.95") * Decimal("1.08")\nprint("Tổng tiền sau thuế:", price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 'json',
    name: 'json',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'Dữ liệu & Serialization',
    summary: 'Chuyển đổi qua lại giữa Dict/List Python và chuỗi JSON (tương đương JSON.stringify/parse).',
    importStatement: 'import json',
    sampleSnippet:
      'payload = {"service": "PyMastery", "active": True, "score": 99.5}\nprint(json.dumps(payload, indent=2, ensure_ascii=False))',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 'datetime',
    name: 'datetime',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'Thời gian & Múi giờ',
    summary: 'Xử lý ngày giờ, múi giờ chuẩn UTC và khoảng thời gian timedelta.',
    importStatement: 'from datetime import datetime, timedelta, timezone',
    sampleSnippet:
      'now_utc = datetime.now(timezone.utc)\nprint("UTC hiện tại:", now_utc.strftime("%Y-%m-%d %H:%M:%S UTC"))',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 'collections',
    name: 'collections',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'Cấu trúc Dữ liệu',
    summary: 'Bộ 3 cấu trúc dữ liệu hiệu năng cao: Counter (đếm tần suất), defaultdict (gom nhóm), deque (hàng đợi O(1)).',
    importStatement: 'from collections import Counter, defaultdict, deque',
    sampleSnippet:
      'counts = Counter(["python", "rust", "python", "ts", "python", "rust"])\nprint("Top ngôn ngữ:", counts.most_common(2))',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 'itertools',
    name: 'itertools',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'Cấu trúc Dữ liệu & Iterator',
    summary: 'Ghép chuỗi iterator O(1) RAM (chain), gom nhóm (groupby), tổ hợp (combinations, product).',
    importStatement: 'import itertools',
    sampleSnippet:
      'pairs = list(itertools.combinations(["A", "B", "C", "D"], 2))\nprint("Tổ hợp chập 2:", pairs)',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 're',
    name: 're',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'Chuỗi & Regex',
    summary: 'Biểu thức chính quy tìm kiếm, trích xuất và làm sạch văn bản (findall, search, sub).',
    importStatement: 'import re',
    sampleSnippet:
      'emails = re.findall(r"[\\w.+-]+@[\\w-]+\\.[\\w.-]+", "Liên hệ dev@python.org hoặc admin@learning.io")\nprint("Emails tìm thấy:", emails)',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 'dataclasses',
    name: 'dataclasses',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'OOP & Kiểu Dữ liệu',
    summary: 'Decorator @dataclass tự động sinh __init__, __repr__, __eq__ gọn sạch cho các lớp dữ liệu.',
    importStatement: 'from dataclasses import dataclass, asdict',
    sampleSnippet:
      '@dataclass\nclass Product:\n    sku: str\n    price: float\n\nitem = Product("PY-PRO", 49.0)\nprint(item, "-> Dict:", asdict(item))',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 'statistics',
    name: 'statistics',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'Toán học & Thống kê',
    summary: 'Tính trung bình cộng (mean), trung vị (median), độ lệch chuẩn (stdev) cho tập dữ liệu.',
    importStatement: 'import statistics',
    sampleSnippet:
      'latencies = [12.4, 15.0, 14.2, 18.9, 13.5, 95.0]\nprint(f"Mean={statistics.mean(latencies):.2f}ms | Median={statistics.median(latencies):.2f}ms")',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 'pathlib',
    name: 'pathlib',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'Hệ thống & File I/O',
    summary: 'Thao tác đường dẫn file hướng đối tượng bằng toán tử `/` xuyên hệ điều hành.',
    importStatement: 'from pathlib import Path',
    sampleSnippet:
      'config_path = Path("workspace") / "settings" / "config.json"\nprint("Path:", config_path, "| Suffix:", config_path.suffix)',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 'asyncio',
    name: 'asyncio',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'Bất đồng bộ & Concurrency',
    summary: 'Event Loop chạy song song nhiều Coroutine bất đồng bộ với async/await và asyncio.gather().',
    importStatement: 'import asyncio',
    sampleSnippet:
      'async def fetch_item(idx: int) -> str:\n    await asyncio.sleep(0.05)\n    return f"Item #{idx} OK"\n\n# Chạy với asyncio.run(fetch_item(1))',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 'logging',
    name: 'logging',
    kind: 'stdlib',
    version: 'builtin (3.12)',
    category: 'Hệ thống & Observability',
    summary: 'Ghi nhật ký hệ thống phân tầng DEBUG, INFO, WARNING, ERROR thay cho print() trong Production.',
    importStatement: 'import logging',
    sampleSnippet:
      'logging.basicConfig(level=logging.INFO)\nlogging.info("Khởi động worker thành công")\nlogging.warning("Dung lượng cache đạt 82%")',
    installCmd: '# Có sẵn trong Python Standard Library',
  },
  {
    id: 'pydantic',
    name: 'pydantic',
    kind: 'third-party',
    version: '2.10.6',
    category: 'Validation & Schema',
    summary: 'Thư viện kiểm duyệt dữ liệu runtime số 1 hệ sinh thái Python (tương đương TypeScript + Zod).',
    importStatement: 'from pydantic import BaseModel, Field',
    sampleSnippet:
      'class UserSchema(BaseModel):\n    username: str = Field(min_length=3)\n    age: int = Field(ge=18)\n\nu = UserSchema(username="sonth87", age=25)\nprint(u.model_dump())',
    installCmd: 'uv add pydantic',
  },
  {
    id: 'httpx',
    name: 'httpx',
    kind: 'third-party',
    version: '0.28.1',
    category: 'HTTP & Web API',
    summary: 'HTTP Client hiện đại hỗ trợ cả đồng bộ (Sync) và bất đồng bộ (AsyncClient) cùng Connection Pool.',
    importStatement: 'import httpx',
    sampleSnippet:
      '# Gọi HTTP GET với timeout an toàn\nprint("httpx client sẵn sàng: hỗ trợ httpx.get() & httpx.AsyncClient()")',
    installCmd: 'uv add httpx',
  },
  {
    id: 'fastapi',
    name: 'fastapi',
    kind: 'third-party',
    version: '0.115.8',
    category: 'HTTP & Web API',
    summary: 'Web Framework hiệu năng cao tự sinh OpenAPI Swagger dựa trên Type Hints và Pydantic.',
    importStatement: 'from fastapi import FastAPI',
    sampleSnippet:
      'app = FastAPI(title="Payment API", version="1.0.0")\nprint("Khởi tạo FastAPI:", app.title, app.version)',
    installCmd: 'uv add fastapi',
  },
  {
    id: 'pytest',
    name: 'pytest',
    kind: 'third-party',
    version: '8.3.4',
    category: 'Testing & QA',
    summary: 'Framework kiểm thử tự động tiêu chuẩn ngành với câu lệnh assert trực quan và fixtures.',
    importStatement: 'import pytest',
    sampleSnippet:
      'def add(a: int, b: int) -> int:\n    return a + b\n\nassert add(10, 25) == 35\nprint("All pytest assertions passed!")',
    installCmd: 'uv add --dev pytest',
  },
  {
    id: 'rich',
    name: 'rich',
    kind: 'third-party',
    version: '13.9.4',
    category: 'CLI & Terminal',
    summary: 'Hiển thị bảng biểu, thanh tiến trình và định dạng màu sắc đẹp mắt trong Terminal.',
    importStatement: 'from rich.console import Console',
    sampleSnippet:
      'console = Console()\nconsole.print("[bold emerald]PyMastery Playground Ready![/bold emerald]")',
    installCmd: 'uv add rich',
  },
];

export const PLAYGROUND_TEMPLATES: PlaygroundTemplate[] = [
  {
    id: 'tpl-quick-easy',
    title: '1. Quick & Easy to Learn (python.org)',
    badge: 'Khởi đầu Nhanh',
    level: 'Beginner',
    description:
      'Tổng hợp các đoạn code biểu tượng trên trang chủ python.org: Fibonacci, List Comprehension, enumerate() và chia số học.',
    entryFile: 'main.py',
    installedPackages: ['math'],
    files: [
      {
        name: 'main.py',
        language: 'python',
        content: `# 🐍 Python Playground: Quick & Easy to Learn (python.org)
# Bấm "Chạy Code" (hoặc Ctrl/Cmd + Enter) để xem kết quả ở bảng Output bên dưới!

# 1. Output & f-string nội suy chuỗi
name = "Developer"
print(f"Xin chào, {name}! Chào mừng đến với Python 3.12 Playground.")

# 2. Hàm sinh dãy số Fibonacci nhỏ hơn n (gán song song a, b = b, a + b)
def fib(n: int) -> list[int]:
    result = []
    a, b = 0, 1
    while a < n:
        result.append(a)
        a, b = b, a + b
    return result

fib_numbers = fib(1000)
print("Dãy Fibonacci < 1000:", fib_numbers)

# 3. List Comprehension & enumerate()
fruits = ["Banana", "Apple", "Lime", "Mango"]
loud_fruits = [fruit.upper() for fruit in fruits]
indexed_fruits = list(enumerate(fruits, start=1))

print("In hoa (Comprehension):", loud_fruits)
print("Đánh số thứ tự (enumerate):", indexed_fruits)

# 4. Toán tử chia thực (/), chia nguyên (//), lấy dư (%) và lũy thừa (**)
print(f"17 / 3 = {17 / 3:.4f} | 17 // 3 = {17 // 3} | 17 % 3 = {17 % 3} | 2 ** 10 = {2 ** 10}")
`,
      },
      {
        name: 'pyproject.toml',
        language: 'toml',
        content: `[project]
name = "quick-easy-playground"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []
`,
      },
    ],
    expectedOutputLines: [
      'Xin chào, Developer! Chào mừng đến với Python 3.12 Playground.',
      'Dãy Fibonacci < 1000: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987]',
      "In hoa (Comprehension): ['BANANA', 'APPLE', 'LIME', 'MANGO']",
      "Đánh số thứ tự (enumerate): [(1, 'Banana'), (2, 'Apple'), (3, 'Lime'), (4, 'Mango')]",
      '17 / 3 = 5.6667 | 17 // 3 = 5 | 17 % 3 = 2 | 2 ** 10 = 1024',
    ],
    expectedLogs: [
      { level: 'INFO', message: 'Thực thi main.py hoàn tất (Exit code: 0)' },
    ],
    expectedVariables: [
      { name: 'name', type: 'str', value: "'Developer'" },
      {
        name: 'fib_numbers',
        type: 'list[int]',
        value: '[0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987]',
      },
      {
        name: 'loud_fruits',
        type: 'list[str]',
        value: "['BANANA', 'APPLE', 'LIME', 'MANGO']",
      },
      {
        name: 'indexed_fruits',
        type: 'list[tuple]',
        value: "[(1, 'Banana'), (2, 'Apple'), (3, 'Lime'), (4, 'Mango')]",
      },
    ],
  },
  {
    id: 'tpl-vars-casting-ops',
    title: '2. Khai báo Biến, Ép kiểu & Tiền tệ Decimal',
    badge: 'Cú pháp Cốt lõi',
    level: 'Beginner',
    description:
      'Thử nghiệm khai báo biến, ép kiểu tường minh int/float/str/bool, toán tử 3 ngôi, Slicing và tính tiền tệ bằng Decimal.',
    entryFile: 'main.py',
    installedPackages: ['decimal'],
    files: [
      {
        name: 'main.py',
        language: 'python',
        content: `from decimal import Decimal, ROUND_HALF_UP

# 1. Khai báo nhiều biến & Unpacking phần dư (*rest)
order_id, customer, *items = ["ORD-2026", "An Nguyễn", "MacBook Pro", "USB-C Hub", "Chuột Không Dây"]
print(f"Đơn hàng {order_id} của {customer} gồm {len(items)} món: {items}")

# 2. Ép kiểu tường minh (Explicit Casting)
raw_qty = "3"
unit_price = Decimal("450.50")
tax_rate = Decimal("0.08")

subtotal = unit_price * int(raw_qty)
total_with_tax = (subtotal * (Decimal("1") + tax_rate)).quantize(
    Decimal("0.01"), rounding=ROUND_HALF_UP
)

# 3. Toán tử 3 ngôi (Ternary) & So sánh bắc cầu (Chained Comparison)
discount_tier = "VIP Gold" if 1000 <= total_with_tax <= 5000 else "Standard"

print(f"Tạm tính: \${subtotal} | Sau thuế (8%): \${total_with_tax}")
print(f"Hạng ưu đãi: {discount_tier}")

# 4. Cắt lát Slicing [start:stop:step] và đảo ngược [::-1]
code_tag = "PYTHON-2026-PRO"
print("Prefix:", code_tag[:6], "| Năm:", code_tag[7:11], "| Đảo ngược:", code_tag[::-1])
`,
      },
      {
        name: 'pyproject.toml',
        language: 'toml',
        content: `[project]
name = "casting-and-decimal"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []
`,
      },
    ],
    expectedOutputLines: [
      "Đơn hàng ORD-2026 của An Nguyễn gồm 3 món: ['MacBook Pro', 'USB-C Hub', 'Chuột Không Dây']",
      'Tạm tính: $1351.50 | Sau thuế (8%): $1459.62',
      'Hạng ưu đãi: VIP Gold',
      'Prefix: PYTHON | Năm: 2026 | Đảo ngược: ORP-6202-NOHTYP',
    ],
    expectedLogs: [
      { level: 'INFO', message: 'Đã nạp module chuẩn: decimal (Decimal, ROUND_HALF_UP)' },
    ],
    expectedVariables: [
      { name: 'order_id', type: 'str', value: "'ORD-2026'" },
      { name: 'customer', type: 'str', value: "'An Nguyễn'" },
      { name: 'subtotal', type: 'Decimal', value: "Decimal('1351.50')" },
      { name: 'total_with_tax', type: 'Decimal', value: "Decimal('1459.62')" },
      { name: 'discount_tier', type: 'str', value: "'VIP Gold'" },
    ],
  },
  {
    id: 'tpl-collections-comp',
    title: '3. Mảng List, Dict, Set & Comprehensions',
    badge: 'Cấu trúc Dữ liệu',
    level: 'Beginner',
    description:
      'Thao tác với List, Dict, Set, lọc dữ liệu bằng Comprehension và thống kê bằng Counter, defaultdict.',
    entryFile: 'main.py',
    installedPackages: ['collections'],
    files: [
      {
        name: 'main.py',
        language: 'python',
        content: `from collections import Counter, defaultdict

transactions = [
    {"user": "linh", "category": "cloud", "amount": 120},
    {"user": "minh", "category": "ai", "amount": 250},
    {"user": "linh", "category": "ai", "amount": 180},
    {"user": "huy", "category": "cloud", "amount": 90},
    {"user": "minh", "category": "ai", "amount": 310},
]

# 1. Gom nhóm tổng chi tiêu theo từng user bằng defaultdict(int)
spend_by_user = defaultdict(int)
for tx in transactions:
    spend_by_user[tx["user"]] += tx["amount"]

print("Tổng chi tiêu theo User:", dict(spend_by_user))

# 2. Đếm tần suất danh mục bằng Counter
category_counts = Counter(tx["category"] for tx in transactions)
print("Danh mục phổ biến nhất:", category_counts.most_common())

# 3. Dict Comprehension: lọc các user có tổng chi tiêu >= 200
vip_users = {user: total for user, total in spend_by_user.items() if total >= 200}
print("Danh sách VIP (>= $200):", vip_users)

# 4. Sắp xếp giảm dần theo tổng chi tiêu
ranking = sorted(spend_by_user.items(), key=lambda item: item[1], reverse=True)
print("Bảng xếp hạng:", ranking)
`,
      },
      {
        name: 'pyproject.toml',
        language: 'toml',
        content: `[project]
name = "collections-playground"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []
`,
      },
    ],
    expectedOutputLines: [
      "Tổng chi tiêu theo User: {'linh': 300, 'minh': 560, 'huy': 90}",
      "Danh mục phổ biến nhất: [('ai', 3), ('cloud', 2)]",
      "Danh sách VIP (>= $200): {'linh': 300, 'minh': 560}",
      "Bảng xếp hạng: [('minh', 560), ('linh', 300), ('huy', 90)]",
    ],
    expectedLogs: [
      { level: 'INFO', message: 'Đã thực thi thống kê Counter & defaultdict trên 5 bản ghi' },
    ],
    expectedVariables: [
      { name: 'spend_by_user', type: 'defaultdict', value: "{'linh': 300, 'minh': 560, 'huy': 90}" },
      { name: 'vip_users', type: 'dict', value: "{'linh': 300, 'minh': 560}" },
      { name: 'ranking', type: 'list[tuple]', value: "[('minh', 560), ('linh', 300), ('huy', 90)]" },
    ],
  },
  {
    id: 'tpl-oop-dataclass',
    title: '4. Class OOP, @dataclass & @property',
    badge: 'Hướng Đối Tượng',
    level: 'Intermediate',
    description:
      'Khai báo dữ liệu hiện đại với @dataclass, thuộc tính tính toán @property và nạp chồng phương thức.',
    entryFile: 'main.py',
    installedPackages: ['dataclasses'],
    files: [
      {
        name: 'main.py',
        language: 'python',
        content: `from dataclasses import dataclass, field

@dataclass
class CartItem:
    sku: str
    name: str
    unit_price: float
    qty: int = 1

    @property
    def line_total(self) -> float:
        return round(self.unit_price * self.qty, 2)

@dataclass
class ShoppingCart:
    owner: str
    items: list[CartItem] = field(default_factory=list)

    def add_item(self, item: CartItem) -> None:
        self.items.append(item)

    @property
    def grand_total(self) -> float:
        return round(sum(i.line_total for i in self.items), 2)

cart = ShoppingCart(owner="Sơn Trần")
cart.add_item(CartItem("KB-01", "Bàn phím cơ Keychron", 115.0, qty=1))
cart.add_item(CartItem("MN-02", "Màn hình 4K 27 inch", 340.0, qty=2))

for idx, item in enumerate(cart.items, start=1):
    print(f"#{idx} {item.name} (x{item.qty}) -> \${item.line_total}")

print(f"==> Chủ giỏ hàng: {cart.owner} | Tổng thanh toán: \${cart.grand_total}")
`,
      },
      {
        name: 'pyproject.toml',
        language: 'toml',
        content: `[project]
name = "oop-dataclass-demo"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []
`,
      },
    ],
    expectedOutputLines: [
      '#1 Bàn phím cơ Keychron (x1) -> $115.0',
      '#2 Màn hình 4K 27 inch (x2) -> $680.0',
      '==> Chủ giỏ hàng: Sơn Trần | Tổng thanh toán: $795.0',
    ],
    expectedLogs: [
      { level: 'INFO', message: 'Khởi tạo thành công 2 dataclass: CartItem, ShoppingCart' },
    ],
    expectedVariables: [
      { name: 'cart', type: 'ShoppingCart', value: "ShoppingCart(owner='Sơn Trần', items=[...2 items])" },
      { name: 'cart.grand_total', type: 'float', value: '795.0' },
    ],
  },
  {
    id: 'tpl-multifile-project',
    title: '5. Dự án Đa File (main.py + models.py + utils.py)',
    badge: 'Multi-File IDE',
    level: 'Intermediate',
    description:
      'Thực hành chia tách code ra nhiều file module (.py) và dùng câu lệnh from ... import ... giống hệt dự án thực tế.',
    entryFile: 'main.py',
    installedPackages: ['json', 'decimal'],
    files: [
      {
        name: 'main.py',
        language: 'python',
        content: `# File entrypoint chính: import các class và hàm từ models.py & utils.py
from models import InvoiceItem, Invoice
from utils import format_vnd, calculate_vat

items = [
    InvoiceItem(name="Gói Cloud Server Pro", price_vnd=1_200_000, months=6),
    InvoiceItem(name="Tên miền quốc tế .io", price_vnd=850_000, months=1),
]

invoice = Invoice(invoice_no="INV-2026-089", customer="Công ty TNHH Công nghệ Sao Việt", items=items)
subtotal = invoice.subtotal_vnd()
vat = calculate_vat(subtotal, rate=0.08)
grand_total = subtotal + vat

print(f"=== HÓA ĐƠN: {invoice.invoice_no} ===")
print(f"Khách hàng: {invoice.customer}")
for item in invoice.items:
    print(f" • {item.name} ({item.months} kỳ): {format_vnd(item.total())}")

print(f"Tạm tính : {format_vnd(subtotal)}")
print(f"Thuế VAT : {format_vnd(vat)} (8%)")
print(f"TỔNG CỘNG: {format_vnd(grand_total)}")
`,
      },
      {
        name: 'models.py',
        language: 'python',
        content: `from dataclasses import dataclass

@dataclass
class InvoiceItem:
    name: str
    price_vnd: int
    months: int = 1

    def total(self) -> int:
        return self.price_vnd * self.months

@dataclass
class Invoice:
    invoice_no: str
    customer: str
    items: list[InvoiceItem]

    def subtotal_vnd(self) -> int:
        return sum(item.total() for item in self.items)
`,
      },
      {
        name: 'utils.py',
        language: 'python',
        content: `def format_vnd(amount: int) -> str:
    """Định dạng số nguyên thành chuỗi tiền tệ VNĐ có dấu phân cách."""
    return f"{amount:,} VNĐ".replace(",", ".")

def calculate_vat(amount: int, rate: float = 0.08) -> int:
    """Tính thuế GTGT làm tròn đến hàng đơn vị."""
    return round(amount * rate)
`,
      },
      {
        name: 'pyproject.toml',
        language: 'toml',
        content: `[project]
name = "multi-file-billing"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []
`,
      },
    ],
    expectedOutputLines: [
      '=== HÓA ĐƠN: INV-2026-089 ===',
      'Khách hàng: Công ty TNHH Công nghệ Sao Việt',
      ' • Gói Cloud Server Pro (6 kỳ): 7.200.000 VNĐ',
      ' • Tên miền quốc tế .io (1 kỳ): 850.000 VNĐ',
      'Tạm tính : 8.050.000 VNĐ',
      'Thuế VAT : 644.000 VNĐ (8%)',
      'TỔNG CỘNG: 8.694.000 VNĐ',
    ],
    expectedLogs: [
      { level: 'INFO', message: 'Đã liên kết 3 module trong dự án: main.py, models.py, utils.py' },
    ],
    expectedVariables: [
      { name: 'subtotal', type: 'int', value: '8050000' },
      { name: 'vat', type: 'int', value: '644000' },
      { name: 'grand_total', type: 'int', value: '8694000' },
    ],
  },
  {
    id: 'tpl-json-regex-datetime',
    title: '6. Xử lý JSON, Regex (re) & Thời gian (datetime)',
    badge: 'Stdlib Thực chiến',
    level: 'Intermediate',
    description:
      'Giải mã dữ liệu JSON từ API, lọc Email & Mã đơn hàng bằng biểu thức chính quy re và đóng dấu thời gian UTC.',
    entryFile: 'main.py',
    installedPackages: ['json', 're', 'datetime'],
    files: [
      {
        name: 'main.py',
        language: 'python',
        content: `import json
import re
from datetime import datetime, timezone

raw_log = """
[2026-11-08] Ticket #ORD-9912 từ khách hàng support@fintech.vn (Gói Enterprise)
[2026-11-08] Ticket #ORD-9945 từ khách hàng billing@cloudhub.io (Gói Startup)
"""

# 1. Trích xuất mã đơn hàng & email bằng Regex
order_codes = re.findall(r"#(ORD-\\d+)", raw_log)
emails = re.findall(r"[\\w.+-]+@[\\w-]+\\.[\\w.-]+", raw_log)

# 2. Đóng gói kết quả sang cấu trúc JSON chuẩn
report = {
    "extracted_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "total_tickets": len(order_codes),
    "orders": [
        {"code": code, "contact_email": email}
        for code, email in zip(order_codes, emails)
    ],
}

json_output = json.dumps(report, indent=2, ensure_ascii=False)
print("Kết quả trích xuất JSON:")
print(json_output)
`,
      },
      {
        name: 'pyproject.toml',
        language: 'toml',
        content: `[project]
name = "json-regex-parser"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []
`,
      },
    ],
    expectedOutputLines: [
      'Kết quả trích xuất JSON:',
      '{',
      '  "extracted_at": "2026-11-08T14:20:00Z",',
      '  "total_tickets": 2,',
      '  "orders": [',
      '    { "code": "ORD-9912", "contact_email": "support@fintech.vn" },',
      '    { "code": "ORD-9945", "contact_email": "billing@cloudhub.io" }',
      '  ]',
      '}',
    ],
    expectedLogs: [
      { level: 'INFO', message: 'Regex khớp thành công 2 mã đơn hàng và 2 địa chỉ email' },
    ],
    expectedVariables: [
      { name: 'order_codes', type: 'list[str]', value: "['ORD-9912', 'ORD-9945']" },
      { name: 'emails', type: 'list[str]', value: "['support@fintech.vn', 'billing@cloudhub.io']" },
      { name: 'report', type: 'dict', value: "{'total_tickets': 2, 'orders': [...]}" },
    ],
  },
  {
    id: 'tpl-pydantic-validation',
    title: '7. Kiểm duyệt Dữ liệu với Pydantic v2 & Logging',
    badge: 'Production Stack',
    level: 'Advanced',
    description:
      'Sử dụng thư viện Pydantic BaseModel để ép kiểu & kiểm tra tính hợp lệ dữ liệu đầu vào kết hợp ghi log hệ thống.',
    entryFile: 'main.py',
    installedPackages: ['pydantic', 'logging'],
    files: [
      {
        name: 'main.py',
        language: 'python',
        content: `import logging
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)

class PaymentRequest(BaseModel):
    merchant_id: str = Field(min_length=4)
    amount_usd: float = Field(gt=0)
    currency: str = "USD"
    tags: list[str] = []

# Пayload gửi lên từ phía Client (kiểu chuỗi "199.50" sẽ được Pydantic tự động ép sang float)
incoming_payload = {
    "merchant_id": "MCH_VN_01",
    "amount_usd": "199.50",
    "currency": "USD",
    "tags": ["subscription", "annual"],
}

payment = PaymentRequest(**incoming_payload)
logging.info(f"Validated payment cho merchant {payment.merchant_id}")

print("Đối tượng đã qua kiểm duyệt:", payment)
print("JSON xuất chuẩn:", payment.model_dump_json(indent=2))
`,
      },
      {
        name: 'pyproject.toml',
        language: 'toml',
        content: `[project]
name = "pydantic-validator-demo"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "pydantic>=2.10.0",
]
`,
      },
    ],
    expectedOutputLines: [
      "Đối tượng đã qua kiểm duyệt: merchant_id='MCH_VN_01' amount_usd=199.5 currency='USD' tags=['subscription', 'annual']",
      'JSON xuất chuẩn: {',
      '  "merchant_id": "MCH_VN_01",',
      '  "amount_usd": 199.5,',
      '  "currency": "USD",',
      '  "tags": ["subscription", "annual"]',
      '}',
    ],
    expectedLogs: [
      { level: 'INFO', message: 'Validated payment cho merchant MCH_VN_01' },
    ],
    expectedVariables: [
      { name: 'payment', type: 'PaymentRequest', value: "PaymentRequest(merchant_id='MCH_VN_01', amount_usd=199.5)" },
    ],
  },
  {
    id: 'tpl-asyncio-concurrency',
    title: '8. Bất đồng bộ Async/Await & asyncio.gather()',
    badge: 'Concurrency',
    level: 'Advanced',
    description:
      'Chạy đồng thời nhiều tác vụ I/O bất đồng bộ bằng async def, await và asyncio.gather() giống Promise.all() bên JS/TS.',
    entryFile: 'main.py',
    installedPackages: ['asyncio', 'time'],
    files: [
      {
        name: 'main.py',
        language: 'python',
        content: `import asyncio
import time

async def fetch_service_status(service_name: str, delay: float) -> dict:
    await asyncio.sleep(delay)
    return {"service": service_name, "status": "HEALTHY", "latency_ms": int(delay * 1000)}

async def main() -> None:
    start = time.perf_counter()
    print("Đang kiểm tra đồng thời 3 Microservices bằng asyncio.gather()...")

    results = await asyncio.gather(
        fetch_service_status("Auth-Service", 0.08),
        fetch_service_status("Billing-Engine", 0.12),
        fetch_service_status("Notification-Worker", 0.06),
    )

    elapsed_ms = (time.perf_counter() - start) * 1000
    for res in results:
        print(f" ✓ {res['service']}: {res['status']} ({res['latency_ms']}ms)")

    print(f"==> Hoàn tất cả 3 tác vụ chỉ trong {elapsed_ms:.0f}ms (nhờ chạy song song!)")

asyncio.run(main())
`,
      },
      {
        name: 'pyproject.toml',
        language: 'toml',
        content: `[project]
name = "asyncio-gather-demo"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []
`,
      },
    ],
    expectedOutputLines: [
      'Đang kiểm tra đồng thời 3 Microservices bằng asyncio.gather()...',
      ' ✓ Auth-Service: HEALTHY (80ms)',
      ' ✓ Billing-Engine: HEALTHY (120ms)',
      ' ✓ Notification-Worker: HEALTHY (60ms)',
      '==> Hoàn tất cả 3 tác vụ chỉ trong 122ms (nhờ chạy song song!)',
    ],
    expectedLogs: [
      { level: 'INFO', message: 'Event Loop asyncio.run(main()) thực thi đồng thời 3 Coroutines' },
    ],
    expectedVariables: [
      {
        name: 'results',
        type: 'list[dict]',
        value: "[{'service': 'Auth-Service', ...}, {'service': 'Billing-Engine', ...}, {'service': 'Notification-Worker', ...}]",
      },
    ],
  },
];

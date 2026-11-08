import { LessonTopic } from '@/types/curriculum.types';

export const STAGE_2_LESSONS: LessonTopic[] = [
  {
    id: 's2-comprehensions-oop',
    stageId: 'stage-2',
    level: 'advanced',
    order: 7,
    title: '2.1. Comprehensions, OOP Chuyên sâu, MRO (C3 Linearization) & Dunder Methods',
    shortDescription:
      'Viết code tốc độ C-level với List/Dict/Set Comprehension, làm chủ kiến trúc hướng đối tượng, @property, thuật toán MRO và nạp chồng Dunder Methods.',
    estimatedMinutes: 40,
    theoryParagraphs: [
      'Bước sang Giai đoạn 2, chúng ta chuyển từ "viết code chạy được" sang "hiểu cơ chế cốt lõi bên dưới CPython". Đầu tiên là **Comprehensions** (`[x * 2 for x in items if x > 0]`): không chỉ ngắn gọn hơn `map/filter`, nó còn được biên dịch sang bytecode đặc biệt `LIST_APPEND` chạy ở tầng C nhanh hơn vòng lặp `for` thông thường.',
      'Trong OOP của Python, mọi hành vi của đối tượng đều được điều khiển bởi **Data Model** thông qua các phương thức đặc biệt có 2 dấu gạch dưới ở đầu và cuối gọi là **Dunder Methods** (Magic Methods) như `__init__`, `__repr__`, `__eq__`, `__len__`, `__getitem__`, `__call__`. Khi bạn viết `len(obj)`, Python thực chất gọi `obj.__len__()`; khi bạn gọi `obj()`, Python gọi `obj.__call__()`.',
      'Khi sử dụng kế thừa (đặc biệt là đa kế thừa), Python giải quyết thứ tự tìm kiếm phương thức bằng **MRO (Method Resolution Order)** dựa trên thuật toán **C3 Linearization**. Bạn có thể kiểm tra thứ tự này bất cứ lúc nào qua `ClassName.__mro__`.',
    ],
    analogy: {
      title: 'Dunder Methods là "Các ổ cắm tiêu chuẩn Quốc tế" của Đối tượng',
      realWorldScenario:
        'Tại sao cả danh sách `list`, chuỗi `str`, từ điển `dict` và cả `Class` do bạn tự viết đều dùng chung được với hàm `len()`, vòng lặp `for`, hay toán tử `+`, `==`, `[]`?',
      mappingPoints: [
        {
          realWorld: 'Lắp phích cắm 2 chấu chuẩn cho thiết bị mới (`__len__`, `__getitem__`)',
          pythonEquivalent: 'Python Data Model Protocols',
          explanation: 'Chỉ cần Class của bạn lắp đúng ổ cắm `__len__` và `__getitem__`, toàn bộ hệ thống điện sẵn có của Python (`len()`, slicing `[1:3]`, `for x in obj`, `reversed()`) lập tức tương thích 100%!',
        },
        {
          realWorld: 'Biến một hộp công cụ thành nút bấm trực tiếp (`__call__`)',
          pythonEquivalent: 'Callable Object (`obj(arg)`)',
          explanation: 'Cho phép một đối tượng vừa lưu giữ trạng thái cấu hình trong `__init__`, vừa được gọi trực tiếp như một hàm.',
        },
        {
          realWorld: 'Sơ đồ gia phả ưu tiên từ Trái sang Phải, Con trước Cha (`MRO`)',
          pythonEquivalent: 'Thuật toán C3 Linearization (`__mro__`)',
          explanation: 'Đảm bảo trong đa kế thừa hình kim cương, lớp gốc trên cùng chỉ được gọi đúng 1 lần sau khi tất cả các nhánh con đã chạy xong.',
        },
      ],
      mentalModelTip:
        'Trong Python, đừng viết các hàm `obj.get_size()` hay `obj.to_string()` rời rạc — hãy cài đặt `__len__` và `__repr__` để đối tượng của bạn hòa nhập tự nhiên vào ngôn ngữ!',
    },
    codeExamples: [
      {
        id: 'ex-s2-1-dunder',
        title: 'Comprehensions, @property, __repr__ và __call__ (Dependency Pattern)',
        description: 'Xây dựng Domain Model chuẩn Pythonic ứng dụng trực tiếp vào kiến trúc FastAPI.',
        code: `class PriceRule:
    """Callable Object kiểm tra và áp dụng chiết khấu (tương tự Dependency trong FastAPI)"""
    def __init__(self, min_amount: float, discount_rate: float) -> None:
        self.min_amount = min_amount
        self._discount_rate = discount_rate

    @property
    def discount_rate(self) -> float:
        return self._discount_rate

    def __repr__(self) -> str:
        return f"PriceRule(min_amount={self.min_amount}, rate={self._discount_rate:.0%})"

    def __call__(self, amount: float) -> float:
        if amount >= self.min_amount:
            return round(amount * (1 - self._discount_rate), 2)
        return amount

vip_rule = PriceRule(min_amount=500.0, discount_rate=0.15)
print(vip_rule)  # Tự động gọi __repr__ -> PriceRule(min_amount=500.0, rate=15%)

# Kết hợp List Comprehension + gọi trực tiếp đối tượng vip_rule(order) nhờ __call__:
raw_orders = [200.0, 600.0, 1000.0, 350.0]
discounted = [vip_rule(amount) for amount in raw_orders if amount >= 300.0]
print(discounted)  # [510.0, 850.0, 350.0]`,
        output: `PriceRule(min_amount=500.0, rate=15%)\n[510.0, 850.0, 350.0]`,
        annotations: [
          { line: 7, explanation: '`@property` cho phép đọc `vip_rule.discount_rate` như thuộc tính thường mà vẫn bảo vệ biến `_discount_rate`.' },
          { line: 11, explanation: '`__repr__` giúp hiển thị rõ trạng thái đối tượng khi in log hoặc debug.' },
          { line: 14, explanation: '`__call__` biến thực thể `vip_rule` thành một hàm có thể gọi trực tiếp `vip_rule(amount)`.' },
          { line: 24, explanation: 'List Comprehension vừa lọc đơn hàng `>= 300.0` vừa áp dụng `vip_rule` trên 1 dòng.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Phân quyền & Kiểm tra điều kiện có tham số trong FastAPI',
        scenario: 'Tạo bộ kiểm tra quyền `RequireRoles(["admin", "manager"])` dùng chung cho nhiều API route.',
        whyPythonFits: 'Nhờ `__call__`, bạn khởi tạo `RequireRoles(["admin"])` rồi truyền thẳng vào `Depends()` của FastAPI cực kỳ thanh lịch.',
      },
    ],
    tipsAndBestPractices: [
      'Luôn cài đặt `__repr__` cho mọi Class nghiệp vụ để tiết kiệm hàng giờ debug.',
      'Sử dụng Dict Comprehension `{x.id: x for x in items}` để lập chỉ mục (index) danh sách đối tượng giúp tra cứu `O(1)` thay vì dùng `find()` lặp đi lặp lại.',
    ],
    commonIssues: [
      {
        id: 'issue-s2-late-binding',
        title: 'Bẫy Late Binding Closure khi tạo danh sách hàm trong Comprehension',
        severity: 'warning',
        symptom: 'Tất cả các hàm tạo ra trong vòng lặp đều trả về cùng một kết quả của phần tử cuối cùng.',
        whyItHappens:
          'Biến vòng lặp `i` trong `lambda x: x * i` được tra cứu tại thời điểm GỌI HÀM (khi vòng lặp đã kết thúc và `i` mang giá trị cuối cùng), chứ không phải thời điểm tạo hàm.',
        wrongCode: `multipliers = [lambda x: x * i for i in range(4)]\n# Mọi hàm đều nhân với 3 (giá trị cuối cùng của i)!\nprint([fn(10) for fn in multipliers])  # [30, 30, 30, 30]`,
        rightCode: `# Bắt giữ giá trị hiện tại của i bằng tham số mặc định i=i (khởi tạo lúc define-time):\nmultipliers = [lambda x, i=i: x * i for i in range(4)]\nprint([fn(10) for fn in multipliers])  # [0, 10, 20, 30]`,
        fixExplanation: 'Khai thác tính chất "tham số mặc định được tính ngay lúc định nghĩa hàm" (`i=i`) để khóa chặt giá trị của mỗi vòng lặp.',
      },
    ],
    jsComparison: [
      {
        concept: 'Biến đổi & Lọc danh sách',
        jsTsWay: 'arr.filter(x => x >= 300).map(x => vipRule(x))',
        pythonWay: '[vip_rule(x) for x in arr if x >= 300]',
        jsCode: `const res = orders.filter(x => x >= 300).map(x => applyRule(x));`,
        pythonCode: `res = [apply_rule(x) for x in orders if x >= 300]`,
        keyDifference: 'List Comprehension trong Python không tạo mảng trung gian như `.filter().map()` của JS nên tiết kiệm bộ nhớ và nhanh hơn.',
      },
    ],
    relatedTermIds: ['concept-list-comp', 'dunder-init', 'dunder-repr', 'dunder-call', 'fn-property', 'concept-mro'],
    relatedLessonIds: ['s2-generators-decorators-ctx', 's2-typing-dataclasses'],
    relatedExerciseIds: ['ex-s2-mini-router'],
  },
  {
    id: 's2-generators-decorators-ctx',
    stageId: 'stage-2',
    level: 'advanced',
    order: 5,
    title: '2.2. Iterators & Generators (yield), Decorators (Closure) & Context Managers (with)',
    shortDescription:
      'Ba vũ khí hạng nặng làm nên sức mạnh của Python: Xử lý luồng dữ liệu khổng lồ với yield, giải phẫu Decorator dưới tầng Closure và tự viết Context Manager.',
    estimatedMinutes: 45,
    theoryParagraphs: [
      '**Generator (`yield`)**: Khi cần xử lý một file log 50GB hoặc hàng triệu bản ghi từ Database, nếu bạn nạp tất cả vào `list`, chương trình sẽ tràn bộ nhớ (`MemoryError`). Hàm chứa từ khóa `yield` biến thành một Generator tuân thủ giao thức Iterator (`__iter__` và `__next__`): mỗi lần gọi `next()`, nó chỉ tính toán và trả về ĐÚNG 1 phần tử rồi tạm đóng băng trạng thái, giúp tiêu thụ chỉ vài KB RAM.',
      '**Decorator (`@decorator`)**: Là ứng dụng tinh hoa của First-Class Function và **Closure**. Một Decorator nhận vào hàm `func`, định nghĩa hàm bọc `wrapper(*args, **kwargs)` bên trong để chèn logic trước/sau (như kiểm tra quyền, đo thời gian, cache kết quả, đăng ký route `@app.get("/users")`), và trả về `wrapper`. Luôn nhớ gắn `@functools.wraps(func)` để bảo toàn metadata của hàm gốc.',
      '**Context Manager (`with`)**: Đảm bảo mọi tài nguyên mở ra (`__enter__`) đều được đóng lại an toàn (`__exit__`), bất kể có ngoại lệ xảy ra hay không. Với `@contextlib.contextmanager`, bạn có thể biến bất kỳ hàm Generator có 1 lệnh `yield` nào thành Context Manager chỉ trong 6 dòng code!',
    ],
    analogy: {
      title: 'Bộ ba Cơ chế Tự động hóa: Băng chuyền Sushi (yield) • Vỏ bọc Thông minh (@) • Quản gia Tận tụy (with)',
      realWorldScenario:
        'Hãy hình dung cách ba cơ chế này phối hợp trong một nhà hàng hiện đại:',
      mappingPoints: [
        {
          realWorld: 'Đầu bếp làm từng đĩa sushi khi khách gắp trên băng chuyền (`Generator / yield`)',
          pythonEquivalent: '`def stream_rows(): yield row`',
          explanation: 'Không bao giờ làm sẵn 10.000 đĩa chất đống gây sập bàn (tràn RAM). Khách ăn đến đâu làm đến đó (Lazy Evaluation).',
        },
        {
          realWorld: 'Cổng từ kiểm tra vé và bấm giờ tự động lắp trước cửa phòng (`Decorator`)',
          pythonEquivalent: '`@require_auth` / `@measure_time`',
          explanation: 'Căn phòng chính (hàm nghiệp vụ) không cần biết sự tồn tại của máy bấm giờ; cổng từ tự động chạy trước và sau khi khách bước vào phòng.',
        },
        {
          realWorld: 'Quản gia mở phòng, chờ khách họp xong và tự động khóa cửa/tắt điện (`Context Manager`)',
          pythonEquivalent: '`with db_transaction() as tx:`',
          explanation: 'Phần trước `yield` là mở cửa chuẩn bị; `yield` là giao phòng cho khách; khối `finally` sau `yield` là dọn dẹp bất chấp khách họp suôn sẻ hay cãi nhau bỏ về (`Exception`).',
        },
      ],
      mentalModelTip:
        'Hiểu rõ từ khóa `yield` đóng 2 vai trò: (1) Tạo luồng dữ liệu lười trong Generator, và (2) Phân tách giai đoạn Setup (`__enter__`) và Teardown (`__exit__`) trong `@contextmanager` và `FastAPI Depends()`!',
    },
    diagrams: [
      {
        id: 'diag-s2-gen-vs-list-flow',
        title: 'Sơ đồ Luồng Cấp phát Bộ nhớ: List (Eager) vs. Generator yield (Lazy Streaming)',
        subtitle: 'Tại sao xử lý 10 triệu bản ghi bằng Generator chỉ tốn 200 Bytes RAM thay vì 85 MB RAM?',
        type: 'pipeline',
        nodes: [
          {
            id: 'gen-step1',
            badge: 'Bước 1 • Gọi hàm Generator',
            title: 'Khởi tạo Khung Generator',
            subtitle: 'gen = read_lines("20GB.log")',
            detail:
              'Gọi hàm có chứa `yield` chưa thực thi dòng lệnh nào bên trong mà trả về ngay một đối tượng `generator` siêu nhẹ (~200 Bytes) chứa con trỏ lệnh.',
            highlightColor: 'sky',
          },
          {
            id: 'gen-step2',
            badge: 'Bước 2 • Gọi next(gen)',
            title: 'Chạy đến từ khóa yield',
            subtitle: 'Tính 1 phần tử -> Trả ra ngoài',
            detail:
              'Khi vòng lặp `for` gọi `next(gen)`, hàm chạy đến lệnh `yield line`, đẩy đúng 1 dòng ra ngoài và ĐÓNG BĂNG toàn bộ biến cục bộ tại chỗ.',
            highlightColor: 'amber',
          },
          {
            id: 'gen-step3',
            badge: 'Bước 3 • Tiêu thụ & Giải phóng',
            title: 'Xử lý xong Dòng hiện tại',
            subtitle: 'RAM luôn giữ ở mức O(1)',
            detail:
              'Khi chuyển sang vòng lặp kế tiếp, dòng cũ không còn tham chiếu sẽ được bộ đếm `ob_refcnt` thu hồi ngay lập tức trước khi nạp dòng mới!',
            highlightColor: 'emerald',
          },
          {
            id: 'gen-step4',
            badge: 'Bước 4 • Kết thúc',
            title: 'Tín hiệu StopIteration',
            subtitle: 'Tự động đóng vòng lặp for',
            detail:
              'Khi hàm chạy hết dòng cuối cùng, Python tự động phát ngoại lệ `StopIteration` báo cho vòng lặp `for` dừng lại êm ái.',
            highlightColor: 'violet',
          },
        ],
        caption:
          'Cơ chế tạm dừng và tiếp tục (Suspend & Resume) của `yield` chính là tiền đề lịch sử dẫn tới sự ra đời của Coroutine `async / await` sau này!',
      },
    ],
    benchmarksAndProofs: [
      {
        id: 'proof-s2-generator-ram',
        title: 'Minh chứng Thực nghiệm: Dung lượng RAM tiêu thụ khi xử lý 10.000.000 số (`List` vs `Generator`)',
        claim:
          'Generator Expression tiết kiệm **99.999%** bộ nhớ RAM so với List Comprehension khi duyệt luồng dữ liệu một chiều.',
        methodology: 'Đo bằng `sys.getsizeof()` trên CPython 3.12 (64-bit)',
        metrics: [
          {
            label: 'Generator Expression: `gen = (x * 2 for x in range(10_000_000))`',
            valueText: '200 Bytes (0.0002 MB)',
            barPercent: 3,
            isOptimal: true,
            note: 'Chỉ lưu trạng thái con trỏ khung hàm (Frame Object), không phụ thuộc vào việc dãy có 10 số hay 10 tỷ số!',
          },
          {
            label: 'List Comprehension: `lst = [x * 2 for x in range(10_000_000)]`',
            valueText: '89,095,160 Bytes (~85 MB RAM)',
            barPercent: 96,
            note: 'Phải cấp phát mảng 10 triệu con trỏ cùng lúc trong RAM trước khi bắt đầu tính tổng.',
          },
        ],
        takeaway:
          'Khi truyền biểu thức vào `sum()`, `max()`, `min()`, `any()`, `all()`, luôn bỏ cặp ngoặc vuông `[]` để dùng Generator Expression!',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s2-2-mech',
        title: 'Kết hợp Decorator có tham số, Context Manager đo thời gian & Generator',
        description: 'Mô phỏng chính xác cách các Web Framework như FastAPI vận hành bên dưới.',
        code: `import time
from contextlib import contextmanager
from functools import wraps
from typing import Callable, Iterator

# 1. Tự viết Context Manager đo thời gian thực thi bằng @contextmanager + yield
@contextmanager
def execution_timer(label: str) -> Iterator[None]:
    start = time.perf_counter()
    try:
        yield  # Nhường quyền cho khối code bên trong 'with' chạy
    finally:
        elapsed_ms = (time.perf_counter() - start) * 1000
        print(f"[TIMER] {label}: {elapsed_ms:.2f}ms")

# 2. Decorator có tham số (3 tầng hàm sử dụng Closure)
def retry(max_attempts: int = 3):
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as exc:
                    if attempt == max_attempts:
                        raise
                    print(f"Thử lại lần {attempt} do lỗi: {exc}")
        return wrapper
    return decorator

# 3. Generator xử lý từng dòng dữ liệu lớn (Lazy Evaluation)
def chunk_reader(items: list[int], size: int) -> Iterator[list[int]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]

with execution_timer("Xử lý theo lô"):
    batches = list(chunk_reader([1, 2, 3, 4, 5], size=2))
    print("Kết quả lô:", batches)`,
        output: `Kết quả lô: [[1, 2], [3, 4], [5]]\n[TIMER] Xử lý theo lô: 0.08ms`,
        annotations: [
          { line: 11, explanation: 'Dòng `yield` tạm dừng `execution_timer`, chạy toàn bộ code trong khối `with`, rồi luôn quay lại chạy khối `finally` ở dòng 12.' },
          { line: 17, explanation: 'Decorator có tham số (`@retry(max_attempts=3)`) cần 3 tầng hàm: tầng ngoài cùng nhận cấu hình, tầng giữa nhận `func`, tầng trong cùng là `wrapper`.' },
          { line: 19, explanation: '`@wraps(func)` sao chép `__name__`, `__doc__`, `__annotations__` từ `func` sang `wrapper`.' },
          { line: 34, explanation: '`yield` phát ra từng lô nhỏ mà không nhân bản toàn bộ mảng cùng lúc.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Quản lý Database Session & Transaction trong FastAPI',
        scenario: 'Mỗi HTTP request cần mở 1 Database Session, nếu handler chạy thành công thì commit, nếu lỗi thì rollback, và cuối cùng luôn đóng kết nối.',
        whyPythonFits: 'Cơ chế `Depends(get_db)` với từ khóa `yield` trong FastAPI áp dụng nguyên lý Context Manager giúp code API hoàn toàn sạch bóng `try/finally` lặp lại.',
      },
      {
        title: 'Streaming phản hồi AI LLM (ChatGPT-style token streaming)',
        scenario: 'Trả từng từ (token) từ mô hình ngôn ngữ lớn về trình duyệt ngay khi sinh ra.',
        whyPythonFits: '`StreamingResponse` trong FastAPI nhận trực tiếp một Generator (`yield token`) để đẩy dữ liệu qua HTTP chunked transfer.',
      },
    ],
    tipsAndBestPractices: [
      'Khi chỉ cần duyệt qua biểu thức biến đổi 1 lần (ví dụ truyền vào `sum()`, `max()`, `any()`, `all()`), hãy dùng Generator Expression `sum(x * x for x in nums)` thay vì List Comprehension `sum([x * x for x in nums])` để tiết kiệm 100% RAM tạo mảng tạm.',
      'Luôn đặt `yield` trong `try ... finally` khi viết `@contextmanager`.',
    ],
    commonIssues: [
      {
        id: 'issue-s2-exhausted-gen',
        title: 'Bẫy Generator cạn kiệt (Exhausted Iterator) khi duyệt lần thứ 2',
        severity: 'critical',
        symptom: 'Lần đầu tính `sum(data)` ra kết quả đúng, nhưng dòng ngay sau đó lặp qua `data` lại thấy rỗng hoàn toàn `[]`!',
        whyItHappens:
          'Generator chỉ sinh dữ liệu 1 chiều và không lưu trữ lại các phần tử đã đi qua. Khi con trỏ chạm `StopIteration`, nó vĩnh viễn rỗng.',
        wrongCode: `evens = (x for x in [1, 2, 3, 4] if x % 2 == 0)  # Generator Expression\nprint("Tổng:", sum(evens))       # 6 (Đã tiêu thụ hết Generator!)\nprint("Danh sách:", list(evens)) # [] -> RỖNG VÌ ĐÃ CẠN KIỆT!`,
        rightCode: `# Nếu cần dùng lại nhiều lần và dữ liệu vừa phải, hãy dùng List Comprehension:\nevens = [x for x in [1, 2, 3, 4] if x % 2 == 0]\nprint("Tổng:", sum(evens))       # 6\nprint("Danh sách:", list(evens)) # [2, 4]`,
        fixExplanation: 'Chỉ dùng Generator cho luồng dữ liệu duyệt 1 lần (single-pass). Nếu cần truy cập lại nhiều lần, hãy lưu thành `list` hoặc tạo hàm sinh Generator mới.',
      },
    ],
    jsComparison: [
      {
        concept: 'Decorator & Higher-Order Function',
        jsTsWay: 'Higher-Order Function wrap(fn) hoặc TS Experimental/Stage 3 @Decorator (chỉ gắn được lên Class/Method)',
        pythonWay: 'Decorator @my_decorator gắn được lên cả hàm độc lập (def), phương thức lẫn Class!',
        jsCode: `const timedFetch = withTiming(fetchUsers);`,
        pythonCode: `@with_timing\ndef fetch_users(): ...`,
        keyDifference: 'Trong Python, Decorator là công cụ hạng nhất (First-class syntax) dùng cho cả hàm thường, giúp `@app.get()`, `@pytest.fixture`, `@lru_cache` cực kỳ phổ biến.',
      },
    ],
    relatedTermIds: ['kw-yield', 'concept-generator', 'concept-decorator', 'concept-closure', 'kw-with', 'concept-context-manager', 'dunder-enter', 'dunder-iter'],
    relatedLessonIds: ['s2-comprehensions-oop', 's2-typing-dataclasses', 's4-fastapi-di-pydantic'],
    relatedExerciseIds: ['ex-s2-mini-router', 'ex-s2-log-generator'],
  },
  {
    id: 's2-typing-dataclasses',
    stageId: 'stage-2',
    level: 'advanced',
    order: 6,
    title: '2.3. Hệ thống Type Hints Hiện đại (Python 3.11+), Protocol & @dataclass',
    shortDescription:
      'Đạt chuẩn Static Typing 100% tương đương TypeScript với Union (|), Generic, Protocol (Structural Typing) và Value Objects bằng @dataclass.',
    estimatedMinutes: 30,
    theoryParagraphs: [
      'Từ Python 3.10 và 3.11+, cú pháp Type Hints đã trở nên cực kỳ hiện đại và sạch sẽ: bạn dùng trực tiếp `list[str]`, `dict[str, int]` (không cần `from typing import List, Dict` cũ kỹ) và toán tử hợp `int | None` (thay cho `Optional[int]`).',
      'Đối với lập trình viên yêu thích `interface` của TypeScript, Python cung cấp `typing.Protocol`. Khác với kế thừa lớp trừu tượng (`ABC`), `Protocol` kiểm tra kiểu theo cấu trúc (**Structural Subtyping / Static Duck Typing**): bất kỳ class nào có đủ phương thức trùng tên và kiểu chữ ký đều tự động thỏa mãn `Protocol` mà không cần `extends/ kế thừa` tường minh!',
      'Để tạo các lớp chứa dữ liệu nội bộ (Domain Entities, Value Objects), `@dataclass(slots=True, frozen=True)` giúp loại bỏ hoàn toàn code lặp lại đồng thời giảm tới 40% bộ nhớ RAM nhờ cơ chế `__slots__`.',
    ],
    analogy: {
      title: 'Protocol là "Tiêu chuẩn Khớp nối Lego" (Duck Typing có Kiểm định)',
      realWorldScenario:
        'Triết lý nổi tiếng của Python là Duck Typing: "Nếu nó đi như vịt và kêu như vịt, thì nó là con vịt". Nhưng làm sao để trình kiểm tra kiểu `Pyright` biết chắc nó biết kêu trước khi chạy chương trình?',
      mappingPoints: [
        {
          realWorld: 'Bản vẽ quy định kích thước chốt cắm Lego (`typing.Protocol`)',
          pythonEquivalent: '`class PaymentGateway(Protocol): def charge(self, amount: int) -> bool: ...`',
          explanation: 'Không bắt buộc viên gạch phải do hãng nào sản xuất (không cần kế thừa chung 1 class cha), miễn có đúng chốt cắm `charge(amount: int) -> bool` là lắp vừa khít và được Pyright thông qua!',
        },
        {
          realWorld: 'Khay đựng linh kiện đúc khuôn cố định siêu nhẹ (`@dataclass(slots=True)`)',
          pythonEquivalent: '`__slots__` bên trong `@dataclass`',
          explanation: 'Thay vì mỗi đối tượng mang theo cả một cuốn từ điển `__dict__` cồng kềnh, `slots=True` đúc sẵn đúng bấy nhiêu ô nhớ cố định.',
        },
      ],
      mentalModelTip:
        'Dùng `@dataclass` cho dữ liệu nội bộ đã sạch trong ứng dụng; dùng `Pydantic BaseModel` cho dữ liệu biên giới cần kiểm tra/ép kiểu từ bên ngoài (JSON API, `.env`, message queue).',
    },
    codeExamples: [
      {
        id: 'ex-s2-3-typing',
        title: 'Protocol (TypeScript-style Interface) & Immutable @dataclass',
        description: 'Thiết kế kiến trúc lỏng lẻo (Loose Coupling) dễ dàng viết Unit Test & Mock.',
        code: `from dataclasses import dataclass, field
from typing import Protocol

# 1. Định nghĩa Interface theo cấu trúc bằng Protocol
class EmailSender(Protocol):
    def send_email(self, to: str, subject: str) -> bool:
        ...

# 2. Value Object bất biến & tối ưu RAM với @dataclass
@dataclass(frozen=True, slots=True)
class Invoice:
    invoice_id: str
    customer_email: str
    items: list[str] = field(default_factory=list)
    total: float = 0.0

# Class này KHÔNG cần kế thừa EmailSender nhưng vẫn khớp hoàn toàn với Protocol!
class SmtpService:
    def send_email(self, to: str, subject: str) -> bool:
        print(f"Đang gửi tới {to}: {subject}")
        return True

def notify_invoice(invoice: Invoice, mailer: EmailSender) -> bool:
    return mailer.send_email(
        to=invoice.customer_email,
        subject=f"Hóa đơn #{invoice.invoice_id}: {invoice.total:,.0f}đ",
    )

inv = Invoice("INV-01", "khach@congty.vn", ["Khóa học Python Pro"], 1_500_000)
notify_invoice(inv, SmtpService())`,
        output: `Đang gửi tới khach@congty.vn: Hóa đơn #INV-01: 1,500,000đ`,
        annotations: [
          { line: 5, explanation: '`Protocol` tương đương 100% với `interface EmailSender` trong TypeScript.' },
          { line: 10, explanation: '`frozen=True` ngăn chặn việc sửa đổi `inv.total = 0` sau khi khởi tạo; `slots=True` tối ưu bộ nhớ.' },
          { line: 14, explanation: '`field(default_factory=list)` tạo một `list` mới an toàn cho mỗi thực thể `Invoice`.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Đảo ngược phụ thuộc (Dependency Inversion) trong Clean Architecture',
        scenario: 'Tầng `Service` chỉ phụ thuộc vào `UserRepositoryProtocol` thay vì phụ thuộc cứng vào SQLAlchemy.',
        whyPythonFits: 'Khi chạy Unit Test, bạn chỉ cần truyền một `FakeUserRepository` có cùng tên hàm mà không cần kế thừa hay chạm tới Database thật.',
      },
    ],
    tipsAndBestPractices: [
      'Trong `@dataclass`, luôn dùng `field(default_factory=list)` cho các trường kiểu `list`/`dict` — Python thậm chí sẽ chủ động báo lỗi `ValueError` nếu bạn viết `items: list = []` để bảo vệ bạn khỏi bẫy Mutable Default!',
      'Bật chế độ `typeCheckingMode = "standard"` hoặc `"strict"` cho Pyright trong `pyproject.toml`.',
    ],
    commonIssues: [
      {
        id: 'issue-s2-runtime-types',
        title: 'Bẫy 5 (PDF): Type Hints không tự kiểm tra lúc Runtime',
        severity: 'warning',
        symptom: 'Khai báo `age: int` nhưng truyền chuỗi `"hai mươi"` lúc chạy chương trình vẫn không báo lỗi ngay tại dòng gán.',
        whyItHappens:
          'Giống như TypeScript sau khi biên dịch sang JS sẽ xóa thông tin kiểu, CPython chỉ lưu Type Hints vào `__annotations__` chứ không tốn CPU kiểm tra ở mọi phép gán lúc chạy.',
        wrongCode: `def calculate_birth_year(age: int) -> int:\n    # Nếu truyền age="25" từ JSON chưa validate, lỗi chỉ nổ khi thực hiện phép trừ!\n    return 2026 - age`,
        rightCode: `from pydantic import BaseModel\n\nclass AgePayload(BaseModel):\n    age: int  # Pydantic tự động validate & ép kiểu "25" -> 25 lúc Runtime!`,
        fixExplanation: 'Kết hợp bộ đôi: Dùng `Pyright` trong CI/CD để bắt lỗi tĩnh khi viết code, và dùng `Pydantic` ở tầng biên API để kiểm tra dữ liệu thực tế lúc Runtime.',
      },
    ],
    jsComparison: [
      {
        concept: 'Interface & Structural Typing',
        jsTsWay: 'interface EmailSender { sendEmail(to: string): boolean; }',
        pythonWay: 'class EmailSender(Protocol): def send_email(self, to: str) -> bool: ...',
        jsCode: `interface Logger { log(msg: string): void }`,
        pythonCode: `class Logger(Protocol):\n    def log(self, msg: str) -> None: ...`,
        keyDifference: 'Cả hai đều sử dụng Structural Typing (kiểm tra theo hình dáng phương thức chứ không bắt buộc kế thừa `implements`).',
      },
    ],
    relatedTermIds: ['concept-type-hints', 'concept-dataclass', 'eco-pydantic', 'eco-uv'],
    relatedLessonIds: ['s2-generators-decorators-ctx', 's3-modules-testing'],
    relatedExerciseIds: ['ex-s2-mini-router'],
  },
];

import { GlossaryTerm } from '@/types/glossary.types';

export const CONCEPTS_GLOSSARY: GlossaryTerm[] = [
  {
    id: 'concept-pass-by-object-ref',
    term: 'Pass-by-Object-Reference',
    aliases: ['Object Reference', 'Tham chiếu đối tượng'],
    category: 'concept',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Mô hình bộ nhớ cốt lõi của Python: Biến KHÔNG phải là chiếc hộp chứa giá trị, mà là "nhãn dán" (Sticky Note) gắn lên đối tượng.',
    detailedExplanation:
      'Trong C/C++, khai báo biến là cấp phát một chiếc hộp cố định trong RAM. Trong Python, mọi thứ đều là Object nằm trên Heap, còn biến chỉ là chiếc nhãn tên (name binding) gắn vào Object đó. Khi gán `b = a`, Python chỉ dán thêm một nhãn `b` vào cùng đối tượng mà `a` đang trỏ tới.',
    analogy:
      'Hãy tưởng tượng một quả bóng bay (Object trong RAM) được buộc sợi dây ghi tên `a`. Khi viết `b = a`, bạn không bơm thêm quả bóng thứ hai, mà chỉ buộc thêm sợi dây thứ hai ghi tên `b` vào CÙNG quả bóng đó! Nếu quả bóng thuộc loại có thể vẽ lên được (`list`, `dict` - Mutable), người cầm dây `b` vẽ lên bóng thì người cầm dây `a` cũng thấy hình vẽ đó.',
    syntaxExample: `a = [1, 2, 3]\nb = a          # b và a cùng trỏ vào 1 list duy nhất trong RAM\nb.append(4)\nprint(a)       # [1, 2, 3, 4] -> a bị thay đổi theo!`,
    commonGotcha:
      'Nếu bạn viết `b = [9, 9]` (gán lại/rebind), lúc này bạn tháo sợi dây `b` ra buộc sang quả bóng mới `[9, 9]`, nên `a` vẫn giữ nguyên `[1, 2, 3, 4]`. Phân biệt rõ giữa Mutating (`b.append`) và Rebinding (`b = ...`)!',
    jsEquivalent: 'Reference Copy đối với Object/Array trong JS',
    relatedTerms: ['kw-is', 'concept-shallow-deep-copy', 'concept-mutable-default'],
  },
  {
    id: 'concept-mutable-default',
    term: 'Mutable Default Arguments',
    aliases: ['Tham số mặc định khả biến'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Cái bẫy số 1 trong Python: Dùng `list = []` hoặc `dict = {}` làm tham số mặc định khiến dữ liệu bị dùng chung giữa mọi lần gọi hàm!',
    detailedExplanation:
      'Trong Python, biểu thức mặc định của tham số hàm chỉ được khởi tạo ĐÚNG MỘT LẦN DUY NHẤT khi trình thông dịch đọc dòng `def` (define time) và lưu vào thuộc tính `func.__defaults__`. Do đó mọi lần gọi hàm không truyền đối số sẽ thao tác trực tiếp trên cùng một `list` đó.',
    analogy:
      'Giống như nhà hàng tuyên bố: "Khách nào không mang bát riêng sẽ được phát 1 chiếc bát mặc định", nhưng nhà hàng chỉ mua ĐÚNG 1 CHIẾC BÁT từ ngày khai trương! Khách thứ nhất ăn thừa tương ớt trong bát, khách thứ hai bước vào dùng tiếp chính chiếc bát còn nguyên tương ớt của khách trước.',
    syntaxExample: `# SAI LẦM KINH ĐIỂN:\ndef add_tag_wrong(tag: str, tags: list[str] = []) -> list[str]:\n    tags.append(tag)\n    return tags\n\n# CHUẨN PYTHONIC (Luôn dùng None làm sentinel):\ndef add_tag_correct(tag: str, tags: list[str] | None = None) -> list[str]:\n    if tags is None:\n        tags = []\n    tags.append(tag)\n    return tags`,
    commonGotcha:
      'Lập trình viên chuyển từ JS/TS sang cực kỳ dễ dính bẫy này vì trong JS `function add(x, arr = [])` tạo mảng mới ở mỗi lần gọi hàm (call time).',
    jsEquivalent: 'Trong JS khởi tạo lúc Call-time, còn Python khởi tạo lúc Define-time!',
    relatedTerms: ['kw-def', 'kw-none', 'type-list'],
  },
  {
    id: 'concept-shallow-deep-copy',
    term: 'Shallow Copy',
    aliases: ['Deep Copy', 'copy.deepcopy'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Phân biệt sao chép nông (chỉ tạo vỏ mới cấp 1, các phần tử con lồng nhau vẫn dùng chung địa chỉ) và sao chép sâu (`copy.deepcopy`).',
    detailedExplanation:
      'Khi dùng `b = a.copy()` hoặc `b = a[:]`, Python tạo ra một danh sách vỏ ngoài mới, nhưng các phần tử bên trong (như các `dict` hoặc `list` con ở tầng thứ 2) vẫn chỉ sao chép con trỏ tham chiếu. Muốn nhân bản độc lập toàn bộ cây dữ liệu nhiều tầng, bắt buộc dùng `copy.deepcopy(a)`.',
    analogy:
      'Shallow Copy giống như photo một tờ danh bạ của nhóm: bạn có một tờ giấy mới trên tay, nhưng số điện thoại căn hộ chung của nhóm ghi trên đó vẫn trỏ về cùng một ngôi nhà thật. Còn `deepcopy` là xây mới toàn bộ cả ngôi nhà lẫn nội thất bên trong.',
    syntaxExample: `import copy\n\nmatrix = [[1, 2], [3, 4]]\nshallow = matrix.copy()        # Chỉ copy vỏ ngoài\ndeep = copy.deepcopy(matrix)   # Copy toàn bộ các tầng\n\nmatrix[0][0] = 999\nprint(shallow[0][0])  # 999 (Bị ảnh hưởng!)\nprint(deep[0][0])     # 1   (An toàn tuyệt đối!)`,
    commonGotcha:
      'Toán tử nhân danh sách `grid = [[0] * 3] * 3` tạo ra 3 hàng trỏ vào CÙNG 1 danh sách con! Gán `grid[0][0] = 1` sẽ làm cả 3 hàng đều biến thành `[1, 0, 0]`. Hãy viết `[[0] * 3 for _ in range(3)]`.',
    jsEquivalent: 'Spread {...obj} (Shallow) vs structuredClone(obj) (Deep)',
    relatedTerms: ['concept-pass-by-object-ref', 'type-list'],
  },
  {
    id: 'concept-list-comp',
    term: 'List Comprehension',
    aliases: ['Dict Comprehension', 'Set Comprehension'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Cú pháp đặc sản của Python giúp biến đổi và lọc danh sách trong 1 biểu thức ngắn gọn, chạy ở tốc độ C-level nhanh hơn vòng lặp thường.',
    detailedExplanation:
      'Cú pháp `[bieu_thuc for phan_tu in tap_hop if dieu_kien]` gộp cả `map()` và `filter()` vào một biểu thức duy nhất dễ đọc. Tương tự có `{k: v for ...}` cho Dict Comprehension và `{x for ...}` cho Set Comprehension.',
    analogy:
      'Thay vì nhặt từng quả táo từ thùng cũ, kiểm tra xem có chín không rồi bỏ tay vào giỏ mới từng bước thủ công (`for` + `.append()`), List Comprehension là một dây chuyền tự động vừa lọc quả chín vừa gọt vỏ đóng hộp trong một nhịp duy nhất.',
    syntaxExample: `prices = [100, 250, 50, 400]\n# Lọc giá >= 100 và tính thuế VAT 10%:\nfinal_prices = [p * 1.1 for p in prices if p >= 100]\n\n# Dict Comprehension đảo ngược key-value:\nid_to_name = {1: "An", 2: "Bình"}\nname_to_id = {name: uid for uid, name in id_to_name.items()}`,
    commonGotcha:
      'Nếu bạn viết `(x * 2 for x in arr)` với dấu ngoặc tròn `()`, nó KHÔNG tạo ra `tuple` mà tạo ra một **Generator Expression** (tiết kiệm RAM)! Ngoài ra, đừng lồng quá 2 vòng `for` trong Comprehension vì sẽ làm giảm tính dễ đọc.',
    jsEquivalent: 'arr.filter(p => p >= 100).map(p => p * 1.1)',
    relatedTerms: ['type-list', 'concept-generator', 'kw-lambda'],
  },
  {
    id: 'concept-generator',
    term: 'Generator',
    aliases: ['Generator Expression', 'Lazy Evaluation'],
    category: 'concept',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Cơ chế sinh dữ liệu lười (Lazy Evaluation) từng phần tử một theo yêu cầu, giúp xử lý hàng chục GB dữ liệu mà chỉ tốn vài MB RAM.',
    detailedExplanation:
      'Generator được tạo bằng hàm chứa từ khóa `yield` hoặc biểu thức `(x for x in iterable)`. Thay vì nạp toàn bộ 10 triệu dòng log vào RAM cùng lúc như `list`, Generator chỉ tính toán và giữ đúng 1 phần tử hiện tại trong bộ nhớ.',
    analogy:
      'Xem phim trên Netflix (Streaming = Generator): máy tính chỉ tải từng khung hình vài MB khi bạn đang xem, thay vì phải tải hết bộ phim Bluray 80GB về ổ cứng (`List`) rồi mới được bấm Play.',
    syntaxExample: `# Tốn gần 800MB RAM vì tạo list 10 triệu số:\n# sum([x * x for x in range(10_000_000)])\n\n# Chỉ tốn vài KB RAM nhờ Generator Expression:\ntotal = sum(x * x for x in range(10_000_000))`,
    commonGotcha:
      'Generator không hỗ trợ `len(gen)` hay truy cập chỉ mục `gen[0]`, và một khi đã duyệt hết thì không thể tua lại (phải khởi tạo Generator mới).',
    jsEquivalent: 'Generator function* / AsyncGenerator / ReadableStream',
    relatedTerms: ['kw-yield', 'dunder-iter', 'concept-list-comp'],
  },
  {
    id: 'concept-decorator',
    term: 'Decorator',
    aliases: ['functools.wraps', '@decorator'],
    category: 'concept',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Hàm bậc cao dùng để bọc (wrap) một hàm hoặc class khác nhằm mở rộng hành vi (logging, auth, caching, routing) mà không sửa code gốc.',
    detailedExplanation:
      'Cú pháp `@my_decorator` đặt phía trên `def target_func():` thực chất là viết tắt của `target_func = my_decorator(target_func)`. Dưới tầng sâu, Decorator ứng dụng Closure để giữ tham chiếu tới hàm gốc và chạy logic trước/sau khi gọi hàm gốc.',
    analogy:
      'Giống như gắn thêm một ống giảm thanh hoặc kính ngắm vào một khẩu súng, hay bọc một lớp giấy gói quà có gắn chip định vị bên ngoài hộp quà: món quà bên trong không hề bị thay đổi, nhưng mỗi lần ai mở quà đều được ghi nhận.',
    syntaxExample: `from functools import wraps\nimport time\n\ndef measure_time(func):\n    @wraps(func)  # Bắt buộc có để giữ nguyên __name__ và docstring của func!\n    def wrapper(*args, **kwargs):\n        start = time.perf_counter()\n        result = func(*args, **kwargs)\n        print(f"{func.__name__} chạy hết {(time.perf_counter() - start)*1000:.2f}ms")\n        return result\n    return wrapper`,
    commonGotcha:
      'Nếu quên `@functools.wraps(func)` bên trên hàm `wrapper`, hàm gốc sẽ bị mất tên thật (`__name__` biến thành `"wrapper"`) và mất toàn bộ Type Hints/Docstring, làm hỏng tính năng tự sinh tài liệu OpenAPI của FastAPI!',
    jsEquivalent: 'Higher-Order Function (HOF) hoặc TypeScript Stage 3 @Decorator',
    relatedTerms: ['concept-closure', 'eco-fastapi', 'fn-property'],
  },
  {
    id: 'concept-closure',
    term: 'Closure',
    category: 'concept',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Hàm con ghi nhớ và truy cập được các biến của hàm bao ngoài (Enclosing Scope) ngay cả khi hàm bao ngoài đã chạy xong.',
    detailedExplanation:
      'Python lưu các biến tự do (free variables) của hàm bao ngoài vào thuộc tính đặc biệt `func.__closure__` (chứa các ô nhớ `cell`). Đây là nền tảng cốt lõi để xây dựng Decorator có tham số và Factory Function.',
    analogy:
      'Như một sinh viên tốt nghiệp rời khỏi trường đại học (hàm bao ngoài đã kết thúc), nhưng trong chiếc ba lô mang theo (`__closure__`) vẫn giữ nguyên cuốn sổ tay công thức mà thầy giáo đã trao từ thời còn trong trường.',
    syntaxExample: `def make_multiplier(factor: int):\n    def multiply(number: int) -> int:\n        return number * factor  # 'factor' được giữ sống trong __closure__\n    return multiply\n\ndouble = make_multiplier(2)\nprint(double(15))  # 30`,
    commonGotcha:
      'Bẫy Late Binding trong vòng lặp: `[lambda x: x + i for i in range(3)]` — cả 3 hàm lambda đều dùng chung giá trị cuối cùng `i = 2`! Cách sửa: bắt giá trị ngay lúc định nghĩa bằng tham số mặc định `[lambda x, i=i: x + i for i in range(3)]`.',
    jsEquivalent: 'JavaScript Closure (giống hệt cơ chế Lexical Environment)',
    relatedTerms: ['kw-nonlocal', 'concept-decorator', 'kw-lambda'],
  },
  {
    id: 'concept-context-manager',
    term: 'Context Manager',
    aliases: ['@contextmanager', 'contextlib'],
    category: 'concept',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Cơ chế quản lý vòng đời tài nguyên tự động (mở/đóng file, lock, DB transaction) thông qua khối lệnh `with`.',
    detailedExplanation:
      'Có 2 cách tạo Context Manager: (1) Viết Class có 2 phương thức `__enter__` và `__exit__`, hoặc (2) Cực kỳ ngắn gọn bằng cách dùng decorator `@contextlib.contextmanager` kết hợp từ khóa `yield` đặt trong khối `try...finally`.',
    analogy:
      'Một người quản gia chuyên nghiệp: trước khi bạn vào bàn tiệc thì trải khăn bàn sạch sẽ (phần trước `yield`), mời bạn dùng bữa (`yield`), và dù bữa tiệc kết thúc vui vẻ hay có người làm đổ rượu (`Exception`), quản gia vẫn luôn dọn dẹp sạch sẽ trong nhánh `finally`.',
    syntaxExample: `from contextlib import contextmanager\n\n@contextmanager\ndef db_transaction(session):\n    try:\n        yield session\n        session.commit()    # Thành công thì tự động commit\n    except Exception:\n        session.rollback()  # Lỗi thì tự động rollback an toàn!\n        raise\n    finally:\n        session.close()`,
    commonGotcha:
      'Khi viết Context Manager bằng `@contextmanager`, bắt buộc phải bọc `yield` bên trong khối `try ... finally:`. Nếu không có `try...finally`, khi code bên trong `with` ném lỗi, các dòng dọn dẹp phía sau `yield` sẽ KHÔNG được chạy!',
    jsEquivalent: 'try ... finally hoặc AsyncLocalStorage / Disposable',
    relatedTerms: ['kw-with', 'dunder-enter', 'kw-yield', 'eco-depends'],
  },
  {
    id: 'concept-mro',
    term: 'MRO',
    aliases: ['Method Resolution Order', 'C3 Linearization'],
    category: 'concept',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Thứ tự phân giải phương thức (Method Resolution Order) dùng thuật toán C3 Linearization để giải quyết bài toán đa kế thừa kim cương.',
    detailedExplanation:
      'Python hỗ trợ đa kế thừa (`class Child(ParentA, ParentB):`). Khi bạn gọi `self.method()` hoặc `super().method()`, Python tra cứu theo danh sách tuyến tính `Child.__mro__` được tính bằng thuật toán C3 Linearization: ưu tiên từ trái sang phải và đảm bảo lớp con luôn được xét trước lớp cha.',
    analogy:
      'Khi bạn cần hỏi ý kiến gia đình về một vấn đề: bạn hỏi bản thân trước (`Child`), không biết thì hỏi Bố (`ParentA` đứng bên trái), không có nữa mới hỏi Mẹ (`ParentB` đứng bên phải), và cuối cùng mới hỏi Ông Bà nội/ngoại (`Base`) để không hỏi trùng lặp Ông Bà 2 lần.',
    syntaxExample: `class A:\n    def ping(self): return "A"\nclass B(A):\n    def ping(self): return "B -> " + super().ping()\nclass C(A):\n    def ping(self): return "C -> " + super().ping()\nclass D(B, C):\n    pass\n\nprint(D().ping())  # "B -> C -> A" (Theo đúng thứ tự D -> B -> C -> A)`,
    commonGotcha:
      '`super()` trong Python KHÔNG nhất thiết gọi lớp cha trực tiếp (Parent), mà gọi **lớp tiếp theo trong chuỗi MRO** của thực thể hiện tại!',
    jsEquivalent: 'Prototype Chain (nhưng JS chỉ hỗ trợ đơn kế thừa class extends)',
    relatedTerms: ['fn-isinstance', 'dunder-init'],
  },
  {
    id: 'concept-gil',
    term: 'GIL',
    aliases: ['Global Interpreter Lock'],
    category: 'concept',
    level: 'master',
    stageId: 'stage-5',
    shortSummary: 'Khóa trình thông dịch toàn cục của CPython — chỉ cho phép ĐÚNG 1 Thread thực thi Python bytecode tại một thời điểm trên mỗi tiến trình.',
    detailedExplanation:
      'CPython quản lý bộ nhớ bằng cơ chế đếm tham chiếu (Reference Counting). Để tránh việc 2 thread cùng lúc tăng/giảm biến đếm tham chiếu gây hỏng bộ nhớ mà không phải gắn lock lên từng đối tượng nhỏ lẻ, CPython dùng một khóa toàn cục duy nhất là GIL. Do đó, `threading` trong Python KHÔNG giúp tăng tốc các bài toán nặng CPU (CPU-bound), nhưng vẫn chạy tốt với I/O-bound vì khi chờ I/O tầng C sẽ nhả khóa GIL. Để chạy song song đa nhân CPU thực sự, phải dùng `multiprocessing` / `ProcessPoolExecutor`.',
    analogy:
      'Hãy tưởng tượng một căn bếp nhà hàng có 4 đầu bếp (`Threads`), nhưng cả căn bếp chỉ có ĐÚNG 1 CON DAO DUY NHẤT (`GIL`). Nếu công việc là thái thịt liên tục (`CPU-bound`), 4 đầu bếp cũng không nhanh hơn 1 đầu bếp vì phải đứng chờ nhau mượn dao! Nhưng nếu công việc là hầm xương chờ 30 phút (`I/O-bound`), người thứ nhất đặt nồi lên bếp sẽ bỏ con dao xuống bàn để người thứ hai cầm dao làm việc khác.',
    syntaxExample: `from concurrent.futures import ProcessPoolExecutor\n\ndef heavy_cpu_task(n: int) -> int:\n    return sum(i * i for i in range(n))\n\n# Vượt qua GIL bằng cách tạo nhiều tiến trình (mỗi Process có 1 GIL riêng):\nwith ProcessPoolExecutor() as pool:\n    results = list(pool.map(heavy_cpu_task, [10_000_000] * 4))`,
    commonGotcha:
      'Dùng `threading.Thread` để tính toán ma trận, băm mật khẩu hay resize ảnh sẽ chạy CHẬM HƠN cả chạy đơn luồng do chi phí tranh chấp khóa GIL (context switching overhead)!',
    jsEquivalent: 'Node.js chạy 1 Main Thread (không có GIL vì không chia sẻ bộ nhớ mặc định; tương đương dùng worker_threads / child_process)',
    relatedTerms: ['concept-asyncio', 'concept-event-loop', 'kw-async'],
  },
  {
    id: 'concept-asyncio',
    term: 'AsyncIO',
    aliases: ['Event Loop', 'Coroutine'],
    category: 'concept',
    level: 'pro',
    stageId: 'stage-5',
    shortSummary: 'Mô hình lập trình đồng thời bất đồng bộ đơn luồng (Single-threaded Cooperative Multitasking) dựa trên Event Loop của Python.',
    detailedExplanation:
      'AsyncIO chạy trên 1 Thread duy nhất và 1 CPU core. Nó đạt hiệu năng xử lý hàng chục nghìn kết nối đồng thời nhờ các Coroutine chủ động nhường quyền điều khiển (`await`) mỗi khi chờ mạng/database. Tuy nhiên khác với Node.js (nơi mọi I/O mặc định đều non-blocking), trong Python bạn bắt buộc phải dùng thư viện chuẩn async (`httpx`, `asyncpg`, `aiofiles`) chứ không được gọi thư viện đồng bộ cũ (`requests`, `time.sleep`) trong hàm `async def`.',
    analogy:
      'Một đại kiện tướng cờ vua thi đấu cùng lúc với 50 đối thủ (50 kết nối HTTP): đi 1 nước ở bàn số 1 xong, trong lúc chờ đối thủ bàn 1 suy nghĩ (`await`), kiện tướng lập tức bước sang bàn số 2 đi nước tiếp theo. Nhưng nếu ở bàn số 3 kiện tướng ngồi ngủ gật 5 phút (`time.sleep(5)`), cả 49 bàn còn lại đều bị đóng băng chờ theo!',
    syntaxExample: `import asyncio\nimport httpx\n\nasync def crawl_batch(urls: list[str]):\n    sem = asyncio.Semaphore(20)  # Giới hạn tối đa 20 kết nối cùng lúc\n    async with httpx.AsyncClient() as client:\n        async def fetch_one(url: str):\n            async with sem:\n                res = await client.get(url)\n                return len(res.text)\n        return await asyncio.gather(*(fetch_one(u) for u in urls))`,
    commonGotcha:
      'Nếu bắt buộc phải gọi một thư viện đồng bộ cũ không có bản async bên trong hàm `async def`, hãy đẩy nó sang Thread Pool bằng `await asyncio.to_thread(sync_func, arg)` để không chặn đứng Event Loop!',
    jsEquivalent: 'Node.js libuv Event Loop + Promise.all()',
    relatedTerms: ['kw-async', 'concept-gil', 'eco-fastapi'],
  },
  {
    id: 'concept-type-hints',
    term: 'Type Hints',
    aliases: ['typing', 'Protocol', 'Generic'],
    category: 'concept',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Hệ thống chú thích kiểu dữ liệu tĩnh hiện đại của Python (Python 3.10+ dùng `int | None`, `list[str]`, `Protocol`).',
    detailedExplanation:
      'Type Hints giúp IDE (VS Code Pylance / PyCharm) gợi ý code chính xác 100% và cho phép công cụ kiểm tra kiểu tĩnh như `Pyright` hoặc `mypy` phát hiện lỗi trước khi chạy. Đặc biệt, `typing.Protocol` cung cấp cơ chế Structural Subtyping (Duck Typing có kiểm tra kiểu tĩnh) tương đương hệt `interface` trong TypeScript.',
    analogy:
      'Type Hints giống như nhãn phân loại dán trên các đường ống dẫn nước trong bản vẽ kỹ thuật: lúc thi công (`Pyright` kiểm tra tĩnh) kỹ sư nhìn vào biết ngay ống nào lắp sai khớp, còn khi nước chảy thật (`Runtime`) thì dòng nước cứ thế chạy không bị cản trở.',
    syntaxExample: `from typing import Protocol\n\nclass Notifier(Protocol):  # Tương đương TypeScript interface!\n    def send(self, message: str) -> bool: ...\n\ndef alert_admin(service: Notifier, text: str | None = None) -> None:\n    if text is not None:\n        service.send(text)`,
    commonGotcha:
      'Type Hints KHÔNG tự động kiểm tra kiểu lúc chương trình đang chạy (Runtime)! Viết `x: int = "hello"` Python vẫn chạy bình thường nếu không quét bằng `Pyright` hoặc dùng `Pydantic` để validate lúc runtime.',
    jsEquivalent: 'TypeScript Type Annotations & Interfaces',
    relatedTerms: ['eco-pyright', 'eco-pydantic', 'concept-dataclass'],
  },
  {
    id: 'concept-dataclass',
    term: '@dataclass',
    aliases: ['dataclasses'],
    category: 'concept',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Decorator chuẩn của Python tự động sinh `__init__`, `__repr__`, `__eq__` cho các class chuyên lưu trữ dữ liệu.',
    detailedExplanation:
      'Thay vì phải viết lặp đi lặp lại `self.a = a`, `self.b = b` trong `__init__`, bạn chỉ cần khai báo các trường kèm Type Hints và gắn `@dataclass`. Hỗ trợ `frozen=True` để biến đối tượng thành bất biến (Immutable Value Object) và `slots=True` (Python 3.10+) để giảm 40% dung lượng RAM.',
    analogy:
      'Giống như bản mẫu hợp đồng in sẵn: bạn chỉ cần liệt kê tên các mục cần điền, máy tự động tạo sẵn hàm nhập liệu, hàm in ấn và hàm đối chiếu so sánh 2 bản hợp đồng.',
    syntaxExample: `from dataclasses import dataclass, field\n\n@dataclass(frozen=True, slots=True)\nclass OrderItem:\n    sku: str\n    quantity: int = 1\n    tags: list[str] = field(default_factory=list)`,
    commonGotcha:
      '`@dataclass` KHÔNG tự động ép kiểu hay kiểm tra dữ liệu đầu vào lúc runtime (truyền `"abc"` vào trường `int` vẫn nhận). Nếu dữ liệu đến từ bên ngoài (JSON API, `.env`), hãy dùng `Pydantic BaseModel` thay vì `@dataclass`!',
    jsEquivalent: 'TypeScript Class với parameter properties / Record',
    relatedTerms: ['dunder-init', 'dunder-repr', 'eco-pydantic'],
  },
  {
    id: 'eco-uv',
    term: 'uv',
    aliases: ['pyproject.toml', 'Ruff', 'Pyright'],
    category: 'ecosystem',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Siêu công cụ quản lý gói, môi trường ảo (.venv) và phiên bản Python viết bằng Rust — nhanh gấp 10–100 lần pip/poetry.',
    detailedExplanation:
      'Trong hệ sinh thái Python hiện đại, bộ 3 công cụ Rust/TypeScript gồm `uv` (quản lý package + virtualenv + `pyproject.toml`), `Ruff` (Linter + Formatter thay thế Flake8, Black, isort) và `Pyright` (Static Type Checker) mang lại trải nghiệm mượt mà và tốc độ tương đương `pnpm` + `ESLint/Prettier` + `tsc` bên Node.js.',
    analogy:
      'Nếu `pip` + `venv` cũ kỹ là chiếc xe đạp phải tự bơm lốp và tra xích thủ công trước mỗi chuyến đi, thì `uv` là tàu cao tốc Shinkansen tự động chuẩn bị mọi thứ chỉ trong tích tắc.',
    syntaxExample: `# Khởi tạo dự án & cài thư viện giống hệt pnpm:\nuv init my-app\nuv add fastapi pydantic\nuv run ruff check --fix\nuv run pyright`,
    commonGotcha:
      'Đừng cài thư viện tràn lan vào Global Python của hệ điều hành bằng `pip install`. Hãy luôn dùng `uv add` để cô lập thư viện trong `.venv` và khóa phiên bản vào `uv.lock`!',
    jsEquivalent: 'nvm + pnpm + package.json + pnpm-lock.yaml',
    relatedTerms: ['concept-type-hints', 'eco-pytest'],
  },
  {
    id: 'eco-pydantic',
    term: 'Pydantic',
    aliases: ['BaseModel', 'Field', 'pydantic-settings'],
    category: 'ecosystem',
    level: 'pro',
    stageId: 'stage-4',
    shortSummary: 'Thư viện kiểm tra dữ liệu (Runtime Data Validation) và tuần tự hóa JSON chuẩn công nghiệp có lõi viết bằng Rust (Pydantic v2).',
    detailedExplanation:
      'Pydantic v2 đọc Type Hints của Python để kiểm tra, ép kiểu và lọc dữ liệu đầu vào lúc Runtime với tốc độ cực cao. Nó đóng cùng lúc 2 vai trò của thế giới TypeScript: vừa là `interface/type` cho IDE, vừa là bộ validator `Zod` lúc chạy thật.',
    analogy:
      'Nếu Type Hints thường chỉ là tấm biển "Khu vực dành cho khách VIP" (ai cố tình đi vào vẫn lọt), thì `Pydantic BaseModel` là cổng kiểm soát an ninh sân bay có máy quét tự động: đúng giấy tờ mới cho qua, sai định dạng lập tức trả về thông báo lỗi chi tiết từng trường.',
    syntaxExample: `from pydantic import BaseModel, EmailStr, Field, ConfigDict\n\nclass UserCreate(BaseModel):\n    email: EmailStr\n    age: int = Field(ge=18, le=120)\n    model_config = ConfigDict(from_attributes=True)`,
    commonGotcha:
      'Trong Pydantic v2, các phương thức cũ của v1 như `.dict()`, `.parse_obj()` và `class Config:` đã được thay thế bằng `.model_dump()`, `.model_validate()` và `model_config = ConfigDict(...)`!',
    jsEquivalent: 'TypeScript Interface + Zod / class-validator',
    relatedTerms: ['concept-type-hints', 'concept-dataclass', 'eco-fastapi'],
  },
  {
    id: 'eco-fastapi',
    term: 'FastAPI',
    aliases: ['Depends', 'APIRouter', 'Uvicorn'],
    category: 'ecosystem',
    level: 'pro',
    stageId: 'stage-4',
    shortSummary: 'Web Framework ASGI hiện đại, hiệu năng cao cho Python dựa trên Type Hints, Pydantic v2 và hệ thống Dependency Injection trực quan.',
    detailedExplanation:
      'FastAPI tự động validate request body/query, chuyển đổi dữ liệu trả về, sinh tài liệu tương tác OpenAPI (Swagger UI) và cung cấp cơ chế `Depends()` cực mạnh để tiêm Database Session, xác thực người dùng (`current_user`) hoặc phân quyền RBAC.',
    analogy:
      'Sự kết hợp hoàn hảo giữa tốc độ gọn nhẹ của `Fastify` và kiến trúc Decorator + Dependency Injection bài bản của `NestJS`, nhưng ngắn gọn và ít boilerplate hơn gấp nhiều lần.',
    syntaxExample: `@router.post("/students", response_model=StudentResponse, status_code=201)\nasync def create_student(\n    payload: StudentCreate,\n    db: AsyncSession = Depends(get_db_session),\n):\n    return await student_service.create(db, payload)`,
    commonGotcha:
      'Khi viết Dependency bằng hàm chứa `yield` (như `get_db_session`), hãy nhớ các dòng sau `yield` sẽ chạy SAU KHI response đã gửi hoặc khi xử lý ngoại lệ để đóng session an toàn.',
    jsEquivalent: 'NestJS / Fastify / Express',
    relatedTerms: ['eco-pydantic', 'eco-sqlalchemy', 'dunder-call', 'concept-asyncio'],
  },
  {
    id: 'eco-sqlalchemy',
    term: 'SQLAlchemy',
    aliases: ['AsyncSession', 'Mapped', 'mapped_column', 'Alembic'],
    category: 'ecosystem',
    level: 'pro',
    stageId: 'stage-4',
    shortSummary: 'Bộ công cụ SQL và ORM mạnh mẽ nhất của Python — phiên bản 2.0 hỗ trợ đầy đủ AsyncIO và Type Hints tĩnh (`Mapped[T]`).',
    detailedExplanation:
      'SQLAlchemy 2.0 kết hợp cùng Alembic (quản lý database migration) tạo thành tầng lưu trữ chuẩn mực. Với `AsyncSession` và cú pháp `select(Student).options(selectinload(...))`, bạn kiểm soát truy vấn SQL sâu sắc và chống triệt để lỗi N+1 Query.',
    analogy:
      'Một phiên dịch viên song ngữ siêu cấp giữa thế giới Object của Python và bảng quan hệ của PostgreSQL, có khả năng gom đơn hàng (`Unit of Work`) để gửi xuống Database tối ưu nhất.',
    syntaxExample: `class Student(Base):\n    __tablename__ = "students"\n    id: Mapped[int] = mapped_column(primary_key=True)\n    email: Mapped[str] = mapped_column(String(255), unique=True)`,
    commonGotcha:
      'Trong môi trường Async (`AsyncSession`), tuyệt đối không để xảy ra "Implicit Lazy Loading" khi truy cập bảng quan hệ (`student.courses`) vì I/O ngầm định không có `await` sẽ ném lỗi `MissingGreenlet`! Hãy luôn nạp trước bằng `selectinload()` hoặc `joinedload()`.',
    jsEquivalent: 'Prisma / TypeORM / Drizzle ORM',
    relatedTerms: ['eco-fastapi', 'eco-pydantic', 'concept-asyncio'],
  },
  {
    id: 'eco-pytest',
    term: 'pytest',
    aliases: ['@pytest.fixture', 'parametrize'],
    category: 'ecosystem',
    level: 'pro',
    stageId: 'stage-3',
    shortSummary: 'Framework kiểm thử tự động tiêu chuẩn của Python với cơ chế `@pytest.fixture` tiêm phụ thuộc và `assert` thông minh.',
    detailedExplanation:
      'Không cần viết các hàm `expect(a).toEqual(b)` dài dòng như Jest, `pytest` phân tích trực tiếp câu lệnh `assert a == b` của Python để in ra chi tiết giá trị sai lệch. Cơ chế `@pytest.fixture` cho phép khởi tạo và dọn dẹp DB test/HTTP client cực kỳ mô-đun.',
    analogy:
      '`@pytest.fixture` giống như nhân viên chuẩn bị phòng thí nghiệm: hàm test chỉ cần ghi tên dụng cụ cần dùng vào danh sách tham số đầu vào, `pytest` sẽ tự động mang dụng cụ đó đến bàn và tự dọn rửa sau khi thí nghiệm xong.',
    syntaxExample: `import pytest\n\n@pytest.mark.parametrize("a,b,expected", [(2, 3, 5), (0, 0, 0), (-1, 1, 0)])\ndef test_add(a: int, b: int, expected: int) -> None:\n    assert a + b == expected`,
    commonGotcha:
      'Khi test các hàm `async def`, đừng quên cài đặt `pytest-asyncio` và đánh dấu `@pytest.mark.asyncio` (hoặc cấu hình `asyncio_mode = "auto"` trong `pyproject.toml`).',
    jsEquivalent: 'Vitest / Jest',
    relatedTerms: ['kw-with', 'eco-uv', 'eco-fastapi'],
  },
  {
    id: 'concept-cpython',
    term: 'CPython',
    aliases: ['PVM', 'Bytecode', '__pycache__'],
    category: 'concept',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Bản thực thi chuẩn và phổ biến nhất của Python (viết bằng ngôn ngữ C): biên dịch mã nguồn .py sang Bytecode (.pyc) rồi chạy trên máy ảo PVM.',
    detailedExplanation:
      'CPython là trình thông dịch gốc từ `python.org`. Khi bạn chạy code, CPython không đọc từng dòng văn bản thô mà dịch sang cây cú pháp AST -> sinh mã Bytecode trung gian (lưu đệm trong `__pycache__/*.pyc`) -> rồi đưa vào vòng lặp máy ảo PVM (Python Virtual Machine) để thực thi.',
    analogy:
      'Giống như đầu bếp dịch công thức tiếng Anh (`.py`) sang phiếu tốc ký mã hóa (`Bytecode .pyc`) rồi giao cho dây chuyền máy móc bằng thép (`PVM viết bằng C`) vận hành.',
    syntaxExample: `import dis\ndef add(a: int, b: int) -> int:\n    return a + b\ndis.dis(add)  # Xem các lệnh Bytecode thực tế của CPython`,
    commonGotcha:
      'Thư mục `__pycache__/` chứa các file `.pyc` chỉ là bộ nhớ đệm tăng tốc độ `import` của CPython — tuyệt đối không commit `__pycache__/` lên Git!',
    jsEquivalent: 'V8 Engine (Node.js) biên dịch JS sang Ignition Bytecode',
    relatedTerms: ['concept-gil', 'eco-uv', 'concept-pass-by-object-ref'],
  },
  {
    id: 'concept-venv',
    term: '.venv',
    aliases: ['Virtual Environment', 'venv', 'pyenv', '.python-version'],
    category: 'ecosystem',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Môi trường ảo cô lập thư viện và phiên bản Python riêng biệt cho từng dự án, tránh làm bẩn Python của hệ điều hành.',
    detailedExplanation:
      'Thư mục `.venv/` nằm ngay trong dự án của bạn chứa bản liên kết tới đúng phiên bản Python (ví dụ 3.12) và thư mục `site-packages/` riêng để cài đặt các gói thư viện của dự án đó. Kết hợp với file `.python-version` và công cụ `uv` (hoặc `pyenv`), bạn có thể switch phiên bản Python tự động giữa nhiều dự án.',
    analogy:
      'Mỗi dự án là một căn hộ khép kín có tủ đồ riêng (`.venv`) và đồng hồ điện riêng (`.python-version`), không dùng chung đồ đạc lộn xộn ngoài hành lang hệ điều hành.',
    syntaxExample: `# Tạo .venv và khóa phiên bản Python 3.12 với uv:\nuv python pin 3.12\nuv venv\nuv add fastapi`,
    commonGotcha:
      'Không bao giờ gõ `sudo pip install` cài thẳng thư viện vào hệ điều hành (sẽ gặp lỗi `externally-managed-environment` PEP 668) và không bao giờ đẩy thư mục `.venv/` lên Git!',
    jsEquivalent: 'Thư mục node_modules/ + .nvmrc',
    relatedTerms: ['eco-uv', 'concept-cpython'],
  },
  {
    id: 'dunder-name-main',
    term: '__name__',
    aliases: ['__main__', 'if __name__ == "__main__"'],
    category: 'dunder',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Biến đặc biệt giúp phân biệt một file .py đang được chạy trực tiếp (`"__main__"`) hay đang được file khác `import` làm thư viện.',
    detailedExplanation:
      'Khi bạn chạy trực tiếp `python app.py` (hoặc `python -m app`), CPython tự động gán `__name__ = "__main__"` cho file đó. Ngược lại, nếu một file khác gọi `import app`, thì bên trong `app.py`, biến `__name__` sẽ mang giá trị là `"app"`.',
    analogy:
      'Giống như hỏi một ca sĩ: "Hôm nay bạn đứng hát chính trên sân khấu (`__main__`) hay chỉ gửi bản thu âm cho người khác ghép nhạc (`import`)?".',
    syntaxExample: `def main() -> None:\n    print("Chạy chương trình chính")\n\nif __name__ == "__main__":\n    main()`,
    commonGotcha:
      'Nếu đặt code thực thi (hoặc `multiprocessing` trên Windows/macOS) ở ngoài cùng mà không bọc trong `if __name__ == "__main__":`, khi file khác `import` module đó, code sẽ tự động chạy ngoài ý muốn!',
    jsEquivalent: 'import.meta.main / require.main === module',
    relatedTerms: ['concept-cpython', 'kw-def'],
  },
  {
    id: 'type-decimal',
    term: 'Decimal',
    aliases: ['decimal.Decimal', 'math.isclose'],
    category: 'builtin_type',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Kiểu số thập phân chính xác tuyệt đối trong thư viện chuẩn `decimal`, khắc phục hoàn toàn sai số nhị phân `0.1 + 0.2 != 0.3` của `float`.',
    detailedExplanation:
      'Kiểu `float` dùng chuẩn nhị phân 64-bit IEEE 754 nên `0.1 + 0.2` ra `0.30000000000000004`. Kiểu `Decimal` lưu trữ số theo hệ cơ số 10 giống hệt cách con người tính toán trên giấy, bắt buộc dùng cho mọi bài toán Tiền tệ, Ngân hàng, Thuế và Hóa đơn.',
    analogy:
      '`float` là thước dây đo ước lượng khoa học (nhanh nhưng lẻ ở vạch phân số nhị phân), còn `Decimal` là máy đếm tiền ngân hàng chính xác đến từng xu.',
    syntaxExample: `from decimal import Decimal\n\n# Luôn truyền chuỗi (str) vào Decimal:\ntotal = Decimal("0.10") + Decimal("0.20")\nprint(total == Decimal("0.30"))  # True!`,
    commonGotcha:
      'Bắt buộc truyền chuỗi `Decimal("0.1")`, TUYỆT ĐỐI KHÔNG truyền số thực `Decimal(0.1)` vì `0.1` đã bị sai số nhị phân ngay trước khi truyền vào hàm!',
    jsEquivalent: 'Thư viện decimal.js / big.js trong JS',
    relatedTerms: ['kw-is', 'eco-pydantic'],
  },
  {
    id: 'concept-strong-typing',
    term: 'Strong Typing',
    aliases: ['Dynamic Typing', 'Type Casting', 'Explicit Conversion'],
    category: 'concept',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Python là ngôn ngữ kiểu động nhưng mạnh (Dynamic & Strong Typing): biến không cố định kiểu, nhưng giá trị không tự động ép kiểu ngầm giữa các kiểu khác bản chất.',
    detailedExplanation:
      'Strong Typing nghĩa là Python không tự đổi chuỗi sang số hay ngược lại khi thực hiện phép toán (ví dụ `"5" + 3` báo lỗi `TypeError` ngay lập tức). Muốn chuyển đổi, bạn phải gọi hàm constructor tường minh như `int("5")`, `float("3.5")`, hoặc `str(3)`.',
    analogy:
      'Giống như ổ cắm điện có chốt an toàn: phích cắm 3 chân không thể tự ép nhét vào ổ 2 chân mà phải dùng đầu chuyển đổi rõ ràng.',
    syntaxExample: `age_str = "20"\n# age_str + 1  -> TypeError!\nage = int(age_str) + 1  # 21\nlabel = "Tuổi: " + str(age)`,
    commonGotcha:
      '`int("3.5")` sẽ báo lỗi `ValueError` vì chuỗi chứa dấu chấm thập phân. Phải chuyển qua `float("3.5")` trước rồi mới ép sang `int(float("3.5"))`.',
    jsEquivalent: 'Khác hẳn JavaScript (Weak Typing: "5" + 3 tự thành "53", "5" - 3 tự thành 2)',
    relatedTerms: ['fn-int', 'fn-str', 'fn-float', 'fn-isinstance'],
  },
  {
    id: 'concept-short-circuit',
    term: 'Short-Circuit Evaluation',
    aliases: ['Short-Circuit', 'Truthy', 'Falsy', 'Truthy / Falsy'],
    category: 'concept',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Toán tử `and` và `or` dừng đánh giá ngay khi đã biết chắc kết quả, và trả về chính giá trị quyết định đó (không chỉ trả về True/False).',
    detailedExplanation:
      'Trong Python, mọi giá trị đều là Truthy ngoại trừ nhóm Falsy (`False`, `None`, `0`, `0.0`, `""`, `[]`, `{}`, `set()`, `()`). Toán tử `a and b` trả về `a` ngay nếu `a` là Falsy, ngược lại trả về `b`. Toán tử `a or b` trả về `a` ngay nếu `a` là Truthy, ngược lại trả về `b`.',
    analogy:
      'Đi qua 2 trạm kiểm soát (`and`): nếu trạm 1 đã đóng cửa (Falsy) thì quay về luôn không cần đi tới trạm 2.',
    syntaxExample: `# Bảo vệ phép chia cho 0 nhờ Short-Circuit:\nif count > 0 and (total / count) > 5:\n    print("Đạt")\n\n# Giá trị mặc định khi nickname rỗng (""):\ndisplay_name = nickname or "Khách"`,
    commonGotcha:
      'Trong Python, list rỗng `[]` và dict rỗng `{}` đều là Falsy! Ngoài ra viết `if x == "a" or "b":` luôn luôn đúng vì `"b"` là chuỗi không rỗng (Truthy) — phải viết `if x in ("a", "b"):`.',
    jsEquivalent: 'Tương tự && và || trong JS, nhưng trong JS [] và {} lại là Truthy!',
    relatedTerms: ['kw-and', 'kw-or', 'kw-not', 'fn-bool'],
  },
  {
    id: 'concept-slicing',
    term: 'Slicing',
    aliases: ['Slice Notation'],
    category: 'concept',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Cú pháp cắt lát `seq[start:stop:step]` trích xuất một phần của chuỗi, list hoặc tuple trong khoảng `[start, stop)` (dừng trước `stop`).',
    detailedExplanation:
      'Python đánh chỉ số 2 chiều: từ trái sang phải (`0 .. n-1`) và từ phải sang trái (`-1 .. -n`). Khi cắt lát `s[start:stop:step]`, nếu bỏ trống `start` sẽ lấy từ đầu, bỏ trống `stop` sẽ lấy đến hết, và `step = -1` (`s[::-1]`) giúp đảo ngược dãy.',
    analogy:
      'Đặt hai lưỡi dao tại vạch số `start` và vạch số `stop` trên thước đo để lấy phần nằm giữa hai lưỡi dao.',
    syntaxExample: `s = "PYTHON"\nprint(s[1:4])   # "YTH" (lấy index 1, 2, 3 - dừng trước 4)\nprint(s[:3])    # "PYT"\nprint(s[-2:])   # "ON"\nprint(s[::-1])  # "NOHTYP" (đảo ngược)`,
    commonGotcha:
      'Truy cập đơn lẻ vượt độ dài `s[99]` sẽ báo lỗi `IndexError`, nhưng Slicing vượt độ dài `s[0:99]` hoàn toàn không báo lỗi mà tự cắt đến hết dãy!',
    jsEquivalent: 'str.slice(start, stop) / arr.slice(start, stop)',
    relatedTerms: ['fn-slice', 'type-str', 'type-list'],
  },
  {
    id: 'concept-mutable-immutable',
    term: 'Mutable vs Immutable',
    aliases: ['Mutable', 'Immutable'],
    category: 'concept',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Phân loại đối tượng có thể sửa đổi nội dung tại chỗ (Mutable: `list`, `dict`, `set`) và đối tượng bất biến sau khi tạo (Immutable: `int`, `float`, `str`, `tuple`).',
    detailedExplanation:
      'Với đối tượng Immutable (`str`, `int`, `tuple`), mọi thao tác "sửa" thực chất đều tạo ra một Object mới ở địa chỉ RAM mới. Với đối tượng Mutable (`list`, `dict`, `set`), các phương thức như `.append()` sửa trực tiếp bên trong Object hiện tại nên mọi biến cùng trỏ vào nó đều thấy sự thay đổi.',
    analogy:
      'Immutable giống như chữ khắc trên đá (muốn sửa phải đục tấm bia mới); Mutable giống như chữ viết trên bảng trắng (xóa đi viết thêm ngay trên tấm bảng cũ).',
    syntaxExample: `# str là Immutable:\ns = "hello"\n# s[0] = "H"  -> TypeError!\ns = "H" + s[1:]  # Tạo chuỗi mới\n\n# list là Mutable:\nitems = [1, 2]\nitems.append(3)  # Sửa trực tiếp tại chỗ`,
    commonGotcha:
      'Chỉ các đối tượng Immutable (và không chứa phần tử Mutable bên trong) mới có mã băm (`Hashable`) để dùng làm key cho `dict` hoặc phần tử của `set`.',
    jsEquivalent: 'Primitive values (Immutable) vs Object/Array (Mutable)',
    relatedTerms: ['concept-pass-by-object-ref', 'fn-hash', 'type-tuple', 'type-list'],
  },
  {
    id: 'concept-legb',
    term: 'LEGB Scope',
    aliases: ['LEGB', 'Variable Scope'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Thứ tự 4 tầng Python tìm kiếm tên biến từ trong ra ngoài: Local -> Enclosing -> Global -> Built-in.',
    detailedExplanation:
      'Khi gặp một tên biến, Python tra cứu theo thứ tự: (L) Local — biến cục bộ trong hàm hiện tại; (E) Enclosing — biến của hàm bao ngoài (Closure); (G) Global — biến ở cấp file/module; (B) Built-in — các hàm/lỗi dựng sẵn của Python (`len`, `print`, `ValueError`).',
    analogy:
      'Tìm đồ dùng: tìm trên bàn làm việc của mình trước (Local) -> tìm trong phòng nhóm (Enclosing) -> tìm ở sảnh công ty (Global) -> tìm ở kho tiện ích tòa nhà (Built-in).',
    syntaxExample: `count = 10  # Global\n\ndef outer():\n    tag = "A"  # Enclosing\n    def inner():\n        x = 1  # Local\n        print(x, tag, count, len)  # L -> E -> G -> B`,
    commonGotcha:
      'Nếu trong hàm có bất kỳ dòng nào gán `count = count + 1`, Python tự coi `count` là biến Local của hàm đó và ném lỗi `UnboundLocalError` nếu đọc trước khi gán (trừ khi khai báo `global count` hoặc `nonlocal`).',
    jsEquivalent: 'Lexical Scope Chain trong JS',
    relatedTerms: ['kw-global', 'kw-nonlocal', 'concept-closure'],
  },
  {
    id: 'concept-eafp',
    term: 'EAFP',
    aliases: ['LBYL', 'EAFP vs LBYL'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Phong cách code chuẩn Python (Easier to Ask for Forgiveness than Permission): cứ thực thi trong khối `try`, nếu gặp lỗi thì xử lý ở `except`.',
    detailedExplanation:
      'Ngược với LBYL (Look Before You Leap — kiểm tra nhiều điều kiện `if` trước khi làm), phong cách EAFP thực hiện thao tác trực tiếp rồi bắt đúng Exception cụ thể (`KeyError`, `FileNotFoundError`, `ValueError`). Cách này giúp code gọn hơn và tránh lỗi Race Condition khi thao tác file/mạng.',
    analogy:
      'Thay vì gọi điện hỏi bảo vệ xem cửa có khóa không rồi mới đi tới (lúc tới nơi cửa có thể đã khóa), bạn cứ bước tới vặn tay nắm cửa (`try`), nếu khóa thì dùng chìa mở (`except`).',
    syntaxExample: `# Chuẩn EAFP khi mở file hoặc ép kiểu:\ntry:\n    value = int(raw_input)\nexcept ValueError:\n    value = 0`,
    commonGotcha:
      'Khi áp dụng EAFP, luôn bắt đích danh lỗi dự kiến (`except ValueError:`), tuyệt đối không dùng `except:` trống vì sẽ nuốt luôn cả lỗi gõ sai tên biến (`NameError`) hay phím `Ctrl+C` (`KeyboardInterrupt`).',
    jsEquivalent: 'try { JSON.parse(str) } catch (e) {}',
    relatedTerms: ['kw-try', 'kw-except', 'kw-raise'],
  },
  {
    id: 'concept-event-loop',
    term: 'Event Loop (Vòng lặp Sự kiện)',
    aliases: ['Event Loop', 'event loop', 'asyncio.run'],
    category: 'concept',
    level: 'advanced',
    stageId: 'stage-5',
    shortSummary:
      'Bộ điều phối trung tâm giúp Python thực thi mã bất đồng bộ (`async/await`) trên một luồng duy nhất (Single-threaded Concurrency), phổ biến nhất qua thư viện chuẩn `asyncio`.',
    detailedExplanation:
      'Event Loop quản lý hàng đợi các Coroutine và Task. Khi một tác vụ gặp lệnh chờ `await` (như gọi API, truy vấn DB, đọc file), Event Loop lập tức tạm dừng tác vụ đó để chuyển sang chạy tác vụ khác đang sẵn sàng, rồi quay lại đánh thức khi dữ liệu I/O trả về. Code `def` đồng bộ thông thường KHÔNG có sẵn Event Loop trừ khi khởi chạy bằng `asyncio.run(main())` hoặc chạy trong framework bất đồng bộ như FastAPI.',
    analogy:
      'Giống một đại kiện tướng cờ vua đấu đồng thời 20 bàn cờ: đi xong 1 nước ở bàn số 1, thay vì đứng khoanh tay chờ đối thủ suy nghĩ, kiện tướng bước ngay sang bàn số 2, 3, 4... Nhờ vậy chỉ 1 người vẫn phục vụ trơn tru cả 20 bàn!',
    syntaxExample: `import asyncio\n\nasync def cong_viec(ten: str, giay: int):\n    print(f"Bắt đầu {ten}")\n    await asyncio.sleep(giay)  # Nhường quyền điều khiển cho Event Loop\n    print(f"Xong {ten}")\n\nasync def main():\n    await asyncio.gather(cong_viec("Task A", 2), cong_viec("Task B", 1))\n\nasyncio.run(main())`,
    commonGotcha:
      'Tuyệt đối không gọi hàm đồng bộ chạy lâu (`time.sleep()`, `requests.get()`, tính toán nặng CPU) trực tiếp bên trong `async def` vì sẽ làm đóng băng toàn bộ Event Loop! Ngoài `asyncio` (thường kết hợp `uvloop` trên Linux/macOS để tăng tốc), còn có `Trio`, `AnyIO` và `Tornado`.',
    jsEquivalent: 'Libuv Event Loop (tích hợp mặc định trong Node.js / Browser)',
    relatedTerms: ['concept-asyncio', 'concept-coroutine', 'concept-blocking-io', 'eco-uvloop'],
  },
  {
    id: 'concept-coroutine',
    term: 'Coroutine (Hàm Bất đồng bộ async def)',
    aliases: ['Coroutine', 'coroutine', 'coroutines', 'async def'],
    category: 'concept',
    level: 'advanced',
    stageId: 'stage-5',
    shortSummary:
      'Hàm đặc biệt khai báo bằng `async def`, có khả năng chủ động tạm dừng tại điểm `await` và tiếp tục chạy lại đúng vị trí đó mà không làm chặn luồng chính.',
    detailedExplanation:
      'Khác với hàm `def` thường (chạy một mạch từ đầu đến `return`), khi bạn gọi `coro = lay_du_lieu()`, thân hàm CHƯA HỀ CHẠY NGAY mà trả về một đối tượng Coroutine. Để thực sự chạy nó, bạn phải `await coro`, bọc vào `asyncio.create_task(coro)` hoặc truyền vào `asyncio.gather()`.',
    analogy:
      'Giống cuốn sách có kẹp dấu trang (bookmark): đọc tới đoạn chờ tra cứu (`await`), bạn kẹp dấu trang lại chuyển sang đọc cuốn khác, lát sau mở đúng trang đó đọc tiếp mà không mất mạch.',
    syntaxExample: `import asyncio\n\nasync def lay_gia_vang() -> int:\n    await asyncio.sleep(0.5)  # Tạm dừng không chặn luồng\n    return 85_000_000\n\n# Gọi trực tiếp lay_gia_vang() chỉ tạo Coroutine object, cần await để lấy kết quả:\nket_qua = asyncio.run(lay_gia_vang())`,
    commonGotcha:
      'Quên từ khóa `await` trước lời gọi hàm `async def` sẽ khiến hàm không hề được thực thi, trả về `<coroutine object>` kèm cảnh báo `RuntimeWarning: coroutine was never awaited`.',
    jsEquivalent: 'async function trả về Promise trong JavaScript',
    relatedTerms: ['concept-event-loop', 'kw-async', 'kw-await', 'concept-asyncio'],
  },
  {
    id: 'concept-single-multi-thread',
    term: 'Single-threaded vs Multi-threaded (Đơn luồng vs Đa luồng)',
    aliases: ['Single-threaded', 'Multi-threaded', 'Multi-threading', 'Đơn luồng', 'Đa luồng'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-5',
    shortSummary:
      'Mặc định chương trình Python chạy trên **1 luồng duy nhất (Single-threaded)** từ trên xuống dưới; **Đa luồng (Multi-threaded)** tạo nhiều luồng trong cùng tiến trình để chờ nhiều tác vụ I/O đồng bộ cùng lúc.',
    detailedExplanation:
      'Một tiến trình (Process) giống như một cửa hàng, còn luồng (Thread) là nhân viên bên trong cửa hàng dùng chung quầy nguyên liệu (RAM). Trong Python chuẩn (CPython), do có khóa an toàn `GIL`, các luồng không chạy lệnh Python cùng một tích tắc trên nhiều nhân CPU, nhưng khi 1 luồng đứng chờ mạng/file (I/O), nó nhả `GIL` để luồng khác làm việc.',
    analogy:
      'Đơn luồng là quán chỉ có 1 pha chế làm từng ly; Đa luồng trong Python là 4 pha chế dùng chung 1 máy xay (GIL) — trong lúc 1 người chờ lò nướng bánh (chờ mạng I/O) thì người khác dùng máy xay.',
    syntaxExample: `from concurrent.futures import ThreadPoolExecutor\nimport urllib.request\n\ndef tai_trang(url: str) -> int:\n    with urllib.request.urlopen(url, timeout=5) as r:\n        return r.status\n\n# Dùng 4 luồng chờ mạng song song thay vì xếp hàng từng URL:\nwith ThreadPoolExecutor(max_workers=4) as pool:\n    ket_qua = list(pool.map(tai_trang, ["https://example.com"] * 4))`,
    commonGotcha:
      'Vì các Thread dùng chung bộ nhớ RAM nên nếu nhiều luồng cùng cộng/trừ chung một biến hoặc sửa chung một `dict` mà không có khóa `threading.Lock()`, dữ liệu có thể bị sai lệch (Race Condition).',
    jsEquivalent: 'Main Thread đơn luồng vs Worker Threads trong Node.js',
    relatedTerms: ['concept-gil', 'concept-event-loop', 'concept-threadpool', 'concept-processpool'],
  },
  {
    id: 'concept-blocking-io',
    term: 'Blocking I/O vs Non-blocking I/O',
    aliases: ['Blocking I/O', 'Non-blocking I/O', 'Blocking', 'Non-blocking'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-5',
    shortSummary:
      '`Blocking I/O` bắt toàn bộ luồng đứng im chờ tới khi đọc/ghi mạng hoặc đĩa hoàn tất; `Non-blocking I/O` giao việc chờ cho hệ điều hành rồi lập tức giải phóng luồng để làm việc khác.',
    detailedExplanation:
      'Hầu hết thư viện truyền thống của Python (`requests.get()`, `time.sleep()`, `sqlite3`, `input()`) là **Blocking**. Ngược lại, các thư viện bất đồng bộ hiện đại (`httpx.AsyncClient`, `aiohttp`, `asyncpg`, `asyncio.sleep()`) dùng **Non-blocking I/O** kết hợp `await` để một luồng duy nhất có thể phục vụ hàng nghìn kết nối đồng thời.',
    analogy:
      'Blocking giống đứng chôn chân trước quầy trà sữa tới khi nhận ly mới được đi; Non-blocking giống cầm thẻ rung báo hiệu rồi ra bàn ngồi làm việc khác, khi nào thẻ rung mới quay lại lấy nước.',
    syntaxExample: `# ❌ BLOCKING: Làm đứng im cả luồng trong 2 giây\nimport time\ntime.sleep(2)\n\n# ✅ NON-BLOCKING (trong hàm async): Nhường luồng cho tác vụ khác chạy\nimport asyncio\nasync def demo():\n    await asyncio.sleep(2)`,
    commonGotcha:
      'Sai lầm nghiêm trọng nhất khi viết FastAPI / `asyncio` là gọi nhầm thư viện Blocking (`requests.get`, `time.sleep`) bên trong `async def` — hãy đổi sang `httpx.AsyncClient` hoặc bọc qua `await asyncio.to_thread(...)`.',
    jsEquivalent: 'fs.readFileSync (Blocking) vs await fs.promises.readFile (Non-blocking)',
    relatedTerms: ['concept-event-loop', 'concept-io-vs-cpu-bound', 'concept-threadpool'],
  },
  {
    id: 'concept-io-vs-cpu-bound',
    term: 'I/O-bound vs CPU-bound',
    aliases: ['I/O-bound', 'CPU-bound', 'IO-bound', 'I/O-Bound', 'CPU-Bound'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-5',
    shortSummary:
      '`I/O-bound` là tác vụ chậm do phải chờ mạng/ổ đĩa/Database (CPU ngồi chơi); `CPU-bound` là tác vụ chậm do CPU phải tính toán nặng liên tục 100% (xử lý ảnh, giải mã, ma trận).',
    detailedExplanation:
      'Phân biệt đúng 2 loại này quyết định công cụ bạn chọn trong Python: Với **I/O-bound**, hãy dùng `asyncio` (tải lớn) hoặc `ThreadPoolExecutor` (thư viện đồng bộ cũ). Với **CPU-bound**, `asyncio` và `Thread` đều KHÔNG giúp chạy nhanh hơn do khóa `GIL` — bạn bắt buộc dùng `ProcessPoolExecutor` (đa tiến trình) hoặc thư viện viết bằng C/Rust như `NumPy`, `Polars`.',
    analogy:
      'I/O-bound giống gửi 50 bức thư rồi ngồi chờ bưu tá hồi âm; CPU-bound giống tự tay ngồi giải 50 đề toán tích phân hóc búa liên tục không nghỉ.',
    syntaxExample: `# I/O-bound -> Dùng asyncio hoặc ThreadPoolExecutor\n# CPU-bound -> Dùng ProcessPoolExecutor chia đều ra các nhân CPU:\nfrom concurrent.futures import ProcessPoolExecutor\n\ndef tinh_nang_cpu(n: int) -> int:\n    return sum(i * i for i in range(n))`,
    commonGotcha:
      'Đừng dùng `ProcessPoolExecutor` cho các tác vụ I/O nhỏ nhẹ vì chi phí khởi tạo tiến trình mới và đóng gói dữ liệu (`pickle`) sẽ làm chậm hơn cả `asyncio`!',
    jsEquivalent: 'Async I/O trên Event Loop vs CPU crunching trên Worker Threads / C++ Addons',
    relatedTerms: ['concept-gil', 'concept-threadpool', 'concept-processpool', 'concept-event-loop'],
  },
  {
    id: 'concept-threadpool',
    term: 'ThreadPoolExecutor & asyncio.to_thread()',
    aliases: ['ThreadPoolExecutor', 'to_thread', 'asyncio.to_thread'],
    category: 'stdlib',
    level: 'advanced',
    stageId: 'stage-5',
    shortSummary:
      'Công cụ chuẩn quản lý hồ các luồng (Thread Pool) để chạy đồng thời nhiều hàm Blocking I/O truyền thống (`requests`, `sqlite3`, đọc/ghi file) mà không cần viết lại sang `async/await`.',
    detailedExplanation:
      '`ThreadPoolExecutor` (thuộc `concurrent.futures`) tạo sẵn `max_workers` luồng tái sử dụng để tránh chi phí tạo/hủy luồng liên tục. Đặc biệt khi đang ở trong hàm `async def` (như FastAPI) mà buộc phải gọi một hàm thư viện cũ đồng bộ, `await asyncio.to_thread(func, *args)` sẽ đẩy hàm đó sang Thread Pool ngầm để giữ cho Event Loop luôn mượt mà.',
    analogy:
      'Cử riêng một đội nhân viên chạy việc vặt đi xếp hàng ở bưu điện (Blocking I/O) để lễ tân chính (Event Loop) ở nhà vẫn tiếp đón khách mới bình thường.',
    syntaxExample: `import asyncio, time\nfrom concurrent.futures import ThreadPoolExecutor\n\ndef tac_vu_dong_bo_cu(x: int) -> int:\n    time.sleep(0.2)\n    return x * 10\n\n# Cách 1: Trong code đồng bộ\nwith ThreadPoolExecutor(max_workers=5) as pool:\n    ket_qua = list(pool.map(tac_vu_dong_bo_cu, [1, 2, 3]))\n\n# Cách 2: Từ bên trong hàm async def\nasync def handler():\n    return await asyncio.to_thread(tac_vu_dong_bo_cu, 5)`,
    commonGotcha:
      'Đừng đặt `max_workers` lên tới hàng nghìn (mỗi OS Thread ngốn nhiều RAM và chi phí chuyển ngữ cảnh); nếu cần hàng nghìn kết nối mạng đồng thời, hãy chuyển sang `asyncio` + `httpx`.',
    jsEquivalent: 'p-limit / Piscina thread pool',
    relatedTerms: ['concept-gil', 'concept-blocking-io', 'concept-processpool'],
  },
  {
    id: 'concept-processpool',
    term: 'ProcessPoolExecutor (Đa tiến trình vượt GIL)',
    aliases: ['ProcessPoolExecutor', 'multiprocessing'],
    category: 'stdlib',
    level: 'advanced',
    stageId: 'stage-5',
    shortSummary:
      'Khởi tạo nhiều tiến trình Python độc lập trên tất cả các nhân CPU vật lý (mỗi tiến trình có trình thông dịch và khóa `GIL` riêng) để tăng tốc thực sự các tác vụ tính toán nặng (`CPU-bound`).',
    detailedExplanation:
      'Vì các tiến trình không dùng chung RAM, Python tự động tuần tự hóa (`pickle`) tham số đầu vào gửi sang tiến trình con tính toán song song 100% trên đa nhân, rồi gom kết quả trả về tiến trình cha.',
    analogy:
      'Thay vì 4 đầu bếp chen chúc giành nhau 1 con dao trong 1 bếp (Threading + GIL), bạn mở hẳn 4 gian bếp độc lập với 4 đầu bếp và 4 bộ dao riêng biệt!',
    syntaxExample: `from concurrent.futures import ProcessPoolExecutor\n\ndef kiem_tra_nguyen_to(n: int) -> bool:\n    return n > 1 and all(n % i != 0 for i in range(2, int(n**0.5) + 1))\n\nif __name__ == "__main__":  # BẮT BUỘC có cổng này khi dùng đa tiến trình!\n    with ProcessPoolExecutor() as pool:\n        kq = list(pool.map(kiem_tra_nguyen_to, [10_000_019, 10_000_079]))`,
    commonGotcha:
      'Trên Windows và macOS (chế độ `spawn`), mọi đoạn code khởi tạo `ProcessPoolExecutor` BẮT BUỘC phải đặt bên trong `if __name__ == "__main__":`, nếu không các tiến trình con sẽ tự import đệ quy vô tận gây treo máy!',
    jsEquivalent: 'child_process.fork() / Node.js cluster / Worker Threads',
    relatedTerms: ['concept-gil', 'concept-io-vs-cpu-bound', 'dunder-name-main'],
  },
  {
    id: 'concept-semaphore',
    term: 'asyncio.Semaphore (Giới hạn Tải Đồng thời)',
    aliases: ['Semaphore', 'asyncio.Semaphore'],
    category: 'stdlib',
    level: 'advanced',
    stageId: 'stage-5',
    shortSummary:
      'Bộ đếm "vé vào cổng" giới hạn tối đa bao nhiêu Coroutine được phép chạy đồng thời vào một khu vực nhạy cảm (ví dụ chỉ gọi tối đa 10 API cùng lúc để không bị khóa IP).',
    detailedExplanation:
      'Nếu bắn `asyncio.gather()` cho 5,000 URL cùng một lúc không kiểm soát, máy chủ đích sẽ trả lỗi `429 Too Many Requests` hoặc hệ điều hành cạn sạch cổng mạng (Socket exhaustion). Đặt `async with sem:` với `sem = asyncio.Semaphore(10)` đảm bảo luôn chỉ có tối đa 10 request đang bay trên mạng; chiếc thứ 11 tự động xếp hàng chờ 1 chiếc hoàn tất.',
    analogy:
      'Giống bãi đỗ xe tự động có 10 chỗ trống: xe thứ 11 tới cổng rào chắn sẽ đứng chờ, ngay khi có 1 xe đi ra thì rào chắn tự mở cho xe tiếp theo vào.',
    syntaxExample: `import asyncio\n\nsem = asyncio.Semaphore(10)  # Tối đa 10 tác vụ chạy cùng lúc\n\nasync def goi_api_an_toan(url: str):\n    async with sem:\n        await asyncio.sleep(0.1)\n        return f"OK: {url}"`,
    commonGotcha:
      'Hãy khởi tạo `Semaphore` ở bên ngoài hàm tác vụ rồi truyền vào dùng chung — nếu tạo `asyncio.Semaphore(10)` bên trong hàm con thì mỗi tác vụ tự có 1 rào chắn riêng nên hoàn toàn mất tác dụng giới hạn!',
    jsEquivalent: 'Thư viện p-limit / Bottleneck trong Node.js',
    relatedTerms: ['concept-event-loop', 'concept-asyncio'],
  },
  {
    id: 'eco-uvloop',
    term: 'uvloop, Trio & AnyIO (Hệ sinh thái Async Mở rộng)',
    aliases: ['uvloop', 'Trio', 'AnyIO', 'Tornado'],
    category: 'ecosystem',
    level: 'advanced',
    stageId: 'stage-5',
    shortSummary:
      'Các thư viện nâng cấp và mở rộng lập trình bất đồng bộ ngoài `asyncio` chuẩn: `uvloop` tăng tốc Event Loop 2–4 lần trên Linux/macOS; `Trio` & `AnyIO` mang tới mô hình Structured Concurrency an toàn.',
    detailedExplanation:
      '`uvloop` được viết bằng Cython bọc trên thư viện C `libuv` (chính là lõi của Node.js), được `Uvicorn` / `FastAPI` tự động kích hoạt trên Linux/macOS để đạt hiệu năng mạng tiệm cận Go/Node. Trong khi đó, `Trio` thiết kế lại mô hình bất đồng bộ theo hướng "Nursery" (mọi tác vụ con đều có cha quản lý rõ ràng, không rò rỉ ngầm), và `AnyIO` là lớp trung gian giúp thư viện (như `httpx`, `Starlette`) chạy tốt trên cả `asyncio` lẫn `Trio`.',
    analogy:
      '`uvloop` giống việc thay động cơ đua F1 vào chiếc xe `asyncio` sẵn có mà không cần học lái lại; còn `Trio` giống chiếc xe thế hệ mới có hệ thống phanh an toàn tự động cho cả đoàn xe.',
    syntaxExample: `# Cài đặt trên Linux / macOS: uv add uvloop\nimport asyncio\n# Với Python 3.12+, dùng asyncio.Runner(loop_factory=uvloop.new_event_loop)\n# (Khi chạy uvicorn main:app, Uvicorn đã tự động bật uvloop cho bạn!)`,
    commonGotcha:
      '`uvloop` hiện chỉ hỗ trợ Linux và macOS (không chạy trên Windows thuần — trên Windows hãy dùng WSL2 hoặc Event Loop chuẩn của `asyncio`).',
    jsEquivalent: 'libuv trong Node.js / Effect-TS cho Structured Concurrency',
    relatedTerms: ['concept-event-loop', 'concept-asyncio', 'eco-fastapi'],
  },
  {
    id: 'concept-hashable',
    term: 'Hashable (Khả băm — Điều kiện làm Key của Dict & Set)',
    aliases: ['Hashable', 'hashable', 'unhashable'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary:
      'Một đối tượng là `Hashable` nếu giá trị mã băm `hash(obj)` của nó không bao giờ thay đổi trong suốt vòng đời — điều kiện bắt buộc để làm chìa khóa (`key`) của `dict` hoặc phần tử của `set`.',
    detailedExplanation:
      '`dict` và `set` tìm kiếm siêu tốc `O(1)` bằng cách tính `hash(key)` để nhảy thẳng tới ngăn chứa (Bucket). Nếu `key` có thể bị sửa đổi nội dung sau khi cất (như `list` hay `dict`), mã băm sẽ bị lệch khiến dữ liệu thất lạc vĩnh viễn! Do đó: `str`, `int`, `float`, `bool`, `tuple` (chỉ chứa phần tử bất biến) là **Hashable**; còn `list`, `dict`, `set` là **Unhashable** (`TypeError: unhashable type: "list"`).',
    analogy:
      'Số căn cước công dân không đổi nên dùng để tra hồ sơ được ngay (`Hashable`); còn kiểu tóc thay đổi mỗi tháng (`list` khả biến) thì không thể dùng làm mã tra cứu cố định!',
    syntaxExample: `# ✅ tuple bất biến dùng làm tọa độ key trong dict cực tốt:\nban_do = {(10, 20): "Kho báu"}\n\n# ❌ list khả biến sẽ báo lỗi TypeError: unhashable type: 'list'\n# ban_do[[10, 20]] = "Lỗi ngay!"`,
    commonGotcha:
      'Một `tuple` chứa `list` bên trong như `(1, [2, 3])` cũng KHÔNG hashable vì phần tử `[2, 3]` bên trong vẫn có thể bị thay đổi!',
    jsEquivalent: 'Primitive keys trong Object/Set (khác Map của JS so sánh theo địa chỉ tham chiếu)',
    relatedTerms: ['concept-mutable-immutable', 'type-dict', 'type-set', 'type-tuple'],
  },
  {
    id: 'concept-bytecode-pvm',
    term: 'Bytecode (.pyc) & CPython VM (PVM)',
    aliases: ['Bytecode', 'PVM', '__pycache__'],
    category: 'concept',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Khi chạy tệp `.py`, Python tự động dịch mã nguồn sang tập lệnh trung gian gọn nhẹ gọi là `Bytecode` (lưu đệm trong `__pycache__/*.pyc`), sau đó Máy ảo Python (`PVM`) đọc và thực thi từng lệnh.',
    detailedExplanation:
      'Nhiều người mới tưởng Python đọc từng chữ văn bản đến đâu chạy đến đó. Thực tế Python đi qua 2 bước: (1) Kiểm tra toàn bộ cú pháp & thụt lề 4 dấu cách rồi dịch sang **Bytecode** (nếu sai thụt lề ở dòng cuối cùng thì chương trình báo `IndentationError` ngay lập tức mà chưa chạy dòng đầu tiên!); (2) Vòng lặp máy ảo **PVM** thực thi Bytecode trên vùng nhớ.',
    analogy:
      'Giống đầu bếp đọc bản công thức tiếng Việt (`.py`), tóm tắt sẵn thành phiếu ký hiệu nội bộ ngắn gọn (`Bytecode .pyc`) ghim lên kệ bếp để các lần nấu sau thao tác nhanh hơn.',
    syntaxExample: `import dis\n\ndef cong(a, b):\n    return a + b\n\n# Xem trực tiếp các lệnh Bytecode bên dưới hàm Python:\ndis.dis(cong)`,
    commonGotcha:
      'Thư mục `__pycache__/` được Python sinh tự động để tăng tốc khởi động module — hãy luôn đưa `__pycache__/` vào `.gitignore`, không đẩy lên Git.',
    jsEquivalent: 'V8 Ignition Bytecode trước khi chạy trong Node.js / Chrome',
    relatedTerms: ['concept-cpython', 'mod-dis'],
  },
  {
    id: 'concept-memoization',
    term: 'Memoization (@functools.cache / lru_cache)',
    aliases: ['Memoization', 'memoization', '@cache', 'lru_cache'],
    category: 'concept',
    level: 'basic',
    stageId: 'stage-3',
    shortSummary:
      'Kỹ thuật lưu lại kết quả của hàm ứng với từng bộ tham số đầu vào để nếu gặp lại bài toán con y hệt thì trả kết quả ngay lập tức `O(1)` thay vì đệ quy tính lại từ đầu.',
    detailedExplanation:
      'Trong đệ quy như Fibonacci hay Quy hoạch động (Dynamic Programming), `fib(35)` ngây thơ phải tính đi tính lại `fib(2)` hàng triệu lần (`O(2^n)`). Chỉ cần gắn `@functools.cache` lên đầu hàm, Python tự động dùng một `dict` ngầm nhớ mọi kết quả đã tính, hạ độ phức tạp xuống tuyến tính `O(n)` trong tích tắc!',
    analogy:
      'Giống làm toán có cuốn sổ nháp sạch sẽ bên cạnh: tính xong `17 × 29 = 493` thì ghi vào sổ, lát gặp lại phép tính đó chỉ việc liếc sổ chép đáp số trong 1 giây.',
    syntaxExample: `from functools import cache\n\n@cache\ndef fib(n: int) -> int:\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(100))  # Chạy xong trong 0.0001 giây thay vì treo máy hàng năm!`,
    commonGotcha:
      'Vì `@cache` dùng `dict` lưu theo tham số đầu vào nên mọi tham số truyền vào hàm gắn `@cache` BẮT BUỘC phải `Hashable` (dùng `tuple` thay vì `list`)! Với web server chạy dài ngày, hãy dùng `@lru_cache(maxsize=1024)` để giới hạn RAM.',
    jsEquivalent: 'lodash.memoize / React useMemo',
    relatedTerms: ['concept-decorator', 'concept-hashable', 'mod-functools'],
  },
];

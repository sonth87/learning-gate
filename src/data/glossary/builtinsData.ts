import { GlossaryTerm } from '@/types/glossary.types';

export const BUILTINS_GLOSSARY: GlossaryTerm[] = [
  // --- BUILT-IN FUNCTIONS ---
  {
    id: 'fn-print',
    term: 'print',
    aliases: ['print()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Hàm xuất dữ liệu chuẩn ra màn hình (Standard Output) với tùy chọn phân tách, kết thúc và xuất file.',
    detailedExplanation:
      '`print(*objects, sep=" ", end="\\n", file=None, flush=False)`: Hỗ trợ in nhiều đối tượng cách nhau bởi `sep`, kết thúc bằng `end`. Tham số `flush=True` buộc đẩy bộ đệm buffer ra console ngay lập tức.',
    analogy:
      'Máy in vé tại quầy lễ tân: xuất từng dòng thông tin ra giấy kèm dấu xuống dòng ở cuối mỗi lượt in.',
    syntaxExample: `print("Tiến độ:", 75, "%", sep="", end=" -> Đang xử lý...\\n", flush=True)`,
    commonGotcha:
      'Trong Python 3, `print` là một hàm (function), bắt buộc phải có cặp ngoặc tròn `()`, khác với Python 2 viết `print "hello"`.',
    jsEquivalent: 'console.log()',
    relatedTerms: ['fn-input', 'type-str'],
  },
  {
    id: 'fn-len',
    term: 'len',
    aliases: ['len()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Trả về số lượng phần tử của một tập hợp (List, Tuple, Dict, Set, String) với tốc độ tức thời O(1).',
    detailedExplanation:
      '`len(s)` gọi phương thức `s.__len__()`. Trong CPython, độ dài của chuỗi hay mảng được lưu sẵn trong thuộc tính `ob_size` của struct C, do đó hàm `len()` không hề đếm từng phần tử mà đọc trực tiếp trường này trong O(1).',
    analogy:
      'Đọc con số đếm ghi sẵn trên bìa tập hồ sơ thay vì phải đếm từng tờ giấy bên trong.',
    syntaxExample: `users = ["An", "Bình", "Cúc"]\nprint(len(users))  # 3 (O(1) tức thời)`,
    commonGotcha:
      'Hàm `len()` không hoạt động trên Generator hay Iterator vì chúng là dòng dữ liệu lười, chưa xác định độ dài!',
    jsEquivalent: 'arr.length / str.length / set.size',
    relatedTerms: ['dunder-len', 'type-list', 'type-str'],
  },
  {
    id: 'fn-enumerate',
    term: 'enumerate',
    aliases: ['enumerate()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Trả về iterator gồm cặp `(index, value)` khi duyệt qua một tập hợp.',
    detailedExplanation:
      '`enumerate(iterable, start=0)` cung cấp cả chỉ mục và giá trị cùng lúc một cách sạch sẽ, tránh việc tạo biến đếm thủ công `i = 0` hay `for i in range(len(arr)):`.',
    analogy:
      'Máy phát số thứ tự tự động ở ngân hàng: khách hàng bước vào (`value`) được đính kèm luôn tấm phiếu số thứ tự (`index`).',
    syntaxExample: `tasks = ["Thiết kế DB", "Viết API", "Viết Unit Test"]\nfor idx, task in enumerate(tasks, start=1):\n    print(f"#{idx}: {task}")`,
    commonGotcha:
      'Đừng dùng `range(len(items))` để lấy index. Luôn ưu tiên dùng `enumerate(items)`.',
    jsEquivalent: 'arr.entries() / arr.forEach((val, idx) => ...)',
    relatedTerms: ['fn-zip', 'fn-range', 'dunder-iter'],
  },
  {
    id: 'fn-zip',
    term: 'zip',
    aliases: ['zip()'],
    category: 'builtin_func',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Ghép nối các phần tử tương ứng từ 2 hoặc nhiều Iterable thành các cặp Tuple.',
    detailedExplanation:
      '`zip(iter1, iter2, ..., strict=False)` ghép các phần tử ở cùng chỉ số lại với nhau. Từ Python 3.10+, tham số `strict=True` sẽ ném lỗi `ValueError` nếu độ dài các danh sách không bằng nhau.',
    analogy:
      'Khóa kéo áo khoác: khớp từng răng cưa ở hai vạt áo lại với nhau từng đôi một từ trên xuống dưới.',
    syntaxExample: `keys = ["id", "name", "role"]\nvals = [101, "An", "Admin"]\nuser_dict = dict(zip(keys, vals, strict=True))`,
    commonGotcha:
      'Mặc định `zip()` dừng lại ở danh sách ngắn nhất và âm thầm bỏ qua phần tử dư của danh sách dài hơn. Hãy truyền `strict=True` nếu cần kiểm tra.',
    jsEquivalent: 'arr1.map((k, i) => [k, arr2[i]])',
    relatedTerms: ['fn-enumerate', 'type-tuple', 'type-dict'],
  },
  {
    id: 'fn-range',
    term: 'range',
    aliases: ['range()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Tạo dãy số nguyên lười (Lazy Sequence), tốn cực ít RAM dù tạo range(1_000_000_000).',
    detailedExplanation:
      '`range(start, stop, step)`: Cận `stop` luôn là cận trên mở (không bao gồm chính nó). Chỉ lưu 3 số `start`, `stop`, `step` trong RAM.',
    analogy:
      'Công thức toán học cầm tay: "Bắt đầu từ 0, mỗi bước cộng 2, dừng trước 100", không cần in sẵn 100 tờ giấy.',
    syntaxExample: `for n in range(0, 10, 2):\n    print(n)  # 0, 2, 4, 6, 8`,
    commonGotcha:
      '`range(1, 5)` chỉ tạo dãy 1, 2, 3, 4 (không có số 5)!',
    jsEquivalent: 'for (let i = start; i < stop; i += step)',
    relatedTerms: ['fn-enumerate', 'kw-for'],
  },
  {
    id: 'fn-map',
    term: 'map',
    aliases: ['map()'],
    category: 'builtin_func',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Áp dụng một hàm lên từng phần tử của Iterable và trả về một Map Iterator lười.',
    detailedExplanation:
      '`map(func, *iterables)` thực thi lười (Lazy). Tuy nhiên trong Python chuẩn PEP 8 hiện đại, List Comprehension `[func(x) for x in items]` thường được ưa chuộng hơn vì dễ đọc hơn.',
    analogy:
      'Máy dán nhãn tự động trên băng chuyền: mỗi chai nước đi qua máy đều được dán cùng một mẫu nhãn hiệu.',
    syntaxExample: `str_nums = ["1", "2", "3"]\nints = list(map(int, str_nums))  # [1, 2, 3]`,
    commonGotcha:
      '`map` trả về iterator dùng 1 lần, duyệt qua một lần là cạn, cần bọc `list(map(...))` nếu muốn tái sử dụng.',
    jsEquivalent: 'arr.map(fn)',
    relatedTerms: ['fn-filter', 'concept-list-comp'],
  },
  {
    id: 'fn-filter',
    term: 'filter',
    aliases: ['filter()'],
    category: 'builtin_func',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Lọc các phần tử của Iterable thỏa mãn hàm điều kiện (Predicate), trả về Filter Iterator lười.',
    detailedExplanation:
      '`filter(function, iterable)`: Nếu `function` là `None`, nó tự động loại bỏ toàn bộ các phần tử có giá trị Falsy (`0`, `""`, `None`, `[]`).',
    analogy:
      'Chiếc rây lọc bột: chỉ giữ lại những hạt bột mịn đạt chuẩn kích thước rơi xuống tô bên dưới.',
    syntaxExample: `scores = [85, 42, 90, 58, 77]\npassed = list(filter(lambda s: s >= 60, scores))  # [85, 90, 77]`,
    commonGotcha:
      'Tương tự `map`, List Comprehension `[x for x in items if cond(x)]` thường được cộng đồng Python ưu tiên dùng hơn.',
    jsEquivalent: 'arr.filter(fn)',
    relatedTerms: ['fn-map', 'concept-list-comp'],
  },
  {
    id: 'fn-sorted',
    term: 'sorted',
    aliases: ['sorted()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Tạo và trả về một danh sách MỚI đã được sắp xếp từ bất kỳ Iterable nào (không sửa dữ liệu gốc).',
    detailedExplanation:
      '`sorted(iterable, *, key=None, reverse=False)`: Nhận bất kỳ Iterable nào (kể cả Tuple, Set, Dict keys) và trả về một `list` mới được sắp xếp bằng thuật toán Timsort đỉnh cao (O(n log n)).',
    analogy:
      'Chụp ảnh bộ hồ sơ, photocopy ra một bản mới rồi sắp xếp bản photocopy theo thứ tự chữ cái, giữ nguyên bản gốc.',
    syntaxExample: `nums = (5, 2, 8, 1)\nordered = sorted(nums)  # [1, 2, 5, 8] - nums vẫn là (5, 2, 8, 1)`,
    commonGotcha:
      'Khác với `my_list.sort()` sửa trực tiếp tại chỗ và trả về `None`, `sorted()` giữ nguyên dữ liệu gốc và trả về list mới.',
    jsEquivalent: 'arr.toSorted() (ES2023)',
    relatedTerms: ['method-list-sort', 'type-list'],
  },
  {
    id: 'fn-reversed',
    term: 'reversed',
    aliases: ['reversed()'],
    category: 'builtin_func',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Trả về iterator duyệt ngược dãy tuần tự mà không tạo bản sao mảng (O(1) memory).',
    detailedExplanation:
      '`reversed(seq)` gọi `seq.__reversed__()` nếu có. Duyệt từ cuối về đầu mà không tốn chi phí cấp phát bộ nhớ như `seq[::-1]`.',
    analogy:
      'Đi giật lùi từ cuối hàng lên đầu hàng thay vì bắt mọi người quay ngược 180 độ.',
    syntaxExample: `for x in reversed([1, 2, 3]):\n    print(x)  # 3, 2, 1`,
    commonGotcha:
      '`reversed()` chỉ hoạt động trên các Sequence có thứ tự và biết độ dài (List, Tuple, Range). Không hoạt động trên Set hay Dict.',
    jsEquivalent: 'arr.toReversed() (ES2023)',
    relatedTerms: ['fn-sorted', 'type-list'],
  },
  {
    id: 'fn-sum',
    term: 'sum',
    aliases: ['sum()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Tính tổng các phần tử số trong Iterable từ trái sang phải, cộng thêm giá trị `start`.',
    detailedExplanation:
      '`sum(iterable, start=0)`: Tính tổng các số `int`, `float`, `complex`. Tốc độ nhanh hơn nhiều so với tự viết vòng lặp `for` cộng dồn.',
    analogy:
      'Máy đếm tiền tự động: thả một xấp tiền vào khay và máy đếm ra tổng số tiền ngay lập tức.',
    syntaxExample: `prices = [120_000, 45_000, 80_000]\ntotal = sum(prices)  # 245_000`,
    commonGotcha:
      'Không dùng `sum()` để nối chuỗi (str)! Python sẽ ném `TypeError`. Hãy dùng `"".join(strings)`.',
    jsEquivalent: 'arr.reduce((acc, x) => acc + x, 0)',
    relatedTerms: ['fn-min-max'],
  },
  {
    id: 'fn-min-max',
    term: 'min & max',
    aliases: ['min', 'max', 'min()', 'max()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Tìm phần tử nhỏ nhất (`min`) hoặc lớn nhất (`max`), hỗ trợ tham số `key` tùy biến.',
    detailedExplanation:
      '`min(iterable, *, key=None, default=None)`: Tham số `key` cho phép chỉ định hàm trích xuất tiêu chí so sánh (ví dụ lấy học sinh có điểm cao nhất).',
    analogy:
      'Cân đo chiều cao: tìm ra bạn cao nhất lớp hoặc bạn thấp nhất lớp theo thước đo cụ thể.',
    syntaxExample: `students = [{"name": "An", "gpa": 3.8}, {"name": "Bình", "gpa": 3.95}]\ntop = max(students, key=lambda s: s["gpa"])  # Bình`,
    commonGotcha:
      'Gọi `min([])` trên tập rỗng sẽ ném `ValueError: min() arg is an empty sequence`. Hãy truyền `default=None` để an toàn: `min([], default=0)`.',
    jsEquivalent: 'Math.min(...nums) / Math.max(...nums)',
    relatedTerms: ['fn-sum', 'fn-sorted'],
  },
  {
    id: 'fn-abs',
    term: 'abs',
    aliases: ['abs()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Trả về giá trị tuyệt đối của một số (hoặc độ lớn Magnitude của số phức).',
    detailedExplanation:
      '`abs(x)` gọi phương thức `x.__abs__()`. Hỗ trợ cả `int`, `float` và số phức `complex`.',
    analogy:
      'Đo khoảng cách vật lý: từ vị trí 0 đến điểm đích luôn là một khoảng cách dương bất kể bạn đi về phía đông hay phía tây.',
    syntaxExample: `print(abs(-42))     # 42\nprint(abs(3 + 4j))  # 5.0 (định lý Pytago của số phức)`,
    commonGotcha:
      'Với số thực chấm động, so sánh sai số `abs(a - b) < 1e-9` chuẩn xác hơn nhiều so với `a == b`.',
    jsEquivalent: 'Math.abs(x)',
    relatedTerms: ['fn-round'],
  },
  {
    id: 'fn-round',
    term: 'round',
    aliases: ['round()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Làm tròn số thực tới số chữ số thập phân chỉ định theo quy tắc Bankers Rounding (làm tròn về số chẵn gần nhất).',
    detailedExplanation:
      '`round(number, ndigits=None)`: Python áp dụng quy tắc làm tròn của kế toán ngân hàng (Round half to even): nếu nằm chính giữa (đuôi .5), nó làm tròn về số CHẴN gần nhất, giúp triệt tiêu sai số thống kê khi tính tổng hàng triệu giao dịch.',
    analogy:
      'Cán cân công lý của ngân hàng: làm tròn lên cho số lẻ và làm tròn xuống cho số chẵn để không làm lệch bảng cân đối kế toán.',
    syntaxExample: `print(round(2.5))  # 2 (số chẵn gần nhất!)\nprint(round(3.5))  # 4 (số chẵn gần nhất!)\nprint(round(3.14159, 2))  # 3.14`,
    commonGotcha:
      'Rất nhiều lập trình viên ngạc nhiên khi thấy `round(2.5) == 2` thay vì `3`. Đây là tính năng có chủ đích của IEEE 754!',
    jsEquivalent: 'Math.round(x) (nhưng JS làm tròn lên cho mọi số .5)',
    relatedTerms: ['fn-abs'],
  },
  {
    id: 'fn-any-all',
    term: 'any & all',
    aliases: ['any', 'all', 'any()', 'all()'],
    category: 'builtin_func',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Kiểm tra nhanh ít nhất 1 phần tử đúng (`any`) hoặc tất cả đều đúng (`all`) với cơ chế ngắt sớm (Short-circuit).',
    detailedExplanation:
      'Dừng ngay lập tức ở phần tử đầu tiên thỏa mãn mà không duyệt tiếp phần còn lại của danh sách, cực kỳ tiết kiệm CPU khi làm việc với triệu phần tử.',
    analogy:
      '`any()`: Có ai mang bật lửa không? (1 người giơ tay là xong). `all()`: Kiểm tra dây an toàn chuyến bay (1 người chưa thắt là dừng).',
    syntaxExample: `is_safe = all(len(pwd) >= 8 for pwd in passwords)\nhas_admin = any(u.is_admin for u in users)`,
    commonGotcha:
      '`any([])` trả về `False`, nhưng `all([])` trên tập rỗng trả về `True` (chân lý rỗng Vacuous Truth)!',
    jsEquivalent: 'arr.some() / arr.every()',
    relatedTerms: ['kw-and', 'kw-or'],
  },
  {
    id: 'fn-isinstance',
    term: 'isinstance',
    aliases: ['isinstance()'],
    category: 'builtin_func',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Kiểm tra một đối tượng có thuộc về Class (hoặc Tuple các Class) hay không, có tính kế thừa.',
    detailedExplanation:
      '`isinstance(obj, classinfo)`: Tôn trọng tính đa hình (Polymorphism) trong OOP, khác với `type(obj) == Class` chỉ so khớp chính xác một lớp.',
    analogy:
      'Hỏi: "Xe Corgi có phải là Động Vật không?" -> `isinstance` trả lời Đúng (vì kế thừa), còn `type ==` trả lời Sai.',
    syntaxExample: `if isinstance(val, (int, float)):\n    process_number(val)`,
    commonGotcha:
      '`isinstance(True, int)` trả về `True` vì `bool` là lớp con của `int` trong Python!',
    jsEquivalent: 'obj instanceof ClassName',
    relatedTerms: ['fn-issubclass', 'fn-type'],
  },
  {
    id: 'fn-issubclass',
    term: 'issubclass',
    aliases: ['issubclass()'],
    category: 'builtin_func',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Kiểm tra một lớp (Class) có phải là lớp con kế thừa từ một lớp khác hay không.',
    detailedExplanation:
      '`issubclass(class, classinfo)` nhận tham số là các đối tượng Class (không phải instance). Một class luôn được coi là subclass của chính nó.',
    analogy:
      'Kiểm tra gia phả: dòng họ Nguyễn Văn có phải là nhánh con của dòng họ Nguyễn hay không.',
    syntaxExample: `class Dog(Animal):\n    pass\nprint(issubclass(Dog, Animal))  # True`,
    commonGotcha:
      'Truyền instance vào `issubclass` sẽ ném lỗi `TypeError: issubclass() arg 1 must be a class`.',
    jsEquivalent: 'SubClass.prototype instanceof SuperClass',
    relatedTerms: ['fn-isinstance', 'decl-class'],
  },
  {
    id: 'fn-type',
    term: 'type',
    aliases: ['type()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Lấy kiểu dữ liệu của đối tượng hoặc tạo Class mới một cách động lúc Runtime (Metaclass).',
    detailedExplanation:
      'Khi gọi `type(obj)`: trả về kiểu của đối tượng. Khi gọi `type(name, bases, dict)`: nó hoạt động như một Metaclass, tạo ra một Class mới tinh ngay lúc chương trình đang chạy!',
    analogy:
      'Thước đo định danh: đo xem đồ vật này thuộc vật liệu gì (gỗ, sắt hay kính), đồng thời là nhà máy có thể đúc ra loại vật liệu mới.',
    syntaxExample: `print(type(42))  # <class 'int'>\n\n# Tạo class động lúc runtime:\nDynamicUser = type("DynamicUser", (), {"role": "guest"})`,
    commonGotcha:
      'Tránh dùng `if type(x) == int:`. Hãy dùng `isinstance(x, int)` để hỗ trợ các class kế thừa.',
    jsEquivalent: 'typeof / constructor.name',
    relatedTerms: ['fn-isinstance', 'decl-class'],
  },
  {
    id: 'fn-dir',
    term: 'dir',
    aliases: ['dir()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Khảo sát (Introspection) và liệt kê toàn bộ danh sách thuộc tính, hàm và dunders của một đối tượng.',
    detailedExplanation:
      '`dir([object])` là công cụ khám phá số một khi debug trên REPL. Nó đọc thuộc tính `__dir__()` hoặc `__dict__` của đối tượng và trả về danh sách tên chuỗi đã sắp xếp.',
    analogy:
      'Mở nắp ca-pô ô tô và dùng đèn pin soi thấy toàn bộ các bộ phận bên trong động cơ.',
    syntaxExample: `import math\nprint(dir(math))  # ['__doc__', 'acos', 'asin', 'ceil', 'pi', 'sqrt'...]`,
    commonGotcha:
      '`dir()` liệt kê cả các dunder methods `__xxx__`. Để lọc lấy các hàm người dùng viết, hãy dùng: `[a for a in dir(obj) if not a.startswith("_")]`.',
    jsEquivalent: 'Object.getOwnPropertyNames(obj)',
    relatedTerms: ['fn-hasattr', 'fn-getattr', 'fn-help'],
  },
  {
    id: 'fn-hasattr',
    term: 'hasattr & getattr & setattr',
    aliases: ['hasattr', 'getattr', 'setattr', 'hasattr()', 'getattr()', 'setattr()'],
    category: 'builtin_func',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Bộ ba hàm thao tác thuộc tính động (Dynamic Attribute Access) phục vụ Reflection & Metaprogramming.',
    detailedExplanation:
      '`hasattr(obj, name)` kiểm tra thuộc tính tồn tại. `getattr(obj, name, default)` lấy giá trị an toàn. `setattr(obj, name, value)` gán giá trị theo tên chuỗi động.',
    analogy:
      'Tay robot mở ngăn tủ theo tên nhãn ghi trên giấy điều lệnh mà không cần lập trình cứng ngăn tủ nào.',
    syntaxExample: `if hasattr(handler, "validate"):\n    validator = getattr(handler, "validate")\n    validator()`,
    commonGotcha:
      '`getattr(obj, "missing", default)` không ném `AttributeError` nếu bạn truyền giá trị `default`.',
    jsEquivalent: 'Reflect.has() / Reflect.get() / Reflect.set()',
    relatedTerms: ['fn-dir', 'dunder-getattr', 'dunder-setattr'],
  },
  {
    id: 'fn-open',
    term: 'open',
    aliases: ['open()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Mở file và trả về đối tượng luồng File Stream tương ứng, luôn kết hợp với khối `with`.',
    detailedExplanation:
      '`open(file, mode="r", encoding=None)`: Chế độ đọc `"r"`, ghi đè `"w"`, ghi nối đuôi `"a"`, nhị phân `"rb"`/`"wb"`. Luôn chỉ định rõ `encoding="utf-8"` để tránh lỗi font trên Windows.',
    analogy:
      'Cắm chìa khóa mở cánh cửa phòng lưu trữ hồ sơ tài liệu.',
    syntaxExample: `with open("data.json", "r", encoding="utf-8") as f:\n    content = f.read()`,
    commonGotcha:
      'Trên hệ điều hành Windows, nếu không truyền `encoding="utf-8"`, Python sẽ dùng mã hóa CP1252 của hệ thống và gây lỗi `UnicodeDecodeError` khi đọc tiếng Việt!',
    jsEquivalent: 'fs.readFileSync() / fs.promises.readFile()',
    relatedTerms: ['kw-with', 'dunder-enter'],
  },
  {
    id: 'fn-input',
    term: 'input',
    aliases: ['input()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Tạm dừng chương trình và đọc một dòng văn bản do người dùng nhập từ bàn phím (Standard Input).',
    detailedExplanation:
      '`input([prompt])` luôn luôn trả về một chuỗi ký tự (`str`). Nếu muốn tính toán số học, bạn bắt buộc phải ép kiểu sang `int()` hoặc `float()`.',
    analogy:
      'Máy bán hàng tự động nhấp nháy đèn chờ khách hàng gõ mã sản phẩm vào bàn phím.',
    syntaxExample: `name = input("Nhập tên của bạn: ")\nage = int(input("Nhập tuổi: "))`,
    commonGotcha:
      'Vì `input()` luôn trả về chuỗi `str`, nếu không ép kiểu `int(input())`, phép toán `"5" + "5"` sẽ thành `"55"` chứ không phải `10`!',
    jsEquivalent: 'readline / prompt() trong trình duyệt',
    relatedTerms: ['fn-print', 'type-int', 'type-str'],
  },
  {
    id: 'fn-super',
    term: 'super',
    aliases: ['super()'],
    category: 'builtin_func',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Ủy quyền lời gọi phương thức tới lớp tiếp theo trong chuỗi thứ tự phân giải MRO (Method Resolution Order).',
    detailedExplanation:
      '`super().__init__()` tự động tra cứu lớp kế tiếp trong MRO, giải quyết bài toán đa kế thừa hình thoi (Diamond Problem) hoàn hảo.',
    analogy:
      'Chuyển hồ sơ cho cấp trên tiếp theo trong chuỗi xét duyệt phê duyệt thay vì gọi đích danh một người cụ thể.',
    syntaxExample: `class Manager(Employee):\n    def __init__(self, name: str, bonus: float) -> None:\n        super().__init__(name)\n        self.bonus = bonus`,
    commonGotcha:
      'Trong Python 3, chỉ cần viết `super().__init__()`, không cần truyền tham số như Python 2.',
    jsEquivalent: 'super() / super.method()',
    relatedTerms: ['decl-class', 'concept-mro', 'dunder-init'],
  },
  {
    id: 'fn-callable',
    term: 'callable',
    aliases: ['callable()'],
    category: 'builtin_func',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Kiểm tra xem một đối tượng có thể được gọi như một hàm bằng cặp ngoặc `obj()` hay không.',
    detailedExplanation:
      '`callable(obj)` trả về `True` nếu `obj` là một hàm, một lớp, hoặc một instance của class có định nghĩa phương thức `__call__`.',
    analogy:
      'Kiểm tra thiết bị có nút bấm khởi động hay không.',
    syntaxExample: `print(callable(len))    # True (hàm)\nprint(callable(int))    # True (class constructor)\nprint(callable(42))     # False (số nguyên)`,
    commonGotcha:
      'Một đối tượng Class luôn là Callable (gọi để tạo instance), và Class instance có `__call__` cũng là Callable.',
    jsEquivalent: 'typeof obj === "function"',
    relatedTerms: ['dunder-call', 'kw-def'],
  },
  {
    id: 'fn-iter-next',
    term: 'iter & next',
    aliases: ['iter', 'next', 'iter()', 'next()'],
    category: 'builtin_func',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Bộ đôi cốt lõi của Iterator Protocol: `iter()` tạo luồng lặp và `next()` lấy từng phần tử kế tiếp.',
    detailedExplanation:
      '`iter(obj)` gọi `obj.__iter__()`. `next(it, default)` gọi `it.__next__()`. Khi hết phần tử, `next()` ném ngoại lệ `StopIteration` (hoặc trả về `default` nếu được cung cấp).',
    analogy:
      '`iter` là mở gói kẹo, `next` là bốc từng viên kẹo ra ăn cho đến khi hết gói.',
    syntaxExample: `it = iter([10, 20])\nprint(next(it))  # 10\nprint(next(it))  # 20\nprint(next(it, -1))  # -1 (hết phần tử, an toàn không ném StopIteration)`,
    commonGotcha:
      'Luôn luôn truyền giá trị default `next(it, None)` nếu không muốn phải bọc trong khối `try ... except StopIteration`.',
    jsEquivalent: 'iterator.next() trong JS',
    relatedTerms: ['dunder-iter', 'dunder-next', 'concept-generator'],
  },
  {
    id: 'fn-hash',
    term: 'hash',
    aliases: ['hash()'],
    category: 'builtin_func',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Trả về giá trị băm số nguyên (Hash value) của đối tượng bất biến (Hashable Object).',
    detailedExplanation:
      '`hash(obj)` gọi `obj.__hash__()`. Bắt buộc phải thỏa mãn: nếu `a == b` thì `hash(a) == hash(b)`. Chỉ các đối tượng bất biến (int, str, tuple, frozenset) mới có thể băm.',
    analogy:
      'Dấu vân tay kỹ thuật số duy nhất của một đối tượng bất biến.',
    syntaxExample: `print(hash("admin"))  # Một số nguyên lớn\n# hash([1, 2])        # TypeError: unhashable type: 'list'`,
    commonGotcha:
      'Để bảo mật chống tấn công Hash Collision DoS, CPython ngẫu nhiên hóa Hash Seed mỗi lần khởi động tiến trình, nên `hash("abc")` ở 2 lần chạy Python khác nhau sẽ ra số khác nhau.',
    jsEquivalent: 'Không có tương đương trực tiếp trong JS',
    relatedTerms: ['dunder-hash', 'type-dict', 'type-set'],
  },
  {
    id: 'fn-repr',
    term: 'repr',
    aliases: ['repr()'],
    category: 'builtin_func',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Trả về chuỗi đại diện chi tiết của đối tượng phục vụ Developer debug (gọi `__repr__`).',
    detailedExplanation:
      '`repr(obj)`: Quy tắc lý tưởng là chuỗi này có thể dùng để tái tạo lại đối tượng qua hàm `eval(repr(obj)) == obj`.',
    analogy:
      'Bản vẽ kỹ thuật chi tiết của sản phẩm để kỹ sư kiểm tra thông số.',
    syntaxExample: `s = "Xin chào\\n"\nprint(str(s))   # In ra có xuống dòng\nprint(repr(s))  # In ra 'Xin chào\\n' (thấy rõ ký tự thoát escape)`,
    commonGotcha:
      'Trong f-string, viết `{obj!r}` tương đương với gọi `repr(obj)`. Rất hữu ích khi in log.',
    jsEquivalent: 'util.inspect(obj)',
    relatedTerms: ['dunder-repr', 'type-str'],
  },
  {
    id: 'fn-id',
    term: 'id',
    aliases: ['id()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Trả về số nguyên định danh ô nhớ RAM vật lý của đối tượng trong CPython.',
    detailedExplanation:
      'Khi `a is b` là `True`, chắc chắn `id(a) == id(b)`. Giúp nhìn tận mắt cơ chế Pass-by-Object-Reference.',
    analogy:
      'Tọa độ GPS chính xác hoặc số khung động cơ khắc trên thân máy.',
    syntaxExample: `a = [1, 2]\nb = a\nprint(id(a) == id(b))  # True`,
    commonGotcha:
      'Khi đối tượng bị thu gom rác GC, địa chỉ `id()` của nó có thể được tái sử dụng cho đối tượng mới tạo ngay sau đó.',
    jsEquivalent: 'Không có tương đương trong JS',
    relatedTerms: ['kw-is', 'concept-pass-by-object-ref'],
  },
  {
    id: 'fn-help',
    term: 'help',
    aliases: ['help()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Hệ thống trợ giúp tương tác tích hợp sẵn của Python, đọc và định dạng docstring của bất kỳ hàm hay class nào.',
    detailedExplanation:
      '`help([object])` mở trình đọc tài liệu trực tiếp ngay trên console REPL, hỗ trợ cuộn phân trang tương tự lệnh `man` trên Linux.',
    analogy:
      'Cuốn bách khoa toàn thư bỏ túi: cần tra cứu cách dùng công cụ nào chỉ cần hỏi là mở đúng trang hướng dẫn.',
    syntaxExample: `help(len)  # In ra chi tiết mô tả hàm len và các tham số`,
    commonGotcha:
      'Chỉ nên dùng trên terminal tương tác REPL. Trong code chạy tự động production, gọi `help()` có thể làm nghẽn tiến trình.',
    jsEquivalent: 'Không có tương đương trực tiếp',
    relatedTerms: ['decl-docstring', 'fn-dir'],
  },
  {
    id: 'fn-breakpoint',
    term: 'breakpoint',
    aliases: ['breakpoint()'],
    category: 'builtin_func',
    level: 'basic',
    stageId: 'stage-3',
    shortSummary: 'Điểm dừng gỡ lỗi chuẩn từ Python 3.7+ (tự động kích hoạt PDB hoặc Debugger của IDE).',
    detailedExplanation:
      '`breakpoint()` gọi `sys.breakpointhook()`. Thay thế cú pháp cũ `import pdb; pdb.set_trace()`. Có thể vô hiệu hóa toàn bộ breakpoint bằng biến môi trường `PYTHONBREAKPOINT=0`.',
    analogy:
      'Nút bấm tạm dừng phát video: đóng băng toàn bộ tiến trình để kỹ sư soi từng chi tiết hiện trường.',
    syntaxExample: `def complex_calc(data):\n    breakpoint()  # Dừng chương trình tại đây để debug trên console\n    return process(data)`,
    commonGotcha:
      'Nhớ xóa hoặc comment lại các dòng `breakpoint()` trước khi commit code lên Git và deploy production!',
    jsEquivalent: 'debugger;',
    relatedTerms: ['kw-assert'],
  },
  {
    id: 'fn-eval-exec',
    term: 'eval & exec',
    aliases: ['eval()', 'exec()'],
    category: 'builtin_func',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary:
      'Thực thi động mã nguồn Python từ chuỗi văn bản string: eval tính biểu thức trả về giá trị, exec chạy khối lệnh đa dòng.',
    detailedExplanation:
      '`eval(expression, globals, locals)`: Phân tích cú pháp chuỗi thành một biểu thức đơn (Expression) và trả về kết quả tính toán.\n`exec(code, globals, locals)`: Thực thi động bất kỳ khối lệnh Python nào (chứa vòng lặp, định nghĩa hàm, khai báo class). Cả hai hàm đều là "con dao 2 lưỡi" vì mở toang nguy cơ Remote Code Execution (RCE) nếu người dùng truyền chuỗi độc hại.',
    analogy:
      'Người phục vụ trong nhà hàng nhận tờ giấy của khách và đưa thẳng vào lò nướng mà không kiểm tra xem tờ giấy có chứa thuốc nổ hay không.',
    syntaxExample: `x = 10\nresult = eval("x * 2 + 5")  # 25\n\ncode_str = """\nfor i in range(3):\n    print("Chào từ exec:", i)\n"""\nexec(code_str)`,
    commonGotcha:
      'Tuyệt đối KHÔNG dùng `eval()` hoặc `exec()` trên dữ liệu đầu vào từ người dùng trên Web/API. Kẻ xấu có thể truyền `__import__("os").system("rm -rf /")` để phá hủy toàn bộ hệ thống máy chủ.',
    jsEquivalent: 'eval() / Function constructor',
    relatedTerms: ['fn-repr', 'mod-sys'],
  },
  {
    id: 'fn-ord-chr',
    term: 'ord & chr',
    aliases: ['ord()', 'chr()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Chuyển đổi hai chiều giữa ký tự văn bản và mã số điểm Unicode (Code Point).',
    detailedExplanation:
      '`ord(c)`: Nhận vào 1 ký tự chuỗi duy nhất và trả về số nguyên mã Unicode tương ứng (ví dụ "A" -> 65).\n`chr(i)`: Nhận vào số nguyên mã Unicode và trả về ký tự văn bản tương ứng (ví dụ 65 -> "A", 97 -> "a", 128512 -> "😀").',
    analogy:
      'Bảng tra cứu số thứ tự của các nguyên tố trong bảng tuần hoàn hóa học hoặc từ điển mã Morse.',
    syntaxExample: `code_A = ord("A")   # 65\ncode_emoji = ord("🚀") # 128640\n\nchar_B = chr(66)    # 'B'\nprint(f"Mã của A là {code_A}, ký tự của 66 là {char_B}")`,
    commonGotcha:
      '`ord()` chỉ chấp nhận chuỗi có ĐÚNG 1 ký tự (`len == 1`). Truyền chuỗi rỗng `""` hoặc chuỗi dài hơn 1 ký tự sẽ gây `TypeError: ord() expected a character, but string of length ... found`.',
    jsEquivalent: 'String.prototype.charCodeAt() & String.fromCharCode() / fromCodePoint()',
    relatedTerms: ['type-str', 'type-int', 'type-bytes'],
  },
  {
    id: 'fn-bin-hex-oct',
    term: 'bin & hex & oct',
    aliases: ['bin()', 'hex()', 'oct()'],
    category: 'builtin_func',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary:
      'Chuyển đổi số nguyên sang biểu diễn chuỗi hệ nhị phân (0b), thập lục phân (0x) hoặc bát phân (0o).',
    detailedExplanation:
      '`bin(x)`: Trả về chuỗi nhị phân tiền tố "0b" (ví dụ `bin(10) -> "0b1010"`).\n`hex(x)`: Trả về chuỗi thập lục phân tiền tố "0x" (ví dụ `hex(255) -> "0xff"`).\n`oct(x)`: Trả về chuỗi bát phân tiền tố "0o" (ví dụ `oct(8) -> "0o10"`).\nĐể đảo ngược từ chuỗi về số nguyên int: dùng `int("1010", 2)` hoặc `int("ff", 16)`.',
    analogy:
      'Công cụ đổi đơn vị tiền tệ: cùng 1 giá trị tiền nhưng hiển thị dưới mệnh giá USD, EUR hoặc VNĐ.',
    syntaxExample: `num = 42\nprint("Nhị phân:", bin(num))   # '0b101010'\nprint("Hex:", hex(num))        # '0x2a'\n\n# Chuyển ngược lại về int:\nprint(int("0b101010", 2))      # 42`,
    commonGotcha:
      'Kết quả trả về của `bin()` và `hex()` là kiểu chuỗi `str`, không phải là số int. Nếu muốn định dạng không kèm tiền tố "0b"/"0x", dùng f-string: `f"{num:x}"` hoặc `f"{num:b}"`.',
    jsEquivalent: 'Number.prototype.toString(2) & toString(16)',
    relatedTerms: ['type-int', 'type-str', 'type-bytes'],
  },
  {
    id: 'fn-slice',
    term: 'slice',
    aliases: ['slice()', 'slice object'],
    category: 'builtin_func',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary:
      'Khởi tạo đối tượng cắt lát chỉ mục (Slice Object) có thể tái sử dụng để trích xuất dữ liệu từ List, Tuple, String.',
    detailedExplanation:
      '`slice(start, stop, step)` tạo ra một đối tượng slice có thể gán vào biến để tái sử dụng ở nhiều nơi thay vì viết cú pháp cứng `[start:stop:step]`. Cú pháp `arr[1:5:2]` bên dưới nắp máy thực chất được Python chuyển thành `arr.__getitem__(slice(1, 5, 2))`.',
    analogy:
      'Chiếc khuôn cắt bánh quy: cố định kích thước và hình dáng cắt để bạn có thể áp khuôn vào nhiều chiếc bánh khác nhau.',
    syntaxExample: `LAST_THREE = slice(-3, None)\nEVEN_INDEX = slice(0, None, 2)\n\nnumbers = [10, 20, 30, 40, 50, 60, 70]\nprint("3 số cuối:", numbers[LAST_THREE])     # [50, 60, 70]\nprint("Vị trí chẵn:", numbers[EVEN_INDEX])   # [10, 30, 50, 70]\n\n# Dùng cùng 1 khuôn trên chuỗi chữ:\nprint("Tên:", "PythonMastery"[LAST_THREE])    # 'ery'`,
    commonGotcha:
      '`stop` là chỉ mục KHÔNG bao gồm (exclusive). Cắt `slice(0, 3)` sẽ lấy các vị trí 0, 1, 2 nhưng không lấy vị trí 3.',
    jsEquivalent: 'Array.prototype.slice(start, end)',
    relatedTerms: ['type-list', 'type-str', 'dunder-getitem'],
  },

  // --- CORE BUILT-IN TYPES ---
  {
    id: 'type-str',
    term: 'str (String Type)',
    aliases: ['str', 'chuỗi'],
    category: 'builtin_type',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Kiểu chuỗi ký tự văn bản BẤT BIẾN (Immutable) hỗ trợ chuẩn Unicode toàn diện.',
    detailedExplanation:
      '`str` trong Python 3 lưu trữ toàn bộ ký tự theo chuẩn Unicode. Nhờ tính bất biến (Immutable), chuỗi có thể được băm (Hashable) và làm key an toàn cho Dictionary.',
    analogy:
      'Dòng chữ khắc trên bia đá: không thể gạch xóa một chữ cái tại chỗ, muốn sửa phải tạc một tấm bia đá mới.',
    syntaxExample: `greeting: str = "Xin chào Python!"\nfirst_char = greeting[0]  # 'X'`,
    commonGotcha:
      'Cố tình sửa ký tự `greeting[0] = "x"` sẽ ném lỗi `TypeError: "str" object does not support item assignment`.',
    jsEquivalent: 'string',
    relatedTerms: ['method-str-split', 'method-str-join'],
  },
  {
    id: 'type-int',
    term: 'int (Integer Type)',
    aliases: ['int', 'số nguyên'],
    category: 'builtin_type',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Kiểu số nguyên có độ chính xác tùy ý (Arbitrary-precision integer) không bao giờ bị tràn số (Overflow).',
    detailedExplanation:
      'Trong Python 3, `int` không bị giới hạn ở 32-bit hay 64-bit như C/Java/JS. Bạn có thể tính toán `2 ** 1000` thoải mái mà không bao giờ bị lỗi Integer Overflow.',
    analogy:
      'Chiếc thước cuộn co giãn vô hạn: số lớn bao nhiêu thước cũng kéo dài ra bấy nhiêu để đo vừa vặn.',
    syntaxExample: `huge = 2 ** 256  # Tính toán chuẩn xác hàng trăm chữ số!`,
    commonGotcha:
      'Các phép toán trên số nguyên khổng lồ sẽ tốn CPU và RAM hơn các kiểu số nguyên cố định 64-bit phần cứng.',
    jsEquivalent: 'number / BigInt',
    relatedTerms: ['type-float'],
  },
  {
    id: 'type-float',
    term: 'float (Float Type)',
    aliases: ['float', 'số thực'],
    category: 'builtin_type',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Kiểu số thực dấu chấm động 64-bit theo chuẩn IEEE 754 (Double Precision).',
    detailedExplanation:
      '`float` trong Python tương đương với kiểu `double` trong C (64-bit). Khi cần tính toán tiền tệ chính xác tuyệt đối, hãy dùng module `decimal.Decimal` thay vì `float`.',
    analogy:
      'Cân tiểu ly kỹ thuật: đo đạc số thập phân nhanh gọn nhưng có sai số vi mô ở hàng phần tỷ.',
    syntaxExample: `rate: float = 3.14159\nprint(0.1 + 0.2)  # 0.30000000000000004 (Sai số IEEE 754 kinh điển)`,
    commonGotcha:
      'Không dùng `float` cho giao dịch tài chính ngân hàng để tránh sai số thập phân! Hãy dùng `from decimal import Decimal`.',
    jsEquivalent: 'number',
    relatedTerms: ['type-int', 'fn-round'],
  },
  {
    id: 'type-bool',
    term: 'bool (Boolean Type)',
    aliases: ['bool', 'boolean'],
    category: 'builtin_type',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Kiểu logic chân lý gồm 2 giá trị `True` và `False` (lớp con kế thừa từ số nguyên `int`).',
    detailedExplanation:
      '`bool` kế thừa từ `int`: `True` có giá trị 1 và `False` có giá trị 0. Mọi đối tượng trong Python đều có thể chuyển thành bool qua hàm `bool(x)`.',
    analogy:
      'Bóng đèn tín hiệu chỉ có 2 trạng thái: Sáng hoặc Tối.',
    syntaxExample: `is_ready: bool = bool(items)  # True nếu items không rỗng`,
    commonGotcha:
      '`bool([])` là `False`, nhưng `bool([False])` lại là `True` (vì list có chứa 1 phần tử)!',
    jsEquivalent: 'boolean',
    relatedTerms: ['kw-true', 'kw-false'],
  },
  {
    id: 'type-list',
    term: 'list',
    category: 'builtin_type',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Mảng động khả biến (Mutable dynamic array) chứa các phần tử có thứ tự.',
    detailedExplanation:
      'Cài đặt bằng mảng con trỏ trong C. Truy cập `arr[i]` và `append()` ở cuối có tốc độ O(1). Chèn hoặc xóa ở đầu mảng mất O(n).',
    analogy:
      'Dãy ghế ngồi có đánh số thứ tự từ 0, thêm ghế vào đuôi rất nhanh, nhưng nhét ghế vào đầu làm mọi người phải dịch chỗ.',
    syntaxExample: `scores: list[int] = [85, 92, 78]\nscores.append(95)`,
    commonGotcha:
      'Vì khả biến (Mutable), `list` không thể làm key cho `dict` hay phần tử của `set`.',
    jsEquivalent: 'Array ([])',
    relatedTerms: ['type-tuple', 'method-list-append', 'method-list-pop'],
  },
  {
    id: 'type-tuple',
    term: 'tuple',
    category: 'builtin_type',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Bộ dữ liệu có thứ tự nhưng BẤT BIẾN (Immutable) — nhẹ hơn List và có thể làm key cho Dict.',
    detailedExplanation:
      'Sau khi tạo không thể sửa, thêm hoặc xóa. Nếu mọi phần tử đều bất biến thì Tuple có thể băm (Hashable).',
    analogy:
      'Thẻ căn cước công dân đã ép plastic: cố định, nhẹ và dùng để định danh an toàn.',
    syntaxExample: `coordinate: tuple[float, float] = (21.0285, 105.8542)`,
    commonGotcha:
      'Tuple 1 phần tử bắt buộc phải có dấu phẩy ở đuôi: `single = (42,)`. Nếu viết `(42)` chỉ là số nguyên 42!',
    jsEquivalent: 'readonly [number, number] trong TypeScript',
    relatedTerms: ['type-list', 'type-dict'],
  },
  {
    id: 'type-dict',
    term: 'dict',
    category: 'builtin_type',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Bảng băm (Hash Map) lưu trữ cặp `key: value` tra cứu O(1) và bảo toàn thứ tự chèn.',
    detailedExplanation:
      'Cấu trúc dữ liệu trọng tâm của Python. Tra cứu, thêm, xóa đạt trung bình O(1). Bảo toàn thứ tự chèn từ Python 3.7+.',
    analogy:
      'Tủ gửi đồ siêu thị: đưa đúng chìa khóa (`key`) là mở đúng ngăn tủ lấy đồ (`value`) ngay lập tức.',
    syntaxExample: `user = {"id": 1, "username": "an"}\nrole = user.get("role", "guest")`,
    commonGotcha:
      'Truy cập `d["missing"]` ném `KeyError`. Hãy dùng `d.get("missing", default)` để an toàn.',
    jsEquivalent: 'Map / Object ({})',
    relatedTerms: ['type-set', 'method-dict-get', 'method-dict-items'],
  },
  {
    id: 'type-set',
    term: 'set',
    category: 'builtin_type',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Tập hợp các phần tử DUY NHẤT (không trùng lặp), kiểm tra `x in s` siêu tốc O(1).',
    detailedExplanation:
      'Cài đặt bằng bảng băm, tự động loại bỏ trùng lặp và hỗ trợ các phép toán tập hợp toán học giao `&`, hợp `|`, hiệu `-`.',
    analogy:
      'Danh sách khách mời đã check-in: mỗi người chỉ xuất hiện 1 lần, bảo vệ quét thẻ mất tích tắc O(1).',
    syntaxExample: `tags = {"python", "fastapi"}\ntags.add("python")  # Vẫn chỉ có 2 phần tử duy nhất`,
    commonGotcha:
      'Tạo set rỗng bắt buộc dùng `s = set()`. Viết `{}` sẽ bị hiểu thành Dict rỗng!',
    jsEquivalent: 'new Set()',
    relatedTerms: ['type-frozenset', 'type-dict', 'method-set-add'],
  },
  {
    id: 'type-frozenset',
    term: 'frozenset',
    aliases: ['frozenset()'],
    category: 'builtin_type',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Phiên bản BẤT BIẾN (Immutable) của Set, có thể băm (Hashable) và làm key cho Dict.',
    detailedExplanation:
      'Trong khi `set` thông thường là Mutable và không thể làm key cho Dict hay làm phần tử của Set khác, `frozenset` đóng băng toàn bộ phần tử và cho phép lồng ghép các tập hợp.',
    analogy:
      'Khối hổ phách đóng băng các viên đá quý bên trong: không thể thêm bớt viên nào, tạo thành một khối đá bất biến duy nhất.',
    syntaxExample: `frozen_perms = frozenset(["read", "write"])\nrole_cache = {frozen_perms: "StandardEditor"}  # Dùng làm key dict hợp lệ!`,
    commonGotcha:
      '`frozenset` không có các phương thức sửa đổi như `.add()`, `.remove()`, `.discard()`.',
    jsEquivalent: 'ReadonlySet<T> trong TypeScript',
    relatedTerms: ['type-set', 'type-dict'],
  },
  {
    id: 'type-bytes',
    term: 'bytes & bytearray',
    aliases: ['bytes', 'bytearray'],
    category: 'builtin_type',
    level: 'advanced',
    stageId: 'stage-3',
    shortSummary: 'Chuỗi byte nhị phân thô (Raw Binary Data): `bytes` bất biến và `bytearray` khả biến.',
    detailedExplanation:
      'Làm việc với File nhị phân (Ảnh, PDF, Âm thanh), giao thức mạng Socket, mã hóa mật mã học (Cryptography). Mỗi phần tử là một số nguyên từ 0 đến 255.',
    analogy:
      'Dòng mã nhị phân 0 và 1 chạy trực tiếp trên cáp quang mạng.',
    syntaxExample: `raw = b"Hello Python"\nprint(raw[0])  # 72 (mã ASCII của chữ 'H')\ntext = raw.decode("utf-8")  # Giải mã thành chuỗi văn bản str`,
    commonGotcha:
      'Không thể nối trực tiếp `str` với `bytes`. Bắt buộc phải mã hóa `s.encode("utf-8")` hoặc giải mã `b.decode("utf-8")`.',
    jsEquivalent: 'Uint8Array / Buffer trong Node.js',
    relatedTerms: ['type-str'],
  },
];

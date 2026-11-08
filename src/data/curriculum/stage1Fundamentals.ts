import { LessonTopic } from '@/types/curriculum.types';

export const STAGE_1_LESSONS: LessonTopic[] = [
  {
    id: 's1-env-memory',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 4,
    title: '1.4. Mô hình Bộ nhớ "Nhãn dán" (Pass-by-Object-Reference) & Đối tượng Khả biến / Bất biến',
    shortDescription:
      'Hiểu tận gốc cách Python quản lý biến trên Heap thông qua con trỏ PyObject, bộ đếm tham chiếu (Reference Counting), sự khác biệt giữa == và is, và Shallow vs. Deep Copy.',
    estimatedMinutes: 30,
    theoryParagraphs: [
      'Trong Python, **"Mọi thứ đều là Đối tượng (Everything is an Object)"** — kể cả số nguyên `42`, giá trị `True`, hàm `def` hay bản thân một `class`. Khác với ngôn ngữ cấp thấp như C coi biến là "chiếc hộp cố định trong bộ nhớ", biến trong Python chỉ là một **chiếc nhãn tên (`name binding`)** nằm trong Namespace gắn lên đối tượng thực sự (`PyObject`) nằm trên vùng nhớ Heap.',
      'Mỗi đối tượng `PyObject` trong CPython luôn chứa tối thiểu 3 trường ở tầng C: (1) **`ob_refcnt` (Reference Count)**: Bộ đếm số lượng nhãn biến đang cùng trỏ vào nó (khi về `0`, bộ nhớ được giải phóng ngay lập tức!); (2) **`ob_type`**: Con trỏ tới kiểu dữ liệu (`int`, `str`, `list`); và (3) **`ob_val`**: Giá trị thực sự.',
      'Do mô hình này, phép gán `b = a` trong Python KHÔNG BAO GIỜ sao chép dữ liệu, mà chỉ dán thêm nhãn `b` vào cùng đối tượng mà `a` đang trỏ tới (tăng `ob_refcnt` thêm 1). Cơ chế truyền tham số vào hàm trong Python được gọi chính xác là **`Pass-by-Object-Reference`**: nếu đối tượng là **Mutable** (`list`, `dict`, `set`) và bạn thay đổi nội dung bên trong nó (`append`), biến bên ngoài hàm cũng thấy sự thay đổi đó!',
    ],
    analogy: {
      title: 'Biến trong Python là "Giấy ghi chú dán lên Quả bóng" (Sticky Notes vs. Boxes)',
      realWorldScenario:
        'Trong các ngôn ngữ như C, tạo biến `int a = 5` giống như đóng một chiếc hộp gỗ cố định tên là `a` rồi bỏ số 5 vào. Gán `b = a` là photo tờ số 5 bỏ sang hộp `b`. Nhưng trong Python, không có chiếc hộp nào cả!',
      mappingPoints: [
        {
          realWorld: 'Quả bóng bay lơ lửng trong phòng',
          pythonEquivalent: 'Object trên bộ nhớ Heap (VD: `[1, 2, 3]` hoặc `"Xin chào"`)',
          explanation: 'Mọi dữ liệu thực tế là một đối tượng độc lập có địa chỉ ô nhớ (`id(obj)`), kiểu dữ liệu (`type(obj)`) và bộ đếm số lượng dây đang buộc vào nó (`sys.getrefcount(obj)`).',
        },
        {
          realWorld: 'Tờ nhãn dán có dây buộc vào quả bóng',
          pythonEquivalent: 'Tên biến (`a`, `b`, `user_list`)',
          explanation: 'Gán `b = a` chỉ là buộc thêm sợi dây `b` vào cùng quả bóng mà `a` đang giữ.',
        },
        {
          realWorld: 'Quả bóng đá cứng (không vẽ thêm được) vs. Bảng trắng (vẽ xóa được)',
          pythonEquivalent: 'Immutable (`int`, `str`, `tuple`) vs. Mutable (`list`, `dict`, `set`)',
          explanation: 'Nếu quả bóng là bảng trắng (`list`), người cầm dây `b` viết thêm chữ lên bảng (`b.append(4)`) thì người cầm dây `a` nhìn vào cũng thấy chữ mới đó!',
        },
      ],
      mentalModelTip:
        'Luôn tự hỏi: Câu lệnh này đang "tháo dây buộc sang bóng mới" (Rebinding: `a = [1, 2]`) hay đang "vẽ trực tiếp lên quả bóng hiện tại" (Mutating: `a.append(3)`)?',
    },
    diagrams: [
      {
        id: 'diag-s1-memory-binding',
        title: 'Sơ đồ Bộ nhớ: Phép Gán (=) vs. Sao chép Nông (.copy) vs. Sao chép Sâu (deepcopy)',
        subtitle: 'So sánh cách các nhãn biến trên Stack trỏ tới các đối tượng danh sách lồng nhau trên Heap',
        type: 'comparison-boxes',
        nodes: [
          {
            id: 'mem-alias',
            badge: '1. Gán nhãn (b = a)',
            title: 'Aliasing (Cùng 1 địa chỉ id)',
            subtitle: 'id(a) == id(b) • a is b -> True',
            detail:
              'Cả `a` và `b` đều trỏ vào đúng 1 danh sách duy nhất trên Heap. Sửa bất kỳ phần tử nào qua `b` đều làm `a` bị thay đổi 100%.',
            highlightColor: 'rose',
          },
          {
            id: 'mem-shallow',
            badge: '2. Shallow Copy (b = a.copy())',
            title: 'Sao chép Nông (Chỉ tạo vỏ cấp 1)',
            subtitle: 'a is b -> False NHƯNG a[0] is b[0] -> True!',
            detail:
              'Tạo ra một khung danh sách mới cho `b` ở tầng 1, nhưng các con trỏ phần tử bên trong vẫn trỏ về các danh sách/từ điển con ở tầng 2 của `a`. Rất nhanh nhưng nguy hiểm nếu dữ liệu lồng nhau!',
            highlightColor: 'amber',
          },
          {
            id: 'mem-deep',
            badge: '3. Deep Copy (copy.deepcopy(a))',
            title: 'Sao chép Sâu Đệ quy Toàn phần',
            subtitle: 'a is b -> False VÀ a[0] is b[0] -> False',
            detail:
              'Đệ quy đi qua toàn bộ cây đối tượng ở mọi tầng để tạo bản sao độc lập 100%. Dùng khi cần chỉnh sửa bản sao của cấu trúc JSON/Dict phức tạp nhiều tầng.',
            highlightColor: 'emerald',
          },
        ],
        caption:
          'Dùng hàm tích hợp `id(x)` để kiểm tra địa chỉ ô nhớ thực tế của bất kỳ biến nào.',
      },
    ],
    benchmarksAndProofs: [
      {
        id: 'proof-s1-int-size',
        title: 'Minh chứng Kỹ thuật: Kích thước thực tế của một số nguyên `int` trong CPython (`sys.getsizeof`)',
        claim:
          'Vì mọi thứ trong Python đều là một `PyObject` hoàn chỉnh (chứa `ob_refcnt`, `ob_type`, `ob_size` và mảng chữ số), một số nguyên trong Python tốn 28 bytes thay vì 4 hay 8 bytes như C.',
        methodology: 'Đo bằng `import sys; sys.getsizeof(x)` trên CPython 64-bit',
        metrics: [
          {
            label: 'Số nguyên 64-bit thô trong ngôn ngữ C (`int64_t`)',
            valueText: '8 Bytes',
            barPercent: 15,
            note: 'Chỉ lưu giá trị nhị phân trần, bị giới hạn tràn số ở 9.22 x 10^18.',
          },
          {
            label: 'Đối tượng `int(42)` trong CPython (`PyLongObject`)',
            valueText: '28 Bytes',
            barPercent: 50,
            isOptimal: true,
            note: 'Gồm 16 bytes PyObject header + 8 bytes kích thước + 4 bytes giá trị — đổi lại không bao giờ bị tràn số!',
          },
          {
            label: 'Đối tượng `int(10 ** 100)` (Số khổng lồ 100 chữ số)',
            valueText: '72 Bytes',
            barPercent: 90,
            note: 'Tự động cấp phát thêm các khối 30-bit để chứa số lớn tùy ý.',
          },
        ],
        takeaway:
          'Đây là lý do tại sao khi cần lưu mảng 100 triệu số thực/số nguyên, người ta dùng mảng C liên tục của `NumPy` (8 bytes/số) thay vì `list[int]` thuần của Python!',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s1-1-mem',
        title: 'Kiểm chứng Mô hình Nhãn dán & Định danh Ô nhớ với id() và is',
        description: 'Quan sát sự khác biệt giữa thay đổi nội dung đối tượng khả biến (Mutable) và gán lại biến.',
        code: `# 1. Hai biến cùng trỏ vào một danh sách (Mutable Object)
cart_a: list[str] = ["Laptop", "Mouse"]
cart_b = cart_a  # Chỉ dán thêm nhãn cart_b vào cùng list!

print(cart_a is cart_b)  # True (Cùng địa chỉ ô nhớ)
cart_b.append("Keyboard")
print(cart_a)            # ['Laptop', 'Mouse', 'Keyboard'] -> cart_a thay đổi theo!

# 2. Tạo bản sao độc lập cấp 1 hoặc kiểm tra None chuẩn PEP 8
cart_c = cart_a.copy()
print(cart_a == cart_c)  # True (Giá trị giống nhau)
print(cart_a is cart_c)  # False (Hai quả bóng khác nhau trong RAM)

discount_code: str | None = None
if discount_code is None:
    print("Chưa áp dụng mã giảm giá")`,
        output: `True\n['Laptop', 'Mouse', 'Keyboard']\nTrue\nFalse\nChưa áp dụng mã giảm giá`,
        annotations: [
          { line: 3, explanation: 'Không tạo list mới! `cart_b` và `cart_a` cùng trỏ tới một địa chỉ trên Heap.' },
          { line: 5, explanation: 'Toán tử `is` kiểm tra `id(cart_a) == id(cart_b)` (cùng một đối tượng vật lý).' },
          { line: 10, explanation: '`.copy()` tạo một danh sách vỏ ngoài mới ở địa chỉ ô nhớ khác.' },
          { line: 15, explanation: 'Chuẩn PEP 8: Luôn dùng `is None` hoặc `is not None`, không dùng `== None`.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Truyền dữ liệu lớn qua nhiều hàm mà không tốn RAM sao chép',
        scenario: 'Truyền một `dict` cấu hình hoặc `DataFrame` lớn vào hàm xử lý.',
        whyPythonFits: 'Nhờ `Pass-by-Object-Reference`, việc truyền tham số chỉ truyền con trỏ 8-byte cực nhẹ mà không nhân bản dữ liệu.',
      },
    ],
    tipsAndBestPractices: [
      'Phân biệt rõ 2 nhóm kiểu dữ liệu: **Immutable (Bất biến)**: `int`, `float`, `bool`, `str`, `tuple`, `frozenset` và **Mutable (Khả biến)**: `list`, `dict`, `set`, `bytearray`.',
      'Khi viết hàm nhận vào یک `list` và trả về danh sách đã biến đổi, hãy tạo và trả về một `list` mới thay vì âm thầm sửa (mutate) danh sách gốc của người gọi để tránh bug hiệu ứng phụ (Side-effect).',
    ],
    commonIssues: [
      {
        id: 'issue-s1-falsy',
        title: 'Bẫy giá trị Falsy với tập hợp rỗng ([], {}, set())',
        severity: 'warning',
        symptom: 'Biểu thức điều kiện chạy vào nhánh sai khi kiểm tra mảng rỗng hoặc số 0.',
        whyItHappens:
          'Trong Python, ngoài `False`, `0`, `""`, `None`, thì TẤT CẢ các tập hợp rỗng như `[]`, `{}`, `()`, `set()` đều là **Falsy** (ngược hẳn với JavaScript coi `[]` và `{}` là Truthy!).',
        wrongCode: `def process_score(score: int | None = None):\n    # SAI: Nếu truyền score = 0 (điểm 0 hợp lệ), not score sẽ là True!\n    if not score:\n        return "Chưa có điểm"\n    return f"Điểm: {score}"`,
        rightCode: `def process_score(score: int | None = None):\n    # ĐÚNG: Chỉ kiểm tra chính xác trường hợp chưa truyền (None)\n    if score is None:\n        return "Chưa có điểm"\n    return f"Điểm: {score}"`,
        fixExplanation: 'Khi biến có thể mang giá trị `0` hoặc `""` hợp lệ, hãy luôn kiểm tra tường minh `if score is None:` thay vì `if not score:`.',
      },
    ],
    jsComparison: [
      {
        concept: 'Giá trị Rỗng & Giá trị Falsy',
        jsTsWay: 'Có cả null và undefined. Lưu ý: [] và {} trong JS là Truthy!',
        pythonWay: 'Chỉ có duy nhất None. Mọi tập rỗng [], {}, (), set() trong Python đều là Falsy!',
        jsCode: `if ([]) { console.log("Chạy vào đây vì [] là Truthy trong JS!"); }`,
        pythonCode: `if []:\n    print("Không chạy vì [] là Falsy trong Python!")`,
        keyDifference: 'Trong Python, kiểm tra danh sách có phần tử hay không chỉ cần viết `if items:` thay vì `if (items.length > 0)`.',
      },
    ],
    externalReferences: [
      {
        title: 'Python Data Model — Objects, values and types (Official Docs)',
        url: 'https://docs.python.org/3/reference/datamodel.html',
        sourceType: 'Official Docs',
        description: 'Đặc tả chính thức về định danh (id), kiểu (type), giá trị và tính khả biến của đối tượng trong Python.',
      },
    ],
    relatedTermIds: ['concept-pass-by-object-ref', 'kw-is', 'kw-none', 'concept-shallow-deep-copy', 'fn-id'],
    relatedLessonIds: ['s0-syntax-primitives-operators-flow', 's1-collections-slicing'],
    relatedExerciseIds: ['ex-s1-mutable-trap'],
  },
  {
    id: 's1-collections-slicing',
    stageId: 'stage-1',
    level: 'basic',
    order: 5,
    title: '1.5. Cấu trúc Dữ liệu Cốt lõi (List, Tuple, Dict, Set), Loops & Nghệ thuật Slicing',
    shortDescription:
      'Làm chủ 4 cấu trúc dữ liệu nền tảng, độ phức tạp thuật toán Big-O, vòng lặp Pythonic với enumerate/zip, Pattern Matching (match-case) và Slicing.',
    estimatedMinutes: 35,
    theoryParagraphs: [
      'Python cung cấp 4 cấu trúc tập hợp tích hợp sẵn cực mạnh: `list` (mảng động khả biến), `tuple` (bộ cố định bất biến, nhẹ và làm được key cho `dict`), `dict` (bảng băm `key: value` tốc độ tra cứu `O(1)` và giữ đúng thứ tự chèn từ Python 3.7+), và `set` (tập hợp các phần tử duy nhất không trùng lặp, kiểm tra `x in s` trong `O(1)`).',
      'Khi duyệt tập hợp, lập trình viên Python chân chính không viết vòng lặp đếm chỉ mục thủ công `for i in range(len(arr))` mà sử dụng trực tiếp `for item in arr:`, kết hợp `enumerate(arr)` khi cần lấy chỉ số và `zip(arr1, arr2)` khi cần ghép đôi hai danh sách song song.',
      'Đặc biệt, cú pháp **Slicing** `seq[start:stop:step]` cho phép trích xuất chuỗi con, cắt mảng hoặc đảo ngược danh sách `seq[::-1]` chỉ bằng một biểu thức ngắn gọn.',
    ],
    analogy: {
      title: 'Bộ tứ Công cụ Lưu trữ trong Kho hàng Python',
      realWorldScenario:
        'Hãy hình dung cách bạn tổ chức đồ đạc trong một trung tâm điều phối hàng hóa:',
      mappingPoints: [
        {
          realWorld: 'Kệ hàng có đánh số thứ tự, dễ dàng thêm/bớt kiện hàng (`List`)',
          pythonEquivalent: '`list`: `["A", "B", "C"]`',
          explanation: 'Giữ thứ tự, thay đổi được nội dung (Mutable), nhưng không làm mã định danh (key) được.',
        },
        {
          realWorld: 'Kiện hàng đã niêm phong kẹp chì cứng (`Tuple`)',
          pythonEquivalent: '`tuple`: `(21.0285, 105.8542)`',
          explanation: 'Bất biến (Immutable), an toàn tuyệt đối khi truyền đi khắp nơi và dùng làm tọa độ/chìa khóa trong `dict`.',
        },
        {
          realWorld: 'Tủ locker thông minh tra cứu tức thì bằng mã số (`Dict` & `Set`)',
          pythonEquivalent: '`dict`: `{"id": 101}` • `set`: `{"admin", "vip"}`',
          explanation: 'Tìm kiếm theo khóa hoặc kiểm tra tồn tại `x in set` với tốc độ `O(1)` không phụ thuộc vào việc tủ có 10 ngăn hay 10 triệu ngăn.',
        },
      ],
      mentalModelTip:
        'Nếu bạn thấy mình đang dùng `if x in my_list:` lặp đi lặp lại trên danh sách lớn (`O(n)`), hãy chuyển `my_list` thành `set` để tăng tốc lên hàng nghìn lần (`O(1)`)!',
    },
    diagrams: [
      {
        id: 'diag-s1-collections-matrix',
        title: 'Ma trận So sánh & Chọn Cấu trúc Dữ liệu (List vs. Tuple vs. Dict vs. Set)',
        subtitle: 'Hiểu rõ cấu trúc bên dưới (Dynamic Array vs. Hash Table) để chọn đúng công cụ tối ưu RAM và CPU',
        type: 'comparison-boxes',
        nodes: [
          {
            id: 'col-list-tuple',
            badge: 'Mảng tuần tự (Sequence)',
            title: 'list (Khả biến) vs. tuple (Bất biến)',
            subtitle: 'Truy cập arr[i]: O(1) • Tìm kiếm x in arr: O(n)',
            detail:
              '`list` cấp phát dư bộ nhớ (Over-allocation) để `.append()` đạt `O(1)`. `tuple` có kích thước cố định nên nhẹ hơn `list` ~20–30% RAM và được CPython tái sử dụng vùng nhớ nhanh hơn.',
            highlightColor: 'sky',
          },
          {
            id: 'col-dict',
            badge: 'Bảng băm (Hash Map)',
            title: 'dict (Từ điển Key-Value)',
            subtitle: 'Tra cứu d[k]: O(1) • Chèn/Xóa: O(1)',
            detail:
              'Mọi key trong `dict` được tính mã băm qua `hash(key)` để nhảy thẳng tới ô nhớ chứa value. Từ Python 3.7+, `dict` đảm bảo giữ nguyên thứ tự các key theo đúng lúc chèn vào.',
            highlightColor: 'amber',
          },
          {
            id: 'col-set',
            badge: 'Tập hợp Duy nhất (Hash Set)',
            title: 'set (Khả biến) & frozenset (Bất biến)',
            subtitle: 'Kiểm tra x in s: O(1) • Phép giao/hợp: &, |, -',
            detail:
              'Loại bỏ tự động mọi phần tử trùng lặp và thực hiện phép toán tập hợp Toán học (`a & b`, `a | b`, `a - b`) cực nhanh.',
            highlightColor: 'emerald',
          },
        ],
        caption:
          'Mọi key của `dict` và mọi phần tử của `set` bắt buộc phải là đối tượng **Hashable** (Bất biến: `str`, `int`, `tuple`).',
      },
    ],
    benchmarksAndProofs: [
      {
        id: 'proof-s1-set-vs-list',
        title: 'Minh chứng Thực nghiệm: Tốc độ Tìm kiếm `x in collection` trên 1.000.000 phần tử (`set` vs `list`)',
        claim:
          'Kiểm tra sự tồn tại bằng bảng băm `x in my_set` (`O(1)`) nhanh gấp hơn **100.000 lần** so với duyệt tuần tự `x in my_list` (`O(n)`) khi tập dữ liệu có 1 triệu phần tử!',
        methodology: 'Thực hiện 1.000 lần kiểm tra phần tử cuối trên tập 1.000.000 số nguyên (Python 3.12)',
        metrics: [
          {
            label: 'Tra cứu trên `set` hoặc `dict` (`x in my_set` — Độ phức tạp O(1))',
            valueText: '0.00004 giây (0.04 ms)',
            barPercent: 4,
            isOptimal: true,
            note: 'Tính hàm băm `hash(x)` nhảy trúng đích ngay lập tức bất kể tập hợp lớn bao nhiêu.',
          },
          {
            label: 'Tra cứu trên `list` hoặc `tuple` (`x in my_list` — Độ phức tạp O(n))',
            valueText: '8.45 giây (Chậm hơn ~200.000 lần!)',
            barPercent: 98,
            note: 'Phải đi so sánh từng phần tử từ vị trí 0 đến 999.999 trong mỗi lần hỏi.',
          },
        ],
        takeaway:
          'Khi cần lọc danh sách đen (blacklist), kiểm tra ID đã xử lý hay tìm phần chung giữa 2 danh sách, hãy luôn chuyển sang `set` trước (`whitelist = set(raw_list)`)!',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s1-2-col',
        title: 'Slicing, enumerate(), zip() và match-case hiện đại',
        description: 'Cách thao tác dữ liệu chuẩn Pythonic ngắn gọn và hiệu quả.',
        code: `# 1. Slicing cú pháp seq[start:stop:step]
numbers = [0, 10, 20, 30, 40, 50]
print(numbers[1:4])    # [10, 20, 30] (Từ index 1 đến sát 4)
print(numbers[::-1])   # [50, 40, 30, 20, 10, 0] (Đảo ngược cực gọn!)

# 2. Duyệt song song và đánh số với enumerate & zip
names = ["An", "Bình", "Chi"]
scores = [9.0, 8.5, 9.5]
for rank, (name, score) in enumerate(zip(names, scores, strict=True), start=1):
    print(f"Hạng {rank}: {name} ({score} điểm)")

# 3. Truy cập Dict an toàn và Structural Pattern Matching (Python 3.10+)
event = {"type": "ORDER_PAID", "order_id": 5001, "amount": 1250000}
match event:
    case {"type": "ORDER_PAID", "order_id": oid, "amount": amt} if amt > 1_000_000:
        print(f"Đơn VIP #{oid}: Thanh toán {amt:,} VNĐ")
    case {"type": "ORDER_CANCELLED", "order_id": oid}:
        print(f"Hủy đơn #{oid}")`,
        output: `[10, 20, 30]\n[50, 40, 30, 20, 10, 0]\nHạng 1: An (9.0 điểm)\nHạng 2: Bình (8.5 điểm)\nHạng 3: Chi (9.5 điểm)\nĐơn VIP #5001: Thanh toán 1,250,000 VNĐ`,
        annotations: [
          { line: 4, explanation: 'Bước nhảy `step = -1` trong `[::-1]` đảo ngược toàn bộ danh sách hoặc chuỗi.' },
          { line: 9, explanation: 'Kết hợp `enumerate` và `zip(..., strict=True)` kèm Tuple Unpacking `(name, score)`.' },
          { line: 15, explanation: '`match-case` giải cấu trúc trực tiếp các key của `dict` và kiểm tra điều kiện `if amt > 1_000_000`.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Khử trùng lặp và tìm phần giao giữa 2 tập dữ liệu lớn',
        scenario: 'Tìm danh sách email khách hàng vừa mua hàng tháng trước vừa đăng ký nhận bản tin tháng này.',
        whyPythonFits: 'Chỉ cần 1 dòng toán tử tập hợp: `active_vips = set(buyers) & set(subscribers)` chạy ở tốc độ C-level.',
      },
      {
        title: 'Phân tích cú pháp payload webhook hoặc AST bằng match-case',
        scenario: 'Xử lý các bản tin JSON phức tạp từ cổng thanh toán hoặc sự kiện hệ thống.',
        whyPythonFits: '`match-case` khớp mẫu trực tiếp cấu trúc Dict/List lồng nhau mà không cần hàng chục lệnh `if "type" in data and ...`.',
      },
    ],
    tipsAndBestPractices: [
      'Luôn dùng `my_dict.get("key", default_value)` thay vì `my_dict["key"]` khi không chắc chắn key có tồn tại.',
      'Khi cần hàng đợi thêm/xóa ở cả đầu và cuối danh sách với tốc độ `O(1)`, hãy dùng `collections.deque` thay vì `list.pop(0)` (vì `list.pop(0)` tốn `O(n)`).',
      'Khi ghép nhiều chuỗi trong vòng lặp, tuyệt đối không dùng `s += part`, hãy gom vào `list` rồi dùng `"".join(parts)`.',
    ],
    commonIssues: [
      {
        id: 'issue-s1-keyerror',
        title: 'Bẫy 2 (PDF): Truy cập thuộc tính Dict và lỗi KeyError làm dừng chương trình',
        severity: 'critical',
        symptom: 'Chương trình bị crash với `KeyError: "missing_field"` khi đọc dữ liệu từ dict.',
        whyItHappens:
          'Khác với JavaScript trả về `undefined` khi truy cập `obj.missing`, `dict` của Python không cho phép truy cập bằng dấu chấm `dict.key` và dùng `dict["missing"]` sẽ lập tức ném ngoại lệ `KeyError`.',
        wrongCode: `user = {"id": 1, "name": "An"}\n# LỖI: Ném KeyError ngay lập tức vì không có key "role"!\nrole = user["role"]`,
        rightCode: `user = {"id": 1, "name": "An"}\n# ĐÚNG: Trả về None hoặc giá trị mặc định an toàn\nrole = user.get("role", "member")`,
        fixExplanation: 'Sử dụng `.get(key, default)` cho `dict`, hoặc chuyển sang dùng `@dataclass` / `Pydantic BaseModel` nếu muốn truy cập an toàn bằng dấu chấm `user.role`.',
      },
    ],
    jsComparison: [
      {
        concept: 'Duyệt mảng kèm chỉ mục (Index)',
        jsTsWay: 'arr.forEach((val, idx) => ...) hoặc for (const [idx, val] of arr.entries())',
        pythonWay: 'for idx, val in enumerate(arr):',
        jsCode: `items.forEach((item, i) => console.log(i, item));`,
        pythonCode: `for i, item in enumerate(items):\n    print(i, item)`,
        keyDifference: '`enumerate()` là cách duy nhất chuẩn Pythonic, hỗ trợ cả tham số `start=1` để đếm từ 1.',
      },
    ],
    externalReferences: [
      {
        title: 'Python TimeComplexity Wiki (Big-O cho list, dict, set)',
        url: 'https://wiki.python.org/moin/TimeComplexity',
        sourceType: 'Official Docs',
        description: 'Bảng độ phức tạp thuật toán trung bình và tệ nhất cho mọi thao tác trên cấu trúc dữ liệu chuẩn.',
      },
      {
        title: 'PEP 636 — Structural Pattern Matching: Tutorial (match-case)',
        url: 'https://peps.python.org/pep-0636/',
        sourceType: 'PEP Standard',
        description: 'Hướng dẫn chính thức từng bước về cú pháp match-case trong Python 3.10+.',
      },
    ],
    relatedTermIds: ['type-list', 'type-tuple', 'type-dict', 'type-set', 'fn-enumerate', 'fn-zip', 'kw-match'],
    relatedLessonIds: ['s1-env-memory', 's1-functions-exceptions'],
    relatedExerciseIds: ['ex-s1-student-stats'],
  },
  {
    id: 's1-functions-exceptions',
    stageId: 'stage-1',
    level: 'basic',
    order: 6,
    title: '1.6. Hàm (Functions), *args / **kwargs, Quy tắc Phạm vi LEGB & Xử lý Ngoại lệ / File I/O',
    shortDescription:
      'Làm chủ Keyword Arguments, Unpacking (*args, **kwargs), cái bẫy số 1 Mutable Default Arguments, quy tắc tra cứu biến LEGB và quản lý File JSON/CSV.',
    estimatedMinutes: 35,
    theoryParagraphs: [
      'Hàm trong Python cực kỳ linh hoạt nhờ hỗ trợ cả đối số theo vị trí (`Positional Arguments`) và đối số truyền theo tên (`Keyword Arguments`: `create_user(age=25, name="An")`). Bạn còn có thể dùng dấu `*` trong danh sách tham số để bắt buộc các tham số đứng sau nó phải truyền theo tên (`Keyword-only arguments`), giúp code gọi hàm cực kỳ tự minh bạch.',
      'Toán tử gom/trải `*args` thu thập các đối số vị trí dư thừa vào một `tuple`, còn `**kwargs` thu thập các đối số đặt tên dư thừa vào một `dict`. Ngược lại, khi gọi hàm, `*my_list` và `**my_dict` sẽ giải nén (unpack) danh sách/từ điển thành từng đối số riêng lẻ.',
      'Về phạm vi biến (Variable Scope), Python tra cứu tên biến theo **Quy tắc 4 tầng LEGB**: **L (Local - Trong hàm hiện tại)** → **E (Enclosing - Hàm bao ngoài của Closure)** → **G (Global - Cấp độ file module)** → **B (Built-in - Các hàm tích hợp sẵn như `len`, `print`)**. Lưu ý quan trọng: Python KHÔNG có Block Scope cho `if/else` hay `for/while` — biến khai báo trong `if` hay `for` thuộc toàn hàm (`Local`).',
    ],
    analogy: {
      title: 'Phễu gom hàng (*args, **kwargs) và Chiếc Bát Mặc định Dùng Chung',
      realWorldScenario:
        'Hình tượng hóa cách Python nhận tham số đầu vào của hàm:',
      mappingPoints: [
        {
          realWorld: 'Các khay định danh sẵn tên món (`name="An", role="Admin"`)',
          pythonEquivalent: 'Keyword Arguments',
          explanation: 'Đặt khay thứ tự nào cũng được vì trên khay đã ghi rõ tên tham số.',
        },
        {
          realWorld: 'Túi lưới gom mọi món đồ không tên còn lại (`*args`) & Thùng dán nhãn gom các món có tên lạ (`**kwargs`)',
          pythonEquivalent: '`*args: tuple` và `**kwargs: dict`',
          explanation: 'Giúp viết các hàm bọc (Decorator/Wrapper) chấp nhận mọi kiểu tham số đầu vào.',
        },
        {
          realWorld: 'Chiếc bát mặc định duy nhất chuẩn bị từ lúc khai trương quán (`def`)',
          pythonEquivalent: 'Mutable Default Argument (`target: list = []`)',
          explanation: 'Khởi tạo đúng 1 lần khi nạp hàm, mọi vị khách không mang bát riêng đều ăn chung vào chiếc bát đó!',
        },
      ],
      mentalModelTip:
        'Quy tắc sắt đá: Không bao giờ đặt `[]`, `{}` hay `set()` làm giá trị mặc định trong `def`. Luôn dùng `None` và khởi tạo mới bên trong thân hàm!',
    },
    diagrams: [
      {
        id: 'diag-s1-legb-scope',
        title: 'Sơ đồ Quy tắc Tra cứu Phạm vi Biến 4 Tầng LEGB & Khối lệnh try/except/else/finally',
        subtitle: 'Cách Python tìm một tên biến từ trong ra ngoài và luồng xử lý ngoại lệ chuẩn',
        type: 'pipeline',
        nodes: [
          {
            id: 'scope-l',
            badge: 'Tầng 1 • L (Local)',
            title: 'Phạm vi Cục bộ Hàm',
            subtitle: 'Biến khai báo trong def (gồm cả if/for)',
            detail:
              'Python tìm trong từ điển biến cục bộ của hàm hiện tại trước tiên (truy cập siêu nhanh qua mảng `FAST_LOCALS`). Lưu ý: biến trong vòng lặp `for` hay nhánh `if` cũng nằm ở tầng Local này!',
            highlightColor: 'emerald',
          },
          {
            id: 'scope-e',
            badge: 'Tầng 2 • E (Enclosing)',
            title: 'Phạm vi Hàm Bao ngoài',
            subtitle: 'Closure • Dùng từ khóa nonlocal để gán lại',
            detail:
              'Nếu có hàm lồng trong hàm, Python tìm tiếp ở hàm cha bao ngoài. Muốn sửa biến của hàm bao ngoài, phải khai báo `nonlocal var_name`.',
            highlightColor: 'sky',
          },
          {
            id: 'scope-g',
            badge: 'Tầng 3 • G (Global)',
            title: 'Phạm vi Module (.py)',
            subtitle: 'Cấp độ đầu file • Dùng từ khóa global',
            detail:
              'Biến khai báo ở ngoài cùng của file `.py`. Hạn chế tối đa việc dùng biến Global khả biến; chỉ nên dùng cho hằng số viết hoa `MAX_RETRY = 3`.',
            highlightColor: 'amber',
          },
          {
            id: 'scope-b',
            badge: 'Tầng 4 • B (Built-in)',
            title: 'Phạm vi Tích hợp sẵn',
            subtitle: 'len, print, range, list, dict, ValueError...',
            detail:
              'Nếu cả 3 tầng trên đều không có, Python tìm trong module `builtins`. Đó là lý do bạn KHÔNG BAO GIỜ nên đặt tên biến là `list = [1, 2]` hay `id = 5` vì sẽ che khuất (shadow) hàm `list()` và `id()` tích hợp sẵn!',
            highlightColor: 'violet',
          },
        ],
        caption:
          'Nếu tìm hết cả 4 tầng L → E → G → B mà vẫn không thấy tên biến, Python sẽ ném lỗi `NameError`.',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s1-3-fn',
        title: 'Keyword-Only Arguments, *args/**kwargs & Đọc/Ghi JSON an toàn với with',
        description: 'Thiết kế hàm rõ ràng, chống bẫy Mutable Default và thao tác file chuẩn.',
        code: `import json
from pathlib import Path

# Dấu * bắt buộc 'is_active' và 'tags' phải truyền bằng tên (Keyword-only)!
def register_student(
    name: str,
    email: str,
    *,
    is_active: bool = True,
    tags: list[str] | None = None,
) -> dict:
    if tags is None:
        tags = []
    tags.append("enrolled")
    return {"name": name, "email": email, "active": is_active, "tags": tags}

# Lưu và đọc file JSON an toàn với Context Manager (with)
def save_students(filepath: Path, students: list[dict]) -> None:
    with filepath.open("w", encoding="utf-8") as f:
        json.dump(students, f, ensure_ascii=False, indent=2)

s1 = register_student("An Nguyễn", "an@py.dev", is_active=True)
s2 = register_student("Bình Lê", "binh@py.dev")
print(s1["tags"], s2["tags"])  # Mỗi sinh viên có 1 list độc lập!`,
        output: `['enrolled'] ['enrolled']`,
        annotations: [
          { line: 8, explanation: 'Ký tự `*` đứng riêng lẻ buộc người gọi phải viết rõ `is_active=True`, tránh truyền `register_student("An", "a@b.c", True)` khó hiểu.' },
          { line: 10, explanation: 'Dùng `None` làm giá trị mặc định rồi khởi tạo `tags = []` ở dòng 13 để mỗi lần gọi có 1 list mới.' },
          { line: 19, explanation: 'Khối lệnh `with` đảm bảo file luôn được flush và đóng ngay cả khi `json.dump` gặp lỗi.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Xây dựng ứng dụng CLI quản lý cấu hình & dữ liệu JSON/CSV',
        scenario: 'Đọc dữ liệu từ file CSV/JSON, lọc theo điều kiện, xử lý lỗi định dạng và xuất báo cáo tổng hợp.',
        whyPythonFits: 'Thư viện chuẩn `pathlib`, `json`, `csv` kết hợp `try/except/else/finally` và `with` xử lý file cực kỳ gọn gàng và an toàn.',
      },
    ],
    tipsAndBestPractices: [
      'Sử dụng `pathlib.Path` hiện đại thay cho `os.path` cũ kỹ khi làm việc với đường dẫn file hệ thống.',
      'Tận dụng nhánh `else:` trong `try ... except ... else:`: code trong `else` chỉ chạy khi khối `try` KHÔNG ném ra lỗi nào, giúp giới hạn phạm vi `try` nhỏ gọn nhất.',
      'Luôn chỉ định `encoding="utf-8"` khi mở file văn bản để tránh lỗi tiếng Việt trên Windows (`cp1252`).',
    ],
    commonIssues: [
      {
        id: 'issue-s1-mutable-default',
        title: 'Bẫy 1 (PDF): Mutable Default Arguments (Tham số mặc định khả biến)',
        severity: 'critical',
        symptom: 'Dữ liệu từ lần gọi hàm trước bị rò rỉ và cộng dồn sang lần gọi hàm tiếp theo.',
        whyItHappens:
          'Giá trị mặc định của tham số trong Python chỉ được khởi tạo ĐÚNG 1 LẦN khi nạp hàm (`define time`), không phải ở mỗi lần gọi hàm (`call time`).',
        wrongCode: `def append_item_wrong(item: str, target: list[str] = []) -> list[str]:\n    target.append(item)\n    return target\n\nprint(append_item_wrong("A"))  # ['A']\nprint(append_item_wrong("B"))  # ['A', 'B'] -> BỊ DÍNH DỮ LIỆU CŨ!`,
        rightCode: `def append_item_correct(item: str, target: list[str] | None = None) -> list[str]:\n    if target is None:\n        target = []\n    target.append(item)\n    return target`,
        fixExplanation: 'Luôn đặt mặc định là `None` và kiểm tra `if target is None: target = []` ở đầu hàm.',
      },
    ],
    jsComparison: [
      {
        concept: 'Phạm vi biến (Variable Scope) trong if / for',
        jsTsWay: 'let và const có Block Scope (chỉ sống trong cặp ngoặc nhọn {} của if hoặc for).',
        pythonWay: 'Biến trong if/else hoặc for có Function Scope (vẫn truy cập được sau khi thoát khối if/for!).',
        jsCode: `if (true) {\n  const msg = "Hello";\n}\n// console.log(msg); -> ReferenceError!`,
        pythonCode: `if True:\n    msg = "Hello"\nprint(msg)  # In ra "Hello" bình thường vì msg thuộc Function Scope!`,
        keyDifference: 'Cẩn thận khi dùng biến trong nhánh `if`: nếu điều kiện `if` sai và không có nhánh `else` khởi tạo biến đó, truy cập biến phía dưới sẽ ném `UnboundLocalError`.',
      },
    ],
    externalReferences: [
      {
        title: 'Python Errors and Exceptions Tutorial (Official Docs)',
        url: 'https://docs.python.org/3/tutorial/errors.html',
        sourceType: 'Official Docs',
        description: 'Tài liệu chuẩn về cấu trúc try, except, else, finally, raise và Exception Chaining.',
      },
    ],
    relatedTermIds: ['kw-def', 'concept-mutable-default', 'kw-with', 'kw-raise', 'kw-nonlocal'],
    relatedLessonIds: ['s1-env-memory', 's2-comprehensions-oop'],
    relatedExerciseIds: ['ex-s1-mutable-trap', 'ex-s1-student-stats'],
  },
];

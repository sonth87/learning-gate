import { PracticeExercise } from '@/types/practice.types';

export const PACK_3_EXERCISES: PracticeExercise[] = [
  {
    id: 'ex-s2-late-binding-closure',
    title: 'Bài 31: Giải đố Bẫy Late-Binding Closure trong Vòng lặp [lambda x: x + i for i in range(3)]',
    category: 'brain-teaser',
    stageId: 'stage-2',
    level: 'advanced',
    relatedLessonId: 's2-generators-decorators-context',
    problemStatement:
      'Trong ES6 JavaScript, vòng lặp `for (let i = 0; i < 3; i++)` tạo phạm vi (block scope) mới cho biến `i` ở mỗi vòng. Nhưng trong Python, Closure sử dụng cơ chế **Late Binding (Liên kết trễ)**: các hàm `lambda x: x + i` không chụp giá trị của `i` tại lúc tạo hàm mà **tra cứu biến `i` tại thời điểm hàm được gọi**! Khi vòng lặp kết thúc, `i` dừng ở `2`, khiến cả 3 hàm đều cộng `2`! Để chụp giá trị `i` ngay lúc định nghĩa (Early Binding), hãy truyền `i=i` làm tham số mặc định: `lambda x, i=i: x + i`.',
    realWorldContext:
      'Khi đăng ký hàng loạt Event Listener cho nút bấm UI, tạo danh sách callback cho Task Queue hoặc sinh route động trong vòng lặp, bẫy Late-Binding Closure khiến mọi nút bấm đều gọi vào phần tử cuối cùng của danh sách.',
    requirements: [
      'Sửa biểu thức `lambda x: x + i` thành `lambda x, i=i: x + i` để neo giá trị `i` tại thời điểm định nghĩa (Define Time)',
      'Trả về danh sách kết quả `[fn(10) for fn in adders]` (kết quả đúng phải là `[10, 11, 12]` thay vì `[12, 12, 12]`)',
    ],
    starterCode: `def run_multiplier_callbacks() -> list[int]:
    # BUG: Late-binding khiến cả 3 hàm lambda đều nhìn thấy i = 2 sau khi vòng lặp kết thúc!
    adders = [lambda x: x + i for i in range(3)]
    return [fn(10) for fn in adders]
`,
    solutionCode: `def run_multiplier_callbacks() -> list[int]:
    adders = [lambda x, i=i: x + i for i in range(3)]
    return [fn(10) for fn in adders]
`,
    hints: [
      'Gợi ý 1: Nhớ lại rằng giá trị mặc định của tham số hàm trong Python được đánh giá ngay tại thời điểm định nghĩa hàm (`Define Time`).',
      'Gợi ý 2: Thêm `, i=i` vào danh sách tham số của `lambda`: `lambda x, i=i: x + i`.',
      'Gợi ý 3: Giữ nguyên `return [fn(10) for fn in adders]`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Chuyển từ Late Binding sang Early Binding bằng tham số mặc định `i=i`',
        codeSnippet: `    adders = [lambda x, i=i: x + i for i in range(3)]`,
        explanation:
          'Mỗi khi tạo một `lambda` ở vòng lặp thứ `i`, Python đánh giá giá trị hiện tại của `i` (`0`, `1`, `2`) và lưu cứng vào `fn.__defaults__` của riêng hàm đó.',
      },
      {
        stepTitle: 'Bước 2: Kích hoạt các callback trả về `[10, 11, 12]`',
        codeSnippet: `    return [fn(10) for fn in adders]`,
        explanation:
          'Khi gọi `fn(10)` (chỉ truyền 1 đối số `x`), tham số thứ hai `i` tự động lấy giá trị mặc định đã được đóng băng lúc tạo hàm.',
      },
    ],
    commonMistakes: [
      'Viết `lambda x: x + i` khiến cả 3 hàm đều tham chiếu tới cùng một ô nhớ Cell biến `i` mang giá trị cuối cùng là `2`.',
      'Gọi `fn(10, 5)` truyền 2 đối số làm ghi đè mất tham số mặc định `i=i` đã được đóng băng.',
    ],
    testCases: [
      {
        id: 'tc-s2-31-late-binding',
        description: 'Khắc phục bẫy Late-Binding Closure bằng lambda x, i=i: x + i',
        inputDescription: 'run_multiplier_callbacks()',
        expectedOutput: '[10, 11, 12]',
        requiredPatterns: ['lambda x, i=i: x + i', 'for i in range(3)', 'return [fn(10) for fn in adders]'],
        forbiddenPatterns: [
          {
            pattern: 'lambda x: x + i',
            reason: '`lambda x: x + i` bị dính bẫy Late-Binding (trả về `[12, 12, 12]`)! Hãy dùng `lambda x, i=i: x + i`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s2-keyword-only-args',
    title: 'Bài 32: Thiết kế Chữ ký Hàm An toàn với Keyword-Only Arguments (*) và *args, **kwargs',
    category: 'code-gym',
    stageId: 'stage-2',
    level: 'basic',
    relatedLessonId: 's1-functions-exceptions',
    problemStatement:
      'Khi gọi một hàm như `send_alert("CPU High", True, False)`, người đọc code không thể hiểu `True, False` có ý nghĩa gì (Boolean Trap)! Python cho phép đặt dấu sao đơn **`*`** trong chữ ký hàm: mọi tham số đứng **sau dấu `*`** bắt buộc phải được truyền bằng tên khóa (**Keyword-Only Arguments**), nếu truyền theo vị trí sẽ bị chặn ngay bằng `TypeError`. Hãy thiết kế hàm `send_alert(message: str, *, urgent: bool = False, retry: int = 3) -> str` sử dụng dấu `*` phân cách.',
    realWorldContext:
      'Hầu hết các thư viện lớn như FastAPI, Pydantic và SQLAlchemy 2.0 đều dùng `*` để bắt buộc lập trình viên viết `send_alert("Disk Full", urgent=True, retry=5)`, giúp mã nguồn tự mô tả và không bao giờ bị truyền nhầm thứ tự đối số.',
    requirements: [
      'Khai báo chữ ký hàm `def send_alert(message: str, *, urgent: bool = False, retry: int = 3) -> str:` có dấu `*` đứng giữa `message` và `urgent`',
      'Định nghĩa biến `tag = "URGENT" if urgent else "INFO"`',
      'Trả về chuỗi `f"[{tag}] {message} (retry={retry})"`',
    ],
    starterCode: `def send_alert(message: str, urgent: bool = False, retry: int = 3) -> str:
    # TODO: Thêm dấu '*' vào chữ ký hàm để bắt buộc truyền urgent và retry theo tên khóa (Keyword-Only)
    # và trả về f"[{tag}] {message} (retry={retry})"
    pass
`,
    solutionCode: `def send_alert(message: str, *, urgent: bool = False, retry: int = 3) -> str:
    tag = "URGENT" if urgent else "INFO"
    return f"[{tag}] {message} (retry={retry})"
`,
    hints: [
      'Gợi ý 1: Sửa dòng `def` thành `def send_alert(message: str, *, urgent: bool = False, retry: int = 3) -> str:`.',
      'Gợi ý 2: Tạo biến `tag = "URGENT" if urgent else "INFO"`.',
      'Gợi ý 3: Trả về `return f"[{tag}] {message} (retry={retry})"`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Đặt rào chắn Keyword-Only bằng dấu `*` trần',
        codeSnippet: `def send_alert(message: str, *, urgent: bool = False, retry: int = 3) -> str:`,
        explanation:
          'Dấu `*` đơn lẻ tiêu thụ hết các vị trí truyền theo thứ tự (Positional Arguments), ép mọi tham số phía sau nó phải được gọi tường minh dạng `urgent=True`.',
      },
      {
        stepTitle: 'Bước 2: Định dạng thông báo cảnh báo',
        codeSnippet: `    tag = "URGENT" if urgent else "INFO"\n    return f"[{tag}] {message} (retry={retry})"`,
        explanation:
          'Kết hợp biểu thức điều kiện 1 dòng và `f-string` để xuất thông điệp chuẩn.',
      },
    ],
    commonMistakes: [
      'Quên dấu `*,` giữa `message: str` và `urgent: bool = False` khiến người dùng vẫn có thể gọi `send_alert("msg", True, 5)` khó đọc.',
      'Nhầm lẫn dấu `*` (bắt đầu Keyword-Only Arguments) với dấu `/` (kết thúc Positional-Only Arguments).',
    ],
    testCases: [
      {
        id: 'tc-s2-32-kwonly',
        description: 'Sử dụng dấu * để bắt buộc truyền urgent và retry dưới dạng Keyword-Only Arguments',
        inputDescription: 'send_alert("DB Down", urgent=True, retry=5)',
        expectedOutput: "'[URGENT] DB Down (retry=5)'",
        requiredPatterns: ['def send_alert(message: str, *, urgent: bool = False, retry: int = 3)', 'f"[{tag}] {message} (retry={retry})"'],
      },
    ],
  },
  {
    id: 'ex-s2-nested-comprehension-flatten',
    title: 'Bài 33: Làm phẳng Ma trận 2 Chiều (Flatten 2D List) bằng Nested List Comprehension',
    category: 'code-gym',
    stageId: 'stage-2',
    level: 'basic',
    relatedLessonId: 's2-oop-mro-dunders',
    problemStatement:
      'Trong JS, bạn dùng `matrix.flat()` để trải phẳng mảng 2 chiều. Trong Python, **Nested List Comprehension** `[num for row in matrix for num in row]` cho phép vừa làm phẳng ma trận 2 chiều vừa lọc điều kiện trong 1 dòng duy nhất! Mẹo nhớ thứ tự: **thứ tự các mệnh đề `for` trong List Comprehension viết Y HỆT như khi bạn viết vòng lặp `for` lồng nhau từ ngoài vào trong** (`for row in matrix:` trước, `for num in row:` sau). Hãy viết hàm `flatten_positive_matrix(matrix: list[list[int]]) -> list[int]` làm phẳng và chỉ giữ lại các số dương (`num > 0`).',
    realWorldContext:
      'Xử lý các lô dữ liệu phân trang (list of batches) hoặc ma trận điểm ảnh để trích xuất danh sách phẳng các phần tử hợp lệ là thao tác cốt lõi trong Data Pipeline.',
    requirements: [
      'Sử dụng Nested List Comprehension `[num for row in matrix for num in row if num > 0]`',
      'Đặt đúng thứ tự vòng ngoài `for row in matrix` trước vòng trong `for num in row`',
    ],
    starterCode: `def flatten_positive_matrix(matrix: list[list[int]]) -> list[int]:
    # TODO: Viết Nested List Comprehension trải phẳng matrix và chỉ giữ lại num > 0
    pass
`,
    solutionCode: `def flatten_positive_matrix(matrix: list[list[int]]) -> list[int]:
    return [num for row in matrix for num in row if num > 0]
`,
    hints: [
      'Gợi ý 1: Biểu thức đầu ra đặt ở đầu cùng là `num`.',
      'Gợi ý 2: Viết vòng lặp ngoài `for row in matrix` tiếp nối bởi vòng lặp trong `for num in row`.',
      'Gợi ý 3: Thêm điều kiện lọc `if num > 0` ở cuối: `return [num for row in matrix for num in row if num > 0]`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Ghép hai tầng vòng lặp theo thứ tự từ ngoài vào trong',
        codeSnippet: `for row in matrix for num in row`,
        explanation:
          'Quy tắc đọc Nested Comprehension: phần `for row in matrix` -> `for num in row` chạy đúng theo thứ tự từ trái sang phải y hệt vòng lặp truyền thống.',
      },
      {
        stepTitle: 'Bước 2: Kết hợp điều kiện lọc `if num > 0` và biểu thức đích `num`',
        codeSnippet: `    return [num for row in matrix for num in row if num > 0]`,
        explanation:
          'Chỉ những phần tử `num > 0` ở tầng trong cùng mới được đưa vào danh sách phẳng đầu ra.',
      },
    ],
    commonMistakes: [
      'Viết ngược thứ tự `[num for num in row for row in matrix]` gây lỗi `NameError: name "row" is not defined`!',
      'Dùng ngoặc vuông lồng nhau `[[num for num in row] for row in matrix]` — cách đó tạo ra ma trận 2 chiều mới chứ không làm phẳng thành 1 chiều!',
    ],
    testCases: [
      {
        id: 'tc-s2-33-flatten',
        description: 'Làm phẳng ma trận 2 chiều và lọc số dương bằng Nested List Comprehension',
        inputDescription: 'flatten_positive_matrix([[1, -2], [3, 0, 4]])',
        expectedOutput: '[1, 3, 4]',
        requiredPatterns: ['[num for row in matrix for num in row if num > 0]'],
      },
    ],
  },
  {
    id: 'ex-s2-log-generator',
    title: 'Bài 34: Xử lý Luồng Log Dung lượng Lớn bằng Generator (yield) Tiết kiệm 99% RAM',
    category: 'code-gym',
    stageId: 'stage-2',
    level: 'advanced',
    relatedLessonId: 's2-generators-decorators-context',
    problemStatement:
      'Viết một hàm Generator `filter_error_logs(lines: list[str])` sử dụng từ khóa `yield` để duyệt qua từng dòng log, chỉ phát ra (yield) các dòng bắt đầu bằng chuỗi `"[ERROR]"` (sau khi đã cắt bỏ khoảng trắng thừa bằng `.strip()`). Tuyệt đối không tạo danh sách trung gian trong RAM!',
    realWorldContext:
      'Trong Project 2 (File Processing Tool), khi đọc file log 20GB từ máy chủ Production, dùng `yield` giúp chương trình chỉ tiêu thụ vài MB RAM (`O(1)` bộ nhớ phụ) thay vì bị hệ điều hành kill vì hết bộ nhớ (OOM Killer).',
    requirements: [
      'Hàm phải là một Generator sử dụng từ khóa `yield` (không dùng `return [...]`)',
      'Làm sạch từng dòng bằng `cleaned = line.strip()` và kiểm tra `if cleaned.startswith("[ERROR]"):` trước khi `yield cleaned`',
    ],
    starterCode: `from typing import Iterator

def filter_error_logs(lines: list[str]) -> Iterator[str]:
    # TODO: Duyệt qua từng dòng và yield dòng lỗi đã .strip()
    pass
`,
    solutionCode: `from typing import Iterator

def filter_error_logs(lines: list[str]) -> Iterator[str]:
    for line in lines:
        cleaned = line.strip()
        if cleaned.startswith("[ERROR]"):
            yield cleaned
`,
    hints: [
      'Gợi ý 1: Duyệt `for line in lines:` và gọi `cleaned = line.strip()`.',
      'Gợi ý 2: Kiểm tra `if cleaned.startswith("[ERROR]"):` để lọc dòng lỗi.',
      'Gợi ý 3: Dùng lệnh `yield cleaned` để trả từng dòng về theo cơ chế Lazy Evaluation.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Lặp và làm sạch từng dòng tại một thời điểm',
        codeSnippet: `    for line in lines:\n        cleaned = line.strip()`,
        explanation: 'Chỉ xử lý đúng dòng hiện tại đang nằm trong biến cục bộ.',
      },
      {
        stepTitle: 'Bước 2: Phát dữ liệu lười bằng từ khóa `yield`',
        codeSnippet: `        if cleaned.startswith("[ERROR]"):\n            yield cleaned`,
        explanation:
          'Từ khóa `yield` biến hàm thành Generator: mỗi lần bên ngoài gọi `next()`, hàm chạy đến `yield` rồi đóng băng Stack Frame, tiêu thụ `O(1)` bộ nhớ phụ.',
      },
    ],
    commonMistakes: [
      'Tạo `results = []` rồi `return results` — cách đó vẫn nạp toàn bộ kết quả vào RAM cùng lúc chứ không phải Generator!',
      'Dùng `return cleaned` bên trong vòng lặp khiến hàm kết thúc ngay ở dòng log lỗi đầu tiên thay vì phát tiếp các dòng sau bằng `yield`.',
    ],
    testCases: [
      {
        id: 'tc-s2-34-gen',
        description: 'Trả về đối tượng Generator với từ khóa yield và lọc đúng các dòng [ERROR]',
        inputDescription: 'list(filter_error_logs(["  [INFO] Start ", " [ERROR] DB Timeout  "]))',
        expectedOutput: "['[ERROR] DB Timeout']",
        requiredPatterns: ['for line in lines:', '.strip()', '.startswith("[ERROR]")', 'yield cleaned'],
        forbiddenPatterns: [
          {
            pattern: 'return [',
            reason: 'Bài tập yêu cầu viết hàm Generator với từ khóa `yield`, không trả về `list`!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s2-yield-from-tree',
    title: 'Bài 35: Duyệt Cây Thư mục Đệ quy bằng Generator Delegation (yield from)',
    category: 'code-gym',
    stageId: 'stage-2',
    level: 'advanced',
    relatedLessonId: 's2-generators-decorators-context',
    problemStatement:
      'Khi viết hàm Generator đệ quy để duyệt cây thư mục hoặc cấu trúc lồng nhau, nếu bạn chỉ gọi `walk_values(child)` thì Python chỉ tạo ra một đối tượng Generator con rồi... vứt bỏ mà không phát ra phần tử nào! Thay vì phải viết vòng lặp thủ công `for val in walk_values(child): yield val`, Python 3.3+ cung cấp từ khóa **`yield from`** (PEP 380) để ủy quyền trực tiếp toàn bộ luồng dữ liệu từ Generator con ra ngoài! Hãy hoàn thiện hàm `flatten_nested_numbers(items: list) -> Iterator[int]` sử dụng `yield from`.',
    realWorldContext:
      'Từ khóa `yield from` là công cụ chuẩn để duyệt cây AST (Abstract Syntax Tree), quét hệ thống file phân cấp hoặc nối ghép nhiều luồng dữ liệu (Stream Chaining) với hiệu năng cao.',
    requirements: [
      'Duyệt `for item in items:`: nếu `isinstance(item, list)` thì ủy quyền đệ quy bằng `yield from flatten_nested_numbers(item)`',
      'Ngược lại (`else:`), phát trực tiếp số nguyên bằng `yield item`',
    ],
    starterCode: `from typing import Iterator

def flatten_nested_numbers(items: list) -> Iterator[int]:
    # TODO: Nếu item là list thì dùng 'yield from flatten_nested_numbers(item)', ngược lại 'yield item'
    pass
`,
    solutionCode: `from typing import Iterator

def flatten_nested_numbers(items: list) -> Iterator[int]:
    for item in items:
        if isinstance(item, list):
            yield from flatten_nested_numbers(item)
        else:
            yield item
`,
    hints: [
      'Gợi ý 1: Lặp `for item in items:` và kiểm tra `if isinstance(item, list):`.',
      'Gợi ý 2: Bên trong nhánh `if`, viết `yield from flatten_nested_numbers(item)` để nối thẳng Generator đệ quy.',
      'Gợi ý 3: Bên trong nhánh `else:`, viết `yield item`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Ủy quyền cho Generator con bằng `yield from` khi gặp danh sách lồng nhau',
        codeSnippet: `        if isinstance(item, list):\n            yield from flatten_nested_numbers(item)`,
        explanation:
          '`yield from` thiết lập kênh truyền trực tiếp từ người gọi ngoài cùng tới Generator con ở tầng sâu nhất mà không cần vòng lặp trung gian.',
      },
      {
        stepTitle: 'Bước 2: Phát phần tử lá bằng `yield`',
        codeSnippet: `        else:\n            yield item`,
        explanation:
          'Khi gặp phần tử cơ sở (số nguyên), Generator phát giá trị đó ra luồng kết quả.',
      },
    ],
    commonMistakes: [
      'Gọi `flatten_nested_numbers(item)` mà quên từ khóa `yield from` ở đầu dòng — lời gọi hàm Generator chỉ trả về một đối tượng Generator chưa chạy nên toàn bộ các nhánh con sẽ bị biến mất!',
      'Dùng `yield flatten_nested_numbers(item)` (thiếu từ `from`) khiến kết quả trả về là các `<generator object>` thay vì các con số!',
    ],
    testCases: [
      {
        id: 'tc-s2-35-yield-from',
        description: 'Trải phẳng danh sách lồng nhau bất kỳ độ sâu bằng yield from và yield',
        inputDescription: 'list(flatten_nested_numbers([1, [2, [3, 4]], 5]))',
        expectedOutput: '[1, 2, 3, 4, 5]',
        requiredPatterns: ['isinstance(item, list)', 'yield from flatten_nested_numbers(item)', 'yield item'],
      },
    ],
  },
  {
    id: 'ex-s2-generator-exhaustion-bug',
    title: 'Bài 36: Giải đố & Khắc phục Lỗi Cạn kiệt Generator (Single-Pass Iterator Exhaustion)',
    category: 'brain-teaser',
    stageId: 'stage-2',
    level: 'advanced',
    relatedLessonId: 's2-generators-decorators-context',
    problemStatement:
      'Hãy tìm bug cực kỳ nguy hiểm trong đoạn code thống kê sau: lập trình viên tạo một Generator Expression `cleaned = (x for x in readings if x > 0)`, sau đó tính `total = sum(cleaned)` (ra kết quả đúng!), nhưng ngay dòng dưới khi tính `peak = max(cleaned, default=0)` thì `peak` luôn trả về **`0`**! Tại sao? Vì Generator/Iterator trong Python **chỉ duyệt được đúng 1 lần duy nhất (Single-Pass)**: hàm `sum(cleaned)` đã rút cạn sạch toàn bộ phần tử, nên khi `max(cleaned)` chạy thì `cleaned` đã rỗng! Hãy sửa hàm `summarize_sensor(readings: list[int]) -> tuple[int, int]` bằng cách lưu vào `list` `[x for x in readings if x > 0]` khi cần duyệt nhiều lần.',
    realWorldContext:
      'Bug cạn kiệt Iterator (`zip()`, `map()`, `filter()`, Generator Expression) xảy ra rất thường xuyên khi một hàm truyền kết quả của `filter()` qua 2 bước tính toán liên tiếp (ví dụ vừa đếm số lượng vừa tính trung bình).',
    requirements: [
      'Chuyển Generator Expression `(x for x in readings if x > 0)` thành List Comprehension `[x for x in readings if x > 0]` vì dữ liệu cần được duyệt 2 lần bởi cả `sum()` và `max()`',
      'Trả về tuple `(total, peak)`',
    ],
    starterCode: `def summarize_sensor(readings: list[int]) -> tuple[int, int]:
    # BUG: Generator Expression bị rút cạn ngay sau lệnh sum(cleaned), khiến max(cleaned) luôn nhận rỗng!
    cleaned = (x for x in readings if x > 0)
    total = sum(cleaned)
    peak = max(cleaned, default=0)
    return (total, peak)
`,
    solutionCode: `def summarize_sensor(readings: list[int]) -> tuple[int, int]:
    cleaned = [x for x in readings if x > 0]
    total = sum(cleaned)
    peak = max(cleaned, default=0)
    return (total, peak)
`,
    hints: [
      'Gợi ý 1: Một Generator `(x for ...)` là một Iterator tự tiêu hủy phần tử sau khi duyệt qua.',
      'Gợi ý 2: Khi cần duyệt qua tập kết quả nhiều hơn 1 lần (`sum` rồi lại `max`), bạn cần một Sequence (`list` hoặc `tuple`).',
      'Gợi ý 3: Đổi dấu ngoặc tròn `(x for x in readings if x > 0)` thành ngoặc vuông `[x for x in readings if x > 0]`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Hiện thực hóa thành `list` khi cần duyệt nhiều lần (Multi-pass)',
        codeSnippet: `    cleaned = [x for x in readings if x > 0]`,
        explanation:
          'Khác với Generator (là chính Iterator của nó và bị cạn kiệt sau 1 vòng lặp), `list` là một Iterable có thể sinh ra vô số Iterator mới mỗi khi truyền vào `sum()` và `max()`.',
      },
      {
        stepTitle: 'Bước 2: Tính cả `sum` và `max` chính xác trên cùng tập dữ liệu',
        codeSnippet: `    total = sum(cleaned)\n    peak = max(cleaned, default=0)\n    return (total, peak)`,
        explanation:
          'Cả `total` và `peak` đều nhận đầy đủ các giá trị dương đã lọc.',
      },
    ],
    commonMistakes: [
      'Lạm dụng Generator Expression cho các biến cần truyền vào 2 hàm tiêu thụ (`sum`, `max`, `len`, `list`) liên tiếp.',
      'Quên tham số `default=0` trong `max(cleaned, default=0)` khiến hàm ném `ValueError: max() iterable argument is empty` khi không có số dương nào.',
    ],
    testCases: [
      {
        id: 'tc-s2-36-exhaustion',
        description: 'Tránh lỗi cạn kiệt Generator khi gọi cả sum() và max() trên cùng biến cleaned',
        inputDescription: 'summarize_sensor([-5, 10, 25, -1])',
        expectedOutput: '(35, 25)',
        requiredPatterns: ['cleaned = [x for x in readings if x > 0]', 'sum(cleaned)', 'max(cleaned, default=0)'],
        forbiddenPatterns: [
          {
            pattern: '(x for x in readings if x > 0)',
            reason: 'Dùng Generator Expression ở đây sẽ bị rút cạn sau lệnh `sum(cleaned)`, khiến `max(cleaned)` trả về 0! Hãy dùng List Comprehension `[...]`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s2-mini-router',
    title: 'Bài 37: Xây dựng Decorator @route Đăng ký API Endpoint (Mô phỏng FastAPI)',
    category: 'architecture',
    stageId: 'stage-2',
    level: 'advanced',
    relatedLessonId: 's2-generators-decorators-context',
    problemStatement:
      'Trong bài tập thực hành trọng tâm của Giai đoạn 2, hãy hoàn thiện phương thức decorator `route(self, path: str)` cho lớp `MiniFastAPI`. Decorator này cần dùng `@wraps(func)` để giữ nguyên siêu dữ liệu hàm, lưu hàm xử lý vào từ điển `self.routes[path] = wrapper` và trả về `wrapper`.',
    realWorldContext:
      'Hiểu rõ cơ chế bên dưới `@app.get("/users")` của FastAPI và Flask: thực chất đó là một Decorator có tham số dùng Closure để đăng ký hàm của bạn vào bảng định tuyến (Routing Table).',
    requirements: [
      'Định nghĩa hàm `decorator(func)` bên trong phương thức `route(self, path: str)`',
      'Sử dụng `@wraps(func)` cho hàm `wrapper(*args, **kwargs)`',
      'Đăng ký `self.routes[path] = wrapper` và trả về `wrapper` / `decorator` đúng chuẩn Closure',
    ],
    starterCode: `from functools import wraps
from typing import Callable

class MiniFastAPI:
    def __init__(self) -> None:
        self.routes: dict[str, Callable] = {}

    def route(self, path: str) -> Callable:
        # TODO: Viết decorator đăng ký hàm vào self.routes[path]
        pass
`,
    solutionCode: `from functools import wraps
from typing import Callable

class MiniFastAPI:
    def __init__(self) -> None:
        self.routes: dict[str, Callable] = {}

    def route(self, path: str) -> Callable:
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                return func(*args, **kwargs)
            self.routes[path] = wrapper
            return wrapper
        return decorator
`,
    hints: [
      'Gợi ý 1: Vì `@app.route("/users")` có nhận tham số `path`, `route` phải trả về một hàm `decorator(func)`.',
      'Gợi ý 2: Bên trong `decorator(func)`, gắn `@wraps(func)` phía trên `def wrapper(*args, **kwargs):`.',
      'Gợi ý 3: Gán `self.routes[path] = wrapper`, rồi `return wrapper` (tầng trong) và `return decorator` (tầng ngoài).',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Tạo Closure nhận hàm mục tiêu `func`',
        codeSnippet: `    def route(self, path: str) -> Callable:\n        def decorator(func: Callable) -> Callable:`,
        explanation:
          'Biến `self` và `path` được giữ sống trong Closure của `decorator` ngay cả sau khi lời gọi `@app.route("/users")` kết thúc.',
      },
      {
        stepTitle: 'Bước 2: Bảo toàn Metadata với @wraps và đăng ký vào bảng định tuyến',
        codeSnippet: `            @wraps(func)\n            def wrapper(*args, **kwargs):\n                return func(*args, **kwargs)\n            self.routes[path] = wrapper\n            return wrapper`,
        explanation:
          '`@wraps(func)` giữ nguyên `__name__` và Type Hints của endpoint để hệ thống sinh tài liệu OpenAPI đọc được.',
      },
    ],
    commonMistakes: [
      'Quên `@wraps(func)` làm mất tên thật của hàm endpoint (`__name__` bị biến thành `"wrapper"`).',
      'Gọi luôn `func()` lúc đăng ký thay vì trả về hàm `wrapper`.',
    ],
    testCases: [
      {
        id: 'tc-s2-37-router',
        description: 'Đăng ký thành công @app.route("/users") vào bảng self.routes và giữ nguyên __name__',
        inputDescription: 'app.routes["/users"]()',
        expectedOutput: '{"users": ["An", "Bình"]} (handler.__name__ == "get_users")',
        requiredPatterns: ['def decorator', '@wraps(func)', 'self.routes[path] = wrapper', 'return decorator'],
      },
    ],
  },
  {
    id: 'ex-s2-retry-decorator-factory',
    title: 'Bài 38: Viết Decorator Có Tham số @retry(max_attempts=3) bảo toàn Metadata với @wraps',
    category: 'code-gym',
    stageId: 'stage-2',
    level: 'advanced',
    relatedLessonId: 's2-generators-decorators-context',
    problemStatement:
      'Một Decorator bình thường `@log` là hàm 2 tầng (`decorator(func)` -> `wrapper(*args, **kwargs)`). Nhưng một **Decorator có tham số** như `@retry(max_attempts=3)` thực chất là một **Decorator Factory 3 tầng**: tầng 1 nhận cấu hình `max_attempts`, trả về `decorator(func)` ở tầng 2, và tầng 2 trả về `wrapper(*args, **kwargs)` ở tầng 3! Hãy viết Decorator Factory `retry(max_attempts: int = 3)` tự động thử gọi lại `func(*args, **kwargs)` tối đa `max_attempts` lần nếu hàm ném `ValueError`.',
    realWorldContext:
      'Thư viện nổi tiếng `tenacity` trong hệ sinh thái Python hoạt động dựa trên chính mô hình Decorator Factory 3 tầng này để tự động thử lại khi gọi mạng chập chờn hoặc kết nối Database bị nghẽn tạm thời.',
    requirements: [
      'Tạo cấu trúc 3 tầng: `def retry(max_attempts: int = 3):` -> `def decorator(func):` -> `@wraps(func)` `def wrapper(*args, **kwargs):`',
      'Dùng vòng lặp `for attempt in range(max_attempts):` thử `return func(*args, **kwargs)` trong khối `try ... except ValueError:`',
      'Nếu hết vòng lặp vẫn lỗi, ném `raise RuntimeError("Max retries exceeded")`',
    ],
    starterCode: `from functools import wraps
from typing import Callable

def retry(max_attempts: int = 3) -> Callable:
    # TODO: Hoàn thiện Decorator Factory 3 tầng với @wraps(func)
    pass
`,
    solutionCode: `from functools import wraps
from typing import Callable

def retry(max_attempts: int = 3) -> Callable:
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except ValueError:
                    continue
            raise RuntimeError("Max retries exceeded")
        return wrapper
    return decorator
`,
    hints: [
      'Gợi ý 1: Bên trong `retry(max_attempts)`, định nghĩa `def decorator(func: Callable) -> Callable:`.',
      'Gợi ý 2: Bên trong `decorator`, đặt `@wraps(func)` ngay trên `def wrapper(*args, **kwargs):`.',
      'Gợi ý 3: Lặp `for attempt in range(max_attempts):` bọc `return func(*args, **kwargs)` trong `try ... except ValueError:`, và nhớ `return wrapper` rồi `return decorator`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Thiết lập 3 tầng Closure cho Decorator Factory',
        codeSnippet: `def retry(max_attempts: int = 3) -> Callable:\n    def decorator(func: Callable) -> Callable:\n        @wraps(func)\n        def wrapper(*args, **kwargs):`,
        explanation:
          'Khi Python gặp `@retry(max_attempts=3)`, trước tiên nó gọi `retry(3)` để lấy về hàm `decorator`, sau đó mới truyền hàm bên dưới vào `decorator(func)`.',
      },
      {
        stepTitle: 'Bước 2: Bắt ngoại lệ trong vòng lặp thử lại',
        codeSnippet: `            for attempt in range(max_attempts):\n                try:\n                    return func(*args, **kwargs)\n                except ValueError:\n                    continue\n            raise RuntimeError("Max retries exceeded")`,
        explanation:
          'Nếu `func` thành công ở bất kỳ lần thử nào, `return` sẽ thoát ngay. Nếu cả `max_attempts` lần đều văng `ValueError`, vòng lặp kết thúc và ném `RuntimeError`.',
      },
    ],
    commonMistakes: [
      'Chỉ viết 2 tầng hàm (`def retry(func, max_attempts=3)`) khiến cú pháp `@retry(max_attempts=3)` văng lỗi `TypeError` vì thiếu đối số `func`!',
      'Quên `@wraps(func)` làm mất `__name__` và `__doc__` của hàm gốc.',
    ],
    testCases: [
      {
        id: 'tc-s2-38-retry',
        description: 'Tạo đúng Decorator Factory 3 tầng có @wraps(func) và thử lại tối đa max_attempts lần',
        inputDescription: '@retry(max_attempts=3) trên hàm flaky()',
        expectedOutput: 'Thử lại khi gặp ValueError và ném RuntimeError("Max retries exceeded") khi quá số lần',
        requiredPatterns: [
          'def decorator(',
          '@wraps(func)',
          'def wrapper(*args, **kwargs):',
          'for attempt in range(max_attempts):',
          'except ValueError:',
          'raise RuntimeError("Max retries exceeded")',
          'return wrapper',
          'return decorator',
        ],
      },
    ],
  },
  {
    id: 'ex-s2-contextmanager-timer',
    title: 'Bài 39: Tự viết Context Manager bằng @contextmanager có Bọc try ... finally An toàn',
    category: 'debug-rescue',
    stageId: 'stage-2',
    level: 'advanced',
    relatedLessonId: 's2-generators-decorators-context',
    problemStatement:
      'Thay vì phải viết cả một class có `__enter__` và `__exit__`, decorator **`@contextmanager`** từ `contextlib` cho phép biến một hàm Generator có `yield` thành Context Manager dùng với từ khóa `with`! Nhưng có một **bẫy chết người**: nếu khối code bên trong `with` của người dùng ném ngoại lệ, Python sẽ ném ngoại lệ đó ngay tại dòng `yield`! Nếu bạn không bọc `yield` trong khối **`try ... finally:`**, phần code dọnẹp phía sau `yield` sẽ KHÔNG BAO GIỜ ĐƯỢC CHẠY (gây treo Lock hoặc rò rỉ kết nối)! Hãy sửa hàm `managed_session(state: list[str])` bằng cách bọc `yield` trong `try ... finally:`.',
    realWorldContext:
      'Trong FastAPI Dependency Injection (`yield db`) và SQLAlchemy Session Management, bọc `yield` trong `try ... finally: session.close()` là quy tắc bắt buộc để đảm bảo kết nối DB luôn được trả về Pool ngay cả khi API handler bị lỗi 500.',
    requirements: [
      'Sử dụng `@contextmanager` từ `contextlib`',
      'Ghi nhận `state.append("OPEN")` trước khi vào khối `try:`',
      'Đặt `yield state` bên trong `try:` và đặt `state.append("CLOSED")` bên trong khối `finally:` để đảm bảo luôn đóng phiên dù có ngoại lệ',
    ],
    starterCode: `from contextlib import contextmanager
from typing import Iterator

@contextmanager
def managed_session(state: list[str]) -> Iterator[list[str]]:
    state.append("OPEN")
    # BUG: Nếu thân khối 'with' bên ngoài ném lỗi tại điểm yield, dòng CLOSED phía dưới sẽ bị bỏ qua!
    # TODO: Bọc yield state vào trong khối try: ... finally:
    yield state
    state.append("CLOSED")
`,
    solutionCode: `from contextlib import contextmanager
from typing import Iterator

@contextmanager
def managed_session(state: list[str]) -> Iterator[list[str]]:
    state.append("OPEN")
    try:
        yield state
    finally:
        state.append("CLOSED")
`,
    hints: [
      'Gợi ý 1: Giữ nguyên `@contextmanager` và dòng `state.append("OPEN")` ở đầu hàm.',
      'Gợi ý 2: Mở khối `try:` và thụt lề dòng `yield state` vào trong `try:`.',
      'Gợi ý 3: Thêm khối `finally:` ngay sau `try:` và đặt `state.append("CLOSED")` vào bên trong `finally:`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Khởi tạo tài nguyên ở phần `__enter__` (trước `yield`)',
        codeSnippet: `    state.append("OPEN")\n    try:\n        yield state`,
        explanation:
          'Mọi câu lệnh trước `yield` chạy khi bước vào khối `with`. Giá trị sau `yield` được gán vào biến sau `as`.',
      },
      {
        stepTitle: 'Bước 2: Đảm bảo giải phóng tài nguyên ở phần `__exit__` bằng `finally:`',
        codeSnippet: `    finally:\n        state.append("CLOSED")`,
        explanation:
          'Nếu thân khối `with` ném ngoại lệ, `@contextmanager` dùng `gen.throw()` ném ngoại lệ đó vào đúng vị trí `yield`. Nhờ có `finally:`, lệnh `state.append("CLOSED")` luôn được thực thi trước khi ngoại lệ lan truyền tiếp.',
      },
    ],
    commonMistakes: [
      'Viết code dọn dẹp ngay sau dòng `yield` mà không có `try ... finally:` — khi thân `with` gặp lỗi, code dọn dẹp bị nhảy qua hoàn toàn!',
      'Dùng vòng lặp `for` có nhiều lần `yield` bên trong hàm `@contextmanager` gây lỗi `RuntimeError: generator didn\'t stop` (Context Manager chỉ được phép `yield` đúng 1 lần duy nhất!).',
    ],
    testCases: [
      {
        id: 'tc-s2-39-ctxmgr',
        description: 'Bọc yield state trong try ... finally để luôn ghi nhận CLOSED ngay cả khi có lỗi',
        inputDescription: 'with managed_session(log): ...',
        expectedOutput: "log == ['OPEN', 'CLOSED']",
        requiredPatterns: ['@contextmanager', 'state.append("OPEN")', 'try:', 'yield state', 'finally:', 'state.append("CLOSED")'],
      },
    ],
  },
  {
    id: 'ex-s2-dunder-vector-money',
    title: 'Bài 40: Nạp chồng Toán tử (__add__, __eq__, __repr__) cho Lớp Tiền tệ Money',
    category: 'code-gym',
    stageId: 'stage-2',
    level: 'basic',
    relatedLessonId: 's2-oop-mro-dunders',
    problemStatement:
      'Trong Java/JS, bạn không thể định nghĩa toán tử `+` cho đối tượng tùy chỉnh mà phải gọi `m1.add(m2)`. Python Data Model cho phép các lớp tự định nghĩa hành vi toán tử thông qua **Dunder Methods (Magic Methods)**: `__add__` cho phép cộng `+`, `__eq__` cho phép so sánh `==` theo giá trị, và `__repr__` cung cấp chuỗi biểu diễn chuẩn cho lập trình viên. Hãy hoàn thiện lớp `Money(amount: int, currency: str = "USD")` với cả 3 phương thức dunder này.',
    realWorldContext:
      'Mọi thư viện Python từ `pathlib.Path` (dùng `/` để nối đường dẫn), `Decimal`, `datetime` cho đến `numpy.ndarray` và `pandas.DataFrame` đều xây dựng trải nghiệm lập trình tự nhiên nhờ nạp chồng Dunder Methods.',
    requirements: [
      'Cài đặt `__add__(self, other: "Money") -> "Money"`: trả về `Money(self.amount + other.amount, self.currency)`',
      'Cài đặt `__eq__(self, other: object) -> bool`: trả về `isinstance(other, Money) and self.amount == other.amount and self.currency == other.currency`',
      'Cài đặt `__repr__(self) -> str`: trả về `f"Money({self.amount}, \'{self.currency}\')"`',
    ],
    starterCode: `class Money:
    def __init__(self, amount: int, currency: str = "USD") -> None:
        self.amount = amount
        self.currency = currency

    # TODO: Cài đặt __add__, __eq__ và __repr__
    pass
`,
    solutionCode: `class Money:
    def __init__(self, amount: int, currency: str = "USD") -> None:
        self.amount = amount
        self.currency = currency

    def __add__(self, other: "Money") -> "Money":
        return Money(self.amount + other.amount, self.currency)

    def __eq__(self, other: object) -> bool:
        return (
            isinstance(other, Money)
            and self.amount == other.amount
            and self.currency == other.currency
        )

    def __repr__(self) -> str:
        return f"Money({self.amount}, '{self.currency}')"
`,
    hints: [
      'Gợi ý 1: Trong `def __add__(self, other: "Money") -> "Money":`, trả về một đối tượng mới `return Money(self.amount + other.amount, self.currency)`.',
      'Gợi ý 2: Trong `def __eq__(self, other: object) -> bool:`, kiểm tra `isinstance(other, Money)` cùng `self.amount == other.amount` và `self.currency == other.currency`.',
      'Gợi ý 3: Trong `def __repr__(self) -> str:`, trả về `f"Money({self.amount}, \'{self.currency}\')"`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Nạp chồng toán tử `+` bằng `__add__` trả về thực thể mới',
        codeSnippet: `    def __add__(self, other: "Money") -> "Money":\n        return Money(self.amount + other.amount, self.currency)`,
        explanation:
          'Khi bạn viết `m1 + m2`, CPython dịch thành `m1.__add__(m2)` và trả về một đối tượng `Money` mới mà không làm biến đổi `m1` hay `m2`.',
      },
      {
        stepTitle: 'Bước 2: So sánh giá trị bằng `__eq__` và hiển thị debug bằng `__repr__`',
        codeSnippet: `    def __eq__(self, other: object) -> bool:\n        return isinstance(other, Money) and self.amount == other.amount and self.currency == other.currency\n\n    def __repr__(self) -> str:\n        return f"Money({self.amount}, '{self.currency}')"`,
        explanation:
          'Nếu không cài đặt `__eq__`, toán tử `==` mặc định trên class sẽ so sánh địa chỉ vùng nhớ (`is`), khiến `Money(10) == Money(10)` trả về `False`!',
      },
    ],
    commonMistakes: [
      'Sửa trực tiếp `self.amount += other.amount` bên trong `__add__` làm đột biến toán hạng đầu tiên khi cộng!',
      'In kết quả bằng `print()` bên trong `__repr__` thay vì `return` một chuỗi `str`.',
    ],
    testCases: [
      {
        id: 'tc-s2-40-dunder',
        description: 'Cài đặt đầy đủ __add__, __eq__ và __repr__ cho lớp Money',
        inputDescription: 'Money(50) + Money(70) == Money(120)',
        expectedOutput: "True | repr: Money(120, 'USD')",
        requiredPatterns: [
          'def __add__(',
          'Money(self.amount + other.amount, self.currency)',
          'def __eq__(',
          'def __repr__(',
        ],
      },
    ],
  },
  {
    id: 'ex-s2-class-attr-shared-bug',
    title: 'Bài 41: Săn Bug Thuộc tính Lớp Khả biến Dùng chung (Class Attribute vs Instance Attribute)',
    category: 'debug-rescue',
    stageId: 'stage-2',
    level: 'basic',
    relatedLessonId: 's2-oop-mro-dunders',
    problemStatement:
      'Lập trình viên từ TypeScript/Java/C# chuyển sang Python rất hay khai báo thuộc tính ngay trong thân `class`: `class ShoppingCart: items: list[str] = []`. Trong TS/Java, mỗi khi `new ShoppingCart()` sẽ tạo một mảng `items` riêng cho từng giỏ hàng. Nhưng trong Python, biến gán trong thân `class` là **Class Attribute (Thuộc tính tĩnh dùng chung cho toàn bộ các Instance)**! Hậu quả là khách hàng A thêm hàng vào giỏ thì giỏ hàng của khách hàng B, C, D cũng tự động xuất hiện món hàng đó! Hãy sửa lớp `ShoppingCart` bằng cách khởi tạo `self.items: list[str] = []` bên trong hàm tạo `__init__`.',
    realWorldContext:
      'Đây là lỗi OOP nghiêm trọng nhất khi chuyển từ Java/C#/TypeScript sang Python: nhầm lẫn giữa khai báo Type Annotation trên class và gán giá trị khả biến trên `Class.__dict__`.',
    requirements: [
      'Xóa bỏ dòng gán thuộc tính lớp khả biến `items: list[str] = []` ở cấp class',
      'Khởi tạo thuộc tính thực thể độc lập `self.items: list[str] = []` bên trong `def __init__(self) -> None:`',
      'Giữ nguyên phương thức `add_item(self, item: str) -> list[str]` thêm vào `self.items` và trả về `self.items`',
    ],
    starterCode: `class ShoppingCart:
    # BUG NGHIÊM TRỌNG: Khai báo list ở cấp class khiến MỌI giỏ hàng dùng chung 1 danh sách!
    items: list[str] = []

    # TODO: Xóa biến cấp class phía trên và khởi tạo self.items = [] trong __init__
    def add_item(self, item: str) -> list[str]:
        self.items.append(item)
        return self.items
`,
    solutionCode: `class ShoppingCart:
    def __init__(self) -> None:
        self.items: list[str] = []

    def add_item(self, item: str) -> list[str]:
        self.items.append(item)
        return self.items
`,
    hints: [
      'Gợi ý 1: Xóa dòng `items: list[str] = []` nằm trực tiếp dưới `class ShoppingCart:`.',
      'Gợi ý 2: Viết phương thức `def __init__(self) -> None:` và bên trong gán `self.items: list[str] = []`.',
      'Gợi ý 3: Giữ nguyên phương thức `add_item`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Chuyển danh sách khả biến vào `self.__dict__` trong `__init__`',
        codeSnippet: `    def __init__(self) -> None:\n        self.items: list[str] = []`,
        explanation:
          'Khi gán `self.items = []` bên trong `__init__`, mỗi lần gọi `ShoppingCart()` sẽ tạo một danh sách `list` mới nằm riêng trong từ điển của thực thể đó (`self.__dict__`).',
      },
      {
        stepTitle: 'Bước 2: Thao tác cô lập trên từng giỏ hàng',
        codeSnippet: `    def add_item(self, item: str) -> list[str]:\n        self.items.append(item)\n        return self.items`,
        explanation:
          'Giờ đây `cart1.add_item("Book")` và `cart2.add_item("Pen")` hoàn toàn độc lập với nhau.',
      },
    ],
    commonMistakes: [
      'Khai báo `items = []` hoặc `cache = {}` trực tiếp bên trong thân `class` theo thói quen của TypeScript/Java.',
      'Quên từ khóa `self.` khi truy cập `items.append(item)` bên trong phương thức gây lỗi `NameError`.',
    ],
    testCases: [
      {
        id: 'tc-s2-41-class-attr',
        description: 'Khởi tạo self.items trong __init__ để mỗi giỏ hàng có danh sách riêng biệt',
        inputDescription: 'c1 = ShoppingCart(); c2 = ShoppingCart(); c1.add_item("MacBook")',
        expectedOutput: "c1.items == ['MacBook'] và c2.items == []",
        requiredPatterns: ['def __init__(self)', 'self.items', 'def add_item(', 'self.items.append(item)'],
        forbiddenPatterns: [
          {
            pattern: '\n    items: list[str] = []',
            reason: 'Không được gán `items = []` ở cấp Class! Hãy khởi tạo `self.items = []` bên trong `__init__`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s2-dataclass-slots-frozen',
    title: 'Bài 42: Tối ưu Entity với @dataclass(slots=True, frozen=True) & field(default_factory=list)',
    category: 'code-gym',
    stageId: 'stage-2',
    level: 'advanced',
    relatedLessonId: 's2-typing-dataclasses',
    problemStatement:
      'Viết tay `__init__`, `__repr__`, `__eq__` cho mọi lớp dữ liệu là công việc lặp đi lặp lại nhàm chán. Từ Python 3.7 (và nâng cấp mạnh ở Python 3.10+), decorator **`@dataclass(slots=True, frozen=True)`** tự động sinh toàn bộ các phương thức đó, đồng thời bật **`slots=True`** (giảm ~40-60% RAM và tăng tốc truy cập thuộc tính nhờ loại bỏ `__dict__` động) và **`frozen=True`** (đóng băng đối tượng thành bất biến như Value Object trong DDD)! Đặc biệt, `@dataclass` chặn đứng lỗi dùng chung list bằng cách cấm viết `tags: list[str] = []` và bắt buộc dùng `field(default_factory=list)`. Hãy định nghĩa lớp `AuditEvent` chuẩn Python 3.10+.',
    realWorldContext:
      'Trong kiến trúc Clean Architecture và Domain-Driven Design (DDD), các Domain Event và Value Object luôn được khai báo bằng `@dataclass(slots=True, frozen=True)` để vừa an toàn đa luồng vừa tiết kiệm bộ nhớ khi giữ hàng triệu thực thể trong RAM.',
    requirements: [
      'Trang trí lớp `AuditEvent` bằng `@dataclass(slots=True, frozen=True)`',
      'Khai báo trường `action: str` và `tags: list[str] = field(default_factory=list)`',
    ],
    starterCode: `from dataclasses import dataclass, field

# TODO: Gắn @dataclass(slots=True, frozen=True) cho lớp AuditEvent
# với trường action: str và tags: list[str] = field(default_factory=list)
class AuditEvent:
    pass
`,
    solutionCode: `from dataclasses import dataclass, field

@dataclass(slots=True, frozen=True)
class AuditEvent:
    action: str
    tags: list[str] = field(default_factory=list)
`,
    hints: [
      'Gợi ý 1: Đặt `@dataclass(slots=True, frozen=True)` ngay phía trên `class AuditEvent:`.',
      'Gợi ý 2: Khai báo thuộc tính đầu tiên `action: str`.',
      'Gợi ý 3: Khai báo thuộc tính thứ hai `tags: list[str] = field(default_factory=list)` (xóa từ khóa `pass`).',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Kích hoạt `__slots__` tự động và tính bất biến với `@dataclass(slots=True, frozen=True)`',
        codeSnippet: `@dataclass(slots=True, frozen=True)\nclass AuditEvent:`,
        explanation:
          '`slots=True` (ra mắt ở Python 3.10) tự động tạo mảng C cố định cho các trường thay vì cấp phát `dict` cho mỗi thực thể; `frozen=True` chặn mọi phép gán `event.action = ...` sau khi khởi tạo.',
      },
      {
        stepTitle: 'Bước 2: Cấp phát danh sách mặc định an toàn bằng `field(default_factory=list)`',
        codeSnippet: `    action: str\n    tags: list[str] = field(default_factory=list)`,
        explanation:
          'Mỗi khi một `AuditEvent` mới được tạo mà không truyền `tags`, dataclass sẽ gọi `list()` để tạo danh sách riêng cho thực thể đó.',
      },
    ],
    commonMistakes: [
      'Viết `tags: list[str] = []` trong `@dataclass` — Python sẽ ném ngay lỗi `ValueError: mutable default <class "list"> for field tags is not allowed: use default_factory`!',
      'Truyền `default_factory=list()` (có ngoặc tròn) thay vì `default_factory=list`.',
    ],
    testCases: [
      {
        id: 'tc-s2-42-dataclass',
        description: 'Định nghĩa @dataclass(slots=True, frozen=True) với field(default_factory=list)',
        inputDescription: 'AuditEvent("USER_LOGIN")',
        expectedOutput: "AuditEvent(action='USER_LOGIN', tags=[])",
        requiredPatterns: [
          '@dataclass(slots=True, frozen=True)',
          'class AuditEvent:',
          'action: str',
          'field(default_factory=list)',
        ],
        forbiddenPatterns: [
          {
            pattern: '= []',
            reason: 'Trong `@dataclass`, dùng `= []` sẽ bị chặn bởi `ValueError`! Hãy dùng `field(default_factory=list)`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s2-property-validation',
    title: 'Bài 43: Đóng gói Thuộc tính & Kiểm tra Ràng buộc bằng @property và @setter',
    category: 'js-to-py',
    stageId: 'stage-2',
    level: 'basic',
    relatedLessonId: 's2-oop-mro-dunders',
    problemStatement:
      'Trong Java, bạn phải viết cặp hàm `getCelsius()` và `setCelsius(val)` ngay từ đầu phòng khi sau này cần thêm logic kiểm tra. Trong Python, bạn cứ dùng thuộc tính công khai bình thường, và khi cần thêm logic kiểm tra ràng buộc (Validation), bạn chỉ việc gắn decorator **`@property`** và **`@<name>.setter`** — phía người gọi vẫn dùng cú pháp gán dấu chấm `sensor.celsius = 25.0` tự nhiên mà không phải sửa bất kỳ dòng code nào! Hãy hoàn thiện lớp `Thermostat` lưu trữ ở biến nội bộ `self._celsius` và ném `ValueError("Below absolute zero")` nếu nhiệt độ `< -273.15`.',
    realWorldContext:
      'Cơ chế Descriptor đứng sau `@property` cho phép nâng cấp một thuộc tính dữ liệu thường thành thuộc tính tính toán động (Computed Property) hoặc có kiểm duyệt đầu vào mà vẫn giữ nguyên 100% tương thích ngược cho API của thư viện.',
    requirements: [
      'Định nghĩa `@property` cho `def celsius(self) -> float:` trả về `self._celsius`',
      'Định nghĩa `@celsius.setter` cho `def celsius(self, value: float) -> None:`: nếu `value < -273.15` thì `raise ValueError("Below absolute zero")`, ngược lại gán `self._celsius = value`',
    ],
    starterCode: `class Thermostat:
    def __init__(self, celsius: float = 20.0) -> None:
        self.celsius = celsius

    # TODO: Định nghĩa @property celsius trả về self._celsius
    # và @celsius.setter kiểm tra nếu value < -273.15 thì raise ValueError("Below absolute zero")
    pass
`,
    solutionCode: `class Thermostat:
    def __init__(self, celsius: float = 20.0) -> None:
        self.celsius = celsius

    @property
    def celsius(self) -> float:
        return self._celsius

    @celsius.setter
    def celsius(self, value: float) -> None:
        if value < -273.15:
            raise ValueError("Below absolute zero")
        self._celsius = value
`,
    hints: [
      'Gợi ý 1: Viết `@property` phía trên `def celsius(self) -> float: return self._celsius`.',
      'Gợi ý 2: Viết `@celsius.setter` phía trên `def celsius(self, value: float) -> None:`.',
      'Gợi ý 3: Lưu ý bên trong getter và setter phải thao tác trên biến có gạch dưới `self._celsius` (nếu gán `self.celsius = value` trong setter sẽ gây đệ quy vô tận `RecursionError`!).',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Tạo Getter truy cập thuộc tính ẩn `self._celsius` bằng `@property`',
        codeSnippet: `    @property\n    def celsius(self) -> float:\n        return self._celsius`,
        explanation:
          'Mỗi khi đọc `t.celsius`, Python tự động kích hoạt hàm getter này và trả về giá trị từ thuộc tính lưu trữ `self._celsius`.',
      },
      {
        stepTitle: 'Bước 2: Chặn giá trị không hợp lệ ngay tại phép gán bằng `@celsius.setter`',
        codeSnippet: `    @celsius.setter\n    def celsius(self, value: float) -> None:\n        if value < -273.15:\n            raise ValueError("Below absolute zero")\n        self._celsius = value`,
        explanation:
          'Cả trong `__init__` (`self.celsius = celsius`) lẫn bên ngoài (`t.celsius = -300`), mọi phép gán đều bắt buộc đi qua chốt kiểm duyệt của `@celsius.setter`.',
      },
    ],
    commonMistakes: [
      'Gán `self.celsius = value` (không có dấu gạch dưới `_`) bên trong hàm `@celsius.setter` khiến setter tự gọi lại chính nó đến khi tràn ngăn xếp (`RecursionError: maximum recursion depth exceeded`)!',
      'Đặt tên phương thức setter khác với tên phương thức `@property` (hai phương thức getter và setter bắt buộc phải trùng tên `def celsius(...)`).',
    ],
    testCases: [
      {
        id: 'tc-s2-43-property',
        description: 'Bảo vệ thuộc tính bằng @property và @celsius.setter thao tác trên self._celsius',
        inputDescription: 't = Thermostat(25.0); t.celsius = -300.0',
        expectedOutput: 't.celsius == 25.0 | raises ValueError("Below absolute zero")',
        requiredPatterns: [
          '@property',
          'return self._celsius',
          '@celsius.setter',
          'if value < -273.15:',
          'raise ValueError("Below absolute zero")',
          'self._celsius = value',
        ],
      },
    ],
  },
  {
    id: 'ex-s2-protocol-duck-typing',
    title: 'Bài 44: Thiết kế Giao diện Linh hoạt với typing.Protocol (Structural Subtyping thay thế interface TS)',
    category: 'js-to-py',
    stageId: 'stage-2',
    level: 'advanced',
    relatedLessonId: 's2-typing-dataclasses',
    problemStatement:
      'Trong Java/C# ( hay `abc.ABC` của Python), một lớp muốn thỏa mãn giao diện phải kế thừa tường minh (`class SmsSender(Notifier)` — gọi là **Nominal Subtyping**). Nhưng trong TypeScript, `interface` hoạt động theo kiểu **Structural Subtyping (Static Duck Typing)**: chỉ cần đối tượng có đúng phương thức là tự động khớp mà không cần kế thừa! Từ Python 3.8 (PEP 544), **`typing.Protocol`** mang đúng sức mạnh `interface` của TypeScript vào Python! Hãy định nghĩa `class SupportsExport(Protocol):` có phương thức `def export_csv(self) -> str: ...` và hàm `run_export(source: SupportsExport) -> str`.',
    realWorldContext:
      'Khi viết thư viện hoặc áp dụng Dependency Inversion trong Clean Architecture, `typing.Protocol` cho phép bạn định nghĩa Interface ngay tại tầng Domain mà các lớp bên thứ 3 (như `DataFrame` hay `MockObject`) tự động thỏa mãn không cần kế thừa.',
    requirements: [
      'Định nghĩa `class SupportsExport(Protocol):` kế thừa `Protocol` từ `typing`',
      'Khai báo chữ ký phương thức `def export_csv(self) -> str: ...` (dùng dấu ba chấm `...` Ellipsis chuẩn Protocol)',
      'Viết hàm `def run_export(source: SupportsExport) -> str:` trả về `source.export_csv()`',
    ],
    starterCode: `from typing import Protocol

# TODO: Định nghĩa class SupportsExport(Protocol): có phương thức def export_csv(self) -> str: ...
# và hàm run_export(source: SupportsExport) -> str trả về source.export_csv()
pass
`,
    solutionCode: `from typing import Protocol

class SupportsExport(Protocol):
    def export_csv(self) -> str:
        ...

def run_export(source: SupportsExport) -> str:
    return source.export_csv()
`,
    hints: [
      'Gợi ý 1: Khai báo `class SupportsExport(Protocol):`.',
      'Gợi ý 2: Bên trong `SupportsExport`, viết `def export_csv(self) -> str:` và thân hàm chỉ cần đặt dấu ba chấm `...` (Ellipsis).',
      'Gợi ý 3: Viết hàm `def run_export(source: SupportsExport) -> str:` và `return source.export_csv()`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Khai báo hợp đồng cấu trúc bằng `typing.Protocol` và `...`',
        codeSnippet: `class SupportsExport(Protocol):\n    def export_csv(self) -> str:\n        ...`,
        explanation:
          'Trong Python, hằng số `...` (`Ellipsis`) là quy ước chuẩn PEP 484/544 để khai báo thân phương thức trừu tượng trong `Protocol` và file `.pyi` stub.',
      },
      {
        stepTitle: 'Bước 2: Nhận mọi đối tượng tương thích cấu trúc trong `run_export`',
        codeSnippet: `def run_export(source: SupportsExport) -> str:\n    return source.export_csv()`,
        explanation:
          'Bất kỳ class nào có phương thức `export_csv(self) -> str` đều được `mypy`/`pyright` chấp nhận truyền vào `run_export` mà không cần kế thừa `SupportsExport`.',
      },
    ],
    commonMistakes: [
      'Bắt các lớp con phải kế thừa `SupportsExport` — làm mất đi ý nghĩa Duck Typing không phụ thuộc kế thừa của `Protocol`.',
      'Quên kế thừa `Protocol` trong `class SupportsExport(Protocol):` khiến trình kiểm tra kiểu coi đây là một lớp cụ thể thông thường.',
    ],
    testCases: [
      {
        id: 'tc-s2-44-protocol',
        description: 'Định nghĩa đúng giao diện SupportsExport(Protocol) với ... và hàm run_export',
        inputDescription: 'run_export(ReportTable())',
        expectedOutput: "'id,name\\n1,Alice'",
        requiredPatterns: [
          'class SupportsExport(Protocol):',
          'def export_csv(self) -> str:',
          '...',
          'def run_export(source: SupportsExport) -> str:',
          'return source.export_csv()',
        ],
      },
    ],
  },
  {
    id: 'ex-s2-generic-type-312',
    title: 'Bài 45: Viết Hàm & Lớp Generic Kiểu mới Chuẩn Python 3.12+ (def first[T](items: list[T]))',
    category: 'js-to-py',
    stageId: 'stage-2',
    level: 'advanced',
    relatedLessonId: 's2-typing-dataclasses',
    problemStatement:
      'Trước Python 3.12, để viết hàm Generic như `function first<T>(items: T[]): T` của TypeScript, bạn phải `from typing import TypeVar` rồi khai báo `T = TypeVar("T")` ở ngoài hàm rất rườm rà. Từ **Python 3.12 (PEP 695 - Type Parameter Syntax)**, Python chính thức hỗ trợ cú pháp tham số kiểu trực tiếp bằng ngoặc vuông **`def first_or_default[T](items: list[T], default: T) -> T:`** và **`class Box[T]:`** gọn đẹp y hệt TypeScript/Rust! Hãy viết hàm `first_or_default[T]` theo chuẩn Python 3.12+.',
    realWorldContext:
      'Cú pháp Generic `[T]` mới của Python 3.12+ (cùng từ khóa `type Point = tuple[float, float]`) giúp các codebase hiện đại loại bỏ hoàn toàn hàng trăm dòng khai báo `TypeVar` và `Generic[T]` thủ công.',
    requirements: [
      'Khai báo hàm với cú pháp PEP 695: `def first_or_default[T](items: list[T], default: T) -> T:` (không dùng `TypeVar`)',
      'Trả về `items[0] if items else default`',
    ],
    starterCode: `# Cách cũ trước Python 3.12 phải dùng: T = TypeVar("T")
# TODO: Viết hàm first_or_default[T](items: list[T], default: T) -> T theo cú pháp mới của Python 3.12+
pass
`,
    solutionCode: `def first_or_default[T](items: list[T], default: T) -> T:
    return items[0] if items else default
`,
    hints: [
      'Gợi ý 1: Đặt `[T]` ngay sau tên hàm: `def first_or_default[T](items: list[T], default: T) -> T:`.',
      'Gợi ý 2: Không cần import `TypeVar` từ `typing`.',
      'Gợi ý 3: Bên trong hàm, viết `return items[0] if items else default`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Khai báo tham số kiểu nội tuyến `[T]` chuẩn PEP 695 (Python 3.12+)',
        codeSnippet: `def first_or_default[T](items: list[T], default: T) -> T:`,
        explanation:
          'Trình thông dịch Python 3.12+ tự động tạo phạm vi từ vựng riêng cho biến kiểu `T`, đảm bảo nếu truyền `list[int]` và `default: int` thì kiểu trả về được suy luận chính xác là `int`.',
      },
      {
        stepTitle: 'Bước 2: Trả về phần tử đầu tiên hoặc giá trị mặc định an toàn',
        codeSnippet: `    return items[0] if items else default`,
        explanation:
          'Kiểm tra `if items` (Truthy khi danh sách không rỗng) giúp tránh lỗi `IndexError` khi danh sách rỗng.',
      },
    ],
    commonMistakes: [
      'Dùng ngoặc nhọn `<T>` như TypeScript/Java (`def first_or_default<T>`) gây lỗi `SyntaxError` — trong Python mọi tham số kiểu Generic đều dùng ngoặc vuông `[T]`!',
      'Vẫn import và khai báo `T = TypeVar("T")` cũ kỹ khi đang chạy trên Python 3.12+.',
    ],
    testCases: [
      {
        id: 'tc-s2-45-generic312',
        description: 'Sử dụng cú pháp Generic mới def first_or_default[T](items: list[T], default: T) -> T của Python 3.12+',
        inputDescription: 'first_or_default([10, 20], 0), first_or_default([], "none")',
        expectedOutput: "10, 'none'",
        requiredPatterns: [
          'def first_or_default[T](items: list[T], default: T) -> T:',
          'return items[0] if items else default',
        ],
        forbiddenPatterns: [
          {
            pattern: 'TypeVar',
            reason: 'Hãy sử dụng cú pháp Generic mới `[T]` của Python 3.12+ (PEP 695) thay vì `TypeVar` cũ!',
          },
        ],
      },
    ],
  },
];

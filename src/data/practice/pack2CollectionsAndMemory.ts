import { PracticeExercise } from '@/types/practice.types';

export const PACK_2_EXERCISES: PracticeExercise[] = [
  {
    id: 'ex-s1-mutable-trap',
    title: 'Bài 16: Khắc phục Bẫy Tham số Mặc định Khả biến (Mutable Default Arguments)',
    category: 'debug-rescue',
    stageId: 'stage-1',
    level: 'fundamental',
    relatedLessonId: 's1-functions-exceptions',
    problemStatement:
      'Trong JavaScript, `function enroll(course, courses = [])` tạo mảng `[]` mới mỗi khi gọi hàm. Nhưng trong Python, giá trị mặc định được khởi tạo **đúng 1 lần duy nhất tại thời điểm đọc dòng `def` (Define Time)** và lưu trong `func.__defaults__`! Do đó, danh sách môn học của sinh viên trước bị dính sang sinh viên sau. Hãy sửa lại hàm `enroll_course` chuẩn Pythonic với giá trị mặc định `None` và kiểm tra bằng toán tử `is None`.',
    realWorldContext:
      'Đây là câu hỏi phỏng vấn Python số 1 toàn cầu và cũng là nguyên nhân gây rò rỉ dữ liệu chéo giữa các HTTP Request khi lập trình viên truyền `headers: dict = {}` hoặc `items: list = []` làm tham số mặc định.',
    requirements: [
      'Đổi kiểu và giá trị mặc định của tham số `courses` thành `list[str] | None = None`',
      'Kiểm tra `if courses is None:` bên trong thân hàm để khởi tạo `courses = []` mới ở mỗi lần gọi',
      'Thêm `course_name` vào danh sách `courses` và trả về `courses`',
    ],
    starterCode: `def enroll_course(course_name: str, courses: list[str] = []) -> list[str]:
    # TODO: Sửa lại chữ ký hàm phía trên dùng None làm mặc định
    # và khởi tạo list mới nếu courses is None
    courses.append(course_name)
    return courses
`,
    solutionCode: `def enroll_course(course_name: str, courses: list[str] | None = None) -> list[str]:
    if courses is None:
        courses = []
    courses.append(course_name)
    return courses
`,
    hints: [
      'Gợi ý 1: Trong chữ ký hàm `def`, hãy thay `courses: list[str] = []` bằng `courses: list[str] | None = None`.',
      'Gợi ý 2: Ngay dòng đầu tiên bên trong hàm, dùng toán tử định danh `if courses is None:` (không dùng `== None`).',
      'Gợi ý 3: Bên trong nhánh `if`, gán `courses = []` rồi giữ nguyên `courses.append(course_name)` và `return courses`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Dùng None làm giá trị đánh dấu (Sentinel Value) trên chữ ký hàm',
        codeSnippet: `def enroll_course(course_name: str, courses: list[str] | None = None) -> list[str]:`,
        explanation:
          'Vì `None` là đối tượng bất biến (Immutable Singleton), việc lưu `None` trong `__defaults__` tại thời điểm định nghĩa hàm hoàn toàn an toàn và không gây chia sẻ vùng nhớ.',
      },
      {
        stepTitle: 'Bước 2: Cấp phát danh sách mới tại thời điểm gọi hàm (`Call Time`)',
        codeSnippet: `    if courses is None:\n        courses = []\n    courses.append(course_name)\n    return courses`,
        explanation:
          'Mỗi khi hàm được gọi mà không truyền `courses`, nhánh `if` sẽ tạo một đối tượng `list` mới tinh trên Heap dành riêng cho lần gọi đó.',
      },
    ],
    commonMistakes: [
      'Giữ nguyên `= []` trên dòng `def` — Python chỉ khởi tạo `[]` đúng 1 lần khi nạp module!',
      'Viết `if not courses:` thay vì `if courses is None:` — nếu người gọi cố tình truyền một list rỗng có sẵn `my_list = []` vào để hàm điền dữ liệu, `if not courses:` sẽ tạo list mới và làm mất liên kết với `my_list` của người gọi!',
    ],
    testCases: [
      {
        id: 'tc-s1-16-mutable-1',
        description: 'Gọi enroll_course("Python Core") lần 1 trả về ["Python Core"] và dùng None làm mặc định',
        inputDescription: 'enroll_course("Python Core")',
        expectedOutput: "['Python Core']",
        requiredPatterns: ['def enroll_course', 'None', 'if courses is None:', 'courses.append(course_name)'],
        forbiddenPatterns: [
          {
            pattern: 'list[str] = []',
            reason: 'Không được dùng `= []` làm giá trị mặc định trên dòng `def`!',
          },
          {
            pattern: '=[]):',
            reason: 'Không được dùng `=[]` làm giá trị mặc định trên dòng `def`!',
          },
        ],
      },
      {
        id: 'tc-s1-16-mutable-2',
        description: 'Gọi enroll_course("FastAPI") lần 2 độc lập không bị dính dữ liệu lần 1',
        inputDescription: 'enroll_course("FastAPI")',
        expectedOutput: "['FastAPI']",
        requiredPatterns: ['courses = []', 'return courses'],
      },
    ],
  },
  {
    id: 'ex-s1-matrix-aliasing-bug',
    title: 'Bài 17: Giải đố Bẫy Nhân Bản Danh sách 2 Chiều [[0] * cols] * rows',
    category: 'brain-teaser',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-env-memory',
    problemStatement:
      'Khi cần tạo bảng cờ caro hoặc ma trận `rows x cols` chứa toàn số `0`, nhiều người viết `grid = [[0] * cols] * rows`. Nhưng khi gán `grid[0][0] = 9`, cả cột đầu tiên của MỌI HÀNG đều biến thành `9` (`[[9, 0], [9, 0], [9, 0]]`)! Tại sao? Vì toán tử `* rows` bên ngoài không sao chép mảng con mà chỉ **nhân bản `rows` con trỏ cùng trỏ vào đúng 1 đối tượng `list` hàng duy nhất trên Heap (Row Aliasing)**! Hãy sửa hàm `create_board_and_mark(rows: int, cols: int) -> list[list[int]]` bằng List Comprehension `[[0] * cols for _ in range(rows)]`.',
    realWorldContext:
      'Lỗi Row Aliasing này cực kỳ phổ biến trong các bài toán Quy hoạch động (Dynamic Programming), xử lý ảnh 2D và lập trình game lưới khi khởi tạo ma trận trạng thái.',
    requirements: [
      'Khởi tạo `grid = [[0] * cols for _ in range(rows)]` để mỗi hàng là một đối tượng `list` độc lập trên Heap',
      'Đánh dấu ô góc trên trái `grid[0][0] = 9` và trả về `grid`',
      'Tuyệt đối không dùng `[[0] * cols] * rows`',
    ],
    starterCode: `def create_board_and_mark(rows: int, cols: int) -> list[list[int]]:
    # BUG: Nhân bản bằng * rows khiến mọi hàng trỏ chung vào 1 list duy nhất!
    grid = [[0] * cols] * rows
    grid[0][0] = 9
    return grid
`,
    solutionCode: `def create_board_and_mark(rows: int, cols: int) -> list[list[int]]:
    grid = [[0] * cols for _ in range(rows)]
    grid[0][0] = 9
    return grid
`,
    hints: [
      'Gợi ý 1: Toán tử `* cols` bên trong `[0] * cols` là an toàn vì `0` là số nguyên bất biến (Immutable `int`).',
      'Gợi ý 2: Nhưng vòng lặp tạo các hàng phải dùng List Comprehension `for _ in range(rows)` để chạy biểu thức `[0] * cols` mới ở mỗi vòng.',
      'Gợi ý 3: Thay dòng khởi tạo bằng `grid = [[0] * cols for _ in range(rows)]`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Tạo từng hàng độc lập bằng List Comprehension',
        codeSnippet: `    grid = [[0] * cols for _ in range(rows)]`,
        explanation:
          'Trong List Comprehension, biểu thức `[0] * cols` ở vế trái được thực thi lại `rows` lần, cấp phát `rows` đối tượng `list` riêng biệt có `id()` khác nhau hoàn toàn.',
      },
      {
        stepTitle: 'Bước 2: Cập nhật phần tử `grid[0][0]` an toàn',
        codeSnippet: `    grid[0][0] = 9\n    return grid`,
        explanation:
          'Giờ đây chỉ duy nhất ô đầu tiên của hàng 0 đổi thành `9`, các hàng còn lại giữ nguyên `[0, 0, ...]`.',
      },
    ],
    commonMistakes: [
      'Viết `[[0] * cols] * rows` khiến `id(grid[0]) == id(grid[1])` (mọi hàng là cùng một list).',
      'Dùng biến lặp thừa tên mà không dùng biến quy ước `_` khi không cần dùng chỉ số hàng.',
    ],
    testCases: [
      {
        id: 'tc-s1-17-matrix',
        description: 'Tạo ma trận 2 chiều độc lập các hàng bằng [[0] * cols for _ in range(rows)]',
        inputDescription: 'create_board_and_mark(3, 2)',
        expectedOutput: '[[9, 0], [0, 0], [0, 0]]',
        requiredPatterns: ['[[0] * cols for _ in range(rows)]', 'grid[0][0] = 9', 'return grid'],
        forbiddenPatterns: [
          {
            pattern: '] * rows',
            reason: 'Dùng `[[0] * cols] * rows` sẽ gây lỗi Row Aliasing (mọi hàng trỏ chung vào 1 list)!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s1-shallow-vs-deepcopy',
    title: 'Bài 18: Săn Bug Rò rỉ Trạng thái Cấu hình Lồng nhau với copy.deepcopy()',
    category: 'debug-rescue',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-env-memory',
    problemStatement:
      'Trong JS, ` {...config} ` hoặc `Object.assign()` chỉ tạo **Shallow Copy (Bản sao nông)** — các object con bên trong vẫn dùng chung tham chiếu! Python cũng vậy: `base_config.copy()` hoặc `dict(base_config)` chỉ sao chép tầng ngoài cùng. Khi hàm `build_tenant_config` thêm `"admin"` vào `cfg["roles"].append("admin")`, nó vô tình làm bẩn luôn `base_config["roles"]` của toàn hệ thống! Hãy dùng `copy.deepcopy(base_config)` để sao chép đệ quy toàn bộ cây đối tượng.',
    realWorldContext:
      'Khi nhân bản cấu hình mẫu (Default Template Config) cho từng khách hàng (Multi-tenant SaaS) hoặc từng môi trường Staging/Production, dùng Shallow Copy trên cấu trúc JSON lồng nhau sẽ gây rò rỉ quyền hạn nghiêm trọng giữa các tenant.',
    requirements: [
      'Import `copy` (hoặc `from copy import deepcopy`) và tạo bản sao sâu bằng `copy.deepcopy(base_config)`',
      'Thêm `extra_role` vào danh sách `cfg["roles"].append(extra_role)`',
      'Trả về từ điển `cfg` mà không làm thay đổi `base_config` ban đầu',
    ],
    starterCode: `import copy

def build_tenant_config(base_config: dict, extra_role: str) -> dict:
    # BUG: .copy() chỉ là Shallow Copy nên cfg["roles"] vẫn trỏ chung vào base_config["roles"]!
    cfg = base_config.copy()
    cfg["roles"].append(extra_role)
    return cfg
`,
    solutionCode: `import copy

def build_tenant_config(base_config: dict, extra_role: str) -> dict:
    cfg = copy.deepcopy(base_config)
    cfg["roles"].append(extra_role)
    return cfg
`,
    hints: [
      'Gợi ý 1: Module `copy` đã được import sẵn ở đầu file.',
      'Gợi ý 2: Thay `base_config.copy()` bằng `copy.deepcopy(base_config)`.',
      'Gợi ý 3: Giữ nguyên `cfg["roles"].append(extra_role)` và `return cfg`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Sao chép đệ quy toàn bộ cấu trúc lồng nhau với `copy.deepcopy`',
        codeSnippet: `    cfg = copy.deepcopy(base_config)`,
        explanation:
          '`copy.deepcopy()` duyệt đệ quy qua mọi tầng của dictionary và cấp phát danh sách `cfg["roles"]` hoàn toàn mới trên Heap (có bảng `memo` nội bộ để chống lặp vô hạn nếu có tham chiếu vòng).',
      },
      {
        stepTitle: 'Bước 2: Đột biến danh sách con an toàn',
        codeSnippet: `    cfg["roles"].append(extra_role)\n    return cfg`,
        explanation:
          'Thao tác `.append()` giờ đây chỉ tác động lên bản sao của riêng tenant hiện tại, giữ cho `base_config` nguyên vẹn 100%.',
      },
    ],
    commonMistakes: [
      'Dùng `base_config.copy()`, `dict(base_config)` hoặc `{**base_config}` — cả 3 cách này đều chỉ là Shallow Copy!',
      'Đột biến trực tiếp `base_config["roles"].append(extra_role)` mà không tạo bản sao trước.',
    ],
    testCases: [
      {
        id: 'tc-s1-18-deepcopy',
        description: 'Sao chép sâu bằng copy.deepcopy(base_config) để bảo vệ cấu hình gốc',
        inputDescription: 'build_tenant_config({"roles": ["viewer"]}, "admin")',
        expectedOutput: "{'roles': ['viewer', 'admin']} (base_config['roles'] vẫn là ['viewer'])",
        requiredPatterns: ['import copy', 'copy.deepcopy(base_config)', 'cfg["roles"].append(extra_role)'],
        forbiddenPatterns: [
          {
            pattern: 'base_config.copy()',
            reason: '`base_config.copy()` chỉ tạo Shallow Copy, làm rò rỉ thay đổi vào list con `roles`! Hãy dùng `copy.deepcopy(base_config)`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s1-in-place-vs-new-list',
    title: 'Bài 19: Giải đố Sự khác biệt giữa items += [x] (In-place Mutation) và items = items + [x]',
    category: 'brain-teaser',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-env-memory',
    problemStatement:
      'Ai cũng nghĩ `a += b` chỉ là viết tắt của `a = a + b`. Nhưng trong Python, với kiểu khả biến như `list`, hai câu lệnh này hoàn toàn khác nhau về mặt bộ nhớ! `items += [x]` gọi phương thức dunder `__iadd__` (tương đương `items.extend([x])`) làm thay đổi danh sách gốc **tại chỗ (In-place)** nên bên ngoài hàm bị ảnh hưởng. Ngược lại, `items = items + [x]` gọi `__add__` tạo ra một **danh sách mới tinh** trên Heap và gán lại biến cục bộ `items`, giữ nguyên danh sách gốc của người gọi! Hãy sửa hàm `append_pure(items: list[str], new_item: str) -> list[str]` để trở thành hàm thuần khiết (Pure Function) không làm thay đổi danh sách truyền vào.',
    realWorldContext:
      'Trong kiến trúc Redux/State Management hoặc xử lý dữ liệu bất biến (Immutable Data Flow), việc vô tình dùng `+=` trên một `list` truyền vào hàm sẽ làm đột biến dữ liệu gốc ở tầng gọi (Side-effect Bug).',
    requirements: [
      'Không dùng `items += [new_item]` hay `items.append(new_item)` vì chúng đột biến danh sách gốc',
      'Tạo và trả về danh sách mới bằng `return items + [new_item]` (hoặc `[*items, new_item]`)',
    ],
    starterCode: `def append_pure(items: list[str], new_item: str) -> list[str]:
    # BUG: Toán tử += trên list gọi __iadd__ làm đột biến trực tiếp danh sách của người gọi!
    items += [new_item]
    return items
`,
    solutionCode: `def append_pure(items: list[str], new_item: str) -> list[str]:
    return items + [new_item]
`,
    hints: [
      'Gợi ý 1: Toán tử `+` giữa hai list (`items + [new_item]`) luôn cấp phát một đối tượng `list` mới.',
      'Gợi ý 2: Xóa dòng `items += [new_item]`.',
      'Gợi ý 3: Viết trực tiếp `return items + [new_item]`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Hiểu cơ chế In-place Mutation của `+=` (`__iadd__`) trên list',
        codeSnippet: `# items += [new_item] tương đương items.extend([new_item])`,
        explanation:
          'Toán tử `+=` trên `list` sửa đổi trực tiếp vùng nhớ Heap mà tham số `items` đang trỏ tới, làm biến của người gọi bên ngoài bị thay đổi ngoài ý muốn.',
      },
      {
        stepTitle: 'Bước 2: Tạo danh sách mới bằng toán tử `+` (`__add__`)',
        codeSnippet: `    return items + [new_item]`,
        explanation:
          'Biểu thức `items + [new_item]` đọc các phần tử từ `items` và `[new_item]` để tạo một `list` mới có địa chỉ `id()` khác, đảm bảo danh sách gốc của người gọi không hề bị chạm vào.',
      },
    ],
    commonMistakes: [
      'Đánh đồng `items += [x]` với `items = items + [x]` trên kiểu khả biến (`list`).',
      'Gọi `return items.append(new_item)` — vừa làm bẩn list gốc vừa trả về `None`!',
    ],
    testCases: [
      {
        id: 'tc-s1-19-inplace',
        description: 'Trả về danh sách mới bằng items + [new_item] mà không đột biến list gốc bằng +=',
        inputDescription: 'orig = ["a"]; res = append_pure(orig, "b")',
        expectedOutput: "res == ['a', 'b'] và orig vẫn là ['a']",
        requiredPatterns: ['return items + [new_item]'],
        forbiddenPatterns: [
          {
            pattern: '+=',
            reason: 'Trên `list`, toán tử `+=` gọi `__iadd__` gây đột biến tại chỗ danh sách gốc! Hãy dùng `items + [new_item]`.',
          },
          {
            pattern: '.append(',
            reason: '`.append()` làm đột biến danh sách gốc! Hãy trả về danh sách mới bằng `items + [new_item]`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s1-remove-while-iterating',
    title: 'Bài 20: Cứu hộ Bug Nhảy cóc Phần tử khi list.remove() trực tiếp trong Vòng lặp for',
    category: 'debug-rescue',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Hãy xem đoạn code kinh điển gây đau đầu cho hàng triệu lập trình viên: duyệt `for x in scores:` rồi gọi `scores.remove(x)` khi `x < 50`. Nếu `scores = [40, 45, 80]`, khi xóa `40` ở chỉ số `0`, phần tử `45` lập tức bị **dồn sang trái về chỉ số `0`**, trong khi bộ lặp (Iterator) bước sang chỉ số `1` (tức `80`) — thế là `45` bị **nhảy cóc bỏ sót**! Hãy sửa hàm `purge_failing_scores(scores: list[int]) -> list[int]` bằng List Comprehension để lọc an toàn và nhanh gấp nhiều lần.',
    realWorldContext:
      'Đột biến một Collection ngay trong khi đang duyệt qua chính nó là nguồn gốc của những bug "chạy lúc đúng lúc sai" (khi 2 phần tử cần xóa nằm sát nhau thì phần tử thứ 2 luôn thoát nạn).',
    requirements: [
      'Xóa bỏ vòng lặp `for` có gọi `scores.remove(x)`',
      'Sử dụng List Comprehension `[x for x in scores if x >= 50]` để trả về danh sách điểm đạt yêu cầu',
    ],
    starterCode: `def purge_failing_scores(scores: list[int]) -> list[int]:
    # BUG: Xóa phần tử trực tiếp khi đang lặp khiến phần tử kế tiếp bị nhảy cóc!
    for x in scores:
        if x < 50:
            scores.remove(x)
    return scores
`,
    solutionCode: `def purge_failing_scores(scores: list[int]) -> list[int]:
    return [x for x in scores if x >= 50]
`,
    hints: [
      'Gợi ý 1: Không bao giờ gọi `.remove()` hoặc `.pop()` trên danh sách đang được lặp trực tiếp.',
      'Gợi ý 2: Dùng List Comprehension để giữ lại các phần tử thỏa mãn `x >= 50`.',
      'Gợi ý 3: Viết `return [x for x in scores if x >= 50]`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Nhận diện nguyên nhân lỗi nhảy cóc khi xóa trực tiếp trong vòng lặp',
        codeSnippet: `# Khi xóa phần tử ở index i, phần tử i+1 bị trượt về index i`,
        explanation:
          'List Iterator chỉ đơn giản tăng bộ đếm chỉ số nội bộ `0 -> 1 -> 2`. Khi danh sách bị rút ngắn tại chỗ bằng `.remove()`, phần tử ngay kế tiếp bị tụt lùi về vị trí vừa xét nên bị bỏ qua.',
      },
      {
        stepTitle: 'Bước 2: Thay thế vòng lặp xóa tại chỗ bằng List Comprehension lọc phần tử',
        codeSnippet: `    return [x for x in scores if x >= 50]`,
        explanation:
          'Không những tránh được lỗi nhảy cóc chỉ số khi 2 điểm `< 50` đứng cạnh nhau (`[40, 45, 80]`), List Comprehension còn đạt độ phức tạp `O(N)` thay vì `O(N^2)` của việc gọi `.remove()` nhiều lần.',
      },
    ],
    commonMistakes: [
      'Gọi `scores.remove(x)` bên trong `for x in scores:` làm lệch con trỏ chỉ số của List Iterator.',
      'Dùng điều kiện ngược `x > 50` thay vì `x >= 50` làm mất các điểm vừa tròn 50.',
    ],
    testCases: [
      {
        id: 'tc-s1-20-remove-iter',
        description: 'Lọc sạch 2 phần tử < 50 đứng liền kề [40, 45, 80] bằng List Comprehension',
        inputDescription: 'purge_failing_scores([40, 45, 80])',
        expectedOutput: '[80]',
        requiredPatterns: ['[x for x in scores if x >= 50]'],
        forbiddenPatterns: [
          {
            pattern: '.remove(',
            reason: 'Không gọi `.remove()` khi đang lặp! Vừa gây bug nhảy cóc phần tử liền kề vừa làm chậm thuật toán xuống O(N^2).',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s1-student-stats',
    title: 'Bài 21: Thống kê & Lọc Sinh viên Xuất sắc với List Comprehension & dict.get()',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Trong JS, truy cập thuộc tính không tồn tại `student.gpa` trả về `undefined` êm thấm, nhưng trong Python, truy cập `student["gpa"]` khi khóa `"gpa"` vắng mặt sẽ lập tức ném ngoại lệ `KeyError` làm sập tiến trình! Hãy viết hàm `get_honor_emails(students: list[dict], min_gpa: float = 3.5) -> list[str]` sử dụng **List Comprehension** kết hợp phương thức `.get("gpa", 0.0)` an toàn để trả về danh sách email (viết thường) của các sinh viên có `gpa >= min_gpa`.',
    realWorldContext:
      'Khi đọc dữ liệu từ file JSON/NoSQL thực tế, một số bản ghi sinh viên mới nhập học chưa có trường `"gpa"`. Kết hợp `.get(key, default)` trong List Comprehension vừa phòng thủ `KeyError` vừa thay thế cả cặp `.filter().map()` của JS.',
    requirements: [
      'Sử dụng `s.get("gpa", 0.0) >= min_gpa` để tránh lỗi `KeyError` khi bản ghi thiếu điểm',
      'Sử dụng **List Comprehension** để lọc và biến đổi trong 1 biểu thức',
      'Chuẩn hóa email về chữ thường bằng `s["email"].lower()`',
    ],
    starterCode: `def get_honor_emails(students: list[dict], min_gpa: float = 3.5) -> list[str]:
    # TODO: Viết List Comprehension kết hợp s.get("gpa", 0.0) >= min_gpa
    pass
`,
    solutionCode: `def get_honor_emails(students: list[dict], min_gpa: float = 3.5) -> list[str]:
    return [
        s["email"].lower()
        for s in students
        if s.get("gpa", 0.0) >= min_gpa
    ]
`,
    hints: [
      'Gợi ý 1: Cú pháp List Comprehension có dạng `[bieu_thuc for s in students if dieu_kien]`.',
      'Gợi ý 2: Ở phần điều kiện `if`, dùng `s.get("gpa", 0.0) >= min_gpa` để an toàn khi key `"gpa"` không tồn tại.',
      'Gợi ý 3: Ở phần biểu thức đầu ra, dùng `s["email"].lower()`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Truy cập điểm GPA an toàn bằng `.get()`',
        codeSnippet: `if s.get("gpa", 0.0) >= min_gpa`,
        explanation:
          'Nếu dictionary `s` không có khóa `"gpa"`, `s.get("gpa", 0.0)` trả về `0.0` thay vì ném ngoại lệ `KeyError`.',
      },
      {
        stepTitle: 'Bước 2: Kết hợp lọc và biến đổi trong 1 List Comprehension',
        codeSnippet: `return [s["email"].lower() for s in students if s.get("gpa", 0.0) >= min_gpa]`,
        explanation:
          'Vừa lọc các bản ghi thỏa mãn điều kiện, vừa trích xuất và chuẩn hóa `email` ở tốc độ C-level mà không cần khởi tạo mảng tạm rồi `.append()` thủ công.',
      },
    ],
    commonMistakes: [
      'Dùng `s["gpa"] >= min_gpa` trực tiếp khiến chương trình văng `KeyError` khi gặp sinh viên chưa có điểm.',
      'Quên `return` kết quả của List Comprehension.',
    ],
    testCases: [
      {
        id: 'tc-s1-21-stats',
        description: 'Lọc chính xác sinh viên có GPA >= 3.5 và không bị crash khi thiếu key "gpa"',
        inputDescription: '[{"email": "AN@py.dev", "gpa": 3.8}, {"email": "binh@py.dev"}]',
        expectedOutput: "['an@py.dev']",
        requiredPatterns: ['s["email"].lower()', 'for s in students', 's.get("gpa", 0.0) >= min_gpa'],
        forbiddenPatterns: [
          {
            pattern: 's["gpa"]',
            reason: 'Truy cập trực tiếp `s["gpa"]` sẽ gây lỗi `KeyError` khi thiếu key! Hãy dùng `s.get("gpa", 0.0)`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s1-dict-merge-comprehension',
    title: 'Bài 22: Gộp Cấu hình bằng Toán tử | (PEP 584) và Đảo ngược Từ điển bằng Dict Comprehension',
    category: 'js-to-py',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Trong JS, bạn gộp 2 object bằng `{...defaults, ...overrides}`. Từ Python 3.9 (PEP 584), bạn có thể gộp 2 dictionary cực gọn bằng toán tử hợp **`defaults | overrides`** (vế phải ghi đè vế trái)! Sau khi gộp xong bảng ánh xạ mã lỗi `code_to_name`, hãy dùng **Dict Comprehension** `{v: k for k, v in merged.items()}` để tạo bảng tra cứu ngược từ tên lỗi sang mã số.',
    realWorldContext:
      'Gộp cấu hình mặc định với cấu hình người dùng bằng toán tử `|` và tạo bảng tra cứu 2 chiều (Bidirectional Lookup Map) bằng Dict Comprehension là mẫu thiết kế rất phổ biến trong các trình biên dịch và bộ định tuyến.',
    requirements: [
      'Gộp hai từ điển bằng toán tử `merged = defaults | overrides` (chuẩn Python 3.9+)',
      'Sử dụng Dict Comprehension `{v: k for k, v in merged.items()}` để đảo ngược khóa và giá trị',
      'Trả về từ điển đã đảo ngược',
    ],
    starterCode: `def merge_and_invert_codes(defaults: dict[int, str], overrides: dict[int, str]) -> dict[str, int]:
    # TODO: Gộp defaults và overrides bằng toán tử |
    # TODO: Trả về Dict Comprehension đảo ngược {v: k for k, v in merged.items()}
    pass
`,
    solutionCode: `def merge_and_invert_codes(defaults: dict[int, str], overrides: dict[int, str]) -> dict[str, int]:
    merged = defaults | overrides
    return {v: k for k, v in merged.items()}
`,
    hints: [
      'Gợi ý 1: Dùng `merged = defaults | overrides` để tạo dict mới có các khóa của `overrides` ghi đè lên `defaults`.',
      'Gợi ý 2: Dùng phương thức `.items()` để lấy cả cặp `(k, v)` khi duyệt từ điển.',
      'Gợi ý 3: Viết `return {v: k for k, v in merged.items()}`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Hợp nhất từ điển không làm thay đổi bản gốc bằng toán tử `|`',
        codeSnippet: `    merged = defaults | overrides`,
        explanation:
          'Toán tử `|` (PEP 584) tạo một `dict` mới kết hợp cả hai từ điển; nếu trùng khóa, giá trị từ `overrides` (bên phải) sẽ được ưu tiên.',
      },
      {
        stepTitle: 'Bước 2: Hoán đổi Key-Value bằng Dict Comprehension',
        codeSnippet: `    return {v: k for k, v in merged.items()}`,
        explanation:
          'Cú pháp `{v: k for k, v in ...}` xây dựng từ điển tra cứu ngược trực tiếp ở tốc độ C-level.',
      },
    ],
    commonMistakes: [
      'Quên gọi `.items()` (`for k, v in merged:`) gây lỗi `ValueError: too many values to unpack` vì lặp trực tiếp trên `dict` chỉ trả về `key`!',
      'Dùng `.update()` làm đột biến trực tiếp từ điển `defaults` truyền vào.',
    ],
    testCases: [
      {
        id: 'tc-s1-22-dict-merge',
        description: 'Gộp dict bằng toán tử | và đảo ngược key-value bằng Dict Comprehension',
        inputDescription: 'merge_and_invert_codes({200: "OK", 404: "NotFound"}, {404: "Missing"})',
        expectedOutput: "{'OK': 200, 'Missing': 404}",
        requiredPatterns: ['defaults | overrides', '{v: k for k, v in merged.items()}'],
      },
    ],
  },
  {
    id: 'ex-s1-defaultdict-grouping',
    title: 'Bài 23: Gom nhóm Dữ liệu Giao dịch theo Ngày bằng collections.defaultdict(list)',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Khi gom nhóm (Group By) danh sách bản ghi vào một `dict` thường, bạn luôn phải kiểm tra `if key not in groups: groups[key] = []` trước khi `.append()`. Thư viện chuẩn `collections` cung cấp **`defaultdict(list)`**: mỗi khi truy cập một khóa chưa tồn tại, nó tự động gọi hàm tạo `list()` để khởi tạo danh sách rỗng cho khóa đó! Hãy viết hàm `group_amounts_by_date(txs: list[tuple[str, int]]) -> dict[str, list[int]]` sử dụng `defaultdict(list)`.',
    realWorldContext:
      'Trong các pipeline ETL và báo cáo tài chính, gom nhóm hàng triệu giao dịch theo ngày, theo mã khách hàng hoặc theo danh mục bằng `defaultdict(list)` giúp mã ngắn gọn một nửa và chạy nhanh hơn nhờ xử lý thiếu khóa ở tầng C.',
    requirements: [
      'Khởi tạo `groups = defaultdict(list)` từ module `collections`',
      'Duyệt `for date_str, amount in txs:` và gọi thẳng `groups[date_str].append(amount)` không cần `if`',
      'Trả về `dict(groups)`',
    ],
    starterCode: `from collections import defaultdict

def group_amounts_by_date(txs: list[tuple[str, int]]) -> dict[str, list[int]]:
    # TODO: Khởi tạo defaultdict(list), gom nhóm amount theo date_str và trả về dict(groups)
    pass
`,
    solutionCode: `from collections import defaultdict

def group_amounts_by_date(txs: list[tuple[str, int]]) -> dict[str, list[int]]:
    groups: defaultdict[str, list[int]] = defaultdict(list)
    for date_str, amount in txs:
        groups[date_str].append(amount)
    return dict(groups)
`,
    hints: [
      'Gợi ý 1: Khởi tạo `groups = defaultdict(list)` (truyền tên lớp `list`, KHÔNG truyền `list()`).',
      'Gợi ý 2: Lặp `for date_str, amount in txs:` và gọi `groups[date_str].append(amount)`.',
      'Gợi ý 3: Trả về `return dict(groups)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Đăng ký hàm tạo `list` cho `defaultdict`',
        codeSnippet: `    groups: defaultdict[str, list[int]] = defaultdict(list)`,
        explanation:
          'Khi truyền `list` làm `default_factory`, phương thức dunder `__missing__(key)` của `defaultdict` sẽ tự động chạy `list()` mỗi khi gặp ngày mới.',
      },
      {
        stepTitle: 'Bước 2: Giải nén tuple và `.append()` trực tiếp',
        codeSnippet: `    for date_str, amount in txs:\n        groups[date_str].append(amount)\n    return dict(groups)`,
        explanation:
          'Không cần bất kỳ câu lệnh `if date_str not in groups:` nào, giúp vòng lặp cực kỳ sạch sẽ.',
      },
    ],
    commonMistakes: [
      'Truyền `defaultdict([])` hoặc `defaultdict(list())` gây lỗi `TypeError: first argument must be callable` (phải truyền hàm/lớp `list` chứ không phải một danh sách đã khởi tạo!).',
      'Vẫn viết `if date_str not in groups:` thủ công làm mất đi lợi ích tự động khởi tạo của `defaultdict`.',
    ],
    testCases: [
      {
        id: 'tc-s1-23-defaultdict',
        description: 'Gom nhóm giao dịch bằng defaultdict(list) không cần kiểm tra if key in dict',
        inputDescription: 'group_amounts_by_date([("2025-01-01", 100), ("2025-01-02", 50), ("2025-01-01", 200)])',
        expectedOutput: "{'2025-01-01': [100, 200], '2025-01-02': [50]}",
        requiredPatterns: ['defaultdict(list)', 'for date_str, amount in txs:', 'groups[date_str].append(amount)'],
        forbiddenPatterns: [
          {
            pattern: 'not in groups',
            reason: 'Khi đã dùng `defaultdict(list)`, bạn không cần kiểm tra `if date_str not in groups:` nữa!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s1-counter-top-words',
    title: 'Bài 24: Đếm Tần suất Từ khóa & Tìm Top-K bằng collections.Counter.most_common()',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Trong JS, để đếm tần suất xuất hiện của các phần tử và lấy ra `k` phần tử phổ biến nhất, bạn phải tự viết vòng lặp cộng dồn vào `Map` rồi gọi `Array.from(map.entries()).sort(...)` dài gần 15 dòng. Trong Python, lớp **`collections.Counter`** nhận trực tiếp một iterable và cung cấp phương thức `.most_common(k)` (sử dụng Heap Sort khi `k` nhỏ) chỉ trong 1 dòng! Hãy viết hàm `top_k_hashtags(tags: list[str], k: int = 2) -> list[tuple[str, int]]` trả về `k` hashtag xuất hiện nhiều nhất.',
    realWorldContext:
      'Phân tích Trending Hashtags, thống kê IP gọi API nhiều nhất (Rate Limit Analytics), hoặc đếm tần suất từ vựng (Bag-of-Words) trong NLP đều sử dụng `collections.Counter` làm công cụ chủ lực.',
    requirements: [
      'Sử dụng `Counter(tags)` từ module `collections` để đếm tần suất toàn bộ danh sách',
      'Gọi `.most_common(k)` để trả về danh sách `k` cặp `(tag, count)` cao nhất',
    ],
    starterCode: `from collections import Counter

def top_k_hashtags(tags: list[str], k: int = 2) -> list[tuple[str, int]]:
    # TODO: Dùng Counter(tags) và .most_common(k) để trả về top k hashtag
    pass
`,
    solutionCode: `from collections import Counter

def top_k_hashtags(tags: list[str], k: int = 2) -> list[tuple[str, int]]:
    counts = Counter(tags)
    return counts.most_common(k)
`,
    hints: [
      'Gợi ý 1: Khởi tạo bộ đếm `counts = Counter(tags)`.',
      'Gợi ý 2: Gọi phương thức `counts.most_common(k)` để lấy `k` phần tử có số lần xuất hiện lớn nhất.',
      'Gợi ý 3: Trả về kết quả của `counts.most_common(k)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Đếm tần suất O(N) ở tầng C bằng `Counter(tags)`',
        codeSnippet: `    counts = Counter(tags)`,
        explanation:
          'Hàm tạo của `Counter` duyệt qua `tags` bằng vòng lặp C nội bộ, tự động khởi tạo giá trị `0` cho phần tử mới và cộng dồn.',
      },
      {
        stepTitle: 'Bước 2: Trích xuất Top-K bằng `.most_common(k)`',
        codeSnippet: `    return counts.most_common(k)`,
        explanation:
          '`most_common(k)` dùng `heapq.nlargest` khi `k` nhỏ, đạt độ phức tạp `O(N log k)` thay vì phải sắp xếp toàn bộ từ điển `O(N log N)`.',
      },
    ],
    commonMistakes: [
      'Viết vòng lặp `for tag in tags:` cộng tay vào `dict` rồi tự gọi `sorted()` thay vì dùng `Counter(tags).most_common(k)`.',
      'Gọi `counts.most_common()[k]` (lấy phần tử thứ `k`) thay vì truyền tham số `counts.most_common(k)` (lấy `k` phần tử đầu tiên).',
    ],
    testCases: [
      {
        id: 'tc-s1-24-counter',
        description: 'Đếm tần suất và trả về top k phần tử bằng Counter(tags).most_common(k)',
        inputDescription: 'top_k_hashtags(["py", "js", "py", "rust", "py", "js"], 2)',
        expectedOutput: "[('py', 3), ('js', 2)]",
        requiredPatterns: ['Counter(tags)', '.most_common(k)'],
      },
    ],
  },
  {
    id: 'ex-s1-set-fast-dedup',
    title: 'Bài 25: Tối ưu Tìm kiếm Giao/Hiệu Tập hợp từ O(N^2) xuống O(N) bằng set',
    category: 'js-to-py',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Trong JS, kiểm tra `[x for x in required if x not in granted]` tương đương `required.filter(x => !granted.includes(x))` — đây là cái bẫy hiệu năng **`O(N * M)`** vì mỗi lần kiểm tra `in` trên `list`/`Array` phải quét tuyến tính từ đầu đến cuối! Nhưng trong Python, kiểu **`set`** (Bảng băm - Hash Table) không chỉ tra cứu `O(1)` mà còn hỗ trợ trực tiếp các toán tử toán học: Giao (`&`), Hợp (`|`), Hiệu (`-`) và Hiệu đối xứng (`^`). Hãy viết hàm `find_missing_permissions(required: list[str], granted: list[str]) -> list[str]` dùng phép hiệu tập hợp `set(required) - set(granted)` rồi bọc trong `sorted()` để trả về danh sách quyền còn thiếu theo thứ tự bảng chữ cái.',
    realWorldContext:
      'Khi đối chiếu hàng vạn mã SKU kho hàng hoặc kiểm tra quyền RBAC (Role-Based Access Control), chuyển từ quét `list` sang toán tử tập hợp `set` giúp giảm thời gian chạy từ hàng chục giây xuống vài mili-giây.',
    requirements: [
      'Sử dụng toán tử hiệu tập hợp `set(required) - set(granted)` để tìm các quyền có trong `required` nhưng chưa có trong `granted` với độ phức tạp `O(N)`',
      'Trả về danh sách đã sắp xếp bằng `sorted(set(required) - set(granted))`',
    ],
    starterCode: `def find_missing_permissions(required: list[str], granted: list[str]) -> list[str]:
    # Cách viết O(N^2) chậm chạp: return sorted([p for p in required if p not in granted])
    # TODO: Sử dụng toán tử hiệu tập hợp '-' giữa hai set và bọc trong sorted(...)
    pass
`,
    solutionCode: `def find_missing_permissions(required: list[str], granted: list[str]) -> list[str]:
    missing = set(required) - set(granted)
    return sorted(missing)
`,
    hints: [
      'Gợi ý 1: Chuyển cả 2 danh sách sang tập hợp và trừ nhau: `missing = set(required) - set(granted)`.',
      'Gợi ý 2: Vì `set` không có thứ tự cố định, hãy gọi `sorted(missing)` để nhận về một `list` đã sắp xếp.',
      'Gợi ý 3: Trả về `return sorted(missing)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Tính hiệu hai tập hợp ở tốc độ Bảng băm `O(N)`',
        codeSnippet: `    missing = set(required) - set(granted)`,
        explanation:
          'Toán tử `-` giữa hai `set` loại bỏ mọi phần tử trùng lặp và chỉ giữ lại các phần tử thuộc `required` mà không thuộc `granted` với thời gian tra cứu mỗi phần tử là `O(1)`.',
      },
      {
        stepTitle: 'Bước 2: Chuẩn hóa kết quả đầu ra có thứ tự bằng `sorted()`',
        codeSnippet: `    return sorted(missing)`,
        explanation:
          'Hàm tích hợp `sorted()` nhận bất kỳ Iterable nào (kể cả `set`) và luôn trả về một `list` mới đã sắp xếp tăng dần.',
      },
    ],
    commonMistakes: [
      'Viết `required - granted` trực tiếp trên 2 `list` gây lỗi `TypeError: unsupported operand type(s) for -: "list" and "list"`.',
      'Quên bọc `sorted()` khiến thứ tự phần tử trả về từ `set` bị ngẫu nhiên giữa các lần chạy (do Python bật Hash Randomization bảo mật).',
    ],
    testCases: [
      {
        id: 'tc-s1-25-set-diff',
        description: 'Tìm quyền còn thiếu bằng phép trừ hai set O(N) và sắp xếp bằng sorted()',
        inputDescription: 'find_missing_permissions(["read", "write", "delete"], ["read"])',
        expectedOutput: "['delete', 'write']",
        requiredPatterns: ['set(required) - set(granted)', 'sorted('],
        forbiddenPatterns: [
          {
            pattern: 'not in granted',
            reason: 'Kiểm tra `not in granted` khi `granted` là `list` tốn O(N^2)! Hãy dùng `set(required) - set(granted)`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s1-tuple-hashable-key',
    title: 'Bài 26: Sử dụng tuple Bất biến làm Khóa Cache Tọa độ Địa lý cho dict',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Trong JS, `Map` so sánh khóa object theo địa chỉ tham chiếu (`map.get([10, 20])` luôn trả về `undefined`!), nên bạn phải nối chuỗi `"10,20"` làm key. Trong Python, bạn không thể dùng `list` `[lat, lon]` làm khóa cho `dict` (vì `list` khả biến nên không có mã băm — `TypeError: unhashable type: "list"`), nhưng bạn có thể dùng **`tuple` `(lat, lon)`** làm khóa trực tiếp vì `tuple` bất biến và được băm theo giá trị! Hãy viết hàm `cache_location_label(lat: float, lon: float, label: str) -> dict[tuple[float, float], str]` lưu `label` vào từ điển tại khóa `(lat, lon)`.',
    realWorldContext:
      'Lưu cache kết quả tính toán theo tọa độ `(x, y)`, cặp tiền tệ `("USD", "VND")` hoặc khóa tổng hợp `(tenant_id, user_id)` bằng `tuple` giúp tránh hoàn toàn chi phí nối chuỗi và tách chuỗi.',
    requirements: [
      'Tạo khóa tọa độ dạng `tuple`: `coord_key = (lat, lon)`',
      'Lưu vào từ điển `cache[coord_key] = label` và trả về `cache`',
      'Tuyệt đối không dùng `list` `[lat, lon]` làm khóa từ điển',
    ],
    starterCode: `def cache_location_label(lat: float, lon: float, label: str) -> dict[tuple[float, float], str]:
    cache: dict[tuple[float, float], str] = {}
    # TODO: Tạo khóa tuple (lat, lon), gán vào cache và trả về cache
    pass
`,
    solutionCode: `def cache_location_label(lat: float, lon: float, label: str) -> dict[tuple[float, float], str]:
    cache: dict[tuple[float, float], str] = {}
    coord_key = (lat, lon)
    cache[coord_key] = label
    return cache
`,
    hints: [
      'Gợi ý 1: Khởi tạo tuple `coord_key = (lat, lon)`.',
      'Gợi ý 2: Gán `cache[coord_key] = label`.',
      'Gợi ý 3: Trả về `return cache`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Đóng gói tọa độ vào `tuple` bất biến (Hashable)',
        codeSnippet: `    coord_key = (lat, lon)`,
        explanation:
          'Một `tuple` chứa các phần tử bất biến (`float`, `int`, `str`) sẽ có giá trị `hash((lat, lon))` cố định suốt vòng đời, thỏa mãn điều kiện làm khóa của Bảng băm `dict`.',
      },
      {
        stepTitle: 'Bước 2: Gán vào `dict` và tra cứu theo giá trị cấu trúc',
        codeSnippet: `    cache[coord_key] = label\n    return cache`,
        explanation:
          'Bất kỳ nơi nào gọi `cache[(21.0285, 105.8542)]` đều tìm thấy đúng nhãn `"Hanoi"` ngay lập tức.',
      },
    ],
    commonMistakes: [
      'Dùng ngoặc vuông `cache[[lat, lon]] = label` gây lỗi `TypeError: unhashable type: "list"`.',
      'Đổi sang chuỗi `f"{lat},{lon}"` làm mất kiểu dữ liệu số thực của khóa.',
    ],
    testCases: [
      {
        id: 'tc-s1-26-tuple-key',
        description: 'Sử dụng tuple (lat, lon) làm khóa hợp lệ cho dict cache',
        inputDescription: 'cache_location_label(21.03, 105.85, "Hanoi")',
        expectedOutput: "{(21.03, 105.85): 'Hanoi'}",
        requiredPatterns: ['(lat, lon)', 'cache[', 'return cache'],
        forbiddenPatterns: [
          {
            pattern: '[lat, lon]',
            reason: '`list` là kiểu khả biến (mutable) nên không thể làm khóa cho `dict` (`unhashable type: list`)! Hãy dùng `tuple` `(lat, lon)`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s1-enumerate-zip-strict',
    title: 'Bài 27: Ghép Cặp Dữ liệu An toàn với enumerate(start=1) và zip(..., strict=True)',
    category: 'js-to-py',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Khi cần duyệt kèm chỉ số thứ tự, lập trình viên C/JS hay viết `for i in range(len(items)):` (bị coi là Anti-pattern trong Python!). Khi cần duyệt song song 2 danh sách `names` và `scores`, Python có hàm `zip()`, nhưng `zip()` mặc định sẽ **âm thầm cắt bỏ phần tử thừa** nếu 2 danh sách lệch độ dài! Từ Python 3.10 (PEP 618), `zip(names, scores, strict=True)` sẽ ném lỗi `ValueError` ngay nếu 2 danh sách không khớp độ dài. Hãy viết hàm `build_leaderboard(names: list[str], scores: list[int]) -> list[str]` kết hợp `enumerate(..., start=1)` và `zip(names, scores, strict=True)`.',
    realWorldContext:
      'Khi ghép cột dữ liệu (Headers & Row Values) hoặc ghép nhãn dự đoán AI với dữ liệu gốc, bật `strict=True` trong `zip()` là chốt chặn sống còn ngăn chặn lỗi lệch dòng dữ liệu âm thầm.',
    requirements: [
      'Sử dụng `zip(names, scores, strict=True)` để ghép cặp tên và điểm an toàn',
      'Bọc trong `enumerate(..., start=1)` để đánh số thứ hạng bắt đầu từ `1`',
      'Trả về danh sách chuỗi định dạng `f"Rank {rank}: {name} ({score})"`',
    ],
    starterCode: `def build_leaderboard(names: list[str], scores: list[int]) -> list[str]:
    # TODO: Kết hợp enumerate(zip(names, scores, strict=True), start=1)
    # để trả về danh sách f"Rank {rank}: {name} ({score})"
    pass
`,
    solutionCode: `def build_leaderboard(names: list[str], scores: list[int]) -> list[str]:
    return [
        f"Rank {rank}: {name} ({score})"
        for rank, (name, score) in enumerate(zip(names, scores, strict=True), start=1)
    ]
`,
    hints: [
      'Gợi ý 1: Ghép 2 danh sách bằng `zip(names, scores, strict=True)`.',
      'Gợi ý 2: Bọc bên ngoài bằng `enumerate(zip(names, scores, strict=True), start=1)`.',
      'Gợi ý 3: Giải nén `for rank, (name, score) in ...` và định dạng `f"Rank {rank}: {name} ({score})"`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Ghép song song có kiểm tra độ dài bằng `zip(..., strict=True)`',
        codeSnippet: `zip(names, scores, strict=True)`,
        explanation:
          'Nếu `len(names) != len(scores)`, `strict=True` (Python 3.10+) sẽ lập tức báo lỗi `ValueError` thay vì âm thầm làm mất dữ liệu ở đuôi.',
      },
      {
        stepTitle: 'Bước 2: Đánh số thứ hạng tự động từ 1 bằng `enumerate(..., start=1)`',
        codeSnippet: `    return [\n        f"Rank {rank}: {name} ({score})"\n        for rank, (name, score) in enumerate(zip(names, scores, strict=True), start=1)\n    ]`,
        explanation:
          'Tham số `start=1` giúp bạn có ngay biến `rank` bắt đầu từ 1 mà không cần viết `i + 1` thủ công.',
      },
    ],
    commonMistakes: [
      'Viết `for i in range(len(names)):` rồi truy cập `names[i]`, `scores[i]` vừa chậm vừa không kiểm tra được trường hợp `scores` dài hơn `names`.',
      'Quên ngoặc tròn quanh `(name, score)` khi giải nén kết quả của `enumerate(zip(...))`.',
    ],
    testCases: [
      {
        id: 'tc-s1-27-enum-zip',
        description: 'Kết hợp enumerate(..., start=1) và zip(..., strict=True) không dùng range(len())',
        inputDescription: 'build_leaderboard(["Alice", "Bob"], [98, 92])',
        expectedOutput: "['Rank 1: Alice (98)', 'Rank 2: Bob (92)']",
        requiredPatterns: ['enumerate(', 'zip(names, scores, strict=True)', 'start=1'],
        forbiddenPatterns: [
          {
            pattern: 'range(len(',
            reason: 'Không dùng `range(len(...))`! Hãy dùng `enumerate()` và `zip(..., strict=True)` chuẩn Pythonic.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s1-any-all-predicates',
    title: 'Bài 28: Kiểm tra Điều kiện Toàn cục Thanh lịch với any(), all() và Generator Expression',
    category: 'js-to-py',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Trong JS, bạn dùng `arr.every(fn)` và `arr.some(fn)`. Trong Python, cặp hàm tích hợp **`all()`** và **`any()`** kết hợp với **Generator Expression** (không có ngoặc vuông `[]`) giúp kiểm tra điều kiện với cơ chế **Short-circuit (Ngắt mạch sớm)** và tiêu thụ `O(1)` bộ nhớ! Hãy viết hàm `audit_passwords(passwords: list[str]) -> tuple[bool, bool]` trả về `(all_long_enough, has_leaked)`: kiểm tra tất cả mật khẩu đều có `len(p) >= 8` bằng `all()` và có bất kỳ mật khẩu nào chứa `"123456"` hay không bằng `any()`.',
    realWorldContext:
      'Khi kiểm tra hàng vạn bản ghi đơn hàng hoặc quy tắc bảo mật, truyền Generator Expression `all( len(p) >= 8 for p in passwords )` sẽ dừng ngay ở phần tử vi phạm đầu tiên mà không tạo danh sách `bool` trung gian trong RAM.',
    requirements: [
      'Tính `all_long_enough = all(len(p) >= 8 for p in passwords)` (dùng Generator Expression, không dùng ngoặc vuông `[...]`)',
      'Tính `has_leaked = any("123456" in p for p in passwords)`',
      'Trả về tuple `(all_long_enough, has_leaked)`',
    ],
    starterCode: `def audit_passwords(passwords: list[str]) -> tuple[bool, bool]:
    # TODO: Dùng all(...) và any(...) với Generator Expression (không dùng ngoặc vuông [])
    pass
`,
    solutionCode: `def audit_passwords(passwords: list[str]) -> tuple[bool, bool]:
    all_long_enough = all(len(p) >= 8 for p in passwords)
    has_leaked = any("123456" in p for p in passwords)
    return (all_long_enough, has_leaked)
`,
    hints: [
      'Gợi ý 1: Viết `all_long_enough = all(len(p) >= 8 for p in passwords)` (lưu ý không có dấu `[` hay `]` bên trong `all()`).',
      'Gợi ý 2: Viết `has_leaked = any("123456" in p for p in passwords)`.',
      'Gợi ý 3: Trả về `return (all_long_enough, has_leaked)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Kiểm tra toàn bộ đạt chuẩn bằng `all()` và Generator Expression',
        codeSnippet: `    all_long_enough = all(len(p) >= 8 for p in passwords)`,
        explanation:
          '`all()` lấy từng giá trị từ Generator: ngay khi gặp mật khẩu đầu tiên có `len(p) < 8`, nó lập tức trả về `False` và dừng vòng lặp (Short-circuit).',
      },
      {
        stepTitle: 'Bước 2: Phát hiện rò rỉ bằng `any()`',
        codeSnippet: `    has_leaked = any("123456" in p for p in passwords)\n    return (all_long_enough, has_leaked)`,
        explanation:
          '`any()` trả về `True` ngay tại khoảnh khắc tìm thấy mật khẩu đầu tiên chứa `"123456"` mà không cần duyệt phần còn lại.',
      },
    ],
    commonMistakes: [
      'Truyền List Comprehension `all([len(p) >= 8 for p in passwords])` (có ngoặc vuông `[]`) — việc này buộc Python phải duyệt hết 100% danh sách để tạo xong mảng `list[bool]` trong RAM rồi mới gọi `all()`, làm mất hoàn toàn tính năng ngắt mạch sớm (Short-circuit)!',
      'Nhầm lẫn rằng `all([])` trên danh sách rỗng trả về `False` — thực tế trong logic toán học (Vacuous Truth), `all([])` trả về `True` còn `any([])` trả về `False`!',
    ],
    testCases: [
      {
        id: 'tc-s1-28-any-all',
        description: 'Sử dụng all() và any() với Generator Expression không tạo list trung gian',
        inputDescription: 'audit_passwords(["secret_pass_99", "my_123456_pw"])',
        expectedOutput: '(True, True)',
        requiredPatterns: ['all(len(p) >= 8 for p in passwords)', 'any("123456" in p for p in passwords)'],
        forbiddenPatterns: [
          {
            pattern: 'all([',
            reason: 'Không đặt ngoặc vuông `[` bên trong `all()` vì sẽ làm mất cơ chế Short-circuit! Hãy truyền trực tiếp Generator Expression.',
          },
          {
            pattern: 'any([',
            reason: 'Không đặt ngoặc vuông `[` bên trong `any()` vì sẽ làm mất cơ chế Short-circuit! Hãy truyền trực tiếp Generator Expression.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s1-custom-exception-chain',
    title: 'Bài 29: Bắt lỗi Cụ thể, Chuỗi Ngoại lệ raise ... from err & Khối else/finally',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-functions-exceptions',
    problemStatement:
      'Trong Python, viết `except:` trần trụi hoặc `except Exception:` rồi ném lỗi mới mà quên nối chuỗi sẽ làm mất dấu vết nguyên nhân gốc (Root Cause Traceback). Chuẩn công nghiệp yêu cầu: (1) Định nghĩa lớp ngoại lệ nghiệp vụ kế thừa `Exception`, (2) Chỉ bắt đúng ngoại lệ cụ thể (`except ValueError as err:`), và (3) Dùng **`raise ConfigError(...) from err`** để gắn nguyên nhân gốc vào thuộc tính `__cause__`. Hãy hoàn thiện lớp `ConfigError` và hàm `parse_port(raw_port: str) -> int`.',
    realWorldContext:
      'Khi ứng dụng crash trên Production và đẩy log lên Sentry/Datadog, cú pháp `raise CustomError(...) from err` giữ lại toàn bộ thông điệp `"The above exception was the direct cause of the following exception"`, giúp kỹ sư tìm ra lỗi gốc trong 5 giây.',
    requirements: [
      'Định nghĩa `class ConfigError(Exception): pass`',
      'Trong `parse_port(raw_port: str) -> int`, bọc `port = int(raw_port)` trong khối `try:`',
      'Bắt cụ thể `except ValueError as err:` và ném `raise ConfigError(f"Invalid port: {raw_port}") from err`',
      'Dùng khối `else:` của `try` để `return port` khi không có lỗi',
    ],
    starterCode: `class ConfigError(Exception):
    pass

def parse_port(raw_port: str) -> int:
    # TODO: Dùng try ... except ValueError as err: để ném raise ConfigError(...) from err
    # và dùng nhánh else: để return port
    pass
`,
    solutionCode: `class ConfigError(Exception):
    pass

def parse_port(raw_port: str) -> int:
    try:
        port = int(raw_port)
    except ValueError as err:
        raise ConfigError(f"Invalid port: {raw_port}") from err
    else:
        return port
`,
    hints: [
      'Gợi ý 1: Trong khối `try:`, chỉ đặt đúng dòng có khả năng sinh lỗi `port = int(raw_port)`.',
      'Gợi ý 2: Viết `except ValueError as err:` và bên trong dùng `raise ConfigError(f"Invalid port: {raw_port}") from err`.',
      'Gợi ý 3: Thêm nhánh `else:` ngay sau `except` để `return port`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Bảo toàn chuỗi Traceback bằng `raise ... from err`',
        codeSnippet: `    try:\n        port = int(raw_port)\n    except ValueError as err:\n        raise ConfigError(f"Invalid port: {raw_port}") from err`,
        explanation:
          'Từ khóa `from err` gán ngoại lệ `ValueError` gốc vào thuộc tính `__cause__` của `ConfigError`, giúp log lỗi hiển thị cả lỗi tầng thấp lẫn ngữ cảnh tầng nghiệp vụ.',
      },
      {
        stepTitle: 'Bước 2: Tách biệt code thành công vào khối `else:` của `try`',
        codeSnippet: `    else:\n        return port`,
        explanation:
          'Khối `else:` chỉ chạy khi `try:` không ném ngoại lệ nào, giúp giữ cho phạm vi của `try:` nhỏ nhất có thể để không bắt nhầm lỗi từ các câu lệnh khác.',
      },
    ],
    commonMistakes: [
      'Dùng `except:` trần trụi (Bare Except) bắt luôn cả `KeyboardInterrupt` (Ctrl+C) và `SystemExit`!',
      'Ném `raise ConfigError(...)` mà quên `from err` làm người đọc log không biết tại sao chuỗi cấu hình lại không hợp lệ.',
    ],
    testCases: [
      {
        id: 'tc-s1-29-exception-chain',
        description: 'Bắt cụ thể ValueError, nối chuỗi ngoại lệ bằng from err và dùng nhánh else:',
        inputDescription: 'parse_port("8080"), parse_port("abc")',
        expectedOutput: '8080 | raises ConfigError("Invalid port: abc") with __cause__ = ValueError',
        requiredPatterns: [
          'class ConfigError(Exception):',
          'except ValueError as err:',
          'raise ConfigError(',
          'from err',
          'else:',
        ],
        forbiddenPatterns: [
          {
            pattern: 'except:',
            reason: 'CẤM dùng `except:` trần trụi! Hãy bắt ngoại lệ cụ thể `except ValueError as err:`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s1-pathlib-json-context',
    title: 'Bài 30: Đọc/Ghi File JSON An toàn với pathlib.Path và Context Manager with open(...)',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-functions-exceptions',
    problemStatement:
      'Thay vì nối đường dẫn thủ công bằng chuỗi hay `os.path.join(dir, file)` cũ kỹ, Python hiện đại dùng **`pathlib.Path`** cho phép nối đường dẫn bằng toán tử gạch chéo `/` cực trực quan (`base_dir / "settings.json"`). Đồng thời, khi mở file trên Windows/Linux, bạn luôn phải chỉ định rõ `encoding="utf-8"` trong Context Manager `with open(...)` để tránh lỗi vỡ tiếng Việt và rò rỉ File Descriptor. Hãy viết hàm `save_json_settings(dir_path: str, data: dict) -> str` sử dụng `Path` và `with open(..., "w", encoding="utf-8") as f:`.',
    realWorldContext:
      'Trong Project 1 và Project 2, mọi thao tác lưu trữ dữ liệu bền vững xuống ổ đĩa đều phải đi qua `pathlib.Path` (tự động xử lý `/` trên macOS/Linux và `\\` trên Windows) kết hợp `with open(..., encoding="utf-8")`.',
    requirements: [
      'Tạo đường dẫn bằng toán tử `/` của `Path`: `file_path = Path(dir_path) / "settings.json"`',
      'Sử dụng Context Manager `with open(file_path, "w", encoding="utf-8") as f:` để ghi dữ liệu bằng `json.dump(data, f)`',
      'Trả về chuỗi đường dẫn `str(file_path)`',
    ],
    starterCode: `import json
from pathlib import Path

def save_json_settings(dir_path: str, data: dict) -> str:
    # TODO: Tạo file_path = Path(dir_path) / "settings.json"
    # TODO: Dùng with open(file_path, "w", encoding="utf-8") as f: để gọi json.dump(data, f)
    # và trả về str(file_path)
    pass
`,
    solutionCode: `import json
from pathlib import Path

def save_json_settings(dir_path: str, data: dict) -> str:
    file_path = Path(dir_path) / "settings.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f)
    return str(file_path)
`,
    hints: [
      'Gợi ý 1: Khởi tạo `file_path = Path(dir_path) / "settings.json"` (lưu ý toán tử `/` nối hai đối tượng đường dẫn).',
      'Gợi ý 2: Viết `with open(file_path, "w", encoding="utf-8") as f:` và gọi `json.dump(data, f)` bên trong.',
      'Gợi ý 3: Trả về `return str(file_path)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Nối đường dẫn đa nền tảng bằng toán tử `/` của `pathlib.Path`',
        codeSnippet: `    file_path = Path(dir_path) / "settings.json"`,
        explanation:
          'Lớp `Path` nạp chồng toán tử chia `/` (`__truediv__`) để nối các phân đoạn đường dẫn một cách an toàn trên mọi hệ điều hành.',
      },
      {
        stepTitle: 'Bước 2: Đảm bảo đóng file tự động bằng `with open(..., encoding="utf-8")`',
        codeSnippet: `    with open(file_path, "w", encoding="utf-8") as f:\n        json.dump(data, f)\n    return str(file_path)`,
        explanation:
          'Khối `with` kích hoạt phương thức `__exit__` để flush buffer và đóng file ngay cả khi `json.dump` ném ngoại lệ giữa chừng.',
      },
    ],
    commonMistakes: [
      'Gọi `f = open(...)` mà không dùng khối `with` làm rò rỉ tài nguyên File Descriptor của hệ điều hành.',
      'Quên truyền `encoding="utf-8"` khiến trên Windows file bị mở bằng bảng mã `cp1252` gây lỗi `UnicodeEncodeError` với tiếng Việt.',
    ],
    testCases: [
      {
        id: 'tc-s1-30-pathlib',
        description: 'Nối đường dẫn bằng Path(dir_path) / "settings.json" và ghi JSON trong khối with có encoding="utf-8"',
        inputDescription: 'save_json_settings("/tmp/app", {"theme": "dark"})',
        expectedOutput: "'/tmp/app/settings.json'",
        requiredPatterns: [
          'Path(dir_path) / "settings.json"',
          'with open(',
          'encoding="utf-8"',
          'json.dump(data, f)',
          'return str(file_path)',
        ],
        forbiddenPatterns: [
          {
            pattern: 'os.path.join',
            reason: 'Hãy sử dụng toán tử `/` của `pathlib.Path` hiện đại thay vì `os.path.join`!',
          },
        ],
      },
    ],
  },
];

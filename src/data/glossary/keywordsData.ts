import { GlossaryTerm } from '@/types/glossary.types';

export const KEYWORDS_GLOSSARY: GlossaryTerm[] = [
  // 1. def
  {
    id: 'kw-def',
    term: 'def',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Từ khóa định nghĩa một hàm (Function) hoặc phương thức (Method) trong Python.',
    detailedExplanation:
      'Khi Python thực thi câu lệnh `def`, nó khởi tạo một đối tượng hàm (Function Object) trong bộ nhớ và gắn tên hàm làm nhãn dán trỏ tới đối tượng đó. Các giá trị mặc định của tham số trong `def` được tính toán duy nhất 1 lần ngay tại thời điểm định nghĩa hàm (define time), không phải khi gọi hàm.',
    analogy:
      'Hãy tưởng tượng `def` như việc viết một công thức nấu ăn và đóng khung treo lên tường bếp. Các nguyên liệu mặc định ghi trong công thức chỉ được chuẩn bị sẵn đúng 1 rổ từ lúc treo bảng!',
    syntaxExample: `def greet(name: str, greeting: str = "Xin chào") -> str:\n    return f"{greeting}, {name}!"`,
    commonGotcha:
      'Bẫy kinh điển: Không bao giờ đặt `list = []` hoặc `dict = {}` làm giá trị mặc định trong `def` vì mọi lần gọi hàm sẽ dùng chung đúng 1 list đó!',
    jsEquivalent: 'function myFunc() {}',
    relatedTerms: ['kw-return', 'kw-lambda', 'concept-mutable-default', 'kw-yield'],
  },

  // 2. return
  {
    id: 'kw-return',
    term: 'return',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Kết thúc việc thực thi của hàm và trả về một giá trị cho người gọi.',
    detailedExplanation:
      'Lệnh `return` kết thúc hàm lập tức và giải phóng frame cục bộ khỏi ngăn xếp (Stack). Nếu hàm chạy hết mà không gặp lệnh `return`, Python ngầm định trả về `None`. Có thể trả về nhiều giá trị cách nhau bởi dấu phẩy `return a, b` (thực chất là trả về 1 Tuple `(a, b)`).',
    analogy:
      'Người phục vụ bàn quay trở lại từ nhà bếp mang theo đúng món ăn bạn đã gọi (`return food`), kết thúc chu trình phục vụ của đợt gọi món đó.',
    syntaxExample: `def divide(a: float, b: float) -> tuple[float, float]:\n    quotient = a // b\n    remainder = a % b\n    return quotient, remainder  # Trả về tuple (thương, dư)`,
    commonGotcha:
      'Viết `return` trong khối `finally` sẽ âm thầm nuốt sạch mọi Exception phát sinh trong khối `try`, cực kỳ nguy hiểm!',
    jsEquivalent: 'return value;',
    relatedTerms: ['kw-def', 'kw-yield', 'kw-none'],
  },

  // 3. yield
  {
    id: 'kw-yield',
    term: 'yield',
    aliases: ['yield from'],
    category: 'keyword',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Tạm dừng hàm và trả về một giá trị, biến hàm thành một Generator (Lazy Evaluation).',
    detailedExplanation:
      'Khác với `return` kết thúc hoàn toàn hàm, `yield` đóng băng toàn bộ trạng thái hiện tại (biến cục bộ, con trỏ lệnh) và trả giá trị ra ngoài. Khi gọi `next()` lần sau, hàm chạy tiếp ngay tại dòng sau `yield`. `yield from iterable` cho phép ủy quyền phát sinh giá trị cho generator con.',
    analogy:
      'Băng chuyền sushi: làm xong đúng 1 đĩa thì đưa cho khách ăn, rồi đứng nghỉ chờ khách ăn xong gọi đĩa tiếp theo mới làm tiếp, không cần kho chứa 10.000 đĩa sushi cùng lúc.',
    syntaxExample: `def read_lines(filepath: str):\n    with open(filepath, "r", encoding="utf-8") as f:\n        for line in f:\n            yield line.strip()`,
    commonGotcha:
      'Gọi hàm có chứa `yield` sẽ KHÔNG chạy code bên trong ngay mà chỉ trả về đối tượng Generator. Phải duyệt qua bằng `for` hoặc `next()`.',
    jsEquivalent: 'function* myGen() { yield x; }',
    relatedTerms: ['concept-generator', 'dunder-iter', 'dunder-next', 'kw-return'],
  },

  // 4. class
  {
    id: 'kw-class',
    term: 'class',
    category: 'keyword',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Từ khóa định nghĩa một Class (Khuôn mẫu Lớp Đối tượng) trong lập trình OOP.',
    detailedExplanation:
      'Định nghĩa một kiểu dữ liệu do người dùng tự tạo. Trong Python, bản thân Class cũng là một Object (thuộc kiểu `type`), cho phép can thiệp bằng Metaclass hoặc Class Decorator.',
    analogy:
      'Bản vẽ thiết kế kỹ thuật của mẫu xe ô tô: từ bản vẽ này bạn có thể sản xuất hàng triệu chiếc xe lăn bánh trên đường.',
    syntaxExample: `class Vehicle:\n    def __init__(self, brand: str) -> None:\n        self.brand = brand`,
    commonGotcha:
      'Mọi phương thức bên trong class phải có tham số đầu tiên đại diện cho thực thể (theo quy ước là `self`).',
    jsEquivalent: 'class Vehicle {}',
    relatedTerms: ['dunder-init', 'decl-class', 'decl-dataclass'],
  },

  // 5. if
  {
    id: 'kw-if',
    term: 'if',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Từ khóa điều kiện rẽ nhánh thực thi nếu biểu thức boolean có giá trị Truthy.',
    detailedExplanation:
      'Python đánh giá giá trị Truthy/Falsy của biểu thức thông qua phương thức `__bool__()` hoặc `__len__()`. Các giá trị Falsy gồm: `False`, `None`, số `0`, `0.0`, chuỗi rỗng `""`, và các collection rỗng `[]`, `{}`, `set()`, `()`.',
    analogy:
      'Ngã ba đường có biển báo: nếu đèn xanh (`True`) thì rẽ phải, ngược lại tiếp tục đi thẳng.',
    syntaxExample: `if score >= 9.0:\n    print("Xuất sắc")\nelif score >= 8.0:\n    print("Giỏi")\nelse:\n    print("Đạt")`,
    commonGotcha:
      'Đừng viết `if items == True:`. Hãy viết chuẩn Pythonic `if items:` để kiểm tra danh sách có phần tử hay không.',
    jsEquivalent: 'if (condition) { ... }',
    relatedTerms: ['kw-elif', 'kw-else', 'kw-is'],
  },

  // 6. elif
  {
    id: 'kw-elif',
    term: 'elif',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Viết tắt của "else if" trong Python, kiểm tra điều kiện tiếp theo nếu các điều kiện trước False.',
    detailedExplanation:
      'Giúp tránh việc thụt lề quá sâu (Indentation Hell) khi có nhiều tầng điều kiện liên tiếp.',
    analogy:
      'Nấc thang thứ hai trong bài kiểm tra phân loại: nếu không lọt vào top 1 thì xét tiếp xem có thuộc top 2 không.',
    syntaxExample: `if role == "admin":\n    grant_all()\nelif role == "editor":\n    grant_write()`,
    commonGotcha:
      'Nhiều ngôn ngữ dùng `else if` (2 từ cách nhau), còn Python bắt buộc viết liền `elif`.',
    jsEquivalent: 'else if (...)',
    relatedTerms: ['kw-if', 'kw-else'],
  },

  // 7. else
  {
    id: 'kw-else',
    term: 'else',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Nhánh mặc định của `if`, hoặc chạy khi vòng lặp `for`/`while` hoàn thành mà KHÔNG bị `break`.',
    detailedExplanation:
      'Ngoài việc dùng với `if`, Python có tính năng độc đáo `for ... else` và `while ... else`: khối `else` chỉ chạy khi vòng lặp kết thúc tự nhiên mà không bị ngắt ngang bởi `break`!',
    analogy:
      'Trong vòng lặp: tìm kiếm đồ vật trong cả căn phòng, nếu tìm khắp phòng mà vẫn không thấy (`không gặp break`), thì làm hành động cuối cùng thông báo "Tìm không thấy" (`else`).',
    syntaxExample: `# for ... else kỳ diệu trong Python:\nfor n in numbers:\n    if n == target:\n        print("Đã tìm thấy!")\n        break\nelse:\n    print("Không tìm thấy target trong danh sách!")`,
    commonGotcha:
      'Khối `else` của vòng lặp sẽ BỊ BỎ QUA nếu vòng lặp kết thúc bằng lệnh `break`.',
    jsEquivalent: 'else (nhưng JS không có for...else)',
    relatedTerms: ['kw-if', 'kw-for', 'kw-break'],
  },

  // 8. for
  {
    id: 'kw-for',
    term: 'for',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Vòng lặp duyệt qua từng phần tử của một Iterable (List, Tuple, String, Generator).',
    detailedExplanation:
      'Vòng lặp `for item in iterable:` trong Python thực chất là "For-Each": nó gọi `iter(iterable)` để lấy iterator, rồi liên tục gọi `next()` cho tới khi bắt được ngoại lệ `StopIteration`.',
    analogy:
      'Hành khách lần lượt đi qua cổng kiểm soát vé một chiều: từng người một bước qua cho đến khi hết hàng đợi.',
    syntaxExample: `for user_id in [101, 102, 103]:\n    send_notification(user_id)`,
    commonGotcha:
      'Đừng dùng `for i in range(len(items)):` khi bạn chỉ cần giá trị. Hãy dùng `for item in items:` hoặc `for i, item in enumerate(items):`.',
    jsEquivalent: 'for (const item of iterable) { ... }',
    relatedTerms: ['kw-while', 'kw-break', 'kw-continue', 'fn-enumerate'],
  },

  // 9. while
  {
    id: 'kw-while',
    term: 'while',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Vòng lặp lặp đi lặp lại khối lệnh chừng nào điều kiện boolean vẫn còn True.',
    detailedExplanation:
      'Kiểm tra điều kiện ở đầu mỗi vòng lặp. Thường dùng khi không biết trước số lần lặp, như vòng lặp lắng nghe kết nối mạng (Socket Loop) hay vòng lặp Game Engine.',
    analogy:
      'Chiếc máy bơm tự động: chừng nào mực nước trong bể vẫn còn dưới phao (`water < max`), máy bơm tiếp tục hoạt động.',
    syntaxExample: `count = 3\nwhile count > 0:\n    print(f"Đếm ngược: {count}")\n    count -= 1`,
    commonGotcha:
      'Quên cập nhật biến điều kiện bên trong thân vòng lặp sẽ dẫn tới vòng lặp vô tận (Infinite Loop), chiếm 100% CPU.',
    jsEquivalent: 'while (condition) { ... }',
    relatedTerms: ['kw-for', 'kw-break', 'decl-walrus'],
  },

  // 10. break
  {
    id: 'kw-break',
    term: 'break',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Thoát khỏi vòng lặp `for` hoặc `while` gần nhất ngay lập tức.',
    detailedExplanation:
      'Ngắt hoàn toàn vòng lặp hiện tại, nhảy đến câu lệnh ngay sau khối vòng lặp. Bỏ qua nhánh `else` của vòng lặp nếu có.',
    analogy:
      'Nhấn phanh khẩn cấp trên tàu hỏa: đoàn tàu dừng lại ngay lập tức tại vị trí hiện tại.',
    syntaxExample: `for user in users:\n    if user.is_banned:\n        print("Phát hiện tài khoản vi phạm!")\n        break`,
    commonGotcha:
      '`break` chỉ thoát khỏi MỘT tầng vòng lặp trong cùng nếu có nhiều vòng lặp lồng nhau.',
    jsEquivalent: 'break;',
    relatedTerms: ['kw-continue', 'kw-for', 'kw-while'],
  },

  // 11. continue
  {
    id: 'kw-continue',
    term: 'continue',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Bỏ qua phần còn lại của lượt lặp hiện tại và nhảy ngay sang lượt lặp tiếp theo.',
    detailedExplanation:
      'Dừng việc thực thi các lệnh phía sau `continue` trong lượt đó, quay lại đầu vòng lặp để lấy phần tử kế tiếp hoặc kiểm tra lại điều kiện `while`.',
    analogy:
      'Người kiểm tra chất lượng trên băng chuyền: nếu thấy quả cam bị hỏng, họ vứt đi và chuyển ngay sang quả cam tiếp theo mà không cần dán tem.',
    syntaxExample: `for num in range(10):\n    if num % 2 == 0:\n        continue  # Bỏ qua số chẵn\n    print(num)    # Chỉ in số lẻ`,
    commonGotcha:
      'Trong vòng lặp `while`, nếu đặt `continue` trước dòng tăng chỉ số `i += 1`, bạn sẽ rơi vào vòng lặp vô tận!',
    jsEquivalent: 'continue;',
    relatedTerms: ['kw-break', 'kw-for'],
  },

  // 12. try
  {
    id: 'kw-try',
    term: 'try',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Bắt đầu khối giám sát mã nguồn để bắt và xử lý ngoại lệ (Exception Handling).',
    detailedExplanation:
      'Mọi lỗi phát sinh trong khối `try` sẽ được chuyển tới khối `except` phù hợp để bắt và xử lý, ngăn không cho chương trình bị sập đột ngột.',
    analogy:
      'Lưới an toàn mắc dưới dây xiếc: diễn viên xiếc biểu diễn bên trên (`try`), nếu có trượt chân ngã thì lưới đỡ lại (`except`) chứ không rơi xuống đất.',
    syntaxExample: `try:\n    result = 10 / divisor\nexcept ZeroDivisionError:\n    result = 0`,
    commonGotcha:
      'Chỉ nên bọc trong khối `try` đoạn code thực sự có rủi ro ném lỗi, không nên bọc cả một hàm 500 dòng.',
    jsEquivalent: 'try { ... }',
    relatedTerms: ['kw-except', 'kw-finally', 'kw-raise'],
  },

  // 13. except
  {
    id: 'kw-except',
    term: 'except',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Bắt và xử lý loại ngoại lệ cụ thể phát sinh từ khối `try`.',
    detailedExplanation:
      'Cú pháp `except SpecificError as err:`. Có thể có nhiều khối `except` cho từng loại lỗi từ cụ thể đến khái quát.',
    analogy:
      'Đội cứu hộ chuyên trách: nếu hỏa hoạn thì đội cứu hỏa vào xử lý, nếu ngập lụt thì đội thoát nước vào xử lý.',
    syntaxExample: `try:\n    val = int(user_input)\nexcept ValueError as err:\n    print(f"Lỗi nhập liệu: {err}")`,
    commonGotcha:
      'Không bao giờ viết `except:` trống không (bare except) vì nó bắt luôn cả `KeyboardInterrupt` (Ctrl+C), khiến bạn không thể dừng chương trình.',
    jsEquivalent: 'catch (err) { ... }',
    relatedTerms: ['kw-try', 'kw-finally', 'kw-raise'],
  },

  // 14. finally
  {
    id: 'kw-finally',
    term: 'finally',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Khối lệnh LUÔN LUÔN được thực thi bất kể có lỗi hay không (dùng để dọn dẹp tài nguyên).',
    detailedExplanation:
      'Khối `finally` được đảm bảo chạy ngay cả khi bên trong `try` có lệnh `return`, `break` hoặc lỗi chưa được bắt.',
    analogy:
      'Rời khỏi phòng thí nghiệm: bất kể thí nghiệm thành công hay phát nổ, bạn luôn luôn phải khóa van ga và tắt điện an toàn trước khi ra về.',
    syntaxExample: `db_conn = connect()\ntry:\n    db_conn.execute("INSERT ...")\nfinally:\n    db_conn.close()  # Luôn đóng kết nối!`,
    commonGotcha:
      'Hạn chế viết `return` trong `finally` vì nó sẽ ghi đè và làm mất giá trị `return` của khối `try`.',
    jsEquivalent: 'finally { ... }',
    relatedTerms: ['kw-try', 'kw-with'],
  },

  // 15. raise
  {
    id: 'kw-raise',
    term: 'raise',
    category: 'keyword',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Chủ động ném ra một ngoại lệ hoặc ném tiếp ngoại lệ đang xử lý.',
    detailedExplanation:
      'Dùng `raise ValueError("Thông điệp")` để báo lỗi logic. Dùng `raise CustomError from original_err` (Exception Chaining) để bảo tồn nguyên nhân gốc.',
    analogy:
      'Bấm chuông báo cháy khi phát hiện khói trong phòng kỹ thuật.',
    syntaxExample: `if age < 0:\n    raise ValueError("Tuổi không thể là số âm")`,
    commonGotcha:
      'Chỉ nên raise các class kế thừa từ `Exception`, không raise chuỗi trần `raise "Lỗi"`.',
    jsEquivalent: 'throw new Error(...)',
    relatedTerms: ['kw-try', 'kw-except'],
  },

  // 16. with
  {
    id: 'kw-with',
    term: 'with',
    category: 'keyword',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Kích hoạt Context Manager giúp tự động giải phóng tài nguyên an toàn (`__enter__` và `__exit__`).',
    detailedExplanation:
      'Đảm bảo tài nguyên (File, Network socket, DB lock) luôn được đóng đúng cách ngay cả khi xảy ra lỗi nghiêm trọng.',
    analogy:
      'Phòng khách sạn tự ngắt cầu dao điện khi bạn rút thẻ phòng bước ra cửa.',
    syntaxExample: `with open("config.json", "r") as f:\n    data = json.load(f)`,
    commonGotcha:
      'Đừng mở file bằng `f = open()` thông thường mà không có `with`.',
    jsEquivalent: 'using resource = ... (TS 5.2+) hoặc try...finally',
    relatedTerms: ['concept-context-manager', 'dunder-enter', 'dunder-exit'],
  },

  // 17. import
  {
    id: 'kw-import',
    term: 'import',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Nạp module hoặc package vào không gian tên (Namespace) hiện tại.',
    detailedExplanation:
      'Khi `import math`, Python tìm file `math.py` trong `sys.path`, biên dịch thành Bytecode (.pyc) nếu chưa có, thực thi toàn bộ file và lưu vào `sys.modules` để cache.',
    analogy:
      'Mở hòm đồ nghề và lấy ra chiếc cờ lê chuyên dụng để chuẩn bị sửa máy.',
    syntaxExample: `import math\nprint(math.sqrt(16))  # 4.0`,
    commonGotcha:
      'Tránh dùng `from module import *` vì gây ô nhiễm namespace và xung đột tên hàm ngầm định.',
    jsEquivalent: 'import * as math from "math";',
    relatedTerms: ['kw-from', 'kw-as'],
  },

  // 18. from
  {
    id: 'kw-from',
    term: 'from',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Nhập khẩu các hàm, lớp hoặc biến cụ thể từ một module hoặc package.',
    detailedExplanation:
      'Cú pháp `from module import name1, name2`. Ngoài ra dùng trong `raise ... from ...` và `yield from ...`.',
    analogy:
      'Thay vì mang cả tủ sách về nhà, bạn chỉ mượn đúng 1 cuốn sách cần đọc từ thư viện.',
    syntaxExample: `from datetime import datetime, timezone\nnow = datetime.now(timezone.utc)`,
    commonGotcha:
      'Circular import xảy ra khi file A `from B import x` và file B cũng `from A import y`.',
    jsEquivalent: 'import { datetime } from "datetime";',
    relatedTerms: ['kw-import', 'kw-as'],
  },

  // 19. as
  {
    id: 'kw-as',
    term: 'as',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Đặt bí danh (Alias) khi import, hoặc gán biến cho Context Manager `with` và `except`.',
    detailedExplanation:
      'Dùng trong: `import numpy as np`, `with open(...) as f:`, `except ValueError as err:`.',
    analogy:
      'Đặt tên gọi thân mật ngắn gọn cho người bạn có tên thật quá dài.',
    syntaxExample: `import multiprocessing as mp\nwith open("log.txt") as f:\n    pass`,
    commonGotcha:
      'Nên tuân thủ các alias quy ước cộng đồng (np cho numpy, pd cho pandas, plt cho matplotlib).',
    jsEquivalent: 'import * as np from "numpy"; / catch (err)',
    relatedTerms: ['kw-import', 'kw-with'],
  },

  // 20. is
  {
    id: 'kw-is',
    term: 'is',
    aliases: ['is not'],
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Toán tử so sánh định danh (Identity Comparison) kiểm tra xem 2 biến có trỏ cùng ô nhớ RAM hay không.',
    detailedExplanation:
      '`a is b` kiểm tra `id(a) == id(b)`. Khác hoàn toàn với `==` (so sánh bằng giá trị). Chuẩn PEP 8 quy định luôn kiểm tra `if x is None:`.',
    analogy:
      '`==` hỏi: "Hai chiếc xe có cùng màu sơn không?". `is` hỏi: "Hai chiếc chìa khóa có mở cùng MỘT chiếc xe trong bãi đỗ không?".',
    syntaxExample: `a = [1, 2]\nb = [1, 2]\nprint(a == b)  # True (cùng giá trị)\nprint(a is b)  # False (2 vùng nhớ độc lập)`,
    commonGotcha:
      'Không bao giờ dùng `is` để so sánh chuỗi hoặc số nguyên lớn. Chỉ dùng `is` cho Singleton như `None`, `True`, `False`.',
    jsEquivalent: '=== (cho Reference Types)',
    relatedTerms: ['kw-none', 'fn-id'],
  },

  // 21. in
  {
    id: 'kw-in',
    term: 'in',
    aliases: ['not in'],
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Kiểm tra phần tử có nằm trong tập hợp (Membership Operator) hoặc duyệt qua trong vòng lặp `for`.',
    detailedExplanation:
      '`x in collection` gọi phương thức `collection.__contains__(x)`. Với Set và Dict, kiểm tra `in` đạt tốc độ O(1). Với List và Tuple, chi phí là O(n).',
    analogy:
      'Tìm tên một người trong danh bạ khách mời: tra cứu trên danh bạ điện tử (Set O(1)) nhanh hơn lật từng trang giấy (List O(n)).',
    syntaxExample: `valid_roles = {"admin", "editor"}\nif role in valid_roles:  # O(1) siêu nhanh!\n    grant()`,
    commonGotcha:
      'Nếu bạn kiểm tra `if x in my_list:` lặp đi lặp lại 10.000 lần trong vòng lặp, hãy đổi `my_list` thành `set(my_list)` để tăng tốc độ hàng nghìn lần!',
    jsEquivalent: 'arr.includes(x) / key in obj',
    relatedTerms: ['kw-for', 'dunder-contains'],
  },

  // 22. not
  {
    id: 'kw-not',
    term: 'not',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Toán tử phủ định logic (Logical NOT), đảo ngược giá trị boolean.',
    detailedExplanation:
      '`not True` thành `False`. `not []` thành `True` vì list rỗng mang giá trị Falsy.',
    analogy:
      'Công tắc đảo chiều: biến BẬT thành TẮT và ngược lại.',
    syntaxExample: `if not is_valid:\n    raise ValueError("Dữ liệu không hợp lệ")`,
    commonGotcha:
      'Ưu tiên viết `if x is not None:` thay vì `if not x is None:` vì dễ đọc hơn.',
    jsEquivalent: '!value',
    relatedTerms: ['kw-and', 'kw-or'],
  },

  // 23. and
  {
    id: 'kw-and',
    term: 'and',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Toán tử logic VÀ (Logical AND) với cơ chế đoản mạch (Short-circuit Evaluation).',
    detailedExplanation:
      'Trả về giá trị Falsy đầu tiên tìm thấy, hoặc giá trị cuối cùng nếu tất cả đều Truthy. Nếu vế trái là Falsy, vế phải sẽ không bao giờ được thực thi.',
    analogy:
      'Cánh cửa an ninh 2 lớp: lớp cửa thứ nhất không mở thì hệ thống không bao giờ quét thẻ lớp cửa thứ hai.',
    syntaxExample: `if user and user.is_active:\n    process_order()`,
    commonGotcha:
      '`and` trong Python trả về giá trị thực tế của toán hạng, không nhất thiết là bool (VD: `[] and "abc"` trả về `[]`).',
    jsEquivalent: 'a && b',
    relatedTerms: ['kw-or', 'kw-not'],
  },

  // 24. or
  {
    id: 'kw-or',
    term: 'or',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Toán tử logic HOẶC (Logical OR) với cơ chế đoản mạch (Short-circuit Evaluation).',
    detailedExplanation:
      'Trả về giá trị Truthy đầu tiên tìm thấy, hoặc giá trị cuối cùng nếu tất cả đều Falsy.',
    analogy:
      'Đèn dự phòng: nguồn điện chính sáng thì dùng nguồn chính, nếu mất điện thì mới kích hoạt máy phát điện.',
    syntaxExample: `display_name = user_name or "Khách vãng lai"`,
    commonGotcha:
      'Nếu `user_name` là chuỗi rỗng `""`, `or` sẽ lấy vế sau ("Khách vãng lai"). Nếu đó là số `0` hợp lệ, hãy cẩn thận kẻo bị ghi đè ngoài ý muốn.',
    jsEquivalent: 'a || b',
    relatedTerms: ['kw-and', 'kw-not'],
  },

  // 25. lambda
  {
    id: 'kw-lambda',
    term: 'lambda',
    category: 'keyword',
    level: 'basic',
    stageId: 'stage-2',
    shortSummary: 'Khai báo hàm ẩn danh (Anonymous Function) ngắn gọn trên 1 dòng duy nhất.',
    detailedExplanation:
      '`lambda args: expression` tạo một hàm nhỏ trả về kết quả của biểu thức sau dấu hai chấm. Thường dùng làm hàm so sánh trong `sorted()` hoặc callback.',
    analogy:
      'Tờ giấy note ghi nhanh công thức tính toán tạm thời dùng một lần rồi vứt đi.',
    syntaxExample: `pairs = [(1, "b"), (2, "a")]\npairs.sort(key=lambda x: x[1])  # Sắp theo chữ cái`,
    commonGotcha:
      'Lambda chỉ chứa được 1 biểu thức (expression), không thể chứa lệnh gán hoặc khối lệnh nhiều dòng.',
    jsEquivalent: '(x) => x[1]',
    relatedTerms: ['kw-def', 'decl-lambda'],
  },

  // 26. pass
  {
    id: 'kw-pass',
    term: 'pass',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Lệnh rỗng (No-op) giữ chỗ cú pháp khi khối code chưa được cài đặt.',
    detailedExplanation:
      'Vì Python dựa vào thụt lề (Indentation), một khối `def`, `class` hay `if` không thể để trống. `pass` đóng vai trò câu lệnh hợp lệ nhưng không làm gì cả.',
    analogy:
      'Tấm biển "Đang thi công" đặt tạm thời tại công trường trước khi xây dựng thực tế.',
    syntaxExample: `class CustomError(Exception):\n    pass  # Class lỗi rỗng chuẩn Pythonic`,
    commonGotcha:
      'Trong Python 3, bạn cũng có thể dùng dấu ba chấm `...` (Ellipsis) thay cho `pass` trong hàm hoặc class trừu tượng.',
    jsEquivalent: '{ /* rỗng */ }',
    relatedTerms: ['kw-def', 'kw-class'],
  },

  // 27. None
  {
    id: 'kw-none',
    term: 'None',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Đối tượng Singleton duy nhất biểu thị "sự vắng mặt của giá trị" (kiểu NoneType).',
    detailedExplanation:
      'Chỉ có duy nhất 1 thực thể `None` trong toàn bộ tiến trình Python. Luôn kiểm tra bằng `is None` hoặc `is not None`.',
    analogy:
      'Tấm biển thông báo "Chưa có hộp nào ở đây cả" (khác với chiếc hộp rỗng).',
    syntaxExample: `def find_user(id: int) -> User | None:\n    return None`,
    commonGotcha:
      'Không dùng `if val == None:`. Chuẩn PEP 8 bắt buộc viết `if val is None:`.',
    jsEquivalent: 'null / undefined',
    relatedTerms: ['kw-is', 'kw-true', 'kw-false'],
  },

  // 28. True
  {
    id: 'kw-true',
    term: 'True',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Hằng số chân lý logic ĐÚNG của kiểu dữ liệu `bool` (kế thừa từ số nguyên 1).',
    detailedExplanation:
      'Trong Python, `bool` là lớp con của `int`. Do đó `True == 1` và `True + 1 == 2`.',
    analogy:
      'Bật đèn sáng: công tắc ở vị trí đóng mạch.',
    syntaxExample: `is_active: bool = True`,
    commonGotcha:
      'Vì `True` là kiểu số nguyên, `{"True": 1, 1: 2}` có thể dẫn tới sự cố nếu dùng làm key của dict!',
    jsEquivalent: 'true',
    relatedTerms: ['kw-false', 'kw-none'],
  },

  // 29. False
  {
    id: 'kw-false',
    term: 'False',
    category: 'keyword',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Hằng số chân lý logic SAI của kiểu dữ liệu `bool` (kế thừa từ số nguyên 0).',
    detailedExplanation:
      '`False == 0` trả về `True`. Là hằng số bất biến Singleton.',
    analogy:
      'Tắt đèn: mạch điện bị ngắt.',
    syntaxExample: `is_connected: bool = False`,
    commonGotcha:
      '`bool("")` và `bool([])` đều trả về `False`.',
    jsEquivalent: 'false',
    relatedTerms: ['kw-true', 'kw-none'],
  },

  // 30. async
  {
    id: 'kw-async',
    term: 'async',
    aliases: ['async def'],
    category: 'keyword',
    level: 'pro',
    stageId: 'stage-5',
    shortSummary: 'Khai báo một hàm bất đồng bộ (Coroutine) chạy trên Event Loop.',
    detailedExplanation:
      '`async def` trả về một Coroutine Object. Không thực thi ngay khi gọi mà phải được đưa vào Event Loop bằng `await` hoặc `asyncio.run()`.',
    analogy:
      'Nhân viên phục vụ nhận order rồi chuyển vào bếp, sau đó lập tức sang bàn khác nhận đơn thay vì đứng bất động.',
    syntaxExample: `async def get_data():\n    return await client.get("/api")`,
    commonGotcha:
      'Đặt `time.sleep()` chặn luồng trong `async def` sẽ làm đơ toàn bộ Event Loop!',
    jsEquivalent: 'async function() {}',
    relatedTerms: ['kw-await', 'concept-asyncio', 'concept-event-loop'],
  },

  // 31. await
  {
    id: 'kw-await',
    term: 'await',
    category: 'keyword',
    level: 'pro',
    stageId: 'stage-5',
    shortSummary: 'Tạm dừng Coroutine hiện tại và nhường quyền điều khiển CPU cho Event Loop chờ kết quả I/O.',
    detailedExplanation:
      'Chỉ được phép sử dụng bên trong hàm `async def`. Đối tượng theo sau `await` phải là một Awaitable (Coroutine, Task, Future).',
    analogy:
      'Nhận chuông rung tự phục vụ tại quán cafe: bạn cầm thẻ rung về bàn ngồi chờ (`await`), khi nào có đồ uống mới lấy.',
    syntaxExample: `response = await client.fetch_url(url)`,
    commonGotcha:
      'Gọi `await` bên ngoài hàm `async def` sẽ gây lỗi `SyntaxError: "await" outside async function`.',
    jsEquivalent: 'await promise',
    relatedTerms: ['kw-async', 'concept-asyncio'],
  },

  // 32. global
  {
    id: 'kw-global',
    term: 'global',
    category: 'keyword',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Khai báo biến trong hàm là biến thuộc phạm vi toàn cục của Module.',
    detailedExplanation:
      'Cho phép gán lại giá trị cho biến ở mức cao nhất của file mà không tạo biến cục bộ mới.',
    analogy:
      'Sửa thông báo trên bảng tin chung của công ty.',
    syntaxExample: `count = 0\ndef increment():\n    global count\n    count += 1`,
    commonGotcha:
      'Hạn chế tối đa dùng `global` vì tạo Side Effect và gây khó khăn cho Unit Test.',
    jsEquivalent: 'Gán biến trực tiếp vào window/globalThis',
    relatedTerms: ['kw-nonlocal', 'decl-global'],
  },

  // 33. nonlocal
  {
    id: 'kw-nonlocal',
    term: 'nonlocal',
    category: 'keyword',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Cho phép hàm con (Closure) gán lại biến thuộc hàm cha bao ngoài gần nhất.',
    detailedExplanation:
      'Quy tắc LEGB: nếu gán biến trong hàm con, Python coi là Local. `nonlocal` chỉ định biến thuộc Enclosing scope.',
    analogy:
      'Sửa số liệu trên bảng của phòng ban làm việc chung.',
    syntaxExample: `def counter():\n    c = 0\n    def step():\n        nonlocal c\n        c += 1\n        return c\n    return step`,
    commonGotcha:
      'Không dùng `nonlocal` cho biến global, và biến bắt buộc phải tồn tại ở hàm cha.',
    jsEquivalent: 'JS hỗ trợ Closure tự nhiên không cần từ khóa',
    relatedTerms: ['kw-global', 'concept-closure'],
  },

  // 34. assert
  {
    id: 'kw-assert',
    term: 'assert',
    category: 'keyword',
    level: 'basic',
    stageId: 'stage-3',
    shortSummary: 'Khẳng định điều kiện đúng phục vụ Debug và Unit Test, ném AssertionError nếu sai.',
    detailedExplanation:
      '`assert condition, "Thông điệp"`. Khi chạy Python với cờ tối ưu `-O` (Optimize), toàn bộ lệnh `assert` bị trình thông dịch bỏ qua hoàn toàn!',
    analogy:
      'Thanh chắn an toàn trong nhà máy: nếu phát hiện thông số sai quy chuẩn thì ngắt máy ngay.',
    syntaxExample: `def set_percentage(val: float):\n    assert 0.0 <= val <= 100.0, "Phần trăm phải từ 0-100"\n    self.pct = val`,
    commonGotcha:
      'Tuyệt đối KHÔNG dùng `assert` để kiểm tra phân quyền bảo mật hoặc dữ liệu người dùng vì nó sẽ bị vô hiệu hóa khi chạy `python -O` trên Production!',
    jsEquivalent: 'console.assert() / assert(condition)',
    relatedTerms: ['kw-raise'],
  },

  // 35. del
  {
    id: 'kw-del',
    term: 'del',
    category: 'keyword',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Xóa nhãn biến, phần tử mảng hoặc thuộc tính của đối tượng khỏi bộ nhớ.',
    detailedExplanation:
      '`del x` xóa tên biến `x` khỏi namespace hiện tại và giảm Reference Count của đối tượng đi 1. Nếu Ref Count về 0, bộ thu dọn rác GC sẽ thu hồi bộ nhớ.',
    analogy:
      'Bóc nhãn dán ra khỏi chiếc hộp đồ: nếu chiếc hộp không còn bất kỳ nhãn dán nào của ai trỏ tới, công nhân vệ sinh (GC) sẽ đem vứt vào thùng tái chế.',
    syntaxExample: `data = [10, 20, 30]\ndel data[1]       # data giờ là [10, 30]\n\nuser = {"name": "An", "temp": 123}\ndel user["temp"]  # Xóa key temp`,
    commonGotcha:
      '`del x` không xóa trực tiếp vùng nhớ vật lý mà chỉ gỡ nhãn biến và giảm Reference Count.',
    jsEquivalent: 'delete obj.prop / arr.splice()',
    relatedTerms: ['concept-garbage-collection', 'fn-id'],
  },

  // --- SOFT KEYWORDS (Pattern Matching PEP 634) ---
  {
    id: 'kw-match',
    term: 'match',
    aliases: ['case', 'match-case'],
    category: 'keyword',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Từ khóa mềm (Soft Keyword) từ Python 3.10 cho Structural Pattern Matching.',
    detailedExplanation:
      'Kết hợp với `case` để giải cấu trúc dữ liệu, kiểm tra kiểu và khớp mẫu logic.',
    analogy:
      'Máy quét X-quang thông minh tự nhận diện kiện hàng thuộc chủng loại nào.',
    syntaxExample: `match status_code:\n    case 200:\n        return "OK"\n    case 404:\n        return "Not Found"\n    case _:\n        return "Unknown"`,
    commonGotcha:
      'Vì là Soft Keyword nên bạn vẫn có thể đặt tên biến là `match = re.match(...)` mà không bị lỗi cú pháp.',
    jsEquivalent: 'switch / case',
    relatedTerms: ['decl-match-case'],
  },
];

import { ExamSet } from '@/types/assessment.types';

export const EXAM_SETS_PART_1: ExamSet[] = [
  {
    id: 'exam-js-to-python-zero',
    title: 'Đề 1: Nhập môn Cấp tốc cho Dev (JS/TS → Python Zero)',
    description:
      'Thử thách chuyển đổi tư duy từ JavaScript/TypeScript, Java, C# sang Python: Strong Dynamic Typing, Truthy/Falsy, phép chia nguyên số âm, độ ưu tiên lũy thừa, Pattern Matching và công cụ hiện đại.',
    targetLevel: 'fundamental',
    targetStage: 'stage-1',
    durationMinutes: 20,
    passingScorePercent: 75,
    questions: [
      {
        id: 'q-zero-1',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Khi chuyển từ JavaScript sang Python, biểu thức `"10" + 5` và `"Ha" * 3` sẽ cho kết quả gì?',
        codeSnippet: `a = "Ha" * 3\nb = "10" + 5`,
        options: [
          {
            id: 'opt-a',
            text: '`a` là `"HaHaHa"`, còn dòng `b = "10" + 5` ném lỗi `TypeError` vì Python là ngôn ngữ định kiểu mạnh (Strong Typing)',
            whyRightOrWrong:
              'Chính xác! Python hỗ trợ nhân chuỗi với số nguyên (`"Ha" * 3 == "HaHaHa"`), nhưng tuyệt đối cấm cộng ngầm định `str` với `int` (`TypeError: can only concatenate str (not "int") to str`).',
          },
          {
            id: 'opt-b',
            text: '`a` là `NaN`, còn `b` là `"105"` giống hệt JavaScript',
            whyRightOrWrong:
              'Sai! Đó là cơ chế ép kiểu ngầm (Weak Typing) của JavaScript, không phải Python.',
          },
          {
            id: 'opt-c',
            text: '`a` là `"Ha3"`, còn `b` là `15`',
            whyRightOrWrong:
              'Sai! Toán tử `*` giữa `str` và `int` là lặp lại chuỗi, và `+` không tự ép `"10"` thành `10`.',
          },
          {
            id: 'opt-d',
            text: 'Cả hai dòng đều ném lỗi `TypeError`',
            whyRightOrWrong:
              'Sai! Phép lặp chuỗi `"Ha" * 3` hoàn toàn hợp lệ và rất Pythonic.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Python là ngôn ngữ **Dynamic Typing** (kiểu gắn với đối tượng lúc chạy) nhưng **Strong Typing** (cấm tự động ép kiểu bừa bãi giữa chuỗi và số). Muốn nối phải ép kiểu tường minh `f"10{5}"` hoặc `"10" + str(5)`.',
        analogyReminder:
          'JS giống nhân viên tự ý đoán mò ghép chữ với số, còn Python yêu cầu giấy tờ chuyển đổi kiểu rõ ràng.',
        relatedTermIds: ['type-str', 'type-int'],
      },
      {
        id: 'q-zero-2',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Đoạn code kiểm tra tính Truthy/Falsy dưới đây in ra kết quả nào (chú ý sự khác biệt chí mạng với JavaScript)?',
        codeSnippet: `print(bool([]), bool({}), bool("0"), bool(0.0))`,
        options: [
          {
            id: 'opt-a',
            text: '`True True False False` (như thói quen JS/PHP)',
            whyRightOrWrong:
              'Sai! Trong Python, `[]` và `{}` rỗng là `False`, còn chuỗi `"0"` có độ dài `len("0") == 1` nên là `True`!',
          },
          {
            id: 'opt-b',
            text: '`False False True False`',
            whyRightOrWrong:
              'Chính xác! Tập rỗng `[]`, `{}` và số `0.0` là Falsy (`False`), nhưng chuỗi `"0"` chứa 1 ký tự (không rỗng `""`) nên là Truthy (`True`)!',
          },
          {
            id: 'opt-c',
            text: '`False False False False`',
            whyRightOrWrong:
              'Sai! Chỉ chuỗi rỗng `""` mới là `False`. Mọi chuỗi có ít nhất 1 ký tự (kể cả `"0"` hay `"False"`) đều là `True`.',
          },
          {
            id: 'opt-d',
            text: '`True True True False`',
            whyRightOrWrong:
              'Sai! Khác với JavaScript, `bool([])` và `bool({})` trong Python luôn là `False`.',
          },
        ],
        correctOptionId: 'opt-b',
        overallExplanation:
          'Trong Python, chỉ các giá trị số bằng `0` (`0`, `0.0`, `0j`), `None`, `False` và mọi tập hợp/chuỗi có độ dài bằng 0 (`""`, `[]`, `{}`, `()`, `set()`, `range(0)`) mới là Falsy.',
        relatedTermIds: ['type-bool', 'type-list', 'type-dict'],
      },
      {
        id: 'q-zero-3',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Kết quả của phép chia thực `/`, chia lấy phần nguyên `//` và chia lấy dư `%` với số âm dưới đây là gì?',
        codeSnippet: `print(7 / 2, -7 // 2, -7 % 2)`,
        options: [
          {
            id: 'opt-a',
            text: '`3.5 -3 -1` (làm tròn về 0 giống `Math.trunc` trong JS/C/Java)',
            whyRightOrWrong:
              'Sai! Toán tử `//` trong Python là **Floor Division** (làm tròn xuống về phía âm vô cùng `-∞`), không phải cắt bỏ phần thập phân về 0!',
          },
          {
            id: 'opt-b',
            text: '`3.5 -4 1`',
            whyRightOrWrong:
              'Chính xác! `7 / 2` luôn trả về `float` (`3.5`). `-7 / 2 = -3.5` làm tròn xuống sàn (`floor`) thành `-4`. Và vì `(-4) * 2 + 1 = -7` nên `-7 % 2` bằng `1` (cùng dấu với số chia `2`)!',
          },
          {
            id: 'opt-c',
            text: '`3 -4 -1`',
            whyRightOrWrong:
              'Sai! Trong Python 3, toán tử `/` luôn trả về `float` (`3.5`), và `-7 % 2` bằng `1`.',
          },
          {
            id: 'opt-d',
            text: '`3.5 -3 1`',
            whyRightOrWrong:
              'Sai! `-7 // 2` làm tròn xuống thành `-4`, không phải `-3`.',
          },
        ],
        correctOptionId: 'opt-b',
        overallExplanation:
          'Python luôn bảo toàn đẳng thức toán học `(a // b) * b + (a % b) == a` với `//` làm tròn xuống `-∞`. Nếu bạn muốn cắt phần thập phân về `0` giống C/Java/JS `Math.trunc`, hãy dùng `int(-7 / 2)` hoặc `math.trunc(-7 / 2)`.',
        relatedTermIds: ['type-int', 'type-float'],
      },
      {
        id: 'q-zero-4',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Chuyện gì xảy ra khi chạy biểu thức lũy thừa `-2 ** 2` và `(-2) ** 2` trong Python?',
        codeSnippet: `print(-2 ** 2, (-2) ** 2)`,
        options: [
          {
            id: 'opt-a',
            text: 'In ra `-4 4` vì toán tử lũy thừa `**` có độ ưu tiên CAO HƠN dấu trừ đơn ngôi `-`',
            whyRightOrWrong:
              'Chính xác! Python tính `2 ** 2 = 4` trước rồi mới gắn dấu âm thành `-(2 ** 2) = -4`. (Trong JS, `-2 ** 2` thậm chí bị cấm bằng `SyntaxError` vì quá dễ nhầm!).',
          },
          {
            id: 'opt-b',
            text: 'In ra `4 4` vì `-2` bình phương bằng `4`',
            whyRightOrWrong:
              'Sai! Không có ngoặc đơn thì `**`綁 chặt với `2` trước khi dấu `-` được áp dụng.',
          },
          {
            id: 'opt-c',
            text: 'Ném lỗi `SyntaxError: Unary operator used immediately before exponentiation` giống JavaScript',
            whyRightOrWrong:
              'Sai! JavaScript cấm cú pháp này, nhưng Python cho phép và hiểu là `-(2 ** 2) = -4`.',
          },
          {
            id: 'opt-d',
            text: 'In ra `-4 -4`',
            whyRightOrWrong:
              'Sai! Khi có ngoặc `(-2) ** 2`, kết quả là `(-2) * (-2) = 4`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Trong bảng độ ưu tiên toán tử của Python, `**` đứng cao nhất (chỉ sau ngoặc `()`), cao hơn cả toán tử đảo dấu `-x`. Hãy luôn bọc ngoặc `(-x) ** 2` khi muốn bình phương một số âm.',
        relatedTermIds: ['type-int'],
      },
      {
        id: 'q-zero-5',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Sự khác biệt cốt lõi giữa toán tử `==` và từ khóa `is` trong Python là gì?',
        codeSnippet: `a = [1, 2, 3]\nb = [1, 2, 3]\nprint(a == b, a is b)`,
        options: [
          {
            id: 'opt-a',
            text: '`==` giống `==` của JS (có ép kiểu), còn `is` giống `===` của JS (so sánh giá trị nghiêm ngặt)',
            whyRightOrWrong:
              'Sai lầm kinh điển nhất của dân JS sang Python! Trong Python, bản thân `==` ĐÃ LÀ so sánh giá trị nghiêm ngặt không ép kiểu bừa bãi (tương đương `===` đối với kiểu nguyên thủy), còn `is` so sánh địa chỉ ô nhớ (`id(a) == id(b)`).',
          },
          {
            id: 'opt-b',
            text: 'In ra `True False`: `==` so sánh giá trị bên trong (`__eq__`), còn `is` so sánh danh tính ô nhớ (`id(a) == id(b)`)',
            whyRightOrWrong:
              'Chính xác! Hai danh sách `a` và `b` có nội dung giống hệt nhau (`a == b` là `True`), nhưng là 2 đối tượng độc lập ở 2 vùng RAM khác nhau (`a is b` là `False`).',
          },
          {
            id: 'opt-c',
            text: 'In ra `True True` vì cả hai danh sách đều chứa `[1, 2, 3]`',
            whyRightOrWrong:
              'Sai! Mỗi biểu thức `[1, 2, 3]` cấp phát một đối tượng `list` mới trên Heap.',
          },
          {
            id: 'opt-d',
            text: 'In ra `False False` giống như `[1, 2, 3] === [1, 2, 3]` trong JavaScript',
            whyRightOrWrong:
              'Sai! Trong JS `===` trên mảng so sánh tham chiếu, nhưng trong Python `a == b` duyệt so sánh từng phần tử bên trong 2 list nên trả về `True`!',
          },
        ],
        correctOptionId: 'opt-b',
        overallExplanation:
          'Quy tắc vàng: Luôn dùng `==` để so sánh giá trị (số, chuỗi, list, dict). CHỈ dùng `is` hoặc `is not` khi kiểm tra đối tượng Singleton như `if x is None:`.',
        relatedTermIds: ['kw-is', 'dunder-eq', 'kw-none'],
      },
      {
        id: 'q-zero-6',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Trong Python không có `undefined` và `null` tách rời như JavaScript. Khi một hàm không có lệnh `return` hoặc truy cập một biến chưa khai báo, điều gì xảy ra?',
        codeSnippet: `def log_msg(msg: str):\n    print(msg)\n\nres = log_msg("Hi")`,
        options: [
          {
            id: 'opt-a',
            text: '`res` nhận giá trị `None` (Singleton duy nhất trong RAM); còn truy cập biến chưa gán sẽ ném lỗi `NameError` ngay lập tức',
            whyRightOrWrong:
              'Chính xác! Mọi hàm không `return` giá trị đều tự động trả về `None`. Và Python không có khái niệm biến `undefined` — biến chưa khởi tạo sẽ ném `NameError`.',
          },
          {
            id: 'opt-b',
            text: '`res` nhận giá trị `undefined`, còn `None` chỉ xuất hiện khi gán tường minh',
            whyRightOrWrong:
              'Sai! Python hoàn toàn không có từ khóa `undefined`.',
          },
          {
            id: 'opt-c',
            text: 'Kiểm tra `res` chuẩn nhất là viết `if res == None:`',
            whyRightOrWrong:
              'Sai! Theo chuẩn PEP 8 và vì một class tùy chỉnh có thể ghi đè `__eq__`, ta BẮT BUỘC dùng `if res is None:`.',
          },
          {
            id: 'opt-d',
            text: 'Gọi `type(None)` sẽ trả về `"object"` giống `typeof null` trong JavaScript',
            whyRightOrWrong:
              'Sai! `type(None)` trong Python trả về kiểu riêng biệt `<class \'NoneType\'>`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          '`None` là thực thể duy nhất (Singleton) của lớp `NoneType`. Luôn kiểm tra bằng `x is None` hoặc `x is not None`.',
        relatedTermIds: ['kw-none', 'kw-is', 'kw-def'],
      },
      {
        id: 'q-zero-7',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Cú pháp f-string hiện đại `f"{price=:.2f}"` (Python 3.8+) sẽ tạo ra chuỗi kết quả nào dưới đây?',
        codeSnippet: `price = 19.5\nprint(f"{price=:.2f}")`,
        options: [
          {
            id: 'opt-a',
            text: '`price=19.50` (tự động in cả tên biểu thức, dấu `=` và giá trị đã định dạng 2 chữ số thập phân)',
            whyRightOrWrong:
              'Chính xác! Cú pháp `f"{expr=}"` cực kỳ lợi hại khi debug (thay thế cho `console.log({ price })` bên JS) và còn kết hợp được với format specifier `:.2f`.',
          },
          {
            id: 'opt-b',
            text: '`19.50`',
            whyRightOrWrong:
              'Sai! Dấu `=` đứng trước dấu `:` bảo Python giữ lại phần chữ `"price="` ở đầu.',
          },
          {
            id: 'opt-c',
            text: 'Ném lỗi `SyntaxError` vì không được viết dấu `=` trong ngoặc nhọn f-string',
            whyRightOrWrong:
              'Sai! Tính năng Self-documenting expressions `f"{x=}"` đã có từ Python 3.8.',
          },
          {
            id: 'opt-d',
            text: '`{price=19.5}`',
            whyRightOrWrong:
              'Sai! Ngoặc nhọn đơn là khung nội suy của f-string và `:.2f` làm tròn thành `19.50`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mẹo thực chiến: Khi debug nhanh, hãy dùng `f"{user_id=}, {total * 1.1=:.2f}"` để vừa thấy biểu thức gốc vừa thấy kết quả tính toán.',
        relatedTermIds: ['type-str', 'type-float'],
      },
      {
        id: 'q-zero-8',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Tại sao trong hệ thống thanh toán tài chính (Fintech), bạn KHÔNG ĐƯỢC dùng `float` (`0.1 + 0.2 == 0.3`) mà phải dùng `decimal.Decimal` với tham số kiểu chuỗi `str`?',
        codeSnippet: `from decimal import Decimal\n\na = 0.1 + 0.2 == 0.3\nb = Decimal("0.1") + Decimal("0.2") == Decimal("0.3")\nc = Decimal(0.1) + Decimal(0.2) == Decimal("0.3")\nprint(a, b, c)`,
        options: [
          {
            id: 'opt-a',
            text: '`False True False` — Vì nếu truyền số thực `Decimal(0.1)`, sai số nhị phân IEEE 754 `0.10000000000000000555...` đã xuất hiện TRƯỚC khi truyền vào `Decimal`!',
            whyRightOrWrong:
              'Chính xác 100%! Phải truyền chuỗi `Decimal("0.1")` thì `Decimal` mới biểu diễn chính xác hệ cơ số 10 mà không bị nhiễm sai số dấu chấm động nhị phân.',
          },
          {
            id: 'opt-b',
            text: '`False True True` — `Decimal` tự động làm tròn cả `float` lẫn `str`',
            whyRightOrWrong:
              'Sai! `Decimal(0.1)` lưu nguyên giá trị nhị phân lẻ của `float` `0.1`, nên `c` trả về `False`!',
          },
          {
            id: 'opt-c',
            text: '`True True True` — Python 3 đã sửa lỗi IEEE 754',
            whyRightOrWrong:
              'Sai! Mọi ngôn ngữ dùng chuẩn phần cứng IEEE 754 (`float` trong Python, `number` trong JS) đều có `0.1 + 0.2 == 0.30000000000000004`.',
          },
          {
            id: 'opt-d',
            text: '`False False False`',
            whyRightOrWrong:
              'Sai! `Decimal("0.1") + Decimal("0.2") == Decimal("0.3")` cho kết quả `True` tuyệt đối.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Luôn khởi tạo `Decimal` từ chuỗi `Decimal("19.99")` hoặc lưu tiền tệ dưới dạng số nguyên đơn vị nhỏ nhất (cents/xu `int`). Nếu chỉ so sánh số thực khoa học thông thường, hãy dùng `math.isclose(0.1 + 0.2, 0.3)`.',
        relatedTermIds: ['type-float', 'type-int'],
      },
      {
        id: 'q-zero-9',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Trong JavaScript, `1 < 3 > 2` được tính là `(1 < 3) > 2` tức `true > 2` (`1 > 2` -> `false`). Còn trong Python, kết quả của `1 < 2 < 3` và `1 < 3 > 2` là gì?',
        codeSnippet: `print(1 < 2 < 3, 1 < 3 > 2, 1 == 1 in [1])`,
        options: [
          {
            id: 'opt-a',
            text: '`True True True` — Python mở rộng mọi dãy toán tử so sánh liên tiếp (`<`, `>`, `==`, `in`, `is`) bằng phép `and` và chỉ tính biểu thức ở giữa đúng 1 lần!',
            whyRightOrWrong:
              'Chính xác! `1 < 3 > 2` tương đương `(1 < 3) and (3 > 2)` -> `True`. Ngay cả `1 == 1 in [1]` cũng được Python hiểu là `(1 == 1) and (1 in [1])` -> `True`!',
          },
          {
            id: 'opt-b',
            text: '`True False False` giống cách tính từ trái sang phải của JavaScript',
            whyRightOrWrong:
              'Sai! Python có tính năng **Chained Comparisons** cho toàn bộ nhóm toán tử so sánh.',
          },
          {
            id: 'opt-c',
            text: '`True True False` vì `1 == 1` là `True` và `True in [1]` là `False`',
            whyRightOrWrong:
              'Sai! Toán tử `in` cũng là một toán tử so sánh trong Python nên `1 == 1 in [1]` được nối chuỗi thành `(1 == 1) and (1 in [1])`!',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `SyntaxError` ở biểu thức `1 < 3 > 2`',
            whyRightOrWrong:
              'Sai! Cú pháp hoàn toàn hợp lệ trong Python.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Chained Comparisons `low <= x < high` là một trong những cú pháp thanh lịch nhất của Python: vừa đọc tự nhiên như toán học, vừa chỉ đánh giá biểu thức `x` ở giữa đúng 1 lần duy nhất.',
        relatedTermIds: ['type-bool', 'kw-in', 'kw-and-or-not'],
      },
      {
        id: 'q-zero-10',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Một lập trình viên C#/JS viết `match ... case` (Python 3.10+) để kiểm tra mã HTTP nhưng gặp một cái bẫy cực kỳ nguy hiểm dưới đây. Đoạn code này sẽ in ra gì?',
        codeSnippet: `NOT_FOUND = 404\nOK = 200\nstatus = 200\n\nmatch status:\n    case NOT_FOUND:\n        print("Lỗi 404!")\n    case OK:\n        print("Thành công 200!")`,
        options: [
          {
            id: 'opt-a',
            text: 'In ra `"Thành công 200!"` như mong đợi',
            whyRightOrWrong:
              'Sai! Đây là cái bẫy lớn nhất của Structural Pattern Matching trong Python!',
          },
          {
            id: 'opt-b',
            text: 'In ra `"Lỗi 404!"` (và gán đè biến `NOT_FOUND = 200`!) vì một tên biến đơn lẻ trong `case NOT_FOUND:` là **Capture Pattern** (bắt mọi giá trị và gán vào biến `NOT_FOUND`) chứ không phải so sánh hằng số!',
            whyRightOrWrong:
              'Chính xác! Trong `match...case`, bất kỳ định danh đơn nào không có dấu chấm (`case x:`) đều hoạt động như mẫu hứng dữ liệu (giống wildcard `_` nhưng gắn tên biến). Muốn so sánh giá trị biến ngoài, phải dùng tên có dấu chấm như `case HttpStatus.NOT_FOUND:` (Enum) hoặc điều kiện `case x if x == NOT_FOUND:`.',
          },
          {
            id: 'opt-c',
            text: 'In ra cả `"Lỗi 404!"` lẫn `"Thành công 200!"` vì thiếu lệnh `break`',
            whyRightOrWrong:
              'Sai! `match...case` trong Python KHÔNG có hiện tượng fall-through như `switch` trong JS/C, không bao giờ cần `break`.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `SyntaxError` vì `case` chỉ chấp nhận literal số hoặc chuỗi',
            whyRightOrWrong:
              'Sai! Python không báo lỗi cú pháp mà coi `NOT_FOUND` là biến hứng mẫu (capture variable).',
          },
        ],
        correctOptionId: 'opt-b',
        overallExplanation:
          'Khi dùng `match ... case`, hãy nhớ: `case 404:` là so sánh giá trị literal; `case Status.NOT_FOUND:` (có dấu chấm `.`) là so sánh giá trị thuộc tính/Enum; còn `case NOT_FOUND:` (tên trần không có dấu chấm) luôn luôn khớp MỌI thứ và gán đè vào biến `NOT_FOUND`!',
        relatedTermIds: ['kw-match-case'],
      },
      {
        id: 'q-zero-11',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Từ khóa `else` gắn ngay sau vòng lặp `for ... else:` trong Python sẽ chạy khi nào?',
        codeSnippet: `nums = [2, 4, 6]\nfor n in nums:\n    if n % 2 != 0:\n        print("Tìm thấy số lẻ")\n        break\nelse:\n    print("Không có số lẻ nào")`,
        options: [
          {
            id: 'opt-a',
            text: 'Khối `else` CHỈ chạy khi vòng lặp `for` kết thúc tự nhiên mà KHÔNG gặp lệnh `break` (kể cả khi danh sách rỗng `[]`)',
            whyRightOrWrong:
              'Chính xác! Hãy đọc từ khóa `else` của vòng lặp là **`nobreak`** (nếu không bị `break` giữa chừng thì làm việc này). Ở đây mọi số đều chẵn, không `break`, nên in ra `"Không có số lẻ nào"`.',
          },
          {
            id: 'opt-b',
            text: 'Khối `else` chỉ chạy khi danh sách `nums` bị rỗng `[]`',
            whyRightOrWrong:
              'Sai lầm rất phổ biến! Ngay cả khi `nums` có phần tử và chạy hết vòng lặp mà không `break`, khối `else` vẫn chạy!',
          },
          {
            id: 'opt-c',
            text: 'Khối `else` chạy khi vòng lặp bị thoát bởi lệnh `break`',
            whyRightOrWrong:
              'Sai! Ngược lại hoàn toàn: nếu gặp `break` (hoặc `return` / `raise`), khối `else` sẽ bị bỏ qua.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `SyntaxError` vì `else` đã lệch cột với `if`',
            whyRightOrWrong:
              'Sai! `for ... else` và `while ... else` là cú pháp chính thống của Python để thay thế biến cờ `found = False`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mẹo nhớ suốt đời của Raymond Hettinger (Python Core Dev): Hãy tưởng tượng từ khóa `else` đặt ngang hàng với `for`/`while` có tên thật là **`nobreak`**.',
        relatedTermIds: ['kw-for', 'kw-if-elif-else'],
      },
      {
        id: 'q-zero-12',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Toán tử Hải mã (Walrus Operator `:=`, Python 3.8+) giải quyết vấn đề gì và khác gì dấu `=` thông thường?',
        codeSnippet: `data = [1, 2, 3, 4, 5]\nif (n := len(data)) > 3:\n    print(f"Danh sách dài {n} phần tử")`,
        options: [
          {
            id: 'opt-a',
            text: '`:=` là **Assignment Expression** — vừa gán giá trị cho biến `n`, vừa trả về chính giá trị đó ngay bên trong biểu thức `if`/`while`/comprehension (trong khi `=` là câu lệnh Statement không trả về giá trị)',
            whyRightOrWrong:
              'Chính xác! Trong Python, `if (n = len(data)) > 3:` bị cấm (`SyntaxError`) để chống nhầm với `==`. Toán tử `:=` cho phép vừa gán vừa dùng ngay một cách chủ đích.',
          },
          {
            id: 'opt-b',
            text: '`:=` dùng để khai báo biến có kiểu dữ liệu tĩnh giống ngôn ngữ Go',
            whyRightOrWrong:
              'Sai! Trong Go `:=` là short variable declaration, còn trong Python `:=` là toán tử gán biểu thức (Walrus Operator).',
          },
          {
            id: 'opt-c',
            text: 'Nếu quên dấu ngoặc đơn mà viết `if n := len(data) > 3:`, biến `n` vẫn nhận giá trị `5`',
            whyRightOrWrong:
              'Sai! Vì `:=` có độ ưu tiên THẤP hơn `>`, nếu viết `if n := len(data) > 3:` thì Python sẽ tính `len(data) > 3` trước và gán `n = True`! Do đó dấu ngoặc `(n := len(data)) > 3` là bắt buộc.',
          },
          {
            id: 'opt-d',
            text: 'Biến `n` chỉ tồn tại bên trong khối `if` (Block Scope) giống `let` trong JS',
            whyRightOrWrong:
              'Sai! Python KHÔNG có Block Scope cho `if/for/while` — biến `n` thuộc về Function/Module Scope và vẫn truy cập được sau khối `if`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Lưu ý 2 điểm với Walrus `:=`: (1) Luôn bọc ngoặc đơn `(x := expr) > val` khi kết hợp với toán tử so sánh, và (2) Python chỉ có phạm vi LEGB (Local/Function, Enclosing, Global, Built-in), không có Block Scope cho `if`/`for`.',
        relatedTermIds: ['kw-if-elif-else'],
      },
      {
        id: 'q-zero-13',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Khi bạn chạy một dự án Python, thư mục `__pycache__/` chứa các file `.pyc` xuất hiện để làm gì, và công cụ `uv` đóng vai trò gì trong hệ sinh thái hiện đại?',
        options: [
          {
            id: 'opt-a',
            text: 'File `.pyc` là mã **Bytecode** đã biên dịch từ `.py` giúp CPython nạp module nhanh hơn ở các lần chạy sau; còn `uv` (viết bằng Rust) là trình quản lý Python version, `.venv`, package và lockfile siêu tốc thay thế `pip`/`venv`/`poetry`',
            whyRightOrWrong:
              'Chính xác! CPython không thông dịch từng chữ `.py` trực tiếp mà biên dịch sang Bytecode `.pyc` rồi chạy trên máy ảo CPython VM. Và `uv` là chuẩn mực quản lý dự án tốc độ cao hiện nay.',
          },
          {
            id: 'opt-b',
            text: 'File `.pyc` là mã máy (Native Machine Code) chạy trực tiếp trên CPU không cần CPython',
            whyRightOrWrong:
              'Sai! `.pyc` chỉ là Bytecode dành cho máy ảo CPython, không phải binary thực thi độc lập của hệ điều hành.',
          },
          {
            id: 'opt-c',
            text: 'Bắt buộc phải commit thư mục `__pycache__/` lên Git để code chạy được trên server',
            whyRightOrWrong:
              'Sai! `__pycache__/` phụ thuộc vào phiên bản Python cụ thể (vd `cpython-312.pyc`) và luôn phải đưa vào `.gitignore`.',
          },
          {
            id: 'opt-d',
            text: '`uv` là một trình biên dịch JIT thay thế cho CPython giống PyPy',
            whyRightOrWrong:
              'Sai! `uv` là công cụ quản lý gói và môi trường (Toolchain/Package Manager của Astral), vẫn chạy code trên CPython chuẩn.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Quy trình chạy của CPython: `Source (.py) -> AST -> Bytecode (.pyc) -> CPython Evaluation Loop`. Trong Docker Production, ta thường bật `UV_COMPILE_BYTECODE=1` lúc build để tạo sẵn `.pyc`, giúp container khởi động nhanh hơn.',
        relatedTermIds: ['eco-uv'],
      },
      {
        id: 'q-zero-14',
        stageId: 'stage-1',
        level: 'fundamental',
        question:
          'Tại sao trong các file Python thực tế luôn có dòng kiểm tra `if __name__ == "__main__":` ở cuối file?',
        codeSnippet: `def calculate_tax(amount: float) -> float:\n    return amount * 0.1\n\nif __name__ == "__main__":\n    print(calculate_tax(1000))`,
        options: [
          {
            id: 'opt-a',
            text: 'Vì khi chạy trực tiếp `python tax.py`, biến `__name__` có giá trị `"__main__"`; nhưng khi file khác `import tax`, Python sẽ Thực Thi Toàn Bộ File `tax.py` từ trên xuống dưới với `__name__ == "tax"` — khối `if` này ngăn code chạy thử nghiệm tự động kích hoạt lúc `import`!',
            whyRightOrWrong:
              'Chính xác! Khác với một số ngôn ngữ chỉ đọc khai báo, lệnh `import` của Python thực sự chạy hết các câu lệnh cấp cao nhất (top-level) của module được import.',
          },
          {
            id: 'opt-b',
            text: 'Bắt buộc phải có `if __name__ == "__main__":` thì trình thông dịch Python mới biết điểm bắt đầu giống hàm `public static void main` trong Java/C#',
            whyRightOrWrong:
              'Sai! Python không bắt buộc hàm `main` — nó thực thi tuần tự từ dòng 1 của file. Khối `if` này chỉ là chốt chặn bảo vệ khi module được `import` từ nơi khác.',
          },
          {
            id: 'opt-c',
            text: 'Để xuất khẩu (export) hàm `calculate_tax` ra ngoài giống `export default` trong ES Modules',
            whyRightOrWrong:
              'Sai! Trong Python, mọi hàm/class ở cấp module mặc định đều có thể được import mà không cần từ khóa `export`.',
          },
          {
            id: 'opt-d',
            text: 'Giúp trình kiểm tra kiểu tĩnh Pyright bỏ qua phần code bên dưới',
            whyRightOrWrong:
              'Sai! Pyright vẫn kiểm tra kiểu bên trong khối `if __name__ == "__main__":` bình thường.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mọi module Python đều có biến đặc biệt `__name__`. Khi chạy trực tiếp làm entrypoint, `__name__ == "__main__"`. Khi được nạp qua `import pkg.module`, `__name__ == "pkg.module"`.',
        relatedTermIds: ['kw-import', 'kw-if-elif-else'],
      },
    ],
  },
  {
    id: 'exam-fundamental-basic',
    title: 'Đề 2: Mô hình Bộ nhớ, Collections & Nghệ thuật Slicing (Giai đoạn 1)',
    description:
      'Kiểm tra toàn diện kiến thức nền tảng Giai đoạn 1: Pass-by-Object-Reference, Mutable Default Arguments, Shallow vs Deep Copy, Tuple Hashability, In-place Mutation, Slicing và Unpacking.',
    targetLevel: 'basic',
    targetStage: 'stage-1',
    durationMinutes: 20,
    passingScorePercent: 75,
    questions: [
      {
        id: 'q-fb-1',
        stageId: 'stage-1',
        level: 'fundamental',
        question: 'Đoạn code Python dưới đây sẽ in ra kết quả gì?',
        codeSnippet: `def add_student(name: str, group: list[str] = []) -> list[str]:\n    group.append(name)\n    return group\n\ng1 = add_student("An")\ng2 = add_student("Bình")\nprint(g2, g1 is g2)`,
        options: [
          {
            id: 'opt-a',
            text: "`['Bình'] False`",
            whyRightOrWrong:
              'Sai! Trong Python (khác với JS), tham số mặc định `group = []` chỉ được khởi tạo đúng 1 lần lúc nạp hàm (`define time`).',
          },
          {
            id: 'opt-b',
            text: "`['An', 'Bình'] True`",
            whyRightOrWrong:
              'Chính xác! Cả `g1` và `g2` đều tham chiếu tới cùng một đối tượng `list` mặc định duy nhất được lưu trong `add_student.__defaults__`.',
          },
          {
            id: 'opt-c',
            text: "`['An', 'Bình'] False`",
            whyRightOrWrong:
              'Sai! Vì `g1` và `g2` cùng trỏ vào đúng 1 danh sách trong RAM nên `g1 is g2` trả về `True`.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `TypeError` vì `list` không được làm tham số mặc định',
            whyRightOrWrong:
              'Sai! CPython vẫn cho phép chạy mà không báo lỗi cú pháp — chính vì vậy đây mới là cái bẫy số 1.',
          },
        ],
        correctOptionId: 'opt-b',
        overallExplanation:
          'Để khắc phục bẫy Mutable Default Arguments, hãy luôn khai báo `group: list[str] | None = None` và khởi tạo `if group is None: group = []` bên trong thân hàm.',
        analogyReminder:
          'Hình tượng hóa: Chiếc bát mặc định duy nhất chuẩn bị từ ngày khai trương quán.',
        relatedTermIds: ['concept-mutable-default', 'kw-def', 'kw-is'],
      },
      {
        id: 'q-fb-2',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Theo cơ chế **Pass-by-Object-Reference** của Python, đoạn code dưới đây sẽ in ra kết quả gì?',
        codeSnippet: `def modify(items: list[int], count: int) -> None:\n    items.append(99)\n    items = [0, 0]\n    count += 10\n\narr = [1, 2]\nn = 5\nmodify(arr, n)\nprint(arr, n)`,
        options: [
          {
            id: 'opt-a',
            text: '`[1, 2, 99] 5` — Lệnh `items.append(99)` đột biến (mutate) trực tiếp đối tượng `arr` gốc, còn lệnh `items = [0, 0]` và `count += 10` chỉ dán lại nhãn cục bộ sang đối tượng mới!',
            whyRightOrWrong:
              'Chính xác! Biến trong Python là nhãn dán (name binding). `.append(99)` tác động vào cái hộp mà cả `arr` và `items` đang cùng trỏ tới; ngay sau đó `items = [0, 0]` bóc nhãn `items` dán sang hộp mới nên không ảnh hưởng đến `arr`.',
          },
          {
            id: 'opt-b',
            text: '`[0, 0] 15` (giống truyền tham chiếu `ref` trong C#)',
            whyRightOrWrong:
              'Sai! Python KHÔNG phải Pass-by-Reference theo kiểu bí danh biến (variable alias): gán lại `items = [0, 0]` không bao giờ thay đổi biến `arr` ở ngoài.',
          },
          {
            id: 'opt-c',
            text: '`[1, 2] 5` (giống truyền tham trị copy toàn bộ)',
            whyRightOrWrong:
              'Sai! Python không copy danh sách khi truyền vào hàm, nên `items.append(99)` đã làm thay đổi `arr` gốc.',
          },
          {
            id: 'opt-d',
            text: '`[0, 0] 5`',
            whyRightOrWrong:
              'Sai! Gán lại biến tham số `items = [0, 0]` chỉ đổi hướng nhãn `items` cục bộ bên trong hàm.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Hãy phân biệt rõ hai hành động trong Python: **Mutating** (`items.append()`, `items[0] = ...` -> thay đổi bên trong đối tượng hiện tại, bên ngoài thấy ngay) và **Rebinding** (`items = ...` -> dán nhãn cục bộ sang đối tượng khác, bên ngoài không bị ảnh hưởng).',
        relatedTermIds: ['concept-pass-by-object-ref', 'type-list', 'type-int'],
      },
      {
        id: 'q-fb-3',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Cấu trúc dữ liệu nào sau đây có thể dùng làm khóa (key) hợp lệ cho một `dict` (hoặc phần tử của `set`) mà KHÔNG gây lỗi `TypeError: unhashable type`?',
        codeSnippet: `cache = {}\n# Đâu là key hợp lệ?`,
        options: [
          {
            id: 'opt-a',
            text: 'Một danh sách tọa độ: `[21.02, 105.85]` (kiểu `list`)',
            whyRightOrWrong:
              'Sai! `list` là khả biến (Mutable) nên không có mã băm cố định (`unhashable type: list`).',
          },
          {
            id: 'opt-b',
            text: 'Một tập hợp: `{"hn", "hcm"}` (kiểu `set`)',
            whyRightOrWrong:
              'Sai! `set` thông thường cũng là khả biến (phải dùng `frozenset` mới bất biến và hashable).',
          },
          {
            id: 'opt-c',
            text: 'Một bộ bất biến chứa các số và frozenset: `(21.02, 105.85, frozenset(["vn"]))`',
            whyRightOrWrong:
              'Chính xác! Vì bản thân `tuple` và TẤT CẢ các phần tử bên trong nó (`float`, `frozenset`) đều bất biến và Hashable, nó làm key cho `dict` hoàn hảo.',
          },
          {
            id: 'opt-d',
            text: 'Một tuple có chứa list bên trong: `("coords", [1, 2])`',
            whyRightOrWrong:
              'Sai! Một `tuple` chỉ Hashable khi TẤT CẢ các phần tử bên trong nó cũng Hashable. Vì chứa `[1, 2]` nên `hash(("coords", [1, 2]))` lập tức ném lỗi `TypeError: unhashable type: \'list\'`!',
          },
        ],
        correctOptionId: 'opt-c',
        overallExplanation:
          'Khóa của `dict` bắt buộc phải **Hashable** (giá trị băm `__hash__()` không đổi suốt vòng đời). Một `tuple` chỉ Hashable khi và chỉ khi mọi phần tử đệ quy bên trong nó đều Hashable.',
        relatedTermIds: ['type-tuple', 'type-dict', 'type-list', 'type-set'],
      },
      {
        id: 'q-fb-4',
        stageId: 'stage-1',
        level: 'basic',
        question: 'Kết quả của phép sao chép nông (Shallow Copy) dưới đây là gì?',
        codeSnippet: `grid = [[1, 2], [3, 4]]\nclone = grid[:]\nclone[0].append(99)\nclone.append([5, 6])\nprint(grid)`,
        options: [
          {
            id: 'opt-a',
            text: '`[[1, 2], [3, 4]]` vì `grid[:]` đã tạo ra một bản sao mới hoàn toàn',
            whyRightOrWrong:
              'Sai! `grid[:]` (cũng như `grid.copy()` hay `list(grid)`) chỉ là **Shallow Copy** (sao chép nông cấp 1).',
          },
          {
            id: 'opt-b',
            text: '`[[1, 2, 99], [3, 4]]` — Danh sách vỏ ngoài là mới (nên `[5, 6]` không vào `grid`), nhưng danh sách con ở tầng 2 `grid[0]` và `clone[0]` vẫn dùng chung địa chỉ ô nhớ!',
            whyRightOrWrong:
              'Chính xác! `clone[0].append(99)` đột biến danh sách con dùng chung ở tầng 2, còn `clone.append([5, 6])` thêm vào vỏ ngoài của riêng `clone`.',
          },
          {
            id: 'opt-c',
            text: '`[[1, 2, 99], [3, 4], [5, 6]]`',
            whyRightOrWrong:
              'Sai! Vỏ ngoài của `clone` là một `list` mới độc lập với vỏ ngoài của `grid`, nên `clone.append([5, 6])` không ảnh hưởng tới `grid`.',
          },
          {
            id: 'opt-d',
            text: '`[[1, 2], [3, 4], [5, 6]]`',
            whyRightOrWrong:
              'Sai! Ngược lại hoàn toàn giữa tầng 1 và tầng 2.',
          },
        ],
        correctOptionId: 'opt-b',
        overallExplanation:
          'Khi làm việc với cấu trúc dữ liệu lồng nhau (`nested list/dict`), hãy dùng `copy.deepcopy(grid)` nếu muốn tách biệt hoàn toàn mọi tầng đệ quy.',
        analogyReminder:
          'Shallow copy chỉ photo tờ danh bạ bên ngoài, địa chỉ ngôi nhà bên trong vẫn giữ nguyên.',
        relatedTermIds: ['concept-shallow-deep-copy', 'concept-pass-by-object-ref'],
      },
      {
        id: 'q-fb-5',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Đoạn code khởi tạo Tuple 1 phần tử dưới đây sẽ in ra kết quả gì?',
        codeSnippet: `a = (42)\nb = (42,)\nc = 42,\nprint(type(a).__name__, type(b).__name__, b == c)`,
        options: [
          {
            id: 'opt-a',
            text: '`int tuple True` — Chính dấu phẩy `,` mới là thứ tạo nên `tuple` chứ không phải cặp ngoặc đơn `()`!',
            whyRightOrWrong:
              'Chính xác! `(42)` chỉ là biểu thức số học trong ngoặc đơn nên là `int`. Phải có dấu phẩy kết thúc `(42,)` hoặc `42,` mới tạo ra `tuple` 1 phần tử.',
          },
          {
            id: 'opt-b',
            text: '`tuple tuple False`',
            whyRightOrWrong:
              'Sai! `(42)` không có dấu phẩy nên chỉ là số nguyên `int`.',
          },
          {
            id: 'opt-c',
            text: 'Ném lỗi `SyntaxError` ở dòng `c = 42,`',
            whyRightOrWrong:
              'Sai! Dấu phẩy ở cuối `c = 42,` là cú pháp đóng gói tuple (Tuple Packing) hoàn toàn hợp lệ (và rất dễ vô tình mắc phải khi dư dấu phẩy cuối dòng!).',
          },
          {
            id: 'opt-d',
            text: '`int list False`',
            whyRightOrWrong:
              'Sai! Dấu phẩy tạo ra `tuple`, không phải `list`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Cẩn thận lỗi thực tế: Nếu bạn vô tình để dư một dấu phẩy ở cuối dòng gán biến `email = "user@test.com",`, biến `email` sẽ biến thành một `tuple` `("user@test.com",)` thay vì `str`!',
        relatedTermIds: ['type-tuple', 'type-int'],
      },
      {
        id: 'q-fb-6',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Một lập trình viên quen viết `arr.push(4)` hoặc `arr.concat([4, 5])` trong JS đã viết đoạn code Python dưới đây. Kết quả in ra là gì?',
        codeSnippet: `nums = [1, 2, 3]\nres = nums.append([4, 5])\nnums.extend([6, 7])\nprint(res, len(nums), nums[-1])`,
        options: [
          {
            id: 'opt-a',
            text: '`None 6 7` — Vì `.append()` và `.extend()` biến đổi trực tiếp tại chỗ (in-place) và luôn trả về `None`; đồng thời `.append([4, 5])` nhét nguyên cả list con vào làm 1 phần tử!',
            whyRightOrWrong:
              'Chính xác! Sau `.append([4, 5])`, `nums` là `[1, 2, 3, [4, 5]]` (4 phần tử) và `res` là `None`. Sau `.extend([6, 7])`, `nums` trải phẳng thêm 2 số thành `[1, 2, 3, [4, 5], 6, 7]` (6 phần tử, phần tử cuối `7`).',
          },
          {
            id: 'opt-b',
            text: '`[1, 2, 3, [4, 5]] 7 7`',
            whyRightOrWrong:
              'Sai! Theo quy ước thiết kế của Python, các phương thức đột biến tại chỗ (`append`, `extend`, `sort`, `reverse`) luôn trả về `None` để nhắc nhở dev rằng đối tượng gốc đã bị sửa.',
          },
          {
            id: 'opt-c',
            text: '`5 7 7` (trả về độ dài mới giống `Array.prototype.push` của JS)',
            whyRightOrWrong:
              'Sai! `list.append()` trả về `None`, không trả về độ dài mảng như JS.',
          },
          {
            id: 'opt-d',
            text: '`None 7 7`',
            whyRightOrWrong:
              'Sai! `.append([4, 5])` chỉ thêm 1 phần tử duy nhất là list con `[4, 5]`, nên tổng độ dài là `3 + 1 + 2 = 6`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Đừng bao giờ viết `nums = nums.append(x)` hoặc `nums = nums.sort()` trong Python vì biến `nums` sẽ lập tức biến thành `None`! Nếu muốn tạo danh sách mới đã sắp xếp mà giữ nguyên bản gốc, hãy dùng hàm `sorted(nums)`.',
        relatedTermIds: ['type-list', 'kw-none'],
      },
      {
        id: 'q-fb-7',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Tại sao hai câu lệnh nhìn tưởng giống hệt nhau là `b += [4]` và `b = b + [4]` lại cho kết quả KHÁC NHAU hoàn toàn khi có biến khác cùng tham chiếu tới danh sách đó?',
        codeSnippet: `a = [1, 2, 3]\nb = a\nb += [4]       # Bước 1\n\nx = [1, 2, 3]\ny = x\ny = y + [4]    # Bước 2\n\nprint(a, x)`,
        options: [
          {
            id: 'opt-a',
            text: '`[1, 2, 3, 4] [1, 2, 3]` — Với `list`, toán tử `+=` gọi `__iadd__` (tương đương `.extend()`, sửa trực tiếp tại chỗ nên `a` đổi theo); còn `y = y + [4]` gọi `__add__` tạo ra một `list` MỚI hoàn toàn nên `x` giữ nguyên!',
            whyRightOrWrong:
              'Chính xác 100%! Đây là khác biệt tinh tế nhưng cực kỳ quan trọng giữa Augmented Assignment `+=` (`__iadd__` in-place mutation trên đối tượng khả biến) và phép cộng `+` (`__add__` tạo đối tượng mới).',
          },
          {
            id: 'opt-b',
            text: '`[1, 2, 3] [1, 2, 3]` vì `b += [4]` luôn viết tắt cho `b = b + [4]`',
            whyRightOrWrong:
              'Sai! Trong Python, `b += [4]` KHÔNG giống `b = b + [4]` đối với kiểu khả biến (`list`). Nó ưu tiên gọi phương thức đột biến tại chỗ `__iadd__`.',
          },
          {
            id: 'opt-c',
            text: '`[1, 2, 3, 4] [1, 2, 3, 4]`',
            whyRightOrWrong:
              'Sai! Ở Bước 2, `y + [4]` tạo ra một danh sách mới trong RAM và dán nhãn `y` sang đó, nên `x` vẫn trỏ về `[1, 2, 3]`.',
          },
          {
            id: 'opt-d',
            text: '`[1, 2, 3] [1, 2, 3, 4]`',
            whyRightOrWrong:
              'Sai! Ngược lại hoàn toàn.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Với kiểu bất biến (`int`, `str`, `tuple`), `+=` không có `__iadd__` nên tạo đối tượng mới. Nhưng với kiểu khả biến (`list`), `+=` gọi `list.__iadd__` (hoạt động y hệt `.extend()`), làm thay đổi trực tiếp danh sách gốc đang được chia sẻ!',
        relatedTermIds: ['type-list', 'concept-pass-by-object-ref'],
      },
      {
        id: 'q-fb-8',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Chuyện gì xảy ra khi bạn dùng cú pháp Slicing `s[start:stop:step]` với chỉ số vượt quá độ dài danh sách hoặc bước nhảy âm?',
        codeSnippet: `text = "Python"\nprint(text[::-1], repr(text[100:200]))`,
        options: [
          {
            id: 'opt-a',
            text: "`nohtyP ''` — `text[::-1]` đảo ngược chuỗi, và Slicing với chỉ số vượt biên `text[100:200]` KHÔNG bao giờ ném `IndexError` mà trả về chuỗi rỗng `''` an toàn!",
            whyRightOrWrong:
              'Chính xác! Truy cập trực tiếp 1 phần tử `text[100]` sẽ ném `IndexError`, nhưng cắt lát `text[100:200]` tự động giới hạn (clamp) về biên hợp lệ và trả về chuỗi/danh sách rỗng.',
          },
          {
            id: 'opt-b',
            text: 'Ném lỗi `IndexError: string index out of range` ở `text[100:200]`',
            whyRightOrWrong:
              'Sai! Slicing trong Python không bao giờ ném `IndexError` dù chỉ số lớn đến đâu.',
          },
          {
            id: 'opt-c',
            text: "`Python ''`",
            whyRightOrWrong:
              'Sai! Bước nhảy `step = -1` trong `text[::-1]` duyệt ngược từ cuối về đầu nên tạo ra chuỗi đảo ngược `"nohtyP"`.',
          },
          {
            id: 'opt-d',
            text: '`nohtyP None`',
            whyRightOrWrong:
              'Sai! Cắt chuỗi luôn trả về một đối tượng `str` (ở đây là chuỗi rỗng `\'\'`), không trả về `None`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mẹo thực chiến: Thay vì kiểm tra `if len(items) > 0: first = items[0]`, đôi khi bạn có thể dùng Slicing `top_5 = items[:5]` mà không bao giờ sợ lỗi `IndexError` kể cả khi danh sách chỉ có 2 phần tử hoặc rỗng.',
        relatedTermIds: ['concept-slicing', 'type-str', 'type-list'],
      },
      {
        id: 'q-fb-9',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Kết quả của phép giải nén có dấu sao (Starred Unpacking - PEP 3132) dưới đây là gì?',
        codeSnippet: `first, *middle, last = [10, 20]\nprint(first, middle, last)`,
        options: [
          {
            id: 'opt-a',
            text: '`10 [] 20` — Biến có dấu `*` luôn gom phần còn dư thành một `list` (và sẽ là danh sách rỗng `[]` nếu không còn phần tử nào ở giữa!)',
            whyRightOrWrong:
              'Chính xác! `first` lấy `10`, `last` lấy `20`, và `*middle` hứng phần ở giữa thành `[]` (luôn là kiểu `list`, kể cả khi vế phải là `tuple` hay `set`).',
          },
          {
            id: 'opt-b',
            text: 'Ném lỗi `ValueError: not enough values to unpack (expected at least 3, got 2)`',
            whyRightOrWrong:
              'Sai! Chỉ cần tối thiểu 2 phần tử cho `first` và `last`, còn `*middle` có thể nhận 0 phần tử (`[]`).',
          },
          {
            id: 'opt-c',
            text: '`10 None 20`',
            whyRightOrWrong:
              'Sai! Biến gắn `*` luôn trả về một `list` (ở đây là `[]`), không bao giờ là `None`.',
          },
          {
            id: 'opt-d',
            text: '`10 ( ) 20` (kiểu `tuple` rỗng)',
            whyRightOrWrong:
              'Sai! Kết quả gom của `*middle` luôn luôn là kiểu `list`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Starred Unpacking `head, *tail = items` hoặc `first, *_, last = items` giúp bóc tách phần tử đầu/cuối cực kỳ gọn gàng và an toàn hơn việc dùng chỉ số thủ công.',
        relatedTermIds: ['concept-unpacking', 'type-list'],
      },
      {
        id: 'q-fb-10',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Khi làm việc với `dict`, sự khác biệt giữa `d["role"]`, `d.get("role", "guest")` và `d.setdefault("role", "guest")` khi khóa `"role"` CHƯA tồn tại trong `d = {}` là gì?',
        codeSnippet: `d = {}\na = d.get("role", "guest")\nb = "role" in d\nc = d.setdefault("role", "guest")\nd_after = "role" in d\nprint(a, b, c, d_after)`,
        options: [
          {
            id: 'opt-a',
            text: '`guest False guest True` — `d.get()` chỉ đọc và trả về giá trị mặc định mà KHÔNG sửa `d`; còn `d.setdefault()` vừa trả về `"guest"` vừa CHÈN luôn `"role": "guest"` vào trong `d`!',
            whyRightOrWrong:
              'Chính xác! `d["role"]` sẽ ném `KeyError` (khác với JS trả về `undefined`). `d.get()` đọc an toàn không đột biến dict. Còn `d.setdefault()` sẽ khởi tạo khóa đó vào dict nếu chưa có.',
          },
          {
            id: 'opt-b',
            text: '`guest True guest True`',
            whyRightOrWrong:
              'Sai! `d.get("role", "guest")` hoàn toàn không ghi gì vào `d`, nên `b` là `False`.',
          },
          {
            id: 'opt-c',
            text: '`None False guest False`',
            whyRightOrWrong:
              'Sai! Khi truyền đối số thứ 2 cho `.get("role", "guest")`, nó trả về `"guest"` thay vì `None`.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `KeyError` ngay ở dòng `d.get("role", "guest")`',
            whyRightOrWrong:
              'Sai! Chính `.get()` sinh ra để tránh lỗi `KeyError` của `d["role"]`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Trong JavaScript `obj.missing` trả về `undefined`, nhưng trong Python `d["missing"]` ném thẳng `KeyError`! Hãy dùng `d.get(key, default)` khi đọc dữ liệu tùy chọn, hoặc `collections.defaultdict(list)` khi gom nhóm phần tử.',
        relatedTermIds: ['type-dict', 'kw-in'],
      },
      {
        id: 'q-fb-11',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Một lập trình viên muốn tạo một `set` rỗng và một `dict` bằng Comprehension như dưới đây. Kết quả in ra là gì?',
        codeSnippet: `empty = {}\ns = {x % 3 for x in [1, 2, 4, 5, 7]}\nprint(type(empty).__name__, type(s).__name__, len(s))`,
        options: [
          {
            id: 'opt-a',
            text: '`dict set 2` — Vì `{}` rỗng luôn là `dict` (muốn tạo set rỗng phải viết `set()`), và Set Comprehension `{x % 3 ...}` tự động khử trùng lặp chỉ còn `{1, 2}`!',
            whyRightOrWrong:
              'Chính xác! Các phép chia dư cho 3 của `[1, 2, 4, 5, 7]` lần lượt là `1, 2, 1, 2, 1`. Vì `set` chỉ giữ các phần tử duy nhất nên chỉ còn `{1, 2}` (`len(s) == 2`).',
          },
          {
            id: 'opt-b',
            text: '`set set 5`',
            whyRightOrWrong:
              'Sai! Cặp ngoặc nhọn rỗng `{}` trong Python là một `dict` rỗng (do lý do lịch sử `dict` có trước `set`), và `set` luôn tự động loại bỏ các giá trị trùng nhau.',
          },
          {
            id: 'opt-c',
            text: '`dict dict 2`',
            whyRightOrWrong:
              'Sai! Khi bên trong `{...}` không có dấu hai chấm `key: value` mà chỉ có biểu thức đơn `{x % 3 for x in ...}`, đó là **Set Comprehension** tạo ra kiểu `set`.',
          },
          {
            id: 'opt-d',
            text: '`dict set 5`',
            whyRightOrWrong:
              'Sai! `set` không chứa phần tử trùng lặp nên `{1, 2, 1, 2, 1}` rút gọn còn 2 phần tử.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Nhớ kỹ 3 điểm về `set`: (1) Tạo set rỗng bắt buộc dùng `set()`, không dùng `{}`; (2) Kiểm tra `x in my_set` có độ phức tạp `O(1)` nhờ bảng băm (nhanh hơn `x in my_list` `O(n)` hàng nghìn lần); (3) `set` không bảo toàn thứ tự chèn như `dict` (Python 3.7+ đảm bảo `dict` giữ thứ tự chèn, còn `set` thì không!).',
        relatedTermIds: ['type-set', 'type-dict', 'concept-comprehension'],
      },
      {
        id: 'q-fb-12',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Hàm `zip(users, scores)` mặc định xử lý thế nào khi hai danh sách có độ dài lệch nhau, và tham số `strict=True` (Python 3.10+) giúp ích gì?',
        codeSnippet: `users = ["An", "Bình", "Chi"]\nscores = [95, 88]\nprint(list(zip(users, scores)))`,
        options: [
          {
            id: 'opt-a',
            text: 'In ra `[(\'An\', 95), (\'Bình\', 88)]` — Mặc định `zip()` âm thầm cắt cụt theo danh sách NGẮN NHẤT (`"Chi"` bị mất dấu!); thêm `strict=True` sẽ ném `ValueError` ngay nếu độ dài không khớp.',
            whyRightOrWrong:
              'Chính xác! Việc `zip()` âm thầm bỏ qua phần tử thừa ở danh sách dài hơn là nguyên nhân gây mất dữ liệu ngầm trong thực tế. Do đó trong code Backend/Data, hãy ưu tiên `zip(a, b, strict=True)`.',
          },
          {
            id: 'opt-b',
            text: 'In ra `[(\'An\', 95), (\'Bình\', 88), (\'Chi\', None)]`',
            whyRightOrWrong:
              'Sai! Đó là hành vi của `itertools.zip_longest(users, scores, fillvalue=None)`, không phải `zip()` mặc định.',
          },
          {
            id: 'opt-c',
            text: 'Mặc định ném lỗi `ValueError` vì độ dài 3 và 2 không bằng nhau',
            whyRightOrWrong:
              'Sai! Mặc định `zip()` không báo lỗi mà dừng ngay khi 1 trong các iterable cạn kiệt.',
          },
          {
            id: 'opt-d',
            text: 'Trả về một `dict` `{"An": 95, "Bình": 88}`',
            whyRightOrWrong:
              'Sai! `zip()` trả về một iterator gồm các `tuple` `(user, score)`. Muốn thành `dict` phải bọc `dict(zip(users, scores))`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Luôn bật `zip(a, b, strict=True)` khi hai danh sách về mặt logic bắt buộc phải có số phần tử bằng nhau để phát hiện lỗi lệch dữ liệu sớm nhất.',
        relatedTermIds: ['type-tuple', 'type-list'],
      },
      {
        id: 'q-fb-13',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Cặp hàm tích hợp `any()` và `all()` hoạt động như thế nào khi truyền vào một danh sách RỖNG `[]`?',
        codeSnippet: `empty_ validations = []\nprint(all(empty_validations), any(empty_validations))`,
        options: [
          {
            id: 'opt-a',
            text: '`True False` — Vì theo logic toán học (Vacuous Truth), `all([])` tìm xem "có phần tử nào Sai không" (không có -> `True`), còn `any([])` tìm xem "có phần tử nào Đúng không" (không có -> `False`)!',
            whyRightOrWrong:
              'Chính xác! Đây là hành vi chuẩn mực của đại số Boole (giống `[].every(...) === true` và `[].some(...) === false` trong JavaScript), nhưng rất dễ gây bug nếu kiểm tra `if all(permissions):` trên một mảng quyền rỗng!',
          },
          {
            id: 'opt-b',
            text: '`False False` vì danh sách rỗng là Falsy',
            whyRightOrWrong:
              'Sai! `bool([])` là `False`, nhưng `all([])` trả về `True`!',
          },
          {
            id: 'opt-c',
            text: '`True True`',
            whyRightOrWrong:
              'Sai! `any([])` trả về `False` vì không có phần tử nào thỏa mãn.',
          },
          {
            id: 'opt-d',
            text: '`False True`',
            whyRightOrWrong:
              'Sai! Ngược lại hoàn toàn.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Cảnh báo bảo mật thực tế: Nếu bạn viết `if all(check(x) for x in items): grant_access()`, hãy đảm bảo `items` không rỗng (`if items and all(...):`), nếu không một danh sách rỗng `items = []` sẽ được `all([])` cho qua với kết quả `True`!',
        relatedTermIds: ['type-bool', 'type-list'],
      },
      {
        id: 'q-fb-14',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Tại sao khi đọc/ghi file trong Python, ta luôn phải dùng khối `with open("data.txt", encoding="utf-8") as f:` thay vì gọi `f = open(...)` và `f.close()` thủ công?',
        options: [
          {
            id: 'opt-a',
            text: 'Vì khối `with` (Context Manager) kích hoạt `__enter__` và cam kết luôn gọi `__exit__` để đóng file (`f.close()`) NGAY LẬP TỨC khi thoát khỏi khối — kể cả khi code bên trong ném ra Exception hay `return` sớm!',
            whyRightOrWrong:
              'Chính xác! Nếu không dùng `with` mà có lỗi xảy ra giữa chừng, lệnh `f.close()` phía dưới không bao giờ được chạy, gây rò rỉ File Descriptor của hệ điều hành hoặc dữ liệu trong buffer chưa được flush xuống ổ cứng.',
          },
          {
            id: 'opt-b',
            text: 'Vì Python cấm gọi hàm `open()` bên ngoài câu lệnh `with`',
            whyRightOrWrong:
              'Sai! `open()` vẫn gọi riêng được nhưng rất nguy hiểm nếu quên `try...finally: f.close()`.',
          },
          {
            id: 'opt-c',
            text: 'Vì biến `f` chỉ tồn tại bên trong khối `with` và bị xóa khỏi scope sau khi thoát khối `with`',
            whyRightOrWrong:
              'Sai! Khối `with` KHÔNG tạo scope mới — biến `f` vẫn tồn tại sau khối `with`, nhưng trạng thái của nó đã bị đóng (`f.closed == True`).',
          },
          {
            id: 'opt-d',
            text: 'Vì `with open(...)` tự động đọc toàn bộ file vào bộ nhớ nhanh gấp đôi',
            whyRightOrWrong:
              'Sai! `with` quản lý vòng đời đóng/mở tài nguyên, không làm thay đổi tốc độ đọc ổ cứng.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Luôn dùng `with open(path, encoding="utf-8") as f:` (hoặc `pathlib.Path(path).read_text(encoding="utf-8")`) để đảm bảo an toàn tài nguyên và đồng nhất bảng mã UTF-8 trên cả Windows, macOS và Linux.',
        relatedTermIds: ['kw-with', 'concept-context-manager', 'dunder-enter'],
      },
    ],
  },
  {
    id: 'exam-brain-teasers',
    title: 'Đề 3: Đấu trường Giải đố Python (Brain Teasers & Output Puzzles)',
    description:
      '14 câu đố Output kinh điển từng đánh bại cả những lập trình viên kỳ cựu: Bẫy nhân ma trận, Late-Binding Closure, Nghịch lý Tuple +=, Hash Collision True == 1 == 1.0, Finally đè Return và Banker\'s Rounding.',
    targetLevel: 'advanced',
    targetStage: 'stage-2',
    durationMinutes: 25,
    passingScorePercent: 75,
    questions: [
      {
        id: 'q-bt-1',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Đoạn code khởi tạo bàn cờ Caro 3x3 bằng toán tử nhân danh sách `*` dưới đây sẽ in ra kết quả gì?',
        codeSnippet: `board = [[0] * 3] * 3\nboard[0][0] = 1\nprint(board)`,
        options: [
          {
            id: 'opt-a',
            text: '`[[1, 0, 0], [0, 0, 0], [0, 0, 0]]`',
            whyRightOrWrong:
              'Sai! Đây là cái bẫy kinh điển nhất khi khởi tạo mảng 2 chiều trong Python!',
          },
          {
            id: 'opt-b',
            text: '`[[1, 0, 0], [1, 0, 0], [1, 0, 0]]` — Vì `* 3` bên ngoài KHÔNG nhân bản 3 danh sách mới mà tạo 3 tham chiếu cùng trỏ vào ĐÚNG 1 danh sách hàng ngang duy nhất!',
            whyRightOrWrong:
              'Chính xác! `board[0] is board[1] is board[2]` là `True`! Khi sửa `board[0][0] = 1`, cả 3 hàng đều bị đổi phần tử đầu thành `1`.',
          },
          {
            id: 'opt-c',
            text: '`[[1, 1, 1], [0, 0, 0], [0, 0, 0]]`',
            whyRightOrWrong:
              'Sai! `[0] * 3` bên trong chứa số nguyên `0` bất biến nên các cột trong cùng 1 hàng là độc lập, nhưng 3 hàng lại là cùng 1 đối tượng `list`.',
          },
          {
            id: 'opt-d',
            text: '`[[1, 1, 1], [1, 1, 1], [1, 1, 1]]`',
            whyRightOrWrong:
              'Sai! Chỉ cột `0` của 3 hàng bị đổi thành `1`.',
          },
        ],
        correctOptionId: 'opt-b',
        overallExplanation:
          'Để khởi tạo ma trận 2 chiều an toàn, BẮT BUỘC dùng List Comprehension: `board = [[0] * 3 for _ in range(3)]` để mỗi vòng lặp tạo một đối tượng `list` hàng mới hoàn toàn.',
        analogyReminder:
          'Toán tử `* 3` trên list con giống như gắn 3 chiếc gương chiếu vào cùng 1 hàng ghế.',
        relatedTermIds: ['type-list', 'concept-pass-by-object-ref', 'concept-comprehension'],
      },
      {
        id: 'q-bt-2',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Đoạn code tạo danh sách các hàm `lambda` trong vòng lặp dưới đây sẽ in ra kết quả gì?',
        codeSnippet: `funcs = [lambda x: x + i for i in range(3)]\nprint([f(10) for f in funcs])`,
        options: [
          {
            id: 'opt-a',
            text: '`[10, 11, 12]`',
            whyRightOrWrong:
              'Sai! Khác với `let i` trong vòng lặp `for` của JavaScript ES6, Closure trong Python tra cứu biến `i` theo cơ chế **Late Binding** (chỉ tìm giá trị của `i` tại thời điểm hàm `f(10)` ĐƯỢC GỌI)!',
          },
          {
            id: 'opt-b',
            text: '`[12, 12, 12]` — Vì cả 3 hàm `lambda` cùng tham chiếu tới biến `i` của scopecomprehension, và khi vòng lặp kết thúc thì `i` đang dừng ở giá trị cuối cùng là `2`!',
            whyRightOrWrong:
              'Chính xác! Lúc gọi `f(10)`, vòng lặp `range(3)` đã chạy xong từ lâu với `i = 2`, nên cả 3 hàm đều tính `10 + 2 = 12`.',
          },
          {
            id: 'opt-c',
            text: '`[10, 10, 10]`',
            whyRightOrWrong:
              'Sai! Giá trị cuối cùng của `i` trong `range(3)` là `2`, không phải `0`.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `NameError: name \'i\' is not defined` khi gọi `f(10)`',
            whyRightOrWrong:
              'Sai! Biến `i` được giữ sống trong ô nhớ Closure (`f.__closure__`) của các hàm `lambda`.',
          },
        ],
        correctOptionId: 'opt-b',
        overallExplanation:
          'Để "đóng băng" giá trị `i` ngay tại thời điểm tạo hàm (Early Binding), hãy truyền `i` làm tham số mặc định của lambda: `funcs = [lambda x, i=i: x + i for i in range(3)]` (vì tham số mặc định được đánh giá ngay lúc định nghĩa hàm!).',
        relatedTermIds: ['concept-closure', 'kw-lambda', 'concept-comprehension'],
      },
      {
        id: 'q-bt-3',
        stageId: 'stage-1',
        level: 'advanced',
        question:
          'Nghịch lý nổi tiếng nhất trong tài liệu chính thức của Python: Điều gì xảy ra khi thực thi đoạn code dưới đây?',
        codeSnippet: `t = (1, [10, 20])\ntry:\n    t[1] += [30]\nexcept TypeError:\n    pass\nprint(t)`,
        options: [
          {
            id: 'opt-a',
            text: 'In ra `(1, [10, 20, 30])` — Dòng `t[1] += [30]` VỪA ném ra lỗi `TypeError`, NHƯNG VẪN cập nhật thành công danh sách bên trong thành `[10, 20, 30]`!',
            whyRightOrWrong:
              'Chính xác 100%! Bytecode của `t[1] += [30]` thực hiện 2 bước: (1) Gọi `list.__iadd__` nối thêm `30` trực tiếp vào list `[10, 20]` (thành công ngay lập tức!); (2) Cố gắng gán lại kết quả vào `t[1] = ...` thì bị `tuple` chặn lại và ném `TypeError`!',
          },
          {
            id: 'opt-b',
            text: 'In ra `(1, [10, 20])` vì đã ném lỗi `TypeError` thì dữ liệu không thể bị thay đổi',
            whyRightOrWrong:
              'Sai! Bước 1 (`INPLACE_ADD` / `__iadd__`) đã đột biến xong chiếc `list` trong RAM trước khi Bước 2 (`STORE_SUBSCR` vào `tuple`) phát hiện lỗi và ném `TypeError`!',
          },
          {
            id: 'opt-c',
            text: 'In ra `(1, [10, 20, 30])` và KHÔNG HỀ ném ra lỗi `TypeError` nào cả',
            whyRightOrWrong:
              'Sai! Toán tử `+=` luôn thực hiện lệnh gán ngược lại vào `t[1]` ở cuối, nên `tuple` chắc chắn ném `TypeError: \'tuple\' object does not support item assignment`.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `IndexError` không bắt được bởi `except TypeError`',
            whyRightOrWrong:
              'Sai! Lỗi ném ra đúng là `TypeError`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Bài học từ Python Official FAQ: (1) Tránh đặt đối tượng khả biến (`list`) bên trong `tuple`; (2) Nếu bắt buộc phải sửa list bên trong tuple, hãy viết `t[1].extend([30])` (không gán lại vào `t[1]` nên không ném lỗi) thay vì `t[1] += [30]`.',
        relatedTermIds: ['type-tuple', 'type-list', 'concept-pass-by-object-ref'],
      },
      {
        id: 'q-bt-4',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Bẫy đánh giá lười (Lazy Evaluation) của Generator Expression: Đoạn code dưới đây sẽ in ra kết quả gì?',
        codeSnippet: `allowed = [10, 20]\ngen = (x for x in [10, 20, 30] if x in allowed)\nallowed = [20, 30]\nprint(list(gen))`,
        options: [
          {
            id: 'opt-a',
            text: '`[20, 30]` — Vì trong `(x for x in [10, 20, 30] if x in allowed)`, danh sách nguồn `[10, 20, 30]` được đánh giá NGAY LẬP TỨC lúc tạo generator, nhưng phần điều kiện `if x in allowed` lại được đánh giá LƯỜI lúc gọi `list(gen)` (khi `allowed` đã đổi thành `[20, 30]`)!',
            whyRightOrWrong:
              'Chính xác! Trong Generator Expression, duy nhất biểu thức iterable đầu tiên (`in [10, 20, 30]`) được tính ngay lúc khai báo; còn thân biểu thức và mệnh đề `if x in allowed` chỉ chạy khi từng phần tử được kéo ra ở dòng `list(gen)`.',
          },
          {
            id: 'opt-b',
            text: '`[10, 20]` vì `gen` đã được định nghĩa trước khi biến `allowed` thay đổi',
            whyRightOrWrong:
              'Sai! `gen` chưa hề chạy một bước lặp nào cho đến khi gặp lệnh `list(gen)`. Lúc đó nó mới tra cứu biến `allowed` hiện tại là `[20, 30]`.',
          },
          {
            id: 'opt-c',
            text: '`[10, 20, 30]`',
            whyRightOrWrong:
              'Sai! Số `10` không nằm trong `allowed` mới (`[20, 30]`) nên bị loại.',
          },
          {
            id: 'opt-d',
            text: '`[]` (danh sách rỗng)',
            whyRightOrWrong:
              'Sai! `gen` mới được tiêu thụ lần đầu tiên tại `list(gen)`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Hiểu rõ thời điểm đánh giá của Generator giúp bạn tránh được những bug cực kỳ khó hiểu khi biến ngoài bị thay đổi giữa lúc khởi tạo Generator và lúc thực sự duyệt qua nó.',
        relatedTermIds: ['concept-generator', 'concept-comprehension'],
      },
      {
        id: 'q-bt-5',
        stageId: 'stage-1',
        level: 'advanced',
        question:
          'Câu đố kinh điển về mối quan hệ giữa `bool`, `int`, `float` và bảng băm của `dict`: Đoạn code dưới đây in ra gì?',
        codeSnippet: `d = {True: "yes", 1: "one", 1.0: "float_one"}\nprint(d, isinstance(True, int), True + True)`,
        options: [
          {
            id: 'opt-a',
            text: '`{True: \'float_one\'} True 2` — Trong Python, `bool` là lớp con (subclass) của `int` (`True == 1 == 1.0` và `hash(True) == hash(1) == hash(1.0)`), nên `dict` coi cả 3 là CÙNG MỘT KHÓA: giữ nguyên key đầu tiên `True` và ghi đè value thành `"float_one"`!',
            whyRightOrWrong:
              'Chính xác tuyệt đối! Khi chèn key mới có cùng mã băm và `==` với key cũ (`1 == True` và `1.0 == True`), Python `dict` KHÔNG thay thế đối tượng key đầu tiên (`True`), mà chỉ cập nhật value mới nhất (`"float_one"`).',
          },
          {
            id: 'opt-b',
            text: '`{1.0: \'float_one\'} True 2` (ghi đè cả key lẫn value)',
            whyRightOrWrong:
              'Sai! Đây là chi tiết cực kỳ thú vị của CPython `dict`: khi key mới bằng (`==`) key đã tồn tại, `dict` giữ lại đối tượng key ban đầu (`True`) và chỉ ghi đè phần `value`!',
          },
          {
            id: 'opt-c',
            text: '`{True: \'yes\', 1: \'one\', 1.0: \'float_one\'} False 2`',
            whyRightOrWrong:
              'Sai! Trong Python, `issubclass(bool, int)` là `True`, và `True == 1 == 1.0` là `True`, nên chúng đụng độ thành 1 key duy nhất.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `TypeError` khi cộng `True + True`',
            whyRightOrWrong:
              'Sai! Vì `bool` kế thừa từ `int` (`True` có giá trị `1`, `False` là `0`), bạn thậm chí có thể dùng `sum([True, False, True]) == 2` để đếm số lượng điều kiện đúng!',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mẹo ứng dụng thực tế: Vì `True == 1` và `False == 0`, bạn có thể đếm nhanh số phần tử thỏa mãn điều kiện bằng `count = sum(x > 0 for x in nums)` cực kỳ ngắn gọn!',
        relatedTermIds: ['type-bool', 'type-int', 'type-dict', 'dunder-eq'],
      },
      {
        id: 'q-bt-6',
        stageId: 'stage-1',
        level: 'basic',
        question:
          'Chuyện gì xảy ra khi bạn vừa lặp qua một danh sách bằng `for`, vừa xóa phần tử khỏi chính danh sách đó bằng `.remove()`?',
        codeSnippet: `nums = [2, 4, 5, 6]\nfor x in nums:\n    if x % 2 == 0:\n        nums.remove(x)\nprint(nums)`,
        options: [
          {
            id: 'opt-a',
            text: '`[4, 5]` — Khi xóa `2` ở index `0`, phần tử `4` bị dồn sang trái về index `0`, trong khi con trỏ vòng lặp bước sang index `1` (chứa số `5`), khiến số `4` bị BỎ SÓT không bao giờ được kiểm tra!',
            whyRightOrWrong:
              'Chính xác! Đây là hậu quả của việc đột biến kích thước danh sách ngay trong lúc Iterator đang dịch chuyển chỉ số nội bộ `0 -> 1 -> 2`.',
          },
          {
            id: 'opt-b',
            text: '`[5]` như ý định lọc bỏ toàn bộ số chẵn',
            whyRightOrWrong:
              'Sai! Số `4` đã bị nhảy cóc qua ngay sau khi số `2` bị xóa.',
          },
          {
            id: 'opt-c',
            text: 'Ném lỗi `RuntimeError: list changed size during iteration` giống như `dict` hay `set`',
            whyRightOrWrong:
              'Sai! `dict` và `set` sẽ ném `RuntimeError` nếu thay đổi kích thước khi đang lặp, nhưng `list` lại KHÔNG ném lỗi mà âm thầm nhảy cóc phần tử — nguy hiểm hơn nhiều!',
          },
          {
            id: 'opt-d',
            text: '`[2, 5]`',
            whyRightOrWrong:
              'Sai! Phần tử đầu tiên `2` được kiểm tra ở index `0` và bị xóa trước tiên.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Quy tắc bất di bất dịch: KHÔNG BAO GIỜ thêm/xóa phần tử trực tiếp trên danh sách đang lặp. Hãy dùng List Comprehension để lọc mới `nums = [x for x in nums if x % 2 != 0]` hoặc lặp trên bản sao `for x in nums[:]:`.',
        relatedTermIds: ['type-list', 'kw-for', 'concept-comprehension'],
      },
      {
        id: 'q-bt-7',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Đoạn code OOP khai báo thuộc tính `roles = []` ở cấp Class thay vì trong `__init__` dưới đây sẽ in ra kết quả gì?',
        codeSnippet: `class User:\n    roles = []\n    def __init__(self, name: str):\n        self.name = name\n\nu1 = User("An")\nu2 = User("Bình")\nu1.roles.append("admin")\nprint(u2.roles, u1.roles is User.roles)`,
        options: [
          {
            id: 'opt-a',
            text: "`['admin'] True` — Vì `roles = []` được khai báo ở cấp Class (Class Attribute), nên cả `u1` và `u2` đều dùng chung ĐÚNG MỘT danh sách `User.roles`!",
            whyRightOrWrong:
              'Chính xác! Khi gọi `u1.roles.append("admin")`, Python không tìm thấy `roles` trong `u1.__dict__` nên tìm lên `User.roles` và đột biến danh sách dùng chung đó, làm mọi user khác trong hệ thống đều trở thành `"admin"`!',
          },
          {
            id: 'opt-b',
            text: '`[] False` (giống thuộc tính khai báo trong class của TypeScript/Java/C#)',
            whyRightOrWrong:
              'Sai! Trong TS/Java/C#, khai báo `roles = []` trong thân class sẽ tạo biến riêng cho từng instance; nhưng trong Python, mọi biến khai báo trực tiếp trong thân `class` đều là **Class Variable** (tương đương `static` dùng chung)!',
          },
          {
            id: 'opt-c',
            text: 'Ném lỗi `AttributeError` vì truy cập `self.roles` mà chưa khai báo trong `__init__`',
            whyRightOrWrong:
              'Sai! Python tự động tìm thuộc tính theo thứ tự `instance.__dict__` -> `Class.__dict__`.',
          },
          {
            id: 'opt-d',
            text: "`['admin'] False`",
            whyRightOrWrong:
              'Sai! `.append()` đột biến trực tiếp `User.roles` nên `u1.roles is User.roles` là `True`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Đối với lập trình viên từ TS/Java/C# sang Python: Mọi thuộc tính khả biến riêng của từng đối tượng BẮT BUỘC phải được khởi tạo bên trong `__init__` (`self.roles = []`) hoặc dùng `@dataclass` với `field(default_factory=list)`.',
        relatedTermIds: ['kw-class', 'dunder-init', 'concept-dataclass'],
      },
      {
        id: 'q-bt-8',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Chuyện gì xảy ra khi cả khối `try` VÀ khối `finally` đều có câu lệnh `return`?',
        codeSnippet: `def tricky() -> int:\n    try:\n        return 1\n    finally:\n        return 2\n\nprint(tricky())`,
        options: [
          {
            id: 'opt-a',
            text: 'In ra `2` — Khối `finally` luôn luôn chạy trước khi hàm thực sự thoát, nên lệnh `return 2` trong `finally` sẽ GHI ĐÈ kết quả `return 1` (và thậm chí nuốt luôn cả mọi Exception chưa bắt trong `try`!)',
            whyRightOrWrong:
              'Chính xác! Đặt `return` (hoặc `break`/`continue`) trong `finally` là một anti-pattern cực kỳ nguy hiểm vì nó ghi đè giá trị trả về và làm biến mất hoàn toàn các Exception đang được ném ra từ khối `try`.',
          },
          {
            id: 'opt-b',
            text: 'In ra `1` vì `return 1` chạy trước và kết thúc hàm ngay lập tức',
            whyRightOrWrong:
              'Sai! Trước khi trả giá trị `1` ra ngoài, Python bắt buộc phải nhảy vào khối `finally`, tại đó `return 2` chiếm quyền trả về.',
          },
          {
            id: 'opt-c',
            text: 'Trả về một tuple `(1, 2)`',
            whyRightOrWrong:
              'Sai! Một hàm chỉ trả về 1 lần duy nhất.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `SyntaxError` vì không được viết `return` trong `finally`',
            whyRightOrWrong:
              'Sai! CPython cho phép về mặt cú pháp (dù Ruff linter sẽ cảnh báo lỗi `B012`).',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Tuyệt đối KHÔNG viết `return`, `break`, hoặc `continue` bên trong khối `finally`. Khối `finally` chỉ nên dùng thuần túy để giải phóng tài nguyên (đóng kết nối, xóa lock).',
        relatedTermIds: ['kw-try-except-finally', 'kw-return'],
      },
      {
        id: 'q-bt-9',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Khi truyền một Iterator/Generator làm giá trị mặc định của tham số hàm, đoạn code dưới đây sẽ in ra gì?',
        codeSnippet: `def next_id(gen=iter(range(100, 103))) -> int:\n    return next(gen, -1)\n\nprint(next_id(), next_id(), next_id(), next_id())`,
        options: [
          {
            id: 'opt-a',
            text: '`100 101 102 -1` — Vì `iter(range(100, 103))` chỉ được khởi tạo ĐÚNG 1 LẦN lúc định nghĩa hàm, nên mỗi lần gọi `next_id()` không truyền đối số sẽ tiếp tục rút phần tử kế tiếp từ cùng một Iterator đó cho đến khi cạn kiệt (`-1`)!',
            whyRightOrWrong:
              'Chính xác! Cũng giống như `list` mặc định, đối tượng Iterator trong tham số mặc định được giữ sống xuyên suốt các lần gọi hàm.',
          },
          {
            id: 'opt-b',
            text: '`100 100 100 100`',
            whyRightOrWrong:
              'Sai! `iter(range(...))` không được tạo lại ở mỗi lần gọi hàm mà chỉ tạo 1 lần lúc `def`.',
          },
          {
            id: 'opt-c',
            text: 'Ném lỗi `StopIteration` ở lần gọi thứ 4',
            whyRightOrWrong:
              'Sai! Hàm `next(gen, -1)` có truyền đối số thứ hai là giá trị mặc định `-1` nên khi cạn kiệt sẽ trả về `-1` thay vì ném `StopIteration`.',
          },
          {
            id: 'opt-d',
            text: '`-1 -1 -1 -1`',
            whyRightOrWrong:
              'Sai! Ba lần gọi đầu tiên lấy ra `100`, `101`, `102`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mọi biểu thức đặt ở vị trí tham số mặc định `def fn(x = expr):` đều được tính toán đúng 1 lần tại thời điểm nạp hàm (`define time`). Đồng thời, hãy nhớ mẹo `next(iterator, default_value)` để lấy phần tử kế tiếp mà không sợ văng lỗi `StopIteration`.',
        relatedTermIds: ['concept-mutable-default', 'dunder-iter', 'concept-generator'],
      },
      {
        id: 'q-bt-10',
        stageId: 'stage-1',
        level: 'advanced',
        question:
          'Câu đố thứ tự đánh giá phép gán giải nén (Tuple Unpacking Assignment Order): Đoạn code dưới đây sẽ in ra gì?',
        codeSnippet: `x = [10, 20]\ni = 0\ni, x[i] = 1, 99\nprint(i, x)`,
        options: [
          {
            id: 'opt-a',
            text: '`1 [10, 99]` — Vì Python đánh giá vế phải `(1, 99)` trước, sau đó gán vào vế trái TỪ TRÁI SANG PHẢI: đầu tiên gán `i = 1`, rồi mới gán `x[i] = 99` (tức `x[1] = 99` vì lúc này `i` đã bằng `1`!)',
            whyRightOrWrong:
              'Chính xác! Trong phép gán `target1, target2 = val1, val2`, Python thực hiện tuần tự `target1 = val1` rồi mới tới `target2 = val2`. Vì `i` đã bị đổi thành `1` ở bước đầu, nên `x[i]` trở thành `x[1] = 99`!',
          },
          {
            id: 'opt-b',
            text: '`1 [99, 20]` vì ban đầu `i` bằng `0`',
            whyRightOrWrong:
              'Sai! Chỉ số `i` trong `x[i]` ở vế trái chỉ được tính sau khi đích gán đứng trước nó (`i = 1`) đã hoàn tất!',
          },
          {
            id: 'opt-c',
            text: '`0 [99, 20]`',
            whyRightOrWrong:
              'Sai! Biến `i` chắc chắn được gán thành `1`.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `SyntaxError` vì không được vừa gán `i` vừa dùng `x[i]` trên cùng 1 dòng',
            whyRightOrWrong:
              'Sai! Cú pháp hợp lệ nhưng là một anti-pattern cần tuyệt đối tránh trong code thực tế.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Mặc dù `a, b = b, a` rất an toàn vì vế phải `(b, a)` được đóng gói trước hoàn toàn, nhưng ở VẾ TRÁI các đích gán được thực hiện tuần tự từ trái qua phải. Đừng bao giờ dùng biến vừa bị thay đổi ở đích thứ nhất làm chỉ số ở đích thứ hai trên cùng một dòng!',
        relatedTermIds: ['concept-unpacking', 'type-list'],
      },
      {
        id: 'q-bt-11',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Sự khác biệt về phạm vi biến (Scope) giữa biến lặp của List Comprehension và biến gán bằng Walrus Operator `:=` bên trong nó là gì?',
        codeSnippet: `x = "outside"\nres = [last := x for x in ["a", "b", "c"]]\nprint(x, last)`,
        options: [
          {
            id: 'opt-a',
            text: '`outside c` — Biến lặp `x` của List Comprehension có scope cục bộ riêng (không làm bẩn biến `x = "outside"` bên ngoài), NHƯNG biến `last := x` của Walrus Operator lại ĐƯỢC RÒ RỈ (leak) ra scope bao ngoài!',
            whyRightOrWrong:
              'Chính xác! Theo thiết kế của PEP 572, biến mục tiêu của `:=` bên trong Comprehension sẽ được gán thẳng vào scope bao ngoài (Enclosing/Local scope) để bạn có thể tái sử dụng kết quả sau khi Comprehension chạy xong!',
          },
          {
            id: 'opt-b',
            text: '`c c` (cả `x` và `last` đều ghi đè ra ngoài)',
            whyRightOrWrong:
              'Sai! Trong Python 3, biến lặp `for x in ...` của Comprehension có scope riêng biệt và không bao giờ ghi đè biến `x` bên ngoài.',
          },
          {
            id: 'opt-c',
            text: 'Ném lỗi `NameError: name \'last\' is not defined` ở dòng `print`',
            whyRightOrWrong:
              'Sai! Khác với biến lặp `x`, biến của toán tử `:=` cố tình được đẩy ra scope bao ngoài.',
          },
          {
            id: 'opt-d',
            text: '`outside a`',
            whyRightOrWrong:
              'Sai! Vòng lặp chạy qua `"a"`, `"b"`, `"c"` nên giá trị cuối cùng được gán cho `last` là `"c"`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Tính năng này rất hữu ích khi bạn muốn giữ lại phần tử khớp điều kiện hoặc trạng thái tính toán cuối cùng từ một Comprehension, nhưng hãy đặt tên biến `:=` rõ ràng để không vô tình ghi đè biến bên ngoài.',
        relatedTermIds: ['concept-comprehension'],
      },
      {
        id: 'q-bt-12',
        stageId: 'stage-1',
        level: 'advanced',
        question:
          'Tại sao trong CPython, biểu thức `a is b` với số nguyên nhỏ từ `-5` đến `256` luôn là `True`, nhưng với số lớn hoặc danh sách lại có thể là `False`?',
        codeSnippet: `x = 256\ny = int("256")\n\np = 100000\nq = int("100000")\nprint(x is y, p is q, p == q)`,
        options: [
          {
            id: 'opt-a',
            text: '`True False True` — CPython khởi tạo sẵn và tái sử dụng bộ nhớ đệm (Small Integer Caching) cho các số nguyên từ `-5` đến `256`; còn `int("100000")` lúc runtime tạo ra một đối tượng `int` mới ở địa chỉ RAM khác nên `p is q` là `False`!',
            whyRightOrWrong:
              'Chính xác! Đây là lý do tuyệt đối KHÔNG BAO GIỜ được dùng `is` để so sánh số (`int`, `float`) hay chuỗi (`str`) — hãy luôn dùng `==` (`p == q` luôn là `True`).',
          },
          {
            id: 'opt-b',
            text: '`True True True` vì mọi số nguyên có cùng giá trị đều có chung địa chỉ ô nhớ',
            whyRightOrWrong:
              'Sai! CPython chỉ cache sẵn mảng số nguyên nhỏ `[-5, 256]`. Các số lớn được tạo động lúc chạy (`int("100000")`) sẽ được cấp phát ô nhớ mới.',
          },
          {
            id: 'opt-c',
            text: '`False False True`',
            whyRightOrWrong:
              'Sai! Số `256` nằm trong vùng cache `[-5, 256]` của CPython nên `int("256")` trả về đúng đối tượng `256` có sẵn (`x is y` là `True`).',
          },
          {
            id: 'opt-d',
            text: '`True False False`',
            whyRightOrWrong:
              'Sai! Toán tử `==` so sánh giá trị toán học nên `p == q` chắc chắn là `True`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Small Integer Caching (`[-5, 256]`) và String Interning chỉ là cơ chế tối ưu hóa nội bộ của CPython. Trong code ứng dụng, luôn dùng `==` để so sánh giá trị và chỉ dùng `is` cho `None` (hoặc đối tượng Singleton).',
        relatedTermIds: ['kw-is', 'type-int', 'dunder-eq'],
      },
      {
        id: 'q-bt-13',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Trong đa kế thừa hình kim cương (Diamond Inheritance) dưới đây, lời gọi `super().ping()` bên trong lớp `B` sẽ nhảy tới phương thức `ping()` của lớp nào tiếp theo?',
        codeSnippet: `class A:\n    def ping(self) -> str:\n        return "A"\n\nclass B(A):\n    def ping(self) -> str:\n        return "B->" + super().ping()\n\nclass C(A):\n    def ping(self) -> str:\n        return "C->" + super().ping()\n\nclass D(B, C):\n    def ping(self) -> str:\n        return "D->" + super().ping()\n\nprint(D().ping())`,
        options: [
          {
            id: 'opt-a',
            text: 'In ra `"D->B->C->A"` — Vì `super()` trong Python KHÔNG có nghĩa là "gọi lớp cha trực tiếp của B (`A`)", mà là "gọi lớp ĐỨNG KẾ TIẾP trong danh sách MRO (`D.__mro__` là `[D, B, C, A, object]`)"!',
            whyRightOrWrong:
              'Chính xác 100%! Nhờ thuật toán C3 Linearization, MRO của `D(B, C)` là `D -> B -> C -> A`. Khi đang ở `B.ping()`, `super().ping()` tra bảng MRO của `self` (tức `D`) và gọi lớp đứng ngay sau `B` là `C` (dù `B` không hề kế thừa từ `C`!).',
          },
          {
            id: 'opt-b',
            text: 'In ra `"D->B->A"` vì cha trực tiếp của `B` là `A`',
            whyRightOrWrong:
              'Sai! Đó là cách hiểu nhầm phổ biến nhất về `super()`. Trong Python, `super()` hoạt động theo **Cooperative Multiple Inheritance** dựa trên `type(self).__mro__`.',
          },
          {
            id: 'opt-c',
            text: 'In ra `"D->B->A->C->A"` (gọi `A` hai lần)',
            whyRightOrWrong:
              'Sai! Chính thuật toán MRO C3 sinh ra để đảm bảo lớp đỉnh kim cương `A` chỉ được gọi đúng 1 lần duy nhất ở cuối chuỗi.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `TypeError` vì Python không cho phép đa kế thừa hình kim cương',
            whyRightOrWrong:
              'Sai! Python hỗ trợ đa kế thừa rất mạnh mẽ nhờ MRO.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Hãy nhớ khẩu quyết: Trong Python, `super()` không phải là "Parent Class", mà là **"Next in Line in MRO"** (người đứng kế tiếp trong hàng đợi `self.__class__.__mro__`). Bạn luôn có thể kiểm tra thứ tự này bằng `ClassName.mro()`.',
        relatedTermIds: ['concept-mro', 'kw-class'],
      },
      {
        id: 'q-bt-14',
        stageId: 'stage-1',
        level: 'advanced',
        question:
          'Đoạn code làm tròn số bằng hàm `round()` tích hợp sẵn của Python 3 dưới đây sẽ in ra kết quả gì?',
        codeSnippet: `print(round(1.5), round(2.5), round(3.5), round(4.5))`,
        options: [
          {
            id: 'opt-a',
            text: '`2 2 4 4` — Python 3 áp dụng quy tắc **Banker\'s Rounding** (Round Half to Even): khi phần thập phân nằm chính giữa `.5`, nó luôn làm tròn về phía **số nguyên CHẴN** gần nhất!',
            whyRightOrWrong:
              'Chính xác! `1.5` và `2.5` cùng nằm cạnh số chẵn `2` nên đều làm tròn thành `2`. `3.5` và `4.5` cùng nằm cạnh số chẵn `4` nên đều làm tròn thành `4`! Quy tắc này giúp triệt tiêu độ lệch thống kê (statistical bias) khi cộng hàng triệu con số.',
          },
          {
            id: 'opt-b',
            text: '`2 3 4 5` (luôn làm tròn `.5` lên giống `Math.round` trong JS hoặc toán phổ thông)',
            whyRightOrWrong:
              'Sai! Python 3 đã bỏ quy tắc Round-Half-Up của Python 2 để chuyển sang chuẩn IEEE 754 Round-Half-To-Even.',
          },
          {
            id: 'opt-c',
            text: '`1 2 3 4` (luôn làm tròn xuống)',
            whyRightOrWrong:
              'Sai! `1.5` được làm tròn lên thành số chẵn `2`, và `3.5` được làm tròn lên thành số chẵn `4`.',
          },
          {
            id: 'opt-d',
            text: '`2.0 2.0 4.0 4.0` (trả về kiểu `float`)',
            whyRightOrWrong:
              'Sai! Khi gọi `round(x)` không truyền tham số thứ 2 (`ndigits`), nó trả về kiểu số nguyên `int`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Banker\'s Rounding (`round(2.5) == 2`, `round(3.5) == 4`) tránh việc tổng các số sau khi làm tròn bị phình to về một phía. Nếu nghiệp vụ kế toán yêu cầu bắt buộc `.5` luôn làm tròn lên (Round Half Up), hãy dùng `Decimal("2.5").quantize(Decimal("1"), rounding=ROUND_HALF_UP)`.',
        relatedTermIds: ['type-float', 'type-int'],
      },
    ],
  },
  {
    id: 'exam-advanced-mechanics',
    title: 'Đề 4: Cơ chế Chuyên sâu: OOP, Dunders, Generator, Decorator & Typing (Giai đoạn 2)',
    description:
      'Đánh giá sự thấu hiểu cơ chế bên dưới Python Giai đoạn 2: Generator/Iterator Protocol, `yield from`, `@functools.wraps`, Context Manager, Dunder Methods (`__repr__`, `__eq__`, `__hash__`, `__slots__`, `__call__`), Dataclasses và Hệ thống Kiểu tĩnh (`Protocol`, Generics).',
    targetLevel: 'advanced',
    targetStage: 'stage-2',
    durationMinutes: 25,
    passingScorePercent: 75,
    questions: [
      {
        id: 'q-adv-1',
        stageId: 'stage-2',
        level: 'advanced',
        question: 'Đoạn code sử dụng Generator Expression dưới đây sẽ in ra kết quả gì?',
        codeSnippet: `gen = (x * 10 for x in [1, 2, 3])\nfirst_sum = sum(gen)\nsecond_list = list(gen)\nprint(first_sum, second_list)`,
        options: [
          {
            id: 'opt-a',
            text: '`60 [10, 20, 30]`',
            whyRightOrWrong:
              'Sai! `gen` là một Generator (Iterator dùng 1 lần), không phải `list`!',
          },
          {
            id: 'opt-b',
            text: '`60 []` (vì Generator đã cạn kiệt sau khi hàm `sum()` duyệt qua lần đầu)',
            whyRightOrWrong:
              'Chính xác! Sau khi `sum(gen)` tiêu thụ hết các phần tử đến `StopIteration`, con trỏ của `gen` đã ở cuối nên `list(gen)` trả về mảng rỗng `[]`.',
          },
          {
            id: 'opt-c',
            text: 'Ném lỗi `StopIteration` ở dòng `list(gen)`',
            whyRightOrWrong:
              'Sai! Hàm `list()` tự động bắt `StopIteration` để kết thúc vòng lặp và trả về `[]`.',
          },
          {
            id: 'opt-d',
            text: '`0 [10, 20, 30]`',
            whyRightOrWrong:
              'Sai! `sum(gen)` chạy trước và tính ra `10 + 20 + 30 = 60`.',
          },
        ],
        correctOptionId: 'opt-b',
        overallExplanation:
          'Generator tiết kiệm RAM (`O(1)` bộ nhớ) nhờ sinh dữ liệu lười 1 chiều, nhưng chỉ duyệt được đúng 1 lần duy nhất. Nếu cần duyệt lại nhiều lần và dữ liệu nhỏ, hãy chuyển sang `list`.',
        relatedTermIds: ['concept-generator', 'kw-yield', 'dunder-iter'],
      },
      {
        id: 'q-adv-2',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Điều gì xảy ra nếu bạn tự viết một Decorator bọc quanh hàm API endpoint trong FastAPI mà QUÊN gắn `@functools.wraps(func)` lên hàm `wrapper`?',
        options: [
          {
            id: 'opt-a',
            text: 'Không ảnh hưởng gì, `@wraps` chỉ giúp code chạy nhanh hơn',
            whyRightOrWrong:
              'Sai! `@wraps` không liên quan đến tốc độ CPU mà liên quan đến việc bảo toàn siêu dữ liệu (Metadata) của hàm.',
          },
          {
            id: 'opt-b',
            text: 'Hàm gốc bị mất tên thật (`__name__` biến thành `"wrapper"`), mất docstring và mất Type Hints (`__annotations__`, `__wrapped__`), làm hỏng tính năng đọc chữ ký hàm và Dependency Injection của FastAPI!',
            whyRightOrWrong:
              'Chính xác! FastAPI, Pydantic và pytest dựa vào `inspect.signature(func)` và `__annotations__` để biết các tham số Query/Body/Depends. Nếu thiếu `@wraps(func)`, nó chỉ nhìn thấy `(*args, **kwargs)` của `wrapper`!',
          },
          {
            id: 'opt-c',
            text: 'Python từ chối biên dịch và báo lỗi `SyntaxError`',
            whyRightOrWrong:
              'Sai! Python vẫn chạy nhưng metadata của hàm bị ghi đè bởi `wrapper`.',
          },
          {
            id: 'opt-d',
            text: 'Biến trong Closure bị xóa sau lần gọi đầu tiên',
            whyRightOrWrong:
              'Sai! Closure vẫn hoạt động dù có hay không có `@wraps`.',
          },
        ],
        correctOptionId: 'opt-b',
        overallExplanation:
          'Luôn luôn thêm `@functools.wraps(func)` ngay phía trên hàm `wrapper` mỗi khi bạn viết Decorator trong Python.',
        relatedTermIds: ['concept-decorator', 'concept-closure', 'eco-fastapi'],
      },
      {
        id: 'q-adv-3',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Khi viết Context Manager bằng `@contextlib.contextmanager` và từ khóa `yield`, tại sao bắt buộc phải bọc `yield` bên trong khối `try ... finally:`?',
        codeSnippet: `@contextmanager\ndef managed_resource():\n    res = acquire()\n    try:\n        yield res\n    finally:\n        release(res)`,
        options: [
          {
            id: 'opt-a',
            text: 'Vì nếu code bên trong khối `with` của người dùng ném ra Exception, Python sẽ ném Exception đó ngược vào ngay tại dòng `yield` (`gen.throw()`) — nếu không có `try...finally`, hàm `release(res)` phía dưới sẽ bị bỏ qua!',
            whyRightOrWrong:
              'Chính xác 100%! Khi có lỗi bên trong khối `with`, trình thông dịch gọi `gen.throw(exc)` ngay tại vị trí `yield`. Khối `finally` đảm bảo tài nguyên luôn được thu hồi.',
          },
          {
            id: 'opt-b',
            text: 'Vì cú pháp Python bắt buộc từ khóa `yield` phải nằm trong `try`',
            whyRightOrWrong:
              'Sai! Generator thông thường không bắt buộc `try`, chỉ Context Manager mới cần để đảm bảo Teardown an toàn.',
          },
          {
            id: 'opt-c',
            text: 'Để tự động nuốt (bỏ qua) mọi lỗi xảy ra bên trong khối `with`',
            whyRightOrWrong:
              'Sai! `try...finally` không nuốt lỗi mà chỉ chạy dọn dẹp trước khi lỗi tiếp tục được ném ra ngoài.',
          },
          {
            id: 'opt-d',
            text: 'Để tăng tốc độ giải phóng bộ nhớ của Garbage Collector',
            whyRightOrWrong:
              'Sai!',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Hiểu cơ chế `gen.throw()` tại điểm `yield` là chìa khóa để viết cả `@contextmanager`, `@pytest.fixture` và `FastAPI Depends()` có `yield` một cách an toàn tuyệt đối.',
        relatedTermIds: ['concept-context-manager', 'kw-with', 'kw-yield', 'dunder-enter'],
      },
      {
        id: 'q-adv-4',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Sự khác biệt cốt lõi giữa một **Iterable** (như `list`, `range`) và một **Iterator** (như kết quả của `iter(list)` hoặc Generator) là gì?',
        codeSnippet: `nums = [10, 20]\nit = iter(nums)\nprint(iter(it) is it, hasattr(nums, "__next__"), hasattr(it, "__next__"))`,
        options: [
          {
            id: 'opt-a',
            text: '`True False True` — `nums` là **Iterable** (chỉ có `__iter__`, tạo ra Iterator mới mỗi lần lặp, KHÔNG có `__next__`); còn `it` là **Iterator** (có cả `__iter__` trả về chính nó lẫn `__next__` để dịch chuyển con trỏ)!',
            whyRightOrWrong:
              'Chính xác! Bạn không thể gọi `next([10, 20])` trực tiếp (`TypeError: \'list\' object is not an iterator`). Phải gọi `it = iter([10, 20])` để lấy Iterator có phương thức `__next__`.',
          },
          {
            id: 'opt-b',
            text: '`False True True` vì `list` cũng là một Iterator',
            whyRightOrWrong:
              'Sai! Nếu `list` tự là Iterator của chính nó thì bạn chỉ có thể lặp qua một danh sách đúng 1 lần duy nhất! Nhờ tách biệt `list` (Iterable) và `list_iterator` (Iterator), ta mới có thể lặp nhiều vòng `for` lồng nhau trên cùng 1 `list`.',
          },
          {
            id: 'opt-c',
            text: '`True True False`',
            whyRightOrWrong:
              'Sai! `nums` không có `__next__`, chỉ `it` mới có `__next__`.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `TypeError` khi gọi `iter(it)` trên một đối tượng vốn đã là Iterator',
            whyRightOrWrong:
              'Sai! Mọi Iterator bắt buộc phải cài đặt `__iter__(self)` trả về `self` (`iter(it) is it`) để bản thân Iterator cũng dùng được trực tiếp trong vòng lặp `for x in it:`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Giao thức Iterator Protocol của Python gồm 2 phần: **Iterable** giống như cuốn sách (có thể mở ra đọc nhiều lần bằng `iter(book)`), còn **Iterator** giống như chiếc thẻ đánh dấu trang sách (lưu vị trí dòng đang đọc qua `next(bookmark)`).',
        relatedTermIds: ['dunder-iter', 'concept-generator', 'kw-for'],
      },
      {
        id: 'q-adv-5',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Trong hàm Generator, sự khác biệt giữa việc dùng `yield from iterable` và `yield iterable` là gì?',
        codeSnippet: `def gen_a():\n    yield [1, 2]\n    yield [3, 4]\n\ndef gen_b():\n    yield from [1, 2]\n    yield from [3, 4]\n\nprint(list(gen_a()), list(gen_b()))`,
        options: [
          {
            id: 'opt-a',
            text: '`[[1, 2], [3, 4]] [1, 2, 3, 4]` — `yield [1, 2]` trả ra nguyên cả danh sách con làm 1 phần tử; còn `yield from` ủy quyền (delegate) và trải phẳng từng phần tử bên trong generator/iterable con ra ngoài!',
            whyRightOrWrong:
              'Chính xác! `yield from sub_gen` không chỉ ngắn gọn hơn `for item in sub_gen: yield item` mà còn tạo kênh truyền 2 chiều trực tiếp (cho cả `.send()`, `.throw()` và hứng giá trị `return` của generator con).',
          },
          {
            id: 'opt-b',
            text: '`[1, 2, 3, 4] [1, 2, 3, 4]`',
            whyRightOrWrong:
              'Sai! `gen_a()` nhả ra 2 đối tượng `list` nguyên vẹn nên `list(gen_a())` là mảng 2 chiều `[[1, 2], [3, 4]]`.',
          },
          {
            id: 'opt-c',
            text: 'Ném lỗi `TypeError` ở `gen_b()` vì `yield from` chỉ nhận một Generator khác chứ không nhận `list`',
            whyRightOrWrong:
              'Sai! `yield from` chấp nhận BẤT KỲ Iterable nào (`list`, `tuple`, `set`, `range`, hoặc một `generator` đệ quy).',
          },
          {
            id: 'opt-d',
            text: '`[[1, 2], [3, 4]] [[1, 2], [3, 4]]`',
            whyRightOrWrong:
              'Sai! `yield from` bóc tách từng phần tử bên trong `[1, 2]` và `[3, 4]`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          '`yield from` là công cụ đắc lực khi duyệt cây đệ quy (như duyệt thư mục hoặc AST) bằng Generator mà không cần tạo mảng trung gian tốn bộ nhớ.',
        relatedTermIds: ['kw-yield', 'concept-generator'],
      },
      {
        id: 'q-adv-6',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Sự khác biệt về mục đích và cơ chế dự phòng (fallback) giữa hai phương thức Dunder `__repr__` và `__str__` là gì?',
        codeSnippet: `class Money:\n    def __init__(self, amount: int):\n        self.amount = amount\n    def __repr__(self) -> str:\n        return f"Money(amount={self.amount!r})"\n\nm = Money(100)\nprint(str(m), [m])`,
        options: [
          {
            id: 'opt-a',
            text: '`Money(amount=100) [Money(amount=100)]` — Nếu một class chỉ cài đặt `__repr__` mà không cài `__str__`, thì `str(m)` và `print(m)` sẽ tự động dùng `__repr__` làm phương án dự phòng; hơn nữa, khi in một danh sách `[m]`, Python LUÔN gọi `__repr__` của các phần tử bên trong!',
            whyRightOrWrong:
              'Chính xác 100%! Vì vậy quy tắc vàng trong Python OOP là: Nếu chỉ viết 1 phương thức hiển thị, hãy luôn viết `__repr__` (vừa phục vụ debug rõ ràng, vừa làm fallback cho `str()`).',
          },
          {
            id: 'opt-b',
            text: 'In ra `<__main__.Money object at 0x...> [Money(amount=100)]` vì chưa định nghĩa `__str__`',
            whyRightOrWrong:
              'Sai! Mặc định `object.__str__` sẽ tự động gọi sang `self.__repr__()`. Chỉ khi bạn viết `__str__` mà quên viết `__repr__` thì `[m]` mới in ra `<__main__.Money object at 0x...>`.',
          },
          {
            id: 'opt-c',
            text: 'Khi in một danh sách `print([m])`, Python sẽ ưu tiên gọi `__str__` của các phần tử bên trong danh sách',
            whyRightOrWrong:
              'Sai! `list.__repr__` (và cả `list.__str__`) luôn gọi `repr(item)` cho từng phần tử bên trong để phân biệt rõ ràng `["1", 1]` trong log!',
          },
          {
            id: 'opt-d',
            text: 'Cú pháp `!r` trong `f"{self.amount!r}"` là lỗi cú pháp',
            whyRightOrWrong:
              'Sai! Cờ chuyển đổi `!r` trong f-string gọi `repr()` (tương tự `!s` gọi `str()`), rất hữu ích khi viết `__repr__`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Hãy nhớ: `__repr__` dành cho Lập trình viên (debug, log, container `[obj]`), còn `__str__` dành cho Người dùng cuối. Nếu chỉ cài đặt 1 trong 2, hãy luôn cài đặt `__repr__`!',
        relatedTermIds: ['dunder-repr', 'kw-class'],
      },
      {
        id: 'q-adv-7',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Chuyện gì xảy ra khi bạn tự định nghĩa phương thức so sánh bằng `__eq__` cho một Class nhưng KHÔNG định nghĩa `__hash__`?',
        codeSnippet: `class Point:\n    def __init__(self, x: int, y: int):\n        self.x, self.y = x, y\n    def __eq__(self, other: object) -> bool:\n        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)\n\np = Point(1, 2)\ncache = {p: "Home"}`,
        options: [
          {
            id: 'opt-a',
            text: 'Ném lỗi `TypeError: unhashable type: \'Point\'` — Ngay khi bạn định nghĩa `__eq__` mà không định nghĩa `__hash__`, Python tự động gán `Point.__hash__ = None` để ngăn đối tượng khả biến bị đưa vào `set`/`dict`!',
            whyRightOrWrong:
              'Chính xác! Theo hợp đồng Hash Table của Python, nếu `a == b` thì BẮT BUỘC `hash(a) == hash(b)`. Khi bạn ghi đè `__eq__`, mã băm mặc định theo địa chỉ ô nhớ (`object.__hash__`) không còn thỏa mãn luật này nữa nên Python khóa luôn `__hash__ = None`.',
          },
          {
            id: 'opt-b',
            text: 'Hoạt động bình thường vì mọi đối tượng kế thừa từ `object` đều mặc định có `__hash__` theo địa chỉ RAM',
            whyRightOrWrong:
              'Sai! Class mặc định có `object.__hash__`, nhưng ngay khi bạn tự viết `def __eq__`, Python sẽ hủy kế thừa `__hash__` bằng cách đặt `__hash__ = None`.',
          },
          {
            id: 'opt-c',
            text: 'Python tự động sinh hàm `__hash__` dựa trên `self.x` và `self.y`',
            whyRightOrWrong:
              'Sai! Class thường không tự sinh `__hash__`. Muốn tự sinh cả `__eq__` lẫn `__hash__` an toàn, bạn phải dùng `@dataclass(frozen=True)` hoặc tự cài `def __hash__(self) -> int: return hash((self.x, self.y))`.',
          },
          {
            id: 'opt-d',
            text: 'Ném lỗi `KeyError`',
            whyRightOrWrong:
              'Sai! Lỗi ném ra là `TypeError: unhashable type: \'Point\'`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Nếu bạn muốn một Value Object vừa so sánh theo giá trị (`__eq__`) vừa dùng làm key của `dict` / phần tử của `set` (`__hash__`), cách chuẩn mực nhất là dùng `@dataclass(frozen=True)`!',
        relatedTermIds: ['dunder-eq', 'concept-dataclass', 'type-dict'],
      },
      {
        id: 'q-adv-8',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Cơ chế `__slots__` trong Python Class (hoặc `@dataclass(slots=True)`) hoạt động như thế nào và đem lại lợi ích gì khi khởi tạo hàng triệu đối tượng?',
        codeSnippet: `class MetricPoint:\n    __slots__ = ("timestamp", "value")\n    def __init__(self, timestamp: int, value: float):\n        self.timestamp = timestamp\n        self.value = value`,
        options: [
          {
            id: 'opt-a',
            text: 'Ngăn Python tạo từ điển động `__dict__` cho từng instance mà thay bằng mảng con trỏ cố định cấp C (Descriptor) — giúp giảm 40%–60% dung lượng RAM, tăng tốc độ truy cập thuộc tính và chặn gán nhầm thuộc tính lạ ngoài danh sách!',
            whyRightOrWrong:
              'Chính xác! Mặc định mỗi đối tượng Python đều cõng theo một bảng băm `__dict__` khá nặng. `__slots__` loại bỏ hoàn toàn `__dict__` của từng instance.',
          },
          {
            id: 'opt-b',
            text: 'Biến đối tượng thành bất biến (Immutable) không thể sửa `self.value` sau khi khởi tạo',
            whyRightOrWrong:
              'Sai! `__slots__` chỉ cố định DANH SÁCH tên thuộc tính (không cho thêm thuộc tính mới như `m.extra = 1`), còn giá trị của `m.value` vẫn thay đổi được bình thường.',
          },
          {
            id: 'opt-c',
            text: 'Tự động lưu đối tượng vào bộ nhớ Stack thay vì Heap',
            whyRightOrWrong:
              'Sai! Trong CPython, mọi đối tượng Python đều nằm trên Heap, nhưng cấu trúc C-struct của instance có `__slots__` gọn nhẹ hơn rất nhiều vì không có `__dict__`.',
          },
          {
            id: 'opt-d',
            text: 'Chỉ dùng được cho các thuộc tính kiểu số nguyên `int` và số thực `float`',
            whyRightOrWrong:
              'Sai! Các thuộc tính trong `__slots__` có thể chứa bất kỳ kiểu đối tượng Python nào.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Từ Python 3.10+, bạn chỉ cần viết `@dataclass(slots=True)` là có ngay cả sự gọn gàng của Dataclass lẫn hiệu năng bộ nhớ vượt trội của `__slots__`.',
        relatedTermIds: ['concept-dataclass', 'kw-class'],
      },
      {
        id: 'q-adv-9',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Khi định nghĩa một `@dataclass` trong Python, điều gì xảy ra nếu bạn khai báo trực tiếp `tags: list[str] = []` và phải sửa lại như thế nào?',
        codeSnippet: `from dataclasses import dataclass, field\n\n@dataclass\nclass Article:\n    title: str\n    tags: list[str] = []  # Dòng này sẽ ra sao?`,
        options: [
          {
            id: 'opt-a',
            text: 'Python lập tức ném lỗi `ValueError: mutable default <class \'list\'> for field tags is not allowed: use default_factory` để bảo vệ bạn khỏi bẫy dùng chung list; phải sửa thành `tags: list[str] = field(default_factory=list)`!',
            whyRightOrWrong:
              'Chính xác! Khác với hàm `def` thông thường âm thầm cho qua, `@dataclass` chủ động phát hiện giá trị mặc định khả biến (`list`, `dict`, `set`) và bắt buộc bạn dùng `field(default_factory=list)` để mỗi instance được cấp một list mới.',
          },
          {
            id: 'opt-b',
            text: 'Chạy bình thường và tự động tạo list mới cho mỗi `Article`',
            whyRightOrWrong:
              'Sai! `@dataclass` từ chối chạy và ném `ValueError` ngay lúc nạp class nếu thấy `= []`.',
          },
          {
            id: 'opt-c',
            text: 'Chạy bình thường nhưng mọi `Article` bị dùng chung một danh sách `tags`',
            whyRightOrWrong:
              'Sai! Đó là nếu bạn không dùng `@dataclass`. Còn `@dataclass` đã chặn lỗi này ngay từ đầu bằng `ValueError`.',
          },
          {
            id: 'opt-d',
            text: 'Phải sửa thành `tags: list[str] = field(default_factory=list())` (có dấu ngoặc tròn `list()`)',
            whyRightOrWrong:
              'Sai! `default_factory` nhận một **Callable** (hàm tạo `list` không có ngoặc tròn), không phải một instance `list()`!',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Trong cả `@dataclass` (`field(default_factory=list)`) và Pydantic `BaseModel` (`Field(default_factory=list)`), hãy truyền hàm khởi tạo (như `list`, `dict`, `set`, `uuid.uuid4`) vào `default_factory`.',
        relatedTermIds: ['concept-dataclass', 'concept-mutable-default'],
      },
      {
        id: 'q-adv-10',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Decorator `@property` trong Python giúp giải quyết bài toán thiết kế OOP nào dưới đây?',
        codeSnippet: `class Circle:\n    def __init__(self, radius: float):\n        self.radius = radius\n\n    @property\n    def radius(self) -> float:\n        return self._radius\n\n    @radius.setter\n    def radius(self, value: float) -> None:\n        if value <= 0:\n            raise ValueError("Bán kính phải > 0")\n        self._radius = value`,
        options: [
          {
            id: 'opt-a',
            text: 'Biến phương thức thành thuộc tính ảo (Computed/Managed Attribute): cho phép truy cập tự nhiên bằng dấu chấm `c.radius` và `c.radius = 5` (thay vì phải viết `get_radius()`/`set_radius()` kiểu Java), đồng thời kích hoạt kiểm tra hợp lệ ngay cả ở dòng `self.radius = radius` trong `__init__`!',
            whyRightOrWrong:
              'Chính xác! Ngay trong `__init__`, câu lệnh `self.radius = radius` sẽ tự động đi qua `@radius.setter`, chặn đứng `Circle(-5)` bằng `ValueError` mà không phá vỡ giao diện thuộc tính public của class.',
          },
          {
            id: 'opt-b',
            text: 'Để gọi thuộc tính dưới dạng hàm `c.radius()`',
            whyRightOrWrong:
              'Sai! Khi đã gắn `@property`, truy cập `c.radius` sẽ tự chạy hàm và trả về số `float`; nếu gọi `c.radius()` sẽ ném lỗi `TypeError: \'float\' object is not callable`.',
          },
          {
            id: 'opt-c',
            text: 'Dòng `self.radius = radius` trong `__init__` sẽ bỏ qua `@radius.setter`',
            whyRightOrWrong:
              'Sai! Vì `@property` là một Data Descriptor cấp class, mọi phép gán `self.radius = ...` (kể cả trong `__init__`) đều đi qua hàm `@radius.setter`.',
          },
          {
            id: 'opt-d',
            text: 'Biến `_radius` trở thành biến `private` tuyệt đối không thể truy cập từ bên ngoài',
            whyRightOrWrong:
              'Sai! Dấu gạch dưới đơn `_radius` là quy ước nội bộ (protected convention) để tránh đệ quy vô tận `self.radius = value` bên trong setter.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Trong Python, đừng bao giờ viết `get_x()` và `set_x()` ngay từ đầu. Hãy cứ dùng thuộc tính thường `self.x`, và khi nào cần thêm logic kiểm tra hoặc tính toán động thì nâng cấp lên `@property` mà không phải sửa bất kỳ dòng code nào đang gọi `obj.x`!',
        relatedTermIds: ['concept-decorator', 'kw-class', 'dunder-init'],
      },
      {
        id: 'q-adv-11',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Sự khác biệt thiết thực nhất giữa `@classmethod` và `@staticmethod` khi thiết kế các hàm khởi tạo thay thế (Alternative Constructors) có tính kế thừa là gì?',
        codeSnippet: `class BaseConfig:\n    def __init__(self, host: str):\n        self.host = host\n\n    @classmethod\n    def from_env(cls):\n        return cls("localhost")\n\nclass ProdConfig(BaseConfig):\n    pass\n\ncfg = ProdConfig.from_env()\nprint(type(cfg).__name__)`,
        options: [
          {
            id: 'opt-a',
            text: 'In ra `ProdConfig` — Vì `@classmethod` tự động nhận tham số đầu tiên `cls` chính là lớp đang gọi nó (`ProdConfig`), nên `return cls("localhost")` khởi tạo đúng thực thể của lớp con `ProdConfig` thay vì bị cứng nhắc vào `BaseConfig`!',
            whyRightOrWrong:
              'Chính xác! Nếu dùng `@staticmethod` và viết cứng `return BaseConfig("localhost")`, thì khi gọi `ProdConfig.from_env()` nó lại trả về `BaseConfig` (sai kiểu lớp con). `@classmethod` giải quyết triệt để bài toán Factory Method trong kế thừa.',
          },
          {
            id: 'opt-b',
            text: 'In ra `BaseConfig` vì `from_env` được định nghĩa trong `BaseConfig`',
            whyRightOrWrong:
              'Sai! Khi gọi `ProdConfig.from_env()`, tham số `cls` được truyền vào chính là lớp `ProdConfig`.',
          },
          {
            id: 'opt-c',
            text: '`@classmethod` nhận `self` làm tham số đầu tiên giống phương thức thường',
            whyRightOrWrong:
              'Sai! Phương thức thường nhận `self` (instance), `@classmethod` nhận `cls` (class), còn `@staticmethod` không tự động nhận `self` hay `cls`.',
          },
          {
            id: 'opt-d',
            text: 'Không thể gọi `BaseConfig.from_env()` nếu chưa khởi tạo đối tượng trước',
            whyRightOrWrong:
              'Sai! `@classmethod` được gọi trực tiếp trên tên Class: `ProdConfig.from_env()`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Sử dụng `@classmethod` cho mọi **Alternative Constructor** (như `datetime.fromisoformat()`, `dict.fromkeys()`, `Model.model_validate()`), và dùng `@staticmethod` cho các hàm tiện ích thuần túy không cần chạm tới trạng thái của `self` hay `cls`.',
        relatedTermIds: ['kw-class', 'concept-decorator'],
      },
      {
        id: 'q-adv-12',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Trong hệ thống kiểu tĩnh hiện đại của Python (Pyright / Mypy), sự khác biệt giữa `typing.Protocol` và `abc.ABC` (Abstract Base Class) là gì?',
        codeSnippet: `from typing import Protocol\n\nclass Renderable(Protocol):\n    def render(self) -> str: ...\n\nclass HtmlWidget:  # KHÔNG kế thừa Renderable!\n    def render(self) -> str:\n        return "<div/>"\n\ndef draw(item: Renderable) -> str:\n    return item.render()`,
        options: [
          {
            id: 'opt-a',
            text: '`Protocol` hỗ trợ **Structural Subtyping** (Static Duck Typing — giống `interface` trong TypeScript): lớp `HtmlWidget` KHÔNG CẦN kế thừa tường minh `Renderable`, chỉ cần có phương thức `render(self) -> str` khớp chữ ký là vượt qua kiểm tra kiểu hoàn toàn!',
            whyRightOrWrong:
              'Chính xác! Ngược lại, `abc.ABC` là **Nominal Subtyping**: bắt buộc `class HtmlWidget(Renderable):` phải khai báo kế thừa tường minh. `Protocol` giúp áp dụng Dependency Inversion và viết Mock trong test cực kỳ linh hoạt mà không cần kết dính kế thừa.',
          },
          {
            id: 'opt-b',
            text: 'Dòng `draw(HtmlWidget())` sẽ bị Pyright báo lỗi kiểu vì `HtmlWidget` quên kế thừa `(Renderable)`',
            whyRightOrWrong:
              'Sai! Chính ưu điểm lớn nhất của `Protocol` (PEP 544) là kiểm tra theo cấu trúc (có hàm `render() -> str` là hợp lệ) mà không cần kế thừa.',
          },
          {
            id: 'opt-c',
            text: '`Protocol` tự động chặn khởi tạo lúc runtime giống hệt `@abstractmethod` của `ABC` đối với mọi class khác',
            whyRightOrWrong:
              'Sai! `Protocol` chủ yếu phục vụ Static Type Checker (như Pyright) lúc kiểm tra kiểu tĩnh (và chỉ hỗ trợ `isinstance` ở runtime nếu gắn thêm `@runtime_checkable`).',
          },
          {
            id: 'opt-d',
            text: 'Dấu ba chấm `...` (Ellipsis) bên trong `Protocol` là lỗi cú pháp Python',
            whyRightOrWrong:
              'Sai! Trong Python, `...` (`Ellipsis`) là một đối tượng hợp lệ và là chuẩn mực để viết thân hàm rỗng trong `Protocol` và file `.pyi` stub.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Đối với lập trình viên TypeScript sang Python: `typing.Protocol` chính là `interface` của TypeScript! Hãy ưu tiên dùng `Protocol` khi định nghĩa interface cho Service/Repository để dễ dàng truyền bất kỳ đối tượng hay Fake/Mock nào có cùng chữ ký phương thức.',
        relatedTermIds: ['concept-type-hints', 'kw-class'],
      },
      {
        id: 'q-adv-13',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Tại sao khi viết một hàm lấy phần tử đầu tiên của danh sách, ta nên dùng Generic Type Parameter `def first[T](items: list[T]) -> T:` (Python 3.12+) thay vì `def first(items: list[Any]) -> Any:`?',
        codeSnippet: `def first[T](items: list[T]) -> T:\n    return items[0]\n\nname = first(["An", "Bình"])  # Pyright suy luận kiểu của 'name' là gì?`,
        options: [
          {
            id: 'opt-a',
            text: 'Với `def first[T](items: list[T]) -> T:`, Pyright bảo toàn mối liên hệ kiểu đầu vào/đầu ra và tự động suy luận chính xác `name` có kiểu `str` (nếu truyền `list[int]` thì trả về `int`); trong khi `Any` tắt hoàn toàn việc kiểm tra kiểu tĩnh!',
            whyRightOrWrong:
              'Chính xác! Biến kiểu `T` (Type Parameter / `TypeVar`) giữ nguyên thông tin kiểu xuyên qua hàm, giúp IDE gợi ý các phương thức của `str` trên biến `name` và bắt lỗi nếu bạn gọi `name + 10`.',
          },
          {
            id: 'opt-b',
            text: 'Cú pháp `def first[T](...)` chỉ có trong TypeScript còn trong Python 3.12+ sẽ báo lỗi `SyntaxError`',
            whyRightOrWrong:
              'Sai! Từ Python 3.12 (PEP 695), cú pháp Generic `[T]` trực tiếp trên hàm và class (`def first[T](...)`, `class Box[T]:`) đã trở thành cú pháp chuẩn chính thức của Python (không cần `T = TypeVar("T")` thủ công nữa)!',
          },
          {
            id: 'opt-c',
            text: 'Giúp CPython kiểm tra kiểu lúc runtime và ném `TypeError` nếu danh sách chứa nhiều kiểu khác nhau',
            whyRightOrWrong:
              'Sai! Type Hints trong Python không tự ép buộc lúc runtime (trừ khi dùng với thư viện như Pydantic). Chúng dành cho trình kiểm tra kiểu tĩnh như Pyright/Mypy.',
          },
          {
            id: 'opt-d',
            text: '`Any` và `object` là hoàn toàn giống nhau trong Type Hints',
            whyRightOrWrong:
              'Sai! `Any` vô hiệu hóa mọi kiểm tra kiểu (cho phép gọi bất kỳ hàm không tồn tại nào mà không báo lỗi), còn `object` là kiểu gốc an toàn (chỉ cho phép gọi các phép toán chung của mọi object cho đến khi thu hẹp kiểu bằng `isinstance`).',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Trong Python 3.12+, hãy tận dụng cú pháp PEP 695 `def func[T](x: list[T]) -> T:` và tránh lạm dụng `Any` để trình kiểm tra kiểu Pyright bảo vệ dự án của bạn giống như TypeScript strict mode.',
        relatedTermIds: ['concept-type-hints', 'eco-ruff'],
      },
      {
        id: 'q-adv-14',
        stageId: 'stage-2',
        level: 'advanced',
        question:
          'Phương thức Dunder `__call__` biến một thực thể (instance) của Class thành đối tượng gì và thường được ứng dụng ở đâu?',
        codeSnippet: `class RateLimiter:\n    def __init__(self, limit: int):\n        self.limit = limit\n        self.calls = 0\n\n    def __call__(self, user: str) -> bool:\n        self.calls += 1\n        return self.calls <= self.limit\n\nlimiter = RateLimiter(2)\nprint(callable(limiter), limiter("u1"), limiter("u2"), limiter("u3"))`,
        options: [
          {
            id: 'opt-a',
            text: '`True True True False` — Cài đặt `__call__` biến bản thân instance `limiter` thành một **Callable** (có thể gọi trực tiếp như hàm `limiter("u1")` mà vẫn lưu giữ được trạng thái `self.calls` bên trong đối tượng)!',
            whyRightOrWrong:
              'Chính xác! Đây là mẫu thiết kế cực kỳ phổ biến để viết Stateful Decorator hoặc các Dependency có tham số trong FastAPI (như `Depends(RateLimiter(limit=100))` hoặc `Depends(RoleChecker(["admin"]))`).',
          },
          {
            id: 'opt-b',
            text: '`__call__` được tự động kích hoạt ngay khi khởi tạo `RateLimiter(2)` thay cho `__init__`',
            whyRightOrWrong:
              'Sai! `RateLimiter(2)` gọi `__new__` và `__init__` để tạo instance `limiter`. Sau đó khi gọi `limiter("u1")` mới kích hoạt `limiter.__call__("u1")`.',
          },
          {
            id: 'opt-c',
            text: 'Ném lỗi `TypeError: \'RateLimiter\' object is not callable`',
            whyRightOrWrong:
              'Sai! Nhờ có `def __call__`, `callable(limiter)` trả về `True` và gọi `limiter("u1")` hoàn toàn hợp lệ.',
          },
          {
            id: 'opt-d',
            text: '`False True True True`',
            whyRightOrWrong:
              'Sai! Ở lần gọi thứ 3 (`limiter("u3")`), `self.calls` tăng lên `3 > 2` nên trả về `False`.',
          },
        ],
        correctOptionId: 'opt-a',
        overallExplanation:
          'Trong FastAPI thực chiến, khi bạn cần một Dependency có thể cấu hình tham số động (ví dụ `Depends(RequireRole("admin"))`), cách chuẩn nhất là viết một class `RequireRole` có `__init__(self, role)` và `async def __call__(self, user = Depends(get_current_user))`.',
        relatedTermIds: ['kw-class', 'dunder-init', 'eco-fastapi'],
      },
    ],
  },
];


import { PracticeExercise } from '@/types/practice.types';

export const PACK_1_EXERCISES: PracticeExercise[] = [
  {
    id: 'ex-s0-version-cli-check',
    title: 'Bài 1: Tính Hóa đơn Tiền tệ với Decimal & Chốt chặn __name__ == "__main__"',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'fundamental',
    relatedLessonId: 's0-syntax-primitives-operators-flow',
    problemStatement:
      'Hãy viết hàm `calculate_invoice(amount_str: str) -> str` sử dụng `Decimal` để cộng thêm 10% thuế VAT (`Decimal("1.10")`) một cách chính xác tuyệt đối không bị sai số dấu phẩy động IEEE 754 của `float`, đồng thời thêm chốt chặn chuẩn `if __name__ == "__main__":` ở cuối file để in kết quả kiểm thử.',
    realWorldContext:
      'Trong các hệ thống thanh toán và ngân hàng, phép tính `0.1 + 0.2` bằng `float` cho ra `0.30000000000000004`, gây lệch sổ sách kế toán. Mọi kỹ sư Python chuyên nghiệp đều dùng `Decimal` khởi tạo từ chuỗi kết hợp chốt chặn `__main__` để tách biệt logic thư viện và kịch bản chạy CLI.',
    requirements: [
      'Sử dụng `Decimal(amount_str) * Decimal("1.10")` thay vì kiểu `float`',
      'Trả về chuỗi định dạng bằng `f-string`: `f"Total: {total}"`',
      'Có câu lệnh kiểm tra `if __name__ == "__main__":` ở cuối file',
    ],
    starterCode: `from decimal import Decimal

def calculate_invoice(amount_str: str) -> str:
    # TODO: Chuyển amount_str sang Decimal, nhân với Decimal("1.10")
    # và trả về f"Total: {total}"
    pass

# TODO: Thêm chốt chặn if __name__ == "__main__": gọi print(calculate_invoice("100.00"))
`,
    solutionCode: `from decimal import Decimal

def calculate_invoice(amount_str: str) -> str:
    total = Decimal(amount_str) * Decimal("1.10")
    return f"Total: {total}"

if __name__ == "__main__":
    print(calculate_invoice("100.00"))
`,
    hints: [
      'Gợi ý 1: Tính `total = Decimal(amount_str) * Decimal("1.10")` bên trong hàm.',
      'Gợi ý 2: Trả về `return f"Total: {total}"`.',
      'Gợi ý 3: Ở cuối file (sát lề trái), viết `if __name__ == "__main__":` và gọi `print(calculate_invoice("100.00"))`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Dùng Decimal truyền chuỗi để loại bỏ sai số nhị phân IEEE 754',
        codeSnippet: `    total = Decimal(amount_str) * Decimal("1.10")`,
        explanation:
          'Khác với `float(0.1)` bị lẻ vô hạn ở hệ nhị phân, `Decimal("1.10")` lưu trữ chính xác từng chữ số thập phân ở hệ cơ số 10.',
      },
      {
        stepTitle: 'Bước 2: Đặt chốt chặn thực thi trực tiếp `__name__ == "__main__"`',
        codeSnippet: `if __name__ == "__main__":\n    print(calculate_invoice("100.00"))`,
        explanation:
          'Đảm bảo lệnh `print` chỉ chạy khi bạn gõ `uv run invoice.py`, còn khi module khác `from invoice import calculate_invoice` thì không bị thực thi mã kiểm thử ngoài ý muốn.',
      },
    ],
    commonMistakes: [
      'Truyền số thực `Decimal(1.1)` thay vì chuỗi `Decimal("1.10")` — nếu truyền số thực thì sai số nhị phân của `float` đã xảy ra trước khi vào `Decimal`!',
      'Viết `if __name__ = "__main__":` (dùng 1 dấu `=` gán thay vì 2 dấu `==` so sánh).',
    ],
    testCases: [
      {
        id: 'tc-s0-1-decimal',
        description: 'Tính chính xác bằng Decimal và có chốt chặn if __name__ == "__main__":',
        inputDescription: 'calculate_invoice("100.00")',
        expectedOutput: "'Total: 110.0000'",
        requiredPatterns: ['Decimal(amount_str)', 'Decimal("1.10")', 'f"Total: {total}"', '__name__', '__main__'],
        forbiddenPatterns: [
          {
            pattern: 'float(',
            reason: 'Không dùng `float()` cho tính toán hóa đơn tiền tệ — hãy dùng `Decimal`!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s0-strong-typing-fstring',
    title: 'Bài 2: Chuyển đổi JS Template Literal & Ép kiểu Mạnh sang f-string Định dạng Số',
    category: 'js-to-py',
    stageId: 'stage-1',
    level: 'fundamental',
    relatedLessonId: 's0-python-overview-engine',
    problemStatement:
      'Trong JavaScript, `"ID: " + 7` tự động ép kiểu ngầm định thành `"ID: 7"`, nhưng trong Python (Strong Typing), nối `str + int` sẽ lập tức ném lỗi `TypeError`. Hãy sửa hàm `format_account_badge(user_id: int, balance_str: str) -> str`: chuyển `balance_str` sang `float`, cộng thêm thưởng `50.0`, và dùng `f-string` với Format Specifier để định dạng `user_id` thành 4 chữ số có số `0` đứng đầu (`04d`) cùng số dư có dấu phẩy ngăn cách hàng nghìn và 2 chữ số thập phân (`,.2f`).',
    realWorldContext:
      'Lập trình viên từ JS/TS sang Python rất hay mắc lỗi cộng chuỗi với số hoặc tự viết hàm `padStart(4, "0")` và `toLocaleString()` dài dòng, trong khi Mini-Language của Python `f-string` xử lý toàn bộ chỉ bằng vài ký tự.',
    requirements: [
      'Ép kiểu tường minh `float(balance_str) + 50.0` trước khi định dạng',
      'Định dạng `user_id` bằng `{user_id:04d}` (ví dụ `7` thành `0007`)',
      'Định dạng số dư bằng `{final_balance:,.2f}` (ví dụ `1250.5` thành `1,250.50`)',
    ],
    starterCode: `def format_account_badge(user_id: int, balance_str: str) -> str:
    # Code kiểu JS dưới đây sẽ gây lỗi TypeError trong Python:
    # return "User #" + user_id + " | Balance: $" + (balance_str + 50)
    # TODO: Ép kiểu tường minh và trả về f"User [{user_id:04d}] | Balance: \${final_balance:,.2f}"
    pass
`,
    solutionCode: `def format_account_badge(user_id: int, balance_str: str) -> str:
    final_balance = float(balance_str) + 50.0
    return f"User [{user_id:04d}] | Balance: \${final_balance:,.2f}"
`,
    hints: [
      'Gợi ý 1: Chuyển chuỗi sang số thực bằng `final_balance = float(balance_str) + 50.0`.',
      'Gợi ý 2: Dùng `{user_id:04d}` bên trong `f-string` để điền đủ 4 chữ số với số 0 ở đầu.',
      'Gợi ý 3: Dùng `{final_balance:,.2f}` để tự động tách phần nghìn bằng dấu phẩy và lấy 2 chữ số sau dấu chấm.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Ép kiểu tường minh theo triết lý Strong Typing của Python',
        codeSnippet: `    final_balance = float(balance_str) + 50.0`,
        explanation:
          'Python từ chối đoán ý đồ khi gặp `"1200.5" + 50.0` (không biết bạn muốn `"1200.550.0"` hay `1250.5`). Bạn phải gọi `float(balance_str)` một cách tường minh.',
      },
      {
        stepTitle: 'Bước 2: Áp dụng Format Specifier `:04d` và `:,.2f` trong f-string',
        codeSnippet: `    return f"User [{user_id:04d}] | Balance: \${final_balance:,.2f}"`,
        explanation:
          '`:04d` tương đương `String(id).padStart(4, "0")` bên JS, còn `:,.2f` vừa làm tròn 2 chữ số thập phân vừa thêm dấu phẩy ngăn cách hàng nghìn.',
      },
    ],
    commonMistakes: [
      'Dùng dấu `+` để nối chuỗi với số nguyên như trong JavaScript (`"User " + user_id`) gây lỗi `TypeError: can only concatenate str (not "int") to str`.',
      'Viết nhầm thứ tự specifier thành `:.2,f` thay vì `:,.2f` (dấu phẩy ngăn cách hàng nghìn phải đứng trước dấu chấm thập phân).',
    ],
    testCases: [
      {
        id: 'tc-s0-2-fstring',
        description: 'Ép kiểu tường minh và định dạng đúng chuẩn :04d và :,.2f',
        inputDescription: 'format_account_badge(7, "1200.5")',
        expectedOutput: "'User [0007] | Balance: $1,250.50'",
        requiredPatterns: ['float(balance_str)', ':04d}', ':,.2f}'],
        forbiddenPatterns: [
          {
            pattern: 'str(user_id)',
            reason: 'Không cần gọi `str(user_id)` thủ công — hãy dùng trực tiếp `f"{user_id:04d}"`!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s0-falsy-guard',
    title: 'Bài 3: Săn Bug Kiểm tra Tập rỗng (JS arr.length === 0 vs Python Truthy/Falsy)',
    category: 'js-to-py',
    stageId: 'stage-1',
    level: 'fundamental',
    relatedLessonId: 's0-syntax-primitives-operators-flow',
    problemStatement:
      'Trong JavaScript, mảng rỗng `[]` và object rỗng `{}` đều là **Truthy** (`Boolean([]) === true`), nên dev JS luôn phải viết `if (items.length === 0)`. Ngược lại, trong Python, mọi collection rỗng (`[]`, `{}`, `set()`, `""`) đều là **Falsy**! Hãy tái cấu trúc hàm `validate_payload(items: list[str] | None) -> str` sang chuẩn PEP 8 Pythonic: kiểm tra `None` bằng `if items is None:` và kiểm tra danh sách rỗng bằng `if not items:`.',
    realWorldContext:
      'Trong các buổi Code Review tại các công ty sản phẩm Python, viết `if len(items) == 0:` hoặc `if items == None:` sẽ bị linter `ruff`/`flake8` cảnh báo ngay lập tức vì vừa chậm hơn vừa có nguy cơ bị đánh lừa bởi toán tử nạp chồng `__eq__`.',
    requirements: [
      'Thay `if items == None:` bằng toán tử định danh `if items is None:`',
      'Thay `if len(items) == 0:` bằng kiểm tra Falsy trực tiếp `if not items:`',
      'Trả về `"MISSING"` khi là `None`, `"EMPTY"` khi rỗng, và `f"OK:{len(items)}"` khi có dữ liệu',
    ],
    starterCode: `def validate_payload(items: list[str] | None) -> str:
    # TODO: Refactor 2 câu lệnh kiểm tra phản-Pythonic dưới đây sang chuẩn PEP 8
    if items == None:
        return "MISSING"
    if len(items) == 0:
        return "EMPTY"
    return f"OK:{len(items)}"
`,
    solutionCode: `def validate_payload(items: list[str] | None) -> str:
    if items is None:
        return "MISSING"
    if not items:
        return "EMPTY"
    return f"OK:{len(items)}"
`,
    hints: [
      'Gợi ý 1: Đổi `if items == None:` thành `if items is None:` để so sánh địa chỉ vùng nhớ với Singleton `None`.',
      'Gợi ý 2: Đổi `if len(items) == 0:` thành `if not items:` vì list rỗng `[]` tự động mang giá trị Falsy trong Python.',
      'Gợi ý 3: Giữ nguyên thứ tự kiểm tra `if items is None:` trước `if not items:` để phân biệt rõ `None` với `[]`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Kiểm tra Singleton None bằng toán tử `is`',
        codeSnippet: `    if items is None:\n        return "MISSING"`,
        explanation:
          'Toán tử `is` so sánh con trỏ bộ nhớ C-level tức thời (`O(1)`) và không thể bị ghi đè bởi phương thức `__eq__` của các đối tượng tùy chỉnh.',
      },
      {
        stepTitle: 'Bước 2: Tận dụng quy tắc Falsy của Collection rỗng',
        codeSnippet: `    if not items:\n        return "EMPTY"`,
        explanation:
          'Khi đã đi qua bước `items is None`, chúng ta chắc chắn `items` là một `list`. Khi đó `if not items:` kiểm tra trực tiếp độ dài bằng 0 theo đúng chuẩn PEP 8.',
      },
    ],
    commonMistakes: [
      'Đặt `if not items:` lên TRƯỚC `if items is None:` — vì `None` cũng là Falsy nên `if not items:` sẽ nuốt luôn cả trường hợp `items = None` và trả về `"EMPTY"` sai!',
      'Dùng `== None` hoặc `len(items) == 0` theo thói quen từ JavaScript/Java.',
    ],
    testCases: [
      {
        id: 'tc-s0-3-falsy',
        description: 'Sử dụng đúng `is None` và `if not items:` theo chuẩn PEP 8',
        inputDescription: 'validate_payload(None), validate_payload([]), validate_payload(["a"])',
        expectedOutput: "'MISSING', 'EMPTY', 'OK:1'",
        requiredPatterns: ['if items is None:', 'if not items:', 'return "MISSING"', 'return "EMPTY"'],
        forbiddenPatterns: [
          {
            pattern: '== None',
            reason: 'Không dùng `== None`! Hãy dùng toán tử định danh `is None` theo chuẩn PEP 8.',
          },
          {
            pattern: 'len(items) == 0',
            reason: 'Trong Python, list rỗng là Falsy. Hãy dùng `if not items:` thay vì `len(items) == 0`!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s0-floor-div-mod',
    title: 'Bài 4: Phân trang & Quy đổi Giờ:Phút bằng Toán tử //, % và divmod()',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'fundamental',
    relatedLessonId: 's0-syntax-primitives-operators-flow',
    problemStatement:
      'Trong JavaScript, chia hai số nguyên `135 / 60` trả về số thực `2.25` và bạn phải bọc `Math.floor(135 / 60)`. Python cung cấp toán tử chia lấy nguyên `//`, chia lấy dư `%` và đặc biệt là hàm tích hợp `divmod(a, b)` trả về cả thương nguyên lẫn số dư chỉ trong 1 phép tính CPU duy nhất! Hãy viết hàm `format_duration_and_pages(total_minutes: int, total_items: int, page_size: int) -> str` sử dụng `divmod()` để đổi `total_minutes` ra `hours, minutes` và công thức trần `(total_items + page_size - 1) // page_size` để tính tổng số trang.',
    realWorldContext:
      'Tính toán phân trang API (Pagination) và hiển thị thời lượng video/khóa học là tác vụ hàng ngày ở Backend. Dùng `divmod` và `//` giúp mã vừa gọn vừa tránh sai số dấu phẩy động khi không cần import `math.ceil`.',
    requirements: [
      'Dùng `hours, minutes = divmod(total_minutes, 60)` để tách giờ và phút',
      'Tính tổng số trang bằng phép chia nguyên `pages = (total_items + page_size - 1) // page_size`',
      'Trả về chuỗi `f"{hours:02d}h:{minutes:02d}m | Pages: {pages}"`',
    ],
    starterCode: `def format_duration_and_pages(total_minutes: int, total_items: int, page_size: int) -> str:
    # TODO: Dùng divmod(total_minutes, 60) để lấy hours, minutes
    # TODO: Tính pages bằng toán tử // và trả về f"{hours:02d}h:{minutes:02d}m | Pages: {pages}"
    pass
`,
    solutionCode: `def format_duration_and_pages(total_minutes: int, total_items: int, page_size: int) -> str:
    hours, minutes = divmod(total_minutes, 60)
    pages = (total_items + page_size - 1) // page_size
    return f"{hours:02d}h:{minutes:02d}m | Pages: {pages}"
`,
    hints: [
      'Gợi ý 1: Giải nén trực tiếp kết quả `hours, minutes = divmod(total_minutes, 60)`.',
      'Gợi ý 2: Tính số trang làm tròn lên bằng số học nguyên: `pages = (total_items + page_size - 1) // page_size`.',
      'Gợi ý 3: Trả về `f"{hours:02d}h:{minutes:02d}m | Pages: {pages}"`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Lấy cả thương nguyên và số dư bằng `divmod()`',
        codeSnippet: `    hours, minutes = divmod(total_minutes, 60)`,
        explanation:
          '`divmod(135, 60)` trả về tuple `(2, 15)` tương đương `(135 // 60, 135 % 60)` nhưng chỉ thực hiện lệnh chia phần cứng một lần.',
      },
      {
        stepTitle: 'Bước 2: Tính Ceiling Division thuần số nguyên bằng `//`',
        codeSnippet: `    pages = (total_items + page_size - 1) // page_size`,
        explanation:
          'Với `total_items = 95, page_size = 10`, biểu thức `(95 + 9) // 10` cho ra đúng `10` trang (và khi `total_items = 0`, `(0 + 9) // 10` cho ra `0` trang an toàn tuyệt đối).',
      },
    ],
    commonMistakes: [
      'Dùng phép chia `/` một gạch chéo (`total_minutes / 60`) trả về kiểu `float` (`2.25`), gây lỗi `ValueError` khi định dạng `:02d`.',
      'Quên ngoặc tròn quanh `(total_items + page_size - 1)` khiến `//` chỉ chia riêng `page_size - 1`.',
    ],
    testCases: [
      {
        id: 'tc-s0-4-divmod',
        description: 'Quy đổi chính xác thời lượng với divmod() và tính phân trang bằng //',
        inputDescription: 'format_duration_and_pages(135, 95, 10)',
        expectedOutput: "'02h:15m | Pages: 10'",
        requiredPatterns: ['divmod(total_minutes, 60)', '// page_size', ':02d}h:{minutes:02d}m'],
        forbiddenPatterns: [
          {
            pattern: 'Math.floor',
            reason: 'Đây là cú pháp JavaScript! Trong Python hãy dùng `//` hoặc `divmod()`.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s0-chained-comparison',
    title: 'Bài 5: Viết lại Biểu thức Khoảng Giá trị bằng So sánh Bắc cầu (Chained Comparison)',
    category: 'js-to-py',
    stageId: 'stage-1',
    level: 'fundamental',
    relatedLessonId: 's0-syntax-primitives-operators-flow',
    problemStatement:
      'Trong C/Java/JS, để kiểm tra `x` nằm trong đoạn `[min_val, max_val]`, bạn buộc phải viết `x >= min_val && x <= max_val` (vì viết `min_val <= x <= max_val` trong JS sẽ tính `(min_val <= x)` ra `true/false` rồi đem ép sang `0/1` để so sánh với `max_val` gây bug ngầm cực kỳ nguy hiểm!). Python hỗ trợ **Chained Comparison** đúng chuẩn toán học. Hãy viết lại hàm `classify_heart_rate(bpm: int) -> str` sử dụng so sánh bắc cầu.',
    realWorldContext:
      'Khi viết các bộ quy tắc nghiệp vụ (Business Rules), chấm điểm tín dụng, phân loại chỉ số y tế hoặc kiểm tra ngưỡng cảm biến IoT, Chained Comparison giúp code đọc tự nhiên y hệt công thức toán học và chỉ tính toán biểu thức ở giữa đúng 1 lần.',
    requirements: [
      'Sử dụng `60 <= bpm <= 100` để trả về `"NORMAL"`',
      'Sử dụng `100 < bpm <= 160` để trả về `"ELEVATED"`',
      'Trả về `"CRITICAL"` cho các trường hợp còn lại',
    ],
    starterCode: `def classify_heart_rate(bpm: int) -> str:
    # TODO: Viết lại các điều kiện dùng Chained Comparison (không dùng từ khóa 'and')
    if bpm >= 60 and bpm <= 100:
        return "NORMAL"
    elif bpm > 100 and bpm <= 160:
        return "ELEVATED"
    return "CRITICAL"
`,
    solutionCode: `def classify_heart_rate(bpm: int) -> str:
    if 60 <= bpm <= 100:
        return "NORMAL"
    elif 100 < bpm <= 160:
        return "ELEVATED"
    return "CRITICAL"
`,
    hints: [
      'Gợi ý 1: Thay `bpm >= 60 and bpm <= 100` bằng biểu thức toán học liền mạch `60 <= bpm <= 100`.',
      'Gợi ý 2: Thay `bpm > 100 and bpm <= 160` bằng `100 < bpm <= 160`.',
      'Gợi ý 3: Đảm bảo không còn từ khóa `and` nào trong hàm.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Áp dụng Chained Comparison cho khoảng đóng `[60, 100]`',
        codeSnippet: `    if 60 <= bpm <= 100:\n        return "NORMAL"`,
        explanation:
          'CPython dịch `60 <= bpm <= 100` thành kiểm tra bắc cầu nhưng chỉ đánh giá biến/biểu thức `bpm` đúng 1 lần duy nhất trên ngăn xếp.',
      },
      {
        stepTitle: 'Bước 2: Áp dụng Chained Comparison cho khoảng nửa mở `(100, 160]`',
        codeSnippet: `    elif 100 < bpm <= 160:\n        return "ELEVATED"`,
        explanation:
          'Kết hợp linh hoạt cả toán tử `<` và `<=` trong cùng một chuỗi so sánh mà không cần lặp lại biến `bpm`.',
      },
    ],
    commonMistakes: [
      'Vẫn giữ từ khóa `and` nối hai vế rời rạc làm mã dài dòng.',
      'Viết ngược chiều so sánh như `60 >= bpm <= 100` khiến biểu thức khó đọc.',
    ],
    testCases: [
      {
        id: 'tc-s0-5-chain',
        description: 'Sử dụng Chained Comparison 60 <= bpm <= 100 và 100 < bpm <= 160',
        inputDescription: 'classify_heart_rate(75), classify_heart_rate(120), classify_heart_rate(50)',
        expectedOutput: "'NORMAL', 'ELEVATED', 'CRITICAL'",
        requiredPatterns: ['60 <= bpm <= 100', '100 < bpm <= 160'],
        forbiddenPatterns: [
          {
            pattern: ' and ',
            reason: 'Hãy sử dụng Chained Comparison (`a <= x <= b`) thay vì nối bằng từ khóa `and`!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s0-walrus-chunk',
    title: 'Bài 6: Tinh gọn Vòng lặp Đọc Luồng Dữ liệu bằng Toán tử Hải mã := (Walrus Operator)',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's0-versions-install-switch-run',
    problemStatement:
      'Trước Python 3.8, khi đọc từng khối dữ liệu hoặc lấy phần tử từ hàng đợi cho đến khi gặp chuỗi rỗng `""`, bạn phải viết vòng lặp `while True:` rồi gọi `chunk = ...` và `if not chunk: break` tốn 4 dòng code. Hãy sử dụng **Toán tử Hải mã `:=` (Assignment Expression - PEP 572)** để vừa lấy dữ liệu bằng `pop(0)`, vừa kiểm tra điều kiện khác chuỗi rỗng ngay trong đầu dòng `while`, thu thập độ dài của từng khối đã `.strip()` vào danh sách kết quả.',
    realWorldContext:
      'Khi đọc file nhị phân theo từng block `while chunk := f.read(8192):` hoặc xử lý message queue, toán tử `:=` giúp loại bỏ hoàn toàn mẫu code lặp (loop-and-a-half boilerplate).',
    requirements: [
      'Sử dụng toán tử gán trong biểu thức `while (chunk := stream.pop(0)) != "":` (hoặc `while chunk := stream.pop(0):`)',
      'Thêm độ dài `len(chunk.strip())` của mỗi chunk vào danh sách `sizes`',
      'Trả về danh sách `sizes` (dừng ngay khi gặp phần tử `""`)',
    ],
    starterCode: `def collect_chunk_sizes(stream: list[str]) -> list[int]:
    sizes: list[int] = []
    # TODO: Thay thế khối while True dài dòng dưới đây bằng 2 dòng với toán tử ':='
    while True:
        chunk = stream.pop(0)
        if not chunk:
            break
        sizes.append(len(chunk.strip()))
    return sizes
`,
    solutionCode: `def collect_chunk_sizes(stream: list[str]) -> list[int]:
    sizes: list[int] = []
    while chunk := stream.pop(0):
        sizes.append(len(chunk.strip()))
    return sizes
`,
    hints: [
      'Gợi ý 1: Xóa bỏ `while True:` và lệnh `if not chunk: break`.',
      'Gợi ý 2: Viết trực tiếp `while chunk := stream.pop(0):` — toán tử `:=` sẽ gán giá trị vào `chunk` rồi dùng chính giá trị đó để xét Truthy/Falsy cho `while`.',
      'Gợi ý 3: Bên trong vòng lặp chỉ cần duy nhất 1 dòng `sizes.append(len(chunk.strip()))`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Gán và kiểm tra đồng thời với `while chunk := stream.pop(0):`',
        codeSnippet: `    while chunk := stream.pop(0):`,
        explanation:
          'Mỗi vòng lặp, `stream.pop(0)` lấy phần tử đầu tiên gán vào `chunk`. Nếu `chunk` là chuỗi khác rỗng (Truthy), vòng lặp tiếp tục; nếu gặp `""` (Falsy), vòng lặp tự động kết thúc.',
      },
      {
        stepTitle: 'Bước 2: Xử lý biến `chunk` ngay trong thân vòng lặp',
        codeSnippet: `        sizes.append(len(chunk.strip()))\n    return sizes`,
        explanation:
          'Biến `chunk` đã có sẵn giá trị vừa lấy ra mà không cần gọi lại `.pop(0)` lần thứ hai.',
      },
    ],
    commonMistakes: [
      'Dùng dấu `=` đơn (`while chunk = stream.pop(0):`) gây lỗi cú pháp `SyntaxError` vì Python cấm toán tử gán thường bên trong biểu thức điều kiện.',
      'Quên bao ngoặc khi kết hợp `:=` với toán tử so sánh: nếu viết `while chunk := stream.pop(0) != "":` thì `chunk` sẽ nhận giá trị `True/False` thay vì chuỗi! Phải viết `while chunk := stream.pop(0):` hoặc `while (chunk := stream.pop(0)) != "":`.',
    ],
    testCases: [
      {
        id: 'tc-s0-6-walrus',
        description: 'Sử dụng toán tử := trong điều kiện while không cần while True/break',
        inputDescription: 'collect_chunk_sizes([" hello ", "world", "", "ignored"])',
        expectedOutput: '[5, 5]',
        requiredPatterns: ['while ', ':=', 'stream.pop(0)', 'sizes.append(len(chunk.strip()))'],
        forbiddenPatterns: [
          {
            pattern: 'while True',
            reason: 'Hãy thay thế `while True:` và `break` bằng `while chunk := stream.pop(0):`!',
          },
          {
            pattern: 'break',
            reason: 'Không cần dùng `break` khi đã có toán tử `:=` trên dòng `while`!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s0-match-case-http',
    title: 'Bài 7: Phân tích Phản hồi API bằng Structural Pattern Matching (match ... case)',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's0-versions-install-switch-run',
    problemStatement:
      'Khác với `switch/case` cổ điển của JS/Java chỉ so sánh giá trị đơn lẻ, câu lệnh `match ... case` (ra mắt từ Python 3.10 - PEP 634) là **Structural Pattern Matching**: nó có thể đối sánh hình dáng cấu trúc của `dict`/`tuple`, trích xuất biến trực tiếp và kiểm tra điều kiện bảo vệ (`if` guard). Hãy viết hàm `parse_api_response(response: dict) -> str` dùng `match response:` để phân loại phản hồi API.',
    realWorldContext:
      'Khi tích hợp Webhook từ cổng thanh toán hoặc LLM API, payload trả về có nhiều cấu trúc khác nhau tùy trạng thái. `match ... case` giúp bóc tách cấu trúc JSON lồng nhau cực kỳ thanh lịch mà không cần chuỗi `if/elif isinstance(...)` rối rắm.',
    requirements: [
      'Case 1: khớp `{"status": 200, "data": {"user": str(username)}}` -> trả về `f"Welcome {username}"`',
      'Case 2: khớp `{"status": int(code), "error": str(msg)} if code >= 400` -> trả về `f"Error {code}: {msg}"`',
      'Case mặc định `case _:` -> trả về `"Unknown response format"`',
    ],
    starterCode: `def parse_api_response(response: dict) -> str:
    # TODO: Sử dụng match response: và các nhánh case để đối sánh cấu trúc dict
    pass
`,
    solutionCode: `def parse_api_response(response: dict) -> str:
    match response:
        case {"status": 200, "data": {"user": str(username)}}:
            return f"Welcome {username}"
        case {"status": int(code), "error": str(msg)} if code >= 400:
            return f"Error {code}: {msg}"
        case _:
            return "Unknown response format"
`,
    hints: [
      'Gợi ý 1: Mở đầu bằng `match response:` rồi thụt lề viết các nhánh `case`.',
      'Gợi ý 2: Nhánh thành công viết `case {"status": 200, "data": {"user": str(username)}}:` để vừa kiểm tra kiểu `str` vừa gán vào biến `username`.',
      'Gợi ý 3: Nhánh lỗi có guard: `case {"status": int(code), "error": str(msg)} if code >= 400:` và kết thúc bằng `case _:`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Đối sánh sâu cấu trúc Dictionary lồng nhau và kiểm tra kiểu',
        codeSnippet: `    match response:\n        case {"status": 200, "data": {"user": str(username)}}:\n            return f"Welcome {username}"`,
        explanation:
          'Mẫu `str(username)` bên trong `case` KHÔNG phải là ép kiểu mà là Pattern kiểm tra `isinstance(val, str)` và tự động giải nén giá trị đó vào biến `username`!',
      },
      {
        stepTitle: 'Bước 2: Kết hợp Guard Condition `if code >= 400` và Wildcard `case _:`',
        codeSnippet: `        case {"status": int(code), "error": str(msg)} if code >= 400:\n            return f"Error {code}: {msg}"\n        case _:\n            return "Unknown response format"`,
        explanation:
          'Khác với JS/C, `match ... case` trong Python không bị trôi nhánh (no fall-through) nên không cần từ khóa `break`, và `case _:` đóng vai trò tương tự `default:`.',
      },
    ],
    commonMistakes: [
      'Viết `default:` như trong JavaScript thay vì `case _:` của Python.',
      'Thêm lệnh `break` ở cuối mỗi nhánh `case` (trong Python `match ... case` tự động thoát khi khớp nhánh đầu tiên).',
    ],
    testCases: [
      {
        id: 'tc-s0-7-match',
        description: 'Đối sánh chính xác cấu trúc dict lồng nhau, điều kiện guard và nhánh mặc định case _',
        inputDescription: 'parse_api_response({"status": 200, "data": {"user": "Alice"}})',
        expectedOutput: "'Welcome Alice'",
        requiredPatterns: ['match response:', 'case {"status": 200', 'if code >= 400:', 'case _:'],
        forbiddenPatterns: [
          {
            pattern: 'elif ',
            reason: 'Bài tập này yêu cầu sử dụng Structural Pattern Matching (`match ... case`), không dùng `if/elif`!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s0-for-else-search',
    title: 'Bài 8: Giải đố Cú pháp for ... else — Tìm kiếm Không cần Biến Cờ (found = False)',
    category: 'brain-teaser',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's0-syntax-primitives-operators-flow',
    problemStatement:
      'Một trong những cú pháp độc đáo nhất của Python khiến lập trình viên từ ngôn ngữ khác bối rối là khối `else:` gắn trực tiếp vào vòng lặp `for`! Quy tắc: Khối `else:` của `for` CHỈ chạy khi vòng lặp chạy hết tự nhiên mà **không gặp lệnh `break` nào** (hãy đọc `else` ở đây là `no-break`). Hãy tái cấu trúc hàm `verify_batch_tokens(tokens: list[str]) -> str` để kiểm tra danh sách token mà không cần biến cờ `has_invalid = False`.',
    realWorldContext:
      'Khi quét tìm phần tử vi phạm hoặc kiểm tra số nguyên tố, dev C/JS luôn phải khai báo biến cờ `let found = false`, gán `found = true; break;` rồi ra ngoài kiểm tra `if (!found)`. Cú pháp `for ... else` của Python giúp loại bỏ hoàn toàn biến trạng thái tạm thời này.',
    requirements: [
      'Duyệt `for token in tokens:` và nếu `not token.startswith("py_")` thì gán `report = f"Invalid: {token}"` rồi `break`',
      'Sử dụng khối `else:` gắn cùng cấp với `for` để gán `report = "All tokens verified"` khi không có `break`',
      'Tuyệt đối không dùng biến cờ `has_invalid`',
    ],
    starterCode: `def verify_batch_tokens(tokens: list[str]) -> str:
    # TODO: Xóa bỏ biến cờ has_invalid và dùng cấu trúc for ... else chuẩn Pythonic
    has_invalid = False
    report = ""
    for token in tokens:
        if not token.startswith("py_"):
            report = f"Invalid: {token}"
            has_invalid = True
            break
    if not has_invalid:
        report = "All tokens verified"
    return report
`,
    solutionCode: `def verify_batch_tokens(tokens: list[str]) -> str:
    for token in tokens:
        if not token.startswith("py_"):
            report = f"Invalid: {token}"
            break
    else:
        report = "All tokens verified"
    return report
`,
    hints: [
      'Gợi ý 1: Xóa dòng `has_invalid = False` và `has_invalid = True`.',
      'Gợi ý 2: Giữ nguyên lệnh `break` bên trong `if not token.startswith("py_"):`.',
      'Gợi ý 3: Thay `if not has_invalid:` bằng `else:` đặt thẳng hàng dọc với từ khóa `for`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Thoát sớm bằng `break` khi phát hiện token lỗi',
        codeSnippet: `    for token in tokens:\n        if not token.startswith("py_"):\n            report = f"Invalid: {token}"\n            break`,
        explanation:
          'Nếu gặp bất kỳ token nào không bắt đầu bằng `"py_"`, lệnh `break` sẽ nhảy thẳng qua cả vòng lặp `for` lẫn khối `else:` đi kèm.',
      },
      {
        stepTitle: 'Bước 2: Xử lý trường hợp "không có break" trong khối `else:` của `for`',
        codeSnippet: `    else:\n        report = "All tokens verified"\n    return report`,
        explanation:
          'Khi vòng lặp duyệt hết 100% phần tử (hoặc danh sách rỗng) mà không chạm vào `break`, khối `else:` sẽ tự động thực thi.',
      },
    ],
    commonMistakes: [
      'Thụt lề `else:` ngang hàng với `if` bên trong vòng lặp thay vì đặt ngang hàng với `for`!',
      'Tưởng nhầm rằng `else:` của `for` chỉ chạy khi danh sách rỗng (thực tế nó chạy mỗi khi vòng lặp kết thúc mà không bị `break`).',
    ],
    testCases: [
      {
        id: 'tc-s0-8-forelse',
        description: 'Sử dụng cấu trúc for ... else kết hợp break mà không dùng biến cờ has_invalid',
        inputDescription: 'verify_batch_tokens(["py_1", "py_2"]), verify_batch_tokens(["py_1", "js_9"])',
        expectedOutput: "'All tokens verified', 'Invalid: js_9'",
        requiredPatterns: ['for token in tokens:', 'break', 'else:', '"All tokens verified"'],
        forbiddenPatterns: [
          {
            pattern: 'has_invalid',
            reason: 'Hãy loại bỏ hoàn toàn biến cờ `has_invalid` và dùng cấu trúc `for ... else`!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s0-string-cleaning',
    title: 'Bài 9: Chuẩn hóa Slug URL bằng strip(), lower(), split() và "-".join()',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'fundamental',
    relatedLessonId: 's0-syntax-primitives-operators-flow',
    problemStatement:
      'Khi người dùng nhập tiêu đề bài viết `"   Python 3.12   Zero   To  Master!   "`, có rất nhiều khoảng trắng thừa ở hai đầu và ở giữa các từ. Nếu bạn gọi `.split(" ")` (truyền khoảng trắng đơn như trong JS), các khoảng trắng liên tiếp sẽ sinh ra hàng loạt chuỗi rỗng `""`! Nhưng trong Python, gọi `.split()` **không truyền đối số** sẽ tự động cắt mọi khoảng trắng liên tiếp (`\\t`, `\\n`, nhiều dấu cách) và gộp gọn gàng. Hãy viết hàm `slugify_title(raw_title: str) -> str` để tạo URL slug chuẩn.',
    realWorldContext:
      'Xử lý chuỗi đầu vào từ form người dùng để tạo đường dẫn SEO-friendly (`/posts/python-3.12-zero-to-master`) là hàm tiện ích cơ bản trong mọi Web Backend (Django/FastAPI).',
    requirements: [
      'Chuyển chuỗi về chữ thường bằng `.lower()` và loại bỏ dấu chấm than `"!"` bằng `.replace("!", "")`',
      'Tách từ bằng `.split()` (không truyền tham số để tự động loại bỏ mọi khoảng trắng thừa ở đầu, cuối và giữa)',
      'Nối các từ lại bằng dấu gạch ngang `"-".join(...)`',
    ],
    starterCode: `def slugify_title(raw_title: str) -> str:
    # TODO: Chuẩn hóa raw_title thành chữ thường, bỏ dấu "!", tách từ bằng .split() và nối bằng "-".join()
    pass
`,
    solutionCode: `def slugify_title(raw_title: str) -> str:
    words = raw_title.lower().replace("!", "").split()
    return "-".join(words)
`,
    hints: [
      'Gợi ý 1: Gọi chuỗi phương thức `raw_title.lower().replace("!", "").split()`.',
      'Gợi ý 2: Lưu ý gọi `.split()` với ngoặc rỗng, KHÔNG truyền `" "` vào bên trong.',
      'Gợi ý 3: Dùng `"-".join(words)` để nối danh sách các từ thành chuỗi slug.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Chuẩn hóa chữ thường, lọc ký tự đặc biệt và tách từ thông minh với `.split()`',
        codeSnippet: `    words = raw_title.lower().replace("!", "").split()`,
        explanation:
          'Khác với `split(" ")`, thuật toán mặc định của `str.split()` trong Python tự động `strip()` hai đầu và coi mọi cụm khoảng trắng liên tiếp là một điểm cắt duy nhất.',
      },
      {
        stepTitle: 'Bước 2: Ghép nối danh sách từ bằng `"-".join(words)`',
        codeSnippet: `    return "-".join(words)`,
        explanation:
          'Trong Python, phương thức `.join()` thuộc về chuỗi phân cách `"-"` (ngược với `words.join("-")` của JavaScript) và cấp phát bộ nhớ đúng 1 lần cho toàn bộ chuỗi đích.',
      },
    ],
    commonMistakes: [
      'Viết `words.join("-")` theo thói quen JavaScript gây lỗi `AttributeError: "list" object has no attribute "join"`.',
      'Truyền `.split(" ")` khiến chuỗi có nhiều dấu cách liên tiếp sinh ra kết quả `"python---zero--to-master"`.',
    ],
    testCases: [
      {
        id: 'tc-s0-9-slug',
        description: 'Tạo slug chuẩn từ tiêu đề có nhiều khoảng trắng thừa bằng .split() và "-".join()',
        inputDescription: 'slugify_title("   Python 3.12   Zero   To  Master!   ")',
        expectedOutput: "'python-3.12-zero-to-master'",
        requiredPatterns: ['.lower()', '.replace("!", "")', '.split()', '"-".join('],
        forbiddenPatterns: [
          {
            pattern: '.split(" ")',
            reason: 'Không dùng `.split(" ")` vì sẽ giữ lại các chuỗi rỗng khi có nhiều dấu cách liên tiếp! Hãy dùng `.split()` không đối số.',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s0-banker-rounding',
    title: 'Bài 10: Giải đố Làm tròn Số round(2.5) vs Decimal.quantize(ROUND_HALF_UP)',
    category: 'brain-teaser',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's0-syntax-primitives-operators-flow',
    problemStatement:
      'Đố bạn: trong Python 3, `round(2.5)` và `round(3.5)` trả về bao nhiêu? Trong JS, `Math.round(2.5)` trả về `3`, nhưng trong Python 3, `round(2.5)` lại trả về **`2`** còn `round(3.5)` trả về **`4`**! Đó là thuật toán **Round Half to Even (Banker\'s Rounding)**: khi phần lẻ đúng bằng `.5`, Python làm tròn về số nguyên **chẵn** gần nhất để triệt tiêu sai số thống kê. Tuy nhiên, khi in hóa đơn bán lẻ, khách hàng yêu cầu quy tắc toán học phổ thông (`.5` luôn làm tròn lên). Hãy viết hàm `compare_rounding(val_str: str) -> tuple[int, Decimal]` trả về kết quả của cả `round(float(val_str))` và `Decimal(val_str).quantize(Decimal("1"), rounding=ROUND_HALF_UP)`.',
    realWorldContext:
      'Rất nhiều lập trình viên Backend gặp bug lệch 1 đồng trên hóa đơn VAT khi chuyển hệ thống từ Node.js/Java sang Python vì không biết hàm `round()` mặc định của Python dùng Banker\'s Rounding thay vì Round Half Up.',
    requirements: [
      'Tính `banker_val = round(float(val_str))` (làm tròn về số chẵn gần nhất)',
      'Tính `retail_val = Decimal(val_str).quantize(Decimal("1"), rounding=ROUND_HALF_UP)`',
      'Trả về tuple `(banker_val, retail_val)`',
    ],
    starterCode: `from decimal import Decimal, ROUND_HALF_UP

def compare_rounding(val_str: str) -> tuple[int, Decimal]:
    # TODO: Tính banker_val bằng round(float(val_str))
    # và retail_val bằng Decimal(val_str).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    pass
`,
    solutionCode: `from decimal import Decimal, ROUND_HALF_UP

def compare_rounding(val_str: str) -> tuple[int, Decimal]:
    banker_val = round(float(val_str))
    retail_val = Decimal(val_str).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return (banker_val, retail_val)
`,
    hints: [
      'Gợi ý 1: Tính `banker_val = round(float(val_str))` để thấy hành vi Round Half to Even.',
      'Gợi ý 2: Khởi tạo `Decimal(val_str)` và gọi `.quantize(Decimal("1"), rounding=ROUND_HALF_UP)`.',
      'Gợi ý 3: Trả về `return (banker_val, retail_val)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Quan sát Banker\'s Rounding mặc định của `round()`',
        codeSnippet: `    banker_val = round(float(val_str))`,
        explanation:
          'Với `val_str = "2.5"`, `round(2.5)` trả về `2` (vì 2 là số chẵn). Quy tắc này giúp tổng của hàng triệu phép làm tròn không bị lệch dương.',
      },
      {
        stepTitle: 'Bước 2: Ép quy tắc làm tròn thương mại `ROUND_HALF_UP` bằng `Decimal.quantize`',
        codeSnippet: `    retail_val = Decimal(val_str).quantize(Decimal("1"), rounding=ROUND_HALF_UP)\n    return (banker_val, retail_val)`,
        explanation:
          'Với `ROUND_HALF_UP`, `Decimal("2.5")` luôn được làm tròn ra xa số 0 thành `Decimal("3")`, đúng chuẩn hóa đơn bán lẻ.',
      },
    ],
    commonMistakes: [
      'Dùng `round()` mặc định của Python cho nghiệp vụ hóa đơn bán lẻ khiến các giá trị `.5` chẵn bị làm tròn xuống.',
      'Quên truyền `Decimal("1")` làm mẫu bậc thập phân đầu tiên cho phương thức `.quantize()`.',
    ],
    testCases: [
      {
        id: 'tc-s0-10-rounding',
        description: 'Trả về (2, Decimal("3")) khi truyền "2.5" nhờ phân biệt Banker Rounding và ROUND_HALF_UP',
        inputDescription: 'compare_rounding("2.5")',
        expectedOutput: "(2, Decimal('3'))",
        requiredPatterns: ['round(float(val_str))', 'Decimal(val_str).quantize(', 'Decimal("1")', 'ROUND_HALF_UP'],
      },
    ],
  },
  {
    id: 'ex-s0-ternary-expression',
    title: 'Bài 11: Chuyển đổi Toán tử 3 Ngôi JS (cond ? a : b) sang Biểu thức Điều kiện Python (a if cond else b)',
    category: 'js-to-py',
    stageId: 'stage-1',
    level: 'fundamental',
    relatedLessonId: 's0-syntax-primitives-operators-flow',
    problemStatement:
      'Trong C/Java/JavaScript, toán tử 3 ngôi có dạng `condition ? true_val : false_val`. Guido van Rossum (cha đẻ Python) đã từ chối cú pháp `? :` vì quá nhiều ký hiệu khó đọc và thiết kế **Conditional Expression** đọc xuôi như tiếng Anh: `true_val if condition else false_val`. Hãy viết lại hàm `get_shipping_tier(order_total: float, is_vip: bool) -> str` sử dụng biểu thức điều kiện 1 dòng: trả về `"FREE_EXPRESS"` nếu `is_vip or order_total >= 100.0`, ngược lại trả về `"STANDARD"`.',
    realWorldContext:
      'Biểu thức điều kiện `a if cond else b` xuất hiện dày đặc trong List Comprehension, gán giá trị cấu hình mặc định và trả về nhanh trong các hàm mapper/serializer.',
    requirements: [
      'Viết câu lệnh `return` trên 1 dòng sử dụng cú pháp `"FREE_EXPRESS" if is_vip or order_total >= 100.0 else "STANDARD"`',
      'Sử dụng toán tử logic `or` của Python thay vì `||` của JS',
    ],
    starterCode: `def get_shipping_tier(order_total: float, is_vip: bool) -> str:
    # Trong JS: return (is_vip || order_total >= 100.0) ? "FREE_EXPRESS" : "STANDARD";
    # TODO: Viết lại bằng Conditional Expression 1 dòng của Python
    pass
`,
    solutionCode: `def get_shipping_tier(order_total: float, is_vip: bool) -> str:
    return "FREE_EXPRESS" if is_vip or order_total >= 100.0 else "STANDARD"
`,
    hints: [
      'Gợi ý 1: Đặt giá trị khi đúng (`"FREE_EXPRESS"`) lên đầu tiên sau từ khóa `return`.',
      'Gợi ý 2: Tiếp theo là điều kiện `if is_vip or order_total >= 100.0`.',
      'Gợi ý 3: Kết thúc bằng nhánh `else "STANDARD"` (không có dấu hai chấm `:`).',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Đặt kết quả chính (Happy Path) lên đầu biểu thức',
        codeSnippet: `    return "FREE_EXPRESS" if is_vip or order_total >= 100.0 else "STANDARD"`,
        explanation:
          'Cú pháp `X if C else Y` nhấn mạnh vào giá trị phổ biến `X` trước, sau đó nêu điều kiện `C` và giá trị dự phòng `Y`. Python đánh giá lười (short-circuit): chỉ tính nhánh được chọn.',
      },
      {
        stepTitle: 'Bước 2: Dùng từ khóa tiếng Anh `or` thay vì ký hiệu `||`',
        codeSnippet: `is_vip or order_total >= 100.0`,
        explanation:
          'Mọi toán tử logic trong Python đều là từ khóa tường minh: `and`, `or`, `not` thay vì `&&`, `||`, `!`.',
      },
    ],
    commonMistakes: [
      'Dùng ký hiệu `?` và `:` hoặc `||` của JavaScript gây lỗi `SyntaxError`.',
      'Quên vế `else` — trong biểu thức điều kiện Python, vế `else` là BẮT BUỘC (vì mọi biểu thức đều phải trả về một giá trị ở mọi trường hợp).',
    ],
    testCases: [
      {
        id: 'tc-s0-11-ternary',
        description: 'Sử dụng đúng biểu thức điều kiện 1 dòng a if cond else b',
        inputDescription: 'get_shipping_tier(50.0, True), get_shipping_tier(80.0, False)',
        expectedOutput: "'FREE_EXPRESS', 'STANDARD'",
        requiredPatterns: ['return "FREE_EXPRESS" if ', 'is_vip or order_total >= 100.0', ' else "STANDARD"'],
        forbiddenPatterns: [
          {
            pattern: '?',
            reason: 'Python không có toán tử `? :`! Hãy dùng `true_val if condition else false_val`.',
          },
          {
            pattern: '||',
            reason: 'Python dùng từ khóa `or` thay vì `||` của JavaScript!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s0-swap-unpack',
    title: 'Bài 12: Hoán đổi Biến & Cắt Đầu-Đuôi Danh sách bằng Tuple Unpacking (a, b = b, a & head, *body, tail)',
    category: 'js-to-py',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Trong JS, destructuring `const [head, ...rest] = arr` chỉ cho phép `...rest` đứng ở **cuối cùng**. Nhưng Extended Iterable Unpacking của Python (PEP 3132) cho phép toán tử sao `*body` đứng ở **giữa**, giúp bạn lấy đồng thời phần tử đầu `head`, phần tử cuối `tail` và toàn bộ phần thân `body` chỉ trong 1 dòng! Hơn nữa, hoán đổi 2 biến chỉ cần `a, b = b, a` nhờ lệnh bytecode `SWAP`. Hãy viết hàm `rotate_ends_and_extract(records: list[int]) -> tuple[int, list[int], int]` để tách `head, *body, tail = records` rồi hoán đổi `head, tail = tail, head` và trả về `(head, body, tail)`.',
    realWorldContext:
      'Khi xử lý dữ liệu bảng (CSV/Excel) hoặc gói tin mạng có Header ở dòng đầu, Footer/Checksum ở dòng cuối và Payload ở giữa, cú pháp `header, *rows, footer = lines` giúp bóc tách cấu trúc cực kỳ rõ ràng.',
    requirements: [
      'Sử dụng Extended Unpacking `head, *body, tail = records` để tách đầu, thân và đuôi',
      'Hoán đổi giá trị đầu và đuôi tại chỗ bằng `head, tail = tail, head` (không dùng biến tạm `temp`)',
      'Trả về tuple `(head, body, tail)`',
    ],
    starterCode: `def rotate_ends_and_extract(records: list[int]) -> tuple[int, list[int], int]:
    # TODO: Giải nén head, *body, tail = records
    # TODO: Hoán đổi head, tail = tail, head và trả về (head, body, tail)
    pass
`,
    solutionCode: `def rotate_ends_and_extract(records: list[int]) -> tuple[int, list[int], int]:
    head, *body, tail = records
    head, tail = tail, head
    return (head, body, tail)
`,
    hints: [
      'Gợi ý 1: Dòng đầu tiên viết `head, *body, tail = records`.',
      'Gợi ý 2: Dòng thứ hai hoán đổi trực tiếp `head, tail = tail, head`.',
      'Gợi ý 3: Trả về `return (head, body, tail)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Bóc tách phần tử đầu, phần giữa và phần cuối bằng `*body`',
        codeSnippet: `    head, *body, tail = records`,
        explanation:
          'Biến có dấu `*` (`*body`) sẽ tự động gom toàn bộ các phần tử thừa ở giữa vào một `list` (ngay cả khi chỉ có 2 phần tử trong `records` thì `body` sẽ là `[]` an toàn!).',
      },
      {
        stepTitle: 'Bước 2: Hoán đổi hai biến bằng Tuple Unpacking không cần biến tạm',
        codeSnippet: `    head, tail = tail, head\n    return (head, body, tail)`,
        explanation:
          'CPython đánh giá vế phải `tail, head` đẩy lên Stack rồi dùng chỉ thị `SWAP` gán ngược vào `head, tail` mà không cần biến `temp`.',
      },
    ],
    commonMistakes: [
      'Dùng cú pháp `...body` của JavaScript thay vì `*body` của Python.',
      'Khai báo biến tạm `temp = head; head = tail; tail = temp` rườm rà.',
    ],
    testCases: [
      {
        id: 'tc-s0-12-unpack',
        description: 'Giải nén bằng head, *body, tail và hoán đổi bằng head, tail = tail, head',
        inputDescription: 'rotate_ends_and_extract([10, 20, 30, 40, 50])',
        expectedOutput: '(50, [20, 30, 40], 10)',
        requiredPatterns: ['head, *body, tail = records', 'head, tail = tail, head'],
        forbiddenPatterns: [
          {
            pattern: 'temp',
            reason: 'Không cần dùng biến tạm `temp` trong Python — hãy dùng `head, tail = tail, head`!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s0-slice-reverse-step',
    title: 'Bài 13: Nghệ thuật Slicing s[start:stop:step] — Đảo chuỗi, Lấy phần tử Chẵn & Cửa sổ Cuối',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Trong JavaScript, để đảo ngược chuỗi bạn phải gọi `str.split("").reverse().join("")`. Trong Python, toán tử Slicing 3 tham số `seq[start:stop:step]` cho phép làm việc đó chỉ với `seq[::-1]`! Hãy viết hàm `analyze_sequence(code: str) -> dict[str, str]` trả về từ điển gồm 3 khóa: `"reversed"` (chuỗi đảo ngược bằng `[::-1]`), `"even_chars"` (các ký tự ở chỉ số chẵn `0, 2, 4...` bằng `[::2]`), và `"last_three"` (3 ký tự cuối cùng bằng `[-3:]`).',
    realWorldContext:
      'Cú pháp Slicing `[start:stop:step]` là nền tảng không chỉ của `str`, `list`, `tuple` trong Python chuẩn mà còn là cú pháp cốt lõi để cắt mảng đa chiều (Tensor/Matrix) trong NumPy, Pandas và PyTorch.',
    requirements: [
      'Lấy chuỗi đảo ngược bằng `code[::-1]`',
      'Lấy các ký tự ở vị trí chẵn bằng `code[::2]`',
      'Lấy 3 ký tự cuối bằng `code[-3:]` và trả về dict chứa đủ 3 khóa',
    ],
    starterCode: `def analyze_sequence(code: str) -> dict[str, str]:
    # TODO: Trả về dict với "reversed" (code[::-1]), "even_chars" (code[::2]) và "last_three" (code[-3:])
    pass
`,
    solutionCode: `def analyze_sequence(code: str) -> dict[str, str]:
    return {
        "reversed": code[::-1],
        "even_chars": code[::2],
        "last_three": code[-3:],
    }
`,
    hints: [
      'Gợi ý 1: `code[::-1]` có `step = -1` nên đi ngược từ cuối về đầu chuỗi.',
      'Gợi ý 2: `code[::2]` bắt đầu từ 0 đến hết chuỗi với bước nhảy 2 (`0, 2, 4...`).',
      'Gợi ý 3: `code[-3:]` lấy từ vị trí thứ 3 tính từ cuối đến hết chuỗi.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Đảo ngược và lấy bước nhảy bằng tham số `step`',
        codeSnippet: `        "reversed": code[::-1],\n        "even_chars": code[::2],`,
        explanation:
          'Khi bỏ trống `start` và `stop`, Python tự động chọn toàn bộ chiều dài chuỗi. Bước nhảy `-1` đảo chiều duyệt ở tốc độ C-level, còn `2` nhảy cóc qua các chỉ số lẻ.',
      },
      {
        stepTitle: 'Bước 2: Lấy cửa sổ cuối bằng Negative Indexing `[-3:]`',
        codeSnippet: `        "last_three": code[-3:],`,
        explanation:
          'Khác với `[-3:-1]` (bị thiếu mất phần tử cuối cùng vì `stop` không bao gồm), viết `[-3:]` (bỏ trống `stop`) sẽ lấy trọn vẹn 3 ký tự cuối cùng.',
      },
    ],
    commonMistakes: [
      'Viết `code[-3:-1]` để lấy 3 ký tự cuối — cách này chỉ lấy được 2 ký tự vì chỉ số `stop` (`-1`) không được bao gồm!',
      'Dùng vòng lặp `for` nối chuỗi thủ công thay vì dùng toán tử Slicing.',
    ],
    testCases: [
      {
        id: 'tc-s0-13-slice',
        description: 'Sử dụng đúng các biểu thức slicing [::-1], [::2] và [-3:]',
        inputDescription: 'analyze_sequence("PYTHON312")',
        expectedOutput: "{'reversed': '213NOHTYP', 'even_chars': 'PTO32', 'last_three': '312'}",
        requiredPatterns: ['code[::-1]', 'code[::2]', 'code[-3:]'],
      },
    ],
  },
  {
    id: 'ex-s0-slice-assignment',
    title: 'Bài 14: Thay thế và Chèn Hàng loạt Phần tử tại chỗ bằng Slice Assignment (items[1:3] = [...])',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's1-collections-slicing',
    problemStatement:
      'Trong JavaScript, hàm `arr.splice(1, 2, "a", "b", "c")` vừa dễ nhầm tham số (tham số thứ 2 là số lượng cần xóa chứ không phải chỉ số kết thúc) vừa làm code khó đọc. Trong Python, bạn có thể gán trực tiếp vào một lát cắt: `items[1:3] = ["a", "b", "c"]` để thay thế đoạn `[1:3]` tại chỗ (in-place mutation)! Hãy viết hàm `patch_pipeline_stages(stages: list[str]) -> list[str]` thay thế 2 phần tử ở vị trí `1` và `2` (`stages[1:3]`) bằng `["lint", "typecheck", "unit_test"]` rồi trả về chính danh sách `stages`.',
    realWorldContext:
      'Slice Assignment cho phép thay thế, chèn (`stages[1:1] = [...]`), hoặc xóa (`stages[1:3] = []`) một đoạn phần tử ngay trên danh sách gốc (`id(stages)` không đổi), rất hữu ích khi cập nhật danh sách bước thực thi được nhiều module cùng tham chiếu.',
    requirements: [
      'Sử dụng Slice Assignment `stages[1:3] = ["lint", "typecheck", "unit_test"]` để cập nhật tại chỗ',
      'Trả về `stages` sau khi đã cập nhật',
    ],
    starterCode: `def patch_pipeline_stages(stages: list[str]) -> list[str]:
    # TODO: Dùng Slice Assignment stages[1:3] = ["lint", "typecheck", "unit_test"]
    # để thay thế đoạn [1:3] ngay tại chỗ và trả về stages
    pass
`,
    solutionCode: `def patch_pipeline_stages(stages: list[str]) -> list[str]:
    stages[1:3] = ["lint", "typecheck", "unit_test"]
    return stages
`,
    hints: [
      'Gợi ý 1: Đặt lát cắt `stages[1:3]` ở vế trái của dấu bằng `=`.',
      'Gợi ý 2: Gán `stages[1:3] = ["lint", "typecheck", "unit_test"]` (số phần tử vế phải có thể nhiều hoặc ít hơn độ dài lát cắt vế trái!).',
      'Gợi ý 3: Trả về `return stages`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Thay thế đoạn phần tử tại chỗ bằng Slice Assignment',
        codeSnippet: `    stages[1:3] = ["lint", "typecheck", "unit_test"]`,
        explanation:
          'Python xóa 2 phần tử ở chỉ số `1` và `2`, tự động dịch chuyển phần đuôi mảng và chèn 3 phần tử mới vào ngay trên vùng nhớ của `stages`.',
      },
      {
        stepTitle: 'Bước 2: Trả về danh sách đã đột biến tại chỗ',
        codeSnippet: `    return stages`,
        explanation:
          'Địa chỉ bộ nhớ `id(stages)` được giữ nguyên, đảm bảo mọi tham chiếu bên ngoài đều thấy danh sách đã cập nhật.',
      },
    ],
    commonMistakes: [
      'Gán `stages[1] = ["lint", "typecheck", "unit_test"]` (thiếu dấu `:` của slice) — cách này sẽ nhét một `list` con lồng vào vị trí số 1 thay vì trải phẳng các phần tử!',
      'Tạo danh sách mới bằng phép cộng `stages[:1] + [...] + stages[3:]` làm mất tham chiếu gốc.',
    ],
    testCases: [
      {
        id: 'tc-s0-14-slice-assign',
        description: 'Thay thế đoạn [1:3] tại chỗ bằng Slice Assignment stages[1:3] = [...]',
        inputDescription: 'patch_pipeline_stages(["checkout", "old_test", "old_lint", "deploy"])',
        expectedOutput: "['checkout', 'lint', 'typecheck', 'unit_test', 'deploy']",
        requiredPatterns: ['stages[1:3] =', '"lint"', '"typecheck"', '"unit_test"', 'return stages'],
      },
    ],
  },
  {
    id: 'ex-s0-fstring-debug-spec',
    title: 'Bài 15: Kĩ thuật Debug Nhanh với f"{expr=}" và Căn lề Bảng Báo cáo Terminal',
    category: 'code-gym',
    stageId: 'stage-1',
    level: 'basic',
    relatedLessonId: 's0-syntax-primitives-operators-flow',
    problemStatement:
      'Khi debug trong JS, bạn hay viết `console.log({ retries })` để in cả tên biến lẫn giá trị. Từ Python 3.8, thêm dấu `=` vào cuối biểu thức trong `f-string` như `f"{retries=}"` sẽ tự động in ra `"retries=3"`! Ngoài ra, specifier `:<10` (căn trái 10 ký tự) và `:>6` (căn phải 6 ký tự) giúp vẽ bảng CLI thẳng tắp. Hãy viết hàm `format_worker_status(worker: str, jobs: int) -> str` trả về chuỗi kết hợp căn lề và tự mô tả `f"{worker:<10} | {jobs=}"`.',
    realWorldContext:
      'Trong phát triển công cụ CLI và theo dõi tiến trình Worker trên Terminal, `f"{expr=}"` giúp tiết kiệm hàng chục lần gõ lặp tên biến khi ghi log debug, còn `:<10` giúp các cột log luôn thẳng hàng.',
    requirements: [
      'Căn trái biến `worker` với độ rộng 10 ký tự bằng `{worker:<10}`',
      'Sử dụng cú pháp tự in tên biến `{jobs=}` của Python 3.8+',
      'Trả về chuỗi định dạng `f"{worker:<10} | {jobs=}"`',
    ],
    starterCode: `def format_worker_status(worker: str, jobs: int) -> str:
    # TODO: Trả về f-string căn trái worker 10 ký tự (:<10) và dùng cú pháp debug {jobs=}
    pass
`,
    solutionCode: `def format_worker_status(worker: str, jobs: int) -> str:
    return f"{worker:<10} | {jobs=}"
`,
    hints: [
      'Gợi ý 1: Dùng `{worker:<10}` để căn trái chuỗi `worker` trong ô rộng 10 ký tự.',
      'Gợi ý 2: Dùng `{jobs=}` (có dấu `=` bên trong ngoặc nhọn) để Python tự động xuất ra `jobs=<giá_trị>`.',
      'Gợi ý 3: Ghép lại thành `return f"{worker:<10} | {jobs=}"`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Căn lề trái cột tên Worker bằng `:<10`',
        codeSnippet: `{worker:<10}`,
        explanation:
          'Nếu `worker = "alpha"` (5 ký tự), Python tự động đệm thêm 5 khoảng trắng ở bên phải thành `"alpha     "` để cột `"|"` luôn thẳng hàng.',
      },
      {
        stepTitle: 'Bước 2: Tự động in cả tên biểu thức lẫn giá trị bằng `{jobs=}`',
        codeSnippet: `return f"{worker:<10} | {jobs=}"`,
        explanation:
          'Cú pháp `{jobs=}` được trình biên dịch mở rộng thành `jobs=` nối với `repr(jobs)`, hoạt động với cả biểu thức phức tạp như `f"{len(items)=}"`.',
      },
    ],
    commonMistakes: [
      'Viết tay `f"{worker:<10} | jobs={jobs}"` thay vì tận dụng tính năng `{jobs=}` của Python 3.8+.',
      'Nhầm chiều mũi tên căn lề (`:>10` là căn phải, `:<10` là căn trái, `:^10` là căn giữa).',
    ],
    testCases: [
      {
        id: 'tc-s0-15-debug-fstring',
        description: 'Sử dụng đúng specifier căn lề :<10 và cú pháp debug {jobs=}',
        inputDescription: 'format_worker_status("alpha", 42)',
        expectedOutput: "'alpha      | jobs=42'",
        requiredPatterns: ['{worker:<10}', '{jobs=}'],
      },
    ],
  },
];

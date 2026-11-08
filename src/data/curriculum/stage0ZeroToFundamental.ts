import { LessonTopic } from '@/types/curriculum.types';

export const STAGE_0_ZERO_FUNDAMENTAL_LESSONS: LessonTopic[] = [
  {
    id: 's0-python-overview-engine',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 1,
    title: '1.1. Tổng quan Toàn diện về Python, Triết lý Thiết kế & Cơ chế Hoạt động Bên dưới Nắp máy',
    shortDescription:
      'Bắt đầu từ con số 0: Python là gì, tại sao thống trị thế giới công nghệ, triết lý Zen of Python và giải phẫu cách CPython biên dịch mã nguồn .py sang Bytecode (.pyc) rồi chạy trên máy ảo PVM.',
    estimatedMinutes: 30,
    theoryParagraphs: [
      '**Python là gì?** Ra đời năm 1991 bởi **Guido van Rossum**, Python là ngôn ngữ lập trình bậc cao (High-level), thông dịch kết hợp biên dịch Bytecode, định kiểu động (**Dynamically Typed**) nhưng định kiểu mạnh (**Strongly Typed** — không tự ý cộng chuỗi với số `"5" + 3` gây lỗi ngầm như JavaScript), và hỗ trợ đa mô hình lập trình (Hướng đối tượng OOP, Lập trình hàm Functional, và Thủ tục Procedural).',
      '**Triết lý cốt lõi — The Zen of Python (PEP 20)**: Khi bạn gõ `import this` vào Python, 19 nguyên lý thiết kế hiện ra, nổi bật nhất là: *"Đẹp tốt hơn xấu. Tường minh tốt hơn ngầm định (Explicit is better than implicit). Đơn giản tốt hơn phức tạp. Tính dễ đọc rất quan trọng (Readability counts). Và nên có một — tốt nhất là chỉ một — cách rõ ràng nhất để làm một việc."*',
      '**Sự thật về cách Python hoạt động (Không phải chỉ đọc từng dòng chữ!)**: Nhiều người lầm tưởng Python đọc trực tiếp từng dòng chữ trong file `.py` để chạy. Thực tế, **CPython** (bản cài đặt chuẩn viết bằng C) hoạt động qua **2 giai đoạn rõ rệt**: (1) **Pha Biên dịch (Compilation)**: Khi nạp file, trình biên dịch phân tích cú pháp thành cây **AST (Abstract Syntax Tree)** rồi dịch sang **Bytecode** (các mã lệnh cấp thấp lưu trong thư mục `__pycache__/ten_file.cpython-312.pyc` để lần sau khởi động nhanh hơn); (2) **Pha Thực thi (Execution)**: Máy ảo **PVM (Python Virtual Machine)** chạy vòng lặp đánh giá (Evaluation Loop `ceval.c`) đọc từng lệnh Bytecode trên cấu trúc Stack và gọi xuống các hàm C tương ứng của hệ điều hành.',
      '**Tại sao Python vừa bị chê "chậm" nhưng lại thống trị AI, Data Science & Backend?** Bản thân vòng lặp Python thuần chạy trên PVM chậm hơn C/Rust vì phải kiểm tra kiểu dữ liệu động ở mỗi bước. Tuy nhiên, Python được thiết kế như một **"Ngôn ngữ Nhạc trưởng (Glue Language)"**: các thư viện nặng như `NumPy`, `PyTorch`, `Polars`, `Pydantic v2`, `uv` đều có lõi viết bằng **C, C++ hoặc Rust** chạy trực tiếp trên phần cứng với tốc độ tối đa, còn lập trình viên chỉ cần viết vài dòng Python thanh lịch ở tầng trên để điều khiển!',
    ],
    analogy: {
      title: 'CPython giống như "Bếp trưởng Dịch Công thức sang Ký hiệu Tốc ký (Bytecode) cho Dây chuyền Máy C/Rust"',
      realWorldScenario:
        'Hãy hình dung quá trình từ lúc bạn viết một file `hello.py` bằng tiếng Anh dễ đọc cho đến khi vi xử lý CPU thực thi:',
      mappingPoints: [
        {
          realWorld: 'Cuốn sổ công thức viết bằng ngôn ngữ con người dễ đọc (`main.py`)',
          pythonEquivalent: 'Source Code (`.py`)',
          explanation: 'Ưu tiên số 1 là con người đọc hiểu nhanh nhất, bảo trì dễ nhất.',
        },
        {
          realWorld: 'Bản phiếu tốc ký mã hóa đã kiểm tra lỗi chính tả lưu vào tủ đệm (`__pycache__/*.pyc`)',
          pythonEquivalent: 'Python Bytecode (`.pyc`)',
          explanation: 'Nếu bạn không sửa file `.py`, lần chạy sau Python lấy thẳng phiếu tốc ký `.pyc` ra chạy ngay mà không cần dịch lại.',
        },
        {
          realWorld: 'Người điều phối đọc từng dòng phiếu tốc ký và bấm nút dàn máy cơ khí (`PVM`)',
          pythonEquivalent: 'Python Virtual Machine (`CPython Interpreter`)',
          explanation: 'Đọc từng chỉ thị Bytecode (`LOAD_FAST`, `BINARY_OP`, `CALL`) và điều khiển bộ nhớ Heap/Stack.',
        },
      ],
      mentalModelTip:
        'Python là ngôn ngữ **Strongly Typed (Kiểu mạnh)** nhưng **Dynamically Typed (Kiểu động)**: Biến không cố định kiểu lúc khai báo (`x = 5` rồi `x = "hi"` đều được), nhưng mỗi đối tượng trong RAM có kiểu cứng — bạn KHÔNG THỂ lấy `"Tuổi: " + 25` mà phải ép kiểu rõ ràng `f"Tuổi: {25}"`!',
    },
    diagrams: [
      {
        id: 'diag-s0-cpython-pipeline',
        title: 'Sơ đồ Luồng Thực thi 4 Bước của CPython (Từ Source Code .py đến CPU)',
        subtitle: 'Giải phẫu quá trình CPython biên dịch ngầm định ra Bytecode trước khi chạy trên máy ảo PVM',
        type: 'pipeline',
        nodes: [
          {
            id: 'step-source',
            badge: 'Bước 1 • Input',
            title: 'Mã nguồn (Source Code)',
            subtitle: 'main.py (UTF-8 Text)',
            detail:
              'Lập trình viên viết mã nguồn Python tuân thủ quy tắc thụt lề 4 dấu cách. Đây là văn bản thuần túy.',
            highlightColor: 'sky',
          },
          {
            id: 'step-ast',
            badge: 'Bước 2 • Lexer & Parser',
            title: 'Cây Cú pháp Trừu tượng (AST)',
            subtitle: 'Kiểm tra SyntaxError & IndentationError',
            detail:
              'Bộ phân tích từ vựng (Tokenizer) và Parser (PEG Parser từ Python 3.9+) chuyển văn bản thành cây cấu trúc AST. Nếu bạn gõ thiếu dấu `:` hoặc lệch thụt lề, chương trình dừng ngay tại bước này với lỗi `SyntaxError`!',
            highlightColor: 'amber',
          },
          {
            id: 'step-bytecode',
            badge: 'Bước 3 • Bytecode Compiler',
            title: 'Mã Bytecode Trung gian',
            subtitle: '__pycache__/main.cpython-312.pyc',
            detail:
              'Trình biên dịch chuyển cây AST thành các chỉ thị Bytecode cấp thấp (mỗi lệnh dài 2 bytes) và lưu đệm vào thư mục `__pycache__` đối với các module được `import`.',
            highlightColor: 'violet',
          },
          {
            id: 'step-pvm',
            badge: 'Bước 4 • Runtime Engine',
            title: 'Máy ảo PVM & C Extensions',
            subtitle: 'CPython Evaluation Loop -> OS / CPU',
            detail:
              'PVM (Python Virtual Machine) lấy từng lệnh Bytecode đưa vào Stack để thực thi, cấp phát đối tượng trên Heap và gọi xuống các thư viện C/Rust (`libpython`, `NumPy`, OS System Calls).',
            highlightColor: 'emerald',
          },
        ],
        caption:
          'Khác với C/Rust biên dịch thẳng ra mã máy (Machine Code) phụ thuộc hệ điều hành, CPython biên dịch ra Bytecode độc lập phần cứng và chạy trên máy ảo PVM (tương tự cơ chế JVM của Java).',
      },
      {
        id: 'diag-s0-implementations',
        title: 'Các Bản Thực thi (Implementations) của Ngôn ngữ Python',
        subtitle: 'Python là tên bản đặc tả ngôn ngữ, còn CPython, PyPy, MicroPython là các trình thực thi khác nhau',
        type: 'comparison-boxes',
        nodes: [
          {
            id: 'impl-cpython',
            badge: 'Tiêu chuẩn (99% sử dụng)',
            title: 'CPython (Viết bằng C)',
            subtitle: 'python.org • Tương thích 100% hệ sinh thái',
            detail:
              'Bản thực thi gốc và chính thống nhất. Hỗ trợ hoàn hảo mọi thư viện C-Extension (`NumPy`, `PyTorch`, `Pydantic`). Từ bản 3.11–3.13 đã được tối ưu tốc độ mạnh mẽ.',
            highlightColor: 'sky',
          },
          {
            id: 'impl-pypy',
            badge: 'Tốc độ cao (JIT)',
            title: 'PyPy (Có JIT Compiler)',
            subtitle: 'Nhanh gấp 4–7 lần cho vòng lặp Python thuần',
            detail:
              'Tích hợp trình biên dịch Just-In-Time (JIT): phát hiện các đoạn vòng lặp chạy lặp đi lặp lại (hot loops) và dịch thẳng sang mã máy lúc đang chạy.',
            highlightColor: 'amber',
          },
          {
            id: 'impl-micro-cython',
            badge: 'Chuyên dụng & Nhúng',
            title: 'Cython / MicroPython / RustPython',
            subtitle: 'Tối ưu C-level & Vi điều khiển IoT',
            detail:
              'Cython biên dịch code Python có chú thích kiểu sang C thuần để viết thư viện tốc độ cao; MicroPython & CircuitPython thu gọn để chạy trên chip nhúng ESP32 / Raspberry Pi Pico chỉ với 256KB RAM.',
            highlightColor: 'emerald',
          },
        ],
        caption:
          'Khi nói "cài đặt Python", mặc định chúng ta đang cài đặt và sử dụng **CPython**.',
      },
    ],
    benchmarksAndProofs: [
      {
        id: 'proof-s0-bytecode',
        title: 'Minh chứng 1: Nhìn tận mắt Bytecode của CPython bằng module chuẩn `dis`',
        claim:
          'CPython không thực thi văn bản thô mà dịch hàm Python thành chuỗi lệnh Bytecode chạy trên Stack.',
        methodology: 'Sử dụng `import dis; dis.dis(calc)` trên Python 3.12',
        metrics: [
          {
            label: 'Thời gian nạp lần đầu (Chưa có cache `.pyc` — phải Parse + Compile)',
            valueText: '~12.4 ms',
            barPercent: 80,
            note: 'Phải đọc file `.py`, dựng cây AST và sinh Bytecode.',
          },
          {
            label: 'Thời gian nạp lần thứ 2 (Đọc thẳng Bytecode từ `__pycache__/*.pyc`)',
            valueText: '~2.1 ms (Nhanh gấp 6 lần)',
            barPercent: 18,
            isOptimal: true,
            note: 'Bỏ qua hoàn toàn bước phân tích cú pháp, nạp thẳng Bytecode vào PVM.',
          },
        ],
        takeaway:
          'Thư mục `__pycache__` sinh ra trong dự án của bạn chính là bằng chứng của trình biên dịch Bytecode! Hãy luôn thêm `__pycache__/` vào `.gitignore`.',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s0-1-dis',
        title: 'Khám phá Triết lý Zen, Kiểm tra Kiểu Mạnh (Strong Typing) & Giải phẫu Bytecode',
        description: 'Chứng minh cách Python kiểm tra kiểu dữ liệu và xem mã Bytecode thực tế bên dưới một hàm.',
        code: `import dis
import sys

# 1. Xem phiên bản CPython và nền tảng đang chạy
print("Trình thực thi:", sys.implementation.name)  # 'cpython'
print("Phiên bản:", sys.version.split()[0])        # '3.12.7'

# 2. Định kiểu động (Dynamic) nhưng Định kiểu MẠNH (Strong Typing)
# print("Tổng tiền: " + 500) -> LỖI TypeError ngay lập tức (Không ép kiểu ngầm định bừa bãi!)
total = 500
print(f"Tổng tiền: {total} VNĐ")

# 3. Dùng module 'dis' (Disassembler) để xem Bytecode mà CPython sinh ra:
def calculate_tax(price: float) -> float:
    return price * 0.1

dis.dis(calculate_tax)`,
        output: `Trình thực thi: cpython\nPhiên bản: 3.12.7\nTổng tiền: 500 VNĐ\n  14           0 RESUME                   0\n  15           2 LOAD_FAST                0 (price)\n               4 LOAD_CONST               1 (0.1)\n               6 BINARY_OP                5 (*)\n              10 RETURN_VALUE`,
        annotations: [
          { line: 5, explanation: '`sys.implementation.name` xác nhận bạn đang chạy trên máy ảo `cpython`.' },
          { line: 9, explanation: 'Khác với JS (`"500" + 10` ra `"50010"`), Python bảo vệ bạn bằng lỗi `TypeError` nếu cộng chuỗi với số.' },
          { line: 17, explanation: '`dis.dis()` in ra các lệnh Bytecode thực tế: `LOAD_FAST` (đẩy biến `price` lên đỉnh Stack), `LOAD_CONST` (đẩy `0.1`), `BINARY_OP (*)` (nhân 2 phần tử trên Stack) và `RETURN_VALUE`.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Khi nào Python là lựa chọn Số 1 tuyệt đối?',
        scenario: 'Xây dựng hệ thống AI/LLM/RAG, phân tích & xử lý dữ liệu lớn, Backend API (FastAPI/Django), Web Scraping và tự động hóa DevOps.',
        whyPythonFits: 'Tốc độ phát triển tính năng (Developer Velocity) nhanh gấp 3–5 lần C++/Java cùng hệ sinh thái thư viện AI/Data độc tôn.',
      },
      {
        title: 'Khi nào KHÔNG nên viết bằng Python thuần?',
        scenario: 'Viết hệ điều hành (Kernel), driver phần cứng, game 3D 120FPS hay bộ xử lý âm thanh thời gian thực cần độ trễ micro-giây.',
        whyPythonFits: 'Với các bài toán này, người ta viết lõi bằng Rust/C++ rồi bọc giao diện Python (Python Bindings qua `PyO3`) ở bên ngoài.',
      },
    ],
    tipsAndBestPractices: [
      'Gõ `python -c "import this"` trong Terminal để đọc 19 nguyên lý **Zen of Python** bất cứ khi nào bạn phân vân giữa 2 cách viết code.',
      'Luôn thêm `__pycache__/` và `*.py[cod]` vào file `.gitignore` để không đẩy các file Bytecode biên dịch tạm lên Git.',
    ],
    commonIssues: [
      {
        id: 'issue-s0-strong-typing',
        title: 'Nhầm lẫn giữa Dynamically Typed (Kiểu động) và Weakly Typed (Kiểu yếu)',
        severity: 'warning',
        symptom: '`TypeError: can only concatenate str (not "int") to str` khi ghép chuỗi với số.',
        whyItHappens:
          'Lập trình viên từ JS/PHP quen việc ngôn ngữ tự động nối `"User #" + 101`. Python là ngôn ngữ **Strongly Typed** nên từ chối ép kiểu ngầm định gây mơ hồ ("Explicit is better than implicit").',
        wrongCode: `user_id = 101\n# LỖI TypeError: Không thể cộng trực tiếp str và int!\nmessage = "Xin chào User #" + user_id`,
        rightCode: `user_id = 101\n# ĐÚNG: Dùng f-string vừa rõ ràng vừa nhanh nhất trong CPython!\nmessage = f"Xin chào User #{user_id}"`,
        fixExplanation: 'Luôn dùng `f-string` (`f"... {bien} ..."`) để nội suy biến vào chuỗi.',
      },
    ],
    jsComparison: [
      {
        concept: 'Hệ thống Kiểu: Strong vs. Weak Dynamic Typing',
        jsTsWay: 'JavaScript là Weakly Typed: "10" + 5 -> "105", "10" - 5 -> 5 (Tự động ép kiểu ngầm định)',
        pythonWay: 'Python là Strongly Typed: "10" + 5 -> Ném lỗi TypeError ngay lập tức!',
        jsCode: `console.log("10" + 5); // "105"\nconsole.log("10" - 5); // 5`,
        pythonCode: `# "10" + 5  -> TypeError!\nprint(int("10") + 5)  # 15\nprint(f"10{5}")       # "105"`,
        keyDifference: 'Python tuyệt đối không đoán mò ý định của bạn khi trộn lẫn chuỗi và số, giúp loại bỏ hàng loạt bug ẩn lúc tính toán tiền tệ/số liệu.',
      },
    ],
    externalReferences: [
      {
        title: 'PEP 20 — The Zen of Python',
        url: 'https://peps.python.org/pep-0020/',
        sourceType: 'PEP Standard',
        description: '19 nguyên lý triết lý thiết kế cốt lõi định hình toàn bộ ngôn ngữ Python của Tim Peters.',
      },
      {
        title: 'CPython Internals & Execution Model (Official Docs)',
        url: 'https://docs.python.org/3/reference/executionmodel.html',
        sourceType: 'Official Docs',
        description: 'Tài liệu chính thức giải thích mô hình thực thi, phạm vi tên và cơ chế vận hành của Python.',
      },
    ],
    relatedTermIds: ['concept-pass-by-object-ref', 'eco-uv', 'kw-def'],
    relatedLessonIds: ['s0-versions-install-switch-run', 's0-syntax-primitives-operators-flow'],
    relatedExerciseIds: ['ex-s1-mutable-trap'],
  },
  {
    id: 's0-versions-install-switch-run',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 2,
    title: '1.2. Các Phiên bản Python (2 vs 3, 3.8 → 3.13+), Cài đặt, Switch Phiên bản & 5 Cách Chạy Code',
    shortDescription:
      'Làm chủ bức tranh các phiên bản Python, tại sao có sự khác biệt, cách cài đặt và chuyển đổi (switch) linh hoạt nhiều phiên bản Python trên cùng 1 máy, và 5 phương thức chạy chương trình.',
    estimatedMinutes: 35,
    theoryParagraphs: [
      '**Lịch sử Phiên bản & Tại sao Python 2 bị khai tử?**: Năm 2008, Python 3.0 ra đời với quyết định dũng cảm là **không tương thích ngược hoàn toàn với Python 2** để sửa chữa các khiếm khuyết thiết kế gốc (đặc biệt là chuyển toàn bộ chuỗi `str` sang chuẩn **Unicode UTF-8** mặc định, biến `print` thành hàm `print()`, và chuẩn hóa phép chia `5 / 2 = 2.5` thay vì bị cắt cụt thành `2` như Python 2). Python 2 đã chính thức ngừng hỗ trợ (End-of-Life) từ ngày 01/01/2020. Hiện nay, 100% dự án mới đều dùng **Python 3 (khuyên dùng từ 3.11 đến 3.13+)**.',
      '**Sự khác nhau giữa các phiên bản Python 3 hiện đại (3.8 → 3.13+)**: Mỗi năm vào tháng 10, Python phát hành một bản Minor mới (`3.x`). Việc nắm rõ tính năng của từng phiên bản giúp bạn biết tại sao đoạn code dùng `match-case` chạy được trên máy dùng Python 3.12 nhưng lại báo lỗi cú pháp trên server cũ chạy Python 3.9!',
      '**Có Switch (Chuyển đổi) phiên bản Python được không? — CÓ VÀ RẤT THƯỜNG XUYÊN!**: Trong thực tế đi làm, Dự án A (Legacy) của công ty có thể yêu cầu đúng **Python 3.10**, trong khi Dự án B (Mới) dùng **Python 3.12**, và bạn muốn thử nghiệm tính năng No-GIL trên **Python 3.13**. Tuyệt đối không gỡ đi cài lại Python trong hệ điều hành! Thay vào đó, chúng ta dùng trình quản lý phiên bản như **`uv`** (hoặc `pyenv`) kết hợp file **`.python-version`** đặt ở thư mục gốc của từng dự án để tự động switch phiên bản trong 0.01 giây!',
      '**Môi trường ảo (`.venv`) hoạt động ra sao?**: Khác với Node.js mặc định cài thư viện vào `node_modules/` của từng thư mục dự án, nếu bạn gõ `pip install` trần trụi, Python sẽ cài thư viện vào thư mục dùng chung của toàn hệ điều hành (Global Site-packages), gây xung đột phiên bản thư viện nghiêm trọng. Một **Virtual Environment (`.venv`)** tạo ra một thư mục cô lập chứa bản sao con trỏ tới trình thông dịch Python và thư mục `site-packages/` riêng biệt cho dự án đó.',
    ],
    analogy: {
      title: 'Switch Phiên bản Python (uv / pyenv) & Căn Hộ Khép Kín (.venv)',
      realWorldScenario:
        'Hãy hình dung máy tính của bạn là một Tòa nhà Chung cư Kỹ thuật số:',
      mappingPoints: [
        {
          realWorld: 'Trạm biến áp đa năng cung cấp cả nguồn điện 110V (Python 3.10) và 220V (Python 3.12) (`uv python` / `pyenv`)',
          pythonEquivalent: 'Version Manager (`uv python pin 3.12` -> tạo file `.python-version`)',
          explanation: 'Mỗi căn hộ (dự án) chỉ cần dán tờ giấy `.python-version` trước cửa ghi `3.12`, trạm biến áp tự động cấp đúng dòng điện Python 3.12 cho dự án đó!',
        },
        {
          realWorld: 'Tủ đồ nội thất riêng bên trong từng căn hộ (`.venv/lib/python3.12/site-packages`)',
          pythonEquivalent: 'Virtual Environment (`.venv/`)',
          explanation: 'Căn hộ A dùng thư viện `FastAPI 0.100`, căn hộ B dùng `FastAPI 0.115` hoàn toàn độc lập, không bao giờ đụng chạm nhau.',
        },
        {
          realWorld: 'Công tắc tổng kiểm tra xem file đang được chạy trực tiếp hay được mượn làm thư viện (`__name__ == "__main__"`)',
          pythonEquivalent: '`if __name__ == "__main__": main()`',
          explanation: 'Khi bạn chạy `python app.py`, Python gán `__name__ = "__main__"`. Nhưng khi file khác `import app`, biến `__name__` mang tên `"app"`, giúp ngăn code chạy tự động ngoài ý muốn!',
        },
      ],
      mentalModelTip:
        'Với công cụ `uv` hiện đại, bạn không cần nhớ lệnh `source .venv/bin/activate` thủ công nữa: chỉ cần gõ `uv run main.py`, `uv` sẽ tự động đọc `.python-version`, kích hoạt `.venv` đúng phiên bản và chạy code trong một bước duy nhất!',
    },
    diagrams: [
      {
        id: 'diag-s0-version-timeline',
        title: 'Dòng Thời gian & Khác biệt Cốt lõi giữa các Phiên bản Python (2.7 → 3.13+)',
        subtitle: 'Bấm vào từng phiên bản để xem các tính năng đột phá và cú pháp mới được bổ sung',
        type: 'version-timeline',
        nodes: [
          {
            id: 'ver-py2-vs-3',
            badge: 'Python 2 vs 3',
            title: 'Cuộc Đại Chuyển Đổi (2008–2020)',
            subtitle: 'Unicode UTF-8 mặc định, print(), phép chia thực /',
            detail:
              'Python 2 đã khai tử (EOL 2020). Python 3 biến mọi chuỗi `str` thành Unicode mặc định (hỗ trợ tiếng Việt/Emoji hoàn hảo), biến `print`, `exec` thành hàm, và ưu tiên trả về Iterator/View lười (`range`, `dict.keys()`, `zip`, `map`) thay vì tạo `list` tốn RAM.',
            highlightColor: 'rose',
          },
          {
            id: 'ver-38-39',
            badge: 'Python 3.8 & 3.9',
            title: 'Toán tử Walrus (:=) & Built-in Generic Types',
            subtitle: 'if (n := len(a)) > 10 • list[str] • dict1 | dict2',
            detail:
              'Python 3.8 giới thiệu toán tử gán trong biểu thức `:=` (Walrus operator) và f-string debug `f"{x=}"`. Python 3.9 cho phép viết trực tiếp `list[int]`, `dict[str, Any]` mà không cần `from typing import List, Dict`, cùng toán tử gộp từ điển `d1 | d2`.',
            highlightColor: 'sky',
          },
          {
            id: 'ver-310',
            badge: 'Python 3.10 (10/2021)',
            title: 'Pattern Matching (match-case) & Union (|)',
            subtitle: 'match event: case ... • int | None',
            detail:
              'Bước nhảy lớn về cú pháp: Bổ sung `match ... case` (Structural Pattern Matching - PEP 634), cho phép viết kiểu hợp `int | str | None` thay cho `Union[int, str, None]`, và nâng cấp thông báo lỗi chỉ rõ dòng thiếu dấu ngoặc.',
            highlightColor: 'violet',
          },
          {
            id: 'ver-311',
            badge: 'Python 3.11 (10/2022)',
            title: 'Faster CPython (+25% đến +60% Tốc độ!)',
            subtitle: 'Specializing Adaptive Interpreter • TaskGroup • tomllib',
            detail:
              'Nhờ dự án Faster CPython (PEP 659), trình thông dịch tự động thay thế bytecode chung bằng bytecode chuyên biệt theo kiểu dữ liệu lúc chạy, giúp tăng tốc độ trung bình 25% mà không cần đổi 1 dòng code! Bổ sung `asyncio.TaskGroup` và `tomllib`.',
            highlightColor: 'amber',
          },
          {
            id: 'ver-312',
            badge: 'Python 3.12 (10/2023)',
            title: 'Cú pháp Type Parameter [T] mới & f-string tự do',
            subtitle: 'type Point[T] = tuple[T, T] • def first[T](items: list[T]):',
            detail:
              'PEP 695 giới thiệu cú pháp khai báo Generic gọn nhẹ giống TypeScript (`def max_val[T](a: list[T]) -> T:`), gỡ bỏ mọi hạn chế lồng dấu nháy trong `f-string` (PEP 701) và tối ưu hóa kích thước đối tượng trong RAM.',
            highlightColor: 'emerald',
          },
          {
            id: 'ver-313',
            badge: 'Python 3.13+ (10/2024+)',
            title: 'Free-Threaded No-GIL (PEP 703) & JIT Compiler (PEP 744)',
            subtitle: 'Thử nghiệm tháo bỏ khóa GIL & Copy-and-Patch JIT',
            detail:
              'Cột mốc lịch sử của Python: Lần đầu tiên hỗ trợ bản build tùy chọn `python3.13t` tắt hoàn toàn khóa GIL (Free-threaded mode) cho phép chạy đa luồng CPU song song thực sự, kèm trình biên dịch JIT thử nghiệm và REPL đa dòng có màu sắc trực quan!',
            highlightColor: 'emerald',
          },
        ],
        caption:
          'Khuyến nghị thực tế hiện nay: Chọn **Python 3.12** làm bản ổn định tiêu chuẩn cho Production, và trải nghiệm **Python 3.13+** cho các tính năng mới nhất.',
      },
      {
        id: 'diag-s0-5-ways-to-run',
        title: '5 Phương thức Chạy Chương trình Python trong Thực tế',
        subtitle: 'Tùy vào mục đích (Thử nghiệm nhanh, Chạy dự án Backend, Chạy tác vụ ngầm hay Phân tích dữ liệu) mà chọn cách chạy phù hợp',
        type: 'pipeline',
        nodes: [
          {
            id: 'run-repl',
            badge: 'Cách 1 • Interactive',
            title: 'Chạy REPL Tương tác',
            subtitle: '$ uv run python',
            detail:
              'Mở giao diện dòng lệnh `>>>` (Read-Eval-Print Loop) để thử nghiệm nhanh biểu thức, kiểm tra hàm hoặc tính toán tức thì. Gõ `exit()` hoặc `Ctrl+D` để thoát.',
            highlightColor: 'sky',
          },
          {
            id: 'run-script',
            badge: 'Cách 2 • Script File',
            title: 'Chạy File Kịch bản Đơn lẻ',
            subtitle: '$ uv run hello.py',
            detail:
              'Thực thi từ đầu đến cuối một file `.py` độc lập. Thư mục chứa file đó sẽ được thêm vào đầu `sys.path[0]`.',
            highlightColor: 'amber',
          },
          {
            id: 'run-module',
            badge: 'Cách 3 • Chuẩn Dự án (-m)',
            title: 'Chạy dưới dạng Module (-m)',
            subtitle: '$ uv run python -m app.main',
            detail:
              'Cờ `-m` bảo Python tìm module từ thư mục gốc hiện tại của dự án (`Current Working Directory`), giúp mọi lệnh `from app.services import ...` hoạt động chuẩn xác không bao giờ bị lỗi `ModuleNotFoundError`!',
            highlightColor: 'emerald',
          },
          {
            id: 'run-inline-nb',
            badge: 'Cách 4 & 5 • CLI / Notebook',
            title: 'Lệnh 1 dòng (-c) & Jupyter',
            subtitle: '$ python -c "..." | *.ipynb',
            detail:
              'Dùng `python -c "import secrets; print(secrets.token_hex(16))"` để tạo khóa nhanh trên Terminal, hoặc dùng Jupyter Notebook (`.ipynb`) để chạy từng ô code kèm biểu đồ trực quan.',
            highlightColor: 'violet',
          },
        ],
        caption:
          'Quy tắc vàng khi làm dự án nhiều file: Luôn chạy bằng cờ `-m` (ví dụ `uv run python -m app.main` hoặc `uv run pytest`) thay vì chạy trực tiếp đường dẫn file sâu bên trong thư mục con!',
      },
    ],
    benchmarksAndProofs: [
      {
        id: 'proof-s0-uv-speed',
        title: 'Minh chứng 2: Tốc độ Quản lý Phiên bản & Cài đặt Môi trường Ảo (`uv` vs `pip` + `venv`)',
        claim:
          'Công cụ hiện đại `uv` (viết bằng Rust) giúp tạo môi trường ảo `.venv`, switch phiên bản Python và cài đặt gói nhanh gấp 10–80 lần công cụ truyền thống.',
        methodology: 'Benchmark khởi tạo môi trường ảo và cài đặt bộ thư viện FastAPI + Pydantic + SQLAlchemy',
        metrics: [
          {
            label: 'Cách hiện đại khuyên dùng: `uv venv` + `uv add fastapi sqlalchemy` (Có cache)',
            valueText: '0.45 giây',
            barPercent: 6,
            isOptimal: true,
            note: 'Tự động tải đúng phiên bản Python nếu máy chưa có, tạo `.venv` và khóa `uv.lock` gần như tức thì.',
          },
          {
            label: 'Cách truyền thống: `python3 -m venv .venv` + `pip install ...`',
            valueText: '18.20 giây (Chậm hơn ~40 lần)',
            barPercent: 92,
            note: 'Phải tự cài Python trước bằng tay, tạo `.venv` chậm và không tự sinh file lock chống lệch phiên bản.',
          },
        ],
        takeaway:
          'Bạn vẫn nên biết `python -m venv .venv` để làm việc trên các máy chủ cũ chưa cài `uv`, nhưng trên máy cá nhân và Docker mới, hãy luôn dùng `uv`!',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s0-2-install-switch',
        title: 'Hướng dẫn Cài đặt, Switch Phiên bản Python & Quản lý .venv Thực tế',
        description: 'Toàn bộ các lệnh Terminal từ lúc máy trắng tinh đến khi chạy đa phiên bản Python 3.10, 3.12, 3.13.',
        code: `# =====================================================================
# PHẦN A: CÀI ĐẶT & SWITCH PHIÊN BẢN PYTHON HIỆN ĐẠI VỚI 'uv' (Khuyên dùng)
# =====================================================================
# 1. Cài đặt uv (trên macOS/Linux hoặc Windows PowerShell):
# macOS/Linux: curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows:     powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# 2. Tải cùng lúc nhiều phiên bản Python về máy (không lo xung đột!):
# $ uv python install 3.10 3.12 3.13
# $ uv python list   # Xem danh sách tất cả phiên bản Python hiện có trên máy

# 3. SWITCH PHIÊN BẢN PYTHON cho dự án hiện tại (Tạo file .python-version):
# $ uv python pin 3.12
# $ uv run python --version   -> Python 3.12.x

# 4. Chạy thử nhanh 1 file bằng phiên bản Python bất kỳ mà không cần switch cố định:
# $ uv run --python 3.10 main.py
# $ uv run --python 3.13 main.py

# =====================================================================
# PHẦN B: CÁCH TRUYỀN THỐNG VỚI 'python -m venv' (Mọi máy đều có sẵn)
# =====================================================================
# $ python3 -m venv .venv                 # Tạo thư mục môi trường ảo .venv
# $ source .venv/bin/activate             # Kích hoạt trên macOS / Linux
# $ .venv\\Scripts\\activate              # Kích hoạt trên Windows
# $ pip install -r requirements.txt       # Cài đặt thư viện vào .venv`,
        output: `Pinned \`.python-version\` to \`3.12\`\nPython 3.12.7`,
        annotations: [
          { line: 9, explanation: 'Lệnh `uv python install 3.10 3.12 3.13` tải các bản Python độc lập về máy chỉ trong vài giây mà không cần quyền Admin/sudo.' },
          { line: 13, explanation: '`uv python pin 3.12` ghi số `3.12` vào file `.python-version`. Từ lúc này, mọi lệnh trong thư mục dự án tự động dùng Python 3.12!' },
          { line: 17, explanation: '`uv run --python 3.13 main.py` cho phép kiểm thử ngay code của bạn trên Python 3.13 xem có tương thích hay không.' },
          { line: 23, explanation: 'Cách truyền thống dùng module có sẵn `venv` — cần nhớ lệnh `activate` tùy theo hệ điều hành.' },
        ],
      },
      {
        id: 'ex-s0-2-main-guard',
        title: 'Cơ chế __name__ == "__main__" khi Chạy File vs. Khi Import Module',
        description: 'Hiểu tại sao mọi file kịch bản Python chuẩn đều có dòng kiểm tra if __name__ == "__main__": ở cuối.',
        code: `# file: converter.py
def usd_to_vnd(amount: float, rate: float = 25_400) -> int:
    """Chuyển đổi USD sang VNĐ."""
    return int(amount * rate)

def main() -> None:
    print(f"Biến __name__ hiện tại là: {__name__!r}")
    print(f"100 USD = {usd_to_vnd(100):,} VNĐ")

# CHỐT CHẶN QUAN TRỌNG NHẤT TRONG PYTHON:
# Chỉ tự động chạy hàm main() khi file này được gọi trực tiếp ($ python converter.py)
# Nếu file khác gọi 'import converter', khối này sẽ KHÔNG tự chạy!
if __name__ == "__main__":
    main()`,
        output: `Biến __name__ hiện tại là: '__main__'\n100 USD = 2,540,000 VNĐ`,
        annotations: [
          { line: 6, explanation: 'Tách điểm khởi đầu chương trình vào hàm `main()` giúp các biến không bị rò rỉ ra phạm vi toàn cục (Global Scope).' },
          { line: 13, explanation: 'Khi chạy trực tiếp `python converter.py`, Python gán `__name__ = "__main__"`. Khi được `import converter`, `__name__` sẽ là `"converter"`.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Chạy song song dự án AI (Python 3.10) và dự án Backend FastAPI (Python 3.12) trên 1 laptop',
        scenario: 'Một thư viện AI cũ chỉ hỗ trợ tối đa Python 3.10, nhưng dự án web mới cần cú pháp Generic của Python 3.12.',
        whyPythonFits: 'Chỉ cần chạy `uv python pin 3.10` ở thư mục AI và `uv python pin 3.12` ở thư mục Backend — mỗi khi bạn `cd` vào thư mục nào, `uv` tự động dùng đúng bản Python của thư mục đó!',
      },
    ],
    tipsAndBestPractices: [
      'Luôn commit cả 3 file `pyproject.toml`, `uv.lock` và `.python-version` lên Git để mọi thành viên trong nhóm và hệ thống CI/CD chạy đúng 100% phiên bản Python và thư viện như nhau.',
      'Không bao giờ commit thư mục `.venv/` lên Git (tương tự không bao giờ commit `node_modules/`).',
      'Sử dụng các công cụ chuẩn có sẵn qua cờ `-m` cực tiện lợi: `python -m json.tool data.json` (format JSON đẹp trên Terminal) hoặc `python -m http.server 8000` (mở web server tĩnh tức thì).',
    ],
    commonIssues: [
      {
        id: 'issue-s0-global-pip',
        title: 'Lỗi cài thư viện trực tiếp vào Python Hệ điều hành (PEP 668: externally-managed-environment)',
        severity: 'critical',
        symptom: '`error: externally-managed-environment — This environment is externally managed` khi gõ `pip install` trên macOS (Homebrew) hoặc Ubuntu/Debian.',
        whyItHappens:
          'Hệ điều hành Linux/macOS tự dùng Python của hệ thống cho các công cụ nền. Nếu bạn dùng `sudo pip install` ghi đè thư viện hệ thống sẽ làm hỏng cả công cụ của hệ điều hành!',
        wrongCode: `# SAI LẦM NGUY HIỂM: Cài trực tiếp hoặc ép dùng --break-system-packages\nsudo pip install fastapi --break-system-packages`,
        rightCode: `# ĐÚNG CHUẨN: Luôn tạo môi trường ảo (.venv) hoặc dùng uv\nuv init my-project && cd my-project\nuv add fastapi\n# Hoặc cách truyền thống:\npython3 -m venv .venv && source .venv/bin/activate && pip install fastapi`,
        fixExplanation: 'Không bao giờ cài thư viện dự án vào Global Python. Luôn làm việc bên trong `.venv` hoặc thông qua `uv add` / `uv run`.',
      },
    ],
    jsComparison: [
      {
        concept: 'Chuyển đổi Phiên bản Runtime (Version Switching)',
        jsTsWay: 'nvm / fnm + file .nvmrc (nvm use 20, nvm use 22)',
        pythonWay: 'uv python / pyenv + file .python-version (uv python pin 3.12)',
        jsCode: `nvm install 22\necho "22" > .nvmrc\nnvm use`,
        pythonCode: `uv python install 3.12\nuv python pin 3.12   # Tự tạo .python-version\nuv run python -V`,
        keyDifference: '`uv` gộp cả vai trò của `nvm` (quản lý phiên bản Python) lẫn `pnpm` (quản lý gói thư viện) vào một công cụ duy nhất.',
      },
    ],
    externalReferences: [
      {
        title: 'Status of Python Versions (Official Release Cycle)',
        url: 'https://devguide.python.org/versions/',
        sourceType: 'Official Docs',
        description: 'Bảng theo dõi vòng đời hỗ trợ chính thức và lịch phát hành từ Python 3.8 đến 3.14.',
      },
      {
        title: 'uv Documentation — Managing Python Versions & Environments',
        url: 'https://docs.astral.sh/uv/guides/install-python/',
        sourceType: 'Tooling Docs',
        description: 'Hướng dẫn chính thức cách cài đặt và chuyển đổi nhiều phiên bản Python bằng uv.',
      },
    ],
    relatedTermIds: ['eco-uv', 'concept-gil', 'kw-match'],
    relatedLessonIds: ['s0-python-overview-engine', 's0-syntax-primitives-operators-flow'],
    relatedExerciseIds: ['ex-s1-mutable-trap'],
  },
  {
    id: 's0-syntax-primitives-operators-flow',
    stageId: 'stage-1',
    level: 'fundamental',
    order: 3,
    title: '1.3. Cú pháp Nền tảng, Kiểu Dữ liệu Nguyên thủy, Toán tử & Luồng Điều khiển Cơ bản',
    shortDescription:
      'Nắm vững từ gốc: Quy tắc thụt lề (Indentation), int/float/Decimal, chuỗi f-string, hệ thống toán tử (//, **, :=, so sánh bắc cầu) và cấu trúc rẽ nhánh / vòng lặp.',
    estimatedMinutes: 35,
    theoryParagraphs: [
      '**Cú pháp Thụt lề bắt buộc (Significant Indentation)**: Khác với C/Java/JavaScript dùng dấu ngoặc nhọn `{ ... }` để gom nhóm khối lệnh và chỉ coi việc thụt lề là làm đẹp, trong Python **thụt lề (chuẩn PEP 8 là 4 dấu cách - 4 spaces) chính là cú pháp bắt buộc** để xác định phạm vi khối lệnh sau dấu hai chấm `:`. Nhờ quy tắc này, mọi đoạn code Python của mọi lập trình viên trên thế giới đều có cấu trúc thị giác đồng nhất và không bao giờ có tranh cãi về vị trí đặt dấu `{`!',
      '**Các Kiểu dữ liệu Nguyên thủy (Primitive / Scalar Types)**: (1) **`int` (Số nguyên)**: Trong Python 3, `int` có độ lớn tùy ý (Arbitrary-precision), tự động mở rộng số byte trong RAM nên bạn có thể tính `10 ** 500` mà không bao giờ bị tràn số (`Overflow`); (2) **`float` (Số thực dấu phẩy động 64-bit IEEE 754)**: Do biểu diễn nhị phân, `0.1 + 0.2` sẽ ra `0.30000000000000004` — vì vậy khi tính toán tiền tệ tài chính, luôn dùng **`decimal.Decimal("0.1")`**; (3) **`bool` (Logic)**: Chỉ gồm `True` và `False` (viết hoa chữ cái đầu); (4) **`str` (Chuỗi ký tự Unicode bất biến)**: Hỗ trợ chuỗi nhiều dòng `"""..."""`, chuỗi thô `r"C:\\path"` (dùng cho Regex/đường dẫn) và nội suy siêu tốc với **`f-string`**; (5) **`None`**: Giá trị rỗng duy nhất.',
      '**Hệ thống Toán tử Đặc sắc của Python**: Bên cạnh `+`, `-`, `*`, Python phân tách rõ phép chia thực `/` (`7 / 2 = 3.5`) và phép **chia lấy phần nguyên xuống sàn `//`** (`7 // 2 = 3`), cùng phép **lũy thừa `**`** (`2 ** 10 = 1024`). Đặc biệt, Python hỗ trợ **So sánh bắc cầu liên tiếp (Chained Comparison)** cực kỳ tự nhiên như trong toán học: `0 <= score <= 10` hoặc `18 <= age < 65`!',
      '**Luồng Điều khiển (`if / elif / else` & Vòng lặp `for`, `while`)**: Python dùng từ khóa viết gọn `elif` (thay cho `else if`). Biểu thức điều kiện 3 ngôi được viết đọc xuôi như câu tiếng Anh: `status = "Đậu" if score >= 5.0 else "Trượt"`. Ngoài ra, từ Python 3.8+, **Toán tử Hải mã `:=` (Walrus Operator)** cho phép vừa gán biến vừa kiểm tra điều kiện ngay trong cùng một biểu thức `if (n := len(items)) > 10:`.',
    ],
    analogy: {
      title: 'Thụt lề Bắt buộc là "Bậc thang Phân cấp Tổ chức" & Bẫy Tiền lẻ Nhị phân (float vs. Decimal)',
      realWorldScenario:
        'Hai khái niệm nền tảng giúp người mới không bao giờ bỡ ngỡ khi viết những dòng code đầu tiên:',
      mappingPoints: [
        {
          realWorld: 'Mục lục sách thụt lề theo từng cấp Chương -> Mục -> Ý nhỏ (`Indentation`)',
          pythonEquivalent: 'Dấu `:` kết hợp thụt lề 4 dấu cách (`    `)',
          explanation: 'Nhìn vào lề trái là biết ngay câu lệnh nào nằm bên trong `if` hay `for` mà không cần đếm hàng chục dấu đóng ngoặc `}}}` rối mắt.',
        },
        {
          realWorld: 'Thước đo chia vạch 1/3 mét bằng hệ thập phân (`0.33333...` lẻ mãi) vs. Tiền xu mệnh giá cố định (`Decimal`)',
          pythonEquivalent: '`float` (`0.1 + 0.2 != 0.3`) vs. `Decimal("0.1") + Decimal("0.2") == Decimal("0.3")`',
          explanation: 'Máy tính dùng hệ nhị phân (cơ số 2) nên không biểu diễn chính xác tuyệt đối `0.1` trong kiểu `float`. Dùng `Decimal` để tính đúng từng đồng tiền!',
        },
        {
          realWorld: 'Vừa cân hành lý vừa đọc ngay số cân trên màn hình (`Walrus :=`)',
          pythonEquivalent: '`if (weight := get_bag_weight()) > 23:`',
          explanation: 'Tránh việc phải gọi hàm `get_bag_weight()` 2 lần hoặc phải khai báo biến ở dòng riêng phía trên `if`.',
        },
      ],
      mentalModelTip:
        'Trong VS Code hoặc PyCharm, phím `Tab` mặc định được cấu hình tự động chèn **4 dấu cách (Spaces)**. Tuyệt đối không trộn lẫn ký tự `Tab (\\t)` và `Space` trong cùng một file Python (sẽ gây lỗi `TabError`)!',
    },
    diagrams: [
      {
        id: 'diag-s0-operators-flow',
        title: 'Bản đồ Các Toán tử & Biểu thức Đặc trưng trong Python',
        subtitle: 'Những cú pháp giúp code Python ngắn gọn và sát với ngôn ngữ toán học tự nhiên nhất',
        type: 'comparison-boxes',
        nodes: [
          {
            id: 'op-math',
            badge: 'Toán tử Số học',
            title: 'Chia Thực (/) vs Chia Nguyên (//) & Lũy thừa (**)',
            subtitle: '7 / 2 -> 3.5 | 7 // 2 -> 3 | 2 ** 3 -> 8',
            detail:
              'Lưu ý: Python không có toán tử `i++` hay `--i`! Để tăng biến lên 1, luôn viết `i += 1`. Phép chia `//` luôn làm tròn xuống sàn (Floor division: `-7 // 2` ra `-4`).',
            highlightColor: 'sky',
          },
          {
            id: 'op-chain',
            badge: 'So sánh Bắc cầu',
            title: 'Chained Comparisons (Toán học tự nhiên)',
            subtitle: '0 <= x <= 100 • a == b == c',
            detail:
              'Thay vì phải viết `x >= 0 and x <= 100`, Python cho phép viết liền `0 <= x <= 100`. Biểu thức giữa `x` chỉ được tính toán đúng 1 lần duy nhất!',
            highlightColor: 'emerald',
          },
          {
            id: 'op-walrus-ternary',
            badge: 'Biểu thức Thu gọn',
            title: 'Ternary (if-else) & Walrus Operator (:=)',
            subtitle: '"VIP" if point > 100 else "Member" • (n := len(s))',
            detail:
              'Toán tử 3 ngôi đặt giá trị phổ biến lên đầu: `ket_qua_dung if dieu_kien else ket_qua_sai`. Toán tử `:=` vừa gán giá trị vào biến `n` vừa trả về chính giá trị đó cho biểu thức `if` hoặc `while`.',
            highlightColor: 'amber',
          },
        ],
        caption:
          'Toán tử logic trong Python dùng từ tiếng Anh rõ ràng `and`, `or`, `not` thay vì các ký hiệu `&&`, `||`, `!`.',
      },
    ],
    benchmarksAndProofs: [
      {
        id: 'proof-s0-fstring-speed',
        title: 'Minh chứng 3: Hiệu năng Nội suy Chuỗi (`f-string` vs `.format()` vs Cộng chuỗi `+`)',
        claim:
          '`f-string` (PEP 498) không chỉ dễ đọc nhất mà còn là cách tạo chuỗi nhanh nhất trong CPython vì được biên dịch thành opcode `FORMAT_VALUE` & `BUILD_STRING` riêng biệt.',
        methodology: 'Benchmark thực hiện 1.000.000 lần ghép biến vào chuỗi trên Python 3.12',
        metrics: [
          {
            label: 'Dùng `f-string`: `f"User {name} có {points} điểm"` (Chuẩn hiện đại)',
            valueText: '0.078 giây (Nhanh nhất)',
            barPercent: 25,
            isOptimal: true,
            note: 'Biên dịch trực tiếp thành Bytecode tối ưu cấp thấp, không tốn chi phí gọi phương thức.',
          },
          {
            label: 'Dùng toán tử `+` kèm `str()`: `"User " + name + " có " + str(points)`',
            valueText: '0.165 giây',
            barPercent: 55,
            note: 'Phải tạo nhiều đối tượng chuỗi trung gian trong RAM rồi hủy bỏ.',
          },
          {
            label: 'Dùng phương thức `.format()` cũ: `"User {} có {} điểm".format(name, points)`',
            valueText: '0.240 giây (Chậm gấp 3 lần f-string)',
            barPercent: 85,
            note: 'Phải tra cứu phương thức và phân tích chuỗi định dạng lúc Runtime.',
          },
        ],
        takeaway:
          'Luôn ưu tiên sử dụng `f-string` trong mọi trường hợp định dạng chuỗi (trừ khi viết template cho module `logging` cần lười đánh giá bằng `%s`).',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s0-3-syntax',
        title: 'Cú pháp Cốt lõi: Kiểu dữ liệu, Decimal tài chính, f-string nâng cao & Luồng điều khiển',
        description: 'Tổng hợp những viên gạch đầu tiên cần nắm vững trước khi bước vào cấu trúc dữ liệu.',
        code: `from decimal import Decimal

# 1. Số nguyên độ lớn vô hạn & Số thực chính xác tuyệt đối với Decimal
big_number: int = 2 ** 100  # Không bao giờ bị tràn số (Overflow)!
price_float = 0.1 + 0.2     # 0.30000000000000004 (Sai số nhị phân IEEE 754)
price_exact = Decimal("0.1") + Decimal("0.2")  # Decimal('0.3') -> Chính xác 100%!

# 2. Định dạng f-string chuyên nghiệp (Căn lề, phần nghìn, làm tròn, debug biến =)
product = "MacBook Pro"
cost = 45990000
tax_rate = 0.08
print(f"Sản phẩm: {product} | Giá: {cost:,.0f}đ | Thuế: {tax_rate:.1%}")
print(f"Debug nhanh tên và giá trị biến: {cost=}")

# 3. So sánh bắc cầu (Chained Comparison) + Toán tử 3 ngôi + Walrus (:=)
score = 8.6
if 8.0 <= score <= 10.0:
    rank = "Giỏi" if score < 9.0 else "Xuất sắc"
    print(f"Điểm {score} -> Xếp loại: {rank}")

items = ["Python", "FastAPI", "Pydantic", "SQLAlchemy"]
if (count := len(items)) >= 3:
    print(f"Danh sách có {count} công nghệ cốt lõi")`,
        output: `Sản phẩm: MacBook Pro | Giá: 45,990,000đ | Thuế: 8.0%\nDebug nhanh tên và giá trị biến: cost=45990000\nĐiểm 8.6 -> Xếp loại: Giỏi\nDanh sách có 4 công nghệ cốt lõi`,
        annotations: [
          { line: 6, explanation: 'Truyền chuỗi `"0.1"` vào `Decimal("0.1")` để tính toán tiền tệ, ngân hàng, hóa đơn chính xác tuyệt đối.' },
          { line: 12, explanation: 'Trong `f-string`, `:,.0f` tự động thêm dấu phẩy ngăn cách hàng nghìn; `:.1%` tự nhân 100 và gắn ký hiệu `%`.' },
          { line: 13, explanation: 'Cú pháp `f"{cost=}"` (từ Python 3.8+) tự động in cả tên biến lẫn giá trị `cost=45990000`, cực kỳ tiện khi debug!' },
          { line: 17, explanation: '`8.0 <= score <= 10.0` là cú pháp so sánh bắc cầu đặc sản của Python.' },
          { line: 22, explanation: 'Toán tử Walrus `(count := len(items))` vừa gán độ dài vào biến `count` vừa so sánh `>= 3` ngay trên 1 dòng.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Xử lý tính tiền đơn hàng, chiết khấu & thuế VAT trong E-commerce / Fintech',
        scenario: 'Cộng hàng nghìn dòng hóa đơn lẻ mà không được phép lệch dù chỉ 0.01 đồng.',
        whyPythonFits: 'Module chuẩn `decimal.Decimal` tích hợp sẵn của Python hỗ trợ đầy đủ các quy tắc làm tròn kế toán (`ROUND_HALF_UP`).',
      },
    ],
    tipsAndBestPractices: [
      'Không bao giờ so sánh hai số `float` trực tiếp bằng `a == b`. Hãy dùng `math.isclose(a, b)` hoặc chuyển sang `decimal.Decimal`.',
      'Tận dụng tính năng `f"{biến=}"` khi muốn in log kiểm tra nhanh giá trị của biến hoặc biểu thức.',
      'Trong vòng lặp `for` hoặc `while`, Python có nhánh `else:` đặc biệt: khối `else:` sau vòng lặp sẽ chạy khi vòng lặp kết thúc tự nhiên (KHÔNG bị ngắt giữa chừng bởi lệnh `break`).',
    ],
    commonIssues: [
      {
        id: 'issue-s0-float-precision',
        title: 'Bẫy Sai số Dấu phẩy động (0.1 + 0.2 != 0.3) khi kiểm tra điều kiện bằng',
        severity: 'warning',
        symptom: 'Biểu thức `if 0.1 + 0.2 == 0.3:` trả về `False` khiến logic thanh toán bị sai!',
        whyItHappens:
          'Số thập phân `0.1` khi đổi sang hệ nhị phân là phân số tuần hoàn vô hạn, nên khi lưu trong 64-bit IEEE 754 `float` sẽ có sai số cực nhỏ `0.30000000000000004`.',
        wrongCode: `balance = 0.1 + 0.2\nif balance == 0.3:\n    print("Đủ tiền")  # KHÔNG BAO GIỜ CHẠY VÀO ĐÂY!`,
        rightCode: `import math\nfrom decimal import Decimal\n\n# Cách 1: Dùng math.isclose cho tính toán khoa học\nif math.isclose(0.1 + 0.2, 0.3):\n    print("Đủ tiền (isclose)")\n\n# Cách 2: Dùng Decimal cho tiền tệ tài chính\nif Decimal("0.1") + Decimal("0.2") == Decimal("0.3"):\n    print("Đủ tiền (Decimal chính xác 100%)")`,
        fixExplanation: 'Sử dụng `math.isclose()` cho số thực đo đạc hoặc `decimal.Decimal` (truyền chuỗi vào constructor) cho dữ liệu tài chính.',
      },
    ],
    jsComparison: [
      {
        concept: 'Toán tử Logic, Chia nguyên & Biểu thức 3 ngôi (Ternary)',
        jsTsWay: '&&, ||, ! | Math.floor(7 / 2) | cond ? a : b',
        pythonWay: 'and, or, not | 7 // 2 | a if cond else b',
        jsCode: `const q = Math.floor(7 / 2);\nconst label = score >= 5 ? "Pass" : "Fail";`,
        pythonCode: `q = 7 // 2\nlabel = "Pass" if score >= 5 else "Fail"`,
        keyDifference: 'Python có sẵn toán tử chia lấy nguyên `//` và lũy thừa `**`, không cần gọi `Math.floor()` hay `Math.pow()`.',
      },
    ],
    externalReferences: [
      {
        title: 'PEP 8 — Style Guide for Python Code',
        url: 'https://peps.python.org/pep-0008/',
        sourceType: 'PEP Standard',
        description: 'Quy chuẩn trình bày mã nguồn chính thức của Python (thụt lề 4 spaces, quy tắc đặt tên, độ dài dòng).',
      },
      {
        title: 'Floating Point Arithmetic: Issues and Limitations (Python Docs)',
        url: 'https://docs.python.org/3/tutorial/floatingpoint.html',
        sourceType: 'Official Docs',
        description: 'Giải thích chính thức từ Python Docs về biểu diễn số thực IEEE 754 và cách dùng module decimal.',
      },
    ],
    relatedTermIds: ['kw-none', 'kw-is', 'fn-range', 'eco-uv'],
    relatedLessonIds: ['s0-versions-install-switch-run', 's1-env-memory', 's1-collections-slicing'],
    relatedExerciseIds: ['ex-s0-version-cli-check', 'ex-s1-mutable-trap'],
  },
];

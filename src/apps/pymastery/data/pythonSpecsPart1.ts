import type {
  BilingualText,
  CalloutKind,
  StageScene,
  StageTelemetryItem,
  StepDiffItem,
} from '@/components/scale-workbench/types';

export interface StepVisualFrame {
  telemetry: StageTelemetryItem[];
  whatChanged: StepDiffItem[];
  callout?: {
    kind: CalloutKind;
    title?: BilingualText;
    text: BilingualText;
  };
  scene: StageScene;
}

export interface PyModuleVisualSpec {
  id: string;
  titleEn: string;
  subtitleEn: string;
  durationMin: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  objectives: BilingualText[];
  buildFrame: (stepIdx: number, totalSteps: number) => StepVisualFrame;
}

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

export const PY_SPECS_PART1: Record<string, PyModuleVisualSpec> = {
  M00: {
    id: 'M00',
    titleEn: 'Python Kickoff: Modern Tooling (uv, .venv) & How CPython Runs Code',
    subtitleEn: 'Trace .py → Bytecode → CPython VM execution, isolated .venv projects via uv, 4-space indentation blocks, and __main__.',
    durationMin: 10,
    difficulty: 'Beginner',
    objectives: [
      bi('Hiểu chu trình thực thi .py → Bytecode (.pyc) → Máy ảo CPython PVM', 'Trace .py → Bytecode (.pyc) → CPython PVM execution'),
      bi('Quản lý môi trường ảo .venv cô lập & pyproject.toml tự động với uv', 'Manage isolated .venv environments & pyproject.toml effortlessly with uv'),
      bi('Nắm vững quy tắc khối lệnh thụt lề 4 dấu cách & đặt tên snake_case', 'Master 4-space indentation blocks & snake_case naming'),
      bi('Phân biệt chạy trực tiếp (__main__) và nạp thư viện qua import', 'Distinguish direct script execution (__main__) vs module import'),
    ],
    buildFrame: (s, total) => {
      const p = s / Math.max(1, total - 1);
      const isLast = s >= total - 1;
      const importMode = s === 3;
      return {
        telemetry: [
          { label: bi('TRÌNH CHẠY', 'RUNTIME'), value: bi('CPython 3.12', 'CPython 3.12'), tone: 'ok' },
          { label: bi('QUẢN LÝ GÓI', 'PKG TOOL'), value: bi('uv + .venv', 'uv + .venv') },
          { label: bi('KHỐI LỆNH', 'CODE BLOCK'), value: bi('4 spaces + :', '4 spaces + :'), tone: p > 0.15 ? 'ok' : 'default' },
          { label: bi('__NAME__', '__NAME__'), value: importMode ? bi('"app" (imported)', '"app" (imported)') : bi('"__main__"', '"__main__"'), tone: importMode ? 'warn' : 'ok' },
        ],
        whatChanged:
          s === 0
            ? [
                { op: '+', text: bi('CPython đọc file .py, dịch sang Bytecode (.pyc) rồi chạy trên máy ảo PVM', 'CPython compiles .py source into Bytecode (.pyc) and runs on PVM') },
              ]
            : s === 1
              ? [
                  { op: '+', text: bi('Tạo ngăn thư viện riêng .venv và khai báo dự án trong pyproject.toml bằng uv', 'Created isolated .venv & pyproject.toml project config via uv') },
                ]
              : s === 2
                ? [
                    { op: '+', text: bi('Xác định phạm vi khối lệnh bằng dấu : và thụt lề 4 dấu cách chuẩn', 'Defined code block boundaries via colon : and 4-space indentation') },
                  ]
                : importMode
                  ? [
                      { op: '+', text: bi('Đặt cổng chắn if __name__ == "__main__": bảo vệ file khi được import', 'Added if __name__ == "__main__": guard to skip demo code on import') },
                    ]
                  : [
                      { op: '+', text: bi('Xuất dữ liệu với print(..., sep, end) và thử nghiệm tức thì trong REPL', 'Formatted stdout via print(..., sep, end) and tested live in REPL') },
                    ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Bạn không cần tự gõ lệnh biên dịch thủ công: mỗi khi chạy file .py, CPython tự dịch ngầm sang Bytecode gọn nhẹ rồi thực thi từng bước từ trên xuống dưới.', 'No manual compile step needed: whenever you run a .py file, CPython translates it into compact Bytecode and executes it top-to-bottom on its virtual machine.'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Môi trường ảo .venv giống như hộp đồ nghề riêng của từng dự án giúp các phiên bản thư viện không bao giờ đè lên nhau — và uv tự động tạo/chọn .venv cho bạn!', 'A .venv virtual environment acts like a private toolbox per project so library versions never clash — and uv manages it automatically!'),
                }
              : s === 2
                ? {
                    kind: 'watch-out',
                    text: bi('Trong Python, thụt lề 4 dấu cách là quy tắc cú pháp bắt buộc để tạo khối lệnh: lệch dù chỉ 1 dấu cách sẽ báo IndentationError ngay trước khi chạy!', 'In Python, 4-space indentation is mandatory block syntax: even a 1-space mismatch raises IndentationError before execution starts!'),
                  }
                : importMode
                  ? {
                      kind: 'technique',
                      text: bi('Luôn đặt các dòng chạy thử hoặc input() bên dưới if __name__ == "__main__": để khi file khác (hoặc máy chấm bài) import hàm của bạn sẽ không bị kích hoạt nhầm.', 'Always place demo runs or input() calls inside if __name__ == "__main__": so importing your functions from tests or other files stays clean.'),
                    }
                  : isLast
                    ? {
                        kind: 'key-idea',
                        text: bi('Quy tắc bỏ túi: dùng uv run để chạy đúng .venv, thụt 4 dấu cách sau dấu :, đặt tên snake_case và khóa điểm vào bằng if __name__ == "__main__":.', 'Quick rule: run via uv run (.venv), indent 4 spaces after :, name with snake_case, and guard entrypoints with if __name__ == "__main__":.'),
                      }
                    : {
                        kind: 'technique',
                        text: bi('Mở nhanh bàn thử nghiệm REPL bằng uv run python để gõ thử từng phép tính và xem kết quả ngay lập tức trước khi viết vào file.', 'Open the interactive REPL via uv run python to test expressions and see results immediately before saving to a file.'),
                      },
        scene: {
          zones: [
            { id: 'z1', x: -195, y: 0, w: 280, h: 320, label: bi('Dự án & Công cụ (uv)', 'Project & Tooling (uv)'), tone: 'yellow' },
            { id: 'z2', x: 155, y: 0, w: 360, h: 320, label: bi('Máy ảo CPython Runtime', 'CPython Runtime Engine'), tone: 'green' },
          ],
          nodes: [
            { id: 'dev', shape: 'laptop', tone: 'neutral', x: -250, y: -55, label: bi('uv run app.py', 'uv run app.py') },
            { id: 'venv', shape: 'box', tone: 'yellow', x: -135, y: 78, label: bi('pyproject.toml', 'pyproject.toml'), sublabel: bi('.venv cô lập', 'isolated .venv') },
            { id: 'bytecode', shape: 'hex', tone: 'blue', x: 35, y: -35, label: bi('Bytecode', 'Bytecode'), sublabel: bi('4-space AST', '4-space AST'), icon: 'code', highlighted: s === 1 },
            { id: 'pvm', shape: 'hex', tone: 'green', x: 195, y: -35, label: bi('CPython PVM', 'CPython PVM'), sublabel: bi('Eval Loop', 'Eval Loop'), icon: 'cpu', loadPct: 24, highlighted: s >= 2 },
            {
              id: 'guard',
              shape: 'gate',
              tone: importMode ? 'purple' : 'green',
              x: 195,
              y: 95,
              label: bi('__name__ ?', '__name__ ?'),
              sublabel: importMode ? bi('== "module"', '== "module"') : bi('== "__main__"', '== "__main__"'),
              badge: {
                text: importMode ? bi('chỉ nạp hàm, không chạy main()', 'import only · skip main()') : bi('mở cổng chạy main()', 'run main() entrypoint'),
                tone: importMode ? 'warn' : 'ok',
              },
            },
          ],
          links: [
            { id: 'l1', from: 'dev', to: 'venv', style: 'dashed', label: bi('uv sync', 'uv sync') },
            { id: 'l2', from: 'dev', to: 'bytecode', label: bi('parse .py', 'parse .py') },
            { id: 'l3', from: 'bytecode', to: 'pvm', label: bi('.pyc ops', '.pyc ops') },
            { id: 'l4', from: 'pvm', to: 'guard', style: importMode ? 'dashed' : 'solid', label: bi('print() / entry', 'print() / entry') },
          ],
          packets: [
            { id: 'p1', linkId: 'l2', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l3', kind: 'pointer', speed: 0.5, offset: 0.35 },
            { id: 'p3', linkId: 'l4', kind: importMode ? 'mutation' : 'response', speed: 0.42, offset: 0.6 },
          ],
        },
      };
    },
  },

  M25: {
    id: 'M25',
    titleEn: 'Terminal, Paths & Reading Tracebacks',
    subtitleEn: 'Navigate directories confidently, run scripts via uv, and decode Python tracebacks bottom-up.',
    durationMin: 12,
    difficulty: 'Beginner',
    objectives: [
      bi('Định vị thư mục hiện tại (pwd, ls, cd) & phân biệt đường dẫn tuyệt đối/tương đối', 'Navigate cwd (pwd, ls, cd) & absolute vs relative paths'),
      bi('Khởi chạy file Python chuẩn qua uv run từ đúng thư mục gốc', 'Execute scripts cleanly with uv run from project root'),
      bi('Đọc Traceback ngược từ dòng cuối lên để xác định chính xác dòng code gây lỗi', 'Read Tracebacks bottom-up to pinpoint exact crashing lines'),
      bi('Sửa nhanh FileNotFoundError, SyntaxError & NameError', 'Fix FileNotFoundError, SyntaxError & NameError fast'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const hasError = s >= 4 && !isLast;
      return {
        telemetry: [
          { label: bi('THƯ MỤC (CWD)', 'SHELL CWD'), value: bi('~/learning/src', '~/learning/src') },
          { label: bi('ĐƯỜNG DẪN', 'PATH MODE'), value: s <= 2 ? bi('./main.py (tương đối)', './main.py (relative)') : bi('/Users/.../main.py', '/Users/.../main.py') },
          { label: bi('TRẠNG THÁI', 'EXIT STATUS'), value: hasError ? bi('Exit 1 · Traceback', 'Exit 1 · Traceback') : bi('Exit 0 · OK', 'Exit 0 · OK'), tone: hasError ? 'bad' : 'ok' },
          { label: bi('HƯỚNG ĐỌC LỖI', 'TRACE ORDER'), value: bi('Đáy → Đỉnh (Bottom-Up)', 'Bottom → Up'), tone: 'ok' },
        ],
        whatChanged:
          s <= 1
            ? [
                { op: '+', text: bi('Xác định vị trí thư mục hiện tại bằng pwd và liệt kê file bằng ls', 'Checked current directory with pwd and listed files via ls') },
              ]
            : s <= 3
              ? [
                  { op: '+', text: bi('Phân biệt đường dẫn tuyệt đối (/...) và tương đối (./, ../) khi gọi uv run', 'Resolved absolute (/...) vs relative (./, ../) paths with uv run') },
                ]
              : hasError
                ? [
                    { op: '+', text: bi('Đọc dòng cuối Traceback tìm tên lỗi + nhìn ngược lên File "...", line N', 'Read bottom Traceback line for error type + line number right above') },
                  ]
                : [
                    { op: '+', text: bi('Tổng hợp phản xạ kiểm tra thư mục & giải mã nhanh 10 loại lỗi phổ biến', 'Consolidated directory check & 10-error quick triage workflow') },
                  ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Terminal chỉ là cuộc trò chuyện bằng chữ với hệ điều hành theo mẫu: tên_lệnh --tùy_chọn đối_số — nhanh và chính xác hơn bấm chuột qua nhiều thư mục.', 'The Terminal is simply a text conversation with your OS (command --flags args) — faster and more repeatable than clicking nested folders.'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('90% lỗi "No such file or directory" là do Terminal đang đứng sai thư mục. Hãy tập phản xạ gõ pwd và ls kiểm tra trước, kết hợp phím Tab để tự điền tên file!', '90% of "No such file" errors happen because Terminal is in another folder. Check pwd and ls first, and press Tab to autocomplete filenames!'),
                }
              : s <= 3
                ? {
                    kind: 'technique',
                    text: bi('Đường dẫn bắt đầu bằng dấu / là tuyệt đối (đứng đâu cũng đúng); không có / ở đầu là tương đối tính từ nơi đang đứng (dùng .. để lùi lên 1 cấp cha).', 'Paths starting with / are absolute (valid anywhere); paths without a leading / are relative to your current folder (use .. to step up one parent level).'),
                  }
                : hasError
                  ? {
                      kind: 'watch-out',
                      text: bi('Đừng hoảng khi thấy 20 dòng chữ đỏ! Luôn nhìn DÒNG CUỐI CÙNG trước (loại lỗi + lý do), rồi nhìn ngay dòng File "...", line N sát phía trên nó.', 'Never panic at a 20-line red dump! Read the VERY LAST LINE first (error type + message), then check File "...", line N right above it.'),
                    }
                  : {
                      kind: 'key-idea',
                      text: bi('Quy tắc gỡ lỗi 3 giây: kiểm tra pwd/ls nếu không thấy file, tuyệt đối không đặt tên file trùng thư viện chuẩn (như random.py), và đọc Traceback từ dưới lên.', '3-second debug rule: check pwd/ls for missing files, never name scripts after stdlib modules (like random.py), and always read Tracebacks bottom-up.'),
                    },
        scene: {
          nodes: [
            { id: 'sh', shape: 'laptop', tone: 'neutral', x: -255, y: 10, label: bi('zsh · Terminal', 'zsh · Terminal') },
            { id: 'fs', shape: 'cylinder', tone: 'yellow', x: -75, y: -75, label: bi('Cây Thư Mục', 'Directory Tree'), sublabel: bi('./  ../  /root', './  ../  /root'), icon: 'layers' },
            { id: 'uv', shape: 'hex', tone: 'blue', x: -45, y: 65, label: bi('uv run', 'uv run'), sublabel: bi('runner', 'runner'), icon: 'terminal' },
            {
              id: 'stack',
              shape: 'stack',
              tone: hasError ? 'rose' : 'green',
              x: 205,
              y: 5,
              label: hasError ? bi('Traceback (Đọc từ đáy ↑)', 'Traceback (Read bottom ↑)') : bi('Call Stack (Êm)', 'Call Stack (Clean)'),
              stackFrames: hasError
                ? ['1. main() line 12', '2. calc(0) line 6', '🔥 ZeroDivisionError!']
                : ['1. main() line 12', '2. greet("An")', '✔ Exit Code 0'],
              highlighted: hasError,
              badge: hasError ? { text: bi('Đọc dòng cuối trước!', 'Read bottom line first!'), tone: 'bad' } : { text: bi('Chạy thành công', 'Clean exit'), tone: 'ok' },
            },
          ],
          links: [
            { id: 'l1', from: 'sh', to: 'fs', style: 'dashed', label: bi('pwd · ls · cd', 'pwd · ls · cd') },
            { id: 'l2', from: 'sh', to: 'uv', label: bi('uv run app.py', 'uv run app.py') },
            { id: 'l3', from: 'uv', to: 'stack', style: hasError ? 'danger' : 'solid', label: hasError ? bi('exception raised', 'exception raised') : bi('execute frames', 'execute frames') },
          ],
          packets: [
            { id: 'p1', linkId: 'l2', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l3', kind: hasError ? 'error' : 'response', speed: 0.42, offset: 0.45 },
          ],
        },
      };
    },
  },

  M26: {
    id: 'M26',
    titleEn: 'First Program: print, Variables & First Functions',
    subtitleEn: 'Understand input → variable binding → def/return vs print, default parameters, and f-strings.',
    durationMin: 12,
    difficulty: 'Beginner',
    objectives: [
      bi('Hiểu dòng chảy vào – xử lý – ra của một chương trình Python', 'Understand the Input → Process → Output pipeline'),
      bi('Phân biệt rạch ròi print() (chỉ in ra màn hình, trả về None) và return (trả giá trị thật)', 'Distinguish print() (side-effect, returns None) vs return (yields value)'),
      bi('Gán biến rõ nghĩa và đọc chuỗi từ người dùng bằng input()', 'Bind clear variable names and read user strings via input()'),
      bi('Ghép biến & biểu thức trực quan bằng f-string f"Xin chào {name}"', 'Interpolate variables cleanly with f-strings f"Hello {name}"'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const returnFocus = s >= 4;
      return {
        telemetry: [
          { label: bi('ĐẦU VÀO', 'STDIN'), value: bi('input() → luôn là str', 'input() → always str') },
          { label: bi('PRINT() TRẢ VỀ', 'PRINT() RETURNS'), value: bi('None (chỉ hiển thị)', 'None (display only)'), tone: 'warn' },
          { label: bi('RETURN TRẢ VỀ', 'RETURN YIELDS'), value: returnFocus ? bi('Giá trị tái sử dụng được', 'Reusable value!') : bi('Sẵn sàng', 'Ready'), tone: returnFocus ? 'ok' : 'default' },
          { label: bi('CHUỖI MẪU', 'TEMPLATE'), value: bi('f"{name}: {total}"', 'f"{name}: {total}"'), tone: 'ok' },
        ],
        whatChanged:
          s <= 1
            ? [
                { op: '+', text: bi('Thực thi kịch bản tuần tự từ trên xuống & phân biệt chuỗi có nháy với phép tính', 'Executed script top-to-bottom & contrasted quoted literals vs expressions') },
              ]
            : s <= 3
              ? [
                  { op: '+', text: bi('Gán biến từ phải sang trái (=) và đọc chuỗi bàn phím qua input()', 'Bound variable tags right-to-left (=) and read stdin strings via input()') },
                ]
              : [
                  { op: '+', text: bi('Định nghĩa hàm def trả giá trị thực bằng return và định dạng f-string', 'Defined function emitting real values via return and formatted f-strings') },
                  { op: '-', text: bi('Loại bỏ lỗi cộng tiếp kết quả hàm chỉ có print() (None + 1 → TypeError)', 'Eliminated TypeError from chaining a print-only function (None + 1)') },
                ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Python chạy file .py từng dòng một từ trên xuống dưới theo 3 nhịp tự nhiên: Nhận đầu vào → Xử lý qua biến/hàm → Xuất kết quả.', 'Python executes a .py file line-by-line top-to-bottom across 3 natural beats: Read input → Transform in variables/functions → Output result.'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Có dấu nháy là chữ nguyên văn (print("5 + 3") in ra 5 + 3), không dấu nháy là phép tính (print(5 + 3) in ra 8); dấu # mở đầu ghi chú cho người đọc.', 'Quotes mean literal text (print("5 + 3") prints 5 + 3), whereas no quotes evaluate math (print(5 + 3) prints 8); # starts a comment.'),
                }
              : s === 2
                ? {
                    kind: 'key-idea',
                    text: bi('Dấu = đơn là phép gán từ PHẢI sang TRÁI: Python tính xong biểu thức bên phải trước rồi mới gắn nhãn biến bên trái vào kết quả đó.', 'Single = is right-to-left assignment: Python evaluates the right-hand side completely first, then binds the left-hand variable name to it.'),
                  }
                : s === 3
                  ? {
                      kind: 'watch-out',
                      text: bi('Hàm input() LUÔN trả về chuỗi (str) kể cả khi người dùng gõ số 25! Muốn cộng trừ nhân chia, hãy bọc int(input(...)) hoặc float(input(...)).', 'input() ALWAYS returns a str even if the user types 25! Wrap with int(input(...)) or float(input(...)) before arithmetic.'),
                    }
                  : !isLast
                    ? {
                        kind: 'watch-out',
                        text: bi('Bẫy số 1 của người mới: viết print(a + b) bên trong hàm thay vì return a + b. print() chỉ hiện chữ rồi trả về None, còn mọi bài kiểm thử đều chấm giá trị return!', 'Beginner Trap #1: writing print(a + b) inside a function instead of return a + b. print() returns None, whereas tests check the return value!'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Tóm tắt quyết định: ép số cho input(), dùng f"..." để chèn biến vào chuỗi gọn đẹp, và luôn kết thúc hàm tính toán bằng return kết_quả.', 'Decision rule: cast input() to numbers, interpolate cleanly with f"...", and always finish data functions with return result.'),
                      },
        scene: {
          nodes: [
            { id: 'in', shape: 'laptop', tone: 'neutral', x: -260, y: 0, label: bi('input("Tên: ")', 'input("Name: ")') },
            { id: 'vars', shape: 'box', tone: 'yellow', x: -85, y: 0, label: bi('name = "An"', 'name = "An"'), sublabel: bi('nhãn biến', 'variable tag') },
            { id: 'fn', shape: 'hex', tone: 'blue', x: 85, y: 0, label: bi('def calc(x):', 'def calc(x):'), sublabel: bi('xử lý & f-string', 'logic & f-string'), icon: 'sparkles', highlighted: returnFocus },
            { id: 'outPrint', shape: 'box', tone: 'orange', x: 265, y: -70, label: bi('print(...) → màn hình', 'print(...) → stdout'), sublabel: bi('trả về None', 'returns None'), dimmed: returnFocus },
            { id: 'outRet', shape: 'hex', tone: 'green', x: 265, y: 70, label: bi('return result', 'return result'), sublabel: bi('tái sử dụng!', 'chainable value!'), icon: 'zap', highlighted: returnFocus },
          ],
          links: [
            { id: 'l1', from: 'in', to: 'vars', label: bi('str', 'str') },
            { id: 'l2', from: 'vars', to: 'fn', label: bi('tham số / args', 'arguments') },
            { id: 'l3', from: 'fn', to: 'outPrint', style: returnFocus ? 'dashed' : 'solid', label: bi('hiển thị chữ', 'side-effect') },
            { id: 'l4', from: 'fn', to: 'outRet', style: returnFocus ? 'solid' : 'dashed', label: bi('trao giá trị thật', 'return value') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.45, offset: 0.3 },
            { id: 'p3', linkId: returnFocus ? 'l4' : 'l3', kind: 'response', speed: 0.45, offset: 0.6 },
          ],
        },
      };
    },
  },

  M27: {
    id: 'M27',
    titleEn: 'Numbers & Arithmetic Operators',
    subtitleEn: 'Compare arbitrary-precision int vs IEEE-754 float, / vs // vs %, operator precedence, and math.isclose.',
    durationMin: 11,
    difficulty: 'Beginner',
    objectives: [
      bi('Phân biệt phép chia thực (/ → float) với chia lấy nguyên (//) và lấy dư (%)', 'Contrast true division (/ → float) with floor division (//) & modulo (%)'),
      bi('Tận dụng kiểu int độ lớn tùy ý không bị tràn số 64-bit', 'Leverage arbitrary-precision Python ints with zero overflow'),
      bi('Áp dụng đúng thứ tự ưu tiên () → ** → * / // % → + -', 'Apply exact precedence () → ** → * / // % → + -'),
      bi('Hiểu sai số nhị phân 0.1 + 0.2 và dùng math.isclose() / Decimal', 'Handle IEEE-754 float drift 0.1 + 0.2 safely via math.isclose()'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const floatTrap = s >= total - 2;
      return {
        telemetry: [
          { label: bi('7 / 2 (CHIA THỰC)', '7 / 2 (TRUE DIV)'), value: bi('3.5 (luôn ra float)', '3.5 (always float)') },
          { label: bi('7 // 2 · 7 % 2', '7 // 2 · 7 % 2'), value: bi('3 (thương) · 1 (dư)', '3 (quot) · 1 (rem)'), tone: 'ok' },
          { label: bi('0.1 + 0.2 == 0.3', '0.1 + 0.2 == 0.3'), value: floatTrap ? bi('False! (0.30000000000000004)', 'False! (0.30000000000000004)') : bi('Cẩn thận sai số', 'Watch float precision'), tone: floatTrap ? 'bad' : 'warn' },
          { label: bi('SO SÁNH CHUẨN', 'SAFE FLOAT CMP'), value: bi('math.isclose() / Decimal', 'math.isclose() / Decimal'), tone: 'ok' },
        ],
        whatChanged:
          s <= 1
            ? [
                { op: '+', text: bi('Phân tách số nguyên int độ lớn vô hạn với chia thực / và cặp chia nguyên //, %', 'Separated arbitrary-precision int from true division / and floor/mod //, %') },
              ]
            : !floatTrap
              ? [
                  { op: '+', text: bi('Áp dụng thứ tự ưu tiên () → ** → -x → * // % → + - và làm tròn chẵn round()', 'Applied precedence () → ** → -x → * // % → + - and round-half-to-even') },
                ]
              : [
                  { op: '~', text: bi('Phát hiện sai số biểu diễn nhị phân chuẩn IEEE-754 trên phép cộng float', 'Exposed IEEE-754 binary rounding drift on 0.1 + 0.2') },
                  { op: '+', text: bi('Thay == trực tiếp trên số thực bằng math.isclose() hoặc Decimal("0.1")', 'Replaced raw float == with math.isclose() or Decimal("0.1")') },
                ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Số nguyên int trong Python tự động mở rộng bộ nhớ không giới hạn (tính 2 ** 200 không bao giờ tràn số!), còn bất kỳ số nào có dấu chấm (5.0) đều là float.', 'Python ints expand to arbitrary precision with zero overflow (2 ** 200 is exact!), whereas any number with a dot (5.0) is a float.'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Phép / luôn sinh ra float (6 / 3 == 2.0). Cặp đôi x // k (thương nguyên) và x % k (số dư) là chìa khóa vàng để đổi giây sang phút:giây và tách chữ số!', '/ always produces a float (6 / 3 == 2.0). The pair x // k and x % k is the golden tool for converting seconds to mm:ss and extracting digits!'),
                }
              : s === 2
                ? {
                    kind: 'watch-out',
                    text: bi('Cẩn thận thứ tự ưu tiên: lũy thừa ** mạnh hơn dấu trừ đứng trước nên -3 ** 2 hiểu là -(3 ** 2) = -9! Muốn bình phương của -3 hãy thêm ngoặc (-3) ** 2.', 'Watch precedence: ** binds tighter than unary minus, so -3 ** 2 means -(3 ** 2) == -9! Parenthesize (-3) ** 2 when squaring a negative number.'),
                  }
                : !floatTrap
                  ? {
                      kind: 'technique',
                      text: bi('Hàm round() làm tròn phần đuôi đúng .5 về SỐ CHẴN gần nhất (round(2.5) == 2, round(3.5) == 4) để triệt tiêu sai lệch tích lũy trong thống kê.', 'round() uses Round-Half-to-Even on exact .5 ties (round(2.5) == 2, round(3.5) == 4) to prevent upward statistical bias.'),
                    }
                  : !isLast
                    ? {
                        kind: 'watch-out',
                        text: bi('Không bao giờ dùng == trực tiếp cho float hoặc lưu tiền bằng float thô! Hãy dùng math.isclose(a, b) cho khoa học và int (đồng/xu) hoặc Decimal("0.1") cho tiền tệ.', 'Never compare floats directly with == or store money in raw floats! Use math.isclose(a, b) for math and integer cents/VND or Decimal("0.1") for money.'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Chốt nhanh: / luôn ra float, // và % lấy thương & dư nguyên, viết x += 1 (không có ++), và luôn dùng math.isclose() / Decimal("...") tránh sai số nhị phân.', 'Quick recap: / yields float, // & % yield quotient & remainder, use x += 1 (no ++), and guard float precision with math.isclose() / Decimal("...").'),
                      },
        scene: {
          nodes: [
            { id: 'num', shape: 'box', tone: 'yellow', x: -245, y: 0, label: bi('Đầu vào: 7, 2', 'Operands: 7, 2'), sublabel: bi('int vô hạn chữ số', 'arbitrary-size int') },
            { id: 'div', shape: 'hex', tone: 'orange', x: -35, y: -75, label: bi('7 / 2 = 3.5', '7 / 2 = 3.5'), sublabel: bi('luôn tạo float', 'always float'), icon: 'zap' },
            { id: 'idiv', shape: 'hex', tone: 'green', x: -35, y: 70, label: bi('7 // 2 = 3', '7 // 2 = 3'), sublabel: bi('7 % 2 = 1 (dư)', '7 % 2 = 1 (mod)'), icon: 'hash', highlighted: !floatTrap },
            {
              id: 'cmp',
              shape: 'gate',
              tone: floatTrap ? 'rose' : 'blue',
              x: 215,
              y: 0,
              label: floatTrap ? bi('math.isclose()', 'math.isclose()') : bi('Thứ tự ưu tiên', 'Precedence'),
              sublabel: floatTrap ? bi('|a - b| ≤ 1e-9', '|a - b| ≤ 1e-9') : bi('() → ** → * // → + -', '() → ** → * // → + -'),
              highlighted: floatTrap,
              badge: floatTrap ? { text: bi('chống bẫy 0.30000000004', 'guards 0.30000000004'), tone: 'ok' } : undefined,
            },
          ],
          links: [
            { id: 'l1', from: 'num', to: 'div', label: bi('chia thực /', 'true div /') },
            { id: 'l2', from: 'num', to: 'idiv', label: bi('chia nguyên // %', 'floor // & %') },
            { id: 'l3', from: 'div', to: 'cmp', style: floatTrap ? 'danger' : 'solid', label: floatTrap ? bi('0.1 + 0.2 drift', '0.1 + 0.2 drift') : bi('float64', 'float64') },
            { id: 'l4', from: 'idiv', to: 'cmp', label: bi('exact int', 'exact int') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.44 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.44, offset: 0.4 },
            { id: 'p3', linkId: 'l3', kind: floatTrap ? 'error' : 'pointer', speed: 0.42, offset: 0.65 },
          ],
        },
      };
    },
  },

  M28: {
    id: 'M28',
    titleEn: 'Data Types, Type Casting & Boolean Logic',
    subtitleEn: 'Explore Python strong typing, explicit int()/str() casting, short-circuit logic, Truthy/Falsy, and None.',
    durationMin: 12,
    difficulty: 'Beginner',
    objectives: [
      bi('Hiểu Python là ngôn ngữ Định kiểu Mạnh: không tự động ghép "5" + 3', 'Grasp Strong Dynamic Typing: Python refuses implicit "5" + 3'),
      bi('Ép kiểu tường minh an toàn bằng int(), float(), str(), bool()', 'Cast explicitly and safely with int(), float(), str(), bool()'),
      bi('Nắm chắc tập giá trị Falsy (0, 0.0, "", [], {}, set(), None)', 'Memorize the exact Falsy set (0, 0.0, "", [], {}, set(), None)'),
      bi('Luôn kiểm tra rỗng đặc biệt bằng is None / is not None', 'Always test singleton None using is None / is not None'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const truthyPhase = s >= 3;
      return {
        telemetry: [
          { label: bi('KIỂU ĐỘNG MẠNH', 'TYPING MODEL'), value: bi('"5" + 3 → TypeError', '"5" + 3 → TypeError'), tone: 'warn' },
          { label: bi('ÉP KIỂU ĐÚNG', 'EXPLICIT CAST'), value: bi('int("5") + 3 = 8', 'int("5") + 3 = 8'), tone: 'ok' },
          { label: bi('NHÓM FALSY', 'FALSY VALUES'), value: bi('0, "", [], {}, None', '0, "", [], {}, None') },
          { label: bi('KIỂM TRA NONE', 'NONE CHECK'), value: bi('x is None', 'x is None'), tone: 'ok' },
        ],
        whatChanged:
          s <= 2
            ? [
                { op: '+', text: bi('Tường chắn Strong Typing chặn cộng ngầm str với int và mở cầu ép kiểu int()/str()', 'Strong-typing guard blocked str + int and added explicit int()/str() casts') },
              ]
            : [
                { op: '+', text: bi('Đánh giá ngắn mạch and/or, lọc nhóm Falsy và kiểm tra định danh x is None', 'Applied short-circuit and/or, Falsy filtering, and identity check x is None') },
              ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Mỗi giá trị trong Python đều mang kiểu rõ ràng (int, float, str, bool, NoneType) — dùng type(x) để soi nhanh khi học và isinstance(x, int) để kiểm tra trong code.', 'Every Python value carries a runtime type (int, float, str, bool, NoneType) — inspect with type(x) in REPL and check via isinstance(x, int) in code.'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Định kiểu Mạnh (Strong Typing): Python thà báo lỗi TypeError ở phép "5" + 3 còn hơn tự ý đoán mò ép kiểu làm sai lệch kết quả tính toán ngầm!', 'Strong Typing: Python raises TypeError on "5" + 3 rather than silently guessing string concatenation or addition behind your back!'),
                }
              : s === 2
                ? {
                    kind: 'watch-out',
                    text: bi('Bẫy ép kiểu chuỗi số thực: gọi thẳng int("3.5") sẽ nổ lỗi ValueError vì dấu chấm không phải chữ số nguyên! Phải đi qua 2 bước: int(float("3.5")).', 'Decimal-string trap: int("3.5") raises ValueError because "." is not an integer digit! Convert in two steps: int(float("3.5")).'),
                  }
                : s === 3
                  ? {
                      kind: 'technique',
                      text: bi('Nhờ Đánh giá ngắn mạch (Short-Circuit), viết so_luong > 0 and tong / so_luong >= 5 giúp dừng ngay khi so_luong == 0, bảo vệ phép chia khỏi lỗi chia 0!', 'Thanks to Short-Circuit Evaluation, count > 0 and total / count >= 5 stops immediately when count == 0, safely guarding against ZeroDivisionError!'),
                    }
                  : !isLast
                    ? {
                        kind: 'watch-out',
                        text: bi('Mọi tập rỗng ([], {}, "", 0, None) đều là Falsy, nhưng chuỗi "0" hay "False" có độ dài >= 1 nên là Truthy! Ngoài ra nhớ kiểm tra bool trước int vì isinstance(True, int) là True.', 'Empty values ([], {}, "", 0, None) are Falsy, but non-empty strings like "0" are Truthy! Also check bool before int since isinstance(True, int) is True.'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Nguyên tắc bỏ túi: chủ động ép kiểu int()/float()/str(), kiểm tra tập rỗng gọn bằng if not items:, và luôn kiểm tra rỗng đặc biệt bằng if x is None:.', 'Pocket rule: cast explicitly via int()/float()/str(), check empty containers with if not items:, and always test None with if x is None:.'),
                      },
        scene: {
          nodes: [
            { id: 'raw', shape: 'box', tone: 'orange', x: -255, y: -45, label: bi('input: "42"', 'input: "42"'), sublabel: bi('type: str', 'type: str') },
            { id: 'err', shape: 'gate', tone: 'rose', x: -65, y: -85, label: bi('"42" + 8', '"42" + 8'), sublabel: bi('TypeError!', 'TypeError!'), badge: { text: bi('chặn ép kiểu ngầm', 'no implicit coercion'), tone: 'bad' } },
            { id: 'cast', shape: 'hex', tone: 'blue', x: -65, y: 55, label: bi('int("42")', 'int("42")'), sublabel: bi('ép kiểu tường minh', 'explicit cast'), icon: 'filter', highlighted: !truthyPhase },
            { id: 'truth', shape: 'gate', tone: 'purple', x: 185, y: -20, label: bi('Truthy / Falsy', 'Truthy / Falsy'), sublabel: bi('and · or · is None', 'and · or · is None'), highlighted: truthyPhase },
            { id: 'ok', shape: 'hex', tone: 'green', x: 255, y: 95, label: bi('50 (int)', '50 (int)'), sublabel: bi('Truthy ✔', 'Truthy ✔'), icon: 'zap' },
          ],
          links: [
            { id: 'l1', from: 'raw', to: 'err', style: 'danger', label: bi('cộng trực tiếp', 'raw + int') },
            { id: 'l2', from: 'raw', to: 'cast', label: bi('int(x)', 'int(x)') },
            { id: 'l3', from: 'cast', to: 'truth', label: bi('short-circuit', 'short-circuit') },
            { id: 'l4', from: 'truth', to: 'ok', label: bi('bool(50) == True', 'bool(50) == True') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'error', speed: 0.36 },
            { id: 'p2', linkId: 'l2', kind: 'request', speed: 0.48 },
            { id: 'p3', linkId: 'l4', kind: 'response', speed: 0.48, offset: 0.5 },
          ],
        },
      };
    },
  },

  M01: {
    id: 'M01',
    titleEn: 'Variables, Object References & Operators',
    subtitleEn: 'See how Python names point to Heap objects, distinguish == vs is, handle negative // and %, and swap via tuple unpacking.',
    durationMin: 12,
    difficulty: 'Beginner',
    objectives: [
      bi('Hiểu biến trong Python là nhãn dán (name tag) trỏ tới Object trên Heap', 'Visualize Python variables as name tags pointing to Heap objects'),
      bi('Phân biệt rạch ròi == (giá trị) với is (định danh) và quy tắc //, % cho số âm', 'Distinguish == (value) vs is (identity) and negative // & % rules'),
      bi('So sánh chuỗi điều kiện toán học 0 <= score <= 100 & logic or trả toán hạng', 'Write chained comparisons 0 <= score <= 100 & value-returning or'),
      bi('Hoán đổi hai biến trong 1 dòng a, b = b, a & tách hàm tính toán thuần', 'Swap variables via Tuple Unpacking a, b = b, a & decouple pure functions'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const unpackPhase = s >= 4;
      return {
        telemetry: [
          { label: bi('MÔ HÌNH BIẾN', 'BINDING MODEL'), value: bi('Name Tag → Object', 'Name Tag → Object'), tone: 'ok' },
          { label: bi('GIÁ TRỊ VS ĐỊNH DANH', 'EQUAL VS IDENTITY'), value: bi('== (nội dung) · is (cùng id)', '== (value) · is (same id)'), tone: 'ok' },
          { label: bi('OR MẶC ĐỊNH', 'SHORT-CIRCUIT OR'), value: bi('name or "Khách"', 'name or "Guest"') },
          { label: bi('HOÁN ĐỔI', 'TUPLE SWAP'), value: unpackPhase ? bi('a, b = b, a (O(1))', 'a, b = b, a (O(1))') : bi('Sẵn sàng', 'Ready'), tone: unpackPhase ? 'ok' : 'default' },
        ],
        whatChanged:
          s <= 1
            ? [
                { op: '+', text: bi('Ánh xạ nhãn tên từ Namespace sang Object trên Heap và tách biệt == với is', 'Mapped Namespace tags onto Heap objects and contrasted == vs is') },
              ]
            : !unpackPhase
              ? [
                  { op: '+', text: bi('Thực thi chia sàn // làm tròn xuống trục số và so sánh kép 0 <= x <= 100', 'Applied floor division // rounding down and chained 0 <= x <= 100') },
                ]
              : [
                  { op: '+', text: bi('Đảo chéo hai con trỏ a, b = b, a cùng lúc không cần biến tạm temp', 'Cross-swapped name references a, b = b, a atomically without temp') },
                ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Biến trong Python KHÔNG phải chiếc hộp cố định kiểu! Kiểu dữ liệu nằm trên ĐỐI TƯỢNG trong bộ nhớ Heap, còn tên biến chỉ là mảnh nhãn dán buộc dây tới đối tượng đó.', 'A Python variable is NOT a typed box! Types live on HEAP OBJECTS; variable names are just sticky labels pointing to those objects.'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Luôn dùng == để so sánh nội dung số/chuỗi/danh sách bằng nhau, và CHỈ dùng toán tử is khi kiểm tra đối tượng rỗng duy nhất (x is None)!', 'Always use == to compare numbers, strings, or lists by value, and reserve is strictly for singleton identity checks like x is None!'),
                }
              : s === 2
                ? {
                    kind: 'watch-out',
                    text: bi('Với số âm, phép // luôn làm tròn XUỐNG sàn nhỏ hơn trên trục số (-7 // 2 == -4 chứ không phải -3!), và -7 % 3 == 2 luôn giữ dấu dương của số chia 3.', 'On negatives, // rounds DOWN toward negative infinity (-7 // 2 == -4, not -3!), and -7 % 3 == 2 keeps the positive sign of divisor 3.'),
                  }
                : s === 3
                  ? {
                      kind: 'technique',
                      text: bi('Toán tử or trả về chính giá trị Truthy đầu tiên (ten_nhap or "Khách ẩn danh"), kết hợp chuỗi 0 <= diem <= 100 giúp biểu thức vừa ngắn vừa sáng rõ.', 'or returns the first Truthy operand itself (raw_name or "Guest"), and chained 0 <= score <= 100 reads cleanly like math notation.'),
                    }
                  : !isLast
                    ? {
                        kind: 'technique',
                        text: bi('Viết a, b = b, a đóng gói cặp giá trị bên phải trước rồi tráo nhãn cùng lúc; đồng thời hãy tách hàm tính toán thuần khỏi các lệnh input()/print().', 'a, b = b, a packs the right-hand tuple first then swaps bindings atomically; also keep calculation functions pure and separate from input()/print().'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Đúc kết: biến là nhãn tham chiếu (b = a dùng chung đối tượng!), dùng == cho giá trị, is None cho None, -7 // 2 == -4, và a, b = b, a để hoán đổi.', 'Takeaway: variables are object labels (b = a shares references!), use == for values, is None for None, -7 // 2 == -4, and a, b = b, a to swap.'),
                      },
        scene: {
          zones: [
            { id: 'ns', x: -185, y: 0, w: 230, h: 300, label: bi('Không gian tên (Names)', 'Namespace (Labels)'), tone: 'blue' },
            { id: 'hp', x: 140, y: 0, w: 340, h: 300, label: bi('Vùng nhớ Đối tượng (Object Heap)', 'Object Heap'), tone: 'purple' },
          ],
          nodes: [
            { id: 'tagA', shape: 'box', tone: 'blue', x: -185, y: -55, label: bi('a', 'a'), sublabel: bi('name reference', 'name reference') },
            { id: 'tagB', shape: 'box', tone: 'blue', x: -185, y: 65, label: bi('b', 'b'), sublabel: bi('name reference', 'name reference') },
            { id: 'obj1', shape: 'hex', tone: 'green', x: 135, y: -60, label: bi('int · 100', 'int · 100'), sublabel: bi('id: 0x10a', 'id: 0x10a'), icon: 'hash', highlighted: unpackPhase },
            { id: 'obj2', shape: 'hex', tone: 'orange', x: 135, y: 65, label: bi('int · 200', 'int · 200'), sublabel: bi('id: 0x10b', 'id: 0x10b'), icon: 'hash', highlighted: unpackPhase },
          ],
          links: unpackPhase
            ? [
                { id: 's1', from: 'tagA', to: 'obj2', label: bi('a → 200 (swapped)', 'a → 200 (swapped)'), curve: -18 },
                { id: 's2', from: 'tagB', to: 'obj1', label: bi('b → 100 (swapped)', 'b → 100 (swapped)'), curve: 18 },
              ]
            : [
                { id: 'n1', from: 'tagA', to: 'obj1', label: bi('a = 100', 'a = 100') },
                { id: 'n2', from: 'tagB', to: 'obj2', label: bi('b = 200', 'b = 200') },
              ],
          packets: unpackPhase
            ? [
                { id: 'p1', linkId: 's1', kind: 'pointer', speed: 0.48 },
                { id: 'p2', linkId: 's2', kind: 'pointer', speed: 0.48, offset: 0.5 },
              ]
            : [
                { id: 'p1', linkId: 'n1', kind: 'pointer', speed: 0.42 },
                { id: 'p2', linkId: 'n2', kind: 'pointer', speed: 0.42, offset: 0.45 },
              ],
        },
      };
    },
  },

  M02: {
    id: 'M02',
    titleEn: 'Strings (str), Slicing & Immutability',
    subtitleEn: 'Master dual positive/negative indexing, [start:stop:step] slicing, f-string formatting, and O(n) join.',
    durationMin: 14,
    difficulty: 'Beginner',
    objectives: [
      bi('Đọc thông thạo thước chỉ số hai chiều: 0..n-1 từ trái và -n..-1 từ phải', 'Read dual index rulers fluently: 0..n-1 forward & -n..-1 backward'),
      bi('Cắt chuỗi chính xác bằng s[start:stop:step] và đảo chuỗi s[::-1]', 'Slice substrings with s[start:stop:step] and reverse via s[::-1]'),
      bi('Hiểu tính bất biến (Immutable) của str: mọi biến đổi đều sinh chuỗi mới', 'Respect str immutability: mutations allocate new string objects'),
      bi('Ghép danh sách chuỗi lớn bằng "".join(parts) O(n) thay vì cộng dồn +', 'Join string sequences in O(n) with "".join(parts) instead of += loops'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const sliceActive = s === 3 ? [0, 1, 2, 3] : s >= 4 ? [5, 4, 3, 2, 1, 0] : [0, 5];
      const immutPhase = s >= 4;
      return {
        telemetry: [
          { label: bi('ĐỘ DÀI LEN(S)', 'LEN(S)'), value: bi('6 ký tự Unicode', '6 Unicode chars') },
          { label: bi('LÁT CẮT HIỆN TẠI', 'ACTIVE SLICE'), value: s === 3 ? bi('s[1:5] → "ytho"', 's[1:5] → "ytho"') : immutPhase ? bi('s[::-1] → "nohtyP"', 's[::-1] → "nohtyP"') : bi('s[0], s[-1]', 's[0], s[-1]'), tone: 'ok' },
          { label: bi('TÍNH BẤT BIẾN', 'MUTABILITY'), value: bi('Immutable (bất biến)', 'Immutable (locked)'), tone: 'warn' },
          { label: bi('GHÉP N CHUỖI', 'JOIN N PARTS'), value: bi('" ".join() · O(n)', '" ".join() · O(n)'), tone: 'ok' },
        ],
        whatChanged:
          s <= 2
            ? [
                { op: '+', text: bi('Định dạng f-string chuyên sâu và gắn thước chỉ số kép 0..5 / -6..-1', 'Applied f-string formatters and mounted dual 0..5 / -6..-1 index ruler') },
              ]
            : s === 3
              ? [
                  { op: '+', text: bi('Trượt cửa sổ Slicing s[start:stop:step] lấy từ start tới sát trước stop', 'Slid half-open window [start:stop) stopping right before stop') },
                ]
              : [
                  { op: '-', text: bi('Chặn sửa trực tiếp s[0] = "J" (TypeError: chuỗi str là bất biến)', 'Blocked in-place mutation s[0] = "J" (TypeError: immutable)') },
                  { op: '+', text: bi('Tạo đối tượng str mới qua s[::-1], .strip(), .replace() và "".join() O(n)', 'Allocated fresh str via s[::-1], .strip(), .replace(), and O(n) .join()') },
                ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Chuỗi str lưu văn bản Unicode (nháy đơn, nháy kép hoặc 3 dấu nháy nhiều dòng); thêm chữ r trước dấu nháy (r"C:\\new") để giữ nguyên dấu gạch chéo ngược.', 'Python str holds Unicode text (single, double, or triple multiline quotes); prefix with r (r"C:\\new") to keep backslashes literal.'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Trong f-string, đặt đặc tả sau dấu : để định dạng đẹp tức thì: f"{gia:,.2f}" tách hàng nghìn, f"{ma:03d}" đệm số 0, và f"{x=}" tự in tên biến khi gỡ lỗi!', 'Inside f-strings, add format specs after : like f"{price:,.2f}", zero-padded f"{id:03d}", or debug f"{x=}" to print variable names automatically!'),
                }
              : s === 2
                ? {
                    kind: 'key-idea',
                    text: bi('Mỗi chuỗi có 2 chiều đánh số song song: đếm xuôi từ 0 ở đầu trái (s[0]) và đếm lùi từ -1 ở sát cuối phải (s[-1] luôn lấy ký tự cuối cùng cực gọn!).', 'Every string has a dual ruler: 0 counting forward from the left (s[0]) and -1 counting backward from the right (s[-1] grabs the last char cleanly!).'),
                  }
                : s === 3
                  ? {
                      kind: 'technique',
                      text: bi('Quy tắc nửa đóng nửa mở [start:stop): độ dài lát cắt luôn bằng stop - start (s[1:5] lấy 4 ký tự), và cắt vượt biên như s[:99] luôn an toàn không báo lỗi!', 'Half-open [start:stop): slice length is stop - start (s[1:5] grabs 4 chars), and out-of-bounds slices like s[:99] clamp safely without crashing!'),
                    }
                  : !isLast
                    ? {
                        kind: 'watch-out',
                        text: bi('Vì str là bất biến (Immutable), gọi s.strip() đứng một mình KHÔNG làm s thay đổi — phải gán lại s = s.strip()! Khi nối danh sách chuỗi, luôn dùng "".join(ds).', 'Because str is Immutable, calling s.strip() alone leaves s untouched — reassign s = s.strip()! Join many strings in O(n) with "".join(parts).'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi(' Tóm tắt chuỗi: kiểm tra chuỗi con bằng "py" in s, cắt đảo bằng s[a:b:c] / s[::-1], gán lại khi gọi .strip()/.replace(), và khâu danh sách bằng "sep".join().', 'String recap: check substrings with "py" in s, slice/reverse via s[a:b:c] / s[::-1], reassign .strip()/.replace(), and stitch lists with "sep".join().'),
                      },
        scene: {
          nodes: [
            {
              id: 'tape',
              shape: 'tape',
              tone: 'blue',
              x: -60,
              y: -35,
              label: bi('s = "Python"', 's = "Python"'),
              sublabel: bi('immutable str', 'immutable str'),
              tapeCells: ['P', 'y', 't', 'h', 'o', 'n'],
              activeIndices: sliceActive,
              showNegativeIndices: true,
              highlighted: true,
            },
            {
              id: 'mutErr',
              shape: 'gate',
              tone: 'rose',
              x: -185,
              y: 105,
              label: bi('s[0] = "J"', 's[0] = "J"'),
              sublabel: bi('TypeError!', 'TypeError!'),
              dimmed: !immutPhase,
            },
            {
              id: 'newStr',
              shape: 'hex',
              tone: 'green',
              x: 215,
              y: 55,
              label: s === 3 ? bi('"Pyth"', '"Pyth"') : bi('".join() / f-str"', '".join() / f-str"'),
              sublabel: bi('đối tượng str mới', 'new str allocated'),
              icon: 'sparkles',
              badge: { text: bi('O(k) cấp phát mới', 'O(k) fresh copy'), tone: 'ok' },
            },
          ],
          links: [
            { id: 'l1', from: 'mutErr', to: 'tape', style: 'danger', label: bi('bị khóa bất biến', 'immutable lock') },
            { id: 'l2', from: 'tape', to: 'newStr', label: s === 3 ? bi('s[0:4]', 's[0:4]') : bi('s[start:stop:step]', 's[start:stop:step]') },
          ],
          packets: [
            ...(immutPhase ? [{ id: 'pe', linkId: 'l1', kind: 'error' as const, speed: 0.38 }] : []),
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46 },
          ],
        },
      };
    },
  },

  M29: {
    id: 'M29',
    titleEn: 'Conditional Branching: if / elif / else',
    subtitleEn: 'Order elif gates from strict to broad, flatten nested pyramids with early-return guards, and test boundaries.',
    durationMin: 11,
    difficulty: 'Beginner',
    objectives: [
      bi('Sắp xếp điều kiện if / elif từ chặt nhất tới rộng nhất để không lọt nhầm nhánh', 'Order if / elif conditions from strictest to broadest'),
      bi('Xóa bỏ "kim tự tháp if lồng nhau" bằng Guard Clauses (return sớm)', 'Flatten deeply nested if-pyramids using early-return Guard Clauses'),
      bi('Viết gọn biểu thức điều kiện 1 dòng a if cond else b đúng chỗ', 'Use single-line conditional expressions a if cond else b cleanly'),
      bi('Kiểm thử chặt các điểm biên (0, số âm, bằng đúng ngưỡng >=)', 'Verify boundary values (0, negative inputs, exact >= thresholds)'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const guardMode = s >= 3;
      return {
        telemetry: [
          { label: bi('THỨ TỰ QUÉT', 'EVALUATION'), value: bi('Trên → Dưới (nhánh đầu đúng)', 'Top → Down (first match)') },
          { label: bi('ĐỘ SÂU LỒNG', 'NESTING DEPTH'), value: guardMode ? bi('1 tầng (Guard Clause)', '1 level (Guard Clause)') : bi('Chuỗi if / elif', 'if / elif chain'), tone: 'ok' },
          { label: bi('ĐIỂM BIÊN', 'BOUNDARY'), value: bi('>= 90 vs > 90', '>= 90 vs > 90'), tone: 'ok' },
          { label: bi('3 NGÔI', 'TERNARY'), value: bi('x if cond else y', 'x if cond else y') },
        ],
        whatChanged:
          s <= 2
            ? [
                { op: '+', text: bi('Xếp cổng chặt (>= 90) lên trước cổng rộng (>= 50) & ghép điều kiện an toàn', 'Ordered strict gate (>= 90) ahead of broad gate (>= 50) & safe boolean logic') },
              ]
            : [
                { op: '+', text: bi('Đặt cổng Guard Clause chặn đầu vào không hợp lệ return sớm ngay đầu hàm', 'Placed early-return Guard Clause at function entry') },
                { op: '-', text: bi('Xóa bỏ kim tự tháp if/else lồng nhau và kiểm thử chặt các điểm ranh giới', 'Flattened nested if-pyramids and verified boundary thresholds') },
              ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Câu lệnh if hoạt động như ghi chuyển làn tàu hỏa: kết thúc dòng điều kiện bằng dấu :, thụt lề 4 dấu cách cho phần thân; lùi về cột 0 là ra khỏi nhánh.', 'An if statement switches execution tracks: end the header with :, indent the body 4 spaces, and return to column 0 to exit the branch.'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Python chạy theo luật Nhánh đúng đầu tiên thắng! Nếu đặt if diem >= 50: lên trước elif diem >= 90:, bài 95 điểm sẽ lọt nhầm vào nhánh đầu tiên ngay!', 'First-Match Wins: if you put if score >= 50: above elif score >= 90:, a score of 95 gets swallowed by the first branch and never reaches Grade A!'),
                }
              : s === 2
                ? {
                    kind: 'watch-out',
                    text: bi('Bẫy kinh điển: viết if x == 1 or 2: sẽ LUÔN LUÔN ĐÚNG vì Python hiểu là (x == 1) or (2), mà số 2 là Truthy! Hãy viết chuẩn if x in (1, 2):.', 'Classic bug: if x == 1 or 2: is ALWAYS True because Python parses (x == 1) or 2! Always write if x in (1, 2): instead.'),
                  }
                : s === 3
                  ? {
                      kind: 'technique',
                      text: bi('Guard Clause: kiểm tra các trường hợp rỗng/âm bất thường để return thoát ngay ở đầu hàm, giúp luồng xử lý chính bên dưới phẳng đẹp không cần else.', 'Guard Clauses: reject invalid/empty cases with an early return at the top so the happy path stays flat at indentation level 1.'),
                    }
                  : !isLast
                    ? {
                        kind: 'technique',
                        text: bi('80% bug rẽ nhánh nằm ở đúng điểm ranh giới (0, 18, 90) do nhầm > với >=. Hãy luôn tự nhẩm thử bằng đúng con số nằm trên vạch ranh giới!', '80% of branching bugs hide right on boundary values (0, 18, 90) from mixing up > and >=. Always test exact threshold numbers!'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Quy tắc rẽ nhánh: dùng == (không dùng =) trong if, xếp elif từ chặt tới rộng, dùng x in (...) thay cho nhiều or, và return sớm ở đầu hàm.', 'Branching rule: use == (never =) in conditions, order elif strictest-first, prefer x in (...), and flatten nesting with early returns.'),
                      },
        scene: {
          nodes: [
            { id: 'in', shape: 'box', tone: 'yellow', x: -265, y: 0, label: bi('score = 92', 'score = 92'), sublabel: bi('hạt đầu vào', 'input value') },
            { id: 'g1', shape: 'gate', tone: guardMode ? 'rose' : 'blue', x: -80, y: -55, label: guardMode ? bi('score < 0 ?', 'score < 0 ?') : bi('score >= 90 ?', 'score >= 90 ?'), sublabel: guardMode ? bi('Guard: return sớm', 'Guard: early return') : bi('cổng chặt #1', 'strict gate #1'), highlighted: true },
            { id: 'g2', shape: 'gate', tone: 'purple', x: 75, y: 20, label: bi('score >= 70 ?', 'score >= 70 ?'), sublabel: bi('elif #2', 'elif #2') },
            { id: 'outA', shape: 'hex', tone: 'green', x: 255, y: -65, label: bi('Return "A"', 'Return "A"'), sublabel: bi('khớp nhánh đúng', 'matched branch'), icon: 'zap' },
            { id: 'outElse', shape: 'box', tone: 'neutral', x: 255, y: 80, label: bi('else: "C"', 'else: "C"'), sublabel: bi('mặc định', 'fallback') },
          ],
          links: [
            { id: 'l1', from: 'in', to: 'g1', label: bi('kiểm tra #1', 'check #1') },
            { id: 'l2', from: 'g1', to: 'outA', label: bi('True (92 >= 90)', 'True (92 >= 90)') },
            { id: 'l3', from: 'g1', to: 'g2', style: 'dashed', label: bi('False → elif', 'False → elif') },
            { id: 'l4', from: 'g2', to: 'outElse', style: 'dashed', label: bi('False → else', 'False → else') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.45 },
          ],
        },
      };
    },
  },

  M30: {
    id: 'M30',
    titleEn: 'Loops: for / range, while & Accumulators',
    subtitleEn: 'Trace lazy range() streams, accumulator variables, infinite-loop guards, break/continue, and nested loops.',
    durationMin: 13,
    difficulty: 'Beginner',
    objectives: [
      bi('Hiểu range(start, stop, step) sinh dãy số theo cơ chế Lazy (O(1) RAM), dừng sát trước stop', 'Use lazy range(start, stop, step) stopping right before stop'),
      bi('Thành thạo mẫu Tích lũy (Accumulator: khởi tạo 0/[] trước vòng lặp → cập nhật mỗi vòng)', 'Master the Accumulator pattern (init before loop → update each tick)'),
      bi('Điều khiển luồng vòng lặp chính xác bằng break (thoát vòng lặp) và continue (sang lần lặp kế)', 'Control loop flow cleanly with break (exit) vs continue (skip iteration)'),
      bi('Lập bảng chạy tay (Trace Table) cho vòng lặp while và vòng lặp lồng nhau', 'Build step-by-step Trace Tables for while and nested loops'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const breakMode = s >= 3;
      return {
        telemetry: [
          { label: bi('NGUỒN PHÁT', 'GENERATOR'), value: bi('range(1, 6) → 1..5', 'range(1, 6) → 1..5'), tone: 'ok' },
          { label: bi('BỘ TÍCH LŨY', 'ACCUMULATOR'), value: bi('total = 0 → 15', 'total = 0 → 15'), tone: 'ok' },
          { label: bi('ĐIỀU KHIỂN LẶP', 'LOOP CONTROL'), value: breakMode ? bi('break / continue', 'break / continue') : bi('Duyệt tuần tự hết dãy', 'Full iteration') },
          { label: bi('RAM TIÊU THỤ', 'RANGE MEMORY'), value: bi('O(1) · 48 bytes', 'O(1) · 48 bytes'), tone: 'ok' },
        ],
        whatChanged:
          s <= 1
            ? [
                { op: '+', text: bi('Khởi tạo biến tích lũy total = 0 bên ngoài trước khi chạy vòng lặp for', 'Initialized accumulator total = 0 outside before entering the for loop') },
                { op: '+', text: bi('Phát từng số qua range(1, n + 1) tiết kiệm RAM O(1) và cộng dồn total += x', 'Streamed numbers lazily via range(1, n + 1) into total += x') },
              ]
            : !breakMode
              ? [
                  { op: '+', text: bi('Kiểm tra điều kiện canh trước mỗi vòng while và cập nhật biến tiến tới dừng', 'Checked while guard before each pass and updated variable toward stop') },
                ]
              : [
                  { op: '+', text: bi('Điều hướng vòng lặp bằng continue (bỏ qua lượt) & break (thoát khẩn cấp)', 'Controlled loop flow with continue (skip tick) & break (exit loop)') },
                ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('range(start, stop) luôn dừng SÁT TRƯỚC stop và chỉ tốn vài chục byte RAM! Muốn đếm từ 1 tới đúng n (bao gồm cả n), hãy nhớ viết range(1, n + 1).', 'range(start, stop) stops RIGHT BEFORE stop in O(1) RAM! To count from 1 through n inclusive, always write range(1, n + 1).'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Lỗi kinh điển ở mẫu Tích lũy: đặt tong = 0 thụt vào BÊN TRONG vòng for khiến tổng bị xóa trắng về 0 ở mỗi vòng! Luôn khởi tạo ở ngoài trước vòng lặp.', 'Classic Accumulator bug: putting total = 0 INSIDE the for loop resets it every pass! Always initialize accumulators outside before the loop.'),
                }
              : s === 2
                ? {
                    kind: 'watch-out',
                    text: bi('Với vòng lặp while, thân vòng lặp BẮT BUỘC phải cập nhật biến điều kiện tiến dần tới False — quên dòng đó sẽ gây treo vòng lặp vô tận (dừng bằng Ctrl+C)!', 'Inside a while loop, you MUST update the condition variable toward False — forgetting it causes an infinite hang (abort with Ctrl+C)!'),
                  }
                : s === 3
                  ? {
                      kind: 'technique',
                      text: bi('Phân biệt rõ hai van điều hướng: break thoát HẲN ra khỏi vòng lặp ngay lập tức, còn continue chỉ bỏ qua phần dưới của lượt hiện tại để sang phần tử kế.', 'Know your valves: break exits the ENTIRE loop immediately, whereas continue skips only the remainder of the current pass to start the next item.'),
                    }
                  : !isLast
                    ? {
                        kind: 'technique',
                        text: bi('Khi vòng lặp chạy sai ý, hãy kẻ Bảng chạy tay (ghi cột lượt, biến x, biến tổng qua 3 vòng đầu) và dùng enumerate(ds) thay cho range(len(ds)).', 'When loop output looks off, sketch a 3-row Trace Table by hand and prefer enumerate(items) over manual range(len(items)) indexing.'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Quy tắc chọn vòng lặp: biết trước dãy/số lần → dùng for + range(1, n + 1); chưa biết số bước → dùng while (nhớ cập nhật điều kiện dừng!).', 'Loop choice rule: known sequence/count → for + range(1, n + 1); unknown step count → while (always advance the stop condition!).'),
                      },
        scene: {
          nodes: [
            { id: 'rng', shape: 'tape', tone: 'blue', x: -210, y: -30, label: bi('range(1, 6)', 'range(1, 6)'), tapeCells: ['1', '2', '3', '4', '5'], activeIndices: [0, 1, 2] },
            { id: 'gate', shape: 'gate', tone: 'purple', x: 15, y: -30, label: breakMode ? bi('if cond: break', 'if cond: break') : bi('for x in range:', 'for x in range:'), sublabel: bi('nhịp lặp', 'loop tick'), highlighted: true },
            { id: 'acc', shape: 'cylinder', tone: 'green', x: 225, y: -45, label: bi('total += x', 'total += x'), sublabel: bi('Accumulator: 15', 'Accumulator: 15'), icon: 'layers', badge: { text: bi('khởi tạo ngoài vòng lặp', 'init outside loop'), tone: 'ok' } },
            { id: 'exit', shape: 'box', tone: 'orange', x: 165, y: 95, label: bi('Sau vòng lặp', 'After Loop'), sublabel: bi('return total', 'return total'), dimmed: !breakMode },
          ],
          links: [
            { id: 'l1', from: 'rng', to: 'gate', label: bi('nhả từng số x', 'next x') },
            { id: 'l2', from: 'gate', to: 'acc', label: bi('cộng dồn', 'accumulate') },
            { id: 'l3', from: 'gate', to: 'exit', style: breakMode ? 'solid' : 'dashed', label: breakMode ? bi('break thoát ngay!', 'break exits now!') : bi('hết dãy', 'exhausted') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.52 },
            { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.52, offset: 0.35 },
            ...(breakMode ? [{ id: 'p3', linkId: 'l3', kind: 'response' as const, speed: 0.45, offset: 0.6 }] : []),
          ],
        },
      };
    },
  },

  M03: {
    id: 'M03',
    titleEn: 'Pythonic Control Flow: match/case, zip & for-else',
    subtitleEn: 'Write expressive structural pattern matching, parallel enumerate/zip iteration, and Pythonic for-else searches.',
    durationMin: 13,
    difficulty: 'Intermediate',
    objectives: [
      bi('Khớp cấu trúc dữ liệu phức tạp (tuple, dict, command) bằng match / case', 'Destructure tuples, dicts & commands cleanly with match / case'),
      bi('Duyệt kèm chỉ số bằng enumerate() và ghép song song nhiều dãy bằng zip()', 'Iterate with indices via enumerate() and pair sequences via zip()'),
      bi('Hiểu đúng đặc sản for ... else: khối else CHỈ chạy khi vòng lặp không bị break', 'Master for ... else: else runs ONLY if the loop never hit break'),
      bi('Tách biệt hàm tính toán trả dữ liệu thuần khỏi lớp print() giao diện', 'Decouple pure data-returning logic from UI print() statements'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const forElse = s >= 4;
      return {
        telemetry: [
          { label: bi('KHỚP MẪU', 'PATTERN MATCH'), value: bi('match cmd: case [op, x]', 'match cmd: case [op, x]'), tone: 'ok' },
          { label: bi('GHÉP DÃY', 'PARALLEL ITER'), value: bi('enumerate() · zip()', 'enumerate() · zip()'), tone: 'ok' },
          { label: bi('NHÁNH FOR-ELSE', 'FOR-ELSE RULE'), value: bi('Chạy khi KHÔNG break', 'Runs when NO break'), tone: 'warn' },
          { label: bi('TÁCH BIỆT', 'ARCHITECTURE'), value: bi('Pure fn != print()', 'Pure fn != print()') },
        ],
        whatChanged:
          s <= 1
            ? [
                { op: '+', text: bi('Bóc tách trực tiếp cấu trúc list/tuple/dict bằng match / case (Python 3.10+)', 'Destructured sequences & commands cleanly via match / case (Python 3.10+)') },
              ]
            : !forElse
              ? [
                  { op: '+', text: bi('Ghép song song hai dãy bằng zip() và đánh số tự động bằng enumerate()', 'Paired parallel streams via zip() and numbered items with enumerate()') },
                ]
              : [
                  { op: '+', text: bi('Thay thế biến cờ found = False thủ công bằng nhánh for ... else tự nhiên', 'Replaced manual found = False flag with Pythonic for ... else') },
                ],
        callout:
          s === 0
            ? {
                kind: 'good-to-know',
                text: bi('Mọi khối lệnh sau dấu : trong Python phải có ít nhất 1 dòng lệnh — dùng từ khóa pass làm lệnh giữ chỗ hợp lệ khi bạn đang phác thảo khung hàm hoặc nhánh.', 'Every colon-headed block in Python needs at least one statement — use the no-op keyword pass as a clean placeholder while sketching logic.'),
              }
            : s === 1
              ? {
                  kind: 'key-idea',
                  text: bi('match / case vừa kiểm tra hình dáng dữ liệu vừa rút trích biến trong 1 bước, hỗ trợ gộp mẫu bằng | và tự thoát ngay sau nhánh khớp (không bao giờ cần break!).', 'match / case checks structure and binds variables in one step, supports | OR patterns, and never falls through (zero break needed!).'),
                }
              : s === 2
                ? {
                    kind: 'technique',
                    text: bi('Thấy code viết for i in range(len(items)): gần như luôn có thể viết đẹp hơn bằng enumerate(items, start=1) hoặc ghép đôi song song với zip(a, b)!', 'Seeing for i in range(len(items)): is almost always a cue to upgrade to enumerate(items, start=1) or parallel zip(a, b)!'),
                  }
                : s === 3
                  ? {
                      kind: 'technique',
                      text: bi('Mẫu while True: kết hợp cổng if ...: break ở đầu vòng giúp luồng nhập liệu tương tác gọn sạch, không phải lặp lại câu lệnh input() ở hai nơi.', 'Combining while True: with top-of-loop break/continue guards keeps interactive loops clean without duplicating input() calls.'),
                    }
                  : !isLast
                    ? {
                        kind: 'watch-out',
                        text: bi('Mẹo nhớ for ... else không bao giờ nhầm: hãy đọc thầm chữ "else" thẳng hàng với for là "nếu không bị break" (nobreak) — chỉ chạy khi tìm hết mà không thấy!', 'Mnemonic for for ... else: read the loop’s "else" as "nobreak" — it fires ONLY when the loop finishes naturally without hitting break!'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Chuẩn Pythonic: dùng match/case cho cấu trúc phức tạp, enumerate & zip để duyệt dãy, for-else để tìm kiếm, và trả về list dữ liệu thay vì print trong vòng lặp.', 'Pythonic control: match/case for shapes, enumerate & zip for iteration, for-else for search-not-found, and return data lists instead of printing.'),
                      },
        scene: {
          nodes: [
            { id: 't1', shape: 'tape', tone: 'blue', x: -225, y: -55, label: bi('names', 'names'), tapeCells: ['An', 'Bình', 'Chi'], activeIndices: [0, 1] },
            { id: 't2', shape: 'tape', tone: 'purple', x: -225, y: 55, label: bi('scores', 'scores'), tapeCells: ['85', '92', '78'], activeIndices: [0, 1] },
            { id: 'zip', shape: 'hex', tone: 'green', x: 15, y: 0, label: forElse ? bi('for x in items:', 'for x in items:') : bi('zip() + match', 'zip() + match'), sublabel: bi('ghép cặp & khớp mẫu', 'pair & destructure'), icon: 'layers', highlighted: true },
            { id: 'brk', shape: 'box', tone: 'orange', x: 235, y: -60, label: bi('break (Tìm thấy!)', 'break (Found!)'), sublabel: bi('bỏ qua nhánh else', 'skips else block') },
            { id: 'els', shape: 'box', tone: 'yellow', x: 235, y: 65, label: bi('else: (nobreak)', 'else: (nobreak)'), sublabel: bi('quét hết không thấy', 'not found handler'), highlighted: forElse },
          ],
          links: [
            { id: 'l1', from: 't1', to: 'zip', label: bi('item A', 'item A') },
            { id: 'l2', from: 't2', to: 'zip', label: bi('item B', 'item B') },
            { id: 'l3', from: 'zip', to: 'brk', style: forElse ? 'dashed' : 'solid', label: bi('match!', 'match!') },
            { id: 'l4', from: 'zip', to: 'els', style: forElse ? 'solid' : 'dashed', label: bi('no break', 'no break') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.46, offset: 0.2 },
            { id: 'p3', linkId: forElse ? 'l4' : 'l3', kind: 'response', speed: 0.46, offset: 0.55 },
          ],
        },
      };
    },
  },

  M04: {
    id: 'M04',
    titleEn: 'Lists & Tuples: References, Sorting & Copy Traps',
    subtitleEn: 'Visualize dynamic pointer arrays, sort() vs sorted(), aliasing vs shallow/deep copy, and immutable tuples.',
    durationMin: 15,
    difficulty: 'Intermediate',
    objectives: [
      bi('Hiểu hiệu năng mảng động list: append/pop cuối O(1) vs chèn/xóa đầu O(n)', 'Understand dynamic array costs: O(1) tail append/pop vs O(n) head insert'),
      bi('Phân biệt list.sort() (sửa tại chỗ, trả về None) và sorted(list) (tạo bản mới)', 'Contrast in-place list.sort() (-> None) vs new-list sorted()'),
      bi('Tránh bẫy Aliasing (b = a) và Shallow Copy trên mảng 2 chiều bằng copy.deepcopy', 'Avoid aliasing (b = a) & nested shallow-copy bugs via copy.deepcopy'),
      bi('Dùng tuple cho bản ghi cố định, trả nhiều giá trị và làm khóa cho dict', 'Use immutable tuples for fixed records, multi-returns & dict keys'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const copyTrap = s === 2 || s === 3;
      return {
        telemetry: [
          { label: bi('APPEND / POP()', 'APPEND / POP()'), value: bi('O(1) amortized', 'O(1) amortized'), tone: 'ok' },
          { label: bi('LIST.SORT()', 'LIST.SORT()'), value: bi('In-place · returns None!', 'In-place · returns None!'), tone: 'warn' },
          { label: bi('SAO CHÉP LỒNG', 'NESTED COPY'), value: copyTrap ? bi('Shallow Copy dùng chung list con!', 'Shallow a[:] shares inner!') : bi('copy.deepcopy() độc lập', 'copy.deepcopy() isolated'), tone: copyTrap ? 'bad' : 'ok' },
          { label: bi('TUPLE', 'TUPLE'), value: bi('Immutable · Hashable', 'Immutable · Hashable'), tone: 'ok' },
        ],
        whatChanged:
          s <= 1
            ? [
                { op: '+', text: bi('Cấp phát mảng động over-allocation giúp append() đạt O(1) & tách sort/sorted', 'Over-allocated pointer array for O(1) append() & contrasted sort vs sorted') },
              ]
            : copyTrap
              ? [
                  { op: '~', text: bi('b = a[:] tạo vỏ ngoài mới nhưng các list con bên trong vẫn trỏ chung vùng nhớ!', 'b = a[:] clones outer list but inner sub-lists still share references!') },
                  { op: '+', text: bi('Khắc phục bằng copy.deepcopy(a) và tạo lưới [[0]*c for _ in range(r)]', 'Fixed with copy.deepcopy(a) and [[0]*c for _ in range(r)] grid init') },
                ]
              : [
                  { op: '+', text: bi('Giải nén linh hoạt head, *mid, tail = seq và khóa bản ghi cố định bằng tuple', 'Destructured via starred unpacking and locked fixed records in tuple') },
                ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('list dự phòng sẵn ô trống ở đuôi nên append() và pop() cuối danh sách chạy tức thì O(1); ngược lại chèn/xóa ở đầu (pop(0)) phải dịch chuyển toàn bộ phần tử O(n).', 'list pre-allocates tail capacity so .append() and .pop() run in O(1), whereas head insert(0, x) or pop(0) shifts every item in O(n).'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Tuyệt đối đừng viết a = a.sort() — biến a sẽ biến thành None ngay lập tức! Muốn giữ danh sách mới trả về hãy viết b = sorted(a, key=...).', 'Never write a = a.sort() — that overwrites a with None! Call a.sort() standalone or assign b = sorted(a, key=...).'),
                }
              : s === 2
                ? {
                    kind: 'watch-out',
                    text: bi('a.copy() hoặc a[:] chỉ là Sao chép nông (Shallow Copy 1 tầng): với danh sách lồng nhau, sửa phần tử bên trong list con vẫn làm hỏng bản gốc! Hãy dùng copy.deepcopy(a).', 'a.copy() or a[:] is only a 1-level Shallow Copy: mutating nested inner lists still mutates the original! Use copy.deepcopy(a) for nested structures.'),
                  }
                : s === 3
                  ? {
                      kind: 'watch-out',
                      text: bi('Bẫy ma trận 2D kinh điển: grid = [[0]*3]*3 tạo 3 hàng trỏ chung vào MỘT list duy nhất! Sửa grid[0][0] = 1 làm cả 3 hàng nhảy thành 1. Luôn viết [[0]*3 for _ in range(3)].', 'Classic 2D matrix trap: [[0]*3]*3 aliases all 3 rows to the SAME inner list! Always initialize grids via [[0]*3 for _ in range(3)].'),
                    }
                  : !isLast
                    ? {
                        kind: 'good-to-know',
                        text: bi('Dùng tuple cho bản ghi cố định như tọa độ (x, y) và làm khóa cho dict — nhớ rằng tuple 1 phần tử bắt buộc phải có dấu phẩy (5,) chứ không phải (5)!', 'Use immutable tuples for fixed records like (x, y) and dict keys — and remember a 1-item tuple requires a trailing comma (5,), not (5)!'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Tóm tắt: dùng list khi cần thêm/sửa (nhớ sort() trả về None, deepcopy cho dữ liệu lồng), và dùng tuple bất biến cho bản ghi cố định hoặc khóa từ điển.', 'Recap: use list for mutable sequences (sort() returns None, deepcopy for nested) and immutable tuple for fixed records or dict keys.'),
                      },
        scene: {
          nodes: [
            { id: 'listA', shape: 'tape', tone: 'blue', x: -205, y: -55, label: bi('list a (vỏ ngoài)', 'list a (outer)'), tapeCells: ['ref0', 'ref1', 'ref2'], activeIndices: [0] },
            { id: 'listB', shape: 'tape', tone: copyTrap ? 'orange' : 'green', x: -205, y: 65, label: copyTrap ? bi('b = a[:] (shallow)', 'b = a[:] (shallow)') : bi('b = deepcopy(a)', 'b = deepcopy(a)'), tapeCells: ['ref0', 'ref1', 'ref2'], activeIndices: [0] },
            { id: 'inner1', shape: 'cylinder', tone: copyTrap ? 'rose' : 'purple', x: 95, y: -45, label: bi('Inner [10, 20]', 'Inner [10, 20]'), sublabel: bi('Heap 0x7f01', 'Heap 0x7f01'), icon: 'layers', highlighted: copyTrap, badge: copyTrap ? { text: bi('cả a[0] & b[0] trỏ chung!', 'shared by a[0] & b[0]!'), tone: 'bad' } : undefined },
            { id: 'inner2', shape: 'cylinder', tone: 'green', x: 225, y: 65, label: bi('Clone [10, 20]', 'Clone [10, 20]'), sublabel: bi('Heap 0x9a44 (riêng)', 'Heap 0x9a44 (isolated)'), icon: 'shield', dimmed: copyTrap },
          ],
          links: [
            { id: 'l1', from: 'listA', to: 'inner1', label: bi('a[0]', 'a[0]') },
            ...(copyTrap
              ? [{ id: 'l2', from: 'listB', to: 'inner1', style: 'danger' as const, label: bi('b[0] đụng chung!', 'b[0] shared ref!') }]
              : [{ id: 'l3', from: 'listB', to: 'inner2', label: bi('b[0] độc lập', 'b[0] isolated') }]),
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'pointer', speed: 0.44 },
            { id: 'p2', linkId: copyTrap ? 'l2' : 'l3', kind: copyTrap ? 'error' : 'response', speed: 0.44, offset: 0.5 },
          ],
        },
      };
    },
  },

  M05: {
    id: 'M05',
    titleEn: 'Dict & Set: O(1) Compact Hash Tables',
    subtitleEn: 'Look inside CPython compact dicts, hashable key rules, Counter/defaultdict, and O(1) set algebra.',
    durationMin: 15,
    difficulty: 'Intermediate',
    objectives: [
      bi('Hiểu cơ chế băm hash(key) giúp tra cứu, thêm, xóa trên dict và set đạt O(1)', 'Understand how hash(key) powers O(1) lookup, insert & delete in dict/set'),
      bi('Tránh KeyError bằng d.get(k, default), setdefault, defaultdict và Counter', 'Prevent KeyError with d.get(k, default), defaultdict, and Counter'),
      bi('Nắm quy tắc Key bắt buộc phải Hashable (str, int, tuple bất biến — cấm list/dict)', 'Follow the Hashable Key rule (str, int, immutable tuple — never list/dict)'),
      bi('Sử dụng phép toán tập hợp set (&, |, -, ^) để khử trùng và đối chiếu danh sách cực nhanh', 'Apply set algebra (&, |, -, ^) for instant deduplication & diffing'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const setPhase = s >= 5;
      return {
        telemetry: [
          { label: bi('TRA CỨU DICT/SET', 'LOOKUP TIME'), value: bi('O(1) trung bình', 'O(1) average'), tone: 'ok' },
          { label: bi('THỨ TỰ CHÈN', 'INSERTION ORDER'), value: bi('Bảo toàn (Python 3.7+)', 'Preserved (3.7+)'), tone: 'ok' },
          { label: bi('ĐIỀU KIỆN KEY', 'KEY CONSTRAINT'), value: bi('Hashable (bất biến)', 'Hashable (immutable)'), tone: 'warn' },
          { label: bi('PHÉP TẬP HỢP', 'SET ALGEBRA'), value: bi('A & B · A | B · A - B', 'A & B · A | B · A - B') },
        ],
        whatChanged:
          s <= 2
            ? [
                { op: '+', text: bi('Băm khóa hash(key) nhảy thẳng tới ngăn chứa O(1) và đọc an toàn qua d.get()', 'Hashed key directly to bucket in O(1) and read safely via d.get()') },
              ]
            : !setPhase
              ? [
                  { op: '+', text: bi('Thống kê tần suất tức thì bằng Counter và gom nhóm bằng defaultdict(list)', 'Tallied frequencies via Counter and grouped items via defaultdict(list)') },
                ]
              : [
                  { op: '+', text: bi('Thực thi giao/hợp/hiệu tập hợp A & B, A - B và khử trùng lặp trong O(n)', 'Computed set intersection/diff and deduplicated items in linear O(n)') },
                ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Hình dung dict/set như tủ gửi đồ có đánh mã băm: kiểm tra x in my_set chỉ tốn 1 bước O(1), nhanh hơn hàng nghìn lần so với quét tuần tự x in my_list O(n)!', 'Think of dict/set as a hashed locker room: checking x in my_set takes 1 step O(1), thousands of times faster than scanning x in my_list O(n)!'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Khóa của dict (và phần tử set) bắt buộc phải Hashable (giá trị không đổi suốt vòng đời): dùng str, int, tuple (x, y) được — nhưng dùng list sẽ nổ TypeError ngay!', 'Dict keys and set items must be Hashable (unchanging value): str, int, and immutable tuples (x, y) work, whereas mutable lists raise TypeError!'),
                }
              : s === 2
                ? {
                    kind: 'technique',
                    text: bi('Truy cập d["k"] khi thiếu khóa sẽ nổ KeyError; hãy dùng d.get("k", mac_dinh) để nhận giá trị dự phòng êm ái và dùng d1 | d2 để gộp hai từ điển.', 'd["k"] raises KeyError when missing; use d.get("k", default) for safe fallbacks and d1 | d2 to merge dictionaries cleanly.'),
                  }
                : s <= 4
                  ? {
                      kind: 'good-to-know',
                      text: bi('Đừng viết vòng lặp thủ công dài dòng để đếm hay gom nhóm: collections.Counter đếm tần suất trong 1 dòng, còn defaultdict(list) tự tạo [] cho khóa mới!', 'Skip manual counting boilerplate: collections.Counter tallies items in 1 line, and defaultdict(list) auto-creates [] for unseen keys!'),
                    }
                  : !isLast
                    ? {
                        kind: 'watch-out',
                        text: bi('Cặp ngoặc nhọn rỗng {} tạo ra DICT rỗng chứ không phải set rỗng (phải viết set())! Muốn bỏ phần tử trùng mà vẫn giữ nguyên thứ tự, dùng list(dict.fromkeys(ds)).', 'Empty braces {} create an empty DICT, not a set (use set())! To deduplicate a list while preserving order, use list(dict.fromkeys(items)).'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Đúc kết: dùng dict.get() tránh KeyError, tuple làm khóa ghép, Counter/defaultdict cho thống kê, và set (& | -) khi cần tra cứu/đối chiếu tập lớn O(1).', 'Takeaway: use dict.get() safely, tuples for composite keys, Counter/defaultdict for aggregation, and set (& | -) for O(1) lookups.'),
                      },
        scene: {
          nodes: [
            { id: 'key', shape: 'box', tone: 'yellow', x: -260, y: 0, label: bi('key = "user_42"', 'key = "user_42"'), sublabel: bi('hashable ✔', 'hashable ✔') },
            { id: 'hash', shape: 'hex', tone: 'blue', x: -85, y: 0, label: bi('hash(key) & mask', 'hash(key) & mask'), sublabel: bi('slot = 5 · O(1)', 'slot = 5 · O(1)'), icon: 'hash', highlighted: true },
            { id: 'idx', shape: 'tape', tone: 'purple', x: 145, y: -60, label: bi('dk_indices (Compact)', 'dk_indices (Compact)'), tapeCells: ['-', '2', '-', '0', '-', '1'], activeIndices: [5] },
            { id: 'ent', shape: 'cylinder', tone: 'green', x: 205, y: 70, label: setPhase ? bi('Set Algebra (& | -)', 'Set Algebra (& | -)') : bi('dk_entries[1]', 'dk_entries[1]'), sublabel: setPhase ? bi('lọc trùng O(1)', 'O(1) dedup') : bi('{"user_42": "An"}', '{"user_42": "An"}'), icon: 'db', badge: { text: bi('nhảy thẳng 1 bước O(1)', 'direct 1-hop O(1)'), tone: 'ok' } },
          ],
          links: [
            { id: 'l1', from: 'key', to: 'hash', label: bi('SipHash', 'SipHash') },
            { id: 'l2', from: 'hash', to: 'idx', label: bi('bucket #5', 'bucket #5') },
            { id: 'l3', from: 'idx', to: 'ent', label: bi('entry #1', 'entry #1') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.5 },
            { id: 'p2', linkId: 'l2', kind: 'cache-hit', speed: 0.5, offset: 0.3 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.5, offset: 0.6 },
          ],
        },
      };
    },
  },

  M06: {
    id: 'M06',
    titleEn: 'Comprehensions & Built-in Reducers',
    subtitleEn: 'Unify filter + map in list/dict/set comprehensions and stream millions of items in O(1) RAM with generator expressions.',
    durationMin: 12,
    difficulty: 'Intermediate',
    objectives: [
      bi('Viết gọn map + filter bằng [biến_đổi(x) for x in nguồn if điều_kiện(x)]', 'Express map + filter cleanly via [transform(x) for x in src if cond(x)]'),
      bi('Xây dựng nhanh dict comprehension {k: v ...} và set comprehension {x ...}', 'Construct dicts {k: v ...} and sets {x ...} in one declarative pass'),
      bi('Dùng Generator Expression (x*x for x in ...) truyền vào sum/any/all với RAM O(1)', 'Feed Generator Expressions (...) into sum/any/all using O(1) RAM'),
      bi('Biết điểm dừng: không nhồi comprehension lồng quá 2 tầng gây hại khả năng đọc', 'Know when to stop: avoid unreadable 3-level nested comprehensions'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const genMode = s >= 3;
      return {
        telemetry: [
          { label: bi('CẤU TRÚC', 'PIPELINE'), value: bi('for x → if cond → expr', 'for x → if cond → expr') },
          { label: bi('LIST COMP [...] RAM', 'LIST COMP [...] RAM'), value: bi('O(n) · giữ toàn bộ mảng', 'O(n) · allocates full list'), tone: genMode ? 'warn' : 'default' },
          { label: bi('GEN EXPR (...) RAM', 'GEN EXPR (...) RAM'), value: bi('O(1) · duyệt Lazy từng phần tử', 'O(1) · streams 1 item!'), tone: 'ok' },
          { label: bi('HÀM GỘP', 'REDUCERS'), value: bi('sum · any · all · max', 'sum · any · all · max'), tone: 'ok' },
        ],
        whatChanged:
          !genMode
            ? [
                { op: '+', text: bi('Hợp nhất vòng lặp + điều kiện lọc if + biến đổi thành 1 biểu thức Comprehension', 'Unified loop + filter + transform into one declarative comprehension') },
              ]
            : [
                { op: '~', text: bi('Đổi ngoặc vuông [...] sang ngoặc tròn (...) để tạo Generator Expression (O(1) RAM)', 'Switched [...] brackets to (...) lazy generator stream (O(1) RAM)') },
                { op: '-', text: bi('Loại bỏ danh sách trung gian khổng lồ khi truyền vào sum(), any(), all()', 'Eliminated intermediate list allocation inside sum(), any(), all()') },
              ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Cách đọc tự nhiên nhất của [x * 10 for x in nums if x > 0]: nhìn từ for ở giữa — "với mỗi x trong nums, nếu x > 0 thì thu lấy x * 10".', 'Read [x * 10 for x in nums if x > 0] from the middle for clause: "for each x in nums, if x > 0, collect x * 10".'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Phân biệt vị trí của if: đặt if điều_kiện ở CUỐI để bỏ bớt phần tử (lọc); còn đặt a if điều_kiện else b ở ĐẦU trước for để đổi nhãn mọi phần tử!', 'Watch if placement: trailing if cond filters items out, whereas leading a if cond else b before for transforms every item!'),
                }
              : s === 2
                ? {
                    kind: 'good-to-know',
                    text: bi('Đừng nhồi nhét mọi thứ vào 1 dòng: nếu logic có try/except, chỉ để gọi print(), hoặc lồng từ 3 vòng for trở lên thì hãy viết vòng for truyền thống cho sáng rõ.', 'Know when to stop: if logic needs try/except, side-effects like print(), or 3+ nested loops, write a clean regular for loop instead.'),
                  }
                : s === 3
                  ? {
                      kind: 'technique',
                      text: bi('Chỉ cần bỏ ngoặc vuông [ ] bên trong sum(x * x for x in range(1_000_000)), Python sẽ cộng cuốn chiếu từng con số một với đúng vài chục byte RAM O(1)!', 'Drop the square brackets [ ] inside sum(x * x for x in range(1_000_000)) to stream values lazily in O(1) RAM with zero temporary list!'),
                    }
                  : !isLast
                    ? {
                        kind: 'technique',
                        text: bi('any(x > 100 for x in stream) không tốn mảng tạm VÀ dừng ngay lập tức ở phần tử đầu tiên thỏa mãn; kết hợp zip(*matrix) để chuyển vị ma trận trong 1 dòng!', 'any(x > 100 for x in stream) uses zero list memory AND short-circuits on the very first match; use zip(*matrix) for 1-line matrix transpose!'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Quy tắc chọn: dùng [...], {k: v ...}, {x ...} khi cần giữ cả tập kết quả; bỏ [] dùng Generator Expression khi đưa thẳng vào sum / any / all / max / join.', 'Rule of thumb: use [...], {k: v ...}, {x ...} when keeping the collection; drop [] for a Generator Expression inside sum / any / all / max / join.'),
                      },
        scene: {
          nodes: [
            { id: 'src', shape: 'tape', tone: 'blue', x: -245, y: 0, label: bi('Nguồn 10M dòng', '10M Source Stream'), tapeCells: ['1', '2', '3', '4', '...'], activeIndices: [1, 3] },
            { id: 'flt', shape: 'gate', tone: 'purple', x: -55, y: 0, label: bi('if x % 2 == 0', 'if x % 2 == 0'), sublabel: bi('trạm lọc', 'filter gate') },
            { id: 'map', shape: 'hex', tone: genMode ? 'green' : 'orange', x: 115, y: 0, label: genMode ? bi('(x * x ...)', '(x * x ...)') : bi('[x * x ...]', '[x * x ...]'), sublabel: genMode ? bi('nhả từng hạt · RAM 0KB', 'lazy yield · 0KB RAM') : bi('tạo list mới', 'builds full list'), icon: 'zap', highlighted: true },
            { id: 'red', shape: 'cylinder', tone: 'green', x: 275, y: 0, label: bi('sum / any / all', 'sum / any / all'), sublabel: bi('kết quả cuối', 'final reduction'), icon: 'sparkles' },
          ],
          links: [
            { id: 'l1', from: 'src', to: 'flt', label: bi('for x', 'for x') },
            { id: 'l2', from: 'flt', to: 'map', label: bi('chẵn / even', 'passed if') },
            { id: 'l3', from: 'map', to: 'red', label: genMode ? bi('stream O(1) RAM', 'O(1) stream') : bi('list O(n) RAM', 'O(n) list') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.5 },
            { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.5, offset: 0.3 },
            { id: 'p3', linkId: 'l3', kind: genMode ? 'cache-hit' : 'response', speed: 0.5, offset: 0.6 },
          ],
        },
      };
    },
  },

  M31: {
    id: 'M31',
    titleEn: 'Intro to Errors & try / except',
    subtitleEn: 'Catch specific exceptions cleanly, understand else/finally execution paths, and build safe retry prompts.',
    durationMin: 12,
    difficulty: 'Beginner',
    objectives: [
      bi('Hiểu đầy đủ 4 nhánh: try (thử) → except (bắt lỗi cụ thể) → else (khi không lỗi) → finally (luôn chạy)', 'Master all 4 clauses: try → specific except → else (no error) → finally (always)'),
      bi('Chỉ bắt đúng loại lỗi dự kiến (ValueError, KeyError), tuyệt đối tránh except: trần', 'Catch specific exceptions only; never swallow bugs with bare except:'),
      bi('Xây dựng hàm ép kiểu có giá trị dự phòng và vòng lặp hỏi lại tới khi hợp lệ', 'Build safe fallback parsers and retry-until-valid input loops'),
      bi('Chủ động phát tín hiệu lỗi sớm với raise ValueError("lý do rõ ràng")', 'Fail fast on invalid arguments via raise ValueError("clear message")'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const badInput = s === 1 || s === 2;
      return {
        telemetry: [
          { label: bi('ĐẦU VÀO THỬ', 'TEST INPUT'), value: badInput ? bi('"abc" (lỗi ép số)', '"abc" (invalid int)') : bi('"42" (hợp lệ)', '"42" (valid int)'), tone: badInput ? 'bad' : 'ok' },
          { label: bi('ĐƯỜNG CHẠY', 'ACTIVE PATH'), value: badInput ? bi('try → except → finally', 'try → except → finally') : bi('try → else → finally', 'try → else → finally'), tone: badInput ? 'warn' : 'ok' },
          { label: bi('BẮT LỖI', 'CATCH TARGET'), value: bi('except ValueError:', 'except ValueError:'), tone: 'ok' },
          { label: bi('NUỐT LỖI NGẦM', 'BARE EXCEPT'), value: bi('0 (bị cấm!)', '0 (forbidden!)'), tone: 'ok' },
        ],
        whatChanged: badInput
          ? [
              { op: '+', text: bi('int("abc") phát sinh ValueError → dừng phần còn lại của try, nhảy sang except', 'int("abc") raised ValueError → skipped rest of try into except') },
              { op: '~', text: bi('Bỏ qua nhánh else nhưng vẫn đảm bảo chạy nhánh dọn dẹp finally 100%', 'Skipped else block while still guaranteeing finally cleanup') },
            ]
          : [
              { op: '+', text: bi('Không có lỗi trong try → đi qua nhánh else rồi kết thúc tại finally', 'Zero exception in try → proceeded cleanly into else then finally') },
            ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('try / except là tấm lưới bảo hộ có kiểm soát: nếu dòng rủi ro gặp đúng loại ngoại lệ đã khai báo, chương trình không bị sập mà chuyển sang nhánh phục hồi.', 'try / except is a controlled safety net: if the risky line raises the expected exception, execution recovers cleanly instead of crashing.'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Luôn bắt đích danh loại lỗi cụ thể (như except ValueError as e: hoặc tuple except (KeyError, IndexError):) để các lỗi bất ngờ khác không bị bắt nhầm.', 'Always catch specific exception types (except ValueError as e: or except (KeyError, IndexError):) so unexpected bugs remain visible.'),
                }
              : s === 2
                ? {
                    kind: 'technique',
                    text: bi('Giữ khối try thật nhỏ gọn! Chỉ bọc đúng 1-2 dòng có nguy cơ nổ lỗi, phần xử lý tiếp theo hãy đặt sang else: (chỉ chạy khi try không lỗi) và dọn dẹp ở finally:.', 'Keep the try block tiny! Wrap only the risky line inside try, put follow-up code in else:, and put guaranteed cleanup in finally:.'),
                  }
                : s <= 4
                  ? {
                      kind: 'technique',
                      text: bi('Kết hợp while True: với try / break / except ValueError để hỏi lại người dùng cho tới khi nhập đúng, và dùng raise ValueError("...") khi tham số vi phạm nghiệp vụ.', 'Pair while True: with try / break / except ValueError for retry-until-valid input loops, and raise ValueError("...") on invalid domain inputs.'),
                    }
                  : !isLast
                    ? {
                        kind: 'watch-out',
                        text: bi('Cấm kỵ số 1: tuyệt đối KHÔNG viết except: pass nuốt lỗi im lặng! Nó sẽ che khuất cả lỗi gõ nhầm tên biến NameError và chặn cả phím tắt dừng Ctrl+C!', 'Golden rule: NEVER write silent except: pass! Swallowing every exception hides NameError typos and even traps Ctrl+C KeyboardInterrupt!'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Kỷ luật xử lý lỗi: khối try gọn tối đa, bắt đúng loại ngoại lệ cụ thể, dùng else cho luồng thành công, finally để đóng tài nguyên, và không bao giờ nuốt lỗi.', 'Exception checklist: minimal try block, explicit except types, else for success path, finally for cleanup, and zero silent error swallowing.'),
                      },
        scene: {
          nodes: [
            { id: 'try', shape: 'hex', tone: 'blue', x: -235, y: 0, label: bi('try: int(raw)', 'try: int(raw)'), sublabel: badInput ? bi('raw = "abc"', 'raw = "abc"') : bi('raw = "42"', 'raw = "42"'), icon: 'code' },
            { id: 'exc', shape: 'gate', tone: 'rose', x: 0, y: -75, label: bi('except ValueError:', 'except ValueError:'), sublabel: bi('xử lý an toàn', 'graceful recovery'), highlighted: badInput, dimmed: !badInput },
            { id: 'els', shape: 'hex', tone: 'green', x: 0, y: 75, label: bi('else:', 'else:'), sublabel: bi('chạy khi try êm', 'runs on success'), icon: 'sparkles', highlighted: !badInput, dimmed: badInput },
            { id: 'fin', shape: 'box', tone: 'purple', x: 240, y: 0, label: bi('finally:', 'finally:'), sublabel: bi('luôn luôn chạy 100%', 'always executes 100%'), badge: { text: bi('đóng tài nguyên an toàn', 'guaranteed cleanup'), tone: 'ok' } },
          ],
          links: [
            { id: 'l1', from: 'try', to: 'exc', style: badInput ? 'danger' : 'off', label: bi('raise ValueError', 'raise ValueError') },
            { id: 'l2', from: 'try', to: 'els', style: badInput ? 'off' : 'solid', label: bi('no error', 'no error') },
            { id: 'l3', from: 'exc', to: 'fin', style: badInput ? 'solid' : 'off', label: bi('recovered', 'recovered') },
            { id: 'l4', from: 'els', to: 'fin', style: badInput ? 'off' : 'solid', label: bi('done', 'done') },
          ],
          packets: badInput
            ? [
                { id: 'p1', linkId: 'l1', kind: 'error', speed: 0.45 },
                { id: 'p2', linkId: 'l3', kind: 'response', speed: 0.45, offset: 0.5 },
              ]
            : [
                { id: 'p1', linkId: 'l2', kind: 'request', speed: 0.45 },
                { id: 'p2', linkId: 'l4', kind: 'response', speed: 0.45, offset: 0.5 },
              ],
        },
      };
    },
  },

  M32: {
    id: 'M32',
    titleEn: 'Imports, Standard Library & PyPI',
    subtitleEn: 'Explore Python module namespaces, sys.modules caching, stdlib batteries, uv add, and file-shadowing traps.',
    durationMin: 11,
    difficulty: 'Beginner',
    objectives: [
      bi('Chọn đúng giữa import math, from math import sqrt và import ... as', 'Choose wisely among import mod, from mod import fn, and aliases'),
      bi('Khám phá nhanh mọi thư viện ngay trong REPL với dir(mod) và help(fn)', 'Inspect unfamiliar modules on the fly with dir() and help()'),
      bi('Khai thác thư viện chuẩn sẵn có (Python Stdlib): math, random, datetime, pathlib, collections', 'Tap built-in Stdlib batteries: math, random, datetime, pathlib, collections'),
      bi('Tránh bẫy đặt tên file trùng thư viện chuẩn (random.py, json.py) gây tự import chính mình', 'Avoid naming local files random.py or json.py (module shadowing trap!)'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const shadowTrap = s === 4;
      return {
        telemetry: [
          { label: bi('BỘ NHỚ ĐỆM', 'MODULE CACHE'), value: bi('sys.modules (nạp 1 lần)', 'sys.modules (singleton)'), tone: 'ok' },
          { label: bi('KHO CÓ SẴN', 'STDLIB'), value: bi('math · datetime · random', 'math · datetime · random'), tone: 'ok' },
          { label: bi('BẪY TRÙNG TÊN', 'NAME SHADOWING'), value: shadowTrap ? bi('random.py che khuất Stdlib!', 'random.py shadows Stdlib!') : bi('An toàn (không trùng)', 'Clean (no collision)'), tone: shadowTrap ? 'bad' : 'ok' },
          { label: bi('GÓI NGOÀI', 'PYPI INSTALL'), value: bi('uv add requests', 'uv add requests') },
        ],
        whatChanged: shadowTrap
          ? [
              { op: '~', text: bi('Thư mục hiện tại đứng đầu sys.path nên file random.py cá nhân chặn mất thư viện chuẩn!', 'Current folder sits first in sys.path, causing local random.py to shadow stdlib!') },
            ]
          : [
              { op: '+', text: bi('Phân tầng Built-in / Stdlib / PyPI và lưu đệm module nạp 1 lần vào sys.modules', 'Mapped Built-in / Stdlib / PyPI tiers and cached singleton module in sys.modules') },
            ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Bản đồ 3 tầng rõ ràng: Built-ins (len, sum — dùng ngay), Thư viện chuẩn Stdlib (math, datetime — đi kèm sẵn máy, chỉ cần import), và Gói cộng đồng PyPI (cài bằng uv add).', '3 clear tiers: Built-ins (len, sum — always ready), Standard Library (math, datetime — pre-installed, just import), and PyPI packages (install via uv add).'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Đặt dòng import ở đầu file (tránh from mod import * vì dễ ghi đè tên biến ngầm!), và dùng dir(mod) kèm help(mod.fn) để tra cứu nhanh ngay trong REPL.', 'Place imports at the top of the file (avoid from mod import * namespace pollution!), and inspect modules live in REPL with dir(mod) and help(mod.fn).'),
                }
              : s <= 3
                ? {
                    kind: 'technique',
                    text: bi('Mẹo thực chiến: random.randint(1, 6) lấy BAO GỒM cả 1 và 6 (khác range!), và tạo rng = random.Random(42) gắn seed cố định giúp kết quả lặp lại 100% khi viết test.', 'Pro tip: random.randint(1, 6) includes BOTH 1 and 6 (unlike range!), and rng = random.Random(42) yields 100% reproducible sequences for tests.'),
                  }
                : shadowTrap
                  ? {
                      kind: 'watch-out',
                      text: bi('Nếu gặp lỗi AttributeError: module "random" has no attribute "randint" — 99% bạn vừa đặt tên file bài tập là random.py! Hãy đổi tên file ngay kẻo tự che mất thư viện chuẩn!', 'Seeing AttributeError: module "random" has no attribute "randint"? 99% chance you named your own file random.py, shadowing Stdlib! Rename it immediately.'),
                    }
                  : !isLast
                    ? {
                        kind: 'technique',
                        text: bi('Thiếu gói PyPI bên thứ ba sẽ báo ModuleNotFoundError — chỉ cần chạy uv add <tên_gói> để cài gọn vào .venv rồi import bình thường.', 'Missing a third-party PyPI package raises ModuleNotFoundError — run uv add <pkg> to install it into .venv, then import cleanly.'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Tóm tắt: ưu tiên kiểm tra Thư viện chuẩn có sẵn trước khi cài gói ngoài, dùng random.Random(seed) khi cần kiểm thử, và tuyệt đối tránh đặt tên file trùng module chuẩn.', 'Recap: check built-in Stdlib batteries first, seed random.Random(42) for deterministic tests, and never name local files after Stdlib modules.'),
                      },
        scene: {
          nodes: [
            { id: 'app', shape: 'laptop', tone: 'neutral', x: -255, y: 0, label: bi('app.py', 'app.py') },
            { id: 'cache', shape: 'gate', tone: shadowTrap ? 'rose' : 'purple', x: -55, y: 0, label: shadowTrap ? bi('./random.py (Trùng!)', './random.py (Shadow!)') : bi('sys.modules', 'sys.modules'), sublabel: shadowTrap ? bi('chắn đầu sys.path!', 'blocks sys.path[0]!') : bi('cache nạp 1 lần', 'singleton cache'), highlighted: shadowTrap },
            { id: 'std', shape: 'cylinder', tone: 'green', x: 195, y: -65, label: bi('Python Stdlib', 'Python Stdlib'), sublabel: bi('math · datetime · json', 'math · datetime · json'), icon: 'layers', dimmed: shadowTrap },
            { id: 'pypi', shape: 'cylinder', tone: 'blue', x: 195, y: 70, label: bi('.venv (PyPI)', '.venv (PyPI)'), sublabel: bi('uv add packages', 'uv add packages'), icon: 'box' },
          ],
          links: [
            { id: 'l1', from: 'app', to: 'cache', style: shadowTrap ? 'danger' : 'solid', label: bi('import random', 'import random') },
            { id: 'l2', from: 'cache', to: 'std', style: shadowTrap ? 'off' : 'solid', label: bi('stdlib lookup', 'stdlib lookup') },
            { id: 'l3', from: 'cache', to: 'pypi', style: 'dashed', label: bi('site-packages', 'site-packages') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: shadowTrap ? 'error' : 'request', speed: 0.46 },
            ...(!shadowTrap ? [{ id: 'p2', linkId: 'l2', kind: 'cache-hit' as const, speed: 0.46, offset: 0.45 }] : []),
          ],
        },
      };
    },
  },

  M07: {
    id: 'M07',
    titleEn: 'Functions: *args/**kwargs, Mutable Trap & LEGB Closures',
    subtitleEn: 'Master flexible parameter signatures, cure the mutable default trap, and trace LEGB scope & closures.',
    durationMin: 15,
    difficulty: 'Intermediate',
    objectives: [
      bi('Thiết kế chữ ký hàm linh hoạt: positional, keyword, *args (tuple), **kwargs (dict)', 'Design clean signatures with positional, keyword-only, *args, and **kwargs'),
      bi('Triệt tiêu bẫy Mutable Default (def f(items=[])) bằng mẫu chuẩn items=None', 'Eliminate the Mutable Default Trap (def f(items=[])) using items=None'),
      bi('Dò đúng thứ tự 4 tầng phạm vi biến L → E → G → B và cơ chế Closure giữ trạng thái', 'Trace L → E → G → B scope resolution and stateful closures (nonlocal)'),
      bi('Gắn Type Hints cơ bản cho tham số & kiểu trả về để IDE bắt lỗi sớm', 'Annotate parameter and return types for instant static clarity'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const mutTrap = s === 2;
      const legbPhase = s >= 4;
      return {
        telemetry: [
          { label: bi('GOM THAM SỐ', 'PARAM PACKING'), value: bi('*args (tuple) · **kwargs (dict)', '*args (tuple) · **kwargs (dict)') },
          { label: bi('THAM SỐ MẶC ĐỊNH', 'DEFAULT EVAL TIME'), value: mutTrap ? bi('Tạo 1 lần lúc def! (BẪY)', 'Evaluated ONCE at def! (TRAP)') : bi('items=None → tạo mới mỗi lần', 'items=None → fresh list'), tone: mutTrap ? 'bad' : 'ok' },
          { label: bi('TRA CỨU BIẾN', 'SCOPE ORDER'), value: bi('Local → Enclosing → Global → Builtin', 'Local → Enclosing → Global → Builtin'), tone: 'ok' },
          { label: bi('CLOSURE', 'CLOSURE CELL'), value: legbPhase ? bi('nonlocal giữ biến hàm cha', 'nonlocal retains outer cell') : bi('First-class fn', 'First-class fn') },
        ],
        whatChanged: mutTrap
          ? [
              { op: '~', text: bi('CẢNH BÁO: def add(x, bag=[]) gắn cứng 1 list duy nhất vào fn.__defaults__!', 'ALERT: def add(x, bag=[]) attaches ONE shared list to fn.__defaults__!') },
              { op: '+', text: bi('Sửa chuẩn an toàn: def add(x, bag=None): if bag is None: bag = []', 'Fixed idiom: def add(x, bag=None): if bag is None: bag = []') },
            ]
          : !legbPhase
            ? [
                { op: '+', text: bi('Thiết kế chữ ký hàm rõ nghĩa với Docstring, dấu * keyword-only, *args & **kwargs', 'Designed clear function signatures with Docstring, *, *args & **kwargs') },
              ]
            : [
                { op: '+', text: bi('Tra cứu phạm vi biến 4 tầng LEGB, đóng gói Closure với nonlocal & gắn Type Hints', 'Traced 4-tier LEGB scope, stateful nonlocal closures & Type Hints') },
              ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Hàm trong Python là đối tượng hạng nhất (First-Class Object): hãy ghi """Docstring""" ở dòng đầu thân hàm và nhớ bạn có thể truyền hàm trực tiếp làm đối số (như key=len).', 'Functions in Python are first-class objects: document them with a """Docstring""" and pass functions directly as values (like key=len).'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Đặt dấu * đứng riêng (def gui(to, *, khan_cap=False):) bắt buộc người gọi ghi rõ khan_cap=True — xóa sổ hoàn toàn các lời gọi hàm truyền True/False mù mờ!', 'Place a bare * (def send(to, *, urgent=False):) to force self-documenting keyword calls and eliminate mysterious positional booleans!'),
                }
              : mutTrap
                ? {
                    kind: 'watch-out',
                    text: bi('Bẫy kinh điển nhất Python: giá trị mặc định được tạo ĐÚNG MỘT LẦN vào lúc đọc dòng def (không tạo lại ở mỗi lần gọi)! Tuyệt đối không đặt [] hay {} làm mặc định — hãy dùng None!', 'Python’s #1 trap: default values are evaluated ONCE when def runs, NOT per call! Never use [] or {} as defaults — always default to None and create inside!'),
                  }
                : s === 3
                  ? {
                      kind: 'good-to-know',
                      text: bi('lambda x: biểu_thức chỉ dành cho hàm nhỏ gọn 1 biểu thức truyền nhanh vào key=; khi logic cần nhiều dòng hoặc giải thích rõ ràng, hãy luôn viết def có tên.', 'Reserve lambda x: expr strictly for short single-expression callbacks; whenever logic spans multiple lines, define a named def function.'),
                    }
                  : !isLast
                    ? {
                        kind: 'technique',
                        text: bi('Python tìm tên biến theo 4 tầng Local → Enclosing → Global → Built-in (LEGB) và KHÔNG có phạm vi khối if/for; dùng nonlocal để cập nhật biến giữ trạng thái trong Closure.', 'Python resolves names via Local → Enclosing → Global → Built-in (LEGB) with no if/for block scope; use nonlocal to update state inside a Closure.'),
                      }
                    : {
                        kind: 'key-idea',
                        text: bi('Chốt hàm chuyên nghiệp: luôn dùng bag=None thay cho bag=[], dùng * ép keyword-only rõ nghĩa, nắm chắc LEGB/Closure, và gắn Type Hints để bắt lỗi sớm.', 'Function mastery: default mutable args to None, enforce keyword-only flags with *, respect LEGB/Closures, and add Type Hints for clarity.'),
                      },
        scene: {
          nodes: [
            { id: 'call', shape: 'crowd', tone: 'blue', x: -245, y: 0, label: bi('call #1, #2, #3', 'calls #1, #2, #3') },
            { id: 'fn', shape: 'hex', tone: mutTrap ? 'rose' : 'green', x: -30, y: -35, label: mutTrap ? bi('def add(x, bag=[])', 'def add(x, bag=[])') : bi('def add(x, bag=None)', 'def add(x, bag=None)'), sublabel: bi('*args · **kwargs', '*args · **kwargs'), icon: 'code', highlighted: mutTrap },
            { id: 'heap', shape: 'cylinder', tone: mutTrap ? 'rose' : 'green', x: 215, y: -55, label: mutTrap ? bi('Shared bag [1,2,3!]', 'Shared bag [1,2,3!]') : bi('Fresh [] mỗi lần gọi', 'Fresh [] per call'), sublabel: mutTrap ? bi('rò rỉ giữa các lần gọi!', 'leaks across calls!') : bi('cô lập an toàn', 'cleanly isolated'), icon: 'db', badge: mutTrap ? { text: bi('__defaults__ dùng chung!', 'shared __defaults__!'), tone: 'bad' } : { text: bi('an toàn 100%', 'isolated 100%'), tone: 'ok' } },
            { id: 'legb', shape: 'stack', tone: 'purple', x: 185, y: 82, label: bi('Phạm vi LEGB', 'LEGB Scope Chain'), stackFrames: ['B · Builtins (len)', 'G · Global (module)', 'E · Enclosing (closure)', 'L · Local (inside fn)'], highlighted: legbPhase },
          ],
          links: [
            { id: 'l1', from: 'call', to: 'fn', label: bi('invoke', 'invoke') },
            { id: 'l2', from: 'fn', to: 'heap', style: mutTrap ? 'danger' : 'solid', label: mutTrap ? bi('trỏ chung 1 list!', 'mutates same list!') : bi('if bag is None: []', 'if bag is None: []') },
            { id: 'l3', from: 'fn', to: 'legb', style: 'dashed', label: bi('resolve name', 'resolve name') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.48 },
            { id: 'p2', linkId: 'l2', kind: mutTrap ? 'error' : 'response', speed: 0.48, offset: 0.4 },
            { id: 'p3', linkId: 'l3', kind: 'pointer', speed: 0.4, offset: 0.7 },
          ],
        },
      };
    },
  },

  M08: {
    id: 'M08',
    titleEn: 'Recursion & Memoization (@cache)',
    subtitleEn: 'Watch exponential O(2^n) call trees collapse into linear O(n) lookups with @functools.cache and base cases.',
    durationMin: 14,
    difficulty: 'Intermediate',
    objectives: [
      bi('Thiết kế đệ quy đủ 2 phần bắt buộc: Điểm dừng cơ sở (Base Case) & Bước thu nhỏ bài toán', 'Write sound recursion with an explicit Base Case and shrinking subproblem'),
      bi('Hiểu cơ chế Call Stack và giới hạn an toàn ~1.000 tầng của CPython (RecursionError)', 'Understand the Call Stack and CPython’s ~1,000-frame safety ceiling (RecursionError)'),
      bi('Biến đệ quy bùng nổ hàm mũ O(2^n) thành tuyến tính O(n) chỉ với 1 dòng @functools.cache', 'Collapse exponential O(2^n) trees into O(n) linear time with @functools.cache'),
      bi('Duyệt mượt cấu trúc cây thư mục / JSON lồng sâu bất kỳ và Chia để trị', 'Traverse arbitrarily nested JSON/trees and Divide-and-Conquer problems'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const cached = s >= 2;
      return {
        telemetry: [
          { label: bi('SỐ LẦN GỌI FIB(30)', 'FIB(30) CALLS'), value: cached ? bi('31 lần (tức thì!)', '31 calls (instant!)') : bi('2,692,537 lần (nghẽn!)', '2,692,537 calls (slow!)'), tone: cached ? 'ok' : 'bad' },
          { label: bi('ĐỘ PHỨC TẠP', 'TIME COMPLEXITY'), value: cached ? bi('O(n) · Memoized', 'O(n) · Memoized') : bi('O(2^n) · Exponential', 'O(2^n) · Exponential'), tone: cached ? 'ok' : 'bad' },
          { label: bi('TRẦN CALL STACK', 'MAX STACK DEPTH'), value: bi('1,000 frames (CPython)', '1,000 frames (CPython)'), tone: 'warn' },
          { label: bi('CACHE HIT RATE', 'CACHE HIT RATE'), value: cached ? bi('94% (@cache)', '94% (@cache)') : bi('0% (tính lặp lại)', '0% (recomputing)'), tone: cached ? 'ok' : 'default' },
        ],
        whatChanged: !cached
          ? [
              { op: '+', text: bi('Xếp các khung gọi đệ quy lên Call Stack cho tới khi chạm Base Case n <= 1', 'Pushed recursive frames onto Call Stack down to Base Case n <= 1') },
              { op: '~', text: bi('Cây fib(n) chưa có sổ nhớ tính lặp lại nhánh con theo hàm mũ O(2^n)', 'Unmemoized fib(n) recomputes identical subtrees exponentially O(2^n)') },
            ]
          : [
              { op: '+', text: bi('Gắn @functools.cache lưu kết quả từng tham số đã giải vào bảng băm O(1)', 'Added @functools.cache to memoize solved subproblems in O(1)') },
              { op: '-', text: bi('Cắt tỉa 99.99% nhánh con trùng lặp & duyệt gọn dữ liệu cây/JSON lồng sâu', 'Pruned duplicate subtree recomputations & traversed nested trees cleanly') },
            ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Mọi hàm đệ quy giống như mở búp bê gỗ Nga: bắt buộc phải có Điểm dừng cơ sở (Base Case nhỏ nhất trả kết quả ngay) và Bước thu nhỏ làm đầu vào tiến dần về điểm dừng.', 'Every recursive function works like Russian nesting dolls: it must have an explicit Base Case that stops immediately and a step that shrinks the input toward it.'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Mỗi lời gọi chưa xong đều chiếm 1 tầng trên Call Stack. CPython giới hạn ~1.000 tầng (không tối ưu đệ quy đuôi) — với bài toán đếm thẳng hàng vạn bước, hãy dùng vòng lặp!', 'Each pending call occupies 1 Call Stack frame. CPython caps depth at ~1,000 frames (RecursionError, no TCO) — use a loop for deep flat iterations!'),
                }
              : s === 2
                ? {
                    kind: 'key-idea',
                    text: bi('@functools.cache hoạt động như "cuốn sổ tay ghi đáp số": bài toán con nào giải xong 1 lần liền cất vào sổ, lần sau gặp lại tra ra ngay trong 1 bước O(1)!', '@functools.cache acts like a notebook of solved results: each subproblem is computed once and served in O(1) on every repeat visit!'),
                  }
                : !isLast
                  ? {
                      kind: 'watch-out',
                      text: bi('Lưu ý quan trọng khi dùng @functools.cache: vì đối số được lưu làm khóa của dict ngầm bên dưới, mọi tham số truyền vào hàm phải Hashable (đổi list sang tuple)!', 'Important @functools.cache rule: arguments become dict keys under the hood, so every parameter must be Hashable (convert lists to tuples)!'),
                    }
                  : {
                      kind: 'key-idea',
                      text: bi('Quy tắc chọn: dùng vòng lặp cho dãy phẳng sâu > 1.000 bước; dùng đệ quy cho cấu trúc cây/JSON lồng nhau và gắn @cache ngay khi các nhánh con trùng lặp.', 'Decision rule: use loops for flat >1,000-step sequences; use recursion for nested trees/JSON and add @cache whenever subproblems overlap.'),
                    },
        scene: {
          nodes: [
            { id: 'root', shape: 'hex', tone: 'blue', x: -235, y: 0, label: bi('fib(6)', 'fib(6)'), sublabel: bi('bài toán gốc', 'root call'), icon: 'git', loadPct: cached ? 12 : 98 },
            { id: 'subL', shape: 'hex', tone: cached ? 'green' : 'orange', x: -35, y: -65, label: bi('fib(5) → fib(4)', 'fib(5) → fib(4)'), sublabel: bi('nhánh chính O(n)', 'spine O(n)'), icon: 'cpu' },
            { id: 'dup', shape: 'hex', tone: 'rose', x: -35, y: 75, label: bi('Nhánh trùng O(2^n)', 'Duplicate Subtrees'), sublabel: bi('fib(4), fib(3) lặp lại!', 'recomputed million×!'), icon: 'alert', dimmed: cached, badge: cached ? { text: bi('đã cắt tỉa nhờ @cache!', 'pruned by @cache!'), tone: 'ok' } : { text: bi('bùng nổ hàm mũ!', 'exponential explosion!'), tone: 'bad' } },
            { id: 'memo', shape: 'cylinder', tone: 'purple', x: 215, y: -55, label: bi('@functools.cache', '@functools.cache'), sublabel: bi('{0:0, 1:1, 2:1, 3:2…}', '{0:0, 1:1, 2:1, 3:2…}'), icon: 'zap', dimmed: !cached, highlighted: cached },
            { id: 'base', shape: 'gate', tone: 'green', x: 215, y: 75, label: bi('Base: n <= 1', 'Base: n <= 1'), sublabel: bi('return n (điểm dừng)', 'return n (stop)') },
          ],
          links: [
            { id: 'l1', from: 'root', to: 'subL', label: bi('n - 1', 'n - 1') },
            { id: 'l2', from: 'root', to: 'dup', style: cached ? 'off' : 'danger', label: cached ? bi('pruned', 'pruned') : bi('n - 2 (lặp!)', 'n - 2 (dup!)') },
            { id: 'l3', from: 'subL', to: 'memo', style: cached ? 'solid' : 'off', label: bi('O(1) memo hit', 'O(1) memo hit') },
            { id: 'l4', from: 'subL', to: 'base', label: bi('chạm đáy', 'base case') },
          ],
          packets: cached
            ? [
                { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.5 },
                { id: 'p2', linkId: 'l3', kind: 'cache-hit', speed: 0.55, offset: 0.35 },
                { id: 'p3', linkId: 'l4', kind: 'response', speed: 0.45, offset: 0.65 },
              ]
            : [
                { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.5 },
                { id: 'p2', linkId: 'l2', kind: 'error', speed: 0.6, offset: 0.25 },
                { id: 'p3', linkId: 'l4', kind: 'response', speed: 0.4, offset: 0.6 },
              ],
        },
      };
    },
  },

  M09: {
    id: 'M09',
    titleEn: 'Modules, Packages & Professional src/ Layout',
    subtitleEn: 'Structure multi-file Python packages cleanly with src/ layout, uv.lock reproducibility, and zero circular imports.',
    durationMin: 13,
    difficulty: 'Intermediate',
    objectives: [
      bi('Tổ chức dự án nhiều file chuẩn công nghiệp: pyproject.toml + src/<pkg>/ + tests/', 'Organize multi-file apps with standard pyproject.toml + src/<pkg>/ + tests/'),
      bi('Hiểu vai trò của __init__.py, bộ đệm sys.modules và import tuyệt đối từ package gốc', 'Understand __init__.py, sys.modules caching, and clean absolute imports'),
      bi('Nắm rõ hệ sinh thái công cụ uv + uv.lock so với pip + venv truyền thống', 'Compare modern uv + uv.lock workflow with traditional pip + venv'),
      bi('Nhận diện và phá vỡ vòng lặp Circular Import (a.py ↔ b.py) bằng tách tầng thứ 3', 'Break Circular Imports (a.py ↔ b.py) via shared leaf model extraction'),
    ],
    buildFrame: (s, total) => {
      const isLast = s >= total - 1;
      const circTrap = s >= 4;
      return {
        telemetry: [
          { label: bi('CẤU TRÚC CHUẨN', 'PROJECT LAYOUT'), value: bi('src/<pkg>/ + tests/', 'src/<pkg>/ + tests/'), tone: 'ok' },
          { label: bi('KHÓA PHIÊN BẢN', 'LOCKFILE'), value: bi('uv.lock (tất định)', 'uv.lock (deterministic)'), tone: 'ok' },
          { label: bi('IMPORT VÒNG TRÒN', 'CIRCULAR IMPORT'), value: circTrap ? bi('Đã tách models.py chung', 'Extracted shared models.py') : bi('Không xung đột', 'Zero cycles'), tone: 'ok' },
          { label: bi('KIỂM THỬ', 'TEST RUNNER'), value: bi('uv run pytest', 'uv run pytest') },
        ],
        whatChanged: !circTrap
          ? [
              { op: '+', text: bi('Tổ chức mã nguồn theo bố cục src/<pkg>/ + __init__.py và khóa phiên bản uv.lock', 'Structured package under src/<pkg>/ + __init__.py with deterministic uv.lock') },
            ]
          : [
              { op: '-', text: bi('Phá vỡ vòng gọi chéo service.py ↔ api.py khi module mới nạp dở dang', 'Broke top-level circular import cycle between service.py ↔ api.py') },
              { op: '+', text: bi('Đưa các kiểu dùng chung xuống tầng đáy models.py tạo luồng phụ thuộc 1 chiều', 'Extracted shared types into leaf models.py module (one-way DAG)') },
            ],
        callout:
          s === 0
            ? {
                kind: 'key-idea',
                text: bi('Một file .py là một Module; một thư mục có __init__.py là một Package. Dù được import ở 10 nơi, mỗi module chỉ chạy khởi tạo ĐÚNG 1 LẦN và được nhớ trong sys.modules.', 'A .py file is a Module; a folder with __init__.py is a Package. Imported modules execute ONCE and stay cached in sys.modules.'),
              }
            : s === 1
              ? {
                  kind: 'good-to-know',
                  text: bi('Bố cục src/<tên_gói>/ tách biệt rõ mã nguồn thư viện khỏi thư mục gốc, đảm bảo khi chạy uv run pytest luôn kiểm tra đúng gói đã cài đặt sạch sẽ.', 'The src/<pkg>/ layout separates library code from the root directory so uv run pytest always tests the cleanly installed package.'),
                }
              : s <= 3
                ? {
                    kind: 'good-to-know',
                    text: bi('Toàn cảnh công cụ: uv tự động hóa trọn gói phiên bản Python + .venv + uv.lock siêu tốc, thay thế hoàn toàn các bước gõ venv activate + pip install thủ công truyền thống.', 'Ecosystem view: uv unifies Python versions + .venv + uv.lock at blazing speed, replacing manual venv activation + pip install steps.'),
                  }
                : !isLast
                  ? {
                      kind: 'watch-out',
                      text: bi('Bẫy Circular Import: khi hai file import chéo nhau ở đầu file, Python sẽ nổ ImportError do module chưa nạp xong! Hãy tách phần dùng chung xuống file thứ ba (models.py).', 'Circular Import trap: two files importing each other at top level raise ImportError mid-load! Extract shared types into a third leaf module (models.py).'),
                    }
                  : {
                      kind: 'key-idea',
                      text: bi('Kiến trúc sạch: tổ chức theo src/<pkg>/, khóa phụ thuộc bằng uv.lock, đặt dấu _ cho hàm nội bộ (_helper), và giữ chiều import đi thẳng từ trên xuống (CLI → Service → Models).', 'Clean architecture: use src/<pkg>/, lock with uv.lock, prefix private helpers with _, and keep imports flowing strictly top-down (CLI → Service → Models).'),
                    },
        scene: {
          nodes: [
            { id: 'toml', shape: 'box', tone: 'yellow', x: -255, y: -50, label: bi('pyproject.toml', 'pyproject.toml'), sublabel: bi('+ uv.lock', '+ uv.lock') },
            { id: 'cli', shape: 'laptop', tone: 'neutral', x: -255, y: 65, label: bi('tests/ · main.py', 'tests/ · main.py') },
            { id: 'svc', shape: 'hex', tone: 'blue', x: -20, y: -40, label: bi('src/pkg/service.py', 'src/pkg/service.py'), sublabel: bi('business logic', 'business logic'), icon: 'layers' },
            { id: 'api', shape: 'hex', tone: 'purple', x: -20, y: 75, label: bi('src/pkg/api.py', 'src/pkg/api.py'), sublabel: bi('handlers', 'handlers'), icon: 'globe' },
            { id: 'mod', shape: 'cylinder', tone: 'green', x: 225, y: 15, label: bi('src/pkg/models.py', 'src/pkg/models.py'), sublabel: bi('tầng đáy dùng chung (DAG)', 'shared leaf types (DAG)'), icon: 'shield', highlighted: circTrap },
          ],
          links: [
            { id: 'l1', from: 'cli', to: 'api', label: bi('import pkg.api', 'import pkg.api') },
            { id: 'l2', from: 'api', to: 'svc', label: bi('gọi 1 chiều', 'one-way call') },
            { id: 'l3', from: 'svc', to: 'mod', label: bi('from .models', 'from .models') },
            { id: 'l4', from: 'api', to: 'mod', style: 'dashed', label: bi('from .models', 'from .models') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.45, offset: 0.3 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.45, offset: 0.6 },
          ],
        },
      };
    },
  },
};

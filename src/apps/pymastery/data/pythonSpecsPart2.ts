import type {
  BilingualText,
  CalloutKind,
  StageTelemetryItem,
  StepDiffItem,
} from '@/components/scale-workbench/types';
import type { PyModuleVisualSpec } from './pythonSpecsPart1';

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

interface StepBeat {
  telemetry: StageTelemetryItem[];
  whatChanged: StepDiffItem[];
  callout: {
    kind: CalloutKind;
    text: BilingualText;
  };
}

function pickStepBeat(
  s: number,
  total: number,
  steps: StepBeat[],
  recap: StepBeat
): StepBeat {
  if (total > 1 && s >= total - 1) {
    return recap;
  }
  return steps[Math.min(s, steps.length - 1)];
}

export const PY_SPECS_PART2: Record<string, PyModuleVisualSpec> = {
  M10: {
    id: 'M10',
    titleEn: 'Exceptions, Custom Domain Errors & Pythonic EAFP',
    subtitleEn: 'Master try/except/else/finally, separate Exception from BaseException, chain causes via raise...from, and apply EAFP.',
    durationMin: 14,
    difficulty: 'Intermediate',
    objectives: [
      bi('Nắm chắc 4 nhánh try / except / else / finally và giữ khối try ngắn gọn nhất', 'Isolate risky lines in try, run happy-path follow-up in else, and guarantee cleanup in finally'),
      bi('Hiểu cây phân cấp BaseException vs Exception (không bao giờ dùng except: trần chặn Ctrl+C)', 'Separate BaseException from Exception (never trap Ctrl+C or SystemExit with bare except:)'),
      bi('Tạo lớp lỗi nghiệp vụ riêng kế thừa Exception và nối nguyên nhân gốc bằng raise ... from err', 'Define custom domain exceptions and preserve __cause__ tracebacks via raise ... from err'),
      bi('Áp dụng tư duy Pythonic EAFP tránh tra cứu lặp và triệt tiêu lỗi tranh chấp TOCTOU', 'Apply Pythonic EAFP over LBYL to eliminate double lookups and TOCTOU file race windows'),
    ],
    buildFrame: (s, total) => {
      const isRecap = total > 1 && s >= total - 1;
      const eafp = s >= 4;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('KHỐI TRY', 'TRY SCOPE'), value: bi('Chỉ dòng dễ lỗi', 'Minimal risky lines'), tone: 'ok' },
              { label: bi('NHÁNH ELSE', 'ELSE BRANCH'), value: bi('Chạy khi 0 lỗi', 'Runs on 0 errors'), tone: 'ok' },
              { label: bi('NHÁNH FINALLY', 'FINALLY'), value: bi('Luôn chạy 100%', 'Always runs 100%'), tone: 'ok' },
              { label: bi('LỌC NGOẠI LỆ', 'FILTER'), value: bi('Theo kiểu cụ thể', 'Typed except'), tone: 'default' },
            ],
            whatChanged: [
              { op: '+', text: bi('Cô lập đúng phép ép kiểu/chia trong try và chuyển phần xử lý tiếp sang else', 'Isolated risky conversion inside try and moved happy-path continuation to else') },
              { op: '+', text: bi('Đảm bảo bước giải phóng tài nguyên luôn thực thi nhờ khối finally', 'Guaranteed resource cleanup even across early returns via finally') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Đặt càng ít dòng code trong khối try càng tốt! Nếu nhét 15 dòng vào try, bạn sẽ vô tình bắt nhầm lỗi phát sinh ở dòng không ngờ tới.', 'Keep try blocks surgical! Wrapping 15 lines inside try risks catching unrelated bugs by mistake.'),
            },
          },
          {
            telemetry: [
              { label: bi('NHÁNH HỆ THỐNG', 'SYSTEM SIGNALS'), value: bi('BaseException (Ctrl+C)', 'BaseException (Ctrl+C)'), tone: 'warn' },
              { label: bi('GỐC AN TOÀN', 'SAFE ROOT'), value: bi('Exception subclasses', 'Exception subclasses'), tone: 'ok' },
              { label: bi('EXCEPT: TRẦN', 'BARE EXCEPT:'), value: bi('Cấm tuyệt đối!', 'Strictly forbidden!'), tone: 'bad' },
              { label: bi('THỨ TỰ BẮT', 'CATCH ORDER'), value: bi('Lỗi con → Lỗi cha', 'Specific → General'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Loại bỏ except: trần làm vô hiệu hóa phím dừng Ctrl+C (KeyboardInterrupt)', 'Eliminated bare except: which traps KeyboardInterrupt (Ctrl+C) and SystemExit') },
              { op: '+', text: bi('Chỉ bắt các lớp con cụ thể nằm dưới nhánh Exception', 'Scoped handlers strictly to specific Exception subclasses') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('KeyboardInterrupt và SystemExit kế thừa trực tiếp từ BaseException (không nằm trong Exception). Viết except: pass sẽ khóa cứng Ctrl+C và nuốt sạch lỗi gõ sai tên biến NameError!', 'KeyboardInterrupt and SystemExit inherit from BaseException, not Exception. Writing bare except: pass disables Ctrl+C and silently swallows NameError typos!'),
            },
          },
          {
            telemetry: [
              { label: bi('ĐỌC TRACEBACK', 'TRACEBACK READ'), value: bi('Đọc ngược từ đáy lên', 'Read bottom-up'), tone: 'ok' },
              { label: bi('SAI GIÁ TRỊ', 'BAD VALUE'), value: bi('ValueError: int("x")', 'ValueError: int("x")') },
              { label: bi('SAI KIỂU', 'BAD TYPE'), value: bi('TypeError: "a" + 1', 'TypeError: "a" + 1') },
              { label: bi('ĐỐI TƯỢNG NONE', 'NONE CALL'), value: bi('AttributeError', 'AttributeError'), tone: 'warn' },
            ],
            whatChanged: [
              { op: '+', text: bi('Phân biệt nhanh ValueError (đúng kiểu sai nội dung) với TypeError (sai kiểu)', 'Distinguished ValueError (valid type, invalid content) from TypeError (wrong type)') },
              { op: '+', text: bi('Định vị chính xác dòng gây lỗi bằng cách đọc dòng cuối Traceback trước tiên', 'Pinpointed root failure line by reading Python Tracebacks from bottom line up') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Khi gặp Traceback dài 20 dòng: đọc dòng cuối cùng trước để biết loại Exception, rồi nhìn lên khung tệp gần nhất do bạn viết để thấy ngay dòng code gây lỗi!', 'Facing a 20-line Traceback? Read the very last line first for the exact exception type, then scan up to your own file’s frame!'),
            },
          },
          {
            telemetry: [
              { label: bi('PHÁT TÍN HIỆU', 'RAISE SIGNAL'), value: bi('raise DomainError(...)', 'raise DomainError(...)'), tone: 'ok' },
              { label: bi('KẾ THỪA CHUẨN', 'CUSTOM BASE'), value: bi('class Err(Exception)', 'class Err(Exception)'), tone: 'ok' },
              { label: bi('NỐI NGUYÊN NHÂN', 'CAUSE CHAIN'), value: bi('raise AppErr from e', 'raise AppErr from e'), tone: 'ok' },
              { label: bi('NÉM TIẾP LỖI', 'RE-RAISE'), value: bi('raise (trống)', 'bare raise'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Định nghĩa InsufficientFundsError(Exception) mang theo dữ liệu .missing tường minh', 'Created domain InsufficientFundsError(Exception) carrying structured .missing context') },
              { op: '+', text: bi('Bảo toàn nguyên vẹn dấu vết lỗi gốc trong __cause__ nhờ raise ... from err', 'Preserved original low-level __cause__ traceback via raise ... from err') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Ở ranh giới tầng lưu trữ / mạng, dùng raise OrderConfigError("...") from err để tầng trên bắt gọn lỗi nghiệp vụ mà kỹ sư vận hành vẫn thấy trọn vẹn lỗi gốc!', 'At module boundaries, use raise OrderConfigError("...") from err so callers catch clean domain errors while operators retain the full root cause!'),
            },
          },
          {
            telemetry: [
              { label: bi('PHONG CÁCH', 'PYTHONIC IDIOM'), value: bi('EAFP (Nguyên tử)', 'EAFP (Atomic)'), tone: 'ok' },
              { label: bi('TRA BẢNG BĂM', 'DICT LOOKUPS'), value: bi('1 lần thay vì 2 lần', '1 lookup instead of 2'), tone: 'ok' },
              { label: bi('LỖI TRANH CHẤP', 'TOCTOU RACE'), value: bi('0 ms (đã triệt tiêu)', '0 ms (eliminated)'), tone: 'ok' },
              { label: bi('TỐC ĐỘ KHI ÍT LỖI', 'HAPPY PATH'), value: bi('Cực nhanh (~0 overhead)', 'Near-zero overhead'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Bỏ bước kiểm tra trước if os.path.exists(f) dễ dính lỗi xóa tệp xen giữa (TOCTOU)', 'Removed racy LBYL if os.path.exists(f) pre-check vulnerable to TOCTOU deletion') },
              { op: '+', text: bi('Thực hiện thẳng trong try và bắt gọn (KeyError, FileNotFoundError) theo chuẩn EAFP', 'Adopted atomic EAFP try block catching specific KeyError / FileNotFoundError') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('EAFP ("Easier to Ask Forgiveness than Permission"): trong Python, khối try khi KHÔNG có lỗi xảy ra gần như không tốn chi phí nào — hãy thao tác thẳng thay vì kiểm tra chồng chất!', 'EAFP ("Easier to Ask Forgiveness than Permission"): entering a try block in Python has near-zero cost when no exception is raised — act directly instead of double-checking!'),
            },
          },
          {
            telemetry: [
              { label: bi('GHI LOG LỖI', 'ERROR LOGGING'), value: bi('logger.exception()', 'logger.exception()'), tone: 'ok' },
              { label: bi('LOG HIỆN ĐẠI', 'STRUCTURED LOG'), value: bi('Loguru · structlog', 'Loguru · structlog') },
              { label: bi('GIÁM SÁT PROD', 'CRASH TRACKER'), value: bi('Sentry SDK', 'Sentry SDK'), tone: 'ok' },
              { label: bi('BẪY CHỈ SỐ ÂM', 'NEGATIVE IDX'), value: bi('Kiểm tra lo <= x <= hi', 'Validate lo <= x <= hi'), tone: 'warn' },
            ],
            whatChanged: [
              { op: '+', text: bi('Kết hợp vòng lặp while True + try/except ValueError cho cổng nhập liệu an toàn', 'Paired while True + try/except ValueError for resilient user input validation') },
              { op: '+', text: bi('Tích hợp logger.exception() / structlog / Sentry ghi trọn ngữ cảnh khi gặp sự cố', 'Integrated logger.exception() and structured logging before re-raising errors') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Cảnh giác bẫy chỉ số âm: bắt IndexError trên board[move] KHÔNG chặn được move = -1 vì chỉ số âm hợp lệ trong Python! Luôn kiểm tra rõ 0 <= move < len(board).', 'Watch out for negative indices: catching IndexError on board[move] will NOT reject move = -1 because negative indexing is valid in Python! Check 0 <= move < len(board).'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('NGUYÊN TẮC 1', 'RULE 1'), value: bi('try gọn + except cụ thể', 'Minimal try + typed except'), tone: 'ok' },
            { label: bi('NGUYÊN TẮC 2', 'RULE 2'), value: bi('Kế thừa Exception', 'Subclass Exception'), tone: 'ok' },
            { label: bi('NGUYÊN TẮC 3', 'RULE 3'), value: bi('raise NewErr from e', 'raise NewErr from e'), tone: 'ok' },
            { label: bi('NGUYÊN TẮC 4', 'RULE 4'), value: bi('Ưu tiên EAFP cho I/O', 'Prefer EAFP for I/O'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Tổng kết 4 trụ cột xử lý ngoại lệ an toàn, minh bạch và chuẩn Pythonic', 'Consolidated all 4 pillars of resilient, debuggable Python exception handling') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Quy tắc bỏ túi M10: Không bao giờ dùng except: trần; kế thừa lỗi riêng từ Exception; nối nguyên nhân bằng raise ... from e; và dùng EAFP cho truy xuất lồng / I/O!', 'M10 Pocket Rule: Never write bare except:; subclass Exception; chain causes with raise ... from e; and favor EAFP on nested lookups & I/O!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'low', shape: 'hex', tone: 'orange', x: -240, y: -40, label: bi('Low-level I/O / Parse', 'Low-level I/O / Parse'), sublabel: bi('ValueError / KeyError', 'ValueError / KeyError'), icon: 'db', highlighted: s <= 2 },
            { id: 'wrap', shape: 'gate', tone: 'purple', x: -15, y: -40, label: bi('raise DomainErr from e', 'raise DomainErr from e'), sublabel: bi('bảo toàn __cause__', 'preserves __cause__'), highlighted: s === 3 || isRecap },
            { id: 'eafpNode', shape: 'hex', tone: 'green', x: -15, y: 80, label: bi('EAFP: try action()', 'EAFP: try action()'), sublabel: bi('1 bước nguyên tử', '1 atomic step'), icon: 'zap', highlighted: eafp },
            { id: 'api', shape: 'box', tone: 'blue', x: 225, y: 15, label: bi('Caller / Logging', 'Caller / Logging'), sublabel: bi('else · finally · Sentry', 'else · finally · Sentry'), highlighted: s >= 5 },
          ],
          links: [
            { id: 'l1', from: 'low', to: 'wrap', style: 'danger', label: bi('raw error e', 'raw error e') },
            { id: 'l2', from: 'wrap', to: 'api', label: bi('chained domain err', 'chained domain err') },
            { id: 'l3', from: 'eafpNode', to: 'api', label: bi('0 race window', '0 race window') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'error', speed: 0.44 },
            { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.44, offset: 0.45 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.48, offset: 0.2 },
          ],
        },
      };
    },
  },

  M11: {
    id: 'M11',
    titleEn: 'Files, pathlib.Path, JSON & CSV Streams',
    subtitleEn: 'Guarantee leak-free UTF-8 file handling with context managers, compose cross-OS paths via pathlib /, and stream CSV/JSON.',
    durationMin: 14,
    difficulty: 'Intermediate',
    objectives: [
      bi('Luôn mở tệp bằng with open(..., encoding="utf-8") chống rò rỉ tài nguyên & vỡ dấu tiếng Việt', 'Always open files via with open(..., encoding="utf-8") for leak-free UTF-8 safety'),
      bi('Ghép đường dẫn đa nền tảng gọn đẹp bằng pathlib.Path (/) và quản lý tệp bằng shutil', 'Compose cross-platform paths cleanly using pathlib.Path / and shutil'),
      bi('Phân biệt cặp hàm chuỗi (json.loads/dumps) và cặp hàm tệp (json.load/dump) kèm ensure_ascii=False', 'Distinguish string pairs (json.loads/dumps) from file pairs (json.load/dump)'),
      bi('Đọc/ghi CSV lớn theo luồng từng dòng O(1) RAM bằng csv.DictReader / DictWriter (newline="")', 'Stream large CSV files row-by-row in O(1) RAM via csv.DictReader / DictWriter'),
    ],
    buildFrame: (s, total) => {
      const streamCsv = s >= 3;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('QUẢN LÝ TỆP', 'FILE HANDLE'), value: bi('with open() · Tự đóng', 'with open() · Auto-close'), tone: 'ok' },
              { label: bi('BẢNG MÃ', 'ENCODING'), value: bi('encoding="utf-8" bắt buộc', 'explicit encoding="utf-8"'), tone: 'ok' },
              { label: bi('ĐỌC TỆP LỚN', 'LINE STREAM'), value: bi('for line in f · O(1) RAM', 'for line in f · O(1) RAM'), tone: 'ok' },
              { label: bi('CHẾ ĐỘ GHI', 'WRITE MODES'), value: bi('"w" đè · "a" nối · "x" mới', '"w" trunc · "a" app · "x" excl') },
            ],
            whatChanged: [
              { op: '+', text: bi('Bọc thao tác tệp trong khối with để tự động flush & close kể cả khi văng lỗi', 'Wrapped file handle in with block guaranteeing flush & close on exceptions') },
              { op: '+', text: bi('Chỉ định rõ encoding="utf-8" tránh lỗi bảng mã cp1252 mặc định trên Windows', 'Explicitly passed encoding="utf-8" preventing Windows cp1252 corruption') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Trên Windows, mở tệp văn bản mà quên ghi encoding="utf-8" sẽ dùng bảng mã hệ thống cũ (cp1252) làm hỏng dấu tiếng Việt ngay lập tức!', 'On Windows, omitting encoding="utf-8" falls back to legacy cp1252 and corrupts Vietnamese characters immediately!'),
            },
          },
          {
            telemetry: [
              { label: bi('ĐƯỜNG DẪN', 'PATH ENGINE'), value: bi('Path("data") / "a.csv"', 'Path("data") / "a.csv"'), tone: 'ok' },
              { label: bi('TẠO THƯ MỤC', 'MKDIR SAFE'), value: bi('parents=True, exist_ok=True', 'parents=True, exist_ok=True'), tone: 'ok' },
              { label: bi('THUỘC TÍNH', 'PATH PARTS'), value: bi('.name · .stem · .suffix', '.name · .stem · .suffix') },
              { label: bi('SAO CHÉP / DI CHUYỂN', 'FILE OPS'), value: bi('shutil.copy2 / move', 'shutil.copy2 / move'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Thay thế phép cộng chuỗi đường dẫn dễ lỗi dấu \\ và / giữa Windows & Linux', 'Replaced brittle string path concatenation across Windows \\ and POSIX /') },
              { op: '+', text: bi('Sử dụng đối tượng pathlib.Path kết hợp toán tử / và read_text / write_text', 'Adopted object-oriented pathlib.Path with / operator and read_text/write_text') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Trước khi ghi tệp vào thư mục con có thể chưa tồn tại, hãy luôn gọi path.parent.mkdir(parents=True, exist_ok=True) để tạo cây thư mục an toàn!', 'Before writing a nested file, call path.parent.mkdir(parents=True, exist_ok=True) so missing parent directories are created idempotently!'),
            },
          },
          {
            telemetry: [
              { label: bi('QUY TẮC CHỮ S', 'THE "S" RULE'), value: bi('loads/dumps ⇔ Chuỗi str', 'loads/dumps ⇔ str'), tone: 'ok' },
              { label: bi('CẶP HÀM TỆP', 'FILE STREAM'), value: bi('load/dump ⇔ File object', 'load/dump ⇔ File object'), tone: 'ok' },
              { label: bi('TIẾNG VIỆT JSON', 'UNICODE JSON'), value: bi('ensure_ascii=False', 'ensure_ascii=False'), tone: 'ok' },
              { label: bi('CĂN LỀ ĐẸP', 'PRETTY PRINT'), value: bi('indent=2', 'indent=2') },
            ],
            whatChanged: [
              { op: '+', text: bi('Áp dụng ensure_ascii=False giữ nguyên tiếng Việt thay vì mã thoát \\uXXXX', 'Enabled ensure_ascii=False to preserve readable UTF-8 text instead of \\uXXXX escapes') },
              { op: '+', text: bi('Phân định rõ json.dumps (ra chuỗi RAM) và json.dump (ghi thẳng xuống tệp)', 'Separated in-memory json.dumps/loads from file-stream json.dump/load') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Mẹo nhớ trọn đời: chữ "s" ở cuối json.loads / json.dumps là viết tắt của "string" (chuỗi trong bộ nhớ); không có chữ "s" là làm việc với tệp mở!', 'Lifelong mnemonic: the trailing "s" in json.loads / json.dumps stands for "string"; without "s" (load / dump) reads or writes an open file!'),
            },
          },
          {
            telemetry: [
              { label: bi('LUỒNG CSV', 'CSV STREAM'), value: bi('csv.DictReader · O(1) RAM', 'csv.DictReader · O(1) RAM'), tone: 'ok' },
              { label: bi('THAM SỐ MỞ CSV', 'CSV OPEN ARG'), value: bi('newline="" (Bắt buộc!)', 'newline="" (Mandatory!)'), tone: 'warn' },
              { label: bi('KIỂU DỮ LIỆU Ô', 'CELL TYPE'), value: bi('Luôn là str → ép kiểu!', 'Always str → cast int/float!'), tone: 'warn' },
              { label: bi('GHI TIÊU ĐỀ', 'CSV WRITER'), value: bi('DictWriter.writeheader()', 'DictWriter.writeheader()'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Loại bỏ line.split(",") làm vỡ cột khi nội dung có dấu phẩy nằm trong ngoặc kép', 'Eliminated naive line.split(",") which breaks on quoted commas') },
              { op: '+', text: bi('Đọc luồng từng dòng dạng từ điển qua csv.DictReader kèm newline=""', 'Streamed rows lazily as column-keyed dicts via csv.DictReader with newline=""') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Hai lỗi CSV hay gặp nhất: (1) quên newline="" làm xuất hiện dòng trống xen kẽ trên Windows; (2) quên ép float()/int() vì mọi giá trị từ DictReader đều là chuỗi str!', 'Top 2 CSV pitfalls: (1) forgetting newline="" causes blank extra rows on Windows; (2) forgetting int()/float() casts since all DictReader values are strings!'),
            },
          },
          {
            telemetry: [
              { label: bi('QUÉT ĐỆ QUY', 'TREE WALK'), value: bi('Path("src").rglob("*.py")', 'Path("src").rglob("*.py")'), tone: 'ok' },
              { label: bi('ĐỌC NHỊ PHÂN LỚN', 'BINARY CHUNK'), value: bi('f.read(65536) · Walrus :=', 'f.read(65536) · Walrus :=') },
              { label: bi('JSON TỐC ĐỘ CAO', 'FAST JSON'), value: bi('orjson · msgspec (Rust/C)', 'orjson · msgspec (Rust/C)'), tone: 'ok' },
              { label: bi('PHÂN TÍCH BẢNG', 'TABULAR ENGINE'), value: bi('Polars · Pandas · tomllib', 'Polars · Pandas · tomllib'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Đọc tệp nhị phân nhiều GB theo từng mảnh 64 KB cố định RAM để băm SHA-256', 'Processed multi-GB binary files in 64 KB chunks using walrus := loop') },
              { op: '+', text: bi('Mở rộng sang hệ sinh thái thực tế: tomllib, orjson/msgspec và Polars/Pandas', 'Mapped high-performance ecosystem: tomllib, orjson/msgspec, and Polars/Pandas') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Khi xử lý CSV/Parquet hàng chục triệu dòng hoặc API JSON tải cao, nâng cấp từ csv/json chuẩn sang Polars và orjson/msgspec giúp tăng tốc 10–30 lần!', 'When crunching tens of millions of CSV/Parquet rows or high-QPS JSON, upgrading from stdlib csv/json to Polars and orjson/msgspec yields 10–30× speedups!'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('TỆP VĂN BẢN', 'TEXT FILES'), value: bi('with open(utf-8)', 'with open(utf-8)'), tone: 'ok' },
            { label: bi('ĐƯỜNG DẪN', 'PATHS'), value: bi('pathlib.Path /', 'pathlib.Path /'), tone: 'ok' },
            { label: bi('JSON', 'JSON'), value: bi('ensure_ascii=False', 'ensure_ascii=False'), tone: 'ok' },
            { label: bi('CSV LỚN', 'LARGE CSV'), value: bi('DictReader + newline=""', 'DictReader + newline=""'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Hoàn thiện quy trình I/O tệp không rò rỉ tài nguyên, đa nền tảng và tiết kiệm RAM', 'Completed leak-free, cross-platform, O(1)-memory file & data streaming workflow') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Checklist I/O M11: with open(..., encoding="utf-8") · Path("a") / "b" · json.dumps(ensure_ascii=False) · csv.DictReader(newline="") + ép kiểu số!', 'M11 I/O Checklist: with open(..., encoding="utf-8") · Path("a") / "b" · json.dumps(ensure_ascii=False) · csv.DictReader(newline="") + numeric casts!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'path', shape: 'box', tone: 'yellow', x: -255, y: 0, label: bi('Path("data") / "u.csv"', 'Path("data") / "u.csv"'), sublabel: bi('pathlib đa nền tảng', 'cross-OS pathlib'), highlighted: s === 1 || s >= 4 },
            { id: 'withGate', shape: 'gate', tone: 'green', x: -55, y: 0, label: bi('with open(utf-8):', 'with open(utf-8):'), sublabel: bi('auto close() ✔', 'auto close() ✔'), highlighted: s === 0 },
            { id: 'json', shape: 'hex', tone: 'blue', x: 185, y: -65, label: bi('json.loads / dumps', 'json.loads / dumps'), sublabel: bi('s = string · UTF-8', 's = string · UTF-8'), icon: 'code', highlighted: s === 2 },
            { id: 'csv', shape: 'cylinder', tone: 'purple', x: 185, y: 70, label: bi('csv.DictReader', 'csv.DictReader'), sublabel: bi('stream từng dòng O(1)', 'O(1) row iterator'), icon: 'layers', highlighted: streamCsv },
          ],
          links: [
            { id: 'l1', from: 'path', to: 'withGate', label: bi('open stream', 'open stream') },
            { id: 'l2', from: 'withGate', to: 'json', label: bi('JSON parse', 'JSON parse') },
            { id: 'l3', from: 'withGate', to: 'csv', label: bi('lazy row dict', 'lazy row dict') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: streamCsv ? 'l3' : 'l2', kind: 'response', speed: 0.48, offset: 0.4 },
          ],
        },
      };
    },
  },

  M12: {
    id: 'M12',
    titleEn: 'Building Unix-Clean CLI Tools (argparse, Typer & Rich)',
    subtitleEn: 'Separate clean stdout data from stderr diagnostics, return POSIX exit codes, test main(argv) directly, and explore Typer/Click/Rich.',
    durationMin: 13,
    difficulty: 'Intermediate',
    objectives: [
      bi('Tách sạch dữ liệu kết quả ra stdout (kênh 1), thông báo lỗi ra stderr (kênh 2) và trả đúng Exit Code', 'Keep stdout (fd 1) pure for piped data, send diagnostics to stderr (fd 2), and return Unix exit codes'),
      bi('Xây dựng bộ phân tích cờ dòng lệnh tự sinh --help và kiểm kiểu bằng argparse', 'Build self-documenting, type-checked CLI flags with stdlib argparse'),
      bi('Thiết kế mẫu def main(argv: list[str] | None = None) -> int kiểm thử trực tiếp bằng pytest', 'Structure def main(argv=None) -> int so pytest tests run in-memory without subprocesses'),
      bi('Nắm rõ hệ sinh thái CLI hiện đại của Python: argparse vs Typer, Click và Rich', 'Navigate Python’s CLI ecosystem: stdlib argparse vs Typer, Click, and Rich/Textual'),
    ],
    buildFrame: (s, total) => {
      const pipeMode = s === 0 || s === 2;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('KÊNH STDIN (0)', 'STDIN (FD 0)'), value: bi('Nhận luồng pipe |', 'Reads piped stream') },
              { label: bi('KÊNH STDOUT (1)', 'STDOUT (FD 1)'), value: bi('Chỉ xuất dữ liệu sạch!', 'Pure data output only!'), tone: 'ok' },
              { label: bi('KÊNH STDERR (2)', 'STDERR (FD 2)'), value: bi('Log tiến độ & báo lỗi', 'Progress & errors'), tone: 'warn' },
              { label: bi('EXIT CODE', 'EXIT CODE'), value: bi('0 = OK · != 0 = Lỗi', '0 = OK · != 0 = Fail'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Phân luồng rạch ròi: dữ liệu đi ra stdout, mọi dòng cảnh báo đẩy sang file=sys.stderr', 'Separated pure pipeable stdout data from diagnostic messages on sys.stderr') },
              { op: '+', text: bi('Trả mã thoát chuẩn POSIX để kết nối mượt với toán tử && trong CI/CD', 'Returned POSIX exit status enabling reliable && shell chaining in CI/CD') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Nguyên tắc vàng của Unix: nếu người dùng chạy python tool.py | jq ., chỉ một dòng chữ "Đang tải..." lọt vào stdout cũng làm hỏng toàn bộ JSON! Hãy đẩy log sang sys.stderr.', 'Golden Unix rule: when users pipe python tool.py | jq ., a single "Loading..." line on stdout breaks JSON parsing! Always send logs to sys.stderr.'),
            },
          },
          {
            telemetry: [
              { label: bi('BỘ PHÂN TÍCH', 'FLAG PARSER'), value: bi('argparse.ArgumentParser', 'argparse.ArgumentParser'), tone: 'ok' },
              { label: bi('CỜ BOOLEAN', 'BOOL FLAG'), value: bi('action="store_true"', 'action="store_true"'), tone: 'ok' },
              { label: bi('ĐỔI TÊN THUỘC TÍNH', 'ATTR MAPPING'), value: bi('--dry-run → args.dry_run', '--dry-run → args.dry_run') },
              { label: bi('MÃ LỖI CÚ PHÁP', 'USAGE EXIT'), value: bi('Exit code 2 tự động', 'Auto exit code 2'), tone: 'warn' },
            ],
            whatChanged: [
              { op: '-', text: bi('Bỏ cách cắt sys.argv[1] thủ công dễ nổ IndexError khi thiếu đối số', 'Replaced fragile manual sys.argv indexing prone to IndexError') },
              { op: '+', text: bi('Khai báo type=int, choices=[...] và tự động sinh hướng dẫn --help bằng argparse', 'Added typed flags, constrained choices, and automatic --help via argparse') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('argparse tự động biến dấu gạch ngang "-" ở tên cờ dài thành dấu gạch dưới "_" trên đối tượng kết quả (ví dụ --dry-run truy cập qua args.dry_run).', 'argparse automatically converts hyphens "-" in long flag names to underscores "_" on the parsed Namespace (--dry-run becomes args.dry_run).'),
            },
          },
          {
            telemetry: [
              { label: bi('ĐỌC ĐƯỜNG ỐNG', 'PIPE INPUT'), value: bi('for line in sys.stdin', 'for line in sys.stdin'), tone: 'ok' },
              { label: bi('BIẾN MÔI TRƯỜNG', 'ENV CONFIG'), value: bi('os.environ.get("KEY")', 'os.environ.get("KEY")'), tone: 'ok' },
              { label: bi('TỆP .ENV', '.ENV LOADER'), value: bi('python-dotenv / pydantic', 'python-dotenv / pydantic') },
              { label: bi('RAM TIÊU THỤ', 'STREAM RAM'), value: bi('O(1) từng dòng log', 'O(1) per streamed line'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Hỗ trợ đọc luồng dữ liệu nối ống cat log.txt | python app.py qua sys.stdin', 'Enabled Unix pipeline streaming via lazy iteration over sys.stdin') },
              { op: '+', text: bi('Đọc cấu hình & khóa bí mật qua os.environ.get kèm giá trị dự phòng an toàn', 'Read environment configuration safely with fallback defaults via os.environ.get') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Đừng gọi thẳng os.environ["API_KEY"] nếu biến có thể chưa được thiết lập mà không xử lý KeyError — hãy dùng os.environ.get("API_KEY") và báo lỗi thân thiện ra stderr!', 'Avoid raw os.environ["API_KEY"] without handling missing keys — check os.environ.get("API_KEY") and print a clear diagnostic message to stderr!'),
            },
          },
          {
            telemetry: [
              { label: bi('CHỮ KÝ HÀM MAIN', 'MAIN SIGNATURE'), value: bi('main(argv=None) -> int', 'main(argv=None) -> int'), tone: 'ok' },
              { label: bi('KIỂM THỬ PYTEST', 'PYTEST SPEED'), value: bi('~1 ms (không mở subprocess)', '~1 ms (in-process call)'), tone: 'ok' },
              { label: bi('CỔNG KHỞI CHẠY', 'ENTRYPOINT'), value: bi('raise SystemExit(main())', 'raise SystemExit(main())'), tone: 'ok' },
              { label: bi('TÁCH LỚP', 'SEPARATION'), value: bi('CLI tách rời hàm thuần', 'CLI decoupled from core'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Truyền argv: list[str] | None = None vào parse_args(argv) để gọi thẳng từ pytest', 'Parameterized main(argv=None) so unit tests pass argument lists directly in memory') },
              { op: '+', text: bi('Tách hàm xử lý dữ liệu thuần không dính sys.exit hay argparse', 'Extracted pure domain function completely free of sys.exit and CLI parsing') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Mẫu def main(argv: list[str] | None = None) -> int là bí quyết chuyên nghiệp: khi chạy thật argv=None tự đọc sys.argv[1:], còn trong pytest bạn gọi thẳng main(["--limit", "5"])!', 'def main(argv: list[str] | None = None) -> int is the pro CLI pattern: runtime uses sys.argv[1:], while pytest calls main(["--limit", "5"]) directly!'),
            },
          },
          {
            telemetry: [
              { label: bi('STDLIB 0 GÓI NGOÀI', 'ZERO-DEP STDLIB'), value: bi('argparse', 'argparse'), tone: 'ok' },
              { label: bi('CLI TỪ TYPE HINTS', 'TYPED CLI'), value: bi('Typer (hiện đại)', 'Typer (type-driven)'), tone: 'ok' },
              { label: bi('CLI ĐA PLUGIN', 'COMPOSABLE CLI'), value: bi('Click (@command)', 'Click (@command)') },
              { label: bi('GIAO DIỆN ĐẸP', 'TERMINAL UI'), value: bi('Rich · Textual', 'Rich · Textual'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Đối chiếu toàn cảnh hệ sinh thái CLI: argparse vs Typer vs Click kết hợp Rich', 'Mapped Python’s modern CLI ecosystem: stdlib argparse vs Typer, Click, and Rich') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Khi kết hợp thư viện Rich để vẽ thanh tiến độ (Progress Bar) cho công cụ CLI, hãy khởi tạo Console(stderr=True) để hiệu ứng màu sắc không làm hỏng dữ liệu JSON trên stdout!', 'When rendering Rich progress bars or tables in pipeable CLIs, initialize Console(stderr=True) so visual UI never pollutes clean JSON on stdout!'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('PHÂN LUỒNG', 'STDIO'), value: bi('stdout data · stderr log', 'stdout data · stderr log'), tone: 'ok' },
            { label: bi('MÃ THOÁT', 'EXIT STATUS'), value: bi('0 OK · != 0 Fail', '0 OK · != 0 Fail'), tone: 'ok' },
            { label: bi('KIỂM THỬ', 'TESTABILITY'), value: bi('main(argv=None) -> int', 'main(argv=None) -> int'), tone: 'ok' },
            { label: bi('HỆ SINH THÁI', 'ECOSYSTEM'), value: bi('argparse · Typer · Rich', 'argparse · Typer · Rich'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Đúc kết kiến trúc CLI chuẩn Unix sẵn sàng tích hợp vào đường ống Shell và CI/CD', 'Consolidated Unix-clean, testable CLI architecture ready for shell pipes & CI/CD') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Chuẩn mực CLI M12: argparse / Typer kiểm kiểu đầu vào · dữ liệu sạch ra stdout · lỗi ra sys.stderr · cấu hình qua os.environ · thoát bằng raise SystemExit(main())!', 'M12 CLI Standard: parse via argparse/Typer · emit data to stdout · send errors to sys.stderr · read secrets via os.environ · exit via raise SystemExit(main())!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'in', shape: 'laptop', tone: 'neutral', x: -260, y: 0, label: bi('stdin | argv + ENV', 'stdin | argv + ENV'), highlighted: s === 2 },
            { id: 'arg', shape: 'gate', tone: 'blue', x: -75, y: 0, label: bi('argparse / Typer', 'argparse / Typer'), sublabel: bi('--limit 10 --dry-run', '--limit 10 --dry-run'), highlighted: s === 1 || s === 4 },
            { id: 'main', shape: 'hex', tone: 'green', x: 85, y: 0, label: bi('main(argv) -> int', 'main(argv) -> int'), sublabel: bi('testable core', 'testable core'), icon: 'terminal', highlighted: s === 3 },
            { id: 'out', shape: 'box', tone: 'green', x: 265, y: -65, label: bi('stdout (fd 1)', 'stdout (fd 1)'), sublabel: bi('clean JSON | pipe', 'clean JSON | pipe') },
            { id: 'err', shape: 'box', tone: 'rose', x: 265, y: 65, label: bi('stderr (fd 2)', 'stderr (fd 2)'), sublabel: bi('logs + exit != 0', 'logs + exit != 0'), highlighted: pipeMode },
          ],
          links: [
            { id: 'l1', from: 'in', to: 'arg', label: bi('flags', 'flags') },
            { id: 'l2', from: 'arg', to: 'main', label: bi('Namespace', 'Namespace') },
            { id: 'l3', from: 'main', to: 'out', label: bi('exit 0 · data', 'exit 0 · data') },
            { id: 'l4', from: 'main', to: 'err', style: 'dashed', label: bi('file=sys.stderr', 'file=sys.stderr') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.48 },
            { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.48, offset: 0.3 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.48, offset: 0.6 },
          ],
        },
      };
    },
  },

  M13: {
    id: 'M13',
    titleEn: 'Classes & Objects: Blueprint, self & Instance Memory',
    subtitleEn: 'Build clean mental models of Class blueprints vs Heap instances, demystify self dispatch, avoid shared class-list bugs, and implement __repr__ / __eq__.',
    durationMin: 14,
    difficulty: 'Intermediate',
    objectives: [
      bi('Phân biệt Bản thiết kế (Class) với từng đối tượng độc lập trên bộ nhớ Heap (Instance) & __init__', 'Separate the shared Class blueprint from independent per-instance Heap objects initialized via __init__'),
      bi('Hiểu bản chất u.method(x) chính là cú pháp tắt của Class.method(u, x) — giải mã hoàn toàn self', 'Demystify self: u.method(x) is exact syntactic sugar for Class.method(u, x)'),
      bi('Tránh bẫy khai báo list/dict khả biến ở cấp Class khiến mọi đối tượng dùng chung vùng nhớ', 'Eliminate shared mutable class-attribute bugs by binding mutable fields on self inside __init__'),
      bi('Cài đặt __repr__ minh bạch để gỡ lỗi và __eq__ để so sánh đối tượng theo giá trị', 'Implement unambiguous __repr__ for debugging and value-based __eq__ equality'),
    ],
    buildFrame: (s, total) => {
      const classTrap = s === 2;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('KHUÔN MẪU', 'BLUEPRINT'), value: bi('class BankAccount:', 'class BankAccount:'), tone: 'ok' },
              { label: bi('KHỞI TẠO', 'CONSTRUCTOR'), value: bi('def __init__(self, ...)', 'def __init__(self, ...)'), tone: 'ok' },
              { label: bi('CẤP PHÁT', 'INSTANTIATION'), value: bi('Account("An") (không new)', 'Account("An") (no new)'), tone: 'ok' },
              { label: bi('VÙNG NHỚ HEAP', 'HEAP MEMORY'), value: bi('Mỗi object độc lập', 'Isolated per instance'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Gom dữ liệu trạng thái (owner, balance) và hành vi hợp lệ (deposit) vào chung Class', 'Encapsulated state fields and valid domain operations inside one Class blueprint') },
              { op: '+', text: bi('Tạo hai đối tượng acc_an và acc_binh có không gian thuộc tính tách biệt trên Heap', 'Allocated independent Heap instances initialized cleanly through __init__') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Hình dung Class là bản vẽ kiến trúc (chỉ có 1 bản), còn mỗi lần gọi BankAccount("An") là xây một ngôi nhà thật độc lập trên bộ nhớ Heap!', 'Think of a Class as an architectural blueprint, whereas calling BankAccount("An") constructs an independent house in Heap memory!'),
            },
          },
          {
            telemetry: [
              { label: bi('CƠ CHẾ GỌI HÀM', 'SELF DISPATCH'), value: bi('u.pay(50) ⇔ Cls.pay(u, 50)', 'u.pay(50) ⇔ Cls.pay(u, 50)'), tone: 'ok' },
              { label: bi('QUÊN GHI SELF', 'MISSING SELF'), value: bi('TypeError (dư đối số!)', 'TypeError (arg mismatch!)'), tone: 'warn' },
              { label: bi('BOUND METHOD', 'BOUND CALLBACK'), value: bi('fn = u.pay nhớ chặt u!', 'fn = u.pay remembers u!'), tone: 'ok' },
              { label: bi('TRA CỨU THUỘC TÍNH', 'ATTR LOOKUP'), value: bi('self.__dict__ → Class', 'self.__dict__ → Class') },
            ],
            whatChanged: [
              { op: '+', text: bi('Giải mã cơ chế Python tự truyền đối tượng trước dấu chấm vào tham số đầu tiên self', 'Revealed how Python passes the receiver before the dot as the explicit first argument self') },
              { op: '+', text: bi('Tận dụng Bound Method truyền u.deposit làm callback mà không bao giờ rơi mất ngữ cảnh', 'Passed bound method u.deposit as a callback without ever losing its target instance') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Khi bạn lưu fn = acc_an.deposit rồi gọi fn(50) ở nơi khác, Python tạo sẵn một Bound Method đóng gói chặt acc_an bên trong nên không bao giờ bị mất đối tượng!', 'When you assign fn = acc_an.deposit and invoke fn(50) later, Python creates a Bound Method object that permanently remembers acc_an!'),
            },
          },
          {
            telemetry: [
              { label: bi('TRẠNG THÁI INSTANCE', 'INSTANCE STATE'), value: bi('BẪY: Dùng chung list Class!', 'TRAP: Shared Class list!'), tone: 'bad' },
              { label: bi('NGUYÊN NHÂN', 'ROOT CAUSE'), value: bi('members = [] ngoài __init__', 'members = [] on Class body'), tone: 'bad' },
              { label: bi('CÁCH SỬA ĐÚNG', 'PROPER FIX'), value: bi('self.members = [] trong __init__', 'self.members = [] in __init__'), tone: 'ok' },
              { label: bi('CẤP CLASS CHỈ ĐẶT', 'CLASS LEVEL'), value: bi('Hằng số bất biến (MAX=10)', 'Immutable constants only'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '~', text: bi('CẢNH BÁO: Đặt members = [] ở thân Class khiến u1.add() làm bẩn sang cả u2!', 'BUG: Declaring members = [] on Class caused u1 and u2 to mutate the exact same list!') },
              { op: '+', text: bi('Chuyển thành self.members = [] bên trong __init__ để mỗi đối tượng sở hữu list riêng', 'Moved self.members = [] inside __init__ giving every instance its own isolated list') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Ở thân Class (ngoài __init__) chỉ được đặt HẰNG SỐ bất biến (như MAX_RETRY = 3). Mọi list/dict/set thay đổi theo từng đối tượng bắt buộc gán qua self.xxx trong __init__!', 'Only declare immutable CONSTANTS on the Class body. Every mutable per-object collection belongs on self.xxx inside __init__!'),
            },
          },
          {
            telemetry: [
              { label: bi('HIỂN THỊ GỠ LỖI', 'DEBUG REPR'), value: bi('__repr__(self) · f"{x!r}"', '__repr__(self) · f"{x!r}"'), tone: 'ok' },
              { label: bi('HIỂN THỊ PRINT', 'USER DISPLAY'), value: bi('__str__(self)', '__str__(self)') },
              { label: bi('MẶC ĐỊNH ==', 'DEFAULT =='), value: bi('So sánh địa chỉ id()!', 'Compares memory id()!'), tone: 'warn' },
              { label: bi('SO SÁNH GIÁ TRỊ', 'VALUE EQUALITY'), value: bi('__eq__ + NotImplemented', '__eq__ + NotImplemented'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Cài __repr__ dùng hậu tố !r để hiển thị rõ kiểu dữ liệu trong REPL, list và log', 'Implemented unambiguous __repr__ with !r formatting for REPL, lists, and logs') },
              { op: '+', text: bi('Cài __eq__ trả về NotImplemented khi khác kiểu và so sánh tuple thuộc tính khi cùng kiểu', 'Implemented __eq__ comparing field tuples and returning NotImplemented for unrelated types') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Nếu chỉ chọn viết một phương thức hiển thị, hãy luôn viết __repr__! Khi in một danh sách [p1, p2], Python luôn gọi __repr__ của từng phần tử bên trong.', 'If you only implement one display dunder, always write __repr__! Printing a list [p1, p2] always invokes __repr__ on its elements.'),
            },
          },
          {
            telemetry: [
              { label: bi('QUY ƯỚC NỘI BỘ', 'INTERNAL ATTR'), value: bi('_balance (1 gạch dưới)', '_balance (single _)'), tone: 'ok' },
              { label: bi('ĐỔI TÊN NGẦM', 'NAME MANGLING'), value: bi('__secret → _Cls__secret', '__secret → _Cls__secret') },
              { label: bi('CÓ TRẠNG THÁI', 'STATEFUL ENTITY'), value: bi('Dùng Class', 'Use Class'), tone: 'ok' },
              { label: bi('KHÔNG TRẠNG THÁI', 'STATELESS LOGIC'), value: bi('Dùng hàm cấp module!', 'Use plain module functions!'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Áp dụng quy ước _internal báo hiệu thuộc tính nội bộ thay vì viết getter/setter thừa', 'Used Pythonic _internal naming conventions instead of ceremonial getters/setters') },
              { op: '-', text: bi('Tránh lạm dụng tạo Class rỗng chỉ chứa vài hàm tĩnh không có trạng thái', 'Avoided over-engineering stateless utility classes when module functions suffice') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Python không bắt nhét mọi hàm vào Class! Chỉ viết Class khi thực thể có dữ liệu trạng thái đi liền hành vi; gói dữ liệu thuần hãy dùng @dataclass (M14).', 'Python never forces everything into a Class! Write a Class when stateful data and behavior travel together; use @dataclass (M14) for pure records.'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('TRUYỀN SELF', 'SELF BINDING'), value: bi('u.fn(x) ⇔ Cls.fn(u, x)', 'u.fn(x) ⇔ Cls.fn(u, x)'), tone: 'ok' },
            { label: bi('BỘ NHỚ INSTANCE', 'INSTANCE STATE'), value: bi('self.items = [] trong __init__', 'self.items = [] in __init__'), tone: 'ok' },
            { label: bi('GỠ LỖI & SO SÁNH', 'CORE DUNDERS'), value: bi('__repr__ + __eq__', '__repr__ + __eq__'), tone: 'ok' },
            { label: bi('KIỂM TRA KIỂU', 'TYPE CHECK'), value: bi('isinstance(obj, Cls)', 'isinstance(obj, Cls)'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Nắm vững mô hình bộ nhớ Class vs Instance, cơ chế self và bộ dunder cốt lõi', 'Mastered Class vs Instance memory layout, explicit self binding, and core dunders') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Đúc kết M13: Khởi tạo mọi dữ liệu khả biến qua self trong __init__; luôn cài __repr__ để dễ debug; và chỉ dùng Class khi thực sự có trạng thái gắn kèm hành vi!', 'M13 Recap: Initialize all mutable state on self in __init__; always implement __repr__; and reserve Classes for genuinely stateful entities!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'cls', shape: 'hex', tone: 'purple', x: -200, y: 0, label: bi('class Account:', 'class Account:'), sublabel: bi('__init__ · deposit(self)', '__init__ · deposit(self)'), icon: 'layers', highlighted: s <= 1 },
            { id: 'u1', shape: 'box', tone: 'blue', x: 55, y: -65, label: bi('u1 (self)', 'u1 (self)'), sublabel: bi('name="An", bal=100', 'name="An", bal=100') },
            { id: 'u2', shape: 'box', tone: 'green', x: 55, y: 65, label: bi('u2 (self)', 'u2 (self)'), sublabel: bi('name="Bình", bal=250', 'name="Bình", bal=250') },
            { id: 'trap', shape: 'cylinder', tone: classTrap ? 'rose' : 'green', x: 255, y: 0, label: classTrap ? bi('Class tags=[] (Chung!)', 'Shared Class tags=[]!') : bi('Riêng từng __dict__', 'Isolated __dict__'), sublabel: classTrap ? bi('u1 sửa làm bẩn u2!', 'u1 mutates u2!') : bi('__repr__ & __eq__', '__repr__ & __eq__'), icon: 'db', highlighted: classTrap || s === 3 },
          ],
          links: [
            { id: 'l1', from: 'cls', to: 'u1', label: bi('Account("An")', 'Account("An")') },
            { id: 'l2', from: 'cls', to: 'u2', label: bi('Account("Bình")', 'Account("Bình")') },
            { id: 'l3', from: 'u1', to: 'trap', style: classTrap ? 'danger' : 'solid', label: classTrap ? bi('trỏ chung!', 'shared list!') : bi('self.tags', 'self.tags') },
            { id: 'l4', from: 'u2', to: 'trap', style: classTrap ? 'danger' : 'solid', label: classTrap ? bi('trỏ chung!', 'shared list!') : bi('self.tags', 'self.tags') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l3', kind: classTrap ? 'error' : 'pointer', speed: 0.45, offset: 0.4 },
          ],
        },
      };
    },
  },

  M14: {
    id: 'M14',
    titleEn: 'Advanced OOP: super(), Dunders, @property, @dataclass & Pydantic',
    subtitleEn: 'Favor Composition, integrate custom types with Python’s Data Model, validate via @property, and choose between @dataclass and Pydantic.',
    durationMin: 15,
    difficulty: 'Intermediate',
    objectives: [
      bi('Kế thừa chuẩn với super() theo thứ tự MRO và luôn ưu tiên Composition (has-a) hơn kế thừa sâu', 'Delegate cleanly with super() via C3 MRO while favoring Composition (has-a) over deep inheritance'),
      bi('Hòa nhập đối tượng vào cú pháp gốc len(), +, [] của Python qua giao thức Dunder methods', 'Integrate custom types seamlessly into native Python syntax via Data Model dunders'),
      bi('Bảo vệ ràng buộc dữ liệu bằng @property và tạo constructor thay thế bằng @classmethod', 'Enforce field invariants behind @property setters and build @classmethod factory constructors'),
      bi('Chọn đúng công cụ mô hình hóa dữ liệu: @dataclass(slots=True) vs NamedTuple vs Pydantic', 'Choose the right model tool: stdlib @dataclass vs NamedTuple vs runtime-validated Pydantic'),
    ],
    buildFrame: (s, total) => {
      const dataclassMode = s >= 4;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('ỦY QUYỀN LỚP CHA', 'SUPER DELEGATION'), value: bi('super().__init__(...)', 'super().__init__(...)'), tone: 'ok' },
              { label: bi('THỨ TỰ TÌM HÀM', 'MRO ORDER'), value: bi('Cls.mro() (C3 Linear)', 'Cls.mro() (C3 Linear)') },
              { label: bi('THIẾT KẾ ƯU TIÊN', 'DESIGN PREF'), value: bi('Composition (Has-A)', 'Composition (Has-A)'), tone: 'ok' },
              { label: bi('CÂY KẾ THỪA SÂU', 'DEEP HIERARCHY'), value: bi('Tránh > 2 tầng!', 'Avoid > 2 levels!'), tone: 'warn' },
            ],
            whatChanged: [
              { op: '+', text: bi('Dùng super() ủy quyền khởi tạo theo đúng tuyến tính MRO', 'Delegated parent initialization cleanly along C3 MRO via super()') },
              { op: '+', text: bi('Ưu tiên lắp ghép đối tượng thành phần (Composition) để dễ hoán đổi khi kiểm thử', 'Favored injecting collaborator objects (Composition) over rigid inheritance') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Nguyên tắc thiết kế thực chiến: chỉ kế thừa khi thỏa mãn quan hệ "B thực sự là một loại A"; còn khi "B cần dùng tính năng của A", hãy truyền A vào thuộc tính của B (Composition)!', 'Design rule of thumb: inherit only for true "Is-A" relationships; when B merely uses A’s capability, pass A as a field on B (Composition)!'),
            },
          },
          {
            telemetry: [
              { label: bi('TOÁN TỬ SỐ HỌC', 'ARITHMETIC'), value: bi('__add__ · __rmul__', '__add__ · __rmul__'), tone: 'ok' },
              { label: bi('THỨ TỰ SO SÁNH', 'ORDERING'), value: bi('@total_ordering + __lt__', '@total_ordering + __lt__'), tone: 'ok' },
              { label: bi('TẬP HỢP / DÃY', 'CONTAINER'), value: bi('__len__ · __getitem__', '__len__ · __getitem__'), tone: 'ok' },
              { label: bi('TRUTHY MẶC ĐỊNH', 'BOOL FALLBACK'), value: bi('__bool__ → __len__ > 0', '__bool__ → __len__ > 0') },
            ],
            whatChanged: [
              { op: '+', text: bi('Cài __rmul__ giúp phép nhân đảo chiều 3 * vector hoạt động mượt mà', 'Implemented __rmul__ so reflected scalar multiplication 3 * vector works seamlessly') },
              { op: '+', text: bi('Cài __len__ và __getitem__ để đối tượng dùng được ngay với len(), x[i] và slicing', 'Added __len__ and __getitem__ unlocking built-in len(), indexing, and slicing') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Nhờ @functools.total_ordering, bạn chỉ cần viết đúng __eq__ và __lt__, Python sẽ tự động sinh nốt <=, > và >= cho lớp của bạn!', 'With @functools.total_ordering, you only implement __eq__ and __lt__, and Python generates <=, >, and >= automatically!'),
            },
          },
          {
            telemetry: [
              { label: bi('TRUY CẬP THUỘC TÍNH', 'DOT ACCESS'), value: bi('t.celsius (không ngoặc!)', 't.celsius (no parens!)'), tone: 'ok' },
              { label: bi('KIỂM TRA GÁN', 'SETTER GUARD'), value: bi('@celsius.setter chặn lỗi', '@celsius.setter validates'), tone: 'ok' },
              { label: bi('CHỈ ĐỌC TÍNH ĐỘNG', 'READ-ONLY PROP'), value: bi('@property fahrenheit', '@property fahrenheit'), tone: 'ok' },
              { label: bi('TƯƠNG THÍCH NGƯỢC', 'API BREAKAGE'), value: bi('0 dòng gọi phải sửa!', '0 caller changes!'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Không cần viết get_price() / set_price() rườm rà phòng hờ ngay từ đầu', 'Avoided writing verbose Java-style get_x()/set_x() boilerplate upfront') },
              { op: '+', text: bi('Nâng cấp thuộc tính sang @property kiểm duyệt ngay trong __init__ và mọi phép gán sau đó', 'Upgraded plain field to validated @property enforcing invariants transparently') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Trong Python, hãy cứ bắt đầu bằng thuộc tính thường self.price; ngày mai cần chặn số âm chỉ việc gắn @property mà không làm gãy bất kỳ nơi nào đang gọi obj.price!', 'Start with plain attributes like self.price; upgrade to @property later when validation is needed with zero breaking changes to callers!'),
            },
          },
          {
            telemetry: [
              { label: bi('PHƯƠNG THỨC LỚP', 'CLASS METHOD'), value: bi('@classmethod (nhận cls)', '@classmethod (gets cls)'), tone: 'ok' },
              { label: bi('HÀM TẠO THAY THẾ', 'FACTORY CTOR'), value: bi('Date.from_iso("2026-11-21")', 'Date.from_iso("2026-11-21")'), tone: 'ok' },
              { label: bi('TƯƠNG THÍCH KẾ THỪA', 'SUBCLASS SAFE'), value: bi('return cls(...) trả lớp con', 'return cls(...) respects sub'), tone: 'ok' },
              { label: bi('TIỆN ÍCH TĨNH', 'STATIC HELPER'), value: bi('@staticmethod (0 self/cls)', '@staticmethod (no self/cls)') },
            ],
            whatChanged: [
              { op: '+', text: bi('Viết các cổng khởi tạo rõ tên như from_iso, from_dict bằng @classmethod', 'Created expressive named constructors (from_iso, from_dict) using @classmethod') },
              { op: '+', text: bi('Gọi cls(...) thay vì viết cứng tên lớp để hỗ trợ kế thừa đúng kiểu lớp con', 'Constructed via cls(...) rather than hardcoding class names so subclasses work properly') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Vì Python chỉ có một hàm __init__, @classmethod chính là cách chuẩn mực nhất để cung cấp nhiều cổng khởi tạo có tên tự giải thích (dict.fromkeys, datetime.fromisoformat)!', 'Since Python classes have a single __init__, @classmethod is the idiomatic way to offer named alternative constructors like datetime.fromisoformat!'),
            },
          },
          {
            telemetry: [
              { label: bi('GIẢM CODE LẶP', 'BOILERPLATE'), value: bi('-80% với @dataclass', '-80% via @dataclass'), tone: 'ok' },
              { label: bi('NHẸ RAM & BẤT BIẾN', 'PERF & HASH'), value: bi('frozen=True, slots=True', 'frozen=True, slots=True'), tone: 'ok' },
              { label: bi('TRƯỜNG KHẢ BIẾN', 'MUTABLE FIELD'), value: bi('field(default_factory=list)', 'field(default_factory=list)'), tone: 'ok' },
              { label: bi('BIÊN DỮ LIỆU NGOÀI', 'EXTERNAL JSON'), value: bi('Pydantic BaseModel', 'Pydantic BaseModel'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Tự sinh __init__, __repr__, __eq__ và tiết kiệm 50% RAM bằng @dataclass(slots=True)', 'Auto-generated __init__, __repr__, __eq__ with 50% lower RAM via @dataclass(slots=True)') },
              { op: '+', text: bi('Phân vai rõ: @dataclass cho lõi nội bộ vs Pydantic BaseModel cho xác thực JSON lúc chạy', 'Positioned @dataclass for internal domain models and Pydantic for runtime boundary validation') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Chọn nhanh mô hình dữ liệu: dùng @dataclass(slots=True) cho dữ liệu nội bộ tin cậy; dùng Pydantic BaseModel khi đọc JSON/API/env từ bên ngoài cần ép kiểu & chặn lỗi lúc chạy!', 'Quick model rule: use @dataclass(slots=True) for trusted internal objects; use Pydantic BaseModel at untrusted JSON/API/env boundaries needing runtime validation!'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('THIẾT KẾ', 'COMPOSITION'), value: bi('Has-A + Duck Typing', 'Has-A + Duck Typing'), tone: 'ok' },
            { label: bi('KIỂM DUYỆT GÁN', 'INVARIANT'), value: bi('@property + @classmethod', '@property + @classmethod'), tone: 'ok' },
            { label: bi('MÔ HÌNH NỘI BỘ', 'INTERNAL DTO'), value: bi('@dataclass(slots=True)', '@dataclass(slots=True)'), tone: 'ok' },
            { label: bi('MÔ HÌNH BIÊN API', 'BOUNDARY DTO'), value: bi('Pydantic / ABC / Protocol', 'Pydantic / ABC / Protocol'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Tổng kết bộ công cụ OOP Pythonic hiện đại: tinh gọn, ít code thừa và giàu tính biểu đạt', 'Synthesized modern Pythonic OOP: zero-boilerplate dataclasses, properties, dunders, and Duck Typing') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Đúc kết M14: Ưu tiên Composition & Duck Typing · Cài Dunder để hòa nhập cú pháp gốc · Dùng @dataclass(slots=True) cho lõi nghiệp vụ và Pydantic ở biên dữ liệu!', 'M14 Recap: Favor Composition & Duck Typing · Implement dunders for native syntax · Use @dataclass(slots=True) internally and Pydantic at external boundaries!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'dc', shape: 'hex', tone: 'green', x: -230, y: 0, label: bi('@dataclass / Pydantic', '@dataclass / Pydantic'), sublabel: bi('frozen · slots · validate', 'frozen · slots · validate'), icon: 'sparkles', highlighted: dataclassMode },
            { id: 'prop', shape: 'gate', tone: 'blue', x: -15, y: -55, label: bi('@property · @classmethod', '@property · @classmethod'), sublabel: bi('chặn dữ liệu sai < 0', 'guards invariants'), highlighted: s === 2 || s === 3 },
            { id: 'dund', shape: 'hex', tone: 'purple', x: -15, y: 65, label: bi('Dunder Protocol', 'Dunder Protocol'), sublabel: bi('__len__ · __rmul__ · +', '__len__ · __rmul__ · +'), icon: 'code', highlighted: s === 1 },
            { id: 'py', shape: 'cylinder', tone: 'yellow', x: 225, y: 5, label: bi('len(x) · sorted(xs)', 'len(x) · sorted(xs)'), sublabel: bi('hàm gốc Python hiểu ngay!', 'native built-ins work!'), icon: 'zap' },
          ],
          links: [
            { id: 'l1', from: 'dc', to: 'prop', label: bi('field guard', 'field guard') },
            { id: 'l2', from: 'dc', to: 'dund', label: bi('auto __repr__/__eq__', 'auto __repr__/__eq__') },
            { id: 'l3', from: 'prop', to: 'py', label: bi('validated state', 'validated state') },
            { id: 'l4', from: 'dund', to: 'py', label: bi('duck typing', 'duck typing') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.45, offset: 0.3 },
            { id: 'p3', linkId: 'l4', kind: 'response', speed: 0.45, offset: 0.6 },
          ],
        },
      };
    },
  },

  M15: {
    id: 'M15',
    titleEn: 'Iterators, Generators (yield) & Lazy itertools Pipelines',
    subtitleEn: 'Process multi-gigabyte data streams in kilobytes of RAM using pause-and-resume yield frames and C-speed itertools.',
    durationMin: 14,
    difficulty: 'Advanced',
    objectives: [
      bi('Hiểu mô hình Máy lọc nước chảy từng giọt O(1) RAM (Lazy) vs Hồ bơi chứa sẵn O(N) RAM (Eager list)', 'Contrast O(1)-RAM lazy pull streams against O(N)-RAM eager list materialization'),
      bi('Nắm chắc cơ chế đóng băng khung nhớ cục bộ tại lệnh yield và thức dậy ở nhịp next() kế tiếp', 'Visualize how yield freezes the local stack frame on Heap and resumes on next()'),
      bi('Tránh bẫy duyệt Generator lần 2 ra rỗng im lặng và biết cách viết Class __iter__ tái sử dụng', 'Avoid silent single-pass generator exhaustion and write reusable __iter__ classes'),
      bi('Lắp ghép đường ống Lazy Pipeline kiểu Unix với yield from, itertools và more-itertools', 'Compose zero-allocation pipelines with yield from, stdlib itertools, and more-itertools'),
    ],
    buildFrame: (s, total) => {
      const exhaustTrap = s === 2;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('EAGER LIST 20GB', 'EAGER LIST 20GB'), value: bi('Tràn RAM (MemoryError!)', 'O(N) MemoryError!'), tone: 'bad' },
              { label: bi('LAZY ITERATOR', 'LAZY ITERATOR'), value: bi('~32 KB RAM cố định O(1)', '~32 KB constant O(1) RAM'), tone: 'ok' },
              { label: bi('BƯỚC 1 GIAO THỨC', 'STEP 1 PROTOCOL'), value: bi('it = iter(data)', 'it = iter(data)'), tone: 'ok' },
              { label: bi('BƯỚC 2 GIAO THỨC', 'STEP 2 PROTOCOL'), value: bi('next(it) → StopIteration', 'next(it) → StopIteration'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Bỏ cách nạp toàn bộ 200 triệu dòng vào list trước khi lọc', 'Eliminated eager loading of 200M log lines into RAM upfront') },
              { op: '+', text: bi('Kéo từng phần tử một theo nhu cầu qua giao thức iter() → next()', 'Pulled one item at a time on demand via the iter() → next() protocol') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Hãy nhớ hình ảnh Máy lọc nước theo giọt (Iterator O(1) RAM) so với Bơm đầy cả hồ bơi rồi mới uống (List O(N) RAM) — file 50 GB vẫn xử lý mượt trên laptop 8 GB!', 'Picture a drop-by-drop water dispenser (O(1) RAM Iterator) vs filling an entire swimming pool first (O(N) RAM List) — process 50 GB files smoothly!'),
            },
          },
          {
            telemetry: [
              { label: bi('GỌI GEN()', 'CALLING GEN()'), value: bi('Chưa chạy thân hàm!', 'Returns generator object'), tone: 'warn' },
              { label: bi('GẶP LỆNH YIELD', 'AT YIELD'), value: bi('Đóng băng khung nhớ cục bộ', 'Freezes local stack frame'), tone: 'ok' },
              { label: bi('GỌI NEXT() KẾ', 'ON NEXT()'), value: bi('Thức dậy chạy tiếp sau yield', 'Resumes right after yield'), tone: 'ok' },
              { label: bi('KHÁC RETURN', 'VS RETURN'), value: bi('Giữ nguyên biến cục bộ', 'Preserves local variables'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Biến hàm thường thành bộ phát lười tạm dừng được chỉ bằng từ khóa yield', 'Turned a function into a pausable lazy producer using the yield keyword') },
              { op: '+', text: bi('Bảo toàn toàn bộ biến cục bộ trên Heap xuyên suốt các nhịp next()', 'Preserved local loop state across successive next() pulls without manual state classes') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Gọi g = countdown(3) chưa chạy bất kỳ dòng code nào bên trong hàm! Chỉ khi vòng for hoặc next(g) kéo nhịp đầu tiên, hàm mới bắt đầu chạy tới dòng yield thứ nhất.', 'Calling g = countdown(3) executes ZERO lines of the function body! Execution starts only when next(g) or a for loop pulls the first item.'),
            },
          },
          {
            telemetry: [
              { label: bi('DUYỆT LẦN 1', '1ST PASS'), value: bi('[0, 1, 4, 9] (Đầy đủ)', '[0, 1, 4, 9] (Full items)'), tone: 'ok' },
              { label: bi('DUYỆT LẦN 2', '2ND PASS'), value: bi('[] Rỗng im lặng!', '[] Silently empty!'), tone: 'bad' },
              { label: bi('NGUYÊN NHÂN', 'EXHAUSTION'), value: bi('Con trỏ đã chạm StopIteration', 'Pointer hit StopIteration'), tone: 'warn' },
              { label: bi('MUỐN DÙNG NHIỀU LẦN', 'REUSABLE FIX'), value: bi('Class có def __iter__: yield', 'Class with def __iter__: yield'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '~', text: bi('Phát hiện bẫy truyền cùng biến generator vào sum(g) rồi max(g) làm hàm sau nhận rỗng', 'Exposed bug where passing an exhausted generator to a second consumer yields 0 items') },
              { op: '+', text: bi('Bọc generator bên trong phương thức __iter__ của Class để mỗi vòng for tạo con trỏ mới', 'Wrapped yield inside a Class __iter__ method so every loop gets a fresh iterator') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Cạm bẫy kinh điển: Generator chỉ duyệt được ĐÚNG MỘT LẦN! Lần duyệt thứ hai trên cùng biến generator trả về rỗng [] mà không báo bất kỳ lỗi nào.', 'Classic gotcha: Generators are SINGLE-USE! Iterating over the same generator variable a second time silently yields zero items.'),
            },
          },
          {
            telemetry: [
              { label: bi('ỦY QUYỀN LUỒNG CON', 'SUB-DELEGATION'), value: bi('yield from sub_stream', 'yield from sub_stream'), tone: 'ok' },
              { label: bi('MẢNG TRUNG GIAN', 'TEMP LISTS'), value: bi('0 mảng tạm được tạo!', '0 intermediate lists!'), tone: 'ok' },
              { label: bi('DỪNG SỚM', 'SHORT-CIRCUIT'), value: bi('islice(stream, 5) dừng ngay!', 'islice(stream, 5) halts early!'), tone: 'ok' },
              { label: bi('BIỂU THỨC GỌN', 'GEN EXPR'), value: bi('(x for x in src if ...)', '(x for x in src if ...)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Ghép chuỗi 3 mắt xích: read_logs → filter_error → islice(5) rút đúng dữ liệu cần rồi nghỉ', 'Chained 3 lazy stages stopping disk reads immediately once 5 matching errors are found') },
              { op: '+', text: bi('Dùng yield from nối phẳng nhiều tệp log liên tiếp không cần vòng for lồng', 'Flattened multi-file streams cleanly using yield from delegation') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Khi ghép đường ống Generator kết thúc bằng islice(errors, 5), ngay khoảnh khắc tìm đủ lỗi thứ 5 ở dòng 120, Python dừng đọc phần còn lại của tệp 20 GB ngay lập tức!', 'When a lazy pipeline ends with islice(errors, 5), the instant the 5th error is found at line 120, Python stops reading the rest of the 20 GB file!'),
            },
          },
          {
            telemetry: [
              { label: bi('CẮT LÁT & NỐI', 'SLICE & JOIN'), value: bi('islice · chain · batched', 'islice · chain · batched'), tone: 'ok' },
              { label: bi('TỔ HỢP TOÁN HỌC', 'COMBINATORICS'), value: bi('product · combinations', 'product · combinations'), tone: 'ok' },
              { label: bi('ĐIỀU KIỆN GROUPBY', 'GROUPBY RULE'), value: bi('Phải sorted(key=) trước!', 'Must sorted(key=) first!'), tone: 'warn' },
              { label: bi('MỞ RỘNG THỰC CHIẾN', 'ECOSYSTEM'), value: bi('more-itertools (100+ hàm)', 'more-itertools (100+ ops)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Áp dụng itertools.batched(stream, 100) chia lô dữ liệu lớn chạy ở tốc độ C', 'Chunked large streams in C-speed batches via Python 3.12+ itertools.batched') },
              { op: '+', text: bi('Kết hợp thư viện more-itertools (windowed, unique_everseen, peekable) cho dự án dữ liệu', 'Added more-itertools combinators for sliding windows and O(1)-pass deduplication') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('itertools.groupby CHỈ gom các phần tử đứng cạnh nhau liên tiếp (giống lệnh uniq của Unix). Muốn gom nhóm toàn cục theo khóa, bắt buộc gọi sorted(data, key=...) trước!', 'itertools.groupby ONLY groups consecutive runs (like Unix uniq). Always sort by the same key first when grouping globally!'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('BỘ NHỚ LUỒNG LỚN', 'STREAM MEMORY'), value: bi('O(1) RAM với yield', 'O(1) RAM via yield'), tone: 'ok' },
            { label: bi('ĐẶC TÍNH', 'LIFECYCLE'), value: bi('Generator 1 lần · Class N lần', 'Gen 1-pass · Class N-pass'), tone: 'ok' },
            { label: bi('TỔ HỢP C-SPEED', 'STDLIB TOOLS'), value: bi('islice · chain · batched', 'islice · chain · batched'), tone: 'ok' },
            { label: bi('THƯ VIỆN NGOÀI', 'ECOSYSTEM'), value: bi('more-itertools', 'more-itertools'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Làm chủ tư duy tính toán lười (Lazy Evaluation) xử lý dữ liệu khổng lồ êm ái', 'Mastered lazy pull pipelines processing massive streams in constant memory') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Quy tắc chọn nhanh M15: Cần chỉ số len()/x[i] hoặc duyệt đi duyệt lại dữ liệu nhỏ → dùng list; Duyệt tuần tự luồng lớn hoặc có thể dừng sớm → dùng Generator + itertools!', 'M15 Quick Rule: Need random indexing/len() or multi-pass on small data → use list; Streaming large data or early-stopping → use Generator + itertools!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'disk', shape: 'cylinder', tone: 'yellow', x: -260, y: 0, label: bi('access.log · 20 GB', 'access.log · 20 GB'), sublabel: bi('200M dòng', '200M lines'), icon: 'db', highlighted: s === 0 },
            { id: 'g1', shape: 'hex', tone: exhaustTrap ? 'rose' : 'blue', x: -85, y: 0, label: bi('def read_lines():', 'def read_lines():'), sublabel: exhaustTrap ? bi('⚠ duyệt 1 lần!', '⚠ single-pass!') : bi('⏸ yield line', '⏸ yield line'), icon: 'clock', loadPct: 4, highlighted: s === 1 || exhaustTrap },
            { id: 'g2', shape: 'gate', tone: 'purple', x: 85, y: 0, label: bi('filter_err(lines)', 'filter_err(lines)'), sublabel: bi('⏸ yield from / gen', '⏸ yield from / gen'), highlighted: s === 3 },
            { id: 'sink', shape: 'hex', tone: 'green', x: 255, y: 0, label: bi('islice(top 5)', 'islice(top 5)'), sublabel: bi('dừng đọc ngay dòng #5!', 'stops reading early!'), icon: 'zap', badge: { text: bi('RAM < 64 KB suốt ca chạy', 'RAM < 64 KB constant'), tone: 'ok' }, highlighted: s >= 4 },
          ],
          links: [
            { id: 'l1', from: 'disk', to: 'g1', label: bi('1 dòng / nhịp', '1 line / pull') },
            { id: 'l2', from: 'g1', to: 'g2', label: bi('next()', 'next()') },
            { id: 'l3', from: 'g2', to: 'sink', label: bi('pull on demand', 'pull on demand') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.45, offset: 0.33 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.45, offset: 0.66 },
          ],
        },
      };
    },
  },

  M16: {
    id: 'M16',
    titleEn: 'Decorators (@wraps, tenacity) & Context Managers (with)',
    subtitleEn: 'Wrap cross-cutting behavior cleanly with higher-order @decorators and guarantee 100% resource teardown via contextlib.',
    durationMin: 14,
    difficulty: 'Advanced',
    objectives: [
      bi('Hiểu @decorator thực chất là fn = decorator(fn) bọc logic trước/sau mà không làm bẩn hàm gốc', 'Understand @decorator as fn = decorator(fn) wrapping pre/post logic cleanly'),
      bi('Luôn gắn @functools.wraps(fn) bảo toàn siêu dữ liệu và nắm vững nhà máy Decorator 3 tầng', 'Always apply @functools.wraps(fn) and build 3-tier parameterized decorator factories'),
      bi('Nắm chắc hệ sinh thái Decorator thực tế (@cache, FastAPI @app.get, pytest, tenacity @retry)', 'Leverage production decorators (@cache, FastAPI routes, pytest, tenacity @retry)'),
      bi('Viết Context Manager chuẩn bằng class (__enter__/__exit__) hoặc @contextmanager bọc try/finally', 'Author leak-proof with blocks via __enter__/__exit__ or @contextmanager + try/finally'),
    ],
    buildFrame: (s, total) => {
      const ctxMode = s >= 3 && s < total - 1;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('ĐỐI TƯỢNG HÀM', 'FIRST-CLASS FN'), value: bi('Truyền & trả hàm tự do', 'Pass & return functions'), tone: 'ok' },
              { label: bi('BẢN CHẤT @DEC', 'DECORATOR SUGAR'), value: bi('fn = dec(fn)', 'fn = dec(fn)'), tone: 'ok' },
              { label: bi('ĐỐI SỐ ĐA NĂNG', 'GENERIC ARGS'), value: bi('*args, **kwargs', '*args, **kwargs'), tone: 'ok' },
              { label: bi('KẾT QUẢ GỐC', 'RETURN VALUE'), value: bi('return func(*a, **kw)', 'return func(*a, **kw)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Tách bỏ code đo thời gian / kiểm tra quyền lặp đi lặp lại khỏi 20 hàm nghiệp vụ', 'Extracted repetitive timing and auth boilerplate out of business functions') },
              { op: '+', text: bi('Quấn lớp vỏ wrapper(*args, **kwargs) tự động chạy trước và sau hàm cốt lõi', 'Wrapped transparent pre/post hooks around core functions via @decorator') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('@measure_time đặt trên def compute_tax hoàn toàn không có phép thuật ẩn nào: Python đơn giản định nghĩa hàm xong rồi gán compute_tax = measure_time(compute_tax)!', '@measure_time above def compute_tax has zero magic: Python simply defines the function and reassigns compute_tax = measure_time(compute_tax)!'),
            },
          },
          {
            telemetry: [
              { label: bi('GIỮ SIÊU DỮ LIỆU', 'METADATA GUARD'), value: bi('@functools.wraps(func)', '@functools.wraps(func)'), tone: 'ok' },
              { label: bi('NẾU QUÊN @WRAPS', 'WITHOUT @WRAPS'), value: bi('Mất __name__ & Type Hints!', 'Loses __name__ & annotations!'), tone: 'bad' },
              { label: bi('CÓ THAM SỐ', 'PARAM FACTORY'), value: bi('3 tầng def lồng nhau', '3 nested def tiers'), tone: 'ok' },
              { label: bi('THỨ TỰ GỌI', 'EVAL ORDER'), value: bi('retry(3) → decorator(fn)', 'retry(3) → decorator(fn)') },
            ],
            whatChanged: [
              { op: '+', text: bi('Gắn @functools.wraps(func) bảo toàn __name__, __doc__ và __annotations__ cho FastAPI/pytest', 'Applied @functools.wraps(func) preserving __name__, __doc__, and type signatures') },
              { op: '+', text: bi('Xây dựng nhà máy 3 tầng def retry(max_attempts) trả về decorator tùy biến', 'Built 3-tier decorator factory accepting configuration arguments like @retry(max_attempts=4)') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Quên @functools.wraps(func) làm mọi hàm bị đổi tên thành "wrapper" và xóa sạch Type Hints — khiến FastAPI không đọc được tham số route và hỏng tài liệu OpenAPI!', 'Forgetting @functools.wraps(func) renames every function to "wrapper" and strips annotations — breaking FastAPI dependency/route inspection!'),
            },
          },
          {
            telemetry: [
              { label: bi('GHI NHỚ KẾT QUẢ', 'MEMOIZATION'), value: bi('@functools.lru_cache', '@functools.lru_cache'), tone: 'ok' },
              { label: bi('ĐỊNH TUYẾN WEB', 'WEB ROUTING'), value: bi('FastAPI @app.get("/...")', 'FastAPI @app.get("/...")'), tone: 'ok' },
              { label: bi('KIỂM THỬ', 'PYTEST'), value: bi('@fixture · @parametrize', '@fixture · @parametrize'), tone: 'ok' },
              { label: bi('THỬ LẠI CÔNG NGHIỆP', 'PROD RETRY'), value: bi('tenacity @retry(backoff)', 'tenacity @retry(backoff)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Kết nối kiến thức Decorator với toàn bộ hệ sinh thái FastAPI, pytest và tenacity', 'Connected decorator mechanics directly to FastAPI, pytest, functools, and tenacity') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Trong dự án thực tế cần tự động thử lại khi mạng chập chờn hoặc gọi API LLM bị giới hạn tốc độ, hãy dùng thư viện tenacity (hỗ trợ exponential backoff + jitter chuẩn mực)!', 'In production services retrying flaky HTTP or rate-limited LLM calls, reach for the battle-tested tenacity library (exponential backoff + jitter)!'),
            },
          },
          {
            telemetry: [
              { label: bi('BƯỚC VÀO WITH', 'ON ENTER'), value: bi('__enter__(self) → as var', '__enter__(self) → as var'), tone: 'ok' },
              { label: bi('RỜI KHỐI WITH', 'ON EXIT'), value: bi('__exit__(exc_type, exc, tb)', '__exit__(exc_type, exc, tb)'), tone: 'ok' },
              { label: bi('CAM KẾT DỌN DẸP', 'GUARANTEE'), value: bi('100% kể cả khi nổ lỗi!', '100% even on exception!'), tone: 'ok' },
              { label: bi('TRẢ VỀ FALSE', 'RETURN FALSE'), value: bi('Để lỗi lan ra bình thường', 'Propagates exceptions'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Đóng gói cặp cấp phát / giải phóng tài nguyên (Lock, DB, Timer) vào giao thức __enter__ / __exit__', 'Encapsulated setup and guaranteed teardown inside __enter__ / __exit__ context protocol') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Trong __exit__, trả về False (hoặc None) giúp dọn dẹp xong rồi vẫn để ngoại lệ bay ra báo động bình thường; chỉ trả True khi bạn cố ý muốn nuốt lỗi (như contextlib.suppress)!', 'Returning False (or None) from __exit__ runs cleanup while letting exceptions propagate normally; return True only when intentionally suppressing errors!'),
            },
          },
          {
            telemetry: [
              { label: bi('CÁCH VIẾT GỌN', 'CONCISE HELPER'), value: bi('@contextmanager + yield', '@contextmanager + yield'), tone: 'ok' },
              { label: bi('LÁ CHẮN BẮT BUỘC', 'MANDATORY GUARD'), value: bi('try: yield ... finally:', 'try: yield ... finally:'), tone: 'warn' },
              { label: bi('TIỆN ÍCH CÓ SẴN', 'STDLIB HELPERS'), value: bi('suppress · ExitStack', 'suppress · ExitStack'), tone: 'ok' },
              { label: bi('RÒ RỈ TÀI NGUYÊN', 'RESOURCE LEAK'), value: bi('0% (đã khóa chặt)', '0% (eliminated)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Viết Context Manager chỉ trong 6 dòng bằng @contextmanager và bọc yield trong try...finally', 'Authored concise custom with blocks via @contextmanager wrapping yield inside try...finally') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Trong hàm @contextmanager, NẾU quên bọc dòng yield trong khối try ... finally:, ngoại lệ ném ra từ thân with sẽ nhảy cóc qua luôn đoạn code dọn dẹp bên dưới!', 'Inside a @contextmanager generator, ALWAYS wrap yield in try ... finally:! Otherwise an exception inside the with block skips your cleanup lines.'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('DECORATOR CHUẨN', 'DECORATOR'), value: bi('@wraps + *args, **kwargs', '@wraps + *args, **kwargs'), tone: 'ok' },
            { label: bi('CONTEXT MANAGER', 'WITH BLOCK'), value: bi('@contextmanager + finally', '@contextmanager + finally'), tone: 'ok' },
            { label: bi('RETRY THỰC CHIẾN', 'RETRY LIB'), value: bi('tenacity', 'tenacity'), tone: 'ok' },
            { label: bi('QUẢN LÝ ĐỘNG', 'DYNAMIC WITH'), value: bi('contextlib.ExitStack', 'contextlib.ExitStack'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Làm chủ hai vũ khí tách biệt mối quan tâm (Decorator) và bảo toàn tài nguyên (Context Manager)', 'Mastered cross-cutting function wrappers (@decorator) and deterministic teardown (with)') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Quy tắc đôi M16: Viết Decorator luôn nhớ @functools.wraps(func); viết @contextmanager luôn bọc yield trong try ... finally:!', 'M16 Twin Golden Rules: Every custom decorator gets @functools.wraps(func); every @contextmanager wraps yield inside try ... finally:!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          zones: [
            { id: 'onion', x: 0, y: 0, w: 410, h: 270, label: ctxMode ? bi('Khối with (__enter__ ➔ __exit__)', 'with Block (__enter__ ➔ __exit__)') : bi('Lớp vỏ Decorator (@wraps)', 'Decorator Wrapper Onion (@wraps)'), tone: 'purple' },
          ],
          nodes: [
            { id: 'caller', shape: 'laptop', tone: 'neutral', x: -280, y: 0, label: bi('Caller', 'Caller') },
            { id: 'pre', shape: 'gate', tone: 'blue', x: -115, y: 0, label: ctxMode ? bi('__enter__()', '__enter__()') : bi('wrapper: before', 'wrapper: before'), sublabel: ctxMode ? bi('mở khóa / giao dịch', 'acquire lock / tx') : bi('auth · timer · @wraps', 'auth · timer · @wraps'), highlighted: s === 0 || s === 3 },
            { id: 'core', shape: 'hex', tone: 'green', x: 35, y: 0, label: bi('Core fn(*a, **kw)', 'Core fn(*a, **kw)'), sublabel: bi('logic nghiệp vụ sạch', 'pure business logic'), icon: 'sparkles', highlighted: s === 2 },
            { id: 'post', shape: 'gate', tone: 'purple', x: 180, y: 0, label: ctxMode ? bi('finally: __exit__', 'finally: __exit__') : bi('wrapper: after', 'wrapper: after'), sublabel: ctxMode ? bi('dọn dẹp 100%', 'cleanup guaranteed') : bi('log ms · return val', 'log ms · return'), highlighted: s === 1 || s >= 4 },
          ],
          links: [
            { id: 'l1', from: 'caller', to: 'pre', label: bi('gọi hàm', 'call') },
            { id: 'l2', from: 'pre', to: 'core', label: ctxMode ? bi('yield resource', 'yield resource') : bi('forward args', 'forward args') },
            { id: 'l3', from: 'core', to: 'post', label: bi('result / err', 'result / err') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.46, offset: 0.32 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.46, offset: 0.65 },
          ],
        },
      };
    },
  },

  M17: {
    id: 'M17',
    titleEn: 'Modern Type Hints (pyright, ty, Protocol) & Pytest Mastery',
    subtitleEn: 'Understand static vs runtime typing, write clean Python 3.12+ annotations, and build parametrized pytest suites.',
    durationMin: 14,
    difficulty: 'Advanced',
    objectives: [
      bi('Hiểu rõ Python KHÔNG tự chặn Type Hints lúc chạy — phân biệt kiểm tra tĩnh (mypy/pyright/ty) và runtime (Pydantic)', 'Distinguish zero-cost static type checking (pyright/mypy/ty) from runtime validation (Pydantic)'),
      bi('Viết chú thích kiểu Python 3.12+ hiện đại: X | None, generic [T], TypedDict và typing.Protocol', 'Write modern Python 3.12+ annotations: X | None, [T] generics, TypedDict, and Protocol'),
      bi('Kiểm thử tự động chuyên nghiệp với pytest: assert tự phân tích, pytest.raises và Arrange-Act-Assert', 'Author expressive pytest suites using plain assert introspection and pytest.raises()'),
      bi('Nhân bản ma trận ca biên bằng @pytest.mark.parametrize, fixtures (tmp_path) và Hypothesis', 'Scale edge-case coverage via @pytest.mark.parametrize, isolated fixtures, and Hypothesis'),
    ],
    buildFrame: (s, total) => {
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('CHI PHÍ RUNTIME', 'RUNTIME COST'), value: bi('0 ms (Python bỏ qua lúc chạy)', '0 ms (no runtime check)'), tone: 'ok' },
              { label: bi('GỌI SAI KIỂU', 'WRONG ARG AT RUN'), value: bi('Không tự ném lỗi!', 'Does NOT auto-raise!'), tone: 'warn' },
              { label: bi('BẮT LỖI TĨNH', 'STATIC GATE'), value: bi('IDE + Type Checker', 'IDE + Type Checker'), tone: 'ok' },
              { label: bi('BẮT LỖI RUNTIME', 'RUNTIME GATE'), value: bi('Dùng Pydantic ở biên', 'Use Pydantic at edges'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Làm rõ ranh giới: Type Hints phục vụ kiểm tra tĩnh trước khi chạy, không làm chậm PVM', 'Clarified that Python type annotations are static metadata with zero runtime enforcement cost') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Ghi nhớ cốt lõi: viết def add(x: int, y: int) rồi gọi add("a", "b") vẫn chạy ra "ab" bình thường! Muốn chặn lỗi kiểu trước khi chạy hãy bật pyright/mypy/ty; muốn chặn JSON lúc chạy hãy dùng Pydantic.', 'Core fact: def add(x: int, y: int) called as add("a", "b") still returns "ab" at runtime! Run pyright/mypy/ty in CI for static safety, and use Pydantic for runtime input validation.'),
            },
          },
          {
            telemetry: [
              { label: bi('KIỂU CÓ THỂ RỖNG', 'NULLABLE TYPE'), value: bi('User | None (PEP 604)', 'User | None (PEP 604)'), tone: 'ok' },
              { label: bi('GENERIC MỚI 3.12+', '3.12+ GENERICS'), value: bi('def first[T](xs: list[T])', 'def first[T](xs: list[T])'), tone: 'ok' },
              { label: bi('DICT CẤU TRÚC', 'TYPED DICT'), value: bi('typing.TypedDict', 'typing.TypedDict') },
              { label: bi('DUCK TYPING TĨNH', 'STRUCTURAL TYPE'), value: bi('typing.Protocol', 'typing.Protocol'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Thay thế Optional[List[int]] cũ kỹ bằng cú pháp gọn sạch list[int] | None', 'Replaced legacy Optional[List[int]] imports with clean built-in list[int] | None') },
              { op: '+', text: bi('Định nghĩa giao diện hành vi linh hoạt bằng typing.Protocol không ép kế thừa cứng', 'Defined structural interfaces via typing.Protocol preserving Duck Typing flexibility') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('typing.Protocol là mảnh ghép hoàn hảo cho Python: bất kỳ class nào có sẵn phương thức khớp chữ ký đều tự động thỏa mãn Protocol mà không cần kế thừa chung lớp cha!', 'typing.Protocol brings static safety to Duck Typing: any class with matching method signatures satisfies the Protocol automatically with zero inheritance required!'),
            },
          },
          {
            telemetry: [
              { label: bi('IDE / VS CODE', 'EDITOR ENGINE'), value: bi('pyright (Pylance)', 'pyright (Pylance)'), tone: 'ok' },
              { label: bi('CHUẨN LÂU ĐỜI', 'CLASSIC CHECKER'), value: bi('mypy', 'mypy') },
              { label: bi('SIÊU TỐC BẰNG RUST', 'RUST CHECKER'), value: bi('ty (Astral / uv)', 'ty (Astral / uv)'), tone: 'ok' },
              { label: bi('XÁC THỰC RUNTIME', 'RUNTIME PARSER'), value: bi('Pydantic v2 (Rust core)', 'Pydantic v2 (Rust core)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Phối hợp bộ kiểm tra tĩnh (pyright / mypy / ty) trong CI với Pydantic ở tầng nhận dữ liệu ngoài', 'Combined fast static checkers (pyright / mypy / ty) in CI with Pydantic at external I/O edges') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Hệ sinh thái Python thế hệ mới viết bằng Rust cực nhanh: uv quản lý gói, ruff kiểm tra code, ty kiểm tra kiểu tĩnh và nhân pydantic-core xác thực dữ liệu lúc chạy!', 'Python’s Rust-powered toolchain makes quality checks instantaneous: uv (packages), ruff (lint/format), ty / pyright (static types), and pydantic-core (runtime validation)!'),
            },
          },
          {
            telemetry: [
              { label: bi('QUY TẮC QUÉT FILE', 'TEST DISCOVERY'), value: bi('test_*.py → def test_*()', 'test_*.py → def test_*()'), tone: 'ok' },
              { label: bi('SO KHỚP KẾT QUẢ', 'ASSERTION'), value: bi('assert a == b (tự bung lỗi)', 'plain assert introspection'), tone: 'ok' },
              { label: bi('KIỂM TRA CA LỖI', 'EXCEPTION TEST'), value: bi('with pytest.raises(Err):', 'with pytest.raises(Err):'), tone: 'ok' },
              { label: bi('BỐ CỤC CHUẨN', 'TEST ANATOMY'), value: bi('Arrange → Act → Assert', 'Arrange → Act → Assert') },
            ],
            whatChanged: [
              { op: '+', text: bi('Viết bài kiểm thử ngắn gọn bằng từ khóa assert thuần kèm bung chi tiết giá trị khi lệch', 'Wrote concise Arrange-Act-Assert tests leveraging pytest’s rich assert diff introspection') },
              { op: '+', text: bi('Khóa chặt hành vi báo lỗi bằng with pytest.raises(ValueError, match=...):', 'Verified expected failure paths explicitly using with pytest.raises(ValueError, match=...):') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Một bộ kiểm thử tốt không chỉ kiểm tra khi đầu vào đẹp, mà BẮT BUỘC phải chứng minh hàm ném đúng ngoại lệ khi gặp đầu vào sai bằng pytest.raises!', 'Great test suites don’t just test happy paths — they prove invalid inputs fail predictably via with pytest.raises(...)!'),
            },
          },
          {
            telemetry: [
              { label: bi('MA TRẬN CA BIÊN', 'EDGE MATRIX'), value: bi('@pytest.mark.parametrize', '@pytest.mark.parametrize'), tone: 'ok' },
              { label: bi('THƯ MỤC TẠM SẠCH', 'TEMP DIR FIXTURE'), value: bi('tmp_path (pathlib.Path)', 'tmp_path (pathlib.Path)'), tone: 'ok' },
              { label: bi('GIẢ LẬP MÔI TRƯỜNG', 'MOCK / ENV'), value: bi('monkeypatch · capsys', 'monkeypatch · capsys') },
              { label: bi('SINH TEST TỰ ĐỘNG', 'PROPERTY TESTS'), value: bi('Hypothesis', 'Hypothesis'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Quét hàng loạt ca biên (0, số âm, rỗng, cực đại) chỉ bằng 1 hàm gắn @parametrize', 'Swept boundary cases (0, negative, empty, max) in a single @parametrize test function') },
              { op: '+', text: bi('Cô lập thao tác tệp bằng fixture tmp_path tự dọn sạch sau mỗi bài test', 'Isolated filesystem tests cleanly using pytest’s built-in tmp_path fixture') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Với các hàm giải mã, nén hoặc tính toán quan trọng, hãy thử thêm thư viện Hypothesis: nó tự động sinh hàng trăm ca biên ngẫu nhiên hóc búa mà con người dễ bỏ sót!', 'For parsers, serializers, or math invariants, add Hypothesis property-based tests to automatically fuzz hundreds of tricky edge cases!'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('KIỂU HIỆN ĐẠI', 'ANNOTATIONS'), value: bi('X | None · [T] · Protocol', 'X | None · [T] · Protocol'), tone: 'ok' },
            { label: bi('KIỂM TRA TĨNH', 'TYPE CHECKERS'), value: bi('pyright · mypy · ty', 'pyright · mypy · ty'), tone: 'ok' },
            { label: bi('KIỂM THỬ PYTEST', 'PYTEST SUITE'), value: bi('assert · raises · parametrize', 'assert · raises · parametrize'), tone: 'ok' },
            { label: bi('ĐỘ TIN CẬY', 'CONFIDENCE'), value: bi('Tự tin nâng cấp lớn!', 'Refactor with confidence!'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Hoàn thiện lưới an toàn kép: Kiểm tra kiểu tĩnh + Bộ kiểm thử tự động pytest bao phủ ca biên', 'Completed dual safety net: zero-cost static type checking + parametrized pytest verification') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Bộ đôi chất lượng M17: Chạy pyright / ty để diệt sạch lỗi None & sai chữ ký hàm trước khi chạy; chạy uv run pytest với @parametrize để khóa chặt logic nghiệp vụ!', 'M17 Quality Duo: Run pyright / ty to catch None & signature bugs statically; run uv run pytest with @parametrize to lock down business logic!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'code', shape: 'laptop', tone: 'neutral', x: -250, y: 0, label: bi('Typed Python 3.12+', 'Typed Python 3.12+'), highlighted: s <= 1 },
            { id: 'mypy', shape: 'gate', tone: 'blue', x: -25, y: -65, label: bi('pyright / mypy / ty', 'pyright / mypy / ty'), sublabel: bi('Protocol · X | None', 'Protocol · X | None'), highlighted: s === 2 },
            { id: 'pytest', shape: 'hex', tone: 'green', x: -25, y: 65, label: bi('pytest + Hypothesis', 'pytest + Hypothesis'), sublabel: bi('tmp_path + @parametrize', 'tmp_path + @parametrize'), icon: 'shield', highlighted: s === 3 || s === 4 },
            { id: 'ship', shape: 'hex', tone: 'purple', x: 230, y: 0, label: bi('Verified Module', 'Verified Module'), sublabel: bi('0 type bugs · 100% pass', '0 type bugs · 100% pass'), icon: 'sparkles', badge: { text: bi('tự tin refactor lớn', 'refactor with confidence'), tone: 'ok' }, highlighted: s >= 5 },
          ],
          links: [
            { id: 'l1', from: 'code', to: 'mypy', label: bi('static AST', 'static AST') },
            { id: 'l2', from: 'code', to: 'pytest', label: bi('edge cases', 'edge cases') },
            { id: 'l3', from: 'mypy', to: 'ship', label: bi('types ok', 'types ok') },
            { id: 'l4', from: 'pytest', to: 'ship', label: bi('assertions pass', 'assertions pass') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'pointer', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'request', speed: 0.46, offset: 0.25 },
            { id: 'p3', linkId: 'l4', kind: 'response', speed: 0.46, offset: 0.6 },
          ],
        },
      };
    },
  },

  M18: {
    id: 'M18',
    titleEn: 'Big-O Complexity, Binary Search (bisect), Timsort & heapq',
    subtitleEn: 'Eliminate hidden O(n²) bottlenecks, cut 1,000,000 checks to 20 hops via bisect, exploit C-speed Timsort, and stream Top-K with heapq.',
    durationMin: 15,
    difficulty: 'Advanced',
    objectives: [
      bi('Nhận diện tức thì bẫy x in list O(n) nằm trong vòng lặp gây treo máy O(n²) và đổi sang set/dict O(1)', 'Spot hidden O(n²) x in list loops immediately and convert lookups to O(1) set/dict'),
      bi('Tìm kiếm nhị phân O(log n) không sai lệch chỉ số trên dữ liệu đã sắp xếp bằng bisect', 'Execute bug-free O(log n) binary searches on sorted sequences via stdlib bisect'),
      bi('Tận dụng Timsort O(n log n) ổn định viết bằng C bên dưới sorted() cùng hàm key= đa tiêu chí', 'Leverage CPython’s C-speed stable Timsort with multi-criteria key= functions'),
      bi('Duy trì hàng đợi ưu tiên và lấy Top-K trong O(n log k) bằng cây Min-Heap heapq', 'Maintain priority queues and extract Top-K items in O(n log k) via heapq'),
    ],
    buildFrame: (s, total) => {
      const heapPhase = s >= 3 && s < total - 1;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('X IN LIST (VÒNG LẶP)', 'NESTED X IN LIST'), value: bi('O(n²) · 10¹² bước → Treo!', 'O(n²) · 10¹² ops → Hangs!'), tone: 'bad' },
              { label: bi('X IN SET / DICT', 'SET / DICT LOOKUP'), value: bi('O(1) · Tổng O(n) siêu tốc!', 'O(1) · Total O(n) instant!'), tone: 'ok' },
              { label: bi('LIST.APPEND / POP()', 'LIST TAIL OPS'), value: bi('O(1)', 'O(1)'), tone: 'ok' },
              { label: bi('LIST.POP(0) / INSERT(0)', 'LIST HEAD OPS'), value: bi('O(n) dịch mảng!', 'O(n) array shift!'), tone: 'warn' },
            ],
            whatChanged: [
              { op: '-', text: bi('Xóa bỏ phép tra cứu x in banned_list O(n) nằm bên trong vòng lặp lớn', 'Eliminated O(n) list membership check inside loop causing quadratic O(n²) stall') },
              { op: '+', text: bi('Chuyển danh sách tra cứu sang set một lần bên ngoài để đạt tốc độ O(1)', 'Converted lookup collection to a set once outside the loop for O(1) checks') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Với N = 1.000.000, thuật toán O(n log n) chạy mất ~0.15 giây, nhưng hai vòng lặp lồng nhau (hoặc x in list trong vòng for) O(n²) cần 1.000 tỷ bước — làm treo cứng tiến trình!', 'At N = 1,000,000, O(n log n) finishes in ~0.15s, whereas O(n²) nested scans require 1,000,000,000,000 operations and freeze your service!'),
            },
          },
          {
            telemetry: [
              { label: bi('QUÉT TUẦN TỰ N=1M', 'LINEAR SCAN N=1M'), value: bi('1.000.000 bước · O(n)', '1,000,000 ops · O(n)'), tone: 'warn' },
              { label: bi('NHỊ PHÂN BISECT', 'BISECT N=1M'), value: bi('≤ 20 bước · O(log n)!', '≤ 20 ops · O(log n)!'), tone: 'ok' },
              { label: bi('ĐIỀU KIỆN BẮT BUỘC', 'PRECONDITION'), value: bi('Mảng đã sắp xếp!', 'Sorted sequence required!'), tone: 'warn' },
              { label: bi('HÀM CHUẨN C', 'STDLIB C API'), value: bi('bisect_left / bisect_right', 'bisect_left / bisect_right'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Mỗi phép so sánh ở giữa mid cắt bỏ trọn 50% không gian tìm kiếm còn lại', 'Halved remaining search space on every step using sorted binary search') },
              { op: '+', text: bi('Dùng bisect.bisect_left viết bằng C tránh hoàn toàn lỗi lặp vô hạn lệch mid ± 1', 'Used C-implemented stdlib bisect avoiding off-by-one infinite loop bugs') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Ngoài tìm kiếm, bisect_right còn cực kỳ lợi hại để phân loại khoảng điểm / bậc thuế (ví dụ [50, 65, 80, 90] → "FDCBA") chỉ trong 1 dòng không cần chuỗi if-elif dài!', 'Beyond exact lookup, bisect_right maps numeric scores or tax brackets ([50, 65, 80, 90] → "FDCBA") in one clean O(log n) expression!'),
            },
          },
          {
            telemetry: [
              { label: bi('ĐỘNG CƠ SẮP XẾP', 'SORT ENGINE'), value: bi('Timsort bằng C · O(n log n)', 'C Timsort · O(n log n)'), tone: 'ok' },
              { label: bi('ĐẶC TÍNH QUAN TRỌNG', 'STABILITY'), value: bi('Stable (giữ thứ tự cũ)', 'Stable (preserves ties)'), tone: 'ok' },
              { label: bi('ĐA TIÊU CHÍ', 'MULTI-KEY'), value: bi('key=lambda x: (-x.sc, x.id)', 'key=lambda x: (-x.sc, x.id)'), tone: 'ok' },
              { label: bi('DỮ LIỆU GẦN SẮP', 'NEARLY SORTED'), value: bi('Tiệm cận O(n)!', 'Approaches O(n)!'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Không tự viết vòng lặp QuickSort / BubbleSort bằng Python thuần chậm gấp 40 lần', 'Avoided pure-Python sorting loops that run 20–50× slower than C Timsort') },
              { op: '+', text: bi('Kết hợp tính ổn định của sorted() và khóa tuple (-score, name) để xếp hạng đa tiêu chí', 'Combined stable Timsort with tuple keys (-score, name) for clean multi-criteria ranking') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Đừng bao giờ tự gõ hàm sắp xếp bằng vòng lặp Python trong sản phẩm thật — sorted() chạy Timsort tối ưu bằng C và tận dụng các đoạn đã có thứ tự sẵn cực nhanh!', 'Never hand-roll sorting loops in production Python — built-in sorted() runs C-optimized Timsort and exploits natural sorted runs brilliantly!'),
            },
          },
          {
            telemetry: [
              { label: bi('CẤU TRÚC HEAPQ', 'HEAPQ MODEL'), value: bi('Min-Heap · heap[0] = min', 'Min-Heap · heap[0] = min'), tone: 'ok' },
              { label: bi('THÊM / RÚT ƯU TIÊN', 'PUSH / POP'), value: bi('O(log n)', 'O(log n)'), tone: 'ok' },
              { label: bi('LẤY TOP-K NHANH', 'TOP-K STREAM'), value: bi('nlargest(k) · O(n log k)', 'nlargest(k) · O(n log k)'), tone: 'ok' },
              { label: bi('MẸO MAX-HEAP', 'MAX-HEAP TRICK'), value: bi('Đẩy số đối âm -score', 'Push negated -score') },
            ],
            whatChanged: [
              { op: '+', text: bi('Dùng heapq.nlargest(5, stream) lấy Top 5 mà không phải sắp xếp toàn bộ 5 triệu bản ghi', 'Extracted Top-5 items in O(n log k) via heapq.nlargest without sorting all 5M records') },
              { op: '+', text: bi('Cài đặt Hàng đợi ưu tiên (Priority Queue) bằng heappush / heappop trong O(log n)', 'Implemented an O(log n) Priority Queue using heappush and heappop') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Mô-đun heapq của Python luôn là Min-Heap (nhỏ nhất ở heap[0]). Khi muốn ưu tiên điểm số LỚN NHẤT ra trước, chỉ cần đẩy cặp (-score, item) vào heap!', 'Python’s heapq is a Min-Heap (smallest at heap[0]). To pop the LARGEST score first, simply push (-score, item) tuples!'),
            },
          },
          {
            telemetry: [
              { label: bi('ĐO HIỆU NĂNG CHUẨN', 'BENCHMARK'), value: bi('timeit.timeit(...)', 'timeit.timeit(...)'), tone: 'ok' },
              { label: bi('CÂY CÂN BẰNG ĐỘNG', 'SORTED LIST'), value: bi('sortedcontainers · O(log n)', 'sortedcontainers · O(log n)'), tone: 'ok' },
              { label: bi('SẮP XẾP VECTOR', 'SIMD ARRAY'), value: bi('NumPy / Polars sort', 'NumPy / Polars sort'), tone: 'ok' },
              { label: bi('CHIA ĐỂ TRỊ', 'ALGO THEORY'), value: bi('Merge / Quick Sort', 'Merge / Quick Sort') },
            ],
            whatChanged: [
              { op: '+', text: bi('Đo đạc thực nghiệm bằng timeit và mở rộng sang thư viện sortedcontainers khi vừa chèn vừa tìm liên tục', 'Verified wall-clock speed with timeit and mapped sortedcontainers for dynamic sorted sets') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Nếu danh sách liên tục bị chèn thêm phần tử mới xen kẽ với tìm kiếm nhị phân (bisect.insort trên list thường vẫn mất O(n) dịch mảng), hãy dùng SortedList của gói sortedcontainers!', 'If you repeatedly insert AND binary-search dynamically (bisect.insort on a list still shifts in O(n)), use SortedList from sortedcontainers for true O(log n) updates!'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('TRA CỨU NHANH', 'MEMBERSHIP'), value: bi('set / dict · O(1)', 'set / dict · O(1)'), tone: 'ok' },
            { label: bi('DÃY ĐÃ SẮP XẾP', 'SORTED SEARCH'), value: bi('bisect · O(log n)', 'bisect · O(log n)'), tone: 'ok' },
            { label: bi('SẮP XẾP ĐA KHÓA', 'FULL SORT'), value: bi('sorted() Timsort · O(n log n)', 'sorted() Timsort · O(n log n)'), tone: 'ok' },
            { label: bi('TOP-K & ƯU TIÊN', 'PRIORITY / TOP-K'), value: bi('heapq · O(n log k)', 'heapq · O(n log k)'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Đúc kết bản đồ độ phức tạp Big-O và 4 vũ khí tốc độ C có sẵn trong thư viện chuẩn', 'Synthesized Big-O intuition and Python’s 4 C-accelerated stdlib algorithmic engines') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Bảng quyết định M18: Kiểm tra tồn tại lặp → set/dict O(1) · Tìm trên mảng đã sắp → bisect O(log n) · Chỉ cần Top-K → heapq O(n log k) · Sắp xếp toàn bộ → sorted(key=...)!', 'M18 Decision Map: Repeated membership → set/dict O(1) · Search sorted array → bisect O(log n) · Top-K only → heapq O(n log k) · Full sort → sorted(key=...)!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'tape', shape: 'tape', tone: 'blue', x: -165, y: -45, label: bi('Sorted Array · bisect', 'Sorted Array · bisect'), sublabel: bi('lo · mid · hi', 'lo · mid · hi'), tapeCells: ['10', '22', '35', '48', '60', '77', '91'], activeIndices: [3, 4, 5], highlighted: s === 1 },
            { id: 'lin', shape: 'box', tone: 'rose', x: -205, y: 75, label: bi('Vòng lồng O(n²)', 'Nested O(n²)'), sublabel: bi('10¹² phép tính → treo!', '10¹² ops → timeout!'), dimmed: s > 0, highlighted: s === 0 },
            { id: 'tim', shape: 'hex', tone: 'green', x: 115, y: -50, label: bi('Timsort C Engine', 'Timsort C Engine'), sublabel: bi('sorted(xs, key=...)', 'sorted(xs, key=...)'), icon: 'zap', highlighted: s === 2 },
            { id: 'heap', shape: 'cylinder', tone: 'purple', x: 195, y: 70, label: bi('heapq Min-Heap', 'heapq Min-Heap'), sublabel: bi('heap[0] = min · O(log n)', 'heap[0] = min · O(log n)'), icon: 'layers', highlighted: heapPhase },
          ],
          links: [
            { id: 'l1', from: 'tim', to: 'tape', label: bi('O(n log n)', 'O(n log n)') },
            { id: 'l2', from: 'tape', to: 'heap', label: bi('Top-K / Priority', 'Top-K / Priority') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'cache-hit', speed: 0.5 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.48, offset: 0.45 },
          ],
        },
      };
    },
  },

  M19: {
    id: 'M19',
    titleEn: 'Stacks, Deques, Linked Lists, BST & Graph BFS',
    subtitleEn: 'Replace O(n) list.pop(0) queues with O(1) collections.deque, master pointer rewiring, and run shortest-path BFS.',
    durationMin: 15,
    difficulty: 'Advanced',
    objectives: [
      bi('Dùng list.append/pop() cho Stack LIFO O(1) và tuyệt đối tránh dùng list.pop(0) O(n) làm hàng đợi', 'Use list.append()/pop() for O(1) LIFO Stacks and never use O(n) list.pop(0) as a queue'),
      bi('Sử dụng collections.deque đạt O(1) ở cả hai đầu (popleft / append) và cửa sổ trượt maxlen', 'Use double-ended collections.deque for O(1) FIFO queues and maxlen sliding windows'),
      bi('Nắm chắc liên kết con trỏ Node, kỹ thuật Rùa - Thỏ và tính chất duyệt In-order trên cây BST', 'Master Linked List pointer reversal, fast/slow pointers, and sorted BST In-order traversal'),
      bi('Tìm đường đi ít bước nhất bằng BFS trên đồ thị kèm quy tắc đánh dấu visited ngay khi đẩy vào deque', 'Find unweighted shortest paths via Graph BFS marking visited immediately on enqueue'),
    ],
    buildFrame: (s, total) => {
      const bfsPhase = s >= 4 && s < total - 1;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('STACK LIFO', 'STACK LIFO'), value: bi('list.append / pop() · O(1)', 'list.append / pop() · O(1)'), tone: 'ok' },
              { label: bi('XEM ĐỈNH STACK', 'STACK PEEK'), value: bi('stack[-1] · O(1)', 'stack[-1] · O(1)'), tone: 'ok' },
              { label: bi('BẪY LIST.POP(0)', 'LIST.POP(0) TRAP'), value: bi('O(n) dồn mảng → O(n²)!', 'O(n) shift → O(n²) loop!'), tone: 'bad' },
              { label: bi('KIỂM TRA RỖNG', 'EMPTY CHECK'), value: bi('if not stack:', 'if not stack:') },
            ],
            whatChanged: [
              { op: '+', text: bi('Dùng trực tiếp list chuẩn cho bài toán Ngăn xếp LIFO (khớp ngoặc, Undo, DFS)', 'Used built-in list tail operations for O(1) LIFO Stack problems') },
              { op: '-', text: bi('Cảnh báo thảm họa gọi list.pop(0) trong vòng lặp hàng đợi lớn', 'Flagged list.pop(0) anti-pattern that degrades queue loops from O(n) to O(n²)') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('list cực nhanh ở ĐUÔI mảng (append/pop() là O(1)), nhưng cực chậm ở ĐẦU mảng (pop(0)/insert(0, x) phải dịch chuyển toàn bộ phần tử còn lại mất O(n))!', 'Python lists are O(1) at the TAIL (append/pop()), but O(n) at the HEAD (pop(0)/insert(0, x) shifts every remaining element in memory)!'),
            },
          },
          {
            telemetry: [
              { label: bi('HÀNG ĐỢI FIFO', 'FIFO QUEUE'), value: bi('collections.deque', 'collections.deque'), tone: 'ok' },
              { label: bi('LẤY ĐẦU HÀNG', 'DEQUEUE HEAD'), value: bi('q.popleft() · O(1)!', 'q.popleft() · O(1)!'), tone: 'ok' },
              { label: bi('CHÈN ĐẦU / CUỐI', 'BOTH ENDS'), value: bi('appendleft / append · O(1)', 'appendleft / append · O(1)'), tone: 'ok' },
              { label: bi('LỊCH SỬ TRƯỢT', 'RING BUFFER'), value: bi('deque(maxlen=N)', 'deque(maxlen=N)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Thay thế list.pop(0) bằng collections.deque.popleft() đạt tốc độ hằng số O(1)', 'Switched FIFO queue to collections.deque achieving true O(1) append and popleft') },
              { op: '+', text: bi('Ứng dụng deque(maxlen=N) tự động giữ N dòng nhật ký mới nhất không lo tràn RAM', 'Used bounded deque(maxlen=N) as an automatic O(1) sliding history buffer') },
            ],
            callout: {
              kind: 'technique',
              text: bi('deque(maxlen=100) là cấu trúc bộ đệm vòng (Ring Buffer) tuyệt đẹp viết sẵn bằng C: khi thêm phần tử thứ 101 vào cuối, phần tử cũ nhất ở đầu tự động rơi ra trong O(1)!', 'deque(maxlen=100) acts as a C-speed Ring Buffer: appending the 101st item automatically evicts the oldest head item in O(1)!'),
            },
          },
          {
            telemetry: [
              { label: bi('ĐẢO NGƯỢC TẠI CHỖ', 'IN-PLACE REVERSE'), value: bi('O(n) time · O(1) RAM', 'O(n) time · O(1) RAM'), tone: 'ok' },
              { label: bi('HAI CON TRỎ', 'TWO POINTERS'), value: bi('slow (1x) & fast (2x)', 'slow (1x) & fast (2x)'), tone: 'ok' },
              { label: bi('ỨNG DỤNG THẬT', 'REAL USE CASE'), value: bi('LRU Cache · Browser Back', 'LRU Cache · Browser Back') },
              { label: bi('DUYỆT TỰ NHIÊN', 'ITERABLE NODE'), value: bi('def __iter__: yield', 'def __iter__: yield'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Đảo chiều mũi tên liên kết tại chỗ bằng phép gán đồng thời cur.next, prev, cur = ...', 'Reversed node next pointers in-place in O(1) memory via tuple assignment') },
              { op: '+', text: bi('Áp dụng hai con trỏ Rùa - Thỏ tìm phần tử chính giữa và phát hiện chu trình khép kín', 'Applied Floyd’s fast/slow pointers for single-pass midpoint and cycle detection') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Bên trong @functools.lru_cache của chính thư viện chuẩn Python sử dụng một Danh sách liên kết đôi vòng tròn kết hợp với dict để đẩy phần tử vừa truy cập lên đầu trong O(1)!', 'Inside Python’s own @functools.lru_cache sits a circular Doubly Linked List paired with a dict to move recently used keys to the front in O(1)!'),
            },
          },
          {
            telemetry: [
              { label: bi('BẤT BIẾN CÂY BST', 'BST INVARIANT'), value: bi('Left < Node < Right', 'Left < Node < Right'), tone: 'ok' },
              { label: bi('DUYỆT IN-ORDER', 'IN-ORDER WALK'), value: bi('Luôn ra dãy tăng dần!', 'Yields sorted ascending!'), tone: 'ok' },
              { label: bi('CÂY CÂN BẰNG', 'BALANCED COST'), value: bi('O(log n)', 'O(log n)'), tone: 'ok' },
              { label: bi('CÂY SUY BIẾN', 'SKEWED WORST'), value: bi('O(n) khi chèn dãy đã sắp!', 'O(n) on sorted inserts!'), tone: 'warn' },
            ],
            whatChanged: [
              { op: '+', text: bi('Duyệt cây đệ quy thanh lịch bằng yield from inorder(node.left) cho luồng tăng dần lười', 'Streamed BST nodes in sorted order lazily using recursive yield from') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Nếu chèn lần lượt 1, 2, 3, 4, 5 vào cây BST không tự cân bằng, cây sẽ mọc lệch hẳn sang phải thành một Linked List dài N nút làm tốc độ tìm kiếm tụt xuống O(n)!', 'Inserting already-sorted keys 1, 2, 3, 4, 5 into an unbalanced BST degenerates it into a right-leaning chain with O(n) lookup!'),
            },
          },
          {
            telemetry: [
              { label: bi('BIỂU DIỄN ĐỒ THỊ', 'GRAPH MODEL'), value: bi('dict[node, list[node]]', 'dict[node, list[node]]'), tone: 'ok' },
              { label: bi('ĐƯỜNG NGẮN NHẤT', 'UNWEIGHTED PATH'), value: bi('BFS (deque + visited)', 'BFS (deque + visited)'), tone: 'ok' },
              { label: bi('ĐỘ PHỨC TẠP BFS', 'BFS COMPLEXITY'), value: bi('O(V + E)', 'O(V + E)'), tone: 'ok' },
              { label: bi('QUY TẮC VISITED', 'VISITED TIMING'), value: bi('Đánh dấu LÚC ĐẨY VÀO!', 'Mark ON ENQUEUE!'), tone: 'warn' },
            ],
            whatChanged: [
              { op: '+', text: bi('Loang sóng BFS theo từng lớp khoảng cách nhờ hàng đợi deque + tập visited O(1)', 'Expanded BFS wave layer-by-layer using deque and an O(1) visited set') },
              { op: '+', text: bi('Khóa visited.add(neighbor) ngay khoảnh khắc queue.append để chặn đẩy trùng đỉnh', 'Marked visited.add(neighbor) immediately upon enqueueing to prevent duplicate queue explosion') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Trong BFS đồ thị có chu trình, phải gọi visited.add(neighbor) NGAY KHI đẩy vào deque (không đợi tới lúc popleft) — nếu không một đỉnh có thể bị đẩy trùng hàng trăm lần!', 'In Graph BFS, always call visited.add(neighbor) WHEN ENQUEUEING (not when popping) — otherwise dense graphs enqueue the same node hundreds of times!'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('NGĂN XẾP LIFO', 'LIFO STACK'), value: bi('list.append / pop() · O(1)', 'list.append / pop() · O(1)'), tone: 'ok' },
            { label: bi('HÀNG ĐỢI FIFO', 'FIFO QUEUE'), value: bi('deque.popleft() · O(1)', 'deque.popleft() · O(1)'), tone: 'ok' },
            { label: bi('ĐỒ THỊ NGẮN NHẤT', 'SHORTEST HOPS'), value: bi('BFS + visited on enqueue', 'BFS + visited on enqueue'), tone: 'ok' },
            { label: bi('HỆ SINH THÁI', 'GRAPH LIBS'), value: bi('graphlib · NetworkX · rustworkx', 'graphlib · NetworkX · rustworkx'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Hoàn thiện bộ cấu trúc dữ liệu nền tảng từ Stack/Deque tới Cây nhị phân và Đồ thị BFS', 'Consolidated core data structures from O(1) Stacks/Deques to Trees and Graph BFS') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Đúc kết M19: Stack dùng list · Queue & BFS bắt buộc dùng collections.deque · Đánh dấu visited ngay khi enqueue · Đồ thị lớn thực tế dùng NetworkX hoặc rustworkx!', 'M19 Recap: Stack → list · FIFO Queue & BFS → collections.deque · Mark visited on enqueue · Production graphs → graphlib, NetworkX, or rustworkx!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'badQ', shape: 'tape', tone: 'rose', x: -220, y: -65, label: bi('list.pop(0) · O(n)', 'list.pop(0) · O(n)'), tapeCells: ['←', 'B', 'C', 'D', 'E'], activeIndices: [0], dimmed: s >= 1, highlighted: s === 0 },
            { id: 'deq', shape: 'tape', tone: 'green', x: -220, y: 55, label: bi('deque.popleft() · O(1)', 'deque.popleft() · O(1)'), tapeCells: ['A', 'B', 'C', 'D'], activeIndices: [0, 3], highlighted: s === 1 },
            { id: 'bfs', shape: 'hex', tone: 'blue', x: 75, y: 0, label: bi('BFS / Tree Engine', 'BFS / Tree Engine'), sublabel: bi('từng lớp khoảng cách', 'level-order / pointers'), icon: 'git', highlighted: s === 2 || s === 3 || bfsPhase },
            { id: 'vis', shape: 'cylinder', tone: 'purple', x: 255, y: 0, label: bi('visited = set()', 'visited = set()'), sublabel: bi('đánh dấu lúc enqueue!', 'mark on enqueue O(1)'), icon: 'shield', highlighted: bfsPhase },
          ],
          links: [
            { id: 'l1', from: 'deq', to: 'bfs', label: bi('popleft() O(1)', 'popleft() O(1)') },
            { id: 'l2', from: 'bfs', to: 'vis', label: bi('if nxt not in visited', 'if nxt not in visited') },
            { id: 'l3', from: 'bfs', to: 'deq', style: 'dashed', label: bi('append(nxt)', 'append(nxt)'), curve: 32 },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.5 },
            { id: 'p2', linkId: 'l2', kind: 'cache-hit', speed: 0.5, offset: 0.35 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.45, offset: 0.65 },
          ],
        },
      };
    },
  },

  M20: {
    id: 'M20',
    titleEn: 'Dynamic Programming (DP) & Backtracking Search',
    subtitleEn: 'Solve overlapping subproblems via Top-Down @cache or Bottom-Up tables, and prune search trees with Choose-Explore-Unchoose.',
    durationMin: 16,
    difficulty: 'Advanced',
    objectives: [
      bi('Hiểu vì sao Tham lam thất bại (đổi xu 1, 3, 4 cho tổng 6) và thiết kế DP theo 4 bước chuẩn', 'See why Greedy fails on [1, 3, 4] → 6 and formulate Dynamic Programming in 4 systematic steps'),
      bi('Chuyển đổi linh hoạt giữa Top-Down (đệ quy + @cache) và Bottom-Up (điền bảng dp[] O(1) stack)', 'Convert cleanly between Top-Down (@functools.cache) and Bottom-Up iterative tabulation'),
      bi('Nắm chắc khuôn 3 nhịp Quay lui (Chọn → Đệ quy → Gỡ) và luôn lưu nghiệm bằng path.copy()', 'Apply Choose → Explore → Unchoose backtracking and snapshot solutions via path.copy()'),
      bi('Cắt tỉa nhánh cụt sớm (Pruning) và biết hệ sinh thái tối ưu công nghiệp (OR-Tools, PuLP)', 'Prune dead search subtrees early and recognize industrial solvers (OR-Tools, PuLP, SciPy)'),
    ],
    buildFrame: (s, total) => {
      const btPhase = s >= 3 && s < total - 1;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('THAM LAM (XU 1,3,4 → 6)', 'GREEDY (COINS 1,3,4 → 6)'), value: bi('4+1+1 = 3 xu (Chưa tối ưu!)', '4+1+1 = 3 coins (Suboptimal!)'), tone: 'warn' },
              { label: bi('QUY HOẠCH ĐỘNG (DP)', 'OPTIMAL DP'), value: bi('3+3 = 2 xu (Tối ưu!)', '3+3 = 2 coins (Optimal!)'), tone: 'ok' },
              { label: bi('ĐIỀU KIỆN 1', 'CONDITION 1'), value: bi('Cấu trúc con tối ưu', 'Optimal Substructure'), tone: 'ok' },
              { label: bi('ĐIỀU KIỆN 2', 'CONDITION 2'), value: bi('Bài toán con gối nhau', 'Overlapping Subproblems'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Chứng minh lựa chọn tham lam cục bộ không đảm bảo tối ưu toàn cục ở bài toán đổi xu', 'Showed how greedy largest-coin choice misses the global 2-coin optimum for amount 6') },
              { op: '+', text: bi('Thiết lập quy trình 4 bước: Định nghĩa dp[i] → Truy hồi → Cơ sở → Thứ tự tính', 'Established the 4-step DP blueprint: State definition → Recurrence → Base case → Order') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Quy hoạch động không phải phép đoán mò: chỉ cần trả lời rành mạch câu hỏi "dp[i] đại diện cho con số tối ưu nào tính tới bước i?", công thức truy hồi sẽ tự hiện ra!', 'DP isn’t guesswork: once you define precisely in one sentence what dp[i] represents, the state transition recurrence writes itself!'),
            },
          },
          {
            telemetry: [
              { label: bi('TOP-DOWN DP', 'TOP-DOWN DP'), value: bi('dfs(state) + @cache', 'dfs(state) + @cache'), tone: 'ok' },
              { label: bi('BOTTOM-UP DP', 'BOTTOM-UP DP'), value: bi('Bảng dp[0..n] · Stack O(1)', 'dp[0..n] · O(1) stack'), tone: 'ok' },
              { label: bi('GIỚI HẠN ĐỆ QUY', 'RECURSION LIMIT'), value: bi('~1000 khung gọi mặc định', '~1000 frames default'), tone: 'warn' },
              { label: bi('ĐỘ PHỨC TẠP', 'SPEEDUP'), value: bi('O(2^n) ➔ O(n · |coins|)', 'O(2^n) ➔ O(n · |coins|)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Dựng nguyên mẫu Top-Down cực nhanh nhờ gắn @functools.cache lên hàm đệ quy', 'Prototyped Top-Down memoization rapidly by decorating recursive solver with @cache') },
              { op: '+', text: bi('Chuyển sang điền mảng Bottom-Up tuần tự loại bỏ hoàn toàn nguy cơ tràn ngăn xếp', 'Converted recurrence to iterative Bottom-Up table eliminating RecursionError limits') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Chiến thuật thực chiến: viết Top-Down + @cache trước trong 3 phút để kiểm tra công thức trên ca nhỏ; nếu đầu vào n > 1.000 hãy chuyển sang vòng lặp Bottom-Up!', 'Battle-tested workflow: prototype Top-Down + @cache in 3 minutes to validate your recurrence, then convert to Bottom-Up tabulation when n > 1,000!'),
            },
          },
          {
            telemetry: [
              { label: bi('BÀI ĐỔI XU', 'COIN CHANGE'), value: bi('dp[x] = min(dp[x-c] + 1)', 'dp[x] = min(dp[x-c] + 1)'), tone: 'ok' },
              { label: bi('DÃY TĂNG DÀI NHẤT', 'LIS'), value: bi('O(n²) DP / O(n log n) bisect', 'O(n²) DP / O(n log n) bisect') },
              { label: bi('KHOẢNG CÁCH SỬA', 'LEVENSHTEIN'), value: bi('Thêm · Xóa · Thay ký tự', 'Insert · Delete · Replace'), tone: 'ok' },
              { label: bi('TỐI ƯU BỘ NHỚ', 'ROLLING ROWS'), value: bi('O(n·m) RAM ➔ O(m) RAM!', 'O(n·m) RAM ➔ O(m) RAM!'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Rút gọn ma trận Levenshtein 2 chiều xuống chỉ giữ 2 hàng trượt prev và cur tiết kiệm RAM', 'Compressed 2D Levenshtein matrix down to 2 rolling rows (prev & cur) in O(min(n, m)) RAM') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Mẹo nén bộ nhớ DP: khi hàng thứ i của bảng quy hoạch động chỉ phụ thuộc vào hàng i - 1 ngay phía trên, bạn chỉ cần giữ đúng 2 mảng prev và cur thay vì cả ma trận lớn!', 'DP space optimization trick: whenever row i only reads from row i - 1, keep just two 1D arrays (prev and cur) instead of allocating the full N×M grid!'),
            },
          },
          {
            telemetry: [
              { label: bi('NHỊP 1: CHỌN', '1. CHOOSE'), value: bi('path.append(candidate)', 'path.append(candidate)'), tone: 'ok' },
              { label: bi('NHỊP 2: THÁM HIỂM', '2. EXPLORE'), value: bi('backtrack(next_state)', 'backtrack(next_state)'), tone: 'ok' },
              { label: bi('NHỊP 3: GỠ LÙI', '3. UNCHOOSE'), value: bi('path.pop() hoàn trả!', 'path.pop() restore!'), tone: 'ok' },
              { label: bi('GHI NHẬN NGHIỆM', 'SNAPSHOT'), value: bi('results.append(path.copy())', 'results.append(path.copy())'), tone: 'warn' },
            ],
            whatChanged: [
              { op: '+', text: bi('Áp dụng khuôn 3 nhịp Chọn → Đệ quy → Gỡ cho bài toán liệt kê tổ hợp & Sudoku', 'Applied the universal 3-step Choose → Explore → Unchoose backtracking template') },
              { op: '+', text: bi('Chụp bản sao độc lập path.copy() khi chạm đích để không bị xóa rỗng lúc quay lui', 'Cloned path.copy() upon recording valid solutions so later pops don’t wipe results') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Lỗi phổ biến nhất khi viết Backtracking: viết results.append(path) quên .copy() khiến cuối cùng results chứa toàn các danh sách rỗng [[], [], []] vì chung tham chiếu!', 'Number-one Backtracking bug: writing results.append(path) without .copy() leaves you with [[], [], []] at the end because every entry aliases the mutated path list!'),
            },
          },
          {
            telemetry: [
              { label: bi('CẮT TỈA SỚM', 'EARLY PRUNING'), value: bi('if val > rem: break!', 'if val > rem: break!'), tone: 'ok' },
              { label: bi('TỔ HỢP ĐƠN GIẢN', 'UNCONSTRAINED'), value: bi('Dùng itertools (tốc độ C)', 'Use C-speed itertools'), tone: 'ok' },
              { label: bi('QUY HOẠCH CÔNG NGHIỆP', 'ENTERPRISE OPT'), value: bi('OR-Tools · PuLP · SciPy', 'OR-Tools · PuLP · SciPy'), tone: 'ok' },
              { label: bi('KIỂM CHỨNG ĐÚNG SAI', 'VERIFICATION'), value: bi('Đối chiếu vét cạn ca nhỏ!', 'Cross-check vs brute-force!'), tone: 'warn' },
            ],
            whatChanged: [
              { op: '+', text: bi('Sắp xếp mảng trước để cắt tỉa sớm toàn bộ nhánh vượt quá tổng mục tiêu', 'Sorted candidates upfront enabling instant branch pruning as soon as val > remaining') },
              { op: '+', text: bi('Kiểm chứng thuật toán bằng bộ test ca nhỏ đối chiếu tránh chép nhầm code sai trên mạng', 'Verified DP/string algorithms against known ground-truth tests to catch buggy implementations') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Với bài toán phân ca trực nhân sự, xếp lịch xe giao hàng hay tối ưu kho vận hàng nghìn biến ràng buộc thực tế, hãy dùng bộ giải chuyên nghiệp Google OR-Tools hoặc PuLP!', 'For real-world shift scheduling, vehicle routing, or integer linear programming with thousands of constraints, use Google OR-Tools or PuLP!'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('TỐI ƯU / ĐẾM CÁCH', 'OPTIMIZE / COUNT'), value: bi('DP (@cache hoặc dp[])', 'DP (@cache or dp[])'), tone: 'ok' },
            { label: bi('LIỆT KÊ CẤU HÌNH', 'ENUMERATE VALID'), value: bi('Backtracking + Pruning', 'Backtracking + Pruning'), tone: 'ok' },
            { label: bi('BẪY THAM CHIẾU', 'COPY INVARIANT'), value: bi('path.copy() khi lưu nghiệm', 'path.copy() on save'), tone: 'ok' },
            { label: bi('SOLVER THỰC TẾ', 'SOLVERS'), value: bi('OR-Tools · PuLP · SciPy', 'OR-Tools · PuLP · SciPy'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Hoàn thiện tư duy giải quyết bài toán tối ưu (DP) và tìm kiếm có ràng buộc (Backtracking)', 'Mastered Dynamic Programming state transitions and pruned Backtracking search trees') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Đúc kết M20: Hỏi giá trị min/max/số cách có bài toán con lặp lại → Quy hoạch động; Hỏi liệt kê mọi cấu hình thỏa ràng buộc → Quay lui có cắt tỉa + path.copy()!', 'M20 Recap: Asking for min/max/count over overlapping subproblems → DP; Enumerating all valid configurations → Pruned Backtracking + path.copy()!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'dp', shape: 'tape', tone: 'green', x: -185, y: -45, label: bi('Bảng DP: dp[0..6]', 'DP Table: dp[0..6]'), sublabel: bi('dp[x] = min(dp[x-c] + 1)', 'dp[x] = min(dp[x-c] + 1)'), tapeCells: ['0', '1', '2', '1', '1', '2', '2'], activeIndices: [3, 6], highlighted: s <= 2 },
            { id: 'choose', shape: 'hex', tone: 'blue', x: -85, y: 75, label: bi('1. path.append(x)', '1. path.append(x)'), sublabel: bi('Choose & Explore', 'Choose & Explore'), icon: 'git', highlighted: btPhase },
            { id: 'prune', shape: 'gate', tone: 'rose', x: 115, y: -35, label: bi('Vi phạm ràng buộc?', 'Constraint violated?'), sublabel: bi('Cắt nhánh ngay (Prune)', 'Prune dead subtree!'), highlighted: s === 4 },
            { id: 'undo', shape: 'hex', tone: 'purple', x: 225, y: 75, label: bi('3. path.pop()', '3. path.pop()'), sublabel: bi('Unchoose + path.copy()', 'Unchoose + path.copy()'), icon: 'sparkles', highlighted: btPhase },
          ],
          links: [
            { id: 'l1', from: 'choose', to: 'prune', label: bi('kiểm tra hợp lệ', 'check valid') },
            { id: 'l2', from: 'prune', to: 'undo', style: 'danger', label: bi('nhánh tắc → lùi!', 'dead end → undo!') },
            { id: 'l3', from: 'undo', to: 'choose', style: 'dashed', label: bi('thử lựa chọn kế', 'try next candidate'), curve: 26 },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.48 },
            { id: 'p2', linkId: 'l2', kind: 'error', speed: 0.48, offset: 0.35 },
            { id: 'p3', linkId: 'l3', kind: 'mutation', speed: 0.48, offset: 0.7 },
          ],
        },
      };
    },
  },

  M21: {
    id: 'M21',
    titleEn: 'HTTP Clients (httpx), REST APIs & FastAPI Backends',
    subtitleEn: 'Enforce client timeouts, inject transports for offline unit tests, validate schemas with FastAPI + Pydantic, and map Python’s web ecosystem.',
    durationMin: 15,
    difficulty: 'Advanced',
    objectives: [
      bi('Hiểu rõ giao thức HTTP (Verbs, Status Codes) và luôn đặt timeout= kèm raise_for_status()', 'Master HTTP semantics and enforce mandatory timeout= plus raise_for_status() on all calls'),
      bi('Tách lớp HTTP Client khỏi hàm phân tích dữ liệu thuần để chạy unit test offline trong 1 ms', 'Decouple pure payload parsers from injectable HTTP transports for instant offline unit tests'),
      bi('Xây dựng dịch vụ REST chuẩn mực với FastAPI + Pydantic tự động trả 422 và sinh tài liệu /docs', 'Build type-safe FastAPI endpoints with Pydantic models returning 422 errors and OpenAPI /docs'),
      bi('Nắm toàn cảnh hệ sinh thái Web Python: httpx/requests/aiohttp & FastAPI/Django/Flask/Litestar', 'Choose wisely across Python’s HTTP & Web stack: httpx/requests/aiohttp and FastAPI/Django/Flask'),
    ],
    buildFrame: (s, total) => {
      const badPayload = s === 3;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('CLIENT TIMEOUT', 'CLIENT TIMEOUT'), value: bi('timeout=5.0s (Bắt buộc!)', 'timeout=5.0s (Mandatory!)'), tone: 'ok' },
              { label: bi('MẶC ĐỊNH REQUESTS', 'REQUESTS DEFAULT'), value: bi('timeout=None (Treo mãi!)', 'timeout=None (Hangs!)'), tone: 'bad' },
              { label: bi('NHÓM MÃ LỖI', 'STATUS RANGES'), value: bi('2xx OK · 4xx Client · 5xx Server', '2xx OK · 4xx Client · 5xx Srv') },
              { label: bi('SAI DỮ LIỆU JSON', 'SCHEMA ERROR'), value: bi('422 Unprocessable Entity', '422 Unprocessable Entity'), tone: 'warn' },
            ],
            whatChanged: [
              { op: '+', text: bi('Nắm vững cấu trúc gói tin HTTP Request/Response và ngữ nghĩa các mã trạng thái chuẩn', 'Established HTTP verb semantics, headers, JSON payloads, and status code classes') },
              { op: '+', text: bi('Khóa cứng quy tắc bắt buộc truyền timeout= cho mọi kết nối mạng ra bên ngoài', 'Enforced mandatory socket timeouts to prevent hung workers in production') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Rủi ro sập Production kinh điển: requests.get(url) không truyền timeout= sẽ đứng chờ VÔ THỜI HẠN nếu máy chủ đối tác treo kết nối, làm cạn sạch toàn bộ worker của bạn!', 'Classic production outage: requests.get(url) without timeout= waits FOREVER if the upstream stalls, starving every worker thread in your server!'),
            },
          },
          {
            telemetry: [
              { label: bi('MÃ HÓA QUERY', 'SAFE QUERY PARAMS'), value: bi('params={"q": "Hà Nội"}', 'params={"q": "Hà Nội"}'), tone: 'ok' },
              { label: bi('KIỂM TRA 4XX/5XX', 'STATUS CHECK'), value: bi('resp.raise_for_status()', 'resp.raise_for_status()'), tone: 'ok' },
              { label: bi('TÁI SỬ DỤNG KẾT NỐI', 'CONN POOLING'), value: bi('with httpx.Client() as c:', 'with httpx.Client() as c:'), tone: 'ok' },
              { label: bi('GỬI JSON BODY', 'JSON PAYLOAD'), value: bi('client.post(url, json=d)', 'client.post(url, json=d)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Bỏ phép cộng chuỗi URL thủ công dễ hỏng ký tự đặc biệt và dấu cách tiếng Việt', 'Eliminated manual URL string concatenation in favor of URL-encoded params=') },
              { op: '+', text: bi('Tái sử dụng kết nối TCP/TLS bằng httpx.Client và chủ động gọi raise_for_status()', 'Reused TCP/TLS connections via httpx.Client and enforced raise_for_status()') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Cả requests lẫn httpx đều KHÔNG tự động ném ngoại lệ khi nhận mã lỗi 404 hay 500! Hãy luôn gọi resp.raise_for_status() ngay trước khi đọc resp.json().', 'Neither requests nor httpx raises on 404 or 500 responses automatically! Always call resp.raise_for_status() before parsing resp.json().'),
            },
          },
          {
            telemetry: [
              { label: bi('HÀM PARSE THUẦN', 'PURE PARSER'), value: bi('Nhận dict → Trả kết quả', 'dict in → domain out'), tone: 'ok' },
              { label: bi('TIÊM HÀM MẠNG', 'TRANSPORT DI'), value: bi('http_get=httpx.get', 'http_get=httpx.get'), tone: 'ok' },
              { label: bi('TỐC ĐỘ PYTEST', 'OFFLINE TEST'), value: bi('~1 ms (0 phụ thuộc Wi-Fi)', '~1 ms (100% offline)'), tone: 'ok' },
              { label: bi('BẢO VỆ API KEY', 'SECRET STORAGE'), value: bi('os.environ / .env (.gitignore)', 'os.environ / .env'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Tách riêng hàm parse_repo_names(payload) thuần túy khỏi lời gọi mạng I/O', 'Separated pure JSON transformation logic from network transport I/O') },
              { op: '+', text: bi('Tiêm hàm http_get qua tham số giúp giả lập phản hồi mạng tức thì trong pytest', 'Injected http_get callable enabling deterministic offline unit tests') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Khi tách riêng hàm parse_response(dict) thuần khiết, bạn có thể viết 20 bài kiểm thử cho mọi trường hợp JSON thiếu trường / rỗng chạy xong trong 2 ms mà không cần mạng!', 'Extracting a pure parse_response(dict) function lets you test 20 malformed/empty JSON edge cases in 2 milliseconds with zero network flakiness!'),
            },
          },
          {
            telemetry: [
              { label: bi('CỔNG XÁC THỰC', 'SCHEMA GATE'), value: bi('Pydantic BaseModel', 'Pydantic BaseModel'), tone: 'ok' },
              { label: bi('JSON SAI KIỂU', 'INVALID PAYLOAD'), value: bi('Tự động chặn → HTTP 422!', 'Auto-rejected → HTTP 422!'), tone: 'warn' },
              { label: bi('TÀI LIỆU TỰ SINH', 'INTERACTIVE DOCS'), value: bi('/docs (Swagger OpenAPI)', '/docs (Swagger OpenAPI)'), tone: 'ok' },
              { label: bi('KIỂM THỬ ENDPOINT', 'IN-MEMORY TEST'), value: bi('FastAPI TestClient', 'FastAPI TestClient'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Cổng Pydantic chặn ngay JSON sai kiểu (price=-50 hoặc id="abc") và trả 422 chi tiết', 'Pydantic rejected invalid payloads with detailed HTTP 422 before hitting route logic') },
              { op: '+', text: bi('Tự động ép kiểu tham số đường dẫn và sinh trang thử nghiệm API tại /docs', 'Auto-validated path/body types and generated live OpenAPI documentation at /docs') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Sức mạnh của FastAPI + Pydantic: khi dữ liệu đã bước được vào bên trong thân hàm endpoint của bạn, bạn yên tâm 100% nó đã đúng kiểu và thỏa mọi điều kiện Field(ge=0)!', 'FastAPI + Pydantic superpower: once execution enters your endpoint body, inputs are 100% guaranteed to match your types and Field(ge=0) constraints!'),
            },
          },
          {
            telemetry: [
              { label: bi('HTTP CLIENT MỚI', 'MODERN CLIENT'), value: bi('httpx (Sync + Async)', 'httpx (Sync + Async)'), tone: 'ok' },
              { label: bi('API & AI BACKEND', 'TYPED API'), value: bi('FastAPI · Litestar', 'FastAPI · Litestar'), tone: 'ok' },
              { label: bi('TRỌN GÓI ORM+ADMIN', 'BATTERIES WEB'), value: bi('Django (+ Ninja / DRF)', 'Django (+ Ninja / DRF)'), tone: 'ok' },
              { label: bi('BÓC TÁCH HTML', 'WEB SCRAPING'), value: bi('BeautifulSoup · Playwright', 'BeautifulSoup · Playwright') },
            ],
            whatChanged: [
              { op: '+', text: bi('Định vị rõ từng mảnh ghép: httpx vs requests/aiohttp; FastAPI vs Django vs Flask', 'Mapped when to choose httpx vs requests/aiohttp and FastAPI vs Django vs Flask') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Chọn nhanh Web Framework Python: Xây REST API / Microservice / AI Backend → chọn FastAPI (hoặc Litestar); Xây hệ thống quản trị lớn cần sẵn ORM + Admin + Auth → chọn Django!', 'Framework rule of thumb: Building typed REST/AI microservices → choose FastAPI (or Litestar); Building full-featured apps needing built-in ORM + Admin + Auth → choose Django!'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('GỌI API AN TOÀN', 'SAFE CLIENT'), value: bi('httpx + params + timeout', 'httpx + params + timeout'), tone: 'ok' },
            { label: bi('BẮT LỖI HTTP', 'ERROR CHECK'), value: bi('resp.raise_for_status()', 'resp.raise_for_status()'), tone: 'ok' },
            { label: bi('BACKEND CHUẨN', 'API SERVER'), value: bi('FastAPI + Pydantic (422)', 'FastAPI + Pydantic (422)'), tone: 'ok' },
            { label: bi('BẢO MẬT KHÓA', 'SECRETS'), value: bi('os.environ (0 hardcode)', 'os.environ (0 hardcode)'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Nắm trọn quy trình giao tiếp HTTP hai chiều an toàn, dễ kiểm thử và chuẩn Production', 'Mastered end-to-end production HTTP clients, testable DI layers, and FastAPI backends') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Bộ 4 quy tắc vàng M21: (1) Luôn đặt timeout= · (2) Luôn gọi raise_for_status() · (3) Tiêm client để unit test offline · (4) Xác thực cổng vào bằng Pydantic BaseModel!', 'M21 Golden Quartet: (1) Always pass timeout= · (2) Always call raise_for_status() · (3) Inject transport for offline tests · (4) Validate inputs with Pydantic!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'cli', shape: 'laptop', tone: 'neutral', x: -265, y: 0, label: bi('httpx (timeout=5s)', 'httpx (timeout=5s)'), highlighted: s <= 1 },
            { id: 'pyd', shape: 'gate', tone: badPayload ? 'rose' : 'purple', x: -65, y: 0, label: bi('Pydantic Schema', 'Pydantic Schema'), sublabel: badPayload ? bi('422 Rejected!', '422 Rejected!') : bi('ép kiểu & kiểm dữ liệu', 'parse & validate'), highlighted: badPayload },
            { id: 'api', shape: 'hex', tone: 'green', x: 115, y: 0, label: bi('FastAPI / Django', 'FastAPI / Django'), sublabel: bi('@app.post("/courses")', '@app.post("/courses")'), icon: 'globe', dimmed: badPayload, highlighted: s === 4 },
            { id: 'db', shape: 'cylinder', tone: 'blue', x: 270, y: 0, label: bi('Pure Service & Store', 'Pure Service & Store'), sublabel: bi('DI offline testable', 'DI offline testable'), icon: 'db', dimmed: badPayload, highlighted: s === 2 },
          ],
          links: [
            { id: 'l1', from: 'cli', to: 'pyd', style: badPayload ? 'danger' : 'solid', label: bi('POST JSON', 'POST JSON') },
            { id: 'l2', from: 'pyd', to: 'api', style: badPayload ? 'off' : 'solid', label: bi('CourseCreate', 'CourseCreate') },
            { id: 'l3', from: 'api', to: 'db', style: badPayload ? 'off' : 'solid', label: bi('save & 201', 'save & 201') },
          ],
          packets: badPayload
            ? [{ id: 'p1', linkId: 'l1', kind: 'error', speed: 0.46 }]
            : [
                { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.48 },
                { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.48, offset: 0.33 },
                { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.48, offset: 0.66 },
              ],
        },
      };
    },
  },

  M22: {
    id: 'M22',
    titleEn: 'Asyncio & Event Loop, Threading (GIL) & Multiprocessing',
    subtitleEn: 'Build crystal-clear concurrency intuition from scratch: I/O-bound vs CPU-bound, the asyncio Event Loop, CPython’s GIL, and multi-core ProcessPools.',
    durationMin: 16,
    difficulty: 'Advanced',
    objectives: [
      bi('Hiểu cách Python chạy đồng bộ 1 luồng mặc định và phân biệt rõ I/O-bound (chờ mạng/DB) vs CPU-bound (tính toán 100%)', 'Contrast default single-threaded sync execution and distinguish I/O-bound wait from CPU-bound crunching'),
      bi('Thấu suốt cách Event Loop & await điều phối hàng trăm tác vụ I/O trên 1 luồng (gather, Semaphore, timeout)', 'Understand how the asyncio Event Loop & await multiplex hundreds of I/O tasks on 1 thread'),
      bi('Nắm vững cảnh báo sống còn: tuyệt đối không gọi hàm Blocking (time.sleep, requests.get) bên trong async def', 'Never freeze the Event Loop with sync blocking calls (time.sleep, requests.get) inside async def'),
      bi('Hiểu rõ khóa GIL (ThreadPool cho sync I/O vs ProcessPool vượt GIL cho CPU nặng) và hệ sinh thái uvloop/Celery', 'Master CPython’s GIL, ThreadPool vs ProcessPool, and the uvloop / AnyIO / Celery ecosystem'),
    ],
    buildFrame: (s, total) => {
      const blocked = s === 2;
      const gilStep = s === 3;
      const cpuMulti = s === 4;
      const isFinalRecap = total > 1 && s >= total - 1;

      const beat = pickStepBeat(
        s,
        total,
        [
          // Step 0: Gentle foundation — single-threaded sync vs I/O-bound & CPU-bound
          {
            telemetry: [
              { label: bi('MẶC ĐỊNH PYTHON', 'PYTHON DEFAULT'), value: bi('Đồng bộ · 1 luồng tuần tự', 'Sync · 1 single thread'), tone: 'warn' },
              { label: bi('TÁC VỤ I/O-BOUND', 'I/O-BOUND TASK'), value: bi('Chờ mạng/DB (CPU rảnh 99%)', 'Network/DB wait (99% idle)'), tone: 'ok' },
              { label: bi('TÁC VỤ CPU-BOUND', 'CPU-BOUND TASK'), value: bi('Tính toán đặc 100% CPU', '100% continuous CPU math'), tone: 'warn' },
              { label: bi('50 API TUẦN TỰ', '50 SYNC CALLS'), value: bi('50 × 1s = 50 giây đứng đợi!', '50 × 1s = 50s idle wait!'), tone: 'bad' },
            ],
            whatChanged: [
              { op: '+', text: bi('Khởi đầu từ gốc: mặc định Python chạy từng dòng tuần tự trên 1 luồng duy nhất', 'Started from first principles: normal Python executes line-by-line on a single thread') },
              { op: '+', text: bi('Phân biệt rạch ròi nghẽn chờ thiết bị ngoài (I/O-bound) và nghẽn tính toán số học (CPU-bound)', 'Separated external wait bottlenecks (I/O-bound) from heavy computation bottlenecks (CPU-bound)') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Trước khi viết bất kỳ dòng code tăng tốc nào, hãy hỏi đúng 1 câu: "Chương trình chậm vì đang ĐỨNG ĐỢI mạng/ổ đĩa (I/O-bound), hay vì nhân CPU đang TÍNH TOÁN HẾT CÔNG SUẤT 100% (CPU-bound)?"', 'Before optimizing anything, ask one question: "Is my code slow because it is WAITING idly on network/disk (I/O-bound), or crunching math at 100% CPU (CPU-bound)?"'),
            },
          },
          // Step 1: asyncio Event Loop & await multiplexing I/O on 1 thread
          {
            telemetry: [
              { label: bi('VÒNG LẶP SỰ KIỆN', 'EVENT LOOP'), value: bi('1 luồng điều phối hợp tác', '1 cooperative thread'), tone: 'ok' },
              { label: bi('ĐIỂM NHƯỜNG QUYỀN', 'YIELD POINT'), value: bi('await (Non-blocking I/O)', 'await (Non-blocking I/O)'), tone: 'ok' },
              { label: bi('GOM ĐỒNG THỜI', 'CONCURRENT FAN-OUT'), value: bi('asyncio.gather() · 30s → 3s!', 'asyncio.gather() · 30s → 3s!'), tone: 'ok' },
              { label: bi('VAN GIỚI HẠN TẢI', 'CONCURRENCY CAP'), value: bi('asyncio.Semaphore(10)', 'asyncio.Semaphore(10)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Khởi động Event Loop bằng asyncio.run(main()) và nhường luồng tại mỗi điểm await', 'Started the Event Loop via asyncio.run(main()) yielding control at non-blocking await points') },
              { op: '+', text: bi('Kết hợp asyncio.gather + Semaphore(10) + asyncio.timeout(5.0) chạy an toàn hàng chục kết nối', 'Combined asyncio.gather, Semaphore(10), and asyncio.timeout(5.0) for bounded concurrent I/O') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Hình ảnh người đầu bếp Event Loop: khi đặt nồi nước lên bếp (await mạng), đầu bếp không đứng nhìn nồi sôi mà quay sang chế biến cho 20 bàn khác ngay trên chính 1 luồng đó!', 'Event Loop chef mental model: while waiting for water to boil (awaiting network I/O), the single-threaded chef immediately preps 20 other orders instead of standing idle!'),
            },
          },
          // Step 2: Warning against blocking calls inside async def
          {
            telemetry: [
              { label: bi('TRẠNG THÁI LOOP', 'EVENT LOOP STATE'), value: bi('ĐÓNG BĂNG! (Dính Blocking!)', 'FROZEN! (Blocking call!)'), tone: 'bad' },
              { label: bi('THỦ PHẠM CẤM GỌI', 'FORBIDDEN CALLS'), value: bi('time.sleep() · requests.get()', 'time.sleep() · requests.get()'), tone: 'bad' },
              { label: bi('THAY THẾ ASYNC', 'ASYNC REPLACEMENT'), value: bi('asyncio.sleep · httpx.AsyncClient', 'asyncio.sleep · httpx.AsyncClient'), tone: 'ok' },
              { label: bi('CẦU NỐI HÀM CŨ', 'LEGACY SYNC BRIDGE'), value: bi('await asyncio.to_thread(fn)', 'await asyncio.to_thread(fn)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '~', text: bi('CẢNH BÁO ĐỎ: Gọi time.sleep(3) hay requests.get() trong async def làm tê liệt toàn bộ Event Loop!', 'CRITICAL BUG: Calling sync time.sleep(3) or requests.get() inside async def freezes every user on the loop!') },
              { op: '+', text: bi('Chuyển sang await asyncio.sleep(), httpx.AsyncClient hoặc đẩy sang luồng phụ bằng asyncio.to_thread()', 'Replaced blocking calls with non-blocking httpx.AsyncClient or offloaded via asyncio.to_thread()') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Vì Event Loop chỉ chạy trên 1 luồng duy nhất, một lệnh đồng bộ chặn như time.sleep(3) hay requests.get() bên trong async def sẽ trói cứng cả máy chủ suốt 3 giây! Luôn dùng thư viện async hoặc asyncio.to_thread().', 'Because the Event Loop runs on a single thread, one synchronous time.sleep(3) or requests.get() inside async def stalls ALL concurrent requests for 3 seconds!'),
            },
          },
          // Step 3: CPython GIL & ThreadPoolExecutor for sync I/O
          {
            telemetry: [
              { label: bi('KHÓA CPYTHON GIL', 'CPYTHON GIL'), value: bi('1 Thread chạy Bytecode / lúc', '1 Thread runs bytecode'), tone: 'warn' },
              { label: bi('KHI LUỒNG ĐỢI I/O', 'DURING OS I/O'), value: bi('Tự động NHẢ khóa GIL!', 'Releases GIL during I/O!'), tone: 'ok' },
              { label: bi('THREADPOOL CHO I/O', 'SYNC I/O SPEEDUP'), value: bi('Rất nhanh (requests/sqlite3)', 'Great for requests/sqlite3'), tone: 'ok' },
              { label: bi('THREADPOOL CHO CPU', 'PURE CPU LOOP'), value: bi('Không tăng tốc (nghẽn GIL)', 'No speedup (serialized by GIL)'), tone: 'bad' },
            ],
            whatChanged: [
              { op: '+', text: bi('Giải mã khóa GIL: CPython nhả GIL khi chờ mạng/ổ đĩa nên ThreadPoolExecutor tăng tốc tốt cho I/O đồng bộ', 'Explained why ThreadPoolExecutor accelerates legacy sync I/O because CPython releases the GIL on OS I/O waits') },
              { op: '+', text: bi('Cập nhật Python 3.13+ (PEP 703): bản thử nghiệm Free-threaded cho phép tắt GIL trong tương lai', 'Noted Python 3.13+ experimental free-threaded build alongside standard GIL behavior') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Sự thật dễ nhớ về GIL: khóa GIL chỉ giữ chặt khi chạy mã tính toán Python, còn khi luồng đứng chờ mạng (requests.get) hay đọc đĩa thì GIL được NHẢ RA ngay — nên ThreadPoolExecutor rất hợp cho code I/O đồng bộ cũ!', 'Simple truth about the GIL: CPython holds the GIL for bytecode execution, but RELEASES the GIL during network/disk waits — making ThreadPoolExecutor great for sync I/O!'),
            },
          },
          // Step 4: ProcessPoolExecutor bypassing GIL across CPU cores
          {
            telemetry: [
              { label: bi('MÔ HÌNH ĐA NHÂN', 'MULTI-CORE ENGINE'), value: bi('ProcessPoolExecutor', 'ProcessPoolExecutor'), tone: 'ok' },
              { label: bi('CƠ CHẾ VƯỢT GIL', 'GIL BYPASS'), value: bi('Mỗi tiến trình 1 GIL riêng!', 'Separate interpreter & GIL!'), tone: 'ok' },
              { label: bi('HIỆU SUẤT 8 NHÂN', '8-CORE CPU LOAD'), value: bi('Chạy song song thật 100%', 'True 100% parallel cores'), tone: 'ok' },
              { label: bi('CỔNG BẢO VỆ BẮT BUỘC', 'SPAWN GUARD'), value: bi('if __name__ == "__main__":', 'if __name__ == "__main__":'), tone: 'warn' },
            ],
            whatChanged: [
              { op: '+', text: bi('Khởi chạy nhiều tiến trình độc lập qua ProcessPoolExecutor để chạy song song thật trên mọi nhân CPU', 'Spawned separate OS processes via ProcessPoolExecutor achieving true multi-core CPU parallelism') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Khi dùng ProcessPoolExecutor / multiprocessing, BẮT BUỘC phải đặt đoạn khởi chạy bên dưới if __name__ == "__main__": để tránh tiến trình con nạp lại file gây đệ quy sinh tiến trình vô tận!', 'When using ProcessPoolExecutor, ALWAYS guard entry code under if __name__ == "__main__": so worker processes don’t recursively spawn infinite children on import!'),
            },
          },
          // Step 5: Python Concurrency Library Ecosystem Map
          {
            telemetry: [
              { label: bi('TĂNG TỐC LOOP 2-4X', 'FAST EVENT LOOP'), value: bi('uvloop (Uvicorn / FastAPI)', 'uvloop (Uvicorn / FastAPI)'), tone: 'ok' },
              { label: bi('ASYNC HTTP & STREAM', 'ASYNC CLIENTS'), value: bi('httpx · aiohttp · Tornado', 'httpx · aiohttp · Tornado'), tone: 'ok' },
              { label: bi('ĐỒNG THỜI CẤU TRÚC', 'STRUCTURED ASYNC'), value: bi('AnyIO · Trio', 'AnyIO · Trio'), tone: 'ok' },
              { label: bi('WORKER PHÂN TÁN', 'TASK QUEUES'), value: bi('Celery · Dramatiq · ARQ · joblib', 'Celery · Dramatiq · ARQ · joblib'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Mở rộng bản đồ thư viện công nghiệp: uvloop tăng tốc asyncio, AnyIO/Trio, joblib và hàng đợi nền Celery/ARQ', 'Mapped the full ecosystem: uvloop, httpx/aiohttp, AnyIO/Trio, joblib, and Celery/Dramatiq/ARQ workers') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Trên Linux/macOS, Uvicorn (chạy FastAPI) tự dùng uvloop viết trên nền libuv giúp Event Loop nhanh gấp 2–4 lần; còn các việc nặng kéo dài nhiều phút sẽ đẩy qua Redis sang cụm Celery / ARQ Worker!', 'On Linux/macOS, Uvicorn accelerates asyncio 2–4× with uvloop; multi-minute background jobs are offloaded via Redis to Celery, Dramatiq, or ARQ workers!'),
            },
          },
        ],
        // Final Step ONLY (s >= total - 1): The 5-Second Decision Rule!
        {
          telemetry: [
            { label: bi('I/O ĐỒNG THỜI LỚN', 'MASSIVE ASYNC I/O'), value: bi('asyncio + httpx / uvloop', 'asyncio + httpx / uvloop'), tone: 'ok' },
            { label: bi('I/O THƯ VIỆN SYNC CŨ', 'LEGACY SYNC I/O'), value: bi('ThreadPool / to_thread()', 'ThreadPool / to_thread()'), tone: 'ok' },
            { label: bi('TÍNH TOÁN NẶNG CPU', 'HEAVY CPU MATH'), value: bi('ProcessPool / joblib', 'ProcessPool / joblib'), tone: 'ok' },
            { label: bi('TÁC VỤ NỀN DÀI HẠN', 'BACKGROUND JOBS'), value: bi('Celery / Dramatiq / ARQ', 'Celery / Dramatiq / ARQ'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Đúc kết Quy tắc 5 giây chọn mô hình đồng thời & song song chuẩn xác từ gốc rễ đã học', 'Synthesized the 5-second concurrency decision rule grounded in Event Loop, GIL, and OS process mechanics') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Quy tắc 5 giây M22: Vài request nhỏ → gọi đồng bộ tuần tự; Hàng trăm I/O mạng → asyncio (gather + Semaphore) + httpx; Thư viện I/O đồng bộ cũ → ThreadPoolExecutor / to_thread(); Tính toán ngốn CPU → ProcessPoolExecutor / joblib!', '5-Second Decision Rule: Few simple calls → sync sequential; Hundreds of network I/Os → asyncio + httpx; Legacy sync I/O libs → ThreadPoolExecutor / to_thread(); Heavy CPU crunching → ProcessPoolExecutor / joblib!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'tasks', shape: 'crowd', tone: 'blue', x: -255, y: 0, label: bi('50 Tasks đồng thời', '50 Concurrent Tasks'), highlighted: s === 0 },
            { id: 'loop', shape: 'hex', tone: blocked ? 'rose' : 'green', x: -15, y: -70, label: bi('asyncio Event Loop', 'asyncio Event Loop'), sublabel: blocked ? bi('BỊ CHẶN CỨNG!', 'BLOCKED BY SYNC!') : bi('await nhường nhịp mượt', 'cooperative await'), icon: 'zap', loadPct: blocked ? 100 : 28, highlighted: s === 1 || blocked || s === 5 || isFinalRecap },
            { id: 'gil', shape: 'gate', tone: 'yellow', x: -15, y: 15, label: bi('Threads + GIL Lock', 'Threads + GIL Lock'), sublabel: bi('nhả GIL khi đợi sync I/O', 'releases GIL on sync I/O'), highlighted: gilStep || isFinalRecap },
            { id: 'mp', shape: 'hex', tone: 'purple', x: 225, y: 55, label: bi('ProcessPool (Multi-Core)', 'ProcessPool (Multi-Core)'), sublabel: bi('mỗi tiến trình 1 GIL riêng!', 'separate GIL per CPU!'), icon: 'cpu', loadPct: cpuMulti ? 95 : 15, highlighted: cpuMulti || isFinalRecap },
          ],
          links: [
            { id: 'l1', from: 'tasks', to: 'loop', style: blocked ? 'danger' : 'solid', label: blocked ? bi('time.sleep() chặn!', 'sync call blocks!') : bi('await I/O', 'await I/O') },
            { id: 'l2', from: 'tasks', to: 'gil', style: gilStep ? 'solid' : 'dashed', label: bi('ThreadPool / to_thread', 'ThreadPool / to_thread') },
            { id: 'l3', from: 'tasks', to: 'mp', style: cpuMulti ? 'solid' : 'dashed', label: bi('CPU-bound tasks', 'CPU-bound tasks') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: blocked ? 'error' : 'response', speed: 0.5 },
            { id: 'p2', linkId: gilStep ? 'l2' : 'l3', kind: 'mutation', speed: 0.48, offset: 0.4 },
          ],
        },
      };
    },
  },

  M23: {
    id: 'M23',
    titleEn: 'Clean 3-Layer Architecture, SQLite ACID & Python UI/DB Stack',
    subtitleEn: 'Decouple Presentation UI from a pure zero-I/O Domain Core and parameterized SQLite/SQLAlchemy persistence.',
    durationMin: 15,
    difficulty: 'Advanced',
    objectives: [
      bi('Hiểu vì sao trộn lẫn input/print/SQL trong 1 tệp làm hỏng khả năng kiểm thử và tái sử dụng', 'See why mixing input(), print(), and SQL in one script breaks testing and UI reuse'),
      bi('Thiết kế kiến trúc 3 lớp sạch: UI (CLI/GUI/Web) → Domain Core (0% I/O) → Storage Repository', 'Architect 3 clean layers: UI → Pure zero-I/O Domain Core → Storage Repository'),
      bi('Sử dụng sqlite3 chuẩn với tham số hóa (?) chống SQL Injection và khối giao dịch with conn: (ACID)', 'Query built-in sqlite3 safely with ? placeholders and atomic with conn: ACID transactions'),
      bi('Định hướng hệ sinh thái DB (SQLAlchemy/SQLModel/psycopg) và giao diện (Streamlit/Gradio/NiceGUI)', 'Navigate Python’s DB stack (SQLAlchemy/SQLModel/psycopg) and UI tools (Streamlit/Gradio/NiceGUI)'),
    ],
    buildFrame: (s, total) => {
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('CODE TRỘN 1 FILE', 'MONOLITH SCRIPT'), value: bi('input + tính + SQL lẫn lộn', 'Tangled input + math + SQL'), tone: 'bad' },
              { label: bi('CHẠY PYTEST', 'AUTOMATED TEST'), value: bi('Bị kẹt ở lệnh input()!', 'Blocked waiting on input()!'), tone: 'bad' },
              { label: bi('ĐỔI GIAO DIỆN', 'SWAP TO WEB/GUI'), value: bi('Phải viết lại từ đầu', 'Requires full rewrite'), tone: 'warn' },
              { label: bi('MỤC TIÊU', 'GOAL'), value: bi('Tách rời trách nhiệm', 'Separation of Concerns'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Chỉ rõ điểm nghẽn khi đặt input() và print() nằm ngay giữa công thức nghiệp vụ', 'Identified how interleaving console I/O inside domain calculations prevents automated testing') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Dấu hiệu dễ nhận biết nhất của code khó bảo trì: muốn viết 1 bài test kiểm tra công thức tính thuế mà chương trình lại bắt gõ bàn phím input() hoặc đòi kết nối ổ đĩa thật!', 'Tell-tale sign of tangled architecture: trying to unit-test a tax formula forces keyboard input() prompts or touches a real disk file!'),
            },
          },
          {
            telemetry: [
              { label: bi('CHIỀU PHỤ THUỘC', 'DEPENDENCY FLOW'), value: bi('UI → Core ← Storage', 'UI → Core ← Storage'), tone: 'ok' },
              { label: bi('TẦNG CORE.PY', 'DOMAIN CORE'), value: bi('0% I/O · Không biết UI!', '0% I/O · UI-agnostic!'), tone: 'ok' },
              { label: bi('TỐC ĐỘ TEST CORE', 'CORE TEST SPEED'), value: bi('200 tests < 10 ms!', '200 tests < 10 ms!'), tone: 'ok' },
              { label: bi('HOÁN ĐỔI VỎ UI', 'SWAPPABLE SHELL'), value: bi('CLI / FastAPI / GUI chung Core', 'CLI / FastAPI / GUI share Core'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Rút toàn bộ quy tắc tính toán & @dataclass sang core.py hoàn toàn không chứa lệnh I/O', 'Extracted pure dataclasses and business rules into core.py with zero I/O imports') },
              { op: '+', text: bi('Cho phép cắm cùng lúc giao diện CLI, Desktop hoặc Web lên chung một lõi core.py', 'Enabled pluggable CLI, Desktop, and FastAPI shells reusing 100% of core.py') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Quy tắc vàng của Kiến trúc sạch: core.py TUYỆT ĐỐI KHÔNG bao giờ import cli, tkinter hay fastapi! Lõi nghiệp vụ chỉ nhận dữ liệu sạch và trả kết quả hoặc raise lỗi miền.', 'Golden Clean-Architecture rule: core.py NEVER imports cli, tkinter, or fastapi! Domain logic accepts typed objects and returns values or raises domain errors.'),
            },
          },
          {
            telemetry: [
              { label: bi('CHỐNG SQL INJECTION', 'SQL SAFETY'), value: bi('Tham số hóa (?, ?)', 'Parameterized (?, ?)'), tone: 'ok' },
              { label: bi('GIAO DỊCH NGUYÊN TỬ', 'ACID TRANSACTION'), value: bi('with conn: (commit/rollback)', 'with conn: (commit/rollback)'), tone: 'ok' },
              { label: bi('ĐỌC THEO TÊN CỘT', 'DICT-LIKE ROWS'), value: bi('row_factory = sqlite3.Row', 'row_factory = sqlite3.Row'), tone: 'ok' },
              { label: bi('DB CHO PYTEST', 'IN-MEMORY TEST DB'), value: bi('sqlite3.connect(":memory:")', 'sqlite3.connect(":memory:")'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Cấm tuyệt đối ghép f-string vào câu lệnh SQL mở đường cho tấn công SQL Injection', 'Banned SQL f-string interpolation completely eliminating SQL Injection risk') },
              { op: '+', text: bi('Sử dụng dấu hỏi ? kèm tuple tham số và khối with conn: tự động commit / rollback', 'Adopted ? placeholders with tuple bindings inside atomic with conn: transactions') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Lưu ý tinh tế của sqlite3: khối with conn: tự động COMMIT khi thành công và ROLLBACK khi có lỗi, nhưng KHÔNG đóng kết nối (nhờ vậy bạn chạy tiếp được các giao dịch sau trên cùng conn)!', 'Subtle sqlite3 detail: with conn: automatically COMMITs on success or ROLLBACKs on error, without closing the connection so subsequent transactions can reuse it!'),
            },
          },
          {
            telemetry: [
              { label: bi('POSTGRES DRIVER', 'POSTGRES DRIVERS'), value: bi('psycopg (v3) · asyncpg', 'psycopg (v3) · asyncpg'), tone: 'ok' },
              { label: bi('ORM CHUẨN MỰC', 'MODERN ORM'), value: bi('SQLAlchemy 2.0 · SQLModel', 'SQLAlchemy 2.0 · SQLModel'), tone: 'ok' },
              { label: bi('NÂNG CẤP BẢNG', 'DB MIGRATIONS'), value: bi('Alembic', 'Alembic'), tone: 'ok' },
              { label: bi('PHÂN TÍCH OLAP', 'EMBEDDED OLAP'), value: bi('DuckDB (nhúng siêu tốc)', 'DuckDB (columnar OLAP)'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Định hướng lộ trình nâng cấp từ sqlite3 nhúng lên PostgreSQL + SQLAlchemy 2.0 / SQLModel + Alembic', 'Mapped scaling path from embedded sqlite3 to PostgreSQL with SQLAlchemy 2.0 / SQLModel + Alembic') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('sqlite3 cực kỳ xuất sắc cho ứng dụng cá nhân, CLI và dịch vụ vừa; khi nhiều máy chủ web ghi đồng thời cao qua mạng, hãy chuyển tầng Storage sang PostgreSQL + SQLAlchemy / SQLModel!', 'sqlite3 shines for local apps, CLIs, and single-node services; when multiple web servers write concurrently over the network, swap Storage to PostgreSQL + SQLAlchemy!'),
            },
          },
          {
            telemetry: [
              { label: bi('GUI CÓ SẴN', 'STDLIB GUI'), value: bi('tkinter + root.mainloop()', 'tkinter + root.mainloop()') },
              { label: bi('DASHBOARD DỮ LIỆU', 'DATA DASHBOARD'), value: bi('Streamlit', 'Streamlit'), tone: 'ok' },
              { label: bi('DEMO MÔ HÌNH AI', 'AI / ML DEMO UI'), value: bi('Gradio', 'Gradio'), tone: 'ok' },
              { label: bi('WEB / DESKTOP PYTHON', 'FULL PYTHON UI'), value: bi('NiceGUI · PySide6 · Textual', 'NiceGUI · PySide6 · Textual'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Khám phá hệ sinh thái giao diện nhanh gấp 10 lần tkinter: Streamlit, Gradio, NiceGUI và Textual', 'Mapped rapid Python UI frameworks: Streamlit dashboards, Gradio AI apps, NiceGUI, and Textual') },
            ],
            callout: {
              kind: 'good-to-know',
              text: bi('Nhờ đã tách sạch core.py ở Bước 2, bạn có thể dựng trang web tương tác bằng Streamlit hoặc Gradio gọi vào core.py chỉ trong 25 dòng code!', 'Because core.py is cleanly decoupled, you can wrap an interactive Streamlit dashboard or Gradio AI interface around it in 25 lines of Python!'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('KIẾN TRÚC 3 LỚP', 'ARCHITECTURE'), value: bi('UI → Core (0 I/O) → Storage', 'UI → Core (0 I/O) → Storage'), tone: 'ok' },
            { label: bi('AN TOÀN SQL', 'SQL SAFETY'), value: bi('? params + with conn:', '? params + with conn:'), tone: 'ok' },
            { label: bi('HỆ SINH THÁI DB', 'DB STACK'), value: bi('sqlite3 · SQLAlchemy · DuckDB', 'sqlite3 · SQLAlchemy · DuckDB'), tone: 'ok' },
            { label: bi('HỆ SINH THÁI UI', 'UI STACK'), value: bi('Typer · FastAPI · Streamlit', 'Typer · FastAPI · Streamlit'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Hoàn thành bản thiết kế dự án Python chuẩn công nghiệp sẵn sàng kiểm thử và mở rộng', 'Completed production-ready 3-layer project blueprint with full self-review checklist') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Checklist xuất xưởng M23: Tách rõ core / storage / ui · SQL 100% dùng dấu ? · Mở tệp UTF-8 bằng with · Khóa bí mật qua os.environ · Bộ test pytest chạy xanh dưới 1 giây!', 'M23 Ship Checklist: Clean core/storage/ui split · 100% ? parameterized SQL · UTF-8 with open · Secrets in os.environ · Sub-second green pytest suite!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          zones: [
            { id: 'z1', x: -245, y: 0, w: 180, h: 270, label: bi('Tầng Giao diện (UI)', 'Presentation Layer'), tone: 'blue' },
            { id: 'z2', x: 0, y: 0, w: 210, h: 270, label: bi('Tầng Nghiệp vụ (Core)', 'Pure Domain Core'), tone: 'green' },
            { id: 'z3', x: 245, y: 0, w: 195, h: 270, label: bi('Tầng Lưu trữ (Storage)', 'Persistence Layer'), tone: 'purple' },
          ],
          nodes: [
            { id: 'cli', shape: 'laptop', tone: 'blue', x: -245, y: -45, label: bi('CLI / Streamlit / Web', 'CLI / Streamlit / Web'), highlighted: s === 0 || s === 4 },
            { id: 'core', shape: 'hex', tone: 'green', x: 0, y: 0, label: bi('Domain Service', 'Domain Service'), sublabel: bi('pure dataclasses · 0 I/O', 'pure dataclasses · 0 I/O'), icon: 'sparkles', highlighted: s === 1 },
            { id: 'sql', shape: 'cylinder', tone: 'purple', x: 245, y: 0, label: bi('SQLite / SQLAlchemy', 'SQLite / SQLAlchemy'), sublabel: bi('with conn: · ? params', 'with conn: · ? params'), icon: 'db', badge: { text: bi('chống SQLi + ACID', 'SQLi-proof + ACID'), tone: 'ok' }, highlighted: s === 2 || s === 3 },
          ],
          links: [
            { id: 'l1', from: 'cli', to: 'core', label: bi('typed DTO', 'typed DTO') },
            { id: 'l2', from: 'core', to: 'sql', label: bi('repo.save(item)', 'repo.save(item)') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.45 },
          ],
        },
      };
    },
  },

  M24: {
    id: 'M24',
    titleEn: 'Defensive Security: Code Auditing, Salted KDFs & Rate Limiting',
    subtitleEn: 'Audit untrusted scripts for red flags, replace fast hashes with salted scrypt/Argon2id, prevent timing leaks, and throttle brute-force.',
    durationMin: 15,
    difficulty: 'Advanced',
    objectives: [
      bi('Rèn tư duy Kỹ sư Phòng thủ (Blue Team) và phát hiện ngay 5 cờ đỏ nguy hiểm trong mã nguồn lạ', 'Adopt a Blue-Team defensive mindset and spot 5 critical red flags in unfamiliar scripts'),
      bi('Hiểu toán học không gian c**n và lý do MD5 / SHA-256 trần sụp đổ hoàn toàn trước GPU & Rainbow Table', 'Understand exponential c**n keyspaces and why unsalted MD5/SHA-256 fail against GPUs'),
      bi('Lưu mật khẩu chuẩn công nghiệp với secrets.token_bytes salt + hàm băm chậm scrypt / Argon2id', 'Hash passwords securely using unique secrets.token_bytes salts + slow scrypt / Argon2id KDFs'),
      bi('Chống Timing Attack bằng hmac.compare_digest, chặn Brute-force bằng cửa sổ trượt và quét lỗi với Bandit', 'Use constant-time hmac.compare_digest, sliding-window rate limiters, and Bandit/pip-audit'),
    ],
    buildFrame: (s, total) => {
      const defended = s >= 3;
      const beat = pickStepBeat(
        s,
        total,
        [
          {
            telemetry: [
              { label: bi('TƯ THẾ KỸ SƯ', 'POSTURE'), value: bi('100% Phòng thủ (Blue Team)', '100% Defensive (Blue Team)'), tone: 'ok' },
              { label: bi('MỤC ĐÍCH ĐỌC MÃ', 'AUDIT GOAL'), value: bi('Hiểu để khóa chặt lỗ hổng', 'Understand to harden apps'), tone: 'ok' },
              { label: bi('MẪU TẤN CÔNG CŨ', 'COMMON THREATS'), value: bi('Brute-force · Stuffing · Bot', 'Brute-force · Stuffing · Bot'), tone: 'warn' },
              { label: bi('NGUYÊN TẮC PHÁP LÝ', 'ETHICS RULE'), value: bi('Chỉ kiểm thử hệ thống sở hữu', 'Authorized systems only'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Thiết lập lăng kính Kiểm toán bảo mật (Blue Team): phân tích kịch bản rủi ro để xây rào chắn', 'Framed threat analysis strictly through defensive Blue-Team engineering') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Người kỹ sư giỏi nghiên cứu các kịch bản dò mật khẩu hay tiêm nhiễm lệnh không phải để đi phá hoại, mà để biết chính xác kẻ tấn công nhắm vào đâu nhằm khóa chặt ngay từ khâu thiết kế!', 'Great engineers study brute-force and injection patterns so they can design systems where those attacks fail by construction!'),
            },
          },
          {
            telemetry: [
              { label: bi('CỜ ĐỎ SỐ 1', 'RED FLAG #1'), value: bi('subprocess(..., shell=True)', 'subprocess(..., shell=True)'), tone: 'bad' },
              { label: bi('CỜ ĐỎ SỐ 2', 'RED FLAG #2'), value: bi('eval() / exec(base64...)', 'eval() / exec(base64...)'), tone: 'bad' },
              { label: bi('CỜ ĐỎ SỐ 3', 'RED FLAG #3'), value: bi('pickle.loads(untrusted)', 'pickle.loads(untrusted)'), tone: 'bad' },
              { label: bi('THAY THẾ AN TOÀN', 'SAFE ALTERNATIVE'), value: bi('Danh sách argv + json.loads', 'List argv + json.loads'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Trang bị bộ radar 5 dấu hiệu nhận diện Command Injection, RCE giải tuần tự hóa và đánh cắp khóa', 'Built a 5-point code-review radar catching Command Injection, pickle RCE, and secret exfiltration') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('Không bao giờ gọi pickle.loads() trên dữ liệu nhận từ mạng bên ngoài (pickle cho phép thực thi lệnh hệ thống tùy ý ngay lúc giải mã!) và luôn truyền list đối số vào subprocess.run([...], shell=False).', 'Never call pickle.loads() on untrusted network bytes (it allows arbitrary code execution!) and always pass argument lists to subprocess.run([...], shell=False).'),
            },
          },
          {
            telemetry: [
              { label: bi('KHÔNG GIAN TỔ HỢP', 'KEYSPACE MATH'), value: bi('c ** n (Độ dài quyết định!)', 'c ** n (Length wins!)'), tone: 'ok' },
              { label: bi('BĂM SHA-256 TRẦN', 'RAW SHA-256'), value: bi('Hàng chục tỷ lần thử/giây!', 'Billions of GPU hashes/s!'), tone: 'bad' },
              { label: bi('KHÔNG CÓ SALT', 'MISSING SALT'), value: bi('Lộ ngay qua Rainbow Table!', 'Vulnerable to Rainbow Tables!'), tone: 'bad' },
              { label: bi('YÊU CẦU KDF', 'PASSWORD KDF'), value: bi('Phải chậm & tốn RAM + Salt', 'Slow & memory-hard + Salt'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '-', text: bi('Bác bỏ hoàn toàn thói quen sai lầm dùng MD5 / SHA-1 / SHA-256 trần để băm mật khẩu', 'Rejected fast general-purpose hashes (MD5 / SHA-256) for password storage') },
            ],
            callout: {
              kind: 'watch-out',
              text: bi('SHA-256 sinh ra để kiểm tra tệp tải về nên chạy CỰC NHANH — điều đó lại là thảm họa cho mật khẩu vì GPU thử được hàng chục tỷ mật khẩu mỗi giây! Mật khẩu bắt buộc dùng hàm băm cố tình CHẬM.', 'SHA-256 is designed to be blazingly FAST — which makes it disastrous for passwords because GPUs test billions per second! Passwords require deliberately SLOW memory-hard KDFs.'),
            },
          },
          {
            telemetry: [
              { label: bi('SINH MUỐI MẬT MÃ', 'CRYPTO SALT'), value: bi('secrets.token_bytes(16)', 'secrets.token_bytes(16)'), tone: 'ok' },
              { label: bi('HÀM BĂM KDF CHUẨN', 'MEMORY-HARD KDF'), value: bi('hashlib.scrypt / Argon2id', 'hashlib.scrypt / Argon2id'), tone: 'ok' },
              { label: bi('CHỐNG RAINBOW TABLE', 'RAINBOW IMMUNE'), value: bi('Mỗi user 1 mã băm độc nhất', 'Unique hash per user'), tone: 'ok' },
              { label: bi('CẤM DÙNG CHO TOKEN', 'NEVER FOR TOKENS'), value: bi('random (dự đoán được!)', 'random (predictable!)'), tone: 'bad' },
            ],
            whatChanged: [
              { op: '+', text: bi('Nâng cấp lưu trữ mật khẩu sang hashlib.scrypt kèm 16 bytes muối ngẫu nhiên từ mô-đun secrets', 'Upgraded password storage to memory-hard hashlib.scrypt with 16-byte cryptographic salts') },
            ],
            callout: {
              kind: 'key-idea',
              text: bi('Hai người dùng đặt cùng mật khẩu "ilovepython" nhưng nhờ mỗi người có 16 bytes Salt ngẫu nhiên riêng biệt, chuỗi băm lưu trong Database của họ hoàn toàn khác nhau 100%!', 'Even if two users pick the exact same password, unique 16-byte random salts produce 100% different stored hashes — defeating precomputed Rainbow Tables completely!'),
            },
          },
          {
            telemetry: [
              { label: bi('SO SÁNH HẰNG SỐ', 'TIMING DEFENSE'), value: bi('hmac.compare_digest(a, b)', 'hmac.compare_digest(a, b)'), tone: 'ok' },
              { label: bi('CỬA SỔ TRƯỢT', 'SLIDING WINDOW'), value: bi('deque chặn > 5 lần sai / 60s', 'deque caps 5 fails / 60s'), tone: 'ok' },
              { label: bi('THƯ VIỆN KHUYÊN DÙNG', 'MODERN AUTH LIBS'), value: bi('argon2-cffi · pwdlib · secrets', 'argon2-cffi · pwdlib · secrets'), tone: 'ok' },
              { label: bi('QUÉT LỖ HỔNG CI', 'SECURITY SCANNERS'), value: bi('Bandit · Ruff S · pip-audit', 'Bandit · Ruff S · pip-audit'), tone: 'ok' },
            ],
            whatChanged: [
              { op: '+', text: bi('Đối chiếu mã băm bằng hmac.compare_digest chống rò rỉ thời gian và dựng cổng Rate Limiter bằng deque', 'Added constant-time hmac.compare_digest verification and a deque sliding-window Rate Limiter') },
              { op: '+', text: bi('Tích hợp hệ sinh thái bảo mật thực chiến: argon2-cffi, cryptography, Bandit và pip-audit', 'Mapped Python’s security toolkit: argon2-cffi/pwdlib, cryptography, Bandit, and pip-audit') },
            ],
            callout: {
              kind: 'technique',
              text: bi('Đặt cổng Sliding-Window Rate Limiter ngay TRƯỚC bước băm mật khẩu: khi bot bắn 5.000 request/phút, yêu cầu thứ 6 bị chặn tức thì trong O(1) mà không làm CPU tốn sức chạy scrypt/Argon2!', 'Place your Sliding-Window Rate Limiter BEFORE password hashing so brute-force floods are rejected in O(1) without burning CPU on scrypt/Argon2!'),
            },
          },
        ],
        {
          telemetry: [
            { label: bi('SINH TOKEN & SALT', 'CSPRNG'), value: bi('Mô-đun secrets (Stdlib)', 'stdlib secrets module'), tone: 'ok' },
            { label: bi('BĂM MẬT KHẨU', 'PASSWORD KDF'), value: bi('Argon2id / scrypt + Salt', 'Argon2id / scrypt + Salt'), tone: 'ok' },
            { label: bi('ĐỐI CHIẾU AN TOÀN', 'CONSTANT-TIME'), value: bi('hmac.compare_digest()', 'hmac.compare_digest()'), tone: 'ok' },
            { label: bi('LÁ CHẮN ĐA TẦNG', 'DEFENSE IN DEPTH'), value: bi('Rate Limit + 2FA + Bandit', 'Rate Limit + 2FA + Bandit'), tone: 'ok' },
          ],
          whatChanged: [
            { op: '+', text: bi('Hoàn thiện tư duy Phòng thủ chiều sâu (Defense in Depth) khép lại trọn vẹn lộ trình Python Mastery', 'Completed Defense-in-Depth security posture capping the Python Mastery curriculum') },
          ],
          callout: {
            kind: 'key-idea',
            text: bi('Lưới an toàn M24: Không shell=True / eval / pickle dữ liệu lạ · Sinh khóa bằng secrets · Băm mật khẩu bằng Argon2id/scrypt + Salt · So sánh bằng compare_digest · Chặn bot bằng Rate Limit + 2FA!', 'M24 Security Shield: No untrusted shell=True/eval/pickle · Generate tokens via secrets · Hash passwords via Argon2id/scrypt + Salt · Verify via compare_digest · Throttle with Rate Limits + 2FA!'),
          },
        }
      );

      return {
        ...beat,
        scene: {
          nodes: [
            { id: 'bot', shape: 'crowd', tone: 'rose', x: -255, y: 0, label: bi('Untrusted Input / Bot', 'Untrusted Input / Bot'), highlighted: s <= 2 },
            { id: 'rl', shape: 'gate', tone: defended ? 'green' : 'orange', x: -55, y: 0, label: bi('Rate Limit + Audit Gate', 'Rate Limit + Audit Gate'), sublabel: bi('max 5 lần / 60s · no shell=True', 'max 5 / 60s · no shell=True'), highlighted: s === 1 || s === 4 },
            { id: 'kdf', shape: 'hex', tone: 'blue', x: 135, y: -50, label: bi('scrypt / Argon2id', 'scrypt / Argon2id'), sublabel: bi('16B secrets salt + compare_digest', '16B salt + compare_digest'), icon: 'shield', highlighted: s === 3 || s === 4 },
            { id: 'vault', shape: 'cylinder', tone: 'green', x: 265, y: 50, label: bi('Auth Store + Bandit CI', 'Auth Store + Bandit CI'), sublabel: bi('an toàn trước GPU & Rainbow', 'GPU & Rainbow-table resilient'), icon: 'db', highlighted: s >= 5 },
          ],
          links: [
            { id: 'l1', from: 'bot', to: 'rl', style: 'danger', label: bi('5,000 POST /login', '5,000 POST /login') },
            { id: 'l2', from: 'rl', to: 'kdf', style: defended ? 'solid' : 'dashed', label: bi('hợp lệ mới đi tiếp', 'allowed traffic only') },
            { id: 'l3', from: 'kdf', to: 'vault', label: bi('constant-time verify', 'constant-time verify') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'error', speed: 0.55 },
            { id: 'p2', linkId: 'l2', kind: 'request', speed: 0.42, offset: 0.4 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.42, offset: 0.7 },
          ],
        },
      };
    },
  },
};

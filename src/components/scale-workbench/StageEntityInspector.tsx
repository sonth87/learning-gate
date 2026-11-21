import React from 'react';
import { BookOpen, Cpu, HelpCircle, Lightbulb, Sparkles, X } from 'lucide-react';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import { EXTRA_ENTITY_KNOWLEDGE } from './entityKnowledgeExtra';
import { pickText, type BilingualText, type StageInspectorInfo } from './types';

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

/**
 * Curated knowledge base for technical entities, connectors & tags across Python, Redis, K8s, CI/CD & PMP
 * so hovering/clicking ANY block, line, or pill tag gives clear What / How / Why / Tips & Case Study!
 */
const ENTITY_KNOWLEDGE: Array<{
  match: RegExp;
  info: StageInspectorInfo;
}> = [
  {
    match: /event loop|asyncio\.gather/i,
    info: {
      title: bi('asyncio Event Loop (Vòng lặp sự kiện)', 'asyncio Event Loop'),
      kindLabel: bi('Bộ điều phối bất đồng bộ', 'Async Scheduler'),
      what: bi(
        'Một vòng lặp chạy trên 1 Thread duy nhất, quản lý và luân chuyển hàng trăm tác vụ I/O (Coroutine) đang chờ mạng hoặc đĩa.',
        'A single-threaded scheduler that multiplexes hundreds of concurrent I/O coroutines.'
      ),
      how: bi(
        'Khi một Coroutine gặp từ khóa await (ví dụ chờ phản hồi HTTP), nó tạm dừng và trả quyền điều khiển về Event Loop để chạy ngay Coroutine khác đang sẵn sàng.',
        'Whenever a coroutine hits await on network/disk I/O, it suspends and yields control back so other ready tasks run immediately.'
      ),
      why: bi(
        'Giúp xử lý hàng nghìn kết nối mạng đồng thời chỉ với vài MB RAM mà không tốn chi phí tạo hàng nghìn OS Thread.',
        'Handles thousands of concurrent network connections with minimal memory and zero OS thread-switching overhead.'
      ),
      tipOrCase: bi(
        'Case Study thực tế: Tuyệt đối không gọi time.sleep() hay requests.get() đồng bộ bên trong async def — chỉ 1 lời gọi đồng bộ 3 giây sẽ khóa cứng toàn bộ Event Loop khiến mọi người dùng khác bị treo theo! Hãy dùng await asyncio.sleep() hoặc httpx.AsyncClient.',
        'Production Pitfall: Never call blocking time.sleep() or requests.get() inside async def — it freezes the entire Event Loop for all concurrent requests! Use await asyncio.sleep() or httpx.AsyncClient.'
      ),
    },
  },
  {
    match: /threadpool|gil|to_thread/i,
    info: {
      title: bi('ThreadPool & Khóa GIL (Global Interpreter Lock)', 'ThreadPool & CPython GIL'),
      kindLabel: bi('Đa luồng I/O đồng bộ', 'OS Thread Pool'),
      what: bi(
        'Nhóm các luồng hệ điều hành (OS Threads) chia sẻ chung vùng nhớ tiến trình nhưng chịu sự kiểm soát của khóa GIL trong CPython.',
        'Pool of OS threads sharing process memory, governed by CPython’s Global Interpreter Lock (GIL).'
      ),
      how: bi(
        'Tại một thời điểm chỉ có 1 Thread giữ GIL để thực thi Bytecode Python. Tuy nhiên, khi Thread chờ đọc/ghi file hoặc mạng (Blocking I/O), CPython tự động nhả GIL cho Thread khác chạy.',
        'Only one thread executes Python bytecode at a time, but CPython releases the GIL during C-level blocking I/O syscalls.'
      ),
      why: bi(
        'GIL giúp quản lý bộ nhớ đếm tham chiếu (Reference Counting) của CPython đơn giản, an toàn và rất nhanh cho chương trình đơn luồng.',
        'Simplifies CPython reference-counting memory safety while still allowing parallel waiting on blocking I/O libraries.'
      ),
      tipOrCase: bi(
        'Mẹo chọn nhanh: Dùng ThreadPoolExecutor hoặc asyncio.to_thread() khi bắt buộc phải gọi thư viện cũ đồng bộ (như boto3, sqlite3, requests). Đừng dùng Thread để tăng tốc vòng lặp tính toán nặng CPU!',
        'Tip: Use asyncio.to_thread() or ThreadPoolExecutor to wrap legacy blocking I/O libraries without stalling your app, never for heavy pure-Python math.'
      ),
    },
  },
  {
    match: /processpool|đa nhân|cpu/i,
    info: {
      title: bi('ProcessPoolExecutor (Đa tiến trình song song)', 'ProcessPoolExecutor (Multi-Core)'),
      kindLabel: bi('Xử lý nặng CPU', 'CPU Parallelism'),
      what: bi(
        'Cơ chế khởi tạo nhiều tiến trình Python độc lập, mỗi tiến trình sở hữu trình thông dịch và khóa GIL riêng trên từng nhân CPU vật lý.',
        'Spawns separate OS processes, each with its own Python interpreter and independent GIL on dedicated CPU cores.'
      ),
      how: bi(
        'Dữ liệu đầu vào được tuần tự hóa (pickle) gửi qua IPC tới các tiến trình con tính toán thực sự song song 100%, rồi gom kết quả trả về.',
        'Serializes inputs across process boundaries so N CPU cores crunch tasks truly in parallel.'
      ),
      why: bi(
        'Là cách chuẩn mực trong Python tiêu chuẩn để vượt qua rào cản GIL đối với các bài toán nén ảnh, xử lý dữ liệu lớn, mật mã học hoặc tính toán số.',
        'Bypasses the single-process GIL to utilize 100% of multi-core hardware on CPU-bound workloads.'
      ),
      tipOrCase: bi(
        'Lưu ý: Vì truyền dữ liệu giữa các Process tốn chi phí sao chép (pickle), chỉ đưa các tác vụ tính toán đủ lớn sang ProcessPool thay vì hàng triệu hàm siêu nhỏ.',
        'Tip: IPC pickling has overhead — batch coarse-grained chunks of work rather than sending millions of tiny integers.'
      ),
    },
  },
  {
    match: /50 i\/o|task|crowd|bot/i,
    info: {
      title: bi(' Tập hợp Tác vụ / Luồng Yêu cầu Đồng thời', 'Concurrent Workload / Traffic'),
      kindLabel: bi('Nguồn tải đầu vào', 'Workload Source'),
      what: bi(
        'Đại diện cho hàng chục hoặc hàng nghìn yêu cầu (HTTP requests, truy vấn DB, kết nối client) phát sinh cùng một lúc.',
        'Represents dozens or thousands of simultaneous incoming tasks, API calls, or client requests.'
      ),
      how: bi(
        'Nếu xử lý tuần tự từng yêu cầu 100ms, 50 tác vụ sẽ mất 5 giây. Khi đưa vào mô hình đồng thời phù hợp, thời gian chờ mạng được chồng lấp lên nhau.',
        'Sequential execution adds latencies together; concurrent scheduling overlaps waiting time across all tasks.'
      ),
      why: bi(
        'Giúp đánh giá trực quan khả năng chịu tải (Throughput), độ trễ (Latency) và hành vi nghẽn cổ chai của hệ thống.',
        'Exposes throughput limits, head-of-line blocking, and rate-limiting behavior under realistic load.'
      ),
    },
  },
  {
    match: /bytecode|\.pyc/i,
    info: {
      title: bi('CPython Bytecode (.pyc)', 'CPython Bytecode (.pyc)'),
      kindLabel: bi('Mã trung gian', 'Intermediate Representation'),
      what: bi(
        'Tập lệnh nhị phân bậc thấp trung gian được CPython biên dịch tự động từ mã nguồn .py trước khi chạy.',
        'Compact stack-machine instructions compiled automatically from .py source code before execution.'
      ),
      how: bi(
        'Trình phân tích cú pháp kiểm tra thụt lề 4 dấu cách, dựng cây cú pháp AST rồi dịch sang Bytecode lưu đệm trong thư mục __pycache__.',
        'Python parses source into an AST, emits bytecode ops (LOAD_FAST, CALL), and caches them in __pycache__.'
      ),
      why: bi(
        'Giúp lần khởi động tiếp theo bỏ qua bước phân tích văn bản và bắt ngay lỗi cú pháp (SyntaxError / IndentationError) trước khi chạy dòng đầu tiên.',
        'Speeds up subsequent module loads and catches SyntaxError / IndentationError before any line executes.'
      ),
    },
  },
  {
    match: /cpython vm|pvm/i,
    info: {
      title: bi('CPython Virtual Machine (Máy ảo thực thi Python)', 'CPython Virtual Machine'),
      kindLabel: bi('Bộ máy thực thi lõi', 'Core Runtime'),
      what: bi(
        'Vòng lặp đánh giá trung tâm (Evaluation Loop viết bằng C) đọc từng chỉ thị Bytecode và thao tác trực tiếp trên các đối tượng bộ nhớ.',
        'The C-implemented stack evaluation loop that executes Python bytecode instructions.'
      ),
      how: bi(
        'Quản lý Call Stack cho các lời gọi hàm, cấp phát đối tượng trên vùng nhớ Heap và tự động thu hồi bộ nhớ qua Reference Counting + Garbage Collector.',
        'Manages call frames, allocates PyObjects on the private heap, and reclaims memory automatically.'
      ),
      why: bi(
        'Đóng vai trò lớp trừu tượng đa nền tảng giúp cùng một tệp .py chạy giống hệt nhau trên macOS, Linux và Windows.',
        'Abstracts OS/CPU differences so identical Python code runs portably across macOS, Linux, and Windows.'
      ),
    },
  },
  {
    match: /__main__|__name__|imported/i,
    info: {
      title: bi('Cổng kiểm tra if __name__ == "__main__":', 'Entrypoint Guard (__name__ == "__main__")'),
      kindLabel: bi('Điểm vào chương trình', 'Module Entrypoint'),
      what: bi(
        'Biến đặc biệt __name__ cho biết tệp hiện tại đang được chạy trực tiếp từ dòng lệnh hay đang được tệp khác import vào.',
        'Built-in variable indicating whether a file is executed directly as a script or imported as a library module.'
      ),
      how: bi(
        'Khi gõ uv run app.py, Python gán __name__ = "__main__". Khi tệp khác viết import app, __name__ mang tên module là "app".',
        'Direct execution sets __name__ == "__main__"; importing sets __name__ to the module’s package name.'
      ),
      why: bi(
        'Cho phép một tệp Python vừa chạy độc lập như công cụ CLI, vừa cho phép pytest hoặc module khác import hàm bên trong mà không vô tình kích hoạt code chạy thử.',
        'Lets pytest and other modules safely import your functions without triggering top-level script side effects.'
      ),
    },
  },
  {
    match: /pydantic|422/i,
    info: {
      title: bi('Cổng xác thực dữ liệu Pydantic', 'Pydantic Validation Gate'),
      kindLabel: bi('Kiểm định Schema đầu vào', 'Schema Validator'),
      what: bi(
        'Lớp kiểm tra và chuyển đổi kiểu dữ liệu đầu vào tự động dựa trên khai báo Type Hints (lõi viết bằng Rust tốc độ cao).',
        'High-speed Rust-backed runtime schema validator driven by standard Python type annotations.'
      ),
      how: bi(
        'Đọc JSON từ HTTP request, kiểm tra từng trường bắt buộc/kiểu dữ liệu; nếu hợp lệ tạo đối tượng Python sạch, nếu sai trả ngay mã HTTP 422 kèm vị trí lỗi chi tiết.',
        'Parses incoming JSON into typed models or immediately rejects malformed payloads with structured HTTP 422 errors.'
      ),
      why: bi(
        'Chặn đứng dữ liệu bẩn ngay ở cửa biên API, giúp hàm nghiệp vụ bên trong không cần viết hàng chục câu if isinstance(...) thủ công.',
        'Stops malformed data at the system boundary, keeping core business functions clean and type-safe.'
      ),
    },
  },
  {
    match: /fastapi/i,
    info: {
      title: bi('FastAPI Application Router', 'FastAPI Endpoint Layer'),
      kindLabel: bi('Web Framework hiện đại', 'ASGI Web Framework'),
      what: bi(
        'Framework xây dựng HTTP/JSON API hiệu năng cao trên chuẩn ASGI của Python, tích hợp chặt với Pydantic và OpenAPI.',
        'Modern ASGI web framework combining async concurrency, dependency injection, and auto-generated OpenAPI docs.'
      ),
      how: bi(
        'Định tuyến đường dẫn (@app.get, @app.post), bơm phụ thuộc qua Depends() để dễ hoán đổi Database khi chạy test, và tự sinh trang /docs.',
        'Routes HTTP verbs, injects testable dependencies via Depends(), and serializes responses automatically.'
      ),
      why: bi(
        'Giúp xây dựng Backend chuẩn công nghiệp nhanh gọn, có tài liệu Swagger tự động luôn khớp 100% với code thực tế.',
        'Eliminates doc drift and boilerplate while delivering high async I/O throughput.'
      ),
    },
  },
  {
    match: /yield|generator|islice/i,
    info: {
      title: bi('Generator & Cơ chế Lazy Evaluation (yield)', 'Generator & Lazy Stream (yield)'),
      kindLabel: bi('Dòng dữ liệu theo nhu cầu', 'Pull-based Stream'),
      what: bi(
        'Hàm đặc biệt sản sinh dữ liệu từng phần tử một khi được yêu cầu (next()), thay vì tính và nhồi toàn bộ kết quả vào RAM cùng lúc.',
        'A resumable function that produces values one at a time on demand rather than allocating a whole list upfront.'
      ),
      how: bi(
        'Mỗi khi chạm lệnh yield, hàm trả giá trị ra ngoài và giữ nguyên toàn bộ biến cục bộ trên khung nhớ; lần gọi kế tiếp chạy tiếp ngay dòng sau yield.',
        'Suspends execution frame at yield, preserving local variables, and resumes right where it left off on the next pull.'
      ),
      why: bi(
        'Cho phép đọc và lọc tệp log 10 GB hoặc luồng dữ liệu vô tận với mức tiêu thụ RAM cố định chỉ vài chục KB (O(1) Memory).',
        'Processes multi-gigabyte files or infinite streams in constant O(1) memory.'
      ),
      tipOrCase: bi(
        'Cạm bẫy cần nhớ: Generator chỉ duyệt qua được ĐÚNG MỘT LẦN! Sau khi đã duyệt hết, vòng lặp thứ hai trên cùng biến generator sẽ nhận kết quả rỗng.',
        'Gotcha: A generator iterator is single-use! Iterating over it a second time yields nothing unless you call the generator function again.'
      ),
    },
  },
  {
    match: /rate limit|scrypt|audit/i,
    info: {
      title: bi('Lớp Phòng Thủ Xác Thực (Rate Limit & Salted KDF)', 'Defensive Auth Layer (Rate Limit & KDF)'),
      kindLabel: bi('Bảo mật ứng dụng', 'Security Control'),
      what: bi(
        'Tổ hợp giới hạn tần suất yêu cầu (Rate Limiting) và hàm dẫn xuất khóa chậm có muối ngẫu nhiên (scrypt / Argon2 / PBKDF2).',
        'Layered defense combining sliding-window request throttling with memory-hard salted password hashing.'
      ),
      how: bi(
        'Chặn các IP/tài khoản thử mật khẩu sai quá ngưỡng trong 60 giây, đồng thời cộng chuỗi Salt ngẫu nhiên riêng biệt trước khi băm chậm và so sánh bằng hmac.compare_digest.',
        'Blocks brute-force bursts early and hashes passwords with per-user random salts plus constant-time digest comparison.'
      ),
      why: bi(
        'Vô hiệu hóa cả tấn công dò mật khẩu tự động (Brute-force / Credential Stuffing) lẫn bảng tra cứu băm dựng sẵn (Rainbow Tables).',
        'Defeats automated credential-stuffing bots, GPU hash cracking, and Rainbow Table attacks.'
      ),
    },
  },
  {
    match: /sys\.modules|stdlib|random\.py|\.venv|pypi|uv/i,
    info: {
      title: bi('Cơ chế nạp Module, sys.modules & Môi trường .venv', 'Module Resolution, sys.modules & .venv'),
      kindLabel: bi('Hệ thống Module & Gói', 'Module & Package Loader'),
      what: bi(
        'Bộ điều phối tìm kiếm, biên dịch và lưu đệm (cache) các thư viện chuẩn (Python Stdlib) cũng như gói bên thứ ba trong .venv.',
        'Python’s import cache and search-path resolver across local modules, Stdlib, and .venv packages.'
      ),
      how: bi(
        'Khi gặp lệnh import, Python kiểm tra bảng băm sys.modules trước; nếu chưa có mới dò theo danh sách thư mục sys.path (bắt đầu từ thư mục chứa script hiện tại).',
        'Checks sys.modules cache first; on a miss, scans sys.path starting from the current script’s directory.'
      ),
      why: bi(
        'Đảm bảo mỗi module chỉ khởi tạo một lần duy nhất (Singleton) dù được import ở hàng chục file khác nhau.',
        'Guarantees fast O(1) subsequent imports and avoids re-executing module initialization code.'
      ),
      tipOrCase: bi(
        'Cạm bẫy thực tế (Module Shadowing): Tuyệt đối không đặt tên file code cá nhân trùng với thư viện chuẩn như random.py, json.py, email.py hay http.py — vì thư mục hiện tại đứng đầu sys.path nên Python sẽ tự import lại chính file của bạn thay vì Stdlib!',
        'Watch out for Module Shadowing: naming your script random.py or json.py shadows Python’s standard library because your working folder sits first in sys.path!'
      ),
    },
  },
  {
    match: /with open|__enter__|__exit__|context/i,
    info: {
      title: bi('Context Manager (with ... / __enter__ & __exit__)', 'Context Manager Protocol (with)'),
      kindLabel: bi('Quản lý vòng đời tài nguyên', 'Deterministic Resource Lifecycle'),
      what: bi(
        'Giao thức đảm bảo tài nguyên hệ thống (File Descriptor, kết nối DB, Lock mạng) luôn được đóng/giải phóng tự động ngay khi ra khỏi khối lệnh.',
        'Protocol guaranteeing deterministic setup (__enter__) and teardown (__exit__) around a scoped block.'
      ),
      how: bi(
        'Python tự động gọi __enter__() khi vào khối with và cam kết gọi __exit__() ngay khi thoát khối — kể cả khi bên trong xảy ra return sớm hoặc phát sinh Exception.',
        'Invokes __enter__() on entry and unconditionally invokes __exit__() on exit, even if an exception is raised.'
      ),
      why: bi(
        'Loại bỏ triệt để lỗi rò rỉ tài nguyên (Too many open files / treo khóa Transaction) mà không cần viết lặp lại try...finally dài dòng.',
        'Prevents leaked file handles, hung DB transactions, and deadlocked mutexes.'
      ),
      tipOrCase: bi(
        'Mẹo chuẩn Production: Khi mở file văn bản, luôn truyền rõ encoding="utf-8" trong with open(path, encoding="utf-8") để không bị lỗi font tiếng Việt trên Windows (mặc định cp1252).',
        'Production Tip: Always specify encoding="utf-8" in open() so behavior is identical across Windows, macOS, and Linux.'
      ),
    },
  },
  {
    match: /argparse|stdout|stderr|stdin|argv/i,
    info: {
      title: bi('Chuẩn Giao Tiếp CLI Unix (stdin · stdout · stderr · argparse)', 'Unix CLI Streams & argparse'),
      kindLabel: bi('Giao diện Dòng lệnh', 'Standard I/O Streams'),
      what: bi(
        'Mô hình tách biệt luồng dữ liệu đầu vào (stdin/argv), kết quả chuẩn (stdout - kênh 1), chẩn đoán lỗi (stderr - kênh 2) và mã thoát (Exit Code).',
        'Clean separation of CLI flags (argparse), pipeable output (stdout), diagnostics (stderr), and exit codes.'
      ),
      how: bi(
        'argparse phân tích tham số & sinh --help tự động; dữ liệu JSON/CSV xuất ra stdout để nối ống pipe (| jq), còn cảnh báo/tiến độ ghi sang sys.stderr.',
        'Parses typed CLI arguments while keeping stdout machine-readable and routing human logs to stderr.'
      ),
      why: bi(
        'Giúp công cụ Python kết hợp mượt mà trong dây chuyền tự động hóa CI/CD và Shell script mà không làm hỏng dữ liệu của câu lệnh phía sau.',
        'Enables reliable composition in shell pipelines (cmd1 | cmd2) and CI/CD automation.'
      ),
    },
  },
  {
    match: /shallow|deepcopy|aliasing|list con/i,
    info: {
      title: bi('Tham Chiếu Lồng Nhau: Shallow Copy vs Deep Copy', 'Shallow Copy vs Deep Copy'),
      kindLabel: bi('Mô hình Bộ nhớ Heap', 'Heap Reference Semantics'),
      what: bi(
        'Sự khác biệt giữa chỉ sao chép lớp vỏ danh sách ngoài cùng (a[:] / a.copy()) và sao chép đệ quy toàn bộ các đối tượng con bên trong (copy.deepcopy).',
        'Distinction between cloning only outer container references vs recursively cloning nested mutable objects.'
      ),
      how: bi(
        'Shallow Copy tạo một đối tượng list mới ở cấp 1 nhưng sao chép nguyên xi địa chỉ con trỏ của các phần tử bên trong; Deep Copy cấp phát mới hoàn toàn ở mọi tầng.',
        'Shallow copy duplicates top-level pointers; deepcopy traverses and duplicates the entire nested object graph.'
      ),
      why: bi(
        'Sao chép nông mặc định giúp tiết kiệm bộ nhớ và cực nhanh O(n), nhưng đòi hỏi lập trình viên hiểu rõ khi làm việc với ma trận 2D hoặc JSON lồng nhau.',
        'Avoids silent cross-mutation bugs when modifying nested lists or dictionaries.'
      ),
      tipOrCase: bi(
        'Case Study kinh điển: Viết grid = [[0] * 3] * 3 sẽ tạo 3 hàng cùng trỏ vào 1 list duy nhất — gán grid[0][0] = 9 làm cả 3 hàng đều đổi thành 9! Luôn viết [[0] * 3 for _ in range(3)].',
        'Classic Bug: [[0] * 3] * 3 aliases all rows to the same list! Always use a list comprehension [[0] * 3 for _ in range(3)].'
      ),
    },
  },
  {
    match: /__defaults__|bag=none|mutable default/i,
    info: {
      title: bi('Cạm Bẫy Tham Số Mặc Định Khả Biến (Mutable Default Trap)', 'Mutable Default Argument Trap'),
      kindLabel: bi('Cơ chế Khởi tạo Hàm', 'Function Definition Semantics'),
      what: bi(
        'Hiện tượng các lần gọi hàm khác nhau bị dùng chung cùng một list/dict mặc định khi khai báo def fn(items=[]).',
        'Bug where multiple calls unexpectedly share and mutate the same default list or dict.'
      ),
      how: bi(
        'Python chỉ khởi tạo biểu thức giá trị mặc định ĐÚNG MỘT LẦN tại thời điểm nạp định nghĩa hàm (def) và cất vào thuộc tính fn.__defaults__.',
        'Python evaluates default parameter expressions once at def time, storing the object on fn.__defaults__.'
      ),
      why: bi(
        'Thiết kế này giúp gọi hàm không tốn chi phí cấp phát lại các hằng số mặc định ở mỗi lần gọi, nhưng gây bất ngờ nếu dùng kiểu khả biến.',
        'Avoids re-evaluating constant defaults on every call, requiring None sentinels for mutable containers.'
      ),
      tipOrCase: bi(
        'Mẫu chuẩn bắt buộc: Luôn viết def fn(items=None): rồi bên trong hàm kiểm tra if items is None: items = [].',
        'Idiom: Always use None as the default (def fn(items=None):) and allocate a fresh list inside the body.'
      ),
    },
  },
  {
    match: /@cache|memo|fib/i,
    info: {
      title: bi('Memoization với @functools.cache', 'Memoization (@functools.cache)'),
      kindLabel: bi('Tối ưu Thuật toán Đệ quy', 'Dynamic Programming Cache'),
      what: bi(
        'Kỹ thuật lưu kết quả tính toán của hàm theo bộ tham số đầu vào để tái sử dụng tức thì trong O(1) khi gặp lại bài toán con giống hệt.',
        'Decorator that caches function return values keyed by arguments for O(1) repeat lookups.'
      ),
      how: bi(
        'Bọc một bảng băm (dict) quanh hàm đệ quy: nếu tuple tham số đã có trong cache thì trả kết quả ngay, cắt bỏ hoàn toàn nhánh cây đệ quy thừa.',
        'Intercepts calls with a hash-table lookup, pruning entire duplicate recursive subtrees.'
      ),
      why: bi(
        'Hạ độ phức tạp thời gian từ bùng nổ hàm mũ O(2^n) xuống tuyến tính O(n) chỉ với một dòng Decorator.',
        'Collapses exponential O(2^n) recursion into linear O(n) runtime with one line of code.'
      ),
      tipOrCase: bi(
        'Lưu ý quan trọng: Vì tham số làm khóa trong dict của @cache nên mọi đối tượng truyền vào hàm bắt buộc phải Hashable (hãy chuyển list thành tuple trước khi truyền).',
        'Tip: All arguments to a @cache function must be hashable — convert lists to tuples first!'
      ),
    },
  },
  {
    match: /sqlite|domain core|clean/i,
    info: {
      title: bi('Kiến trúc Phân tầng (Clean Core) & SQLite Tham số hóa', 'Layered Domain Core & Parameterized SQL'),
      kindLabel: bi('Kiến trúc Phần mềm', 'Application Architecture'),
      what: bi(
        'Thiết kế tách rời Giao diện (CLI/UI) → Tầng Nghiệp vụ thuần (Domain Core) → Tầng Lưu trữ an toàn (SQLite Repository).',
        '3-tier separation isolating pure business rules from UI shells and parameterized SQL persistence.'
      ),
      how: bi(
        'Tầng Core chỉ nhận/trả dataclass thuần không chứa print/SQL; tầng DB dùng dấu hỏi chấm (?, ?) truyền tham số tách biệt và bọc giao dịch bằng with conn:.',
        'Passes typed DTOs into pure functions and executes SQL with bound ? placeholders inside with conn: transactions.'
      ),
      why: bi(
        'Giúp chạy hàng trăm Unit Test cho tầng Core dưới 10ms không cần chạm đĩa, đồng thời miễn nhiễm 100% với tấn công SQL Injection.',
        'Enables sub-millisecond unit tests on business logic and completely eliminates SQL Injection vulnerabilities.'
      ),
    },
  },
];

export function resolveFallbackInspector(
  rawTitle: string,
  rawSub: string | undefined,
  isLink: boolean
): StageInspectorInfo {
  const combined = `${rawTitle} ${rawSub ?? ''}`;
  for (const item of ENTITY_KNOWLEDGE) {
    if (item.match.test(combined)) {
      return item.info;
    }
  }
  for (const item of EXTRA_ENTITY_KNOWLEDGE) {
    if (item.match.test(combined)) {
      return item.info;
    }
  }

  return {
    title: bi(rawTitle, rawTitle),
    kindLabel: isLink
      ? bi('Luồng kết nối / Giao thức', 'Connector / Data Flow')
      : bi('Thành phần trong mô hình', 'System / Runtime Component'),
    what: isLink
      ? bi(
          `Đường truyền dữ liệu hoặc lời gọi "${rawTitle}" kết nối trực tiếp giữa hai bước xử lý trong mô hình.`,
          `Data flow or invocation "${rawTitle}" connecting two stages in the architecture.`
        )
      : bi(
          `Thành phần "${rawTitle}"${rawSub ? ` (${rawSub})` : ''} đóng vai trò một trạm xử lý hoặc lưu trữ xác định trong luồng thực thi.`,
          `Component "${rawTitle}"${rawSub ? ` (${rawSub})` : ''} acting as a dedicated processing or state unit.`
        ),
    how: bi(
      'Nhận dữ liệu từ chặng phía trước, áp dụng quy tắc kiểm tra / biến đổi tương ứng của bước hiện tại rồi chuyển kết quả sang chặng kế tiếp.',
      'Receives upstream inputs, enforces this step’s invariant or transformation, and forwards the result downstream.'
    ),
    why: bi(
      'Tách bạch rõ trách nhiệm từng khâu giúp dễ đọc luồng chạy, dễ cô lập lỗi (debug) và viết kiểm thử độc lập.',
      'Separating responsibilities makes control flow predictable, debuggable, and independently testable.'
    ),
  };
}

export const StageEntityInspectorCard: React.FC<{
  info: StageInspectorInfo;
  lang: WorkbenchLang;
  onClose: () => void;
}> = ({ info, lang, onClose }) => {
  return (
    <div
      role="region"
      aria-label={pickText(info.title, lang)}
      className="dts-card-tactile z-30 flex max-h-[86%] w-full max-w-[390px] flex-col overflow-hidden rounded-2xl bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] animate-[dts-pill-in_200ms_ease-out]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-[var(--dts-border-soft)] bg-[var(--dts-panel-muted)] px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="font-mono text-[9.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
            {pickText(info.kindLabel, lang)}
          </div>
          <h3 className="font-mono text-xs sm:text-[13px] font-extrabold text-[var(--dts-ink)] leading-snug">
            {pickText(info.title, lang)}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspector"
          className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-1 text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body: What / How / Why / Tips & Case Study */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3.5 space-y-2.5 text-[12px] leading-relaxed">
        <div>
          <div className="mb-0.5 flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-green-ink)]">
            <HelpCircle className="h-3 w-3 shrink-0" />
            <span>{lang === 'en' ? 'What is it?' : '1. Đây là gì?'}</span>
          </div>
          <p className="text-[var(--dts-ink-soft)]">{pickText(info.what, lang)}</p>
        </div>

        <div>
          <div className="mb-0.5 flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-blue-ink)]">
            <Cpu className="h-3 w-3 shrink-0" />
            <span>{lang === 'en' ? 'How it works' : '2. Cơ chế hoạt động'}</span>
          </div>
          <p className="text-[var(--dts-ink-soft)]">{pickText(info.how, lang)}</p>
        </div>

        <div>
          <div className="mb-0.5 flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-purple-ink)]">
            <BookOpen className="h-3 w-3 shrink-0" />
            <span>{lang === 'en' ? 'Why does it matter?' : '3. Tại sao lại thế?'}</span>
          </div>
          <p className="text-[var(--dts-ink-soft)]">{pickText(info.why, lang)}</p>
        </div>

        {info.tipOrCase && (
          <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-amber-soft)] p-2.5 text-[var(--dts-amber-ink)]">
            <div className="mb-0.5 flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-wider">
              <Lightbulb className="h-3 w-3 shrink-0" />
              <span>
                {lang === 'en' ? 'Tips & Real-World Case' : 'Mẹo thực chiến & Case Study'}
              </span>
            </div>
            <p className="text-[11.5px] leading-relaxed">
              {pickText(info.tipOrCase, lang)}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--dts-border-soft)] bg-[var(--dts-panel)] px-3.5 py-1.5 font-mono text-[10px] text-[var(--dts-ink-muted)] flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 shrink-0" />
        <span>
          {lang === 'en'
            ? 'Click any other block, connector, or tag to inspect'
            : 'Nhấn vào bất kỳ khối, đường nối hoặc nhãn nào khác để đối chiếu'}
        </span>
      </div>
    </div>
  );
};

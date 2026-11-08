import { PracticeExercise } from '@/types/practice.types';

export const PACK_5_EXERCISES: PracticeExercise[] = [
  {
    id: 'ex-s5-blocking-event-loop',
    title: 'Bài 59: Cứu hộ Server FastAPI bị Đóng băng vì gọi time.sleep và requests.get trong async def',
    category: 'debug-rescue',
    stageId: 'stage-5',
    level: 'master',
    relatedLessonId: 's5-asyncio-gil-concurrency',
    problemStatement:
      'Lập trình viên từ Java/PHP sang FastAPI rất hay mắc lỗi chí mạng: viết từ khóa `async def` cho đẹp nhưng bên trong lại gọi hàm đồng bộ chặn luồng `time.sleep(1)` và `requests.get(url)`! Vì Event Loop của `asyncio` chạy trên **1 Thread duy nhất**, lệnh `requests.get()` hoặc `time.sleep()` sẽ làm **đóng băng toàn bộ Server** — 999 khách hàng khác đang gọi `/health` cũng phải đứng chờ theo! Hãy giải cứu hàm `fetch_partner_status(url: str)` bằng cách thay `time.sleep` bằng `await asyncio.sleep(0.1)` và thay `requests.get` bằng `async with httpx.AsyncClient() as client:` kèm `resp = await client.get(url)`.',
    realWorldContext:
      'Trong kiến trúc ASGI (Uvicorn + FastAPI), một lời gọi Blocking I/O bên trong `async def` nguy hiểm gấp 10 lần so với trong `def` thường (vì FastAPI tự động đẩy `def` thường sang ThreadPool, nhưng lại chạy `async def` trực tiếp trên Main Event Loop!).',
    requirements: [
      'Thay thế `time.sleep(...)` bằng `await asyncio.sleep(0.1)`',
      'Sử dụng `async with httpx.AsyncClient() as client:` để quản lý HTTP connection pool bất đồng bộ',
      'Gọi `resp = await client.get(url)` và trả về `return resp.status_code`',
    ],
    starterCode: `import time
import requests

# THẢM HỌA PRODUCTION: Gọi time.sleep và requests.get bên trong async def
# sẽ khóa cứng (block) toàn bộ Main Event Loop của FastAPI!
async def fetch_partner_status(url: str) -> int:
    # TODO: Thay import ở trên bằng asyncio và httpx,
    # dùng await asyncio.sleep(0.1) và async with httpx.AsyncClient() as client:
    time.sleep(0.1)
    resp = requests.get(url)
    return resp.status_code
`,
    solutionCode: `import asyncio
import httpx

async def fetch_partner_status(url: str) -> int:
    await asyncio.sleep(0.1)
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        return resp.status_code
`,
    hints: [
      'Gợi ý 1: Đổi `import time` và `import requests` ở đầu file thành `import asyncio` và `import httpx`.',
      'Gợi ý 2: Thay `time.sleep(0.1)` bằng `await asyncio.sleep(0.1)`.',
      'Gợi ý 3: Dùng `async with httpx.AsyncClient() as client:` rồi gọi `resp = await client.get(url)` và `return resp.status_code`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Nhường quyền điều khiển Event Loop bằng `await asyncio.sleep`',
        codeSnippet: `import asyncio\nimport httpx\n\nasync def fetch_partner_status(url: str) -> int:\n    await asyncio.sleep(0.1)`,
        explanation:
          'Khi gặp từ khóa `await`, Coroutine hiện tại tạm dừng và trả quyền điều khiển về cho Event Loop để phục vụ hàng ngàn HTTP Request khác trong lúc chờ 0.1 giây.',
      },
      {
        stepTitle: 'Bước 2: Thay `requests` (Sync) bằng `httpx.AsyncClient` (Async I/O)',
        codeSnippet: `    async with httpx.AsyncClient() as client:\n        resp = await client.get(url)\n        return resp.status_code`,
        explanation:
          'Thư viện `requests` được thiết kế từ thời đồng bộ và khóa cứng OS Socket. `httpx.AsyncClient` sử dụng non-blocking socket kết hợp `epoll`/`kqueue` của hệ điều hành, tương đương với `fetch()` trong Node.js.',
      },
    ],
    commonMistakes: [
      'Dùng `requests.get(url)` bên trong `async def` vì nghĩ cứ có chữ `async def` ở đầu hàm là Python tự biến mọi thứ bên trong thành bất đồng bộ!',
      'Khởi tạo `httpx.AsyncClient()` mà không dùng `async with` (hoặc không đóng khi tắt app), gây rò rỉ Socket Descriptor.',
    ],
    testCases: [
      {
        id: 'tc-59-1',
        description: 'Loại bỏ hoàn toàn time.sleep và requests.get khỏi hàm async def',
        inputDescription: 'await fetch_partner_status("https://api.example.com/health")',
        expectedOutput: '200',
        requiredPatterns: [
          'import asyncio',
          'import httpx',
          'await asyncio.sleep(',
          'async with httpx.AsyncClient() as client:',
          'await client.get(url)',
        ],
        forbiddenPatterns: [
          {
            pattern: 'time.sleep',
            reason: 'CẤM KỴ: `time.sleep` chặn đứng Event Loop! Hãy dùng `await asyncio.sleep(...)`.',
          },
          {
            pattern: 'requests.get',
            reason: 'CẤM KỴ: `requests.get` là hàm đồng bộ chặn đứng Event Loop! Hãy dùng `httpx.AsyncClient`.',
          },
        ],
      },
      {
        id: 'tc-59-2',
        description: 'Trả về đúng mã trạng thái HTTP resp.status_code',
        inputDescription: 'status_code',
        expectedOutput: '200',
        requiredPatterns: ['return resp.status_code'],
      },
    ],
  },
  {
    id: 'ex-s5-async-semaphore',
    title: 'Bài 60: Kiểm soát Bất đồng bộ 1.000 URL với asyncio.Semaphore & asyncio.gather',
    category: 'architecture',
    stageId: 'stage-5',
    level: 'master',
    relatedLessonId: 's5-asyncio-gil-concurrency',
    problemStatement:
      'Trong Node.js bạn phải cài thêm thư viện `p-limit` để tránh việc `Promise.all()` bắn 1.000 HTTP request cùng lúc làm sập server đích hoặc dính lỗi `429 Too Many Requests`. Trong Python, thư viện chuẩn `asyncio` đã tích hợp sẵn vũ khí hạng nặng `asyncio.Semaphore`! Hãy viết hàm `crawl_urls(urls: list[str], max_concurrent: int = 10)` khởi tạo `sem = asyncio.Semaphore(max_concurrent)`, bọc phần tải bên trong `async with sem:` và chạy đồng thời bằng `await asyncio.gather(...)`.',
    realWorldContext:
      'Kỹ thuật Bounded Concurrency (Đồng thời có giới hạn) bắt buộc phải có khi bạn viết Web Crawler, hệ thống gửi Webhook hàng loạt, hoặc gọi OpenAI/Gemini API cho hàng nghìn văn bản cùng lúc.',
    requirements: [
      'Khởi tạo `sem = asyncio.Semaphore(max_concurrent)`',
      'Viết coroutine con `async def fetch_one(url: str) -> str:` có khối `async with sem:` và `await asyncio.sleep(0.01)`',
      'Thu thập kết quả đồng thời bằng `return await asyncio.gather(*(fetch_one(u) for u in urls))`',
    ],
    starterCode: `import asyncio

async def crawl_urls(urls: list[str], max_concurrent: int = 10) -> list[str]:
    # TODO: Tạo sem = asyncio.Semaphore(max_concurrent),
    # viết hàm async def fetch_one(url: str) -> str bọc trong 'async with sem:'
    # và trả về await asyncio.gather(*(fetch_one(u) for u in urls))
    pass
`,
    solutionCode: `import asyncio

async def crawl_urls(urls: list[str], max_concurrent: int = 10) -> list[str]:
    sem = asyncio.Semaphore(max_concurrent)

    async def fetch_one(url: str) -> str:
        async with sem:
            await asyncio.sleep(0.01)
            return f"Fetched: {url}"

    return await asyncio.gather(*(fetch_one(u) for u in urls))
`,
    hints: [
      'Gợi ý 1: Khởi tạo `sem = asyncio.Semaphore(max_concurrent)` ở dòng đầu tiên của `crawl_urls`.',
      'Gợi ý 2: Định nghĩa `async def fetch_one(url: str) -> str:` sử dụng `async with sem:` rồi `await asyncio.sleep(0.01)` và `return f"Fetched: {url}"`.',
      'Gợi ý 3: Ở cuối hàm `crawl_urls`, gọi `return await asyncio.gather(*(fetch_one(u) for u in urls))`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Tạo chốt kiểm soát số lượng Coroutine chạy song song với `Semaphore`',
        codeSnippet: `    sem = asyncio.Semaphore(max_concurrent)\n\n    async def fetch_one(url: str) -> str:\n        async with sem:\n            await asyncio.sleep(0.01)\n            return f"Fetched: {url}"`,
        explanation:
          '`Semaphore(10)` hoạt động như một bãi đỗ xe chỉ có 10 thẻ từ. Khi 10 Coroutine đầu tiên bước vào khối `async with sem:`, thẻ về 0. Coroutine thứ 11 sẽ đứng chờ bất đồng bộ ở cửa cho tới khi 1 trong 10 Coroutine trước bước ra khỏi khối `async with`.',
      },
      {
        stepTitle: 'Bước 2: Kích hoạt đồng thời toàn bộ danh sách bằng `asyncio.gather`',
        codeSnippet: `    return await asyncio.gather(*(fetch_one(u) for u in urls))`,
        explanation:
          'Toán tử giải nén `*(...)` truyền từng Coroutine vào `asyncio.gather`. Thứ tự kết quả trong `list` trả về được đảm bảo khớp 100% với thứ tự của danh sách `urls` đầu vào!',
      },
    ],
    commonMistakes: [
      'Dùng vòng lặp `[await fetch_one(u) for u in urls]` — viết `await` trực tiếp trong vòng lặp sẽ khiến 1.000 URL chạy tuần tự từng cái một, làm vô nghĩa cả `Semaphore` lẫn `AsyncIO`!',
      'Tạo mới `asyncio.Semaphore(max_concurrent)` ở BÊN TRONG hàm `fetch_one` khiến mỗi URL có một Semaphore riêng biệt và không hề giới hạn được tổng số kết nối.',
    ],
    testCases: [
      {
        id: 'tc-60-1',
        description: 'Sử dụng asyncio.Semaphore, async with sem và asyncio.gather',
        inputDescription: 'await crawl_urls(["https://a.com", "https://b.com"], max_concurrent=2)',
        expectedOutput: "['Fetched: https://a.com', 'Fetched: https://b.com']",
        requiredPatterns: [
          'asyncio.Semaphore(max_concurrent)',
          'async with sem:',
          'await asyncio.sleep(',
          'asyncio.gather(',
        ],
        forbiddenPatterns: [
          {
            pattern: 'time.sleep',
            reason: 'Không được dùng `time.sleep` trong code bất đồng bộ! Hãy dùng `await asyncio.sleep(...)`.',
          },
        ],
      },
      {
        id: 'tc-60-2',
        description: 'Định nghĩa hàm fetch_one trả về chuỗi f"Fetched: {url}"',
        inputDescription: 'len(await crawl_urls(["u1", "u2", "u3"], 2))',
        expectedOutput: '3',
        requiredPatterns: ['async def fetch_one', 'f"Fetched: {url}"'],
      },
    ],
  },
  {
    id: 'ex-s5-taskgroup-structured',
    title: 'Bài 61: Quản lý Tác vụ Đồng thời An toàn với asyncio.TaskGroup() (Python 3.11+)',
    category: 'code-gym',
    stageId: 'stage-5',
    level: 'master',
    relatedLessonId: 's5-asyncio-gil-concurrency',
    problemStatement:
      'Điểm yếu lớn của `asyncio.gather()` là khi 1 tác vụ con bị lỗi văng Exception, các tác vụ con khác vẫn tiếp tục chạy ngầm mồ côi (Orphaned Tasks) gây tiêu tốn tài nguyên hoặc ghi dữ liệu rác vào DB. Từ **Python 3.11+**, `asyncio.TaskGroup()` mang đến mô hình **Structured Concurrency (Đồng thời có cấu trúc)**: nếu 1 task trong nhóm bị lỗi, `TaskGroup` tự động hủy (`cancel`) tất cả các task anh em còn lại trước khi thoát khỏi khối `async with`! Hãy viết hàm `fetch_dashboard_data()` dùng `async with asyncio.TaskGroup() as tg:` và `tg.create_task(...)`.',
    realWorldContext:
      'Khi tổng hợp dữ liệu cho trang Dashboard từ 3 Microservice (`profile`, `orders`, `notifications`), `asyncio.TaskGroup` đảm bảo tính toàn vẹn: hoặc cả 3 hoàn thành nhanh nhất, hoặc hủy sạch sẽ các tác vụ thừa ngay khi có 1 service sập.',
    requirements: [
      'Sử dụng Context Manager `async with asyncio.TaskGroup() as tg:`',
      'Đăng ký 2 tác vụ `t1 = tg.create_task(fetch_part("profile"))` và `t2 = tg.create_task(fetch_part("orders"))`',
      'Sau khối `async with`, lấy kết quả bằng `return [t1.result(), t2.result()]`',
    ],
    starterCode: `import asyncio

async def fetch_part(name: str) -> str:
    await asyncio.sleep(0.01)
    return f"data:{name}"

async def fetch_dashboard_data() -> list[str]:
    # TODO: Dùng 'async with asyncio.TaskGroup() as tg:'
    # tạo t1 = tg.create_task(fetch_part("profile")) và t2 = tg.create_task(fetch_part("orders"))
    # rồi trả về [t1.result(), t2.result()] sau khối async with
    pass
`,
    solutionCode: `import asyncio

async def fetch_part(name: str) -> str:
    await asyncio.sleep(0.01)
    return f"data:{name}"

async def fetch_dashboard_data() -> list[str]:
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(fetch_part("profile"))
        t2 = tg.create_task(fetch_part("orders"))
    return [t1.result(), t2.result()]
`,
    hints: [
      'Gợi ý 1: Mở khối `async with asyncio.TaskGroup() as tg:` bên trong `fetch_dashboard_data`.',
      'Gợi ý 2: Bên trong khối `async with`, gọi `t1 = tg.create_task(fetch_part("profile"))` và `t2 = tg.create_task(fetch_part("orders"))`.',
      'Gợi ý 3: Thoát ra ngoài khối `async with` (lùi ra 1 tab), trả về `return [t1.result(), t2.result()]`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Khởi chạy các Task trong phạm vi `async with asyncio.TaskGroup() as tg:`',
        codeSnippet: `    async with asyncio.TaskGroup() as tg:\n        t1 = tg.create_task(fetch_part("profile"))\n        t2 = tg.create_task(fetch_part("orders"))`,
        explanation:
          'Bạn không cần viết `await` trên từng dòng `tg.create_task(...)` vì bản thân dấu đóng khối `async with` của `TaskGroup` chính là rào chắn đồng bộ (Barrier): nó tự động `await` tất cả các task con hoàn tất trước khi đi tiếp xuống dòng dưới.',
      },
      {
        stepTitle: 'Bước 2: Thu hoạch kết quả an toàn bằng `.result()` sau khối `async with`',
        codeSnippet: `    return [t1.result(), t2.result()]`,
        explanation:
          'Khi luồng thực thi đã bước ra khỏi `async with asyncio.TaskGroup()`, 100% các task `t1`, `t2` chắc chắn đã hoàn thành thành công, nên gọi `t1.result()` trả về giá trị tức thì mà không bao giờ sợ lỗi `InvalidStateError`.',
      },
    ],
    commonMistakes: [
      'Gọi `t1.result()` ngay BÊN TRONG khối `async with asyncio.TaskGroup() as tg:` khi task `t1` mới vừa tạo xong chưa kịp chạy, gây lỗi `asyncio.InvalidStateError: Result is not set`!',
      'Dùng `asyncio.create_task(...)` tự do mà không lưu tham chiếu vào biến hoặc không dùng `TaskGroup`, khiến Garbage Collector của Python có thể xóa mất Task đang chạy dở!',
    ],
    testCases: [
      {
        id: 'tc-61-1',
        description: 'Sử dụng async with asyncio.TaskGroup() as tg: và tg.create_task(...)',
        inputDescription: 'await fetch_dashboard_data()',
        expectedOutput: "['data:profile', 'data:orders']",
        requiredPatterns: [
          'async with asyncio.TaskGroup() as tg:',
          'tg.create_task(fetch_part("profile"))',
          'tg.create_task(fetch_part("orders"))',
        ],
      },
      {
        id: 'tc-61-2',
        description: 'Lấy kết quả t1.result() và t2.result() sau khi thoát khỏi khối TaskGroup',
        inputDescription: '[t1.result(), t2.result()]',
        expectedOutput: "['data:profile', 'data:orders']",
        requiredPatterns: ['t1.result()', 't2.result()'],
      },
    ],
  },
  {
    id: 'ex-s5-asyncio-to-thread',
    title: 'Bài 62: Bọc Thư viện Đồng bộ Cũ kỹ chạy Non-blocking bằng asyncio.to_thread()',
    category: 'architecture',
    stageId: 'stage-5',
    level: 'pro',
    relatedLessonId: 's5-asyncio-gil-concurrency',
    problemStatement:
      'Trong thực tế, bạn không thể lúc nào cũng tìm được thư viện `async` thay thế (ví dụ: SDK `boto3` của AWS, thư viện xử lý ảnh `Pillow`, hoặc driver ERP nội bộ công ty chỉ có hàm đồng bộ `legacy_generate_pdf(order_id)`). Nếu gọi trực tiếp hàm này trong `async def`, Event Loop sẽ bị treo! Hãy sử dụng `await asyncio.to_thread(legacy_generate_pdf, order_id)` để đẩy hàm đồng bộ đó sang một Worker Thread riêng thuộc ThreadPool mà không làm gián đoạn Event Loop chính.',
    realWorldContext:
      '`asyncio.to_thread(func, *args, **kwargs)` (ra mắt từ Python 3.9) là chiếc cầu nối thanh lịch nhất giúp tích hợp kho tàng thư viện đồng bộ khổng lồ của Python vào ứng dụng FastAPI bất đồng bộ.',
    requirements: [
      'Không gọi trực tiếp `legacy_generate_pdf(order_id)` trên luồng Event Loop',
      'Sử dụng `await asyncio.to_thread(legacy_generate_pdf, order_id)` để chạy trên ThreadPool ngầm',
      'Trả về kết quả nhận được từ `await asyncio.to_thread(...)`',
    ],
    starterCode: `import asyncio
import time

def legacy_generate_pdf(order_id: int) -> str:
    # Hàm thư viện cũ đồng bộ (Sync), không thể sửa thành async def
    time.sleep(0.05)
    return f"invoice_{order_id}.pdf"

async def handle_export_pdf(order_id: int) -> str:
    # TODO: Dùng await asyncio.to_thread(...) để gọi legacy_generate_pdf(order_id)
    # mà không làm chặn đứng Event Loop
    pass
`,
    solutionCode: `import asyncio
import time

def legacy_generate_pdf(order_id: int) -> str:
    time.sleep(0.05)
    return f"invoice_{order_id}.pdf"

async def handle_export_pdf(order_id: int) -> str:
    return await asyncio.to_thread(legacy_generate_pdf, order_id)
`,
    hints: [
      'Gợi ý 1: Cú pháp của `asyncio.to_thread` là truyền tên hàm làm đối số thứ nhất, và các đối số của hàm đó ở các vị trí tiếp theo: `asyncio.to_thread(legacy_generate_pdf, order_id)`.',
      'Gợi ý 2: Đừng gọi `legacy_generate_pdf(order_id)` trước khi truyền vào `to_thread` (không có dấu ngoặc `()` sau `legacy_generate_pdf`).',
      'Gợi ý 3: Thêm `return await asyncio.to_thread(legacy_generate_pdf, order_id)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Truyền hàm và đối số tách rời vào `asyncio.to_thread`',
        codeSnippet: `async def handle_export_pdf(order_id: int) -> str:\n    return await asyncio.to_thread(legacy_generate_pdf, order_id)`,
        explanation:
          '`asyncio.to_thread` tự động copy cả `contextvars` (như Request ID, Trace ID của OpenTelemetry) từ Event Loop sang Worker Thread, thực thi `legacy_generate_pdf(order_id)` ở luồng phụ và đánh thức Coroutine khi hoàn tất.',
      },
      {
        stepTitle: 'Bước 2: Tại sao truyền `(legacy_generate_pdf, order_id)` chứ không phải `(legacy_generate_pdf(order_id))`?',
        codeSnippet: `# ĐÚNG: asyncio.to_thread(legacy_generate_pdf, order_id)\n# SAI:  asyncio.to_thread(legacy_generate_pdf(order_id))`,
        explanation:
          'Nếu bạn viết `legacy_generate_pdf(order_id)` bên trong ngoặc, Python sẽ chạy hàm đó NGAY LẬP TỨC trên Main Thread trước khi kịp gọi `to_thread`, làm Event Loop vẫn bị treo như thường!',
      },
    ],
    commonMistakes: [
      'Viết `await asyncio.to_thread(legacy_generate_pdf(order_id))` — gọi hàm trực tiếp làm đối số sẽ khiến nó chạy đồng bộ ngay trên Main Thread rồi mới truyền chuỗi kết quả vào `to_thread` (văng lỗi `TypeError: "str" object is not callable`).',
      'Quên từ khóa `await` trước `asyncio.to_thread(...)`, khiến hàm trả về một đối tượng Coroutine chưa được chạy.',
    ],
    testCases: [
      {
        id: 'tc-62-1',
        description: 'Sử dụng await asyncio.to_thread(legacy_generate_pdf, order_id) chuẩn xác',
        inputDescription: 'await handle_export_pdf(42)',
        expectedOutput: "'invoice_42.pdf'",
        requiredPatterns: [
          'await asyncio.to_thread(legacy_generate_pdf, order_id)',
          'return ',
        ],
        forbiddenPatterns: [
          {
            pattern: 'to_thread(legacy_generate_pdf(',
            reason: 'Không được gọi `legacy_generate_pdf(...)` trước khi đưa vào `to_thread`! Hãy truyền `(legacy_generate_pdf, order_id)`.',
          },
        ],
      },
      {
        id: 'tc-62-2',
        description: 'Giữ nguyên chữ ký bất đồng bộ async def handle_export_pdf',
        inputDescription: 'asyncio.iscoroutinefunction(handle_export_pdf)',
        expectedOutput: 'True',
        requiredPatterns: ['async def handle_export_pdf(order_id: int) -> str:'],
      },
    ],
  },
  {
    id: 'ex-s5-process-pool-gil',
    title: 'Bài 63: Vượt qua Khóa GIL cho Bài toán Nặng CPU bằng ProcessPoolExecutor',
    category: 'architecture',
    stageId: 'stage-5',
    level: 'master',
    relatedLessonId: 's5-asyncio-gil-concurrency',
    problemStatement:
      'Khác với bài toán chờ mạng (I/O-bound) dùng `asyncio` hay `ThreadPoolExecutor`, nếu bạn chạy bài toán tính toán thuần Python nặng CPU (CPU-bound: nén dữ liệu, tính số nguyên tố, băm mật khẩu hàng loạt) trên nhiều Thread, **Global Interpreter Lock (GIL)** của CPython sẽ chỉ cho phép **1 Thread thực thi Bytecode tại một thời điểm**! Để tận dụng 100% sức mạnh đa nhân CPU (Multi-core Parallelism), bạn phải dùng `ProcessPoolExecutor` từ `concurrent.futures`. Hãy viết hàm `parallel_squares(numbers: list[int]) -> list[int]` sử dụng `with ProcessPoolExecutor() as executor:` và `list(executor.map(heavy_square, numbers))`.',
    realWorldContext:
      'Trong các hệ thống xử lý ảnh/video, tính toán định lượng tài chính hoặc tiền xử lý dữ liệu AI bằng Python thuần, `ProcessPoolExecutor` tạo ra các tiến trình con độc lập (mỗi tiến trình có trình thông dịch Python và GIL riêng) để chạy song song thật sự trên mọi lõi CPU.',
    requirements: [
      'Import `ProcessPoolExecutor` từ `concurrent.futures`',
      'Sử dụng Context Manager `with ProcessPoolExecutor() as executor:` để đảm bảo tự động thu hồi tiến trình con',
      'Trả về `return list(executor.map(heavy_square, numbers))`',
    ],
    starterCode: `from concurrent.futures import ProcessPoolExecutor

def heavy_square(n: int) -> int:
    return n * n

def parallel_squares(numbers: list[int]) -> list[int]:
    # TODO: Mở khối 'with ProcessPoolExecutor() as executor:'
    # và trả về list(executor.map(heavy_square, numbers))
    pass
`,
    solutionCode: `from concurrent.futures import ProcessPoolExecutor

def heavy_square(n: int) -> int:
    return n * n

def parallel_squares(numbers: list[int]) -> list[int]:
    with ProcessPoolExecutor() as executor:
        return list(executor.map(heavy_square, numbers))
`,
    hints: [
      'Gợi ý 1: Lưu ý hàm `heavy_square` phải được đặt ở cấp cao nhất của module (top-level) để Python có thể tuần tự hóa (`pickle`) gửi sang tiến trình con.',
      'Gợi ý 2: Bên trong `parallel_squares`, mở khối `with ProcessPoolExecutor() as executor:`.',
      'Gợi ý 3: Trả về `return list(executor.map(heavy_square, numbers))`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Tại sao hàm worker `heavy_square` phải nằm ở Top-level?',
        codeSnippet: `def heavy_square(n: int) -> int:\n    return n * n`,
        explanation:
          'Vì các tiến trình con không chia sẻ bộ nhớ RAM với tiến trình cha, `ProcessPoolExecutor` phải dùng giao thức `pickle` để đóng gói tên hàm và dữ liệu gửi qua ống dẫn IPC (Inter-Process Communication). Hàm `lambda` hoặc hàm lồng bên trong hàm khác sẽ không thể `pickle` được!',
      },
      {
        stepTitle: 'Bước 2: Phân phối tải đa nhân với `executor.map` trong khối `with`',
        codeSnippet: `def parallel_squares(numbers: list[int]) -> list[int]:\n    with ProcessPoolExecutor() as executor:\n        return list(executor.map(heavy_square, numbers))`,
        explanation:
          'Khối `with` đảm bảo gọi `executor.shutdown(wait=True)` khi hoàn tất để tránh tạo ra các tiến trình Zombie trên Linux. `executor.map` trả về một Iterator giữ nguyên thứ tự đầu vào nên ta bọc `list(...)` để thu kết quả.',
      },
    ],
    commonMistakes: [
      'Dùng `ThreadPoolExecutor` cho bài toán vòng lặp tính toán thuần Python — do khóa GIL, chạy 8 Thread tính toán nặng CPU thậm chí còn chậm hơn 1 Thread vì tốn thêm chi phí Context Switching!',
      'Truyền `lambda x: x * x` vào `ProcessPoolExecutor.map(...)`, dẫn đến lỗi `AttributeError: Can\'t pickle local object`!',
    ],
    testCases: [
      {
        id: 'tc-63-1',
        description: 'Sử dụng with ProcessPoolExecutor() as executor: và executor.map',
        inputDescription: 'parallel_squares([2, 3, 4, 5])',
        expectedOutput: '[4, 9, 16, 25]',
        requiredPatterns: [
          'ProcessPoolExecutor',
          'with ProcessPoolExecutor() as executor:',
          'executor.map(heavy_square, numbers)',
          'list(',
        ],
        forbiddenPatterns: [
          {
            pattern: 'ThreadPoolExecutor',
            reason: 'Bài toán CPU-bound cần vượt qua khóa GIL bằng `ProcessPoolExecutor`, không dùng `ThreadPoolExecutor`!',
          },
          {
            pattern: 'lambda ',
            reason: 'Không dùng `lambda` với `ProcessPoolExecutor` vì Python không thể `pickle` hàm nặc danh qua tiến trình khác!',
          },
        ],
      },
      {
        id: 'tc-63-2',
        description: 'Trả về kiểu list[int] từ kết quả ánh xạ song song',
        inputDescription: 'parallel_squares([10, 20])',
        expectedOutput: '[100, 400]',
        requiredPatterns: ['return list(executor.map(heavy_square, numbers))'],
      },
    ],
  },
  {
    id: 'ex-s6-vectorization-vs-loop',
    title: 'Bài 64: Tối ưu Tốc độ Gấp 100 Lần: Thay Vòng lặp for bằng Biểu thức Vector hóa Polars',
    category: 'js-to-py',
    stageId: 'stage-6',
    level: 'pro',
    relatedLessonId: 's6-ai-data-automation',
    problemStatement:
      'Lập trình viên từ JS/Java sang làm Data Engineering rất hay dùng vòng lặp `for row in df.iter_rows():` để tính cột mới cho bảng dữ liệu 10 triệu dòng. Trong Python, lặp qua từng dòng ở tầng Bytecode chậm gấp **50 đến 100 lần** so với việc đẩy biểu thức xuống tầng SIMD đa luồng viết bằng Rust của **Polars**! Hãy viết hàm `add_total_with_tax(df: pl.DataFrame) -> pl.DataFrame` sử dụng `df.with_columns((pl.col("price") * pl.col("qty") * 1.1).alias("total_with_tax"))` mà tuyệt đối KHÔNG dùng vòng lặp `for`.',
    realWorldContext:
      'Vectorization (Vector hóa) là nguyên lý sống còn trong Khoa học Dữ liệu và AI (Polars, NumPy, PyTorch): thay vì ra lệnh cho Python cộng từng con số một, bạn mô tả phép toán trên toàn bộ cột để động cơ Rust/C++ thực thi bằng tập lệnh AVX-512 của CPU.',
    requirements: [
      'Không sử dụng vòng lặp `for` hay `iter_rows()`',
      'Sử dụng `df.with_columns(...)` kết hợp biểu thức cột `pl.col("price") * pl.col("qty") * 1.1`',
      'Đặt tên cột mới bằng `.alias("total_with_tax")`',
    ],
    starterCode: `import polars as pl

def add_total_with_tax(df: pl.DataFrame) -> pl.DataFrame:
    # TODO: Thay vì dùng vòng lặp for chậm chạp, hãy dùng df.with_columns(...)
    # với biểu thức (pl.col("price") * pl.col("qty") * 1.1).alias("total_with_tax")
    pass
`,
    solutionCode: `import polars as pl

def add_total_with_tax(df: pl.DataFrame) -> pl.DataFrame:
    return df.with_columns(
        (pl.col("price") * pl.col("qty") * 1.1).alias("total_with_tax")
    )
`,
    hints: [
      'Gợi ý 1: Gọi phương thức `df.with_columns(...)` để thêm cột mới vào DataFrame.',
      'Gợi ý 2: Bên trong `with_columns`, viết biểu thức `(pl.col("price") * pl.col("qty") * 1.1).alias("total_with_tax")`.',
      'Gợi ý 3: Nhớ `return` kết quả của `df.with_columns(...)` vì Polars DataFrame là bất biến (Immutable).',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Xây dựng biểu thức cột nguyên bản `pl.col(...)`',
        codeSnippet: `        (pl.col("price") * pl.col("qty") * 1.1).alias("total_with_tax")`,
        explanation:
          'Trong Polars, `pl.col("price")` không phải là một mảng Python mà là một nút AST (Abstract Syntax Tree) của trình tối ưu hóa truy vấn Rust. Phép nhân giữa các cột diễn ra trực tiếp trên bộ nhớ Apache Arrow liên tiếp mà không tạo ra bất kỳ đối tượng `float` Python nào.',
      },
      {
        stepTitle: 'Bước 2: Trả về DataFrame mới từ `df.with_columns(...)`',
        codeSnippet: `def add_total_with_tax(df: pl.DataFrame) -> pl.DataFrame:\n    return df.with_columns(\n        (pl.col("price") * pl.col("qty") * 1.1).alias("total_with_tax")\n    )`,
        explanation:
          'Khác với `inplace=True` dễ gây lỗi của Pandas cũ, Polars sử dụng kiến trúc Copy-on-Write / Immutable chia sẻ con trỏ cột cực kỳ tiết kiệm RAM.',
      },
    ],
    commonMistakes: [
      'Dùng `.map_elements(lambda x: ...)` hoặc vòng lặp `for` cho các phép toán số học cơ bản — việc gọi hàm Python trên từng dòng sẽ khóa GIL và xóa sạch lợi thế tốc độ của Rust!',
      'Gọi `df.with_columns(...)` nhưng quên `return`, khiến hàm trả về `None` vì `with_columns` không sửa trực tiếp `df` gốc.',
    ],
    testCases: [
      {
        id: 'tc-64-1',
        description: 'Sử dụng biểu thức Vector hóa pl.col("price") * pl.col("qty") * 1.1 trong with_columns',
        inputDescription: 'add_total_with_tax(pl.DataFrame({"price": [100.0], "qty": [2]}))',
        expectedOutput: 'shape: (1, 3) -> total_with_tax: [220.0]',
        requiredPatterns: [
          'df.with_columns(',
          'pl.col("price")',
          'pl.col("qty")',
          '.alias("total_with_tax")',
        ],
        forbiddenPatterns: [
          {
            pattern: 'for ',
            reason: 'CẤM KỴ: Không dùng vòng lặp `for` trên từng dòng dữ liệu! Hãy dùng biểu thức Vector hóa `pl.col(...)`.',
          },
          {
            pattern: 'iter_rows',
            reason: 'Không dùng `iter_rows()` vì nó biến dữ liệu Arrow tốc độ cao thành Tuple Python chậm chạp!',
          },
        ],
      },
      {
        id: 'tc-64-2',
        description: 'Trả về DataFrame mới đã gắn cột total_with_tax',
        inputDescription: 'res.columns',
        expectedOutput: "['price', 'qty', 'total_with_tax']",
        requiredPatterns: ['return df.with_columns'],
      },
    ],
  },
  {
    id: 'ex-s6-polars-lazy-etl',
    title: 'Bài 65: Thiết kế Pipeline ETL Lười (Lazy Evaluation) với pl.scan_parquet() & filter/group_by',
    category: 'architecture',
    stageId: 'stage-6',
    level: 'pro',
    relatedLessonId: 's6-ai-data-automation',
    problemStatement:
      'Nếu bạn dùng `pl.read_parquet("sales_50gb.parquet")` (Eager Mode), máy chủ có 16GB RAM sẽ bị tràn bộ nhớ (`OutOfMemory / OOM Killed`) ngay lập tức vì cố nạp toàn bộ 50GB vào RAM trước khi lọc! Thay vào đó, hãy thiết kế một Pipeline ETL chuẩn **Lazy Evaluation** bằng `pl.scan_parquet(path)`: lọc các đơn hàng có `pl.col("status") == "completed"`, nhóm theo `"region"` bằng `.group_by("region")`, tính tổng doanh thu `.agg(pl.col("revenue").sum())`, và chỉ thu thập kết quả cuối cùng bằng `.collect()`.',
    realWorldContext:
      'Khi dùng `pl.scan_parquet()` trả về một `LazyFrame`, bộ tối ưu hóa của Polars thực hiện **Predicate Pushdown** (đẩy điều kiện lọc `status == "completed"` xuống ngay lúc đọc từng khối Parquet trên đĩa) và **Projection Pushdown** (chỉ đọc đúng 3 cột `status`, `region`, `revenue` thay vì 100 cột), giúp xử lý file 50GB trên laptop 8GB RAM mượt mà!',
    requirements: [
      'Khởi tạo `LazyFrame` bằng `pl.scan_parquet(path)` (không dùng `pl.read_parquet`)',
      'Lọc bằng `.filter(pl.col("status") == "completed")`',
      'Nhóm và tính tổng bằng `.group_by("region").agg(pl.col("revenue").sum())` rồi gọi `.collect()` ở cuối',
    ],
    starterCode: `import polars as pl

def summarize_completed_sales(path: str) -> pl.DataFrame:
    # TODO: Dùng pl.scan_parquet(path) kết hợp .filter(...), .group_by("region"),
    # .agg(pl.col("revenue").sum()) và kết thúc bằng .collect()
    pass
`,
    solutionCode: `import polars as pl

def summarize_completed_sales(path: str) -> pl.DataFrame:
    return (
        pl.scan_parquet(path)
        .filter(pl.col("status") == "completed")
        .group_by("region")
        .agg(pl.col("revenue").sum())
        .collect()
    )
`,
    hints: [
      'Gợi ý 1: Bắt đầu chuỗi truy vấn bằng `pl.scan_parquet(path)` thay vì `read_parquet`.',
      'Gợi ý 2: Nối tiếp `.filter(pl.col("status") == "completed").group_by("region").agg(pl.col("revenue").sum())`.',
      'Gợi ý 3: Gọi `.collect()` ở bước cuối cùng để Polars tối ưu hóa Query Plan và trả về `pl.DataFrame`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Khởi tạo Kế hoạch Truy vấn (Query Plan) với `pl.scan_parquet`',
        codeSnippet: `        pl.scan_parquet(path)\n        .filter(pl.col("status") == "completed")`,
        explanation:
          'Tại thời điểm gọi `scan_parquet` và `filter`, Polars chưa đọc một byte dữ liệu nào từ ổ cứng mà chỉ ghi nhận cây biểu thức để tối ưu hóa.',
      },
      {
        stepTitle: 'Bước 2: Gom nhóm và thực thi bằng `.collect()`',
        codeSnippet: `        .group_by("region")\n        .agg(pl.col("revenue").sum())\n        .collect()`,
        explanation:
          'Khi `.collect()` được gọi, động cơ thực thi đa luồng của Polars sẽ đọc lướt qua file Parquet, bỏ qua các Row Group không chứa `"completed"` nhờ Parquet Metadata, và chỉ giữ bảng kết quả gom nhóm nhỏ gọn trong RAM.',
      },
    ],
    commonMistakes: [
      'Dùng `pl.read_parquet(path)` nạp toàn bộ bảng vào RAM rồi mới `.filter(...)` — cách này làm mất hoàn toàn cơ chế Predicate Pushdown và Projection Pushdown.',
      'Quên gọi `.collect()` ở cuối hàm khi chữ ký hàm yêu cầu trả về `pl.DataFrame` (nếu không `.collect()` thì kiểu trả về vẫn là `pl.LazyFrame`).',
    ],
    testCases: [
      {
        id: 'tc-65-1',
        description: 'Sử dụng pl.scan_parquet(path) kết hợp filter, group_by, agg và collect',
        inputDescription: 'summarize_completed_sales("s3://bucket/sales_2026.parquet")',
        expectedOutput: 'DataFrame(region=["APAC", "EU"], revenue=[125000, 98000])',
        requiredPatterns: [
          'pl.scan_parquet(path)',
          '.filter(pl.col("status") == "completed")',
          '.group_by("region")',
          '.agg(pl.col("revenue").sum())',
          '.collect()',
        ],
        forbiddenPatterns: [
          {
            pattern: 'read_parquet',
            reason: 'Không dùng `read_parquet` (Eager Mode) gây tràn RAM! Hãy dùng `pl.scan_parquet(path)` (Lazy Mode).',
          },
        ],
      },
      {
        id: 'tc-65-2',
        description: 'Trả về kết quả DataFrame sau khi đã .collect()',
        inputDescription: 'type(result)',
        expectedOutput: "<class 'polars.dataframe.frame.DataFrame'>",
        requiredPatterns: ['return', '.collect()'],
      },
    ],
  },
  {
    id: 'ex-s6-rag-cosine-chunker',
    title: 'Bài 66: Xây dựng Hàm Chunking Văn bản có Overlap & Tính Độ tương đồng Cosine cho RAG',
    category: 'code-gym',
    stageId: 'stage-6',
    level: 'master',
    relatedLessonId: 's6-ai-data-automation',
    problemStatement:
      'Trong các hệ thống **RAG (Retrieval-Augmented Generation)** cho AI, nếu bạn cắt tài liệu cứng nhắc không có phần gối đầu (`overlap`), một câu quan trọng nằm ngay vết cắt sẽ bị đứt làm đôi và mất ngữ cảnh! Hãy viết hàm `sliding_window_chunks(words: list[str], chunk_size: int, overlap: int) -> list[str]` sử dụng bước nhảy `step = chunk_size - overlap` và Slicing để nối các từ thành từng đoạn văn bản gối lên nhau. Đồng thời kiểm tra `if overlap >= chunk_size: raise ValueError("overlap must be smaller than chunk_size")` để chống vòng lặp vô tận!',
    realWorldContext:
      'Mọi bộ nạp tài liệu (Document Loader trong LangChain / LlamaIndex) đều dựa trên thuật toán Sliding Window Chunking với `step = chunk_size - overlap` trước khi đưa từng đoạn vào mô hình Embedding.',
    requirements: [
      'Kiểm tra nếu `overlap >= chunk_size` thì `raise ValueError("overlap must be smaller than chunk_size")`',
      'Tính bước nhảy `step = chunk_size - overlap`',
      'Dùng List Comprehension hoặc vòng lặp với `range(0, len(words), step)` để nối `" ".join(words[i : i + chunk_size])`',
    ],
    starterCode: `def sliding_window_chunks(words: list[str], chunk_size: int, overlap: int) -> list[str]:
    # TODO: Kiểm tra nếu overlap >= chunk_size thì raise ValueError(...)
    # Tính step = chunk_size - overlap và trả về danh sách các đoạn nối bằng " ".join(...)
    pass
`,
    solutionCode: `def sliding_window_chunks(words: list[str], chunk_size: int, overlap: int) -> list[str]:
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")
    step = chunk_size - overlap
    return [
        " ".join(words[i : i + chunk_size])
        for i in range(0, len(words), step)
    ]
`,
    hints: [
      'Gợi ý 1: Kiểm tra `if overlap >= chunk_size: raise ValueError("overlap must be smaller than chunk_size")` ngay đầu hàm.',
      'Gợi ý 2: Gán `step = chunk_size - overlap`.',
      'Gợi ý 3: Trả về `[" ".join(words[i : i + chunk_size]) for i in range(0, len(words), step)]`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Bảo vệ hàm khỏi lỗi bước nhảy âm hoặc bằng 0 (`step <= 0`)',
        codeSnippet: `    if overlap >= chunk_size:\n        raise ValueError("overlap must be smaller than chunk_size")\n    step = chunk_size - overlap`,
        explanation:
          'Nếu người dùng truyền `chunk_size=100, overlap=100`, thì `step = 0` sẽ khiến `range(0, len(words), 0)` văng lỗi hoặc vòng lặp `while` bị treo vô tận.',
      },
      {
        stepTitle: 'Bước 2: Cắt cửa sổ trượt (Sliding Window) bằng `range` và Slicing',
        codeSnippet: `    return [\n        " ".join(words[i : i + chunk_size])\n        for i in range(0, len(words), step)\n    ]`,
        explanation:
          'Nhờ tính năng an toàn của Python Slicing, khi `i + chunk_size` vượt quá `len(words)` ở đoạn cuối cùng, Python tự động lấy đến hết danh sách mà không bao giờ ném lỗi `IndexError`!',
      },
    ],
    commonMistakes: [
      'Quên kiểm tra `overlap >= chunk_size`, dẫn đến lỗi khi `step <= 0`.',
      'Cắt văn bản theo số lượng byte (`text.encode("utf-8")[i:i+n]`) thay vì theo từ/token, làm cắt đôi ký tự tiếng Việt đa byte trong UTF-8 và gây lỗi `UnicodeDecodeError`!',
    ],
    testCases: [
      {
        id: 'tc-66-1',
        description: 'Tính đúng step = chunk_size - overlap và cắt cửa sổ trượt bằng range',
        inputDescription: 'sliding_window_chunks(["a", "b", "c", "d", "e"], chunk_size=3, overlap=1)',
        expectedOutput: "['a b c', 'c d e', 'e']",
        requiredPatterns: [
          'overlap >= chunk_size',
          'raise ValueError',
          'step = chunk_size - overlap',
          'range(0, len(words), step)',
          '" ".join(',
        ],
      },
      {
        id: 'tc-66-2',
        description: 'Sử dụng Slicing words[i : i + chunk_size] an toàn',
        inputDescription: 'sliding_window_chunks(["rag", "is", "cool"], chunk_size=2, overlap=1)',
        expectedOutput: "['rag is', 'is cool', 'cool']",
        requiredPatterns: ['i + chunk_size'],
      },
    ],
  },
  {
    id: 'ex-s6-llm-structured-output',
    title: 'Bài 67: Ép Khuôn Đầu ra JSON Chuẩn 100% cho AI Agent bằng Pydantic Schema',
    category: 'architecture',
    stageId: 'stage-6',
    level: 'pro',
    relatedLessonId: 's6-ai-data-automation',
    problemStatement:
      'Khi tích hợp LLM (Gemini, OpenAI, Claude) vào hệ thống Backend, cách làm nghiệp dư là dặn AI bằng lời trong prompt *"Hãy trả về JSON nhé"* rồi dùng `json.loads()` kèm Regex cắt chuỗi. Cách chuẩn công nghiệp hiện đại là truyền trực tiếp một class **Pydantic `BaseModel`** vào tham số `response_schema` (Structured Outputs), sau đó dùng `TicketAnalysis.model_validate_json(raw_json)` để xác thực và ép kiểu trực tiếp ở tầng Rust! Hãy định nghĩa schema `TicketAnalysis` với `sentiment: Literal["positive", "neutral", "negative"]`, `urgency: int = Field(ge=1, le=5)` và hàm `parse_llm_ticket(raw_json: str) -> TicketAnalysis`.',
    realWorldContext:
      'Cả Google GenAI SDK (`response_schema=TicketAnalysis`) và OpenAI SDK (`response_format=TicketAnalysis`) đều dùng chính Pydantic Model của bạn để sinh ra ngữ pháp ràng buộc (Constrained Decoding) ở tầng Token, đảm bảo AI không bao giờ trả về sai trường hay sai kiểu dữ liệu.',
    requirements: [
      'Khai báo `sentiment: Literal["positive", "neutral", "negative"]` trong `TicketAnalysis(BaseModel)`',
      'Khai báo `urgency: int = Field(ge=1, le=5)` và `summary: str`',
      'Trong `parse_llm_ticket(raw_json: str)`, trả về `return TicketAnalysis.model_validate_json(raw_json)` (không dùng `json.loads` thủ công)',
    ],
    starterCode: `import json
from typing import Literal
from pydantic import BaseModel, Field

class TicketAnalysis(BaseModel):
    # TODO: Khai báo sentiment: Literal["positive", "neutral", "negative"],
    # urgency: int = Field(ge=1, le=5), và summary: str
    pass

def parse_llm_ticket(raw_json: str) -> TicketAnalysis:
    # TODO: Dùng TicketAnalysis.model_validate_json(raw_json) thay vì json.loads
    pass
`,
    solutionCode: `from typing import Literal
from pydantic import BaseModel, Field

class TicketAnalysis(BaseModel):
    sentiment: Literal["positive", "neutral", "negative"]
    urgency: int = Field(ge=1, le=5)
    summary: str

def parse_llm_ticket(raw_json: str) -> TicketAnalysis:
    return TicketAnalysis.model_validate_json(raw_json)
`,
    hints: [
      'Gợi ý 1: Xóa `import json` không cần thiết. Trong `TicketAnalysis`, khai báo `sentiment: Literal["positive", "neutral", "negative"]`.',
      'Gợi ý 2: Khai báo tiếp `urgency: int = Field(ge=1, le=5)` và `summary: str`.',
      'Gợi ý 3: Trong `parse_llm_ticket`, viết `return TicketAnalysis.model_validate_json(raw_json)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Khoanh vùng tập giá trị hợp lệ của AI bằng `Literal[...]` và `Field(...)`',
        codeSnippet: `class TicketAnalysis(BaseModel):\n    sentiment: Literal["positive", "neutral", "negative"]\n    urgency: int = Field(ge=1, le=5)\n    summary: str`,
        explanation:
          'Kiểu `Literal["positive", "neutral", "negative"]` được chuyển hóa thành `enum` trong JSON Schema gửi cho LLM, ngăn chặn hoàn toàn việc AI tự bịa ra nhãn lạ như `"very_angry"` hay `"ok"`.',
      },
      {
        stepTitle: 'Bước 2: Giải mã và xác thực JSON 1 bước ở tầng Rust với `model_validate_json`',
        codeSnippet: `def parse_llm_ticket(raw_json: str) -> TicketAnalysis:\n    return TicketAnalysis.model_validate_json(raw_json)`,
        explanation:
          '`TicketAnalysis.model_validate_json(raw_json)` parse chuỗi JSON trực tiếp bằng bộ giải mã `jiter` viết bằng Rust bên trong `pydantic-core`, nhanh gấp 2-3 lần so với việc gọi `TicketAnalysis(**json.loads(raw_json))`!',
      },
    ],
    commonMistakes: [
      'Dùng `sentiment: str` chung chung thay vì `Literal[...]` khiến AI trả về hàng chục biến thể chữ hoa/thường khác nhau làm hỏng nhánh `if/else` phía sau.',
      'Gọi `TicketAnalysis(**json.loads(raw_json))` tốn 2 lần cấp phát bộ nhớ trung gian (`dict` Python) thay vì dùng thẳng `TicketAnalysis.model_validate_json(raw_json)`.',
    ],
    testCases: [
      {
        id: 'tc-67-1',
        description: 'Định nghĩa TicketAnalysis với Literal["positive", "neutral", "negative"] và Field(ge=1, le=5)',
        inputDescription: 'parse_llm_ticket(\'{"sentiment": "negative", "urgency": 5, "summary": "Server down"}\')',
        expectedOutput: "TicketAnalysis(sentiment='negative', urgency=5, summary='Server down')",
        requiredPatterns: [
          'Literal["positive", "neutral", "negative"]',
          'Field(ge=1, le=5)',
          'summary: str',
        ],
      },
      {
        id: 'tc-67-2',
        description: 'Sử dụng TicketAnalysis.model_validate_json(raw_json) thay vì json.loads',
        inputDescription: 'TicketAnalysis.model_validate_json',
        expectedOutput: '<bound method BaseModel.model_validate_json>',
        requiredPatterns: ['TicketAnalysis.model_validate_json(raw_json)'],
        forbiddenPatterns: [
          {
            pattern: 'json.loads',
            reason: 'Hãy dùng trực tiếp `TicketAnalysis.model_validate_json(raw_json)` (parse bằng Rust) thay vì `json.loads`!',
          },
        ],
      },
    ],
  },
  {
    id: 'ex-s7-fastapi-lifespan',
    title: 'Bài 68: Thay thế @app.on_event Lỗi thời bằng Quản lý Vòng đời lifespan Chuẩn Production',
    category: 'debug-rescue',
    stageId: 'stage-7',
    level: 'master',
    relatedLessonId: 's7-production-architecture',
    problemStatement:
      'Trong các hướng dẫn FastAPI cũ, người ta thường dùng `@app.on_event("startup")` và `@app.on_event("shutdown")`. Tuy nhiên cơ chế này đã chính thức bị **Deprecated (Ngừng khuyến khích)** vì không thể chia sẻ biến tài nguyên cục bộ giữa pha khởi động và pha tắt máy mà không dùng biến toàn cục (`global`), đồng thời không đảm bảo dọn dẹp nếu pha startup gặp lỗi giữa chừng! Hãy viết lại quản lý vòng đời ứng dụng bằng `@asynccontextmanager` trên hàm `async def lifespan(app: FastAPI):` khởi tạo `app.state.redis = {"connected": True}`, chạy `yield`, rồi đặt `app.state.redis["connected"] = False` khi tắt server, và truyền `FastAPI(lifespan=lifespan)`.',
    realWorldContext:
      'Trong môi trường Kubernetes / Docker Production, khi Pod nhận tín hiệu `SIGTERM` để滾 (Rolling Update), hàm `lifespan` sau từ khóa `yield` là nơi duy nhất đảm bảo đóng sạch Database Pool, xả hết log OpenTelemetry và đóng kết nối Redis trước khi container tắt hẳn.',
    requirements: [
      'Gắn decorator `@asynccontextmanager` (từ `contextlib`) lên `async def lifespan(app: FastAPI):`',
      'Khởi tạo `app.state.redis = {"connected": True}` trước `yield` và đặt `app.state.redis["connected"] = False` sau `yield`',
      'Khởi tạo ứng dụng bằng `app = FastAPI(lifespan=lifespan)` (tuyệt đối không dùng `@app.on_event`)',
    ],
    starterCode: `from contextlib import asynccontextmanager
from fastapi import FastAPI

# CODE CŨ LỖI THỜI (DEPRECATED): Dùng @app.on_event("startup") và ("shutdown")
app = FastAPI()

@app.on_event("startup")
async def startup_event() -> None:
    app.state.redis = {"connected": True}

@app.on_event("shutdown")
async def shutdown_event() -> None:
    app.state.redis["connected"] = False

# TODO: Xóa @app.on_event ở trên, viết hàm @asynccontextmanager async def lifespan(app: FastAPI):
# có yield ở giữa, và khởi tạo app = FastAPI(lifespan=lifespan)
`,
    solutionCode: `from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = {"connected": True}
    yield
    app.state.redis["connected"] = False

app = FastAPI(lifespan=lifespan)
`,
    hints: [
      'Gợi ý 1: Đặt `@asynccontextmanager` ngay phía trên `async def lifespan(app: FastAPI):`.',
      'Gợi ý 2: Bên trong `lifespan`, gán `app.state.redis = {"connected": True}`, xuống dòng viết `yield`, rồi xuống dòng gán `app.state.redis["connected"] = False`.',
      'Gợi ý 3: Xóa toàn bộ các hàm `@app.on_event` cũ và khởi tạo `app = FastAPI(lifespan=lifespan)` ở cuối file.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Gom trọn Startup và Shutdown vào một `@asynccontextmanager` duy nhất',
        codeSnippet: `@asynccontextmanager\nasync def lifespan(app: FastAPI):\n    app.state.redis = {"connected": True}\n    yield\n    app.state.redis["connected"] = False`,
        explanation:
          'Mọi câu lệnh trước `yield` được thực thi đúng 1 lần trước khi FastAPI bắt đầu nhận HTTP Request đầu tiên. Sau đó hàm tạm dừng tại `yield` trong suốt nhiều tháng server hoạt động, và chỉ chạy phần sau `yield` khi Uvicorn nhận tín hiệu dừng (`SIGINT`/`SIGTERM`).',
      },
      {
        stepTitle: 'Bước 2: Gắn `lifespan` vào đối tượng `FastAPI(lifespan=lifespan)`',
        codeSnippet: `app = FastAPI(lifespan=lifespan)`,
        explanation:
          'Giao thức ASGI Lifespan Protocol đảm bảo ngay cả khi bạn chạy Integration Test với `with TestClient(app) as client:`, cả pha khởi tạo lẫn pha dọn dẹp đều được kích hoạt chuẩn xác.',
      },
    ],
    commonMistakes: [
      'Vẫn dùng `@app.on_event("startup")` do copy từ các bài viết cũ hoặc câu trả lời của LLM được huấn luyện trên dữ liệu cũ.',
      'Khai báo cả `FastAPI(lifespan=lifespan)` lẫn `@app.on_event("startup")` cùng lúc — khi có `lifespan`, FastAPI sẽ bỏ qua hoàn toàn mọi hàm `on_event`!',
    ],
    testCases: [
      {
        id: 'tc-68-1',
        description: 'Sử dụng @asynccontextmanager async def lifespan(app: FastAPI): và yield',
        inputDescription: 'async with lifespan(app): app.state.redis["connected"]',
        expectedOutput: 'True (during yield) -> False (after exit)',
        requiredPatterns: [
          '@asynccontextmanager',
          'async def lifespan(app: FastAPI):',
          'app.state.redis = {"connected": True}',
          'yield',
          'app.state.redis["connected"] = False',
        ],
        forbiddenPatterns: [
          {
            pattern: 'on_event',
            reason: '`@app.on_event` đã bị Deprecated trong FastAPI! Hãy xóa nó và dùng `FastAPI(lifespan=lifespan)`.',
          },
        ],
      },
      {
        id: 'tc-68-2',
        description: 'Đăng ký lifespan vào hàm khởi tạo FastAPI(lifespan=lifespan)',
        inputDescription: 'app.router.lifespan_context',
        expectedOutput: '<function lifespan>',
        requiredPatterns: ['app = FastAPI(lifespan=lifespan)'],
      },
    ],
  },
  {
    id: 'ex-s7-timing-attack-secret',
    title: 'Bài 69: Chống Tấn công Đo Thời gian (Timing Attack) khi Kiểm tra Webhook Signature với hmac.compare_digest',
    category: 'debug-rescue',
    stageId: 'stage-7',
    level: 'master',
    relatedLessonId: 's7-production-architecture',
    problemStatement:
      'Khi viết API nhận Webhook từ Stripe, GitHub hoặc cổng thanh toán ngân hàng, một lỗ hổng bảo mật cực kỳ tinh vi là dùng toán tử `==` thông thường (`if computed_sig == header_sig:`) để so sánh chữ ký HMAC hoặc API Token! Toán tử `==` trên chuỗi sẽ **dừng ngay lập tức ở ký tự đầu tiên khác nhau** (Short-circuit Evaluation): nếu chữ ký sai ngay ký tự đầu thì mất `5ns`, nếu đúng 10 ký tự đầu thì mất `50ns`. Kẻ tấn công chỉ cần đo thống kê thời gian phản hồi để đoán đúng từng ký tự một của chữ ký mà không cần biết khóa bí mật! Hãy vá lỗ hổng này bằng cách dùng hàm so sánh thời gian hằng số `hmac.compare_digest(expected_sig, provided_sig)`.',
    realWorldContext:
      'Trong mật mã học và bảo mật Production (OWASP Top 10), mọi phép so sánh API Key, Webhook HMAC Signature, CSRF Token bắt buộc phải dùng Constant-Time Comparison (`hmac.compare_digest` hoặc `secrets.compare_digest`).',
    requirements: [
      'Không sử dụng toán tử `==` hoặc `!=` để so sánh hai chuỗi chữ ký mật mã',
      'Tính chữ ký kỳ vọng bằng `hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()`',
      'So sánh an toàn bằng `return hmac.compare_digest(expected_sig, provided_sig)`',
    ],
    starterCode: `import hashlib
import hmac

def verify_webhook_signature(payload: str, provided_sig: str, secret: str) -> bool:
    expected_sig = hmac.new(
        secret.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()
    # LỖ HỔNG TIMING ATTACK: Dùng toán tử == rò rỉ độ dài tiền tố khớp qua thời gian xử lý!
    # TODO: Thay thế phép so sánh == bên dưới bằng hmac.compare_digest(expected_sig, provided_sig)
    return expected_sig == provided_sig
`,
    solutionCode: `import hashlib
import hmac

def verify_webhook_signature(payload: str, provided_sig: str, secret: str) -> bool:
    expected_sig = hmac.new(
        secret.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_sig, provided_sig)
`,
    hints: [
      'Gợi ý 1: Giữ nguyên phần tính `expected_sig` bằng `hmac.new(...).hexdigest()`.',
      'Gợi ý 2: Xóa dòng `return expected_sig == provided_sig`.',
      'Gợi ý 3: Thay bằng `return hmac.compare_digest(expected_sig, provided_sig)`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Tạo chữ ký chuẩn HMAC-SHA256 từ Payload và Secret',
        codeSnippet: `    expected_sig = hmac.new(\n        secret.encode(), payload.encode(), hashlib.sha256\n    ).hexdigest()`,
        explanation:
          'Hàm `hmac.new` kết hợp khóa bí mật (`secret`) và nội dung bản tin (`payload`) qua hàm băm một chiều SHA-256 để tạo ra mã xác thực thông điệp dạng thập lục phân (64 ký tự hex).',
      },
      {
        stepTitle: 'Bước 2: So sánh trong thời gian hằng số với `hmac.compare_digest`',
        codeSnippet: `    return hmac.compare_digest(expected_sig, provided_sig)`,
        explanation:
          'Hàm C nội bộ `hmac.compare_digest` dùng phép toán bitwise XOR (`a ^ b`) duyệt qua TOÀN BỘ tất cả các byte của hai chuỗi rồi mới kết luận, đảm bảo dù sai ở ký tự thứ 1 hay ký tự thứ 63 thì thời gian CPU tiêu tốn vẫn bằng nhau tuyệt đối!',
      },
    ],
    commonMistakes: [
      'Dùng `expected_sig == provided_sig` vì thói quen so sánh chuỗi thông thường — mở toang cánh cửa cho tấn công Side-Channel Timing Attack.',
      'Dùng `hashlib.sha256((secret + payload).encode()).hexdigest()` thay vì `hmac.new(...)` — cách nối chuỗi thủ công `secret + payload` bị dính lỗ hổng mật mã kinh điển **Length Extension Attack**!',
    ],
    testCases: [
      {
        id: 'tc-69-1',
        description: 'Sử dụng hmac.compare_digest thay cho toán tử == để chống Timing Attack',
        inputDescription: 'verify_webhook_signature(\'{"id": 1}\', valid_sig, "whsec_123")',
        expectedOutput: 'True',
        requiredPatterns: [
          'hmac.new(',
          'hashlib.sha256',
          '.hexdigest()',
          'hmac.compare_digest(expected_sig, provided_sig)',
        ],
        forbiddenPatterns: [
          {
            pattern: 'expected_sig ==',
            reason: 'CẤM KỴ BẢO MẬT: Không dùng toán tử `==` để so sánh chữ ký mật mã (dính lỗi Timing Attack)! Hãy dùng `hmac.compare_digest`.',
          },
          {
            pattern: '== provided_sig',
            reason: 'CẤM KỴ BẢO MẬT: Không dùng toán tử `==` để so sánh chữ ký mật mã! Hãy dùng `hmac.compare_digest`.',
          },
        ],
      },
      {
        id: 'tc-69-2',
        description: 'Trả về kết quả boolean trực tiếp từ hmac.compare_digest',
        inputDescription: 'verify_webhook_signature(\'{"id": 1}\', "forged_sig", "whsec_123")',
        expectedOutput: 'False',
        requiredPatterns: ['return hmac.compare_digest(expected_sig, provided_sig)'],
      },
    ],
  },
  {
    id: 'ex-s7-rate-limiter-sliding',
    title: 'Bài 70: Thiết kế Bộ Giới hạn Tải (Rate Limiter) Chống DDoS & Cache Stampede',
    category: 'architecture',
    stageId: 'stage-7',
    level: 'master',
    relatedLessonId: 's7-production-architecture',
    problemStatement:
      'Bài tập Tốt nghiệp (Bài #70): Để bảo vệ hệ thống Production khỏi bị tấn công Brute-force, DDoS hoặc một khách hàng gọi API quá giới hạn cho phép, bạn cần xây dựng bộ giới hạn tốc độ theo thuật toán **Sliding Window Log (Cửa sổ trượt)** bằng cấu trúc dữ liệu `collections.deque` đạt độ phức tạp $O(1)$ mỗi thao tác! Hãy hoàn thiện lớp `SlidingWindowRateLimiter`: với mỗi request của `user_id` tại thời điểm `now: float`, trước tiên loại bỏ toàn bộ các dấu thời gian cũ đã nằm ngoài cửa sổ (`while q and now - q[0] >= self.window_seconds: q.popleft()`), sau đó nếu `len(q) >= self.max_requests` thì trả về `False` (chặn request - HTTP 429), ngược lại thêm `q.append(now)` và trả về `True`!',
    realWorldContext:
      'Thuật toán Sliding Window Rate Limiter này chính là nguyên lý cốt lõi đằng sau các hệ thống API Gateway (Cloudflare, Kong, Envoy) và Redis Sorted Set (`ZREMRANGEBYSCORE` + `ZCARD` + `ZADD`) bảo vệ các dịch vụ quy mô hàng triệu người dùng.',
    requirements: [
      'Sử dụng `defaultdict(deque)` để lưu lịch sử timestamp của từng `user_id`',
      'Dọn dẹp các timestamp hết hạn ở đầu hàng đợi bằng vòng lặp `while q and now - q[0] >= self.window_seconds: q.popleft()`',
      'Kiểm tra nếu `len(q) >= self.max_requests` thì trả về `False`, ngược lại gọi `q.append(now)` và trả về `True`',
    ],
    starterCode: `from collections import defaultdict, deque

class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.history: dict[str, deque[float]] = defaultdict(deque)

    def allow_request(self, user_id: str, now: float) -> bool:
        q = self.history[user_id]
        # TODO:
        # 1. Dùng vòng lặp while q and now - q[0] >= self.window_seconds: gọi q.popleft()
        # 2. Nếu len(q) >= self.max_requests thì return False
        # 3. Ngược lại q.append(now) và return True
        pass
`,
    solutionCode: `from collections import defaultdict, deque

class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.history: dict[str, deque[float]] = defaultdict(deque)

    def allow_request(self, user_id: str, now: float) -> bool:
        q = self.history[user_id]
        while q and now - q[0] >= self.window_seconds:
            q.popleft()
        if len(q) >= self.max_requests:
            return False
        q.append(now)
        return True
`,
    hints: [
      'Gợi ý 1: Vì các timestamp được thêm theo thứ tự thời gian tăng dần, các timestamp cũ nhất luôn nằm ở đầu hàng đợi `q[0]`. Hãy viết `while q and now - q[0] >= self.window_seconds:\n            q.popleft()`.',
      'Gợi ý 2: Sau khi đã dọn sạch các request cũ, kiểm tra `if len(q) >= self.max_requests:\n            return False`.',
      'Gợi ý 3: Nếu chưa vượt ngưỡng, ghi nhận request hiện tại bằng `q.append(now)` và `return True`.',
    ],
    solutionWalkthrough: [
      {
        stepTitle: 'Bước 1: Trượt cửa sổ thời gian với độ phức tạp $O(1)$ nhờ `deque.popleft()`',
        codeSnippet: `        q = self.history[user_id]\n        while q and now - q[0] >= self.window_seconds:\n            q.popleft()`,
        explanation:
          'Mỗi timestamp chỉ được `append` vào cuối `deque` tối đa 1 lần và `popleft` khỏi đầu `deque` tối đa 1 lần. Do đó chi phí trung bình (Amortized Time Complexity) cho mỗi lần kiểm tra `allow_request` là $O(1)$!',
      },
      {
        stepTitle: 'Bước 2: Chặn đứng quá tải và ghi nhận dấu thời gian mới',
        codeSnippet: `        if len(q) >= self.max_requests:\n            return False\n        q.append(now)\n        return True`,
        explanation:
          'Khác với Fixed Window Counter (dễ bị lách luật gấp đôi tải ở ranh giới chuyển phút như giây thứ 59 và giây thứ 61), Sliding Window Log kiểm tra chính xác khoảng `[now - window_seconds, now]` tại mọi thời điểm.',
      },
    ],
    commonMistakes: [
      'Dùng `list` thông thường và gọi `q.pop(0)` — phép xóa phần tử đầu tiên của `list` có độ phức tạp $O(N)$ khiến chính bộ Rate Limiter trở thành điểm nghẽn CPU khi bị DDoS!',
      'Gọi `q.append(now)` TRƯỚC khi kiểm tra `len(q) >= self.max_requests`, khiến cả những request bị từ chối (HTTP 429) cũng làm đầy hàng đợi và khóa vĩnh viễn người dùng dù họ chỉ thử lại.',
    ],
    testCases: [
      {
        id: 'tc-70-1',
        description: 'Loại bỏ các dấu thời gian hết hạn ở đầu hàng đợi bằng q.popleft()',
        inputDescription: 'limiter = SlidingWindowRateLimiter(2, 10.0); [limiter.allow_request("u1", t) for t in [1.0, 2.0, 3.0, 12.0]]',
        expectedOutput: '[True, True, False, True]',
        requiredPatterns: [
          'while q and now - q[0] >= self.window_seconds:',
          'q.popleft()',
          'if len(q) >= self.max_requests:',
          'return False',
        ],
        forbiddenPatterns: [
          {
            pattern: '.pop(0)',
            reason: 'Không dùng `.pop(0)` tốn $O(N)$! Hãy dùng `q.popleft()` của `collections.deque` đạt $O(1)$.',
          },
        ],
      },
      {
        id: 'tc-70-2',
        description: 'Ghi nhận request hợp lệ bằng q.append(now) và trả về True',
        inputDescription: 'limiter.allow_request("u1", 15.0)',
        expectedOutput: 'True',
        requiredPatterns: ['q.append(now)', 'return True'],
      },
    ],
  },
];

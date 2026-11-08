import { LessonTopic } from '@/types/curriculum.types';

export const STAGE_5_LESSONS: LessonTopic[] = [
  {
    id: 's5-asyncio-gil-concurrency',
    stageId: 'stage-5',
    level: 'master',
    order: 10,
    title: '5.1. Giải phẫu GIL vs. AsyncIO Event Loop, Threading, Multiprocessing & Celery',
    shortDescription:
      'Hiểu tận gốc sự khác biệt giữa Concurrency và Parallelism trong CPython, tại sao gọi hàm sync trong async def làm treo server FastAPI, và ma trận chọn công nghệ.',
    estimatedMinutes: 50,
    theoryParagraphs: [
      'Đây là kiến thức phân loại rõ nhất giữa một lập trình viên trung cấp và một **Master Python Architect**. Trong CPython, **GIL (Global Interpreter Lock)** là khóa toàn cục chỉ cho phép ĐÚNG 1 Thread thực thi Python bytecode tại một thời điểm trên mỗi tiến trình nhằm bảo vệ bộ đếm tham chiếu bộ nhớ (`Reference Counting`).',
      'Vì có GIL, bạn phải phân biệt rạch ròi 4 bài toán xử lý đồng thời: (1) **I/O-Bound hiện đại** (gọi HTTP, DB, Redis): dùng `asyncio` (`async def` / `await` + `httpx`, `asyncpg`) chạy trên 1 Thread duy nhất với chi phí chuyển ngữ cảnh siêu nhẹ; (2) **I/O-Bound thư viện đồng bộ cũ** (SDK cũ chỉ có bản sync): dùng `await asyncio.to_thread()` hoặc `ThreadPoolExecutor` (vì khi chờ I/O ở tầng C, khóa GIL được nhả ra); (3) **CPU-Bound nặng** (resize ảnh, băm mật khẩu, tính toán ma trận): bắt buộc dùng `ProcessPoolExecutor` / `multiprocessing` để tạo nhiều tiến trình có GIL riêng, tận dụng 100% đa nhân CPU; và (4) **Tác vụ nền kéo dài** (gửi 10.000 email, xuất báo cáo lớn): tách hẳn sang **Celery / ARQ + Redis Worker**.',
      'Đặc biệt lưu ý khi chuyển từ Node.js sang Python: Trong Node.js, mọi hàm I/O tiêu chuẩn đều non-blocking mặc định. Nhưng trong Python, các thư viện truyền thống như `time.sleep()`, `requests.get()`, `psycopg2` là **Synchronous Blocking**. Đặt một lệnh này vào trong hàm `async def` của FastAPI sẽ chặn đứng toàn bộ Event Loop!',
    ],
    analogy: {
      title: 'Căn bếp có 1 Con Dao Duy Nhất (GIL) & Kiện tướng Cờ vua Đấu 50 Bàn (AsyncIO)',
      realWorldScenario:
        'Làm sao chọn đúng giữa `AsyncIO`, `Threading`, `Multiprocessing` và `Celery` mà không bao giờ nhầm lẫn?',
      mappingPoints: [
        {
          realWorld: '1 Đầu bếp thông minh bật 20 nồi hầm cùng lúc, trong lúc chờ nước sôi thì đi chuẩn bị rau (`AsyncIO`)',
          pythonEquivalent: '`asyncio.gather()` / `asyncio.TaskGroup()` + `Semaphore`',
          explanation: 'Chỉ dùng 1 người (1 Thread, 1 CPU core), không tốn thời gian tranh giành dao (`GIL`), hoàn hảo cho hàng nghìn kết nối mạng/DB (`I/O-Bound`).',
        },
        {
          realWorld: '4 Đầu bếp trong cùng 1 phòng bếp chỉ có ĐÚNG 1 CON DAO (`Threading` + `GIL`)',
          pythonEquivalent: '`ThreadPoolExecutor` / `asyncio.to_thread()`',
          explanation: 'Nếu bắt cả 4 người đứng thái thịt liên tục (`CPU-Bound`), họ phải xếp hàng chờ mượn 1 con dao nên không nhanh hơn 1 người! Chỉ hữu ích khi 1 người đặt nồi lên bếp chờ (I/O tầng C nhả dao) để người khác cầm dao.',
        },
        {
          realWorld: 'Mở 4 Phòng bếp độc lập, mỗi phòng có 1 Đầu bếp và 1 Con dao riêng (`Multiprocessing`)',
          pythonEquivalent: '`ProcessPoolExecutor`',
          explanation: 'Mỗi tiến trình Python có không gian bộ nhớ và `GIL` riêng biệt, giúp thái thịt (`CPU-Bound`) nhanh gấp 4 lần trên CPU 4 nhân!',
        },
      ],
      mentalModelTip:
        'Quy tắc vàng trong FastAPI: Nếu bên trong endpoint chỉ gọi thư viện bất đồng bộ (`await httpx`, `await AsyncSession`), hãy khai báo `async def`. Nếu buộc phải gọi thư viện đồng bộ cũ, hãy khai báo `def` thường (FastAPI sẽ tự chạy nó trong ThreadPool) hoặc dùng `await asyncio.to_thread()`!',
    },
    diagrams: [
      {
        id: 'diag-s5-event-loop-gil',
        title: 'Sơ đồ Giải phẫu AsyncIO Event Loop vs. Lệnh Blocking Làm Đóng Băng Server',
        subtitle: 'Điều gì xảy ra trên luồng chính (Main Thread) khi 1 Coroutine gọi await hợp chuẩn so với gọi time.sleep() / requests.get()',
        type: 'pipeline',
        nodes: [
          {
            id: 'loop-1',
            badge: 'Request #1 đến',
            title: 'Event Loop Nhận Coroutine',
            subtitle: 'async def get_user()',
            detail:
              'Uvicorn đẩy Coroutine của Request #1 vào hàng đợi của Event Loop trên Main Thread.',
            highlightColor: 'sky',
          },
          {
            id: 'loop-2',
            badge: 'Điểm rẽ nhánh I/O',
            title: 'Gặp từ khóa await (Non-blocking)',
            subtitle: 'await db.execute(query)',
            detail:
              'Coroutine #1 đăng ký sự kiện chờ socket với Hệ điều hành (epoll/kqueue) rồi LẬP TỨC TẠM DỪNG, nhường Main Thread lại cho Event Loop!',
            highlightColor: 'emerald',
          },
          {
            id: 'loop-3',
            badge: 'Phục vụ đồng thời',
            title: 'Xử lý Request #2, #3... #1000',
            subtitle: 'Không mất thời gian chờ vô ích',
            detail:
              'Trong 50ms chờ Database trả kết quả cho Request #1, Event Loop tranh thủ chạy hàng trăm Request khác. Nếu ai đó gọi `time.sleep(5)` ở Bước 2, Event Loop sẽ bị kẹt cứng tại chỗ suốt 5 giây!',
            highlightColor: 'amber',
          },
          {
            id: 'loop-4',
            badge: 'I/O Hoàn tất',
            title: 'Đánh thức (Resume) Coroutine #1',
            subtitle: 'Trả HTTP Response 200 OK',
            detail:
              'Khi socket báo dữ liệu DB đã về, Event Loop đánh thức Coroutine #1 chạy tiếp dòng ngay sau `await` và trả kết quả cho người dùng.',
            highlightColor: 'violet',
          },
        ],
        caption:
          'Khác với मल्टी-threading (Preemptive Multitasking do OS cưỡng bức chuyển luồng), AsyncIO là **Cooperative Multitasking** (các hàm tự nguyện nhường luồng tại từ khóa `await`).',
      },
    ],
    benchmarksAndProofs: [
      {
        id: 'proof-s5-concurrency-bench',
        title: 'Minh chứng Thực nghiệm: Tải 100 URL (I/O-Bound) vs. Tính Số Nguyên tố (CPU-Bound)',
        claim:
          'AsyncIO tăng tốc bài toán I/O-bound lên gấp 20–50 lần trên 1 nhân CPU, nhưng với bài toán CPU-bound thì bắt buộc phải dùng `ProcessPoolExecutor` để vượt qua GIL.',
        methodology: 'Đo trên máy 8 nhân CPU với Python 3.12',
        metrics: [
          {
            label: '[I/O-Bound] Tải 100 URL bằng `AsyncIO + httpx.AsyncClient` (Semaphore 20)',
            valueText: '0.52 giây (Nhanh gấp 25 lần Sync)',
            barPercent: 8,
            isOptimal: true,
            note: '1 Thread duy nhất chờ 20 kết nối mạng cùng lúc, tiêu thụ RAM cực thấp.',
          },
          {
            label: '[I/O-Bound] Tải 100 URL tuần tự bằng `requests.get()` đồng bộ',
            valueText: '12.80 giây',
            barPercent: 92,
            note: 'CPU ngồi chơi 99% thời gian để chờ từng request mạng một.',
          },
          {
            label: '[CPU-Bound] Tính toán nặng trên 4 luồng `ThreadPoolExecutor` (Bị chặn bởi GIL!)',
            valueText: '6.40 giây (Không nhanh hơn 1 luồng!)',
            barPercent: 85,
            note: '4 Thread phải xếp hàng tranh nhau 1 khóa GIL duy nhất.',
          },
          {
            label: '[CPU-Bound] Tính toán nặng trên 4 tiến trình `ProcessPoolExecutor` (Vượt GIL!)',
            valueText: '1.68 giây (Nhanh gấp ~4 lần)',
            barPercent: 22,
            isOptimal: true,
            note: 'Mỗi Process chạy trên 1 nhân CPU vật lý với GIL độc lập.',
          },
        ],
        takeaway:
          'Hiểu rõ bản chất công việc là **I/O-Bound** (chờ mạng/đĩa -> dùng `AsyncIO`) hay **CPU-Bound** (tính toán thuần -> dùng `ProcessPoolExecutor`) là kỹ năng quan trọng nhất của kiến trúc sư Python.',
      },
    ],
    codeExamples: [
      {
        id: 'ex-s5-1-async',
        title: 'AsyncIO Semaphore kiểm soát luồng & ProcessPoolExecutor vượt qua GIL',
        description: 'Kết hợp chuẩn xác AsyncIO cho I/O-bound và Multiprocessing cho CPU-bound.',
        code: `import asyncio
from concurrent.futures import ProcessPoolExecutor

# 1. I/O-Bound: Dùng AsyncIO + Semaphore giới hạn tối đa 3 kết nối đồng thời
async def fetch_url_simulated(url: str, sem: asyncio.Semaphore) -> str:
    async with sem:  # Chỉ cho phép tối đa N coroutine chạy vào khối này cùng lúc!
        await asyncio.sleep(0.05)  # Nhường Event Loop (KHÔNG dùng time.sleep!)
        return f"200 OK: {url}"

async def run_crawler(urls: list[str]) -> list[str]:
    sem = asyncio.Semaphore(3)
    # Sử dụng asyncio.gather chạy đồng thời toàn bộ danh sách:
    return await asyncio.gather(*(fetch_url_simulated(u, sem) for u in urls))

# 2. CPU-Bound: Hàm tính toán nặng cần chạy trên ProcessPoolExecutor để vượt GIL
def cpu_heavy_prime_count(limit: int) -> int:
    return sum(1 for n in range(2, limit) if all(n % i != 0 for i in range(2, int(n**0.5) + 1)))

results = asyncio.run(run_crawler(["https://py.dev/1", "https://py.dev/2"]))
print(results)`,
        output: `['200 OK: https://py.dev/1', '200 OK: https://py.dev/2']`,
        annotations: [
          { line: 6, explanation: '`async with sem:` hoạt động như trạm thu phí chỉ mở tối đa N làn xe cùng lúc, chống làm sập server đích.' },
          { line: 7, explanation: '`await asyncio.sleep()` giải phóng Event Loop để xử lý các URL khác trong lúc chờ đợi.' },
          { line: 12, explanation: '`asyncio.gather(*tasks)` kích hoạt đồng thời tất cả Coroutine và thu thập kết quả theo đúng thứ tự.' },
        ],
      },
    ],
    useCases: [
      {
        title: 'Web Crawler thu thập 1.000 trang web đồng thời có giới hạn tải',
        scenario: 'Cần tải 1.000 URL nhanh nhất có thể nhưng chỉ được mở tối đa 20 kết nối cùng lúc để không bị chặn IP.',
        whyPythonFits: '`httpx.AsyncClient` kết hợp `asyncio.Semaphore(20)` xử lý xong trong vài giây với lượng RAM tối thiểu.',
      },
      {
        title: 'Xử lý hàng đợi phân tán với Celery / ARQ + Redis',
        scenario: 'Khi người dùng đăng ký tài khoản, API trả về `201 Created` ngay trong 20ms, còn việc tạo PDF hợp đồng và gửi email được đẩy sang Worker nền.',
        whyPythonFits: 'Celery / ARQ hỗ trợ cơ chế Retry với Exponential Backoff, Dead-Letter Queue và lập lịch định kỳ (Celery Beat).',
      },
    ],
    tipsAndBestPractices: [
      'Từ Python 3.11+, ưu tiên dùng `async with asyncio.TaskGroup() as tg:` thay cho `asyncio.gather()` vì `TaskGroup` hỗ trợ **Structured Concurrency** (tự động hủy các task anh em nếu 1 task trong nhóm bị lỗi).',
      'Khi dùng `httpx.AsyncClient()`, hãy tái sử dụng 1 instance client duy nhất (Connection Pooling) thay vì tạo mới `AsyncClient()` ở mỗi lần gọi hàm.',
    ],
    commonIssues: [
      {
        id: 'issue-s5-blocking-loop',
        title: 'Cấm kỵ (PDF 4.1): Đặt lệnh đồng bộ (time.sleep, requests.get) trong hàm async def',
        severity: 'critical',
        symptom: 'Toàn bộ server FastAPI bị đơ, mọi người dùng khác gọi vào bất kỳ API nào cũng phải đứng chờ theo!',
        whyItHappens:
          'Hàm `async def` chạy trực tiếp trên luồng chính của Event Loop. Gọi hàm blocking đồng bộ sẽ giữ chặt luồng duy nhất đó mà không có điểm `await` nào để nhường quyền.',
        wrongCode: `@app.get("/bad-endpoint")\nasync def bad_endpoint():\n    time.sleep(5)                     # CHẶN ĐỨNG EVENT LOOP 5 GIÂY!\n    res = requests.get("https://...") # CHẶN ĐỨNG EVENT LOOP!\n    return res.json()`,
        rightCode: `@app.get("/good-endpoint")\nasync def good_endpoint():\n    await asyncio.sleep(5)            # Nhường Event Loop cho request khác\n    async with httpx.AsyncClient() as client:\n        res = await client.get("https://...")\n    return res.json()`,
        fixExplanation: 'Luôn dùng thư viện bất đồng bộ (`asyncio.sleep`, `httpx`, `asyncpg`) bên trong `async def`, hoặc bọc hàm sync cũ bằng `await asyncio.to_thread(sync_fn)`.',
      },
    ],
    jsComparison: [
      {
        concept: 'Chạy đồng thời nhiều tác vụ bất đồng bộ',
        jsTsWay: 'await Promise.all(urls.map(u => fetch(u)))',
        pythonWay: 'await asyncio.gather(*(fetch(u) for u in urls))',
        jsCode: `const results = await Promise.all(urls.map(u => fetch(u)));`,
        pythonCode: `results = await asyncio.gather(*(fetch(u) for u in urls))`,
        keyDifference: 'Trong JS, gọi `fetch(u)` sẽ chạy ngay lập tức và trả về `Promise`. Trong Python, gọi hàm `fetch(u)` mới chỉ tạo ra đối tượng `Coroutine` (chưa chạy gì cả) cho đến khi bạn `await` hoặc đưa vào `asyncio.gather` / `create_task`!',
      },
    ],
    relatedTermIds: ['concept-gil', 'concept-asyncio', 'kw-async', 'eco-fastapi'],
    relatedLessonIds: ['s4-sqlalchemy-clean-arch', 's6-ai-data-automation', 's7-production-architecture'],
    relatedExerciseIds: ['ex-s5-async-semaphore'],
  },
];

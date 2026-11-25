export interface StdlibVsThirdPartyRow {
  id: string;
  taskCategory: string;
  stdlibModules: string[];
  stdlibScope: string;
  whenToSwitch: string;
  thirdPartyLibs: {
    name: string;
    role: string;
  }[];
}

export interface DomainPipelineStage {
  stepNumber: number;
  stageName: string;
  libraries: string[];
  whatItDoes: string;
  whatItDoesNotDo: string;
  isStdlibAvailable?: string;
}

export interface ApplicationDomainStack {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  overview: string;
  whenNoExternalLibNeeded: string;
  pipelineStages: DomainPipelineStage[];
}

export const STDLIB_VS_THIRD_PARTY_BOUNDARIES: StdlibVsThirdPartyRow[] = [
  {
    id: 'b-file-config',
    taskCategory: '1. File, Đường dẫn, JSON, CSV & Cấu hình',
    stdlibModules: ['pathlib', 'json', 'csv', 'tomllib', 'shutil'],
    stdlibScope:
      'Đủ 100% để đọc/ghi file văn bản, nối đường dẫn đa hệ điều hành, đọc cấu hình .json / .toml và xử lý bảng .csv dưới vài chục nghìn dòng.',
    whenToSwitch:
      'Khi cần đọc file Excel (.xlsx), xử lý bảng dữ liệu lớn hàng triệu dòng, hoặc tự động kiểm tra kiểu dữ liệu biến môi trường (.env).',
    thirdPartyLibs: [
      { name: 'pydantic-settings', role: 'Đọc & kiểm tra kiểu biến môi trường .env' },
      { name: 'polars / pandas', role: 'Xử lý bảng CSV/Excel/Parquet lớn siêu tốc' },
      { name: 'orjson', role: 'Parse/dump JSON nhanh gấp 5–10 lần cho API tải cao' },
    ],
  },
  {
    id: 'b-http-network',
    taskCategory: '2. Gọi API Mạng (HTTP Client)',
    stdlibModules: ['urllib.request', 'http.client'],
    stdlibScope:
      'Chỉ phù hợp cho script nhỏ gọi 1–2 URL đơn giản trên máy không được phép cài thêm thư viện ngoài.',
    whenToSwitch:
      'Gần như ngay lập tức trong dự án thực tế: khi cần giữ kết nối (Connection Pool), gọi bất đồng bộ (async/await), tự động retry hoặc gửi JSON/Multipart gọn gàng.',
    thirdPartyLibs: [
      { name: 'httpx', role: 'HTTP Client hiện đại hỗ trợ cả đồng bộ & async/await' },
      { name: 'requests', role: 'Thư viện gọi HTTP đồng bộ phổ biến nhất lịch sử Python' },
      { name: 'tenacity', role: 'Tự động thử lại (Retry) khi mạng chập chờn' },
    ],
  },
  {
    id: 'b-validation',
    taskCategory: '3. Mô hình Dữ liệu & Kiểm tra Kiểu (Validation)',
    stdlibModules: ['dataclasses', 'typing', 'enum'],
    stdlibScope:
      'Rất tốt cho dữ liệu nội bộ giữa các hàm trong code của bạn. Tuy nhiên typing/dataclass KHÔNG tự chặn nếu dữ liệu truyền vào sai kiểu lúc chạy.',
    whenToSwitch:
      'Khi nhận dữ liệu từ bên ngoài (JSON từ người dùng, Webhook, file CSV, kết quả trả về từ LLM) cần ép kiểu và chặn dữ liệu bẩn ngay lập tức.',
    thirdPartyLibs: [
      { name: 'pydantic (v2)', role: 'Kiểm tra, ép kiểu dữ liệu ở runtime & xuất JSON Schema' },
      { name: 'msgspec / attrs', role: 'Lựa chọn thay thế siêu nhẹ cho hệ thống độ trễ cực thấp' },
    ],
  },
  {
    id: 'b-database',
    taskCategory: '4. Cơ sở dữ liệu (Database & Cache)',
    stdlibModules: ['sqlite3'],
    stdlibScope:
      'Có sẵn luôn một hệ quản trị SQL hoàn chỉnh lưu trong 1 file (.db). Đủ dùng cho ứng dụng Desktop, CLI tool, hoặc web nhỏ ít người ghi đồng thời.',
    whenToSwitch:
      'Khi làm Web/API nhiều người dùng truy cập cùng lúc (cần PostgreSQL/MySQL/Redis), cần ánh xạ bảng thành class Python (ORM) và quản lý lịch sử sửa bảng.',
    thirdPartyLibs: [
      { name: 'sqlalchemy + alembic', role: 'ORM thao tác DB bằng Python & quản lý Migration bảng' },
      { name: 'psycopg / asyncpg', role: 'Driver kết nối trực tiếp tới PostgreSQL' },
      { name: 'redis', role: 'Kết nối Redis làm bộ nhớ đệm (Cache) & hàng đợi' },
    ],
  },
  {
    id: 'b-cli-logging',
    taskCategory: '5. Công cụ Dòng lệnh (CLI) & Ghi Log',
    stdlibModules: ['argparse', 'logging', 'getpass'],
    stdlibScope:
      'Đủ làm script nhận cờ tham số (--input, --port) và ghi log ra file/console chuẩn mà không phụ thuộc gói ngoài.',
    whenToSwitch:
      'Khi CLI có nhiều lệnh con phức tạp, muốn tự động sinh CLI từ Type Hints, hoặc muốn in bảng biểu, màu sắc, thanh tiến trình (progress bar) và log dạng JSON.',
    thirdPartyLibs: [
      { name: 'typer / click', role: 'Tạo CLI nhiều lệnh con gọn gàng từ hàm Python' },
      { name: 'rich', role: 'Vẽ bảng, tô màu, thanh tiến trình đẹp mắt trên Terminal' },
      { name: 'loguru / structlog', role: 'Ghi log có màu và xuất chuẩn JSON cho Production' },
    ],
  },
  {
    id: 'b-desktop-gui',
    taskCategory: '6. Giao diện Desktop (GUI App)',
    stdlibModules: ['tkinter'],
    stdlibScope:
      'Có sẵn để mở cửa sổ, hộp chọn file, nút bấm và ô nhập liệu cơ bản cho tool nội bộ mà không cần cài gì.',
    whenToSwitch:
      'Khi muốn giao diện bóng bẩy hiện đại, dùng HTML/CSS/React làm giao diện cho Python, hoặc đóng gói thành app chạy trên cả macOS/Windows/Mobile.',
    thirdPartyLibs: [
      { name: 'pywebview', role: 'Dùng HTML/CSS/JS làm giao diện nhẹ nhàng cho Python local' },
      { name: 'PySide6 (Qt)', role: 'Bộ công cụ làm phần mềm Desktop chuyên nghiệp đồ sộ' },
      { name: 'briefcase / pyinstaller', role: 'Đóng gói code Python thành file .exe / .app' },
    ],
  },
  {
    id: 'b-testing-concurrency',
    taskCategory: '7. Đa luồng, Bất đồng bộ & Kiểm thử (Testing)',
    stdlibModules: ['asyncio', 'concurrent.futures', 'unittest'],
    stdlibScope:
      'asyncio và ThreadPool/ProcessPool của Python chuẩn đã đủ mạnh cho 90% nhu cầu chạy song song trong 1 máy chủ. unittest có sẵn để viết test cơ bản.',
    whenToSwitch:
      'Khi viết nhiều unit test (cần cú pháp assert ngắn gọn của pytest) hoặc khi cần đẩy tác vụ nặng sang các máy chủ Worker khác qua mạng.',
    thirdPartyLibs: [
      { name: 'pytest', role: 'Khung viết test ngắn gọn, phổ biến số 1 trong Python' },
      { name: 'celery / rq', role: 'Đẩy công việc nặng sang tiến trình/máy chủ Worker chạy ngầm' },
    ],
  },
];

export const APPLICATION_DOMAIN_STACKS: ApplicationDomainStack[] = [
  {
    id: 'stack-web-api',
    number: 1,
    title: 'Mảng 1: Triển khai Web API & Backend Thông thường',
    subtitle: 'Xây dựng hệ thống Backend cho Web (React/Next.js) hoặc Mobile App.',
    overview:
      'Người mới thường tưởng FastAPI hoặc Flask làm được tất cả mọi thứ. Thực tế trong một Backend chuẩn, mỗi thư viện chỉ phụ trách đúng 1 tầng trong dây chuyền từ lúc nhận HTTP Request tới lúc lưu xuống Database.',
    whenNoExternalLibNeeded:
      'Nếu chỉ cần dựng một server tạm để truyền file nội bộ, `python -m http.server` hoặc `http.server` có sẵn là đủ. Nhưng làm API thật thì bắt buộc dùng bộ dưới đây.',
    pipelineStages: [
      {
        stepNumber: 1,
        stageName: 'Tầng Máy chủ Mạng (ASGI/WSGI Server)',
        libraries: ['uvicorn', 'gunicorn'],
        whatItDoes: 'Mở cổng mạng (vd: 8000), nhận kết nối TCP/HTTP thô từ người dùng rồi chuyển cho FastAPI/Django.',
        whatItDoesNotDo: 'Không biết gì về logic nghiệp vụ, đường dẫn URL hay Database.',
      },
      {
        stepNumber: 2,
        stageName: 'Tầng Định tuyến API (Web Framework)',
        libraries: ['fastapi', 'flask', 'litestar'],
        whatItDoes: 'Nhìn URL (vd: POST /orders) để gọi đúng hàm Python xử lý, kiểm tra quyền đăng nhập và trả HTTP Response.',
        whatItDoesNotDo: 'FastAPI KHÔNG tự biết kết nối hay lưu dữ liệu vào Database (nó phải nhờ tầng 4 bên dưới).',
      },
      {
        stepNumber: 3,
        stageName: 'Tầng Kiểm duyệt Dữ liệu & Cấu hình (Validation)',
        libraries: ['pydantic', 'pydantic-settings'],
        whatItDoes: 'Kiểm tra JSON khách gửi lên có đúng kiểu (email hợp lệ, số tiền > 0) và đọc cấu hình từ file .env.',
        whatItDoesNotDo: 'Không lưu dữ liệu vào ổ cứng hay Database.',
        isStdlibAvailable: 'Có `dataclasses` có sẵn nhưng không tự kiểm tra lỗi dữ liệu JSON từ người dùng.',
      },
      {
        stepNumber: 4,
        stageName: 'Tầng Cơ sở dữ liệu & Lịch sử Bảng (ORM & Migration)',
        libraries: ['sqlalchemy', 'alembic', 'asyncpg / psycopg'],
        whatItDoes: 'SQLAlchemy dịch đối tượng Python thành câu lệnh SQL; Alembic ghi nhớ lịch sử thêm/xóa cột bảng DB; asyncpg là dây cáp nối tới PostgreSQL.',
        whatItDoesNotDo: 'Không biết gì về HTTP hay giao diện web.',
        isStdlibAvailable: 'Có `sqlite3` có sẵn nếu chỉ làm dự án nhỏ lưu 1 file trên máy.',
      },
      {
        stepNumber: 5,
        stageName: 'Tầng Chạy Ngầm (Background Jobs)',
        libraries: ['rq (Redis Queue)', 'celery'],
        whatItDoes: 'Nhận các việc tốn thời gian (gửi email, tạo PDF, xử lý video) chạy ở một tiến trình riêng để API trả lời người dùng ngay lập tức.',
        whatItDoesNotDo: 'Không phục vụ trực tiếp HTTP request của người dùng.',
      },
    ],
  },
  {
    id: 'stack-fullstack-ui',
    number: 2,
    title: 'Mảng 2: Full-stack Web App & Giao diện Nội bộ Nhanh',
    subtitle: 'Khi muốn làm cả Backend lẫn Giao diện Web bằng Python.',
    overview:
      'Tùy mục tiêu bạn làm sản phẩm cho khách hàng lớn hay làm công cụ biểu đồ/AI nội bộ mà Python có 2 nhánh thư viện hoàn toàn khác nhau.',
    whenNoExternalLibNeeded:
      'Không có thư viện chuẩn nào dựng sẵn giao diện web hoàn chỉnh; bạn luôn chọn 1 trong 3 công cụ dưới đây tùy bài toán.',
    pipelineStages: [
      {
        stepNumber: 1,
        stageName: 'Hướng A: Web Truyền thống Đầy đủ ("Batteries-Included")',
        libraries: ['django', 'django-allauth'],
        whatItDoes: 'Cung cấp trọn gói trong 1 thư viện duy nhất: Định tuyến URL + ORM Database + Migration + Đăng nhập/Phân quyền + Trang Admin quản trị + Giao diện HTML Template.',
        whatItDoesNotDo: 'Khá nặng nếu bạn chỉ muốn viết 1–2 API nhỏ hoặc làm ứng dụng bất đồng bộ thuần túy.',
      },
      {
        stepNumber: 2,
        stageName: 'Hướng B: Web Tối giản Tự Lắp ghép (Micro-framework)',
        libraries: ['flask', 'jinja2', 'flask-sqlalchemy'],
        whatItDoes: 'Chỉ cho sẵn khung điều hướng URL và render HTML (Jinja2). Cần Database hay Login thì tự cài thêm đúng mảnh đó.',
        whatItDoesNotDo: 'Không áp đặt cấu trúc thư mục hay trang Admin sẵn như Django.',
      },
      {
        stepNumber: 3,
        stageName: 'Hướng C: Biến Script Data/AI thành Giao diện Web trong 5 Phút',
        libraries: ['streamlit', 'gradio', 'nicegui'],
        whatItDoes: 'Cho phép viết 100% bằng Python (`st.slider()`, `st.bar_chart()`, `gr.ChatInterface()`) để tự sinh ra trang web tương tác mà KHÔNG cần biết HTML/CSS/JavaScript.',
        whatItDoesNotDo: 'Không dùng để xây dựng các website thương mại điện tử hay mạng xã hội phức tạp cần tùy biến từng pixel giao diện.',
      },
    ],
  },
  {
    id: 'stack-ai-llm-rag',
    number: 3,
    title: 'Mảng 3: Ứng dụng AI, LLM, Chatbot & RAG (Dùng Mô hình AI có sẵn)',
    subtitle: 'Tích hợp ChatGPT, Gemini, Claude vào phần mềm, đọc tài liệu PDF và làm AI Agent.',
    overview:
      'Đây là mảng nhiều người mới bị ngợp nhất vì quá nhiều tên thư viện mới. Hãy nhớ nguyên tắc: Đừng vội cài các framework lớn (như LangChain) nếu bài toán của bạn chỉ cần gọi API AI 1 bước!',
    whenNoExternalLibNeeded:
      'Nếu chỉ gọi REST API của OpenAI/Gemini một cách thô sơ, `urllib` hoặc `httpx` cũng gọi được, nhưng dùng SDK chính hãng sẽ tự lo phần streaming và retry.',
    pipelineStages: [
      {
        stepNumber: 1,
        stageName: 'Tầng 1: Gọi Trực tiếp Mô hình AI (Official SDKs)',
        libraries: ['openai', 'google-genai', 'anthropic', 'litellm'],
        whatItDoes: 'Gửi câu hỏi (prompt), hình ảnh hoặc danh sách hàm (tools) tới máy chủ AI và nhận câu trả lời (hoặc stream từng chữ). Đủ cho 70% ứng dụng AI thông thường!',
        whatItDoesNotDo: 'Không tự biết đọc file PDF trên máy bạn hay quản lý cơ sở dữ liệu tài liệu.',
      },
      {
        stepNumber: 2,
        stageName: 'Tầng 2: Ép AI Trả về Đúng Cấu trúc Dữ liệu (Structured Output)',
        libraries: ['pydantic', 'instructor'],
        whatItDoes: 'Bắt LLM phải trả về đúng khuôn class Pydantic (vd: trích xuất Hóa đơn thành `{ ten_khach: str, tong_tien: float }`), nếu AI trả sai tự động nhắc AI sửa lại.',
        whatItDoesNotDo: 'Không lưu trữ dữ liệu hay huấn luyện mô hình.',
      },
      {
        stepNumber: 3,
        stageName: 'Tầng 3: Hỏi đáp Tài liệu Nội bộ (RAG & Vector Database)',
        libraries: ['llamaindex', 'pymupdf / pypdf', 'chromadb / qdrant-client'],
        whatItDoes: 'Đọc file PDF/Word -> Cắt thành đoạn nhỏ (Chunking) -> Biến thành Vector số lưu vào ChromaDB/Qdrant -> Khi người dùng hỏi, tìm đoạn văn liên quan nhất ghép vào prompt gửi cho Tầng 1.',
        whatItDoesNotDo: 'Không thay thế Database SQL giao dịch thông thường của ứng dụng.',
      },
      {
        stepNumber: 4,
        stageName: 'Tầng 4: Điều phối AI Agent Nhiều Bước (Agent Orchestration)',
        libraries: ['langgraph', 'pydantic-ai'],
        whatItDoes: 'Quản lý luồng suy nghĩ phức tạp có vòng lặp: AI lập kế hoạch -> Gọi công cụ tra cứu -> Kiểm tra kết quả -> Nếu chưa đủ thì tra cứu tiếp -> Chờ con người duyệt.',
        whatItDoesNotDo: 'Không cần dùng nếu ứng dụng của bạn chỉ là Hỏi -> Đáp 1 lượt đơn giản.',
      },
    ],
  },
  {
    id: 'stack-data-ml-dl',
    number: 4,
    title: 'Mảng 4: Khoa học Dữ liệu & Huấn luyện Machine Learning / Deep Learning',
    subtitle: 'Phân tích số liệu, dự báo kinh doanh, nhận diện hình ảnh và tự huấn luyện mô hình AI.',
    overview:
      'Khác với Mảng 3 (gọi mô hình AI có sẵn qua API), Mảng 4 là nơi bạn xử lý bảng dữ liệu lớn và tự huấn luyện (train) mô hình toán học trên máy chủ/GPU của mình.',
    whenNoExternalLibNeeded:
      'Tính toán thống kê nhỏ vài trăm số có thể dùng module `math`, `statistics`, `csv` có sẵn trong Python. Nhưng với ma trận và dữ liệu lớn thì bắt buộc dùng thư viện viết bằng C/Rust dưới đây.',
    pipelineStages: [
      {
        stepNumber: 1,
        stageName: 'Tầng Nền tảng Toán học & Bảng Dữ liệu',
        libraries: ['numpy', 'polars', 'pandas', 'duckdb'],
        whatItDoes: 'NumPy tính toán mảng/ma trận số học ở tốc độ C; Pandas & Polars đọc, lọc, gom nhóm hàng triệu dòng CSV/Excel/Parquet.',
        whatItDoesNotDo: 'Không chứa sẵn các thuật toán học máy tự dự đoán.',
      },
      {
        stepNumber: 2,
        stageName: 'Tầng Trực quan hóa Biểu đồ (Visualization)',
        libraries: ['matplotlib', 'seaborn', 'plotly'],
        whatItDoes: 'Vẽ biểu đồ đường, cột, phân phối nhiệt (heatmap) để con người nhìn thấy quy luật và điểm bất thường của dữ liệu.',
        whatItDoesNotDo: 'Không biến biểu đồ thành trang web hoàn chỉnh (nếu muốn thành web thì ghép với Streamlit ở Mảng 2).',
      },
      {
        stepNumber: 3,
        stageName: 'Tầng Machine Learning Cổ điển (Dữ liệu dạng Bảng)',
        libraries: ['scikit-learn', 'xgboost', 'lightgbm'],
        whatItDoes: 'Huấn luyện mô hình dự báo trên dữ liệu bảng (dự đoán giá nhà, chấm điểm tín dụng, phân cụm khách hàng) — nhanh, nhẹ, không cần card đồ họa GPU đắt tiền.',
        whatItDoesNotDo: 'Không dùng để huấn luyện mô hình hiểu ảnh, âm thanh hay sinh văn bản lớn (Deep Learning).',
      },
      {
        stepNumber: 4,
        stageName: 'Tầng Deep Learning, Thị giác Máy tính & NLP (Chạy trên GPU)',
        libraries: ['torch (PyTorch)', 'transformers (Hugging Face)', 'opencv-python'],
        whatItDoes: 'PyTorch xây dựng và huấn luyện mạng nơ-ron sâu trên GPU; Transformers tải hàng trăm nghìn mô hình AI mã nguồn mở trên Hugging Face; OpenCV xử lý ảnh/video và camera.',
        whatItDoesNotDo: 'Rất nặng (cài đặt vài GB); không dùng cho các bài toán web hay bảng số liệu đơn giản.',
      },
    ],
  },
  {
    id: 'stack-scraping-automation',
    number: 5,
    title: 'Mảng 5: Thu thập Dữ liệu Web (Scraping) & Tự động hóa',
    subtitle: 'Lấy giá sản phẩm, tin tức tự động và điều khiển trình duyệt thay con người.',
    overview:
      'Chọn thư viện ở mảng này phụ thuộc vào 1 câu hỏi duy nhất: Trang web mục tiêu là HTML tĩnh hay phải chạy JavaScript / Đăng nhập mới hiện dữ liệu?',
    whenNoExternalLibNeeded:
      'Chỉ khi đọc file HTML có sẵn trên ổ cứng bằng Regex đơn giản (`re`), còn lại luôn nên dùng bộ phân tích HTML chuyên dụng để không bị vỡ khi web đổi giao diện.',
    pipelineStages: [
      {
        stepNumber: 1,
        stageName: 'Cấp độ 1: Trang Web Tĩnh & Số lượng Trang Ít',
        libraries: ['httpx / requests', 'beautifulsoup4', 'selectolax'],
        whatItDoes: 'httpx tải mã nguồn HTML thô về; BeautifulSoup4 (hoặc Selectolax siêu nhanh) tìm các thẻ `<div class="price">` để lấy chữ ra.',
        whatItDoesNotDo: 'Không chạy được mã JavaScript của trang web (nếu trang web dùng React render ngầm thì tải về sẽ thấy trang trắng).',
      },
      {
        stepNumber: 2,
        stageName: 'Cấp độ 2: Trang Web Cần Chạy JavaScript, Cuộn chuột hoặc Đăng nhập',
        libraries: ['playwright', 'selenium'],
        whatItDoes: 'Mở một trình duyệt Chromium/Firefox thật (ẩn hoặc hiện), tự động gõ phím, bấm nút đăng nhập, chờ JavaScript tải xong dữ liệu rồi mới trích xuất.',
        whatItDoesNotDo: 'Tốn RAM hơn cấp độ 1 vì phải bật trình duyệt thật.',
      },
      {
        stepNumber: 3,
        stageName: 'Cấp độ 3: Hệ thống Crawler Công nghiệp Hàng Triệu Trang',
        libraries: ['scrapy'],
        whatItDoes: 'Quản lý toàn bộ dây chuyền cào quy mô lớn: tự động xếp hàng hàng vạn URL, chạy bất đồng bộ tốc độ cao, chống trùng lặp, tự đổi Proxy và đẩy dữ liệu qua Pipeline lưu vào DB.',
        whatItDoesNotDo: 'Khá cồng kềnh nếu bạn chỉ muốn viết 1 script nhỏ cào 10 trang web.',
      },
    ],
  },
  {
    id: 'stack-desktop-cli-devops',
    number: 6,
    title: 'Mảng 6: Công cụ Dòng lệnh (CLI), Desktop App & Đóng gói',
    subtitle: 'Xây dựng phần mềm chạy trực tiếp trên máy tính cá nhân và quy trình chất lượng code.',
    overview:
      'Giúp bạn biến các đoạn code Python thành công cụ tiện lợi cho đồng nghiệp sử dụng trên Terminal hoặc phần mềm bấm đúp mở trên Windows/macOS.',
    whenNoExternalLibNeeded:
      'Python có sẵn `argparse` (làm CLI), `tkinter` (làm cửa sổ GUI cơ bản), `subprocess` (gọi lệnh hệ điều hành) và `venv` (tạo môi trường ảo).',
    pipelineStages: [
      {
        stepNumber: 1,
        stageName: 'Xây dựng Công cụ Dòng lệnh (CLI)',
        libraries: ['typer', 'click', 'rich'],
        whatItDoes: 'Biến hàm Python thành lệnh terminal có hướng dẫn `--help` tự động, kiểm tra tham số và in bảng/màu sắc chuyên nghiệp.',
        whatItDoesNotDo: 'Không tạo cửa sổ đồ họa bấm chuột.',
        isStdlibAvailable: 'Có `argparse` có sẵn cho các script nhỏ không muốn cài thêm gói ngoài.',
      },
      {
        stepNumber: 2,
        stageName: 'Xây dựng Ứng dụng Desktop Có Giao diện (GUI)',
        libraries: ['pywebview', 'PySide6 (Qt)', 'toga'],
        whatItDoes: 'PyWebView cho phép dùng giao diện HTML/CSS/JS nhẹ nhàng gọi hàm Python; PySide6 làm phần mềm Desktop truyền thống đồ sộ.',
        whatItDoesNotDo: 'Không tự đóng gói thành file cài đặt .exe/.dmg (phải kết hợp bước 3).',
        isStdlibAvailable: 'Có `tkinter` đi kèm sẵn trong Python cho các form đơn giản.',
      },
      {
        stepNumber: 3,
        stageName: 'Quản lý Dự án, Kiểm tra Lỗi & Đóng gói Phát hành',
        libraries: ['uv', 'ruff', 'pytest', 'briefcase / pyinstaller'],
        whatItDoes: 'uv quản lý Python & thư viện; Ruff soi lỗi và format code tức thì; Pytest chạy kiểm thử; Briefcase/PyInstaller đóng gói thành file cài đặt cho máy không cài Python.',
        whatItDoesNotDo: 'Đây là công cụ dành cho lúc phát triển (Dev/Build Tooling), không phải thư viện import vào logic nghiệp vụ.',
      },
    ],
  },
];

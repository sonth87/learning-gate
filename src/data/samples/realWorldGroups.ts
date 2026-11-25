import { RealWorldProjectGroup } from '@/types/realWorldProject.types';

export const REAL_WORLD_PROJECT_GROUPS: RealWorldProjectGroup[] = [
  {
    id: 'rest-api',
    number: 1,
    title: 'REST API / Backend Service (FastAPI)',
    subtitle: 'Xây dựng API server nhận HTTP request, validate dữ liệu, kết nối DB và trả JSON.',
    beginnerTip:
      'Người mới nên chú ý cách tách 3 lớp: Router (nhận request) → Service (xử lý logic) → Model/DB (lưu trữ), tránh viết hết vào 1 file.',
  },
  {
    id: 'fullstack-web',
    number: 2,
    title: 'Full-stack Web App (Django & Flask)',
    subtitle: 'Ứng dụng web hoàn chỉnh có giao diện HTML, đăng nhập người dùng, admin và database.',
    beginnerTip:
      'Flask giúp bạn hiểu từng mảnh ghép nhỏ (routing, template, DB), còn Django cho sẵn "tất cả trong một" theo chuẩn công nghiệp.',
  },
  {
    id: 'data-ml',
    number: 3,
    title: 'Data Science & Machine Learning Pipeline',
    subtitle: 'Thu thập, làm sạch dữ liệu, huấn luyện mô hình ML/DL và đóng gói thành ứng dụng.',
    beginnerTip:
      'Đừng nhồi toàn bộ code vào Jupyter Notebook. Các project chuẩn luôn tách phần thử nghiệm (notebooks/) khỏi mã nguồn chạy thật (src/).',
  },
  {
    id: 'cli-bots',
    number: 4,
    title: 'Công cụ dòng lệnh (CLI) & Bots Tự động',
    subtitle: 'Tạo lệnh chạy trên Terminal (như git, uv) hoặc Bot tự động trên Telegram, Reddit.',
    beginnerTip:
      'CLI là dạng project dễ bắt đầu nhất để học cách đóng gói Python package, đọc tham số đầu vào và in kết quả đẹp ra màn hình.',
  },
  {
    id: 'library-devops',
    number: 5,
    title: 'Library / Package Chuẩn Hiện Đại & DevContainer',
    subtitle: 'Cách đóng gói thư viện Python tái sử dụng, cấu hình Docker, CI/CD và môi trường chuẩn.',
    beginnerTip:
      'Xem các repo này để hiểu file pyproject.toml, pre-commit, pytest và Dockerfile phối hợp với nhau như thế nào trong team thật.',
  },
  {
    id: 'desktop-local',
    number: 6,
    title: 'Desktop App / Local Tooling (Python + UI)',
    subtitle: 'Đóng gói Python thành app chạy trên macOS/Windows hoặc dùng HTML/JS làm giao diện.',
    beginnerTip:
      'Nếu bạn biết chút HTML/JS hoặc muốn app chạy offline trên máy tính cá nhân, pywebview và Briefcase là 2 hướng tiếp cận thực tế nhất.',
  },
  {
    id: 'ai-llm-rag',
    number: 7,
    title: 'AI / LLM Application, RAG & Agent Workflow',
    subtitle: 'Xây dựng Chatbot hỏi đáp tài liệu nội bộ (RAG) và AI Agent biết gọi công cụ (Tools).',
    beginnerTip:
      'Bản chất ứng dụng AI là chuỗi các bước rõ ràng: Đọc tài liệu → Cắt nhỏ (Chunk) → Tìm kiếm ngữ nghĩa → Gửi LLM tổng hợp câu trả lời.',
  },
  {
    id: 'worker-queue',
    number: 8,
    title: 'Event-driven, Background Worker & Queue',
    subtitle: 'Đẩy các việc nặng (gửi email, xuất PDF, xử lý ảnh) ra chạy ngầm để web không bị đơ.',
    beginnerTip:
      'Web server chỉ nên nhận việc rồi thả một "phiếu công việc" vào Redis; một tiến trình Worker riêng sẽ lấy phiếu đó ra xử lý từ từ.',
  },
  {
    id: 'scraping-automation',
    number: 9,
    title: 'Web Scraping & Browser Automation',
    subtitle: 'Tự động truy cập website, lấy dữ liệu có cấu trúc và giả lập thao tác trình duyệt.',
    beginnerTip:
      'Trang web tĩnh thì dùng BeautifulSoup/Scrapy cho nhanh; trang web render bằng JavaScript nặng thì dùng Playwright hoặc Selenium.',
  },
  {
    id: 'monorepo-uv',
    number: 10,
    title: 'Monorepo / Multi-package Python Workspace',
    subtitle: 'Quản lý nhiều service/package dùng chung code nội bộ trong một kho chứa duy nhất với uv.',
    beginnerTip:
      'Khi dự án lớn dần (có cả API, Worker, CLI dùng chung Pydantic schemas), Workspace giúp chia sẻ code mà không cần up lên PyPI.',
  },
];

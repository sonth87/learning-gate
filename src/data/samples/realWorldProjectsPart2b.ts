import { RealWorldProject } from '@/types/realWorldProject.types';

export const REAL_WORLD_PROJECTS_PART_2B: RealWorldProject[] = [
  // ==========================================================================
  // 8. EVENT-DRIVEN, BACKGROUND WORKER & DISTRIBUTED QUEUE
  // ==========================================================================
  {
    id: 'rw-celery-examples',
    groupId: 'worker-queue',
    title: 'Celery Distributed Task Queue (Examples)',
    repoName: 'celery/celery',
    url: 'https://github.com/celery/celery/tree/main/examples',
    kind: 'production-template',
    complexity: 'master',
    scaleLabel: 'Distributed Worker System',
    summary:
      'Mẫu điển hình của hệ thống xử lý tác vụ nền phân tán: tách web producer với worker consumer qua Redis/RabbitMQ, có retry và timeout.',
    purpose:
      'Khi người dùng bấm "Xuất báo cáo 10.000 dòng" hay "Gửi 500 email", web server không thể bắt họ chờ 2 phút -> đẩy việc sang Celery chạy ngầm.',
    howItWorks: [
      'Web API (Producer) gọi `send_email.delay(user_id)` -> lệnh này chỉ mất 2ms để gửi tin nhắn vào Broker (Redis/RabbitMQ).',
      'Tiến trình Celery Worker (Consumer) chạy độc lập lấy tin nhắn đó ra thực thi.',
      'Nếu mạng lỗi, Worker tự động thử lại (Retry) theo cấu hình.',
      'Kết quả hoặc trạng thái (PENDING -> SUCCESS/FAILURE) được lưu vào Result Backend.',
    ],
    directoryTree: `examples/
├── app/                 # Khai báo Celery app & cấu hình Broker (Redis/RabbitMQ)
├── tasks.py             # Các hàm gắn decorator @app.task
├── django/              # Cách tích hợp Celery vào dự án web Django
└── periodic_tasks/      # Chạy tác vụ định kỳ tự động (giống Cronjob bằng Celery Beat)`,
    libraries: [
      {
        name: 'Celery',
        role: 'Hệ thống hàng đợi tác vụ phân tán chuẩn công nghiệp',
        whyNeeded:
          'Hỗ trợ mở rộng hàng chục worker trên nhiều máy chủ, có retry, rate-limit và lập lịch định kỳ.',
      },
      {
        name: 'Redis / RabbitMQ',
        role: 'Message Broker (Trạm trung chuyển việc)',
        whyNeeded:
          'Đóng vai trò hộp thư lưu danh sách công việc đang chờ để không bị mất việc nếu Worker khởi động lại.',
      },
    ],
    readingFocus:
      'Xem file tasks.py trong IDE để hiểu cách `@app.task(bind=True, autoretry_for=...)` tự động thử lại khi gặp lỗi mạng.',
    tags: ['Celery', 'Redis', 'Background Worker', 'Distributed'],
    chapters: [
      {
        chapter: 'Cơ chế 1',
        title: 'Producer vs Broker vs Consumer (Tại sao Web không bị đơ?)',
        summaryVi:
          'Web API chỉ gọi `.delay()` để ghi 1 dòng JSON nhỏ vào Redis (mất ~1ms) rồi trả kết quả ngay cho người dùng; tiến trình Celery Worker ở máy khác sẽ bốc ra chạy.',
      },
      {
        chapter: 'Cơ chế 2',
        title: 'Automatic Retry & Exponential Backoff',
        summaryVi:
          'Dùng `autoretry_for=(TimeoutError,)` và `retry_backoff=True` để khi server đối tác nghẽn, Worker tự chờ 2s -> 4s -> 8s rồi thử lại.',
      },
    ],
    ideFiles: [
      {
        path: 'src/worker/tasks.py',
        roleDescription:
          'Định nghĩa Celery App kết nối Redis Broker và khai báo tác vụ chạy nền có cơ chế tự động thử lại (Auto-Retry) khi lỗi mạng.',
        keyPatterns: ['Celery()', '@app.task', 'retry_backoff', '.delay()'],
        language: 'python',
        code: `"""Khai báo tác vụ chạy ngầm với Celery & Redis Broker (Giải thích cho người mới)."""

from celery import Celery

# 1. Khởi tạo Celery kết nối tới Redis làm trạm trung chuyển (Broker) và nơi lưu kết quả (Backend)
app = Celery(
    "order_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)


# 2. Gắn decorator @app.task để biến hàm Python thường thành tác vụ có thể đẩy sang máy Worker
@app.task(
    bind=True,
    autoretry_for=(ConnectionError, TimeoutError),
    retry_backoff=True,  # Tự động chờ tăng dần 2s, 4s, 8s trước khi thử lại
    max_retries=3,
)
def generate_invoice_pdf_task(self, order_id: str, customer_email: str) -> dict[str, str]:
    """Tác vụ nặng: Tạo file PDF hóa đơn và gửi email ở tiến trình nền."""
    return {
        "order_id": order_id,
        "recipient": customer_email,
        "status": "INVOICE_SENT",
    }`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-celery-worker',
        label: 'Chạy Celery Worker',
        kind: 'run',
        command: 'uv run celery -A src.worker.tasks worker --loglevel=info',
        description: 'Khởi động tiến trình Celery Worker lắng nghe hàng đợi Redis',
        stdout: ` -------------- celery@macbook-pro v5.4.0
--- ***** -----
-- ******* ---- [config]
- *** --- * --- .> broker:      redis://localhost:6379/0
- ** ---------- .> results:     redis://localhost:6379/1
- ** ---------- .> concurrency: 8 (prefork)

[tasks]
  . src.worker.tasks.generate_invoice_pdf_task

[INFO] Task generate_invoice_pdf_task[9f8a-41c2] received
[INFO] Task generate_invoice_pdf_task[9f8a-41c2] succeeded in 0.14s: {'order_id': 'ORD-99', 'status': 'INVOICE_SENT'}`,
      },
    ],
  },
  {
    id: 'rw-rq-redis-queue',
    groupId: 'worker-queue',
    title: 'RQ (Redis Queue) — Hàng đợi Tác vụ Gọn nhẹ',
    repoName: 'rq/rq',
    url: 'https://github.com/rq/rq',
    kind: 'production-template',
    complexity: 'advanced',
    scaleLabel: 'Simple Redis Worker',
    summary:
      'Nhẹ và dễ đọc hơn Celery rất nhiều khi muốn nắm bản chất hàng đợi tác vụ với Redis: enqueue job, chạy worker và xử lý failed job.',
    purpose:
      'Lựa chọn tuyệt vời cho người mới học kiến trúc Worker/Queue mà không bị ngợp bởi hàng chục cấu hình phức tạp của Celery.',
    howItWorks: [
      'Khởi tạo kết nối Redis và tạo đối tượng `q = Queue(connection=Redis())`.',
      'Đẩy bất kỳ hàm Python nào vào hàng đợi: `q.enqueue(count_words_at_url, "http://...")`.',
      'Mở terminal khác chạy lệnh `rq worker` để tiến trình công nhân bốc việc ra làm.',
      'Job nào bị lỗi sẽ tự động chuyển vào `FailedJobRegistry` để kiểm tra và chạy lại.',
    ],
    directoryTree: `rq_project/
├── jobs.py              # Hàm xử lý công việc thuần Python (không cần decorator phức tạp)
├── enqueue_demo.py      # Đẩy việc vào hàng đợi Redis bằng q.enqueue()
└── worker_runner.py     # Khởi chạy Worker lắng nghe hàng đợi`,
    libraries: [
      {
        name: 'rq (Redis Queue)',
        role: 'Thư viện hàng đợi tác vụ tối giản trên Redis',
        whyNeeded:
          'Code nguồn cực kỳ sạch sẽ, chỉ cần ~10 dòng code là chạy được hệ thống chạy ngầm hoàn chỉnh.',
      },
      {
        name: 'redis-py',
        role: 'Client kết nối tới Redis Server',
        whyNeeded:
          'Giúp Python đọc/ghi dữ liệu và hàng đợi trực tiếp trên Redis.',
      },
    ],
    readingFocus:
      'Đọc file enqueue_demo.py trong IDE để thấy sự tối giản của RQ: không cần sửa hàm gốc, chỉ cần truyền tên hàm vào `queue.enqueue()`.',
    tags: ['RQ', 'Redis', 'Queue', 'Worker'],
    ideFiles: [
      {
        path: 'rq_project/enqueue_demo.py',
        roleDescription:
          'Minh họa cách đẩy một hàm Python bất kỳ vào hàng đợi Redis bằng RQ chỉ trong vài dòng code.',
        keyPatterns: ['Queue(connection=Redis())', 'q.enqueue()', 'Job ID'],
        language: 'python',
        code: `"""Sử dụng RQ (Redis Queue) để đẩy công việc nặng ra chạy ngầm."""

from redis import Redis
from rq import Queue, Retry


def resize_uploaded_avatar(image_path: str, size_px: int = 256) -> str:
    """Hàm Python bình thường — RQ không bắt buộc phải gắn decorator đặc biệt nào!"""
    return f"Đã thu nhỏ ảnh '{image_path}' về kích thước {size_px}x{size_px}px"


if __name__ == "__main__":
    # 1. Kết nối tới Redis Server
    redis_conn = Redis(host="localhost", port=6379)
    task_queue = Queue("image_processing", connection=redis_conn)

    # 2. Đẩy hàm vào hàng đợi kèm chính sách thử lại tối đa 3 lần nếu lỗi
    job = task_queue.enqueue(
        resize_uploaded_avatar,
        "uploads/user_101.png",
        256,
        retry=Retry(max=3),
    )
    print(f"Đã xếp hàng thành công Job ID: {job.id}")`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-rq-run',
        label: 'Chạy RQ Worker',
        kind: 'run',
        command: 'uv run rq worker image_processing',
        description: 'Bốc job xử lý ảnh từ hàng đợi image_processing trong Redis',
        stdout: `10:15:01 *** Listening on image_processing...
10:15:02 image_processing: resize_uploaded_avatar('uploads/user_101.png', 256) (job_71c9a)
10:15:02 [Job Result] Đã thu nhỏ ảnh 'uploads/user_101.png' về kích thước 256x256px
10:15:02 ***Listening on image_processing...`,
      },
    ],
  },

  // ==========================================================================
  // 9. WEB SCRAPING & BROWSER AUTOMATION
  // ==========================================================================
  {
    id: 'rw-scrapy-architecture',
    groupId: 'scraping-automation',
    title: 'Scrapy (Kiến trúc Crawler Công nghiệp)',
    repoName: 'scrapy/scrapy',
    url: 'https://github.com/scrapy/scrapy',
    kind: 'production-template',
    complexity: 'pro',
    scaleLabel: 'High-Throughput Crawler',
    summary:
      'Dạy tư duy kiến trúc thu thập dữ liệu quy mô lớn qua các lớp tách biệt: Spider, Item, Pipeline và Downloader Middleware.',
    purpose:
      'Khi cần cào hàng nghìn đến hàng triệu trang web tốc độ cao (nhờ cơ chế bất đồng bộ), việc tự viết vòng lặp `requests.get` sẽ rất chậm và dễ rối.',
    howItWorks: [
      'Spider gửi yêu cầu tải trang và dùng CSS/XPath Selector bóc tách dữ liệu thô.',
      'Dữ liệu được đóng gói vào `Item` (khuôn dữ liệu chuẩn hóa).',
      'Item đi qua `Item Pipeline` để làm sạch chữ, lọc trùng lặp và lưu xuống CSV/JSON/Database.',
      '`Downloader Middleware` tự động gắn User-Agent giả lập, đổi Proxy và thử lại nếu web lỗi 503.',
    ],
    directoryTree: `my_scraper/
├── scrapy.cfg           # Cấu hình triển khai Scrapy
└── my_scraper/
    ├── items.py         # Định nghĩa cấu trúc dữ liệu thu thập (vd: ProductItem)
    ├── middlewares.py   # Xử lý Proxy, User-Agent, retry khi bị chặn
    ├── pipelines.py     # Làm sạch dữ liệu & lưu vào MongoDB/Postgres/CSV
    ├── settings.py      # Tốc độ cào (CONCURRENT_REQUESTS), độ trễ lịch sự
    └── spiders/         # Mỗi trang web mục tiêu là 1 file Spider riêng`,
    libraries: [
      {
        name: 'Scrapy (Twisted Async Engine)',
        role: 'Framework Web Crawling bất đồng bộ',
        whyNeeded:
          'Tự động quản lý hàng đợi URL, chống cào trùng link, tự động điều chỉnh tốc độ tránh làm sập web đích.',
      },
    ],
    readingFocus:
      'Đọc file quotes_spider.py trong IDE để thấy cách Scrapy dùng từ khóa `yield` trả về dữ liệu và tự động lần theo nút "Trang tiếp theo".',
    tags: ['Scrapy', 'Web Scraping', 'Data Ingestion'],
    ideFiles: [
      {
        path: 'my_scraper/spiders/quotes_spider.py',
        roleDescription:
          'Một Spider chuẩn của Scrapy: bóc tách danh ngôn bằng CSS Selector và tự động nhảy sang trang kế tiếp bằng response.follow().',
        keyPatterns: ['scrapy.Spider', 'response.css()', 'yield item', 'response.follow()'],
        language: 'python',
        code: `"""Spider thu thập dữ liệu tự động qua nhiều trang bằng Scrapy."""

import scrapy


class QuotesSpider(scrapy.Spider):
    name = "quotes"
    start_urls = ["https://quotes.toscrape.com/page/1/"]

    def parse(self, response: scrapy.http.Response):
        """Hàm callback tự động chạy sau khi Scrapy tải xong mã HTML của trang."""
        # 1. Lặp qua từng khối HTML chứa câu danh ngôn
        for quote in response.css("div.quote"):
            # Dùng từ khóa yield để đẩy từng bản ghi sang Item Pipeline xử lý tiếp
            yield {
                "text": quote.css("span.text::text").get(),
                "author": quote.css("small.author::text").get(),
                "tags": quote.css("div.tags a.tag::text").getall(),
            }

        # 2. Tìm đường link "Next Page" và tự động cào tiếp trang sau
        next_page = response.css("li.next a::attr(href)").get()
        if next_page is not None:
            yield response.follow(next_page, callback=self.parse)`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-scrapy-crawl',
        label: 'Chạy Scrapy Spider',
        kind: 'run',
        command: 'uv run scrapy crawl quotes -O quotes.json',
        description: 'Cào dữ liệu qua các trang và xuất kết quả ra file JSON',
        stdout: `[scrapy.core.engine] INFO: Spider opened
[scrapy.core.scraper] DEBUG: Scraped from <200 https://quotes.toscrape.com/page/1/>
{'text': 'The world as we have created it is a process of our thinking.', 'author': 'Albert Einstein'}
[scrapy.core.engine] INFO: Closing spider (finished) - Exported 20 items to quotes.json`,
      },
    ],
  },
  {
    id: 'rw-playwright-python',
    groupId: 'scraping-automation',
    title: 'Playwright Python (Modern Browser Automation)',
    repoName: 'microsoft/playwright-python',
    url: 'https://github.com/microsoft/playwright-python',
    kind: 'production-template',
    complexity: 'advanced',
    scaleLabel: 'Browser Automation & E2E',
    summary:
      'Điều khiển trình duyệt thật (Chromium, Firefox, WebKit) ổn định để test giao diện hoặc cào các trang web nặng JavaScript (SPA).',
    purpose:
      'Giải quyết những trang web mà `requests`/`BeautifulSoup` bó tay vì nội dung chỉ hiện ra sau khi JavaScript chạy hoặc phải bấm nút đăng nhập.',
    howItWorks: [
      'Khởi tạo Browser Context (giống mở một cửa sổ ẩn danh sạch sẽ, độc lập cookie).',
      'Điều hướng tới URL bằng `page.goto(...)`.',
      'Dùng `Locator` thông minh (tự động chờ nút hiện ra mới bấm, không cần `time.sleep` mù quáng).',
      'Tách logic thao tác trang (Page Object Model) khỏi kịch bản lấy dữ liệu hoặc assert test.',
    ],
    directoryTree: `automation_project/
├── pages/               # Page Object Model: gom các selector & thao tác từng trang
│   └── search_page.py   # Chứa class SearchPage tách biệt thao tác UI
├── tests/               # Kịch bản kiểm thử hoặc thu thập dữ liệu
└── pyproject.toml       # Cài playwright & pytest-playwright`,
    libraries: [
      {
        name: 'Playwright',
        role: 'Tự động hóa trình duyệt hiện đại của Microsoft',
        whyNeeded:
          'Nhanh, ít lỗi vặt hơn Selenium nhờ cơ chế Auto-wait (tự chờ phần tử sẵn sàng trước khi click).',
      },
    ],
    readingFocus:
      'Xem file pages/search_page.py trong IDE để học mô hình Page Object Model (POM) giúp code automation không bị vỡ khi giao diện web thay đổi.',
    tags: ['Playwright', 'Automation', 'E2E Testing', 'Scraping'],
    ideFiles: [
      {
        path: 'pages/search_page.py',
        roleDescription:
          'Áp dụng mẫu Page Object Model (POM) với Playwright: gom toàn bộ bộ chọn (Locators) và thao tác trang vào một class gọn gàng.',
        keyPatterns: ['Page Object Model', 'page.get_by_role()', 'Auto-Waiting'],
        language: 'python',
        code: `"""Mô hình Page Object Model (POM) điều khiển trình duyệt bằng Playwright."""

from playwright.sync_api import Page


class DocsSearchPage:
    def __init__(self, page: Page) -> None:
        self.page = page
        # Định nghĩa sẵn các Locator thông minh (Playwright sẽ tự chờ phần tử xuất hiện)
        self.search_input = page.get_by_placeholder("Tìm kiếm tài liệu...")
        self.result_headings = page.locator("article.search-hit h3")

    def navigate(self) -> None:
        self.page.goto("https://docs.example.com")

    def search_for(self, keyword: str) -> list[str]:
        """Gõ từ khóa, bấm Enter và trích xuất danh sách tiêu đề kết quả."""
        self.search_input.fill(keyword)
        self.search_input.press("Enter")
        # Chờ kết quả đầu tiên render xong bằng JavaScript rồi trả về toàn bộ danh sách chữ
        self.result_headings.first.wait_for(state="visible")
        return self.result_headings.all_inner_texts()`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-playwright-run',
        label: 'Chạy Playwright Headless',
        kind: 'pytest',
        command: 'uv run pytest --browser chromium',
        description: 'Mở trình duyệt Chromium ngầm và chạy kịch bản tìm kiếm',
        stdout: `============================= test session starts ==============================
collected 1 item

tests/test_search.py::test_docs_search[chromium] PASSED                  [100%]

============================== 1 passed in 1.15s ===============================`,
      },
    ],
  },
  {
    id: 'rw-pbl-scrapy-mongodb',
    groupId: 'scraping-automation',
    title: 'Scrape a Website with Scrapy & MongoDB (PBL)',
    repoName: 'realpython/stack-spider',
    url: 'https://realpython.com/web-scraping-with-scrapy-and-mongodb/',
    kind: 'pbl-tutorial',
    complexity: 'advanced',
    scaleLabel: 'Scraper + NoSQL DB (Tự code)',
    summary:
      'Bài thực hành từ project-based-learning (RealPython): viết con Spider bằng Scrapy bóc tách câu hỏi mới trên StackOverflow và lưu thẳng vào MongoDB.',
    purpose:
      'Giúp bạn thực hành ghép 2 mảnh: Lấy dữ liệu ngoài Internet -> Làm sạch qua Pipeline -> Đưa vào Database để truy vấn lại sau này.',
    howItWorks: [
      'Spider đọc HTML trang StackOverflow và lấy tiêu đề + đường link câu hỏi.',
      'Truyền từng `StackItem` qua `MongoDBPipeline` khai báo trong `pipelines.py`.',
      'Pipeline kiểm tra dữ liệu không rỗng rồi dùng `pymongo` lưu dưới dạng Document JSON vào MongoDB.',
    ],
    directoryTree: `stack_scraper/
├── stack/
│   ├── items.py         # Khai báo các trường cần lấy (title, url)
│   ├── pipelines.py     # Code kết nối PyMongo để kiểm tra & insert dữ liệu
│   ├── settings.py      # Bật ITEM_PIPELINES & khai báo địa chỉ MongoDB
│   └── spiders/
│       └── stack_spider.py # Logic XPath/CSS selector lấy câu hỏi mới`,
    libraries: [
      {
        name: 'Scrapy + PyMongo',
        role: 'Cào dữ liệu & Ghi vào MongoDB',
        whyNeeded:
          'Dữ liệu web thường linh hoạt (lúc có trường này, lúc thiếu trường kia), lưu dạng JSON ở MongoDB rất tiện.',
      },
    ],
    readingFocus:
      'Đọc file stack/pipelines.py trong IDE — đây là nơi chuẩn nhất để tách việc "bóc tách HTML" khỏi việc "lưu vào Database".',
    tags: ['PBL', 'Scrapy', 'MongoDB', 'Scraping'],
    chapters: [
      {
        chapter: 'Bước 1',
        title: 'Khởi tạo Project (scrapy startproject stack) & Định nghĩa StackItem',
        summaryVi:
          'Tạo khung dự án bằng CLI của Scrapy và khai báo 2 trường `title = scrapy.Field()`, `url = scrapy.Field()` trong `items.py`.',
        url: 'https://realpython.com/web-scraping-with-scrapy-and-mongodb/',
      },
      {
        chapter: 'Bước 2',
        title: 'Viết StackSpider bóc tách câu hỏi bằng Selector',
        summaryVi:
          'Dùng Chrome Inspect Element tìm đường dẫn thẻ tiêu đề câu hỏi rồi `yield item` về cho hệ thống.',
        url: 'https://realpython.com/web-scraping-with-scrapy-and-mongodb/',
      },
      {
        chapter: 'Bước 3',
        title: 'Viết MongoDBPipeline trong pipelines.py',
        summaryVi:
          'Kiểm tra bản ghi hợp lệ (nếu thiếu trường thì ném `DropItem`) và gọi `collection.insert_one(dict(item))` lưu vào MongoDB.',
        url: 'https://realpython.com/web-scraping-with-scrapy-and-mongodb/',
      },
    ],
    ideFiles: [
      {
        path: 'stack/pipelines.py',
        roleDescription:
          'Item Pipeline trong Scrapy: nhận từng bản ghi từ Spider, kiểm tra tính hợp lệ rồi lưu vào MongoDB bằng PyMongo.',
        keyPatterns: ['process_item()', 'DropItem', 'pymongo.MongoClient'],
        language: 'python',
        code: `"""Pipeline kiểm duyệt dữ liệu cào được và lưu vào cơ sở dữ liệu MongoDB."""

import pymongo
from scrapy.exceptions import DropItem


class MongoDBPipeline:
    def __init__(self) -> None:
        # Kết nối tới MongoDB local ở cổng mặc định 27017
        client: pymongo.MongoClient = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client["stackoverflow_db"]
        self.collection = db["questions"]

    def process_item(self, item: dict, spider) -> dict:
        """Hàm này tự động chạy cho MỌI bản ghi mà Spider yield ra."""
        if not item.get("title") or not item.get("url"):
            # Nếu bản ghi bị rỗng tiêu đề -> loại bỏ ngay, không lưu rác vào DB
            raise DropItem(f"Thiếu title hoặc url trong bản ghi: {item}")

        # Lưu bản ghi sạch vào collection MongoDB
        self.collection.insert_one(dict(item))
        return item`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-mongo-scrape',
        label: 'Chạy Spider -> MongoDB',
        kind: 'run',
        command: 'uv run scrapy crawl stack',
        description: 'Cào câu hỏi mới và lưu trực tiếp vào MongoDB qua Pipeline',
        stdout: `[MongoDBPipeline] Connected to mongodb://localhost:27017/stackoverflow_db
[Spider: stack] Scraped item: {'title': 'How to structure a FastAPI project?', 'url': '/questions/790123'}
[MongoDBPipeline] Inserted document into stackoverflow_db.questions (total: 50 items)`,
      },
    ],
  },
  {
    id: 'rw-pbl-bs4-movie',
    groupId: 'scraping-automation',
    title: 'Which Movie Should I Watch using BeautifulSoup (PBL)',
    repoName: 'project-based-learning',
    url: 'https://medium.com/@nishantsahoo/which-movie-should-i-watch-5c83a3c0f5b1',
    kind: 'pbl-tutorial',
    complexity: 'fundamental',
    scaleLabel: 'Mini Script (Nhập môn Scraping)',
    summary:
      'Bài thực hành cực dễ cho người mới bắt đầu: dùng Requests tải trang HTML và BeautifulSoup lọc ra danh sách phim hay để chọn ngẫu nhiên.',
    purpose:
      'Hiểu bản chất HTML là cây thẻ (`<div>`, `<a>`, `<span>`) và cách dùng Python trích xuất chữ từ trang web chỉ trong 30 dòng code.',
    howItWorks: [
      'Gửi HTTP GET request lấy toàn bộ mã nguồn HTML của trang bảng xếp hạng phim.',
      'Dùng BeautifulSoup phân tích HTML thành cây đối tượng.',
      'Tìm tất cả thẻ chứa tên phim, năm phát hành, điểm đánh giá rồi chọn ngẫu nhiên 1 phim gợi ý.',
    ],
    directoryTree: `movie_picker/
├── main.py              # Tải trang, parse HTML bằng BeautifulSoup và random phim
└── requirements.txt     # requests, beautifulsoup4`,
    libraries: [
      {
        name: 'Requests + BeautifulSoup4',
        role: 'Tải HTML & Bóc tách dữ liệu tĩnh',
        whyNeeded:
          'Cặp đôi nhập môn kinh điển, cú pháp siêu dễ đọc (`soup.select("div.title")`) cho người mới.',
      },
    ],
    readingFocus:
      'Đọc file movie_picker/main.py trong IDE để thấy cách `BeautifulSoup(html, "html.parser")` biến chuỗi HTML thành cây đối tượng dễ tìm kiếm.',
    tags: ['PBL', 'BeautifulSoup', 'Requests', 'Beginner'],
    chapters: [
      {
        chapter: 'Bước 1',
        title: 'Tải mã nguồn HTML bằng requests.get()',
        summaryVi:
          'Gửi HTTP GET kèm header `User-Agent` lịch sự và kiểm tra `response.raise_for_status()` đảm bảo tải trang thành công (HTTP 200).',
      },
      {
        chapter: 'Bước 2',
        title: 'Bóc tách thẻ HTML với BeautifulSoup & Chọn ngẫu nhiên bằng random.choice()',
        summaryVi:
          'Dùng `soup.select()` lấy danh sách các thẻ phim, trích tên phim + điểm số rồi gọi `random.choice()` gợi ý phim tối nay.',
      },
    ],
    ideFiles: [
      {
        path: 'movie_picker/main.py',
        roleDescription:
          'Script nhập môn Web Scraping với BeautifulSoup4: phân tích cấu trúc HTML và chọn ngẫu nhiên một bộ phim điểm cao.',
        keyPatterns: ['BeautifulSoup', 'soup.select()', 'random.choice()'],
        language: 'python',
        code: `"""Script gợi ý phim hay bằng BeautifulSoup4 (Giải thích từng dòng cho người mới)."""

import random
# BeautifulSoup giúp phân tích chuỗi HTML thô thành cây thẻ dễ dàng tìm kiếm
from bs4 import BeautifulSoup

# Mẫu HTML mô phỏng trang bảng xếp hạng phim (thực tế lấy từ requests.get(url).text)
SAMPLE_HTML = """
<div class="movie-list">
  <div class="movie-card"><h3 class="title">Inception (2010)</h3><span class="rating">8.8</span></div>
  <div class="movie-card"><h3 class="title">Interstellar (2014)</h3><span class="rating">8.7</span></div>
  <div class="movie-card"><h3 class="title">The Matrix (1999)</h3><span class="rating">8.7</span></div>
</div>
"""


def pick_random_movie(html_text: str) -> dict[str, str]:
    # 1. Đưa chuỗi HTML vào BeautifulSoup để dựng cây DOM
    soup = BeautifulSoup(html_text, "html.parser")

    # 2. Tìm tất cả các thẻ <div class="movie-card">
    movies: list[dict[str, str]] = []
    for card in soup.select("div.movie-card"):
        title_el = card.select_one("h3.title")
        rating_el = card.select_one("span.rating")
        if title_el and rating_el:
            movies.append(
                {
                    "title": title_el.get_text(strip=True),
                    "rating": rating_el.get_text(strip=True),
                }
            )

    # 3. Chọn ngẫu nhiên 1 bộ phim từ danh sách đã lọc
    return random.choice(movies)


if __name__ == "__main__":
    chosen = pick_random_movie(SAMPLE_HTML)
    print(f"🎬 Gợi ý phim tối nay: {chosen['title']} — Điểm IMDb: {chosen['rating']}⭐")`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-bs4-run',
        label: 'Chạy Gợi ý Phim',
        kind: 'run',
        command: 'uv run python movie_picker/main.py',
        description: 'Bóc tách danh sách phim bằng BeautifulSoup và chọn ngẫu nhiên',
        stdout: `🎬 Gợi ý phim tối nay: Interstellar (2014) — Điểm IMDb: 8.7⭐`,
      },
    ],
  },

  // ==========================================================================
  // 10. MONOREPO / MULTI-PACKAGE PYTHON WORKSPACE
  // ==========================================================================
  {
    id: 'rw-uv-workspace-monorepo',
    groupId: 'monorepo-uv',
    title: 'uv Workspace Monorepo ([tool.uv.workspace])',
    repoName: 'astral-sh/uv',
    url: 'https://docs.astral.sh/uv/concepts/projects/workspaces/',
    kind: 'production-template',
    complexity: 'master',
    scaleLabel: 'Multi-Package Monorepo',
    summary:
      'Cách tổ chức nhiều package/service dùng chung dependency và 1 file uv.lock duy nhất trong một repository Python hiện đại.',
    purpose:
      'Khi hệ thống có nhiều app (vd: backend-api, background-worker, cli-tool) cần dùng chung một thư viện nội bộ `shared-models`, Workspace giúp chia sẻ code trực tiếp mà không phải publish lên PyPI.',
    howItWorks: [
      'File pyproject.toml ở thư mục gốc khai báo `[tool.uv.workspace] members = ["packages/*"]`.',
      'Toàn bộ repo dùng chung 1 môi trường `.venv` và 1 file `uv.lock` để tránh xung đột phiên bản thư viện.',
      'Package `api` chỉ cần khai báo phụ thuộc `shared-core = { workspace = true }` là import dùng ngay.',
    ],
    directoryTree: `my_monorepo/
├── pyproject.toml       # Khai báo [tool.uv.workspace] members = ["packages/*"]
├── uv.lock              # File khóa phiên bản chung cho toàn bộ các dự án con
└── packages/
    ├── shared-core/     # Thư viện dùng chung (Pydantic schemas, utils, logger)
    │   ├── pyproject.toml
    │   └── src/shared_core/schemas.py
    ├── api-service/     # Backend FastAPI (import trực tiếp shared_core)
    │   └── pyproject.toml
    └── worker-service/  # Background Worker (cũng import shared_core)
        └── pyproject.toml`,
    libraries: [
      {
        name: 'uv Workspaces',
        role: 'Quản lý Monorepo Python nhiều package',
        whyNeeded:
          'Lấy cảm hứng từ Cargo (Rust) và pnpm (JS), giải quyết triệt để nỗi đau chia sẻ code nội bộ trong Python.',
      },
    ],
    readingFocus:
      'Xem 2 file pyproject.toml ở thư mục gốc và trong packages/api-service/ trong IDE để hiểu cách liên kết `{ workspace = true }`.',
    tags: ['Monorepo', 'uv', 'Workspace', 'Architecture'],
    chapters: [
      {
        chapter: 'Bước 1',
        title: 'Khai báo Workspace Root (pyproject.toml gốc)',
        summaryVi:
          'Đặt `[tool.uv.workspace] members = ["packages/*"]` ở thư mục gốc để `uv` gom tất cả package con vào chung một file khóa `uv.lock`.',
      },
      {
        chapter: 'Bước 2',
        title: 'Liên kết Package Nội bộ bằng { workspace = true }',
        summaryVi:
          'Trong `packages/api-service/pyproject.toml`, khai báo `[tool.uv.sources] shared-core = { workspace = true }`. Mọi sửa đổi trong `shared-core` sẽ có hiệu lực tức thì ở `api-service`.',
      },
    ],
    ideFiles: [
      {
        path: 'pyproject.toml',
        roleDescription:
          'File pyproject.toml ở thư mục gốc của Monorepo: khai báo danh sách các package thành viên trong [tool.uv.workspace].',
        keyPatterns: ['[tool.uv.workspace]', 'members = ["packages/*"]'],
        language: 'toml',
        code: `[project]
name = "company-monorepo-root"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []

[tool.uv.workspace]
# Mọi thư mục con nằm trong packages/ đều là thành viên dùng chung uv.lock
members = [
    "packages/shared-core",
    "packages/api-service",
    "packages/worker-service",
]`,
      },
      {
        path: 'packages/api-service/pyproject.toml',
        roleDescription:
          'Cấu hình của api-service: import trực tiếp package nội bộ shared-core qua { workspace = true } mà không cần đẩy lên PyPI.',
        keyPatterns: ['[tool.uv.sources]', '{ workspace = true }'],
        language: 'toml',
        code: `[project]
name = "api-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "shared-core",
]

[tool.uv.sources]
# Báo cho uv biết shared-core là package nội bộ ngay trong cùng Monorepo này
shared-core = { workspace = true }`,
      },
    ],
    ideCommands: [
      {
        id: 'cmd-rw-uv-workspace',
        label: 'Đồng bộ Monorepo Workspace',
        kind: 'run',
        command: 'uv sync --all-packages',
        description: 'Cài đặt và liên kết toàn bộ các package trong Monorepo',
        stdout: `Resolved 34 packages in 18ms
Installed 3 workspace members:
 + shared-core==0.1.0 (from file:///workspace/packages/shared-core)
 + api-service==0.1.0 (from file:///workspace/packages/api-service)
 + worker-service==0.1.0 (from file:///workspace/packages/worker-service)`,
      },
    ],
  },
];

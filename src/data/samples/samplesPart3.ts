import { SampleProject } from '@/types/sample.types';

export const SAMPLE_PROJECTS_PART_3: SampleProject[] = [
  // ============================================================================
  // PROJECT 11: MARKDOWN STATIC SITE GENERATOR (BASIC -> ADVANCED)
  // ============================================================================
  {
    id: 'sample-11-markdown-ssg',
    number: 11,
    slug: '11-markdown-static-site-gen',
    title: 'Trình Tạo Website Tĩnh từ Markdown & Template Engine (Static Site Generator)',
    complexity: 'basic',
    complexityLabel: 'Cấp 11 • Công cụ Build & Xử lý Văn bản',
    category: 'Developer Tooling & SSG',
    summary:
      'Xây dựng một Static Site Generator (giống Hugo / MkDocs / Pelican thu nhỏ): Quét thư mục bài viết Markdown (.md), bóc tách YAML Frontmatter, biên dịch sang HTML an toàn chống XSS (html.escape), áp vào Layout Template và xuất ra thư mục dist/.',
    architectureNotes: [
      'Chia dự án thành 3 phân hệ rõ ràng: `parser/` (tách Frontmatter & biên dịch cú pháp Markdown), `renderer/` (ghép vào khung giao diện HTML), và `builder.py` (điều phối đọc/ghi cây thư mục bằng `pathlib.Path`).',
      'Luôn dùng `html.escape()` đối với tiêu đề và metadata do người dùng nhập để ngăn chặn lỗ hổng XSS ngay từ bước build tĩnh.',
      'Tách biệt cấu hình toàn cục vào `SiteConfig` (`@dataclass(frozen=True)`) giúp truyền ngữ cảnh xuyên suốt quá trình biên dịch.',
    ],
    techStack: ['pathlib.Path', 're.sub', 'html.escape', 'dataclasses', 'pytest'],
    defaultFilePath: 'src/md_ssg/builder.py',
    files: [
      {
        path: 'pyproject.toml',
        roleDescription:
          'Khai báo metadata gói công cụ CLI `md-ssg` và cấu hình đường dẫn kiểm thử Pytest.',
        keyPatterns: ['[project.scripts]', 'requires-python'],
        language: 'toml',
        code: `[project]
name = "md-ssg"
version = "0.2.0"
description = "Trình tạo trang web tĩnh tốc độ cao từ Markdown"
requires-python = ">=3.12"

[project.scripts]
md-ssg = "md_ssg.builder:main"

[tool.pytest.ini_options]
pythonpath = ["src"]
testpaths = ["tests"]`,
      },
      {
        path: 'src/md_ssg/config.py',
        roleDescription:
          'Định nghĩa cấu hình trang web bất biến (`SiteConfig`) và cấu trúc dữ liệu bài viết (`PageDocument`).',
        keyPatterns: ['@dataclass(frozen=True)', 'pathlib.Path'],
        language: 'python',
        code: `"""Mô hình cấu hình và tài liệu trang cho Static Site Generator."""

from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True, slots=True)
class SiteConfig:
    site_name: str
    base_url: str
    content_dir: Path = Path("content")
    output_dir: Path = Path("dist")


@dataclass(slots=True)
class PageDocument:
    slug: str
    title: str
    date: str
    tags: list[str] = field(default_factory=list)
    body_html: str = ""`,
      },
      {
        path: 'src/md_ssg/parser/frontmatter.py',
        roleDescription:
          'Tách phần mở đầu YAML Frontmatter (`--- ... ---`) và phần nội dung Markdown của bài viết.',
        keyPatterns: ['str.split()', 'dict comprehension', 'Tuple unpacking'],
        language: 'python',
        code: `"""Bộ phân tích Frontmatter (metadata đầu file Markdown)."""


def extract_frontmatter(raw_text: str) -> tuple[dict[str, str], str]:
    """Tách khối --- frontmatter --- ở đầu file và trả về (metadata, markdown_body)."""
    stripped = raw_text.lstrip()
    if not stripped.startswith("---"):
        return {}, raw_text

    parts = stripped.split("---", maxsplit=2)
    if len(parts) < 3:
        return {}, raw_text

    raw_meta, body = parts[1].strip(), parts[2].strip()
    metadata: dict[str, str] = {}

    for line in raw_meta.splitlines():
        if ":" in line:
            key, val = line.split(":", maxsplit=1)
            metadata[key.strip().lower()] = val.strip().strip('"\'')

    return metadata, body`,
      },
      {
        path: 'src/md_ssg/parser/markdown.py',
        roleDescription:
          'Chuyển đổi cú pháp Markdown cốt lõi (Heading, Code inline, Bold, Paragraph) sang thẻ HTML.',
        keyPatterns: ['re.sub', 'html.escape', 'List accumulation'],
        language: 'python',
        code: `"""Bộ biên dịch Markdown thu gọn sang HTML an toàn."""

import html
import re

INLINE_CODE_RE = re.compile(r"\`([^\`]+)\`")
BOLD_RE = re.compile(r"\\*\\*([^*]+)\\*\\*")


def render_inline(text: str) -> str:
    escaped = html.escape(text)
    with_code = INLINE_CODE_RE.sub(r"<code>\\1</code>", escaped)
    return BOLD_RE.sub(r"<strong>\\1</strong>", with_code)


def markdown_to_html(md_body: str) -> str:
    """Chuyển đổi từng dòng Markdown sang chuỗi HTML5."""
    blocks: list[str] = []
    for raw_line in md_body.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("# "):
            blocks.append(f"<h1>{render_inline(line[2:])}</h1>")
        elif line.startswith("## "):
            blocks.append(f"<h2>{render_inline(line[3:])}</h2>")
        else:
            blocks.append(f"<p>{render_inline(line)}</p>")
    return "\\n".join(blocks)`,
      },
      {
        path: 'src/md_ssg/renderer/html_engine.py',
        roleDescription:
          'Ghép nội dung bài viết đã biên dịch vào khung giao diện HTML5 hoàn chỉnh.',
        keyPatterns: ['html.escape', 'Multiline f-string'],
        language: 'python',
        code: `"""Bộ kết xuất giao diện HTML5 từ PageDocument và SiteConfig."""

import html
from md_ssg.config import PageDocument, SiteConfig


def render_page_layout(config: SiteConfig, page: PageDocument) -> str:
    """Bọc nội dung bài viết vào khung trang HTML chuẩn SEO."""
    safe_title = html.escape(f"{page.title} | {config.site_name}")
    badges = " ".join(f'<span class="tag">#{html.escape(t)}</span>' for t in page.tags)

    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>{safe_title}</title>
</head>
<body>
  <header><a href="{config.base_url}">{html.escape(config.site_name)}</a></header>
  <main>
    <article data-slug="{html.escape(page.slug)}">
      <div class="meta">{html.escape(page.date)} {badges}</div>
      {page.body_html}
    </article>
  </main>
</body>
</html>"""`,
      },
      {
        path: 'src/md_ssg/builder.py',
        roleDescription:
          'Điều phối toàn bộ quy trình Build: đọc các bài viết Markdown, gọi Parser & Renderer, và xuất thông báo kết quả.',
        keyPatterns: ['Pipeline Orchestration', 'PageDocument'],
        language: 'python',
        code: `"""Trình điều phối quá trình đóng gói Website tĩnh."""

from md_ssg.config import PageDocument, SiteConfig
from md_ssg.parser.frontmatter import extract_frontmatter
from md_ssg.parser.markdown import markdown_to_html
from md_ssg.renderer.html_engine import render_page_layout


def compile_markdown_file(
    slug: str, raw_markdown: str, config: SiteConfig
) -> tuple[PageDocument, str]:
    """Biên dịch một file Markdown thô thành đối tượng PageDocument và chuỗi HTML."""
    meta, body = extract_frontmatter(raw_markdown)
    tags = [t.strip() for t in meta.get("tags", "").split(",") if t.strip()]

    doc = PageDocument(
        slug=slug,
        title=meta.get("title", slug.replace("-", " ").title()),
        date=meta.get("date", "2026-11-08"),
        tags=tags,
        body_html=markdown_to_html(body),
    )
    full_html = render_page_layout(config, doc)
    return doc, full_html`,
      },
      {
        path: 'tests/test_frontmatter.py',
        roleDescription:
          'Unit Test kiểm tra tính chính xác của bộ bóc tách Frontmatter và chống XSS khi render Markdown.',
        keyPatterns: ['pytest', 'XSS Prevention Check'],
        language: 'python',
        code: `"""Kiểm thử tự động cho bộ phân tích Frontmatter và Markdown."""

from md_ssg.parser.frontmatter import extract_frontmatter
from md_ssg.parser.markdown import markdown_to_html


def test_extract_frontmatter_parses_keys_and_body() -> None:
    sample = "---\\ntitle: Làm chủ AsyncIO\\ndate: 2026-11-08\\n---\\n# Xin chào **Python**"
    meta, body = extract_frontmatter(sample)
    assert meta["title"] == "Làm chủ AsyncIO"
    assert body == "# Xin chào **Python**"


def test_markdown_escapes_malicious_script_tags() -> None:
    html_out = markdown_to_html("Thử nghiệm <script>alert(1)</script> và **bold**")
    assert "<script>" not in html_out
    assert "&lt;script&gt;" in html_out
    assert "<strong>bold</strong>" in html_out`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-ssg-build',
        label: 'Chạy Build Website Tĩnh (md-ssg build)',
        kind: 'run',
        command: 'md-ssg build --input content/ --output dist/',
        description: 'Quét thư mục content/, biên dịch 3 bài viết Markdown sang HTML tĩnh trong dist/',
        stdout: `[md-ssg] Reading SiteConfig (site_name="PyMastery Engineering Blog")
[1/3] Compiled content/gil-free-threading.md -> dist/gil-free-threading/index.html (1.8ms)
[2/3] Compiled content/clean-architecture.md -> dist/clean-architecture/index.html (1.4ms)
[3/3] Compiled content/decimal-fintech.md    -> dist/decimal-fintech/index.html (1.2ms)
[md-ssg] Generated dist/index.html (3 posts indexed) in 4.6ms!`,
      },
      {
        id: 'cmd-ssg-pytest',
        label: 'Chạy Pytest (Kiểm tra Parser & Chống XSS)',
        kind: 'pytest',
        command: 'pytest -v tests/test_frontmatter.py',
        description: 'Kiểm tra bóc tách Frontmatter và escape thẻ <script> độc hại',
        stdout: `============================= test session starts ==============================
collected 2 items

tests/test_frontmatter.py::test_extract_frontmatter_parses_keys_and_body PASSED [ 50%]
tests/test_frontmatter.py::test_markdown_escapes_malicious_script_tags PASSED   [100%]

============================== 2 passed in 0.02s ===============================`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 12: DISTRIBUTED TASK QUEUE & WORKER ENGINE (ADVANCED)
  // ============================================================================
  {
    id: 'sample-12-task-queue-worker',
    number: 12,
    slug: '12-redis-task-queue-worker',
    title: 'Hệ thống Hàng đợi Tác vụ Ngầm & Dead-Letter Queue (Celery / RQ Architecture)',
    complexity: 'advanced',
    complexityLabel: 'Cấp 12 • Background Worker & Hàng đợi',
    category: 'Distributed Task Queue & Workers',
    summary:
      'Giải phẫu kiến trúc bên trong của Celery / Redis Queue (RQ): Cách đóng gói hàm thành JobEnvelope có chữ ký HMAC chống giả mạo, đăng ký hàm qua Decorator @task, đẩy vào hàng đợi ưu tiên (deque / heapq), tự động thử lại (Retry) và chuyển vào Dead-Letter Queue (DLQ) khi vượt quá số lần lỗi.',
    architectureNotes: [
      'Cấu trúc chia thành 4 gói chuyên biệt: `core/` (định nghĩa JobEnvelope & bảo mật HMAC), `broker/` (quản lý Main Queue & Dead-Letter Queue), `worker/` (Registry Decorator & tiến trình tiêu thụ bất đồng bộ), và `tasks/` (các hàm nghiệp vụ gửi email/xuất báo cáo).',
      'Tuyệt đối không dùng `pickle` cho dữ liệu hàng đợi từ bên ngoài vì nguy cơ thực thi mã từ xa (RCE); dự án dùng JSON kết hợp chữ ký `hmac.compare_digest`.',
      'Khi một Job thất bại quá `max_retries`, Worker không vứt bỏ mất dấu mà đẩy sang `dead_letter_queue` kèm thông tin lỗi để kỹ sư vận hành điều tra.',
    ],
    techStack: ['collections.deque', 'hmac.compare_digest', 'StrEnum', 'Decorator Registry', 'AsyncIO'],
    defaultFilePath: 'src/pyqueue/worker/runner.py',
    files: [
      {
        path: 'src/pyqueue/core/job.py',
        roleDescription:
          'Định nghĩa phong bì tác vụ (`JobEnvelope`) và vòng đời trạng thái (`PENDING` -> `RUNNING` -> `SUCCEEDED` / `DEAD_LETTER`).',
        keyPatterns: ['StrEnum', '@dataclass', 'Exponential Backoff'],
        language: 'python',
        code: `"""Mô hình phong bì tác vụ (JobEnvelope) và trạng thái vòng đời."""

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class JobStatus(StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    RETRYING = "RETRYING"
    SUCCEEDED = "SUCCEEDED"
    DEAD_LETTER = "DEAD_LETTER"


@dataclass(slots=True)
class JobEnvelope:
    job_id: str
    task_name: str
    args: tuple[Any, ...] = ()
    kwargs: dict[str, Any] = field(default_factory=dict)
    max_retries: int = 3
    attempts: int = 0
    status: JobStatus = JobStatus.PENDING
    last_error: str | None = None

    def next_backoff_seconds(self) -> float:
        """Tính thời gian chờ thử lại theo cấp số nhân (Exponential Backoff)."""
        return round(0.5 * (2 ** max(0, self.attempts - 1)), 2)`,
      },
      {
        path: 'src/pyqueue/core/security.py',
        roleDescription:
          'Ký và xác thực tính toàn vẹn của gói tin Job bằng `hmac` + `sha256`, chống tấn công giả mạo payload trong hàng đợi.',
        keyPatterns: ['hmac.new', 'hmac.compare_digest', 'hashlib.sha256'],
        language: 'python',
        code: `"""Bảo mật gói tin hàng đợi bằng chữ ký số HMAC-SHA256."""

import hashlib
import hmac
import json
from typing import Any


class PayloadSigner:
    def __init__(self, secret_key: str) -> None:
        self._secret = secret_key.encode("utf-8")

    def sign(self, payload: dict[str, Any]) -> str:
        raw = json.dumps(payload, sort_keys=True).encode("utf-8")
        return hmac.new(self._secret, raw, hashlib.sha256).hexdigest()

    def verify(self, payload: dict[str, Any], signature: str) -> bool:
        expected = self.sign(payload)
        # Sử dụng compare_digest để chống tấn công đo thời gian (Timing Attack)
        return hmac.compare_digest(expected, signature)`,
      },
      {
        path: 'src/pyqueue/broker/memory_broker.py',
        roleDescription:
          'Bộ trung chuyển tin nhắn (Message Broker) sử dụng `collections.deque` cho hàng đợi chính và `dead_letter_queue` cho các tác vụ lỗi nặng.',
        keyPatterns: ['collections.deque', 'popleft()', 'Dead-Letter Queue (DLQ)'],
        language: 'python',
        code: `"""Message Broker quản lý hàng đợi chính và hàng đợi thư chết (DLQ)."""

from collections import deque
from pyqueue.core.job import JobEnvelope, JobStatus


class InMemoryBroker:
    """Mô phỏng Redis Broker với thao tác đẩy/lấy O(1) qua deque."""

    def __init__(self) -> None:
        self.ready_queue: deque[JobEnvelope] = deque()
        self.dead_letter_queue: deque[JobEnvelope] = deque()

    def enqueue(self, job: JobEnvelope) -> None:
        self.ready_queue.append(job)

    def dequeue(self) -> JobEnvelope | None:
        if not self.ready_queue:
            return None
        return self.ready_queue.popleft()

    def move_to_dlq(self, job: JobEnvelope, error_msg: str) -> None:
        job.status = JobStatus.DEAD_LETTER
        job.last_error = error_msg
        self.dead_letter_queue.append(job)`,
      },
      {
        path: 'src/pyqueue/worker/registry.py',
        roleDescription:
          'Cung cấp Decorator `@task(name=..., max_retries=...)` để đăng ký các hàm Python vào bảng ánh xạ của Worker.',
        keyPatterns: ['Parameterized Decorator', 'Callable Registry'],
        language: 'python',
        code: `"""Bảng đăng ký các hàm xử lý tác vụ ngầm (Task Registry)."""

from collections.abc import Callable
from typing import Any

TASK_REGISTRY: dict[str, Callable[..., Any]] = {}


def task(name: str | None = None):
    """Decorator đăng ký hàm vào TASK_REGISTRY của Worker."""

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        task_key = name or f"{func.__module__}.{func.__name__}"
        TASK_REGISTRY[task_key] = func
        return func

    return decorator`,
      },
      {
        path: 'src/pyqueue/worker/runner.py',
        roleDescription:
          'Tiến trình Worker lấy Job từ Broker, thực thi hàm tương ứng, tự động Retry nếu gặp lỗi hoặc đẩy vào Dead-Letter Queue (DLQ).',
        keyPatterns: ['Worker Loop', 'Retry & DLQ Routing', 'Exception Handling'],
        language: 'python',
        code: `"""Bộ thực thi tác vụ ngầm (Worker Runner) có cơ chế Retry và DLQ."""

from pyqueue.broker.memory_broker import InMemoryBroker
from pyqueue.core.job import JobEnvelope, JobStatus
from pyqueue.worker.registry import TASK_REGISTRY


class WorkerRunner:
    def __init__(self, broker: InMemoryBroker) -> None:
        self._broker = broker

    def process_one(self) -> JobEnvelope | None:
        job = self._broker.dequeue()
        if job is None:
            return None

        handler = TASK_REGISTRY.get(job.task_name)
        if handler is None:
            self._broker.move_to_dlq(job, f"Không tìm thấy task '{job.task_name}'")
            return job

        job.attempts += 1
        job.status = JobStatus.RUNNING

        try:
            handler(*job.args, **job.kwargs)
            job.status = JobStatus.SUCCEEDED
            job.last_error = None
        except Exception as exc:
            if job.attempts < job.max_retries:
                job.status = JobStatus.RETRYING
                job.last_error = str(exc)
                # Đưa lại vào cuối hàng đợi để thử lại
                self._broker.enqueue(job)
            else:
                self._broker.move_to_dlq(job, str(exc))

        return job`,
      },
      {
        path: 'src/pyqueue/tasks/email_tasks.py',
        roleDescription:
          'Định nghĩa các tác vụ nghiệp vụ chạy ngầm như gửi email biên lai và kết xuất báo cáo PDF.',
        keyPatterns: ['@task decorator', 'RuntimeError simulation'],
        language: 'python',
        code: `"""Các tác vụ nghiệp vụ chạy ngầm được gắn decorator @task."""

from pyqueue.worker.registry import task


@task(name="emails.send_receipt")
def send_receipt_email(recipient: str, order_id: str) -> str:
    if "@" not in recipient:
        raise ValueError(f"Địa chỉ email không hợp lệ: {recipient}")
    return f"Đã gửi biên lai {order_id} tới {recipient}"`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-worker-happy',
        label: 'Worker: Xử lý Lô 3 Job Thành công',
        kind: 'run',
        command: 'python -m pyqueue.worker --queue default --concurrency 4',
        description: 'Khởi chạy Worker tiêu thụ các tác vụ gửi email hợp lệ trong hàng đợi',
        stdout: `[Worker-01] Registered tasks: ['emails.send_receipt']
[Job #J-101] status=RUNNING (attempt 1/3) -> emails.send_receipt('minh@dev.vn', 'ORD-01')
[Job #J-101] status=SUCCEEDED in 12ms
[Job #J-102] status=RUNNING (attempt 1/3) -> emails.send_receipt('lan@dev.vn', 'ORD-02')
[Job #J-102] status=SUCCEEDED in 9ms
[Broker Stats] ready_queue=0 | dead_letter_queue=0`,
      },
      {
        id: 'cmd-worker-dlq',
        label: 'Worker: Mô phỏng Job Lỗi 3 lần -> Chuyển vào DLQ',
        kind: 'run',
        command: 'python -m pyqueue.worker --simulate-bad-job',
        description: 'Khi email sai định dạng, Worker thử lại đủ 3 lần theo Exponential Backoff rồi đẩy vào Dead-Letter Queue',
        stdout: `[Job #J-999] Attempt 1/3 FAILED: ValueError('Địa chỉ email không hợp lệ: invalid-email') -> Re-queued (backoff=0.5s)
[Job #J-999] Attempt 2/3 FAILED: ValueError('Địa chỉ email không hợp lệ: invalid-email') -> Re-queued (backoff=1.0s)
[Job #J-999] Attempt 3/3 FAILED: Max retries (3) exceeded!
[DLQ Alert] Moved Job #J-999 to dead_letter_queue (status=DEAD_LETTER)
[Broker Stats] ready_queue=0 | dead_letter_queue=1`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 13: JWT AUTH, RBAC & RATE-LIMITING GATEWAY (PRO)
  // ============================================================================
  {
    id: 'sample-13-jwt-rbac-gateway',
    number: 13,
    slug: '13-jwt-auth-rbac-gateway',
    title: 'Hệ thống Xác thực JWT, Phân quyền RBAC & Rate Limiter Middleware (FastAPI)',
    complexity: 'pro',
    complexityLabel: 'Cấp 13 • Bảo mật API, RBAC & Rate Limit',
    category: 'Security, Auth & API Gateway',
    summary:
      'Một hệ thống Backend thực tế không chỉ có CRUD mà bắt buộc phải có: Băm mật khẩu chống Rainbow Table (PBKDF2-HMAC-SHA256), phát hành & xác thực JWT Token, phân quyền dựa trên vai trò (RBAC: ADMIN / EDITOR / VIEWER) qua Dependency Factory và chặn DDoS bằng Sliding-Window Rate Limiter.',
    architectureNotes: [
      'Chia tách rõ ràng 4 phân khu: `core/` (mã hóa mật khẩu, ký JWT, ma trận quyền RBAC), `middlewares/` (Sliding Window Rate Limiter theo IP), `schemas/` (DTO đăng nhập/phản hồi), và `api/` (Dependencies & Routes).',
      'Sử dụng Dependency Factory `require_permission(Permission.READ_PAYROLL)` trả về hàm `Depends` động, giúp gắn kiểm tra quyền lên từng Endpoint chỉ với 1 dòng khai báo.',
      'Mật khẩu được băm kèm `salt` ngẫu nhiên bằng `hashlib.pbkdf2_hmac("sha256", ...)` với 100,000 vòng lặp và so sánh bằng `hmac.compare_digest`.',
    ],
    techStack: ['FastAPI Security', 'PBKDF2-HMAC', 'JWT HMAC-SHA256', 'RBAC Matrix', 'Rate Limiter'],
    defaultFilePath: 'src/iam_service/api/deps.py',
    files: [
      {
        path: 'src/iam_service/core/permissions.py',
        roleDescription:
          'Định nghĩa hệ thống Vai trò (`Role`), Quyền hạn (`Permission`) và bảng ánh xạ phân quyền RBAC.',
        keyPatterns: ['StrEnum', 'frozenset', 'RBAC Policy Matrix'],
        language: 'python',
        code: `"""Định nghĩa ma trận phân quyền dựa trên vai trò (Role-Based Access Control)."""

from enum import StrEnum


class Role(StrEnum):
    VIEWER = "VIEWER"
    MANAGER = "MANAGER"
    ADMIN = "ADMIN"


class Permission(StrEnum):
    READ_REPORTS = "reports:read"
    APPROVE_INVOICE = "invoice:approve"
    VIEW_PAYROLL = "payroll:view"
    MANAGE_USERS = "users:manage"


ROLE_PERMISSIONS: dict[Role, frozenset[Permission]] = {
    Role.VIEWER: frozenset({Permission.READ_REPORTS}),
    Role.MANAGER: frozenset({
        Permission.READ_REPORTS,
        Permission.APPROVE_INVOICE,
    }),
    Role.ADMIN: frozenset(Permission),  # Toàn quyền hệ thống
}


def has_permission(role: Role, required: Permission) -> bool:
    """Kiểm tra O(1) xem vai trò có quyền yêu cầu hay không."""
    return required in ROLE_PERMISSIONS.get(role, frozenset())`,
      },
      {
        path: 'src/iam_service/core/security.py',
        roleDescription:
          'Băm mật khẩu chuẩn `pbkdf2_hmac` và tạo/xác thực chữ ký Token bằng `hmac.compare_digest`.',
        keyPatterns: ['hashlib.pbkdf2_hmac', 'hmac.compare_digest', 'base64'],
        language: 'python',
        code: `"""Mô-đun mật mã học: Băm mật khẩu PBKDF2 và ký số Token."""

import base64
import hashlib
import hmac
import json

SECRET_KEY = b"production-super-secret-signing-key-2026"


def hash_password(password: str, salt: str = "lg_static_salt") -> str:
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return dk.hex()


def create_signed_token(user_id: str, role: str) -> str:
    payload_bytes = json.dumps({"sub": user_id, "role": role}).encode("utf-8")
    b64_payload = base64.urlsafe_b64encode(payload_bytes).decode("ascii")
    sig = hmac.new(SECRET_KEY, b64_payload.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{sig}"


def verify_signed_token(token: str) -> dict[str, str]:
    try:
        b64_payload, provided_sig = token.split(".", maxsplit=1)
    except ValueError as exc:
        raise ValueError("Định dạng Token không hợp lệ") from exc

    expected_sig = hmac.new(
        SECRET_KEY, b64_payload.encode("ascii"), hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected_sig, provided_sig):
        raise ValueError("Chữ ký Token đã bị can thiệp hoặc hết hạn")

    raw_json = base64.urlsafe_b64decode(b64_payload.encode("ascii"))
    return json.loads(raw_json.decode("utf-8"))`,
      },
      {
        path: 'src/iam_service/middlewares/rate_limiter.py',
        roleDescription:
          'Bộ giới hạn tần suất gọi API theo cửa sổ trượt (Sliding Window Rate Limiter) sử dụng `collections.deque`.',
        keyPatterns: ['defaultdict(deque)', 'Sliding Window', 'HTTP 429'],
        language: 'python',
        code: `"""Bộ giới hạn tần suất gọi API (Sliding Window Rate Limiter)."""

from collections import defaultdict, deque


class SlidingWindowRateLimiter:
    """Giới hạn tối đa max_requests trong khoảng window_seconds cho mỗi IP/Client."""

    def __init__(self, max_requests: int = 5, window_seconds: float = 60.0) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow_request(self, client_id: str, now_ts: float) -> tuple[bool, int]:
        """Trả về (Được_phép, Số_quota_còn_lại)."""
        history = self._hits[client_id]
        cutoff = now_ts - self.window_seconds

        # Dọn các mốc thời gian đã trôi qua khỏi cửa sổ O(1)
        while history and history[0] <= cutoff:
            history.popleft()

        if len(history) >= self.max_requests:
            return False, 0

        history.append(now_ts)
        return True, self.max_requests - len(history)`,
      },
      {
        path: 'src/iam_service/api/deps.py',
        roleDescription:
          'Dependency Factory `require_permission` tích hợp xác thực Bearer Token và kiểm tra quyền RBAC cho FastAPI.',
        keyPatterns: ['Higher-Order Dependency', 'Depends', 'HTTPException 403'],
        language: 'python',
        code: `"""FastAPI Dependencies kiểm tra danh tính và quyền hạn RBAC."""

from collections.abc import Callable
from fastapi import Depends, Header, HTTPException, status
from iam_service.core.permissions import Permission, Role, has_permission
from iam_service.core.security import verify_signed_token


async def get_current_principal(
    authorization: str = Header(default=""),
) -> dict[str, str]:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu Bearer Token trong Header Authorization",
        )
    raw_token = authorization.removeprefix("Bearer ").strip()
    try:
        return verify_signed_token(raw_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


def require_permission(required: Permission) -> Callable[..., dict[str, str]]:
    """Factory sinh Dependency kiểm tra quyền cụ thể cho từng Endpoint."""

    async def permission_checker(
        principal: dict[str, str] = Depends(get_current_principal),
    ) -> dict[str, str]:
        user_role = Role(principal["role"])
        if not has_permission(user_role, required):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Vai trò '{user_role}' không có quyền '{required}'",
            )
        return principal

    return permission_checker`,
      },
      {
        path: 'src/iam_service/api/routes.py',
        roleDescription:
          'Định nghĩa các Endpoint bảo mật `/auth/token` và `/admin/payroll` được bảo vệ bởi `Depends(require_permission(...))`.',
        keyPatterns: ['APIRouter', 'Depends(require_permission(...))'],
        language: 'python',
        code: `"""Các tuyến API được bảo vệ bởi RBAC Dependency."""

from fastapi import APIRouter, Depends
from iam_service.api.deps import require_permission
from iam_service.core.permissions import Permission

router = APIRouter()


@router.get("/api/v1/payroll")
async def get_company_payroll(
    principal: dict[str, str] = Depends(require_permission(Permission.VIEW_PAYROLL)),
) -> dict[str, object]:
    """Chỉ vai trò ADMIN mới có quyền truy cập bảng lương."""
    return {
        "requested_by": principal["sub"],
        "role": principal["role"],
        "total_monthly_payroll_usd": "185,400.00",
        "departments": 4,
    }`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-iam-403',
        label: 'cURL: Gọi /api/v1/payroll với quyền VIEWER (403 Forbidden)',
        kind: 'curl',
        command: `curl -i http://localhost:8000/api/v1/payroll \\
  -H "Authorization: Bearer eyJzdWIiOiJ1c2VyXzAxIiwicm9sZSI6IlZJRVdFUiJ9.9f8a1c"`,
        description: 'User có vai trò VIEWER cố truy cập bảng lương -> Bị chặn bởi require_permission(Permission.VIEW_PAYROLL)',
        httpMeta: {
          method: 'GET',
          endpoint: '/api/v1/payroll',
          statusCode: 403,
          statusText: '403 Forbidden',
          latencyMs: 2,
        },
        stdout: `HTTP/1.1 403 Forbidden
content-type: application/json
x-ratelimit-remaining: 4

{
  "detail": "Vai trò 'VIEWER' không có quyền 'payroll:view'"
}`,
      },
      {
        id: 'cmd-iam-200',
        label: 'cURL: Gọi /api/v1/payroll với quyền ADMIN (200 OK)',
        kind: 'curl',
        command: `curl -i http://localhost:8000/api/v1/payroll \\
  -H "Authorization: Bearer eyJzdWIiOiJhZG1pbl9zb24iLCJyb2xlIjoiQURNSU4ifQ.7b2e9d"`,
        description: 'Token ADMIN hợp lệ vượt qua kiểm tra chữ ký HMAC và ma trận RBAC',
        httpMeta: {
          method: 'GET',
          endpoint: '/api/v1/payroll',
          statusCode: 200,
          statusText: '200 OK',
          latencyMs: 3,
        },
        stdout: `HTTP/1.1 200 OK
content-type: application/json
x-ratelimit-remaining: 3

{
  "requested_by": "admin_son",
  "role": "ADMIN",
  "total_monthly_payroll_usd": "185,400.00",
  "departments": 4
}`,
      },
      {
        id: 'cmd-iam-429',
        label: 'cURL: Vượt ngưỡng Rate Limit (429 Too Many Requests)',
        kind: 'curl',
        command: 'curl -i http://localhost:8000/api/v1/payroll -H "X-Forwarded-For: 203.0.113.5"',
        description: 'Khi 1 IP gửi quá 5 requests/phút, SlidingWindowRateLimiter lập tức chặn ở tầng Middleware',
        httpMeta: {
          method: 'GET',
          endpoint: '/api/v1/payroll',
          statusCode: 429,
          statusText: '429 Too Many Requests',
          latencyMs: 1,
        },
        stdout: `HTTP/1.1 429 Too Many Requests
retry-after: 42
x-ratelimit-remaining: 0
content-type: application/json

{
  "detail": "Vượt quá giới hạn 5 requests/60s. Vui lòng thử lại sau 42 giây."
}`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 14: REAL-TIME WEBSOCKET CHAT & PUB/SUB HUB (PRO)
  // ============================================================================
  {
    id: 'sample-14-websocket-chat-hub',
    number: 14,
    slug: '14-realtime-websocket-chat',
    title: 'Hệ thống Chat & Thông báo Thời gian Thực Đa Phòng (FastAPI WebSockets & Pub/Sub)',
    complexity: 'pro',
    complexityLabel: 'Cấp 14 • WebSockets & Real-Time Pub/Sub',
    category: 'Real-Time & WebSockets',
    summary:
      'Xây dựng máy chủ giao tiếp hai chiều thời gian thực (Full-Duplex WebSockets): Quản lý kết nối theo từng phòng (Room Connection Manager), tự động dọn dẹp kết nối đứt gãy (Dead-Socket Pruning), kiểm duyệt nội dung tin nhắn và phát tán sự kiện đồng thời bằng asyncio.gather.',
    architectureNotes: [
      'Cấu trúc chia thành `domain/` (định nghĩa các gói tin sự kiện WebSocket), `hub/` (quản lý danh sách kết nối theo phòng bằng `defaultdict(set)`), `services/` (bộ lọc chống spam/từ cấm), và `api/` (WebSocket endpoint & REST Broadcast endpoint).',
      'Khi phát tin nhắn (`broadcast_to_room`), nếu một client đã đóng trình duyệt đột ngột gây lỗi gửi, `ConnectionManager` tự động thu hồi socket đó khỏi `set` để tránh rò rỉ bộ nhớ (Memory Leak).',
    ],
    techStack: ['FastAPI WebSocket', 'defaultdict(set)', 'asyncio.gather', 'Pub/Sub Pattern'],
    defaultFilePath: 'src/rt_chat/hub/connection_manager.py',
    files: [
      {
        path: 'src/rt_chat/domain/events.py',
        roleDescription:
          'Định nghĩa cấu trúc gói tin sự kiện thời gian thực (`ChatEvent`) truyền qua kết nối WebSocket.',
        keyPatterns: ['StrEnum', '@dataclass', 'to_json_dict'],
        language: 'python',
        code: `"""Mô hình sự kiện truyền tải qua giao thức WebSocket."""

from dataclasses import asdict, dataclass
from enum import StrEnum
from typing import Any


class EventType(StrEnum):
    USER_JOINED = "user.joined"
    CHAT_MESSAGE = "chat.message"
    USER_LEFT = "user.left"
    SYSTEM_ALERT = "system.alert"


@dataclass(frozen=True, slots=True)
class ChatEvent:
    event_type: EventType
    room_id: str
    sender: str
    content: str
    timestamp_iso: str

    def to_payload(self) -> dict[str, Any]:
        return asdict(self)`,
      },
      {
        path: 'src/rt_chat/services/moderation.py',
        roleDescription:
          'Bộ lọc kiểm duyệt nội dung tin nhắn: chuẩn hóa khoảng trắng và che các từ khóa nhạy cảm trước khi phát tán.',
        keyPatterns: ['re.compile', 'Pure Sanitizer Function'],
        language: 'python',
        code: `"""Dịch vụ kiểm duyệt và làm sạch tin nhắn thời gian thực."""

import re

BANNED_WORDS_RE = re.compile(r"\\b(spamlink|malware|scam)\\b", re.IGNORECASE)


def sanitize_message(raw_text: str) -> str:
    """Cắt khoảng trắng thừa và che từ khóa vi phạm chính sách."""
    cleaned = " ".join(raw_text.strip().split())
    if not cleaned:
        raise ValueError("Nội dung tin nhắn không được để trống")
    return BANNED_WORDS_RE.sub("***", cleaned)`,
      },
      {
        path: 'src/rt_chat/hub/connection_manager.py',
        roleDescription:
          'Trái tim của hệ thống Real-time: Quản lý tập hợp WebSockets theo từng phòng (`room_id`) và tự động dọn kết nối chết khi Broadcast.',
        keyPatterns: ['defaultdict(set)', 'Dead-Socket Pruning', 'asyncio.gather'],
        language: 'python',
        code: `"""Quản lý kết nối WebSocket đa phòng và phát tán tin nhắn song song."""

import asyncio
from collections import defaultdict
from typing import Any, Protocol
from rt_chat.domain.events import ChatEvent


class WebSocketLike(Protocol):
    async def accept(self) -> None: ...
    async def send_json(self, data: dict[str, Any]) -> None: ...


class RoomConnectionManager:
    """Quản lý các kết nối đang mở theo từng phòng (room_id)."""

    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocketLike]] = defaultdict(set)

    async def connect(self, room_id: str, ws: WebSocketLike) -> int:
        await ws.accept()
        self._rooms[room_id].add(ws)
        return len(self._rooms[room_id])

    def disconnect(self, room_id: str, ws: WebSocketLike) -> int:
        members = self._rooms.get(room_id)
        if members and ws in members:
            members.remove(ws)
            if not members:
                del self._rooms[room_id]
        return len(self._rooms.get(room_id, set()))

    async def broadcast(self, event: ChatEvent) -> int:
        """Gửi sự kiện đồng thời tới mọi kết nối trong phòng; tự dọn socket lỗi."""
        members = list(self._rooms.get(event.room_id, set()))
        if not members:
            return 0

        payload = event.to_payload()
        dead_sockets: list[WebSocketLike] = []

        async def _safe_send(ws: WebSocketLike) -> None:
            try:
                await ws.send_json(payload)
            except Exception:
                dead_sockets.append(ws)

        await asyncio.gather(*(_safe_send(ws) for ws in members))

        for dead_ws in dead_sockets:
            self.disconnect(event.room_id, dead_ws)

        return len(members) - len(dead_sockets)`,
      },
      {
        path: 'src/rt_chat/api/ws_router.py',
        roleDescription:
          'Endpoint WebSocket `/ws/rooms/{room_id}` duy trì vòng lặp lắng nghe tin nhắn và xử lý sự kiện ngắt kết nối.',
        keyPatterns: ['@router.websocket', 'try/except/finally disconnect'],
        language: 'python',
        code: `"""Định tuyến WebSocket cho phòng chat thời gian thực."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from rt_chat.domain.events import ChatEvent, EventType
from rt_chat.hub.connection_manager import RoomConnectionManager
from rt_chat.services.moderation import sanitize_message

router = APIRouter()
hub = RoomConnectionManager()


@router.websocket("/ws/rooms/{room_id}")
async def room_websocket_endpoint(
    websocket: WebSocket, room_id: str, user: str = "anonymous"
) -> None:
    online_count = await hub.connect(room_id, websocket)
    await hub.broadcast(
        ChatEvent(
            event_type=EventType.USER_JOINED,
            room_id=room_id,
            sender="system",
            content=f"{user} đã tham gia phòng ({online_count} online)",
            timestamp_iso="2026-11-08T12:30:00Z",
        )
    )
    try:
        while True:
            raw_msg = await websocket.receive_text()
            safe_msg = sanitize_message(raw_msg)
            await hub.broadcast(
                ChatEvent(
                    event_type=EventType.CHAT_MESSAGE,
                    room_id=room_id,
                    sender=user,
                    content=safe_msg,
                    timestamp_iso="2026-11-08T12:30:05Z",
                )
            )
    except WebSocketDisconnect:
        remaining = hub.disconnect(room_id, websocket)
        await hub.broadcast(
            ChatEvent(
                event_type=EventType.USER_LEFT,
                room_id=room_id,
                sender="system",
                content=f"{user} đã rời phòng ({remaining} online)",
                timestamp_iso="2026-11-08T12:31:00Z",
            )
        )`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-ws-session',
        label: 'Mô phỏng Phiên Chat Đa Client & Tự dọn Dead Socket',
        kind: 'run',
        command: 'python -m rt_chat.simulator --room python-architecture --clients 3',
        description: '3 client kết nối vào phòng, gửi tin nhắn chứa từ cấm (bị che ***) và 1 client rớt mạng đột ngột',
        stdout: `[WS Hub] Client 'minh' connected to room 'python-architecture' (1 online)
[WS Hub] Client 'lan' connected to room 'python-architecture' (2 online)
[WS Hub] Client 'hung' connected to room 'python-architecture' (3 online)
[Broadcast -> 3 clients] {"event_type": "chat.message", "sender": "minh", "content": "Anh em xem thử link *** này chưa?"}
[Socket Error] Client 'hung' connection reset by peer -> Auto-pruned from room!
[Broadcast -> 2 healthy clients] Active sockets in 'python-architecture': 2`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 15: QUANT TRADING BACKTESTER & RISK ENGINE (MASTER)
  // ============================================================================
  {
    id: 'sample-15-quant-backtester',
    number: 15,
    slug: '15-quant-trading-backtester',
    title: 'Động cơ Backtest Chiến lược Giao dịch Định lượng & Quản trị Rủi ro (Quant Finance)',
    complexity: 'master',
    complexityLabel: 'Cấp 15 • Quant Finance & Data Science',
    category: 'Quant Finance & Algorithmic Trading',
    summary:
      'Ứng dụng Python trong Tài chính Định lượng (Quantitative Finance): Thiết kế động cơ kiểm thử chiến lược giao dịch theo sự kiện từng cây nến (Event-Driven OHLCV Backtester), tính chỉ báo SMA/EMA trượt bằng deque(maxlen=N) O(1), chiến lược giao cắt Golden Cross và bộ Quản trị Rủi ro cắt lỗ tự động khi vượt ngưỡng Max Drawdown.',
    architectureNotes: [
      'Cấu trúc 5 phân hệ chuyên sâu: `domain/` (cây nến giá `OHLCVBar` & lệnh giao dịch), `indicators/` (chỉ báo kỹ thuật cửa sổ trượt `RollingSMA`), `strategies/` (`StrategyProtocol` & `MovingAverageCrossover`), `portfolio/` (quản lý vốn, tính Max Drawdown & Win Rate), và `backtester/` (vòng lặp mô phỏng khớp lệnh).',
      'Sử dụng `collections.deque(maxlen=window)` để tính đường trung bình trượt (Moving Average) theo luồng mà không cần cấp phát lại mảng.',
      'Tích hợp chốt chặn an toàn (Circuit Breaker): Nếu danh mục sụt giảm vượt quá `max_drawdown_limit` (ví dụ 15%), `RiskManager` tự động khóa chiều mua để bảo toàn vốn.',
    ],
    techStack: ['collections.deque(maxlen)', 'Decimal', 'typing.Protocol', 'Event-Driven Simulation'],
    defaultFilePath: 'src/quant_engine/backtester/engine.py',
    files: [
      {
        path: 'src/quant_engine/domain/market_data.py',
        roleDescription:
          'Định nghĩa cấu trúc dữ liệu cây nến giá (`OHLCVBar`) và tín hiệu giao dịch (`Signal`).',
        keyPatterns: ['@dataclass(frozen=True, slots=True)', 'StrEnum'],
        language: 'python',
        code: `"""Mô hình dữ liệu thị trường (OHLCV Bar) và tín hiệu giao dịch."""

from dataclasses import dataclass
from enum import StrEnum


class Signal(StrEnum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


@dataclass(frozen=True, slots=True)
class OHLCVBar:
    """Một cây nến giá (Open, High, Low, Close, Volume) bất biến."""

    timestamp: str
    symbol: str
    open: float
    high: float
    low: float
    close: float
    volume: float`,
      },
      {
        path: 'src/quant_engine/indicators/moving_average.py',
        roleDescription:
          'Bộ tính đường trung bình động đơn giản (`RollingSMA`) sử dụng `deque(maxlen=period)` với độ phức tạp cập nhật O(1).',
        keyPatterns: ['collections.deque(maxlen=...)', 'Sliding Window O(1)'],
        language: 'python',
        code: `"""Chỉ báo kỹ thuật đường trung bình động cửa sổ trượt (Rolling SMA)."""

from collections import deque


class RollingSMA:
    """Tính Simple Moving Average trên cửa sổ trượt kích thước cố định."""

    def __init__(self, period: int) -> None:
        if period <= 0:
            raise ValueError("Chu kỳ SMA phải lớn hơn 0")
        self.period = period
        self._window: deque[float] = deque(maxlen=period)
        self._running_sum: float = 0.0

    def update(self, price: float) -> float | None:
        if len(self._window) == self.period:
            self._running_sum -= self._window[0]
        self._window.append(price)
        self._running_sum += price

        if len(self._window) < self.period:
            return None
        return round(self._running_sum / self.period, 4)`,
      },
      {
        path: 'src/quant_engine/strategies/ma_crossover.py',
        roleDescription:
          'Chiến lược giao cắt 2 đường trung bình động (`Fast SMA` cắt lên `Slow SMA` -> `BUY`, cắt xuống -> `SELL`).',
        keyPatterns: ['Golden Cross / Death Cross', 'State Machine'],
        language: 'python',
        code: `"""Chiến lược giao cắt đường trung bình động (Moving Average Crossover)."""

from quant_engine.domain.market_data import OHLCVBar, Signal
from quant_engine.indicators.moving_average import RollingSMA


class MACrossoverStrategy:
    """Phát tín hiệu BUY khi SMA ngắn hạn vượt lên trên SMA dài hạn."""

    def __init__(self, fast_period: int = 3, slow_period: int = 5) -> None:
        self._fast_sma = RollingSMA(fast_period)
        self._slow_sma = RollingSMA(slow_period)
        self._was_above: bool | None = None

    def on_bar(self, bar: OHLCVBar) -> Signal:
        fast_val = self._fast_sma.update(bar.close)
        slow_val = self._slow_sma.update(bar.close)

        if fast_val is None or slow_val is None:
            return Signal.HOLD

        is_above = fast_val > slow_val
        signal = Signal.HOLD

        if self._was_above is not None:
            if is_above and not self._was_above:
                signal = Signal.BUY
            elif not is_above and self._was_above:
                signal = Signal.SELL

        self._was_above = is_above
        return signal`,
      },
      {
        path: 'src/quant_engine/portfolio/risk_manager.py',
        roleDescription:
          'Quản lý vốn, theo dõi đỉnh tài sản (`peak_equity`) và tính mức sụt giảm tối đa (`Max Drawdown %`).',
        keyPatterns: ['Max Drawdown Tracking', 'Circuit Breaker'],
        language: 'python',
        code: `"""Bộ quản trị rủi ro danh mục và kiểm soát sụt giảm vốn (Max Drawdown)."""


class PortfolioRiskManager:
    def __init__(
        self, initial_cash: float = 10_000.0, max_drawdown_pct: float = 15.0
    ) -> None:
        self.cash = initial_cash
        self.position_qty = 0.0
        self.peak_equity = initial_cash
        self.max_drawdown_seen = 0.0
        self.max_drawdown_limit = max_drawdown_pct
        self.completed_trades = 0

    def current_equity(self, mark_price: float) -> float:
        return round(self.cash + self.position_qty * mark_price, 2)

    def update_drawdown(self, mark_price: float) -> float:
        eq = self.current_equity(mark_price)
        if eq > self.peak_equity:
            self.peak_equity = eq
        dd_pct = round(((self.peak_equity - eq) / self.peak_equity) * 100.0, 2)
        if dd_pct > self.max_drawdown_seen:
            self.max_drawdown_seen = dd_pct
        return dd_pct

    def is_circuit_breaker_tripped(self, mark_price: float) -> bool:
        return self.update_drawdown(mark_price) >= self.max_drawdown_limit`,
      },
      {
        path: 'src/quant_engine/backtester/engine.py',
        roleDescription:
          'Động cơ chạy mô phỏng lịch sử (`BacktestEngine`) duyệt qua từng cây nến, khớp lệnh kèm phí giao dịch và xuất báo cáo hiệu suất.',
        keyPatterns: ['Event-Driven Loop', 'Performance Metrics'],
        language: 'python',
        code: `"""Động cơ kiểm thử chiến lược giao dịch theo sự kiện lịch sử (Backtester)."""

from quant_engine.domain.market_data import OHLCVBar, Signal
from quant_engine.portfolio.risk_manager import PortfolioRiskManager
from quant_engine.strategies.ma_crossover import MACrossoverStrategy


def run_backtest(
    bars: list[OHLCVBar],
    strategy: MACrossoverStrategy,
    initial_cash: float = 10_000.0,
) -> dict[str, object]:
    """Chạy mô phỏng chiến lược qua chuỗi nến lịch sử và trả về báo cáo."""
    portfolio = PortfolioRiskManager(initial_cash=initial_cash)

    for bar in bars:
        if portfolio.is_circuit_breaker_tripped(bar.close):
            break

        sig = strategy.on_bar(bar)
        if sig == Signal.BUY and portfolio.position_qty == 0.0:
            portfolio.position_qty = round(portfolio.cash / bar.close, 4)
            portfolio.cash = 0.0
        elif sig == Signal.SELL and portfolio.position_qty > 0.0:
            portfolio.cash = round(portfolio.position_qty * bar.close, 2)
            portfolio.position_qty = 0.0
            portfolio.completed_trades += 1

        portfolio.update_drawdown(bar.close)

    last_price = bars[-1].close if bars else 0.0
    final_eq = portfolio.current_equity(last_price)
    roi_pct = round(((final_eq - initial_cash) / initial_cash) * 100.0, 2)

    return {
        "initial_cash": initial_cash,
        "final_equity": final_eq,
        "roi_pct": roi_pct,
        "max_drawdown_pct": portfolio.max_drawdown_seen,
        "completed_trades": portfolio.completed_trades,
    }`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-quant-run',
        label: 'Chạy Backtest Chiến lược Golden Cross (BTC/USD)',
        kind: 'run',
        command: 'python -m quant_engine.backtester --symbol BTCUSD --fast 3 --slow 5',
        description: 'Mô phỏng chiến lược giao cắt SMA(3)/SMA(5) với vốn khởi điểm $10,000',
        stdout: `[Backtester] Loaded 120 OHLCV bars for BTCUSD | Initial Capital: $10,000.00
[Bar #06 | 2026-10-06] Signal=BUY  @ $62,400.00 -> Bought 0.1603 BTC
[Bar #19 | 2026-10-19] Signal=SELL @ $67,850.00 -> Sold 0.1603 BTC ($10,876.35 | +8.76%)
[Bar #34 | 2026-11-01] Signal=BUY  @ $66,100.00 -> Bought 0.1645 BTC
[Bar #48 | 2026-11-08] Signal=SELL @ $71,200.00 -> Sold 0.1645 BTC ($11,712.40 | +17.12%)
Report: {
  'initial_cash': 10000.0,
  'final_equity': 11712.4,
  'roi_pct': 17.12,
  'max_drawdown_pct': 4.35,
  'completed_trades': 2
}`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 16: CQRS, EVENT SOURCING & SAGA ORCHESTRATOR (MASTER)
  // ============================================================================
  {
    id: 'sample-16-cqrs-saga-microservices',
    number: 16,
    slug: '16-cqrs-saga-microservices',
    title: 'Hệ thống Đặt vé Phân tán với Event Sourcing, CQRS & Saga Orchestrator',
    complexity: 'master',
    complexityLabel: 'Cấp 16 • Event Sourcing, CQRS & Saga Pattern',
    category: 'Enterprise Distributed Systems',
    summary:
      'Kiến trúc đỉnh cao cho các hệ thống phân tán (Hàng không, Ngân hàng, Thương mại điện tử lớn): Tách biệt hoàn toàn luồng Ghi (Command Side - Event Sourcing lưu chuỗi sự kiện bất biến) và luồng Đọc (Query Side - Read Model Projection), kết hợp Saga Orchestrator tự động chạy Giao dịch Bù trừ (Compensating Transaction) khi một dịch vụ con thất bại.',
    architectureNotes: [
      'Cấu trúc 6 phân khu chuẩn Enterprise: `domain/` (Domain Events bất biến), `event_store/` (Kho sự kiện Append-Only có kiểm tra xung đột phiên bản Optimistic Concurrency), `command_side/` (Aggregate tái tạo trạng thái từ lịch sử sự kiện), `query_side/` (Bản chiếu Read Model tối ưu cho truy vấn nhanh O(1)), `saga/` (Bộ điều phối giao dịch phân tán & hoàn trả bù trừ), và `tests/`.',
      'Khi đặt vé máy bay: Bước 1 (`ReserveSeat`) thành công -> Bước 2 (`ChargePayment`) bị từ chối thẻ -> `BookingSagaOrchestrator` lập tức kích hoạt bước bù trừ `CompensateReleaseSeat` để trả lại ghế trống cho hệ thống!',
    ],
    techStack: ['Event Sourcing', 'CQRS Pattern', 'Saga Orchestrator', 'Optimistic Concurrency', 'pytest'],
    defaultFilePath: 'src/booking_saga/saga/orchestrator.py',
    files: [
      {
        path: 'src/booking_saga/domain/events.py',
        roleDescription:
          'Định nghĩa các Sự kiện Miền bất biến (`DomainEvent`): mỗi thay đổi trong hệ thống đều được ghi nhận dưới dạng một sự kiện quá khứ.',
        keyPatterns: ['@dataclass(frozen=True)', 'Immutable Event Log'],
        language: 'python',
        code: `"""Các Sự kiện Miền bất biến (Immutable Domain Events) cho Event Sourcing."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class DomainEvent:
    booking_id: str
    event_type: str
    version: int
    detail: str


def make_event(booking_id: str, event_type: str, version: int, detail: str) -> DomainEvent:
    return DomainEvent(
        booking_id=booking_id,
        event_type=event_type,
        version=version,
        detail=detail,
    )`,
      },
      {
        path: 'src/booking_saga/event_store/store.py',
        roleDescription:
          'Kho lưu trữ sự kiện chỉ ghi nối tiếp (`Append-Only EventStore`) kèm kiểm tra khóa lạc quan (`OptimisticConcurrencyError`).',
        keyPatterns: ['Append-Only Log', 'Optimistic Concurrency Control'],
        language: 'python',
        code: `"""Kho lưu trữ sự kiện (Event Store) kiểm soát xung đột ghi đồng thời."""

from collections import defaultdict
from booking_saga.domain.events import DomainEvent


class ConcurrencyConflictError(RuntimeError):
    """Ném ra khi 2 tiến trình cùng ghi đè một phiên bản Aggregate."""


class InMemoryEventStore:
    def __init__(self) -> None:
        self._streams: dict[str, list[DomainEvent]] = defaultdict(list)

    def load_stream(self, booking_id: str) -> list[DomainEvent]:
        return list(self._streams.get(booking_id, []))

    def append(
        self, booking_id: str, event: DomainEvent, expected_version: int
    ) -> None:
        stream = self._streams[booking_id]
        current_version = len(stream)
        if current_version != expected_version:
            raise ConcurrencyConflictError(
                f"Xung đột phiên bản cho {booking_id}: kỳ vọng v{expected_version}, thực tế v{current_version}"
            )
        stream.append(event)`,
      },
      {
        path: 'src/booking_saga/command_side/aggregate.py',
        roleDescription:
          'Tầng Command (`BookingAggregate`): Tái dựng trạng thái hiện tại bằng cách phát lại (Replay) toàn bộ chuỗi sự kiện từ `EventStore`.',
        keyPatterns: ['Event Replay / Fold', 'Aggregate Root'],
        language: 'python',
        code: `"""Aggregate Root tái tạo trạng thái bằng cách Replay chuỗi Domain Events."""

from booking_saga.domain.events import DomainEvent


class BookingAggregate:
    def __init__(self, booking_id: str) -> None:
        self.booking_id = booking_id
        self.status = "NEW"
        self.seat_locked = False
        self.version = 0

    def apply(self, event: DomainEvent) -> None:
        """Hàm chuyển đổi trạng thái thuần túy dựa trên loại sự kiện."""
        match event.event_type:
            case "SEAT_RESERVED":
                self.seat_locked = True
                self.status = "RESERVED"
            case "PAYMENT_CHARGED":
                self.status = "CONFIRMED"
            case "PAYMENT_FAILED":
                self.status = "PAYMENT_FAILED"
            case "SEAT_RELEASED_COMPENSATION":
                self.seat_locked = False
                self.status = "CANCELLED_BY_SAGA"
        self.version = event.version

    @classmethod
    def rehydrate(
        cls, booking_id: str, history: list[DomainEvent]
    ) -> "BookingAggregate":
        agg = cls(booking_id)
        for ev in history:
            agg.apply(ev)
        return agg`,
      },
      {
        path: 'src/booking_saga/query_side/projection.py',
        roleDescription:
          'Tầng Query (CQRS Read Model): Bản chiếu phẳng giúp API đọc trạng thái đặt vé và lịch sử audit chỉ trong O(1) mà không cần replay lại mỗi lần đọc.',
        keyPatterns: ['CQRS Read Projection', 'Denormalized View'],
        language: 'python',
        code: `"""Tầng Query (CQRS): Bản chiếu Read Model phục vụ truy vấn tốc độ cao."""

from typing import Any
from booking_saga.domain.events import DomainEvent


class BookingReadModelProjection:
    """Cập nhật bảng Read Model bất cứ khi nào có sự kiện mới được phát ra."""

    def __init__(self) -> None:
        self._views: dict[str, dict[str, Any]] = {}

    def project(self, event: DomainEvent) -> None:
        view = self._views.setdefault(
            event.booking_id,
            {
                "booking_id": event.booking_id,
                "status": "NEW",
                "seat_locked": False,
                "version": 0,
                "timeline": [],
            },
        )
        view["version"] = event.version
        view["timeline"].append(f"v{event.version}:{event.event_type}")

        if event.event_type == "SEAT_RESERVED":
            view["status"] = "RESERVED"
            view["seat_locked"] = True
        elif event.event_type == "PAYMENT_CHARGED":
            view["status"] = "CONFIRMED"
        elif event.event_type == "SEAT_RELEASED_COMPENSATION":
            view["status"] = "CANCELLED_BY_SAGA"
            view["seat_locked"] = False

    def get_view(self, booking_id: str) -> dict[str, Any]:
        return self._views[booking_id]`,
      },
      {
        path: 'src/booking_saga/saga/orchestrator.py',
        roleDescription:
          'Bộ điều phối `BookingSagaOrchestrator`: Thực thi tuần tự các bước phân tán và tự động kích hoạt Giao dịch Bù trừ (`SEAT_RELEASED_COMPENSATION`) nếu bước thanh toán thất bại.',
        keyPatterns: ['Saga Orchestrator', 'Compensating Transaction'],
        language: 'python',
        code: `"""Bộ điều phối Saga (Saga Orchestrator) xử lý giao dịch phân tán và bù trừ."""

from typing import Any
from booking_saga.domain.events import make_event
from booking_saga.event_store.store import InMemoryEventStore
from booking_saga.query_side.projection import BookingReadModelProjection


class BookingSagaOrchestrator:
    def __init__(
        self,
        store: InMemoryEventStore,
        projection: BookingReadModelProjection,
    ) -> None:
        self._store = store
        self._projection = projection

    def _record(self, booking_id: str, event_type: str, version: int, detail: str) -> None:
        ev = make_event(booking_id, event_type, version, detail)
        self._store.append(booking_id, ev, expected_version=version - 1)
        self._projection.project(ev)

    def execute_booking_saga(
        self, booking_id: str, seat_no: str, payment_succeeds: bool
    ) -> dict[str, Any]:
        """Bước 1: Giữ ghế -> Bước 2: Trừ tiền thẻ -> Nếu lỗi thì chạy Bước Bù trừ trả ghế."""
        # Bước 1: Inventory Service khóa ghế
        self._record(booking_id, "SEAT_RESERVED", 1, f"Đã khóa ghế {seat_no}")

        # Bước 2: Payment Service thanh toán
        if payment_succeeds:
            self._record(booking_id, "PAYMENT_CHARGED", 2, "Thanh toán thẻ thành công")
        else:
            self._record(booking_id, "PAYMENT_FAILED", 2, "Thẻ tín dụng vượt hạn mức")
            # Bước 3 (Compensating Transaction): Hoàn tác khóa ghế
            self._record(
                booking_id,
                "SEAT_RELEASED_COMPENSATION",
                3,
                f"Saga hoàn tác: Mở khóa ghế {seat_no}",
            )

        return self._projection.get_view(booking_id)`,
      },
      {
        path: 'tests/test_saga_compensation.py',
        roleDescription:
          'Kiểm thử xác minh cả kịch bản Saga thành công và kịch bản kích hoạt giao dịch bù trừ khi thanh toán lỗi.',
        keyPatterns: ['Saga Compensation Verification', 'Event Stream Audit'],
        language: 'python',
        code: `"""Kiểm thử tự động cho luồng Saga Orchestrator và CQRS Projection."""

from booking_saga.command_side.aggregate import BookingAggregate
from booking_saga.event_store.store import InMemoryEventStore
from booking_saga.query_side.projection import BookingReadModelProjection
from booking_saga.saga.orchestrator import BookingSagaOrchestrator


def test_saga_compensates_and_releases_seat_on_payment_failure() -> None:
    store = InMemoryEventStore()
    projection = BookingReadModelProjection()
    saga = BookingSagaOrchestrator(store, projection)

    read_view = saga.execute_booking_saga(
        booking_id="BK-901", seat_no="12A", payment_succeeds=False
    )

    assert read_view["status"] == "CANCELLED_BY_SAGA"
    assert read_view["seat_locked"] is False
    assert read_view["version"] == 3

    # Kiểm tra tái tạo Aggregate từ EventStore khớp tuyệt đối với Read Model
    rehydrated = BookingAggregate.rehydrate("BK-901", store.load_stream("BK-901"))
    assert rehydrated.status == "CANCELLED_BY_SAGA"
    assert rehydrated.seat_locked is False`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-saga-success',
        label: 'cURL: POST /commands/bookings (Saga Hoàn tất 100%)',
        kind: 'curl',
        command: `curl -X POST http://localhost:8000/commands/bookings \\
  -d '{"booking_id": "BK-2026-01", "seat_no": "04F", "payment_ok": true}'`,
        description: 'Chạy Saga đặt vé máy bay: Khóa ghế 04F -> Thanh toán thành công -> Cập nhật CQRS Read View',
        httpMeta: {
          method: 'POST',
          endpoint: '/commands/bookings',
          statusCode: 201,
          statusText: '201 Created',
          latencyMs: 9,
        },
        stdout: `HTTP/1.1 201 Created
content-type: application/json

{
  "booking_id": "BK-2026-01",
  "status": "CONFIRMED",
  "seat_locked": true,
  "version": 2,
  "timeline": [
    "v1:SEAT_RESERVED",
    "v2:PAYMENT_CHARGED"
  ]
}`,
      },
      {
        id: 'cmd-saga-compensate',
        label: 'cURL: Thanh toán Lỗi -> Kích hoạt Saga Bù trừ (Compensating Action)',
        kind: 'curl',
        command: `curl -X POST http://localhost:8000/commands/bookings \\
  -d '{"booking_id": "BK-2026-02", "seat_no": "12A", "payment_ok": false}'`,
        description: 'Khi thẻ bị từ chối ở bước 2, Saga Orchestrator tự động phát sự kiện v3:SEAT_RELEASED_COMPENSATION để trả lại ghế 12A',
        httpMeta: {
          method: 'POST',
          endpoint: '/commands/bookings',
          statusCode: 409,
          statusText: '409 Saga Compensated',
          latencyMs: 11,
        },
        stdout: `HTTP/1.1 409 Conflict (Saga Compensated)
content-type: application/json

{
  "booking_id": "BK-2026-02",
  "status": "CANCELLED_BY_SAGA",
  "seat_locked": false,
  "version": 3,
  "timeline": [
    "v1:SEAT_RESERVED",
    "v2:PAYMENT_FAILED",
    "v3:SEAT_RELEASED_COMPENSATION"
  ]
}`,
      },
      {
        id: 'cmd-saga-pytest',
        label: 'Chạy Pytest (Kiểm tra Event Replay & Saga)',
        kind: 'pytest',
        command: 'pytest -v tests/test_saga_compensation.py',
        description: 'Kiểm chứng tính nhất quán giữa EventStore Aggregate Replay và CQRS Read Model',
        stdout: `============================= test session starts ==============================
collected 1 item

tests/test_saga_compensation.py::test_saga_compensates_and_releases_seat_on_payment_failure PASSED [100%]

============================== 1 passed in 0.02s ===============================`,
      },
    ],
  },
];

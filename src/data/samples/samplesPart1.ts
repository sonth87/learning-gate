import { SampleProject } from '@/types/sample.types';

export const SAMPLE_PROJECTS_PART_1: SampleProject[] = [
  // ============================================================================
  // PROJECT 01: HELLO PYTHONIC APP (FUNDAMENTAL)
  // ============================================================================
  {
    id: 'sample-01-hello-pythonic',
    number: 1,
    slug: '01-hello-pythonic-app',
    title: 'Hello World Chuẩn Kỹ Sư (src-layout, Type Hints & Entrypoint)',
    complexity: 'fundamental',
    complexityLabel: 'Cấp 1 • Khởi đầu chuẩn mực',
    category: 'Core & Project Setup',
    summary:
      'Ngay cả ứng dụng Hello World đơn giản nhất trong Python chuyên nghiệp cũng không viết tràn lan ở file lẻ mà được tổ chức theo cấu trúc src-layout (PEP 621), tách bạch hàm thuần túy (pure function), cấu hình logging và chốt chặn if __name__ == "__main__":.',
    architectureNotes: [
      'Sử dụng cấu trúc thư mục `src/hello_app/` để cô lập package nguồn, tránh lỗi import nhầm thư mục làm việc hiện tại khi chạy pytest.',
      'Tách biệt logic nghiệp vụ (`greeter.py` trả về chuỗi thuần túy, dễ kiểm thử) với lớp giao tiếp I/O (`main.py` chỉ lo đọc tham số và in ra màn hình).',
      'Sử dụng `pyproject.toml` hiện đại thay thế hoàn toàn cho `setup.py` và `requirements.txt` rời rạc.',
    ],
    techStack: ['Python 3.12+', 'pyproject.toml', 'Type Hints', 'logging', 'pytest'],
    defaultFilePath: 'src/hello_app/main.py',
    files: [
      {
        path: 'pyproject.toml',
        roleDescription:
          'File cấu hình trung tâm chuẩn PEP 621 khai báo metadata dự án, phiên bản Python tối thiểu, điểm vào CLI (scripts) và cấu hình công cụ pytest/ruff.',
        keyPatterns: ['[project]', '[project.scripts]', '[tool.pytest.ini_options]'],
        language: 'toml',
        code: `[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "hello-pythonic-app"
version = "0.1.0"
description = "Ứng dụng Hello World chuẩn kiến trúc Python hiện đại"
requires-python = ">=3.12"
dependencies = []

[project.scripts]
# Cho phép chạy lệnh "hello-app" trực tiếp trên Terminal sau khi cài đặt
hello-app = "hello_app.main:main"

[tool.pytest.ini_options]
pythonpath = ["src"]
testpaths = ["tests"]`,
      },
      {
        path: 'src/hello_app/__init__.py',
        roleDescription:
          'Đánh dấu thư mục `hello_app` là một Python Package và kiểm soát các thành phần công khai qua `__all__`.',
        keyPatterns: ['__version__', '__all__'],
        language: 'python',
        code: `"""Package khởi đầu chuẩn mực cho dự án Python."""

from hello_app.greeter import build_greeting

__version__ = "0.1.0"
__all__ = ["build_greeting", "__version__"]`,
      },
      {
        path: 'src/hello_app/greeter.py',
        roleDescription:
          'Module chứa hàm nghiệp vụ thuần túy (Pure Function) có Type Hints đầy đủ và Docstring chuẩn Google Style.',
        keyPatterns: ['Type Hints', 'f-string', 'dict.get()', 'ValueError'],
        language: 'python',
        code: `"""Module xử lý logic tạo lời chào đa ngôn ngữ."""

SUPPORTED_GREETINGS: dict[str, str] = {
    "vi": "Xin chào",
    "en": "Hello",
    "ja": "Konnichiwa",
}


def build_greeting(name: str, lang: str = "vi", excited: bool = False) -> str:
    """Tạo chuỗi lời chào chuẩn hóa theo ngôn ngữ.

    Args:
        name: Tên người nhận lời chào.
        lang: Mã ngôn ngữ ('vi', 'en', 'ja'). Mặc định là 'vi'.
        excited: Nếu True sẽ thêm dấu chấm than nhấn mạnh.

    Returns:
        Chuỗi lời chào đã được định dạng sạch sẽ.
    """
    clean_name = name.strip() or "Nhà phát triển Python"
    prefix = SUPPORTED_GREETINGS.get(lang.lower())

    if prefix is None:
        supported = ", ".join(SUPPORTED_GREETINGS.keys())
        raise ValueError(f"Ngôn ngữ '{lang}' chưa hỗ trợ. Hãy chọn: {supported}")

    punctuation = " 🚀!" if excited else "."
    return f"{prefix}, {clean_name}{punctuation} Chào mừng đến với Python 3.12!"`,
      },
      {
        path: 'src/hello_app/main.py',
        roleDescription:
          'Điểm khởi chạy chính (Entrypoint) của ứng dụng: cấu hình logging, điều phối gọi hàm và trả mã thoát hệ điều hành (Exit Code).',
        keyPatterns: ['if __name__ == "__main__":', 'logging', 'sys.exit()'],
        language: 'python',
        code: `"""Entrypoint chính của ứng dụng Hello Pythonic App."""

import logging
import sys
from hello_app.greeter import build_greeting

# Cấu hình Structured Console Logging thay vì lạm dụng print()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-5s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("hello_app")


def main(argv: list[str] | None = None) -> int:
    """Hàm điều phối chính trả về mã thoát chuẩn POSIX (0 = Thành công)."""
    args = argv if argv is not None else sys.argv[1:]
    user_name = args[0] if len(args) >= 1 else "Kỹ sư Backend"
    lang = args[1] if len(args) >= 2 else "vi"

    try:
        message = build_greeting(name=user_name, lang=lang, excited=True)
        logger.info("Khởi tạo lời chào thành công")
        print(message)
        return 0
    except ValueError as exc:
        logger.error("Lỗi tham số đầu vào: %s", exc)
        return 1


if __name__ == "__main__":
    # Chốt chặn bảo vệ: chỉ thực thi khi chạy trực tiếp file này
    sys.exit(main())`,
      },
      {
        path: 'tests/test_greeter.py',
        roleDescription:
          'Bộ kiểm thử tự động với Pytest xác minh cả kịch bản thành công (Happy Path) và kịch bản ném ngoại lệ (Edge Case).',
        keyPatterns: ['pytest.raises', 'assert'],
        language: 'python',
        code: `"""Kiểm thử đơn vị (Unit Tests) cho module greeter."""

import pytest
from hello_app.greeter import build_greeting


def test_build_greeting_vietnamese_default() -> None:
    result = build_greeting("Minh", lang="vi", excited=True)
    assert result == "Xin chào, Minh 🚀! Chào mừng đến với Python 3.12!"


def test_build_greeting_strips_whitespace_and_fallback() -> None:
    result = build_greeting("   ", lang="en")
    assert result == "Hello, Nhà phát triển Python. Chào mừng đến với Python 3.12!"


def test_build_greeting_invalid_language_raises() -> None:
    with pytest.raises(ValueError, match="Ngôn ngữ 'fr' chưa hỗ trợ"):
        build_greeting("Minh", lang="fr")`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-hello-run-vi',
        label: 'Chạy App (Tiếng Việt)',
        kind: 'run',
        command: 'python -m hello_app.main "Minh" "vi"',
        description: 'Chạy module entrypoint với tên "Minh" và ngôn ngữ "vi"',
        stdout: `10:42:15 | INFO  | hello_app | Khởi tạo lời chào thành công
Xin chào, Minh 🚀! Chào mừng đến với Python 3.12!
[Process exited with code 0]`,
      },
      {
        id: 'cmd-hello-run-err',
        label: 'Chạy thử Ngôn ngữ Lỗi (fr)',
        kind: 'run',
        command: 'python -m hello_app.main "Minh" "fr"',
        description: 'Kiểm tra cách ứng dụng bắt ValueError và trả mã thoát 1',
        stdout: `10:42:19 | ERROR | hello_app | Lỗi tham số đầu vào: Ngôn ngữ 'fr' chưa hỗ trợ. Hãy chọn: vi, en, ja
[Process exited with code 1]`,
      },
      {
        id: 'cmd-hello-pytest',
        label: 'Chạy Pytest',
        kind: 'pytest',
        command: 'pytest -v',
        description: 'Chạy toàn bộ Unit Tests trong thư mục tests/',
        stdout: `============================= test session starts ==============================
platform darwin -- Python 3.12.4, pytest-8.2.0
collected 3 items

tests/test_greeter.py::test_build_greeting_vietnamese_default PASSED     [ 33%]
tests/test_greeter.py::test_build_greeting_strips_whitespace_and_fallback PASSED [ 66%]
tests/test_greeter.py::test_build_greeting_invalid_language_raises PASSED [100%]

============================== 3 passed in 0.03s ===============================`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 02: CLI TASK TRACKER (FUNDAMENTAL -> BASIC)
  // ============================================================================
  {
    id: 'sample-02-cli-task-tracker',
    number: 2,
    slug: '02-cli-task-tracker',
    title: 'Ứng dụng CLI Quản lý Công việc (@dataclass, Enum, Path & argparse)',
    complexity: 'basic',
    complexityLabel: 'Cấp 2 • Ứng dụng CLI & File I/O',
    category: 'CLI & File Persistence',
    summary:
      'Xây dựng công cụ dòng lệnh (CLI) giống Git/Docker có các lệnh con (add, list, done), lưu trữ dữ liệu bền vững xuống file JSON an toàn bằng pathlib.Path và mô hình hóa dữ liệu bằng @dataclass + StrEnum.',
    architectureNotes: [
      'Mô hình hóa thực thể `TaskItem` bằng `@dataclass(slots=True)` kết hợp `StrEnum` giúp dữ liệu có kiểu tường minh, tiết kiệm RAM và dễ dàng tuần tự hóa sang JSON.',
      'Tách lớp lưu trữ `JsonTaskStore` trong `storage.py` sử dụng `pathlib.Path` và `with path.open(...)` để đảm bảo đóng file tự động.',
      'Sử dụng `argparse` với `add_subparsers()` để định nghĩa hệ thống subcommands (`task add`, `task list`, `task done`).',
    ],
    techStack: ['argparse', 'dataclasses', 'enum.StrEnum', 'pathlib.Path', 'json'],
    defaultFilePath: 'src/task_cli/models.py',
    files: [
      {
        path: 'src/task_cli/models.py',
        roleDescription:
          'Định nghĩa Domain Model `TaskItem` và `TaskPriority` bằng `@dataclass(slots=True)` và `StrEnum`.',
        keyPatterns: ['@dataclass(slots=True)', 'StrEnum', 'asdict', 'classmethod'],
        language: 'python',
        code: `"""Mô hình dữ liệu cho ứng dụng quản lý công việc CLI."""

from dataclasses import asdict, dataclass
from enum import StrEnum
from typing import Any


class TaskPriority(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


@dataclass(slots=True)
class TaskItem:
    """Thực thể đại diện cho một đầu việc."""

    id: int
    title: str
    priority: TaskPriority = TaskPriority.MEDIUM
    done: bool = False

    def to_dict(self) -> dict[str, Any]:
        """Chuyển đổi sang dict để lưu trữ JSON."""
        return asdict(self)

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "TaskItem":
        """Khôi phục thực thể từ dữ liệu JSON đọc lên."""
        return cls(
            id=int(raw["id"]),
            title=str(raw["title"]),
            priority=TaskPriority(raw.get("priority", "MEDIUM")),
            done=bool(raw.get("done", False)),
        )`,
      },
      {
        path: 'src/task_cli/storage.py',
        roleDescription:
          'Lớp chịu trách nhiệm đọc/ghi danh sách công việc xuống đĩa bằng `pathlib.Path` và `json`.',
        keyPatterns: ['pathlib.Path', 'with open', 'List Comprehension'],
        language: 'python',
        code: `"""Tầng lưu trữ JSON an toàn trên hệ thống file."""

import json
from pathlib import Path
from task_cli.models import TaskItem, TaskPriority


class JsonTaskStore:
    """Quản lý đọc và ghi danh sách Task vào file JSON."""

    def __init__(self, file_path: Path) -> None:
        self._path = file_path

    def load_all(self) -> list[TaskItem]:
        if not self._path.exists():
            return []
        with self._path.open("r", encoding="utf-8") as f:
            raw_list = json.load(f)
        return [TaskItem.from_dict(item) for item in raw_list]

    def save_all(self, tasks: list[TaskItem]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        payload = [t.to_dict() for t in tasks]
        with self._path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

    def add_task(self, title: str, priority: TaskPriority) -> TaskItem:
        tasks = self.load_all()
        next_id = max((t.id for t in tasks), default=0) + 1
        new_task = TaskItem(id=next_id, title=title.strip(), priority=priority)
        tasks.append(new_task)
        self.save_all(tasks)
        return new_task`,
      },
      {
        path: 'src/task_cli/cli.py',
        roleDescription:
          'Bộ phân tích tham số dòng lệnh (`argparse`) và định tuyến subcommands (`add`, `list`, `done`).',
        keyPatterns: ['argparse.ArgumentParser', 'match/case', 'enumerate'],
        language: 'python',
        code: `"""Giao diện dòng lệnh (CLI) sử dụng argparse và match/case."""

import argparse
from pathlib import Path
from task_cli.models import TaskPriority
from task_cli.storage import JsonTaskStore


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="task-cli", description="Quản lý Task cá nhân")
    sub = parser.add_subparsers(dest="command", required=True)

    # Lệnh: task-cli add "Tên việc" --priority HIGH
    add_cmd = sub.add_parser("add", help="Thêm công việc mới")
    add_cmd.add_argument("title", type=str, help="Nội dung công việc")
    add_cmd.add_argument(
        "-p", "--priority",
        type=TaskPriority,
        choices=list(TaskPriority),
        default=TaskPriority.MEDIUM,
    )

    # Lệnh: task-cli list
    sub.add_parser("list", help="Hiển thị danh sách công việc")
    return parser


def run_cli(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    store = JsonTaskStore(Path(".data/tasks.json"))

    match args.command:
        case "add":
            item = store.add_task(args.title, args.priority)
            print(f"[+] Đã tạo Task #{item.id}: {item.title} ({item.priority})")
            return 0
        case "list":
            tasks = store.load_all()
            for t in tasks:
                status = "✓" if t.done else "○"
                print(f"  [{status}] #{t.id:02d} [{t.priority:<6}] {t.title}")
            return 0
        case _:
            return 1`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-task-add',
        label: 'CLI: Thêm Task Ưu tiên Cao',
        kind: 'run',
        command: 'python -m task_cli add "Tối ưu truy vấn SQLite" --priority HIGH',
        description: 'Gọi subcommand `add` để lưu công việc mới vào .data/tasks.json',
        stdout: `[+] Đã tạo Task #3: Tối ưu truy vấn SQLite (HIGH)
[Saved to .data/tasks.json (3 records)]`,
      },
      {
        id: 'cmd-task-list',
        label: 'CLI: Liệt kê Danh sách Task',
        kind: 'run',
        command: 'python -m task_cli list',
        description: 'Đọc file JSON và in bảng danh sách công việc đã định dạng',
        stdout: `  [✓] #01 [MEDIUM] Thiết kế cấu trúc src-layout chuẩn PEP 621
  [○] #02 [LOW   ] Viết tài liệu README cho dự án
  [○] #03 [HIGH  ] Tối ưu truy vấn SQLite`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 03: FINTECH INVOICE ENGINE (BASIC -> ADVANCED)
  // ============================================================================
  {
    id: 'sample-03-fintech-invoice',
    number: 3,
    slug: '03-fintech-invoice-engine',
    title: 'Hệ thống Tính Hóa đơn & Chiết khấu Tài chính (Decimal & Protocol)',
    complexity: 'basic',
    complexityLabel: 'Cấp 3 • Nghiệp vụ Tài chính & OOP',
    category: 'Domain Modeling & Fintech',
    summary:
      'Giải quyết bài toán kinh điển trong thương mại điện tử: Tuyệt đối không dùng float cho tiền tệ. Dự án minh họa cách kết hợp decimal.Decimal, Custom Exceptions và Structural Subtyping (typing.Protocol) để thiết kế chiến lược giảm giá linh hoạt.',
    architectureNotes: [
      'Mọi phép tính tiền tệ đều đi qua hàm chuẩn hóa `to_money()` sử dụng `Decimal.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)`.',
      'Sử dụng `typing.Protocol` cho `DiscountPolicy` (Duck Typing có kiểm tra kiểu tĩnh) thay vì ép kế thừa lớp cha cứng nhắc.',
      'Hệ thống ngoại lệ phân cấp riêng (`BillingDomainError` -> `InvalidAmountError`) giúp tầng API dễ dàng bắt và dịch sang HTTP 400.',
    ],
    techStack: ['decimal.Decimal', 'typing.Protocol', 'dataclasses', 'Custom Exceptions'],
    defaultFilePath: 'src/billing/domain.py',
    files: [
      {
        path: 'src/billing/domain.py',
        roleDescription:
          'Mô hình hóa dòng hàng (`LineItem`) và chuẩn hóa phép làm tròn tiền tệ `ROUND_HALF_UP`.',
        keyPatterns: ['Decimal', 'ROUND_HALF_UP', '@property', 'frozen=True'],
        language: 'python',
        code: `"""Mô hình miền (Domain Model) cho hệ thống thanh toán chuẩn Decimal."""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

CENT = Decimal("0.01")


def to_money(value: str | int | Decimal) -> Decimal:
    """Chuẩn hóa giá trị tiền tệ về 2 chữ số thập phân (ROUND_HALF_UP)."""
    amount = value if isinstance(value, Decimal) else Decimal(str(value))
    return amount.quantize(CENT, rounding=ROUND_HALF_UP)


@dataclass(frozen=True, slots=True)
class LineItem:
    """Một dòng sản phẩm bất biến (Immutable Value Object) trong hóa đơn."""

    sku: str
    unit_price: Decimal
    quantity: int

    def __post_init__(self) -> None:
        if self.quantity <= 0:
            raise ValueError(f"Số lượng của '{self.sku}' phải lớn hơn 0")
        if self.unit_price < Decimal("0"):
            raise ValueError(f"Đơn giá của '{self.sku}' không được âm")

    @property
    def subtotal(self) -> Decimal:
        return to_money(self.unit_price * self.quantity)`,
      },
      {
        path: 'src/billing/discounts.py',
        roleDescription:
          'Định nghĩa giao diện chiến lược giảm giá bằng `typing.Protocol` (Structural Subtyping).',
        keyPatterns: ['typing.Protocol', 'Strategy Pattern'],
        language: 'python',
        code: `"""Chiến lược chiết khấu sử dụng typing.Protocol (Structural Subtyping)."""

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol
from billing.domain import to_money


class DiscountPolicy(Protocol):
    """Giao diện Protocol: Bất kỳ class nào có hàm compute_discount đều hợp lệ."""

    def compute_discount(self, subtotal: Decimal) -> Decimal:
        ...


@dataclass(frozen=True, slots=True)
class PercentageDiscount:
    """Giảm giá theo phần trăm (kèm mức trần tối đa)."""

    percent: Decimal
    max_cap: Decimal

    def compute_discount(self, subtotal: Decimal) -> Decimal:
        raw = to_money(subtotal * (self.percent / Decimal("100")))
        return min(raw, self.max_cap)`,
      },
      {
        path: 'src/billing/service.py',
        roleDescription:
          'Dịch vụ tổng hợp hóa đơn: tính tổng tiền hàng, áp dụng chiết khấu, cộng thuế VAT và xuất biên lai.',
        keyPatterns: ['Generator Expression in sum()', 'Dependency Injection'],
        language: 'python',
        code: `"""Dịch vụ tính toán tổng hóa đơn và thuế VAT."""

from decimal import Decimal
from billing.discounts import DiscountPolicy, PercentageDiscount
from billing.domain import LineItem, to_money


def calculate_invoice(
    items: list[LineItem],
    vat_rate: Decimal = Decimal("0.10"),
    discount_policy: DiscountPolicy | None = None,
) -> dict[str, str]:
    """Tính toán chi tiết hóa đơn chính xác từng xu."""
    subtotal = to_money(sum((item.subtotal for item in items), Decimal("0.00")))
    discount = (
        discount_policy.compute_discount(subtotal)
        if discount_policy is not None
        else Decimal("0.00")
    )
    taxable = max(Decimal("0.00"), subtotal - discount)
    vat_amount = to_money(taxable * vat_rate)
    grand_total = to_money(taxable + vat_amount)

    return {
        "subtotal": str(subtotal),
        "discount": str(discount),
        "vat_10pct": str(vat_amount),
        "grand_total": str(grand_total),
    }


if __name__ == "__main__":
    cart = [
        LineItem(sku="PY-BOOK-PRO", unit_price=Decimal("19.99"), quantity=3),
        LineItem(sku="MECH-KEYB", unit_price=Decimal("89.50"), quantity=1),
    ]
    vip_policy = PercentageDiscount(percent=Decimal("15"), max_cap=Decimal("20.00"))
    print(calculate_invoice(cart, discount_policy=vip_policy))`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-fintech-run',
        label: 'Chạy Tính Hóa đơn VIP (Decimal)',
        kind: 'run',
        command: 'python -m billing.service',
        description: 'Tính giỏ hàng 3 sách (19.99) + 1 bàn phím (89.50), giảm 15% (tối đa $20) + VAT 10%',
        stdout: `{
  'subtotal': '149.47',
  'discount': '20.00',
  'vat_10pct': '12.95',
  'grand_total': '142.42'
}
# Lưu ý: Nếu dùng float thông thường, 19.99 * 3 sẽ bị sai số 59.970000000000006!`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 04: STREAMING LOG ETL PIPELINE (ADVANCED)
  // ============================================================================
  {
    id: 'sample-04-streaming-log-etl',
    number: 4,
    slug: '04-streaming-log-etl',
    title: 'Đường ống Phân tích Log Streaming O(1) RAM (Generator yield & Counter)',
    complexity: 'advanced',
    complexityLabel: 'Cấp 4 • Xử lý Dữ liệu Lười (Lazy Pipeline)',
    category: 'Data Pipeline & Generators',
    summary:
      'Khi phân tích file Access Log nặng hàng chục GB trên máy chủ, việc gọi readlines() sẽ gây tràn bộ nhớ (OOM). Dự án này nối chuỗi các Generator (yield) để lọc, bóc tách và thống kê lỗi HTTP với mức tiêu thụ RAM cố định O(1).',
    architectureNotes: [
      'Mỗi mắt xích trong đường ống (`read_lines` -> `parse_records` -> `filter_5xx_errors`) đều là một Generator trả về `Iterator[T]`, dữ liệu chảy qua từng dòng một.',
      'Sử dụng `collections.Counter` và `defaultdict(list)` để gom nhóm và xếp hạng các endpoint gặp sự cố nhiều nhất.',
      'Sử dụng `NamedTuple` cho bản ghi `LogRecord` để truy cập theo tên trường nhưng nhẹ ngang `tuple` nguyên thủy.',
    ],
    techStack: ['Iterator / yield', 'collections.Counter', 'NamedTuple', 're.compile'],
    defaultFilePath: 'src/log_etl/pipeline.py',
    files: [
      {
        path: 'src/log_etl/parser.py',
        roleDescription:
          'Biên dịch biểu thức chính quy (Regex) một lần và bóc tách từng dòng log thành `LogRecord`.',
        keyPatterns: ['NamedTuple', 're.compile', 'Optional'],
        language: 'python',
        code: `"""Bộ phân tích cú pháp từng dòng Access Log thành cấu trúc tĩnh."""

import re
from typing import NamedTuple

LOG_PATTERN = re.compile(
    r"^(?P<ip>\\S+) \\[(?P<ts>[^\\]]+)\\] \"(?P<method>\\S+) (?P<path>\\S+)\" (?P<status>\\d{3}) (?P<ms>\\d+)ms$"
)


class LogRecord(NamedTuple):
    ip: str
    timestamp: str
    method: str
    path: str
    status: int
    latency_ms: int


def parse_log_line(line: str) -> LogRecord | None:
    """Trả về LogRecord nếu dòng hợp lệ, ngược lại trả về None."""
    match = LOG_PATTERN.match(line.strip())
    if not match:
        return None
    return LogRecord(
        ip=match.group("ip"),
        timestamp=match.group("ts"),
        method=match.group("method"),
        path=match.group("path"),
        status=int(match.group("status")),
        latency_ms=int(match.group("ms")),
    )`,
      },
      {
        path: 'src/log_etl/pipeline.py',
        roleDescription:
          'Đường ống Generator (`yield`) kết nối luồng đọc, lọc lỗi 5xx/chậm và tổng hợp thống kê bằng `Counter`.',
        keyPatterns: ['yield', 'Iterator', 'Counter.most_common()'],
        language: 'python',
        code: `"""Đường ống Generator xử lý dữ liệu theo luồng (Streaming Pipeline)."""

from collections import Counter
from collections.abc import Iterable, Iterator
from log_etl.parser import LogRecord, parse_log_line


def stream_parsed_records(raw_lines: Iterable[str]) -> Iterator[LogRecord]:
    """Generator bước 1: Chuyển đổi luồng dòng văn bản thành LogRecord hợp lệ."""
    for line in raw_lines:
        record = parse_log_line(line)
        if record is not None:
            yield record


def filter_slow_or_error(
    records: Iterable[LogRecord], latency_threshold_ms: int = 500
) -> Iterator[LogRecord]:
    """Generator bước 2: Chỉ giữ lại request lỗi (>=500) hoặc phản hồi chậm."""
    for rec in records:
        if rec.status >= 500 or rec.latency_ms >= latency_threshold_ms:
            yield rec


def summarize_anomalies(raw_lines: Iterable[str]) -> dict[str, object]:
    """Tiêu thụ luồng Generator và tổng hợp báo cáo với O(1) bộ nhớ đệm."""
    endpoint_hits: Counter[str] = Counter()
    status_counts: Counter[int] = Counter()
    max_latency = 0

    pipeline = filter_slow_or_error(stream_parsed_records(raw_lines))
    for rec in pipeline:
        endpoint_hits[f"{rec.method} {rec.path}"] += 1
        status_counts[rec.status] += 1
        if rec.latency_ms > max_latency:
            max_latency = rec.latency_ms

    return {
        "top_endpoints": endpoint_hits.most_common(3),
        "status_breakdown": dict(status_counts),
        "peak_latency_ms": max_latency,
    }`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-etl-stream',
        label: 'Chạy Streaming Log Pipeline',
        kind: 'run',
        command: 'python -m log_etl.pipeline --source access_prod.log',
        description: 'Chạy đường ống Generator qua tập log mẫu và xuất thống kê điểm nghẽn',
        stdout: `[Streaming ETL] Memory footprint: 14.2 MB (Constant O(1) Buffer)
{
  'top_endpoints': [
    ('POST /api/v1/checkout', 42),
    ('GET /api/v1/inventory/sync', 19),
    ('POST /api/v1/webhooks/stripe', 7)
  ],
  'status_breakdown': {502: 38, 504: 21, 200: 9},
  'peak_latency_ms': 2840
}`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 05: ASYNCIO CONCURRENT CRAWLER & RATE LIMITER (ADVANCED)
  // ============================================================================
  {
    id: 'sample-05-async-crawler',
    number: 5,
    slug: '05-async-crawler-engine',
    title: 'Bộ Thu thập Bất đồng bộ & Giới hạn Tải (AsyncIO Semaphore & Retry Decorator)',
    complexity: 'advanced',
    complexityLabel: 'Cấp 5 • Bất đồng bộ & Concurrency',
    category: 'AsyncIO & Resilience',
    summary:
      'Minh họa cách xây dựng trình gọi mạng bất đồng bộ tốc độ cao trong Python: dùng asyncio.Semaphore giới hạn số kết nối đồng thời, kết hợp Decorator @async_retry tự động thử lại theo cấp số nhân (Exponential Backoff) khi gặp lỗi mạng tạm thời.',
    architectureNotes: [
      'Sử dụng `asyncio.Semaphore(max_concurrency)` bên trong `async with` để đảm bảo không bao giờ làm sập dịch vụ đích vì gửi quá nhiều request cùng lúc.',
      'Thiết kế Decorator có tham số `@async_retry(max_attempts=3)` bảo toàn siêu dữ liệu hàm bằng `@functools.wraps(func)`.',
      'Sử dụng `asyncio.gather(*tasks)` để chạy song song toàn bộ lô tác vụ I/O trên 1 luồng Event Loop duy nhất.',
    ],
    techStack: ['asyncio', 'asyncio.Semaphore', 'functools.wraps', 'ParamSpec'],
    defaultFilePath: 'src/crawler/client.py',
    files: [
      {
        path: 'src/crawler/decorator.py',
        roleDescription:
          'Decorator bất đồng bộ `@async_retry` tự động thử lại khi gặp lỗi kết nối tạm thời.',
        keyPatterns: ['functools.wraps', 'async def wrapper', 'asyncio.sleep'],
        language: 'python',
        code: `"""Decorator hỗ trợ tự động thử lại (Retry) cho các hàm Coroutine."""

import asyncio
from collections.abc import Callable, Coroutine
from functools import wraps
from typing import Any, TypeVar

T = TypeVar("T")


def async_retry(max_attempts: int = 3, base_delay: float = 0.05):
    """Decorator thử lại hàm async khi gặp RuntimeError hoặc TimeoutError."""

    def decorator(
        func: Callable[..., Coroutine[Any, Any, T]],
    ) -> Callable[..., Coroutine[Any, Any, T]]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exc: Exception | None = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except (RuntimeError, TimeoutError) as exc:
                    last_exc = exc
                    if attempt == max_attempts:
                        break
                    await asyncio.sleep(base_delay * (2 ** (attempt - 1)))
            raise RuntimeError(f"Thất bại sau {max_attempts} lần thử") from last_exc

        return wrapper

    return decorator`,
      },
      {
        path: 'src/crawler/client.py',
        roleDescription:
          'Bộ điều phối thu thập dữ liệu sử dụng `asyncio.Semaphore` và `asyncio.gather`.',
        keyPatterns: ['asyncio.Semaphore', 'async with', 'asyncio.gather'],
        language: 'python',
        code: `"""Trình thu thập dữ liệu bất đồng bộ có kiểm soát mức độ song song."""

import asyncio
from crawler.decorator import async_retry


class AsyncProductFetcher:
    """Thu thập dữ liệu sản phẩm với giới hạn kết nối đồng thời (Semaphore)."""

    def __init__(self, max_concurrency: int = 3) -> None:
        self._sem = asyncio.Semaphore(max_concurrency)

    @async_retry(max_attempts=3, base_delay=0.02)
    async def _fetch_single(self, product_id: int) -> dict[str, object]:
        async with self._sem:
            # Mô phỏng I/O mạng non-blocking
            await asyncio.sleep(0.04)
            return {
                "product_id": product_id,
                "status": 200,
                "price_usd": round(15.0 + product_id * 2.5, 2),
            }

    async def fetch_batch(self, product_ids: list[int]) -> list[dict[str, object]]:
        """Chạy đồng thời toàn bộ danh sách product_ids qua Event Loop."""
        tasks = [self._fetch_single(pid) for pid in product_ids]
        return await asyncio.gather(*tasks)`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-crawler-run',
        label: 'Chạy Async Batch Crawler (8 sản phẩm)',
        kind: 'run',
        command: 'python -m crawler.client --ids 101,102,103,104,105,106',
        description: 'Gọi đồng thời 6 sản phẩm với Semaphore(max_concurrency=3)',
        stdout: `[EventLoop] Starting batch fetch for 6 items (max_concurrency=3)...
[Batch Wave 1] Fetching IDs: 101, 102, 103 in parallel (40ms)
[Batch Wave 2] Fetching IDs: 104, 105, 106 in parallel (40ms)
[Completed in 0.082s vs 0.240s sequential (3x speedup)]
Results: [
  {'product_id': 101, 'status': 200, 'price_usd': 267.5},
  {'product_id': 102, 'status': 200, 'price_usd': 270.0},
  {'product_id': 103, 'status': 200, 'price_usd': 272.5}
]`,
      },
    ],
  },
];

import { SampleProject } from '@/types/sample.types';

export const SAMPLE_PROJECTS_PART_2: SampleProject[] = [
  // ============================================================================
  // PROJECT 06: EVENT BUS & PLUGIN SYSTEM (__init_subclass__ & Registry)
  // ============================================================================
  {
    id: 'sample-06-event-plugin-hub',
    number: 6,
    slug: '06-event-plugin-hub',
    title: 'Hệ thống Event Bus & Tự động Đăng ký Plugin (__init_subclass__)',
    complexity: 'advanced',
    complexityLabel: 'Cấp 6 • Kiến trúc Mở & Metaprogramming',
    category: 'Plugin Architecture & Events',
    summary:
      'Làm thế nào các framework như Pytest, Django hay FastAPI tự động phát hiện các Plugin mà không cần sửa code lõi? Dự án này minh họa cơ chế móc nối __init_subclass__ kết hợp Event Bus để phát triển hệ thống mở rộng theo nguyên lý Open/Closed (SOLID).',
    architectureNotes: [
      'Lớp cơ sở `BasePlugin` cài đặt `__init_subclass__` để tự động ghi danh mọi lớp con vào `PLUGIN_REGISTRY` ngay tại thời điểm nạp module (Import time).',
      'Bộ điều phối `EventBus` dùng `defaultdict(list)` để lưu danh sách hàm lắng nghe (Subscribers) theo từng loại sự kiện.',
    ],
    techStack: ['__init_subclass__', 'defaultdict', 'dataclasses', 'Callable'],
    defaultFilePath: 'src/plugin_hub/registry.py',
    files: [
      {
        path: 'src/plugin_hub/registry.py',
        roleDescription:
          'Lớp cơ sở `BasePlugin` tự động đăng ký mọi class kế thừa nó nhờ hook `__init_subclass__`.',
        keyPatterns: ['__init_subclass__', 'ClassVar', 'Registry Pattern'],
        language: 'python',
        code: `"""Hệ thống tự động phát hiện và đăng ký Plugin qua __init_subclass__."""

from typing import Any, ClassVar


class BasePlugin:
    """Mọi class kế thừa BasePlugin sẽ tự động được ghi danh vào REGISTRY."""

    REGISTRY: ClassVar[dict[str, type["BasePlugin"]]] = {}
    plugin_name: ClassVar[str] = ""

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        key = cls.plugin_name or cls.__name__.lower()
        BasePlugin.REGISTRY[key] = cls

    def handle_event(self, payload: dict[str, Any]) -> str:
        raise NotImplementedError`,
      },
      {
        path: 'src/plugin_hub/plugins.py',
        roleDescription:
          'Các Plugin cụ thể (`AuditLogPlugin`, `FraudAlertPlugin`) chỉ cần kế thừa `BasePlugin` là tự động kích hoạt.',
        keyPatterns: ['Inheritance', 'Polymorphism'],
        language: 'python',
        code: `"""Các Plugin nghiệp vụ tự động tích hợp vào hệ thống."""

from typing import Any
from plugin_hub.registry import BasePlugin


class AuditLogPlugin(BasePlugin):
    plugin_name = "audit_logger"

    def handle_event(self, payload: dict[str, Any]) -> str:
        return f"[AUDIT] Ghi nhật ký giao dịch #{payload['tx_id']} (\${payload['amount']})"


class FraudCheckPlugin(BasePlugin):
    plugin_name = "fraud_detector"

    def handle_event(self, payload: dict[str, Any]) -> str:
        risk = "HIGH" if payload.get("amount", 0) > 5000 else "LOW"
        return f"[FRAUD] Đánh giá rủi ro giao dịch #{payload['tx_id']}: {risk}"`,
      },
      {
        path: 'src/plugin_hub/bus.py',
        roleDescription:
          'Bộ phát sự kiện `dispatch_to_all_plugins` khởi tạo và kích hoạt mọi Plugin đã đăng ký.',
        keyPatterns: ['Dictionary Iteration', 'List Comprehension'],
        language: 'python',
        code: `"""Bộ điều phối sự kiện tới toàn bộ Plugin trong Registry."""

from typing import Any
import plugin_hub.plugins  # noqa: F401 - Nạp module để kích hoạt __init_subclass__
from plugin_hub.registry import BasePlugin


def dispatch_event(payload: dict[str, Any]) -> list[str]:
    """Gửi sự kiện tới toàn bộ Plugin đã đăng ký và thu thập kết quả."""
    outputs: list[str] = []
    for name, plugin_cls in BasePlugin.REGISTRY.items():
        plugin = plugin_cls()
        outputs.append(plugin.handle_event(payload))
    return outputs`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-plugin-dispatch',
        label: 'Phát Sự kiện Giao dịch $8,500',
        kind: 'run',
        command: 'python -m plugin_hub.bus --tx TX-9901 --amount 8500',
        description: 'Kiểm tra các Plugin tự động đăng ký và xử lý sự kiện giao dịch',
        stdout: `Discovered Plugins in Registry: ['audit_logger', 'fraud_detector']
[AUDIT] Ghi nhật ký giao dịch #TX-9901 ($8500)
[FRAUD] Đánh giá rủi ro giao dịch #TX-9901: HIGH`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 07: FASTAPI RESTFUL MICROSERVICE + PYDANTIC V2 (PRO)
  // ============================================================================
  {
    id: 'sample-07-fastapi-order-service',
    number: 7,
    slug: '07-fastapi-order-service',
    title: 'FastAPI Order Microservice (Pydantic v2, Depends & cURL Playground)',
    complexity: 'pro',
    complexityLabel: 'Cấp 7 • Backend API & FastAPI',
    category: 'FastAPI & RESTful Service',
    summary:
      'Cấu trúc chuẩn của một dịch vụ RESTful API hiện đại bằng FastAPI và Pydantic v2: Tách biệt rõ ràng Schemas (Validation dữ liệu đầu vào/đầu ra), Dependencies (Dependency Injection qua Depends), Router và Entrypoint.',
    architectureNotes: [
      'Sử dụng Pydantic v2 `BaseModel`, `Field` và `@field_validator` để chặn dữ liệu rác ngay tại biên mạng (trả về HTTP 422 tự động).',
      'Sử dụng `Depends(get_order_repo)` để tiêm phụ thuộc (Dependency Injection), giúp dễ dàng thay thế Database thật bằng In-Memory Repo khi chạy kiểm thử.',
      'Tách biệt `CreateOrderRequest` (Input DTO) và `OrderResponse` (Output DTO) để không bao giờ lộ các trường nội bộ ra ngoài API.',
    ],
    techStack: ['FastAPI', 'Pydantic v2', 'Depends (DI)', 'APIRouter', 'Uvicorn'],
    defaultFilePath: 'src/order_api/main.py',
    files: [
      {
        path: 'src/order_api/schemas.py',
        roleDescription:
          'Định nghĩa hợp đồng dữ liệu vào/ra (DTO Schemas) bằng Pydantic v2 `BaseModel` và `@field_validator`.',
        keyPatterns: ['BaseModel', 'Field', '@field_validator', 'Decimal'],
        language: 'python',
        code: `"""Pydantic v2 Schemas kiểm duyệt dữ liệu đầu vào và đầu ra cho Order API."""

from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class CreateOrderRequest(BaseModel):
    customer_email: str = Field(..., examples=["dev@company.vn"])
    sku: str = Field(..., min_length=3, max_length=32)
    quantity: int = Field(..., gt=0, le=100)
    unit_price: Decimal = Field(..., gt=Decimal("0"))

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str) -> str:
        clean = value.strip().upper()
        if not clean.startswith("PY-"):
            raise ValueError("Mã SKU phải bắt đầu bằng tiền tố 'PY-'")
        return clean


class OrderResponse(BaseModel):
    order_id: str
    customer_email: str
    sku: str
    quantity: int
    total_amount: Decimal
    status: str = "CONFIRMED"`,
      },
      {
        path: 'src/order_api/dependencies.py',
        roleDescription:
          'Cung cấp Dependency Injection (`Depends`) cho tầng Repository và xác thực API Key.',
        keyPatterns: ['Header', 'HTTPException', 'Depends'],
        language: 'python',
        code: `"""Quản lý Dependency Injection (DI) và xác thực cho FastAPI."""

from fastapi import Header, HTTPException, status


async def verify_api_key(x_api_key: str = Header(default="")) -> str:
    """Dependency kiểm tra Header X-API-Key hợp lệ."""
    if x_api_key != "lg-secret-token-2026":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-API-Key không hợp lệ hoặc bị thiếu",
        )
    return x_api_key`,
      },
      {
        path: 'src/order_api/main.py',
        roleDescription:
          'Khởi tạo ứng dụng FastAPI, định nghĩa các Endpoint `POST /api/v1/orders` và `GET /healthz`.',
        keyPatterns: ['@app.post', 'status.HTTP_201_CREATED', 'response_model'],
        language: 'python',
        code: `"""Khởi tạo ứng dụng FastAPI và định tuyến RESTful Endpoints."""

from decimal import Decimal
from fastapi import Depends, FastAPI, status
from order_api.dependencies import verify_api_key
from order_api.schemas import CreateOrderRequest, OrderResponse

app = FastAPI(
    title="PyMastery Order Service",
    version="1.0.0",
)


@app.get("/healthz", tags=["System"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "order-api"}


@app.post(
    "/api/v1/orders",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Orders"],
)
async def create_order(
    payload: CreateOrderRequest,
    _api_key: str = Depends(verify_api_key),
) -> OrderResponse:
    """Tạo đơn hàng mới sau khi Pydantic xác thực dữ liệu thành công."""
    total = (payload.unit_price * Decimal(payload.quantity)).quantize(Decimal("0.01"))
    return OrderResponse(
        order_id="ORD-2026-0891",
        customer_email=payload.customer_email,
        sku=payload.sku,
        quantity=payload.quantity,
        total_amount=total,
    )`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-fastapi-curl-201',
        label: 'cURL: POST /api/v1/orders (201 Created)',
        kind: 'curl',
        command: `curl -X POST http://localhost:8000/api/v1/orders \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: lg-secret-token-2026" \\
  -d '{"customer_email":"son@dev.vn","sku":"py-pro-course","quantity":2,"unit_price":"49.90"}'`,
        description: 'Gửi request hợp lệ kèm X-API-Key — Pydantic tự chuẩn hóa sku thành in hoa PY-PRO-COURSE',
        httpMeta: {
          method: 'POST',
          endpoint: '/api/v1/orders',
          statusCode: 201,
          statusText: '201 Created',
          latencyMs: 6,
          requestBody:
            '{"customer_email":"son@dev.vn","sku":"py-pro-course","quantity":2,"unit_price":"49.90"}',
        },
        stdout: `HTTP/1.1 201 Created
content-type: application/json
x-process-time: 0.006s

{
  "order_id": "ORD-2026-0891",
  "customer_email": "son@dev.vn",
  "sku": "PY-PRO-COURSE",
  "quantity": 2,
  "total_amount": "99.80",
  "status": "CONFIRMED"
}`,
      },
      {
        id: 'cmd-fastapi-curl-422',
        label: 'cURL: POST Sai SKU & Số lượng Âm (422 Error)',
        kind: 'curl',
        command: `curl -X POST http://localhost:8000/api/v1/orders \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: lg-secret-token-2026" \\
  -d '{"customer_email":"son@dev.vn","sku":"BOOK-123","quantity":-1,"unit_price":"49.90"}'`,
        description: 'Thử gửi SKU thiếu tiền tố PY- và quantity = -1 để xem phản hồi lỗi tự động của Pydantic v2',
        httpMeta: {
          method: 'POST',
          endpoint: '/api/v1/orders',
          statusCode: 422,
          statusText: '422 Unprocessable Entity',
          latencyMs: 2,
          requestBody:
            '{"customer_email":"son@dev.vn","sku":"BOOK-123","quantity":-1,"unit_price":"49.90"}',
        },
        stdout: `HTTP/1.1 422 Unprocessable Entity
content-type: application/json

{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "sku"],
      "msg": "Value error, Mã SKU phải bắt đầu bằng tiền tố 'PY-'"
    },
    {
      "type": "greater_than",
      "loc": ["body", "quantity"],
      "msg": "Input should be greater than 0"
    }
  ]
}`,
      },
      {
        id: 'cmd-fastapi-curl-health',
        label: 'cURL: GET /healthz (200 OK)',
        kind: 'curl',
        command: 'curl -i http://localhost:8000/healthz',
        description: 'Kiểm tra trạng thái sức khỏe (Liveness Probe) của dịch vụ FastAPI',
        httpMeta: {
          method: 'GET',
          endpoint: '/healthz',
          statusCode: 200,
          statusText: '200 OK',
          latencyMs: 1,
        },
        stdout: `HTTP/1.1 200 OK
content-type: application/json

{"status": "ok", "service": "order-api"}`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 08: ASYNC DATABASE & UNIT OF WORK PATTERN (PRO)
  // ============================================================================
  {
    id: 'sample-08-async-uow-wallet',
    number: 8,
    slug: '08-async-uow-wallet',
    title: 'Giao dịch Ví Điện tử Nguyên tử (Async Unit of Work & Repository Pattern)',
    complexity: 'pro',
    complexityLabel: 'Cấp 8 • Giao dịch Database & Unit of Work',
    category: 'Database & Transactions',
    summary:
      'Trong hệ thống chuyển tiền, nếu trừ tiền người gửi thành công nhưng cộng tiền người nhận gặp lỗi, toàn bộ giao dịch phải được Rollback. Dự án này minh họa mẫu thiết kế Async Unit of Work (__aenter__ / __aexit__) kết hợp Repository Pattern.',
    architectureNotes: [
      'Tách biệt `WalletRepository` (chỉ chứa truy vấn đọc/cập nhật số dư) và `AsyncUnitOfWork` (quản lý ranh giới Transaction `commit()` / `rollback()`).',
      'Khi thoát khối `async with uow:`, nếu có bất kỳ Exception nào xảy ra, `__aexit__` tự động gọi `await uow.rollback()`, đảm bảo tính toàn vẹn ACID tuyệt đối.',
    ],
    techStack: ['Async Context Manager', '__aenter__ / __aexit__', 'Decimal', 'Repository Pattern'],
    defaultFilePath: 'src/wallet_db/uow.py',
    files: [
      {
        path: 'src/wallet_db/uow.py',
        roleDescription:
          'Cài đặt mẫu thiết kế `AsyncUnitOfWork` quản lý giao dịch nguyên tử (Atomic Transaction) với `__aenter__` và `__aexit__`.',
        keyPatterns: ['__aenter__', '__aexit__', 'rollback()', 'commit()'],
        language: 'python',
        code: `"""Mẫu thiết kế Async Unit of Work đảm bảo tính toàn vẹn giao dịch (ACID)."""

from decimal import Decimal
from typing import Any


class WalletRepository:
    def __init__(self, state: dict[str, Decimal]) -> None:
        self._state = state

    def get_balance(self, user_id: str) -> Decimal:
        if user_id not in self._state:
            raise KeyError(f"Không tìm thấy tài khoản '{user_id}'")
        return self._state[user_id]

    def update_balance(self, user_id: str, new_balance: Decimal) -> None:
        if new_balance < Decimal("0.00"):
            raise ValueError(f"Số dư của '{user_id}' không đủ để thực hiện giao dịch")
        self._state[user_id] = new_balance


class AsyncWalletUnitOfWork:
    """Quản lý Snapshot giao dịch: tự động Rollback nếu xảy ra ngoại lệ."""

    def __init__(self, storage: dict[str, Decimal]) -> None:
        self._storage = storage
        self._working_copy: dict[str, Decimal] = {}
        self.wallets: WalletRepository | None = None
        self.committed = False

    async def __aenter__(self) -> "AsyncWalletUnitOfWork":
        self._working_copy = dict(self._storage)
        self.wallets = WalletRepository(self._working_copy)
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> bool:
        if exc_type is not None:
            await self.rollback()
            return False  # Không nuốt lỗi, để lỗi nổi lên tầng gọi
        return False

    async def commit(self) -> None:
        self._storage.clear()
        self._storage.update(self._working_copy)
        self.committed = True

    async def rollback(self) -> None:
        self._working_copy.clear()
        self.committed = False`,
      },
      {
        path: 'src/wallet_db/service.py',
        roleDescription:
          'Use Case `transfer_funds` thực hiện chuyển tiền an toàn bên trong khối `async with uow:`.',
        keyPatterns: ['async with uow:', 'Atomic Transfer'],
        language: 'python',
        code: `"""Dịch vụ chuyển tiền nguyên tử sử dụng AsyncWalletUnitOfWork."""

from decimal import Decimal
from wallet_db.uow import AsyncWalletUnitOfWork


async def transfer_funds(
    uow: AsyncWalletUnitOfWork,
    sender_id: str,
    receiver_id: str,
    amount: Decimal,
) -> dict[str, str]:
    """Chuyển tiền giữa 2 ví; tự động rollback nếu người nhận không tồn tại."""
    async with uow:
        assert uow.wallets is not None
        sender_bal = uow.wallets.get_balance(sender_id)
        uow.wallets.update_balance(sender_id, sender_bal - amount)

        receiver_bal = uow.wallets.get_balance(receiver_id)
        uow.wallets.update_balance(receiver_id, receiver_bal + amount)

        await uow.commit()
        return {
            sender_id: str(uow.wallets.get_balance(sender_id)),
            receiver_id: str(uow.wallets.get_balance(receiver_id)),
        }`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-uow-commit',
        label: 'Giao dịch Thành công (Commit)',
        kind: 'run',
        command: 'python -m wallet_db.service --from alice --to bob --amount 250.00',
        description: 'Chuyển $250 từ Alice ($1000) sang Bob ($500) và commit nguyên tử',
        stdout: `[UoW] Transaction started (isolation=REPEATABLE_READ)
[UoW] Deducted 250.00 from 'alice' -> 750.00
[UoW] Credited 250.00 to 'bob' -> 750.00
[UoW] COMMIT successful!
Balances: {'alice': '750.00', 'bob': '750.00'}`,
      },
      {
        id: 'cmd-uow-rollback',
        label: 'Mô phỏng Lỗi Giữa chừng (Auto Rollback)',
        kind: 'run',
        command: 'python -m wallet_db.service --from alice --to unknown_user --amount 250.00',
        description: 'Sau khi trừ tiền Alice, người nhận không tồn tại -> __aexit__ tự động Rollback trả lại $1000 cho Alice',
        stdout: `[UoW] Transaction started
[UoW] Deducted 250.00 from 'alice' (working copy: 750.00)
[UoW] ERROR: KeyError("Không tìm thấy tài khoản 'unknown_user'")
[UoW] __aexit__ triggered -> ROLLBACK executed!
Balances after rollback: {'alice': '1000.00', 'bob': '500.00'} (Zero money lost!)`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 09: CLEAN ARCHITECTURE & DDD 4-LAYER CORE (MASTER)
  // ============================================================================
  {
    id: 'sample-09-ddd-clean-arch',
    number: 9,
    slug: '09-ddd-clean-architecture',
    title: 'Hệ thống Đặt hàng Chuẩn Clean Architecture & Domain-Driven Design (4 Layers)',
    complexity: 'master',
    complexityLabel: 'Cấp 9 • Clean Architecture & DDD',
    category: 'Clean Architecture & DDD',
    summary:
      'Mẫu kiến trúc chuẩn mực cho các hệ thống Enterprise quy mô lớn: Chia tách rạch ròi 4 tầng (Domain -> Application -> Infrastructure -> Presentation). Tầng Domain nằm ở tâm và hoàn toàn không phụ thuộc vào bất kỳ thư viện/database bên ngoài nào.',
    architectureNotes: [
      'Quy tắc Phụ thuộc (Dependency Rule): Mũi tên phụ thuộc chỉ hướng vào trong (`Presentation` -> `Application` -> `Domain`).',
      'Tầng `domain/ports.py` định nghĩa `OrderRepositoryPort(Protocol)` (Đảo ngược phụ thuộc - DIP), còn tầng `infrastructure/memory_repo.py` thực thi chi tiết lưu trữ.',
      'Nhờ kiến trúc này, toàn bộ Use Case nghiệp vụ có thể chạy Unit Test trong 5 mili-giây mà không cần bật контейner Database hay Web Server.',
    ],
    techStack: ['Clean Architecture', 'DDD Entities', 'Ports & Adapters', 'typing.Protocol'],
    defaultFilePath: 'src/shop_clean/application/use_cases.py',
    files: [
      {
        path: 'src/shop_clean/domain/entities.py',
        roleDescription:
          'Tầng 1 (Domain Layer): Chứa thực thể `Order` và quy tắc nghiệp vụ cốt lõi, hoàn toàn độc lập với Framework.',
        keyPatterns: ['Domain Entity', 'Business Invariant', 'Decimal'],
        language: 'python',
        code: `"""Tầng Domain: Thực thể nghiệp vụ thuần túy không phụ thuộc Framework."""

from dataclasses import dataclass
from decimal import Decimal


@dataclass(slots=True)
class OrderEntity:
    order_id: str
    customer_id: str
    amount: Decimal
    status: str = "PENDING"

    def mark_paid(self) -> None:
        """Quy tắc nghiệp vụ (Invariant): Chỉ đơn hàng PENDING mới được thanh toán."""
        if self.status != "PENDING":
            raise ValueError(f"Không thể thanh toán đơn hàng ở trạng thái {self.status}")
        if self.amount <= Decimal("0"):
            raise ValueError("Tổng tiền thanh toán phải lớn hơn 0")
        self.status = "PAID"`,
      },
      {
        path: 'src/shop_clean/domain/ports.py',
        roleDescription:
          'Tầng 1 (Domain Ports): Định nghĩa cổng giao tiếp `OrderRepositoryPort` và `PaymentGatewayPort` bằng `Protocol`.',
        keyPatterns: ['Hexagonal Port', 'typing.Protocol', 'DIP'],
        language: 'python',
        code: `"""Cổng giao tiếp (Ports) định nghĩa hợp đồng cho tầng Infrastructure."""

from decimal import Decimal
from typing import Protocol
from shop_clean.domain.entities import OrderEntity


class OrderRepositoryPort(Protocol):
    def get_by_id(self, order_id: str) -> OrderEntity: ...
    def save(self, order: OrderEntity) -> None: ...


class PaymentGatewayPort(Protocol):
    def charge(self, customer_id: str, amount: Decimal) -> str: ...`,
      },
      {
        path: 'src/shop_clean/application/use_cases.py',
        roleDescription:
          'Tầng 2 (Application Layer): Điều phối Use Case `PayOrderUseCase` thông qua các Ports được tiêm vào.',
        keyPatterns: ['Use Case Interactor', 'Constructor Injection'],
        language: 'python',
        code: `"""Tầng Application: Điều phối luồng nghiệp vụ thanh toán đơn hàng."""

from shop_clean.domain.ports import OrderRepositoryPort, PaymentGatewayPort


class PayOrderUseCase:
    """Use Case chỉ phụ thuộc vào Domain Ports (Abstractions), không biết DB cụ thể."""

    def __init__(
        self,
        repo: OrderRepositoryPort,
        gateway: PaymentGatewayPort,
    ) -> None:
        self._repo = repo
        self._gateway = gateway

    def execute(self, order_id: str) -> dict[str, str]:
        order = self._repo.get_by_id(order_id)
        receipt_id = self._gateway.charge(order.customer_id, order.amount)
        order.mark_paid()
        self._repo.save(order)
        return {
            "order_id": order.order_id,
            "status": order.status,
            "receipt_id": receipt_id,
        }`,
      },
      {
        path: 'src/shop_clean/infrastructure/adapters.py',
        roleDescription:
          'Tầng 3 (Infrastructure Adapters): Cài đặt thực tế cho các Ports (InMemoryRepo & StripeMockAdapter).',
        keyPatterns: ['Adapter Pattern', 'Concrete Implementation'],
        language: 'python',
        code: `"""Tầng Infrastructure: Thực thi cụ thể các cổng giao tiếp (Adapters)."""

from decimal import Decimal
from shop_clean.domain.entities import OrderEntity


class InMemoryOrderRepository:
    def __init__(self) -> None:
        self._db: dict[str, OrderEntity] = {
            "ORD-100": OrderEntity("ORD-100", "CUST-01", Decimal("120.00")),
        }

    def get_by_id(self, order_id: str) -> OrderEntity:
        return self._db[order_id]

    def save(self, order: OrderEntity) -> None:
        self._db[order.order_id] = order


class StripePaymentAdapter:
    def charge(self, customer_id: str, amount: Decimal) -> str:
        return f"ch_stripe_{customer_id}_{amount}"`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-clean-usecase',
        label: 'Chạy Use Case Thanh toán Đơn hàng',
        kind: 'run',
        command: 'python -m shop_clean.main --order-id ORD-100',
        description: 'Khởi tạo Adapters -> Tiêm vào PayOrderUseCase -> Thực thi thanh toán',
        stdout: `[Wiring] Injected InMemoryOrderRepository + StripePaymentAdapter into PayOrderUseCase
[Domain] Order ORD-100 transitioned: PENDING -> PAID
Result: {
  'order_id': 'ORD-100',
  'status': 'PAID',
  'receipt_id': 'ch_stripe_CUST-01_120.00'
}`,
      },
    ],
  },

  // ============================================================================
  // PROJECT 10: PRODUCTION AI RAG MICROSERVICE GATEWAY (MASTER)
  // ============================================================================
  {
    id: 'sample-10-ai-rag-production',
    number: 10,
    slug: '10-ai-rag-production-gateway',
    title: 'Cổng AI RAG Microservice Chuẩn Production (FastAPI, Async Vector Search & Docker)',
    complexity: 'master',
    complexityLabel: 'Cấp 10 • Production AI & Cloud Native',
    category: 'AI Engineering & Production',
    summary:
      'Dự án tổng hợp đỉnh cao kết hợp toàn bộ kỹ năng Python hiện đại: Dịch vụ AI Retrieval-Augmented Generation (RAG) bất đồng bộ với FastAPI, tìm kiếm độ tương đồng Cosine Vector, kiểm duyệt Prompt bằng Pydantic v2, đóng gói Multi-stage Dockerfile non-root và kiểm thử API.',
    architectureNotes: [
      'Tách biệt động cơ truy xuất tri thức (`rag_engine.py`) tính điểm tương đồng Cosine Vector với tầng giao tiếp HTTP (`api.py`).',
      'Sử dụng `asyncio.gather` để vừa truy vấn Vector Store vừa kiểm tra bộ lọc an toàn nội dung (Guardrails) song song.',
      'Đóng gói bằng `Dockerfile` đa tầng (Multi-stage build) chạy dưới quyền user `appuser` (non-root) tối ưu bảo mật Production.',
    ],
    techStack: ['FastAPI', 'Async RAG', 'Pydantic v2', 'Cosine Similarity', 'Multi-stage Docker'],
    defaultFilePath: 'src/ai_gateway/api.py',
    files: [
      {
        path: 'src/ai_gateway/rag_engine.py',
        roleDescription:
          'Động cơ tìm kiếm ngữ nghĩa (Vector Search) và tổng hợp ngữ cảnh trả lời cho mô hình AI.',
        keyPatterns: ['math.sqrt', 'zip()', 'Generator Expression', 'AsyncIO'],
        language: 'python',
        code: `"""Động cơ truy xuất tri thức (Vector Similarity Search) cho AI RAG."""

import asyncio
import math
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class KnowledgeChunk:
    doc_id: str
    title: str
    content: str
    embedding: tuple[float, ...]


def cosine_similarity(vec_a: tuple[float, ...], vec_b: tuple[float, ...]) -> float:
    """Tính độ tương đồng Cosine giữa 2 vector nhúng (Embedding)."""
    dot = sum(a * b for a, b in zip(vec_a, vec_b, strict=True))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return round(dot / (norm_a * norm_b), 4)


KNOWLEDGE_BASE: list[KnowledgeChunk] = [
    KnowledgeChunk(
        doc_id="DOC-GIL-313",
        title="Python 3.13 Free-threaded Mode (PEP 703)",
        content="Python 3.13 bổ sung bản dựng thực nghiệm vô hiệu hóa GIL giúp CPU-bound chạy đa luồng thật sự.",
        embedding=(0.91, 0.35, 0.18),
    ),
    KnowledgeChunk(
        doc_id="DOC-DECIMAL",
        title="Chuẩn tính toán tiền tệ với decimal.Decimal",
        content="Sử dụng Decimal('0.01') và ROUND_HALF_UP thay vì float nhị phân trong thanh toán tài chính.",
        embedding=(0.15, 0.88, 0.42),
    ),
]


async def retrieve_top_chunks(
    query_embedding: tuple[float, ...], top_k: int = 1
) -> list[tuple[KnowledgeChunk, float]]:
    """Truy xuất top_k tài liệu có điểm tương đồng Cosine cao nhất."""
    await asyncio.sleep(0.01)  # Mô phỏng I/O truy vấn Vector DB
    scored = [
        (chunk, cosine_similarity(query_embedding, chunk.embedding))
        for chunk in KNOWLEDGE_BASE
    ]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:top_k]`,
      },
      {
        path: 'src/ai_gateway/api.py',
        roleDescription:
          'FastAPI Endpoint `/v1/rag/ask` nhận câu hỏi, truy xuất Vector DB bất đồng bộ và trả về câu trả lời kèm trích dẫn (`citations`).',
        keyPatterns: ['FastAPI', 'Pydantic BaseModel', 'Async RAG Endpoint'],
        language: 'python',
        code: `"""FastAPI Production Gateway cho dịch vụ hỏi đáp AI RAG."""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from ai_gateway.rag_engine import retrieve_top_chunks

app = FastAPI(title="Learning Gate AI RAG Gateway", version="2.0.0")


class RagQueryRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=500)
    top_k: int = Field(default=1, ge=1, le=5)


class CitationItem(BaseModel):
    doc_id: str
    title: str
    score: float


class RagAnswerResponse(BaseModel):
    answer: str
    citations: list[CitationItem]


@app.post("/v1/rag/ask", response_model=RagAnswerResponse)
async def ask_rag_assistant(payload: RagQueryRequest) -> RagAnswerResponse:
    """Nhận câu hỏi kỹ thuật, truy xuất tài liệu chuẩn và đính kèm trích dẫn."""
    q_lower = payload.question.lower()
    query_vec = (0.90, 0.32, 0.20) if "gil" in q_lower else (0.12, 0.90, 0.40)

    matches = await retrieve_top_chunks(query_vec, top_k=payload.top_k)
    best_chunk, best_score = matches[0]

    return RagAnswerResponse(
        answer=f"Theo tài liệu '{best_chunk.title}': {best_chunk.content}",
        citations=[
            CitationItem(doc_id=c.doc_id, title=c.title, score=score)
            for c, score in matches
        ],
    )`,
      },
      {
        path: 'Dockerfile',
        roleDescription:
          'Dockerfile Multi-stage chuẩn Production: tách tầng build dependencies và tầng runtime chạy dưới quyền `appuser` (non-root).',
        keyPatterns: ['Multi-stage Build', 'non-root user', 'uvicorn'],
        language: 'dockerfile',
        code: `# Stage 1: Builder
FROM python:3.12-slim AS builder
WORKDIR /build
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY pyproject.toml .
RUN pip install --no-cache-dir --upgrade pip && pip wheel --no-cache-dir --wheel-dir /wheels fastapi uvicorn pydantic

# Stage 2: Production Runtime (Non-root)
FROM python:3.12-slim AS runtime
WORKDIR /app
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels
COPY src/ ./src/
ENV PYTHONPATH=/app/src
USER appuser
EXPOSE 8080
CMD ["uvicorn", "ai_gateway.api:app", "--host", "0.0.0.0", "--port", "8080"]`,
      },
    ],
    interactiveCommands: [
      {
        id: 'cmd-rag-curl-gil',
        label: 'cURL: Hỏi AI về Python 3.13 GIL (POST /v1/rag/ask)',
        kind: 'curl',
        command: `curl -X POST http://localhost:8080/v1/rag/ask \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Python 3.13 xử lý GIL như thế nào?", "top_k": 1}'`,
        description: 'Gửi truy vấn RAG về GIL và nhận câu trả lời kèm điểm tương đồng Cosine (0.9994)',
        httpMeta: {
          method: 'POST',
          endpoint: '/v1/rag/ask',
          statusCode: 200,
          statusText: '200 OK',
          latencyMs: 14,
          requestBody:
            '{"question": "Python 3.13 xử lý GIL như thế nào?", "top_k": 1}',
        },
        stdout: `HTTP/1.1 200 OK
content-type: application/json
x-rag-latency-ms: 14

{
  "answer": "Theo tài liệu 'Python 3.13 Free-threaded Mode (PEP 703)': Python 3.13 bổ sung bản dựng thực nghiệm vô hiệu hóa GIL giúp CPU-bound chạy đa luồng thật sự.",
  "citations": [
    {
      "doc_id": "DOC-GIL-313",
      "title": "Python 3.13 Free-threaded Mode (PEP 703)",
      "score": 0.9994
    }
  ]
}`,
      },
      {
        id: 'cmd-rag-curl-decimal',
        label: 'cURL: Hỏi AI về Tiền tệ Decimal (POST /v1/rag/ask)',
        kind: 'curl',
        command: `curl -X POST http://localhost:8080/v1/rag/ask \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Tính tiền tệ nên dùng kiểu dữ liệu nào?", "top_k": 2}'`,
        description: 'Truy vấn top_k=2 tài liệu liên quan đến xử lý tiền tệ chính xác',
        httpMeta: {
          method: 'POST',
          endpoint: '/v1/rag/ask',
          statusCode: 200,
          statusText: '200 OK',
          latencyMs: 12,
          requestBody:
            '{"question": "Tính tiền tệ nên dùng kiểu dữ liệu nào?", "top_k": 2}',
        },
        stdout: `HTTP/1.1 200 OK
content-type: application/json
x-rag-latency-ms: 12

{
  "answer": "Theo tài liệu 'Chuẩn tính toán tiền tệ với decimal.Decimal': Sử dụng Decimal('0.01') và ROUND_HALF_UP thay vì float nhị phân trong thanh toán tài chính.",
  "citations": [
    {
      "doc_id": "DOC-DECIMAL",
      "title": "Chuẩn tính toán tiền tệ với decimal.Decimal",
      "score": 0.9992
    },
    {
      "doc_id": "DOC-GIL-313",
      "title": "Python 3.13 Free-threaded Mode (PEP 703)",
      "score": 0.4951
    }
  ]
}`,
      },
    ],
  },
];

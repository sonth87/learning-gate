import { FlashcardItem } from '@/types/assessment.types';

export const FLASHCARDS_PRO_MASTER_HERO: FlashcardItem[] = [
  // ============================================================================
  // STAGE 6: FASTAPI, PYDANTIC V2, SQLALCHEMY 2.0, REDIS & BẢO MẬT (fc-271 -> fc-295)
  // ============================================================================
  {
    id: 'fc-271',
    stageId: 'stage-6',
    level: 'pro',
    category: 'FastAPI & ASGI Internals',
    frontQuestion: 'Trong FastAPI, sự khác biệt cơ chế thực thi bên dưới giữa việc khai báo một Endpoint là **`async def`** so với **`def`** (không có `async`) là gì?',
    frontHint: 'Chạy trực tiếp trên Main Event Loop vs Tự động đẩy sang External ThreadPool (`anyio.to_thread.run_sync`)!',
    backAnswer:
      '- Khi bạn khai báo **`async def endpoint():`**, FastAPI chạy nó **trực tiếp trên Main Event Loop**. Do đó bên trong `async def` chỉ được phép gọi các thư viện non-blocking (`await`). Nếu bạn gọi hàm blocking (`requests.get`, `time.sleep`, `psycopg2` đồng bộ) bên trong `async def`, toàn bộ Server sẽ bị đơ cứng!\n- Khi bạn khai báo **`def endpoint():`** (không có `async`), FastAPI thông minh tự động đưa hàm đó ra chạy trên một **ThreadPool bên ngoài** để không làm nghẽn Event Loop!',
    backAnalogy:
      'Ghi nhãn `async def` là cam kết "Món này làm nhanh trên quầy chính"; còn ghi nhãn `def` là báo trước "Món này có bước chờ đồng bộ, hãy chuyển vào bếp phụ (ThreadPool)".',
    codeSnippet: `from fastapi import FastAPI
import time

app = FastAPI()

# ✅ Nếu dùng thư viện đồng bộ (Sync), hãy khai báo 'def' thường:
@app.get("/sync-work")
def sync_endpoint() -> dict:
    time.sleep(0.1)  # FastAPI tự chạy trên ThreadPool, không chặn Event Loop!
    return {"ok": True}`,
    relatedTermIds: ['eco-fastapi', 'stdlib-asyncio'],
  },
  {
    id: 'fc-272',
    stageId: 'stage-6',
    level: 'pro',
    category: 'FastAPI & Dependency Injection',
    frontQuestion: 'Cơ chế `app.dependency_overrides[get_db] = override_get_db` trong FastAPI giúp giải quyết bài toán kiểm thử tích hợp (Integration Testing) sạch sẽ hơn `unittest.mock.patch` như thế nào?',
    frontHint: 'Hoán đổi Database thật sang Database Test hoặc Fake Service ngay ở tầng DI Container mà không cần đụng vào đường dẫn import.',
    backAnswer:
      'Thay vì phải mò đường dẫn chuỗi để `@patch("my_app.api.routes.get_db")` dễ gãy khi đổi tên file, hệ thống **Dependency Injection (`Depends`)** của FastAPI cho phép bạn thay thế bất kỳ dependency nào trong lúc chạy test thông qua từ điển **`app.dependency_overrides[original_dep] = fake_dep`**. Mọi route đang dùng `Depends(original_dep)` sẽ tự động nhận bản `fake_dep` một cách an toàn kiểu 100%.',
    backAnalogy:
      'Thay vì phải cắt nối lại dây điện trong tường (`mock.patch`), bạn chỉ cần rút phích cắm nguồn điện lưới ra và cắm phích máy phát điện thử nghiệm vào ổ cắm trung tâm (`dependency_overrides`).',
    codeSnippet: `# Trong file test_api.py:
app.dependency_overrides[get_current_user] = lambda: {"id": 99, "role": "admin"}
# Sau khi test xong, xóa override:
app.dependency_overrides.clear()`,
    relatedTermIds: ['eco-fastapi', 'tool-pytest'],
  },
  {
    id: 'fc-273',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Pydantic v2 Deep Dive',
    frontQuestion: 'Trong Pydantic v2, tại sao gọi `User.model_validate_json(raw_json_bytes)` lại nhanh hơn gấp 3–5 lần so với `User.model_validate(json.loads(raw_json_bytes))`?',
    frontHint: 'Trình phân tích JSON `jiter` viết bằng Rust trong `pydantic-core` parse và validate trong 1 bước duy nhất mà không tạo `dict` trung gian!',
    backAnswer:
      'Khi bạn gọi `json.loads()` rồi mới đưa vào `model_validate()`, Python phải cấp phát hàng loạt đối tượng `dict`, `list`, `str` trung gian trên Heap của Python rồi mới đưa xuống Rust để kiểm tra. Ngược lại, **`model_validate_json()`** chuyển thẳng chuỗi/bytes JSON xuống bộ parser **`jiter` bằng Rust** bên trong `pydantic-core` để vừa đọc luồng byte JSON vừa kiểm chứng và tạo ra `BaseModel` chỉ trong **1 lượt duy nhất**, bỏ qua hoàn toàn bước tạo `dict` trung gian!',
    backAnalogy:
      'Đọc bản thiết kế và lắp thẳng thành phẩm ngay trên dây chuyền Rust (`model_validate_json`), thay vì dỡ hàng ra sàn nhà xếp thành đống (`json.loads`) rồi mới nhặt từng món đưa vào máy kiểm tra.',
    codeSnippet: `from pydantic import BaseModel

class Order(BaseModel):
    id: int
    total: float

raw = b'{"id": 101, "total": 250000.0}'
# Nhanh gấp nhiều lần so với json.loads() + model_validate():
order = Order.model_validate_json(raw)`,
    relatedTermIds: ['eco-pydantic', 'stdlib-json'],
  },
  {
    id: 'fc-274',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Pydantic v2 (`@field_validator` & `@model_validator`)',
    frontQuestion: 'Sự khác nhau giữa `@field_validator("email", mode="before" | "after")` và `@model_validator(mode="after")` trong Pydantic v2 là gì?',
    frontHint: 'Kiểm tra từng trường riêng lẻ (trước hoặc sau khi ép kiểu) vs Kiểm tra chéo giữa nhiều trường cùng lúc (Cross-field validation).',
    backAnswer:
      '- **`@field_validator("x", mode="before")`**: Chạy **trước khi** Pydantic ép kiểu (nhận dữ liệu thô `Any`, dùng để chuẩn hóa sơ bộ như `.strip()` hoặc tách chuỗi).\n- **`@field_validator("x", mode="after")`**: Chạy **sau khi** Pydantic đã ép kiểu thành công (nhận đúng kiểu đã khai báo).\n- **`@model_validator(mode="after")`**: Chạy sau khi toàn bộ các trường đã hợp lệ, nhận `self` là thực thể model để **kiểm tra logic chéo giữa nhiều trường** (ví dụ: `password == confirm_password` hoặc `end_date > start_date`).',
    backAnalogy:
      '`@field_validator` là kiểm tra từng linh kiện rời; còn `@model_validator` là kiểm tra xem các linh kiện khi ghép chung vào máy có khớp nhau không.',
    codeSnippet: `from pydantic import BaseModel, model_validator

class Booking(BaseModel):
    check_in_day: int
    check_out_day: int

    @model_validator(mode="after")
    def verify_dates(self) -> "Booking":
        if self.check_out_day <= self.check_in_day:
            raise ValueError("Ngày trả phòng phải sau ngày nhận phòng")
        return self`,
    relatedTermIds: ['eco-pydantic'],
  },
  {
    id: 'fc-275',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Pydantic v2 (`TypeAdapter` & `ConfigDict`)',
    frontQuestion: 'Khi bạn cần validate hoặc serialize một danh sách `list[User]` (hoặc ` union `) mà không muốn bọc nó trong một class `BaseModel` giả, công cụ nào của Pydantic v2 giải quyết việc này?',
    frontHint: '`TypeAdapter(list[User])` biên dịch schema Rust cho bất kỳ kiểu Python nào.',
    backAnswer:
      'Trong Pydantic v2, **`TypeAdapter( TargetType )`** cho phép bạn tạo bộ kiểm chứng và tuần tự hóa tốc độ Rust cho bất kỳ kiểu dữ liệu nào (`list[User]`, `dict[str, int]`, `TypedDict`, `dataclass`, `Union`) mà không cần tạo một class `BaseModel` bao bên ngoài. Mẹo tối ưu: khởi tạo `adapter = TypeAdapter(list[User])` **1 lần ở cấp module** rồi tái sử dụng `adapter.validate_json(...)` và `adapter.dump_json(...)`.',
    backAnalogy:
      'Máy quét cầm tay đa năng (`TypeAdapter`) soi được cả nguyên kiện hàng (`list[User]`) mà không bắt bạn phải đóng kiện hàng đó vào một chiếc thùng `BaseModel` nữa.',
    codeSnippet: `from pydantic import BaseModel, TypeAdapter

class Item(BaseModel):
    name: str
    qty: int

# Khởi tạo 1 lần ở cấp module để tái sử dụng bộ validator Rust:
 ItemListAdapter = TypeAdapter(list[Item])
items = ItemListAdapter.validate_json(b'[{"name": "Book", "qty": 2}]')`,
    relatedTermIds: ['eco-pydantic'],
  },
  {
    id: 'fc-276',
    stageId: 'stage-6',
    level: 'pro',
    category: 'SQLAlchemy 2.0 Async & Cạm bẫy `MissingGreenlet`',
    frontQuestion: 'Tại sao khi cấu hình `async_sessionmaker` trong SQLAlchemy 2.0, bạn **bắt buộc phải đặt `expire_on_commit=False`**? Nếu quên thì lỗi `MissingGreenlet` xảy ra khi nào?',
    frontHint: 'Mặc định sau khi `commit()`, SQLAlchemy đánh dấu mọi thuộc tính của object là "hết hạn (expired)" để tự gọi I/O ngầm khi bạn chấm đọc `user.id`!',
    backAnswer:
      'Ở chế độ đồng bộ cũ, sau khi `session.commit()`, SQLAlchemy xóa bộ đệm thuộc tính của `user`; khi bạn đọc `user.email`, nó âm thầm bắn 1 câu `SELECT` ngầm xuống DB để lấy lại dữ liệu mới (**Implicit I/O**). Nhưng trong môi trường **AsyncIO**, một thao tác chấm đọc thuộc tính `user.email` không có từ khóa `await` thì **không được phép thực hiện I/O ngầm**, dẫn đến nổ lỗi **`sqlalchemy.exc.MissingGreenlet`** ngay khi trả `user` về cho FastAPI! Đặt **`expire_on_commit=False`** giữ nguyên giá trị thuộc tính trong RAM sau khi commit.',
    backAnalogy:
      'Không có `expire_on_commit=False`, vừa đóng dấu lưu hồ sơ xong là thư ký tự xóa trắng bản cầm tay, bắt bạn phải chạy xuống kho (`await`) mới đọc lại được tên trên hồ sơ.',
    codeSnippet: `from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/db")
# BẮT BUỘC có expire_on_commit=False khi dùng AsyncSession!
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)`,
    relatedTermIds: ['eco-sqlalchemy', 'stdlib-asyncio'],
  },
  {
    id: 'fc-277',
    stageId: 'stage-6',
    level: 'pro',
    category: 'SQLAlchemy 2.0 & Tối ưu N+1 Query',
    frontQuestion: 'Trong SQLAlchemy 2.0, khi giải quyết bài toán **N+1 Query** bằng Eager Loading, khi nào nên chọn **`selectinload()`** và khi nào nên chọn **`joinedload()`**?',
    frontHint: 'Quan hệ `1-nhiều` (`One-to-Many` / `Many-to-Many`) vs Quan hệ `nhiều-1` (`Many-to-One` / `One-to-One`).',
    backAnswer:
      '- **`joinedload(Order.customer)`**: Dùng phép `LEFT OUTER JOIN` trong cùng 1 câu SQL. Phù hợp nhất cho quan hệ **`Many-to-One` hoặc `One-to-One`** (vì mỗi đơn hàng chỉ có 1 khách hàng nên không làm nhân bản số dòng kết quả).\n- **`selectinload(User.orders)`**: Bắn câu truy vấn thứ 2 cực nhanh dạng `SELECT ... FROM orders WHERE user_id IN (1, 2, 3...)`. Phù hợp nhất cho quan hệ **`One-to-Many` hoặc `Many-to-Many`** (tránh hiện tượng tích Đề-các làm phình dữ liệu lặp lại thông tin `User` hàng trăm lần qua đường truyền mạng như `JOIN`).',
    backAnalogy:
      '`joinedload` là kẹp tờ danh thiếp người gửi vào từng kiện hàng (1-1); `selectinload` là xuất 1 danh sách khách hàng kèm 1 thùng riêng chứa toàn bộ đơn hàng của nhóm khách đó (1-N).',
    codeSnippet: `from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload

# User có nhiều Orders (1-N) -> Dùng selectinload:
stmt = select(User).options(selectinload(User.orders))`,
    relatedTermIds: ['eco-sqlalchemy'],
  },
  {
    id: 'fc-278',
    stageId: 'stage-6',
    level: 'pro',
    category: 'SQLAlchemy 2.0 & Connection Pool',
    frontQuestion: 'Tham số `pool_pre_ping=True` và `pool_recycle=1800` trong `create_async_engine()` cứu ứng dụng khỏi lỗi sập kết nối Database như thế nào?',
    frontHint: 'Tường lửa Cloud / PostgreSQL tự ngắt các kết nối nhàn rỗi (Idle connections) trong Pool mà ứng dụng không hề hay biết.',
    backAnswer:
      'Khi ứng dụng ít tải vào ban đêm, các kết nối mở sẵn trong Connection Pool nằm im sẽ bị tường lửa mạng (AWS NAT Gateway / Cloud SQL) hoặc Database Server chủ động cắt đứt. Sáng hôm sau khi khách hàng đầu tiên gọi vào, ứng dụng lấy kết nối "đã chết" đó ra dùng sẽ bị nổ lỗi **`ConnectionDoesNotExistError` / `OperationalError: server closed the connection unexpectedly`**. Bật **`pool_pre_ping=True`** giúp SQLAlchemy kiểm tra nhanh (`SELECT 1`) trước khi giao kết nối từ Pool và tự động thay mới nếu kết nối cũ đã đứt!',
    backAnalogy:
      'Trước khi giao xe từ bãi đỗ cho khách, nhân viên bảo vệ đề thử máy 1 giây (`pool_pre_ping=True`): nếu xe hết bình thì đổi ngay chiếc xe khác trong bãi thay vì để khách dắt ra đường mới chết máy.',
    codeSnippet: `engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/db",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,   # Tự động kiểm tra và phục hồi kết nối bị đứt!
    pool_recycle=1800,    # Làm mới kết nối sau mỗi 30 phút
)`,
    relatedTermIds: ['eco-sqlalchemy'],
  },
  {
    id: 'fc-279',
    stageId: 'stage-6',
    level: 'master',
    category: 'Database & Phân trang Hiệu năng cao',
    frontQuestion: 'Tại sao phân trang bằng `OFFSET 1000000 LIMIT 20` lại làm chậm sập Database trên bảng lớn, và kỹ thuật **Keyset / Cursor Pagination** giải quyết triệt để vấn đề này như thế nào?',
    frontHint: 'Với `OFFSET 1_000_000`, Database vẫn phải quét và đếm đủ 1.000.020 dòng rồi vứt bỏ 1 triệu dòng đầu!',
    backAnswer:
      'Khi dùng `OFFSET N`, Database không thể nhảy cóc mà phải đọc qua toàn bộ $N$ bản ghi đầu tiên trên đĩa/RAM rồi mới lấy 20 dòng tiếp theo — độ phức tạp tăng tuyến tính **$O(N)$** càng về trang cuối càng chậm. Ngược lại, **Keyset / Cursor Pagination** dựa vào giá trị cuối cùng của trang trước (`WHERE (created_at, id) < (:last_created_at, :last_id) ORDER BY created_at DESC, id DESC LIMIT 20`) kết hợp Composite B-Tree Index để nhảy thẳng vào đúng vị trí trong **$O(\\log N)$ (~1ms)** dù ở trang thứ 1 hay trang thứ 100.000!',
    backAnalogy:
      '`OFFSET` là mỗi lần mở sách lại phải đếm từng trang từ trang 1 đến trang 1.000; `Cursor Pagination` là kẹp sẵn chiếc thẻ đánh dấu sách (Bookmark) ở dòng cuối vừa đọc để mở phát trúng ngay!',
    codeSnippet: `# Truy vấn Cursor Pagination tốc độ O(log N) ổn định ở mọi trang:
stmt = (
    select(Order)
    .where(tuple_(Order.created_at, Order.id) < (cursor_dt, cursor_id))
    .order_by(Order.created_at.desc(), Order.id.desc())
    .limit(20)
)`,
    relatedTermIds: ['eco-sqlalchemy'],
  },
  {
    id: 'fc-280',
    stageId: 'stage-6',
    level: 'master',
    category: 'Database Concurrency & Chống Trừ Tiền Kép',
    frontQuestion: 'Khi 2 request cùng lúc rút tiền từ 1 tài khoản (Lost Update / Double Spend), sự khác nhau giữa **Pessimistic Locking (`SELECT ... FOR UPDATE`)** và **Optimistic Concurrency Control (`version_id`)** là gì?',
    frontHint: 'Khóa dòng ngay khi đọc (`with_for_update()`) vs Cột `version` kiểm tra lúc `UPDATE ... WHERE id = :id AND version = :old_ver`.',
    backAnswer:
      '- **Pessimistic Locking (`select(Wallet).where(...).with_for_update()`)**: Khóa cứng dòng dữ liệu đó trong Database ngay từ lúc đọc cho đến khi Transaction kết thúc. Request thứ 2 chạm vào cùng ví đó phải xếp hàng chờ Request 1 commit xong. Rất chuẩn cho giao dịch tài chính xung đột cao.\n- **Optimistic Locking**: Không khóa khi đọc, nhưng gắn thêm cột `version`. Khi cập nhật: `UPDATE wallets SET balance = ..., version = version + 1 WHERE id = 1 AND version = 5`. Nếu số dòng cập nhật (`rowcount == 0`), nghĩa là có người khác vừa sửa trước, ứng dụng sẽ báo lỗi hoặc thử lại.',
    backAnalogy:
      'Pessimistic là vào phòng试 đồ chốt cửa lại ngay (`FOR UPDATE`); Optimistic là cứ lấy mẫu thiết kế về sửa, lúc nộp lại nếu thấy số phiên bản gốc đã bị người khác đổi thì làm lại.',
    codeSnippet: `# Khóa dòng bi quan (Pessimistic Row Lock) chống trừ tiền 2 lần trong SQLAlchemy:
stmt = (
    select(Wallet)
    .where(Wallet.user_id == user_id)
    .with_for_update()  # Sinh mệnh đề SELECT ... FOR UPDATE
)`,
    relatedTermIds: ['eco-sqlalchemy'],
  },
  {
    id: 'fc-281',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Database Migrations (Alembic Zero-Downtime)',
    frontQuestion: 'Chiến lược **Expand and Contract (Mở rộng rồi Thu hẹp)** khi chạy Database Migration với `Alembic` giúp tránh lỗi sập hệ thống (Zero-Downtime Deployment) khi đổi tên cột như thế nào?',
    frontHint: 'Chuyện gì xảy ra nếu bạn chạy `ALTER TABLE RENAME COLUMN` ngay khi các pod code phiên bản cũ vẫn đang chạy song song trong Kubernetes Rolling Update?',
    backAnswer:
      'Khi deploy Rolling Update, các container bản cũ (`v1`) và bản mới (`v2`) chạy song song trong vài phút. Nếu bạn đổi tên cột `fullname` sang `full_name` ngay lập tức, toàn bộ container `v1` đang chạy sẽ chết vì lỗi `Column "fullname" does not exist`! Quy trình **Expand & Contract** gồm 3 bước an toàn:\n1. **Expand**: Thêm cột mới `full_name` (`nullable=True`), code mới ghi đồng thời cả 2 cột và backfill dữ liệu cũ.\n2. **Switch**: Chuyển toàn bộ chỗ đọc sang cột `full_name`.\n3. **Contract**: Sau khi `v1` đã tắt hết, chạy migration xóa cột cũ `fullname`.',
    backAnalogy:
      'Muốn thay cầu mới không được nổ mìn phá cầu cũ ngay khi xe đang chạy: phải xây cầu mới bên cạnh (Expand), phân luồng toàn bộ xe sang cầu mới (Switch), rồi mới tháo dỡ cầu cũ (Contract).',
    codeSnippet: `# Bước 1 (Expand) trong Alembic migration:
def upgrade() -> None:
    op.add_column("users", sa.Column("full_name", sa.String(120), nullable=True))`,
    relatedTermIds: ['eco-sqlalchemy'],
  },
  {
    id: 'fc-282',
    stageId: 'stage-6',
    level: 'master',
    category: 'Hệ thống Phân tán & Redis Cache Stampede',
    frontQuestion: 'Hiện tượng **Cache Stampede (Thundering Herd)** khi một khóa Redis hết hạn (TTL = 0) là gì và 2 kỹ thuật phòng chống hiệu quả nhất trong Python là gì?',
    frontHint: '10.000 người dùng cùng truy cập 1 trang chủ đúng giây cache vừa hết hạn -> cả 10.000 request cùng đâm thẳng xuống Database!',
    backAnswer:
      '**Cache Stampede** xảy ra khi một key cực nóng trong Redis vừa hết hạn (hoặc khi vừa khởi động lại cụm cache), hàng nghìn request đồng thời đều bị `Cache Miss` và cùng lúc chạy câu truy vấn nặng xuống Database làm sập DB. Hai cách chống hiệu quả nhất:\n1. **TTL Jitter**: Cộng thêm một khoảng thời gian ngẫu nhiên vào TTL (`ttl = 300 + random.randint(0, 60)`) để hàng loạt key không bao giờ hết hạn cùng một giây.\n2. **Distributed Lock / Singleflight**: Chỉ cho **1 request duy nhất** xuống DB tính toán lại cache, các request còn lại chờ 50ms hoặc nhận bản cache cũ (`Stale-While-Revalidate`).',
    backAnalogy:
      'Đừng hẹn cả 10.000 nhân viên đi gia hạn thẻ ra vào vào đúng 9h00 sáng thứ Hai (gây vỡ sảnh lễ tân) — hãy rải lịch hẹn lệch nhau vài phút (TTL Jitter) hoặc cử 1 đại diện đi lấy hộ cả phòng (Singleflight).',
    codeSnippet: `import random

def get_jittered_ttl(base_seconds: int = 300) -> int:
    # Thêm độ lệch ngẫu nhiên ±15% để tránh hàng nghìn key hết hạn cùng 1 giây:
    jitter = random.randint(0, int(base_seconds * 0.15))
    return base_seconds + jitter`,
    relatedTermIds: ['stdlib-asyncio'],
  },
  {
    id: 'fc-283',
    stageId: 'stage-6',
    level: 'master',
    category: 'Hệ thống Phân tán & Idempotency Key',
    frontQuestion: 'Cơ chế **Idempotency-Key** trong các API Thanh toán / Đặt hàng hoạt động như thế nào để đảm bảo khách bấm nút "Thanh toán" 5 lần khi mạng lag cũng chỉ bị trừ tiền đúng 1 lần?',
    frontHint: 'Client sinh UUID gửi kèm Header `Idempotency-Key`; Server dùng `SET key "PROCESSING" NX EX 60` hoặc Unique Constraint trong DB.',
    backAnswer:
      'Client tạo một mã định danh duy nhất cho giao dịch (ví dụ `Idempotency-Key: 9b1deb4d-...`) gửi kèm trong HTTP Header. Khi Server nhận request:\n1. Kiểm tra nguyên tử trong Redis (`SET idem:9b1deb4d "IN_PROGRESS" NX EX 300`) hoặc bảng `idempotency_keys` trong DB.\n2. Nếu key **chưa tồn tại**: thực hiện trừ tiền, lưu kết quả JSON phản hồi gắn với key đó rồi trả về.\n3. Nếu key **đã hoàn tất**: lập tức trả lại đúng kết quả JSON đã lưu mà **không chạy lại logic trừ tiền** (nếu đang `IN_PROGRESS` thì trả `409 Conflict`).',
    backAnalogy:
      'Mỗi tờ séc ngân hàng đều có một mã số seri duy nhất (`Idempotency-Key`): dù người đưa thư gửi bản fax tờ séc đó 3 lần do kẹt giấy, ngân hàng tra số seri thấy đã chi tiền rồi thì chỉ gửi lại biên lai cũ.',
    codeSnippet: `# Kiểm tra nguyên tử Idempotency Key trên Redis (SET if Not Exists):
is_first_request = await redis.set(
    f"idempotency:{idem_key}", "PROCESSING", nx=True, ex=300
)
if not is_first_request:
    # Trả về kết quả đã xử lý trước đó hoặc báo đang xử lý!
    ...`,
    relatedTermIds: ['eco-fastapi'],
  },
  {
    id: 'fc-284',
    stageId: 'stage-6',
    level: 'master',
    category: 'Hệ thống Phân tán & Transactional Outbox',
    frontQuestion: 'Tại sao việc `await db.commit()` rồi gọi tiếp `await kafka.publish(event)` (Dual Write) lại nguy hiểm trong Microservices, và mẫu thiết kế **Transactional Outbox Pattern** giải quyết nó ra sao?',
    frontHint: 'Chuyện gì xảy ra nếu `db.commit()` đã lưu đơn hàng thành công nhưng đúng мили-giây sau mạng Kafka/RabbitMQ bị đứt hoặc pod bị sập?',
    backAnswer:
      'Khi ghi vào 2 hệ thống rời rạc (Database và Message Broker) mà không có giao dịch chung (**Dual Write Problem**), nếu DB commit xong mà bước bắn sự kiện sang Kafka/RabbitMQ thất bại, hệ thống sẽ rơi vào trạng thái **bất nhất vĩnh viễn** (đơn hàng đã tạo nhưng kho hàng và dịch vụ gửi email không bao giờ nhận được thông báo!). Với **Transactional Outbox**, bạn ghi cả `Order` lẫn bản ghi sự kiện vào bảng **`outbox_events`** trong **cùng 1 Database Transaction ACID**. Sau đó một tiến trình Relay chạy nền đọc bảng `outbox_events` đẩy lên Broker và đánh dấu `processed = True`.',
    backAnalogy:
      'Thay vì vừa ký hợp đồng xong phải chạy bộ ra bưu điện gửi thư (lỡ giữa đường mưa bão mất thư), bạn bỏ luôn bức thư vào Hộp thư đi (`outbox_events`) đặt ngay trong két sắt cùng lúc ký hợp đồng, để xe bưu chính chuyên dụng đến lấy định kỳ.',
    codeSnippet: `async with session.begin():
    session.add(new_order)
    # Ghi sự kiện vào bảng outbox_events trong CÙNG 1 Transaction ACID:
    session.add(OutboxEvent(topic="order.created", payload=new_order.to_dict()))
# Cam kết: Hoặc cả hai cùng lưu thành công, hoặc cả hai cùng Rollback!`,
    relatedTermIds: ['eco-sqlalchemy'],
  },
  {
    id: 'fc-285',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Background Workers (Celery / ARQ)',
    frontQuestion: 'Quy tắc vàng khi đẩy tác vụ vào hàng đợi chạy nền (`Celery` / `ARQ`): Tại sao luôn phải **truyền `order_id: int` (ID nhỏ gọn)** thay vì truyền nguyên đối tượng `Order` ORM vào Task?',
    frontHint: 'Tránh lỗi dữ liệu cũ (Stale State), lỗi tuần tự hóa (Serialization Error) và tránh làm phình bộ nhớ Redis/RabbitMQ.',
    backAnswer:
      '1. **Tránh Stale Data (Dữ liệu lỗi thời)**: Task nằm trong hàng đợi có thể mất vài giây hoặc vài phút mới tới lượt chạy; lúc đó trạng thái đơn hàng trong DB có thể đã thay đổi (ví dụ khách đã bấm Hủy đơn!). Nếu truyền nguyên object cũ lúc xếp hàng, Worker sẽ xử lý trên dữ liệu đã lỗi thời.\n2. **Nhẹ & An toàn**: Đối tượng SQLAlchemy ORM gắn với Session không thể serialize sang JSON an toàn. Truyền **`order_id`** giúp payload trong Redis siêu nhẹ và Worker luôn đọc lại bản ghi mới nhất từ DB!',
    backAnalogy:
      'Gửi tin nhắn cho bác sĩ trực ca chỉ cần nhắn "Mã bệnh nhân #402" để bác sĩ mở bệnh án mới nhất ra xem, thay vì chụp ảnh bệnh án từ hôm qua gửi qua tin nhắn.',
    codeSnippet: `# ❌ SAI: Truyền nguyên ORM object nặng và dễ bị lỗi thời (Stale state)
# await queue.enqueue_job("send_invoice", order_orm_object)

# ✅ ĐÚNG: Chỉ truyền ID nguyên thủy, Worker tự truy vấn bản ghi mới nhất từ DB
await queue.enqueue_job("send_invoice", order_id=order.id)`,
    relatedTermIds: ['eco-sqlalchemy', 'stdlib-asyncio'],
  },
  {
    id: 'fc-286',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Bảo mật Backend & Băm Mật khẩu',
    frontQuestion: 'Tại sao khi xác thực mật khẩu người dùng bằng `bcrypt` hoặc `argon2` trong FastAPI (`async def login`), bạn phải đẩy hàm kiểm tra mật khẩu sang `asyncio.to_thread()`?',
    frontHint: 'Các thuật toán băm mật khẩu như Argon2/Bcrypt được thiết kế CỐ TÌNH tốn 100ms–300ms CPU để chống dò mật khẩu (Brute-force)!',
    backAnswer:
      'Khác với `SHA-256` chạy trong vài micro-giây, các hàm băm mật khẩu chuẩn như **Argon2id** hoặc **bcrypt** được thiết kế cố tình tiêu tốn **100ms–250ms CPU thuần** cho mỗi lần kiểm tra. Nếu gọi trực tiếp trên luồng chính của Event Loop (`async def`), chỉ cần 10 người dùng đăng nhập cùng lúc là toàn bộ Event Loop bị khóa cứng mất 2.5 giây! Do đó, luôn bọc `await asyncio.to_thread(ph.verify, hashed, plain_pw)` để giải phóng Event Loop (và `argon2-cffi` sẽ nhả GIL trong lúc tính toán C).',
    backAnalogy:
      'Kiểm tra sinh trắc học tốn 200ms phải đưa vào buồng kiểm tra riêng (`to_thread`), không được chặn ngay cửa xoay chính của tòa nhà (`Event Loop`).',
    codeSnippet: `import asyncio
from argon2 import PasswordHasher

ph = PasswordHasher()

async def verify_password_async(hashed: str, plain: str) -> bool:
    return await asyncio.to_thread(ph.verify, hashed, plain)`,
    relatedTermIds: ['stdlib-asyncio', 'eco-fastapi'],
  },
  {
    id: 'fc-287',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Bảo mật Backend (Chống SSRF & SQL Injection)',
    frontQuestion: 'Lỗi bảo mật **SSRF (Server-Side Request Forgery)** xảy ra như thế nào trong các tính năng "Tải ảnh từ URL / Xem trước Link / Webhook" và cách phòng chống trong Python là gì?',
    frontHint: 'Kẻ tấn công nhập URL `http://169.254.169.254/latest/meta-data/` (AWS Metadata) hoặc `http://127.0.0.1:6379` để bắt Server của bạn tự đọc mạng nội bộ!',
    backAnswer:
      'Nếu ứng dụng nhận một `url` từ người dùng rồi gọi thẳng `httpx.get(user_url)`, kẻ tấn công có thể truyền địa chỉ IP nội bộ (`127.0.0.1`, `10.x.x.x`, `192.168.x.x`, hoặc `169.254.169.254` lấy khóa IAM của AWS Cloud). Cách phòng chống chuẩn trong Python:\n1. Chỉ cho phép giao thức `https://` / `http://`.\n2. Phân giải DNS của hostname ra địa chỉ IP và dùng module chuẩn **`ipaddress.ip_address(ip)`** để chặn tuyệt đối nếu `ip.is_private`, `ip.is_loopback`, `ip.is_link_local`, hoặc `ip.is_reserved`!\n3. Tắt tự động chuyển hướng (`follow_redirects=False`) hoặc kiểm tra lại IP ở mỗi bước redirect.',
    backAnalogy:
      'Nhờ nhân viên tòa nhà đi lấy bưu phẩm ở ngoài cổng giúp, nhưng kẻ gian lại ghi địa chỉ "Phòng Két sắt Nội bộ Tầng Hầm" (`127.0.0.1`) — nhân viên phải kiểm tra bằng `ipaddress` để từ chối mọi địa chỉ nằm bên trong nội bộ tòa nhà!',
    codeSnippet: `import ipaddress

def is_safe_public_ip(raw_ip: str) -> bool:
    ip = ipaddress.ip_address(raw_ip)
    # Chặn mọi IP nội bộ, loopback (127.0.0.1), link-local (169.254.x.x):
    return ip.is_global and not (ip.is_private or ip.is_loopback or ip.is_link_local)`,
    relatedTermIds: ['eco-fastapi'],
  },
  {
    id: 'fc-288',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Thiết kế API & Chuẩn Lỗi RFC 9457',
    frontQuestion: 'Chuẩn **Problem Details for HTTP APIs (RFC 7807 / RFC 9457)** chuẩn hóa cấu trúc JSON trả về khi API gặp lỗi gồm những trường cốt lõi nào?',
    frontHint: '`type`, `title`, `status`, `detail`, `instance` (kèm `request_id` / `errors`).',
    backAnswer:
      'Thay vì mỗi lập trình viên tự bịa ra một kiểu trả lỗi (`{"error": "..."}`, `{"msg": "..."}`, `{"message": []}`), chuẩn quốc tế **RFC 9457** quy định cấu trúc thống nhất với header `Content-Type: application/problem+json` gồm 5 trường chuẩn:\n- **`type`**: URI định danh mã lỗi (ví dụ `"https://api.app.vn/errors/insufficient-funds"`).\n- **`title`**: Tên ngắn gọn của loại lỗi.\n- **`status`**: Mã HTTP status (`400`, `422`, `409`).\n- **`detail`**: Giải thích cụ thể cho lần xảy ra lỗi này.\n- **`instance`**: Đường dẫn request hoặc `request_id` để tra cứu log.',
    backAnalogy:
      'Biểu mẫu biên bản chuẩn quốc tế: dù sự cố xảy ra ở bộ phận nào thì tờ thông báo gửi về cho Frontend/Mobile App cũng có đúng 5 ô thông tin cố định dễ xử lý.',
    codeSnippet: `from pydantic import BaseModel

class ProblemDetail(BaseModel):
    type: str = "about:blank"
    title: str
    status: int
    detail: str
    instance: str | None = None`,
    relatedTermIds: ['eco-fastapi', 'eco-pydantic'],
  },
  {
    id: 'fc-289',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Độ tin cậy & Exponential Backoff (`tenacity`)',
    frontQuestion: 'Khi dùng thư viện `tenacity` (hoặc tự viết logic Retry) để thử lại khi gọi API bên thứ 3 gặp lỗi mạng, tại sao phải dùng **Exponential Backoff kèm Random Jitter (`wait_random_exponential`)** thay vì chờ cố định 2 giây?',
    frontHint: 'Nếu 1.000 client cùng bị lỗi ở giây 0 và cùng hẹn thử lại sau đúng 2 giây, ở giây thứ 2 cả 1.000 client sẽ lại đồng loạt tông sập server vừa mới hồi phục!',
    backAnswer:
      '- **Exponential Backoff**: Tăng dần thời gian chờ theo cấp số nhân ($1s \\rightarrow 2s \\rightarrow 4s \\rightarrow 8s$) để cho hệ thống đích có thời gian thở và hồi phục.\n- **Jitter (Độ nhiễu ngẫu nhiên)**: Cộng/trừ một khoảng mili-giây ngẫu nhiên vào thời gian chờ để **phá vỡ sự đồng bộ** giữa hàng nghìn client đang cùng thử lại, biến các đợt sóng xung kích thành dòng tải đều đặn.\n- **Lưu ý**: Chỉ retry các lỗi tạm thời (Network Timeout, HTTP `429`, `502`, `503`, `504`), **không bao giờ retry lỗi `400`, `401`, `403`, `422`**!',
    backAnalogy:
      'Khi cầu thang thoát hiểm bị nghẽn, nếu tất cả mọi người cùng đếm "1, 2, 3 bước lên!" cùng một nhịp thì lại kẹt cứng; mỗi người tự bước chậm lại một nhịp ngẫu nhiên (Jitter) sẽ giúp dòng người thông suốt.',
    codeSnippet: `from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type
import httpx

@retry(
    reraise=True,
    stop=stop_after_attempt(4),
    wait=wait_random_exponential(multiplier=0.5, max=10.0),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
)
async def fetch_with_retry(client: httpx.AsyncClient, url: str) -> dict:
    resp = await client.get(url)
    resp.raise_for_status()
    return resp.json()`,
    relatedTermIds: ['stdlib-asyncio'],
  },
  {
    id: 'fc-290',
    stageId: 'stage-6',
    level: 'master',
    category: 'Độ tin cậy & Circuit Breaker Pattern',
    frontQuestion: 'Mẫu thiết kế **Circuit Breaker (Cầu dao Tự ngắt)** khác với **Retry** ở điểm nào và có 3 trạng thái hoạt động nào (`CLOSED`, `OPEN`, `HALF-OPEN`)?',
    frontHint: 'Khi dịch vụ đối tác đã chết hẳn, việc cố Retry chỉ làm cạn kiệt kết nối và làm treo dây chuyền (Cascading Failure) cả hệ thống của bạn!',
    backAnswer:
      'Trong khi **Retry** cố thử lại với hy vọng lỗi chỉ thoáng qua, **Circuit Breaker** bảo vệ hệ thống khỏi **sụp đổ dây chuyền (Cascading Failure)** khi dịch vụ đích đã sập thực sự:\n1. **`CLOSED` (Đóng — Bình thường)**: Cho request đi qua và đếm tỷ lệ lỗi.\n2. **`OPEN` (Mở — Ngắt mạch)**: Khi số lỗi vượt ngưỡng (ví dụ 5 lỗi liên tiếp), cầu dao lập tức **ngắt mạch** trong 30 giây — mọi request tiếp theo được trả lỗi/fallback ngay lập tức (Fail-fast 0ms) mà không tốn tài nguyên gọi mạng!\n3. **`HALF-OPEN` (Bán mở — Thăm dò)**: Sau 30 giây, cho thử **1 request thăm dò** đi qua: nếu thành công thì đóng cầu dao lại (`CLOSED`), nếu vẫn lỗi thì ngắt tiếp (`OPEN`).',
    backAnalogy:
      'Aptomat (Cầu dao điện) tự nhảy `OPEN` khi phát hiện chập điện ở phòng bên để tránh cháy lan sang toàn bộ tòa nhà; đợi thợ sửa xong mới bật thử `HALF-OPEN` kiểm tra trước khi cấp điện hoàn toàn `CLOSED`.',
    codeSnippet: `# Ba trạng thái cốt lõi của Circuit Breaker:
# CLOSED (Bình thường) --[Lỗi >= Ngưỡng]--> OPEN (Từ chối nhanh / Fallback)
# OPEN --[Hết thời gian nghỉ]--> HALF_OPEN (Cho 1 request thăm dò)
# HALF_OPEN --[Thành công]--> CLOSED | --[Thất bại]--> OPEN`,
    relatedTermIds: ['stdlib-asyncio'],
  },
  {
    id: 'fc-291',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Triển khai Production (Gunicorn + Uvicorn)',
    frontQuestion: 'Khi triển khai ứng dụng FastAPI lên máy chủ đa nhân (ví dụ 4 vCPU), tại sao người ta thường chạy nhiều tiến trình Worker (`uvicorn --workers 4` hoặc `gunicorn -k uvicorn.workers.UvicornWorker`)?',
    frontHint: 'Mỗi tiến trình Python chỉ có 1 Event Loop chạy trên 1 nhân CPU; cần $N$ tiến trình Worker để khai thác hết $N$ nhân CPU vật lý!',
    backAnswer:
      'Một tiến trình `uvicorn` đơn lẻ chạy **1 Event Loop trên 1 nhân CPU**. Dù Event Loop đó xử lý được hàng nghìn kết nối I/O chờ mạng, nhưng nếu máy chủ có 4 hoặc 8 nhân CPU vật lý, 1 tiến trình sẽ bỏ phí các nhân còn lại (và chịu rủi ro nếu tiến trình duy nhất đó bị crash). Chạy nhiều tiến trình Worker (hoặc dùng Kubernetes nhân bản nhiều Pod có 1–2 worker/pod) giúp tận dụng toàn bộ các nhân CPU và tự động khởi động lại worker nếu có sự cố.',
    backAnalogy:
      'Mỗi nhân viên thu ngân (`Event Loop`) phục vụ rất nhanh, nhưng siêu thị có 4 quầy thu ngân (`4 vCPU`) thì phải bố trí đủ 4 nhân viên đứng ở 4 quầy để công suất tăng gấp 4 lần.',
    codeSnippet: `# Chạy Production trên VM nhiều nhân:
# $ uvicorn my_app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Trên Kubernetes (K8s tự quản lý nhân bản Pod):
# Mỗi container chạy 1 tiến trình uvicorn và để K8s HPA scale số lượng Pod!`,
    relatedTermIds: ['eco-fastapi', 'concept-gil'],
  },
  {
    id: 'fc-292',
    stageId: 'stage-6',
    level: 'master',
    category: 'Triển khai Production & Graceful Shutdown',
    frontQuestion: 'Quá trình **Graceful Shutdown** khi container Python nhận tín hiệu `SIGTERM` từ Docker / Kubernetes cần thực hiện những bước nào để không làm đứt ngang các giao dịch của khách hàng đang chạy dở?',
    frontHint: 'Ngừng nhận kết nối mới -> Chờ các request đang chạy hoàn tất (Drain in-flight requests) -> Đóng Lifespan (DB Pool, Redis, HTTP Client, Flush Logs).',
    backAnswer:
      'Khi Kubernetes thay thế Pod mới, nó gửi tín hiệu **`SIGTERM`** và chờ một khoảng `terminationGracePeriodSeconds` (mặc định 30s) trước khi giết cưỡng bức bằng `SIGKILL`. Một ứng dụng Python chuẩn Production xử lý `SIGTERM` qua 3 bước:\n1. Báo Health Check (`/readyz`) chuyển sang `503` để Load Balancer ngừng gửi request mới vào Pod.\n2. Chờ các request / task đang chạy dở hoàn tất (Uvicorn hỗ trợ `--timeout-graceful-shutdown 25`).\n3. Chạy phần sau `yield` của hàm **`lifespan`** để đóng sạch `engine.dispose()`, đóng Redis, đóng `httpx.AsyncClient` và đẩy hết log/metrics còn đọng.',
    backAnalogy:
      'Khi nhà hàng đóng cửa lúc 22h (`SIGTERM`): Bước 1 là treo biển "Ngừng nhận khách mới" ở cửa; Bước 2 là phục vụ nốt các bàn đang ăn dở cho xong; Bước 3 là khóa bếp, tắt điện rồi mới ra về.',
    codeSnippet: `from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Khởi tạo tài nguyên khi mở server ---
    yield
    # --- Tự động chạy khi nhận SIGTERM (Graceful Shutdown) ---
    await db_engine.dispose()
    await redis_client.aclose()`,
    relatedTermIds: ['eco-fastapi', 'stdlib-asyncio'],
  },
  {
    id: 'fc-293',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Rate Limiting (Giới hạn Tần suất Gọi API)',
    frontQuestion: 'Thuật toán **Token Bucket** và **Sliding Window** dùng để chống spam / giới hạn tốc độ gọi API (Rate Limiting) hoạt động như thế nào trên Redis?',
    frontHint: 'Tại sao kiểm tra và trừ lượt gọi trên Redis cần thực hiện nguyên tử (Atomic) bằng Lua Script hoặc Pipeline?',
    backAnswer:
      '- **Token Bucket**: Mỗi user có một xô chứa tối đa $B$ thẻ (cho phép bùng nổ ngắn hạn — Burst), cứ mỗi giây xô tự nạp thêm $R$ thẻ; mỗi request lấy đi 1 thẻ, hết thẻ thì trả về **`HTTP 429 Too Many Requests`** kèm header `Retry-After`.\n- **Tại sao dùng Redis Lua Script**: Nếu bạn gọi `GET` số thẻ về Python, kiểm tra `> 0` rồi mới gọi `DECR`, hai request đến cùng một mili-giây sẽ cùng đọc thấy còn 1 thẻ và cùng đi qua (Race Condition). Chạy **Lua Script trên Redis** gộp bước Đọc-Kiểm tra-Trừ thành **1 thao tác nguyên tử duy nhất**.',
    backAnalogy:
      'Bình nước tự động chảy thêm mỗi giây 1 giọt (`Token Bucket`): khách có thể rót liền 5 cốc nếu bình đang đầy, nhưng khi bình cạn thì phải đợi giọt tiếp theo chảy vào.',
    codeSnippet: `# Phản hồi chuẩn khi vượt ngưỡng Rate Limit:
# HTTP/1.1 429 Too Many Requests
# Retry-After: 15
# X-RateLimit-Remaining: 0`,
    relatedTermIds: ['eco-fastapi'],
  },
  {
    id: 'fc-294',
    stageId: 'stage-6',
    level: 'master',
    category: 'Kiến trúc Phần mềm (Clean / Hexagonal Architecture)',
    frontQuestion: 'Quy tắc phụ thuộc cốt lõi (**The Dependency Rule**) trong **Clean / Hexagonal Architecture (Ports & Adapters)** khi áp dụng vào dự án Python lớn là gì?',
    frontHint: 'Tầng `domain/` (Entities, Business Rules) hoàn toàn thuần Python, KHÔNG import `FastAPI`, `SQLAlchemy` hay `httpx`!',
    backAnswer:
      'Mọi mũi tên phụ thuộc (`import`) phải luôn hướng từ ngoài vào trong (**Infrastructure / Web $\\rightarrow$ Application / Use Cases $\\rightarrow$ Domain**):\n1. **Domain Layer**: Chứa các thực thể và quy tắc nghiệp vụ cốt lõi viết bằng Python thuần (`@dataclass`) và định nghĩa các cổng giao tiếp trừu tượng (**Ports**) bằng **`typing.Protocol`** (ví dụ `class OrderRepository(Protocol):`). Hoàn toàn không import SQLAlchemy hay FastAPI!\n2. **Infrastructure / Adapters Layer**: Chứa các class triển khai cụ thể (`SqlAlchemyOrderRepository`, `StripePaymentAdapter`) cắm vào các `Protocol` đó. Nhờ vậy bạn có thể test toàn bộ nghiệp vụ với `InMemoryOrderRepository` trong **0.01 giây** mà không cần bật Database!',
    backAnalogy:
      'Bộ não nghiệp vụ (`Domain`) chỉ định nghĩa ổ cắm chuẩn 3 chấu (`typing.Protocol`); bên ngoài muốn cắm điện lưới (`PostgreSQL`), máy phát (`SQLite`) hay pin dự phòng (`InMemoryFake` khi test) đều khớp ngay mà không phải mổ bộ não ra sửa.',
    codeSnippet: `from typing import Protocol

# Trong domain/ports.py (Thuần Python, không phụ thuộc ORM):
class UserRepositoryPort(Protocol):
    async def get_by_id(self, user_id: int) -> dict | None:
        ...`,
    relatedTermIds: ['concept-type-hints', 'stdlib-dataclasses'],
  },
  {
    id: 'fc-295',
    stageId: 'stage-6',
    level: 'pro',
    category: 'Docker hóa Ứng dụng Python Hiện đại',
    frontQuestion: 'Làm thế nào để tối ưu hóa `Dockerfile` cho dự án Python dùng `uv` (Multi-stage build + Layer Caching) giúp giảm thời gian build từ 3 phút xuống 5 giây và giảm kích thước image từ 1GB xuống ~120MB?',
    frontHint: 'Copy `pyproject.toml` + `uv.lock` và chạy `uv sync --frozen --no-install-project --no-dev` TRƯỚC khi copy thư mục mã nguồn `src/`!',
    backAnswer:
      '3 kỹ thuật vàng khi viết `Dockerfile` cho Python:\n1. **Tách bước cài thư viện trước khi copy code**: Chỉ `COPY pyproject.toml uv.lock ./` rồi chạy `uv sync --frozen --no-install-project --no-dev`. Nhờ đó khi bạn sửa code trong `src/` mà không đổi thư viện, Docker tái sử dụng 100% layer cache chứa `.venv`, build lại chỉ mất vài giây!\n2. **Multi-stage Build**: Dùng image builder để biên dịch các gói C/Rust, sau đó chỉ copy thư mục `.venv/` và `src/` sang image `python:3.12-slim` sạch sẽ.\n3. Luôn đặt biến môi trường `PYTHONUNBUFFERED=1` và chạy bằng non-root user.',
    backAnalogy:
      'Đổ móng và lắp sẵn hệ thống khung kệ (`.venv` từ `uv.lock`) vào một tầng cố định; mỗi ngày chỉ thay đổi hàng hóa (`src/`) ở tầng trên mà không bao giờ phải đập móng xây lại.',
    codeSnippet: `# Tối ưu Layer Caching trong Dockerfile với uv:
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev
COPY src/ ./src/
RUN uv sync --frozen --no-dev`,
    relatedTermIds: ['tool-uv', 'tool-pyproject-toml'],
  },

  // ============================================================================
  // STAGE 7: DATA ENGINEERING (POLARS/DUCKDB/ARROW), AI/LLM & PROFILING (fc-296 -> fc-320)
  // ============================================================================
  {
    id: 'fc-296',
    stageId: 'stage-7',
    level: 'advanced',
    category: 'Khoa học Dữ liệu & Vectorization (SIMD)',
    frontQuestion: 'Tại sao phép cộng hai mảng 10 triệu số bằng **Vectorization (`a + b` trong NumPy / Polars)** lại nhanh hơn vòng lặp `for` thuần của Python từ **50 đến 200 lần**?',
    frontHint: 'Loại bỏ hoàn toàn chi phí kiểm tra kiểu động ở từng bước lặp PVM + Mảng C liên tiếp trên RAM + Tập lệnh SIMD của CPU.',
    backAnswer:
      'Trong vòng lặp `for` của Python thuần, ở mỗi phần tử (10 triệu lần!), máy ảo PVM phải giải tham chiếu con trỏ `PyObject*`, kiểm tra kiểu dữ liệu động, tìm hàm `__add__` và cấp phát một đối tượng `int` 28-byte mới trên Heap. Ngược lại, **Vectorization** đẩy toàn bộ phép tính xuống vòng lặp C/Rust chạy trên một **dải số nguyên 64-bit liền kề trong RAM**, cho phép CPU kích hoạt tập lệnh **SIMD (Single Instruction, Multiple Data — AVX2/NEON)** cộng 4–8 con số chỉ trong **1 chu kỳ xung nhịp CPU duy nhất**!',
    backAnalogy:
      'Vòng lặp `for` Python là nhân viên bưu điện mở từng phong bì một ra kiểm tra rồi đóng vào phong bì mới (10 triệu lần); Vectorization SIMD là máy dập công nghiệp đóng dấu 8 sản phẩm cùng lúc trên băng chuyền liền mạch.',
    codeSnippet: `import numpy as np

prices = np.array([100.0, 200.0, 350.0])
# Phép tính Vector hóa chạy thẳng ở tầng C/SIMD không có vòng lặp Python:
with_vat = prices * 1.1`,
    relatedTermIds: ['concept-cpython'],
  },
  {
    id: 'fc-297',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Data Engineering (`Polars` Lazy Evaluation)',
    frontQuestion: 'Chế độ **Lazy Evaluation (`pl.scan_parquet` / `.lazy()` $\\rightarrow$ `.collect()`)** trong `Polars` kích hoạt hai tối ưu hóa **Predicate Pushdown** và **Projection Pushdown** như thế nào?',
    frontHint: 'Đẩy điều kiện lọc dòng (`filter`) và chọn cột (`select`) xuống ngay tầng đọc file trước khi nạp dữ liệu vào RAM!',
    backAnswer:
      'Trong Pandas truyền thống (`pd.read_parquet("10gb.parquet")`), toàn bộ 50 cột và 100 triệu dòng bị nạp hết vào làm tràn RAM rồi bạn mới lọc lấy 2 cột và 1.000 dòng. Với **Polars LazyFrame (`pl.scan_parquet(...)`)**, Polars chưa đọc file ngay mà xây dựng một **Query Plan** để bộ tối ưu hóa (Query Optimizer) phân tích:\n1. **Projection Pushdown**: Chỉ đọc đúng 2 cột cần dùng từ đĩa.\n2. **Predicate Pushdown**: Đẩy điều kiện `.filter(pl.col("country") == "VN")` xuống tận tầng đọc Parquet để bỏ qua ngay các khối dữ liệu không khớp mà không cần nạp vào RAM!',
    backAnalogy:
      'Thay vì chở cả 100 tấn quặng từ mỏ về nhà máy rồi mới sàng lấy 1kg vàng (Eager), bạn gửi tiêu chuẩn lọc xuống thẳng cửa mỏ (`scan_parquet`) để chỉ chở đúng 1kg vàng tinh khiết về (Lazy Pushdown).',
    codeSnippet: `import polars as pl

# Xây dựng kế hoạch truy vấn tối ưu (Projection + Predicate Pushdown):
q = (
    pl.scan_parquet("sales_2026.parquet")
    .filter(pl.col("region") == "VN")
    .select(["order_id", "amount"])
)
# Chỉ khi gọi .collect() Polars mới thực thi kế hoạch đã tối ưu trên đa nhân CPU:
# df = q.collect()`,
    relatedTermIds: ['eco-polars'],
  },
  {
    id: 'fc-298',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Data Engineering (`Polars` Window Expressions)',
    frontQuestion: 'Biểu thức cửa sổ **`pl.col("revenue").sum().over("department")`** trong Polars giải quyết bài toán phân tích dữ liệu gì mà không làm thu gọn số dòng như `.group_by()`?',
    frontHint: 'Tương đương với mệnh đề `SUM(revenue) OVER (PARTITION BY department)` trong SQL!',
    backAnswer:
      'Khi dùng `.group_by("department").agg(...)`, bảng dữ liệu bị gom thu nhỏ lại chỉ còn số dòng bằng số phòng ban. Nhưng rất nhiều khi bạn muốn **giữ nguyên từng dòng nhân viên** và tính thêm cột "Tỷ trọng doanh thu của nhân viên đó so với tổng phòng ban của họ". Biểu thức **`.over("department")`** trong Polars tính toán song song trên từng nhóm rồi gắn kết quả ngay trên từng dòng gốc chỉ trong 1 dòng code cực kỳ thanh lịch!',
    backAnalogy:
      'Vừa giữ nguyên bảng điểm của từng học sinh trong trường, vừa in kèm điểm trung bình của lớp học sinh đó ngay bên cạnh để so sánh trực tiếp.',
    codeSnippet: `import polars as pl

df = pl.DataFrame({
    "dept": ["IT", "IT", "Sales"],
    "salary": [2000, 3000, 2500],
})
# Tính tỷ lệ lương của từng người so với tổng quỹ lương phòng ban đó:
res = df.with_columns(
    dept_share=(pl.col("salary") / pl.col("salary").sum().over("dept")).round(2)
)`,
    relatedTermIds: ['eco-polars'],
  },
  {
    id: 'fc-299',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Data Engineering (`DuckDB` & Apache Arrow)',
    frontQuestion: '`DuckDB` là gì và tại sao nó có thể chạy câu lệnh SQL phân tích trực tiếp trên biến `df` của Pandas/Polars hoặc file `.parquet` mà **không tốn thời gian copy dữ liệu (Zero-Copy)**?',
    frontHint: 'Cơ sở dữ liệu OLAP cột nhúng trong tiến trình (In-process OLAP) giao tiếp qua chuẩn bộ nhớ cột **Apache Arrow**.',
    backAnswer:
      'Nếu SQLite là cơ sở dữ liệu nhúng theo dòng (Row-oriented OLTP), thì **`DuckDB`** là cơ sở dữ liệu phân tích theo cột (**Columnar OLAP**) chạy ngay bên trong tiến trình Python mà không cần cài server riêng. Vì cả `DuckDB`, `Polars` và `Pandas 2.0+` đều hỗ trợ chuẩn bố trí bộ nhớ cột **Apache Arrow**, khi bạn viết `duckdb.sql("SELECT dept, AVG(salary) FROM df GROUP BY dept")`, DuckDB đọc thẳng vào địa chỉ RAM của biến Python `df` (**Zero-Copy**) và trả kết quả về trong vài mili-giây!',
    backAnalogy:
      'Apache Arrow là khổ container tiêu chuẩn quốc tế: cần cẩu của `Polars`, `Pandas` và `DuckDB` đều gắp chung một thùng container trên RAM mà không bao giờ phải dỡ hàng ra đóng sang thùng khác.',
    codeSnippet: `# DuckDB đọc trực tiếp biến DataFrame 'df' của Python bằng SQL chuẩn:
# import duckdb
# result = duckdb.sql("SELECT dept, SUM(salary) AS total FROM df GROUP BY dept").pl()`,
    relatedTermIds: ['eco-polars'],
  },
  {
    id: 'fc-300',
    stageId: 'stage-7',
    level: 'advanced',
    category: 'Data Engineering (Định dạng Parquet vs CSV)',
    frontQuestion: 'Tại sao trong các đường ống dữ liệu (Data Pipelines) chuyên nghiệp, định dạng **Apache Parquet** luôn được ưu tiên thay thế cho **CSV**?',
    frontHint: 'Lưu trữ theo cột (Columnar) + Nén Snappy/Zstd giảm 80% dung lượng + Bảo toàn 100% kiểu dữ liệu Schema.',
    backAnswer:
      'File **CSV** có 3 nhược điểm lớn: (1) Mất sạch thông tin kiểu dữ liệu (mọi thứ đều biến thành chữ, đọc lại rất dễ sai ngày tháng hoặc mất số `0` ở đầu mã bưu điện); (2) Lưu theo dòng nên muốn tính tổng 1 cột cũng phải đọc cả 100 cột; (3) Dung lượng văn bản thô rất nặng. Ngược lại, **Parquet** là định dạng nhị phân **lưu trữ theo cột (Columnar)** có lưu kèm **Schema kiểu dữ liệu chặt chẽ**, thống kê `min/max` từng khối để lọc nhanh và nén dung lượng nhỏ hơn CSV từ **5 đến 10 lần**!',
    backAnalogy:
      'CSV là tờ giấy viết tay mọi thứ lẫn lộn không ghi chú kiểu dữ liệu; Parquet là tủ hồ sơ phân loại theo từng cột chuyên biệt, có nén chân không và dán nhãn chỉ mục đầy đủ.',
    codeSnippet: `# Luôn ưu tiên lưu trữ trung gian bằng Parquet thay vì CSV:
# df.write_parquet("clean_orders.parquet", compression="zstd")`,
    relatedTermIds: ['eco-polars'],
  },
  {
    id: 'fc-301',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Data Quality & Kiểm chứng Bảng (`Pandera`)',
    frontQuestion: 'Nếu `Pydantic` dùng để kiểm chứng từng bản ghi JSON/Object đơn lẻ, thì công cụ nào dùng để kiểm chứng chất lượng dữ liệu trên toàn bộ **DataFrame (Polars / Pandas)** ở tốc độ vector hóa?',
    frontHint: 'Thư viện `Pandera` (`pa.DataFrameModel`) định nghĩa Schema cột, miền giá trị và kiểm tra thống kê cho bảng dữ liệu.',
    backAnswer:
      'Khi xử lý bảng 5 triệu dòng, nếu dùng vòng lặp đẩy từng dòng qua `Pydantic` sẽ rất chậm. Thư viện **`Pandera`** cho phép định nghĩa Schema kiểu Class (`pa.DataFrameModel`) để kiểm tra kiểu dữ liệu cột, giá trị `null`, miền giá trị (`ge=0`, `isin=[...]`) và cả các giả thuyết thống kê trực tiếp bằng **các phép toán Vector hóa trên Polars/Pandas** ở ranh giới đầu vào/đầu ra của các bước ETL.',
    backAnalogy:
      '`Pydantic` là nhân viên an ninh soi từng hành khách đi lẻ qua cổng; còn `Pandera` là cổng quét tia X công nghiệp quét nguyên cả toa tàu hàng triệu kiện cùng một lúc.',
    codeSnippet: `# Kiểm tra chất lượng dữ liệu DataFrame ngay trong đường ống ETL:
# assert (df["amount"] >= 0).all(), "Phát hiện giao dịch có số tiền âm!"`,
    relatedTermIds: ['eco-polars', 'eco-pydantic'],
  },
  {
    id: 'fc-302',
    stageId: 'stage-7',
    level: 'pro',
    category: 'AI & LLM Engineering (Structured Outputs)',
    frontQuestion: 'Làm thế nào để bắt buộc các mô hình ngôn ngữ lớn (LLM như Gemini, GPT-4o, Claude) luôn trả về **đúng cấu trúc dữ liệu hợp lệ 100%** thay vì trả về đoạn văn bản tự do dễ gãy khi `json.loads()`?',
    frontHint: 'Truyền trực tiếp class `Pydantic BaseModel` vào `response_schema` / `response_format` (hoặc dùng thư viện `Instructor` / `PydanticAI`).',
    backAnswer:
      'Thay vì viết prompt van xin LLM *"Hãy chỉ trả về JSON, đừng viết thêm lời dẫn"*, chuẩn AI Engineering hiện đại truyền trực tiếp một **`Pydantic BaseModel`** vào tham số `response_schema` (Gemini SDK) hoặc `response_format` (OpenAI SDK) hoặc qua thư viện **`Instructor` / `PydanticAI`**. Hệ thống sẽ dùng **Constrained Decoding (Guided Generation)** khóa bộ sinh token của LLM theo đúng JSON Schema của Pydantic và tự động validate/retry nếu giá trị không thỏa mãn `@field_validator`!',
    backAnalogy:
      'Thay vì đưa tờ giấy trắng bảo ứng viên tự viết sơ yếu lý lịch, bạn đưa một biểu mẫu điện tử có khóa ô (`Pydantic BaseModel`) bắt buộc điền đúng từng trường mới bấm nộp được.',
    codeSnippet: `from pydantic import BaseModel, Field

class SentimentResult(BaseModel):
    label: str = Field(pattern="^(positive|neutral|negative)$")
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str`,
    relatedTermIds: ['eco-pydantic'],
  },
  {
    id: 'fc-303',
    stageId: 'stage-7',
    level: 'pro',
    category: 'AI & LLM Engineering (Streaming SSE)',
    frontQuestion: 'Trong FastAPI, làm thế nào để truyền từng từ (Token Streaming) từ LLM về giao diện người dùng theo thời gian thực bằng giao thức **Server-Sent Events (SSE)**?',
    frontHint: 'Kết hợp `AsyncGenerator` (`yield f"data: {json_chunk}\\n\\n"`) với `StreamingResponse(media_type="text/event-stream")`.',
    backAnswer:
      'Nếu đợi LLM sinh xong cả bài văn 1.000 từ mới trả về HTTP Response thông thường, người dùng phải nhìn màn hình quay vòng suốt 15 giây (Time-to-First-Byte rất tệ). Với **Server-Sent Events (SSE)**, bạn viết một hàm **Async Generator (`async def token_stream():`)** `yield` từng mảnh dữ liệu theo định dạng chuẩn **`data: {...}\\n\\n`** (kết thúc bằng 2 dấu xuống dòng) và trả về qua **`StreamingResponse(token_stream(), media_type="text/event-stream")`** để chữ hiện ra mượt mà ngay từ 0.2 giây đầu tiên!',
    backAnalogy:
      'Thay vì đợi đầu bếp làm xong toàn bộ 10 món mới bưng ra một lượt, nhà hàng dùng băng chuyền (`text/event-stream`) đưa từng đĩa vừa làm xong ra bàn ngay lập tức.',
    codeSnippet: `import json
from fastapi.responses import StreamingResponse

async def sse_generator(chunks: list[str]):
    for token in chunks:
        # Chuẩn giao thức SSE bắt buộc có 'data: ...\\n\\n'
        yield f"data: {json.dumps({'token': token}, ensure_ascii=False)}\\n\\n"
    yield "data: [DONE]\\n\\n"`,
    relatedTermIds: ['eco-fastapi', 'stdlib-asyncio', 'kw-yield'],
  },
  {
    id: 'fc-304',
    stageId: 'stage-7',
    level: 'master',
    category: 'AI & RAG Architecture (Hybrid Search & Reranking)',
    frontQuestion: 'Trong hệ thống **RAG (Retrieval-Augmented Generation)** thực tế, tại sao chỉ dùng tìm kiếm Vector (**Semantic Search**) lại hay tìm sai các mã sản phẩm/tên riêng, và kiến trúc **Hybrid Search + Cross-Encoder Reranker** khắc phục điều này như thế nào?',
    frontHint: 'Kết hợp Vector Search (hiểu ngữ nghĩa) + BM25 (khớp từ khóa chính xác) trộn qua công thức `RRF` rồi chấm điểm lại bằng Reranker!',
    backAnswer:
      '1. **Điểm mù của Vector Embedding**: Vector nén toàn bộ câu thành một mảng số thực biểu diễn "ý nghĩa khái quát", nên rất kém khi người dùng tìm chính xác mã lỗi `"ERR-4092"`, số hợp đồng hay tên thuốc đặc thù.\n2. **Hybrid Search**: Chạy song song **Vector Search** (bắt ngữ nghĩa tương đồng) và **BM25 Full-Text Search** (bắt từ khóa chính xác), sau đó gộp 2 bảng xếp hạng bằng thuật toán **Reciprocal Rank Fusion (`RRF`)** lấy ra Top 25 đoạn văn.\n3. **Cross-Encoder Reranking**: Đưa 25 đoạn đó qua mô hình Reranker chấm điểm đối chiếu trực tiếp `(Query, Document)` để lọc ra **Top 5 đoạn chính xác nhất** đưa vào контекст của LLM.',
    backAnalogy:
      'Vector Search là chuyên gia hiểu ý đại khái, BM25 là máy soi đúng từng chữ cái mã số; cả hai cùng chọn ra 25 hồ sơ ứng viên (`RRF`), rồi Giám khảo trưởng (`Reranker`) đọc kỹ 25 hồ sơ đó chọn ra 5 hồ sơ xuất sắc nhất.',
    codeSnippet: `# Công thức Reciprocal Rank Fusion (RRF) gộp kết quả Vector & BM25 (k=60):
def rrf_score(rank_vector: int, rank_bm25: int, k: int = 60) -> float:
    return (1.0 / (k + rank_vector)) + (1.0 / (k + rank_bm25))`,
    relatedTermIds: ['stdlib-asyncio'],
  },
  {
    id: 'fc-305',
    stageId: 'stage-7',
    level: 'pro',
    category: 'AI & RAG Architecture (Chunking Strategies)',
    frontQuestion: 'Tại sao khi cắt tài liệu làm RAG (Chunking), việc cắt cứng cứ đúng 500 ký tự một đoạn (`text[i:i+500]`) lại làm giảm chất lượng câu trả lời nghiêm trọng? Giải pháp **Recursive Character / Semantic Chunking có `chunk_overlap`** là gì?',
    frontHint: 'Cắt đứt đôi câu văn hoặc tách tiêu đề bảng ra khỏi nội dung bảng; `overlap` giữ ngữ cảnh nối tiếp ở rìa hai đoạn.',
    backAnswer:
      'Cắt cứng theo số ký tự sẽ chém đứt đôi câu văn hoặc làm câu sau mất chủ ngữ nằm ở câu trước (ví dụ câu trước nói *"Thuốc X có tác dụng phụ..."*, câu sau nằm ở chunk mới chỉ còn *"Tuyệt đối không dùng cho trẻ em"* — mất hoàn toàn tên thuốc X!). Giải pháp chuẩn:\n1. **Recursive / Markdown Structure Splitting**: Ưu tiên cắt theo ranh giới tự nhiên từ lớn đến nhỏ (`\\n## ` $\\rightarrow$ `\\n\\n` đoạn văn $\\rightarrow$ `. ` câu).\n2. **Chunk Overlap (10%–15%)**: Giữ lại 50–100 token cuối của đoạn trước lặp lại ở đầu đoạn sau kèm **Contextual Header** (tiêu đề chương/mục) gắn vào mỗi chunk.',
    backAnalogy:
      'Khi chụp ảnh bản đồ dài thành nhiều tấm nhỏ, luôn phải chụp gối đầu chồng lấn 15% mép ảnh trước sang ảnh sau (`chunk_overlap`) và ghi tên Tỉnh/Thành phố ở góc mọi tấm ảnh để không bị lạc phương hướng.',
    codeSnippet: `def chunk_with_overlap(tokens: list[str], size: int = 200, overlap: int = 30) -> list[list[str]]:
    step = size - overlap
    return [tokens[i : i + size] for i in range(0, len(tokens), step)]`,
    relatedTermIds: ['type-list'],
  },
  {
    id: 'fc-306',
    stageId: 'stage-7',
    level: 'master',
    category: 'AI Agents & Tool Calling Guardrails',
    frontQuestion: 'Khi xây dựng một **AI Agent** có khả năng tự gọi hàm (Tool Calling / Function Calling) trong vòng lặp `while`, những chốt chặn an toàn (**Guardrails**) nào là bắt buộc phải có trên Production?',
    frontHint: 'Giới hạn `max_iterations` chống lặp vô tận, `timeout` tổng, kiểm chứng tham số Tool bằng Pydantic, và Human-in-the-Loop cho hành động nhạy cảm!',
    backAnswer:
      'Một vòng lặp Agent không có chốt chặn có thể rơi vào vòng lặp gọi Tool vô tận đốt sạch hàng nghìn USD tiền token chỉ trong vài phút! 4 chốt chặn bắt buộc:\n1. **`max_steps` / `max_iterations`** (ví dụ tối đa 8–10 bước suy luận cho 1 yêu cầu) và ngân sách `max_tokens`.\n2. **Validation & Sandbox**: Mọi đối số JSON do LLM sinh ra phải đi qua `Pydantic` trước khi truyền vào hàm Python, và không bao giờ dùng `eval()` / `subprocess(shell=True)`.\n3. **Timeout ở từng lệnh gọi Tool** (`async with asyncio.timeout(10):`).\n4. **Human-in-the-Loop Confirmation** cho các thao tác ghi/xóa/chuyển tiền.',
    backAnalogy:
      'Giao thẻ ngân hàng phụ cho trợ lý AI đi mua sắm: bắt buộc khóa hạn mức chi tiêu tối đa (`max_tokens`), số cửa hàng tối đa được ghé (`max_steps`), và đơn hàng trên 5 triệu phải nhắn tin xin chữ ký chủ thẻ (`Human-in-the-loop`).',
    codeSnippet: `MAX_AGENT_STEPS = 8
for step in range(1, MAX_AGENT_STEPS + 1):
    # Gọi LLM -> Nếu không còn tool_calls thì trả kết quả thoát vòng lặp
    ...
else:
    raise RuntimeError("Agent vượt quá số bước suy luận tối đa cho phép!")`,
    relatedTermIds: ['kw-for', 'kw-else', 'eco-pydantic'],
  },
  {
    id: 'fc-307',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Profiling & Tối ưu Hiệu năng (`py-spy` vs `cProfile`)',
    frontQuestion: 'Sự khác biệt giữa **Deterministic Profiler (`cProfile`)** và **Sampling Profiler (`py-spy` / `Scalene`)** là gì? Tại sao khi gỡ lỗi một tiến trình Python đang bị treo 100% CPU trên Production, người ta luôn dùng `py-spy`?',
    frontHint: '`py-spy` viết bằng Rust đọc bộ nhớ tiến trình từ bên ngoài với chi phí ~0% và tạo biểu đồ lửa (Flamegraph) mà không cần sửa code hay khởi động lại server!',
    backAnswer:
      '- **`cProfile`** (có sẵn trong Stdlib): Gắn móc (hook) vào **mọi lần gọi hàm** trong Python. Rất chi tiết trong môi trường Dev nhưng làm chương trình chạy chậm đi đáng kể (overhead 20%–50%) và phải bật trước từ trong code.\n- **`py-spy`** (Sampling Profiler viết bằng Rust): Hoạt động bên ngoài tiến trình bằng cách chụp nhanh ngăn xếp lệnh (Stack trace) của PID mục tiêu 100 lần/giây. Nó có **overhead gần bằng 0%**, cho phép gắn trực tiếp vào một tiến trình đang chạy đơ trên Production (`py-spy top --pid 12345` hoặc xuất `flamegraph.svg`) mà không cần dừng server!',
    backAnalogy:
      '`cProfile` là đặt trạm kiểm soát bắt mọi nhân viên ký sổ mỗi khi bước qua cửa (làm chậm công việc); `py-spy` là camera quan sát từ trên cao chụp ảnh toàn xưởng mỗi giây mà không làm phiền bất kỳ ai đang làm việc.',
    codeSnippet: `# Xuất biểu đồ lửa (Flamegraph) để tìm điểm nghẽn CPU nhanh nhất:
# $ uvx py-spy record -o profile.svg -- python main.py
# Hoặc soi trực tiếp tiến trình đang chạy theo thời gian thực:
# $ uvx py-spy top --pid 12345`,
    relatedTermIds: ['concept-cpython'],
  },
  {
    id: 'fc-308',
    stageId: 'stage-7',
    level: 'master',
    category: 'Memory Profiling (`tracemalloc` & `Memray`)',
    frontQuestion: 'Làm thế nào để phát hiện chính xác dòng code nào đang gây **Rò rỉ bộ nhớ (Memory Leak)** trong ứng dụng Python bằng module chuẩn `tracemalloc` hoặc công cụ `Memray` (của Bloomberg)?',
    frontHint: 'Chụp 2 bản Snapshot bộ nhớ tại thời điểm $T_1$ và $T_2$ rồi gọi `snapshot2.compare_to(snapshot1, "lineno")`!',
    backAnswer:
      '1. **Với `tracemalloc` (Thư viện chuẩn có sẵn)**: Gọi `tracemalloc.start()`, chụp `snap1 = tracemalloc.take_snapshot()` trước khi chạy luồng nghi ngờ và `snap2 = tracemalloc.take_snapshot()` sau khi chạy 1.000 request, rồi dùng **`snap2.compare_to(snap1, "lineno")`** để in ra chính xác file và dòng code nào đang tích tụ nhiều đối tượng không giải phóng nhất.\n2. **Với `Memray`**: Theo dõi được cả bộ nhớ cấp phát trong **Python thuần lẫn bên trong các thư viện C/C++ (`malloc`/`free`)** và sinh báo cáo Flamegraph trực quan.',
    backAnalogy:
      'Kiểm toán kho hàng ở đầu ca (`snap1`) và cuối ca (`snap2`), đối chiếu chênh lệch theo từng kệ hàng (`compare_to`) để chỉ mặt điểm tên kệ nào chỉ nhập vào mà không bao giờ xuất ra.',
    codeSnippet: `import tracemalloc

tracemalloc.start()
snap1 = tracemalloc.take_snapshot()
leaky_cache = [bytearray(10_000) for _ in range(100)]
snap2 = tracemalloc.take_snapshot()

for stat in snap2.compare_to(snap1, "lineno")[:1]:
    print(stat)  # Chỉ chính xác dòng code và số KB bộ nhớ tăng thêm!`,
    relatedTermIds: ['concept-gc'],
  },
  {
    id: 'fc-309',
    stageId: 'stage-7',
    level: 'master',
    category: 'Tăng tốc Python bằng Rust (`PyO3` & `Maturin`)',
    frontQuestion: 'Khi một hàm thuật toán cốt lõi trong Python đã tối ưu hết mức nhưng vẫn là nút cổ chai CPU, bộ đôi **`PyO3` + `Maturin`** giúp viết module mở rộng bằng **Rust** và nhả GIL (`py.allow_threads`) như thế nào?',
    frontHint: 'Chính là kiến trúc đằng sau `pydantic-core`, `polars`, `ruff`, `orjson`, `cryptography`!',
    backAnswer:
      'Thay vì viết C-extension dễ bị lỗi tràn bộ nhớ (`Segmentation fault`), hệ sinh thái Python hiện đại dùng **`PyO3`** (thư viện Rust tạo binding cho Python) kết hợp với trình đóng gói **`Maturin`** (`uvx maturin develop`). Bạn chỉ cần gắn macro `#[pyfunction]` lên hàm Rust là gọi được trực tiếp từ Python với tốc độ mã máy và an toàn bộ nhớ tuyệt đối. Đặc biệt, gọi **`py.allow_threads(|| { ... })`** trong Rust sẽ **nhả GIL** để hàm Rust chạy song song 100% trên mọi nhân CPU!',
    backAnalogy:
      'Giữ nguyên phòng điều khiển trung tâm bằng Python thân thiện, nhưng thay thế chiếc tua-bin quay tay chậm chạp bằng động cơ phản lực đúc bằng hợp kim Rust (`PyO3`).',
    codeSnippet: `// Ví dụ hàm Rust gắn vào Python qua PyO3:
// #[pyfunction]
// fn sum_squares(py: Python<'_>, nums: Vec<i64>) -> i64 {
//     py.allow_threads(|| nums.iter().map(|x| x * x).sum())
// }`,
    relatedTermIds: ['concept-gil', 'concept-cpython'],
  },
  {
    id: 'fc-310',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Tối ưu Thuật toán & Cấu trúc Dữ liệu',
    frontQuestion: 'Tại sao việc kiểm tra `if item in visited:` khi `visited` là một `list` bên trong vòng lặp duyệt $N$ phần tử lại biến thuật toán từ **$O(N)$ thành $O(N^2)$** làm treo ứng dụng khi $N = 100.000$?',
    frontHint: '100.000 phần tử $\\times$ 100.000 bước quét `list` = 10 tỷ phép so sánh; đổi `visited = set()` giảm xuống chỉ còn 100.000 bước!',
    backAnswer:
      'Toán tử `x in my_list` phải quét tuần tự từ đầu đến cuối danh sách tốn **$O(N)$**. Đặt nó bên trong một vòng lặp $N$ phần tử sẽ tạo ra độ phức tạp bậc hai **$O(N^2)$**: với $N = 100.000$, máy tính phải thực hiện tới **5–10 tỷ phép so sánh** (mất hàng chục giây)! Chỉ cần đổi `visited` từ `list` sang **`set`** (`visited = set()`), mỗi lần kiểm tra `x in visited` dùng bảng băm chỉ tốn **$O(1)$**, rút ngắn tổng thời gian chạy từ 30 giây xuống còn **0.01 giây**!',
    backAnalogy:
      'Mỗi khi có 1 khách mới đến (`for`), thay vì đọc dò lại từ dòng đầu đến dòng cuối cuốn sổ 100.000 tên (`list`), bạn tra ngay theo vần chữ cái trên bảng băm điện tử (`set`) mất đúng 1 nhịp.',
    codeSnippet: `# ❌ CHẬM O(N^2): Treo máy khi danh sách lớn!
# seen = []
# for x in large_stream:
#     if x not in seen: seen.append(x)

# ✅ NHANH O(N) ( Bảo toàn cả thứ tự xuất hiện ban đầu!):
unique_ordered = list(dict.fromkeys(large_stream))`,
    relatedTermIds: ['type-set', 'type-dict', 'type-list'],
  },
  {
    id: 'fc-311',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Xử lý JSON Hiệu năng Cao (`orjson` / `msgspec`)',
    frontQuestion: 'Khi xây dựng dịch vụ API hoặc Data Pipeline xử lý hàng chục nghìn bản tin JSON mỗi giây, tại sao người ta dùng `orjson` hoặc `msgspec` thay cho module `json` chuẩn?',
    frontHint: 'Nhanh hơn `json` chuẩn từ 6x đến 15x, trả về thẳng `bytes` và tự động serialize được cả `datetime`, `UUID`, `dataclass`, `NumPy`!',
    backAnswer:
      'Module `json` chuẩn của Python trả về chuỗi `str` (sau đó web server lại phải `.encode("utf-8")` sang `bytes` để gửi qua socket) và báo lỗi `TypeError: Object of type datetime is not JSON serializable` nếu gặp `datetime`, `UUID` hay `dataclass`. **`orjson`** (viết bằng Rust) và **`msgspec`** (viết bằng C) xuất thẳng ra **`bytes`**, tận dụng lệnh SIMD của CPU để đạt tốc độ nhanh gấp **6–15 lần**, và hỗ trợ sẵn việc tuần tự hóa `datetime` chuẩn ISO-8601, `UUID`, `dataclass` mà không cần viết hàm chuyển đổi thủ công.',
    backAnalogy:
      'Module `json` chuẩn là đóng gói thủ công rồi mới dán nhãn chuyển thành kiện hàng byte; `orjson` / `msgspec` là dây chuyền tự động đóng thẳng thành kiện byte hoàn chỉnh kèm cả tem ngày giờ chuẩn.',
    codeSnippet: `# Với FastAPI, bạn có thể dùng ORJSONResponse cho các API trả JSON lớn:
# from fastapi.responses import ORJSONResponse
# app = FastAPI(default_response_class=ORJSONResponse)`,
    relatedTermIds: ['stdlib-json', 'eco-fastapi'],
  },
  {
    id: 'fc-312',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Streaming ETL & Xử lý File Khổng lồ',
    frontQuestion: 'Nếu máy chủ chỉ có **512MB RAM** nhưng bạn phải xử lý, lọc và biến đổi một file dữ liệu nặng **20GB**, kiến trúc **Generator Pipeline** trong Python giúp bạn hoàn thành công việc với chỉ ~10MB RAM như thế nào?',
    frontHint: 'Kết nối chuỗi các hàm `yield` (Đọc từng dòng -> Parse -> Lọc -> Ghi ra luồng đích) mà không bao giờ gọi `list()` hay `.read()` toàn bộ!',
    backAnswer:
      'Bí quyết là biến toàn bộ quy trình thành một **Đường ống Lười biếng (Lazy Generator Pipeline)**:\n1. Hàm 1 mở file và `yield` từng dòng (hoặc đọc theo từng lô `itertools.batched(f, 5000)`).\n2. Hàm 2 nhận generator từ Hàm 1, lọc các bản ghi hợp lệ và `yield` bản ghi đã biến đổi.\n3. Hàm 3 kéo từng lô từ Hàm 2 để ghi xuống đĩa hoặc bulk-insert vào Database.\nTại bất kỳ thời điểm nào trên RAM cũng **chỉ tồn tại đúng 1 dòng hoặc 1 lô nhỏ (vài MB)**, nên file nặng 20GB hay 200GB đều chạy êm ru trên container 512MB RAM!',
    backAnalogy:
      'Dùng đường ống dẫn nước lọc chảy liên tục qua các lõi lọc từ bồn chứa 20.000 lít sang bể chứa sạch, thay vì cố bê nguyên bồn nước 20 tấn đặt lên bàn bếp nhỏ.',
    codeSnippet: `from collections.abc import Iterable, Iterator
from pathlib import Path

def read_lines(path: Path) -> Iterator[str]:
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            yield line.strip()

def filter_errors(lines: Iterable[str]) -> Iterator[str]:
    return (line for line in lines if line.startswith("ERROR:"))`,
    relatedTermIds: ['kw-yield', 'stdlib-pathlib'],
  },
  {
    id: 'fc-313',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Bảo mật & Chống Pickle RCE',
    frontQuestion: 'Tại sao tài liệu chính thức của Python luôn cảnh báo đỏ: **"Tuyệt đối KHÔNG bao giờ gọi `pickle.loads()` trên dữ liệu nhận từ người dùng hoặc nguồn không tin cậy"**?',
    frontHint: 'Phương thức `__reduce__()` trong giao thức Pickle cho phép thực thi bất kỳ lệnh hệ thống nào (`os.system`) ngay trong lúc giải nén (Remote Code Execution - RCE)!',
    backAnswer:
      '`pickle` không phải là một định dạng dữ liệu thụ động như JSON, mà là một **máy ảo ngăn xếp nhỏ (Stack Machine)** có khả năng import bất kỳ module nào và gọi bất kỳ hàm nào thông qua phương thức dunder **`__reduce__()`** của đối tượng trong lúc giải nén (`pickle.loads`). Kẻ tấn công chỉ cần gửi một chuỗi byte Pickle độc hại có cài `os.system("rm -rf /")` trong `__reduce__`, ngay khi server của bạn gọi `pickle.loads(data)`, lệnh tấn công sẽ chạy ngay lập tức (**Remote Code Execution — RCE**)! Với dữ liệu từ mạng/người dùng, **luôn dùng `JSON`, `MsgPack`, `Protobuf` hoặc `Safetensors` (cho AI models)**.',
    backAnalogy:
      'Đọc JSON là đọc một tờ đơn văn bản an toàn; còn gọi `pickle.loads()` từ người lạ là mở một chiếc hộp bí ẩn có gắn sẵn ngòi nổ tự động kích hoạt ngay khi mở nắp!',
    codeSnippet: `# ❌ CỰC KỲ NGUY HIỂM (Lỗi bảo mật RCE nghiêm trọng):
# obj = pickle.loads(untrusted_bytes_from_user)

# ✅ AN TOÀN: Luôn dùng JSON + Pydantic (hoặc safetensors cho trọng số AI)
# obj = MyModel.model_validate_json(untrusted_bytes_from_user)`,
    relatedTermIds: ['eco-pydantic', 'stdlib-json'],
  },
  {
    id: 'fc-314',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Xử lý Số liệu & JIT (`Numba`)',
    frontQuestion: 'Decorator `@numba.njit` của thư viện **Numba** biến một hàm tính toán vòng lặp Python thuần trên mảng NumPy thành mã máy chạy nhanh ngang C/Fortran bằng cơ chế gì?',
    frontHint: 'Biên dịch Just-In-Time (JIT) Bytecode của hàm Python sang mã máy LLVM và có thể bật `parallel=True`, `nogil=True`!',
    backAnswer:
      'Có những thuật toán khoa học/tài chính có phụ thuộc bước trước (như mô phỏng Monte Carlo, quy hoạch động) rất khó viết dưới dạng công thức Vector hóa của NumPy mà buộc phải dùng vòng lặp `for` lồng nhau. Khi gắn **`@njit(nogil=True, parallel=True)`** của **Numba**, ngay ở lần gọi đầu tiên, Numba suy luận kiểu dữ liệu của các mảng NumPy đầu vào và dùng trình biên dịch **LLVM** để dịch toàn bộ vòng lặp Python đó thành **mã máy SIMD đa luồng nguyên bản**, chạy nhanh hơn Python thuần từ **100 đến 500 lần**!',
    backAnalogy:
      'Bạn vẫn viết công thức bằng tiếng Python quen thuộc, nhưng ngay trước khi bấm chạy, trình biên dịch LLVM (`@njit`) đúc toàn bộ hàm đó thành một con chip phần cứng chuyên dụng.',
    codeSnippet: `# Ví dụ tăng tốc vòng lặp tính toán nặng với Numba JIT:
# from numba import njit
# @njit(nogil=True)
# def monte_carlo_pi(n: int) -> float: ...`,
    relatedTermIds: ['concept-gil', 'concept-cpython'],
  },
  {
    id: 'fc-315',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Kiểm thử Nâng cao (`Hypothesis` Property-Based Testing)',
    frontQuestion: 'Kiểm thử dựa trên thuộc tính (**Property-Based Testing** với thư viện `Hypothesis`) khác gì so với viết Unit Test truyền thống với vài ví dụ cố định?',
    frontHint: 'Thay vì tự nghĩ ra 3 trường hợp `assert add(2, 3) == 5`, `Hypothesis` tự động sinh ra hàng trăm trường hợp biên quái dị (số âm cực lớn, chuỗi Unicode rỗng, `NaN`) và tự thu nhỏ (Shrinking) ví dụ gây lỗi!',
    backAnswer:
      'Khi viết Unit Test truyền thống (Example-based test), bạn thường chỉ test những trường hợp "đẹp" mà bạn nghĩ tới được. Với **`Hypothesis` (`@given(st.lists(st.integers()))`)**, bạn chỉ cần mô tả **quy luật / bất biến (Invariant)** mà hàm phải thỏa mãn (ví dụ: `decode(encode(s)) == s`), sau đó `Hypothesis` sẽ tự động tấn công hàm của bạn bằng hàng trăm bộ dữ liệu biên hiểm hóc nhất. Khi phát hiện lỗi, nó tự động chạy thuật toán **Shrinking** để rút gọn đầu vào gây lỗi về **ví dụ nhỏ nhất, đơn giản nhất** cho bạn dễ sửa!',
    backAnalogy:
      'Unit Test truyền thống là tự lái thử xe trên 2 con đường quen thuộc; `Hypothesis` là đưa xe vào phòng thử nghiệm va đập tự động với 500 địa hình khắc nghiệt nhất và chỉ ra chính xác viên sỏi nhỏ nhất làm trượt bánh xe.',
    codeSnippet: `# Ví dụ Property-based test với Hypothesis:
# from hypothesis import given, strategies as st
# @given(st.text())
# def test_roundtrip_encoding(s: str) -> None:
#     assert s.encode("utf-8").decode("utf-8") == s`,
    relatedTermIds: ['tool-pytest'],
  },
  {
    id: 'fc-316',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Kiểm thử Thời gian (`time-machine` / `freezegun`)',
    frontQuestion: 'Làm thế nào để viết Unit Test cho các hàm phụ thuộc vào thời gian hiện tại (như kiểm tra mã OTP hết hạn sau 5 phút, tính lãi suất cuối tháng) mà không phải gọi `time.sleep(300)`?',
    frontHint: 'Đóng băng và dịch chuyển đồng hồ hệ thống trong lúc chạy test bằng `time-machine` hoặc Dependency Injection `clock`!',
    backAnswer:
      'Có 2 cách chuyên nghiệp để kiểm thử logic thời gian một cách tức thì và tất định (Deterministic):\n1. **Truyền hàm lấy giờ (`now_fn`) hoặc `Clock` Protocol**: Thiết kế hàm nhận `now: datetime | None = None` để khi test truyền thẳng mốc thời gian mong muốn vào.\n2. **Dùng thư viện `time-machine` (hoặc `freezegun`)**: Bọc bài test bằng `@time_machine.travel("2026-12-31 23:59:59Z")` để đóng băng `datetime.now()` ở cấp C và tua nhanh thời gian thêm 5 phút (`traveller.shift(timedelta(minutes=5))`) chỉ trong **0.001 giây**!',
    backAnalogy:
      'Thay vì ngồi đợi 5 phút thật ngoài đời xem đồng hồ báo thức có kêu không, người thợ đồng hồ vặn kim đồng hồ nhảy tới trước 5 phút để kiểm tra ngay lập tức.',
    codeSnippet: `from datetime import datetime, timezone, timedelta

def is_token_expired(issued_at: datetime, *, now: datetime | None = None) -> bool:
    current = now or datetime.now(timezone.utc)
    return (current - issued_at) > timedelta(minutes=5)`,
    relatedTermIds: ['stdlib-datetime', 'tool-pytest'],
  },
  {
    id: 'fc-317',
    stageId: 'stage-7',
    level: 'pro',
    category: 'Tự động hóa Chất lượng Code (`pre-commit` & CI)',
    frontQuestion: 'Bộ khung kiểm soát chất lượng tự động (**Quality Gate**) tiêu chuẩn trước mỗi lần `git commit` và trên GitHub Actions CI của một dự án Python chuyên nghiệp gồm những bước nào?',
    frontHint: '`ruff check` (Linter) + `ruff format --check` (Formatter) + `pyright` / `mypy` (Type Checker) + `pytest` (Tests).',
    backAnswer:
      'Một dự án Python chuẩn Production không bao giờ dựa vào sự cẩn thận thủ công của từng cá nhân mà thiết lập **4 chốt chặn tự động** trong `pre-commit` và CI pipeline:\n1. **`uv run ruff check .`**: Bắt lỗi cú pháp, biến thừa, import lộn xộn, lỗ hổng bảo mật (`S` rules).\n2. **`uv run ruff format --check .`**: Đảm bảo 100% file tuân thủ định dạng PEP 8 đồng nhất.\n3. **`uv run pyright`** (hoặc `mypy`): Kiểm tra tĩnh toàn bộ Type Hints chống lỗi `None` / sai kiểu trước khi chạy.\n4. **`uv run pytest --cov=src`**: Chạy toàn bộ bộ test tự động.',
    backAnalogy:
      'Dây chuyền kiểm định 4 trạm trước khi xuất xưởng: Quét lỗi linh kiện (`ruff check`) $\\rightarrow$ Kiểm tra ngoại hình (`ruff format`) $\\rightarrow$ Đo khớp nối kích thước (`pyright`) $\\rightarrow$ Chạy thử nghiệm thực tế (`pytest`).',
    codeSnippet: `# Chạy trọn bộ 4 bước kiểm định chất lượng dự án chỉ trong vài giây với uv:
uv run ruff check .
uv run ruff format --check .
uv run pyright
uv run pytest`,
    relatedTermIds: ['tool-uv', 'tool-ruff', 'tool-pyright', 'tool-pytest'],
  },
  {
    id: 'fc-318',
    stageId: 'stage-7',
    level: 'master',
    category: 'Observability & OpenTelemetry',
    frontQuestion: 'Ba trụ cột của **Observability (Khả năng Quan sát Hệ thống)**: **Logs**, **Metrics**, và **Distributed Traces (OpenTelemetry)** khác nhau như thế nào khi vận hành hệ thống Python lớn?',
    frontHint: 'Metric báo "Có vấn đề!", Trace chỉ ra "Nghẽn ở dịch vụ/hàm nào!", và Log giải thích "Chi tiết lỗi tại dòng đó là gì!".',
    backAnswer:
      '- **Metrics (Prometheus)**: Các con số tổng hợp theo thời gian (RPS, tỷ lệ lỗi 5xx, độ trễ phân vị `p95`/`p99`, dung lượng RAM) — dùng để vẽ biểu đồ Dashboard và bắn cảnh báo (Alert) ngay khi hệ thống bất thường.\n- **Distributed Traces (OpenTelemetry)**: Theo dõi hành trình của 1 request đi xuyên qua API Gateway $\\rightarrow$ FastAPI $\\rightarrow$ PostgreSQL $\\rightarrow$ Redis $\\rightarrow$ Payment Service dưới dạng biểu đồ thác nước (Waterfall spans) cùng chung một `trace_id` để biết chính xác bước nào làm chậm.\n- **Structured Logs (JSON)**: Ghi nhận sự kiện chi tiết kèm `trace_id` và `request_id` để soi tận gốc nguyên nhân lỗi.',
    backAnalogy:
      'Metrics là đèn cảnh báo nhiệt độ động cơ trên táp-lô; Traces là bản đồ định vị chỉ rõ đoạn ống dẫn nào đang bị tắc; còn Logs là camera hành trình ghi lại chi tiết khoảnh khắc xảy ra va chạm.',
    codeSnippet: `# Gắn kèm trace_id và span_id vào từng bản ghi Structured JSON Log:
log_record = {
    "level": "ERROR",
    "event": "payment_gateway_timeout",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "latency_ms": 5002.4,
}`,
    relatedTermIds: ['stdlib-logging', 'eco-fastapi'],
  },
  {
    id: 'fc-319',
    stageId: 'stage-7',
    level: 'master',
    category: 'Quản lý Bộ nhớ & Cạm bẫy Cache (`@lru_cache` trên Method)',
    frontQuestion: 'Cạm bẫy rò rỉ bộ nhớ tinh vi: Tại sao gắn `@functools.lru_cache` trực tiếp lên một **phương thức của Class (Instance Method)** lại khiến các thực thể `self` không bao giờ được Garbage Collector giải phóng?',
    frontHint: 'Bộ nhớ đệm của `@lru_cache` nằm ở cấp Class và lưu cả đối số đầu tiên chính là `self` làm khóa (Key) trong từ điển cache!',
    backAnswer:
      'Khi bạn gắn `@lru_cache` lên một phương thức `def compute(self, x):`, đối số đầu tiên truyền vào hàm chính là **`self`**! Từ điển cache của `@lru_cache` gắn trên Class sẽ giữ một **tham chiếu mạnh (Strong Reference) tới mọi thực thể `self`** từng gọi phương thức đó. Hậu quả là dù bên ngoài bạn đã xóa biến `obj`, `ob_refcnt` của nó vẫn $> 0$ nên **bị rò rỉ bộ nhớ (Memory Leak) nằm lại trong RAM mãi mãi**! Giải pháp: Dùng `@functools.cached_property` (nếu không có tham số phụ) hoặc đẩy logic tính toán ra một hàm thuần độc lập ở ngoài Class rồi mới gắn `@lru_cache`.',
    backAnalogy:
      'Sổ lưu niệm ở sảnh tòa nhà (`@lru_cache` trên Class) thay vì chỉ ghi câu hỏi của khách lại giữ luôn cả người khách (`self`) ở lại sảnh không cho về nhà!',
    codeSnippet: `from functools import lru_cache, cached_property

# ❌ NGUY HIỂM: Giữ tham chiếu mạnh tới 'self' trong cache toàn cục gây Memory Leak!
# class Worker:
#     @lru_cache
#     def calc(self, n: int) -> int: ...

# ✅ AN TOÀN: Tách hàm thuần ra ngoài (hoặc dùng @cached_property):
@lru_cache(maxsize=256)
def _pure_calc(n: int) -> int:
    return n * n`,
    relatedTermIds: ['stdlib-functools', 'concept-gc'],
  },
  {
    id: 'fc-320',
    stageId: 'stage-7',
    level: 'master',
    category: 'Tư duy Kiến trúc Sư Python (Pythonic Zen)',
    frontQuestion: 'Tổng kết hành trình từ Zero đến Hero: Khi đứng trước một bài toán kỹ thuật mới trong Python, quy trình 4 bước ra quyết định của một **Senior / Principal Python Engineer** là gì?',
    frontHint: 'Đúng đắn & Rõ ràng (Explicit/Typed) -> Tận dụng Stdlib & Hệ sinh thái chuẩn -> Cô lập I/O & Tối ưu thuật toán -> Đo đạc thực tế (Profile before optimizing).',
    backAnswer:
      '1. **Tường minh & An toàn Kiểu ngay từ đầu (Explicit & Typed)**: Tổ chức dự án chuẩn `pyproject.toml` + `.venv` (`uv`), thiết kế Domain Model rõ ràng với `@dataclass`/`Pydantic` và Type Hints đầy đủ.\n2. **Đứng trên vai người khổng lồ (Batteries & Ecosystem)**: Ưu tiên Thư viện Tiêu chuẩn (`pathlib`, `collections`, `itertools`, `functools`) trước; dùng thư viện lõi Rust/C đầu ngành (`FastAPI`, `SQLAlchemy 2.0`, `Polars`, `httpx`, `pytest`) cho bài toán lớn.\n3. **Tách biệt I/O và Thuần túy (Clean Architecture & Async)**: Giữ logic nghiệp vụ thuần túy dễ test; dùng `asyncio` (`TaskGroup`) cho I/O-bound và Vectorization/Multiprocessing cho CPU-bound.\n4. **Đo đạc trước khi tối ưu (Profile, Don’t Guess)**: Chọn đúng cấu trúc dữ liệu ($O(1)$ `set`/`dict`) và dùng `py-spy` / `tracemalloc` tìm đúng điểm nghẽn thực sự.',
    backAnalogy:
      'Người thợ cả xây dựng đại công trình: Bản vẽ rõ ràng (`Type Hints`), nền móng vững chắc (`uv` + `.venv`), vật liệu chuẩn công nghiệp (`Stdlib` + `FastAPI`/`Polars`), và luôn dùng máy đo laser (`Profiler`) kiểm chứng chất lượng.',
    codeSnippet: `import this  # The Zen of Python, by Tim Peters
# "Beautiful is better than ugly.
#  Explicit is better than implicit.
#  Simple is better than complex.
#  Readability counts."`,
    relatedTermIds: ['concept-pep8', 'tool-uv', 'concept-type-hints'],
  },
];

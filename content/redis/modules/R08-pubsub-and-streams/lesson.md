# Pub/Sub vs Redis Streams: Từ Loa Phát Thanh Tức Thời Đến Event Log Bền vững

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Khi hệ thống của bạn tách thành nhiều dịch vụ nhỏ (ví dụ **API Đặt hàng** cần báo cho **Dịch vụ Thanh toán** và **Dịch vụ Gửi Email** xử lý nền), gửi tin nhắn qua Redis có **2 cơ chế hoàn toàn khác nhau** mà người mới rất dễ chọn nhầm:
> 1. **`Pub/Sub` (*Publish / Subscribe* — Đài phát thanh trực tiếp):** Giống hệt loa phát thanh FM hoặc phát trực tiếp không ghi hình — ai đang bật đài nghe đúng giây đó thì nhận được tin tức thì (`< 0.3ms`); ai đang mất mạng 2 giây vì khởi động lại máy chủ thì **mất vĩnh viễn bản tin đó**, Redis không lưu lại bất kỳ chữ nào!
> 2. **`Redis Streams` (Nhật ký luồng sự kiện bền vững):** Giống một **nhóm chat có lưu toàn bộ lịch sử kèm biên bản bàn giao việc**:
>    - **`Consumer Group` (Nhóm công nhân chia việc):** Nếu có 5 máy xử lý thanh toán trong cùng 1 nhóm, Redis tự chia đều mỗi máy làm 1 đơn hàng khác nhau để tăng tốc gấp 5 lần.
>    - **`PEL` (*Pending Entries List* — Sổ theo dõi việc đang làm dở):** Khi giao đơn hàng số `#101` cho Máy 1, Redis ghi ngay vào sổ **`PEL`**: *"Máy 1 đang giữ đơn #101 lúc 10:00:00"*.
>    - **`XACK` (*Acknowledge* — Đóng dấu báo cáo hoàn thành):** Máy 1 trừ tiền xong phải gửi lệnh `XACK` về thì Redis mới gạch tên đơn `#101` khỏi sổ chờ `PEL`.
>    - **`XAUTOCLAIM` (Tự động giải cứu việc bị kẹt):** Nếu Máy 1 đang làm dở mà bị sập nguồn khiến đơn `#101` nằm im trong sổ `PEL` quá 60 giây, Máy 2 gọi `XAUTOCLAIM` để tự động nhận lại đơn đó xử lý thay — ==đảm bảo không rơi rớt một đơn hàng nào==!

```visual
kind: illustration
src: /illustrations/redis/redis-streams-pel.jpg
diagram: redis:r08
alt: Kiến trúc Redis Streams với luồng sự kiện XADD MAXLEN ~, phân phối qua Consumer Group, bảng theo dõi PEL chờ XACK và khôi phục tiến trình sập bằng XAUTOCLAIM
badge: Truyền Thông Phân Tán · Streams & PEL
title: Băng Chuyền Nhật Ký Redis Streams — Giao Tin Tin Cậy Với PEL, XACK & XAUTOCLAIM
subtitle: Khắc phục hoàn toàn nhược điểm mất tin của Pub/Sub bằng sổ theo dõi Pending Entries List và cơ chế thu hồi tự động khi Worker gặp sự cố
caption: Nhấn vào minh hoạ hoặc sơ đồ kỹ thuật để phóng to — quan sát hành trình bản tin từ XADD qua XREADGROUP vào hộp chờ PEL cho tới khi nhận XACK hoặc được XAUTOCLAIM giải cứu
callouts:
  - num: 1
    label: Nhật Ký Bền Vững Có Cắt Ngọn (XADD MAXLEN ~)
    desc: Mỗi bản tin nhận ID thời gian tăng dần tự động (ms-seq); cờ xấp xỉ MAXLEN ~ 10000 giữ dung lượng RAM cố định với chi phí O(1) nhờ cắt theo từng nút Listpack.
    tone: sky
  - num: 2
    label: Sổ Theo Dõi Tạm Giữ PEL & Con Dấu XACK
    desc: Khi XREADGROUP giao tin bằng ký hiệu '>', bản tin lập tức ghi danh vào PEL của Consumer đó và chỉ biến mất khỏi PEL khi Worker gửi lệnh XACK xác nhận hoàn tất.
    tone: emerald
  - num: 3
    label: Thu Hồi Bản Tin Mồ Côi Bằng XAUTOCLAIM
    desc: Nếu Worker 1 sập nguồn khiến bản tin nằm im trong PEL quá ngưỡng min-idle-time (ví dụ 60000ms), Worker 2 gọi XAUTOCLAIM để nhận lại quyền sở hữu và xử lý thay!
    tone: amber
```

## 1. Đối chiếu kiến trúc: Pub/Sub Tức Thời vs Redis Streams vs Kafka / Task Queues

```visual
kind: compare
title: Khi Nào Dùng Pub/Sub — Khi Nào Bắt Buộc Dùng Redis Streams?
subtitle: Chọn sai công cụ giữa hai cơ chế này là nguyên nhân hàng đầu gây mất đơn hàng ngầm lúc triển khai (rolling deploy)!
left:
  badge: FIRE-AND-FORGET (AT-MOST-ONCE)
  title: Redis Pub/Sub & Sharded Pub/Sub
  tone: amber
  lang: redis
  code: |
    # Cửa sổ 1 (WebSocket Gateway đăng ký nghe):
    SUBSCRIBE chat:room:42
    # Trên Redis 7/8 Cluster, ưu tiên Sharded Pub/Sub:
    SSUBSCRIBE ws:live:match-99

    # Cửa sổ 2 (Bắn tin tức thời, KHÔNG lưu RAM):
    PUBLISH chat:room:42 "{\"user\":\"an\",\"msg\":\"Hi!\"}"
  bullets:
    - "**Phát tán cho tất cả (*Broadcast Fan-out*)**: 10 máy chủ WebSocket cùng `SUBSCRIBE` một kênh sẽ **cùng nhận bản sao** để đẩy tin nhắn trực tiếp xuống trình duyệt người dùng."
    - "**Không lưu trữ, không phát lại**: Nếu toàn bộ người nghe rớt mạng 2 giây lúc cập nhật code, mọi tin `PUBLISH` trong 2 giây đó bốc hơi vĩnh viễn (`0` byte lưu lại)."
    - "**Mẹo trên Redis Cluster**: Dùng ==`SPUBLISH` / `SSUBSCRIBE`== (Sharded Pub/Sub từ Redis 7+) để chỉ truyền tin trong đúng phân mảnh thay vì phát tán làm nghẽn toàn cụm!"
right:
  badge: DURABLE LOG (AT-LEAST-ONCE)
  title: Redis Streams + Consumer Group
  tone: emerald
  lang: redis
  code: |
    # 1. Ghi sự kiện kèm cắt ngọn xấp xỉ (~) giữ ấm RAM:
    XADD orders:stream MAXLEN ~ 10000 * orderId "ord-101" total "490000"

    # 2. Khởi tạo Consumer Group (MKSTREAM tự tạo khoá nếu chưa có):
    XGROUP CREATE orders:stream payment-cg $ MKSTREAM

    # 3. Chia tải giữa các Worker & đóng dấu hoàn tất:
    XREADGROUP GROUP payment-cg worker-1 COUNT 5 STREAMS orders:stream >
    XACK orders:stream payment-cg 1700000000100-0
  bullets:
    - "**Lưu bền vững trên RAM + đĩa AOF/RDB**: Worker tắt đi bật lại vẫn đọc tiếp được đầy đủ các sự kiện phát sinh trong lúc vắng mặt."
    - "**Đa nhóm đọc độc lập**: 5 Worker trong nhóm `payment-cg` chia việc nhau xử lý, đồng thời nhóm `analytics-cg` vẫn đọc được nguyên vẹn dòng sự kiện đó cho mục đích thống kê!"
    - "**Giao tin ít nhất 1 lần (*At-Least-Once*)**: Giữ dấu vết trong sổ `PEL` cho tới khi nhận lệnh `XACK` rõ ràng."
```

> [!TIP] Bức tranh Hệ sinh thái Thực tế: Chọn Task Queue (`Celery`/`BullMQ`), `Redis Streams` hay `Apache Kafka`?
> Một kỹ sư giỏi không tự viết lại mọi thứ từ con số 0 nếu đã có công cụ chuẩn khớp bài toán:
> - **Cần chạy tác vụ nền (*Background Jobs*: gửi email, xuất PDF, gọi AI API có hẹn giờ & thử lại tự động):** Hãy dùng các thư viện **Task Queue dựng sẵn trên Redis** như **`Celery`**, **`ARQ`** (async cho FastAPI), **`RQ`** trong Python hoặc **`BullMQ`** trong Node.js/TypeScript!
> - **Cần luồng sự kiện (*Event Streaming*) tốc độ dưới 1ms cho Microservices vừa và lớn (`10k – 100k events/s`) mà không muốn gánh chi phí vận hành cụm mới:** Chọn **Redis Streams** ngay trên hạ tầng Redis sẵn có!
> - **Khi nào thực sự cần tới Apache Kafka (hoặc RabbitMQ)?** Chọn **Kafka** khi bạn cần lưu trữ hàng **Terabyte** lịch sử sự kiện trên ổ cứng rẻ tiền suốt nhiều tuần/tháng để tua lại (*Event Sourcing / Data Lake*) hoặc thông lượng hàng triệu bản tin/giây; chọn **RabbitMQ** khi cần định tuyến phân nhánh phức tạp (*Topic/Header Exchange*).

## 2. Giải phẫu vòng đời bản tin bên trong Consumer Group & PEL

Điểm quan trọng nhất khi làm việc với Redis Streams là hiểu rõ **3 ký hiệu ID đặc biệt** (`$`, `0`, `>`) và quy trình 4 bước khép kín:

```visual
kind: flow
title: Hành Trình Khép Kín Của Một Sự Kiện Từ XADD Đến XACK / XAUTOCLAIM [!badge:sky:At-Least-Once]
direction: LR
steps:
  - label: "1. XADD MAXLEN ~"
    detail: "Sinh ID <ms>-<seq> nối đuôi Listpack"
    tone: sky
  - label: "2. XREADGROUP ... >"
    detail: "Giao tin mới chưa ai nhận & ghi vào PEL"
    tone: violet
  - label: "3A. XACK (Thành công)"
    detail: "Xoá ID khỏi PEL -> Giải phóng theo dõi"
    tone: emerald
  - label: "3B. XAUTOCLAIM (Sập pod)"
    detail: "Thu hồi tin treo quá min-idle-time rồi XACK"
    tone: amber
```

1. **Khi tạo nhóm bằng `XGROUP CREATE <key> <group> <id> MKSTREAM`**:
   - Truyền **`$`**: Chỉ nhận các bản tin **mới phát sinh từ giây phút tạo nhóm trở đi**.
   - Truyền **`0`**: Đọc vét lại **toàn bộ lịch sử từ bản tin đầu tiên** đang có trong Stream.
   - Luôn thêm từ khóa **`MKSTREAM`** ở cuối để tự động tạo Stream rỗng nếu dịch vụ Worker khởi động trước Producer.
2. **Khi đọc tin bằng `XREADGROUP GROUP <group> <consumer> COUNT n BLOCK ms STREAMS <key> <id>`**:
   - Truyền **`>`** ở cuối: *"Hãy giao cho tôi các bản tin mới chưa từng giao cho ai trong nhóm này"* (đồng thời ghi ngay vào sổ chờ **PEL**).
   - Truyền **`0`** ở cuối: *"Hãy trả lại danh sách các bản tin cũ đang nằm dở trong PEL của riêng tôi sau khi vừa khởi động lại"*.
3. **Khi giải cứu tin treo bằng `XPENDING` & `XAUTOCLAIM`**:
   - `XPENDING` soi xem bản tin nào đang kẹt, đã nằm im bao nhiêu mili-giây (`idle time`) và bị thử lại mấy lần (`deliveryCount`).
   - ==`XAUTOCLAIM orders:stream payment-cg worker-2 60000 0-0 COUNT 10`== tự động chuyển quyền các bản tin treo quá `60,000ms` (1 phút) sang `worker-2` và trả luôn nội dung bản tin để xử lý ngay!

> [!WARNING] Hai quả bom hẹn giờ làm tràn RAM với Redis Streams
> 1. **Quên cắt ngọn `MAXLEN ~` khi gọi `XADD`:** Lệnh `XACK` **chỉ xóa dòng ghi nợ trong sổ `PEL` chứ KHÔNG xóa bản tin gốc khỏi Stream** (vì có thể nhóm khác vẫn cần đọc!). Nếu không gắn ==`MAXLEN ~ 50000`== (dùng dấu ngã `~` để cắt nhanh theo từng cụm `listpack` `O(1)`), Stream sẽ phình to ăn sạch RAM!
> 2. **Bỏ mặc "Tin nhắn độc" (*Poison Message*) lặp vô tận:** Nếu 1 đơn hàng bị lỗi dữ liệu làm code Worker văng lỗi liên tục, nó sẽ bị `XAUTOCLAIM` chuyền qua chuyền lại mãi mãi. Hãy kiểm tra nếu số lần giao `deliveryCount > 5` thì đẩy sang luồng lỗi riêng (`orders:dlq` — *Dead-Letter Queue*) rồi gọi `XACK` để giải phóng `PEL`!

## 3. Mẫu Worker chuẩn Production (Python `redis-py` & Node.js `ioredis`)

Vì Redis Streams đảm bảo giao tin **ít nhất 1 lần (*At-Least-Once*)**, một đơn hàng có thể được xử lý lại nếu Worker trước sập ngay sau khi thu tiền nhưng chưa kịp gửi `XACK`. Do đó hàm xử lý `process_order` luôn cần thiết kế **chống chạy trùng (*Idempotent*)**:

```python
# Python (redis-py) — Chu trình Worker chuẩn: XAUTOCLAIM giải cứu tin treo + XREADGROUP + XACK
from redis.exceptions import ResponseError

def init_stream_group(r, stream="orders:stream", group="payment-cg"):
    try:
        r.xgroup_create(stream, group, id="$", mkstream=True)
    except ResponseError as exc:
        if "BUSYGROUP" not in str(exc):
            raise  # Nhóm đã tồn tại -> bỏ qua an toàn

def poll_orders_once(r, consumer_name: str):
    # 1. Thu hồi các đơn hàng bị treo quá 60,000ms từ các worker đã sập:
    _, claimed, *_ = r.xautoclaim("orders:stream", "payment-cg", consumer_name, min_idle_time=60_000, start_id="0-0", count=10)
    for entry_id, fields in claimed:
        process_order_idempotently(entry_id, fields)
        r.xack("orders:stream", "payment-cg", entry_id)

    # 2. Nhận mẻ đơn hàng mới ('>') kèm chờ tối đa 2 giây nếu vắng việc:
    batches = r.xreadgroup("payment-cg", consumer_name, {"orders:stream": ">"}, count=10, block=2000)
    for _, entries in batches:
        for entry_id, fields in entries:
            process_order_idempotently(entry_id, fields)
            r.xack("orders:stream", "payment-cg", entry_id)  # Xoá khỏi sổ chờ PEL!
```

```ts
// Node.js / TypeScript (ioredis) — Phát sự kiện kèm cắt ngọn xấp xỉ MAXLEN ~ 10000
await redis.xadd(
  "orders:stream",
  "MAXLEN", "~", 10_000,
  "*",
  "orderId", "ord-101",
  "amount", "490000"
);
```

> [!REMEMBER] Quy tắc bỏ túi khi thiết kế hệ thống truyền tin
> - Cần bắn tín hiệu tức thời cho mọi máy chủ đang lắng nghe (chat trực tiếp, tọa độ con trỏ, xóa bộ đệm L1) và chấp nhận mất tin khi rớt mạng -> Chọn **Pub/Sub** (hoặc **`SSUBSCRIBE`** trên Cluster).
> - Cần chạy job nền đơn giản trong code Python/Node.js -> Dùng **`ARQ` / `Celery` / `RQ`** hoặc **`BullMQ`**.
> - Cần luồng nhật ký sự kiện bền vững nhiều dịch vụ cùng đọc độc lập với chi phí vận hành tối giản -> Chọn **Redis Streams (`XADD MAXLEN ~` + `XREADGROUP` + `XACK` + `XAUTOCLAIM`)**.

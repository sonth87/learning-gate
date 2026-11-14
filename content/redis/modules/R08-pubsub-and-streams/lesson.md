# Pub/Sub vs Redis Streams: Từ Loa Phát Thanh Tức Thời Đến Nhật Ký Sự Kiện Bất Tử

Trong một tiến trình đơn lẻ, lập trình viên Node.js quá quen với `EventEmitter` (`emitter.emit('order', data)`), còn kỹ sư Python dùng `asyncio.Queue` để truyền tin giữa các coroutine. Nhưng khi hệ thống tách thành **10 pod API Gateway** và **8 pod Payment Worker**, làm sao truyền sự kiện qua mạng vừa **nhanh dưới 1ms**, vừa **không mất đơn hàng khi một pod Worker bất ngờ sập nguồn (`OOMKilled`)**?

Redis cung cấp **hai cơ chế truyền thông hoàn toàn khác triết lý** mà bạn tuyệt đối không được dùng nhầm:

- [>] **Redis Pub/Sub (`PUBLISH` / `SUBSCRIBE` / `SSUBSCRIBE`)**: Giống chiếc {amber:loa phát thanh FM trực tiếp} — bắn tin tới mọi người đang nghe ngay lập tức, **không lưu vào RAM**, ai mất mạng đúng giây đó coi như mất tin mãi mãi (*Fire-and-Forget*).
- [+] **Redis Streams (`XADD` / `XREADGROUP` / `XACK`)**: Một {emerald:nhật ký sự kiện chỉ ghi nối đuôi (Append-Only Log)} thu gọn lấy cảm hứng từ Apache Kafka, lưu bền vững trên cấu trúc **Radix Tree + Listpack**, chia tải qua **Consumer Group** và theo dõi sát sao từng bản tin chưa xử lý xong trong bảng **PEL (*Pending Entries List*)**!
- [!] Nếu Worker đang xử lý dở mà sập nguồn, lệnh **`XAUTOCLAIM`** cho phép đồng đội tự động giải cứu bản tin bị kẹt về xử lý tiếp — không rơi rớt một xu doanh thu nào!

```visual
kind: illustration
src: /illustrations/redis/redis-streams-pel.jpg
diagram: redis:r08
alt: Kiến trúc Redis Streams với luồng sự kiện XADD MAXLEN ~, phân phối qua Consumer Group, bảng theo dõi PEL chờ XACK và cứu hộ tiến trình sập bằng XAUTOCLAIM
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
    label: Giải Cứu Tin Mồ Côi Bằng XAUTOCLAIM
    desc: Nếu Worker 1 sập nguồn khiến bản tin nằm im trong PEL quá ngưỡng min-idle-time (ví dụ 60000ms), Worker 2 gọi XAUTOCLAIM để tước quyền sở hữu và xử lý thay!
    tone: amber
```

## 1. Đối chiếu kiến trúc: Pub/Sub Tức Thời vs Redis Streams Bền Vững

> [!ANALOGY] Hình dung Đài phát thanh FM vs Băng chuyền bưu phẩm có ký nhận
> - **Pub/Sub** giống phát thanh viên đọc thông báo qua loa phường: ai đang bật đài thì nghe thấy ngay trong `0.2ms`; ai đang tắt đài đi vắng sẽ **không bao giờ nghe lại được** câu vừa đọc.
> - **Redis Streams** giống sổ công văn kiêm băng chuyền bưu cục: mỗi kiện hàng được đóng dấu mã số thời gian `1700000123456-0`. Bưu tá (Worker) lấy hàng đi giao phải ghi tên vào sổ tạm giữ (**PEL**); giao xong mang chữ ký về nộp (**`XACK`**) mới xoá sổ. Nếu bưu tá xe hỏng giữa đường quá 1 phút, bưu tá khác dùng **`XAUTOCLAIM`** sang nhận lại kiện hàng đi giao tiếp!

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
    - "**Fan-out tất cả cùng nhận**: 10 pod WebSocket cùng `SUBSCRIBE` một kênh sẽ **cùng nhận bản sao** của tin nhắn để đẩy xuống trình duyệt đang kết nối."
    - "**Không lưu trữ, không phát lại**: Nếu toàn bộ subscriber rớt mạng 2 giây lúc redeploy, mọi lệnh `PUBLISH` trong 2 giây đó bốc hơi vĩnh viễn (`0` byte lưu lại)."
    - "**Lưu ý Redis Cluster**: `PUBLISH` cổ điển phát tán (broadcast) tới *mọi node* trong cụm gây nghẽn mạng nội bộ; trên Redis 7/8 hãy dùng **`SPUBLISH` / `SSUBSCRIBE`** để định tuyến theo đúng Hash Slot!"
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
    - "**Lưu bền vững trong RAM + AOF/RDB**: Worker tắt đi bật lại vẫn đọc tiếp được toàn bộ các bản tin phát sinh trong lúc vắng mặt."
    - "**Chia tải cạnh tranh trong cùng Group**: 5 Worker cùng thuộc `payment-cg` sẽ được chia đều mỗi người một đơn hàng khác nhau; đồng thời nhóm thứ hai `analytics-cg` vẫn đọc được độc lập cùng dòng sự kiện đó!"
    - "**Đảm bảo At-Least-Once**: Có sổ `PEL` giữ chân bản tin cho tới khi nhận lệnh `XACK` tường minh."
```

## 2. Giải phẫu vòng đời bản tin bên trong Consumer Group & PEL

Điểm tinh tế nhất khi vận hành Redis Streams nằm ở **ba mốc ID đặc biệt** (`$`, `0`, `>`) và quy trình 4 bước khép kín để không bao giờ rò rỉ bộ nhớ `PEL`:

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
    tone: indigo
  - label: "3A. XACK (Thành công)"
    detail: "Xoá ID khỏi PEL -> Giải phóng RAM"
    tone: emerald
  - label: "3B. XAUTOCLAIM (Sập pod)"
    detail: "Thu hồi tin treo quá min-idle-time rồi XACK"
    tone: amber
```

Hãy nắm thật chắc ý nghĩa của từng ký hiệu ID điều khiển luồng đọc:

1. **Khi tạo nhóm bằng `XGROUP CREATE <key> <group> <id> [MKSTREAM]`**:
   - Đặt `<id>` là **`$`**: Nhóm chỉ nhận các sự kiện **mới tinh phát sinh từ thời điểm tạo nhóm trở đi** (bỏ qua lịch sử cũ).
   - Đặt `<id>` là **`0`** (hoặc `0-0`): Nhóm sẽ **phát lại (replay) toàn bộ lịch sử** đang có sẵn trong Stream ngay từ bản tin đầu tiên!
   - Luôn đính kèm **`MKSTREAM`** ở cuối để tránh lỗi `ERR The XGROUP subcommand requires the key to exist` khi khởi chạy dịch vụ Worker trước dịch vụ Producer.
2. **Khi kéo việc bằng `XREADGROUP GROUP <group> <consumer> [COUNT n] [BLOCK ms] STREAMS <key> <id>`**:
   - Truyền **`>`** ở cuối: *"Hãy giao cho tôi các bản tin mới chưa từng giao cho bất kỳ consumer nào trong nhóm này"*. Ngay khoảnh khắc giao đi, Redis ghi `{id, consumer, deliveredAtMs, deliveryCount = 1}` vào bảng **PEL**.
   - Truyền **`0`** ở cuối: *"Đừng lấy tin mới, hãy trả lại danh sách các bản tin đang nằm dở trong PEL của chính tôi (khi tôi vừa khởi động lại cùng tên consumer)"*.
3. **Khi cứu hộ đồng đội gặp nạn bằng `XPENDING` & `XAUTOCLAIM` (Redis 6.2+ / 8.0)**:
   - Gọi `XPENDING orders:stream payment-cg - + 10` để soi chi tiết: ID nào đang kẹt, thuộc về consumer nào, đã nằm bất động bao nhiêu mili-giây (`idle time`) và đã giao đi giao lại mấy lần (`deliveryCount`).
   - Gọi `XAUTOCLAIM orders:stream payment-cg worker-2 60000 0-0 COUNT 10`: quét từ đầu PEL (`0-0`), tìm mọi bản tin đã treo quá **`60,000ms`** (1 phút), chuyển quyền sở hữu sang `worker-2` (tăng `deliveryCount` lên `+1`) và trả về nội dung bản tin ngay trong 1 lệnh duy nhất! Sau khi `worker-2` xử lý xong, đừng quên gọi **`XACK`** để dọn sạch PEL!

> [!TRAP] Hai quả bom hẹn giờ làm tràn RAM với Redis Streams
> 1. **Quên `MAXLEN ~` khi gọi `XADD`**: Khác với `RPOP` của List (lấy ra là mất), `XACK` **chỉ xoá bản ghi theo dõi trong bảng PEL chứ KHÔNG xoá bản tin gốc trên Stream** (vì có thể còn Consumer Group khác chưa đọc tới!). Nếu không gắn `MAXLEN ~ 50000` (hoặc `MINID ~`), Stream sẽ tích tụ hàng chục triệu bản ghi ăn sạch RAM. Luôn dùng dấu ngã **`~`** (*approximate trimming*) thay vì `=` để Redis cắt nguyên cả khối node `listpack` với tốc độ **O(1)**!
> 2. **Đọc `XREADGROUP` mà quên `XACK` (hoặc thiếu nhánh Dead-Letter Queue)**: Ngay cả khi Stream gốc đã được cắt ngắn bằng `MAXLEN ~`, các mục tham chiếu chưa `XACK` bên trong bảng `PEL` vẫn tồn tại mãi mãi! Ngoài ra, với những "tin độc" (*poison message* làm code crash liên tục), hãy kiểm tra `deliveryCount > 5` từ `XPENDING` để đẩy sang stream lỗi `orders:dlq` rồi gọi `XACK` giải phóng PEL.

## 3. Độ phức tạp Big-O & Mẫu Worker chuẩn Production

| Nhóm thao tác | Câu lệnh tiêu biểu | Độ phức tạp Big-O | Ghi chú vận hành thực tế |
| :--- | :--- | :--- | :--- |
| **Ghi & Cắt ngọn** | `XADD key MAXLEN ~ 10000 * f v` | **O(1)** trung bình | Nối đuôi Radix Tree + cắt xấp xỉ theo cụm Listpack siêu nhanh |
| **Đo & Quét dải ID** | `XLEN key` / `XRANGE key - + COUNT 20` | **O(1)** / **O(N)** | `XRANGE` cực tiện để gỡ lỗi hoặc phân trang lịch sử theo mốc thời gian |
| **Tiêu thụ theo nhóm** | `XREADGROUP GROUP g c COUNT m STREAMS k >` | **O(M)** | `M` là số bản tin lấy ra mỗi mẻ; dùng `BLOCK 5000` trên kết nối riêng |
| **Đóng dấu hoàn tất** | `XACK key group id1 [id2 ...]` | **O(1)** mỗi ID | Có thể gom nhiều ID xác nhận trong 1 lệnh để giảm vòng mạng |
| **Thu hồi tin treo** | `XAUTOCLAIM key group c 60000 0-0 COUNT 10` | **O(1)** mỗi tin thu hồi | Thay thế cặp lệnh rườm rà `XPENDING` + `XCLAIM` của thế hệ cũ |

```ts
// Node.js (ioredis) — Chu trình chuẩn: XREADGROUP -> Idempotent Handler -> XACK + XAUTOCLAIM định kỳ
async function pollStreamBatch(redis: Redis, consumerName: string) {
  // 1. Giải cứu trước các bản tin bị treo quá 60 giây từ các pod đã chết:
  const [, claimed] = await redis.xautoclaim(
    "orders:stream", "payment-cg", consumerName, 60_000, "0-0", "COUNT", 10,
  );
  for (const [entryId, flatFields] of claimed as [string, string[]][]) {
    await processOrderIdempotently(entryId, flatFields);
    await redis.xack("orders:stream", "payment-cg", entryId);
  }

  // 2. Kéo mẻ bản tin mới tinh chưa ai nhận ('>'):
  const res = await redis.xreadgroup(
    "GROUP", "payment-cg", consumerName,
    "COUNT", 10, "BLOCK", 2000,
    "STREAMS", "orders:stream", ">",
  );
  if (!res) return;

  for (const [, entries] of res as [string, [string, string[]][]][]) {
    for (const [entryId, flatFields] of entries) {
      await processOrderIdempotently(entryId, flatFields);
      await redis.xack("orders:stream", "payment-cg", entryId); // Xoá khỏi PEL!
    }
  }
}
```

```python
# Python (redis-py) — Ghi sự kiện có cắt ngọn xấp xỉ (~) & khởi tạo nhóm an toàn
from redis.exceptions import ResponseError

def ensure_group_and_emit(r, order_id: str, amount: int) -> str:
    try:
        r.xgroup_create("orders:stream", "payment-cg", id="$", mkstream=True)
    except ResponseError as exc:
        if "BUSYGROUP" not in str(exc):
            raise  # Nhóm đã tồn tại từ trước -> bỏ qua lỗi BUSYGROUP an toàn!

    return r.xadd(
        "orders:stream",
        {"orderId": order_id, "amount": str(amount)},
        maxlen=10_000,
        approximate=True,  # Sinh cờ MAXLEN ~ 10000 trên đường truyền
    )
```

> [!REMEMBER] Quy tắc bỏ túi khi bước vào phòng phỏng vấn System Design
> - Cần đẩy thông báo gõ phím (*typing indicator*), toạ độ con trỏ trực tiếp hay tín hiệu xoá L1 Cache tới **mọi pod cùng lúc** và chấp nhận rớt tin khi mất mạng -> Chọn **Pub/Sub** (hoặc **Sharded Pub/Sub `SSUBSCRIBE`** trên Cluster).
> - Cần hàng đợi sự kiện đơn hàng, thanh toán, gửi email, webhook có **chia tải Worker, lưu vết lịch sử, chống mất tin khi sập pod** và chưa muốn gánh chi phí vận hành cụm Kafka đồ sộ -> Chọn **Redis Streams (`XADD MAXLEN ~` + `XREADGROUP` + `XACK` + `XAUTOCLAIM`)**, kết hợp kiểm tra **Idempotency** ở phía Worker!

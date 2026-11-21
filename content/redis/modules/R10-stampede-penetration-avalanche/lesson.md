# 3 Sự cố Điển hình Caching: Chống Stampede, Penetration & Avalanche

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Một hệ thống chạy mượt mà ở mức `20,000 request/giây` nhờ Redis đỡ hộ `99.5%` lượt đọc thực chất đang ẩn giấu một rủi ro lớn: **Database phía sau chỉ đủ sức chịu khoảng `200 câu SQL/giây`**. Chỉ cần tấm khiên Redis bị thủng trong **3 giây**, hàng ngàn câu truy vấn sẽ ập thẳng xuống nghiền nát Database ngay lập tức!
>
> Mọi vụ sập Database xuyên qua tầng Cache ngoài đời thực đều quy về **3 kịch bản kinh điển** — hãy nhớ chúng qua **ẩn dụ Tiệm Bánh Nổi Tiếng Giờ Cao Điểm**:
> 1. **`Cache Stampede` (Giẫm đạp dây chuyền vì 1 khóa siêu nóng hết hạn):** Đúng 12h00 trưa, tấm biển ghi giá chiếc bánh Best-seller trên quầy vừa hết hạn bị gỡ xuống. Thay vì cử **1 nhân viên duy nhất** chạy vào bếp hỏi lại giá mới (**`Singleflight` / `Mutex Lock`**), cả **1,000 khách hàng đồng loạt xô cửa ùa thẳng vào bếp** hỏi cùng một câu làm sập cả căn bếp!
> 2. **`Cache Penetration` (Đâm xuyên thủng vì hỏi thứ không tồn tại):** Kẻ phá hoại thuê hàng ngàn người tới hỏi mua món *"Bánh Rồng Sao Hỏa"* — món này trên quầy không có mà trong bếp cũng chẳng có! Vì không có nên quầy không ghi lại, khiến lần nào nhân viên cũng phải chạy tuốt vào bếp tìm trong vô vọng.
> 3. **`Cache Avalanche` (Tuyết lở đồng loạt vì vạn khóa chết cùng một giây):** Quản lý cài hẹn giờ cho **toàn bộ 50 tủ trưng bày tự động làm mới cùng lúc đúng 13h00:00** — khiến khách của tất cả các quầy đổ dồn vào bếp trong cùng một tích tắc!

```visual
kind: illustration
src: "/illustrations/redis/redis-cache-stampede-shield.jpg"
diagram: "redis:r10"
alt: "Lá chắn phòng thủ trước 3 Sự cố Điển hình Caching: Stampede, Penetration và Avalanche"
badge: "High-Concurrency Defense · R10"
title: "Giải phẫu 3 Kịch bản Đánh sập Database & Hệ thống Lá chắn 3 Tầng"
subtitle: "Phân biệt chính xác nguồn phát sinh của Stampede (1 khoá siêu nóng), Penetration (khoá không tồn tại) và Avalanche (hàng vạn khoá chết cùng giây)"
caption: "Kết hợp Bloom Filter ở biên + Singleflight/Mutex cho Hot Key + TTL Jitter cho Batch Import tạo nên pháo đài bất khả xâm phạm."
callouts:
  - num: 1
    label: "Chống Stampede (1 Hot Key hết hạn)"
    desc: "Dùng Singleflight gom cổ chai trong RAM ứng dụng kết hợp Redis Mutex (SET NX PX) hoặc Logical Expiration để chỉ DUY NHẤT 1 luồng xuống DB."
    tone: rose
  - num: 2
    label: "Chống Penetration (ID ma / Quét DDoS)"
    desc: "Đặt Bloom Filter (BF.EXISTS) chặn ngay ở cửa ngõ với chi phí ~1.2 byte/phần tử, kết hợp Negative Cache TTL ngắn 30-60s."
    tone: amber
  - num: 3
    label: "Chống Avalanche (Hết hạn đồng loạt)"
    desc: "Cộng độ lệch ngẫu nhiên TTL Jitter (+5% đến +20%), dùng Multi-tier L1/L2 Cache và vận hành cụm Redis HA chống sập nút."
    tone: emerald
```

## 1. Kịch bản #1: Chặn đứng Cache Stampede (*Hot Key Breakdown*)

**Triệu chứng:** Duy nhất **một khóa có lưu lượng đọc cực lớn** (như trang chủ `cache:home:hero` hoặc sản phẩm mở bán lúc 0h `cache:flashsale:iphone`) vừa chạm mốc `TTL = 0`. Trong vỏn vẹn `40ms` mà truy vấn đầu tiên đang bận chạy SQL dưới Database chưa kịp `SET` lại lên Redis, `5,000` request khác ập tới cùng thấy trống `(nil)` và mở `5,000` kết nối SQL y hệt nhau!

- [>] **Lớp khiên 1 — Gom cổ chai nội bộ (`Singleflight`) + Khóa phân tán (`SET ... NX PX`):**
  1. Bên trong từng tiến trình ứng dụng (Go `singleflight.Group`, `asyncio.Lock` theo khóa trong Python, hoặc `Map<string, Promise>` trong Node.js), gom 500 request trùng khóa lại để chờ chung kết quả của **1 lời gọi duy nhất**.
  2. Giữa 20 máy chủ ứng dụng với nhau, tranh quyền nạp lại cache bằng ==`SET lock:rebuild:home <uuid> NX PX 3000`==: chỉ **1 máy chủ thắng khóa** được phép truy vấn PostgreSQL; 19 máy còn lại chờ `30–50ms` rồi đọc bản mới từ Redis!
- [>] **Lớp khiên 2 — Hết hạn mềm (*Logical Expiration* — Không bao giờ xóa trắng Hot Key):**
  Với khóa siêu nóng đêm sự kiện, đặt TTL vật lý dài (ví dụ `3600s`) nhưng nhúng trường thời gian hết hạn mềm `logical_exp` (`now + 300s`) vào dữ liệu. Khi quá hạn mềm, mọi khách hàng vẫn nhận ngay dữ liệu hiện tại trong `0.3ms`, chỉ duy nhất 1 worker nền đi làm mới êm ái!

## 2. Kịch bản #2: Chặn đứng Cache Penetration (*Xuyên thủng bởi ID ảo*)

**Triệu chứng:** Bot cào dữ liệu hoặc kẻ tấn công bắn hàng vạn truy vấn với `product_id = -1` hoặc mã UUID ngẫu nhiên **không tồn tại cả trên Redis lẫn trong PostgreSQL**, làm tỷ lệ trượt cache vọt lên `100%`!

> [!WARNING] Tại sao chỉ lưu Negative Cache (`"__NULL__"`) là CHƯA ĐỦ khi bị tấn công quét ID ngẫu nhiên?
> Nếu kẻ xấu tự sinh **10 triệu mã UUID ngẫu nhiên hoàn toàn khác nhau** trong 5 phút và ứng dụng của bạn ngoan ngoãn lưu `"__NULL__"` cho cả 10 triệu mã đó: lần đầu vẫn chọc thủng xuống Database, mà tệ hơn là **10 triệu khóa rác sẽ lấp đầy sạch RAM của Redis**, đẩy văng các dữ liệu thật của khách hàng ra ngoài!

Giải pháp chuẩn là dựng **Bộ lọc gác cổng `Bloom Filter`** (đã học ở `R05`) đứng ngay phía trước:

```python
# Python (redis-py): Chặn đứng 100% ID không tồn tại ngay từ cổng bằng Validate + Bloom Filter
import re

SKU_RE = re.compile(r"^sku-\d{3,10}$")

async def get_sku_safely(r, db, sku_id: str):
    # Bước 0: Kiểm tra định dạng cơ bản ngay trên CPU ứng dụng (0ms)
    if not SKU_RE.match(sku_id):
        return None

    # Bước 1: Hỏi Bloom Filter trên Redis 8 (trả về 0 => Chắc chắn 100% không có trong DB!)
    might_exist = await r.execute_command("BF.EXISTS", "bf:valid_skus", sku_id)
    if not might_exist:
        return None

    # Bước 2: Đi tiếp vào luồng Cache-Aside có kèm Negative Cache 45s (cho ~1% dương tính giả)
    return await read_with_singleflight(r, db, sku_id)
```

## 3. Kịch bản #3: Hóa giải Cache Avalanche (*Tuyết lở đồng loạt*)

**Triệu chứng:** Hàng chục ngàn khóa khác nhau **cùng bốc hơi tại đúng một giây** (thường do tác vụ ban đêm nạp `50,000` mặt hàng khuyến mãi với cùng hằng số `EX 3600`), HOẶC cả một máy chủ Redis bị mất kết nối đột ngột.

```visual
kind: troubleshoot
title: "Bảng Chẩn Đoán & Khắc Phục Nhanh 3 Sự cố Điển hình Caching [!badge:rose:SRE Playbook]"
subtitle: "Nhìn biểu đồ Metrics trên Grafana để phân biệt trúng bệnh trong 30 giây đầu tiên"
items:
  - symptom: "DB QPS dựng đứng theo nhịp từng nấc cố định (vd đúng mỗi 5 phút 1 gai nhọn)"
    badge: "Cache Stampede / Avalanche"
    tone: rose
    cause: "Một Hot Key khổng lồ vừa hết hạn (Stampede) hoặc Cronjob nạp hàng loạt khoá dùng chung một hằng số `EX 300` không có độ lệch ngẫu nhiên (Avalanche)."
    fix: "Thêm biến thiên ngẫu nhiên **TTL Jitter** (`base_ttl + random(5..60)`) cho mọi tác vụ nạp lô và bọc khoá nóng bằng Mutex `SET lock:rebuild:... NX PX 3000`."
    cmd: "SET cache:banner:top '{\"v\":1}' EX 317"
  - symptom: "Redis Hit Rate lao dốc nhưng số lượng bản ghi DB trả về hầu hết bằng 0 rows"
    badge: "Cache Penetration"
    tone: amber
    cause: "Bot hoặc luồng crawler quét tuần tự hàng triệu ID sản phẩm/coupon không tồn tại xuyên thẳng qua Redis xuống PostgreSQL."
    fix: "Khởi tạo `BF.RESERVE bf:valid_skus 0.01 1000000`, nạp tập ID hợp lệ vào Bloom Filter và chặn ngay mọi truy vấn có `BF.EXISTS == 0`."
    cmd: "BF.RESERVE bf:valid_skus 0.01 100000 && BF.EXISTS bf:valid_skus sku-999999"
  - symptom: "Toàn cụm Redis phản hồi Connection Refused kéo theo DB chết ngạt ngay lập tức"
    badge: "Node Failure Avalanche"
    tone: cyan
    cause: "Chạy Redis đơn lẻ (Single Point of Failure) không có Sentinel/Cluster và ứng dụng không có Circuit Breaker giới hạn tải đổ về DB."
    fix: "Triển khai Redis Sentinel/Cluster HA, bật bộ đệm nội bộ L1 ngắn hạn (in-memory LRU vài giây) và cài Rate Limiter/Circuit Breaker bảo vệ DB."
    cmd: "redis-cli INFO replication && redis-cli INFO memory"
```

- [+] **Công thức vàng cho `TTL Jitter`:** Đừng bao giờ viết cứng `ttl = 300`. Hãy luôn cộng thêm ==`10% – 20%` thời gian ngẫu nhiên== (`ttl = base_sec + random.randint(10, int(base_sec * 0.2))`) để rải đều thời điểm hết hạn êm ái theo thời gian!

## 4. Mẫu kết hợp 3 lớp khiên thực chiến (TypeScript / Node.js & Python)

Đoạn mã dưới đây minh họa cách ghép cả **Singleflight nội bộ + Khóa phân tán Redis + TTL Jitter** bảo vệ tuyệt đối cho PostgreSQL:

```ts
// TypeScript (ioredis): Singleflight trong tiến trình + Distributed Lock giữa các Pod + TTL Jitter
const inflightLocal = new Map<string, Promise<string | null>>();

export async function getHotDealWithShield(dealId: string): Promise<string | null> {
  const cacheKey = `cache:flash:${dealId}`;
  const cached = await redis.get(cacheKey);
  if (cached !== null) return cached === '__NULL__' ? null : cached;

  // Lớp 1: Singleflight gom hàng trăm request trùng khoá trên cùng 1 Pod
  if (inflightLocal.has(cacheKey)) return inflightLocal.get(cacheKey)!;

  const task = (async () => {
    const lockKey = `lock:rebuild:flash:${dealId}`;
    const token = crypto.randomUUID();
    // Lớp 2: Chỉ 1 Pod duy nhất chiếm được khoá mới xuống hỏi PostgreSQL!
    const won = await redis.set(lockKey, token, 'PX', 3000, 'NX');
    if (won === 'OK') {
      try {
        const row = await db.queryDeal(dealId);
        // Lớp 3: Negative Cache ngắn + TTL Jitter chống Avalanche
        const jitterSec = 300 + Math.floor(Math.random() * 60);
        await redis.set(cacheKey, row ? JSON.stringify(row) : '__NULL__', 'EX', row ? jitterSec : 45);
        return row ? JSON.stringify(row) : null;
      } finally {
        await releaseLockSafelyWithLua(lockKey, token);
      }
    }
    await new Promise((r) => setTimeout(r, 35));
    return redis.get(cacheKey);
  })().finally(() => inflightLocal.delete(cacheKey));

  inflightLocal.set(cacheKey, task);
  return task;
}
```

> [!REMEMBER] Ghi nhớ cốt lõi từ R10
> 1. ==Cache Stampede== (1 khóa nóng hết hạn, vạn người ập vào) -> Chặn bằng **Singleflight + Mutex `SET lock:... NX PX`** hoặc **Logical Expiration**.
> 2. ==Cache Penetration== (quét ID ma không tồn tại) -> Chặn bằng **Kiểm tra định dạng + Bloom Filter (`BF.EXISTS`) + Negative Cache TTL ngắn**.
> 3. ==Cache Avalanche== (hàng vạn khóa hết hạn cùng giây) -> Chặn bằng **TTL Jitter (`base + random`)**, bộ đệm L1 ngắn hạn và cụm Redis HA.

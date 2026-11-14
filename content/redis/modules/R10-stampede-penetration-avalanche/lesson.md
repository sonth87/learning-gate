# Tam đại Thảm hoạ Caching: Chống Stampede, Penetration & Avalanche

Một hệ thống chạy êm ru ở mức `20.000 req/s` với tỷ lệ trúng cache (*Cache Hit Ratio*) đạt `99,5%` thực chất đang giấu một quả bom nổ chậm: **PostgreSQL phía sau chỉ được cấp phát cấu hình đủ chịu đựng `200 truy vấn/giây`** (`0,5%` rò rỉ qua cache). Chỉ cần một biến cố nhỏ khiến tỷ lệ Cache Hit tụt từ `99,5%` xuống `80%` trong vỏn vẹn **3 giây**, lượng truy vấn dội xuống Database sẽ vọt lên `4.000 câu SQL/giây` — gấp 20 lần ngưỡng chịu tải, đốt cháy CPU `100%` và đánh sập dây chuyền toàn bộ nền tảng!

Trong lịch sử vận hành SRE quy mô lớn, mọi vụ sập Database xuyên qua tầng Redis đều quy về **Tam đại Thảm hoạ Caching**: {rose:Cache Stampede} (Đàn trâu điên), {amber:Cache Penetration} (Xuyên thủng bộ nhớ đệm) và {violet:Cache Avalanche} (Tuyết lở đồng loạt).

> [!ANALOGY] Ẩn dụ Trạm Soát Vé Sân Vận Động Đêm Chung Kết
> - **Cache Stampede (Hot Key Breakdown):** Đúng 19h00 bảng điện tử khổng lồ trước cổng chính tắt phụt 5 giây để cập nhật sơ đồ ghế → **10.000 khán giả đồng loạt lao vào một quầy lễ tân duy nhất** hỏi cùng một câu!
> - **Cache Penetration:** Kẻ phá đám thuê 5.000 người cầm vé giả mang mã số âm (`-99912`, `-88421`...) tới hỏi; vì bảng tra cứu không có mã này nên nhân viên cứ phải gọi bộ đàm vào phòng lưu trữ trung tâm kiểm tra từng tờ một!
> - **Cache Avalanche:** Ban tổ chức cài hẹn giờ cho **tất cả 50 bảng điện tử quanh sân cùng tự khởi động lại đúng lúc 20h00:00** → Toàn bộ đám đông ở mọi cửa tràn thẳng vào phòng điều hành cùng một tích tắc!

## 1. Nhận diện Giải phẫu Tam đại Thảm hoạ & Lá chắn Tương ứng

Để không bao giờ nhầm lẫn 3 khái niệm này trong thiết kế kiến trúc hay trong ca trực sự cố lúc 2 giờ sáng, hãy quan sát sơ đồ đối chiếu trực quan dưới đây:

```visual
kind: illustration
src: "/illustrations/redis/redis-cache-stampede-shield.jpg"
diagram: "redis:r10"
alt: "Lá chắn phòng thủ trước Tam đại Thảm hoạ Caching: Stampede, Penetration và Avalanche"
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

Hãy mổ xẻ cơ chế vật lý và công thức phòng thủ cho từng kịch bản:

## 2. Kịch bản #1: Cache Stampede (*Thundering Herd / Hot Key Breakdown*)

**Triệu chứng:** Chỉ **một khoá duy nhất có lưu lượng đọc cực lớn** (ví dụ `cache:flashsale:iphone16` hoặc cấu hình trang chủ `cache:home:hero`) vừa chạm mốc `TTL = 0`. Trong khoảng `40ms` mà truy vấn đầu tiên đang bận chạy SQL dưới Database chưa kịp `SET` lại vào Redis, `5.000` request khác ập tới cùng thấy `(nil)` và đồng loạt mở `5.000` truy vấn y hệt nhau xuống PostgreSQL!

- [>] **Vũ khí 1 — In-Process Singleflight + Distributed Mutex (`SET ... NX PX`):**
  1. Ở tầng Pod ứng dụng (Go `singleflight.Group` hoặc Map các `Promise` đang chạy trên Node.js), gom toàn bộ `500` request đồng thời trong cùng 1 Pod lại để dùng chung kết quả của 1 lời gọi mạng duy nhất.
  2. Giữa `20` Pod ứng dụng với nhau, tranh quyền dựng lại cache bằng khoá phân tán nguyên tử: `SET lock:rebuild:flashsale:99 <workerId> NX PX 3000`. Chỉ **duy nhất 1 Pod thắng cuộc** được phép gọi PostgreSQL rồi nạp `SET cache:flashsale:99 <json> EX 300`; các Pod thua cuộc ngủ ngắn `30–50ms` rồi đọc lại cache!
- [>] **Vũ khí 2 — Logical Expiration (*Hết hạn Logic - Không bao giờ xoá trắng Hot Key*):**
  Với khoá siêu nóng đêm Flash Sale, đặt TTL vật lý dài gấp 10 lần (ví dụ `3600s`) nhưng nhúng trường `logical_exp` (`now + 300s`) bên trong Hash/JSON. Khi `now > logical_exp`, khách hàng vẫn nhận ngay bản cũ trong `0.3ms`, chỉ ai chiếm được khoá `SET lock:rebuild:... NX PX` mới âm thầm chạy nền cập nhật lại!
- [>] **Vũ khí 3 — Thuật toán XFetch (*Probabilistic Early Expiration*):**
  Mỗi luồng đọc khi thấy khoá sắp hết hạn sẽ tự tung xúc xắc toán học theo hàm mũ `now - delta * beta * ln(rand()) >= expiry` để chủ động làm mới sớm trước khi khoá kịp chết thật.

## 3. Kịch bản #2: Cache Penetration (*Tấn công Xuyên thủng Bộ nhớ đệm*)

**Triệu chứng:** Hacker hoặc đối tác lỗi bắn hàng vạn truy vấn với `product_id = -1`, UUID ngẫu nhiên hoặc mã SKU không hề tồn tại **cả trong Redis lẫn trong PostgreSQL**. Vì Database trả về rỗng, Cache-Aside thông thường không lưu lại gì → tỷ lệ trượt cache vọt lên `100%` xuyên thẳng vào tim Database!

> [!TRAP] Tại sao chỉ dùng Negative Caching (`SET key "__NULL__" EX 45`) là CHƯA ĐỦ khi bị tấn công có chủ đích?
> Nếu kẻ tấn công sinh ngẫu nhiên **10 triệu UUID khác nhau** trong 5 phút và bạn ngoan ngoãn lưu Negative Cache cho từng UUID đó, kẻ tấn công không những chọc thủng lần đầu xuống DB mà còn **bơm đầy tràn RAM của Redis** bằng 10 triệu khoá rác `nil`, ép Redis phải trục xuất (*evict*) toàn bộ dữ liệu thật của khách hàng!

Giải pháp chuẩn Production là dựng **Lá chắn Bộ lọc Bloom (*Redis Bloom Filter*)** đứng ngay trước Redis Cache:

```ts
// Luồng đọc xuyên qua Lá chắn Bloom Filter + Singleflight
export async function getSkuSafely(skuId: string) {
  // Bước 0: Validate định dạng đầu vào ngay trên CPU (chặn âm, sai regex)
  if (!/^sku-\d{3,10}$/.test(skuId)) return null;

  // Bước 1: Hỏi Bloom Filter trên Redis (O(k) siêu nhẹ, ~9.6 bits/phần tử ở sai số 1%)
  const mightExist = await redis.bf.exists('bf:valid_skus', skuId);
  if (!mightExist) {
    // BF trả 0 => Chắc chắn 100% KHÔNG tồn tại trong DB! Chặn đứng ngay lập tức!
    return null;
  }

  // Bước 2: Đi vào luồng Cache-Aside + Negative Cache (cho 1% False Positive của Bloom)
  return readThroughSingleflightCache(skuId);
}
```

## 4. Kịch bản #3: Cache Avalanche (*Tuyết lở Bộ nhớ đệm Đồng loạt*)

**Triệu chứng:** Hàng chục ngàn khoá khác nhau **cùng hết hạn tại đúng một giây** (thường do Cronjob lúc 00:00 nạp lô `50.000` sản phẩm khuyến mãi với câu lệnh cứng nhắc `EX 3600`), HOẶC cả một phân vùng Redis sập nguồn chưa có Replica thay thế.

```visual
kind: troubleshoot
title: "Bảng Chẩn Đoán & Khắc Phục Nhanh Tam Đại Thảm Hoạ Caching [!badge:rose:SRE Playbook]"
subtitle: "Nhìn biểu đồ Metrics trên Grafana để phân biệt trúng bệnh trong 30 giây đầu tiên"
items:
  - symptom: "DB QPS dựng đứng theo nhịp từng nấc cố định (vd đúng mỗi 5 phút 1 gai nhọn)"
    badge: "Cache Stampede / Avalanche"
    tone: rose
    cause: "Một Hot Key khổng lồ vừa hết hạn (Stampede) hoặc Cronjob nạp hàng loạt khoá dùng chung một hằng số `EX 300` không có độ lệch ngẫu nhiên (Avalanche)."
    fix: "Thêm biến thiên ngẫu nhiên **TTL Jitter** (`baseTtl + randomInt(5, 60)`) cho mọi tác vụ nạp lô và bọc khoá nóng bằng Mutex `SET lock:rebuild:... NX PX 3000`."
    cmd: "SET cache:banner:top '{\"v\":1}' EX 317"
  - symptom: "Redis Hit Rate lao dốc nhưng số lượng bản ghi DB trả về hầu hết bằng 0 rows"
    badge: "Cache Penetration"
    tone: amber
    cause: "Bot hoặc luồng crawler quét tuần tự hàng triệu ID sản phẩm/coupon không tồn tại xuyên thẳng qua Redis xuống PostgreSQL."
    fix: "Khởi tạo `BF.RESERVE bf:valid_skus 0.01 1000000`, nạp tập ID hợp lệ vào Bloom Filter và chặn ngay mọi truy vấn có `BF.EXISTS == 0`."
    cmd: "BF.RESERVE bf:valid_skus 0.01 100000 && BF.EXISTS bf:valid_skus sku-999999"
  - symptom: "Toàn cụm Redis phản hồi Connection Refused kéo theo DB chết ngạt ngay lập tức"
    badge: "Node Failure Avalanche"
    tone: violet
    cause: "Chạy Redis đơn lẻ (Single Point of Failure) không có Sentinel/Cluster và ứng dụng không có Circuit Breaker giới hạn tải đổ về DB."
    fix: "Triển khai Redis Sentinel/Cluster HA, bật bộ đệm nội bộ L1 ngắn hạn (in-memory LRU 2 giây trên Pod) và cài Rate Limiter/Circuit Breaker bảo vệ DB."
    cmd: "redis-cli INFO replication && redis-cli INFO memory"
```

- [+] **Công thức vàng cho TTL Jitter:** Không bao giờ viết cứng `const ttl = 300;`. Hãy luôn viết hàm tiện ích `const withJitter = (baseSec: number) => baseSec + Math.floor(Math.random() * Math.max(10, baseSec * 0.2));` (cộng thêm `5%–20%` thời gian ngẫu nhiên) để trải đều đường cong hết hạn phẳng lặng theo thời gian!
- [!] **Bảo hiểm tầng cuối cùng cho Database:** Dù tầng Redis có thông minh đến đâu, ở phía trước Connection Pool của PostgreSQL luôn nên đặt một **Semaphore / Circuit Breaker** giới hạn số câu SQL dựng cache đồng thời để trong kịch bản tồi tệ nhất chỉ một phần request nhận lỗi `503 Retry-After` thay vì kéo sập toàn bộ Database.

## 5. Mẫu Triển Khai Kết Hợp: Singleflight + Distributed Mutex + TTL Jitter

Đoạn mã TypeScript thực chiến dưới đây kết hợp cả 3 lớp khiên cho một khoá siêu nóng trên môi trường nhiều Pod Kubernetes:

```ts
const inflightLocal = new Map<string, Promise<string | null>>();

export async function getHotDealWithShield(dealId: string): Promise<string | null> {
  const cacheKey = `cache:flash:${dealId}`;
  const cached = await redis.get(cacheKey);
  if (cached !== null) return cached === '__NULL__' ? null : cached;

  // Lớp 1: In-process Singleflight gom hàng trăm luồng trong cùng 1 Pod
  if (inflightLocal.has(cacheKey)) return inflightLocal.get(cacheKey)!;

  const task = (async () => {
    const lockKey = `lock:rebuild:flash:${dealId}`;
    const token = crypto.randomUUID();
    // Lớp 2: Distributed Mutex giữa 20 Pod (chỉ 1 Pod được xuống PostgreSQL!)
    const won = await redis.set(lockKey, token, 'PX', 3000, 'NX');
    if (won === 'OK') {
      try {
        const row = await db.queryDeal(dealId);
        // Lớp 3: Negative Cache ngắn hạn + TTL Jitter chống Avalanche
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
> 1. **Cache Stampede** (1 Hot Key hết hạn, vạn luồng ập vào) → Trị bằng **Singleflight + Mutex `SET lock:... NX PX`** hoặc **Logical Expiration** (không bao giờ xoá trắng Hot Key).
> 2. **Cache Penetration** (truy vấn ID không tồn tại xuyên thủng cả Cache lẫn DB) → Trị bằng **Validate đầu vào + Bloom Filter (`BF.RESERVE` / `BF.EXISTS`) + Negative Cache TTL ngắn**.
> 3. **Cache Avalanche** (vạn khoá chết cùng một tích tắc hoặc sập nút Redis) → Trị bằng **TTL Jitter** (`baseTTL + random`), **L1 In-Memory Cache** ngắn hạn và kiến trúc **Sentinel/Cluster HA**.

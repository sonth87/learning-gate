## 1. Khoảng cách tốc độ giữa bộ nhớ RAM và truy vấn Database

```step
category: SETUP
short: Chênh lệch I/O
scene: s1-no-cache
callout:
  kind: key-idea
  title: Khai thác độ lệch truy cập
  vi: "Trong hầu hết sản phẩm thực tế, một tỷ lệ nhỏ bản ghi phổ biến chiếm phần lớn lượt xem. Đọc đi đọc lại chúng từ đĩa cứng là lãng phí công suất lớn nhất."
whatChanged:
  - "+ Chưa có tầng đệm: toàn bộ 3.600 req/s đi thẳng xuống Database 1.500 req/s"
  - "~ Database chạm ngưỡng quá tải trong khi phần lớn truy vấn lặp lại cùng kết quả"
telemetry:
  - label: "Truy xuất RAM"
    value: "≈ 0,1–0,5 ms"
    tone: ok
  - label: "Truy vấn DB (SSD)"
    value: "≈ 5–50 ms"
    tone: warn
  - label: "ρ của Database"
    value: "> 1,00 (nghẽn)"
    tone: bad
```

Truy xuất dữ liệu trực tiếp trong bộ nhớ RAM nhanh hơn đọc đĩa SSD và xử lý cây chỉ mục Database từ hàng chục đến hàng trăm lần. Khi chưa có bộ nhớ đệm, mỗi lượt tải trang sản phẩm hot đều bắt Database phân tích câu lệnh SQL, đọc trang dữ liệu và trả kết quả giống hệt lần gọi một mili-giây trước đó.

Bộ nhớ đệm (**Cache**) nên được đặt khi thoả mãn bốn điều kiện: tỷ lệ đọc áp đảo tỷ lệ ghi (ví dụ `> 85%` đọc), cùng một khoá được hỏi lặp lại nhiều lần, truy vấn gốc tốn tài nguyên, và nghiệp vụ chấp nhận độ trễ cập nhật ngắn hoặc có cơ chế xoá khoá khi dữ liệu đổi.

## 2. Mô hình Cache-Aside (Lazy Loading) ở tầng ứng dụng

```step
category: TECHNIQUE
short: Cache-Aside
scene: s2-cache-aside
callout:
  kind: good-to-know
  vi: "Cache nằm ở nhiều lớp từ trình duyệt, CDN tới Database, nhưng Application Cache (như Redis, Memcached) là lớp kỹ sư kiểm soát linh hoạt nhất."
whatChanged:
  - "+ Đặt cụm Redis Cache giữa App Tier và Database theo mẫu Cache-Aside"
  - "~ Lượt Cache Hit trả về ngay sau ~0,5 ms; chỉ lượt Miss mới chạm Database"
telemetry:
  - label: "Độ trễ Cache Hit"
    value: "≈ 0,5 ms"
    tone: ok
  - label: "Độ trễ Cache Miss"
    value: "Cache + DB + ghi lại"
    tone: warn
```

Chiến lược phổ biến nhất trong thực tế là **Cache-Aside (nạp lười)**: ứng dụng tự đứng ra điều phối giữa Cache và Database.

```python
def get_product(product_id: int) -> dict:
    key = f"product:{product_id}"
    cached = cache.get(key)
    if cached is not None:
        return json.loads(cached)          # Cache Hit (~0,5 ms)

    row = db.query_one("SELECT * FROM products WHERE id = %s", product_id)
    cache.setex(key, 300, json.dumps(row)) # Nạp kèm TTL 300 giây
    return row
```

Ưu điểm lớn của Cache-Aside là RAM chỉ lưu những bản ghi thực sự có người hỏi, và nếu nút Cache tạm thời gặp sự cố kết nối thì ứng dụng vẫn có thể rơi về đọc Database (chậm hơn nhưng không ngừng hoạt động hoàn toàn, miễn là Database còn chịu nổi tải).

## 3. Toán học của Hit Ratio: nâng từ 80% lên 95% giảm 4 lần tải đọc DB

```step
category: MECHANISM
short: Toán Hit Ratio
scene: s3-hit-math
callout:
  kind: key-idea
  title: Theo dõi Miss Ratio thay vì chỉ nhìn Hit Ratio
  vi: "Tải đọc rơi xuống Database tỷ lệ với Miss Ratio = 1 − Hit Ratio. Từ 80% lên 95% nghe chỉ tăng 15 điểm phần trăm, nhưng Miss Ratio giảm từ 20% xuống 5%, tức giảm 4 lần."
whatChanged:
  - "~ Ở 5.000 req/s (92% đọc): nâng dung lượng Cache từ 10.000 lên 40.000 key"
  - "~ Hit Ratio tăng từ 47% lên 93%; lưu lượng xuống DB giảm từ 2.855 còn 710 req/s"
telemetry:
  - label: "Hit Ratio (40k key)"
    value: "≈ 93%"
    tone: ok
  - label: "Tải xuống DB"
    value: "≈ 710 req/s"
    tone: ok
  - label: "ρ của Database"
    value: "0,47"
    tone: ok
```

Gọi $r$ là tỷ lệ lượt đọc và $h$ là **Cache Hit Ratio** trên lượt đọc. Khi mọi lượt ghi $(1 - r)$ đều phải vào Database, lưu lượng thực tế chạm Database là:

$$\lambda_{\text{DB}} = \lambda \cdot \bigl[\,r \cdot (1 - h) + (1 - r)\,\bigr]$$

Xét hệ thống của bài ở đỉnh $\lambda = 5.000\text{ req/s}$ với $r = 0{,}92$ và $\mu_{\text{DB}} = 1.500\text{ req/s}$:
- Khi Cache quá nhỏ (`10.000 / 40.000` key đang hoạt động), Hit Ratio chỉ đạt $h \approx 0{,}47$: tải xuống DB bằng $5.000 \times (0{,}92 \times 0{,}53 + 0{,}08) \approx 2.838\text{ req/s}$ ($\rho \approx 1{,}89$, quá tải nặng).
- Khi cấp đủ RAM cho `40.000` key, Hit Ratio vọt lên $h \approx 0{,}93$: tải xuống DB chỉ còn $5.000 \times (0{,}92 \times 0{,}07 + 0{,}08) \approx 722\text{ req/s}$ ($\rho \approx 0{,}48$, chạy êm mà không cần nâng cấp phần cứng Database).

## 4. Mô phỏng tải 800 → 5.000 req/s: đo trần chịu tải theo Hit Ratio

```step
category: TECHNIQUE
short: Đo trần tải
scene: s4-live-hit
live: hit_ratio
activity: S2-02.A2
gate: optional
callout:
  kind: technique
  title: Kéo núm capacityKeys để kiểm chứng
  vi: "Thử giữ nguyên 10.000 key để tìm ngưỡng bão hoà của Database, sau đó tăng capacityKeys lên 40.000 để thấy cùng máy Database đó vượt nhẹ nhàng mốc 5.000 req/s."
whatChanged:
  - "~ Lưu lượng tăng dần từ 800 lên 5.000 req/s trong 50 giây"
  - "~ Với 10.000 key (Hit ≈ 47%), Database bão hoà ngay quanh mốc 2.545 req/s"
telemetry:
  - label: "Hit Ratio gốc"
    value: "≈ 47%"
    tone: warn
  - label: "Trần tải gốc"
    value: "≈ 2.540 req/s"
    tone: warn
```

Hãy quan sát mô phỏng tăng tải `S2-02/hit-ratio` và thực hiện bài tập tìm ngưỡng lưu lượng bền vững tối đa khi Cache mới chứa được một phần tư tập khoá đang hoạt động (*Working Set*).

Điểm rút ra khi định cỡ bộ nhớ đệm: bạn không cần nhét toàn bộ hàng trăm triệu dòng trong ổ cứng vào RAM, nhưng dung lượng RAM của Cache phải đủ chứa trọn **Working Set nóng** trong khung thời gian hiện hành để tránh bị trục xuất liên tục.

## 5. Chiến lược ghi và làm mới dữ liệu (TTL & Invalidation)

```step
category: MECHANISM
short: Ghi & xoá khoá
scene: s5-write-strategies
callout:
  kind: compare
  title: Kết hợp xoá chủ động với hạn sống TTL
  vi: "Xoá khoá ngay khi cập nhật DB giúp người dùng thấy dữ liệu mới tức thì; TTL đóng vai trò chốt chặn tự dọn dẹp nếu gói tin xoá Cache chẳng may thất lạc."
whatChanged:
  - "+ Cập nhật bản ghi: ghi vào Database trước, sau đó gọi DELETE xoá khoá trên Cache"
  - "+ Luôn gắn TTL phù hợp theo tốc độ biến động của từng loại dữ liệu"
telemetry:
  - label: "Danh mục sản phẩm"
    value: "TTL 1–24 giờ"
  - label: "Hồ sơ người dùng"
    value: "TTL 10–30 phút"
  - label: "Bảng xếp hạng nóng"
    value: "TTL 10–60 giây"
```

Ba chiến lược đồng bộ giữa Cache và Database khi có thao tác ghi có đánh đổi rất rõ ràng:

| Chiến lược | Cơ chế khi ghi | Ưu điểm | Đánh đổi |
|---|---|---|---|
| **Cache-Aside + Delete** | Ghi DB xong rồi xoá khoá trên Cache | Đơn giản, tránh nạp sẵn dữ liệu không ai đọc | Lượt đọc đầu tiên sau khi xoá chịu độ trễ Miss |
| **Write-Through** | Ghi đồng bộ cả DB lẫn Cache trong cùng thao tác | Dữ liệu trên Cache luôn tươi mới | Thao tác ghi chậm hơn, tốn RAM cho bản ghi ít đọc |
| **Write-Behind** | Ghi vào Cache trả lời ngay, đẩy hàng đợi ghi DB sau | Chịu tải ghi cực nhanh | Rủi ro mất dữ liệu nếu Cache sập trước khi xả xuống DB |

Với dữ liệu tĩnh (ảnh, tệp CSS/JS, cấu hình), cách sạch nhất là **đánh phiên bản vào tên khoá** (ví dụ `catalog:v42`): khi phát hành bản mới chỉ cần tăng số phiên bản, khoá cũ tự hết hạn theo TTL mà không sợ đọc nhầm.

## 6. Hiện tượng Cache Stampede (Thundering Herd)

```step
category: PROBLEM
short: Cache Stampede
scene: s6-stampede
activity: S2-02.A1
gate: optional
callout:
  kind: watch-out
  title: Khi bộ nhớ đệm phản tác dụng
  vi: "Hệ thống đã quen mở rộng tầng App theo mức tải sau khi có Cache (80%–95% Hit). Một giây mất lớp khiên đó đủ để đánh gục Database ngay lập tức."
whatChanged:
  - "~ Lô khoá nóng được nạp cùng thời điểm nên chạm mốc hết hạn TTL cùng một giây"
  - "~ 3.600 req/s đồng loạt gặp Cache Miss và dội thẳng xuống Database 1.500 req/s"
telemetry:
  - label: "Lưu lượng vào DB"
    value: "880 vọt lên 3.600 req/s"
    tone: bad
  - label: "ρ của Database"
    value: "2,40 (quá tải)"
    tone: bad
```

**Cache Stampede (hay Thundering Herd)** xảy ra trong hai tình huống điển hình:
1. Một khoá cực nóng (ví dụ trang chủ sự kiện khuyến mãi đang nhận `3.000 req/s`) vừa chạm mốc hết hạn TTL hoặc vừa bị xoá. Trước khi request đầu tiên kịp đọc Database (`50 ms`) để ghi lại vào Cache, đã có thêm `150` request khác cùng thấy Cache trống và cùng lao xuống chạy câu SQL nặng y hệt nhau.
2. Hàng chục nghìn khoá được nạp hàng loạt lúc khởi động (*batch warm-up*) với cùng hằng số `TTL = 60 giây`, dẫn tới việc cứ mỗi 60 giây cả kho khoá lại bốc hơi cùng một khoảnh khắc.

## 7. Hai lớp phòng vệ chống Stampede: TTL Jitter và Singleflight

```step
category: TECHNIQUE
short: Jitter & khóa
scene: s7-mitigation
callout:
  kind: key-idea
  title: Hai cơ chế giải quyết hai nguyên nhân khác nhau
  vi: "TTL Jitter phá vỡ sự đồng bộ thời gian giữa nhiều khoá; Singleflight gộp các request trùng nhau trên cùng một khoá thành duy nhất một truy vấn Database."
whatChanged:
  - "+ Cộng độ lệch ngẫu nhiên ±20%–25% vào TTL mỗi lần ghi khoá vào Cache"
  - "+ Bật Singleflight hợp nhất các lượt đọc đồng thời khi khoá đang nạp lại"
telemetry:
  - label: "Truy vấn DB / khoá Miss"
    value: "Chỉ 1 truy vấn"
    tone: ok
  - label: "ρ đỉnh của DB"
    value: "0,79 (dưới ngưỡng)"
    tone: ok
```

Để triệt tiêu hoàn toàn Cache Stampede mà không cần mua máy Database khổng lồ, ta kết hợp hai kỹ thuật nhẹ ở phần mềm:

```python
def set_with_jitter(key: str, val: str, base_ttl: int = 60, jitter: float = 0.25):
    # Rải ngẫu nhiên TTL trong khoảng [45s, 75s] để không hết hạn cùng nhịp
    actual_ttl = int(base_ttl * random.uniform(1 - jitter, 1 + jitter))
    cache.setex(key, actual_ttl, val)
```

- **TTL Jitter:** Cộng trừ ngẫu nhiên `15%–25%` vào thời gian hết hạn, biến vách đá hết hạn đồng loạt thành dòng làm mới rải đều êm ái theo thời gian.
- **Singleflight (Request Coalescing / Mutex Lock):** Khi khoá `product:99` bị Miss, chỉ luồng đầu tiên giành được cờ nạp (`SET lock:product:99 1 NX EX 5`) đi truy vấn Database; các luồng đến cùng mili-giây chờ nhận chung kết quả vừa nạp (hoặc trả tạm bản cũ *Stale-While-Revalidate* trong lúc một luồng nền làm mới).

## 8. Thử thách mô phỏng: dập bão Cache Stampede ở giây 25

```step
category: PITFALL
short: Sửa Stampede
scene: s8-live-stampede
live: stampede
activity: S2-02.A3
gate: required
callout:
  kind: watch-out
  title: Thuê máy DB to gấp đôi không bằng vài dòng hợp nhất truy vấn
  vi: "Nâng cỡ máy Database tốn kém liên tục 24/7 chỉ để đỡ vài giây hết hạn Cache, trong khi Singleflight và TTL Jitter giải quyết tận gốc với chi phí phần cứng bằng 0."
whatChanged:
  - "~ Kịch bản S2-02/stampede ở 3.600 req/s gặp sự kiện xoá trắng khoá tại giây 25"
  - "~ Chỉnh tối đa 2 tham số với chi phí ≤ 1,65 USD/giờ để giữ p99 ≤ 120 ms"
telemetry:
  - label: "Sự kiện giây 25"
    value: "cache-expire-all"
    tone: bad
  - label: "Ngân sách chi phí"
    value: "≤ 1,65 USD/giờ"
    tone: warn
  - label: "SLO p99 / lỗi"
    value: "≤ 120 ms · ≤ 1%"
    tone: ok
```

Trong kịch bản `S2-02/stampede`, hệ thống đang chạy ở chi phí `1,58 USD/giờ`. Đúng giây `25`, sự kiện hết hạn toàn cục xảy ra làm tỷ lệ lỗi vọt lên gần `100%` tại đỉnh và kéo dài hàng chục giây khi hàng đợi Database bị ngập.

Hãy dùng bảng điều khiển của bài tập để kích hoạt đúng hai cơ chế bảo vệ trên **Redis Cache**, đưa hệ thống vượt qua giây `25` êm ái mà không tốn thêm đồng chi phí hạ tầng nào.

## 9. Trục xuất bộ nhớ (LRU) và chống xuyên thủng Cache Penetration

```step
category: PITFALL
short: LRU & lọc rỗng
scene: s9-penetration
callout:
  kind: good-to-know
  vi: "Không nên cache dữ liệu ghi dồn dập từng giây (như bộ đếm lượt xem thô) hoặc dữ liệu cá nhân hoá chỉ đọc 1 lần/ngày vì Hit Ratio gần bằng 0 mà làm trôi khoá nóng."
whatChanged:
  - "+ Chính sách trục xuất LRU giữ lại khoá hay đọc khi RAM chạm ngưỡng"
  - "+ Lưu kết quả rỗng ngắn hạn + Bloom Filter chặn truy vấn ID không tồn tại"
telemetry:
  - label: "Chính sách đầy RAM"
    value: "allkeys-lru / lfu"
  - label: "TTL cho giá trị NULL"
    value: "30–60 giây"
    tone: ok
```

Ngoài Stampede, còn hai tình huống vận hành thực tế cần kiểm soát ở tầng Cache:

1. **Chính sách trục xuất (Eviction Policy):** Bộ nhớ RAM luôn hữu hạn. Khi đầy dung lượng, cấu hình **LRU (Least Recently Used)** hoặc **LFU (Least Frequently Used)** giúp tự động loại bỏ các khoá nguội ít người hỏi để nhường chỗ cho khoá nóng, thay vì trả lỗi từ chối ghi mới (`noeviction`).
2. **Cache Penetration (xuyên thủng bộ nhớ đệm):** Nếu client (hoặc bot quét dữ liệu) liên tục hỏi các `id` không hề tồn tại trong Database, Cache-Aside mặc định thấy DB trả rỗng nên không lưu gì — khiến `100%` lượt hỏi sau tiếp tục xuyên thẳng xuống DB. Cách chắn là **lưu cả giá trị đánh dấu rỗng** (`NULL` sentinel) với TTL ngắn (`30–60 giây`) hoặc đặt một bộ lọc xác suất **Bloom Filter** gọn nhẹ trên RAM để từ chối ngay các khoá chắc chắn chưa từng được tạo.

## 10. Tóm tắt: danh sách kiểm tra khi thiết kế tầng Caching

```step
category: RECAP
short: Tóm tắt
scene: s10-recap
callout:
  kind: key-idea
  title: Cache là lá chắn thông lượng, không phải kho lưu trữ chính
  vi: "Luôn thiết kế để dữ liệu gốc nằm an toàn ở Database, còn Cache đảm nhận gánh tải đọc với Hit Ratio cao, TTL có Jitter và khoá hợp nhất Singleflight."
whatChanged:
  - "+ Tổng kết công thức Hit Ratio, chiến lược xoá khoá và bộ đôi chống Stampede"
telemetry:
  - label: "Chỉ số cốt lõi"
    value: "Hit Ratio & Evictions"
    tone: ok
  - label: "Bộ đôi bảo vệ DB"
    value: "TTL Jitter + Singleflight"
    tone: ok
```

Bốn nguyên tắc cốt lõi cần nắm vững khi đưa Caching vào hệ thống:

1. **Tính tải Database qua Miss Ratio:** Lưu lượng đọc chạm Database tỷ lệ với $(1 - h)$; nâng Hit Ratio từ `80%` lên `95%` cắt giảm `75%` áp lực đọc trên Database.
2. **Mặc định dùng Cache-Aside + Xoá khoá + TTL:** Đọc kiểm tra Cache trước; khi cập nhật thì ghi Database rồi xoá khoá trên Cache, luôn kèm TTL làm lưới an toàn giới hạn độ trễ nhất quán.
3. **Chống Cache Stampede ngay từ thiết kế:** Gắn độ lệch ngẫu nhiên **TTL Jitter** để các khoá không hết hạn đồng pha và dùng **Singleflight** (hoặc *Stale-While-Revalidate*) cho các khoá có độ đồng thời cao.
4. **Giám sát liên tục ba con số:** `Hit Ratio`, tốc độ trục xuất `Eviction Rate` (báo hiệu thiếu RAM cho Working Set) và độ trễ đuôi `p99` của chính cụm Cache.

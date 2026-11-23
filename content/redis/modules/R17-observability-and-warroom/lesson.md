# Observability, Metrics & Chẩn đoán Sự cố Production Redis (SRE Playbook)

> [!NOTE] Khái niệm cốt lõi & Quy trình chẩn đoán
> Trong **Mô-đun Tổng kết (`R17`)**, bạn sẽ tổng hợp toàn bộ kiến thức về cấu trúc dữ liệu, Caching, Lua, Sentinel, Cluster và ACL thành **quy trình giám sát hệ thống (*Observability*) và chẩn đoán sự cố (*SRE Triage*)** thông qua 4 công cụ chính:
> - **`INFO stats` & `INFO memory`:** Cung cấp thông số vận hành tổng quan như số lệnh mỗi giây (`instantaneous_ops_per_sec`), mức sử dụng RAM so với `maxmemory`, tỷ lệ phân mảnh và số khóa bị thu hồi (`evicted_keys`).
> - **`SLOWLOG GET`:** Ghi lại danh sách các câu lệnh có thời gian thực thi CPU vượt ngưỡng cấu hình (mặc định `10 mili-giây`) để xác định lệnh `O(N)` gây nghẽn Event Loop.
> - **`LATENCY DOCTOR` & `MEMORY DOCTOR`:** Công cụ phân tích tích hợp sẵn trong Redis giúp phát hiện nguyên nhân gây tăng độ trễ (như `fork()`, `AOF fsync`, `eviction`) hoặc bất thường bộ nhớ kèm khuyến nghị xử lý.
> - **`Bigkeys`:** Các khóa đơn lẻ có kích thước hoặc số phần tử quá lớn (hàng triệu phần tử) gây tăng đột biến độ trễ khi đọc toàn bộ hoặc xóa đồng bộ.

## 1. Bản Đồ Tín Hiệu Vàng & Lưu Đồ Ứng Cứu Sự Cố 120 Giây

```visual
kind: illustration
diagram: "redis:r17"
alt: "Bảng điều khiển Observability Redis Exporter Prometheus và quy trình chẩn đoán SRE Playbook 5 nhánh sự cố"
badge: "Capstone SRE Playbook · R17"
title: "Giám Sát SRE: Bốn Tín Hiệu Vàng & Quy Trình Chẩn Đoán Sự Cố"
subtitle: "Kết nối dữ liệu đo lường từ INFO / SLOWLOG / LATENCY DOCTOR sang Prometheus Alertmanager và quy trình khắc phục tức thời"
caption: "Mọi sự cố Redis phức tạp đều để lại dấu vết rõ ràng trên 4 nhóm chỉ số: Latency, Saturation (Memory/CPU), Hit Ratio và Replication/Cluster State."
callouts:
  - num: 1
    label: "Golden Signals (Prometheus redis_exporter)"
    desc: "Theo dõi sát 5 chỉ số cốt lõi: CPU main-thread, Memory Usage vs Maxmemory, Cache Hit Rate (dùng hàm rate 5m), Evicted/Rejected Keys và Replication Lag."
    tone: cyan
  - num: 2
    label: "Ba Công Cụ Chẩn Đoán Trực Tiếp (SLOWLOG, LATENCY, MEMORY)"
    desc: "Chạy SLOWLOG GET 10 tìm lệnh O(N), LATENCY DOCTOR bắt gai trễ do fork()/AOF fsync, và MEMORY USAGE / --bigkeys tìm đối tượng phình to bất thường."
    tone: amber
  - num: 3
    label: "Vá Nóng Không Gián Đoạn (Zero-Downtime Mitigation)"
    desc: "Thay KEYS bằng SCAN, xoá Bigkey bằng UNLINK + lazyfree, đổi chính sách Eviction bằng CONFIG SET, thu hồi PEL bằng XAUTOCLAIM và sửa CROSSSLOT bằng {HashTag}."
    tone: emerald
```

## 2. Ba chỉ số giám sát Redis dễ bị hiểu nhầm trong thực tế

Trước khi bắt tay vào xử lý sự cố, cần nắm rõ 3 đặc điểm đo lường sau để tránh xác định sai nguyên nhân gốc:

- [!] **Lưu ý #1 — ==`SLOWLOG` chỉ đo thời gian thực thi CPU trên Redis, KHÔNG đo thời gian chờ mạng hay xếp hàng!==**
  - Giả sử ứng dụng Python/Node.js báo lỗi *"Lệnh `GET user:1` mất tới `500ms`!"*, nhưng bạn mở `SLOWLOG GET 10` không thấy lệnh `GET` mà chỉ thấy 1 lệnh `KEYS *` tốn `498,000 µs` (`498ms`). Điều đó có nghĩa là lệnh `GET` chỉ chạy mất `0.002ms`, nhưng nó bị **chờ `498ms` trong hàng đợi phía sau lệnh `KEYS *`**! (Còn nếu `SLOWLOG` trống mà ứng dụng vẫn chậm, nguyên nhân thường nằm ở nghẽn mạng, thiếu kết nối trong Connection Pool của ứng dụng, hoặc hệ điều hành đang dùng Swap — hãy kiểm tra bằng `LATENCY DOCTOR`).
- [!] **Lưu ý #2 — Không tính tỷ lệ trúng Cache (*Hit Ratio*) bằng số liệu cộng dồn từ lúc khởi động:**
  Trong `INFO stats`, `keyspace_hits` là bộ đếm cộng dồn liên tục. Nếu máy chủ đã chạy 90 ngày tích lũy 10 tỷ lượt trúng, hôm nay dù Cache bị giảm mạnh suốt 30 phút thì phép chia tổng vẫn hiển thị `99.8%`! Trên Prometheus/Grafana, **bắt buộc đo tốc độ tức thời trong cửa sổ 5 phút gần nhất bằng hàm ==`rate(...[5m])`==**:
  ```promql
  # Cảnh báo khi tỷ lệ trúng Cache thực tế trong 5 phút qua tụt xuống dưới 85%
  (
    rate(redis_keyspace_hits_total[5m])
    /
    clamp_min(rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m]), 1)
  ) < 0.85
  ```
- [!] **Lưu ý #3 — Không đánh giá tải Redis dựa trên CPU trung bình toàn máy chủ nhiều nhân:**
  Vì luồng thực thi lệnh dữ liệu của Redis là **đơn luồng**, trên máy chủ 32 nhân CPU, khi 1 nhân chạy luồng chính của Redis đã chạm trần **`100%` (bão hòa hoàn toàn)**, biểu đồ trung bình cả máy 32 nhân chỉ hiện `1 / 32 = 3.1%`! Luôn theo dõi mức CPU riêng của tiến trình `redis-server`.

## 3. Quy trình xử lý 5 sự cố Redis phổ biến trên môi trường Production

```visual
kind: troubleshoot
title: "Bảng Chẩn Đoán & Khắc Phục 5 Sự Cố Redis Phổ Biến [!badge:rose:SRE Playbook]"
subtitle: "Quy trình chuẩn 2 bước: Khám nghiệm bằng lệnh Chẩn đoán -> Áp dụng bản vá trực tuyến không gây gián đoạn"
items:
  - symptom: "Ca #1: Độ trễ p99 toàn bộ API vọt lên >200ms theo chu kỳ, CPU luồng chính chạm đỉnh 100%"
    badge: "O(N) Command Freeze"
    tone: rose
    cause: "Một tác vụ định kỳ hoặc trang quản trị đang gọi `KEYS session:*` trên hàng triệu khoá, khoá cứng Event Loop suốt hàng trăm mili-giây."
    fix: "Bắt quả tang qua `SLOWLOG GET 5`, thay thế `KEYS` bằng con trỏ lặp `SCAN 0 MATCH session:* COUNT 100` và khoá `-keys` trong ACL."
    cmd: "SLOWLOG GET 5 && SCAN 0 MATCH session:* COUNT 100"
  - symptom: "Ca #2: Mỗi lần xoá khoá báo cáo tạm, toàn cụm khựng lại 800ms"
    badge: "Bigkey Synchronous DEL"
    tone: amber
    cause: "Gọi lệnh `DEL` đồng bộ lên một Set/Hash/ZSet khổng lồ hàng triệu phần tử khiến luồng chính phải dừng lại thu hồi bộ nhớ tại chỗ."
    fix: "Kiểm tra dung lượng bằng `MEMORY USAGE <key>`, xoá bất đồng bộ ở luồng nền bằng `UNLINK <key>` và bật `CONFIG SET lazyfree-lazy-expire yes`."
    cmd: "MEMORY USAGE temp:export:2025 && UNLINK temp:export:2025"
  - symptom: "Ca #3: Ứng dụng văng lỗi hàng loạt `OOM command not allowed when used memory > 'maxmemory'`"
    badge: "Cache Misconfigured noeviction"
    tone: rose
    cause: "Máy chủ Redis chỉ dùng làm Cache nhưng để quên chính sách mặc định `noeviction` nên khi đầy RAM đã từ chối mọi lệnh ghi mới."
    fix: "Kiểm tra `CONFIG GET maxmemory-policy`, chuyển nóng sang `allkeys-lfu` kèm `lazyfree-lazy-eviction yes` để tự đào thải khoá ít dùng."
    cmd: "INFO memory && CONFIG GET maxmemory-policy"
  - symptom: "Ca #4: RAM của Stream tăng không phanh, hàng ngàn đơn hàng treo lơ lửng không được xử lý"
    badge: "Streams PEL Consumer Leak"
    tone: cyan
    cause: "Worker bị sập giữa chừng sau khi nhận việc qua `XREADGROUP`, để lại các bản tin nằm kẹt mãi trong sổ chờ `XPENDING` (PEL)."
    fix: "Kiểm tra `XPENDING <stream> <group> - + 10`, dùng `XAUTOCLAIM` thu hồi các tin treo quá 60 giây về worker khoẻ mạnh xử lý rồi gọi `XACK`."
    cmd: "XPENDING orders:stream payment-cg - + 10"
  - symptom: "Ca #5: Giao dịch đa khoá hoặc Lua báo lỗi `CROSSSLOT Keys in request don't hash to the same slot`"
    badge: "Cluster HashSlot Mismatch"
    tone: cyan
    cause: "Khi chạy trên Redis Cluster, các khoá của cùng 1 giỏ hàng (`cart:user88:items` và `cart:user88:totals`) băm ra 2 ngăn Slot khác nhau."
    fix: "Kiểm tra bằng `CLUSTER KEYSLOT` và chuẩn hoá lại tên khoá gắn `{HashTag}` theo đối tượng: `cart:{user88}:items` và `cart:{user88}:totals`."
    cmd: "CLUSTER KEYSLOT cart:{user88}:items"
```

## 4. Bộ lệnh Kiểm tra Nhanh 30 Giây (Hoàn toàn an toàn, chỉ đọc)

Khi bước vào bất kỳ máy chủ Redis nào đang có cảnh báo, hãy bình tĩnh chạy chuỗi lệnh an toàn sau (tuyệt đối **không bao giờ chạy lệnh `MONITOR` trên máy chủ Production đang chịu tải cao** vì `MONITOR` nhân bản mọi câu lệnh ra màn hình sẽ làm giảm tới 50% hiệu năng!):

```bash
# 1. Xem nhanh sức khoẻ tổng quan: bộ nhớ, lưu lượng, tỉ lệ đào thải & trạng thái bản sao
redis-cli INFO server
redis-cli INFO memory
redis-cli INFO stats
redis-cli INFO replication

# 2. Bắt ngay 10 câu lệnh chậm nhất vừa chạy trên luồng chính (> 10ms)
redis-cli SLOWLOG LEN
redis-cli SLOWLOG GET 10

# 3. Nhờ bác sĩ tích hợp phân tích gai độ trễ & vấn đề bộ nhớ
redis-cli LATENCY DOCTOR
redis-cli MEMORY DOCTOR

# 4. Tìm khoá phình to bất thường (luôn chạy trên nút Replica kèm nghỉ 50ms giữa các nhịp SCAN!)
redis-cli -h replica-node --bigkeys -i 0.05
```

## 5. Bộ Quy tắc Cảnh báo Chủ động Prometheus & Kỷ luật Hậu sự cố

```yaml
groups:
  - name: redis-sre-golden-alerts
    rules:
      - alert: RedisMemoryNearExhaustion
        expr: (redis_memory_used_bytes / redis_memory_max_bytes) > 0.88 and redis_memory_max_bytes > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "RAM của Redis vượt 88% maxmemory (nguy cơ đầy bộ nhớ hoặc đào thải ồ ạt)"

      - alert: RedisSlowlogSpike
        expr: increase(redis_slowlog_last_id[2m]) > 15
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Xuất hiện >15 câu lệnh chậm O(N) làm nghẽn luồng chính trong 2 phút qua!"
```

> [!WARNING] Lưu ý sau khi xử lý sự cố: Lưu cấu hình bằng `CONFIG REWRITE`
> Nếu bạn vừa chữa cháy trực tiếp trên RAM bằng lệnh ==`CONFIG SET maxmemory-policy allkeys-lfu`==, thay đổi đó **chưa tự lưu vào file cấu hình trên ổ đĩa**! Hãy chạy thêm **`CONFIG REWRITE`** (hoặc cập nhật ngay tệp cấu hình trên Git / Helm / Docker Compose) để lần khởi động lại sau hệ thống không bị quay về cấu hình lỗi cũ.

> [!REMEMBER] Đúc kết trọn vẹn hành trình Redis Mastery (R00 → R17)
> 1. **Tôn trọng luồng đơn siêu tốc:** Giữ mọi câu lệnh và kịch bản Lua gọn nhẹ dưới vài micro-giây; luôn dùng **`SCAN`** thay cho `KEYS` và **`UNLINK` + `lazyfree`** thay cho `DEL` trên khóa lớn.
> 2. **Đọc đúng bệnh qua số liệu:** Kết hợp **`INFO`**, **`SLOWLOG GET`**, **`LATENCY DOCTOR`** và đo Hit Ratio theo cửa sổ trượt `rate(...[5m])` (tránh gõ `MONITOR` lúc cao điểm!).
> 3. **Kiến trúc vững vàng từ gốc:** Phòng thủ Database bằng **Singleflight + Bloom Filter + TTL Jitter**, chọn đúng **Eviction (`allkeys-lfu` vs `noeviction`) + Hybrid AOF**, mở rộng bằng **Sentinel / Cluster `{HashTag}`** và khóa chặt với **Zero-Trust TLS + ACL**.

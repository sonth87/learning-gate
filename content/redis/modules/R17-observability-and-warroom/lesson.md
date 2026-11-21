# Observability, Metrics & Chẩn đoán Sự cố Production Redis (SRE Playbook)

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Chào mừng bạn đến với **Mô-đun Tổng kết (`R17`)** của hành trình **Redis Mastery**! Sau khi đã nắm trọn từ nguyên lý RAM đơn luồng, cấu trúc dữ liệu, mẫu Caching, khóa Lua cho tới Sentinel, Cluster và bảo mật ACL, kỹ năng cuối cùng biến bạn thành người giữ nhịp đáng tin cậy của cả đội ngũ chính là **Quan sát sức khỏe hệ thống (*Observability*) & Phác đồ Chẩn đoán Nhanh trong 120 giây (*SRE Triage*)**.
>
> Hãy hình dung việc khám một máy chủ Redis đang chậm bất thường lúc 2 giờ sáng giống hệt **Bác sĩ Cấp cứu đọc màn hình theo dõi bệnh nhân**:
> - **`INFO stats` & `INFO memory` (Nhịp tim & Huyết áp tổng quát):** Cho biết mỗi giây Redis đang xử lý bao nhiêu lệnh, RAM đã đầy bao nhiêu phần trăm, có khóa nào đang bị vứt bỏ vì thiếu chỗ (`evicted_keys`) hay không.
> - **`SLOWLOG GET` (Camera ghi hình thủ phạm gây tắc đường):** Tự động chụp lại chính xác câu lệnh chậm nào (mặc định lâu hơn `10 mili-giây`) vừa làm nghẽn hàng đợi đơn luồng.
> - **`LATENCY DOCTOR` & `MEMORY DOCTOR` (Trợ lý chẩn đoán tích hợp sẵn):** Công cụ có sẵn ngay trong Redis giúp chỉ điểm các nguyên nhân ẩn phía dưới hệ điều hành (như ghi đĩa chậm hay sao lưu nền tốn thời gian) kèm lời khuyên khắc phục bằng tiếng Anh rõ ràng!
> - **`Bigkeys` (Khóa phình to quá khổ):** Một khóa đơn lẻ phình lên hàng triệu phần tử làm tắc nghẽn mỗi lần đọc hoặc xóa.

## 1. Bản Đồ Tín Hiệu Vàng & Lưu Đồ Ứng Cứu Sự Cố 120 Giây

```visual
kind: illustration
diagram: "redis:r17"
alt: "Bảng điều khiển Observability Redis Exporter Prometheus và quy trình chẩn đoán SRE Playbook 5 nhánh sự cố"
badge: "Capstone SRE Playbook · R17"
title: "Trung Tâm Chỉ Huy SRE: 4 Tín Hiệu Vàng & Phác Đồ Chẩn Đoán 120 Giây"
subtitle: "Kết nối dữ liệu đo lường từ INFO / SLOWLOG / LATENCY DOCTOR sang Prometheus Alertmanager và quy trình khắc phục tức thời"
caption: "Mọi sự cố Redis phức tạp nhất đều để lại dấu vân tay rõ ràng trên 4 nhóm chỉ số: Latency, Saturation (Memory/CPU), Hit Ratio và Replication/Cluster State."
callouts:
  - num: 1
    label: "Golden Signals (Prometheus redis_exporter)"
    desc: "Theo dõi sát 5 chỉ số sống còn: CPU main-thread, Memory Usage vs Maxmemory, Cache Hit Rate (dùng hàm rate 5m), Evicted/Rejected Keys và Replication Lag."
    tone: cyan
  - num: 2
    label: "Bộ ba Nội soi Trực tiếp (SLOWLOG & LATENCY)"
    desc: "Chạy SLOWLOG GET 10 tìm lệnh O(N), LATENCY DOCTOR bắt gai trễ do fork()/AOF fsync, và MEMORY USAGE / --bigkeys tìm đối tượng phình to bất thường."
    tone: amber
  - num: 3
    label: "Vá Nóng Không Gián Đoạn (Zero-Downtime Mitigation)"
    desc: "Thay KEYS bằng SCAN, xoá Bigkey bằng UNLINK + lazyfree, đổi chính sách Eviction bằng CONFIG SET, thu hồi PEL bằng XAUTOCLAIM và sửa CROSSSLOT bằng {HashTag}."
    tone: emerald
```

## 2. Ba "Cú lừa đo lường" kinh điển mà 90% kỹ sư từng đọc sai

Trước khi bắt tay vào sửa lỗi, hãy nắm chắc 3 sự thật quan trọng để không tìm nhầm thủ phạm:

- [!] **Sự thật #1 — ==`SLOWLOG` chỉ đo thời gian chạy trên CPU của Redis, KHÔNG đo thời gian chờ mạng hay xếp hàng!==**
  - Giả sử ứng dụng Python/Node.js báo lỗi *"Lệnh `GET user:1` mất tới `500ms`!"*, nhưng bạn mở `SLOWLOG GET 10` chẳng thấy lệnh `GET` đâu mà chỉ thấy 1 lệnh `KEYS *` tốn `498,000 µs` (`498ms`). Điều đó có nghĩa là lệnh `GET` vẫn chạy mất có `0.002ms`, nhưng nó bị **đứng chôn chân chờ `498ms` phía sau lưng tên tội đồ `KEYS *`**! (Còn nếu `SLOWLOG` hoàn toàn trống trơn mà app vẫn chậm, thủ phạm thường nằm ở nghẽn mạng, thiếu kết nối trong Connection Pool của ứng dụng, hoặc hệ điều hành bị Swap ổ cứng — hãy gõ `LATENCY DOCTOR` để kiểm tra!).
- [!] **Sự thật #2 — Không bao giờ tính tỷ lệ trúng Cache (*Hit Ratio*) bằng con số cộng dồn từ lúc bật máy:**
  Trong `INFO stats`, `keyspace_hits` cộng dồn suốt nhiều tháng. Nếu máy chủ đã chạy 90 ngày tích lũy 10 tỷ lượt trúng, hôm nay dù Cache bị hỏng suốt 30 phút thì phép chia tổng vẫn báo `99.8%` đẹp lung linh! Trên hệ thống giám sát Prometheus/Grafana, **bắt buộc đo tốc độ tức thời trong 5 phút gần nhất bằng hàm ==`rate(...[5m])`==**:
  ```promql
  # Cảnh báo khi tỷ lệ trúng Cache thực tế trong 5 phút qua tụt xuống dưới 85%
  (
    rate(redis_keyspace_hits_total[5m])
    /
    clamp_min(rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m]), 1)
  ) < 0.85
  ```
- [!] **Sự thật #3 — Đừng nhìn CPU trung bình toàn máy chủ 32 nhân báo `3%` mà tưởng Redis đang rảnh!**
  Vì luồng thực thi lệnh dữ liệu của Redis là **đơn luồng**, trên máy chủ 32 nhân CPU, khi 1 nhân chạy luồng chính của Redis đã chạm trần **`100%` (nghẽn cứng hoàn toàn!)**, biểu đồ trung bình cả máy 32 nhân chỉ hiện `1 / 32 = 3.1%`! Luôn theo dõi CPU riêng của tiến trình `redis-server`.

## 3. Cẩm nang tác chiến 5 Sự cố Production điển hình

```visual
kind: troubleshoot
title: "Ma Trận Tác Chiến 5 Sự Cố Redis Production Điển Hình [!badge:rose:SRE Playbook]"
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

> [!WARNING] Quy tắc vàng trước khi đóng ca trực sự cố: Đừng quên `CONFIG REWRITE`!
> Nếu bạn vừa chữa cháy trực tiếp trên RAM bằng lệnh ==`CONFIG SET maxmemory-policy allkeys-lfu`==, thay đổi đó **chưa tự lưu vào file cấu hình trên ổ đĩa**! Hãy chạy thêm **`CONFIG REWRITE`** (hoặc cập nhật ngay tệp cấu hình trên Git / Helm / Docker Compose) để lần khởi động lại sau hệ thống không bị quay về cấu hình lỗi cũ.

> [!REMEMBER] Đúc kết trọn vẹn hành trình Redis Mastery (R00 → R17)
> 1. **Tôn trọng luồng đơn siêu tốc:** Giữ mọi câu lệnh và kịch bản Lua gọn nhẹ dưới vài micro-giây; luôn dùng **`SCAN`** thay cho `KEYS` và **`UNLINK` + `lazyfree`** thay cho `DEL` trên khóa lớn.
> 2. **Đọc đúng bệnh qua số liệu:** Kết hợp **`INFO`**, **`SLOWLOG GET`**, **`LATENCY DOCTOR`** và đo Hit Ratio theo cửa sổ trượt `rate(...[5m])` (tránh gõ `MONITOR` lúc cao điểm!).
> 3. **Kiến trúc vững vàng từ gốc:** Phòng thủ Database bằng **Singleflight + Bloom Filter + TTL Jitter**, chọn đúng **Eviction (`allkeys-lfu` vs `noeviction`) + Hybrid AOF**, mở rộng bằng **Sentinel / Cluster `{HashTag}`** và khóa chặt với **Zero-Trust TLS + ACL**.

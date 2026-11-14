# Observability, Metrics & Phòng Chiến Sự cố Redis (SRE War-Room)

Chào mừng bạn bước vào **Mô-đun Capstone cuối cùng (`R17`)** của hành trình **Redis Mastery**! Xuyên suốt `17` mô-đun trước, bạn đã nắm vững từ kiến trúc đơn luồng Event Loop, cấu trúc dữ liệu nội tại, mẫu Caching chống Stampede, khoá phân tán Lua, chính sách RAM/Persistence cho tới Sentinel, Cluster `16.384` Slots và Zero-Trust ACL.

Nhưng trong thực tế vận hành lúc **02:30 sáng**, khi chuông PagerDuty réo vang báo động độ trễ API thanh toán vọt từ `2ms` lên `3.500ms`, bạn không có thời gian đọc lại lý thuyết — bạn cần một **Hệ thống Quan sát (*Observability*) sắc bén** và một **Phản xạ Chẩn đoán 120 giây (*SRE Triage Playbook*)** để khoanh vùng đúng gốc bệnh và vá nóng mà không làm rớt thêm giao dịch nào!

> [!ANALOGY] Ẩn dụ Phòng Cấp Cứu Tim Mạch & Máy Điện Tâm Đồ (ECG)
> Khám một cụm Redis đang nghẽn cũng giống hệt bác sĩ cấp cứu đọc màn hình sinh hiệu bệnh nhân:
> - **Nhịp tim & Huyết áp (`INFO stats` / `INFO memory`):** Tần số đập `instantaneous_ops_per_sec`, áp lực máu `used_memory / maxmemory`, lượng hồng cầu bị đào thải `evicted_keys` và tỷ lệ hấp thụ oxy `Cache Hit Ratio`.
> - **Camera nội soi động mạch (`SLOWLOG GET`):** Ghi hình chính xác câu lệnh `O(N)` nào vừa làm tắc nghẽn buồng tim đơn luồng quá `10ms` (`10.000 µs`).
> - **Hội chẩn tự động (`LATENCY DOCTOR`):** Trợ lý AI tích hợp sẵn trong nhân C của Redis phân tích các gai trễ do `fork()` Copy-on-Write, `fsync` ổ đĩa hay hết hạn khoá khổng lồ (*Bigkey expire*).

## 1. Bản Đồ Tín Hiệu Vàng & Lưu Đồ Ứng Cứu Sự Cố 120 Giây

```visual
kind: illustration
diagram: "redis:r17"
alt: "Bảng điều khiển Observability Redis Exporter Prometheus và quy trình chẩn đoán SRE War-Room 5 nhánh sự cố"
badge: "Capstone War-Room · R17"
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
    desc: "Thay KEYS bằng SCAN, xoá Bigkey bằng UNLINK + lazyfree, đổi chính sách trục xuất bằng CONFIG SET, thu hồi PEL bằng XAUTOCLAIM và sửa CROSSSLOT bằng {HashTag}."
    tone: emerald
```

## 2. Giải Mã Các Cạm Bẫy Đo Lường Mà 90% Kỹ Sư Đọc Sai

Trước khi lao vào dập lửa, một SRE lão luyện luôn tránh **3 cú lừa kinh điển** khi đọc số liệu Redis:

- [!] **Cú lừa #1 — `SLOWLOG` KHÔNG đo thời gian chờ trên mạng hay hàng đợi!**
  Chỉ số `duration` (tính bằng micro-giây `µs`) trong `SLOWLOG GET` **chỉ đo thuần tuý thời gian CPU luồng chính thực thi câu lệnh đó**!
  - Nếu ứng dụng kêu gào *"Lệnh `GET user:1` mất `500ms`!"* nhưng `SLOWLOG` trống trơn hoặc chỉ ghi nhận `1` lệnh `KEYS *` tốn `498.000 µs`: điều đó có nghĩa là `GET user:1` chỉ tốn `2 µs` để chạy, nhưng nó **phải xếp hàng đứng đợi `498ms` phía sau lưng tên tội đồ `KEYS *`**! (Hoặc tiến trình bị chặn bởi `fork()` / Swap OS — những thứ nằm ngoài phạm vi đo của `SLOWLOG`, phải dùng **`LATENCY DOCTOR`** mới thấy!).
- [!] **Cú lừa #2 — Tính nhầm Cache Hit Ratio bằng tổng tích luỹ từ lúc bật máy:**
  Trong `INFO stats`, hai bộ đếm `keyspace_hits` và `keyspace_misses` cộng dồn suốt nhiều tháng. Nếu cụm đã chạy 90 ngày tích luỹ `10 tỷ` lượt Hit, thì hôm nay dù Cache bị xuyên thủng 100% suốt 30 phút, phép chia cộng dồn vẫn hiện `99,8%` đẹp lung linh! Trên Prometheus, **bắt buộc dùng hàm tốc độ tức thời `rate(...[5m])`**:
  ```promql
  # Cảnh báo khi tỷ lệ trúng Cache thực tế trong 5 phút tụt xuống dưới 85%
  (
    rate(redis_keyspace_hits_total[5m])
    /
    clamp_min(rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m]), 1)
  ) < 0.85
  ```
- [!] **Cú lừa #3 — Nhìn CPU tổng toàn máy chủ 32 nhân chỉ `3%` rồi kết luận Redis còn rảnh!**
  Vì luồng thực thi lệnh cốt lõi của Redis là **đơn luồng (*Single-threaded*)**, trên máy chủ 32 vCPU, khi luồng chính của Redis bị vắt kiệt `100%` công suất (nghẽn cứng hoàn toàn!), biểu đồ CPU trung bình toàn máy chỉ nhích đúng `1 / 32 = 3,125%`! Hãy luôn giám sát CPU **theo từng tiến trình/luồng (`redis_cpu_user_seconds_total`)** thay vì trung bình toàn host!

## 3. Sổ Tay Tác Chiến War-Room: 5 Ca Trực PagerDuty Kinh Điển

Mọi bài tập thực hành của mô-đun Capstone này sẽ đặt bạn vào ghế nóng của kỹ sư trực chiến SRE xử lý trực tiếp 5 sự cố thực tế dưới đây:

```visual
kind: troubleshoot
title: "Ma Trận Tác Chiến 5 Sự Cố Redis Production Điển Hình [!badge:rose:War-Room Playbook]"
subtitle: "Quy trình chuẩn 2 bước: Khám nghiệm bằng lệnh Chẩn đoán -> Áp dụng bản vá không gây gián đoạn"
items:
  - symptom: "Ca #1: Độ trễ p99 toàn bộ API vọt lên >200ms theo chu kỳ, CPU luồng chính chạm đỉnh 100%"
    badge: "O(N) Command Freeze"
    tone: rose
    cause: "Một cronjob hoặc API quản trị đang gọi `KEYS session:*` trên hàng triệu khoá, khoá cứng Event Loop suốt hàng trăm mili-giây."
    fix: "Bắt quả tang qua `SLOWLOG GET 5`, lập tức thay thế `KEYS` bằng con trỏ lặp không chặn `SCAN 0 MATCH session:* COUNT 50` và chặn `-keys` trong ACL."
    cmd: "SLOWLOG GET 5 && SCAN 0 MATCH session:* COUNT 50"
  - symptom: "Ca #2: Mỗi lần dọn dẹp khoá báo cáo tạm, toàn cụm khựng lại 800ms"
    badge: "Bigkey Synchronous DEL"
    tone: amber
    cause: "Gọi lệnh `DEL` đồng bộ lên một Set/Hash/List khổng lồ hàng triệu phần tử khiến luồng chính phải cấp phát thu hồi hàng triệu vùng nhớ `jemalloc` tại chỗ."
    fix: "Đo kích thước bằng `MEMORY USAGE <key>`, thu hồi bất đồng bộ trên luồng nền `bio_lazy_free` bằng `UNLINK <key>` và bật `CONFIG SET lazyfree-lazy-expire yes`."
    cmd: "MEMORY USAGE temp:export:2025 && UNLINK temp:export:2025"
  - symptom: "Ca #3: Ứng dụng nổ lỗi hàng loạt `OOM command not allowed when used memory > 'maxmemory'`"
    badge: "Cache Misconfigured noeviction"
    tone: rose
    cause: "Cụm Redis thuần Cache nhưng để quên chính sách mặc định `maxmemory-policy noeviction` nên khi đầy RAM đã từ chối mọi lệnh `SET` mới."
    fix: "Kiểm tra `INFO memory` / `CONFIG GET maxmemory-policy`, chuyển sang `allkeys-lfu` kèm `lazyfree-lazy-eviction yes` để tự đào thải khoá ít dùng nhất."
    cmd: "INFO memory && CONFIG GET maxmemory-policy"
  - symptom: "Ca #4: RAM của Stream tăng không phanh, hàng ngàn đơn hàng treo lơ lửng không được xử lý"
    badge: "Streams PEL Consumer Leak"
    tone: violet
    cause: "Pod consumer bị OOMKilled giữa chừng sau khi nhận tin qua `XREADGROUP`, bỏ lại các ID nằm kẹt vĩnh viễn trong danh sách chờ `XPENDING` (PEL)."
    fix: "Soi `XPENDING <stream> <group> - + 10` tìm worker chết, dùng `XAUTOCLAIM` thu hồi các tin nhắn treo quá ngưỡng idle về worker mới xử lý rồi gọi `XACK`."
    cmd: "XPENDING orders:stream payment-cg - + 10"
  - symptom: "Ca #5: Giao dịch MSET/MGET hoặc Lua nổ lỗi `CROSSSLOT Keys in request don't hash to the same slot`"
    badge: "Cluster HashSlot Mismatch"
    tone: cyan
    cause: "Sau khi nâng cấp từ Redis đơn lẻ lên Redis Cluster, các khoá của cùng 1 giỏ hàng (`cart:user88:items` và `cart:user88:totals`) băm ra 2 Slot khác nhau."
    fix: "Kiểm chứng bằng `CLUSTER KEYSLOT`, dọn khoá cũ và chuẩn hoá lại tên khoá gắn `{HashTag}` theo thực thể: `cart:{user88}:items` và `cart:{user88}:totals`."
    cmd: "CLUSTER KEYSLOT cart:{user88}:items"
```

## 4. Kịch Bản Khám Bệnh Nhanh 30 Giây Cho Ca Trực Đêm

Khi bước vào bất kỳ máy chủ Redis nào đang gặp biến động mà chưa rõ nguyên nhân, hãy chạy chuỗi lệnh **CHỈ ĐỌC hoàn toàn an toàn** sau đây để thu thập trọn vẹn bức tranh toàn cảnh:

```bash
# 1. Kiểm tra vai trò Master/Replica, kết nối và bộ nhớ tổng quan
redis-cli INFO server
redis-cli INFO memory
redis-cli INFO stats
redis-cli INFO replication

# 2. Bắt ngay 10 câu lệnh chậm nhất vừa chạy trên luồng chính (mặc định > 10ms)
redis-cli SLOWLOG LEN
redis-cli SLOWLOG GET 10

# 3. Nhờ bác sĩ nội trú phân tích gai độ trễ (fork COW, AOF fsync, transparent huge pages)
redis-cli LATENCY DOCTOR
redis-cli MEMORY DOCTOR

# 4. Quét tìm khoá phình to (chỉ chạy trên Replica kèm độ nghỉ 50ms để tuyệt đối êm ái!)
redis-cli -h replica-node --bigkeys -i 0.05
```

## 5. Bộ Quy Tắc Cảnh Báo Sớm Prometheus Alertmanager Chuẩn SRE

Đừng đợi khách hàng báo lỗi mới mở terminal — hãy gắn 3 quy tắc cảnh báo chủ động này lên `redis_exporter` để phát hiện bất thường trước khi tràn RAM hoặc sập nút:

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
          summary: "RAM của Redis vượt ngưỡng 88% maxmemory (nguy cơ OOM / Eviction ồ ạt)"

      - alert: RedisSlowlogSpike
        expr: increase(redis_slowlog_last_id[2m]) > 15
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Xuất hiện >15 câu lệnh chậm O(N) trên luồng chính trong 2 phút qua!"
```

> [!TIP] Quy Tắc Vàng Trước Khi Rời Phòng Chiến Sự Cố (Post-Incident Hygiene)
> Nếu bạn vừa cứu hoả nóng bằng lệnh động `CONFIG SET maxmemory-policy allkeys-lfu` hoặc `CONFIG SET lazyfree-lazy-expire yes` trên RAM, **đừng quên chạy `CONFIG REWRITE` (hoặc cập nhật GitOps ConfigMap / `redis.conf`)**! Nếu bỏ quên bước này, lần tới khi máy chủ khởi động lại, mọi thông số cũ gây sập hệ thống sẽ lặng lẽ sống dậy lúc bạn không ngờ tới nhất!

> [!REMEMBER] Ghi nhớ cốt lõi khép lại khoá học Redis Mastery
> 1. **Đơn luồng là sức mạnh nhưng cũng là gót chân Achilles:** Mọi thiết kế cấu trúc dữ liệu, xoá khoá (`UNLINK`), duyệt khoá (`SCAN`) và Lua Script ngắn gọn đều xoay quanh mục tiêu giữ cho mỗi thao tác trên Event Loop hoàn tất trong vài micro-giây.
> 2. **Đọc đúng số liệu:** Dùng `SLOWLOG GET` tìm lệnh tốn CPU, `LATENCY DOCTOR` tìm điểm nghẽn hệ điều hành/`fork()`, và luôn dùng hàm `rate(...[5m])` trên Prometheus để đo **Cache Hit Ratio** theo thời gian thực.
> 3. **Kiến trúc chuẩn Production không có điểm mù:** Bảo vệ DB bằng **Singleflight + Bloom + Jitter**, chọn đúng **Eviction + Hybrid AOF**, mở rộng ngang bằng **Cluster `{HashTag}`**, khoá chặt bằng **Zero-Trust mTLS + ACL** và sẵn sàng ứng phó mọi ca trực với quy trình SRE chuẩn xác!

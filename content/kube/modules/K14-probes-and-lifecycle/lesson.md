# Sức khoẻ Pod & Vòng đời dừng êm ái: Startup, Readiness, Liveness Probes & Graceful Shutdown

Một trong những ngộ nhận phổ biến nhất của lập trình viên mới lên Kubernetes là: *"Hễ `kubectl get pods` báo `STATUS = Running`, nghĩa là ứng dụng Node.js của tôi đã sẵn sàng phục vụ khách hàng!"*

**Sai hoàn toàn!** Đối với nhân Linux và `kubelet`, trạng thái `Running` chỉ đơn thuần có nghĩa là tiến trình `node dist/server.js` vừa được nạp vào bộ nhớ (PID đã tồn tại). Trong thực tế:

- [!] Ứng dụng có thể mất thêm 8 giây đầu để kết nối PostgreSQL, nạp bộ nhớ đệm Redis hoặc khởi tạo Prisma Client — nếu khách hàng bị đẩy vào ngay giây thứ 1, họ sẽ ăn trọn lỗi **`502 Bad Gateway`**!
- [!] Tệ hơn, sau 3 ngày chạy liên tục, tiến trình Node.js có thể bị treo vòng lặp sự kiện (*Event Loop* nghẽn cứng hoặc *Deadlock* kết nối) khiến mọi HTTP request quay vòng vô tận dù tiến trình chưa hề thoát (`Running` giả tạo)!

Để Kubernetes thực sự hiểu được "nhịp tim" bên trong ứng dụng, chúng ta trang bị **3 cảm biến thăm dò sức khoẻ ({sky:`startupProbe`}, {emerald:`readinessProbe`}, {rose:`livenessProbe`})** kết hợp cùng quy trình ==Graceful Shutdown (`preStop` + `SIGTERM`)==.

## 1. Phân biệt rõ nhiệm vụ của 3 loại Probe: `startupProbe` vs `readinessProbe` vs `livenessProbe`

> [!ANALOGY] Ba trạm kiểm tra y tế với hậu quả xử lý khác biệt hoàn toàn
> Đừng bao giờ nhầm lẫn giữa **"đang bận chưa tiếp khách được"** (`readinessProbe`) và **"đã chết lâm sàng cần sốc điện khởi động lại"** (`livenessProbe`) — chọn sai loại Probe có thể tự tay đánh sập cả hệ thống đang chạy!

```visual
kind: groups
title: Giải Phẫu 3 Cảm Biến Sức Khoẻ Của Pod [!badge:emerald:Chuẩn Production]
subtitle: Mỗi loại Probe trả lời một câu hỏi sinh tử khác nhau và dẫn tới hành động hoàn toàn khác nhau của kubelet
columns: 3
items:
  - num: 1
    icon: rocket
    title: startupProbe
    badge: Bảo vệ lúc mới bật
    tone: sky
    desc: "\"Ứng dụng đã hoàn tất khởi tạo lần đầu tiên chưa?\""
    bullets:
      - "Khi đang chạy kiểm tra, nó ==tạm khoá vô hiệu hoá cả `liveness` lẫn `readiness`== cho tới khi thành công lần đầu"
      - "Quỹ thời gian tối đa = **`periodSeconds * failureThreshold`** (ví dụ `5 * 12 = 60` giây); quá hạn mới giết & bật lại container"
    footer: Dành cho app nạp AI model, warm cache lớn (30-60s)
  - num: 2
    icon: shield-check
    title: readinessProbe
    badge: Điều phối lưu lượng
    tone: emerald
    desc: "\"Ngay lúc này Pod có đủ sức nhận request mới không?\""
    bullets:
      - "**TUYỆT ĐỐI KHÔNG giết Pod!**"
      - "Khi thất bại, chỉ đánh dấu `Ready=false` và ==rút IP của Pod khỏi `Endpoints` của `Service`== để ngưng đẩy khách mới vào; khoẻ lại sẽ nối vào tiếp"
    footer: Bắt buộc cho MỌI HTTP/API để Rolling Update êm ái
  - num: 3
    icon: activity
    title: livenessProbe
    badge: Phát hiện treo cứng
    tone: rose
    desc: "\"Tiến trình có bị deadlock không thể tự hồi phục không?\""
    bullets:
      - "**Trừng phạt nặng nhất:** khi thất bại vượt `failureThreshold`, `kubelet` **GIẾT thẳng container và khởi động lại từ đầu** (`RESTARTS` +1)"
      - "Chỉ dùng để bắt lỗi treo cứng vòng lặp nội tại dù tiến trình vẫn tồn tại"
    footer: Cấu hình sai sẽ gây bão khởi động lại toàn cụm!
```

## 2. Cạm bẫy chết người số 1 trên Production: Gắn kiểm tra Database vào `livenessProbe`!

Hãy tưởng tượng kịch bản thảm hoạ từng đánh sập hàng loạt hệ thống lớn khi dùng chung một endpoint `/health` truy vấn `SELECT 1` xuống PostgreSQL cho cả `readinessProbe` lẫn `livenessProbe` (với `timeoutSeconds: 1`):

1. Giờ cao điểm, PostgreSQL hơi quá tải nên phản hồi `SELECT 1` mất `1.3 giây` (vượt ngưỡng `1s`).
2. `livenessProbe` báo thất bại 3 lần liên tiếp → Kubernetes tưởng cả 20 Pod API đều chết lâm sàng nên **đồng loạt giết và khởi động lại cả 20 Pod cùng một lúc**!
3. Khi 20 Pod Node.js bật dậy đồng thời, chúng lập tức mở 200 kết nối TCP mới đập thẳng vào PostgreSQL đang thoi thóp (hiệu ứng **Thundering Herd**), đánh sập hoàn toàn Database và đẩy toàn cụm vào vòng xoáy ==`CrashLoopBackOff` dây chuyền (*Cascading Failure*)==!

```visual
kind: compare
title: "Nguyên Tắc Vàng: Tách Bạch /healthz (Liveness) và /readyz (Readiness)"
subtitle: Phụ thuộc bên ngoài (PostgreSQL, Redis, API đối tác) CHỈ ĐƯỢC KIỂM TRA ở readinessProbe!
left:
  badge: "CÁCH SAI · Sập Dây Chuyền"
  title: Nhét kiểm tra Database vào livenessProbe
  tone: rose
  code: |
    # THẢM HOẠ: DB chập chờn 2s -> K8s giết sạch 20 Pod API!
    livenessProbe:
      httpGet:
        path: /readyz-with-db-query
        port: 3000
      timeoutSeconds: 1
      failureThreshold: 3
  lang: yaml
  bullets:
    - "PostgreSQL hoặc cổng thanh toán đối tác chỉ lag nhẹ vài giây cũng làm `livenessProbe` thất bại"
    - "K8s tự tay bắn hạ toàn bộ dàn API đang sống khoẻ, gây bão kết nối **Thundering Herd** lúc bật lại"
right:
  badge: "CÁCH CHUẨN · Cô Lập Sự Cố"
  title: "/healthz nội tại nhẹ nhàng · /readyz kiểm tra kết nối"
  tone: emerald
  code: |
    readinessProbe:
      httpGet: { path: /readyz, port: 3000 }  # Check DB/Redis Pool
      periodSeconds: 5
      failureThreshold: 3
    livenessProbe:
      httpGet: { path: /healthz, port: 3000 } # Chỉ trả 200 { ok: true }!
      periodSeconds: 10
      timeoutSeconds: 3
      failureThreshold: 3
  lang: yaml
  bullets:
    - "**`/healthz` (`livenessProbe` & `startupProbe`):** Chỉ kiểm tra Event Loop nội tại (`res.status(200).json({ ok: true })`), **không chạm DB/Redis/API ngoài**, `timeoutSeconds: 3–5s`"
    - "**`/readyz` (`readinessProbe`):** Kiểm tra Pool DB/Redis; khi DB chập chờn chỉ tạm rút Pod khỏi `Service` (trả 503 an toàn), không giết Pod!"
```

Cấu hình chuẩn mực kết hợp đủ 3 Probe cho dịch vụ Node.js Production:

```yaml
containers:
  - name: api
    image: ghcr.io/acme/shop-api:1.5.0
    ports:
      - containerPort: 3000
    startupProbe:
      httpGet:
        path: /healthz
        port: 3000
      periodSeconds: 5
      failureThreshold: 12    # Tổng quỹ thời gian khởi động tối đa = 5 * 12 = 60 giây
    readinessProbe:
      httpGet:
        path: /readyz
        port: 3000
      periodSeconds: 5
      failureThreshold: 3
    livenessProbe:
      httpGet:
        path: /healthz        # Nhẹ, tuyệt đối không gọi DB ngoài!
        port: 3000
      periodSeconds: 10
      timeoutSeconds: 3
      failureThreshold: 3
```

## 3. Bí quyết Zero-Downtime thực sự khi tắt Pod: Đua tốc độ lúc `Terminating` & `preStop` Hook

Ngay cả khi đã có `readinessProbe`, nhiều đội ngũ vẫn thấy khách hàng thỉnh thoảng bị lỗi `502 Bad Gateway` trong vài giây đầu của mỗi đợt Rolling Update! Nguyên nhân nằm ở **hai luồng chạy song song bất đồng bộ** ngay khoảnh khắc Kubernetes xoá một Pod cũ:

- [>] **Luồng A (Mạng cụm):** API Server báo cho `EndpointSlice`, `kube-proxy` và `Ingress Controller` (Nginx/Envoy) gỡ IP của Pod cũ khỏi bảng chia tải. Quá trình đồng bộ mạng qua các máy chủ mất khoảng **1 đến 3 giây**.
- [!] **Luồng B (`kubelet` trên Node):** Cùng tích tắc đó, `kubelet` gửi tín hiệu **`SIGTERM`** thẳng vào tiến trình Node.js! Nếu code Express vừa thấy `SIGTERM` đã gọi `process.exit(0)` đóng sập cổng `3000` trong `0.01 giây`, các gói tin khách hàng đang bay tới từ Luồng A (trong 2 giây trễ mạng kia) sẽ đâm sầm vào cánh cửa đóng kín → **`502 Bad Gateway`**!

```visual
kind: flow
title: Chu Trình Dừng Êm Ái Không Rớt Mạng (Zero-Downtime Graceful Shutdown)
subtitle: "Toàn bộ preStop + SIGTERM đều nằm chung bên trong tổng quỹ thời gian terminationGracePeriodSeconds (mặc định 30s)"
footer: "Nếu preStop ngủ 5s trong quỹ 30s, ứng dụng còn tối đa 25s để xử lý nốt request cũ trước khi bị bắn SIGKILL"
steps:
  - icon: network
    badge: Giây 0 · Song song
    title: Pod Terminating & Gỡ IP
    desc: Luồng mạng bắt đầu rút IP của Pod khỏi EndpointSlice và Ingress (mất ~1-3s)
    code: "Ready -> Terminating"
    tone: sky
    edge: chạy preStop trước
  - icon: shield
    badge: Giây 0 -> 5 · Đệm mạng
    title: lifecycle.preStop
    desc: Chạy TRƯỚC KHI gửi SIGTERM để chờ mạng cụm ngừng hẳn việc đẩy khách mới vào
    code: '["sh", "-c", "sleep 5"]'
    tone: amber
    edge: gửi SIGTERM
  - icon: check
    badge: Giây 5+ · Xả giao dịch
    title: Node.js bắt SIGTERM
    desc: Gọi server.close(), xử lý êm xuôi nốt các thanh toán đang chạy dở rồi đóng DB
    code: "process.exit(0)"
    tone: emerald
    edge: nếu lố 30s ân hạn
  - icon: flame
    badge: Quá hạn 30s · Cưỡng bức
    title: Tín hiệu SIGKILL (9)
    desc: Nhân Linux/kubelet kết liễu cưỡng bức nếu tiến trình vẫn treo quá hạn ân hạn
    code: "SIGKILL"
    tone: rose
```

> [!TIP] Quy tắc tính quỹ thời gian `terminationGracePeriodSeconds`
> Thời gian chạy của móc `lifecycle.preStop` được **tính gộp chung vào bên trong** tổng hạn mức `terminationGracePeriodSeconds: 30` (chứ không được cộng thêm ra ngoài!). Ví dụ: nếu `terminationGracePeriodSeconds` là `30s` và `preStop` chạy `sleep 5`, tiến trình Node.js sau khi nhận `SIGTERM` sẽ còn tối đa `25s` trước khi nhân Linux bắn tín hiệu tối hậu ==`SIGKILL`==.

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`startupProbe`** tạm khoá `liveness` & `readiness` lúc mới khởi động (tổng thời gian tối đa = **`periodSeconds * failureThreshold`**).
> - **`readinessProbe`** thất bại **không bao giờ giết Pod**, chỉ rút IP khỏi `Service Endpoints` · **Chỉ kiểm tra DB/API ngoài ở `readinessProbe`**, tuyệt đối không đặt vào `livenessProbe`!
> - Kết hợp **`lifecycle.preStop` (`["sh", "-c", "sleep 5"]`)** + bắt **`SIGTERM` (`server.close()`)** bên trong quỹ **`terminationGracePeriodSeconds`** (hết hạn sẽ bị kết liễu bằng **`SIGKILL`**).

# Kiểm tra Sức khỏe Pod (`Startup` / `Readiness` / `Liveness` Probes) & Graceful Shutdown

Một trong những ngộ nhận phổ biến nhất của người mới lên Kubernetes là: *"Hễ `kubectl get pods` báo `STATUS = Running`, nghĩa là ứng dụng Python hay Node.js của tôi đã sẵn sàng phục vụ khách hàng!"*

**Chưa chắc đâu!** Đối với nhân Linux và `kubelet`, chữ `Running` chỉ có nghĩa là tiến trình `uvicorn` hay `node` vừa được nạp vào RAM (PID đã xuất hiện). Trong thực tế:

- [!] Một dịch vụ FastAPI nạp mô hình AI lên RAM (hoặc Node.js khởi tạo kết nối PostgreSQL / Redis) có thể mất 10–30 giây đầu tiên — nếu đẩy khách hàng vào ngay giây thứ 1, họ sẽ nhận ngay lỗi **`502 Bad Gateway`**!
- [!] Sau vài ngày chạy liên tục, ứng dụng có thể bị kẹt cứng vòng lặp (*Deadlock*) khiến mọi request quay vòng vô tận dù tiến trình chưa hề thoát (`Running` giả tạo)!

Để Kubernetes hiểu đúng "nhịp tim" bên trong ứng dụng, chúng ta trang bị **3 cảm biến thăm dò sức khỏe (`startupProbe`, `readinessProbe`, `livenessProbe`)** kết hợp cùng quy trình tắt êm ==Graceful Shutdown (`preStop` + `SIGTERM`)==.

```visual
kind: illustration
diagram: "kube:k14"
src: "/illustrations/kube/k8s-probes-health-gates.jpg"
alt: "Ba cổng kiểm tra sức khỏe Pod (startupProbe, readinessProbe, livenessProbe) và trình tự dừng an toàn (Graceful Shutdown) preStop kết hợp SIGTERM"
title: "Cơ Chế 3 Loại Probe Sức Khỏe & Quy Trình Dừng An Toàn (Zero-502 Shutdown)"
subtitle: "Phân tách rạch ròi giữa điều tiết lưu lượng khách hàng, tự khởi động lại khi treo cứng và rút êm kết nối lúc tắt Pod"
caption: "Máy trạng thái 3 cảm biến của kubelet (startup -> readiness cắt lưu lượng vs liveness khởi động lại) và chuỗi tắt êm preStop + SIGTERM"
callouts:
  - num: 1
    label: "startupProbe — Lá chắn bảo vệ giai đoạn khởi động"
    desc: "Tạm khóa hai cảm biến còn lại trong lúc ứng dụng đang nạp mô hình/cấu hình nặng lúc mới bật, tránh bị giết oan khi chưa khởi tạo xong."
    tone: sky
  - num: 2
    label: "readinessProbe (Cắt khách) vs livenessProbe (Khởi động lại)"
    desc: "Trượt readiness chỉ tạm rút IP Pod khỏi Service VIP mà không giết tiến trình; tuyệt đối không gắn kiểm tra Database vào liveness!"
    tone: emerald
  - num: 3
    label: "Chuỗi tắt êm preStop + SIGTERM triệt tiêu lỗi 502"
    desc: "Chờ vài giây ở preStop để bảng mạng cụm kịp xóa IP Pod rồi mới gửi SIGTERM cho ứng dụng xử lý nốt các request đang dở dang."
    tone: amber
```

## 1. Phân biệt 3 loại Probe: `startupProbe`, `readinessProbe` và `livenessProbe`

> [!NOTE] Vai trò của 3 loại Health Probe trong Kubernetes
> Mỗi loại Probe kiểm tra một giai đoạn khác nhau và dẫn đến hành động xử lý khác nhau từ `kubelet`:
> 1. **`startupProbe`:** Bảo vệ các ứng dụng có thời gian khởi động ban đầu lâu (ví dụ 30–60s để nạp mô hình AI hoặc warm cache). Trong thời gian `startupProbe` chưa đạt, `kubelet` tạm vô hiệu hóa `livenessProbe` và `readinessProbe` để không giết nhầm container.
> 2. **`readinessProbe`:** Kiểm tra xem Pod hiện có đủ điều kiện tiếp nhận lưu lượng mới từ `Service` hay không. Nếu thất bại, `kubelet` chỉ đánh dấu `Ready=false` để rút IP Pod khỏi danh sách `Endpoints` của `Service`, **tuyệt đối không khởi động lại container**.
> 3. **`livenessProbe`:** Kiểm tra xem tiến trình ứng dụng còn hoạt động bình thường hay đã rơi vào trạng thái treo cứng (*deadlock*). Nếu thất bại liên tiếp vượt `failureThreshold`, `kubelet` sẽ **khởi động lại container (`RESTARTS +1`)**.
> *(Có thể hình dung đơn giản: `startupProbe` là thời gian khởi động làm nóng máy đầu ngày, `readinessProbe` là tạm treo biển ngưng nhận thêm đơn mới khi quá tải mà không tắt hệ thống, còn `livenessProbe` là kiểm tra tiến trình có bị treo cứng để khởi động lại.)*

```visual
kind: groups
title: So Sánh 3 Loại Probe Sức Khỏe Của Pod [!badge:emerald:Chuẩn Production]
subtitle: Mỗi loại Probe trả lời một câu hỏi khác nhau và dẫn tới hành động hoàn toàn khác nhau của kubelet
columns: 3
items:
  - num: 1
    icon: rocket
    title: startupProbe
    badge: Bảo vệ lúc mới bật
    tone: sky
    desc: "\"Ứng dụng đã hoàn tất khởi tạo lần đầu tiên chưa?\""
    bullets:
      - "Khi đang chạy kiểm tra, nó ==tạm khóa vô hiệu hóa cả `liveness` lẫn `readiness`== cho tới khi thành công lần đầu"
      - "Quỹ thời gian tối đa = **`periodSeconds * failureThreshold`** (ví dụ `5 * 12 = 60` giây); quá hạn mới khởi động lại container"
    footer: Rất cần cho Python nạp AI model, Java Spring hoặc warm cache lớn
  - num: 2
    icon: shield-check
    title: readinessProbe
    badge: Điều phối lưu lượng
    tone: emerald
    desc: "\"Ngay lúc này Pod có đủ sức nhận request mới không?\""
    bullets:
      - "**TUYỆT ĐỐI KHÔNG giết Pod!**"
      - "Khi thất bại, chỉ đánh dấu `Ready=false` và ==rút IP của Pod khỏi `Endpoints` của `Service`== để ngưng đẩy khách mới vào; khỏe lại sẽ nối vào tiếp"
    footer: Bắt buộc cho MỌI HTTP/gRPC API để Rolling Update êm ái
  - num: 3
    icon: activity
    title: livenessProbe
    badge: Phát hiện treo cứng
    tone: rose
    desc: "\"Tiến trình có bị deadlock không thể tự hồi phục không?\""
    bullets:
      - "**Biện pháp mạnh nhất:** khi thất bại vượt `failureThreshold`, `kubelet` **GIẾT thẳng container và khởi động lại từ đầu** (`RESTARTS` +1)"
      - "Chỉ dùng để bắt lỗi treo cứng vòng lặp nội tại dù tiến trình vẫn tồn tại"
    footer: Cấu hình sai sẽ gây bão khởi động lại toàn cụm!
```

## 2. Sai lầm nghiêm trọng cần tránh: Gắn kiểm tra Database vào `livenessProbe`

Hãy xem kịch bản từng gây gián đoạn diện rộng nhiều hệ thống lớn khi lập trình viên dùng chung một đường dẫn `/health` gọi `SELECT 1` xuống PostgreSQL cho cả `readinessProbe` lẫn `livenessProbe` (với `timeoutSeconds: 1`):

1. Giờ cao điểm, PostgreSQL hơi bận nên trả lời `SELECT 1` mất `1.3 giây` (vượt ngưỡng `1s`).
2. `livenessProbe` báo trượt 3 lần → Kubernetes tưởng cả 20 Pod API đều chết cứng nên **đồng loạt giết và khởi động lại cả 20 Pod cùng một lúc**!
3. Khi 20 Pod FastAPI / Node.js bật dậy đồng thời, chúng ập tới mở 200 kết nối TCP mới đập thẳng vào PostgreSQL đang mệt mỏi (hiệu ứng **Thundering Herd**), đánh sập luôn Database và đẩy toàn cụm vào vòng xoáy ==`CrashLoopBackOff` dây chuyền (*Cascading Failure*)==!

```visual
kind: compare
title: "Nguyên Tắc Vàng: Tách Bạch /healthz (Liveness) và /readyz (Readiness)"
subtitle: Phụ thuộc bên ngoài (PostgreSQL, Redis, API đối tác) CHỈ ĐƯỢC KIỂM TRA ở readinessProbe!
left:
  badge: "CÁCH SAI · Sập Dây Chuyền"
  title: Nhét kiểm tra Database vào livenessProbe
  tone: rose
  code: |
    # SAI LẦM NGHIÊM TRỌNG: DB chập chờn 2s -> K8s giết sạch 20 Pod API!
    livenessProbe:
      httpGet:
        path: /readyz-with-db-query
        port: 3000
      timeoutSeconds: 1
      failureThreshold: 3
  lang: yaml
  bullets:
    - "PostgreSQL hoặc cổng thanh toán đối tác chỉ chậm nhẹ vài giây cũng làm `livenessProbe` thất bại"
    - "K8s tự tay giết toàn bộ dàn API đang sống khỏe, gây bão kết nối **Thundering Herd** lúc bật lại"
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
      httpGet: { path: /healthz, port: 3000 } # Chỉ trả 200 {"ok": true}!
      periodSeconds: 10
      timeoutSeconds: 3
      failureThreshold: 3
  lang: yaml
  bullets:
    - "**`/healthz` (`livenessProbe` & `startupProbe`):** Chỉ trả về ngay `200 {\"ok\": true}` chứng minh tiến trình chưa bị đơ cứng, **không chạm DB/Redis/API ngoài**"
    - "**`/readyz` (`readinessProbe`):** Kiểm tra kết nối DB/Redis; khi DB chập chờn chỉ tạm rút Pod khỏi `Service`, không giết Pod!"
```

Cấu hình chuẩn mực kết hợp đủ 3 Probe trên Production:

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
        path: /healthz        # Nhẹ nhàng, tuyệt đối không gọi DB ngoài!
        port: 3000
      periodSeconds: 10
      timeoutSeconds: 3
      failureThreshold: 3
```

## 3. Tắt Pod không gián đoạn (Zero-Downtime): Xử lý `Terminating` với `preStop` Hook và `SIGTERM`

Ngay cả khi đã có `readinessProbe`, nhiều đội ngũ vẫn thấy khách hàng thỉnh thoảng bị lỗi `502 Bad Gateway` trong vài giây đầu của mỗi đợt Rolling Update! Nguyên nhân nằm ở **hai luồng chạy song song bất đồng bộ** ngay khoảnh khắc Kubernetes xóa một Pod cũ:

- [>] **Luồng A (Mạng cụm):** API Server báo cho `EndpointSlice`, `kube-proxy` và `Ingress / Gateway Controller` gỡ IP của Pod cũ khỏi bảng chia tải. Việc truyền tin qua mạng mất khoảng **1 đến 3 giây**.
- [!] **Luồng B (`kubelet` trên Node):** Cùng tích tắc đó, `kubelet` gửi tín hiệu **`SIGTERM`** thẳng vào tiến trình ứng dụng! Nếu Uvicorn hay Express vừa thấy `SIGTERM` đã đóng sập cổng HTTP ngay trong `0.05 giây`, các gói tin khách hàng còn đang trên đường bay tới từ Luồng A sẽ đâm sầm vào cánh cửa đóng kín → **`502 Bad Gateway`**!

```visual
kind: flow
title: Chu Trình Dừng An Toàn Không Rớt Mạng (Zero-Downtime Graceful Shutdown)
subtitle: "Toàn bộ preStop + SIGTERM đều nằm chung bên trong tổng quỹ thời gian terminationGracePeriodSeconds (mặc định 30s)"
footer: "Nếu preStop ngủ 5s trong quỹ 30s, ứng dụng (FastAPI lifespan / Node server.close) còn tối đa 25s để xử lý nốt request cũ trước khi bị bắn SIGKILL"
steps:
  - icon: network
    badge: Giây 0 · Song song
    title: Pod Terminating & Gỡ IP
    desc: Luồng mạng bắt đầu rút IP của Pod khỏi EndpointSlice và Gateway/Ingress (mất ~1-3s)
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
    title: Bắt SIGTERM & Đóng Êm
    desc: Uvicorn lifespan / Node server.close() hoàn tất nốt giao dịch dở dang rồi đóng DB
    code: "Exit Code 0"
    tone: emerald
    edge: nếu lố 30s ân hạn
  - icon: flame
    badge: Quá hạn 30s · Cưỡng bức
    title: Tín hiệu SIGKILL (9)
    desc: Nhân Linux/kubelet kết liễu cưỡng bức nếu tiến trình vẫn treo quá hạn ân hạn
    code: "SIGKILL"
    tone: rose
```

> [!TIP] Quy tắc tính quỹ thời gian `terminationGracePeriodSeconds` & lưu ý Distroless
> - Thời gian chạy của móc `lifecycle.preStop` được **tính gộp chung vào bên trong** tổng hạn mức `terminationGracePeriodSeconds: 30` (ví dụ `preStop` ngủ `5s` thì ứng dụng còn `25s` để xả request sau `SIGTERM` trước khi nhận ==`SIGKILL`==).
> - Từ Kubernetes v1.30+, ngoài lệnh shell `["sh", "-c", "sleep 5"]`, K8s còn hỗ trợ hành động gốc `preStop: { sleep: { seconds: 5 } }` cực kỳ tiện cho các container siêu tối giản không có `/bin/sh`!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`startupProbe`** tạm khóa `liveness` & `readiness` lúc mới khởi động (tổng thời gian tối đa = **`periodSeconds * failureThreshold`**).
> - **`readinessProbe`** thất bại **không bao giờ giết Pod**, chỉ rút IP khỏi `Service Endpoints` · **Chỉ kiểm tra DB/API ngoài ở `readinessProbe`**, tuyệt đối không đặt vào `livenessProbe`!
> - Kết hợp **`lifecycle.preStop`** + bắt **`SIGTERM`** bên trong quỹ **`terminationGracePeriodSeconds`** (hết hạn sẽ bị dừng bằng **`SIGKILL`**).

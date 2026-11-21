# Chẩn đoán lỗi K8s Thực chiến (Phần 2): Xử lý OOMKilled (137), Mất mạng 502 & Khôi phục Rollout

Ở bài `K18`, bạn đã làm chủ cách chẩn đoán những sự cố ngăn cản Pod khởi động ngay từ vạch xuất phát. Nhưng những ca trực đêm gay cấn nhất của đời kỹ sư lại xảy ra khi **tất cả các Pod tưởng chừng đã `Running` êm xuôi**, hoặc nổ ra ngay **giữa lúc đang triển khai phiên bản mới vào giờ cao điểm**!

Trong module tổng kết khóa học này, bạn sẽ trực tiếp xử lý 4 kịch bản sự cố vận hành cấp độ Production phổ biến nhất: tràn bộ nhớ ==`OOMKilled` (`Exit Code 137`)==, đứt mạch ==`502 Bad Gateway` (`Endpoints: <none>`)==, **khôi phục khẩn cấp bằng `kubectl rollout undo`**, và **triệt tiêu lỗi rớt gói tin khi Rolling Update**.

```visual
kind: troubleshoot
title: Bảng Cấp Cứu Nhanh 3 Ca Bệnh Nóng Lúc Hệ Thống Đang Chạy [!badge:rose:SRE Playbook]
subtitle: Khi Pod nhìn thoáng qua vẫn Running nhưng khách hàng kêu lỗi — đọc đúng bằng chứng thép trong 5 giây!
items:
  - symptom: "Ca #5 · Pod đột tử lúc tải nặng: OOMKilled (Exit Code: 137)"
    badge: "128 + 9 (SIGKILL) = 137"
    tone: rose
    cause: "Tiến trình Python / Node.js nạp cả tệp lớn hoặc DataFrame lên RAM vượt quá trần `resources.limits.memory` (ví dụ đặt quá chật `32Mi`), khiến cgroups OOM Killer bắn tín hiệu `SIGKILL (9)`."
    fix: "1) Trước mắt: Nâng `limits.memory` / `requests.memory` lên mức an toàn (`256Mi`–`512Mi`). 2) Căn cơ: Đổi code sang xử lý từng khúc luồng (Python Generator / `StreamingResponse` hoặc Node.js `stream.pipeline`)!"
    cmd: kubectl describe pod pdf-exporter-xxx
  - symptom: "Ca #6A · Pod 1/1 Running nhưng ăn 502 — ENDPOINTS hiện <none>"
    badge: Lệch nhãn selector
    tone: amber
    cause: "Trường `spec.selector` trên `Service` gõ lệch (ví dụ `app: checkout-backend`) không khớp với bộ nhãn `metadata.labels` thực tế trên các Pod (`app: checkout-api`), làm danh sách Endpoints rỗng không có IP nào!"
    fix: "Đối chiếu nhãn thật của Pod với `Selector` của Service và sửa lại `spec.selector` khớp khít 100% — mạng thông tức thì không cần restart Pod."
    cmd: kubectl get endpoints checkout-svc && kubectl get pods --show-labels
  - symptom: "Ca #6B · Pod 1/1 Running, Endpoints đã có IP nhưng vẫn 502 / Connection Refused"
    badge: Lệch cổng targetPort
    tone: cyan
    cause: "`selector` đã khớp nhưng `Service` cấu hình `targetPort: 8080` trong khi Uvicorn lắng nghe `8000` (hoặc Express lắng nghe `3000`). Gói tin bay tới đúng Pod nhưng đập vào cổng đóng kín!"
    fix: "Kiểm tra cổng mở thực tế trên container và chỉnh `spec.ports[].targetPort` của `Service` về đúng cổng ứng dụng đang mở."
    cmd: kubectl describe svc checkout-svc
```

## 1. Sự cố #5 — Pod bị dừng do vượt ngưỡng RAM: `OOMKilled` (`Exit Code 137`)

```visual
kind: illustration
diagram: "kube:k19"
alt: "Bản đồ cấp cứu sự cố Production gồm OOMKilled (Exit Code 137), đứt mạng 502 do Endpoints rỗng hoặc sai targetPort và khôi phục Rollout Undo"
title: "Bản Đồ Trực Chiến Production: Cấp Cứu OOMKilled (137), Lỗi 502 & Quay Lui Rollout"
subtitle: "Phác đồ xử lý nhanh 3 kịch bản sự cố nóng xảy ra ngay giữa lúc hệ thống đang phục vụ lưu lượng thật"
caption: "Ba quy trình bắt mạch và khôi phục tức thì cho lỗi tràn RAM (137), đứt cầu nối Service Endpoints (<none> / lệch cổng) và lỗi bản phát hành mới"
callouts:
  - num: 1
    label: "Đột tử OOMKilled (Exit 137 = 128 + SIGKILL 9)"
    desc: "Bắt bằng chứng trong Last State của describe pod; nâng trần limits.memory trước mắt và chuyển code đọc tệp lớn sang Streaming."
    tone: rose
  - num: 2
    label: "Pod Running nhưng khách ăn 502 (Endpoints: <none>)"
    desc: "Soi ngay kubectl get endpoints để phát hiện lệch nhãn selector hoặc lệch số cổng targetPort so với cổng thực tế."
    tone: amber
  - num: 3
    label: "Khôi phục bản phát hành lỗi trong 2 giây"
    desc: "Nhờ maxUnavailable: 0 giữ bản cũ sống sót, chạy kubectl rollout undo để kéo toàn bộ hệ thống về Revision ổn định trước khi mổ xẻ lỗi."
    tone: emerald
```

Bình thường dịch vụ xuất hóa đơn `pdf-exporter` vẫn chạy `Running`. Nhưng cứ mỗi khi khách hàng yêu cầu kết xuất tệp báo cáo lớn, kết nối bị ngắt ngang, cột `RESTARTS` tăng vọt hoặc `STATUS` nhấp nháy chữ **`OOMKilled`**. Chạy `kubectl describe pod pdf-exporter-...`, bạn sẽ bắt gặp dòng bằng chứng thép:

```text
Last State:   Terminated (Reason: OOMKilled, Exit Code: 137)
Limits:       memory=32Mi
```

> [!TIP] Phác đồ 2 bước trị dứt điểm `Exit Code 137` (`128 + 9 SIGKILL`) cho cả Python & Node.js
> - **Bước 1 — Hạ tầng (Cầm máu tức thời):** Nâng `resources.limits.memory` (và `requests.memory`) trong `Deployment` lên ngưỡng thực tế an toàn (`256Mi` hoặc `512Mi`).
> - **Bước 2 — Mã nguồn (Chữa tận gốc):** Đừng nạp cả tệp 300MB lên một biến RAM!
>   - Trong **Python (`FastAPI` / `Pandas`):** Dùng hàm sinh từng khúc **`yield` generator + `StreamingResponse`** hoặc `pd.read_csv(..., chunksize=5000)`.
>   - Trong **Node.js:** Đổi từ `fs.readFileSync` sang **`fs.createReadStream` + `stream.pipeline`** có điều tiết áp lực ngược (*backpressure*) để giữ mức RAM phẳng chỉ vài chục MB!

## 2. Sự cố #6 — Pod vẫn `1/1 Running` nhưng Service trả về lỗi `502 Bad Gateway`

Đây là chiếc bẫy đánh lừa thị giác kinh điển nhất: cả 2 bản sao `checkout-api` đều hiện `1/1 Running`, log vẫn in `Listening on 0.0.0.0:3000` không một dòng lỗi, nhưng mọi yêu cầu đi qua Ingress/Gateway vào `Service/checkout-svc` đều trả về **`502 Bad Gateway`** hoặc `Connection Refused`!

Đừng nhìn Pod nữa — hãy kiểm tra ngay cầu nối **`Endpoints`** bằng bộ 3 lệnh bắt mạch trong 5 giây:

```bash
kubectl get endpoints checkout-svc
kubectl get pods --show-labels
kubectl describe svc checkout-svc
```

- [!] **Nếu `ENDPOINTS` hiện `<none>`:** Chắc chắn 100% trường `spec.selector` của `Service` đang gõ lệch không khớp với `metadata.labels` của các Pod (hoặc `readinessProbe` của mọi Pod đều đang trượt)!
- [!] **Nếu `ENDPOINTS` đã có danh sách IP Pod mà vẫn `502` / `Connection Refused`:** `Service` đang trỏ sai `targetPort` (ví dụ `targetPort: 8080` trong khi ứng dụng mở cổng `3000` hoặc `8000`, hoặc code bên trong quên bind `0.0.0.0`!). Chỉnh khớp `selector` và `targetPort`, lưu lượng sẽ sống lại ngay lập tức!

## 3. Sự cố #7 — Khôi phục dịch vụ khẩn cấp với `kubectl rollout undo`

Giả sử lúc 20:00 tối cao điểm khuyến mãi, bản phát hành mới `v3.0.0` vừa đẩy lên namespace `production` khiến giao diện `frontend` rơi vào `CrashLoopBackOff`.

> [!WARNING] Nguyên tắc vàng của SRE khi cháy nhà giờ cao điểm: Cầm máu trước, khám nghiệm sau!
> Đừng bao giờ mở IDE ngồi sửa code rồi chờ CI/CD build lại Docker Image mất 15 phút trong lúc khách hàng đang nhìn màn hình lỗi trắng trang! Nhiệm vụ tối thượng của bạn là kéo **Thời gian Phục hồi Trung bình (`MTTR`)** xuống còn 3 giây bằng ==`kubectl rollout undo`==!

```visual
kind: compare
title: "Phản Ứng Khi Đẩy Bản Lỗi Lên Production Giờ Cao Điểm (Tối Ưu MTTR)"
subtitle: "Ưu tiên tối thượng của SRE là khôi phục dịch vụ cho khách hàng trong vài giây trước khi mổ xẻ nguyên nhân!"
left:
  badge: "PHẢN ỨNG SAI · Chết Đứng 15 Phút"
  title: Ngồi mở IDE mò bug trực tiếp lúc cháy nhà
  tone: rose
  code: |
    # Khách hàng gặp lỗi trắng trang suốt 15 phút:
    1. Đọc log đoán mò nguyên nhân (5 phút)
    2. Sửa vội code -> git push (2 phút)
    3. Chờ CI test & build lại Docker Image (8 phút)
  lang: text
  bullets:
    - "Hàng ngàn khách hàng thoát giỏ hàng trong lúc chờ pipeline CI chạy lại"
    - "Sửa code trong tâm lý hoảng loạn cực dễ đẻ thêm lỗi mới chồng lên lỗi cũ"
right:
  badge: "CHUẨN SRE · Cầm Máu Trong 3 Giây!"
  title: Quay lui tức khắc bằng kubectl rollout undo
  tone: emerald
  code: |
    # Xem nhanh lịch sử các bản phát hành:
    kubectl rollout history deployment/frontend -n production

    # Cầm máu khẩn cấp về bản ổn định liền trước!
    kubectl rollout undo deployment/frontend -n production
  lang: shell
  bullets:
    - "Tận dụng ngay bản **ReplicaSet Revision ổn định liền trước** được K8s lưu sẵn để khôi phục dịch vụ trong **3 giây**"
    - "Sau khi hệ thống đã xanh trở lại và khách mua hàng bình thường, mới bình tĩnh kéo log về Staging sửa code căn cơ!"
```

## 4. Sự cố #8 — Kiềng 3 Chân đảm bảo Zero-Downtime toàn diện khi Rolling Update

Cuối cùng, để một dịch vụ API đạt chuẩn **Zero-Downtime thực thụ 100%** — mỗi ngày phát hành 20 lần mà không rớt dù chỉ 1 kết nối của khách hàng — bạn phải khóa chặt đồng bộ **Kiềng 3 Chân** dưới đây trong cùng một bản `Deployment`:

```visual
kind: groups
title: Kiềng 3 Chân Bảo Đảm 100% Zero-Downtime Rolling Update [!badge:emerald:Tổng Kết Khóa Học]
subtitle: Thiếu bất kỳ 1 trong 3 chốt chặn này đều sẽ gây rớt request (502/503) trong vài giây chuyển giao phiên bản!
columns: 3
items:
  - num: 1
    icon: layers
    title: Chiến Lược RollingUpdate
    badge: "maxUnavailable: 0"
    tone: sky
    desc: Chống sụt giảm năng lực chịu tải khi thay ca Pod.
    bullets:
      - "Nếu để `maxUnavailable: 25%` hay `50%`, K8s giết bớt Pod cũ ngay lập tức trước khi Pod mới kịp chạy"
      - "Bắt buộc đặt **`maxUnavailable: 0`** và **`maxSurge: 1`** (bật thêm 1 Pod mới khỏe hẳn rồi mới tắt 1 Pod cũ!)"
    code: |
      strategy:
        type: RollingUpdate
        rollingUpdate:
          maxUnavailable: 0
          maxSurge: 1
    codeLang: yaml
  - num: 2
    icon: shield-check
    title: Cảm Biến readinessProbe
    badge: Chặn bơm khách quá sớm
    tone: emerald
    desc: Chỉ mở cổng đón khách khi FastAPI / Node.js & DB Pool đã sẵn sàng.
    bullets:
      - "Nếu thiếu `readinessProbe`, Pod mới vừa tạo container đã bị bơm khách vào dù cổng HTTP chưa mở xong"
      - "Kiểm tra `/readyz` định kỳ (`periodSeconds: 5`)"
    code: |
      readinessProbe:
        httpGet:
          path: /readyz
          port: 3000
        periodSeconds: 5
    codeLang: yaml
  - num: 3
    icon: shield
    title: Móc Đệm lifecycle.preStop
    badge: Chống đua tốc độ lúc tắt
    tone: amber
    desc: Chờ mạng cụm gỡ sạch IP trước khi đóng cổng HTTP.
    bullets:
      - "Ngủ đệm 5 giây để Gateway/Ingress & `kube-proxy` kịp xóa IP Pod (1–3s) trước khi gửi `SIGTERM`"
      - "Đi kèm `terminationGracePeriodSeconds: 30` để xả êm giao dịch dở dang"
    code: |
      lifecycle:
        preStop:
          exec:
            command: ["sh", "-c", "sleep 5"]
    codeLang: yaml
```

Chúc mừng bạn đã đi tới thử thách cuối cùng của hành trình **Docker & Kubernetes Thực chiến** — hãy hoàn thành 4 ca xử lý sự cố cuối cùng để khẳng định bản lĩnh làm chủ cụm sản xuất!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`OOMKilled` (`Exit Code 137` = `128 + 9 SIGKILL`)** → Tăng `limits.memory` + chuyển sang xử lý luồng (**Python `StreamingResponse`/Generator** hoặc **Node.js `stream.pipeline`**).
> - Pod `1/1 Running` nhưng lỗi `502`: kiểm tra `kubectl get endpoints <svc>` → Nếu `<none>` là **lệch `selector`**, nếu có IP là **lệch `targetPort`**.
> - Phát hành lỗi giờ cao điểm → Ưu tiên giảm MTTR bằng **`kubectl rollout undo deployment/<tên> -n <namespace>`** trước, sửa code sau!
> - Bộ ba Zero-Downtime bất khả phân ly: **`maxUnavailable: 0` (`maxSurge: 1`)** + **`readinessProbe`** + **`lifecycle.preStop` (`sleep 5`)**.

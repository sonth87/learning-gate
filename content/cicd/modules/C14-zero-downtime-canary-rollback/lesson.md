# Phát hành Không gián đoạn (Zero-Downtime), Canary & Rollback Tự động

Hãy hình dung ứng dụng Node.js của bạn đang xử lý 2.000 đơn hàng mỗi phút. Bạn merge một tính năng mới lên `main`, pipeline CI báo xanh mượt và đẩy bản cập nhật lên Production. Đột nhiên trong 20 giây tiếp theo:
- [!] Khách hàng nhận hàng loạt lỗi `502 Bad Gateway` trong lúc thay thế container.
- [!] Hoặc tệ hơn: lỗi `TypeError: Cannot read properties of undefined` lọt qua Unit Test vì dữ liệu thật trên Production có trường `discountCode: null` mà bộ mock ở máy cá nhân chưa từng nghĩ tới!

Làm thế nào các đội ngũ kỹ thuật hàng đầu phát hành 30 lần/ngày mà khách hàng **không bao giờ thấy trang lỗi ({emerald:Zero-Downtime})**, giới hạn rủi ro bằng {sky:Canary / Blue-Green} và khi gặp sự cố thì hệ thống **tự động quay lui trong chưa đầy 30 giây ({rose:Automated Rollback})**? Bí quyết nằm ở trọn bộ 3 trụ cột triển khai dưới đây.

---

## 1. Thẻ Image Bất biến (Immutable Image Tags) — Điều kiện tiên quyết để Rollback

Sai lầm kinh điển nhất của người mới dùng Docker trong CI/CD là đóng gói và đẩy đè mãi lên thẻ `:latest`:

- [!] **Mất dấu bản ổn định cũ:** Thẻ `:latest` là thẻ khả biến (*mutable tag*) — giống như xuất bản gói npm mà cứ xoá đi ghi đè mãi vào phiên bản `1.0.0`. Lúc 2 giờ sáng khi bản mới sập, ảnh ổn định trước đó đã bị ghi đè mất nhãn tham chiếu!
- [!] **Hỗn loạn phiên bản giữa các Node:** Trên cụm Kubernetes dùng `imagePullPolicy: IfNotPresent`, Node A giữ bản `:latest` cũ trong cache còn Node B vừa kéo bản `:latest` mới về, tạo ra trạng thái chạy lệch phiên bản cực khó chẩn đoán.

> [!TIP] Quy chuẩn Production bắt buộc
> Mỗi commit đi qua CI phải sinh ra một **thẻ bất biến (==Immutable Tag==)** gắn chặt với mã băm Git SHA (`ghcr.io/acme/shop-api:sha-${{ github.sha }}`) hoặc Semantic Version (`v1.4.2`). Khi cần Rollback, hệ thống chỉ việc trỏ Deployment quay về đúng mã `sha-<commit_cũ>` vẫn nằm nguyên vẹn trên Container Registry!

---

## 2. So sánh 3 Chiến lược Phát hành: Rolling Update vs Blue-Green vs Canary

Thay vì tắt sạch Pod cũ rồi mới bật Pod mới (*Recreate* gây chết dịch vụ), Kubernetes và **Argo Rollouts** (`argoproj.io/v1alpha1`) cung cấp 3 chiến lược điều phối lưu lượng thông minh:

```visual
kind: groups
title: So Sánh 3 Chiến Lược Phát Hành Không Gián Đoạn (Zero-Downtime Strategies)
subtitle: Lựa chọn đánh đổi phù hợp giữa chi phí hạ tầng, tốc độ gạt lưu lượng và bán kính ảnh hưởng rủi ro (Blast Radius)
columns: 3
items:
  - num: 1
    icon: refresh
    title: Rolling Update
    badge: Mặc định K8s · Tiết kiệm
    tone: sky
    bullets:
      - "Thay thế cuốn chiếu từng Pod cũ sang Pod mới (kết hợp `readinessProbe` + `preStop`)"
      - "**Ưu điểm:** Không tốn gấp đôi hạ tầng, tích hợp sẵn trong `Deployment` chuẩn"
      - "**Hạn chế:** Khó chia chính xác tỷ lệ nhỏ kiểu 5% người dùng; tốc độ quay lui phụ thuộc nhịp bật lại Pod"
    footer: Phù hợp dịch vụ nội bộ & API tiêu chuẩn
  - num: 2
    icon: layers
    title: Blue-Green
    badge: Gạt 100% tức thì · Tốn ~2x cụm
    tone: cyan
    bullets:
      - "Dựng song song toàn bộ cụm **Green** (mới) cạnh cụm **Blue** (đang phục vụ khách)"
      - "Kiểm thử qua **`previewService`** trước khi gạt **`activeService`** 100% sang Green trong `< 1 giây`"
      - "**Chi phí:** Tạm thời tốn **gấp đôi (~2x)** CPU/RAM trong lúc duy trì song song hai cụm"
    footer: Lý tưởng khi cần QA kiểm tra cổng Preview trước giờ G
  - num: 3
    icon: activity
    title: Canary (Chim hoàng yến)
    badge: Nhỏ giọt 5% → 25% → 100%
    tone: emerald
    bullets:
      - "Chuyển dần từng phần trăm nhỏ lưu lượng người dùng thật kèm nhịp nghỉ nghe ngóng metric"
      - "**Ưu điểm tối thượng:** Thu hẹp **bán kính ảnh hưởng (*Blast Radius*)** — nếu bản mới lỗi, 95% khách hàng còn lại vẫn bình an!"
      - "**Yêu cầu:** Cần Argo Rollouts / Ingress / Service Mesh và đo lường HTTP 5xx"
    footer: Tiêu chuẩn vàng cho thanh toán & lưu lượng lớn
```

Trong **Argo Rollouts**, cấu hình **Blue-Green** tách biệt rạch ròi lưu lượng khách hàng thật (`activeService`) và cổng kiểm thử nội bộ (`previewService`):

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: shop-api
spec:
  replicas: 4
  strategy:
    blueGreen:
      activeService: shop-api-active     # Lưu lượng khách hàng thật hiện hành
      previewService: shop-api-preview   # Cổng nội bộ trỏ vào bản mới để chạy E2E/QA
      autoPromotionEnabled: false        # Đợi lệnh xác nhận mới gạt activeService sang bản mới
```

Còn với chiến lược **Canary**, mảng `steps` phối hợp nhịp nhàng giữa `setWeight` (phần trăm lưu lượng) và `pause`:
- Viết **`pause: { duration: "2m" }`**: Tự động chờ nghe ngóng chỉ số lỗi trong 2 phút rồi nâng nấc tiếp theo.
- Viết ==`pause: {}`== (đối tượng rỗng không có `duration`): **Tạm dừng vô thời hạn** như một chốt chặn thủ công cho tới khi người vận hành hoặc pipeline gọi lệnh `kubectl argo rollouts promote`!

```yaml
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: "2m" }   # Tự động chờ 2 phút quan sát lỗi 5xx / p99
        - setWeight: 25
        - pause: {}                   # Tạm dừng vô thời hạn chờ lệnh promote tường minh!
        - setWeight: 100
```

---

## 3. Hậu kiểm Smoke Test & Quay lui Tự động (Automated Rollback)

Đừng bao giờ coi lệnh `deploy` trả về exit code `0` đồng nghĩa với "phát hành thành công"! Lệnh cập nhật chỉ mới gửi cấu hình cho cụm máy chủ; tiến trình Node.js bên trong có thể đang kẹt kết nối Redis hoặc thiếu biến môi trường dẫn tới trả mã `503 Service Unavailable` ở `/readyz`.

```visual
kind: flow
title: Chu Trình Phát Hành Tự Phục Hồi — Canary + Smoke Test + Auto-Rollback
subtitle: Phát hiện lỗi thực tế ngay sau triển khai và tự động quay lui về thẻ SHA ổn định trước đó trong dưới 30 giây
steps:
  - icon: package
    badge: Bước 1 · Bất biến
    title: Immutable SHA Image
    desc: Đóng gói ảnh gắn chặt mã commit sha-<git_sha>, không bao giờ ghi đè :latest
    code: "shop-api:sha-8f3c2a1"
    tone: sky
    edge: nâng nấc lưu lượng
  - icon: zap
    badge: Bước 2 · Nhỏ giọt
    title: Canary / Blue-Green
    desc: Mở thử nghiệm lưu lượng có kiểm soát qua Argo Rollouts
    code: "setWeight: 5 -> pause"
    tone: violet
    edge: kiểm tra /readyz
  - icon: doctor
    badge: Bước 3 · Hậu kiểm
    title: Smoke Test (curl --fail)
    desc: Thử lại có độ trễ chờ Load Balancer đồng bộ; ép mã HTTP >= 400 báo đỏ
    code: "curl --fail --retry 5"
    tone: amber
    edge: "khi gãy -> if: failure()"
  - icon: rollback
    badge: Bước 4 · Phanh khẩn cấp
    title: Automated Rollback
    desc: Thức dậy nhờ if:failure(), quay lui về bản ổn định cũ & bắn cảnh báo On-call
    code: "if: failure() -> undo"
    tone: rose
```

```visual
kind: compare
title: "Chốt Chặn Smoke Test & Job Rollback: Hai Cái Bẫy Khiến Hệ Thống Mất Phanh!"
subtitle: "Thiếu cờ --fail trên curl hoặc quên if: failure() trên job rollback sẽ vô hiệu hoá hoàn toàn cơ chế tự cứu hộ"
left:
  badge: "PHẢN MẪU MẤT PHANH · False-Green & Skipped"
  title: "curl thiếu --fail & Job rollback bị bỏ qua"
  tone: rose
  code: |
    smoke-test:
      needs: deploy-prod
      runs-on: ubuntu-latest
      steps:
        # BẪY 1: Nhận HTTP 500 nhưng curl vẫn thoát mã 0 (Xanh giả)!
        - run: curl https://api.shop.example.com/readyz

    rollback:
      needs: [deploy-prod, smoke-test]
      # BẪY 2: Thiếu if: failure() -> Mặc định là if: success()
      # Khi smoke-test đỏ, job rollback này bị SKIPPED luôn!
      runs-on: ubuntu-latest
      steps:
        - run: ./scripts/rollback.sh
  lang: yaml
  bullets:
    - "Mặc định `curl` coi việc nhận được phản hồi `HTTP 500 / 502 / 503` là giao tiếp mạng thành công và trả về **exit code `0`**!"
    - "Mọi job có `needs:` trong GitHub Actions ngầm định `if: success()` — khi `smoke-test` gãy, `rollback` bị **bỏ qua (`skipped`)** thay vì chạy!"
right:
  badge: "CHUẨN SRE TỰ PHỤC HỒI · Đủ phanh khẩn cấp"
  title: "curl --fail --retry 5 + Rollback với if: failure()"
  tone: emerald
  code: |
    smoke-test:
      needs: deploy-prod
      runs-on: ubuntu-latest
      steps:
        - run: |
            curl --fail --silent --show-error \
              --retry 5 --retry-delay 3 \
              https://api.shop.example.com/readyz

    rollback:
      needs: [deploy-prod, smoke-test]
      if: failure()     # BẮT BUỘC để thức dậy khi bước trước thất bại!
      runs-on: ubuntu-latest
      steps:
        - run: ./scripts/rollback.sh
  lang: yaml
  bullets:
    - "Cờ ==`--fail`== ép `curl` trả exit code `22` ngay khi HTTP `≥ 400`; cặp **`--retry 5 --retry-delay 3`** tránh báo động giả lúc Ingress / Load Balancer đang cập nhật `EndpointSlice` mới"
    - "Điều kiện ==`if: failure()`== đánh thức job `rollback` ngay khoảnh khắc `deploy-prod` hoặc `smoke-test` thất bại"
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - Luôn gắn **thẻ Image bất biến (`sha-${{ github.sha }}` / `v1.4.2`)**, tuyệt đối cấm ghi đè `:latest` trên Production.
> - **Blue-Green** dùng cặp **`activeService`** & **`previewService`** (~2x tài nguyên, gạt tức thì) · **Canary** chuyển nhỏ giọt (`5% → 25% → 100%`), trong đó `- pause: {}` dừng vô thời hạn chờ lệnh `promote`.
> - Smoke Test bắt buộc có **`curl --fail`** kèm **`--retry 5 --retry-delay 3`**, và job `rollback` có `needs:` bắt buộc phải khai báo **`if: failure()`**!

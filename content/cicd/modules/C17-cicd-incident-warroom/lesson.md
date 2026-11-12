# Phòng Chiến Sự CI/CD (Incident War Room) — 4 Hồ sơ Thực chiến

Chúc mừng bạn đã đi tới chặng cuối cùng của hành trình **CI/CD Mastery**! Kiến thức lý thuyết về YAML chỉ thực sự trở thành bản năng của một Senior DevOps / Platform Engineer khi bạn đứng trước một đường ống đang bốc cháy:
- [!] Đội sản phẩm xếp hàng chờ {amber:42 phút} chưa merge nổi một bản vá khẩn cấp (**Hồ sơ B1**).
- [!] Hai đợt deploy {rose:đè ngang xương lên nhau} làm hỏng khoá trạng thái hạ tầng Production (**Hồ sơ B2**).
- [!] Hệ thống báo động phát hiện {rose:API Key nằm chình ình} trong tệp workflow đã đẩy lên Git (**Hồ sơ B3**).
- [!] Đáng sợ nhất: toàn bộ dấu tích CI đều {emerald:xanh mướt giả tạo} nhưng khách hàng đang nhận trang trắng lỗi {violet:HTTP 500} (**Hồ sơ B6**)!

```visual
kind: troubleshoot
title: "Bảng Phân Loại & Phác Đồ Cấp Cứu Nhanh 4 Hồ Sơ Sự Cố Phòng Chiến Sự [!badge:rose:Incident Triage]"
subtitle: Tra cứu nhanh triệu chứng hiện trường, nguyên nhân gốc rễ (RCA) và hành động khắc phục tức thì
items:
  - symptom: "[Hồ sơ B1] Mỗi PR sửa 1 dòng code phải chờ 42 phút; job treo ngốn sạch 360 phút mặc định"
    badge: Critical Path
    tone: amber
    cause: "Dùng npm install không cache, chạy nối đuôi tuần tự lint -> typecheck -> 400 bài test trên 1 máy, gài sleep 45 cảm tính và quên đặt timeout-minutes."
    fix: "Bật cache: 'npm' + npm ci, tách lint chạy song song với test chia 4 mảnh (shard 1..4), bỏ sleep 45 và khoá timeout-minutes: 15."
    cmd: "strategy: { matrix: { shard: [1, 2, 3, 4] } }  # 42m -> < 5m"
  - symptom: "[Hồ sơ B2] Hai commit merge vào main cách nhau 40 giây làm đứt ngang đợt deploy đang chạy"
    badge: Race Condition
    tone: rose
    cause: "Copy-paste nhầm cấu hình concurrency của nhánh PR sang job deploy-production với cờ cancel-in-progress: true."
    fix: "Trên môi trường Production bắt buộc đặt group cố định kèm cancel-in-progress: false để đợt sau xếp hàng (Pending) chờ đợt trước hoàn tất."
    cmd: "concurrency: { group: production-deploy, cancel-in-progress: false }"
  - symptom: "[Hồ sơ B3] Phát hiện khoá API thật bị gõ cứng trong khối env: của .github/workflows/ci.yml"
    badge: Secret Leak
    tone: rose
    cause: "Lập trình viên viết thẳng chuỗi bí mật vào tệp YAML và đã git push lưu vết vĩnh viễn trong lịch sử git log."
    fix: "1) Thu hồi & xoay vòng (Revoke/Rotate) khoá ngay lập tức + đổi sang secrets.* · 2) Dựng cổng quét Gitleaks kèm fetch-depth: 0."
    cmd: "gitleaks detect --source . --no-banner --redact"
  - symptom: "[Hồ sơ B6] 14 bài Unit Test đỏ rực và server trả HTTP 500 nhưng Pipeline vẫn báo tích XANH"
    badge: Silent False-Green
    tone: violet
    cause: "Mã thoát lỗi khác 0 bị nuốt mất bởi continue-on-error: true, toán tử shell '|| true', hoặc gọi curl thiếu cờ --fail."
    fix: "Xoá bỏ continue-on-error: true và '|| true' khỏi mọi cổng kiểm định/bảo mật; luôn truyền cờ --fail cho lệnh curl Smoke Test."
    cmd: "npm test && curl --fail --silent --show-error https://api.shop.example.com/healthz"
```

---

## 1. Hồ sơ B1: Đường ống "Rùa bò" 42 phút — Giải phẫu Nút thắt Cổ chai (Critical Path)

**Triệu chứng thực tế:** Mỗi lần lập trình viên đẩy 1 commit sửa lỗi chính tả trên PR, cả đội phải ngồi chờ **42 phút**. Thỉnh thoảng một bài tích hợp treo kết nối khiến runner kẹt cứng suốt ==360 phút (6 tiếng)== mặc định của GitHub Actions, đốt sạch hạn mức phút chạy cả tháng!

```visual
kind: compare
title: "Hồ Sơ B1 — Tối Ưu Đường Găng (Critical Path): Từ 42 Phút Xuống Dưới 5 Phút!"
subtitle: "Triệt tiêu thời gian tải mạng lặp lại, phá bỏ chuỗi tuần tự độc đạo và khoá trần thời gian treo"
left:
  badge: "HIỆN TRƯỜNG LỖI · 42 Phút / PR"
  title: "Tuần tự 1 luồng + Không Cache + Thiếu Timeout"
  tone: rose
  code: |
    jobs:
      ci:
        runs-on: ubuntu-latest
        # Thiếu timeout-minutes -> Treo mặc định tới 360 phút (6h)!
        steps:
          - uses: actions/checkout@v4
          - run: npm install          # Tải lại 1.200 gói mất 4 phút, lệch lockfile
          - run: npm run lint
          - run: npm run typecheck
          - run: sleep 45             # Ngủ đông cảm tính vô nghĩa!
          - run: npm test             # Chạy nối đuôi 400 bài test trên 1 máy
  lang: yaml
  bullets:
    - "`npm install` không có bộ đệm phải kéo mạng từ đầu mỗi lần khởi tạo ephemeral runner"
    - "Mọi bước xếp hàng 1 cột dọc khiến tổng thời gian bằng tổng cộng dồn tất cả các bước"
right:
  badge: "PHÁC ĐỒ CHUẨN · Dưới 5 Phút / PR"
  title: "Cache npm ci + Tách DAG Song Song + Sharding 4 Luồng"
  tone: emerald
  code: |
    jobs:
      lint:
        runs-on: ubuntu-latest
        timeout-minutes: 10
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with: { node-version: 22, cache: "npm" }
          - run: npm ci && npm run lint && npm run typecheck

      test:
        runs-on: ubuntu-latest
        timeout-minutes: 15
        strategy:
          matrix:
            shard: [1, 2, 3, 4]
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with: { node-version: 22, cache: "npm" }
          - run: npm ci && npx vitest run --shard=${{ matrix.shard }}/4
  lang: yaml
  bullets:
    - "`cache: \"npm\"` + `npm ci` rút bước cài gói xuống vài giây và khoá cứng theo `package-lock.json`"
    - "`lint` chạy song song độc lập với 4 mảnh `test`; loại bỏ `sleep 45` và khoá `timeout-minutes` chặt chẽ"
```

---

## 2. Hồ sơ B2: Cuộc đua Sinh tử trên Production (Deployment Race Condition)

**Triệu chứng thực tế:** Lúc `14:02:00`, Commit `A` (nâng cấp dịch vụ thanh toán) được merge vào `main` và bắt đầu cập nhật hạ tầng. Lúc `14:02:40` (40 giây sau), Commit `B` (sửa README) được merge nối đuôi. Bất ngờ hệ thống báo lỗi không nhất quán, một nửa cụm chạy cấu hình dở dang (*partial deploy*) và khoá trạng thái (*state lock*) bị hỏng!

```visual
kind: compare
title: "Hồ Sơ B2 — Hai Bộ Mặt Đối Lập Của Cờ cancel-in-progress: PR Nháp vs Production"
subtitle: "Cùng một từ khoá concurrency nhưng copy-paste nguyên xi từ PR sang Production sẽ gây tai nạn rút phích cắm giữa chừng!"
left:
  badge: "DÀNH RIÊNG CHO PR NHÁP · Tiết kiệm phút CI"
  title: "Huỷ ngay bản chạy cũ đã lỗi thời (true)"
  tone: sky
  code: |
    # TRÊN PULL REQUEST: Nhóm động theo số PR / tên nhánh
    concurrency:
      group: ci-${{ github.workflow }}-${{ github.ref }}
      cancel-in-progress: true
  lang: yaml
  bullets:
    - "Khi lập trình viên đẩy tiếp commit mới lên nhánh PR, kết quả test của commit nháp cũ không còn giá trị nên huỷ ngay là hoàn toàn hợp lý"
    - "**CẤM dùng cấu hình `true` này cho Job triển khai hạ tầng / Production!**"
right:
  badge: "BẮT BUỘC CHO PRODUCTION · Tuần tự an toàn"
  title: "Xếp hàng chờ đợt đang chạy hoàn tất (false)"
  tone: emerald
  code: |
    # TRÊN PRODUCTION: Nhóm cố định + Cấm rút phích cắm ngang xương!
    deploy-production:
      environment: production
      concurrency:
        group: production-deploy
        cancel-in-progress: false
  lang: yaml
  bullets:
    - "Đặt ==`cancel-in-progress: false`== đảm bảo đợt triển khai Commit `A` đang chạy migration/Helm được hoàn tất trọn vẹn 100%"
    - "Đợt Commit `B` đến sau sẽ lịch sự đứng ở trạng thái **`Pending` (xếp hàng)** chờ tới lượt an toàn"
```

---

## 3. Hồ sơ B3: Rò rỉ Khoá Bí mật Cứng (Hardcoded Secret Leak) trong YAML

**Triệu chứng thực tế:** Một kỹ sư vì muốn chạy thử tích hợp thanh toán cho nhanh đã gõ cứng `STRIPE_API_KEY: "<HARDCODED_SECRET_EXAMPLE>"` ngay trong khối `env:` của `.github/workflows/ci.yml` rồi `git push` lên kho GitHub!

> [!WARNING] Ngộ nhận chết người khi xử lý lộ Secret trên Git!
> Nhiều người tưởng rằng chỉ cần tạo một commit mới sửa dòng đó thành `${{ secrets.STRIPE_API_KEY }}` là xong. **SAI HOÀN TOÀN!** Commit mới chỉ xoá chuỗi khoá ở ảnh chụp `HEAD` hiện tại, còn khoá thật vẫn nằm nguyên vẹn vĩnh viễn trong lịch sử `git log` (và các bot săn khoá tự động chỉ mất vài giây để quét thu thập)!

**Phác đồ ứng cứu chuẩn DevSecOps bắt buộc thực hiện đủ 2 vế:**
- [x] **Vế 1 — Ứng cứu tức thời (Remediation):** Lập tức vào trang quản trị dịch vụ bên thứ ba **Thu hồi & Xoay vòng (==Revoke / Rotate==)** khoá bị lộ để biến chuỗi trong lịch sử Git thành vô giá trị; đồng thời cập nhật YAML sang `${{ secrets.STRIPE_API_KEY }}`.
- [x] **Vế 2 — Dựng chốt chặn phòng ngừa tái phát (Preventive Gate):** Bổ sung bước quét lịch sử commit bằng **Gitleaks** đi kèm ==`fetch-depth: 0`== trên `actions/checkout@v4` ngay đầu pipeline — giúp bắt gọn cả trường hợp ai đó lỡ commit lộ khoá ở commit thứ #1 rồi xoá đi ở commit thứ #2 trong cùng một PR!

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0   # Bắt buộc tải toàn bộ lịch sử các commit trong PR!
- name: Cổng chặn rò rỉ khoá bí mật Gitleaks
  run: gitleaks detect --source . --no-banner --redact
```

---

## 4. Hồ sơ B6: Thảm hoạ "Xanh vỏ đỏ lòng" (Silent False-Green Pipeline)

**Triệu chứng thực tế:** Một bản code chứa lỗi biên dịch và 14 bài Unit Test thất bại vẫn hiển thị **dấu tích xanh lá cây** rực rỡ trên PR, tự tin đi thẳng lên Production và đánh sập luồng đặt hàng!

```visual
kind: groups
title: "Hồ Sơ B6 — Truy Quét Tận Gốc 3 Thủ Phạm 'Nuốt Mã Thoát' (Exit Code != 0 Biến Thành 0)"
subtitle: Chỉ cần tồn tại 1 trong 3 dòng cấu hình này, mọi cổng kiểm định chất lượng và bảo mật đều trở thành hình nộm vô tác dụng!
columns: 3
items:
  - num: 1
    icon: alert
    title: "continue-on-error: true"
    badge: Tắt phanh cổng chặn
    tone: rose
    bullets:
      - "Thường bị ai đó bật tạm trên `unit-test` hoặc `trivy-scan` để ép qua PR gấp rồi bỏ quên suốt 6 tháng"
      - "Dù Trivy bắt được 10 lỗ hổng `CRITICAL` và trả mã thoát `1`, pipeline vẫn báo **XANH** và đẩy thẳng lên Production!"
    code: |
      # XOÁ NGAY dòng này trên mọi cổng Hard Gate:
      continue-on-error: true
    codeLang: yaml
  - num: 2
    icon: terminal
    title: "Toán tử Shell || true"
    badge: Nuốt lỗi dòng lệnh
    tone: amber
    bullets:
      - "Trong shell, toán tử OR logic ==`||`== sẽ chạy vế phải (`true`, luôn trả mã thoát `0`) khi lệnh bên trái thất bại"
      - "Biến `npm test` đang đỏ (`exit 1`) thành `exit 0` êm ru trước mắt GitHub Actions!"
    code: |
      # SAI: npm test || true
      # ĐÚNG — giữ nguyên mã thoát trung thực:
      run: npm test
    codeLang: yaml
  - num: 3
    icon: globe
    title: "curl thiếu cờ --fail"
    badge: Mù trước lỗi HTTP 500
    tone: violet
    bullets:
      - "Không có `--fail` (`-f`), lệnh `curl` nhận phản hồi `HTTP/1.1 500 Internal Server Error` từ server đang sập vẫn báo `exit 0`!"
      - "Luôn bắt buộc truyền `--fail` trong mọi kịch bản Smoke Test hậu triển khai"
    code: |
      curl --fail --silent --show-error \
        --retry 5 --retry-delay 3 \
        https://api.shop.example.com/healthz
    codeLang: shell
```

> [!REMEMBER] Ghi nhớ bỏ túi (Tổng kết Phòng Chiến Sự)
> - **B1 (Tốc độ & Treo máy):** Dùng `cache: "npm"` + `npm ci`, tách DAG song song + Sharding 4 luồng, xoá `sleep` cảm tính và luôn đặt **`timeout-minutes`** (mặc định của GitHub Actions lên tới **360 phút**!).
> - **B2 (Chống đè Deploy):** Trên Production luôn khoá **`concurrency: { group: "production-deploy", cancel-in-progress: false }`**.
> - **B3 (Lộ Secret):** Bắt buộc **Revoke/Rotate** khoá cũ ngay lập tức (xoá ở commit mới không xoá được `git log`) + chặn bằng **`gitleaks detect`** kèm **`fetch-depth: 0`**.
> - **B6 (Chống Xanh giả):** Quét sạch **`continue-on-error: true`**, toán tử **`||` (`|| true`)**, và lệnh `curl` thiếu **`--fail`**!

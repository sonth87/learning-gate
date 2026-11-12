# Phòng tuyến DevSecOps 5 Lớp: Quét Secret, SAST, SCA, Cổng chặn CVE Container, SBOM & Đóng gói Không Đặc quyền

Trong mô hình phát triển phần mềm cũ cách đây một thập kỷ, đội Bảo mật chỉ nhảy vào kiểm tra vào... tuần cuối cùng trước ngày ra mắt sản phẩm. Khi họ phát hiện 15 lỗ hổng nghiêm trọng và 1 khoá API nằm phơi trong lịch sử Git, ngày phát hành bị hoãn cả tháng trong sự căng thẳng tột độ giữa Dev và Security!

Triết lý ==DevSecOps ("Shift-Left Security" — Dịch chuyển bảo mật sang bên trái)== thay đổi hoàn toàn cuộc chơi: đưa các chốt kiểm tra tự động ({amber:Gitleaks}, {sky:Semgrep}, {violet:npm audit}, {rose:Trivy}, {emerald:CycloneDX SBOM}) chạy ngay trong **3–5 phút đầu của mỗi Pull Request**, biến việc bắt lỗ hổng nhẹ nhàng như cách `ESLint` hay `TypeScript` báo gạch chân đỏ ngay lúc bạn vừa gõ code xong!

```visual
kind: flow
title: Phễu Lọc Bảo Mật DevSecOps 5 Lớp Tự Động Ngay Trên Đường Ống
subtitle: Mỗi lớp soi chiếu một bề mặt tấn công độc lập — lọt qua lớp trước sẽ bị chặn đứng ở lớp sau
steps:
  - icon: key
    badge: Lớp 1 · Git History
    title: Secret Scanning
    desc: Gitleaks quét toàn bộ lịch sử commit (fetch-depth 0) bắt khoá lộ
    code: "gitleaks detect --redact"
    tone: amber
    edge: mã sạch khoá
  - icon: code
    badge: Lớp 2 & 3 · Code + Deps
    title: SAST & SCA
    desc: Semgrep soi code tự viết (src/) · npm audit soi thư viện bên thứ 3
    code: "semgrep ci + npm audit --omit=dev"
    tone: sky
    edge: đóng gói Rootless
  - icon: shield-alert
    badge: Lớp 4 · Container OS
    title: Image CVE Gate
    desc: Trivy chặn lỗ hổng CRITICAL đã có bản vá trong Alpine/Debian
    code: "trivy image --exit-code 1"
    tone: rose
    edge: kiểm kê & hậu kiểm
  - icon: file-code
    badge: Lớp 5 · Chuỗi cung ứng
    title: SBOM & DAST
    desc: Xuất hồ sơ nguyên liệu CycloneDX JSON & quét động điểm cuối Staging
    code: "sbom.cdx.json (CycloneDX)"
    tone: emerald
```

---

## 1. Kiến trúc Phòng thủ Đa tầng ("Lát Phô mai Thuỵ Sĩ") trên CI

Tại sao không dùng 1 công cụ duy nhất mà phải phối hợp đủ **5 lớp**? Bởi một ứng dụng Node.js hiện đại được ghép từ nhiều tầng vật liệu khác nhau — code TypeScript của bạn sạch không có nghĩa là gói npm bên thứ ba hay thư viện C `openssl` dưới đáy Docker Image cũng sạch!

```visual
kind: layers
title: "Bản Đồ 5 Lớp Phòng Tuyến DevSecOps Trong Dự Án Node.js [!badge:emerald:Defense in Depth]"
subtitle: Phân biệt rạch ròi đối tượng soi chiếu của từng công cụ để không trùng lặp và không bỏ lọt lỗ hổng
columns:
  - title: Các Lớp Kiểm Định Trước Đóng Gói (Source & Dependencies)
    badge: Lớp 1 → Lớp 3 · Chạy trong vài chục giây
    tone: sky
    layers:
      - label: "Lớp 1 — Secret Scanning (Gitleaks / TruffleHog)"
        sub: "Soi toàn bộ lịch sử các commit Git (yêu cầu fetch-depth: 0)"
        note: Bắt lộ DB URL, JWT, Stripe Key
        tone: amber
      - label: "Lớp 2 — SAST: Phân tích Mã tĩnh (Semgrep / CodeQL)"
        sub: "Soi cây cú pháp AST mã nguồn do chính đội bạn viết (src/**/*.ts)"
        note: Bắt SQLi, eval(), Regex DoS, thiếu Auth
        tone: sky
      - label: "Lớp 3 — SCA: Kiểm toán Thư viện mở (npm audit / Trivy fs)"
        sub: "Đối chiếu cây phụ thuộc bên thứ ba trong package-lock.json với kho CVE"
        note: Bắt gói npm dính CVE high/critical
        tone: violet
    footer: Phản hồi ngay trên từng dòng code của Pull Request trước khi tốn CPU đóng gói Image
  - title: Các Lớp Kiểm Định Thành Phẩm & Vận Hành (Artifact & Runtime)
    badge: Lớp 4 → Lớp 5 (+ DAST) · Chốt chặn trước Production
    tone: emerald
    layers:
      - label: "Lớp 4 — Container Image CVE Gate (Trivy image / Grype)"
        sub: "Soi các gói hệ điều hành Alpine/Debian (openssl, libcrypto, curl) trong Image"
        note: Chặn tràn bộ nhớ tầng OS C/C++
        tone: rose
      - label: "Lớp 5 — Hồ sơ Nguyên liệu SBOM (CycloneDX / SPDX)"
        sub: "Xuất danh mục kiểm kê toàn bộ thành phần có mặt trong bản build (sbom.cdx.json)"
        note: Tra cứu Zero-day mới trong 2 giây!
        tone: emerald
      - label: "Mở rộng — DAST / Smoke Security trên Staging (OWASP ZAP)"
        sub: "Giả lập truy vấn HTTP thực tế vào dịch vụ đang sống để rà thiếu Security Headers / CORS"
        note: Kiểm chứng hành vi thực thi động
        tone: cyan
    footer: Đảm bảo chỉ những Container Image sạch và có hồ sơ xuất xứ rõ ràng mới được lên Registry
```

> [!ANALOGY] SBOM giống hệt "Bảng thành phần dinh dưỡng" hoặc hồ sơ linh kiện máy bay!
> Khi tuần sau thế giới bất ngờ công bố một lỗ hổng Zero-day chấn động (như *Log4Shell* hay *xz-utils*), thay vì phải kéo hàng trăm Docker Image cũ về quét lại mất cả ngày, đội Bảo mật chỉ cần truy vấn kho tệp **`sbom.cdx.json`** là biết chính xác trong **2 giây** những microservice nào đang chứa phiên bản thư viện lỗi đó để vá khẩn cấp!

---

## 2. Cấu hình thực dụng từng Lớp (Triệt tiêu bẫy "Cảnh báo ồn ào" — Alert Fatigue!)

Sai lầm khiến nhiều đội ngũ chán ghét công cụ bảo mật rồi lén tắt bỏ là **để ngưỡng báo động quá nhiễu**: ví dụ bắt lỗi cả các gói `devDependencies` chỉ chạy ở máy dev (`eslint`, `vitest`), hoặc chặn đường ống vì một lỗ hổng mức `LOW` trong nhân Debian mà chính nhà phát hành Debian còn chưa tung bản vá!

Hãy áp dụng bộ tham số tinh chỉnh chuẩn công nghiệp sau:

### 1) Lớp 1 — Quét lịch sử Git với `Gitleaks` (Bắt buộc mở `fetch-depth: 0`!)
Mặc định `actions/checkout@v4` chỉ tải nông đúng **1 commit cuối cùng** (`fetch-depth: 1`). Nếu lập trình viên lỡ commit lộ khoá ở commit #1 trong PR, rồi ở commit #2 họ xoá dòng đó đi, quét nông sẽ **bỏ lọt hoàn toàn khoá vẫn nằm nguyên trong lịch sử commit #1**!
- [x] Bắt buộc đặt ==`fetch-depth: 0`== để tải trọn vẹn lịch sử commit.
- [x] Luôn truyền cờ **`--redact`** để Gitleaks che dấu `***` thay vì in ngược chuỗi bí mật vừa bắt được ra màn hình log CI công khai!

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
- name: Quét rò rỉ khoá bí mật xuyên suốt lịch sử commit
  run: gitleaks detect --source . --no-banner --redact
```

### 2) Lớp 2 & 3 — Phân tích mã nhà trồng (`Semgrep`) vs Nguyên liệu nhập về (`npm audit --omit=dev`)
- **`SAST` (`Semgrep`):** Quét lỗi tư duy bảo mật trong code của chính đội bạn viết.
- **`SCA` (`npm audit`):** Dùng cờ chuẩn hiện đại ==`--omit=dev`== (thay cho `--production` cũ) để **chỉ kiểm toán các thư viện thực sự chạy trên Production (`dependencies`)**, bỏ qua công cụ phát triển:

```yaml
- name: Kiểm toán lỗ hổng thư viện Production (SCA)
  run: npm audit --omit=dev --audit-level=high

- name: Phân tích mã nguồn tĩnh SAST
  run: semgrep ci
```

### 3) Lớp 4 & 5 — Cổng chặn `Trivy` với "Bộ 3 Cờ Vàng" & Xuất `CycloneDX SBOM`
> [!WARNING] Bẫy chết người số 1 của Trivy: Mặc định `--exit-code` bằng `0`!
> Nếu bạn chỉ gõ `trivy image ghcr.io/acme/shop-api:1.0` mà **quên truyền `--exit-code 1`**, dù phát hiện **12 lỗ hổng `CRITICAL`** thì Trivy chỉ in bảng cảnh báo cho vui rồi vẫn trả mã thoát `0` — khiến đường ống báo **XANH** và đẩy thẳng ảnh đầy lỗ hổng lên Production!

Luôn kết hợp đồng thời **3 cờ vàng** trên cổng chặn Trivy:
1. ==`--exit-code 1`==: Ép trả mã thoát đỏ (`1`) để chặn cứng đường ống khi phát hiện vi phạm.
2. **`--severity CRITICAL`**: Chỉ chặn đứng đường ống với các lỗ hổng chí mạng thực sự.
3. ==`--ignore-unfixed`==: Chỉ chặn những CVE **đã có bản vá chính thức** từ nhà phát hành hệ điều hành/thư viện — đảm bảo mỗi khi pipeline báo đỏ, lập trình viên luôn có hướng nâng cấp rõ ràng thay vì bất lực đi bật `continue-on-error: true`!

```yaml
- name: Cổng chặn lỗ hổng Container mức CRITICAL đã có bản vá
  run: trivy image --exit-code 1 --severity CRITICAL --ignore-unfixed ghcr.io/acme/shop-api:${{ github.sha }}

- name: Xuất hồ sơ nguyên liệu CycloneDX SBOM
  run: trivy image --format cyclonedx --output sbom.cdx.json ghcr.io/acme/shop-api:${{ github.sha }}
```

---

## 3. Hiểm hoạ `Docker-in-Docker (privileged)` & Lời giải Đóng gói Rootless với **Kaniko**

Trên GitLab CI hoặc các cụm Kubernetes Runner nội bộ dùng chung, để đóng gói ảnh Docker bên trong một container CI, cách làm cũ thường bật dịch vụ `docker:dind` kèm cờ `privileged: true` hoặc gắn thẳng ổ cắm `/var/run/docker.sock` của máy chủ vật lý vào Runner.

```visual
kind: compare
title: "Đóng Gói Container Trên Cụm Runner Nội Bộ: docker:dind (Privileged) vs Kaniko Rootless"
subtitle: "Không bao giờ trao quyền root máy chủ vật lý cho một tiến trình CI đang biên dịch mã nguồn từ Pull Request!"
left:
  badge: "RỦI RO LEO THANG ĐẶC QUYỀN · Cách cũ"
  title: "docker:dind (privileged: true) / Gắn docker.sock"
  tone: rose
  code: |
    # NGUY HIỂM TRÊN RUNNER DÙNG CHUNG:
    build_image:
      image: docker:27
      services:
        - name: docker:27-dind
          # Mở toang quyền nhân Linux của máy chủ vật lý!
      variables:
        DOCKER_HOST: tcp://docker:2375
      # Hoặc gắn trực tiếp /var/run/docker.sock của Host
  lang: yaml
  bullets:
    - "Bật ==`privileged: true`== hoặc gắn `docker.sock` tương đương **trao thẳng quyền `root` tối cao của máy chủ Runner vật lý** cho mã lệnh trong Job"
    - "Tin tặc có thể thoát khỏi container (*Container Escape*), đọc trộm biến môi trường và mã nguồn của mọi dự án khác đang chạy chung trên Node đó!"
right:
  badge: "CHUẨN CLOUD-NATIVE · Daemonless & Rootless"
  title: "Kaniko Executor / BuildKit Rootless"
  tone: emerald
  code: |
    # AN TOÀN TUYỆT ĐỐI TRÊN KUBERNETES / GITLAB RUNNER:
    build_image:
      stage: build
      image:
        name: gcr.io/kaniko-project/executor:debug
        entrypoint: [""]
      script:
        - /kaniko/executor
          --context "${CI_PROJECT_DIR}"
          --dockerfile "${CI_PROJECT_DIR}/Dockerfile"
          --destination "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
  lang: yaml
  bullets:
    - "**Kaniko** giải nén từng lớp `Dockerfile` hoàn toàn trong không gian người dùng (*Userspace*)"
    - "**Không cần Docker Daemon chạy ngầm** và **không cần cờ `privileged: true`** — đóng gói xong đẩy thẳng ảnh lên Registry an toàn tuyệt đối"
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Gitleaks** cần **`fetch-depth: 0`** để quét toàn bộ lịch sử commit · **SAST (`Semgrep`)** quét code tự viết vs **SCA (`npm audit --omit=dev`)** quét thư viện bên thứ ba.
> - Cổng chặn **`trivy image`** bắt buộc có **`--exit-code 1`** (vì mặc định trả `0`!) kết hợp **`--severity CRITICAL --ignore-unfixed`**.
> - **SBOM (`CycloneDX` / `SPDX`)** lưu danh mục thành phần bản phát hành giúp tra cứu ảnh hưởng Zero-day tức thì.
> - Tránh xa `docker:dind` (`privileged: true`) trên Runner dùng chung; ưu tiên **Kaniko** hoặc **BuildKit Rootless**!

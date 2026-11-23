# Kiến trúc DevSecOps 5 lớp: Quét Secret, SAST, SCA, Trivy, SBOM và Rootless Container Build

Trong quy trình phát triển phần mềm truyền thống, đội Bảo mật thường chỉ kiểm tra vào giai đoạn cuối trước khi phát hành. Khi phát hiện nhiều lỗ hổng nghiêm trọng hoặc khóa API lộ trong lịch sử Git vào phút chót, kế hoạch phát hành buộc phải trì hoãn để xử lý lại từ đầu.

Triết lý ==DevSecOps ("Shift-Left Security" — Dịch chuyển bảo mật sang giai đoạn sớm)== khắc phục vấn đề này bằng cách tích hợp các công cụ kiểm tra tự động (**Gitleaks**, **Semgrep**, **npm audit**, **Trivy**, **CycloneDX SBOM**) chạy ngay trong **3–5 phút đầu của mỗi Pull Request**, giúp lập trình viên phát hiện và sửa lỗ hổng ngay trong quá trình viết code tương tự như `ESLint` hoặc `TypeScript`.

```visual
kind: flow
title: Hệ thống kiểm tra bảo mật DevSecOps 5 lớp tự động trên Pipeline
subtitle: Mỗi lớp kiểm tra một bề mặt tấn công độc lập — lỗ hổng vượt qua lớp trước sẽ bị phát hiện ở lớp sau
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

## 1. Kiến trúc phòng thủ đa tầng trong DevSecOps trên CI

```visual
kind: illustration
diagram: "cicd:c11"
src: "/illustrations/cicd/cicd-devsecops-five-shields.jpg"
alt: "Hệ thống kiểm tra DevSecOps 5 lớp tự động gồm Gitleaks quét Secret, Semgrep SAST, npm audit SCA, Trivy quét CVE Container và hồ sơ SBOM/Cosign"
title: "Kiến trúc kiểm định DevSecOps 5 lớp (Shift-Left Security)"
subtitle: "Phối hợp 5 công cụ kiểm tra chuyên biệt cùng đóng gói Rootless để phát hiện lỗ hổng ngay từ mỗi Pull Request"
caption: "5 lớp kiểm tra độc lập từ quét khóa lịch sử Git, phân tích mã tĩnh SAST, kiểm toán gói phụ thuộc SCA, quét ảnh Trivy tới xuất hồ sơ SBOM & DAST"
callouts:
  - num: 1
    label: "Lớp 1-3: Quét Secret (Gitleaks), SAST & SCA trước khi đóng gói"
    desc: "Kiểm tra toàn bộ lịch sử commit (fetch-depth: 0) bắt khoá rò rỉ, rà lỗi bảo mật trong mã tự viết bằng Semgrep và kiểm tra gói chạy thật với npm audit."
    tone: amber
  - num: 2
    label: "Lớp 4: Cổng chặn CVE hệ điều hành Container (Trivy)"
    desc: "Quét các thư viện C dưới đáy Alpine/Debian của ảnh vừa đóng gói (không gắn docker.sock của Host) và trả mã lỗi 1 nếu phát hiện CVE nghiêm trọng."
    tone: rose
  - num: 3
    label: "Lớp 5: Xuất danh mục thành phần SBOM, Ký số & DAST"
    desc: "Sinh tệp CycloneDX JSON để truy vết nhanh khi có Zero-Day mới công bố, ký xác thực ảnh với Cosign và quét động điểm cuối Staging."
    tone: emerald
```

Một ứng dụng hiện đại được cấu thành từ nhiều lớp (mã nguồn tự viết, thư viện bên thứ ba, hệ điều hành trong Container Image), nên một công cụ đơn lẻ không thể phát hiện hết mọi rủi ro. Dưới đây là vai trò kỹ thuật của từng lớp kiểm tra:

- **`Secret Scanning` (Quét rò rỉ khóa bí mật — ví dụ `Gitleaks`):** Rà soát toàn bộ lịch sử commit Git để phát hiện mật khẩu cơ sở dữ liệu, khóa API hay token bị đưa nhầm vào mã nguồn.
- **`SAST` (*Static Application Security Testing* — Phân tích mã nguồn tĩnh):** Phân tích cây cú pháp mã nguồn (`src/`) do đội ngũ tự viết để phát hiện các mẫu lỗi như SQL Injection, `eval()`, XSS mà không cần chạy ứng dụng.
- **`SCA` (*Software Composition Analysis* — Kiểm toán thư viện bên thứ ba):** Vì phần lớn mã chạy thực tế đến từ các gói cài đặt qua `npm`, `PyPI`, `Go Modules`, `SCA` (`npm audit`, `pip-audit`, `Trivy fs`) đối chiếu tệp lockfile với cơ sở dữ liệu lỗ hổng công khai (**CVE — Common Vulnerabilities and Exposures**).
- **`Container Image Scan` (Quét ảnh Container — ví dụ `Trivy image`):** Kiểm tra các gói hệ điều hành Linux (`Alpine`, `Debian` như `openssl`, `libcrypto`, `curl`) được đóng gói bên trong Docker Image.
- **`SBOM` (*Software Bill of Materials* — Danh mục thành phần phần mềm):** Xuất tệp JSON chuẩn hóa (`CycloneDX` / `SPDX`) liệt kê toàn bộ thư viện, gói hệ điều hành và phiên bản có trong bản phát hành.

*(Mô hình phòng thủ đa tầng này thường được ví như mô hình **"Lát Phô mai Thụy Sĩ"** (*Swiss Cheese Model*): mỗi công cụ có thể có điểm mù riêng, nhưng khi xếp chồng nhiều lớp độc lập, lỗ hổng lọt qua lớp này sẽ bị lớp tiếp theo chặn lại. Tương tự, `SBOM` đóng vai trò như bảng liệt kê thành phần trên nhãn sản phẩm, giúp đội Bảo mật tra cứu ngay dịch vụ nào bị ảnh hưởng khi một lỗ hổng Zero-day mới như *Log4Shell* hay *xz-utils* được công bố mà không cần quét lại toàn bộ image).*

```visual
kind: layers
title: "Bản Đồ 5 Lớp DevSecOps Trong Dự Án Node.js [!badge:emerald:Defense in Depth]"
subtitle: Phân biệt rạch ròi đối tượng kiểm tra của từng công cụ để không trùng lặp và không bỏ sót lỗ hổng
columns:
  - title: Các Lớp Kiểm Định Trước Đóng Gói (Source & Dependencies)
    badge: Lớp 1 → Lớp 3 · Chạy trong vài chục giây
    tone: sky
    layers:
      - label: "Lớp 1 — Secret Scanning (Gitleaks / TruffleHog)"
        sub: "Kiểm tra toàn bộ lịch sử các commit Git (yêu cầu fetch-depth: 0)"
        note: Bắt lộ DB URL, JWT, Stripe Key
        tone: amber
      - label: "Lớp 2 — SAST: Phân tích Mã tĩnh (Semgrep / CodeQL)"
        sub: "Phân tích cây cú pháp AST mã nguồn tự viết (src/**/*.ts)"
        note: Bắt SQLi, eval(), Regex DoS, thiếu Auth
        tone: sky
      - label: "Lớp 3 — SCA: Kiểm toán Thư viện mở (npm audit / Trivy fs)"
        sub: "Đối chiếu cây phụ thuộc bên thứ ba trong package-lock.json với kho CVE"
        note: Bắt gói npm dính CVE high/critical
        tone: cyan
    footer: Phản hồi ngay trên từng dòng code của Pull Request trước khi tốn CPU đóng gói Image
  - title: Các Lớp Kiểm Định Thành Phẩm & Vận Hành (Artifact & Runtime)
    badge: Lớp 4 → Lớp 5 (+ DAST) · Chốt chặn trước Production
    tone: emerald
    layers:
      - label: "Lớp 4 — Container Image CVE Gate (Trivy image / Grype)"
        sub: "Kiểm tra các gói hệ điều hành Alpine/Debian (openssl, libcrypto, curl) trong Image"
        note: Chặn lỗ hổng tầng OS C/C++
        tone: rose
      - label: "Lớp 5 — Danh mục thành phần SBOM (CycloneDX / SPDX)"
        sub: "Xuất danh mục kiểm kê toàn bộ thành phần có mặt trong bản build (sbom.cdx.json)"
        note: Tra cứu Zero-day mới trong 2 giây
        tone: emerald
      - label: "Mở rộng — DAST / Smoke Security trên Staging (OWASP ZAP)"
        sub: "Giả lập truy vấn HTTP thực tế vào dịch vụ đang chạy để rà thiếu Security Headers / CORS"
        note: Kiểm chứng hành vi thực thi động
        tone: cyan
    footer: Đảm bảo chỉ những Container Image sạch và có hồ sơ xuất xứ rõ ràng mới được lên Registry
```

---

## 2. Cấu hình chi tiết từng lớp và giảm thiểu cảnh báo nhiễu (Alert Fatigue)

Sai lầm khiến nhiều đội ngũ bỏ qua công cụ bảo mật là **để ngưỡng báo động quá nhiễu**: ví dụ báo lỗi cả các gói `devDependencies` chỉ chạy ở máy phát triển (`eslint`, `vitest`), hoặc chặn pipeline vì một lỗ hổng mức `LOW` trong nhân Debian khi nhà phát hành chưa tung bản vá.

Hãy áp dụng bộ tham số tinh chỉnh chuẩn công nghiệp sau:

### 1) Lớp 1 — Quét lịch sử Git với `Gitleaks` (Bắt buộc mở `fetch-depth: 0`)
Mặc định `actions/checkout@v4` chỉ tải nông đúng **1 commit cuối cùng** (`fetch-depth: 1`). Nếu lập trình viên lỡ commit lộ khoá ở commit #1 trong PR, rồi ở commit #2 họ xoá dòng đó đi, quét nông sẽ **bỏ sót khóa bí mật vẫn nằm trong lịch sử commit #1**.
- [x] Bắt buộc đặt ==`fetch-depth: 0`== để tải trọn vẹn lịch sử commit.
- [x] Luôn truyền cờ **`--redact`** để Gitleaks che dấu `***` thay vì in chuỗi bí mật vừa phát hiện ra màn hình log CI.

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
- name: Quét rò rỉ khoá bí mật xuyên suốt lịch sử commit
  run: gitleaks detect --source . --no-banner --redact
```

### 2) Lớp 2 & 3 — Phân tích mã nguồn tự viết (`Semgrep`) và thư viện bên thứ ba (`npm audit --omit=dev`)
- **`SAST` (`Semgrep`):** Quét lỗi bảo mật trong mã nguồn của chính đội ngũ phát triển.
- **`SCA` (`npm audit`):** Dùng cờ chuẩn hiện đại ==`--omit=dev`== (thay cho `--production` cũ) để **chỉ kiểm toán các thư viện thực sự chạy trên Production (`dependencies`)**, bỏ qua công cụ phát triển:

```yaml
- name: Kiểm toán lỗ hổng thư viện Production (SCA)
  run: npm audit --omit=dev --audit-level=high

- name: Phân tích mã nguồn tĩnh SAST
  run: semgrep ci
```

### 3) Lớp 4 & 5 — Cấu hình cổng kiểm định `Trivy` và xuất `CycloneDX SBOM`
> [!WARNING] Lưu ý quan trọng với Trivy: Mặc định `--exit-code` bằng `0`
> Nếu bạn chỉ chạy `trivy image ghcr.io/acme/shop-api:1.0` mà **quên truyền `--exit-code 1`**, dù phát hiện **12 lỗ hổng `CRITICAL`** thì Trivy vẫn chỉ in bảng cảnh báo rồi trả mã thoát `0` — khiến pipeline báo đạt và tiếp tục đẩy ảnh lỗi lên Production.

Luôn kết hợp đồng thời **3 tham số quan trọng** trên cổng kiểm định Trivy:
1. ==`--exit-code 1`==: Ép trả mã thoát lỗi (`1`) để chặn pipeline khi phát hiện vi phạm.
2. **`--severity CRITICAL`**: Tập trung chặn pipeline với các lỗ hổng mức độ nghiêm trọng cao.
3. ==`--ignore-unfixed`==: Chỉ chặn những CVE **đã có bản vá chính thức** từ nhà phát hành hệ điều hành/thư viện — đảm bảo mỗi khi pipeline báo lỗi, lập trình viên luôn có phương án nâng cấp rõ ràng thay vì phải bật `continue-on-error: true`.

```yaml
- name: Cổng chặn lỗ hổng Container mức CRITICAL đã có bản vá
  run: trivy image --exit-code 1 --severity CRITICAL --ignore-unfixed ghcr.io/acme/shop-api:${{ github.sha }}

- name: Xuất hồ sơ nguyên liệu CycloneDX SBOM
  run: trivy image --format cyclonedx --output sbom.cdx.json ghcr.io/acme/shop-api:${{ github.sha }}
```

---

## 3. Rủi ro của `Docker-in-Docker (privileged)` và giải pháp đóng gói Rootless với **Kaniko**

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

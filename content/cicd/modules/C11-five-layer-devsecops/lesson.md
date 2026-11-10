# Phòng tuyến DevSecOps 5 Lớp: Quét Secret, SAST, SCA, Cổng chặn CVE Container, SBOM & Đóng gói Không Đặc quyền

Trong mô hình phát triển phần mềm cũ cách đây một thập kỷ, đội Bảo mật chỉ nhảy vào kiểm tra vào... tuần cuối cùng trước ngày ra mắt sản phẩm. Khi họ phát hiện ra 15 lỗ hổng nghiêm trọng và 1 khoá API nằm phơi trong mã nguồn, ngày phát hành bị hoãn lại cả tháng trong sự căng thẳng tột độ giữa Dev và Security!

Triết lý **DevSecOps ("Shift-Left Security" — Dịch chuyển bảo mật sang bên trái)** thay đổi hoàn toàn cuộc chơi: đưa các chốt kiểm tra bảo mật tự động chạy ngay trong **3–5 phút đầu của mỗi Pull Request**, biến việc phát hiện lỗ hổng nhẹ nhàng như cách `ESLint` hay `TypeScript` báo gạch chân đỏ ngay lúc bạn vừa gõ code xong!

Bài học này giúp bạn xây dựng trọn vẹn **Phễu lọc DevSecOps 5 Lớp chuẩn công nghiệp** kèm giải pháp đóng gói ảnh Container không cần quyền `root` (**Rootless Build**).

---

## 1. Kiến trúc Phễu lọc Bảo mật 5 Lớp Tự động trên CI

Tại sao không dùng 1 công cụ duy nhất mà phải phối hợp 5 lớp? Bởi mỗi công cụ soi vào một bề mặt tấn công hoàn toàn khác nhau của ứng dụng Node.js:

| Lớp phòng thủ | Công cụ tiêu biểu | Đối tượng soi chiếu | Liên hệ thực tế dự án Node.js |
| --- | --- | --- | --- |
| **Lớp 1: Quét lộ Bí mật (Secret Scanning)** | **`Gitleaks`** / `TruffleHog` | Toàn bộ lịch sử các commit Git (`fetch-depth: 0`). | Bắt sống lập trình viên lỡ commit chuỗi kết nối PostgreSQL, JWT Secret hay khoá Stripe vào lịch sử nhánh trước khi kịp gộp vào `main`. |
| **Lớp 2: Phân tích Mã tĩnh (`SAST`)** | **`Semgrep`** / `CodeQL` | Cây cú pháp mã nguồn do chính đội bạn viết (`src/**/*.ts`). | Phát hiện cộng chuỗi SQL Injection, `eval()`, Regex DoS, thiếu kiểm tra quyền ở tầng Controller. |
| **Lớp 3: Kiểm toán Thư viện (`SCA`)** | **`npm audit`** / `Trivy fs` | Cây thư viện bên thứ ba trong `package-lock.json`. | Chặn các gói phụ thuộc trên npm đang dính mã CVE mức `high` / `critical` (chỉ kiểm tra gói chạy thật với `--omit=dev`). |
| **Lớp 4: Cổng chặn Ảnh Container (`Image CVE Gate`)** | **`Trivy image`** / `Grype` | Các gói hệ điều hành Alpine/Debian (`openssl`, `libcrypto`, `curl`) bên trong Docker Image. | Dù code JS sạch nhưng thư viện C/C++ nền của OS dính lỗ hổng tràn bộ nhớ đã có bản vá (`--ignore-unfixed`) thì chặn không cho đẩy lên Registry! |
| **Lớp 5: Hồ sơ Nguyên liệu (`SBOM`)** | **CycloneDX** / `SPDX` | Xuất danh sách kiểm kê toàn bộ thành phần có mặt trong bản phát hành (`sbom.cdx.json`). | Giống "Bảng thành phần dinh dưỡng" trên hộp sữa: khi tuần sau nổ ra lỗ hổng Zero-day mới (như Log4Shell hay xz-utils), bạn tra cứu trong 2 giây biết ngay dịch vụ nào đang chứa thư viện đó mà không cần quét lại! |

---

## 2. Cấu hình thực tế từng Lớp trên Đường ống (Tránh bẫy Cảnh báo ồn ào!)

Một sai lầm khiến nhiều đội ngũ chán ghét công cụ bảo mật rồi tắt bỏ là **để ngưỡng báo động quá nhiễu (Alert Fatigue)**: ví dụ bắt lỗi cả các gói `devDependencies` chỉ chạy lúc test (`eslint`, `jest`), hoặc chặn đường ống vì một lỗ hổng mức `LOW` trong nhân Debian mà chính nhà phát hành Debian còn chưa tung bản vá!

Hãy áp dụng bộ tham số tinh chỉnh thực dụng sau:

### 1) Quét lịch sử Git với `Gitleaks` (Nhớ mở `fetch-depth: 0`!):
Mặc định `actions/checkout@v4` chỉ tải đúng **1 commit nông mới nhất** (`fetch-depth: 1`). Nếu lập trình viên lỡ commit lộ khoá ở commit #1 trong PR, rồi ở commit #2 họ xoá dòng đó đi, quét nông sẽ bỏ lọt hoàn toàn khoá vẫn nằm nguyên trong lịch sử commit #1! Vì vậy khi chạy `gitleaks`, bắt buộc đặt **`fetch-depth: 0`** và bật cờ **`--redact`** để không in ngược chuỗi bí mật ra màn hình log CI:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
- name: Quét rò rỉ khoá bí mật trong lịch sử commit
  run: gitleaks detect --source . --no-banner --redact
```

### 2) Kiểm toán thư viện chạy thực tế với `npm audit --omit=dev` & `Semgrep`:
```yaml
- name: Kiểm toán lỗ hổng thư viện Production (SCA)
  run: npm audit --omit=dev --audit-level=high

- name: Phân tích mã nguồn tĩnh SAST
  run: semgrep ci
```

### 3) Cổng chặn Container `Trivy` thực dụng & Xuất bản `CycloneDX SBOM`:
Sử dụng đồng thời 3 cờ vàng: **`--exit-code 1`** (bắt buộc trả mã thoát đỏ để chặn đường ống, vì mặc định `trivy` trả mã `0` chỉ để xem!), **`--severity CRITICAL`** và **`--ignore-unfixed`** (chỉ chặn khi đã có bản nâng cấp vá lỗi để lập trình viên có hướng xử lý ngay!):

```yaml
- name: Cổng chặn lỗ hổng Container mức CRITICAL
  run: trivy image --exit-code 1 --severity CRITICAL --ignore-unfixed ghcr.io/acme/shop-api:${{ github.sha }}

- name: Xuất hồ sơ thành phần CycloneDX SBOM
  run: trivy image --format cyclonedx --output sbom.cdx.json ghcr.io/acme/shop-api:${{ github.sha }}
```

---

## 3. Hiểm hoạ `Docker-in-Docker (privileged)` & Lời giải Đóng gói Rootless với **Kaniko**

Trên GitLab CI hoặc các cụm Kubernetes Runner nội bộ, để chạy lệnh `docker build` bên trong một container CI, cách làm cũ thường dùng dịch vụ **`docker:dind` (Docker-in-Docker)** bật cờ **`privileged: true`** (hoặc gắn thẳng ổ cắm `/var/run/docker.sock` của máy chủ vật lý vào Runner).

Như bạn đã học ở khoá Kubernetes (`K16`), cấp `privileged: true` hay gắn `docker.sock` cho một container chạy mã nguồn từ Pull Request **chẳng khác nào trao thẳng quyền `root` tối cao của máy chủ Runner cho lập trình viên hoặc tin tặc**! Họ có thể xem lén toàn bộ container của các dự án khác đang chạy chung trên máy chủ đó!

Giải pháp chuẩn hiện đại cho môi trường Container/Kubernetes Runner là sử dụng trình đóng gói **Không Đặc quyền (Daemonless & Rootless)** như **Kaniko** (`gcr.io/kaniko-project/executor:debug`) hoặc **BuildKit Rootless**:
- Kaniko đọc `Dockerfile`, giải nén hệ thống tệp hoàn toàn trong không gian người dùng (Userspace), **không cần bất kỳ Docker Daemon nào chạy ngầm** và **không cần cờ `privileged: true`**!
- Đóng gói xong, `/kaniko/executor` đẩy thẳng ảnh lên Container Registry an toàn tuyệt đối.

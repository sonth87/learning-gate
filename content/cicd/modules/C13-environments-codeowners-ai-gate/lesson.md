# Environments, CODEOWNERS & Cổng rà soát AI (Governance Gate)

Ở Level 3, bạn đã dựng hàng rào bảo mật tự động (5-Layer DevSecOps & OIDC không khoá cứng). Nhưng trong doanh nghiệp thực tế, kỹ thuật thôi chưa đủ: **ai** được phép phê duyệt một bản release lên Production lúc 11 giờ trưa Thứ Sáu? **Ai** chịu trách nhiệm khi một Pull Request âm thầm sửa file `.github/workflows/deploy.yml` hoặc thêm câu lệnh SQL xoá cột? Và làm sao để tận dụng **AI PR Reviewer** (như CodeRabbit, GitHub Copilot Code Review) bắt lỗi logic sớm mà không biến mỗi PR thành một "bãi rác bình luận" hoặc mở toang lỗ hổng lộ Secret từ nhánh Fork?

Bài học này giải quyết trọn vẹn 3 trụ cột **Quản trị phát hành (Release Governance)**: **GitHub Environments**, **CODEOWNERS + Branch Protection**, và **Low-Noise AI Review Gate**.

---

## 1. GitHub Environments: Tách bạch Bí mật & Cổng duyệt tay (Approval Gate)

Nếu bạn đặt toàn bộ biến bí mật vào **Repository Secrets**, bất kỳ job nào chạy trên repo (kể cả job chạy nháp trên nhánh tính năng nếu cấu hình sơ hở) đều có thể đọc cùng một `DATABASE_URL` hoặc `AWS_ROLE_ARN`. Đó giống như việc để chung `.env.development` và `.env.production` trong cùng một thư mục mà không có quyền truy cập riêng!

**GitHub Environments** (`staging`, `production`) nâng cấp quản trị lên cấp độ môi trường với 3 năng lực cốt lõi:

| Tính năng Environment | Cơ chế hoạt động | Giá trị thực chiến |
| :--- | :--- | :--- |
| **Environment Secrets & Vars** | Biến `AWS_ROLE_ARN` của `production` chỉ được giải mã khi job khai báo `environment: production` và vượt qua mọi quy tắc bảo vệ. | Cô lập hoàn toàn hạ tầng Staging và Production. |
| **Protection Rules (Required Reviewers)** | Job `deploy-production` tự động chuyển sang trạng thái `Waiting` và gửi thông báo tới Tech Lead / SRE để bấm **Approve**. | Cổng duyệt tay (Manual Gate) có nhật ký kiểm toán (Audit Log) rõ ràng. |
| **Deployment Branches & Wait Timer** | Chỉ cho phép nhánh `main` hoặc tag `v*` kích hoạt môi trường `production` (chặn tuyệt đối nhánh `feat/*`). | Ngăn chặn tai nạn deploy nhầm nhánh thử nghiệm lên khách hàng thật. |

Khi khai báo kèm trường `url`, GitHub còn hiển thị trực tiếp đường dẫn môi trường ngay trên sơ đồ trực quan của Pipeline và trong lịch sử Deployments của repo:

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.shop.example.com
    steps:
      - run: ./scripts/deploy.sh staging

  smoke-staging:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:smoke -- --baseUrl=https://staging.shop.example.com

  deploy-production:
    needs: smoke-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://shop.example.com
    steps:
      - run: ./scripts/deploy.sh production
```

Lưu ý chuỗi `deploy-staging` $\rightarrow$ `smoke-staging` $\rightarrow$ `deploy-production`: ảnh container được kiểm chứng tự động bằng Smoke Test trên Staging xong xuôi rồi mới bước tới cổng xin chữ ký lên Production. Người duyệt không cần đoán mò "bản build này chạy có nổ không?".

---

## 2. `.github/CODEOWNERS` & Branch Protection: Phân quyền theo vùng mã nguồn

Trong một dự án Node.js/TypeScript có 20 lập trình viên, nếu Branch Protection chỉ bật *"Require 1 approval"*, hai lập trình viên Frontend có thể duyệt chéo cho nhau một PR... sửa cấu hình Terraform, đổi quyền IAM hoặc sửa chính file `.github/workflows/release.yml`!

Tệp `.github/CODEOWNERS` hoạt động tương tự cú pháp `.gitignore`, ánh xạ từng đường dẫn nhạy cảm tới đúng nhóm chuyên trách (GitHub Teams). Khi kết hợp với tuỳ chọn **"Require review from Code Owners"** trong Branch Protection Ruleset:

```text
# Mặc định mã nguồn ứng dụng do nhóm Backend cốt lõi phụ trách
*                           @acme/backend-maintainers

# Mọi thay đổi lên đường ống CI/CD và Dockerfile bắt buộc nhóm DevOps & Security ký duyệt
/.github/workflows/         @acme/platform-devops @acme/security-team
/Dockerfile                 @acme/platform-devops

# Mọi kịch bản thay đổi lược đồ SQL bắt buộc nhóm DBA kiểm tra
/db/migrations/             @acme/dba-team
/src/auth/                  @acme/security-team
```

Quy tắc vàng trong `CODEOWNERS`: **thứ tự từ trên xuống dưới, dòng khớp cuối cùng sẽ thắng (last match wins)** — giống hệt cách CSS cascade hoặc `.gitignore` ghi đè quy tắc tổng quát ở đầu file bằng quy tắc cụ thể ở cuối file. Đồng thời, hãy bổ sung một job Governance nhẹ trong CI để kiểm tra file `.github/CODEOWNERS` luôn tồn tại (không bị ai đó xoá nhầm) và tiêu đề PR tuân thủ chuẩn Conventional Commits (`feat:`, `fix:`, `chore:`) một cách an toàn qua biến môi trường `env:`.

---

## 3. Cổng rà soát AI (AI PR Gate): Giảm nhiễu & Chống lộ Secret từ Fork

Các công cụ rà soát mã nguồn bằng AI (như **CodeRabbit** với `.coderabbit.yaml` hoặc workflow AI tuỳ chỉnh) giúp phát hiện rò rỉ bộ nhớ, thiếu `await` trong Promise, hoặc lỗi bảo mật SQL Injection chỉ trong 45 giây đầu tiên sau khi mở PR — giải phóng Senior Engineer khỏi việc soi từng lỗi lặt vặt để tập trung vào kiến trúc tổng thể.

Tuy nhiên, triển khai AI Gate thực tế thường vấp phải **2 cái bẫy lớn**:

### Bẫy 1: Nhiễu bình luận (Review Noise) trên file sinh tự động
Khi bạn chạy `npm install` cập nhật `package-lock.json` dài 12.000 dòng, hoặc commit snapshot test `*.snap` và thư mục biên dịch `dist/`, AI không được cấu hình bộ lọc sẽ tốn hàng chục nghìn token để... bình luận vào từng dòng hash trong lockfile! Giải pháp chuẩn trong `.coderabbit.yaml` là kết hợp:
- `reviews.path_filters`: Loại trừ triệt để `!**/*.lock`, `!**/package-lock.json`, `!**/dist/**`, `!**/*.snap`.
- `reviews.path_instructions`: Giao "đề bài chuyên sâu" theo từng thư mục nhạy cảm (ví dụ với `src/auth/**`, yêu cầu AI soi kỹ xác thực JWT, timing attack, phân quyền RBAC và tuyệt đối không in token ra log).

### Bẫy 2: Lộ API Key của LLM hoặc bị Prompt Injection từ Fork PR
Nếu bạn tự dựng GitHub Actions gọi OpenAI/Anthropic API để bình luận vào PR:
1. **Tuyệt đối không dùng `pull_request_target` kèm checkout code từ PR** — kẻ tấn công từ nhánh Fork bên ngoài có thể sửa script để đánh cắp `OPENAI_API_KEY` lẫn `GITHUB_TOKEN` quyền ghi!
2. Sử dụng sự kiện `on: pull_request`, cấp quyền tối thiểu `permissions: { contents: read, pull-requests: write }`, và thêm điều kiện chặn PR từ kho Fork bên ngoài (`if: github.event.pull_request.head.repo.full_name == github.repository`) trước bước sử dụng Secret nội bộ.

Nắm vững ba mảnh ghép **Environments + CODEOWNERS + AI Gate**, đường ống của bạn vừa tự động hoá tối đa tốc độ phản hồi trên từng PR, vừa giữ vững kỷ luật kiểm soát rủi ro chuẩn ngân hàng và thương mại điện tử lớn!

# Environments, CODEOWNERS & Cổng rà soát AI (Governance Gate)

Ở chặng trước, bạn đã dựng hàng rào bảo mật tự động (5-Layer DevSecOps & Keyless OIDC). Nhưng trong doanh nghiệp thực tế, công cụ quét tự động thôi chưa đủ:
- [>] **Ai** được phép phê duyệt một bản release lên Production lúc 11 giờ trưa Thứ Sáu?
- [>] **Ai** chịu trách nhiệm ký duyệt khi một Pull Request âm thầm sửa `.github/workflows/deploy.yml` hoặc thêm câu lệnh SQL thay đổi lược đồ cơ sở dữ liệu?
- [>] Làm sao tận dụng **AI PR Reviewer** (như CodeRabbit, GitHub Copilot Code Review) bắt lỗi logic sớm mà không biến mỗi PR thành "bãi rác bình luận" hoặc mở toang lỗ hổng lộ `OPENAI_API_KEY` từ nhánh Fork?

Bài học này giải quyết trọn vẹn 3 trụ cột **Quản trị phát hành (Release Governance)**: {emerald:GitHub Environments}, {sky:CODEOWNERS + Branch Protection}, và {violet:Low-Noise AI Review Gate} — đảm bảo ==kiểm soát rủi ro chặt chẽ== mà không làm chậm nhịp phát hành.

```visual
kind: groups
title: "3 Trụ Cột Quản Trị Phát Hành Doanh Nghiệp (Release Governance) [!badge:emerald:Enterprise Controls]"
subtitle: Kết hợp phân quyền con người, cô lập bí mật theo môi trường và trợ lý rà soát AI an toàn
columns: 3
items:
  - num: 1
    icon: shield-check
    title: GitHub Environments
    badge: Cô lập Môi trường
    tone: emerald
    bullets:
      - "Khoá riêng **Environment Secrets** (`AWS_ROLE_ARN` của `production` tách biệt hẳn `staging`)"
      - "Bật **Required Reviewers** làm cổng duyệt tay có nhật ký kiểm toán (*Audit Log*)"
      - "Giới hạn **Deployment Branches** chỉ nhận `main` hoặc tag `v*`"
    footer: Ngăn nhánh tính năng chạm vào hạ tầng khách hàng thật
  - num: 2
    icon: users
    title: CODEOWNERS & Rulesets
    badge: Chủ sở hữu Vùng code
    tone: sky
    bullets:
      - "Ánh xạ đường dẫn nhạy cảm (`/.github/workflows/`, `/db/migrations/`) tới đúng nhóm chuyên trách"
      - "Quy tắc khớp: **đọc từ trên xuống dưới, dòng khớp cuối cùng thắng (*last match wins*)**"
      - "Bắt buộc bật kèm **Branch Protection / Ruleset** mới chặn được nút Merge!"
    footer: Chấm dứt cảnh 2 dev Frontend tự duyệt PR sửa Terraform/CI
  - num: 3
    icon: sparkles
    title: Low-Noise AI PR Gate
    badge: Rà soát AI Thông minh
    tone: violet
    bullets:
      - "`reviews.path_filters` loại bỏ tệp sinh tự động (`!**/package-lock.json`, `!**/dist/**`)"
      - "`reviews.path_instructions` giao đề bài chuyên sâu cho từng thư mục (`src/auth/**`)"
      - "Dùng `on: pull_request` + chặn nhánh Fork để bảo vệ tuyệt đối `OPENAI_API_KEY`"
    footer: Phản hồi lỗi logic trong 45 giây mà không gây nhiễu
```

---

## 1. GitHub Environments: Tách bạch Bí mật & Cổng duyệt tay (Approval Gate)

Nếu bạn gom toàn bộ biến nhạy cảm vào **Repository Secrets**, bất kỳ job nào trong repo (kể cả job chạy nháp trên nhánh tính năng nếu cấu hình sơ hở) đều có thể đọc cùng một `DATABASE_URL` hoặc `AWS_ROLE_ARN` — chẳng khác nào để chung `.env.development` và `.env.production` không hề có vách ngăn!

**GitHub Environments** (`staging`, `production`) khoá chặt biến bí mật sau hàng rào **Protection Rules**:
- [x] **Environment Secrets & Variables:** Biến `AWS_ROLE_ARN` đặt trong Environment `production` **chỉ được giải mã cấp cho runner khi job khai báo đúng `environment: production` VÀ vượt qua đầy đủ các quy tắc bảo vệ** (nhánh hợp lệ + người duyệt bấm **Approve**).
- [x] **Hiển thị liên kết trực quan với `environment.url`:** Khai báo khoá ==`url`== bên trong đối tượng `environment` giúp gắn nút bấm mở thẳng trang web vừa triển khai ngay trên sơ đồ Pipeline và mục Deployments của GitHub.

```visual
kind: flow
title: Chuỗi Thăng Hạng Bản Dựng Qua Cổng Kiểm Chứng & Phê Duyệt (Promotion Pipeline)
subtitle: Ảnh container được kiểm tra thực tế trên Staging xong xuôi rồi mới xin chữ ký phê duyệt lên Production
steps:
  - icon: upload
    badge: "Env: staging"
    title: deploy-staging
    desc: Triển khai tự động lên môi trường thử nghiệm kèm liên kết environment.url
    code: "url: https://staging..."
    tone: sky
    edge: kiểm tra sống
  - icon: activity
    badge: Tự động kiểm chứng
    title: smoke-staging
    desc: Chạy bài kiểm thử đầu-cuối xác nhận Staging phản hồi ổn định trước khi xin duyệt
    code: "npm run test:smoke"
    tone: cyan
    edge: Waiting Approval
  - icon: lock
    badge: Protection Gate
    title: Required Reviewers
    desc: Kiểm tra nhánh main + tạm dừng chờ Tech Lead / SRE bấm Approve (lưu Audit Log)
    code: "branch == main + Approve"
    tone: amber
    edge: giải mã Prod Secret
  - icon: rocket
    badge: "Env: production"
    title: deploy-production
    desc: Mở khoá AWS_ROLE_ARN của riêng Production và phát hành bản chính thức
    code: "url: https://shop..."
    tone: emerald
```

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

---

## 2. `.github/CODEOWNERS` & Branch Protection: Phân quyền theo vùng mã nguồn

Trong một dự án có 20 lập trình viên, nếu Branch Protection chỉ bật *"Require 1 approval"*, hai lập trình viên Frontend có thể duyệt chéo cho nhau một PR... sửa quyền IAM hoặc sửa chính tệp `.github/workflows/release.yml`!

Tệp **`.github/CODEOWNERS`** ánh xạ từng đường dẫn nhạy cảm tới đúng nhóm chuyên trách (GitHub Teams):

```ini
# 1) Quy tắc tổng quát đầu file: Mặc định do nhóm Backend cốt lõi phụ trách
*                           @acme/backend-maintainers

# 2) Các quy tắc cụ thể ở dưới sẽ GHI ĐÈ quy tắc tổng quát ở trên (Last Match Wins!)
/.github/workflows/         @acme/platform-devops @acme/security-team
/Dockerfile                 @acme/platform-devops
/db/migrations/             @acme/dba-team
/src/auth/                  @acme/security-team
```

> [!WARNING] Hai quy tắc sống còn về `CODEOWNERS` rất hay bị hỏi trong phỏng vấn!
> 1. **Thứ tự ưu tiên — ==Dòng khớp cuối cùng sẽ thắng (*Last match wins*)==:** Giống hệt `.gitignore`, `CODEOWNERS` đọc từ trên xuống dưới; tệp nằm trong `/src/auth/jwt.ts` khớp cả dòng `*` lẫn dòng `/src/auth/` nên chủ sở hữu quyết định cuối cùng là `@acme/security-team`.
> 2. **Chỉ tạo tệp `.github/CODEOWNERS` thôi thì CHƯA chặn được Merge!** Nếu chưa bật **Branch Protection** hoặc **Repository Ruleset** kèm tuỳ chọn **`"Require review from Code Owners"`**, tệp `CODEOWNERS` chỉ tự động gắn người review gợi ý chứ không khoá nút Merge!

Đồng thời, hãy luôn duy trì một job Governance nhẹ kiểm tra tệp `.github/CODEOWNERS` tồn tại và tiêu đề PR tuân thủ **Conventional Commits** (`feat:`, `fix:`, `chore:`) một cách an toàn qua biến môi trường ==`env:`== (tuyệt đối không nối thẳng `${{ github.event.pull_request.title }}` vào `run:` để tránh lỗi Script Injection!):

```yaml
- name: Kiểm tra tiêu đề PR chuẩn Conventional Commits an toàn
  env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: |
    test -f .github/CODEOWNERS
    printf '%s\n' "$PR_TITLE" | grep -Eq '^(feat|fix|chore|docs|refactor|test)(\(.+\))?: .+'
```

---

## 3. Cổng rà soát AI (AI PR Gate): Giảm nhiễu & Chống lộ Secret từ Fork

Các công cụ rà soát mã nguồn bằng AI (như **CodeRabbit** với `.coderabbit.yaml` hoặc workflow gọi LLM nội bộ) giúp bắt lỗi thiếu `await`, rò rỉ bộ nhớ hoặc SQL Injection trong 45 giây đầu tiên. Tuy nhiên, triển khai thực tế bắt buộc phải tránh **2 cái bẫy lớn**:

```visual
kind: compare
title: "Triển Khai AI PR Reviewer: Cấu Hình Ngây Thơ Dễ Lộ Khoá vs Chuẩn Doanh Nghiệp Ít Nhiễu"
subtitle: "Vừa lọc bỏ tệp sinh tự động (lockfile, dist) vừa khoá chặt OPENAI_API_KEY trước các Pull Request từ nhánh Fork"
left:
  badge: "SAI LẦM NGUY HIỂM · Nhiễu & Lộ Secret"
  title: "Dùng pull_request_target + Không lọc lockfile"
  tone: rose
  code: |
    # BẪY PWN REQUEST LỘ OPENAI_API_KEY:
    on: pull_request_target
    jobs:
      ai-review:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
            with:
              ref: ${{ github.event.pull_request.head.sha }}
          - env:
              OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
            run: node scripts/run-ai-review.js
  lang: yaml
  bullets:
    - "Dùng `pull_request_target` kèm checkout code từ Fork cho phép kẻ tấn công sửa `scripts/run-ai-review.js` hoặc `package.json` để **đánh cắp `OPENAI_API_KEY` và `GITHUB_TOKEN` quyền ghi**!"
    - "Không cấu hình bộ lọc đường dẫn khiến AI đốt hàng chục nghìn token bình luận vô nghĩa vào 12.000 dòng `package-lock.json` và `*.snap`"
right:
  badge: "CHUẨN AN TOÀN · .coderabbit.yaml & Fork Guard"
  title: "Tách lọc đường dẫn + Bảo vệ Secret nội bộ"
  tone: emerald
  code: |
    # 1) .coderabbit.yaml — Lọc nhiễu & Giao đề bài chuyên sâu:
    reviews:
      path_filters:
        - "!**/*.lock"
        - "!**/package-lock.json"
        - "!**/dist/**"
        - "!**/*.snap"
      path_instructions:
        - path: "src/auth/**"
          instructions: "Soi kỹ xác thực JWT, RBAC, timing attack và cấm log token."

    # 2) Workflow tự dựng: Dùng on: pull_request + Chặn Fork PR:
    # if: github.event.pull_request.head.repo.full_name == github.repository
  lang: yaml
  bullets:
    - "**`reviews.path_filters`** loại trừ tệp máy sinh; ==`reviews.path_instructions`== truyền chỉ thị kiểm tra chuyên biệt cho từng vùng code nhạy cảm như `src/auth/**`"
    - "Workflow AI tự dựng luôn dùng `on: pull_request`, quyền tối thiểu `{ contents: read, pull-requests: write }` và kiểm tra `head.repo.full_name == github.repository` trước khi nạp khóa LLM"
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Environment Secret (`production`)** chỉ được giải mã khi job vượt qua đủ Protection Rules · **`environment.url`** hiển thị nút mở trang web ngay trên sơ đồ Pipeline.
> - **`.github/CODEOWNERS`** áp dụng quy tắc **dòng khớp cuối cùng thắng (*last match wins*)** và bắt buộc bật kèm **Branch Protection / Ruleset** mới chặn được thao tác Merge.
> - Trong **`.coderabbit.yaml`**: dùng **`reviews.path_filters`** để bỏ qua lockfile/dist, và dùng **`reviews.path_instructions`** để giao prompt rà soát riêng cho từng thư mục.
> - Tuyệt đối **không dùng `pull_request_target` + checkout PR code** cho workflow nắm giữ `OPENAI_API_KEY`!

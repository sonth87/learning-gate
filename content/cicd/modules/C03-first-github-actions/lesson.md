# Xây dựng GitHub Actions Workflow chuẩn 2026 (.github/workflows/ci.yml)

Sau khi nắm vững Exit Code, Ephemeral Runner và nguyên tắc đồng bộ môi trường, bạn có thể xây dựng hoàn chỉnh một tệp **GitHub Actions Workflow chuẩn công nghiệp** từ đầu. Lưu ý tránh sao chép các hướng dẫn cũ từ giai đoạn 2020–2022 sử dụng Action đời cũ (`v1`–`v3`) hoặc `node-version: 16`, vì các runtime cũ trên Hosted Runner đã ngừng hỗ trợ (EOL) và sẽ gây lỗi khi chạy.

```visual
kind: illustration
diagram: "cicd:c03"
alt: "Cấu trúc tệp YAML GitHub Actions chuẩn v4 gồm bộ lọc sự kiện on, permissions tối thiểu, checkout@v4, setup-node@v4 và npm ci"
title: "Cấu trúc tệp Workflow GitHub Actions chuẩn công nghiệp năm 2026"
subtitle: "Ba phần cấu hình chính giúp tệp .github/workflows/ci.yml kiểm định tự động nhanh và an toàn cho Node.js 22"
caption: "Sơ đồ cấu trúc từ bộ lọc sự kiện & quyền hạn đầu tệp, khởi tạo máy ảo với Action thế hệ v4 tới chuỗi lệnh kiểm định npm ci"
callouts:
  - num: 1
    label: "Bộ lọc sự kiện on: & Quyền tối thiểu permissions:"
    desc: "Chỉ định rõ nhánh main cho push/pull_request kèm workflow_dispatch thủ công và giới hạn quyền mặc định ở mức contents: read."
    tone: amber
  - num: 2
    label: "Runner sạch kết hợp cặp Action chuẩn @v4"
    desc: "Dùng checkout@v4 tải nông (fetch-depth: 1) nhanh và setup-node@v4 ghim Node 22 kèm bộ đệm tự động cache: npm."
    tone: sky
  - num: 3
    label: "Chuỗi kiểm định tất định từ npm ci đến Build"
    desc: "Giải nén thư viện khớp tuyệt đối với lockfile rồi chạy tuần tự lint, test, build để báo cáo trạng thái lên PR."
    tone: emerald
```

## 1. Cấu trúc tệp `.github/workflows/ci.yml` và quy tắc cú pháp YAML

GitHub chỉ tự động nhận diện các tệp mang phần mở rộng `.yml` hoặc `.yaml` đặt trong đúng đường dẫn thư mục ==`.github/workflows/`==. Nếu đặt sai tên thư mục (ví dụ thiếu chữ `s` thành `.github/workflow/ci.yml`) hoặc thụt lề bằng ký tự **Tab cứng (`\t`)**, tệp cấu hình sẽ bị bỏ qua hoặc báo lỗi cú pháp ngay lập tức (luôn dùng **2 dấu cách — 2 spaces** cho mỗi cấp thụt lề).

```visual
kind: anatomy
title: "Các từ khóa cốt lõi trong Workflow GitHub Actions [!badge:cyan:GitHub Actions v4]"
subtitle: "Đọc từ trên xuống dưới theo cấu trúc chuẩn của tệp .github/workflows/ci.yml"
items:
  - keyword: "on.push / pull_request"
    role: "Bộ lọc sự kiện & nhánh"
    tone: amber
    summary: "Xác định thời điểm kích hoạt tự động và lọc theo nhánh đích để chống chạy trùng lặp."
    bullets:
      - "Luôn lọc rõ `branches: [main]` cho cả `push` lẫn `pull_request`"
    example: "on: { push: { branches: [main] }, pull_request: { branches: [main] } }"
    lang: yaml
  - keyword: "workflow_dispatch"
    role: "Nút bấm chạy thủ công"
    tone: cyan
    summary: "Hiển thị nút 'Run workflow' kèm menu chọn tham số ngay trên giao diện Web của GitHub."
    bullets:
      - "Định nghĩa tham số đầu vào qua `inputs:` (ví dụ `type: choice`, `default: \"staging\"`)"
      - "Đọc lại giá trị người dùng chọn bằng biểu thức `${{ inputs.target_env }}`"
    example: "echo \"Target=${{ inputs.target_env }}\""
    lang: yaml
  - keyword: "runs-on"
    role: "Chọn hệ điều hành máy ảo"
    tone: sky
    summary: "Yêu cầu GitHub cấp phát một máy ảo Ephemeral Runner sạch cho Job."
    bullets:
      - "`ubuntu-latest` là lựa chọn tiêu chuẩn nhanh và tiết kiệm chi phí nhất cho Node.js Backend"
    example: "runs-on: ubuntu-latest"
    lang: yaml
  - keyword: "actions/checkout@v4"
    role: "Tải mã nguồn nông (Shallow)"
    tone: cyan
    summary: "Kéo mã nguồn của commit hiện tại về thư mục làm việc của Runner."
    bullets:
      - "Mặc định chỉ tải 1 commit mới nhất (**`fetch-depth: 1`**) để khởi động xong trong 1–2 giây"
      - "Chỉ truyền `with: { fetch-depth: 0 }` khi dùng công cụ cần toàn bộ lịch sử Git (SonarQube, semantic-release, Turborepo)"
    example: "- uses: actions/checkout@v4"
    lang: yaml
  - keyword: "actions/setup-node@v4"
    role: "Cài Node 22 & Đệm ~/.npm"
    tone: emerald
    summary: "Cài đặt phiên bản Node.js LTS hiện đại và tự động quản lý bộ đệm gói thư viện."
    bullets:
      - "Ghim rõ `node-version: \"22\"` (tránh các bản 14/16/18 đã End-of-Life)"
      - "Bật `cache: \"npm\"` để tự băm SHA-256 của `package-lock.json` làm khoá đệm thư mục `~/.npm`"
    example: "with: { node-version: \"22\", cache: \"npm\" }"
    lang: yaml
```

## 2. Cấu hình lọc nhánh cho `push` và `pull_request` để tránh chạy trùng lặp Workflow

```visual
kind: compare
title: "Tránh kích hoạt trùng lặp Workflow khi thiếu bộ lọc nhánh"
subtitle: "Hiểu đúng cơ chế lọc nhánh đích (base branch) của pull_request giúp tiết kiệm 50% thời gian và chi phí CI"
left:
  badge: "CHƯA TỐI ƯU · Thiếu lọc nhánh"
  title: "Chạy trùng lặp 2 Workflow giống nhau cho mỗi commit"
  tone: rose
  code: |
    # Cấu hình thiếu bộ lọc thường gặp:
    on: [push, pull_request]
  lang: yaml
  bullets:
    - "Khi bạn đẩy commit lên nhánh `feat/login` đang mở PR vào `main`, GitHub phát **2 sự kiện cùng lúc**: 1 cho `push` trên `feat/login` và 1 cho `pull_request`."
    - "Hai máy ảo chạy song song cùng một bộ test giống hệt nhau, gây tốn gấp đôi thời gian chạy CI."
right:
  badge: "CHUẨN MỰC · Lọc nhánh main"
  title: "Mỗi PR chạy đúng 1 lượt, gộp xong kiểm định lại trên main"
  tone: emerald
  code: |
    on:
      push:
        branches: [main]
      pull_request:
        branches: [main]
  lang: yaml
  bullets:
    - "**`push.branches: [main]`**: Chỉ chạy khi code đã chính thức gộp vào nhánh `main`"
    - "**`pull_request.branches: [main]`**: Lọc theo ==nhánh đích (base branch)== là `main`!"
    - "Mọi PR mở từ bất kỳ nhánh `feat/payment-qr`, `fix/auth` nào xin gộp vào `main` **đều tự động kích hoạt trọn vẹn** đúng 1 lần!"
```

## 3. Tiêu chuẩn Actions thế hệ `@v4` và cơ chế `cache: "npm"` tích hợp sẵn

Các JavaScript Actions chạy trực tiếp trên runtime Node.js nhúng của Runner. Các thế hệ cũ `@v2` / `@v3` dựa trên runtime Node 12 và Node 16 vốn đã hết vòng đời hỗ trợ (EOL) trên GitHub-hosted Runners. Năm 2026, chuẩn bắt buộc là nâng cấp đồng bộ lên **`@v4`** kết hợp **Node `"22"` LTS**:

| Thành phần | Di sản lỗi thời (2020–2022) | Chuẩn 2026 bắt buộc | Lý do kỹ thuật cốt lõi |
| :--- | :--- | :--- | :--- |
| **Tải mã nguồn Git** | Thẻ `checkout` đời cũ (`v1`–`v3`) | **`actions/checkout@v4`** | Chạy trên runtime Node 20+ mới, mặc định shallow clone `fetch-depth: 1` cực nhanh |
| **Cài đặt Node.js** | Thẻ `setup-node` đời cũ (`v1`–`v3`) | **`actions/setup-node@v4`** | Tương thích mượt Node 22 LTS, tích hợp sẵn bộ đệm `~/.npm` chỉ bằng 1 dòng |
| **Phiên bản Node** | `14`, `16`, `18` (đã EOL) | **`"22"` (Active/Maintenance LTS)** | Vá bảo mật V8 mới nhất, hỗ trợ sẵn native `fetch`, `--env-file` và ESM/CJS |

> [!WARNING] Điều kiện bắt buộc khi bật `cache: "npm"` trên `actions/setup-node@v4`
> Đằng sau hậu trường, `cache: "npm"` tự động tính mã băm SHA-256 của tệp ==`package-lock.json`== (hoặc `npm-shrinkwrap.json`) để làm khoá lưu trữ thư mục đệm toàn cục `~/.npm` (chứa các gói `.tgz` nén). Nếu dự án quên commit `package-lock.json` lên Git, bước `setup-node@v4` sẽ lập tức báo lỗi không tìm thấy tệp khoá!

## 4. Dây chuyền kiểm định 3 bước và nút bấm chạy tay `workflow_dispatch`

```visual
kind: flow
title: "Dây Chuyền Kiểm Định Chuẩn Cho Dự Án TypeScript / Node.js 22"
steps:
  - icon: folder-git
    badge: "Bước 1 · Shallow Clone"
    title: "Checkout Code"
    desc: "Kéo commit mới nhất với fetch-depth: 1 trong ~1 giây"
    code: "actions/checkout@v4"
    tone: sky
    edge: "cài runtime"
  - icon: zap
    badge: "Bước 2 · Runtime + Cache"
    title: "Setup Node 22"
    desc: "Nạp Node 22 và khôi phục bộ đệm ~/.npm theo hash lockfile"
    code: "cache: \"npm\""
    tone: cyan
    edge: "giải nén nội bộ"
  - icon: package
    badge: "Bước 3 · Dependencies"
    title: "Clean Install"
    desc: "Dựng node_modules không cần tải lại hàng trăm MB qua mạng"
    code: "npm ci"
    tone: cyan
    edge: "kiểm tra biên dịch"
  - icon: wrench
    badge: "Bước 4 · Build & Test"
    title: "Build -> Unit Test"
    desc: "Đảm bảo đóng gói dist/ không vỡ kiểu dữ liệu rồi thực thi toàn bộ test"
    code: "npm run build && npm test"
    tone: emerald
```

Ngoài các sự kiện Git tự động, khi kỹ sư vận hành muốn **chủ động bấm nút chạy kiểm tra ngay trên giao diện Web GitHub** (mà không cần tạo commit rỗng `git commit --allow-empty`), hãy bổ sung `workflow_dispatch` kèm `inputs` vào tệp `.github/workflows/ci.yml` hoàn chỉnh:

```yaml
name: Node.js 22 CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      target_env:
        description: "Môi trường đích cần kiểm tra"
        required: true
        default: "staging"
        type: choice
        options: [staging, qa, production]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
      - run: echo "Target=${{ inputs.target_env }}"
      - run: npm ci
      - run: npm run build
      - run: npm test
```

> [!TIP] Hành vi giá trị mặc định của `workflow_dispatch` & Mở rộng sang Python / Go
> - Khi kỹ sư mở tab **Actions -> Run workflow** và bấm chạy ngay mà không chỉnh sửa ô chọn, `${{ inputs.target_env }}` tự động nhận giá trị `default: "staging"` (lệnh `echo` phía trên sẽ in ra chính xác `Target=staging`).
> - Nếu ngày mai bạn chuyển sang dự án **Python** hay **Go**, bộ khung YAML phía trên giữ nguyên 95%: chỉ cần thay bước `setup-node@v4` + `npm ci` bằng `astral-sh/setup-uv@v5` (`enable-cache: true`) + `uv sync --frozen && uv run ruff check . && uv run pytest` (cho Python), hoặc `actions/setup-go@v5` + `go test ./...` (cho Go)!

> [!REMEMBER] Ghi nhớ bỏ túi
> - Đặt tệp tại **`.github/workflows/*.yml`**, thụt lề bằng **2 dấu cách** (không dùng Tab).
> - Kết hợp `push.branches: [main]` và `pull_request.branches: [main]` (lọc theo **nhánh đích / base branch**) để không chạy trùng gấp đôi trên PR.
> - Dùng chuẩn **`actions/checkout@v4`** (mặc định `fetch-depth: 1`) và **`actions/setup-node@v4`** (`node-version: "22"`, `cache: "npm"` băm theo `package-lock.json`).

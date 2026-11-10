# Viết GitHub Actions Workflow đầu tiên chuẩn 2026

Sau khi hoàn tất Level 0 với nền tảng vững chắc về Exit Code, Ephemeral Runner và sự đồng bộ môi trường, giờ là lúc bạn tự tay đặt bút viết hoàn chỉnh một file **GitHub Actions Workflow chuẩn công nghiệp năm 2026** từ con số 0. Trên mạng hiện nay có hàng vạn bài hướng dẫn cũ từ thời 2020–2022 vẫn xúi bạn dùng `actions/checkout@v2` hay `node-version: 16` — nếu copy nguyên xi vào dự án hôm nay, đường ống của bạn sẽ lập tức báo cảnh báo đỏ hoặc từ chối chạy vì runtime Node 12/16 trên Hosted Runner đã chính thức bị khai tử.

---

## 1. Vị trí thư mục bắt buộc và quy tắc vàng của YAML

GitHub chỉ quét tự động các file có đuôi `.yml` hoặc `.yaml` đặt đúng trong thư mục:

```text
.github/workflows/ci.yml
```

Chỉ cần đặt nhầm thành `.github/workflow/ci.yml` (thiếu chữ `s` ở cuối chữ `workflows`) hoặc thụt lề bằng ký tự **Tab cứng (`\t`)**, toàn bộ file sẽ bị bỏ qua hoặc lỗi cú pháp ngay lập tức. Hãy luôn dùng **2 dấu cách (2 spaces)** cho mỗi cấp thụt lề.

---

## 2. Lọc nhánh thông minh cho `push` & `pull_request`

Nếu bạn viết cộc lốc `on: [push, pull_request]`, một hiện tượng lãng phí gấp đôi sẽ xảy ra: khi bạn đẩy commit lên nhánh tính năng `feat/login` đang mở Pull Request nhắm vào `main`, GitHub kích hoạt **cùng lúc 2 lần chạy y hệt nhau** (1 lần cho sự kiện `push` lên `feat/login`, và 1 lần cho sự kiện `pull_request` cập nhật PR)!

Mẫu cấu hình chuẩn mực nhất cho hầu hết các đội phát triển Node.js là:

```yaml
on:
  push:
    branches: [main]          # Chỉ chạy khi commit đã gộp vào nhánh chính main
  pull_request:
    branches: [main]          # Chạy kiểm định cho mọi PR nhắm đích vào main (từ bất kỳ nhánh feat/* nào!)
```

> **Hiểu đúng `pull_request.branches: [main]`**: Nó lọc theo **nhánh đích (base branch)** chứ không phải nhánh nguồn! Nghĩa là bạn đặt tên nhánh riêng là `feat/cart`, `fix/auth` hay `refactor/db`, miễn PR đó xin gộp vào `main` thì cổng CI đều tự động kích hoạt trọn vẹn mà không bị nhân đôi.

---

## 3. Tiêu chuẩn Actions thế hệ `@v4` và bộ đệm `cache: "npm"` tích hợp sẵn

Các GitHub Actions viết bằng JavaScript thực chất chạy bên trong một runtime Node.js nhúng trên Runner. Bảng đối chiếu dưới đây giúp bạn nhận diện ngay di sản lỗi thời cần nâng cấp khi tiếp quản dự án cũ:

| Thành phần | Cú pháp cũ lỗi thời (2020–2022) | Chuẩn 2026 bắt buộc | Lý do kỹ thuật |
| :--- | :--- | :--- | :--- |
| Tải mã nguồn Git | `actions/checkout@v2` / `@v3` | `actions/checkout@v4` | Chạy trên runtime Node 20+ mới, tải shallow fetch mặc định `fetch-depth: 1` cực nhanh |
| Cài đặt Node.js | `actions/setup-node@v2` / `@v3` | `actions/setup-node@v4` | Hỗ trợ mượt Node 22 LTS và tích hợp tự động cache `~/.npm` không cần cấu hình rườm rà |
| Phiên bản Node | `14`, `16`, `18` (đã End-of-Life) | `"22"` (Active/Maintenance LTS) | Bảo mật bản vá V8 mới nhất, hỗ trợ sẵn native `fetch`, `--env-file` và ESM/CJS |

Đặc biệt, với `actions/setup-node@v4`, bạn chỉ cần thêm duy nhất một dòng `cache: "npm"` bên trong khối `with:`:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: "22"
    cache: "npm"
```

Đằng sau hậu trường, Action này tự động tính mã băm SHA-256 của file `package-lock.json` để làm khoá lưu trữ thư mục cache toàn cục `~/.npm` (nơi chứa các gói tarball `.tgz` nén). Nhờ vậy ở lần chạy sau, lệnh `npm ci` không phải tải lại hàng trăm MB qua mạng từ `registry.npmjs.org` nữa mà giải nén trực tiếp từ bộ đệm nội bộ trong tích tắc!

---

## 4. Dây chuyền kiểm định 3 bước và nút bấm chạy tay `workflow_dispatch`

Sau khi đã có code và Node 22, dây chuyền xác minh cốt lõi của một dự án TypeScript/Node.js đi theo trình tự chặt chẽ:
1. `npm ci` — Dựng cây `node_modules` bất biến từ `package-lock.json`.
2. `npm run build` — Biên dịch TypeScript / bundler để phát hiện lỗi kiểu dữ liệu và đảm bảo code đóng gói ra `dist/` không vỡ.
3. `npm test` — Thực thi toàn bộ Unit Test.

Ngoài các sự kiện tự động theo Git, đôi khi kỹ sư vận hành muốn **chủ động bấm nút kích hoạt Workflow ngay trên giao diện Web của GitHub** (ví dụ chạy kiểm tra khẩn cấp lên môi trường `staging` hoặc `qa` mà không cần tạo commit giả `git commit --allow-empty`). Khi đó ta bổ sung sự kiện `workflow_dispatch` kèm tham số đầu vào `inputs`:

```yaml
on:
  workflow_dispatch:
    inputs:
      target_env:
        description: "Môi trường đích cần kiểm tra"
        required: true
        default: "staging"
        type: choice
        options: [staging, qa, production]
```

Ngay khi file này có mặt trên nhánh mặc định, tab **Actions** trên GitHub sẽ xuất hiện nút **Run workflow** kèm menu thả xuống gọn đẹp, đọc giá trị qua biểu thức `${{ inputs.target_env }}`. Bạn đã sẵn sàng tự tay lắp ráp trọn vẹn workflow chuẩn 2026 đầu tiên!

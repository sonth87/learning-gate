# Giải phẫu 6 thực thể đường ống: Trigger, Workflow, Job, Step & Ephemeral Runner

Khi mới mở một file `.github/workflows/ci.yml` hoặc `.gitlab-ci.yml`, nhiều lập trình viên Node.js cảm thấy choáng vì hàng chục từ khoá lồng nhau: `on`, `jobs`, `runs-on`, `steps`, `uses`, `run`, `defaults`. Tin vui là **mọi nền tảng CI/CD hiện đại năm 2026** (từ GitHub Actions, GitLab CI cho tới CircleCI hay Buildkite) đều chỉ xoay quanh đúng **6 thực thể cốt lõi**. Một khi nắm chắc ranh giới vật lý giữa 6 thực thể này — đặc biệt là cơ chế **Ephemeral Runner (máy chạy dùng một lần)** — bạn sẽ đọc thông viết thạo mọi đường ống mà không bao giờ mắc lỗi "sao bước trước vừa build ra `dist/` mà bước sau kêu không thấy file?!".

---

## 1. Bản đồ 6 thực thể cốt lõi (kèm phép ẩn dụ Node.js)

Hãy hình dung toàn bộ hệ thống CI/CD giống như cách bạn tổ chức một dự án Backend Node.js:

| Thực thể CI/CD | Từ khoá trong GitHub Actions | Phép ẩn dụ quen thuộc cho Node.js Dev | Vòng đời & Phạm vi chia sẻ ổ đĩa |
| :--- | :--- | :--- | :--- |
| **1. Event / Trigger** | `on: [push, pull_request]` | Giống `fs.watch` hoặc HTTP Webhook kích hoạt hàm callback | Xảy ra tức thời khi bạn `git push`, mở PR, gắn tag hoặc tới giờ cron |
| **2. Workflow** | Toàn bộ 1 file `.yml` trong `.github/workflows/` | Giống 1 kịch bản điều phối tổng thể (orchestrator) | Một repo có thể có nhiều Workflow độc lập (`ci.yml`, `release.yml`) |
| **3. Runner** | `runs-on: ubuntu-latest` | Một chiếc máy ảo Linux thuê theo phút (cấp phát mới tinh rồi vứt bỏ) | Sống đúng bằng thời gian chạy **1 Job**, tắt xong là xoá sạch ổ cứng! |
| **4. Job** | `jobs.<job_id>:` | Một tiến trình Worker độc lập chạy trên một máy khác hoàn toàn | Mặc định các Job chạy **song song**, **KHÔNG** chia sẻ ổ cứng hay RAM |
| **5. Step** | `steps: - ...` | Từng dòng lệnh chạy nối tiếp nhau trong cùng một script `npm run` | Chạy **tuần tự** trên cùng 1 Runner -> **CÓ** chia sẻ chung ổ đĩa workspace |
| **6. Action** | `uses: actions/checkout@v4` | Giống một gói hàm tái sử dụng trên npm (`import` về dùng ngay) | Đóng gói sẵn logic phức tạp (tải Git, cài Node 22, đẩy cache) |

---

## 2. Bước ngoặt tư duy số 1: Step chia sẻ ổ đĩa, nhưng Job thì KHÔNG!

Đây là cái bẫy khiến **90% người mới học CI/CD vấp ngã ngay tuần đầu tiên**.

Trong cùng một **Job** (ví dụ `jobs.verify`), mọi **Step** chạy tuần tự từ trên xuống dưới trên **cùng một máy ảo Runner (`ubuntu-latest`)**:
1. Step 1 gọi `uses: actions/checkout@v4` -> kéo code từ Git về thư mục `/home/runner/work/shop/shop`.
2. Step 2 gọi `uses: actions/setup-node@v4` -> cài binary `node` v22 vào `PATH` của máy ảo đó.
3. Step 3 gọi `run: npm ci` -> sinh ra thư mục `node_modules/` nằm ngay trên ổ SSD của máy ảo đó.
4. Step 4 gọi `run: npm test` -> thấy sẵn cả mã nguồn, cả `node` v22 lẫn `node_modules/` vừa cài ở Step 3!

Thế nhưng chuyện gì xảy ra nếu bạn tách thành **hai Job riêng biệt** là `jobs.install` và `jobs.test`?

```yaml
# ❌ PHẢN MẪU SAI LẦM KINH ĐIỂN: Tưởng 2 Job dùng chung ổ cứng!
jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci # Cài node_modules trên Máy Ảo #1 -> Xong Job là Máy Ảo #1 BỊ HUỶ!

  test:
    needs: install
    runs-on: ubuntu-latest # Khởi tạo Máy Ảo #2 MỚI TINH, ổ đĩa TRỐNG TRƠN!
    steps:
      - run: npm test # 💥 NỔ LỖI: không có package.json, không có cả node_modules!
```

Mỗi GitHub-hosted Runner là một **Ephemeral VM (Máy ảo dùng một lần)**. Ngay giây phút `jobs.install` chạy xong dòng cuối cùng, GitHub tiêu huỷ hoàn toàn Máy Ảo #1 để bảo mật và giải phóng tài nguyên. Khi `jobs.test` bắt đầu, nó thức dậy trên Máy Ảo #2 trắng tinh như vừa cài lại hệ điều hành!

Vì vậy, quy tắc vàng là:
- Mỗi Job độc lập **phải tự thân vận động (self-contained)**: tự `actions/checkout@v4`, tự `actions/setup-node@v4` (kèm `cache: 'npm'` để cài lại siêu nhanh chỉ mất vài giây) và tự `npm ci`.
- Nếu muốn truyền sản phẩm biên dịch (như thư mục `dist/` hoặc báo cáo test) từ Job này sang Job khác, bạn phải đóng gói gửi qua mạng bằng **Artifact** (`actions/upload-artifact@v4` và `actions/download-artifact@v4` — sẽ học chuyên sâu ở Level 2).

---

## 3. Phân biệt `uses:` (gọi Action đóng gói sẵn) và `run:` (gõ lệnh Shell)

Mỗi phần tử trong mảng `steps:` bắt buộc chọn **một trong hai** hình thức thực thi:

1. **`uses:` (Action)**: Tái sử dụng một module cộng đồng hoặc chính chủ GitHub viết sẵn bằng TypeScript/Docker. Tham số cấu hình truyền qua khối `with:` (tương tự truyền `options` object vào hàm JS).
   ```yaml
   - name: Setup Node.js 22
     uses: actions/setup-node@v4
     with:
       node-version: '22'
       cache: 'npm'
   ```
2. **`run:` (Shell command)**: Chạy trực tiếp câu lệnh dòng lệnh giống hệt khi bạn gõ vào Terminal Bash (ví dụ `npm ci`, `npm run lint`, `npm test`).

> **Lưu ý quan trọng**: Một máy ảo Runner mới khởi động **KHÔNG tự động tải code của repo bạn về**! Nếu quên viết `- uses: actions/checkout@v4` ở đầu Job, thư mục làm việc sẽ trống rỗng và lệnh `npm ci` sẽ báo lỗi `ENOENT: Could not read package.json`.

---

## 4. Xử lý dự án đặt trong thư mục con với `defaults.run.working-directory`

Trong thực tế đi làm, không phải lúc nào `package.json` cũng nằm ngay thư mục gốc (`/`) của Git repository. Rất nhiều dự án đặt Backend ở `apps/backend/package.json` và Frontend ở `apps/frontend/package.json`.

Thay vì viết lặp đi lặp lại `cd apps/backend && npm ci`, `cd apps/backend && npm run lint` ở mọi Step (vừa xấu vừa dễ quên vì mỗi Step khởi tạo lại subshell ở thư mục gốc!), GitHub Actions cung cấp cấu hình `defaults.run.working-directory` ở cấp Workflow hoặc cấp Job:

```yaml
jobs:
  backend-ci:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: apps/backend/package-lock.json
      - run: npm ci
      - run: npm test
```

Chỉ với 3 dòng khai báo gọn gàng, mọi khối `run:` bên trong Job tự động đứng sẵn tại `apps/backend/` — sạch sẽ, dễ đọc và chuẩn mực công nghiệp.

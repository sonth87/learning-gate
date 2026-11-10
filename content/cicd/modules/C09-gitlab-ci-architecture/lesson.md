# Kiến trúc GitLab CI/CD Thực chiến: Chuyển đổi Tư duy từ GitHub Actions sang `.gitlab-ci.yml`

Nếu GitHub Actions thống lĩnh thế giới mã nguồn mở và các công ty khởi nghiệp trên nền đám mây, thì tại các ngân hàng, tập đoàn viễn thông và doanh nghiệp tự vận hành máy chủ nội bộ (Self-managed / On-premise), **GitLab CI/CD** lại là ông vua không ngai.

Tin vui cho bạn là: **90% tư duy nền tảng bạn vừa học (Ephemeral Container, Exit Codes, Lockfile Cache, Artifacts, DAG, Sharding) đều giữ nguyên bản chất 100%!** Điểm khác biệt chỉ nằm ở "ngữ pháp" tệp duy nhất **`.gitlab-ci.yml`** đặt ở thư mục gốc dự án. Bài học này sẽ giúp bạn trở thành kỹ sư song ngữ thành thạo cả hai nền tảng hàng đầu thế giới!

---

## 1. Từ điển chuyển ngữ trực diện: GitHub Actions ↔ GitLab CI

Trong GitHub Actions, mỗi Job mặc định là một máy ảo Ubuntu rồi bạn cài Node.js vào bằng `setup-node`. Ngược lại, **GitLab Runner (Docker/Kubernetes Executor) chạy thẳng từng Job bên trong một Docker Container ngay từ đầu**! Bạn chỉ cần khai báo `image: node:22-alpine` là có sẵn ngay môi trường Node 22:

| Khái niệm tương đương | **GitHub Actions (`.github/workflows/*.yml`)** | **GitLab CI (`.gitlab-ci.yml`)** |
| --- | --- | --- |
| **Môi trường chạy mặc định** | `runs-on: ubuntu-latest` + `actions/setup-node@v4` | `default: { image: node:22-alpine }` |
| **Phân tầng giai đoạn** | Không có stage bắt buộc (mặc định song song, nối bằng `needs:`) | Khai báo mảng **`stages: [install, test, build, deploy]`** |
| **Các câu lệnh thực thi** | Mảng `steps:` chứa các mục `- run: ...` | Mảng **`script:`** chứa danh sách dòng lệnh shell |
| **Vượt rào chạy sớm (DAG)** | Dùng `needs: [job_a]` | Dùng **`needs: []`** (chạy ngay giây thứ 0) hoặc `needs: [job_a]` |
| **Chế độ Đọc/Ghi Cache** | `actions/cache@v4` vs `actions/cache/restore@v4` | **`cache: { policy: pull-push }`** vs **`policy: pull`** |
| **Truyền sản phẩm giữa Job** | `upload-artifact@v4` + `download-artifact@v4` | **`artifacts: { paths: ["dist/"], expire_in: "7 days" }`** *(tự tải ở các stage sau!)* |
| **Chia mảnh Sharding** | `strategy.matrix.shard: [1, 2, 3, 4]` | Chỉ 1 dòng duy nhất: **`parallel: 4`** (`$CI_NODE_INDEX` / `$CI_NODE_TOTAL`) |
| **Điều kiện chạy Job** | `on:` + `if: github.ref == 'refs/heads/main'` | Khối **`rules:`** với `$CI_COMMIT_BRANCH` / `$CI_PIPELINE_SOURCE` |

---

## 2. Phá vỡ rào cản tuần tự của `stages` bằng Đồ thị **`needs:`**

Theo mô hình truyền thống của GitLab CI, các Job được gom vào từng giai đoạn trong `stages: [install, test, build, deploy]`. Mặc định, **toàn bộ mọi Job ở stage trước phải chạy xong 100% thì các Job ở stage sau mới được phép rục rịch bắt đầu**!

Điều này đôi khi gây tắc nghẽn vô lý: ví dụ một Job kiểm tra cú pháp tệp cấu hình hoặc `lint_code` nhẹ nhàng không cần chờ một Job biên dịch nặng nề khác ở stage trước. GitLab CI giải quyết gọn đẹp bằng từ khoá **`needs:`**:
- Viết **`needs: []`** (mảng rỗng): Cho phép Job đó **phớt lờ hoàn toàn rào cản thứ tự `stages` và xuất phát ngay lập tức ở giây thứ 0**!
- Viết **`needs: ["install_deps"]`**: Chỉ cần đúng một mình `install_deps` xong là chạy luôn, đồng thời chỉ tải đúng `artifacts` của những Job nằm trong danh sách `needs` để tiết kiệm băng thông.

---

## 3. Quản trị Cache chuẩn mực trên GitLab: `key.files` & `policy: pull-push` vs `pull`

Khác với GitHub Actions nơi `~/.npm` nằm ngoài thư mục dự án, GitLab Runner chỉ cho phép lưu đệm các đường dẫn nằm **bên trong thư mục làm việc của dự án (`$CI_PROJECT_DIR`)**. Vì vậy, mẹo chuẩn cho Node.js trên GitLab CI là trỏ thư mục đệm npm vào `.npm/` ngay trong dự án (`npm ci --cache .npm --prefer-offline`) và cấu hình chính sách **`policy`** tách biệt rõ ràng:

```yaml
default:
  image: node:22-alpine
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - .npm/
    policy: pull              # Mặc định mọi Job chỉ kéo cache về ĐỌC (nhanh & an toàn!)

install_deps:
  stage: install
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - .npm/
    policy: pull-push         # CHỈ duy nhất Job đầu nguồn này được phép GHI cập nhật cache!
  script:
    - npm ci --cache .npm --prefer-offline
```

---

## 4. Tiện ích siêu gọn: `parallel: N` và Chuyển đổi từ `only/except` sang **`rules:`**

### Chia tải kiểm thử chỉ với một con số `parallel: 4`:
Không cần khai báo mảng ma trận dài dòng, khi bạn thêm `parallel: 4` vào một Job kiểm thử, GitLab tự động nhân bản ra 4 container song song và cấp sẵn hai biến môi trường tích hợp:
- **`$CI_NODE_INDEX`**: Thứ tự mảnh hiện tại (từ `1` đến `4`).
- **`$CI_NODE_TOTAL`**: Tổng số mảnh (`4`).
Bạn chỉ việc gọi thẳng: `npx vitest run --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL`!

### Khai tử cú pháp cũ `only:` / `except:` — Chào đón chuẩn hiện đại **`rules:`**:
Trong các tài liệu cũ từ năm 2019–2020, bạn có thể bắt gặp từ khoá `only: [main]` hoặc `except: [tags]`. GitLab đã chính thức **ngừng phát triển và khuyến nghị loại bỏ `only` / `except`** vì chúng không thể kết hợp biểu thức logic phức tạp dễ gây nhân đôi Pipeline (Duplicate Pipelines giữa nhánh và Merge Request).

Chuẩn mực hiện đại năm 2026 sử dụng hoàn toàn khối **`rules:`** được duyệt từ trên xuống dưới như câu lệnh `switch-case` trong JavaScript. Đặc biệt khi làm **cổng bấm nút duyệt tay (Manual Gate)** cho môi trường Production, luôn nhớ đi kèm **`allow_failure: false`** để đường ống dừng chờ thực sự (Blocking Manual Action) cho tới khi Quản lý Kỹ thuật bấm nút Play:

```yaml
deploy_prod:
  stage: deploy
  script:
    - ./scripts/deploy.sh production
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: manual
      allow_failure: false
```

# Di trú Cơ sở dữ liệu (Expand-and-Contract), Monorepo CI & Chỉ số DORA

Khi ứng dụng của bạn còn ở giai đoạn MVP với vài chục người dùng lúc nửa đêm, bạn có thể chạy thẳng `npx prisma migrate deploy` có lệnh đổi tên cột SQL, chờ toàn bộ 12 package trong kho mã nguồn build lại từ đầu, và đo năng suất đội ngũ bằng... cảm tính. Nhưng khi bước lên quy mô **Kiến trúc Hệ thống Lớn (Level 5)** — nơi hệ thống phục vụ hàng chục nghìn giao dịch đồng thời và kho mã nguồn Monorepo quy tụ 8 nhóm phát triển cùng đẩy hàng trăm PR mỗi ngày — ba bài toán kiến trúc hóc búa nhất sẽ xuất hiện:

1. **Làm sao thay đổi lược đồ SQL (Schema Migration) mà không đánh sập các Pod phiên bản cũ đang chạy song song trong lúc Rolling Update?**
2. **Làm sao chỉ chạy Lint/Test/Build cho đúng dịch vụ bị ảnh hưởng trong Monorepo Turborepo/Nx thay vì đốt tiền CI vô ích?**
3. **Làm sao đo lường sức khoẻ đường ống phát hành khách quan bằng bộ 4 chỉ số chuẩn công nghiệp DORA?**

---

## 1. Bẫy "Đổi tên / Xoá cột SQL" và Mô hình Expand-and-Contract 3 Pha

Hãy xét một tai nạn kinh điển trên Production: Lập trình viên đổi tên cột `full_name` thành `display_name` trong bảng `users`, tạo một file SQL migration `ALTER TABLE users RENAME COLUMN full_name TO display_name;` và đẩy lên nhánh `main`.
- **Phút 00:00**: Job `migrate` chạy xong câu lệnh `RENAME COLUMN` trên PostgreSQL chỉ trong 50ms.
- **Phút 00:01 -> 00:45**: Kubernetes bắt đầu Rolling Update cuộn dần 10 Pod từ bản cũ `v1` sang bản mới `v2`. Trong suốt 45 giây chuyển giao đó, các Pod `v1` vẫn đang nhận lưu lượng khách hàng và thực thi câu truy vấn `SELECT id, full_name FROM users`... **BÙM!** Cột `full_name` vừa biến mất khiến hàng nghìn request nổ lỗi `500 column "full_name" does not exist`! Tệ hơn nữa, nếu bản `v2` bị lỗi logic và bạn bấm **Rollback** code về `v1`, bản `v1` cũng chết cứng vì cơ sở dữ liệu đã bị biến dạng không tương thích ngược!

Giải pháp chuẩn mực duy nhất cho Zero-Downtime Database Migration là tách một thay đổi phá huỷ thành **3 đợt phát hành riêng biệt (Expand $\rightarrow$ Dual-Write & Backfill $\rightarrow$ Contract)** — giống hệt cách thư viện npm đánh dấu `@deprecated` ở bản `v1.9` trước khi xoá hẳn hàm ở `v2.0`:

| Pha triển khai | Thay đổi trên DB & Code | Tương thích ngược với Pod cũ? |
| :--- | :--- | :--- |
| **Pha 1: Expand (Mở rộng)** | `ALTER TABLE users ADD COLUMN display_name TEXT NULL;` (tuyệt đối không `NOT NULL` không có default, không `DROP`/`RENAME`). Code `v1.1` ghi đồng thời vào cả 2 cột (`Dual-Write`) và chạy Job chép dữ liệu cũ sang cột mới (`Backfill`). | **100% An toàn** — Pod `v1.0` vẫn đọc/ghi `full_name` bình thường, Rollback bất cứ lúc nào! |
| **Pha 2: Switch Read (Chuyển luồng đọc)** | Code `v1.2` chuyển hẳn sang đọc từ `display_name` và ngừng đọc/ghi `full_name`. Đợi toàn bộ Pod `v1.1` tắt hẳn và vận hành ổn định. | **100% An toàn** — Cột `full_name` vẫn còn đó nếu cần quay lui khẩn cấp về `v1.1`. |
| **Pha 3: Contract (Thu hẹp / Dọn dẹp)** | Sau khi không còn bất kỳ tiến trình nào chạm tới cột cũ, phát hành migration dọn dẹp `ALTER TABLE users DROP COLUMN full_name;`. | Đã xác nhận không còn Pod nào phụ thuộc vào cột cũ. |

Trong đường ống CI, bạn cần thiết lập **2 hàng rào tự động**:
1. **SQL Migration Linter**: Quét các file `.sql` mới bằng `grep -E -i "DROP COLUMN|RENAME COLUMN"` (hoặc công cụ như `squawk`) để chặn đứng và yêu cầu DBA phê duyệt riêng nếu phát hiện lệnh phá huỷ tương thích ngược trong luồng phát hành thông thường.
2. **Thứ tự DAG nghiêm ngặt**: Job `deploy-app` bắt buộc phải khai báo `needs: [migrate]` để đảm bảo pha `Expand` (`npm run migrate:deploy`) hoàn tất trước khi Pod code mới khởi chạy.

---

## 2. Tối ưu Monorepo CI: Path Filtering & Đồ thị Phụ thuộc Turborepo

Trong một kho Monorepo chứa `apps/web`, `apps/payment-api`, `apps/notification` và thư viện dùng chung `packages/shared-dto`, việc chạy toàn bộ 4 dịch vụ khi lập trình viên chỉ sửa đúng 1 dòng CSS trong `apps/web` làm lãng phí 75% chi phí CI. Có hai cấp độ lọc thông minh:

### Cấp độ 1: Lọc theo đường dẫn thư mục (`dorny/paths-filter@v3`)
Một job nhẹ `filters` chạy đầu tiên (chỉ mất ~3 giây) để đối chiếu danh sách tệp thay đổi trong PR và xuất ra `outputs` kiểu chuỗi `'true'` / `'false'`. Các job nặng phía sau như `test-payment` chỉ việc khai báo `needs: filters` kèm điều kiện `if: needs.filters.outputs.payment == 'true'`.

### Cấp độ 2: Lọc theo Đồ thị Phụ thuộc Gói npm (`Turborepo --filter`)
Điều gì xảy ra nếu PR sửa `packages/shared-dto`? Lọc đường dẫn đơn thuần rất dễ bỏ sót việc `apps/payment-api` có `"@acme/shared-dto": "workspace:*"` trong `package.json`! **Turborepo** đọc trực tiếp cây phụ thuộc giữa các `package.json` và đối chiếu với lịch sử Git của nhánh gốc thông qua cú pháp `--filter=...[origin/main]`:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0   # BẮT BUỘC: tải đầy đủ lịch sử Git để so sánh được với origin/main!
- run: npx turbo run lint test build --filter=...[origin/main]
```

Lưu ý ba dấu chấm trước ngoặc vuông `...[origin/main]` có nghĩa là: *"Chạy cho các package vừa bị thay đổi so với `origin/main` **CỘNG THÊM toàn bộ các package cha phụ thuộc vào chúng**"*. Và đừng bao giờ quên `fetch-depth: 0` ở bước `actions/checkout@v4` — vì mặc định checkout chỉ tải nông 1 commit cuối (`fetch-depth: 1`), khiến Git không tìm thấy nhánh `origin/main` để tính toán diff!

---

## 3. Đo lường Hiệu năng Kỹ thuật bằng Bộ 4 Chỉ số DORA

Chương trình nghiên cứu **DORA (DevOps Research and Assessment)** đã chứng minh tốc độ và sự ổn định không hề đối nghịch nhau mà bổ trợ lẫn nhau thông qua 4 chỉ số chuẩn:

1. **Deployment Frequency (Tần suất phát hành)**: Đội ngũ đưa code lên Production bao lâu một lần? (Nhóm Elite: nhiều lần mỗi ngày theo yêu cầu).
2. **Lead Time for Changes (Thời gian dẫn từ Commit tới Production)**: Mất bao lâu từ lúc lập trình viên tạo commit tới khi commit đó chạy thực tế trên Production? (Nhóm Elite: dưới 1 giờ).
3. **Change Failure Rate — CFR (Tỷ lệ thay đổi gây lỗi)**: Bao nhiêu phần trăm các lần phát hành dẫn tới suy giảm dịch vụ cần Hotfix hoặc Rollback? (Nhóm Elite: $0\% - 5\%$).
4. **Mean Time to Restore — MTTR / Failed Deployment Recovery Time**: Khi sự cố xảy ra trên Production, mất trung bình bao lâu để khôi phục dịch vụ? (Nhóm Elite: dưới 1 giờ, thậm chí dưới vài phút nhờ Canary + Auto-Rollback!).

Ngay sau job `deploy-prod` thành công (`needs: [deploy-prod]`, `if: success()`), một job nhẹ `dora-metrics` ghi nhận `commit_sha`, dấu thời gian `deployed_at` và `environment: production` gửi về hệ thống quan trắc sẽ biến chính đường ống CI/CD thành nguồn dữ liệu trung thực nhất để cải tiến liên tục!

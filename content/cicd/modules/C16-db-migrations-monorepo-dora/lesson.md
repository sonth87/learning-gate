# Di trú Cơ sở dữ liệu (Expand-and-Contract), Monorepo CI & Chỉ số DORA

Khi ứng dụng còn ở giai đoạn MVP ít người dùng lúc nửa đêm, bạn có thể chạy thẳng lệnh đổi tên cột SQL, chờ toàn bộ 12 package trong kho mã nguồn build lại từ đầu và đo năng suất bằng cảm tính. Nhưng khi bước lên **Kiến trúc Hệ thống Lớn** — phục vụ hàng chục nghìn giao dịch đồng thời với kho Monorepo gồm 8 nhóm phát triển đẩy hàng trăm PR mỗi ngày — ba bài toán hóc búa nhất sẽ xuất hiện:

- [>] **{sky:Zero-Downtime DB Migration}:** Làm sao thay đổi lược đồ SQL mà không đánh sập các Pod phiên bản cũ (`v1`) đang chạy song song cùng Pod mới (`v2`) trong lúc Rolling Update?
- [>] **{violet:Smart Monorepo CI}:** Làm sao chỉ chạy Lint/Test/Build cho đúng dịch vụ bị ảnh hưởng (kể cả phụ thuộc bắc cầu) thay vì đốt tiền CI vô ích?
- [>] **{emerald:Engineering Telemetry}:** Làm sao đo lường sức khoẻ đường ống khách quan bằng bộ **4 chỉ số chuẩn công nghiệp DORA**?

---

## 1. Bẫy "Đổi tên / Xoá cột SQL" và Mô hình Expand-and-Contract 3 Pha

Hãy xét một tai nạn kinh điển trên Production: lập trình viên đổi tên cột `full_name` thành `display_name` (hoặc `total` thành `grand_total`), tạo file migration `ALTER TABLE users RENAME COLUMN full_name TO display_name;` và đẩy thẳng lên `main`.

```visual
kind: compare
title: "Thay Đổi Lược Đồ SQL Trong Lúc Rolling Update: Phá Huỷ Tức Thì vs Tương Thích Ngược"
subtitle: "Tại thời điểm chuyển giao Zero-Downtime, luôn tồn tại đồng thời cả Pod v1 và Pod v2 cùng truy vấn vào 1 Database duy nhất!"
left:
  badge: "THẢM HOẠ DOWNTIME · Phá vỡ tương thích ngược"
  title: "Chạy RENAME COLUMN / DROP COLUMN trực tiếp"
  tone: rose
  code: |
    -- Phút 00:00: Chạy xong trên PostgreSQL trong 50ms!
    ALTER TABLE users
      RENAME COLUMN full_name TO display_name;

    -- Phút 00:01 -> 00:45 (Đang Rolling Update 10 Pod):
    -- Các Pod v1 cũ vẫn đang sống và gọi:
    SELECT id, full_name FROM users;
    -- -> NỔ HÀNG NGHÌN LỖI HTTP 500!
  lang: sql
  bullets:
    - "Trong 45 giây cuộn Pod từ `v1` sang `v2`, mọi Pod `v1` đang phục vụ khách hàng lập tức sập vì `column \"full_name\" does not exist`!"
    - "**Mất đường lui:** Nếu code `v2` dính lỗi logic và bạn bấm **Rollback** về `v1`, bản `v1` cũng chết cứng vì Database đã bị biến dạng!"
right:
  badge: "CHUẨN ZERO-DOWNTIME · An toàn 100%"
  title: "Mở rộng trước (Expand) + Nối chặt DAG needs: [migrate]"
  tone: emerald
  code: |
    -- Pha 1 (Expand): Chỉ THÊM cột cho phép NULL
    ALTER TABLE users
      ADD COLUMN display_name TEXT NULL;

    # Trong Workflow YAML — Cấm chạy song song migrate & deploy!
    deploy-app:
      needs: [migrate]   # Đợi thêm cột xong mới bật Pod mới!
  lang: yaml
  bullets:
    - "Pod `v1` cũ vẫn đọc/ghi cột `full_name` bình thường như chưa có chuyện gì xảy ra; Rollback bất cứ giây nào cũng an toàn"
    - "Bắt buộc cấu hình ==`needs: [migrate]`== trên `deploy-app` và đặt **SQL Migration Linter** (`grep -E -i \"DROP COLUMN|RENAME COLUMN\"` / `squawk`) chặn lệnh phá huỷ!"
```

Giải pháp chuẩn mực duy nhất là tách một thay đổi phá huỷ thành ==3 đợt phát hành độc lập (Expand → Switch Read → Contract)== — giống hệt cách thư viện npm đánh dấu `@deprecated` ở bản `v1.9` trước khi xoá hẳn hàm ở `v2.0`:

```visual
kind: flow
title: Quy Trình Di Trú Cơ Sở Dữ Liệu 3 Pha Expand-and-Contract (Zero-Downtime)
subtitle: Đổi tên cột full_name sang display_name êm ái mà không làm rớt bất kỳ giao dịch nào của khách hàng
steps:
  - icon: database
    badge: Pha 1 · Mở rộng
    title: Expand & Dual-Write
    desc: Thêm cột display_name NULL; code v1.1 ghi đồng thời 2 cột + chạy Backfill dữ liệu cũ
    code: "ADD COLUMN ... NULL"
    tone: sky
    edge: 100% dữ liệu đồng bộ
  - icon: refresh
    badge: Pha 2 · Chuyển đọc
    title: Switch Read (v1.2)
    desc: Code v1.2 chuyển hẳn sang đọc/ghi display_name; ngừng chạm vào cột full_name
    code: "SELECT display_name"
    tone: amber
    edge: hết sạch Pod cũ
  - icon: trash
    badge: Pha 3 · Thu hẹp
    title: Contract (Cleanup)
    desc: Chỉ sau khi 100% Pod chạy ổn định trên cột mới mới phát hành lệnh xoá cột cũ
    code: "DROP COLUMN full_name"
    tone: emerald
```

---

## 2. Tối ưu Monorepo CI: Path Filtering & Đồ thị Phụ thuộc Turborepo

Trong một kho Monorepo chứa `apps/web`, `apps/payment-api`, `apps/notification` và gói dùng chung `packages/shared-dto`, chạy lại toàn bộ 4 dịch vụ khi lập trình viên chỉ sửa 1 dòng CSS trong `apps/web` làm lãng phí 75% chi phí CI. Có hai cấp độ lọc thông minh:

### Cấp độ 1: Lọc đường dẫn thư mục với `dorny/paths-filter@v3`
Một job nhẹ `filters` chạy đầu tiên (~3 giây) để kiểm tra thư mục thay đổi. Lưu ý quan trọng trong GitHub Actions: mọi đầu ra `outputs` giữa các job luôn mang **kiểu chuỗi ký tự (`'true'` hoặc `'false'`)**, nên biểu thức điều kiện chuẩn là:
`if: needs.filters.outputs.payment == 'true'`

### Cấp độ 2: Lọc theo Đồ thị Phụ thuộc Gói với `Turborepo --filter`
Nếu PR sửa gói nền `packages/shared-dto` (hoặc `packages/shared-utils`), lọc đường dẫn thư mục đơn thuần rất dễ bỏ sót việc `apps/payment-api` đang import gói đó! **Turborepo** giải quyết triệt để bằng cách đọc cây phụ thuộc `package.json` kết hợp lịch sử Git (bắt buộc bật ==`fetch-depth: 0`== khi checkout!) qua cú pháp ==`--filter=...[origin/main]`==:

```visual
kind: flow
title: "Cơ Chế Lọc Thông Minh Theo Đồ Thị Phụ Thuộc Của Turborepo (--filter=...[origin/main])"
subtitle: "Ba dấu chấm '...' phía trước đảm bảo kiểm thử cả gói vừa sửa LẪN mọi ứng dụng cha phụ thuộc ngược vào nó!"
steps:
  - icon: folder-git
    badge: Bắt buộc đủ lịch sử
    title: "checkout (fetch-depth: 0)"
    desc: Tải trọn vẹn lịch sử Git để có nhánh tham chiếu origin/main tính toán diff
    code: "fetch-depth: 0"
    tone: amber
    edge: sửa gói dùng chung
  - icon: package
    badge: Gói trực tiếp đổi
    title: packages/shared-dto
    desc: Lập trình viên thay đổi kiểu dữ liệu DTO trong thư viện nội bộ
    code: "changed vs origin/main"
    tone: sky
    edge: truy vết "..." dependents
  - icon: boxes
    badge: Tự động kéo theo
    title: payment-api & web
    desc: Turborepo chạy lint/test/build cho cả 2 app có import shared-dto; bỏ qua notification!
    code: "--filter=...[origin/main]"
    tone: emerald
```

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0   # BẮT BUỘC: mặc định là 1 (shallow clone) sẽ không thấy origin/main!
- run: npx turbo run lint test build --filter=...[origin/main]
```

---

## 3. Đo lường Hiệu năng Kỹ thuật bằng Bộ 4 Chỉ số DORA (Four Keys)

Chương trình nghiên cứu **DORA (*DevOps Research and Assessment*)** đã chứng minh **Tốc độ (*Throughput*)** và **Tính ổn định (*Stability*)** không hề đánh đổi nhau mà củng cố lẫn nhau thông qua ==4 chỉ số chuẩn công nghiệp (Four Keys)==:

```visual
kind: groups
title: "Bộ 4 Chỉ Số Chuẩn Công Nghiệp DORA (\"Four Keys\") [!badge:emerald:Elite Benchmarks]"
subtitle: Hai chỉ số đầu đo Tốc độ giao nhận (Throughput) · Hai chỉ số sau đo Chất lượng & Khả năng phục hồi (Stability)
columns: 2
items:
  - num: 1
    icon: rocket
    title: Deployment Frequency
    badge: Tốc độ · Tần suất phát hành
    tone: sky
    desc: Đội ngũ đưa mã nguồn lên Production thành công bao lâu một lần?
    bullets:
      - "**Nhóm Elite:** Phát hành theo yêu cầu — **nhiều lần mỗi ngày**"
      - "Phản ánh kích thước lô thay đổi (*batch size*) nhỏ gọn và tự động hoá CI/CD mượt mà"
  - num: 2
    icon: zap
    title: Lead Time for Changes
    badge: Tốc độ · Thời gian dẫn
    tone: cyan
    desc: Mất bao lâu tính từ lúc lập trình viên tạo Commit cho tới khi chạy thực tế trên Production?
    bullets:
      - "**Nhóm Elite:** **Dưới 1 giờ**"
      - "Phản ánh tốc độ đường ống kiểm thử song song, rà soát PR nhanh và không bị tắc nghẽn duyệt tay"
  - num: 3
    icon: shield-alert
    title: Change Failure Rate (CFR)
    badge: Ổn định · Tỷ lệ phát hành lỗi
    tone: amber
    desc: Bao nhiêu phần trăm các đợt phát hành lên Production gây suy giảm dịch vụ cần Hotfix hoặc Rollback?
    bullets:
      - "**Nhóm Elite:** Chỉ từ **`0% – 5%`**"
      - "Được kéo giảm mạnh nhờ 5-Layer DevSecOps, Smoke Test và Expand-and-Contract DB"
  - num: 4
    icon: rollback
    title: Mean Time to Restore (MTTR)
    badge: Ổn định · Thời gian khôi phục
    tone: emerald
    desc: Khi sự cố nổ ra trên Production, mất trung bình bao lâu để khôi phục dịch vụ bình thường?
    bullets:
      - "**Nhóm Elite:** **Dưới 1 giờ** (thậm chí dưới 1 phút nhờ Canary + Auto-Rollback / `git revert`!)"
      - "Còn gọi là *Failed Deployment Recovery Time* trong các báo cáo DORA mới nhất"
```

Ngay sau job `deploy-prod` thành công (`needs: [deploy-prod]`, `if: success()`), một job nhẹ `dora-metrics` ghi nhận `commit_sha`, dấu thời gian `deployed_at` và `environment: production` sẽ biến chính đường ống CI/CD thành nguồn dữ liệu trung thực nhất để cải tiến kỹ thuật liên tục!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Expand-and-Contract 3 Pha:** Chỉ được chạy **`DROP COLUMN`** ở **Pha 3 (Contract)** sau khi đã Backfill đủ dữ liệu và 100% Pod chuyển hẳn sang cột mới; job `deploy-app` luôn phải có **`needs: [migrate]`**.
> - **Monorepo Turborepo:** Đặt **`fetch-depth: 0`** khi checkout và dùng **`--filter=...[origin/main]`** (dấu `...` lấy cả các package cha phụ thuộc ngược). Đầu ra của `dorny/paths-filter` luôn so sánh kiểu chuỗi `== 'true'`.
> - **4 Chỉ số DORA:** **Deployment Frequency** + **Lead Time for Changes** (Tốc độ) và **Change Failure Rate (CFR)** + **Mean Time to Restore (MTTR)** (Ổn định).

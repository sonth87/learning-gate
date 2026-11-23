# Tăng tốc Pipeline: Phân biệt Cache vs Artifact, Cache Key theo mã băm Lockfile & Mô hình Cache Read-Only

Ở các bài trước, bạn đã nắm cơ chế của **Ephemeral Runners**: mỗi Job chạy trên một máy ảo mới hoàn toàn và bị xóa sau khi Job kết thúc. Chính đặc điểm này đặt ra hai bài toán thực tế về hiệu năng và truyền dữ liệu:
1. Làm sao tránh việc 4 Job chạy song song (`lint`, `typecheck`, `unit-test`, `build`) đều phải tải lại hàng trăm megabyte gói thư viện từ `registry.npmjs.org`?
2. Sau khi Job `build` biên dịch TypeScript/Vite ra thư mục `dist/`, làm sao chuyển nguyên vẹn thư mục `dist/` sang Job `deploy` mà không phải chạy lại `npm run build`?

Giải pháp nằm ở việc phân biệt đúng hai cơ chế lưu trữ có mục đích hoàn toàn khác nhau:
- **`Cache` (Bộ nhớ đệm thư viện giữa các lần chạy):** Dùng để lưu lại các thư mục gói phụ thuộc tải từ mạng (`~/.npm`, `~/.cache/uv`, `~/.m2`) giữa các lượt chạy workflow khác nhau nhằm rút ngắn thời gian cài đặt. Cache mang tính chất *tùy chọn (best-effort)*: nếu bộ đệm bị xóa hoặc hết hạn, pipeline vẫn tải lại thư viện từ Internet và chạy bình thường, chỉ tốn thêm thời gian.
- **`Artifact` (Sản phẩm đầu ra của một lần chạy):** Dùng để lưu trữ các tệp thành phẩm (`dist/`, file `.jar`, báo cáo Playwright HTML, `sbom.json`) nhằm truyền dữ liệu từ Job này sang Job khác trong cùng một lần chạy workflow, hoặc lưu lại để tải về kiểm tra. Artifact mang tính *bắt buộc*: nếu thiếu Artifact đầu vào, Job triển khai (`deploy`) phía sau sẽ thất bại.

*(Có thể hình dung đơn giản: `Cache` giống như kho nguyên liệu sơ chế sẵn dùng lại qua nhiều ngày để tiết kiệm thời gian chuẩn bị, còn `Artifact` giống như thành phẩm đã đóng gói niêm phong của một đơn hàng cụ thể để chuyển từ khâu sản xuất sang khâu giao nhận).*

```visual
kind: illustration
diagram: "cicd:c07"
alt: "Đối chiếu kiến trúc Dependency Cache băm theo lockfile xuyên lượt chạy với Build Artifacts truyền gói thành phẩm xuyên các Job"
title: "Cơ chế lưu trữ Pipeline: Dependency Cache xuyên lượt vs Artifact xuyên Job"
subtitle: "Tăng tốc cài đặt thư viện qua mã băm package-lock.json và đảm bảo nguyên tắc Build Một Lần, Triển Khai Mọi Môi Trường"
caption: "Cơ chế Cache Key theo mã băm hashFiles('**/package-lock.json') của Cache (main ghi, PR đọc) đối lập với quy trình upload/download-artifact bất biến giữa các Job"
callouts:
  - num: 1
    label: "Dependency Cache — Tăng tốc xuyên các lượt chạy"
    desc: "Đệm kho ~/.npm theo mã băm SHA-256 của package-lock.json; nhánh main ghi chuẩn, các PR kéo về dùng lại trong vài giây (xoá đi vẫn chạy được)."
    tone: cyan
  - num: 2
    label: "Build Artifacts — Chuyển giao thành phẩm giữa các Job"
    desc: "Đóng gói thư mục dist/, báo cáo Playwright và SBOM gắn chặt với đúng Commit SHA để truyền từ máy ảo build sang các máy ảo sau."
    tone: cyan
  - num: 3
    label: "Triển khai đồng nhất & Tối ưu retention-days"
    desc: "Staging và Production cùng tải đúng 1 gói Artifact duy nhất mà không biên dịch lại; đặt retention-days: 7 giúp tiết kiệm 90% dung lượng."
    tone: emerald
```

## 1. Đối chiếu kiến trúc: `Cache` (`actions/cache@v4`) vs `Artifact` (`upload-artifact@v4`)

```visual
kind: layers
title: "Phân Biệt Rạch Ròi Hai Cơ Chế Lưu Trữ: Cache vs Artifact"
subtitle: "Xoá sạch Cache thì pipeline chỉ chạy chậm hơn nhưng vẫn xanh · Mất Artifact thì bước Deploy dừng ngay lập tức!"
columns:
  - title: "Cache (actions/cache@v4)"
    badge: "Tăng tốc phụ thuộc xuyên lượt chạy"
    tone: cyan
    layers:
      - label: "Mục đích: Bộ đệm gói trung gian tải lại nhiều lần"
        sub: "Lưu thư mục ~/.npm, .pnpm-store, .turbo, .next/cache"
        note: "Tăng tốc build"
        tone: cyan
      - label: "Cam kết tồn tại: Best-effort (Không đảm bảo 100%)"
        sub: "Tự xoá sau 7 ngày không truy cập hoặc khi vượt trần 10 GB / repo"
        note: "Xoá vẫn chạy được"
        tone: sky
      - label: "Phạm vi chia sẻ: Xuyên các lượt chạy Workflow khác nhau"
        sub: "Hôm qua nhánh main lưu đệm -> hôm nay các PR khác kéo về dùng lại"
        note: "Cross-workflow runs"
        tone: emerald
    footer: "Với Node.js chuẩn: bật nhanh qua cache: \"npm\" ngay trên actions/setup-node@v4!"
  - title: "Artifact (upload-artifact@v4 / download-artifact@v4)"
    badge: "Sản phẩm đầu ra bất biến của 1 Commit"
    tone: cyan
    layers:
      - label: "Mục đích: Sản phẩm biên dịch & Hồ sơ kiểm định"
        sub: "Lưu gói dist/, báo cáo lỗi Playwright HTML, Coverage, sbom.json"
        note: "Đầu ra chính thức"
        tone: cyan
      - label: "Cam kết tồn tại: Bắt buộc chính xác 100% theo Commit SHA"
        sub: "Job deploy phụ thuộc trực tiếp vào đúng bản dist/ vừa đóng gói"
        note: "Bất biến tuyệt đối"
        tone: amber
      - label: "Phạm vi & Lưu trữ: Giữa các Job cùng lượt chạy + Tải ZIP"
        sub: "Mặc định giữ 90 ngày -> nên đặt retention-days: 7 cho bản tạm để tiết kiệm 90% dung lượng"
        note: "retention-days: 7"
        tone: emerald
    footer: "Dùng upload-artifact@v4 ở Job sản xuất và download-artifact@v4 ở Job tiêu thụ"
```

## 2. Cơ chế Cache Key theo `hashFiles` và cơ chế dự phòng `restore-keys`

Khi nào bạn thực sự cần tải gói mới từ npm? Chỉ khi tệp khoá **`package-lock.json`** thay đổi! `actions/cache@v4` mô hình hoá chính xác điều đó qua hàm biểu thức tích hợp ==`hashFiles('**/package-lock.json')`==:

```visual
kind: flow
title: "Thuật Toán Tra Cứu Bộ Đệm 2 Tầng: Exact Hit & Fallback restore-keys"
steps:
  - icon: key
    badge: "Bước 1 · Băm khoá"
    title: "Tính SHA-256 Lockfile"
    desc: "Sinh khoá duy nhất gắn với OS và nội dung package-lock.json"
    code: "hashFiles('**/package-lock.json')"
    tone: sky
    edge: "tra cứu khoá chính"
  - icon: zap
    badge: "Trường hợp A · Khớp 100%"
    title: "Exact Cache Hit"
    desc: "PR chỉ sửa code .ts không đổi lockfile -> giải nén ~/.npm trong vài giây!"
    code: "Tăng tốc 3–4x"
    tone: emerald
    edge: "nếu lệch khoá?"
  - icon: search
    badge: "Trường hợp B · Lưới đỡ"
    title: "Partial Hit (restore-keys)"
    desc: "Vừa thêm 1 gói zod mới -> tìm bản đệm tiền tố Linux-npm- gần nhất có sẵn 99% gói cũ"
    code: "restore-keys: Linux-npm-"
    tone: amber
    edge: "cuối Job"
  - icon: disk
    badge: "Bước cuối · Cập nhật"
    title: "Chỉ tải gói mới & Lưu"
    desc: "Tải bổ sung đúng gói zod rồi đóng gói thành Cache Key theo mã băm mới"
    code: "Post Cache Save"
    tone: cyan
```

```yaml
- name: Khôi phục bộ đệm tải gói npm
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

> [!TIP] Đường tắt gọn đẹp nhất cho dự án Node.js tiêu chuẩn
> Khi chỉ cần đệm thư mục tải gói npm mặc định, bạn chỉ việc viết `cache: "npm"` bên trong `actions/setup-node@v4` — ở bên dưới nó tự động gọi chính xác cơ chế băm `package-lock.json` và lưu đệm `~/.npm` mà không cần viết khối `actions/cache@v4` thủ công!

## 3. Lưu ý khi cache `node_modules` và mô hình **Read-Only Cache**

Một số lập trình viên mới thường nén toàn bộ thư mục `node_modules` bằng `actions/upload-artifact@v4` ở Job đầu để truyền sang các Job sau, hoặc cấu hình cả 4 Job song song vừa đọc vừa ghi đè Cache. Cả hai cách làm này đều làm chậm pipeline và tiềm ẩn rủi ro bảo mật:

```visual
kind: compare
title: "So sánh: Đẩy node_modules vào Artifact vs Mô hình Read-Only Cache"
subtitle: "Tách bạch rõ ràng: ~/.npm đi qua Cache chỉ đọc · dist/ gọn nhẹ đi qua Artifact"
left:
  badge: "KHÔNG TỐI ƯU · Chậm 4–6 phút & Lỗi quyền"
  title: "Đẩy node_modules vào Artifact & Ghi đè Cache bừa bãi"
  tone: rose
  code: |
    # CÁCH LÀM KHÔNG HIỆU QUẢ: Nén 50.000 tệp nhỏ!
    - uses: actions/upload-artifact@v4
      with:
        name: node-deps
        path: node_modules/
  lang: yaml
  bullets:
    - "`node_modules` chứa **35.000 – 60.000 tệp nhỏ li ti** kèm hàng trăm symlink trong `.bin/`"
    - "Quét đĩa, nén và tải qua Artifact ngốn **4–6 phút**, khi giải nén còn dễ mất cờ thực thi (`chmod +x`) gây lỗi `Permission denied` lúc gọi `eslint` / `tsc`!"
    - "Nếu 4 Job song song cùng gọi `actions/cache@v4` đầy đủ, cuối Job cả 4 máy đua nhau nén ghi lặp lại và dễ gây **Cache Poisoning** từ nhánh PR"
right:
  badge: "CHUẨN 2026 · Read-Only Cache + Slim Artifact"
  title: "Chỉ 1 nơi Ghi bộ đệm, các Job song song Chỉ Đọc (restore)"
  tone: emerald
  code: |
    # Trong 4 Job song song (lint, typecheck, test, build):
    - uses: actions/cache/restore@v4
      with:
        path: ~/.npm
        key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
        restore-keys: ${{ runner.os }}-npm-
    - run: npm ci

    # Chỉ truyền gói sản phẩm gọn nhẹ dist/ sang Job deploy:
    - uses: actions/upload-artifact@v4
      with:
        name: web-dist
        path: dist/
        retention-days: 7
  lang: yaml
  bullets:
    - "Chỉ Job chuẩn bị trên nhánh tin cậy `main` dùng `actions/cache@v4` (hoặc `actions/cache/save@v4`) để ghi bộ đệm"
    - "Các Job kiểm tra song song và nhánh PR dùng ==`actions/cache/restore@v4`==: **chỉ kéo về đọc**, tốn **0 giây** ở bước kết thúc Job và triệt tiêu nguy cơ ô nhiễm bộ đệm!"
    - "Gắn `retention-days: 7` lên `upload-artifact@v4` để tự dọn các bản `dist/` tạm sau 1 tuần"
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Cache** (`actions/cache@v4` / `cache: "npm"`): Lưu gói phụ thuộc trung gian (`~/.npm`) xuyên các lượt chạy theo khoá `hashFiles('**/package-lock.json')` + lưới đỡ `restore-keys`.
> - **Artifact** (`upload-artifact@v4` / `download-artifact@v4`): Lưu sản phẩm đầu ra bất biến (`dist/`, báo cáo lỗi) của đúng lượt chạy đó; nhớ đặt `retention-days: 7` cho bản build nháp.
> - **Tuyệt đối không** đẩy `node_modules` vào Artifact · Dùng **`actions/cache/restore@v4`** cho các Job chạy song song theo mô hình **Read-Only Cache**.

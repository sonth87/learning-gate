# Tăng tốc Đường ống: Phân biệt Cache vs Artifact, Khóa băm Lockfile & Mô hình Cache Read-Only

Ở các bài trước, bạn đã nắm vững sự thật vật lý của **Ephemeral Runners**: mỗi Job chạy trên một máy ảo Ubuntu mới tinh và bị xoá sổ vĩnh viễn ngay giây phút Job kết thúc! Chính cơ chế "dùng một lần rồi huỷ" này đặt ra hai bài toán thực tế rất tốn thời gian:
1. Chẳng lẽ mỗi khi có 4 Job chạy song song (`lint`, `typecheck`, `unit-test`, `build`), cả 4 máy ảo đều phải tải lại hàng trăm megabyte gói thư viện từ `registry.npmjs.org`?
2. Sau khi Job `build` mất 2 phút biên dịch TypeScript/Vite ra thư mục `dist/`, làm sao truyền nguyên vẹn `dist/` sang Job `deploy` mà không cần chạy lại `npm run build` lần hai?

Chìa khoá nằm ở việc phân biệt rạch ròi hai công cụ có bản chất hoàn toàn trái ngược nhau: ==`Cache`== và ==`Artifact`==!

## 1. Đối chiếu kiến trúc: `Cache` (`actions/cache@v4`) vs `Artifact` (`upload-artifact@v4`)

```visual
kind: layers
title: "Phân Biệt Rạch Ròi Hai Cơ Chế Lưu Trữ: Cache vs Artifact"
subtitle: "Xoá sạch Cache thì đường ống chỉ chạy chậm hơn nhưng vẫn xanh · Mất Artifact thì bước Deploy dừng ngay lập tức!"
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
    tone: violet
    layers:
      - label: "Mục đích: Sản phẩm biên dịch & Hồ sơ kiểm định"
        sub: "Lưu gói dist/, báo cáo lỗi Playwright HTML, Coverage, sbom.json"
        note: "Đầu ra chính thức"
        tone: violet
      - label: "Cam kết tồn tại: Bắt buộc chính xác 100% theo Commit SHA"
        sub: "Job deploy phụ thuộc sống còn vào đúng bản dist/ vừa đóng gói"
        note: "Bất biến tuyệt đối"
        tone: amber
      - label: "Phạm vi & Lưu trữ: Giữa các Job cùng lượt chạy + Tải ZIP"
        sub: "Mặc định giữ 90 ngày -> nên đặt retention-days: 7 cho bản tạm để tiết kiệm 90% dung lượng"
        note: "retention-days: 7"
        tone: emerald
    footer: "Dùng upload-artifact@v4 ở Job sản xuất và download-artifact@v4 ở Job tiêu thụ"
```

## 2. Cơ chế Khóa băm (`hashFiles`) và Lưới đỡ `restore-keys` của `actions/cache@v4`

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
    desc: "Tải bổ sung đúng gói zod rồi đóng gói thành khoá băm mới"
    code: "Post Cache Save"
    tone: violet
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

## 3. Cạm bẫy thảm hoạ `node_modules` & Mô hình **Read-Only Cache Pattern** chuẩn 2026

Nhiều người mới cố tình nén cả thư mục `node_modules` bằng `actions/upload-artifact@v4` ở Job đầu để truyền sang các Job sau, hoặc cho cả 4 Job song song cùng vừa đọc vừa ghi đè Cache. Cả hai đều là phản mẫu gây chậm và rủi ro bảo mật:

```visual
kind: compare
title: "Phản Mẫu Nén node_modules / Tranh Chấp Ghi vs Read-Only Cache Pattern"
subtitle: "Tách bạch rạch ròi: ~/.npm đi đường Cache chỉ đọc · dist/ gọn nhẹ đi đường Artifact!"
left:
  badge: "PHẢN MẪU · Chậm 4–6 phút & Lỗi quyền"
  title: "Đẩy node_modules vào Artifact & Ghi đè Cache bừa bãi"
  tone: rose
  code: |
    # SAI LẦM NGHIÊM TRỌNG: Nén 50.000 tệp nhỏ!
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

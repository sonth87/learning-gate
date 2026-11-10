# Tăng tốc Đường ống: Phân biệt Cache vs Artifact, Khóa băm Lockfile & Mô hình Cache Read-Only

Ở Level 0 và Level 1, bạn đã nắm vững sự thật cốt lõi của các máy ảo thực thi trên đám mây (**Ephemeral Runners**): mỗi Job trong GitHub Actions chạy trên một máy ảo Ubuntu mới tinh hoàn toàn sạch bóng dữ liệu, và bị xoá sổ vĩnh viễn ngay giây phút Job kết thúc!

Chính tính chất "dùng một lần rồi huỷ" đó đảm bảo môi trường kiểm thử luôn tinh khiết, nhưng cũng đặt ra hai bài toán thực tế rất tốn kém thời gian:
1. Chẳng lẽ mỗi lần có 4 Job chạy song song (`lint`, `typecheck`, `unit-test`, `build`), cả 4 máy ảo đều phải tải mới lại hàng trăm megabyte gói thư viện từ kho `registry.npmjs.org`?
2. Sau khi Job `build` mất 2 phút biên dịch TypeScript/Vite ra thư mục sản phẩm `dist/`, làm sao truyền nguyên vẹn thư mục `dist/` đó sang Job `deploy` mà không cần chạy lại lệnh `npm run build` lần thứ hai?

Để giải quyết đúng hai bài toán này mà không rơi vào những cái bẫy làm chậm đường ống gấp 3 lần, bạn bắt buộc phải phân biệt rạch ròi hai khái niệm tưởng giống nhau nhưng mục đích trái ngược hoàn toàn: **`Cache`** và **`Artifact`**!

---

## 1. Bảng đối chiếu cốt lõi: `Cache` vs `Artifact`

| Tiêu chí so sánh | **Cache (`actions/cache@v4`)** | **Artifact (`actions/upload-artifact@v4`)** |
| --- | --- | --- |
| **Bản chất & Mục đích** | Bộ nhớ đệm **tăng tốc tải lại các gói phụ thuộc trung gian** (như thư mục đệm `~/.npm`, `.pnpm-store`, bộ đệm biên dịch `.turbo`, `.next/cache`). | Sản phẩm đầu ra **bất biến của chính lượt chạy đó** (`dist/`, báo cáo lỗi Playwright HTML, báo cáo độ phủ Coverage, tệp kiểm kê bảo mật `sbom.json`). |
| **Cam kết tồn tại** | **Không đảm bảo 100% (Best-effort):** Nếu bị xoá do đầy dung lượng (vượt 10GB/repo) hoặc quá 7 ngày không dùng, lệnh `npm ci` vẫn tự tải lại từ Internet chạy tiếp bình thường! | **Bắt buộc chính xác 100%:** Job `deploy` phụ thuộc sống còn vào đúng bản `dist/` vừa được Job `build` tạo ra ở cùng Commit SHA này. |
| **Phạm vi chia sẻ** | Dùng xuyên suốt **giữa các lượt chạy Workflow khác nhau** (hôm qua lưu, hôm nay các PR khác đọc lại). | Truyền dữ liệu **giữa các Job trong CÙNG 1 lượt chạy Workflow**, hoặc để lập trình viên bấm nút tải ZIP về máy cá nhân soi lỗi. |
| **Vòng đời lưu trữ** | Tự động thu hồi khi không truy cập sau 7 ngày hoặc tràn hạn mức bộ nhớ đệm. | Cấu hình chủ động qua **`retention-days`** (ví dụ `7` ngày cho bản build nháp, `30–90` ngày cho hồ sơ kiểm toán SBOM). |

---

## 2. Cơ chế Khóa băm (`hashFiles`) và Lưới đỡ `restore-keys` của `actions/cache@v4`

Hãy liên hệ ngay với cách bạn làm việc trên máy cá nhân: khi nào bạn mới thực sự cần tải gói mới từ npm? Chỉ khi tệp khoá phiên bản **`package-lock.json`** thay đổi!

Action `actions/cache@v4` áp dụng chính xác tư duy đó thông qua hàm băm mật mã **`hashFiles('**/package-lock.json')`**:

```yaml
- name: Khôi phục bộ đệm tải gói npm
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

### Điều gì diễn ra đằng sau hậu trường?
1. **Trúng đích tuyệt đối (`Cache Hit`):** Nếu PR của bạn chỉ sửa code nghiệp vụ trong `src/orders.ts` mà không cài thêm thư viện nào, mã băm SHA-256 của `package-lock.json` giữ nguyên không đổi → GitHub giải nén `~/.npm` trong vài giây, giúp lệnh `npm ci` chạy nhanh gấp 3–4 lần mà không tốn băng thông mạng!
2. **Trượt khoá chính nhưng trúng lưới đỡ (`Partial Hit` qua `restore-keys`):** Giả sử hôm nay bạn cài thêm gói `zod` mới làm mã băm `package-lock.json` đổi khác. Nhờ dòng `restore-keys: ${{ runner.os }}-npm-`, GitHub tự động tìm bản bộ đệm `~/.npm` gần nhất trước đó có sẵn 99% các thư viện cũ, chỉ tải bổ sung đúng gói `zod` mới rồi đóng gói lưu thành khoá mới khi Job kết thúc!

*(Lưu ý thực tế với Node.js: Cách ngắn gọn nhất khi chỉ cần đệm npm tiêu chuẩn là bật thẳng thuộc tính tích hợp `cache: 'npm'` ngay trên `actions/setup-node@v4` — bên dưới nó cũng tự động gọi đúng cơ chế khoá `package-lock.json` và thư mục `~/.npm` cho bạn!)*

---

## 3. Cạm bẫy kinh điển: Đừng bao giờ đẩy `node_modules` vào `upload-artifact`!

Một lỗi sai mà rất nhiều dự án mắc phải là cố tình nén toàn bộ thư mục `node_modules` bằng `actions/upload-artifact` ở Job đầu tiên để các Job sau tải về dùng. Tại sao đây lại là **phản mẫu (Anti-pattern) thảm hoạ**?

- Thư mục `node_modules` của một dự án TypeScript trung bình chứa từ **35.000 đến 60.000 tệp nhỏ li ti** cùng hàng trăm liên kết mềm (`symlinks`) trong `node_modules/.bin/`.
- Hệ điều hành mất tới **4–6 phút** chỉ để quét đĩa, nén hàng chục ngàn tệp nhỏ thành gói lưu trữ rồi đẩy qua mạng, chưa kể khi giải nén bằng `download-artifact` rất dễ làm mất cờ thực thi (`chmod +x`) khiến lệnh `eslint` hay `tsc` báo lỗi `Permission denied`!
- **Quy tắc chuẩn mực:** Bộ đệm thư viện `~/.npm` đi đường **`cache`**; chỉ có thư mục biên dịch gọn nhẹ **`dist/`** (vài chục tệp JS/CSS đã đóng gói) mới đi đường **`upload-artifact` / `download-artifact` v4**!

---

## 4. Mô hình chuyên nghiệp năm 2026: **Read-Only Cache Pattern** (`actions/cache/restore@v4`)

Hãy tưởng tượng bạn có 4 Job chạy song song (`lint`, `typecheck`, `unit-test`, `build`). Nếu cả 4 Job cùng dùng `actions/cache@v4` đầy đủ, ở cuối mỗi Job cả 4 máy ảo sẽ đua nhau nén và ghi đè bộ đệm (tốn thời gian vô ích ở bước `Post Cache`), đồng thời nhánh Pull Request có thể làm "ô nhiễm" kho bộ đệm dùng chung của nhánh chính `main` (**Cache Poisoning**).

Giải pháp chuẩn mực của bộ công cụ `actions/cache` v4 là tách bạch quyền **Ghi** và **Chỉ Đọc**:
- Chỉ duy nhất Job chuẩn bị trên nhánh tin cậy `main` dùng `actions/cache@v4` (hoặc `actions/cache/save@v4`) để cập nhật bộ đệm chuẩn.
- Toàn bộ các Job kiểm tra chạy song song ở phía sau (`lint`, `typecheck`, `test`) và các nhánh Pull Request chỉ sử dụng **`actions/cache/restore@v4`** — tức là **chỉ kéo bộ đệm về đọc để tăng tốc**, tuyệt đối không tốn một giây nào nén ghi ngược lên cuối Job!

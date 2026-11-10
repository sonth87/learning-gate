# Biến môi trường, `$GITHUB_OUTPUT`, Điều kiện `if` & Bộ lọc đường dẫn

Một file workflow tĩnh chỉ chạy từ đầu tới cuối giống như một hàm JavaScript không có tham số, không có `return` và không có `if/else`. Để biến đường ống CI thành một cỗ máy điều phối linh hoạt — biết truyền mã phiên bản từ bước đóng gói sang bước phát hành, biết chỉ tải nhật ký khám nghiệm khi bài test gặp sự cố, và biết "ngủ yên" tiết kiệm tiền khi đồng nghiệp chỉ sửa một dấu chấm câu trong `README.md` — bạn cần làm chủ 4 công cụ điều khiển luồng của GitHub Actions.

---

## 1. Phân cấp 3 tầng Biến môi trường (`env`) — Phạm vi hẹp thắng phạm vi rộng

Tương tự quy tắc Lexical Scope trong JavaScript (biến cục bộ bên trong hàm che khuất biến toàn cục bên ngoài), GitHub Actions cho phép khai báo khối `env:` ở **3 tầng phân cấp**:

| Tầng khai báo | Vị trí trong file YAML | Phạm vi hiệu lực | Độ ưu tiên khi trùng tên |
| :--- | :--- | :--- | :--- |
| **1. Workflow `env`** | Ngay gốc file (ngang hàng `on`, `jobs`) | Mọi Job và mọi Step trong toàn bộ file | Thấp nhất (mặc định chung) |
| **2. Job `env`** | Bên trong `jobs.<job_id>.env` | Mọi Step thuộc riêng Job đó | Trung bình (ghi đè tầng Workflow) |
| **3. Step `env`** | Bên trong `steps[i].env` | Duy nhất tiến trình của Step đó | **Cao nhất** (ghi đè cả Job & Workflow) |

Ví dụ: bạn đặt `NODE_ENV: "test"` ở cấp Workflow cho toàn bộ đường ống, nhưng riêng ở bước chạy kiểm thử tích hợp cần trỏ tới máy chủ cục bộ thì gắn thêm `API_URL: "http://localhost:3000"` ngay tại Step đó. Trong khối `run:`, Bash đọc biến qua cú pháp `$API_URL`, còn ở các trường cấu hình YAML khác (như `if:`, `with:`) bạn đọc qua biểu thức `${{ env.API_URL }}`.

---

## 2. Truyền dữ liệu giữa các Step bằng file môi trường `"$GITHUB_OUTPUT"`

Trong JavaScript, hàm A trả kết quả bằng `return sha` để hàm B hứng lấy. Trong CI, mỗi Step là một tiến trình subshell riêng nên `export SHA=abc` ở Step 1 sẽ biến mất sạch khi sang Step 2!

> **Cảnh báo di sản bảo mật**: Trước năm 2023, nhiều tài liệu cũ dùng lệnh in ra stdout `echo "::set-output name=sha::abc"`. GitHub đã **khai tử hoàn toàn `::set-output`** vì lỗ hổng Command Injection (nếu dữ liệu in ra chứa ký tự xuống dòng từ PR không tin cậy, kẻ tấn công có thể giả mạo lệnh hệ thống).

Chuẩn bắt buộc năm 2026 là ghi cặp `key=value` nối thêm (`>>`) vào đường dẫn file tạm do Runner cấp phát trong biến `"$GITHUB_OUTPUT"`, đồng thời đặt định danh `id:` cho Step phát dữ liệu:

```yaml
steps:
  - name: Compute short commit SHA
    id: meta
    run: echo "sha=${GITHUB_SHA::7}" >> "$GITHUB_OUTPUT"

  - name: Print Docker tag
    run: echo "Image tag will be app:${{ steps.meta.outputs.sha }}"
```

Tương tự, nếu muốn thêm một biến môi trường động cho các Step đứng sau trong cùng Job, bạn ghi `echo "KEY=VALUE" >> "$GITHUB_ENV"`.

---

## 3. Biểu thức điều kiện `if:` và 4 hàm kiểm tra trạng thái sống còn

Mặc định mọi Step mang điều kiện ngầm `if: success()` — tức chỉ chạy khi **tất cả** các Step phía trước đều xanh (`Exit Code 0`). Nhưng có hai kịch bản thực tế đòi hỏi bạn phải viết tường minh `if:`:

1. **Chốt chặn phát hành theo ngữ cảnh sự kiện**: Cùng một Job kiểm định chạy cho cả PR lẫn nhánh chính, nhưng bước nhạy cảm `Publish Package` chỉ được phép nổ súng khi code thực sự được `push` lên đúng nhánh `main`:
   ```yaml
   if: github.ref == 'refs/heads/main' && github.event_name == 'push'
   ```
2. **Hàm trạng thái đặc biệt (`failure()`, `always()`, `cancelled()`)**: Khi bài test tích hợp hoặc Playwright E2E bị đỏ, cơ chế Fail-Fast mặc định sẽ bỏ qua toàn bộ các bước đứng sau — đồng nghĩa bạn mất trắng ảnh chụp màn hình và file `npm-debug.log` để tìm nguyên nhân! Gắn `if: failure()` vào bước `actions/upload-artifact@v4` giúp bước thu gom tang vật **chỉ kích hoạt khi có lỗi xảy ra phía trên**.

---

## 4. Bộ lọc đường dẫn (`paths` / `paths-ignore`) & Chống vòng lặp Push vô tận

Đừng đốt quỹ phút CI quý giá cho những thay đổi vô hại đối với mã nguồn thực thi:
- **`paths-ignore`** (`**.md`, `docs/**`): Bỏ qua không kích hoạt workflow nếu commit chỉ toàn sửa tài liệu Markdown.
- **`paths`** (`apps/api/**`, `packages/shared/**`): Trong kho nhiều dịch vụ, chỉ kích hoạt kiểm thử API khi thực sự có file bên trong `apps/api/` bị chạm tới.

Cuối cùng, hãy cảnh giác cao độ với **Infinite Push Loop (Vòng lặp tự kích hoạt vô tận)**: nếu một Job lắng nghe `on: push` lại tự động cập nhật `CHANGELOG.md` rồi chạy `git push` bằng Personal Access Token (PAT), cú push của bot sẽ đẻ ra sự kiện `push` mới kích hoạt lại chính workflow đó hàng nghìn lần không điểm dừng! Để khoá chốt an toàn, hãy luôn kết hợp **3 lớp bảo vệ**: (1) ưu tiên dùng `GITHUB_TOKEN` mặc định (vốn không kích hoạt dây chuyền workflow mới), (2) chèn hậu tố `[skip ci]` vào commit message của bot, và (3) thêm điều kiện lọc `paths-ignore` hoặc `if: github.actor != 'release-bot'`.

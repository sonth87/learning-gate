# Từ npm scripts sang Đường ống tự động: Exit Code & Fail-Fast

Khi lập trình Node.js hằng ngày, bạn đã quen gõ `npm run lint`, `npm test`, `npm run build` trong mục `"scripts"` của `package.json`. Một đường ống **CI/CD (Continuous Integration / Continuous Delivery)** không phải phép thuật cao siêu — nó chính là một máy chủ sạch sẽ tự động gõ các lệnh đó thay bạn mỗi khi có commit mới, nhưng dựa trên một quy tắc sắt đá: **Mã thoát (Exit Code)**.

## 1. Máy chủ CI phân biệt "Xanh" hay "Đỏ" bằng cách nào?

Máy chủ CI **không đọc hiểu tiếng Anh** trên màn hình console. Dù ứng dụng của bạn in ra dòng chữ `ERROR: Database failed!` to tướng nhưng kết thúc bằng `process.exit(0)`, CI vẫn báo **Xanh (Pass)**!

- **Exit Code `0`**: Thành công mỹ mãn → chuyển sang bước kế tiếp.
- **Exit Code khác `0` (`1..255`)**: Thất bại → dừng ngay lập tức (**Fail-Fast**) và chặn không cho gộp Pull Request hay deploy code hỏng lên Production.

| Mã thoát thường gặp | Ý nghĩa thực tế trên Runner CI |
| --- | --- |
| `0` | Lệnh chạy thành công |
| `1` | Lỗi chung (unit test sai, lỗi biên dịch TypeScript, `eslint` bắt lỗi) |
| `127` | Không tìm thấy lệnh (quên cài công cụ hoặc gõ sai tên binary) |
| `137` | Tiến trình bị hệ điều hành giết cứng (`SIGKILL` = `128 + 9`), phổ biến nhất là tràn RAM (**OOMKilled**) |

## 2. CI vs Continuous Delivery vs Continuous Deployment

- **Continuous Integration (CI)**: Gộp code thường xuyên, tự động chạy lint + test + build để phát hiện lỗi sớm trong vài phút.
- **Continuous Delivery**: Sau khi qua CI, tạo sẵn bản đóng gói (Artifact / Container Image) sẵn sàng lên Production bất cứ lúc nào, nhưng bước bấm nút phát hành cuối cùng có cổng duyệt thủ công (**Manual Approval**).
- **Continuous Deployment**: Hoàn toàn tự động từ lúc gộp vào `main` cho tới khi bản mới phục vụ người dùng thật mà không cần con người bấm duyệt.

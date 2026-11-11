# Từ `npm scripts` đến CI Gate: Sức mạnh của Exit Code

Nếu bạn đã quen gõ `npm run lint && npm test && npm run build` trên laptop trước khi tạo Pull Request, xin chúc mừng: bạn đã hiểu **80% bản chất của Continuous Integration (CI)**. Một hệ thống CI/CD hiện đại như GitHub Actions hay GitLab CI không hề có phép thuật đọc hiểu mã nguồn của bạn đúng hay sai bằng mắt thường. Thứ duy nhất giúp đường ống quyết định **cho phép merge (dấu tích xanh)** hay **chặn đứng Pull Request (dấu chéo đỏ)** là một con số nguyên nhỏ bé do hệ điều hành trả về sau mỗi tiến trình: **Exit Code** (mã thoát).

---

## 1. Ánh xạ tư duy: Từ `package.json` trên Laptop lên CI Gate

Trên máy cá nhân, bạn định nghĩa các câu lệnh kiểm tra chất lượng trong `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build": "tsc -p tsconfig.build.json"
  }
}
```

Vấn đề của việc chạy thủ công trên laptop là **yếu tố con người**: thứ Sáu cuối tuần vội về, đồng nghiệp quên chạy `npm test`, hoặc máy cá nhân đang sẵn `node_modules` cũ nên code vẫn chạy êm dù `package.json` thiếu gói. **CI Gate** giải quyết triệt để bằng cách thuê một máy ảo Linux sạch tinh đứng gác ngay trước nhánh `main`: bất kỳ ai mở Pull Request, máy gác cổng tự động chạy lại đúng chuỗi lệnh đó.

Trong chuẩn POSIX (Linux/macOS) và Node.js (`process.exit(code)`):
- **`Exit Code = 0`**: Tiến trình hoàn tất **thành công**. Đường ống bật đèn xanh và chuyển sang bước tiếp theo.
- **`Exit Code != 0` (`1`..`255`)**: Tiến trình **thất bại**. Đường ống lập tức dừng khẩn cấp (**Fail-Fast**) và chặn nút Merge.

| Mã thoát (`Exit Code`) | Ý nghĩa trong Linux & Node.js | Ví dụ thực tế trên CI Runner |
| :--- | :--- | :--- |
| `0` | Thành công hoàn toàn (`EXIT_SUCCESS`) | `eslint`, `vitest run`, `tsc` không phát hiện lỗi nào |
| `1` | Lỗi ứng dụng chung (`process.exit(1)`) | 1 bài Unit Test bị sai assert hoặc lỗi cú pháp TypeScript |
| `22` | `curl --fail` gặp HTTP `4xx` / `5xx` | Smoke test gọi `/healthz` nhưng API trả về `500 Internal Server Error` |
| `127` | Command not found | Gõ nhầm lệnh hoặc gọi `vitest` khi chưa chạy `npm ci` |
| `137` | `128 + 9` (`SIGKILL` / OOM Killer) | Node.js hoặc Jest worker ngốn lố RAM của Runner bị Linux Kernel tiêu diệt |
| `143` | `128 + 15` (`SIGTERM`) | Job bị huỷ chủ động do quá `timeout-minutes` hoặc Concurrency huỷ bản cũ |

---

## 2. Hiểm hoạ "Xanh vỏ đỏ lòng" (False-Green Pipeline)

Một đường ống bị đỏ còn dễ sửa; đáng sợ nhất trong nghề DevOps là **False-Green Pipeline** — ứng dụng đang lỗi nát bét nhưng Pull Request vẫn hiện dấu tích xanh mượt mà! Có 4 thủ phạm kinh điển gây ra hiện tượng nuốt mất `Exit Code` này:

### Thủ phạm 1: `curl` mặc định không coi HTTP 500 là lỗi!
Công cụ `curl` chỉ quan tâm tầng mạng TCP/TLS có lấy được phản hồi về hay không. Nếu server Node.js của bạn sập DB và trả về trang JSON lỗi `HTTP 500`, `curl http://localhost:3000/health` vẫn in nội dung lỗi ra màn hình rồi trả về **`Exit Code = 0`**!
- **Cách khắc phục bắt buộc**: Luôn gắn cờ `--fail` (hoặc `-f`, nâng cao hơn là `--fail-with-body`) để `curl` trả mã thoát `22` ngay khi gặp HTTP `>= 400`.

### Thủ phạm 2: Bùa hại người `|| true` và `continue-on-error: true`
Nhiều lập trình viên thấy bước `npm test` thỉnh thoảng đỏ nên thêm `npm test || true` hoặc gắn `continue-on-error: true` vào Step để "tạm cho qua". Trong Bash, toán tử `A || B` sẽ chạy `B` nếu `A` thất bại; vì lệnh `true` luôn trả về `0`, toàn bộ mã lỗi của `npm test` bị xoá sạch dấu vết! Chỉ dùng `continue-on-error` cho các bước thử nghiệm không bắt buộc (experimental), **tuyệt đối cấm** đặt trên cổng `lint`, `typecheck`, `test` hay `build`.

### Thủ phạm 3: Kịch bản nhiều dòng và đường ống dấu gạch đứng `|`
Trong GitHub Actions, mỗi khối `run: |` thực chất được chạy bằng `bash -eo pipefail {0}`. Tuy nhiên, nếu bạn tách script ra file `.sh` riêng hoặc gọi shell tuỳ chỉnh mà quên bật đủ bộ tứ bảo vệ:

```bash
set -euo pipefail
```

- `-e` (`errexit`): Dừng ngay lập tức khi có bất kỳ lệnh nào trả về `Exit Code != 0` (không chạy cố xuống dòng `echo "Done"` bên dưới).
- `-u` (`nounset`): Báo lỗi ngay nếu tham chiếu biến môi trường chưa khai báo (tránh tai nạn `rm -rf /$EMPTY_VAR`).
- `-o pipefail`: Khi nối ống `npm test | tee test.log`, mặc định Bash chỉ lấy mã thoát của lệnh cuối cùng (`tee` — luôn bằng `0`!). Có `pipefail`, chỉ cần `npm test` ở đầu ống trả `1`, cả dòng lệnh sẽ trả `1`.

---

## 3. `npm ci` vs `npm install`: Kỷ luật bất biến trên CI

Trên laptop khi thêm thư viện mới, bạn gõ `npm install`. Nhưng trên đường ống CI, `npm install` là một phản mẫu nguy hiểm vì nó được phép **tự ý cập nhật `package-lock.json`** nếu dải semver `^1.2.0` có bản vá mới vừa phát hành 5 phút trước.

Ngược lại, **`npm ci` (Clean Install)** sinh ra dành riêng cho tự động hoá:
1. Xoá sạch thư mục `node_modules` hiện có để đảm bảo môi trường tinh khiết.
2. Đọc cứng từng phiên bản và mã băm `integrity` trong `package-lock.json`.
3. Nếu ai đó sửa `package.json` mà quên cập nhật `package-lock.json`, `npm ci` lập tức **ném lỗi `Exit Code = 1`** thay vì âm thầm đoán mò.

---

## 4. Phân biệt rạch ròi: CI vs Continuous Delivery vs Continuous Deployment

Ba khái niệm viết tắt thành "CI/CD" thực chất là 3 cấp độ trưởng thành khác nhau của đường ống:

1. **Continuous Integration (CI — Tích hợp liên tục)**: Tự động `npm ci` -> `lint` -> `test` -> `build` trên mỗi lần push/PR vào nhánh chính để phát hiện xung đột sớm từng giờ.
2. **Continuous Delivery (Chuyển giao liên tục)**: Tự động hoá toàn bộ việc đóng gói Artifact/Docker Image và triển khai lên môi trường `staging`, sẵn sàng lên `production` bất cứ lúc nào nhưng **có một cổng phê duyệt thủ công (Manual Approval Gate)** — ví dụ dùng `environment: production` trên GitHub để Tech Lead bấm nút duyệt.
3. **Continuous Deployment (Triển khai liên tục)**: Không còn bước con người bấm nút nào nữa; mọi commit vượt qua toàn bộ cổng kiểm thử tự động trên nhánh `main` sẽ **đi thẳng một mạch ra Production** phục vụ khách hàng thật trong vài phút.

Nắm vững `Exit Code`, `set -euo pipefail`, `npm ci` và ranh giới giữa Delivery với Deployment chính là viên gạch nền móng đầu tiên trước khi bạn viết những dòng YAML phức tạp hơn.

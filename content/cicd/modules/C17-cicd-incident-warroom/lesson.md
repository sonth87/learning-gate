# Phòng Chiến Sự CI/CD (Incident War Room) — 4 Hồ sơ Thực chiến

Chúc mừng bạn đã đi tới chặng cuối cùng của hành trình **CI/CD Mastery**! Kiến thức lý thuyết về YAML chỉ thực sự trở thành bản năng của một Senior DevOps / Platform Engineer khi bạn đứng trước một đường ống đang bốc cháy: đội sản phẩm xếp hàng chờ 45 phút chưa merge nổi một bản vá khẩn cấp, hai đợt deploy đè lên nhau làm sập Production, hệ thống quét phát hiện API Key nằm chình ình trong file workflow, hay đáng sợ nhất — toàn bộ dấu tích CI đều màu xanh mướt nhưng khách hàng đang nhận trang trắng lỗi 500!

Trong bài tổng kết **Incident War Room** này, chúng ta sẽ mổ xẻ nguyên nhân gốc rễ (Root Cause Analysis) và trực tiếp vá nóng 4 hồ sơ sự cố kinh điển nhất ngoài đời thực.

---

## Hồ sơ B1: Đường ống "Rùa bò" 42 phút — Giải phẫu Nút thắt Cổ chai (Critical Path)

**Triệu chứng thực tế**: Mỗi lần lập trình viên đẩy 1 commit sửa lỗi chính tả trên PR, cả đội phải ngồi chờ **42 phút**. Chi phí phút chạy GitHub Actions tăng vọt gấp 4 lần dự toán.

**Giải phẫu nguyên nhân trong file YAML lỗi**:
1. **Dùng `npm install` không có Cache**: Runner tạm thời (ephemeral) tải lại từ mạng 1.200 gói vào `node_modules` mất 4 phút mỗi job, lại còn có nguy cơ trôi phiên bản so với `package-lock.json`.
2. **Xâu chuỗi tuần tự vô lý**: Chạy nối đuôi `lint` $\rightarrow$ `typecheck` $\rightarrow$ toàn bộ 400 bài test trên 1 máy duy nhất thay vì tách thành các job song song và chia mảnh `strategy.matrix.shard: [1, 2, 3, 4]`.
3. **Ngủ đông cảm tính `sleep 45`** để chờ server khởi động và bỏ quên `timeout-minutes` khiến job treo bị kẹt suốt 360 phút mặc định!

**Phác đồ khắc phục chuẩn**:
- Bật `actions/setup-node@v4` với `cache: "npm"` và thay hoàn toàn `npm install` bằng `npm ci`.
- Tách `lint` chạy song song độc lập với job `test` được chia 4 mảnh (`shard: [1, 2, 3, 4]`).
- Loại bỏ `sleep 45` (thay bằng vòng lặp kiểm tra cổng sẵn sàng nếu cần) và đặt `timeout-minutes` chặt chẽ (ví dụ `10`–`15` phút). Thời gian phản hồi tổng thể lập tức giảm từ **42 phút xuống dưới 5 phút**!

---

## Hồ sơ B2: Cuộc đua Sinh tử trên Production (Deployment Race Condition)

**Triệu chứng thực tế**: Lúc 14:02, Commit `A` (nâng cấp dịch vụ thanh toán) được merge vào `main` và bắt đầu chạy script cập nhật hạ tầng. Lúc 14:03, Commit `B` (sửa README) được merge nối đuôi. Bất ngờ hệ thống báo lỗi không nhất quán, một nửa cụm chạy cấu hình dở dang và khoá trạng thái (state lock) bị hỏng!

**Giải phẫu nguyên nhân**: Ai đó đã copy-paste nguyên xi khối `concurrency` của nhánh PR sang job `deploy-production` với cờ **`cancel-in-progress: true`**.

| Ngữ cảnh chạy | Cấu hình `cancel-in-progress` đúng | Lý do kỹ thuật |
| :--- | :--- | :--- |
| **Kiểm thử trên PR (`pull_request`)** | `true` (Group theo số PR) | Commit cũ trên nhánh nháp đã lỗi thời, huỷ ngay để tiết kiệm tài nguyên. |
| **Triển khai Production (`deploy-production`)** | **`false`** (Group cố định `production-deploy`) | Rút phích cắm giữa chừng khi đang cập nhật Cloud/Terraform/Helm sẽ làm hỏng trạng thái hạ tầng! Đặt `false` ép bản mới **xếp hàng (pending)** đợi bản đang chạy hoàn tất trọn vẹn. |

Kết hợp `environment: production` và `concurrency: { group: "production-deploy", cancel-in-progress: false }`, mọi đợt phát hành luôn diễn ra tuần tự, trật tự và an toàn tuyệt đối.

---

## Hồ sơ B3: Rò rỉ Khóa Bí mật Cứng (Hardcoded Secret Leak) trong YAML

**Triệu chứng thực tế**: Một kỹ sư mới vào nghề vì muốn chạy thử tích hợp thanh toán cho nhanh đã viết thẳng `STRIPE_API_KEY: "sk_test_..."` ngay trong khối `env:` của file `.github/workflows/ci.yml` rồi đẩy lên kho Git.

**Quy trình ứng cứu chuẩn DevSecOps gồm 2 vế bắt buộc**:
1. **Khắc phục ngay trong cấu hình**: Thu hồi (Revoke/Rotate) khoá bị lộ trên trang quản trị dịch vụ bên thứ ba (vì nó đã lưu trong lịch sử Git!), đồng thời thay giá trị cứng trong YAML bằng tham chiếu biến bí mật `${{ secrets.STRIPE_API_KEY }}`.
2. **Dựng chốt chặn phòng ngừa tái phát (Preventive Gate)**: Bổ sung bước quét lịch sử commit bằng **Gitleaks** (`gitleaks detect --source . --verbose`) kèm `fetch-depth: 0` trên `actions/checkout@v4` ngay đầu pipeline để không một khoá nhạy cảm nào có thể lọt lưới lần thứ hai.

---

## Hồ sơ B6: Thảm hoạ "Xanh vỏ đỏ lòng" (Silent False-Green Pipeline)

**Triệu chứng thực tế**: Một bản code chứa lỗi biên dịch và 14 bài Unit Test thất bại vẫn hiển thị **dấu tích xanh lá cây** rực rỡ trên PR, tự tin đi thẳng lên Production và gây sập luồng đặt hàng!

**Ba thủ phạm "nuốt mã thoát" (`Exit Code != 0` bị biến thành `0`) cần truy quét tận gốc**:
1. **`continue-on-error: true`** đặt bừa bãi trên các job/step kiểm định trọng yếu như `unit-test` hoặc `trivy-scan` ("tạm tắt cho qua PR gấp rồi quên mở lại suốt 6 tháng").
2. **Toán tử shell `|| true`** nối đuôi sau câu lệnh kiểm thử (`npm test || true`), khiến dù Jest/Vitest trả về exit code `1`, biểu thức OR với `true` vẫn trả về exit code `0` cho GitHub Actions!
3. **Gọi `curl` thiếu cờ `--fail`**: `curl https://api.shop.example.com/healthz` nhận phản hồi `HTTP/1.1 500 Internal Server Error` từ ứng dụng đang hấp hối nhưng vẫn hân hoan báo exit code `0` nếu không có `--fail`!

Trong bốn bài thực hành `troubleshoot` ngay sau đây, bạn sẽ trực tiếp tiếp nhận từng file workflow sự cố tại hiện trường và vá sạch mọi lỗ hổng để hoàn tất chứng nhận **CI/CD Mastery**!

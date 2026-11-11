# Chiến lược nhánh Git & 5 thủ phạm "Chạy được trên máy em nhưng đỏ trên CI"

Câu nói kinh điển nhất trong mọi phòng họp kỹ thuật là: *"Ủa lạ vậy anh, trên MacBook của em vừa chạy `npm test` xanh mượt mà sao đẩy lên Pull Request nó lại treo rồi đỏ lòm?!"*. Để đường ống CI thực sự trở thành tấm khiên bảo vệ đội ngũ thay vì nỗi ám ảnh mỗi chiều thứ Sáu, bạn cần kết hợp hai mảnh ghép: **chiến lược phân nhánh Git gọn nhẹ (Trunk-Based Development)** và **kỷ luật đồng bộ môi trường giữa Laptop với CI Runner**.

---

## 1. Trunk-Based Development vs GitFlow cổ điển: Vì sao CI yêu nhánh ngắn hạn?

Mười năm trước, nhiều công ty dùng **GitFlow** với hàng loạt nhánh sống dai dẳng hàng tháng trời (`develop`, `release/*`, `hotfix/*`, `feature/*`). Khi 5 lập trình viên cùng tách nhánh suốt 3 tuần mới gộp lại, họ rơi vào **Merge Hell (Địa ngục xung đột)**: code trên nhánh riêng thì xanh, nhưng vừa trộn vào nhau là vỡ tung kiến trúc.

Chữ **CI (Continuous Integration — Tích hợp liên tục)** theo đúng nghĩa gốc là **gộp code vào nhánh thân chính (`main` / trunk) ít nhất mỗi ngày một lần** thông qua các nhánh tính năng cực ngắn hạn (`short-lived feature branches`, chỉ sống từ vài giờ đến tối đa 1–2 ngày):

```bash
git switch -c feat/healthz          # 1. Tách nhánh ngắn từ main mới nhất
git add .                           # 2. Đưa thay đổi nhỏ gọn vào vùng staging
git commit -m "feat: add healthz"   # 3. Commit theo chuẩn Conventional Commits
# -> Mở Pull Request, cổng CI tự động kiểm định trong 3 phút
git switch main && git merge feat/healthz
git tag v1.0.0                      # 4. Đánh dấu mốc phát hành bất biến bằng Git Tag
```

Tính năng lớn chưa làm xong trong 1 ngày thì sao? Ta ẩn nó sau **Feature Flag** (`if (flags.enableNewCheckout)`) để code vẫn được tích hợp và kiểm thử liên tục trên `main` mà không ảnh hưởng người dùng thật.

---

## 2. Truy lùng 5 thủ phạm khiến "Máy em chạy ngon nhưng lên CI bị đỏ"

Mỗi khi gặp sự cố lệch pha giữa máy cá nhân (macOS/Windows, 16–32 GB RAM, múi giờ `Asia/Ho_Chi_Minh`) và GitHub-hosted Runner (`ubuntu-latest` Linux, **2 vCPU**, **7 GB RAM**, không màn hình đồ hoạ), hãy rà soát đúng bảng 5 thủ phạm sau:

| # | Thủ phạm gây lệch (Drift) | Biểu hiện lỗi trên CI | Cách khoá chặt dứt điểm |
| :--- | :--- | :--- | :--- |
| **1** | **Trôi phiên bản Node & npm** | Máy dev chạy Node 22.14, CI kéo `node-version: latest` trúng Node 24 làm gãy native addon | Ghim cứng `node-version: "22"` (hoặc đọc từ `.nvmrc` qua `node-version-file`) + dùng `npm ci` |
| **2** | **Chế độ Watch / Interactive treo cứng** | Step `Run tests` quay vòng tròn suốt 6 tiếng tới khi hết sạch quỹ phút CI | Đặt `env: CI: true` và gọi tường minh `npx vitest run` (thay vì `npx vitest`) |
| **3** | **Phân biệt hoa thường trên Linux (`Case-Sensitivity`)** | Laptop macOS/Windows import `./UserCard` cho file `userCard.tsx` vẫn chạy, lên Ubuntu báo `Cannot find module` | Bật `"forceConsistentCasingInFileNames": true` trong `tsconfig.json` |
| **4** | **Lệch múi giờ (`Timezone`) & Locale** | Laptop GMT+7 format ra `"11/04/2026"`, lên Runner giờ hệ thống khác làm vỡ Snapshot Test | Ghim cứng `env: TZ: "UTC"` cho toàn bộ Job kiểm thử |
| **5** | **Tràn RAM Worker (`Exit Code 137`)** | Laptop 10 nhân 32GB đẻ 8 Jest/Vitest worker chạy vèo vèo; lên Runner 2 vCPU / 7GB RAM bị OOM Killer giết | Giới hạn `--maxWorkers=2` và cấp trần Heap V8 `NODE_OPTIONS: "--max-old-space-size=4096"` |

---

## 3. Phân tích sâu Thủ phạm #2 & #5 cho lập trình viên Node.js

### Vì sao `npx vitest` làm treo đường ống suốt 360 phút?
Trên laptop, khi bạn gõ `npx vitest` (hoặc `jest --watch`), công cụ thấy môi trường phát triển nên tự bật **Watch Mode**: chạy xong test nó không thoát tiến trình mà đứng chờ bạn sửa file hoặc bấm phím `q` để thoát. Trên CI Runner không hề có bàn phím hay người ngồi gõ `q`! Nếu ai đó vô tình đặt `CI: false` hoặc dùng công cụ CLI tự hỏi *"Do you want to install package X? [Y/n]"*, tiến trình sẽ ngồi đợi vô vọng cho tới khi chạm trần mặc định 6 tiếng của GitHub.
- Giải pháp kép: Luôn truyền `CI: true` trong `env:` (hầu hết thư viện hệ sinh thái JS như Vitest, Jest, Playwright tự động tắt Watch Mode và tắt progress bar màu mè khi thấy `process.env.CI === "true"`) VÀ viết rõ lệnh một lần `npx vitest run`.

### Vì sao Jest / Vitest hay nổ `Exit Code 137` trên Runner tiêu chuẩn?
Khi chạy bộ test lớn có biên dịch TypeScript (`ts-jest` / Vite transform), một số phiên bản công cụ đọc nhầm số nhân CPU vật lý của máy chủ ảo hoá (có thể báo 16–32 core của host mẹ!) rồi hăng hái đẻ ra 15 tiến trình con (`child_process` / `worker_threads`). Mỗi worker Node.js ăn 600 MB RAM -> 15 worker ngốn 9 GB RAM, vượt quá giới hạn **7 GB RAM** của `ubuntu-latest`! Ngay lập tức Linux Kernel kích hoạt **OOM Killer** bắn tín hiệu `SIGKILL` (`Exit Code 137`).

```yaml
- name: Run test suite within 2-vCPU runner budget
  env:
    CI: true
    TZ: UTC
    NODE_OPTIONS: "--max-old-space-size=4096"
  run: npx jest --ci --maxWorkers=2
```

Chỉ với 3 biến môi trường chuẩn hoá (`CI: true`, `TZ: UTC`, `NODE_OPTIONS`) và giới hạn `--maxWorkers=2`, đường ống của bạn sẽ ổn định như bàn thạch, chấm dứt vĩnh viễn cảnh "máy em xanh mà CI đỏ".

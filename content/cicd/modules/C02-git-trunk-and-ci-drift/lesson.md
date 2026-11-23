# Chiến lược nhánh Git và 5 nguyên nhân gây lệch môi trường Local với CI

Một tình huống thường gặp trong phát triển phần mềm là mã nguồn chạy kiểm thử thành công trên máy cá nhân nhưng lại thất bại hoặc bị treo khi đẩy lên Pull Request. Để CI Pipeline hoạt động ổn định và tin cậy, đội ngũ kỹ thuật cần kết hợp hai yếu tố: ==chiến lược phân nhánh ngắn hạn (Trunk-Based Development)== và ==đồng bộ hóa môi trường giữa máy cá nhân với CI Runner==.

```visual
kind: illustration
diagram: "cicd:c02"
src: "/illustrations/cicd/cicd-trunk-vs-gitflow.jpg"
alt: "Đối chiếu xung đột nhánh dài hạn GitFlow với Trunk-Based Development nhánh ngắn hạn và hàng đợi Merge Queue chống xung đột ngữ nghĩa"
title: "Chiến lược nhánh: GitFlow nhánh dài hạn vs Trunk-Based & Merge Queue"
subtitle: "Gộp nhánh nhỏ hàng ngày kết hợp Feature Flags và hàng đợi kiểm thử gộp để giữ nhánh main luôn sẵn sàng phát hành"
caption: "Sự khác biệt giữa nhánh dài hạn nhiều tuần dễ phát sinh xung đột, mô hình Trunk-Based PR ngắn dưới 24 giờ và lớp kiểm định Merge Queue"
callouts:
  - num: 1
    label: "Nhánh dài hạn dễ gây xung đột lớn (Merge Hell)"
    desc: "Tách nhánh suốt nhiều tuần khiến mã nguồn lệch xa nhánh chính, dù test đạt trên nhánh lẻ nhưng dễ lỗi khi gộp chung."
    tone: rose
  - num: 2
    label: "Trunk-Based PR ngắn hạn & Đồng bộ môi trường"
    desc: "Gộp các PR nhỏ mỗi ngày kết hợp Feature Flags, khoá phiên bản .nvmrc, múi giờ UTC và kiểm tra chữ hoa/thường tên tệp Linux."
    tone: emerald
  - num: 3
    label: "Merge Queue phòng tránh xung đột ngữ nghĩa chéo"
    desc: "Tự động tạo nhánh gộp tạm thời để chạy kiểm thử tổ hợp PR #101 + PR #102 cùng nhau trước khi cho phép gộp vào nhánh main."
    tone: sky
```

## 1. So sánh Trunk-Based Development và GitFlow: Lợi ích của nhánh ngắn hạn trong CI

```visual
kind: compare
title: "So sánh GitFlow nhánh dài hạn và Trunk-Based Development hiện đại"
subtitle: "Nguyên tắc của Continuous Integration là tích hợp code vào nhánh chính thường xuyên, lý tưởng nhất là mỗi ngày một lần"
left:
  badge: "CỔ ĐIỂN · GitFlow Dài Hạn"
  title: "Nhánh kéo dài nhiều tuần dễ gây xung đột khi gộp code"
  tone: rose
  code: |
    main ───────────────────────────────────● (Release quý)
      \                                    /
       develop ───●───────────●───────────● (Merge Hell!)
                   \         /
        feature/a ──●───●───● (Tách riêng 3 tuần)
  lang: text
  bullets:
    - "Nhiều lập trình viên làm việc trên các nhánh `feature/*` tách rời suốt 3–4 tuần mới gộp lại"
    - "Trên nhánh riêng thì CI báo đạt, nhưng khi hợp nhất lại thường phát sinh xung đột phức tạp (**Merge Hell**)"
    - "Pull Request dài hàng nghìn dòng khiến việc rà soát (code review) kém hiệu quả"
right:
  badge: "CHUẨN CI/CD · Trunk-Based Development"
  title: "Nhánh cực ngắn hạn + Feature Flags an toàn"
  tone: emerald
  code: |
    git switch -c feat/healthz          # 1. Tách nhánh ngắn từ main
    git add .
    git commit -m "feat: add healthz"   # 2. Conventional Commits nhỏ gọn
    # -> Mở PR, cổng CI kiểm định trong 3 phút -> Merge ngay trong ngày!
    git switch main && git merge feat/healthz
    git tag v1.0.0                      # 3. Đánh dấu mốc phát hành bất biến
  lang: bash
  bullets:
    - "Nhánh tính năng (`short-lived feature branches`) chỉ sống **vài giờ đến tối đa 1–2 ngày**"
    - "PR nhỏ gọn (100–300 dòng), CI chạy siêu nhanh và dễ truy vết lỗi"
    - "Tính năng lớn cần 2 tuần? Ẩn sau **Feature Flag** (`if (flags.enableNewCheckout)`) để vẫn merge code nhỏ hàng ngày vào `main` mà chưa lộ ra người dùng thật!"
```

```visual
kind: flow
title: "Vòng Khép Kín Tích Hợp Liên Tục Hàng Ngày Với Trunk-Based & Feature Flags"
steps:
  - icon: git-branch
    badge: "Sáng · Tách nhánh"
    title: "Short-Lived Branch"
    desc: "Tách nhánh nhỏ từ main mới nhất cho 1 lát cắt công việc rõ ràng"
    code: "feat/payment-qr"
    tone: sky
    edge: "commit nhỏ"
  - icon: shield-check
    badge: "Giữa ngày · Kiểm định"
    title: "PR & CI Gate Tự Động"
    desc: "Chạy lint, typecheck, unit test trên máy ảo sạch trong 3–5 phút"
    code: "Exit Code == 0"
    tone: cyan
    edge: "review nhanh"
  - icon: git-merge
    badge: "Chiều · Tích hợp"
    title: "Merge Về Trunk (main)"
    desc: "Tích hợp vào nhánh thân chính mỗi ngày, tắt mặc định Feature Flag nếu chưa xong UI"
    code: "flags.newQr = false"
    tone: cyan
    edge: "đủ điều kiện"
  - icon: rocket
    badge: "Phát hành · Mở cờ"
    title: "Git Tag & Bật Flag"
    desc: "Đóng dấu mốc bất biến v1.0.0 và bật tính năng cho khách hàng an toàn"
    code: "git tag v1.0.0"
    tone: emerald
```

## 2. Năm nguyên nhân phổ biến gây lệch kết quả giữa Local và CI Runner

Sự cố lệch pha (*Environment Drift*) xảy ra vì chiếc MacBook/Windows cá nhân của bạn (**16–32 GB RAM**, ổ đĩa **không phân biệt hoa thường**, múi giờ **`Asia/Ho_Chi_Minh` GMT+7**, có bàn phím tương tác) khác rất xa chiếc máy ảo GitHub-hosted Runner tiêu chuẩn (`ubuntu-latest` Linux `ext4`, chỉ có ==2 vCPU & 7 GB RAM==, headless không màn hình/bàn phím!):

```visual
kind: troubleshoot
title: "5 Nguyên nhân phổ biến gây lệch kết quả giữa máy cá nhân và CI Runner [!badge:amber:Must Know]"
subtitle: "Kiểm tra đúng 5 cấu hình này giúp xử lý phần lớn sự cố sai khác giữa môi trường Local và CI"
items:
  - symptom: "Hôm qua vẫn xanh, sáng nay mọi PR đồng loạt gãy native addon dù không sửa code"
    badge: "1. Trôi bản Node & npm"
    tone: rose
    cause: "Khai báo `node-version: latest` khiến CI tự kéo bản Node Major mới vừa phát hành, hoặc dùng `npm install` thay vì `npm ci`."
    fix: "Ghim cứng phiên bản LTS cụ thể `node-version: \"22\"` (hoặc đọc `.nvmrc` qua `node-version-file`) kết hợp `npm ci`."
    cmd: "node-version: \"22\" && npm ci"
  - symptom: "Step 'Run tests' quay vòng tròn suốt 360 phút (6 tiếng) không bao giờ kết thúc"
    badge: "2. Treo Watch Mode"
    tone: amber
    cause: "Gọi `npx vitest` (thiếu `run`) hoặc đặt `CI: false` khiến công cụ bật chế độ Watch tương tác ngồi chờ người nhấn phím `q` vô thời hạn."
    fix: "Luôn đặt biến `CI: true` trong `env:` và gọi tường minh lệnh chạy một lần `npx vitest run` (hoặc `npx jest --ci`)."
    cmd: "CI=true npx vitest run"
  - symptom: "Laptop macOS chạy êm, lên Ubuntu phát sinh lỗi: Cannot find module './UserCard'"
    badge: "3. Hoa/thường Linux ext4"
    tone: cyan
    cause: "Ổ đĩa APFS (macOS) / NTFS (Windows) mặc định không phân biệt hoa thường nên import `./UserCard` cho tệp `userCard.tsx` vẫn lọt; còn Linux `ext4` phân biệt tuyệt đối!"
    fix: "Bật cờ kiểm tra nghiêm ngặt tên tệp trong `tsconfig.json` để bắt lỗi ngay lúc gõ code trên máy cá nhân."
    cmd: "\"forceConsistentCasingInFileNames\": true"
  - symptom: "Snapshot ngày giờ trên máy cá nhân ra 15h, lên CI ra 8h làm vỡ bài test"
    badge: "4. Lệch múi giờ (TZ)"
    tone: sky
    cause: "Laptop đặt múi giờ Việt Nam (`GMT+7`), trong khi Runner đám mây dùng giờ chuẩn quốc tế `UTC` (`08:30Z` -> `getHours()` trả `8` thay vì `15`)."
    fix: "Ghim cứng biến môi trường `TZ: \"UTC\"` cho toàn bộ Job kiểm thử để kết quả xử lý `Date` đồng nhất toàn cầu."
    cmd: "TZ=UTC node -e \"console.log(new Date('2026-05-01T08:30:00Z').getHours())\" # -> 8"
  - symptom: "Bộ test TypeScript lớn đang chạy giữa chừng bị sập đột ngột với Exit Code 137"
    badge: "5. Tràn RAM Worker (OOM)"
    tone: rose
    cause: "Jest/Vitest đọc nhầm số nhân CPU vật lý của host mẹ (16–32 core) rồi đẻ 15 worker con ngốn 9 GB RAM, vượt trần 7 GB RAM của `ubuntu-latest` nên bị Linux OOM Killer bắn `SIGKILL` (`137`)."
    fix: "Giới hạn số worker khớp với ngân sách 2 vCPU của Runner kết hợp khoá trần bộ nhớ Heap V8 rõ ràng."
    cmd: "NODE_OPTIONS=\"--max-old-space-size=4096\" npx jest --ci --maxWorkers=2"
```

## 3. Cấu hình chuẩn hoá chống lệch môi trường (Node.js, Python & Đa ngôn ngữ)

> [!WARNING] Lưu ý cấu hình lệnh kiểm thử chạy một lần (Non-watch Mode)
> Hầu hết thư viện kiểm thử hiện đại (Vitest, Jest, Playwright) đều kiểm tra biến môi trường `process.env.CI === "true"` để tự động tắt chế độ Watch tương tác. Nếu cấu hình nhầm `CI: false` hoặc thiếu tham số `run`, tiến trình sẽ đứng chờ thao tác bàn phím cho đến khi hết giới hạn **360 phút**!

Chỉ với khối cấu hình 6 dòng dưới đây, bạn sẽ khoá chặt đồng thời cả 3 biến môi trường chuẩn hoá (`CI: true`, `TZ: UTC`, `NODE_OPTIONS`) và trần `--maxWorkers=2` vừa khít với ngân sách **2 vCPU / 7 GB RAM** của Hosted Runner:

```yaml
- name: Run test suite within 2-vCPU / 7GB RAM runner budget
  env:
    CI: true
    TZ: UTC
    NODE_OPTIONS: "--max-old-space-size=4096"
  run: npx jest --ci --maxWorkers=2
```

> [!TIP] Quy luật chống lệch môi trường này áp dụng y hệt cho Python, Go & Java!
> - **Python:** Luôn khoá phiên bản bằng `uv sync --frozen` (đọc cứng `uv.lock`), đặt `TZ: UTC` khi test `datetime`, chú ý tên file chữ hoa/thường trên Linux (`import user_service` != `User_Service.py`), và giới hạn `pytest -n 2` tránh tràn RAM `Exit 137`.
> - **Go & Java:** Dùng `TZ=UTC go test -race ./...` (khoá `go.sum`) hoặc giới hạn bộ nhớ JVM `JAVA_OPTS: "-Xmx3g"` trên Gradle/Maven để không vượt trần 7 GB RAM của máy ảo CI!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Trunk-Based Development:** Tách nhánh ngắn hạn (vài giờ đến 1–2 ngày), merge về `main` hàng ngày; dùng **Feature Flag** để giấu tính năng lớn chưa hoàn thiện giao diện.
> - Linux `ext4` phân biệt chữ hoa/thường tuyệt đối (`UserCard.tsx` != `userCard.tsx`) -> luôn bật `"forceConsistentCasingInFileNames": true`.
> - Khoá bộ ba ổn định trên Runner 2 vCPU / 7 GB RAM: ==`node-version: "22"`== (tránh `latest`), ==`CI: true` + `TZ: UTC`==, và ==`--maxWorkers=2` + `--max-old-space-size=4096`== để triệt tiêu `Exit Code 137`.

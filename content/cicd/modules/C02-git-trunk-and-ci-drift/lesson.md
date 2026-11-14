# Chiến lược nhánh Git & 5 thủ phạm "Chạy được trên máy em nhưng đỏ trên CI"

Câu nói kinh điển nhất trong mọi phòng họp kỹ thuật là: *"Ủa lạ vậy anh, trên MacBook của em vừa chạy `npm test` xanh mượt mà sao đẩy lên Pull Request nó lại treo cứng rồi đỏ lòm?!"*. Để đường ống CI thực sự trở thành tấm khiên bảo vệ đội ngũ thay vì nỗi ám ảnh mỗi chiều thứ Sáu, bạn cần kết hợp hai mảnh ghép: ==chiến lược phân nhánh ngắn hạn (Trunk-Based Development)== và ==kỷ luật đồng bộ môi trường giữa Laptop với CI Runner==.

```visual
kind: illustration
diagram: "cicd:c02"
src: "/illustrations/cicd/cicd-trunk-vs-gitflow.jpg"
alt: "Đối chiếu địa ngục xung đột GitFlow nhánh dài hạn với Trunk-Based Development nhánh ngắn hạn và hàng đợi Merge Queue chống lệch ngữ nghĩa"
title: "Giải Phẫu Chiến Lược Nhánh: Địa Ngục GitFlow vs Trunk-Based & Merge Queue"
subtitle: "Gộp nhánh nhỏ hàng ngày kết hợp Feature Flags và hàng đợi kiểm thử gộp để giữ nhánh main luôn sẵn sàng phát hành"
caption: "Sự đối lập giữa nhánh dài hạn nhiều tuần gây nổ xung đột, mô hình Trunk-Based PR ngắn dưới 24 giờ và lớp bảo vệ Merge Queue chống xung đột ngữ nghĩa"
callouts:
  - num: 1
    label: "Nhánh dài hạn gây Địa ngục xung đột (Merge Hell)"
    desc: "Tách nhánh suốt nhiều tuần khiến mã nguồn trôi dạt hàng nghìn dòng, xanh trên nhánh lẻ nhưng vỡ vụn ngay khi gộp chung."
    tone: rose
  - num: 2
    label: "Trunk-Based PR ngắn hạn & Đồng bộ môi trường"
    desc: "Gộp các PR nhỏ mỗi ngày kết hợp Feature Flags, khoá phiên bản .nvmrc, múi giờ UTC và kiểm tra chữ hoa/thường tên tệp Linux."
    tone: emerald
  - num: 3
    label: "Merge Queue chặn đứng xung đột ngữ nghĩa chéo"
    desc: "Tự động tạo nhánh gộp tạm thời để chạy kiểm thử tổ hợp PR #101 + PR #102 cùng nhau trước khi cho phép chạm vào nhánh main."
    tone: sky
```

## 1. Trunk-Based Development vs GitFlow cổ điển: Vì sao CI yêu nhánh ngắn hạn?

```visual
kind: compare
title: "GitFlow Nhánh Dài Hạn (Merge Hell) vs Trunk-Based Development Hiện Đại"
subtitle: "Chữ 'Continuous Integration' theo nghĩa gốc là gộp code vào nhánh thân chính ít nhất mỗi ngày một lần!"
left:
  badge: "CỔ ĐIỂN · GitFlow Dài Hạn"
  title: "Nhánh sống nhiều tuần gây Địa ngục xung đột"
  tone: rose
  code: |
    main ───────────────────────────────────● (Release quý)
      \                                    /
       develop ───●───────────●───────────● (Merge Hell!)
                   \         /
        feature/a ──●───●───● (Tách riêng 3 tuần)
  lang: text
  bullets:
    - "5 lập trình viên ôm 5 nhánh `feature/*` riêng rẽ suốt 3–4 tuần mới gộp lại"
    - "Trên nhánh riêng thì CI báo xanh, nhưng vừa trộn vào nhau là vỡ tung kiến trúc (**Merge Hell**)"
    - "Pull Request dài 4.000 dòng không ai review nổi chất lượng"
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
    tone: violet
    edge: "đủ điều kiện"
  - icon: rocket
    badge: "Phát hành · Mở cờ"
    title: "Git Tag & Bật Flag"
    desc: "Đóng dấu mốc bất biến v1.0.0 và bật tính năng cho khách hàng an toàn"
    code: "git tag v1.0.0"
    tone: emerald
```

## 2. Truy lùng 5 thủ phạm khiến "Máy em chạy ngon nhưng lên CI bị đỏ"

Sự cố lệch pha (*Environment Drift*) xảy ra vì chiếc MacBook/Windows cá nhân của bạn (**16–32 GB RAM**, ổ đĩa **không phân biệt hoa thường**, múi giờ **`Asia/Ho_Chi_Minh` GMT+7**, có bàn phím tương tác) khác rất xa chiếc máy ảo GitHub-hosted Runner tiêu chuẩn (`ubuntu-latest` Linux `ext4`, chỉ có ==2 vCPU & 7 GB RAM==, headless không màn hình/bàn phím!):

```visual
kind: troubleshoot
title: "Bảng Chẩn Đoán 5 Thủ Phạm Gây Lệch Pha Laptop vs CI Runner [!badge:amber:Must Know]"
subtitle: "Rà soát đúng 5 chốt chặn này sẽ giải quyết 99% sự cố 'trên máy em vẫn xanh mượt'"
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
  - symptom: "Laptop macOS chạy êm, lên Ubuntu nổ lỗi: Cannot find module './UserCard'"
    badge: "3. Hoa/thường Linux ext4"
    tone: violet
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

## 3. Cấu hình chuẩn hoá chống lệch môi trường cho dự án Node.js

> [!WARNING] Đừng để một dòng `npx vitest` thiếu chữ `run` đốt sạch 6 tiếng CI!
> Hầu hết thư viện trong hệ sinh thái JavaScript hiện đại (Vitest, Jest, Playwright, pnpm) đều kiểm tra `process.env.CI === "true"` để tự động tắt chế độ Watch tương tác và tắt thanh tiến trình động. Nếu ai đó vô tình ghi đè `CI: false`, tiến trình sẽ ngồi đợi bàn phím ảo trong vô vọng suốt **360 phút**!

Chỉ với khối cấu hình 6 dòng dưới đây, bạn sẽ khoá chặt đồng thời cả 3 biến môi trường chuẩn hoá (`CI: true`, `TZ: UTC`, `NODE_OPTIONS`) và trần `--maxWorkers=2` vừa khít với ngân sách **2 vCPU / 7 GB RAM** của Hosted Runner:

```yaml
- name: Run test suite within 2-vCPU / 7GB RAM runner budget
  env:
    CI: true
    TZ: UTC
    NODE_OPTIONS: "--max-old-space-size=4096"
  run: npx jest --ci --maxWorkers=2
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Trunk-Based Development:** Tách nhánh ngắn hạn (vài giờ đến 1–2 ngày), merge về `main` hàng ngày; dùng **Feature Flag** để giấu tính năng lớn chưa hoàn thiện giao diện.
> - Linux `ext4` phân biệt chữ hoa/thường tuyệt đối (`UserCard.tsx` != `userCard.tsx`) -> luôn bật `"forceConsistentCasingInFileNames": true`.
> - Khoá bộ ba ổn định trên Runner 2 vCPU / 7 GB RAM: ==`node-version: "22"`== (tránh `latest`), ==`CI: true` + `TZ: UTC`==, và ==`--maxWorkers=2` + `--max-old-space-size=4096`== để triệt tiêu `Exit Code 137`.

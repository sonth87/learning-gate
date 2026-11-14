# Từ `npm scripts` đến CI Gate: Sức mạnh của Exit Code

Nếu bạn đã quen gõ `npm run lint && npm test && npm run build` trên laptop trước khi tạo Pull Request, xin chúc mừng: bạn đã hiểu **80% bản chất của Continuous Integration (CI)**. Một hệ thống CI/CD hiện đại như GitHub Actions hay GitLab CI không hề có phép thuật đọc hiểu mã nguồn bằng mắt thường. Thứ duy nhất giúp đường ống quyết định {emerald:cho phép merge (dấu tích xanh)} hay {rose:chặn đứng Pull Request (dấu chéo đỏ)} là một con số nguyên nhỏ bé do hệ điều hành trả về sau mỗi tiến trình: ==Exit Code (mã thoát)==.

```visual
kind: flow
title: "Hành Trình Cổng Kiểm Định Tự Động (CI Gate & Exit Code)"
subtitle: "Mỗi bước chỉ được đi tiếp khi tiến trình trước đó kết thúc với mã thoát bằng 0"
steps:
  - icon: git-pr
    badge: "Sự kiện Git"
    title: "Mở Pull Request"
    desc: "Đẩy commit mới xin gộp vào nhánh thân chính main"
    code: "git push origin feat/api"
    tone: sky
    edge: "cấp VM sạch"
  - icon: package
    badge: "Bước 1 · Khóa gói"
    title: "Clean Install"
    desc: "Dựng cây phụ thuộc bất biến khớp 100% với lockfile"
    code: "npm ci"
    tone: cyan
    edge: "exit 0"
  - icon: shield-check
    badge: "Bước 2 · Kiểm tra tĩnh"
    title: "Lint & Typecheck"
    desc: "Quét quy tắc ESLint và kiểm tra kiểu dữ liệu TypeScript"
    code: "eslint . && tsc --noEmit"
    tone: violet
    edge: "exit 0"
  - icon: zap
    badge: "Bước 3 · Thực thi"
    title: "Unit Test & Build"
    desc: "Chạy toàn bộ Vitest và biên dịch gói sản phẩm đầu ra"
    code: "vitest run && npm run build"
    tone: amber
    edge: "exit 0 -> Xanh"
  - icon: git-merge
    badge: "Cổng quyết định"
    title: "Mở Khóa Nút Merge"
    desc: "Nếu bất kỳ bước nào trả Exit Code != 0, chặn PR ngay lập tức!"
    code: "EXIT_SUCCESS (0)"
    tone: emerald
footer: "Quy ước POSIX & Node.js: Exit Code = 0 là thành công · Exit Code != 0 (1..255) kích hoạt dừng khẩn cấp (Fail-Fast)"
```

## 1. Ánh xạ tư duy: Từ `package.json` trên Laptop lên CI Gate

```visual
kind: illustration
diagram: "cicd:c00"
alt: "Đường ống cổng kiểm định CI Fail-Fast dựa trên mã thoát POSIX Exit Code 0 so với 1..255 và cách chống bẫy False-Green"
title: "Giải Phẫu Cổng Kiểm Định CI: Tín Hiệu POSIX Exit Code & Chốt Chặn Fail-Fast"
subtitle: "Cách đường ống tự động mở khoá nút Merge khi mọi bước trả 0 và phanh gấp tức thì trước mọi mã lỗi 1..255"
caption: "Chuỗi cổng kiểm định tuần tự npm ci -> lint -> test -> build, bảng mã lỗi POSIX đặc trưng (1, 22, 127, 137) và cách triệt tiêu bẫy nuốt lỗi False-Green"
callouts:
  - num: 1
    label: "Chuỗi cổng kiểm định yêu cầu Exit Code == 0"
    desc: "Mỗi tiến trình từ npm ci, eslint, vitest đến build đều phải kết thúc với mã thoát 0 thì nút Merge Pull Request mới được mở khoá."
    tone: emerald
  - num: 2
    label: "Phanh gấp Fail-Fast khi gặp mã thoát 1..255"
    desc: "Bất kỳ bước nào trả mã khác 0 (1 lỗi test, 22 lỗi HTTP, 137 tràn RAM OOM) sẽ lập tức huỷ các bước sau và chặn gộp code hỏng."
    tone: rose
  - num: 3
    label: "Chống bẫy Xanh vỏ đỏ lòng (False-Green)"
    desc: "Tuyệt đối cấm dùng || true hoặc continue-on-error ở cổng kiểm thử; luôn bật set -euo pipefail và cờ curl --fail-with-body."
    tone: amber
```

> [!ANALOGY] Hãy hình dung như sau
> Nếu `scripts` trong `package.json` là **danh sách bài kiểm tra**, thì **CI Gate** chính là một **giám thị máy ảo Linux sạch tinh** đứng gác ngay trước cửa nhánh `main` — không bao giờ mệt, không bao giờ quên chạy test chiều thứ Sáu, và không bao giờ dùng nhầm `node_modules` cũ tồn đọng trên máy cá nhân!

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

Vấn đề của việc chạy thủ công trên laptop là **yếu tố con người**: thứ Sáu cuối tuần vội về quên gõ `npm test`, hoặc máy cá nhân còn sót thư viện cũ trong `node_modules` nên code vẫn chạy êm dù `package.json` khai báo thiếu gói. **CI Gate** thuê một máy ảo mới tinh chạy lại đúng chuỗi lệnh đó và phán quyết dựa tuyệt đối vào **Exit Code** (`process.exit(code)` trong Node.js):

- [x] **`Exit Code = 0` (`EXIT_SUCCESS`)**: Tiến trình hoàn tất **thành công**. Đường ống bật đèn xanh và chuyển sang bước tiếp theo.
- [!] **`Exit Code != 0` (`1`..`255`)**: Tiến trình **thất bại**. Đường ống lập tức dừng khẩn cấp (**Fail-Fast**) và khoá nút Merge.

| Mã thoát (`Exit Code`) | Ý nghĩa trong Linux & Node.js | Ví dụ thực tế trên CI Runner |
| :--- | :--- | :--- |
| **`0`** | Thành công hoàn toàn (`EXIT_SUCCESS`) | `eslint`, `vitest run`, `tsc` không phát hiện lỗi nào |
| **`1`** | Lỗi ứng dụng chung (`process.exit(1)`) | 1 bài Unit Test bị sai assert hoặc lỗi cú pháp TypeScript |
| **`22`** | `curl --fail` gặp HTTP `4xx` / `5xx` | Smoke test gọi `/healthz` nhưng API trả về `500 Internal Server Error` |
| **`127`** | `Command not found` | Gõ nhầm tên lệnh hoặc gọi `vitest` khi chưa chạy `npm ci` |
| **`137`** | `128 + 9` (`SIGKILL` / OOM Killer) | Node.js hoặc Jest worker ngốn lố RAM của Runner bị Linux Kernel tiêu diệt |
| **`143`** | `128 + 15` (`SIGTERM`) | Job bị huỷ chủ động do vượt `timeout-minutes` hoặc Concurrency huỷ bản cũ |

> [!TIP] Quy tắc cộng `128 + N` của tín hiệu Linux
> Khi một tiến trình trên Linux chết do nhận tín hiệu hệ thống số `N`, mã thoát của nó luôn bằng ==`128 + N`==. Do đó thấy **`137`** (`128 + 9`, tức `SIGKILL`) trên CI hầu như chắc chắn là dấu hiệu tràn bộ nhớ RAM (**Out-Of-Memory — OOM Killer**)!

## 2. Hiểm hoạ "Xanh vỏ đỏ lòng" (False-Green Pipeline)

Một đường ống bị đỏ còn dễ sửa; đáng sợ nhất trong nghề DevOps là ==False-Green Pipeline== — ứng dụng đang lỗi nát bét nhưng Pull Request vẫn hiện dấu tích xanh mượt mà!

```visual
kind: compare
title: "Giải Phẫu 3 Bẫy Nuốt Mã Lỗi Gây 'Xanh Vỏ Đỏ Lòng' (False-Green)"
subtitle: "Chỉ một thói quen viết lệnh hớ hênh cũng đủ vô hiệu hoá hoàn toàn tấm khiên bảo vệ nhánh main"
left:
  badge: "NGUY HIỂM · Nuốt Exit Code"
  title: "Báo tích xanh giả dù ứng dụng đang sập"
  tone: rose
  code: |
    #!/usr/bin/env bash
    # 1. Thiếu cờ --fail: HTTP 500 vẫn trả exit 0!
    curl http://localhost:3000/healthz

    # 2. Bùa hại người || true xoá sạch mã lỗi 1 thành 0:
    npm test || true

    # 3. Không có pipefail: chỉ lấy exit 0 của lệnh tee!
    npm test | tee report.txt
  lang: bash
  bullets:
    - "**`curl` mặc định** chỉ kiểm tra kết nối TCP: dù server trả `HTTP 404` hay `500 Internal Server Error`, `curl` vẫn in JSON lỗi ra rồi kết thúc với **`Exit Code = 0`**!"
    - "**Toán tử `A || B`** chạy vế phải khi vế trái lỗi: viết `false || true` hay `npm test || true` sẽ làm `$?` biến thành **`0`** (tương tự lạm dụng `continue-on-error: true`)"
    - "**Ống dẫn `|` mặc định** của Bash chỉ lấy mã thoát của lệnh cuối cùng (`tee` ghi file thành công trả `0`), bỏ lọt lỗi `1` của `npm test`"
right:
  badge: "CHUẨN MỰC · Fail-Fast Nghiêm Ngặt"
  title: "Bắt dính mọi lỗi ngay giây đầu tiên"
  tone: emerald
  code: |
    #!/usr/bin/env bash
    set -euo pipefail

    # 1. Trả mã lỗi 22 ngay khi gặp HTTP >= 400:
    curl --fail-with-body http://localhost:3000/healthz

    # 2. Giữ nguyên mã lỗi thật của bộ test:
    npm test | tee report.txt
  lang: bash
  bullets:
    - "**`curl --fail`** (hoặc `-f`, `--fail-with-body`) ép `curl` trả mã thoát **`22`** ngay khi gặp HTTP `>= 400`"
    - "**`-e` (`errexit`):** Dừng script tức khắc ngay dòng lệnh đầu tiên trả `Exit Code != 0`"
    - "**`-u` (`nounset`):** Báo lỗi ngay nếu gặp biến chưa khai báo (ngăn thảm hoạ `rm -rf /$EMPTY_VAR`)"
    - "**`-o pipefail`:** Chỉ cần `npm test` ở đầu ống trả `1`, toàn bộ đường ống `|` lập tức trả `1`"
```

> [!WARNING] Lưu ý về Shell mặc định trên GitHub Actions
> Mỗi khối `run: |` trực tiếp trong YAML được GitHub Actions thực thi ngầm bằng `bash -eo pipefail {0}`. Tuy nhiên, nếu bạn tách kịch bản ra tệp `.sh` riêng (ví dụ `bash ./scripts/ci-verify.sh`), Bash sẽ quay về chế độ mặc định lỏng lẻo — vì vậy **luôn đặt `set -euo pipefail` ở đầu mọi tệp `.sh`** và tuyệt đối cấm gắn `continue-on-error: true` lên các cổng `lint`, `typecheck`, `test`, `build`!

## 3. `npm ci` vs `npm install`: Kỷ luật bất biến trên CI

Trên laptop khi thêm thư viện mới, bạn gõ `npm install`. Nhưng trên đường ống CI, `npm install` là một phản mẫu rủi ro vì nó được phép **tự ý sửa lại `package-lock.json`** nếu dải semver `^1.2.0` có bản vá mới vừa phát hành 5 phút trước.

Ngược lại, ==`npm ci` (Clean Install)== sinh ra dành riêng cho môi trường tự động hoá:
- [x] **Xoá sạch `node_modules` hiện có** để đảm bảo không gian làm việc tinh khiết 100%.
- [x] **Đọc cứng từng phiên bản và mã băm `integrity`** đã khoá chặt trong `package-lock.json`.
- [x] **Chặn đứng lệch pha lockfile:** Nếu lập trình viên nâng phiên bản trong `package.json` mà quên cập nhật `package-lock.json`, `npm ci` lập tức dừng lại và trả **`Exit Code = 1`** thay vì âm thầm đoán mò!

## 4. Phân biệt rạch ròi: CI vs Continuous Delivery vs Continuous Deployment

```visual
kind: groups
title: "Ba Cấp Độ Trưởng Thành Của Đường Ống Tự Động Hoá [!badge:cyan:Core Concepts]"
subtitle: "Cụm từ viết tắt 'CI/CD' thực chất bao hàm 2 khái niệm CD có ranh giới phê duyệt hoàn toàn khác nhau"
columns: 3
items:
  - num: 1
    icon: check
    title: "Continuous Integration"
    badge: "Tích hợp liên tục (CI)"
    tone: sky
    desc: "Tự động kiểm định mã nguồn mỗi khi có commit hoặc Pull Request mới vào nhánh chính."
    bullets:
      - "Chạy tự động `npm ci` -> `lint` -> `test` -> `build`"
      - "Phát hiện xung đột logic và vỡ kiểu dữ liệu sớm từng giờ"
    footer: "Mục tiêu: Nhánh main luôn biên dịch và chạy test xanh"
  - num: 2
    icon: shield
    title: "Continuous Delivery"
    badge: "Chuyển giao liên tục"
    tone: amber
    desc: "Tự động đóng gói Artifact/Image và đẩy lên Staging, sẵn sàng phát hành bất cứ lúc nào."
    bullets:
      - "Tự động hoá toàn bộ khâu build & kiểm thử trên `staging`"
      - "Giữ **Cổng phê duyệt thủ công (Manual Approval Gate)** trước `environment: production`"
    footer: "Tech Lead chủ động bấm nút Approve giờ lên Prod"
  - num: 3
    icon: rocket
    title: "Continuous Deployment"
    badge: "Triển khai liên tục"
    tone: emerald
    desc: "Xoá bỏ hoàn toàn bước bấm nút thủ công — tự động hoá xuyên suốt từ commit tới tay người dùng."
    bullets:
      - "Mọi commit vượt qua toàn bộ cổng kiểm thử tự động trên `main` đi thẳng ra **Production**"
      - "Đòi hỏi độ phủ test tự động, giám sát và cơ chế Rollback cực kỳ vững chắc"
    footer: "Phát hành lên Production nhiều lần mỗi ngày tự động 100%"
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - CI Runner phán quyết xanh/đỏ dựa hoàn toàn vào **Exit Code**: `0` = thành công, `!= 0` = thất bại (`137` = `SIGKILL` / tràn RAM OOM).
> - Chống **False-Green**: luôn dùng `curl --fail`, bật đủ `set -euo pipefail` trong script Bash, và không dùng `|| true` ở bước kiểm thử.
> - Luôn dùng **`npm ci`** trên CI để khoá cứng `package-lock.json`.
> - **Continuous Delivery** dừng chờ người bấm duyệt trước Production · **Continuous Deployment** đẩy thẳng lên Production tự động.

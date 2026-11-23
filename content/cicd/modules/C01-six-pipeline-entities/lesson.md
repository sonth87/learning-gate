# Sáu thành phần cốt lõi trong CI/CD: Trigger, Workflow, Job, Step và Ephemeral Runner

Khi mới mở một tệp `.github/workflows/ci.yml` hoặc `.gitlab-ci.yml`, người học thường gặp nhiều từ khóa lồng nhau như `on`, `jobs`, `runs-on`, `steps`, `uses`, `run`, `defaults`. Tuy nhiên, **mọi nền tảng CI/CD hiện đại** — dù dùng cho Node.js, Python, Go hay Java — đều vận hành dựa trên ==6 thành phần cốt lõi==:

- **Webhook Trigger:** Ngay khi bạn thực hiện `git push` hoặc mở một **Pull Request (PR)**, máy chủ Git lập tức gửi một sự kiện mạng (Webhook JSON) để kích hoạt hệ thống CI chạy tự động mà không cần thao tác thủ công.
- **Ephemeral Runner:** Thay vì chạy trên một máy chủ dùng chung lâu dài (dễ tồn lưu rác cấu hình, đầy ổ đĩa hoặc nhiễm mã độc), mỗi **Job** được cấp phát một **máy ảo Linux sạch mới khởi tạo**, chạy trong vài phút rồi **tự động thu hồi và xóa trắng ổ đĩa** ngay khi Job kết thúc.

Nắm vững ranh giới giữa 6 thành phần này giúp bạn thiết kế pipeline chính xác và tránh lỗi phổ biến như không tìm thấy tệp giữa các Job khác nhau.

```visual
kind: flow
title: "Chuỗi Điều Phối Từ Sự Kiện Git Đến Từng Câu Lệnh Thực Thi"
subtitle: "Một sự kiện đánh thức Workflow -> chia nhánh các Job độc lập -> cấp máy ảo Runner -> chạy tuần tự từng Step"
steps:
  - icon: webhook
    badge: "1. Event / Trigger"
    title: "Sự Kiện Kích Hoạt"
    desc: "Lập trình viên git push, mở PR, gắn tag hoặc tới giờ lịch hẹn cron"
    code: "on: [push, pull_request]"
    tone: amber
    edge: "đánh thức"
  - icon: file-code
    badge: "2. Workflow"
    title: "Kịch Bản Điều Phối"
    desc: "Tệp YAML nằm trong .github/workflows/ mô tả toàn bộ quy trình"
    code: ".github/workflows/ci.yml"
    tone: sky
    edge: "phân bổ song song"
  - icon: boxes
    badge: "3. Job & 4. Runner"
    title: "Job Trên Máy Ảo Sạch"
    desc: "Mỗi Job được cấp riêng 1 Ephemeral VM mới tinh, độc lập hoàn toàn"
    code: "runs-on: ubuntu-latest"
    tone: cyan
    edge: "chạy tuần tự"
  - icon: terminal
    badge: "5. Step & 6. Action"
    title: "Chuỗi Bước Thực Thi"
    desc: "Các Step nối đuôi nhau trên cùng ổ đĩa qua uses: (Action) hoặc run: (Shell)"
    code: "uses: ... / run: npm test"
    tone: emerald
```

## 1. Sáu thành phần cốt lõi trong một GitHub Actions Workflow

```visual
kind: illustration
diagram: "cicd:c01"
alt: "Sơ đồ phân cấp 6 thành phần CI/CD từ Event Trigger, Workflow, Job trên máy ảo Ephemeral Runner đến chuỗi Step và Action"
title: "Cấu trúc 6 thành phần Pipeline & Cơ chế cô lập Ephemeral Runner"
subtitle: "Vì sao các Step trong cùng một Job dùng chung ổ đĩa nhưng hai Job khác nhau lại tách biệt hoàn toàn"
caption: "Cấu trúc phân cấp từ sự kiện kích hoạt (Trigger) -> Workflow -> các Job chạy trên máy ảo dùng một lần riêng biệt -> chuỗi Step và Action"
callouts:
  - num: 1
    label: "1. Event Trigger & 2. Workflow điều phối tổng"
    desc: "Sự kiện push hoặc pull_request kích hoạt tệp Workflow YAML để phân bổ các Job độc lập chạy song song mặc định."
    tone: amber
  - num: 2
    label: "3. Job, 4. Runner VM, 5. Step & 6. Action"
    desc: "Mỗi Job được cấp 1 máy ảo Ubuntu mới tinh; các Step bên trong chạy nối tiếp trên cùng ổ đĩa rồi máy ảo bị thu hồi khi xong việc."
    tone: cyan
  - num: 3
    label: "Ranh giới ổ đĩa giữa hai Job khác nhau"
    desc: "Job B chạy trên một máy ảo hoàn toàn khác nên không thấy thư mục dist/ của Job A nếu không truyền qua cơ chế Artifact."
    tone: rose
```

Trong một quy trình GitHub Actions, 6 thành phần này tổ chức theo thứ tự phân cấp từ sự kiện bên ngoài đi vào từng câu lệnh thực thi:

```visual
kind: groups
title: "6 Thành Phần Nền Tảng Của Hệ Thống CI/CD Hiện Đại"
columns: 3
items:
  - num: 1
    icon: zap
    title: "Event / Trigger"
    badge: "on:"
    tone: amber
    desc: "Sự kiện kích hoạt pipeline chạy tự động."
    bullets:
      - "Lắng nghe các thao tác Git hoặc lịch định kỳ từ bên ngoài"
      - "Kích hoạt tức thì khi `git push`, mở `pull_request`, gắn tag hoặc lịch `schedule`"
  - num: 2
    icon: workflow
    title: "Workflow"
    badge: ".github/workflows/*.yml"
    tone: sky
    desc: "Tệp cấu hình điều phối tổng thể của một quy trình tự động."
    bullets:
      - "Định nghĩa toàn bộ các Job, biến môi trường và điều kiện chạy"
      - "Một kho Git có thể chứa nhiều Workflow độc lập (`ci.yml`, `release.yml`, `CodeQL.yml`)"
  - num: 3
    icon: server
    title: "Runner"
    badge: "runs-on: ubuntu-latest"
    tone: cyan
    desc: "Máy ảo Linux/macOS/Windows được cấp phát tạm thời để thực thi Job."
    bullets:
      - "Vòng đời tồn tại đúng bằng thời gian chạy **1 Job duy nhất**"
      - "Khi Job kết thúc, máy ảo bị thu hồi và xóa toàn bộ dữ liệu trên ổ đĩa"
  - num: 4
    icon: boxes
    title: "Job"
    badge: "jobs.<job_id>:"
    tone: cyan
    desc: "Đơn vị công việc độc lập chạy trên một Runner riêng biệt."
    bullets:
      - "Mặc định nếu không khai báo `needs:`, các Job chạy **song song cùng lúc**"
      - "**Không chia sẻ ổ đĩa hay bộ nhớ RAM** với Job khác"
  - num: 5
    icon: terminal
    title: "Step"
    badge: "steps: - ..."
    tone: emerald
    desc: "Từng bước thực thi nhỏ bên trong một Job."
    bullets:
      - "Chạy **tuần tự từ trên xuống** trên cùng 1 máy ảo Runner"
      - "**Có chia sẻ chung ổ đĩa workspace** `/home/runner/work/...`"
  - num: 6
    icon: package
    title: "Action"
    badge: "uses: actions/checkout@v4"
    tone: sky
    desc: "Mô-đun đóng gói sẵn để tái sử dụng thay vì tự viết lại kịch bản Bash."
    bullets:
      - "Hoạt động tương tự một thư viện hoặc hàm tiện ích có thể gọi lại qua tên và phiên bản"
      - "Đóng gói sẵn logic kéo Git (`checkout@v4`), cài Node (`setup-node@v4`), Python (`astral-sh/setup-uv@v5`) hay Go (`setup-go@v5`)"
```

Nếu liên hệ với kiến trúc ứng dụng Node.js để dễ hình dung: **Trigger (`on:`)** giống như một HTTP Webhook tiếp nhận sự kiện, **Workflow** là hàm điều phối tổng, mỗi **Job** là một tiến trình worker trên máy chủ tách biệt hoàn toàn, còn các **Step** là từng câu lệnh chạy nối tiếp nhau bên trong worker đó.

> [!TIP] Bản đồ Hệ sinh thái Công cụ CI/CD trong Ngành Công nghiệp
> Khi đi làm thực tế, bạn sẽ gặp nhiều tên tuổi CI/CD khác nhau, nhưng cả 6 thực thể trên đều ánh xạ 1-đối-1 sang mọi nền tảng:
> - **GitHub Actions** (`.github/workflows/*.yml`): Phổ biến số 1 cho dự án Cloud & Open-Source, kho Action dựng sẵn cực lớn.
> - **GitLab CI/CD** (`.gitlab-ci.yml` — học sâu ở bài `C09`): Tiêu chuẩn vàng tại các ngân hàng, tập đoàn tự vận hành hạ tầng nội bộ (*Self-managed*), mạnh về thực thi thuần Container.
> - **Jenkins** (`Jenkinsfile` viết bằng Groovy): Tượng đài lâu đời tại các doanh nghiệp lớn (*Enterprise Legacy*); thường chạy mô hình Controller + Agent cố định nên rất cần kết hợp Docker/Kubernetes Agent để tránh rác môi trường.
> - **CircleCI & Buildkite**: Nổi bật với tốc độ bộ đệm cực nhanh và mô hình Hybrid (điều phối trên Cloud nhưng đặt máy chạy Runner bên trong mạng riêng AWS/GCP của công ty).
> - **Dagger**: Thế hệ CI "Pipeline-as-Code" mới cho phép viết luồng build bằng TypeScript/Python/Go chạy trong container BuildKit giống hệt 100% trên cả laptop lẫn mọi máy chủ CI!

## 2. Nguyên tắc cô lập môi trường: Các Step trong cùng Job dùng chung ổ đĩa, nhưng các Job chạy trên máy ảo tách biệt

Đây là điểm dễ nhầm lẫn nhất khi mới làm quen với cấu hình CI/CD.

Trong cùng một **Job** (ví dụ `jobs.verify`), mọi **Step** chạy nối tiếp nhau trên **cùng một máy ảo Runner (`ubuntu-latest`)**: Step 1 `actions/checkout@v4` kéo code về đĩa -> Step 2 `actions/setup-node@v4` cài Node 22 vào `PATH` -> Step 3 `run: npm ci` tạo `node_modules/` trên SSD -> Step 4 `run: npm test` thấy sẵn toàn bộ code lẫn `node_modules/` vừa cài!

Nhưng nếu bạn tách thành **hai Job riêng biệt** là `jobs.install` và `jobs.test`, chúng sẽ chạy trên ==hai chiếc máy ảo Ephemeral VM cách ly hoàn toàn==:

```visual
kind: layers
title: "Ranh Giới Vật Lý Của Ephemeral Runner Giữa Hai Job Riêng Biệt"
subtitle: "Mỗi Job thức dậy trên một máy ảo sạch tinh từ con số 0 — vừa bảo mật chống mã độc tồn lưu, vừa triệt tiêu rác cấu hình"
columns:
  - title: "Job 1: install (Ephemeral VM #1)"
    badge: "Tự huỷ ngay khi xong Step cuối"
    tone: amber
    layers:
      - label: "Step 1: uses: actions/checkout@v4"
        note: "Tải mã nguồn vào /home/runner/work/repo/repo"
        tone: sky
      - label: "Step 2: uses: actions/setup-node@v4"
        note: "Gắn binary Node 22 vào PATH của VM #1"
        tone: cyan
      - label: "Step 3: run: npm ci"
        sub: "Sinh ra thư mục node_modules/ trên ổ SSD của VM #1"
        note: "Tồn tại cục bộ"
        tone: emerald
      - label: "Kết thúc Job 1 -> Tiêu huỷ toàn bộ Máy Ảo #1!"
        note: "Ổ đĩa bị xoá sổ vĩnh viễn"
        tone: rose
    footer: "Mọi tệp chưa đẩy lên Cache / Artifact đều biến mất cùng VM #1"
  - title: "Job 2: test (Ephemeral VM #2 mới tinh)"
    badge: "Khởi tạo trắng tinh hoàn toàn"
    tone: rose
    layers:
      - label: "Hệ điều hành Ubuntu sạch như vừa cài mới"
        sub: "Thư mục workspace trống trơn — CHƯA CÓ cả mã nguồn Git!"
        note: "Trống rỗng 100%"
        tone: slate
      - label: "Nếu gọi ngay: run: npm test (Thiếu checkout & npm ci)"
        sub: "Gặp lỗi tức khắc: ENOENT: Could not read package.json!"
        note: "Lỗi thường gặp"
        tone: rose
      - label: "Quy tắc chuẩn: Job tự thân vận động (Self-Contained)"
        sub: "Tự checkout@v4 + setup-node@v4 (cache: 'npm') + npm ci trên VM #2"
        note: "Chuẩn công nghiệp"
        tone: emerald
    footer: "Muốn truyền sản phẩm dist/ giữa 2 Job? Dùng upload-artifact@v4 & download-artifact@v4!"
```

- [x] **Mỗi Job độc lập phải tự thân vận động (*self-contained*):** Tự gọi `actions/checkout@v4`, tự `actions/setup-node@v4` (bật `cache: 'npm'` để khôi phục gói trong vài giây) và tự chạy `npm ci`.
- [x] **Truyền sản phẩm qua mạng khi cần thiết:** Nếu muốn chuyển thư mục biên dịch `dist/` hoặc báo cáo test từ Job này sang Job khác, hãy đóng gói qua **Artifact** (`actions/upload-artifact@v4` và `actions/download-artifact@v4`).

## 3. Phân biệt `uses:` (gọi Action đóng gói sẵn) và `run:` (gõ lệnh Shell)

Mỗi phần tử trong danh sách `steps:` bắt buộc chọn **một trong hai** từ khoá thực thi (không bao giờ viết chung cả `uses` lẫn `run` trên cùng một Step):

```visual
kind: compare
title: "Hai Hình Thức Thực Thi Trong Một Step: uses: vs run:"
left:
  badge: "ACTION · uses: + with:"
  title: "Gọi module đóng gói sẵn (TypeScript / Docker)"
  tone: sky
  code: |
    steps:
      - name: Checkout repository code
        uses: actions/checkout@v4

      - name: Setup Node.js 22 LTS
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
  lang: yaml
  bullets:
    - "Tái sử dụng module chuẩn của GitHub hoặc cộng đồng"
    - "Truyền tham số cấu hình thông qua khối **`with:`** (tương tự truyền object `options` vào hàm JS)"
    - "**Cảnh báo:** Runner mới bật **không tự tải code Git** — luôn nhớ `actions/checkout@v4` ở đầu Job!"
right:
  badge: "SHELL · run:"
  title: "Thực thi trực tiếp câu lệnh CLI trong subshell"
  tone: emerald
  code: |
    steps:
      - name: Install locked dependencies
        run: npm ci

      - name: Verify types & unit tests
        run: |
          npm run typecheck
          npm test
  lang: yaml
  bullets:
    - "Mở trình thông dịch Shell (mặc định là `bash`) để gõ lệnh giống hệt Terminal"
    - "**Lưu ý quan trọng về Subshell:** Mỗi Step `run:` khởi chạy trong một **subshell mới** đặt lại tại thư mục gốc workspace!"
    - "Nếu Step 1 chạy `mkdir sub && cd sub`, sang Step 2 lệnh `basename \"$PWD\"` **vẫn in ra tên thư mục gốc `repo`** chứ không đứng ở `sub`!"
```

## 4. Xử lý dự án đặt trong thư mục con với `defaults.run.working-directory`

Trong thực tế đi làm (đặc biệt với cấu trúc Monorepo hoặc tách thư mục `apps/backend` và `apps/frontend`), tệp `package.json` thường không nằm ngay ở thư mục gốc (`/`).

Vì lệnh `cd apps/backend` ở Step trên không giữ hiệu lực sang Step dưới, thay vì viết lặp đi lặp lại `cd apps/backend && ...` ở mọi dòng, hãy khai báo ==`defaults.run.working-directory`== ở cấp Job hoặc cấp Workflow:

```yaml
jobs:
  backend-ci:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
          cache-dependency-path: apps/backend/package-lock.json
      - run: npm ci
      - run: npm test
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - Mặc định các **Job** không có `needs:` sẽ chạy **song song** trên các máy ảo **Ephemeral VM tách biệt hoàn toàn** (không chung ổ đĩa hay RAM).
> - Các **Step** trong cùng 1 Job chạy **tuần tự** trên cùng 1 Runner (chia sẻ ổ đĩa), nhưng mỗi Step `run:` mở một **subshell mới** tại gốc workspace (lệnh `cd` không truyền sang Step kế tiếp).
> - Máy ảo mới khởi tạo **trống trơn chưa có code** — luôn bắt đầu bằng `uses: actions/checkout@v4`, và dùng `defaults.run.working-directory` khi dự án nằm trong thư mục con!

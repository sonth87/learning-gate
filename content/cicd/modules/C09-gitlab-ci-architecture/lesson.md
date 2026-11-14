# Kiến trúc GitLab CI/CD Thực chiến: Chuyển đổi Tư duy từ GitHub Actions sang `.gitlab-ci.yml`

Nếu GitHub Actions thống lĩnh thế giới mã nguồn mở và các công ty khởi nghiệp trên nền đám mây, thì tại các ngân hàng, tập đoàn viễn thông và doanh nghiệp tự vận hành máy chủ nội bộ (*Self-managed / On-premise*), **GitLab CI/CD** lại là ông vua không ngai.

- [x] **90% tư duy nền tảng giữ nguyên bản chất 100%:** {sky:Ephemeral Container}, {amber:Lockfile Cache}, {violet:Artifacts}, đồ thị {cyan:DAG} và {emerald:Sharding} đều hoạt động theo cùng nguyên lý cốt lõi.
- [>] **Điểm khác biệt duy nhất nằm ở "ngữ pháp":** Toàn bộ đường ống được định nghĩa trong tệp duy nhất ==`.gitlab-ci.yml`== đặt ngay tại thư mục gốc dự án.

> [!ANALOGY] Hãy hình dung như sau
> Nếu **GitHub Actions** mặc định cấp cho bạn một máy ảo Ubuntu trống rồi bạn tự gọi `actions/setup-node@v4` để cài Node.js, thì **GitLab Runner (Docker / Kubernetes Executor)** ném thẳng từng Job vào chạy bên trong **một Docker Container ngay từ giây đầu tiên**! Chỉ cần khai báo `image: node:22-alpine` trong khối `default:` là toàn bộ đường ống có sẵn môi trường Node 22 gọn nhẹ.

```visual
kind: illustration
diagram: "cicd:c09"
alt: "Kiến trúc tệp .gitlab-ci.yml chạy thuần Container trên Docker/Kubernetes Runner với stages, workflow.rules, needs DAG và artifacts:reports"
title: "Giải Phẫu Kiến Trúc GitLab CI/CD: Thực Thi Thuần Container, Stages & DAG Lai"
subtitle: "Ánh xạ trọn vẹn tư duy đường ống hiện đại sang cấu trúc tệp đơn .gitlab-ci.yml dùng trong môi trường doanh nghiệp"
caption: "Mô hình Container-first trên Docker/K8s Executor, đồ thị lai kết hợp stages với needs: [] phá rào chờ đợi và cơ chế tự động truyền Artifacts"
callouts:
  - num: 1
    label: "Container-First Default & Bộ lọc workflow.rules"
    desc: "Mọi Job khởi chạy thẳng bên trong Docker/K8s Pod từ image: node:22-alpine; dùng workflow.rules chuẩn mực để chống nhân đôi đường ống MR."
    tone: amber
  - num: 2
    label: "Đồ thị lai: Phân tầng stages kết hợp vượt rào needs:"
    desc: "Các Job xếp theo tầng trực quan nhưng có thể dùng needs: [] để xuất phát ngay giây 0 và chia mảnh kiểm thử chỉ bằng 1 dòng parallel: 4."
    tone: sky
  - num: 3
    label: "Artifacts tích hợp gốc & Báo cáo trực quan trên MR"
    desc: "Tự động tải xuống thành phẩm ở các stage kế tiếp không cần cài plugin rời, đồng thời hiển thị bảng kết quả JUnit ngay trong Merge Request."
    tone: emerald
```

## 1. Từ điển chuyển ngữ trực diện: GitHub Actions sang GitLab CI

```visual
kind: layers
title: Đối Chiếu Mô Hình Thực Thi — GitHub Actions vs GitLab CI
subtitle: Cùng một bài toán CI/CD cho dự án Node.js 22 nhưng khác biệt ở cách đóng gói môi trường và luồng điều phối mặc định
columns:
  - title: "GitHub Actions (.github/workflows/*.yml)"
    badge: Multi-file · Mặc định chạy song song
    tone: sky
    layers:
      - label: "Môi trường mặc định: Máy ảo Ubuntu (VM Runner)"
        sub: "Khai báo runs-on: ubuntu-latest + bước cài actions/setup-node@v4"
        note: VM-first
        tone: sky
      - label: "Điều phối Job: Mặc định chạy song song độc lập"
        sub: "Không có tầng stage bắt buộc; muốn nối thứ tự phải viết needs: [job_a]"
        note: DAG-first
        tone: cyan
      - label: "Cache & Artifacts: Gọi qua Action rời bên ngoài"
        sub: "Dùng actions/cache@v4 và cặp upload-artifact / download-artifact thủ công"
        note: Plugin-based
        tone: violet
      - label: "Chia mảnh kiểm thử: Khai báo ma trận thủ công"
        sub: "Viết strategy.matrix.shard: [1, 2, 3, 4] rồi truyền biến ma trận"
        note: Matrix-based
        tone: amber
    footer: Linh hoạt nhờ chợ ứng dụng Marketplace khổng lồ trên đám mây
  - title: "GitLab CI (.gitlab-ci.yml)"
    badge: Single-file · Container-native từ gốc
    tone: emerald
    layers:
      - label: "Môi trường mặc định: Chạy thẳng trong Docker Container"
        sub: "Khai báo default: { image: node:22-alpine } ở đầu tệp cho mọi Job"
        note: Container-first
        tone: emerald
      - label: "Điều phối Job: Phân tầng theo stages + vượt rào bằng needs"
        sub: "Gom theo stages: [install, test, build, deploy] hoặc phá rào bằng needs: []"
        note: Stage + DAG
        tone: sky
      - label: "Cache & Artifacts: Từ khoá tích hợp sẵn trong nhân YAML"
        sub: "cache.policy (pull-push / pull) · artifacts tự động tải xuống ở các stage sau!"
        note: Built-in
        tone: violet
      - label: "Chia mảnh kiểm thử: Chỉ 1 dòng parallel: 4"
        sub: "Tự động cấp cặp biến $CI_NODE_INDEX (1..4) và $CI_NODE_TOTAL (4)"
        note: Zero-boilerplate
        tone: amber
    footer: Chuẩn mực hàng đầu cho doanh nghiệp Self-managed, Ngân hàng & On-premise
```

```visual
kind: anatomy
title: "Giải Phẫu 7 Từ Khoá Xương Sống Trong .gitlab-ci.yml [!badge:emerald:Core DSL]"
subtitle: Nắm vững 7 từ khoá gốc này là bạn đọc hiểu và tự viết được 95% đường ống GitLab CI thực tế
items:
  - keyword: "default:"
    role: Cấu hình gốc toàn cục
    tone: sky
    summary: Thiết lập môi trường mặc định chung cho toàn bộ các Job không khai báo riêng (thay cho kiểu đặt `image:` trôi nổi ở cấp gốc ngày xưa).
    bullets:
      - "Chứa `image: node:22-alpine`, `cache`, `before_script`, `timeout` dùng chung"
    example: "default:\n  image: node:22-alpine"
    lang: yaml
  - keyword: "stages:"
    role: Trục giai đoạn tuần tự
    tone: violet
    summary: Định nghĩa danh sách thứ tự các chặng lớn của đường ống từ đầu tới cuối.
    bullets:
      - "Mặc định mọi Job ở stage trước phải xong 100% thì stage sau mới bắt đầu"
    example: "stages: [install, test, build, deploy]"
    lang: yaml
  - keyword: "script:"
    role: Mảng lệnh thực thi
    tone: emerald
    summary: "Tương đương mảng `steps: - run:` bên GitHub Actions — chứa các câu lệnh shell chạy tuần tự trong container."
    bullets:
      - "Dừng ngay lập tức và đánh đỏ Job nếu bất kỳ dòng lệnh nào trả mã thoát khác `0`"
    example: "script:\n  - npm ci --cache .npm --prefer-offline\n  - npm test"
    lang: yaml
  - keyword: "needs:"
    role: Đồ thị vượt rào DAG
    tone: cyan
    summary: Cho phép Job chạy ngay khi đúng Job phụ thuộc hoàn tất mà không cần đợi cả stage trước.
    bullets:
      - "Viết mảng rỗng ==`needs: []`== để Job xuất phát **ngay lập tức ở giây thứ 0**"
      - "Chỉ tải đúng `artifacts` của các Job được liệt kê trong `needs:`"
    example: "lint_code:\n  stage: test\n  needs: []"
    lang: yaml
  - keyword: "cache:"
    role: Bộ đệm thư viện nội bộ
    tone: amber
    summary: Lưu đệm thư mục nằm **bên trong `$CI_PROJECT_DIR`** (như `.npm/`) khoá theo mã băm lockfile.
    bullets:
      - "`policy: pull-push` cho Job đầu nguồn ghi cache · ==`policy: pull`== cho Job hạ nguồn chỉ đọc"
    example: "cache:\n  key: { files: [package-lock.json] }\n  paths: [.npm/]\n  policy: pull"
    lang: yaml
  - keyword: "artifacts:"
    role: Sản phẩm bàn giao giữa Stage
    tone: emerald
    summary: Đóng gói thư mục biên dịch (`dist/`, báo cáo coverage) lưu lên GitLab Coordinator kèm hạn xoá `expire_in`.
    bullets:
      - "**Khác biệt lớn với GitHub Actions:** Các Job thuộc stage sau **tự động tải xuống toàn bộ artifacts** của các stage trước mà không cần viết bước download thủ công!"
    example: "artifacts:\n  paths: [\"dist/\"]\n  expire_in: \"7 days\""
    lang: yaml
  - keyword: "parallel:"
    role: Nhân bản chia mảnh tự động
    tone: sky
    summary: Tự động tách 1 Job kiểm thử thành `N` container chạy song song chỉ bằng một con số nguyên.
    bullets:
      - "Cấp sẵn biến **`$CI_NODE_INDEX`** (`1..N`) và **`$CI_NODE_TOTAL`** (`N`)"
    example: "parallel: 4\nscript:\n  - npx vitest run --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL"
    lang: yaml
```

---

## 2. Phá vỡ rào cản tuần tự của `stages` bằng Đồ thị `needs:`

Theo mô hình truyền thống của GitLab CI, các Job được gom vào từng giai đoạn trong `stages: [install, test, build, deploy]`. Mặc định, **toàn bộ mọi Job ở stage trước phải chạy xong 100% thì các Job ở stage sau mới được phép rục rịch bắt đầu**!

Điều này gây tắc nghẽn vô lý khi một Job kiểm tra cú pháp cấu hình hoặc `lint_code` nhẹ nhàng lại phải ngồi chờ một Job biên dịch nặng nề khác ở stage trước. Từ khoá ==`needs:`== kích hoạt bộ điều phối **DAG (Directed Acyclic Graph)** giải quyết triệt để nút thắt này:

- [x] **Viết `needs: []` (mảng rỗng):** Cho phép Job **phớt lờ hoàn toàn rào cản thứ tự `stages` và xuất phát ngay lập tức ở giây thứ 0** ngay khi Pipeline vừa khởi tạo!
- [x] **Viết `needs: ["install_deps"]`:** Chỉ cần đúng một mình `install_deps` xong là chạy luôn, đồng thời chỉ tải gọn `artifacts` của những Job nằm trong danh sách `needs` để tiết kiệm băng thông mạng.

```visual
kind: flow
title: Luồng Điều Phối Kết Hợp Stages + Needs DAG + Cache Policy Chuẩn Mực
subtitle: Tối ưu đồng thời tốc độ xuất phát ở giây 0, cache chỉ đọc cho nhánh test và cổng chặn duyệt tay ở cuối đường ống
steps:
  - icon: package
    badge: "Stage: install"
    title: install_deps
    desc: Ghi bộ đệm .npm/ chuẩn từ package-lock.json cho toàn pipeline
    code: "policy: pull-push"
    tone: amber
    edge: "needs: [] (0s) & pull"
  - icon: zap
    badge: "Stage: test · 4 Shards"
    title: lint (0s) & unit_test
    desc: lint chạy ngay giây 0 nhờ needs:[]; test chia 4 mảnh chỉ đọc cache
    code: "parallel: 4 · policy: pull"
    tone: sky
    edge: "xuất dist/"
  - icon: layers
    badge: "Stage: build"
    title: build_app
    desc: Biên dịch TypeScript và đóng gói artifacts dist/ (hạn 7 ngày)
    code: "artifacts: [\"dist/\"]"
    tone: violet
    edge: "tự tải dist/ + Manual Gate"
  - icon: shield-check
    badge: "Stage: deploy"
    title: deploy_prod
    desc: Tự có sẵn dist/; dừng chờ bấm nút Play thực sự trước khi lên Prod
    code: "when: manual · allow_failure: false"
    tone: emerald
```

---

## 3. Quản trị Cache chuẩn mực trên GitLab: `key.files` & `policy: pull-push` vs `pull`

Khác với GitHub Actions nơi `~/.npm` nằm ngoài thư mục dự án, GitLab Runner **chỉ cho phép lưu đệm các đường dẫn nằm bên trong thư mục làm việc của dự án (`$CI_PROJECT_DIR`)**.

Vì vậy, công thức vàng cho Node.js trên GitLab CI là trỏ bộ đệm npm vào `.npm/` ngay trong dự án (`npm ci --cache .npm --prefer-offline`) và phân tách rạch ròi chính sách đọc/ghi:

- [>] **Mặc định toàn cục (`policy: pull`):** Mọi Job kiểm thử hạ nguồn chỉ kéo `.npm/` về đọc, **bỏ qua hoàn toàn bước nén và đẩy ngược cache lên cuối Job** để tiết kiệm hàng chục giây I/O.
- [>] **Duy nhất Job đầu nguồn (`policy: pull-push`):** Chỉ riêng `install_deps` được quyền ghi cập nhật cache khi `package-lock.json` thay đổi.

```yaml
default:
  image: node:22-alpine
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - .npm/
    policy: pull              # Mặc định mọi Job chỉ kéo cache về ĐỌC (nhanh & sạch!)

stages: [install, test, build, deploy]

install_deps:
  stage: install
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - .npm/
    policy: pull-push         # CHỈ duy nhất Job đầu nguồn này được phép GHI cập nhật cache!
  script:
    - npm ci --cache .npm --prefer-offline

unit_test:
  stage: test
  needs: ["install_deps"]
  parallel: 4                 # Tự cấp $CI_NODE_INDEX (1..4) và $CI_NODE_TOTAL (4)
  script:
    - npm ci --cache .npm --prefer-offline
    - npx vitest run --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

---

## 4. Khai tử `only/except` — Chuyển hẳn sang chuẩn hiện đại `rules:`

Trong các tài liệu cũ giai đoạn 2019–2020, bạn có thể bắt gặp từ khoá `only: [main]` hoặc `except: [tags]`. GitLab đã chính thức **ngừng phát triển và khuyến nghị loại bỏ hoàn toàn `only:` / `except:`** vì chúng không hỗ trợ biểu thức logic kết hợp và rất dễ gây lỗi nhân đôi đường ống (*Duplicate Pipelines* chạy trùng giữa nhánh và Merge Request).

```visual
kind: compare
title: "Cú Pháp Điều Kiện Chạy Job: Cũ Kỹ (only/except) vs Hiện Đại (rules:)"
subtitle: "Khối rules: duyệt tuần tự từ trên xuống dưới như câu lệnh switch-case và kiểm soát chặt cổng duyệt tay Production"
left:
  badge: "ĐÃ LỖI THỜI · Ngừng khuyến nghị"
  title: "Cú pháp cũ only: / except: & Bẫy Manual"
  tone: rose
  code: |
    deploy_prod:
      stage: deploy
      only:
        - main
      when: manual
      # BẪY NGẦM: Thiếu allow_failure: false!
      # Mặc định when: manual mang allow_failure: true
      script:
        - ./scripts/deploy.sh production
  lang: yaml
  bullets:
    - "`only:` và `except:` không còn được GitLab phát triển thêm, khó viết điều kiện kết hợp `$CI_PIPELINE_SOURCE`"
    - "**Bẫy cực dễ nhầm:** Khi đặt `when: manual` mà quên ghi `allow_failure: false`, GitLab mặc định coi bước đó là **tuỳ chọn (`allow_failure: true`)** — không chặn trạng thái Xanh chung của Pipeline!"
right:
  badge: "CHUẨN HIỆN ĐẠI 2026 · Blocking Gate"
  title: "Khối rules: tường minh kèm allow_failure: false"
  tone: emerald
  code: |
    deploy_prod:
      stage: deploy
      script:
        - ./scripts/deploy.sh production
      rules:
        - if: '$CI_COMMIT_BRANCH == "main"'
          when: manual
          allow_failure: false
  lang: yaml
  bullets:
    - "Dùng hoàn toàn ==`rules:`== với các biến ngữ cảnh rõ ràng như `$CI_COMMIT_BRANCH` và `$CI_PIPELINE_SOURCE`"
    - "Đi kèm ==`allow_failure: false`== cạnh `when: manual` biến Job thành **Blocking Manual Action** — bắt buộc Quản lý Kỹ thuật bấm nút Play mới hoàn tất phát hành!"
```

> [!WARNING] Nhớ nằm lòng giới hạn đường dẫn Cache của GitLab Runner!
> Đừng bao giờ viết `paths: ["~/.npm"]` hay `/root/.npm` trong `.gitlab-ci.yml` — GitLab Runner sẽ báo cảnh báo bỏ qua ngay vì đường dẫn nằm ngoài `$CI_PROJECT_DIR`. Hãy luôn dùng thư mục con tương đối như `.npm/` kèm `--cache .npm`!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`default:`** khai báo `image: node:22-alpine` chung ở đầu tệp · **`artifacts:`** tự động tải xuống ở các stage sau mà không cần bước download thủ công.
> - **`needs: []`** giúp Job xuất phát ngay ở giây `0` · **`cache: { policy: pull }`** giúp Job test chỉ đọc cache không nén đẩy lại.
> - **`parallel: 4`** tự sinh cặp biến **`$CI_NODE_INDEX`** (`1..4`) và **`$CI_NODE_TOTAL`** (`4`).
> - Thay thế hoàn toàn `only/except` bằng **`rules:`**, và luôn gắn **`allow_failure: false`** vào bước `when: manual` chặn cổng Production!

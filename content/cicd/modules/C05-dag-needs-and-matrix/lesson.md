# Đồ thị phụ thuộc Job (`DAG needs`) & Ma trận kiểm thử (`Strategy Matrix`)

Khi dự án Node.js lớn dần, một Job duy nhất chạy nối tiếp `lint` (2 phút) -> `typecheck` (2 phút) -> `unit-test` (5 phút) -> `build` (3 phút) sẽ khiến lập trình viên phải chờ **12 phút** cho mỗi lần đẩy code.

Để rút ngắn thời gian phản hồi, các hệ thống CI hiện đại điều phối công việc theo mô hình **DAG (*Directed Acyclic Graph* — Đồ thị có hướng không chu trình)**: các bước không phụ thuộc vào nhau (như `lint`, `typecheck`, `unit-test`) được chạy **song song cùng lúc**, và chỉ bước tổng hợp (`build`) mới cần đợi tất cả các bước trước hoàn thành thông qua từ khóa **`needs:`**. Trong lập trình JavaScript/Python, cơ chế này tương đương với **`await Promise.all([lint(), typecheck(), unitTest()])`** rồi mới gọi `await build()`. (Có thể hình dung tương tự như dây chuyền sản xuất nơi khâu làm khung, kiểm tra động cơ và làm nội thất chạy đồng thời trước khi đưa vào khâu lắp ráp cuối).

```visual
kind: illustration
diagram: "cicd:c05"
src: "/illustrations/cicd/cicd-dag-fanout-matrix.jpg"
alt: "Đồ thị phụ thuộc DAG Fan-Out / Fan-In với từ khoá needs: và ma trận kiểm thử đa chiều strategy.matrix kèm fail-fast: false"
title: "Đồ thị phụ thuộc DAG (needs:) & Ma trận kiểm thử (strategy.matrix)"
subtitle: "Chạy song song các cổng kiểm tra độc lập và kiểm thử chéo đa hệ điều hành không cần lặp lại cấu hình YAML"
caption: "Kiến trúc Fan-Out / Fan-In rút ngắn thời gian thực thi và ma trận 3 OS x 2 phiên bản Node với tùy chọn fail-fast: false"
callouts:
  - num: 1
    label: "Fan-Out song song ngay từ giây thứ 0"
    desc: "Các Root Job không khai báo needs (lint, typecheck, unit-test) xuất phát đồng thời trên các máy ảo riêng để ép ngắn thời gian chờ."
    tone: sky
  - num: 2
    label: "Cổng hội tụ Fan-In với logic AND nghiêm ngặt"
    desc: "Job build có needs: [lint, typecheck, unit-test] chỉ khởi chạy khi tất cả các nhánh trước đều xanh; 1 nhánh đỏ sẽ tự động bỏ qua build."
    tone: emerald
  - num: 3
    label: "Ma trận strategy.matrix & Cờ fail-fast: false"
    desc: "Nhân tự động tổ hợp OS x Node; đặt fail-fast: false giúp các tổ hợp còn lại vẫn chạy hết để thu thập trọn vẹn bức tranh lỗi đa nền tảng."
    tone: cyan
```

## 1. Kiến trúc Fan-Out / Fan-In với `needs:`

Mặc định mọi Job khai báo dưới `jobs:` đều khởi chạy **song song ngay giây thứ 0** (gọi là các *Root Jobs* — **Fan-Out**). Khi bạn thêm `needs: [lint, unit-test]` vào Job `build`, bạn tạo ra một cổng hội tụ (**Fan-In**):

```visual
kind: flow
title: "Đồ Thị Phụ Thuộc DAG: Quạt Rộng Song Song (Fan-Out) & Hội Tụ (Fan-In)"
subtitle: "Ví dụ thực tế: lint (2p) và unit-test (5p) chạy song song -> hội tụ vào build (3p) chỉ tốn max(2, 5) + 3 = 8 phút thay vì 10 phút!"
steps:
  - icon: git-pr
    badge: "Giây 0 · Kích hoạt"
    title: "Push / Pull Request"
    desc: "Đánh thức đồng thời mọi Root Job không khai báo needs"
    code: "on: [push, pull_request]"
    tone: sky
    edge: "Fan-Out song song"
  - icon: zap
    badge: "Song song · max(2p, 5p)"
    title: "lint (2p) + unit-test (5p)"
    desc: "Chạy đồng thời trên 2 máy ảo độc lập giống hệt Promise.all"
    code: "Wall-clock: 5 phút"
    tone: cyan
    edge: "Fan-In (AND)"
  - icon: package
    badge: "Cổng hội tụ · +3p"
    title: "Job: build"
    desc: "Chỉ chạy khi TẤT CẢ Job trong needs đều xanh (1 nhánh đỏ -> Skipped!)"
    code: "needs: [lint, unit-test]"
    tone: cyan
    edge: "nhánh main?"
  - icon: rocket
    badge: "Triển khai có điều kiện"
    title: "Job: deploy-staging"
    desc: "Dừng sau build nếu là PR; tự động đẩy lên Staging khi merge vào main"
    code: "needs: build"
    tone: emerald
footer: "Chữ 'Acyclic' trong DAG cấm tuyệt đối vòng lặp phụ thuộc (ví dụ A needs B và B needs A sẽ bị từ chối ngay lúc kiểm tra cú pháp!)"
```

- [x] **Tiết kiệm thời gian đồng hồ thực (*Wall-clock time*):** Tổng thời gian chờ rút từ `2 + 5 + 3 = 10 phút` xuống còn `max(2, 5) + 3 = 8 phút` (càng nhiều nhánh như `typecheck`, `security-scan` thì tốc độ rút ngắn càng ngoạn mục).
- [x] **Logic cổng `AND` chặt chẽ:** Nếu `lint` thất bại (`Exit Code 1`) dù `unit-test` xanh (`Exit Code 0`), Job `build` vẫn lập tức chuyển sang trạng thái **`Skipped`**, không tốn một xu tiền máy ảo đóng gói code hỏng.
- [x] **Chặn nhánh triển khai trên PR:** Job `deploy-staging` kết hợp `needs: build` và `if: github.ref == 'refs/heads/main'` để chỉ triển khai khi code đã gộp vào nhánh chính.

## 2. Kiểm thử đa môi trường với `strategy.matrix` và tùy chọn `fail-fast`

Giả sử bạn phát triển một gói thư viện/CLI cần đảm bảo hoạt động ổn định trên nhiều phiên bản Node (**`20`**, **`22`**) và nhiều hệ điều hành (`ubuntu-latest`, `macos-latest`, `windows-latest`). Thay vì sao chép thành 6 Job riêng lẻ, ==`strategy.matrix`== tự động tạo tích Đề-các (`3 hệ điều hành × 2 phiên bản Node = 6` lượt Job song song):

```yaml
unit-test:
  runs-on: ${{ matrix.os }}
  strategy:
    fail-fast: false
    matrix:
      os: [ubuntu-latest, macos-latest]
      node: [20, 22]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node }}
        cache: "npm"
    - run: npm ci
    - run: npm test
```

```visual
kind: compare
title: "Hành vi mặc định của strategy.fail-fast khi chạy Matrix"
subtitle: "Một dòng cấu hình quyết định việc nhận đầy đủ kết quả chẩn đoán hay dừng toàn bộ các tổ hợp còn lại"
left:
  badge: "MẶC ĐỊNH · fail-fast: true"
  title: "Một tổ hợp lỗi -> Hủy ngay toàn bộ các Job còn lại"
  tone: rose
  code: |
    strategy:
      # Không khai báo -> Mặc định là fail-fast: true!
      matrix:
        os: [ubuntu-latest, macos-latest]
        node: [20, 22]
  lang: yaml
  bullets:
    - "Khi tổ hợp `(macos-latest, Node 20)` gặp lỗi ở phút thứ 3, GitHub lập tức gửi lệnh **`Cancel` hủy luôn 3 máy ảo đang chạy dở**."
    - "Bạn thiếu thông tin chẩn đoán: không biết lỗi đó chỉ xảy ra trên Node 20 hay cả Node 22 trên Ubuntu cũng gặp phải."
    - "Chỉ phù hợp khi dùng Runner chi phí cao và chỉ cần biết nhanh có lỗi hay không."
right:
  badge: "KHUYÊN DÙNG · fail-fast: false"
  title: "Giữ các tổ hợp còn lại chạy nốt để gom trọn vẹn kết quả"
  tone: emerald
  code: |
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest]
        node: [20, 22]
  lang: yaml
  bullets:
    - "Tổ hợp lỗi cứ báo đỏ, nhưng **3 tổ hợp kia vẫn chạy tới cùng** để trả về bảng tương thích đầy đủ ngay trong 1 lần chạy"
    - "Chuẩn mực bắt buộc cho kiểm thử đa phiên bản Node/OS và chia mảnh Test Sharding"
    - "Kết hợp thêm `exclude:` để cắt bớt tổ hợp thừa hoặc `include:` để gắn biến đặc thù"
```

> [!WARNING] Bài toán kinh tế trên kho Private: Cẩn trọng hệ số nhân cước của `macos-latest`!
> Trên các kho mã nguồn Private, GitHub tính cước phút chạy theo hệ số nhân hệ điều hành: **`macos-latest` đắt gấp khoảng 10 lần** máy ảo Linux `ubuntu-latest` (và `windows-latest` đắt gấp khoảng **2 lần**)! Vì vậy hãy dùng `exclude:` để chỉ bật `macos-latest` trên đúng phiên bản Node LTS cần thiết khi công cụ của bạn thực sự chạm tới hệ thống tệp hoặc binary đặc thù của macOS.

## 3. Truyền dữ liệu giữa các Job qua `jobs.<id>.outputs`

Ở bài `C04`, ta đã dùng `"$GITHUB_OUTPUT"` để truyền dữ liệu giữa hai Step **trong cùng một Job**. Nhưng vì hai Job chạy trên hai máy ảo tách biệt, mọi Step output mặc định chỉ tồn tại trong phạm vi Job đó. Để truyền số phiên bản `version` từ Job `build` sang Job `deploy`, bạn cần khai báo đủ ==3 bước liên kết==:

```visual
kind: flow
title: "Quy trình 3 bước truyền dữ liệu giữa hai Job độc lập"
subtitle: "Thiếu bất kỳ bước nào (đặc biệt là bước 2) sẽ khiến giá trị bên nhận thành chuỗi rỗng \"\""
steps:
  - icon: terminal
    badge: "Mắt xích 1 · Trong Step"
    title: "Ghi $GITHUB_OUTPUT"
    desc: "Step gắn id: pkg và ghi giá trị vào tệp output nội bộ"
    code: "echo \"version=1.4.2\" >> \"$GITHUB_OUTPUT\""
    tone: sky
    edge: "ánh xạ lên vỏ Job"
  - icon: upload
    badge: "Mắt xích 2 · Vỏ Job nguồn"
    title: "jobs.build.outputs"
    desc: "Phơi bày tường minh giá trị từ Step ra giao diện ngoài của Job build"
    code: "outputs: { version: ${{ steps.pkg.outputs.version }} }"
    tone: amber
    edge: "ràng buộc needs"
  - icon: rocket
    badge: "Mắt xích 3 · Job đích"
    title: "needs.build.outputs"
    desc: "Job deploy khai báo needs: build và đọc qua ngữ cảnh needs"
    code: "${{ needs.build.outputs.version }}"
    tone: emerald
```

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.pkg.outputs.version }}   # Mắt xích 2: Phơi bày ra vỏ Job!
    steps:
      - uses: actions/checkout@v4
      - id: pkg                                   # Mắt xích 1: Step có id rõ ràng
        run: echo "version=$(node -p \"require('./package.json').version\")" >> "$GITHUB_OUTPUT"

  deploy:
    needs: build                                  # Mắt xích 3a: Bắt buộc có needs
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying release v${{ needs.build.outputs.version }}" # Mắt xích 3b
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **DAG `needs:`** hoạt động như `Promise.all` (logic `AND`, cấm chu trình lặp `A <-> B`), rút tổng thời gian về `max(các nhánh song song) + bước hội tụ`.
> - Số Job của `strategy.matrix` bằng **tích Đề-các** các chiều; mặc định là `fail-fast: true` nên hãy chủ động đặt **`fail-fast: false`** để xem trọn vẹn bảng lỗi, và lưu ý `macos-latest` tốn phút gấp ~10x Linux trên repo Private.
> - Truyền dữ liệu giữa 2 Job luôn cần đủ 3 mắt xích: **`"$GITHUB_OUTPUT"` -> `jobs.<id>.outputs` -> `needs.<id>.outputs`**.

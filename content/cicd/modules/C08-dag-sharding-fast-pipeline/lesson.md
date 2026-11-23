# Tối ưu tốc độ Pipeline: Đồ thị DAG, Test Sharding, Docker Buildx Cache và Polling Healthcheck

Khi dự án Node.js mới khởi tạo, toàn bộ CI Pipeline có thể chỉ mất khoảng 90 giây. Nhưng khi dự án mở rộng với hàng trăm bài kiểm thử E2E Playwright và Docker image đa tầng, thời gian chạy pipeline dễ tăng lên tới **42 phút**, làm chậm chu kỳ phản hồi và gián đoạn công việc của đội ngũ phát triển.

Trong bài học này, chúng ta áp dụng ==phương pháp phân tích đường găng (Critical Path Analysis)== để rút ngắn thời gian chờ từ 42 phút xuống dưới **6 phút** bằng 4 kỹ thuật tối ưu:

```visual
kind: compare
title: "Đối Chiếu Kiến Trúc: Pipeline Tuần Tự 42 Phút vs DAG + Sharding Dưới 6 Phút"
subtitle: "Tổng thời gian chờ của lập trình viên không phụ thuộc vào tổng số việc, mà phụ thuộc vào nhánh dài nhất (Critical Path)"
left:
  badge: "CHẬM · Chạy tuần tự (Serial)"
  title: "Cộng dồn mọi bước + chờ cứng bằng sleep 30"
  tone: rose
  code: |
    # 1 máy ảo chạy nối tiếp từ đầu tới cuối:
    lint (2p) -> typecheck (3p) -> unit-test (5p)
      -> docker build không cache (8p)
      -> sleep 30 + playwright E2E 400 bài (16p+)
    # => Tổng Đường găng: ~35 - 42 phút!
  lang: text
  bullets:
    - "Thời gian chờ bằng **tổng cộng dồn** tất cả các bước (`2 + 3 + 5 + ...`)"
    - "Mất bộ đệm lớp Docker `builder` mỗi lần cấp Runner mới"
    - "400 bài Playwright chạy trên 1 máy duy nhất kéo dài 16 phút, thêm `sleep 30` dễ gây lỗi chập chờn (*Flaky*)"
right:
  badge: "TỐC ĐỘ CAO · DAG + Sharding 4 Mảnh"
  title: "Chạy song song tối đa + Test Sharding + Buildx Cache"
  tone: emerald
  code: |
    # Xuất phát đồng thời ngay giây thứ 0:
    ├─ lint (2p) ──────────────────────────┐
    ├─ typecheck (3p) ─────────────────────┤
    ├─ unit-test (5p) ─────────────────────┼─► gate (1p)
    ├─ docker buildx cache mode=max (2p) ──┤
    └─ e2e shard [1/4..4/4] (16p/4 = 4p) ──┘
    # => Tổng Đường găng: max(2, 3, 5, 2, 4) + 1 = 6 phút!
  lang: text
  bullets:
    - "Đường găng của cụm kiểm tra song song rút về đúng nhánh dài nhất: **`max(2, 3, 5) + 1 = 6 phút`** (thay vì `2 + 3 + 5 + 1 = 11 phút`)"
    - "16 phút Playwright chia đều cho 4 máy (`--shard=1/4` .. `4/4`) chỉ còn **4 phút**"
    - "Tất cả hội tụ về 1 cổng nhẹ **`gate`** duy nhất để khai báo trong Branch Protection"
```

## 1. Phân tích Đường găng (Critical Path) & Mẫu cổng hội tụ `gate`

```visual
kind: illustration
diagram: "cicd:c08"
alt: "Tối ưu đường găng Critical Path từ 42 phút tuần tự xuống 5 phút nhờ DAG song song, chia mảnh Playwright 4 Shards, Buildx Cache và cổng hội tụ Gate"
title: "Tối ưu đường găng (Critical Path): Giảm thời gian Pipeline từ 42 phút xuống dưới 5 phút"
subtitle: "Khắc phục nút thắt tuần tự bằng kỹ thuật Test Sharding, Docker Buildx Cache và một cổng tổng hợp duy nhất"
caption: "So sánh pipeline tuần tự 42 phút với kiến trúc chạy song song kết hợp chia 4 mảnh kiểm thử và cổng hội tụ All-Green Gate"
callouts:
  - num: 1
    label: "Thay thế sleep cố định & Bật Buildx Layer Cache"
    desc: "Thay sleep 45 bằng vòng lặp thăm dò /healthz chính xác từng giây và bật cache-to: type=gha,mode=max rút ngắn đóng gói Docker còn ~1.8 phút."
    tone: emerald
  - num: 2
    label: "Chia mảnh kiểm thử E2E Sharding (1/4 .. 4/4)"
    desc: "Phân bổ 400 bài Playwright đều cho 4 máy ảo chạy song song với --shard=i/4, giảm nhánh dài nhất từ 16 phút xuống 4 phút."
    tone: cyan
  - num: 3
    label: "Mẫu cổng tổng hợp duy nhất (Aggregator Gate)"
    desc: "Gom toàn bộ kết quả nhánh song song về 1 Job nhẹ ci-gate (if: always()) để chỉ cần khai báo duy nhất 1 tên cổng trong Branch Protection."
    tone: emerald
```

Giả sử bạn có 3 Job độc lập: `lint` (2 phút), `typecheck` (3 phút), `unit-test` (5 phút), rồi gom về một Job tổng hợp nhẹ `gate` (1 phút, khai báo `needs: [lint, typecheck, unit-test]`):

```visual
kind: flow
title: "Kiến Trúc All-Green Aggregator Gate & Chia Mảnh E2E Sharding"
steps:
  - icon: git-commit
    badge: "Giây 0 · Fan-Out"
    title: "Commit / PR Mới"
    desc: "Kích hoạt đồng thời tất cả các nhánh kiểm tra độc lập"
    code: "Parallel Root Jobs"
    tone: sky
    edge: "chạy đồng thời"
  - icon: cpu
    badge: "Nhánh tĩnh & Unit · max 5p"
    title: "lint · typecheck · unit"
    desc: "3 Job độc lập hoàn tất trong max(2p, 3p, 5p) = 5 phút"
    code: "Critical Path: 5m"
    tone: cyan
    edge: "song song với E2E"
  - icon: boxes
    badge: "Sharding 4 máy · 4p"
    title: "Playwright 1/4 .. 4/4"
    desc: "4 Runner gánh mỗi máy 25% số bài test E2E cùng lúc (16p / 4 = 4p)"
    code: "--shard=${{ matrix.shard }}/4"
    tone: cyan
    edge: "Fan-In hội tụ"
  - icon: shield-check
    badge: "Cổng khoá nhánh · +1p"
    title: "Aggregator Job: gate"
    desc: "Chốt chặn duy nhất cần tích chọn trong GitHub Branch Protection Rules!"
    code: "Tổng cộng: 5p + 1p = 6p"
    tone: emerald
```

> [!TIP] Lợi ích thực dụng của mẫu thiết kế "All-Green Aggregator Gate"
> Trên cài đặt **Branch Protection Rules** của GitHub, thay vì phải tích chọn bắt buộc hàng chục tên Job lẻ tẻ (mỗi lần thêm bớt mảnh Matrix hay đổi tên Job lại phải nhờ Admin vào Settings sửa tay), bạn chỉ cần bắt buộc duy nhất trạng thái xanh của Job hội tụ **`gate`**!

## 2. Chạy song song bộ kiểm thử E2E với kỹ thuật **Test Sharding** (`1/4` .. `4/4`)

Cả **Playwright** lẫn **Vitest** năm 2026 đều tích hợp sẵn cờ chia mảnh **`--shard=<chỉ-số-mảnh>/<tổng-số-mảnh>`** (ví dụ mảnh thứ 3 trên tổng 4 mảnh truyền vào chính xác chuỗi ==`--shard=3/4`==). Kết hợp cùng `strategy.matrix` và ==`fail-fast: false`==, ta cắt ngang 16 phút xuống còn 4 phút:

```yaml
e2e-playwright:
  runs-on: ubuntu-latest
  timeout-minutes: 15
  strategy:
    fail-fast: false        # BẮT BUỘC: 1 mảnh lỗi vẫn để 3 mảnh kia chạy hết gom trọn báo cáo!
    matrix:
      shard: [1, 2, 3, 4]
  steps:
    - uses: actions/checkout@v4
    # ... cài đặt dependencies & trình duyệt Chromium ...
    - name: Run Playwright shard ${{ matrix.shard }}/4
      run: npx playwright test --shard=${{ matrix.shard }}/4

    - name: Upload HTML report even when tests fail
      if: ${{ !cancelled() }}
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report-shard-${{ matrix.shard }}
        path: playwright-report/
        retention-days: 7
```

> [!WARNING] Quên `if: ${{ !cancelled() }}` là mất trắng báo cáo đúng lúc cần nhất!
> Mặc định mọi Step mang điều kiện ngầm `if: success()`. Nếu không khai báo rõ ==`if: ${{ !cancelled() }}`== (hoặc `if: always()`) trên bước `actions/upload-artifact@v4`, ngay khi `npx playwright test` phát hiện lỗi và trả mã thoát `1`, bước tải báo cáo phía dưới sẽ bị **bỏ qua (`skipped`)** — khiến bạn mất sạch ảnh chụp màn hình lỗi!

## 3. Docker Buildx Cache (`type=gha,mode=max`) & Thay `sleep` cố định bằng Healthcheck

```visual
kind: groups
title: "Tối ưu Docker Buildx Cache và thay thế sleep bằng Polling Healthcheck [!badge:amber:Speed & Stability]"
columns: 2
items:
  - num: 1
    icon: layers
    title: "Docker Buildx Cache (mode=max)"
    badge: "Giữ trọn cả tầng builder"
    tone: sky
    desc: "Máy ảo Ephemeral Runner không có sẵn lớp Docker cũ trên ổ đĩa cục bộ, nên phải lưu đệm qua GitHub Actions Cache Backend."
    bullets:
      - "**`cache-from: type=gha`** kéo lại các lớp đã biên dịch từ lượt chạy trước"
      - "**`cache-to: type=gha,mode=max`** lưu đệm **TẤT CẢ các stage trung gian** (kể cả stage `builder` chạy `npm ci` + `tsc` trong Multi-stage Dockerfile), vượt trội hoàn toàn so với `mode=min` mặc định chỉ lưu stage `runner` cuối cùng!"
    code: |
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: false
          tags: ghcr.io/acme/shop-api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
    codeLang: yaml
  - num: 2
    icon: activity
    title: "Thăm dò Sẵn sàng Xác định (Polling)"
    badge: "Loại bỏ lệnh sleep 30"
    tone: emerald
    desc: "Thay thế thói quen đoán mò thời gian khởi động server bằng vòng lặp kiểm tra cổng /healthz chuẩn xác."
    bullets:
      - "**Tác hại kép của `sleep 30`:** Hôm máy khoẻ bật xong sau 3s -> vứt phí 27s vô nghĩa; hôm đám mây bận bật mất 32s -> phát sinh lỗi giả `ECONNREFUSED` tạo ra **Flaky Pipeline**!"
      - "Dùng `curl --retry --retry-connrefused` giúp đi tiếp ngay giây thứ 4 khi `/healthz` trả `200 OK`, đồng thời chịu tải bền bỉ tới `15 * 2 = 30s` nếu hạ tầng chậm"
    code: |
      npm start &
      curl --fail --retry 15 --retry-connrefused \
        --retry-delay 2 http://localhost:3000/healthz
      npx playwright test
    codeLang: bash
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Đường găng (Critical Path)** của cụm DAG song song bằng `max(thời gian các nhánh)` + bước hội tụ **`gate`** (dùng `gate` làm chốt chặn duy nhất trên Branch Protection).
> - **Test Sharding** (`--shard=1/4` .. `4/4`): Luôn đi kèm **`fail-fast: false`** và gắn **`if: ${{ !cancelled() }}`** vào bước `upload-artifact@v4` để không mất báo cáo khi test đỏ.
> - **Multi-stage Docker trên CI:** Bật `cache-from: type=gha` và **`cache-to: type=gha,mode=max`** để lưu cả tầng `builder`.
> - **Thay thế `sleep 30`:** Dùng vòng lặp thăm dò xác định `curl --fail --retry 15 --retry-connrefused http://localhost:3000/healthz`.

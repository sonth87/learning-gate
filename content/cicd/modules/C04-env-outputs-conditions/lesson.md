# Biến môi trường, `$GITHUB_OUTPUT`, Điều kiện `if` & Bộ lọc đường dẫn

Một tệp workflow tĩnh chỉ chạy một mạch từ đầu tới cuối giống như một hàm JavaScript không có tham số, không có `return` và không có `if/else`. Để biến đường ống CI thành cỗ máy điều phối thông minh — biết truyền mã phiên bản giữa các bước, biết tự thu gom ảnh chụp lỗi khi bài kiểm thử E2E vấp ngã, và biết "ngủ yên" tiết kiệm tiền khi đồng nghiệp chỉ sửa dấu chấm câu trong `README.md` — bạn cần làm chủ 4 công cụ điều khiển luồng cốt lõi của GitHub Actions.

## 1. Phân cấp 3 tầng Biến môi trường (`env:`) — Phạm vi hẹp thắng phạm vi rộng

Tương tự quy tắc *Lexical Scope* trong JavaScript (biến cục bộ bên trong hàm ghi đè biến toàn cục bên ngoài), GitHub Actions cho phép khai báo khối `env:` ở **3 tầng phân cấp**:

```visual
kind: layers
title: "Tháp Ưu Tiên 3 Tầng Biến Môi Trường (env:) Trong GitHub Actions"
subtitle: "Khi trùng tên biến (ví dụ STAGE), tầng có phạm vi hẹp nhất sẽ luôn thắng tuyệt đối!"
columns:
  - title: "Thứ Tự Ghi Đè Từ Cao Xuống Thấp"
    badge: "Step > Job > Workflow"
    tone: emerald
    layers:
      - label: "Tầng 3: Step env (steps[i].env) — ƯU TIÊN CAO NHẤT"
        sub: "Chỉ sống trong duy nhất tiến trình của Step đó · Ghi đè cả Job lẫn Workflow"
        note: "Thắng tuyệt đối!"
        tone: emerald
      - label: "Tầng 2: Job env (jobs.<job_id>.env) — ƯU TIÊN TRUNG BÌNH"
        sub: "Áp dụng cho mọi Step bên trong Job đó · Ghi đè tầng Workflow"
        note: "Phạm vi cấp Job"
        tone: sky
      - label: "Tầng 1: Workflow env (Gốc tệp YAML) — ƯU TIÊN THẤP NHẤT"
        sub: "Đặt ngang hàng on: và jobs: · Giá trị mặc định chung cho toàn bộ tệp"
        note: "Mặc định toàn cục"
        tone: slate
    footer: "Trong khối run: đọc qua biến Shell $STAGE · Ở các trường YAML (if:, with:) đọc qua ${{ env.STAGE }}"
```

```yaml
env:
  STAGE: "global"             # Tầng 1: Mặc định toàn cục
jobs:
  check:
    runs-on: ubuntu-latest
    env:
      STAGE: "job-level"      # Tầng 2: Ghi đè "global"
    steps:
      - env:
          STAGE: "step-level" # Tầng 3: Ghi đè cả 2 tầng trên!
        run: echo "$STAGE"    # -> Kết quả in ra: step-level
```

## 2. Truyền dữ liệu giữa các Step bằng tệp môi trường `"$GITHUB_OUTPUT"`

Trong CI, mỗi Step là một tiến trình subshell riêng nên gõ `export SHA=abc` ở Step 1 sẽ biến mất sạch khi sang Step 2!

> [!WARNING] Cảnh báo bảo mật: Khai tử vĩnh viễn lệnh `::set-output` cũ!
> Trước năm 2023, nhiều tài liệu cũ hướng dẫn in ra màn hình `echo "::set-output name=sha::abc"`. GitHub đã **gỡ bỏ hoàn toàn `::set-output`** do lỗ hổng **Command Injection** (dữ liệu đầu vào chứa ký tự xuống dòng có thể tiêm lệnh giả mạo vào Runner).

Chuẩn bắt buộc năm 2026 là gắn định danh `id:` cho Step phát dữ liệu và ghi nối (`>>`) cặp `key=value` vào tệp môi trường ==`"$GITHUB_OUTPUT"`== (hoặc ghi vào ==`"$GITHUB_ENV"`== nếu muốn tiêm biến môi trường động cho các Step phía sau trong cùng Job):

```visual
kind: flow
title: "Cơ Chế Truyền Đầu Ra An Toàn Giữa Các Step Trong Cùng Một Job"
steps:
  - icon: terminal
    badge: "Step phát (id: build_meta)"
    title: "Ghi Vào $GITHUB_OUTPUT"
    desc: "Nối chuỗi key=value vào đường dẫn tệp tạm được bảo vệ của Runner"
    code: "echo \"image_tag=v1.2.0\" >> \"$GITHUB_OUTPUT\""
    tone: sky
    edge: "Runner lưu trữ"
  - icon: lock
    badge: "Bộ nhớ ngữ cảnh"
    title: "steps.<id>.outputs"
    desc: "GitHub tách biệt dữ liệu an toàn khỏi luồng log stdout thông thường"
    code: "steps.build_meta.outputs"
    tone: violet
    edge: "biểu thức ${{ }}"
  - icon: rocket
    badge: "Step nhận phía sau"
    title: "Đọc Giá Trị Đã Xuất"
    desc: "Sử dụng ở bất kỳ Step kế tiếp nào bên trong cùng Job đó"
    code: "${{ steps.build_meta.outputs.image_tag }}"
    tone: emerald
```

```yaml
steps:
  - name: Compute short commit SHA
    id: meta
    run: echo "sha=${GITHUB_SHA::7}" >> "$GITHUB_OUTPUT"

  - name: Print Docker tag
    run: echo "Image tag will be app:${{ steps.meta.outputs.sha }}"
```

## 3. Biểu thức điều kiện `if:` và 4 hàm kiểm tra trạng thái sống còn

Mặc định mọi Step mang điều kiện ngầm là `if: success()`. Để kiểm soát các nhánh rẽ như chỉ phát hành khi gộp vào `main` (`if: github.ref == 'refs/heads/main' && github.event_name == 'push'`) hoặc cứu hộ dữ liệu khám nghiệm lỗi, bạn cần nắm chắc **4 hàm trạng thái**:

```visual
kind: groups
title: "4 Hàm Kiểm Tra Trạng Thái Trong Điều Kiện if: [!badge:violet:Flow Control]"
columns: 2
items:
  - num: 1
    icon: check
    title: "success() (Mặc định ngầm)"
    badge: "Khi mọi bước trước đều xanh"
    tone: emerald
    bullets:
      - "Tự động áp dụng nếu bạn không viết dòng `if:` nào"
      - "Chỉ trả `true` khi tất cả các Step phía trên trong Job đều kết thúc với `Exit Code 0`"
  - num: 2
    icon: alert
    title: "failure()"
    badge: "Chỉ chạy khi có bước bị đỏ"
    tone: rose
    bullets:
      - "Trả `true` khi bất kỳ Step nào phía trước bị thất bại"
      - "**Ứng dụng vàng:** Gắn vào bước `Upload Playwright Screenshots` hoặc bắn cảnh báo Slack để thu thập tang vật ngay khi bài test E2E sập!"
  - num: 3
    icon: refresh
    title: "always()"
    badge: "Chạy bất chấp Xanh, Đỏ hay Cancel"
    tone: amber
    bullets:
      - "Luôn luôn thực thi kể cả khi bước trước lỗi hoặc người dùng bấm nút **Cancel** huỷ Job"
      - "Dành riêng cho bước dọn dẹp hạ tầng tạm thời (xoá test container/cloud sandbox tránh tốn tiền)"
  - num: 4
    icon: shield-check
    title: "!cancelled()"
    badge: "Chạy cả khi Xanh lẫn Đỏ (trừ khi Cancel)"
    tone: sky
    bullets:
      - "Kết hợp hàm `cancelled()`: chạy khi Job thành công HOẶC thất bại, nhưng dừng ngay nếu người dùng chủ động huỷ ngang"
      - "Lựa chọn tinh tế nhất để tải báo cáo HTML tổng hợp ở cuối bộ kiểm thử"
```

## 4. Bộ lọc đường dẫn (`paths` / `paths-ignore`) & Chống vòng lặp Push vô tận

Đừng đốt quỹ phút CI quý giá cho những thay đổi chỉ sửa tài liệu chữ nghĩa:
- [x] **`paths-ignore: ["**.md", "docs/**"]`**: Bỏ qua toàn bộ workflow nếu mọi tệp thay đổi trong commit/PR đều nằm trong danh sách tài liệu loại trừ.
- [x] **`paths: ["apps/api/**", "packages/shared/**"]`**: Chỉ kích hoạt kiểm thử dịch vụ API khi có tệp liên quan bị chạm tới.
- [!] **Quy tắc cú pháp sống còn:** Không được viết đồng thời cả `paths:` và `paths-ignore:` trên cùng một sự kiện `on.push`! Nếu muốn vừa lọc bao gồm vừa loại trừ trong cùng sự kiện, hãy dùng duy nhất `paths:` kèm dấu chấm than phủ định ==`!`== (ví dụ: `paths: ["apps/api/**", "!apps/api/**.md"]`).

> [!WARNING] Phòng chống thảm hoạ "Infinite Push Loop" (Vòng lặp tự kích hoạt vô tận)
> Nếu một Job lắng nghe `on: push` lại tự động sửa `CHANGELOG.md` / số phiên bản rồi chạy `git commit` và `git push` bằng **Personal Access Token (PAT)**, cú push đó sẽ được GitHub coi như người thật đẩy code -> bắn tiếp sự kiện `push` mới -> kích hoạt lại chính workflow đó hàng nghìn lần không điểm dừng!
>
> Luôn khoá chặt bằng **3 lớp chốt an toàn**:
> 1. Ưu tiên dùng **`GITHUB_TOKEN` mặc định** (sự kiện tạo bởi `GITHUB_TOKEN` không kích hoạt dây chuyền workflow mới).
> 2. Chèn hậu tố **`[skip ci]`** vào thông điệp commit tự động của bot.
> 3. Bổ sung bộ lọc `paths-ignore` hoặc điều kiện `if: github.actor != 'release-bot'`.

> [!REMEMBER] Ghi nhớ bỏ túi
> - Thứ tự ưu tiên `env:`: **`step.env` > `job.env` > `workflow.env`**.
> - Xuất dữ liệu giữa các Step chuẩn 2026: `echo "key=val" >> "$GITHUB_OUTPUT"` -> đọc qua `${{ steps.<id>.outputs.<key> }}` (tuyệt đối không dùng `::set-output`).
> - Dùng `if: failure()` để tải ảnh/log chỉ khi lỗi · `if: always()` để dọn dẹp tài nguyên tạm dù bị Cancel.
> - Không viết chung `paths` và `paths-ignore` cùng cấp · Cảnh giác **Infinite Push Loop** khi `git push` bằng PAT!

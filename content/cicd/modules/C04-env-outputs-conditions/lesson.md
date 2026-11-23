# Biến môi trường, `$GITHUB_OUTPUT`, Điều kiện `if` & Bộ lọc đường dẫn

Một tệp workflow tĩnh chỉ chạy một mạch từ đầu tới cuối giống như một hàm không có tham số, không có `return` và không có `if/else`. Để cấu hình CI Pipeline linh hoạt — biết truyền mã phiên bản giữa các bước, tự thu thập nhật ký lỗi khi kiểm thử E2E thất bại, và bỏ qua không chạy khi thay đổi chỉ nằm ở tài liệu `README.md` — bạn cần làm chủ 4 cơ chế điều khiển luồng cốt lõi của GitHub Actions.

```visual
kind: illustration
diagram: "cicd:c04"
alt: "Tháp ưu tiên 3 tầng biến môi trường env, truyền kết quả xuyên Job qua tệp $GITHUB_OUTPUT và các điều kiện if: failure / always"
title: "Điều khiển luồng trong GitHub Actions: Phạm vi biến env, $GITHUB_OUTPUT và điều kiện if:"
subtitle: "Truyền dữ liệu an toàn giữa các bước/Job và điều hướng thông minh khi pipeline gặp lỗi hoặc chỉ sửa tài liệu"
caption: "Thứ tự ưu tiên ghi đè biến môi trường (Step > Job > Workflow), luồng xuất biến qua $GITHUB_OUTPUT và các hàm kiểm tra trạng thái thực thi"
callouts:
  - num: 1
    label: "Tháp phạm vi env: & Che giấu secrets.*"
    desc: "Biến ở phạm vi hẹp hơn (Step) luôn ghi đè phạm vi rộng (Job, Workflow); biến nhạy cảm đọc từ secrets.* được tự động che dấu *** trên log."
    tone: sky
  - num: 2
    label: "Truyền dữ liệu xuyên Step & Job qua $GITHUB_OUTPUT"
    desc: "Ghi cặp key=value vào tệp môi trường $GITHUB_OUTPUT (thay cho ::set-output cũ đã loại bỏ) và khai báo jobs.<id>.outputs để Job sau đọc."
    tone: cyan
  - num: 3
    label: "Điều kiện if: & Bộ lọc đường dẫn paths-ignore"
    desc: "Dùng failure() để thu gom ảnh chụp lỗi E2E, always() & !cancelled() để dọn dẹp hạ tầng và paths-ignore để bỏ qua khi chỉ sửa tệp .md."
    tone: amber
```

## 1. Phân cấp 3 tầng biến môi trường (`env:`): Thứ tự ưu tiên ghi đè

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

> [!WARNING] Cảnh báo bảo mật: Loại bỏ vĩnh viễn lệnh `::set-output` cũ!
> Trước năm 2023, nhiều tài liệu cũ hướng dẫn in chuỗi lệnh đặc biệt `::set-output` thẳng ra màn hình `stdout`. GitHub đã **gỡ bỏ hoàn toàn cơ chế cũ đó** do lỗ hổng **Command Injection** (dữ liệu đầu vào chứa ký tự xuống dòng `\n` có thể tiêm lệnh giả mạo vào Runner).

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
    tone: cyan
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

## 3. Biểu thức điều kiện `if:` và 4 hàm kiểm tra trạng thái thực thi

Mặc định mọi Step mang điều kiện ngầm là `if: success()`. Để kiểm soát các nhánh rẽ như chỉ phát hành khi gộp vào `main` (`if: github.ref == 'refs/heads/main' && github.event_name == 'push'`) hoặc thu thập dữ liệu chẩn đoán lỗi, bạn cần nắm chắc **4 hàm trạng thái**:

```visual
kind: groups
title: "4 Hàm Kiểm Tra Trạng Thái Trong Điều Kiện if: [!badge:violet:Flow Control]"
columns: 2
items:
  - num: 1
    icon: check
    title: "success() — Mặc định ngầm"
    badge: "Khi mọi bước trước đều đạt"
    tone: emerald
    bullets:
      - "Tự động áp dụng nếu bạn không viết dòng `if:` nào"
      - "Chỉ trả `true` khi tất cả các Step phía trên trong Job đều kết thúc với `Exit Code 0`"
  - num: 2
    icon: alert
    title: "failure()"
    badge: "Chỉ chạy khi có bước bị lỗi"
    tone: rose
    bullets:
      - "Trả `true` khi bất kỳ Step nào phía trước bị thất bại"
      - "**Ứng dụng thực tế:** Gắn vào bước `Upload Playwright Screenshots` hoặc gửi cảnh báo Slack để thu thập dữ liệu chẩn đoán ngay khi bài test E2E thất bại."
  - num: 3
    icon: refresh
    title: "always()"
    badge: "Chạy bất chấp đạt, lỗi hay Cancel"
    tone: amber
    bullets:
      - "Luôn thực thi kể cả khi bước trước lỗi hoặc người dùng bấm nút **Cancel** huỷ Job"
      - "Thích hợp cho bước dọn dẹp hạ tầng tạm thời (xóa test container/cloud sandbox tránh tốn chi phí)"
  - num: 4
    icon: shield-check
    title: "!cancelled()"
    badge: "Chạy cả khi đạt lẫn lỗi (trừ khi Cancel)"
    tone: sky
    bullets:
      - "Kết hợp hàm `cancelled()`: chạy khi Job thành công HOẶC thất bại, nhưng dừng ngay nếu người dùng chủ động huỷ ngang"
      - "Lựa chọn phù hợp để tải báo cáo HTML tổng hợp ở cuối bộ kiểm thử"
```

## 4. Bộ lọc đường dẫn (`paths` / `paths-ignore`) & Chống vòng lặp Push vô tận

Để không tiêu tốn tài nguyên CI cho những thay đổi chỉ sửa tài liệu văn bản:
- [x] **`paths-ignore: ["**.md", "docs/**"]`**: Bỏ qua toàn bộ workflow nếu mọi tệp thay đổi trong commit/PR đều nằm trong danh sách loại trừ.
- [x] **`paths: ["apps/api/**", "packages/shared/**"]`**: Chỉ kích hoạt kiểm thử dịch vụ API khi có tệp liên quan bị thay đổi.
- [!] **Quy tắc cú pháp bắt buộc:** Không được viết đồng thời cả `paths:` và `paths-ignore:` trên cùng một sự kiện `on.push`. Nếu muốn vừa lọc bao gồm vừa loại trừ trong cùng sự kiện, hãy dùng duy nhất `paths:` kèm dấu chấm than phủ định ==`!`== (ví dụ: `paths: ["apps/api/**", "!apps/api/**.md"]`).

> [!WARNING] Phòng tránh vòng lặp tự kích hoạt vô tận (Infinite Push Loop)
> Nếu một Job lắng nghe `on: push` lại tự động sửa `CHANGELOG.md` / số phiên bản rồi chạy `git commit` và `git push` bằng **Personal Access Token (PAT)**, thao tác push đó sẽ được GitHub coi như người dùng đẩy code, tiếp tục phát sinh sự kiện `push` mới và kích hoạt lại chính workflow đó liên tục không dừng.
>
> Luôn phòng tránh bằng **3 biện pháp an toàn**:
> 1. Ưu tiên dùng **`GITHUB_TOKEN` mặc định** (sự kiện tạo bởi `GITHUB_TOKEN` không kích hoạt dây chuyền workflow mới).
> 2. Chèn hậu tố **`[skip ci]`** vào thông điệp commit tự động của bot.
> 3. Bổ sung bộ lọc `paths-ignore` hoặc điều kiện `if: github.actor != 'release-bot'`.

> [!REMEMBER] Ghi nhớ bỏ túi
> - Thứ tự ưu tiên `env:`: **`step.env` > `job.env` > `workflow.env`**.
> - Xuất dữ liệu giữa các Step chuẩn 2026: `echo "key=val" >> "$GITHUB_OUTPUT"` -> đọc qua `${{ steps.<id>.outputs.<key> }}` (tuyệt đối không dùng `::set-output`).
> - Dùng `if: failure()` để tải ảnh/log chỉ khi lỗi · `if: always()` để dọn dẹp tài nguyên tạm dù bị Cancel.
> - Không viết chung `paths` và `paths-ignore` cùng cấp · Cảnh giác **Infinite Push Loop** khi `git push` bằng PAT!

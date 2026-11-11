# Tối ưu Tốc độ Đường ống: Đồ thị DAG, Chia mảnh Sharding, Cache Docker Buildx & Xoá bỏ Sleep Mù quáng

Khi dự án Node.js mới khởi tạo ở tháng đầu tiên, toàn bộ đường ống CI thường chạy mất vỏn vẹn 90 giây. Nhưng 12 tháng sau, khi đội ngũ tăng lên 15 lập trình viên với 400 bài kiểm thử E2E Playwright và ảnh Docker đa tầng, đường ống phình to lên tới **42 phút**!

Hậu quả của một đường ống 42 phút không chỉ là tiền máy chủ: lập trình viên đẩy PR xong bỏ đi pha cà phê, chuyển ngữ cảnh sang việc khác, mỗi lần sửa 1 dòng chính tả lại đợi thêm 42 phút — năng suất toàn đội sụt giảm thê thảm!

Trong bài học này, chúng ta áp dụng **Tư duy Đường găng (Critical Path Analysis)** để chẻ nhỏ và ép đường ống 42 phút xuống dưới **5 phút** bằng 4 kỹ thuật thực chiến: **Đồ thị DAG quạt rộng (Fan-out / Fan-in)**, **Chia mảnh kiểm thử (`Test Sharding`)**, **Bộ đệm tầng Docker Buildx (`type=gha`)**, và **Thăm dò sẵn sàng xác định (`Deterministic Readiness Polling`)**.

---

## 1. Phân tích Đường găng (Critical Path): Từ nối tiếp tuần tự sang Đồ thị DAG

Giả sử bạn có 3 công việc kiểm tra độc lập: `lint` (2 phút), `typecheck` (3 phút) và `unit-test` (4 phút), sau đó mới tới cổng tổng hợp `gate` (hoặc `build`).

- **Kiểu ngây thơ nối đuôi nhau (`lint` → `typecheck` → `unit-test`):** Tổng thời gian chờ bằng **tổng cộng dồn** = `2 + 3 + 4 = 9 phút`! Chưa kể nếu `typecheck` có lỗi kiểu dữ liệu, bạn phải đợi `lint` chạy xong mới phát hiện ra.
- **Kiểu Đồ thị có hướng không chu trình (DAG — Fan-out / Fan-in):** Cho cả 3 Job xuất phát **đồng thời ngay giây thứ 0** (không đặt `needs` giữa chúng), rồi dùng một Job hội tụ `gate` đặt **`needs: [lint, typecheck, unit-test]`**:

```text
          ┌──► [ lint (2m) ] ──────┐
Commit ───┼──► [ typecheck (3m) ] ─┼──► [ gate (needs: cả 3) ]
          └──► [ unit-test (4m) ] ─┘
```
Lúc này, tổng thời gian của cả cụm kiểm tra rút xuống bằng đúng nhánh dài nhất (`max(2, 3, 4)`) = **4 phút**! Đặc biệt trên GitHub Branch Protection, thay vì phải tích chọn bắt buộc từng Job lẻ tẻ (mỗi lần đổi tên Job lại phải vào Settings sửa lại), bạn chỉ cần bắt buộc duy nhất trạng thái xanh của Job hội tụ **`gate`**!

---

## 2. Chia để trị bộ kiểm thử E2E nặng nề: **Test Sharding** (`1/4` .. `4/4`)

Giả sử nhánh chậm nhất của bạn là bộ kiểm thử trình duyệt thực tế **Playwright E2E** mất trọn **16 phút** trên 1 máy ảo. Dù bạn có tối ưu DAG đến mấy, đường ống vẫn không thể nhanh hơn 16 phút đó!

Các khung kiểm thử hiện đại trong hệ sinh thái JavaScript năm 2026 như **Playwright** và **Vitest** đều tích hợp sẵn cờ chia mảnh **`--shard=x/N`**. Kết hợp với `strategy.matrix` của GitHub Actions, ta thuê **4 máy ảo chạy song song**, mỗi máy chỉ gánh đúng **25% số tệp kiểm thử** (`16 phút / 4 = 4 phút`):

```yaml
e2e-playwright:
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false        # QUAN TRỌNG: 1 mảnh lỗi vẫn để 3 mảnh kia chạy nốt để gom đủ báo cáo!
    matrix:
      shard: [1, 2, 3, 4]
  steps:
    - uses: actions/checkout@v4
    # ... cài đặt dependencies & trình duyệt ...
    - name: Chạy mảnh kiểm thử Playwright ${{ matrix.shard }}/4
      run: npx playwright test --shard=${{ matrix.shard }}/4

    - name: Tải báo cáo HTML lên ngay cả khi bài test bị đỏ
      if: ${{ !cancelled() }}
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report-shard-${{ matrix.shard }}
        path: playwright-report/
        retention-days: 7
```

> **Mẹo sống còn với báo cáo lỗi (`if: !cancelled()` hoặc `if: always()`):** Mặc định trong GitHub Actions, hễ bước `npx playwright test` thất bại (trả mã thoát `1`), toàn bộ các bước phía dưới bị bỏ qua (`skipped`)! Nếu quên thêm `if: !cancelled()` vào bước `upload-artifact@v4`, đúng vào lúc bài test bị đỏ cần xem ảnh chụp màn hình lỗi nhất thì báo cáo lại không được tải lên!

---

## 3. Giữ nguyên Layer Cache của Docker trên Runner mới tinh (`type=gha,mode=max`)

Ở khoá học Docker (`K04` & `K05`), bạn đã dày công sắp xếp thứ tự `COPY package*.json ./` trước `RUN npm ci` và tách Multi-stage Build. Thế nhưng khi đem lên GitHub Actions, nhiều người sững sờ thấy mỗi lần chạy CI lệnh `docker build` lại chạy lại từ đầu mất 5 phút!

Lý do: máy ảo GitHub Runner vừa mới tạo ra làm gì có lịch sử lớp ảnh Docker của lượt chạy hôm qua trên ổ cứng cục bộ! Để giữ lại toàn bộ các lớp trung gian (kể cả tầng `builder` trong Multi-stage Build), ta bật trình điều khiển **Buildx GitHub Actions Cache Backend** trên `docker/build-push-action@v6`:

```yaml
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v6
  with:
    context: .
    push: false
    tags: ghcr.io/acme/shop-api:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```
Tham số **`mode=max`** đặc biệt lợi hại vì nó lưu đệm **tất cả các stage trung gian** (như stage `builder` biên dịch TypeScript), chứ không chỉ lưu mỗi stage `runner` cuối cùng như chế độ `mode=min` mặc định!

---

## 4. Khai tử thói quen `sleep 30`: Thay bằng Thăm dò Sẵn sàng Xác định (Polling)

Trước khi chạy bài kiểm thử E2E, bạn khởi động máy chủ ngầm `npm start &`. Làm sao biết khi nào cổng `3000` đã bật xong?
Nếu bạn viết bừa **`sleep 30`**:
- Hôm máy chủ khoẻ, ứng dụng bật xong ở giây thứ 3 → bạn **vứt đi 27 giây chờ vô nghĩa** ở mọi lượt chạy!
- Hôm máy chủ đám mây bận, ứng dụng mất 32 giây mới mở cổng → bài kiểm thử chạy ở giây 30 đâm sầm vào `ECONNREFUSED` tạo ra **lỗi chập chờn lúc xanh lúc đỏ (Flaky Tests)** làm mất niềm tin của cả đội!

Hãy thay thế mọi câu lệnh `sleep` cảm tính bằng vòng lặp thăm dò xác định với **`curl --retry --retry-connrefused`**:

```bash
curl --fail --retry 15 --retry-connrefused --retry-delay 2 http://localhost:3000/healthz
```
Ngay giây thứ 4 khi `/healthz` trả mã HTTP `200`, lệnh `curl` thoát mã `0` và chuyển sang chạy Playwright ngay lập tức; còn nếu máy chậm, nó kiên nhẫn thử lại tối đa `15 * 2 = 30 giây` một cách chuẩn xác tuyệt đối!

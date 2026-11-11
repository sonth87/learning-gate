# Đồ thị phụ thuộc Job (`DAG needs`) & Ma trận kiểm thử (`Strategy Matrix`)

Khi dự án Node.js lớn dần, một Job duy nhất chạy nối tiếp `lint` (2 phút) -> `typecheck` (2 phút) -> `unit-test` (5 phút) -> `build` (3 phút) sẽ bắt lập trình viên ngồi chờ ròng rã **12 phút** cho mỗi lần đẩy code. Trong JavaScript, khi ba hàm bất đồng bộ không phụ thuộc vào kết quả của nhau, bạn không viết ba dòng `await` tuần tự mà bọc chúng trong **`await Promise.all([lint(), typecheck(), unitTest()])`** rồi mới chạy `await build()`! Trong CI/CD, kiến trúc tương đương chính xác với `Promise.all` được gọi là **Directed Acyclic Graph (DAG — Đồ thị có hướng không chu trình)** điều phối bằng từ khoá `needs:`.

---

## 1. Kiến trúc Fan-Out / Fan-In với `needs:`

Mặc định mọi Job khai báo dưới `jobs:` đều khởi chạy **song song ngay giây thứ 0** (gọi là các Root Jobs — **Fan-Out**). Khi bạn thêm `needs: [lint, unit-test]` vào Job `build`, bạn tạo ra một cổng hội tụ (**Fan-In**):

```text
          ┌──► [ Job: lint (2p) ] ──────┐
push/PR ──┤                             ├──► [ Job: build (3p) ] ──► [ Job: deploy-staging ]
          └──► [ Job: unit-test (5p) ] ─┘
```

- Tổng thời gian trên đồng hồ thực (**Wall-clock time**) giảm từ `2 + 5 + 3 = 10 phút` xuống chỉ còn `max(2, 5) + 3 = 8 phút` (và càng nhiều nhánh kiểm tra như `typecheck`, `security-scan`, tốc độ rút ngắn càng ngoạn mục!).
- Nếu `lint` hoặc `unit-test` bị đỏ, cổng hội tụ `build` tự động chuyển sang trạng thái **`Skipped`** ngay lập tức, không tốn một xu tiền máy ảo đóng gói code hỏng.
- Tiếp nối sau `build`, Job `deploy-staging` khai báo `needs: build` kết hợp `if: github.ref == 'refs/heads/main'` để trên Pull Request đường ống dừng lại sau khi xác minh `build` xong, còn khi gộp vào `main` mới tiến lên triển khai Staging.

---

## 2. Nhân bản kiểm thử đa chiều với `strategy.matrix`

Giả sử bạn phát triển một thư viện CLI trên npm (giống như Vite hay Prisma) cần cam kết chạy mượt trên cả **Node 20 LTS** lẫn **Node 22 LTS**, và trên cả **Linux (`ubuntu-latest`)** lẫn **macOS (`macos-latest`)**. Thay vì copy-paste thành 4 Job dài ngoằng, bạn khai báo ma trận tích Đề-các `2 × 2 = 4` tổ hợp chỉ trong vài dòng:

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

### Tại sao hầu như luôn nên đặt `strategy.fail-fast: false`?
Cực kỳ bất ngờ với người mới: mặc định GitHub đặt **`fail-fast: true`**! Nghĩa là khi 4 máy ảo đang chạy tới phút thứ 4, nếu tổ hợp `(macos-latest, Node 20)` vấp lỗi nhỏ, GitHub lập tức **giết ngang hông (`Cancel`) cả 3 máy ảo còn lại**! Lập trình viên mất mù thông tin: không biết lỗi đó chỉ xảy ra riêng trên Node 20 hay cả Node 22 trên Ubuntu cũng hỏng. Đặt **`fail-fast: false`** giữ cho các lát cắt còn lại chạy nốt để trả về bức tranh chẩn đoán đầy đủ nhất ngay trong 1 lần chạy.

| Cấu hình `strategy` | Hành vi khi 1 lát cắt Matrix bị đỏ | Khi nào nên dùng? |
| :--- | :--- | :--- |
| `fail-fast: true` (mặc định) | Huỷ ngay lập tức mọi lát cắt khác đang chạy dở | Khi Runner đắt tiền và chỉ cần biết "có lỗi hay không" |
| `fail-fast: false` (khuyên dùng) | Để các phiên bản Node / OS khác chạy hết và báo cáo đầy đủ | Kiểm thử tương thích đa phiên bản Node 20/22, đa hệ điều hành, hoặc Sharding |

---

## 3. Bắc cầu truyền dữ liệu xuyên qua ranh giới hai Job (`jobs.<id>.outputs`)

Ở bài `C04`, ta đã biết dùng `"$GITHUB_OUTPUT"` để truyền dữ liệu giữa hai Step **trong cùng một Job**. Nhưng nếu Job `build` đọc số phiên bản từ `package.json` (ví dụ `1.4.2`) và muốn truyền sang Job `deploy` chạy trên một máy ảo khác thì sao?

Vì hai Job cách ly hoàn toàn, bạn phải bắc một chiếc cầu tường minh gồm **3 mắt xích**:
1. **Mắt xích 1 (Step trong Job nguồn)**: Gắn `id: pkg` và ghi `echo "version=..." >> "$GITHUB_OUTPUT"`.
2. **Mắt xích 2 ( Cổng xuất `outputs:` của Job nguồn)**: Phơi bày giá trị đó ra ngoài vỏ Job `build`:
   ```yaml
   build:
     runs-on: ubuntu-latest
     outputs:
       version: ${{ steps.pkg.outputs.version }}
   ```
3. **Mắt xích 3 (Job đích khai báo `needs:` và đọc từ ngữ cảnh `needs`)**:
   ```yaml
   deploy:
     needs: build
     runs-on: ubuntu-latest
     steps:
       - run: echo "Deploying release v${{ needs.build.outputs.version }}"
   ```

> **Lỗi kinh điển hay gặp**: Quên khai báo mắt xích số 2 (`jobs.build.outputs`) hoặc quên `needs: build` ở Job đích sẽ khiến `${{ needs.build.outputs.version }}` nhận chuỗi rỗng `""` mà không hề báo lỗi cú pháp!

### Mẹo thực chiến với `include` và `exclude` trong Matrix
Khi kết hợp nhiều chiều (ví dụ `os` × `node`), không phải tổ hợp nào cũng cần chạy tốn tiền: bạn có thể dùng `exclude:` để cắt bỏ bớt tổ hợp thừa (chẳng hạn chỉ chạy `macos-latest` trên bản Node 22 duy nhất thay vì mọi bản Node cũ), hoặc dùng `include:` để gắn thêm biến môi trường đặc thù cho từng lát cắt. Kết hợp khéo léo DAG song song với Matrix tinh gọn giúp đường ống vừa bao phủ rộng, vừa phản hồi dưới 5 phút.

# 01 — Nguồn nội dung và ghi công

> Ngày: 2026-11-26. File này là nguồn sự thật về việc được và không được dùng gì từ hai nguồn ngoài. Không phải tư vấn pháp lý; người dùng chịu trách nhiệm liên hệ tác giả.

## 1. System Design Core (SDC) — nguồn nội dung đọc

| Mục | Giá trị |
|---|---|
| Web | https://www.systemdesigncore.site/roadmap |
| Tác giả | Steve (GitHub `steve-bang`) |
| Repo | https://github.com/steve-bang/systemdesigncore |
| Commit đã khảo sát | `fe4234da7d6fe719e8e18547856fc0a730155420` (2026-02-18) |
| Ngôn ngữ | Tiếng Việt |
| Đường dẫn nội dung | `content/phases/phase-<n>/index.mdx` và `content/phases/phase-<n>/lessons/*.mdx` |
| Quy mô | 53 file MDX (~970KB, gồm cả blog/docs); app dùng 40 bài trong 7 phase (phase 0: 8, phase 1: 5, phase 2: 5, phase 3: 6, phase 4: 7, phase 5: 3, phase 6: 6) |
| Ngoài phạm vi dùng | `content/blog/*.mdx` (4 bài), `content/docs/getting-started.mdx`, `content/docs/interview/preparation.mdx` (có thể tham khảo, không đưa vào lộ trình trừ khi `02-curriculum.md` nói khác) |
| Raw URL | `https://raw.githubusercontent.com/steve-bang/systemdesigncore/<sha>/<path>` |

Danh sách 40 bài và đường dẫn từng bài: `02-curriculum.md` §4 (cột SDC) và BRIEF §1.1.

### 1.1 Tình trạng giấy phép (mâu thuẫn, chưa giải quyết)

Các dữ kiện đã kiểm tra:
1. README của repo ghi "This project is licensed under the MIT License".
2. Repo **không có file `LICENSE`**.
3. Phần Author của README còn placeholder của template ("Your Name").
4. Footer của web ghi "© 2026 System Design Core. All rights reserved."

Hai tuyên bố mâu thuẫn nhau và chưa xác định được tuyên bố nào có hiệu lực.

**Cách xử lý đã chốt (ADR-004):**
- Người dùng tự liên hệ tác giả để xác nhận giấy phép. Việc này nằm ngoài các task của agent. Không có bản nháp tin nhắn trong docs.
- Trong lúc chờ: dùng theo điều kiện MIT, kèm ghi nguồn đầy đủ (mục 3) và giữ ghi chú MIT (mục 3.4).
- Nếu tác giả phản đối: **rút nội dung gốc**. Phần mô phỏng, scene, bài tập, quiz và cards do mình tự viết được giữ. Để làm được việc này, nội dung chuyển thể từ SDC phải truy vết được (`source` trong từng bài, mục 3.1), và phần mô phỏng/bài tập phải tách khỏi `lesson.md`.
- Khi có xác nhận (hoặc phản đối): cập nhật mục này và Credits; ghi thêm một ADR.

Trạng thái xác nhận: **chưa có** (2026-11-26).

### 1.2 Cách dùng nội dung SDC

Làm:
- Tải bản gốc nguyên trạng vào `content/sysdesign/_source/sdc/` bằng `scripts/import-sdc.mjs` (T1.5).
- Biên tập tay từng bài: bỏ giai thoại mở đầu ("Tôi còn nhớ lần đầu…"), chuẩn hóa văn phong và thuật ngữ theo guidelines §5, chuyển Mermaid thành `visual`/scene, thêm sim và bài tập (xem `07-content-authoring.md`).
- Ghi nguồn mọi bài chuyển thể.

Không làm:
- Dùng script thay chuỗi hàng loạt để "chuyển" bài (content/README.md §0.3).
- Bỏ `source` khỏi bài đã chuyển thể từ SDC.
- Sửa file trong `_source/`.
- Đưa bản gốc `_source/` vào bundle của app.

### 1.3 Bản gốc chỉ đọc: `content/sysdesign/_source/sdc/`

- Chứa các file MDX gốc theo cấu trúc `phase-<n>/...` cùng `manifest.json`.
- **Không sửa tay.** Muốn cập nhật nguồn thì chạy lại `scripts/import-sdc.mjs` với commit mới và ghi vào `manifest.json`.
- `manifest.json` ghi cho từng file: `path`, `sha` (commit), `url` (raw URL), `fetchedAt` (ngày lấy).
- `scripts/build-sysdesign.mjs` **không đọc** thư mục này vào bundle; `sd:doctor` cảnh báo nếu file trong `_source/` khác manifest (T1.5).
- Mục đích: (1) tham chiếu khi biên tập, (2) truy vết khi tác giả yêu cầu, (3) đối chiếu `source.sha`.

## 2. Designed to Scale (DTS) — chỉ tham chiếu

| Mục | Giá trị |
|---|---|
| Web | https://designed-to-scale.vercel.app |
| Tác giả | Dilum Sanjaya |
| Giấy phép | **Không có** → mặc định là bảo lưu mọi quyền |
| Quy mô tham chiếu | 40 bài, 9 chương |

| Được làm | Không được làm |
|---|---|
| Ghi lại, bằng lời của mình, khái niệm nào dùng mô hình gì, thành phần scene nào, trình tự bước ra sao, metric chính nào (`reference/dts-models.md`) | Chép dữ liệu scene (entities, links, flows, tọa độ) |
| Dùng cùng ý tưởng sư phạm chung (ví dụ minh họa hockey-stick bằng đồ thị) vì ý tưởng không thuộc bản quyền | Chép hoặc dịch lời giảng (`body`, `callout`, `summary`, `goals`) |
| Tự dựng scene bằng `StageScene` của repo | Chép giá trị metric cố định từng bước của DTS |
| Dẫn link tới DTS ở trang Credits như tài liệu tham khảo | Nhúng iframe, tải bundle JS vào repo, hoặc phân phối lại file bundle |
| Ghi nhận trong Credits rằng cấu trúc chủ đề tham khảo DTS | Dùng tên thương hiệu/hình ảnh/logo của DTS |

Bundle JS của DTS từng được tải vào thư mục scratchpad cục bộ để khảo sát (BRIEF §1.2). **Không đưa nó vào repo.**

Ghi chú để tránh nhầm: định dạng bước của DTS gần trùng `ScaleLessonStep` của repo. Trùng về cấu trúc dữ liệu không có nghĩa được dùng lại nội dung. Mỗi scene phải do mình dựng và mô tả bằng lời của mình.

## 3. Quy tắc ghi nguồn

### 3.1 Field `source` trong `module.json`

Bắt buộc với mọi bài chuyển thể từ SDC. **Đây là schema duy nhất** (đã chốt ở review M0); `07-content-authoring.md` §2.2 chỉ chép lại kiểu TS và phải theo mục này:

```json
{
  "source": {
    "kind": "sdc",
    "path": "content/phases/phase-1/lessons/lesson-3-data-flow-and-bottlenecks.mdx",
    "sha": "fe4234da7d6fe719e8e18547856fc0a730155420",
    "url": "https://github.com/steve-bang/systemdesigncore/blob/fe4234da7d6fe719e8e18547856fc0a730155420/content/phases/phase-1/lessons/lesson-3-data-flow-and-bottlenecks.mdx",
    "adaptedBy": "sonnet",
    "adaptedAt": "2026-11-26",
    "changes": "Bỏ giai thoại mở đầu; chuẩn hóa thuật ngữ; thay Mermaid bằng scene; thêm sim ramp tải và bài tập.",
    "adaptation": "edited"
  }
}
```

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `kind` | `'sdc' \| 'original'` | Bắt buộc. `'sdc'`: chuyển thể từ SDC, khi đó mọi trường dưới (trừ `adaptation`) bắt buộc. `'original'`: bài tự viết (chủ đề chỉ DTS có, phần ★); có thể bỏ hẳn `source`. Không có giá trị cho DTS (DTS chỉ ghi ở `dtsRef`, mục 2) |
| `path` | string | Đường dẫn trong repo SDC; phải trùng một dòng trong `_source/sdc/manifest.json` |
| `sha` | string | Commit đã lấy (hiện là `fe4234da…`) |
| `url` | string | Link tới file nguồn tại đúng commit |
| `adaptedBy` | string | Ai/agent biên tập (ví dụ `sonnet`, hoặc tên người) |
| `adaptedAt` | `YYYY-MM-DD` | Ngày biên tập |
| `changes` | string | Một hoặc hai câu mô tả thay đổi so với bản gốc |
| `adaptation` | `'edited' \| 'rewritten'` (tuỳ chọn, mặc định `'edited'`) | Mức biên tập: `edited` = giữ cấu trúc ý của bản gốc, đã biên tập câu chữ; `rewritten` = viết lại ý bằng lời của mình. Ghi trên Credits; doctor đo độ trùng nguyên văn như nhau cho cả hai (07 §6 quy tắc 15) |

Một bài ghép từ nhiều bài SDC thì dùng mảng: `"source": [ {…}, {…} ]`. `sd:doctor` chấp nhận object hoặc mảng (T1.4).

`sd:doctor` kiểm: bài có đánh dấu từ SDC thì phải có `source` đủ trường; `path` tồn tại trong manifest; `sha` khớp manifest.

Ghi chú: `content/README.md` yêu cầu `sources` (URL tài liệu chính thức) cho khóa DevOps. `source` (số ít, object) ở đây là nguồn chuyển thể. Cả hai có thể cùng tồn tại; tên tách bạch để khỏi nhầm. Cách đặt cụ thể trong `module.json` xem `07-content-authoring.md`.

### 3.2 Dòng nguồn trên UI

Ở cuối mỗi bài học (sau bước cuối, trong cột phải hoặc cuối nội dung `lesson.md` khi hiển thị), có một dòng cố định tạo từ `source`:

> Nguồn: System Design Core — "<tiêu đề bài gốc>" (Steve, MIT). Biên tập lại cho Learning Gate. Xem Credits.

- "Steve" và "MIT" là chuỗi cố định theo trạng thái giấy phép hiện tại, đặt **một chỗ** ở `src/features/sysdesign-course/credits.ts` (hằng `SDC_ATTRIBUTION`, tạo ở T1.1a); cập nhật tại đó khi tình trạng đổi.
- Cơ chế hiển thị: `sdLessonBuilder` tạo `ScaleModuleLesson.attribution = { text, href }` từ `source` + `SDC_ATTRIBUTION`; `ScaleWorkbenchLayout` hiển thị ở cuối cột phải khi field có giá trị (field thêm ở T3.1, render và điền ở T3.6; xem `05-live-stage.md` §2). App khác không đặt field nên không đổi.
- "Xem Credits" chuyển sang tab `credits`.
- Bài tự viết không có dòng này; nếu có tham chiếu ý tưởng từ DTS thì không ghi trong dòng này, chỉ ghi ở Credits.

### 3.3 Trang Credits (tab `credits`)

Nội dung tối thiểu:
1. **System Design Core**: tên, tác giả (Steve, `steve-bang`), link web, link repo, commit đã dùng, ngày lấy, tình trạng giấy phép (README ghi MIT, không có LICENSE, footer ghi "All rights reserved", đang chờ xác nhận) — nói thẳng, không che.
2. **Ghi chú MIT** nguyên văn (mục 3.4).
3. **Danh sách bài đã chuyển thể**: tự sinh từ `source` của từng module (id, tiêu đề, link nguồn, ngày biên tập).
4. **Designed to Scale**: ghi là tài liệu tham khảo về mô hình minh họa; link web; tác giả Dilum Sanjaya; nêu rõ không dùng nội dung của họ.
5. **Cách yêu cầu gỡ**: một dòng hướng dẫn liên hệ chủ app nếu tác giả muốn rút nội dung.
6. Ghi chú về mô phỏng: "Mô phỏng đúng xu hướng và độ lớn, không đúng số tuyệt đối".

### 3.4 Ghi chú MIT

Giữ nguyên văn bản mà README của SDC ghi ("This project is licensed under the MIT License") và đặt ở Credits kèm link README tại đúng commit. Khi có LICENSE hoặc xác nhận của tác giả, chép đầy đủ văn bản giấy phép vào Credits. Không tự soạn lại điều khoản.

## 4. Tóm tắt thao tác cho agent biên tập một bài từ SDC

1. Mở bản gốc trong `content/sysdesign/_source/sdc/` (không sửa).
2. Biên tập thành `content/sysdesign/modules/<id>/lesson.md`.
3. Điền `source` đầy đủ trong `module.json`.
4. Đối chiếu `reference/dts-models.md` cho mô hình/scene; không mở lại DTS để chép.
5. Chạy `npm run sd:build && npm run sd:doctor`.
6. Review theo checklist nội dung ở `08-workflow.md` §5 (có mục ghi nguồn và không chép DTS).

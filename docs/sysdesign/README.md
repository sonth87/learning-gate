# System Design Mastery (`sdmastery`) — Bộ tài liệu dự án

App thứ 6 của Learning Gate: học system design bằng một mô hình chạy được (mô phỏng tải, lỗi, hồi phục) thay vì sơ đồ tĩnh. App id `sdmastery`, course/slot id `sysdesign`, branch `feat/sdmastery`.

Liên kết nhanh: **[HANDOFF — bắt đầu từ đây nếu bạn tiếp quản](./HANDOFF.md)** · [TASKS](./TASKS.md) · [DECISIONS](./DECISIONS.md) · [Quy trình](./08-workflow.md) · [Kiến trúc](./03-architecture.md)

## Trạng thái hiện tại

- Ngày: 2026-11-26
- **M0 — Bộ tài liệu: xong** (`0ba5606` + cập nhật ADR-001..018, `HANDOFF.md`).
- **M1 — Khung app và feature module: xong** (T1.1a–T1.6, kèm T7.6 trang Credits và bài mẫu S1-03 phần nội dung T5.1).
- **M2 — Engine mô phỏng (`src/features/sysdesign-course/sim/`): xong** (T2.1–T2.9, đủ 22 bất biến I1–I22, review T2.8 xong).
- **M3 — Stage chế độ `live-sim`: đang làm** (T3.1–T3.3 xong; đang triển khai T3.4–T3.6 theo `HANDOFF.md` §6.1).
- Chương trình chốt: 74 bài (40 SDC + 22 bổ sung từ chủ đề DTS + 12 tự thêm ★), level 0–7 (`02-curriculum.md`, ADR-010).
- Thứ tự phụ thuộc: M0 → (M1 ∥ M2) → M3 → M4 → M5 (cổng duyệt của người dùng) → (M6 ∥ M7) → M8.
- Việc chờ người dùng: xem bảng tổng hợp tại [`HANDOFF.md`](./HANDOFF.md) §8.
- Mục "Trạng thái hiện tại" này phải cập nhật mỗi khi một milestone đổi trạng thái (xem `08-workflow.md` §9).

## Mục lục

| File | Nội dung |
|---|---|
| [`README.md`](./README.md) | Mục lục, trạng thái, cách bắt đầu, lệnh |
| [`00-vision.md`](./00-vision.md) | Mục tiêu, người học, 3 lớp, 8 góc nhìn, vòng học, các tab, phạm vi, tiêu chí thành công, rủi ro |
| [`01-sources-and-credits.md`](./01-sources-and-credits.md) | Hai nguồn (SDC, DTS), tình trạng giấy phép, quy tắc ghi nguồn, trang Credits |
| [`02-curriculum.md`](./02-curriculum.md) | Bảng tổng 74 bài (level 0–7): id, nguồn SDC, đối chiếu DTS, mô hình, kịch bản sim, dạng bài tập, batch M6, trạng thái |
| [`03-architecture.md`](./03-architecture.md) | Cây thư mục, luồng dữ liệu, ranh giới module, điểm chạm vào code dùng chung, tái sử dụng, quy ước id |
| [`04-simulation-engine.md`](./04-simulation-engine.md) | `SystemModel`, thuật toán tick, state node, LoadProfile/TimedEvent, analyze/grade, bất biến cần test, scenario mẫu S1-03, phạm vi mô phỏng sự kiện (§12) |
| [`05-live-stage.md`](./05-live-stage.md) | Chế độ `live-sim` của stage: kênh frame `frameSource`, packet pool, queue pile, timeline, controls, dòng nguồn, lỗi hiện có cần sửa |
| [`06-activities-and-grading.md`](./06-activities-and-grading.md) | Schema các dạng bài tập và bộ chấm, lưu điểm vào `WpState` |
| [`07-content-authoring.md`](./07-content-authoring.md) | Định dạng `content/sysdesign/modules/<id>/` (module, lesson, stage, sim, activities, quiz, cards), cách chuyển một bài SDC, checklist bài "xong", quy tắc doctor |
| [`08-workflow.md`](./08-workflow.md) | Quy trình subagent, mẫu prompt, checklist review, Definition of Done, lệnh kiểm tra, quy tắc commit |
| [`HANDOFF.md`](./HANDOFF.md) | Bàn giao cho agent tiếp quản: trạng thái tại `341a0fa`, quy tắc bắt buộc, việc tiếp theo, vấn đề đã biết, quyết định chờ người dùng |
| [`TASKS.md`](./TASKS.md) | Bảng việc M0→M8 với ID, phụ thuộc, tiêu chí nghiệm thu, trạng thái |
| [`DECISIONS.md`](./DECISIONS.md) | ADR-001..013: các quyết định đã chốt |
| [`reference/dts-models.md`](./reference/dts-models.md) | Thẻ đối chiếu từng bài DTS (bằng lời riêng): khái niệm, thành phần scene, trình tự bước, metric chính |
| [`_brief/PLAN.md`](./_brief/PLAN.md) | Plan đã duyệt: phạm vi, milestone (nguồn gốc của TASKS) |
| [`_brief/BRIEF.md`](./_brief/BRIEF.md) | Ngữ cảnh thô: khảo sát hai nguồn, thiết kế đã thống nhất, khảo sát code có số dòng |

File ngoài `docs/sysdesign/` liên quan: [`docs/scale-workbench-guidelines.md`](../scale-workbench-guidelines.md) (quy chuẩn bắt buộc, §6 là chế độ `live-sim`), [`content/README.md`](../../content/README.md) (quy trình biên soạn).

Mọi file ở bảng trên đã có (M0 xong).

## Bắt đầu từ đâu

**Người mới (đọc theo thứ tự, khoảng 30 phút)**
1. `00-vision.md` — app làm gì và vì sao.
2. `03-architecture.md` — code nằm ở đâu, ai được import ai.
3. `TASKS.md` — việc gì đang `doing`, việc gì tiếp theo.
4. `DECISIONS.md` — vì sao thiết kế như vậy (đừng tranh luận lại các ADR đã chốt).

**Agent mới nhận một task**
1. Đọc dòng task trong `TASKS.md` (phụ thuộc, file chạm chính, nghiệm thu).
2. Đọc `08-workflow.md` §2 (mẫu prompt), §3 (Definition of Done), §6 (song song/tuần tự).
3. Đọc docs chuyên đề tương ứng:
   - Engine (M2): `04-simulation-engine.md`
   - Stage (M3): `05-live-stage.md`, `03-architecture.md` §5.3
   - Activities (M4): `06-activities-and-grading.md`
   - Bài học (M5, M6): `07-content-authoring.md`, `01-sources-and-credits.md`, `02-curriculum.md`, `reference/dts-models.md`, `docs/scale-workbench-guidelines.md` §5
   - Khung app, lưu trữ (M1): `03-architecture.md` §5.1–5.2, mẫu `src/features/pmp-course/`
4. Sửa đúng file được phép. Chạy lệnh kiểm tra. Cập nhật `TASKS.md`. Một task một commit.

**Reviewer**: đọc `08-workflow.md` §4 và §5, `git show <commit>`, chạy lại lệnh.

## Lệnh quan trọng

```bash
# Kiểm tra chung (mọi task)
npm run build            # tsc -b && vite build
npm run lint             # eslint .

# System Design (có sau T1.4)
npm run sd:build         # content/sysdesign/ → src/data/courses/sysdesign/{curriculum,sims}.json
npm run sd:doctor        # kiểm định nội dung và lời giải
npm run sd:test          # test engine/activities (esbuild)

# Hồi quy các khóa khác (khi chạm code dùng chung)
npm run course:build && npm run course:doctor && npm run course:test
npm run pmp:doctor

# Chạy app
npm run dev
```

Lệnh theo dõi: `git status` (nên sạch ngoài phạm vi task), `git log --oneline feat/sdmastery`.

## Quy tắc ngắn gọn

- Docs là nguồn sự thật. Code khác docs thì sửa docs trong cùng commit.
- Không sửa tay `src/data/courses/sysdesign/` (sinh ra) và `content/sysdesign/_source/sdc/` (bản gốc chỉ đọc).
- Văn phong theo `docs/scale-workbench-guidelines.md` §5.
- Mô phỏng chỉ đúng xu hướng và độ lớn, không đúng số tuyệt đối; app phải nói rõ điều này.
- Không push khi chưa được yêu cầu.

# 08 — Quy trình làm việc với subagent

> Ngày: 2026-11-26. Áp dụng cho mọi task trong [`TASKS.md`](./TASKS.md). Quyết định gốc: ADR-003.

## 1. Vai trò

| Vai trò | Model | Trách nhiệm |
|---|---|---|
| **Implementer** | Sonnet | Nhận một task, đọc docs được chỉ định, chỉ sửa file được phép, chạy lệnh kiểm tra, cập nhật `TASKS.md` sang `review`, commit |
| **Reviewer** | Opus | Đọc diff, đối chiếu docs và tiêu chí nghiệm thu, chạy lại lệnh kiểm tra, review đúng sai. Với nội dung: thêm độ chính xác kỹ thuật, guidelines §5, ghi nguồn, không chép DTS. Đạt → `done`; chưa đạt → trả về kèm danh sách sửa |
| **Orchestrator** | Phiên chính | Chọn task, giao việc bằng mẫu ở §2, quyết định song song hay tuần tự (§6), gộp kết quả |
| **Người dùng** | — | Cổng duyệt bài mẫu (T5.5), liên hệ tác giả SDC, quyết định khi docs ghi "Chưa quyết" |

Task cần phán đoán kiến trúc hoặc thuật toán khó (cột Agent = Opus trong TASKS) do Opus làm; vẫn cần một lượt review độc lập.

Mỗi lần giao việc là một phiên làm việc mới, không có ngữ cảnh. Vì vậy prompt phải tự đủ (đường dẫn docs, file được phép sửa, tiêu chí).

## 2. Mẫu prompt giao việc (sao chép và điền)

```text
Bạn là Implementer cho task <ID> của dự án System Design Mastery (app id `sdmastery`, course id `sysdesign`)
trong repo /Users/skyline/PROJECTS/learning-gate, branch `feat/sdmastery` (React 19 + Vite + zustand).

TASK: <ID> — <mô tả một câu, lấy từ docs/sysdesign/TASKS.md>
PHỤ THUỘC ĐÃ XONG: <các task, xác nhận trạng thái `done` trong TASKS.md>

ĐỌC TRƯỚC (bắt buộc, đọc hết):
- docs/sysdesign/TASKS.md (dòng của task này)
- docs/sysdesign/<file docs liên quan, ví dụ 04-simulation-engine.md>
- docs/sysdesign/03-architecture.md (§3 ranh giới module, §5 điểm chạm dùng chung)
- docs/sysdesign/08-workflow.md (file này, §3-§8)
- <nếu là bài học> docs/sysdesign/07-content-authoring.md, docs/scale-workbench-guidelines.md §5, content/README.md §0
- <nếu có> mẫu để sao chép: <đường dẫn>

FILE ĐƯỢC PHÉP SỬA/TẠO (chỉ những file này):
- <đường dẫn 1>
- <đường dẫn 2>
Nếu cần sửa file ngoài danh sách, DỪNG và báo lại, không tự sửa.

TIÊU CHÍ NGHIỆM THU (đo được):
- <lấy từ cột Nghiệm thu của TASKS.md>
- <tiêu chí bổ sung>

LỆNH KIỂM TRA (chạy và dán kết quả tóm tắt vào báo cáo):
- npm run build
- npm run lint
- npm run sd:build && npm run sd:doctor && npm run sd:test      (nếu script đã có, xem TASKS T1.4)
- <nếu task chạm code dùng chung> npm run course:build && npm run course:doctor && npm run course:test && npm run pmp:doctor

RÀNG BUỘC:
- Tuân thủ docs/scale-workbench-guidelines.md §5 cho mọi chuỗi hiển thị cho người học.
- Không sửa tay file sinh ra trong src/data/courses/sysdesign/.
- Không sửa content/sysdesign/_source/sdc/ (chỉ đọc).
- Không push. Không git add/commit file ngoài phạm vi task.
- Không tự bịa số liệu; chỗ chưa quyết thì ghi "Chưa quyết — xem TASKS T…".

KHI XONG:
1. Cập nhật docs/sysdesign/TASKS.md: trạng thái của <ID> → `review` (kèm commit hash ngắn).
2. Nếu thực tế khác docs, sửa docs liên quan (xem 08-workflow.md §9) hoặc ghi vào báo cáo.
3. Commit một lần: `feat(sdmastery): <ID> <mô tả ngắn>`.
4. Báo cáo: danh sách file đã tạo/sửa, kết quả từng lệnh kiểm tra, các điểm cần Reviewer chú ý.
```

Mẫu prompt cho Reviewer:

```text
Bạn là Reviewer (Opus) cho task <ID>. Đọc docs/sysdesign/TASKS.md (dòng <ID>), các docs liên quan và
08-workflow.md §4 (checklist code) hoặc §5 (checklist nội dung). Xem diff bằng `git show <commit>`.
Chạy lại các lệnh kiểm tra. Báo cáo: ĐẠT hoặc TRẢ VỀ; nếu trả về thì liệt kê từng lỗi với file:dòng và cách sửa.
Chỉ sửa TASKS.md (trạng thái + "Ghi chú review"). Không tự sửa code của Implementer trừ khi được yêu cầu.
```

## 3. Definition of Done

Một task chỉ được `done` khi **tất cả** đúng:
1. Mọi tiêu chí nghiệm thu trong dòng task của `TASKS.md` đạt.
2. `npm run build` (tsc -b + vite build) và `npm run lint` xanh.
3. Với task chạm `content/sysdesign/` hoặc script: `npm run sd:build && npm run sd:doctor && npm run sd:test` xanh (khi các script đã tồn tại).
4. Với task chạm code dùng chung (mục 5 của `03-architecture.md`): hồi quy xanh (`course:build`, `course:doctor`, `course:test`, `pmp:doctor`) và đã mở lại các app cũ để xác nhận (đặc biệt sau M3).
5. Không có file ngoài phạm vi task bị sửa (`git show --stat` khớp danh sách được phép).
6. Docs liên quan được cập nhật nếu thực tế khác docs.
7. `TASKS.md` đã cập nhật; Reviewer đã duyệt; commit đã nằm trên `feat/sdmastery`.
8. Task nội dung: đạt checklist ở §5 và checklist "bài xong" ở `07-content-authoring.md`.

## 4. Checklist review code

- [ ] Đúng phạm vi: chỉ file được phép; không "tiện tay" refactor chỗ khác.
- [ ] Ranh giới module (`03-architecture.md` §3): `sim/` không import React/DOM; stage không import engine.
- [ ] `sim/` deterministic: không `Math.random`, `Date.now`; dùng `rng.ts` với seed.
- [ ] Kiểu chặt: không `any` trừ khi có lý do ghi chú; switch trên union có nhánh `never`.
- [ ] Không phá 5 app cũ: bước không có `liveSim` chạy y hệt; camera không bị reset ngoài ý muốn; packet không chạy x2.
- [ ] Hooks đúng luật (không đặt hook sau `return`); effect có cleanup; rAF/subscription được huỷ khi unmount.
- [ ] Hiệu năng: `frameSource.subscribe` (05 §2) không làm layout re-render mỗi tick; không cấp phát lớn trong vòng rAF; packet có pool giới hạn.
- [ ] Test: có test cho logic mới; bất biến liên quan trong `04` được test (với engine).
- [ ] Không file sinh ra bị sửa tay (`src/data/courses/sysdesign/*`).
- [ ] Chuỗi hiển thị song ngữ (VI/EN) theo `i18n.ts` cho UI, telemetry, inspector; không cứng một ngôn ngữ.
- [ ] Văn phong chuỗi UI theo guidelines §5 (không từ y khoa/quân sự hóa).
- [ ] Không bí mật (token, webhook thật), không `console.log` thừa.
- [ ] Cập nhật `TASKS.md` và docs liên quan.
- [ ] Commit message đúng quy ước (§8).

## 5. Checklist review nội dung

**Độ chính xác kỹ thuật**
- [ ] Công thức và con số đúng (ví dụ W = S/(1−ρ); 1−0,99^100 ≈ 63%; quorum N/2+1). Ghi rõ giả định.
- [ ] Không nói tuyệt đối khi thực tế phụ thuộc điều kiện (ví dụ "cache luôn nhanh hơn").
- [ ] Mô tả CAP/PACELC/consistency đúng định nghĩa; không lẫn "consistency" của CAP với ACID.
- [ ] Số liệu mô phỏng khớp `sim.json`; bài ghi rõ mô phỏng chỉ đúng xu hướng và độ lớn.
- [ ] Mỗi câu quiz có đáp án đúng duy nhất và giải thích; cards không mâu thuẫn với bài.

**Văn phong (guidelines §5)**
- [ ] Tiêu đề (`#`, `##`, `###`), objectives, nhãn visual/telemetry/whatChanged nói thẳng tên khái niệm, không ẩn dụ.
- [ ] Trình tự Khái niệm → Cơ chế → Liên hệ (ví dụ đời thường chỉ 1 câu ở cuối đoạn, không thay thuật ngữ).
- [ ] Giữ thuật ngữ tiếng Anh phổ biến; không dịch từng chữ.
- [ ] Không có từ cấm (giải phẫu, phẫu thuật, bắt bệnh, giải mã (trừ decode thật), giải ngố, vũ khí, tuyệt chiêu, bí kíp, sinh tử, sống còn, tử huyệt, chí mạng, thảm họa, cú lừa, so găng, sát thủ, chữa cháy…). `sd:doctor` chặn danh sách này; reviewer đọc lại bằng mắt.
- [ ] Đã bỏ giai thoại "Tôi còn nhớ lần đầu…" và khẩu ngữ ("game changer", "Problem solved").
- [ ] Biên tập tay, không dấu vết thay chuỗi hàng loạt làm hỏng câu (content/README.md §0.3).

**Ghi nguồn**
- [ ] Bài từ SDC có `source` đầy đủ trường (`01-sources-and-credits.md` §3.1); `path` và `sha` khớp `_source/sdc/manifest.json`.
- [ ] Dòng nguồn hiển thị ở cuối bài; bài có mặt trong Credits.
- [ ] Không sửa file trong `_source/`.

**Không chép DTS**
- [ ] Scene do mình dựng; không giống tọa độ/entity/flow của DTS từng chữ.
- [ ] Lời giảng, callout, tiêu đề bước không phải bản dịch/viết lại sát câu của DTS.
- [ ] Metric do engine tính, không lấy giá trị cố định của DTS.
- [ ] Phần tham chiếu chỉ nằm ở `reference/dts-models.md`, bằng lời riêng.

**Tương tác**
- [ ] Mỗi activity: starter KHÔNG đạt, lời giải mẫu ĐẠT (doctor).
- [ ] Bài có sim: kịch bản chạy được, kéo tải/tiêm lỗi cho kết quả hợp lý, tua được.

## 6. Quy tắc song song

**Song song bằng worktree** (`isolation: worktree`) khi các task chạm file khác nhau:
- M1 ∥ M2 (feature/scripts vs `sim/`), trừ T1.2 và T1.3 tuần tự với nhau.
- Trong M6: các bài của cùng một batch, sau khi phần "Cần thêm" (engine/công cụ) của batch đã xong.
- Các bài trong M6 (mỗi bài một thư mục `content/sysdesign/modules/<id>/`).
- Các tab trong M7 (mỗi tab một thư mục riêng).
- Các file docs ở M0.

**Tuần tự** khi chạm file dùng chung. Danh sách file dùng chung (một lúc chỉ một task được sửa):

| Nhóm | File |
|---|---|
| Đăng ký app | `src/apps/appRegistry.tsx`, `src/App.tsx`, `src/components/common/AppLogos.tsx`, `src/stores/useWorkbenchStore.ts`, `src/index.css` — task: T1.3 |
| Lưu trữ/đồng bộ | `src/db/durableProgressStorage.ts`, `src/db/cloudSyncService.ts`, `src/db/backupService.ts`, `src/stores/useCloudSyncStore.ts`, `src/components/layout/SettingsModal.tsx` — task: T1.2 |
| Stage/workbench | `src/components/scale-workbench/types.ts` (`PacketKind`, `StageRenderMode`, `ScaleLessonStep`, `ScaleModuleLesson.attribution`), `i18n.ts`, `ScaleStageSvg.tsx`, `ScaleWorkbenchLayout.tsx` (`LegendDot`, `legendKinds`, renderer, cột phải), `StageEntityInspector.tsx`, `MemoryStageSvg.tsx` — task: T3.1–T3.6, T4.1 |
| Trạng thái học dùng chung | `src/features/workpath/types.ts` (`ExerciseRecord`), `src/db/durableProgressStorage.ts` (`mergeWpStates`, đồng thời là file slot của T1.2) — task: T1.2, T4.1 |
| Script/cấu hình | `package.json`, `scripts/build-sysdesign.mjs`, `scripts/sysdesign-doctor.mjs`, `scripts/run-sysdesign-tests.mjs` (một task một lúc) — task: T1.4, T2.7, T4.6 |
| Điều phối tài liệu | `docs/sysdesign/TASKS.md`, `docs/sysdesign/02-curriculum.md` (nhiều task cùng sửa → gộp khi merge, xử lý xung đột thủ công) |
| Glossary | `src/data/glossary/devopsAndPmpData.ts` — task: T7.4 |

Khi merge worktree: kiểm tra xung đột ở `TASKS.md` và `02-curriculum.md` trước; chạy lại toàn bộ lệnh kiểm tra sau khi gộp.

## 7. Lệnh kiểm tra

| Lệnh | Khi nào | Ý nghĩa |
|---|---|---|
| `npm run build` | Mọi task | `tsc -b && vite build` |
| `npm run lint` | Mọi task | `eslint .` |
| `npm run sd:build` | Task nội dung/script | `content/sysdesign/` → `src/data/courses/sysdesign/` (chưa có đến khi T1.4 xong) |
| `npm run sd:doctor` | Task nội dung/script | Kiểm định (trùng id, `source`, quiz/cards, schema sim/activity, lời giải, secret, từ cấm) (T1.4) |
| `npm run sd:test` | Task engine/activities/script | Chạy test (esbuild) (T1.4) |
| `npm run course:build` | Task chạm code dùng chung | Hồi quy khóa DevOps |
| `npm run course:doctor` | như trên | |
| `npm run course:test` | như trên | Chạy `scripts/run-engine-tests.mjs` |
| `npm run pmp:doctor` | như trên | Hồi quy PMP (`pmp:build` nếu đổi dữ liệu PMP) |
| `npm run dev` | Sau M3, T1.3, M5 | Chạy app để kiểm bằng mắt; skill `run` có thể dùng |

Kiểm bằng mắt sau M3: mở Redis, K8s, CI/CD, PMP, Python; xác nhận stage isometric diễn hoạt như cũ (rơi nảy, morph, packet không chạy x2). Mở bài `live-sim`: kéo tải thấy DB đỏ và hàng đợi dồn, tua được, 60fps với ~200 packet.

Kiểm backup/cloud sync: export JSON có slot `sysdesign`, import lại không mất tiến độ.

## 8. Branch và commit

- Branch làm việc: `feat/sdmastery`. Không làm trực tiếp trên `main`.
- **1 task = 1 commit.** Commit chứa cả cập nhật `TASKS.md`.
- Message: `feat(sdmastery): T1.3 app shell và đăng ký appRegistry`. Dùng `feat`, `fix`, `docs`, `refactor`, `test`, `chore` theo tính chất; scope `sdmastery`; luôn có ID task. Task review xong chỉnh sửa → commit mới `fix(sdmastery): T1.3 sửa theo review`, hoặc `--amend` nếu chưa chia sẻ (do orchestrator quyết).
- Không push khi chưa được người dùng yêu cầu. Không force push.
- Không commit file bí mật; không commit `src/data/courses/sysdesign/` bằng tay (nó do `sd:build` sinh; việc có theo dõi trong git hay không theo thông lệ của các khóa khác — **Chưa quyết**, xem T1.4).
- Worktree: sau khi task xong, orchestrator cherry-pick hoặc merge commit vào `feat/sdmastery`.

## 9. Cập nhật docs khi thực tế thay đổi

- Docs là nguồn sự thật. Khi code khác docs: sửa docs **trong cùng commit** với code.
- Thay đổi quyết định đã chốt: thêm ADR mới vào `DECISIONS.md` (không sửa ADR cũ).
- Thay đổi số dòng hoặc đường dẫn ở `03-architecture.md` §5: cập nhật ngày ở ghi chú.
- Task mới phát sinh: thêm dòng vào `TASKS.md` với ID tiếp theo trong milestone.
- Bài học chuyển xong: cập nhật cột trạng thái trong `02-curriculum.md`.
- Trạng thái milestone: cập nhật mục "Trạng thái hiện tại" trong `README.md`.
- Chỗ nào ghi "Chưa quyết": khi quyết xong, sửa chỗ đó thành nội dung đã chốt và (nếu quan trọng) thêm ADR.

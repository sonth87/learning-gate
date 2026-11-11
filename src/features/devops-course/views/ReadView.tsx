import React, { useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useCourseCatalog, useCourseCurriculum, useCourseReadings } from '../data';
import {
  CATALOG_STATUS_LABEL,
  DEVOPS_KIND_LABEL,
  catalogStatus,
  courseCurrentLevel,
} from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import type { CatalogStatus } from '@/features/workpath/types';
import { ConfigCodeView, CourseInline } from '../components/CourseMarkdown';
import { CourseBtn } from '../components/CourseUi';
import { Callout, Card, Pill, Spinner, Stars } from '@/features/workpath/components/ui';

export const ReadView: React.FC<{ n: number }> = ({ n }) => {
  const { courseId, accent } = useCourseMeta();
  const { data: cat } = useCourseCatalog(courseId);
  const { data: cur } = useCourseCurriculum(courseId);
  const { data: codeMap } = useCourseReadings(courseId);
  const s = COURSE_PROGRESS_STORES[courseId]((x) => x.state);
  const setStatus = COURSE_PROGRESS_STORES[courseId]((x) => x.setCatalogStatus);
  const { go, back } = COURSE_NAV_STORES[courseId]();
  const [shown, setShown] = useState<Record<string, boolean>>({});

  if (!cat || !cur) return <Spinner />;
  const it = cat.items.find((i) => i.n === n);
  if (!it) return <div className="p-6 text-slate-400">Không tìm thấy cấu hình #{n}.</div>;

  const st = catalogStatus(s, it.id);
  const myLevel = courseCurrentLevel(s, cur);
  const readings = cur.modules.flatMap((m) =>
    m.readings
      .filter((r) => r.catalogN === it.n || r.path === it.path)
      .map((r) => ({ ...r, module: m }))
  );
  const rawCode = codeMap?.[it.path];
  const mark = (status: CatalogStatus) => setStatus(it.id, status);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <div className="space-y-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:space-y-0">
        <div>
          <CourseBtn accent={accent} onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </CourseBtn>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="break-all font-mono text-lg font-bold text-white sm:text-xl">
            <span className="text-slate-500">#{it.n}</span> {it.path}
          </h1>
          <p className="text-sm text-slate-400">
            {cat.categories[it.category] ?? it.category} · cấp {it.level} ({cur.levels[String(it.level)]}) ·{' '}
            <Stars n={it.quality} /> · {it.loc} dòng
          </p>
        </div>
      </div>

      {it.flags.includes('outdated') && (
        <Callout tone="warn">
          <b>Cấu hình lịch sử / API cũ:</b> File này minh hoạ cú pháp đã ngừng hỗ trợ trong hệ sinh thái 2026 — chỉ đọc để biết cách nâng cấp khi bảo trì dự án cũ, <b>không chép vào dự án mới</b>.
        </Callout>
      )}
      {it.flags.includes('security-risk') && (
        <Callout tone="bad">
          <b>Cảnh báo bảo mật:</b> File này cố tình chứa cấu hình nguy hiểm (chạy quyền root, lộ quyền RBAC hoặc nối chuỗi trực tiếp gây Script Injection). Hãy đọc kỹ nhiệm vụ để tìm ra điểm hở.
        </Callout>
      )}
      {it.level > myLevel && (
        <Callout tone="info">
          Cấu hình này thuộc cấp {it.level}, bạn đang ở cấp {myLevel}. Bạn vẫn có thể đọc trước để làm quen.
        </Callout>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {it.flags.map((f) => (
          <Pill key={f} tone={f === 'security-risk' ? 'bad' : 'warn'}>
            {cat.flagLabels[f] ?? f}
          </Pill>
        ))}
        {it.tags.map((t) => (
          <Pill key={t}>{t}</Pill>
        ))}
        {it.sourceUrl && (
          <a
            href={it.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-sky-400 underline underline-offset-2 hover:text-sky-300"
          >
            Nguồn tham chiếu <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </div>

      <Card className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">
          Trạng thái: <b className="text-slate-100">{CATALOG_STATUS_LABEL[st]}</b>
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <CourseBtn accent={accent} onClick={() => mark('reading')}>
            Đang đọc
          </CourseBtn>
          <CourseBtn variant="primary" accent={accent} onClick={() => mark('done')}>
            Đã đọc hiểu (+10 XP)
          </CourseBtn>
          <CourseBtn accent={accent} onClick={() => mark('rewritten')}>
            Đã tự viết lại (+25 XP)
          </CourseBtn>
          <CourseBtn accent={accent} onClick={() => mark('skip')}>
            Bỏ qua
          </CourseBtn>
        </div>
      </Card>

      {readings.map((r, k) => {
        const kind = DEVOPS_KIND_LABEL[r.kind] ?? DEVOPS_KIND_LABEL.good;
        return (
          <Card key={k}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${kind.cls}`}>{kind.label}</span>
              <span>gắn với</span>
              <button
                type="button"
                onClick={() => go({ name: 'module', id: r.module.id })}
                className="inline-flex min-h-[44px] items-center rounded-lg px-2 font-semibold text-sky-400 underline underline-offset-2 hover:bg-slate-800/60 cursor-pointer"
              >
                {r.module.id} · {r.module.title}
              </button>
            </div>
            <p className="mt-2 text-slate-200">
              <CourseInline text={r.note} accent={accent} />
            </p>
            {r.task && (
              <p className="mt-2 text-slate-200">
                <b>Nhiệm vụ phân tích:</b> <CourseInline text={r.task} accent={accent} />
              </p>
            )}
            {r.answer &&
              (shown[`${k}`] ? (
                <Callout tone="ok" className="mt-2">
                  <b>Đáp án & phân tích:</b> <CourseInline text={r.answer} accent={accent} />
                </Callout>
              ) : (
                <CourseBtn accent={accent} className="mt-2" onClick={() => setShown({ ...shown, [`${k}`]: true })}>
                  Xem đáp án phân tích
                </CourseBtn>
              ))}
          </Card>
        );
      })}

      <section>
        <h2 className="mb-1 text-base font-semibold text-white">Nội dung cấu hình</h2>
        {!codeMap ? (
          <Spinner />
        ) : rawCode ? (
          <ConfigCodeView code={rawCode} language={it.language} numbered maxHeight="72vh" />
        ) : (
          <Callout tone="warn">Không tìm thấy nội dung của file {it.path}.</Callout>
        )}
      </section>
    </div>
  );
};

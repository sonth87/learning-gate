import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCourseCurriculum } from '../data';
import { courseDueCards } from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import { CourseMarkdown } from '../components/CourseMarkdown';
import { CourseBar, CourseBtn } from '../components/CourseUi';
import { Callout, PageHeader, Spinner } from '@/features/workpath/components/ui';

export const FlashView: React.FC<{ moduleId?: string }> = ({ moduleId }) => {
  const { courseId, accent } = useCourseMeta();
  const { data: cur } = useCourseCurriculum(courseId);
  const progressStore = COURSE_PROGRESS_STORES[courseId];
  const rate = progressStore((x) => x.rateCard);
  const { go, back } = COURSE_NAV_STORES[courseId]();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [practiceFirstModule, setPracticeFirstModule] = useState(false);
  const [remembered, setRemembered] = useState(0);

  const cards = useMemo(() => {
    if (!cur) return [];
    const st = progressStore.getState().state;
    const list = courseDueCards(st, cur, moduleId, practiceFirstModule);
    return list.sort(() => Math.random() - 0.5).slice(0, 20);
  }, [cur, moduleId, practiceFirstModule, progressStore]);

  const card = cards[i];
  const answer = (ok: boolean) => {
    if (!card) return;
    rate(card.id, ok);
    if (ok) setRemembered((n) => n + 1);
    setI((n) => n + 1);
    setFlipped(false);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement)?.matches?.('input,textarea,select')) return;
      if (ev.key === ' ') {
        ev.preventDefault();
        setFlipped(true);
      } else if (flipped && ev.key === '1') answer(false);
      else if (flipped && ev.key === '2') answer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, card]);

  if (!cur) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <PageHeader
        title="Flashcard SRS"
        sub="Lặp lại ngắt quãng (Leitner): nhớ → thẻ giãn lịch 1 · 2 · 4 · 8 · 16 ngày; quên → hỏi lại ngày mai."
        right={
          <CourseBtn accent={accent} onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </CourseBtn>
        }
      />
      {cards.length === 0 ? (
        <div className="space-y-3">
          <Callout tone="ok">
            Không có thẻ nào đến hạn ôn hôm nay 🎉. Đọc thêm lesson để mở khoá thẻ mới, hoặc ôn trước bộ thẻ nhập môn.
          </Callout>
          <CourseBtn variant="primary" accent={accent} onClick={() => setPracticeFirstModule(true)}>
            Ôn thử ngay các thẻ có sẵn
          </CourseBtn>
        </div>
      ) : i >= cards.length ? (
        <div className="space-y-3">
          <Callout tone="ok">
            Hoàn tất phiên ôn: nhớ <b>{remembered}</b>/{cards.length} thẻ.
          </Callout>
          <CourseBtn variant="primary" accent={accent} onClick={() => go({ name: 'home' })}>
            Về tổng quan
          </CourseBtn>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
            <span>
              Thẻ {i + 1}/{cards.length} · {card.id}
            </span>
            <CourseBar value={i / cards.length} accent={accent} className="max-w-[200px]" />
          </div>
          <div className="flex min-h-[260px] flex-col justify-center rounded-2xl border border-slate-700 bg-slate-900/70 p-6 sm:p-8">
            <CourseMarkdown source={card.front} accent={accent} className="text-lg" />
            {flipped && (
              <>
                <hr className="my-4 border-slate-700" />
                <CourseMarkdown source={card.back} accent={accent} className="text-emerald-200" />
              </>
            )}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {flipped ? (
              <>
                <CourseBtn variant="danger" accent={accent} onClick={() => answer(false)}>
                  😅 Quên <kbd className="ml-1 hidden rounded bg-black/30 px-1 text-[10px] sm:inline">1</kbd>
                </CourseBtn>
                <CourseBtn variant="primary" accent={accent} onClick={() => answer(true)}>
                  ✔ Nhớ <kbd className="ml-1 hidden rounded bg-black/20 px-1 text-[10px] sm:inline">2</kbd>
                </CourseBtn>
              </>
            ) : (
              <CourseBtn variant="primary" accent={accent} onClick={() => setFlipped(true)}>
                Lật thẻ <kbd className="ml-1 hidden rounded bg-black/20 px-1 text-[10px] sm:inline">Space</kbd>
              </CourseBtn>
            )}
          </div>
        </>
      )}
    </div>
  );
};

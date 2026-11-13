import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { usePmpCurriculum } from '../data';
import { pmpDueCards } from '../logic';
import { usePmpNav, usePmpProgress } from '../store';
import { CourseMarkdown } from '@/features/devops-course/components/CourseMarkdown';
import { CourseBar, CourseBtn } from '@/features/devops-course/components/CourseUi';
import { Callout, PageHeader, Spinner } from '@/features/workpath/components/ui';

export const PmpFlashView: React.FC<{ moduleId?: string }> = ({ moduleId }) => {
  const { data: cur } = usePmpCurriculum();
  const rate = usePmpProgress((x) => x.rateCard);
  const { go, back } = usePmpNav();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [practiceAll, setPracticeAll] = useState(false);
  const [remembered, setRemembered] = useState(0);

  const cards = useMemo(() => {
    if (!cur) return [];
    const st = usePmpProgress.getState().state;
    const list = pmpDueCards(st, cur, moduleId, practiceAll);
    return list.sort(() => Math.random() - 0.5).slice(0, 20);
  }, [cur, moduleId, practiceAll]);

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
        title="Flashcard Phản Xạ Tư Duy PMP (SRS Leitner)"
        sub="Lặp lại ngắt quãng 5 hộp: nhớ → giãn lịch 1 · 2 · 4 · 8 · 16 ngày; quên → hỏi lại ngay ngày mai."
        right={
          <CourseBtn accent="amber" onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </CourseBtn>
        }
      />

      {cards.length === 0 ? (
        <div className="space-y-3">
          <Callout tone="ok">
            Không có thẻ phản xạ nào đến hạn ôn hôm nay 🎉. Đọc thêm module để mở khoá thẻ mới, hoặc bấm bên dưới để ôn trước bộ thẻ phản xạ cốt lõi.
          </Callout>
          <CourseBtn variant="primary" accent="amber" onClick={() => setPracticeAll(true)}>
            Ôn thử ngay các thẻ có sẵn
          </CourseBtn>
        </div>
      ) : i >= cards.length ? (
        <div className="space-y-3">
          <Callout tone="ok">
            Hoàn tất phiên ôn phản xạ: nhớ vững <b>{remembered}</b>/{cards.length} thẻ.
          </Callout>
          <CourseBtn variant="primary" accent="amber" onClick={() => go({ name: 'home' })}>
            Về tổng quan
          </CourseBtn>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
            <span>
              Thẻ {i + 1}/{cards.length} · {card.id}
            </span>
            <CourseBar value={i / cards.length} accent="amber" className="max-w-[200px]" />
          </div>
          <div className="flex min-h-[260px] flex-col justify-center rounded-2xl border border-slate-700 bg-slate-900/70 p-6 sm:p-8">
            <CourseMarkdown source={card.front} accent="amber" className="text-lg" />
            {flipped && (
              <>
                <hr className="my-4 border-slate-700" />
                <CourseMarkdown source={card.back} accent="amber" className="text-amber-200" />
              </>
            )}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {flipped ? (
              <>
                <CourseBtn variant="danger" accent="amber" onClick={() => answer(false)}>
                  😅 Chưa chắc / Quên <kbd className="ml-1 hidden rounded bg-black/30 px-1 text-[10px] sm:inline">1</kbd>
                </CourseBtn>
                <CourseBtn variant="primary" accent="amber" onClick={() => answer(true)}>
                  ✔ Phản xạ chuẩn <kbd className="ml-1 hidden rounded bg-black/20 px-1 text-[10px] sm:inline">2</kbd>
                </CourseBtn>
              </>
            ) : (
              <CourseBtn variant="primary" accent="amber" onClick={() => setFlipped(true)}>
                Lật xem phản xạ chuẩn PMI <kbd className="ml-1 hidden rounded bg-black/20 px-1 text-[10px] sm:inline">Space</kbd>
              </CourseBtn>
            )}
          </div>
        </>
      )}
    </div>
  );
};

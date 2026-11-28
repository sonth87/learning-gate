import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Layers } from 'lucide-react';
import { useSdCurriculum } from '../data';
import { sdDueCards } from '../logic';
import { useSdNav, useSdProgress } from '../store';
import { useCourseEnOverlay } from '@/data/i18n/loader';
import type { CourseEnCardOverlay } from '@/data/i18n/types';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { CourseMarkdown } from '@/features/devops-course/components/CourseMarkdown';
import { CourseBar, CourseBtn } from '@/features/devops-course/components/CourseUi';
import { Callout, Spinner } from '@/features/workpath/components/ui';

/** Flashcard Leitner 5 hộp: nhớ ⇒ lên hộp, quên ⇒ về hộp 1 (`rateCard`). Không dùng srsRepo. */
export const SdFlashView: React.FC<{ moduleId?: string }> = ({ moduleId }) => {
  const { data: cur } = useSdCurriculum();
  const rate = useSdProgress((x) => x.rateCard);
  const { go, back } = useSdNav();
  const lang = useWorkbenchStore((st) => st.language);
  const enOverlay = useCourseEnOverlay('sysdesign');

  const cardOverlayById = useMemo(() => {
    const map = new Map<string, CourseEnCardOverlay>();
    if (!enOverlay?.modules) return map;
    for (const modEn of Object.values(enOverlay.modules)) {
      if (modEn.cards) {
        for (const [cId, cEn] of Object.entries(modEn.cards)) {
          map.set(cId, cEn);
        }
      }
    }
    return map;
  }, [enOverlay]);

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [practiceAll, setPracticeAll] = useState(false);
  const [remembered, setRemembered] = useState(0);

  const cards = useMemo(() => {
    if (!cur) return [];
    const st = useSdProgress.getState().state;
    const list = sdDueCards(st, cur, moduleId, practiceAll);
    return [...list].sort(() => Math.random() - 0.5).slice(0, 20);
  }, [cur, moduleId, practiceAll]);
  const active = cards[idx];

  const answer = (ok: boolean) => {
    if (!active) return;
    rate(active.id, ok);
    if (ok) setRemembered((n) => n + 1);
    setIdx((n) => n + 1);
    setFlipped(false);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement)?.matches?.('input,textarea,select')) return;
      if (!active) return;
      if (ev.key === ' ') {
        ev.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ev.key === '1') answer(false);
      else if (flipped && ev.key === '2') answer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, flipped]);

  if (!cur) return <Spinner />;

  const activeEn = active && lang === 'en' ? cardOverlayById.get(active.id) : undefined;

  return (
    <div className="mx-auto max-w-3xl p-4 text-[var(--dts-ink)] sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CourseBtn accent="cyan" onClick={back}>
          <ArrowLeft className="h-4 w-4" /> {lang === 'en' ? 'Back' : 'Quay lại'}
        </CourseBtn>
        <div>
          <h1 className="font-mono text-xl font-extrabold sm:text-2xl">
            Flashcard{moduleId ? ` · ${moduleId}` : ''}
          </h1>
          <p className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--dts-ink-muted)]">
            <Layers className="h-3.5 w-3.5" />
            {lang === 'en'
              ? '5-box spaced repetition: recall schedules intervals of 1 · 2 · 4 · 8 · 16 days'
              : 'Lặp lại ngắt quãng 5 hộp: nhớ thì giãn lịch 1 · 2 · 4 · 8 · 16 ngày'}
          </p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="space-y-3">
          <Callout tone="ok">
            {lang === 'en'
              ? 'No cards due today. Read more lessons to unlock new cards, or practice available cards early.'
              : 'Không có thẻ nào đến hạn hôm nay. Đọc thêm bài để mở thẻ mới, hoặc ôn trước các thẻ có sẵn.'}
          </Callout>
          <CourseBtn variant="primary" accent="cyan" onClick={() => setPracticeAll(true)}>
            {lang === 'en' ? 'Practice Available Cards' : 'Ôn các thẻ có sẵn'}
          </CourseBtn>
        </div>
      ) : idx >= cards.length ? (
        <div className="space-y-3">
          <Callout tone="ok">
            {lang === 'en' ? (
              <>
                Review session complete: recalled <b>{remembered}</b>/{cards.length} cards.
              </>
            ) : (
              <>
                Hoàn tất phiên ôn: nhớ <b>{remembered}</b>/{cards.length} thẻ.
              </>
            )}
          </Callout>
          <CourseBtn variant="primary" accent="cyan" onClick={() => go({ name: 'home' })}>
            {lang === 'en' ? 'Back to Overview' : 'Về tổng quan'}
          </CourseBtn>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-3 font-mono text-xs text-[var(--dts-ink-muted)]">
            <span>
              {lang === 'en' ? 'Card' : 'Thẻ'} {idx + 1}/{cards.length} · {active.id}
            </span>
            <CourseBar value={idx / cards.length} accent="cyan" className="max-w-[200px]" />
          </div>
          <div className="dts-card-tactile flex min-h-[240px] flex-col justify-center rounded-2xl bg-[var(--dts-panel-elevated)] p-6 sm:p-8">
            <CourseMarkdown source={activeEn?.frontEn ?? active.front} accent="cyan" className="text-lg" />
            {flipped && (
              <>
                <hr className="my-4 border-[var(--dts-border-soft)]" />
                <CourseMarkdown source={activeEn?.backEn ?? active.back} accent="cyan" />
              </>
            )}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {flipped ? (
              <>
                <CourseBtn variant="danger" accent="cyan" onClick={() => answer(false)}>
                  {lang === 'en' ? 'Forgot' : 'Chưa nhớ'}{' '}
                  <kbd className="ml-1 hidden rounded bg-black/15 px-1 text-[10px] sm:inline">1</kbd>
                </CourseBtn>
                <CourseBtn variant="primary" accent="cyan" onClick={() => answer(true)}>
                  {lang === 'en' ? 'Recalled' : 'Đã nhớ'}{' '}
                  <kbd className="ml-1 hidden rounded bg-black/15 px-1 text-[10px] sm:inline">2</kbd>
                </CourseBtn>
              </>
            ) : (
              <CourseBtn variant="primary" accent="cyan" onClick={() => setFlipped(true)}>
                {lang === 'en' ? 'Flip Card' : 'Lật thẻ'}{' '}
                <kbd className="ml-1 hidden rounded bg-black/15 px-1 text-[10px] sm:inline">Space</kbd>
              </CourseBtn>
            )}
          </div>
        </>
      )}
    </div>
  );
};

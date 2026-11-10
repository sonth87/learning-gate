import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCurriculum } from '../data';
import { dueCards } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import { Markdown } from '../components/Markdown';
import { Bar, Btn, Callout, PageHeader, Spinner } from '../components/ui';

export const FlashView: React.FC<{ moduleId?: string }> = ({ moduleId }) => {
  const { data: cur } = useCurriculum();
  const rate = useWpProgress((x) => x.rateCard);
  const { go, back } = useWpNav();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [remembered, setRemembered] = useState(0);

  // Chốt danh sách thẻ khi vào phiên ôn (không đổi giữa chừng khi tiến độ thay đổi)
  const cards = useMemo(() => {
    if (!cur) return [];
    const list = dueCards(useWpProgress.getState().state, cur, moduleId);
    return list.sort(() => Math.random() - 0.5).slice(0, 20);
  }, [cur, moduleId]);

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
        title="Flashcard"
        sub="Lặp lại ngắt quãng: nhớ → thẻ giãn lịch 1 · 2 · 4 · 8 · 16 ngày; quên → hỏi lại ngày mai."
        right={
          <Btn onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Btn>
        }
      />
      {cards.length === 0 ? (
        <Callout tone="ok">Không có thẻ nào đến hạn ôn hôm nay 🎉. Đọc thêm lesson để mở khoá thẻ mới.</Callout>
      ) : i >= cards.length ? (
        <div className="space-y-3">
          <Callout tone="ok">
            Hết phiên ôn: nhớ <b>{remembered}</b>/{cards.length} thẻ.
          </Callout>
          <Btn variant="primary" onClick={() => go({ name: 'home' })}>
            Về tổng quan
          </Btn>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
            <span>
              Thẻ {i + 1}/{cards.length} · {card.id}
            </span>
            <Bar value={i / cards.length} className="max-w-[200px]" />
          </div>
          <div className="flex min-h-[260px] flex-col justify-center rounded-2xl border border-slate-700 bg-slate-900/70 p-6 sm:p-8">
            <Markdown source={card.front} className="text-lg" />
            {flipped && (
              <>
                <hr className="my-4 border-slate-700" />
                <Markdown source={card.back} className="text-emerald-200" />
              </>
            )}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {flipped ? (
              <>
                <Btn variant="danger" onClick={() => answer(false)}>
                  😅 Quên <kbd className="ml-1 rounded bg-black/30 px-1 text-[10px]">1</kbd>
                </Btn>
                <Btn variant="primary" onClick={() => answer(true)}>
                  ✔ Nhớ <kbd className="ml-1 rounded bg-black/20 px-1 text-[10px]">2</kbd>
                </Btn>
              </>
            ) : (
              <Btn variant="primary" onClick={() => setFlipped(true)}>
                Lật thẻ <kbd className="ml-1 rounded bg-black/20 px-1 text-[10px]">Space</kbd>
              </Btn>
            )}
          </div>
        </>
      )}
    </div>
  );
};

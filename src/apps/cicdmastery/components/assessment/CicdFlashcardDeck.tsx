import React, { useState } from 'react';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { CICD_FLASHCARDS } from '../../data/cicdAssessmentsAndGlossaryData';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { cn } from '@/utils/cn';

export const CicdFlashcardDeck: React.FC = () => {
  const { srsStates, rateFlashcard } = useUserDataStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const card = CICD_FLASHCARDS[currentIndex] || CICD_FLASHCARDS[0];
  const srs = srsStates[card.id];

  const handleRate = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    await rateFlashcard(card.id, rating);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % CICD_FLASHCARDS.length);
  };

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-6 space-y-6">
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-cyan-400">
            <Layers className="h-4 w-4" />
            <span>Flashcards Ôn tập Ngắt quãng (SRS — CI/CD Architecture)</span>
          </div>
          <h1 className="text-lg font-extrabold text-white">
            Ghi nhớ Nhanh Kiến trúc CI/CD, DevSecOps, GitOps & Xử lý Sự cố
          </h1>
        </div>
        <span className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 font-mono text-xs font-bold text-cyan-300">
          Thẻ {currentIndex + 1} / {CICD_FLASHCARDS.length}
        </span>
      </div>

      {/* Card Surface */}
      <div
        onClick={() => setIsFlipped((v) => !v)}
        className="cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 sm:p-8 min-h-[300px] flex flex-col justify-between transition-all hover:border-cyan-500/50 shadow-xl"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 font-mono text-xs font-bold text-cyan-300">
              {card.category}
            </span>
            <span className="font-mono text-xs text-amber-300">
              📄 {card.pdfRef}
            </span>
          </div>
          <LevelBadge level={card.level} />
        </div>

        <div className="my-6 space-y-4">
          {!isFlipped ? (
            <div className="space-y-3 text-center py-6">
              <div className="font-mono text-xs uppercase text-cyan-400">
                Câu hỏi Kiến trúc & Thực chiến (Bấm vào thẻ để lật xem đáp án)
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white leading-relaxed">
                {card.frontQuestion}
              </h2>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="font-mono text-xs uppercase text-emerald-400 font-bold">
                ✅ Đáp án Chuẩn Kỹ thuật:
              </div>
              <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
                {card.backAnswer}
              </p>
              {card.codeSnippet && (
                <pre className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-cyan-200 overflow-x-auto">
                  {card.codeSnippet}
                </pre>
              )}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold">
                💡 Chốt kiến thức: {card.keyTakeaway}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
          <span>
            {srs ? `Đã ôn ${srs.reviewCount} lần` : 'Thẻ mới chưa đánh giá'}
          </span>
          <span className="text-cyan-400 font-semibold">
            {isFlipped ? 'Bấm để quay lại câu hỏi' : 'Bấm để lật xem đáp án ↻'}
          </span>
        </div>
      </div>

      {/* SRS Rating & Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex(
              (prev) => (prev - 1 + CICD_FLASHCARDS.length) % CICD_FLASHCARDS.length
            );
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 hover:border-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Thẻ trước</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'again', label: 'Quên (Học lại)', cls: 'border-rose-500/40 bg-rose-500/15 text-rose-300' },
              { id: 'hard', label: 'Khó', cls: 'border-amber-500/40 bg-amber-500/15 text-amber-300' },
              { id: 'good', label: 'Nhớ tốt', cls: 'border-sky-500/40 bg-sky-500/15 text-sky-300' },
              { id: 'easy', label: 'Rất dễ', cls: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleRate(btn.id)}
              className={cn(
                'rounded-xl border px-3.5 py-2 text-xs font-bold transition-all hover:scale-105',
                btn.cls
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex((prev) => (prev + 1) % CICD_FLASHCARDS.length);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 hover:border-slate-700"
        >
          <span>Thẻ tiếp</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

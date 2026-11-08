import React from 'react';
import { Lightbulb, Sparkles, ArrowRight, Globe2 } from 'lucide-react';
import { VisualAnalogy } from '@/types/curriculum.types';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';

export const AnalogyCard: React.FC<{ analogy: VisualAnalogy }> = ({
  analogy,
}) => {
  return (
    <section
      id="sec-analogy"
      className="scroll-mt-20 rounded-2xl border border-amber-500/25 bg-slate-900/60 p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Hình tượng hóa & Mô hình Tư duy (Mental Model)
          </span>
          <h3 className="text-base font-bold text-white mt-0.5">
            {analogy.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            <RichTextWithTerms text={analogy.realWorldScenario} />
          </p>
        </div>
      </div>

      {/* Mapping Grid */}
      <div className="grid gap-3 md:grid-cols-3">
        {analogy.mappingPoints.map((mp, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <Globe2 className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
                <span>Thực tế: {mp.realWorld}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-sky-300">
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                <span>
                  <RichTextWithTerms text={mp.pythonEquivalent} />
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
              <RichTextWithTerms text={mp.explanation} />
            </p>
          </div>
        ))}
      </div>

      {/* Mental Model Tip */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
        <Sparkles className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
        <div>
          <strong className="font-semibold text-amber-300">
            Mẹo ghi nhớ cốt lõi:{' '}
          </strong>
          <RichTextWithTerms text={analogy.mentalModelTip} />
        </div>
      </div>
    </section>
  );
};

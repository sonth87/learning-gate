import React from 'react';
import { ArrowRightLeft, EyeOff } from 'lucide-react';
import { JsTsComparison } from '@/types/curriculum.types';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';

export const JsComparisonCard: React.FC<{
  comparisons?: JsTsComparison[];
}> = ({ comparisons }) => {
  const { showJsTsComparison, toggleJsTsComparison } = useSettingsStore();

  if (!comparisons || comparisons.length === 0) return null;

  if (!showJsTsComparison) {
    return (
      <div
        id="sec-js-bridge"
        className="scroll-mt-20 flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-2.5 text-xs text-slate-400"
      >
        <span>
          Đang ẩn phần Đối chiếu JS/TS (Chế độ Thuần Python Zero-to-Hero).
        </span>
        <button
          onClick={toggleJsTsComparison}
          className="inline-flex items-center gap-1.5 font-semibold text-cyan-400 hover:text-cyan-300"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span>Bật xem Đối chiếu JS/TS</span>
        </button>
      </div>
    );
  }

  return (
    <section
      id="sec-js-bridge"
      className="scroll-mt-20 rounded-2xl bg-cyan-950/15 p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
            <ArrowRightLeft className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Đối chiếu JavaScript / TypeScript ↔ Python
            </h3>
            <p className="text-[11px] text-cyan-200/70">
              Liên hệ với kiến thức JS/TS sẵn có để nắm bắt nhanh hơn
            </p>
          </div>
        </div>

        <button
          onClick={toggleJsTsComparison}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
        >
          <EyeOff className="h-3 w-3" />
          <span>Ẩn JS/TS</span>
        </button>
      </div>

      <div className="space-y-3">
        {comparisons.map((cmp, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-slate-950/75 p-4 space-y-3"
          >
            <div className="text-xs font-bold text-cyan-300">{cmp.concept}</div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-slate-900/60 p-3 space-y-1.5">
                <span className="inline-block rounded bg-yellow-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-yellow-300">
                  JavaScript / TypeScript
                </span>
                <p className="text-xs text-slate-300">{cmp.jsTsWay}</p>
                {cmp.jsCode && (
                  <pre className="mt-1.5 overflow-x-auto rounded bg-slate-950 p-2 font-mono text-[11px] text-yellow-200/90">
                    <code>{cmp.jsCode}</code>
                  </pre>
                )}
              </div>

              <div className="rounded-lg bg-sky-500/10 p-3 space-y-1.5">
                <span className="inline-block rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
                  Python 3.11+
                </span>
                <p className="text-xs text-slate-200">{cmp.pythonWay}</p>
                {cmp.pythonCode && (
                  <pre className="mt-1.5 overflow-x-auto rounded bg-slate-950 p-2 font-mono text-[11px] text-sky-200">
                    <code>{cmp.pythonCode}</code>
                  </pre>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 border-t border-slate-800/60 pt-2">
              <strong className="text-cyan-300">Khác biệt chính: </strong>
              <RichTextWithTerms text={cmp.keyDifference} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

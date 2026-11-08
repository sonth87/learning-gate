import React from 'react';
import { Briefcase, CheckCircle, Sparkles } from 'lucide-react';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';

interface UseCasesAndTipsProps {
  useCases: {
    title: string;
    scenario: string;
    whyPythonFits: string;
  }[];
  tips: string[];
}

export const UseCasesAndTips: React.FC<UseCasesAndTipsProps> = ({
  useCases,
  tips,
}) => {
  return (
    <div id="sec-usecases" className="scroll-mt-20 grid gap-5 lg:grid-cols-2">
      {/* Use Cases */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3.5">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-sky-400" />
          <h3 className="text-sm font-bold text-white">
            Use Cases Thực tế trong Dự án Production
          </h3>
        </div>

        <div className="space-y-3">
          {useCases.map((uc, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3.5 space-y-1.5"
            >
              <h4 className="text-xs font-bold text-sky-300">{uc.title}</h4>
              <p className="text-xs text-slate-300">
                <strong className="text-slate-200">Bối cảnh: </strong>
                <RichTextWithTerms text={uc.scenario} />
              </p>
              <p className="text-xs text-slate-300">
                <strong className="text-emerald-400">Giải pháp Python: </strong>
                <RichTextWithTerms text={uc.whyPythonFits} />
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tips & Best Practices */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            Tips, Best Practices & Chuẩn mực Pythonic
          </h3>
        </div>

        <ul className="space-y-2.5">
          {tips.map((tip, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 rounded-xl border border-slate-800/90 bg-slate-950/70 p-3 text-xs text-slate-200 leading-relaxed"
            >
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <RichTextWithTerms text={tip} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

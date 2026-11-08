import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { CommonIssueGotcha } from '@/types/curriculum.types';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';

export const GotchasSection: React.FC<{ issues: CommonIssueGotcha[] }> = ({
  issues,
}) => {
  if (!issues || issues.length === 0) return null;

  return (
    <section id="sec-gotchas" className="scroll-mt-20 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-rose-400" />
        <h3 className="text-base font-bold text-white">
          Các Bẫy Kinh điển, Lỗi Phổ biến & Vấn đề Thường gặp (Gotchas & Pitfalls)
        </h3>
      </div>

      <div className="grid gap-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="rounded-2xl border border-rose-500/30 bg-rose-950/15 p-5 space-y-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <h4 className="text-sm font-bold text-rose-200">
                  {issue.title}
                </h4>
              </div>
              <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase text-rose-300">
                Mức độ: {issue.severity === 'critical' ? 'Nghiêm trọng' : 'Cảnh báo'}
              </span>
            </div>

            <div className="grid gap-2 text-xs text-slate-300">
              <div>
                <strong className="text-slate-100">Triệu chứng / Biểu hiện: </strong>
                <RichTextWithTerms text={issue.symptom} />
              </div>
              <div>
                <strong className="text-slate-100">Nguyên nhân sâu xa bên dưới: </strong>
                <RichTextWithTerms text={issue.whyItHappens} />
              </div>
            </div>

            {/* Wrong vs Right Code */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-rose-500/40 bg-slate-950 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Cách viết SAI (Dễ sập / Rò rỉ dữ liệu):</span>
                </div>
                <pre className="overflow-x-auto font-mono text-[11px] leading-5 text-rose-200/90">
                  <code>{issue.wrongCode}</code>
                </pre>
              </div>

              <div className="rounded-xl border border-emerald-500/40 bg-slate-950 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Cách viết ĐÚNG (Chuẩn Pythonic):</span>
                </div>
                <pre className="overflow-x-auto font-mono text-[11px] leading-5 text-emerald-200/90">
                  <code>{issue.rightCode}</code>
                </pre>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-200">
              <strong className="text-emerald-400">Giải pháp khắc phục: </strong>
              <RichTextWithTerms text={issue.fixExplanation} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

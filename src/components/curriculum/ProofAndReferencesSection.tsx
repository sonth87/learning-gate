import React from 'react';
import {
  BarChart3,
  ExternalLink,
  BookOpenCheck,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react';
import { BenchmarkProof, ExternalReference } from '@/types/curriculum.types';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';
import { cn } from '@/utils/cn';

interface ProofAndReferencesSectionProps {
  proofs?: BenchmarkProof[];
  references?: ExternalReference[];
}

export const ProofAndReferencesSection: React.FC<
  ProofAndReferencesSectionProps
> = ({ proofs, references }) => {
  const hasProofs = proofs && proofs.length > 0;
  const hasRefs = references && references.length > 0;

  if (!hasProofs && !hasRefs) return null;

  return (
    <div id="sec-proofs" className="scroll-mt-20 space-y-6">
      {/* 1. Benchmarks, Bytecode & Technical Proofs */}
      {hasProofs && (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Minh chứng Kỹ thuật, Đo lường Thực tế & Dẫn chứng (Benchmarks & Proofs)
              </h3>
              <p className="text-xs text-slate-400">
                Số liệu đo đạc thực tế về bộ nhớ RAM (`sys.getsizeof`), tốc độ thực thi và Bytecode trong CPython
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {proofs!.map((proof) => (
              <div
                key={proof.id}
                className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">
                        {proof.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      <strong className="text-emerald-300">Luận điểm kiểm chứng: </strong>
                      <RichTextWithTerms text={proof.claim} />
                    </p>
                  </div>
                  <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-[10px] text-slate-400">
                    Phương pháp đo: {proof.methodology}
                  </span>
                </div>

                {/* Visual Comparison Bars */}
                <div className="space-y-2.5 pt-1">
                  {proof.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800/90 bg-slate-900/60 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {m.isOptimal && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          )}
                          <RichTextWithTerms text={m.label} />
                        </span>
                        <span
                          className={cn(
                            'font-mono font-bold px-2 py-0.5 rounded text-[11px]',
                            m.isOptimal
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-amber-300'
                          )}
                        >
                          {m.valueText}
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${Math.max(4, Math.min(100, m.barPercent))}%` }}
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            m.isOptimal
                              ? 'bg-gradient-to-r from-emerald-400 to-sky-400'
                              : 'bg-gradient-to-r from-rose-500 to-amber-500'
                          )}
                        />
                      </div>

                      <p className="text-[11px] text-slate-400">
                        <RichTextWithTerms text={m.note} />
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2 text-xs text-emerald-200">
                  <strong>Kết luận thực nghiệm: </strong>
                  <RichTextWithTerms text={proof.takeaway} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Official References & Further Reading */}
      {hasRefs && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Nguồn Tham khảo Chính thống & Tài liệu Đọc thêm (Official Docs & PEPs)
              </h3>
              <p className="text-[11px] text-slate-400">
                Các đặc tả kỹ thuật PEP và tài liệu chính thức từ Python Software Foundation / cộng đồng
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {references!.map((ref, idx) => (
              <a
                key={idx}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 hover:border-amber-500/40 hover:bg-slate-900 transition-all space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      {ref.sourceType}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-300 transition-colors" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                    {ref.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {ref.description}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-sky-400 truncate">
                  {ref.url}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

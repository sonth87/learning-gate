import React from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Compass,
  GitBranch,
  Scale,
  SkipForward,
  Sparkles,
  Target,
  Undo2,
} from 'lucide-react';
import { usePmpCurriculum } from '../data';
import {
  isModuleSkipped,
  pmpCurrentLevel,
  pmpModuleDone,
  pmpModuleEvidenceProgress,
  pmpModuleProgress,
  quizBest,
  sortedPmpModules,
} from '../logic';
import { usePmpNav, usePmpProgress } from '../store';
import { CourseBar } from '@/features/devops-course/components/CourseUi';
import { PageHeader, Pill, Spinner } from '@/features/workpath/components/ui';
import { PmpTrademarkFooter, ProvenancePill } from '../components/PmpShared';
import { cn } from '@/utils/cn';

function getLevelChip(level: number) {
  switch (level) {
    case 0:
      return {
        label: 'Định hướng',
        cls: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
        icon: <Compass className="h-3 w-3" aria-hidden="true" />,
      };
    case 1:
      return {
        label: 'Nguyên tắc PMBOK 8',
        cls: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
        icon: <Sparkles className="h-3 w-3" aria-hidden="true" />,
      };
    case 2:
      return {
        label: 'Agile & Hybrid',
        cls: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
        icon: <GitBranch className="h-3 w-3" aria-hidden="true" />,
      };
    case 3:
      return {
        label: '7 Domains',
        cls: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
        icon: <Scale className="h-3 w-3" aria-hidden="true" />,
      };
    default:
      return {
        label: 'Giải đề & Thi',
        cls: 'border-violet-500/40 bg-violet-500/15 text-violet-300',
        icon: <Target className="h-3 w-3" aria-hidden="true" />,
      };
  }
}

export const PmpRoadmapView: React.FC = () => {
  const { data: cur } = usePmpCurriculum();
  const s = usePmpProgress((x) => x.state);
  const toggleSkipModule = usePmpProgress((x) => x.toggleSkipModule);
  const skipModulesBatch = usePmpProgress((x) => x.skipModulesBatch);
  const go = usePmpNav((x) => x.go);

  if (!cur) return <Spinner />;
  const ordered = sortedPmpModules(cur);
  const current = pmpCurrentLevel(s, cur);
  const levels = [...new Set(ordered.map((m) => m.level))].sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Lộ trình 6 Cấp độ Hình thành Tư duy PMP"
        sub={`${ordered.length} module sắp xếp theo (level, order) · Bám sát PMBOK® Guide 8th Edition (2025) & ECO 07/2026, bắc cầu trực tiếp sang dẫn chứng và 4.318 câu hỏi bên PMP Mindmap.`}
      />

      <div className="space-y-6">
        {levels.map((lv) => {
          const mods = ordered.filter((m) => m.level === lv);
          const quizCount = mods.reduce((n, m) => n + m.quiz.length, 0);
          const linkCount = mods.reduce((n, m) => n + m.evidenceLinkIds.length, 0);
          const uncompletedMods = mods.filter((m) => !pmpModuleDone(s, m, cur.passQuiz));
          const skippedModsInLevel = mods.filter((m) => isModuleSkipped(s, m.id));

          return (
            <section key={lv} aria-labelledby={`pmp-lv-${lv}`}>
              <div
                className={cn(
                  'mb-2.5 flex flex-wrap items-center gap-2 rounded-xl border-l-4 bg-slate-900/80 px-3.5 py-2.5',
                  lv === current ? 'border-amber-500' : 'border-slate-700'
                )}
              >
                <h2 id={`pmp-lv-${lv}`} className="text-base font-bold text-white">
                  Cấp {lv} · {cur.levels[String(lv)]}
                </h2>
                {lv === current && <Pill tone="ok">bạn đang ở đây</Pill>}
                <div className="ml-auto flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-normal text-slate-400">
                    {mods.length} module · {quizCount} câu quiz · {linkCount} deep link
                  </span>
                  {uncompletedMods.length > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        skipModulesBatch(
                          uncompletedMods.map((m) => m.id),
                          true
                        )
                      }
                      title={`Đánh dấu bỏ qua toàn bộ ${uncompletedMods.length} module chưa hoàn thành ở Cấp ${lv}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white cursor-pointer"
                    >
                      <SkipForward className="h-3 w-3" />
                      <span>Bỏ qua cấp {lv}</span>
                    </button>
                  ) : skippedModsInLevel.length > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        skipModulesBatch(
                          skippedModsInLevel.map((m) => m.id),
                          false
                        )
                      }
                      title={`Khôi phục ${skippedModsInLevel.length} module đã bỏ qua ở Cấp ${lv}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/20 cursor-pointer"
                    >
                      <Undo2 className="h-3 w-3" />
                      <span>Khôi phục cấp {lv}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mods.map((m) => {
                  const [d, t] = pmpModuleProgress(s, m, cur.passQuiz);
                  const complete = pmpModuleDone(s, m, cur.passQuiz);
                  const skipped = isModuleSkipped(s, m.id);
                  const [evDone, evTotal] = pmpModuleEvidenceProgress(s, m);
                  const chip = getLevelChip(m.level);

                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'group flex min-h-[142px] flex-col justify-between rounded-xl border bg-slate-900/75 p-3.5 transition-colors hover:bg-slate-800/80',
                        lv === current && !complete
                          ? 'border-amber-500/40 hover:border-amber-500/70'
                          : 'border-slate-800 hover:border-amber-500/60'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => go({ name: 'module', id: m.id })}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-sm font-extrabold text-amber-400">{m.id}</span>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold',
                                chip.cls
                              )}
                            >
                              {chip.icon}
                              <span>{chip.label}</span>
                            </span>
                          </div>
                          {skipped ? (
                            <Pill tone="info">đã bỏ qua</Pill>
                          ) : complete ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Đã hoàn thành" />
                          ) : d > 0 ? (
                            <Pill tone="warn">đang học</Pill>
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300" aria-hidden="true" />
                          )}
                        </div>

                        <div className="mt-1.5 font-semibold text-slate-100 leading-snug">{m.title}</div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400 leading-relaxed">{m.summary}</p>

                        {m.provenance.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {m.provenance.slice(0, 2).map((p, idx) => (
                              <ProvenancePill key={idx} kind={p.kind} label={p.label} detail={p.detail} />
                            ))}
                          </div>
                        )}
                      </button>

                      <div className="mt-3">
                        <CourseBar value={t ? d / t : 0} accent="amber" />
                        <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[11px] text-slate-500">
                          <span>
                            quiz {quizBest(s, m.id) ? `${Math.round(quizBest(s, m.id) * 100)}%` : '—'} · dẫn chứng {evDone}/{evTotal}
                          </span>
                          {(!complete || skipped) && (
                            <button
                              type="button"
                              onClick={() => toggleSkipModule(m.id)}
                              title={skipped ? 'Hoàn tác bỏ qua module này' : 'Đã biết — Bỏ qua module này'}
                              className="inline-flex items-center gap-1 rounded border border-slate-700/80 bg-slate-950/70 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400 hover:border-slate-500 hover:text-white cursor-pointer"
                            >
                              {skipped ? <Undo2 className="h-2.5 w-2.5" /> : <SkipForward className="h-2.5 w-2.5" />}
                              <span>{skipped ? 'Hoàn tác' : 'Bỏ qua'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <PmpTrademarkFooter />
    </div>
  );
};

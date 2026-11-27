import React, { useMemo } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Flame, ListChecks, SkipForward, Sparkles, Star, Layers } from 'lucide-react';
import { useSdCurriculum } from '../data';
import {
  activeDays,
  addDays,
  isModuleSkipped,
  lessonRead,
  quizSatisfied,
  rankOfSd,
  sdCurrentLevel,
  sdDueCards,
  sdModuleDone,
  sdNextSteps,
  sortedSdModules,
  streak,
  todayStr,
} from '../logic';
import { useSdNav, useSdProgress } from '../store';
import { CourseBar } from '@/features/devops-course/components/CourseUi';
import { Card, PageHeader, Spinner } from '@/features/workpath/components/ui';
import { cn } from '@/utils/cn';

const Stat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  bar?: number;
}> = ({ icon, label, value, sub, bar }) => (
  <Card className="relative overflow-hidden">
    <div className="absolute right-3 top-3 text-slate-700">{icon}</div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="mt-0.5 text-2xl font-bold tabular-nums text-white">{value}</div>
    {sub && <div className="text-xs text-slate-400">{sub}</div>}
    {bar !== undefined && <CourseBar value={bar} accent="cyan" className="mt-2" />}
  </Card>
);

export const SdHomeView: React.FC = () => {
  const { data: cur } = useSdCurriculum();
  const s = useSdProgress((x) => x.state);
  const applySkipTarget = useSdProgress((x) => x.applySkipTarget);
  const go = useSdNav((x) => x.go);

  const heat = useMemo(() => {
    const days = activeDays(s);
    const start = new Date();
    start.setDate(start.getDate() - 7 * 16 + 1);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const cells: { key: string; v: number }[] = [];
    for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const key = todayStr(d);
      cells.push({ key, v: days[key] ?? 0 });
    }
    return cells;
  }, [s]);

  if (!cur) return <Spinner />;
  const mods = sortedSdModules(cur);
  const level = sdCurrentLevel(s, cur);
  const rank = rankOfSd(s.xp);
  const modsDone = mods.filter((m) => sdModuleDone(s, m, cur.passQuiz)).length;
  const quizzesPassed = mods.filter((m) => m.quiz.length > 0 && quizSatisfied(s, m.id, cur.passQuiz)).length;
  const dueCount = sdDueCards(s, cur).length;
  const steps = sdNextSteps(s, cur);
  const fresh = s.xp === 0 && Object.keys(s.lessons).length === 0;
  const levels = [...new Set(mods.map((m) => m.level))].sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title={fresh ? 'Chào mừng đến System Design Mastery' : 'Chào mừng quay lại lộ trình System Design'}
        sub={`Cấp hiện tại ${level}: ${cur.levels[String(level)] ?? 'Đã hoàn thành toàn bộ lộ trình'}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<Star className="h-6 w-6" />}
          label="XP · cấp bậc"
          value={s.xp}
          sub={`${rank.name}${rank.toNext ? ` · còn ${rank.toNext} XP` : ''}`}
        />
        <Stat icon={<Flame className="h-6 w-6" />} label="Chuỗi ngày học" value={`${streak(s)} ngày`} />
        <Stat
          icon={<BookOpen className="h-6 w-6" />}
          label="Bài hoàn thành"
          value={`${modsDone}/${mods.length}`}
          bar={mods.length ? modsDone / mods.length : 0}
        />
        <Stat
          icon={<ListChecks className="h-6 w-6" />}
          label="Quiz đạt chuẩn (≥70%)"
          value={`${quizzesPassed}/${mods.length}`}
          sub={dueCount > 0 ? `${dueCount} thẻ đến hạn` : 'Không có thẻ trễ hạn'}
          bar={mods.length ? quizzesPassed / mods.length : 0}
        />
      </div>

      <section aria-labelledby="sd-next-steps">
        <h2 id="sd-next-steps" className="mb-2 text-base font-semibold text-white">
          Bước kế tiếp
        </h2>
        <div className="space-y-2">
          {steps.map((st, i) => (
            <div
              key={i}
              className={cn(
                'flex min-h-[48px] w-full items-center gap-2 rounded-xl border bg-slate-900/70 px-3 py-2.5 transition-colors hover:bg-slate-800/85 sm:px-4',
                i === 0 ? 'border-cyan-500/60 ring-1 ring-cyan-500/30' : 'border-slate-800'
              )}
            >
              <button
                type="button"
                onClick={() => go(st.view)}
                className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    i === 0 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-slate-100">{st.text}</span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-400"
                  aria-hidden="true"
                />
              </button>
              {st.skipTarget && (
                <button
                  type="button"
                  onClick={() => applySkipTarget(st.skipTarget!)}
                  title="Đã nắm vững, bỏ qua bước này"
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                >
                  <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Bỏ qua</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="sd-levels">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h2 id="sd-levels" className="flex items-center gap-2 text-base font-bold text-white">
            <Sparkles className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            <span>Các bài theo cấp ({mods.length} bài)</span>
          </h2>
          <button
            type="button"
            onClick={() => go({ name: 'roadmap' })}
            className="cursor-pointer text-xs font-semibold text-cyan-400 hover:text-cyan-300"
          >
            Xem lộ trình →
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {levels.map((lv) => (
            <div key={lv} className="space-y-2.5 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.04] p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold leading-snug text-white">
                  Cấp {lv} · {cur.levels[String(lv)]}
                </h3>
                <span className="font-mono text-xs text-slate-400">{mods.filter((m) => m.level === lv).length} bài</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mods
                  .filter((m) => m.level === lv)
                  .map((m) => {
                    const skipped = isModuleSkipped(s, m.id);
                    const done = sdModuleDone(s, m, cur.passQuiz);
                    const read = lessonRead(s, m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => go({ name: 'module', id: m.id })}
                        title={`${m.id} · ${m.title}${skipped ? ' (đã bỏ qua)' : ''}`}
                        className={cn(
                          'inline-flex min-h-[32px] cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-left text-xs transition-colors',
                          skipped
                            ? 'border-sky-500/35 bg-sky-500/10 text-sky-300'
                            : done
                              ? 'border-emerald-500/45 bg-emerald-500/12 text-emerald-300'
                              : read
                                ? 'border-cyan-500/45 bg-cyan-500/12 text-cyan-200'
                                : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-600 hover:text-white'
                        )}
                      >
                        {skipped ? (
                          <SkipForward className="h-3 w-3 shrink-0 text-sky-400" aria-hidden="true" />
                        ) : (
                          done && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" aria-hidden="true" />
                        )}
                        <span className="font-mono font-bold">{m.id}</span>
                        <span className="max-w-[160px] truncate">{m.title}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="sd-heat">
        <h2 id="sd-heat" className="mb-2 text-base font-semibold text-white">
          Nhịp học 16 tuần
        </h2>
        <Card className="overflow-x-auto">
          <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ width: 'max-content' }}>
            {heat.map((c) => (
              <i
                key={c.key}
                title={`${c.key}: ${c.v} XP`}
                className={cn(
                  'block h-3 w-3 rounded-sm',
                  c.v === 0
                    ? 'bg-slate-800'
                    : c.v < 15
                      ? 'bg-cyan-900'
                      : c.v < 50
                        ? 'bg-cyan-700'
                        : c.v < 100
                          ? 'bg-cyan-500'
                          : 'bg-cyan-300'
                )}
              />
            ))}
          </div>
        </Card>
      </section>

      {dueCount === 0 && s.log.length > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span>Không có thẻ nào đến hạn ôn hôm nay (lịch kế tiếp: {addDays(todayStr(), 1)}).</span>
        </p>
      )}
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Layers className="h-3.5 w-3.5" aria-hidden="true" />
        Mô phỏng đúng xu hướng và độ lớn, không đúng số tuyệt đối.
      </p>
    </div>
  );
};

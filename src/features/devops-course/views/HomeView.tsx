import React, { useMemo } from 'react';
import { ArrowRight, BookOpen, Code2, Flame, Library, Star, Trophy } from 'lucide-react';
import { useCourseCatalog, useCourseCurriculum } from '../data';
import {
  activeDays,
  addDays,
  catalogStatus,
  courseCurrentLevel,
  courseDueCards,
  courseModuleDone,
  courseNextSteps,
  exStatus,
  rankOfCourse,
  sortedModules,
  streak,
  todayStr,
} from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import { Card, PageHeader, Spinner } from '@/features/workpath/components/ui';
import { CourseBar } from '../components/CourseUi';
import type { DevOpsAccent } from '../types';
import { cn } from '@/utils/cn';

const Stat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  bar?: number;
  accent: DevOpsAccent;
}> = ({ icon, label, value, sub, bar, accent }) => (
  <Card className="relative overflow-hidden">
    <div className="absolute right-3 top-3 text-slate-700">{icon}</div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="mt-0.5 text-2xl font-bold tabular-nums text-white">{value}</div>
    {sub && <div className="text-xs text-slate-400">{sub}</div>}
    {bar !== undefined && <CourseBar value={bar} accent={accent} className="mt-2" />}
  </Card>
);

export const HomeView: React.FC = () => {
  const meta = useCourseMeta();
  const { courseId, accent } = meta;
  const { data: cur } = useCourseCurriculum(courseId);
  const { data: cat } = useCourseCatalog(courseId);
  const s = COURSE_PROGRESS_STORES[courseId]((x) => x.state);
  const go = COURSE_NAV_STORES[courseId]((x) => x.go);

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
  const mods = sortedModules(cur);
  const level = courseCurrentLevel(s, cur);
  const rank = rankOfCourse(courseId, s.xp);
  const exs = mods.flatMap((m) => m.exercises);
  const modsDone = mods.filter((m) => courseModuleDone(s, m, cur.passQuiz)).length;
  const exPassed = exs.filter((e) => exStatus(s, e.id) === 'passed').length;
  const readDone = cat ? cat.items.filter((i) => ['done', 'rewritten'].includes(catalogStatus(s, i.id))).length : 0;
  const steps = courseNextSteps(s, cur, cat, meta.appTitle);
  const fresh = s.xp === 0 && Object.keys(s.lessons).length === 0;

  const firstBorder = accent === 'cyan' ? 'border-cyan-500/60 ring-1 ring-cyan-500/30' : 'border-sky-500/60 ring-1 ring-sky-500/30';
  const firstBadge = accent === 'cyan' ? 'bg-cyan-500 text-slate-950' : 'bg-sky-500 text-slate-950';
  const stepNumTone = accent === 'cyan' ? 'text-cyan-400' : 'text-sky-400';
  const hoverArrow = accent === 'cyan' ? 'group-hover:text-cyan-400' : 'group-hover:text-sky-400';

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title={fresh ? meta.welcomeTitle : 'Chào mừng quay lại 👋'}
        sub={`Cấp độ ${level}: ${cur.levels[String(level)] ?? 'Đã hoàn thành toàn bộ lộ trình'}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          accent={accent}
          icon={<Star className="h-6 w-6" />}
          label="XP · danh hiệu"
          value={s.xp}
          sub={`${rank.name}${rank.toNext ? ` · còn ${rank.toNext} XP lên hạng` : ''}`}
        />
        <Stat accent={accent} icon={<Flame className="h-6 w-6" />} label="Chuỗi ngày học" value={`${streak(s)} ngày`} />
        <Stat
          accent={accent}
          icon={<BookOpen className="h-6 w-6" />}
          label="Module hoàn thành"
          value={`${modsDone}/${mods.length}`}
          bar={mods.length ? modsDone / mods.length : 0}
        />
        <Stat
          accent={accent}
          icon={<Code2 className="h-6 w-6" />}
          label="Bài thực hành đạt"
          value={`${exPassed}/${exs.length}`}
          bar={exs.length ? exPassed / exs.length : 0}
        />
        <Stat
          accent={accent}
          icon={<Library className="h-6 w-6" />}
          label="Cấu hình thật đã đọc"
          value={`${readDone}/${cat?.items.length ?? '…'}`}
          bar={cat && cat.items.length ? readDone / cat.items.length : 0}
        />
      </div>

      <section aria-labelledby="next-steps">
        <h2 id="next-steps" className="mb-2 text-base font-semibold text-white">
          Việc nên làm tiếp
        </h2>
        <div className="space-y-2">
          {steps.map((st, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(st.view)}
              className={cn(
                'group flex min-h-[48px] w-full items-center gap-3 rounded-xl border bg-slate-900/70 px-4 py-3 text-left transition-colors hover:bg-slate-800 cursor-pointer',
                i === 0 ? firstBorder : 'border-slate-800'
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  i === 0 ? firstBadge : 'bg-slate-800 text-slate-300'
                )}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 text-slate-100">{st.text}</span>
              <ArrowRight
                className={cn('h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5', hoverArrow)}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </section>

      {fresh && (
        <Card>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-white">
            <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" /> Cách học trong 5 bước (lặp lại cho mỗi module)
          </h2>
          <ol className="grid gap-2 text-sm text-slate-300 sm:grid-cols-5">
            {meta.stepSteps.map((t, i) => (
              <li key={t} className="rounded-lg bg-slate-800/60 p-2.5">
                <span className={cn('mr-1.5 font-bold', stepNumTone)}>{i + 1}.</span>
                {t}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-slate-400">
            Mọi bài học được giải thích từ góc nhìn <b>lập trình viên Node.js/npm</b>. Thứ tự trong trang <b>Lộ trình</b> (theo{' '}
            <code>level</code> và <code>order</code>) là thứ tự học chuẩn, và mục <b>"Việc nên làm tiếp"</b> luôn chỉ đúng bước tiếp theo.
          </p>
        </Card>
      )}

      <section aria-labelledby="heat">
        <h2 id="heat" className="mb-2 text-base font-semibold text-white">
          Hoạt động 16 tuần
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
                    : accent === 'cyan'
                      ? c.v < 15
                        ? 'bg-cyan-900'
                        : c.v < 50
                          ? 'bg-cyan-700'
                          : c.v < 100
                            ? 'bg-cyan-500'
                            : 'bg-cyan-300'
                      : c.v < 15
                        ? 'bg-sky-900'
                        : c.v < 50
                          ? 'bg-sky-700'
                          : c.v < 100
                            ? 'bg-sky-500'
                            : 'bg-sky-300'
                )}
              />
            ))}
          </div>
        </Card>
      </section>

      {courseDueCards(s, cur).length === 0 && s.log.length > 0 && (
        <p className="text-sm text-slate-500">
          Không có thẻ nào đến hạn ôn hôm nay 🎉 (ngày kế tiếp: {addDays(todayStr(), 1)}).
        </p>
      )}
    </div>
  );
};

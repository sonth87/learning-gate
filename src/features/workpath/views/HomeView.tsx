import React, { useMemo } from 'react';
import { ArrowRight, BookOpen, Code2, Flame, Library, SkipForward, Star, Trophy } from 'lucide-react';
import { useCatalog, useCurriculum } from '../data';
import { activeDays, addDays, currentLevel, dueCards, exStatus, moduleDone, nextSteps, rankOf, streak, todayStr } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import { Bar, Card, PageHeader, Spinner } from '../components/ui';
import { cn } from '@/utils/cn';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { useCourseEnOverlay } from '@/data/i18n/loader';
import type { CourseEnOverlay } from '@/data/i18n/types';
import type { WpCurriculum } from '../types';

const RANK_EN: Record<string, string> = {
  'Tập sự': 'Novice',
  'Người mới': 'Beginner',
  'Học viên': 'Learner',
  Coder: 'Coder',
  Pythonista: 'Pythonista',
  'Senior Pythonista': 'Senior Pythonista',
};

function translateStepText(text: string, cur: WpCurriculum, enOverlay: CourseEnOverlay | null): string {
  const mLesson = text.match(/^Đọc lý thuyết (M\d+) · (.+)$/);
  if (mLesson) {
    const [, id, viTitle] = mLesson;
    const title = enOverlay?.modules?.[id]?.titleEn ?? viTitle;
    return `Read lesson ${id} · ${title}`;
  }
  const mQuiz = text.match(/^Làm quiz (M\d+) \(cần ≥ (\d+%)\)$/);
  if (mQuiz) {
    return `Take quiz ${mQuiz[1]} (need ≥ ${mQuiz[2]})`;
  }
  const mExFinish = text.match(/^Hoàn thành bài (M\d+\.\d+) · (.+)$/);
  if (mExFinish) {
    const [, code, viTitle] = mExFinish;
    const ex = cur.modules.flatMap((m) => m.exercises).find((e) => e.code === code);
    const title = (ex && enOverlay?.modules?.[ex.module]?.exercises?.[ex.id]?.titleEn) ?? viTitle;
    return `Finish exercise ${code} · ${title}`;
  }
  const mExStart = text.match(/^Nhận bài (M\d+\.\d+) · (.+)$/);
  if (mExStart) {
    const [, code, viTitle] = mExStart;
    const ex = cur.modules.flatMap((m) => m.exercises).find((e) => e.code === code);
    const title = (ex && enOverlay?.modules?.[ex.module]?.exercises?.[ex.id]?.titleEn) ?? viTitle;
    return `Start exercise ${code} · ${title}`;
  }
  const mFlash = text.match(/^Ôn (\d+) flashcard đến hạn$/);
  if (mFlash) return `Review ${mFlash[1]} due flashcards`;
  const mReview = text.match(/^Ôn lại (\d+) câu quiz từng sai$/);
  if (mReview) return `Review ${mReview[1]} missed quiz questions`;
  if (text.startsWith('Khám phá 39 Dự án')) {
    return 'Explore 39 Real-World Projects & Project-Based Learning in VS Code IDE';
  }
  return text;
}

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; sub?: React.ReactNode; bar?: number }> = ({ icon, label, value, sub, bar }) => (
  <Card className="relative overflow-hidden">
    <div className="absolute right-3 top-3 text-slate-700">{icon}</div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="mt-0.5 text-2xl font-bold tabular-nums text-white">{value}</div>
    {sub && <div className="text-xs text-slate-400">{sub}</div>}
    {bar !== undefined && <Bar value={bar} className="mt-2" />}
  </Card>
);

export const HomeView: React.FC = () => {
  const { data: cur } = useCurriculum();
  const { data: cat } = useCatalog();
  const s = useWpProgress((x) => x.state);
  const applySkipTarget = useWpProgress((x) => x.applySkipTarget);
  const go = useWpNav((x) => x.go);
  const lang = useWorkbenchStore((x) => x.language);
  const enOverlay = useCourseEnOverlay('python');
  const isEn = lang === 'en';

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
  const level = currentLevel(s, cur);
  const levelName = isEn ? (enOverlay?.levels?.[String(level)] ?? cur.levels[String(level)]) : cur.levels[String(level)];
  const rank = rankOf(s.xp);
  const rankName = isEn ? (RANK_EN[rank.name] ?? rank.name) : rank.name;
  const exs = cur.modules.flatMap((m) => m.exercises);
  const modsDone = cur.modules.filter((m) => moduleDone(s, m, cur.passQuiz)).length;
  const exPassed = exs.filter((e) => exStatus(s, e.id) === 'passed').length;
  const steps = nextSteps(s, cur, cat);
  const fresh = s.xp === 0 && Object.keys(s.lessons).length === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title={fresh ? (isEn ? 'Welcome to PyMastery 👋' : 'Chào mừng bạn đến với PyMastery 👋') : isEn ? 'Welcome back 👋' : 'Chào mừng quay lại 👋'}
        sub={isEn ? `Level ${level}: ${levelName ?? 'Roadmap completed'}` : `Cấp độ ${level}: ${levelName ?? 'Hoàn thành lộ trình'}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          icon={<Star className="h-6 w-6" />}
          label={isEn ? 'XP · rank' : 'XP · danh hiệu'}
          value={s.xp}
          sub={`${rankName}${rank.toNext ? (isEn ? ` · ${rank.toNext} XP to next rank` : ` · còn ${rank.toNext} XP lên hạng`) : ''}`}
        />
        <Stat icon={<Flame className="h-6 w-6" />} label={isEn ? 'Study streak' : 'Chuỗi ngày học'} value={isEn ? `${streak(s)} days` : `${streak(s)} ngày`} />
        <Stat icon={<BookOpen className="h-6 w-6" />} label={isEn ? 'Modules completed' : 'Module hoàn thành'} value={`${modsDone}/${cur.modules.length}`} bar={modsDone / cur.modules.length} />
        <Stat icon={<Code2 className="h-6 w-6" />} label={isEn ? 'Exercises passed' : 'Bài tập đạt'} value={`${exPassed}/${exs.length}`} bar={exPassed / exs.length} />
        <Stat
          icon={<Library className="h-6 w-6" />}
          label={isEn ? 'Real-World Projects & PBL' : 'Dự án Thực tế & PBL'}
          value={isEn ? '39 projects' : '39 dự án'}
          sub={isEn ? '10 categories • VS Code IDE' : '10 chuyên mục • VS Code IDE'}
          bar={1}
        />
      </div>

      <section aria-labelledby="next-steps">
        <h2 id="next-steps" className="mb-2 text-base font-semibold text-white">
          {isEn ? 'Next steps' : 'Việc nên làm tiếp'}
        </h2>
        <div className="space-y-2">
          {steps.map((st, i) => (
            <div
              key={i}
              className={cn(
                'flex w-full items-center gap-2 rounded-xl border bg-slate-900/70 px-3 sm:px-4 py-2.5 transition-colors hover:bg-slate-800/85',
                i === 0 ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800'
              )}
            >
              <button
                type="button"
                onClick={() => go(st.view)}
                className="group flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
              >
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold', i === 0 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300')}>{i + 1}</span>
                <span className="min-w-0 flex-1 text-slate-100">{isEn ? translateStepText(st.text, cur, enOverlay) : st.text}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" aria-hidden="true" />
              </button>
              {st.skipTarget && (
                <button
                  type="button"
                  onClick={() => applySkipTarget(st.skipTarget!)}
                  title={isEn ? 'Already done / already know — Skip this step to move to the next part' : 'Đã làm rồi / đã biết — Bỏ qua bước này để sang phần kế tiếp'}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white cursor-pointer"
                >
                  <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{isEn ? 'Skip' : 'Bỏ qua'}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {fresh && (
        <Card>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-white">
            <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" />{' '}
            {isEn ? 'How to learn in 5 steps (repeat for each module)' : 'Cách học trong 5 bước (lặp lại cho mỗi module)'}
          </h2>
          <ol className="grid gap-2 text-sm text-slate-300 sm:grid-cols-5">
            {(isEn
              ? ['Read the lesson, try the examples', 'Take the quiz (need ≥ 70%)', 'Solve exercises — graded with real tests', 'Explore Real-World Projects & PBL in IDE', 'Review flashcards & missed quiz questions daily']
              : ['Đọc lesson, gõ thử ví dụ', 'Làm quiz (cần ≥ 70%)', 'Làm bài tập — chấm bằng test thật', 'Khám phá Dự án Thực tế & PBL trong IDE', 'Ôn flashcard & quiz sai mỗi ngày']
            ).map((t, i) => (
              <li key={t} className="rounded-lg bg-slate-800/60 p-2.5">
                <span className="mr-1.5 font-bold text-emerald-400">{i + 1}.</span>
                {t}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-slate-400">
            {isEn ? (
              <>
                Module codes (M25, M27…) are <b>not</b> in learning order — the order in the <b>Roadmap</b> page is the actual learning order. &ldquo;Next steps&rdquo; always points to the right next step.
              </>
            ) : (
              <>
                Mã module (M25, M27…) <b>không</b> theo thứ tự học — thứ tự trong trang <b>Lộ trình</b> mới là thứ tự học. Mục &ldquo;Việc nên làm tiếp&rdquo; luôn chỉ đúng bước kế tiếp.
              </>
            )}
          </p>
        </Card>
      )}

      <section aria-labelledby="heat">
        <h2 id="heat" className="mb-2 text-base font-semibold text-white">
          {isEn ? '16-week activity' : 'Hoạt động 16 tuần'}
        </h2>
        <Card className="overflow-x-auto">
          <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ width: 'max-content' }}>
            {heat.map((c) => (
              <i
                key={c.key}
                title={`${c.key}: ${c.v} XP`}
                className={cn('block h-3 w-3 rounded-sm', c.v === 0 ? 'bg-slate-800' : c.v < 10 ? 'bg-emerald-900' : c.v < 40 ? 'bg-emerald-700' : c.v < 80 ? 'bg-emerald-500' : 'bg-emerald-300')}
              />
            ))}
          </div>
        </Card>
      </section>

      {dueCards(s, cur).length === 0 && s.log.length > 0 && (
        <p className="text-sm text-slate-500">
          {isEn
            ? `No flashcards due for review today 🎉 (next date: ${addDays(todayStr(), 1)}).`
            : `Không có thẻ nào đến hạn ôn hôm nay 🎉 (ngày kế tiếp: ${addDays(todayStr(), 1)}).`}
        </p>
      )}
    </div>
  );
};

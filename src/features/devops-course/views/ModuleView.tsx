import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Container,
  Database,
  ExternalLink,
  Keyboard,
  Layers,
  ListChecks,
  Maximize2,
  Minimize2,
  ShieldCheck,
  SkipForward,
  Undo2,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';
import { useCourseCatalog, useCourseCurriculum } from '../data';
import {
  CATALOG_STATUS_LABEL,
  DEVOPS_KIND_LABEL,
  catalogStatus,
  courseModuleProgress,
  exStatus,
  isLessonSkipped,
  isModuleSkipped,
  isQuizSkipped,
  lessonRead,
  quizBest,
  sortedModules,
} from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import { useCourseEnOverlay } from '@/data/i18n/loader';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import type { CatalogStatus } from '@/features/workpath/types';
import {
  CourseInline,
  CourseMarkdown,
  extractMarkdownSections,
} from '../components/CourseMarkdown';
import { CourseBar, CourseBtn } from '../components/CourseUi';
import { Callout, Card, Pill, Spinner, Stars } from '@/features/workpath/components/ui';
import { cn } from '@/utils/cn';

const KIND_BADGE: Record<string, string> = {
  yaml: 'YAML AST',
  dockerfile: 'Dockerfile AST',
  dockerignore: '.dockerignore',
  cli: 'Terminal CLI',
  'redis-cli': 'Redis 8 VM',
  'redis-conf': 'redis.conf AST',
  troubleshoot: 'Chẩn đoán & Khắc phục lỗi',
};

interface DomainBrand {
  label: string;
  motto: string;
  badgeCls: string;
  heroGrad: string;
  icon: React.ReactNode;
}

function getModuleDomainBrand(moduleId: string): DomainBrand {
  const num = parseInt(moduleId.slice(1), 10);
  if (moduleId.startsWith('K')) {
    if (num <= 6) {
      return {
        label: 'DOCKER ENGINE & COMPOSE',
        motto: 'Build · Ship · Run · Isolate',
        badgeCls: 'border-sky-500/45 bg-sky-500/15 text-sky-300',
        heroGrad: 'from-sky-500/12 via-slate-900/90 to-slate-900/90 border-sky-500/30',
        icon: <Container className="h-3.5 w-3.5" aria-hidden="true" />,
      };
    }
    return {
      label: 'KUBERNETES ORCHESTRATION',
      motto: 'Declare · Reconcile · Scale · Self-Heal',
      badgeCls: 'border-indigo-500/45 bg-indigo-500/15 text-indigo-300',
      heroGrad: 'from-indigo-500/12 via-slate-900/90 to-slate-900/90 border-indigo-500/30',
      icon: <Boxes className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  if (moduleId.startsWith('R')) {
    if (num <= 8) {
      return {
        label: 'REDIS 8 DATA STRUCTURES & STREAMS',
        motto: 'Sub-Millisecond · Atomic · Pipelined · Event-Driven',
        badgeCls: 'border-rose-500/45 bg-rose-500/15 text-rose-300',
        heroGrad: 'from-rose-500/12 via-slate-900/90 to-slate-900/90 border-rose-500/30',
        icon: <Zap className="h-3.5 w-3.5" aria-hidden="true" />,
      };
    }
    return {
      label: 'CACHING ARCHITECTURE, PERSISTENCE & CLUSTER',
      motto: 'Shield · Persist · Failover · Shard 16384',
      badgeCls: 'border-amber-500/45 bg-amber-500/15 text-amber-300',
      heroGrad: 'from-amber-500/12 via-slate-900/90 to-slate-900/90 border-amber-500/30',
      icon: <Database className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  if (num <= 9) {
    return {
      label: 'CI/CD PIPELINE & DAG',
      motto: 'Trigger · Verify · Cache · Shard',
      badgeCls: 'border-cyan-500/45 bg-cyan-500/15 text-cyan-300',
      heroGrad: 'from-cyan-500/12 via-slate-900/90 to-slate-900/90 border-cyan-500/30',
      icon: <Workflow className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  return {
    label: 'DEVSECOPS, OIDC & GITOPS',
    motto: 'Harden · Keyless · Canary · Reconcile',
    badgeCls: 'border-emerald-500/45 bg-emerald-500/15 text-emerald-300',
    heroGrad: 'from-emerald-500/12 via-slate-900/90 to-slate-900/90 border-emerald-500/30',
    icon: <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />,
  };
}

const STATUS_LABEL_EN: Record<CatalogStatus, string> = {
  todo: 'To Do',
  reading: 'Reading',
  done: 'Read',
  rewritten: 'Rewritten',
  skip: 'Skipped',
};

const KIND_LABEL_EN: Record<string, string> = {
  good: 'SAMPLE',
  bug: 'FIND BUG',
  compare: 'COMPARE',
  outdated: 'OUTDATED',
  project: 'FULL FLOW',
  security: 'SECURITY',
};

export const ModuleView: React.FC<{ id: string }> = ({ id }) => {
  const { courseId, accent, onOpenRelatedTool } = useCourseMeta();
  const lang = useWorkbenchStore((s) => s.language);
  const enOverlay = useCourseEnOverlay(courseId);
  const { data: cur } = useCourseCurriculum(courseId);
  const { data: cat } = useCourseCatalog(courseId);
  const s = COURSE_PROGRESS_STORES[courseId]((x) => x.state);
  const markRead = COURSE_PROGRESS_STORES[courseId]((x) => x.markLessonRead);
  const toggleSkipModule = COURSE_PROGRESS_STORES[courseId]((x) => x.toggleSkipModule);
  const toggleSkipLesson = COURSE_PROGRESS_STORES[courseId]((x) => x.toggleSkipLesson);
  const toggleSkipQuiz = COURSE_PROGRESS_STORES[courseId]((x) => x.toggleSkipQuiz);
  const toggleSkipExercise = COURSE_PROGRESS_STORES[courseId]((x) => x.toggleSkipExercise);
  const { go, back } = COURSE_NAV_STORES[courseId]();
  const [wideMode, setWideMode] = useState(false);

  const m = cur?.modules.find((x) => x.id === id);
  const sections = useMemo(() => (m ? extractMarkdownSections(m.lesson) : []), [m]);
  const ordered = useMemo(() => (cur ? sortedModules(cur) : []), [cur]);

  if (!cur) return <Spinner />;
  if (!m) {
    return (
      <div className="p-6 text-slate-400">
        {lang === 'en' ? `Module ${id} not found.` : `Không tìm thấy module ${id}.`}
      </div>
    );
  }

  const modOv = lang === 'en' ? enOverlay?.modules?.[m.id] : undefined;
  const modTitle = modOv?.titleEn ?? m.title;
  const modSummary = modOv?.summaryEn ?? m.summary;
  const levelName =
    (lang === 'en' ? enOverlay?.levels?.[String(m.level)] : undefined) ?? cur.levels[String(m.level)];

  const idx = ordered.findIndex((x) => x.id === m.id);
  const prevMod = idx > 0 ? ordered[idx - 1] : null;
  const nextMod = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;
  const prevModTitle = prevMod
    ? (lang === 'en' ? enOverlay?.modules?.[prevMod.id]?.titleEn : undefined) ?? prevMod.title
    : '';
  const nextModTitle = nextMod
    ? (lang === 'en' ? enOverlay?.modules?.[nextMod.id]?.titleEn : undefined) ?? nextMod.title
    : '';

  const [d, t] = courseModuleProgress(s, m, cur.passQuiz);
  const read = lessonRead(s, m.id);
  const modSkipped = isModuleSkipped(s, m.id);
  const lesSkipped = isLessonSkipped(s, m.id);
  const qzSkipped = isQuizSkipped(s, m.id);
  const best = quizBest(s, m.id);
  const brand = getModuleDomainBrand(m.id);
  const codeTone = accent === 'cyan' ? 'text-cyan-400' : accent === 'rose' ? 'text-rose-400' : 'text-sky-400';
  const hoverBorder =
    accent === 'cyan' ? 'hover:border-cyan-500/60' : accent === 'rose' ? 'hover:border-rose-500/60' : 'hover:border-sky-500/60';

  const jumpToSection = (secId: string) => {
    const el = document.getElementById(secId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto max-w-[1440px] p-3.5 sm:p-6">
      {/* Top Action Bar */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <CourseBtn accent={accent} onClick={back} aria-label={lang === 'en' ? 'Back to roadmap' : 'Quay lại lộ trình'}>
            <ArrowLeft className="h-4 w-4" /> {lang === 'en' ? 'Roadmap' : 'Lộ trình'}
          </CourseBtn>
          <span className="hidden sm:inline font-mono text-xs text-slate-500">
            Module {idx + 1}/{ordered.length} · {lang === 'en' ? 'Level' : 'Cấp'} {m.level} ({levelName})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSkipModule(m.id)}
            title={
              modSkipped
                ? lang === 'en'
                  ? 'Restore this module to your active roadmap'
                  : 'Khôi phục module này vào lộ trình cần học'
                : lang === 'en'
                  ? 'Already mastered this? Skip the entire module to move on'
                  : 'Đã nắm vững phần này? Bỏ qua toàn bộ module để sang phần tiếp theo'
            }
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors cursor-pointer',
              modSkipped
                ? 'border-sky-500/50 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-white'
            )}
          >
            {modSkipped ? <Undo2 className="h-3.5 w-3.5" /> : <SkipForward className="h-3.5 w-3.5" />}
            <span>
              {modSkipped
                ? lang === 'en'
                  ? 'Module skipped · Undo'
                  : 'Đã bỏ qua module · Hoàn tác'
                : lang === 'en'
                  ? 'Skip this module'
                  : 'Bỏ qua module này'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWideMode((w) => !w)}
            className="hidden xl:inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white cursor-pointer"
            title={
              wideMode
                ? lang === 'en'
                  ? 'Show practice panel on the right'
                  : 'Hiện cột bài tập bên phải'
                : lang === 'en'
                  ? 'Expand full width for large diagrams'
                  : 'Mở rộng toàn khung để xem sơ đồ lớn'
            }
          >
            {wideMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span>
              {wideMode
                ? lang === 'en'
                  ? 'Show practice panel'
                  : 'Hiện cột luyện tập'
                : lang === 'en'
                  ? 'Expand full width'
                  : 'Đọc rộng toàn khung'}
            </span>
          </button>

          <div className="w-32 sm:w-44">
            <CourseBar value={t ? d / t : 0} accent={accent} />
            <div className="mt-0.5 text-right font-mono text-[11px] text-slate-400">
              {modSkipped
                ? lang === 'en'
                  ? 'All skipped'
                  : 'Đã bỏ qua toàn bộ'
                : lang === 'en'
                  ? `Completed ${d}/${t} items`
                  : `Hoàn thành ${d}/${t} mục`}
            </div>
          </div>
        </div>
      </div>

      {modSkipped && (
        <Callout tone="info" className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            {lang === 'en' ? (
              <>
                Module <b>{m.id}</b> is marked as <b>skipped</b> (already mastered). You can still read the lesson, take
                the quiz, or do exercises anytime.
              </>
            ) : (
              <>
                Module <b>{m.id}</b> đang được đánh dấu <b>bỏ qua</b> (đã nắm vững). Bạn vẫn có thể đọc bài, làm quiz
                hoặc thực hành bất cứ lúc nào.
              </>
            )}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {nextMod && (
              <CourseBtn variant="primary" accent={accent} onClick={() => go({ name: 'module', id: nextMod.id })}>
                {lang === 'en' ? `Next module: ${nextMod.id}` : `Sang module tiếp: ${nextMod.id}`}{' '}
                <ArrowRight className="h-3.5 w-3.5" />
              </CourseBtn>
            )}
            <CourseBtn accent={accent} onClick={() => toggleSkipModule(m.id, false)}>
              <Undo2 className="h-3.5 w-3.5" /> {lang === 'en' ? 'Undo skip' : 'Hoàn tác bỏ qua'}
            </CourseBtn>
          </div>
        </Callout>
      )}

      {/* Study Sheet Visual Hero Header */}
      <header
        className={cn(
          'mb-5 rounded-2xl bg-gradient-to-br p-4 sm:p-6',
          brand.heroGrad
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider',
                brand.badgeCls
              )}
            >
              {brand.icon}
              <span>{brand.label}</span>
            </span>
            <span className="rounded-md bg-amber-400/18 px-2 py-0.5 font-mono text-xs font-extrabold text-amber-200">
              {m.id}
            </span>
            <span className="font-mono text-xs text-slate-400">
              {lang === 'en' ? `Level ${m.level}` : `Cấp ${m.level}`} · {levelName}
            </span>
          </div>

          <span className="hidden md:inline font-mono text-[11px] font-semibold tracking-wide text-slate-400">
            {brand.motto}
          </span>
        </div>

        <h1 className="mt-2.5 text-xl sm:text-2xl lg:text-[26px] font-extrabold text-white leading-tight">
          {modTitle}
        </h1>

        {modSummary && (
          <p className="mt-2 max-w-4xl text-sm sm:text-[15px] text-slate-300 leading-relaxed">
            {modSummary}
          </p>
        )}

        {m.tags && m.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {m.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-950/65 px-2 py-0.5 font-mono text-[11px] text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Quick Section Jump Pills */}
        {sections.length > 0 && (
          <div className="mt-4 border-t border-slate-800/60 pt-3">
            <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'en' ? `Lesson Outline (${sections.length} sections)` : `Mục lục bài học (${sections.length} phần)`}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => jumpToSection(sec.id)}
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg bg-slate-950/75 px-2.5 py-1 text-left text-xs text-slate-300 transition-colors hover:bg-slate-950 hover:text-white cursor-pointer"
                >
                  <span className={cn('font-mono text-[11px] font-extrabold', codeTone)}>{sec.num}.</span>
                  <span className="line-clamp-1 max-w-[240px]">{sec.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div
        className={cn(
          'grid items-start gap-6',
          !wideMode && 'xl:grid-cols-[minmax(0,1fr)_380px]'
        )}
      >
        <article className="min-w-0 rounded-2xl bg-slate-900/45 p-4 sm:p-6 lg:p-7">
          <CourseMarkdown source={m.lesson} accent={accent} />

          {m.sources.length > 0 && (
            <div className="mt-7 rounded-xl bg-slate-950/55 p-3.5 text-xs text-slate-400">
              <div className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {lang === 'en' ? 'Official References' : 'Tài liệu tham khảo chính thức'}
              </div>
              <ul className="space-y-1">
                {m.sources.map((src) => (
                  <li key={src.url} className="flex flex-wrap items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 underline underline-offset-2 hover:text-sky-300 break-all"
                    >
                      {src.title}
                    </a>
                    {src.version && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
                        {src.version}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mark Read / Skip + Next Action CTA */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              {read ? (
                <Pill tone="ok">
                  {lang === 'en'
                    ? `✔ You have completed module ${m.id} theory`
                    : `✔ Bạn đã nắm xong lý thuyết module ${m.id}`}
                </Pill>
              ) : lesSkipped ? (
                <>
                  <Pill tone="info">
                    {lang === 'en' ? `Skipped ${m.id} theory` : `Đã bỏ qua lý thuyết ${m.id}`}
                  </Pill>
                  <CourseBtn accent={accent} onClick={() => markRead(m.id)}>
                    <CheckCircle2 className="h-4 w-4" />{' '}
                    {lang === 'en' ? 'Mark as read (+20 XP)' : 'Đánh dấu đã đọc (+20 XP)'}
                  </CourseBtn>
                  <CourseBtn accent={accent} onClick={() => toggleSkipLesson(m.id, false)}>
                    <Undo2 className="h-3.5 w-3.5" /> {lang === 'en' ? 'Undo' : 'Hoàn tác'}
                  </CourseBtn>
                </>
              ) : (
                <>
                  <CourseBtn variant="primary" accent={accent} onClick={() => markRead(m.id)}>
                    <CheckCircle2 className="h-4 w-4" />{' '}
                    {lang === 'en' ? 'Mark lesson as mastered (+20 XP)' : 'Đánh dấu đã nắm vững bài học (+20 XP)'}
                  </CourseBtn>
                  <CourseBtn accent={accent} onClick={() => toggleSkipLesson(m.id, true)}>
                    <SkipForward className="h-4 w-4" />{' '}
                    {lang === 'en' ? 'Already know — Skip theory' : 'Đã biết — Bỏ qua lý thuyết'}
                  </CourseBtn>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <CourseBtn
                accent={accent}
                onClick={() => go({ name: 'quiz', mode: 'module', moduleId: m.id })}
              >
                <ListChecks className="h-4 w-4" />{' '}
                {lang === 'en' ? `Take Quiz (${m.quiz.length} Qs)` : `Làm Quiz (${m.quiz.length} câu)`}
              </CourseBtn>
              {m.exercises[0] && (
                <CourseBtn
                  accent={accent}
                  onClick={() => go({ name: 'exercise', code: m.exercises[0].code })}
                >
                  {lang === 'en' ? `Practice ${m.exercises[0].code}` : `Thực hành ${m.exercises[0].code}`}{' '}
                  <ArrowRight className="h-4 w-4" />
                </CourseBtn>
              )}
            </div>
          </div>

          {/* Prev / Next Module Cards */}
          {(prevMod || nextMod) && (
            <nav
              aria-label={lang === 'en' ? 'Previous and next module navigation' : 'Điều hướng bài trước và bài tiếp theo'}
              className="mt-5 grid gap-3 border-t border-slate-800/80 pt-5 sm:grid-cols-2"
            >
              {prevMod ? (
                <button
                  type="button"
                  onClick={() => go({ name: 'module', id: prevMod.id })}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-left transition-colors cursor-pointer',
                    hoverBorder
                  )}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      {lang === 'en' ? 'Previous Module' : 'Module trước'}
                    </div>
                    <div className="truncate text-xs sm:text-sm font-bold text-slate-200">
                      <span className={cn('mr-1.5 font-mono', codeTone)}>{prevMod.id}</span>
                      {prevModTitle}
                    </div>
                  </div>
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextMod && (
                <button
                  type="button"
                  onClick={() => go({ name: 'module', id: nextMod.id })}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-right transition-colors cursor-pointer',
                    hoverBorder
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      {lang === 'en' ? 'Next Module' : 'Module tiếp theo'}
                    </div>
                    <div className="truncate text-xs sm:text-sm font-bold text-slate-200">
                      <span className={cn('mr-1.5 font-mono', codeTone)}>{nextMod.id}</span>
                      {nextModTitle}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              )}
            </nav>
          )}
        </article>

        <aside className={cn('space-y-4', !wideMode && 'xl:sticky xl:top-4')}>
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-white">
              {lang === 'en' ? 'Practice This Module' : 'Luyện tập module này'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <CourseBtn
                variant="primary"
                accent={accent}
                onClick={() => go({ name: 'quiz', mode: 'module', moduleId: m.id })}
              >
                <ListChecks className="h-4 w-4" /> Quiz ({m.quiz.length} {lang === 'en' ? 'Qs' : 'câu'})
              </CourseBtn>
              <CourseBtn accent={accent} onClick={() => go({ name: 'flash', moduleId: m.id })}>
                <Layers className="h-4 w-4" /> Flashcard ({m.cards.length})
              </CourseBtn>
              {m.drills.length > 0 && (
                <CourseBtn accent={accent} onClick={() => go({ name: 'drill', moduleId: m.id })}>
                  <Keyboard className="h-4 w-4" /> {lang === 'en' ? 'Typing Drill' : 'Luyện gõ'}
                </CourseBtn>
              )}
              {m.quiz.length > 0 && best < cur.passQuiz && (
                <CourseBtn accent={accent} onClick={() => toggleSkipQuiz(m.id)}>
                  {qzSkipped ? (
                    <>
                      <Undo2 className="h-3.5 w-3.5" /> {lang === 'en' ? 'Undo Skip Quiz' : 'Hoàn tác bỏ qua Quiz'}
                    </>
                  ) : (
                    <>
                      <SkipForward className="h-3.5 w-3.5" /> {lang === 'en' ? 'Skip Quiz' : 'Bỏ qua Quiz'}
                    </>
                  )}
                </CourseBtn>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {lang === 'en'
                ? `Best quiz: ${best ? `${Math.round(best * 100)}%` : qzSkipped ? 'skipped' : 'not taken'} · need ≥ ${Math.round(cur.passQuiz * 100)}% to pass`
                : `Quiz tốt nhất: ${best ? `${Math.round(best * 100)}%` : qzSkipped ? 'đã bỏ qua' : 'chưa làm'} · cần ≥ ${Math.round(cur.passQuiz * 100)}% để qua`}
            </p>
          </Card>

          {m.relatedTools && m.relatedTools.length > 0 && onOpenRelatedTool && (
            <Card>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white">
                <Wrench className="h-4 w-4 text-amber-400" aria-hidden="true" />{' '}
                {lang === 'en' ? 'Interactive Visual Labs' : 'Phòng thí nghiệm trực quan đi kèm'}
              </h2>
              <div className="space-y-2">
                {m.relatedTools.map((tool, i) => (
                  <button
                    key={`${tool.kind}-${tool.targetId}-${i}`}
                    type="button"
                    onClick={() => onOpenRelatedTool(tool)}
                    className="block min-h-[44px] w-full rounded-lg bg-slate-950/65 px-3 py-2 text-left transition-colors hover:bg-slate-950 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm font-medium text-slate-100">
                      <span>{tool.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    </div>
                    {tool.description && <div className="mt-0.5 text-xs text-slate-400">{tool.description}</div>}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <div>
            <h2 className="mb-2 text-sm font-semibold text-white">
              {lang === 'en' ? `Exercises (${m.exercises.length})` : `Bài thực hành (${m.exercises.length})`}
            </h2>
            <div className="space-y-2">
              {m.exercises.map((e) => {
                const st = exStatus(s, e.id);
                const exTitle = modOv?.exercises?.[e.id]?.titleEn ?? e.title;
                const kindLabel =
                  e.kind === 'troubleshoot' && lang === 'en'
                    ? 'Diagnose & Fix'
                    : KIND_BADGE[e.kind] ?? e.kind;
                return (
                  <div
                    key={e.id}
                    className="flex items-stretch justify-between gap-2 rounded-xl bg-slate-900/65 p-3 transition-colors hover:bg-slate-900"
                  >
                    <button
                      type="button"
                      onClick={() => go({ name: 'exercise', code: e.code })}
                      className="min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-100">
                          <span className={cn('mr-1.5 font-mono', codeTone)}>{e.code}</span>
                          {exTitle}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <Stars n={e.difficulty} />
                        <span>· {kindLabel}</span>
                      </div>
                    </button>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-1.5">
                      <Pill
                        tone={
                          st === 'passed'
                            ? 'ok'
                            : st === 'skipped'
                              ? 'info'
                              : st === 'started'
                                ? 'warn'
                                : 'neutral'
                        }
                      >
                        {st === 'passed'
                          ? lang === 'en'
                            ? 'passed'
                            : 'đạt'
                          : st === 'skipped'
                            ? lang === 'en'
                              ? 'skipped'
                              : 'đã bỏ qua'
                            : st === 'started'
                              ? lang === 'en'
                                ? 'in progress'
                                : 'đang làm'
                              : lang === 'en'
                                ? 'to do'
                                : 'chưa làm'}
                      </Pill>
                      {st !== 'passed' && (
                        <button
                          type="button"
                          onClick={() => toggleSkipExercise(e.id)}
                          title={
                            st === 'skipped'
                              ? lang === 'en'
                                ? 'Undo skip'
                                : 'Hoàn tác bỏ qua'
                              : lang === 'en'
                                ? 'Skip this exercise'
                                : 'Bỏ qua bài này'
                          }
                          className="inline-flex items-center gap-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 hover:text-white cursor-pointer"
                        >
                          {st === 'skipped' ? <Undo2 className="h-2.5 w-2.5" /> : <SkipForward className="h-2.5 w-2.5" />}
                          <span>{st === 'skipped' ? (lang === 'en' ? 'Undo' : 'Hoàn tác') : lang === 'en' ? 'Skip' : 'Bỏ qua'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {m.readings.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-white">
                {lang === 'en' ? 'Real-World Configs' : 'Đọc cấu hình thật'}
              </h2>
              <div className="space-y-2">
                {m.readings.map((r, rIdx) => {
                  const item = cat?.items.find((i) => i.n === r.catalogN || i.path === r.path);
                  const k = DEVOPS_KIND_LABEL[r.kind] ?? DEVOPS_KIND_LABEL.good;
                  const st = item ? catalogStatus(s, item.id) : 'todo';
                  const rNote = modOv?.readings?.[rIdx]?.noteEn ?? r.note;
                  return (
                    <button
                      key={r.path}
                      type="button"
                      disabled={!item}
                      onClick={() => item && go({ name: 'read', n: item.n })}
                      className="block min-h-[52px] w-full rounded-xl bg-slate-900/65 p-3 text-left transition-colors hover:bg-slate-900 disabled:cursor-default cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${k.cls}`}>
                          {lang === 'en' ? (KIND_LABEL_EN[r.kind] ?? k.label) : k.label}
                        </span>
                        <span className="break-all text-sm font-medium text-sky-300">{r.path}</span>
                        {st !== 'todo' && (
                          <Pill>{lang === 'en' ? STATUS_LABEL_EN[st] : CATALOG_STATUS_LABEL[st]}</Pill>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        <CourseInline text={rNote} accent={accent} />
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

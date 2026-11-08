import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquarePlus,
  BookOpen,
  Target,
  Sparkles,
  Code2,
  Layers,
  ShieldAlert,
  FlaskConical,
  PanelLeftOpen,
  ListTree,
} from 'lucide-react';
import { ALL_LESSONS, LESSON_BY_ID } from '@/data/curriculum';
import { LessonTopic } from '@/types/curriculum.types';
import { STAGE_MAP } from '@/constants/stages';
import { useNavigationStore } from '@/stores/useNavigationStore';
import {
  useUserDataStore,
  REQUIRED_LESSON_STUDY_SECONDS,
} from '@/stores/useUserDataStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';
import { CodeBlock } from '@/components/common/CodeBlock';
import { AnalogyCard } from './AnalogyCard';
import { VisualDiagramCard } from './VisualDiagramCard';
import { JsComparisonCard } from './JsComparisonCard';
import { GotchasSection } from './GotchasSection';
import { UseCasesAndTips } from './UseCasesAndTips';
import { ProofAndReferencesSection } from './ProofAndReferencesSection';
import { RelatedConceptsBar } from './RelatedConceptsBar';
import { LessonTocRail } from './LessonTocRail';
import { cn } from '@/utils/cn';

type LessonSectionFilter = 'all' | 'theory' | 'code' | 'gotchas' | 'proofs';

const FILTER_ITEMS: {
  id: LessonSectionFilter;
  label: string;
  tooltipDesc: string;
  activeColor: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'all',
    label: 'Tất cả',
    tooltipDesc: 'Xem toàn bộ bài học (Lý thuyết, Sơ đồ, Code, Bẫy, Minh chứng)',
    activeColor:
      'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs font-semibold',
    icon: <Layers className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    id: 'theory',
    label: 'Lý thuyết & Tư duy',
    tooltipDesc: 'Lý thuyết cốt lõi, mô hình tư duy & hình tượng hóa thực tế',
    activeColor:
      'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-xs font-semibold',
    icon: <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    id: 'code',
    label: 'Sơ đồ & Code',
    tooltipDesc: 'Sơ đồ luồng, ví dụ code giải thích từng dòng & đối chiếu JS/TS',
    activeColor:
      'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs font-semibold',
    icon: <Code2 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    id: 'gotchas',
    label: 'Bẫy & Thực tế',
    tooltipDesc: 'Bẫy kinh điển, lỗi phổ biến & mẹo chuẩn Pythonic',
    activeColor:
      'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-xs font-semibold',
    icon: <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    id: 'proofs',
    label: 'Minh chứng & Nguồn',
    tooltipDesc: 'Đo lường RAM, tốc độ thực thi, Bytecode & đặc tả PEP chính thức',
    activeColor:
      'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-xs font-semibold',
    icon: <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />,
  },
];

const SECTION_IDS = [
  'sec-theory',
  'sec-analogy',
  'sec-diagrams',
  'sec-code',
  'sec-js-bridge',
  'sec-gotchas',
  'sec-usecases',
  'sec-proofs',
  'sec-related',
];

export const LessonView: React.FC = () => {
  const {
    selectedLessonId,
    selectLesson,
    openNotesDrawer,
    setMobileSidebarOpen,
    setMobileTocOpen,
  } = useNavigationStore();
  const {
    completedLessonIds,
    lessonStudySeconds,
    toggleLessonComplete,
    addLessonStudyTime,
    bookmarks,
    toggleBookmark,
    notes,
  } = useUserDataStore();

  const [sectionFilter, setSectionFilter] = useState<LessonSectionFilter>('all');
  const [activeTocId, setActiveTocId] = useState<string>('sec-theory');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isClickScrollingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const updateActiveSectionOnScroll = useCallback(() => {
    if (isClickScrollingRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const visibleIds = SECTION_IDS.filter(
      (id) => document.getElementById(id) !== null
    );
    if (visibleIds.length === 0) return;

    // Check if user has scrolled near the bottom of the reading column
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    if (isAtBottom) {
      const lastSection = visibleIds[visibleIds.length - 1];
      setActiveTocId((prev) => {
        if (prev !== lastSection) {
          if (window.location.hash !== `#${lastSection}`) {
            window.history.replaceState(
              null,
              '',
              `${window.location.pathname}${window.location.search}#${lastSection}`
            );
          }
          return lastSection;
        }
        return prev;
      });
      return;
    }

    const containerTop = container.getBoundingClientRect().top;
    const threshold = 160;

    let currentSection = visibleIds[0];
    for (const id of visibleIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const relativeTop = rect.top - containerTop;

      if (relativeTop <= threshold) {
        currentSection = id;
      } else {
        break;
      }
    }

    setActiveTocId((prev) => {
      if (prev !== currentSection) {
        if (window.location.hash !== `#${currentSection}`) {
          window.history.replaceState(
            null,
            '',
            `${window.location.pathname}${window.location.search}#${currentSection}`
          );
        }
        return currentSection;
      }
      return prev;
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (isClickScrollingRef.current) return;
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      updateActiveSectionOnScroll();
    });
  }, [updateActiveSectionOnScroll]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // When lesson changes or on F5 reload, check URL hash and scroll to that section
  useEffect(() => {
    const rawHash = window.location.hash.replace('#', '');
    if (rawHash && SECTION_IDS.includes(rawHash)) {
      setSectionFilter('all');
      setActiveTocId(rawHash);
      const timer = setTimeout(() => {
        const el = document.getElementById(rawHash);
        if (el && scrollContainerRef.current) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setSectionFilter('all');
      setActiveTocId('sec-theory');
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedLessonId]);

  const lesson = LESSON_BY_ID[selectedLessonId] || ALL_LESSONS[0];
  const stage = STAGE_MAP[lesson.stageId];

  const studySeconds = lessonStudySeconds[lesson.id] || 0;
  const isCompleted =
    completedLessonIds.includes(lesson.id) ||
    studySeconds >= REQUIRED_LESSON_STUDY_SECONDS;
  const studyProgressPct = Math.min(
    100,
    Math.round((studySeconds / REQUIRED_LESSON_STUDY_SECONDS) * 100)
  );
  const formatMinutesSeconds = (totalSec: number) => {
    const clamped = Math.min(totalSec, REQUIRED_LESSON_STUDY_SECONDS);
    const m = Math.floor(clamped / 60);
    const s = clamped % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Active 10-minute study timer: records entry & increments every 1s while viewing the lesson
  useEffect(() => {
    // Immediately mark lesson as entered (>= 1s) when opened if not yet visited
    if ((useUserDataStore.getState().lessonStudySeconds[lesson.id] || 0) === 0) {
      void addLessonStudyTime(lesson.id, 1);
    }
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void addLessonStudyTime(lesson.id, 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [lesson.id, addLessonStudyTime]);

  const isBookmarked = bookmarks.some(
    (b) => b.targetType === 'lesson' && b.targetId === lesson.id
  );
  const lessonNoteCount = notes.filter((n) => n.targetId === lesson.id).length;

  const currentIdx = ALL_LESSONS.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? ALL_LESSONS[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < ALL_LESSONS.length - 1 ? ALL_LESSONS[currentIdx + 1] : null;

  const handleJumpToSection = (sectionId: string) => {
    if (sectionFilter !== 'all') {
      setSectionFilter('all');
    }
    setActiveTocId(sectionId);
    if (window.location.hash !== `#${sectionId}`) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#${sectionId}`
      );
    }
    isClickScrollingRef.current = true;
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setTimeout(() => {
        isClickScrollingRef.current = false;
      }, 650);
    }, 40);
  };

  const showTheory = sectionFilter === 'all' || sectionFilter === 'theory';
  const showCode = sectionFilter === 'all' || sectionFilter === 'code';
  const showGotchas = sectionFilter === 'all' || sectionFilter === 'gotchas';
  const showProofs = sectionFilter === 'all' || sectionFilter === 'proofs';

  return (
    <div className="flex-1 min-w-0 h-full flex overflow-hidden">
      {/* Center Reading Column - Only this scrolls */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-w-0 h-full overflow-y-auto"
      >
        {/* Mobile & Tablet Sticky Sub-Toolbar (< xl) */}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-1.5 border-b border-slate-800/90 bg-slate-950/90 px-2.5 sm:px-6 py-2 backdrop-blur-md xl:hidden">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex lg:hidden items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-300 active:scale-95 transition-all shrink-0"
            >
              <PanelLeftOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Danh mục ({currentIdx + 1}/{ALL_LESSONS.length})</span>
            </button>

            <button
              onClick={() => setMobileTocOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 active:scale-95 transition-all shrink-0"
            >
              <ListTree className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span className="sm:hidden">Mục lục</span>
              <span className="hidden sm:inline">Mục lục & Từ khóa</span>
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => prevLesson && selectLesson(prevLesson.id)}
              disabled={!prevLesson}
              aria-label="Bài trước"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => nextLesson && selectLesson(nextLesson.id)}
              disabled={!nextLesson}
              aria-label="Bài tiếp theo"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
          {/* Hero / Lesson Header Card */}
          <header
            className={cn(
              'rounded-2xl border p-4 sm:p-6 space-y-4 transition-colors',
              isCompleted
                ? 'border-emerald-500/45 bg-emerald-500/[0.07]'
                : 'border-slate-800/90 bg-slate-900/50'
            )}
          >
          {/* Top Meta & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="rounded-md bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-semibold text-sky-300">
                GĐ {stage.number} • {stage.durationWeeks}
              </span>
              <LevelBadge level={lesson.level} showVi size="sm" />
              <span className="inline-flex items-center gap-1 font-mono text-[11px] sm:text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {lesson.estimatedMinutes}p
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/45 bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-emerald-300">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                  Đã học (≥ 10 phút)
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  toggleBookmark({
                    targetType: 'lesson',
                    targetId: lesson.id,
                    targetTitle: lesson.title,
                    level: lesson.level,
                  })
                }
                aria-pressed={isBookmarked}
                title={isBookmarked ? 'Bỏ lưu bài học' : 'Lưu bài học'}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                  isBookmarked
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                )}
              >
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {isBookmarked ? 'Đã lưu' : 'Lưu'}
                </span>
              </button>

              <button
                onClick={() => openNotesDrawer('lesson', lesson.id, lesson.title)}
                title="Mở ghi chú cá nhân cho bài học này"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <MessageSquarePlus
                  className="h-3.5 w-3.5 text-amber-400"
                  aria-hidden="true"
                />
                <span className="hidden xs:inline">Ghi chú</span>
                <span className="font-mono text-[11px]">({lessonNoteCount})</span>
              </button>

              <button
                onClick={() => toggleLessonComplete(lesson.id)}
                aria-pressed={isCompleted}
                title={
                  isCompleted
                    ? 'Bài học đã đạt trạng thái Đã học (Bấm nếu muốn học lại từ đầu)'
                    : 'Đánh dấu Đã học ngay hoặc học đủ 10 phút sẽ tự động hoàn thành'
                }
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition-all',
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-xs'
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isCompleted ? 'Đã học ✓' : 'Đánh dấu Đã học'}</span>
              </button>
            </div>
          </div>

          {/* 10-Minute Auto-Completion Study Progress Banner */}
          <div
            className={cn(
              'rounded-xl border px-3.5 py-2.5 space-y-1.5 transition-colors',
              isCompleted
                ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-200'
                : 'border-amber-500/30 bg-amber-500/[0.07] text-slate-200'
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5 font-medium">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="text-emerald-300 font-semibold">
                      Đã qua bài học này!
                    </span>
                    <span className="text-slate-300">
                      (Đã hoàn thành tối thiểu 10 phút đọc lý thuyết & ví dụ)
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-amber-300 font-semibold">
                      Tiến độ đọc bài (Tự động đánh dấu Đã học sau 10 phút):
                    </span>
                  </>
                )}
              </div>
              <span
                className={cn(
                  'font-mono text-[11px] font-bold',
                  isCompleted ? 'text-emerald-300' : 'text-amber-300'
                )}
              >
                {formatMinutesSeconds(studySeconds)} / 10:00 phút ({studyProgressPct}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isCompleted ? 'bg-emerald-400' : 'bg-amber-400'
                )}
                style={{ width: `${studyProgressPct}%` }}
              />
            </div>
          </div>

          {/* Title & Lead Summary */}
          <div className="space-y-2">
            <h1 className="font-mono text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {lesson.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <RichTextWithTerms text={lesson.shortDescription} />
            </p>
          </div>

          {/* Stage Goal Callout */}
          <div className="flex items-start gap-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 px-3.5 py-2.5 text-xs text-slate-300">
            <Target
              className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <strong className="text-emerald-300 font-semibold">
                Mục tiêu Giai đoạn {stage.number}:{' '}
              </strong>
              {stage.goal}
            </div>
          </div>

          {/* Section Filter Pills & Term Hint */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap">
              {FILTER_ITEMS.map((f) => {
                const isSelected = sectionFilter === f.id;
                let count: number | undefined;
                if (f.id === 'code') count = lesson.codeExamples.length;
                if (f.id === 'gotchas') count = lesson.commonIssues.length;
                if (f.id === 'proofs') {
                  count =
                    (lesson.benchmarksAndProofs?.length || 0) +
                    (lesson.externalReferences?.length || 0);
                }

                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSectionFilter(f.id);
                      scrollContainerRef.current?.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                      });
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-all',
                      isSelected
                        ? f.activeColor
                        : 'bg-slate-950/60 text-slate-400 border border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
                    )}
                  >
                    {f.icon}
                    <span>{f.label}</span>
                    {count !== undefined && count > 0 && (
                      <span className="font-mono text-[10px] opacity-75">
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-300/90">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span>Chạm vào từ gạch chân để xem giải thích</span>
            </span>
          </div>
        </header>

        {/* 1. Core Theory & Analogy */}
        {showTheory && (
          <>
            <section
              id="sec-theory"
              className="scroll-mt-24 rounded-2xl border border-slate-800/90 bg-slate-900/40 p-4 sm:p-6 space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <BookOpen className="h-5 w-5 text-sky-400" aria-hidden="true" />
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Lý thuyết Cốt lõi & Cơ chế Hoạt động
                </h2>
              </div>

              <div className="space-y-4 text-sm sm:text-[15px] text-slate-200 leading-7">
                {lesson.theoryParagraphs.map((para, idx) => (
                  <p key={idx}>
                    <RichTextWithTerms text={para} />
                  </p>
                ))}
              </div>
            </section>

            {/* 2. Visual Analogy ("Hình tượng hóa") */}
            <AnalogyCard analogy={lesson.analogy} />
          </>
        )}

        {/* 3. Flowcharts, Code Examples & JS/TS Comparison */}
        {showCode && (
          <>
            <VisualDiagramCard diagrams={lesson.diagrams} />

            <section id="sec-code" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Ví dụ Minh họa & Giải thích Từng dòng Code
                </h2>
              </div>
              <div className="space-y-5">
                {lesson.codeExamples.map((ex) => (
                  <CodeBlock
                    key={ex.id}
                    title={ex.title}
                    description={ex.description}
                    code={ex.code}
                    output={ex.output}
                    annotations={ex.annotations}
                  />
                ))}
              </div>
            </section>

            <JsComparisonCard comparisons={lesson.jsComparison} />
          </>
        )}

        {/* 4. Common Issues, Gotchas & Production Use Cases */}
        {showGotchas && (
          <>
            <GotchasSection issues={lesson.commonIssues} />

            <UseCasesAndTips
              useCases={lesson.useCases}
              tips={lesson.tipsAndBestPractices}
            />
          </>
        )}

        {/* 5. Technical Proofs, Official References & Knowledge Graph */}
        {showProofs && (
          <>
            <ProofAndReferencesSection
              proofs={lesson.benchmarksAndProofs}
              references={lesson.externalReferences}
            />

            <RelatedConceptsBar
              relatedTermIds={lesson.relatedTermIds}
              relatedLessonIds={lesson.relatedLessonIds}
              relatedExerciseIds={lesson.relatedExerciseIds}
            />
          </>
        )}

        {/* Footer Prev / Next Lesson Navigation */}
        <footer className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800/80 pt-6">
          {prevLesson ? (
            <button
              onClick={() => selectLesson(prevLesson.id)}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left hover:border-slate-700 hover:bg-slate-800/80 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase text-slate-400">
                  Bài trước
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  {prevLesson.title}
                </div>
              </div>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {nextLesson && (
            <button
              onClick={() => selectLesson(nextLesson.id)}
              className="flex items-center justify-end gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-right hover:bg-emerald-500/20 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase text-emerald-400">
                  Bài tiếp theo
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  {nextLesson.title}
                </div>
              </div>
              <ChevronRight
                className="h-4 w-4 text-emerald-400 shrink-0"
                aria-hidden="true"
              />
            </button>
          )}
        </footer>
      </article>
      </div>

      {/* Right Sticky Table of Contents & Quick Action Rail (plus Mobile Bottom Sheet) */}
      <LessonTocRail
        lesson={lesson}
        activeSection={activeTocId}
        onSelectSection={(sec) => {
          handleJumpToSection(sec);
        }}
      />
    </div>
  );
};

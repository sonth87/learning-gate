import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Code2,
  ShieldAlert,
  Wrench,
  Stethoscope,
  Copy,
  Check,
  Layers,
  Target,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { KUBE_LESSONS, KUBE_STAGES } from '../data/curriculumData';
import { useKubeStore } from '../store/useKubeStore';
import { AnimatedFlowEngine } from './AnimatedFlowEngine';
import { cn } from '@/utils/cn';

export const CurriculumView: React.FC = () => {
  const {
    selectedLessonId,
    selectLesson,
    completedLessonIds,
    toggleLessonComplete,
    bookmarkedLessonIds,
    toggleBookmarkLesson,
    openFlowInStudio,
    openIncidentInWarRoom,
    openPracticeLab,
  } = useKubeStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentIdx = KUBE_LESSONS.findIndex((l) => l.id === selectedLessonId);
  const lesson = KUBE_LESSONS[currentIdx] || KUBE_LESSONS[0];
  const stage =
    KUBE_STAGES.find((s) => s.id === lesson.stageId) || KUBE_STAGES[0];

  const prevLesson = currentIdx > 0 ? KUBE_LESSONS[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < KUBE_LESSONS.length - 1 ? KUBE_LESSONS[currentIdx + 1] : null;

  const isCompleted = completedLessonIds.includes(lesson.id);
  const isBookmarked = bookmarkedLessonIds.includes(lesson.id);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Desktop Sidebar (lg+) */}
      <aside className="hidden lg:flex w-80 shrink-0 flex-col border-r border-slate-800/90 bg-slate-950/80 overflow-y-auto">
        <div className="p-4 border-b border-slate-800/80 space-y-1">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400">
            LỘ TRÌNH 4 GIAI ĐOẠN (CƠ BẢN → MASTER)
          </div>
          <div className="text-xs font-bold text-white">
            Giáo Trình Toàn Diện Docker & K8s
          </div>
          <div className="text-[11px] text-slate-400">
            Đã hoàn thành: {completedLessonIds.length}/{KUBE_LESSONS.length} bài học
          </div>
        </div>

        <div className="p-3 space-y-5">
          {KUBE_STAGES.map((st) => {
            const stageLessons = KUBE_LESSONS.filter(
              (l) => l.stageId === st.id
            );
            return (
              <div key={st.id} className="space-y-1.5">
                <div className="px-2 py-1">
                  <div className="font-mono text-[10px] font-bold uppercase text-amber-400">
                    Giai đoạn {st.number}
                  </div>
                  <div className="text-xs font-extrabold text-white leading-snug">
                    {st.title.replace(/^Giai đoạn \d+:\s*/, '')}
                  </div>
                </div>

                <div className="space-y-1">
                  {stageLessons.map((item) => {
                    const active = item.id === lesson.id;
                    const done = completedLessonIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => selectLesson(item.id)}
                        className={cn(
                          'w-full flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition-all',
                          active
                            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40 font-semibold shadow-xs'
                            : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[10px]',
                            done
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          )}
                        >
                          {done ? '✓' : item.order}
                        </span>
                        <span className="line-clamp-2 leading-snug">
                          {item.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Mobile Drawer Sidebar (< lg) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-80 max-w-[85vw] bg-slate-950 border-r border-slate-800 h-full overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-mono text-xs font-bold text-white">
                Danh mục Bài học ({KUBE_LESSONS.length})
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {KUBE_STAGES.map((st) => (
              <div key={st.id} className="space-y-1.5">
                <div className="font-mono text-[10px] font-bold uppercase text-amber-400">
                  {st.title}
                </div>
                {KUBE_LESSONS.filter((l) => l.stageId === st.id).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      selectLesson(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      'w-full rounded-xl px-3 py-2 text-left text-xs',
                      item.id === lesson.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                        : 'text-slate-300 hover:bg-slate-900'
                    )}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Lesson Reading Column */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto">
        {/* Mobile Sticky Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/90 px-3 py-2 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-300"
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
            <span>
              Mục lục ({currentIdx + 1}/{KUBE_LESSONS.length})
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => prevLesson && selectLesson(prevLesson.id)}
              disabled={!prevLesson}
              className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => nextLesson && selectLesson(nextLesson.id)}
              disabled={!nextLesson}
              className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <article className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
          {/* Lesson Hero Card */}
          <header className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-sky-500/15 border border-sky-500/35 px-2.5 py-0.5 font-mono text-[11px] font-bold text-sky-300">
                  Giai đoạn {stage.number} • Bài {lesson.order}/{KUBE_LESSONS.length}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  {lesson.estimatedMinutes} phút
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBookmarkLesson(lesson.id)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                    isBookmarked
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  )}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>{isBookmarked ? 'Đã lưu' : 'Lưu bài'}</span>
                </button>

                <button
                  onClick={() => toggleLessonComplete(lesson.id)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all',
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{isCompleted ? 'Đã hoàn thành ✓' : 'Đánh dấu Đã học'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="font-mono text-lg sm:text-2xl font-extrabold text-white leading-snug">
                {lesson.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {lesson.shortDescription}
              </p>
            </div>

            {/* Stage Milestone Banner */}
            <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-slate-300">
              <Target className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300">
                  Dấu mốc Hoàn thành Giai đoạn {stage.number}:{' '}
                </strong>
                {stage.milestone}
              </div>
            </div>

            {/* Quick Action Jump Buttons */}
            {(lesson.relatedIncidentId || lesson.relatedPracticeId) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                {lesson.relatedPracticeId && (
                  <button
                    onClick={() => openPracticeLab(lesson.relatedPracticeId!)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Thực hành Viết Cấu hình Bài này</span>
                  </button>
                )}
                {lesson.relatedIncidentId && (
                  <button
                    onClick={() =>
                      openIncidentInWarRoom(lesson.relatedIncidentId!)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/25"
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                    <span>Giải cứu Sự cố Thực tế Liên quan</span>
                  </button>
                )}
              </div>
            )}
          </header>

          {/* 1. Interactive Animated Flow Diagram Embedded Right in Lesson! */}
          <AnimatedFlowEngine
            flowId={lesson.animatedFlowId}
            compact
            onOpenFullStudio={(fid) => openFlowInStudio(fid)}
          />

          {/* 2. Core Theory Sections */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <BookOpen className="h-5 w-5 text-sky-400" />
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Bản Chất Kỹ Thuật & Cơ Chế Hoạt Động
              </h2>
            </div>

            <div className="space-y-6">
              {lesson.theorySections.map((sec, idx) => (
                <div key={idx} className="space-y-3">
                  <h3 className="text-sm sm:text-base font-bold text-sky-300">
                    {sec.heading}
                  </h3>
                  {sec.paragraphs.map((p, pIdx) => (
                    <p
                      key={pIdx}
                      className="text-xs sm:text-[15px] text-slate-200 leading-7"
                    >
                      {p}
                    </p>
                  ))}
                  {sec.bulletPoints && (
                    <ul className="space-y-2.5 pl-1">
                      {sec.bulletPoints.map((bp, bIdx) => (
                        <li
                          key={bIdx}
                          className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed"
                        >
                          <strong className="text-emerald-300 font-bold">
                            • {bp.boldPrefix}{' '}
                          </strong>
                          <span>{bp.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 3. Vivid Analogy Mapping Table ("Phương pháp Liên tưởng hóa") */}
          <section className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.06] p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-500/25 pb-3">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {lesson.analogyCards.title}
                </h2>
                <p className="text-xs text-slate-300">
                  {lesson.analogyCards.scenario}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lesson.analogyCards.mappings.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950/85 p-3.5 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-mono text-xs font-extrabold text-sky-300">
                      {m.technicalTerm}
                    </span>
                    <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                      {m.analogyName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {m.explanation}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-amber-500/40 bg-slate-950/90 p-3.5 text-xs sm:text-sm text-amber-200 leading-relaxed">
              💡 {lesson.analogyCards.summaryCallout}
            </div>
          </section>

          {/* 4. Annotated Production Code Examples */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Cấu Hình Mẫu Chuẩn Doanh Nghiệp & Giải Thích Từng Dòng
              </h2>
            </div>

            {lesson.codeExamples.map((ex) => (
              <div
                key={ex.id}
                className="ide-dark-surface rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
                  <div>
                    <div className="font-mono text-xs sm:text-sm font-extrabold text-emerald-300">
                      FILE: {ex.filename}
                    </div>
                    <div className="text-xs text-slate-400">{ex.purpose}</div>
                  </div>
                  <button
                    onClick={() => handleCopyCode(ex.id, ex.code)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 font-mono text-xs text-slate-200 hover:bg-slate-800"
                  >
                    {copiedId === ex.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="overflow-x-auto p-4 font-mono text-xs text-slate-100 leading-relaxed">
                  {ex.code}
                </pre>

                {/* Line-by-line Annotations */}
                <div className="border-t border-slate-800 bg-slate-900/70 p-4 space-y-2">
                  <div className="font-mono text-[11px] font-bold uppercase text-sky-400">
                    Chú thích Từ khóa Quan trọng:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ex.annotations.map((ann, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-800 bg-slate-950/90 p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                            Dòng {ann.line}
                          </span>
                          <code className="font-mono font-bold text-amber-300">
                            {ann.keyword}
                          </code>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {ann.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* 5. Common Gotchas & Production Pitfalls */}
          {lesson.gotchas.length > 0 && (
            <section className="rounded-2xl border border-rose-500/35 bg-rose-500/[0.06] p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Bẫy Kinh Điển & Sai Lầm Cần Tránh Trên Thực Tế
                </h2>
              </div>

              {lesson.gotchas.map((g, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-3 text-xs sm:text-sm"
                >
                  <div className="font-bold text-rose-300">{g.title}</div>
                  <p className="text-slate-300">
                    <strong className="text-amber-300">Triệu chứng: </strong>
                    {g.symptom}
                  </p>
                  <p className="text-slate-300">
                    <strong className="text-sky-300">Nguyên nhân gốc rễ: </strong>
                    {g.rootCause}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 font-mono text-xs">
                    <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-3">
                      <div className="text-[10px] uppercase font-bold text-rose-400 mb-1">
                        ✗ Cách viết sai:
                      </div>
                      <pre className="whitespace-pre-wrap text-rose-200">
                        {g.wrongApproach}
                      </pre>
                    </div>
                    <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3">
                      <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">
                        ✓ Cách viết chuẩn:
                      </div>
                      <pre className="whitespace-pre-wrap text-emerald-200">
                        {g.rightApproach}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Prev / Next Navigation Footer */}
          <footer className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800 pt-5">
            {prevLesson ? (
              <button
                onClick={() => selectLesson(prevLesson.id)}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase text-slate-400">
                    Bài trước
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {prevLesson.title}
                  </div>
                </div>
              </button>
            ) : (
              <div />
            )}

            {nextLesson && (
              <button
                onClick={() => selectLesson(nextLesson.id)}
                className="flex items-center justify-end gap-3 rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-3 text-right hover:bg-sky-500/25 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase text-sky-300">
                    Bài tiếp theo
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {nextLesson.title}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-sky-300 shrink-0" />
              </button>
            )}
          </footer>
        </article>
      </div>
    </div>
  );
};

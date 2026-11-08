import React from 'react';
import {
  ListTree,
  BookOpen,
  Lightbulb,
  Workflow,
  Code2,
  ArrowRightLeft,
  ShieldAlert,
  Briefcase,
  FlaskConical,
  Network,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import { LessonTopic } from '@/types/curriculum.types';
import { ALL_EXERCISES } from '@/data/practice/exercisesData';
import { GLOSSARY_BY_ID } from '@/data/glossary';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { cn } from '@/utils/cn';

interface LessonTocRailProps {
  lesson: LessonTopic;
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
}

export const LessonTocRail: React.FC<LessonTocRailProps> = ({
  lesson,
  activeSection,
  onSelectSection,
}) => {
  const {
    selectExercise,
    showTermPopover,
    hideTermPopover,
    isMobileTocOpen,
    setMobileTocOpen,
  } = useNavigationStore();

  const tocItems = [
    {
      id: 'sec-theory',
      label: 'Lý thuyết Cốt lõi',
      icon: <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />,
      show: true,
    },
    {
      id: 'sec-analogy',
      label: 'Hình tượng hóa (Mental Model)',
      icon: <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />,
      show: Boolean(lesson.analogy),
    },
    {
      id: 'sec-diagrams',
      label: 'Sơ đồ Luồng & Kiến trúc',
      icon: <Workflow className="h-3.5 w-3.5" aria-hidden="true" />,
      show: Boolean(lesson.diagrams && lesson.diagrams.length > 0),
    },
    {
      id: 'sec-code',
      label: 'Ví dụ Code & Giải thích dòng',
      icon: <Code2 className="h-3.5 w-3.5" aria-hidden="true" />,
      show: lesson.codeExamples.length > 0,
    },
    {
      id: 'sec-js-bridge',
      label: 'Đối chiếu JS / TypeScript',
      icon: <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />,
      show: Boolean(lesson.jsComparison && lesson.jsComparison.length > 0),
    },
    {
      id: 'sec-gotchas',
      label: 'Bẫy & Lỗi phổ biến (Gotchas)',
      icon: <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />,
      show: lesson.commonIssues.length > 0,
    },
    {
      id: 'sec-usecases',
      label: 'Use Cases & Pythonic Tips',
      icon: <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />,
      show: lesson.useCases.length > 0 || lesson.tipsAndBestPractices.length > 0,
    },
    {
      id: 'sec-proofs',
      label: 'Minh chứng & Tài liệu PEP',
      icon: <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />,
      show: Boolean(
        (lesson.benchmarksAndProofs && lesson.benchmarksAndProofs.length > 0) ||
          (lesson.externalReferences && lesson.externalReferences.length > 0)
      ),
    },
    {
      id: 'sec-related',
      label: 'Bản đồ Liên kết Kiến thức',
      icon: <Network className="h-3.5 w-3.5" aria-hidden="true" />,
      show: true,
    },
  ].filter((item) => item.show);

  const linkedExercises = lesson.relatedExerciseIds
    .map((id) => ALL_EXERCISES.find((e) => e.id === id))
    .filter(Boolean);

  const handleJump = (id: string) => {
    onSelectSection(id);
    setMobileTocOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  const renderTocBody = () => (
    <div className="space-y-4">
      {/* On This Page TOC */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <ListTree className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">Trong bài học này</span>
        </div>

        <nav className="space-y-1 border-l border-slate-800 pl-2">
          {tocItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleJump(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-all duration-150',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                )}
              >
                <span
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-emerald-400' : 'text-slate-500'
                  )}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Linked Terms */}
      {lesson.relatedTermIds.length > 0 && (
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/50 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Từ khóa trọng tâm</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Chạm để mở thẻ giải thích nhanh:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lesson.relatedTermIds.map((tId) => {
              const term = GLOSSARY_BY_ID[tId];
              if (!term) return null;
              return (
                <button
                  key={tId}
                  onMouseEnter={(e) => {
                    if (window.innerWidth >= 640) {
                      const r = e.currentTarget.getBoundingClientRect();
                      showTermPopover(
                        term.id,
                        { top: r.top, left: r.left, bottom: r.bottom, width: r.width },
                        false
                      );
                    }
                  }}
                  onMouseLeave={() => hideTermPopover(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileTocOpen(false);
                    const r = e.currentTarget.getBoundingClientRect();
                    showTermPopover(
                      term.id,
                      { top: r.top, left: r.left, bottom: r.bottom, width: r.width },
                      true
                    );
                  }}
                  className="rounded-md border border-slate-700/80 bg-slate-950 px-2.5 py-1 font-mono text-[11px] font-medium text-amber-300 hover:border-amber-400/60 transition-colors"
                >
                  {term.term}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Practice CTA */}
      {linkedExercises.length > 0 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Thực hành ngay</span>
          </div>
          <div className="space-y-1.5">
            {linkedExercises.map((ex) =>
              ex ? (
                <button
                  key={ex.id}
                  onClick={() => selectExercise(ex.id)}
                  className="w-full flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-slate-950/90 px-3 py-2 text-left text-xs text-slate-200 hover:bg-emerald-500/20 hover:text-white transition-colors"
                >
                  <span className="font-medium line-clamp-1">{ex.title}</span>
                  <Play
                    className="h-3 w-3 shrink-0 text-emerald-400 fill-current"
                    aria-hidden="true"
                  />
                </button>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Wide Desktop Right TOC Rail (xl+) */}
      <aside
        aria-label="Mục lục bài học hiện tại"
        className="hidden xl:flex xl:w-72 shrink-0 flex-col gap-4 border-l border-slate-800/80 bg-slate-950/40 p-3.5 xl:p-4 h-full overflow-y-auto"
      >
        {renderTocBody()}
      </aside>

      {/* Mobile & Tablet Bottom Sheet / Right Drawer (< xl) */}
      {isMobileTocOpen && (
        <div
          onClick={() => setMobileTocOpen(false)}
          className="absolute inset-0 z-50 flex items-end sm:items-stretch sm:justify-end xl:hidden bg-black/75 backdrop-blur-xs"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            aria-label="Mục lục bài học di động"
            className="w-full max-h-[82vh] sm:max-h-full sm:h-full sm:w-80 rounded-t-2xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-slate-800 bg-slate-950 flex flex-col overflow-hidden shadow-2xl pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-2">
                <ListTree className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span className="font-mono text-xs font-bold text-white">
                  Mục lục Bài học & Từ khóa
                </span>
              </div>
              <button
                onClick={() => setMobileTocOpen(false)}
                aria-label="Đóng mục lục"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{renderTocBody()}</div>
          </aside>
        </div>
      )}
    </>
  );
};

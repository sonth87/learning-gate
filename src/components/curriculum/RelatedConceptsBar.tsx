import React from 'react';
import { Network, Code2, BookOpen, Sparkles } from 'lucide-react';
import { GLOSSARY_BY_ID } from '@/data/glossary';
import { LESSON_BY_ID } from '@/data/curriculum';
import { ALL_EXERCISES } from '@/data/practice/exercisesData';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { LevelBadge } from '@/components/common/LevelBadge';

interface RelatedConceptsBarProps {
  relatedTermIds: string[];
  relatedLessonIds: string[];
  relatedExerciseIds: string[];
}

export const RelatedConceptsBar: React.FC<RelatedConceptsBarProps> = ({
  relatedTermIds,
  relatedLessonIds,
  relatedExerciseIds,
}) => {
  const { selectLesson, selectExercise, showTermPopover, hideTermPopover } =
    useNavigationStore();

  return (
    <section
      id="sec-related"
      className="scroll-mt-20 rounded-2xl border border-indigo-500/30 bg-indigo-950/15 p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Network className="h-5 w-5 text-indigo-400" />
        <h3 className="text-sm font-bold text-white">
          Bản đồ Liên kết Kiến thức (Hover / Click để Xem Nhanh hoặc Chuyển tới)
        </h3>
      </div>

      {/* Related Glossary Terms */}
      {relatedTermIds.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Từ khóa, Hàm & Thuật ngữ trong bài (Di chuột hoặc Bấm để mở thẻ Preview):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedTermIds.map((id) => {
              const term = GLOSSARY_BY_ID[id];
              if (!term) return null;
              return (
                <button
                  key={id}
                  onMouseEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    showTermPopover(
                      term.id,
                      { top: r.top, left: r.left, bottom: r.bottom, width: r.width },
                      false
                    );
                  }}
                  onMouseLeave={() => hideTermPopover(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    const r = e.currentTarget.getBoundingClientRect();
                    showTermPopover(
                      term.id,
                      { top: r.top, left: r.left, bottom: r.bottom, width: r.width },
                      true
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-slate-900 px-3 py-1.5 font-mono text-xs font-semibold text-indigo-200 hover:border-amber-400/60 hover:text-amber-300 transition-colors"
                >
                  <span>{term.term}</span>
                  <LevelBadge level={term.level} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Exercises & Lessons */}
      <div className="grid gap-3 md:grid-cols-2 pt-1">
        {relatedExerciseIds.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <Code2 className="h-3.5 w-3.5" />
              <span>Bài tập Thực hành gắn liền:</span>
            </div>
            <div className="space-y-1.5">
              {relatedExerciseIds.map((exId) => {
                const ex = ALL_EXERCISES.find((e) => e.id === exId);
                if (!ex) return null;
                return (
                  <button
                    key={ex.id}
                    onClick={() => selectExercise(ex.id)}
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-slate-950/80 px-3.5 py-2 text-left text-xs text-emerald-200 hover:bg-emerald-500/15 transition-colors"
                  >
                    <span className="font-semibold truncate">{ex.title}</span>
                    <span className="shrink-0 text-[11px] font-bold text-emerald-400">
                      Làm bài →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {relatedLessonIds.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Bài học Liên quan tiếp theo:</span>
            </div>
            <div className="space-y-1.5">
              {relatedLessonIds.map((lId) => {
                const l = LESSON_BY_ID[lId];
                if (!l) return null;
                return (
                  <button
                    key={l.id}
                    onClick={() => selectLesson(l.id)}
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-left text-xs text-slate-200 hover:border-sky-500/40 hover:text-sky-300 transition-colors"
                  >
                    <span className="truncate">{l.title}</span>
                    <LevelBadge level={l.level} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

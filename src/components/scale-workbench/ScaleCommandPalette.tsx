import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Clock, Layers, Search, Sparkles, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { ALL_GLOSSARY_TERMS } from '@/data/glossary';
import { WORKBENCH_I18N } from './i18n';
import { pickText, type ScaleModuleLesson } from './types';
import { cn } from '@/utils/cn';

export interface PaletteGlossaryItem {
  id: string;
  term: string;
  shortSummary: string;
}

export interface ScaleCommandPaletteProps {
  courseId: string;
  lessons: ScaleModuleLesson[];
  glossaryItems?: PaletteGlossaryItem[];
  onSelectLessonStep: (moduleId: string, stepIndex: number) => void;
  onSelectGlossaryTerm?: (termId: string) => void;
}

export const ScaleCommandPalette: React.FC<ScaleCommandPaletteProps> = ({
  courseId,
  lessons,
  glossaryItems,
  onSelectLessonStep,
  onSelectGlossaryTerm,
}) => {
  const { rawOpen, activeCourseId, setOpen, lang, recentSteps } = useWorkbenchStore(
    useShallow((s) => ({
      rawOpen: s.isSearchPaletteOpen,
      activeCourseId: s.searchPaletteCourseId,
      setOpen: s.setSearchPaletteOpen,
      lang: s.language,
      recentSteps: s.recentSteps,
    }))
  );

  const isOpen = rawOpen && (activeCourseId ?? 'pymastery') === courseId;
  const conceptsSource: PaletteGlossaryItem[] = glossaryItems ?? ALL_GLOSSARY_TERMS;

  const t = WORKBENCH_I18N[lang];
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const totalStepsCount = useMemo(
    () => lessons.reduce((acc, l) => acc + l.steps.length, 0),
    [lessons]
  );

  const courseRecent = useMemo(
    () => recentSteps.filter((r) => r.courseId === courseId).slice(0, 4),
    [recentSteps, courseId]
  );

  const q = query.trim().toLowerCase();

  const matchedLessons = useMemo(() => {
    if (!q) return lessons.slice(0, 6);
    return lessons
      .filter(
        (l) =>
          l.moduleId.toLowerCase().includes(q) ||
          l.title.vi.toLowerCase().includes(q) ||
          l.title.en.toLowerCase().includes(q) ||
          l.subtitle.vi.toLowerCase().includes(q) ||
          l.subtitle.en.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [lessons, q]);

  const matchedSteps = useMemo(() => {
    if (!q) return [];
    const hits: Array<{ lesson: ScaleModuleLesson; stepIdx: number; label: string }> = [];
    for (const l of lessons) {
      for (let idx = 0; idx < l.steps.length; idx++) {
        const st = l.steps[idx];
        if (
          st.title.vi.toLowerCase().includes(q) ||
          st.title.en.toLowerCase().includes(q) ||
          st.shortLabel.vi.toLowerCase().includes(q) ||
          st.shortLabel.en.toLowerCase().includes(q)
        ) {
          hits.push({
            lesson: l,
            stepIdx: idx,
            label: pickText(st.title, lang),
          });
          if (hits.length >= 8) return hits;
        }
      }
    }
    return hits;
  }, [lessons, q, lang]);

  const matchedTerms = useMemo(() => {
    if (!q) return conceptsSource.slice(0, 4);
    return conceptsSource
      .filter(
        (term) =>
          term.term.toLowerCase().includes(q) ||
          term.shortSummary.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [q, conceptsSource]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.searchTitle}
      onClick={() => setOpen(false)}
      className="absolute inset-0 z-[120] flex items-start justify-center bg-black/45 p-3 pt-4 sm:pt-14 backdrop-blur-[2px] overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dts-card-tactile flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[var(--dts-panel)] text-[var(--dts-ink)]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 border-b-[1.5px] border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--dts-ink-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent font-mono text-sm text-[var(--dts-ink)] placeholder:text-[var(--dts-ink-muted)] outline-none"
          />
          <span className="hidden sm:inline-block font-mono text-[11px] text-[var(--dts-ink-muted)]">
            {t.searchStats(lessons.length, totalStepsCount, conceptsSource.length)}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-[var(--dts-border-soft)] p-1 text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-4">
          {/* RECENT */}
          {!q && courseRecent.length > 0 && (
            <section>
              <div className="mb-1.5 flex items-center gap-1.5 px-2 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                <Clock className="h-3 w-3" />
                <span>{t.recentSection}</span>
              </div>
              <div className="space-y-1">
                {courseRecent.map((r) => (
                  <button
                    key={`${r.moduleId}-${r.stepIndex}`}
                    type="button"
                    onClick={() => {
                      onSelectLessonStep(r.moduleId, r.stepIndex);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition-colors hover:border-[var(--dts-border)] hover:bg-[var(--dts-green-soft)]"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-[var(--dts-ink)] truncate">
                        {r.moduleId} · {lang === 'en' ? r.moduleTitleEn : r.moduleTitleVi}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--dts-ink-muted)] truncate">
                        Step {r.stepIndex + 1}: {lang === 'en' ? r.stepTitleEn : r.stepTitleVi}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--dts-ink-muted)]" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* LESSONS */}
          {matchedLessons.length > 0 && (
            <section>
              <div className="mb-1.5 flex items-center gap-1.5 px-2 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                <BookOpen className="h-3 w-3" />
                <span>{t.lessonsSection}</span>
              </div>
              <div className="space-y-1">
                {matchedLessons.map((l) => (
                  <button
                    key={l.moduleId}
                    type="button"
                    onClick={() => {
                      onSelectLessonStep(l.moduleId, 0);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition-colors hover:border-[var(--dts-border)] hover:bg-[var(--dts-panel-elevated)]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-[var(--dts-border)] bg-[var(--dts-amber-bg)] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[var(--dts-amber-ink)]">
                          {l.moduleId}
                        </span>
                        <span className="font-mono text-xs font-bold text-[var(--dts-ink)] truncate">
                          {pickText(l.title, lang)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-[var(--dts-ink-soft)] truncate">
                        {pickText(l.subtitle, lang)}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[10.5px] text-[var(--dts-ink-muted)]">
                      {t.stepsCount(l.steps.length)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* MODEL STEPS */}
          {matchedSteps.length > 0 && (
            <section>
              <div className="mb-1.5 flex items-center gap-1.5 px-2 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                <Layers className="h-3 w-3" />
                <span>{t.stepsSection}</span>
              </div>
              <div className="space-y-1">
                {matchedSteps.map((hit) => (
                  <button
                    key={`${hit.lesson.moduleId}-${hit.stepIdx}`}
                    type="button"
                    onClick={() => {
                      onSelectLessonStep(hit.lesson.moduleId, hit.stepIdx);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition-colors hover:border-[var(--dts-border)] hover:bg-[var(--dts-blue-soft)]"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-[var(--dts-ink)] truncate">
                        {hit.label}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--dts-ink-muted)] truncate">
                        {hit.lesson.moduleId} · {pickText(hit.lesson.title, lang)}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--dts-border)] bg-[var(--dts-purple-bg)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--dts-purple-ink)]">
                      #{hit.stepIdx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* GLOSSARY CONCEPTS */}
          {matchedTerms.length > 0 && onSelectGlossaryTerm && (
            <section>
              <div className="mb-1.5 flex items-center gap-1.5 px-2 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                <Sparkles className="h-3 w-3" />
                <span>{t.conceptsSection}</span>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {matchedTerms.map((term) => (
                  <button
                    key={term.id}
                    type="button"
                    onClick={() => {
                      onSelectGlossaryTerm(term.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'rounded-xl border border-[var(--dts-border-soft)] bg-[var(--dts-panel-elevated)] p-2.5 text-left transition-colors hover:border-[var(--dts-border)]'
                    )}
                  >
                    <div className="font-mono text-xs font-bold text-[var(--dts-ink)]">
                      {term.term}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-[11px] text-[var(--dts-ink-soft)]">
                      {term.shortSummary}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {matchedLessons.length === 0 &&
            matchedSteps.length === 0 &&
            matchedTerms.length === 0 && (
              <div className="py-8 text-center font-mono text-xs text-[var(--dts-ink-muted)]">
                {t.noResults}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

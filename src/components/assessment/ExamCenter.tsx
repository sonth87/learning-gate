import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ALL_EXAMS } from '@/data/exams/examsData';
import { GLOSSARY_BY_ID } from '@/data/glossary';
import { ExamQuestion, ExamSet } from '@/types/assessment.types';
import { SkillLevel, StageId } from '@/types/curriculum.types';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { cn } from '@/utils/cn';
import {
  ClipboardCheck,
  Clock,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  History,
  Terminal,
  Eye,
  ShieldCheck,
  Filter,
  SlidersHorizontal,
  Layers,
  Tag,
  Search,
  ChevronLeft,
  ChevronRight,
  Flag,
  LayoutGrid,
  ListOrdered,
  Copy,
  Check,
  Play,
  Shuffle,
  BookOpen,
  BarChart3,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  HelpCircle,
} from 'lucide-react';

const LEVEL_META: Record<
  SkillLevel,
  { label: string; shortLabel: string; pillClass: string; activeClass: string; order: number }
> = {
  fundamental: {
    label: 'Fundamental (Zero → Cơ bản)',
    shortLabel: 'Fundamental',
    pillClass: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    activeClass: 'bg-sky-500 text-[#020617] border-sky-400 shadow-sm',
    order: 1,
  },
  basic: {
    label: 'Basic (Cấu trúc & Stdlib)',
    shortLabel: 'Basic',
    pillClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    activeClass: 'bg-emerald-500 text-[#020617] border-emerald-400 shadow-sm',
    order: 2,
  },
  advanced: {
    label: 'Advanced (Internals & Async)',
    shortLabel: 'Advanced',
    pillClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    activeClass: 'bg-amber-500 text-[#020617] border-amber-400 shadow-sm',
    order: 3,
  },
  pro: {
    label: 'Pro (Backend Production)',
    shortLabel: 'Pro',
    pillClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
    activeClass: 'bg-indigo-500 text-[#ffffff] border-indigo-400 shadow-sm',
    order: 4,
  },
  master: {
    label: 'Master / Hero (Data, AI & Rust)',
    shortLabel: 'Master',
    pillClass: 'bg-purple-500/15 text-purple-300 border-purple-500/35',
    activeClass: 'bg-purple-500 text-[#ffffff] border-purple-400 shadow-sm',
    order: 5,
  },
};

const STAGE_LABELS: Record<StageId, string> = {
  'stage-1': 'GĐ 1 • Zero & Cú pháp',
  'stage-2': 'GĐ 2 • Cấu trúc & OOP',
  'stage-3': 'GĐ 3 • Stdlib & Pytest',
  'stage-4': 'GĐ 4 • CPython & Typing',
  'stage-5': 'GĐ 5 • GIL & AsyncIO',
  'stage-6': 'GĐ 6 • FastAPI & Production',
  'stage-7': 'GĐ 7 • Data, AI & Rust',
};

/**
 * Fallback enrichment so every question (including legacy sets) has a rich category and tags.
 */
function enrichQuestionMetadata(q: ExamQuestion, examSet?: ExamSet): ExamQuestion {
  if (q.category && q.tags && q.tags.length > 0) {
    return q;
  }

  let category = q.category || 'Kiến thức Tổng hợp Python';
  const tagSet = new Set<string>(q.tags || []);

  const examId = examSet?.id || '';
  if (!q.category) {
    if (examId === 'exam-js-to-python-zero' || examId === 'exam-brain-teasers') {
      category = 'Bẫy Tư duy từ JS/TS sang Python';
    } else if (examId === 'exam-fundamental-basic') {
      category = 'Cấu trúc Dữ liệu (List, Tuple, Dict, Set)';
    } else if (examId === 'exam-advanced-mechanics') {
      category = 'CPython Internals, Bộ nhớ, Descriptors & Type System';
    } else if (examId === 'exam-engineering-pytest') {
      category = 'Kiểm thử (Pytest), Decorators, Generators & Context Managers';
    } else if (examId === 'exam-fastapi-sqlalchemy') {
      category = 'Backend Production: FastAPI, Pydantic v2 & SQLAlchemy 2.0';
    } else if (examId === 'exam-concurrency-gil') {
      category = 'Bất đồng bộ (AsyncIO), Đa luồng, Đa tiến trình & GIL';
    } else if (examId === 'exam-ai-data-production') {
      category = 'Data Engineering (Polars/DuckDB), AI/LLM/RAG & Tối ưu Hiệu năng (Rust/PyO3)';
    } else {
      switch (q.stageId) {
        case 'stage-1':
          category = 'Cú pháp, Kiểu dữ liệu & Chuỗi (Strings)';
          break;
        case 'stage-2':
          category = 'Cấu trúc Dữ liệu (List, Tuple, Dict, Set)';
          break;
        case 'stage-3':
          category = 'Kiểm thử (Pytest), Decorators, Generators & Context Managers';
          break;
        case 'stage-4':
          category = 'CPython Internals, Bộ nhớ, Descriptors & Type System';
          break;
        case 'stage-5':
          category = 'Bất đồng bộ (AsyncIO), Đa luồng, Đa tiến trình & GIL';
          break;
        case 'stage-6':
          category = 'Backend Production: FastAPI, Pydantic v2 & SQLAlchemy 2.0';
          break;
        case 'stage-7':
          category = 'Data Engineering (Polars/DuckDB), AI/LLM/RAG & Tối ưu Hiệu năng (Rust/PyO3)';
          break;
      }
    }
  }

  const hay = `${q.question} ${q.codeSnippet || ''} ${q.overallExplanation}`.toLowerCase();
  const keywordTags: [RegExp, string][] = [
    [/\buv\b|pyproject\.toml|uv\.lock/, 'uv'],
    [/\bvenv\b|virtualenv/, 'venv'],
    [/\bpyenv\b/, 'pyenv'],
    [/js|javascript|typescript|node\.js/, 'js-to-python'],
    [/\blist\b|append|slice/, 'list'],
    [/\bdict\b|hash|setdefault/, 'dict'],
    [/\btuple\b/, 'tuple'],
    [/\bset\b|frozenset/, 'set'],
    [/comprehension/, 'comprehension'],
    [/closure|nonlocal|legb|scope/, 'closures'],
    [/class\b|__init__|super\(|mro|property/, 'oop'],
    [/decorator|@wraps/, 'decorators'],
    [/generator|\byield\b/, 'generators'],
    [/context manager|__enter__|__exit__|with\s/, 'contextlib'],
    [/pytest|fixture|monkeypatch/, 'pytest'],
    [/__slots__|refcount|garbage|gc\b|id\(/, 'cpython'],
    [/descriptor|__get__|__set__|metaclass/, 'descriptors'],
    [/protocol|typevar|typeddict|generic|mypy/, 'typing'],
    [/\bgil\b|thread|multiprocess/, 'gil'],
    [/async\b|await\b|asyncio|taskgroup|coroutine/, 'asyncio'],
    [/fastapi|depends|uvicorn|asgi/, 'fastapi'],
    [/pydantic|basemodel|field_validator/, 'pydantic-v2'],
    [/sqlalchemy|asyncsession|selectinload|alembic/, 'sqlalchemy'],
    [/redis|cache|idempoten|outbox|lock/, 'redis'],
    [/polars|duckdb|arrow|parquet|vectoriz/, 'polars'],
    [/llm|rag|embedding|agent|prompt/, 'llm-rag'],
    [/py-spy|memray|pyo3|rust/, 'profiling'],
  ];

  for (const [regex, tag] of keywordTags) {
    if (regex.test(hay)) {
      tagSet.add(tag);
    }
  }
  for (const termId of q.relatedTermIds || []) {
    if (termId && tagSet.size < 5) {
      tagSet.add(termId.replace(/^term-/, ''));
    }
  }
  if (tagSet.size === 0) {
    tagSet.add(q.level);
    tagSet.add(q.stageId);
  }

  return {
    ...q,
    category,
    tags: Array.from(tagSet).slice(0, 5),
  };
}

type StudioTab = 'active-exam' | 'custom-builder' | 'curated-sets' | 'history';
type QuestionDisplayMode = 'single' | 'list';
type ReviewFilter = 'all' | 'wrong' | 'correct' | 'unanswered' | 'flagged';

export const ExamCenter: React.FC = () => {
  const { showTermPopover } = useNavigationStore();
  const { examHistory: pastAttempts, recordExamAttempt } = useUserDataStore();

  // Enrich all exam sets and build the master question bank
  const enrichedExamSets = useMemo<ExamSet[]>(() => {
    return ALL_EXAMS.map((exam) => ({
      ...exam,
      questions: exam.questions.map((q) => enrichQuestionMetadata(q, exam)),
    }));
  }, []);

  const allQuestionsBank = useMemo<ExamQuestion[]>(() => {
    const map = new Map<string, ExamQuestion>();
    for (const exam of enrichedExamSets) {
      for (const q of exam.questions) {
        if (!map.has(q.id)) {
          map.set(q.id, q);
        }
      }
    }
    return Array.from(map.values());
  }, [enrichedExamSets]);

  // Extract Categories, Tags, and Counts
  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of allQuestionsBank) {
      const cat = q.category || 'Khác';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [allQuestionsBank]);

  const tagStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of allQuestionsBank) {
      for (const t of q.tags || []) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [allQuestionsBank]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allQuestionsBank.length };
    for (const q of allQuestionsBank) {
      counts[q.level] = (counts[q.level] || 0) + 1;
    }
    return counts;
  }, [allQuestionsBank]);

  // Active Exam State (can be a curated ExamSet OR a dynamically built Custom Quiz)
  const [activeExam, setActiveExam] = useState<ExamSet>(() => enrichedExamSets[0]);
  const [studioTab, setStudioTab] = useState<StudioTab>('active-exam');

  // Exam Taking State
  const [displayMode, setDisplayMode] = useState<QuestionDisplayMode>('single');
  const [instantFeedbackMode, setInstantFeedbackMode] = useState<boolean>(true);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom Quiz Builder Filters
  const [builderLevel, setBuilderLevel] = useState<SkillLevel | 'all'>('all');
  const [builderStage, setBuilderStage] = useState<StageId | 'all'>('all');
  const [builderCategory, setBuilderCategory] = useState<string>('all');
  const [builderTags, setBuilderTags] = useState<string[]>([]);
  const [builderSearch, setBuilderSearch] = useState<string>('');
  const [builderCount, setBuilderCount] = useState<number | 'all'>(20);
  const [builderShuffle, setBuilderShuffle] = useState<boolean>(true);
  const [tagSearchQuery, setTagSearchQuery] = useState<string>('');
  const [showAllTags, setShowAllTags] = useState<boolean>(false);

  // Curated Exam Sets Filter
  const [curatedLevelFilter, setCuratedLevelFilter] = useState<SkillLevel | 'all'>('all');
  const [curatedSearch, setCuratedSearch] = useState<string>('');

  const examTopRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    if (isSubmitted || studioTab !== 'active-exam') return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, activeExam.id, studioTab]);

  // Filtered questions in Custom Builder
  const builderMatchingQuestions = useMemo(() => {
    const query = builderSearch.trim().toLowerCase();
    return allQuestionsBank.filter((q) => {
      if (builderLevel !== 'all' && q.level !== builderLevel) return false;
      if (builderStage !== 'all' && q.stageId !== builderStage) return false;
      if (builderCategory !== 'all' && q.category !== builderCategory) return false;
      if (builderTags.length > 0) {
        const qTags = q.tags || [];
        const hasMatch = builderTags.some((t) => qTags.includes(t));
        if (!hasMatch) return false;
      }
      if (query) {
        const hay = `${q.question} ${q.codeSnippet || ''} ${q.category || ''} ${(q.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [allQuestionsBank, builderLevel, builderStage, builderCategory, builderTags, builderSearch]);

  // Filtered Curated Exam Sets
  const filteredCuratedSets = useMemo(() => {
    const q = curatedSearch.trim().toLowerCase();
    return enrichedExamSets.filter((exam) => {
      if (curatedLevelFilter !== 'all' && exam.targetLevel !== curatedLevelFilter) return false;
      if (q) {
        const hay = `${exam.title} ${exam.description} ${exam.questions[0]?.category || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enrichedExamSets, curatedLevelFilter, curatedSearch]);

  // Start a specific ExamSet
  const startExamSet = useCallback((exam: ExamSet) => {
    setActiveExam(exam);
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setRevealedQuestions({});
    setIsSubmitted(false);
    setReviewFilter('all');
    setCurrentQuestionIdx(0);
    setElapsedSeconds(0);
    setStudioTab('active-exam');
    setMobilePaletteOpen(false);
    setTimeout(() => {
      examTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }, []);

  // Build & Start Custom Quiz from Builder Filters
  const handleStartCustomQuiz = useCallback(() => {
    if (builderMatchingQuestions.length === 0) return;
    const pool = [...builderMatchingQuestions];
    if (builderShuffle) {
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }
    const chosen = builderCount === 'all' ? pool : pool.slice(0, builderCount);

    const parts: string[] = [];
    if (builderLevel !== 'all') parts.push(LEVEL_META[builderLevel].shortLabel);
    if (builderCategory !== 'all') parts.push(builderCategory);
    if (builderTags.length > 0) parts.push(builderTags.map((t) => `#${t}`).join(', '));
    const titleSuffix = parts.length > 0 ? parts.join(' • ') : 'Tổng hợp Đa Cấp độ';

    const customExam: ExamSet = {
      id: `custom-quiz-${Date.now()}`,
      title: `Đề Tự Chọn: ${titleSuffix}`,
      description: `Bộ đề kiểm tra gồm ${chosen.length} câu hỏi được trích xuất từ ngân hàng ${allQuestionsBank.length} câu hỏi theo bộ lọc của bạn.`,
      targetLevel: builderLevel,
      ...(builderStage !== 'all' ? { targetStage: builderStage } : {}),
      durationMinutes: Math.max(10, Math.round(chosen.length * 1.2)),
      passingScorePercent: 75,
      questions: chosen,
    };

    startExamSet(customExam);
  }, [
    builderMatchingQuestions,
    builderShuffle,
    builderCount,
    builderLevel,
    builderCategory,
    builderTags,
    builderStage,
    allQuestionsBank.length,
    startExamSet,
  ]);

  const handleResetCurrentExam = useCallback(() => {
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setRevealedQuestions({});
    setIsSubmitted(false);
    setReviewFilter('all');
    setCurrentQuestionIdx(0);
    setElapsedSeconds(0);
    setMobilePaletteOpen(false);
  }, []);

  const handleSelectOption = useCallback(
    (questionId: string, optionId: string) => {
      if (isSubmitted) return;
      setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    },
    [isSubmitted]
  );

  const toggleFlagQuestion = useCallback((questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  }, []);

  const toggleRevealQuestion = useCallback((questionId: string) => {
    setRevealedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  }, []);

  // Score calculation
  const scoreSummary = useMemo(() => {
    const total = activeExam.questions.length;
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    const byCategory: Record<string, { correct: number; total: number }> = {};
    const byLevel: Record<string, { correct: number; total: number }> = {};

    for (const q of activeExam.questions) {
      const chosen = selectedAnswers[q.id];
      const isCorrect = chosen === q.correctOptionId;
      if (!chosen) {
        unanswered++;
      } else if (isCorrect) {
        correct++;
      } else {
        wrong++;
      }

      const cat = q.category || 'Khác';
      if (!byCategory[cat]) byCategory[cat] = { correct: 0, total: 0 };
      byCategory[cat].total++;
      if (isCorrect) byCategory[cat].correct++;

      const lvl = q.level;
      if (!byLevel[lvl]) byLevel[lvl] = { correct: 0, total: 0 };
      byLevel[lvl].total++;
      if (isCorrect) byLevel[lvl].correct++;
    }

    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = percent >= activeExam.passingScorePercent;

    return {
      correct,
      wrong,
      unanswered,
      total,
      percent,
      passed,
      byCategory: Object.entries(byCategory).map(([name, stat]) => ({
        name,
        ...stat,
        percent: Math.round((stat.correct / stat.total) * 100),
      })),
      byLevel: Object.entries(byLevel).map(([level, stat]) => ({
        level: level as SkillLevel,
        ...stat,
        percent: Math.round((stat.correct / stat.total) * 100),
      })),
    };
  }, [activeExam, selectedAnswers]);

  const handleSubmitExam = useCallback(async () => {
    setIsSubmitted(true);
    setMobilePaletteOpen(false);
    await recordExamAttempt({
      examId: activeExam.id,
      examTitle: activeExam.title,
      scorePercent: scoreSummary.percent,
      correctCount: scoreSummary.correct,
      totalQuestions: scoreSummary.total,
      timeSpentSeconds: elapsedSeconds,
      selectedAnswers,
    });
    setTimeout(() => {
      examTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }, [activeExam, scoreSummary, elapsedSeconds, selectedAnswers, recordExamAttempt]);

  // Retry only wrong/unanswered questions
  const handleRetryWrongQuestions = useCallback(() => {
    const wrongOrMissed = activeExam.questions.filter(
      (q) => selectedAnswers[q.id] !== q.correctOptionId
    );
    if (wrongOrMissed.length === 0) return;
    const retryExam: ExamSet = {
      id: `${activeExam.id}-retry-${Date.now()}`,
      title: `Ôn lại câu sai: ${activeExam.title}`,
      description: `Tập trung làm lại ${wrongOrMissed.length} câu làm sai hoặc bỏ trống trong lần thi vừa rồi.`,
      targetLevel: activeExam.targetLevel,
      durationMinutes: Math.max(5, wrongOrMissed.length),
      passingScorePercent: 80,
      questions: wrongOrMissed,
    };
    startExamSet(retryExam);
  }, [activeExam, selectedAnswers, startExamSet]);

  // Filtered questions when reviewing after submission
  const displayedQuestions = useMemo(() => {
    if (!isSubmitted || reviewFilter === 'all') {
      return activeExam.questions.map((q, idx) => ({ q, originalIdx: idx }));
    }
    return activeExam.questions
      .map((q, idx) => ({ q, originalIdx: idx }))
      .filter(({ q }) => {
        const chosen = selectedAnswers[q.id];
        if (reviewFilter === 'wrong') return chosen !== undefined && chosen !== q.correctOptionId;
        if (reviewFilter === 'correct') return chosen === q.correctOptionId;
        if (reviewFilter === 'unanswered') return chosen === undefined;
        if (reviewFilter === 'flagged') return !!flaggedQuestions[q.id];
        return true;
      });
  }, [activeExam.questions, isSubmitted, reviewFilter, selectedAnswers, flaggedQuestions]);

  // Clamp currentQuestionIdx when displayedQuestions changes
  useEffect(() => {
    if (currentQuestionIdx >= displayedQuestions.length && displayedQuestions.length > 0) {
      setCurrentQuestionIdx(0);
    }
  }, [displayedQuestions.length, currentQuestionIdx]);

  const currentQuestionEntry = displayedQuestions[currentQuestionIdx] || displayedQuestions[0];

  // Keyboard shortcuts for Single-Question Focus Mode
  useEffect(() => {
    if (studioTab !== 'active-exam' || displayMode !== 'single' || !currentQuestionEntry) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }
      const q = currentQuestionEntry.q;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentQuestionIdx((prev) => Math.min(displayedQuestions.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentQuestionIdx((prev) => Math.max(0, prev - 1));
      } else if (
        !isSubmitted &&
        ['1', '2', '3', '4', 'a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(e.key)
      ) {
        const mapKey: Record<string, number> = {
          '1': 0,
          '2': 1,
          '3': 2,
          '4': 3,
          a: 0,
          b: 1,
          c: 2,
          d: 3,
          A: 0,
          B: 1,
          C: 2,
          D: 3,
        };
        const opt = q.options[mapKey[e.key]];
        if (opt) {
          handleSelectOption(q.id, opt.id);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFlagQuestion(q.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    studioTab,
    displayMode,
    currentQuestionEntry,
    displayedQuestions.length,
    isSubmitted,
    handleSelectOption,
    toggleFlagQuestion,
  ]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;

  // Render a single Question Card (used in both Single-Question Focus Mode & Full-Paper List Mode)
  const renderQuestionCard = (q: ExamQuestion, originalIdx: number) => {
    const chosenId = selectedAnswers[q.id];
    const isAnswered = chosenId !== undefined;
    const isFlagged = !!flaggedQuestions[q.id];
    const isRevealed =
      isSubmitted || (instantFeedbackMode && isAnswered) || !!revealedQuestions[q.id];
    const isCorrect = chosenId === q.correctOptionId;

    return (
      <div
        key={q.id}
        id={`exam-q-${originalIdx}`}
        className={cn(
          'rounded-2xl border bg-slate-900/90 transition-all shadow-md overflow-hidden',
          isRevealed
            ? isAnswered
              ? isCorrect
                ? 'border-emerald-500/60 ring-1 ring-emerald-500/20'
                : 'border-rose-500/60 ring-1 ring-rose-500/20'
              : 'border-amber-500/50'
            : isFlagged
            ? 'border-amber-500/60 ring-1 ring-amber-500/20'
            : isAnswered
            ? 'border-indigo-500/50'
            : 'border-slate-800/90'
        )}
      >
        {/* Question Card Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-emerald-500 text-[#020617] font-mono text-xs font-extrabold">
              Câu #{originalIdx + 1} / {activeExam.questions.length}
            </span>
            <LevelBadge level={q.level} size="sm" />
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300">
              {STAGE_LABELS[q.stageId] || q.stageId}
            </span>
            {q.category && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Layers className="w-3 h-3 shrink-0" />
                <span>{q.category}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {!isSubmitted && !instantFeedbackMode && (
              <button
                type="button"
                onClick={() => toggleRevealQuestion(q.id)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                  revealedQuestions[q.id]
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                )}
                title="Xem gợi ý & giải thích cho câu này"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {revealedQuestions[q.id] ? 'Ẩn đáp án' : 'Xem đáp án'}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleFlagQuestion(q.id)}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                isFlagged
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              )}
              title="Đánh dấu câu hỏi để xem lại (Phím tắt: F)"
            >
              <Flag className={cn('w-3.5 h-3.5', isFlagged && 'fill-amber-400 text-amber-400')} />
              <span>{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
            </button>
          </div>
        </div>

        {/* Question Body */}
        <div className="p-4 sm:p-6">
          {/* Tags Row */}
          {q.tags && q.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {q.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Question Text */}
          <h4 className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed mb-4">
            <RichTextWithTerms text={q.question} />
          </h4>

          {/* Optional Code Snippet (IDE Dark Surface with Syntax Highlighting) */}
          {q.codeSnippet && (
            <div className="ide-dark-surface mb-5 rounded-xl overflow-hidden border border-slate-800 bg-[#0b1120] shadow-inner">
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#0f172a] border-b border-slate-800 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>python_snippet.py</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(q.id, q.codeSnippet!)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  {copiedId === q.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 sm:p-4 text-xs sm:text-sm font-mono text-slate-100 overflow-x-auto leading-relaxed">
                <code>{renderHighlightedPython(q.codeSnippet)}</code>
              </pre>
            </div>
          )}

          {/* 4 Options List */}
          <div className="space-y-2.5">
            {q.options.map((opt, optIdx) => {
              const isSelected = chosenId === opt.id;
              const isCorrectOption = opt.id === q.correctOptionId;
              const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

              let cardStyle =
                'bg-slate-950/70 border-slate-800 text-slate-200 hover:bg-slate-800/60 hover:border-indigo-500/50';
              let badgeStyle = 'bg-slate-900 border-slate-700 text-slate-300';

              if (isRevealed) {
                if (isCorrectOption) {
                  cardStyle =
                    'bg-emerald-500/15 border-emerald-500/60 text-slate-100 ring-1 ring-emerald-500/30';
                  badgeStyle = 'bg-emerald-500 border-emerald-400 text-[#020617]';
                } else if (isSelected && !isCorrectOption) {
                  cardStyle =
                    'bg-rose-500/15 border-rose-500/60 text-slate-100 ring-1 ring-rose-500/30';
                  badgeStyle = 'bg-rose-500 border-rose-400 text-[#ffffff]';
                } else {
                  cardStyle = 'bg-slate-950/40 border-slate-800/70 text-slate-400';
                  badgeStyle = 'bg-slate-900 border-slate-800 text-slate-500';
                }
              } else if (isSelected) {
                cardStyle =
                  'bg-indigo-500/15 border-indigo-500 text-slate-100 ring-2 ring-indigo-500/25 shadow-xs';
                badgeStyle = 'bg-indigo-500 border-indigo-400 text-[#ffffff]';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(q.id, opt.id)}
                  className={cn(
                    'w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 sm:gap-3.5',
                    cardStyle
                  )}
                >
                  <span
                    className={cn(
                      'w-7 h-7 rounded-lg border text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                      badgeStyle
                    )}
                  >
                    {optionLetter}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm sm:text-[15px] font-semibold leading-snug break-words">
                        <RichTextWithTerms text={opt.text} />
                      </span>
                      {isRevealed && (
                        <span className="shrink-0 mt-0.5">
                          {isCorrectOption ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden sm:inline">Đáp án đúng</span>
                            </span>
                          ) : isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span className="hidden sm:inline">Bạn chọn sai</span>
                            </span>
                          ) : null}
                        </span>
                      )}
                    </div>

                    {isRevealed && opt.whyRightOrWrong && (
                      <p
                        className={cn(
                          'mt-2 pt-2 border-t text-xs sm:text-[13px] leading-relaxed',
                          isCorrectOption
                            ? 'border-emerald-500/30 text-emerald-300 font-medium'
                            : isSelected
                            ? 'border-rose-500/30 text-rose-300 font-medium'
                            : 'border-slate-800 text-slate-400'
                        )}
                      >
                        <RichTextWithTerms text={opt.whyRightOrWrong} />
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Overall Explanation & Analogy Box */}
          {isRevealed && (
            <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Giải thích Bản chất & Cơ chế Python</span>
                </div>
                {!isAnswered && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Câu này chưa chọn đáp án
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                <RichTextWithTerms text={q.overallExplanation} />
              </p>
              {q.analogyReminder && (
                <div className="pt-2.5 border-t border-slate-800 text-xs text-amber-300 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    <strong className="text-amber-300">Góc nhìn từ JS/TS & Ghi nhớ nhanh:</strong>{' '}
                    <RichTextWithTerms text={q.analogyReminder} />
                  </span>
                </div>
              )}

              {/* Clickable Related Glossary Terms */}
              {q.relatedTermIds && q.relatedTermIds.length > 0 && (
                <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">
                    Thuật ngữ liên quan:
                  </span>
                  {q.relatedTermIds.map((termId) => {
                    const term = GLOSSARY_BY_ID[termId];
                    if (!term) return null;
                    return (
                      <button
                        key={termId}
                        type="button"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          showTermPopover(termId, {
                            top: rect.top,
                            left: rect.left,
                            bottom: rect.bottom,
                            width: rect.width,
                          });
                        }}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 transition-colors"
                      >
                        {term.term}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Desktop / In-card Navigation Footer when in Single-Question Mode */}
          {displayMode === 'single' && (
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-xs sm:text-sm font-bold text-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
                Phím tắt:{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300 font-mono">
                  1-4
                </kbd>{' '}
                chọn đáp án •{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300 font-mono">
                  ←/→
                </kbd>{' '}
                chuyển câu •{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300 font-mono">
                  F
                </kbd>{' '}
                đánh dấu
              </span>

              {currentQuestionIdx < displayedQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestionIdx((prev) =>
                      Math.min(displayedQuestions.length - 1, prev + 1)
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#020617] text-xs sm:text-sm font-extrabold shadow-sm transition-colors"
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : !isSubmitted ? (
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#020617] text-xs sm:text-sm font-extrabold shadow-sm transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Nộp bài & Chấm điểm</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIdx(0)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Về câu đầu</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Question Map Palette Grid (reused in Desktop Right Sidebar and Mobile Slide-Up Drawer)
  const renderQuestionPaletteGrid = (closeMobileOnSelect = false) => {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
          {displayedQuestions.map(({ q, originalIdx }, visibleIdx) => {
            const chosenId = selectedAnswers[q.id];
            const isAnswered = chosenId !== undefined;
            const isFlagged = !!flaggedQuestions[q.id];
            const isCurrent = displayMode === 'single' && currentQuestionIdx === visibleIdx;
            const isRevealed =
              isSubmitted || (instantFeedbackMode && isAnswered) || !!revealedQuestions[q.id];
            const isCorrect = chosenId === q.correctOptionId;

            let btnStyle = 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800';
            if (isRevealed && isAnswered) {
              btnStyle = isCorrect
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 font-extrabold'
                : 'bg-rose-500/25 text-rose-300 border-rose-500/50 font-extrabold';
            } else if (isAnswered) {
              btnStyle = 'bg-indigo-500 text-[#ffffff] border-indigo-400 font-bold';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  if (displayMode === 'single') {
                    setCurrentQuestionIdx(visibleIdx);
                  } else {
                    const el = document.getElementById(`exam-q-${originalIdx}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                  if (closeMobileOnSelect) {
                    setMobilePaletteOpen(false);
                  }
                }}
                className={cn(
                  'relative h-9 rounded-lg border text-xs font-mono transition-all flex items-center justify-center',
                  btnStyle,
                  isCurrent && 'ring-2 ring-emerald-400 scale-105 z-10'
                )}
              >
                {originalIdx + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900" />
                )}
              </button>
            );
          })}
        </div>

        {/* Palette Legend */}
        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-1.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500 inline-block" />
            <span>Đã chọn ({answeredCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-950 border border-slate-700 inline-block" />
            <span>Chưa làm ({activeExam.questions.length - answeredCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            <span>Đánh dấu ({flaggedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/60 inline-block" />
            <span>Đúng / Sai</span>
          </div>
        </div>
      </div>
    );
  };

  const visibleTags = useMemo(() => {
    const q = tagSearchQuery.trim().toLowerCase();
    const filtered = q
      ? tagStats.filter((item) => item.tag.toLowerCase().includes(q))
      : tagStats;
    return showAllTags ? filtered : filtered.slice(0, 24);
  }, [tagStats, tagSearchQuery, showAllTags]);

  return (
    <div ref={examTopRef} className="mx-auto max-w-[1440px] p-3 sm:p-6 space-y-3.5 sm:space-y-5">
      {/* Top Studio Banner & Navigation Tabs */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/85 p-3 sm:p-6 shadow-lg space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5">
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/25 to-indigo-500/20 border border-emerald-500/40 text-emerald-400 shadow-inner">
              <ClipboardCheck className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-xl font-extrabold text-slate-100 tracking-tight">
                  Trung tâm Thi Sát Hạch & Ngân Hàng Câu Hỏi
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2 py-0.5 font-mono text-[10px] sm:text-xs font-bold text-emerald-300">
                  {allQuestionsBank.length} Câu Hỏi
                </span>
              </div>
              <p className="hidden sm:block text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Hệ thống kiểm tra kiến thức toàn diện phân tầng theo{' '}
                <strong className="text-slate-200">5 Level</strong> (Fundamental → Master),{' '}
                <strong className="text-slate-200">{categoryStats.length} Chuyên đề</strong> và{' '}
                <strong className="text-slate-200">{tagStats.length}+ Tags</strong> kèm giải thích
                đáp án chuyên sâu & liên hệ từ JS/TS.
              </p>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-3 shrink-0">
            <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-sm sm:text-xl font-black text-emerald-400 leading-tight">
                {allQuestionsBank.length}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                Câu hỏi
              </div>
            </div>
            <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-sm sm:text-xl font-black text-indigo-300 leading-tight">
                {enrichedExamSets.length}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                Bộ đề chuẩn
              </div>
            </div>
            <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-sm sm:text-xl font-black text-amber-300 leading-tight">
                {categoryStats.length}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                Categories
              </div>
            </div>
          </div>
        </div>

        {/* Studio Navigation Tabs (Compact Grid on Mobile so they don't stack 3 rows tall!) */}
        <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setStudioTab('active-exam')}
            className={cn(
              'inline-flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all truncate',
              studioTab === 'active-exam'
                ? 'bg-emerald-500 text-[#020617] shadow-sm'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
            )}
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Phòng Thi</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold shrink-0',
                studioTab === 'active-exam'
                  ? 'bg-[#020617]/20 text-[#020617]'
                  : 'bg-indigo-500/20 text-indigo-300'
              )}
            >
              {activeExam.questions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('custom-builder')}
            className={cn(
              'inline-flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all truncate',
              studioTab === 'custom-builder'
                ? 'bg-emerald-500 text-[#020617] shadow-sm'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden truncate">Tạo Đề Tự Chọn</span>
            <span className="hidden sm:inline">Tạo Đề Theo Level / Category / Tag</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('curated-sets')}
            className={cn(
              'inline-flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all truncate',
              studioTab === 'curated-sets'
                ? 'bg-emerald-500 text-[#020617] shadow-sm'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800',
              pastAttempts.length === 0 && 'col-span-2 sm:col-span-1'
            )}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Bộ Đề Chuẩn ({enrichedExamSets.length})</span>
          </button>

          {pastAttempts.length > 0 && (
            <button
              type="button"
              onClick={() => setStudioTab('history')}
              className={cn(
                'inline-flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all truncate',
                studioTab === 'history'
                  ? 'bg-emerald-500 text-[#020617] shadow-sm'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
              )}
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Lịch sử ({pastAttempts.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: CUSTOM QUIZ BUILDER BY LEVEL, CATEGORY & TAG */}
      {studioTab === 'custom-builder' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 p-4 sm:p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                <span>Thiết Kế Đề Kiểm Tra Theo Cấp Độ, Category & Tag</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Chọn tổ hợp Level, Chuyên đề hoặc Tag bạn muốn ôn luyện để hệ thống trích xuất đề thi
                tương ứng từ {allQuestionsBank.length} câu hỏi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBuilderLevel('all');
                setBuilderStage('all');
                setBuilderCategory('all');
                setBuilderTags([]);
                setBuilderSearch('');
              }}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-bold text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>

          {/* 1. Filter by Level */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              1. Chọn Cấp Độ (Skill Level)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBuilderLevel('all')}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all',
                  builderLevel === 'all'
                    ? 'bg-emerald-500 text-[#020617] border-emerald-400 shadow-xs'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                )}
              >
                Tất cả Level ({levelCounts.all})
              </button>
              {(Object.keys(LEVEL_META) as SkillLevel[]).map((lvl) => {
                const meta = LEVEL_META[lvl];
                const isSelected = builderLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setBuilderLevel(lvl)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all',
                      isSelected ? meta.activeClass : `${meta.pillClass} hover:opacity-90`
                    )}
                  >
                    {meta.label} ({levelCounts[lvl] || 0})
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Filter by Stage & Keyword Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                2. Lọc theo Giai đoạn Lộ trình (Stage 1 – 7)
              </label>
              <select
                value={builderStage}
                onChange={(e) => setBuilderStage(e.target.value as StageId | 'all')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tất cả Giai đoạn (Stages 1 – 7)</option>
                {(Object.keys(STAGE_LABELS) as StageId[]).map((stg) => (
                  <option key={stg} value={stg}>
                    {STAGE_LABELS[stg]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                3. Tìm theo Từ khóa (Câu hỏi / Code / Khái niệm)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={builderSearch}
                  onChange={(e) => setBuilderSearch(e.target.value)}
                  placeholder="VD: uv.lock, asyncio, FastAPI, list comprehension, GIL..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Filter by Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              4. Chọn Chuyên đề Kiến thức (Category — {categoryStats.length} chuyên đề)
            </label>
            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setBuilderCategory('all')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                  builderCategory === 'all'
                    ? 'bg-emerald-500 text-[#020617] border-emerald-400 shadow-xs'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                )}
              >
                Tất cả Chuyên đề ({allQuestionsBank.length})
              </button>
              {categoryStats.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setBuilderCategory(cat.name)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left',
                    builderCategory === cat.name
                      ? 'bg-emerald-500 text-[#020617] border-emerald-400 font-bold shadow-xs'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/40'
                  )}
                >
                  {cat.name}{' '}
                  <span className="opacity-75 font-mono text-[11px]">({cat.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Filter by Tags */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  5. Lọc theo Tags ({tagStats.length} tags — Có thể chọn nhiều tag cùng lúc)
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  placeholder="Tìm nhanh tag (#uv, #pytest...)"
                  className="px-2.5 py-1 rounded-lg border border-slate-800 text-xs bg-slate-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {builderTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setBuilderTags([])}
                    className="text-xs text-rose-400 font-bold hover:underline"
                  >
                    Bỏ chọn ({builderTags.length})
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map(({ tag, count }) => {
                const isSelected = builderTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setBuilderTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-mono border transition-all',
                      isSelected
                        ? 'bg-emerald-500 text-[#020617] border-emerald-400 font-bold shadow-xs'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    )}
                  >
                    #{tag} <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
              {tagStats.length > 24 && (
                <button
                  type="button"
                  onClick={() => setShowAllTags((prev) => !prev)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30"
                >
                  {showAllTags ? 'Thu gọn bớt tags' : `+ Xem tất cả ${tagStats.length} tags`}
                </button>
              )}
            </div>
          </div>

          {/* 6. Quiz Count, Shuffle & Launch Button */}
          <div className="pt-4 border-t border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Số câu muốn làm:</span>
                <div className="flex flex-wrap items-center gap-1">
                  {([10, 15, 20, 30, 50, 100, 'all'] as const).map((cnt) => (
                    <button
                      key={String(cnt)}
                      type="button"
                      onClick={() => setBuilderCount(cnt)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-bold border transition-all',
                        builderCount === cnt
                          ? 'bg-emerald-500 text-[#020617] border-emerald-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      )}
                    >
                      {cnt === 'all' ? 'Tất cả' : cnt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBuilderShuffle((prev) => !prev)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                  builderShuffle
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                )}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>{builderShuffle ? 'Đang bật trộn đề ngẫu nhiên' : 'Giữ nguyên thứ tự'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">
                Tìm thấy{' '}
                <strong className="text-emerald-400 font-extrabold">
                  {builderMatchingQuestions.length}
                </strong>{' '}
                câu hỏi khớp bộ lọc
              </span>
              <button
                type="button"
                disabled={builderMatchingQuestions.length === 0}
                onClick={handleStartCustomQuiz}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-[#020617] font-extrabold text-xs sm:text-sm shadow-md transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>
                  Bắt đầu Làm Đề (
                  {builderCount === 'all'
                    ? builderMatchingQuestions.length
                    : Math.min(builderCount, builderMatchingQuestions.length)}{' '}
                  câu)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CURATED EXAM SETS */}
      {studioTab === 'curated-sets' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 p-4 sm:p-6 shadow-md space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>Danh Sách {enrichedExamSets.length} Bộ Đề Sát Hạch Theo Chuyên Đề</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Mỗi bộ đề được biên soạn có hệ thống theo từng chặng kiến thức từ Zero Setup (`uv`,
                `pyenv`, `.venv`) tới Production Backend, Data Engineering & AI.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={curatedSearch}
                onChange={(e) => setCuratedSearch(e.target.value)}
                placeholder="Tìm tên bộ đề..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Level Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCuratedLevelFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                curatedLevelFilter === 'all'
                  ? 'bg-emerald-500 text-[#020617] border-emerald-400'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              )}
            >
              Tất cả ({enrichedExamSets.length} bộ đề)
            </button>
            {(Object.keys(LEVEL_META) as SkillLevel[]).map((lvl) => {
              const count = enrichedExamSets.filter((e) => e.targetLevel === lvl).length;
              const meta = LEVEL_META[lvl];
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCuratedLevelFilter(lvl)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                    curatedLevelFilter === lvl ? meta.activeClass : meta.pillClass
                  )}
                >
                  {meta.shortLabel} ({count} đề)
                </button>
              );
            })}
          </div>

          {/* Grid of Exam Sets */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCuratedSets.map((exam) => {
              const bestAttempt = pastAttempts
                .filter((a) => a.examId === exam.id)
                .sort((a, b) => b.scorePercent - a.scorePercent)[0];
              const isCurrent = activeExam.id === exam.id;
              const sampleTags = Array.from(
                new Set(exam.questions.flatMap((q) => q.tags || []))
              ).slice(0, 4);

              return (
                <div
                  key={exam.id}
                  className={cn(
                    'rounded-2xl border p-4 flex flex-col justify-between transition-all',
                    isCurrent
                      ? 'border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      {exam.targetLevel !== 'all' ? (
                        <LevelBadge level={exam.targetLevel} size="sm" />
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Tổng hợp
                        </span>
                      )}
                      {bestAttempt ? (
                        <span
                          className={cn(
                            'text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border',
                            bestAttempt.scorePercent >= exam.passingScorePercent
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          )}
                        >
                          Cao nhất: {bestAttempt.scorePercent}%
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-500">Chưa làm</span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-extrabold text-slate-100 leading-snug mb-1.5">
                      {exam.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {exam.description}
                    </p>

                    {sampleTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {sampleTags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-2">
                      <span>{exam.questions.length} câu</span>
                      <span>•</span>
                      <span>{exam.durationMinutes} phút</span>
                      <span>•</span>
                      <span>Đạt {exam.passingScorePercent}%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startExamSet(exam)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#020617] text-xs font-extrabold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Vào thi</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: EXAM ATTEMPT HISTORY */}
      {studioTab === 'history' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 p-4 sm:p-6 shadow-md space-y-4">
          <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Lịch Sử Làm Bài Kiểm Tra ({pastAttempts.length} lượt)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pastAttempts.map((att) => (
              <div
                key={att.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                    {att.examTitle}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {new Date(att.completedAt).toLocaleString('vi-VN')} •{' '}
                    {formatTime(att.timeSpentSeconds)}
                  </div>
                </div>
                <div
                  className={cn(
                    'px-3 py-1.5 rounded-xl font-extrabold text-xs shrink-0 border',
                    att.scorePercent >= 75
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  )}
                >
                  {att.scorePercent}% ({att.correctCount}/{att.totalQuestions})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4 (DEFAULT): ACTIVE EXAM TAKING WORKSPACE */}
      {studioTab === 'active-exam' && (
        <div className="space-y-4">
          {/* Compact Exam Toolbar (Sticky inside scroll area) */}
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800/90 p-3.5 sm:p-4 shadow-md sticky top-2 z-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Exam Title & Progress */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-100 truncate">
                    {activeExam.title}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Đạt ≥ {activeExam.passingScorePercent}%
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>
                    Đã trả lời:{' '}
                    <strong className="text-slate-100">
                      {answeredCount} / {activeExam.questions.length}
                    </strong>
                  </span>
                  {flaggedCount > 0 && (
                    <span className="text-amber-300 font-semibold">
                      🚩 Đánh dấu: {flaggedCount}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-mono text-emerald-300 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
              </div>

              {/* Controls: View Mode, Feedback Mode, Submit */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Toggle Single Question vs Full List */}
                <div className="inline-flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('single')}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                      displayMode === 'single'
                        ? 'bg-emerald-500 text-[#020617] shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Từng câu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('list')}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                      displayMode === 'list'
                        ? 'bg-emerald-500 text-[#020617] shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Toàn bộ đề</span>
                  </button>
                </div>

                {/* Toggle Instant Practice vs Exam Mode */}
                {!isSubmitted && (
                  <button
                    type="button"
                    onClick={() => setInstantFeedbackMode((prev) => !prev)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                      instantFeedbackMode
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                    )}
                  >
                    {instantFeedbackMode ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Luyện tập (Biết đáp án ngay)</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Thi sát hạch (Nộp cuối giờ)</span>
                      </>
                    )}
                  </button>
                )}

                {!isSubmitted ? (
                  <button
                    type="button"
                    onClick={handleSubmitExam}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-extrabold text-xs shadow-sm transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Nộp bài ({answeredCount}/{activeExam.questions.length})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetCurrentExam}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại đề này</span>
                  </button>
                )}
              </div>
            </div>

            {/* Thin Progress Bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                style={{
                  width: `${
                    activeExam.questions.length > 0
                      ? Math.round((answeredCount / activeExam.questions.length) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* POST-EXAM SCORE & ANALYTICS DASHBOARD */}
          {isSubmitted && (
            <div
              className={cn(
                'rounded-2xl p-4 sm:p-6 border-2 shadow-md space-y-5',
                scoreSummary.passed
                  ? 'bg-emerald-500/10 border-emerald-500/50'
                  : 'bg-rose-500/10 border-rose-500/50'
              )}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  <div
                    className={cn(
                      'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 shadow-sm',
                      scoreSummary.passed
                        ? 'bg-emerald-500 text-[#020617]'
                        : 'bg-rose-500 text-[#ffffff]'
                    )}
                  >
                    <span className="text-xl sm:text-2xl">{scoreSummary.percent}%</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-90">
                      {scoreSummary.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-extrabold text-slate-100">
                      {scoreSummary.passed
                        ? 'Chúc mừng! Bạn đã vượt qua bài kiểm tra sát hạch!'
                        : 'Cần củng cố thêm! Xem chi tiết giải thích từng câu bên dưới.'}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300 mt-1">
                      <span className="font-bold text-emerald-300">
                        ✓ Đúng: {scoreSummary.correct} câu
                      </span>
                      <span className="font-bold text-rose-300">
                        ✗ Sai: {scoreSummary.wrong} câu
                      </span>
                      <span className="font-semibold text-amber-300">
                        ○ Bỏ trống: {scoreSummary.unanswered} câu
                      </span>
                      <span className="text-slate-400">
                        ⏱ Thời gian: {formatTime(elapsedSeconds)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post-Exam Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {(scoreSummary.wrong > 0 || scoreSummary.unanswered > 0) && (
                    <button
                      type="button"
                      onClick={handleRetryWrongQuestions}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-[#ffffff] font-bold text-xs shadow-sm transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      <span>
                        Làm lại {scoreSummary.wrong + scoreSummary.unanswered} câu sai / bỏ trống
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetCurrentExam}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Làm lại toàn bộ đề</span>
                  </button>
                </div>
              </div>

              {/* Category Breakdown */}
              {scoreSummary.byCategory.length > 0 && (
                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>Phân tích Độ chính xác theo Chuyên đề (Category)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {scoreSummary.byCategory.map((cat) => (
                      <div
                        key={cat.name}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                          <span className="truncate pr-2">{cat.name}</span>
                          <span
                            className={
                              cat.percent >= 75 ? 'text-emerald-400' : 'text-rose-400'
                            }
                          >
                            {cat.correct}/{cat.total} ({cat.percent}%)
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={cn(
                              'h-full',
                              cat.percent >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                            )}
                            style={{ width: `${cat.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Review Questions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Lọc xem lại:</span>
                </span>
                {(
                  [
                    { id: 'all', label: `Tất cả (${activeExam.questions.length})` },
                    { id: 'wrong', label: `Câu làm sai (${scoreSummary.wrong})` },
                    { id: 'unanswered', label: `Bỏ trống (${scoreSummary.unanswered})` },
                    { id: 'correct', label: `Câu làm đúng (${scoreSummary.correct})` },
                    { id: 'flagged', label: `Đã đánh dấu (${flaggedCount})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setReviewFilter(tab.id);
                      setCurrentQuestionIdx(0);
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                      reviewFilter === tab.id
                        ? 'bg-emerald-500 text-[#020617] border-emerald-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MAIN 2-COLUMN EXAM WORKSPACE (Questions Left + Question Map Palette Right on Desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left/Main Column: Question Card(s) */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-5">
              {displayedQuestions.length === 0 ? (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center space-y-3">
                  <p className="text-sm font-bold text-slate-300">
                    Không có câu hỏi nào trong bộ lọc xem lại này.
                  </p>
                  <button
                    type="button"
                    onClick={() => setReviewFilter('all')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-[#020617] text-xs font-extrabold"
                  >
                    Xem toàn bộ câu hỏi
                  </button>
                </div>
              ) : displayMode === 'single' ? (
                renderQuestionCard(
                  currentQuestionEntry.q,
                  currentQuestionEntry.originalIdx
                )
              ) : (
                displayedQuestions.map(({ q, originalIdx }) =>
                  renderQuestionCard(q, originalIdx)
                )
              )}
            </div>

            {/* Right Column on Desktop: Sticky Question Palette & Quick Actions */}
            <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-24 space-y-4">
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 p-4 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    Bảng Điều Hướng Câu Hỏi
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {answeredCount}/{activeExam.questions.length}
                  </span>
                </div>

                {renderQuestionPaletteGrid(false)}

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  {!isSubmitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitExam}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-extrabold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Nộp Bài & Chấm Điểm</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetCurrentExam}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Làm Lại Đề Này</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setStudioTab('custom-builder')}
                    className="w-full py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tạo Đề Khác Theo Level / Tag</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE STICKY BOTTOM BAR (Visible on screens < lg, sits cleanly above MobileBottomNav) */}
          <div className="lg:hidden sticky bottom-0 z-30 -mx-3 px-3 py-2.5 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-lg">
            <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
              {displayMode === 'single' && (
                <button
                  type="button"
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 disabled:opacity-40 text-xs font-bold text-slate-200 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Trước</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setMobilePaletteOpen((prev) => !prev)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Bảng câu hỏi ({answeredCount}/{activeExam.questions.length})
                </span>
                {mobilePaletteOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>

              {displayMode === 'single' && currentQuestionEntry && (
                <button
                  type="button"
                  onClick={() => toggleFlagQuestion(currentQuestionEntry.q.id)}
                  className={cn(
                    'p-2 rounded-xl border',
                    flaggedQuestions[currentQuestionEntry.q.id]
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  )}
                  aria-label="Đánh dấu câu hỏi"
                >
                  <Flag className="w-4 h-4" />
                </button>
              )}

              {displayMode === 'single' &&
              currentQuestionIdx < displayedQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestionIdx((prev) =>
                      Math.min(displayedQuestions.length - 1, prev + 1)
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 text-[#020617] text-xs font-extrabold flex items-center gap-1"
                >
                  <span>Tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : !isSubmitted ? (
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 text-[#020617] text-xs font-extrabold flex items-center gap-1"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Nộp bài</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* MOBILE SLIDE-UP QUESTION PALETTE DRAWER */}
          {mobilePaletteOpen && (
            <div
              onClick={() => setMobilePaletteOpen(false)}
              className="lg:hidden absolute inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 sm:p-5 space-y-4 max-h-[82%] overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-100">
                      Bảng Điều Hướng Câu Hỏi ({answeredCount}/{activeExam.questions.length} đã làm)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Chạm vào số thứ tự câu hỏi để chuyển nhanh tới câu đó
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobilePaletteOpen(false)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {renderQuestionPaletteGrid(true)}

                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  {!isSubmitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitExam}
                      className="flex-1 py-3 rounded-xl bg-emerald-500 text-[#020617] font-extrabold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Nộp Bài & Chấm Điểm Ngay</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetCurrentExam}
                      className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Làm Lại Từ Đầu</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobilePaletteOpen(false);
                      setStudioTab('custom-builder');
                    }}
                    className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 font-bold text-xs"
                  >
                    Đổi đề / Lọc
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Compass, ExternalLink, Layers, SkipForward, Undo2, X } from 'lucide-react';
import { usePmpCurriculum, usePmpLinks } from '../data';
import { buildMindmapUrl } from '../links';
import { gradeQuestion, isQuizSkipped, pmpAllQuestions, quizBest, type QuestionResult } from '../logic';
import { usePmpNav, usePmpProgress } from '../store';
import type { PmpCurriculum, WpQuestion } from '../types';
import { CourseInline } from '@/features/devops-course/components/CourseMarkdown';
import { CourseBar, CourseBtn } from '@/features/devops-course/components/CourseUi';
import { Callout, Spinner } from '@/features/workpath/components/ui';
import { cn } from '@/utils/cn';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = { mode: 'module' | 'review' | 'mix'; moduleId?: string };

export const PmpQuizView: React.FC<Props> = (props) => {
  const { data: cur } = usePmpCurriculum();
  const { data: linksMap } = usePmpLinks();
  const [round, setRound] = useState(0);
  if (!cur) return <Spinner />;
  return (
    <PmpQuizRound
      key={`pmp-${props.mode}-${props.moduleId ?? 'all'}-${round}`}
      {...props}
      cur={cur}
      linksMap={linksMap ?? {}}
      onRestart={() => setRound((r) => r + 1)}
    />
  );
};

const PmpQuizRound: React.FC<
  Props & {
    cur: PmpCurriculum;
    linksMap: Record<string, import('../types').PmpMindmapLink>;
    onRestart: () => void;
  }
> = ({
  mode,
  moduleId,
  cur,
  linksMap,
  onRestart,
}) => {
  const s = usePmpProgress((x) => x.state);
  const record = usePmpProgress((x) => x.recordQuiz);
  const toggleSkipQuiz = usePmpProgress((x) => x.toggleSkipQuiz);
  const { go, back } = usePmpNav();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<{
    items: Map<string, QuestionResult>;
    correct: number;
    total: number;
    xp: number;
    recordNew: boolean;
  } | null>(null);

  const { title, questions } = useMemo(() => {
    if (mode === 'module') {
      const m = cur.modules.find((x) => x.id === moduleId);
      return {
        title: m ? `Tự kiểm tra ${m.id} · ${m.title}` : 'Tự kiểm tra tư duy PMP',
        questions: shuffle(m?.quiz ?? []),
      };
    }
    if (mode === 'review') {
      const map = pmpAllQuestions(cur);
      return {
        title: 'Ôn lại các câu tình huống từng trả lời sai',
        questions: s.quizWrong.map((id) => map.get(id)).filter((q): q is WpQuestion => Boolean(q)),
      };
    }
    const readPool = cur.modules.filter((m) => m.id in s.lessons).flatMap((m) => m.quiz);
    const pool = readPool.length ? readPool : cur.modules.slice(0, 3).flatMap((m) => m.quiz);
    return { title: 'Quiz trộn tổng hợp tư duy PMP', questions: shuffle(pool).slice(0, 15) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!questions.length) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-3 text-xl font-bold text-white">{title}</h1>
        <Callout tone="ok">
          {mode === 'review'
            ? 'Tuyệt vời! Bạn không còn câu tình huống nào trong danh sách chọn nhầm 🎉'
            : 'Chưa có câu hỏi nào khả dụng.'}
        </Callout>
        <CourseBtn accent="amber" className="mt-4" onClick={back}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </CourseBtn>
      </div>
    );
  }

  const submit = () => {
    const items = new Map<string, QuestionResult>();
    for (const q of questions) items.set(q.id, gradeQuestion(q, answers[q.id] ?? null));
    const list = [...items.values()];
    const correct = list.filter((r) => r.ok).length;
    const total = mode === 'module' ? questions.length : list.length;
    const { xp, record: recordNew } = record(mode === 'module' ? (moduleId ?? null) : null, total, list);
    setResult({ items, correct, total, xp, recordNew });
    setTimeout(() => document.getElementById('pmp-quiz-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const passed = result ? result.correct / result.total >= cur.passQuiz : null;
  const wrongNums = result ? questions.map((q, i) => (result.items.get(q.id)?.ok ? 0 : i + 1)).filter(Boolean) : [];
  const activeMod = moduleId ? cur.modules.find((m) => m.id === moduleId) : undefined;
  const moduleMindmapLinks = (activeMod?.evidenceLinkIds ?? [])
    .map((id) => linksMap[id])
    .filter((l): l is import('../types').PmpMindmapLink => Boolean(l))
    .slice(0, 3);

  const practiceRoomUrl = buildMindmapUrl({
    linkId: 'view.practice',
    label: 'Phòng Luyện Tập Tình Huống PMP Mindmap (4.318 câu & 54 bộ đề)',
    kind: 'practice',
    lang: 'vi',
    whyRead: '',
  });
  const panoramaUrl = buildMindmapUrl({
    linkId: 'view.panorama',
    label: 'Panorama 3 Góc nhìn',
    kind: 'panorama',
    lang: 'vi',
    whyRead: '',
  });

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 text-[var(--dts-ink)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CourseBtn accent="amber" onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </CourseBtn>
          <div>
            <h1 className="font-mono text-xl font-extrabold text-[var(--dts-ink)] sm:text-2xl">{title}</h1>
            <p className="text-sm text-[var(--dts-ink-muted)]">
              {questions.length} câu tình huống ngắn · cần đạt ≥ {Math.round(cur.passQuiz * 100)}% để xác nhận nắm vững tư duy
            </p>
          </div>
        </div>
        {mode === 'module' && moduleId && quizBest(s, moduleId) < cur.passQuiz && (
          <CourseBtn
            accent="amber"
            onClick={() => {
              const skipped = toggleSkipQuiz(moduleId);
              if (skipped) go({ name: 'module', id: moduleId });
            }}
          >
            {isQuizSkipped(s, moduleId) ? (
              <>
                <Undo2 className="h-4 w-4" /> Hoàn tác bỏ qua Quiz
              </>
            ) : (
              <>
                <SkipForward className="h-4 w-4" /> Đã nắm vững — Bỏ qua Quiz
              </>
            )}
          </CourseBtn>
        )}
      </div>

      {/* PMP Mindmap Practice & Deep-Link Entry Point Strip */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] px-3.5 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--dts-green-ink)]">
            <Compass className="h-3.5 w-3.5 shrink-0" />
            <span>Mở rộng sang Phòng Luyện Đề PMP Mindmap</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--dts-ink-soft)]">
            Luyện bộ 4.318 câu hỏi &amp; 54 bộ đề (Mini-Test, Domain Test, Full Mock 180 câu) hoặc ôn thuật ngữ PMBOK theo sách.
          </p>
          {moduleMindmapLinks.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {moduleMindmapLinks.map((lnk) => (
                <a
                  key={lnk.linkId}
                  href={buildMindmapUrl(lnk)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-0.5 font-mono text-[10.5px] font-bold text-[var(--dts-ink)] hover:border-[var(--dts-border)]"
                >
                  <span>{lnk.label.split(':')[0]}</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => go({ name: 'flash', moduleId })}
            className="dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[var(--dts-amber-bg)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-amber-ink)] cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Flashcard sách</span>
          </button>
          <a
            href={practiceRoomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[var(--dts-green-bg)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-green-ink)]"
          >
            <span>Phòng Luyện Đề (4.318 câu)</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={panoramaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dts-btn-tactile inline-flex items-center gap-1 rounded-xl bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)]"
          >
            <span>Panorama</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, n) => {
          const r = result?.items.get(q.id);
          const state = !r ? 'idle' : r.ok ? 'ok' : r.skipped ? 'skip' : 'bad';
          const given = answers[q.id];
          return (
            <div
              key={q.id}
              id={`pmp-q-${q.id}`}
              className={cn(
                'rounded-xl border p-4',
                state === 'idle' && 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)]',
                state === 'ok' && 'border-emerald-500/60 bg-[var(--dts-green-soft)]/60',
                (state === 'bad' || state === 'skip') && 'border-rose-500/60 bg-[var(--dts-rose-soft)]/60'
              )}
            >
              <div className="mb-2.5 flex flex-wrap items-start gap-2 font-semibold text-[var(--dts-ink)] leading-relaxed">
                {state !== 'idle' && (
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-extrabold tracking-wide text-white',
                      state === 'ok' ? 'bg-emerald-600' : state === 'skip' ? 'bg-amber-600' : 'bg-rose-600'
                    )}
                  >
                    {state === 'ok' ? (
                      <>
                        <Check className="h-3 w-3" /> CHÍNH XÁC
                      </>
                    ) : state === 'skip' ? (
                      '⚠ BỎ TRỐNG'
                    ) : (
                      <>
                        <X className="h-3 w-3" /> CHƯA ĐÚNG
                      </>
                    )}
                  </span>
                )}
                <span>
                  {n + 1}. <CourseInline text={q.q} accent="amber" />{' '}
                  <span className="font-mono text-xs font-normal text-[var(--dts-ink-muted)]">[{q.id}]</span>
                </span>
              </div>

              {(q.type === 'mc' || q.type === 'tf') && (
                <div className="space-y-1.5">
                  {(q.type === 'mc' ? q.choices : ['Đúng', 'Sai']).map((choice, k) => {
                    const value = q.type === 'mc' ? k : k === 0;
                    const chosen = given === value;
                    const isRight = Boolean(r) && (q.type === 'mc' ? k === r?.rightIndex : value === r?.rightBool);
                    const isWrongPick = Boolean(r) && chosen && !isRight;
                    return (
                      <label
                        key={k}
                        className={cn(
                          'flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                          !r && (chosen ? 'border-amber-500 bg-[var(--dts-amber-soft)]' : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] hover:border-[var(--dts-border)]'),
                          isRight && 'border-emerald-500 bg-[var(--dts-green-soft)]',
                          isWrongPick && 'border-rose-500 bg-[var(--dts-rose-soft)]',
                          r && !isRight && !isWrongPick && 'border-[var(--dts-border-soft)] opacity-60'
                        )}
                      >
                        <input
                          type="radio"
                          name={`pmp-a-${q.id}`}
                          disabled={Boolean(r)}
                          checked={chosen}
                          onChange={() => setAnswers({ ...answers, [q.id]: value })}
                          className="mt-1 accent-amber-500"
                        />
                        <span className="flex-1 text-[var(--dts-ink)] leading-relaxed">
                          <CourseInline text={String(choice)} accent="amber" />
                        </span>
                        {isRight && (
                          <span className="whitespace-nowrap text-xs font-bold text-emerald-500">
                            {chosen ? '✔ Bạn chọn đúng' : '✔ Đáp án PMI'}
                          </span>
                        )}
                        {isWrongPick && <span className="whitespace-nowrap text-xs font-bold text-rose-500">✘ Bạn đã chọn</span>}
                      </label>
                    );
                  })}
                </div>
              )}

              {r?.explain && (
                <div className="mt-3 rounded-lg border border-amber-500/30 bg-[var(--dts-amber-soft)] px-3.5 py-2.5 text-sm text-[var(--dts-amber-ink)] leading-relaxed">
                  💡 <b>Giải thích theo chuẩn PMI:</b> <CourseInline text={r.explain} accent="amber" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!result ? (
        <CourseBtn variant="primary" accent="amber" className="mt-5" onClick={submit}>
          Chấm bài &amp; Xem giải thích
        </CourseBtn>
      ) : (
        <div id="pmp-quiz-result" className="mt-6 space-y-3">
          <Callout tone={passed === false ? 'bad' : 'ok'}>
            <b>
              Đúng {result.correct}/{result.total}
            </b>{' '}
            ({Math.round((result.correct / result.total) * 100)}%) · +{result.xp} XP
            {result.recordNew && ' · 🏆 kỷ lục mới'}
            {mode === 'module' &&
              (passed
                ? ' · Đạt chuẩn tư duy module này! Giờ hãy sang PMP Mindmap xem dẫn chứng & luyện tình huống sâu.'
                : ` · Cần đạt ≥ ${Math.round(cur.passQuiz * 100)}% để qua — hãy đọc kỹ phần giải thích đáp án bên trên rồi thử lại nhé.`)}
            <CourseBar value={result.correct / result.total} accent="amber" className="mt-2" />
            {wrongNums.length > 0 && (
              <div className="mt-2 text-xs">
                Câu cần lưu ý: <b>{wrongNums.join(', ')}</b>
              </div>
            )}
          </Callout>
          <div className="flex flex-wrap gap-2">
            <CourseBtn variant="primary" accent="amber" onClick={onRestart}>
              Làm lại lượt mới
            </CourseBtn>
            <CourseBtn accent="amber" onClick={() => go({ name: 'quiz', mode: 'review' })}>
              Ôn câu từng sai
            </CourseBtn>
            {moduleId && (
              <CourseBtn accent="amber" onClick={() => go({ name: 'module', id: moduleId })}>
                Về module &amp; mở dẫn chứng Mindmap
              </CourseBtn>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

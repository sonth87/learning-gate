import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, Play, RotateCcw, Eye, SkipForward, Undo2 } from 'lucide-react';
import { useCatalog, useCurriculum } from '../data';
import { exStatus } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import { gradeCode, runCode, usePyStatus, warmUp } from '../engine/pyEngine';
import type { GradeResult, RunResult } from '../types';
import { CodeView, Inline, Markdown } from '../components/Markdown';
import { PyCodeEditor, type PyCodeEditorHandle } from '../components/PyCodeEditor';
import { GradeOutput, RunOutput } from '../components/RunOutput';
import { Btn, Callout, Pill, Spinner, Stars } from '../components/ui';

type Output = { kind: 'run'; result: RunResult } | { kind: 'grade'; result: GradeResult; passed: number; total: number; ok: boolean; xp: number; first: boolean; attempts: number };

export const ExerciseView: React.FC<{ code: string }> = ({ code: exCode }) => {
  const { data: cur } = useCurriculum();
  const { data: cat } = useCatalog();
  const { go, back } = useWpNav();
  const s = useWpProgress((x) => x.state);
  const { saveCode, recordCheck, revealHint, viewSolution, resetExercise, toggleSkipExercise } = useWpProgress.getState();
  const py = usePyStatus();

  const ex = useMemo(() => cur?.modules.flatMap((m) => m.exercises).find((e) => e.code === exCode || e.id === exCode), [cur, exCode]);
  const rec = ex ? s.exercises[ex.id] : undefined;

  const [text, setText] = useState('');
  const [stdin, setStdin] = useState('');
  const [busy, setBusy] = useState<'run' | 'check' | null>(null);
  const [out, setOut] = useState<Output | null>(null);
  const [solution, setSolution] = useState<'hidden' | 'locked' | 'shown'>('hidden');
  const [error, setError] = useState<string | null>(null);
  const editor = useRef<PyCodeEditorHandle>(null);
  const loadedFor = useRef<string | null>(null);
  const latestDraftRef = useRef<{ exId: string; text: string; starter: string } | null>(null);

  // Nạp code đã lưu (hoặc code khởi đầu) khi đổi bài
  useEffect(() => {
    if (!ex || loadedFor.current === ex.id) return;
    loadedFor.current = ex.id;
    const initialText = useWpProgress.getState().state.exercises[ex.id]?.code ?? ex.starter;
    setText(initialText);
    latestDraftRef.current = { exId: ex.id, text: initialText, starter: ex.starter };
    setOut(null);
    setSolution('hidden');
    setError(null);
    warmUp();
  }, [ex]);

  // Tự lưu bản nháp sau 250 ms không gõ & tự flush khi rời bài / đóng tab
  useEffect(() => {
    if (!ex || loadedFor.current !== ex.id) return;
    latestDraftRef.current = { exId: ex.id, text, starter: ex.starter };
    const saved = useWpProgress.getState().state.exercises[ex.id]?.code ?? ex.starter;
    if (text === saved) return;
    const t = setTimeout(() => saveCode(ex.id, text), 250);
    return () => clearTimeout(t);
  }, [text, ex, saveCode]);

  useEffect(() => {
    const flushDraft = () => {
      const snap = latestDraftRef.current;
      if (!snap) return;
      const saved = useWpProgress.getState().state.exercises[snap.exId]?.code ?? snap.starter;
      if (snap.text !== saved) {
        useWpProgress.getState().saveCode(snap.exId, snap.text);
      }
    };
    window.addEventListener('pagehide', flushDraft);
    return () => {
      window.removeEventListener('pagehide', flushDraft);
      flushDraft();
    };
  }, []);

  if (!cur) return <Spinner />;
  if (!ex) return <div className="p-6 text-slate-400">Không tìm thấy bài tập {exCode}.</div>;
  const status = exStatus(s, ex.id);
  const refItem = ex.ref && cat ? cat.items.find((i) => i.path === ex.ref) : undefined;
  const mod = cur.modules.find((m) => m.id === ex.module)!;
  const idx = mod.exercises.findIndex((e) => e.id === ex.id);
  const nextEx = mod.exercises[idx + 1];

  const run = async () => {
    setBusy('run');
    setError(null);
    try {
      setOut({ kind: 'run', result: await runCode(text, stdin) });
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
    setBusy(null);
  };

  const check = async () => {
    setBusy('check');
    setError(null);
    try {
      const result = await gradeCode(text, ex.tests);
      const passed = result.tests.filter((t) => t.status === 'pass').length;
      const total = result.tests.length;
      const ok = !result.timedOut && !result.import_error && total > 0 && passed === total;
      const r = recordCheck(ex.id, passed, total, ok, text);
      setOut({ kind: 'grade', result, passed, total, ok, ...r });
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
    setBusy(null);
  };

  const showSolution = (force = false) => {
    if (status !== 'passed' && (rec?.attempts ?? 0) < 3 && !force) return setSolution('locked');
    viewSolution(ex.id);
    setSolution('shown');
  };

  const hintsShown = rec?.hints ?? 0;

  return (
    <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Btn onClick={back}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Btn>
        <div className="min-w-0">
          <div className="text-xs text-slate-500">
            {mod.id} · {mod.title}
          </div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            <span className="font-mono text-emerald-400">{ex.code}</span> · {ex.title}
          </h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Stars n={ex.difficulty} />
          <Pill tone={status === 'passed' ? 'ok' : status === 'skipped' ? 'info' : status === 'started' ? 'warn' : 'neutral'}>
            {status === 'passed' ? 'đã đạt' : status === 'skipped' ? 'đã bỏ qua' : status === 'started' ? 'đang làm' : 'chưa làm'}
          </Pill>
          {status !== 'passed' && (
            <Btn onClick={() => toggleSkipExercise(ex.id)}>
              {status === 'skipped' ? (
                <>
                  <Undo2 className="h-3.5 w-3.5" /> Hoàn tác bỏ qua
                </>
              ) : (
                <>
                  <SkipForward className="h-3.5 w-3.5" /> Bỏ qua bài này
                </>
              )}
            </Btn>
          )}
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* ------- đề bài ------- */}
        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
            <Markdown source={ex.prompt} />
            {ex.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{ex.tags.map((t) => <Pill key={t}>{t}</Pill>)}</div>}
            {refItem && (
              <p className="mt-3 text-sm text-slate-400">
                📖 Liên quan trong Python-master:{' '}
                <button className="text-sky-400 underline underline-offset-2" onClick={() => go({ name: 'read', n: refItem.n })}>
                  {ex.ref}
                </button>
              </p>
            )}
          </div>

          {!ex.webGrade && (
            <Callout tone="warn">
              Bài này dùng thread/asyncio nên <b>không chấm được trong trình duyệt</b>. Hãy làm trong VS Code và chấm bằng WorkPath:{' '}
              <code className="rounded bg-slate-800 px-1.5 py-0.5">./learn ex check {ex.code}</code>
            </Callout>
          )}

          {hintsShown > 0 && (
            <div className="space-y-2">
              {ex.hints.slice(0, hintsShown).map((h, i) => (
                <Callout key={i} tone="warn">
                  💡 <b>Gợi ý {i + 1}/{ex.hints.length}:</b> <Inline text={h} />
                </Callout>
              ))}
            </div>
          )}

          {solution === 'locked' && (
            <Callout tone="warn">
              Bạn mới chấm {rec?.attempts ?? 0} lần. Hãy thử ít nhất 3 lần — hoặc{' '}
              <button className="underline" onClick={() => showSolution(true)}>
                xem luôn (XP khi đạt chỉ còn 10)
              </button>
              .
            </Callout>
          )}
          {solution === 'shown' && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-white">Lời giải mẫu</h3>
              <CodeView code={ex.solution} numbered />
            </div>
          )}
        </div>

        {/* ------- soạn code ------- */}
        <div className="min-w-0 space-y-3 lg:sticky lg:top-3">
          {status === 'skipped' && (
            <Callout tone="info" className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Bạn đã đánh dấu <b>bỏ qua</b> bài này (vẫn có thể làm và bấm Chấm bài bất kỳ lúc nào để nhận đủ XP).
              </span>
              {nextEx ? (
                <Btn variant="primary" onClick={() => go({ name: 'exercise', code: nextEx.code })}>
                  Sang bài tiếp: {nextEx.code} <ArrowRight className="h-3.5 w-3.5" />
                </Btn>
              ) : (
                <Btn variant="primary" onClick={() => go({ name: 'module', id: mod.id })}>
                  Về module {mod.id}
                </Btn>
              )}
            </Callout>
          )}
          <PyCodeEditor ref={editor} value={text} onChange={setText} onRun={run} onSubmit={ex.webGrade ? check : undefined} />
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" onClick={check} disabled={!!busy || !ex.webGrade}>
              <CheckCircle2 className="h-4 w-4" /> {busy === 'check' ? 'Đang chấm…' : 'Chấm bài'} <kbd className="ml-1 hidden rounded bg-black/20 px-1 text-[10px] sm:inline">⌘↵</kbd>
            </Btn>
            <Btn onClick={run} disabled={!!busy}>
              <Play className="h-4 w-4" /> {busy === 'run' ? 'Đang chạy…' : 'Chạy thử'} <kbd className="ml-1 hidden rounded bg-black/30 px-1 text-[10px] sm:inline">⇧↵</kbd>
            </Btn>
            <Btn onClick={() => (ex.hints.length ? revealHint(ex.id, ex.hints.length) : undefined)} disabled={!ex.hints.length || hintsShown >= ex.hints.length}>
              <Lightbulb className="h-4 w-4" /> Gợi ý ({hintsShown}/{ex.hints.length})
            </Btn>
            <Btn onClick={() => showSolution()}>
              <Eye className="h-4 w-4" /> Lời giải
            </Btn>
            <Btn
              onClick={() => {
                if (confirm('Làm lại từ code khởi đầu? Bài đang viết sẽ bị thay.')) {
                  resetExercise(ex.id);
                  setText(ex.starter);
                  setOut(null);
                }
              }}
            >
              <RotateCcw className="h-4 w-4" /> Đặt lại
            </Btn>
          </div>

          <details className="text-sm text-slate-400">
            <summary className="cursor-pointer text-sky-400">
              Dữ liệu nhập cho <code>input()</code> (mỗi dòng một giá trị)
            </summary>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder={'Ví dụ:\nAn\n20'}
              className="mt-2 min-h-[56px] w-full rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-[13px] text-slate-200 outline-none focus:border-emerald-500/70"
            />
          </details>

          {!py.ready && (busy || py.text) && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
              {py.text || 'Đang khởi động Python…'}
            </div>
          )}
          {error && <Callout tone="bad">{error}</Callout>}

          {out?.kind === 'run' && <RunOutput result={out.result} onGoto={(n) => editor.current?.gotoLine(n)} />}
          {out?.kind === 'grade' && (
            <div className="space-y-3">
              <Callout tone={out.ok ? 'ok' : 'warn'}>
                <b>
                  Đạt {out.passed}/{out.total}
                </b>
                {out.ok ? (out.first ? ` 🎉 +${out.xp} XP (lần chấm thứ ${out.attempts})` : ' · vẫn đạt') : ' · sửa code rồi chấm lại'}
              </Callout>
              <GradeOutput result={out.result} />
              {out.ok && (
                <div className="flex flex-wrap gap-2">
                  <Btn onClick={() => showSolution()}>Xem lời giải mẫu để so sánh</Btn>
                  {nextEx ? (
                    <Btn variant="primary" onClick={() => go({ name: 'exercise', code: nextEx.code })}>
                      Bài tiếp theo: {nextEx.code}
                    </Btn>
                  ) : (
                    <Btn variant="primary" onClick={() => go({ name: 'module', id: mod.id })}>
                      Về module {mod.id}
                    </Btn>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

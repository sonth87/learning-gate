import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  Lightbulb,
  Play,
  RotateCcw,
  SkipForward,
  Terminal as TerminalIcon,
  Undo2,
} from 'lucide-react';
import { useCourseCatalog, useCourseCurriculum } from '../data';
import { exStatus } from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import { dryRunExercise, executeDiagnosticCommand, gradeDevOpsExercise } from '../engine/gradeEngine';
import type { GradeResult, RunResult, SimWorldState } from '../types';
import { ConfigCodeView, CourseInline, CourseMarkdown } from '../components/CourseMarkdown';
import { ConfigCodeEditor, type ConfigCodeEditorHandle } from '../components/ConfigCodeEditor';
import { CourseBtn, CourseGradeOutput, CourseRunOutput } from '../components/CourseUi';
import { Callout, Pill, Spinner, Stars } from '@/features/workpath/components/ui';
import { cn } from '@/utils/cn';

type Output =
  | { kind: 'run'; result: RunResult }
  | {
      kind: 'grade';
      result: GradeResult;
      passed: number;
      total: number;
      ok: boolean;
      xp: number;
      first: boolean;
      attempts: number;
    };

export const ExerciseView: React.FC<{ code: string }> = ({ code: exCode }) => {
  const { courseId, accent } = useCourseMeta();
  const { data: cur } = useCourseCurriculum(courseId);
  const { data: cat } = useCourseCatalog(courseId);
  const progressStore = COURSE_PROGRESS_STORES[courseId];
  const { go, back } = COURSE_NAV_STORES[courseId]();
  const s = progressStore((x) => x.state);

  const ex = useMemo(
    () => cur?.modules.flatMap((m) => m.exercises).find((e) => e.code === exCode || e.id === exCode),
    [cur, exCode]
  );
  const rec = ex ? s.exercises[ex.id] : undefined;

  const [text, setText] = useState('');
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [out, setOut] = useState<Output | null>(null);
  const [solution, setSolution] = useState<'hidden' | 'locked' | 'shown'>('hidden');
  const [diagCmd, setDiagCmd] = useState('');
  const [diagWorld, setDiagWorld] = useState<SimWorldState | null>(null);
  const [diagLogs, setDiagLogs] = useState<{ cmd: string; out: string; isErr?: boolean }[]>([]);

  const editor = useRef<ConfigCodeEditorHandle>(null);
  const loadedFor = useRef<string | null>(null);
  const latestDraftRef = useRef<{ exId: string; text: string; starter: string } | null>(null);

  useEffect(() => {
    if (!ex || loadedFor.current === ex.id) return;
    loadedFor.current = ex.id;
    const initialText = progressStore.getState().state.exercises[ex.id]?.code ?? ex.starter;
    setText(initialText);
    latestDraftRef.current = { exId: ex.id, text: initialText, starter: ex.starter };
    setErrorLine(null);
    setOut(null);
    setSolution('hidden');
    setDiagCmd('');
    setDiagLogs([]);
    if (ex.spec.kind === 'troubleshoot' || ex.spec.kind === 'cli') {
      setDiagWorld(structuredClone(ex.spec.initialState));
    } else {
      setDiagWorld(null);
    }
  }, [ex, progressStore]);

  useEffect(() => {
    if (!ex || loadedFor.current !== ex.id) return;
    latestDraftRef.current = { exId: ex.id, text, starter: ex.starter };
    const saved = progressStore.getState().state.exercises[ex.id]?.code ?? ex.starter;
    if (text === saved) return;
    const t = setTimeout(() => progressStore.getState().saveCode(ex.id, text), 250);
    return () => clearTimeout(t);
  }, [text, ex, progressStore]);

  // Đảm bảo gõ xong rồi rời trang / đóng tab ngay lập tức vẫn lưu kịp bản nháp
  useEffect(() => {
    const flushDraft = () => {
      const snap = latestDraftRef.current;
      if (!snap) return;
      const saved = progressStore.getState().state.exercises[snap.exId]?.code ?? snap.starter;
      if (snap.text !== saved) {
        progressStore.getState().saveCode(snap.exId, snap.text);
      }
    };
    window.addEventListener('pagehide', flushDraft);
    return () => {
      window.removeEventListener('pagehide', flushDraft);
      flushDraft();
    };
  }, [progressStore]);

  if (!cur) return <Spinner />;
  if (!ex) return <div className="p-6 text-slate-400">Không tìm thấy bài thực hành {exCode}.</div>;

  const status = exStatus(s, ex.id);
  const refItem = ex.ref && cat ? cat.items.find((i) => i.path === ex.ref) : undefined;
  const mod = cur.modules.find((m) => m.id === ex.module)!;
  const idx = mod.exercises.findIndex((e) => e.id === ex.id);
  const nextEx = mod.exercises[idx + 1];
  const hintsShown = rec?.hints ?? 0;
  const codeTone = accent === 'cyan' ? 'text-cyan-400' : accent === 'rose' ? 'text-rose-400' : 'text-sky-400';

  const run = () => {
    const res = dryRunExercise(text, ex.spec);
    const lm = res.stderr.match(/dòng (\d+)|line (\d+)/i);
    setErrorLine(lm ? Number(lm[1] ?? lm[2]) : null);
    setOut({ kind: 'run', result: res });
  };

  const check = () => {
    const diagHistoryText = diagLogs.map((d) => `$ ${d.cmd}\n${d.out}`).join('\n');
    const result = gradeDevOpsExercise(text, ex.spec, diagHistoryText);
    setErrorLine(result.errorLine ?? null);
    const passed = result.tests.filter((t) => t.status === 'pass').length;
    const total = result.tests.length;
    const ok = !result.timedOut && !result.import_error && total > 0 && passed === total;
    const r = progressStore.getState().recordCheck(ex.id, passed, total, ok, text);
    setOut({ kind: 'grade', result, passed, total, ok, ...r });
  };

  const showSolution = (force = false) => {
    if (status !== 'passed' && (rec?.attempts ?? 0) < 3 && !force) return setSolution('locked');
    progressStore.getState().viewSolution(ex.id);
    setSolution('shown');
  };

  const runDiag = (rawCmd?: string) => {
    const c = (rawCmd ?? diagCmd).trim();
    if (!c || !diagWorld) return;
    const res = executeDiagnosticCommand(c, diagWorld);
    setDiagWorld(res.nextState);
    setDiagLogs((prev) => [
      ...prev,
      {
        cmd: c,
        out: [res.stdout, res.stderr].filter(Boolean).join('\n') || '(hoàn tất, không có output)',
        isErr: res.exitCode !== 0,
      },
    ]);
    if (!rawCmd) setDiagCmd('');
  };

  const hasDiagnosticPanel = ex.spec.kind === 'troubleshoot';

  return (
    <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
      <div className="mb-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CourseBtn accent={accent} onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </CourseBtn>
          <div className="flex flex-wrap items-center gap-2">
            <Stars n={ex.difficulty} />
            <Pill
              tone={
                status === 'passed'
                  ? 'ok'
                  : status === 'skipped'
                    ? 'info'
                    : status === 'started'
                      ? 'warn'
                      : 'neutral'
              }
            >
              {status === 'passed'
                ? 'đã đạt'
                : status === 'skipped'
                  ? 'đã bỏ qua'
                  : status === 'started'
                    ? 'đang làm'
                    : 'chưa làm'}
            </Pill>
            {status !== 'passed' && (
              <CourseBtn
                accent={accent}
                onClick={() => progressStore.getState().toggleSkipExercise(ex.id)}
                title={
                  status === 'skipped'
                    ? 'Khôi phục bài thực hành này về trạng thái chưa hoàn thành'
                    : 'Đánh dấu bỏ qua nếu bạn đã làm hoặc đã nắm vững phần này'
                }
              >
                {status === 'skipped' ? (
                  <>
                    <Undo2 className="h-3.5 w-3.5" /> Hoàn tác bỏ qua
                  </>
                ) : (
                  <>
                    <SkipForward className="h-3.5 w-3.5" /> Bỏ qua bài này
                  </>
                )}
              </CourseBtn>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500">
            {mod.id} · {mod.title}
          </div>
          <h1 className="break-words text-xl font-bold text-white sm:text-2xl">
            <span className={cn('font-mono', codeTone)}>{ex.code}</span> · {ex.title}
          </h1>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* ------- Đề bài & Khung khám bệnh ------- */}
        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
            <CourseMarkdown source={ex.prompt} accent={accent} />
            {ex.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ex.tags.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </div>
            )}
            {refItem && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
                <span>📖 Cấu hình thực tế liên quan:</span>
                <button
                  type="button"
                  className="inline-flex min-h-[44px] items-center rounded-lg px-2 text-sky-400 underline underline-offset-2 hover:bg-slate-800/60 cursor-pointer"
                  onClick={() => go({ name: 'read', n: refItem.n })}
                >
                  {ex.ref}
                </button>
              </div>
            )}
          </div>

          {hasDiagnosticPanel && diagWorld && (
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-3.5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <TerminalIcon className="h-4 w-4" aria-hidden="true" /> Terminal chẩn đoán trạng thái lỗi
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (ex.spec.kind === 'troubleshoot') {
                      setDiagWorld(structuredClone(ex.spec.initialState));
                      setDiagLogs([]);
                    }
                  }}
                  className="inline-flex min-h-[44px] sm:min-h-0 items-center px-2 text-xs text-slate-400 underline hover:text-slate-200 cursor-pointer"
                >
                  Đặt lại cụm
                </button>
              </div>
              {ex.spec.kind === 'troubleshoot' && ex.spec.diagnosticSampleCommands && ex.spec.diagnosticSampleCommands.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {ex.spec.diagnosticSampleCommands.map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => runDiag(sc)}
                      className="min-h-[44px] sm:min-h-[36px] rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-sky-300 hover:bg-slate-800 cursor-pointer"
                    >
                      $ {sc}
                    </button>
                  ))}
                </div>
              )}
              {diagLogs.length > 0 && (
                <div className="mb-2 max-h-56 space-y-2 overflow-auto rounded-lg border border-slate-800 bg-slate-900/70 p-2.5 font-mono text-xs">
                  {diagLogs.map((l, idx) => (
                    <div key={idx}>
                      <div className="font-semibold text-emerald-400">$ {l.cmd}</div>
                      <pre className={cn('whitespace-pre-wrap break-words', l.isErr ? 'text-rose-300' : 'text-slate-200')}>
                        {l.out}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runDiag();
                }}
                className="flex gap-2"
              >
                <input
                  value={diagCmd}
                  onChange={(e) => setDiagCmd(e.target.value)}
                  placeholder="Gõ lệnh khám bệnh (vd: kubectl get pods, kubectl describe pod ...)"
                  aria-label="Lệnh chẩn đoán"
                  className="min-h-[44px] sm:min-h-[36px] min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 font-mono text-xs text-slate-100 outline-none focus:border-sky-500/70"
                />
                <CourseBtn type="submit" accent={accent}>
                  Chạy
                </CourseBtn>
              </form>
            </div>
          )}

          {hintsShown > 0 && (
            <div className="space-y-2">
              {ex.hints.slice(0, hintsShown).map((h, i) => (
                <Callout key={i} tone="warn">
                  💡 <b>Gợi ý {i + 1}/{ex.hints.length}:</b> <CourseInline text={h} accent={accent} />
                </Callout>
              ))}
            </div>
          )}

          {solution === 'locked' && (
            <Callout tone="warn">
              Bạn mới chấm {rec?.attempts ?? 0} lần. Hãy tự thử ít nhất 3 lần — hoặc{' '}
              <button type="button" className="underline cursor-pointer" onClick={() => showSolution(true)}>
                xem lời giải luôn (XP khi đạt chỉ còn 10)
              </button>
              .
            </Callout>
          )}
          {solution === 'shown' && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-white">Lời giải mẫu</h3>
              <ConfigCodeView code={ex.solution} language={ex.language} numbered />
            </div>
          )}
        </div>

        {/* ------- Trình soạn cấu hình / lệnh ------- */}
        <div className="min-w-0 space-y-3 lg:sticky lg:top-3">
          {status === 'skipped' && (
            <Callout tone="info" className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Bạn đã đánh dấu <b>bỏ qua</b> bài này (vẫn có thể làm và bấm Chấm bài bất kỳ lúc nào để nhận đủ XP).
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {nextEx ? (
                  <CourseBtn variant="primary" accent={accent} onClick={() => go({ name: 'exercise', code: nextEx.code })}>
                    Sang bài tiếp: {nextEx.code} <ArrowRight className="h-3.5 w-3.5" />
                  </CourseBtn>
                ) : (
                  <CourseBtn variant="primary" accent={accent} onClick={() => go({ name: 'module', id: mod.id })}>
                    Về module {mod.id}
                  </CourseBtn>
                )}
              </div>
            </Callout>
          )}

          <ConfigCodeEditor
            ref={editor}
            value={text}
            onChange={(v) => {
              setText(v);
              if (errorLine !== null) setErrorLine(null);
            }}
            language={ex.language}
            accent={accent}
            errorLine={errorLine}
            filename={ex.filename}
            onRun={run}
            onSubmit={ex.webGrade ? check : undefined}
          />
          <div className="flex flex-wrap gap-2">
            <CourseBtn variant="primary" accent={accent} onClick={check} disabled={!ex.webGrade}>
              <CheckCircle2 className="h-4 w-4" /> Chấm bài{' '}
              <kbd className="ml-1 hidden rounded bg-black/20 px-1 text-[10px] sm:inline">⌘↵</kbd>
            </CourseBtn>
            <CourseBtn accent={accent} onClick={run}>
              <Play className="h-4 w-4" />{' '}
              {ex.language === 'shell' || ex.language === 'redis' ? 'Chạy thử' : 'Kiểm tra cú pháp'}{' '}
              <kbd className="ml-1 hidden rounded bg-black/30 px-1 text-[10px] sm:inline">⇧↵</kbd>
            </CourseBtn>
            <CourseBtn
              accent={accent}
              onClick={() => (ex.hints.length ? progressStore.getState().revealHint(ex.id, ex.hints.length) : undefined)}
              disabled={!ex.hints.length || hintsShown >= ex.hints.length}
            >
              <Lightbulb className="h-4 w-4" /> Gợi ý ({hintsShown}/{ex.hints.length})
            </CourseBtn>
            <CourseBtn accent={accent} onClick={() => showSolution()}>
              <Eye className="h-4 w-4" /> Lời giải
            </CourseBtn>
            <CourseBtn
              accent={accent}
              onClick={() => {
                progressStore.getState().resetExercise(ex.id);
                setText(ex.starter);
                setErrorLine(null);
                setOut(null);
              }}
            >
              <RotateCcw className="h-4 w-4" /> Đặt lại
            </CourseBtn>
          </div>

          {out?.kind === 'run' && (
            <CourseRunOutput result={out.result} accent={accent} onGoto={(n) => editor.current?.gotoLine(n)} />
          )}
          {out?.kind === 'grade' && (
            <div className="space-y-3">
              <Callout tone={out.ok ? 'ok' : 'warn'}>
                <b>
                  Đạt {out.passed}/{out.total} kiểm tra
                </b>
                {out.ok
                  ? out.first
                    ? ` 🎉 +${out.xp} XP (lần chấm thứ ${out.attempts})`
                    : ' · vẫn đạt'
                  : ' · xem chi tiết điều kiện chưa thoả bên dưới rồi chấm lại'}
              </Callout>
              <CourseGradeOutput result={out.result} accent={accent} onGoto={(n) => editor.current?.gotoLine(n)} />
              {out.ok && (
                <div className="flex flex-wrap gap-2">
                  <CourseBtn accent={accent} onClick={() => showSolution(true)}>
                    Xem lời giải mẫu để đối chiếu
                  </CourseBtn>
                  {nextEx ? (
                    <CourseBtn variant="primary" accent={accent} onClick={() => go({ name: 'exercise', code: nextEx.code })}>
                      Bài tiếp theo: {nextEx.code}
                    </CourseBtn>
                  ) : (
                    <CourseBtn variant="primary" accent={accent} onClick={() => go({ name: 'module', id: mod.id })}>
                      Về module {mod.id}
                    </CourseBtn>
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

import React, { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCurriculum } from '../data';
import { similarity } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import { CodeView } from '../components/Markdown';
import { PyCodeEditor } from '../components/PyCodeEditor';
import { Bar, Btn, Callout, PageHeader, Pill, Spinner } from '../components/ui';
import { cn } from '@/utils/cn';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';

interface DrillResult {
  accuracy: number;
  wpm: number;
  xp: number;
  diffs: { line: number; expected: string; typed: string }[];
}

export const DrillView: React.FC<{ moduleId: string }> = ({ moduleId }) => {
  const { data: cur } = useCurriculum();
  const record = useWpProgress((x) => x.recordDrill);
  const drills = useWpProgress((x) => x.state.drills);
  const back = useWpNav((x) => x.back);
  const lang = useWorkbenchStore((x) => x.language);
  const isEn = lang === 'en';
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, DrillResult>>({});
  const startedAt = useRef<Record<string, number>>({});

  if (!cur) return <Spinner />;
  const m = cur.modules.find((x) => x.id === moduleId);
  if (!m) return null;

  const finish = (id: string, target: string) => {
    const norm = (t: string) => t.split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').trim();
    const got = norm(typed[id] ?? '');
    const want = norm(target);
    const accuracy = similarity(want, got);
    const secs = Math.max(1, (performance.now() - (startedAt.current[id] ?? performance.now())) / 1000);
    const wpm = got.length / 5 / (secs / 60);
    const diffs: DrillResult['diffs'] = [];
    const a = want.split('\n');
    const b = got.split('\n');
    a.forEach((line, i) => {
      if (line !== (b[i] ?? '')) diffs.push({ line: i + 1, expected: line, typed: b[i] ?? '' });
    });
    const xp = record(id, accuracy, wpm);
    setResults({ ...results, [id]: { accuracy, wpm: Math.round(wpm), xp, diffs: diffs.slice(0, 10) } });
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title={isEn ? `Typing Drill · ${m.id}` : `Luyện gõ · ${m.id}`}
        sub={
          isEn
            ? 'Look at the sample on the left and retype it on the right (including indentation). Typing by hand builds muscle memory for syntax — reading alone cannot. Need ≥ 90% accuracy to earn XP.'
            : 'Nhìn mẫu bên trái, gõ lại vào ô bên phải (kể cả thụt lề). Gõ tay giúp ngón tay nhớ cú pháp — đọc không làm được điều đó. Cần ≥ 90% chính xác để nhận XP.'
        }
        right={
          <Btn onClick={back}>
            <ArrowLeft className="h-4 w-4" /> {isEn ? 'Back' : 'Quay lại'}
          </Btn>
        }
      />
      <div className="space-y-8">
        {m.drills.map((d) => {
          const r = results[d.id];
          const best = drills[d.id];
          return (
            <section key={d.id}>
              <h2 className="mb-2 flex flex-wrap items-center gap-2 text-base font-semibold text-white">
                {d.title}
                {best && (
                  <Pill tone="ok">
                    {isEn ? 'best' : 'tốt nhất'} {Math.round(best.bestAcc * 100)}% · {best.bestWpm} WPM
                  </Pill>
                )}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <CodeView code={d.code} numbered className="!my-0" />
                <div>
                  <PyCodeEditor
                    value={typed[d.id] ?? ''}
                    onChange={(v) => {
                      startedAt.current[d.id] ??= performance.now();
                      setTyped({ ...typed, [d.id]: v });
                    }}
                    suggest={false}
                    placeholder={isEn ? 'Retype the code here…' : 'Gõ lại đoạn code ở đây…'}
                    height="clamp(200px, 36vh, 380px)"
                    ariaLabel={isEn ? `Retype: ${d.title}` : `Gõ lại: ${d.title}`}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    {isEn ? (
                      <>
                        IDE-style editor (syntax highlighting, auto-indent, auto-close brackets) but <b>no code suggestions</b>. After <code className="rounded bg-slate-800 px-1">:</code> just press Enter, no need to type indent spaces.
                      </>
                    ) : (
                      <>
                        Trình soạn thảo như IDE (tô màu, tự thụt lề, tự đóng ngoặc) nhưng <b>không gợi ý code</b>. Sau dấu <code className="rounded bg-slate-800 px-1">:</code> chỉ cần Enter, đừng gõ dấu cách thụt lề.
                      </>
                    )}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Btn variant="primary" onClick={() => finish(d.id, d.code)}>
                      {isEn ? 'Check' : 'Chấm'}
                    </Btn>
                    <Btn
                      onClick={() => {
                        setTyped({ ...typed, [d.id]: '' });
                        delete startedAt.current[d.id];
                        const next = { ...results };
                        delete next[d.id];
                        setResults(next);
                      }}
                    >
                      {isEn ? 'Reset' : 'Gõ lại'}
                    </Btn>
                  </div>
                  {r && (
                    <div className="mt-3 space-y-2">
                      <Callout tone={r.accuracy >= 0.9 ? 'ok' : 'warn'}>
                        {isEn ? (
                          <>
                            Accuracy <b>{Math.round(r.accuracy * 100)}%</b> · {r.wpm} WPM{r.xp ? ` · +${r.xp} XP` : ' · need ≥ 90% to earn XP'}
                          </>
                        ) : (
                          <>
                            Chính xác <b>{Math.round(r.accuracy * 100)}%</b> · {r.wpm} WPM{r.xp ? ` · +${r.xp} XP` : ' · cần ≥ 90% để nhận XP'}
                          </>
                        )}
                        <Bar value={r.accuracy} className="mt-2" />
                      </Callout>
                      {r.diffs.map((x) => (
                        <div key={x.line} className={cn('rounded-lg bg-slate-900 p-2 text-xs')}>
                          <div className="text-slate-500">
                            {isEn ? 'Line' : 'Dòng'} {x.line}
                          </div>
                          <div className="font-mono text-emerald-300">
                            {isEn ? 'expected:' : 'mẫu:'} {x.expected || (isEn ? '(empty)' : '(trống)')}
                          </div>
                          <div className="font-mono text-rose-300">
                            {isEn ? 'typed:' : 'bạn gõ:'} {x.typed || (isEn ? '(empty)' : '(trống)')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

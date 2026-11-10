import React, { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCurriculum } from '../data';
import { similarity } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import { CodeView } from '../components/Markdown';
import { Bar, Btn, Callout, PageHeader, Pill, Spinner } from '../components/ui';
import { cn } from '@/utils/cn';

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
        title={`Luyện gõ · ${m.id}`}
        sub="Nhìn mẫu bên trái, gõ lại vào ô bên phải (kể cả thụt lề). Gõ tay giúp ngón tay nhớ cú pháp — đọc không làm được điều đó. Cần ≥ 90% chính xác để nhận XP."
        right={
          <Btn onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
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
                {best && <Pill tone="ok">tốt nhất {Math.round(best.bestAcc * 100)}% · {best.bestWpm} WPM</Pill>}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <CodeView code={d.code} className="!my-0" />
                <div>
                  <textarea
                    value={typed[d.id] ?? ''}
                    onChange={(e) => {
                      startedAt.current[d.id] ??= performance.now();
                      setTyped({ ...typed, [d.id]: e.target.value });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        document.execCommand('insertText', false, '    ');
                      }
                    }}
                    spellCheck={false}
                    autoCapitalize="off"
                    placeholder="Gõ lại đoạn code ở đây…"
                    className="h-56 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-[13.5px] leading-relaxed text-slate-100 outline-none focus:border-emerald-500/70"
                  />
                  <div className="mt-2 flex gap-2">
                    <Btn variant="primary" onClick={() => finish(d.id, d.code)}>
                      Chấm
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
                      Gõ lại
                    </Btn>
                  </div>
                  {r && (
                    <div className="mt-3 space-y-2">
                      <Callout tone={r.accuracy >= 0.9 ? 'ok' : 'warn'}>
                        Chính xác <b>{Math.round(r.accuracy * 100)}%</b> · {r.wpm} WPM{r.xp ? ` · +${r.xp} XP` : ' · cần ≥ 90% để nhận XP'}
                        <Bar value={r.accuracy} className="mt-2" />
                      </Callout>
                      {r.diffs.map((x) => (
                        <div key={x.line} className={cn('rounded-lg bg-slate-900 p-2 text-xs')}>
                          <div className="text-slate-500">Dòng {x.line}</div>
                          <div className="font-mono text-emerald-300">mẫu: {x.expected || '(trống)'}</div>
                          <div className="font-mono text-rose-300">bạn gõ: {x.typed || '(trống)'}</div>
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

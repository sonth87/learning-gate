import React, { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCourseCurriculum } from '../data';
import { similarity } from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import type { EditorLanguage } from '../types';
import { ConfigCodeView } from '../components/CourseMarkdown';
import { ConfigCodeEditor } from '../components/ConfigCodeEditor';
import { CourseBar, CourseBtn } from '../components/CourseUi';
import { Callout, PageHeader, Pill, Spinner } from '@/features/workpath/components/ui';

interface DrillResult {
  accuracy: number;
  wpm: number;
  xp: number;
  diffs: { line: number; expected: string; typed: string }[];
}

function guessDrillLang(code: string): EditorLanguage {
  if (/^(FROM|WORKDIR|COPY|RUN|CMD|ENTRYPOINT|USER|EXPOSE)\b/m.test(code)) return 'dockerfile';
  if (/^(docker |kubectl |git |redis-cli )/m.test(code)) return 'shell';
  if (/^(SET|GET|MSET|HSET|HGET|HEXPIRE|LPUSH|RPUSH|SADD|ZADD|ZRANGE|XADD|XGROUP|XREADGROUP|XPENDING|XACK|MULTI|EXEC|EVAL|SCAN|KEYS|UNLINK|CONFIG|ACL|INFO|SLOWLOG|CLUSTER|PFADD|SETBIT|GEOADD|BF\.)\b/im.test(code)) {
    return 'redis';
  }
  if (/^(maxmemory|maxmemory-policy|appendonly|appendfsync|save|bind|protected-mode|rename-command|user )\b/m.test(code)) {
    return 'redis-conf';
  }
  return 'yaml';
}

export const DrillView: React.FC<{ moduleId: string }> = ({ moduleId }) => {
  const { courseId, accent } = useCourseMeta();
  const { data: cur } = useCourseCurriculum(courseId);
  const record = COURSE_PROGRESS_STORES[courseId]((x) => x.recordDrill);
  const drills = COURSE_PROGRESS_STORES[courseId]((x) => x.state.drills);
  const back = COURSE_NAV_STORES[courseId]((x) => x.back);
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, DrillResult>>({});
  const startedAt = useRef<Record<string, number>>({});

  if (!cur) return <Spinner />;
  const m = cur.modules.find((x) => x.id === moduleId);
  if (!m) return null;

  const finish = (id: string, target: string) => {
    const norm = (t: string) =>
      t
        .split('\n')
        .map((l) => l.replace(/\s+$/, ''))
        .join('\n')
        .trim();
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
        title={`Luyện gõ cấu hình · ${m.id}`}
        sub="Nhìn mẫu bên trái, gõ lại chính xác vào ô bên phải (gồm cả thụt lề 2 dấu cách). Cần ≥ 90% chính xác để nhận XP."
        right={
          <CourseBtn accent={accent} onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </CourseBtn>
        }
      />
      <div className="space-y-8">
        {m.drills.map((d) => {
          const r = results[d.id];
          const best = drills[d.id];
          const lang = guessDrillLang(d.code);
          return (
            <section key={d.id}>
              <h2 className="mb-2 flex flex-wrap items-center gap-2 text-base font-semibold text-white">
                {d.title}
                {best && (
                  <Pill tone="ok">
                    tốt nhất {Math.round(best.bestAcc * 100)}% · {best.bestWpm} WPM
                  </Pill>
                )}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <ConfigCodeView code={d.code} language={lang} numbered className="!my-0" />
                <div>
                  <ConfigCodeEditor
                    value={typed[d.id] ?? ''}
                    onChange={(v) => {
                      startedAt.current[d.id] ??= performance.now();
                      setTyped({ ...typed, [d.id]: v });
                    }}
                    language={lang}
                    accent={accent}
                    placeholder="Gõ lại đoạn cấu hình/lệnh ở đây…"
                    height="clamp(200px, 36vh, 380px)"
                    ariaLabel={`Gõ lại: ${d.title}`}
                  />
                  <div className="mt-2 flex gap-2">
                    <CourseBtn variant="primary" accent={accent} onClick={() => finish(d.id, d.code)}>
                      Chấm độ chính xác
                    </CourseBtn>
                    <CourseBtn
                      accent={accent}
                      onClick={() => {
                        setTyped({ ...typed, [d.id]: '' });
                        delete startedAt.current[d.id];
                        const next = { ...results };
                        delete next[d.id];
                        setResults(next);
                      }}
                    >
                      Gõ lại
                    </CourseBtn>
                  </div>
                  {r && (
                    <div className="mt-3 space-y-2">
                      <Callout tone={r.accuracy >= 0.9 ? 'ok' : 'warn'}>
                        Chính xác <b>{Math.round(r.accuracy * 100)}%</b> · {r.wpm} WPM
                        {r.xp ? ` · +${r.xp} XP` : ' · cần ≥ 90% để nhận XP'}
                        <CourseBar value={r.accuracy} accent={accent} className="mt-2" />
                      </Callout>
                      {r.diffs.map((x) => (
                        <div key={x.line} className="rounded-lg bg-slate-900 p-2 text-xs">
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

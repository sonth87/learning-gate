import React, { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  Code2,
  Container,
  Flame,
  Library,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Star,
  Trophy,
  Workflow,
} from 'lucide-react';
import { useCourseCatalog, useCourseCurriculum } from '../data';
import {
  activeDays,
  addDays,
  catalogStatus,
  courseCurrentLevel,
  courseDueCards,
  courseModuleDone,
  courseNextSteps,
  exStatus,
  isModuleSkipped,
  lessonRead,
  rankOfCourse,
  sortedModules,
  streak,
  todayStr,
} from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import { Card, PageHeader, Spinner } from '@/features/workpath/components/ui';
import { CourseBar } from '../components/CourseUi';
import type { DevOpsAccent, DevOpsModule } from '../types';
import { cn } from '@/utils/cn';

const Stat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  bar?: number;
  accent: DevOpsAccent;
}> = ({ icon, label, value, sub, bar, accent }) => (
  <Card className="relative overflow-hidden">
    <div className="absolute right-3 top-3 text-slate-700">{icon}</div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="mt-0.5 text-2xl font-bold tabular-nums text-white">{value}</div>
    {sub && <div className="text-xs text-slate-400">{sub}</div>}
    {bar !== undefined && <CourseBar value={bar} accent={accent} className="mt-2" />}
  </Card>
);

export const HomeView: React.FC = () => {
  const meta = useCourseMeta();
  const { courseId, accent } = meta;
  const { data: cur } = useCourseCurriculum(courseId);
  const { data: cat } = useCourseCatalog(courseId);
  const s = COURSE_PROGRESS_STORES[courseId]((x) => x.state);
  const applySkipTarget = COURSE_PROGRESS_STORES[courseId]((x) => x.applySkipTarget);
  const go = COURSE_NAV_STORES[courseId]((x) => x.go);

  const heat = useMemo(() => {
    const days = activeDays(s);
    const start = new Date();
    start.setDate(start.getDate() - 7 * 16 + 1);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const cells: { key: string; v: number }[] = [];
    for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const key = todayStr(d);
      cells.push({ key, v: days[key] ?? 0 });
    }
    return cells;
  }, [s]);

  if (!cur) return <Spinner />;
  const mods = sortedModules(cur);
  const level = courseCurrentLevel(s, cur);
  const rank = rankOfCourse(courseId, s.xp);
  const exs = mods.flatMap((m) => m.exercises);
  const modsDone = mods.filter((m) => courseModuleDone(s, m, cur.passQuiz)).length;
  const exPassed = exs.filter((e) => exStatus(s, e.id) === 'passed').length;
  const readDone = cat ? cat.items.filter((i) => ['done', 'rewritten'].includes(catalogStatus(s, i.id))).length : 0;
  const steps = courseNextSteps(s, cur, cat, meta.appTitle);
  const fresh = s.xp === 0 && Object.keys(s.lessons).length === 0;

  const firstBorder = accent === 'cyan' ? 'border-cyan-500/60 ring-1 ring-cyan-500/30' : 'border-sky-500/60 ring-1 ring-sky-500/30';
  const firstBadge = accent === 'cyan' ? 'bg-cyan-500 text-slate-950' : 'bg-sky-500 text-slate-950';
  const stepNumTone = accent === 'cyan' ? 'text-cyan-400' : 'text-sky-400';
  const hoverArrow = accent === 'cyan' ? 'group-hover:text-cyan-400' : 'group-hover:text-sky-400';

  const domainTracks: {
    key: string;
    badge: string;
    title: string;
    subtitle: string;
    borderCls: string;
    badgeCls: string;
    icon: React.ReactNode;
    modules: DevOpsModule[];
  }[] =
    courseId === 'kube'
      ? [
          {
            key: 'docker',
            badge: 'PHẦN 1 · DOCKER (K00 – K06)',
            title: 'Cẩm Nang Trực Quan Docker Engine, Dockerfile & Compose v2',
            subtitle: 'Vòng đời Container, Ports/Env/Logs, Namespaces & cgroups, Layer Cache, Multi-stage Non-root & Compose Healthcheck',
            borderCls: 'border-sky-500/35 bg-sky-500/[0.05]',
            badgeCls: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
            icon: <Container className="h-4 w-4 text-sky-400" aria-hidden="true" />,
            modules: mods.filter((m) => parseInt(m.id.slice(1), 10) <= 6),
          },
          {
            key: 'k8s',
            badge: 'PHẦN 2 · KUBERNETES (K07 – K19)',
            title: 'Cẩm Nang Trực Quan Kiến Trúc Cụm, Mạng, Lưu Trữ & Cứu Hộ K8s',
            subtitle: 'Control Loop, Pod/Deployment, Service/Ingress/Gateway, ConfigMap/Secret, PVC/StatefulSet, Probes, HPA, RBAC & Troubleshoot',
            borderCls: 'border-indigo-500/35 bg-indigo-500/[0.05]',
            badgeCls: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300',
            icon: <Boxes className="h-4 w-4 text-indigo-400" aria-hidden="true" />,
            modules: mods.filter((m) => parseInt(m.id.slice(1), 10) >= 7),
          },
        ]
      : [
          {
            key: 'ci-core',
            badge: 'PHẦN 1 · CI PIPELINE & DAG (C00 – C08)',
            title: 'Cẩm Nang Trực Quan Đường Ống CI, Ephemeral Runner & Tăng Tốc DAG',
            subtitle: 'Exit Codes, 6 Thực thể Pipeline, Trunk-based Git, GitHub Actions v4, Env/Outputs, Matrix, Services, Cache/Artifact & Sharding',
            borderCls: 'border-cyan-500/35 bg-cyan-500/[0.05]',
            badgeCls: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
            icon: <Workflow className="h-4 w-4 text-cyan-400" aria-hidden="true" />,
            modules: mods.filter((m) => parseInt(m.id.slice(1), 10) <= 8),
          },
          {
            key: 'devsecops-gitops',
            badge: 'PHẦN 2 · DEVSECOPS, OIDC & GITOPS (C09 – C17)',
            title: 'Cẩm Nang Trực Quan GitLab CI, Bảo Mật 5 Lớp, Keyless OIDC & ArgoCD',
            subtitle: 'GitLab DAG, Chống Script Injection, Gitleaks/Semgrep/Trivy, OIDC JWT, Environments, Canary Rollback, ArgoCD & Expand-Contract DB',
            borderCls: 'border-emerald-500/35 bg-emerald-500/[0.05]',
            badgeCls: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
            icon: <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />,
            modules: mods.filter((m) => parseInt(m.id.slice(1), 10) >= 9),
          },
        ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title={fresh ? meta.welcomeTitle : 'Chào mừng quay lại lộ trình học'}
        sub={`Cấp độ ${level}: ${cur.levels[String(level)] ?? 'Đã hoàn thành toàn bộ lộ trình'}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          accent={accent}
          icon={<Star className="h-6 w-6" />}
          label="XP · danh hiệu"
          value={s.xp}
          sub={`${rank.name}${rank.toNext ? ` · còn ${rank.toNext} XP lên hạng` : ''}`}
        />
        <Stat accent={accent} icon={<Flame className="h-6 w-6" />} label="Chuỗi ngày học" value={`${streak(s)} ngày`} />
        <Stat
          accent={accent}
          icon={<BookOpen className="h-6 w-6" />}
          label="Module hoàn thành"
          value={`${modsDone}/${mods.length}`}
          bar={mods.length ? modsDone / mods.length : 0}
        />
        <Stat
          accent={accent}
          icon={<Code2 className="h-6 w-6" />}
          label="Bài thực hành đạt"
          value={`${exPassed}/${exs.length}`}
          bar={exs.length ? exPassed / exs.length : 0}
        />
        <Stat
          accent={accent}
          icon={<Library className="h-6 w-6" />}
          label="Cấu hình thật đã đọc"
          value={`${readDone}/${cat?.items.length ?? '…'}`}
          bar={cat && cat.items.length ? readDone / cat.items.length : 0}
        />
      </div>

      {/* Quick Visual Study Sheet Domain Tracks */}
      <section aria-labelledby="visual-tracks">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h2 id="visual-tracks" className="flex items-center gap-2 text-base font-bold text-white">
            <Sparkles className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span>Bản đồ Cẩm nang Lý thuyết Trực quan (Mở nhanh theo nhóm)</span>
          </h2>
          <button
            type="button"
            onClick={() => go({ name: 'roadmap' })}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
          >
            Xem toàn bộ lộ trình →
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {domainTracks.map((track) => (
            <div key={track.key} className={cn('rounded-2xl border p-4 space-y-3', track.borderCls)}>
              <div className="flex items-center justify-between gap-2">
                <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-extrabold', track.badgeCls)}>
                  {track.icon}
                  <span>{track.badge}</span>
                </span>
                <span className="font-mono text-xs text-slate-400">{track.modules.length} bài</span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white leading-snug">{track.title}</h3>
                <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{track.subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {track.modules.map((m) => {
                  const skipped = isModuleSkipped(s, m.id);
                  const done = courseModuleDone(s, m, cur.passQuiz);
                  const read = lessonRead(s, m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => go({ name: 'module', id: m.id })}
                      title={`${m.id} · ${m.title}${skipped ? ' (đã bỏ qua)' : ''}`}
                      className={cn(
                        'inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-left text-xs transition-colors cursor-pointer',
                        skipped
                          ? 'border-sky-500/35 bg-sky-500/10 text-sky-300'
                          : done
                            ? 'border-emerald-500/45 bg-emerald-500/12 text-emerald-300'
                            : read
                              ? 'border-sky-500/40 bg-sky-500/12 text-sky-200'
                              : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-600 hover:text-white'
                      )}
                    >
                      {skipped ? (
                        <SkipForward className="h-3 w-3 shrink-0 text-sky-400" aria-hidden="true" />
                      ) : (
                        done && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" aria-hidden="true" />
                      )}
                      <span className="font-mono font-bold">{m.id}</span>
                      <span className="max-w-[155px] truncate">{m.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="next-steps">
        <h2 id="next-steps" className="mb-2 text-base font-semibold text-white">
          Việc nên làm tiếp
        </h2>
        <div className="space-y-2">
          {steps.map((st, i) => (
            <div
              key={i}
              className={cn(
                'flex min-h-[48px] w-full items-center gap-2 rounded-xl border bg-slate-900/70 px-3 sm:px-4 py-2.5 transition-colors hover:bg-slate-800/85',
                i === 0 ? firstBorder : 'border-slate-800'
              )}
            >
              <button
                type="button"
                onClick={() => go(st.view)}
                className="group flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    i === 0 ? firstBadge : 'bg-slate-800 text-slate-300'
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-slate-100">{st.text}</span>
                <ArrowRight
                  className={cn('h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5', hoverArrow)}
                  aria-hidden="true"
                />
              </button>
              {st.skipTarget && (
                <button
                  type="button"
                  onClick={() => applySkipTarget(st.skipTarget!)}
                  title="Đã làm rồi / đã biết — Bỏ qua bước này để sang phần kế tiếp"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white cursor-pointer"
                >
                  <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Bỏ qua</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {fresh && (
        <Card>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-white">
            <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" /> Cách học trong 5 bước (lặp lại cho mỗi module)
          </h2>
          <ol className="grid gap-2 text-sm text-slate-300 sm:grid-cols-5">
            {meta.stepSteps.map((t, i) => (
              <li key={t} className="rounded-lg bg-slate-800/60 p-2.5">
                <span className={cn('mr-1.5 font-bold', stepNumTone)}>{i + 1}.</span>
                {t}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-slate-400">
            Mọi bài học được trình bày dạng <b>cẩm nang trực quan (sơ đồ luồng, phân tầng, bảng tra cứu, đối chiếu sai/đúng)</b> từ góc nhìn lập trình viên Node.js/npm.
          </p>
        </Card>
      )}

      <section aria-labelledby="heat">
        <h2 id="heat" className="mb-2 text-base font-semibold text-white">
          Hoạt động 16 tuần
        </h2>
        <Card className="overflow-x-auto">
          <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ width: 'max-content' }}>
            {heat.map((c) => (
              <i
                key={c.key}
                title={`${c.key}: ${c.v} XP`}
                className={cn(
                  'block h-3 w-3 rounded-sm',
                  c.v === 0
                    ? 'bg-slate-800'
                    : accent === 'cyan'
                      ? c.v < 15
                        ? 'bg-cyan-900'
                        : c.v < 50
                          ? 'bg-cyan-700'
                          : c.v < 100
                            ? 'bg-cyan-500'
                            : 'bg-cyan-300'
                      : c.v < 15
                        ? 'bg-sky-900'
                        : c.v < 50
                          ? 'bg-sky-700'
                          : c.v < 100
                            ? 'bg-sky-500'
                            : 'bg-sky-300'
                )}
              />
            ))}
          </div>
        </Card>
      </section>

      {courseDueCards(s, cur).length === 0 && s.log.length > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span>Không có thẻ nào đến hạn ôn hôm nay (ngày kế tiếp: {addDays(todayStr(), 1)}).</span>
        </p>
      )}
    </div>
  );
};

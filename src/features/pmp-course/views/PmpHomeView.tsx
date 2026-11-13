import React, { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  ExternalLink,
  Flame,
  GitBranch,
  Layers,
  ListChecks,
  Scale,
  SkipForward,
  Sparkles,
  Star,
  Target,
  Trophy,
} from 'lucide-react';
import { usePmpCurriculum, usePmpLinks } from '../data';
import {
  activeDays,
  addDays,
  isModuleSkipped,
  lessonRead,
  pmpCurrentLevel,
  pmpDueCards,
  pmpEvidenceVisited,
  pmpModuleDone,
  pmpNextSteps,
  quizSatisfied,
  rankOfPmp,
  sortedPmpModules,
  streak,
  todayStr,
} from '../logic';
import { usePmpAppStore, usePmpNav, usePmpProgress } from '../store';
import { CourseBar } from '@/features/devops-course/components/CourseUi';
import { Card, PageHeader, Spinner } from '@/features/workpath/components/ui';
import { PmpTrademarkFooter } from '../components/PmpShared';
import type { PmpModule } from '../types';
import { cn } from '@/utils/cn';

const Stat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  bar?: number;
}> = ({ icon, label, value, sub, bar }) => (
  <Card className="relative overflow-hidden">
    <div className="absolute right-3 top-3 text-slate-700">{icon}</div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="mt-0.5 text-2xl font-bold tabular-nums text-white">{value}</div>
    {sub && <div className="text-xs text-slate-400">{sub}</div>}
    {bar !== undefined && <CourseBar value={bar} accent="amber" className="mt-2" />}
  </Card>
);

export const PmpHomeView: React.FC = () => {
  const { data: cur } = usePmpCurriculum();
  const { data: linksMap } = usePmpLinks();
  const s = usePmpProgress((x) => x.state);
  const applySkipTarget = usePmpProgress((x) => x.applySkipTarget);
  const go = usePmpNav((x) => x.go);
  const setActiveTab = usePmpAppStore((x) => x.setActiveTab);

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
  const mods = sortedPmpModules(cur);
  const level = pmpCurrentLevel(s, cur);
  const rank = rankOfPmp(s.xp);
  const modsDone = mods.filter((m) => pmpModuleDone(s, m, cur.passQuiz)).length;
  const quizzesPassed = mods.filter((m) => m.quiz.length > 0 && quizSatisfied(s, m.id, cur.passQuiz)).length;
  const allEvidenceIds = [...new Set(mods.flatMap((m) => m.evidenceLinkIds))];
  const visitedEvidence = allEvidenceIds.filter((id) => pmpEvidenceVisited(s, id)).length;
  const dueCount = pmpDueCards(s, cur).length;
  const steps = pmpNextSteps(s, cur, linksMap);
  const fresh = s.xp === 0 && Object.keys(s.lessons).length === 0;

  const tracks: {
    key: string;
    badge: string;
    title: string;
    subtitle: string;
    borderCls: string;
    badgeCls: string;
    icon: React.ReactNode;
    modules: PmpModule[];
  }[] = [
    {
      key: 'foundation',
      badge: 'CHẶNG 1 · NỀN TẢNG & AGILE / HYBRID (P00 – P06)',
      title: 'Cẩm Nang Hiệu Chỉnh Tư Duy PMI, 6 Nguyên Tắc PMBOK 8 & Agile/Scrum',
      subtitle:
        'Bóc tách phản xạ đời thực vs PMI, ECO 07/2026 (33/41/26), Tư duy hệ thống & Giá trị bền vững, Lãnh đạo trao quyền, Phổ phát triển & Scrum/Kanban/Hybrid',
      borderCls: 'border-amber-500/35 bg-amber-500/[0.05]',
      badgeCls: 'border-amber-500/45 bg-amber-500/15 text-amber-300',
      icon: <Compass className="h-4 w-4 text-amber-400" aria-hidden="true" />,
      modules: mods.filter((m) => parseInt(m.id.slice(1), 10) <= 6),
    },
    {
      key: 'domains',
      badge: 'CHẶNG 2 · 7 MIỀN HIỆU SUẤT PMBOK 8 (P07 – P12)',
      title: 'Cẩm Nang Ra Quyết Định Trên 7 Performance Domains & 40 Quy Trình',
      subtitle:
        'Governance & Change Control, Stakeholders & Communications, Resources & Conflict, Scope & Quality, Schedule & Finance (EVM/Reserves), Risk vs Issue & Procurement',
      borderCls: 'border-sky-500/35 bg-sky-500/[0.05]',
      badgeCls: 'border-sky-500/45 bg-sky-500/15 text-sky-300',
      icon: <Scale className="h-4 w-4 text-sky-400" aria-hidden="true" />,
      modules: mods.filter((m) => {
        const n = parseInt(m.id.slice(1), 10);
        return n >= 7 && n <= 12;
      }),
    },
    {
      key: 'exam-surgery',
      badge: 'CHẶNG 3 · PHẪU THUẬT ĐỀ TÌNH HUỐNG & CHIẾN LƯỢC THI (P13 – P15)',
      title: 'Kỹ Thuật Giải Đề Tình Huống (FIRST / NEXT / BEST), 12 Bẫy Đáp Án & AI/Compliance',
      subtitle:
        'Đọc ngược câu chốt, nhận diện 12 WeaknessTag kinh điển, chọn giữa 2 đáp án tốt, xử lý Compliance/OCM/AI (PMBOK 8 Appendix X3) & lộ trình 54 bộ đề bên Mindmap',
      borderCls: 'border-emerald-500/35 bg-emerald-500/[0.05]',
      badgeCls: 'border-emerald-500/45 bg-emerald-500/15 text-emerald-300',
      icon: <Target className="h-4 w-4 text-emerald-400" aria-hidden="true" />,
      modules: mods.filter((m) => parseInt(m.id.slice(1), 10) >= 13),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title={fresh ? 'Chào mừng đến PMP Mastery — Học Tư Duy & Ra Quyết Định Chuẩn PMI' : 'Chào mừng quay lại lộ trình Tư duy PMP'}
        sub={`Cấp độ hiện tại ${level}: ${cur.levels[String(level)] ?? 'Đã hoàn thành toàn bộ lộ trình'} · Đối chiếu PMBOK® 8 (2025), ECO 07/2026 & PMP Mindmap`}
      />

      {/* 5 Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          icon={<Star className="h-6 w-6" />}
          label="XP · cấp bậc tư duy"
          value={s.xp}
          sub={`${rank.name}${rank.toNext ? ` · còn ${rank.toNext} XP` : ''}`}
        />
        <Stat icon={<Flame className="h-6 w-6" />} label="Chuỗi ngày rèn phản xạ" value={`${streak(s)} ngày`} />
        <Stat
          icon={<BookOpen className="h-6 w-6" />}
          label="Module hoàn thành"
          value={`${modsDone}/${mods.length}`}
          bar={mods.length ? modsDone / mods.length : 0}
        />
        <Stat
          icon={<ListChecks className="h-6 w-6" />}
          label="Quiz đạt chuẩn (≥70%)"
          value={`${quizzesPassed}/${mods.length}`}
          bar={mods.length ? quizzesPassed / mods.length : 0}
        />
        <Stat
          icon={<ExternalLink className="h-6 w-6" />}
          label="Dẫn chứng Mindmap đã mở"
          value={`${visitedEvidence}/${allEvidenceIds.length}`}
          sub={dueCount > 0 ? `${dueCount} thẻ SRS đến hạn` : 'Không có thẻ SRS trễ hạn'}
          bar={allEvidenceIds.length ? visitedEvidence / allEvidenceIds.length : 0}
        />
      </div>

      {/* Quick synthesis tools banner */}
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setActiveTab('canvas')}
          className="group flex items-start justify-between gap-3 rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/12 via-slate-900/90 to-slate-900/90 p-4 text-left transition-all hover:border-amber-400/65 cursor-pointer"
        >
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/45 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-extrabold text-amber-300">
              <Layers className="h-3 w-3" /> BỨC TRANH 1 TRANG (⌘2)
            </div>
            <h3 className="mt-2 text-base font-extrabold text-white">PMP Mindset Canvas</h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Nhìn trọn trên 1 mặt phẳng: 6 Nguyên tắc PMBOK 8, Vai trò &amp; Thẩm quyền, Phổ phát triển, Chu trình 5 bước và Bảng bắc cầu 7 Domains ↔ 14 Chủ đề Mindmap.
            </p>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-amber-400 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('decision')}
          className="group flex items-start justify-between gap-3 rounded-2xl border border-cyan-500/35 bg-gradient-to-br from-cyan-500/12 via-slate-900/90 to-slate-900/90 p-4 text-left transition-all hover:border-cyan-400/65 cursor-pointer"
        >
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/45 bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] font-extrabold text-cyan-300">
              <GitBranch className="h-3 w-3" /> CÔNG CỤ TƯƠNG TÁC (⌘3)
            </div>
            <h3 className="mt-2 text-base font-extrabold text-white">Cây Quyết Định Tình Huống &amp; 12 Ca Thực Chiến</h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Bấm rẽ nhánh từng bước cho 7 nhóm tình huống nóng nhất (Change Request, Issue vs Risk, Xung đột, Trễ hạn, Hợp đồng, Đạo đức) để ra ngay hành động FIRST chuẩn PMI.
            </p>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-cyan-400 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Next Step */}
      <section aria-labelledby="pmp-next-steps">
        <h2 id="pmp-next-steps" className="mb-2 text-base font-semibold text-white">
          Bước kế tiếp trên đường học của bạn
        </h2>
        <div className="space-y-2">
          {steps.map((st, i) => (
            <div
              key={i}
              className={cn(
                'flex min-h-[48px] w-full items-center gap-2 rounded-xl border bg-slate-900/70 px-3 sm:px-4 py-2.5 transition-colors hover:bg-slate-800/85',
                i === 0 ? 'border-amber-500/60 ring-1 ring-amber-500/30' : 'border-slate-800'
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
                    i === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-slate-100">{st.text}</span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-400"
                  aria-hidden="true"
                />
              </button>
              {st.skipTarget && (
                <button
                  type="button"
                  onClick={() => applySkipTarget(st.skipTarget!)}
                  title="Đã nắm vững — Bỏ qua bước này để sang phần kế tiếp"
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

      {/* 3 Visual Study Sheet Chặng */}
      <section aria-labelledby="pmp-visual-tracks">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h2 id="pmp-visual-tracks" className="flex items-center gap-2 text-base font-bold text-white">
            <Sparkles className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span>Bản đồ Cẩm nang Tư duy Trực quan (16 Module theo 3 chặng)</span>
          </h2>
          <button
            type="button"
            onClick={() => go({ name: 'roadmap' })}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
          >
            Xem chi tiết 6 cấp độ →
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {tracks.map((track) => (
            <div key={track.key} className={cn('flex flex-col justify-between rounded-2xl border p-4 space-y-3', track.borderCls)}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-extrabold', track.badgeCls)}>
                    {track.icon}
                    <span>{track.badge}</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400">{track.modules.length} bài</span>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">{track.title}</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{track.subtitle}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {track.modules.map((m) => {
                  const skipped = isModuleSkipped(s, m.id);
                  const done = pmpModuleDone(s, m, cur.passQuiz);
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
                              ? 'border-amber-500/45 bg-amber-500/12 text-amber-200'
                              : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-600 hover:text-white'
                      )}
                    >
                      {skipped ? (
                        <SkipForward className="h-3 w-3 shrink-0 text-sky-400" aria-hidden="true" />
                      ) : (
                        done && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" aria-hidden="true" />
                      )}
                      <span className="font-mono font-bold">{m.id}</span>
                      <span className="max-w-[140px] truncate">{m.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {fresh && (
        <Card>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-white">
            <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" /> Nhịp học 5 bước phối hợp Learning Gate ↔ PMP Mindmap
          </h2>
          <ol className="grid gap-2 text-sm text-slate-300 sm:grid-cols-5">
            {[
              'Đọc cẩm nang tư duy trực quan (bóc tách Đời thực vs PMI)',
              'Tự kiểm tra nhanh 5–6 câu tình huống (đạt ≥70%)',
              'Bấm “Đi xem dẫn chứng” mở đúng Node / Flow bên PMP Mindmap',
              'Sang Phòng luyện đề PMP Mindmap làm Mix / Mini-test theo chỉ dẫn',
              'Lật thẻ Flashcard SRS Leitner để khoá chặt phản xạ dài hạn',
            ].map((step, i) => (
              <li key={step} className="rounded-lg bg-slate-800/60 p-2.5">
                <span className="mr-1.5 font-bold text-amber-400">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs sm:text-sm text-slate-400">
            <b>Một khái niệm chỉ có MỘT nơi chứa nội dung chi tiết:</b> PMP Mastery giữ vai trò <i>người dẫn đường tư duy</i> (tổng hợp theo PMBOK 8 &amp; ECO 07/2026), còn toàn bộ 318 node ITTO và 4.318 câu hỏi thực chiến nằm gọn bên <b>PMP Mindmap</b>.
          </p>
        </Card>
      )}

      {/* 16-week activity heatmap */}
      <section aria-labelledby="pmp-heat">
        <h2 id="pmp-heat" className="mb-2 text-base font-semibold text-white">
          Nhịp rèn tư duy 16 tuần
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
                    : c.v < 15
                      ? 'bg-amber-900'
                      : c.v < 50
                        ? 'bg-amber-700'
                        : c.v < 100
                          ? 'bg-amber-500'
                          : 'bg-amber-300'
                )}
              />
            ))}
          </div>
        </Card>
      </section>

      {dueCount === 0 && s.log.length > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span>Không có thẻ phản xạ nào đến hạn ôn hôm nay (lịch kế tiếp: {addDays(todayStr(), 1)}).</span>
        </p>
      )}

      <PmpTrademarkFooter />
    </div>
  );
};

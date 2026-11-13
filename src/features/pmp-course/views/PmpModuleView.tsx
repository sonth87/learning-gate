import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  Eye,
  GitBranch,
  Layers,
  ListChecks,
  Maximize2,
  Minimize2,
  Scale,
  SkipForward,
  Sparkles,
  Target,
  Undo2,
} from 'lucide-react';
import { usePmpCurriculum, usePmpLinks } from '../data';
import {
  isLessonSkipped,
  isModuleSkipped,
  isQuizSkipped,
  lessonRead,
  pmpEvidenceVisited,
  pmpModuleProgress,
  quizBest,
  sortedPmpModules,
} from '../logic';
import { usePmpAppStore, usePmpNav, usePmpProgress } from '../store';
import { buildMindmapUrl, getLinkKindBadge } from '../links';
import {
  CourseMarkdown,
  extractMarkdownSections,
} from '@/features/devops-course/components/CourseMarkdown';
import { CourseBar, CourseBtn } from '@/features/devops-course/components/CourseUi';
import { Callout, Card, Pill, Spinner } from '@/features/workpath/components/ui';
import { PmpTrademarkFooter, ProvenancePill } from '../components/PmpShared';
import { cn } from '@/utils/cn';

function getPmpModuleBrand(level: number) {
  if (level === 0) {
    return {
      label: 'ĐỊNH HƯỚNG & HIỆU CHỈNH PHẢN XẠ',
      badgeCls: 'border-amber-500/45 bg-amber-500/15 text-amber-300',
      heroGrad: 'from-amber-500/12 via-slate-900/90 to-slate-900/90 border-amber-500/30',
      icon: <Compass className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  if (level === 1) {
    return {
      label: '6 NGUYÊN TẮC HÀNH ĐỘNG PMBOK 8',
      badgeCls: 'border-emerald-500/45 bg-emerald-500/15 text-emerald-300',
      heroGrad: 'from-emerald-500/12 via-slate-900/90 to-slate-900/90 border-emerald-500/30',
      icon: <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  if (level === 2) {
    return {
      label: 'PHỔ PHÁT TRIỂN · AGILE · HYBRID',
      badgeCls: 'border-cyan-500/45 bg-cyan-500/15 text-cyan-300',
      heroGrad: 'from-cyan-500/12 via-slate-900/90 to-slate-900/90 border-cyan-500/30',
      icon: <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  if (level === 3) {
    return {
      label: '7 MIỀN HIỆU SUẤT PMBOK 8',
      badgeCls: 'border-sky-500/45 bg-sky-500/15 text-sky-300',
      heroGrad: 'from-sky-500/12 via-slate-900/90 to-slate-900/90 border-sky-500/30',
      icon: <Scale className="h-3.5 w-3.5" aria-hidden="true" />,
    };
  }
  return {
    label: 'PHẪU THUẬT ĐỀ TÌNH HUỐNG & CHIẾN LƯỢC THI',
    badgeCls: 'border-violet-500/45 bg-violet-500/15 text-violet-300',
    heroGrad: 'from-violet-500/12 via-slate-900/90 to-slate-900/90 border-violet-500/30',
    icon: <Target className="h-3.5 w-3.5" aria-hidden="true" />,
  };
}

export const PmpModuleView: React.FC<{ id: string }> = ({ id }) => {
  const { data: cur } = usePmpCurriculum();
  const { data: linksMap } = usePmpLinks();
  const s = usePmpProgress((x) => x.state);
  const markRead = usePmpProgress((x) => x.markLessonRead);
  const markVisited = usePmpProgress((x) => x.markEvidenceVisited);
  const toggleSkipModule = usePmpProgress((x) => x.toggleSkipModule);
  const toggleSkipLesson = usePmpProgress((x) => x.toggleSkipLesson);
  const toggleSkipQuiz = usePmpProgress((x) => x.toggleSkipQuiz);
  const { go, back } = usePmpNav();
  const openQuickPreview = usePmpAppStore((x) => x.openQuickPreview);
  const openDecisionBranch = usePmpAppStore((x) => x.openDecisionBranch);
  const [wideMode, setWideMode] = useState(false);

  const m = cur?.modules.find((x) => x.id === id);
  const sections = useMemo(() => (m ? extractMarkdownSections(m.lesson) : []), [m]);
  const ordered = useMemo(() => (cur ? sortedPmpModules(cur) : []), [cur]);

  if (!cur) return <Spinner />;
  if (!m) return <div className="p-6 text-slate-400">Không tìm thấy module {id}.</div>;

  const idx = ordered.findIndex((x) => x.id === m.id);
  const prevMod = idx > 0 ? ordered[idx - 1] : null;
  const nextMod = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;

  const [d, t] = pmpModuleProgress(s, m, cur.passQuiz);
  const read = lessonRead(s, m.id);
  const modSkipped = isModuleSkipped(s, m.id);
  const lesSkipped = isLessonSkipped(s, m.id);
  const qzSkipped = isQuizSkipped(s, m.id);
  const best = quizBest(s, m.id);
  const brand = getPmpModuleBrand(m.level);
  const baseUrl = cur.mindmapBaseUrl;

  const evidenceLinks = m.evidenceLinkIds
    .map((lid) => linksMap?.[lid])
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const primaryPracticeLink = linksMap?.[m.practice.primaryLinkId] ?? null;
  const secondaryPracticeLinks = (m.practice.secondaryLinkIds ?? [])
    .map((lid) => linksMap?.[lid])
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const jumpToSection = (secId: string) => {
    const el = document.getElementById(secId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto max-w-[1440px] p-3.5 sm:p-6">
      {/* Top Action Bar */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <CourseBtn accent="amber" onClick={back} aria-label="Quay lại lộ trình">
            <ArrowLeft className="h-4 w-4" /> Lộ trình
          </CourseBtn>
          <span className="hidden sm:inline font-mono text-xs text-slate-500">
            Module {idx + 1}/{ordered.length} · Cấp {m.level} ({cur.levels[String(m.level)]})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSkipModule(m.id)}
            title={
              modSkipped
                ? 'Khôi phục module này vào lộ trình cần học'
                : 'Đã nắm vững phần này? Bỏ qua toàn bộ module để sang phần tiếp theo'
            }
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors cursor-pointer',
              modSkipped
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-white'
            )}
          >
            {modSkipped ? <Undo2 className="h-3.5 w-3.5" /> : <SkipForward className="h-3.5 w-3.5" />}
            <span>{modSkipped ? 'Đã bỏ qua module · Hoàn tác' : 'Bỏ qua module này'}</span>
          </button>

          <button
            type="button"
            onClick={() => setWideMode((w) => !w)}
            className="hidden xl:inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white cursor-pointer"
            title={wideMode ? 'Hiện cột dẫn chứng & luyện tập bên phải' : 'Mở rộng toàn khung để xem sơ đồ lớn'}
          >
            {wideMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span>{wideMode ? 'Hiện cột dẫn chứng' : 'Đọc rộng toàn khung'}</span>
          </button>

          <div className="w-32 sm:w-44">
            <CourseBar value={t ? d / t : 0} accent="amber" />
            <div className="mt-0.5 text-right font-mono text-[11px] text-slate-400">
              {modSkipped ? 'Đã bỏ qua toàn bộ' : `Hoàn thành ${d}/${t} bước`}
            </div>
          </div>
        </div>
      </div>

      {modSkipped && (
        <Callout tone="info" className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            Module <b>{m.id}</b> đang được đánh dấu <b>bỏ qua</b> (đã nắm vững). Bạn vẫn có thể đọc cẩm nang, mở dẫn chứng Mindmap hoặc làm quiz bất cứ lúc nào.
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {nextMod && (
              <CourseBtn variant="primary" accent="amber" onClick={() => go({ name: 'module', id: nextMod.id })}>
                Sang module tiếp: {nextMod.id} <ArrowRight className="h-3.5 w-3.5" />
              </CourseBtn>
            )}
            <CourseBtn accent="amber" onClick={() => toggleSkipModule(m.id, false)}>
              <Undo2 className="h-3.5 w-3.5" /> Hoàn tác bỏ qua
            </CourseBtn>
          </div>
        </Callout>
      )}

      {/* Visual Study Sheet Hero Header */}
      <header className={cn('mb-5 rounded-2xl border bg-gradient-to-br p-4 sm:p-6 shadow-sm', brand.heroGrad)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider',
                brand.badgeCls
              )}
            >
              {brand.icon}
              <span>{brand.label}</span>
            </span>
            <span className="rounded-md border border-amber-400/45 bg-amber-400/18 px-2 py-0.5 font-mono text-xs font-extrabold text-amber-200">
              {m.id}
            </span>
            <span className="font-mono text-xs text-slate-400">
              Cấp {m.level} · {cur.levels[String(m.level)]}
            </span>
          </div>

          <span className="hidden md:inline font-mono text-[11px] font-semibold tracking-wide text-slate-400">
            {m.motto}
          </span>
        </div>

        <h1 className="mt-2.5 text-xl sm:text-2xl lg:text-[26px] font-extrabold text-white leading-tight">
          {m.title}
        </h1>

        <p className="mt-2 max-w-4xl text-sm sm:text-[15px] text-slate-300 leading-relaxed">{m.summary}</p>

        {/* Provenance pills */}
        {m.provenance.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {m.provenance.map((p, i) => (
              <ProvenancePill key={i} kind={p.kind} label={p.label} detail={p.detail} />
            ))}
          </div>
        )}

        {/* Quick Real-World Trap vs PMI Shift Strip */}
        <div className="mt-4 grid gap-2.5 md:grid-cols-2">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Bẫy phản xạ đời thực dễ mất điểm</span>
            </div>
            <p className="mt-1 text-slate-200 leading-relaxed">{m.realWorldTrap}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Dịch chuyển sang Tư duy chuẩn PMI</span>
            </div>
            <p className="mt-1 text-slate-200 leading-relaxed">{m.pmiMindsetShift}</p>
          </div>
        </div>

        {/* Quick Section Jump Pills */}
        {sections.length > 0 && (
          <div className="mt-4 border-t border-slate-800/80 pt-3">
            <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Bản đồ mục lục nhanh trong bài ({sections.length} phần)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => jumpToSection(sec.id)}
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-left text-xs text-slate-300 transition-colors hover:border-amber-500/60 hover:text-white cursor-pointer"
                >
                  <span className="font-mono text-[11px] font-extrabold text-amber-400">{sec.num}.</span>
                  <span className="line-clamp-1 max-w-[240px]">{sec.title}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => jumpToSection('pmp-evidence-section')}
                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-left text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 cursor-pointer"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span>Đi xem dẫn chứng &amp; Luyện tập Mindmap</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className={cn('grid items-start gap-6', !wideMode && 'xl:grid-cols-[minmax(0,1fr)_390px]')}>
        {/* Main Visual Study Sheet Article + Evidence & Practice Sections */}
        <article className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4 sm:p-6 lg:p-7 shadow-xs">
            <CourseMarkdown source={m.lesson} accent="amber" />

            {/* Mark Read / Skip + Quiz CTA */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
              <div className="flex flex-wrap items-center gap-2">
                {read ? (
                  <Pill tone="ok">✔ Bạn đã nắm xong cẩm nang tư duy {m.id}</Pill>
                ) : lesSkipped ? (
                  <>
                    <Pill tone="info">Đã bỏ qua cẩm nang {m.id}</Pill>
                    <CourseBtn accent="amber" onClick={() => markRead(m.id)}>
                      <CheckCircle2 className="h-4 w-4" /> Đánh dấu đã đọc (+20 XP)
                    </CourseBtn>
                    <CourseBtn accent="amber" onClick={() => toggleSkipLesson(m.id, false)}>
                      <Undo2 className="h-3.5 w-3.5" /> Hoàn tác
                    </CourseBtn>
                  </>
                ) : (
                  <>
                    <CourseBtn variant="primary" accent="amber" onClick={() => markRead(m.id)}>
                      <CheckCircle2 className="h-4 w-4" /> Đánh dấu đã nắm vững tư duy (+20 XP)
                    </CourseBtn>
                    <CourseBtn accent="amber" onClick={() => toggleSkipLesson(m.id, true)}>
                      <SkipForward className="h-4 w-4" /> Đã biết — Bỏ qua bài đọc
                    </CourseBtn>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <CourseBtn
                  variant={read ? 'primary' : 'ghost'}
                  accent="amber"
                  onClick={() => go({ name: 'quiz', mode: 'module', moduleId: m.id })}
                >
                  <ListChecks className="h-4 w-4" /> Tự kiểm tra ({m.quiz.length} câu · ≥70%)
                </CourseBtn>
                {m.decisionBranchId && (
                  <CourseBtn accent="amber" onClick={() => openDecisionBranch(m.decisionBranchId!)}>
                    <GitBranch className="h-4 w-4" /> Thử Cây quyết định
                  </CourseBtn>
                )}
              </div>
            </div>
          </div>

          {/* SECTION: ĐI XEM DẪN CHỨNG BÊN PMP MINDMAP */}
          <section
            id="pmp-evidence-section"
            aria-labelledby="evidence-heading"
            className="scroll-mt-16 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.06] via-slate-900/75 to-slate-900/75 p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                  BƯỚC 3 · MỘT NƠI CHỨA DẪN CHỨNG ĐẦY ĐỦ
                </div>
                <h2 id="evidence-heading" className="text-base sm:text-lg font-extrabold text-white">
                  Đi xem dẫn chứng chi tiết bên PMP Mindmap ({evidenceLinks.length} điểm neo)
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Mặc định mở tab mới · Tiến độ lưu riêng trên <code className="font-mono">pmp-mindmap.vercel.app</code>
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {evidenceLinks.map((lnk) => {
                const url = buildMindmapUrl(lnk, baseUrl);
                const visited = pmpEvidenceVisited(s, lnk.linkId);
                const badge = getLinkKindBadge(lnk.kind, lnk.edition);
                return (
                  <div
                    key={lnk.linkId}
                    className={cn(
                      'flex flex-col justify-between rounded-xl border bg-slate-950/85 p-3.5 transition-colors',
                      visited ? 'border-emerald-500/40' : 'border-slate-800 hover:border-amber-500/50'
                    )}
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className={cn('rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold', badge.cls)}>
                          {badge.label}
                        </span>
                        {visited && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Đã mở (+10 XP)
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-white leading-snug">{lnk.label}</h3>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed">{lnk.whyRead}</p>
                      {lnk.bridgeNote && (
                        <div className="mt-2 rounded-lg border border-sky-500/25 bg-sky-500/[0.08] px-2.5 py-1.5 text-[11px] text-sky-200">
                          <b>Đối chiếu thuật ngữ:</b> {lnk.bridgeNote}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => markVisited(lnk.linkId)}
                        className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-extrabold text-slate-950 hover:bg-amber-400 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Mở trong PMP Mindmap</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => openQuickPreview(lnk)}
                        title="Xem nhanh sơ đồ ngay trong cửa sổ (chỉ trên Desktop)"
                        className="hidden lg:inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-amber-500/50 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Xem nhanh</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION: LUYỆN TẬP TÌNH HUỐNG BÊN PMP MINDMAP */}
          <section
            aria-labelledby="practice-heading"
            className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.06] via-slate-900/75 to-slate-900/75 p-4 sm:p-6"
          >
            <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
              BƯỚC 4 · THỰC CHIẾN TRÊN 4.318 CÂU HỎI &amp; 19 DÒNG CHẢY
            </div>
            <h2 id="practice-heading" className="mt-0.5 text-base sm:text-lg font-extrabold text-white">
              {m.practice.title}
            </h2>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-2">
                  Chỉ dẫn thao tác bên PMP Mindmap
                </div>
                <ol className="space-y-1.5 text-xs text-slate-200">
                  {m.practice.steps.map((step, idxStep) => (
                    <li key={idxStep} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 font-mono text-[10px] font-bold text-amber-300">
                        {idxStep + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-2">
                  Tự kiểm điểm sau khi làm xong
                </div>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {m.practice.selfCheck.map((item, idxCheck) => (
                    <li key={idxCheck} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {primaryPracticeLink && (
                <a
                  href={buildMindmapUrl(primaryPracticeLink, baseUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markVisited(primaryPracticeLink.linkId)}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs sm:text-sm font-extrabold text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{primaryPracticeLink.label}</span>
                </a>
              )}
              {secondaryPracticeLinks.map((secLink) => (
                <a
                  key={secLink.linkId}
                  href={buildMindmapUrl(secLink, baseUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markVisited(secLink.linkId)}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{secLink.label}</span>
                </a>
              ))}
            </div>
          </section>

          {/* Prev / Next Module Navigation */}
          {(prevMod || nextMod) && (
            <nav
              aria-label="Điều hướng module trước và tiếp theo"
              className="grid gap-3 sm:grid-cols-2"
            >
              {prevMod ? (
                <button
                  type="button"
                  onClick={() => go({ name: 'module', id: prevMod.id })}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-left transition-colors hover:border-amber-500/60 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Module trước</div>
                    <div className="truncate text-xs sm:text-sm font-bold text-slate-200">
                      <span className="mr-1.5 font-mono text-amber-400">{prevMod.id}</span>
                      {prevMod.title}
                    </div>
                  </div>
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextMod && (
                <button
                  type="button"
                  onClick={() => go({ name: 'module', id: nextMod.id })}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-right transition-colors hover:border-amber-500/60 cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Module tiếp theo</div>
                    <div className="truncate text-xs sm:text-sm font-bold text-slate-200">
                      <span className="mr-1.5 font-mono text-amber-400">{nextMod.id}</span>
                      {nextMod.title}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              )}
            </nav>
          )}

          <PmpTrademarkFooter />
        </article>

        {/* Right Sticky Action Rail */}
        <aside className={cn('space-y-4', !wideMode && 'xl:sticky xl:top-4')}>
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-white">Tự kiểm tra &amp; Khoá phản xạ</h2>
            <div className="flex flex-wrap gap-2">
              <CourseBtn
                variant="primary"
                accent="amber"
                onClick={() => go({ name: 'quiz', mode: 'module', moduleId: m.id })}
              >
                <ListChecks className="h-4 w-4" /> Quiz ({m.quiz.length} câu)
              </CourseBtn>
              <CourseBtn accent="amber" onClick={() => go({ name: 'flash', moduleId: m.id })}>
                <Layers className="h-4 w-4" /> Flashcard ({m.cards.length})
              </CourseBtn>
              {m.quiz.length > 0 && best < cur.passQuiz && (
                <CourseBtn accent="amber" onClick={() => toggleSkipQuiz(m.id)}>
                  {qzSkipped ? (
                    <>
                      <Undo2 className="h-3.5 w-3.5" /> Hoàn tác bỏ qua Quiz
                    </>
                  ) : (
                    <>
                      <SkipForward className="h-3.5 w-3.5" /> Bỏ qua Quiz
                    </>
                  )}
                </CourseBtn>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Điểm tốt nhất: {best ? `${Math.round(best * 100)}%` : qzSkipped ? 'đã bỏ qua' : 'chưa làm'} · cần ≥{' '}
              {Math.round(cur.passQuiz * 100)}% để hoàn tất module
            </p>
          </Card>

          {m.decisionBranchId && (
            <Card>
              <h2 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white">
                <GitBranch className="h-4 w-4 text-cyan-400" aria-hidden="true" /> Nhánh Cây quyết định đi kèm
              </h2>
              <p className="mb-2.5 text-xs text-slate-400 leading-relaxed">
                Luyện bấm rẽ nhánh từng bước cho các ca tình huống thực tế của module {m.id}.
              </p>
              <CourseBtn accent="amber" className="w-full" onClick={() => openDecisionBranch(m.decisionBranchId!)}>
                <Compass className="h-4 w-4" /> Mở nhánh quyết định tương tác
              </CourseBtn>
            </Card>
          )}

          <Card>
            <h2 className="mb-2 text-sm font-semibold text-white">
              Dẫn chứng nhanh ({evidenceLinks.filter((l) => pmpEvidenceVisited(s, l.linkId)).length}/{evidenceLinks.length})
            </h2>
            <div className="space-y-2">
              {evidenceLinks.map((lnk) => {
                const url = buildMindmapUrl(lnk, baseUrl);
                const visited = pmpEvidenceVisited(s, lnk.linkId);
                return (
                  <a
                    key={lnk.linkId}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markVisited(lnk.linkId)}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition-colors',
                      visited
                        ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                        : 'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-amber-500/50 hover:text-amber-200'
                    )}
                  >
                    <span className="truncate font-medium">{lnk.label}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import YAML from 'yaml';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Award,
  Blocks,
  BookOpen,
  Box,
  Boxes,
  Check,
  CheckCircle2,
  Cloud,
  Code2,
  Compass,
  Container,
  Copy,
  Cpu,
  Database,
  Eye,
  FileCode2,
  FileText,
  Flame,
  FolderGit2,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Globe,
  Handshake,
  HardDrive,
  KeyRound,
  Layers,
  Lightbulb,
  Lock,
  Network,
  Package,
  Play,
  RefreshCw,
  Rocket,
  RotateCcw,
  Scale,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Terminal,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Webhook,
  Workflow,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { detectLanguageFromFence, renderHighlightedConfig } from '../configHighlighter';
import type { DevOpsAccent, EditorLanguage } from '../types';
import {
  IllustrationFigure,
  type IllustrationCalloutItem,
} from '@/components/common/IllustrationLightbox';
import { cn } from '@/utils/cn';

export type VisualTone = 'sky' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';

interface ToneClasses {
  cardBorder: string;
  cardTopBorder: string;
  cardBg: string;
  headerBg: string;
  badge: string;
  iconBox: string;
  title: string;
  dot: string;
  layerBg: string;
}

const TONE_MAP: Record<VisualTone, ToneClasses> = {
  sky: {
    cardBorder: 'border-sky-500/35',
    cardTopBorder: 'border-t-sky-500',
    cardBg: 'bg-sky-500/[0.06]',
    headerBg: 'bg-sky-500/12',
    badge: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
    iconBox: 'border-sky-500/35 bg-sky-500/15 text-sky-300',
    title: 'text-sky-300',
    dot: 'bg-sky-400',
    layerBg: 'border-sky-500/40 bg-sky-500/12',
  },
  cyan: {
    cardBorder: 'border-cyan-500/35',
    cardTopBorder: 'border-t-cyan-500',
    cardBg: 'bg-cyan-500/[0.06]',
    headerBg: 'bg-cyan-500/12',
    badge: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
    iconBox: 'border-cyan-500/35 bg-cyan-500/15 text-cyan-300',
    title: 'text-cyan-300',
    dot: 'bg-cyan-400',
    layerBg: 'border-cyan-500/40 bg-cyan-500/12',
  },
  emerald: {
    cardBorder: 'border-emerald-500/35',
    cardTopBorder: 'border-t-emerald-500',
    cardBg: 'bg-emerald-500/[0.06]',
    headerBg: 'bg-emerald-500/12',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    iconBox: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
    title: 'text-emerald-300',
    dot: 'bg-emerald-400',
    layerBg: 'border-emerald-500/40 bg-emerald-500/12',
  },
  amber: {
    cardBorder: 'border-amber-500/35',
    cardTopBorder: 'border-t-amber-500',
    cardBg: 'bg-amber-500/[0.06]',
    headerBg: 'bg-amber-500/12',
    badge: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    iconBox: 'border-amber-500/35 bg-amber-500/15 text-amber-300',
    title: 'text-amber-300',
    dot: 'bg-amber-400',
    layerBg: 'border-amber-500/40 bg-amber-500/12',
  },
  rose: {
    cardBorder: 'border-rose-500/35',
    cardTopBorder: 'border-t-rose-500',
    cardBg: 'bg-rose-500/[0.06]',
    headerBg: 'bg-rose-500/12',
    badge: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    iconBox: 'border-rose-500/35 bg-rose-500/15 text-rose-300',
    title: 'text-rose-300',
    dot: 'bg-rose-400',
    layerBg: 'border-rose-500/40 bg-rose-500/12',
  },
  violet: {
    cardBorder: 'border-violet-500/35',
    cardTopBorder: 'border-t-violet-500',
    cardBg: 'bg-violet-500/[0.06]',
    headerBg: 'bg-violet-500/12',
    badge: 'border-violet-500/40 bg-violet-500/15 text-violet-300',
    iconBox: 'border-violet-500/35 bg-violet-500/15 text-violet-300',
    title: 'text-violet-300',
    dot: 'bg-violet-400',
    layerBg: 'border-violet-500/40 bg-violet-500/12',
  },
  slate: {
    cardBorder: 'border-slate-700',
    cardTopBorder: 'border-t-slate-500',
    cardBg: 'bg-slate-900/70',
    headerBg: 'bg-slate-800/80',
    badge: 'border-slate-700 bg-slate-800 text-slate-300',
    iconBox: 'border-slate-700 bg-slate-800 text-slate-300',
    title: 'text-slate-200',
    dot: 'bg-slate-400',
    layerBg: 'border-slate-700 bg-slate-800/75',
  },
};

function getTone(tone?: string, fallback: VisualTone = 'sky'): ToneClasses {
  if (tone && tone in TONE_MAP) return TONE_MAP[tone as VisualTone];
  return TONE_MAP[fallback];
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  activity: Activity,
  alert: AlertTriangle,
  award: Award,
  blocks: Blocks,
  book: BookOpen,
  box: Box,
  boxes: Boxes,
  check: CheckCircle2,
  cloud: Cloud,
  code: Code2,
  compass: Compass,
  container: Container,
  cpu: Cpu,
  database: Database,
  eye: Eye,
  'file-code': FileCode2,
  file: FileText,
  flame: Flame,
  'folder-git': FolderGit2,
  'git-branch': GitBranch,
  'git-commit': GitCommit,
  'git-merge': GitMerge,
  'git-pr': GitPullRequest,
  globe: Globe,
  handshake: Handshake,
  disk: HardDrive,
  storage: HardDrive,
  key: KeyRound,
  layers: Layers,
  lightbulb: Lightbulb,
  lock: Lock,
  network: Network,
  package: Package,
  play: Play,
  refresh: RefreshCw,
  rocket: Rocket,
  rollback: RotateCcw,
  scale: Scale,
  search: Search,
  server: Server,
  settings: Settings,
  shield: Shield,
  'shield-alert': ShieldAlert,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
  doctor: Stethoscope,
  target: Target,
  terminal: Terminal,
  trash: Trash2,
  trend: TrendingUp,
  upload: Upload,
  users: Users,
  webhook: Webhook,
  workflow: Workflow,
  wrench: Wrench,
  x: XCircle,
  zap: Zap,
};

function renderVisualIcon(name?: string, className = 'h-4 w-4') {
  const IconComp = (name && ICON_MAP[name.toLowerCase()]) || Box;
  return <IconComp className={className} aria-hidden="true" />;
}

const MiniCodeSnippet: React.FC<{
  code: string;
  lang?: string;
  className?: string;
}> = ({ code, lang = 'shell', className }) => {
  const isLight = useStore((s) => s.resolvedColorScheme) === 'light';
  const [copied, setCopied] = useState(false);
  const resolvedLang: EditorLanguage = detectLanguageFromFence(lang, 'shell');
  const trimmed = code.replace(/\n$/, '');

  return (
    <div
      className={cn(
        'group/snippet relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950/95',
        className
      )}
    >
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(trimmed);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
        aria-label="Sao chép lệnh hoặc cấu hình"
        className="absolute right-1.5 top-1.5 z-10 rounded-md border border-slate-700/90 bg-slate-900/90 p-1 text-slate-400 opacity-0 transition-opacity hover:text-white group-hover/snippet:opacity-100 focus-visible:opacity-100 cursor-pointer"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      </button>
      <pre className="overflow-x-auto px-3 py-2 pr-8 font-mono text-[12px] leading-relaxed whitespace-pre text-slate-200">
        {renderHighlightedConfig(trimmed, resolvedLang, isLight)}
      </pre>
    </div>
  );
};

interface BlockHeaderProps {
  eyebrow: string;
  title?: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent: DevOpsAccent;
  renderInline: (text: string) => React.ReactNode;
}

function accentFallbackTone(accent: DevOpsAccent): VisualTone {
  if (accent === 'cyan') return 'cyan';
  if (accent === 'amber') return 'amber';
  if (accent === 'rose') return 'rose';
  if (accent === 'emerald') return 'emerald';
  return 'sky';
}

const BlockHeader: React.FC<BlockHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  icon,
  accent,
  renderInline,
}) => {
  const eyebrowTone =
    accent === 'cyan'
      ? 'text-cyan-400'
      : accent === 'amber'
        ? 'text-amber-400'
        : accent === 'rose'
          ? 'text-rose-400'
          : accent === 'emerald'
            ? 'text-emerald-400'
            : 'text-sky-400';
  return (
    <div className="mb-3.5 flex flex-col gap-0.5 border-b border-slate-800/90 pb-2.5">
      <div className={cn('flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider', eyebrowTone)}>
        {icon}
        <span>{eyebrow}</span>
      </div>
      {title && <h4 className="text-sm sm:text-base font-bold text-white leading-snug">{renderInline(title)}</h4>}
      {subtitle && <p className="text-xs text-slate-400 leading-relaxed">{renderInline(subtitle)}</p>}
    </div>
  );
};

/* ---------- 1. FLOW DIAGRAM ---------- */
interface FlowStepSpec {
  icon?: string;
  badge?: string;
  title: string;
  desc?: string;
  code?: string;
  tone?: string;
  edge?: string;
}

interface FlowSpec {
  kind: 'flow';
  title?: string;
  subtitle?: string;
  footer?: string;
  steps: FlowStepSpec[];
}

const VisualFlowDiagram: React.FC<{
  spec: FlowSpec;
  accent: DevOpsAccent;
  renderInline: (text: string) => React.ReactNode;
}> = ({ spec, accent, renderInline }) => {
  const defaultTone: VisualTone = accentFallbackTone(accent);
  const steps = Array.isArray(spec.steps) ? spec.steps : [];
  if (!steps.length) return null;

  return (
    <figure className="my-4 rounded-xl border border-slate-800 bg-slate-950/65 p-3.5 sm:p-4 shadow-xs">
      <BlockHeader
        eyebrow="Sơ đồ luồng trực quan"
        title={spec.title}
        subtitle={spec.subtitle}
        icon={<Workflow className="h-3.5 w-3.5" aria-hidden="true" />}
        accent={accent}
        renderInline={renderInline}
      />

      {/* Mobile vertical flow (< md) */}
      <div className="flex flex-col items-stretch md:hidden">
        {steps.map((step, idx) => {
          const t = getTone(step.tone, defaultTone);
          const isLast = idx === steps.length - 1;
          return (
            <React.Fragment key={idx}>
              <div className={cn('rounded-xl border p-3 transition-colors', t.cardBorder, t.cardBg)}>
                <div className="flex items-center gap-2.5">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', t.iconBox)}>
                    {renderVisualIcon(step.icon, 'h-4 w-4')}
                  </span>
                  <div className="min-w-0 flex-1">
                    {step.badge && (
                      <span className={cn('inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold', t.badge)}>
                        {step.badge}
                      </span>
                    )}
                    <div className="mt-0.5 text-sm font-bold text-white leading-snug">{renderInline(step.title)}</div>
                  </div>
                </div>
                {step.desc && <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">{renderInline(step.desc)}</p>}
                {step.code && (
                  <div className="mt-2 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-[11px] text-amber-300 break-all">
                    {step.code}
                  </div>
                )}
              </div>
              {!isLast && (
                <div className="my-1.5 flex items-center justify-center gap-1.5 text-slate-400">
                  <ArrowDown className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  {step.edge && (
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-300">
                      {step.edge}
                    </span>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Tablet & Desktop connected horizontal flow (md+) */}
      <div className="hidden md:flex md:flex-wrap md:items-stretch md:gap-y-3">
        {steps.map((step, idx) => {
          const t = getTone(step.tone, defaultTone);
          const isLast = idx === steps.length - 1;
          return (
            <React.Fragment key={idx}>
              <div
                className={cn(
                  'flex min-w-[155px] flex-1 basis-[165px] flex-col justify-between rounded-xl border p-3 transition-colors',
                  t.cardBorder,
                  t.cardBg
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', t.iconBox)}>
                      {renderVisualIcon(step.icon, 'h-4 w-4')}
                    </span>
                    {step.badge && (
                      <span className={cn('rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold', t.badge)}>
                        {step.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm font-bold text-white leading-snug">{renderInline(step.title)}</div>
                  {step.desc && <p className="mt-1 text-xs text-slate-300 leading-relaxed">{renderInline(step.desc)}</p>}
                </div>
                {step.code && (
                  <div className="mt-2.5 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-[11px] text-amber-300 break-all">
                    {step.code}
                  </div>
                )}
              </div>

              {!isLast && (
                <div className="flex shrink-0 flex-col items-center justify-center px-1.5">
                  {step.edge && (
                    <span className="mb-1 max-w-[110px] text-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-semibold leading-tight text-slate-300">
                      {step.edge}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 text-slate-500" aria-hidden="true" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {spec.footer && (
        <figcaption className="mt-3 border-t border-slate-800/80 pt-2 text-xs text-slate-400">
          {renderInline(spec.footer)}
        </figcaption>
      )}
    </figure>
  );
};

/* ---------- 2. LAYERED STACK / ARCHITECTURE COMPARISON ---------- */
interface StackLayerItem {
  label: string;
  sub?: string;
  note?: string;
  tone?: string;
}

interface StackColumnSpec {
  title: string;
  badge?: string;
  tone?: string;
  footer?: string;
  layers: StackLayerItem[];
}

interface LayersSpec {
  kind: 'layers';
  title?: string;
  subtitle?: string;
  columns: StackColumnSpec[];
}

const VisualLayersDiagram: React.FC<{
  spec: LayersSpec;
  accent: DevOpsAccent;
  renderInline: (text: string) => React.ReactNode;
}> = ({ spec, accent, renderInline }) => {
  const defaultTone: VisualTone = accentFallbackTone(accent);
  const cols = Array.isArray(spec.columns) ? spec.columns : [];
  if (!cols.length) return null;

  return (
    <figure className="my-4 rounded-xl border border-slate-800 bg-slate-950/65 p-3.5 sm:p-4 shadow-xs">
      <BlockHeader
        eyebrow="Kiến trúc phân tầng & xếp lớp"
        title={spec.title}
        subtitle={spec.subtitle}
        icon={<Layers className="h-3.5 w-3.5" aria-hidden="true" />}
        accent={accent}
        renderInline={renderInline}
      />

      <div
        className={cn(
          'grid gap-4',
          cols.length === 1 ? 'max-w-2xl mx-auto' : cols.length === 2 ? 'md:grid-cols-2' : 'lg:grid-cols-3'
        )}
      >
        {cols.map((col, cIdx) => {
          const ct = getTone(col.tone, defaultTone);
          return (
            <div
              key={cIdx}
              className={cn(
                'flex flex-col justify-between rounded-xl border border-dashed p-3.5',
                ct.cardBorder,
                'bg-slate-900/55'
              )}
            >
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-white">{renderInline(col.title)}</div>
                  {col.badge && (
                    <span className={cn('rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold', ct.badge)}>
                      {col.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {(col.layers ?? []).map((layer, lIdx) => {
                    const lt = getTone(layer.tone, col.tone ? (col.tone as VisualTone) : defaultTone);
                    return (
                      <div
                        key={lIdx}
                        className={cn(
                          'flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors',
                          lt.layerBg
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', lt.dot)} aria-hidden="true" />
                            <span className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                              {renderInline(layer.label)}
                            </span>
                          </div>
                          {layer.sub && (
                            <div className="mt-0.5 pl-4 text-[11px] text-slate-300 leading-snug">
                              {renderInline(layer.sub)}
                            </div>
                          )}
                        </div>
                        {layer.note && (
                          <span className={cn('shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold', lt.badge)}>
                            {layer.note}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {col.footer && (
                <div className="mt-3 border-t border-slate-800/80 pt-2 text-xs text-slate-300">
                  {renderInline(col.footer)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </figure>
  );
};

/* ---------- 3. BENTO GROUPED CARDS ---------- */
interface GroupCardItem {
  num?: string | number;
  icon?: string;
  title: string;
  badge?: string;
  tone?: string;
  desc?: string;
  bullets?: string[];
  code?: string;
  codeLang?: string;
  footer?: string;
}

interface GroupsSpec {
  kind: 'groups';
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  items: GroupCardItem[];
}

const VisualGroupsGrid: React.FC<{
  spec: GroupsSpec;
  accent: DevOpsAccent;
  renderInline: (text: string) => React.ReactNode;
}> = ({ spec, accent, renderInline }) => {
  const defaultTone: VisualTone = accentFallbackTone(accent);
  const items = Array.isArray(spec.items) ? spec.items : [];
  if (!items.length) return null;

  const colCls =
    spec.columns === 4
      ? 'sm:grid-cols-2 xl:grid-cols-4'
      : spec.columns === 3
        ? 'md:grid-cols-3'
        : 'md:grid-cols-2';

  return (
    <section className="my-4 rounded-xl border border-slate-800 bg-slate-950/65 p-3.5 sm:p-4 shadow-xs">
      <BlockHeader
        eyebrow="Phân nhóm trực quan & bảng tra cứu"
        title={spec.title}
        subtitle={spec.subtitle}
        icon={<Boxes className="h-3.5 w-3.5" aria-hidden="true" />}
        accent={accent}
        renderInline={renderInline}
      />

      <div className={cn('grid gap-3', colCls)}>
        {items.map((item, idx) => {
          const t = getTone(item.tone, defaultTone);
          return (
            <div
              key={idx}
              className={cn(
                'flex flex-col justify-between rounded-xl border border-t-2 bg-slate-900/70 p-3.5 transition-colors',
                t.cardBorder,
                t.cardTopBorder
              )}
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.num !== undefined ? (
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-extrabold',
                          t.iconBox
                        )}
                      >
                        {item.num}
                      </span>
                    ) : item.icon ? (
                      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md border', t.iconBox)}>
                        {renderVisualIcon(item.icon, 'h-3.5 w-3.5')}
                      </span>
                    ) : null}
                    <h5 className="text-sm font-bold text-white leading-snug">{renderInline(item.title)}</h5>
                  </div>
                  {item.badge && (
                    <span className={cn('shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold', t.badge)}>
                      {item.badge}
                    </span>
                  )}
                </div>

                {item.desc && <p className="text-xs text-slate-300 leading-relaxed">{renderInline(item.desc)}</p>}

                {item.bullets && item.bullets.length > 0 && (
                  <ul className="space-y-1.5 pt-0.5">
                    {item.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-300 leading-snug">
                        <CheckCircle2 className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', t.title)} aria-hidden="true" />
                        <span className="min-w-0 flex-1">{renderInline(b)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {item.code && <MiniCodeSnippet code={item.code} lang={item.codeLang ?? 'shell'} className="mt-2" />}
              </div>

              {item.footer && (
                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-center font-mono text-[11px] font-medium text-slate-300">
                  {renderInline(item.footer)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

/* ---------- 4. INSTRUCTION / MANIFEST ANATOMY ---------- */
interface AnatomyRowItem {
  keyword: string;
  role?: string;
  tone?: string;
  summary: string;
  bullets?: string[];
  example?: string;
  lang?: string;
}

interface AnatomySpec {
  kind: 'anatomy';
  title?: string;
  subtitle?: string;
  items: AnatomyRowItem[];
}

const VisualAnatomyList: React.FC<{
  spec: AnatomySpec;
  accent: DevOpsAccent;
  renderInline: (text: string) => React.ReactNode;
}> = ({ spec, accent, renderInline }) => {
  const defaultTone: VisualTone = accentFallbackTone(accent);
  const items = Array.isArray(spec.items) ? spec.items : [];
  if (!items.length) return null;

  return (
    <section className="my-4 rounded-xl border border-slate-800 bg-slate-950/65 p-3.5 sm:p-4 shadow-xs">
      <BlockHeader
        eyebrow="Giải phẫu từ khoá & chỉ thị cốt lõi"
        title={spec.title}
        subtitle={spec.subtitle}
        icon={<FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />}
        accent={accent}
        renderInline={renderInline}
      />

      <div className="divide-y divide-slate-800/80">
        {items.map((item, idx) => {
          const t = getTone(item.tone, defaultTone);
          return (
            <div
              key={idx}
              className="grid gap-2.5 py-3 first:pt-0.5 last:pb-0.5 lg:grid-cols-[190px_minmax(0,1fr)_minmax(240px,330px)] lg:items-start lg:gap-4"
            >
              {/* Left: Number + Highlighter Keyword Pill */}
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-extrabold',
                    t.iconBox
                  )}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <span className="inline-block rounded-md border border-amber-400/45 bg-amber-400/18 px-2.5 py-0.5 font-mono text-xs font-extrabold text-amber-200 shadow-2xs">
                    {item.keyword}
                  </span>
                  {item.role && <div className="mt-0.5 font-mono text-[10px] text-slate-400">{item.role}</div>}
                </div>
              </div>

              {/* Middle: Explanation + Bullets */}
              <div className="min-w-0 space-y-1">
                <div className="text-xs sm:text-[13.5px] font-medium text-slate-100 leading-snug">
                  {renderInline(item.summary)}
                </div>
                {item.bullets && item.bullets.length > 0 && (
                  <ul className="space-y-0.5 pl-1">
                    {item.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-1.5 text-xs text-slate-400 leading-snug">
                        <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', t.dot)} aria-hidden="true" />
                        <span>{renderInline(b)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Right: Crisp Code Pill */}
              {item.example && (
                <MiniCodeSnippet code={item.example} lang={item.lang ?? 'dockerfile'} className="my-0" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

/* ---------- 5. SIDE-BY-SIDE COMPARE (WRONG VS RIGHT / OPTION A VS B) ---------- */
interface CompareSideSpec {
  badge?: string;
  title: string;
  tone?: string;
  code?: string;
  lang?: string;
  bullets?: string[];
}

interface CompareSpec {
  kind: 'compare';
  title?: string;
  subtitle?: string;
  left: CompareSideSpec;
  right: CompareSideSpec;
}

const VisualCompareCards: React.FC<{
  spec: CompareSpec;
  accent: DevOpsAccent;
  renderInline: (text: string) => React.ReactNode;
}> = ({ spec, accent, renderInline }) => {
  if (!spec.left || !spec.right) return null;
  const sides: { side: CompareSideSpec; fallback: VisualTone }[] = [
    { side: spec.left, fallback: 'rose' },
    { side: spec.right, fallback: 'emerald' },
  ];

  return (
    <section className="my-4 rounded-xl border border-slate-800 bg-slate-950/65 p-3.5 sm:p-4 shadow-xs">
      <BlockHeader
        eyebrow="Đối chiếu trực quan"
        title={spec.title}
        subtitle={spec.subtitle}
        icon={<GitMerge className="h-3.5 w-3.5" aria-hidden="true" />}
        accent={accent}
        renderInline={renderInline}
      />

      <div className="grid gap-3.5 md:grid-cols-2">
        {sides.map(({ side, fallback }, idx) => {
          const resolvedTone = (side.tone as VisualTone) || fallback;
          const t = getTone(resolvedTone, fallback);
          const isBad = resolvedTone === 'rose';
          const isGood = resolvedTone === 'emerald';
          return (
            <div
              key={idx}
              className={cn(
                'flex flex-col justify-between rounded-xl border border-t-2 p-3.5',
                t.cardBorder,
                t.cardTopBorder,
                t.cardBg
              )}
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {side.badge && (
                    <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold', t.badge)}>
                      {isBad ? (
                        <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                      ) : isGood ? (
                        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                      ) : null}
                      <span>{side.badge}</span>
                    </span>
                  )}
                  <h5 className="text-sm font-bold text-white leading-snug">{renderInline(side.title)}</h5>
                </div>

                {side.code && <MiniCodeSnippet code={side.code} lang={side.lang ?? 'yaml'} />}

                {side.bullets && side.bullets.length > 0 && (
                  <ul className="space-y-1.5 pt-0.5">
                    {side.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-200 leading-snug">
                        {isBad ? (
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', t.title)} aria-hidden="true" />
                        )}
                        <span className="min-w-0 flex-1">{renderInline(b)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

/* ---------- 6. TROUBLESHOOTING SYMPTOM -> CAUSE & FIX ---------- */
interface TroubleshootRowItem {
  symptom: string;
  badge?: string;
  tone?: string;
  cause: string;
  fix: string;
  cmd?: string;
}

interface TroubleshootSpec {
  kind: 'troubleshoot';
  title?: string;
  subtitle?: string;
  items: TroubleshootRowItem[];
}

const VisualTroubleshootMatrix: React.FC<{
  spec: TroubleshootSpec;
  accent: DevOpsAccent;
  renderInline: (text: string) => React.ReactNode;
}> = ({ spec, accent, renderInline }) => {
  const items = Array.isArray(spec.items) ? spec.items : [];
  if (!items.length) return null;

  return (
    <section className="my-4 rounded-xl border border-slate-800 bg-slate-950/65 p-3.5 sm:p-4 shadow-xs">
      <BlockHeader
        eyebrow="Bảng khám bệnh · Lỗi thường gặp & cách khắc phục"
        title={spec.title}
        subtitle={spec.subtitle}
        icon={<Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />}
        accent={accent}
        renderInline={renderInline}
      />

      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const t = getTone(item.tone, 'rose');
          return (
            <div
              key={idx}
              className="grid gap-2.5 rounded-xl border border-slate-800 bg-slate-900/75 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:gap-4"
            >
              {/* Symptom & Cause */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0', t.title)} aria-hidden="true" />
                  <span className="font-mono text-xs sm:text-[13px] font-bold text-white">{item.symptom}</span>
                  {item.badge && (
                    <span className={cn('rounded border px-1.5 py-0.2 font-mono text-[10px] font-bold', t.badge)}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="pl-5 text-xs text-slate-400 leading-relaxed">{renderInline(item.cause)}</p>
              </div>

              {/* Fix & Command */}
              <div className="space-y-1.5 border-t border-slate-800/80 pt-2 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                <div className="flex items-start gap-1.5 text-xs sm:text-[13px] text-slate-200 leading-snug">
                  <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span className="min-w-0 flex-1">{renderInline(item.fix)}</span>
                </div>
                {item.cmd && <MiniCodeSnippet code={item.cmd} lang="shell" />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

/* ---------- 7. HYBRID VISUAL ILLUSTRATION + LIGHTBOX ---------- */
interface IllustrationSpec {
  kind: 'illustration';
  src?: string;
  diagram?: string;
  alt?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  callouts?: IllustrationCalloutItem[];
}

/* ---------- MAIN ENTRY ---------- */
export const VisualLessonBlock: React.FC<{
  rawYaml: string;
  accent: DevOpsAccent;
  renderInline: (text: string) => React.ReactNode;
  fallbackCode?: (code: string) => React.ReactNode;
}> = ({ rawYaml, accent, renderInline, fallbackCode }) => {
  let parsed: Record<string, unknown> | null = null;
  try {
    const doc = YAML.parse(rawYaml);
    if (doc && typeof doc === 'object') {
      parsed = doc as Record<string, unknown>;
    }
  } catch {
    parsed = null;
  }

  if (!parsed || typeof parsed.kind !== 'string') {
    return fallbackCode ? <>{fallbackCode(rawYaml)}</> : null;
  }

  switch (parsed.kind) {
    case 'illustration': {
      const spec = parsed as unknown as IllustrationSpec;
      return (
        <IllustrationFigure
          src={spec.src}
          diagram={spec.diagram}
          alt={spec.alt}
          badge={spec.badge}
          title={spec.title}
          subtitle={spec.subtitle}
          caption={spec.caption}
          callouts={spec.callouts}
          accent={accent}
          renderInline={renderInline}
        />
      );
    }
    case 'flow':
      return <VisualFlowDiagram spec={parsed as unknown as FlowSpec} accent={accent} renderInline={renderInline} />;
    case 'layers':
      return <VisualLayersDiagram spec={parsed as unknown as LayersSpec} accent={accent} renderInline={renderInline} />;
    case 'groups':
      return <VisualGroupsGrid spec={parsed as unknown as GroupsSpec} accent={accent} renderInline={renderInline} />;
    case 'anatomy':
      return <VisualAnatomyList spec={parsed as unknown as AnatomySpec} accent={accent} renderInline={renderInline} />;
    case 'compare':
      return <VisualCompareCards spec={parsed as unknown as CompareSpec} accent={accent} renderInline={renderInline} />;
    case 'troubleshoot':
      return (
        <VisualTroubleshootMatrix
          spec={parsed as unknown as TroubleshootSpec}
          accent={accent}
          renderInline={renderInline}
        />
      );
    default:
      return fallbackCode ? <>{fallbackCode(rawYaml)}</> : null;
  }
};

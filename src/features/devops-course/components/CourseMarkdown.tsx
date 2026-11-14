import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookmarkCheck,
  Check,
  CheckCircle2,
  Copy,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Target,
  Terminal,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import {
  detectLanguageFromFence,
  renderHighlightedConfig,
  renderHighlightedConfigLine,
} from '../configHighlighter';
import type { DevOpsAccent, EditorLanguage } from '../types';
import { VisualLessonBlock } from './VisualLessonBlocks';
import { IllustrationFigure } from '@/components/common/IllustrationLightbox';
import { cn } from '@/utils/cn';

const LANG_LABEL: Record<EditorLanguage, string> = {
  yaml: 'YAML Manifest',
  dockerfile: 'Dockerfile',
  shell: 'Terminal / CLI',
  redis: 'Redis CLI',
  'redis-conf': 'redis.conf',
};

export const ConfigCodeView: React.FC<{
  code: string;
  language?: EditorLanguage;
  label?: string;
  numbered?: boolean;
  className?: string;
  maxHeight?: string;
}> = ({ code, language = 'yaml', label, numbered = false, className, maxHeight }) => {
  const isLight = useStore((s) => s.resolvedColorScheme) === 'light';
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, '').split('\n');
  const headerLabel = label ?? LANG_LABEL[language] ?? language.toUpperCase();

  return (
    <div
      className={cn(
        'group relative my-3.5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xs',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/75 px-3 py-1.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <Terminal className="h-3 w-3 text-slate-500" aria-hidden="true" />
          <span>{headerLabel}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          aria-label="Sao chép cấu hình"
          className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Đã chép</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Chép</span>
            </>
          )}
        </button>
      </div>
      <div
        className="overflow-auto p-3 font-mono text-[13px] leading-relaxed"
        style={maxHeight ? { maxHeight } : undefined}
      >
        {numbered ? (
          <table className="border-collapse">
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="select-none pr-4 text-right align-top text-slate-600">{i + 1}</td>
                  <td className="whitespace-pre text-slate-200">
                    {renderHighlightedConfigLine(l, language, isLight) || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="whitespace-pre text-slate-200">
            {renderHighlightedConfig(code.replace(/\n$/, ''), language, isLight)}
          </pre>
        )}
      </div>
    </div>
  );
};

let keySeq = 0;
const k = () => `dk${keySeq++}`;

const INLINE_TONE_CLS: Record<string, string> = {
  sky: 'font-semibold text-sky-300 underline decoration-sky-500/45 decoration-dotted underline-offset-4',
  cyan: 'font-semibold text-cyan-300 underline decoration-cyan-500/45 decoration-dotted underline-offset-4',
  emerald: 'font-semibold text-emerald-300 underline decoration-emerald-500/45 decoration-dotted underline-offset-4',
  amber: 'font-semibold text-amber-300 underline decoration-amber-500/45 decoration-dotted underline-offset-4',
  rose: 'font-semibold text-rose-300 underline decoration-rose-500/45 decoration-dotted underline-offset-4',
  violet: 'font-semibold text-violet-300 underline decoration-violet-500/45 decoration-dotted underline-offset-4',
};

const INLINE_BADGE_CLS: Record<string, string> = {
  sky: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
  cyan: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
  emerald: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  amber: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  rose: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
  violet: 'border-violet-500/40 bg-violet-500/15 text-violet-300',
};

export function renderCourseInline(src: string, accent: DevOpsAccent = 'sky'): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const codeTone =
    accent === 'cyan'
      ? 'text-cyan-300'
      : accent === 'amber'
        ? 'text-amber-300'
        : accent === 'rose'
          ? 'text-rose-300'
          : accent === 'emerald'
            ? 'text-emerald-300'
            : 'text-sky-300';
  const re =
    /`([^`]+)`|<kbd>(.*?)<\/kbd>|==(.+?)==|\[!badge:(?:(sky|cyan|emerald|amber|rose|violet):)?([^\]]+)\]|\{(sky|cyan|emerald|amber|rose|violet):([^}]+)\}|\*\*(.+?)\*\*|(?<![*\w])\*([^*\s][^*]*?)\*(?![*\w])|\[([^\]]+)\]\((https?:[^)\s]+)\)|\[([^\]]+)\]\([^)]*\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <code
          key={k()}
          className={cn(
            'rounded border border-slate-700/70 bg-slate-800/90 px-1.5 py-0.5 font-mono text-[0.86em]',
            codeTone
          )}
        >
          {m[1]}
        </code>
      );
    } else if (m[2] !== undefined) {
      const hasMacCmd = m[2].includes('⌘');
      out.push(
        <kbd
          key={k()}
          className={cn(
            'rounded border border-slate-600 bg-slate-800 px-1.5 font-mono text-[0.8em] text-slate-200',
            hasMacCmd && 'hidden sm:inline-block'
          )}
        >
          {m[2]}
        </kbd>
      );
    } else if (m[3] !== undefined) {
      out.push(
        <mark key={k()} className="pylearn-marker">
          {renderCourseInline(m[3], accent)}
        </mark>
      );
    } else if (m[5] !== undefined) {
      const badgeTone =
        m[4] ??
        (accent === 'cyan'
          ? 'cyan'
          : accent === 'amber'
            ? 'amber'
            : accent === 'rose'
              ? 'rose'
              : accent === 'emerald'
                ? 'emerald'
                : 'sky');
      out.push(
        <span
          key={k()}
          className={cn(
            'mx-0.5 inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide align-middle',
            INLINE_BADGE_CLS[badgeTone] ?? INLINE_BADGE_CLS.sky
          )}
        >
          {m[5]}
        </span>
      );
    } else if (m[6] !== undefined && m[7] !== undefined) {
      out.push(
        <span key={k()} className={INLINE_TONE_CLS[m[6]] ?? INLINE_TONE_CLS.sky}>
          {renderCourseInline(m[7], accent)}
        </span>
      );
    } else if (m[8] !== undefined) {
      out.push(
        <strong key={k()} className="font-semibold text-white">
          {renderCourseInline(m[8], accent)}
        </strong>
      );
    } else if (m[9] !== undefined) {
      out.push(<em key={k()}>{renderCourseInline(m[9], accent)}</em>);
    } else if (m[10] !== undefined) {
      out.push(
        <a
          key={k()}
          href={m[11]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
        >
          {m[10]}
        </a>
      );
    } else if (m[12] !== undefined) {
      out.push(m[12]);
    }
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

export const CourseInline: React.FC<{ text: string; accent?: DevOpsAccent }> = ({ text, accent = 'sky' }) => (
  <>{renderCourseInline(text, accent)}</>
);

export interface LessonSectionMeta {
  id: string;
  num?: string;
  title: string;
}

function makeSectionId(index: number) {
  return `lesson-sec-${index + 1}`;
}

function stripInlineSyntax(raw: string): string {
  return raw
    .replace(/\[!badge:(?:[a-z]+:)?([^\]]+)\]/g, '$1')
    .replace(/\{(?:sky|cyan|emerald|amber|rose|violet):([^}]+)\}/g, '$1')
    .replace(/==(.+?)==/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .trim();
}

export function extractMarkdownSections(src: string): LessonSectionMeta[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const sections: LessonSectionMeta[] = [];
  let inFence = false;
  let secIdx = 0;

  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^##\s+(.*)/);
    if (m) {
      const rawTitle = stripInlineSyntax(m[1]);
      const numMatch = rawTitle.match(/^(\d+)[.)]\s+(.*)$/);
      sections.push({
        id: makeSectionId(secIdx++),
        num: numMatch ? numMatch[1] : String(secIdx),
        title: numMatch ? numMatch[2] : rawTitle,
      });
    }
  }
  return sections;
}

const splitCells = (l: string) =>
  l
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.replace(/\\\|/g, '|').trim());

const LIST_RE = /^\s*([-*]|\d+\.)\s+/;

type CalloutKind = 'analogy' | 'tip' | 'warning' | 'important' | 'remember' | 'quote';

const CALLOUT_STYLES: Record<
  CalloutKind,
  {
    defaultTitle: string;
    wrapper: string;
    titleCls: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  analogy: {
    defaultTitle: 'Hãy hình dung như sau',
    wrapper: 'border border-indigo-500/40 bg-indigo-500/[0.07] rounded-xl',
    titleCls: 'text-indigo-300',
    icon: Lightbulb,
  },
  tip: {
    defaultTitle: 'Mẹo thực chiến Production',
    wrapper: 'border-2 border-dashed border-emerald-500/45 bg-emerald-500/[0.06] rounded-xl',
    titleCls: 'text-emerald-300',
    icon: Sparkles,
  },
  warning: {
    defaultTitle: 'Bẫy cấu hình & cảnh báo quan trọng',
    wrapper: 'border border-rose-500/45 bg-rose-500/[0.07] rounded-xl',
    titleCls: 'text-rose-300',
    icon: ShieldAlert,
  },
  important: {
    defaultTitle: 'Nguyên tắc cốt lõi cần nắm',
    wrapper: 'border border-sky-500/40 bg-sky-500/[0.07] rounded-xl',
    titleCls: 'text-sky-300',
    icon: Target,
  },
  remember: {
    defaultTitle: 'Ghi nhớ bỏ túi',
    wrapper: 'border border-amber-500/45 bg-amber-500/[0.07] rounded-xl',
    titleCls: 'text-amber-300',
    icon: BookmarkCheck,
  },
  quote: {
    defaultTitle: '',
    wrapper: 'border-l-4 border-sky-500/70 bg-slate-900/80 rounded-r-xl',
    titleCls: 'text-sky-300',
    icon: Lightbulb,
  },
};

function resolveCalloutTag(tag: string): CalloutKind {
  const upper = tag.toUpperCase();
  if (upper === 'ANALOGY' || upper === 'MENTAL') return 'analogy';
  if (upper === 'TIP' || upper === 'PROTIP') return 'tip';
  if (upper === 'WARNING' || upper === 'CAUTION' || upper === 'DANGER' || upper === 'PITFALL' || upper === 'TRAP') return 'warning';
  if (upper === 'REMEMBER' || upper === 'SUMMARY' || upper === 'KEY') return 'remember';
  return 'important';
}

function parseBlocks(src: string, accent: DevOpsAccent): React.ReactNode[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const out: React.ReactNode[] = [];
  const h3Tone =
    accent === 'cyan'
      ? 'text-cyan-300'
      : accent === 'amber'
        ? 'text-amber-300'
        : accent === 'rose'
          ? 'text-rose-300'
          : accent === 'emerald'
            ? 'text-emerald-300'
            : 'text-sky-300';
  const stepBadgeCls =
    accent === 'cyan'
      ? 'border-cyan-500/45 bg-cyan-500/15 text-cyan-300'
      : accent === 'amber'
        ? 'border-amber-500/45 bg-amber-500/15 text-amber-300'
        : accent === 'rose'
          ? 'border-rose-500/45 bg-rose-500/15 text-rose-300'
          : accent === 'emerald'
            ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-300'
            : 'border-sky-500/45 bg-sky-500/15 text-sky-300';
  const h2RuleCls =
    accent === 'cyan'
      ? 'from-cyan-500/70 via-cyan-500/20 to-transparent'
      : accent === 'amber'
        ? 'from-amber-500/70 via-amber-500/20 to-transparent'
        : accent === 'rose'
          ? 'from-rose-500/70 via-rose-500/20 to-transparent'
          : accent === 'emerald'
            ? 'from-emerald-500/70 via-emerald-500/20 to-transparent'
            : 'from-sky-500/70 via-sky-500/20 to-transparent';
  const arrowTone =
    accent === 'cyan'
      ? 'text-cyan-400'
      : accent === 'amber'
        ? 'text-amber-400'
        : accent === 'rose'
          ? 'text-rose-400'
          : accent === 'emerald'
            ? 'text-emerald-400'
            : 'text-sky-400';

  let h2Index = 0;
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    const fence = l.match(/^```\s*([a-zA-Z0-9_:-]*)(?:\s+(.*))?$/);
    if (fence) {
      const fenceTag = (fence[1] ?? '').trim().toLowerCase();
      const fenceTitle = fence[2]?.trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      const rawContent = buf.join('\n');

      if (fenceTag === 'visual' || fenceTag.startsWith('visual:')) {
        out.push(
          <VisualLessonBlock
            key={k()}
            rawYaml={rawContent}
            accent={accent}
            renderInline={(txt) => renderCourseInline(txt, accent)}
            fallbackCode={(fallback) => <ConfigCodeView code={fallback} language="yaml" />}
          />
        );
        continue;
      }

      const lang = detectLanguageFromFence(fenceTag);
      out.push(<ConfigCodeView key={k()} code={rawContent} language={lang} label={fenceTitle} />);
      continue;
    }

    let m: RegExpMatchArray | null;
    if ((m = l.match(/^(#{1,3})\s+(.*)/))) {
      const level = m[1].length;
      const rawHeading = m[2].trim();
      if (level === 1) {
        out.push(
          <div key={k()} className="mb-4 mt-1 rounded-xl border-l-4 border-amber-400/80 bg-slate-950/60 px-4 py-2.5">
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
              {renderCourseInline(rawHeading, accent)}
            </h2>
          </div>
        );
      } else if (level === 2) {
        const secId = makeSectionId(h2Index++);
        const numMatch = rawHeading.match(/^(\d+)[.)]\s+(.*)$/);
        const numLabel = numMatch ? numMatch[1] : String(h2Index);
        const cleanTitle = numMatch ? numMatch[2] : rawHeading;
        out.push(
          <div key={k()} id={secId} className="mb-3 mt-8 scroll-mt-16">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-extrabold shadow-2xs',
                  stepBadgeCls
                )}
              >
                {numLabel}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                {renderCourseInline(cleanTitle, accent)}
              </h2>
            </div>
            <div className={cn('mt-2 h-[2px] w-full rounded-full bg-gradient-to-r', h2RuleCls)} />
          </div>
        );
      } else {
        out.push(
          <h3 key={k()} className={cn('mb-1.5 mt-5 flex items-center gap-1.5 text-base font-bold', h3Tone)}>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{renderCourseInline(rawHeading, accent)}</span>
          </h3>
        );
      }
      i++;
      continue;
    }

    if (/^---+\s*$/.test(l)) {
      i++;
      continue;
    }

    if (/^\s*\|/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) {
      const head = splitCells(l);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(splitCells(lines[i++]));
      out.push(
        <div key={k()} className="my-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50 shadow-2xs">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-900/95">
              <tr>
                {head.map((h, j) => (
                  <th
                    key={j}
                    className="border-b border-slate-800 px-3.5 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wide text-slate-200"
                  >
                    {renderCourseInline(h, accent)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, j) => (
                <tr key={j} className="border-b border-slate-800/60 transition-colors hover:bg-slate-900/50 last:border-0">
                  {r.map((c, n) => (
                    <td key={n} className="px-3.5 py-2.5 align-top text-slate-300 leading-relaxed">
                      {renderCourseInline(c, accent)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^>\s?/.test(l)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));

      const firstLine = buf[0]?.trim() ?? '';
      const alertMatch = firstLine.match(/^\[!([A-Za-z]+)\](?:\s+(.*))?$/);
      if (alertMatch) {
        const kind = resolveCalloutTag(alertMatch[1]);
        const style = CALLOUT_STYLES[kind];
        const Icon = style.icon;
        const customTitle = alertMatch[2]?.trim() || style.defaultTitle;
        const bodyLines = buf.slice(1);
        out.push(
          <aside key={k()} className={cn('my-4 p-3.5 sm:p-4', style.wrapper)}>
            <div className={cn('mb-1.5 flex items-center gap-2 font-mono text-xs font-extrabold uppercase tracking-wide', style.titleCls)}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{renderCourseInline(customTitle, accent)}</span>
            </div>
            <div className="text-sm text-slate-200 leading-relaxed [&>p]:my-1.5 [&>ul]:my-1.5">
              {parseBlocks(bodyLines.join('\n'), accent)}
            </div>
          </aside>
        );
      } else {
        const quoteBorder =
          accent === 'cyan'
            ? 'border-cyan-500/70'
            : accent === 'amber'
              ? 'border-amber-500/70'
              : accent === 'rose'
                ? 'border-rose-500/70'
                : accent === 'emerald'
                  ? 'border-emerald-500/70'
                  : 'border-sky-500/70';
        out.push(
          <blockquote
            key={k()}
            className={cn(
              'my-4 rounded-r-xl border-l-4 bg-slate-950/75 px-4 py-2.5 text-slate-200 shadow-2xs [&>p]:my-1.5',
              quoteBorder
            )}
          >
            {parseBlocks(buf.join('\n'), accent)}
          </blockquote>
        );
      }
      continue;
    }

    if (LIST_RE.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const rawItems: string[] = [];
      while (i < lines.length && LIST_RE.test(lines[i])) {
        let t = lines[i++].replace(LIST_RE, '');
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !LIST_RE.test(lines[i])) t += ' ' + lines[i++].trim();
        rawItems.push(t);
      }

      const hasSpecialMarkers = !ordered && rawItems.some((it) => /^\[([xX!>])\]\s+/.test(it));
      if (hasSpecialMarkers) {
        out.push(
          <ul key={k()} className="my-3 space-y-2 text-slate-300">
            {rawItems.map((it) => {
              const marker = it.match(/^\[([xX!>])\]\s+(.*)$/);
              if (!marker) {
                return (
                  <li key={k()} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
                    <span className="min-w-0 flex-1">{renderCourseInline(it, accent)}</span>
                  </li>
                );
              }
              const sym = marker[1].toLowerCase();
              const content = marker[2];
              return (
                <li key={k()} className="flex items-start gap-2.5 leading-relaxed">
                  {sym === 'x' ? (
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  ) : sym === '!' ? (
                    <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                  ) : (
                    <ArrowRight className={cn('mt-1 h-4 w-4 shrink-0', arrowTone)} aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">{renderCourseInline(content, accent)}</span>
                </li>
              );
            })}
          </ul>
        );
      } else {
        const Tag = ordered ? 'ol' : 'ul';
        out.push(
          <Tag
            key={k()}
            className={cn(
              'my-2.5 space-y-1.5 pl-6 text-slate-300',
              ordered ? 'list-decimal marker:font-mono marker:font-bold marker:text-sky-400' : 'list-disc marker:text-slate-500'
            )}
          >
            {rawItems.map((it) => (
              <li key={k()} className="leading-relaxed">
                {renderCourseInline(it, accent)}
              </li>
            ))}
          </Tag>
        );
      }
      continue;
    }

    if (!l.trim()) {
      i++;
      continue;
    }

    const imgMatch = l.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)$/);
    if (imgMatch) {
      out.push(
        <IllustrationFigure
          key={k()}
          src={imgMatch[2]}
          alt={imgMatch[1]}
          title={imgMatch[3] || imgMatch[1]}
          accent={accent}
          renderInline={(txt) => renderCourseInline(txt, accent)}
        />
      );
      i++;
      continue;
    }

    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,3}\s|>|\s*\|)/.test(lines[i]) && !LIST_RE.test(lines[i])) {
      buf.push(lines[i++]);
    }
    if (!buf.length) buf.push(lines[i++]);
    out.push(
      <p key={k()} className="my-2.5 text-slate-300 leading-relaxed">
        {renderCourseInline(buf.join(' '), accent)}
      </p>
    );
  }
  return out;
}

export const CourseMarkdown: React.FC<{ source: string; accent?: DevOpsAccent; className?: string }> = ({
  source,
  accent = 'sky',
  className,
}) => <div className={cn('leading-7 text-[15px]', className)}>{parseBlocks(source, accent)}</div>;

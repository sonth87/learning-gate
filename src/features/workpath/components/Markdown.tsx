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
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { VisualLessonBlock } from '@/features/devops-course/components/VisualLessonBlocks';
import { IllustrationFigure } from '@/components/common/IllustrationLightbox';
import { cn } from '@/utils/cn';

/** Khối code có tô màu cú pháp + nút sao chép. Dùng chung cho lesson, đề bài, bài đọc code thật. */
export const CodeView: React.FC<{
  code: string;
  numbered?: boolean;
  className?: string;
  maxHeight?: string;
  label?: string;
}> = ({ code, numbered = false, className, maxHeight, label }) => {
  const isLight = useStore((s) => s.resolvedColorScheme) === 'light';
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <div className={cn('group relative my-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950', className)}>
      {label && (
        <div className="border-b border-slate-800/80 bg-slate-900/75 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        aria-label="Sao chép code"
        className="absolute right-2 top-2 z-10 rounded-md border border-slate-700 bg-slate-900/90 p-1 text-slate-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <div className="overflow-auto p-3 font-mono text-[13px] leading-relaxed" style={maxHeight ? { maxHeight } : undefined}>
        {numbered ? (
          <table className="border-collapse">
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="select-none pr-4 text-right align-top text-slate-600">{i + 1}</td>
                  <td className="whitespace-pre text-slate-200">{renderHighlightedPython(l, isLight) || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="whitespace-pre text-slate-200">{renderHighlightedPython(code.replace(/\n$/, ''), isLight)}</pre>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ inline */

let keySeq = 0;
const k = () => `k${keySeq++}`;

const INLINE_TONE_CLS: Record<string, string> = {
  emerald: 'font-semibold text-emerald-300 underline decoration-emerald-500/45 decoration-dotted underline-offset-4',
  sky: 'font-semibold text-sky-300 underline decoration-sky-500/45 decoration-dotted underline-offset-4',
  cyan: 'font-semibold text-cyan-300 underline decoration-cyan-500/45 decoration-dotted underline-offset-4',
  amber: 'font-semibold text-amber-300 underline decoration-amber-500/45 decoration-dotted underline-offset-4',
  rose: 'font-semibold text-rose-300 underline decoration-rose-500/45 decoration-dotted underline-offset-4',
  violet: 'font-semibold text-violet-300 underline decoration-violet-500/45 decoration-dotted underline-offset-4',
};

const INLINE_BADGE_CLS: Record<string, string> = {
  emerald: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  sky: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
  cyan: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
  amber: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  rose: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
  violet: 'border-violet-500/40 bg-violet-500/15 text-violet-300',
};

export function renderInline(src: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re =
    /`([^`]+)`|<kbd>(.*?)<\/kbd>|==(.+?)==|\[!badge:(?:(sky|cyan|emerald|amber|rose|violet):)?([^\]]+)\]|\{(sky|cyan|emerald|amber|rose|violet):([^}]+)\}|\*\*(.+?)\*\*|(?<![*\w])\*([^*\s][^*]*?)\*(?![*\w])|\[([^\]]+)\]\((https?:[^)\s]+)\)|\[([^\]]+)\]\([^)]*\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <code key={k()} className="rounded border border-slate-700/60 bg-slate-800/90 px-1.5 py-0.5 font-mono text-[0.88em] text-emerald-300">
          {m[1]}
        </code>
      );
    } else if (m[2] !== undefined) {
      out.push(
        <kbd key={k()} className="rounded border border-slate-600 bg-slate-800 px-1.5 font-mono text-[0.8em] text-slate-200">
          {m[2]}
        </kbd>
      );
    } else if (m[3] !== undefined) {
      out.push(
        <mark key={k()} className="pylearn-marker">
          {renderInline(m[3])}
        </mark>
      );
    } else if (m[5] !== undefined) {
      const badgeTone = m[4] ?? 'emerald';
      out.push(
        <span
          key={k()}
          className={cn(
            'mx-0.5 inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide align-middle',
            INLINE_BADGE_CLS[badgeTone] ?? INLINE_BADGE_CLS.emerald
          )}
        >
          {m[5]}
        </span>
      );
    } else if (m[6] !== undefined && m[7] !== undefined) {
      out.push(
        <span key={k()} className={INLINE_TONE_CLS[m[6]] ?? INLINE_TONE_CLS.emerald}>
          {renderInline(m[7])}
        </span>
      );
    } else if (m[8] !== undefined) {
      out.push(
        <strong key={k()} className="font-semibold text-white">
          {renderInline(m[8])}
        </strong>
      );
    } else if (m[9] !== undefined) {
      out.push(<em key={k()}>{renderInline(m[9])}</em>);
    } else if (m[10] !== undefined) {
      out.push(
        <a key={k()} href={m[11]} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline underline-offset-2 hover:text-sky-300">
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

export const Inline: React.FC<{ text: string }> = ({ text }) => <>{renderInline(text)}</>;

/* ------------------------------------------------------------------- block */

const splitCells = (l: string) =>
  l
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.replace(/\\\|/g, '|').trim());

const LIST_RE = /^\s*([-*]|\d+\.)\s+/;

type PyCalloutKind = 'analogy' | 'tip' | 'warning' | 'important' | 'remember';

const PY_CALLOUT_STYLES: Record<
  PyCalloutKind,
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
    defaultTitle: 'Mẹo Pythonic thực chiến',
    wrapper: 'border-2 border-dashed border-emerald-500/45 bg-emerald-500/[0.06] rounded-xl',
    titleCls: 'text-emerald-300',
    icon: Sparkles,
  },
  warning: {
    defaultTitle: 'Bẫy hay gặp cần tránh',
    wrapper: 'border border-rose-500/45 bg-rose-500/[0.07] rounded-xl',
    titleCls: 'text-rose-300',
    icon: ShieldAlert,
  },
  important: {
    defaultTitle: 'Nguyên tắc cốt lõi cần nắm',
    wrapper: 'border border-emerald-500/40 bg-emerald-500/[0.07] rounded-xl',
    titleCls: 'text-emerald-300',
    icon: Target,
  },
  remember: {
    defaultTitle: 'Ghi nhớ bỏ túi',
    wrapper: 'border border-amber-500/45 bg-amber-500/[0.07] rounded-xl',
    titleCls: 'text-amber-300',
    icon: BookmarkCheck,
  },
};

function resolvePyCalloutTag(tag: string): PyCalloutKind {
  const upper = tag.toUpperCase();
  if (upper === 'ANALOGY' || upper === 'MENTAL') return 'analogy';
  if (upper === 'TIP' || upper === 'PROTIP') return 'tip';
  if (upper === 'WARNING' || upper === 'CAUTION' || upper === 'DANGER' || upper === 'PITFALL' || upper === 'TRAP') return 'warning';
  if (upper === 'REMEMBER' || upper === 'SUMMARY' || upper === 'KEY') return 'remember';
  return 'important';
}

function parseBlocks(src: string): React.ReactNode[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const out: React.ReactNode[] = [];
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
            accent="emerald"
            renderInline={(txt) => renderInline(txt)}
            fallbackCode={(fallback) => <CodeView code={fallback} />}
          />
        );
        continue;
      }

      out.push(<CodeView key={k()} code={rawContent} label={fenceTitle} />);
      continue;
    }

    let m: RegExpMatchArray | null;
    if ((m = l.match(/^(#{1,3})\s+(.*)/))) {
      const level = m[1].length;
      const cls =
        level === 1
          ? 'mb-3 mt-1 text-2xl font-bold text-white'
          : level === 2
            ? 'mb-2.5 mt-8 border-b border-slate-800 pb-1.5 text-xl font-bold text-white'
            : 'mb-1.5 mt-5 flex items-center gap-1.5 text-base font-semibold text-emerald-300';
      if (level === 3) {
        out.push(
          <h3 key={k()} className={cls}>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
            <span>{renderInline(m[2])}</span>
          </h3>
        );
      } else {
        out.push(React.createElement(`h${level}`, { key: k(), className: cls }, renderInline(m[2])));
      }
      i++;
      continue;
    }

    if (/^---+\s*$/.test(l)) {
      out.push(<hr key={k()} className="my-5 border-slate-800" />);
      i++;
      continue;
    }

    if (/^\s*\|/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) {
      const head = splitCells(l);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(splitCells(lines[i++]));
      out.push(
        <div key={k()} className="my-3.5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-900">
              <tr>
                {head.map((h, j) => (
                  <th key={j} className="border-b border-slate-800 px-3 py-2 text-left font-semibold text-slate-200">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, j) => (
                <tr key={j} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-900/40">
                  {r.map((c, n) => (
                    <td key={n} className="px-3 py-2 align-top text-slate-300">
                      {renderInline(c)}
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
        const kind = resolvePyCalloutTag(alertMatch[1]);
        const style = PY_CALLOUT_STYLES[kind];
        const Icon = style.icon;
        const customTitle = alertMatch[2]?.trim() || style.defaultTitle;
        const bodyLines = buf.slice(1);
        out.push(
          <aside key={k()} className={cn('my-4 p-3.5 sm:p-4', style.wrapper)}>
            <div className={cn('mb-1.5 flex items-center gap-2 font-mono text-xs font-extrabold uppercase tracking-wide', style.titleCls)}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{renderInline(customTitle)}</span>
            </div>
            <div className="text-sm text-slate-200 leading-relaxed [&>p]:my-1.5 [&>ul]:my-1.5">
              {parseBlocks(bodyLines.join('\n'))}
            </div>
          </aside>
        );
      } else {
        out.push(
          <blockquote key={k()} className="my-3.5 rounded-r-xl border-l-4 border-emerald-500/70 bg-slate-900/80 px-4 py-2 text-slate-200 [&>p]:my-1.5">
            {parseBlocks(buf.join('\n'))}
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
                    <span className="min-w-0 flex-1">{renderInline(it)}</span>
                  </li>
                );
              }
              const sym = marker[1].toLowerCase();
              return (
                <li key={k()} className="flex items-start gap-2.5 leading-relaxed">
                  {sym === 'x' ? (
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  ) : sym === '!' ? (
                    <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">{renderInline(marker[2])}</span>
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
              'my-2 space-y-1 pl-6 text-slate-300',
              ordered ? 'list-decimal marker:font-mono marker:font-bold marker:text-emerald-400' : 'list-disc marker:text-slate-500'
            )}
          >
            {rawItems.map((it) => (
              <li key={k()} className="my-1 leading-relaxed">
                {renderInline(it)}
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
          accent="emerald"
          renderInline={(txt) => renderInline(txt)}
        />
      );
      i++;
      continue;
    }

    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,3}\s|>|\s*\|)/.test(lines[i]) && !LIST_RE.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) buf.push(lines[i++]);
    out.push(
      <p key={k()} className="my-2.5 text-slate-300 leading-relaxed">
        {renderInline(buf.join(' '))}
      </p>
    );
  }
  return out;
}

export const Markdown: React.FC<{ source: string; className?: string }> = ({ source, className }) => (
  <div className={cn('leading-7 text-[15px]', className)}>{parseBlocks(source)}</div>
);

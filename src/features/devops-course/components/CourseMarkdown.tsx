import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { detectLanguageFromFence, renderHighlightedConfig, renderHighlightedConfigLine } from '../configHighlighter';
import type { DevOpsAccent, EditorLanguage } from '../types';
import { cn } from '@/utils/cn';

export const ConfigCodeView: React.FC<{
  code: string;
  language?: EditorLanguage;
  numbered?: boolean;
  className?: string;
  maxHeight?: string;
}> = ({ code, language = 'yaml', numbered = false, className, maxHeight }) => {
  const isLight = useStore((s) => s.resolvedColorScheme) === 'light';
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <div className={cn('group relative my-3 overflow-hidden rounded-lg border border-slate-800 bg-slate-950', className)}>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        aria-label="Sao chép cấu hình"
        className="absolute right-2 top-2 z-10 rounded-md border border-slate-700 bg-slate-900/90 p-1.5 text-slate-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
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
                  <td className="whitespace-pre text-slate-200">{renderHighlightedConfigLine(l, language, isLight) || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="whitespace-pre text-slate-200">{renderHighlightedConfig(code.replace(/\n$/, ''), language, isLight)}</pre>
        )}
      </div>
    </div>
  );
};

let keySeq = 0;
const k = () => `dk${keySeq++}`;

export function renderCourseInline(src: string, accent: DevOpsAccent = 'sky'): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const codeTone = accent === 'cyan' ? 'text-cyan-300' : 'text-sky-300';
  const re =
    /`([^`]+)`|<kbd>(.*?)<\/kbd>|\*\*(.+?)\*\*|(?<![*\w])\*([^*\s][^*]*?)\*(?![*\w])|\[([^\]]+)\]\((https?:[^)\s]+)\)|\[([^\]]+)\]\([^)]*\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <code key={k()} className={cn('rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.88em]', codeTone)}>
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
        <strong key={k()} className="font-semibold text-white">
          {renderCourseInline(m[3], accent)}
        </strong>
      );
    } else if (m[4] !== undefined) {
      out.push(<em key={k()}>{renderCourseInline(m[4], accent)}</em>);
    } else if (m[5] !== undefined) {
      out.push(
        <a
          key={k()}
          href={m[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
        >
          {m[5]}
        </a>
      );
    } else if (m[7] !== undefined) {
      out.push(m[7]);
    }
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

export const CourseInline: React.FC<{ text: string; accent?: DevOpsAccent }> = ({ text, accent = 'sky' }) => (
  <>{renderCourseInline(text, accent)}</>
);

const splitCells = (l: string) =>
  l
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.replace(/\\\|/g, '|').trim());

const LIST_RE = /^\s*([-*]|\d+\.)\s+/;

function parseBlocks(src: string, accent: DevOpsAccent): React.ReactNode[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const out: React.ReactNode[] = [];
  const h3Tone = accent === 'cyan' ? 'text-cyan-300' : 'text-sky-300';
  const quoteBorder = accent === 'cyan' ? 'border-cyan-500/70' : 'border-sky-500/70';

  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    const fence = l.match(/^```\s*([a-zA-Z0-9_-]*)/);
    if (fence) {
      const lang = detectLanguageFromFence(fence[1] ?? '');
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(<ConfigCodeView key={k()} code={buf.join('\n')} language={lang} />);
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = l.match(/^(#{1,3})\s+(.*)/))) {
      const level = m[1].length;
      const cls =
        level === 1
          ? 'mb-3 mt-1 text-2xl font-bold text-white'
          : level === 2
            ? 'mb-2 mt-8 border-b border-slate-800 pb-1.5 text-xl font-bold text-white'
            : cn('mb-1.5 mt-5 text-base font-semibold', h3Tone);
      out.push(React.createElement(`h${level}`, { key: k(), className: cls }, renderCourseInline(m[2], accent)));
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
        <div key={k()} className="my-3 overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-900">
              <tr>
                {head.map((h, j) => (
                  <th key={j} className="border-b border-slate-800 px-3 py-2 text-left font-semibold text-slate-300">
                    {renderCourseInline(h, accent)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, j) => (
                <tr key={j} className="border-b border-slate-800/60 last:border-0">
                  {r.map((c, n) => (
                    <td key={n} className="px-3 py-2 align-top text-slate-300">
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
      out.push(
        <blockquote key={k()} className={cn('my-3 rounded-r-lg border-l-4 bg-slate-900/80 px-4 py-1 text-slate-300', quoteBorder)}>
          {parseBlocks(buf.join('\n'), accent)}
        </blockquote>
      );
      continue;
    }
    if (LIST_RE.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items: React.ReactNode[] = [];
      while (i < lines.length && LIST_RE.test(lines[i])) {
        let t = lines[i++].replace(LIST_RE, '');
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !LIST_RE.test(lines[i])) t += ' ' + lines[i++].trim();
        items.push(
          <li key={k()} className="my-1">
            {renderCourseInline(t, accent)}
          </li>
        );
      }
      const Tag = ordered ? 'ol' : 'ul';
      out.push(
        <Tag key={k()} className={cn('my-2 space-y-0.5 pl-6 text-slate-300', ordered ? 'list-decimal' : 'list-disc marker:text-slate-500')}>
          {items}
        </Tag>
      );
      continue;
    }
    if (!l.trim()) {
      i++;
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,3}\s|>|\s*\|)/.test(lines[i]) && !LIST_RE.test(lines[i])) {
      buf.push(lines[i++]);
    }
    if (!buf.length) buf.push(lines[i++]);
    out.push(
      <p key={k()} className="my-2.5 text-slate-300">
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

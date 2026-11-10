import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { cn } from '@/utils/cn';

/** Khối code có tô màu cú pháp + nút sao chép. Dùng chung cho lesson, đề bài, bài đọc code thật. */
export const CodeView: React.FC<{ code: string; numbered?: boolean; className?: string; maxHeight?: string }> = ({
  code,
  numbered = false,
  className,
  maxHeight,
}) => {
  const isLight = useStore((s) => s.resolvedColorScheme) === 'light';
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <div className={cn('group relative my-3 overflow-hidden rounded-lg border border-slate-800 bg-slate-950', className)}>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        aria-label="Sao chép code"
        className="absolute right-2 top-2 z-10 rounded-md border border-slate-700 bg-slate-900/90 p-1 text-slate-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
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

export function renderInline(src: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // Thứ tự ưu tiên: `code` → <kbd> → **đậm** → *nghiêng* → [chữ](http...)
  const re = /`([^`]+)`|<kbd>(.*?)<\/kbd>|\*\*(.+?)\*\*|(?<![*\w])\*([^*\s][^*]*?)\*(?![*\w])|\[([^\]]+)\]\((https?:[^)\s]+)\)|\[([^\]]+)\]\([^)]*\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    if (m[1] !== undefined)
      out.push(
        <code key={k()} className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.88em] text-emerald-300">
          {m[1]}
        </code>
      );
    else if (m[2] !== undefined)
      out.push(
        <kbd key={k()} className="rounded border border-slate-600 bg-slate-800 px-1.5 font-mono text-[0.8em] text-slate-200">
          {m[2]}
        </kbd>
      );
    else if (m[3] !== undefined)
      out.push(
        <strong key={k()} className="font-semibold text-white">
          {renderInline(m[3])}
        </strong>
      );
    else if (m[4] !== undefined) out.push(<em key={k()}>{renderInline(m[4])}</em>);
    else if (m[5] !== undefined)
      out.push(
        <a key={k()} href={m[6]} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline underline-offset-2 hover:text-sky-300">
          {m[5]}
        </a>
      );
    else if (m[7] !== undefined) out.push(m[7]); // liên kết tương đối: chỉ giữ chữ
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

function parseBlocks(src: string): React.ReactNode[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(<CodeView key={k()} code={buf.join('\n')} />);
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
            : 'mb-1.5 mt-5 text-base font-semibold text-emerald-300';
      out.push(React.createElement(`h${level}`, { key: k(), className: cls }, renderInline(m[2])));
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
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, j) => (
                <tr key={j} className="border-b border-slate-800/60 last:border-0">
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
      out.push(
        <blockquote key={k()} className="my-3 rounded-r-lg border-l-4 border-emerald-500/70 bg-slate-900/80 px-4 py-1 text-slate-300">
          {parseBlocks(buf.join('\n'))}
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
            {renderInline(t)}
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
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,3}\s|>|\s*\|)/.test(lines[i]) && !LIST_RE.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) buf.push(lines[i++]);
    out.push(
      <p key={k()} className="my-2.5 text-slate-300">
        {renderInline(buf.join(' '))}
      </p>
    );
  }
  return out;
}

export const Markdown: React.FC<{ source: string; className?: string }> = ({ source, className }) => (
  <div className={cn('leading-7 text-[15px]', className)}>{parseBlocks(source)}</div>
);

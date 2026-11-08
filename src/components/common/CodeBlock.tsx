import React, { useState } from 'react';
import { Check, Copy, Terminal, MessageSquareCode } from 'lucide-react';
import { CodeLineAnnotation } from '@/types/curriculum.types';
import { findGlossaryTerm } from '@/data/glossary';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { RichTextWithTerms } from './RichTextWithTerms';

interface CodeBlockProps {
  title?: string;
  description?: string;
  code: string;
  output?: string;
  annotations?: CodeLineAnnotation[];
  language?: 'python' | 'typescript';
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  title,
  description,
  code,
  output,
  annotations = [],
  language = 'python',
}) => {
  const [copied, setCopied] = useState(false);
  const showTermPopover = useNavigationStore((s) => s.showTermPopover);
  const hideTermPopover = useNavigationStore((s) => s.hideTermPopover);

  const lines = code.split('\n');
  const annotationMap = new Map<number, string>();
  for (const a of annotations) {
    annotationMap.set(a.line, a.explanation);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Tokenize a line of Python code so keywords/builtins/dunders are hoverable!
  const renderCodeLineWithHover = (lineText: string) => {
    const commentIdx = lineText.indexOf('#');
    const codePart = commentIdx >= 0 ? lineText.slice(0, commentIdx) : lineText;
    const commentPart = commentIdx >= 0 ? lineText.slice(commentIdx) : '';

    const tokens = codePart.split(/([a-zA-Z_][a-zA-Z0-9_]*|@[a-zA-Z_][a-zA-Z0-9_.]*)/g);

    return (
      <>
        {tokens.map((tok, i) => {
          const cleanTok = tok.startsWith('@') ? tok.slice(1) : tok;
          const term = findGlossaryTerm( tok ) || findGlossaryTerm(cleanTok);
          if (term) {
            return (
              <span
                key={i}
                onMouseEnter={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  showTermPopover(
                    term.id,
                    { top: r.top, left: r.left, bottom: r.bottom, width: r.width },
                    false
                  );
                }}
                onMouseLeave={() => hideTermPopover(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  const r = e.currentTarget.getBoundingClientRect();
                  showTermPopover(
                    term.id,
                    { top: r.top, left: r.left, bottom: r.bottom, width: r.width },
                    true
                  );
                }}
                className="cursor-help text-amber-300 underline decoration-amber-500/40 decoration-dotted underline-offset-4 hover:bg-amber-500/20 rounded px-0.5 transition-colors"
              >
                {tok}
              </span>
            );
          }
          return <span key={i}>{tok}</span>;
        })}
        {commentPart && (
          <span className="text-emerald-400/80 italic">{commentPart}</span>
        )}
      </>
    );
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-lg">
      {(title || description) && (
        <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-900/70 px-4 py-2.5">
          <div>
            {title && (
              <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
            )}
            {description && (
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] uppercase text-slate-400">
              {language}
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Code Lines */}
      <div className="p-4 overflow-x-auto font-mono text-xs leading-6">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const hasNote = annotationMap.has(lineNum);
          return (
            <div
              key={lineNum}
              className={`group flex items-start gap-3 px-2 py-0.5 rounded ${
                hasNote ? 'bg-indigo-500/10 border-l-2 border-indigo-400' : 'hover:bg-slate-900/60'
              }`}
            >
              <span className="w-6 select-none text-right text-[11px] text-slate-600 shrink-0">
                {lineNum}
              </span>
              <span className="text-slate-100 whitespace-pre flex-1">
                {renderCodeLineWithHover(line)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Output Console */}
      {output && (
        <div className="border-t border-slate-800/80 bg-slate-900/50 px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <Terminal className="h-3.5 w-3.5" />
            <span>Kết quả chạy (Output):</span>
          </div>
          <pre className="font-mono text-xs text-emerald-200/90 whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}

      {/* Line-by-line Explanation */}
      {annotations.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-900/40 px-4 py-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
            <MessageSquareCode className="h-4 w-4" />
            <span>Giải thích chi tiết từng dòng code:</span>
          </div>
          <div className="grid gap-1.5">
            {annotations.map((item) => (
              <div
                key={item.line}
                className="flex items-start gap-2.5 rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs border border-slate-800/80"
              >
                <span className="shrink-0 rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[11px] font-bold text-indigo-300">
                  Dòng {item.line}
                </span>
                <div className="text-slate-300 leading-relaxed">
                  <RichTextWithTerms text={item.explanation} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

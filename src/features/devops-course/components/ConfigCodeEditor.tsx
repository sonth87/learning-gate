import React, { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import { useStore } from '@sonth87/device-layout';
import { renderHighlightedConfig } from '../configHighlighter';
import type { DevOpsAccent, EditorLanguage } from '../types';
import { cn } from '@/utils/cn';

/**
 * Trình soạn thảo nhẹ cho YAML / Dockerfile / Shell CLI:
 * - Textarea trong suốt đặt chồng lên lớp tô màu <pre>, giữ đúng vị trí con trỏ 1:1
 * - Tự thụt lề 2 dấu cách cho YAML, giữ mức thụt lề, Tab / Shift+Tab nhiều dòng, ⌘/ comment
 * - Tô nổi dòng lỗi khi bộ kiểm tra trả về số dòng
 * - Hàng phím nhanh cho điện thoại (< sm): Tab, : - { } [ ] " ' | / . _ $ ~
 */

export interface ConfigCodeEditorHandle {
  gotoLine: (line: number) => void;
  focus: () => void;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  language: EditorLanguage;
  accent?: DevOpsAccent;
  errorLine?: number | null;
  filename?: string;
  onRun?: () => void;
  onSubmit?: () => void;
  readOnly?: boolean;
  placeholder?: string;
  height?: string;
  className?: string;
  ariaLabel?: string;
}

const PAIRS: Record<string, string> = { '[': ']', '{': '}', '"': '"', "'": "'" };
const CLOSERS = new Set([']', '}', '"', "'"]);
const FONT: React.CSSProperties = {
  fontFamily: "var(--font-mono, 'JetBrains Mono', ui-monospace, Menlo, monospace)",
  fontSize: 13.5,
  lineHeight: 1.6,
  tabSize: 2,
};

const lineStartOf = (v: string, i: number) => v.lastIndexOf('\n', i - 1) + 1;

const MOBILE_QUICK_KEYS: { label: string; text?: string }[] = [
  { label: 'Tab' },
  ...[
    ':',
    '-',
    '{',
    '}',
    '[',
    ']',
    '"',
    "'",
    '|',
    '/',
    '.',
    '_',
    '$',
    '~',
  ].map((c) => ({ label: c, text: c })),
];

export const ConfigCodeEditor = forwardRef<ConfigCodeEditorHandle, Props>(function ConfigCodeEditor(
  {
    value,
    onChange,
    language,
    accent = 'sky',
    errorLine = null,
    filename,
    onRun,
    onSubmit,
    readOnly,
    placeholder,
    height = 'clamp(240px, 46vh, 540px)',
    className,
    ariaLabel = 'Trình soạn thảo cấu hình',
  },
  ref
) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const hlRef = useRef<HTMLPreElement>(null);
  const gutRef = useRef<HTMLDivElement>(null);
  const isLight = useStore((s) => s.resolvedColorScheme) === 'light';

  const stepSize = 2; // YAML / Dockerfile / Shell dùng 2 dấu cách chuẩn
  const lineCount = useMemo(() => value.split('\n').length, [value]);
  const highlighted = useMemo(
    () => renderHighlightedConfig(value + '\n', language, isLight, errorLine),
    [value, language, isLight, errorLine]
  );

  const sync = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    if (hlRef.current) {
      hlRef.current.scrollTop = ta.scrollTop;
      hlRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutRef.current) gutRef.current.scrollTop = ta.scrollTop;
  }, []);
  useLayoutEffect(sync, [value, sync]);

  const insert = useCallback(
    (text: string) => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      let ok = false;
      try {
        ok = text === '' ? document.execCommand('delete') : document.execCommand('insertText', false, text);
      } catch {
        ok = false;
      }
      if (!ok) {
        ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
        onChange(ta.value);
      }
    },
    [onChange]
  );

  const replaceRange = useCallback(
    (start: number, end: number, text: string, selStart?: number, selEnd?: number) => {
      const ta = taRef.current;
      if (!ta) return;
      ta.setSelectionRange(start, end);
      insert(text);
      if (selStart !== undefined) ta.setSelectionRange(selStart, selEnd ?? selStart);
    },
    [insert]
  );

  const blockRange = () => {
    const ta = taRef.current!;
    const v = ta.value;
    const s = ta.selectionStart;
    let e = ta.selectionEnd;
    if (e > s && v[e - 1] === '\n') e -= 1;
    const ls = lineStartOf(v, s);
    let le = v.indexOf('\n', e);
    if (le < 0) le = v.length;
    return { ls, le, block: v.slice(ls, le) };
  };

  const indent = () => {
    const ta = taRef.current!;
    const { selectionStart: s, selectionEnd: e, value: v } = ta;
    if (s === e) {
      insert(' '.repeat(stepSize - ((s - lineStartOf(v, s)) % stepSize)));
      return;
    }
    const { ls, le, block } = blockRange();
    const parts = block.split('\n');
    const pad = ' '.repeat(stepSize);
    replaceRange(ls, le, parts.map((l) => pad + l).join('\n'), s + stepSize, e + stepSize * parts.length);
  };

  const dedent = () => {
    const ta = taRef.current!;
    const { selectionStart: s, selectionEnd: e } = ta;
    const { ls, le, block } = blockRange();
    let first = 0;
    let total = 0;
    const out = block.split('\n').map((l, i) => {
      const m = l.match(/^( {1,2}|\t)/);
      const r = m ? m[0].length : 0;
      if (i === 0) first = r;
      total += r;
      return l.slice(r);
    });
    replaceRange(ls, le, out.join('\n'), Math.max(ls, s - first), Math.max(ls, e - total));
  };

  const toggleComment = () => {
    const ta = taRef.current!;
    const { selectionStart: s, selectionEnd: e } = ta;
    const { ls, le, block } = blockRange();
    const parts = block.split('\n');
    const real = parts.filter((l) => l.trim());
    const allCommented = real.length > 0 && real.every((l) => /^\s*#/.test(l));
    const minIndent = Math.min(...real.map((l) => (l.match(/^ */) as RegExpMatchArray)[0].length), 1e9);
    const text = parts
      .map((l) => (!l.trim() ? l : allCommented ? l.replace(/^(\s*)# ?/, '$1') : l.slice(0, minIndent) + '# ' + l.slice(minIndent)))
      .join('\n');
    if (s === e) {
      const caret = Math.max(ls, s + (text.length - block.length));
      replaceRange(ls, le, text, caret, caret);
    } else replaceRange(ls, le, text, ls, ls + text.length);
  };

  const newline = () => {
    const ta = taRef.current!;
    const s = ta.selectionStart;
    const v = ta.value;
    const before = v.slice(lineStartOf(v, s), s);
    const base = (before.match(/^[ \t]*/) as RegExpMatchArray)[0];
    let ind = base;
    if (language === 'yaml') {
      const clean = before.replace(/#.*$/, '').trimEnd();
      if (clean.endsWith(':') || clean.endsWith('|') || clean.endsWith('>')) {
        ind += '  ';
      }
    }
    const prev = v[s - 1];
    if ((prev === '[' || prev === '{') && PAIRS[prev] === v[s]) {
      insert('\n' + base + '  \n' + base);
      const pos = s + 1 + base.length + 2;
      ta.setSelectionRange(pos, pos);
      return;
    }
    insert('\n' + ind);
  };

  const onChar = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = taRef.current!;
    const ch = ev.key;
    const { selectionStart: s, selectionEnd: e, value: v } = ta;
    const next = v[s] ?? '';
    const prev = v[s - 1] ?? '';
    if (s !== e) {
      if (PAIRS[ch]) {
        ev.preventDefault();
        insert(ch + v.slice(s, e) + PAIRS[ch]);
        ta.setSelectionRange(s + 1, e + 1);
      }
      return;
    }
    if (CLOSERS.has(ch) && next === ch) {
      ev.preventDefault();
      ta.setSelectionRange(s + 1, s + 1);
      return;
    }
    if (!PAIRS[ch]) return;
    const isQuote = ch === '"' || ch === "'";
    if (isQuote) {
      const lineBefore = v.slice(lineStartOf(v, s), s);
      if ((lineBefore.split(ch).length - 1) % 2 === 1) return;
      if (/\w/.test(prev) || /\w/.test(next)) return;
    }
    if (!isQuote && next && /\w/.test(next)) return;
    ev.preventDefault();
    insert(ch + PAIRS[ch]);
    ta.setSelectionRange(s + 1, s + 1);
  };

  const onBackspace = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = taRef.current!;
    const { selectionStart: s, selectionEnd: e, value: v } = ta;
    if (s !== e || s === 0) return;
    const before = v.slice(lineStartOf(v, s), s);
    if (before && /^ +$/.test(before)) {
      ev.preventDefault();
      replaceRange(s - (before.length % stepSize || stepSize), s, '');
      return;
    }
    if (PAIRS[v[s - 1]] && PAIRS[v[s - 1]] === v[s]) {
      ev.preventDefault();
      replaceRange(s - 1, s + 1, '');
    }
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    if (ev.nativeEvent.isComposing) return;
    const mod = ev.metaKey || ev.ctrlKey;
    if (mod && ev.key === 'Enter') {
      ev.preventDefault();
      onSubmit?.();
    } else if (ev.shiftKey && ev.key === 'Enter') {
      ev.preventDefault();
      onRun?.();
    } else if (mod && ev.key === '/') {
      ev.preventDefault();
      toggleComment();
    } else if (ev.key === 'Tab') {
      ev.preventDefault();
      if (ev.shiftKey) dedent();
      else indent();
    } else if (ev.key === 'Enter' && !mod) {
      ev.preventDefault();
      newline();
    } else if (ev.key === 'Backspace' && !mod && !ev.altKey) {
      onBackspace(ev);
    } else if (ev.key.length === 1 && !mod && !ev.altKey) {
      onChar(ev);
    }
  };

  useImperativeHandle(ref, () => ({
    focus: () => taRef.current?.focus(),
    gotoLine: (n: number) => {
      const ta = taRef.current;
      if (!ta) return;
      const parts = ta.value.split('\n');
      const line = Math.max(1, Math.min(n, parts.length));
      const start = parts.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
      const cs = getComputedStyle(ta);
      const lh = parseFloat(cs.lineHeight) || 21.6;
      ta.focus();
      ta.setSelectionRange(start, start + parts[line - 1].length);
      ta.scrollTop = Math.max(0, (line - 4) * lh);
      sync();
    },
  }));

  const focusBorder = accent === 'cyan' ? 'focus-within:border-cyan-500/70' : 'focus-within:border-sky-500/70';
  const caretCls = accent === 'cyan' ? 'caret-cyan-400 selection:bg-cyan-500/30' : 'caret-sky-400 selection:bg-sky-500/30';

  return (
    <div className="w-full">
      {filename && (
        <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs">
          <span className="font-mono font-semibold text-slate-200">{filename}</span>
          <span className="font-mono uppercase text-[10px] text-slate-500">
            {language === 'yaml' ? 'YAML · 2 spaces' : language === 'dockerfile' ? 'Dockerfile' : 'Shell / CLI'}
          </span>
        </div>
      )}
      <div
        className={cn(
          'relative flex resize-y overflow-hidden border border-slate-700 bg-slate-950 shadow-inner',
          filename ? 'rounded-b-xl' : 'rounded-xl',
          focusBorder,
          className
        )}
        style={{ height, minHeight: 220 }}
      >
        <div
          ref={gutRef}
          aria-hidden="true"
          className="select-none overflow-hidden whitespace-pre border-r border-slate-800 bg-slate-900/60 py-3.5 pl-3 pr-2.5 text-right text-slate-600"
          style={FONT}
        >
          {Array.from({ length: lineCount }, (_, i) => {
            const ln = i + 1;
            return (
              <div key={ln} className={cn(errorLine === ln && 'font-bold text-rose-400')}>
                {ln}
              </div>
            );
          })}
        </div>
        <div className="relative min-w-0 flex-1">
          <pre
            ref={hlRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre p-3.5 text-slate-200"
            style={FONT}
          >
            {highlighted}
          </pre>
          <textarea
            ref={taRef}
            value={value}
            readOnly={readOnly}
            aria-label={ariaLabel}
            spellCheck={false}
            placeholder={placeholder}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            onChange={(e) => onChange(e.target.value)}
            onScroll={sync}
            onKeyDown={onKeyDown}
            className={cn(
              'absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre border-0 bg-transparent p-3.5 text-transparent outline-none [-webkit-text-fill-color:transparent]',
              caretCls
            )}
            style={FONT}
          />
        </div>
      </div>

      {!readOnly && (
        <div className="mt-1.5 flex gap-1 overflow-x-auto pb-1 sm:hidden" aria-label="Phím nhanh cho điện thoại">
          {MOBILE_QUICK_KEYS.map((q) => (
            <button
              key={q.label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={() => {
                taRef.current?.focus();
                if (q.text) insert(q.text);
                else indent();
              }}
              className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-sm font-semibold text-slate-200 active:bg-sky-500 active:text-slate-950"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

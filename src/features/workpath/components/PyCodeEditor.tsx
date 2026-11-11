import React, { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@sonth87/device-layout';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { getPythonCompletions, type CompletionItem } from '@/utils/pythonAutocompleter';
import { cn } from '@/utils/cn';

/**
 * Trình soạn thảo Python nhẹ: textarea trong suốt đặt chồng lên lớp tô màu.
 * Dùng lại bộ tô màu (renderHighlightedPython) và gợi ý (getPythonCompletions) có sẵn của app.
 *
 * Phím tắt: Tab / Shift+Tab thụt-lùi nhiều dòng · ⌘/ comment · ⌘↵ chấm bài · ⇧↵ chạy thử
 *           Enter tự thụt lề (thêm 4 dấu cách sau ":") · tự đóng ngoặc/nháy · Backspace lùi một cấp thụt lề
 */

export interface PyCodeEditorHandle {
  gotoLine: (line: number) => void;
  focus: () => void;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  onSubmit?: () => void;
  readOnly?: boolean;
  /** Bật gợi ý code khi gõ (mặc định bật). Tắt cho bài luyện gõ để tự nhớ cú pháp. */
  suggest?: boolean;
  placeholder?: string;
  /** Chiều cao CSS của khung, mặc định co theo màn hình */
  height?: string;
  className?: string;
  ariaLabel?: string;
}

const PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
const CLOSERS = new Set([')', ']', '}', '"', "'"]);
const FONT: React.CSSProperties = {
  fontFamily: "var(--font-mono, 'JetBrains Mono', ui-monospace, Menlo, monospace)",
  fontSize: 13.5,
  lineHeight: 1.6,
  tabSize: 4,
};

const lineStartOf = (v: string, i: number) => v.lastIndexOf('\n', i - 1) + 1;

export const PyCodeEditor = forwardRef<PyCodeEditorHandle, Props>(function PyCodeEditor(
  { value, onChange, onRun, onSubmit, readOnly, suggest = true, placeholder, height = 'clamp(240px, 46vh, 540px)', className, ariaLabel = 'Trình soạn thảo mã Python' },
  ref
) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const hlRef = useRef<HTMLPreElement>(null);
  const gutRef = useRef<HTMLDivElement>(null);
  const isLight = useStore((s) => s.resolvedColorScheme) === 'light';
  const [popup, setPopup] = useState<{ items: CompletionItem[]; sel: number; left: number; top: number; from: number } | null>(null);

  const lineCount = useMemo(() => value.split('\n').length, [value]);
  const highlighted = useMemo(() => renderHighlightedPython(value + '\n', isLight), [value, isLight]);

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

  /** Chèn văn bản tại vùng chọn, giữ được lịch sử hoàn tác (Ctrl+Z) */
  const insert = useCallback(
    (text: string) => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      let ok = false;
      try {
        ok = text === '' ? document.execCommand('delete') : document.execCommand('insertText', false, text);   // chuỗi rỗng = xoá vùng chọn
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
      insert(' '.repeat(4 - ((s - lineStartOf(v, s)) % 4)));
      return;
    }
    const { ls, le, block } = blockRange();
    const parts = block.split('\n');
    replaceRange(ls, le, parts.map((l) => '    ' + l).join('\n'), s + 4, e + 4 * parts.length);
  };

  const dedent = () => {
    const ta = taRef.current!;
    const { selectionStart: s, selectionEnd: e } = ta;
    const { ls, le, block } = blockRange();
    let first = 0;
    let total = 0;
    const out = block.split('\n').map((l, i) => {
      const m = l.match(/^( {1,4}|\t)/);
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
    if (before.replace(/#.*$/, '').trimEnd().endsWith(':')) ind += '    ';
    const prev = v[s - 1];
    if ((prev === '(' || prev === '[' || prev === '{') && PAIRS[prev] === v[s]) {
      insert('\n' + base + '    \n' + base);          // Enter giữa cặp ngoặc: mở một dòng thụt lề, đóng ngoặc ở dòng dưới
      const pos = s + 1 + base.length + 4;
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
      // Số nháy cùng loại đã gõ trên dòng: lẻ = đang ở trong chuỗi, nháy này là nháy ĐÓNG → không tự thêm cặp mới
      const lineBefore = v.slice(lineStartOf(v, s), s);
      if ((lineBefore.split(ch).length - 1) % 2 === 1) return;
      if (/\w/.test(prev) || /\w/.test(next)) return;   // tiền tố chuỗi (f"..."), hoặc dấu nháy trong từ (don't)
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
      replaceRange(s - (before.length % 4 || 4), s, '');
      return;
    }
    if (PAIRS[v[s - 1]] && PAIRS[v[s - 1]] === v[s]) {
      ev.preventDefault();
      replaceRange(s - 1, s + 1, '');
    }
  };

  /* ---- gợi ý code ---- */
  const metrics = () => {
    const ta = taRef.current!;
    const cs = getComputedStyle(ta);
    const fs = parseFloat(cs.fontSize) || 13.5;
    const lh = parseFloat(cs.lineHeight) || fs * 1.6;
    const c = document.createElement('canvas').getContext('2d');
    if (c) c.font = `${cs.fontSize} ${cs.fontFamily}`;
    return { lh, cw: c?.measureText('M').width || fs * 0.6, pad: parseFloat(cs.paddingTop) || 14 };
  };

  const showSuggestions = () => {
    const ta = taRef.current;
    if (!ta || readOnly || ta.selectionStart !== ta.selectionEnd) return setPopup(null);
    const caret = ta.selectionStart;
    const r = getPythonCompletions(ta.value, caret);
    if (!r.suggestions.length || (!r.isAfterDot && r.prefix.length < 2)) return setPopup(null);
    const { lh, cw, pad } = metrics();
    const line = ta.value.slice(0, caret).split('\n').length - 1;
    const col = caret - lineStartOf(ta.value, caret) - r.prefix.length;
    setPopup({
      items: r.suggestions.slice(0, 8),
      sel: 0,
      left: Math.max(4, Math.min(pad + col * cw - ta.scrollLeft, ta.clientWidth - 260)),
      top: pad + (line + 1) * lh - ta.scrollTop,
      from: r.replaceStart,
    });
  };

  const accept = (item: CompletionItem) => {
    const ta = taRef.current!;
    replaceRange(popup!.from, ta.selectionStart, item.insertText);
    setPopup(null);
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    const mod = ev.metaKey || ev.ctrlKey;
    if (popup) {
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        const d = ev.key === 'ArrowDown' ? 1 : -1;
        setPopup({ ...popup, sel: (popup.sel + d + popup.items.length) % popup.items.length });
        return;
      }
      if ((ev.key === 'Enter' || ev.key === 'Tab') && !mod) {
        ev.preventDefault();
        accept(popup.items[popup.sel]);
        return;
      }
      if (ev.key === 'Escape') {
        ev.preventDefault();
        setPopup(null);
        return;
      }
    }
    if (ev.nativeEvent.isComposing) return;
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
    } else if (ev.key === 'Backspace' && !mod && !ev.altKey) onBackspace(ev);
    else if (ev.key.length === 1 && !mod && !ev.altKey) onChar(ev);
  };

  useImperativeHandle(ref, () => ({
    focus: () => taRef.current?.focus(),
    gotoLine: (n: number) => {
      const ta = taRef.current;
      if (!ta) return;
      const parts = ta.value.split('\n');
      const line = Math.max(1, Math.min(n, parts.length));
      const start = parts.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
      ta.focus();
      ta.setSelectionRange(start, start + parts[line - 1].length);
      ta.scrollTop = Math.max(0, (line - 4) * metrics().lh);
      sync();
    },
  }));

  const QUICK: { label: string; text?: string }[] = [
    { label: 'Tab' },
    ...[':', '(', ')', '[', ']', '{', '}', '"', "'", '=', '#', '_'].map((c) => ({ label: c, text: c })),
  ];

  return (
    <div className="w-full">
    <div
      className={cn('relative flex resize-y overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-inner focus-within:border-emerald-500/70', className)}
      style={{ height, minHeight: 220 }}
    >
      <div
        ref={gutRef}
        aria-hidden="true"
        className="select-none overflow-hidden whitespace-pre border-r border-slate-800 bg-slate-900/60 py-3.5 pl-3 pr-2.5 text-right text-slate-600"
        style={FONT}
      >
        {Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')}
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
          onChange={(e) => {
            onChange(e.target.value);
            if (suggest) showSuggestions();
          }}
          onScroll={() => {
            sync();
            setPopup(null);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setPopup(null), 120)}
          onClick={() => setPopup(null)}
          className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre border-0 bg-transparent p-3.5 text-transparent caret-emerald-400 outline-none selection:bg-emerald-500/30 [-webkit-text-fill-color:transparent]"
          style={FONT}
        />
        {popup && (
          <div
            role="listbox"
            className="absolute z-20 min-w-[200px] max-w-[320px] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-xl"
            style={{ left: popup.left, top: popup.top }}
          >
            {popup.items.map((it, i) => (
              <div
                key={it.label + i}
                role="option"
                aria-selected={i === popup.sel}
                onMouseDown={(e) => {
                  e.preventDefault();
                  accept(it);
                }}
                className={cn('flex cursor-pointer items-baseline justify-between gap-3 rounded px-2 py-1 font-mono text-[12.5px]', i === popup.sel ? 'bg-emerald-500 text-slate-950' : 'text-slate-200 hover:bg-slate-800')}
              >
                <span>{it.label}</span>
                <span className={cn('truncate text-[10.5px]', i === popup.sel ? 'text-slate-800' : 'text-slate-500')}>{it.detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
      {!readOnly && (
        <div className="mt-1.5 flex gap-1 overflow-x-auto pb-1 sm:hidden" aria-label="Phím nhanh cho điện thoại">
          {QUICK.map((q) => (
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
              className="min-w-[2.4rem] shrink-0 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-sm text-slate-200 active:bg-emerald-500 active:text-slate-950"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

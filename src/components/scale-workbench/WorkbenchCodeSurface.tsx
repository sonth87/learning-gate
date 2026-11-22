import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronUp,
  Copy,
  Palette,
  Play,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import {
  detectLanguageFromFence,
  renderHighlightedConfig,
} from '@/features/devops-course/configHighlighter';
import type { EditorLanguage } from '@/features/devops-course/types';
import type { RunResult } from '@/features/workpath/types';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import { IDE_THEMES, getIdeThemeConfig, type IdeThemeConfig } from '@/utils/ideThemes';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { cn } from '@/utils/cn';

const CONFIG_LANG_TAGS = new Set([
  'yaml',
  'yml',
  'dockerfile',
  'docker',
  'dockerignore',
  'redis',
  'redis-cli',
  'lua',
  'redis-conf',
  'conf',
  'ini',
  'sh',
  'bash',
  'zsh',
  'shell',
  'cli',
  'console',
  'json',
  'toml',
]);

export function inferWorkbenchConfigLang(
  code: string,
  langTag?: string
): EditorLanguage | null {
  const normalized = (langTag ?? '').trim().toLowerCase();
  if (normalized === 'python' || normalized === 'py') return null;
  if (normalized && CONFIG_LANG_TAGS.has(normalized)) {
    if (normalized === 'json' || normalized === 'toml') return 'yaml';
    return detectLanguageFromFence(normalized, 'yaml');
  }
  if (!normalized) {
    if (/^\s*FROM\s+\S+/m.test(code)) return 'dockerfile';
    if (/^\s*(apiVersion:|kind:|jobs:|steps:|stages:|services:)/m.test(code)) return 'yaml';
    if (
      /^\s*(SET|GET|HSET|ZADD|XADD|LPUSH|SCAN|UNLINK|EXPIRE|MULTI|CONFIG\s+SET|ACL\s+SETUSER)\b/m.test(
        code
      )
    ) {
      return 'redis';
    }
    if (/^\s*(maxmemory|maxmemory-policy|appendonly|protected-mode)\b/m.test(code)) {
      return 'redis-conf';
    }
    if (/^\s*(\$\s+)?(docker|kubectl|helm|git|npm|uv|curl)\s+/m.test(code)) return 'shell';
  }
  return null;
}

const SHORT_THEME_NAMES: Record<string, string> = {
  nord: 'Nord',
  dracula: 'Dracula',
  monokai: 'Monokai',
  'github-light': 'GitHub Light',
  'solarized-light': 'Solarized',
  'vscode-dark': 'Midnight',
};

export const IdeThemePicker: React.FC<{
  lang: WorkbenchLang;
  activeTheme: IdeThemeConfig;
  compact?: boolean;
}> = ({ lang, activeTheme, compact = false }) => {
  const setIdeTheme = useSettingsStore((s) => s.setIdeTheme);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    left: number;
    top?: number;
    bottom?: number;
  } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuWidth = 224;
    const estHeight = 256;
    const left = Math.max(
      8,
      Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth)
    );
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceAbove >= estHeight + 10 || spaceAbove >= spaceBelow) {
      setCoords({
        left,
        bottom: Math.max(8, window.innerHeight - rect.top + 6),
      });
    } else {
      setCoords({
        left,
        top: Math.min(window.innerHeight - estHeight - 8, rect.bottom + 6),
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();

    const onDocDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onScrollOrResize = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) {
        return;
      }
      updateMenuPosition();
    };

    document.addEventListener('mousedown', onDocDown);
    window.addEventListener('keydown', onEsc);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      window.removeEventListener('keydown', onEsc);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updateMenuPosition]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!open) updateMenuPosition();
          setOpen((v) => !v);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title={lang === 'en' ? 'Switch code theme' : 'Đổi giao diện màu Code'}
        aria-label={lang === 'en' ? 'Switch code theme' : 'Đổi giao diện màu Code'}
        style={{
          backgroundColor: activeTheme.barBg,
          borderColor: activeTheme.barBorder,
          color: activeTheme.barText,
        }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border font-mono text-[10.5px] font-bold whitespace-nowrap shadow-sm transition-opacity hover:opacity-95 cursor-pointer',
          compact ? 'h-6 px-1.5' : 'h-6.5 px-2'
        )}
      >
        <span className="flex items-center gap-0.5" aria-hidden="true">
          <span
            className="h-2 w-2 rounded-full border border-black/20"
            style={{ backgroundColor: activeTheme.swatchColors[1] }}
          />
          <span
            className="h-2 w-2 rounded-full border border-black/20"
            style={{ backgroundColor: activeTheme.swatchColors[2] }}
          />
        </span>
        {!compact ? (
          <span>{SHORT_THEME_NAMES[activeTheme.id] ?? activeTheme.id}</span>
        ) : (
          <Palette className="h-3 w-3" />
        )}
        <ChevronUp
          className={cn(
            'h-3 w-3 opacity-70 transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>

      {open &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: coords.left,
              top: coords.top,
              bottom: coords.bottom,
              zIndex: 99999,
              backgroundColor: activeTheme.popupBg,
              borderColor: activeTheme.popupBorder,
              color: activeTheme.popupText,
            }}
            className="w-[224px] overflow-hidden rounded-xl border-[1.5px] p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.38)]"
          >
            <div
              style={{
                backgroundColor: activeTheme.popupHeaderBg,
                color: activeTheme.popupMutedText,
              }}
              className="mb-1 rounded-lg px-2.5 py-1 font-mono text-[9.5px] font-extrabold uppercase tracking-wider"
            >
              {lang === 'en' ? 'Code Theme' : 'Giao diện Code'}
            </div>
            {IDE_THEMES.map((th) => {
              const isActive = th.id === activeTheme.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    setIdeTheme(th.id);
                    setOpen(false);
                  }}
                  style={
                    isActive
                      ? {
                          backgroundColor: activeTheme.popupActiveBg,
                          color: activeTheme.popupActiveText,
                        }
                      : { color: activeTheme.popupText }
                  }
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left font-mono text-[11.5px] font-bold transition-colors hover:opacity-90 cursor-pointer"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex shrink-0 items-center gap-0.5">
                      {th.swatchColors.map((sw, sIdx) => (
                        <span
                          key={sIdx}
                          className="h-2.5 w-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: sw }}
                        />
                      ))}
                    </span>
                    <span className="truncate">{th.name.replace(/\s*\(.*\)/, '')}</span>
                  </span>
                  {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};

const EDITOR_FONT: React.CSSProperties = {
  fontFamily: "var(--dts-font-mono, 'JetBrains Mono', ui-monospace, Menlo, monospace)",
  fontSize: 12.75,
  lineHeight: '21px',
  tabSize: 4,
};

const lineStartOf = (v: string, i: number) => v.lastIndexOf('\n', i - 1) + 1;

export interface WorkbenchCodeSurfaceProps {
  code: string;
  defaultCode?: string;
  onChange?: (nextCode: string) => void;
  onRun?: () => void;
  running?: boolean;
  output?: RunResult | null;
  onReset?: () => void;
  titleBadge: string;
  lang: WorkbenchLang;
  langHint?: string;
  runLabel?: string;
  readOnly?: boolean;
  className?: string;
}

export const WorkbenchCodeSurface: React.FC<WorkbenchCodeSurfaceProps> = ({
  code,
  defaultCode,
  onChange,
  onRun,
  running = false,
  output,
  onReset,
  titleBadge,
  lang,
  langHint,
  runLabel,
  readOnly = false,
  className,
}) => {
  const { ideTheme } = useSettingsStore(
    useShallow((s) => ({ ideTheme: s.ideTheme }))
  );
  const activeIdeTheme = useMemo(() => getIdeThemeConfig(ideTheme), [ideTheme]);
  const isLight = activeIdeTheme.isLight;

  const [copied, setCopied] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const configLang = useMemo(
    () => inferWorkbenchConfigLang(code, langHint),
    [code, langHint]
  );
  const indentSize = configLang ? 2 : 4;

  const lineCount = useMemo(() => Math.max(1, code.split('\n').length), [code]);
  const highlighted = useMemo(
    () =>
      configLang
        ? renderHighlightedConfig(code + '\n', configLang, isLight)
        : renderHighlightedPython(code + '\n', isLight),
    [code, configLang, isLight]
  );

  const syncScroll = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  }, []);

  useLayoutEffect(syncScroll, [code, syncScroll]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly || !onChange) return;

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (onRun) {
        e.preventDefault();
        onRun();
      }
      return;
    }

    const ta = e.currentTarget;
    const { selectionStart: s, selectionEnd: end, value: v } = ta;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (!e.shiftKey) {
        const pad = ' '.repeat(indentSize - ((s - lineStartOf(v, s)) % indentSize));
        const next = v.slice(0, s) + pad + v.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          ta.setSelectionRange(s + pad.length, s + pad.length);
        });
      } else {
        const ls = lineStartOf(v, s);
        const m = v.slice(ls).match(new RegExp(`^( {1,${indentSize}}|\\t)`));
        const rm = m ? m[0].length : 0;
        if (rm > 0) {
          const next = v.slice(0, ls) + v.slice(ls + rm);
          onChange(next);
          requestAnimationFrame(() => {
            const pos = Math.max(ls, s - rm);
            ta.setSelectionRange(pos, pos);
          });
        }
      }
      return;
    }

    if (e.key === 'Enter' && s === end) {
      e.preventDefault();
      const ls = lineStartOf(v, s);
      const lineBeforeCursor = v.slice(ls, s);
      const baseIndent = (lineBeforeCursor.match(/^[ \t]*/) ?? [''])[0];
      const extraIndent = /:\s*(#.*)?$/.test(lineBeforeCursor) ? ' '.repeat(indentSize) : '';
      const ins = '\n' + baseIndent + extraIndent;
      const next = v.slice(0, s) + ins + v.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        const pos = s + ins.length;
        ta.setSelectionRange(pos, pos);
      });
    }
  };

  const isModified = defaultCode !== undefined && code !== defaultCode;

  return (
    <div
      style={{
        backgroundColor: activeIdeTheme.editorBg,
        borderColor: activeIdeTheme.barBorder,
        colorScheme: isLight ? 'light' : 'dark',
      }}
      className={cn(
        !isLight && 'ide-dark-surface',
        'relative flex min-h-[210px] flex-col overflow-hidden rounded-xl border-[1.5px] shadow-[1.5px_2px_0_var(--dts-shadow-color)]',
        className
      )}
    >
      {/* Clean Single-Line IDE Header Bar (Theme picker moved to bottom-right!) */}
      <div
        style={{
          backgroundColor: activeIdeTheme.barBg,
          borderColor: activeIdeTheme.barBorder,
          color: activeIdeTheme.barText,
        }}
        className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-1.5"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e5534b]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#efb041]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#7fc278]" />
          </span>
          <span className="truncate font-mono text-[11.5px] font-bold">
            {titleBadge}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            title={lang === 'en' ? 'Copy code' : 'Sao chép mã'}
            aria-label={lang === 'en' ? 'Copy code' : 'Sao chép mã'}
            style={{
              backgroundColor: activeIdeTheme.btnBg,
              borderColor: activeIdeTheme.barBorder,
              color: activeIdeTheme.barText,
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-opacity hover:opacity-85 cursor-pointer"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          {isModified && onReset && (
            <button
              type="button"
              onClick={onReset}
              title={lang === 'en' ? 'Reset snippet' : 'Khôi phục mã gốc'}
              aria-label={lang === 'en' ? 'Reset snippet' : 'Khôi phục mã gốc'}
              style={{
                backgroundColor: activeIdeTheme.btnBg,
                borderColor: activeIdeTheme.barBorder,
                color: activeIdeTheme.barText,
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-opacity hover:opacity-85 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          {onRun && (
            <button
              type="button"
              onClick={onRun}
              disabled={running}
              title={lang === 'en' ? 'Run (Ctrl/Cmd + Enter)' : 'Chạy thử (Ctrl/Cmd + Enter)'}
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-[#211e1b] bg-[#cfe3b2] px-2.5 font-mono text-[11px] font-extrabold whitespace-nowrap text-[#1d2b14] shadow-[1px_1.5px_0_#110f0c] hover:bg-[#dcecc4] disabled:opacity-50 cursor-pointer"
            >
              <Play className="h-3 w-3 shrink-0 fill-current" />
              <span>
                {running
                  ? lang === 'en'
                    ? 'Running…'
                    : 'Đang chạy…'
                  : (runLabel ?? (lang === 'en' ? 'Run' : 'Chạy thử'))}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* True Code Body: Line-Number Gutter + Non-Wrapping Highlighted Overlay + Bottom-Right Theme Picker */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div
          ref={gutterRef}
          aria-hidden="true"
          style={{
            ...EDITOR_FONT,
            backgroundColor: activeIdeTheme.gutterBg,
            borderColor: activeIdeTheme.gutterBorder,
            color: activeIdeTheme.gutterText,
          }}
          className="select-none overflow-hidden whitespace-pre border-r pt-3 pb-10 pl-2.5 pr-2.5 text-right tabular-nums"
        >
          {Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')}
        </div>

        <div className="relative min-w-0 flex-1">
          <pre
            ref={preRef}
            aria-hidden="true"
            style={{
              ...EDITOR_FONT,
              color: isLight ? '#1f2328' : '#f4ede2',
            }}
            className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre pt-3 pr-3 pb-10 pl-3"
          >
            {highlighted}
          </pre>

          <textarea
            ref={taRef}
            value={code}
            readOnly={readOnly || !onChange}
            onChange={(e) => onChange?.(e.target.value)}
            onScroll={syncScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            aria-label="Interactive syntax-highlighted code editor"
            style={EDITOR_FONT}
            className={cn(
              'absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre border-0 bg-transparent pt-3 pr-3 pb-10 pl-3 text-transparent outline-none [-webkit-text-fill-color:transparent]',
              activeIdeTheme.caretClass,
              activeIdeTheme.selectionClass
            )}
          />
        </div>

        {/* Bottom-Right Floating Theme Picker (opens portal outside overflow-hidden!) */}
        <div className="pointer-events-auto absolute bottom-2 right-2.5 z-20">
          <IdeThemePicker lang={lang} activeTheme={activeIdeTheme} />
        </div>
      </div>

      {/* Execution Output Drawer */}
      {output && (
        <div
          style={{
            backgroundColor: activeIdeTheme.gutterBg,
            borderColor: activeIdeTheme.barBorder,
          }}
          className="max-h-32 shrink-0 overflow-y-auto border-t px-3.5 py-2 font-mono text-xs"
        >
          <div
            style={{ color: activeIdeTheme.gutterText }}
            className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
          >
            <Terminal className="h-3 w-3" />
            <span>stdout · {output.ms} ms</span>
          </div>
          {output.stdout && (
            <pre
              className={cn(
                'whitespace-pre-wrap font-semibold',
                isLight ? 'text-[#116329]' : 'text-[#a8e686]'
              )}
            >
              {output.stdout}
            </pre>
          )}
          {output.stderr && (
            <pre
              className={cn(
                'whitespace-pre-wrap font-semibold',
                isLight ? 'text-[#cf222e]' : 'text-[#fda4af]'
              )}
            >
              {output.stderr}
            </pre>
          )}
          {!output.stdout && !output.stderr && (
            <span style={{ color: activeIdeTheme.gutterText }}>
              {lang === 'en'
                ? '✔ Executed cleanly (no printed output — add print(...) to inspect values).'
                : '✔ Chạy thành công (chưa có lệnh print — thêm print(...) để xem kết quả).'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

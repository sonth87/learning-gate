import React, { useMemo, useState } from 'react';
import YAML from 'yaml';
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  ChevronRight,
  Copy,
  Info,
  Lightbulb,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { ALL_GLOSSARY_TERMS, findGlossaryTerm } from '@/data/glossary';
import type { GlossaryTerm } from '@/types/glossary.types';
import {
  detectLanguageFromFence,
  renderHighlightedConfig,
} from '@/features/devops-course/configHighlighter';
import type { EditorLanguage } from '@/features/devops-course/types';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { getIdeThemeConfig } from '@/utils/ideThemes';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { getAppContainerWidth } from '@/utils/viewport';
import { IdeThemePicker } from './WorkbenchCodeSurface';
import { cn } from '@/utils/cn';

function getBadgeClasses(tone: string): string {
  switch (tone.toLowerCase()) {
    case 'violet':
    case 'purple':
      return 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)]';
    case 'sky':
    case 'cyan':
    case 'blue':
      return 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]';
    case 'rose':
    case 'red':
      return 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]';
    case 'emerald':
    case 'green':
      return 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]';
    case 'amber':
    default:
      return 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]';
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Curated plain-text surface regex for distinctive technical terms across Python, Redis,
 * Docker/K8s, CI/CD & PMP so learners can hover/click unfamiliar terms right inside prose
 * without false-matching common Vietnamese/English words.
 */
const PLAIN_TERM_PATTERNS: string[] = Array.from(
  new Set(
    ALL_GLOSSARY_TERMS.filter(
      (t) =>
        t.category === 'concept' ||
        t.category === 'ecosystem' ||
        t.category === 'dunder' ||
        t.category === 'stdlib'
    )
      .flatMap((t) => [t.term.replace(/\s*\([^)]*\)/g, '').trim(), ...(t.aliases || [])])
      .filter(
        (s) =>
          s.length >= 5 &&
          /^[A-Za-z0-9_.@/\s-]+$/.test(s) &&
          !/^(function|method|object|string|number|boolean|module|package|library|system|server|client|docker|python|status|config|random|select|update|delete|create|import|return|values|output|result|target|source|branch|commit|action|runner|master|worker|memory|thread|stream)$/i.test(
            s
          )
      )
  )
).sort((a, b) => b.length - a.length);

const PLAIN_TERM_REGEX =
  PLAIN_TERM_PATTERNS.length > 0
    ? new RegExp(`\\b(${PLAIN_TERM_PATTERNS.map(escapeRegex).join('|')})\\b`, 'g')
    : null;

const BlueprintTermTrigger: React.FC<{
  term: GlossaryTerm;
  children: React.ReactNode;
  variant: 'code' | 'bold' | 'mark' | 'plain';
}> = ({ term, children, variant }) => {
  const showTermPopover = useNavigationStore((s) => s.showTermPopover);
  const hideTermPopover = useNavigationStore((s) => s.hideTermPopover);

  const openAt = (el: HTMLElement, pinned: boolean) => {
    const rect = el.getBoundingClientRect();
    showTermPopover(
      term.id,
      {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        width: rect.width,
      },
      pinned
    );
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (getAppContainerWidth() < 1024) return;
    openAt(e.currentTarget, false);
  };

  const handleMouseLeave = () => {
    if (getAppContainerWidth() < 1024) return;
    hideTermPopover(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    openAt(e.currentTarget, true);
  };

  if (variant === 'code') {
    return (
      <code
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        title={`Bấm hoặc rê chuột để xem giải nghĩa: ${term.term}`}
        className="dts-term-marker font-mono text-[0.92em]"
      >
        {children}
      </code>
    );
  }

  if (variant === 'mark') {
    return (
      <mark
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        title={`Bấm hoặc rê chuột để xem giải nghĩa: ${term.term}`}
        className="dts-term-marker bg-transparent"
      >
        {children}
      </mark>
    );
  }

  if (variant === 'bold') {
    return (
      <strong
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        title={`Bấm hoặc rê chuột để xem giải nghĩa: ${term.term}`}
        className="dts-term-marker"
      >
        {children}
      </strong>
    );
  }

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={`Bấm hoặc rê chuột để xem giải nghĩa: ${term.term}`}
      className="dts-term-marker"
    >
      {children}
    </span>
  );
};

function renderPlainWithTerms(
  segment: string,
  enableHighlight: boolean,
  baseKey: string
): React.ReactNode {
  if (!enableHighlight || !PLAIN_TERM_REGEX || segment.length < 5) {
    return segment;
  }
  PLAIN_TERM_REGEX.lastIndex = 0;
  if (!PLAIN_TERM_REGEX.test(segment)) {
    return segment;
  }
  PLAIN_TERM_REGEX.lastIndex = 0;

  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let subIdx = 0;
  while ((m = PLAIN_TERM_REGEX.exec(segment)) !== null) {
    if (m.index > last) {
      out.push(segment.slice(last, m.index));
    }
    const word = m[0];
    const matched = findGlossaryTerm(word);
    if (matched) {
      out.push(
        <BlueprintTermTrigger
          key={`${baseKey}-p-${subIdx++}`}
          term={matched}
          variant="plain"
        >
          {word}
        </BlueprintTermTrigger>
      );
    } else {
      out.push(word);
    }
    last = m.index + word.length;
  }
  if (last < segment.length) {
    out.push(segment.slice(last));
  }
  return out;
}

const InlineCodeAware: React.FC<{ text: string; disablePlainTerms?: boolean }> = ({
  text,
  disablePlainTerms = false,
}) => {
  const enableAutoHighlight = useSettingsStore((s) => s.enableAutoHighlight);

  const parts = useMemo(() => {
    const tokens: React.ReactNode[] = [];
    const re =
      /`([^`]+)`|\*\*(.+?)\*\*|(?<![*\w])\*([^*\s][^*]*?)\*(?![*\w])|==(.+?)==|\[([^\]]+)\]\((https?:[^)\s]+)\)|\[!badge:([a-zA-Z0-9_-]+):([^\]]+)\]/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let idx = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) {
        const plainSlice = text.slice(last, m.index);
        tokens.push(
          disablePlainTerms
            ? plainSlice
            : renderPlainWithTerms(plainSlice, enableAutoHighlight, `s${idx++}`)
        );
      }
      if (m[1] !== undefined) {
        const codeStr = m[1];
        const termMatch = enableAutoHighlight ? findGlossaryTerm(codeStr) : undefined;
        if (termMatch) {
          tokens.push(
            <BlueprintTermTrigger key={idx++} term={termMatch} variant="code">
              {codeStr}
            </BlueprintTermTrigger>
          );
        } else {
          tokens.push(
            <code
              key={idx++}
              className="rounded border border-[var(--dts-border-soft)] bg-[var(--dts-panel-muted)] px-1.5 py-0.5 font-mono text-[0.86em] font-semibold text-[var(--dts-ink)]"
            >
              {codeStr}
            </code>
          );
        }
      } else if (m[2] !== undefined) {
        const boldStr = m[2];
        const cleanBold = boldStr.replace(/`/g, '').trim();
        const termMatch =
          enableAutoHighlight && !disablePlainTerms
            ? findGlossaryTerm(cleanBold)
            : undefined;
        if (termMatch) {
          tokens.push(
            <BlueprintTermTrigger key={idx++} term={termMatch} variant="bold">
              <InlineCodeAware text={boldStr} disablePlainTerms />
            </BlueprintTermTrigger>
          );
        } else {
          tokens.push(
            <strong key={idx++} className="font-bold text-[var(--dts-ink)]">
              <InlineCodeAware text={boldStr} disablePlainTerms={disablePlainTerms} />
            </strong>
          );
        }
      } else if (m[3] !== undefined) {
        tokens.push(
          <em key={idx++} className="italic">
            <InlineCodeAware text={m[3]} disablePlainTerms={disablePlainTerms} />
          </em>
        );
      } else if (m[4] !== undefined) {
        const markStr = m[4];
        const cleanMark = markStr.replace(/\*|`/g, '').trim();
        const termMatch =
          enableAutoHighlight && !disablePlainTerms
            ? findGlossaryTerm(cleanMark)
            : undefined;
        if (termMatch) {
          tokens.push(
            <BlueprintTermTrigger key={idx++} term={termMatch} variant="mark">
              <InlineCodeAware text={markStr} disablePlainTerms />
            </BlueprintTermTrigger>
          );
        } else {
          tokens.push(
            <mark
              key={idx++}
              className="rounded bg-[var(--dts-amber-bg)] px-1 py-0.5 font-semibold text-[var(--dts-amber-ink)]"
            >
              <InlineCodeAware text={markStr} disablePlainTerms={disablePlainTerms} />
            </mark>
          );
        }
      } else if (m[5] !== undefined && m[6] !== undefined) {
        tokens.push(
          <a
            key={idx++}
            href={m[6]}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline decoration-[var(--dts-border)] underline-offset-2 hover:opacity-80"
          >
            {m[5]}
          </a>
        );
      } else if (m[7] !== undefined && m[8] !== undefined) {
        tokens.push(
          <span
            key={idx++}
            className={cn(
              'mx-0.5 inline-flex items-center rounded-full border border-[var(--dts-border)] px-2 py-0.2 font-mono text-[10px] font-bold align-middle',
              getBadgeClasses(m[7])
            )}
          >
            {m[8]}
          </span>
        );
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) {
      const tail = text.slice(last);
      tokens.push(
        disablePlainTerms
          ? tail
          : renderPlainWithTerms(tail, enableAutoHighlight, `t${idx++}`)
      );
    }
    return tokens;
  }, [text, enableAutoHighlight, disablePlainTerms]);

  return <>{parts}</>;
};

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

function inferNonPythonConfigLang(code: string, langTag?: string): EditorLanguage | null {
  const normalized = (langTag ?? '').trim().toLowerCase();
  if (normalized === 'python' || normalized === 'py') return null;
  if (normalized && CONFIG_LANG_TAGS.has(normalized)) {
    if (normalized === 'json' || normalized === 'toml') return 'yaml';
    return detectLanguageFromFence(normalized, 'yaml');
  }
  if (!normalized) {
    if (/^\s*FROM\s+\S+/m.test(code)) return 'dockerfile';
    if (/^\s*(apiVersion:|kind:|jobs:|steps:|stages:)/m.test(code)) return 'yaml';
    if (/^\s*(SET|GET|HSET|ZADD|XADD|LPUSH|SCAN|UNLINK|EXPIRE|MULTI|CONFIG\s+SET|ACL\s+SETUSER)\b/m.test(code)) {
      return 'redis';
    }
    if (/^\s*(\$\s+)?(docker|kubectl|helm|git|npm|uv|curl)\s+/m.test(code)) return 'shell';
  }
  return null;
}

const BlueprintCodeBlock: React.FC<{ code: string; langTag?: string }> = ({
  code,
  langTag,
}) => {
  const [copied, setCopied] = useState(false);
  const ideTheme = useSettingsStore((s) => s.ideTheme);
  const lang = useWorkbenchStore((s) => s.language);
  const activeIdeTheme = useMemo(() => getIdeThemeConfig(ideTheme), [ideTheme]);
  const isLight = activeIdeTheme.isLight;

  const trimmed = code.replace(/\n$/, '');
  const lines = useMemo(() => trimmed.split('\n'), [trimmed]);
  const showLineNums = lines.length >= 2;
  const configLang = useMemo(
    () => inferNonPythonConfigLang(trimmed, langTag),
    [trimmed, langTag]
  );

  const label = langTag || (configLang ?? 'python');

  return (
    <div
      style={{
        backgroundColor: activeIdeTheme.editorBg,
        borderColor: activeIdeTheme.barBorder,
        colorScheme: isLight ? 'light' : 'dark',
      }}
      className={cn(
        !isLight && 'ide-dark-surface',
        'group relative my-2.5 overflow-hidden rounded-xl border-[1.5px] shadow-[1px_1.5px_0_var(--dts-shadow-color)]'
      )}
    >
      <div
        style={{
          backgroundColor: activeIdeTheme.barBg,
          borderColor: activeIdeTheme.barBorder,
          color: activeIdeTheme.barText,
        }}
        className="flex items-center justify-between gap-2 border-b px-2.5 py-1 font-mono text-[10px] font-bold"
      >
        <span className="flex items-center gap-1.5 uppercase tracking-wider opacity-85">
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-[#e5534b]" />
            <span className="h-2 w-2 rounded-full bg-[#efb041]" />
            <span className="h-2 w-2 rounded-full bg-[#7fc278]" />
          </span>
          <span>{label}</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(trimmed);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            aria-label="Copy code"
            title={lang === 'en' ? 'Copy code' : 'Sao chép mã'}
            style={{
              backgroundColor: activeIdeTheme.btnBg,
              borderColor: activeIdeTheme.barBorder,
              color: activeIdeTheme.barText,
            }}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border transition-opacity hover:opacity-85 cursor-pointer"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      <div className="relative flex overflow-x-auto">
        {showLineNums && (
          <div
            aria-hidden="true"
            style={{
              backgroundColor: activeIdeTheme.gutterBg,
              borderColor: activeIdeTheme.gutterBorder,
              color: activeIdeTheme.gutterText,
            }}
            className="select-none whitespace-pre border-r pt-2.5 pb-7 pl-2 pr-2 text-right font-mono text-[11.5px] leading-[1.6] tabular-nums"
          >
            {lines.map((_, i) => i + 1).join('\n')}
          </div>
        )}
        <pre
          style={{ color: isLight ? '#1f2328' : '#f4ede2' }}
          className="min-w-0 flex-1 whitespace-pre pt-2.5 pr-3 pb-7 pl-2.5 font-mono text-[11.75px] leading-[1.6]"
        >
          {configLang
            ? renderHighlightedConfig(trimmed, configLang, isLight)
            : renderHighlightedPython(trimmed, isLight)}
        </pre>
      </div>

      <div className="pointer-events-auto absolute bottom-1.5 right-2 z-10 opacity-85 transition-opacity group-hover:opacity-100">
        <IdeThemePicker lang={lang} activeTheme={activeIdeTheme} compact />
      </div>
    </div>
  );
};

type AlertKind =
  | 'NOTE'
  | 'INFO'
  | 'TIP'
  | 'ANALOGY'
  | 'IMPORTANT'
  | 'REMEMBER'
  | 'WARNING'
  | 'CAUTION'
  | 'DANGER';

function getAlertPresentation(
  kind: AlertKind,
  lang: 'vi' | 'en'
): {
  defaultTitle: string;
  boxCls: string;
  badgeCls: string;
  Icon: React.FC<{ className?: string }>;
} {
  switch (kind) {
    case 'TIP':
      return {
        defaultTitle: lang === 'en' ? 'Practical Tip' : 'Mẹo dễ nhớ & thực chiến',
        boxCls: 'bg-[var(--dts-green-soft)] text-[var(--dts-ink)] border-[var(--dts-border)]',
        badgeCls: 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]',
        Icon: Lightbulb,
      };
    case 'ANALOGY':
      return {
        defaultTitle: lang === 'en' ? 'Mental Model / Analogy' : 'Hình ảnh liên tưởng dễ hiểu',
        boxCls: 'bg-[var(--dts-purple-soft)] text-[var(--dts-ink)] border-[var(--dts-border)]',
        badgeCls: 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)]',
        Icon: Lightbulb,
      };
    case 'IMPORTANT':
    case 'REMEMBER':
      return {
        defaultTitle: lang === 'en' ? 'Key Principle to Remember' : 'Nguyên tắc cốt lõi cần nhớ',
        boxCls: 'bg-[var(--dts-purple-soft)] text-[var(--dts-ink)] border-[var(--dts-border)]',
        badgeCls: 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)]',
        Icon: Sparkles,
      };
    case 'WARNING':
      return {
        defaultTitle: lang === 'en' ? 'Watch Out / Common Trap' : 'Lưu ý & Bẫy hay gặp',
        boxCls: 'bg-[var(--dts-amber-soft)] text-[var(--dts-ink)] border-[var(--dts-border)]',
        badgeCls: 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]',
        Icon: AlertTriangle,
      };
    case 'CAUTION':
    case 'DANGER':
      return {
        defaultTitle: lang === 'en' ? 'Critical Danger' : 'Cảnh báo nghiêm trọng',
        boxCls: 'bg-[var(--dts-rose-soft)] text-[var(--dts-ink)] border-[var(--dts-border)]',
        badgeCls: 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]',
        Icon: ShieldAlert,
      };
    case 'INFO':
    case 'NOTE':
    default:
      return {
        defaultTitle: lang === 'en' ? 'Quick Explanation' : 'Giải nghĩa nhanh',
        boxCls: 'bg-[var(--dts-blue-soft)] text-[var(--dts-ink)] border-[var(--dts-border)]',
        badgeCls: 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]',
        Icon: Info,
      };
  }
}

export const BlueprintMarkdown: React.FC<{
  source: string;
  className?: string;
}> = ({ source, className }) => {
  const showJsTsComparison = useSettingsStore((s) => s.showJsTsComparison);
  const lang = useWorkbenchStore((s) => s.language);

  const blocks = useMemo(() => {
    const lines = source.replace(/\r/g, '').split('\n');
    const out: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    const splitTableRow = (row: string) =>
      row
        .trim()
        .replace(/^\||\|$/g, '')
        .split(/(?<!\\)\|/)
        .map((c) => c.replace(/\\\|/g, '|').trim());

    while (i < lines.length) {
      const line = lines[i];

      // Code fence
      const fence = line.match(/^```\s*([a-zA-Z0-9_+-]*)/);
      if (fence) {
        const tag = fence[1] || '';
        const buf: string[] = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) {
          buf.push(lines[i++]);
        }
        i++;
        if (tag.startsWith('visual')) {
          try {
            const doc = YAML.parse(buf.join('\n')) as Record<string, any> | null;
            if (!doc || typeof doc !== 'object' || doc.kind === 'illustration') {
              continue;
            }
            out.push(
              <div
                key={key++}
                className="my-3 rounded-xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] p-3"
              >
                {doc.title && (
                  <div className="font-mono text-xs font-extrabold text-[var(--dts-ink)]">
                    <InlineCodeAware text={String(doc.title)} />
                  </div>
                )}
                {doc.subtitle && (
                  <p className="mt-0.5 text-[11.5px] text-[var(--dts-ink-muted)]">
                    <InlineCodeAware text={String(doc.subtitle)} />
                  </p>
                )}

                {doc.kind === 'compare' && (doc.left || doc.right) && (
                  <div className="mt-2.5 grid grid-cols-1 gap-2">
                    {[doc.left, doc.right].filter(Boolean).map((side: any, sIdx: number) => (
                      <div
                        key={sIdx}
                        className="rounded-lg border border-[var(--dts-border-soft)] bg-[var(--dts-panel)] p-2.5"
                      >
                        {side.badge && (
                          <span
                            className={cn(
                              'inline-block rounded-full border border-[var(--dts-border)] px-2 py-0.2 font-mono text-[9.5px] font-bold uppercase',
                              getBadgeClasses(String(side.tone ?? 'amber'))
                            )}
                          >
                            {String(side.badge)}
                          </span>
                        )}
                        {side.title && (
                          <div className="mt-1 font-mono text-[11.5px] font-extrabold text-[var(--dts-ink)]">
                            <InlineCodeAware text={String(side.title)} />
                          </div>
                        )}
                        {Array.isArray(side.bullets) && (
                          <ul className="mt-1 space-y-1 pl-4 list-disc text-[11.5px] leading-snug text-[var(--dts-ink-soft)]">
                            {side.bullets.map((b: any, bi: number) => (
                              <li key={bi}>
                                <InlineCodeAware text={String(b)} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {doc.kind === 'flow' && Array.isArray(doc.steps) && (
                  <ol className="mt-2.5 space-y-1.5">
                    {doc.steps.map((st: any, si: number) => (
                      <li
                        key={si}
                        className="rounded-lg border border-[var(--dts-border-soft)] bg-[var(--dts-panel)] px-2.5 py-2 text-[11.5px]"
                      >
                        <div className="flex flex-wrap items-center gap-1.5 font-mono font-bold text-[var(--dts-ink)]">
                          <span>{String(st.title ?? `Step ${si + 1}`)}</span>
                          {st.edge && (
                            <span
                              className={cn(
                                'rounded-full border border-[var(--dts-border)] px-1.5 py-0.1 text-[9.5px]',
                                getBadgeClasses(String(st.tone ?? 'emerald'))
                              )}
                            >
                              → {String(st.edge)}
                            </span>
                          )}
                        </div>
                        {st.desc && (
                          <p className="mt-0.5 leading-snug text-[var(--dts-ink-soft)]">
                            <InlineCodeAware text={String(st.desc)} />
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {doc.kind === 'troubleshoot' && Array.isArray(doc.items) && (
                  <div className="mt-2.5 space-y-2">
                    {doc.items.map((it: any, ti: number) => (
                      <div
                        key={ti}
                        className="rounded-lg border border-[var(--dts-border-soft)] bg-[var(--dts-panel)] p-2.5 text-[11.5px]"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          {it.badge && (
                            <span
                              className={cn(
                                'rounded-full border border-[var(--dts-border)] px-2 py-0.2 font-mono text-[9.5px] font-bold',
                                getBadgeClasses(String(it.tone ?? 'rose'))
                              )}
                            >
                              {String(it.badge)}
                            </span>
                          )}
                          <span className="font-bold text-[var(--dts-ink)]">
                            <InlineCodeAware text={String(it.symptom ?? '')} />
                          </span>
                        </div>
                        {it.cause && (
                          <p className="mt-1 leading-snug text-[var(--dts-ink-soft)]">
                            <strong className="text-[var(--dts-ink)]">Nguyên nhân: </strong>
                            <InlineCodeAware text={String(it.cause)} />
                          </p>
                        )}
                        {it.fix && (
                          <p className="mt-0.5 leading-snug text-[var(--dts-ink-soft)]">
                            <strong className="text-[var(--dts-green-ink)]">Cách xử lý: </strong>
                            <InlineCodeAware text={String(it.fix)} />
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(doc.kind === 'anatomy' || doc.kind === 'groups') &&
                  Array.isArray(doc.items) && (
                    <div className="mt-2.5 space-y-1.5">
                      {doc.items.map((it: any, ai: number) => (
                        <div
                          key={ai}
                          className="rounded-lg border border-[var(--dts-border-soft)] bg-[var(--dts-panel)] px-2.5 py-2 text-[11.5px]"
                        >
                          <div className="font-mono font-bold text-[var(--dts-ink)]">
                            <InlineCodeAware
                              text={String(
                                it.title ?? it.keyword ?? it.name ?? it.key ?? it.term ?? ''
                              )}
                            />
                          </div>
                          {(it.desc || it.summary || it.detail || it.note) && (
                            <p className="mt-0.5 leading-snug text-[var(--dts-ink-soft)]">
                              <InlineCodeAware
                                text={String(it.desc ?? it.summary ?? it.detail ?? it.note)}
                              />
                            </p>
                          )}
                          {Array.isArray(it.bullets) && (
                            <ul className="mt-1 space-y-0.5 pl-4 list-disc text-[var(--dts-ink-soft)]">
                              {it.bullets.map((b: any, bi: number) => (
                                <li key={bi}>
                                  <InlineCodeAware text={String(b)} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                {doc.kind === 'layers' && Array.isArray(doc.columns) && (
                  <div className="mt-2.5 space-y-2">
                    {doc.columns.map((col: any, ci: number) => (
                      <div
                        key={ci}
                        className="rounded-lg border border-[var(--dts-border-soft)] bg-[var(--dts-panel)] p-2.5 text-[11.5px]"
                      >
                        {col.title && (
                          <div className="font-mono font-extrabold text-[var(--dts-ink)]">
                            <InlineCodeAware text={String(col.title)} />
                          </div>
                        )}
                        {Array.isArray(col.layers ?? col.items) && (
                          <ul className="mt-1 space-y-1 pl-4 list-disc text-[var(--dts-ink-soft)]">
                            {(col.layers ?? col.items).map((ly: any, li: number) => (
                              <li key={li}>
                                <InlineCodeAware
                                  text={
                                    typeof ly === 'string'
                                      ? ly
                                      : `${ly.label ?? ly.title ?? ly.name ?? ''}${ly.detail ?? ly.desc ? ` — ${ly.detail ?? ly.desc}` : ''}`
                                  }
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          } catch {
            // Ignore malformed visual YAML
          }
          continue;
        }
        out.push(
          <BlueprintCodeBlock
            key={key++}
            code={buf.join('\n')}
            langTag={tag || undefined}
          />
        );
        continue;
      }

      // Subheading ###
      const h3 = line.match(/^#{1,4}\s+(.*)$/);
      if (h3) {
        out.push(
          <h4
            key={key++}
            className="mt-3 mb-1 font-mono text-[12.5px] font-extrabold text-[var(--dts-ink)]"
          >
            <InlineCodeAware text={h3[1]} />
          </h4>
        );
        i++;
        continue;
      }

      // Markdown table (with smart collapsible wrapper for JS/Node/TS comparison tables)
      if (
        /^\s*\|/.test(line) &&
        /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')
      ) {
        const headers = splitTableRow(line);
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          rows.push(splitTableRow(lines[i++]));
        }

        const firstColClean = (headers[0] ?? '').replace(/\*|`/g, '').trim();
        const secondColClean = (headers[1] ?? '').replace(/\*|`/g, '').trim();
        const isJsComparisonTable =
          /^(js|javascript|node(\.js)?|typescript|ts|fetch\s*\/\s*axios)\b/i.test(firstColClean) ||
          (firstColClean === '' && /^(node(\.js)?|js|javascript)\b/i.test(secondColClean));

        const tableEl = (
          <div className="overflow-x-auto rounded-xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)]">
            <table className="w-full border-collapse text-left text-[11.5px]">
              <thead className="border-b border-[var(--dts-border)] bg-[var(--dts-panel-muted)] font-mono text-[10.5px]">
                <tr>
                  {headers.map((h, hi) => (
                    <th key={hi} className="px-2 py-1.5 font-bold text-[var(--dts-ink)]">
                      <InlineCodeAware text={h} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-[var(--dts-border-soft)] last:border-0"
                  >
                    {r.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1.5 align-top break-words text-[var(--dts-ink-soft)]">
                        <InlineCodeAware text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

        if (isJsComparisonTable) {
          const labelSrc = firstColClean || secondColClean || 'JavaScript / Node.js';
          out.push(
            <details
              key={key++}
              open={showJsTsComparison}
              className="group/js my-2.5 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)]/70 p-2"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-1 py-0.5 font-mono text-[11px] font-bold text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]">
                <span className="inline-flex items-center gap-1.5">
                  <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-[var(--dts-blue-ink)]" />
                  <span>
                    {lang === 'en'
                      ? `Optional Reference for ${labelSrc} Developers`
                      : `Bảng đối chiếu mở rộng cho người từng biết ${labelSrc} (Tùy chọn)`}
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-open/js:rotate-90" />
              </summary>
              <div className="mt-2">{tableEl}</div>
            </details>
          );
        } else {
          out.push(
            <div key={key++} className="my-2.5">
              {tableEl}
            </div>
          );
        }
        continue;
      }

      // Blockquote & GitHub-style Alert Callouts (> [!NOTE] Title / > [!TIP] / > [!WARNING]...)
      if (/^>\s?/.test(line)) {
        const rawLines: string[] = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          rawLines.push(lines[i++].replace(/^>\s?/, ''));
        }
        if (rawLines.length === 0) continue;

        const firstLine = rawLines[0].trim();
        const alertMatch = firstLine.match(
          /^\[!(NOTE|INFO|TIP|ANALOGY|IMPORTANT|REMEMBER|WARNING|CAUTION|DANGER)\]\s*(.*)$/i
        );

        let alertKind: AlertKind | null = null;
        let alertCustomTitle = '';
        const bodyLines = [...rawLines];

        if (alertMatch) {
          alertKind = alertMatch[1].toUpperCase() as AlertKind;
          alertCustomTitle = alertMatch[2].trim();
          bodyLines.shift();
        }

        // Parse body lines into structured paragraphs & bullets instead of flattening!
        const bodyNodes: React.ReactNode[] = [];
        let bIdx = 0;
        let subKey = 0;
        while (bIdx < bodyLines.length) {
          const bl = bodyLines[bIdx];
          if (!bl.trim()) {
            bIdx++;
            continue;
          }
          if (/^\s*([-*]|\d+\.)\s+/.test(bl)) {
            const bItems: string[] = [];
            while (
              bIdx < bodyLines.length &&
              /^\s*([-*]|\d+\.)\s+/.test(bodyLines[bIdx])
            ) {
              bItems.push(
                bodyLines[bIdx++]
                  .replace(/^\s*([-*]|\d+\.)\s+/, '')
                  .replace(/^\[[xX!>+]\]\s+/, '')
              );
            }
            bodyNodes.push(
              <ul
                key={subKey++}
                className="mt-1 space-y-1 pl-4 list-disc text-[12px] leading-relaxed"
              >
                {bItems.map((it, ii) => (
                  <li key={ii}>
                    <InlineCodeAware text={it} />
                  </li>
                ))}
              </ul>
            );
          } else {
            const pChunk: string[] = [];
            while (
              bIdx < bodyLines.length &&
              bodyLines[bIdx].trim() &&
              !/^\s*([-*]|\d+\.)\s+/.test(bodyLines[bIdx])
            ) {
              pChunk.push(bodyLines[bIdx++].trim());
            }
            if (pChunk.length) {
              bodyNodes.push(
                <p key={subKey++} className="mt-1 first:mt-0 text-[12.5px] leading-relaxed">
                  <InlineCodeAware text={pChunk.join(' ')} />
                </p>
              );
            }
          }
        }

        if (alertKind) {
          const meta = getAlertPresentation(alertKind, lang);
          const AlertIcon = meta.Icon;
          const headerText = alertCustomTitle || meta.defaultTitle;
          out.push(
            <div
              key={key++}
              className={cn('my-2.5 rounded-xl border p-3', meta.boxCls)}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[var(--dts-border)]',
                    meta.badgeCls
                  )}
                >
                  <AlertIcon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11.5px] font-extrabold leading-snug text-[var(--dts-ink)]">
                    <InlineCodeAware text={headerText} disablePlainTerms />
                  </div>
                  {bodyNodes.length > 0 && (
                    <div className="mt-1 text-[var(--dts-ink-soft)]">{bodyNodes}</div>
                  )}
                </div>
              </div>
            </div>
          );
        } else if (bodyNodes.length > 0) {
          out.push(
            <div
              key={key++}
              className="my-2 rounded-lg border-l-[3px] border-[var(--dts-border)] bg-[var(--dts-panel-muted)] px-3 py-2 text-[12.5px] text-[var(--dts-ink-soft)]"
            >
              {bodyNodes}
            </div>
          );
        }
        continue;
      }

      // Bullet or numbered list
      if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
          items.push(
            lines[i++]
              .replace(/^\s*([-*]|\d+\.)\s+/, '')
              .replace(/^\[[xX!>+]\]\s+/, '')
          );
        }
        out.push(
          <ul
            key={key++}
            className="my-2 space-y-1 pl-4 text-[13px] leading-relaxed text-[var(--dts-ink-soft)] list-disc marker:text-[var(--dts-ink)]"
          >
            {items.map((it, idx) => (
              <li key={idx}>
                <InlineCodeAware text={it} />
              </li>
            ))}
          </ul>
        );
        continue;
      }

      if (!line.trim() || /^---+$/.test(line.trim())) {
        i++;
        continue;
      }

      // Image lines skipped cleanly since SVG stage visualizes the concept
      if (/^!\[/.test(line.trim())) {
        i++;
        continue;
      }

      const pBuf: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(```|#{1,4}\s|>|\s*\||\s*([-*]|\d+\.)\s+)/.test(lines[i])
      ) {
        pBuf.push(lines[i++].trim());
      }
      if (pBuf.length) {
        out.push(
          <p
            key={key++}
            className="my-2 text-[13px] leading-[1.62] text-[var(--dts-ink-soft)]"
          >
            <InlineCodeAware text={pBuf.join(' ')} />
          </p>
        );
      } else {
        i++;
      }
    }

    return out;
  }, [source, showJsTsComparison, lang]);

  return <div className={cn('space-y-1', className)}>{blocks}</div>;
};

import React from 'react';
import { findGlossaryTerm, ALL_GLOSSARY_TERMS } from '@/data/glossary';
import { GlossaryCategory, GlossaryTerm } from '@/types/glossary.types';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getAppContainerWidth } from '@/utils/viewport';
import { cn } from '@/utils/cn';

const CATEGORY_HIGHLIGHT_STYLE: Record<GlossaryCategory, string> = {
  keyword:
    'text-emerald-300 bg-emerald-500/10 border-b border-dotted border-emerald-400/70 hover:bg-emerald-500/20',
  declaration:
    'text-sky-300 bg-sky-500/10 border-b border-dotted border-sky-400/70 hover:bg-sky-500/20',
  builtin_func:
    'text-cyan-300 bg-cyan-500/10 border-b border-dotted border-cyan-400/70 hover:bg-cyan-500/20',
  method:
    'text-cyan-300 bg-cyan-500/10 border-b border-dotted border-cyan-400/70 hover:bg-cyan-500/20',
  builtin_type:
    'text-emerald-300 bg-emerald-500/10 border-b border-dotted border-emerald-400/70 hover:bg-emerald-500/20',
  dunder:
    'text-amber-300 bg-amber-500/10 border-b border-dotted border-amber-400/70 hover:bg-amber-500/20',
  concept:
    'text-sky-300 bg-sky-500/10 border-b border-dotted border-sky-400/70 hover:bg-sky-500/20',
  ecosystem:
    'text-amber-300 bg-amber-500/10 border-b border-dotted border-amber-400/70 hover:bg-amber-500/20',
  stdlib:
    'text-emerald-300 bg-emerald-500/10 border-b border-dotted border-emerald-400/70 hover:bg-emerald-500/20',
};

/**
 * Để tránh việc tìm kiếm và thay thế tự động nhầm vào các từ tiếng Việt hoặc từ tiếng Anh thông thường
 * trong câu văn (như "in", "is", "for", "or", "and", "not", "set", "list", "chuỗi", "số nguyên"...),
 * chỉ nhận diện trong văn bản thường (ngoài cặp dấu backtick `...`) những thuật ngữ chuyên ngành
 * đa từ hoặc tên riêng đặc trưng. Các từ khoá ngắn (`if`, `in`, `is`, `def`, `int`, `str`...) chỉ được
 * gắn popup khi tác giả bọc rõ ràng trong cặp dấu code `...` hoặc in đậm **...**.
 */
const SAFE_PLAIN_TEXT_TERMS: string[] = Array.from(
  new Set(
    ALL_GLOSSARY_TERMS.filter(
      (t) => t.category === 'concept' || t.category === 'ecosystem' || t.category === 'dunder'
    )
      .flatMap((t) => [t.term, ...(t.aliases || [])])
      .filter(
        (s) =>
          s.length >= 6 &&
          /^[A-Za-z0-9_.@\s-]+$/.test(s) &&
          !/^(function|method|object|string|number|boolean|module|package|library)$/i.test(s)
      )
  )
).sort((a, b) => b.length - a.length);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SURFACE_REGEX =
  SAFE_PLAIN_TEXT_TERMS.length > 0
    ? new RegExp(`\\b(${SAFE_PLAIN_TEXT_TERMS.map(escapeRegex).join('|')})\\b`, 'g')
    : null;

interface InteractiveTermTriggerProps {
  term: GlossaryTerm;
  displayText: string;
  isCode?: boolean;
}

export const InteractiveTermTrigger: React.FC<InteractiveTermTriggerProps> = ({
  term,
  displayText,
  isCode = false,
}) => {
  const showTermPopover = useNavigationStore((s) => s.showTermPopover);
  const hideTermPopover = useNavigationStore((s) => s.hideTermPopover);

  const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (getAppContainerWidth() < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    showTermPopover(
      term.id,
      {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        width: rect.width,
      },
      false
    );
  };

  const handleMouseLeave = () => {
    if (getAppContainerWidth() < 1024) return;
    hideTermPopover(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    showTermPopover(
      term.id,
      {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        width: rect.width,
      },
      true
    );
  };

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={`Hover hoặc Click để xem giải thích: ${term.term}`}
      className={cn(
        'cursor-help rounded px-1 py-0.5 transition-colors duration-150 inline-block leading-baseline',
        isCode && 'font-mono text-[0.92em]',
        CATEGORY_HIGHLIGHT_STYLE[term.category]
      )}
    >
      {displayText}
    </span>
  );
};

export const RichTextWithTerms: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className }) => {
  const {
    enableAutoHighlight,
    highlightKeywords,
    highlightBuiltins,
    highlightConcepts,
  } = useSettingsStore();

  const isCategoryAllowed = (cat: GlossaryCategory): boolean => {
    if (!enableAutoHighlight) return false;
    if (cat === 'keyword' || cat === 'declaration') return highlightKeywords;
    if (
      cat === 'builtin_func' ||
      cat === 'builtin_type' ||
      cat === 'dunder' ||
      cat === 'method'
    ) {
      return highlightBuiltins;
    }
    return highlightConcepts;
  };

  // First split by inline code `...` and bold **...**
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return (
    <span className={className}>
      {tokens.map((token, idx) => {
        if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
          const inner = token.slice(1, -1);
          const matched = findGlossaryTerm(inner);
          if (matched && isCategoryAllowed(matched.category)) {
            return (
              <InteractiveTermTrigger
                key={idx}
                term={matched}
                displayText={inner}
                isCode
              />
            );
          }
          return (
            <code
              key={idx}
              className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[0.9em] text-amber-300 border border-slate-700/60"
            >
              {inner}
            </code>
          );
        }

        if (
          token.startsWith('**') &&
          token.endsWith('**') &&
          token.length > 4
        ) {
          const inner = token.slice(2, -2);
          const matched = findGlossaryTerm(inner);
          if (matched && isCategoryAllowed(matched.category)) {
            return (
              <strong key={idx} className="font-semibold">
                <InteractiveTermTrigger term={matched} displayText={inner} />
              </strong>
            );
          }
          return (
            <strong key={idx} className="font-semibold text-white">
              {inner}
            </strong>
          );
        }

        if (!enableAutoHighlight || !SURFACE_REGEX) {
          return <React.Fragment key={idx}>{token}</React.Fragment>;
        }

        // Match only multi-word or distinctive technical terms inside normal text segments
        const subParts = token.split(SURFACE_REGEX);
        return (
          <React.Fragment key={idx}>
            {subParts.map((part, sIdx) => {
              const matched = findGlossaryTerm(part);
              if (matched && isCategoryAllowed(matched.category)) {
                return (
                  <InteractiveTermTrigger
                    key={sIdx}
                    term={matched}
                    displayText={part}
                  />
                );
              }
              return <React.Fragment key={sIdx}>{part}</React.Fragment>;
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
};

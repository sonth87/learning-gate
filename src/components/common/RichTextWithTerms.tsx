import React from 'react';
import { findGlossaryTerm, ALL_GLOSSARY_TERMS } from '@/data/glossary';
import { GlossaryCategory, GlossaryTerm } from '@/types/glossary.types';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { cn } from '@/utils/cn';

const CATEGORY_HIGHLIGHT_STYLE: Record<GlossaryCategory, string> = {
  keyword:
    'text-fuchsia-300 bg-fuchsia-500/10 border-b border-dashed border-fuchsia-400/60 hover:bg-fuchsia-500/25',
  declaration:
    'text-violet-300 bg-violet-500/10 border-b border-dashed border-violet-400/60 hover:bg-violet-500/25',
  builtin_func:
    'text-cyan-300 bg-cyan-500/10 border-b border-dashed border-cyan-400/60 hover:bg-cyan-500/25',
  method:
    'text-teal-300 bg-teal-500/10 border-b border-dashed border-teal-400/60 hover:bg-teal-500/25',
  builtin_type:
    'text-emerald-300 bg-emerald-500/10 border-b border-dashed border-emerald-400/60 hover:bg-emerald-500/25',
  dunder:
    'text-amber-300 bg-amber-500/10 border-b border-dashed border-amber-400/60 hover:bg-amber-500/25',
  concept:
    'text-indigo-300 bg-indigo-500/10 border-b border-dashed border-indigo-400/60 hover:bg-indigo-500/25',
  ecosystem:
    'text-rose-300 bg-rose-500/10 border-b border-dashed border-rose-400/60 hover:bg-rose-500/25',
  stdlib:
    'text-emerald-300 bg-emerald-500/10 border-b border-dashed border-emerald-400/60 hover:bg-emerald-500/25',
};

// Build sorted surface terms for plain-text matching (longest first)
const PLAIN_SURFACE_TERMS: string[] = Array.from(
  new Set(
    ALL_GLOSSARY_TERMS.flatMap((t) => [t.term, ...(t.aliases || [])]).filter(
      (s) => s.length >= 3
    )
  )
).sort((a, b) => b.length - a.length);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SURFACE_REGEX = new RegExp(
  `(${PLAIN_SURFACE_TERMS.map(escapeRegex).join('|')})`,
  'gi'
);

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
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
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
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
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

        if (!enableAutoHighlight) {
          return <React.Fragment key={idx}>{token}</React.Fragment>;
        }

        // Match plain-text technical terms inside normal text segments
        const subParts = token.split(SURFACE_REGEX);
        return (
          <React.Fragment key={idx}>
            {subParts.map((part, sIdx) => {
              const matched = findGlossaryTerm(part);
              if (matched && isCategoryAllowed(matched.category)) {
                // Ensure word boundary for short words like 'is' or 'def'
                if (part.length <= 4 && !/^[a-zA-Z_]+$/.test(part)) {
                  return <React.Fragment key={sIdx}>{part}</React.Fragment>;
                }
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

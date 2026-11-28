import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Clock, FlaskConical, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  LAB_LEVELS,
  LAB_LEVEL_META,
  type BiText,
  type LabChallengeSpec,
  type LabLevel,
} from '../../data/labChallenges';

type Lang = 'vi' | 'en';
const pick = (t: BiText, lang: Lang) => (lang === 'en' ? t.en : t.vi);

/** Màu theo cấp độ (token DTS). */
const LEVEL_TONE: Record<LabLevel, { bg: string; ink: string; soft: string }> = {
  beginner: {
    bg: 'var(--dts-green-bg)',
    ink: 'var(--dts-green-ink)',
    soft: 'var(--dts-green-soft)',
  },
  intermediate: {
    bg: 'var(--dts-blue-bg)',
    ink: 'var(--dts-blue-ink)',
    soft: 'var(--dts-blue-soft)',
  },
  advanced: {
    bg: 'var(--dts-purple-bg)',
    ink: 'var(--dts-purple-ink)',
    soft: 'var(--dts-purple-soft)',
  },
  expert: { bg: 'var(--dts-rose-bg)', ink: 'var(--dts-rose-ink)', soft: 'var(--dts-rose-soft)' },
};

export const LabLevelBadge: React.FC<{ level: LabLevel; lang: Lang; className?: string }> = ({
  level,
  lang,
  className,
}) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-extrabold leading-none',
      className
    )}
    style={{
      backgroundColor: LEVEL_TONE[level].bg,
      color: LEVEL_TONE[level].ink,
      borderColor: 'var(--dts-border)',
    }}
  >
    {pick(LAB_LEVEL_META[level].label, lang)}
  </span>
);

/** Độ khó 1–4 dạng chấm. */
export const LabDifficultyPips: React.FC<{ value: number; lang: Lang; level: LabLevel }> = ({
  value,
  lang,
  level,
}) => (
  <span
    className="inline-flex items-center gap-0.5"
    role="img"
    aria-label={lang === 'en' ? `Difficulty ${value} of 4` : `Độ khó ${value}/4`}
    title={lang === 'en' ? `Difficulty ${value}/4` : `Độ khó ${value}/4`}
  >
    {[1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className="h-1.5 w-1.5 rounded-full border"
        style={{
          borderColor: LEVEL_TONE[level].ink,
          backgroundColor: i <= value ? LEVEL_TONE[level].ink : 'transparent',
        }}
      />
    ))}
  </span>
);

const EarnedStars: React.FC<{ stars: number; lang: Lang }> = ({ stars, lang }) => (
  <span
    className="font-mono text-[11px] font-bold leading-none"
    style={{ color: stars > 0 ? 'var(--dts-amber-ink)' : 'var(--dts-ink-muted)' }}
    aria-label={lang === 'en' ? `${stars} of 3 stars earned` : `Đã đạt ${stars}/3 sao`}
  >
    {'★'.repeat(stars)}
    {'☆'.repeat(Math.max(0, 3 - stars))}
  </span>
);

type LevelFilter = 'all' | LabLevel;

const FILTER_KEY = 'sd-lab-picker-filter';
function readFilter(): LevelFilter {
  try {
    const v = window.localStorage.getItem(FILTER_KEY);
    if (v === 'all' || (LAB_LEVELS as readonly string[]).includes(v ?? '')) return v as LevelFilter;
  } catch {
    /* bộ nhớ trình duyệt không khả dụng */
  }
  return 'all';
}
function writeFilter(v: LevelFilter) {
  try {
    window.localStorage.setItem(FILTER_KEY, v);
  } catch {
    /* bỏ qua */
  }
}

export interface LabPickerProps {
  lang: Lang;
  labs: LabChallengeSpec[];
  /** 'sandbox' hoặc id bài Lab. */
  activeId: string;
  /** Số sao đã đạt theo id bài (0–3). */
  starsById: Record<string, number | undefined>;
  onSelect: (id: string) => void;
}

/**
 * Bộ chọn bài Lab: nút hiển thị bài hiện tại, mở bảng danh sách nhóm theo cấp độ (badge cấp độ,
 * độ khó, thẻ khái niệm, thời gian ước tính, số sao đã đạt), lọc theo cấp độ, tiến độ từng cấp
 * và lối vào Sandbox. Esc đóng (chặn ở pha capture để không thoát fullscreen), bấm ra ngoài đóng,
 * mũi tên lên/xuống di chuyển giữa các mục.
 */
export const LabPicker: React.FC<LabPickerProps> = ({
  lang,
  labs,
  activeId,
  starsById,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<LevelFilter>(() => readFilter());
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  const active = labs.find((l) => l.id === activeId) ?? null;
  const isDone = useCallback((id: string) => (starsById[id] ?? 0) > 0, [starsById]);

  const byLevel = useMemo(() => {
    const m = new Map<LabLevel, LabChallengeSpec[]>();
    for (const lv of LAB_LEVELS) m.set(lv, []);
    for (const l of labs) m.get(l.level)?.push(l);
    return m;
  }, [labs]);
  const doneTotal = labs.filter((l) => isDone(l.id)).length;

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // Esc (capture + stopPropagation: không để Esc thoát fullscreen của app) & bấm ra ngoài
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        close();
      }
    };
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node | null;
      if (t && rootRef.current && !rootRef.current.contains(t)) close(false);
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('touchstart', onDown, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('touchstart', onDown, true);
    };
  }, [open, close]);

  // Khi mở: đưa focus tới mục đang chọn (hoặc mục đầu tiên)
  useEffect(() => {
    if (!open) return;
    const root = listRef.current;
    if (!root) return;
    const cur =
      root.querySelector<HTMLElement>('[data-lab-item][aria-current="true"]') ??
      root.querySelector<HTMLElement>('[data-lab-item]');
    cur?.focus();
    cur?.scrollIntoView?.({ block: 'nearest' });
  }, [open]);

  const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[data-lab-item]') ?? []
    );
    if (items.length === 0) return;
    e.preventDefault();
    const idx = items.indexOf(document.activeElement as HTMLElement);
    let next = 0;
    if (e.key === 'ArrowDown') next = idx < 0 ? 0 : Math.min(items.length - 1, idx + 1);
    else if (e.key === 'ArrowUp') next = idx < 0 ? items.length - 1 : Math.max(0, idx - 1);
    else if (e.key === 'End') next = items.length - 1;
    items[next]?.focus();
  };

  const choose = (id: string) => {
    close();
    if (id !== activeId) onSelect(id);
  };

  const setLevelFilter = (f: LevelFilter) => {
    setFilter(f);
    writeFilter(f);
  };

  const levelsShown = filter === 'all' ? LAB_LEVELS : [filter];
  const t = (vi: string, en: string) => (lang === 'en' ? en : vi);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={t('Chọn bài toán Phòng Lab', 'Select Lab Challenge')}
        onClick={() => (open ? close() : setOpen(true))}
        className="dts-btn-tactile inline-flex max-w-[min(26rem,calc(100vw-2rem))] items-center gap-1.5 rounded-xl px-2.5 py-1 text-left"
        style={{ backgroundColor: 'var(--dts-panel-elevated)' }}
      >
        <FlaskConical className="h-3.5 w-3.5 shrink-0 text-[var(--dts-blue-ink)]" />
        {active ? (
          <>
            <span className="shrink-0 font-mono text-[11px] font-extrabold text-[var(--dts-blue-ink)]">
              {active.code}
            </span>
            <span className="min-w-0 truncate font-mono text-xs font-extrabold text-[var(--dts-ink)]">
              {pick(active.title, lang)}
            </span>
            <LabLevelBadge level={active.level} lang={lang} className="hidden sm:inline-flex" />
          </>
        ) : (
          <span className="min-w-0 truncate font-mono text-xs font-extrabold text-[var(--dts-ink)]">
            {t('Sandbox tự do', 'Free Sandbox')}
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-[var(--dts-ink-muted)] transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t('Danh sách bài Lab', 'Lab challenges')}
          className="absolute left-0 top-full z-[70] mt-1.5 flex max-h-[min(70vh,40rem)] w-[min(36rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl"
          style={{
            backgroundColor: 'var(--dts-panel-elevated)',
            border: '2px solid var(--dts-border)',
            boxShadow: '3px 4px 0 var(--dts-shadow-color)',
          }}
        >
          {/* Header + bộ lọc cấp độ */}
          <div className="shrink-0 border-b border-[var(--dts-line-strong)] px-3 pt-2.5 pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono text-xs font-extrabold text-[var(--dts-ink)]">
                {t('Phòng Lab · chọn bài', 'Lab · pick a challenge')}
              </div>
              <div className="font-mono text-[10.5px] font-bold text-[var(--dts-ink-muted)]">
                {t(
                  `${doneTotal}/${labs.length} bài đã hoàn thành`,
                  `${doneTotal}/${labs.length} completed`
                )}
              </div>
            </div>
            <div
              className="mt-2 flex flex-wrap gap-1"
              role="group"
              aria-label={t('Lọc theo cấp độ', 'Filter by level')}
            >
              {(['all', ...LAB_LEVELS] as LevelFilter[]).map((f) => {
                const sel = filter === f;
                const list = f === 'all' ? labs : (byLevel.get(f) ?? []);
                const done = list.filter((l) => isDone(l.id)).length;
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={sel}
                    onClick={() => setLevelFilter(f)}
                    className={cn(
                      'rounded-lg border px-2 py-0.5 font-mono text-[10.5px] font-extrabold transition-colors',
                      sel
                        ? 'text-[var(--dts-ink)]'
                        : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
                    )}
                    style={{
                      borderColor: sel ? 'var(--dts-border)' : 'var(--dts-line-strong)',
                      backgroundColor: sel
                        ? f === 'all'
                          ? 'var(--dts-panel-muted)'
                          : LEVEL_TONE[f].bg
                        : 'transparent',
                      color: sel && f !== 'all' ? LEVEL_TONE[f].ink : undefined,
                    }}
                  >
                    {f === 'all' ? t('Tất cả', 'All') : pick(LAB_LEVEL_META[f].label, lang)}
                    <span className="ml-1 opacity-70">
                      {done}/{list.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 overflow-y-auto px-2 py-2"
            onKeyDown={onListKeyDown}
          >
            {/* Sandbox */}
            <button
              type="button"
              data-lab-item
              aria-current={activeId === 'sandbox' ? 'true' : undefined}
              onClick={() => choose('sandbox')}
              className={cn(
                'mb-2 flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dts-blue-ink)]',
                activeId === 'sandbox'
                  ? 'border-[var(--dts-border)] bg-[var(--dts-amber-soft)]'
                  : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] hover:border-[var(--dts-border)]'
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--dts-amber-ink)]" />
              <div className="min-w-0">
                <div className="font-mono text-[11.5px] font-extrabold text-[var(--dts-ink)]">
                  {t('Sandbox tự do', 'Free Architecture Sandbox')}
                </div>
                <div className="text-[11px] text-[var(--dts-ink-muted)]">
                  {t(
                    'Thử nghiệm kiến trúc bất kỳ, không chấm điểm.',
                    'Experiment with any architecture, no grading.'
                  )}
                </div>
              </div>
            </button>

            {levelsShown.map((lv) => {
              const list = byLevel.get(lv) ?? [];
              if (list.length === 0) return null;
              const done = list.filter((l) => isDone(l.id)).length;
              const pct = Math.round((done / list.length) * 100);
              return (
                <section
                  key={lv}
                  className="mb-2.5"
                  aria-label={pick(LAB_LEVEL_META[lv].label, lang)}
                >
                  <div className="sticky top-0 z-10 mb-1 flex items-center gap-2 bg-[var(--dts-panel-elevated)] px-1 py-1">
                    <LabLevelBadge level={lv} lang={lang} />
                    <span className="font-mono text-[10px] text-[var(--dts-ink-muted)]">
                      {LAB_LEVEL_META[lv].xp} XP
                    </span>
                    <div
                      className="h-1.5 min-w-[3rem] flex-1 overflow-hidden rounded-full"
                      style={{ backgroundColor: 'var(--dts-panel-muted)' }}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={list.length}
                      aria-valuenow={done}
                      aria-label={t(
                        `Tiến độ ${pick(LAB_LEVEL_META[lv].label, lang)}`,
                        `${pick(LAB_LEVEL_META[lv].label, lang)} progress`
                      )}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: LEVEL_TONE[lv].ink }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-[10.5px] font-bold text-[var(--dts-ink-soft)]">
                      {t(`${done}/${list.length} hoàn thành`, `${done}/${list.length} done`)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {list.map((lab) => {
                      const stars = starsById[lab.id] ?? 0;
                      const cur = lab.id === activeId;
                      return (
                        <button
                          key={lab.id}
                          type="button"
                          data-lab-item
                          aria-current={cur ? 'true' : undefined}
                          onClick={() => choose(lab.id)}
                          className={cn(
                            'flex w-full flex-col gap-1 rounded-xl border px-2.5 py-2 text-left transition-colors',
                            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dts-blue-ink)]',
                            cur
                              ? 'border-[var(--dts-border)]'
                              : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] hover:border-[var(--dts-border)]'
                          )}
                          style={cur ? { backgroundColor: LEVEL_TONE[lab.level].soft } : undefined}
                        >
                          <div className="flex w-full items-center gap-1.5">
                            <span
                              className="shrink-0 font-mono text-[10.5px] font-extrabold"
                              style={{ color: LEVEL_TONE[lab.level].ink }}
                            >
                              {lab.code}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] font-extrabold text-[var(--dts-ink)]">
                              {pick(lab.title, lang)}
                            </span>
                            {stars > 0 && (
                              <CheckCircle2
                                className="h-3.5 w-3.5 shrink-0 text-[var(--dts-green-ink)]"
                                aria-hidden="true"
                              />
                            )}
                            <EarnedStars stars={stars} lang={lang} />
                          </div>
                          <div className="flex w-full flex-wrap items-center gap-1.5">
                            <LabDifficultyPips
                              value={lab.difficulty}
                              lang={lang}
                              level={lab.level}
                            />
                            <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-[var(--dts-ink-muted)]">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {t(`~${lab.estMinutes} phút`, `~${lab.estMinutes} min`)}
                            </span>
                            {lab.concepts.map((c, i) => (
                              <span
                                key={i}
                                className="rounded-md border border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] px-1.5 py-px text-[10px] font-semibold text-[var(--dts-ink-soft)]"
                              >
                                {pick(c, lang)}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

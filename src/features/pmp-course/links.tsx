import React, { useEffect, useState } from 'react';
import { AlertTriangle, Compass, ExternalLink, Info, RefreshCw, X } from 'lucide-react';
import type { PmpMindmapLink } from './types';
import { cn } from '@/utils/cn';

export const DEFAULT_MINDMAP_BASE_URL = 'https://pmp-mindmap.vercel.app';

/**
 * Sinh URL deep link chuẩn xác sang PMP Mindmap (`https://pmp-mindmap.vercel.app`),
 * khớp 100% với `src/features/url-state/codec.ts` và `mapStore.hydrate()`.
 * - Tuyệt đối không dùng tham số đã gỡ bỏ (`sc=`, `rq=`).
 * - Với node thuộc `core.*`, bắt buộc gắn `ed=core`; với node thuộc Book, gắn `ed=book`.
 */
export function buildMindmapUrl(
  link: PmpMindmapLink,
  baseUrl: string = DEFAULT_MINDMAP_BASE_URL
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const params = new URLSearchParams();
  const lang = link.lang ?? 'vi';

  if (link.kind === 'panorama') {
    params.set('v', 'panorama');
    params.set('lang', lang);
    return `${cleanBase}/?${params.toString()}`;
  }

  if (link.kind === 'practice') {
    params.set('v', 'practice');
    params.set('lang', lang);
    return `${cleanBase}/?${params.toString()}`;
  }

  if (link.kind === 'flow') {
    params.set('v', 'flow');
    if (link.flowId) params.set('f', link.flowId);
    params.set('fm', link.flowMode ?? 'guided');
    params.set('lang', lang);
    return `${cleanBase}/?${params.toString()}`;
  }

  // kind === 'node'
  if (link.topicId) params.set('t', link.topicId);
  if (link.nodeId) params.set('n', link.nodeId);
  if (link.panel && link.panel !== 'none') params.set('p', link.panel);
  const ed = link.edition ?? (link.topicId?.startsWith('core.') ? 'core' : 'book');
  params.set('ed', ed);
  params.set('lang', lang);
  return `${cleanBase}/?${params.toString()}`;
}

export function getLinkKindBadge(kind: PmpMindmapLink['kind'], edition?: 'core' | 'book'): {
  label: string;
  cls: string;
} {
  if (kind === 'flow') {
    return {
      label: 'FLOW QUY TRÌNH',
      cls: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
    };
  }
  if (kind === 'panorama') {
    return {
      label: 'PANORAMA 3 GÓC NHÌN',
      cls: 'border-violet-500/40 bg-violet-500/15 text-violet-300',
    };
  }
  if (kind === 'practice') {
    return {
      label: 'PHÒNG LUYỆN ĐỀ',
      cls: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    };
  }
  if (edition === 'core') {
    return {
      label: 'CORE MAP',
      cls: 'border-amber-500/45 bg-amber-500/15 text-amber-300',
    };
  }
  return {
    label: 'BOOK MAP',
    cls: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
  };
}

/**
 * Ngăn Xem Nhanh (Quick Preview Modal) — CHỈ dành cho màn hình rộng Desktop (lg+).
 * Mặc định mọi nút dẫn chứng đều mở Tab mới; đây là tuỳ chọn phụ để liếc nhanh sơ đồ/node
 * mà không rời cửa sổ Learning Gate, kèm thông báo rõ về việc tách biệt Origin / IndexedDB.
 */
export const MindmapQuickPreviewModal: React.FC<{
  link: PmpMindmapLink | null;
  baseUrl?: string;
  onClose: () => void;
  onVisited?: (linkId: string) => void;
}> = ({ link, baseUrl = DEFAULT_MINDMAP_BASE_URL, onClose, onVisited }) => {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!link) return;
    setLoaded(false);
    setTimedOut(false);
    onVisited?.(link.linkId);
    const timer = window.setTimeout(() => {
      setTimedOut(true);
    }, 9000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
    };
  }, [link, onClose, onVisited]);

  if (!link) return null;

  const url = buildMindmapUrl(link, baseUrl);
  const badge = getLinkKindBadge(link.kind, link.edition);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Xem nhanh dẫn chứng: ${link.label}`}
      onClick={onClose}
      className="hidden lg:flex fixed inset-0 z-[130] items-center justify-center bg-black/80 p-5 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[88vh] w-full max-w-[1380px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/95 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Compass className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
            <span className={cn('rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold shrink-0', badge.cls)}>
              {badge.label}
            </span>
            <h3 className="truncate text-sm font-bold text-white">{link.label}</h3>
            {link.bridgeNote && (
              <span className="hidden xl:inline truncate rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                {link.bridgeNote}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onVisited?.(link.linkId)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-extrabold text-slate-950 hover:bg-amber-400 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Mở đầy đủ trong tab mới</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Đóng</span>
            </button>
          </div>
        </div>

        {/* Cross-origin notice */}
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/[0.07] px-4 py-1.5 text-[11px] text-amber-200 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span className="truncate">
              <b>Lưu ý Origin độc lập:</b> PMP Mindmap chạy trên miền riêng (<code className="font-mono">{baseUrl}</code>) nên tiến độ luyện tập & bookmark bên đó tách biệt với Learning Gate. Khi làm đề thực chiến, nên bấm <b>“Mở đầy đủ trong tab mới”</b>.
            </span>
          </div>
          <span className="hidden xl:inline font-mono text-[10px] text-slate-400 shrink-0">{url}</span>
        </div>

        {/* Iframe body + fallback */}
        <div className="relative flex-1 bg-slate-950">
          {!loaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/95 p-6 text-center">
              {!timedOut ? (
                <>
                  <RefreshCw className="h-6 w-6 animate-spin text-amber-400" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-200">Đang tải bản đồ dẫn chứng từ PMP Mindmap…</p>
                  <p className="max-w-md text-xs text-slate-400">{link.whyRead}</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-7 w-7 text-amber-400" aria-hidden="true" />
                  <p className="text-sm font-bold text-white">
                    Trình duyệt đang chặn nhúng khung hoặc kết nối mạng chậm
                  </p>
                  <p className="max-w-md text-xs text-slate-400">
                    Không sao cả! Chế độ chuẩn luôn là mở trực tiếp PMP Mindmap trên tab riêng để có toàn màn hình và lưu tiến độ đầy đủ.
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-400"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Mở ngay trong tab mới</span>
                  </a>
                </>
              )}
            </div>
          )}
          <iframe
            src={url}
            title={link.label}
            onLoad={() => setLoaded(true)}
            className="h-full w-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
};

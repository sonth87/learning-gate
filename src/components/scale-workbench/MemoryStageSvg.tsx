import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Minus, MousePointerClick, Plus } from 'lucide-react';
import type { WorkbenchLang, WorkbenchTheme } from '@/stores/useWorkbenchStore';
import {
  pickText,
  type BilingualText,
  type IsoTone,
  type MemoryScene,
  type StageInspectorInfo,
} from './types';
import {
  StageEntityInspectorCard,
  resolveFallbackInspector,
} from './StageEntityInspector';

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

function toneColors(tone: IsoTone, isDark: boolean): { bg: string; border: string; fg: string } {
  if (isDark) {
    switch (tone) {
      case 'green':
        return { bg: '#2f4524', border: '#8ec973', fg: '#e5f7dc' };
      case 'blue':
        return { bg: '#243b55', border: '#86b7eb', fg: '#e3f0fd' };
      case 'orange':
        return { bg: '#52321a', border: '#efa86b', fg: '#fdebd9' };
      case 'purple':
        return { bg: '#3c2b57', border: '#c4a6f0', fg: '#f1e8fc' };
      case 'rose':
        return { bg: '#52232a', border: '#ee8b96', fg: '#fde4e7' };
      case 'yellow':
        return { bg: '#4f3d1b', border: '#ebd078', fg: '#fdf4d7' };
      default:
        return { bg: '#332d27', border: '#9c9183', fg: '#efe6d6' };
    }
  }

  switch (tone) {
    case 'green':
      return { bg: '#dff0d2', border: '#211e1b', fg: '#1d2816' };
    case 'blue':
      return { bg: '#dceafa', border: '#211e1b', fg: '#172738' };
    case 'orange':
      return { bg: '#fde2c6', border: '#211e1b', fg: '#331d0b' };
    case 'purple':
      return { bg: '#ece1fa', border: '#211e1b', fg: '#281a3d' };
    case 'rose':
      return { bg: '#fde0e3', border: '#c93b32', fg: '#4a141b' };
    case 'yellow':
      return { bg: '#fef0c7', border: '#211e1b', fg: '#38290b' };
    default:
      return { bg: '#f5ede2', border: '#211e1b', fg: '#211e1b' };
  }
}

function wrapTextTwoLines(text: string, maxChars = 66): string[] {
  const clean = text.trim();
  if (clean.length <= maxChars) return [clean];
  const words = clean.split(/\s+/);
  let line1 = '';
  let idx = 0;
  while (idx < words.length && (line1 ? `${line1} ${words[idx]}` : words[idx]).length <= maxChars) {
    line1 = line1 ? `${line1} ${words[idx]}` : words[idx];
    idx++;
  }
  const rest = words.slice(idx).join(' ');
  return rest ? [line1, rest] : [clean];
}

export const MemoryStageSvg: React.FC<{
  scene: MemoryScene;
  lang: WorkbenchLang;
  theme: WorkbenchTheme;
}> = ({ scene, lang, theme }) => {
  const uid = useId().replace(/:/g, '');
  const isDark = theme === 'dark';
  const ink = isDark ? '#efe6d6' : '#211e1b';
  const muted = isDark ? '#9e9485' : '#6f6961';
  const shadow = isDark ? '#110f0c' : '#1c1a17';
  const cardBg = isDark ? '#2c2721' : '#fcf8f2';

  const [hoverInfo, setHoverInfo] = useState<StageInspectorInfo | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<StageInspectorInfo | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [hintAutoOpen, setHintAutoOpen] = useState(true);
  const [hintHovered, setHintHovered] = useState(false);

  const baseW = 810;
  const baseH = 395;
  const viewBoxStr = `${-baseW / 2} ${-baseH / 2} ${baseW} ${baseH}`;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const camGroupRef = useRef<SVGGElement | null>(null);
  const camRef = useRef<{ zoom: number; panX: number; panY: number }>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });
  const lastDragEndRef = useRef(0);
  const panDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
    svgPerPx: number;
    moved: boolean;
    captured: boolean;
  } | null>(null);

  const buildCamTransform = useCallback(
    (z: number, px: number, py: number) =>
      `translate(${px.toFixed(2)} ${py.toFixed(2)}) scale(${z.toFixed(4)})`,
    []
  );

  const syncDomCamera = useCallback(
    (z: number, px: number, py: number) => {
      camGroupRef.current?.setAttribute('transform', buildCamTransform(z, px, py));
    },
    [buildCamTransform]
  );

  const applyCamera = useCallback(
    (nextZoom: number, nextPanX: number, nextPanY: number) => {
      const clampedZoom = Math.round(Math.max(0.55, Math.min(2.5, nextZoom)) * 100) / 100;
      const maxX = baseW * Math.max(0.75, clampedZoom * 0.85);
      const maxY = baseH * Math.max(0.75, clampedZoom * 0.85);
      const px = Math.max(-maxX, Math.min(maxX, nextPanX));
      const py = Math.max(-maxY, Math.min(maxY, nextPanY));
      camRef.current = { zoom: clampedZoom, panX: px, panY: py };
      syncDomCamera(clampedZoom, px, py);
      setZoom(clampedZoom);
      setPan({ x: px, y: py });
    },
    [syncDomCamera]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHintAutoOpen(false);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setHoverInfo(null);
    setSelectedInfo(null);
    camRef.current = { zoom: 1, panX: 0, panY: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [scene]);

  const handleZoomBy = useCallback(
    (delta: number) => {
      const cur = camRef.current;
      const nextZoom = Math.round(Math.max(0.55, Math.min(2.5, cur.zoom + delta)) * 100) / 100;
      const ratio = nextZoom / cur.zoom;
      applyCamera(nextZoom, cur.panX * ratio, cur.panY * ratio);
    },
    [applyCamera]
  );

  const handleResetView = useCallback(() => {
    camRef.current = { zoom: 1, panX: 0, panY: 0 };
    syncDomCamera(1, 0, 0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [syncDomCamera]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) === 0 && Math.abs(e.deltaX) === 0) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const svgPerPx = Math.max(
        baseW / Math.max(1, rect.width),
        baseH / Math.max(1, rect.height)
      );
      const mx = (e.clientX - (rect.left + rect.width / 2)) * svgPerPx;
      const my = (e.clientY - (rect.top + rect.height / 2)) * svgPerPx;
      const cur = camRef.current;
      const step = e.deltaY < 0 ? 0.12 : -0.12;
      const nextZoom = Math.round(Math.max(0.55, Math.min(2.5, cur.zoom + step)) * 100) / 100;
      if (nextZoom === cur.zoom) return;
      const ratio = nextZoom / cur.zoom;
      applyCamera(nextZoom, mx - (mx - cur.panX) * ratio, my - (my - cur.panY) * ratio);
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, [applyCamera]);

  const isViewModified = Math.abs(zoom - 1) > 0.005 || Math.hypot(pan.x, pan.y) > 2;
  const initialCamTf = buildCamTransform(zoom, pan.x, pan.y);

  const animKey = JSON.stringify(
    scene.kind === 'tape'
      ? [scene.cells, scene.activeIndices]
      : scene.kind === 'refs'
        ? scene.names.map((n) => `${n.id}:${n.targetId}`)
        : scene.nodes.map((n) => `${n.id}:${n.pruned}`)
  );

  const finishPan = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = panDragRef.current;
    if (!st || e.pointerId !== st.pointerId) return;
    if (st.captured) {
      try {
        e.currentTarget.releasePointerCapture(st.pointerId);
      } catch {
        // ignore
      }
    }
    panDragRef.current = null;
    if (st.moved) {
      lastDragEndRef.current = performance.now();
      setIsPanning(false);
      setPan({ x: camRef.current.panX, y: camRef.current.panY });
    } else {
      const target = e.target as Element;
      if (!target.closest('[data-mem-interactive="true"]')) {
        setSelectedInfo(null);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden select-none"
      style={{
        cursor: isPanning ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const target = e.target as Element;
        if (!target.closest('[data-allow-select="true"]')) {
          e.preventDefault();
        }
      }}
      onClickCapture={(e) => {
        if (performance.now() - lastDragEndRef.current < 200) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        const target = e.target as Element;
        if (target.closest('button, [data-no-pan="true"]')) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const svgPerPx = Math.max(
          baseW / Math.max(1, rect.width),
          baseH / Math.max(1, rect.height)
        );
        panDragRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          origPanX: camRef.current.panX,
          origPanY: camRef.current.panY,
          svgPerPx,
          moved: false,
          captured: false,
        };
      }}
      onPointerMove={(e) => {
        const st = panDragRef.current;
        if (!st || e.pointerId !== st.pointerId) return;
        const dx = e.clientX - st.startX;
        const dy = e.clientY - st.startY;
        if (!st.moved && Math.hypot(dx, dy) > 3) {
          st.moved = true;
          try {
            e.currentTarget.setPointerCapture(st.pointerId);
            st.captured = true;
          } catch {
            // ignore
          }
          setHoverInfo(null);
          setIsPanning(true);
        }
        if (st.moved) {
          e.preventDefault();
          const z = camRef.current.zoom;
          const maxX = baseW * Math.max(0.75, z * 0.85);
          const maxY = baseH * Math.max(0.75, z * 0.85);
          const nextX = Math.max(-maxX, Math.min(maxX, st.origPanX + dx * st.svgPerPx));
          const nextY = Math.max(-maxY, Math.min(maxY, st.origPanY + dy * st.svgPerPx));
          camRef.current.panX = nextX;
          camRef.current.panY = nextY;
          syncDomCamera(z, nextX, nextY);
        }
      }}
      onPointerUp={finishPan}
      onPointerCancel={finishPan}
    >
      <svg
        key={animKey}
        viewBox={viewBoxStr}
        preserveAspectRatio="xMidYMid meet"
        style={{
          pointerEvents: isPanning ? 'none' : 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        className="h-full w-full select-none"
        role="img"
        aria-label="2D Data Structure & Memory Visualizer"
      >
        <defs>
          <pattern id={`dot-${uid}`} width={22} height={22} patternUnits="userSpaceOnUse">
            <circle cx={11} cy={11} r={1} fill={isDark ? '#4a4238' : '#d5c9b8'} />
          </pattern>
          <marker
            id={`marr-${uid}`}
            viewBox="0 0 10 10"
            refX={8.5}
            refY={5}
            markerWidth={5.5}
            markerHeight={5.5}
            orient="auto-start-reverse"
          >
            <path d="M1,1.5 L8.8,5 L1,8.5 Z" fill={ink} />
          </marker>
          <marker
            id={`marr-err-${uid}`}
            viewBox="0 0 10 10"
            refX={8.5}
            refY={5}
            markerWidth={5.5}
            markerHeight={5.5}
            orient="auto-start-reverse"
          >
            <path d="M1,1.5 L8.8,5 L1,8.5 Z" fill="#dc2626" />
          </marker>
        </defs>

        <g ref={camGroupRef} transform={initialCamTf} data-mem-interactive="true">
        <rect x={-2600} y={-1800} width={5200} height={3600} fill={`url(#dot-${uid})`} />

        {/* 1. SPACIOUS 2D SEQUENCE / SLICE / STAGE PIPELINE TAPE */}
        {scene.kind === 'tape' && (() => {
          const n = scene.cells.length;
          const maxCellLen = Math.max(1, ...scene.cells.map((c) => c.length));
          const isStageCards = maxCellLen > 4;
          const gap = isStageCards ? 12 : 6;
          const cw = isStageCards
            ? Math.min(
                Math.max(108, maxCellLen * 7.2 + 24),
                Math.floor((710 - (n - 1) * gap) / Math.max(1, n))
              )
            : Math.min(58, Math.max(42, Math.floor(560 / Math.max(1, n))));
          const ch = isStageCards ? 54 : 50;
          const totalW = n * cw + (n - 1) * gap;
          const startX = -totalW / 2;
          const activeSet = new Set(scene.activeIndices ?? []);
          const subLines = scene.subtitle
            ? wrapTextTwoLines(pickText(scene.subtitle, lang), 68)
            : [];
          const maxCharsInCell = Math.max(6, Math.floor((cw - 16) / 6.8));

          // Precompute non-overlapping rows for pointer pills below cells
          const row0Intervals: Array<[number, number]> = [];
          const pointerPlacements = (scene.pointers ?? []).map((ptr) => {
            const clamped = Math.max(0, Math.min(n - 1, ptr.index));
            const px = startX + clamped * (cw + gap) + cw / 2;
            const bw = Math.max(52, ptr.label.length * 6.8 + 20);
            const x0 = px - bw / 2 - 5;
            const x1 = px + bw / 2 + 5;
            const collidesRow0 = row0Intervals.some(
              ([a0, a1]) => Math.min(x1, a1) - Math.max(x0, a0) > 0
            );
            const row = collidesRow0 ? 1 : 0;
            if (row === 0) row0Intervals.push([x0, x1]);
            return { ptr, px, bw, row };
          });

          return (
            <g>
              <text
                x={0}
                y={subLines.length > 1 ? -128 : -116}
                textAnchor="middle"
                fontSize={14}
                fontWeight={800}
                fill={ink}
                fontFamily="var(--dts-font-mono)"
              >
                {pickText(scene.title, lang)}
              </text>
              {subLines.map((sl, sIdx) => (
                <text
                  key={sIdx}
                  x={0}
                  y={(subLines.length > 1 ? -106 : -94) + sIdx * 15}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill={muted}
                  fontFamily="var(--dts-font-mono)"
                >
                  {sl}
                </text>
              ))}

              {scene.cells.map((val, idx) => {
                const cx = startX + idx * (cw + gap);
                const isAct = activeSet.has(idx);
                const tc = toneColors(isAct ? 'green' : 'neutral', isDark);
                const negIdx = idx - n;
                const cellLines = isStageCards
                  ? wrapTextTwoLines(val, maxCharsInCell)
                  : [val];
                const cellInfo = scene.showNegativeIndices
                  ? {
                      title: bi(`Ô nhớ [chỉ số ${idx}] = ${val}`, `Cell [index ${idx}] = ${val}`),
                      kindLabel: bi('Phần tử dãy / Bảng băm', 'Indexed Slot'),
                      what: bi(
                        `Phần tử tại vị trí thứ ${idx} tính từ đầu dãy (hoặc ${negIdx} nếu đếm ngược từ cuối dãy), lưu giá trị ${val}.`,
                        `Element at forward index ${idx} (or ${negIdx} from the end) holding value ${val}.`
                      ),
                      how: bi(
                        'Truy cập trực tiếp theo địa chỉ vùng nhớ liền kề trong thời gian hằng số O(1).',
                        'Accessed in O(1) constant time via contiguous pointer arithmetic.'
                      ),
                      why: bi(
                        isAct
                          ? 'Ô này nằm trong vùng lát cắt / kết quả khớp của phép toán hiện tại.'
                          : 'Ô này nằm ngoài phạm vi đang chọn nên được giữ nguyên.',
                        isAct
                          ? 'Highlighted because this index falls inside the active slice/lookup window.'
                          : 'Outside the active slice window.'
                      ),
                      tipOrCase: bi(
                        'Mẹo Slicing: s[start:stop] luôn lấy từ chỉ số start đến SÁT TRƯỚC stop (không bao gồm ô stop). Độ dài kết quả = stop - start.',
                        'Slicing Rule: s[start:stop] includes start and stops right BEFORE stop (length = stop - start).'
                      ),
                    }
                  : resolveFallbackInspector(val, pickText(scene.title, lang), false);

                return (
                  <g
                    key={idx}
                    transform={`translate(${cx}, -22)`}
                    onMouseEnter={() => setHoverInfo(cellInfo)}
                    onMouseLeave={() => setHoverInfo(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInfo(cellInfo);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <g
                      className="dts-anim-drop"
                      style={{ animationDelay: `${idx * 45}ms` }}
                    >
                      <text
                        x={cw / 2}
                        y={-10}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={800}
                        fill={isAct ? (isDark ? '#a8e686' : '#2e6b19') : muted}
                        fontFamily="var(--dts-font-mono)"
                      >
                        {isStageCards ? `#${idx + 1}` : idx}
                      </text>

                      <rect x={2} y={2.5} width={cw} height={ch} rx={11} fill={shadow} opacity={0.85} />
                      <rect
                        x={0}
                        y={0}
                        width={cw}
                        height={ch}
                        rx={11}
                        fill={tc.bg}
                        stroke={tc.border}
                        strokeWidth={isAct ? 2 : 1.5}
                      />

                      {cellLines.length === 1 ? (
                        <text
                          x={cw / 2}
                          y={ch / 2 + 4.5}
                          textAnchor="middle"
                          fontSize={isStageCards ? 11.2 : val.length > 3 ? 12 : 15}
                          fontWeight={800}
                          fill={tc.fg}
                          fontFamily="var(--dts-font-mono)"
                        >
                          {cellLines[0]}
                        </text>
                      ) : (
                        <>
                          <text
                            x={cw / 2}
                            y={22}
                            textAnchor="middle"
                            fontSize={10.5}
                            fontWeight={800}
                            fill={tc.fg}
                            fontFamily="var(--dts-font-mono)"
                          >
                            {cellLines[0]}
                          </text>
                          <text
                            x={cw / 2}
                            y={37}
                            textAnchor="middle"
                            fontSize={10.2}
                            fontWeight={700}
                            fill={tc.fg}
                            fontFamily="var(--dts-font-mono)"
                          >
                            {cellLines[1]}
                          </text>
                        </>
                      )}

                      {isStageCards && idx < n - 1 && (
                        <text
                          x={cw + gap / 2}
                          y={ch / 2 + 4}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={800}
                          fill={muted}
                          fontFamily="var(--dts-font-mono)"
                        >
                          →
                        </text>
                      )}

                      {scene.showNegativeIndices && (
                        <text
                          x={cw / 2}
                          y={69}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={700}
                          fill={muted}
                          fontFamily="var(--dts-font-mono)"
                        >
                          {negIdx}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}

              {pointerPlacements.map(({ ptr, px, bw, row }, pIdx) => {
                const basePy = scene.showNegativeIndices ? 68 : isStageCards ? 52 : 48;
                const rowShift = row * 30;
                const pc = toneColors(ptr.tone ?? 'blue', isDark);

                return (
                  <g key={pIdx} transform={`translate(${px}, ${basePy})`}>
                    <g
                      className="dts-anim-pill"
                      style={{ animationDelay: `${220 + pIdx * 70}ms` }}
                    >
                      <path
                        d={`M 0,-12 L 0,${4 + rowShift}`}
                        stroke={ink}
                        strokeWidth={1.6}
                        markerStart={`url(#marr-${uid})`}
                      />
                      <rect
                        x={-bw / 2 + 1.5}
                        y={8 + rowShift}
                        width={bw}
                        height={22}
                        rx={11}
                        fill={shadow}
                      />
                      <rect
                        x={-bw / 2}
                        y={6 + rowShift}
                        width={bw}
                        height={22}
                        rx={11}
                        fill={pc.bg}
                        stroke={pc.border}
                        strokeWidth={1.4}
                      />
                      <text
                        x={0}
                        y={20.5 + rowShift}
                        textAnchor="middle"
                        fontSize={10.5}
                        fontWeight={800}
                        fill={pc.fg}
                        fontFamily="var(--dts-font-mono)"
                      >
                        {ptr.label}
                      </text>
                    </g>
                  </g>
                );
              })}

              {scene.outputPill && (() => {
                const oc = toneColors(scene.outputPill.tone ?? 'green', isDark);
                const full = `${pickText(scene.outputPill.label, lang)}: ${pickText(scene.outputPill.value, lang)}`;
                const pw = Math.max(180, full.length * 7.2 + 32);
                return (
                  <g transform="translate(0, 128)">
                    <g className="dts-anim-pill" style={{ animationDelay: '300ms' }}>
                      <rect x={-pw / 2 + 2} y={-12} width={pw} height={30} rx={15} fill={shadow} />
                      <rect
                        x={-pw / 2}
                        y={-14}
                        width={pw}
                        height={30}
                        rx={15}
                        fill={oc.bg}
                        stroke={oc.border}
                        strokeWidth={1.5}
                      />
                      <text
                        x={0}
                        y={5}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={800}
                        fill={oc.fg}
                        fontFamily="var(--dts-font-mono)"
                      >
                        {full}
                      </text>
                    </g>
                  </g>
                );
              })()}
            </g>
          );
        })()}

        {/* 2. SPACIOUS 2D NAME TAGS -> HEAP OBJECT REFERENCE CARDS */}
        {scene.kind === 'refs' && (() => {
          const nCount = scene.names.length;
          const oCount = scene.objects.length;
          const nameY = (i: number) => (i - (nCount - 1) / 2) * 76;
          const objY = (i: number) => (i - (oCount - 1) / 2) * 96;

          const objPos = new Map<string, number>();
          scene.objects.forEach((o, idx) => objPos.set(o.id, objY(idx)));

          return (
            <g>
              <text
                x={-205}
                y={-142}
                textAnchor="middle"
                fontSize={11}
                fontWeight={800}
                fill={muted}
                fontFamily="var(--dts-font-mono)"
                letterSpacing="0.06em"
              >
                {pickText(scene.leftTitle, lang).toUpperCase()}
              </text>
              <text
                x={145}
                y={-142}
                textAnchor="middle"
                fontSize={11}
                fontWeight={800}
                fill={muted}
                fontFamily="var(--dts-font-mono)"
                letterSpacing="0.06em"
              >
                {pickText(scene.rightTitle, lang).toUpperCase()}
              </text>

              {scene.names.map((nm, idx) => {
                const y1 = nameY(idx);
                const y2 = objPos.get(nm.targetId) ?? 0;
                const isErr = nm.style === 'danger';
                return (
                  <path
                    key={`ref-${nm.id}`}
                    d={`M -128,${y1} C -40,${y1} -35,${y2} 32,${y2}`}
                    fill="none"
                    className="dts-anim-line"
                    style={
                      {
                        strokeDasharray: '320 320',
                        '--line-len': '320',
                        animationDelay: `${140 + idx * 70}ms`,
                      } as React.CSSProperties
                    }
                    stroke={isErr ? '#dc2626' : ink}
                    strokeWidth={2}
                    markerEnd={isErr ? `url(#marr-err-${uid})` : `url(#marr-${uid})`}
                  />
                );
              })}

              {scene.names.map((nm, idx) => {
                const ny = nameY(idx);
                const bc = toneColors('blue', isDark);
                const nmInfo: StageInspectorInfo = {
                  title: bi(`Tên biến / Tham chiếu: ${nm.name}`, `Reference Tag: ${nm.name}`),
                  kindLabel: bi('Nhãn trong Namespace', 'Namespace Binding'),
                  what: bi(
                    'Trong Python, biến không phải là hộp chứa giá trị trực tiếp mà là một nhãn tên giữ con trỏ tham chiếu (reference) trỏ sang đối tượng trên Heap.',
                    'In Python, variables are labels holding memory references to objects on the Heap rather than raw value boxes.'
                  ),
                  how: bi(
                    'Phép gán (=) chỉ gắn nhãn tên vào địa chỉ đối tượng, hoàn toàn không tự động sao chép dữ liệu bên trong.',
                    'Assignment (=) binds the label to an object address without copying nested contents.'
                  ),
                  why: bi(
                    'Giúp truyền danh sách lớn vào hàm cực nhanh trong O(1), nhưng cần chú ý dùng copy.deepcopy() khi muốn tách độc lập dữ liệu khả biến lồng nhau.',
                    'Makes passing large structures O(1), while requiring explicit copy/deepcopy when isolating mutable nested objects.'
                  ),
                };

                return (
                  <g
                    key={nm.id}
                    transform={`translate(-205, ${ny})`}
                    onMouseEnter={() => setHoverInfo(nmInfo)}
                    onMouseLeave={() => setHoverInfo(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInfo(nmInfo);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <g className="dts-anim-drop" style={{ animationDelay: `${idx * 70}ms` }}>
                      <rect x={-76} y={-20} width={156} height={44} rx={11} fill={shadow} />
                      <rect
                        x={-78}
                        y={-22}
                        width={156}
                        height={44}
                        rx={11}
                        fill={bc.bg}
                        stroke={bc.border}
                        strokeWidth={1.6}
                      />
                      <text
                        x={0}
                        y={nm.note ? -3 : 4}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={800}
                        fill={bc.fg}
                        fontFamily="var(--dts-font-mono)"
                      >
                        {nm.name}
                      </text>
                      {nm.note && (
                        <text
                          x={0}
                          y={12}
                          textAnchor="middle"
                          fontSize={9.2}
                          fontWeight={600}
                          fill={muted}
                          fontFamily="var(--dts-font-mono)"
                        >
                          {pickText(nm.note, lang)}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}

              {scene.objects.map((obj, idx) => {
                const oy = objY(idx);
                const oc = toneColors(obj.tone, isDark);
                const h = obj.fields?.length ? 68 : 54;
                const objInfo: StageInspectorInfo = {
                  title: bi(`Đối tượng Heap (${obj.typeTag}): ${obj.value}`, `Heap Object (${obj.typeTag}): ${obj.value}`),
                  kindLabel: bi('Vùng nhớ đối tượng (PyObject)', 'Heap PyObject'),
                  what: bi(
                    `Thực thể kiểu ${obj.typeTag} nằm trên Heap, mang kiểu dữ liệu thực sự, bộ đếm tham chiếu (ob_refcnt) và nội dung ${obj.value}.`,
                    `Concrete ${obj.typeTag} object allocated on CPython’s heap with its own identity id() and refcount.`
                  ),
                  how: bi(
                    obj.tone === 'rose'
                      ? 'Đang có nhiều biến hoặc nhiều lần gọi hàm cùng trỏ chung vào đối tượng khả biến này, nên sửa qua một tên sẽ làm thay đổi tất cả tên còn lại!'
                      : 'Được cấp phát độc lập trên Heap; nếu là kiểu bất biến (int, str, tuple), không phép toán nào sửa được nội dung tại chỗ.',
                    obj.tone === 'rose'
                      ? 'Multiple references alias this single mutable object — mutating through one mutates all!'
                      : 'Independently allocated on the heap.'
                  ),
                  why: bi(
                    'Hiểu rõ đối tượng nào đang dùng chung địa chỉ (id(a) == id(b)) giúp bạn tránh 100% lỗi dữ liệu tự nhảy ngoài ý muốn.',
                    'Knowing when id(a) == id(b) prevents subtle shared-state mutation bugs.'
                  ),
                };

                return (
                  <g
                    key={obj.id}
                    transform={`translate(155, ${oy})`}
                    onMouseEnter={() => setHoverInfo(objInfo)}
                    onMouseLeave={() => setHoverInfo(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInfo(objInfo);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <g className="dts-anim-drop" style={{ animationDelay: `${90 + idx * 80}ms` }}>
                      <rect x={-116} y={-h / 2 + 2.5} width={236} height={h} rx={12} fill={shadow} />
                      <rect
                        x={-118}
                        y={-h / 2}
                        width={236}
                        height={h}
                        rx={12}
                        fill={cardBg}
                        stroke={oc.border}
                        strokeWidth={1.7}
                      />
                      <rect
                        x={-108}
                        y={-h / 2 + 8}
                        width={Math.max(52, obj.typeTag.length * 6.8 + 14)}
                        height={18}
                        rx={6}
                        fill={oc.bg}
                        stroke={oc.border}
                        strokeWidth={1.2}
                      />
                      <text
                        x={-108 + Math.max(52, obj.typeTag.length * 6.8 + 14) / 2}
                        y={-h / 2 + 20}
                        textAnchor="middle"
                        fontSize={9.5}
                        fontWeight={800}
                        fill={oc.fg}
                        fontFamily="var(--dts-font-mono)"
                      >
                        {obj.typeTag}
                      </text>

                      <text
                        x={106}
                        y={-h / 2 + 20.5}
                        textAnchor="end"
                        fontSize={12.5}
                        fontWeight={800}
                        fill={ink}
                        fontFamily="var(--dts-font-mono)"
                      >
                        {obj.value}
                      </text>

                      {obj.fields && (
                        <text
                          x={0}
                          y={16}
                          textAnchor="middle"
                          fontSize={10.5}
                          fontWeight={600}
                          fill={muted}
                          fontFamily="var(--dts-font-mono)"
                        >
                          {obj.fields.join('  ·  ')}
                        </text>
                      )}

                      {obj.badge && (
                        <text
                          x={0}
                          y={h / 2 + 16}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={800}
                          fill={obj.tone === 'rose' ? '#dc2626' : muted}
                          fontFamily="var(--dts-font-mono)"
                        >
                          {pickText(obj.badge, lang)}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* 3. CLEAN 2D CALL TREE / GRAPH */}
        {scene.kind === 'tree' && (() => {
          const pos = new Map<string, { x: number; y: number; w: number }>();
          scene.nodes.forEach((n) => {
            const w = Math.max(106, n.label.length * 7.8 + 30);
            pos.set(n.id, {
              x: Math.round(n.x * 1.34),
              y: Math.round(n.y * 1.2),
              w,
            });
          });

          return (
            <g>
              <text
                x={0}
                y={-166}
                textAnchor="middle"
                fontSize={13.5}
                fontWeight={800}
                fill={ink}
                fontFamily="var(--dts-font-mono)"
              >
                {pickText(scene.title, lang)}
              </text>

              {scene.edges.map((ed, idx) => {
                const a = pos.get(ed.from);
                const b = pos.get(ed.to);
                if (!a || !b) return null;
                const isErr = ed.style === 'danger';
                const dy = b.y - a.y;
                const dx = b.x - a.x;
                const isHorizontal = Math.abs(dy) < 28 && Math.abs(dx) > 40;

                const x1 = isHorizontal
                  ? dx >= 0
                    ? a.x + a.w / 2 + 2
                    : a.x - a.w / 2 - 2
                  : a.x;
                const y1 = isHorizontal ? a.y : dy >= 0 ? a.y + 20 : a.y - 20;
                const x2 = isHorizontal
                  ? dx >= 0
                    ? b.x - b.w / 2 - 5
                    : b.x + b.w / 2 + 5
                  : b.x;
                const y2 = isHorizontal ? b.y : dy >= 0 ? b.y - 23 : b.y + 23;

                return (
                  <g key={idx}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isErr ? '#dc2626' : ed.style === 'dashed' ? muted : ink}
                      strokeWidth={1.7}
                      strokeDasharray={ed.style === 'dashed' ? '5 4' : undefined}
                      markerEnd={isErr ? `url(#marr-err-${uid})` : `url(#marr-${uid})`}
                    />
                    {ed.label && (
                      <text
                        x={(x1 + x2) / 2 + (isHorizontal ? 0 : 8)}
                        y={(y1 + y2) / 2 + (isHorizontal ? -9 : 0)}
                        textAnchor={isHorizontal ? 'middle' : 'start'}
                        fontSize={9.5}
                        fontWeight={700}
                        fill={muted}
                        fontFamily="var(--dts-font-mono)"
                      >
                        {ed.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {scene.nodes.map((nd, idx) => {
                const tc = toneColors(nd.tone, isDark);
                const p = pos.get(nd.id)!;
                const w = p.w;
                const isFibCall = /\bfib\s*\(/i.test(nd.label);
                const treeInfo: StageInspectorInfo = isFibCall
                  ? {
                      title: bi(`Lời gọi đệ quy ${nd.label}`, `Recursive Call ${nd.label}`),
                      kindLabel: bi('Nút trên cây lời gọi (Call Tree)', 'Call Tree Node'),
                      what: bi(
                        nd.pruned
                          ? `Lời gọi ${nd.label} đã có sẵn kết quả trong @functools.cache nên trả về ngay trong O(1), cắt bỏ toàn bộ nhánh con bên dưới.`
                          : `Khung lời gọi hàm ${nd.label} trên Call Stack chia bài toán thành các bài toán con nhỏ hơn.`,
                        nd.pruned
                          ? `${nd.label} hits @functools.cache in O(1), pruning its entire subtree!`
                          : `Stack frame evaluating ${nd.label}.`
                      ),
                      how: bi(
                        'Khi gắn @functools.cache, Python lưu cặp (tham_số -> kết_quả) vào bảng băm nội bộ ngay từ lần tính đầu tiên.',
                        'Memoizes (args -> return_value) in an internal dict after the first evaluation.'
                      ),
                      why: bi(
                        'Hạ độ phức tạp thời gian từ hàm mũ O(2^n) xuống tuyến tính O(n) — ví dụ fib(35) giảm từ hàng chục triệu phép gọi xuống còn 36 lần gọi.',
                        'Reduces exponential O(2^n) time down to linear O(n).'
                      ),
                    }
                  : resolveFallbackInspector(
                      nd.label,
                      nd.sub ? pickText(nd.sub, lang) : undefined,
                      false
                    );

                return (
                  <g
                    key={nd.id}
                    transform={`translate(${p.x}, ${p.y})`}
                    opacity={nd.pruned ? 0.55 : 1}
                    onMouseEnter={() => setHoverInfo(treeInfo)}
                    onMouseLeave={() => setHoverInfo(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInfo(treeInfo);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <g className="dts-anim-drop" style={{ animationDelay: `${idx * 65}ms` }}>
                      <rect x={-w / 2 + 2} y={-18} width={w} height={40} rx={12} fill={shadow} />
                      <rect
                        x={-w / 2}
                        y={-20}
                        width={w}
                        height={40}
                        rx={12}
                        fill={tc.bg}
                        stroke={tc.border}
                        strokeWidth={1.6}
                        strokeDasharray={nd.pruned ? '4 3' : undefined}
                      />
                      <text
                        x={0}
                        y={nd.sub ? -2 : 4}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={800}
                        fill={tc.fg}
                        fontFamily="var(--dts-font-mono)"
                      >
                        {nd.label}
                      </text>
                      {nd.sub && (
                        <text
                          x={0}
                          y={12}
                          textAnchor="middle"
                          fontSize={9.2}
                          fontWeight={600}
                          fill={muted}
                          fontFamily="var(--dts-font-mono)"
                        >
                          {pickText(nd.sub, lang)}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })()}
        </g>
      </svg>

      {/* Top-Right Interactive Zoom Toolbar (click % directly to reset zoom & pan) */}
      <div
        data-no-pan="true"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2.5 top-2 z-30 inline-flex items-center gap-0.5 rounded-xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)]/95 p-0.5 font-mono text-[10.5px] font-bold text-[var(--dts-ink)] shadow-[1.5px_1.5px_0_var(--dts-shadow-color)] backdrop-blur-[2px]"
      >
        <button
          type="button"
          onClick={() => handleZoomBy(-0.15)}
          title={lang === 'en' ? 'Zoom out' : 'Thu nhỏ'}
          aria-label={lang === 'en' ? 'Zoom out' : 'Thu nhỏ'}
          className="inline-flex h-6 w-6 items-center justify-center rounded-lg hover:bg-[var(--dts-panel-muted)] cursor-pointer"
        >
          <Minus className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          title={
            lang === 'en'
              ? 'Click to reset zoom & position (100%)'
              : 'Nhấn để đặt lại thu phóng & vị trí (100%)'
          }
          className={`inline-flex h-6 min-w-[44px] items-center justify-center rounded-lg px-1.5 tabular-nums transition-colors cursor-pointer ${
            isViewModified
              ? 'bg-[var(--dts-amber-bg)] font-extrabold text-[var(--dts-amber-ink)] hover:opacity-90'
              : 'hover:bg-[var(--dts-panel-muted)]'
          }`}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => handleZoomBy(0.15)}
          title={lang === 'en' ? 'Zoom in' : 'Phóng to'}
          aria-label={lang === 'en' ? 'Zoom in' : 'Phóng to'}
          className="inline-flex h-6 w-6 items-center justify-center rounded-lg hover:bg-[var(--dts-panel-muted)] cursor-pointer"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {!selectedInfo && !hoverInfo && (() => {
        const showHintText = hintAutoOpen || hintHovered;
        const hintLabel =
          lang === 'en'
            ? 'Click any cell, variable tag, or node to inspect'
            : 'Nhấn vào ô nhớ, biến hoặc nút để xem giải thích chi tiết';
        return (
          <div
            data-no-pan="true"
            onMouseEnter={() => setHintHovered(true)}
            onMouseLeave={() => setHintHovered(false)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setHintHovered((v) => !v);
            }}
            aria-label={hintLabel}
            className={`pointer-events-auto absolute left-2.5 top-2 z-20 inline-flex h-[26px] max-w-[calc(100%-140px)] items-center overflow-hidden rounded-full border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)]/92 font-mono text-[10px] font-semibold text-[var(--dts-ink-muted)] shadow-[1px_1.5px_0_var(--dts-shadow-color)] backdrop-blur-[2px] transition-all duration-300 ease-out cursor-help ${
              showHintText ? 'px-2.5' : 'px-[6px]'
            }`}
          >
            <MousePointerClick className="h-3 w-3 shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${
                showHintText ? 'ml-1.5 max-w-[430px] opacity-100' : 'ml-0 max-w-0 opacity-0'
              }`}
            >
              {hintLabel}
            </span>
          </div>
        );
      })()}

      {!selectedInfo && hoverInfo && (
        <div className="pointer-events-none absolute left-2.5 top-2 z-20 max-w-[350px] rounded-xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] px-3 py-2 shadow-[1.5px_2px_0_var(--dts-shadow-color)]">
          <div className="font-mono text-[9.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
            {pickText(hoverInfo.kindLabel, lang)}
          </div>
          <div className="font-mono text-xs font-extrabold text-[var(--dts-ink)]">
            {pickText(hoverInfo.title, lang)}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[var(--dts-ink-soft)]">
            {pickText(hoverInfo.what, lang)}
          </p>
        </div>
      )}

      {selectedInfo && (
        <div
          data-no-pan="true"
          data-allow-select="true"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2.5 bottom-2.5 z-30 flex max-h-[92%] w-[calc(100%-20px)] sm:w-[375px] justify-end"
        >
          <StageEntityInspectorCard
            info={selectedInfo}
            lang={lang}
            onClose={() => setSelectedInfo(null)}
          />
        </div>
      )}
    </div>
  );
};

/**
 * stage.json (SceneDef) + mô hình sim (nodes/links) → `StageScene` cho ScaleStageSvg.
 * Định dạng: docs/sysdesign/07-content-authoring.md §2.4. Không dùng ModuleCuratedBlueprint (ADR-012).
 *
 * Vị trí x/y chỉ là gợi ý: ScaleStageSvg tự bố trí lại bằng composeIsometricLayout.
 */
import type {
  BilingualText,
  IsoPortDir,
  IsoTone,
  LegacyNodeShape,
  MemoryScene,
  PacketKind,
  StageInspectorInfo,
  StageIconKind,
  StageLink,
  StageNode,
  StagePacket,
  StageScene,
  StageZoneSlab,
} from '@/components/scale-workbench/types';
import type { SdBilingual, SdSceneDef, SdStageFile, SdStageTone } from '../types';

/** Phần tối thiểu của `SystemModel` (04 §2) mà builder cần. Kiểu đầy đủ thuộc engine (sim/**). */
export interface SdModelNodeLike {
  id: string;
  kind?: string;
  label?: SdBilingual;
}
export interface SdModelLinkLike {
  id: string;
  from: string;
  to: string;
}
export interface SdModelLike {
  nodes: SdModelNodeLike[];
  links: SdModelLinkLike[];
}

export function toBilingual(t: SdBilingual | string | undefined, fallback = ''): BilingualText {
  if (!t) return { vi: fallback, en: fallback };
  if (typeof t === 'string') return { vi: t, en: t };
  return { vi: t.vi, en: t.en ?? t.vi };
}

const KIND_DEFAULTS: Record<string, { shape: LegacyNodeShape; tone: IsoTone; icon?: StageIconKind }> = {
  client: { shape: 'crowd', tone: 'blue' },
  lb: { shape: 'block', tone: 'purple', icon: 'layers' },
  service: { shape: 'block', tone: 'green', icon: 'cpu' },
  cache: { shape: 'block', tone: 'yellow', icon: 'zap' },
  db: { shape: 'db', tone: 'orange' },
  queue: { shape: 'block', tone: 'rose', icon: 'layers' },
  cdn: { shape: 'block', tone: 'blue', icon: 'globe' },
  dns: { shape: 'block', tone: 'blue', icon: 'globe' },
};

const TONES = new Set<string>(['green', 'blue', 'orange', 'purple', 'yellow', 'rose', 'neutral']);
const ICONS = new Set<string>([
  'cpu', 'code', 'db', 'zap', 'hash', 'layers', 'shield', 'git', 'globe', 'terminal', 'sparkles', 'filter', 'clock', 'alert', 'box',
]);
const PACKET_KINDS = new Set<string>(['request', 'response', 'pointer', 'mutation', 'cache-hit', 'error']);

const TONE_ALIASES: Record<string, IsoTone> = {
  amber: 'yellow',
  good: 'green',
  ok: 'green',
  bad: 'rose',
  danger: 'rose',
  warn: 'orange',
};

function asTone(t: SdStageTone | string | undefined, fallback: IsoTone): IsoTone {
  if (!t) return fallback;
  if (TONES.has(t)) return t as IsoTone;
  if (t in TONE_ALIASES) return TONE_ALIASES[t];
  return fallback;
}

function asIcon(i: string | undefined, fallback?: StageIconKind): StageIconKind | undefined {
  return i && ICONS.has(i) ? (i as StageIconKind) : fallback;
}

const SHAPE_KIND_LABEL: Record<string, BilingualText> = {
  block: { vi: 'Thành phần', en: 'Component' },
  db: { vi: 'Cơ sở dữ liệu', en: 'Database' },
  crowd: { vi: 'Nhóm người dùng', en: 'User group' },
  device: { vi: 'Thiết bị', en: 'Device' },
};

/**
 * `inspector` trong stage.json: `{ what, how, why, tip?, title?, kindLabel? }`, mỗi trường là string hoặc `{ vi, en? }`.
 * Thiếu what/how/why thì không gắn (tránh thẻ inspector rỗng). `title` mặc định = nhãn; `kindLabel` mặc định theo loại.
 */
function toInspector(raw: unknown, title: BilingualText, kindLabel: BilingualText): StageInspectorInfo | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const f = (v: unknown): BilingualText | undefined =>
    typeof v === 'string' || (v && typeof v === 'object' && typeof (v as SdBilingual).vi === 'string')
      ? toBilingual(v as SdBilingual | string)
      : undefined;
  const what = f(r.what);
  const how = f(r.how);
  const why = f(r.why);
  if (!what || !how || !why) return undefined;
  const info: StageInspectorInfo = {
    title: f(r.title) ?? title,
    kindLabel: f(r.kindLabel) ?? kindLabel,
    what,
    how,
    why,
  };
  const tip = f(r.tip ?? r.tipOrCase);
  if (tip) info.tipOrCase = tip;
  return info;
}

function strOf(v: unknown, fb = ''): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && typeof (v as SdBilingual).vi === 'string') {
    return (v as SdBilingual).vi;
  }
  return fb;
}

/** Dựng MemoryScene (tape | refs | tree) từ `scenes.<key>.memory`; null nếu sai dạng. */
export function buildSdMemoryScene(def: SdSceneDef): MemoryScene | null {
  const m = def.memory as Record<string, any> | undefined;
  if (!m || typeof m !== 'object') return null;
  const bi = (v: unknown, fb = ''): BilingualText => toBilingual(v as SdBilingual | string | undefined, fb);
  const biOpt = (v: unknown): BilingualText | undefined => (v === undefined || v === null ? undefined : bi(v));
  if (m.kind === 'tape') {
    if (!Array.isArray(m.cells)) return null;
    const autoPointers: Array<{ index: number; label: string; tone?: IsoTone }> = [];
    const autoActive: number[] = [];
    const cells: string[] = m.cells.map((c: any, idx: number) => {
      if (typeof c === 'string') return c;
      if (c && typeof c === 'object') {
        const lbl = strOf(c.label);
        const val = strOf(c.value);
        if (c.note) {
          autoPointers.push({
            index: idx,
            label: strOf(c.note),
            tone: asTone(c.tone, 'blue'),
          });
        }
        if (c.tone === 'green' || c.tone === 'amber' || c.active) {
          autoActive.push(idx);
        }
        return lbl && val ? `${lbl}: ${val}` : lbl || val || String(idx + 1);
      }
      return String(c);
    });
    const pointers = Array.isArray(m.pointers)
      ? m.pointers.map((p: any, idx: number) => ({
          index: typeof p?.index === 'number' ? p.index : idx,
          label: strOf(p?.label),
          tone: p?.tone || p?.color ? asTone(p.tone ?? p.color, 'blue') : undefined,
        }))
      : autoPointers.length > 0
        ? autoPointers
        : undefined;
    return {
      kind: 'tape',
      title: bi(m.title),
      subtitle: biOpt(m.subtitle),
      cells,
      activeIndices: Array.isArray(m.activeIndices)
        ? m.activeIndices
        : autoActive.length > 0
          ? autoActive
          : undefined,
      showNegativeIndices: m.showNegativeIndices,
      pointers,
      outputPill: m.outputPill
        ? {
            label: bi(m.outputPill.label),
            value: bi(m.outputPill.value),
            tone: asTone(m.outputPill.tone ?? m.outputPill.color, 'green'),
          }
        : undefined,
    };
  }
  if (m.kind === 'refs') {
    if (!Array.isArray(m.names) || !Array.isArray(m.objects)) return null;
    const leftTitle = m.leftTitle
      ? bi(m.leftTitle)
      : { vi: 'Bối cảnh / Trường hợp', en: 'Context / Case' };
    const rightTitle = m.rightTitle
      ? bi(m.rightTitle)
      : m.title
        ? bi(m.title)
        : { vi: 'Giải pháp / Đặc tả', en: 'Resolution / Spec' };
    return {
      kind: 'refs',
      leftTitle,
      rightTitle,
      names: m.names.map((n: any, idx: number) => ({
        id: strOf(n?.id, `nm_${idx}`),
        name: strOf(n?.name, strOf(n?.id, `Mục ${idx + 1}`)),
        targetId: strOf(n?.targetId ?? n?.target, m.objects[idx]?.id ?? ''),
        note: biOpt(n?.note),
        style: n?.style,
      })),
      objects: m.objects.map((o: any, idx: number) => {
        const rawTag = strOf(o?.typeTag ?? o?.type);
        const rawVal = strOf(o?.value);
        const hasFields = Array.isArray(o?.fields) && o.fields.length > 0;
        const resolvedTone = asTone(o?.tone, 'neutral');
        // Nếu typeTag là mã biến nháp (O1, O2, O3, C1..C4, V2, V3), đổi sang nhãn ngữ nghĩa rõ ràng
        const isPlaceholderTag = /^[OCV]\d+$/i.test(rawTag.trim());
        const semanticTagByTone: Record<IsoTone, string> = {
          green: 'KHUYẾN NGHỊ',
          rose: 'CẠM BẪY',
          yellow: 'ĐÁNH ĐỔI',
          orange: 'LƯU Ý',
          purple: 'TRỌNG TÂM',
          blue: 'CƠ CHẾ',
          neutral: 'ĐẶC TẢ',
        };
        const effectiveTag = isPlaceholderTag ? semanticTagByTone[resolvedTone] : rawTag;
        // Nếu tác giả viết `type` là tiêu đề dài và `value` là câu mô tả (không có `fields`), tách thành tag gọn + value + fields
        const isLongLegacyType = !o?.typeTag && o?.type && rawTag.length > 14 && !hasFields;
        const cleanIdTag = strOf(o?.id, `OBJ${idx + 1}`)
          .replace(/^[a-z]-/i, '')
          .toUpperCase()
          .slice(0, 10);
        return {
          id: strOf(o?.id, `obj_${idx}`),
          typeTag: isLongLegacyType ? cleanIdTag || 'SPEC' : effectiveTag || 'SPEC',
          value: isLongLegacyType ? rawTag : rawVal,
          fields: isLongLegacyType
            ? rawVal
              ? [rawVal]
              : undefined
            : hasFields
              ? o.fields.map((f: unknown) => strOf(f))
              : undefined,
          tone: resolvedTone,
          badge: biOpt(o?.badge),
        };
      }),
    };
  }
  if (m.kind === 'tree') {
    if (!Array.isArray(m.nodes) || !Array.isArray(m.edges)) return null;
    const rawNodes = m.nodes as any[];
    const edges = (m.edges as any[]).map((e) => ({
      from: strOf(e?.from),
      to: strOf(e?.to),
      label: e?.label !== undefined ? strOf(e.label) : undefined,
      style: e?.style,
    }));
    const needsAutoLayout = rawNodes.some(
      (n) => typeof n?.x !== 'number' || typeof n?.y !== 'number' || Number.isNaN(n.x) || Number.isNaN(n.y)
    );
    const layerMap = new Map<string, number>();
    if (needsAutoLayout) {
      for (const n of rawNodes) {
        const id = strOf(n?.id);
        layerMap.set(id, typeof n?.layer === 'number' ? n.layer : 0);
      }
      if (!rawNodes.some((n) => typeof n?.layer === 'number')) {
        for (let pass = 0; pass < rawNodes.length; pass++) {
          for (const ed of edges) {
            const lf = layerMap.get(ed.from) ?? 0;
            const lt = layerMap.get(ed.to) ?? 0;
            if (lf + 1 > lt) layerMap.set(ed.to, lf + 1);
          }
        }
      }
    }
    const byLayer = new Map<number, string[]>();
    let maxLayer = 0;
    if (needsAutoLayout) {
      for (const n of rawNodes) {
        const id = strOf(n?.id);
        const ly = layerMap.get(id) ?? 0;
        if (ly > maxLayer) maxLayer = ly;
        const arr = byLayer.get(ly) ?? [];
        arr.push(id);
        byLayer.set(ly, arr);
      }
    }
    return {
      kind: 'tree',
      title: bi(m.title),
      nodes: rawNodes.map((n: any, idx: number) => {
        const id = strOf(n?.id, `tn_${idx}`);
        let x = typeof n?.x === 'number' && !Number.isNaN(n.x) ? n.x : 0;
        let y = typeof n?.y === 'number' && !Number.isNaN(n.y) ? n.y : 0;
        if (needsAutoLayout) {
          const ly = layerMap.get(id) ?? 0;
          const siblings = byLayer.get(ly) ?? [id];
          const sIdx = Math.max(0, siblings.indexOf(id));
          x = Math.round((sIdx - (siblings.length - 1) / 2) * 172);
          y = Math.round((ly - maxLayer / 2) * 78);
        }
        return {
          id,
          label: strOf(n?.label, id),
          sub: biOpt(n?.sub),
          x,
          y,
          tone: asTone(n?.tone, 'neutral'),
          pruned: Boolean(n?.pruned),
        };
      }),
      edges,
    };
  }
  return null;
}

function getGroundOffsetForShape(shape: LegacyNodeShape): number {
  if (shape === 'cylinder' || shape === 'db') return 16;
  if (shape === 'laptop' || shape === 'device') return 12;
  if (shape === 'crowd') return 10;
  return 22;
}

function hashSceneKey(ids: readonly string[]): number {
  const s = ids.join(':');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Tự động bố trí tọa độ mặt sàn Isometric 2:1 (u, v) theo cấu trúc đồ thị DAG khi node không khai báo x/y tường minh:
 * - Quy đổi từ lưới mặt sàn 2:1 `(u, v)` sang `(gx = u + v, gy = (u - v) / 2)` và trừ `getGroundOffsetForShape(shape)`
 *   để mọi đường nối `.link` đi dọc đúng trục isometric `SE (+2, +1)` / `NE (+2, -1)` và cắm thẳng vào chính giữa cạnh tường khối.
 * - Với 1..4 node: gán `x` tăng dần theo thứ tự topo để `composeIsometricLayout` của `ScaleStageSvg` dùng đúng các mẫu
 *   Đường chéo 2:1, Góc vuông Isometric, Fan-Out / Fan-In và Zíc-zắc Kim cương.
 * - Với ≥ 5 node: bố trí chiều sâu 2.5D (ví dụ chuỗi 5 node gập góc chữ L / chữ U trên mặt sàn 2:1; đồ thị phân tầng
 *   có nhánh song song `app1..3` xếp dọc theo trục `v` lệch với trục tiến `u`), giữ `viewBox` gọn (~600×330) và tự nhiên.
 */
function computeIsometricDagCoords(
  nodeIds: readonly string[],
  shapes: Map<string, LegacyNodeShape>,
  links: readonly { from: string; to: string }[],
  explicitGrid?: Record<string, { col: number; row: number }>
): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  const n = nodeIds.length;
  if (n === 0) return out;

  const placeGround = (id: string, gx: number, gy: number) => {
    const sh = shapes.get(id) ?? 'block';
    out.set(id, {
      x: Math.round(gx),
      y: Math.round(gy - getGroundOffsetForShape(sh)),
    });
  };

  // Nếu tác giả đã thiết kế bố cục phân làn `layout: { col, row }` trong stage.json (ví dụ S5-03 tách làn Đọc và làn Ghi):
  // Quy đổi trực tiếp (col, row) sang mặt phẳng Isometric 2:1 (col tiến theo NE, row lệch theo SE) để các làn không bao giờ đè nhau!
  if (explicitGrid && nodeIds.length >= 4 && nodeIds.every((id) => explicitGrid[id] !== undefined)) {
    const cols = nodeIds.map((id) => explicitGrid[id].col);
    const rows = nodeIds.map((id) => explicitGrid[id].row);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const colSpan = Math.max(1, maxCol - minCol);
    const rowSpan = maxRow - minRow;

    if (rowSpan > 0) {
      const midCol = (minCol + maxCol) / 2;
      const midRow = (minRow + maxRow) / 2;
      const unitNE: [number, number] = colSpan > 6 ? [72, -36] : [82, -41];
      const unitSE: [number, number] = [132, 66];
      for (const id of nodeIds) {
        const dc = explicitGrid[id].col - midCol;
        const dr = explicitGrid[id].row - midRow;
        const gx = dc * unitNE[0] + dr * unitSE[0];
        const gy = dc * unitNE[1] + dr * unitSE[1];
        placeGround(id, gx, gy);
      }
      return out;
    }
  }

  const rankOf = new Map<string, number>();
  const inDeg = new Map<string, number>();
  const outTargets = new Map<string, string[]>();
  for (const id of nodeIds) {
    rankOf.set(id, 0);
    inDeg.set(id, 0);
    outTargets.set(id, []);
  }
  for (const l of links) {
    if (l.from === l.to || !rankOf.has(l.from) || !rankOf.has(l.to)) continue;
    inDeg.set(l.to, (inDeg.get(l.to) ?? 0) + 1);
    outTargets.get(l.from)!.push(l.to);
  }
  for (let pass = 0; pass < n; pass++) {
    let changed = false;
    for (const l of links) {
      if (l.from === l.to || !rankOf.has(l.from) || !rankOf.has(l.to)) continue;
      const rf = rankOf.get(l.from) ?? 0;
      const rt = rankOf.get(l.to) ?? 0;
      if (rf + 1 > rt) {
        rankOf.set(l.to, rf + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Kéo các node gốc (in-degree = 0) lại sát tầng đích nếu đích ở tầng >= 2
  for (const id of nodeIds) {
    if ((inDeg.get(id) ?? 0) === 0) {
      const tgts = outTargets.get(id) ?? [];
      if (tgts.length > 0) {
        const minTargetRank = Math.min(...tgts.map((t) => rankOf.get(t) ?? 1));
        if (minTargetRank > 1) {
          rankOf.set(id, minTargetRank - 1);
        }
      }
    }
  }

  const byRank = new Map<number, string[]>();
  let maxRank = 0;
  for (const id of nodeIds) {
    const r = rankOf.get(id) ?? 0;
    if (r > maxRank) maxRank = r;
    const list = byRank.get(r) ?? [];
    list.push(id);
    byRank.set(r, list);
  }

  // Khi n <= 4: để composeIsometricLayout của ScaleStageSvg tự chọn mẫu 2:1 chuẩn (chỉ cần x tăng theo rank, spanY < 125)
  if (n <= 4) {
    const ordered = [...nodeIds].sort(
      (a, b) => (rankOf.get(a) ?? 0) - (rankOf.get(b) ?? 0)
    );
    ordered.forEach((id, idx) => {
      out.set(id, { x: idx * 80, y: (idx % 2) * 20 });
    });
    return out;
  }

  // Trường hợp chuỗi 5 node nối tiếp (mỗi tầng 1 node, ví dụ client -> lb -> app1 -> cache -> db):
  // Thay vì xếp ngang / \ / \ tốn diện tích, bố trí theo đường gập 2.5D trên lưới mặt sàn 2:1
  // để các đoạn nối thẳng tắp dọc trục SE (+2,+1) và NE (+2,-1) không bị gãy khuỷu chữ Z.
  const isSingleChain5 =
    n === 5 &&
    maxRank === 4 &&
    [0, 1, 2, 3, 4].every((r) => (byRank.get(r)?.length ?? 0) === 1);

  if (isSingleChain5) {
    const ids = [0, 1, 2, 3, 4].map((r) => byRank.get(r)![0]);
    const variant = hashSceneKey(ids) % 2;
    if (variant === 0) {
      // Trục tiến SW -> NE (client -> lb -> app1 -> cache) rồi rẽ 90° SE sang db (không zíc-zắc / \ / \)
      const pts: Array<[number, number]> = [
        [-256, 92],
        [-124, 26],
        [8, -40],
        [140, -106],
        [276, -38],
      ];
      ids.forEach((id, idx) => placeGround(id, pts[idx][0], pts[idx][1]));
    } else {
      // Trục gập chữ L rộng rãi: NE 2 nhịp rồi SE 2 nhịp (chevron cân đối trên mặt sàn 2:1)
      const pts: Array<[number, number]> = [
        [-264, 88],
        [-132, 22],
        [0, -44],
        [132, 22],
        [264, 88],
      ];
      ids.forEach((id, idx) => placeGround(id, pts[idx][0], pts[idx][1]));
    }
    return out;
  }

  // Đồ thị phân tầng tổng quát (n >= 5):
  // - Trục chính tiến dọc hướng SW -> NE (+156, -78 mỗi bậc, đủ chỗ cho nhãn đường nối + hàng đợi chấm vàng)
  // - Các instance song song trong cùng tầng xếp thành hàng chéo NW -> SE (Δgx = +136, Δgy = +68 > bề rộng khối 112px)
  //   đảm bảo tuyệt đối không có 2 khối hoặc pill nào đè lên nhau!
  const stepNE: [number, number] = [156, -78];
  const stepSE: [number, number] = [136, 68];
  const originGx = -Math.round((maxRank * stepNE[0]) / 2);
  const originGy = -Math.round((maxRank * stepNE[1]) / 2);

  // Phát hiện các tầng trung gian chỉ có 1 node (offset = 0) nhưng bị một cạnh nối tắt (bypass link)
  // đi xuyên từ tầng trước ra tầng sau (ví dụ S2-12 api -> blob nhảy qua worker):
  // Đẩy nhẹ tầng trung gian đó sang làn phụ (offset = 0.85) để mũi tên nối tắt không đâm xuyên qua tâm node!
  const bypassedSingleRanks = new Set<number>();
  for (const l of links) {
    const rf = rankOf.get(l.from);
    const rt = rankOf.get(l.to);
    if (rf === undefined || rt === undefined || rt - rf <= 1) continue;
    for (let rMid = rf + 1; rMid < rt; rMid++) {
      if ((byRank.get(rMid)?.length ?? 0) === 1) {
        bypassedSingleRanks.add(rMid);
      }
    }
  }

  for (const [r, members] of byRank.entries()) {
    const ax = originGx + r * stepNE[0];
    const ay = originGy + r * stepNE[1];
    const m = members.length;
    members.forEach((id, idx) => {
      if (m === 1) {
        const shift = bypassedSingleRanks.has(r) ? (r % 2 === 1 ? 0.88 : -0.88) : 0;
        placeGround(id, ax + shift * stepSE[0], ay + shift * stepSE[1]);
      } else {
        const offset = idx - (m - 1) / 2;
        const gx = ax + offset * stepSE[0];
        const gy = ay + offset * stepSE[1];
        placeGround(id, gx, gy);
      }
    });
  }

  return out;
}

/**
 * Khôi phục liên kết `{ id, from, to }` từ `stage.links` / `def.show.links` / `def.linkState`
 * khi bài học không có `sim.json` (hoặc khai báo thêm liên kết tĩnh trong `stage.json`).
 */
function inferStageLinkEndpoints(
  lid: string,
  linkDef: Record<string, unknown> | undefined,
  allNodeIds: readonly string[]
): SdModelLinkLike | null {
  if (
    linkDef &&
    typeof linkDef.from === 'string' &&
    typeof linkDef.to === 'string' &&
    allNodeIds.includes(linkDef.from) &&
    allNodeIds.includes(linkDef.to)
  ) {
    return { id: lid, from: linkDef.from, to: linkDef.to };
  }
  const nodeSet = new Set(allNodeIds);
  // Ưu tiên khớp chính xác `${from}-${to}` với id node có sẵn
  for (let i = 1; i < lid.length - 1; i++) {
    if (lid[i] !== '-') continue;
    const candFrom = lid.slice(0, i);
    const candTo = lid.slice(i + 1);
    if (nodeSet.has(candFrom) && nodeSet.has(candTo) && candFrom !== candTo) {
      return { id: lid, from: candFrom, to: candTo };
    }
  }
  return null;
}

/**
 * Sinh hệ thống hạt tín hiệu nhân quả (Causal Request/Response & Bottleneck Propagation)
 * cho mọi cảnh Isometric trên toàn ứng dụng:
 * - Tách bạch rõ hạt Request/Query đi vào (Cam #f3b47f / Vàng chậm #efb041) và hạt Response trả về (Xanh lá #9fd28f, reverse: true).
 * - Mọi truy vấn đồng bộ xuống Database (hoặc Cache) đều có hạt Response xanh lá trả ngược từ DB về App/Cache.
 * - Khi Database (hoặc chặng phía sau) phản hồi chậm (200 ms, 500 ms, tải cao, Cache Miss/Flushed),
 *   độ trễ truyền ngược lên các chặng đồng bộ phía trước (App -> LB -> Client):
 *   + Chiều vào từ User có mật độ Request dày (3 hạt đổ vào),
 *   + Chiều trả về từ DB -> App và từ App -> LB -> Client chỉ có 1 hạt Response xanh lá bò chậm (variant: 'slow', ~0.34x) sau thời gian chờ holdSec,
 *     giúp người học nhìn thấy trực tiếp: "DB trả về chậm kéo theo Response từ Web/App Server về User cũng bị chậm trong khi Request từ User đổ vào nhiều".
 * - Khi có Cache ấm (Hit cao) hoặc tách qua Message Queue (Async), nhánh Cache trả về 2 hạt xanh lá cực nhanh (1.08x),
 *   còn nhánh Cache Miss xuống DB chỉ có 1 hạt vàng chậm đi xuống và 1 hạt xanh lá chậm trả về.
 */
function buildCausalPacketsForScene(
  nodes: readonly StageNode[],
  links: readonly StageLink[],
  stateMap?: SdSceneDef['state']
): StagePacket[] {
  const out: StagePacket[] = [];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const parseMs = (txt: string): number => {
    const m = txt.match(/(\d+(?:[.,]\d+)?)\s*ms\b/i);
    if (!m) return 0;
    return Number(m[1].replace(',', '.')) || 0;
  };

  // Kiểm tra trong cảnh có Cache/CDN đang ấm (không bị gắn nhãn Miss / Flushed / Mất dữ liệu) không
  const hasWarmCacheInScene = nodes.some((n) => {
    const isCacheNode =
      /cache|redis|memcache|cdn|edge/i.test(n.id) ||
      /cache|redis|cdn/i.test(`${n.label.vi} ${n.label.en}`);
    if (!isCacheNode) return false;
    const bTxt = `${n.badge?.text.vi ?? ''} ${n.badge?.text.en ?? ''}`.toLowerCase();
    const isColdOrMiss = /miss|flushed|mất dữ liệu|cold|rỗng|nguội|expired|stampede/i.test(bTxt);
    return !isColdOrMiss && (n.loadPct ?? 0) < 80;
  });

  // Bước 1: Phân loại từng đường nối và chấm điểm độ nghẽn/độ trễ cục bộ (hopSlowLevel: 0 | 1 | 2)
  interface LinkMeta {
    link: StageLink;
    fromNode?: StageNode;
    toNode?: StageNode;
    toLoad: number;
    fromLoad: number;
    toDead: boolean;
    parsedMs: number;
    isDlqTarget: boolean;
    isHardBlock: boolean;
    isHeartbeatLink: boolean;
    isCacheInvalidation: boolean;
    isHeavyBatchOrUpload: boolean;
    isQueueProducer: boolean;
    isQueueConsumer: boolean;
    isReplicationOnly: boolean;
    isSyncWriteWithAck: boolean;
    isCacheTarget: boolean;
    isCacheColdOrMiss: boolean;
    isDbOrStorageTarget: boolean;
    hopSlowLevel: 0 | 1 | 2;
  }

  const metas: LinkMeta[] = [];
  const metaByLinkId = new Map<string, LinkMeta>();
  const syncOutByNode = new Map<string, LinkMeta[]>();

  for (const l of links) {
    if (l.style === 'off' || l.style === 'cut') continue;
    const fromNode = nodeById.get(l.from);
    const toNode = nodeById.get(l.to);
    const toLoad = stateMap?.[l.to]?.loadPct ?? toNode?.loadPct ?? 0;
    const fromLoad = stateMap?.[l.from]?.loadPct ?? fromNode?.loadPct ?? 0;
    const toDead = Boolean(stateMap?.[l.to]?.dead ?? toNode?.dead);
    const isDangerLink = l.style === 'danger';

    const linkLabelText = `${l.label?.vi ?? ''} ${l.label?.en ?? ''}`.toLowerCase();
    const toIdLower = l.to.toLowerCase();
    const fromIdLower = l.from.toLowerCase();
    const toLabelLower = `${toNode?.label.vi ?? ''} ${toNode?.label.en ?? ''}`.toLowerCase();
    const toBadgeText = `${toNode?.badge?.text.vi ?? ''} ${toNode?.badge?.text.en ?? ''}`.toLowerCase();
    const combinedText = `${linkLabelText} ${toBadgeText}`;
    const parsedMs = Math.max(parseMs(linkLabelText), parseMs(toBadgeText));

    const isDlqTarget =
      /dlq|dead.?letter|poison/i.test(toIdLower) ||
      /dlq|thư chết|poison/i.test(toLabelLower) ||
      /dlq|thư chết|poison/i.test(linkLabelText);
    // Lưu ý: style === 'danger' trên link DB/Server biểu diễn đường nghẽn/chậm (500 ms, 197 req/s), KHÔNG phải chặn 100% gói!
    const isHardBlock =
      toDead ||
      /429|reject|từ chối|drop\b|chặn|breaker\s*open|ngắt mạch/i.test(combinedText);
    const isHeartbeatLink =
      l.style === 'heartbeat' ||
      /heartbeat|health|ping|probe|gossip|nhịp tim/i.test(linkLabelText);
    const isCacheInvalidation =
      /invalida|delete|del\b|evict|purge|xóa cache|thu hồi/i.test(linkLabelText);
    const isQueueProducer =
      !isDlqTarget &&
      (/queue|kafka|pubsub|topic|stream|outbox|bus|log_agg/i.test(toIdLower) ||
        /queue|kafka|pub\/?sub|outbox|hàng đợi/i.test(toLabelLower) ||
        (l.style === 'dashed' && /async|bất đồng bộ|sự kiện|event/i.test(linkLabelText)));
    const isQueueConsumer =
      !isDlqTarget &&
      !isQueueProducer &&
      (/queue|kafka|pubsub|topic|stream|outbox|bus|log_agg/i.test(fromIdLower) ||
        /worker|consumer|builder|relay/i.test(toIdLower) ||
        (l.style === 'dashed' && /xử lý nền|background|consume|fanout|cập nhật feed/i.test(linkLabelText)));
    const isCacheTarget =
      !isQueueProducer &&
      !isQueueConsumer &&
      (/cache|redis|memcache|cdn|dedup|edge/i.test(toIdLower) ||
        /cache|redis|cdn/i.test(toLabelLower));
    const isCacheColdOrMiss =
      isCacheTarget &&
      /miss|flushed|mất dữ liệu|cold|rỗng|nguội|expired|stampede/i.test(combinedText);
    const isDbOrStorageTarget =
      !isCacheTarget &&
      (toNode?.shape === 'db' ||
        /db|sql|mongo|cassandra|storage|blob|s3|ledger|shard|replica|follower|leader|search|trie|vault/i.test(
          toIdLower
        ));
    const isSyncWriteWithAck =
      isDbOrStorageTarget && /ghi bài|save post|insert|commit|tx/i.test(linkLabelText);
    const isReplicationOnly =
      !isSyncWriteWithAck &&
      ((fromNode?.shape === 'db' && isDbOrStorageTarget) ||
        /repl|sao chép|wal|cdc|backfill|snapshot|log/i.test(linkLabelText) ||
        (/worker|consumer/i.test(fromIdLower) && (isCacheTarget || isDbOrStorageTarget)));
    const isHeavyBatchOrUpload =
      /multipart|upload|presigned put|tải thẳng|batch|bulk|100 rows|flood/i.test(linkLabelText) ||
      (fromIdLower === 'client' && /blob|s3|storage/i.test(toIdLower));

    let hopSlowLevel: 0 | 1 | 2 = 0;
    if (
      toLoad >= 85 ||
      isDangerLink ||
      parsedMs >= 250 ||
      /quá tải|overload|nghẽn|bottleneck|stampede|miss storm|500\s*ms|400\s*ms/i.test(combinedText)
    ) {
      hopSlowLevel = 2;
    } else if (
      toLoad >= 48 ||
      parsedMs >= 100 ||
      isCacheColdOrMiss ||
      (isDbOrStorageTarget && !isSyncWriteWithAck && (hasWarmCacheInScene || toLoad >= 35 || parsedMs >= 40)) ||
      /200\s*ms|flushed|mất dữ liệu|khi miss|on miss|chậm|slow|lag|nhảy lên/i.test(combinedText)
    ) {
      hopSlowLevel = 1;
    }

    const meta: LinkMeta = {
      link: l,
      fromNode,
      toNode,
      toLoad,
      fromLoad,
      toDead,
      parsedMs,
      isDlqTarget,
      isHardBlock,
      isHeartbeatLink,
      isCacheInvalidation,
      isHeavyBatchOrUpload,
      isQueueProducer,
      isQueueConsumer,
      isReplicationOnly,
      isSyncWriteWithAck,
      isCacheTarget,
      isCacheColdOrMiss,
      isDbOrStorageTarget,
      hopSlowLevel,
    };
    metas.push(meta);
    metaByLinkId.set(l.id, meta);

    const isSyncCall =
      l.style !== 'dashed' &&
      !isQueueProducer &&
      !isQueueConsumer &&
      !isReplicationOnly &&
      !isHeartbeatLink &&
      !isDlqTarget;
    if (isSyncCall) {
      const list = syncOutByNode.get(l.from) ?? [];
      list.push(meta);
      syncOutByNode.set(l.from, list);
    }
  }

  // Bước 2: Lan truyền độ trễ của chặng sau (ví dụ Database 200 ms / 500 ms / quá tải)
  // ngược lên các chặng đồng bộ phía trước (App Server -> Load Balancer -> Client).
  // Nếu nút trung gian được bảo vệ bởi một Cache đang ấm (và DB phía sau không ở trạng thái khẩn cấp danger/load >= 48),
  // Cache sẽ hấp thụ phần lớn lượt đọc nên các chặng trước Cache vẫn phản hồi nhanh!
  const getDownstreamSlowLevel = (startNodeId: string, visited = new Set<string>()): 0 | 1 | 2 => {
    if (visited.has(startNodeId)) return 0;
    visited.add(startNodeId);
    const outs = syncOutByNode.get(startNodeId) ?? [];
    if (outs.length === 0) return 0;

    // Nếu nút này gọi trực tiếp vào một Cache đang ấm (Hit cao), kiểm tra xem DB sau Cache có đang gặp sự cố (danger / load >= 48) không
    const warmCacheHop = outs.find((m) => m.isCacheTarget && !m.isCacheColdOrMiss && m.hopSlowLevel === 0);
    if (warmCacheHop) {
      const afterCache = syncOutByNode.get(warmCacheHop.link.to) ?? [];
      const dbInCrisis = afterCache.some(
        (m) => m.link.style === 'danger' || m.toLoad >= 48 || m.parsedMs >= 250
      );
      if (!dbInCrisis) return 0;
    }

    let maxSlow: 0 | 1 | 2 = 0;
    for (const m of outs) {
      if (m.hopSlowLevel > maxSlow) maxSlow = m.hopSlowLevel;
      const childSlow = getDownstreamSlowLevel(m.link.to, new Set(visited));
      if (childSlow > maxSlow) maxSlow = childSlow;
    }
    return maxSlow;
  };

  // Bước 3: Sinh hạt đi xuôi (Request / Slow Query / Async Msg) và hạt đi ngược (Green Response #9fd28f)
  for (let li = 0; li < metas.length; li++) {
    const m = metas[li];
    const l = m.link;
    const downstreamSlow = getDownstreamSlowLevel(l.to);
    const effectiveSlow = Math.max(m.hopSlowLevel, downstreamSlow) as 0 | 1 | 2;

    const pushPkt = (
      k: number,
      total: number,
      spec: Omit<StagePacket, 'id' | 'linkId' | 'offset'> & { offset?: number }
    ) => {
      out.push({
        id: `pk_${l.id}_${k}`,
        linkId: l.id,
        offset:
          spec.offset ??
          Number(((k / Math.max(1, total) + li * 0.21) % 1).toFixed(2)),
        ...spec,
      });
    };

    if (m.isDlqTarget) {
      pushPkt(0, 2, {
        kind: 'error',
        variant: 'poison',
        speed: 0.62,
        bounce: false,
        holdSec: 0.15,
        arrivalFx: 'fail',
      });
      pushPkt(1, 2, {
        kind: 'error',
        variant: 'poison',
        speed: 0.62,
        bounce: false,
        holdSec: 0.15,
        arrivalFx: 'fail',
      });
    } else if (m.isHeartbeatLink) {
      pushPkt(0, 2, {
        kind: 'pointer',
        variant: 'ping',
        speed: 0.85,
        bounce: true,
        holdSec: 0.08,
        arrivalFx: 'ok',
      });
      pushPkt(1, 2, {
        kind: 'pointer',
        variant: 'ping',
        speed: 0.85,
        bounce: true,
        holdSec: 0.08,
        arrivalFx: 'ok',
      });
    } else if (m.isCacheInvalidation) {
      pushPkt(0, 2, {
        kind: 'dropped',
        variant: 'kill',
        speed: 0.95,
        bounce: false,
        holdSec: 0.05,
        arrivalFx: 'fail',
      });
      pushPkt(1, 2, {
        kind: 'dropped',
        variant: 'kill',
        speed: 0.95,
        bounce: false,
        holdSec: 0.05,
        arrivalFx: 'fail',
      });
    } else if (m.isHardBlock) {
      pushPkt(0, 3, {
        kind: 'dropped',
        variant: 'default',
        speed: 0.88,
        bounce: false,
        holdSec: m.toDead ? 0.35 : 0.06,
        arrivalFx: 'fail',
      });
      pushPkt(1, 3, {
        kind: 'retry',
        variant: 'slow',
        speed: 0.78,
        bounce: false,
        holdSec: m.toDead ? 0.55 : 0.12,
        arrivalFx: 'fail',
      });
      pushPkt(2, 3, {
        kind: 'dropped',
        variant: 'default',
        speed: 0.88,
        bounce: false,
        holdSec: m.toDead ? 0.35 : 0.06,
        arrivalFx: 'fail',
      });
    } else if (m.isHeavyBatchOrUpload) {
      pushPkt(0, 2, {
        kind: 'request',
        variant: 'heavy',
        speed: 0.85,
        bounce: false,
        holdSec: 0.18,
        arrivalFx: 'ok',
      });
      pushPkt(1, 2, {
        kind: 'request',
        variant: 'heavy',
        speed: 0.85,
        bounce: false,
        holdSec: 0.18,
        arrivalFx: 'ok',
      });
    } else if (m.isQueueProducer) {
      pushPkt(0, 2, {
        kind: 'cache-hit',
        variant: 'msg',
        speed: 0.98,
        bounce: false,
        holdSec: 0.04,
        arrivalFx: 'ok',
      });
      pushPkt(1, 2, {
        kind: 'cache-hit',
        variant: 'msg',
        speed: 0.98,
        bounce: false,
        holdSec: 0.04,
        arrivalFx: 'ok',
      });
    } else if (m.isQueueConsumer) {
      const workerHold = m.toLoad >= 85 ? 0.85 : m.toLoad >= 65 ? 0.45 : 0.22;
      pushPkt(0, 2, {
        kind: 'cache-hit',
        variant: 'msg',
        speed: m.toLoad >= 85 ? 0.58 : 0.78,
        bounce: false,
        holdSec: workerHold,
        arrivalFx: 'ok',
      });
      pushPkt(1, 2, {
        kind: 'cache-hit',
        variant: 'msg',
        speed: m.toLoad >= 85 ? 0.58 : 0.78,
        bounce: false,
        holdSec: workerHold,
        arrivalFx: 'ok',
      });
    } else if (m.isReplicationOnly) {
      pushPkt(0, 2, {
        kind: 'mutation',
        variant: 'default',
        speed: 0.76,
        bounce: false,
        holdSec: 0.08,
        arrivalFx: 'ok',
      });
      pushPkt(1, 2, {
        kind: 'mutation',
        variant: 'default',
        speed: 0.76,
        bounce: false,
        holdSec: 0.08,
        arrivalFx: 'ok',
      });
    } else if (m.isCacheTarget && !m.isCacheColdOrMiss && effectiveSlow === 0) {
      // Nhánh Cache / CDN đang ấm (Hit cao):
      // 2 hạt Request đi vào cực nhanh (1.08x) + 2 hạt Response xanh lá (#9fd28f) trả về cực nhanh (1.08x)!
      pushPkt(0, 2, {
        kind: 'request',
        variant: 'default',
        speed: 1.08,
        bounce: false,
        holdSec: 0.02,
        arrivalFx: 'none',
        offset: 0.08,
      });
      pushPkt(1, 2, {
        kind: 'request',
        variant: 'default',
        speed: 1.08,
        bounce: false,
        holdSec: 0.02,
        arrivalFx: 'none',
        offset: 0.58,
      });
      pushPkt(2, 2, {
        kind: 'response',
        variant: 'default',
        speed: 1.08,
        reverse: true,
        bounce: false,
        holdSec: 0.04,
        arrivalFx: 'ok',
        offset: 0.32,
      });
      pushPkt(3, 2, {
        kind: 'response',
        variant: 'default',
        speed: 1.08,
        reverse: true,
        bounce: false,
        holdSec: 0.04,
        arrivalFx: 'ok',
        offset: 0.82,
      });
    } else if (m.isDbOrStorageTarget || (m.isCacheTarget && m.isCacheColdOrMiss)) {
      // Chặng truy vấn Database / Storage (hoặc Cache bị Miss/Flushed):
      // Luôn có cả hạt truy vấn vàng đi vào DB LẪN hạt Response xanh lá (#9fd28f) trả ngược từ DB về App/Cache!
      if (m.hopSlowLevel >= 2) {
        // DB quá tải / nghẽn nặng (ví dụ 500 ms, loadPct >= 85%, style: danger):
        // Nhiều truy vấn vàng bò chậm vào hàng đợi DB, trong khi hạt Response xanh lá từ DB trả về rất chậm và thưa!
        pushPkt(0, 3, {
          kind: 'retry',
          variant: 'slow',
          speed: 0.85,
          bounce: false,
          holdSec: 0.75,
          arrivalFx: 'none',
          offset: 0.06,
        });
        pushPkt(1, 3, {
          kind: m.toLoad >= 95 ? 'dropped' : 'retry',
          variant: 'slow',
          speed: 0.82,
          bounce: false,
          holdSec: 0.65,
          arrivalFx: m.toLoad >= 95 ? 'fail' : 'none',
          offset: 0.42,
        });
        pushPkt(2, 3, {
          kind: 'retry',
          variant: 'slow',
          speed: 0.85,
          bounce: false,
          holdSec: 0.75,
          arrivalFx: 'none',
          offset: 0.76,
        });
        // Hạt Response xanh lá trả về chậm từ DB -> App/Cache sau khi giữ xử lý lâu tại DB
        pushPkt(3, 1, {
          kind: 'response',
          variant: 'slow',
          speed: 0.76,
          reverse: true,
          bounce: false,
          holdSec: 0.72,
          arrivalFx: 'ok',
          offset: 0.54,
        });
      } else if (m.hopSlowLevel === 1) {
        // DB chậm vừa (ví dụ 200 ms ở S0-03 s1-overview) hoặc nhánh Cache Miss (Khi Miss):
        const isSparseCacheMiss =
          hasWarmCacheInScene && m.toLoad < 48 && l.style !== 'danger';
        if (isSparseCacheMiss) {
          // Khi phía trước đã có Cache ấm chặn 89% lượt đọc: chỉ 1 hạt vàng chậm lọt xuống DB và 1 hạt xanh lá chậm trả về từ DB
          pushPkt(0, 1, {
            kind: 'retry',
            variant: 'slow',
            speed: 0.88,
            bounce: false,
            holdSec: 0.48,
            arrivalFx: 'none',
            offset: 0.16,
          });
          pushPkt(1, 1, {
            kind: 'response',
            variant: 'slow',
            speed: 0.86,
            reverse: true,
            bounce: false,
            holdSec: 0.46,
            arrivalFx: 'ok',
            offset: 0.62,
          });
        } else {
          // Chưa có Cache (hoặc Cache vừa mất dữ liệu): 2 hạt vàng chậm nối đuôi vào DB, chỉ 1 hạt xanh lá trả về chậm từ DB
          pushPkt(0, 2, {
            kind: 'retry',
            variant: 'slow',
            speed: 0.88,
            bounce: false,
            holdSec: 0.52,
            arrivalFx: 'none',
            offset: 0.12,
          });
          pushPkt(1, 2, {
            kind: 'retry',
            variant: 'slow',
            speed: 0.88,
            bounce: false,
            holdSec: 0.52,
            arrivalFx: 'none',
            offset: 0.62,
          });
          pushPkt(2, 1, {
            kind: 'response',
            variant: 'slow',
            speed: 0.84,
            reverse: true,
            bounce: false,
            holdSec: 0.52,
            arrivalFx: 'ok',
            offset: 0.44,
          });
        }
      } else {
        // Ghi/Đọc DB nhẹ hoặc bước lưu bài đồng bộ ("1. Ghi bài"):
        pushPkt(0, 1, {
          kind: m.isSyncWriteWithAck ? 'mutation' : 'request',
          variant: 'default',
          speed: 0.92,
          bounce: false,
          holdSec: 0.18,
          arrivalFx: 'none',
          offset: 0.15,
        });
        pushPkt(1, 1, {
          kind: 'response',
          variant: 'default',
          speed: 0.92,
          reverse: true,
          bounce: false,
          holdSec: 0.18,
          arrivalFx: 'ok',
          offset: 0.62,
        });
      }
    } else if (effectiveSlow >= 1) {
      // Chặng đồng bộ phía trước (Client -> LB -> App Server) khi bản thân Server nghẽn HOẶC phải đứng chờ DB phía sau phản hồi chậm:
      // - Chiều vào (Request từ User): 3 hạt đổ vào liên tục (2 hạt cam + 1 hạt vàng chờ đợi)
      // - Chiều về (Response từ App/Web Server về User): chỉ có 1 hạt xanh lá (#9fd28f) bò chậm về sau khi DB trả lời!
      pushPkt(0, 3, {
        kind: 'request',
        variant: 'default',
        speed: 0.94,
        bounce: false,
        holdSec: 0.22,
        arrivalFx: 'none',
        offset: 0.05,
      });
      pushPkt(1, 3, {
        kind: 'request',
        variant: 'default',
        speed: 0.94,
        bounce: false,
        holdSec: 0.25,
        arrivalFx: 'none',
        offset: 0.38,
      });
      pushPkt(2, 3, {
        kind: m.toLoad >= 95 ? 'dropped' : 'retry',
        variant: effectiveSlow >= 2 ? 'slow' : 'default',
        speed: 0.88,
        bounce: false,
        holdSec: 0.42,
        arrivalFx: m.toLoad >= 95 ? 'fail' : 'none',
        offset: 0.72,
      });
      // Hạt Response xanh lá từ App/Web Server trả về Client cũng bị chậm và thưa theo đúng nhịp phản hồi chậm của DB!
      pushPkt(3, 1, {
        kind: 'response',
        variant: 'slow',
        speed: effectiveSlow >= 2 ? 0.78 : 0.86,
        reverse: true,
        bounce: false,
        holdSec: effectiveSlow >= 2 ? 0.62 : 0.42,
        arrivalFx: 'ok',
        offset: 0.52,
      });
    } else {
      // Chặng đồng bộ khỏe mạnh (hoặc đã được Cache ấm / Queue bất đồng bộ giải phóng khỏi độ trễ DB):
      // 2 hạt Request cam đi vào nhanh + 2 hạt Response xanh lá trả về nhanh cân bằng 1:1!
      pushPkt(0, 2, {
        kind: 'request',
        variant: 'default',
        speed: 1.0,
        bounce: false,
        holdSec: 0.04,
        arrivalFx: 'none',
        offset: 0.08,
      });
      pushPkt(1, 2, {
        kind: 'request',
        variant: 'default',
        speed: 1.0,
        bounce: false,
        holdSec: 0.04,
        arrivalFx: 'none',
        offset: 0.58,
      });
      pushPkt(2, 2, {
        kind: 'response',
        variant: 'default',
        speed: 1.0,
        reverse: true,
        bounce: false,
        holdSec: 0.05,
        arrivalFx: 'ok',
        offset: 0.33,
      });
      pushPkt(3, 2, {
        kind: 'response',
        variant: 'default',
        speed: 1.0,
        reverse: true,
        bounce: false,
        holdSec: 0.05,
        arrivalFx: 'ok',
        offset: 0.83,
      });
    }
  }

  return out.slice(0, 44);
}

/**
 * Dựng StageScene từ định nghĩa cảnh. `model` (từ sim.json) + `stage.links` cung cấp liên kết.
 * Trả null nếu cảnh không có node nào (người gọi sẽ rơi về code-trace).
 */
export function buildSdStageScene(
  stage: SdStageFile,
  def: SdSceneDef,
  model: SdModelLike | null
): StageScene | null {
  if (def.raw && typeof def.raw === 'object') {
    const rawScene = def.raw as StageScene;
    return {
      ...rawScene,
      packets: buildCausalPacketsForScene(rawScene.nodes ?? [], rawScene.links ?? [], def.state),
    };
  }

  const modelNodes = new Map((model?.nodes ?? []).map((n) => [n.id, n]));
  const allNodeIds = [...new Set([...Object.keys(stage.nodes), ...modelNodes.keys()])];
  const defaultStarNodes = modelNodes.size > 0 ? [...modelNodes.keys()] : allNodeIds;
  const nodeIds =
    def.show.nodes === '*'
      ? defaultStarNodes
      : def.show.nodes.filter((id) => allNodeIds.includes(id));
  if (nodeIds.length === 0) return null;
  const shown = new Set(nodeIds);

  // Hợp nhất liên kết từ model (sim.json) và liên kết khai báo thêm trong stage.json.
  // Lưu ý: khi model đã có danh sách links của sim đang chọn, chỉ nạp thêm các khóa từ `stage.links`
  // nếu khóa đó được yêu cầu tường minh trong `def.show.links` / `def.linkState`, hoặc nối tới một node chỉ có trong `stage.nodes`
  // (tránh nạp nhầm link của một sim khác trong cùng module gây rò rỉ đường nối đè lên sơ đồ ở S1-02, S2-11, S3-09).
  const rawLinksMap = new Map<string, SdModelLinkLike>();
  const hasSimLinks = (model?.links?.length ?? 0) > 0;
  for (const l of model?.links ?? []) {
    if (l?.id) rawLinksMap.set(l.id, l);
  }
  const explicitSceneLinks = new Set<string>([
    ...(Array.isArray(def.show.links) ? def.show.links : []),
    ...Object.keys(def.linkState ?? {}),
  ]);
  const extraLinkKeys = new Set<string>([
    ...(hasSimLinks ? [] : Object.keys(stage.links ?? {})),
    ...explicitSceneLinks,
  ]);
  if (hasSimLinks && stage.links) {
    for (const lid of Object.keys(stage.links)) {
      if (rawLinksMap.has(lid)) continue;
      const inf = inferStageLinkEndpoints(
        lid,
        stage.links[lid] as Record<string, unknown> | undefined,
        allNodeIds
      );
      if (inf && (!modelNodes.has(inf.from) || !modelNodes.has(inf.to))) {
        rawLinksMap.set(lid, inf);
      }
    }
  }
  for (const lid of extraLinkKeys) {
    if (rawLinksMap.has(lid)) continue;
    const inferred = inferStageLinkEndpoints(
      lid,
      stage.links?.[lid] as Record<string, unknown> | undefined,
      allNodeIds
    );
    if (inferred) rawLinksMap.set(lid, inferred);
  }
  const rawModelLinks = [...rawLinksMap.values()];
  const linkIds = def.show.links === undefined || def.show.links === '*' ? null : new Set(def.show.links);

  // Tìm các đường nối trực tiếp giữa các node đang hiển thị; nếu hai node nối nhau qua 1 hoặc nhiều node trung gian đang ẩn
  // (ví dụ Step 1 hiện [client, app1, db] khi lb và cache chưa xuất hiện), tự động bắc cầu kèm rút gọn bắc cầu (transitive reduction)
  // để không sinh dây tắt thừa vượt qua node trung gian đang hiển thị và không trùng link.id.
  const directLinks = rawModelLinks.filter((l) => shown.has(l.from) && shown.has(l.to));
  const bridgedLinks: Array<SdModelLinkLike & { fallbackMetaId?: string }> = [...directLinks];

  if (def.show.links === undefined || def.show.links === '*') {
    const directPairs = new Set(directLinks.map((l) => `${l.from}->${l.to}`));
    const adjHidden = new Map<string, SdModelLinkLike[]>();
    for (const l of rawModelLinks) {
      const list = adjHidden.get(l.from) ?? [];
      list.push(l);
      adjHidden.set(l.from, list);
    }

    const candidateBridges: Array<{
      from: string;
      to: string;
      firstLink: SdModelLinkLike;
      lastLink: SdModelLinkLike;
    }> = [];
    const seenCandPairs = new Set<string>(directPairs);

    for (const startId of nodeIds) {
      // BFS chỉ đi qua các node trung gian KHÔNG nằm trong `shown`
      const queue: Array<{ cur: string; firstLink: SdModelLinkLike; lastLink: SdModelLinkLike }> = [];
      for (const l of adjHidden.get(startId) ?? []) {
        if (!shown.has(l.to)) queue.push({ cur: l.to, firstLink: l, lastLink: l });
      }
      const visited = new Set<string>();
      while (queue.length > 0) {
        const { cur, firstLink, lastLink } = queue.shift()!;
        if (visited.has(cur)) continue;
        visited.add(cur);
        for (const nl of adjHidden.get(cur) ?? []) {
          if (shown.has(nl.to)) {
            if (nl.to === startId) continue;
            const key = `${startId}->${nl.to}`;
            if (!seenCandPairs.has(key)) {
              seenCandPairs.add(key);
              candidateBridges.push({ from: startId, to: nl.to, firstLink, lastLink: nl });
            }
          } else {
            queue.push({ cur: nl.to, firstLink, lastLink: nl });
          }
        }
      }
    }

    // Đồ thị khả kiến (direct + candidateBridges) để kiểm tra rút gọn bắc cầu:
    // Nếu `from` đã đi tới được `to` qua một node hiển thị trung gian `w ∈ shown`, bỏ dây tắt `from -> to`.
    const visAdj = new Map<string, Set<string>>();
    for (const id of nodeIds) visAdj.set(id, new Set());
    for (const l of directLinks) visAdj.get(l.from)?.add(l.to);
    for (const cb of candidateBridges) visAdj.get(cb.from)?.add(cb.to);

    const canReachViaIntermediateVisible = (u: string, v: string): boolean => {
      const q: string[] = [];
      for (const nxt of visAdj.get(u) ?? []) {
        if (nxt !== v) q.push(nxt);
      }
      const vis = new Set<string>(q);
      while (q.length > 0) {
        const cur = q.shift()!;
        if (cur === v) return true;
        for (const nxt of visAdj.get(cur) ?? []) {
          if (!vis.has(nxt)) {
            vis.add(nxt);
            q.push(nxt);
          }
        }
      }
      return false;
    };

    const usedLinkIds = new Set(bridgedLinks.map((l) => l.id));
    for (const cb of candidateBridges) {
      if (canReachViaIntermediateVisible(cb.from, cb.to)) continue;
      const preferredMetaId = stage.links?.[cb.lastLink.id] ? cb.lastLink.id : cb.firstLink.id;
      const pairId = `${cb.from}-${cb.to}`;
      let uniqueId = preferredMetaId;
      if (usedLinkIds.has(uniqueId)) {
        if (!usedLinkIds.has(cb.firstLink.id)) uniqueId = cb.firstLink.id;
        else if (!usedLinkIds.has(cb.lastLink.id)) uniqueId = cb.lastLink.id;
        else if (!usedLinkIds.has(pairId)) uniqueId = pairId;
        else uniqueId = `bridge_${cb.from}_${cb.to}`;
      }
      usedLinkIds.add(uniqueId);
      bridgedLinks.push({
        id: uniqueId,
        from: cb.from,
        to: cb.to,
        fallbackMetaId: preferredMetaId,
      });
    }
  }
  const modelLinks = bridgedLinks;

  const shapeByNode = new Map<string, LegacyNodeShape>();
  for (const id of nodeIds) {
    const d = stage.nodes[id] ?? {};
    const mn = modelNodes.get(id);
    const kd = (mn?.kind && KIND_DEFAULTS[mn.kind]) || { shape: 'block' as LegacyNodeShape, tone: 'neutral' as IsoTone };
    shapeByNode.set(id, d.shape ?? kd.shape);
  }

  const sceneEntitiesGrid = Array.isArray((def as unknown as { entities?: Array<{ id?: string; col?: number; row?: number }> }).entities)
    ? Object.fromEntries(
        ((def as unknown as { entities: Array<{ id?: string; col?: number; row?: number }> }).entities)
          .filter((e) => typeof e?.id === 'string' && typeof e?.col === 'number' && typeof e?.row === 'number')
          .map((e) => [e.id!, { col: e.col!, row: e.row! }])
      )
    : undefined;
  const effectiveGrid = sceneEntitiesGrid && Object.keys(sceneEntitiesGrid).length > 0 ? sceneEntitiesGrid : stage.layout;

  const autoCoords = nodeIds.some((id) => stage.nodes[id]?.x === undefined || stage.nodes[id]?.y === undefined)
    ? computeIsometricDagCoords(nodeIds, shapeByNode, modelLinks, effectiveGrid)
    : new Map<string, { x: number; y: number }>();

  const nodes: StageNode[] = nodeIds.map((id, i) => {
    const d = stage.nodes[id] ?? {};
    const mn = modelNodes.get(id);
    const kd = (mn?.kind && KIND_DEFAULTS[mn.kind]) || { shape: 'block' as LegacyNodeShape, tone: 'neutral' as IsoTone };
    const st = def.state?.[id];
    const auto = autoCoords.get(id);
    const node: StageNode = {
      id,
      shape: d.shape ?? kd.shape,
      tone: asTone(d.tone, kd.tone),
      x: d.x ?? auto?.x ?? (i % 4) * 180 - 240,
      y: d.y ?? auto?.y ?? Math.floor(i / 4) * 120 - 60,
      label: toBilingual(d.label ?? mn?.label, id),
    };
    const icon = asIcon(d.icon, kd.icon);
    if (icon) node.icon = icon;
    if (d.sublabel) node.sublabel = toBilingual(d.sublabel);
    if (st?.loadPct !== undefined) node.loadPct = st.loadPct;
    if (st?.dead) node.dead = true;
    if (st?.dimmed) node.dimmed = true;
    if (st?.highlighted) node.highlighted = true;
    if (st?.badge) node.badge = { text: toBilingual(st.badge.text), tone: st.badge.tone };
    const ins = toInspector(d.inspector, node.label, SHAPE_KIND_LABEL[node.shape] ?? SHAPE_KIND_LABEL.block);
    if (ins) node.inspector = ins;
    return node;
  });

  const links: StageLink[] = modelLinks
    .filter((l) => (linkIds ? linkIds.has(l.id) || (l.fallbackMetaId ? linkIds.has(l.fallbackMetaId) : false) : true))
    .map((l) => {
      const metaKey = stage.links?.[l.id] ? l.id : (l.fallbackMetaId ?? l.id);
      const stateKey = def.linkState?.[l.id] ? l.id : (l.fallbackMetaId ?? l.id);
      const d = stage.links?.[metaKey] ?? {};
      const style = def.linkState?.[stateKey]?.style ?? d.style;
      const link: StageLink = { id: l.id, from: l.from, to: l.to };
      if (style) link.style = style;
      const lab = def.linkState?.[stateKey]?.label ?? d.label;
      if (lab) link.label = toBilingual(lab);
      if (d.fromPort) link.fromPort = d.fromPort as IsoPortDir;
      if (d.toPort) link.toPort = d.toPort as IsoPortDir;
      if (d.curve !== undefined) link.curve = d.curve;
      const ins = toInspector(
        d.inspector,
        lab ? toBilingual(lab) : { vi: `${l.from} → ${l.to}`, en: `${l.from} → ${l.to}` },
        { vi: 'Đường nối', en: 'Connection' }
      );
      if (ins) link.inspector = ins;
      return link;
    });

  let packets: StagePacket[] = [];
  if (def.packets === 'auto' || def.packets === undefined) {
    packets = buildCausalPacketsForScene(nodes, links, def.state);
  } else if (Array.isArray(def.packets)) {
    const have = new Set(links.map((l) => l.id));
    packets = def.packets
      .filter((p) => have.has(p.linkId))
      .map((p) => ({
        id: p.id,
        linkId: p.linkId,
        kind: (PACKET_KINDS.has(p.kind) ? p.kind : 'request') as PacketKind,
        speed: p.speed,
        offset: p.offset,
        reverse: p.reverse,
      }));
  }

  const scene: StageScene = { nodes, links, packets };

  if (def.zones?.length && stage.zones) {
    const zones: StageZoneSlab[] = [];
    for (const zid of def.zones) {
      const z = stage.zones[zid];
      if (!z) continue;
      const members = z.nodeIds.filter((n) => shown.has(n));
      if (!members.length) continue;
      zones.push({ id: zid, nodeIds: members, label: toBilingual(z.label), tone: asTone(z.tone, 'neutral') });
    }
    if (zones.length) scene.zones = zones;
  }

  if (def.noteCard) {
    scene.noteCard = {
      title: toBilingual(def.noteCard.title),
      lines: def.noteCard.lines.map((l) => ({
        text: toBilingual(l.text),
        tone: (['plain', 'muted', 'good', 'bad', 'amber'] as const).find((t) => t === l.tone),
      })),
      chart:
        def.noteCard.chart && typeof def.noteCard.chart.utilPct === 'number'
          ? {
              utilPct: def.noteCard.chart.utilPct,
              xLabel: def.noteCard.chart.xLabel ? toBilingual(def.noteCard.chart.xLabel) : undefined,
              yLabel: def.noteCard.chart.yLabel ? toBilingual(def.noteCard.chart.yLabel) : undefined,
            }
          : undefined,
      position: (['top-left', 'bottom-left', 'bottom-right'] as const).find((p) => p === def.noteCard?.position),
    };
  }

  return scene;
}

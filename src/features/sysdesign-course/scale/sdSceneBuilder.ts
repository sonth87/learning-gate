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

function asTone(t: SdStageTone | string | undefined, fallback: IsoTone): IsoTone {
  return t && TONES.has(t) ? (t as IsoTone) : fallback;
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

/** Dựng MemoryScene (tape | refs | tree) từ `scenes.<key>.memory`; null nếu sai dạng. */
export function buildSdMemoryScene(def: SdSceneDef): MemoryScene | null {
  const m = def.memory as Record<string, any> | undefined;
  if (!m || typeof m !== 'object') return null;
  const bi = (v: unknown, fb = ''): BilingualText => toBilingual(v as SdBilingual | string | undefined, fb);
  const biOpt = (v: unknown): BilingualText | undefined => (v === undefined || v === null ? undefined : bi(v));
  if (m.kind === 'tape') {
    if (!Array.isArray(m.cells)) return null;
    return {
      kind: 'tape',
      title: bi(m.title),
      subtitle: biOpt(m.subtitle),
      cells: m.cells.map(String),
      activeIndices: m.activeIndices,
      showNegativeIndices: m.showNegativeIndices,
      pointers: m.pointers,
      outputPill: m.outputPill
        ? { label: bi(m.outputPill.label), value: bi(m.outputPill.value), tone: m.outputPill.tone }
        : undefined,
    };
  }
  if (m.kind === 'refs') {
    if (!Array.isArray(m.names) || !Array.isArray(m.objects)) return null;
    return {
      kind: 'refs',
      leftTitle: bi(m.leftTitle),
      rightTitle: bi(m.rightTitle),
      names: m.names.map((n: any) => ({ ...n, note: biOpt(n.note) })),
      objects: m.objects.map((o: any) => ({ ...o, tone: asTone(o.tone, 'neutral'), badge: biOpt(o.badge) })),
    };
  }
  if (m.kind === 'tree') {
    if (!Array.isArray(m.nodes) || !Array.isArray(m.edges)) return null;
    return {
      kind: 'tree',
      title: bi(m.title),
      nodes: m.nodes.map((n: any) => ({ ...n, tone: asTone(n.tone, 'neutral'), sub: biOpt(n.sub) })),
      edges: m.edges,
    };
  }
  return null;
}

/**
 * Dựng StageScene từ định nghĩa cảnh. `model` (từ sim.json) cung cấp liên kết; thiếu model thì cảnh chỉ có node.
 * Trả null nếu cảnh không có node nào (người gọi sẽ rơi về code-trace).
 */
export function buildSdStageScene(
  stage: SdStageFile,
  def: SdSceneDef,
  model: SdModelLike | null
): StageScene | null {
  if (def.raw && typeof def.raw === 'object') return def.raw as StageScene;

  const modelNodes = new Map((model?.nodes ?? []).map((n) => [n.id, n]));
  const allNodeIds = [...new Set([...Object.keys(stage.nodes), ...modelNodes.keys()])];
  const nodeIds = def.show.nodes === '*' ? allNodeIds : def.show.nodes.filter((id) => allNodeIds.includes(id));
  if (nodeIds.length === 0) return null;
  const shown = new Set(nodeIds);

  const modelLinks = (model?.links ?? []).filter((l) => shown.has(l.from) && shown.has(l.to));

  // Tự động bố trí tọa độ mặt phẳng 2:1 theo tầng DAG (topological rank) khi node không khai báo x/y tường minh,
  // tránh việc composeIsometricLayout với n >= 5 chỉ nhân hệ số 1.26 trên lưới nhỏ (i % 4)*2 khiến các khối chồng lên nhau.
  const autoCoords = new Map<string, { x: number; y: number }>();
  if (nodeIds.some((id) => stage.nodes[id]?.x === undefined || stage.nodes[id]?.y === undefined)) {
    const rankOf = new Map<string, number>();
    for (const id of nodeIds) rankOf.set(id, 0);
    for (let pass = 0; pass < nodeIds.length; pass++) {
      let changed = false;
      for (const l of modelLinks) {
        const rf = rankOf.get(l.from) ?? 0;
        const rt = rankOf.get(l.to) ?? 0;
        if (rf + 1 > rt) {
          rankOf.set(l.to, rf + 1);
          changed = true;
        }
      }
      if (!changed) break;
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
    const colSpacing = maxRank >= 4 ? 175 : 210;
    const rowSpacing = 120;
    for (const [r, members] of byRank.entries()) {
      const xBase = Math.round((r - maxRank / 2) * colSpacing);
      const zigY = members.length === 1 ? (r % 2 === 0 ? 34 : -34) : 0;
      members.forEach((id, idx) => {
        const yOffset = Math.round((idx - (members.length - 1) / 2) * rowSpacing + zigY);
        autoCoords.set(id, { x: xBase, y: yOffset });
      });
    }
  }

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

  const linkIds = def.show.links === undefined || def.show.links === '*' ? null : new Set(def.show.links);
  const links: StageLink[] = modelLinks
    .filter((l) => (linkIds ? linkIds.has(l.id) : true))
    .map((l) => {
      const d = stage.links?.[l.id] ?? {};
      const style = def.linkState?.[l.id]?.style ?? d.style;
      const link: StageLink = { id: l.id, from: l.from, to: l.to };
      if (style) link.style = style;
      const lab = def.linkState?.[l.id]?.label ?? d.label;
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
  if (def.packets === 'auto') {
    packets = links
      .filter((l) => l.style !== 'off' && l.style !== 'cut')
      .slice(0, 6)
      .map((l, i) => ({ id: `pk_${l.id}`, linkId: l.id, kind: 'request' as PacketKind, speed: 0.4, offset: (i % 3) * 0.3 }));
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
      position: (['top-left', 'bottom-left', 'bottom-right'] as const).find((p) => p === def.noteCard?.position),
    };
  }

  return scene;
}

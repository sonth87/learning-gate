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
  PacketKind,
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

  const nodes: StageNode[] = nodeIds.map((id, i) => {
    const d = stage.nodes[id] ?? {};
    const mn = modelNodes.get(id);
    const kd = (mn?.kind && KIND_DEFAULTS[mn.kind]) || { shape: 'block' as LegacyNodeShape, tone: 'neutral' as IsoTone };
    const st = def.state?.[id];
    const node: StageNode = {
      id,
      shape: d.shape ?? kd.shape,
      tone: asTone(d.tone, kd.tone),
      x: d.x ?? (i % 4) * 2,
      y: d.y ?? Math.floor(i / 4) * 2,
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
    // d.inspector là Partial<StageInspectorInfo>; chỉ gắn khi đủ trường bắt buộc.
    const ins = d.inspector as Partial<NonNullable<StageNode['inspector']>> | undefined;
    if (ins && ins.title && ins.kindLabel && ins.what && ins.how && ins.why) {
      node.inspector = ins as NonNullable<StageNode['inspector']>;
    }
    return node;
  });

  const modelLinks = (model?.links ?? []).filter((l) => shown.has(l.from) && shown.has(l.to));
  const linkIds = def.show.links === undefined || def.show.links === '*' ? null : new Set(def.show.links);
  const links: StageLink[] = modelLinks
    .filter((l) => (linkIds ? linkIds.has(l.id) : true))
    .map((l) => {
      const d = stage.links?.[l.id] ?? {};
      const style = def.linkState?.[l.id]?.style ?? d.style;
      const link: StageLink = { id: l.id, from: l.from, to: l.to };
      if (style) link.style = style;
      if (d.label) link.label = toBilingual(d.label);
      if (d.fromPort) link.fromPort = d.fromPort as IsoPortDir;
      if (d.toPort) link.toPort = d.toPort as IsoPortDir;
      if (d.curve !== undefined) link.curve = d.curve;
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

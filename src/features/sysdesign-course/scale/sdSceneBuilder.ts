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

function getGroundOffsetForShape(shape: LegacyNodeShape): number {
  if (shape === 'cylinder' || shape === 'db') return 21;
  if (shape === 'laptop' || shape === 'device') return 16;
  if (shape === 'crowd') return 14;
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
  links: readonly { from: string; to: string }[]
): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  const n = nodeIds.length;
  if (n === 0) return out;

  const rankOf = new Map<string, number>();
  for (const id of nodeIds) rankOf.set(id, 0);
  for (let pass = 0; pass < n; pass++) {
    let changed = false;
    for (const l of links) {
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

  const placeGround = (id: string, gx: number, gy: number) => {
    const sh = shapes.get(id) ?? 'block';
    out.set(id, {
      x: Math.round(gx),
      y: Math.round(gy - getGroundOffsetForShape(sh)),
    });
  };

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
    // Lưu ý: ScaleStageSvg nhân spread = 1.26 khi n >= 5, nên tọa độ dưới đây đã chia trước cho 1.26
    // để sau khi nhân 1.26 mọi cặp node liền kề nằm chính xác trên trục 2:1 (|Δgy| = |Δgx| / 2)!
    if (variant === 0) {
      // Mẫu Arch-S 2:1:
      // 0 -> 1 (NE), 1 -> 2 (SE), 2 -> 3 (SE), 3 -> 4 (SW)
      const pts: Array<[number, number]> = [
        [-210, 15],
        [-70, -55],
        [70, 15],
        [210, 85],
        [70, 155],
      ];
      ids.forEach((id, idx) => placeGround(id, pts[idx][0], pts[idx][1]));
    } else {
      // Mẫu Courtyards 2:1:
      // 0 -> 1 (SE), 1 -> 2 (NE), 2 -> 3 (SE), 3 -> 4 (NE)
      const pts: Array<[number, number]> = [
        [-220, -25],
        [-90, 40],
        [40, -25],
        [170, 40],
        [260, -5],
      ];
      ids.forEach((id, idx) => placeGround(id, pts[idx][0], pts[idx][1]));
    }
    return out;
  }

  // Đồ thị phân tầng tổng quát (n >= 5, có tầng rẽ nhánh song song như client -> lb -> [app1, app2, app3] -> cache -> db):
  // Đặt theo hệ trục mặt sàn 2:1:
  // - Tiến theo tầng (rank) dọc hướng hỗn hợp u/v có chiều sâu
  // - Các node song song trong cùng một tầng trải dọc theo trục chéo isometric `v` (Δgx = -110, Δgy = +55)
  //   giúp fan-out từ LB sang App 1..3 và fan-in từ App 1..3 về Cache tạo thành hình thoi 2.5D tự nhiên!
    // Với ग्राफ 7 node dạng client -> lb -> [app1, app2, app3] -> cache -> db:
    // Đặt client -> lb theo trục NE (+130, -65), cụm app1..3 rẽ nhánh dọc trục SE (+56, +28) từ trục chính,
    // rồi tụ về cache và gập xuống db theo trục SW (-130, +65) tạo thành bố cục cụm 2.5D có chiều sâu,
    // giữ chiều ngang chỉ ~500px (thay vì trải ngang 800px) nên khối luôn to, rõ!
    const rankAnchors5: Array<[number, number]> = [
      [-210, 10],   // rank 0: client (trái)
      [-80, -55],   // rank 1: lb (thẳng trục NE 2:1 từ client: Δgx=+130, Δgy=-65)
      [50, 10],     // rank 2: tâm cụm app1..3 (thẳng trục SE 2:1 từ lb: Δgx=+130, Δgy=+65)
      [180, -55],   // rank 3: cache (thẳng trục NE 2:1 từ tâm app: Δgx=+130, Δgy=-65)
      [180, 95],    // rank 4: db (nằm phía trước cache ở góc phải-dưới)
    ];

    for (const [r, members] of byRank.entries()) {
      const anchor =
        r < rankAnchors5.length
          ? rankAnchors5[r]
          : [
              Math.round((r - maxRank / 2) * 125),
              r % 2 === 0 ? 28 : -28,
            ];
      const m = members.length;
      members.forEach((id, idx) => {
        if (m === 1) {
          placeGround(id, anchor[0], anchor[1]);
        } else {
          // Trải các node cùng tầng theo trục mặt sàn 2:1 (mỗi bước lệch Δgx = -36, Δgy = +72)
          const offset = idx - (m - 1) / 2;
          const gx = anchor[0] - offset * 36;
          const gy = anchor[1] + offset * 72;
          placeGround(id, gx, gy);
        }
      });
    }

  return out;
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

  const rawModelLinks = model?.links ?? [];
  const linkIds = def.show.links === undefined || def.show.links === '*' ? null : new Set(def.show.links);

  // Tìm các đường nối trực tiếp giữa các node đang hiển thị; nếu hai node nối nhau qua 1 node trung gian đang ẩn
  // (ví dụ Step 1 hiện [client, lb, app1, db] khi cache chưa xuất hiện), tự động bắc cầu (bridge link) để luồng liền mạch.
  const directLinks = rawModelLinks.filter((l) => shown.has(l.from) && shown.has(l.to));
  const bridgedLinks: SdModelLinkLike[] = [...directLinks];
  if (def.show.links === undefined || def.show.links === '*') {
    const directPairs = new Set(directLinks.map((l) => `${l.from}->${l.to}`));
    for (const hidden of model?.nodes ?? []) {
      if (shown.has(hidden.id)) continue;
      const inLinks = rawModelLinks.filter((l) => l.to === hidden.id && shown.has(l.from));
      const outLinks = rawModelLinks.filter((l) => l.from === hidden.id && shown.has(l.to));
      for (const il of inLinks) {
        for (const ol of outLinks) {
          const key = `${il.from}->${ol.to}`;
          if (!directPairs.has(key)) {
            directPairs.add(key);
            bridgedLinks.push({ id: il.id, from: il.from, to: ol.to });
          }
        }
      }
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

  const autoCoords = nodeIds.some((id) => stage.nodes[id]?.x === undefined || stage.nodes[id]?.y === undefined)
    ? computeIsometricDagCoords(nodeIds, shapeByNode, modelLinks)
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

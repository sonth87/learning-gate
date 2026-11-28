/*
 * Tiện ích soạn bài Phòng Lab (dùng chung cho các file cấp độ trong `labs/`).
 *
 * File này cố ý KHÔNG import giá trị (runtime) từ `../labChallenges` để tránh vòng import
 * (labChallenges.ts nạp catalog từ `labs/index.ts`). Chỉ dùng `import type`.
 */
import {
  effReplicas,
  makeNode,
  type LinkSpec,
  type LoadProfile,
  type NodeId,
  type NodeSpec,
  type PrimitiveKind,
  type SystemModel,
} from '@/features/sysdesign-course/sim';
import type { NodeOverrides } from '@/features/sysdesign-course/sim';
import {
  gridPositionsToCanvas,
  type CanvasPos,
  type GridPos,
} from '../../components/lab/canvasGeometry';
import type { BiText, LabCanvasPreset, LabTopologyCheckSpec } from '../labChallenges';

export const bi = (vi: string, en: string): BiText => ({ vi, en });

export const fromGrid = (positions: Record<NodeId, GridPos>): Record<NodeId, CanvasPos> =>
  gridPositionsToCanvas(positions);

/** Dựng node: `replicas` được ghi cả vào spec lẫn params (giống các preset cũ). */
export function node(
  kind: PrimitiveKind,
  id: string,
  label: BiText,
  zone: string,
  opts: Omit<NodeOverrides, 'id' | 'label' | 'zone'> = {}
): NodeSpec {
  const { replicas, params, ...rest } = opts;
  const p = { ...(params ?? {}) };
  if (replicas !== undefined) p.replicas = replicas;
  return makeNode(kind, {
    id,
    label,
    zone,
    ...(replicas !== undefined ? { replicas } : {}),
    ...(Object.keys(p).length > 0 ? { params: p } : {}),
    ...rest,
  });
}

export const clientNode = (vi = 'Người dùng', en = 'Clients'): NodeSpec =>
  makeNode('client', { id: 'client', label: bi(vi, en), zone: 'internet' });

/** Link sync mang `rw`, timeout tuỳ chọn. */
export function sync(
  id: string,
  from: string,
  to: string,
  timeoutMs: number | undefined,
  extra: Partial<LinkSpec> = {}
): LinkSpec {
  return {
    id,
    from,
    to,
    mode: 'sync',
    carries: 'rw',
    ...(timeoutMs !== undefined ? { timeoutMs } : {}),
    ...extra,
  };
}

export function makeBlankPreset(
  load: LoadProfile,
  readRatio: number,
  durationSec = 60
): LabCanvasPreset {
  return {
    model: {
      nodes: [clientNode()],
      links: [],
      routes: { client: 'split' },
    },
    positions: fromGrid({ client: { col: 0, row: 2 } }),
    lockedNodeIds: ['client'],
    load,
    readRatio,
    durationSec,
  };
}

/**
 * Preset từ model + bố cục lưới. Luôn khoá node client; `extraLocked` khoá thêm các node mà kịch bản
 * bơm sự cố theo id cố định (để người học không xoá/đổi được mục tiêu của sự cố).
 */
export function preset(
  model: SystemModel,
  grid: Record<NodeId, GridPos>,
  load: LoadProfile,
  readRatio: number,
  extraLocked: NodeId[] = [],
  durationSec = 60
): LabCanvasPreset {
  return {
    model,
    positions: fromGrid(grid),
    lockedNodeIds: ['client', ...extraLocked],
    load,
    readRatio,
    durationSec,
  };
}

/**
 * Canvas "trống" có sẵn các node cố định (bị khoá) mà sự cố của kịch bản nhắm tới — ví dụ một
 * dịch vụ bên thứ ba. Người học tự nối phần còn lại.
 */
export function blankWithFixed(
  fixed: NodeSpec[],
  links: LinkSpec[],
  grid: Record<NodeId, GridPos>,
  load: LoadProfile,
  readRatio: number,
  routes: SystemModel['routes'] = {},
  durationSec = 60
): LabCanvasPreset {
  return {
    model: {
      nodes: [clientNode(), ...fixed],
      links,
      routes: { client: 'split', ...routes },
    },
    positions: fromGrid({ client: { col: 0, row: 2 }, ...grid }),
    lockedNodeIds: ['client', ...fixed.map((n) => n.id)],
    load,
    readRatio,
    durationSec,
  };
}

/** Các node đi tới được từ client qua link xử lý (sync | async | pull) — bản sao cục bộ, tránh vòng import. */
export function reachable(model: SystemModel): Set<NodeId> {
  const visited = new Set<NodeId>();
  const queue: NodeId[] = [];
  for (const n of model.nodes) {
    if (n.kind === 'client' && n.params.enabled !== false) {
      visited.add(n.id);
      queue.push(n.id);
    }
  }
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const l of model.links) {
      if (l.from !== cur || l.mode === 'replicate') continue;
      const target = model.nodes.find((x) => x.id === l.to);
      if (!target || target.params.enabled === false) continue;
      if (!visited.has(l.to)) {
        visited.add(l.to);
        queue.push(l.to);
      }
    }
  }
  return visited;
}

export function requireKinds(
  id: string,
  label: BiText,
  kinds: PrimitiveKind[],
  want: BiText
): LabTopologyCheckSpec {
  return {
    id,
    label,
    check: (model) => {
      const reach = reachable(model);
      const matched = model.nodes.filter((n) => reach.has(n.id) && kinds.includes(n.kind));
      return {
        pass: matched.length > 0,
        got:
          matched.length > 0
            ? bi(
                `Đã nối (${matched.map((n) => n.label.vi).join(', ')})`,
                `Connected (${matched.map((n) => n.label.en).join(', ')})`
              )
            : bi('Chưa có trên luồng xử lý', 'Missing on active flow'),
        want,
      };
    },
  };
}

/** Tổng số instance của các node `kind` trên luồng xử lý. */
export function totalReplicas(model: SystemModel, kind: PrimitiveKind): number {
  const reach = reachable(model);
  return model.nodes
    .filter((n) => reach.has(n.id) && n.kind === kind)
    .reduce((acc, n) => acc + effReplicas(n), 0);
}

export function requireMinReplicas(
  id: string,
  label: BiText,
  kind: PrimitiveKind,
  min: number,
  unit: BiText = bi('instance', 'instances')
): LabTopologyCheckSpec {
  return {
    id,
    label,
    check: (model) => {
      const total = totalReplicas(model, kind);
      return {
        pass: total >= min,
        got: bi(`${total} ${unit.vi}`, `${total} ${unit.en}`),
        want: bi(`≥ ${min} ${unit.vi}`, `≥ ${min} ${unit.en}`),
      };
    },
  };
}

/** Một link thoả `pred` tồn tại trên luồng xử lý. */
export function requireLink(
  id: string,
  label: BiText,
  pred: (l: LinkSpec, model: SystemModel) => boolean,
  okText: BiText,
  missingText: BiText
): LabTopologyCheckSpec {
  return {
    id,
    label,
    check: (model) => {
      const reach = reachable(model);
      const ok = model.links.some((l) => reach.has(l.from) && pred(l, model));
      return { pass: ok, got: ok ? okText : missingText, want: okText };
    },
  };
}

export const kindOf = (model: SystemModel, id: NodeId): PrimitiveKind | undefined =>
  model.nodes.find((n) => n.id === id)?.kind;

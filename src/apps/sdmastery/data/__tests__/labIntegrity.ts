/*
 * Kiểm tra "toàn vẹn luồng dữ liệu" cục bộ cho test (bản độc lập, không phụ thuộc grader):
 *  - mọi đường ĐỌC từ client phải kết thúc ở kho bền vững: sql | nosql | blob | search;
 *  - mọi đường GHI phải tới sql | nosql | blob (trực tiếp hoặc qua queue →(pull)→ worker → kho);
 *  - không có node "cụt": lb/gateway/rate-limiter/service/cache/cdn/worker/queue đi tới được
 *    nhưng không có link xử lý đi tiếp (sync | async | pull);
 *  - mọi queue đi tới được phải có consumer kéo (pull) là worker.
 * Dùng để bảo đảm lời giải mẫu tương thích với quy tắc toàn vẹn của grader.
 */
import type {
  LinkSpec,
  NodeSpec,
  PrimitiveKind,
  SystemModel,
} from '@/features/sysdesign-course/sim';

const READ_STORES = new Set<PrimitiveKind>(['sql', 'nosql', 'blob', 'search']);
const WRITE_STORES = new Set<PrimitiveKind>(['sql', 'nosql', 'blob']);
const PROCESSING = new Set<PrimitiveKind>([
  'lb',
  'gateway',
  'rate-limiter',
  'service',
  'cache',
  'cdn',
  'worker',
  'queue',
]);

const enabled = (n: NodeSpec | undefined): n is NodeSpec => !!n && n.params.enabled !== false;

export function dataFlowIntegrityIssues(model: SystemModel): string[] {
  const byId = new Map(model.nodes.map((n) => [n.id, n] as const));
  const flow = model.links.filter(
    (l) => l.mode !== 'replicate' && enabled(byId.get(l.from)) && enabled(byId.get(l.to))
  );
  const outOf = (id: string) => flow.filter((l) => l.from === id);
  const carriesR = (l: LinkSpec) => l.mode === 'pull' || (l.carries ?? 'rw') !== 'w';
  const carriesW = (l: LinkSpec) => l.mode === 'pull' || (l.carries ?? 'rw') !== 'r';
  const issues: string[] = [];

  // Reachability (mọi lớp lưu lượng)
  const clients = model.nodes.filter((n) => n.kind === 'client' && enabled(n)).map((n) => n.id);
  const reach = new Set<string>(clients);
  const q = [...clients];
  while (q.length > 0) {
    const cur = q.shift()!;
    for (const l of outOf(cur)) {
      if (!reach.has(l.to)) {
        reach.add(l.to);
        q.push(l.to);
      }
    }
  }

  for (const id of reach) {
    const n = byId.get(id)!;
    if (PROCESSING.has(n.kind) && outOf(id).length === 0) issues.push(`dead-end:${id}`);
    if (n.kind === 'queue') {
      const pulls = outOf(id).filter((l) => l.mode === 'pull' && byId.get(l.to)?.kind === 'worker');
      if (pulls.length === 0) issues.push(`queue-without-pull-worker:${id}`);
    }
  }

  const walk = (cls: 'r' | 'w') => {
    const stores = cls === 'r' ? READ_STORES : WRITE_STORES;
    const carries = cls === 'r' ? carriesR : carriesW;
    const seen = new Set<string>();
    const visit = (id: string, path: string[]) => {
      const n = byId.get(id)!;
      if (stores.has(n.kind)) return; // đã chạm kho bền vững
      const key = id;
      if (seen.has(key)) return;
      seen.add(key);
      let outs = outOf(id).filter(carries);
      if (n.kind === 'queue') outs = outs.filter((l) => l.mode === 'pull');
      if (outs.length === 0) {
        if (n.kind !== 'client' || path.length > 0) {
          issues.push(`${cls === 'r' ? 'read' : 'write'}-path-ends-at:${id}(${n.kind})`);
        }
        return;
      }
      for (const l of outs) visit(l.to, [...path, id]);
    };
    for (const c of clients) {
      const outs = outOf(c).filter(carries);
      if (outs.length === 0) issues.push(`${cls}-not-sent:${c}`);
      for (const l of outs) visit(l.to, [c]);
    }
  };
  walk('r');
  walk('w');
  return [...new Set(issues)];
}

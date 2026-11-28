/**
 * Kiểm tra toàn vẹn luồng dữ liệu (data-flow integrity) cho Phòng Lab.
 *
 * Bộ mô phỏng coi một request kết thúc ở BẤT KỲ node nào (service, LB, cache…) là "đã phục vụ".
 * Vì vậy một thiết kế thiếu hẳn database vẫn có thể đạt SLO. Module này phân tích tĩnh đồ thị để
 * bảo đảm request thực sự tới được nơi lưu dữ liệu, theo đúng ngữ nghĩa định tuyến của engine:
 *
 * - Link xử lý = `sync | async | pull`; `replicate` không mang request. Node `params.enabled === false`
 *   bị loại (cùng các link tới nó) — giống `getReachableFromClient`.
 * - Link sync/async mang lớp lưu lượng theo `carries` (`r`, `w`, `rw`, mặc định `rw`). Link `pull`
 *   (queue → worker) mang mọi thứ có trong hàng đợi (engine bỏ qua `carries` trên pull).
 * - Node route `split` (mặc định cho lb/dns/cdn/cache/queue) chia mỗi request cho MỘT nhánh → mọi
 *   nhánh mang lớp đó đều phải dẫn tới lưu trữ. Node `all-sequential`/`all-parallel` (mặc định cho
 *   service, worker, gateway…) gọi TẤT CẢ nhánh → chỉ cần ít nhất một nhánh dẫn tới lưu trữ (các lời
 *   gọi phụ, ví dụ cache-aside hay một service xác thực lá, là hợp lệ).
 * - Queue/log chỉ chuyển tiếp qua link `pull` tới consumer (worker); queue phân chia theo năng lực
 *   consumer nên mọi consumer đều phải dẫn tới lưu trữ.
 * - Cache/CDN: lượt trúng được trả ngay, lượt trượt (đọc) đi tiếp theo link đọc của chính nó, hoặc
 *   theo một link `onMissOf = cache` ở node gọi (cache-aside). Ghi đi qua cache phải được chuyển tiếp.
 *
 * Nơi lưu trữ: đọc kết thúc hợp lệ ở sql / nosql / blob / search; ghi bền vững ở sql / nosql / blob.
 *
 * Luật:
 *  1. Mọi client (đang bật) phải có ít nhất một link xử lý đi ra.
 *  2. Đọc (nếu kịch bản có đọc): từ mọi client, luồng đọc phải dẫn tới nơi lưu trữ (theo ngữ nghĩa trên).
 *  3. Ghi (nếu readRatio < 1): từ mọi client, luồng ghi phải dẫn tới lưu trữ bền vững — trực tiếp,
 *     hoặc qua queue có consumer ghi vào lưu trữ.
 *  4. Không ngõ cụt: node không phải lưu trữ nhận lưu lượng mà không chuyển tiếp lớp đó (trên một
 *     nhánh bắt buộc) bị báo tên; queue không có consumer pull cũng là ngõ cụt.
 */
import type { LinkSpec, NodeId, NodeSpec, PrimitiveKind, SystemModel } from '@/features/sysdesign-course/sim';

export interface BiMsg {
  vi: string;
  en: string;
}

export type IntegrityIssueCode =
  | 'no-client'
  | 'client-unconnected'
  | 'reads-no-storage'
  | 'writes-no-storage'
  | 'dead-end'
  | 'queue-no-consumer'
  | 'cache-no-miss-path'
  /** Node bắt buộc của đề (bị khoá) không còn nằm trên luồng xử lý (do bộ chấm thêm vào). */
  | 'required-node-unreachable';

export interface IntegrityIssue {
  code: IntegrityIssueCode;
  nodeId?: NodeId;
  /** Lớp lưu lượng bị ảnh hưởng. */
  traffic?: 'read' | 'write' | 'rw';
  message: BiMsg;
}

export interface IntegrityOptions {
  /**
   * Tỉ lệ đọc của (các) kịch bản. Có đọc nếu một giá trị > 0, có ghi nếu một giá trị < 1.
   * Bỏ trống = kiểm tra cả đọc lẫn ghi.
   */
  readRatio?: number | number[];
}

type Cls = 'r' | 'w';

const READ_SINKS: ReadonlySet<PrimitiveKind> = new Set<PrimitiveKind>(['sql', 'nosql', 'blob', 'search']);
const WRITE_SINKS: ReadonlySet<PrimitiveKind> = new Set<PrimitiveKind>(['sql', 'nosql', 'blob']);
const PULL_SOURCES: ReadonlySet<PrimitiveKind> = new Set<PrimitiveKind>(['queue', 'log']);
const SPLIT_DEFAULT: ReadonlySet<PrimitiveKind> = new Set<PrimitiveKind>(['lb', 'cdn', 'dns', 'cache', 'queue']);

const isCacheKind = (k: PrimitiveKind) => k === 'cache' || k === 'cdn';
const enabled = (n: NodeSpec | undefined): n is NodeSpec => !!n && n.params.enabled !== false;

function linkCarries(l: LinkSpec, cls: Cls): boolean {
  if (l.mode === 'replicate') return false;
  if (l.mode === 'pull') return true;
  const c = l.carries ?? 'rw';
  return cls === 'r' ? c !== 'w' : c !== 'r';
}

const q = (s: string) => `“${s}”`;

/** Phân tích tĩnh: request đọc/ghi có thực sự tới nơi lưu dữ liệu không. Hàm thuần. */
export function checkDataFlowIntegrity(model: SystemModel, opts: IntegrityOptions = {}): IntegrityIssue[] {
  const ratios =
    opts.readRatio === undefined ? null : Array.isArray(opts.readRatio) ? opts.readRatio : [opts.readRatio];
  const hasReads = ratios === null || ratios.length === 0 || ratios.some((r) => r > 0);
  const hasWrites = ratios === null || ratios.length === 0 || ratios.some((r) => r < 1);

  const byId = new Map<NodeId, NodeSpec>();
  for (const n of model.nodes) byId.set(n.id, n);
  const live = (id: NodeId) => enabled(byId.get(id));
  const routeOf = (n: NodeSpec) => model.routes?.[n.id] ?? (SPLIT_DEFAULT.has(n.kind) ? 'split' : 'all-sequential');

  /** Link xử lý đi ra từ `n` mang lớp `cls`, tới node đang bật. */
  const outs = (n: NodeSpec, cls: Cls): LinkSpec[] =>
    model.links.filter((l) => {
      if (l.from !== n.id || !live(l.to) || !linkCarries(l, cls)) return false;
      // queue/log chỉ chuyển tiếp qua pull; node khác không "pull" ra ngoài
      if (PULL_SOURCES.has(n.kind)) return l.mode === 'pull';
      return l.mode !== 'pull';
    });
  /** Link cache-aside: link đọc ở node gọi đánh dấu `onMissOf = cache`. */
  const missLinks = (cache: NodeSpec): LinkSpec[] =>
    model.links.filter(
      (l) => l.onMissOf === cache.id && l.mode !== 'replicate' && l.mode !== 'pull' && live(l.from) && live(l.to) && linkCarries(l, 'r')
    );

  const memo: Record<Cls, Map<NodeId, boolean>> = { r: new Map(), w: new Map() };
  const visiting: Record<Cls, Set<NodeId>> = { r: new Set(), w: new Set() };

  /** true nếu lưu lượng lớp `cls` đi vào `id` chắc chắn kết thúc ở nơi lưu trữ. */
  function good(id: NodeId, cls: Cls): boolean {
    const m = memo[cls];
    if (m.has(id)) return m.get(id)!;
    if (visiting[cls].has(id)) return false; // chu trình — mô hình không hợp lệ
    visiting[cls].add(id);
    const n = byId.get(id)!;
    let res: boolean;
    if ((cls === 'r' ? READ_SINKS : WRITE_SINKS).has(n.kind)) {
      res = true;
    } else {
      const o = outs(n, cls);
      if (isCacheKind(n.kind) && cls === 'r') {
        // trượt: hoặc đi tiếp qua link đọc của cache, hoặc qua link onMissOf ở node gọi
        const viaSelf = o.length > 0 && (routeOf(n) === 'split' ? o.every((l) => good(l.to, cls)) : o.some((l) => good(l.to, cls)));
        res = viaSelf || missLinks(n).some((l) => good(l.to, cls));
      } else if (o.length === 0) {
        res = false;
      } else if (routeOf(n) === 'split' || PULL_SOURCES.has(n.kind)) {
        res = o.every((l) => good(l.to, cls));
      } else {
        res = o.some((l) => good(l.to, cls));
      }
    }
    visiting[cls].delete(id);
    m.set(id, res);
    return res;
  }

  const issues: IntegrityIssue[] = [];
  const clients = model.nodes.filter((n) => n.kind === 'client' && enabled(n));
  if (clients.length === 0) {
    return [{ code: 'no-client', message: { vi: 'Chưa có Client nào đang bật để gửi request.', en: 'No enabled client sends requests.' } }];
  }

  const classes: Cls[] = [];
  if (hasReads) classes.push('r');
  if (hasWrites) classes.push('w');

  for (const c of clients) {
    const anyOut = model.links.some((l) => l.from === c.id && l.mode !== 'replicate' && live(l.to));
    if (!anyOut) {
      issues.push({
        code: 'client-unconnected',
        nodeId: c.id,
        message: {
          vi: `${q(c.label.vi)} chưa nối tới thành phần nào — request không có nơi để đi.`,
          en: `${q(c.label.en)} is not connected to anything — requests have nowhere to go.`,
        },
      });
    }
  }
  if (issues.length > 0) return issues;

  // Tìm ngõ cụt: duyệt các node mà lưu lượng lớp cls "bắt buộc" phải đi qua để tới lưu trữ.
  // Node split: mọi nhánh đều bắt buộc. Node fan-out: nếu đã ổn (có nhánh tới lưu trữ) thì các
  // nhánh phụ không bắt buộc; nếu không ổn thì mọi nhánh đều được xét để chỉ ra chỗ hỏng.
  const deadEnds = new Map<NodeId, { r: boolean; w: boolean; kind: IntegrityIssueCode }>();
  for (const cls of classes) {
    const seen = new Set<NodeId>();
    const stack: NodeId[] = clients.map((c) => c.id);
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const n = byId.get(id)!;
      if ((cls === 'r' ? READ_SINKS : WRITE_SINKS).has(n.kind)) continue;
      if (good(id, cls)) {
        if (routeOf(n) === 'split' || PULL_SOURCES.has(n.kind)) for (const l of outs(n, cls)) stack.push(l.to);
        continue;
      }
      const o = outs(n, cls);
      const miss = isCacheKind(n.kind) && cls === 'r' ? missLinks(n) : [];
      if (o.length === 0 && miss.length === 0 && n.kind !== 'client') {
        const code: IntegrityIssueCode = PULL_SOURCES.has(n.kind)
          ? 'queue-no-consumer'
          : isCacheKind(n.kind) && cls === 'r'
            ? 'cache-no-miss-path'
            : 'dead-end';
        const cur = deadEnds.get(id) ?? { r: false, w: false, kind: code };
        cur[cls] = true;
        if (code !== 'dead-end') cur.kind = code;
        deadEnds.set(id, cur);
        continue;
      }
      for (const l of o) stack.push(l.to);
      for (const l of miss) stack.push(l.to);
    }
  }

  for (const [id, d] of deadEnds) {
    const n = byId.get(id)!;
    const traffic: IntegrityIssue['traffic'] = d.r && d.w ? 'rw' : d.r ? 'read' : 'write';
    const tVi = traffic === 'rw' ? 'Request' : traffic === 'read' ? 'Request đọc' : 'Request ghi';
    const tEn = traffic === 'rw' ? 'Requests' : traffic === 'read' ? 'Read requests' : 'Write requests';
    let message: BiMsg;
    if (d.kind === 'queue-no-consumer') {
      message = {
        vi: `${q(n.label.vi)} chưa có worker nào kéo (pull) message ra — dữ liệu bị kẹt trong hàng đợi, không bao giờ được lưu.`,
        en: `${q(n.label.en)} has no worker pulling from it — messages pile up and never get persisted.`,
      };
    } else if (d.kind === 'cache-no-miss-path') {
      message = {
        vi: `${q(n.label.vi)} không có đường đi khi cache trượt (miss) — cần nối tiếp tới Database, hoặc đặt link tới Database với "onMissOf" ở service.`,
        en: `${q(n.label.en)} has no path on a cache miss — connect it to a database, or add a service→database link marked "onMissOf".`,
      };
    } else {
      message = {
        vi: `${tVi} kết thúc tại ${q(n.label.vi)} mà không tới nơi lưu dữ liệu — hãy nối tiếp tới thành phần phía sau.`,
        en: `${tEn} stop at ${q(n.label.en)} without reaching any data store — connect it to a downstream component.`,
      };
    }
    issues.push({ code: d.kind, nodeId: id, traffic, message });
  }

  if (hasReads && !clients.every((c) => good(c.id, 'r'))) {
    issues.push({
      code: 'reads-no-storage',
      traffic: 'read',
      message: {
        vi: 'Có luồng đọc không tới được nguồn dữ liệu gốc (SQL / NoSQL / Blob / Search) — người dùng sẽ không đọc được dữ liệu thật.',
        en: 'Some read traffic never reaches a source of truth (SQL / NoSQL / Blob / Search) — users cannot read real data.',
      },
    });
  }
  if (hasWrites && !clients.every((c) => good(c.id, 'w'))) {
    issues.push({
      code: 'writes-no-storage',
      traffic: 'write',
      message: {
        vi: 'Có luồng ghi không tới được nơi lưu trữ bền vững (SQL / NoSQL / Blob, trực tiếp hoặc qua queue + worker) — dữ liệu sẽ bị mất.',
        en: 'Some write traffic never reaches durable storage (SQL / NoSQL / Blob, directly or via queue + worker) — data would be lost.',
      },
    });
  }
  return issues;
}

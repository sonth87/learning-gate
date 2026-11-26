/**
 * Bộ kiểm tra bất biến lịch sử (Checkers) cho `HistoryOp[]` & `TimelineSideEffect[]` (04 §12).
 * Đồng bộ ngữ nghĩa với `computeTimelineViolations` trong `activities/grade.ts` và bổ sung
 * kiểm `lost-update` và `double-charge`.
 */
import type { TimelineHistoryOp, TimelineSideEffect } from './types';

/** Đọc cũ (stale read): đọc trả về giá trị cũ hơn bản ghi đã hoàn tất trước thời điểm bắt đầu đọc (không có ghi đồng thời trùng giá trị). */
export function findStaleReads(history: readonly TimelineHistoryOp[]): string[] {
  const writes = history
    .filter((op) => op.op === 'write' && op.ok !== false)
    .sort((a, b) => a.end - b.end);
  const reads = history
    .filter((op) => op.op === 'read' && op.ok !== false)
    .sort((a, b) => a.start - b.start);

  const bad: string[] = [];
  for (const r of reads) {
    const completed = writes.filter((w) => w.key === r.key && w.end <= r.start);
    if (completed.length === 0) continue;
    const latest = completed[completed.length - 1];
    const concurrentMatch = writes.some(
      (w) => w.key === r.key && w.start <= r.end && w.end >= r.start && w.value === r.value
    );
    if (r.value !== latest.value && !concurrentMatch) bad.push(r.id);
  }
  return bad;
}

/** Vi phạm Read-Your-Writes: cùng một client đọc lại key mình vừa ghi xong nhưng nhận giá trị khác bản ghi mới nhất của chính mình. */
export function findRywViolations(history: readonly TimelineHistoryOp[]): string[] {
  const writes = history
    .filter((op) => op.op === 'write' && op.ok !== false)
    .sort((a, b) => a.end - b.end);
  const reads = history
    .filter((op) => op.op === 'read' && op.ok !== false)
    .sort((a, b) => a.start - b.start);

  const bad: string[] = [];
  for (const r of reads) {
    const ownPrior = writes.filter(
      (w) => w.client === r.client && w.key === r.key && w.end <= r.start
    );
    if (ownPrior.length === 0) continue;
    const latestOwn = ownPrior[ownPrior.length - 1];
    if (r.value !== latestOwn.value) bad.push(r.id);
  }
  return bad;
}

/** Vi phạm Monotonic Reads: client đã thấy phiên bản mới nhưng lần đọc kế tiếp lại quay ngược về phiên bản cũ hơn. */
export function findNonMonotonicReads(history: readonly TimelineHistoryOp[]): string[] {
  const writes = history
    .filter((op) => op.op === 'write' && op.ok !== false)
    .sort((a, b) => a.end - b.end);
  const reads = history
    .filter((op) => op.op === 'read' && op.ok !== false)
    .sort((a, b) => a.start - b.start);

  const writeOrd = new Map<string, number>();
  writes.forEach((w, idx) => writeOrd.set(`${w.key}:${String(w.value)}`, idx));
  const maxSeen = new Map<string, number>();
  const bad: string[] = [];

  for (const r of reads) {
    const ck = `${r.client}:${r.key}`;
    const ord = writeOrd.get(`${r.key}:${String(r.value)}`) ?? -1;
    const prev = maxSeen.get(ck) ?? -1;
    if (ord < prev) bad.push(r.id);
    else maxSeen.set(ck, Math.max(prev, ord));
  }
  return bad;
}

/**
 * Phát hiện Lost Update cho chu trình Read-Modify-Write:
 * Một thao tác ghi thành công `w` của client C đọc giá trị tại `r` (trước `w`), nhưng giữa `r.start` và `w.end`
 * có một thao tác ghi thành công khác trên cùng `key` khiến cập nhật bị ghi đè.
 */
export function findLostUpdates(history: readonly TimelineHistoryOp[]): string[] {
  const okOps = history.filter((op) => op.ok !== false);
  const writes = okOps.filter((op) => op.op === 'write').sort((a, b) => a.end - b.end);
  const reads = okOps.filter((op) => op.op === 'read').sort((a, b) => a.start - b.start);

  const clobberingWriteIds: string[] = [];
  for (const w of writes) {
    const priorClientReads = reads.filter(
      (r) => r.client === w.client && r.key === w.key && r.end <= w.start
    );
    if (priorClientReads.length === 0) continue;
    const baseRead = priorClientReads[priorClientReads.length - 1];
    const intervening = writes.some(
      (other) =>
        other.id !== w.id &&
        other.client !== w.client &&
        other.key === w.key &&
        other.value !== baseRead.value &&
        other.end > baseRead.start &&
        other.end <= w.end
    );
    if (intervening) clobberingWriteIds.push(w.id);
  }
  return clobberingWriteIds;
}

/** Phát hiện trừ tiền kép / thực thi trùng tác dụng phụ (Double Charge) khi thiếu idempotency key. */
export function findDoubleCharges(effects: readonly TimelineSideEffect[], action = 'charge'): TimelineSideEffect[] {
  const charges = effects.filter((e) => e.action === action);
  if (charges.length <= 1) return [];
  return charges.slice(1);
}

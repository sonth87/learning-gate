/**
 * Lấy mẫu chấm (packet) cho stage (04 §4). Dùng luồng RNG riêng (channel 2) nên KHÔNG ảnh hưởng kết quả
 * mô phỏng. Số lượng chấm sinh ra không dùng RNG (tích luỹ acc) để ổn định; RNG chỉ phân loại.
 */
import { DT, type CompiledModel } from './model';
import { tickRng } from './rng';
import type { SimPacket, SimPacketKind, SimState } from './types';

/** Dãy 1-2-5 từ 1 tới trần 1 000 000 req/s mỗi chấm (04 §4 bước 1: trần `packetScale`). */
export const PACKET_SCALE_MAX = 1_000_000;
const SCALE_STEPS: number[] = (() => {
  const out: number[] = [];
  for (let e = 0; e <= 5; e++) for (const m of [1, 2, 5]) out.push(m * Math.pow(10, e));
  out.push(PACKET_SCALE_MAX);
  return out;
})();

/** Dữ liệu theo link (chỉ số link) do engine điền mỗi tick. */
export interface PacketLinkInput {
  A: Float64Array;       // lưu lượng cung cấp lên link (rps, gồm retry)
  rr: Float64Array;      // phần retry
  pSucc: Float64Array;   // xác suất 1 attempt thành công
  pTo: Float64Array;     // xác suất 1 attempt timeout
  pDrop: Float64Array;   // xác suất 1 attempt bị drop/limited
  pHit: Float64Array;    // xác suất chấm quay đầu sớm tại cache (link vào cache/cdn)
}

function pickScale(totalRps: number, travelSec: number, maxPackets: number, cur: number): number {
  const est = (n: number) => (2 * totalRps * travelSec) / n;
  const budget = maxPackets * 0.8;
  let best = SCALE_STEPS[SCALE_STEPS.length - 1];
  for (const n of SCALE_STEPS) {
    if (est(n) <= budget) { best = n; break; }
  }
  if (cur <= 0) return best;
  if (est(cur) > budget) return best;                 // quá nhiều chấm: tăng N ngay
  if (best < cur && est(best) <= budget / 1.4) return best; // giảm N chỉ khi dư rộng (hysteresis)
  return cur;
}

export function stepPackets(c: CompiledModel, s: SimState, k: number, inp: PacketLinkInput): void {
  const max = c.options.maxPackets;
  if (max <= 0) {
    if (s.inflightPackets.length > 0) s.inflightPackets = [];
    s.packetScale = 0;
    return;
  }
  const travel = c.options.packetTravelSec;
  // 1. tiến độ các chấm đang bay
  const dp = DT / travel;
  const keep: SimPacket[] = [];
  for (const p of s.inflightPackets) {
    p.progress += dp;
    if (p.progress >= 1) continue;
    if (p.fate !== undefined && p.progress >= p.fate && p.kind !== 'cache-hit') continue;
    if (p.kind === 'cache-hit' && p.progress >= 1) continue;
    keep.push(p);
  }
  // 2. hệ số co giãn
  let total = 0;
  for (let e = 0; e < c.links.length; e++) total += inp.A[e];
  s.packetScale = pickScale(total, travel, max, s.packetScale);
  const N = s.packetScale;
  // 3. sinh chấm
  const rand = tickRng(c.seed, k, 2);
  for (let e = 0; e < c.links.length; e++) {
    const id = c.links[e].id;
    const A = inp.A[e];
    let acc = (s.packetAcc[id] ?? 0) + (A * DT) / N;
    let n = Math.floor(acc);
    if (n > 40) n = 40;
    acc -= Math.floor(acc);
    s.packetAcc[id] = acc;
    for (let i = 0; i < n; i++) {
      const u1 = rand();
      const u2 = rand();
      const u3 = rand();
      const pRetry = A > 1e-9 ? inp.rr[e] / A : 0;
      let kind: SimPacketKind;
      let fate: number | undefined;
      let reverse = false;
      let spawnResponse = false;
      if (u2 < inp.pHit[e]) {
        kind = 'cache-hit'; reverse = false; fate = 0.5;
      } else if (u3 < inp.pSucc[e]) {
        kind = u1 < pRetry ? 'retry' : 'request';
        spawnResponse = true;
      } else {
        const v = (u3 - inp.pSucc[e]) / Math.max(1e-9, 1 - inp.pSucc[e]);
        if (v < inp.pTo[e] / Math.max(1e-9, 1 - inp.pSucc[e])) { kind = 'timeout'; fate = 0.6; }
        else if (v < (inp.pTo[e] + inp.pDrop[e]) / Math.max(1e-9, 1 - inp.pSucc[e])) { kind = 'dropped'; fate = 0.9; }
        else kind = 'error';
      }
      keep.push({ id: s.packetSeq++, linkId: id, kind, reverse, progress: 0, fate });
      if (spawnResponse) {
        // response xuất hiện sau `travel` giây (progress âm = chưa hiện)
        keep.push({ id: s.packetSeq++, linkId: id, kind: 'response', reverse: true, progress: -1 });
      }
    }
  }
  // 4. giới hạn ngân sách: bỏ request/response cũ nhất trước, giữ chấm lỗi
  if (keep.length > max) {
    let over = keep.length - max;
    const out: SimPacket[] = [];
    for (const p of keep) {
      if (over > 0 && (p.kind === 'request' || p.kind === 'response' || p.kind === 'retry' || p.kind === 'cache-hit')) { over--; continue; }
      out.push(p);
    }
    while (out.length > max) out.shift();
    s.inflightPackets = out;
  } else {
    s.inflightPackets = keep;
  }
}

/** Các chấm hiển thị được (progress ≥ 0), sao chép để frame không bị biến đổi ở tick sau. */
export function visiblePackets(s: SimState): SimPacket[] {
  const out: SimPacket[] = [];
  for (const p of s.inflightPackets) {
    if (p.progress < 0) continue;
    out.push(p.fate === undefined
      ? { id: p.id, linkId: p.linkId, kind: p.kind, reverse: p.reverse, progress: p.progress }
      : { id: p.id, linkId: p.linkId, kind: p.kind, reverse: p.reverse, progress: p.progress, fate: p.fate });
  }
  return out;
}

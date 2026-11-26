/** Cache và CDN (04 §2.7): hit ratio, warm-up, cohort expiry, singleflight. */
import { DT } from './model';
import type { NodeRuntime } from './types';

export interface CacheParams {
  ttlSec: number;
  ttlJitterPct: number;
  hitRatioMax: number;
  workingSetKeys: number;
  capacityKeys: number;
  warmupSec: number;
  singleflight: boolean;
}

/** h_target = hitRatioMax · coverage · ttlFactor. */
export function hitTarget(p: Pick<CacheParams, 'ttlSec' | 'hitRatioMax' | 'workingSetKeys' | 'capacityKeys'>): number {
  const coverage = Math.pow(Math.min(1, p.capacityKeys / Math.max(1, p.workingSetKeys)), 0.5);
  const ttlFactor = 1 - Math.exp(-p.ttlSec / 30);
  return Math.min(1, Math.max(0, p.hitRatioMax * coverage * ttlFactor));
}

/** Hit ratio hiệu lực = h_target · cacheWarm. */
export function effectiveHit(target: number, warm: number): number {
  return target * Math.min(1, Math.max(0, warm));
}

/** Trần lưu lượng miss chuyển xuống origin khi bật singleflight (rps). */
export function singleflightCap(workingSetKeys: number, warm: number, warmupSec: number): number {
  return (workingSetKeys * Math.max(0, 1 - warm)) / Math.max(1e-6, warmupSec);
}

/**
 * Cập nhật warm-up và cohort expiry sau 1 tick (bước 6). Chỉ khi node đang chạy (`alive`).
 */
export function stepCacheState(rt: NodeRuntime, p: CacheParams, k: number, alive: boolean): void {
  if (!alive) return;
  // warm-up hằng số thời gian warmupSec
  rt.cacheWarm += (1 - rt.cacheWarm) * (DT / Math.max(DT, p.warmupSec));
  if (rt.cacheWarm > 1) rt.cacheWarm = 1;
  // đặt lịch hết hạn khi lần đầu đủ ấm
  if (rt.cacheNextExpiryTick === undefined && rt.cacheWarm >= 0.9) {
    rt.cacheNextExpiryTick = k + Math.round(p.ttlSec / DT);
    rt.cacheCohort = Math.max(0, 1 - p.ttlJitterPct / 0.2);
  }
  if (rt.cacheNextExpiryTick !== undefined && k >= rt.cacheNextExpiryTick) {
    rt.cacheWarm *= 1 - 0.9 * rt.cacheCohort;
    rt.cacheNextExpiryTick = k + Math.round(p.ttlSec / DT);
    rt.cacheCohort = Math.max(0, 1 - p.ttlJitterPct / 0.2);
  }
}

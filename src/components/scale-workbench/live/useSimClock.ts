import { useCallback, useEffect, useRef } from 'react';
import { crossedPauseMark, SIM_DT, stepAccumulator } from './simClockMath';

/** Phần tối thiểu của LiveSimSession mà đồng hồ cần (không import feature). */
export interface SimClockSession {
  readonly durationSec: number;
  advanceTo(tSec: number): number;
  getT(): number;
  seek(tSec: number): void;
}

export interface SimClockOptions {
  session: SimClockSession | null;
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  /** mặc định 8 tick/khung */
  maxCatchupTicks?: number;
  /** t >= durationSec */
  onEnd?: () => void;
  /** pauseAtSec: vượt mốc lần đầu ⇒ gọi onPause (Layout setIsPlaying(false)) */
  pauseAtSec?: readonly number[];
  onPause?: (t: number) => void;
}

export interface SimClockControls {
  seek(t: number): void;
  /** +1 tick (khi tạm dừng) */
  step(): void;
}

/**
 * Đồng hồ fixed-step: chạy trong rAF, không setState. Chỉ tiến session khi isPlaying.
 * Tab ẩn: rAF dừng ⇒ đồng hồ dừng; khi quay lại dt thực bị chặn ở 0,1 s ⇒ không nhảy/bù.
 */
export function useSimClock(opts: SimClockOptions): SimClockControls {
  const { session, isPlaying, speed, maxCatchupTicks = 8 } = opts;
  const cbRef = useRef(opts);
  cbRef.current = opts;
  const accRef = useRef(0);
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    accRef.current = 0;
    firedRef.current = new Set();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dtReal = (now - last) / 1000;
      last = now;
      if (isPlaying) {
        const r = stepAccumulator(accRef.current, dtReal, speed, SIM_DT, maxCatchupTicks);
        accRef.current = r.acc;
        for (let i = 0; i < r.ticks; i++) {
          const t = session.getT();
          if (t >= session.durationSec) {
            cbRef.current.onEnd?.();
            accRef.current = 0;
            break;
          }
          session.advanceTo(t + SIM_DT);
          const hit = crossedPauseMark(cbRef.current.pauseAtSec, t, t + SIM_DT, firedRef.current);
          if (hit !== null) {
            firedRef.current.add(hit);
            accRef.current = 0;
            cbRef.current.onPause?.(hit);
            break;
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [session, isPlaying, speed, maxCatchupTicks]);

  const seek = useCallback(
    (t: number) => {
      if (!session) return;
      session.seek(t);
      accRef.current = 0;
      // seek lùi qua mốc đã bắn ⇒ cho phép bắn lại
      for (const m of [...firedRef.current]) if (m > t) firedRef.current.delete(m);
    },
    [session],
  );
  const step = useCallback(() => {
    if (!session) return;
    const t = session.getT();
    if (t < session.durationSec) session.advanceTo(t + SIM_DT);
  }, [session]);

  return { seek, step };
}

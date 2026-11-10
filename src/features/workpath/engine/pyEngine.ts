import { useEffect, useState } from 'react';
import type { GradeResult, RunResult } from '../types';

/**
 * Lớp điều khiển Web Worker chạy Pyodide.
 * - Mỗi lệnh chạy/chấm có timeout; hết giờ thì tắt hẳn worker (code lặp vô hạn không làm đơ giao diện)
 *   và lần gọi sau tự tạo worker mới.
 * - Khi Pyodide tự sập (ví dụ đệ quy quá sâu làm tràn ngăn xếp WebAssembly) cũng xử lý giống vậy.
 */

const BASE = import.meta.env.BASE_URL || '/';
const RUN_TIMEOUT_MS = 10_000;
const INIT_TIMEOUT_MS = 120_000;

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> };

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();
let status = '';
let ready = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function killWorker(reason: string): void {
  worker?.terminate();
  worker = null;
  ready = false;
  status = '';
  for (const [id, p] of pending) {
    clearTimeout(p.timer);
    p.reject(new Error(reason));
    pending.delete(id);
  }
  emit();
}

function spawn(): Worker {
  const w = new Worker(`${BASE}py-worker.js`);
  w.onmessage = (ev: MessageEvent) => {
    const m = ev.data;
    if (m.type === 'status') {
      status = m.text;
      if (m.text.startsWith('Python đã sẵn sàng')) ready = true;
      emit();
      return;
    }
    const p = pending.get(m.id);
    if (!p) return;
    clearTimeout(p.timer);
    pending.delete(m.id);
    if (m.ok) p.resolve(m.result);
    else p.reject(new Error(m.error));
  };
  w.onerror = () => killWorker('Python bị lỗi nghiêm trọng (có thể do đệ quy quá sâu). Hãy thử lại.');
  return w;
}

export class PyTimeoutError extends Error {}

function call<T>(msg: Record<string, unknown>, timeoutMs: number): Promise<T> {
  worker ??= spawn();
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);                       // tránh killWorker reject nhầm lỗi chung cho lệnh này
      killWorker('Python đã bị dừng.');
      reject(new PyTimeoutError('timeout'));
    }, timeoutMs);
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
    worker!.postMessage({ id, base: BASE, ...msg });
  });
}

/** Nạp Python sẵn (gọi khi người học mở trang bài tập để lúc bấm Chấm không phải chờ) */
export function warmUp(): Promise<void> {
  if (ready) return Promise.resolve();
  return call<null>({ cmd: 'init' }, INIT_TIMEOUT_MS).then(() => undefined, () => undefined);
}

async function whenReady(): Promise<void> {
  if (!ready) await call<null>({ cmd: 'init' }, INIT_TIMEOUT_MS);
}

export async function runCode(code: string, stdin = ''): Promise<RunResult> {
  try {
    await whenReady();
    return await call<RunResult>({ cmd: 'run', code, stdin }, RUN_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof PyTimeoutError) {
      return { stdout: '', stderr: '', exitCode: -1, ms: RUN_TIMEOUT_MS, timedOut: true };
    }
    throw e;
  }
}

export async function gradeCode(solution: string, tests: string): Promise<GradeResult> {
  try {
    await whenReady();
    return await call<GradeResult>({ cmd: 'grade', solution, tests }, RUN_TIMEOUT_MS);
  } catch (e) {
    if (e instanceof PyTimeoutError) {
      return { import_error: null, tests: [], timedOut: true };
    }
    throw e;
  }
}

/** Trạng thái nạp Python để hiển thị cho người học */
export function usePyStatus(): { ready: boolean; text: string } {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { ready, text: status };
}

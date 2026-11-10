import { useEffect, useState } from 'react';
import type { WpCatalog, WpCurriculum } from './types';

/**
 * Dữ liệu được nạp theo yêu cầu (lazy) để không làm nặng bundle chính:
 * curriculum ≈ 570 KB, catalog ≈ 200 KB, readings (mã nguồn) ≈ 880 KB.
 */
let curriculumPromise: Promise<WpCurriculum> | null = null;
let catalogPromise: Promise<WpCatalog> | null = null;
let readingsPromise: Promise<Record<string, string>> | null = null;

/** Dữ liệu đã nạp xong được giữ ở đây để mọi component nhận NGAY (không phải render lại với null) */
const cache: { curriculum?: WpCurriculum; catalog?: WpCatalog; readings?: Record<string, string> } = {};

export function loadCurriculum(): Promise<WpCurriculum> {
  curriculumPromise ??= import('@/data/workpath/curriculum.json').then((m) => (cache.curriculum = m.default as WpCurriculum));
  return curriculumPromise;
}

export function loadCatalog(): Promise<WpCatalog> {
  catalogPromise ??= import('@/data/workpath/catalog.json').then((m) => (cache.catalog = m.default as WpCatalog));
  return catalogPromise;
}

export function loadReadings(): Promise<Record<string, string>> {
  readingsPromise ??= import('@/data/workpath/readings.json').then((m) => (cache.readings = m.default as Record<string, string>));
  return readingsPromise;
}

function useAsync<T>(key: keyof typeof cache, load: () => Promise<T>): { data: T | null; error: string | null } {
  const [state, setState] = useState<{ data: T | null; error: string | null }>(() => ({ data: (cache[key] as T | undefined) ?? null, error: null }));
  useEffect(() => {
    if (state.data) return;
    let alive = true;
    load().then(
      (data) => alive && setState({ data, error: null }),
      (e: unknown) => alive && setState({ data: null, error: String(e) })
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

export const useCurriculum = () => useAsync('curriculum', loadCurriculum);
export const useCatalog = () => useAsync('catalog', loadCatalog);
export const useReadings = () => useAsync('readings', loadReadings);

import { useEffect, useState } from 'react';
import type { SdCurriculum } from './types';

interface SdDataCache {
  curriculum?: SdCurriculum;
}

const cache: SdDataCache = {};
const promises: { [K in keyof SdDataCache]?: Promise<NonNullable<SdDataCache[K]>> } = {};

export function loadSdCurriculum(): Promise<SdCurriculum> {
  if (!promises.curriculum) {
    promises.curriculum = import('@/data/courses/sysdesign/curriculum.json').then(
      (m) => (cache.curriculum = m.default as unknown as SdCurriculum)
    );
  }
  return promises.curriculum;
}

function useSdAsync<K extends keyof SdDataCache>(
  key: K,
  loader: () => Promise<NonNullable<SdDataCache[K]>>
): { data: NonNullable<SdDataCache[K]> | null; error: string | null } {
  const [state, setState] = useState<{
    data: NonNullable<SdDataCache[K]> | null;
    error: string | null;
  }>(() => ({
    data: (cache[key] as NonNullable<SdDataCache[K]> | undefined) ?? null,
    error: null,
  }));

  useEffect(() => {
    const hit = cache[key] as NonNullable<SdDataCache[K]> | undefined;
    if (hit) {
      setState({ data: hit, error: null });
      return;
    }
    let alive = true;
    loader().then(
      (data) => alive && setState({ data, error: null }),
      (err: unknown) => alive && setState({ data: null, error: String(err) })
    );
    return () => {
      alive = false;
    };
  }, [key, loader]);

  return state;
}

export const useSdCurriculum = () => useSdAsync('curriculum', loadSdCurriculum);

// TODO(T2.x/T4.x): `loadSdSims()` cho '@/data/courses/sysdesign/sims.json' khi engine cần.

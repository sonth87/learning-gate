import { useEffect, useState } from 'react';
import type { SdCurriculum } from './types';
import type { SdSimsMap } from './scale/sdLessonBuilder';

interface SdDataCache {
  curriculum?: SdCurriculum;
  sims?: SdSimsMap;
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

export function loadSdSims(): Promise<SdSimsMap> {
  if (!promises.sims) {
    promises.sims = import('@/data/courses/sysdesign/sims.json').then(
      (m) => (cache.sims = (m.default as unknown as { sims: SdSimsMap }).sims)
    );
  }
  return promises.sims;
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
export const useSdSims = () => useSdAsync('sims', loadSdSims);

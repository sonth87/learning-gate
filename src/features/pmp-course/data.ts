import { useEffect, useState } from 'react';
import type {
  PmpComparisonTable,
  PmpCurriculum,
  PmpDecisionTreeData,
  PmpMindmapLink,
  PmpMindsetCanvasData,
} from './types';

interface PmpDataCache {
  curriculum?: PmpCurriculum;
  links?: Record<string, PmpMindmapLink>;
  canvas?: PmpMindsetCanvasData;
  decisionTree?: PmpDecisionTreeData;
  comparisons?: PmpComparisonTable[];
}

const cache: PmpDataCache = {};
const promises: {
  [K in keyof PmpDataCache]?: Promise<NonNullable<PmpDataCache[K]>>;
} = {};

export function loadPmpCurriculum(): Promise<PmpCurriculum> {
  if (!promises.curriculum) {
    promises.curriculum = import('@/data/courses/pmp/curriculum.json').then(
      (m) => (cache.curriculum = m.default as unknown as PmpCurriculum)
    );
  }
  return promises.curriculum;
}

export function loadPmpLinks(): Promise<Record<string, PmpMindmapLink>> {
  if (!promises.links) {
    promises.links = import('@/data/courses/pmp/links.json').then(
      (m) => (cache.links = m.default as unknown as Record<string, PmpMindmapLink>)
    );
  }
  return promises.links;
}

export function loadPmpCanvas(): Promise<PmpMindsetCanvasData> {
  if (!promises.canvas) {
    promises.canvas = import('@/data/courses/pmp/canvas.json').then(
      (m) => (cache.canvas = m.default as unknown as PmpMindsetCanvasData)
    );
  }
  return promises.canvas;
}

export function loadPmpDecisionTree(): Promise<PmpDecisionTreeData> {
  if (!promises.decisionTree) {
    promises.decisionTree = import('@/data/courses/pmp/decision-tree.json').then(
      (m) => (cache.decisionTree = m.default as unknown as PmpDecisionTreeData)
    );
  }
  return promises.decisionTree;
}

export function loadPmpComparisons(): Promise<PmpComparisonTable[]> {
  if (!promises.comparisons) {
    promises.comparisons = import('@/data/courses/pmp/comparisons.json').then(
      (m) => (cache.comparisons = m.default as unknown as PmpComparisonTable[])
    );
  }
  return promises.comparisons;
}

function usePmpAsync<K extends keyof PmpDataCache>(
  key: K,
  loader: () => Promise<NonNullable<PmpDataCache[K]>>
): { data: NonNullable<PmpDataCache[K]> | null; error: string | null } {
  const [state, setState] = useState<{
    data: NonNullable<PmpDataCache[K]> | null;
    error: string | null;
  }>(() => ({
    data: (cache[key] as NonNullable<PmpDataCache[K]> | undefined) ?? null,
    error: null,
  }));

  useEffect(() => {
    const hit = cache[key] as NonNullable<PmpDataCache[K]> | undefined;
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

export const usePmpCurriculum = () => usePmpAsync('curriculum', loadPmpCurriculum);
export const usePmpLinks = () => usePmpAsync('links', loadPmpLinks);
export const usePmpCanvas = () => usePmpAsync('canvas', loadPmpCanvas);
export const usePmpDecisionTree = () => usePmpAsync('decisionTree', loadPmpDecisionTree);
export const usePmpComparisons = () => usePmpAsync('comparisons', loadPmpComparisons);

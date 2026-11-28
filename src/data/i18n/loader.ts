import { useEffect, useState } from 'react';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import type { CourseEnOverlay, CourseI18nId } from './types';

const cache: Partial<Record<CourseI18nId, CourseEnOverlay>> = {};
const promises: Partial<Record<CourseI18nId, Promise<CourseEnOverlay>>> = {};

export function loadCourseEnOverlay(courseId: CourseI18nId): Promise<CourseEnOverlay> {
  if (!promises[courseId]) {
    const loader =
      courseId === 'python'
        ? import('./python.en.json')
        : courseId === 'kube'
          ? import('./kube.en.json')
          : courseId === 'cicd'
            ? import('./cicd.en.json')
            : courseId === 'redis'
              ? import('./redis.en.json')
              : courseId === 'pmp'
                ? import('./pmp.en.json')
                : import('./sysdesign.en.json');
    promises[courseId] = loader.then(
      (m) => (cache[courseId] = m.default as unknown as CourseEnOverlay)
    );
  }
  return promises[courseId]!;
}

export function getCachedCourseEnOverlay(courseId: CourseI18nId): CourseEnOverlay | null {
  return cache[courseId] ?? null;
}

export function useCourseEnOverlay(courseId: CourseI18nId): CourseEnOverlay | null {
  const lang = useWorkbenchStore((s) => s.language);
  const [data, setData] = useState<CourseEnOverlay | null>(() =>
    lang === 'en' ? (cache[courseId] ?? null) : null
  );

  useEffect(() => {
    if (lang !== 'en') return;
    const hit = cache[courseId];
    if (hit) {
      setData(hit);
      return;
    }
    let alive = true;
    loadCourseEnOverlay(courseId).then(
      (overlay) => {
        if (alive) setData(overlay);
      },
      () => {
        // Ignore missing/corrupt overlay gracefully and fall back to source text
      }
    );
    return () => {
      alive = false;
    };
  }, [courseId, lang]);

  return lang === 'en' ? data : null;
}

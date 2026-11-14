import { useEffect, useState } from 'react';
import type { DevOpsCatalog, DevOpsCourseId, DevOpsCurriculum } from './types';

interface CourseCache {
  curriculum?: DevOpsCurriculum;
  catalog?: DevOpsCatalog;
  readings?: Record<string, string>;
}

const promises: Record<
  DevOpsCourseId,
  {
    curriculum?: Promise<DevOpsCurriculum>;
    catalog?: Promise<DevOpsCatalog>;
    readings?: Promise<Record<string, string>>;
  }
> = {
  kube: {},
  cicd: {},
  redis: {},
};

const cache: Record<DevOpsCourseId, CourseCache> = {
  kube: {},
  cicd: {},
  redis: {},
};

export function loadCourseCurriculum(courseId: DevOpsCourseId): Promise<DevOpsCurriculum> {
  if (!promises[courseId].curriculum) {
    promises[courseId].curriculum = (
      courseId === 'kube'
        ? import('@/data/courses/kube/curriculum.json')
        : courseId === 'cicd'
          ? import('@/data/courses/cicd/curriculum.json')
          : import('@/data/courses/redis/curriculum.json')
    ).then((m) => (cache[courseId].curriculum = m.default as unknown as DevOpsCurriculum));
  }
  return promises[courseId].curriculum!;
}

export function loadCourseCatalog(courseId: DevOpsCourseId): Promise<DevOpsCatalog> {
  if (!promises[courseId].catalog) {
    promises[courseId].catalog = (
      courseId === 'kube'
        ? import('@/data/courses/kube/catalog.json')
        : courseId === 'cicd'
          ? import('@/data/courses/cicd/catalog.json')
          : import('@/data/courses/redis/catalog.json')
    ).then((m) => (cache[courseId].catalog = m.default as unknown as DevOpsCatalog));
  }
  return promises[courseId].catalog!;
}

export function loadCourseReadings(courseId: DevOpsCourseId): Promise<Record<string, string>> {
  if (!promises[courseId].readings) {
    promises[courseId].readings = (
      courseId === 'kube'
        ? import('@/data/courses/kube/readings.json')
        : courseId === 'cicd'
          ? import('@/data/courses/cicd/readings.json')
          : import('@/data/courses/redis/readings.json')
    ).then((m) => (cache[courseId].readings = m.default as unknown as Record<string, string>));
  }
  return promises[courseId].readings!;
}

function useCourseAsync<K extends keyof CourseCache>(
  courseId: DevOpsCourseId,
  key: K,
  load: (id: DevOpsCourseId) => Promise<NonNullable<CourseCache[K]>>
): { data: NonNullable<CourseCache[K]> | null; error: string | null } {
  const [state, setState] = useState<{ data: NonNullable<CourseCache[K]> | null; error: string | null }>(() => ({
    data: (cache[courseId][key] as NonNullable<CourseCache[K]> | undefined) ?? null,
    error: null,
  }));

  useEffect(() => {
    const cached = cache[courseId][key] as NonNullable<CourseCache[K]> | undefined;
    if (cached) {
      setState({ data: cached, error: null });
      return;
    }
    let alive = true;
    load(courseId).then(
      (data) => alive && setState({ data, error: null }),
      (e: unknown) => alive && setState({ data: null, error: String(e) })
    );
    return () => {
      alive = false;
    };
  }, [courseId, key, load]);

  return state;
}

export const useCourseCurriculum = (courseId: DevOpsCourseId) =>
  useCourseAsync(courseId, 'curriculum', loadCourseCurriculum);

export const useCourseCatalog = (courseId: DevOpsCourseId) =>
  useCourseAsync(courseId, 'catalog', loadCourseCatalog);

export const useCourseReadings = (courseId: DevOpsCourseId) =>
  useCourseAsync(courseId, 'readings', loadCourseReadings);

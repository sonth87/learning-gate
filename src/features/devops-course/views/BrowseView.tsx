import React, { useMemo, useState } from 'react';
import { useCourseCatalog, useCourseCurriculum } from '../data';
import {
  CATALOG_STATUS_LABEL,
  DEVOPS_KIND_LABEL,
  catalogStatus,
  courseCurrentLevel,
  filterCourseCatalog,
  type BrowseFilter,
} from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import { useCourseEnOverlay } from '@/data/i18n/loader';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import type { CatalogStatus } from '@/features/workpath/types';
import { PageHeader, Pill, Spinner, Stars } from '@/features/workpath/components/ui';
import { cn } from '@/utils/cn';

const PAGE = 50;
type Preset = 'forme' | 'all' | 'curated' | 'security' | undefined;

const initial = (preset: Preset): BrowseFilter => ({
  q: '',
  category: preset === 'security' ? 'security' : '',
  maxLevel: null,
  status: '',
  minStars: 0,
  forMe: preset === 'forme' || preset === undefined,
  curated: preset === 'curated',
});

const selectCls =
  'min-h-[44px] sm:min-h-[34px] rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-sky-500/70';

const STATUS_LABEL_EN: Record<CatalogStatus, string> = {
  todo: 'To Do',
  reading: 'Reading',
  done: 'Read',
  rewritten: 'Rewritten',
  skip: 'Skipped',
};

const KIND_LABEL_EN: Record<string, string> = {
  good: 'SAMPLE',
  bug: 'FIND BUG',
  compare: 'COMPARE',
  outdated: 'OUTDATED',
  project: 'FULL FLOW',
  security: 'SECURITY',
};

export const BrowseView: React.FC<{ preset?: Preset }> = ({ preset }) => {
  const meta = useCourseMeta();
  const { courseId } = meta;
  const lang = useWorkbenchStore((s) => s.language);
  const enOverlay = useCourseEnOverlay(courseId);
  void enOverlay;
  const { data: cat } = useCourseCatalog(courseId);
  const { data: cur } = useCourseCurriculum(courseId);
  const s = COURSE_PROGRESS_STORES[courseId]((x) => x.state);
  const go = COURSE_NAV_STORES[courseId]((x) => x.go);
  const [f, setF] = useState<BrowseFilter>(() => initial(preset));
  const [limit, setLimit] = useState(PAGE);

  const myLevel = cur ? courseCurrentLevel(s, cur) : 0;
  const items = useMemo(() => (cat ? filterCourseCatalog(s, cat.items, f, myLevel) : []), [cat, s, f, myLevel]);
  const set = <K extends keyof BrowseFilter>(k: K, v: BrowseFilter[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setLimit(PAGE);
  };

  if (!cat) return <Spinner />;
  const maxLv = cur ? Math.max(...cur.modules.map((m) => m.level), 5) : 6;

  const readingsTitleEn: Record<typeof courseId, string> = {
    kube: 'Read Real Configs: Dockerfile, Compose & K8s Manifests',
    cicd: 'Read Real Configs: GitHub Actions, GitLab CI & GitOps',
    redis: 'Read Real Configs: redis.conf, Lua Scripts, Streams & Cluster',
  };
  const readingsSubtitleEn: Record<typeof courseId, string> = {
    kube: 'Curated real-world configurations (reference samples, buggy configs, comparisons, deprecated APIs & security flaws) with analysis tasks.',
    cicd: 'Real-world CI/CD pipeline workflows and configs (best practices, race condition prevention, security & modern syntax) with analysis questions.',
    redis: 'Production configs, atomic Lua scripts, Docker/K8s StatefulSets, and real incident traps (Stampede, Bigkey, OOM, Split-Brain).',
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title={lang === 'en' ? readingsTitleEn[courseId] : meta.readingsTitle}
        sub={lang === 'en' ? readingsSubtitleEn[courseId] : meta.readingsSubtitle}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={f.q}
          onChange={(e) => set('q', e.target.value)}
          placeholder={lang === 'en' ? 'Search by path / topic…' : 'Tìm theo đường dẫn / chủ đề…'}
          className={cn(selectCls, 'w-52')}
          aria-label={lang === 'en' ? 'Search by filename' : 'Tìm theo tên file'}
        />
        <select
          value={f.category}
          onChange={(e) => set('category', e.target.value)}
          className={selectCls}
          aria-label={lang === 'en' ? 'Config category' : 'Nhóm cấu hình'}
        >
          <option value="">{lang === 'en' ? 'All categories' : 'Mọi nhóm'}</option>
          {Object.entries(cat.categories).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={f.maxLevel ?? ''}
          onChange={(e) => set('maxLevel', e.target.value !== '' ? Number(e.target.value) : null)}
          className={selectCls}
          aria-label={lang === 'en' ? 'Max level' : 'Cấp tối đa'}
        >
          <option value="">{lang === 'en' ? 'All levels' : 'Mọi cấp'}</option>
          {Array.from({ length: maxLv + 1 }, (_, n) => (
            <option key={n} value={n}>
              {lang === 'en' ? `Level ≤ ${n}` : `Cấp ≤ ${n}`}
            </option>
          ))}
        </select>
        <select
          value={f.status}
          onChange={(e) => set('status', e.target.value as CatalogStatus | '')}
          className={selectCls}
          aria-label={lang === 'en' ? 'Reading status' : 'Trạng thái đọc'}
        >
          <option value="">{lang === 'en' ? 'All statuses' : 'Mọi trạng thái'}</option>
          {(Object.keys(CATALOG_STATUS_LABEL) as CatalogStatus[]).map((k) => (
            <option key={k} value={k}>
              {lang === 'en' ? STATUS_LABEL_EN[k] : CATALOG_STATUS_LABEL[k]}
            </option>
          ))}
        </select>
        <label className="flex min-h-[44px] sm:min-h-[34px] items-center gap-1.5 px-1 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={f.forMe}
            onChange={(e) => set('forMe', e.target.checked)}
            className="accent-sky-500"
          />{' '}
          {lang === 'en' ? 'matches my level' : 'hợp cấp của tôi'}
        </label>
        <label className="flex min-h-[44px] sm:min-h-[34px] items-center gap-1.5 px-1 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={f.curated}
            onChange={(e) => set('curated', e.target.checked)}
            className="accent-sky-500"
          />{' '}
          {lang === 'en' ? 'linked to module ✅' : 'gắn vào module ✅'}
        </label>
      </div>

      <p className="mb-2 text-xs text-slate-500">
        {lang === 'en'
          ? `${items.length}/${cat.items.length} config files match the filter (if you don't see enough, uncheck "matches my level").`
          : `${items.length}/${cat.items.length} file cấu hình khớp bộ lọc (nếu chưa thấy đủ, bỏ dấu tích "hợp cấp của tôi").`}
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">{lang === 'en' ? 'Config' : 'Cấu hình'}</th>
              <th className="hidden px-3 py-2.5 sm:table-cell">{lang === 'en' ? 'Type' : 'Loại'}</th>
              <th className="hidden px-3 py-2.5 sm:table-cell">{lang === 'en' ? 'Level' : 'Cấp'}</th>
              <th className="hidden px-3 py-2.5 sm:table-cell">{lang === 'en' ? 'Rating' : 'Đánh giá'}</th>
              <th className="hidden px-3 py-2.5 md:table-cell">{lang === 'en' ? 'Lines' : 'Dòng'}</th>
              <th className="px-3 py-2.5">{lang === 'en' ? 'Status' : 'Trạng thái'}</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, limit).map((it) => {
              const st = catalogStatus(s, it.id);
              const primaryKind = it.curated[0]?.kind ?? 'good';
              const badge = DEVOPS_KIND_LABEL[primaryKind] ?? DEVOPS_KIND_LABEL.good;
              return (
                <tr
                  key={it.n}
                  onClick={() => go({ name: 'read', n: it.n })}
                  className="cursor-pointer border-t border-slate-800/70 hover:bg-slate-800/50"
                >
                  <td className="px-3 py-2.5 text-slate-500">{it.n}</td>
                  <td className="px-3 py-2.5 text-slate-100">
                    <span className="break-all font-mono text-[13px]">{it.path}</span>
                    {it.topic && <div className="text-xs text-slate-400">{it.topic}</div>}
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                      {lang === 'en' ? (KIND_LABEL_EN[primaryKind] ?? badge.label) : badge.label}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">{it.level}</td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <Stars n={it.quality} />
                  </td>
                  <td className="hidden px-3 py-2.5 md:table-cell">{it.loc}</td>
                  <td className="px-3 py-2.5">
                    {st !== 'todo' && <Pill>{lang === 'en' ? STATUS_LABEL_EN[st] : CATALOG_STATUS_LABEL[st]}</Pill>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="p-6 text-center text-slate-500">
            {lang === 'en'
              ? 'No configs match the filter. Try unchecking "matches my level" to view the entire config library.'
              : 'Không có cấu hình nào khớp bộ lọc. Hãy thử bỏ chọn "hợp cấp của tôi" để xem toàn bộ kho cấu hình.'}
          </p>
        )}
      </div>

      {items.length > limit && (
        <button
          type="button"
          onClick={() => setLimit(limit + PAGE)}
          className="mt-3 min-h-[44px] rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 cursor-pointer"
        >
          {lang === 'en' ? `Show more (${items.length - limit} more files)` : `Hiện thêm (${items.length - limit} file nữa)`}
        </button>
      )}
    </div>
  );
};

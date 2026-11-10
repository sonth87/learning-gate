import React, { useMemo, useState } from 'react';
import { useCatalog, useCurriculum } from '../data';
import { CATALOG_STATUS_LABEL, catalogStatus, currentLevel, filterCatalog, type BrowseFilter } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import type { CatalogStatus } from '../types';
import { Callout, PageHeader, Pill, Spinner, Stars } from '../components/ui';
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

const selectCls = 'rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-emerald-500/70';

export const BrowseView: React.FC<{ preset?: Preset }> = ({ preset }) => {
  const { data: cat } = useCatalog();
  const { data: cur } = useCurriculum();
  const s = useWpProgress((x) => x.state);
  const go = useWpNav((x) => x.go);
  const [f, setF] = useState<BrowseFilter>(() => initial(preset));
  const [limit, setLimit] = useState(PAGE);

  const myLevel = cur ? currentLevel(s, cur) : 1;
  const items = useMemo(() => (cat ? filterCatalog(s, cat.items, f, myLevel) : []), [cat, s, f, myLevel]);
  const set = <K extends keyof BrowseFilter>(k: K, v: BrowseFilter[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setLimit(PAGE);
  };

  if (!cat) return <Spinner />;
  const topics: Record<string, number> = {};
  for (const i of cat.items) if (i.topic) topics[i.topic] = (topics[i.topic] ?? 0) + 1;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Đọc code thật: kho Python-master"
        sub={`${cat.items.length} bài của repo geekcomputers/Python, đã phân nhóm, chấm chất lượng và gắn cờ cảnh báo. Bạn đang ở cấp ${myLevel}: mặc định chỉ hiện bài hợp với cấp của bạn.`}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={f.q} onChange={(e) => set('q', e.target.value)} placeholder="Tìm theo tên file…" className={cn(selectCls, 'w-48')} aria-label="Tìm theo tên file" />
        <select value={f.category} onChange={(e) => set('category', e.target.value)} className={selectCls} aria-label="Nhóm">
          <option value="">Mọi nhóm</option>
          {Object.entries(cat.categories).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={f.maxLevel ?? ''} onChange={(e) => set('maxLevel', e.target.value ? Number(e.target.value) : null)} className={selectCls} aria-label="Cấp tối đa">
          <option value="">Mọi cấp</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              Cấp ≤ {n}
            </option>
          ))}
        </select>
        <select value={f.status} onChange={(e) => set('status', e.target.value as CatalogStatus | '')} className={selectCls} aria-label="Trạng thái">
          <option value="">Mọi trạng thái</option>
          {(Object.keys(CATALOG_STATUS_LABEL) as CatalogStatus[]).map((k) => (
            <option key={k} value={k}>
              {CATALOG_STATUS_LABEL[k]}
            </option>
          ))}
        </select>
        <select value={f.minStars} onChange={(e) => set('minStars', Number(e.target.value))} className={selectCls} aria-label="Chất lượng tối thiểu">
          <option value={0}>Mọi chất lượng</option>
          {[3, 4, 5].map((n) => (
            <option key={n} value={n}>
              ≥ {n} ★
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-slate-300">
          <input type="checkbox" checked={f.forMe} onChange={(e) => set('forMe', e.target.checked)} className="accent-emerald-500" /> hợp cấp của tôi
        </label>
        <label className="flex items-center gap-1.5 text-sm text-slate-300">
          <input type="checkbox" checked={f.curated} onChange={(e) => set('curated', e.target.checked)} className="accent-emerald-500" /> tuyển chọn ✅
        </label>
      </div>

      <p className="mb-2 text-xs text-slate-500">
        {items.length} bài khớp bộ lọc · chủ đề nhiều biến thể (để so sánh cách làm):{' '}
        {Object.entries(topics)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([k, v]) => `${k}(${v})`)
          .join(', ')}
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Bài</th>
              <th className="px-3 py-2">Cấp</th>
              <th className="hidden px-3 py-2 sm:table-cell">Chất lượng</th>
              <th className="hidden px-3 py-2 md:table-cell">Dòng</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="hidden px-3 py-2 lg:table-cell">Lưu ý</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, limit).map((it) => {
              const st = catalogStatus(s, it.id);
              return (
                <tr key={it.n} onClick={() => go({ name: 'read', n: it.n })} className="cursor-pointer border-t border-slate-800/70 hover:bg-slate-800/50">
                  <td className="px-3 py-2 text-slate-500">{it.n}</td>
                  <td className="px-3 py-2 text-slate-100">
                    <span className="break-all">{it.path}</span>
                    {it.kind === 'project' && ' 📁'}
                    {it.curated.length > 0 && ' ✅'}
                  </td>
                  <td className="px-3 py-2">{it.level}</td>
                  <td className="hidden px-3 py-2 sm:table-cell">
                    <Stars n={it.quality} />
                  </td>
                  <td className="hidden px-3 py-2 md:table-cell">{it.loc}</td>
                  <td className="px-3 py-2">{st !== 'todo' && <Pill>{CATALOG_STATUS_LABEL[st]}</Pill>}</td>
                  <td className="hidden px-3 py-2 text-xs text-slate-500 lg:table-cell">{it.flags.map((x) => cat.flagLabels[x] ?? x).join(', ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-center text-slate-500">Không có bài nào khớp. Thử bỏ bớt bộ lọc.</p>}
      </div>
      {items.length > limit && (
        <button onClick={() => setLimit(limit + PAGE)} className="mt-3 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          Hiện thêm ({items.length - limit} bài nữa)
        </button>
      )}
      {preset === 'security' && <Callout tone="bad" className="mt-4">Chỉ đọc và phân tích, không chạy các script này nhắm vào hệ thống không phải của bạn.</Callout>}
    </div>
  );
};

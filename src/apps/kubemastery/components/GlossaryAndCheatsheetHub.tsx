import React, { useState } from 'react';
import {
  BookMarked,
  Search,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Film,
} from 'lucide-react';
import {
  CHEATSHEET_GROUPS,
  GLOSSARY_ANALOGY_ITEMS,
  THREE_DIMENSION_ANALOGY_MATRIX,
} from '../data/glossaryAndCheatsheetData';
import { cn } from '@/utils/cn';

export const GlossaryAndCheatsheetHub: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const categories = [
    'ALL',
    'Core & OCI',
    'Docker',
    'K8s Architecture',
    'K8s Objects',
    'Cloud Native & SRE',
  ];

  const filteredGlossary = GLOSSARY_ANALOGY_ITEMS.filter((item) => {
    const matchesCat =
      selectedCategory === 'ALL' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      item.term.toLowerCase().includes(q) ||
      item.analogyTag.toLowerCase().includes(q) ||
      item.technicalDefinition.toLowerCase().includes(q) ||
      item.vividAnalogy.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 1600);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Banner */}
      <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-sky-500/10 to-slate-900 p-3.5 sm:p-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <BookMarked className="h-4 w-4 shrink-0" />
          <span>
            Từ Điển Thuật Ngữ Liên Tưởng Hóa & Bảng Lệnh Gối Đầu Giường (Phần 3 &
            Phần 6 PDF)
          </span>
        </div>
        <h1 className="font-mono text-base sm:text-2xl font-extrabold text-white">
          Giải Mã Hàng Chục Thuật Ngữ Qua Lăng Kính Thực Tế & Cheatsheet Thực
          Chiến
        </h1>
      </div>

      {/* Section 1: 3-Dimension Analogy Comparison Matrix (Page 2 of PDF) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-3.5 sm:p-6 space-y-4">
        <div className="flex items-start sm:items-center gap-2.5">
          <Film className="h-5 w-5 text-sky-400 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <h2 className="text-sm sm:text-lg font-extrabold text-white">
              Ma Trận Liên Tưởng Đa Chiều: OCI, Image, Docker/Containerd,
              Container & Kubernetes
            </h2>
            <p className="text-xs text-slate-400">
              So sánh trực quan qua 3 hình ảnh quen thuộc: File Giải nén (.zip),
              File Đa phương tiện (.mp4) và Chuỗi Rạp Chiếu Phim (Trang 2 PDF)
            </p>
          </div>
        </div>

        {/* Mobile Card Stack (< md) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {THREE_DIMENSION_ANALOGY_MATRIX.map((row, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-800 bg-slate-950/85 p-3.5 space-y-2 text-xs"
            >
              <div className="font-mono text-sm font-extrabold text-white border-b border-slate-800 pb-1.5">
                {row.techConcept}
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase text-sky-300">
                    📦 File Giải nén (.zip):{' '}
                  </span>
                  <span className="text-slate-200">{row.zipAnalogy}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase text-emerald-300">
                    🎬 Đa phương tiện (.mp4):{' '}
                  </span>
                  <span className="text-slate-200">{row.mediaAnalogy}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase text-amber-300">
                    🍿 Chuỗi Rạp Chiếu Phim:{' '}
                  </span>
                  <span className="text-amber-200 font-medium">
                    {row.cinemaAnalogy}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table (md+) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 uppercase font-mono text-[11px]">
              <tr>
                <th className="p-3.5">Khái niệm Kỹ thuật</th>
                <th className="p-3.5 text-sky-300">Liên tưởng File Giải nén</th>
                <th className="p-3.5 text-emerald-300">
                  Liên tưởng Đa phương tiện
                </th>
                <th className="p-3.5 text-amber-300">
                  Liên tưởng Chuỗi Rạp Chiếu Phim
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {THREE_DIMENSION_ANALOGY_MATRIX.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-mono font-bold text-white">
                    {row.techConcept}
                  </td>
                  <td className="p-3.5 text-slate-200">{row.zipAnalogy}</td>
                  <td className="p-3.5 text-slate-200">{row.mediaAnalogy}</td>
                  <td className="p-3.5 text-amber-200 font-medium">
                    {row.cinemaAnalogy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Interactive Analogy Dictionary */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
            <h2 className="text-sm sm:text-lg font-extrabold text-white">
              Từ Điển Giải Mã Thuật Ngữ Qua Lăng Kính Liên Tưởng Hóa (
              {filteredGlossary.length} thuật ngữ)
            </h2>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm Pod, Ingress, PVC, cgroups, Kubelet..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Category Filter Pills (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer',
                selectedCategory === cat
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
              )}
            >
              {cat === 'ALL' ? 'Tất cả nhóm' : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredGlossary.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/75 p-3.5 sm:p-4 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="font-mono text-sm font-extrabold text-white">
                    {item.term}
                  </span>
                  <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                    {item.analogyTag}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-sky-300">Định nghĩa Kỹ thuật: </strong>
                  {item.technicalDefinition}
                </p>
                <p className="text-xs text-emerald-200 leading-relaxed">
                  <strong className="text-emerald-400">
                    Liên tưởng Thực tế:{' '}
                  </strong>
                  {item.vividAnalogy}
                </p>
              </div>

              <div className="ide-dark-surface flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[11px] text-amber-300">
                <code className="break-all sm:truncate">
                  {item.exampleCommandOrYaml}
                </code>
                <button
                  onClick={() => handleCopy(item.exampleCommandOrYaml)}
                  className="shrink-0 text-slate-400 hover:text-white cursor-pointer"
                  title="Copy lệnh"
                >
                  {copiedCmd === item.exampleCommandOrYaml ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Production Command Cheatsheet (Pages 20-21 PDF) */}
      <section className="space-y-4">
        <div className="flex items-start sm:items-center gap-2">
          <Terminal className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <h2 className="text-sm sm:text-lg font-extrabold text-white">
              Bảng Tổng Hợp Lệnh Thực Chiến "Gối Đầu Giường" (Cheatsheet Trang
              20–21 PDF)
            </h2>
            <p className="text-xs text-slate-400">
              Hệ thống các câu lệnh quan trọng nhất được phân loại theo đúng mục
              đích tra cứu hàng ngày của kỹ sư vận hành Docker & K8s
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {CHEATSHEET_GROUPS.map((grp) => (
            <div
              key={grp.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-5 space-y-3"
            >
              <h3 className="font-mono text-xs sm:text-sm font-extrabold text-sky-300 border-b border-slate-800 pb-2">
                {grp.groupTitle}
              </h3>

              <div className="space-y-2.5">
                {grp.commands.map((c, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950/85 p-3 space-y-1.5"
                  >
                    <div className="ide-dark-surface flex items-start sm:items-center justify-between gap-2 rounded-lg bg-slate-900 px-2.5 py-1.5 font-mono text-xs text-emerald-300">
                      <code className="font-bold break-all">{c.cmd}</code>
                      <button
                        onClick={() => handleCopy(c.cmd)}
                        className="shrink-0 text-slate-400 hover:text-white mt-0.5 sm:mt-0 cursor-pointer"
                      >
                        {copiedCmd === c.cmd ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200">{c.explanation}</p>
                    <div className="text-[11px] text-amber-300/90">
                      🎯 Khi nào dùng: {c.whenToUse}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

import React from 'react';
import {
  Compass,
  Cpu,
  Rocket,
  BookOpen,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';
import {
  CONCURRENCY_MATRIX,
  ECOSYSTEM_MAPPING_TABLE,
  PORTFOLIO_MILESTONES,
} from '@/data/reference/pdfDeepDivesData';
import { LevelBadge } from '@/components/common/LevelBadge';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';
import { CleanArchExplorer } from './CleanArchExplorer';

export const ReferenceHub: React.FC = () => {
  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-slate-900 p-4 sm:p-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Compass className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Cẩm nang Bổ trợ & Tham chiếu Hệ sinh thái (Từ Tài liệu PDF)</span>
        </div>
        <h1 className="font-mono text-lg sm:text-2xl font-extrabold text-white">
          Bản đồ Đối chiếu Hệ sinh thái, Ma trận Xử lý Đồng thời & Clean Architecture
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
          Tổng hợp toàn bộ các bảng đối chiếu công cụ hiện đại (Rust-based Python tooling), ma trận chọn công nghệ Concurrency/Parallelism vượt qua GIL, sơ đồ dự án FastAPI 4 tầng và 8 dự án Portfolio thực chiến kèm phương pháp học 30 – 50 – 20.
        </p>
      </div>

      {/* 1. Interactive Clean Architecture Explorer */}
      <CleanArchExplorer />

      {/* 2. Concurrency & GIL Matrix */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
            <Cpu className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm sm:text-lg font-extrabold text-white">
              Chuyên đề 2 (PDF): Ma trận Chọn Công nghệ Xử lý Đồng thời & Tác động của GIL
            </h2>
            <p className="text-xs text-slate-400">
              Cách chọn đúng công cụ giữa AsyncIO, Threading, Multiprocessing và Celery cho từng loại tải.
            </p>
          </div>
        </div>

        {/* Mobile Card Stack (< md) */}
        <div className="grid gap-3 md:hidden">
          {CONCURRENCY_MATRIX.map((row, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white">{row.workloadType}</span>
                <LevelBadge level={row.recommendedLevel} />
              </div>
              <div className="grid grid-cols-1 gap-1.5 rounded-lg bg-slate-900/80 p-2.5">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">
                    Công cụ Python chuẩn:
                  </span>
                  <span className="font-mono text-sky-300 font-semibold">
                    <RichTextWithTerms text={row.pythonTool} />
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">
                    Tương đương Node.js:
                  </span>
                  <span className="font-mono text-amber-200">
                    {row.nodeJsEquivalent}
                  </span>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-rose-300">Cơ chế GIL: </strong>
                <RichTextWithTerms text={row.gilMechanismAndImpact} />
              </p>
            </div>
          ))}
        </div>

        {/* Desktop Table (md+) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 uppercase text-[11px]">
              <tr>
                <th className="p-3.5">Bài toán thực tế</th>
                <th className="p-3.5">Công cụ Python chuẩn</th>
                <th className="p-3.5">Tương đương ở Node.js</th>
                <th className="p-3.5">Cơ chế & Tác động của GIL</th>
                <th className="p-3.5">Cấp độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {CONCURRENCY_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-semibold text-white">
                    {row.workloadType}
                  </td>
                  <td className="p-3.5 font-mono text-sky-300">
                    <RichTextWithTerms text={row.pythonTool} />
                  </td>
                  <td className="p-3.5 font-mono text-amber-200">
                    {row.nodeJsEquivalent}
                  </td>
                  <td className="p-3.5 text-slate-300 leading-relaxed">
                    <RichTextWithTerms text={row.gilMechanismAndImpact} />
                  </td>
                  <td className="p-3.5">
                    <LevelBadge level={row.recommendedLevel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Ecosystem Mapping Table */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <ArrowRightLeft className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm sm:text-lg font-extrabold text-white">
              Phần 1 (PDF): Bản đồ Đối chiếu Hệ sinh thái JS/TS ↔ Python Hiện đại
            </h2>
            <p className="text-xs text-slate-400">
              Áp dụng ngay bộ công cụ thế hệ mới (nhiều công cụ viết bằng Rust) có tốc độ vượt trội.
            </p>
          </div>
        </div>

        {/* Mobile Card Stack (< md) */}
        <div className="grid gap-3 md:hidden">
          {ECOSYSTEM_MAPPING_TABLE.map((row, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2 text-xs"
            >
              <div className="font-bold text-white">{row.category}</div>
              <div className="grid grid-cols-1 gap-1.5 rounded-lg bg-slate-900/80 p-2.5">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">
                    JS / TS / Node.js:
                  </span>
                  <span className="font-mono text-yellow-200/90">
                    {row.jsTsStack}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">
                    Python Hiện đại (Khuyên dùng):
                  </span>
                  <span className="font-semibold text-sky-300">
                    <RichTextWithTerms text={row.modernPythonStack} />
                  </span>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {row.whyRecommended}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop Table (md+) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 uppercase text-[11px]">
              <tr>
                <th className="p-3.5">Hạng mục</th>
                <th className="p-3.5">Hệ sinh thái JS / TS / Node.js</th>
                <th className="p-3.5">Tương đương trong Python Hiện đại (Khuyên dùng)</th>
                <th className="p-3.5">Lý do & Ưu điểm vượt trội</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {ECOSYSTEM_MAPPING_TABLE.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-white">{row.category}</td>
                  <td className="p-3.5 font-mono text-yellow-200/90">
                    {row.jsTsStack}
                  </td>
                  <td className="p-3.5 font-semibold text-sky-300">
                    <RichTextWithTerms text={row.modernPythonStack} />
                  </td>
                  <td className="p-3.5 text-slate-300">{row.whyRecommended}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. 8 Portfolio Projects & 30-50-20 Learning Method */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Rocket className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm sm:text-lg font-extrabold text-white">
              Phần 6 (PDF): Ma trận Thứ tự Ưu tiên & Danh mục 8 Dự án Thực hành (Portfolio Milestones)
            </h2>
            <p className="text-xs text-slate-400">
              Khóa chặt kiến thức của mỗi chặng bằng một dự án thực tế theo phương pháp phân bổ 30% Lý thuyết – 50% Code Dự án – 20% Đọc Source/Debug.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PORTFOLIO_MILESTONES.map((proj) => (
            <div
              key={proj.order}
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                    Mức ưu tiên #{proj.order} • {proj.priority}
                  </span>
                  <LevelBadge level={proj.level} />
                </div>
                <h3 className="text-xs font-bold text-white">{proj.title}</h3>
                <p className="text-[11px] font-mono text-sky-300">
                  {proj.coreTopics}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {proj.description}
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-2.5 space-y-1">
                {proj.keyDeliverables.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-[11px] text-emerald-300"
                  >
                    <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 30 - 50 - 20 Strategy Box */}
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-indigo-400 shrink-0" aria-hidden="true" />
            <div>
              <strong className="text-white block">
                Chiến lược học tập 30 – 50 – 20 & Nguồn tài liệu chuẩn:
              </strong>
              <span className="text-slate-300">
                30% Đọc khái niệm & đối chiếu tư duy • 50% Gõ code bài tập & xây dựng 8 dự án • 20% Đọc mã nguồn FastAPI/Pydantic & chạy Debugger.
              </span>
            </div>
          </div>
          <div className="text-[11px] text-indigo-200 font-mono">
            Sách gối đầu giường: Python Crash Course (3rd Ed) & Fluent Python (2nd Ed)
          </div>
        </div>
      </section>
    </div>
  );
};

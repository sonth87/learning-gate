import React, { useState, useMemo } from 'react';
import {
  BookMarked,
  Search,
  Table,
  ShieldCheck,
  Layers,
  Server,
} from 'lucide-react';
import { CICD_GLOSSARY_TERMS } from '../../data/cicdAssessmentsAndGlossaryData';
import { LevelBadge } from '@/components/common/LevelBadge';
import { cn } from '@/utils/cn';

export const CicdGlossaryAndMatrices: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTerms = useMemo(() => {
    return CICD_GLOSSARY_TERMS.filter((t) => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.term.toLowerCase().includes(q) ||
          t.shortDef.toLowerCase().includes(q) ||
          t.deepExplanation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-6 space-y-8">
      {/* Header & Search */}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-cyan-400">
          <BookMarked className="h-4 w-4" />
          <span>Từ điển Kiến trúc CI/CD & Bảng Ma trận Tham chiếu (Từ 21 Trang PDF)</span>
        </div>
        <h1 className="text-lg sm:text-2xl font-extrabold text-white">
          Tra cứu Thuật ngữ Cốt lõi, Ma trận DevSecOps, Chiến lược Deployment & Docker Runner
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm thuật ngữ: DAG, OIDC, GitOps, Expand-and-Contract, DORA, preStop..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              'all',
              'Core Architecture',
              'DevSecOps & Cloud',
              'Deployment & GitOps',
              'Optimization & DORA',
              'Zero-Downtime & K8s',
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-bold transition-all',
                  selectedCategory === cat
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                )}
              >
                {cat === 'all' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Glossary Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTerms.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                {item.category}
              </span>
              <LevelBadge level={item.level} size="sm" />
            </div>

            <h3 className="text-base font-extrabold text-white">{item.term}</h3>
            <p className="text-xs font-semibold text-amber-300">
              {item.shortDef}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {item.deepExplanation}
            </p>

            {item.codeExample && (
              <pre className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-cyan-200 overflow-x-auto">
                {item.codeExample}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Reference Matrix 1: 5 Zero-Downtime Deployment Strategies (PDF Page 9) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-white">
          <Table className="h-5 w-5 text-cyan-400" />
          <span>Bảng 3.1 (PDF Trang 9): Ma trận So sánh 5 Chiến lược Triển khai (Deployment Strategies)</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 uppercase text-[11px]">
              <tr>
                <th className="p-3.5">Chiến lược</th>
                <th className="p-3.5">Cơ chế vận hành</th>
                <th className="p-3.5">Ưu điểm lớn nhất</th>
                <th className="p-3.5">Đánh đổi & Hạn chế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-200">
              <tr>
                <td className="p-3.5 font-bold text-amber-300">Recreate</td>
                <td className="p-3.5">Tắt toàn bộ instance v1.0 rồi mới khởi chạy các instance v2.0.</td>
                <td className="p-3.5">Đơn giản, không bao giờ tồn tại 2 phiên bản chạy song song.</td>
                <td className="p-3.5 text-rose-300">Gây gián đoạn dịch vụ (Downtime); chỉ dùng cho môi trường nội bộ.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-sky-300">Rolling Update</td>
                <td className="p-3.5">Thay thế cuốn chiếu từng nhóm Pod v1.0 bằng Pod v2.0 cho đến khi hoàn tất.</td>
                <td className="p-3.5">Tiết kiệm tài nguyên; được hỗ trợ mặc định bởi Kubernetes Deployment.</td>
                <td className="p-3.5">Quá trình Rollback phải cuộn ngược từng bước; có thời điểm v1 và v2 cùng tồn tại.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-emerald-300">Blue-Green</td>
                <td className="p-3.5">Dựng cụm Green (v2.0) song song với cụm Blue (v1.0). Kiểm thử xong thì chuyển 100% lưu lượng sang Green.</td>
                <td className="p-3.5 font-semibold text-emerald-300">Chuyển mạch và Rollback tức thì (dưới 1 giây) ngay tại tầng Load Balancer.</td>
                <td className="p-3.5">Đòi hỏi gấp đôi tài nguyên tính toán (CPU/RAM) trong thời gian chuyển giao.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-violet-300">Canary Release</td>
                <td className="p-3.5">Cho 1%–5% người dùng thực truy cập vào v2.0. Nếu HTTP 5xx và P99 ổn định mới nâng dần lên 25%, 50%, 100%.</td>
                <td className="p-3.5 font-semibold text-cyan-300">Bán kính ảnh hưởng (Blast Radius) nhỏ nhất; kiểm chứng bằng tải thực tế.</td>
                <td className="p-3.5">Cần hạ tầng định tuyến thông minh (Istio, NGINX, Argo Rollouts) và Prometheus.</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-cyan-300">Shadow / Dark Traffic</td>
                <td className="p-3.5">Nhân bản (Mirror) lưu lượng thực từ v1.0 gửi ngầm sang v2.0 để kiểm tra hiệu năng nhưng không trả kết quả v2.0 cho khách.</td>
                <td className="p-3.5">Thử tải bằng 100% lưu lượng Production thật mà không ảnh hưởng người dùng.</td>
                <td className="p-3.5">Rất phức tạp với các API ghi dữ liệu (POST/PUT) vì cần tránh ghi trùng xuống DB.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

/**
 * Hằng ghi nguồn của System Design Mastery (01-sources-and-credits.md §3.2–§3.4).
 * Chuỗi "Steve" và "MIT" đặt MỘT chỗ ở đây; cập nhật tại đây khi tình trạng giấy phép đổi (ADR-014).
 */
import type { BilingualText } from '@/components/scale-workbench/types';
import type { SdModule, SdSource } from './types';

export const SDC_ATTRIBUTION = {
  name: 'System Design Core',
  author: 'Steve',
  authorHandle: 'steve-bang',
  license: 'MIT',
  webUrl: 'https://www.systemdesigncore.site/roadmap',
  siteOrigin: 'https://www.systemdesigncore.site',
  repoUrl: 'https://github.com/steve-bang/systemdesigncore',
  readmeUrl:
    'https://github.com/steve-bang/systemdesigncore/blob/fe4234da7d6fe719e8e18547856fc0a730155420/README.md',
  commit: 'fe4234da7d6fe719e8e18547856fc0a730155420',
  fetchedAt: '2026-11-26',
  /** Nguyên văn câu trong README của SDC (01 §3.4). Không tự soạn lại điều khoản. */
  licenseQuote: 'This project is licensed under the MIT License',
  /** Tác giả đã đồng ý cho dùng nội dung (ADR-014). */
  consentNote:
    'Tác giả đã đồng ý cho dự án dùng nội dung (xác nhận ngày 2026-11-26). Repo gốc ghi MIT trong README nhưng chưa có file LICENSE, còn footer của web ghi "All rights reserved". Mâu thuẫn này vẫn còn trên repo gốc.',
} as const;

export const DTS_REFERENCE = {
  name: 'Designed to Scale',
  author: 'Dilum Sanjaya',
  webUrl: 'https://designed-to-scale.vercel.app',
  note: 'Chỉ dùng làm tài liệu tham khảo về mô hình minh họa. Không dùng lời giảng, dữ liệu scene hay hình ảnh của DTS.',
} as const;

export const SD_SIM_DISCLAIMER = 'Mô phỏng đúng xu hướng và độ lớn, không đúng số tuyệt đối.';

export const SD_REMOVAL_NOTE =
  'Nếu tác giả muốn rút nội dung, hãy liên hệ chủ ứng dụng; phần chuyển thể được truy vết theo từng bài nên gỡ được riêng.';

export function sdSources(m: Pick<SdModule, 'source'>): SdSource[] {
  if (!m.source) return [];
  return Array.isArray(m.source) ? m.source : [m.source];
}

const SDC_EXACT_TITLES: Record<string, string> = {
  'lesson-1-code-first-to-problem-first': 'Từ Code-First đến Problem-First - Thay Đổi Tư Duy Architect',
  'lesson-2-perfect-solution-to-trade-off-thinking': 'Từ Perfect Solution đến Trade-off Thinking',
  'lesson-3-foundation-exercises': 'Components và Communication - Giải Mã Kiến Trúc Hệ Thống Phân Tán',
  'lesson-4-thinking-in-constraints': 'Thinking in Constraints - Engineering Là Quản Lý Giới Hạn',
  'lesson-5-scale-intuition': 'Scale Intuition - Xây Dựng Cảm Giác Về Numbers',
  'lesson-6-system-thinking-framework': 'System Thinking Framework - Nhìn Hệ Thống Như Một Tổng Thể',
  'lesson-7-system-question-framework': 'System Question Framework - Checklist Chuẩn Khi Design Hệ Thống',
  'lesson-8-mental-model-recap': 'Mental Model Recap - Củng Cố Tư Duy System Design',
  'lesson-1-components-trong-he-thong-web': 'Components Trong Hệ Thống Web - Hiểu Từng Building Block',
  'lesson-2-communication-patterns': 'Communication Patterns - Sync vs Async trong Distributed Systems',
  'lesson-3-data-flow-and-bottlenecks': 'Data Flow & Bottlenecks - Tìm Và Tối Ưu Điểm Nghẽn Hệ Thống',
  'lesson-4-cac-khai-niem-quan-trong': 'Khái Niệm Quan Trọng - Latency, Throughput, Availability và CAP Theorem',
  'lesson-5-bai-tap-tong-hop': 'Bài Tập Tổng Hợp - Áp Dụng Foundation Vào Thực Tế',
  'lesson-1-load-balancing': 'Load Balancing: Traffic Distribution Trong Distributed Systems',
  'lesson-2-caching': 'Caching - Performance Layer Quan Trọng Nhất',
  'lesson-3-database': 'Database Scaling - Chiến Lược Scale Data Layer',
  'lesson-4-message-queues-async-processing-decoupling-services': 'Message Queues & Async Processing - Decoupling Services',
  'lesson-5-integration-trade-off-thinking': 'Integration & Trade-off Thinking - Kết Hợp Components Thành Hệ Thống',
  'lesson-1-reality-of-distributed-systems': 'Reality of Distributed Systems - Failure Models & CAP Thinking',
  'lesson-2-consistency-models-strong-and-eventual-consistency': 'Consistency Models - Strong vs Eventual Consistency',
  'lesson-3-consensus-leader-election': 'Consensus & Leader Election - Distributed Agreement',
  'lesson-4-distributed-transactions-data-integrity': 'Distributed Transactions & Data Integrity',
  'lesson-5-distributed-id-and-ordering': 'Distributed ID & Ordering - Định Danh Trong Hệ Thống Phân Tán',
  'lesson-6-time-event-ordering-clock-problem-trong-distributed-systems': 'Time & Event Ordering - Clock Problem Trong Distributed Systems',
  'lesson-1-performance-bottleneck-thinking': 'Performance & Bottleneck Thinking - Tư Duy Tìm Và Giải Quyết Điểm Nghẽn',
  'lesson-2-caching-strategy-trade-consistency-de-lay-speed': 'Caching Strategy - Trade Consistency Để Lấy Speed',
  'lesson-3-cdn-and-edge-computing-distributed-cache-gan-user': 'CDN & Edge Computing - Distributed Cache Gần User',
  'lesson-4-database-scaling-optimization': 'Database Scaling & Optimization - Từ Query Tuning Đến Sharding',
  'lesson-5-rate-limiting-and-load-control': 'Rate Limiting & Load Control - Protect System Khỏi Overload',
  'lesson-6-asynchronous-processin-queues': 'Asynchronous Processing & Queues - Defer Work Để Giảm Latency',
  'lesson-7-monitoring-observability-performance-debugging': 'Monitoring, Observability & Performance Debugging',
  'lesson-1-architecture-evolution-mindset': 'Architecture Evolution Mindset - Start Simple, Scale Gradually',
  'lesson-2-head-heavy-systems': 'Read-Heavy Systems - Design Cho 99% Reads',
  'lesson-3-social-feed-systems': 'Social Feed Systems - Kiến Trúc Phức Tạp Nhất Trong Consumer Apps',
  'lesson-1-system-design-thinking-framework': 'System Design Thinking Framework - Từ Pattern Đến Problem-Solving Mindset',
  'lesson-2-snake-framework': 'SNAKE Framework - Methodology Để Ace System Design Interview',
  'lesson-3-trade-offs-and-architecture-decision-making': 'Trade-offs & Architecture Decision Making - Tư Duy Senior Architect',
  'lesson-4-real-interview-strategy': 'Real Interview Strategy - Áp Dụng SNAKE Vào System Design Thực Tế',
  'lesson-5-advanced-architecture-topics': 'Advanced Architecture Topics - Senior vs Staff Engineer',
  'lesson-6-architect-mindset-production-thinking': 'Architect Mindset & Production Thinking - From Engineer To Trusted Architect',
};

/** Tên bài gốc suy từ tên file `lesson-N-<slug>.mdx`, ưu tiên tiêu đề chuẩn trên web SDC. */
export function sdcSourceTitle(src: SdSource): string {
  const base = (src.path ?? '').split('/').pop() ?? '';
  const key = base.replace(/\.mdx?$/, '');
  if (SDC_EXACT_TITLES[key]) return SDC_EXACT_TITLES[key];
  const slug = key.replace(/^lesson-\d+-/, '').replace(/-/g, ' ').trim();
  return slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'bài gốc';
}

/**
 * Chuyển `source.path` (`content/phases/phase-N/lessons/<slug>.mdx`) sang URL bài viết thực tế
 * trên trang web https://www.systemdesigncore.site/phase/phase-N/lesson/<slug> (thay vì link GitHub).
 */
export function sdcWebUrl(src: SdSource): string {
  const p = src.path ?? '';
  const m = /^content\/phases\/(phase-\d+)\/lessons\/([^/]+)\.mdx?$/.exec(p);
  if (m) {
    return `${SDC_ATTRIBUTION.siteOrigin}/phase/${m[1]}/lesson/${m[2]}`;
  }
  const idx = /^content\/phases\/(phase-\d+)\/index\.mdx?$/.exec(p);
  if (idx) {
    return `${SDC_ATTRIBUTION.siteOrigin}/phase/${idx[1]}`;
  }
  return SDC_ATTRIBUTION.webUrl;
}

/**
 * Dòng nguồn cuối bài (01 §3.2) dẫn trực tiếp tới bài viết trên trang web systemdesigncore.site.
 * Trả null nếu bài không chuyển thể từ SDC.
 */
export function sdAttributionLine(
  m: Pick<SdModule, 'source'>
): { text: BilingualText; href: string; repoHref: string; sourceTitle: BilingualText } | null {
  const first = sdSources(m).find((s) => s.kind === 'sdc');
  if (!first) return null;
  const title = sdcSourceTitle(first);
  const webHref = sdcWebUrl(first);
  return {
    text: {
      vi: `Nguồn: ${SDC_ATTRIBUTION.name} — "${title}" (${SDC_ATTRIBUTION.author}). Đọc bài gốc trên systemdesigncore.site ↗`,
      en: `Source: ${SDC_ATTRIBUTION.name} — "${title}" (${SDC_ATTRIBUTION.author}). Read original on systemdesigncore.site ↗`,
    },
    href: webHref,
    repoHref: first.url ?? SDC_ATTRIBUTION.repoUrl,
    sourceTitle: { vi: title, en: title },
  };
}

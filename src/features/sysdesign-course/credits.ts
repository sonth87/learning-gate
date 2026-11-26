/**
 * Hằng ghi nguồn của System Design Mastery (01-sources-and-credits.md §3.2–§3.4).
 * Chuỗi "Steve" và "MIT" đặt MỘT chỗ ở đây; cập nhật tại đây khi tình trạng giấy phép đổi (ADR-014).
 */
import type { SdModule, SdSource } from './types';

export const SDC_ATTRIBUTION = {
  name: 'System Design Core',
  author: 'Steve',
  authorHandle: 'steve-bang',
  license: 'MIT',
  webUrl: 'https://www.systemdesigncore.site/roadmap',
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

/** Tên bài gốc suy từ tên file `lesson-N-<slug>.mdx`, đủ để người đọc nhận ra bài. */
export function sdcSourceTitle(src: SdSource): string {
  const base = (src.path ?? '').split('/').pop() ?? '';
  const slug = base.replace(/\.mdx?$/, '').replace(/^lesson-\d+-/, '').replace(/-/g, ' ').trim();
  return slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'bài gốc';
}

/**
 * Dòng nguồn cuối bài (01 §3.2). Trả null nếu bài không chuyển thể từ SDC.
 * TODO(T3.1/T3.6): gắn vào `ScaleModuleLesson.attribution` khi types.ts dùng chung có field.
 */
export function sdAttributionLine(m: Pick<SdModule, 'source'>): { text: string; href: string } | null {
  const first = sdSources(m).find((s) => s.kind === 'sdc');
  if (!first) return null;
  return {
    text: `Nguồn: ${SDC_ATTRIBUTION.name} — "${sdcSourceTitle(first)}" (${SDC_ATTRIBUTION.author}, ${SDC_ATTRIBUTION.license}). Biên tập lại cho Learning Gate. Xem Credits.`,
    href: first.url ?? SDC_ATTRIBUTION.repoUrl,
  };
}

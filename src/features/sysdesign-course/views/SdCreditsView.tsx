import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useSdCurriculum } from '../data';
import {
  DTS_REFERENCE,
  SDC_ATTRIBUTION,
  SD_REMOVAL_NOTE,
  SD_SIM_DISCLAIMER,
  sdcSourceTitle,
  sdcWebUrl,
  sdSources,
} from '../credits';
import { sortedSdModules } from '../logic';
import { useCourseEnOverlay } from '@/data/i18n/loader';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';

const A: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-[var(--dts-blue-ink)] underline underline-offset-2"
  >
    {children}
    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
  </a>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 sm:p-5">
    <h2 className="mb-2 font-mono text-base font-extrabold text-[var(--dts-ink)]">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed text-[var(--dts-ink-soft)]">{children}</div>
  </section>
);

/** Tab Credits (01-sources-and-credits.md §3.3). */
export const SdCreditsView: React.FC = () => {
  const { data: cur } = useSdCurriculum();
  const lang = useWorkbenchStore((st) => st.language);
  const enOverlay = useCourseEnOverlay('sysdesign');
  const adapted = cur
    ? sortedSdModules(cur)
        .map((m) => ({ m, srcs: sdSources(m).filter((s) => s.kind === 'sdc') }))
        .filter((x) => x.srcs.length > 0)
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 text-[var(--dts-ink)] sm:p-6">
      <div>
        <h1 className="font-mono text-xl font-extrabold sm:text-2xl">
          {lang === 'en' ? 'Sources & Credits' : 'Nguồn và ghi công'}
        </h1>
        <p className="mt-1 text-sm text-[var(--dts-ink-soft)]">
          {lang === 'en'
            ? 'Lesson content is adapted from open-source material. This page documents sources, licenses, and adapted lessons.'
            : 'Nội dung bài học được biên tập lại từ một nguồn mở. Trang này ghi rõ nguồn, giấy phép và các bài đã chuyển thể.'}
        </p>
      </div>

      <Section title={SDC_ATTRIBUTION.name}>
        <p>
          {lang === 'en' ? 'Author:' : 'Tác giả:'} {SDC_ATTRIBUTION.author} (GitHub{' '}
          <code>{SDC_ATTRIBUTION.authorHandle}</code>). Web:{' '}
          <A href={SDC_ATTRIBUTION.webUrl}>systemdesigncore.site</A>. Repo:{' '}
          <A href={SDC_ATTRIBUTION.repoUrl}>steve-bang/systemdesigncore</A>.
        </p>
        <p>
          {lang === 'en' ? 'Commit used:' : 'Commit đã dùng:'}{' '}
          <code className="break-all">{SDC_ATTRIBUTION.commit}</code>,{' '}
          {lang === 'en' ? 'fetched on' : 'lấy ngày'} {SDC_ATTRIBUTION.fetchedAt}.
        </p>
        <p>
          {lang === 'en'
            ? 'The author granted permission for this project to use the content (confirmed 2026-11-26). The upstream repo states MIT in README without a LICENSE file, while the website footer says "All rights reserved". This discrepancy remains on the upstream repo.'
            : SDC_ATTRIBUTION.consentNote}
        </p>
      </Section>

      <Section title={lang === 'en' ? 'MIT License Note' : 'Ghi chú giấy phép MIT'}>
        <p>
          {lang === 'en' ? (
            <>
              The upstream README states: <q>{SDC_ATTRIBUTION.licenseQuote}</q>. See{' '}
              <A href={SDC_ATTRIBUTION.readmeUrl}>README at the exact commit</A>. When the upstream repo adds a LICENSE
              file, the full text will be copied here.
            </>
          ) : (
            <>
              README của repo gốc ghi: <q>{SDC_ATTRIBUTION.licenseQuote}</q>. Xem{' '}
              <A href={SDC_ATTRIBUTION.readmeUrl}>README tại đúng commit</A>. Khi repo gốc có file LICENSE, văn bản đầy
              đủ sẽ được chép vào đây.
            </>
          )}
        </p>
      </Section>

      <Section
        title={
          lang === 'en'
            ? `Lessons adapted from ${SDC_ATTRIBUTION.name} (${adapted.length})`
            : `Bài đã chuyển thể từ ${SDC_ATTRIBUTION.name} (${adapted.length})`
        }
      >
        {adapted.length === 0 ? (
          <p>{lang === 'en' ? 'No adapted lessons yet.' : 'Chưa có bài nào chuyển thể.'}</p>
        ) : (
          <ul className="space-y-2">
            {adapted.map(({ m, srcs }) => {
              const modTitle = (lang === 'en' ? enOverlay?.modules?.[m.id]?.titleEn : undefined) ?? m.title;
              return (
                <li key={m.id} className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2.5">
                  <div className="font-semibold text-[var(--dts-ink)]">
                    <span className="mr-1.5 font-mono text-[var(--dts-blue-ink)]">{m.id}</span>
                    {modTitle}
                  </div>
                  {srcs.map((s, i) => (
                    <div key={i} className="mt-1 text-xs">
                      <A href={sdcWebUrl(s)}>
                        {lang === 'en'
                          ? `Original on systemdesigncore.site (${sdcSourceTitle(s)})`
                          : `Bài gốc trên systemdesigncore.site (${sdcSourceTitle(s)})`}
                      </A>
                      {s.adaptedAt && (
                        <span>
                          {' '}
                          · {lang === 'en' ? 'adapted on' : 'biên tập ngày'} {s.adaptedAt}
                        </span>
                      )}
                      <span>
                        {' '}
                        · {lang === 'en' ? 'level:' : 'mức biên tập:'}{' '}
                        {lang === 'en'
                          ? s.adaptation === 'rewritten'
                            ? 'rewritten'
                            : 'adapted'
                          : s.adaptation === 'rewritten'
                            ? 'viết lại'
                            : 'biên tập'}
                      </span>
                      {s.changes && <div className="mt-0.5 text-[var(--dts-ink-muted)]">{s.changes}</div>}
                    </div>
                  ))}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={DTS_REFERENCE.name}>
        <p>
          {lang === 'en'
            ? `Reference for illustration models, by ${DTS_REFERENCE.author}. Web:`
            : `Tài liệu tham khảo về mô hình minh họa, tác giả ${DTS_REFERENCE.author}. Web:`}{' '}
          <A href={DTS_REFERENCE.webUrl}>designed-to-scale.vercel.app</A>.
        </p>
        <p>
          {lang === 'en'
            ? 'Used only as a reference for illustration models. No lecture text, scene data, or images from DTS are used.'
            : DTS_REFERENCE.note}
        </p>
      </Section>

      <Section title={lang === 'en' ? 'Simulations & Content Removal' : 'Mô phỏng và gỡ nội dung'}>
        <p>
          {lang === 'en'
            ? 'Simulations illustrate trends and orders of magnitude, not exact production numbers.'
            : SD_SIM_DISCLAIMER}
        </p>
        <p>
          {lang === 'en'
            ? 'If an author wishes to withdraw content, please contact the app maintainer; adapted parts are tracked per lesson and can be removed individually.'
            : SD_REMOVAL_NOTE}
        </p>
      </Section>
    </div>
  );
};

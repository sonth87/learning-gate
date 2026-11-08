import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  CheckCircle2,
  Sliders,
  Sparkles,
  Database,
  Sun,
  Moon,
  Monitor,
  ArrowRightLeft,
} from 'lucide-react';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { backupService } from '@/db/backupService';
import { FullBackupPayload } from '@/types/user.types';
import { cn } from '@/utils/cn';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen } = useNavigationStore();
  const settings = useSettingsStore();
  const hydrateAll = useUserDataStore((s) => s.hydrateAll);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isSettingsOpen) return null;

  const handleExportJson = async () => {
    const payload = await backupService.exportBackup({
      theme: settings.theme,
      organizationMode: settings.organizationMode,
      showJsTsComparison: settings.showJsTsComparison,
      enableAutoHighlight: settings.enableAutoHighlight,
      highlightKeywords: settings.highlightKeywords,
      highlightBuiltins: settings.highlightBuiltins,
      highlightConcepts: settings.highlightConcepts,
      fontSize: settings.fontSize,
    });

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pymastery-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Đã xuất toàn bộ dữ liệu IndexedDB & Settings ra file JSON!');
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as FullBackupPayload;
      await backupService.importBackup(parsed);
      if (parsed.settings) {
        settings.replaceAllSettings(parsed.settings);
      }
      await hydrateAll();
      setStatusMessage(
        'Khôi phục thành công toàn bộ tiến độ, ghi chú, SRS Flashcard & Cài đặt!'
      );
    } catch {
      setStatusMessage('Lỗi: File JSON không hợp lệ.');
    }
  };

  return (
    <div
      onClick={() => setSettingsOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl rounded-none sm:rounded-2xl border-0 sm:border border-slate-700 bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header - Fixed top with close */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:px-6 sm:py-4 shrink-0 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Cài đặt Hệ thống & Dữ liệu
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Tùy chỉnh hiển thị, giao diện & đồng bộ LocalStorage + IndexedDB
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            aria-label="Đóng cài đặt"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Section 1: Display & Mode */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Giao diện (Theme), Chế độ Lộ trình & Đối chiếu Ngôn ngữ
            </h4>

            {/* Theme Switcher Row - Identical to Header */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:p-3.5">
              <div>
                <p className="text-xs font-semibold text-white">
                  Chế độ Giao diện (Theme Mode)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sáng (Light), Tối (Dark) hoặc Tự động theo hệ thống (Auto).
                </p>
              </div>

              {/* Theme Switcher: Exact Same as Header */}
              <div
                role="group"
                aria-label="Chế độ giao diện Sáng / Tối / Tự động"
                className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => settings.setTheme('light')}
                  aria-label="Giao diện Sáng (Light)"
                  aria-pressed={settings.theme === 'light'}
                  title="Giao diện Sáng (Light)"
                  className={cn(
                    'inline-flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-md transition-colors',
                    settings.theme === 'light'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => settings.setTheme('dark')}
                  aria-label="Giao diện Tối (Dark)"
                  aria-pressed={settings.theme === 'dark'}
                  title="Giao diện Tối (Dark)"
                  className={cn(
                    'inline-flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-md transition-colors',
                    settings.theme === 'dark'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => settings.setTheme('system')}
                  aria-label="Tự động theo hệ thống (Auto)"
                  aria-pressed={settings.theme === 'system'}
                  title="Tự động theo hệ thống (Auto)"
                  className={cn(
                    'inline-flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-md transition-colors',
                    settings.theme === 'system'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* JS/TS Comparison Mode Row - Identical to Header */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:p-3.5">
              <div>
                <p className="text-xs font-semibold text-white">
                  Hiển thị phần Đối chiếu JS / TypeScript ↔ Python
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Bật/tắt thẻ so sánh tư duy và bảng quy đổi cú pháp từ JS/TS.
                </p>
              </div>

              {/* JS/TS Toggle: Exact Same as Header */}
              <button
                type="button"
                onClick={() =>
                  settings.setShowJsTsComparison(!settings.showJsTsComparison)
                }
                aria-pressed={settings.showJsTsComparison}
                title="Bật/Tắt chế độ đối chiếu cú pháp & tư duy với JavaScript/TypeScript"
                className={cn(
                  'inline-flex h-9 sm:h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors shrink-0',
                  settings.showJsTsComparison
                    ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-xs'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                )}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-mono text-[11px]">JS/TS</span>
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    settings.showJsTsComparison ? 'bg-cyan-400' : 'bg-slate-600'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:p-3.5">
              <div>
                <p className="text-xs font-semibold text-white">
                  Cách tổ chức thanh lộ trình
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chuyển đổi linh hoạt giữa 7 Giai đoạn hoặc 5 Cấp độ.
                </p>
              </div>
              <select
                value={settings.organizationMode}
                onChange={(e) =>
                  settings.setOrganizationMode(
                    e.target.value as 'by-stage' | 'by-level'
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white shrink-0"
              >
                <option value="by-stage">Theo 7 Giai đoạn (Stage 1 → 7)</option>
                <option value="by-level">
                  Theo 5 Cấp độ (Fundamental → Master)
                </option>
              </select>
            </div>
          </div>

        {/* Section 2: Highlighting & Hover Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>2. Hệ thống Highlight & Hover Preview Thuật ngữ</span>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 cursor-pointer">
            <span className="text-xs font-semibold text-white">
              Tự động Highlight & Xem nhanh khi di chuột (Hover Preview)
            </span>
            <input
              type="checkbox"
              checked={settings.enableAutoHighlight}
              onChange={() => settings.toggleAutoHighlight()}
              className="h-4 w-4 accent-amber-500"
            />
          </label>

          {settings.enableAutoHighlight && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.highlightKeywords}
                  onChange={(e) =>
                    settings.setHighlightCategory(
                      'highlightKeywords',
                      e.target.checked
                    )
                  }
                  className="accent-fuchsia-500"
                />
                <span>Từ khóa (def, yield...)</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.highlightBuiltins}
                  onChange={(e) =>
                    settings.setHighlightCategory(
                      'highlightBuiltins',
                      e.target.checked
                    )
                  }
                  className="accent-cyan-500"
                />
                <span>Hàm & Dunder</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.highlightConcepts}
                  onChange={(e) =>
                    settings.setHighlightCategory(
                      'highlightConcepts',
                      e.target.checked
                    )
                  }
                  className="accent-indigo-500"
                />
                <span>Thuật ngữ & Công cụ</span>
              </label>
            </div>
          )}
        </div>

        {/* Section 3: JSON Export / Import */}
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>3. Sao lưu & Khôi phục Dữ liệu Học tập (JSON Backup)</span>
          </div>
          <p className="text-xs text-slate-400">
            Xuất hoặc nhập toàn bộ dữ liệu từ IndexedDB & LocalStorage (Tiến độ bài học, Code đã làm, Ghi chú, Bookmark, Lịch ôn Flashcard SRS, Lịch sử thi & Cài đặt).
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export ra file JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Import từ file JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportJson}
              className="hidden"
            />
          </div>

          {statusMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

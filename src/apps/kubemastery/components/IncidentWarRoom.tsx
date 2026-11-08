import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Terminal,
  CheckCircle2,
  Wrench,
  RotateCcw,
  Sparkles,
  FileCode2,
  Stethoscope,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { INCIDENT_SCENARIOS } from '../data/incidentsData';
import { useKubeStore } from '../store/useKubeStore';
import { cn } from '@/utils/cn';

export const IncidentWarRoom: React.FC = () => {
  const {
    selectedIncidentId,
    openIncidentInWarRoom,
    solvedIncidentIds,
    markIncidentSolved,
  } = useKubeStore();

  const scenario =
    INCIDENT_SCENARIOS.find((s) => s.id === selectedIncidentId) ||
    INCIDENT_SCENARIOS[0];

  const [activeDiagStep, setActiveDiagStep] = useState<1 | 2 | 3 | 4>(1);
  const [mobilePanel, setMobilePanel] = useState<'diagnose' | 'patch'>(
    'diagnose'
  );
  const [editorCode, setEditorCode] = useState<string>(scenario.brokenConfig);
  const [verifyResult, setVerifyResult] = useState<{
    status: 'idle' | 'pass' | 'fail';
    message: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    setActiveDiagStep(1);
    setMobilePanel('diagnose');
    setEditorCode(scenario.brokenConfig);
    setVerifyResult({ status: 'idle', message: '' });
  }, [scenario.id, scenario.brokenConfig]);

  const isSolved = solvedIncidentIds.includes(scenario.id);
  const currentStepData =
    scenario.diagnosticSteps.find((s) => s.stepOrder === activeDiagStep) ||
    scenario.diagnosticSteps[0];

  const handleApplyFix = () => {
    const missing = scenario.requiredSnippets.filter(
      (req) => !editorCode.includes(req)
    );
    const forbiddenFound = (scenario.forbiddenSnippets || []).filter((forb) =>
      editorCode.includes(forb)
    );

    if (missing.length === 0 && forbiddenFound.length === 0) {
      markIncidentSolved(scenario.id);
      setVerifyResult({
        status: 'pass',
        message: scenario.verificationSuccessLog,
      });
    } else {
      const reasons: string[] = [];
      if (missing.length > 0) {
        reasons.push(`Cấu hình còn thiếu: ${missing.join(' , ')}`);
      }
      if (forbiddenFound.length > 0) {
        reasons.push(
          `Vẫn còn giữ cấu hình gây lỗi: ${forbiddenFound.join(' , ')}`
        );
      }
      setVerifyResult({
        status: 'fail',
        message: `✗ Bản vá chưa khắc phục triệt để sự cố:\n• ${reasons.join('\n• ')}\n👉 Hãy xem gợi ý ở Bước 4 hoặc bấm nút "Điền Bản Vá Chuẩn" để tham khảo!`,
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-rose-500/35 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-slate-900 p-3.5 sm:p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <Stethoscope className="h-4 w-4 shrink-0" />
            <span>Phòng Chiến Dịch Chẩn Đoán & Cứu Hộ 8 Sự Cố Kinh Điển</span>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 font-mono text-xs font-bold text-emerald-300">
            Đã giải cứu: {solvedIncidentIds.length}/{INCIDENT_SCENARIOS.length}{' '}
            sự cố
          </span>
        </div>
        <h1 className="font-mono text-base sm:text-2xl font-extrabold text-white">
          Thực Hành Quy Trình 4 Bước "Khám Bệnh" & Vá Lỗi Trực Tiếp Trên Cụm K8s
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed hidden sm:block">
          Đừng đoán mò khi hệ thống sập! Hãy đi tuần tự từ Bước 1 đến Bước 4
          trong Terminal chẩn đoán để tìm ra nguyên nhân gốc rễ, sau đó sửa trực
          tiếp file cấu hình để cứu hệ thống.
        </p>
      </div>

      {/* 8 Incident Selector Cards (Horizontal touch scroller on mobile, 4-col grid on desktop) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 lg:hidden px-0.5">
          <span className="font-semibold text-slate-300">
            Vuốt ngang để chọn Ca cấp cứu ({scenario.number}/8):
          </span>
          <span className="font-mono text-rose-300">{scenario.statusBadge}</span>
        </div>

        <div className="flex lg:grid lg:grid-cols-4 gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {INCIDENT_SCENARIOS.map((inc) => {
            const active = inc.id === scenario.id;
            const solved = solvedIncidentIds.includes(inc.id);
            return (
              <button
                key={inc.id}
                onClick={() => openIncidentInWarRoom(inc.id)}
                className={cn(
                  'w-60 sm:w-64 lg:w-auto shrink-0 rounded-xl border p-3 text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer',
                  active
                    ? 'border-rose-400 bg-rose-500/15 ring-2 ring-rose-400/50 shadow-md'
                    : solved
                      ? 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15'
                      : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold border',
                        solved
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      )}
                    >
                      {solved ? '✓ Đã cứu hộ' : inc.statusBadge}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Ca #{inc.number}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-2">
                    {inc.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Incident Alert Summary */}
      <div className="rounded-2xl border border-amber-500/40 bg-slate-900/80 p-3.5 sm:p-5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
            <h2 className="text-sm sm:text-lg font-extrabold text-white">
              {scenario.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 font-mono text-[11px] font-bold text-rose-300">
              {scenario.severity}
            </span>
            {isSolved && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đã khắc phục</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-amber-200 font-medium">
          🚨 <strong>Báo động PagerDuty:</strong> {scenario.alertMessage}
        </p>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          <strong>Bản chất vấn đề:</strong> {scenario.essenceOfProblem}
        </p>
      </div>

      {/* Mobile Workspace Mode Switcher (< lg) */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 p-1 lg:hidden sticky top-0 z-20 backdrop-blur-md">
        <button
          onClick={() => setMobilePanel('diagnose')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-bold transition-all cursor-pointer',
            mobilePanel === 'diagnose'
              ? 'bg-sky-500 text-slate-950 shadow-xs'
              : 'text-slate-300 hover:text-white'
          )}
        >
          <Terminal className="h-3.5 w-3.5 shrink-0" />
          <span>1. Khám Bệnh (4 Bước)</span>
        </button>
        <button
          onClick={() => setMobilePanel('patch')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-bold transition-all cursor-pointer',
            mobilePanel === 'patch'
              ? 'bg-emerald-500 text-slate-950 shadow-xs'
              : 'text-slate-300 hover:text-white'
          )}
        >
          <Wrench className="h-3.5 w-3.5 shrink-0" />
          <span>2. Sửa YAML & Vá Lỗi</span>
        </button>
      </div>

      {/* Main Split Workspace: Left = 4-Step Diagnostic Terminal | Right = Live YAML/Dockerfile Patch Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Cols: 4-Step Diagnostic Protocol */}
        <div
          className={cn(
            'lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-5 space-y-4',
            mobilePanel !== 'diagnose' && 'hidden lg:block'
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-sky-400 shrink-0" />
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Quy trình 4 Bước "Khám Bệnh" Từ Ngoài Vào Trong
              </h3>
            </div>
          </div>

          {/* 4 Step Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {scenario.diagnosticSteps.map((st) => {
              const isSelected = activeDiagStep === st.stepOrder;
              return (
                <button
                  key={st.stepOrder}
                  onClick={() => setActiveDiagStep(st.stepOrder)}
                  className={cn(
                    'rounded-xl border p-2.5 text-left transition-all cursor-pointer',
                    isSelected
                      ? 'border-sky-400 bg-sky-500/20 text-sky-200 ring-1 ring-sky-400'
                      : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white'
                  )}
                >
                  <div className="font-mono text-[10px] font-bold uppercase text-sky-400">
                    Bước {st.stepOrder}/4
                  </div>
                  <div className="text-[11px] font-bold mt-0.5 line-clamp-1">
                    {st.stepOrder === 1 && 'Nhìn sắc diện'}
                    {st.stepOrder === 2 && 'Đọc bệnh án'}
                    {st.stepOrder === 3 && 'Đọc nhật ký'}
                    {st.stepOrder === 4 && 'Khoanh vùng & Vá'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Diagnostic Step Terminal Output */}
          <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-3.5 sm:p-4 space-y-3 font-mono text-xs">
            <div className="text-xs font-sans font-bold text-sky-300">
              {currentStepData.stepTitle}
            </div>
            <div className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-amber-300 break-all sm:break-normal">
              <span className="text-emerald-400">sre@k8s-prod:~$</span>{' '}
              {currentStepData.command}
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-slate-200 leading-relaxed border-l-2 border-sky-500 pl-3">
              {currentStepData.terminalOutput}
            </pre>
          </div>

          {/* Clue Callout */}
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3.5 text-xs text-slate-200 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Manh mối phát hiện ở Bước {currentStepData.stepOrder}:</span>
            </div>
            <p className="leading-relaxed">{currentStepData.clueExplanation}</p>
          </div>

          {/* Quick Jump to Patch Editor on Mobile */}
          <button
            onClick={() => setMobilePanel('patch')}
            className="w-full lg:hidden inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 text-xs font-extrabold text-emerald-300"
          >
            <span>Chuyển sang Tab Sửa File {scenario.configFileName}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Root Causes & Solutions Reference */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nguyên nhân gốc rễ & Phác đồ giải quyết triệt để:
            </div>
            {scenario.rootCausesAndSolutions.map((rc, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-1.5 text-xs"
              >
                <div className="font-bold text-amber-300">{rc.causeTitle}</div>
                <p className="text-slate-300 leading-relaxed">{rc.detail}</p>
                <pre className="ide-dark-surface rounded bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  {rc.fixCommandOrCode}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Right 6 Cols: Live Config Patch Editor & Apply Verification */}
        <div
          className={cn(
            'lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-5 space-y-4',
            mobilePanel !== 'patch' && 'hidden lg:block'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Sửa File Cấu Hình:{' '}
                  <code className="text-amber-300">
                    {scenario.configFileName}
                  </code>
                </h3>
                <p className="text-xs text-slate-400">
                  Sửa các dòng bị lỗi trong khung bên dưới rồi bấm "Triển khai
                  Bản vá"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setEditorCode(scenario.brokenConfig);
                  setVerifyResult({ status: 'idle', message: '' });
                }}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={() => setEditorCode(scenario.fixedConfig)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Điền Bản Vá Chuẩn</span>
              </button>
            </div>
          </div>

          {/* Code Editor Textarea */}
          <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <textarea
              value={editorCode}
              onChange={(e) => setEditorCode(e.target.value)}
              rows={16}
              spellCheck={false}
              className="w-full bg-slate-950 p-3.5 sm:p-4 font-mono text-xs text-slate-100 leading-relaxed focus:outline-none resize-y"
            />
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApplyFix}
            className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs sm:text-sm font-extrabold text-slate-950 hover:bg-emerald-400 shadow-md transition-all cursor-pointer"
          >
            <Wrench className="h-4 w-4 shrink-0" />
            <span className="truncate">
              Triển khai Bản vá (kubectl apply -f {scenario.configFileName})
            </span>
          </button>

          {/* Verification Result Console */}
          {verifyResult.status !== 'idle' && (
            <div
              className={cn(
                'ide-dark-surface rounded-xl border p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed',
                verifyResult.status === 'pass'
                  ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                  : 'border-rose-500/50 bg-rose-950/30 text-rose-300'
              )}
            >
              {verifyResult.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

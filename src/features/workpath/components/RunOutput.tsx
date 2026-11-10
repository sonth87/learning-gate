import React from 'react';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import type { GradeResult, RunResult } from '../types';
import { Btn, Callout } from './ui';
import { Inline } from './Markdown';
import { cn } from '@/utils/cn';

/** Giải thích lỗi thường gặp bằng tiếng Việt, hiện kèm traceback */
export const ERROR_TIPS: Record<string, string> = {
  SyntaxError: 'Viết sai cú pháp. Nhìn dòng được chỉ ra và cả dòng ngay phía trên: thường thiếu dấu `:`, thiếu ngoặc `)` hoặc dấu nháy.',
  IndentationError: 'Thụt lề sai. Dùng đúng 4 dấu cách cho mỗi cấp, đừng trộn Tab với dấu cách.',
  TabError: 'Lẫn Tab và dấu cách khi thụt lề. Chỉ dùng dấu cách.',
  NameError: 'Dùng một tên chưa được tạo: gõ sai chính tả, quên gán giá trị, hoặc quên `import`.',
  TypeError: 'Dùng sai kiểu dữ liệu (ví dụ cộng chuỗi với số, hoặc gọi hàm sai số tham số). Xem phép toán ở dòng báo lỗi.',
  ValueError: 'Đúng kiểu nhưng giá trị không hợp lệ (ví dụ `int("abc")`).',
  ZeroDivisionError: 'Chia cho 0. Kiểm tra số chia trước khi chia.',
  IndexError: 'Chỉ số vượt quá độ dài của list/chuỗi. Nhớ chỉ số bắt đầu từ 0 và phần tử cuối là `len(x) - 1`.',
  KeyError: 'Khoá không có trong dict. Dùng `d.get(khoá)` hoặc kiểm tra `khoá in d` trước.',
  AttributeError: 'Đối tượng không có thuộc tính/phương thức đó (hay gặp khi biến đang là `None`).',
  FileNotFoundError: 'Không thấy file. Kiểm tra tên file và thư mục đang đứng.',
  ModuleNotFoundError: 'Trong trình duyệt chỉ có thư viện chuẩn (và một số gói của Pyodide). Thư viện ngoài thì chạy trên máy bằng `uv run --with tên python file.py`.',
  EOFError: 'Chương trình gọi `input()` nhưng chưa có dữ liệu nhập. Điền vào ô "Dữ liệu nhập" (mỗi dòng một giá trị).',
  RecursionError: 'Đệ quy quá sâu — thiếu điều kiện dừng.',
  KeyboardInterrupt: 'Chương trình bị dừng.',
};

/** Hiển thị kết quả chạy thử: output, traceback, giải thích lỗi + nút "Đi tới dòng N" */
export const RunOutput: React.FC<{ result: RunResult; onGoto?: (line: number) => void }> = ({ result, onGoto }) => {
  const err = result.stderr.trim();
  const kind = err.split('\n').pop()?.match(/^(\w+Error|KeyboardInterrupt)/)?.[1];
  const lineMatches = [...err.matchAll(/File "main\.py", line (\d+)/g)];
  const lineNo = lineMatches.length ? Number(lineMatches[lineMatches.length - 1][1]) : null;
  return (
    <div className="space-y-2">
      {result.stdout && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kết quả (output)</div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-[13px] text-slate-100">{result.stdout}</pre>
        </>
      )}
      {err && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lỗi</div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 font-mono text-[13px] text-rose-300">{err}</pre>
        </>
      )}
      {kind && ERROR_TIPS[kind] && (
        <Callout tone="warn" className="flex flex-wrap items-center gap-2">
          <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <b>{kind}</b>: <Inline text={ERROR_TIPS[kind]} />
          </span>
          {lineNo && onGoto && (
            <Btn onClick={() => onGoto(lineNo)} className="ml-auto !px-2 !py-0.5 text-xs">
              Đi tới dòng {lineNo}
            </Btn>
          )}
        </Callout>
      )}
      {!result.stdout && !err && !result.timedOut && (
        <p className="text-sm text-slate-500">Chương trình chạy xong, không in gì ra. Thêm <code className="rounded bg-slate-800 px-1">print(...)</code> để thấy kết quả.</p>
      )}
      {result.timedOut && (
        <Callout tone="bad">Quá 10 giây nên đã bị dừng — có thể bị vòng lặp vô hạn hoặc đang chờ <code>input()</code>.</Callout>
      )}
      <div className="text-xs text-slate-500">
        {result.exitCode === 0 ? '✔ thoát bình thường' : `✘ mã thoát ${result.exitCode}`} · {result.ms} ms
      </div>
    </div>
  );
};

/** Hiển thị kết quả chấm test: từng test PASS/FAIL, giá trị nhận được / mong đợi */
export const GradeOutput: React.FC<{ result: GradeResult }> = ({ result }) => {
  if (result.timedOut)
    return (
      <Callout tone="bad">
        Quá 10 giây nên bài bị dừng — có thể code bị vòng lặp vô hạn, đệ quy không có điều kiện dừng, hoặc đang chờ <code>input()</code>.
      </Callout>
    );
  if (result.import_error)
    return (
      <Callout tone="bad">
        <b>Không nạp được solution.py</b>
        <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[13px]">{result.import_error}</pre>
        {result.stdout && <div className="mt-1 text-xs opacity-80">output: {result.stdout.slice(0, 300)}</div>}
      </Callout>
    );
  return (
    <div className="space-y-1.5">
      {result.tests.map((t) =>
        t.status === 'pass' ? (
          <div key={t.name} className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="font-medium">{t.doc || t.name}</span>
          </div>
        ) : (
          <div key={t.name} className={cn('rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm')}>
            <div className="flex items-start gap-2 font-medium text-rose-300">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.doc || t.name}</span>
            </div>
            {t.code && <pre className="mt-1.5 overflow-auto font-mono text-xs text-slate-400">{`dòng ${t.line}: ${t.code}`}</pre>}
            {t.got !== undefined && (
              <div className="mt-1.5 grid gap-1 text-[13px] sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nhận được</div>
                  <code className="block overflow-auto rounded bg-rose-950/60 px-2 py-1 font-mono text-rose-300">{t.got}</code>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mong đợi</div>
                  <code className="block overflow-auto rounded bg-emerald-950/60 px-2 py-1 font-mono text-emerald-300">{t.expected}</code>
                </div>
              </div>
            )}
            {t.message && <pre className="mt-1.5 whitespace-pre-wrap break-words font-mono text-xs text-amber-300">{t.message}</pre>}
            {t.stdout?.trim() && <div className="mt-1 text-xs text-slate-500">print(): {t.stdout.trim().replace(/\n/g, ' ⏎ ').slice(0, 200)}</div>}
          </div>
        )
      )}
    </div>
  );
};

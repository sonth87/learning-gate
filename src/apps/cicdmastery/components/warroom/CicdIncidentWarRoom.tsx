import React, { useState } from 'react';
import {
  ShieldAlert,
  Gauge,
  GitMerge,
  KeyRound,
  Bug,
  Terminal,
  Bot,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  Sparkles,
} from 'lucide-react';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { cn } from '@/utils/cn';

const WARROOM_MISSIONS = [
  {
    id: 'warroom-b1-42min-pipeline',
    badge: 'Tình huống B1 (Trang 17–18)',
    title: 'Giải cứu Pipeline Phình từ 4 Phút lên 42 Phút → Xuống Dưới 6 Phút',
    icon: <Gauge className="h-4 w-4" />,
    color: 'emerald',
  },
  {
    id: 'warroom-b2-race-condition',
    badge: 'Tình huống B2 (Trang 18)',
    title: 'Chống Ghi đè Phiên bản (Commit A cũ ghi đè lên Commit B mới trên Prod)',
    icon: <GitMerge className="h-4 w-4" />,
    color: 'amber',
  },
  {
    id: 'warroom-b3-secret-leak',
    badge: 'Tình huống B3 (Trang 19)',
    title: 'Ứng cứu Sự cố Lộ AWS Secret Key & DB Password trên Git + CI Log',
    icon: <KeyRound className="h-4 w-4" />,
    color: 'rose',
  },
  {
    id: 'warroom-b4-flaky-tests',
    badge: 'Tình huống B4 (Trang 19)',
    title: 'Trị Dứt điểm "Flaky Tests" (Chạy 10 lần thì 2 lần Fail ngẫu nhiên)',
    icon: <Bug className="h-4 w-4" />,
    color: 'violet',
  },
  {
    id: 'warroom-b5-local-vs-ci',
    badge: 'Tình huống B5 (Trang 20)',
    title: '5 Lỗi Kinh điển "Works on Local, Fails on CI" (Exit 137, arm64, CRLF...)',
    icon: <Terminal className="h-4 w-4" />,
    color: 'sky',
  },
  {
    id: 'warroom-a1-a3-b6-arch',
    badge: 'Chuyên đề A1–A3 & B6 (Trang 16–21)',
    title: 'Quyết định Kiến trúc: DinD vs. Kaniko, AI Review Privacy & Delivery vs. Deployment',
    icon: <Cpu className="h-4 w-4" />,
    color: 'cyan',
  },
] as const;

export const CicdIncidentWarRoom: React.FC = () => {
  const { selectedWarRoomId, selectWarRoom } = useCicdNavigationStore();

  // State for B1 (42 min -> < 6 min optimization toggles)
  const [b1Opts, setB1Opts] = useState({
    cachePullOnly: false,
    dockerfileLayerOrder: false,
    multistageDockerignore: false,
    dagAndSharding6x: false,
    failFastLinter: false,
    nvmeAndRegistryMirror: false,
  });

  // State for B2 (Race condition lock toggle)
  const [b2LockEnabled, setB2LockEnabled] = useState(false);

  // State for B3 (Secret Leak step inspect)
  const [b3TriedGitRm, setB3TriedGitRm] = useState(false);
  const [b3CompletedSteps, setB3CompletedSteps] = useState<number[]>([]);

  // State for B5 (Selected Local vs CI Error Case)
  const [b5SelectedCase, setB5SelectedCase] = useState(0);

  // Calculate B1 total minutes based on toggles
  const b1TotalMinutes = (() => {
    let mins = 42.0;
    if (b1Opts.cachePullOnly) mins -= 6.5;
    if (b1Opts.dockerfileLayerOrder) mins -= 5.5;
    if (b1Opts.multistageDockerignore) mins -= 7.0;
    if (b1Opts.dagAndSharding6x) mins -= 14.5;
    if (b1Opts.failFastLinter) mins -= 1.5;
    if (b1Opts.nvmeAndRegistryMirror) mins -= 2.2;
    return Math.max(4.8, Number(mins.toFixed(1)));
  })();

  const B5_CASES = [
    {
      code: 'Error: Cannot find module "./UserSvc" from "src/controllers/auth.ts"',
      title: '1. Lỗi Module not found dù file vẫn tồn tại',
      cause:
        'macOS/Windows mặc định KHÔNG phân biệt chữ Hoa - Thường trong tên file, còn Linux trên CI phân biệt tuyệt đối (UserSvc.ts khác usersvc.ts). Khi dev đổi tên file trên Mac, Git mặc định lờ đi!',
      fixCommand: 'git config core.ignorecase false\n# Kết hợp quy tắc ESLint: "import/no-unresolved": "error"',
    },
    {
      code: 'Command failed with exit code 137 (SIGKILL)',
      title: '2. Tiến trình tự ngắt với Exit code 137',
      cause:
        'Mã 137 = 128 + 9 (SIGKILL): Tiến trình build/test ngốn vượt trần RAM của Container nên bị Linux Kernel OOM Killer tiêu diệt ngay lập tức.',
      fixCommand: 'NODE_OPTIONS="--max-old-space-size=3072" npx jest --maxWorkers=2\n# Hoặc tăng giới hạn RAM cho CI Runner Container',
    },
    {
      code: 'standard_init_linux.go: exec user process caused: exec format error',
      title: '3. Lỗi Exec format error hoặc lỗi thư viện C++ (bcrypt / sharp)',
      cause:
        'Lập trình viên dùng máy Mac chip Apple Silicon (arm64) đóng gói nhầm các file thực thi nhị phân trong node_modules vào Docker Image hoặc Cache của CI chạy Linux (amd64).',
      fixCommand: '# Luôn thêm node_modules vào file .dockerignore:\necho "node_modules" >> .dockerignore\n# Để Docker tự biên dịch lại Native Addons bên trong môi trường Linux của CI!',
    },
    {
      code: 'Job execution timed out after 60 minutes (Waiting at prompt: ? Are you sure [Y/n])',
      title: '4. Job đứng im cho đến khi hết giờ (Timeout)',
      cause:
        'Công cụ CLI dừng lại chờ người dùng nhập phím xác nhận [Y/n] (Interactive TTY Prompt) nhưng trên CI không có bàn phím.',
      fixCommand: 'env:\n  CI: "true"\nrun: npx prisma migrate deploy --non-interactive --yes',
    },
    {
      code: '/bin/sh: ./scripts/deploy.sh: /bin/sh^M: bad interpreter: No such file or directory',
      title: '5. Lỗi /bin/sh^M: bad interpreter',
      cause:
        'Máy Windows lưu file script .sh với ký tự xuống dòng CRLF (\\r\\n) khiến trình thông dịch Shell trên Linux hiểu nhầm ký tự \\r (^M) là một phần của tên chương trình /bin/sh.',
      fixCommand: '# Tạo file .gitattributes ở thư mục gốc của kho Git:\n*.sh text eol=lf',
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-slate-900 to-amber-500/10 p-5 sm:p-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
          <Flame className="h-4 w-4" />
          <span>Phòng Mô phỏng Tình huống Thực chiến & Xử lý Sự cố Vận hành (Phần II — Trang 16–21)</span>
        </div>
        <h1 className="text-lg sm:text-2xl font-extrabold text-white">
          Incident War-Room: Chẩn đoán & Giải quyết 10 Tình huống Kiến trúc & Sự cố CI/CD
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-4xl">
          Chọn từng tình huống sự cố thực tế (A1–A3 & B1–B7) bên dưới để trực tiếp bật/tắt cấu hình tối ưu, kiểm tra nguyên nhân gốc rễ và thực hành quy trình ứng cứu chuẩn công nghiệp.
        </p>
      </div>

      {/* Mission Selector Tabs */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {WARROOM_MISSIONS.map((m) => {
          const active = selectedWarRoomId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => selectWarRoom(m.id)}
              className={cn(
                'rounded-xl border p-3.5 text-left transition-all flex flex-col justify-between gap-2',
                active
                  ? 'border-cyan-400 bg-cyan-500/15 text-white ring-2 ring-cyan-400/50 shadow-md'
                  : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded bg-slate-950 border border-slate-700 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                  {m.icon}
                  {m.badge}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold leading-snug">
                {m.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          MISSION B1: PIPELINE 42 MIN -> < 6 MIN OPTIMIZATION LAB
         ===================================================================== */}
      {selectedWarRoomId === 'warroom-b1-42min-pipeline' && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Tình huống B1 (Trang 17–18): Bật 6 Kỹ thuật Tối ưu Điểm nghẽn Pipeline
            </div>
            <p className="text-xs text-slate-300">
              Pipeline ban đầu chạy mất 4 phút nhưng sau 1 năm đã phình lên <strong>42 phút</strong>. Hãy lần lượt tích chọn cả 6 bước tối ưu dưới đây để xem thời gian thực thi giảm xuống dưới 6 phút:
            </p>

            <div className="space-y-2.5">
              {[
                {
                  key: 'cachePullOnly',
                  title: '1. Bật Dependency Cache (hashFiles lockfile) với policy: pull-only (-6.5 phút)',
                  desc: 'Chỉ Job đầu tiên pull-push, các Job sau chỉ pull để không tốn thời gian nén lại thư viện.',
                },
                {
                  key: 'dockerfileLayerOrder',
                  title: '2. Sắp xếp lại thứ tự Dockerfile Layer Caching (-5.5 phút)',
                  desc: 'Đặt COPY package*.json ./ và RUN npm ci ở layer trước, COPY src/ ./src/ ở layer sau để tái sử dụng 100% layer node_modules.',
                },
                {
                  key: 'multistageDockerignore',
                  title: '3. Dùng Multi-stage Build + .dockerignore (-7.0 phút)',
                  desc: 'Loại bỏ .git, node_modules, coverage để giảm dung lượng Image từ >1GB xuống ~100MB, đẩy/kéo mạng nhanh gấp 10 lần.',
                },
                {
                  key: 'dagAndSharding6x',
                  title: '4. Chuyển sang Đồ thị DAG (needs) & Test Sharding parallel: 6 (-14.5 phút)',
                  desc: 'Cho phép Lint, SAST, Unit Test chạy đồng thời ngay từ đầu; chia bộ Integration Test nặng thành 6 luồng song song.',
                },
                {
                  key: 'failFastLinter',
                  title: '5. Thiết kế chốt Fail-Fast 15 giây ở đầu Pipeline (-1.5 phút)',
                  desc: 'Đặt Linter & Typecheck siêu nhẹ lên đầu tiên; nếu lỗi cú pháp thì dừng ngay trước khi khởi tạo container DB.',
                },
                {
                  key: 'nvmeAndRegistryMirror',
                  title: '6. Nâng cấp Self-hosted Runner NVMe + VPC Registry Mirror (-2.2 phút)',
                  desc: 'Gắn ổ cứng NVMe tốc độ cao và đặt Registry Mirror ngay trong mạng nội bộ VPC.',
                },
              ].map((item) => {
                const k = item.key as keyof typeof b1Opts;
                return (
                  <label
                    key={item.key}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all',
                      b1Opts[k]
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={b1Opts[k]}
                      onChange={(e) =>
                        setB1Opts((prev) => ({ ...prev, [k]: e.target.checked }))
                      }
                      className="mt-1 accent-emerald-500"
                    />
                    <div className="space-y-0.5 text-xs">
                      <div className="font-bold text-white">{item.title}</div>
                      <div className="text-slate-400">{item.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-cyan-400">
                  Đồng hồ Đo Thời gian Thực thi Pipeline (Timeline Profiler)
                </div>
                <div className="text-xs text-slate-400">
                  Mục tiêu SLA: Đưa thời gian từ 42.0 phút xuống dưới 6.0 phút
                </div>
              </div>
              <div
                className={cn(
                  'rounded-xl border px-4 py-2 font-mono text-2xl font-extrabold',
                  b1TotalMinutes <= 6
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-amber-500 bg-amber-500/20 text-amber-300'
                )}
              >
                {b1TotalMinutes} phút
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-5 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    b1TotalMinutes <= 6 ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                  style={{ width: `${Math.min(100, (b1TotalMinutes / 42) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between font-mono text-[11px] text-slate-400">
                <span>0 phút</span>
                <span className="text-emerald-400 font-bold">Đích SLA: &lt; 6 phút</span>
                <span>Ban đầu: 42 phút</span>
              </div>
            </div>

            <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 font-mono text-xs">
              <div className="text-cyan-400 font-bold">
                # Cấu trúc Dockerfile Tối ưu Layer Cache (Bước 2 & 3):
              </div>
              <pre className="text-slate-200 overflow-x-auto leading-relaxed">
{`FROM node:20-alpine AS builder
WORKDIR /app
# 1. Ít thay đổi nhất đặt lên trên -> Tái sử dụng 100% Cache!
COPY package.json package-lock.json ./
RUN npm ci
# 2. Thường xuyên thay đổi đặt xuống dưới
COPY src/ ./src/
RUN npm run build && npm prune --omit=dev`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MISSION B2: DEPLOYMENT RACE CONDITION (OUT-OF-ORDER DEPLOY)
         ===================================================================== */}
      {selectedWarRoomId === 'warroom-b2-race-condition' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase text-amber-400">
                Tình huống B2 (PDF Trang 18): Hiện tượng Deployment Race Condition (Out-of-order Deployment)
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Commit A merge trước (t=0s), Commit B merge sau (t=30s) — Tại sao A lại ghi đè làm mất code mới của B?
              </h2>
            </div>

            <button
              onClick={() => setB2LockEnabled((v) => !v)}
              className={cn(
                'rounded-xl border px-4 py-2.5 text-xs font-extrabold transition-all',
                b2LockEnabled
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                  : 'border-rose-500 bg-rose-500/20 text-rose-300'
              )}
            >
              {b2LockEnabled
                ? '✅ Đang BẬT Khóa Tuần tự (group: production-deploy-lock, cancel-in-progress: false)'
                : '🚨 Đang TẮT Khóa Concurrency (Cho phép 2 Pipeline chạy đua — Bấm để Bật Khóa!)'}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div
              className={cn(
                'rounded-xl border p-4 space-y-2',
                !b2LockEnabled
                  ? 'border-rose-500 bg-rose-500/10'
                  : 'border-slate-800 bg-slate-950/60 opacity-75'
              )}
            >
              <div className="text-xs font-bold text-rose-300">
                ❌ Kịch bản Thảm họa khi KHÔNG có Khóa Tuần tự CD:
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200 font-mono">
                <li>• [t=00s] Dev 1 merge PR #1 (Commit A - cũ) → Pipeline A chạy trên Runner chậm.</li>
                <li>• [t=30s] Dev 2 merge PR #2 (Commit B - mới) → Pipeline B chạy trên Runner nhanh hơn.</li>
                <li>• [t=180s] Pipeline B xong trước → Đẩy code mới (B) lên Production thành công!</li>
                <li className="text-rose-300 font-bold">
                  • [t=240s] Pipeline A bây giờ mới xong → Chạy lệnh Deploy ghi đè code cũ (A) đè lên code mới (B) trên Production!
                </li>
              </ul>
            </div>

            <div
              className={cn(
                'rounded-xl border p-4 space-y-2',
                b2LockEnabled
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-950/60'
              )}
            >
              <div className="text-xs font-bold text-emerald-300">
                ✅ Giải pháp Kỹ thuật Bắt buộc (Nguyên tắc Sống còn Trang 18):
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                1. Đối với Job kiểm thử (CI) trên nhánh PR: bật <code>cancel-in-progress: true</code> để hủy bản cũ tiết kiệm tài nguyên.
                <br />
                2. Đối với Job Deploy lên Production (CD): tuyệt đối <strong>KHÔNG hủy ngang</strong> (<code>cancel-in-progress: false</code>) vì ngắt đột ngột khi Helm/Terraform đang chạy dở sẽ làm hỏng trạng thái hạ tầng (State Lock Corruption). Thay vào đó, đưa vào hàng đợi khóa tuần tự (<code>production-deploy-lock</code> hoặc GitLab <code>resource_group</code> với <code>process_mode=newest_first</code>)!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MISSION B3: SECRET LEAK EMERGENCY DRILL (4 STEPS)
         ===================================================================== */}
      {selectedWarRoomId === 'warroom-b3-secret-leak' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-rose-400">
              Tình huống B3 (PDF Trang 19): Lộ Database Password & AWS Secret Key lên Git và CI Log
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Tại sao chạy lệnh git rm rồi tạo commit mới hoàn toàn VÔ TÁC DỤNG?
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setB3TriedGitRm(true)}
              className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/25"
            >
              Thử chạy sai cách: git rm .env && git commit -m &quot;remove secret&quot;
            </button>
            <button
              onClick={() => setB3CompletedSteps([1, 2, 3, 4])}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
            >
              Thực thi Quy trình 4 Bước Ứng cứu Chuẩn (Theo đúng thứ tự ưu tiên)
            </button>
          </div>

          {b3TriedGitRm && (
            <div className="rounded-xl border border-rose-500 bg-rose-950/40 p-4 text-xs font-mono text-rose-200 space-y-1">
              <div className="font-bold text-rose-300">
                🚨 CẢNH BÁO KỸ THUẬT: Kẻ tấn công vừa chạy lệnh `git log -p -n 2` và lấy được toàn bộ mật khẩu!
              </div>
              <div>
                Khẳng định kỹ thuật (PDF Trang 19): Chạy lệnh `git rm` rồi tạo commit mới hoàn toàn không có tác dụng bảo mật, vì toàn bộ chuỗi mật khẩu vẫn nằm nguyên vẹn trong lịch sử `.git/objects` của commit trước đó!
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: 1,
                badge: 'BƯỚC 1 (ƯU TIÊN SỐ 1)',
                title: 'Thu hồi & Xoay vòng Khóa ngay (Revoke & Rotate First)',
                desc: 'Coi mọi thông tin chạm vào Git là đã lộ hoàn toàn. Lập tức vô hiệu hóa AWS Access Key trên IAM, đổi mật khẩu DB và thay khóa JWT TRƯỚC KHI dọn Git!',
              },
              {
                step: 2,
                badge: 'BƯỚC 2',
                title: 'Xóa Vĩnh viễn khỏi Lịch sử Git & CI Console Logs',
                desc: 'Dùng công cụ git-filter-repo để viết lại lịch sử kho chứa, loại bỏ hoàn toàn blob chứa mật khẩu trên mọi nhánh, chạy git push --force --all và xóa Log Pipeline.',
              },
              {
                step: 3,
                badge: 'BƯỚC 3',
                title: 'Rà soát Nhật ký Truy cập (Security Audit)',
                desc: 'Kiểm tra AWS CloudTrail và nhật ký kết nối Database trong khoảng thời gian từ lúc commit được đẩy lên đến lúc thu hồi khóa để phát hiện truy cập trái phép.',
              },
              {
                step: 4,
                badge: 'BƯỚC 4',
                title: 'Thiết lập Rào chắn Tự động (Pre-commit & CI)',
                desc: 'Cài đặt pre-commit hook chạy gitleaks protect --staged ngay trên máy lập trình viên (chặn trước khi commit được tạo) kết hợp quét bắt buộc trên CI.',
              },
            ].map((s) => (
              <div
                key={s.step}
                className={cn(
                  'rounded-xl border p-4 space-y-2',
                  b3CompletedSteps.includes(s.step)
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-950'
                )}
              >
                <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                  {s.badge}
                </span>
                <h3 className="text-xs font-bold text-white">{s.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          MISSION B4: FLAKY TESTS QUARANTINE & FIXES
         ===================================================================== */}
      {selectedWarRoomId === 'warroom-b4-flaky-tests' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 space-y-5">
          <div>
            <span className="text-xs font-bold uppercase text-violet-400">
              Tình huống B4 (PDF Trang 19): Trị Dứt điểm "Flaky Tests" (Chạy 10 lần thì 2 lần Fail ngẫu nhiên)
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
              4 Nguyên nhân Gốc rễ & 3 Giải pháp Kỹ thuật Triệt để
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-rose-500/30 bg-slate-950 p-4 space-y-2.5">
              <div className="text-xs font-bold text-rose-300">
                🔍 4 Nguyên nhân Gốc rễ của Flaky Tests trên CI:
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <strong>1. Ô nhiễm dữ liệu (Shared State):</strong> Nhiều luồng test chạy song song cùng ghi/xóa chung một bảng Database.
                </li>
                <li>
                  <strong>2. Độ trễ bất đồng bộ (Async Race Condition):</strong> Dùng lệnh chờ cứng <code>sleep(1000)</code> nhưng CPU của CI Runner chậm hơn máy cá nhân.
                </li>
                <li>
                  <strong>3. Phụ thuộc múi giờ/thời gian:</strong> Máy cá nhân là <code>UTC+7</code> nhưng Container CI mặc định là <code>UTC+0</code>.
                </li>
                <li>
                  <strong>4. Gọi mạng ra dịch vụ bên ngoài:</strong> Phụ thuộc API bên thứ ba không ổn định.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-slate-950 p-4 space-y-2.5">
              <div className="text-xs font-bold text-emerald-300">
                🛠️ 3 Giải pháp Triệt để (Chuẩn Trang 19):
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                <li>
                  <strong>1. Cách ly ngay lập tức (Quarantine):</strong> Tách các bài test Flaky sang một Suite riêng có gắn nhãn theo dõi và bắt buộc sửa dứt điểm trong vòng <strong>48 giờ</strong>, không để làm tê liệt nhánh <code>main</code>.
                </li>
                <li>
                  <strong>2. Cô lập Database cho mỗi Worker:</strong> Dùng <strong>Testcontainers</strong> cấp phát DB riêng cho từng luồng hoặc bọc mỗi bài test trong một Database Transaction và gọi <code>ROLLBACK</code> ngay sau hàm <code>afterEach()</code>.
                </li>
                <li>
                  <strong>3. Chuẩn hóa Thời gian & Chờ đợi:</strong> Luôn đặt cứng biến môi trường <code>TZ=UTC</code> trong CI, dùng <code>FakeTimers</code> và thay mọi hàm <code>sleep()</code> cứng bằng cơ chế Polling có điều kiện (<code>waitFor()</code>).
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MISSION B5: 5 ERRORS "WORKS ON LOCAL, FAILS ON CI"
         ===================================================================== */}
      {selectedWarRoomId === 'warroom-b5-local-vs-ci' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 space-y-5">
          <div>
            <span className="text-xs font-bold uppercase text-sky-400">
              Tình huống B5 (PDF Trang 20): Chẩn đoán 5 Hiện tượng "Chạy trên máy cá nhân bình thường nhưng lên CI báo lỗi"
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
              Bấm vào từng Mã lỗi CI bên dưới để xem Nguyên nhân Khác biệt OS/Kiến trúc & Lệnh Khắc phục
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {B5_CASES.map((c, idx) => (
              <button
                key={idx}
                onClick={() => setB5SelectedCase(idx)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-bold transition-all',
                  b5SelectedCase === idx
                    ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                )}
              >
                {c.title}
              </button>
            ))}
          </div>

          <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="font-mono text-xs text-rose-400 font-bold">
              [CI Console Error Log]: {B5_CASES[b5SelectedCase].code}
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              <strong className="text-amber-300">Nguyên nhân khác biệt giữa Local và CI: </strong>
              {B5_CASES[b5SelectedCase].cause}
            </p>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
              <div className="text-xs font-bold text-emerald-300 mb-1">
                ✅ Cách khắc phục triệt để:
              </div>
              <pre className="font-mono text-xs text-emerald-200 overflow-x-auto">
                {B5_CASES[b5SelectedCase].fixCommand}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MISSION A1-A3 & B6: ARCHITECTURAL DECISIONS & AI PRIVACY
         ===================================================================== */}
      {selectedWarRoomId === 'warroom-a1-a3-b6-arch' && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
            <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
              Chuyên đề A1 (Trang 16)
            </span>
            <h3 className="text-sm font-bold text-white">
              Continuous Delivery vs. Deployment
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              • <strong>Bắt buộc dùng Delivery (Duyệt tay):</strong> Tài chính, Ngân hàng, Y tế (PCI-DSS, SOC2, ISO 27001) yêu cầu <em>Segregation of Duties</em> (người viết code và người bấm duyệt lên Prod phải độc lập).
              <br />• <strong>Dùng Deployment (Full Auto):</strong> SaaS đã có Automated Test đa tầng + Feature Flags + Canary Auto-Rollback.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
            <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              Chuyên đề A2 (Trang 16–17)
            </span>
            <h3 className="text-sm font-bold text-white">
              DinD vs. Socket Binding vs. Kaniko
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              • <strong>DinD (dind):</strong> Đòi hỏi <code>--privileged</code> → Nguy cơ Container Escape chiếm Host; mất Cache khi tắt Job.
              <br />• <strong>Docker Socket (/var/run/docker.sock):</strong> Nhanh nhưng script CI có toàn quyền xóa container khác hoặc mount <code>/</code> của Host!
              <br />• <strong>Kaniko / BuildKit Rootless:</strong> Đóng gói trong Userspace không cần Daemon, không cần <code>--privileged</code> (Chuẩn K8s!).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
            <span className="rounded bg-violet-500/20 border border-violet-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-300">
              Tình huống B6 (Trang 20–21)
            </span>
            <h3 className="text-sm font-bold text-white">
              Bảo mật & Giảm Nhiễu AI Review PR
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              • <strong>Bảo mật mã nguồn:</strong> Bật <em>Zero-Data Retention</em> hoặc triển khai <strong>Self-Hosted Qodo PR-Agent / GitLab Duo</strong> ngay trong CI Runner nội bộ kết nối AWS Bedrock Private VPC / vLLM.
              <br />• <strong>Giảm Noise:</strong> Để ESLint/Prettier bắt lỗi trình bày; đặt <code>profile: &quot;chill&quot;</code> và lọc <code>path_filters</code> trong <code>.coderabbit.yaml</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

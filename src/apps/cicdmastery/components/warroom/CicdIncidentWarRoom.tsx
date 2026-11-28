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
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';

const WARROOM_MISSIONS = [
  {
    id: 'warroom-b1-42min-pipeline',
    badge: 'Tình huống B1 (Trang 17–18)',
    badgeEn: 'Scenario B1 (Pages 17–18)',
    title: 'Giải cứu Pipeline Phình từ 4 Phút lên 42 Phút → Xuống Dưới 6 Phút',
    titleEn: 'Rescue a Bloated Pipeline from 42 Min → Under 6 Min',
    icon: <Gauge className="h-4 w-4" />,
    color: 'emerald',
  },
  {
    id: 'warroom-b2-race-condition',
    badge: 'Tình huống B2 (Trang 18)',
    badgeEn: 'Scenario B2 (Page 18)',
    title: 'Chống Ghi đè Phiên bản (Commit A cũ ghi đè lên Commit B mới trên Prod)',
    titleEn: 'Prevent Out-of-Order Deployment (Old Commit A Overwriting Commit B on Prod)',
    icon: <GitMerge className="h-4 w-4" />,
    color: 'amber',
  },
  {
    id: 'warroom-b3-secret-leak',
    badge: 'Tình huống B3 (Trang 19)',
    badgeEn: 'Scenario B3 (Page 19)',
    title: 'Ứng cứu Sự cố Lộ AWS Secret Key & DB Password trên Git + CI Log',
    titleEn: 'Incident Response: Leaked AWS Secret Key & DB Password in Git + CI Logs',
    icon: <KeyRound className="h-4 w-4" />,
    color: 'rose',
  },
  {
    id: 'warroom-b4-flaky-tests',
    badge: 'Tình huống B4 (Trang 19)',
    badgeEn: 'Scenario B4 (Page 19)',
    title: 'Trị Dứt điểm "Flaky Tests" (Chạy 10 lần thì 2 lần Fail ngẫu nhiên)',
    titleEn: 'Eliminate "Flaky Tests" (2 Random Failures out of Every 10 Runs)',
    icon: <Bug className="h-4 w-4" />,
    color: 'violet',
  },
  {
    id: 'warroom-b5-local-vs-ci',
    badge: 'Tình huống B5 (Trang 20)',
    badgeEn: 'Scenario B5 (Page 20)',
    title: '5 Lỗi Kinh điển "Works on Local, Fails on CI" (Exit 137, arm64, CRLF...)',
    titleEn: '5 Classic "Works on Local, Fails on CI" Errors (Exit 137, arm64, CRLF...)',
    icon: <Terminal className="h-4 w-4" />,
    color: 'sky',
  },
  {
    id: 'warroom-a1-a3-b6-arch',
    badge: 'Chuyên đề A1–A3 & B6 (Trang 16–21)',
    badgeEn: 'Topics A1–A3 & B6 (Pages 16–21)',
    title: 'Quyết định Kiến trúc: DinD vs. Kaniko, AI Review Privacy & Delivery vs. Deployment',
    titleEn: 'Architecture Decisions: DinD vs. Kaniko, AI Review Privacy & Delivery vs. Deployment',
    icon: <Cpu className="h-4 w-4" />,
    color: 'cyan',
  },
] as const;

export const CicdIncidentWarRoom: React.FC = () => {
  const lang = useWorkbenchStore((s) => s.language);
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
      title:
        lang === 'en'
          ? '1. Module not found even though the file exists'
          : '1. Lỗi Module not found dù file vẫn tồn tại',
      cause:
        lang === 'en'
          ? 'macOS/Windows filesystems are case-insensitive by default, whereas Linux on CI is strictly case-sensitive (UserSvc.ts != usersvc.ts). When renaming case on Mac, Git ignores it by default!'
          : 'macOS/Windows mặc định KHÔNG phân biệt chữ Hoa - Thường trong tên file, còn Linux trên CI phân biệt tuyệt đối (UserSvc.ts khác usersvc.ts). Khi dev đổi tên file trên Mac, Git mặc định lờ đi!',
      fixCommand:
        lang === 'en'
          ? 'git config core.ignorecase false\n# Combine with ESLint rule: "import/no-unresolved": "error"'
          : 'git config core.ignorecase false\n# Kết hợp quy tắc ESLint: "import/no-unresolved": "error"',
    },
    {
      code: 'Command failed with exit code 137 (SIGKILL)',
      title:
        lang === 'en'
          ? '2. Process killed with Exit code 137'
          : '2. Tiến trình tự ngắt với Exit code 137',
      cause:
        lang === 'en'
          ? 'Exit 137 = 128 + 9 (SIGKILL): The build/test process exceeded the Container memory limit and was immediately terminated by the Linux Kernel OOM Killer.'
          : 'Mã 137 = 128 + 9 (SIGKILL): Tiến trình build/test ngốn vượt trần RAM của Container nên bị Linux Kernel OOM Killer tiêu diệt ngay lập tức.',
      fixCommand:
        lang === 'en'
          ? 'NODE_OPTIONS="--max-old-space-size=3072" npx jest --maxWorkers=2\n# Or increase the RAM limit for the CI Runner Container'
          : 'NODE_OPTIONS="--max-old-space-size=3072" npx jest --maxWorkers=2\n# Hoặc tăng giới hạn RAM cho CI Runner Container',
    },
    {
      code: 'standard_init_linux.go: exec user process caused: exec format error',
      title:
        lang === 'en'
          ? '3. Exec format error or C++ native addon failure (bcrypt / sharp)'
          : '3. Lỗi Exec format error hoặc lỗi thư viện C++ (bcrypt / sharp)',
      cause:
        lang === 'en'
          ? 'A developer on Apple Silicon (arm64) accidentally bundled macOS/arm64 binaries in node_modules into a Docker Image or Cache used by Linux (amd64) CI runners.'
          : 'Lập trình viên dùng máy Mac chip Apple Silicon (arm64) đóng gói nhầm các file thực thi nhị phân trong node_modules vào Docker Image hoặc Cache của CI chạy Linux (amd64).',
      fixCommand:
        lang === 'en'
          ? '# Always add node_modules to .dockerignore:\necho "node_modules" >> .dockerignore\n# Let Docker compile Native Addons inside the Linux CI environment!'
          : '# Luôn thêm node_modules vào file .dockerignore:\necho "node_modules" >> .dockerignore\n# Để Docker tự biên dịch lại Native Addons bên trong môi trường Linux của CI!',
    },
    {
      code: 'Job execution timed out after 60 minutes (Waiting at prompt: ? Are you sure [Y/n])',
      title:
        lang === 'en'
          ? '4. Job hangs until timeout'
          : '4. Job đứng im cho đến khi hết giờ (Timeout)',
      cause:
        lang === 'en'
          ? 'A CLI tool paused waiting for interactive keyboard confirmation [Y/n] (Interactive TTY Prompt), but CI has no interactive terminal.'
          : 'Công cụ CLI dừng lại chờ người dùng nhập phím xác nhận [Y/n] (Interactive TTY Prompt) nhưng trên CI không có bàn phím.',
      fixCommand: 'env:\n  CI: "true"\nrun: npx prisma migrate deploy --non-interactive --yes',
    },
    {
      code: '/bin/sh: ./scripts/deploy.sh: /bin/sh^M: bad interpreter: No such file or directory',
      title:
        lang === 'en'
          ? '5. /bin/sh^M: bad interpreter error'
          : '5. Lỗi /bin/sh^M: bad interpreter',
      cause:
        lang === 'en'
          ? 'Windows saved the .sh script with CRLF (\\r\\n) line endings, causing the Linux shell interpreter to treat \\r (^M) as part of the /bin/sh binary path.'
          : 'Máy Windows lưu file script .sh với ký tự xuống dòng CRLF (\\r\\n) khiến trình thông dịch Shell trên Linux hiểu nhầm ký tự \\r (^M) là một phần của tên chương trình /bin/sh.',
      fixCommand:
        lang === 'en'
          ? '# Create a .gitattributes file at the Git repository root:\n*.sh text eol=lf'
          : '# Tạo file .gitattributes ở thư mục gốc của kho Git:\n*.sh text eol=lf',
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-2.5 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-16">
      {/* Banner */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-slate-900 to-amber-500/10 p-4 sm:p-6 space-y-1.5 sm:space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-400">
          <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <span>
            {lang === 'en'
              ? 'Production Incident & Architecture Simulation Room (Part II — Pages 16–21)'
              : 'Phòng Mô phỏng Tình huống Thực chiến & Sự cố (Phần II — Trang 16–21)'}
          </span>
        </div>
        <h1 className="text-base sm:text-2xl font-extrabold text-white leading-snug">
          {lang === 'en'
            ? 'Incident War-Room: Diagnose & Resolve 10 CI/CD Architecture & Incident Scenarios'
            : 'Incident War-Room: Chẩn đoán & Giải quyết 10 Tình huống Kiến trúc & Sự cố CI/CD'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-4xl">
          {lang === 'en'
            ? 'Swipe or select a scenario (A1–A3 & B1–B7) below to toggle optimization configs and inspect live code diffs.'
            : 'Vuốt ngang chọn tình huống (A1–A3 & B1–B7) bên dưới để bật/tắt cấu hình tối ưu và xem Code thay đổi trực tiếp.'}
        </p>
      </div>

      {/* Mission Selector Tabs (Touch Horizontal Carousel on Mobile, Grid on sm+) */}
      <div className="flex sm:grid gap-2.5 overflow-x-auto no-scrollbar snap-x pb-1 sm:grid-cols-2 lg:grid-cols-3">
        {WARROOM_MISSIONS.map((m) => {
          const active = selectedWarRoomId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => selectWarRoom(m.id)}
              className={cn(
                'w-[265px] sm:w-auto shrink-0 snap-start rounded-xl border p-3 sm:p-3.5 text-left transition-all flex flex-col justify-between gap-2',
                active
                  ? 'border-cyan-400 bg-cyan-500/15 text-white ring-2 ring-cyan-400/50 shadow-md'
                  : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded bg-slate-950 border border-slate-700 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                  {m.icon}
                  {lang === 'en' ? m.badgeEn : m.badge}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold leading-snug">
                {lang === 'en' ? m.titleEn : m.title}
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
          <div className="min-w-0 lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {lang === 'en'
                ? 'Scenario B1 (Pages 17–18): Enable 6 Pipeline Bottleneck Optimizations'
                : 'Tình huống B1 (Trang 17–18): Bật 6 Kỹ thuật Tối ưu Điểm nghẽn Pipeline'}
            </div>
            <p className="text-xs text-slate-300">
              {lang === 'en' ? (
                <>
                  The pipeline originally took 4 minutes, but after 1 year it bloated to{' '}
                  <strong>42 minutes</strong>. Toggle all 6 optimizations below to bring execution time under 6 minutes:
                </>
              ) : (
                <>
                  Pipeline ban đầu chạy mất 4 phút nhưng sau 1 năm đã phình lên <strong>42 phút</strong>. Hãy lần lượt tích chọn cả 6 bước tối ưu dưới đây để xem thời gian thực thi giảm xuống dưới 6 phút:
                </>
              )}
            </p>

            <div className="space-y-2.5">
              {[
                {
                  key: 'cachePullOnly',
                  title:
                    lang === 'en'
                      ? '1. Enable Dependency Cache (hashFiles lockfile) with policy: pull-only (-6.5 min)'
                      : '1. Bật Dependency Cache (hashFiles lockfile) với policy: pull-only (-6.5 phút)',
                  desc:
                    lang === 'en'
                      ? 'Only the first Job uses pull-push; subsequent Jobs only pull so they skip re-compressing dependencies.'
                      : 'Chỉ Job đầu tiên pull-push, các Job sau chỉ pull để không tốn thời gian nén lại thư viện.',
                },
                {
                  key: 'dockerfileLayerOrder',
                  title:
                    lang === 'en'
                      ? '2. Reorder Dockerfile Layer Caching (-5.5 min)'
                      : '2. Sắp xếp lại thứ tự Dockerfile Layer Caching (-5.5 phút)',
                  desc:
                    lang === 'en'
                      ? 'Place COPY package*.json ./ and RUN npm ci before COPY src/ ./src/ to reuse 100% of the node_modules layer.'
                      : 'Đặt COPY package*.json ./ và RUN npm ci ở layer trước, COPY src/ ./src/ ở layer sau để tái sử dụng 100% layer node_modules.',
                },
                {
                  key: 'multistageDockerignore',
                  title:
                    lang === 'en'
                      ? '3. Use Multi-stage Build + .dockerignore (-7.0 min)'
                      : '3. Dùng Multi-stage Build + .dockerignore (-7.0 phút)',
                  desc:
                    lang === 'en'
                      ? 'Exclude .git, node_modules, and coverage to shrink Image size from >1GB to ~100MB, making push/pull 10x faster.'
                      : 'Loại bỏ .git, node_modules, coverage để giảm dung lượng Image từ >1GB xuống ~100MB, đẩy/kéo mạng nhanh gấp 10 lần.',
                },
                {
                  key: 'dagAndSharding6x',
                  title:
                    lang === 'en'
                      ? '4. Switch to DAG Graph (needs) & Test Sharding parallel: 6 (-14.5 min)'
                      : '4. Chuyển sang Đồ thị DAG (needs) & Test Sharding parallel: 6 (-14.5 phút)',
                  desc:
                    lang === 'en'
                      ? 'Run Lint, SAST, and Unit Tests concurrently from t=0; split heavy Integration Tests across 6 parallel shards.'
                      : 'Cho phép Lint, SAST, Unit Test chạy đồng thời ngay từ đầu; chia bộ Integration Test nặng thành 6 luồng song song.',
                },
                {
                  key: 'failFastLinter',
                  title:
                    lang === 'en'
                      ? '5. Add a 15-second Fail-Fast Gate at Pipeline Start (-1.5 min)'
                      : '5. Thiết kế chốt Fail-Fast 15 giây ở đầu Pipeline (-1.5 phút)',
                  desc:
                    lang === 'en'
                      ? 'Run lightweight Linter & Typecheck first; fail immediately on syntax errors before spinning up DB containers.'
                      : 'Đặt Linter & Typecheck siêu nhẹ lên đầu tiên; nếu lỗi cú pháp thì dừng ngay trước khi khởi tạo container DB.',
                },
                {
                  key: 'nvmeAndRegistryMirror',
                  title:
                    lang === 'en'
                      ? '6. Upgrade to NVMe Self-hosted Runners + VPC Registry Mirror (-2.2 min)'
                      : '6. Nâng cấp Self-hosted Runner NVMe + VPC Registry Mirror (-2.2 phút)',
                  desc:
                    lang === 'en'
                      ? 'Attach high-speed NVMe SSDs and host a Registry Mirror inside the private VPC network.'
                      : 'Gắn ổ cứng NVMe tốc độ cao và đặt Registry Mirror ngay trong mạng nội bộ VPC.',
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

          <div className="min-w-0 lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase text-cyan-400">
                  {lang === 'en'
                    ? 'Pipeline Execution Timeline Profiler'
                    : 'Đồng hồ Đo Thời gian Thực thi Pipeline (Timeline Profiler)'}
                </div>
                <div className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'SLA Target: Reduce execution time from 42.0 min to under 6.0 min'
                    : 'Mục tiêu SLA: Đưa thời gian từ 42.0 phút xuống dưới 6.0 phút'}
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
                {b1TotalMinutes} {lang === 'en' ? 'min' : 'phút'}
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
                <span>{lang === 'en' ? '0 min' : '0 phút'}</span>
                <span className="text-emerald-400 font-bold">
                  {lang === 'en' ? 'SLA Target: < 6 min' : 'Đích SLA: < 6 phút'}
                </span>
                <span>{lang === 'en' ? 'Baseline: 42 min' : 'Ban đầu: 42 phút'}</span>
              </div>
            </div>

            <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-cyan-400 font-bold">
                  {lang === 'en'
                    ? '# Live .gitlab-ci.yml & Dockerfile Diff Based on Your 6 Toggles:'
                    : '# Code .gitlab-ci.yml & Dockerfile Biến đổi Trực tiếp Theo 6 Công tắc Bạn Chọn:'}
                </span>
                <span className="text-[10px] text-emerald-300">
                  Live Code Diff
                </span>
              </div>
              <pre className="text-slate-200 overflow-x-auto leading-relaxed max-h-80">
{`# === 1. CẤU HÌNH PIPELINE (.gitlab-ci.yml) ===
${
  b1Opts.failFastLinter
    ? `# ✅ [Bước 5: Fail-Fast 15s] Chặn ngay từ đầu nếu sai cú pháp:
lint_fast_gate:
  stage: validate
  script: [npm run lint, npm run typecheck]`
    : `# ❌ [Chưa bật Bước 5] Không có chốt chặn Linter sớm -> Lỗi cú pháp vẫn khởi tạo DB nặng nề!`
}

unit_and_integration_test:
  stage: test
${
  b1Opts.dagAndSharding6x
    ? `  needs: []          # ✅ [Bước 4: Đồ thị DAG] Chạy ngay lập tức, không chờ tuần tự!
  parallel: 6        # ✅ [Bước 4: Test Sharding] Chia 6 luồng chạy song song (--shard=1/6..6/6)`
    : `  # ❌ [Chưa bật Bước 4] Chạy tuần tự trên 1 máy duy nhất (Tốn 18 phút!)`
}
${
  b1Opts.nvmeAndRegistryMirror
    ? `  tags: [self-hosted-nvme, vpc-registry-mirror] # ✅ [Bước 6] Ổ NVMe + Mirror nội bộ`
    : `  tags: [shared-hdd-runner]                     # ❌ [Chưa bật Bước 6] Ổ đĩa chậm, kéo mạng ngoài`
}
${
  b1Opts.cachePullOnly
    ? `  cache:
    key: { files: [package-lock.json] }
    paths: [.npm/]
    policy: pull     # ✅ [Bước 1] Chỉ kéo Cache về dùng, KHÔNG tốn 4 phút nén đẩy lại!`
    : `  # ❌ [Chưa bật Bước 1] Tải mới toàn bộ node_modules từ Internet hoặc nén lại Cache thừa!`
}

# === 2. CẤU HÌNH DOCKERFILE (Bước 2 & Bước 3) ===
${
  b1Opts.multistageDockerignore
    ? `FROM node:20-alpine AS builder  # ✅ [Bước 3] Multi-stage + .dockerignore (Image ~95MB)`
    : `FROM node:20                    # ❌ [Chưa bật Bước 3] Single-stage phình to 1.2GB!`
}
WORKDIR /app
${
  b1Opts.dockerfileLayerOrder
    ? `# ✅ [Bước 2] Copy lockfile trước -> Tái sử dụng 100% Layer Cache npm ci (0 giây):
COPY package.json package-lock.json ./
RUN npm ci
COPY src/ ./src/`
    : `# ❌ [Chưa bật Bước 2] Đặt COPY . . lên đầu -> Sửa 1 dòng code cũng làm vỡ sạch Cache!
COPY . .
RUN npm ci`
}`}
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
                {lang === 'en'
                  ? 'Scenario B2 (PDF Page 18): Deployment Race Condition (Out-of-order Deployment)'
                  : 'Tình huống B2 (PDF Trang 18): Hiện tượng Deployment Race Condition (Out-of-order Deployment)'}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                {lang === 'en'
                  ? 'Commit A merges first (t=0s), Commit B merges later (t=30s) — Why did A overwrite B?'
                  : 'Commit A merge trước (t=0s), Commit B merge sau (t=30s) — Tại sao A lại ghi đè làm mất code mới của B?'}
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
                ? lang === 'en'
                  ? '✅ Sequential Lock ENABLED (group: production-deploy-lock, cancel-in-progress: false)'
                  : '✅ Đang BẬT Khóa Tuần tự (group: production-deploy-lock, cancel-in-progress: false)'
                : lang === 'en'
                ? '🚨 Concurrency Lock DISABLED (2 Pipelines racing — Click to Enable Lock!)'
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
                {lang === 'en'
                  ? '❌ Critical Risk WITHOUT Sequential CD Lock:'
                  : '❌ Rủi ro nghiêm trọng khi KHÔNG có Khóa Tuần tự CD:'}
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200 font-mono">
                <li>
                  {lang === 'en'
                    ? '• [t=00s] Dev 1 merges PR #1 (Commit A - older) → Pipeline A runs on a slower Runner.'
                    : '• [t=00s] Dev 1 merge PR #1 (Commit A - cũ) → Pipeline A chạy trên Runner chậm.'}
                </li>
                <li>
                  {lang === 'en'
                    ? '• [t=30s] Dev 2 merges PR #2 (Commit B - newer) → Pipeline B runs on a faster Runner.'
                    : '• [t=30s] Dev 2 merge PR #2 (Commit B - mới) → Pipeline B chạy trên Runner nhanh hơn.'}
                </li>
                <li>
                  {lang === 'en'
                    ? '• [t=180s] Pipeline B finishes first → Deploys newer code (B) to Production!'
                    : '• [t=180s] Pipeline B xong trước → Đẩy code mới (B) lên Production thành công!'}
                </li>
                <li className="text-rose-300 font-bold">
                  {lang === 'en'
                    ? '• [t=240s] Pipeline A finally finishes → Deploys older code (A), overwriting newer code (B) on Production!'
                    : '• [t=240s] Pipeline A bây giờ mới xong → Chạy lệnh Deploy ghi đè code cũ (A) đè lên code mới (B) trên Production!'}
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
                {lang === 'en'
                  ? '✅ Mandatory Technical Solution (Page 18 Principle):'
                  : '✅ Giải pháp Kỹ thuật Bắt buộc (Nguyên tắc quan trọng Trang 18):'}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {lang === 'en' ? (
                  <>
                    1. For CI test jobs on PR branches: enable <code>cancel-in-progress: true</code> to cancel stale runs and save runner minutes.
                    <br />
                    2. For Production CD deploy jobs: NEVER force-cancel (<code>cancel-in-progress: false</code>) because aborting mid-Helm/Terraform run corrupts infrastructure state (State Lock Corruption). Instead, queue them sequentially (<code>production-deploy-lock</code> or GitLab <code>resource_group</code> with <code>process_mode=newest_first</code>)!
                  </>
                ) : (
                  <>
                    1. Đối với Job kiểm thử (CI) trên nhánh PR: bật <code>cancel-in-progress: true</code> để hủy bản cũ tiết kiệm tài nguyên.
                    <br />
                    2. Đối với Job Deploy lên Production (CD): tuyệt đối <strong>KHÔNG hủy ngang</strong> (<code>cancel-in-progress: false</code>) vì ngắt đột ngột khi Helm/Terraform đang chạy dở sẽ làm hỏng trạng thái hạ tầng (State Lock Corruption). Thay vào đó, đưa vào hàng đợi khóa tuần tự (<code>production-deploy-lock</code> hoặc GitLab <code>resource_group</code> với <code>process_mode=newest_first</code>)!
                  </>
                )}
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
              {lang === 'en'
                ? 'Scenario B3 (PDF Page 19): Leaked Database Password & AWS Secret Key in Git and CI Logs'
                : 'Tình huống B3 (PDF Trang 19): Lộ Database Password & AWS Secret Key lên Git và CI Log'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              {lang === 'en'
                ? 'Why is running git rm and creating a new commit completely USELESS?'
                : 'Tại sao chạy lệnh git rm rồi tạo commit mới hoàn toàn VÔ TÁC DỤNG?'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setB3TriedGitRm(true)}
              className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/25"
            >
              {lang === 'en'
                ? 'Try the wrong way: git rm .env && git commit -m "remove secret"'
                : 'Thử chạy sai cách: git rm .env && git commit -m "remove secret"'}
            </button>
            <button
              onClick={() => setB3CompletedSteps([1, 2, 3, 4])}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
            >
              {lang === 'en'
                ? 'Execute Standard 4-Step Incident Response (In Priority Order)'
                : 'Thực thi Quy trình 4 Bước Ứng cứu Chuẩn (Theo đúng thứ tự ưu tiên)'}
            </button>
          </div>

          {b3TriedGitRm && (
            <div className="rounded-xl border border-rose-500 bg-rose-950/40 p-4 text-xs font-mono text-rose-200 space-y-1">
              <div className="font-bold text-rose-300">
                {lang === 'en'
                  ? '🚨 TECHNICAL ALERT: An attacker just ran `git log -p -n 2` and extracted every password!'
                  : '🚨 CẢNH BÁO KỸ THUẬT: Kẻ tấn công vừa chạy lệnh `git log -p -n 2` và lấy được toàn bộ mật khẩu!'}
              </div>
              <div>
                {lang === 'en'
                  ? 'Technical Fact (PDF Page 19): Running `git rm` and creating a new commit provides zero security, because the entire secret string remains intact inside `.git/objects` of the previous commit!'
                  : 'Khẳng định kỹ thuật (PDF Trang 19): Chạy lệnh `git rm` rồi tạo commit mới hoàn toàn không có tác dụng bảo mật, vì toàn bộ chuỗi mật khẩu vẫn nằm nguyên vẹn trong lịch sử `.git/objects` của commit trước đó!'}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: 1,
                badge:
                  lang === 'en'
                    ? 'STEP 1 (TOP PRIORITY)'
                    : 'BƯỚC 1 (ƯU TIÊN SỐ 1)',
                title:
                  lang === 'en'
                    ? 'Revoke & Rotate Keys Immediately'
                    : 'Thu hồi & Xoay vòng Khóa ngay (Revoke & Rotate First)',
                desc:
                  lang === 'en'
                    ? 'Treat any secret that touched Git as permanently compromised. Immediately deactivate the AWS Access Key in IAM, change the DB password, and rotate JWT keys BEFORE cleaning Git!'
                    : 'Coi mọi thông tin chạm vào Git là đã lộ hoàn toàn. Lập tức vô hiệu hóa AWS Access Key trên IAM, đổi mật khẩu DB và thay khóa JWT TRƯỚC KHI dọn Git!',
              },
              {
                step: 2,
                badge: lang === 'en' ? 'STEP 2' : 'BƯỚC 2',
                title:
                  lang === 'en'
                    ? 'Purge from Git History & CI Console Logs'
                    : 'Xóa Vĩnh viễn khỏi Lịch sử Git & CI Console Logs',
                desc:
                  lang === 'en'
                    ? 'Use git-filter-repo to rewrite repository history, remove the secret blob across all branches, run git push --force --all, and delete CI Pipeline logs.'
                    : 'Dùng công cụ git-filter-repo để viết lại lịch sử kho chứa, loại bỏ hoàn toàn blob chứa mật khẩu trên mọi nhánh, chạy git push --force --all và xóa Log Pipeline.',
              },
              {
                step: 3,
                badge: lang === 'en' ? 'STEP 3' : 'BƯỚC 3',
                title:
                  lang === 'en'
                    ? 'Audit Access Logs (Security Audit)'
                    : 'Rà soát Nhật ký Truy cập (Security Audit)',
                desc:
                  lang === 'en'
                    ? 'Inspect AWS CloudTrail and Database connection logs from the moment the commit was pushed until key revocation to detect unauthorized access.'
                    : 'Kiểm tra AWS CloudTrail và nhật ký kết nối Database trong khoảng thời gian từ lúc commit được đẩy lên đến lúc thu hồi khóa để phát hiện truy cập trái phép.',
              },
              {
                step: 4,
                badge: lang === 'en' ? 'STEP 4' : 'BƯỚC 4',
                title:
                  lang === 'en'
                    ? 'Enforce Automated Guardrails (Pre-commit & CI)'
                    : 'Thiết lập Rào chắn Tự động (Pre-commit & CI)',
                desc:
                  lang === 'en'
                    ? 'Install pre-commit hooks running gitleaks protect --staged locally (blocking before commit creation) combined with mandatory CI scanning.'
                    : 'Cài đặt pre-commit hook chạy gitleaks protect --staged ngay trên máy lập trình viên (chặn trước khi commit được tạo) kết hợp quét bắt buộc trên CI.',
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
              {lang === 'en'
                ? 'Scenario B4 (PDF Page 19): Eliminate "Flaky Tests" (2 Random Failures per 10 Runs)'
                : 'Tình huống B4 (PDF Trang 19): Trị Dứt điểm "Flaky Tests" (Chạy 10 lần thì 2 lần Fail ngẫu nhiên)'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
              {lang === 'en'
                ? '4 Root Causes & 3 Definitive Technical Fixes'
                : '4 Nguyên nhân Gốc rễ & 3 Giải pháp Kỹ thuật Triệt để'}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-rose-500/30 bg-slate-950 p-4 space-y-2.5">
              <div className="text-xs font-bold text-rose-300">
                {lang === 'en'
                  ? '🔍 4 Root Causes of Flaky Tests in CI:'
                  : '🔍 4 Nguyên nhân Gốc rễ của Flaky Tests trên CI:'}
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  {lang === 'en' ? (
                    <>
                      <strong>1. Shared State Pollution:</strong> Multiple parallel test workers read/write/delete from the same Database table simultaneously.
                    </>
                  ) : (
                    <>
                      <strong>1. Ô nhiễm dữ liệu (Shared State):</strong> Nhiều luồng test chạy song song cùng ghi/xóa chung một bảng Database.
                    </>
                  )}
                </li>
                <li>
                  {lang === 'en' ? (
                    <>
                      <strong>2. Async Race Conditions:</strong> Hardcoded <code>sleep(1000)</code> waits fail when CI Runner CPUs are slower than local laptops.
                    </>
                  ) : (
                    <>
                      <strong>2. Độ trễ bất đồng bộ (Async Race Condition):</strong> Dùng lệnh chờ cứng <code>sleep(1000)</code> nhưng CPU của CI Runner chậm hơn máy cá nhân.
                    </>
                  )}
                </li>
                <li>
                  {lang === 'en' ? (
                    <>
                      <strong>3. Timezone / Clock Drift:</strong> Local machine runs <code>UTC+7</code> while CI containers default to <code>UTC+0</code>.
                    </>
                  ) : (
                    <>
                      <strong>3. Phụ thuộc múi giờ/thời gian:</strong> Máy cá nhân là <code>UTC+7</code> nhưng Container CI mặc định là <code>UTC+0</code>.
                    </>
                  )}
                </li>
                <li>
                  {lang === 'en' ? (
                    <>
                      <strong>4. External Network Calls:</strong> Depending on unstable third-party APIs during automated tests.
                    </>
                  ) : (
                    <>
                      <strong>4. Gọi mạng ra dịch vụ bên ngoài:</strong> Phụ thuộc API bên thứ ba không ổn định.
                    </>
                  )}
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-slate-950 p-4 space-y-2.5">
              <div className="text-xs font-bold text-emerald-300">
                {lang === 'en'
                  ? '🛠️ 3 Definitive Fixes (Page 19 Standard):'
                  : '🛠️ 3 Giải pháp Triệt để (Chuẩn Trang 19):'}
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                <li>
                  {lang === 'en' ? (
                    <>
                      <strong>1. Immediate Quarantine:</strong> Isolate flaky tests into a tracked quarantine suite with a strict <strong>48-hour SLA</strong> to fix, preventing them from blocking <code>main</code>.
                    </>
                  ) : (
                    <>
                      <strong>1. Cách ly ngay lập tức (Quarantine):</strong> Tách các bài test Flaky sang một Suite riêng có gắn nhãn theo dõi và bắt buộc sửa dứt điểm trong vòng <strong>48 giờ</strong>, không để làm tê liệt nhánh <code>main</code>.
                    </>
                  )}
                </li>
                <li>
                  {lang === 'en' ? (
                    <>
                      <strong>2. Per-Worker Database Isolation:</strong> Use <strong>Testcontainers</strong> to spin up isolated DBs per worker, or wrap each test in a Database Transaction and call <code>ROLLBACK</code> in <code>afterEach()</code>.
                    </>
                  ) : (
                    <>
                      <strong>2. Cô lập Database cho mỗi Worker:</strong> Dùng <strong>Testcontainers</strong> cấp phát DB riêng cho từng luồng hoặc bọc mỗi bài test trong một Database Transaction và gọi <code>ROLLBACK</code> ngay sau hàm <code>afterEach()</code>.
                    </>
                  )}
                </li>
                <li>
                  {lang === 'en' ? (
                    <>
                      <strong>3. Normalize Time & Polling:</strong> Pin <code>TZ=UTC</code> in CI, use <code>FakeTimers</code>, and replace hardcoded <code>sleep()</code> calls with conditional polling (<code>waitFor()</code>).
                    </>
                  ) : (
                    <>
                      <strong>3. Chuẩn hóa Thời gian & Chờ đợi:</strong> Luôn đặt cứng biến môi trường <code>TZ=UTC</code> trong CI, dùng <code>FakeTimers</code> và thay mọi hàm <code>sleep()</code> cứng bằng cơ chế Polling có điều kiện (<code>waitFor()</code>).
                    </>
                  )}
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
              {lang === 'en'
                ? 'Scenario B5 (PDF Page 20): Diagnose 5 "Works on Local, Fails on CI" Issues'
                : 'Tình huống B5 (PDF Trang 20): Chẩn đoán 5 Hiện tượng "Chạy trên máy cá nhân bình thường nhưng lên CI báo lỗi"'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
              {lang === 'en'
                ? 'Click each CI Error below to inspect OS/Architecture Root Cause & Fix Command'
                : 'Bấm vào từng Mã lỗi CI bên dưới để xem Nguyên nhân Khác biệt OS/Kiến trúc & Lệnh Khắc phục'}
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
              <strong className="text-amber-300">
                {lang === 'en'
                  ? 'Root cause difference between Local and CI: '
                  : 'Nguyên nhân khác biệt giữa Local và CI: '}
              </strong>
              {B5_CASES[b5SelectedCase].cause}
            </p>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
              <div className="text-xs font-bold text-emerald-300 mb-1">
                {lang === 'en' ? '✅ Definitive Fix:' : '✅ Cách khắc phục triệt để:'}
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
              {lang === 'en' ? 'Topic A1 (Page 16)' : 'Chuyên đề A1 (Trang 16)'}
            </span>
            <h3 className="text-sm font-bold text-white">
              Continuous Delivery vs. Deployment
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'en' ? (
                <>
                  • <strong>Delivery Required (Manual Gate):</strong> Finance, Banking, Healthcare (PCI-DSS, SOC2, ISO 27001) mandate <em>Segregation of Duties</em> (code author and production approver must be independent).
                  <br />• <strong>Deployment (Full Auto):</strong> SaaS with multi-layer Automated Tests + Feature Flags + Canary Auto-Rollback.
                </>
              ) : (
                <>
                  • <strong>Bắt buộc dùng Delivery (Duyệt tay):</strong> Tài chính, Ngân hàng, Y tế (PCI-DSS, SOC2, ISO 27001) yêu cầu <em>Segregation of Duties</em> (người viết code và người bấm duyệt lên Prod phải độc lập).
                  <br />• <strong>Dùng Deployment (Full Auto):</strong> SaaS đã có Automated Test đa tầng + Feature Flags + Canary Auto-Rollback.
                </>
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
            <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              {lang === 'en' ? 'Topic A2 (Pages 16–17)' : 'Chuyên đề A2 (Trang 16–17)'}
            </span>
            <h3 className="text-sm font-bold text-white">
              DinD vs. Socket Binding vs. Kaniko
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'en' ? (
                <>
                  • <strong>DinD (dind):</strong> Requires <code>--privileged</code> → Container Escape risk on Host; loses Cache when Job ends.
                  <br />• <strong>Docker Socket (/var/run/docker.sock):</strong> Fast, but CI scripts gain full power to delete other containers or mount Host <code>/</code>!
                  <br />• <strong>Kaniko / BuildKit Rootless:</strong> Builds in Userspace without a Daemon or <code>--privileged</code> (K8s Standard!).
                </>
              ) : (
                <>
                  • <strong>DinD (dind):</strong> Đòi hỏi <code>--privileged</code> → Nguy cơ Container Escape chiếm Host; mất Cache khi tắt Job.
                  <br />• <strong>Docker Socket (/var/run/docker.sock):</strong> Nhanh nhưng script CI có toàn quyền xóa container khác hoặc mount <code>/</code> của Host!
                  <br />• <strong>Kaniko / BuildKit Rootless:</strong> Đóng gói trong Userspace không cần Daemon, không cần <code>--privileged</code> (Chuẩn K8s!).
                </>
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
            <span className="rounded bg-violet-500/20 border border-violet-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-300">
              {lang === 'en' ? 'Scenario B6 (Pages 20–21)' : 'Tình huống B6 (Trang 20–21)'}
            </span>
            <h3 className="text-sm font-bold text-white">
              {lang === 'en'
                ? 'AI PR Review Privacy & Noise Reduction'
                : 'Bảo mật & Giảm Nhiễu AI Review PR'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'en' ? (
                <>
                  • <strong>Source Code Privacy:</strong> Enable <em>Zero-Data Retention</em> or deploy <strong>Self-Hosted Qodo PR-Agent / GitLab Duo</strong> inside private CI Runners connected to AWS Bedrock Private VPC / vLLM.
                  <br />• <strong>Reduce Noise:</strong> Let ESLint/Prettier catch formatting; set <code>profile: &quot;chill&quot;</code> and configure <code>path_filters</code> in <code>.coderabbit.yaml</code>.
                </>
              ) : (
                <>
                  • <strong>Bảo mật mã nguồn:</strong> Bật <em>Zero-Data Retention</em> hoặc triển khai <strong>Self-Hosted Qodo PR-Agent / GitLab Duo</strong> ngay trong CI Runner nội bộ kết nối AWS Bedrock Private VPC / vLLM.
                  <br />• <strong>Giảm Noise:</strong> Để ESLint/Prettier bắt lỗi trình bày; đặt <code>profile: &quot;chill&quot;</code> và lọc <code>path_filters</code> trong <code>.coderabbit.yaml</code>.
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

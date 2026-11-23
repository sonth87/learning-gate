import type { BilingualText, CalloutKind } from '@/components/scale-workbench/types';
import type { ModuleCuratedBlueprint } from '@/features/devops-course/scale/courseLessonBuilder';

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

const callout = (
  kind: CalloutKind,
  viTitle: string,
  enTitle: string,
  viText: string,
  enText: string
) => ({
  kind,
  title: bi(viTitle, enTitle),
  text: bi(viText, enText),
});

export const CICD_LEVEL_TITLES: Record<number, BilingualText> = {
  0: bi('Nền tảng Tự động hóa & Chiến lược Nhánh Git', 'Automation Mindset & Git Branching'),
  1: bi('Xây dựng GitHub Actions Workflow Cơ bản', 'Practical GitHub Actions Workflows'),
  2: bi('Tối ưu Pipeline: Cache, DAG & GitLab CI', 'Speed: Cache, DAG, Artifacts & GitLab CI'),
  3: bi('DevSecOps, Least Privilege & Keyless OIDC', 'DevSecOps, Least Privilege & Keyless OIDC'),
  4: bi('Canary, Blue-Green & Pull-Based GitOps', 'Zero-Downtime Delivery & Argo CD GitOps'),
  5: bi('DB Migration, Monorepo, DORA & Sự cố', 'DB Migrations, Monorepo, DORA & Incidents'),
};

export const CICD_BLUEPRINTS: Record<string, ModuleCuratedBlueprint> = {
  C00: {
    id: 'C00',
    titleEn: 'From CLI Basics to Deterministic CI Gates (Exit Codes)',
    subtitleEn: 'Understand Pull Requests, Ephemeral Runners, and universal POSIX exit codes (0 = pass, != 0 = fail-fast).',
    durationMin: 12,
    difficulty: 'Beginner',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Nắm vững các khái niệm cốt lõi: Pull Request (PR), Webhook Trigger, Ephemeral Runner và quy luật Exit Code == 0 (đạt), != 0 (thất bại) trên Node, Python, Go, Java',
        'Understand PRs, Webhook Triggers, Ephemeral Runners, and universal Exit Code 0 vs non-zero gating across Node, Python, Go & Java'
      ),
      bi(
        'Phân biệt rõ CI, Continuous Delivery (sẵn sàng phát hành với bước phê duyệt thủ công) và Continuous Deployment (tự động triển khai lên Production)',
        'Distinguish CI from Continuous Delivery (1-click approval to Prod) and Continuous Deployment (auto-deploy to Prod)'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const failGate = s === 1;
      const falseGreenTrap = s === 2;

      return {
        telemetry: [
          {
            label: bi('CÀI ĐẶT KHOÁ PHIÊN BẢN', 'LOCKED INSTALL'),
            value:
              s === 3
                ? bi('npm ci / uv sync --frozen', 'npm ci / uv sync --frozen')
                : bi('Khớp 100% Lockfile', '100% Lockfile Exact'),
            tone: 'ok',
          },
          {
            label: bi('TÍN HIỆU PHÁN QUYẾT', 'GATE SIGNAL'),
            value: failGate
              ? bi('Exit 1 / 137 → Chặn PR', 'Exit 1 / 137 → Blocked')
              : falseGreenTrap
                ? bi('Lỗi False-Green (|| true)', 'False-Green Issue (|| true)')
                : bi('Exit 0 → Mở khóa Merge', 'Exit 0 → Merge Allowed'),
            tone: failGate ? 'bad' : falseGreenTrap ? 'warn' : 'ok',
          },
          {
            label: bi('MỨC TỰ ĐỘNG HOÁ', 'MATURITY STAGE'),
            value: isLast
              ? bi('CI → Delivery → Deployment', 'CI → Delivery → Deployment')
              : bi('Ephemeral Linux VM (~3m)', 'Ephemeral Linux VM (~3m)'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Khái niệm cốt lõi: CI Gate là gì?',
                'First Principles: What Is a CI Gate?',
                'Mỗi khi bạn mở Pull Request (yêu cầu gộp code), GitHub khởi tạo một máy ảo Linux sạch tạm thời trong ~3 phút (Ephemeral Runner) để chạy các lệnh kiểm tra và quyết định kết quả dựa hoàn toàn vào Exit Code: 0 là đạt, khác 0 là thất bại.',
                'Every Pull Request automatically rents a clean disposable Linux VM (Ephemeral Runner) for ~3 minutes and gates the Merge button strictly by process Exit Code: 0 passes, non-zero blocks!'
              )
            : s === 1
              ? callout(
                  'technique',
                  'Quy chuẩn Exit Code thống nhất trên mọi ngôn ngữ',
                  'Universal Exit Code Contract Across Languages',
                  'Dù bạn chạy npm test (Node.js), uv run pytest (Python), hay go test ./... (Go), hệ điều hành luôn trả 0 khi đạt, 1 khi lỗi kiểm thử, và 137 (128 + 9 SIGKILL) khi tiến trình vượt giới hạn bộ nhớ RAM.',
                  'Whether running npm test (Node), uv run pytest (Python), or go test (Go), POSIX returns 0 on pass, 1 on test failure, and 137 (128 + 9 SIGKILL) on out-of-memory kills!'
                )
              : s === 2
                ? callout(
                    'watch-out',
                    'Rủi ro "Báo Xanh Giả" (False-Green Pipeline)',
                    'Beware Silent False-Green Pipelines',
                    'Viết npm test || true, bật continue-on-error: true, hoặc gọi curl thiếu cờ --fail sẽ chuyển mã lỗi khác 0 thành 0 — khiến lỗi HTTP 500 vẫn báo đạt và đi vào nhánh main.',
                    'Using || true, continue-on-error: true, or curl without --fail swallows non-zero exit codes into 0 — letting HTTP 500 bugs slip straight into main with a green checkmark!'
                  )
                : s === 3
                  ? callout(
                      'compare',
                      'Tại sao nên dùng npm ci thay cho npm install trên CI?',
                      'Why CI Demands npm ci / --frozen Lockfiles',
                      'npm install có thể tự động cập nhật phiên bản phụ và sửa lại lockfile; còn npm ci (tương tự uv sync --frozen trong Python) cài đặt đúng theo lockfile và báo lỗi Exit 1 ngay nếu lockfile không khớp.',
                      'npm install mutates lockfiles when minor versions drift, whereas npm ci (and uv sync --frozen in Python) enforces 100% deterministic lockfile hashes!'
                    )
                  : callout(
                      'key-idea',
                      'Phân biệt Continuous Delivery và Continuous Deployment',
                      'Architect Takeaway: Delivery vs Deployment',
                      'Continuous Delivery tự động kiểm tra và đóng gói sẵn sàng lên Production với một bước phê duyệt thủ công (Manual Approval); Continuous Deployment tự động hóa hoàn toàn đến môi trường Production.',
                      'Continuous Delivery stops at a 1-click human approval gate before Production; Continuous Deployment automates the final mile straight to live users!'
                    ),
        whatChanged:
          s === 0
            ? [
                {
                  op: '+',
                  text: bi(
                    'Kích hoạt tự động máy ảo Ephemeral Runner qua Webhook ngay khi mở Pull Request',
                    'Triggered clean Ephemeral Runner VM automatically via PR Webhook'
                  ),
                },
              ]
            : failGate
              ? [
                  {
                    op: '~',
                    text: bi(
                      'Lệnh kiểm tra trả về Exit Code != 0 lập tức kích hoạt Fail-Fast khóa chặt nút Merge vào main',
                      'Non-zero exit code triggered Fail-Fast, locking the PR Merge button'
                    ),
                  },
                ]
              : falseGreenTrap
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Bật set -euo pipefail và cờ curl --fail-with-body triệt tiêu hoàn toàn lỗi nuốt mã thoát',
                        'Enforced set -euo pipefail and curl --fail-with-body to eliminate silent false-greens'
                      ),
                    },
                  ]
                : s === 3
                  ? [
                      {
                        op: '+',
                        text: bi(
                          'Chuyển sang npm ci (hoặc uv sync --frozen) khóa bất biến 100% cây thư viện theo lockfile',
                          'Switched to deterministic npm ci / uv sync --frozen bound strictly to lockfile hashes'
                        ),
                      },
                    ]
                  : [
                      {
                        op: '+',
                        text: bi(
                          'Định hình lộ trình trưởng thành từ CI Gate cơ bản lên Continuous Delivery & Continuous Deployment',
                          'Mapped release maturity from PR CI Gate to Continuous Delivery & Continuous Deployment'
                        ),
                      },
                    ],
        scene: {
          nodes: [
            {
              id: 'pr',
              shape: 'device',
              tone: s === 0 ? 'blue' : 'neutral',
              x: -245,
              y: 10,
              label: bi('Pull Request (PR)', 'Pull Request (PR)'),
              sublabel: bi('git push · Webhook', 'git push · Webhook'),
              highlighted: s === 0,
            },
            {
              id: 'ci',
              shape: 'block',
              tone: failGate ? 'rose' : falseGreenTrap ? 'orange' : 'green',
              x: -5,
              y: -25,
              label: bi('CI Gate (Linux VM)', 'CI Gate (Linux VM)'),
              icon: 'shield',
              highlighted: s >= 1 && !isLast,
              badge: {
                text: failGate
                  ? bi('Exit 1 · Chặn lỗi!', 'Exit 1 · Blocked!')
                  : falseGreenTrap
                    ? bi('set -euo pipefail', 'set -euo pipefail')
                    : s === 3
                      ? bi('npm ci · Lockfile ✔', 'npm ci · Lockfile ✔')
                      : bi('Exit 0 · Verified ✔', 'Exit 0 · Verified ✔'),
                tone: failGate ? 'bad' : falseGreenTrap ? 'warn' : 'ok',
              },
            },
            {
              id: 'main',
              shape: 'db',
              tone: isLast ? 'green' : 'blue',
              x: 235,
              y: 15,
              label: isLast ? bi('Staging / Prod CD', 'Staging / Prod CD') : bi('Protected main', 'Protected main'),
              dimmed: failGate,
              highlighted: isLast,
            },
          ],
          links: [
            {
              id: 'l1',
              from: 'pr',
              to: 'ci',
              style: failGate ? 'danger' : 'solid',
              label: bi('webhook trigger', 'webhook trigger'),
            },
            {
              id: 'l2',
              from: 'ci',
              to: 'main',
              style: failGate ? 'off' : 'solid',
              label: isLast ? bi('1-click / auto CD', '1-click / auto CD') : bi('merge allowed (0)', 'merge allowed (0)'),
            },
          ],
          packets: failGate
            ? [{ id: 'p1', linkId: 'l1', kind: 'error', speed: 0.46 }]
            : [
                { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
                { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.48 },
              ],
        },
      };
    },
  },

  C01: {
    id: 'C01',
    titleEn: '6 Core Pipeline Entities: Trigger, Workflow, Job, Step & Ephemeral Runner',
    subtitleEn: 'Understand why Jobs run on isolated disposable VMs while Steps share one runner filesystem.',
    durationMin: 12,
    difficulty: 'Beginner',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Nắm vững nguyên tắc cô lập môi trường: các Step trong cùng 1 Job dùng chung ổ đĩa máy ảo, nhưng hai Job khác nhau chạy trên hai máy ảo Ephemeral VM tách biệt',
        'Remember Steps share a workspace, whereas separate Jobs run on isolated fresh Ephemeral VMs'
      ),
      bi(
        'Nắm mô hình 6 thành phần cốt lõi (Trigger, Workflow, Job, Runner, Step, Action) áp dụng cho GitHub Actions, GitLab CI, Jenkins, CircleCI, Buildkite và Dagger',
        'Map the 6-entity mental model across GitHub Actions, GitLab CI, Jenkins, CircleCI, Buildkite & Dagger'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const diskTrap = s === 2;

      return {
        telemetry: [
          {
            label: bi('GIỮA CÁC STEP', 'STEPS IN 1 JOB'),
            value:
              s === 3
                ? bi('Chung đĩa · Khác subshell', 'Shared disk · New subshell')
                : bi('Chung ổ đĩa /workspace', 'Shared /workspace disk'),
            tone: s === 3 ? 'warn' : 'ok',
          },
          {
            label: bi('GIỮA CÁC JOB', 'ACROSS JOBS'),
            value: bi('2 Máy ảo tách biệt 100%', '100% Isolated fresh VMs'),
            tone: diskTrap ? 'bad' : 'warn',
          },
          {
            label: bi('VÒNG ĐỜI RUNNER', 'RUNNER LIFESPAN'),
            value: bi('Dùng 1 lần rồi xóa trắng', 'Disposable & wiped clean'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Webhook Trigger & Máy ảo dùng một lần (Ephemeral Runner)',
                'Webhook Triggers & Disposable Clean-Room VMs',
                'Webhook Trigger gửi tín hiệu kích hoạt tự động khi có git push hoặc PR; còn Ephemeral Runner là máy ảo Ubuntu sạch được cấp phát tạm thời để chạy Job rồi xóa hoàn toàn để tránh tồn lưu rác cấu hình hoặc mã độc.',
                'A Webhook automatically triggers on git push/PR, renting a fresh Ubuntu Ephemeral Runner VM for minutes and destroying its disk immediately after the Job finishes!'
              )
            : s === 1
              ? callout(
                  'good-to-know',
                  'Mô hình 6 thành phần dùng chung cho mọi nền tảng CI/CD',
                  'One Mental Model Fits Every Industry CI Tool',
                  'Dù sử dụng GitHub Actions, GitLab CI, Jenkins, CircleCI/Buildkite hay Dagger, cấu trúc nền tảng đều gồm 6 thành phần: Trigger → Workflow → Job → Runner → Step → Action/Plugin.',
                  'Whether your team uses GitHub Actions, GitLab CI, Jenkins, CircleCI/Buildkite, or Dagger, all platforms share the exact 6 entities: Trigger → Workflow → Job → Runner → Step → Action.'
                )
              : diskTrap
                ? callout(
                    'watch-out',
                    'Lỗi phổ biến: Job sau không thấy tệp của Job trước',
                    'Common Mistake: Missing Files Across Jobs',
                    'Job 1 chạy npm run build tạo thư mục dist/ trên Máy ảo #1, sau đó máy ảo đó bị xóa. Job 2 khởi chạy trên Máy ảo #2 trống hoàn toàn — cần chạy lại actions/checkout@v4 và tải Artifact nếu muốn nhận tệp từ Job 1.',
                    'Job 1 builds dist/ on VM #1, which is then destroyed! Job 2 wakes up on a blank VM #2 — without even source code unless it runs actions/checkout@v4 and downloads Artifacts!'
                  )
                : s === 3
                  ? callout(
                      'technique',
                      'Phân biệt uses: với run: và phạm vi subshell của lệnh cd',
                      'uses: vs run: — Why "cd subdir" Resets Next Step',
                      'Mỗi Step run: khởi chạy một tiến trình subshell mới tại thư mục gốc dự án. Vì vậy lệnh cd apps/api ở Step 1 sẽ không còn hiệu lực khi chuyển sang Step 2.',
                      'Every run: Step spawns a fresh subshell rooted at the workspace. Running cd apps/api in Step 1 will NOT persist into Step 2!'
                    )
                  : callout(
                      'key-idea',
                      'Thiết kế Job độc lập và cấu hình working-directory',
                      'Architect Takeaway: Self-Contained Jobs',
                      'Thiết kế mỗi Job tự checkout và khôi phục cache độc lập; sử dụng defaults.run.working-directory khi mã nguồn nằm trong thư mục con thay vì lặp lại lệnh cd.',
                      'Keep every Job self-contained (checkout + cached install) and declare defaults.run.working-directory cleanly for subfolder services.'
                    ),
        whatChanged:
          s === 0
            ? [
                {
                  op: '+',
                  text: bi(
                    'Sự kiện Webhook (push / pull_request) tự động cấp phát các máy ảo Ephemeral Runner độc lập',
                    'Webhook event automatically provisioned isolated Ephemeral Runner VMs'
                  ),
                },
              ]
            : diskTrap
              ? [
                  {
                    op: '~',
                    text: bi(
                      'Máy ảo #1 tự huỷ ngay khi xong Job 1 — Job 2 khởi động trắng tinh trên Máy ảo #2 hoàn toàn khác',
                      'VM #1 self-destructed after Job 1; Job 2 booted on a completely blank VM #2'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      isLast
                        ? 'Khai báo defaults.run.working-directory giúp mọi Step run: tự chạy đúng thư mục dịch vụ con'
                        : 'Kết hợp uses: (Action đóng gói sẵn cho Node/Python/Go) và run: (câu lệnh CLI tuần tự)',
                      isLast
                        ? 'Configured defaults.run.working-directory for clean subfolder execution across Steps'
                        : 'Combined reusable uses: Actions with sequential run: shell commands on shared VM storage'
                    ),
                  },
                ],
        scene: {
          nodes: [
            {
              id: 'ev',
              shape: 'device',
              tone: s === 0 ? 'yellow' : 'neutral',
              x: -250,
              y: 10,
              label: bi('Webhook Trigger', 'Webhook Trigger'),
              sublabel: bi('push / pull_request', 'push / pull_request'),
              highlighted: s === 0,
            },
            {
              id: 'j1',
              shape: 'block',
              tone: 'blue',
              x: -15,
              y: -45,
              label: bi('Job 1 · VM #1', 'Job 1 · VM #1'),
              icon: 'cpu',
              highlighted: s >= 1,
              badge: {
                text: isLast
                  ? bi('working-directory: api', 'working-directory: api')
                  : bi('Steps chung ổ đĩa', 'Steps share disk'),
                tone: 'ok',
              },
            },
            {
              id: 'j2',
              shape: 'block',
              tone: diskTrap ? 'rose' : 'purple',
              x: 215,
              y: 35,
              label: bi('Job 2 · VM #2', 'Job 2 · VM #2'),
              icon: 'cpu',
              highlighted: diskTrap || s === 1,
              badge: {
                text: diskTrap
                  ? bi('Trống trơn · Cách ly!', 'Blank isolated disk!')
                  : bi('Ephemeral VM riêng', 'Separate fresh VM'),
                tone: diskTrap ? 'bad' : 'warn',
              },
            },
          ],
          links: [
            { id: 'l1', from: 'ev', to: 'j1', label: bi('spawn VM #1', 'spawn VM #1') },
            {
              id: 'l2',
              from: 'ev',
              to: 'j2',
              style: diskTrap ? 'danger' : 'dashed',
              label: diskTrap ? bi('no shared disk!', 'no shared disk!') : bi('parallel VM #2', 'parallel VM #2'),
            },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: diskTrap ? 'error' : 'pointer', speed: 0.46, offset: 0.4 },
          ],
        },
      };
    },
  },

  C02: {
    id: 'C02',
    titleEn: 'Trunk-Based Branching & Top 5 Causes of "Green Locally, Red on CI"',
    subtitleEn: 'Keep PR branches short-lived (<24h) and eliminate Linux case-sensitivity, UTC timezone, and OOM worker drift.',
    durationMin: 12,
    difficulty: 'Beginner',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Áp dụng Trunk-Based Development (nhánh PR ngắn < 1–2 ngày kết hợp Feature Flags) để giảm xung đột khi gộp code',
        'Adopt short-lived Trunk-Based PRs (<24h) + Feature Flags to minimize merge conflicts'
      ),
      bi(
        'Khắc phục 5 nguyên nhân gây lệch kết quả giữa máy cá nhân và CI cho Node.js, Python & Go: phân biệt hoa/thường Linux ext4, múi giờ UTC, Watch mode, trôi phiên bản runtime và tràn RAM Exit 137',
        'Eliminate the 5 local-vs-CI drift culprits across Node, Python & Go: Linux case-sensitivity, UTC, watch hangs, runtime drift & Exit 137 OOM'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;

      return {
        telemetry: [
          {
            label: bi('TUỔI ĐỜI NHÁNH PR', 'PR LIFESPAN'),
            value: bi('< 24 giờ (Trunk-Based)', '< 24h (Trunk-Based)'),
            tone: 'ok',
          },
          {
            label: bi('Ổ ĐĨA & MÚI GIỜ CI', 'LINUX CI ENV'),
            value:
              s === 2
                ? bi('ext4 Hoa!=Thường · UTC!', 'Case-Sensitive · UTC!')
                : bi('TZ=UTC · Casing Strict', 'TZ=UTC · Casing Strict'),
            tone: s === 2 ? 'bad' : 'ok',
          },
          {
            label: bi('NGÂN SÁCH RUNNER', 'RUNNER BUDGET'),
            value: bi('2 vCPU · 7 GB RAM', '2 vCPU · 7 GB RAM'),
            tone: isLast ? 'ok' : 'warn',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Nguyên nhân mã nguồn chạy đúng trên máy cá nhân nhưng lỗi trên CI',
                'Why "Works on My MacBook" Breaks on Cloud CI',
                'Máy cá nhân thường có 16–32GB RAM, ổ đĩa macOS/Windows không phân biệt hoa thường và múi giờ địa phương; trong khi CI Runner là máy Linux ext4 không màn hình, múi giờ UTC, chỉ có 2 vCPU & 7GB RAM.',
                'Your laptop has 16–32GB RAM, a case-insensitive macOS/Windows disk, and local timezone — whereas CI runs on headless Linux ext4 in UTC with only 2 vCPUs & 7GB RAM!'
              )
            : s === 1
              ? callout(
                  'compare',
                  'So sánh Trunk-Based Development và GitFlow nhánh dài hạn',
                  'Short-Lived Trunk PRs + Feature Flags Beat GitFlow',
                  'Giữ nhánh riêng nhiều tuần tạo ra PR hàng nghìn dòng khó kiểm soát và dễ xung đột khi gộp. Hãy chia nhỏ PR 100–300 dòng gộp về main mỗi ngày và ẩn tính năng chưa hoàn thiện sau Feature Flag.',
                  'Multi-week branches breed 4,000-line Merge Hell PRs. Merge small 100–300 line PRs daily into main and hide unfinished UI safely behind Feature Flags!'
                )
              : s === 2
                ? callout(
                    'watch-out',
                    '5 Nguyên nhân phổ biến gây lệch môi trường Local và CI',
                    'Top 5 Local-vs-CI Drift Traps Across Languages',
                    '1) Đổi tên file UserCard.tsx vs userCard.tsx (macOS cho qua, Linux ext4 báo lỗi), 2) Lệch múi giờ địa phương vs UTC, 3) Thiếu biến CI=true làm treo Watch mode 6 tiếng, 4) Không ghim phiên bản runtime, 5) Tạo quá nhiều worker gây tràn RAM Exit 137.',
                    '1) Filename casing on Linux ext4, 2) Local timezone vs UTC, 3) Interactive watch-mode hangs without CI=true, 4) Unpinned runtime versions, 5) Too many test workers causing Exit 137 OOM.'
                  )
                : callout(
                    'key-idea',
                    'Ba cấu hình chuẩn hóa môi trường CI cho mọi dự án',
                    'Architect Takeaway: The 3-Lock CI Hygiene Formula',
                    'Luôn cố định: (1) Runtime & Lockfile (Node 22 + npm ci / Python uv sync --frozen), (2) env: { CI: true, TZ: UTC }, và (3) giới hạn số worker khớp 2 vCPU / 7GB RAM.',
                    'Always lock: (1) Exact runtime + lockfile, (2) env: { CI: true, TZ: UTC }, and (3) worker concurrency sized for a 2-vCPU / 7GB RAM runner.'
                  ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Chuyển từ nhánh GitFlow dài nhiều tuần sang nhánh PR ngắn (<24h) kết hợp Feature Flags',
                    'Replaced multi-week branches with daily Trunk-Based PRs guarded by Feature Flags'
                  ),
                },
              ]
            : s === 2
              ? [
                  {
                    op: '~',
                    text: bi(
                      'Phát hiện 5 điểm chênh lệch vật lý giữa Laptop cá nhân (GMT+7, APFS) và Linux Runner (UTC, ext4)',
                      'Exposed 5 environment mismatches between developer laptops and headless Linux CI VMs'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      'Khóa chặt CI=true, TZ=UTC, forceConsistentCasingInFileNames và trần RAM/Worker chống lỗi Exit 137',
                      'Pinned CI=true, TZ=UTC, strict filename casing, and worker memory caps preventing Exit 137'
                    ),
                  },
                ],
        memoryScene: {
          kind: 'tape',
          title: bi(
            'Trunk-Based Flow: Nhánh PR nhỏ gộp hàng ngày giữ nhánh main luôn Xanh',
            'Trunk-Based Development Pipeline'
          ),
          subtitle: bi(
            'PR gọn (< 300 dòng) + khóa chặt môi trường Linux UTC giúp tích hợp êm ru mỗi ngày',
            'Small PRs (< 300 LOC) + deterministic Linux UTC settings keep main continuously releasable'
          ),
          cells: ['main #101 ✔', 'PR feat/qr (<24h)', 'Linux UTC Gate', 'main #102 ✔', 'Flag Release ✔'],
          activeIndices: s === 0 ? [0, 1] : s === 1 ? [1, 3, 4] : s === 2 ? [2] : [2, 3, 4],
          pointers:
            s === 2
              ? [
                  { index: 1, label: 'macOS GMT+7', tone: 'orange' },
                  { index: 2, label: 'ext4 + UTC + 7GB!', tone: 'rose' },
                ]
              : [
                  { index: 2, label: isLast ? 'CI=true · TZ=UTC ✔' : '3-min CI Gate', tone: 'green' },
                  { index: isLast ? 4 : 3, label: isLast ? 'Zero Drift' : 'Always Green', tone: 'blue' },
                ],
          outputPill: {
            label: bi('TRẠNG THÁI ĐỒNG BỘ', 'ENVIRONMENT PARITY'),
            value:
              s === 2
                ? bi('5 điểm lệch môi trường cần lưu ý', '5 Drift Hazards Detected')
                : bi('Đồng nhất Laptop == CI 100%', '100% Laptop == CI Parity'),
            tone: s === 2 ? 'rose' : 'green',
          },
        },
      };
    },
  },

  C03: {
    id: 'C03',
    titleEn: 'Authoring Your First Clean GitHub Actions Workflow',
    subtitleEn: 'Configure triggers, smart branch filters, @v4 Actions, lockfile caching, and multi-language CI skeletons.',
    durationMin: 12,
    difficulty: 'Beginner',
    primaryMode: 'code-trace',
    objectives: [
      bi(
        'Viết chuẩn cấu trúc .github/workflows/ci.yml từ con số 0 với thụt lề 2 dấu cách, lọc nhánh main chống chạy trùng gấp đôi và Action thế hệ @v4',
        'Write clean .github/workflows/ci.yml with 2-space YAML indentation, deduplicated branch filters, and @v4 Actions'
      ),
      bi(
        'Áp dụng cùng một bộ khung 4 bước cho cả Node.js 22 (setup-node@v4 + npm ci), Python (setup-uv@v5 + pytest) và Go',
        'Apply the exact same 4-step workflow skeleton across Node.js 22, Python (uv + pytest), and Go'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;

      return {
        telemetry: [
          {
            label: bi('LỌC SỰ KIỆN', 'BRANCH FILTER'),
            value:
              s === 2
                ? bi('Tiết kiệm 50% phút chạy!', '50% CI minutes saved!')
                : bi('push + PR → [main]', 'push + PR → [main]'),
            tone: 'ok',
          },
          {
            label: bi('CHUẨN ACTION', 'ACTION RUNTIME'),
            value: bi('checkout@v4 · Node 22', 'checkout@v4 · Node 22'),
            tone: 'ok',
          },
          {
            label: bi('KÍCH HOẠT TAY', 'MANUAL TRIGGER'),
            value: isLast ? bi('workflow_dispatch ✔', 'workflow_dispatch ✔') : bi('Shallow fetch-depth: 1', 'Shallow fetch-depth: 1'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Đặt sai tên thư mục 1 chữ cái là GitHub bỏ qua hoàn toàn!',
                'Exact Path Matters: .github/workflows/*.yml',
                'GitHub chỉ tự động đọc các tệp .yml/.yaml nằm đúng trong .github/workflows/ (có chữ "s" ở cuối!) và bắt buộc thụt lề bằng dấu cách (2 spaces), tuyệt đối không dùng phím Tab.',
                'GitHub only scans .yml/.yaml files inside exact path .github/workflows/ (plural!) indented strictly with spaces — a single Tab character breaks YAML parsing.'
              )
            : s === 1
              ? callout(
                  'technique',
                  'Shallow Clone mặc định giúp khởi động trong 1 giây',
                  'Fast 1-Second Startup via Shallow Clone',
                  'actions/checkout@v4 mặc định chỉ tải đúng 1 commit mới nhất (fetch-depth: 1) thay vì kéo toàn bộ lịch sử nhiều năm của kho Git, giúp Job bắt đầu gần như tức thì!',
                  'actions/checkout@v4 defaults to fetch-depth: 1 (shallow clone), fetching only the latest commit snapshot so runners boot in ~1 second!'
                )
              : s === 2
                ? callout(
                    'watch-out',
                    'Cấu hình "on: [push, pull_request]" thiếu lọc nhánh gây chạy trùng lặp',
                    'Trap: Bare "on: [push, pull_request]" Doubles Your CI Bill!',
                    'Nếu không lọc branches: [main], mỗi lần bạn đẩy commit lên nhánh PR sẽ kích hoạt đồng thời 1 lượt push và 1 lượt pull_request chạy giống nhau. Lọc branches: [main] giúp mỗi PR chỉ chạy đúng 1 lần.',
                    'Without branches: [main], pushing to an open PR branch fires BOTH a push run and a pull_request run simultaneously! Filtering base branch main cuts redundant runs by 50%.'
                  )
                : s === 3
                  ? callout(
                      'technique',
                      '1 dòng cache: "npm" tự động băm SHA-256 lockfile',
                      'One-Line Lockfile Caching in setup-node@v4',
                      'Bật cache: "npm" trong actions/setup-node@v4 tự động lấy mã băm package-lock.json làm khoá lưu đệm ~/.npm — nhưng nhớ phải commit package-lock.json lên Git nếu không bước này sẽ báo lỗi ngay!',
                      'Setting cache: "npm" hashes package-lock.json automatically to cache ~/.npm tarballs — just make sure package-lock.json is committed to Git!'
                    )
                  : callout(
                      'key-idea',
                      'Đúc kết Kiến trúc sư: Bộ khung bất biến cho cả Node, Python & Go',
                      'Architect Takeaway: Same 4-Step Skeleton for Python & Go',
                      'Cấu trúc Checkout → Setup Runtime + Cache → Clean Install → Lint/Test/Build áp dụng y hệt khi bạn chuyển sang Python (astral-sh/setup-uv@v5 + uv sync --frozen) hay Go (setup-go@v5)!',
                      'Checkout → Setup Runtime + Cache → Locked Install → Lint/Test/Build works identically for Python (setup-uv@v5 + uv sync --frozen) and Go!'
                    ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Khởi tạo tệp .github/workflows/ci.yml chuẩn @v4 với quyền mặc định tối thiểu contents: read',
                    'Created .github/workflows/ci.yml using @v4 Actions and read-only default permissions'
                  ),
                },
              ]
            : s === 2
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Thêm bộ lọc branches: [main] dưới cả push và pull_request chặn đứng lỗi chạy trùng 2 workflow',
                      'Scoped push and pull_request triggers to branches: [main] eliminating duplicate PR runs'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      isLast
                        ? 'Bổ sung cổng bấm chạy tay workflow_dispatch kèm menu lựa chọn tham số inputs.target_env'
                        : 'Nâng cấp đồng bộ lên actions/checkout@v4, actions/setup-node@v4 (Node 22 LTS + cache: "npm")',
                      isLast
                        ? 'Added manual workflow_dispatch trigger with typed choice inputs for operators'
                        : 'Standardized on checkout@v4 and setup-node@v4 with Node 22 LTS and built-in npm cache'
                    ),
                  },
                ],
        defaultCode: `name: Polyglot-Ready CI Gate\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\npermissions:\n  contents: read\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    timeout-minutes: 10\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: "22"\n          cache: "npm"\n      - run: npm ci\n      - run: npm run build && npm test`,
      };
    },
  },

  C04: {
    id: 'C04',
    titleEn: 'Environment Variables, $GITHUB_OUTPUT, Conditional if: & Path Filters',
    subtitleEn: 'Master 3-tier env precedence, pass step outputs safely, collect failure logs, and prevent infinite push loops.',
    durationMin: 12,
    difficulty: 'Beginner',
    primaryMode: 'code-trace',
    objectives: [
      bi(
        'Làm chủ thứ tự ghi đè biến môi trường (Step > Job > Workflow) và truyền kết quả an toàn qua tệp "$GITHUB_OUTPUT"',
        'Master 3-tier env scope precedence (Step > Job > Workflow) and safe "$GITHUB_OUTPUT" passing'
      ),
      bi(
        'Sử dụng thành thạo 4 hàm điều kiện (success, failure, always, !cancelled), lọc đường dẫn paths-ignore và chống vòng lặp Push vô tận',
        'Control execution with failure()/always()/!cancelled(), paths-ignore filters, and infinite-push-loop guards'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;

      return {
        telemetry: [
          {
            label: bi('ƯU TIÊN BIẾN ENV', 'ENV PRECEDENCE'),
            value: bi('Step > Job > Workflow', 'Step > Job > Workflow'),
            tone: 'ok',
          },
          {
            label: bi('XUẤT DỮ LIỆU STEP', 'STEP OUTPUT'),
            value: bi('>> "$GITHUB_OUTPUT"', '>> "$GITHUB_OUTPUT"'),
            tone: 'ok',
          },
          {
            label: bi('CHỐNG LẶP VÔ TẬN', 'LOOP PROTECTION'),
            value: isLast ? bi('GITHUB_TOKEN + [skip ci]', 'GITHUB_TOKEN + [skip ci]') : bi('paths-ignore: ["**.md"]', 'paths-ignore: ["**.md"]'),
            tone: isLast ? 'warn' : 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Biến Pipeline tĩnh thành bộ điều phối thông minh',
                'Turning Static YAML into Smart Flow Control',
                'Nhờ biến môi trường env:, tệp "$GITHUB_OUTPUT", biểu thức điều kiện if: và lọc đường dẫn paths-ignore, pipeline biết tự nghỉ khi chỉ sửa README.md và tự chụp lại màn hình khi bài test E2E vấp lỗi!',
                'Combining env:, "$GITHUB_OUTPUT", conditional if: gates, and paths-ignore lets pipelines skip docs-only edits and automatically capture crash artifacts on test failures!'
              )
            : s === 1
              ? callout(
                  'technique',
                  'Quy tắc Phạm vi Hẹp thắng Phạm vi Rộng (Step > Job > Workflow)',
                  'Narrowest Scope Always Wins: Step > Job > Workflow',
                  'Giống hệt biến cục bộ ghi đè biến toàn cục trong lập trình: nếu cả 3 tầng cùng khai báo biến STAGE, giá trị ở Step luôn thắng tuyệt đối!',
                  'Just like lexical variable shadowing in code: when Workflow, Job, and Step all define STAGE, Step-level env always wins!'
                )
              : s === 2
                ? callout(
                    'watch-out',
                    'Vì sao export X=1 mất tác dụng sang Step sau & Cấm ::set-output cũ!',
                    'Subshell Isolation & Why "$GITHUB_OUTPUT" Replaced set-output',
                    'Mỗi Step chạy trong subshell riêng nên lệnh export biến mất ngay khi hết Step. Hãy ghi echo "key=val" >> "$GITHUB_OUTPUT" (cơ chế cũ in ra stdout đã bị GitHub xoá sổ vì lỗi tiêm lệnh xuống dòng).',
                    'Shell exports vanish when a Step subshell exits. Always append key=val >> "$GITHUB_OUTPUT" (the legacy stdout command was removed due to newline injection flaws).'
                  )
                : s === 3
                  ? callout(
                      'compare',
                      'Phân biệt tinh tế giữa always() và !cancelled()',
                      'Choosing Between always() and !cancelled()',
                      'Dùng always() cho bước xoá tài nguyên đám mây tốn tiền (chạy kể cả khi bấm Cancel). Dùng !cancelled() cho bước tải báo cáo test HTML (chạy cả khi Xanh lẫn Đỏ, nhưng dừng ngay khi người dùng chủ động huỷ).',
                      'Use always() for cloud teardown (runs even if canceled), and !cancelled() for test report uploads (runs on pass or fail, stops if manually canceled).'
                    )
                  : callout(
                      'watch-out',
                      'Đúc kết Kiến trúc sư: Cẩn trọng "Vòng lặp Push Vô Tận"!',
                      'Architect Takeaway: Never Trigger an Infinite Push Loop!',
                      'Không viết chung paths và paths-ignore trong cùng 1 sự kiện; và nếu bot tự git push bằng PAT trong sự kiện on: push, nhớ gắn [skip ci] + lọc actor để không tự kích hoạt lại chính nó hàng nghìn lần!',
                      'Never mix paths and paths-ignore on one trigger; if a job pushes commits with a PAT, guard with [skip ci] and actor checks to prevent runaway infinite loops!'
                    ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Thiết lập phân tầng biến môi trường chuẩn mực (Workflow → Job → Step)',
                    'Structured 3-tier environment variable hierarchy across Workflow, Job, and Step'
                  ),
                },
              ]
            : s === 2
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Truyền mã commit rút gọn giữa các Step an toàn qua tệp môi trường "$GITHUB_OUTPUT"',
                      'Passed step metadata safely through isolated "$GITHUB_OUTPUT" file descriptor'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      isLast
                        ? 'Bỏ qua build khi chỉ sửa tài liệu .md bằng paths-ignore và khóa chốt chống lặp Push vô tận'
                        : 'Gắn if: failure() và if: !cancelled() để luôn thu thập đủ log/ảnh lỗi khi kiểm thử thất bại',
                      isLast
                        ? 'Added paths-ignore for Markdown docs and loop-prevention guards for automated commits'
                        : 'Attached if: failure() and !cancelled() guards to preserve diagnostic logs on crashes'
                    ),
                  },
                ],
        defaultCode: `on:\n  push:\n    branches: [main]\n    paths-ignore:\n      - "**.md"\n      - "docs/**"\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - id: meta\n        run: echo "sha=\${GITHUB_SHA::7}" >> "$GITHUB_OUTPUT"\n      - name: Upload crash logs on failure\n        if: failure()\n        run: echo "Collecting logs for \${{ steps.meta.outputs.sha }}"`,
      };
    },
  },

  C05: {
    id: 'C05',
    titleEn: 'Job Dependency Graphs (DAG needs:) & Strategy Matrix',
    subtitleEn: 'Run independent checks in parallel (Fan-out), gate Build on all checks passing (Fan-in), and master Matrix testing.',
    durationMin: 13,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Hiểu rõ DAG (Đồ thị luồng công việc phụ thuộc một chiều): quạt rộng chạy song song các kiểm tra độc lập rồi hội tụ tại needs: [lint, test]',
        'Master DAG (Directed Acyclic Graph): fan-out independent jobs in parallel and fan-in at build via needs:'
      ),
      bi(
        'Kiểm thử đa phiên bản bằng strategy.matrix (kèm fail-fast: false) và nối đủ 3 mắt xích truyền dữ liệu xuyên ranh giới 2 Job',
        'Run cross-version Matrix suites with fail-fast: false and wire the 3-link cross-job outputs bridge'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const matrixTrap = s === 2;

      return {
        telemetry: [
          {
            label: bi('THỜI GIAN CHỜ THỰC', 'WALL-CLOCK TIME'),
            value: bi('12m → 5m (DAG song song)', '12m → 5m (Parallel DAG)'),
            tone: 'ok',
          },
          {
            label: bi('CHẾ ĐỘ MA TRẬN', 'MATRIX STRATEGY'),
            value: matrixTrap
              ? bi('fail-fast: false · Cước macOS 10x!', 'fail-fast: false · macOS 10x!')
              : bi('Node 20 · 22 × Ubuntu/macOS', 'Node 20 · 22 × Ubuntu/macOS'),
            tone: matrixTrap ? 'warn' : 'ok',
          },
          {
            label: bi('CẦU NỐI XUYÊN JOB', 'CROSS-JOB BRIDGE'),
            value: isLast ? bi('3 mắt xích needs.*.outputs', '3-link needs.*.outputs') : bi('Cổng AND nghiêm ngặt', 'Strict AND Fan-In'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Giải thích trực diện khái niệm DAG (Đồ thị phụ thuộc không chu trình)',
                'Plain-Language Guide to DAG (Directed Acyclic Graph)',
                'Trong DAG, các tác vụ không phụ thuộc lẫn nhau (như kiểm tra mã và kiểm thử đơn vị) chạy song song từ giây 0 (Fan-Out), và tác vụ đóng gói chỉ chạy sau khi các tác vụ trước hoàn tất (Fan-In qua từ khóa needs:). Cơ chế này tương tự dây chuyền lắp ráp khi nhiều bộ phận được gia công đồng thời trước khâu lắp ráp cuối.',
                'A DAG works like a parallel car assembly line: chassis and engine checks start simultaneously at t=0 (Fan-Out), and final assembly waits for both via needs: (Fan-In)!'
              )
            : s === 1
              ? callout(
                  'technique',
                  'Logic cổng AND tiết kiệm tài nguyên máy ảo Build',
                  'Strict AND Gate Saves Downstream Compute',
                  'Khi Job build khai báo needs: [lint, unit-test], chỉ cần lint thất bại là build tự động chuyển sang Skipped — không tốn tài nguyên khởi tạo máy ảo đóng gói mã nguồn lỗi.',
                  'With needs: [lint, unit-test], if lint fails, build is automatically Skipped — burning zero compute minutes on broken code!'
                )
              : matrixTrap
                ? callout(
                    'watch-out',
                    'Lưu ý khi dùng Matrix: Cờ fail-fast mặc định và chi phí macOS',
                    'Two Matrix Gotchas: Default fail-fast & 10× macOS Multiplier!',
                    'Mặc định fail-fast: true sẽ hủy toàn bộ các tổ hợp còn lại ngay khi 1 tổ hợp gặp lỗi, làm thiếu thông tin chẩn đoán đa nền tảng. Hãy đặt fail-fast: false — và lưu ý trên repo Private, macos-latest có chi phí cao gấp ~10 lần Linux.',
                    'Default fail-fast: true cancels all sibling matrix runners on the first failure! Set fail-fast: false for full visibility, and note macos-latest bills at ~10× Linux rates on private repos.'
                  )
                : callout(
                    'key-idea',
                    'Quy trình 3 bước truyền outputs giữa hai Job',
                    'Architect Takeaway: The 3-Link Cross-Job Outputs Bridge',
                    'Truyền dữ liệu giữa 2 Job chạy trên 2 máy ảo tách biệt cần đủ 3 bước: (1) Step ghi "$GITHUB_OUTPUT" → (2) Khai báo jobs.<id>.outputs ở Job nguồn → (3) Job đích khai báo needs và đọc needs.<id>.outputs.',
                    'Passing data across isolated Job VMs requires all 3 links: (1) Step writes "$GITHUB_OUTPUT" → (2) Job declares outputs: mapping → (3) Consumer declares needs: and reads needs.<id>.outputs!'
                  ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Tách chuỗi tuần tự thành đồ thị DAG quạt rộng song song rồi hội tụ tại cổng Build qua needs:',
                    'Refactored serial checks into parallel Fan-Out Root Jobs converging at Build via needs:'
                  ),
                },
              ]
            : matrixTrap
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Bật strategy.matrix kèm fail-fast: false để thu thập đầy đủ bảng tương thích đa phiên bản',
                      'Configured strategy.matrix with fail-fast: false to capture complete cross-version diagnostics'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      'Bắc cầu truyền số phiên bản từ Job build sang Job deploy qua jobs.build.outputs',
                      'Wired 3-step outputs bridge passing immutable version metadata from build to deploy'
                    ),
                  },
                ],
        scene: {
          nodes: [
            {
              id: 'lint',
              shape: 'block',
              tone: 'blue',
              x: -195,
              y: -62,
              label: bi('Job: lint (2m)', 'Job: lint (2m)'),
              icon: 'code',
              highlighted: s <= 1,
              badge: { text: bi('Root Job · t=0s', 'Root Job · t=0s'), tone: 'ok' },
            },
            {
              id: 'test',
              shape: 'block',
              tone: matrixTrap ? 'orange' : 'purple',
              x: -195,
              y: 66,
              label: bi('Matrix Test (5m)', 'Matrix Test (5m)'),
              icon: 'layers',
              highlighted: matrixTrap || s <= 1,
              badge: {
                text: matrixTrap ? bi('fail-fast: false', 'fail-fast: false') : bi('Node 20 & 22', 'Node 20 & 22'),
                tone: matrixTrap ? 'warn' : 'default',
              },
            },
            {
              id: 'bld',
              shape: 'block',
              tone: 'green',
              x: 165,
              y: 0,
              label: isLast ? bi('Build → Deploy', 'Build → Deploy') : bi('Job: build (3m)', 'Job: build (3m)'),
              icon: 'zap',
              highlighted: s === 1 || isLast,
              badge: {
                text: isLast ? bi('needs.build.outputs ✔', 'needs.build.outputs ✔') : bi('needs: [lint, test]', 'needs: [lint, test]'),
                tone: 'ok',
              },
            },
          ],
          links: [
            { id: 'l1', from: 'lint', to: 'bld', label: bi('Exit 0', 'Exit 0') },
            { id: 'l2', from: 'test', to: 'bld', label: bi('all matrix pass', 'all matrix pass') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'response', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.4 },
          ],
        },
      };
    },
  },

  C06: {
    id: 'C06',
    titleEn: 'Service Containers (Postgres/Redis), Timeouts & Concurrency Cancel',
    subtitleEn: 'Spin up real ephemeral databases with healthchecks, cap hung jobs at 10m, and separate PR vs Prod concurrency.',
    durationMin: 13,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Khởi chạy PostgreSQL 16 và Redis thật ngay cạnh Job bằng services: kèm --health-cmd triệt tiêu lỗi ECONNREFUSED',
        'Attach real ephemeral Postgres & Redis Service Containers with --health-cmd readiness gates'
      ),
      bi(
        'Đặt giới hạn timeout-minutes: 10 (tránh mức mặc định 360 phút) và cấu hình cancel-in-progress phù hợp giữa PR (true) và Production (false)',
        'Cap jobs with timeout-minutes: 10 and flip cancel-in-progress between PRs (true) and Production (false)'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const timeoutTrap = s === 1;
      const concurrencyStep = s === 2;

      return {
        telemetry: [
          {
            label: bi('TRẦN THỜI GIAN', 'JOB TIMEOUT'),
            value: timeoutTrap
              ? bi('Mặc định 360m → Giới hạn 10m', 'Default 360m → Cap 10m')
              : bi('timeout-minutes: 10', 'timeout-minutes: 10'),
            tone: timeoutTrap ? 'warn' : 'ok',
          },
          {
            label: bi('ĐIỀU TIẾT LUỒNG', 'CONCURRENCY'),
            value: concurrencyStep
              ? bi('PR: true · Prod: false', 'PR: true · Prod: false')
              : bi('cancel-in-progress: true (PR)', 'cancel-in-progress: true (PR)'),
            tone: 'ok',
          },
          {
            label: bi('DATABASE TÍCH HỢP', 'SERVICE CONTAINERS'),
            value: bi('pg_isready + redis ping', 'pg_isready + redis ping'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Kiểm thử tích hợp với PostgreSQL & Redis thật bằng Service Containers',
                'Mock Databases Lie — Test Against Ephemeral Real Containers!',
                'Dữ liệu mock dễ bỏ sót lỗi cú pháp SQL hoặc ràng buộc khóa ngoại. Service Containers khởi chạy Postgres & Redis thật dùng một lần ngay bên cạnh Job rồi xóa sạch khi hoàn tất.',
                'Mocked DB calls miss real SQL syntax and foreign-key bugs. Service Containers boot real Postgres & Redis alongside your Job and wipe everything afterward!'
              )
            : timeoutTrap
              ? callout(
                  'watch-out',
                  'Giới hạn timeout-minutes để tránh mức mặc định 360 phút (6 giờ)',
                  'The Silent 360-Minute (6-Hour) Default Timeout Trap!',
                  'Nếu không khai báo timeout-minutes, một kết nối DB bị treo sẽ làm Runner chờ suốt 6 giờ trước khi tự dừng. Luôn đặt timeout-minutes: 10 (hoặc 15) cho mọi Job.',
                  'Omitting timeout-minutes lets a single hung test burn 360 minutes (6 hours) of quota! Always declare explicit timeout-minutes: 10 or 15.'
                )
              : concurrencyStep
                ? callout(
                    'compare',
                    'Cấu hình concurrency đối lập giữa PR và Production',
                    'One Concurrency Keyword — Opposite Rules for PR vs Prod!',
                    'Trên nhánh PR: bật cancel-in-progress: true để hủy lượt chạy cũ khi có commit mới. Trên Production: bắt buộc đặt cancel-in-progress: false để xếp hàng tuần tự, tránh hủy ngang quá trình DB migration.',
                    'On PR branches: set cancel-in-progress: true to abort stale commits. On Production: ALWAYS set cancel-in-progress: false to queue safely without corrupting live migrations!'
                  )
                : s === 3
                  ? callout(
                      'technique',
                      'Chống lỗi ECONNREFUSED bằng --health-cmd thay vì sleep đoán mò',
                      'Prevent ECONNREFUSED with Docker --health-cmd',
                      'Container Postgres báo Running trước khi mở cổng TCP 5432 vài giây. Cờ --health-cmd "pg_isready ..." bắt Runner đợi tới khi DB thực sự sẵn sàng nhận truy vấn mới chạy Step đầu tiên!',
                      'Postgres containers report Running seconds before port 5432 accepts connections. Adding --health-cmd "pg_isready" ensures steps wait until the DB is genuinely ready!'
                    )
                  : callout(
                      'key-idea',
                      'Đúc kết Kiến trúc sư: Gọi qua localhost & Đóng sạch Pool trong afterAll()',
                      'Architect Takeaway: Bind Ports to localhost & Close DB Pools',
                      'Khi Job chạy trực tiếp trên ubuntu-latest, hãy mở ports: ["5432:5432"] để gọi qua localhost:5432, và luôn đóng kết nối prisma.$disconnect() / redis.quit() trong afterAll() để tiến trình test thoát êm!',
                      'Publish ports: ["5432:5432"] to connect via localhost:5432 on host runners, and always close DB/Redis pools in afterAll() so Node/Python test runners exit cleanly!'
                    ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Khóa trần timeout-minutes: 10 bảo vệ quỹ phút CI trước các tiến trình treo kết nối mạng',
                    'Enforced timeout-minutes: 10 protecting CI quota against hung network sockets'
                  ),
                },
              ]
            : concurrencyStep
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Tách biệt concurrency: hủy lượt cũ trên PR (true) và xếp hàng an toàn trên Production (false)',
                      'Configured per-PR concurrency cancellation while enforcing sequential queuing on Production'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      isLast
                        ? 'Ánh xạ cổng localhost:5432 / 6379 và đóng sạch Connection Pool trong hook afterAll()'
                        : 'Đính kèm postgres:16-alpine và redis:7-alpine kèm chốt chặn sức khỏe --health-cmd',
                      isLast
                        ? 'Mapped service ports to localhost and closed DB/Redis pools cleanly in afterAll()'
                        : 'Attached ephemeral Postgres 16 & Redis 7 service containers gated by --health-cmd'
                    ),
                  },
                ],
        scene: {
          nodes: [
            {
              id: 'run',
              shape: 'block',
              tone: timeoutTrap ? 'orange' : 'green',
              x: -200,
              y: 0,
              label: bi('Test Runner VM', 'Test Runner VM'),
              icon: 'terminal',
              highlighted: s <= 2 || isLast,
              badge: {
                text: timeoutTrap
                  ? bi('timeout-minutes: 10', 'timeout-minutes: 10')
                  : concurrencyStep
                    ? bi('PR cancel · Prod queue', 'PR cancel · Prod queue')
                    : bi('Integration Suite', 'Integration Suite'),
                tone: timeoutTrap ? 'warn' : 'ok',
              },
            },
            {
              id: 'pg',
              shape: 'db',
              tone: 'blue',
              x: 195,
              y: -62,
              label: bi('Service: Postgres 16', 'Service: Postgres 16'),
              sublabel: bi('pg_isready · :5432', 'pg_isready · :5432'),
              highlighted: s >= 3,
            },
            {
              id: 'rd',
              shape: 'db',
              tone: 'purple',
              x: 195,
              y: 66,
              label: bi('Service: Redis 7', 'Service: Redis 7'),
              sublabel: bi('redis-cli ping · :6379', 'redis-cli ping · :6379'),
              highlighted: s >= 3,
            },
          ],
          links: [
            { id: 'l1', from: 'run', to: 'pg', label: bi('localhost:5432', 'localhost:5432') },
            { id: 'l2', from: 'run', to: 'rd', style: 'dashed', label: bi('localhost:6379', 'localhost:6379') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'cache-hit', speed: 0.46, offset: 0.45 },
          ],
        },
      };
    },
  },

  C07: {
    id: 'C07',
    titleEn: 'Cache vs Artifacts, Lockfile Hash Keys & Read-Only PR Cache',
    subtitleEn: 'Distinguish "kitchen pantry" Caches from "sealed delivery box" Artifacts and block PR cache poisoning.',
    durationMin: 13,
    difficulty: 'Intermediate',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Phân biệt bản chất: Cache lưu thư mục phụ thuộc để tăng tốc giữa các lần chạy (xóa vẫn chạy được); Artifact lưu sản phẩm đầu ra bất biến để truyền giữa các Job trong cùng một lượt chạy',
        'Distinguish cross-run dependency Caches from intra-run immutable build Artifacts'
      ),
      bi(
        'Không đẩy node_modules vào Artifact và áp dụng mô hình Read-Only Cache (actions/cache/restore@v4) để chống Cache Poisoning',
        'Never upload node_modules as an Artifact; use Read-Only Cache restore on parallel/PR jobs to prevent Cache Poisoning'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;

      return {
        telemetry: [
          {
            label: bi('KHÓA BỘ ĐỆM', 'CACHE KEY'),
            value: bi('os + hashFiles(lockfile)', 'os + hashFiles(lockfile)'),
            tone: 'ok',
          },
          {
            label: bi('BÀN GIAO GIỮA JOB', 'JOB HANDOFF'),
            value: bi('Artifact dist/ (7 ngày)', 'Artifact dist/ (7d TTL)'),
            tone: 'ok',
          },
          {
            label: bi('MÔ HÌNH ĐỌC/GHI', 'CACHE POLICY'),
            value: isLast
              ? bi('main Ghi · PR Chỉ Đọc!', 'main Writes · PR ReadOnly!')
              : bi('restore-keys dự phòng', 'Fallback restore-keys'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Phân biệt Cache (tăng tốc cài thư viện) và Artifact (bàn giao thành phẩm)',
                'Dependency Cache vs Build Artifacts',
                'Cache (~/.npm, ~/.cache/uv) giúp các lần chạy sau không phải tải lại thư viện từ mạng — nếu bị xóa thì pipeline chỉ tải lại chậm hơn một chút. Artifact (dist/, sbom.json) là thành phẩm bắt buộc truyền từ Job Build sang Job Deploy trong cùng lượt chạy. (Có thể hình dung Cache giống kho nguyên liệu sơ chế sẵn, còn Artifact là hộp thành phẩm giao cho khách).',
                'Cache (~/.npm, ~/.cache/uv) speeds up future runs — if evicted, CI simply re-downloads packages! Artifacts (dist/, sbom.json) hand off exact build outputs to Deploy — if missing, deployment halts!'
              )
            : s === 1
              ? callout(
                  'compare',
                  'Phạm vi tồn tại khác nhau: Xuyên lượt chạy vs Trong 1 lượt chạy',
                  'Opposite Scopes: Cross-Run Best-Effort vs Single-Run Exact SHA',
                  'Cache chia sẻ giữa các lần chạy workflow khác nhau (tự xóa sau 7 ngày không truy cập); Artifact gắn chặt với đúng Commit SHA hiện tại (nên đặt retention-days: 7 cho bản tạm để tiết kiệm dung lượng).',
                  'Caches bridge across separate workflow runs (auto-evicted after 7 idle days); Artifacts belong strictly to one exact Commit SHA run.'
                )
              : s === 2
                ? callout(
                    'technique',
                    'Cơ chế tra cứu 2 tầng: Exact Hash Hit và dự phòng restore-keys',
                    'Two-Tier Lookup: Exact Lockfile Hash + Prefix restore-keys',
                    'Khi PR không sửa lockfile, hashFiles khớp 100% và giải nén gói trong vài giây. Khi vừa thêm thư viện mới, restore-keys giúp khôi phục bản đệm gần nhất chứa sẵn phần lớn gói cũ.',
                    'Unchanged lockfiles hit 100% exact cache keys; when adding a dependency, restore-keys salvage 99% of cached packages from the closest prefix!'
                  )
                : callout(
                    'watch-out',
                    'Lưu ý với node_modules và mô hình Read-Only Cache',
                    'Architect Takeaway: Never Artifact node_modules + Use Read-Only Cache!',
                    'Đẩy 50.000 file nhỏ của node_modules vào Artifact mất nhiều phút và dễ làm mất quyền thực thi symlink. Hãy đệm ~/.npm bằng actions/cache/restore@v4 (chỉ đọc trên PR/Job song song để tránh ghi đè và ô nhiễm bộ đệm).',
                    'Archiving 50,000 tiny node_modules files takes minutes and breaks +x symlinks! Cache ~/.npm instead, using actions/cache/restore@v4 on parallel/PR jobs to prevent cache poisoning.'
                  ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Tách biệt rạch ròi đường đi của thư viện tải về (Cache) và thành phẩm biên dịch (Artifact)',
                    'Separated cross-run package Caches from immutable intra-workflow build Artifacts'
                  ),
                },
              ]
            : s === 2
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Định danh khóa Cache bằng mã băm SHA-256 của lockfile kèm lưới đỡ tiền tố restore-keys',
                      'Keyed dependency cache by SHA-256 lockfile digest with prefix restore-keys fallback'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      'Chuyển các Job kiểm thử song song sang actions/cache/restore@v4 (chỉ đọc, tốn 0s cuối Job)',
                      'Switched parallel test & PR jobs to read-only actions/cache/restore@v4 preventing write races'
                    ),
                  },
                ],
        memoryScene: {
          kind: 'refs',
          leftTitle: bi('Nhu cầu lưu trữ trong Pipeline', 'Pipeline Storage Need'),
          rightTitle: bi('Cơ chế Chuẩn Công Nghiệp', 'Production Storage Mechanism'),
          names: [
            {
              id: 'c',
              name: 'Kho tải gói (~/.npm, ~/.cache/uv)',
              note: bi(
                isLast ? 'main ghi · PR chỉ đọc (restore@v4)' : 'tái sử dụng xuyên các lượt chạy',
                isLast ? 'main writes · PR read-only' : 'reused across workflow runs'
              ),
              targetId: 'o1',
              style: 'solid',
            },
            {
              id: 'a',
              name: 'Thành phẩm (dist/, report, sbom)',
              note: bi('truyền từ Job Build → Job Deploy', 'handoff Build → Deploy in 1 run'),
              targetId: 'o2',
              style: 'solid',
            },
            ...(isLast
              ? [
                  {
                    id: 'bad',
                    name: 'Thư mục node_modules/ (50k file)',
                    note: bi('CẤM đẩy vào Artifact!', 'NEVER upload as Artifact!'),
                    targetId: 'o2',
                    style: 'danger' as const,
                  },
                ]
              : []),
          ],
          objects: [
            {
              id: 'o1',
              typeTag: isLast ? 'cache/restore@v4' : 'actions/cache@v4',
              value: 'key: os + hashFiles(lockfile)',
              fields: [
                s === 2 ? 'Fallback: restore-keys prefix' : 'Xoá đi pipeline vẫn chạy xanh',
              ],
              tone: 'green',
              badge: bi('Tăng tốc 3–4×', '3–4× Faster'),
            },
            {
              id: 'o2',
              typeTag: 'upload-artifact@v4',
              value: 'dist-bundle-sha.tar.gz',
              fields: ['Bất biến theo SHA · retention-days: 7'],
              tone: 'blue',
              badge: bi('Build 1 lần', 'Build Once'),
            },
          ],
        },
      };
    },
  },

  C08: {
    id: 'C08',
    titleEn: 'Pipeline Speed Optimization: Test Sharding, Buildx Cache & Zero Blind Sleeps',
    subtitleEn: 'Compress 42-minute serial pipelines under 6 minutes via DAG critical-path math, 4-way sharding, and active polling.',
    durationMin: 13,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Tối ưu đường găng (Critical Path): chạy song song DAG và chia mảnh kiểm thử E2E (--shard=1/4..4/4) hội tụ về cổng duy nhất gate',
        'Compress Critical Path using parallel DAG + 4-way E2E sharding converging into a single aggregator gate'
      ),
      bi(
        'Lưu đệm toàn bộ tầng trung gian Docker với cache-to: type=gha,mode=max và thay thế sleep 30 cố định bằng thăm dò /healthz',
        'Cache multi-stage Docker layers with mode=max and replace flaky blind sleeps with active /healthz polling'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const shardStep = s === 2;

      return {
        telemetry: [
          {
            label: bi('ĐƯỜNG GĂNG TỔNG', 'CRITICAL PATH'),
            value: bi('42m → 5.8m (Nén 7×!)', '42m → 5.8m (7× Faster!)'),
            tone: 'ok',
          },
          {
            label: bi('CHIA MẢNH E2E', 'TEST SHARDING'),
            value: shardStep
              ? bi('4 Shards + !cancelled()', '4 Shards + !cancelled()')
              : bi('--shard=1/4 .. 4/4 (4m)', '--shard=1/4 .. 4/4 (4m)'),
            tone: 'ok',
          },
          {
            label: bi('DOCKER & HEALTH', 'BUILDX & POLLING'),
            value: isLast ? bi('mode=max + curl --retry', 'mode=max + curl --retry') : bi('Aggregator Job: gate', 'Aggregator Job: gate'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Thời gian chờ của Developer = Độ dài nhánh chậm nhất (Critical Path)!',
                'Developer Wait Time Equals Your Longest Branch (Critical Path)!',
                'Nếu nối đuôi tuần tự, thời gian chờ bằng TỔNG mọi bước (42 phút). Khi quạt rộng song song thành đồ thị DAG, thời gian chờ co lại chỉ còn bằng NHÁNH DÀI NHẤT cộng 1 phút cổng hội tụ!',
                'Serial pipelines sum every step (42 mins). Parallel DAGs shrink wall-clock time down to max(parallel branches) + 1m aggregator gate!'
              )
            : s === 1
              ? callout(
                  'technique',
                  'Mẹo Kiến trúc: Mẫu cổng gom "All-Green Aggregator Gate"',
                  'Pattern: Single "gate" Job for Branch Protection',
                  'Thay vì tích chọn bắt buộc 12 tên Job lẻ tẻ trong cài đặt GitHub Branch Protection (đổi tên mảnh Matrix là hỏng!), hãy gom tất cả needs về 1 Job nhẹ tên là gate và chỉ khóa nhánh theo đúng cổng gate đó!',
                  'Instead of hardcoding 12 matrix job names into Branch Protection rules, fan all jobs into one lightweight gate job and require only gate!'
                )
              : shardStep
                ? callout(
                    'watch-out',
                    'Khi chia 4 mảnh Playwright: kết hợp fail-fast: false và if: !cancelled()',
                    'Sharding Gotcha: Pair fail-fast: false with if: !cancelled()!',
                    'Nếu thiếu if: ${{ !cancelled() }} ở bước upload-artifact, ngay khi mảnh 2/4 gặp lỗi UI và trả Exit 1, bước tải ảnh chụp màn hình lỗi sẽ bị Skipped làm mất dữ liệu chẩn đoán.',
                    'Without if: ${{ !cancelled() }} on upload-artifact, a failing shard skips the report upload step — wiping out the exact crash screenshots you need!'
                  )
                : callout(
                    'key-idea',
                    'Dùng mode=max cho Multi-stage Docker & thay sleep 30 bằng Polling /healthz',
                    'Architect Takeaway: Buildx mode=max & Active Readiness Polling',
                    'Mặc định Docker cache mode=min bỏ qua tầng builder trung gian — hãy bật mode=max. Đồng thời thay sleep 30 cố định bằng curl --fail --retry 15 --retry-connrefused /healthz.',
                    'Default mode=min skips intermediate multi-stage builder layers — always set mode=max! And replace blind sleep 30 with deterministic curl --retry readiness polling.'
                  ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Tái cấu trúc pipeline nối đuôi 42 phút thành đồ thị DAG hội tụ về cổng duy nhất gate',
                    'Refactored 42-minute serial pipeline into a parallel DAG converging on a single gate job'
                  ),
                },
              ]
            : shardStep
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Chia ngang 400 bài Playwright thành 4 mảnh --shard=i/4 chạy song song kèm lưu báo cáo !cancelled()',
                      'Horizontally sharded 400 E2E tests across 4 parallel runners with !cancelled() report retention'
                    ),
                  },
                ]
              : [
                  {
                    op: '-',
                    text: bi(
                      'Xóa bỏ hoàn toàn lệnh sleep 30 gây chập chờn (Flaky) và bật Docker Buildx cache mode=max',
                      'Eliminated flaky blind sleep commands and enabled full multi-stage Buildx layer caching (mode=max)'
                    ),
                  },
                ],
        scene: {
          nodes: [
            {
              id: 'src',
              shape: 'device',
              tone: s === 0 ? 'blue' : 'neutral',
              x: -245,
              y: 10,
              label: bi('400 E2E + Docker', '400 E2E + Docker'),
              highlighted: s === 0,
            },
            {
              id: 'sh',
              shape: 'crowd',
              tone: isLast ? 'purple' : 'blue',
              x: 0,
              y: -25,
              label: isLast
                ? bi('Shards + Buildx max', 'Shards + Buildx max')
                : bi('Shards 1/4 .. 4/4', 'Shards 1/4 .. 4/4'),
              highlighted: shardStep || isLast,
            },
            {
              id: 'rep',
              shape: 'block',
              tone: 'green',
              x: 235,
              y: 15,
              label: bi('Aggregator: gate', 'Aggregator: gate'),
              icon: 'zap',
              highlighted: s === 1 || isLast,
              badge: {
                text: isLast ? bi('Xong trong 5.8 phút!', 'Done in 5.8m!') : bi('Branch Protection ✔', 'Branch Protection ✔'),
                tone: 'ok',
              },
            },
          ],
          links: [
            { id: 'l1', from: 'src', to: 'sh', label: bi('--shard=i/4', '--shard=i/4') },
            { id: 'l2', from: 'sh', to: 'rep', label: isLast ? bi('curl /healthz ✔', 'curl /healthz ✔') : bi('fan-in gate', 'fan-in gate') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.5 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.5, offset: 0.45 },
          ],
        },
      };
    },
  },

  C09: {
    id: 'C09',
    titleEn: 'GitLab CI/CD in Production & Industry CI Tooling Map',
    subtitleEn: 'Translate mental models to .gitlab-ci.yml (stages, needs: [], cache policy, rules:) and compare Jenkins/CircleCI/Dagger.',
    durationMin: 14,
    difficulty: 'Intermediate',
    primaryMode: 'code-trace',
    objectives: [
      bi(
        'Chuyển đổi mượt mà tư duy từ GitHub Actions sang .gitlab-ci.yml thuần Container (default, stages, needs: [], parallel: 4, rules:)',
        'Translate seamlessly from GitHub Actions to container-first .gitlab-ci.yml (default, stages, needs: [], parallel, rules:)'
      ),
      bi(
        'Định vị rõ bức tranh công cụ thực tế: GitHub Actions vs GitLab CI vs Jenkins vs CircleCI / Buildkite vs Dagger',
        'Orient across industry CI platforms: GitHub Actions, GitLab CI, Jenkins, CircleCI/Buildkite, and Dagger'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;

      return {
        telemetry: [
          {
            label: bi('THỰC THI MẶC ĐỊNH', 'EXECUTION MODEL'),
            value: bi('Container-First (image:)', 'Container-First (image:)'),
            tone: 'ok',
          },
          {
            label: bi('VƯỢT RÀO STAGE', 'DAG BYPASS'),
            value: bi('needs: [] (chạy ở t=0s)', 'needs: [] (t=0s start)'),
            tone: 'ok',
          },
          {
            label: bi('CỔNG DUYỆT PROD', 'MANUAL GATE'),
            value: isLast
              ? bi('when: manual + allow_failure: false', 'manual + allow_failure: false')
              : bi('cache policy: pull', 'cache policy: pull'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'GitLab CI khởi chạy mỗi Job trực tiếp trong Docker Container',
                'GitLab CI Is Container-Native Out of the Box!',
                'Khác với GitHub Actions cấp máy ảo Ubuntu rồi mới gọi setup-node, GitLab Runner khởi chạy mọi Job trực tiếp bên trong Docker/K8s Container khai báo tại default: { image: node:22-alpine }.',
                'Unlike VM-first GitHub Actions, GitLab Runner boots every Job directly inside the Docker image declared under default: { image: node:22-alpine }!'
              )
            : s === 1
              ? callout(
                  'compare',
                  'Tính năng tích hợp sẵn của GitLab: Auto-Artifact và parallel: 4',
                  'Two GitLab Superpowers: Auto-Artifacts & 1-Line Sharding',
                  'Trên GitLab, các stage sau tự động tải artifacts của stage trước không cần plugin rời; và chỉ cần khai báo parallel: 4 là hệ thống tự cấp biến $CI_NODE_INDEX/$CI_NODE_TOTAL.',
                  'Downstream GitLab stages auto-download upstream artifacts natively, and a single line parallel: 4 shards tests with automatic $CI_NODE_INDEX/$CI_NODE_TOTAL vars!'
                )
              : s === 2
                ? callout(
                    'technique',
                    'Thực thi song song giữa các stage bằng từ khóa needs: []',
                    'Break Rigid Stage Barriers with needs: []',
                    'Mặc định toàn bộ stage trước phải xong thì stage sau mới được chạy. Gắn mảng rỗng needs: [] giúp các Job nhẹ (như lint) chạy ngay ở giây thứ 0.',
                    'By default, stages wait for every prior-stage job. Adding needs: [] lets fast lint jobs launch immediately at second zero!'
                  )
                : s === 3
                  ? callout(
                      'watch-out',
                      'Giới hạn đường dẫn GitLab Cache: phải nằm trong $CI_PROJECT_DIR',
                      'Critical GitLab Cache Rule: Must Live Inside $CI_PROJECT_DIR!',
                      'Viết paths: ["~/.npm"] trên GitLab sẽ bị bỏ qua vì nằm ngoài thư mục dự án. Hãy trỏ vào .npm/ nội bộ kèm policy: pull cho các Job test chỉ đọc.',
                      'Paths outside $CI_PROJECT_DIR like ~/.npm are ignored by GitLab Runner! Cache .npm/ inside the workspace with policy: pull on downstream test jobs.'
                    )
                  : callout(
                      'key-idea',
                      'Sử dụng rules: hiện đại và đối chiếu hệ sinh thái công cụ CI/CD',
                      'Architect Takeaway: Blocking Manual Rules & Ecosystem Orientation',
                      'Luôn kèm allow_failure: false cạnh when: manual để khóa cổng Production; đồng thời nắm rõ ưu nhược điểm giữa GitHub Actions (Cloud), GitLab CI (On-prem), Jenkins (Legacy), Buildkite (Hybrid quy mô lớn) và Dagger (Container SDK).',
                      'Always pair when: manual with allow_failure: false for blocking Prod gates — and know the trade-offs across GitHub Actions, GitLab CI, Jenkins, Buildkite, and Dagger!'
                    ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Ánh xạ cấu trúc Workflow sang tệp đơn .gitlab-ci.yml chạy thuần Container với parallel: 4',
                    'Mapped workflow concepts into container-native .gitlab-ci.yml with built-in parallel: 4 sharding'
                  ),
                },
              ]
            : s === 2
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Dùng từ khóa needs: biến các tầng stages tuần tự cứng nhắc thành đồ thị DAG linh hoạt',
                      'Unlocked early DAG execution across stages using needs: [] and targeted artifact dependencies'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      isLast
                        ? 'Thay thế only/except cũ bằng khối rules: kèm allow_failure: false và đối chiếu hệ sinh thái Jenkins/Dagger'
                        : 'Chuẩn hóa bộ đệm nội bộ .npm/ với policy: pull-push ở đầu nguồn và policy: pull ở hạ nguồn',
                      isLast
                        ? 'Upgraded legacy only/except to blocking rules: gates and mapped enterprise CI tool trade-offs'
                        : 'Configured in-project .npm/ cache with single writer (pull-push) and read-only consumers (pull)'
                    ),
                  },
                ],
        defaultCode: `default:\n  image: node:22-alpine\n\nstages: [install, test, build, deploy]\n\nlint_fast:\n  stage: test\n  needs: []\n  script:\n    - npm ci --cache .npm --prefer-offline\n    - npm run lint\n\ndeploy_prod:\n  stage: deploy\n  script: ./scripts/deploy.sh production\n  rules:\n    - if: '$CI_COMMIT_BRANCH == "main"'\n      when: manual\n      allow_failure: false`,
      };
    },
  },

  C10: {
    id: 'C10',
    titleEn: 'Pipeline Hardening: Least-Privilege GITHUB_TOKEN, Script Injection & SHA Pinning',
    subtitleEn: 'Neutralize ${{ github.event.pull_request.title }} shell RCE, Pwn Requests, and mutable tag supply-chain attacks.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Khoá chặt GITHUB_TOKEN ở mức chỉ đọc (permissions: contents: read) và chặn đứng lỗi RCE Script Injection bằng trung gian env:',
        'Enforce least-privilege permissions: contents: read and neutralize shell Script Injection via env: bindings'
      ),
      bi(
        'Phòng chống lỗ hổng Pwn Request trên nhánh Fork (cấm checkout PR trong pull_request_target) và ghim cứng Commit SHA 40 ký tự cho Action bên thứ 3',
        'Prevent Fork Pwn Requests and pin third-party Actions to immutable 40-character Git commit SHAs'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const vuln = s === 0 || s === 2 || s === 3;

      return {
        telemetry: [
          {
            label: bi('QUYỀN GITHUB_TOKEN', 'TOKEN SCOPE'),
            value: bi('contents: read (Tối thiểu)', 'contents: read (Least Priv)'),
            tone: 'ok',
          },
          {
            label: bi('CHỐNG TIÊM LỆNH RCE', 'SHELL INJECTION'),
            value:
              s === 0
                ? bi('Rủi ro ${{ pr.title }}!', 'Vulnerable ${{ pr.title }}!')
                : bi('Bọc an toàn qua env: "$VAR"', 'Safe via env: "$VAR"'),
            tone: s === 0 ? 'bad' : 'ok',
          },
          {
            label: bi('CHUỖI CUNG ỨNG', 'SUPPLY CHAIN'),
            value:
              s === 3
                ? bi('Cấm pull_request_target + PR!', 'Never checkout Fork in _target!')
                : bi('Ghim đủ 40 ký tự SHA', 'Full 40-char Commit SHA'),
            tone: s === 3 ? 'warn' : 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Vì sao CI/CD Runner là mục tiêu tấn công có giá trị cao?',
                'Why Hackers Target CI Runners Above Everything Else',
                'Runner giữ quyền ghi code vào kho Git, đẩy ảnh lên Registry và triển khai lên Cloud. Chỉ một lỗ hổng thực thi mã từ xa (RCE) từ Pull Request bên ngoài có thể làm lộ toàn bộ hạ tầng.',
                'CI Runners hold Git write tokens, registry credentials, and cloud deploy access! One Pull Request RCE vulnerability hands attackers the keys to your entire kingdom.'
              )
            : s === 1
              ? callout(
                  'technique',
                  'Nguyên tắc đặc quyền tối thiểu cho GITHUB_TOKEN (permissions:)',
                  'Least Privilege: Scoped Permissions vs Default Write-All',
                  'Đặt permissions: { contents: read } ngay đầu tệp YAML để thu hồi quyền write-all mặc định của GITHUB_TOKEN; chỉ cấp thêm packages: write ở đúng duy nhất Job đóng gói (tương tự thẻ từ chỉ mở đúng phòng cần thiết).',
                  'Set top-level permissions: { contents: read } to strip default write-all privileges, granting narrow scopes like packages: write only on the specific packaging job!'
                )
              : s === 2
                ? callout(
                    'watch-out',
                    'Phòng chống lỗ hổng Script Injection qua biến môi trường env:',
                    'YAML ${{ ... }} Inside run: Is Shell Injection!',
                    'GitHub nội suy văn bản ${{ github.event.pull_request.title }} (và tên nhánh head.ref) trước khi chạy bash. Đặt tiêu đề PR chứa "; curl ... sẽ thực thi lệnh tùy ý (tương tự SQL Injection). Luôn truyền dữ liệu đầu vào qua khối env:.',
                    'GitHub expands ${{ ... }} text BEFORE bash parses the script! Malicious PR titles or branch names execute arbitrary shell commands unless bound through env: variables.'
                  )
                : s === 3
                  ? callout(
                      'watch-out',
                      'Phòng tránh Pwn Request: phân biệt pull_request và pull_request_target',
                      'Pwn Request Alert: pull_request vs pull_request_target',
                      'pull_request_target chạy với đầy đủ Secrets của nhánh main. Nếu bên trong nó bạn checkout code từ Fork rồi chạy npm ci, kịch bản postinstall trong package.json của người gửi PR có thể đọc toàn bộ khóa Production.',
                      'pull_request_target runs with full main secrets and write token! Checking out untrusted Fork code and running npm ci executes attacker postinstall scripts with full secrets!'
                    )
                  : callout(
                      'key-idea',
                      'Bảo mật chuỗi cung ứng bằng cách ghim mã băm Commit SHA 40 ký tự',
                      'Architect Takeaway: Pin Third-Party Actions to 40-Char SHAs!',
                      'Thẻ phiên bản @v4 hay @main có thể bị kẻ chiếm quyền kho Action trỏ sang mã độc (như sự cố tj-actions/changed-files năm 2025). Chỉ mã băm Commit SHA đủ 40 ký tự hex mới đảm bảo bất biến.',
                      'Mutable tags like @v4 can be hijacked overnight (as seen in the 2025 tj-actions attack). Always pin third-party Actions to full immutable 40-character commit SHAs!'
                    ),
        whatChanged:
          s === 0
            ? [
                {
                  op: '~',
                  text: bi(
                    'Nhận diện 4 bề mặt tấn công chí mạng nhắm vào CI Runner từ Pull Request bên ngoài',
                    'Mapped the 4 critical attack vectors targeting CI Runners from untrusted Pull Requests'
                  ),
                },
              ]
            : s === 1
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Khóa permissions: { contents: read } ở đầu tệp YAML theo nguyên lý Đặc quyền tối thiểu',
                      'Locked top-level GITHUB_TOKEN permissions to contents: read (Least Privilege)'
                    ),
                  },
                ]
              : s === 2
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Đưa toàn bộ dữ liệu PR không tin cậy (title, body, head.ref) vào biến môi trường env: an toàn',
                        'Isolated untrusted PR metadata (title, body, head.ref) safely inside process env: bindings'
                      ),
                    },
                  ]
                : s === 3
                  ? [
                      {
                        op: '-',
                        text: bi(
                          'Ngăn chặn tuyệt đối việc checkout và chạy code nhánh Fork bên trong sự kiện pull_request_target',
                          'Prohibited checking out or executing untrusted Fork code inside pull_request_target'
                        ),
                      },
                    ]
                  : [
                      {
                        op: '+',
                        text: bi(
                          'Ghim cứng mã băm Git Commit SHA đủ 40 ký tự bất biến cho toàn bộ Action bên thứ ba',
                          'Pinned all third-party Actions to immutable 40-character Git commit SHAs'
                        ),
                      },
                    ],
        scene: {
          nodes: [
            {
              id: 'pr',
              shape: 'device',
              tone: vuln ? 'rose' : 'neutral',
              x: -245,
              y: 10,
              label: bi('Untrusted Fork PR', 'Untrusted Fork PR'),
              sublabel: bi('title · head.ref · code', 'title · head.ref · code'),
              highlighted: s === 0 || s === 2 || s === 3,
            },
            {
              id: 'sh',
              shape: 'block',
              tone: s === 0 ? 'rose' : 'green',
              x: -5,
              y: -25,
              label: s === 0 ? bi('Inline run: ${{}}', 'Inline run: ${{}}') : bi('Hardened Workflow', 'Hardened Workflow'),
              icon: 'shield',
              highlighted: s >= 1,
              badge: {
                text:
                  s === 0
                    ? bi('RCE Injection Risk!', 'RCE Injection Risk!')
                    : isLast
                      ? bi('40-char SHA Pinned ✔', '40-char SHA Pinned ✔')
                      : bi('env: + Sandbox PR ✔', 'env: + Sandbox PR ✔'),
                tone: s === 0 ? 'bad' : 'ok',
              },
            },
            {
              id: 'tok',
              shape: 'db',
              tone: 'blue',
              x: 235,
              y: 15,
              label: bi('Scoped Token (Read)', 'Scoped Token (Read)'),
              highlighted: s === 1 || isLast,
            },
          ],
          links: [
            {
              id: 'l1',
              from: 'pr',
              to: 'sh',
              style: s === 0 ? 'danger' : 'solid',
              label: s === 0 ? bi('shell breakout!', 'shell breakout!') : bi('sanitized env:', 'sanitized env:'),
            },
            {
              id: 'l2',
              from: 'sh',
              to: 'tok',
              style: s === 0 ? 'danger' : 'solid',
              label: s === 0 ? bi('token theft!', 'token theft!') : bi('contents: read', 'contents: read'),
            },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: s === 0 ? 'error' : 'request', speed: 0.46 },
            ...(s > 0 ? [{ id: 'p2', linkId: 'l2', kind: 'response' as const, speed: 0.46, offset: 0.48 }] : []),
          ],
        },
      };
    },
  },

  C11: {
    id: 'C11',
    titleEn: '5-Layer DevSecOps Shield: Secret Scan, SAST, SCA, Trivy CVE & SBOM',
    subtitleEn: 'Demystify SAST vs SCA vs Container Scan vs SBOM and build rootless images without privileged DinD.',
    durationMin: 14,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Phân biệt rõ 5 lớp bảo mật: Secret Scan (lịch sử Git), SAST (code tự viết), SCA (thư viện bên thứ ba), Trivy (CVE hệ điều hành Container) và SBOM (danh mục thành phần phần mềm)',
        'Demystify Secret Scanning, SAST (your code), SCA (3rd-party deps), Trivy (OS image CVEs), and SBOM (software bill of materials)'
      ),
      bi(
        'Giảm thiểu cảnh báo nhiễu (--omit=dev, Trivy --exit-code 1 --ignore-unfixed) và đóng gói Container Rootless với Kaniko thay cho docker:dind đặc quyền',
        'Eliminate alert fatigue (--omit=dev, --exit-code 1 --ignore-unfixed) and build rootless images via Kaniko'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;

      return {
        telemetry: [
          {
            label: bi('QUÉT CODE & THƯ VIỆN', 'SAST & SCA'),
            value: bi('Semgrep (src) + Audit (deps)', 'Semgrep (src) + Audit (deps)'),
            tone: 'ok',
          },
          {
            label: bi('CỔNG CHẶN IMAGE', 'TRIVY CVE GATE'),
            value:
              s === 2
                ? bi('--exit-code 1 --ignore-unfixed', '--exit-code 1 --ignore-unfixed')
                : bi('Chặn CRITICAL có bản vá', 'Block fixable CRITICAL'),
            tone: 'ok',
          },
          {
            label: bi('ĐÓNG GÓI & HỒ SƠ', 'BUILD & SBOM'),
            value: isLast ? bi('Kaniko Rootless + SBOM', 'Kaniko Rootless + SBOM') : bi('CycloneDX sbom.cdx.json', 'CycloneDX sbom.cdx.json'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Shift-Left Security: Kiểm tra bảo mật tự động ngay từ mỗi Pull Request',
                'Shift-Left DevSecOps: Catch Flaws in 3 Minutes on Every PR',
                'Chờ tới sát ngày phát hành mới quét bảo mật dễ làm chậm tiến độ. Đưa 5 lớp kiểm tra tự động vào CI giúp phát hiện sớm lỗ hổng tương tự như công cụ lint.',
                'Waiting until pre-launch security audits stalls releases for weeks. Running 5 fast automated gates on every PR catches vulnerabilities as effortlessly as linting!'
              )
            : s === 1
              ? callout(
                  'compare',
                  'Phân biệt vai trò: SAST, SCA, Trivy Image Scan và SBOM',
                  '10-Second Clarity: SAST vs SCA vs Image Scan vs SBOM!',
                  'SAST phân tích mã nguồn tự viết; SCA kiểm tra thư viện bên thứ ba; Trivy quét các gói hệ điều hành bên trong Docker Image; còn SBOM xuất danh mục thành phần JSON giúp truy vết nhanh khi có lỗ hổng Zero-day mới.',
                  'SAST scans YOUR code; SCA audits THIRD-PARTY packages; Trivy scans OS packages inside the container image; and SBOM is the "nutrition ingredient label" for 2-second Zero-day lookups!'
                )
              : s === 2
                ? callout(
                    'watch-out',
                    'Lưu ý cấu hình Gitleaks (fetch-depth: 0) và Trivy (--exit-code 1)',
                    'Two Classic Traps: Shallow Gitleaks & Trivy Default Exit 0!',
                    'Gitleaks cần fetch-depth: 0 để kiểm tra cả khóa lộ trong commit cũ của PR; còn trivy image mặc định trả về 0 nên phải truyền --exit-code 1 (kèm --ignore-unfixed để giảm cảnh báo chưa có bản vá).',
                    'Gitleaks needs fetch-depth: 0 to catch keys deleted in later commits; and Trivy returns Exit 0 by default unless you pass --exit-code 1 (pair with --ignore-unfixed to avoid unactionable noise)!'
                  )
                : callout(
                    'watch-out',
                    'Thay thế docker:dind (privileged) bằng Kaniko hoặc BuildKit Rootless',
                    'Architect Takeaway: Replace Privileged DinD with Rootless Kaniko!',
                    'Bật privileged: true hoặc gắn /var/run/docker.sock trên Runner dùng chung tiềm ẩn rủi ro thoát khỏi container chiếm quyền host. Kaniko đóng gói image hoàn toàn trong userspace mà không cần quyền root.',
                    'Mounting docker.sock or running privileged DinD on shared runners grants host root escape! Use daemonless, rootless Kaniko or BuildKit instead.'
                  ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Thiết lập phễu phòng thủ 5 lớp: Gitleaks (Secrets) → Semgrep (SAST) → Audit (SCA) → Trivy → SBOM',
                    'Layered 5-stage defense-in-depth funnel from Git commit history to container OS & CycloneDX SBOM'
                  ),
                },
              ]
            : s === 2
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Tinh chỉnh ngưỡng thực dụng: fetch-depth: 0 --redact, --omit=dev và Trivy --exit-code 1 --ignore-unfixed',
                      'Tuned high-signal gates: full-history redacted secret scan, prod-only SCA, and fixable-CRITICAL Trivy gate'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      'Chuyển khâu đóng gói Container trên Runner nội bộ sang Kaniko Rootless không cần quyền root',
                      'Replaced privileged Docker-in-Docker with daemonless rootless Kaniko container builds'
                    ),
                  },
                ],
        scene: {
          nodes: [
            {
              id: 'code',
              shape: 'device',
              tone: s === 0 ? 'blue' : 'neutral',
              x: -255,
              y: 10,
              label: bi('Git + Lockfile', 'Git + Lockfile'),
              sublabel: bi('fetch-depth: 0', 'fetch-depth: 0'),
              highlighted: s === 0 || s === 2,
            },
            {
              id: 'sast',
              shape: 'block',
              tone: 'blue',
              x: -65,
              y: -32,
              label: bi('Gitleaks · SAST · SCA', 'Gitleaks · SAST · SCA'),
              icon: 'shield',
              highlighted: s === 1 || s === 2,
              badge: { text: bi('Code + 3rd-Party Deps', 'Code + 3rd-Party Deps'), tone: 'ok' },
            },
            {
              id: 'trv',
              shape: 'block',
              tone: isLast ? 'purple' : 'orange',
              x: 95,
              y: 22,
              label: isLast ? bi('Kaniko + Trivy', 'Kaniko + Trivy') : bi('Trivy + SBOM', 'Trivy + SBOM'),
              icon: 'shield',
              highlighted: s >= 1,
              badge: {
                text: isLast ? bi('Rootless + --exit-code 1', 'Rootless + --exit-code 1') : bi('0 Fixable Criticals', '0 Fixable Criticals'),
                tone: 'ok',
              },
            },
            {
              id: 'reg',
              shape: 'db',
              tone: 'green',
              x: 255,
              y: -22,
              label: bi('Registry + SBOM', 'Registry + SBOM'),
              highlighted: isLast,
            },
          ],
          links: [
            { id: 'l1', from: 'code', to: 'sast', label: bi('scan source & lock', 'scan source & lock') },
            { id: 'l2', from: 'sast', to: 'trv', label: isLast ? bi('kaniko rootless', 'kaniko rootless') : bi('build image', 'build image') },
            { id: 'l3', from: 'trv', to: 'reg', label: bi('push + sbom.cdx', 'push + sbom.cdx') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.45, offset: 0.34 },
            { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.45, offset: 0.68 },
          ],
        },
      };
    },
  },

  C12: {
    id: 'C12',
    titleEn: 'Keyless Cloud Authentication (OIDC), IAM Trust Policies & SLSA Provenance',
    subtitleEn: 'Replace permanent AWS/GCP static keys with 15-minute OIDC visitor badges and cryptographic build provenance.',
    durationMin: 14,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Thay thế hoàn toàn khóa tĩnh dài hạn (AWS_SECRET_ACCESS_KEY) bằng xác thực không mật khẩu sử dụng token ngắn hạn OIDC JWT (tự hết hạn sau 15–60 phút) qua AWS STS hoặc GCP WIF',
        'Replace multi-year static cloud keys with 15-minute self-expiring OIDC JWT tokens via AWS STS / GCP WIF'
      ),
      bi(
        'Giới hạn chặt điều kiện sub & aud trong IAM Trust Policy (không dùng ký tự đại diện repo:*) và xác thực nguồn gốc bản build với chuẩn SLSA Build Provenance',
        'Lock IAM Trust Policy sub & aud claims strictly and sign cryptographic SLSA Build Provenance attestations'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const subTrap = s === 2;

      return {
        telemetry: [
          {
            label: bi('KHOÁ TĨNH LƯU TRỮ', 'STATIC CLOUD KEYS'),
            value: bi('0 (Không lưu Static Key)', '0 (Zero Static Keys)'),
            tone: 'ok',
          },
          {
            label: bi('THẺ TẠM THỜI OIDC', 'STS TOKEN TTL'),
            value: bi('15–60 phút tự hết hạn', '15–60m auto-expiring'),
            tone: 'ok',
          },
          {
            label: bi('ĐIỀU KIỆN TIN CẬY', 'IAM SUB CLAIM'),
            value: subTrap
              ? bi('Không dùng repo:*', 'Never allow repo:*')
              : isLast
                ? bi('SLSA Provenance Signed ✔', 'SLSA Provenance Signed ✔')
                : bi('repo:org/app:ref:main', 'repo:org/app:ref:main'),
            tone: subTrap ? 'bad' : 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Xác thực không dùng khóa tĩnh (Keyless OIDC) thay cho Static Keys',
                'Keyless OIDC Authentication vs Static Keys',
                'Lưu AWS_SECRET_ACCESS_KEY dài hạn trong GitHub Secrets có rủi ro lộ thông tin vĩnh viễn nếu bị đánh cắp. Keyless OIDC thay thế hoàn toàn khóa tĩnh bằng token JWT ngắn hạn chỉ có hiệu lực 15–60 phút cho từng lần chạy (tương tự thẻ ra vào tạm thời thay cho chìa khóa cố định).',
                'Storing static AWS_SECRET_ACCESS_KEY for years risks permanent compromise if leaked. Keyless OIDC issues a 15-minute self-expiring JWT token per run.'
              )
            : s === 1
              ? callout(
                  'technique',
                  'Cơ chế trao đổi token: id-token: write + AWS STS / GCP WIF',
                  'How OIDC Handshake Works Across AWS, GCP & Azure',
                  'Runner dùng quyền id-token: write để nhận OIDC JWT từ GitHub, sau đó gửi sang AWS STS (hoặc GCP Workload Identity Federation / Azure) để đổi lấy phiên truy cập tạm thời mà không cần lưu bất kỳ mật khẩu tĩnh nào.',
                  'With id-token: write, the runner requests a GitHub-signed JWT and exchanges it at AWS STS (or GCP Workload Identity Federation) for ephemeral credentials — zero stored secrets!'
                )
              : subTrap
                ? callout(
                    'watch-out',
                    'Rủi ro bảo mật Cloud: Bắt buộc ràng buộc trường "sub" trong Trust Policy',
                    'Critical Cloud Misconfiguration: Always Lock the "sub" Claim!',
                    'Mọi kho GitHub đều dùng chung máy chủ phát hành token.actions.githubusercontent.com. Nếu IAM Trust Policy thiếu điều kiện sub (hoặc dùng "repo:*"), bất kỳ kho GitHub bên ngoài nào biết Role ARN đều có thể nhận quyền truy cập hạ tầng của bạn.',
                    'Every GitHub user shares issuer token.actions.githubusercontent.com! Omitting the sub claim condition (or using repo:*) lets any external GitHub repo assume your production IAM Role!'
                  )
                : callout(
                    'key-idea',
                    'Xác thực nguồn gốc bản build với chuẩn SLSA Build Provenance',
                    'Architect Takeaway: SLSA Provenance = Certificate of Origin',
                    'Kết hợp id-token: write + attestations: write với actions/attest-build-provenance@v2 để ký mật mã xác nhận ảnh Container thực sự được build từ đúng kho Git, commit SHA và workflow CI chính thống.',
                    'Pairing id-token: write + attestations: write signs an unforgeable SLSA certificate proving the container image came from your exact repo, commit, and trusted CI workflow!'
                  ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '-',
                  text: bi(
                    'Xoá bỏ vĩnh viễn cặp khoá tĩnh AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY khỏi GitHub Secrets',
                    'Deleted permanent static cloud access keys from CI secrets forever'
                  ),
                },
                {
                  op: '+',
                  text: bi(
                    'Bật id-token: write đổi thẻ OIDC JWT ngắn hạn trực tiếp với AWS STS / GCP WIF',
                    'Enabled id-token: write exchanging signed OIDC JWTs for short-lived STS tokens'
                  ),
                },
              ]
            : subTrap
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Khóa cứng StringEquals cho cả aud (sts.amazonaws.com) và sub (đúng org/repo + nhánh main)',
                      'Locked IAM Trust Policy StringEquals conditions on both aud and exact repo/branch sub claim'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      'Ký giấy chứng nhận xuất xứ mật mã SLSA Build Provenance đính kèm thẳng lên Container Registry',
                      'Signed cryptographic SLSA Build Provenance attestation pushed alongside image digest'
                    ),
                  },
                ],
        scene: {
          nodes: [
            {
              id: 'run',
              shape: 'block',
              tone: 'blue',
              x: -235,
              y: 10,
              label: bi('CI Runner', 'CI Runner'),
              icon: 'cpu',
              highlighted: s <= 1 || isLast,
              badge: {
                text: isLast ? bi('attestations: write', 'attestations: write') : bi('id-token: write', 'id-token: write'),
                tone: 'ok',
              },
            },
            {
              id: 'idp',
              shape: 'block',
              tone: subTrap ? 'orange' : 'purple',
              x: -5,
              y: -38,
              label: bi('OIDC JWT Badge', 'OIDC JWT Badge'),
              icon: 'shield',
              highlighted: s === 1 || subTrap,
              badge: {
                text: subTrap ? bi('Lock sub + aud!', 'Lock sub + aud!') : bi('Signed 15m Badge', 'Signed 15m Badge'),
                tone: subTrap ? 'warn' : 'ok',
              },
            },
            {
              id: 'aws',
              shape: 'db',
              tone: 'green',
              x: 235,
              y: 20,
              label: isLast ? bi('Cloud + SLSA Verified', 'Cloud + SLSA Verified') : bi('AWS STS / GCP WIF', 'AWS STS / GCP WIF'),
              highlighted: s >= 1,
            },
          ],
          links: [
            { id: 'l1', from: 'run', to: 'idp', label: bi('mint OIDC JWT', 'mint OIDC JWT') },
            {
              id: 'l2',
              from: 'idp',
              to: 'aws',
              label: subTrap ? bi('verify exact sub!', 'verify exact sub!') : bi('issue 15m token', 'issue 15m token'),
            },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.48 },
          ],
        },
      };
    },
  },

  C13: {
    id: 'C13',
    titleEn: 'Protected Environments, CODEOWNERS & Governance Gates',
    subtitleEn: 'Isolate production secrets behind human approval gates, enforce CODEOWNERS, and run safe low-noise AI reviews.',
    durationMin: 12,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Cô lập biến nhạy cảm trong GitHub Protected Environments (staging → smoke test → bấm duyệt Approve mới giải mã secret production)',
        'Isolate production secrets inside Protected Environments requiring main branch + human Reviewer sign-off'
      ),
      bi(
        'Áp dụng quy tắc "dòng khớp cuối thắng" của CODEOWNERS kèm Branch Ruleset và cấu hình cổng AI PR Review ít nhiễu, chống lộ khóa từ Fork',
        'Enforce CODEOWNERS (last-match-wins + Ruleset) and configure fork-safe, low-noise AI PR reviews'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;

      return {
        telemetry: [
          {
            label: bi('MÔI TRƯỜNG PROD', 'PROD ENVIRONMENT'),
            value: bi('Approve + Chỉ nhánh main', 'Approval + main branch only'),
            tone: 'ok',
          },
          {
            label: bi('CHỦ SỞ HỮU VÙNG CODE', 'CODEOWNERS RULE'),
            value:
              s === 2
                ? bi('Khớp cuối thắng + Ruleset!', 'Last-match-wins + Ruleset!')
                : bi('@sec-team · @dba-team', '@sec-team · @dba-team'),
            tone: s === 2 ? 'warn' : 'ok',
          },
          {
            label: bi('CỔNG RÀ SOÁT AI', 'AI PR GATE'),
            value: isLast ? bi('Lọc lockfile + Chặn Fork', 'Ignore lockfile + Block Fork') : bi('Audit Log đầy đủ', 'Full Audit Trail'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Quản trị Phát hành (Governance): Phanh an toàn mà không làm tắc nghẽn tốc độ',
                'Release Governance: Safety Rails Without Bureaucracy',
                'Quét bảo mật tự động thôi chưa đủ: doanh nghiệp cần biết rõ AI/Người nào đã duyệt bản lên Prod, ai chịu trách nhiệm khi PR chạm vào thư mục .github/workflows/ hay SQL migration!',
                'Automated scans aren’t enough: enterprises need auditable production approvals and mandatory domain-owner sign-offs whenever PRs touch workflows or DB migrations!'
              )
            : s === 1
              ? callout(
                  'technique',
                  'Environment Secrets: Chỉ giải mã khi vượt qua đủ cổng phê duyệt!',
                  'Environment Secrets Unlock Only After Approval Passes',
                  'Đặt AWS_ROLE_ARN trong Environment "production" đảm bảo nhánh tính năng nháp không bao giờ chạm được tới — chỉ khi chạy từ nhánh main và được Tech Lead bấm Approve thì khóa mới được giải mã!',
                  'Storing AWS_ROLE_ARN inside the "production" Environment ensures feature branches can never read it — secrets decrypt only after main-branch + Required Reviewer checks pass!'
                )
              : s === 2
                ? callout(
                    'watch-out',
                    'Hai quy tắc quan trọng khi cấu hình .github/CODEOWNERS',
                    'Two Classic CODEOWNERS Gotchas!',
                    '1) Đọc từ trên xuống dưới, dòng khớp cuối cùng sẽ có hiệu lực (tương tự .gitignore). 2) Chỉ tạo file CODEOWNERS chưa đủ để chặn nút Merge — cần bật thêm tùy chọn "Require review from Code Owners" trong Branch Ruleset.',
                    '1) Evaluated top-to-bottom where LAST MATCH WINS! 2) CODEOWNERS alone only requests reviews — you MUST enable "Require review from Code Owners" in Branch Rulesets to block merges!'
                  )
                : callout(
                    'watch-out',
                    'Giảm nhiễu cho AI Review và bảo vệ API Key trước Fork PR',
                    'Architect Takeaway: Low-Noise, Fork-Safe AI Review Gates',
                    'Loại bỏ !**/package-lock.json và !**/dist/** trong path_filters để tránh AI tạo bình luận thừa; đồng thời không chạy AI workflow giữ khóa API bằng pull_request_target trên code từ Fork.',
                    'Exclude lockfiles and dist/ via path_filters to prevent noisy AI comments, and never expose LLM API keys to untrusted Fork code via pull_request_target!'
                  ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Dựng luồng thăng hạng staging → smoke-test → cổng duyệt tay Protected Environment production',
                    'Built promotion pipeline from staging + smoke tests into approval-gated production Environment'
                  ),
                },
              ]
            : s === 2
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Ánh xạ /.github/workflows/, /db/migrations/ và /src/auth/ tới đúng nhóm chuyên trách trong CODEOWNERS',
                      'Mapped sensitive workflow, migration, and auth paths to dedicated owners via CODEOWNERS + Ruleset'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      'Cấu hình lọc bỏ tệp sinh tự động (path_filters) và chặn thực thi khóa AI trên nhánh Fork lạ',
                      'Filtered generated lockfiles/bundles from AI reviews and guarded LLM secrets against Fork PRs'
                    ),
                  },
                ],
        scene: {
          nodes: [
            {
              id: 'pr',
              shape: 'device',
              tone: s === 0 ? 'blue' : 'neutral',
              x: -245,
              y: 10,
              label: isLast ? bi('PR + AI Gate', 'PR + AI Gate') : bi('Infra / App PR', 'Infra / App PR'),
              highlighted: s === 0 || isLast,
            },
            {
              id: 'gov',
              shape: 'block',
              tone: 'orange',
              x: -5,
              y: -25,
              label: s === 2 ? bi('CODEOWNERS Gate', 'CODEOWNERS Gate') : bi('Env Approval Gate', 'Env Approval Gate'),
              icon: 'shield',
              highlighted: s === 1 || s === 2,
              badge: {
                text: s === 2 ? bi('Last Match + Ruleset', 'Last Match + Ruleset') : bi('Required Reviewers', 'Required Reviewers'),
                tone: 'ok',
              },
            },
            {
              id: 'prd',
              shape: 'db',
              tone: 'green',
              x: 235,
              y: 15,
              label: bi('Production Env', 'Production Env'),
              highlighted: s === 1 || isLast,
            },
          ],
          links: [
            { id: 'l1', from: 'pr', to: 'gov', label: bi('owner + AI check', 'owner + AI check') },
            { id: 'l2', from: 'gov', to: 'prd', label: bi('unlock prod secret', 'unlock prod secret') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.45, offset: 0.48 },
          ],
        },
      };
    },
  },

  C14: {
    id: 'C14',
    titleEn: 'Zero-Downtime Delivery: Canary, Blue-Green & Automated Rollback',
    subtitleEn: 'Tag immutable SHA images, compare Rolling vs Blue-Green vs Canary ("coal-mine canary"), and wire auto-rollback.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Luôn gắn thẻ ảnh bất biến (sha-<commit>) thay cho :latest để có thể quay lui tức thì về đúng bản ổn định cũ',
        'Tag immutable commit-SHA images instead of mutable :latest so rollbacks always target an exact known artifact'
      ),
      bi(
        'Phân biệt Rolling Update, Blue-Green (hai cụm song song, chuyển lưu lượng tức thì, tốn ~2x tài nguyên) và Canary (chuyển dần 5% → 25% → 100%) kèm tự động Rollback (curl --fail + if: failure())',
        'Contrast Rolling, Blue-Green (instant switch, 2x capacity), and Canary (5%->25%->100%) with automated SLO rollback'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;

      return {
        telemetry: [
          {
            label: bi('THẺ IMAGE CHUẨN', 'IMAGE TAGGING'),
            value: s === 1 ? bi('sha-<commit> (Cấm :latest!)', 'sha-<commit> (No :latest!)') : bi('Immutable SHA Digest', 'Immutable SHA Digest'),
            tone: 'ok',
          },
          {
            label: bi('BÁN KÍNH RỦI RO', 'BLAST RADIUS'),
            value: bi('5% Canary bước đầu', '5% initial Canary'),
            tone: 'ok',
          },
          {
            label: bi('PHANH KHẨN CẤP', 'AUTO ROLLBACK'),
            value: isLast
              ? bi('curl --fail + if: failure()!', 'curl --fail + if: failure()!')
              : bi('Tự cắt lui nếu 5xx > 1%', 'Abort if 5xx > 1%'),
            tone: isLast ? 'warn' : 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Phát hành liên tục không gián đoạn (Zero-Downtime Delivery)',
                'Deploy 30× a Day at Peak Load with Zero User-Facing Errors!',
                'Độ tin cậy cao đạt được nhờ giới hạn phạm vi ảnh hưởng (Blast Radius) xuống 5% lưu lượng khi thử nghiệm bản mới và tự động quay lui trong dưới 30 giây nếu tỷ lệ lỗi tăng vượt ngưỡng.',
                'Elite reliability comes not from bug-free humans, but from shrinking deployment blast radius to 5% traffic and auto-rolling back within 30 seconds on metric spikes!'
              )
            : s === 1
              ? callout(
                  'watch-out',
                  'Lý do không nên dùng thẻ Docker ":latest" trên Production',
                  'Why Mutable ":latest" Tags Destroy 2 AM Rollbacks',
                  'Đẩy đè lên :latest làm mất dấu ảnh ổn định cũ và khiến các Node K8s chạy lệch phiên bản. Mỗi commit nên gắn thẻ bất biến sha-${{ github.sha }} (hoặc v1.4.2) để có thể quay lui chính xác.',
                  'Overwriting :latest erases your last known-good artifact and causes node version skew! Always tag images immutably with sha-${{ github.sha }}.'
                )
              : s === 2
                ? callout(
                    'compare',
                    'So sánh 3 chiến lược: Rolling Update, Blue-Green và Canary',
                    'Rolling Update vs Blue-Green vs Canary Strategies',
                    'Rolling Update thay thế lần lượt từng Pod để tiết kiệm chi phí; Blue-Green dựng cụm mới song song rồi chuyển 100% lưu lượng tức thì (tốn ~2x tài nguyên tạm thời); Canary chuyển dần 5% → 25% → 100% để theo dõi lỗi sớm (dùng pause: {} khi cần dừng chờ lệnh promote).',
                    'Rolling swaps pods gradually; Blue-Green switches 100% traffic in <1s at 2× temp capacity; Canary tests 5% live traffic first before promoting 25% → 100%!'
                  )
                : callout(
                    'watch-out',
                    'Hai lỗi cấu hình làm vô hiệu hóa Job Rollback tự động',
                    'Architect Takeaway: Two Bugs That Silently Disable Rollback!',
                    '1) Smoke test gọi curl thiếu cờ --fail vẫn thoát mã 0 dù API trả HTTP 500. 2) Job rollback có needs: [smoke-test] nếu thiếu if: failure() sẽ bị GitHub bỏ qua (Skipped) ngay khi smoke-test thất bại.',
                    '1) curl without --fail exits 0 on HTTP 500! 2) A rollback job with needs: defaults to if: success() — without explicit if: failure(), it gets SKIPPED right when smoke tests fail!'
                  ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Gắn thẻ bất biến sha-<git_sha> cho mọi bản đóng gói Container thay thế hoàn toàn :latest',
                    'Enforced immutable commit-SHA image tags replacing mutable :latest tags'
                  ),
                },
              ]
            : s === 2
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Phân luồng 95% khách vào Stable v1 và mở thăm dò 5% sang Canary v2 qua Argo Rollouts',
                      'Split L7 traffic 95% Stable v1 / 5% Canary v2 with progressive pause gates'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      'Kết nối hậu kiểm curl --fail --retry 5 với phanh tự động rollback kích hoạt qua if: failure()',
                      'Wired curl --fail post-deploy smoke test into automated rollback job via if: failure()'
                    ),
                  },
                ],
        scene: {
          nodes: [
            {
              id: 'gw',
              shape: 'block',
              tone: 'purple',
              x: -230,
              y: 0,
              label: bi('Traffic Router', 'Traffic Router'),
              icon: 'globe',
              highlighted: s === 2,
              badge: {
                text: isLast ? bi('Auto-Revert to v1!', 'Auto-Revert to v1!') : bi('95% / 5% Split', '95% / 5% Split'),
                tone: isLast ? 'warn' : 'ok',
              },
            },
            {
              id: 'v1',
              shape: 'block',
              tone: 'green',
              x: 195,
              y: -62,
              label: bi('Stable v1 (sha-a1b2)', 'Stable v1 (sha-a1b2)'),
              icon: 'shield',
              loadPct: isLast ? 100 : 95,
              highlighted: s === 1 || isLast,
            },
            {
              id: 'v2',
              shape: 'block',
              tone: isLast ? 'rose' : 'yellow',
              x: 195,
              y: 66,
              label: bi('Canary v2 (5%)', 'Canary v2 (5%)'),
              icon: isLast ? 'alert' : 'zap',
              loadPct: isLast ? 0 : 5,
              highlighted: s >= 2,
              badge: {
                text: isLast ? bi('5xx Breach → 0%!', '5xx Breach → 0%!') : bi('SLO Watch: <1% err', 'SLO Watch: <1% err'),
                tone: isLast ? 'bad' : 'ok',
              },
            },
          ],
          links: [
            { id: 'l1', from: 'gw', to: 'v1', label: isLast ? bi('100% restored ✔', '100% restored ✔') : bi('95% stable', '95% stable') },
            {
              id: 'l2',
              from: 'gw',
              to: 'v2',
              style: isLast ? 'danger' : 'dashed',
              label: isLast ? bi('aborted (<30s)', 'aborted (<30s)') : bi('5% canary', '5% canary'),
            },
          ],
          packets: isLast
            ? [
                { id: 'p1', linkId: 'l1', kind: 'response', speed: 0.5 },
                { id: 'p2', linkId: 'l2', kind: 'error', speed: 0.42 },
              ]
            : [
                { id: 'p1', linkId: 'l1', kind: 'response', speed: 0.5 },
                { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.42, offset: 0.4 },
              ],
        },
      };
    },
  },

  C15: {
    id: 'C15',
    titleEn: 'Pull-Based GitOps in Production: Argo CD vs Flux CD',
    subtitleEn: 'Eliminate external KUBECONFIG secrets — let in-cluster GitOps agents pull, self-heal drift, and sequence sync waves.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Hiểu sâu sự khác biệt giữa Push-based CD (CI bên ngoài cầm chìa khóa admin K8s) và Pull-based GitOps (Argo CD / Flux CD nằm bên trong cụm tự kéo từ Git)',
        'Contrast external Push-based CI deploys against secure in-cluster Pull-based GitOps (Argo CD & Flux CD)'
      ),
      bi(
        'Tách kho App Repo vs Config Repo, bật prune + selfHeal chống sửa tay trái phép và điều phối DB migrate trước App bằng sync-wave',
        'Separate App & Config repos, enable prune + selfHeal drift recovery, and order DB migrations via sync-wave'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;

      return {
        telemetry: [
          {
            label: bi('MÔ HÌNH TRIỂN KHAI', 'DELIVERY MODEL'),
            value: s === 1 ? bi('Argo CD / Flux CD (Pull)', 'Argo CD / Flux CD (Pull)') : bi('Pull-Based GitOps', 'Pull-Based GitOps'),
            tone: 'ok',
          },
          {
            label: bi('KUBECONFIG TRÊN CI', 'EXTERNAL K8S KEY'),
            value: bi('0 (Đóng kín cổng API!)', '0 (Zero inbound K8s API!)'),
            tone: 'ok',
          },
          {
            label: bi('ĐỒNG BỘ & THỨ TỰ', 'DRIFT & WAVES'),
            value: isLast ? bi('sync-wave: "-1" → "0"', 'sync-wave: "-1" → "0"') : bi('prune + selfHeal: true', 'prune + selfHeal: true'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Pull-based GitOps: Không lưu KUBECONFIG quản trị cụm trên CI bên ngoài',
                'Stop Handing Cluster-Admin Keys to External CI Runners!',
                'Push-based CD yêu cầu lưu KUBECONFIG quyền cao trên CI bên ngoài và mở API Server K8s ra Internet. Pull-based GitOps đặt Argo CD bên trong cụm K8s để chủ động kéo cấu hình chuẩn từ Git về đồng bộ.',
                'Push-based CD exposes cluster-admin KUBECONFIGs to external CI runners. Pull-based GitOps places Argo CD safely INSIDE the cluster, pulling desired YAML outbound from Git!'
              )
            : s === 1
              ? callout(
                  'compare',
                  'Bản đồ GitOps: Khi nào chọn Argo CD, khi nào chọn Flux CD?',
                  'GitOps Ecosystem: Choosing Argo CD vs Flux CD',
                  'Argo CD tỏa sáng nhờ giao diện Web UI đồ họa cây tài nguyên trực quan, SSO đa cụm & Argo Rollouts cho Developer; còn Flux CD siêu nhẹ thuần Kubernetes CRD/CLI rất hợp cho đội Platform tự động hóa hàng trăm cụm biên!',
                  'Argo CD shines with its rich visual topology UI, multi-cluster SSO, and Argo Rollouts; Flux CD offers lightweight composable Kubernetes CRDs ideal for CLI/Terraform-driven fleet automation!'
                )
              : s === 2
                ? callout(
                    'technique',
                    'Tại sao phải tách riêng App Repo và GitOps Config Repo?',
                    'Why Two Repos Beat One: Avoiding Infinite CI Loops',
                    'Nếu CI sửa tag ảnh YAML rồi git push ngay trong chính kho code ứng dụng, commit đó sẽ kích hoạt chạy lại toàn bộ pipeline test/build! Tách sang kho shop-gitops vừa sạch lịch sử vừa phân tách quyền Dev vs SRE.',
                    'Committing image tag bumps back into the app repo re-triggers full CI builds! Separating a dedicated GitOps config repo prevents CI loops and isolates prod RBAC.'
                  )
                : s === 3
                  ? callout(
                      'watch-out',
                      'Bật selfHeal: true đồng nghĩa Rollback chuẩn phải là "git revert"!',
                      'With selfHeal: true, Manual kubectl Edits Are Reverted Instantly!',
                      'Nếu lúc sự cố bạn gõ tay kubectl set image trên cụm, 5 giây sau Argo CD thấy lệch chuẩn Git (OutOfSync) sẽ tự động đè ngược lại bản lỗi! Trong GitOps, mọi thao tác Rollback phải là git revert trên kho Config.',
                      'If you run manual kubectl set image during an outage, selfHeal: true overwrites your change within seconds! In GitOps, rollbacks are always a clean git revert commit.'
                    )
                  : callout(
                      'key-idea',
                      'Đúc kết Kiến trúc sư: Dùng sync-wave: "-1" ép Job DB Migrate xong trước khi bật Pod mới!',
                      'Architect Takeaway: Sequence Migrations First via sync-wave: "-1"',
                      'Argo CD chạy sync-wave theo thứ tự số nguyên tăng dần (-2 → -1 → 0 → 1) và chờ Wave nhỏ đạt Healthy/Succeeded hoàn toàn mới lăn bánh Deployment ở Wave "0"!',
                      'Argo CD reconciles sync-waves from lowest integer upward (-2 → -1 → 0) and waits for Wave "-1" migration Jobs to report Succeeded before rolling Wave "0" Pods!'
                    ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '-',
                  text: bi(
                    'Thu hồi hoàn toàn khóa KUBECONFIG quản trị cụm khỏi các máy chủ CI bên ngoài',
                    'Revoked external cluster-admin KUBECONFIG credentials from CI pipelines'
                  ),
                },
                {
                  op: '+',
                  text: bi(
                    'Triển khai tác nhân Pull-based GitOps (Argo CD / Flux CD) đối soát chiều ra từ bên trong cụm K8s',
                    'Deployed in-cluster Pull-based GitOps controller reconciling desired state outbound from Git'
                  ),
                },
              ]
            : s === 2
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Tách riêng kho mã nguồn shop-api (CI) và kho cấu hình triển khai shop-gitops (Kustomize/Helm)',
                      'Decoupled application source repo from GitOps manifest repository preventing CI loops'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      isLast
                        ? 'Gắn annotation sync-wave: "-1" đảm bảo Job nâng cấp DB hoàn tất trước Deployment ứng dụng'
                        : 'Bật cặp cờ automated.prune: true (dọn rác mồ côi) và selfHeal: true (tự chữa lành lệch chuẩn)',
                      isLast
                        ? 'Ordered database migration Jobs ahead of app Deployments via argocd sync-wave: "-1"'
                        : 'Enabled automated prune: true and selfHeal: true enforcing Git as Single Source of Truth'
                    ),
                  },
                ],
        scene: {
          nodes: [
            {
              id: 'git',
              shape: 'db',
              tone: 'yellow',
              x: -235,
              y: 10,
              label: bi('GitOps Config Repo', 'GitOps Config Repo'),
              sublabel: bi('Single Source of Truth', 'Single Source of Truth'),
              highlighted: s === 2 || s === 3,
            },
            {
              id: 'argo',
              shape: 'block',
              tone: 'green',
              x: 0,
              y: -28,
              label: bi('Argo CD (In-Cluster)', 'Argo CD (In-Cluster)'),
              icon: 'git',
              highlighted: s <= 1 || s >= 3,
              badge: {
                text: isLast ? bi('Wave -1 → Wave 0 ✔', 'Wave -1 → Wave 0 ✔') : bi('prune + selfHeal ✔', 'prune + selfHeal ✔'),
                tone: 'ok',
              },
            },
            {
              id: 'k8s',
              shape: 'crowd',
              tone: 'blue',
              x: 235,
              y: 18,
              label: bi('Prod K8s Cluster', 'Prod K8s Cluster'),
              highlighted: isLast,
            },
          ],
          links: [
            { id: 'l1', from: 'git', to: 'argo', label: bi('outbound HTTPS pull', 'outbound HTTPS pull') },
            { id: 'l2', from: 'argo', to: 'k8s', label: isLast ? bi('migrate then rollout', 'migrate then rollout') : bi('reconcile drift 24/7', 'reconcile drift 24/7') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'pointer', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.48 },
          ],
        },
      };
    },
  },

  C16: {
    id: 'C16',
    titleEn: 'Zero-Downtime DB Migrations (Expand-and-Contract), Monorepo CI & DORA',
    subtitleEn: 'Evolve SQL schemas safely alongside live v1/v2 pods, run affected-only Monorepo CI, and balance the 4 DORA metrics.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'memory-2d',
    objectives: [
      bi(
        'Không RENAME / DROP cột SQL trực tiếp trong lúc Rolling Update — áp dụng quy trình 3 pha tương thích ngược Expand → Switch Read → Contract',
        'Never RENAME/DROP SQL columns directly during RollingUpdates — apply 3-phase Expand-and-Contract'
      ),
      bi(
        'Tối ưu Monorepo CI theo đồ thị phụ thuộc (Turborepo --filter=...[origin/main] kèm fetch-depth: 0) và đo lường 4 chỉ số DORA',
        'Filter Monorepo CI via dependency graphs (fetch-depth: 0 + --filter=...[origin/main]) and track the 4 DORA metrics'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;

      return {
        telemetry: [
          {
            label: bi('ĐỔI CỘT TRỰC TIẾP', 'DIRECT RENAME/DROP'),
            value: bi('Lỗi Pod v1 khi Rolling Update', 'Crashes live v1 Pods'),
            tone: 'bad',
          },
          {
            label: bi('MONOREPO GRAPH', 'AFFECTED FILTER'),
            value:
              s === 2
                ? bi('fetch-depth: 0 + ...[main]', 'fetch-depth: 0 + ...[main]')
                : bi('Expand → Switch → Contract', 'Expand → Switch → Contract'),
            tone: 'ok',
          },
          {
            label: bi('THƯỚC ĐO DORA ELITE', 'DORA ELITE TARGET'),
            value: isLast ? bi('Lead <1h · CFR <5% · MTTR <1h', 'Lead <1h · CFR <5% · MTTR <1h') : bi('v1 & v2 Tương thích 100%', '100% v1/v2 Compatible'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Ba bài toán kiến trúc CI/CD khi hệ thống mở rộng quy mô',
                'Three Architecture Pillars of High-Scale Engineering',
                'Ở quy mô lớn: đổi tên cột SQL trực tiếp sẽ làm lỗi Pod v1 khi Rolling Update; build lại toàn bộ Monorepo gây lãng phí CI; và thiếu chỉ số DORA khiến đội ngũ khó đánh giá khách quan hiệu suất phát hành.',
                'At scale: naive SQL renames crash rolling pods, unfiltered monorepos burn CI budgets, and missing DORA telemetry leaves engineering leadership flying blind!'
              )
            : s === 1
              ? callout(
                  'watch-out',
                  'Mô hình Expand-and-Contract 3 pha: vì sao không chạy RENAME COLUMN trực tiếp?',
                  'Why Direct RENAME COLUMN Causes Outages During Rolling Updates',
                  'Trong thời gian Rolling Update, cả Pod v1 (code cũ) và Pod v2 (code mới) cùng truy vấn vào một Database duy nhất. Đổi tên hoặc xóa cột ngay lập tức làm Pod v1 lỗi HTTP 500 và không thể Rollback. Cần tách thành 3 pha: Expand (thêm cột NULL & ghi kép) → Switch Read → Contract (xóa cột cũ) — tương tự việc xây cầu mới song song cầu cũ rồi mới tháo dỡ cầu cũ.',
                  'During RollingUpdates, old v1 and new v2 pods query ONE database simultaneously! Dropping/renaming a column mid-rollout crashes live v1 pods and breaks rollbacks — always split into Expand → Switch → Contract!'
                )
              : s === 2
                ? callout(
                    'technique',
                    'Lọc phụ thuộc bắc cầu trên Turborepo với fetch-depth: 0',
                    'Monorepo Transitive Dependents (...[origin/main]) Need fetch-depth: 0!',
                    'Khi sửa gói dùng chung packages/shared-dto, cờ --filter=...[origin/main] tự động tìm và chạy CI cho cả các ứng dụng phụ thuộc vào gói đó. Lưu ý bật fetch-depth: 0 trên checkout@v4 để Git có lịch sử nhánh origin/main.',
                    'Prefixing three dots in --filter=...[origin/main] tests both the changed package AND every upstream app importing it — just remember checkout fetch-depth: 0 so origin/main exists!'
                  )
                : callout(
                    'key-idea',
                    '4 chỉ số DORA: cân bằng giữa Tốc độ (Throughput) và Độ ổn định (Stability)',
                    'Architect Takeaway: DORA Balances Throughput & Stability',
                    'Nhóm chỉ số Tốc độ gồm Deployment Frequency & Lead Time (<1h); nhóm Độ ổn định gồm Change Failure Rate (0–5%) & MTTR (<1h). Theo dõi đồng thời cả hai nhóm giúp phát hành nhanh mà vẫn giữ hệ thống ổn định.',
                    'Throughput tracks Deployment Frequency & Lead Time (<1h); Stability tracks Change Failure Rate (0–5%) & MTTR (<1h). True Elite teams excel at both simultaneously!'
                  ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Tách thay đổi lược đồ SQL thành 3 đợt phát hành tương thích ngược hoàn toàn (Expand-and-Contract)',
                    'Split destructive SQL schema change into 3 backward-compatible Expand-and-Contract releases'
                  ),
                },
              ]
            : s === 2
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Kích hoạt checkout fetch-depth: 0 kết hợp đồ thị phụ thuộc Turborepo --filter=...[origin/main]',
                      'Enabled full Git history checkout + transitive dependency graph filtering for Monorepo CI'
                    ),
                  },
                ]
              : [
                  {
                    op: '+',
                    text: bi(
                      'Đo lường tự động bộ 4 chỉ số DORA ngay sau mỗi đợt triển khai Production thành công',
                      'Instrumented automated 4-key DORA telemetry collection on production deployments'
                    ),
                  },
                ],
        memoryScene: {
          kind: 'tape',
          title: bi(
            isLast
              ? 'Bộ 4 Chỉ Số DORA: Cân Bằng Tốc Độ & Độ Ổn Định Hệ Thống'
              : 'Mẫu 3 Pha Nâng Cấp CSDL Không Gián Đoạn: Expand-and-Contract',
            isLast ? 'The 4 DORA Engineering Metrics' : '3-Phase Zero-Downtime Schema Migration'
          ),
          subtitle: bi(
            isLast
              ? '2 chỉ số đo Tốc độ giao nhận (Throughput) song hành cùng 2 chỉ số đo Độ ổn định (Stability)'
              : 'Mỗi pha đều tương thích đồng thời với cả Pod phiên bản cũ (v1) lẫn mới (v2) đang chạy song song!',
            isLast
              ? '2 Throughput metrics paired with 2 Stability safeguards'
              : 'Every phase stays 100% compatible with both live v1 and v2 Pods!'
          ),
          cells: isLast
            ? ['1. Deploy Freq (On-demand)', '2. Lead Time (<1h)', '3. Change Fail (0-5%)', '4. MTTR (<1h)']
            : ['1. Expand (+cột NULL)', '2. Dual-Write & Backfill', '3. Switch Read (v2)', '4. Contract (DROP cũ)'],
          activeIndices: s === 0 ? [0, 1] : s === 1 ? [0, 1, 2, 3] : s === 2 ? [1, 2] : [0, 1, 2, 3],
          pointers: isLast
            ? [
                { index: 1, label: 'Tốc độ (Throughput)', tone: 'blue' },
                { index: 3, label: 'Ổn định (Stability)', tone: 'green' },
              ]
            : [
                { index: 0, label: 'v1 & v2 cùng sống ✔', tone: 'green' },
                { index: 3, label: 'Chỉ xóa ở đợt cuối!', tone: 'blue' },
              ],
          outputPill: {
            label: bi(isLast ? 'CHUẨN DORA ELITE' : 'AN TOÀN ROLLBACK', isLast ? 'DORA BENCHMARK' : 'ROLLBACK SAFETY'),
            value: bi(
              isLast ? 'Nhanh VÀ Bền vững cùng lúc' : '0 lỗi HTTP 500 lúc cuộn Pod!',
              isLast ? 'High Velocity + High Stability' : 'Zero 500s during RollingUpdate!'
            ),
            tone: 'green',
          },
        },
      };
    },
  },

  C17: {
    id: 'C17',
    titleEn: 'CI/CD Incident Triage: 4 Real-World Outage & Security Case Files',
    subtitleEn: 'Mitigate in <2 minutes (cut MTTR), fix 42m bottlenecks, stop prod deploy races, rotate leaked keys, and kill false-greens.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi(
        'Nguyên tắc xử lý sự cố Production: khôi phục dịch vụ trước (Rollback về SHA ổn định hoặc tắt Feature Flag để giảm MTTR), phân tích nguyên nhân gốc rễ sau',
        'Follow Golden Incident Triage: restore service FIRST (<2m Rollback / Feature Flag kill-switch), debug root cause SECOND'
      ),
      bi(
        'Xử lý 4 tình huống thực tế: tối ưu đường găng 42p → <5p (B1), xếp hàng deploy Production (B2), Revoke & Rotate ngay khi lộ Secret trên Git (B3), và loại bỏ lỗi False-Green (B6)',
        'Resolve all 4 war-room cases: 42m->5m sharding (B1), Prod concurrency queue (B2), immediate Secret Rotation + Gitleaks (B3), and False-Green elimination (B6)'
      ),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const secretCase = s === 3;

      return {
        telemetry: [
          {
            label: bi('ƯU TIÊN PHÚT ĐẦU', 'MINUTE-ZERO PRIORITY'),
            value: bi('Khôi phục dịch vụ (<2m MTTR)', 'Mitigate first (<2m MTTR)'),
            tone: 'ok',
          },
          {
            label: bi('KHI LỘ SECRET GIT', 'LEAKED GIT SECRET'),
            value: secretCase
              ? bi('Revoke & Rotate ngay lập tức', 'Revoke & Rotate immediately')
              : bi('Xoá commit không xoá được git log', 'New commit never un-leaks key'),
            tone: 'warn',
          },
          {
            label: bi('CHỐNG XANH GIẢ', 'HARD GATE INTEGRITY'),
            value: isLast
              ? bi('Cấm || true & continue-on-error', 'Ban || true & continue-on-error')
              : bi('concurrency Prod: false', 'Prod concurrency: false'),
            tone: 'ok',
          },
        ],
        callout:
          s === 0
            ? callout(
                'key-idea',
                'Nguyên tắc xử lý sự cố: Khôi phục dịch vụ trước, phân tích nguyên nhân sau',
                'Incident Rule: Restore Service First, Debug Second',
                'Khi Production gặp lỗi 500 sau một đợt phát hành, ưu tiên hàng đầu là giảm MTTR xuống dưới 2 phút bằng Rollback về thẻ SHA ổn định (hoặc tắt Feature Flag), sau đó mới họp Blameless Postmortem tìm nguyên nhân gốc rễ.',
                'When users hit HTTP 500s at 2 AM, never live-debug forward first! Cut MTTR under 2 minutes via immutable SHA Rollback or Feature Flag kill-switch, then run a blameless postmortem.'
              )
            : s === 1
              ? callout(
                  'technique',
                  'Tình huống B1: Tối ưu đường găng 42 phút và tránh mức timeout 360 phút',
                  'Case B1: Slashing 42m Queues & 360m Hung Runners',
                  'Chuyển npm install sang cache: "npm" + npm ci, chạy lint song song với 4 mảnh test (--shard=1/4..4/4), bỏ sleep 45 cố định và đặt timeout-minutes: 15.',
                  'Replace uncached npm install with cached npm ci, run lint parallel to 4 test shards, delete blind sleep 45, and enforce timeout-minutes: 15!'
                )
              : s === 2
                ? callout(
                    'watch-out',
                    'Tình huống B2: Lỗi dùng cancel-in-progress: true trên Production',
                    'Case B2: Never Copy PR cancel-in-progress: true onto Production!',
                    'Hai commit merge gần nhau mà bật cancel-in-progress: true trên Production sẽ hủy ngang đợt deploy đang chạy dở làm hỏng state lock. Phải đặt cancel-in-progress: false để xếp hàng Pending tuần tự.',
                    'Two merges 40s apart with cancel-in-progress: true kill an in-flight deploy mid-migration! Production concurrency groups MUST set cancel-in-progress: false.'
                  )
                : secretCase
                  ? callout(
                      'watch-out',
                      'Tình huống B3: Xoá API Key ở commit mới không xoá được khóa trong git log',
                      'Case B3: Removing a Secret in Commit #2 Leaves Commit #1 Wide Open!',
                      'Các công cụ quét tự động có thể thu thập khóa trong lịch sử git log rất nhanh. Quy trình xử lý bắt buộc: (1) Thu hồi & xoay vòng (Revoke & Rotate) khóa ngay trên hệ thống cung cấp, (2) Thêm Gitleaks với fetch-depth: 0.',
                      'Bots scrape git history within seconds! Always: (1) Revoke & Rotate the compromised credential immediately at the provider, and (2) add Gitleaks with fetch-depth: 0.'
                    )
                  : callout(
                      'key-idea',
                      'Tình huống B6: Bảo vệ tính trung thực của Exit Code trong Pipeline',
                      'Course Finale Takeaway (Case B6): Guard Exit Code Honesty!',
                      'Loại bỏ 3 nguyên nhân gây báo thành công giả (False-Green): continue-on-error: true trên cổng kiểm tra bắt buộc, toán tử || true, và lệnh curl thiếu cờ --fail.',
                      'Purge the 3 silent killers of pipeline trust: continue-on-error: true on hard gates, || true exit-swallowers, and curl without --fail. Congratulations on mastering CI/CD Architecture!'
                    ),
        whatChanged:
          s <= 1
            ? [
                {
                  op: '+',
                  text: bi(
                    'Nén pipeline 42 phút xuống dưới 5 phút nhờ DAG song song, 4 mảnh Sharding và khóa timeout-minutes: 15',
                    'Compressed 42m serial bottleneck under 5m via parallel DAG, 4-way sharding, and 15m timeouts'
                  ),
                },
              ]
            : s === 2
              ? [
                  {
                    op: '+',
                    text: bi(
                      'Khóa concurrency group cố định kèm cancel-in-progress: false chấm dứt xung đột đè deploy Production',
                      'Serialized production deployments safely with concurrency cancel-in-progress: false'
                    ),
                  },
                ]
              : secretCase
                ? [
                    {
                      op: '+',
                      text: bi(
                        'Thu hồi & xoay vòng khóa bị lộ ngay lập tức và chặn tái phạm bằng Gitleaks (fetch-depth: 0)',
                        'Revoked & rotated leaked API key immediately and added full-history Gitleaks gate'
                      ),
                    },
                  ]
                : [
                    {
                      op: '-',
                      text: bi(
                        'Loại bỏ triệt để continue-on-error: true, "|| true" và bổ sung cờ curl --fail khôi phục phanh CI trung thực',
                        'Removed continue-on-error: true and "|| true", restoring strict fail-fast exit code honesty'
                      ),
                    },
                  ],
        scene: {
          nodes: [
            {
              id: 'alr',
              shape: 'block',
              tone: 'rose',
              x: -235,
              y: 10,
              label: secretCase
                ? bi('Secret Leak (B3)!', 'Secret Leak (B3)!')
                : isLast
                  ? bi('False-Green (B6)!', 'False-Green (B6)!')
                  : bi('CI / Prod Incident', 'CI / Prod Incident'),
              icon: 'alert',
              highlighted: s === 0 || secretCase || isLast,
              badge: {
                text: secretCase
                  ? bi('Exposed in git log!', 'Exposed in git log!')
                  : isLast
                    ? bi('Swallowed Exit 1!', 'Swallowed Exit 1!')
                    : bi('5xx Spike / 42m Queue', '5xx Spike / 42m Queue'),
                tone: 'bad',
              },
            },
            {
              id: 'mit',
              shape: 'block',
              tone: 'green',
              x: 0,
              y: -28,
              label: bi('Fast Remediation', 'Fast Remediation'),
              icon: 'shield',
              highlighted: s >= 1,
              badge: {
                text: secretCase
                  ? bi('1. Revoke & Rotate!', '1. Revoke & Rotate!')
                  : isLast
                    ? bi('curl --fail · Honest 1', 'curl --fail · Honest 1')
                    : bi('Rollback + Queue Safe', 'Rollback + Queue Safe'),
                tone: 'ok',
              },
            },
            {
              id: 'pm',
              shape: 'db',
              tone: 'blue',
              x: 235,
              y: 15,
              label: bi('Preventive CI Gate', 'Preventive CI Gate'),
              sublabel: bi('Gitleaks · Shards · OIDC', 'Gitleaks · Shards · OIDC'),
              highlighted: isLast || secretCase,
            },
          ],
          links: [
            { id: 'l1', from: 'alr', to: 'mit', style: 'danger', label: bi('< 2 min MTTR', '< 2 min MTTR') },
            { id: 'l2', from: 'mit', to: 'pm', label: bi('hardened guardrail', 'hardened guardrail') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'error', speed: 0.48 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.48 },
          ],
        },
      };
    },
  },
};

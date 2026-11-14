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
      <rect x="724" y="10" width="142" height="22" rx="6" fill={p.tones.sky.bg} stroke={p.tones.sky.stroke} strokeWidth="1" />
      <text x="795" y="25" textAnchor="middle" fill={p.tones.sky.fg} fontFamily={MONO} fontSize="10.5" fontWeight="700">
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
      <text
        x="0"
        y="4.5"
        textAnchor="middle"
        fill={t.badgeFg}
        fontFamily={SANS}
        fontSize="13"
        fontWeight="800"
      >
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
            <text
              x={x + w / 2}
              y={y + h / 2 + 11}
              textAnchor="middle"
              fill={p.inkMuted}
              fontFamily={MONO}
              fontSize="9"
            >
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

// K00: VM Hypervisor + Guest OS Stack vs Container Shared Host Kernel + Read-Only Image Layers
const K00Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k00" isLight={isLight} className={className} title="VM Hypervisor Stack vs Shared-Kernel Containers & Image Layers" tag="kube:k00">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="56" w="272" h="304" tone="rose" p={p} title="VIRTUAL MACHINE STACK" badge="GBs / ~45s boot" />
        <CalloutBadge x={44} y={56} num={1} tone="rose" p={p} />
        <Pill x={40} y={96} w={114} h={42} label="App A + Bins" sub="Node 22" tone="violet" p={p} />
        <Pill x={166} y={96} w={114} h={42} label="App B + Bins" sub="Python 3.12" tone="violet" p={p} />
        <Pill x={40} y={146} w={114} h={46} label="Guest OS #1" sub="Full Ubuntu Kernel" tone="rose" p={p} />
        <Pill x={166} y={146} w={114} h={46} label="Guest OS #2" sub="Full Debian Kernel" tone="rose" p={p} />
        <Pill x={40} y={202} w={240} h={38} label="Hypervisor (KVM / VMware)" sub="Hardware Emulation Overhead" tone="amber" p={p} />
        <Pill x={40} y={248} w={240} h={36} label="Host OS Kernel" tone="slate" p={p} />
        <Pill x={40} y={292} w={240} h={34} label="Physical Server (CPU / RAM / NIC)" tone="slate" p={p} />
        <text x="160" y="347" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Duplicate Kernels = Heavy RAM Tax
        </text>

        <BoxCard x="316" y="56" w="284" h="304" tone="emerald" p={p} title="CONTAINER ENGINE STACK" badge="MBs / ~40ms boot" />
        <CalloutBadge x={336} y={56} num={2} tone="emerald" p={p} />
        <Pill x={332} y={96} w={120} h={52} label="Container #1" sub="shop-api (PID ns)" tone="sky" p={p} />
        <Pill x={464} y={96} w={120} h={52} label="Container #2" sub="redis-7 (PID ns)" tone="cyan" p={p} />
        <Pill x={332} y={158} w={252} h={40} label="containerd / Docker Engine" sub="Namespaces + cgroups v2 (No Guest OS)" tone="emerald" p={p} />
        <Pill x={332} y={208} w={252} h={54} label="Shared Host Linux Kernel" sub="Direct syscalls (read, epoll, socket)" tone="sky" p={p} />
        <Pill x={332} y={272} w={252} h={54} label="Physical Server / Cloud Node" sub="Zero hypervisor emulation penalty" tone="slate" p={p} />
        <text x="458" y="347" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          1 Shared Kernel = Near-Native Speed
        </text>

        <BoxCard x="620" y="56" w="236" h="304" tone="sky" p={p} title="OVERLAYFS LAYERS" badge="Copy-on-Write" />
        <CalloutBadge x={640} y={56} num={3} tone="sky" p={p} />
        <Pill x={636} y={96} w={204} h={44} label="R/W Container Layer" sub="Ephemeral upperdir (tmp)" tone="amber" p={p} />
        <line x1="636" y1="150" x2="840" y2="150" stroke={p.tones.sky.stroke} strokeDasharray="4 3" strokeWidth="1.2" />
        <text x="738" y="164" textAnchor="middle" fill={p.tones.sky.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          IMMUTABLE IMAGE (READ-ONLY)
        </text>
        <Pill x={636} y={172} w={204} h={36} label="Layer 3: COPY dist/ ./" align="left" sub="1.4 MB" tone="sky" p={p} />
        <Pill x={636} y={214} w={204} h={36} label="Layer 2: node_modules" align="left" sub="42 MB" tone="cyan" p={p} />
        <Pill x={636} y={256} w={204} h={36} label="Layer 1: alpine:3.20" align="left" sub="7.8 MB" tone="slate" p={p} />
        <text x="738" y="314" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9.5">
          10 containers share Layers 1..3
        </text>
        <text x="738" y="330" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          docker rm drops R/W layer only
        </text>

        <path d="M 584 122 L 630 118" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
      </>
    )}
  </SvgShell>
);

// K01: Host-to-Container Port Mapping (-p 8080:3000), ENV Injection & stdout/stderr Log Stream
const K01Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k01" isLight={isLight} className={className} title="Port NAT (-p 8080:3000), Runtime ENV Injection & Log Streams" tag="kube:k01">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="62" w="200" h="292" tone="sky" p={p} title="HOST MACHINE" badge="macOS / Linux" />
        <CalloutBadge x={44} y={62} num={1} tone="sky" p={p} />
        <Pill x={40} y={106} w={168} h={46} label="Browser / curl" sub="GET localhost:8080" tone="sky" p={p} />
        <Pill x={40} y={170} w={168} h={50} label="Host Socket :8080" sub="-p 8080:3000 (Left side)" tone="amber" p={p} />
        <Pill x={40} y={240} w={168} h={52} label="CLI Flags (-e)" sub="-e PORT=3000 -e LOG=info" tone="violet" p={p} />
        <text x="124" y="320" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9.5">
          1 Host Port = 1 Container
        </text>
        <text x="124" y="336" textAnchor="middle" fill={p.tones.sky.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Reads Left-to-Right
        </text>

        <BoxCard x="268" y="62" w="344" h="292" tone="emerald" p={p} title="CONTAINER NETNS (172.17.0.2)" badge="shop-api" />
        <CalloutBadge x={288} y={62} num={2} tone="violet" p={p} />
        <Pill x={288} y={106} w={144} h={50} label="veth / eth0" sub="DNAT -> :3000" tone="emerald" p={p} />
        <Pill x={450} y={106} w={144} h={50} label="127.0.0.1:3000" sub="TRAP: Refuses eth0!" tone="rose" p={p} />
        <Pill x={288} y={174} w={306} h={56} label="Node PID 1: app.listen(3000, '0.0.0.0')" sub="Binds ALL interfaces inside container namespace" tone="emerald" p={p} />
        <Pill x={288} y={244} w={306} h={52} label="process.env = { PORT: '3000', LOG: 'info' }" sub="12-Factor config injected at docker run" tone="violet" p={p} />
        <text x="440" y="324" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="10" fontWeight="700">
          docker exec -it shop-api sh (Inspect Live State)
        </text>

        <BoxCard x="652" y="62" w="204" h="292" tone="amber" p={p} title="LOG STREAM ENGINE" badge="json-file" />
        <CalloutBadge x={672} y={62} num={3} tone="amber" p={p} />
        <Pill x={668} y={108} w={172} h={44} label="fd/1 stdout" sub="console.log() stream" tone="cyan" p={p} />
        <Pill x={668} y={162} w={172} h={44} label="fd/2 stderr" sub="console.error() stream" tone="rose" p={p} />
        <Pill x={668} y={224} w={172} h={54} label="Docker Log Driver" sub="Captures ring-buffer JSON" tone="amber" p={p} />
        <Pill x={668} y={292} w={172} h={42} label="docker logs -f --tail 50" tone="slate" p={p} />

        <path d="M 124 152 L 124 168" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 208 195 L 262 195 L 262 131 L 284 131" fill="none" stroke={p.tones.amber.stroke} strokeWidth="2" markerEnd={marker('amber')} />
        <path d="M 360 156 L 360 171" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 208 266 L 284 266" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" strokeDasharray="4 3" markerEnd={marker('violet')} />
        <path d="M 594 195 L 632 195 L 632 130 L 664 130" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.8" markerEnd={marker('cyan')} />
        <path d="M 594 208 L 632 208 L 632 184 L 664 184" fill="none" stroke={p.tones.rose.stroke} strokeWidth="1.8" markerEnd={marker('rose')} />
        <path d="M 754 206 L 754 221" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.6" markerEnd={marker('amber')} />
        <path d="M 754 278 L 754 290" fill="none" stroke={p.tones.slate.stroke} strokeWidth="1.6" markerEnd={marker('slate')} />
      </>
    )}
  </SvgShell>
);

// K02: Linux Namespaces (View Isolation) + cgroups (CPU/RAM Ceiling) + Named Volume vs Bind Mount
const K02Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k02" isLight={isLight} className={className} title="Linux Namespaces, cgroups v2 OOM (137) & Persistent Volumes" tag="kube:k02">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="60" w="258" h="296" tone="sky" p={p} title="LINUX NAMESPACES" badge="What It Sees" />
        <CalloutBadge x={44} y={60} num={1} tone="sky" p={p} />
        <Pill x={40} y={102} w={226} h={42} label="PID Namespace" sub="Sees node as PID 1 only" align="left" tone="sky" p={p} />
        <Pill x={40} y={152} w={226} h={42} label="NET Namespace" sub="Private eth0 + routing table" align="left" tone="cyan" p={p} />
        <Pill x={40} y={202} w={226} h={42} label="MNT Namespace" sub="Isolated / rootfs mount tree" align="left" tone="emerald" p={p} />
        <Pill x={40} y={252} w={226} h={42} label="UTS & IPC Namespaces" sub="Own hostname + shared mem" align="left" tone="violet" p={p} />
        <text x="153" y="328" textAnchor="middle" fill={p.tones.sky.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Visibility Curtain Around Process
        </text>

        <BoxCard x="302" y="60" w="276" h="296" tone="amber" p={p} title="CGROUPS V2 METERING" badge="What It Uses" />
        <CalloutBadge x={322} y={60} num={2} tone="amber" p={p} />
        <Pill x={318} y={102} w={244} h={52} label="--cpus=0.50 (CFS Quota)" sub="Exceeding -> Throttled (Slower, Alive)" tone="amber" p={p} />
        <Pill x={318} y={166} w={244} h={56} label="--memory=256m (Hard Cap)" sub="Exceeding -> Kernel OOM Killer!" tone="rose" p={p} />
        <rect x="318" y="236" width="244" height="64" rx="8" fill={p.tones.rose.bg} stroke={p.tones.rose.stroke} strokeWidth="1.3" />
        <text x="440" y="258" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="11" fontWeight="700">
          SIGKILL (9) -&gt; Exit Code 137
        </text>
        <text x="440" y="276" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9.5">
          POSIX: 128 + Signal(9) = 137
        </text>
        <text x="440" y="291" textAnchor="middle" fill={p.inkSoft} fontFamily={MONO} fontSize="9">
          NODE_OPTIONS=--max-old-space-size=192
        </text>
        <text x="440" y="328" textAnchor="middle" fill={p.tones.amber.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Protects Host RAM &amp; Neighbor Apps
        </text>

        <BoxCard x="598" y="60" w="258" h="296" tone="emerald" p={p} title="PERSISTENT STORAGE" badge="Survives rm" />
        <CalloutBadge x={618} y={60} num={3} tone="emerald" p={p} />
        <Pill x={614} y={102} w={226} h={64} label="Named Volume (Prod DB)" sub="-v pgdata:/var/lib/postgresql/data" tone="emerald" p={p} />
        <text x="727" y="182" textAnchor="middle" fill={p.inkSoft} fontFamily={MONO} fontSize="9">
          Managed in /var/lib/docker/volumes
        </text>
        <Pill x={614} y={198} w={226} h={64} label="Bind Mount (Local Dev)" sub="-v ./src:/app/src (Live hot-reload)" tone="cyan" p={p} />
        <text x="727" y="278" textAnchor="middle" fill={p.inkSoft} fontFamily={MONO} fontSize="9">
          Maps exact Host folder into Container
        </text>
        <Pill x={614} y={294} w={226} h={44} label="Bypass Ephemeral R/W Layer" sub="Zero I/O copy-up penalty" tone="slate" p={p} />

        <path d="M 440 222 L 440 234" fill="none" stroke={p.tones.rose.stroke} strokeWidth="1.8" markerEnd={marker('rose')} />
      </>
    )}
  </SvgShell>
);

// K03: Dockerfile Instruction Pipeline (FROM -> WORKDIR -> COPY -> RUN -> CMD Exec vs Shell PID 1)
const K03Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k03" isLight={isLight} className={className} title="Dockerfile Build Pipeline & CMD Exec Form vs Shell Form (PID 1)" tag="kube:k03">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="456" h="300" tone="sky" p={p} title="DOCKERFILE LAYER PIPELINE" badge="Build-Time -> Run-Time" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />

        <Pill x={42} y={98} w={196} h={40} label="FROM node:22-alpine" sub="Pinned LTS base layer" tone="amber" p={p} />
        <Pill x={264} y={98} w={198} h={40} label="WORKDIR /app" sub="mkdir -p /app && cd /app" tone="sky" p={p} />
        <Pill x={42} y={154} w={196} h={44} label="COPY package*.json ./" sub="Deterministic manifest copy" tone="cyan" p={p} />
        <Pill x={264} y={154} w={198} h={44} label="RUN npm ci --omit=dev" sub="Immutable lockfile install" tone="violet" p={p} />
        <Pill x={42} y={214} w={196} h={44} label="ENV NODE_ENV=production" sub="Persists into container runtime" tone="emerald" p={p} />
        <Pill x={264} y={214} w={198} h={44} label="COPY src/ ./src/" sub="App source layer + EXPOSE 3000" tone="sky" p={p} />
        <Pill x={42} y={276} w={420} h={58} label='CMD ["node", "src/server.js"]  (Exec JSON Array)' sub="Runs ONLY when container starts (docker run) — NOT during build" tone="emerald" p={p} />

        <path d="M 238 118 L 260 118" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 363 138 L 363 146 L 140 146 L 140 152" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.6" markerEnd={marker('cyan')} />
        <path d="M 238 176 L 260 176" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" markerEnd={marker('violet')} />
        <path d="M 363 198 L 363 206 L 140 206 L 140 212" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.6" markerEnd={marker('emerald')} />
        <path d="M 238 236 L 260 236" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 363 258 L 363 273" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />

        <BoxCard x="502" y="58" w="354" h="142" tone="rose" p={p} title="SHELL FORM TRAP: CMD npm start" badge="Broken Signals" />
        <CalloutBadge x={522} y={58} num={2} tone="rose" p={p} />
        <Pill x={518} y={98} w={152} h={44} label="PID 1: /bin/sh -c" sub="Swallows SIGTERM!" tone="rose" p={p} />
        <Pill x={690} y={98} w={150} h={44} label="PID 17: node" sub="Never hears stop" tone="amber" p={p} />
        <path d="M 670 120 L 686 120" fill="none" stroke={p.tones.rose.stroke} strokeWidth="1.6" markerEnd={marker('rose')} />
        <text x="679" y="164" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          docker stop waits 10s -&gt; Forced SIGKILL!
        </text>
        <text x="679" y="182" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Active HTTP requests &amp; DB pools dropped
        </text>

        <BoxCard x="502" y="216" w="354" h="142" tone="emerald" p={p} title='EXEC FORM: CMD ["node", "server.js"]' badge="Graceful Drain" />
        <CalloutBadge x={522} y={216} num={3} tone="emerald" p={p} />
        <Pill x={518} y={256} w={152} h={46} label="docker stop / K8s" sub="Sends SIGTERM" tone="sky" p={p} />
        <Pill x={690} y={256} w={150} h={46} label="PID 1: node" sub="process.on('SIGTERM')" tone="emerald" p={p} />
        <path d="M 670 279 L 686 279" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <text x="679" y="324" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Closes HTTP server &amp; DB cleanly in &lt;200ms
        </text>
        <text x="679" y="342" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Clean Exit Code 0 — Zero dropped traffic
        </text>
      </>
    )}
  </SvgShell>
);

// K04: BuildKit Layer Cache Hit/Invalidation Pyramid (package*.json before COPY . .) & .dockerignore Shield
const K04Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k04" isLight={isLight} className={className} title="BuildKit Layer Cache Domino Rule & .dockerignore Context Shield" tag="kube:k04">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="236" h="300" tone="amber" p={p} title=".DOCKERIGNORE SHIELD" badge="Build Context" />
        <CalloutBadge x={44} y={58} num={1} tone="amber" p={p} />
        <Pill x={40} y={98} w={204} h={34} label="BLOCKED: node_modules/" sub="650 MB" align="left" tone="rose" p={p} />
        <Pill x={40} y={138} w={204} h={34} label="BLOCKED: .env / *.pem" sub="Secrets" align="left" tone="rose" p={p} />
        <Pill x={40} y={178} w={204} h={34} label="BLOCKED: .git/ & dist/" sub="History" align="left" tone="rose" p={p} />
        <line x1="40" y1="224" x2="244" y2="224" stroke={p.tones.amber.stroke} strokeDasharray="4 3" strokeWidth="1.2" />
        <Pill x={40} y={238} w={204} h={52} label="Clean Context Sent" sub="package*.json + src/ (~180 KB)" tone="emerald" p={p} />
        <text x="142" y="316" textAnchor="middle" fill={p.tones.amber.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Prevents Secret Leak &amp; Mac/Linux
        </text>
        <text x="142" y="332" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          native binary (.node) collisions
        </text>

        <BoxCard x="282" y="58" w="276" h="300" tone="rose" p={p} title="ANTI-PATTERN ORDER" badge="~120s Rebuild" />
        <CalloutBadge x={302} y={58} num={2} tone="rose" p={p} />
        <Pill x={298} y={100} w={244} h={38} label="1. FROM node:22-alpine" sub="CACHED" align="left" tone="emerald" p={p} />
        <Pill x={298} y={148} w={244} h={46} label="2. COPY . .  (src edited!)" sub="MISS" align="left" tone="rose" p={p} />
        <Pill x={298} y={204} w={244} h={46} label="3. RUN npm ci (Domino Hit!)" sub="118s" align="left" tone="rose" p={p} />
        <Pill x={298} y={260} w={244} h={38} label='4. CMD ["node", "index.js"]' sub="RE-RUN" align="left" tone="amber" p={p} />
        <text x="420" y="324" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          1-char edit invalidates npm ci!
        </text>
        <text x="420" y="340" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Domino cascades to all lower layers
        </text>

        <BoxCard x="580" y="58" w="276" h="300" tone="emerald" p={p} title="OPTIMAL CACHE PYRAMID" badge="~0.8s Rebuild" />
        <CalloutBadge x={600} y={58} num={3} tone="emerald" p={p} />
        <Pill x={596} y={100} w={244} h={38} label="1. FROM node:22-alpine" sub="CACHED" align="left" tone="emerald" p={p} />
        <Pill x={596} y={148} w={244} h={42} label="2. COPY package*.json ./" sub="CACHED" align="left" tone="emerald" p={p} />
        <Pill x={596} y={200} w={244} h={46} label="3. RUN npm ci --omit=dev" sub="0.0s HIT!" align="left" tone="cyan" p={p} />
        <Pill x={596} y={256} w={244} h={42} label="4. COPY src/ ./src/" sub="0.8s" align="left" tone="sky" p={p} />
        <text x="718" y="324" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Least-changing top, Fast-changing last
        </text>
        <text x="718" y="340" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          25x faster local &amp; CI BuildKit builds
        </text>

        <path d="M 260 264 L 280 264" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// K05: Multi-Stage Distillery (builder 1.1GB SDK -> COPY --from=builder -> runner 140MB Alpine + USER node UID 1000)
const K05Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k05" isLight={isLight} className={className} title="Multi-Stage Distillery: Builder SDK (1.1 GB) -> Hardened Runner (140 MB)" tag="kube:k05">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="330" h="300" tone="amber" p={p} title="STAGE 1: AS builder" badge="~1.1 GB (Discarded)" dashed />
        <CalloutBadge x={44} y={58} num={1} tone="amber" p={p} />
        <Pill x={42} y={98} w={294} h={40} label="FROM node:22-alpine AS builder" sub="Full build toolchain workspace" tone="amber" p={p} />
        <Pill x={42} y={146} w={294} h={44} label="RUN npm ci (Full Deps + DevDeps)" sub="typescript, eslint, @types/*, esbuild" tone="violet" p={p} />
        <Pill x={42} y={198} w={294} h={44} label="COPY tsconfig.json src/ -> npm run build" sub="Emits compiled JS into /app/dist" tone="sky" p={p} />
        <Pill x={42} y={250} w={294} h={44} label="RUN npm prune --omit=dev" sub="Strips devDependencies in-place" tone="cyan" p={p} />
        <text x="189" y="320" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Discarded after build: .ts, tsc, caches
        </text>
        <text x="189" y="337" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Zero build compilers shipped to Prod
        </text>

        <rect x="372" y="152" width="136" height="92" rx="10" fill={p.panelAlt} stroke={p.tones.sky.stroke} strokeWidth="1.5" />
        <CalloutBadge x={440} y={148} num={2} tone="sky" p={p} />
        <text x="440" y="182" textAnchor="middle" fill={p.tones.sky.fg} fontFamily={MONO} fontSize="10" fontWeight="700">
          COPY --from=builder
        </text>
        <text x="440" y="199" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          --chown=node:node
        </text>
        <text x="440" y="218" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          dist/ + prod deps
        </text>
        <text x="440" y="233" textAnchor="middle" fill={p.inkSoft} fontFamily={MONO} fontSize="8.5">
          87% Size Reduction
        </text>

        <BoxCard x="526" y="58" w="330" h="300" tone="emerald" p={p} title="STAGE 2: AS runner (Prod)" badge="~140 MB Shipped" />
        <CalloutBadge x={546} y={58} num={3} tone="emerald" p={p} />
        <Pill x={544} y={98} w={294} h={40} label="FROM node:22-alpine AS runner" sub="Clean minimal runtime + ENV production" tone="emerald" p={p} />
        <Pill x={544} y={146} w={294} h={46} label="/app/dist + pruned node_modules" sub="Only runtime artifacts copied across" tone="sky" p={p} />
        <Pill x={544} y={200} w={294} h={46} label="USER node  (UID 1000 Non-Root)" sub="Drops root UID 0 privilege escalation" tone="emerald" p={p} />
        <Pill x={544} y={254} w={294} h={46} label="HEALTHCHECK + CMD [node, dist/main.js]" sub="Self-probing HTTP /healthz + PID 1" tone="cyan" p={p} />
        <text x="691" y="324" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Fast K8s Image Pull + Minimal CVE Surface
        </text>
        <text x="691" y="340" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Immutable Production Container Image
        </text>

        <path d="M 354 200 L 370 200" fill="none" stroke={p.tones.sky.stroke} strokeWidth="2" markerEnd={marker('sky')} />
        <path d="M 508 200 L 524 172" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// K06: Docker Compose v2 Internal Bridge DNS (api -> postgres:5432), depends_on: service_healthy & Named Volumes
const K06Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k06" isLight={isLight} className={className} title="Docker Compose v2: Bridge DNS, service_healthy & Named Volumes" tag="kube:k06">
    {(p, marker) => (
      <>
        <Pill x={24} y={64} w={132} h={56} label="Host :3000" sub="ports: 3000:3000" tone="sky" p={p} />
        <Pill x={24} y={146} w={132} h={64} label="compose.yaml" sub="No version: key!" tone="violet" p={p} />
        <Pill x={24} y={234} w={132} h={60} label="docker compose" sub="up -d --build" tone="emerald" p={p} />

        <BoxCard x="180" y="56" w="676" h="302" tone="cyan" p={p} title="BRIDGE NETWORK: shop_default (Embedded DNS 127.0.0.11)" badge="Compose v2" dashed />
        <CalloutBadge x={200} y={56} num={1} tone="cyan" p={p} />

        <BoxCard x="200" y="98" w="214" h="176" tone="sky" p={p} title="service: api" badge="Node 22" />
        <Pill x={214} y={136} w={186} h={40} label="DB_HOST=postgres" sub="Service name = DNS!" tone="sky" p={p} />
        <Pill x={214} y={184} w={186} h={40} label="REDIS_HOST=redis" sub="NOT localhost!" tone="cyan" p={p} />
        <text x="307" y="248" textAnchor="middle" fill={p.tones.amber.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          depends_on: service_healthy
        </text>
        <CalloutBadge x={414} y={244} num={2} tone="amber" p={p} />

        <BoxCard x="456" y="98" w="186" h="176" tone="emerald" p={p} title="service: postgres" badge=":5432" />
        <Pill x={470} y={136} w={158} h={44} label="postgres:16-alpine" sub="Internal port 5432" tone="emerald" p={p} />
        <Pill x={470} y={190} w={158} h={50} label="healthcheck:" sub="pg_isready -U shop" tone="amber" p={p} />

        <BoxCard x="658" y="98" w="180" h="112" tone="violet" p={p} title="service: redis" badge=":6379" />
        <Pill x={672} y={136} w={152} h={52} label="redis:7-alpine" sub="redis-cli ping -> PONG" tone="violet" p={p} />

        <BoxCard x="456" y="288" w="382" h="56" tone="amber" p={p} />
        <CalloutBadge x={474} y={288} num={3} tone="emerald" p={p} />
        <text x="652" y="312" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="10.5" fontWeight="700">
          Named Volume: pgdata:/var/lib/postgresql/data
        </text>
        <text x="652" y="330" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Survives docker compose down (Only wiped by down -v)
        </text>

        <text x="307" y="318" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9.5">
          Internal East-West traffic needs
        </text>
        <text x="307" y="334" textAnchor="middle" fill={p.tones.cyan.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          NO host ports: exposure!
        </text>

        <path d="M 156 92 L 198 148" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 414 156 L 452 156" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 414 204 L 436 204 L 436 88 L 748 88 L 748 96" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.6" markerEnd={marker('violet')} />
        <path d="M 549 274 L 549 286" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.8" markerEnd={marker('amber')} />
      </>
    )}
  </SvgShell>
);

// K07: Kubernetes Control Plane vs Worker Node & Reconciliation Loop
const K07Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k07" isLight={isLight} className={className} title="Kubernetes Architecture: Control Plane, Worker Nodes & Reconcile Loop" tag="kube:k07">
    {(p, marker) => (
      <>
        <Pill x={20} y={154} w={116} h={64} label="kubectl apply" sub="Desired YAML" tone="sky" p={p} />

        <BoxCard x="158" y="56" w="344" h="302" tone="violet" p={p} title="CONTROL PLANE (BRAIN)" badge="Multi-AZ HA" />
        <CalloutBadge x={178} y={56} num={1} tone="violet" p={p} />
        <Pill x={178} y={102} w={304} h={52} label="kube-apiserver (HTTPS REST)" sub="Sole gateway: AuthN -> AuthZ -> Admission" tone="sky" p={p} />
        <Pill x={178} y={176} w={144} h={58} label="etcd (Raft KV)" sub="Single Source of Truth" tone="amber" p={p} />
        <Pill x={338} y={176} w={144} h={58} label="kube-scheduler" sub="Assigns Pending Pods" tone="violet" p={p} />
        <Pill x={178} y={254} w={304} h={54} label="kube-controller-manager" sub="24/7 Control Loop: Actual != Desired -> Fix!" tone="cyan" p={p} />
        <CalloutBadge x={482} y={281} num={3} tone="cyan" p={p} />
        <text x="330" y="338" textAnchor="middle" fill={p.tones.amber.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          ONLY apiserver reads/writes etcd directly!
        </text>

        <BoxCard x="536" y="56" w="320" h="302" tone="emerald" p={p} title="WORKER NODE (DATA PLANE)" badge="Runs Pods" />
        <CalloutBadge x={556} y={56} num={2} tone="emerald" p={p} />
        <Pill x={556} y={102} w={140} h={54} label="kubelet" sub="Node Agent (CRI)" tone="emerald" p={p} />
        <Pill x={712} y={102} w={124} h={54} label="kube-proxy" sub="IPVS / eBPF VIP" tone="cyan" p={p} />
        <Pill x={556} y={176} w={280} h={48} label="containerd Runtime (CRI)" sub="Pulls OCI images & spawns namespaces" tone="sky" p={p} />
        <BoxCard x="556" y="238" w="280" h="98" tone="emerald" p={p} title="Scheduled Pods" badge="10.244.x.x" dashed />
        <Pill x={570} y={276} w={120} h={44} label="Pod: shop-api" sub=":3000 Ready" tone="emerald" p={p} />
        <Pill x={702} y={276} w={120} h={44} label="Pod: worker" sub="Node 22" tone="violet" p={p} />

        <path d="M 136 186 L 175 128" fill="none" stroke={p.tones.sky.stroke} strokeWidth="2" markerEnd={marker('sky')} />
        <path d="M 250 154 L 250 174" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.8" markerEnd={marker('amber')} />
        <path d="M 410 154 L 410 174" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" markerEnd={marker('violet')} />
        <path d="M 330 254 L 330 156" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.6" strokeDasharray="4 3" markerEnd={marker('cyan')} />
        <path d="M 482 128 L 552 128" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 626 156 L 626 174" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 696 224 L 696 236" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
      </>
    )}
  </SvgShell>
);

// K08: Pod Shared Network/IPC Sandbox (Main + Sidecar localhost), Labels/Selectors Matrix & Namespace Boundaries
const K08Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k08" isLight={isLight} className={className} title="Pod Shared Sandbox (localhost), Label Selectors & Namespaces" tag="kube:k08">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="56" w="536" h="302" tone="violet" p={p} title="NAMESPACE: production (Logical Isolation Boundary)" badge="ns/production" dashed />
        <CalloutBadge x={540} y={56} num={3} tone="violet" p={p} />

        <BoxCard x="42" y="96" w="306" h="244" tone="emerald" p={p} title="POD SANDBOX (10.244.1.18)" badge="Shared NetNS" />
        <CalloutBadge x={62} y={96} num={1} tone="emerald" p={p} />
        <Pill x={58} y={136} w={132} h={58} label="Main: shop-api" sub="Listens :3000" tone="emerald" p={p} />
        <Pill x={202} y={136} w={130} h={58} label="Sidecar: fluent" sub="Scrapes localhost" tone="cyan" p={p} />
        <Pill x={58} y={208} w={274} h={42} label="Shared Loopback 127.0.0.1 + IPC" sub="No duplicate port binding allowed inside Pod!" tone="sky" p={p} />
        <Pill x={58} y={260} w={274} h={42} label="Shared emptyDir Volume (/var/log)" sub="Fast local disk log exchange" tone="amber" p={p} />
        <text x="195" y="324" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          labels: app=shop-api, tier=backend
        </text>

        <BoxCard x="366" y="96" w="176" h="244" tone="sky" p={p} title="SELECTOR MATCH" badge="Loose Coupling" />
        <CalloutBadge x={386} y={96} num={2} tone="sky" p={p} />
        <Pill x={380} y={138} w={148} h={52} label="Service Selector" sub="app: shop-api" tone="sky" p={p} />
        <Pill x={380} y={204} w={148} h={52} label="Pod B: shop-web" sub="app: shop-web (Skip)" tone="slate" p={p} />
        <Pill x={380} y={270} w={148} h={52} label="imagePullSecrets" sub="ghcr-cred (Docker JSON)" tone="amber" p={p} />

        <BoxCard x="582" y="56" w="274" h="302" tone="slate" p={p} title="NAMESPACE: staging" badge="ns/staging" dashed />
        <Pill x={600} y={102} w={238} h={58} label="Pod: shop-api (Staging)" sub="Same name allowed across NS!" tone="violet" p={p} />
        <Pill x={600} y={176} w={238} h={58} label="ResourceQuota & RBAC" sub="Scoped per Namespace" tone="amber" p={p} />
        <Pill x={600} y={250} w={238} h={64} label="Cross-NS DNS Required:" sub="shop-api.production.svc..." tone="cyan" p={p} />
        <text x="719" y="338" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          ConfigMaps &amp; Secrets do NOT cross NS
        </text>

        <path d="M 380 164 L 350 164" fill="none" stroke={p.tones.sky.stroke} strokeWidth="2" markerEnd={marker('sky')} />
        <path d="M 202 165 L 192 165" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.6" markerEnd={marker('cyan')} />
      </>
    )}
  </SvgShell>
);

// K09: Deployment -> ReplicaSet v1 scaling down & ReplicaSet v2 scaling up (maxSurge / maxUnavailable) + rollout undo
const K09Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k09" isLight={isLight} className={className} title="Deployment RollingUpdate (maxSurge / maxUnavailable) & Rollout Undo" tag="kube:k09">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="60" w="236" h="296" tone="violet" p={p} title="DEPLOYMENT CONTROLLER" badge="apps/v1" />
        <CalloutBadge x={44} y={60} num={1} tone="violet" p={p} />
        <Pill x={40} y={102} w={204} h={46} label="Deployment: shop-api" sub="replicas: 3 | RollingUpdate" tone="violet" p={p} />
        <Pill x={40} y={160} w={204} h={46} label="maxSurge: 1" sub="Up to 4 Pods during rollout" tone="sky" p={p} />
        <Pill x={40} y={218} w={204} h={46} label="maxUnavailable: 0" sub="Never drop below 3 Ready!" tone="emerald" p={p} />
        <Pill x={40} y={280} w={204} h={54} label="Revision History Kept" sub="kubectl rollout undo -> 2s!" tone="amber" p={p} />
        <CalloutBadge x={244} y={307} num={3} tone="amber" p={p} />

        <BoxCard x="292" y="60" w="268" h="296" tone="amber" p={p} title="REPLICASET v1 (DRAINING)" badge="Rev #1 (1.4.1)" dashed />
        <Pill x={310} y={104} w={232} h={48} label="Pod v1-a: Running" sub="Serving active traffic" tone="emerald" p={p} />
        <Pill x={310} y={164} w={232} h={48} label="Pod v1-b: Terminating" sub="SIGTERM graceful drain" tone="amber" p={p} />
        <Pill x={310} y={224} w={232} h={48} label="Pod v1-c: Scaled Down" sub="Replaced after v2 Ready" tone="slate" p={p} />
        <text x="426" y="302" textAnchor="middle" fill={p.tones.amber.fg} fontFamily={MONO} fontSize="10" fontWeight="700">
          Scales 3 -&gt; 2 -&gt; 1 -&gt; 0
        </text>
        <text x="426" y="322" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Retained at replicas:0 for instant undo
        </text>

        <BoxCard x="588" y="60" w="268" h="296" tone="emerald" p={p} title="REPLICASET v2 (SURGING)" badge="Rev #2 (1.4.2)" />
        <CalloutBadge x={608} y={60} num={2} tone="emerald" p={p} />
        <Pill x={606} y={104} w={232} h={48} label="Pod v2-x: 1/1 Ready" sub="Receiving live traffic" tone="emerald" p={p} />
        <Pill x={606} y={164} w={232} h={48} label="Pod v2-y: 1/1 Ready" sub="Passed readinessProbe" tone="emerald" p={p} />
        <Pill x={606} y={224} w={232} h={48} label="Pod v2-z: Starting..." sub="Awaiting readiness gate" tone="sky" p={p} />
        <text x="722" y="302" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="10" fontWeight="700">
          Scales 0 -&gt; 1 -&gt; 2 -&gt; 3
        </text>
        <text x="722" y="322" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Zero-Downtime Rolling Handoff
        </text>

        <path d="M 260 125 L 290 125" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.8" markerEnd={marker('amber')} />
        <path d="M 260 112 L 276 112 L 276 48 L 722 48 L 722 58" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 560 307 L 264 307" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.6" strokeDasharray="4 3" markerEnd={marker('amber')} />
      </>
    )}
  </SvgShell>
);

// K10: ClusterIP / NodePort / LoadBalancer + CoreDNS svc.cluster.local + EndpointSlice Pod IP Routing
const K10Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k10" isLight={isLight} className={className} title="Service Types, CoreDNS Resolution & EndpointSlice Pod Routing" tag="kube:k10">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="238" h="300" tone="sky" p={p} title="3 SERVICE TYPES" badge="Nested Layers" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />
        <Pill x={40} y={98} w={206} h={52} label="LoadBalancer (Cloud VIP)" sub="Public IP -> NodePort -> ClusterIP" tone="sky" p={p} />
        <Pill x={40} y={162} w={206} h={52} label="NodePort (30000-32767)" sub="<NodeIP>:30080 on all Nodes" tone="amber" p={p} />
        <Pill x={40} y={226} w={206} h={56} label="ClusterIP (Default)" sub="Stable internal VIP 10.96.14.20" tone="emerald" p={p} />
        <text x="143" y="312" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          90% East-West traffic = ClusterIP
        </text>
        <text x="143" y="330" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          port: 80 -&gt; targetPort: 3000
        </text>

        <BoxCard x="288" y="58" w="268" h="300" tone="violet" p={p} title="COREDNS + VIRTUAL IP" badge="DNS Discovery" />
        <CalloutBadge x={308} y={58} num={2} tone="violet" p={p} />
        <Pill x={306} y={98} w={232} h={54} label="CoreDNS Resolver" sub="shop-api.prod.svc.cluster.local" tone="violet" p={p} />
        <Pill x={306} y={170} w={232} h={54} label="Service: shop-api-svc" sub="VIP 10.96.14.20:80 (port)" tone="sky" p={p} />
        <Pill x={306} y={242} w={232} h={64} label="EndpointSlice Watch" sub="Auto-tracks Ready=true Pod IPs" tone="cyan" p={p} />
        <text x="422" y="330" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Same NS shortname: http://shop-api-svc
        </text>

        <BoxCard x="582" y="58" w="274" h="300" tone="emerald" p={p} title="EPHEMERAL POD BACKENDS" badge="targetPort: 3000" />
        <CalloutBadge x={602} y={58} num={3} tone="emerald" p={p} />
        <Pill x={600} y={100} w={238} h={52} label="Pod #1: 10.244.1.15:3000" sub="app=shop-api | Ready=true" tone="emerald" p={p} />
        <Pill x={600} y={166} w={238} h={52} label="Pod #2: 10.244.2.48:3000" sub="app=shop-api | Ready=true" tone="emerald" p={p} />
        <Pill x={600} y={232} w={238} h={52} label="Pod #3: 10.244.3.91:3000" sub="Ready=false -> Dropped from VIP!" tone="rose" p={p} />
        <text x="719" y="316" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          kube-proxy load-balances healthy IPs
        </text>
        <text x="719" y="332" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Zero broken IPs during Pod restarts
        </text>

        <path d="M 246 254 L 304 197" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 422 152 L 422 168" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" markerEnd={marker('violet')} />
        <path d="M 422 224 L 422 240" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.8" markerEnd={marker('cyan')} />
        <path d="M 538 268 L 570 268 L 570 126 L 598 126" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 538 278 L 576 278 L 576 192 L 598 192" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// K11: L7 Ingress / Gateway API TLS Termination + Host & Path Routing Fan-out to Internal Services
const K11Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k11" isLight={isLight} className={className} title="L7 Ingress & Gateway API: Single Public LB, TLS Termination & Fan-Out" tag="kube:k11">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="64" w="188" h="288" tone="sky" p={p} title="INTERNET EDGE" badge="HTTPS :443" />
        <CalloutBadge x={44} y={64} num={1} tone="sky" p={p} />
        <Pill x={38} y={108} w={160} h={52} label="Clients / Mobile" sub="shop.example.com" tone="sky" p={p} />
        <Pill x={38} y={182} w={160} h={62} label="1 Cloud LoadBalancer" sub="Saves $100s vs 20 LBs!" tone="emerald" p={p} />
        <text x="118" y="280" textAnchor="middle" fill={p.tones.sky.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Single Public Static IP
        </text>
        <text x="118" y="298" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          DNS A/AAAA -&gt; Cloud LB
        </text>

        <BoxCard x="244" y="64" w="314" h="288" tone="violet" p={p} title="L7 CONTROLLER (NGINX / ENVOY)" badge="Gateway / Ingress" />
        <CalloutBadge x={264} y={64} num={2} tone="violet" p={p} />
        <Pill x={262} y={106} w={278} h={52} label="TLS Termination (HTTPS -> HTTP)" sub="Reads Secret: shop-tls-cert (tls.crt/key)" tone="amber" p={p} />
        <Pill x={262} y={172} w={278} h={48} label="Host: shop.example.com | Path: /api/*" sub="Routes to backend api-svc:80" tone="violet" p={p} />
        <Pill x={262} y={230} w={278} h={48} label="Host: shop.example.com | Path: /*" sub="Routes to frontend web-svc:80" tone="cyan" p={p} />
        <Pill x={262} y={288} w={278} h={46} label="Gateway API (HTTPRoute 2026)" sub="Header match + Canary weight 90/10" tone="emerald" p={p} />

        <BoxCard x="592" y="64" w="264" h="288" tone="emerald" p={p} title="INTERNAL SERVICES" badge="ClusterIP Only" />
        <CalloutBadge x={612} y={64} num={3} tone="emerald" p={p} />
        <Pill x={610} y={110} w={228} h={60} label="ClusterIP: api-svc" sub="Node.js Pods (:3000)" tone="violet" p={p} />
        <Pill x={610} y={188} w={228} h={60} label="ClusterIP: web-svc" sub="React/Nginx Pods (:80)" tone="cyan" p={p} />
        <Pill x={610} y={266} w={228} h={60} label="ClusterIP: api-v2-canary" sub="10% Weighted HTTPRoute" tone="emerald" p={p} />

        <path d="M 118 160 L 118 180" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 198 213 L 242 132" fill="none" stroke={p.tones.amber.stroke} strokeWidth="2" markerEnd={marker('amber')} />
        <path d="M 540 196 L 608 140" fill="none" stroke={p.tones.violet.stroke} strokeWidth="2" markerEnd={marker('violet')} />
        <path d="M 540 254 L 608 218" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="2" markerEnd={marker('cyan')} />
        <path d="M 540 311 L 608 296" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" strokeDasharray="4 3" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// K12: Decoupled Config Injection: ConfigMap & Secret mounted as envFrom vs Read-Only Tmpfs Volume Files
const K12Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k12" isLight={isLight} className={className} title="12-Factor ConfigMap & Secret Injection: envFrom vs Tmpfs Volume Mounts" tag="kube:k12">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="60" w="244" h="296" tone="sky" p={p} title="DECOUPLED SOURCES" badge="etcd / KMS" />
        <CalloutBadge x={44} y={60} num={1} tone="sky" p={p} />
        <Pill x={40} y={104} w={212} h={78} label="ConfigMap: api-config" sub="Plaintext: LOG_LEVEL, nginx.conf" tone="sky" p={p} />
        <text x="146" y="200" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Safe to version-control in Git
        </text>
        <Pill x={40} y={216} w={212} h={82} label="Secret: api-secrets" sub="Opaque / KMS Encrypted at rest" tone="amber" p={p} />
        <text x="146" y="318" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Base64 != Encryption! Use ESO/Sealed
        </text>

        <BoxCard x="304" y="60" w="264" h="296" tone="violet" p={p} title="MODE A: env / envFrom" badge="Static Snapshot" />
        <CalloutBadge x={324} y={60} num={2} tone="violet" p={p} />
        <Pill x={320} y={106} w={232} h={56} label="envFrom: configMapRef" sub="process.env.LOG_LEVEL = 'info'" tone="sky" p={p} />
        <Pill x={320} y={176} w={232} h={56} label="secretKeyRef -> env" sub="process.env.DB_PASS = '***'" tone="amber" p={p} />
        <rect x="320" y="248" width="232" height="82" rx="8" fill={p.tones.rose.bg} stroke={p.tones.rose.stroke} strokeWidth="1.2" />
        <text x="436" y="272" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="10" fontWeight="700">
          NO Hot-Reload on Edit!
        </text>
        <text x="436" y="292" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Frozen at container boot. Needs
        </text>
        <text x="436" y="308" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          kubectl rollout restart deploy
        </text>

        <BoxCard x="596" y="60" w="260" h="296" tone="emerald" p={p} title="MODE B: VOLUME MOUNT" badge="Tmpfs Auto-Sync" />
        <CalloutBadge x={616} y={60} num={3} tone="emerald" p={p} />
        <Pill x={612} y={106} w={228} h={56} label="/etc/config/flags.json" sub="Read-Only symlink mount" tone="emerald" p={p} />
        <Pill x={612} y={176} w={228} h={56} label="/var/run/secrets/tls.key" sub="RAM-backed tmpfs (Never hits disk)" tone="cyan" p={p} />
        <rect x="612" y="248" width="228" height="82" rx="8" fill={p.tones.emerald.bg} stroke={p.tones.emerald.stroke} strokeWidth="1.2" />
        <text x="726" y="272" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="10" fontWeight="700">
          Auto-Syncs (~60s Kubelet)!
        </text>
        <text x="726" y="292" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Atomic symlink swap (Note: subPath
        </text>
        <text x="726" y="308" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          disables live auto-updates)
        </text>

        <path d="M 252 134 L 318 134" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 252 248 L 282 248 L 282 204 L 318 204" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.8" markerEnd={marker('amber')} />
        <path d="M 252 120 L 286 120 L 286 48 L 726 48 L 726 58" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// K13: Dynamic Storage Provisioning (StorageClass -> PV <-> PVC) & StatefulSet Sticky Identity (db-0, db-1)
const K13Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k13" isLight={isLight} className={className} title="Dynamic CSI Provisioning (StorageClass/PVC/PV) & StatefulSet Identity" tag="kube:k13">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="384" h="300" tone="sky" p={p} title="DYNAMIC STORAGE PROVISIONING" badge="CSI Driver" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />
        <Pill x={42} y={100} w={348} h={48} label="StorageClass: gp3-ssd" sub="provisioner: ebs.csi.aws.com | reclaimPolicy: Retain" tone="sky" p={p} />
        <Pill x={42} y={168} w={164} h={64} label="PVC (Claim Ticket)" sub="10Gi | ReadWriteOnce" tone="amber" p={p} />
        <Pill x={226} y={168} w={164} h={64} label="PV (Cloud Disk)" sub="AWS EBS vol-09fa2b" tone="emerald" p={p} />
        <CalloutBadge x={216} y={168} num={2} tone="emerald" p={p} />
        <Pill x={42} y={254} w={348} h={52} label="Bound 1:1 -> Follows Pod Across Nodes!" sub="RWO = 1 Node R/W | RWX = Multi-Node NFS/EFS" tone="cyan" p={p} />
        <text x="216" y="332" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9.5">
          CSI detaches &amp; re-attaches disk on Node reschedule
        </text>

        <BoxCard x="434" y="58" w="422" h="300" tone="violet" p={p} title="STATEFULSET + HEADLESS SERVICE" badge="clusterIP: None" />
        <CalloutBadge x={454} y={58} num={3} tone="violet" p={p} />
        <Pill x={452} y={100} w={386} h={46} label="Headless Service: pg-hl (clusterIP: None)" sub="Direct per-Pod DNS records instead of round-robin VIP" tone="violet" p={p} />

        <BoxCard x="452" y="162" w="184" h="168" tone="emerald" p={p} title="Pod: pg-0 (Primary)" badge="#0 First" />
        <Pill x={464} y={200} w={160} h={42} label="pg-0.pg-hl.prod.svc" sub="Sticky DNS Identity" tone="emerald" p={p} />
        <Pill x={464} y={252} w={160} h={44} label="PVC: data-pg-0" sub="Dedicated 50Gi Disk" tone="amber" p={p} />

        <BoxCard x="654" y="162" w="184" h="168" tone="cyan" p={p} title="Pod: pg-1 (Replica)" badge="#1 Ordered" />
        <Pill x={666} y={200} w={160} h={42} label="pg-1.pg-hl.prod.svc" sub="Boots after pg-0 Ready" tone="cyan" p={p} />
        <Pill x={666} y={252} w={160} h={44} label="PVC: data-pg-1" sub="Dedicated 50Gi Disk" tone="amber" p={p} />

        <text x="645" y="346" textAnchor="middle" fill={p.tones.violet.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          volumeClaimTemplates never deletes PVCs on scale-down!
        </text>

        <path d="M 124 168 L 124 150" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 206 200 L 224 200" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 308 148 L 308 166" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 636 220 L 652 220" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.8" markerEnd={marker('cyan')} />
      </>
    )}
  </SvgShell>
);

// K14: 3 Health Gates (startupProbe -> livenessProbe Restart vs readinessProbe Endpoint Cut) + preStop Graceful Drain
const K14Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k14" isLight={isLight} className={className} title="3 Health Probes (Startup / Readiness / Liveness) & Graceful Shutdown" tag="kube:k14">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="536" h="300" tone="sky" p={p} title="KUBELET 3-PROBE STATE MACHINE" badge="Health Gates" />
        <CalloutBadge x={44} y={58} num={1} tone="sky" p={p} />

        <Pill x={42} y={102} w={224} h={64} label="1. startupProbe (/healthz)" sub="Blocks other probes during warm-up" tone="sky" p={p} />
        <Pill x={302} y={102} w={240} h={64} label="2. readinessProbe (/readyz)" sub="Fail -> Cut Pod IP from Service VIP!" tone="emerald" p={p} />
        <CalloutBadge x={534} y={102} num={2} tone="emerald" p={p} />

        <Pill x={42} y={192} w={224} h={64} label="3. livenessProbe (/livez)" sub="Fail -> Kill & Restart Container!" tone="rose" p={p} />
        <rect x="302" y="192" width="240" height="64" rx="8" fill={p.tones.rose.bg} stroke={p.tones.rose.stroke} strokeWidth="1.3" />
        <text x="422" y="216" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="10" fontWeight="700">
          TRAP: Never check DB in /livez!
        </text>
        <text x="422" y="234" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Slow DB -&gt; Cascading restart storm
        </text>
        <text x="422" y="248" textAnchor="middle" fill={p.inkSoft} fontFamily={MONO} fontSize="8.5">
          Check DB only inside /readyz
        </text>

        <Pill x={42} y={276} w={500} h={60} label="readiness != Kill (Traffic Gate)   |   liveness == Restart (Deadlock Cure)" sub="Kubelet probes run continuously every periodSeconds" tone="slate" p={p} />

        <BoxCard x="582" y="58" w="274" h="300" tone="amber" p={p} title="GRACEFUL DRAIN SEQUENCE" badge="Zero 502s" />
        <CalloutBadge x={602} y={58} num={3} tone="amber" p={p} />
        <Pill x={600} y={100} w={238} h={44} label="t=0s: Pod Terminating" sub="Endpoint removal + preStop start" tone="amber" p={p} />
        <Pill x={600} y={156} w={238} h={44} label="preStop: sleep 5" sub="Lets kube-proxy/Ingress sync VIP" tone="sky" p={p} />
        <Pill x={600} y={212} w={238} h={46} label="SIGTERM -> Node PID 1" sub="server.close() drains in-flight reqs" tone="emerald" p={p} />
        <Pill x={600} y={270} w={238} h={46} label="GracePeriod (30s ceiling)" sub="Clean exit(0) before SIGKILL" tone="violet" p={p} />
        <text x="719" y="338" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Zero dropped requests on Rollout!
        </text>

        <path d="M 266 134 L 300 134" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 154 166 L 154 190" fill="none" stroke={p.tones.rose.stroke} strokeWidth="1.8" markerEnd={marker('rose')} />
        <path d="M 719 144 L 719 154" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.6" markerEnd={marker('sky')} />
        <path d="M 719 200 L 719 210" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.6" markerEnd={marker('emerald')} />
        <path d="M 719 258 L 719 268" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.6" markerEnd={marker('violet')} />
      </>
    )}
  </SvgShell>
);

// K15: CPU Requests/Limits (CFS Throttling) vs Memory Limits (OOMKilled 137) + HPA Autoscaling & Job/CronJob
const K15Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k15" isLight={isLight} className={className} title="Requests vs Limits (Throttle vs OOM 137), HPA v2 & Batch CronJobs" tag="kube:k15">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="284" h="300" tone="amber" p={p} title="REQUESTS VS LIMITS" badge="QoS Class" />
        <CalloutBadge x={44} y={58} num={1} tone="amber" p={p} />
        <Pill x={40} y={100} w={252} h={52} label="requests: 250m CPU / 256Mi" sub="Used by kube-scheduler for placement" tone="sky" p={p} />
        <Pill x={40} y={164} w={252} h={54} label="limits.cpu: 500m (Compressible)" sub="Exceed -> CFS Throttled (Slow, Alive)" tone="amber" p={p} />
        <Pill x={40} y={230} w={252} h={58} label="limits.memory: 512Mi (Hard)" sub="Exceed -> OOMKilled (Exit Code 137)!" tone="rose" p={p} />
        <text x="166" y="314" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Guaranteed QoS: requests == limits
        </text>
        <text x="166" y="332" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Eviction order: BestEffort -&gt; Burstable
        </text>

        <BoxCard x="328" y="58" w="268" h="300" tone="emerald" p={p} title="HPA AUTOSCALING (v2)" badge="Elastic Scale" />
        <CalloutBadge x={348} y={58} num={2} tone="emerald" p={p} />
        <Pill x={344} y={100} w={236} h={48} label="Metrics Server (Kubelet API)" sub="Scrapes live Pod CPU / Memory" tone="cyan" p={p} />
        <Pill x={344} y={166} w={236} h={54} label="HorizontalPodAutoscaler" sub="Target avgCPU: 70% (min:2, max:12)" tone="emerald" p={p} />
        <Pill x={344} y={238} w={236} h={54} label="Deployment Replicas: 2 -> 8" sub="Formula: ceil(curr * actual / target)" tone="sky" p={p} />
        <text x="462" y="320" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Requires resources.requests.cpu set!
        </text>
        <text x="462" y="336" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Cooldown window prevents flapping
        </text>

        <BoxCard x="616" y="58" w="240" h="300" tone="violet" p={p} title="BATCH: JOB & CRONJOB" badge="Run-to-Exit(0)" />
        <CalloutBadge x={636} y={58} num={3} tone="violet" p={p} />
        <Pill x={632} y={100} w={208} h={54} label="CronJob (0 2 * * *)" sub="concurrencyPolicy: Forbid" tone="violet" p={p} />
        <Pill x={632} y={170} w={208} h={54} label="Job Controller (batch/v1)" sub="completions: 1 | backoffLimit: 3" tone="sky" p={p} />
        <Pill x={632} y={240} w={208} h={54} label="Worker Pod -> Completed" sub="restartPolicy: OnFailure / Never" tone="emerald" p={p} />
        <text x="736" y="320" textAnchor="middle" fill={p.tones.violet.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          ttlSecondsAfterFinished cleans up
        </text>

        <path d="M 462 148 L 462 164" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.8" markerEnd={marker('cyan')} />
        <path d="M 462 220 L 462 236" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 736 154 L 736 168" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" markerEnd={marker('violet')} />
        <path d="M 736 224 L 736 238" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
      </>
    )}
  </SvgShell>
);

// K16: Pod securityContext (runAsNonRoot, readOnlyRootFilesystem, drop: ALL) + RBAC (ServiceAccount -> RoleBinding -> Role)
const K16Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k16" isLight={isLight} className={className} title="Defense-in-Depth: Hardened securityContext, PSA Restricted & RBAC" tag="kube:k16">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="404" h="300" tone="emerald" p={p} title="CONTAINER SECURITYCONTEXT + PSA" badge="PSA: restricted" />
        <CalloutBadge x={44} y={58} num={1} tone="emerald" p={p} />
        <Pill x={42} y={100} w={368} h={44} label="runAsNonRoot: true | runAsUser: 1000" sub="Blocks root UID 0 container breakout" align="left" tone="emerald" p={p} />
        <Pill x={42} y={152} w={368} h={44} label="readOnlyRootFilesystem: true" sub="Immutable / + mount emptyDir at /tmp" align="left" tone="sky" p={p} />
        <Pill x={42} y={204} w={368} h={44} label='capabilities.drop: ["ALL"]' sub="Strips NET_RAW, SYS_ADMIN + no setuid" align="left" tone="cyan" p={p} />
        <Pill x={42} y={256} w={368} h={44} label="seccompProfile: RuntimeDefault" sub="Filters dangerous Linux syscalls" align="left" tone="violet" p={p} />
        <CalloutBadge x={410} y={278} num={2} tone="violet" p={p} />
        <text x="226" y="330" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Enforced cluster-wide via Namespace PSA labels
        </text>

        <BoxCard x="454" y="58" w="402" h="300" tone="amber" p={p} title="LEAST-PRIVILEGE RBAC MATRIX" badge="rbac.authorization.k8s.io" />
        <CalloutBadge x={474} y={58} num={3} tone="amber" p={p} />
        <Pill x={472} y={102} w={366} h={52} label="Subject: ServiceAccount (shop-api-sa)" sub="automountServiceAccountToken: false if unused!" tone="sky" p={p} />
        <Pill x={472} y={176} w={366} h={52} label="Binding: RoleBinding (Namespace-scoped)" sub="Links Subject <-> Role inside ns/production" tone="amber" p={p} />
        <Pill x={472} y={250} w={366} h={56} label="Role: config-reader (Allowed Verbs)" sub='resources: ["configmaps"] | verbs: ["get", "list"]' tone="emerald" p={p} />
        <text x="655" y="330" textAnchor="middle" fill={p.tones.rose.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          NEVER bind cluster-admin to Application Pods!
        </text>

        <path d="M 655 154 L 655 174" fill="none" stroke={p.tones.amber.stroke} strokeWidth="2" markerEnd={marker('amber')} />
        <path d="M 655 228 L 655 248" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// K17: Zero-Trust NetworkPolicy Pod Firewall (Default Deny + Allowed Ingress/Egress) & Helm Chart
const K17Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k17" isLight={isLight} className={className} title="Zero-Trust NetworkPolicy Firewall & Helm Chart Templating Engine" tag="kube:k17">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="444" h="300" tone="emerald" p={p} title="ZERO-TRUST NETWORKPOLICY (CNI: CILIUM / CALICO)" badge="L3/L4 Firewall" />
        <CalloutBadge x={44} y={58} num={1} tone="emerald" p={p} />

        <Pill x={42} y={100} w={408} h={42} label="Step 1: default-deny-all (podSelector: {})" sub="Blocks 100% unauthorized East-West lateral traffic" tone="rose" p={p} />

        <Pill x={42} y={164} w={118} h={64} label="web-ui Pod" sub="tier=frontend" tone="sky" p={p} />
        <Pill x={184} y={164} w={118} h={64} label="shop-api Pod" sub="tier=backend" tone="emerald" p={p} />
        <Pill x={328} y={164} w={122} h={64} label="postgres Pod" sub=":5432 tier=db" tone="amber" p={p} />

        <Pill x={42} y={252} w={196} h={52} label="Attacker / Rogue Pod" sub="Direct :5432 -> DROPPED!" tone="rose" p={p} />
        <Pill x={254} y={252} w={196} h={52} label="DNS Egress UDP/TCP :53" sub="Required for CoreDNS!" tone="cyan" p={p} />
        <CalloutBadge x={446} y={252} num={2} tone="cyan" p={p} />

        <text x="246" y="332" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Step 2: Additive Whitelist (Only backend -&gt; db:5432)
        </text>

        <path d="M 160 196 L 182 196" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 302 196 L 326 196" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="2" markerEnd={marker('emerald')} />
        <path d="M 238 278 L 389 278 L 389 230" fill="none" stroke={p.tones.rose.stroke} strokeWidth="1.8" strokeDasharray="4 3" markerEnd={marker('rose')} />

        <BoxCard x="490" y="58" w="366" h="300" tone="violet" p={p} title="HELM PACKAGING ENGINE (v3)" badge="DRY Manifests" />
        <CalloutBadge x={510} y={58} num={3} tone="violet" p={p} />
        <Pill x={508} y={102} w={158} h={56} label="templates/*.yaml" sub="{{ .Values.replicas }}" tone="violet" p={p} />
        <Pill x={680} y={102} w={158} h={56} label="values-prod.yaml" sub="replicas: 6, tag: 1.4.2" tone="sky" p={p} />
        <Pill x={508} y={180} w={330} h={52} label="helm upgrade --install --atomic" sub="Renders YAML + Auto-rollbacks on probe failure!" tone="emerald" p={p} />
        <Pill x={508} y={250} w={330} h={54} label="Release Revision Ledger (Secret)" sub="helm template (dry-run) | helm rollback rev" tone="amber" p={p} />
        <text x="673" y="332" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9.5">
          1 Chart serves dev / staging / prod cleanly
        </text>

        <path d="M 587 158 L 620 178" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" markerEnd={marker('violet')} />
        <path d="M 759 158 L 720 178" fill="none" stroke={p.tones.sky.stroke} strokeWidth="1.8" markerEnd={marker('sky')} />
        <path d="M 673 232 L 673 248" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// K18: Pod Boot Triage Decision Tree (Pending -> ImagePullBackOff -> CreateContainerConfigError -> CrashLoopBackOff --previous)
const K18Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k18" isLight={isLight} className={className} title="SRE 3-Step Pod Boot Triage Decision Tree" tag="kube:k18">
    {(p, marker) => (
      <>
        <Pill x={24} y={154} w={154} h={68} label="kubectl get pods" sub="Inspect STATUS & RESTARTS" tone="sky" p={p} />
        <CalloutBadge x={40} y={154} num={1} tone="sky" p={p} />

        <BoxCard x="210" y="56" w="318" h="302" tone="amber" p={p} title="PRE-START FAILURES (NO LOGS YET!)" badge="describe pod" />
        <CalloutBadge x={230} y={56} num={2} tone="amber" p={p} />
        <Pill x={228} y={98} w={282} h={60} label="1. Pending (Scheduler / CSI)" sub="Insufficient CPU/RAM or unbound PVC" tone="amber" p={p} />
        <Pill x={228} y={170} w={282} h={60} label="2. ImagePullBackOff (Registry)" sub="Wrong image:tag or missing pullSecret" tone="rose" p={p} />
        <Pill x={228} y={242} w={282} h={60} label="3. CreateContainerConfigError" sub="Missing ConfigMap / Secret key ref!" tone="violet" p={p} />
        <text x="369" y="326" textAnchor="middle" fill={p.tones.amber.fg} fontFamily={MONO} fontSize="10" fontWeight="700">
          Fix via: kubectl describe pod -&gt; Events:
        </text>
        <text x="369" y="343" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          App never booted -&gt; kubectl logs is empty!
        </text>

        <BoxCard x="556" y="56" w="298" h="302" tone="rose" p={p} title="RUNTIME CRASH (CODE RAN & DIED)" badge="logs --previous" />
        <CalloutBadge x={576} y={56} num={3} tone="rose" p={p} />
        <Pill x={574} y={98} w={262} h={62} label="4. CrashLoopBackOff" sub="PID 1 exits != 0 -> 10s..5m backoff" tone="rose" p={p} />
        <Pill x={574} y={174} w={262} h={60} label="kubectl logs <pod> --previous" sub="Reads stack trace of crashed container!" tone="emerald" p={p} />
        <Pill x={574} y={248} w={262} h={60} label="Common Root Causes" sub="Uncaught JS error, missing ENV, port bind" tone="sky" p={p} />
        <text x="705" y="330" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          RESTARTS &gt; 0 proves container executed!
        </text>

        <path d="M 178 172 L 226 128" fill="none" stroke={p.tones.amber.stroke} strokeWidth="2" markerEnd={marker('amber')} />
        <path d="M 178 188 L 226 200" fill="none" stroke={p.tones.rose.stroke} strokeWidth="2" markerEnd={marker('rose')} />
        <path d="M 178 204 L 226 272" fill="none" stroke={p.tones.violet.stroke} strokeWidth="2" markerEnd={marker('violet')} />
        <path d="M 101 154 L 101 48 L 705 48 L 705 56" fill="none" stroke={p.tones.rose.stroke} strokeWidth="2" markerEnd={marker('rose')} />
        <path d="M 705 160 L 705 172" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
      </>
    )}
  </SvgShell>
);

// K19: Production Incident Triage (OOMKilled Exit 137, Service Endpoints: <none> Label/Port Mismatch & Bad Rollout Recovery)
const K19Diagram: DiagramRenderer = ({ isLight, className }) => (
  <SvgShell id="k19" isLight={isLight} className={className} title="Production War-Room: OOMKilled (137), 502 Endpoints <none> & Rollout Undo" tag="kube:k19">
    {(p, marker) => (
      <>
        <BoxCard x="24" y="58" w="264" h="300" tone="rose" p={p} title="INCIDENT #1: OOMKILLED" badge="Exit 137" />
        <CalloutBadge x={44} y={58} num={1} tone="rose" p={p} />
        <Pill x={40} y={102} w={232} h={52} label="Last State: OOMKilled" sub="Exit Code: 137 (128 + SIGKILL 9)" tone="rose" p={p} />
        <Pill x={40} y={168} w={232} h={52} label="Cause: fs.readFileSync(300MB)" sub="Spikes V8 Heap past limits.memory" tone="amber" p={p} />
        <Pill x={40} y={234} w={232} h={64} label="Fix: Streams + Right-Size RAM" sub="fs.createReadStream + 512Mi limit" tone="emerald" p={p} />
        <text x="156" y="326" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Evidence: kubectl describe pod
        </text>

        <BoxCard x="308" y="58" w="264" h="300" tone="amber" p={p} title="INCIDENT #2: 502 GATEWAY" badge="Running != Reachable" />
        <CalloutBadge x={328} y={58} num={2} tone="amber" p={p} />
        <Pill x={324} y={102} w={232} h={52} label="Endpoints: <none>" sub="Service selector != Pod labels!" tone="amber" p={p} />
        <Pill x={324} y={168} w={232} h={52} label="Endpoints Has IP -> Still 502" sub="targetPort: 8080 != listen(3000)!" tone="violet" p={p} />
        <Pill x={324} y={234} w={232} h={64} label="Fix: Align Selector & targetPort" sub="kubectl get ep <svc> + --show-labels" tone="emerald" p={p} />
        <text x="440" y="326" textAnchor="middle" fill={p.inkMuted} fontFamily={MONO} fontSize="9">
          Instant recovery without Pod restart
        </text>

        <BoxCard x="592" y="58" w="264" h="300" tone="emerald" p={p} title="INCIDENT #3: BAD ROLLOUT" badge="Zero-Panic Undo" />
        <CalloutBadge x={612} y={58} num={3} tone="emerald" p={p} />
        <Pill x={608} y={102} w={232} h={52} label="New Revision v2 Failing Probe" sub="maxUnavailable: 0 keeps v1 alive!" tone="sky" p={p} />
        <Pill x={608} y={168} w={232} h={52} label="kubectl rollout undo deploy/api" sub="Restores healthy ReplicaSet v1 in 2s" tone="emerald" p={p} />
        <Pill x={608} y={234} w={232} h={64} label="Prevent Rollout Dropouts" sub="readinessProbe + preStop + SIGTERM" tone="cyan" p={p} />
        <text x="724" y="326" textAnchor="middle" fill={p.tones.emerald.fg} fontFamily={MONO} fontSize="9.5" fontWeight="700">
          Stabilize First -&gt; Root-Cause Second
        </text>

        <path d="M 156 154 L 156 166" fill="none" stroke={p.tones.amber.stroke} strokeWidth="1.8" markerEnd={marker('amber')} />
        <path d="M 156 220 L 156 232" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 440 154 L 440 166" fill="none" stroke={p.tones.violet.stroke} strokeWidth="1.8" markerEnd={marker('violet')} />
        <path d="M 440 220 L 440 232" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 724 154 L 724 166" fill="none" stroke={p.tones.emerald.stroke} strokeWidth="1.8" markerEnd={marker('emerald')} />
        <path d="M 724 220 L 724 232" fill="none" stroke={p.tones.cyan.stroke} strokeWidth="1.8" markerEnd={marker('cyan')} />
      </>
    )}
  </SvgShell>
);

export const KUBE_DIAGRAMS: Record<string, DiagramRenderer> = {
  'kube:k00': K00Diagram,
  'kube:k01': K01Diagram,
  'kube:k02': K02Diagram,
  'kube:k03': K03Diagram,
  'kube:k04': K04Diagram,
  'kube:k05': K05Diagram,
  'kube:k06': K06Diagram,
  'kube:k07': K07Diagram,
  'kube:k08': K08Diagram,
  'kube:k09': K09Diagram,
  'kube:k10': K10Diagram,
  'kube:k11': K11Diagram,
  'kube:k12': K12Diagram,
  'kube:k13': K13Diagram,
  'kube:k14': K14Diagram,
  'kube:k15': K15Diagram,
  'kube:k16': K16Diagram,
  'kube:k17': K17Diagram,
  'kube:k18': K18Diagram,
  'kube:k19': K19Diagram,
};

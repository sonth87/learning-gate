import React from 'react';
import type { DiagramRenderer } from './diagramRegistry';

interface Theme {
  bg: string;
  panel: string;
  panelAlt: string;
  border: string;
  borderStrong: string;
  ink: string;
  muted: string;
  subtle: string;
  red: string;
  redBg: string;
  redBorder: string;
  redInk: string;
  emerald: string;
  emeraldBg: string;
  emeraldBorder: string;
  emeraldInk: string;
  blue: string;
  blueBg: string;
  blueBorder: string;
  blueInk: string;
  amber: string;
  amberBg: string;
  amberBorder: string;
  amberInk: string;
  purple: string;
  purpleBg: string;
  purpleBorder: string;
  purpleInk: string;
  cyan: string;
  cyanBg: string;
  cyanBorder: string;
  cyanInk: string;
  codeBg: string;
  codeInk: string;
}

function getTheme(isLight: boolean): Theme {
  if (isLight) {
    return {
      bg: '#f8fafc',
      panel: '#ffffff',
      panelAlt: '#f1f5f9',
      border: '#cbd5e1',
      borderStrong: '#64748b',
      ink: '#0f172a',
      muted: '#334155',
      subtle: '#475569',
      red: '#dc2626',
      redBg: '#fef2f2',
      redBorder: '#fca5a5',
      redInk: '#991b1b',
      emerald: '#047857',
      emeraldBg: '#ecfdf5',
      emeraldBorder: '#6ee7b7',
      emeraldInk: '#065f46',
      blue: '#1d4ed8',
      blueBg: '#eff6ff',
      blueBorder: '#93c5fd',
      blueInk: '#1e40af',
      amber: '#b45309',
      amberBg: '#fffbeb',
      amberBorder: '#fcd34d',
      amberInk: '#92400e',
      purple: '#6d28d9',
      purpleBg: '#f5f3ff',
      purpleBorder: '#c4b5fd',
      purpleInk: '#5b21b6',
      cyan: '#0e7490',
      cyanBg: '#ecfeff',
      cyanBorder: '#67e8f9',
      cyanInk: '#155e75',
      codeBg: '#e2e8f0',
      codeInk: '#0f172a',
    };
  }
  return {
    bg: '#0b1120',
    panel: '#111827',
    panelAlt: '#1e293b',
    border: '#334155',
    borderStrong: '#94a3b8',
    ink: '#f8fafc',
    muted: '#cbd5e1',
    subtle: '#94a3b8',
    red: '#f87171',
    redBg: '#2a1215',
    redBorder: '#991b1b',
    redInk: '#fecaca',
    emerald: '#34d399',
    emeraldBg: '#06281e',
    emeraldBorder: '#065f46',
    emeraldInk: '#a7f3d0',
    blue: '#60a5fa',
    blueBg: '#0f1f38',
    blueBorder: '#1e40af',
    blueInk: '#bfdbfe',
    amber: '#fbbf24',
    amberBg: '#291d09',
    amberBorder: '#92400e',
    amberInk: '#fde68a',
    purple: '#c084fc',
    purpleBg: '#1f1433',
    purpleBorder: '#5b21b6',
    purpleInk: '#e9d5ff',
    cyan: '#22d3ee',
    cyanBg: '#08252c',
    cyanBorder: '#155e75',
    cyanInk: '#a5f3fc',
    codeBg: '#020617',
    codeInk: '#e2e8f0',
  };
}

const SANS = 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif';
const MONO = 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

interface ShellProps {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  isLight: boolean;
  className?: string;
  children: React.ReactNode;
}

const DiagramShell: React.FC<ShellProps> = ({
  id,
  code,
  title,
  subtitle,
  isLight,
  className,
  children,
}) => {
  const t = getTheme(isLight);
  return (
    <svg
      viewBox="0 0 880 400"
      className={className ? `w-full h-auto ${className}` : 'w-full h-auto'}
      role="img"
      aria-label={`${code} — ${title}`}
      fontFamily={SANS}
    >
      <defs>
        <marker id={`${id}-arr`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={t.borderStrong} />
        </marker>
        <marker id={`${id}-arr-red`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={t.red} />
        </marker>
        <marker id={`${id}-arr-green`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={t.emerald} />
        </marker>
        <marker id={`${id}-arr-blue`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={t.blue} />
        </marker>
        <marker id={`${id}-arr-amber`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={t.amber} />
        </marker>
        <marker id={`${id}-arr-purple`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={t.purple} />
        </marker>
      </defs>

      <rect x="1" y="1" width="878" height="398" rx="12" fill={t.bg} stroke={t.border} strokeWidth="1.5" />
      <rect x="1" y="1" width="878" height="44" rx="12" fill={t.panelAlt} />
      <rect x="1" y="33" width="878" height="12" fill={t.panelAlt} />
      <line x1="1" y1="45" x2="879" y2="45" stroke={t.border} strokeWidth="1" />

      <rect x="14" y="11" width="68" height="22" rx="5" fill={t.redBg} stroke={t.redBorder} strokeWidth="1" />
      <text x="48" y="26" textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.redInk}>
        {code}
      </text>
      <text x="94" y="27" fontSize="13.5" fontWeight="700" fill={t.ink}>
        {title}
      </text>
      <text x="864" y="27" textAnchor="end" fontFamily={MONO} fontSize="10.5" fill={t.muted}>
        {subtitle}
      </text>

      {children}
    </svg>
  );
};

const CalloutBadge: React.FC<{
  x: number;
  y: number;
  glyph: string;
  fill: string;
  stroke: string;
  ink: string;
}> = ({ x, y, glyph, fill, stroke, ink }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x="-11" y="-11" width="22" height="22" rx="11" fill={fill} stroke={stroke} strokeWidth="1.2" />
    <text x="0" y="4.5" textAnchor="middle" fontSize="13" fontWeight="700" fill={ink}>
      {glyph}
    </text>
  </g>
);

/* ============================================================================
 * r00: Latency Hierarchy + Single-Threaded epoll/kqueue Event Loop
 * ========================================================================== */
const R00LatencyEventLoop: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r00"
      code="REDIS·00"
      title="Latency Hierarchy & Single-Threaded I/O Multiplexing Loop"
      subtitle="RAM ~100ns · epoll/kqueue · Redis 8 Async I/O Threads"
      isLight={isLight}
      className={className}
    >
      {/* Left Panel: Latency Hierarchy */}
      <rect x="16" y="58" width="386" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="54" y="82" fontSize="12.5" fontWeight="700" fill={t.ink}>
        Storage &amp; Network Latency Scale (Logarithmic)
      </text>

      {/* Tier 1: L1/L2 Cache */}
      <rect x="30" y="100" width="358" height="44" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <rect x="38" y="110" width="28" height="24" rx="4" fill={t.emerald} />
      <text x="52" y="126" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill="#ffffff">L1</text>
      <text x="76" y="119" fontSize="11.5" fontWeight="700" fill={t.ink}>CPU L1 / L2 SRAM Cache</text>
      <text x="76" y="135" fontFamily={MONO} fontSize="10" fill={t.muted}>~1 ns – 4 ns (on-die registers)</text>
      <text x="378" y="126" textAnchor="end" fontFamily={MONO} fontSize="12" fontWeight="700" fill={t.emeraldInk}>1x</text>

      {/* Tier 2: DRAM (Redis) */}
      <rect x="30" y="154" width="358" height="54" rx="6" fill={t.redBg} stroke={t.redBorder} strokeWidth="1.5" />
      <rect x="38" y="164" width="64" height="34" rx="4" fill={t.red} />
      <text x="70" y="185" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill="#ffffff">DRAM</text>
      <text x="112" y="175" fontSize="12" fontWeight="700" fill={t.ink}>Main Memory (Redis Hot Dataset)</text>
      <text x="112" y="193" fontFamily={MONO} fontSize="10.5" fill={t.redInk}>~100 ns access · 100k–500k ops/s</text>
      <text x="378" y="185" textAnchor="end" fontFamily={MONO} fontSize="12" fontWeight="700" fill={t.redInk}>~100 ns</text>

      {/* Tier 3: NVMe SSD */}
      <rect x="30" y="218" width="358" height="48" rx="6" fill={t.amberBg} stroke={t.amberBorder} />
      <rect x="38" y="228" width="128" height="28" rx="4" fill={t.amber} />
      <text x="102" y="246" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill="#ffffff">NVMe SSD I/O</text>
      <text x="176" y="238" fontSize="11.5" fontWeight="700" fill={t.ink}>Local NVMe Page Read</text>
      <text x="176" y="254" fontFamily={MONO} fontSize="10" fill={t.muted}>1,000x slower than RAM</text>
      <text x="378" y="246" textAnchor="end" fontFamily={MONO} fontSize="11.5" fontWeight="700" fill={t.amberInk}>~100 µs</text>

      {/* Tier 4: Network + SQL Disk */}
      <rect x="30" y="276" width="358" height="52" rx="6" fill={t.panelAlt} stroke={t.borderStrong} />
      <rect x="38" y="286" width="210" height="14" rx="3" fill={t.borderStrong} />
      <text x="40" y="317" fontSize="11" fontWeight="600" fill={t.ink}>TCP RTT + Relational B-Tree Query</text>
      <text x="378" y="298" textAnchor="end" fontFamily={MONO} fontSize="11.5" fontWeight="700" fill={t.ink}>~5 ms (50,000x)</text>
      <text x="378" y="317" textAnchor="end" fontFamily={MONO} fontSize="10" fill={t.muted}>Disk lock + SQL planner</text>

      <text x="30" y="352" fontFamily={MONO} fontSize="10.5" fill={t.muted}>
        Zero context-switch locks · Zero mutex contention on data structures
      </text>
      <text x="30" y="370" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.emeraldInk}>
        Rule: Avoid O(N) commands (KEYS *) that stall the 100ns loop!
      </text>

      {/* Right Panel: Single-Threaded Event Loop */}
      <rect x="416" y="58" width="448" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={436} y={78} glyph="②" fill={t.purpleBg} stroke={t.purpleBorder} ink={t.purpleInk} />
      <text x="454" y="82" fontSize="12.5" fontWeight="700" fill={t.ink}>
        I/O Multiplexing &amp; Single-Threaded Execution Core
      </text>

      {/* Client Sockets */}
      {[0, 1, 2].map((idx) => {
        const y = 104 + idx * 46;
        return (
          <g key={idx}>
            <rect x="430" y={y} width="96" height="34" rx="6" fill={t.blueBg} stroke={t.blueBorder} />
            <text x="478" y={y + 15} textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.blueInk}>
              Socket fd={idx + 5}
            </text>
            <text x="478" y={y + 28} textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
              {idx === 0 ? 'GET user:42' : idx === 1 ? 'INCR views' : 'HSET cart:9'}
            </text>
            <line x1="526" y1={y + 17} x2="558" y2={166} stroke={t.blue} strokeWidth="1.4" markerEnd="url(#r00-arr-blue)" />
          </g>
        );
      })}

      {/* epoll / kqueue Multiplexer */}
      <rect x="562" y="114" width="114" height="108" rx="8" fill={t.purpleBg} stroke={t.purpleBorder} strokeWidth="1.5" />
      <text x="619" y="138" textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.purpleInk}>
        epoll / kqueue
      </text>
      <text x="619" y="155" textAnchor="middle" fontSize="10.5" fill={t.ink}>
        Kernel Readiness
      </text>
      <rect x="572" y="165" width="94" height="22" rx="4" fill={t.codeBg} />
      <text x="619" y="180" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.codeInk}>
        aeApiPoll()
      </text>
      <text x="619" y="206" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Redis 8 I/O parse
      </text>

      <line x1="676" y1="168" x2="708" y2="168" stroke={t.purple} strokeWidth="1.8" markerEnd="url(#r00-arr-purple)" />

      {/* Main Event Loop Thread */}
      <rect x="712" y="102" width="138" height="142" rx="8" fill={t.redBg} stroke={t.redBorder} strokeWidth="1.8" />
      <CalloutBadge x={730} y={120} glyph="③" fill={t.red} stroke={t.redBorder} ink="#ffffff" />
      <text x="788" y="124" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={t.redInk}>
        Main Thread
      </text>
      <text x="781" y="143" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={t.ink}>
        Serial Command Exec
      </text>
      <rect x="722" y="152" width="118" height="22" rx="4" fill={t.panel} stroke={t.redBorder} />
      <text x="781" y="167" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        1. processCommand()
      </text>
      <rect x="722" y="180" width="118" height="22" rx="4" fill={t.panel} stroke={t.redBorder} />
      <text x="781" y="195" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        2. serverCron() TTL
      </text>
      <rect x="722" y="208" width="118" height="22" rx="4" fill={t.panel} stroke={t.redBorder} />
      <text x="781" y="223" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        3. beforeSleep() flush
      </text>

      {/* Bottom In-Memory Keyspace Dict + Background Workers */}
      <line x1="781" y1="244" x2="781" y2="274" stroke={t.red} strokeWidth="1.6" markerEnd="url(#r00-arr-red)" />

      <rect x="430" y="278" width="246" height="90" rx="7" fill={t.cyanBg} stroke={t.cyanBorder} />
      <text x="444" y="298" fontSize="11.5" fontWeight="700" fill={t.cyanInk}>
        Redis 8 Multi-Threaded I/O &amp; BIO Workers
      </text>
      <text x="444" y="317" fontFamily={MONO} fontSize="10" fill={t.ink}>
        • io-threads: socket read/write + RESP parse
      </text>
      <text x="444" y="335" fontFamily={MONO} fontSize="10" fill={t.ink}>
        • bio_lazy_free: async UNLINK memory reclaim
      </text>
      <text x="444" y="353" fontFamily={MONO} fontSize="10" fill={t.ink}>
        • bio_aof: background fsync(everysec)
      </text>

      <rect x="690" y="278" width="160" height="90" rx="7" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="770" y="300" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={t.emeraldInk}>
        RAM Keyspace Dict
      </text>
      <text x="770" y="320" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={t.ink}>
        dict[key] -&gt; robj*
      </text>
      <text x="770" y="338" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={t.muted}>
        SDS · listpack · skiplist
      </text>
      <text x="770" y="356" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        Atomic Without Locks
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r01: RESP3 Wire Frame + SET NX|XX EX|PX State Machine & Lazy vs Active Expiry
 * ========================================================================== */
const R01RespAndExpiration: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r01"
      code="REDIS·01"
      title="RESP3 Wire Frame, SET Options Guard & Dual Expiration Engine"
      subtitle="RESP3 Prefix Framing · NX/XX · Lazy + Active TTL"
      isLight={isLight}
      className={className}
    >
      {/* Panel 1: RESP3 Wire Frame */}
      <rect x="16" y="58" width="272" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="54" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        RESP3 Binary-Safe Wire Frame
      </text>
      <text x="28" y="103" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.blueInk}>
        SET otp:99 &quot;4821&quot; EX 60 NX
      </text>

      {[
        { prefix: '*5\\r\\n', desc: 'Array of 5 Bulk Strings', color: t.purpleBg, border: t.purpleBorder, ink: t.purpleInk },
        { prefix: '$3\\r\\nSET\\r\\n', desc: 'Bulk len=3 command', color: t.blueBg, border: t.blueBorder, ink: t.blueInk },
        { prefix: '$6\\r\\notp:99\\r\\n', desc: 'Bulk len=6 key bytes', color: t.emeraldBg, border: t.emeraldBorder, ink: t.emeraldInk },
        { prefix: '$4\\r\\n4821\\r\\n', desc: 'Bulk len=4 payload', color: t.amberBg, border: t.amberBorder, ink: t.amberInk },
        { prefix: '$2\\r\\nEX\\r\\n$2\\r\\n60\\r\\n', desc: 'TTL 60s + NX flag', color: t.panelAlt, border: t.borderStrong, ink: t.ink },
      ].map((row, idx) => {
        const y = 114 + idx * 40;
        return (
          <g key={idx}>
            <rect x="28" y={y} width="248" height="33" rx="5" fill={row.color} stroke={row.border} />
            <text x="36" y={y + 20} fontFamily={MONO} fontSize="10" fontWeight="700" fill={row.ink}>
              {row.prefix}
            </text>
            <text x="268" y={y + 20} textAnchor="end" fontSize="9.5" fill={t.muted}>
              {row.desc}
            </text>
          </g>
        );
      })}

      <rect x="28" y="320" width="248" height="52" rx="6" fill={t.codeBg} stroke={t.border} />
      <text x="38" y="338" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.codeInk}>
        RESP3 Replies: +OK · :int · $bulk
      </text>
      <text x="38" y="356" fontFamily={MONO} fontSize="10" fill={t.muted}>
        _\\r\\n (Null) · %map · ~set · -ERR
      </text>

      {/* Panel 2: SET NX|XX EX|PX State Machine */}
      <rect x="302" y="58" width="276" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={322} y={78} glyph="②" fill={t.amberBg} stroke={t.amberBorder} ink={t.amberInk} />
      <text x="340" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Atomic SET Guard State Machine
      </text>

      <rect x="366" y="98" width="148" height="34" rx="6" fill={t.blueBg} stroke={t.blueBorder} />
      <text x="440" y="119" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.blueInk}>
        lookupKeyWrite(key)
      </text>

      <line x1="404" y1="132" x2="366" y2="166" stroke={t.emerald} strokeWidth="1.5" markerEnd="url(#r01-arr-green)" />
      <line x1="476" y1="132" x2="514" y2="166" stroke={t.red} strokeWidth="1.5" markerEnd="url(#r01-arr-red)" />

      <rect x="314" y="170" width="116" height="62" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="372" y="190" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        Key Missing
      </text>
      <text x="372" y="207" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        NX -&gt; Write +OK
      </text>
      <text x="372" y="222" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        XX -&gt; Abort (_ nil)
      </text>

      <rect x="450" y="170" width="116" height="62" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="508" y="190" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>
        Key Exists
      </text>
      <text x="508" y="207" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        NX -&gt; Abort (_ nil)
      </text>
      <text x="508" y="222" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        XX -&gt; Update +OK
      </text>

      <line x1="372" y1="232" x2="420" y2="262" stroke={t.borderStrong} strokeWidth="1.4" markerEnd="url(#r01-arr)" />
      <line x1="508" y1="232" x2="460" y2="262" stroke={t.borderStrong} strokeWidth="1.4" markerEnd="url(#r01-arr)" />

      <rect x="316" y="266" width="248" height="106" rx="6" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="328" y="286" fontSize="11" fontWeight="700" fill={t.amberInk}>
        TTL Modifiers (Stored as Unix ms int64)
      </text>
      <text x="328" y="305" fontFamily={MONO} fontSize="10" fill={t.ink}>
        EX sec · PX ms · EXAT / PXAT
      </text>
      <text x="328" y="323" fontFamily={MONO} fontSize="10" fill={t.ink}>
        KEEPTTL -&gt; preserve existing expires[key]
      </text>
      <text x="328" y="341" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>
        Warning: Bare SET wipes TTL to -1!
      </text>
      <text x="328" y="359" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        GET -&gt; return old val atomically with SET
      </text>

      {/* Panel 3: Lazy vs Active Expiration */}
      <rect x="592" y="58" width="272" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={612} y={78} glyph="③" fill={t.emeraldBg} stroke={t.emeraldBorder} ink={t.emeraldInk} />
      <text x="630" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Lazy + Active Expiration
      </text>

      {/* Lazy Path */}
      <rect x="606" y="100" width="244" height="114" rx="7" fill={t.cyanBg} stroke={t.cyanBorder} />
      <text x="618" y="120" fontSize="11.5" fontWeight="700" fill={t.cyanInk}>
        A. Passive / Lazy Expiry (On Read)
      </text>
      <text x="618" y="140" fontFamily={MONO} fontSize="10" fill={t.ink}>
        Client -&gt; GET session:88
      </text>
      <text x="618" y="158" fontFamily={MONO} fontSize="10" fill={t.ink}>
        expireIfNeeded(): now &gt; expires[k]?
      </text>
      <text x="618" y="176" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        Yes -&gt; Delete/Unlink + return nil
      </text>
      <text x="618" y="196" fontSize="10" fill={t.muted}>
        0% idle CPU, but unvisited keys stay in RAM
      </text>

      {/* Active Path */}
      <rect x="606" y="228" width="244" height="144" rx="7" fill={t.purpleBg} stroke={t.purpleBorder} />
      <text x="618" y="248" fontSize="11.5" fontWeight="700" fill={t.purpleInk}>
        B. Active Expiry Cron (10 Hz default)
      </text>
      <text x="618" y="268" fontFamily={MONO} fontSize="10" fill={t.ink}>
        1. Sample 20 random keys w/ TTL
      </text>
      <text x="618" y="286" fontFamily={MONO} fontSize="10" fill={t.ink}>
        2. Evict all expired in sample
      </text>
      <text x="618" y="304" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.purpleInk}>
        3. If &gt;25% expired -&gt; repeat loop!
      </text>
      <rect x="618" y="318" width="220" height="42" rx="5" fill={t.panel} stroke={t.purpleBorder} />
      <text x="628" y="335" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        CPU Cap: max 25% main-thread time
      </text>
      <text x="628" y="351" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Prevents latency spikes on mass TTL
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r02: Hash Internal Encoding (listpack vs hashtable) + Redis 8 HEXPIRE
 * ========================================================================== */
const R02HashAndHexpire: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r02"
      code="REDIS·02"
      title="Hash Encoding Promotion (listpack -> hashtable) & Redis 8 HEXPIRE"
      subtitle="hash-max-listpack-entries 128 · Per-Field TTL"
      isLight={isLight}
      className={className}
    >
      {/* Top Left: listpack contiguous memory */}
      <rect x="16" y="58" width="530" height="152" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.emeraldBg} stroke={t.emeraldBorder} ink={t.emeraldInk} />
      <text x="54" y="82" fontSize="12.5" fontWeight="700" fill={t.ink}>
        Compact Encoding: listpack (&lt;= 128 fields &amp; values &lt;= 64B)
      </text>
      <text x="532" y="82" textAnchor="end" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        Zero Pointer Overhead · CPU Cache Friendly
      </text>

      {/* Contiguous byte array */}
      {[
        { label: 'tot-bytes', sub: '4B hdr', w: 66, bg: t.panelAlt, bd: t.borderStrong, ink: t.ink },
        { label: 'num-elem', sub: '2B', w: 64, bg: t.panelAlt, bd: t.borderStrong, ink: t.ink },
        { label: '"sku:1"', sub: 'field 1', w: 76, bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
        { label: '2', sub: 'int enc', w: 56, bg: t.blueBg, bd: t.blueBorder, ink: t.blueInk },
        { label: '"sku:9"', sub: 'field 2', w: 76, bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
        { label: '5', sub: 'int enc', w: 56, bg: t.blueBg, bd: t.blueBorder, ink: t.blueInk },
        { label: '0xFF', sub: 'LP_EOF', w: 60, bg: t.amberBg, bd: t.amberBorder, ink: t.amberInk },
      ].reduce<{ x: number; nodes: React.ReactNode[] }>(
        (acc, cell, i) => {
          const x = acc.x;
          acc.nodes.push(
            <g key={i}>
              <rect x={x} y={102} width={cell.w} height={50} rx="4" fill={cell.bg} stroke={cell.bd} strokeWidth="1.3" />
              <text x={x + cell.w / 2} y={124} textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={cell.ink}>
                {cell.label}
              </text>
              <text x={x + cell.w / 2} y={141} textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
                {cell.sub}
              </text>
            </g>,
          );
          return { x: x + cell.w + 6, nodes: acc.nodes };
        },
        { x: 32, nodes: [] },
      ).nodes}

      <text x="32" y="176" fontFamily={MONO} fontSize="10" fill={t.muted}>
        OBJECT ENCODING cart:42 -&gt; &quot;listpack&quot; (Linear scan O(N) over &lt;=128 entries beats L1 cache miss!)
      </text>
      <text x="32" y="195" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.amberInk}>
        Threshold crossed (&gt;128 fields OR &gt;64B value) -&gt; One-way promotion to dict hashtable:
      </text>

      {/* Bottom Left: hashtable */}
      <rect x="16" y="222" width="530" height="162" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={242} glyph="②" fill={t.purpleBg} stroke={t.purpleBorder} ink={t.purpleInk} />
      <text x="54" y="246" fontSize="12.5" fontWeight="700" fill={t.ink}>
        Promoted Encoding: Dict Hashtable (O(1) Lookup, Higher RAM per Entry)
      </text>

      {/* Buckets */}
      {[0, 1, 2].map((b) => {
        const y = 264 + b * 34;
        return (
          <g key={b}>
            <rect x="32" y={y} width="84" height="26" rx="4" fill={t.purpleBg} stroke={t.purpleBorder} />
            <text x="74" y={y + 17} textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.purpleInk}>
              bucket[{b}]
            </text>
            <line x1="116" y1={y + 13} x2="152" y2={y + 13} stroke={t.purple} strokeWidth="1.4" markerEnd="url(#r02-arr-purple)" />
          </g>
        );
      })}

      <rect x="156" y="264" width="166" height="26" rx="4" fill={t.panelAlt} stroke={t.borderStrong} />
      <text x="239" y="281" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={t.ink}>
        dictEntry(&quot;sku:1&quot; -&gt; &quot;2&quot;)
      </text>
      <line x1="322" y1="277" x2="354" y2="277" stroke={t.borderStrong} strokeWidth="1.3" markerEnd="url(#r02-arr)" />
      <rect x="358" y="264" width="168" height="26" rx="4" fill={t.panelAlt} stroke={t.borderStrong} />
      <text x="442" y="281" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={t.ink}>
        dictEntry(&quot;promo&quot; -&gt; &quot;VIP&quot;)
      </text>

      <rect x="156" y="298" width="166" height="26" rx="4" fill={t.panelAlt} stroke={t.borderStrong} />
      <text x="239" y="315" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={t.muted}>
        NULL
      </text>

      <rect x="156" y="332" width="220" height="26" rx="4" fill={t.panelAlt} stroke={t.borderStrong} />
      <text x="266" y="349" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={t.ink}>
        dictEntry(&quot;sku:999&quot; -&gt; 80B payload)
      </text>
      <text x="392" y="349" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>
        +24B dictEntry + SDS hdrs
      </text>

      {/* Right Panel: Redis 8 HEXPIRE */}
      <rect x="560" y="58" width="304" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={580} y={78} glyph="③" fill={t.redBg} stroke={t.redBorder} ink={t.redInk} />
      <text x="598" y="82" fontSize="12.5" fontWeight="700" fill={t.ink}>
        Redis 7.4 / 8 Per-Field TTL
      </text>
      <text x="574" y="103" fontFamily={MONO} fontSize="10" fill={t.muted}>
        Key: session:user:42 (Hash)
      </text>

      {[
        { field: 'profile_cache', val: '"{name:An}"', ttl: 'HTTL: -1 (persist)', bg: t.panelAlt, bd: t.borderStrong, ink: t.ink },
        { field: 'flash_coupon', val: '"SALE50"', ttl: 'HEXPIRE 300s NX', bg: t.amberBg, bd: t.amberBorder, ink: t.amberInk },
        { field: 'step_otp', val: '"839201"', ttl: 'HPEXPIRE 60000ms', bg: t.redBg, bd: t.redBorder, ink: t.redInk },
        { field: 'cart_lock', val: '"tx_19a"', ttl: 'HEXPIRE 15s GT', bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
      ].map((f, i) => {
        const y = 116 + i * 50;
        return (
          <g key={i}>
            <rect x="574" y={y} width="276" height="42" rx="6" fill={f.bg} stroke={f.bd} />
            <text x="584" y={y + 18} fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={f.ink}>
              {f.field} = {f.val}
            </text>
            <text x="584" y={y + 34} fontFamily={MONO} fontSize="9.5" fill={t.muted}>
              {f.ttl}
            </text>
          </g>
        );
      })}

      <rect x="574" y="320" width="276" height="52" rx="6" fill={t.codeBg} stroke={t.border} />
      <text x="584" y="338" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.codeInk}>
        HEXPIRE session:user:42 60 NX
      </text>
      <text x="584" y="355" fontFamily={MONO} fontSize="9.5" fill={t.emerald}>
        FIELDS 1 step_otp  -&gt;  1 (set!)
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r03: quicklist (Doubly-Linked listpack Nodes) + Set Venn Algebra
 * ========================================================================== */
const R03QuicklistAndSets: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r03"
      code="REDIS·03"
      title="Quicklist Deque Anatomy & Set Algebra Engine (SINTER / SUNION / SDIFF)"
      subtitle="LPUSH/RPOP O(1) · LZF Interior Compression · Set Ops"
      isLight={isLight}
      className={className}
    >
      {/* Top Panel: Quicklist */}
      <rect x="16" y="58" width="848" height="162" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="54" y="82" fontSize="12.5" fontWeight="700" fill={t.ink}>
        Redis List = quicklist (Doubly-Linked List of Fixed-Size listpack Nodes)
      </text>
      <text x="848" y="82" textAnchor="end" fontFamily={MONO} fontSize="10" fill={t.muted}>
        list-max-listpack-size -2 (8 KB / node)
      </text>

      {/* LPUSH arrow */}
      <rect x="28" y="114" width="86" height="56" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="71" y="136" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.emeraldInk}>
        LPUSH / LPOP
      </text>
      <text x="71" y="154" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={t.muted}>
        head O(1)
      </text>
      <line x1="114" y1="142" x2="148" y2="142" stroke={t.emerald} strokeWidth="1.6" markerEnd="url(#r03-arr-green)" />

      {/* Node 1: Head */}
      <rect x="152" y="102" width="174" height="84" rx="7" fill={t.blueBg} stroke={t.blueBorder} strokeWidth="1.5" />
      <text x="239" y="120" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.blueInk}>
        quicklistNode [HEAD]
      </text>
      <rect x="164" y="128" width="150" height="26" rx="4" fill={t.panel} stroke={t.blueBorder} />
      <text x="239" y="145" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        [ev_99 | ev_98 | ev_97]
      </text>
      <text x="239" y="172" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Uncompressed (Hot Head)
      </text>

      {/* Bidirectional links */}
      <line x1="326" y1="134" x2="362" y2="134" stroke={t.borderStrong} strokeWidth="1.5" markerEnd="url(#r03-arr)" />
      <line x1="362" y1="152" x2="326" y2="152" stroke={t.borderStrong} strokeWidth="1.5" markerEnd="url(#r03-arr)" />

      {/* Node 2: LZF Compressed interior */}
      <rect x="366" y="102" width="174" height="84" rx="7" fill={t.purpleBg} stroke={t.purpleBorder} strokeWidth="1.5" />
      <text x="453" y="120" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.purpleInk}>
        quicklistNode [MID]
      </text>
      <rect x="378" y="128" width="150" height="26" rx="4" fill={t.panel} stroke={t.purpleBorder} />
      <text x="453" y="145" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.purpleInk}>
        LZF Compressed 8KB
      </text>
      <text x="453" y="172" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        compress-depth 1
      </text>

      {/* Bidirectional links */}
      <line x1="540" y1="134" x2="576" y2="134" stroke={t.borderStrong} strokeWidth="1.5" markerEnd="url(#r03-arr)" />
      <line x1="576" y1="152" x2="540" y2="152" stroke={t.borderStrong} strokeWidth="1.5" markerEnd="url(#r03-arr)" />

      {/* Node 3: Tail */}
      <rect x="580" y="102" width="166" height="84" rx="7" fill={t.blueBg} stroke={t.blueBorder} strokeWidth="1.5" />
      <text x="663" y="120" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.blueInk}>
        quicklistNode [TAIL]
      </text>
      <rect x="592" y="128" width="142" height="26" rx="4" fill={t.panel} stroke={t.blueBorder} />
      <text x="663" y="145" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        [ev_03 | ev_02 | ev_01]
      </text>
      <text x="663" y="172" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Uncompressed (Hot Tail)
      </text>

      <line x1="780" y1="142" x2="746" y2="142" stroke={t.amber} strokeWidth="1.6" markerEnd="url(#r03-arr-amber)" />
      <rect x="780" y="114" width="72" height="56" rx="6" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="816" y="136" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.amberInk}>
        RPUSH/RPOP
      </text>
      <text x="816" y="154" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={t.muted}>
        tail O(1)
      </text>

      <text x="28" y="208" fontFamily={MONO} fontSize="10" fill={t.muted}>
        Pattern: LPUSH feed:u1 &lt;item&gt; + LTRIM feed:u1 0 99 -&gt; Bounded 100-item ring buffer in O(1)!
      </text>

      {/* Bottom Panel: Set Encodings & Venn Operations */}
      <rect x="16" y="232" width="848" height="152" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={252} glyph="②" fill={t.emeraldBg} stroke={t.emeraldBorder} ink={t.emeraldInk} />
      <text x="54" y="256" fontSize="12.5" fontWeight="700" fill={t.ink}>
        Redis Set: Unique Membership (intset / listpack / dict) &amp; Server-Side Set Algebra
      </text>

      {/* 3 Venn cards */}
      {/* SINTER */}
      <rect x="30" y="272" width="256" height="98" rx="6" fill={t.panelAlt} stroke={t.border} />
      <circle cx="92" cy="321" r="28" fill={t.blueBg} stroke={t.blueBorder} strokeWidth="1.5" />
      <circle cx="122" cy="321" r="28" fill={t.blueBg} stroke={t.blueBorder} strokeWidth="1.5" />
      <path d="M 107 297 A 28 28 0 0 1 107 345 A 28 28 0 0 1 107 297 Z" fill={t.emerald} />
      <text x="164" y="302" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.emeraldInk}>
        SINTER A B
      </text>
      <text x="164" y="320" fontSize="10.5" fill={t.ink}>
        Mutual friends / tags
      </text>
      <text x="164" y="338" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        SINTERCARD 2 A B
      </text>
      <text x="164" y="354" fontFamily={MONO} fontSize="9.5" fill={t.emeraldInk}>
        LIMIT 50 (early stop)
      </text>

      {/* SUNION */}
      <rect x="302" y="272" width="256" height="98" rx="6" fill={t.panelAlt} stroke={t.border} />
      <circle cx="362" cy="321" r="28" fill={t.amberBg} stroke={t.amber} strokeWidth="1.6" />
      <circle cx="392" cy="321" r="28" fill={t.amberBg} stroke={t.amber} strokeWidth="1.6" />
      <text x="434" y="302" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.amberInk}>
        SUNION A B
      </text>
      <text x="434" y="320" fontSize="10.5" fill={t.ink}>
        Merge unique roles
      </text>
      <text x="434" y="338" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        SUNIONSTORE dest A B
      </text>
      <text x="434" y="354" fontFamily={MONO} fontSize="9.5" fill={t.amberInk}>
        Deduplicates in RAM
      </text>

      {/* SDIFF */}
      <rect x="574" y="272" width="276" height="98" rx="6" fill={t.panelAlt} stroke={t.border} />
      <CalloutBadge x={592} y={292} glyph="③" fill={t.redBg} stroke={t.redBorder} ink={t.redInk} />
      <circle cx="634" cy="328" r="26" fill={t.redBg} stroke={t.red} strokeWidth="1.8" />
      <circle cx="662" cy="328" r="26" fill={t.panel} stroke={t.borderStrong} strokeWidth="1.4" />
      <text x="702" y="300" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.redInk}>
        SDIFF A B
      </text>
      <text x="702" y="318" fontSize="10.5" fill={t.ink}>
        In A but NOT in B
      </text>
      <text x="702" y="336" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        intset: sorted int16/32/64
      </text>
      <text x="702" y="354" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        SISMEMBER / SMISMEMBER O(1)
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r04: Sorted Set (ZSet) Dual Structure: Dict O(1) + Multi-Level SkipList O(log N)
 * ========================================================================== */
const R04ZSetDualStructure: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r04"
      code="REDIS·04"
      title="Sorted Set (ZSet) Dual Engine: Hash Dict O(1) + SkipList O(log N)"
      subtitle="ZSCORE O(1) · ZRANGEBYSCORE O(log N + M) · Span Rank"
      isLight={isLight}
      className={className}
    >
      {/* Left Panel: Dict member -> score */}
      <rect x="16" y="58" width="248" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.purpleBg} stroke={t.purpleBorder} ink={t.purpleInk} />
      <text x="54" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        1. Hash Dict (O(1) Score)
      </text>
      <text x="30" y="102" fontFamily={MONO} fontSize="10" fill={t.muted}>
        ZSCORE lb:s1 &quot;linh&quot; -&gt; 2450
      </text>

      {[
        { m: '"an"', s: '1200' },
        { m: '"binh"', s: '1850' },
        { m: '"linh"', s: '2450' },
        { m: '"minh"', s: '3100' },
      ].map((row, idx) => {
        const y = 118 + idx * 46;
        return (
          <g key={idx}>
            <rect x="30" y={y} width="220" height="36" rx="5" fill={t.purpleBg} stroke={t.purpleBorder} />
            <text x="42" y={y + 22} fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.purpleInk}>
              {row.m}
            </text>
            <text x="238" y={y + 22} textAnchor="end" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.ink}>
              -&gt; {row.s}
            </text>
          </g>
        );
      })}

      <rect x="30" y="308" width="220" height="62" rx="6" fill={t.codeBg} stroke={t.border} />
      <text x="40" y="328" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.emerald}>
        Shared SDS String Pointers!
      </text>
      <text x="40" y="345" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Dict &amp; SkipList point to the
      </text>
      <text x="40" y="360" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        same robj/SDS (no duplicate)
      </text>

      {/* Right Panel: Multi-level zskiplist */}
      <rect x="278" y="58" width="586" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={298} y={78} glyph="②" fill={t.emeraldBg} stroke={t.emeraldBorder} ink={t.emeraldInk} />
      <text x="316" y="82" fontSize="12.5" fontWeight="700" fill={t.ink}>
        2. Multi-Level zskiplist (Ordered by Score + Lexicographical Tie-Break)
      </text>

      {/* Columns for HEADER, an(1200), binh(1850), linh(2450), minh(3100) */}
      {/* L3 Express Lane: HEADER -> linh(2450) */}
      <rect x="296" y="114" width="76" height="30" rx="4" fill={t.redBg} stroke={t.redBorder} />
      <text x="334" y="133" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>L3 span=3</text>
      <line x1="372" y1="129" x2="626" y2="129" stroke={t.red} strokeWidth="2" markerEnd="url(#r04-arr-red)" />
      <rect x="630" y="114" width="96" height="30" rx="4" fill={t.redBg} stroke={t.redBorder} />
      <text x="678" y="133" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>L3 express</text>

      {/* L2 Express Lane: HEADER -> binh(1850) -> minh(3100) */}
      <rect x="296" y="158" width="76" height="30" rx="4" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="334" y="177" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.amberInk}>L2 span=2</text>
      <line x1="372" y1="173" x2="504" y2="173" stroke={t.amber} strokeWidth="1.8" markerEnd="url(#r04-arr-amber)" />
      <rect x="508" y="158" width="96" height="30" rx="4" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="556" y="177" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.amberInk}>L2 span=2</text>
      <line x1="604" y1="173" x2="748" y2="173" stroke={t.amber} strokeWidth="1.8" markerEnd="url(#r04-arr-amber)" />
      <rect x="752" y="158" width="96" height="30" rx="4" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="800" y="177" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.amberInk}>L2 tail</text>

      {/* L1 Base Level: HEADER -> an -> binh -> linh -> minh */}
      {[
        { x: 296, w: 76, title: 'HEAD', score: '-inf', bg: t.panelAlt, bd: t.borderStrong, ink: t.ink },
        { x: 392, w: 94, title: '"an"', score: '1200', bg: t.blueBg, bd: t.blueBorder, ink: t.blueInk },
        { x: 508, w: 96, title: '"binh"', score: '1850', bg: t.blueBg, bd: t.blueBorder, ink: t.blueInk },
        { x: 630, w: 96, title: '"linh"', score: '2450', bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
        { x: 752, w: 96, title: '"minh"', score: '3100', bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
      ].map((n, idx, arr) => (
        <g key={idx}>
          <rect x={n.x} y={204} width={n.w} height="58" rx="6" fill={n.bg} stroke={n.bd} strokeWidth="1.5" />
          <text x={n.x + n.w / 2} y={226} textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="700" fill={n.ink}>
            {n.title}
          </text>
          <text x={n.x + n.w / 2} y={246} textAnchor="middle" fontFamily={MONO} fontSize="10" fill={t.muted}>
            {n.score}
          </text>
          {idx < arr.length - 1 && (
            <line
              x1={n.x + n.w}
              y1={233}
              x2={arr[idx + 1].x - 2}
              y2={233}
              stroke={t.blue}
              strokeWidth="1.6"
              markerEnd="url(#r04-arr-blue)"
            />
          )}
        </g>
      ))}

      {/* Vertical towers */}
      <line x1="334" y1="144" x2="334" y2="158" stroke={t.borderStrong} strokeDasharray="3 2" />
      <line x1="334" y1="188" x2="334" y2="204" stroke={t.borderStrong} strokeDasharray="3 2" />
      <line x1="556" y1="188" x2="556" y2="204" stroke={t.amber} strokeDasharray="3 2" />
      <line x1="678" y1="144" x2="678" y2="204" stroke={t.red} strokeDasharray="3 2" />
      <line x1="800" y1="188" x2="800" y2="204" stroke={t.amber} strokeDasharray="3 2" />

      {/* Range highlight & Callout 3 */}
      <rect x="296" y="282" width="552" height="88" rx="7" fill={t.panelAlt} stroke={t.border} />
      <CalloutBadge x={316} y={304} glyph="③" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="334" y="308" fontSize="11.5" fontWeight="700" fill={t.ink}>
        Why SkipList Instead of Balanced Red-Black Tree?
      </text>
      <text x="316" y="330" fontFamily={MONO} fontSize="10" fill={t.ink}>
        • Range scan (ZRANGE 2000 3500 BYSCORE): Jump L3-&gt;linh(2450), walk L1 pointers O(log N + M)
      </text>
      <text x="316" y="348" fontFamily={MONO} fontSize="10" fill={t.ink}>
        • ZRANK / ZREVRANK O(log N): Sum level `span` counters along express path!
      </text>
      <text x="316" y="364" fontFamily={MONO} fontSize="10" fill={t.emeraldInk}>
        • Simpler pointer updates than tree rotations &amp; backward pointer supports REV scans
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r05: Probabilistic & Geo Anatomy: Bitmap, HLL 12KB, Bloom Filter, GeoHash
 * ========================================================================== */
const R05ProbabilisticAndGeo: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r05"
      code="REDIS·05"
      title="Massive-Scale Compact Structures: Bitmap · HLL · Bloom · GeoHash"
      subtitle="100M Users in MBs/KBs · Redis 8 Native Bloom · 52-bit Z-Curve"
      isLight={isLight}
      className={className}
    >
      {/* Quadrant 1: Bitmap */}
      <rect x="16" y="58" width="418" height="156" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="54" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Bitmap: Exact Daily Active Flags (1 bit / userId)
      </text>
      <text x="30" y="102" fontFamily={MONO} fontSize="10" fill={t.blueInk}>
        SETBIT dau:2026-11-14 7 1   ·   BITCOUNT / BITOP AND
      </text>

      {[1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1].map((bit, i) => {
        const x = 30 + i * 32;
        const active = bit === 1;
        return (
          <g key={i}>
            <rect x={x} y={114} width="28" height="34" rx="4" fill={active ? t.blueBg : t.panelAlt} stroke={active ? t.blue : t.border} />
            <text x={x + 14} y={136} textAnchor="middle" fontFamily={MONO} fontSize="12" fontWeight="700" fill={active ? t.blueInk : t.muted}>
              {bit}
            </text>
            <text x={x + 14} y={162} textAnchor="middle" fontFamily={MONO} fontSize="8.5" fill={t.muted}>
              u{i}
            </text>
          </g>
        );
      })}
      <text x="30" y="198" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        100,000,000 users = 12.5 MB exact (vs ~4 GB Set!)
      </text>

      {/* Quadrant 2: HyperLogLog */}
      <rect x="446" y="58" width="418" height="156" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={466} y={78} glyph="②" fill={t.purpleBg} stroke={t.purpleBorder} ink={t.purpleInk} />
      <text x="484" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        HyperLogLog: Unique Cardinality in Max 12 KB
      </text>
      <text x="460" y="102" fontFamily={MONO} fontSize="10" fill={t.purpleInk}>
        PFADD uv:home &quot;ip_92&quot;  ·  PFCOUNT  ·  PFMERGE
      </text>

      <rect x="460" y="114" width="144" height="52" rx="6" fill={t.purpleBg} stroke={t.purpleBorder} />
      <text x="532" y="135" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.purpleInk}>
        64-bit MurmurHash
      </text>
      <text x="532" y="153" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        14b idx | 50b rho(0001..)
      </text>
      <line x1="604" y1="140" x2="636" y2="140" stroke={t.purple} strokeWidth="1.6" markerEnd="url(#r05-arr-purple)" />

      <rect x="640" y="114" width="208" height="52" rx="6" fill={t.codeBg} stroke={t.purpleBorder} />
      <text x="744" y="135" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.codeInk}>
        16,384 x 6-bit Registers
      </text>
      <text x="744" y="153" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={t.emerald}>
        Fixed 12 KB · StdErr 0.81%
      </text>
      <text x="460" y="198" fontFamily={MONO} fontSize="10" fill={t.muted}>
        Counts billions of unique visitors without storing elements
      </text>

      {/* Quadrant 3: Bloom Filter */}
      <rect x="16" y="226" width="418" height="158" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={246} glyph="③" fill={t.amberBg} stroke={t.amberBorder} ink={t.amberInk} />
      <text x="54" y="250" fontSize="12" fontWeight="700" fill={t.ink}>
        Bloom Filter (Redis 8 Native): Cache Penetration Guard
      </text>

      <rect x="30" y="270" width="92" height="44" rx="6" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="76" y="289" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.amberInk}>
        BF.EXISTS
      </text>
      <text x="76" y="305" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        &quot;sku:991&quot;
      </text>

      {/* k=3 hash arrows to bit array */}
      <line x1="122" y1="282" x2="180" y2="274" stroke={t.amber} strokeWidth="1.4" markerEnd="url(#r05-arr-amber)" />
      <line x1="122" y1="292" x2="236" y2="274" stroke={t.amber} strokeWidth="1.4" markerEnd="url(#r05-arr-amber)" />
      <line x1="122" y1="302" x2="320" y2="274" stroke={t.amber} strokeWidth="1.4" markerEnd="url(#r05-arr-amber)" />

      {[0, 1, 1, 0, 1, 0, 0, 1, 1].map((b, idx) => {
        const x = 166 + idx * 28;
        const hit = idx === 1 || idx === 3 || idx === 6;
        return (
          <rect
            key={idx}
            x={x}
            y={278}
            width="24"
            height="30"
            rx="3"
            fill={hit ? t.amberBg : b ? t.emeraldBg : t.panelAlt}
            stroke={hit ? t.amber : t.border}
          />
        );
      })}
      <text x="140" y="268" fontFamily={MONO} fontSize="9" fill={t.amberInk}>h1, h2, h3</text>

      <text x="30" y="340" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        0 bit -&gt; 100% DEFINITELY NOT IN DB (Block junk SQL!)
      </text>
      <text x="30" y="362" fontFamily={MONO} fontSize="10" fill={t.redInk}>
        All 1s -&gt; Probably exists (~1% tunable false positive)
      </text>

      {/* Quadrant 4: GeoHash Z-Order Curve */}
      <rect x="446" y="226" width="418" height="158" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={466} y={246} glyph="④" fill={t.emeraldBg} stroke={t.emeraldBorder} ink={t.emeraldInk} />
      <text x="484" y="250" fontSize="12" fontWeight="700" fill={t.ink}>
        Geo Spatial: 52-Bit GeoHash Stored Inside ZSet Score
      </text>

      {/* 2D Grid with Z-order curve */}
      <rect x="462" y="266" width="104" height="96" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <line x1="514" y1="266" x2="514" y2="362" stroke={t.emeraldBorder} strokeDasharray="3 2" />
      <line x1="462" y1="314" x2="566" y2="314" stroke={t.emeraldBorder} strokeDasharray="3 2" />
      {/* Z-order path */}
      <polyline
        points="488,290 540,290 488,338 540,338"
        fill="none"
        stroke={t.emerald}
        strokeWidth="2.2"
      />
      <circle cx="514" cy="314" r="28" fill="none" stroke={t.red} strokeWidth="1.5" strokeDasharray="4 2" />
      <circle cx="514" cy="314" r="4" fill={t.red} />

      <text x="582" y="286" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.ink}>
        (lon, lat) -&gt; Interleave bits
      </text>
      <text x="582" y="306" fontFamily={MONO} fontSize="10" fill={t.emeraldInk}>
        52-bit int -&gt; ZSet IEEE754 score
      </text>
      <text x="582" y="328" fontFamily={MONO} fontSize="10" fill={t.ink}>
        GEOSEARCH drivers FROMLONLAT
      </text>
      <text x="582" y="346" fontFamily={MONO} fontSize="10" fill={t.blueInk}>
        BYRADIUS 3 km ASC COUNT 10
      </text>
      <text x="582" y="366" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Scans 9 neighbor GeoHash boxes
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r06: Sequential 50xRTT vs Pipelining Single Flight vs MULTI/EXEC + WATCH
 * ========================================================================== */
const R06PipeliningAndWatch: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r06"
      code="REDIS·06"
      title="RTT Amortization (Pipelining) & Optimistic Locking (WATCH + MULTI/EXEC)"
      subtitle="50x RTT vs 1x Batch Flight · CAS Check-and-Set"
      isLight={isLight}
      className={className}
    >
      {/* Col 1: Sequential 50x RTT */}
      <rect x="16" y="58" width="268" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.redBg} stroke={t.redBorder} ink={t.redInk} />
      <text x="54" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Sequential: N x RTT Stall
      </text>

      <line x1="66" y1="106" x2="66" y2="306" stroke={t.borderStrong} strokeWidth="2" />
      <line x1="230" y1="106" x2="230" y2="306" stroke={t.borderStrong} strokeWidth="2" />
      <text x="66" y="100" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.ink}>App</text>
      <text x="230" y="100" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>Redis</text>

      {[0, 1, 2].map((i) => {
        const y = 120 + i * 60;
        return (
          <g key={i}>
            <line x1="68" y1={y} x2="226" y2={y + 18} stroke={t.red} strokeWidth="1.5" markerEnd="url(#r06-arr-red)" />
            <text x="148" y={y + 5} textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.redInk}>
              CMD #{i + 1} (0.5ms)
            </text>
            <line x1="226" y1={y + 24} x2="68" y2={y + 42} stroke={t.borderStrong} strokeWidth="1.4" markerEnd="url(#r06-arr)" />
            <text x="148" y={y + 44} textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>
              Reply #{i + 1}
            </text>
          </g>
        );
      })}

      <rect x="28" y="316" width="244" height="54" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="150" y="336" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.redInk}>
        50 cmds x 1ms RTT = 50 ms!
      </text>
      <text x="150" y="354" textAnchor="middle" fontSize="10" fill={t.muted}>
        99.8% time wasted waiting on TCP
      </text>

      {/* Col 2: Pipelining Single Flight */}
      <rect x="298" y="58" width="272" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={318} y={78} glyph="②" fill={t.emeraldBg} stroke={t.emeraldBorder} ink={t.emeraldInk} />
      <text x="336" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Pipelining: 1x RTT Burst
      </text>

      <line x1="348" y1="106" x2="348" y2="306" stroke={t.borderStrong} strokeWidth="2" />
      <line x1="518" y1="106" x2="518" y2="306" stroke={t.borderStrong} strokeWidth="2" />
      <text x="348" y="100" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.ink}>App Buffer</text>
      <text x="518" y="100" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>Redis</text>

      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="350"
          y1={122 + i * 16}
          x2="514"
          y2={144 + i * 16}
          stroke={t.emerald}
          strokeWidth="1.6"
          markerEnd="url(#r06-arr-green)"
        />
      ))}
      <text x="432" y="122" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.emeraldInk}>
        Write 50 cmds in 1 syscall
      </text>

      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="514"
          y1={220 + i * 16}
          x2="350"
          y2={242 + i * 16}
          stroke={t.blue}
          strokeWidth="1.5"
          markerEnd="url(#r06-arr-blue)"
        />
      ))}
      <text x="432" y="216" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.blueInk}>
        Read 50 replies in 1 batch
      </text>

      <rect x="310" y="316" width="248" height="54" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="434" y="336" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.emeraldInk}>
        50 cmds in ~1.1 ms (45x faster!)
      </text>
      <text x="434" y="354" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Note: Not atomic (can interleave)
      </text>

      {/* Col 3: WATCH + MULTI / EXEC */}
      <rect x="584" y="58" width="280" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={604} y={78} glyph="③" fill={t.purpleBg} stroke={t.purpleBorder} ink={t.purpleInk} />
      <text x="622" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        WATCH + MULTI / EXEC (CAS)
      </text>

      {[
        { step: '1. WATCH bal:u1', desc: 'Track key dirty flag', bg: t.purpleBg, bd: t.purpleBorder, ink: t.purpleInk },
        { step: '2. val = GET bal:u1', desc: 'Read outside MULTI', bg: t.blueBg, bd: t.blueBorder, ink: t.blueInk },
        { step: '3. MULTI -> SET ..', desc: 'Queue commands (+QUEUED)', bg: t.amberBg, bd: t.amberBorder, ink: t.amberInk },
        { step: '4. EXEC', desc: 'Check REDIS_DIRTY_CAS', bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
      ].map((s, idx) => {
        const y = 100 + idx * 46;
        return (
          <g key={idx}>
            <rect x="598" y={y} width="252" height="36" rx="5" fill={s.bg} stroke={s.bd} />
            <text x="608" y={y + 22} fontFamily={MONO} fontSize="10" fontWeight="700" fill={s.ink}>
              {s.step}
            </text>
            <text x="840" y={y + 22} textAnchor="end" fontSize="9.5" fill={t.muted}>
              {s.desc}
            </text>
          </g>
        );
      })}

      <rect x="598" y="290" width="252" height="80" rx="6" fill={t.codeBg} stroke={t.redBorder} />
      <text x="608" y="310" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emerald}>
        Unmodified -&gt; Atomic Batch Commit
      </text>
      <text x="608" y="328" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.red}>
        Modified by Peer -&gt; EXEC = (nil)
      </text>
      <text x="608" y="348" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        No SQL Rollback on runtime type err!
      </text>
      <text x="608" y="363" fontFamily={MONO} fontSize="9.5" fill={t.amber}>
        Prefer Lua EVAL for zero-retry CAS
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r07: Atomic Lua EVAL / EVALSHA & Check-and-Del Token Guard
 * ========================================================================== */
const R07AtomicLuaEngine: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r07"
      code="REDIS·07"
      title="Embedded Lua 5.1 Atomic Sandbox (EVALSHA) & Check-and-Act Guard"
      subtitle="SHA1 Script Cache · Zero Race Window · KEYS[] vs ARGV[]"
      isLight={isLight}
      className={className}
    >
      {/* Left: SHA1 EVALSHA Pipeline */}
      <rect x="16" y="58" width="356" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="54" y="82" fontSize="12.5" fontWeight="700" fill={t.ink}>
        EVALSHA Bandwidth Optimization
      </text>

      <rect x="30" y="102" width="328" height="62" rx="6" fill={t.blueBg} stroke={t.blueBorder} />
      <text x="42" y="123" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.blueInk}>
        Client: EVALSHA &quot;a42059b3...&quot; 1 lock:9 uuid_7
      </text>
      <text x="42" y="143" fontSize="10.5" fill={t.ink}>
        Sends 40-byte SHA1 digest instead of 2 KB Lua source
      </text>
      <text x="42" y="157" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Fallback on -NOSCRIPT -&gt; send full EVAL once
      </text>

      <line x1="194" y1="164" x2="194" y2="194" stroke={t.blue} strokeWidth="1.6" markerEnd="url(#r07-arr-blue)" />

      <rect x="30" y="198" width="328" height="84" rx="6" fill={t.purpleBg} stroke={t.purpleBorder} />
      <CalloutBadge x={48} y={218} glyph="②" fill={t.purple} stroke={t.purpleBorder} ink="#ffffff" />
      <text x="68" y="222" fontSize="11.5" fontWeight="700" fill={t.purpleInk}>
        Main Thread Lua VM Execution Lock
      </text>
      <text x="42" y="244" fontFamily={MONO} fontSize="10" fill={t.ink}>
        Other clients wait in epoll queue until script returns!
      </text>
      <text x="42" y="264" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        READ + BRANCH + WRITE = 1 Indivisible Step
      </text>

      <rect x="30" y="296" width="328" height="74" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="42" y="316" fontSize="11" fontWeight="700" fill={t.redInk}>
        Golden Rules for Production Lua
      </text>
      <text x="42" y="334" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        1. Pass ALL key names via KEYS[] (Cluster slot check!)
      </text>
      <text x="42" y="350" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        2. Keep execution &lt; 1ms (lua-time-limit 5000ms)
      </text>
      <text x="42" y="365" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        3. Redis 7+ Functions: FUNCTION LOAD (replicated!)
      </text>

      {/* Right: Atomic Check-and-Set / Lock Release Anatomy */}
      <rect x="386" y="58" width="478" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={406} y={78} glyph="③" fill={t.emeraldBg} stroke={t.emeraldBorder} ink={t.emeraldInk} />
      <text x="424" y="82" fontSize="12.5" fontWeight="700" fill={t.ink}>
        Atomic Lua Pattern: Token-Verified Lock Release &amp; Stock Deduct
      </text>

      {/* Code Block */}
      <rect x="402" y="100" width="446" height="148" rx="7" fill={t.codeBg} stroke={t.borderStrong} />
      <text x="416" y="122" fontFamily={MONO} fontSize="10.5" fill={t.subtle}>
        -- KEYS[1] = lock_key, ARGV[1] = caller_uuid
      </text>
      <text x="416" y="142" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.cyan}>
        if redis.call(&apos;GET&apos;, KEYS[1]) == ARGV[1] then
      </text>
      <text x="416" y="162" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.emerald}>
        {'  '}return redis.call(&apos;DEL&apos;, KEYS[1]) -- 1 (safe!)
      </text>
      <text x="416" y="182" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.cyan}>
        else
      </text>
      <text x="416" y="202" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.amber}>
        {'  '}return 0 -- token mismatch: DO NOT delete peer lock!
      </text>
      <text x="416" y="222" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.cyan}>
        end
      </text>

      {/* Comparison: App-side TOCTOU vs Server-side Lua */}
      <rect x="402" y="262" width="214" height="108" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="414" y="282" fontSize="11" fontWeight="700" fill={t.redInk}>
        Anti-Pattern: App GET + DEL
      </text>
      <text x="414" y="302" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        t1: Worker A GETs own token
      </text>
      <text x="414" y="319" fontFamily={MONO} fontSize="9.5" fill={t.redInk}>
        t2: GC Pause! TTL expires -&gt; B locks
      </text>
      <text x="414" y="336" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        t3: Worker A DELs Worker B&apos;s lock!
      </text>
      <text x="414" y="354" fontSize="9.5" fill={t.muted}>
        Classic TOCTOU race condition
      </text>

      <rect x="630" y="262" width="218" height="108" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="642" y="282" fontSize="11" fontWeight="700" fill={t.emeraldInk}>
        Safe Pattern: Lua Atomic Guard
      </text>
      <text x="642" y="302" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        GET &amp; DEL execute back-to-back
      </text>
      <text x="642" y="319" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        inside single-threaded core.
      </text>
      <text x="642" y="336" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.emeraldInk}>
        Zero interleaving commands!
      </text>
      <text x="642" y="354" fontSize="9.5" fill={t.muted}>
        Same principle for Flash-Sale stock
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r08: Pub/Sub Fire-and-Forget vs Redis Streams (Consumer Group + PEL + XACK)
 * ========================================================================== */
const R08PubSubVsStreams: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r08"
      code="REDIS·08"
      title="Ephemeral Pub/Sub vs Durable Redis Streams (Consumer Groups & PEL)"
      subtitle="PUBLISH Fire-and-Forget vs XADD · XREADGROUP · XACK · XAUTOCLAIM"
      isLight={isLight}
      className={className}
    >
      {/* Top Band: Ephemeral Pub/Sub */}
      <rect x="16" y="58" width="848" height="114" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.amberBg} stroke={t.amberBorder} ink={t.amberInk} />
      <text x="54" y="82" fontSize="12.5" fontWeight="700" fill={t.ink}>
        Pub/Sub: In-Memory Fan-Out Socket Push (At-Most-Once, Zero Persistence)
      </text>

      <rect x="32" y="102" width="144" height="52" rx="6" fill={t.blueBg} stroke={t.blueBorder} />
      <text x="104" y="124" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.blueInk}>
        PUBLISH chat:1
      </text>
      <text x="104" y="142" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        &quot;hello&quot;
      </text>
      <line x1="176" y1="128" x2="226" y2="128" stroke={t.blue} strokeWidth="1.6" markerEnd="url(#r08-arr-blue)" />

      <rect x="230" y="102" width="156" height="52" rx="6" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="308" y="124" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.amberInk}>
        Channel Dict
      </text>
      <text x="308" y="142" textAnchor="middle" fontSize="10" fill={t.muted}>
        No log · No replay
      </text>

      <line x1="386" y1="116" x2="454" y2="112" stroke={t.emerald} strokeWidth="1.6" markerEnd="url(#r08-arr-green)" />
      <line x1="386" y1="140" x2="454" y2="144" stroke={t.red} strokeWidth="1.6" strokeDasharray="4 3" markerEnd="url(#r08-arr-red)" />

      <rect x="458" y="96" width="184" height="30" rx="5" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="550" y="115" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        Sub A (Online) -&gt; Delivered
      </text>

      <rect x="458" y="132" width="184" height="30" rx="5" fill={t.redBg} stroke={t.redBorder} />
      <text x="550" y="151" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>
        Sub B (Reconnecting) -&gt; LOST!
      </text>

      <rect x="658" y="96" width="192" height="66" rx="6" fill={t.panelAlt} stroke={t.border} />
      <text x="670" y="116" fontSize="10.5" fontWeight="700" fill={t.ink}>
        Good for:
      </text>
      <text x="670" y="133" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • Live presence / SSE fanout
      </text>
      <text x="670" y="149" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • L1 cache invalidation ping
      </text>

      {/* Bottom Band: Redis Streams */}
      <rect x="16" y="184" width="848" height="200" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={204} glyph="②" fill={t.emeraldBg} stroke={t.emeraldBorder} ink={t.emeraldInk} />
      <text x="54" y="208" fontSize="12.5" fontWeight="700" fill={t.ink}>
        Redis Streams: Append-Only Radix Tree Log + Consumer Group PEL + Crash Recovery
      </text>

      {/* XADD Log */}
      <rect x="32" y="228" width="232" height="94" rx="7" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="44" y="248" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.emeraldInk}>
        XADD orders MAXLEN ~ 10000 *
      </text>
      <rect x="44" y="258" width="208" height="24" rx="4" fill={t.panel} stroke={t.emeraldBorder} />
      <text x="148" y="274" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        1731542001-0 | orderId=901
      </text>
      <rect x="44" y="288" width="208" height="24" rx="4" fill={t.panel} stroke={t.emeraldBorder} />
      <text x="148" y="304" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        1731542005-0 | orderId=902
      </text>

      <line x1="264" y1="275" x2="306" y2="275" stroke={t.emerald} strokeWidth="1.8" markerEnd="url(#r08-arr-green)" />

      {/* Consumer Group */}
      <rect x="310" y="228" width="246" height="94" rx="7" fill={t.blueBg} stroke={t.blueBorder} />
      <text x="322" y="248" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.blueInk}>
        XREADGROUP GROUP pay_cg &gt;
      </text>
      <rect x="322" y="258" width="222" height="24" rx="4" fill={t.panel} stroke={t.blueBorder} />
      <text x="433" y="274" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        worker-1 gets 1731542001-0
      </text>
      <rect x="322" y="288" width="222" height="24" rx="4" fill={t.panel} stroke={t.redBorder} />
      <text x="433" y="304" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        worker-2 gets 902 -&gt; CRASHES!
      </text>

      <line x1="556" y1="275" x2="598" y2="275" stroke={t.purple} strokeWidth="1.8" markerEnd="url(#r08-arr-purple)" />

      {/* PEL + XACK / XAUTOCLAIM */}
      <rect x="602" y="228" width="248" height="142" rx="7" fill={t.purpleBg} stroke={t.purpleBorder} />
      <CalloutBadge x={622} y={248} glyph="③" fill={t.purple} stroke={t.purpleBorder} ink="#ffffff" />
      <text x="642" y="252" fontSize="11.5" fontWeight="700" fill={t.purpleInk}>
        Pending Entries List (PEL)
      </text>
      <text x="614" y="274" fontFamily={MONO} fontSize="9.5" fill={t.emeraldInk}>
        • worker-1 -&gt; XACK orders pay_cg ..1-0
      </text>
      <text x="614" y="292" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        {'  '}(Removed from PEL)
      </text>
      <text x="614" y="314" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.amberInk}>
        • Idle &gt; 30s -&gt; XAUTOCLAIM
      </text>
      <text x="614" y="332" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        {'  '}worker-1 steals 902 &amp; retries!
      </text>
      <text x="614" y="354" fontFamily={MONO} fontSize="9.5" fill={t.redInk}>
        • delivery_count &gt; 5 -&gt; Route DLQ
      </text>

      <text x="32" y="348" fontFamily={MONO} fontSize="10" fill={t.ink}>
        Persisted in RDB &amp; AOF · Replicated to Replicas · Partitioned across workers
      </text>
      <text x="32" y="368" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.amberInk}>
        Always bound stream memory with MAXLEN ~ N or MINID ~ &lt;ts&gt;!
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r09: Caching Topologies: Cache-Aside vs Write-Through vs Write-Behind
 * ========================================================================== */
const R09CachingTopologies: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r09"
      code="REDIS·09"
      title="Production Caching Topologies: Cache-Aside · Write-Through · Write-Behind"
      subtitle="Consistency vs Write Latency vs Crash Durability"
      isLight={isLight}
      className={className}
    >
      {/* Col 1: Cache-Aside */}
      <rect x="16" y="58" width="272" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.emeraldBg} stroke={t.emeraldBorder} ink={t.emeraldInk} />
      <text x="54" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Cache-Aside (Lazy Loading)
      </text>

      <rect x="96" y="102" width="112" height="32" rx="6" fill={t.blueBg} stroke={t.blueBorder} />
      <text x="152" y="122" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.blueInk}>App Service</text>

      <line x1="126" y1="134" x2="84" y2="178" stroke={t.emerald} strokeWidth="1.6" markerEnd="url(#r09-arr-green)" />
      <line x1="178" y1="134" x2="220" y2="178" stroke={t.amber} strokeWidth="1.6" markerEnd="url(#r09-arr-amber)" />

      <rect x="30" y="182" width="108" height="44" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="84" y="201" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>Redis Cache</text>
      <text x="84" y="217" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>1. GET / 3. SET</text>

      <rect x="166" y="182" width="108" height="44" rx="6" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="220" y="201" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.amberInk}>Primary DB</text>
      <text x="220" y="217" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>2. Read on Miss</text>

      <rect x="28" y="242" width="248" height="128" rx="6" fill={t.panelAlt} stroke={t.border} />
      <text x="38" y="262" fontSize="10.5" fontWeight="700" fill={t.emeraldInk}>
        Write Path: Update DB -&gt; DEL Cache!
      </text>
      <text x="38" y="281" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • Why DEL instead of SET? Avoids
      </text>
      <text x="38" y="296" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        {'  '}concurrent write-order staleness
      </text>
      <text x="38" y="316" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • Resilient if Redis restarts
      </text>
      <text x="38" y="334" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • Cold-miss penalty on first read
      </text>
      <text x="38" y="354" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.blueInk}>
        90% of microservice workloads
      </text>

      {/* Col 2: Write-Through */}
      <rect x="302" y="58" width="276" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={322} y={78} glyph="②" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="340" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Write-Through (Sync Dual)
      </text>

      <rect x="318" y="114" width="70" height="40" rx="6" fill={t.blueBg} stroke={t.blueBorder} />
      <text x="353" y="138" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.blueInk}>App</text>
      <line x1="388" y1="134" x2="412" y2="134" stroke={t.blue} strokeWidth="1.6" markerEnd="url(#r09-arr-blue)" />

      <rect x="416" y="114" width="72" height="40" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="452" y="138" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>Redis</text>
      <line x1="488" y1="134" x2="512" y2="134" stroke={t.red} strokeWidth="1.6" markerEnd="url(#r09-arr-red)" />

      <rect x="516" y="114" width="50" height="40" rx="6" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="541" y="138" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.amberInk}>SQL</text>

      <text x="440" y="180" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.blueInk}>
        Sync Commit: Cache + DB in 1 call
      </text>
      <text x="440" y="200" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        ACK returned only after SQL commit
      </text>

      <rect x="316" y="242" width="248" height="128" rx="6" fill={t.panelAlt} stroke={t.border} />
      <text x="326" y="262" fontSize="10.5" fontWeight="700" fill={t.blueInk}>
        Trade-offs:
      </text>
      <text x="326" y="282" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        + Cache is ALWAYS warm &amp; fresh
      </text>
      <text x="326" y="300" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        + Zero stale-read window
      </text>
      <text x="326" y="320" fontFamily={MONO} fontSize="9.5" fill={t.redInk}>
        - Slower writes (Redis + SQL RTT)
      </text>
      <text x="326" y="338" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        - Caches cold data never read again
      </text>
      <text x="326" y="356" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.amberInk}>
        Combine w/ TTL or LFU eviction!
      </text>

      {/* Col 3: Write-Behind */}
      <rect x="592" y="58" width="272" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={612} y={78} glyph="③" fill={t.purpleBg} stroke={t.purpleBorder} ink={t.purpleInk} />
      <text x="630" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Write-Behind (Async Batch)
      </text>

      <rect x="606" y="114" width="64" height="40" rx="6" fill={t.blueBg} stroke={t.blueBorder} />
      <text x="638" y="138" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.blueInk}>App</text>
      <line x1="670" y1="134" x2="692" y2="134" stroke={t.emerald} strokeWidth="1.6" markerEnd="url(#r09-arr-green)" />

      <rect x="696" y="108" width="80" height="52" rx="6" fill={t.purpleBg} stroke={t.purpleBorder} />
      <text x="736" y="130" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.purpleInk}>Redis +</text>
      <text x="736" y="146" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.purpleInk}>Stream</text>

      <line x1="776" y1="134" x2="800" y2="134" stroke={t.purple} strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#r09-arr-purple)" />
      <rect x="804" y="114" width="48" height="40" rx="6" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="828" y="138" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.amberInk}>SQL</text>

      <text x="728" y="182" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        Instant 0.2ms ACK to Client!
      </text>
      <text x="728" y="200" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Async Worker flushes SQL batches
      </text>

      <rect x="606" y="242" width="244" height="128" rx="6" fill={t.panelAlt} stroke={t.border} />
      <text x="616" y="262" fontSize="10.5" fontWeight="700" fill={t.purpleInk}>
        High-Throughput Write Absorber:
      </text>
      <text x="616" y="282" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        + 100k likes/views coalesced into
      </text>
      <text x="616" y="298" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        {'  '}1 bulk SQL upsert every 2s
      </text>
      <text x="616" y="320" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        ! Risk: Data loss if Redis dies
      </text>
      <text x="616" y="338" fontFamily={MONO} fontSize="9.5" fill={t.redInk}>
        {'  '}before worker flushes AOF/Stream
      </text>
      <text x="616" y="356" fontFamily={MONO} fontSize="9.5" fill={t.emeraldInk}>
        Use AOF everysec + Streams PEL
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r10: 3 Production Cache Disasters & Shields: Stampede, Penetration, Avalanche
 * ========================================================================== */
const R10CacheDisasters: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r10"
      code="REDIS·10"
      title="Three Production Cache Disasters & Battle-Tested Defense Shields"
      subtitle="Stampede (Hot Key) · Penetration (Ghost Key) · Avalanche (Mass TTL)"
      isLight={isLight}
      className={className}
    >
      {/* Col 1: Stampede */}
      <rect x="16" y="58" width="272" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.redBg} stroke={t.redBorder} ink={t.redInk} />
      <text x="54" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        1. Cache Stampede (Breakdown)
      </text>

      <rect x="28" y="100" width="248" height="92" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="38" y="120" fontSize="10.5" fontWeight="700" fill={t.redInk}>
        Disaster: 1 Hot Key Expires at t=0
      </text>
      <text x="38" y="140" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        10,000 reqs miss `flash:iphone`
      </text>
      <text x="38" y="158" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        simultaneously -&gt; 10,000 heavy
      </text>
      <text x="38" y="176" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        SQL queries crush DB pool!
      </text>

      <line x1="152" y1="192" x2="152" y2="218" stroke={t.emerald} strokeWidth="1.8" markerEnd="url(#r10-arr-green)" />

      <rect x="28" y="222" width="248" height="148" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="38" y="242" fontSize="11" fontWeight="700" fill={t.emeraldInk}>
        Shield: Singleflight + Logical TTL
      </text>
      <text x="38" y="264" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • In-process Promise coalescing
      </text>
      <text x="38" y="284" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • Distributed Mutex:
      </text>
      <text x="38" y="301" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.emeraldInk}>
        {'  '}SET lock:k id NX PX 3000
      </text>
      <text x="38" y="321" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • Logical Expiry (SWR): Serve stale
      </text>
      <text x="38" y="338" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        {'  '}value while 1 bg worker refreshes
      </text>
      <text x="38" y="357" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • XFetch probabilistic early recompute
      </text>

      {/* Col 2: Penetration */}
      <rect x="302" y="58" width="276" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={322} y={78} glyph="②" fill={t.amberBg} stroke={t.amberBorder} ink={t.amberInk} />
      <text x="340" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        2. Cache Penetration (Ghost IDs)
      </text>

      <rect x="314" y="100" width="252" height="92" rx="6" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="324" y="120" fontSize="10.5" fontWeight="700" fill={t.amberInk}>
        Disaster: Non-Existent Keys
      </text>
      <text x="324" y="140" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        Attacker scans `user:-1..-999999`
      </text>
      <text x="324" y="158" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        Miss in Redis -&gt; Miss in SQL -&gt;
      </text>
      <text x="324" y="176" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        Nothing cached -&gt; 100% hits SQL!
      </text>

      <line x1="440" y1="192" x2="440" y2="218" stroke={t.emerald} strokeWidth="1.8" markerEnd="url(#r10-arr-green)" />

      <rect x="314" y="222" width="252" height="148" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="324" y="242" fontSize="11" fontWeight="700" fill={t.emeraldInk}>
        Shield: Bloom Filter + Null Sentinel
      </text>
      <text x="324" y="264" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.blueInk}>
        1. BF.EXISTS bf:users &lt;id&gt;
      </text>
      <text x="324" y="282" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        {'   '}0 -&gt; Reject in 0.1ms (No SQL!)
      </text>
      <text x="324" y="304" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.emeraldInk}>
        2. Null-Object Cache w/ Short TTL:
      </text>
      <text x="324" y="322" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        {'   '}SET user:99 &quot;__NULL__&quot; EX 60
      </text>
      <text x="324" y="344" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        3. Strict UUID/int64 validation at
      </text>
      <text x="324" y="359" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        {'   '}API Gateway before cache lookup
      </text>

      {/* Col 3: Avalanche */}
      <rect x="592" y="58" width="272" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={612} y={78} glyph="③" fill={t.purpleBg} stroke={t.purpleBorder} ink={t.purpleInk} />
      <text x="630" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        3. Cache Avalanche (TTL Cliff)
      </text>

      <rect x="604" y="100" width="248" height="92" rx="6" fill={t.purpleBg} stroke={t.purpleBorder} />
      <text x="614" y="120" fontSize="10.5" fontWeight="700" fill={t.purpleInk}>
        Disaster: Synced Batch Warming
      </text>
      <text x="614" y="140" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        500,000 catalog keys loaded at
      </text>
      <text x="614" y="158" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        00:00 with fixed `EX 3600` -&gt; All
      </text>
      <text x="614" y="176" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        expire at 01:00:00 sharp (Cliff!)
      </text>

      <line x1="728" y1="192" x2="728" y2="218" stroke={t.emerald} strokeWidth="1.8" markerEnd="url(#r10-arr-green)" />

      <rect x="604" y="222" width="248" height="148" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="614" y="242" fontSize="11" fontWeight="700" fill={t.emeraldInk}>
        Shield: TTL Jitter + HA + Shedding
      </text>
      <text x="614" y="264" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.emeraldInk}>
        ttl = base + rand(0, base * 0.2)
      </text>
      <text x="614" y="284" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • Spreads expirations smoothly
      </text>
      <text x="614" y="302" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        {'  '}across a 12-minute window
      </text>
      <text x="614" y="322" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • Multi-AZ Redis Cluster / Sentinel
      </text>
      <text x="614" y="340" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        {'  '}(prevents node-down avalanche)
      </text>
      <text x="614" y="358" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • Circuit breaker before SQL DB
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r11: Distributed Lock Race Condition + Safe UUID+Lua Lock & ZSet Rate Limiter
 * ========================================================================== */
const R11LocksAndRateLimiter: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r11"
      code="REDIS·11"
      title="Distributed Mutex Safety (GC Pause + Fencing) & Sliding-Window Rate Limiter"
      subtitle="SET key uuid NX PX · Fencing Token · ZREMRANGEBYSCORE + ZCARD"
      isLight={isLight}
      className={className}
    >
      {/* Left: Distributed Lock Race + Fencing */}
      <rect x="16" y="58" width="434" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.redBg} stroke={t.redBorder} ink={t.redInk} />
      <text x="54" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        GC Pause Lease Expiry &amp; Fencing Token Guard
      </text>

      {/* Timeline */}
      <rect x="30" y="98" width="406" height="134" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="42" y="118" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.ink}>
        t=0s   Client A: SET lock:order uuid_A NX PX 5000 (token #33)
      </text>
      <text x="42" y="138" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>
        t=3s   Client A hits 4s Stop-The-World GC Pause!
      </text>
      <text x="42" y="158" fontFamily={MONO} fontSize="10" fill={t.amberInk}>
        t=5s   TTL expires -&gt; Client B acquires lock (token #34)
      </text>
      <text x="42" y="178" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>
        t=7s   Client A wakes up! Bare DEL would nuke B&apos;s lock!
      </text>
      <text x="42" y="200" fontFamily={MONO} fontSize="9.5" fill={t.emeraldInk}>
        Fix 1: Lua checks GET == uuid_A before DEL (protects Redis lock)
      </text>
      <text x="42" y="218" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.blueInk}>
        Fix 2: Storage checks fencing_token &gt;= 34 (rejects stale A #33!)
      </text>

      <rect x="30" y="244" width="406" height="126" rx="6" fill={t.panelAlt} stroke={t.border} />
      <CalloutBadge x={48} y={264} glyph="②" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="68" y="268" fontSize="11.5" fontWeight="700" fill={t.ink}>
        Single-Instance Lock vs Redlock Debate
      </text>
      <text x="42" y="290" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • 95% Latency/Dedup Locks: Single primary `SET key uuid NX PX`
      </text>
      <text x="42" y="308" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        {'  '}+ Watchdog lease renewal every TTL/3 while job active
      </text>
      <text x="42" y="328" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • Redlock (N=5 masters): Quorum &gt;=3 within drift window,
      </text>
      <text x="42" y="346" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.amberInk}>
        {'  '}still needs DB Fencing Token (Kleppmann critique) for strict correctness!
      </text>

      {/* Right: Sliding Window Rate Limiter */}
      <rect x="464" y="58" width="400" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={484} y={78} glyph="③" fill={t.emeraldBg} stroke={t.emeraldBorder} ink={t.emeraldInk} />
      <text x="502" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Atomic Lua Sliding-Window Rate Limiter
      </text>

      {/* Visual Sliding Window */}
      <rect x="480" y="100" width="368" height="78" rx="6" fill={t.panelAlt} stroke={t.border} />
      <rect x="488" y="110" width="114" height="44" rx="4" fill={t.redBg} stroke={t.redBorder} strokeDasharray="3 2" />
      <text x="545" y="129" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>Evicted (&lt; now-W)</text>
      <text x="545" y="145" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>ZREMRANGEBYSCORE</text>

      <rect x="610" y="110" width="228" height="44" rx="4" fill={t.emeraldBg} stroke={t.emeraldBorder} strokeWidth="1.5" />
      <text x="724" y="129" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.emeraldInk}>Active Window [now - 60s, now]</text>
      <text x="724" y="145" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.ink}>ZCARD &lt; limit ? ZADD : 429</text>
      <text x="488" y="170" fontFamily={MONO} fontSize="9" fill={t.muted}>Eliminates Fixed-Window 2x boundary burst spike!</text>

      {/* Lua Pipeline Steps */}
      <rect x="480" y="190" width="368" height="122" rx="6" fill={t.codeBg} stroke={t.borderStrong} />
      <text x="492" y="210" fontFamily={MONO} fontSize="10" fill={t.cyan}>
        1. ZREMRANGEBYSCORE rl:ip 0 (now_ms - win_ms)
      </text>
      <text x="492" y="230" fontFamily={MONO} fontSize="10" fill={t.codeInk}>
        2. local count = ZCARD rl:ip
      </text>
      <text x="492" y="250" fontFamily={MONO} fontSize="10" fill={t.amber}>
        3. if count &gt;= limit then return {'{0, retry_ms}'} end
      </text>
      <text x="492" y="270" fontFamily={MONO} fontSize="10" fill={t.emerald}>
        4. ZADD rl:ip now_ms (now_ms .. &quot;:&quot; .. req_id)
      </text>
      <text x="492" y="290" fontFamily={MONO} fontSize="10" fill={t.emerald}>
        5. PEXPIRE rl:ip win_ms; return {'{1, limit-count-1}'}
      </text>

      <rect x="480" y="322" width="368" height="48" rx="6" fill={t.purpleBg} stroke={t.purpleBorder} />
      <text x="492" y="341" fontSize="10.5" fontWeight="700" fill={t.purpleInk}>
        Alternative: Token Bucket / GCRA (Hash + Lua)
      </text>
      <text x="492" y="358" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        O(1) RAM per user (`tokens`, `last_ms`) vs O(limit) ZSet!
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r12: maxmemory Headroom (65% + 35%) & 8 Eviction Policies Matrix
 * ========================================================================== */
const R12MemoryAndEviction: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r12"
      code="REDIS·12"
      title="RAM Headroom Budget (jemalloc + CoW) & 8 Eviction Policies Matrix"
      subtitle="maxmemory ~65-70% Host RAM · Approximated LRU vs TinyLFU"
      isLight={isLight}
      className={className}
    >
      {/* Top Bar: Host Memory Budget */}
      <rect x="16" y="58" width="848" height="114" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.redBg} stroke={t.redBorder} ink={t.redInk} />
      <text x="54" y="82" fontSize="12.5" fontWeight="700" fill={t.ink}>
        Production 16 GB Host RAM Budget (Never Set maxmemory = 100% Physical RAM!)
      </text>

      {/* Segmented Bar */}
      <rect x="30" y="98" width="510" height="42" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} strokeWidth="1.5" />
      <text x="285" y="117" textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.emeraldInk}>
        maxmemory = 10.5 GB (65% Dataset + jemalloc arenas)
      </text>
      <text x="285" y="133" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Governed by maxmemory-policy
      </text>

      <rect x="546" y="98" width="176" height="42" rx="6" fill={t.amberBg} stroke={t.amberBorder} strokeWidth="1.5" />
      <text x="634" y="117" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.amberInk}>
        20% Fork CoW Pages
      </text>
      <text x="634" y="133" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>
        BGSAVE / AOF Rewrite
      </text>

      <rect x="728" y="98" width="122" height="42" rx="6" fill={t.purpleBg} stroke={t.purpleBorder} strokeWidth="1.5" />
      <text x="789" y="117" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.purpleInk}>
        15% Buffers/OS
      </text>
      <text x="789" y="133" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>
        Replica COB + Kernel
      </text>

      <text x="30" y="160" fontFamily={MONO} fontSize="10" fill={t.ink}>
        Monitor `mem_fragmentation_ratio = used_memory_rss / used_memory` (Healthy: 1.05–1.40; &gt;1.5 -&gt; `activedefrag yes`)
      </text>

      {/* Bottom Left: 8 Eviction Policies Matrix */}
      <rect x="16" y="184" width="522" height="200" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={204} glyph="②" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="54" y="208" fontSize="12" fontWeight="700" fill={t.ink}>
        The 8 `maxmemory-policy` Modes
      </text>

      {[
        { scope: 'allkeys-* (Pure Cache)', items: ['allkeys-lfu (Recommended!)', 'allkeys-lru (Recency)', 'allkeys-random'], bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
        { scope: 'volatile-* (TTL Keys Only)', items: ['volatile-lfu', 'volatile-lru', 'volatile-ttl (Soonest)', 'volatile-random'], bg: t.blueBg, bd: t.blueBorder, ink: t.blueInk },
      ].map((col, idx) => {
        const x = 30 + idx * 250;
        return (
          <g key={idx}>
            <rect x={x} y={222} width="242" height="114" rx="6" fill={col.bg} stroke={col.bd} />
            <text x={x + 12} y={241} fontSize="11" fontWeight="700" fill={col.ink}>
              {col.scope}
            </text>
            {col.items.map((it, j) => (
              <text key={j} x={x + 12} y={261 + j * 18} fontFamily={MONO} fontSize="9.5" fill={t.ink}>
                • {it}
              </text>
            ))}
          </g>
        );
      })}

      <rect x="30" y="344" width="492" height="28" rx="5" fill={t.redBg} stroke={t.redBorder} />
      <text x="42" y="362" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>
        8. noeviction (Default!): Returns -OOM on writes when full (Use for Durable Queue/Lock DB)
      </text>

      {/* Bottom Right: 24-bit robj.lru Clock vs TinyLFU */}
      <rect x="552" y="184" width="312" height="200" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={572} y={204} glyph="③" fill={t.purpleBg} stroke={t.purpleBorder} ink={t.purpleInk} />
      <text x="590" y="208" fontSize="12" fontWeight="700" fill={t.ink}>
        24-Bit `robj.lru` Header Bits
      </text>

      <rect x="566" y="224" width="284" height="64" rx="6" fill={t.panelAlt} stroke={t.border} />
      <text x="576" y="243" fontSize="10.5" fontWeight="700" fill={t.blueInk}>
        Approximated LRU (`maxmemory-samples 5`)
      </text>
      <text x="576" y="261" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        [ 24-bit unix seconds idle timestamp ]
      </text>
      <text x="576" y="278" fontFamily={MONO} fontSize="9" fill={t.muted}>
        Weakness: 1-time scan pollutes cache!
      </text>

      <rect x="566" y="298" width="284" height="74" rx="6" fill={t.purpleBg} stroke={t.purpleBorder} />
      <text x="576" y="317" fontSize="10.5" fontWeight="700" fill={t.purpleInk}>
        Approximated LFU (Morris Counter + Decay)
      </text>
      <text x="576" y="336" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.ink}>
        [ 16-bit ldt minutes | 8-bit log_counter ]
      </text>
      <text x="576" y="355" fontFamily={MONO} fontSize="9" fill={t.muted}>
        8 bits (0..255) tracks ~1M hits + time decay!
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r13: RDB BGSAVE (fork CoW) vs AOF (everysec) + Redis 8 Hybrid Preamble
 * ========================================================================== */
const R13PersistenceAnatomy: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r13"
      code="REDIS·13"
      title="Persistence Internals: RDB fork() Copy-on-Write, AOF fsync & Hybrid RDB+AOF"
      subtitle="BGSAVE 4KB Page Faults · appendfsync everysec · aof-use-rdb-preamble yes"
      isLight={isLight}
      className={className}
    >
      {/* Left: RDB BGSAVE Copy-on-Write */}
      <rect x="16" y="58" width="416" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="54" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        RDB `BGSAVE`: OS `fork()` + 4KB Copy-on-Write
      </text>

      {/* Parent vs Child */}
      <rect x="30" y="100" width="136" height="64" rx="6" fill={t.blueBg} stroke={t.blueBorder} />
      <text x="98" y="121" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.blueInk}>Parent PID 101</text>
      <text x="98" y="138" textAnchor="middle" fontSize="9.5" fill={t.ink}>Serves Live Writes</text>
      <text x="98" y="153" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.redInk}>Mutates Page P2!</text>

      <rect x="282" y="100" width="136" height="64" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="350" y="121" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>Child PID 489</text>
      <text x="350" y="138" textAnchor="middle" fontSize="9.5" fill={t.ink}>Frozen Page Table</text>
      <text x="350" y="153" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.emeraldInk}>Streams dump.rdb</text>

      {/* Physical RAM Pages */}
      <rect x="30" y="186" width="388" height="94" rx="6" fill={t.panelAlt} stroke={t.border} />
      <text x="42" y="204" fontSize="10.5" fontWeight="700" fill={t.ink}>Physical 4KB Memory Pages (Disable Linux THP!):</text>

      {[
        { label: 'P1 (Clean)', desc: 'Shared RO', bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
        { label: 'P2 (Orig)', desc: 'Child reads', bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
        { label: "P2' (CoW!)", desc: 'Parent copy', bg: t.redBg, bd: t.redBorder, ink: t.redInk },
        { label: 'P3 (Clean)', desc: 'Shared RO', bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
      ].map((p, idx) => {
        const x = 40 + idx * 93;
        return (
          <g key={idx}>
            <rect x={x} y={214} width="85" height="54" rx="5" fill={p.bg} stroke={p.bd} strokeWidth="1.4" />
            <text x={x + 42.5} y={236} textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={p.ink}>
              {p.label}
            </text>
            <text x={x + 42.5} y={254} textAnchor="middle" fontFamily={MONO} fontSize="8.5" fill={t.muted}>
              {p.desc}
            </text>
          </g>
        );
      })}

      <line x1="98" y1="164" x2="268" y2="214" stroke={t.red} strokeWidth="1.5" markerEnd="url(#r13-arr-red)" />
      <line x1="350" y1="164" x2="176" y2="214" stroke={t.emerald} strokeWidth="1.5" markerEnd="url(#r13-arr-green)" />

      <rect x="30" y="292" width="388" height="78" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="42" y="312" fontSize="10.5" fontWeight="700" fill={t.redInk}>
        NEVER run synchronous `SAVE` in production (blocks main loop)!
      </text>
      <text x="42" y="331" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • RDB Pros: Compact binary, fastest cold restart, S3 backup
      </text>
      <text x="42" y="350" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • RDB Cons: Lose 1–5 minutes of writes between snapshots
      </text>

      {/* Right: AOF + Hybrid RDB-AOF */}
      <rect x="446" y="58" width="418" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={466} y={78} glyph="②" fill={t.amberBg} stroke={t.amberBorder} ink={t.amberInk} />
      <text x="484" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        AOF Durability &amp; Redis 7/8 Multi-Part Hybrid AOF
      </text>

      {/* Fsync modes */}
      <rect x="460" y="100" width="390" height="106" rx="6" fill={t.amberBg} stroke={t.amberBorder} />
      <text x="472" y="120" fontSize="11" fontWeight="700" fill={t.amberInk}>
        `appendfsync` Policies (Write -&gt; OS Page Cache -&gt; Disk)
      </text>
      <text x="472" y="140" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • always   : fsync every cmd (Safe, but ~5k ops/s SSD bottleneck)
      </text>
      <text x="472" y="160" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.emeraldInk}>
        • everysec : BIO thread fsyncs 1/s (Default! Max 1s loss, ~100k+ ops/s)
      </text>
      <text x="472" y="180" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • no       : OS flushes ~30s (Fastest, unsafe on kernel panic)
      </text>
      <text x="472" y="197" fontFamily={MONO} fontSize="9" fill={t.ink}>
        Corrupt tail after power loss? -&gt; `redis-check-aof --fix`
      </text>

      {/* Hybrid RDB-AOF */}
      <rect x="460" y="218" width="390" height="152" rx="6" fill={t.purpleBg} stroke={t.purpleBorder} />
      <CalloutBadge x={480} y={238} glyph="③" fill={t.purple} stroke={t.purpleBorder} ink="#ffffff" />
      <text x="500" y="242" fontSize="11.5" fontWeight="700" fill={t.purpleInk}>
        Hybrid AOF (`aof-use-rdb-preamble yes` — Default)
      </text>

      {/* Visual multi-part AOF directory */}
      <rect x="474" y="258" width="168" height="52" rx="5" fill={t.blueBg} stroke={t.blueBorder} />
      <text x="558" y="279" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.blueInk}>
        appendonly.aof.1.base.rdb
      </text>
      <text x="558" y="296" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>
        Compact RDB Snapshot
      </text>

      <text x="653" y="288" textAnchor="middle" fontFamily={MONO} fontSize="14" fontWeight="700" fill={t.purpleInk}>+</text>

      <rect x="666" y="258" width="170" height="52" rx="5" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="751" y="279" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        appendonly.aof.1.incr.aof
      </text>
      <text x="751" y="296" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>
        RESP Delta Commands
      </text>

      <text x="474" y="332" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.ink}>
        appendonly.aof.manifest coordinates atomic BGREWRITEAOF!
      </text>
      <text x="474" y="352" fontFamily={MONO} fontSize="9.5" fill={t.emeraldInk}>
        Result: RDB-speed boot + 1-second AOF durability!
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r14: Async Replication (PSYNC2) & Redis Sentinel Quorum Failover
 * ========================================================================== */
const R14ReplicationAndSentinel: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r14"
      code="REDIS·14"
      title="PSYNC2 Async Replication & Redis Sentinel Quorum Failover"
      subtitle="repl-backlog-size · SDOWN -> ODOWN -> Raft Leader -> Promotion"
      isLight={isLight}
      className={className}
    >
      {/* Left: Async Replication + PSYNC2 */}
      <rect x="16" y="58" width="404" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="54" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Async Replication Stream &amp; PSYNC2 Backlog
      </text>

      <rect x="30" y="102" width="164" height="92" rx="7" fill={t.redBg} stroke={t.redBorder} strokeWidth="1.5" />
      <text x="112" y="123" textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="700" fill={t.redInk}>
        Master (replid_A)
      </text>
      <rect x="42" y="133" width="140" height="48" rx="4" fill={t.panel} stroke={t.redBorder} />
      <text x="112" y="151" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.ink}>
        Circular Repl Backlog
      </text>
      <text x="112" y="169" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>
        offset: 98,100..104,500
      </text>

      <line x1="194" y1="132" x2="246" y2="118" stroke={t.emerald} strokeWidth="1.6" markerEnd="url(#r14-arr-green)" />
      <line x1="194" y1="162" x2="246" y2="176" stroke={t.emerald} strokeWidth="1.6" markerEnd="url(#r14-arr-green)" />

      <rect x="250" y="96" width="156" height="44" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="328" y="116" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>Replica 1 (offset 104498)</text>
      <text x="328" y="131" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>PSYNC2 Partial Resync</text>

      <rect x="250" y="152" width="156" height="44" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="328" y="172" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>Replica 2 (offset 104490)</text>
      <text x="328" y="187" textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>Read-Replica Scaling</text>

      <rect x="30" y="210" width="376" height="160" rx="6" fill={t.panelAlt} stroke={t.border} />
      <text x="42" y="230" fontSize="11" fontWeight="700" fill={t.ink}>
        Replication Internals &amp; Split-Brain Fencing:
      </text>
      <text x="42" y="250" fontFamily={MONO} fontSize="9.5" fill={t.emeraldInk}>
        • Disconnect &lt; backlog: PSYNC &lt;replid&gt; &lt;offset&gt; (Delta only!)
      </text>
      <text x="42" y="270" fontFamily={MONO} fontSize="9.5" fill={t.redInk}>
        • Backlog overflow: Full Resync (BGSAVE RDB + COB spike!)
      </text>
      <text x="42" y="290" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • WAIT 1 500: Block caller until &gt;=1 replica ACKs offset
      </text>
      <text x="42" y="312" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.amberInk}>
        • Limit write loss on isolated Master:
      </text>
      <text x="42" y="330" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        {'  '}min-replicas-to-write 1  &amp;  min-replicas-max-lag 10
      </text>
      <text x="42" y="352" fontFamily={MONO} fontSize="9" fill={t.muted}>
        Note: WAIT improves durability but is NOT strict linearizability
      </text>

      {/* Right: Sentinel Quorum & Failover */}
      <rect x="434" y="58" width="430" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={454} y={78} glyph="②" fill={t.purpleBg} stroke={t.purpleBorder} ink={t.purpleInk} />
      <text x="472" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Redis Sentinel HA (Minimum 3 Odd Nodes, Quorum = 2)
      </text>

      {/* 3 Sentinel Nodes */}
      {[0, 1, 2].map((i) => {
        const x = 450 + i * 136;
        return (
          <g key={i}>
            <rect x={x} y={100} width="124" height="52" rx="6" fill={t.purpleBg} stroke={t.purpleBorder} strokeWidth="1.4" />
            <text x={x + 62} y={121} textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.purpleInk}>
              Sentinel #{i + 1}
            </text>
            <text x={x + 62} y={139} textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>
              {i === 1 ? 'Elected Leader' : 'PING every 1s'}
            </text>
          </g>
        );
      })}

      {/* 4-Step Failover Pipeline */}
      {[
        {
          n: '1. SDOWN (Subjective)',
          d: '1 Sentinel sees no PONG within down-after-milliseconds (5000ms)',
          bg: t.amberBg,
          bd: t.amberBorder,
          ink: t.amberInk,
        },
        {
          n: '2. ODOWN (Objective)',
          d: 'Quorum >= 2 Sentinels confirm Master unreachable via SENTINEL is-master-down',
          bg: t.redBg,
          bd: t.redBorder,
          ink: t.redInk,
        },
        {
          n: '3. Raft Leader Vote',
          d: 'Majority (>= 2 of 3) elects 1 Sentinel Leader for configuration epoch +1',
          bg: t.purpleBg,
          bd: t.purpleBorder,
          ink: t.purpleInk,
        },
        {
          n: '4. Promote & Rewire',
          d: 'Highest repl_offset Replica -> REPLICAOF NO ONE; peers + clients switch!',
          bg: t.emeraldBg,
          bd: t.emeraldBorder,
          ink: t.emeraldInk,
        },
      ].map((st, idx) => {
        const y = 168 + idx * 50;
        return (
          <g key={idx}>
            <rect x="450" y={y} width="398" height="42" rx="6" fill={st.bg} stroke={st.bd} />
            <text x="462" y={y + 17} fontFamily={MONO} fontSize="10" fontWeight="700" fill={st.ink}>
              {st.n}
            </text>
            <text x="462" y={y + 33} fontFamily={MONO} fontSize="9" fill={t.ink}>
              {st.d}
            </text>
          </g>
        );
      })}
    </DiagramShell>
  );
};

/* ============================================================================
 * r15: Redis Cluster 16384 Hash Slots, CRC16, {HashTag} & MOVED/ASK
 * ========================================================================== */
const R15RedisClusterSharding: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r15"
      code="REDIS·15"
      title="Redis Cluster Horizontal Sharding: 16,384 Hash Slots & {HashTag} Routing"
      subtitle="slot = CRC16(key) mod 16384 · Gossip Port +10000 · MOVED vs ASK"
      isLight={isLight}
      className={className}
    >
      {/* Left: Formula + 3 Master Shards */}
      <rect x="16" y="58" width="482" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="54" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        Deterministic 16,384 Hash-Slot Partitioning
      </text>

      <rect x="30" y="98" width="454" height="40" rx="6" fill={t.codeBg} stroke={t.blueBorder} />
      <text x="257" y="123" textAnchor="middle" fontFamily={MONO} fontSize="11.5" fontWeight="700" fill={t.cyan}>
        slot = CRC16( hashtag_or_full_key ) &amp; 16383
      </text>

      {/* 3 Shard Cards */}
      {[
        { name: 'Shard 1: Master A (:6379)', slots: 'Slots 0 .. 5460', rep: '+ Replica A1 (:6380)', bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
        { name: 'Shard 2: Master B (:6381)', slots: 'Slots 5461 .. 10922', rep: '+ Replica B1 (:6382)', bg: t.blueBg, bd: t.blueBorder, ink: t.blueInk },
        { name: 'Shard 3: Master C (:6383)', slots: 'Slots 10923 .. 16383', rep: '+ Replica C1 (:6384)', bg: t.purpleBg, bd: t.purpleBorder, ink: t.purpleInk },
      ].map((sh, idx) => {
        const y = 152 + idx * 66;
        return (
          <g key={idx}>
            <rect x="30" y={y} width="454" height="56" rx="6" fill={sh.bg} stroke={sh.bd} strokeWidth="1.4" />
            <text x="44" y={y + 22} fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={sh.ink}>
              {sh.name}
            </text>
            <text x="44" y={y + 42} fontFamily={MONO} fontSize="10" fill={t.ink}>
              {sh.slots}
            </text>
            <text x="470" y={y + 32} textAnchor="end" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.muted}>
              {sh.rep}
            </text>
          </g>
        );
      })}

      <text x="30" y="366" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Cluster Bus TCP Port = Client Port + 10000 (e.g. 6379 + 16379 must be open!)
      </text>

      {/* Right: HashTags + MOVED vs ASK */}
      <rect x="512" y="58" width="352" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={532} y={78} glyph="②" fill={t.amberBg} stroke={t.amberBorder} ink={t.amberInk} />
      <text x="550" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        CROSSSLOT Error &amp; `{`HashTag`}` Co-Location
      </text>

      <rect x="526" y="100" width="324" height="62" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="536" y="119" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        MGET order:99:items order:99:pay
      </text>
      <text x="536" y="137" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        Slots 1402 != 9821 -&gt; -CROSSSLOT Error!
      </text>
      <text x="536" y="153" fontSize="9" fill={t.muted}>
        Multi-key MGET / MULTI / Lua require identical slot
      </text>

      <rect x="526" y="170" width="324" height="72" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="536" y="190" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.emeraldInk}>
        Fix: order:{`{u99}`}:items &amp; order:{`{u99}`}:pay
      </text>
      <text x="536" y="209" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        CRC16(&quot;u99&quot;) -&gt; BOTH land on Slot 7124!
      </text>
      <text x="536" y="229" fontFamily={MONO} fontSize="9" fontWeight="700" fill={t.amberInk}>
        Beware hot-shard skew: never use `{`global`}` tag!
      </text>

      {/* MOVED vs ASK */}
      <rect x="526" y="254" width="324" height="116" rx="6" fill={t.panelAlt} stroke={t.border} />
      <CalloutBadge x={544} y={274} glyph="③" fill={t.purpleBg} stroke={t.purpleBorder} ink={t.purpleInk} />
      <text x="564" y="278" fontSize="11.5" fontWeight="700" fill={t.ink}>
        Smart Client Redirects
      </text>
      <text x="536" y="300" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.blueInk}>
        -MOVED 7124 10.0.1.12:6381
      </text>
      <text x="536" y="316" fontFamily={MONO} fontSize="9" fill={t.muted}>
        Permanent slot ownership -&gt; Update local slot cache
      </text>
      <text x="536" y="338" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.purpleInk}>
        -ASK 7124 10.0.1.13:6383
      </text>
      <text x="536" y="354" fontFamily={MONO} fontSize="9" fill={t.muted}>
        Live slot migration in progress -&gt; 1-time ASKING + retry
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r16: Zero-Trust Redis Security: Private VPC + mTLS + ACL Rules
 * ========================================================================== */
const R16ZeroTrustSecurity: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r16"
      code="REDIS·16"
      title="Zero-Trust Redis Defense-in-Depth: Network Isolation · mTLS · ACL v2"
      subtitle="Never Expose 6379 to 0.0.0.0 · TLS 1.3 · Least-Privilege Key/Cmd ACL"
      isLight={isLight}
      className={className}
    >
      {/* Layer 1: Public Internet Blocked + Private Subnet */}
      <rect x="16" y="58" width="244" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.redBg} stroke={t.redBorder} ink={t.redInk} />
      <text x="54" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        1. Network Perimeter
      </text>

      <rect x="30" y="102" width="216" height="72" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="138" y="124" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fontWeight="700" fill={t.redInk}>
        0.0.0.0/0 Public Internet
      </text>
      <text x="138" y="143" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        CONFIG SET dir /var/spool/cron
      </text>
      <text x="138" y="160" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.redInk}>
        BLOCKED by SG / NetworkPolicy
      </text>

      <rect x="30" y="190" width="216" height="180" rx="6" fill={t.emeraldBg} stroke={t.emeraldBorder} />
      <text x="42" y="212" fontSize="11" fontWeight="700" fill={t.emeraldInk}>
        Private Data Subnet Only
      </text>
      <text x="42" y="234" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        bind 127.0.0.1 10.20.4.15
      </text>
      <text x="42" y="254" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        protected-mode yes
      </text>
      <text x="42" y="274" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        K8s NetworkPolicy: ingress
      </text>
      <text x="42" y="292" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        only from `app=checkout-api`
      </text>
      <text x="42" y="318" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Run container as non-root
      </text>
      <text x="42" y="336" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        UID 999 + readOnlyRootFS
      </text>

      {/* Layer 2: TLS 1.3 / mTLS */}
      <rect x="274" y="58" width="224" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={294} y={78} glyph="②" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="312" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        2. TLS 1.3 / mTLS
      </text>

      <rect x="288" y="102" width="196" height="268" rx="6" fill={t.blueBg} stroke={t.blueBorder} />
      <text x="300" y="126" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.blueInk}>
        port 0 (Disable plain TCP!)
      </text>
      <text x="300" y="148" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        tls-port 6379
      </text>
      <text x="300" y="172" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        tls-protocols &quot;TLSv1.3&quot;
      </text>
      <text x="300" y="192" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        tls-auth-clients yes
      </text>
      <text x="300" y="212" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        tls-replication yes
      </text>
      <text x="300" y="232" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        tls-cluster yes
      </text>
      <line x1="300" y1="250" x2="472" y2="250" stroke={t.blueBorder} />
      <text x="300" y="272" fontSize="10" fontWeight="700" fill={t.ink}>
        Protects Against:
      </text>
      <text x="300" y="292" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • East-West VPC packet sniff
      </text>
      <text x="300" y="312" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • Cleartext AUTH token leak
      </text>
      <text x="300" y="332" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • Rogue pod spoofing client
      </text>

      {/* Layer 3: Redis 6/7/8 Granular ACL */}
      <rect x="512" y="58" width="352" height="326" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={532} y={78} glyph="③" fill={t.purpleBg} stroke={t.purpleBorder} ink={t.purpleInk} />
      <text x="550" y="82" fontSize="12" fontWeight="700" fill={t.ink}>
        3. Redis ACL v2 Least-Privilege Policy
      </text>

      <rect x="526" y="102" width="324" height="44" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="538" y="121" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>
        user default off -@all
      </text>
      <text x="538" y="137" fontFamily={MONO} fontSize="9" fill={t.muted}>
        Disable unauthenticated default user completely!
      </text>

      <rect x="526" y="156" width="324" height="148" rx="6" fill={t.codeBg} stroke={t.purpleBorder} />
      <text x="538" y="176" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.purple}>
        ACL SETUSER checkout_svc on
      </text>
      <text x="538" y="196" fontFamily={MONO} fontSize="10" fill={t.codeInk}>
        {'  '}#&lt;sha256_hash&gt;
      </text>
      <text x="538" y="216" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emerald}>
        {'  '}(%R~catalog:* +@read)
      </text>
      <text x="538" y="236" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.cyan}>
        {'  '}(%RW~order:* ~lock:order:* +@write)
      </text>
      <text x="538" y="256" fontFamily={MONO} fontSize="10" fill={t.amber}>
        {'  '}&amp;events:order:*
      </text>
      <text x="538" y="276" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.red}>
        {'  '}-@admin -@dangerous -keys -flushall
      </text>
      <text x="538" y="294" fontFamily={MONO} fontSize="9" fill={t.muted}>
        Redis 7+ Selectors: RO on catalog, RW on order!
      </text>

      <rect x="526" y="314" width="324" height="56" rx="6" fill={t.panelAlt} stroke={t.border} />
      <text x="538" y="334" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={t.ink}>
        Audit Auth &amp; Command Denials:
      </text>
      <text x="538" y="354" fontFamily={MONO} fontSize="9.5" fill={t.purpleInk}>
        ACL LOG 10   -&gt;   reason: key / command / auth
      </text>
    </DiagramShell>
  );
};

/* ============================================================================
 * r17: SRE Observability & Incident Triage Pipeline
 * ========================================================================== */
const R17SreObservability: DiagramRenderer = ({ isLight, className }) => {
  const t = getTheme(isLight);
  return (
    <DiagramShell
      id="r17"
      code="REDIS·17"
      title="SRE Observability Golden Signals & Zero-Blocking Incident Triage"
      subtitle="INFO -> SLOWLOG -> LATENCY DOCTOR -> --bigkeys / --hotkeys -> UNLINK"
      isLight={isLight}
      className={className}
    >
      {/* Top Pipeline: 5-Stage Diagnostic Flow */}
      <rect x="16" y="58" width="848" height="146" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={78} glyph="①" fill={t.blueBg} stroke={t.blueBorder} ink={t.blueInk} />
      <text x="54" y="82" fontSize="12.5" fontWeight="700" fill={t.ink}>
        5-Minute Production P99 Latency Spike Triage Pipeline (NEVER Run `MONITOR` at Peak!)
      </text>

      {[
        { title: '1. INFO stats/memory', sub: 'ops/s · evicted · frag', bg: t.blueBg, bd: t.blueBorder, ink: t.blueInk },
        { title: '2. SLOWLOG GET 20', sub: 'Exec time > 10ms (µs)', bg: t.amberBg, bd: t.amberBorder, ink: t.amberInk },
        { title: '3. LATENCY DOCTOR', sub: 'fork · fsync · THP · exp', bg: t.purpleBg, bd: t.purpleBorder, ink: t.purpleInk },
        { title: '4. --bigkeys -i 0.01', sub: 'SCAN + MEMORY USAGE', bg: t.redBg, bd: t.redBorder, ink: t.redInk },
        { title: '5. UNLINK (Async)', sub: 'bio_lazy_free reclaim', bg: t.emeraldBg, bd: t.emeraldBorder, ink: t.emeraldInk },
      ].map((st, idx, arr) => {
        const x = 28 + idx * 166;
        return (
          <g key={idx}>
            <rect x={x} y={102} width="148" height="72" rx="6" fill={st.bg} stroke={st.bd} strokeWidth="1.4" />
            <text x={x + 74} y={128} textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={st.ink}>
              {st.title}
            </text>
            <text x={x + 74} y={150} textAnchor="middle" fontFamily={MONO} fontSize="9" fill={t.muted}>
              {st.sub}
            </text>
            {idx < arr.length - 1 && (
              <line
                x1={x + 148}
                y1={138}
                x2={x + 164}
                y2={138}
                stroke={t.borderStrong}
                strokeWidth="1.6"
                markerEnd="url(#r17-arr)"
              />
            )}
          </g>
        );
      })}

      <text x="28" y="193" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        Crucial: SLOWLOG measures ONLY main-thread execution time (excludes TCP queue &amp; network RTT)!
      </text>

      {/* Bottom Left: Golden Metrics */}
      <rect x="16" y="216" width="424" height="168" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={36} y={236} glyph="②" fill={t.amberBg} stroke={t.amberBorder} ink={t.amberInk} />
      <text x="54" y="240" fontSize="12" fontWeight="700" fill={t.ink}>
        Prometheus `redis_exporter` Golden Alerts
      </text>

      <text x="30" y="264" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • Hit Ratio = hits / (hits + misses) &lt; 85% -&gt; Check TTL/LFU
      </text>
      <text x="30" y="284" fontFamily={MONO} fontSize="9.5" fill={t.redInk}>
        • evicted_keys rate &gt; 100/s -&gt; Dataset outgrew maxmemory
      </text>
      <text x="30" y="304" fontFamily={MONO} fontSize="9.5" fill={t.amberInk}>
        • rejected_connections &gt; 0 -&gt; App leaked pool (`maxclients`)
      </text>
      <text x="30" y="324" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • master_link_status == 0 OR lag &gt; 5s -&gt; Replica broken
      </text>
      <text x="30" y="344" fontFamily={MONO} fontSize="9.5" fill={t.purpleInk}>
        • latest_fork_usec &gt; 50,000 -&gt; Oversized node (&gt;25GB shard!)
      </text>
      <text x="30" y="364" fontFamily={MONO} fontSize="9.5" fill={t.muted}>
        • rdb_last_bgsave_status != ok -&gt; Disk full / CoW OOM
      </text>

      {/* Bottom Right: DEL vs UNLINK & BigKey / HotKey Remediation */}
      <rect x="454" y="216" width="410" height="168" rx="8" fill={t.panel} stroke={t.border} />
      <CalloutBadge x={474} y={236} glyph="③" fill={t.emeraldBg} stroke={t.emeraldBorder} ink={t.emeraldInk} />
      <text x="492" y="240" fontSize="12" fontWeight="700" fill={t.ink}>
        Remediation: BigKeys (5M Hash) &amp; HotKeys (200k QPS)
      </text>

      <rect x="468" y="254" width="382" height="52" rx="6" fill={t.redBg} stroke={t.redBorder} />
      <text x="480" y="273" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.redInk}>
        DEL 5M-item Set = Free 5M pointers on Main Thread (~800ms freeze!)
      </text>
      <text x="480" y="293" fontFamily={MONO} fontSize="10" fontWeight="700" fill={t.emeraldInk}>
        UNLINK 5M-item Set = O(1) detach dict pointer + BIO thread free!
      </text>

      <rect x="468" y="314" width="382" height="58" rx="6" fill={t.panelAlt} stroke={t.border} />
      <text x="480" y="333" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • BigKey Fix: Shard `hash:u` -&gt; `hash:u:bucket_{'{0..63}'}` + HSCAN
      </text>
      <text x="480" y="351" fontFamily={MONO} fontSize="9.5" fill={t.ink}>
        • HotKey Fix: L1 In-Process Cache (500ms) or RESP3 Client Tracking!
      </text>
      <text x="480" y="367" fontFamily={MONO} fontSize="9" fill={t.muted}>
        Enable `lazyfree-lazy-eviction yes` &amp; `lazyfree-lazy-expire yes`
      </text>
    </DiagramShell>
  );
};

export const REDIS_DIAGRAMS: Record<string, DiagramRenderer> = {
  'redis:r00': R00LatencyEventLoop,
  'redis:r01': R01RespAndExpiration,
  'redis:r02': R02HashAndHexpire,
  'redis:r03': R03QuicklistAndSets,
  'redis:r04': R04ZSetDualStructure,
  'redis:r05': R05ProbabilisticAndGeo,
  'redis:r06': R06PipeliningAndWatch,
  'redis:r07': R07AtomicLuaEngine,
  'redis:r08': R08PubSubVsStreams,
  'redis:r09': R09CachingTopologies,
  'redis:r10': R10CacheDisasters,
  'redis:r11': R11LocksAndRateLimiter,
  'redis:r12': R12MemoryAndEviction,
  'redis:r13': R13PersistenceAnatomy,
  'redis:r14': R14ReplicationAndSentinel,
  'redis:r15': R15RedisClusterSharding,
  'redis:r16': R16ZeroTrustSecurity,
  'redis:r17': R17SreObservability,
};

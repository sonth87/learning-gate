import React from 'react';
import type { DiagramRenderer } from './diagramRegistry';

const MONO = "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

type Tone = 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'muted';

interface Palette {
  bg: string;
  bgSubtle: string;
  panel: string;
  panelAlt: string;
  codeBg: string;
  border: string;
  borderStrong: string;
  grid: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  cyan: string;
  cyanBg: string;
  cyanBorder: string;
  emerald: string;
  emeraldBg: string;
  emeraldBorder: string;
  amber: string;
  amberBg: string;
  amberBorder: string;
  rose: string;
  roseBg: string;
  roseBorder: string;
  violet: string;
  violetBg: string;
  violetBorder: string;
}

function getPalette(isLight: boolean): Palette {
  if (isLight) {
    return {
      bg: '#f8fafc',
      bgSubtle: '#f1f5f9',
      panel: '#ffffff',
      panelAlt: '#f8fafc',
      codeBg: '#f1f5f9',
      border: '#cbd5e1',
      borderStrong: '#94a3b8',
      grid: '#e2e8f0',
      ink: '#0f172a',
      inkSoft: '#334155',
      inkMuted: '#64748b',
      cyan: '#0284c7',
      cyanBg: '#e0f2fe',
      cyanBorder: '#7dd3fc',
      emerald: '#059669',
      emeraldBg: '#d1fae5',
      emeraldBorder: '#6ee7b7',
      amber: '#d97706',
      amberBg: '#fef3c7',
      amberBorder: '#fcd34d',
      rose: '#e11d48',
      roseBg: '#ffe4e6',
      roseBorder: '#fda4af',
      violet: '#7c3aed',
      violetBg: '#ede9fe',
      violetBorder: '#c4b5fd',
    };
  }
  return {
    bg: '#0b1120',
    bgSubtle: '#0f172a',
    panel: '#111c33',
    panelAlt: '#16223d',
    codeBg: '#090f1d',
    border: '#233252',
    borderStrong: '#384e78',
    grid: '#17233d',
    ink: '#f1f5f9',
    inkSoft: '#cbd5e1',
    inkMuted: '#8b9dc3',
    cyan: '#38bdf8',
    cyanBg: '#0c2a42',
    cyanBorder: '#0284c7',
    emerald: '#34d399',
    emeraldBg: '#092e26',
    emeraldBorder: '#059669',
    amber: '#fbbf24',
    amberBg: '#332409',
    amberBorder: '#d97706',
    rose: '#fb7185',
    roseBg: '#38111e',
    roseBorder: '#e11d48',
    violet: '#a78bfa',
    violetBg: '#231847',
    violetBorder: '#7c3aed',
  };
}

function toneColors(p: Palette, tone: Tone) {
  switch (tone) {
    case 'cyan':
      return { fg: p.cyan, bg: p.cyanBg, border: p.cyanBorder };
    case 'emerald':
      return { fg: p.emerald, bg: p.emeraldBg, border: p.emeraldBorder };
    case 'amber':
      return { fg: p.amber, bg: p.amberBg, border: p.amberBorder };
    case 'rose':
      return { fg: p.rose, bg: p.roseBg, border: p.roseBorder };
    case 'violet':
      return { fg: p.violet, bg: p.violetBg, border: p.violetBorder };
    default:
      return { fg: p.inkSoft, bg: p.bgSubtle, border: p.borderStrong };
  }
}

const CIRCLED_NUMS: Record<number, string> = { 1: '①', 2: '②', 3: '③', 4: '④' };

const Shell: React.FC<{
  id: string;
  badge: string;
  title: string;
  rightNote?: string;
  isLight: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ id, badge, title, rightNote, isLight, className, children }) => {
  const p = getPalette(isLight);
  const tones: Tone[] = ['cyan', 'emerald', 'amber', 'rose', 'violet', 'muted'];
  return (
    <svg
      viewBox="0 0 880 380"
      className={className}
      width="100%"
      height="auto"
      role="img"
      aria-label={`${badge} - ${title}`}
      style={{ display: 'block', fontFamily: SANS }}
    >
      <defs>
        <pattern id={`grid-${id}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill={p.grid} />
        </pattern>
        {tones.map((t) => {
          const c = toneColors(p, t);
          return (
            <marker
              key={t}
              id={`arr-${t}-${id}`}
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={c.fg} />
            </marker>
          );
        })}
      </defs>

      <rect x="0" y="0" width="880" height="380" rx="14" fill={p.bg} />
      <rect x="0" y="0" width="880" height="380" rx="14" fill={`url(#grid-${id})`} />
      <rect x="0.75" y="0.75" width="878.5" height="378.5" rx="13.25" fill="none" stroke={p.border} strokeWidth="1.5" />

      {/* Header bar */}
      <rect x="14" y="12" width="852" height="32" rx="8" fill={p.panel} stroke={p.border} />
      <rect x="22" y="18" width="66" height="20" rx="5" fill={p.cyanBg} stroke={p.cyanBorder} />
      <text x="55" y="32" textAnchor="middle" fill={p.cyan} fontSize="10.5" fontWeight="700" fontFamily={MONO}>
        {badge}
      </text>
      <text x="98" y="32" fill={p.ink} fontSize="12.5" fontWeight="700">
        {title}
      </text>
      {rightNote && (
        <text x="854" y="32" textAnchor="end" fill={p.inkMuted} fontSize="10.5" fontFamily={MONO}>
          {rightNote}
        </text>
      )}

      {children}
    </svg>
  );
};

const Panel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  tone?: Tone;
  p: Palette;
  dashed?: boolean;
}> = ({ x, y, w, h, title, tone = 'muted', p, dashed }) => {
  const c = toneColors(p, tone);
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="10"
        fill={p.panel}
        stroke={tone === 'muted' ? p.border : c.border}
        strokeWidth="1.3"
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      {title && (
        <>
          <rect
            x={x + 1}
            y={y + 1}
            width={w - 2}
            height="24"
            rx="9"
            fill={tone === 'muted' ? p.bgSubtle : c.bg}
          />
          <line
            x1={x}
            y1={y + 25}
            x2={x + w}
            y2={y + 25}
            stroke={tone === 'muted' ? p.border : c.border}
            strokeWidth="1"
          />
          <text x={x + 12} y={y + 17} fill={tone === 'muted' ? p.inkSoft : c.fg} fontSize="11" fontWeight="700">
            {title}
          </text>
        </>
      )}
    </g>
  );
};

const Callout: React.FC<{ x: number; y: number; n: 1 | 2 | 3 | 4; tone: Tone; p: Palette }> = ({
  x,
  y,
  n,
  tone,
  p,
}) => {
  const c = toneColors(p, tone);
  return (
    <g>
      <circle cx={x} cy={y} r="11.5" fill={c.bg} stroke={c.fg} strokeWidth="1.6" />
      <text
        x={x}
        y={y + 4.2}
        textAnchor="middle"
        fill={c.fg}
        fontSize="13"
        fontWeight="800"
        fontFamily={SANS}
      >
        {CIRCLED_NUMS[n]}
      </text>
    </g>
  );
};

const CodeBlock: React.FC<{
  x: number;
  y: number;
  w: number;
  lines: Array<{ text: string; tone?: Tone }>;
  p: Palette;
  lineH?: number;
  fontSize?: number;
}> = ({ x, y, w, lines, p, lineH = 17, fontSize = 11 }) => {
  const h = lines.length * lineH + 12;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="7" fill={p.codeBg} stroke={p.border} />
      {lines.map((ln, idx) => {
        const fill = ln.tone ? toneColors(p, ln.tone).fg : p.ink;
        return (
          <text
            key={idx}
            x={x + 10}
            y={y + 17 + idx * lineH}
            fill={fill}
            fontSize={fontSize}
            fontFamily={MONO}
          >
            {ln.text}
          </text>
        );
      })}
    </g>
  );
};

const Pill: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  label: string;
  sub?: string;
  tone?: Tone;
  p: Palette;
  mono?: boolean;
}> = ({ x, y, w, h = 28, label, sub, tone = 'cyan', p, mono = true }) => {
  const c = toneColors(p, tone);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="7" fill={c.bg} stroke={c.border} strokeWidth="1.3" />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 2 : y + h / 2 + 4}
        textAnchor="middle"
        fill={c.fg}
        fontSize="11"
        fontWeight="700"
        fontFamily={mono ? MONO : SANS}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 11}
          textAnchor="middle"
          fill={p.inkMuted}
          fontSize="9.5"
          fontFamily={SANS}
        >
          {sub}
        </text>
      )}
    </g>
  );
};

const Arrow: React.FC<{
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tone?: Tone;
  p: Palette;
  dashed?: boolean;
  label?: string;
}> = ({ id, x1, y1, x2, y2, tone = 'muted', p, dashed, label }) => {
  const c = toneColors(p, tone);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={c.fg}
        strokeWidth="1.8"
        strokeDasharray={dashed ? '4 3' : undefined}
        markerEnd={`url(#arr-${tone}-${id})`}
      />
      {label && (
        <text x={mx} y={my - 6} textAnchor="middle" fill={c.fg} fontSize="9.5" fontWeight="600" fontFamily={MONO}>
          {label}
        </text>
      )}
    </g>
  );
};

/* ============================================================================
 * M00 — JS V8 vs CPython Pipeline (.py -> .pyc -> PVM) & Indentation vs {}
 * ========================================================================== */
const PyM00: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm00';
  return (
    <Shell id={id} badge="PY:M00" title="Node.js V8 vs CPython Pipeline & Khối Thụt Lề" rightNote="uv · .py -> .pyc -> PVM" isLight={isLight} className={className}>
      {/* Left: Execution Pipeline Comparison */}
      <Panel x={14} y={54} w={524} h={312} title="Chu trình thực thi: Node.js V8 JIT vs CPython Bytecode PVM" tone="cyan" p={p} />
      <Callout x={518} y={66} n={1} tone="cyan" p={p} />

      {/* JS Row */}
      <text x={28} y={102} fill={p.inkMuted} fontSize="10.5" fontWeight="700">NODE.JS (V8)</text>
      <Pill x={28} y={110} w={132} h={38} label="app.js" sub="package.json" tone="amber" p={p} />
      <Arrow id={id} x1={164} y1={129} x2={206} y2={129} tone="amber" p={p} label="parse" />
      <Pill x={210} y={110} w={142} h={38} label="AST + Ignition" sub="Bytecode + TurboFan" tone="amber" p={p} />
      <Arrow id={id} x1={356} y1={129} x2={396} y2={129} tone="amber" p={p} label="JIT" />
      <Pill x={400} y={110} w={124} h={38} label="Machine Code" sub="node_modules/" tone="muted" p={p} />

      {/* Divider */}
      <line x1={28} y1={164} x2={524} y2={164} stroke={p.border} strokeDasharray="4 4" />

      {/* CPython Row */}
      <text x={28} y={184} fill={p.cyan} fontSize="10.5" fontWeight="700">CPYTHON 3.x (uv run)</text>
      <Pill x={28} y={192} w={132} h={44} label="app.py" sub="pyproject.toml" tone="cyan" p={p} />
      <Arrow id={id} x1={164} y1={214} x2={206} y2={214} tone="cyan" p={p} label="compile" />
      <Pill x={210} y={192} w={142} h={44} label="__pycache__/" sub="app.cpython-313.pyc" tone="violet" p={p} />
      <Arrow id={id} x1={356} y1={214} x2={396} y2={214} tone="emerald" p={p} label="eval loop" />
      <Pill x={400} y={192} w={124} h={44} label="PVM (C Loop)" sub=".venv/ isolated" tone="emerald" p={p} />

      {/* Entry Guard Box */}
      <Callout x={38} y={263} n={3} tone="emerald" p={p} />
      <CodeBlock
        x={58}
        y={252}
        w={466}
        p={p}
        lines={[
          { text: '# Cổng chặn: chỉ chạy khi gọi trực tiếp, KHÔNG chạy khi import', tone: 'muted' },
          { text: 'if __name__ == "__main__":    # ~= require.main === module', tone: 'emerald' },
          { text: '    main()                    # an toàn cho pytest / hệ thống chấm', tone: 'cyan' },
        ]}
      />

      {/* Right: Indentation vs Braces */}
      <Panel x={550} y={54} w={316} h={312} title="Cú pháp khối lệnh: Thụt lề 4 cách vs { }" tone="violet" p={p} />
      <Callout x={846} y={66} n={2} tone="violet" p={p} />

      <text x={564} y={98} fill={p.inkMuted} fontSize="10.5" fontWeight="700">JavaScript: ngoặc nhọn quyết định khối</text>
      <CodeBlock
        x={564}
        y={105}
        w={288}
        p={p}
        lines={[
          { text: 'if (age >= 18) { console.log("OK"); }', tone: 'muted' },
        ]}
      />

      <text x={564} y={158} fill={p.violet} fontSize="10.5" fontWeight="700">Python: 4 spaces = cấu trúc ngữ pháp</text>
      <rect x={564} y={166} width={288} height={96} rx="7" fill={p.codeBg} stroke={p.violetBorder} />
      {/* 4-space ruler guide */}
      <rect x={574} y={190} width={28} height={34} rx="3" fill={p.violetBg} stroke={p.violetBorder} strokeDasharray="2 2" />
      <text x={588} y={211} textAnchor="middle" fill={p.violet} fontSize="9.5" fontWeight="700" fontFamily={MONO}>4sp</text>
      <text x={574} y={183} fill={p.cyan} fontSize="11" fontFamily={MONO}>if age &gt;= 18:</text>
      <text x={606} y={203} fill={p.emerald} fontSize="11" fontFamily={MONO}>print(&quot;Đủ tuổi&quot;)</text>
      <text x={606} y={220} fill={p.emerald} fontSize="11" fontFamily={MONO}>allow = True</text>
      <text x={574} y={244} fill={p.inkSoft} fontSize="11" fontFamily={MONO}>print(&quot;Ngoài khối if&quot;)</text>

      {/* IndentationError warning */}
      <rect x={564} y={274} width={288} height={78} rx="7" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={576} y={294} fill={p.rose} fontSize="11" fontWeight="700" fontFamily={MONO}>IndentationError: unexpected indent</text>
      <text x={576} y={313} fill={p.inkSoft} fontSize="10.5">Thiếu dấu : cuối dòng if/def/for hoặc</text>
      <text x={576} y={329} fill={p.inkSoft} fontSize="10.5">trộn Tab với Space sẽ dừng ngay lúc parse!</text>
    </Shell>
  );
};

/* ============================================================================
 * M25 — Terminal, Working Directory Paths & Reading Traceback Bottom-Up
 * ========================================================================== */
const PyM25: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm25';
  return (
    <Shell id={id} badge="PY:M25" title="Cây Thư Mục (pwd/cd) & Giải Phẫu Traceback Từ Dưới Lên" rightNote="pwd · ../ · Traceback" isLight={isLight} className={className}>
      {/* Left: Working directory & Relative vs Absolute */}
      <Panel x={14} y={54} w={396} h={312} title="Đường dẫn Tuyệt đối (/...) vs Tương đối (./ · ../)" tone="cyan" p={p} />
      <Callout x={390} y={66} n={1} tone="cyan" p={p} />

      <Pill x={30} y={92} w={118} h={28} label="/Users/son/Py" sub="Thư mục cha" tone="muted" p={p} />
      <line x1={89} y1={120} x2={89} y2={198} stroke={p.borderStrong} strokeWidth="1.5" />
      <line x1={89} y1={150} x2={132} y2={150} stroke={p.borderStrong} strokeWidth="1.5" />
      <line x1={89} y1={198} x2={132} y2={198} stroke={p.borderStrong} strokeWidth="1.5" />

      <Pill x={134} y={134} w={122} h={32} label="WorkPath/" sub="pwd (đang đứng)" tone="cyan" p={p} />
      <Pill x={134} y={182} w={122} h={32} label="Homework/" sub="chứa hello.py" tone="emerald" p={p} />

      {/* Curved hop ../Homework/hello.py */}
      <path
        d="M 258 150 C 330 150, 330 198, 258 198"
        fill="none"
        stroke={p.amber}
        strokeWidth="1.8"
        strokeDasharray="4 3"
        markerEnd={`url(#arr-amber-${id})`}
      />
      <text x={334} y={171} textAnchor="middle" fill={p.amber} fontSize="10" fontWeight="700" fontFamily={MONO}>cd ..</text>
      <text x={334} y={185} textAnchor="middle" fill={p.amber} fontSize="9.5" fontFamily={MONO}>../Homework</text>

      <Callout x={34} y={240} n={2} tone="amber" p={p} />
      <CodeBlock
        x={52}
        y={228}
        w={344}
        p={p}
        lines={[
          { text: '# Tuyệt đối (bắt đầu từ gốc /):', tone: 'muted' },
          { text: '/Users/son/Py/Homework/hello.py', tone: 'cyan' },
          { text: '# Tương đối (từ WorkPath đang đứng):', tone: 'muted' },
          { text: '../Homework/hello.py', tone: 'amber' },
          { text: '$ uv run python ../Homework/hello.py', tone: 'emerald' },
        ]}
      />

      {/* Right: Traceback Bottom-Up */}
      <Panel x={422} y={54} w={444} h={312} title="Đọc Python Traceback: Đọc Ngược Từ DƯỚI Lên!" tone="rose" p={p} />
      <Callout x={846} y={66} n={3} tone="rose" p={p} />

      <rect x={438} y={90} width={352} height={206} rx="8" fill={p.codeBg} stroke={p.border} />
      <text x={450} y={112} fill={p.inkMuted} fontSize="10.5" fontFamily={MONO}>Traceback (most recent call last):</text>
      <text x={450} y={132} fill={p.inkSoft} fontSize="10.5" fontFamily={MONO}>  File &quot;main.py&quot;, line 10, in &lt;module&gt;</text>
      <text x={450} y={149} fill={p.inkMuted} fontSize="10.5" fontFamily={MONO}>    run_report()</text>

      {/* Step 2 highlight */}
      <rect x={444} y={162} width={340} height={42} rx="5" fill={p.amberBg} stroke={p.amberBorder} />
      <text x={452} y={180} fill={p.amber} fontSize="10.5" fontWeight="700" fontFamily={MONO}>  File &quot;app.py&quot;, line 7, in calc</text>
      <text x={452} y={197} fill={p.ink} fontSize="10.5" fontFamily={MONO}>    return total / count</text>

      {/* Step 1 highlight */}
      <rect x={444} y={214} width={340} height={34} rx="5" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={452} y={235} fill={p.rose} fontSize="11" fontWeight="700" fontFamily={MONO}>ZeroDivisionError: division by zero</text>

      <text x={452} y={272} fill={p.emerald} fontSize="10.5" fontFamily={SANS}>Bước 1 (dòng cuối): Loại lỗi + nguyên nhân</text>
      <text x={452} y={288} fill={p.amber} fontSize="10.5" fontFamily={SANS}>Bước 2 (khung File cuối): Đúng file + số dòng nổ</text>

      {/* Upward arrow */}
      <Arrow id={id} x1={822} y1={242} x2={822} y2={112} tone="rose" p={p} />
      <text x={822} y={262} textAnchor="middle" fill={p.rose} fontSize="10" fontWeight="700">ĐỌC</text>
      <text x={822} y={275} textAnchor="middle" fill={p.rose} fontSize="10" fontWeight="700">LÊN</text>

      {/* Bottom quick bar */}
      <Pill x={438} y={308} w={132} h={42} label="NameError" sub="Biến chưa gán" tone="violet" p={p} />
      <Pill x={578} y={308} w={132} h={42} label="ValueError" sub="int('abc')" tone="amber" p={p} />
      <Pill x={718} y={308} w={132} h={42} label="FileNotFound" sub="Sai pwd / path" tone="cyan" p={p} />
    </Shell>
  );
};

/* ============================================================================
 * M26 — input() -> def Function Box -> return Value vs print() Side Effect
 * ========================================================================== */
const PyM26: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm26';
  return (
    <Shell id={id} badge="PY:M26" title="Luồng Dữ Liệu Hàm: input() -> def -> return Giá Trị vs print() Hiển Thị" rightNote="def · return != print" isLight={isLight} className={className}>
      {/* Top Pipeline: input -> int -> def -> return */}
      <Panel x={14} y={54} w={852} h={146} title="Cỗ máy hàm số (Function Pipeline): Đầu vào -> Biến cục bộ -> Đầu ra tái sử dụng" tone="cyan" p={p} />
      <Callout x={38} y={102} n={1} tone="amber" p={p} />
      <Pill x={58} y={92} w={146} h={48} label='input("Tuổi: ")' sub='Luôn trả về str "20"' tone="amber" p={p} />
      <Arrow id={id} x1={208} y1={116} x2={248} y2={116} tone="amber" p={p} label="int()" />

      <Pill x={252} y={92} w={110} h={48} label="age = 20" sub="int (số nguyên)" tone="cyan" p={p} />
      <Arrow id={id} x1={366} y1={116} x2={406} y2={116} tone="cyan" p={p} label="truyền" />

      <rect x={410} y={84} width={236} height={68} rx="9" fill={p.codeBg} stroke={p.cyanBorder} strokeWidth="1.5" />
      <text x={422} y={104} fill={p.cyan} fontSize="11" fontWeight="700" fontFamily={MONO}>def next_age(a):</text>
      <text x={422} y={122} fill={p.inkSoft} fontSize="11" fontFamily={MONO}>    res = a + 1</text>
      <text x={422} y={140} fill={p.emerald} fontSize="11" fontWeight="700" fontFamily={MONO}>    return res</text>

      <Arrow id={id} x1={650} y1={116} x2={694} y2={116} tone="emerald" p={p} label="return" />
      <Pill x={698} y={92} w={152} h={48} label="kq = 21" sub="Dùng tiếp: kq * 2" tone="emerald" p={p} />
      <Callout x={836} y={70} n={2} tone="emerald" p={p} />

      <text x={58} y={182} fill={p.inkMuted} fontSize="10.5" fontFamily={MONO}>
        f-string ghép chuỗi sạch đẹp:  f&quot;Năm sau {`{name}`} sẽ {`{age + 1}`} tuổi&quot;  -&gt;  &quot;An sẽ 21 tuổi&quot;
      </text>

      {/* Bottom Split: return vs print */}
      <Panel x={14} y={212} w={418} h={154} title="ĐÚNG: return xuất giá trị ra khỏi hàm" tone="emerald" p={p} />
      <CodeBlock
        x={28}
        y={246}
        w={390}
        p={p}
        lines={[
          { text: 'def double(x):', tone: 'cyan' },
          { text: '    return x * 2      # trả số 10 ra ngoài', tone: 'emerald' },
          { text: 'total = double(5) + 1 # 10 + 1 == 11 (PASS)', tone: 'ink' as Tone },
        ]}
      />
      <text x={28} y={348} fill={p.emerald} fontSize="10.5" fontWeight="600">Test tự động nhận được 10 -&gt; cộng, so sánh assert được.</text>

      <Panel x={448} y={212} w={418} h={154} title="BẪY: print() chỉ in màn hình, hàm trả về None!" tone="rose" p={p} />
      <Callout x={846} y={224} n={3} tone="rose" p={p} />
      <CodeBlock
        x={462}
        y={246}
        w={390}
        p={p}
        lines={[
          { text: 'def bad_double(x):', tone: 'amber' },
          { text: '    print(x * 2)      # in "10" ra terminal, quên return', tone: 'amber' },
          { text: 'bad_double(5) + 1     # TypeError: None + 1!', tone: 'rose' },
        ]}
      />
      <text x={462} y={348} fill={p.rose} fontSize="10.5" fontWeight="600">Mọi hàm không có return đều ngầm trả về None.</text>
    </Shell>
  );
};

/* ============================================================================
 * M27 — Numeric Ops (/, //, %, **) & Arbitrary-Precision int vs IEEE-754 float
 * ========================================================================== */
const PyM27: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm27';
  return (
    <Shell id={id} badge="PY:M27" title="4 Phép Toán Đặc Trưng (/, //, %, **) & Số Nguyên Vô Hạn vs Float IEEE-754" rightNote="int vs float · // · %" isLight={isLight} className={className}>
      {/* Left: 4 Operators Grid */}
      <Panel x={14} y={54} w={462} h={312} title="Phép chia & Luỹ thừa trong Python (Khác hẳn C / JS)" tone="cyan" p={p} />
      <Callout x={456} y={66} n={1} tone="cyan" p={p} />

      <Pill x={28} y={92} w={210} h={56} label="7 / 2  ->  3.5" sub="Chia thực: LUÔN ra float (6/3 -> 2.0)" tone="cyan" p={p} />
      <Pill x={252} y={92} w={210} h={56} label="7 // 2  ->  3" sub="Chia lấy nguyên (floor xuống -inf)" tone="emerald" p={p} />
      <Pill x={28} y={160} w={210} h={56} label="7 % 2  ->  1" sub="Chia lấy dư (chẵn/lẻ, xoay vòng)" tone="amber" p={p} />
      <Pill x={252} y={160} w={210} h={56} label="2 ** 10  ->  1024" sub="Luỹ thừa (** thay cho Math.pow)" tone="violet" p={p} />

      {/* Invariant box */}
      <rect x={28} y={230} width={434} height={54} rx="8" fill={p.codeBg} stroke={p.emeraldBorder} />
      <text x={245} y={252} textAnchor="middle" fill={p.emerald} fontSize="11.5" fontWeight="700" fontFamily={MONO}>
        Bất biến: (a // b) * b + (a % b) == a
      </text>
      <text x={245} y={272} textAnchor="middle" fill={p.inkMuted} fontSize="10.5" fontFamily={MONO}>
        Chú ý số âm: -7 // 2 == -4 (làm tròn XUỐNG, không cắt cụt về 0)
      </text>

      <CodeBlock
        x={28}
        y={296}
        w={434}
        p={p}
        lines={[
          { text: 'Ưu tiên: ()  >  **  >  * / // %  >  + -', tone: 'cyan' },
          { text: '175 // 60 -> 2 phút   |   175 % 60 -> 55 giây', tone: 'amber' },
        ]}
      />

      {/* Right: BigInt vs IEEE-754 Float */}
      <Panel x={488} y={54} w={378} h={148} title="int: Độ lớn tuỳ ý (Arbitrary Precision)" tone="emerald" p={p} />
      <Callout x={846} y={66} n={2} tone="emerald" p={p} />
      <CodeBlock
        x={502}
        y={88}
        w={350}
        p={p}
        lines={[
          { text: '>>> 2 ** 100', tone: 'cyan' },
          { text: '1267650600228229401496703205376', tone: 'emerald' },
          { text: 'big = 1_000_000_000  # gạch dưới dễ đọc', tone: 'muted' },
        ]}
      />
      <text x={502} y={186} fill={p.emerald} fontSize="10.5">Không bao giờ tràn bit (overflow) như int32/int64!</text>

      <Panel x={488} y={214} w={378} h={152} title="float: IEEE-754 64-bit & Sai số nhị phân" tone="rose" p={p} />
      <Callout x={846} y={226} n={3} tone="rose" p={p} />
      <CodeBlock
        x={502}
        y={248}
        w={350}
        p={p}
        lines={[
          { text: '0.1 + 0.2 == 0.3          # False! (0.30000000000000004)', tone: 'rose' },
          { text: 'abs((0.1 + 0.2) - 0.3) < 1e-9   # True', tone: 'emerald' },
          { text: 'math.isclose(0.1 + 0.2, 0.3)    # True (chuẩn)', tone: 'emerald' },
        ]}
      />
      <text x={502} y={350} fill={p.inkMuted} fontSize="10.5">Tiền tệ chính xác tuyệt đối: dùng int (xu/đồng) hoặc Decimal.</text>
    </Shell>
  );
};

/* ============================================================================
 * M28 — Explicit Casting vs JS Implicit Coercion & Short-Circuit and/or/not
 * ========================================================================== */
const PyM28: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm28';
  return (
    <Shell id={id} badge="PY:M28" title="Strong Typing (Ép Kiểu Tường Minh) & Đoản Mạch Logic and / or / not" rightNote="Strong Typing · is None" isLight={isLight} className={className}>
      {/* Left: Strong Typing vs JS Coercion */}
      <Panel x={14} y={54} w={422} h={312} title="Python Không Tự Đổi Kiểu Ngầm Như JavaScript" tone="cyan" p={p} />
      <Callout x={416} y={66} n={1} tone="cyan" p={p} />

      <rect x={28} y={90} width={394} height={64} rx="8" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={40} y={111} fill={p.inkMuted} fontSize="10.5" fontFamily={MONO}>JS:     &quot;5&quot; + 3  -&gt;  &quot;53&quot;   |  &quot;5&quot; - 3  -&gt;  2</text>
      <text x={40} y={132} fill={p.rose} fontSize="11" fontWeight="700" fontFamily={MONO}>Python: &quot;5&quot; + 3  -&gt;  TypeError! (chặn bug sớm)</text>
      <text x={40} y={147} fill={p.inkSoft} fontSize="10">Khác kiểu: &quot;5&quot; == 5 là False ngay lập tức (không có ===).</text>

      <text x={28} y={176} fill={p.cyan} fontSize="11" fontWeight="700">Cầu nối ép kiểu chủ động (Explicit Constructors):</text>
      <Pill x={28} y={186} w={122} h={42} label='int("42")' sub="-> 42 (int)" tone="emerald" p={p} />
      <Pill x={164} y={186} w={122} h={42} label="str(42)" sub='-> "42" (str)' tone="cyan" p={p} />
      <Pill x={300} y={186} w={122} h={42} label='float("3.5")' sub="-> 3.5 (float)" tone="violet" p={p} />

      <Callout x={38} y={254} n={3} tone="violet" p={p} />
      <CodeBlock
        x={56}
        y={242}
        w={366}
        p={p}
        lines={[
          { text: '# Kiểm tra kiểu & giá trị rỗng None:', tone: 'muted' },
          { text: 'isinstance(42, int)      # True (ưa dùng hơn type())', tone: 'cyan' },
          { text: 'if result is None:       # LUÔN dùng is / is not None', tone: 'violet' },
          { text: 'int("3.5")               # ValueError! -> int(float("3.5"))', tone: 'amber' },
        ]}
      />

      {/* Right: Short-Circuit Logic & Truthy/Falsy */}
      <Panel x={448} y={54} w={418} h={312} title="Logic Đoản Mạch (Short-Circuit) & Bảng Falsy" tone="emerald" p={p} />
      <Callout x={846} y={66} n={2} tone="emerald" p={p} />

      <CodeBlock
        x={462}
        y={88}
        w={390}
        p={p}
        lines={[
          { text: '# Ưu tiên:  not   >   and   >   or', tone: 'muted' },
          { text: 'count > 0 and (total / count) > 5  # count=0 -> dừng an toàn!', tone: 'emerald' },
          { text: 'display = nickname or "Khách"      # trả giá trị thật đầu tiên', tone: 'cyan' },
        ]}
      />

      {/* Falsy vs Truthy visual */}
      <rect x={462} y={164} width={188} height={186} rx="8" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={556} y={184} textAnchor="middle" fill={p.rose} fontSize="11" fontWeight="700">FALSY (Coi như Sai)</text>
      <text x={476} y={206} fill={p.ink} fontSize="11" fontFamily={MONO}>• False, None</text>
      <text x={476} y={226} fill={p.ink} fontSize="11" fontFamily={MONO}>• 0, 0.0</text>
      <text x={476} y={246} fill={p.ink} fontSize="11" fontFamily={MONO}>• &quot;&quot; (chuỗi rỗng)</text>
      <text x={476} y={266} fill={p.rose} fontWeight="700" fontSize="11" fontFamily={MONO}>• [], {}, set(), ()</text>
      <text x={476} y={292} fill={p.inkSoft} fontSize="10">Khác JS: [] và {`{}`} trong</text>
      <text x={476} y={307} fill={p.inkSoft} fontSize="10">Python đều là FALSY!</text>
      <text x={476} y={332} fill={p.rose} fontSize="10" fontFamily={MONO}>bool(&quot;False&quot;) == True!</text>

      <rect x={664} y={164} width={188} height={186} rx="8" fill={p.emeraldBg} stroke={p.emeraldBorder} />
      <text x={758} y={184} textAnchor="middle" fill={p.emerald} fontSize="11" fontWeight="700">TRUTHY &amp; Bẫy Kinh Điển</text>
      <text x={676} y={206} fill={p.ink} fontSize="11" fontFamily={MONO}>• Số != 0 (-1, 3.14)</text>
      <text x={676} y={226} fill={p.ink} fontSize="11" fontFamily={MONO}>• Chuỗi khác rỗng &quot;0&quot;</text>
      <text x={676} y={246} fill={p.ink} fontSize="11" fontFamily={MONO}>• [0], {`{"a": 1}`}</text>
      <line x1={674} y1={262} x2={842} y2={262} stroke={p.emeraldBorder} />
      <text x={676} y={281} fill={p.rose} fontSize="10" fontFamily={MONO}>SAI: if x == &quot;a&quot; or &quot;b&quot;:</text>
      <text x={676} y={301} fill={p.emerald} fontSize="10" fontWeight="700" fontFamily={MONO}>ĐÚNG: if x in (&quot;a&quot;, &quot;b&quot;):</text>
      <text x={676} y={326} fill={p.inkSoft} fontSize="9.5">Vì &quot;b&quot; không rỗng luôn</text>
      <text x={676} y={340} fill={p.inkSoft} fontSize="9.5">là Truthy!</text>
    </Shell>
  );
};

/* ============================================================================
 * M01 — Name Tags (a, b) Bound to Heap Objects (id(), is vs ==, Mutable/Immutable)
 * ========================================================================== */
const PyM01: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm01';
  return (
    <Shell id={id} badge="PY:M01" title="Mô Hình Bộ Nhớ Python: Nhãn Tên (Name Tags) Trỏ Tới Object Trên Heap" rightNote="id() · is vs ==" isLight={isLight} className={className}>
      {/* Left: Namespace Frame (Name Tags) */}
      <Panel x={14} y={54} w={236} h={312} title="Namespace (Nhãn tên)" tone="cyan" p={p} />
      <Callout x={230} y={66} n={1} tone="cyan" p={p} />

      <Pill x={34} y={100} w={118} h={34} label="x" sub="rebind x = x + 1" tone="cyan" p={p} />
      <Pill x={34} y={168} w={118} h={34} label="a" sub="a = [1, 2]" tone="amber" p={p} />
      <Pill x={34} y={216} w={118} h={34} label="b" sub="b = a (cùng trỏ!)" tone="amber" p={p} />
      <Pill x={34} y={288} w={118} h={34} label="c" sub="c = [1, 2] (mới)" tone="emerald" p={p} />

      {/* Center: Heap Memory */}
      <Panel x={266} y={54} w={332} h={312} title="PyObject Heap (Kiểu gắn trên Object)" tone="violet" p={p} />
      <Callout x={578} y={66} n={2} tone="amber" p={p} />

      {/* Immutable int objects */}
      <rect x={286} y={88} width={136} height={34} rx="7" fill={p.bgSubtle} stroke={p.border} strokeDasharray="3 3" />
      <text x={354} y={109} textAnchor="middle" fill={p.inkMuted} fontSize="10.5" fontFamily={MONO}>int 10 (cũ)</text>

      <rect x={438} y={88} width={144} height={42} rx="7" fill={p.cyanBg} stroke={p.cyanBorder} />
      <text x={510} y={106} textAnchor="middle" fill={p.cyan} fontSize="11" fontWeight="700" fontFamily={MONO}>int 11 (Immutable)</text>
      <text x={510} y={121} textAnchor="middle" fill={p.inkMuted} fontSize="9.5" fontFamily={MONO}>id: 0x10a4</text>

      {/* Shared Mutable List */}
      <rect x={286} y={164} width={296} height={88} rx="8" fill={p.amberBg} stroke={p.amberBorder} strokeWidth="1.5" />
      <text x={300} y={184} fill={p.amber} fontSize="11" fontWeight="700" fontFamily={MONO}>list Object (Mutable) · id: 0x7f01</text>
      <rect x={300} y={194} width={56} height={28} rx="5" fill={p.panel} stroke={p.amberBorder} />
      <text x={328} y={212} textAnchor="middle" fill={p.ink} fontSize="11" fontFamily={MONO}>1</text>
      <rect x={364} y={194} width={56} height={28} rx="5" fill={p.panel} stroke={p.amberBorder} />
      <text x={392} y={212} textAnchor="middle" fill={p.ink} fontSize="11" fontFamily={MONO}>2</text>
      <rect x={428} y={194} width={76} height={28} rx="5" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={466} y={212} textAnchor="middle" fill={p.rose} fontSize="10.5" fontWeight="700" fontFamily={MONO}>+99 (b)</text>
      <text x={300} y={241} fill={p.inkSoft} fontSize="10">b.append(99) sửa tại chỗ -&gt; a cũng thấy [1, 2, 99]!</text>

      {/* Separate list for c */}
      <rect x={286} y={276} width={296} height={66} rx="8" fill={p.emeraldBg} stroke={p.emeraldBorder} />
      <text x={300} y={297} fill={p.emerald} fontSize="11" fontWeight="700" fontFamily={MONO}>list Object độc lập · id: 0x7f88</text>
      <text x={300} y={317} fill={p.inkSoft} fontSize="10.5" fontFamily={MONO}>[1, 2]  (cùng giá trị ban đầu, khác vùng nhớ)</text>

      {/* Pointers from Namespace to Heap */}
      <Arrow id={id} x1={154} y1={117} x2={434} y2={109} tone="cyan" p={p} />
      <Arrow id={id} x1={154} y1={185} x2={282} y2={195} tone="amber" p={p} />
      <Arrow id={id} x1={154} y1={233} x2={282} y2={215} tone="amber" p={p} />
      <Arrow id={id} x1={154} y1={305} x2={282} y2={305} tone="emerald" p={p} />

      {/* Right: == vs is */}
      <Panel x={614} y={54} w={252} h={312} title="Định danh (is) vs Giá trị (==)" tone="emerald" p={p} />
      <Callout x={846} y={66} n={3} tone="emerald" p={p} />
      <CodeBlock
        x={626}
        y={90}
        w={228}
        p={p}
        lines={[
          { text: '# a và b cùng 1 object:', tone: 'muted' },
          { text: 'a is b    # True (cùng id)', tone: 'amber' },
          { text: 'a == b    # True', tone: 'emerald' },
          { text: '', tone: 'muted' },
          { text: '# a và c khác vùng nhớ:', tone: 'muted' },
          { text: 'c == [1, 2] # True (giá trị)', tone: 'emerald' },
          { text: 'a is c      # False!', tone: 'rose' },
        ]}
      />
      <rect x={626} y={240} width={228} height={112} rx="8" fill={p.violetBg} stroke={p.violetBorder} />
      <text x={638} y={260} fill={p.violet} fontSize="11" fontWeight="700">Quy tắc Vàng Python:</text>
      <text x={638} y={280} fill={p.inkSoft} fontSize="10.5">• So sánh giá trị: dùng ==</text>
      <text x={638} y={298} fill={p.inkSoft} fontSize="10.5">• Kiểm tra None: x is None</text>
      <text x={638} y={316} fill={p.inkSoft} fontSize="10.5">• Immutable: int, str, tuple</text>
      <text x={638} y={334} fill={p.inkSoft} fontSize="10.5">• Mutable: list, dict, set</text>
    </Shell>
  );
};

/* ============================================================================
 * M02 — Dual Positive/Negative Index Ruler, Slicing s[start:stop:step] & Immutable str
 * ========================================================================== */
const PyM02: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm02';
  const chars = ['P', 'Y', 'T', 'H', 'O', 'N'];
  return (
    <Shell id={id} badge="PY:M02" title="Thước Chỉ Số Kép (0..n-1 & -n..-1), Cắt Lát Slicing & Chuỗi Bất Biến" rightNote="s[start:stop:step]" isLight={isLight} className={className}>
      {/* Top: Dual Index Ruler */}
      <Panel x={14} y={54} w={852} h={154} title='Thước chỉ số 2 chiều của s = "PYTHON" (len = 6) & Ranh giới cắt s[1:4] -> "YTH"' tone="cyan" p={p} />
      <Callout x={846} y={66} n={1} tone="cyan" p={p} />

      <text x={32} y={108} fill={p.cyan} fontSize="10.5" fontWeight="700" fontFamily={MONO}>Chỉ số dương:</text>
      <text x={32} y={145} fill={p.ink} fontSize="11" fontWeight="700" fontFamily={MONO}>s = &quot;PYTHON&quot;</text>
      <text x={32} y={182} fill={p.violet} fontSize="10.5" fontWeight="700" fontFamily={MONO}>Chỉ số âm:</text>

      {/* Highlight slice [1:4] */}
      <rect x={256} y={90} width={258} height={104} rx="8" fill={p.emeraldBg} stroke={p.emeraldBorder} strokeDasharray="4 3" />
      <text x={385} y={203} textAnchor="middle" fill={p.emerald} fontSize="10" fontWeight="700" fontFamily={MONO}>
        s[1:4] lấy 1, 2, 3 (dừng TRƯỚC stop=4)
      </text>

      {chars.map((ch, i) => {
        const cx = 170 + i * 86;
        const inSlice = i >= 1 && i < 4;
        return (
          <g key={i}>
            <text x={cx + 36} y={108} textAnchor="middle" fill={p.cyan} fontSize="11.5" fontWeight="700" fontFamily={MONO}>
              {i}
            </text>
            <rect
              x={cx}
              y={116}
              width={72}
              height={42}
              rx="7"
              fill={inSlice ? p.panel : p.codeBg}
              stroke={inSlice ? p.emerald : p.borderStrong}
              strokeWidth={inSlice ? 2 : 1.2}
            />
            <text x={cx + 36} y={143} textAnchor="middle" fill={inSlice ? p.emerald : p.ink} fontSize="16" fontWeight="800" fontFamily={MONO}>
              {ch}
            </text>
            <text x={cx + 36} y={182} textAnchor="middle" fill={p.violet} fontSize="11.5" fontWeight="700" fontFamily={MONO}>
              {i - 6}
            </text>
          </g>
        );
      })}

      <text x={715} y={132} fill={p.inkSoft} fontSize="10.5" fontFamily={MONO}>s[0]  == &quot;P&quot;</text>
      <text x={715} y={150} fill={p.violet} fontSize="10.5" fontFamily={MONO}>s[-1] == &quot;N&quot; (cuối)</text>
      <text x={715} y={168} fill={p.amber} fontSize="10.5" fontFamily={MONO}>s[::-1] == &quot;NOHTYP&quot;</text>

      {/* Bottom Left: Slicing recipes */}
      <Panel x={14} y={220} w={422} h={146} title="Vũ khí Slicing s[start : stop : step]" tone="emerald" p={p} />
      <Callout x={416} y={232} n={2} tone="emerald" p={p} />
      <CodeBlock
        x={28}
        y={252}
        w={394}
        p={p}
        lines={[
          { text: 's[:3]    -> "PYT"     |  s[3:]   -> "HON"', tone: 'cyan' },
          { text: 's[::2]   -> "PTO"     |  s[::-1] -> đảo ngược chuỗi', tone: 'emerald' },
          { text: 's[0:999] -> "PYTHON"  # slicing vượt biên KHÔNG lỗi!', tone: 'amber' },
          { text: '" - ".join(["a", "b"]) -> "a - b"  (ngược với JS)', tone: 'violet' },
        ]}
      />

      {/* Bottom Right: Immutability & f-string */}
      <Panel x={448} y={220} w={418} h={146} title="Chuỗi Bất Biến (Immutable) & Định Dạng f-string" tone="amber" p={p} />
      <Callout x={846} y={232} n={3} tone="amber" p={p} />
      <CodeBlock
        x={462}
        y={252}
        w={390}
        p={p}
        lines={[
          { text: 's[0] = "J"              # TypeError! Không sửa tại chỗ', tone: 'rose' },
          { text: 's2 = "J" + s[1:]        # Tạo chuỗi mới -> "JYTHON"', tone: 'emerald' },
          { text: 'f"{pi:.2f} | {n:,}"     # "3.14 | 1,000,000"', tone: 'cyan' },
          { text: 'f"{x=}"                 # "x=42" (debug siêu tốc)', tone: 'amber' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M29 — Decision Branching Waterfall (if / elif / else) & Order Sensitivity
 * ========================================================================== */
const PyM29: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm29';
  return (
    <Shell id={id} badge="PY:M29" title="Thác Rẽ Nhánh if / elif / else: Khớp Đầu Tiên Thắng & Return Sớm" rightNote="First-Match Wins · Guard Clause" isLight={isLight} className={className}>
      {/* Left: Waterfall Flowchart */}
      <Panel x={14} y={54} w={468} h={312} title="Thác kiểm tra từ trên xuống (Chỉ chạy ĐÚNG 1 nhánh đầu tiên True)" tone="cyan" p={p} />
      <Callout x={462} y={66} n={1} tone="cyan" p={p} />

      {/* Input */}
      <Pill x={32} y={92} w={110} h={32} label="score = 85" tone="cyan" p={p} />
      <Arrow id={id} x1={87} y1={124} x2={87} y2={146} tone="cyan" p={p} />

      {/* Condition 1 */}
      <Pill x={32} y={148} w={164} h={36} label="if score >= 90:" tone="muted" p={p} />
      <Arrow id={id} x1={196} y1={166} x2={278} y2={166} tone="muted" dashed p={p} label="True (bỏ qua)" />
      <Pill x={282} y={148} w={178} h={36} label='return "Xuất sắc"' tone="muted" p={p} />

      <Arrow id={id} x1={87} y1={184} x2={87} y2={208} tone="amber" p={p} label="False" />

      {/* Condition 2 (MATCH!) */}
      <Pill x={32} y={210} w={164} h={40} label="elif score >= 80:" tone="emerald" p={p} />
      <Arrow id={id} x1={196} y1={230} x2={278} y2={230} tone="emerald" p={p} label="True -> CHỌN!" />
      <Pill x={282} y={210} w={178} h={40} label='return "Giỏi"' sub="Thoát khối if ngay!" tone="emerald" p={p} />

      <Arrow id={id} x1={87} y1={250} x2={87} y2={276} tone="muted" dashed p={p} label="không xét nữa" />

      {/* Condition 3 & else */}
      <Pill x={32} y={278} w={164} h={32} label="elif score >= 50:" tone="muted" p={p} />
      <Pill x={32} y={320} w={164} h={32} label="else: (mặc định)" tone="muted" p={p} />
      <text x={212} y={302} fill={p.rose} fontSize="10.5" fontWeight="600">Bẫy thứ tự: nếu đặt score &gt;= 50</text>
      <text x={212} y={318} fill={p.rose} fontSize="10.5" fontWeight="600">lên đầu, điểm 95 sẽ bị xếp &quot;Đạt&quot;!</text>

      {/* Right: Chained Comparisons, Guard Clauses & Ternary */}
      <Panel x={494} y={54} w={372} h={150} title="So sánh kẹp giữa & Guard Clause (Return sớm)" tone="emerald" p={p} />
      <Callout x={846} y={66} n={2} tone="emerald" p={p} />
      <CodeBlock
        x={508}
        y={86}
        w={344}
        p={p}
        lines={[
          { text: '# Python cho phép kẹp toán học tự nhiên:', tone: 'muted' },
          { text: 'if 18 <= age <= 65:     # thay cho age>=18 and age<=65', tone: 'emerald' },
          { text: '# Guard clause giảm lồng nhau (phẳng, dễ đọc):', tone: 'muted' },
          { text: 'if not user: return "Chưa đăng nhập"', tone: 'cyan' },
          { text: 'if not user.active: return "Bị khoá"', tone: 'cyan' },
        ]}
      />

      <Panel x={494} y={216} w={372} h={150} title="Toán tử 3 ngôi & Cú pháp = vs ==" tone="amber" p={p} />
      <Callout x={846} y={228} n={3} tone="amber" p={p} />
      <CodeBlock
        x={508}
        y={248}
        w={344}
        p={p}
        lines={[
          { text: '# Biểu thức điều kiện 1 dòng (thay ? : của JS):', tone: 'muted' },
          { text: 'tag = "chẵn" if n % 2 == 0 else "lẻ"', tone: 'amber' },
          { text: '', tone: 'muted' },
          { text: 'if x = 5:   # SyntaxError! (= là gán, == mới là so sánh)', tone: 'rose' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M30 — for item in iterable (range, accumulator) vs while Condition + break/continue
 * ========================================================================== */
const PyM30: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm30';
  return (
    <Shell id={id} badge="PY:M30" title="Vòng Lặp for (Duyệt Dãy Biết Trước) vs while (Lặp Theo Điều Kiện) & break/continue" rightNote="range() · break · continue" isLight={isLight} className={className}>
      {/* Left: for + range + accumulator */}
      <Panel x={14} y={54} w={426} h={312} title="for x in range(start, stop, step): Dừng TRƯỚC stop" tone="cyan" p={p} />
      <Callout x={420} y={66} n={1} tone="cyan" p={p} />

      {/* range(1, 9, 2) boxes */}
      <text x={30} y={98} fill={p.cyan} fontSize="11" fontWeight="700" fontFamily={MONO}>range(1, 9, 2)  -&gt;  sinh lần lượt:</text>
      {[1, 3, 5, 7].map((v, i) => (
        <g key={v}>
          <rect x={30 + i * 76} y={108} width={60} height={34} rx="7" fill={p.cyanBg} stroke={p.cyanBorder} />
          <text x={60 + i * 76} y={130} textAnchor="middle" fill={p.cyan} fontSize="13" fontWeight="800" fontFamily={MONO}>
            {v}
          </text>
          {i < 3 && <Arrow id={id} x1={92 + i * 76} y1={125} x2={104 + i * 76} y2={125} tone="cyan" p={p} />}
        </g>
      ))}
      <rect x={338} y={108} width={86} height={34} rx="7" fill={p.roseBg} stroke={p.roseBorder} strokeDasharray="3 3" />
      <text x={381} y={129} textAnchor="middle" fill={p.rose} fontSize="11" fontWeight="700" fontFamily={MONO}>9 (DỪNG)</text>

      {/* Accumulator Trace */}
      <text x={30} y={168} fill={p.emerald} fontSize="11" fontWeight="700">Mẫu Tích Luỹ (Accumulator Pattern):</text>
      <CodeBlock
        x={30}
        y={176}
        w={394}
        p={p}
        lines={[
          { text: 'total = 0                  # 1. Khởi tạo NGOÀI vòng lặp', tone: 'amber' },
          { text: 'for x in [10, 20, 5]:', tone: 'cyan' },
          { text: '    total += x             # 2. Cộng dồn: 0 -> 10 -> 30 -> 35', tone: 'emerald' },
          { text: 'return total               # 3. Trả kết quả sau khi lặp xong', tone: 'cyan' },
        ]}
      />
      <text x={30} y={278} fill={p.inkSoft} fontSize="10.5" fontFamily={MONO}>range(5) -&gt; 0, 1, 2, 3, 4   |   range(5, 0, -1) -&gt; 5, 4, 3, 2, 1</text>
      <rect x={30} y={292} width={394} height={58} rx="7" fill={p.amberBg} stroke={p.amberBorder} />
      <text x={42} y={313} fill={p.amber} fontSize="10.5" fontWeight="700">Bẫy hay gặp: Đặt total = 0 BÊN TRONG vòng for</text>
      <text x={42} y={331} fill={p.inkSoft} fontSize="10.5">-&gt; Mỗi vòng bị xoá sạch về 0, chỉ còn giá trị cuối!</text>

      {/* Right: while guard + break / continue */}
      <Panel x={452} y={54} w={414} h={312} title="while Điều_Kiện & Điều hướng luồng break / continue" tone="violet" p={p} />
      <Callout x={846} y={66} n={2} tone="violet" p={p} />

      <Pill x={470} y={92} w={174} h={36} label="while n > 0:" sub="Kiểm tra trước mỗi vòng" tone="violet" p={p} />
      <Arrow id={id} x1={557} y1={128} x2={557} y2={154} tone="emerald" p={p} label="True" />
      <Arrow id={id} x1={644} y1={110} x2={718} y2={110} tone="muted" p={p} label="False" />
      <Pill x={722} y={92} w={128} h={36} label="Kết thúc lặp" tone="muted" p={p} />

      {/* Loop Body Box */}
      <rect x={470} y={156} width={236} height={122} rx="9" fill={p.codeBg} stroke={p.violetBorder} />
      <text x={484} y={178} fill={p.amber} fontSize="10.5" fontWeight="700" fontFamily={MONO}>if skip: continue</text>
      <text x={484} y={202} fill={p.rose} fontSize="10.5" fontWeight="700" fontFamily={MONO}>if found: break</text>
      <text x={484} y={228} fill={p.ink} fontSize="10.5" fontFamily={MONO}>process(n)</text>
      <text x={484} y={252} fill={p.emerald} fontSize="10.5" fontWeight="700" fontFamily={MONO}>n -= 1  # tiến tới dừng!</text>

      {/* Continue loops back up */}
      <path
        d="M 470 174 C 454 174, 454 110, 470 110"
        fill="none"
        stroke={p.amber}
        strokeWidth="1.8"
        markerEnd={`url(#arr-amber-${id})`}
      />
      {/* Break jumps right */}
      <Arrow id={id} x1={706} y1={198} x2={756} y2={198} tone="rose" p={p} label="break" />
      <Pill x={760} y={180} w={92} h={36} label="Thoát hẳn" tone="rose" p={p} />

      <Callout x={474} y={306} n={3} tone="rose" p={p} />
      <rect x={494} y={292} width={356} height={58} rx="7" fill={p.bgSubtle} stroke={p.border} />
      <text x={506} y={313} fill={p.amber} fontSize="10.5" fontWeight="700">continue: bỏ phần dưới, nhảy sang lượt kế tiếp</text>
      <text x={506} y={332} fill={p.rose} fontSize="10.5" fontWeight="700">break: thoát ngay khỏi vòng lặp (nhớ cập nhật biến while!)</text>
    </Shell>
  );
};

/* ============================================================================
 * M03 — Structural match / case, Parallel zip()/enumerate() & for...else Clause
 * ========================================================================== */
const PyM03: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm03';
  return (
    <Shell id={id} badge="PY:M03" title="Structural Pattern Matching (match/case), zip/enumerate & Đặc Sản for...else" rightNote="Py 3.10+ match · zip · for-else" isLight={isLight} className={className}>
      {/* Left: Structural match/case */}
      <Panel x={14} y={54} w={418} h={312} title="match / case: Phân rã cấu trúc + Không bao giờ fall-through" tone="violet" p={p} />
      <Callout x={412} y={66} n={1} tone="violet" p={p} />

      <CodeBlock
        x={28}
        y={88}
        w={390}
        p={p}
        lines={[
          { text: 'match command.split():', tone: 'violet' },
          { text: '    case ["quit" | "exit"]:', tone: 'cyan' },
          { text: '        stop()                 # tự dừng, không cần break!', tone: 'muted' },
          { text: '    case ["move", x, y] if int(x) >= 0:', tone: 'emerald' },
          { text: '        go(int(x), int(y))     # bắt biến x, y + guard if', tone: 'emerald' },
          { text: '    case {"status": 200, "data": items}:', tone: 'amber' },
          { text: '        render(items)          # khớp cả cấu trúc dict!', tone: 'amber' },
          { text: '    case _:', tone: 'rose' },
          { text: '        unknown()              # _ là wildcard mặc định', tone: 'muted' },
        ]}
      />
      <text x={28} y={278} fill={p.inkSoft} fontSize="10.5">Mạnh hơn switch(JS): vừa kiểm tra hình dáng tuple/list/dict,</text>
      <text x={28} y={295} fill={p.inkSoft} fontSize="10.5">vừa gán biến cục bộ ngay trong mẫu khớp.</text>
      <Pill x={28} y={310} w={390} h={40} label='for...in Python luôn duyệt GIÁ TRỊ (như JS for...of)' sub='Không bao giờ là chỉ số chuỗi như JS for...in!' tone="cyan" mono={false} p={p} />

      {/* Right Top: enumerate + zip */}
      <Panel x={444} y={54} w={422} h={148} title="Duyệt chuẩn Pythonic: enumerate() & zip() song song" tone="cyan" p={p} />
      <Callout x={846} y={66} n={2} tone="cyan" p={p} />

      {/* Visual zip pairing */}
      <Pill x={460} y={90} w={118} h={28} label='names = ["An","Bo"]' tone="cyan" p={p} />
      <Pill x={460} y={126} w={118} h={28} label="scores = [95, 88]" tone="emerald" p={p} />
      <Arrow id={id} x1={582} y1={104} x2={620} y2={116} tone="cyan" p={p} />
      <Arrow id={id} x1={582} y1={140} x2={620} y2={126} tone="emerald" p={p} />
      <Pill x={624} y={102} w={226} h={38} label='zip -> ("An",95), ("Bo",88)' sub="Dừng ở dãy ngắn nhất" tone="amber" p={p} />

      <text x={460} y={184} fill={p.ink} fontSize="10.5" fontFamily={MONO}>
        for i, v in enumerate(seq, start=1):  # thay range(len(seq))
      </text>

      {/* Right Bottom: for ... else */}
      <Panel x={444} y={214} w={422} h={152} title="Đặc sản for ... else: else = Không gặp break!" tone="emerald" p={p} />
      <Callout x={846} y={226} n={3} tone="emerald" p={p} />

      <CodeBlock
        x={458}
        y={246}
        w={236}
        p={p}
        lines={[
          { text: 'for d in range(2, n):', tone: 'cyan' },
          { text: '    if n % d == 0:', tone: 'amber' },
          { text: '        break   # thấy ước!', tone: 'rose' },
          { text: 'else:', tone: 'emerald' },
          { text: '    is_prime = True', tone: 'emerald' },
        ]}
      />
      <Pill x={706} y={252} w={146} h={42} label="Có break" sub="BỎ QUA khối else" tone="rose" p={p} />
      <Pill x={706} y={306} w={146} h={42} label="Hết vòng tự nhiên" sub="CHẠY khối else" tone="emerald" p={p} />
    </Shell>
  );
};

/* ============================================================================
 * M04 — Dynamic Array list + Shallow Copy Nested Trap vs deepcopy & Immutable tuple
 * ========================================================================== */
const PyM04: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm04';
  return (
    <Shell id={id} badge="PY:M04" title="Cấu Trúc Bộ Nhớ List/Tuple & Bẫy Sao Chép Nông (Shallow Copy) vs Deepcopy" rightNote="list O(1) append · deepcopy · tuple" isLight={isLight} className={className}>
      {/* Top: Dynamic Array Over-allocation vs Tuple */}
      <Panel x={14} y={54} w={852} h={124} title="PyListObject (Mảng con trỏ cấp phát dư để append O(1)) vs PyTupleObject (Cố định, bất biến, làm key dict được)" tone="cyan" p={p} />
      <Callout x={846} y={66} n={1} tone="cyan" p={p} />

      <text x={28} y={102} fill={p.cyan} fontSize="10.5" fontWeight="700" fontFamily={MONO}>list [10, 20, 30] (capacity=6):</text>
      {[10, 20, 30, null, null, null].map((v, i) => (
        <g key={i}>
          <rect
            x={28 + i * 62}
            y={112}
            width={56}
            height={36}
            rx="6"
            fill={v !== null ? p.cyanBg : p.bgSubtle}
            stroke={v !== null ? p.cyanBorder : p.border}
            strokeDasharray={v === null ? '3 3' : undefined}
          />
          <text
            x={56 + i * 62}
            y={135}
            textAnchor="middle"
            fill={v !== null ? p.cyan : p.inkMuted}
            fontSize="11"
            fontWeight="700"
            fontFamily={MONO}
          >
            {v !== null ? v : 'trống'}
          </text>
        </g>
      ))}
      <text x={28} y={166} fill={p.inkSoft} fontSize="10">Dự phòng ô trống -&gt; append/pop cuối O(1) | sort() tại chỗ trả về None!</text>

      <line x1={436} y1={86} x2={436} y2={166} stroke={p.border} />

      <text x={452} y={102} fill={p.violet} fontSize="10.5" fontWeight="700" fontFamily={MONO}>tuple (21.02, 105.85) — Bất biến &amp; Unpacking:</text>
      <Pill x={452} y={112} w={184} h={36} label="(21.02, 105.85)" sub="Gọn nhẹ, hashable" tone="violet" p={p} />
      <Pill x={648} y={112} w={202} h={36} label="head, *mid, last = seq" sub="Extended Unpacking" tone="emerald" p={p} />
      <text x={452} y={166} fill={p.amber} fontSize="10" fontFamily={MONO}>Chú ý tuple 1 phần tử: PHẢI có dấu phẩy (42,) — (42) chỉ là số 42!</text>

      {/* Bottom Left: Shallow Copy Trap */}
      <Panel x={14} y={190} w={448} h={176} title="BẪY Shallow Copy (b = a[:] / a.copy()) & [[0]*3]*3" tone="rose" p={p} />
      <Callout x={442} y={202} n={2} tone="rose" p={p} />

      <Pill x={30} y={232} w={106} h={32} label="a = [[1, 2]]" tone="cyan" p={p} />
      <Pill x={30} y={282} w={106} h={32} label="b = a[:]" tone="amber" p={p} />
      <Arrow id={id} x1={138} y1={248} x2={208} y2={266} tone="rose" p={p} />
      <Arrow id={id} x1={138} y1={298} x2={208} y2={278} tone="rose" p={p} />

      <rect x={212} y={244} width={232} height={58} rx="8" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={328} y={266} textAnchor="middle" fill={p.rose} fontSize="11" fontWeight="700" fontFamily={MONO}>
        Dùng CHUNG list con [1, 2]!
      </text>
      <text x={328} y={286} textAnchor="middle" fill={p.inkSoft} fontSize="10" fontFamily={MONO}>
        b[0].append(99) -&gt; a[0] bị đổi theo!
      </text>
      <text x={30} y={346} fill={p.rose} fontSize="10" fontFamily={MONO}>
        SAI: grid = [[0]*3]*3  (3 hàng trỏ cùng 1 list!)
      </text>

      {/* Bottom Right: Deepcopy & Safe 2D Grid */}
      <Panel x={474} y={190} w={392} h={176} title="CHUẨN: copy.deepcopy() & List Comprehension 2D" tone="emerald" p={p} />
      <Callout x={846} y={202} n={3} tone="emerald" p={p} />
      <CodeBlock
        x={488}
        y={224}
        w={364}
        p={p}
        lines={[
          { text: 'import copy', tone: 'muted' },
          { text: 'b = copy.deepcopy(a)   # nhân bản đệ quy mọi tầng', tone: 'emerald' },
          { text: '', tone: 'muted' },
          { text: '# Tạo bảng 2 chiều ĐỘC LẬP từng hàng:', tone: 'muted' },
          { text: 'grid = [[0] * 3 for _ in range(3)]', tone: 'cyan' },
          { text: 'new_ls = sorted(ls)    # trả list mới, giữ nguyên ls', tone: 'amber' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M05 — Open-Addressing Compact Hash Table (dict O(1)) & Set Algebra
 * ========================================================================== */
const PyM05: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm05';
  return (
    <Shell id={id} badge="PY:M05" title="Giải Phẫu CPython Compact Dict: Băm O(1) & Bảo Toàn Thứ Tự Chèn" rightNote="hash(key) -> O(1) · set" isLight={isLight} className={className}>
      {/* Top: Hash -> Sparse Index -> Dense Entries */}
      <Panel x={14} y={54} w={852} h={176} title='Kiến trúc Bảng Băm 2 Tầng của Python 3.7+ (Vừa tra cứu O(1), vừa giữ đúng thứ tự chèn)' tone="cyan" p={p} />
      <Callout x={846} y={66} n={1} tone="cyan" p={p} />

      {/* Step 1: Key -> Hash */}
      <Pill x={28} y={102} w={132} h={42} label='key = "son"' sub="Immutable & Hashable" tone="cyan" p={p} />
      <Arrow id={id} x1={164} y1={123} x2={206} y2={123} tone="cyan" p={p} label="hash()" />

      <Pill x={210} y={102} w={132} h={42} label="0x5a91...05" sub="slot = hash & 7 -> 5" tone="violet" p={p} />
      <Arrow id={id} x1={346} y1={123} x2={388} y2={148} tone="violet" p={p} />

      {/* Step 2: Sparse Indices */}
      <text x={392} y={96} fill={p.violet} fontSize="10" fontWeight="700" fontFamily={MONO}>dk_indices (Thưa)</text>
      {['-1', '1', '-1', '0', '-1', '2', '-1', '-1'].map((val, idx) => {
        const active = idx === 5;
        return (
          <g key={idx}>
            <rect
              x={392 + (idx % 4) * 38}
              y={104 + Math.floor(idx / 4) * 36}
              width={34}
              height={30}
              rx="5"
              fill={active ? p.violetBg : p.codeBg}
              stroke={active ? p.violet : p.border}
              strokeWidth={active ? 1.8 : 1}
            />
            <text
              x={409 + (idx % 4) * 38}
              y={123 + Math.floor(idx / 4) * 36}
              textAnchor="middle"
              fill={active ? p.violet : p.inkMuted}
              fontSize="10.5"
              fontWeight="700"
              fontFamily={MONO}
            >
              {val}
            </text>
          </g>
        );
      })}
      <text x={392} y={194} fill={p.inkMuted} fontSize="9.5">slot[5] lưu chỉ số 2</text>

      <Arrow id={id} x1={546} y1={155} x2={588} y2={175} tone="emerald" p={p} label="idx=2" />

      {/* Step 3: Dense Entries */}
      <text x={592} y={96} fill={p.emerald} fontSize="10" fontWeight="700" fontFamily={MONO}>dk_entries (Đặt khít theo thứ tự chèn)</text>
      {[
        { idx: 0, h: '0x91..', k: '"an"', v: '95', hit: false },
        { idx: 1, h: '0x2c..', k: '"bo"', v: '88', hit: false },
        { idx: 2, h: '0x5a..', k: '"son"', v: '100', hit: true },
      ].map((row, r) => (
        <g key={r}>
          <rect
            x={592}
            y={104 + r * 30}
            width={256}
            height={26}
            rx="5"
            fill={row.hit ? p.emeraldBg : p.codeBg}
            stroke={row.hit ? p.emerald : p.border}
          />
          <text x={602} y={121 + r * 30} fill={row.hit ? p.emerald : p.inkSoft} fontSize="10.5" fontFamily={MONO}>
            [{row.idx}] {row.h} | {row.k.padEnd(6)} : {row.v}
          </text>
        </g>
      ))}
      <text x={30} y={172} fill={p.rose} fontSize="10" fontFamily={MONO}>Key phải bất biến: str, int, tuple OK</text>
      <text x={30} y={190} fill={p.rose} fontSize="10" fontFamily={MONO}>list làm key -&gt; TypeError: unhashable!</text>

      {/* Bottom Left: Safe Dict Ops & Counter */}
      <Panel x={14} y={242} w={430} h={124} title="Thao tác Dict an toàn & collections.Counter" tone="amber" p={p} />
      <Callout x={424} y={254} n={2} tone="amber" p={p} />
      <CodeBlock
        x={28}
        y={274}
        w={402}
        p={p}
        lines={[
          { text: 'd.get("missing", 0)        # trả 0 thay vì nổ KeyError!', tone: 'emerald' },
          { text: 'merged = d1 | d2           # gộp dict (Python 3.9+)', tone: 'cyan' },
          { text: 'Counter("abracadabra")     # đếm tần suất tự động O(n)', tone: 'amber' },
        ]}
      />

      {/* Bottom Right: Set O(1) Membership & Set Algebra */}
      <Panel x={456} y={242} w={410} h={124} title="set: Kiểm tra x in s O(1) & Đại số Tập hợp" tone="emerald" p={p} />
      <Callout x={846} y={254} n={3} tone="emerald" p={p} />
      <CodeBlock
        x={470}
        y={274}
        w={382}
        p={p}
        lines={[
          { text: 'empty_set = set()          # CHÚ Ý: {} là dict rỗng!', tone: 'rose' },
          { text: 'a | b (hợp)  ·  a & b (giao)  ·  a - b (hiệu)  ·  a ^ b', tone: 'emerald' },
          { text: 'x in my_set                # O(1) nhanh gấp nghìn lần list', tone: 'cyan' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M06 — Comprehension Pipeline [expr for x in seq if cond] & Lazy Built-ins
 * ========================================================================== */
const PyM06: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm06';
  return (
    <Shell id={id} badge="PY:M06" title="Đường Ống Comprehension (for -> if -> expr) & Tổ Hợp Hàm Dựng Sẵn" rightNote="List/Dict/Set Comp · GenExpr" isLight={isLight} className={className}>
      {/* Top: 3-Stage Comprehension Pipeline */}
      <Panel x={14} y={54} w={852} h={158} title="Giải phẫu thứ tự thực thi: [ x * 10   for x in [1, 2, 3, 4]   if x % 2 == 1 ]  ->  [10, 30]" tone="cyan" p={p} />
      <Callout x={846} y={66} n={1} tone="cyan" p={p} />

      {/* Syntax Color Mapping */}
      <Pill x={28} y={96} w={184} h={52} label="① for x in [1, 2, 3, 4]" sub="Bước 1: Nguồn duyệt (Source)" tone="cyan" p={p} />
      <Arrow id={id} x1={216} y1={122} x2={258} y2={122} tone="cyan" p={p} label="1,2,3,4" />

      <Pill x={262} y={96} w={188} h={52} label="② if x % 2 == 1" sub="Bước 2: Màng lọc (Filter)" tone="amber" p={p} />
      <Arrow id={id} x1={454} y1={122} x2={498} y2={122} tone="amber" p={p} label="1, 3" />

      <Pill x={502} y={96} w={172} h={52} label="③ x * 10" sub="Bước 3: Biến đổi (Map)" tone="emerald" p={p} />
      <Arrow id={id} x1={678} y1={122} x2={716} y2={122} tone="emerald" p={p} />

      <Pill x={720} y={96} w={132} h={52} label="[10, 30]" sub="Kết quả gọn 1 dòng" tone="violet" p={p} />

      <text x={28} y={176} fill={p.inkSoft} fontSize="10.5" fontFamily={MONO}>
        Thay thế gọn cả .filter().map() của JS!   |   Dict comp: {`{k: v for k, v in pairs}`}   |   Set comp: {`{x.lower() for x in words}`}
      </text>
      <text x={28} y={196} fill={p.amber} fontSize="10" fontFamily={MONO}>
        Mẹo: Lọc phần tử -&gt; if đặt CUỐI. Đổi giá trị 2 nhánh -&gt; [(&quot;chẵn&quot; if x%2==0 else &quot;lẻ&quot;) for x in nums] đặt TRƯỚC for!
      </text>

      {/* Bottom Left: Generator Expression vs List Comp */}
      <Panel x={14} y={224} w={420} h={142} title="Generator Expression (...) — Không tạo List trung gian" tone="emerald" p={p} />
      <Callout x={414} y={236} n={2} tone="emerald" p={p} />
      <CodeBlock
        x={28}
        y={256}
        w={392}
        p={p}
        lines={[
          { text: '# Ngoặc tròn () tính cuốn chiếu từng phần tử (RAM O(1)):', tone: 'muted' },
          { text: 'total = sum(x * x for x in range(10_000_000))', tone: 'emerald' },
          { text: 'has_admin = any(u.role == "admin" for u in users)', tone: 'cyan' },
          { text: 'first_hit = next((x for x in items if x > 90), None)', tone: 'amber' },
        ]}
      />

      {/* Bottom Right: Power Built-ins */}
      <Panel x={446} y={224} w={420} h={142} title="Hộp đồ nghề Built-ins chuẩn Pythonic" tone="violet" p={p} />
      <Callout x={846} y={236} n={3} tone="violet" p={p} />
      <CodeBlock
        x={460}
        y={256}
        w={392}
        p={p}
        lines={[
          { text: 'any(conds)  # ~= Array.some   (dừng ngay khi gặp True)', tone: 'cyan' },
          { text: 'all(conds)  # ~= Array.every  (CHÚ Ý: all([]) == True!)', tone: 'amber' },
          { text: 'max(users, key=lambda u: u["score"], default=None)', tone: 'emerald' },
          { text: 'sorted(words, key=len, reverse=True)', tone: 'violet' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M31 — Guarding Risky Operations with try / except / else / finally
 * ========================================================================== */
const PyM31: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm31';
  return (
    <Shell id={id} badge="PY:M31" title="Lưới Bảo Hộ try / except: Chuyển Đổi Dữ Liệu An Toàn Không Sập Chương Trình" rightNote="try · except · else · finally" isLight={isLight} className={className}>
      {/* Left: Visual Flow Diagram */}
      <Panel x={14} y={54} w={456} h={312} title="Luồng rẽ nhánh khi thực thi lệnh có nguy cơ nổ lỗi" tone="cyan" p={p} />
      <Callout x={450} y={66} n={1} tone="cyan" p={p} />

      <Pill x={152} y={88} w={180} h={42} label='try: n = int(raw)' sub="Thử lệnh nguy hiểm" tone="cyan" p={p} />

      {/* Left branch: Error */}
      <Arrow id={id} x1={188} y1={130} x2={116} y2={170} tone="rose" p={p} label="Có lỗi!" />
      <Pill x={30} y={172} w={184} h={52} label="except ValueError:" sub="Bắt ĐÚNG loại lỗi dự kiến" tone="rose" p={p} />

      {/* Right branch: Success */}
      <Arrow id={id} x1={296} y1={130} x2={364} y2={170} tone="emerald" p={p} label="Êm xuôi" />
      <Pill x={270} y={172} w={184} h={52} label="else: return 100 / n" sub="Chỉ chạy khi try KHÔNG lỗi" tone="emerald" p={p} />

      {/* Both merge to finally */}
      <Arrow id={id} x1={122} y1={224} x2={206} y2={266} tone="amber" p={p} />
      <Arrow id={id} x1={362} y1={224} x2={278} y2={266} tone="amber" p={p} />
      <Pill x={136} y={268} w={212} h={44} label="finally: cleanup()" sub="LUÔN chạy dù lỗi hay return" tone="amber" p={p} />

      <text x={30} y={342} fill={p.inkSoft} fontSize="10.5">Chương trình tiếp tục sống bình thường thay vì dừng đột ngột.</text>

      {/* Right: Safe Patterns & Golden Rules */}
      <Panel x={482} y={54} w={384} h={154} title="Mẫu thực chiến: Parse an toàn & Hỏi lại tới khi đúng" tone="emerald" p={p} />
      <Callout x={846} y={66} n={2} tone="emerald" p={p} />
      <CodeBlock
        x={496}
        y={86}
        w={356}
        p={p}
        lines={[
          { text: 'def safe_int(text, default=0):', tone: 'cyan' },
          { text: '    try:', tone: 'cyan' },
          { text: '        return int(text)', tone: 'emerald' },
          { text: '    except (ValueError, TypeError):', tone: 'amber' },
          { text: '        return default', tone: 'amber' },
        ]}
      />

      <Panel x={482} y={220} w={384} h={146} title="Nguyên tắc vàng: Tự ném lỗi raise & Cấm nuốt lỗi!" tone="rose" p={p} />
      <Callout x={846} y={232} n={3} tone="rose" p={p} />
      <CodeBlock
        x={496}
        y={252}
        w={356}
        p={p}
        lines={[
          { text: 'if age < 0:', tone: 'amber' },
          { text: '    raise ValueError("Tuổi không được âm")', tone: 'rose' },
          { text: '# CẤM VIẾT: except: pass  (che giấu cả NameError/bug!)', tone: 'rose' },
          { text: '# Đặt khối try NGẮN nhất quanh đúng dòng có nguy cơ.', tone: 'muted' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M32 — Standard Library Toolbox & import Namespace Styles
 * ========================================================================== */
const PyM32: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm32';
  return (
    <Shell id={id} badge="PY:M32" title="Hộp Đồ Nghề Thư Viện Chuẩn (Batteries Included) & Không Gian Tên import" rightNote="stdlib · import vs from" isLight={isLight} className={className}>
      {/* Left: 3 Ways to Import + Shadowing Trap */}
      <Panel x={14} y={54} w={424} h={312} title="3 Cách import & Tác động lên Namespace hiện tại" tone="cyan" p={p} />
      <Callout x={418} y={66} n={1} tone="cyan" p={p} />

      <CodeBlock
        x={28}
        y={88}
        w={396}
        p={p}
        lines={[
          { text: '# 1) Giữ nguyên tên module (rõ nguồn gốc nhất):', tone: 'muted' },
          { text: 'import math            ->  math.sqrt(16), math.pi', tone: 'cyan' },
          { text: '# 2) Lấy đích danh thứ cần dùng:', tone: 'muted' },
          { text: 'from math import sqrt  ->  sqrt(16)  (gọi thẳng)', tone: 'emerald' },
          { text: '# 3) Đặt biệt danh ngắn (alias):', tone: 'muted' },
          { text: 'import datetime as dt  ->  dt.date.today()', tone: 'violet' },
        ]}
      />

      {/* Two Fatal Traps */}
      <Callout x={38} y={232} n={3} tone="rose" p={p} />
      <rect x={58} y={220} width={366} height={132} rx="8" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={70} y={242} fill={p.rose} fontSize="11" fontWeight="700">2 Cái Bẫy Kinh Điển Khi Dùng import:</text>
      <text x={70} y={264} fill={p.ink} fontSize="10.5" fontFamily={MONO}>1. Đặt tên file bài tập là random.py / math.py</text>
      <text x={70} y={281} fill={p.inkSoft} fontSize="10">-&gt; Tự import chính file của mình, che mất thư viện chuẩn!</text>
      <text x={70} y={304} fill={p.ink} fontSize="10.5" fontFamily={MONO}>2. from module import *  (ô nhiễm tên biến)</text>
      <text x={70} y={322} fill={p.inkSoft} fontSize="10">-&gt; Đổ hàng chục tên lạ đè lên biến hiện có mà không biết.</text>
      <text x={70} y={341} fill={p.emerald} fontSize="10" fontFamily={MONO}>Thư viện ngoài: $ uv add rich  (cài vào .venv)</text>

      {/* Right: Batteries Included Grid */}
      <Panel x={450} y={54} w={416} h={312} title="Thư viện chuẩn có sẵn (Không cần cài thêm!)" tone="emerald" p={p} />
      <Callout x={846} y={66} n={2} tone="emerald" p={p} />

      <Pill x={466} y={92} w={186} h={68} label="math" sub="sqrt, ceil, floor, gcd, pi" tone="cyan" p={p} />
      <Pill x={664} y={92} w={186} h={68} label="random" sub="randint, choice, sample, seed" tone="amber" p={p} />
      <Pill x={466} y={172} w={186} h={68} label="datetime" sub="date.today(), timedelta(days=7)" tone="violet" p={p} />
      <Pill x={664} y={172} w={186} h={68} label="collections" sub="Counter(words).most_common()" tone="emerald" p={p} />

      <CodeBlock
        x={466}
        y={254}
        w={384}
        p={p}
        lines={[
          { text: '# Tự khám phá bất kỳ module nào ngay trong REPL:', tone: 'muted' },
          { text: 'dir(math)         # liệt kê mọi hàm/hằng bên trong', tone: 'cyan' },
          { text: 'help(math.gcd)    # đọc hướng dẫn chính thức', tone: 'emerald' },
          { text: 'random.seed(42)   # cố định kết quả ngẫu nhiên để test', tone: 'amber' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M07 — Functions: *args/**kwargs, LEGB Scope Lookup & Mutable Default Arg Trap
 * ========================================================================== */
const PyM07: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm07';
  return (
    <Shell id={id} badge="PY:M07" title="Giải Phẫu Hàm Python: *args/**kwargs, Phạm Vi LEGB & Bẫy Tham Số Mặc Định" rightNote="*args · **kwargs · LEGB" isLight={isLight} className={className}>
      {/* Left: Signature & LEGB */}
      <Panel x={14} y={54} w={432} h={312} title="Chữ ký linh hoạt (*args, **kwargs) & Quy tắc tra cứu LEGB" tone="cyan" p={p} />
      <Callout x={426} y={66} n={1} tone="cyan" p={p} />

      <CodeBlock
        x={28}
        y={88}
        w={404}
        p={p}
        lines={[
          { text: 'def send(to, *cc, timeout=5, **headers):', tone: 'cyan' },
          { text: '#  *cc      -> gom đối số vị trí thừa thành tuple', tone: 'emerald' },
          { text: '#  **headers -> gom đối số tên thừa thành dict', tone: 'violet' },
          { text: '#  sau dấu * đứng một mình -> BẮT BUỘC truyền theo tên!', tone: 'amber' },
        ]}
      />

      {/* Concentric LEGB Boxes */}
      <text x={28} y={184} fill={p.inkSoft} fontSize="10.5" fontWeight="700">Thứ tự tìm tên biến LEGB (Từ trong ra ngoài):</text>
      <Callout x={422} y={180} n={2} tone="violet" p={p} />

      <rect x={28} y={194} width={404} height={158} rx="9" fill={p.bgSubtle} stroke={p.borderStrong} />
      <text x={40} y={212} fill={p.inkMuted} fontSize="10" fontWeight="700" fontFamily={MONO}>B — Built-in (len, sum, ValueError...)</text>

      <rect x={44} y={220} width={372} height={122} rx="8" fill={p.violetBg} stroke={p.violetBorder} />
      <text x={56} y={238} fill={p.violet} fontSize="10" fontWeight="700" fontFamily={MONO}>G — Global (biến cấp module)</text>

      <rect x={62} y={246} width={336} height={86} rx="7" fill={p.amberBg} stroke={p.amberBorder} />
      <text x={74} y={264} fill={p.amber} fontSize="10" fontWeight="700" fontFamily={MONO}>E — Enclosing (closure hàm bao ngoài · nonlocal)</text>

      <rect x={82} y={272} width={296} height={50} rx="6" fill={p.cyanBg} stroke={p.cyanBorder} />
      <text x={230} y={295} textAnchor="middle" fill={p.cyan} fontSize="11" fontWeight="800" fontFamily={MONO}>L — Local (trong thân hàm hiện tại)</text>
      <text x={230} y={312} textAnchor="middle" fill={p.inkSoft} fontSize="9.5">Tra từ L -&gt; E -&gt; G -&gt; B</text>

      {/* Right: Mutable Default Argument Trap */}
      <Panel x={458} y={54} w={408} h={312} title="BẪY SỐ 1 PYTHON: Giá trị mặc định chỉ tạo ĐÚNG 1 LẦN lúc def!" tone="rose" p={p} />
      <Callout x={846} y={66} n={3} tone="rose" p={p} />

      <rect x={472} y={90} width={380} height={122} rx="8" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={484} y={110} fill={p.rose} fontSize="11" fontWeight="700" fontFamily={MONO}>SAI: def add_item(x, bag=[]):</text>
      <text x={484} y={130} fill={p.ink} fontSize="10.5" fontFamily={MONO}>    bag.append(x); return bag</text>
      <text x={484} y={154} fill={p.amber} fontSize="10.5" fontFamily={MONO}>add_item(&quot;A&quot;)  -&gt;  [&quot;A&quot;]</text>
      <text x={484} y={173} fill={p.rose} fontSize="11" fontWeight="700" fontFamily={MONO}>add_item(&quot;B&quot;)  -&gt;  [&quot;A&quot;, &quot;B&quot;]  (Dính dữ liệu cũ!)</text>
      <text x={484} y={197} fill={p.inkSoft} fontSize="10">Vì list [] nằm trong __defaults__ của hàm, dùng chung mãi mãi.</text>

      <rect x={472} y={224} width={380} height={128} rx="8" fill={p.emeraldBg} stroke={p.emeraldBorder} />
      <text x={484} y={244} fill={p.emerald} fontSize="11" fontWeight="700" fontFamily={MONO}>CHUẨN: Dùng None làm lính canh (Sentinel)</text>
      <text x={484} y={266} fill={p.ink} fontSize="10.5" fontFamily={MONO}>def add_item(x, bag=None):</text>
      <text x={484} y={285} fill={p.cyan} fontSize="10.5" fontFamily={MONO}>    if bag is None:</text>
      <text x={484} y={304} fill={p.emerald} fontSize="10.5" fontWeight="700" fontFamily={MONO}>        bag = []   # tạo list MỚI mỗi lần gọi!</text>
      <text x={484} y={323} fill={p.ink} fontSize="10.5" fontFamily={MONO}>    bag.append(x); return bag</text>
    </Shell>
  );
};

/* ============================================================================
 * M08 — Recursion Duplicate Tree O(2^n) vs @cache Memoization Table O(n)
 * ========================================================================== */
const PyM08: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm08';
  return (
    <Shell id={id} badge="PY:M08" title="Đệ Quy Ngây Thơ O(2^n) vs Ghi Nhớ @cache Memoization O(n)" rightNote="Base Case · functools.cache" isLight={isLight} className={className}>
      {/* Left: Exponential Tree */}
      <Panel x={14} y={54} w={432} h={312} title="Đệ quy ngây thơ fib(5): Tính trùng lặp bùng nổ O(2^n)" tone="rose" p={p} />
      <Callout x={426} y={66} n={1} tone="rose" p={p} />

      {/* Tree nodes */}
      {/* Level 0 */}
      <Pill x={190} y={92} w={80} h={28} label="fib(5)" tone="cyan" p={p} />
      <line x1={215} y1={120} x2={135} y2={146} stroke={p.borderStrong} strokeWidth="1.5" />
      <line x1={245} y1={120} x2={325} y2={146} stroke={p.borderStrong} strokeWidth="1.5" />

      {/* Level 1 */}
      <Pill x={95} y={146} w={80} h={28} label="fib(4)" tone="cyan" p={p} />
      <Pill x={285} y={146} w={80} h={28} label="fib(3)" sub="trùng!" tone="rose" p={p} />

      {/* Level 2 */}
      <line x1={120} y1={174} x2={75} y2={204} stroke={p.borderStrong} strokeWidth="1.5" />
      <line x1={150} y1={174} x2={195} y2={204} stroke={p.borderStrong} strokeWidth="1.5" />
      <line x1={310} y1={174} x2={275} y2={204} stroke={p.rose} strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1={340} y1={174} x2={375} y2={204} stroke={p.rose} strokeWidth="1.5" strokeDasharray="3 2" />

      <Pill x={35} y={204} w={76} h={28} label="fib(3)" tone="rose" p={p} />
      <Pill x={157} y={204} w={76} h={28} label="fib(2)" tone="amber" p={p} />
      <Pill x={242} y={204} w={72} h={28} label="fib(2)" tone="amber" p={p} />
      <Pill x={344} y={204} w={72} h={28} label="fib(1)" tone="muted" p={p} />

      {/* Summary warning */}
      <rect x={28} y={250} width={404} height={102} rx="8" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={42} y={272} fill={p.rose} fontSize="11" fontWeight="700">fib(3) tính lại 2 lần, fib(2) tính lại 3 lần...</text>
      <text x={42} y={292} fill={p.ink} fontSize="10.5" fontFamily={MONO}>fib(40) -&gt; hơn 300 triệu lời gọi hàm (~vài giây)!</text>
      <text x={42} y={314} fill={p.amber} fontSize="10.5" fontFamily={MONO}>Giới hạn ngăn xếp CPython: ~1000 tầng -&gt; RecursionError</text>
      <text x={42} y={334} fill={p.inkSoft} fontSize="10">Thiếu Base Case (if n &lt;= 1: return n) sẽ tràn stack ngay.</text>

      {/* Right: @cache O(n) Lookup */}
      <Panel x={458} y={54} w={408} h={312} title="Ghi nhớ @cache (Memoization): Mỗi fib(k) chỉ tính ĐÚNG 1 LẦN -> O(n)" tone="emerald" p={p} />
      <Callout x={846} y={66} n={2} tone="emerald" p={p} />

      <CodeBlock
        x={472}
        y={88}
        w={380}
        p={p}
        lines={[
          { text: 'from functools import cache', tone: 'violet' },
          { text: '@cache                     # tự động bọc bảng nhớ dict!', tone: 'emerald' },
          { text: 'def fib(n: int) -> int:', tone: 'cyan' },
          { text: '    if n < 2: return n     # Base case bắt buộc', tone: 'amber' },
          { text: '    return fib(n - 1) + fib(n - 2)', tone: 'ink' as Tone },
        ]}
      />

      {/* Memo Cache Table */}
      <Callout x={482} y={206} n={3} tone="cyan" p={p} />
      <text x={502} y={210} fill={p.emerald} fontSize="11" fontWeight="700">Bảng tra cứu Cache O(1) — Cắt cụt toàn bộ nhánh trùng:</text>

      {[
        { k: '0', v: '0' },
        { k: '1', v: '1' },
        { k: '2', v: '1' },
        { k: '3', v: '2' },
        { k: '4', v: '3' },
        { k: '5', v: '5' },
      ].map((cell, idx) => (
        <g key={idx}>
          <rect x={472 + idx * 63} y={224} width={57} height={58} rx="7" fill={p.emeraldBg} stroke={p.emeraldBorder} />
          <text x={500.5 + idx * 63} y={244} textAnchor="middle" fill={p.inkMuted} fontSize="10" fontFamily={MONO}>
            n={cell.k}
          </text>
          <line x1={478 + idx * 63} y1={251} x2={523 + idx * 63} y2={251} stroke={p.emeraldBorder} />
          <text x={500.5 + idx * 63} y={272} textAnchor="middle" fill={p.emerald} fontSize="13" fontWeight="800" fontFamily={MONO}>
            {cell.v}
          </text>
        </g>
      ))}

      <rect x={472} y={296} width={380} height={56} rx="7" fill={p.cyanBg} stroke={p.cyanBorder} />
      <text x={484} y={317} fill={p.cyan} fontSize="10.5" fontWeight="700" fontFamily={MONO}>fib(100) chạy trong &lt; 0.0001 giây! (101 bước thay vì 2^100)</text>
      <text x={484} y={336} fill={p.inkSoft} fontSize="10">Lưu ý: tham số hàm dùng @cache phải hashable (int, str, tuple).</text>
    </Shell>
  );
};

/* ============================================================================
 * M09 — Package src/ Layout, sys.path Resolution, __name__ & Isolated .venv
 * ========================================================================== */
const PyM09: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm09';
  return (
    <Shell id={id} badge="PY:M09" title="Kiến Trúc Package Chuẩn (src Layout), Thứ Tự Tìm Kiếm sys.path & Môi Trường .venv" rightNote="src/ · sys.path · .venv" isLight={isLight} className={className}>
      {/* Left: Modern src/ Package Layout */}
      <Panel x={14} y={54} w={396} h={312} title="Cấu trúc Project chuẩn công nghiệp (uv init --package)" tone="cyan" p={p} />
      <Callout x={390} y={66} n={1} tone="cyan" p={p} />

      <CodeBlock
        x={28}
        y={88}
        w={368}
        p={p}
        lines={[
          { text: 'my_project/', tone: 'cyan' },
          { text: '├── pyproject.toml       # tên gói, deps, [project.scripts]', tone: 'amber' },
          { text: '├── uv.lock              # khoá phiên bản chính xác 100%', tone: 'muted' },
          { text: '├── .venv/               # thư viện cô lập riêng project', tone: 'violet' },
          { text: '├── src/', tone: 'cyan' },
          { text: '│   └── my_project/      # package (thư mục chứa module)', tone: 'emerald' },
          { text: '│       ├── __init__.py  # đánh dấu package, xuất API', tone: 'emerald' },
          { text: '│       └── core.py      # from my_project.core import run', tone: 'emerald' },
          { text: '└── tests/', tone: 'cyan' },
          { text: '    └── test_core.py     # pytest kiểm thử độc lập', tone: 'muted' },
        ]}
      />
      <text x={28} y={298} fill={p.inkSoft} fontSize="10.5">Tránh circular import: A import B đồng thời B import A</text>
      <text x={28} y={316} fill={p.emerald} fontSize="10.5" fontWeight="600">-&gt; Tách phần dùng chung sang module thứ 3 (types/common.py)!</text>
      <text x={28} y={342} fill={p.amber} fontSize="10" fontFamily={MONO}>Khi được import: __name__ == &quot;my_project.core&quot; (!= &quot;__main__&quot;)</text>

      {/* Right: sys.path Lookup Chain & .venv Isolation */}
      <Panel x={422} y={54} w={444} h={312} title="Chuỗi tra cứu sys.path khi gọi import & Cô lập .venv" tone="violet" p={p} />
      <Callout x={846} y={66} n={2} tone="violet" p={p} />

      <Pill x={438} y={92} w={122} h={46} label="1. Thư mục gốc" sub="Cẩn thận trùng tên!" tone="amber" p={p} />
      <Arrow id={id} x1={564} y1={115} x2={588} y2={115} tone="muted" p={p} />
      <Pill x={592} y={92} w={124} h={46} label="2. Thư viện chuẩn" sub="math, json, pathlib" tone="cyan" p={p} />
      <Arrow id={id} x1={720} y1={115} x2={744} y2={115} tone="muted" p={p} />
      <Pill x={748} y={92} w={104} h={46} label="3. .venv/site" sub="requests, rich..." tone="emerald" p={p} />

      <text x={438} y={162} fill={p.inkMuted} fontSize="10" fontFamily={MONO}>
        sys.modules giữ cache: import lần 2 trả ngay module đã nạp (O(1))
      </text>

      {/* Isolated .venv vs Global */}
      <Callout x={448} y={194} n={3} tone="emerald" p={p} />
      <text x={468} y={198} fill={p.emerald} fontSize="11" fontWeight="700">Vì sao KHÔNG cài thư viện vào Python toàn cục của máy?</text>

      <rect x={438} y={210} width={202} height={140} rx="8" fill={p.emeraldBg} stroke={p.emeraldBorder} />
      <text x={539} y={232} textAnchor="middle" fill={p.emerald} fontSize="11" fontWeight="700">Project A (.venv riêng)</text>
      <text x={452} y={256} fill={p.ink} fontSize="10.5" fontFamily={MONO}>Python 3.12</text>
      <text x={452} y={276} fill={p.ink} fontSize="10.5" fontFamily={MONO}>pydantic == 1.10</text>
      <text x={452} y={302} fill={p.emerald} fontSize="10" fontFamily={MONO}>$ uv run python app.py</text>
      <text x={452} y={322} fill={p.inkSoft} fontSize="9.5">Không bao giờ xung đột!</text>

      <rect x={652} y={210} width={200} height={140} rx="8" fill={p.cyanBg} stroke={p.cyanBorder} />
      <text x={752} y={232} textAnchor="middle" fill={p.cyan} fontSize="11" fontWeight="700">Project B (.venv riêng)</text>
      <text x={666} y={256} fill={p.ink} fontSize="10.5" fontFamily={MONO}>Python 3.13</text>
      <text x={666} y={276} fill={p.ink} fontSize="10.5" fontFamily={MONO}>pydantic == 2.9</text>
      <text x={666} y={302} fill={p.cyan} fontSize="10" fontFamily={MONO}>$ uv sync --locked</text>
      <text x={666} y={322} fill={p.inkSoft} fontSize="9.5">Tái lập y hệt trên mọi máy.</text>
    </Shell>
  );
};

/* ============================================================================
 * M10 — Exception Hierarchy (BaseException vs Exception), Chaining & EAFP
 * ========================================================================== */
const PyM10: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm10';
  return (
    <Shell id={id} badge="PY:M10" title="Cây Phân Cấp Exception, Bắt Lỗi Chọn Lọc, raise...from & Phong Cách EAFP" rightNote="Exception Tree · EAFP" isLight={isLight} className={className}>
      {/* Left: Exception Class Tree */}
      <Panel x={14} y={54} w={446} h={312} title="Cây kế thừa lỗi: Vì sao chỉ bắt Exception, KHÔNG bắt BaseException?" tone="cyan" p={p} />
      <Callout x={440} y={66} n={1} tone="cyan" p={p} />

      <Pill x={162} y={90} w={150} h={30} label="BaseException" tone="muted" p={p} />
      <line x1={205} y1={120} x2={112} y2={148} stroke={p.rose} strokeWidth="1.5" />
      <line x1={270} y1={120} x2={335} y2={148} stroke={p.emerald} strokeWidth="1.5" />

      {/* Left forbidden branch */}
      <Pill x={28} y={148} w={172} h={44} label="KeyboardInterrupt" sub="SystemExit (Ctrl+C thoát!)" tone="rose" p={p} />
      <text x={32} y={210} fill={p.rose} fontSize="9.5" fontWeight="700">KHÔNG ĐƯỢC BẮT!</text>
      <text x={32} y={224} fill={p.inkMuted} fontSize="9.5">(except: trống sẽ khoá Ctrl+C)</text>

      {/* Right safe Exception branch */}
      <Pill x={250} y={148} w={194} h={36} label="Exception (Nên bắt nhánh này)" tone="emerald" p={p} />
      <line x1={300} y1={184} x2={265} y2={214} stroke={p.emerald} strokeWidth="1.4" />
      <line x1={350} y1={184} x2={350} y2={214} stroke={p.cyan} strokeWidth="1.4" />
      <line x1={395} y1={184} x2={415} y2={284} stroke={p.violet} strokeWidth="1.4" />

      <Pill x={198} y={214} w={118} h={34} label="ValueError" sub="TypeError" tone="amber" p={p} />
      <Pill x={324} y={214} w={122} h={34} label="LookupError" sub="KeyError · IndexError" tone="cyan" p={p} />

      {/* Custom Domain Exception */}
      <Pill x={228} y={284} w={216} h={42} label="class PaymentError(Exception)" sub="Lỗi nghiệp vụ riêng của project" tone="violet" p={p} />

      <text x={28} y={348} fill={p.inkSoft} fontSize="10">Đặt except cụ thể (KeyError) TRƯỚC except cha (LookupError)!</text>

      {/* Right: EAFP vs LBYL & raise ... from e */}
      <Panel x={472} y={54} w={394} h={158} title="Triết lý Pythonic: EAFP vs LBYL" tone="emerald" p={p} />
      <Callout x={846} y={66} n={2} tone="emerald" p={p} />
      <CodeBlock
        x={486}
        y={86}
        w={366}
        p={p}
        lines={[
          { text: '# LBYL (Kiểm tra trước — chậm hơn, dễ race-condition file):', tone: 'muted' },
          { text: 'if os.path.exists(p): data = open(p).read()', tone: 'amber' },
          { text: '# EAFP (Cứ làm luôn, nổ lỗi thì bắt — chuẩn Python):', tone: 'muted' },
          { text: 'try: data = Path(p).read_text(encoding="utf-8")', tone: 'emerald' },
          { text: 'except FileNotFoundError: data = ""', tone: 'cyan' },
        ]}
      />

      <Panel x={472} y={224} w={394} h={142} title="Bọc ngữ cảnh lỗi mà không mất dấu gốc: raise ... from e" tone="violet" p={p} />
      <Callout x={846} y={236} n={3} tone="violet" p={p} />
      <CodeBlock
        x={486}
        y={256}
        w={366}
        p={p}
        lines={[
          { text: 'try:', tone: 'cyan' },
          { text: '    cfg = json.loads(raw_text)', tone: 'ink' as Tone },
          { text: 'except json.JSONDecodeError as e:', tone: 'amber' },
          { text: '    raise ConfigError("File cấu hình hỏng") from e', tone: 'violet' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M11 — pathlib.Path + with open(encoding="utf-8") & JSON/CSV Pipeline
 * ========================================================================== */
const PyM11: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm11';
  return (
    <Shell id={id} badge="PY:M11" title="Quản Lý Đường Dẫn pathlib.Path, Tự Đóng File (with open) & Luồng JSON / CSV" rightNote="pathlib · utf-8 · json · csv" isLight={isLight} className={className}>
      {/* Top: pathlib + with open lifecycle */}
      <Panel x={14} y={54} w={852} h={150} title='Đường dẫn hiện đại pathlib.Path (toán tử /) & Đảm bảo đóng file tự động với with + encoding="utf-8"' tone="cyan" p={p} />
      <Callout x={846} y={66} n={1} tone="cyan" p={p} />

      <Pill x={28} y={92} w={218} h={46} label='Path("data") / "users.json"' sub=".parent · .stem · .suffix · .glob()" tone="cyan" p={p} />
      <Arrow id={id} x1={250} y1={115} x2={292} y2={115} tone="cyan" p={p} label="mở" />

      <rect x={296} y={86} width={336} height={60} rx="8" fill={p.codeBg} stroke={p.emeraldBorder} />
      <text x={308} y={108} fill={p.emerald} fontSize="11" fontWeight="700" fontFamily={MONO}>
        with open(path, &quot;r&quot;, encoding=&quot;utf-8&quot;) as f:
      </text>
      <text x={308} y={128} fill={p.inkSoft} fontSize="10.5" fontFamily={MONO}>
        {'    '}for line in f: ...   # đọc từng dòng O(1) RAM
      </text>

      <Arrow id={id} x1={636} y1={115} x2={678} y2={115} tone="emerald" p={p} label="ra khỏi with" />
      <Pill x={682} y={92} w={168} h={46} label="f.close() TỰ ĐỘNG" sub="Kể cả khi bên trong nổ lỗi!" tone="emerald" p={p} />

      <text x={28} y={172} fill={p.rose} fontSize="10.5" fontWeight="600">
        Bẫy Windows: thiếu encoding=&quot;utf-8&quot; sẽ đọc tiếng Việt sai font (cp1252) | CSV nhớ thêm newline=&quot;&quot;!
      </text>
      <text x={28} y={191} fill={p.inkMuted} fontSize="10" fontFamily={MONO}>
        File nhỏ viết gọn 1 dòng:  text = path.read_text(encoding=&quot;utf-8&quot;)   |   path.write_text(out, encoding=&quot;utf-8&quot;)
      </text>

      {/* Bottom Left: JSON Serialization */}
      <Panel x={14} y={216} w={422} h={150} title="JSON <-> Python dict/list (Phân biệt load/dump vs loads/dumps)" tone="violet" p={p} />
      <Callout x={416} y={228} n={2} tone="violet" p={p} />
      <CodeBlock
        x={28}
        y={248}
        w={394}
        p={p}
        lines={[
          { text: '# Chữ "s" ở cuối = string (chuỗi), không có "s" = file:', tone: 'muted' },
          { text: 'obj = json.loads(raw_str)          # JSON str -> dict/list', tone: 'cyan' },
          { text: 'txt = json.dumps(obj, ensure_ascii=False, indent=2)', tone: 'violet' },
          { text: '# ensure_ascii=False giữ nguyên tiếng Việt có dấu!', tone: 'emerald' },
        ]}
      />

      {/* Bottom Right: CSV DictReader / DictWriter */}
      <Panel x={448} y={216} w={418} h={150} title="CSV Bảng Dữ Liệu: csv.DictReader & DictWriter" tone="amber" p={p} />
      <Callout x={846} y={228} n={3} tone="amber" p={p} />
      <CodeBlock
        x={462}
        y={248}
        w={390}
        p={p}
        lines={[
          { text: 'with open("scores.csv", encoding="utf-8", newline="") as f:', tone: 'amber' },
          { text: '    for row in csv.DictReader(f):', tone: 'cyan' },
          { text: '        # MỖI Ô CSV ĐỀU LÀ CHUỖI -> nhớ ép int/float!', tone: 'rose' },
          { text: '        pts = int(row["score"])', tone: 'emerald' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M12 — CLI Script Anatomy: sys.argv -> argparse -> stdin/stdout/stderr & Exit Code
 * ========================================================================== */
const PyM12: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm12';
  return (
    <Shell id={id} badge="PY:M12" title="Giải Phẫu Công Cụ Dòng Lệnh Chuẩn Unix: argparse, 3 Dòng I/O & Mã Thoát" rightNote="argparse · stdout/stderr · rc" isLight={isLight} className={className}>
      {/* Top: Command -> argparse -> main(argv) */}
      <Panel x={14} y={54} w={852} h={142} title="Tách biệt Phân tích Tham số (argparse) khỏi Logic Xử lý để Test được không cần subprocess" tone="cyan" p={p} />
      <Callout x={846} y={66} n={1} tone="cyan" p={p} />

      <Pill x={28} y={94} w={236} h={46} label="$ tool data.txt -n 5 --json" sub='sys.argv[1:] = ["data.txt","-n","5",...]' tone="amber" p={p} />
      <Arrow id={id} x1={268} y1={117} x2={312} y2={117} tone="amber" p={p} label="parse_args" />

      <Pill x={316} y={94} w={252} h={46} label="argparse.ArgumentParser" sub="Tự tạo --help, ép kiểu int, bắt lỗi cờ" tone="cyan" p={p} />
      <Arrow id={id} x1={572} y1={117} x2={616} y2={117} tone="cyan" p={p} label="Namespace" />

      <Pill x={620} y={94} w={230} h={46} label="args.file, args.n=5, args.json=True" sub="Truyền vào hàm thuần xử lý" tone="emerald" p={p} />

      <text x={28} y={172} fill={p.inkSoft} fontSize="10.5" fontFamily={MONO}>
        Mẹo test CLI siêu sạch: định nghĩa def main(argv: list[str] | None = None) -&gt; int: rồi gọi main([&quot;a.txt&quot;, &quot;-n&quot;, &quot;5&quot;]) ngay trong pytest!
      </text>

      {/* Bottom: Unix Streams + Exit Codes */}
      <Panel x={14} y={208} w={524} h={158} title="3 Luồng Chuẩn Unix: Ghép Ống Pipe (|) Mượt Mà" tone="emerald" p={p} />
      <Callout x={518} y={220} n={2} tone="emerald" p={p} />

      <Pill x={28} y={266} w={120} h={48} label="sys.stdin" sub="Đọc dữ liệu pipe |" tone="violet" p={p} />
      <Arrow id={id} x1={152} y1={290} x2={192} y2={290} tone="violet" p={p} />

      <rect x={196} y={254} width={136} height={72} rx="9" fill={p.codeBg} stroke={p.cyanBorder} strokeWidth="1.5" />
      <text x={264} y={284} textAnchor="middle" fill={p.cyan} fontSize="11.5" fontWeight="700" fontFamily={MONO}>script.py</text>
      <text x={264} y={304} textAnchor="middle" fill={p.inkMuted} fontSize="9.5">os.environ.get()</text>

      <Arrow id={id} x1={336} y1={272} x2={380} y2={260} tone="emerald" p={p} />
      <Arrow id={id} x1={336} y1={306} x2={380} y2={318} tone="rose" p={p} />

      <Pill x={384} y={240} w={140} h={42} label="sys.stdout" sub="CHỈ in kết quả sạch" tone="emerald" p={p} />
      <Pill x={384} y={296} w={140} h={42} label="sys.stderr" sub="Log / cảnh báo / lỗi" tone="rose" p={p} />
      <text x={28} y={352} fill={p.inkMuted} fontSize="10" fontFamily={MONO}>print(&quot;Lỗi!&quot;, file=sys.stderr) -&gt; không làm hỏng file kết quả &gt; out.json</text>

      <Panel x={550} y={208} w={316} h={158} title="Mã Thoát (Exit Code) Cho CI/Shell" tone="amber" p={p} />
      <Callout x={846} y={220} n={3} tone="amber" p={p} />
      <CodeBlock
        x={564}
        y={242}
        w={288}
        p={p}
        lines={[
          { text: '# Quy ước toàn cầu POSIX:', tone: 'muted' },
          { text: '0      -> Thành công (&& chạy tiếp)', tone: 'emerald' },
          { text: '1..255 -> Thất bại (CI báo đỏ dừng)', tone: 'rose' },
          { text: '', tone: 'muted' },
          { text: 'if __name__ == "__main__":', tone: 'cyan' },
          { text: '    raise SystemExit(main())', tone: 'amber' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M13 — Class Blueprint vs Instance __dict__ & Automatic self Binding
 * ========================================================================== */
const PyM13: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm13';
  return (
    <Shell id={id} badge="PY:M13" title="Bản Thiết Kế Class vs Bộ Nhớ Instance (__dict__) & Cơ Chế Tự Truyền self" rightNote="class · __init__ · self" isLight={isLight} className={className}>
      {/* Left: Class Blueprint vs Instances on Heap */}
      <Panel x={14} y={54} w={464} h={312} title="Class giữ Method dùng chung — Mỗi Instance giữ dữ liệu riêng (self.x)" tone="cyan" p={p} />
      <Callout x={458} y={66} n={1} tone="cyan" p={p} />

      <rect x={28} y={90} width={196} height={154} rx="9" fill={p.cyanBg} stroke={p.cyanBorder} strokeWidth="1.5" />
      <text x={126} y={110} textAnchor="middle" fill={p.cyan} fontSize="11.5" fontWeight="800" fontFamily={MONO}>class BankAccount</text>
      <line x1={36} y1={118} x2={216} y2={118} stroke={p.cyanBorder} />
      <text x={40} y={138} fill={p.ink} fontSize="10.5" fontFamily={MONO}>bank = &quot;PyBank&quot; (chung)</text>
      <text x={40} y={160} fill={p.emerald} fontSize="10.5" fontFamily={MONO}>def __init__(self, owner)</text>
      <text x={40} y={180} fill={p.emerald} fontSize="10.5" fontFamily={MONO}>def deposit(self, amt)</text>
      <text x={40} y={200} fill={p.violet} fontSize="10.5" fontFamily={MONO}>def __repr__(self)</text>
      <text x={40} y={220} fill={p.violet} fontSize="10.5" fontFamily={MONO}>def __eq__(self, other)</text>

      {/* Two Instances */}
      <rect x={268} y={90} width={196} height={68} rx="8" fill={p.emeraldBg} stroke={p.emeraldBorder} />
      <text x={280} y={110} fill={p.emerald} fontSize="11" fontWeight="700" fontFamily={MONO}>acc1 (Instance #1)</text>
      <text x={280} y={130} fill={p.ink} fontSize="10.5" fontFamily={MONO}>self.owner = &quot;An&quot;</text>
      <text x={280} y={147} fill={p.ink} fontSize="10.5" fontFamily={MONO}>self.balance = 500</text>

      <rect x={268} y={176} width={196} height={68} rx="8" fill={p.amberBg} stroke={p.amberBorder} />
      <text x={280} y={196} fill={p.amber} fontSize="11" fontWeight="700" fontFamily={MONO}>acc2 (Instance #2)</text>
      <text x={280} y={216} fill={p.ink} fontSize="10.5" fontFamily={MONO}>self.owner = &quot;Bình&quot;</text>
      <text x={280} y={233} fill={p.ink} fontSize="10.5" fontFamily={MONO}>self.balance = 1200</text>

      <Arrow id={id} x1={268} y1={124} x2={228} y2={140} tone="emerald" p={p} />
      <Arrow id={id} x1={268} y1={210} x2={228} y2={175} tone="amber" p={p} />

      {/* Class Mutable Attr Trap */}
      <Callout x={38} y={272} n={3} tone="rose" p={p} />
      <rect x={58} y={258} width={406} height={94} rx="8" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={70} y={278} fill={p.rose} fontSize="10.5" fontWeight="700" fontFamily={MONO}>BẪY: Khai báo history = [] trực tiếp ở cấp class!</text>
      <text x={70} y={298} fill={p.inkSoft} fontSize="10.5">-&gt; Mọi instance acc1, acc2 dùng CHUNG 1 list lịch sử giao dịch!</text>
      <text x={70} y={318} fill={p.emerald} fontSize="10.5" fontWeight="700" fontFamily={MONO}>ĐÚNG: đặt self.history = [] bên trong __init__(self)</text>
      <text x={70} y={338} fill={p.inkMuted} fontSize="10">Cài __eq__ để acc1 == acc2 so sánh theo dữ liệu thay vì địa chỉ id().</text>

      {/* Right: How self works + __repr__ */}
      <Panel x={490} y={54} w={376} h={312} title="self không phải phép thuật: Python tự điền đối số đầu!" tone="violet" p={p} />
      <Callout x={846} y={66} n={2} tone="violet" p={p} />

      <Pill x={506} y={94} w={344} h={42} label="acc1.deposit(100)" sub="Cách bạn viết ngắn gọn trên object" tone="cyan" p={p} />
      <Arrow id={id} x1={678} y1={136} x2={678} y2={168} tone="violet" p={p} label="Python dịch thành" />
      <Pill x={506} y={172} w={344} h={42} label="BankAccount.deposit(acc1, 100)" sub="self chính là acc1 (không bao giờ bị mất ngữ cảnh như this JS!)" tone="violet" p={p} />

      <CodeBlock
        x={506}
        y={230}
        w={344}
        p={p}
        lines={[
          { text: '# __repr__: chuỗi rõ ràng cho dev khi debug/in list:', tone: 'muted' },
          { text: 'def __repr__(self) -> str:', tone: 'cyan' },
          { text: '    return f"Account({self.owner!r}, {self.balance})"', tone: 'emerald' },
          { text: '', tone: 'muted' },
          { text: '# Quên self trong def -> TypeError khi gọi method!', tone: 'rose' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M14 — Advanced OOP: Inheritance + super() MRO, Dunder Protocol, @property & @dataclass
 * ========================================================================== */
const PyM14: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm14';
  return (
    <Shell id={id} badge="PY:M14" title="OOP Pythonic: Kế Thừa super() MRO, Giao Thức Dunder, @property & @dataclass" rightNote="super() · Dunder · @dataclass" isLight={isLight} className={className}>
      {/* Left Top: Inheritance & MRO + Duck Typing */}
      <Panel x={14} y={54} w={424} h={154} title="Kế thừa (super), Tuyến tính hoá MRO & Duck Typing" tone="cyan" p={p} />
      <Callout x={418} y={66} n={1} tone="cyan" p={p} />

      <Pill x={28} y={92} w={172} h={44} label="SavingsAccount" sub="super().__init__(owner)" tone="cyan" p={p} />
      <Arrow id={id} x1={204} y1={114} x2={244} y2={114} tone="cyan" p={p} label="MRO" />
      <Pill x={248} y={92} w={174} h={44} label="BankAccount -> object" sub="Cls.__mro__ tra theo thứ tự" tone="violet" p={p} />

      <text x={28} y={160} fill={p.emerald} fontSize="10.5" fontWeight="700">Ưu tiên Composition (has-a) &amp; Duck Typing hơn kế thừa sâu:</text>
      <text x={28} y={180} fill={p.inkSoft} fontSize="10.5">Chỉ cần có phương thức .read() là dùng được, không bắt buộc chung cha!</text>
      <text x={28} y={197} fill={p.inkMuted} fontSize="10" fontFamily={MONO}>Cần hợp đồng chặt: dùng abc.ABC + @abstractmethod</text>

      {/* Left Bottom: Python Data Model (Dunder Methods) */}
      <Panel x={14} y={220} w={424} h={146} title="Dunder Methods: Hoà nhập mượt với cú pháp gốc Python" tone="violet" p={p} />
      <Callout x={418} y={232} n={2} tone="violet" p={p} />
      <CodeBlock
        x={28}
        y={252}
        w={396}
        p={p}
        lines={[
          { text: 'len(deck)     -> deck.__len__()', tone: 'cyan' },
          { text: 'deck[0]       -> deck.__getitem__(0)   # tự hỗ trợ cả slicing!', tone: 'emerald' },
          { text: 'v1 + v2       -> v1.__add__(v2)        # nạp chồng toán tử', tone: 'amber' },
          { text: 'x in bag      -> bag.__contains__(x)', tone: 'violet' },
        ]}
      />

      {/* Right: @property & @dataclass */}
      <Panel x={450} y={54} w={416} h={312} title="@property Kiểm Soát Truy Cập & @dataclass Giảm 80% Code Lặp" tone="emerald" p={p} />
      <Callout x={846} y={66} n={3} tone="emerald" p={p} />

      <CodeBlock
        x={464}
        y={88}
        w={388}
        p={p}
        lines={[
          { text: 'from dataclasses import dataclass, field', tone: 'muted' },
          { text: '@dataclass(frozen=True)    # bất biến + tự sinh hash!', tone: 'emerald' },
          { text: 'class Point:', tone: 'cyan' },
          { text: '    x: float', tone: 'ink' as Tone },
          { text: '    y: float', tone: 'ink' as Tone },
          { text: '    tags: list[str] = field(default_factory=list)', tone: 'amber' },
          { text: '# Tự có sẵn: __init__, __repr__, __eq__ chuẩn chỉnh!', tone: 'emerald' },
        ]}
      />

      <CodeBlock
        x={464}
        y={236}
        w={388}
        p={p}
        lines={[
          { text: '@property', tone: 'violet' },
          { text: 'def celsius(self) -> float: return self._c', tone: 'cyan' },
          { text: '@celsius.setter', tone: 'violet' },
          { text: 'def celsius(self, v: float) -> None:', tone: 'cyan' },
          { text: '    if v < -273.15: raise ValueError("Dưới 0 tuyệt đối")', tone: 'rose' },
          { text: '    self._c = v    # gọi t.celsius = 25 tự chạy kiểm tra!', tone: 'emerald' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M15 — Eager list (10M rows in RAM) vs Lazy Generator yield Stream O(1) Memory
 * ========================================================================== */
const PyM15: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm15';
  return (
    <Shell id={id} badge="PY:M15" title="Eager List (Ngốn RAM O(N)) vs Lazy Generator yield (Tạm Dừng Frame O(1) RAM)" rightNote="iter/next · yield · itertools" isLight={isLight} className={className}>
      {/* Top: Eager vs Lazy Comparison */}
      <Panel x={14} y={54} w={852} h={164} title="So sánh xử lý 10.000.000 dòng log: Nạp tất cả vào List vs Đường ống Generator cuốn chiếu" tone="cyan" p={p} />
      <Callout x={846} y={66} n={1} tone="cyan" p={p} />

      {/* Eager Row */}
      <text x={28} y={98} fill={p.rose} fontSize="10.5" fontWeight="700" fontFamily={MONO}>EAGER LIST (Tạo hết trước rồi mới dùng):</text>
      <Pill x={28} y={106} w={162} h={38} label="read_all_lines()" sub="Đọc 10M dòng" tone="rose" p={p} />
      <Arrow id={id} x1={194} y1={125} x2={236} y2={125} tone="rose" p={p} />
      <rect x={240} y={104} width={352} height={42} rx="7" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={416} y={123} textAnchor="middle" fill={p.rose} fontSize="11" fontWeight="800" fontFamily={MONO}>
        RAM: ~1.6 GB [row_0, row_1, ..., row_9999999]
      </text>
      <text x={416} y={139} textAnchor="middle" fill={p.inkSoft} fontSize="9.5">Chờ nạp xong toàn bộ mới xử lý được dòng đầu tiên!</text>

      {/* Lazy Row */}
      <text x={28} y={165} fill={p.emerald} fontSize="10.5" fontWeight="700" fontFamily={MONO}>LAZY GENERATOR PIPELINE (Kéo từng phần tử một qua yield):</text>
      <Pill x={28} y={172} w={162} h={36} label="open_lines(path)" sub="yield line" tone="emerald" p={p} />
      <Arrow id={id} x1={194} y1={190} x2={236} y2={190} tone="emerald" p={p} label="1 item" />
      <Pill x={240} y={172} w={168} h={36} label="filter_errors(lines)" sub="yield if 'ERR'" tone="cyan" p={p} />
      <Arrow id={id} x1={412} y1={190} x2={454} y2={190} tone="cyan" p={p} label="1 item" />
      <Pill x={458} y={172} w={168} h={36} label="islice(errs, 10)" sub="Đủ 10 dòng dừng ngay!" tone="violet" p={p} />
      <Pill x={644} y={172} w={206} h={36} label="RAM: ~ vài KB O(1)!" sub="Chạy tức thì cho file 100GB" tone="emerald" p={p} />

      {/* Bottom Left: How yield pauses stack frame + Single-use trap */}
      <Panel x={14} y={230} w={442} h={136} title="Cơ chế yield đóng băng Frame & Bẫy Iterator dùng 1 lần!" tone="amber" p={p} />
      <Callout x={436} y={242} n={2} tone="amber" p={p} />
      <CodeBlock
        x={28}
        y={260}
        w={414}
        p={p}
        lines={[
          { text: 'def count_up(n):            # có yield -> trả về generator', tone: 'cyan' },
          { text: '    for i in range(n): yield i  # tạm dừng, nhớ nguyên biến i', tone: 'emerald' },
          { text: '# BẪY: g = (x for x in [1, 2]); sum(g) -> 3; sum(g) -> 0!', tone: 'rose' },
          { text: '# Iterator cạn sau 1 lần duyệt (StopIteration)!', tone: 'amber' },
        ]}
      />

      {/* Bottom Right: itertools Power Tools */}
      <Panel x={468} y={230} w={398} h={136} title="Hộp đồ nghề itertools chuẩn C tốc độ cao" tone="violet" p={p} />
      <Callout x={846} y={242} n={3} tone="violet" p={p} />
      <CodeBlock
        x={482}
        y={260}
        w={370}
        p={p}
        lines={[
          { text: 'islice(gen, 5)           # cắt lát trên generator (không có g[:5])', tone: 'cyan' },
          { text: 'chain(a, b) · batched(seq, 100) · pairwise(seq)', tone: 'emerald' },
          { text: 'combinations(items, 2) · product(xs, ys)', tone: 'violet' },
          { text: '# CHÚ Ý: groupby(data, key) yêu cầu data ĐÃ sort theo key!', tone: 'rose' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M16 — @decorator Onion Wrapper (@wraps) & Context Manager with (__enter__/__exit__)
 * ========================================================================== */
const PyM16: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm16';
  return (
    <Shell id={id} badge="PY:M16" title="Củ Hành @decorator (@wraps Bọc Hàm) & Chu Trình Context Manager (with)" rightNote="@wraps · with · contextlib" isLight={isLight} className={className}>
      {/* Left: Decorator Onion */}
      <Panel x={14} y={54} w={426} h={312} title="@decorator: Bọc hành vi Trước/Sau quanh hàm gốc mà không sửa ruột" tone="violet" p={p} />
      <Callout x={420} y={66} n={1} tone="violet" p={p} />

      {/* Concentric Onion Layers */}
      <rect x={30} y={92} width={394} height={154} rx="12" fill={p.violetBg} stroke={p.violetBorder} strokeWidth="1.6" />
      <text x={46} y={112} fill={p.violet} fontSize="10.5" fontWeight="700" fontFamily={MONO}>
        wrapper(*args, **kwargs)  ·  @functools.wraps(fn)
      </text>
      <text x={46} y={130} fill={p.amber} fontSize="10.5" fontFamily={MONO}>1. Tiền xử lý: t0 = perf_counter() / check_auth()</text>

      <rect x={60} y={140} width={334} height={52} rx="8" fill={p.cyanBg} stroke={p.cyanBorder} strokeWidth="1.6" />
      <text x={227} y={163} textAnchor="middle" fill={p.cyan} fontSize="11.5" fontWeight="800" fontFamily={MONO}>
        2. result = fn(*args, **kwargs)
      </text>
      <text x={227} y={180} textAnchor="middle" fill={p.inkSoft} fontSize="10">Hàm nghiệp vụ gốc (giữ nguyên __name__, __doc__)</text>

      <text x={46} y={214} fill={p.emerald} fontSize="10.5" fontFamily={MONO}>3. Hậu xử lý: log_elapsed() -&gt; return result</text>
      <text x={46} y={234} fill={p.inkMuted} fontSize="10" fontFamily={MONO}>@dec tương đương chính xác với:  fn = dec(fn)</text>

      <CodeBlock
        x={30}
        y={258}
        w={394}
        p={p}
        lines={[
          { text: '# Decorator có tham số @retry(times=3) = 3 tầng def:', tone: 'muted' },
          { text: '# retry(3) -> trả về decorator -> trả về wrapper!', tone: 'amber' },
          { text: '# Luôn đặt @wraps(fn) để không mất tên & docstring gốc.', tone: 'emerald' },
        ]}
      />

      {/* Right: Context Manager with (__enter__ -> yield -> __exit__) */}
      <Panel x={452} y={54} w={414} h={312} title="Context Manager (with): Đảm bảo Dọn dẹp Tài nguyên 100%" tone="emerald" p={p} />
      <Callout x={846} y={66} n={2} tone="emerald" p={p} />

      {/* 3-Step Lifecycle */}
      <Pill x={470} y={92} w={378} h={42} label="1. __enter__()  (hoặc phần trước yield)" sub="Mở kết nối DB / lấy khoá Lock / bắt đầu bấm giờ" tone="cyan" p={p} />
      <Arrow id={id} x1={659} y1={134} x2={659} y2={156} tone="cyan" p={p} />

      <Pill x={470} y={158} w={378} h={42} label="2. Thực thi thân khối with ... as resource:" sub="Dù thành công, return sớm hay NỔ EXCEPTION..." tone="amber" p={p} />
      <Arrow id={id} x1={659} y1={200} x2={659} y2={222} tone="emerald" p={p} />

      <Pill x={470} y={224} w={378} h={42} label="3. __exit__(exc_type, exc, tb)  (khối finally)" sub="LUÔN đóng file / rollback transaction / nhả Lock!" tone="emerald" p={p} />

      <Callout x={478} y={288} n={3} tone="cyan" p={p} />
      <CodeBlock
        x={498}
        y={276}
        w={350}
        p={p}
        lines={[
          { text: 'from contextlib import contextmanager', tone: 'muted' },
          { text: '@contextmanager', tone: 'violet' },
          { text: 'def timer(label):', tone: 'cyan' },
          { text: '    t0 = time.perf_counter(); try: yield', tone: 'emerald' },
          { text: '    finally: print(label, time.perf_counter() - t0)', tone: 'amber' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M17 — Static Type Hints (TypedDict, Protocol, T | None) & pytest AAA/parametrize
 * ========================================================================== */
const PyM17: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm17';
  return (
    <Shell id={id} badge="PY:M17" title="Kiểm Tra Kiểu Tĩnh (Type Hints + mypy/pyright) & Kiểm Thử Tự Động pytest" rightNote="TypedDict · Protocol · pytest" isLight={isLight} className={className}>
      {/* Left: Static Type Checking vs Runtime */}
      <Panel x={14} y={54} w={428} h={312} title="Type Hints Hiện Đại (Python 3.10+ / 3.12+): Bắt Bug Trước Khi Chạy" tone="cyan" p={p} />
      <Callout x={422} y={66} n={1} tone="cyan" p={p} />

      <Pill x={28} y={90} w={184} h={42} label="mypy / pyright (Tĩnh)" sub="Bắt lỗi None, sai key dict" tone="cyan" p={p} />
      <Arrow id={id} x1={216} y1={111} x2={250} y2={111} tone="emerald" p={p} label="PASS" />
      <Pill x={254} y={90} w={174} h={42} label="CPython Runtime" sub="KHÔNG làm chậm tốc độ chạy!" tone="emerald" p={p} />

      <CodeBlock
        x={28}
        y={144}
        w={400}
        p={p}
        lines={[
          { text: 'def find_user(uid: int) -> User | None: ...', tone: 'cyan' },
          { text: '# Buộc kiểm tra if u is None trước khi u.name!', tone: 'amber' },
          { text: '', tone: 'muted' },
          { text: 'class UserRow(TypedDict):      # định hình dict JSON', tone: 'violet' },
          { text: '    id: int; email: str', tone: 'ink' as Tone },
          { text: '', tone: 'muted' },
          { text: 'class Closable(Protocol):      # Structural Duck Typing', tone: 'emerald' },
          { text: '    def close(self) -> None: ...', tone: 'ink' as Tone },
        ]}
      />
      <text x={28} y={310} fill={p.rose} fontSize="10" fontWeight="700" fontFamily={MONO}>
        Nhớ: Python KHÔNG tự chặn kiểu lúc chạy (cần Pydantic nếu nhận JSON ngoài).
      </text>
      <text x={28} y={330} fill={p.inkMuted} fontSize="10" fontFamily={MONO}>
        Nhận dữ liệu: dùng Sequence[int] / Mapping[str, Any] linh hoạt hơn list!
      </text>

      {/* Right: pytest Workflow */}
      <Panel x={454} y={54} w={412} h={312} title="Chuẩn Kiểm Thử pytest: Arrange-Act-Assert, parametrize & tmp_path" tone="emerald" p={p} />
      <Callout x={846} y={66} n={2} tone="emerald" p={p} />

      {/* AAA Pills */}
      <Pill x={468} y={90} w={120} h={38} label="1. Arrange" sub="Chuẩn bị dữ liệu" tone="cyan" p={p} />
      <Arrow id={id} x1={590} y1={109} x2={606} y2={109} tone="muted" p={p} />
      <Pill x={610} y={90} w={112} h={38} label="2. Act" sub="Gọi hàm cần test" tone="amber" p={p} />
      <Arrow id={id} x1={724} y1={109} x2={740} y2={109} tone="muted" p={p} />
      <Pill x={744} y={90} w={108} h={38} label="3. Assert" sub="assert kq == ..." tone="emerald" p={p} />

      <Callout x={476} y={150} n={3} tone="violet" p={p} />
      <CodeBlock
        x={496}
        y={140}
        w={356}
        p={p}
        lines={[
          { text: '@pytest.mark.parametrize("s,expected", [', tone: 'violet' },
          { text: '    ("", 0), ("a", 1), ("aba", 3),   # 1 hàm -> 3 ca biên!', tone: 'cyan' },
          { text: '])', tone: 'violet' },
          { text: 'def test_len(s: str, expected: int) -> None:', tone: 'emerald' },
          { text: '    assert calc(s) == expected', tone: 'emerald' },
          { text: '', tone: 'muted' },
          { text: 'def test_zero_div(tmp_path: Path) -> None: # fixture file tạm', tone: 'amber' },
          { text: '    with pytest.raises(ZeroDivisionError):', tone: 'rose' },
          { text: '        divide(10, 0)', tone: 'rose' },
        ]}
      />
      <text x={468} y={336} fill={p.inkSoft} fontSize="10.5">Số thực: assert 0.1 + 0.2 == pytest.approx(0.3)</text>
      <text x={468} y={352} fill={p.inkMuted} fontSize="10">Test tốt phải ĐỎ ngay khi hàm bị sửa sai logic!</text>
    </Shell>
  );
};

/* ============================================================================
 * M18 — Big-O Growth Curves (O(1)..O(n^2)), Binary Search & Timsort
 * ========================================================================== */
const PyM18: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm18';
  return (
    <Shell id={id} badge="PY:M18" title="Đường Cong Tăng Trưởng Big-O (n = 10^6), Chia Đôi Binary Search & Timsort" rightNote="O(1) · O(log n) · Timsort" isLight={isLight} className={className}>
      {/* Left: SVG Growth Curve Chart */}
      <Panel x={14} y={54} w={422} h={312} title="Độ phức tạp khi dữ liệu lớn n = 1.000.000 phần tử" tone="cyan" p={p} />
      <Callout x={416} y={66} n={1} tone="cyan" p={p} />

      {/* Axes */}
      <rect x={42} y={92} width={372} height={194} rx="6" fill={p.codeBg} stroke={p.border} />
      <line x1={66} y1={264} x2={396} y2={264} stroke={p.borderStrong} strokeWidth="1.5" />
      <line x1={66} y1={264} x2={66} y2={106} stroke={p.borderStrong} strokeWidth="1.5" />

      {/* O(n^2) steep rose curve */}
      <path d="M 66 264 Q 110 250, 148 110" fill="none" stroke={p.rose} strokeWidth="2.4" />
      <text x={154} y={118} fill={p.rose} fontSize="10.5" fontWeight="700" fontFamily={MONO}>O(n^2) ~ 10^12 (Treo!)</text>

      {/* O(n log n) amber curve */}
      <path d="M 66 264 Q 190 236, 330 132" fill="none" stroke={p.amber} strokeWidth="2.2" />
      <text x={262} y={126} fill={p.amber} fontSize="10.5" fontWeight="700" fontFamily={MONO}>O(n log n) sorted()</text>

      {/* O(n) cyan line */}
      <path d="M 66 264 L 386 184" fill="none" stroke={p.cyan} strokeWidth="2.2" />
      <text x={312} y={178} fill={p.cyan} fontSize="10.5" fontWeight="700" fontFamily={MONO}>O(n) 1 vòng for</text>

      {/* O(log n) violet flat-ish curve */}
      <path d="M 66 264 Q 160 242, 386 234" fill="none" stroke={p.violet} strokeWidth="2.2" />
      <text x={276} y={228} fill={p.violet} fontSize="10.5" fontWeight="700" fontFamily={MONO}>O(log n) ~ 20 bước</text>

      {/* O(1) emerald flat line */}
      <line x1={66} y1={256} x2={386} y2={256} stroke={p.emerald} strokeWidth="2.2" />
      <text x={282} y={252} fill={p.emerald} fontSize="10" fontWeight="700" fontFamily={MONO}>O(1) set/dict</text>

      <text x={230} y={280} textAnchor="middle" fill={p.inkMuted} fontSize="9.5">Kích thước đầu vào n -&gt;</text>

      <rect x={28} y={296} width={394} height={56} rx="7" fill={p.emeraldBg} stroke={p.emeraldBorder} />
      <text x={40} y={316} fill={p.emerald} fontSize="10.5" fontWeight="700">Mẹo tối ưu số 1: Thay x in my_list O(n) trong vòng lặp</text>
      <text x={40} y={335} fill={p.inkSoft} fontSize="10.5">bằng seen = set(my_list) -&gt; giảm từ O(n^2) xuống O(n)!</text>

      {/* Right: Binary Search Array + Timsort/heapq */}
      <Panel x={448} y={54} w={418} h={164} title="Binary Search & bisect (Yêu cầu mảng ĐÃ SẮP XẾP!)" tone="violet" p={p} />
      <Callout x={846} y={66} n={2} tone="violet" p={p} />

      {[2, 5, 9, 14, 21, 30, 42].map((v, i) => {
        const isMid = i === 3;
        const eliminated = i < 3;
        return (
          <g key={i}>
            <rect
              x={464 + i * 55}
              y={102}
              width={49}
              height={36}
              rx="6"
              fill={isMid ? p.violetBg : eliminated ? p.bgSubtle : p.cyanBg}
              stroke={isMid ? p.violet : eliminated ? p.border : p.cyanBorder}
            />
            <text
              x={488.5 + i * 55}
              y={125}
              textAnchor="middle"
              fill={isMid ? p.violet : eliminated ? p.inkMuted : p.cyan}
              fontSize="11.5"
              fontWeight="700"
              fontFamily={MONO}
            >
              {v}
            </text>
          </g>
        );
      })}
      <text x={488} y={154} textAnchor="middle" fill={p.inkMuted} fontSize="9.5" fontFamily={MONO}>lo=0 (bỏ)</text>
      <text x={653} y={154} textAnchor="middle" fill={p.violet} fontSize="10" fontWeight="700" fontFamily={MONO}>mid=3 (14&lt;30 -&gt; lo=mid+1)</text>
      <text x={818} y={154} textAnchor="middle" fill={p.cyan} fontSize="9.5" fontFamily={MONO}>hi=6</text>

      <text x={464} y={180} fill={p.emerald} fontSize="10.5" fontFamily={MONO}>
        Có sẵn chuẩn C:  bisect.bisect_left(arr, target)
      </text>
      <text x={464} y={199} fill={p.inkSoft} fontSize="10">Mỗi bước loại đúng 1 nửa -&gt; 1 tỷ phần tử chỉ cần 30 lần hỏi!</text>

      <Panel x={448} y={230} w={418} h={136} title="Thực chiến: Timsort (sorted) ổn định & heapq Top-K" tone="amber" p={p} />
      <Callout x={846} y={242} n={3} tone="amber" p={p} />
      <CodeBlock
        x={462}
        y={260}
        w={390}
        p={p}
        lines={[
          { text: '# Timsort O(n log n), gần có thứ tự chạy nhanh tới O(n)!', tone: 'muted' },
          { text: 'sorted(users, key=lambda u: (-u.score, u.name))', tone: 'cyan' },
          { text: '# Lấy k phần tử lớn nhất không cần sort cả mảng O(n log k):', tone: 'muted' },
          { text: 'heapq.nlargest(5, items, key=lambda x: x.price)', tone: 'amber' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M19 — Stack (list), Queue (collections.deque O(1)), Linked List & BST/BFS
 * ========================================================================== */
const PyM19: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm19';
  return (
    <Shell id={id} badge="PY:M19" title="Stack LIFO, Hàng Đợi deque FIFO O(1), Danh Sách Liên Kết & Duyệt Cây/BFS" rightNote="deque O(1) · BST · BFS" isLight={isLight} className={className}>
      {/* Top Left: Stack vs Queue deque */}
      <Panel x={14} y={54} w={462} h={164} title="Stack (list cuối O(1)) vs Queue (collections.deque 2 đầu O(1))" tone="cyan" p={p} />
      <Callout x={456} y={66} n={1} tone="cyan" p={p} />

      <rect x={28} y={90} width={196} height={112} rx="8" fill={p.cyanBg} stroke={p.cyanBorder} />
      <text x={40} y={110} fill={p.cyan} fontSize="11" fontWeight="700" fontFamily={MONO}>Stack LIFO (Vào sau ra trước)</text>
      <text x={40} y={132} fill={p.ink} fontSize="10.5" fontFamily={MONO}>st = []</text>
      <text x={40} y={150} fill={p.emerald} fontSize="10.5" fontFamily={MONO}>st.append(x)  # O(1)</text>
      <text x={40} y={168} fill={p.amber} fontSize="10.5" fontFamily={MONO}>st.pop()      # O(1)</text>
      <text x={40} y={188} fill={p.inkMuted} fontSize="9.5">Khớp ngoặc (), Undo, DFS</text>

      <rect x={238} y={90} width={224} height={112} rx="8" fill={p.emeraldBg} stroke={p.emeraldBorder} />
      <text x={250} y={110} fill={p.emerald} fontSize="11" fontWeight="700" fontFamily={MONO}>Queue FIFO (deque)</text>
      <text x={250} y={132} fill={p.emerald} fontSize="10.5" fontFamily={MONO}>q = deque([start])</text>
      <text x={250} y={150} fill={p.cyan} fontSize="10.5" fontFamily={MONO}>q.append(x)   # vào phải O(1)</text>
      <text x={250} y={168} fill={p.violet} fontSize="10.5" fontFamily={MONO}>q.popleft()   # ra trái O(1)!</text>
      <text x={250} y={188} fill={p.rose} fontSize="9.5" fontWeight="700">CẤM list.pop(0) -&gt; dồn mảng O(n)!</text>

      {/* Bottom Left: Singly Linked List */}
      <Panel x={14} y={230} w={462} h={136} title="Linked List: Các Node nối nhau bằng tham chiếu .next" tone="amber" p={p} />
      <Callout x={456} y={242} n={2} tone="amber" p={p} />

      {[10, 25, 40].map((val, i) => (
        <g key={i}>
          <rect x={32 + i * 124} y={272} width={88} height={38} rx="7" fill={p.amberBg} stroke={p.amberBorder} />
          <line x1={84 + i * 124} y1={272} x2={84 + i * 124} y2={310} stroke={p.amberBorder} />
          <text x={58 + i * 124} y={295} textAnchor="middle" fill={p.amber} fontSize="12" fontWeight="800" fontFamily={MONO}>
            {val}
          </text>
          <text x={102 + i * 124} y={295} textAnchor="middle" fill={p.inkMuted} fontSize="10" fontFamily={MONO}>
            •
          </text>
          <Arrow id={id} x1={120 + i * 124} y1={291} x2={152 + i * 124} y2={291} tone="amber" p={p} />
        </g>
      ))}
      <Pill x={404} y={274} w={58} h={34} label="None" tone="muted" p={p} />
      <text x={32} y={340} fill={p.inkSoft} fontSize="10">Đổi con trỏ chú ý thứ tự gán | Phát hiện chu trình: Rùa &amp; Thỏ (slow/fast).</text>

      {/* Right: BST + BFS Shortest Path */}
      <Panel x={488} y={54} w={378} h={312} title="Cây Nhị Phân Tìm Kiếm (BST) & BFS Đường Ngắn Nhất" tone="violet" p={p} />
      <Callout x={846} y={66} n={3} tone="violet" p={p} />

      {/* BST Visual */}
      <Pill x={642} y={92} w={70} h={30} label="20" tone="violet" p={p} />
      <line x1={660} y1={122} x2={590} y2={152} stroke={p.cyan} strokeWidth="1.6" />
      <line x1={694} y1={122} x2={764} y2={152} stroke={p.emerald} strokeWidth="1.6" />

      <Pill x={555} y={152} w={70} h={30} label="10 (<20)" tone="cyan" p={p} />
      <Pill x={729} y={152} w={70} h={30} label="30 (>20)" tone="emerald" p={p} />

      <line x1={575} y1={182} x2={540} y2={208} stroke={p.borderStrong} />
      <line x1={605} y1={182} x2={640} y2={208} stroke={p.borderStrong} />
      <Pill x={508} y={208} w={56} h={26} label="5" tone="muted" p={p} />
      <Pill x={614} y={208} w={56} h={26} label="15" tone="muted" p={p} />

      <text x={504} y={254} fill={p.cyan} fontSize="10.5" fontWeight="700" fontFamily={MONO}>
        In-order (Trái -&gt; Gốc -&gt; Phải): [5, 10, 15, 20, 30] tăng dần!
      </text>

      <CodeBlock
        x={504}
        y={266}
        w={346}
        p={p}
        lines={[
          { text: '# BFS tìm số bước ít nhất (nhớ đánh dấu visited SỚM!):', tone: 'muted' },
          { text: 'q, seen = deque([(start, 0)]), {start}', tone: 'emerald' },
          { text: 'while q:', tone: 'cyan' },
          { text: '    u, dist = q.popleft()     # lan theo từng lớp', tone: 'violet' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M20 — Dynamic Programming (Top-Down @cache vs Bottom-Up Table) & Backtracking
 * ========================================================================== */
const PyM20: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm20';
  return (
    <Shell id={id} badge="PY:M20" title="Quy Hoạch Động (Bảng Trạng Thái DP) & Quay Lui (Thử -> Đệ Quy -> Gỡ)" rightNote="DP Table · Backtracking" isLight={isLight} className={className}>
      {/* Left: Dynamic Programming */}
      <Panel x={14} y={54} w={442} h={312} title="Quy hoạch động (DP): Bài toán con gối nhau + Chuyển trạng thái" tone="cyan" p={p} />
      <Callout x={436} y={66} n={1} tone="cyan" p={p} />

      <text x={30} y={96} fill={p.cyan} fontSize="10.5" fontWeight="700" fontFamily={MONO}>
        Ví dụ Coin Change (coins=[1, 3, 4], đổi tổng 6): dp[x] = min xu
      </text>

      {/* DP Array 0..6 */}
      {[
        { i: 0, v: 0 },
        { i: 1, v: 1 },
        { i: 2, v: 2 },
        { i: 3, v: 1 },
        { i: 4, v: 1 },
        { i: 5, v: 2 },
        { i: 6, v: 2 },
      ].map((cell) => {
        const isTarget = cell.i === 6;
        const isDep = cell.i === 3 || cell.i === 2 || cell.i === 5;
        return (
          <g key={cell.i}>
            <rect
              x={30 + cell.i * 58}
              y={110}
              width={52}
              height={54}
              rx="7"
              fill={isTarget ? p.emeraldBg : isDep ? p.cyanBg : p.codeBg}
              stroke={isTarget ? p.emerald : isDep ? p.cyanBorder : p.border}
              strokeWidth={isTarget ? 2 : 1.2}
            />
            <text x={56 + cell.i * 58} y={128} textAnchor="middle" fill={p.inkMuted} fontSize="9.5" fontFamily={MONO}>
              dp[{cell.i}]
            </text>
            <text
              x={56 + cell.i * 58}
              y={152}
              textAnchor="middle"
              fill={isTarget ? p.emerald : p.ink}
              fontSize="14"
              fontWeight="800"
              fontFamily={MONO}
            >
              {cell.v}
            </text>
          </g>
        );
      })}

      {/* Curved transition arrow from dp[3] to dp[6] */}
      <path
        d="M 230 166 C 260 198, 360 198, 404 166"
        fill="none"
        stroke={p.emerald}
        strokeWidth="1.8"
        markerEnd={`url(#arr-emerald-${id})`}
      />
      <text x={317} y={202} textAnchor="middle" fill={p.emerald} fontSize="10" fontWeight="700" fontFamily={MONO}>
        dp[6] = dp[6-3] + 1 = 2 xu (3+3) — Tham lam 4+1+1 ra 3 xu (SAI!)
      </text>

      <Callout x={38} y={230} n={2} tone="emerald" p={p} />
      <CodeBlock
        x={58}
        y={218}
        w={382}
        p={p}
        lines={[
          { text: '# 1) Top-Down: viết công thức đệ quy tự nhiên + @cache', tone: 'cyan' },
          { text: '# 2) Bottom-Up: điền bảng từ 0 -> n (không lo tràn stack!)', tone: 'emerald' },
          { text: 'dp = [0] + [inf] * amount', tone: 'ink' as Tone },
          { text: 'for x in range(1, amount + 1):', tone: 'ink' as Tone },
          { text: '    dp[x] = min((dp[x - c] + 1 for c in coins if c <= x), default=inf)', tone: 'amber' },
        ]}
      />

      {/* Right: Backtracking */}
      <Panel x={468} y={54} w={398} h={312} title="Quay lui (Backtracking): Chọn -> Khám phá -> Gỡ (Undo) + Cắt nhánh" tone="violet" p={p} />
      <Callout x={846} y={66} n={3} tone="violet" p={p} />

      <Pill x={486} y={94} w={362} h={38} label="1. CHOOSE: path.append(choice)" sub="Kiểm tra hợp lệ sớm (Pruning cắt nhánh cụt ngay!)" tone="cyan" p={p} />
      <Arrow id={id} x1={667} y1={132} x2={667} y2={154} tone="violet" p={p} />

      <Pill x={486} y={156} w={362} h={38} label="2. EXPLORE: backtrack(step + 1)" sub="Đệ quy đi sâu xuống tầng kế tiếp" tone="violet" p={p} />
      <Arrow id={id} x1={667} y1={194} x2={667} y2={216} tone="amber" p={p} />

      <Pill x={486} y={218} w={362} h={38} label="3. UNCHOOSE: path.pop()" sub="Khôi phục nguyên trạng để thử lựa chọn tiếp theo!" tone="amber" p={p} />

      <CodeBlock
        x={486}
        y={270}
        w={362}
        p={p}
        lines={[
          { text: 'if len(path) == k:', tone: 'emerald' },
          { text: '    result.append(path.copy())  # BẮT BUỘC .copy()!', tone: 'rose' },
          { text: '    return                      # nếu không mọi nghiệm đều rỗng!', tone: 'muted' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M21 — HTTP Client (httpx/requests timeout + DI) & FastAPI Pydantic Validation
 * ========================================================================== */
const PyM21: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm21';
  return (
    <Shell id={id} badge="PY:M21" title="Chu Trình HTTP Client An Toàn (timeout + Tách Hàm) & Backend FastAPI + Pydantic" rightNote="httpx/requests · FastAPI" isLight={isLight} className={className}>
      {/* Top: HTTP Client Best Practices */}
      <Panel x={14} y={54} w={852} h={150} title="Gọi API Chuẩn Thực Chiến: BẮT BUỘC có timeout + raise_for_status() + Tách I/O khỏi Parse" tone="cyan" p={p} />
      <Callout x={846} y={66} n={1} tone="cyan" p={p} />

      <Pill x={28} y={96} w={238} h={52} label="httpx.get(url, params=..., timeout=10)" sub="KHÔNG nối chuỗi URL! Thiếu timeout = treo mãi!" tone="cyan" p={p} />
      <Arrow id={id} x1={270} y1={122} x2={312} y2={122} tone="cyan" p={p} label="Response" />

      <Pill x={316} y={96} w={236} h={52} label="r.raise_for_status()" sub="404/500 tự ném HTTPError (không lọt ngầm!)" tone="amber" p={p} />
      <Arrow id={id} x1={556} y1={122} x2={598} y2={122} tone="emerald" p={p} label="r.json()" />

      <Pill x={602} y={96} w={248} h={52} label="parse_weather(data: dict)" sub="Hàm thuần (Pure) -> pytest không cần mạng!" tone="emerald" p={p} />

      <text x={28} y={174} fill={p.inkSoft} fontSize="10.5">
        Gọi nhiều request cùng host: dùng with httpx.Client(timeout=10) as client: để tái sử dụng kết nối TCP/TLS!
      </text>
      <text x={28} y={192} fill={p.inkMuted} fontSize="10" fontFamily={MONO}>
        Dependency Injection: def get_report(city, fetch=http_fetch): -&gt; khi test truyền fake_fetch trả dict mẫu trong 0.1ms.
      </text>

      {/* Bottom: FastAPI + Pydantic Pipeline */}
      <Panel x={14} y={216} w={852} h={150} title="Web Backend Hiện Đại: FastAPI + Type Hints + Pydantic Tự Động Kiểm Tra & Sinh OpenAPI /docs" tone="emerald" p={p} />
      <Callout x={846} y={228} n={2} tone="emerald" p={p} />

      <Pill x={28} y={260} w={162} h={50} label='POST /items JSON' sub='{"name":"Book","price":-5}' tone="muted" p={p} />
      <Arrow id={id} x1={194} y1={285} x2={232} y2={285} tone="violet" p={p} />

      <rect x={236} y={250} width={258} height={74} rx="8" fill={p.violetBg} stroke={p.violetBorder} />
      <text x={248} y={270} fill={p.violet} fontSize="11" fontWeight="700" fontFamily={MONO}>class ItemIn(BaseModel):</text>
      <text x={248} y={289} fill={p.ink} fontSize="10.5" fontFamily={MONO}>    name: str</text>
      <text x={248} y={308} fill={p.amber} fontSize="10.5" fontFamily={MONO}>    price: float = Field(gt=0)</text>

      {/* Invalid vs Valid branches */}
      <Arrow id={id} x1={498} y1={268} x2={556} y2={264} tone="rose" p={p} label="sai kiểu" />
      <Arrow id={id} x1={498} y1={304} x2={556} y2={316} tone="emerald" p={p} label="hợp lệ" />

      <Pill x={560} y={246} w={290} h={38} label="HTTP 422 Unprocessable Entity" sub="Tự báo rõ trường nào sai trước khi vào hàm!" tone="rose" p={p} />
      <Callout x={542} y={252} n={3} tone="rose" p={p} />
      <Pill x={560} y={298} w={290} h={42} label="201 Created + Swagger UI (/docs)" sub="Tài liệu tương tác sinh tự động từ Type Hints" tone="emerald" p={p} />
    </Shell>
  );
};

/* ============================================================================
 * M22 — 3 Concurrency Lanes: asyncio Event Loop vs ThreadPool (GIL) vs ProcessPool
 * ========================================================================== */
const PyM22: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm22';
  return (
    <Shell id={id} badge="PY:M22" title="3 Làn Đồng Thời Trong Python: asyncio Event Loop vs Threading (GIL) vs Multiprocessing" rightNote="asyncio · GIL · Multi-Core" isLight={isLight} className={className}>
      {/* Lane 1: asyncio */}
      <Panel x={14} y={54} w={274} h={312} title="1. asyncio (1 Thread · Event Loop)" tone="cyan" p={p} />
      <Callout x={268} y={66} n={1} tone="cyan" p={p} />

      <Pill x={28} y={92} w={246} h={42} label="await asyncio.gather(*tasks)" sub="Hàng nghìn kết nối mạng/API cùng lúc" tone="cyan" p={p} />

      {/* Cooperative timeline */}
      <rect x={28} y={146} width={246} height={84} rx="7" fill={p.codeBg} stroke={p.border} />
      <text x={38} y={165} fill={p.cyan} fontSize="10" fontWeight="700" fontFamily={MONO}>Task A: [Gửi] ---await--- [Nhận]</text>
      <text x={38} y={185} fill={p.emerald} fontSize="10" fontWeight="700" fontFamily={MONO}>Task B:     [Gửi] ---await--- [Nhận]</text>
      <text x={38} y={205} fill={p.violet} fontSize="10" fontWeight="700" fontFamily={MONO}>Task C:         [Gửi] ---await---</text>
      <text x={38} y={222} fill={p.inkMuted} fontSize="9.5">Nhường vòng lặp tại điểm await!</text>

      <rect x={28} y={242} width={246} height={110} rx="7" fill={p.roseBg} stroke={p.roseBorder} />
      <text x={38} y={262} fill={p.rose} fontSize="10.5" fontWeight="700">BẪY CHẾT NGƯỜI TRONG ASYNC:</text>
      <text x={38} y={282} fill={p.ink} fontSize="10" fontFamily={MONO}>SAI: time.sleep(1) / requests.get</text>
      <text x={38} y={299} fill={p.inkSoft} fontSize="9.5">-&gt; Đóng băng toàn bộ Event Loop!</text>
      <text x={38} y={320} fill={p.emerald} fontSize="10" fontWeight="700" fontFamily={MONO}>ĐÚNG: await asyncio.sleep(1)</text>
      <text x={38} y={338} fill={p.emerald} fontSize="10" fontFamily={MONO}>Dùng Semaphore(10) giới hạn tải.</text>

      {/* Lane 2: Threading + GIL */}
      <Panel x={303} y={54} w={274} h={312} title="2. ThreadPoolExecutor (Chung GIL)" tone="amber" p={p} />
      <Callout x={557} y={66} n={2} tone="amber" p={p} />

      <Pill x={317} y={92} w={246} h={42} label="I/O Đồng Bộ (requests, sqlite3, file)" sub="Đơn giản, không cần viết lại async" tone="amber" p={p} />

      <rect x={317} y={146} width={246} height={106} rx="7" fill={p.amberBg} stroke={p.amberBorder} />
      <text x={440} y={168} textAnchor="middle" fill={p.amber} fontSize="11" fontWeight="800" fontFamily={MONO}>
        GIL (Global Interpreter Lock)
      </text>
      <text x={329} y={190} fill={p.ink} fontSize="10">• Chờ mạng/đĩa: thread NHẢ GIL</text>
      <text x={329} y={208} fill={p.emerald} fontSize="10" fontWeight="600">  -&gt; I/O chạy song song cực tốt!</text>
      <text x={329} y={228} fill={p.rose} fontSize="10" fontWeight="600">• Tính toán Python thuần: giữ GIL</text>
      <text x={329} y={244} fill={p.inkSoft} fontSize="9.5">  -&gt; Không tăng tốc CPU-bound!</text>

      <CodeBlock
        x={317}
        y={264}
        w={246}
        p={p}
        lines={[
          { text: 'with ThreadPoolExecutor(8) as ex:', tone: 'amber' },
          { text: '    res = list(ex.map(fetch, urls))', tone: 'cyan' },
          { text: '# Chia sẻ RAM -> cần Lock khi ghi!', tone: 'rose' },
        ]}
      />

      {/* Lane 3: Multiprocessing */}
      <Panel x={592} y={54} w={274} h={312} title="3. ProcessPoolExecutor (Đa Nhân)" tone="emerald" p={p} />
      <Callout x={846} y={66} n={3} tone="emerald" p={p} />

      <Pill x={606} y={92} w={246} h={42} label="CPU Nặng (Ảnh, Video, Hash, Số)" sub="Mỗi Process có Python + GIL RIÊNG!" tone="emerald" p={p} />

      {/* 4 CPU Cores */}
      {['Core 1 · GIL #1', 'Core 2 · GIL #2', 'Core 3 · GIL #3', 'Core 4 · GIL #4'].map((c, idx) => (
        <rect key={idx} x={606 + (idx % 2) * 126} y={146 + Math.floor(idx / 2) * 48} width={120} height={40} rx="7" fill={p.emeraldBg} stroke={p.emeraldBorder} />
      ))}
      {['Core 1 · GIL #1', 'Core 2 · GIL #2', 'Core 3 · GIL #3', 'Core 4 · GIL #4'].map((c, idx) => (
        <text
          key={`t-${idx}`}
          x={666 + (idx % 2) * 126}
          y={170 + Math.floor(idx / 2) * 48}
          textAnchor="middle"
          fill={p.emerald}
          fontSize="10"
          fontWeight="700"
          fontFamily={MONO}
        >
          {c}
        </text>
      ))}

      <CodeBlock
        x={606}
        y={254}
        w={246}
        p={p}
        lines={[
          { text: '# Tận dụng 100% mọi nhân CPU:', tone: 'muted' },
          { text: 'with ProcessPoolExecutor() as ex:', tone: 'emerald' },
          { text: '    out = list(ex.map(heavy, jobs))', tone: 'cyan' },
          { text: '# Nhớ đặt trong if __name__=="__main__":', tone: 'amber' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M23 — Clean Production 3-Layer Python Project Architecture
 * ========================================================================== */
const PyM23: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm23';
  return (
    <Shell id={id} badge="PY:M23" title="Kiến Trúc 3 Lớp Cho Project Thực Tế: UI (CLI/GUI/Web) -> Core Thuần <- Storage" rightNote="core.py · storage.py · sqlite3" isLight={isLight} className={className}>
      {/* Left: 3-Layer Dependency Flow */}
      <Panel x={14} y={54} w={482} h={312} title="Tách 3 lớp rõ ràng: Đổi CLI sang Tkinter/FastAPI mà KHÔNG đụng 1 dòng Core!" tone="cyan" p={p} />
      <Callout x={476} y={66} n={1} tone="cyan" p={p} />

      {/* Top UI Layer */}
      <Pill x={30} y={94} w={136} h={46} label="cli.py" sub="argparse / input" tone="violet" p={p} />
      <Pill x={180} y={94} w={136} h={46} label="gui.py" sub="tkinter / ttk" tone="violet" p={p} />
      <Pill x={330} y={94} w={148} h={46} label="api.py" sub="FastAPI endpoints" tone="violet" p={p} />

      <Arrow id={id} x1={98} y1={140} x2={180} y2={178} tone="violet" p={p} />
      <Arrow id={id} x1={248} y1={140} x2={248} y2={178} tone="violet" p={p} label="gọi" />
      <Arrow id={id} x1={404} y1={140} x2={316} y2={178} tone="violet" p={p} />

      {/* Middle Core Domain Layer */}
      <rect x={44} y={180} width={420} height={74} rx="10" fill={p.emeraldBg} stroke={p.emeraldBorder} strokeWidth="1.8" />
      <text x={254} y={204} textAnchor="middle" fill={p.emerald} fontSize="12" fontWeight="800" fontFamily={MONO}>
        core.py — Logic Nghiệp Vụ Thuần (Pure Python + @dataclass)
      </text>
      <text x={254} y={224} textAnchor="middle" fill={p.ink} fontSize="10.5">
        KHÔNG input(), KHÔNG print(), KHÔNG SQL/HTTP -&gt; pytest đạt 95% dễ dàng!
      </text>
      <text x={254} y={242} textAnchor="middle" fill={p.inkMuted} fontSize="10" fontFamily={MONO}>
        add_expense(items, amount, tag) -&gt; Expense  |  monthly_summary(items)
      </text>

      <Arrow id={id} x1={254} y1={254} x2={254} y2={288} tone="cyan" p={p} label="lưu / đọc" />

      {/* Bottom Storage Layer */}
      <Pill x={44} y={290} w={202} h={54} label="storage_sqlite.py" sub="sqlite3 ACID + truy vấn SQL" tone="cyan" p={p} />
      <Pill x={262} y={290} w={202} h={54} label="storage_json.py" sub="pathlib + json UTF-8" tone="amber" p={p} />

      {/* Right: SQLite Parameterized Query + Project Checklist */}
      <Panel x={508} y={54} w={358} h={164} title="sqlite3 Có Sẵn: Luôn Dùng Dấu Hỏi (?) Tham Số Hoá" tone="emerald" p={p} />
      <Callout x={846} y={66} n={2} tone="emerald" p={p} />
      <CodeBlock
        x={522}
        y={86}
        w={330}
        p={p}
        lines={[
          { text: 'with sqlite3.connect(db_path) as conn:', tone: 'cyan' },
          { text: '    conn.execute(', tone: 'emerald' },
          { text: '        "INSERT INTO tasks VALUES (?, ?)",', tone: 'emerald' },
          { text: '        (title, done),   # CẤM dùng f-string SQL!', tone: 'amber' },
          { text: '    )                    # tự động commit khi thoát with', tone: 'muted' },
        ]}
      />

      <Panel x={508} y={230} w={358} h={136} title="Checklist Đóng Gói Project Chuẩn Thực Tế" tone="amber" p={p} />
      <Callout x={846} y={242} n={3} tone="amber" p={p} />
      <CodeBlock
        x={522}
        y={260}
        w={330}
        p={p}
        lines={[
          { text: '1. pyproject.toml + [project.scripts] chạy bằng uv run', tone: 'cyan' },
          { text: '2. Không hard-code đường dẫn /Users/... hay API key', tone: 'rose' },
          { text: '3. Mọi hàm public có docstring + type hints rõ ràng', tone: 'emerald' },
          { text: '4. tests/ chạy xanh uv run pytest (cả dữ liệu rỗng/lỗi)', tone: 'amber' },
        ]}
      />
    </Shell>
  );
};

/* ============================================================================
 * M24 — Defensive Code Audit: SQLi/Command Injection/Brute-Force vs Hardened Defenses
 * ========================================================================== */
const PyM24: DiagramRenderer = ({ isLight, className }) => {
  const p = getPalette(isLight);
  const id = 'm24';
  return (
    <Shell id={id} badge="PY:M24" title="Kiểm Toán Bảo Mật Python: Nhận Diện Mẫu Nguy Hiểm vs Kỹ Thuật Phòng Thủ" rightNote="scrypt · secrets · Defense" isLight={isLight} className={className}>
      {/* Left: Red Flag Patterns to Audit */}
      <Panel x={14} y={54} w={418} h={312} title="Dấu hiệu Nguy hiểm khi Review Code (Vulnerability Audit)" tone="rose" p={p} />
      <Callout x={412} y={66} n={1} tone="rose" p={p} />

      <CodeBlock
        x={28}
        y={88}
        w={390}
        p={p}
        lines={[
          { text: '# 1) SQL Injection — ghép trực tiếp f-string vào câu lệnh:', tone: 'muted' },
          { text: 'cur.execute(f"SELECT * FROM u WHERE name=\'{user}\'")', tone: 'rose' },
          { text: '', tone: 'muted' },
          { text: '# 2) Command / Code Injection — thực thi chuỗi người dùng:', tone: 'muted' },
          { text: 'eval(user_expr)   |   subprocess.run(cmd, shell=True)', tone: 'rose' },
          { text: '', tone: 'muted' },
          { text: '# 3) Băm mật khẩu yếu không muối & tạo token đoán được:', tone: 'muted' },
          { text: 'hashlib.md5(pw.encode())   |   random.randint(1000,9999)', tone: 'amber' },
          { text: '', tone: 'muted' },
          { text: '# 4) Path Traversal — mở đường dẫn ../../etc/passwd:', tone: 'muted' },
          { text: 'open("/var/uploads/" + filename)', tone: 'amber' },
        ]}
      />
      <text x={28} y={322} fill={p.inkSoft} fontSize="10.5">Nhận diện vòng lặp brute-force: itertools.product / wordlist</text>
      <text x={28} y={340} fill={p.inkMuted} fontSize="10">gửi đăng nhập liên tục không giới hạn tốc độ.</text>

      {/* Right: Hardened Defensive Countermeasures */}
      <Panel x={444} y={54} w={422} h={312} title="Mẫu Code Phòng Thủ Chuẩn Sản Xuất (Hardened Python)" tone="emerald" p={p} />
      <Callout x={846} y={66} n={2} tone="emerald" p={p} />

      <CodeBlock
        x={458}
        y={88}
        w={394}
        p={p}
        lines={[
          { text: '# 1) SQL Tham số hoá (?) & subprocess truyền list:', tone: 'muted' },
          { text: 'cur.execute("SELECT * FROM u WHERE name = ?", (user,))', tone: 'emerald' },
          { text: 'subprocess.run(["convert", src_file], shell=False)', tone: 'emerald' },
          { text: '', tone: 'muted' },
          { text: '# 2) Băm mật khẩu chậm + salt ngẫu nhiên + so sánh hằng thời gian:', tone: 'muted' },
          { text: 'salt = secrets.token_bytes(16)', tone: 'cyan' },
          { text: 'dk = hashlib.scrypt(pw.encode(), salt=salt, n=2**14, r=8, p=1)', tone: 'cyan' },
          { text: 'ok = secrets.compare_digest(actual_dk, expected_dk)', tone: 'emerald' },
        ]}
      />

      <Callout x={468} y={266} n={3} tone="cyan" p={p} />
      <rect x={488} y={254} width={364} height={98} rx="8" fill={p.cyanBg} stroke={p.cyanBorder} />
      <text x={500} y={274} fill={p.cyan} fontSize="10.5" fontWeight="700">3. Chống Brute-Force, Path Traversal &amp; SSRF:</text>
      <text x={500} y={294} fill={p.ink} fontSize="10" fontFamily={MONO}>• Rate Limit + Exponential Backoff + MFA (vô hiệu vét cạn)</text>
      <text x={500} y={312} fill={p.ink} fontSize="10" fontFamily={MONO}>• Path.resolve().is_relative_to(BASE_DIR) (chặn ../)</text>
      <text x={500} y={330} fill={p.ink} fontSize="10" fontFamily={MONO}>• ast.literal_eval() thay eval() · secrets.token_urlsafe()</text>
    </Shell>
  );
};

export const PYTHON_DIAGRAMS: Record<string, DiagramRenderer> = {
  'py:m00': PyM00,
  'py:m01': PyM01,
  'py:m02': PyM02,
  'py:m03': PyM03,
  'py:m04': PyM04,
  'py:m05': PyM05,
  'py:m06': PyM06,
  'py:m07': PyM07,
  'py:m08': PyM08,
  'py:m09': PyM09,
  'py:m10': PyM10,
  'py:m11': PyM11,
  'py:m12': PyM12,
  'py:m13': PyM13,
  'py:m14': PyM14,
  'py:m15': PyM15,
  'py:m16': PyM16,
  'py:m17': PyM17,
  'py:m18': PyM18,
  'py:m19': PyM19,
  'py:m20': PyM20,
  'py:m21': PyM21,
  'py:m22': PyM22,
  'py:m23': PyM23,
  'py:m24': PyM24,
  'py:m25': PyM25,
  'py:m26': PyM26,
  'py:m27': PyM27,
  'py:m28': PyM28,
  'py:m29': PyM29,
  'py:m30': PyM30,
  'py:m31': PyM31,
  'py:m32': PyM32,
};

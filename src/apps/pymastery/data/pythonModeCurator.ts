import type {
  BilingualText,
  CodeTraceScene,
  MemoryScene,
  StageRenderMode,
  StageScene,
} from '@/components/scale-workbench/types';

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

/**
 * Explicit pedagogical triage across all 33 Python Mastery modules:
 * - 'isometric' (11 modules): True runtime, package, I/O stream, CLI, pipeline, HTTP, async/GIL & security architectures.
 * - 'memory-2d' (10 modules): Spacious 2D array slicing rulers, name->heap object pointers, hash buckets, call trees & DP grids.
 * - 'code-trace' (12 modules): Pure syntax, arithmetic, branching, loops, comprehensions, exceptions, @dataclass & pytest — NO forced diagrams!
 */
export const PYTHON_PRIMARY_MODE: Record<string, StageRenderMode> = {
  // Group A: Isometric 2.5D System / Pipeline Flows (11)
  M00: 'isometric',
  M09: 'isometric',
  M11: 'isometric',
  M12: 'isometric',
  M15: 'isometric',
  M16: 'isometric',
  M21: 'isometric',
  M22: 'isometric',
  M23: 'isometric',
  M24: 'isometric',
  M32: 'isometric',

  // Group B: Clean 2D Memory / Data Structure / Tree Visualizer (10)
  M01: 'memory-2d',
  M02: 'memory-2d',
  M04: 'memory-2d',
  M05: 'memory-2d',
  M07: 'memory-2d',
  M08: 'memory-2d',
  M13: 'memory-2d',
  M18: 'memory-2d',
  M19: 'memory-2d',
  M20: 'memory-2d',

  // Group C: No-Diagram Interactive Code & Step Trace Workbench (12)
  M25: 'code-trace',
  M26: 'code-trace',
  M27: 'code-trace',
  M28: 'code-trace',
  M29: 'code-trace',
  M30: 'code-trace',
  M03: 'code-trace',
  M06: 'code-trace',
  M31: 'code-trace',
  M10: 'code-trace',
  M14: 'code-trace',
  M17: 'code-trace',
};

/** Clean, spacious 2:1-aligned Isometric Scenes with short non-overflowing labels for the 11 Group-A modules */
export function buildCuratedIsometricScene(
  moduleId: string,
  stepIdx: number
): StageScene | null {
  switch (moduleId) {
    case 'M00': {
      // Only show isometric runtime diagram on architectural steps (Step 0: Tooling/Runtime, Step 3: __main__ vs import)
      if (stepIdx !== 0 && stepIdx !== 3) return null;
      const isImport = stepIdx === 3;
      return {
        nodes: [
          { id: 'ed', shape: 'device', tone: 'neutral', x: -245, y: 18, label: bi('app.py · uv', 'app.py · uv') },
          { id: 'bc', shape: 'block', tone: 'yellow', x: -75, y: -38, label: bi('Bytecode', 'Bytecode'), icon: 'code', badge: { text: bi('4-space AST', '4-space AST') } },
          { id: 'vm', shape: 'block', tone: 'blue', x: 95, y: -38, label: bi('CPython VM', 'CPython VM'), icon: 'cpu', loadPct: 22 },
          {
            id: 'entry',
            shape: 'block',
            tone: isImport ? 'purple' : 'green',
            x: 248,
            y: 28,
            label: isImport ? bi('Imported', 'Imported') : bi('__main__', '__main__'),
            icon: 'zap',
            badge: {
              text: isImport ? bi('skip demo block', 'skip demo block') : bi('run main()', 'run main()'),
              tone: isImport ? 'warn' : 'ok',
            },
          },
        ],
        links: [
          { id: 'l1', from: 'ed', to: 'bc', label: bi('uv run', 'uv run') },
          { id: 'l2', from: 'bc', to: 'vm', label: bi('.pyc ops', '.pyc ops') },
          { id: 'l3', from: 'vm', to: 'entry', style: isImport ? 'dashed' : 'solid', label: bi('__name__ check', '__name__ check') },
        ],
        packets: [
          { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.42 },
          { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.44, offset: 0.35 },
          { id: 'p3', linkId: 'l3', kind: isImport ? 'mutation' : 'response', speed: 0.42, offset: 0.68 },
        ],
      };
    }

    case 'M32': {
      const shadowTrap = stepIdx === 4;
      return {
        nodes: [
          { id: 'app', shape: 'device', tone: 'neutral', x: -245, y: 15, label: bi('main.py', 'main.py') },
          {
            id: 'sys',
            shape: 'block',
            tone: shadowTrap ? 'rose' : 'purple',
            x: -45,
            y: -25,
            label: shadowTrap ? bi('random.py!', 'random.py!') : bi('sys.modules', 'sys.modules'),
            icon: 'layers',
            badge: {
              text: shadowTrap ? bi('Trùng tên che Stdlib!', 'Shadows Stdlib!') : bi('Cache module (1 lần)', 'Cached singleton'),
              tone: shadowTrap ? 'bad' : 'ok',
            },
          },
          { id: 'std', shape: 'db', tone: 'green', x: 205, y: -55, label: bi('Python Stdlib', 'Python Stdlib'), dimmed: shadowTrap },
          { id: 'venv', shape: 'db', tone: 'blue', x: 205, y: 65, label: bi('.venv · uv add', '.venv · uv add') },
        ],
        links: [
          { id: 'l1', from: 'app', to: 'sys', style: shadowTrap ? 'danger' : 'solid', label: bi('import', 'import') },
          { id: 'l2', from: 'sys', to: 'std', style: shadowTrap ? 'off' : 'solid', label: bi('math · json', 'math · json') },
          { id: 'l3', from: 'sys', to: 'venv', style: 'dashed', label: bi('PyPI pkg', 'PyPI pkg') },
        ],
        packets: [
          { id: 'p1', linkId: 'l1', kind: shadowTrap ? 'error' : 'request', speed: 0.44 },
          ...(!shadowTrap ? [{ id: 'p2', linkId: 'l2', kind: 'cache-hit' as const, speed: 0.44, offset: 0.48 }] : []),
        ],
      };
    }

    case 'M09': {
      return {
        nodes: [
          { id: 'cli', shape: 'device', tone: 'neutral', x: -248, y: 12, label: bi('pytest · CLI', 'pytest · CLI') },
          { id: 'api', shape: 'block', tone: 'blue', x: -55, y: -42, label: bi('pkg.routes', 'pkg.routes'), icon: 'globe' },
          { id: 'svc', shape: 'block', tone: 'green', x: -55, y: 62, label: bi('pkg.service', 'pkg.service'), icon: 'cpu', badge: { text: bi('Chuẩn src/ layout', 'src/ layout'), tone: 'ok' } },
          { id: 'mod', shape: 'db', tone: 'purple', x: 205, y: 8, label: bi('pkg.models (DAG)', 'pkg.models (DAG)') },
        ],
        links: [
          { id: 'l1', from: 'cli', to: 'api', label: bi('import pkg', 'import pkg') },
          { id: 'l2', from: 'api', to: 'svc', label: bi('1-way call', '1-way call') },
          { id: 'l3', from: 'svc', to: 'mod', label: bi('shared types', 'shared types') },
        ],
        packets: [
          { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.42 },
          { id: 'p2', linkId: 'l3', kind: 'response', speed: 0.42, offset: 0.5 },
        ],
      };
    }

    case 'M11': {
      return {
        nodes: [
          { id: 'disk', shape: 'db', tone: 'yellow', x: -235, y: 10, label: bi('UTF-8 Disk File', 'UTF-8 Disk File') },
          { id: 'ctx', shape: 'block', tone: 'green', x: -15, y: -25, label: bi('with open()', 'with open()'), icon: 'shield', badge: { text: bi('Tự động close() an toàn', 'Auto-close guaranteed'), tone: 'ok' } },
          { id: 'out', shape: 'block', tone: 'blue', x: 215, y: 15, label: stepIdx >= 3 ? bi('DictReader', 'DictReader') : bi('json.loads', 'json.loads'), icon: 'layers', badge: { text: bi('Đọc theo dòng O(1)', 'O(1) row stream') } },
        ],
        links: [
          { id: 'l1', from: 'disk', to: 'ctx', label: bi('Path / file', 'Path / file') },
          { id: 'l2', from: 'ctx', to: 'out', label: bi('parse UTF-8', 'parse UTF-8') },
        ],
        packets: [
          { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.44 },
          { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.44, offset: 0.48 },
        ],
      };
    }

    case 'M12': {
      return {
        nodes: [
          { id: 'sh', shape: 'device', tone: 'neutral', x: -250, y: 12, label: bi('stdin · argv', 'stdin · argv') },
          { id: 'arg', shape: 'block', tone: 'blue', x: -45, y: -15, label: bi('argparse', 'argparse'), icon: 'terminal', badge: { text: bi('main(argv)', 'main(argv)'), tone: 'ok' } },
          { id: 'out', shape: 'block', tone: 'green', x: 205, y: -58, label: bi('stdout (1)', 'stdout (1)'), icon: 'zap', badge: { text: bi('Dữ liệu sạch | jq', 'Clean pipe | jq'), tone: 'ok' } },
          { id: 'err', shape: 'block', tone: 'rose', x: 205, y: 62, label: bi('stderr (2)', 'stderr (2)'), icon: 'alert', badge: { text: bi('Log & lỗi · exit != 0', 'Logs · exit != 0') } },
        ],
        links: [
          { id: 'l1', from: 'sh', to: 'arg', label: bi('--flags', '--flags') },
          { id: 'l2', from: 'arg', to: 'out', label: bi('exit 0', 'exit 0') },
          { id: 'l3', from: 'arg', to: 'err', style: 'dashed', label: bi('diagnostics', 'diagnostics') },
        ],
        packets: [
          { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.45 },
          { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.45, offset: 0.5 },
        ],
      };
    }

    case 'M15': {
      return {
        nodes: [
          { id: 'src', shape: 'db', tone: 'yellow', x: -255, y: 8, label: bi('10 GB Log File', '10 GB Log File') },
          { id: 'gen1', shape: 'block', tone: 'blue', x: -65, y: -25, label: bi('yield line', 'yield line'), icon: 'clock', loadPct: 4, badge: { text: bi('Tạm dừng & giữ frame', 'Pause & keep frame') } },
          { id: 'gen2', shape: 'block', tone: 'purple', x: 95, y: 22, label: bi('islice / map', 'islice / map'), icon: 'layers' },
          { id: 'sink', shape: 'block', tone: 'green', x: 255, y: -22, label: bi('Consumer', 'Consumer'), icon: 'zap', badge: { text: bi('O(1) RAM (< 64 KB)', 'O(1) RAM (< 64 KB)'), tone: 'ok' } },
        ],
        links: [
          { id: 'l1', from: 'src', to: 'gen1', label: bi('1 line', '1 line') },
          { id: 'l2', from: 'gen1', to: 'gen2', label: bi('next()', 'next()') },
          { id: 'l3', from: 'gen2', to: 'sink', label: bi('lazy pull', 'lazy pull') },
        ],
        packets: [
          { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.44 },
          { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.44, offset: 0.34 },
          { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.44, offset: 0.68 },
        ],
      };
    }

    case 'M16': {
      const isWith = stepIdx >= 3;
      return {
        nodes: [
          { id: 'call', shape: 'device', tone: 'neutral', x: -255, y: 12, label: bi('Caller', 'Caller') },
          { id: 'pre', shape: 'block', tone: 'blue', x: -75, y: -25, label: isWith ? bi('__enter__', '__enter__') : bi('@wraps Pre', '@wraps Pre'), icon: 'shield' },
          { id: 'fn', shape: 'block', tone: 'green', x: 85, y: 20, label: bi('Core fn()', 'Core fn()'), icon: 'cpu', badge: { text: bi('Logic nghiệp vụ thuần', 'Pure business logic'), tone: 'ok' } },
          { id: 'post', shape: 'block', tone: 'purple', x: 248, y: -25, label: isWith ? bi('__exit__', '__exit__') : bi('After Hook', 'After Hook'), icon: 'zap', badge: { text: bi('Giải phóng tài nguyên', 'Guaranteed teardown') } },
        ],
        links: [
          { id: 'l1', from: 'call', to: 'pre', label: bi('invoke', 'invoke') },
          { id: 'l2', from: 'pre', to: 'fn', label: isWith ? bi('yield res', 'yield res') : bi('*args', '*args') },
          { id: 'l3', from: 'fn', to: 'post', label: bi('finally', 'finally') },
        ],
        packets: [
          { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.44 },
          { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.44, offset: 0.35 },
          { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.44, offset: 0.7 },
        ],
      };
    }

    case 'M21': {
      const bad422 = stepIdx === 3;
      return {
        nodes: [
          { id: 'cli', shape: 'device', tone: 'neutral', x: -255, y: 14, label: bi('httpx (5s timeout)', 'httpx (5s timeout)') },
          {
            id: 'pyd',
            shape: 'block',
            tone: bad422 ? 'rose' : 'purple',
            x: -65,
            y: -25,
            label: bi('Pydantic', 'Pydantic'),
            icon: 'shield',
            badge: {
              text: bad422 ? bi('422 từ chối JSON sai', '422 invalid JSON') : bi('Xác thực Schema', 'Schema validated'),
              tone: bad422 ? 'bad' : 'ok',
            },
          },
          { id: 'api', shape: 'block', tone: 'green', x: 98, y: 20, label: bi('FastAPI', 'FastAPI'), icon: 'globe', dimmed: bad422 },
          { id: 'db', shape: 'db', tone: 'blue', x: 255, y: -15, label: bi('Domain Store', 'Domain Store'), dimmed: bad422 },
        ],
        links: [
          { id: 'l1', from: 'cli', to: 'pyd', style: bad422 ? 'danger' : 'solid', label: bi('POST JSON', 'POST JSON') },
          { id: 'l2', from: 'pyd', to: 'api', style: bad422 ? 'off' : 'solid', label: bi('typed DTO', 'typed DTO') },
          { id: 'l3', from: 'api', to: 'db', style: bad422 ? 'off' : 'solid', label: bi('200 OK', '200 OK') },
        ],
        packets: bad422
          ? [{ id: 'p1', linkId: 'l1', kind: 'error', speed: 0.45 }]
          : [
              { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
              { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.46, offset: 0.34 },
              { id: 'p3', linkId: 'l3', kind: 'response', speed: 0.46, offset: 0.68 },
            ],
      };
    }

    case 'M22': {
      const blocked = stepIdx === 2;
      const mp = stepIdx >= 4;
      return {
        nodes: [
          { id: 'crowd', shape: 'crowd', tone: 'neutral', x: -245, y: -4, label: bi('50 I/O Tasks', '50 I/O Tasks') },
          {
            id: 'loop',
            shape: 'block',
            tone: blocked ? 'rose' : 'green',
            x: 15,
            y: -52,
            label: bi('Event Loop', 'Event Loop'),
            icon: 'zap',
            loadPct: blocked ? 100 : 26,
            badge: {
              text: blocked ? bi('Blocking làm nghẽn Loop', 'Sync call stalls Loop') : bi('Non-blocking (await)', 'Non-blocking (await)'),
              tone: blocked ? 'bad' : 'ok',
            },
          },
          {
            id: 'pool',
            shape: 'block',
            tone: mp ? 'purple' : 'yellow',
            x: 225,
            y: 38,
            label: mp ? bi('ProcessPool', 'ProcessPool') : bi('ThreadPool', 'ThreadPool'),
            icon: 'cpu',
            loadPct: mp ? 92 : 35,
            badge: {
              text: mp ? bi('Đa nhân CPU (vượt GIL)', 'Multi-core (no GIL)') : bi('Xử lý Blocking I/O', 'Handles Blocking I/O'),
              tone: mp ? 'ok' : 'default',
            },
          },
        ],
        links: [
          { id: 'l1', from: 'crowd', to: 'loop', style: blocked ? 'danger' : 'solid', label: blocked ? bi('Blocking I/O!', 'Blocking I/O!') : bi('asyncio.gather', 'asyncio.gather') },
          { id: 'l2', from: 'crowd', to: 'pool', style: mp ? 'solid' : 'dashed', label: mp ? bi('CPU-bound', 'CPU-bound') : bi('to_thread()', 'to_thread()') },
        ],
        packets: [
          { id: 'p1', linkId: 'l1', kind: blocked ? 'error' : 'response', speed: 0.48 },
          { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.44, offset: 0.45 },
        ],
      };
    }

    case 'M23': {
      return {
        nodes: [
          { id: 'ui', shape: 'device', tone: 'neutral', x: -240, y: 12, label: bi('CLI · Tkinter UI', 'CLI · Tkinter UI') },
          { id: 'core', shape: 'block', tone: 'green', x: 0, y: -18, label: bi('Domain Core', 'Domain Core'), icon: 'cpu', badge: { text: bi('test < 5ms · 0 I/O', 'pure · 0 I/O'), tone: 'ok' } },
          { id: 'db', shape: 'db', tone: 'purple', x: 235, y: 8, label: bi('SQLite (? params)', 'SQLite (? params)') },
        ],
        links: [
          { id: 'l1', from: 'ui', to: 'core', label: bi('dataclass', 'dataclass') },
          { id: 'l2', from: 'core', to: 'db', label: bi('with conn:', 'with conn:') },
        ],
        packets: [
          { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.44 },
          { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.44, offset: 0.5 },
        ],
      };
    }

    case 'M24': {
      return {
        nodes: [
          { id: 'bot', shape: 'crowd', tone: 'rose', x: -245, y: 14, label: bi('Brute-force Bot', 'Brute-force Bot') },
          { id: 'rl', shape: 'block', tone: 'orange', x: -35, y: -28, label: bi('Rate Limit', 'Rate Limit'), icon: 'shield', badge: { text: bi('max 5 / 60s', 'max 5 / 60s'), tone: 'ok' } },
          { id: 'kdf', shape: 'block', tone: 'blue', x: 145, y: 22, label: bi('scrypt KDF', 'scrypt KDF'), icon: 'hash', badge: { text: bi('random salt', 'random salt') } },
          { id: 'db', shape: 'db', tone: 'green', x: 275, y: -38, label: bi('Audit Vault', 'Audit Vault') },
        ],
        links: [
          { id: 'l1', from: 'bot', to: 'rl', style: 'danger', label: bi('5k login/m', '5k login/m') },
          { id: 'l2', from: 'rl', to: 'kdf', label: bi('allowed', 'allowed') },
          { id: 'l3', from: 'kdf', to: 'db', label: bi('compare_digest', 'compare_digest') },
        ],
        packets: [
          { id: 'p1', linkId: 'l1', kind: 'error', speed: 0.52 },
          { id: 'p2', linkId: 'l2', kind: 'request', speed: 0.42, offset: 0.45 },
        ],
      };
    }

    default:
      return null;
  }
}

/** Spacious, zero-clutter 2D Memory / Slice / Tree Visuals for the 10 Group-B modules */
export function buildCuratedMemoryScene(
  moduleId: string,
  stepIdx: number
): MemoryScene | null {
  switch (moduleId) {
    case 'M01': {
      const swapped = stepIdx >= 4;
      return {
        kind: 'refs',
        leftTitle: bi('Tên biến (Namespace Tags)', 'Variable Names (Tags)'),
        rightTitle: bi('Đối tượng trên Heap', 'Objects on Heap'),
        names: [
          { id: 'na', name: 'a', note: bi('nhãn dán tham chiếu', 'name binding'), targetId: swapped ? 'o2' : 'o1' },
          { id: 'nb', name: 'b', note: swapped ? bi('hoán đổi a, b = b, a', 'swapped a, b = b, a') : bi('cùng trỏ hoặc riêng', 'independent tag'), targetId: swapped ? 'o1' : 'o2' },
        ],
        objects: [
          { id: 'o1', typeTag: 'int', value: '100', fields: ['immutable', 'id: 0x10a'], tone: 'green' },
          { id: 'o2', typeTag: 'int', value: '250', fields: ['immutable', 'id: 0x10b'], tone: 'orange' },
        ],
      };
    }

    case 'M02': {
      const rev = stepIdx >= 4;
      const slice = stepIdx === 3;
      return {
        kind: 'tape',
        title: bi('s = "Python"  (Chuỗi bất biến · Immutable)', 's = "Python"  (Immutable Unicode str)'),
        subtitle: bi('Chỉ số dương đếm từ 0 (trên) · Chỉ số âm đếm ngược từ -1 (dưới)', 'Positive index 0..5 (top) · Negative index -6..-1 (bottom)'),
        cells: ['P', 'y', 't', 'h', 'o', 'n'],
        activeIndices: slice ? [1, 2, 3, 4] : rev ? [0, 1, 2, 3, 4, 5] : [0, 5],
        showNegativeIndices: true,
        pointers: slice
          ? [
              { index: 1, label: 'start=1', tone: 'green' },
              { index: 5, label: 'stop=5 (sát trước)', tone: 'orange' },
            ]
          : [
              { index: 0, label: 's[0]', tone: 'blue' },
              { index: 5, label: 's[-1]', tone: 'purple' },
            ],
        outputPill: {
          label: slice ? bi('Kết quả s[1:5]', 'Result s[1:5]') : rev ? bi('Đảo chuỗi s[::-1]', 'Reverse s[::-1]') : bi('Đầu & Cuối', 'Ends'),
          value: slice ? bi('"ytho" (4 ký tự)', '"ytho" (4 chars)') : rev ? bi('"nohtyP" (chuỗi mới)', '"nohtyP" (new str)') : bi('"P" & "n"', '"P" & "n"'),
          tone: 'green',
        },
      };
    }

    case 'M04': {
      const trap = stepIdx === 2 || stepIdx === 3;
      return {
        kind: 'refs',
        leftTitle: bi('Biến List cấp ngoài', 'Outer List Variables'),
        rightTitle: bi('Đối tượng List con trên Heap', 'Nested Inner List Heap'),
        names: [
          { id: 'la', name: 'a[0]', note: bi('tham chiếu gốc', 'original ref'), targetId: 'in1' },
          {
            id: 'lb',
            name: trap ? 'b = a[:]  →  b[0]' : 'b = deepcopy(a) → b[0]',
            note: trap ? bi('Shallow Copy vẫn dùng chung list con!', 'Shallow copy shares inner list!') : bi('Deep Copy sao chép độc lập hoàn toàn', 'Deep copy fully isolated'),
            targetId: trap ? 'in1' : 'in2',
            style: trap ? 'danger' : 'solid',
          },
        ],
        objects: trap
          ? [
              {
                id: 'in1',
                typeTag: 'list',
                value: '[10, 20, 99!]',
                fields: ['b[0].append(99) làm thay đổi cả a[0]!'],
                tone: 'rose',
                badge: bi('⚠ Lỗi Aliasing: hai biến trỏ chung 1 list con', '⚠ Aliasing bug on nested list!'),
              },
            ]
          : [
              { id: 'in1', typeTag: 'list', value: '[10, 20]', fields: ['vùng nhớ riêng của a[0]'], tone: 'blue' },
              { id: 'in2', typeTag: 'list', value: '[10, 20, 99]', fields: ['bản sao độc lập của b[0]'], tone: 'green' },
            ],
      };
    }

    case 'M05': {
      return {
        kind: 'tape',
        title: bi('Bảng băm CPython Compact Dict · Tra cứu O(1)', 'CPython Compact Dict · O(1) Hash Lookup'),
        subtitle: bi('hash("u42") & mask  ➔  truy cập thẳng ô số 4 trong 1 bước O(1)', 'hash("u42") & mask  ➔  jumps straight to slot #4 in O(1)'),
        cells: ['--', '"id": 1', '--', '--', '"u42": "An"', '"role"'],
        activeIndices: [4],
        pointers: [{ index: 4, label: 'hash("u42") → slot 4', tone: 'green' }],
        outputPill: {
          label: bi('Độ phức tạp d["u42"] / key in set', 'Lookup d["u42"] / key in set'),
          value: bi('O(1) trung bình (không cần duyệt tuần tự)', 'O(1) constant time'),
          tone: 'green',
        },
      };
    }

    case 'M07': {
      const trap = stepIdx === 2;
      return {
        kind: 'refs',
        leftTitle: bi('Các lần gọi hàm', 'Function Invocations'),
        rightTitle: bi('Đối tượng Mặc định & Closure', 'Default & Closure Objects'),
        names: trap
          ? [
              { id: 'c1', name: 'add("A")  # lần 1', targetId: 'shared', style: 'danger' },
              { id: 'c2', name: 'add("B")  # lần 2', note: bi('dùng chung chính list mặc định cũ!', 'mutates shared default list!'), targetId: 'shared', style: 'danger' },
            ]
          : [
              { id: 'c1', name: 'add("A", bag=None)', note: bi('khởi tạo [] mới', 'fresh []'), targetId: 'b1' },
              { id: 'c2', name: 'add("B", bag=None)', note: bi('khởi tạo [] riêng biệt', 'isolated []'), targetId: 'b2' },
            ],
        objects: trap
          ? [
              {
                id: 'shared',
                typeTag: 'fn.__defaults__',
                value: '["A", "B" !]',
                fields: ['Khởi tạo 1 lần duy nhất tại thời điểm đọc def'],
                tone: 'rose',
                badge: bi('⚠ Mutable Default Trap: luôn dùng bag=None', '⚠ Never use mutable [] as default!'),
              },
            ]
          : [
              { id: 'b1', typeTag: 'list', value: '["A"]', fields: ['Local scope lần gọi #1'], tone: 'green' },
              { id: 'b2', typeTag: 'list', value: '["B"]', fields: ['Local scope lần gọi #2'], tone: 'blue' },
            ],
      };
    }

    case 'M08': {
      const cached = stepIdx >= 2;
      return {
        kind: 'tree',
        title: cached
          ? bi('Memoization (@functools.cache): Trúng cache O(1) ➔ Độ phức tạp giảm còn O(n)', 'With @functools.cache: Duplicate subtrees become O(1) hits ➔ O(n) total')
          : bi('Đệ quy thuần fib(5) (chưa có @cache): Tính lặp lại nhánh con theo hàm mũ O(2^n)', 'Naive fib(5): Recomputes identical subtrees exponentially O(2^n)'),
        nodes: [
          { id: 'f5', x: 0, y: -105, label: 'fib(5)', tone: 'blue' },
          { id: 'f4', x: -135, y: -15, label: 'fib(4)', sub: bi('tính 1 lần', 'computed once'), tone: 'green' },
          { id: 'f3r', x: 135, y: -15, label: 'fib(3)', sub: cached ? bi('⚡ Cache Hit O(1)', '⚡ @cache hit!') : bi('tính lặp lại!', 'recomputed!'), tone: cached ? 'purple' : 'rose', pruned: cached },
          { id: 'f3l', x: -215, y: 85, label: 'fib(3)', sub: bi('lưu vào @cache', 'saved in @cache'), tone: 'green' },
          { id: 'f2l', x: -55, y: 85, label: 'fib(2)', sub: cached ? bi('⚡ Cache Hit O(1)', '⚡ @cache hit') : bi('tính lặp lại!', 'duplicate!'), tone: cached ? 'purple' : 'rose', pruned: cached },
        ],
        edges: [
          { from: 'f5', to: 'f4', label: 'n-1' },
          { from: 'f5', to: 'f3r', label: cached ? 'Cache Hit' : 'n-2', style: cached ? 'dashed' : 'danger' },
          { from: 'f4', to: 'f3l' },
          { from: 'f4', to: 'f2l', style: cached ? 'dashed' : 'danger' },
        ],
      };
    }

    case 'M13': {
      const trap = stepIdx === 2;
      return {
        kind: 'refs',
        leftTitle: bi('Đối tượng Instance (self)', 'Instances (self)'),
        rightTitle: bi('Không gian thuộc tính (__dict__)', 'Attribute Memory'),
        names: [
          { id: 'u1', name: 'u1 = User("An")', note: bi('u1.greet() ⇔ User.greet(u1)', 'self = u1'), targetId: trap ? 'shared' : 'd1', style: trap ? 'danger' : 'solid' },
          { id: 'u2', name: 'u2 = User("Bình")', note: bi('self = u2', 'self = u2'), targetId: trap ? 'shared' : 'd2', style: trap ? 'danger' : 'solid' },
        ],
        objects: trap
          ? [
              { id: 'shared', typeTag: 'User.tags (Class)', value: '["vip", ...]', fields: ['Thuộc tính Mutable cấp Class bị dùng chung!'], tone: 'rose' },
            ]
          : [
              { id: 'd1', typeTag: 'u1.__dict__', value: '{"name": "An"}', fields: ['self.tags = [] độc lập'], tone: 'green' },
              { id: 'd2', typeTag: 'u2.__dict__', value: '{"name": "Bình"}', fields: ['self.tags = [] độc lập'], tone: 'blue' },
            ],
      };
    }

    case 'M18': {
      return {
        kind: 'tape',
        title: bi('Binary Search (bisect) · Chia đôi không gian tìm kiếm O(log n)', 'Binary Search (bisect) · Halves sorted array each step O(log n)'),
        subtitle: bi('Tìm target = 60: so sánh mid = 48 < 60 ➔ loại bỏ toàn bộ nửa bên trái', 'Target = 60: mid = 48 < 60 ➔ discard entire left half'),
        cells: ['12', '25', '37', '48', '60', '74', '89'],
        activeIndices: [4, 5, 6],
        pointers: [
          { index: 3, label: 'mid=3 (48)', tone: 'orange' },
          { index: 4, label: 'target=60 ✔', tone: 'green' },
        ],
        outputPill: {
          label: bi('Với N = 1.000.000 phần tử', '1,000,000 items'),
          value: bi('Tối đa 20 phép so sánh (thay vì 1.000.000 bước)', 'At most 20 checks vs 1,000,000'),
          tone: 'green',
        },
      };
    }

    case 'M19': {
      return {
        kind: 'tape',
        title: bi('Hàng đợi FIFO: collections.deque · O(1) ở cả hai đầu', 'FIFO Queue: collections.deque · O(1) at both ends'),
        subtitle: bi('popleft() lấy phần tử đầu trong O(1) — không phải dịch chuyển toàn bộ mảng O(n) như list.pop(0)', 'popleft() unlinks head in O(1) — zero O(n) shifting unlike list.pop(0)'),
        cells: ['job_1', 'job_2', 'job_3', 'job_4', 'job_5'],
        activeIndices: [0, 4],
        pointers: [
          { index: 0, label: 'popleft() O(1)', tone: 'green' },
          { index: 4, label: 'append() O(1)', tone: 'blue' },
        ],
        outputPill: {
          label: bi('Cấu trúc chuẩn cho Queue & BFS', 'Standard Queue & BFS'),
          value: bi('from collections import deque', 'from collections import deque'),
          tone: 'green',
        },
      };
    }

    case 'M20': {
      return {
        kind: 'tape',
        title: bi('Bảng Quy hoạch động Bottom-Up: dp[0..6] (Đổi xu 1, 3, 4)', 'Bottom-Up DP Table: dp[0..6] (Coins 1, 3, 4)'),
        subtitle: bi('dp[x] = min(dp[x - coin] + 1) · Tính từ trái sang phải, không lo tràn Stack', 'dp[x] = min(dp[x - c] + 1) · Iterative O(1) stack depth'),
        cells: ['0', '1', '2', '1', '1', '2', '2'],
        activeIndices: [2, 3, 5, 6],
        pointers: [
          { index: 3, label: 'dp[3]=1 (xu 3)', tone: 'blue' },
          { index: 6, label: 'dp[6]=2 (3+3) ✔', tone: 'green' },
        ],
        outputPill: {
          label: bi('Đổi 6 đồng tối ưu', 'Optimal for 6'),
          value: bi('2 đồng xu (3 + 3) · Tham lam 4+1+1 tốn 3 xu!', '2 coins (3 + 3) beats greedy 4+1+1!'),
          tone: 'green',
        },
      };
    }

    default:
      return null;
  }
}

/** Builds clean, concrete runnable Code + Step-by-Step Trace rows for Group-C lessons & code-focused steps */
export function buildCodeTraceScene(
  moduleId: string,
  stepTitleVi: string,
  stepTitleEn: string,
  extractedSnippet: string | undefined,
  markdownBody: string
): CodeTraceScene {
  const defaultSnippets: Record<string, string> = {
    M00: `name = "Pythonista"\nfor i in range(1, 4):\n    print(f"Bước {i}: Xin chào {name}!")\n`,
    M25: `from pathlib import Path\n\nhere = Path.cwd()\nprint("Thư mục hiện tại:", here)\n`,
    M26: `def calc_total(price: int, qty: int = 1) -> int:\n    return price * qty  # trả giá trị thật để tính tiếp!\n\nbill = calc_total(25_000, 3)\nprint(f"Tổng thanh toán: {bill:,} đ")\n`,
    M27: `import math\n\nprint("7 / 2  =", 7 / 2)    # chia thực -> 3.5\nprint("7 // 2 =", 7 // 2)   # chia lấy nguyên -> 3\nprint("7 % 2  =", 7 % 2)    # chia lấy dư -> 1\nprint("isclose:", math.isclose(0.1 + 0.2, 0.3))\n`,
    M28: `raw = "42"\nnum = int(raw) + 8\nitems = []\nprint("Kết quả:", num)\nprint("List rỗng là Falsy:", bool(items))\n`,
    M29: `def grade(score: int) -> str:\n    if score < 0 or score > 100:\n        return "Không hợp lệ"  # Guard clause thoát sớm\n    if score >= 90:\n        return "Xuất sắc (A)"\n    if score >= 70:\n        return "Khá (B)"\n    return "Cần cố gắng"\n\nprint(grade(92), "|", grade(-5))\n`,
    M30: `total = 0\nfor x in range(1, 6):\n    total += x\n    print(f"x={x} -> total={total}")\nprint("Tổng cuối:", total)\n`,
    M03: `names = ["An", "Bình", "Chi"]\nscores = [88, 95, 79]\nfor idx, (name, sc) in enumerate(zip(names, scores), start=1):\n    print(f"#{idx} {name}: {sc}")\n`,
    M06: `nums = [1, 2, 3, 4, 5, 6]\neven_squares = [x * x for x in nums if x % 2 == 0]\ntotal = sum(x * x for x in nums if x % 2 == 0)  # O(1) RAM\nprint("List:", even_squares, "| Tổng:", total)\n`,
    M31: `def parse_age(raw: str) -> int:\n    try:\n        val = int(raw)\n    except ValueError:\n        return -1\n    else:\n        return val if val >= 0 else -1\n\nprint(parse_age("24"), parse_age("hai mươi"))\n`,
    M10: `class InsufficientBalanceError(Exception):\n    pass\n\ndef withdraw(balance: int, amount: int) -> int:\n    if amount > balance:\n        raise InsufficientBalanceError(f"Thiếu {amount - balance}")\n    return balance - amount\n\ntry:\n    print("Còn lại:", withdraw(100, 150))\nexcept InsufficientBalanceError as err:\n    print("Bắt gọn lỗi nghiệp vụ:", err)\n`,
    M14: `from dataclasses import dataclass\n\n@dataclass(frozen=True, slots=True)\nclass Point:\n    x: float\n    y: float\n\np1 = Point(3.0, 4.0)\np2 = Point(3.0, 4.0)\nprint(p1, "| Bằng nhau theo giá trị:", p1 == p2)\n`,
    M17: `def clamp(x: int, lo: int, hi: int) -> int:\n    return max(lo, min(x, hi))\n\nfor val, expected in [(-5, 0), (7, 7), (120, 100)]:\n    got = clamp(val, 0, 100)\n    assert got == expected, f"Sai tại {val}"\nprint("✔ Tất cả 3 test cases biên đều PASS!")\n`,
  };

  const code =
    extractedSnippet ??
    defaultSnippets[moduleId] ??
    `# ${moduleId}\nprint("Sẵn sàng chạy thử Python 3.12!")\n`;

  // Extract bullet takeaways or table comparisons from markdownBody for the right-side trace panel
  const lines = markdownBody.split('\n');
  const rows: CodeTraceScene['rows'] = [];

  // 1) Try markdown table rows first (great for JS <-> Python maps & operator tables!)
  let inTable = false;
  for (let i = 0; i < lines.length && rows.length < 5; i++) {
    const l = lines[i].trim();
    if (l.startsWith('|') && /^\|\s*[-:]+/.test(lines[i + 1]?.trim() ?? '')) {
      inTable = true;
      i += 1;
      continue;
    }
    if (inTable && l.startsWith('|')) {
      const cells = l
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.replace(/`/g, '').trim());
      if (cells.length >= 2 && cells[0] && cells[1]) {
        rows.push({
          step: `#${rows.length + 1}`,
          expr: cells[1],
          result: cells[0].slice(0, 26),
          tone: 'ok',
        });
      }
    } else if (inTable) {
      inTable = false;
    }
  }

  // 2) Otherwise extract code-comment pairs (`expr  # -> result`) from code snippet
  if (rows.length === 0) {
    const codeLines = code.split('\n');
    for (const cl of codeLines) {
      if (rows.length >= 5) break;
      const trimmed = cl.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = trimmed.split('#');
      if (parts.length >= 2) {
        const lhs = parts[0].trim();
        const comment = parts.slice(1).join('#').trim();
        rows.push({
          step: lhs,
          expr: comment,
          result: bi('Giải thích', 'Note'),
          tone: 'ok',
        });
      }
    }
  }

  // 3) Fallback: clean bullet points from prose
  if (rows.length === 0) {
    for (const l of lines) {
      if (rows.length >= 4) break;
      const m = l.match(/^\s*[-*]\s+(.*)$/);
      if (m) {
        const clean = m[1].replace(/\*\*|`|==/g, '').trim();
        rows.push({
          step: `Key #${rows.length + 1}`,
          expr: clean.slice(0, 95),
          result: bi('Ghi nhớ', 'Takeaway'),
          tone: 'default',
        });
      }
    }
  }

  if (rows.length === 0) {
    rows.push(
      {
        step: 'Step 1',
        expr: bi('Đọc đoạn code bên trái & dự đoán kết quả in ra', 'Read the snippet on the left & predict its output'),
        result: bi('Dự đoán trước', 'Predict first'),
        tone: 'warn',
      },
      {
        step: 'Step 2',
        expr: bi('Bấm "Chạy thử" (Pyodide) và thử sửa tham số biên', 'Click "Run Live" and tweak edge-case inputs'),
        result: bi('Kiểm chứng ngay', 'Verify live'),
        tone: 'ok',
      }
    );
  }

  return {
    badge: {
      vi: `${moduleId} · main.py`,
      en: `${moduleId} · main.py`,
    },
    code,
    traceTitle: {
      vi: `Bảng phân tích nhanh · ${stepTitleVi}`,
      en: `Step Walkthrough · ${stepTitleEn}`,
    },
    rows,
  };
}

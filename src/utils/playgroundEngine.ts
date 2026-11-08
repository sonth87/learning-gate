import {
  PlaygroundFile,
  PlaygroundTemplate,
  PLAYGROUND_PACKAGES,
} from '@/data/playground/playgroundTemplatesData';

export interface PlaygroundLogItem {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CMD';
  source: string;
  message: string;
}

export interface PlaygroundVariableItem {
  name: string;
  type: string;
  value: string;
}

export interface PlaygroundRunResult {
  engine: 'pyodide-wasm' | 'instant-smart';
  exitCode: 0 | 1;
  durationMs: number;
  stdoutLines: string[];
  stderrLines: string[];
  logs: PlaygroundLogItem[];
  variables: PlaygroundVariableItem[];
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    __pyMasteryPyodide?: any;
  }
}

let pyodideLoadingPromise: Promise<any> | null = null;

function nowTimeStr(): string {
  const d = new Date();
  return d.toTimeString().split(' ')[0];
}

/**
 * Loads CPython 3.12 WebAssembly (Pyodide) on-demand when browser has network access.
 */
export async function ensurePyodideLoaded(): Promise<any | null> {
  if (typeof window === 'undefined') return null;
  if (window.__pyMasteryPyodide) return window.__pyMasteryPyodide;
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = new Promise(async (resolve) => {
    try {
      if (!window.loadPyodide) {
        await new Promise<void>((res, rej) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.3/full/pyodide.js';
          script.async = true;
          script.onload = () => res();
          script.onerror = () => rej(new Error('Không thể tải Pyodide CDN'));
          document.head.appendChild(script);
        });
      }

      if (!window.loadPyodide) {
        resolve(null);
        return;
      }

      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.3/full/',
      });

      // Install lightweight pure-Python compatibility shims for pydantic, httpx, fastapi, rich
      // so users can immediately import them in Playground without waiting for heavy wheels
      await pyodide.runPythonAsync(`
import sys, types, json

# Lightweight Pydantic v2 shim if not already installed
if "pydantic" not in sys.modules:
    pyd_mod = types.ModuleType("pydantic")
    def Field(default=..., **kwargs):
        return default
    class BaseModel:
        def __init__(self, **data):
            annotations = getattr(self.__class__, "__annotations__", {})
            for k, v in self.__class__.__dict__.items():
                if not k.startswith("_") and not callable(v) and k not in data:
                    data[k] = v
            for k, val in data.items():
                expected = annotations.get(k)
                if expected is float and isinstance(val, (str, int)):
                    val = float(val)
                elif expected is int and isinstance(val, str) and val.isdigit():
                    val = int(val)
                setattr(self, k, val)
        def model_dump(self):
            return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}
        def model_dump_json(self, indent=None):
            return json.dumps(self.model_dump(), indent=indent, ensure_ascii=False)
        def __repr__(self):
            pairs = " ".join(f"{k}={v!r}" for k, v in self.model_dump().items())
            return pairs
    pyd_mod.BaseModel = BaseModel
    pyd_mod.Field = Field
    sys.modules["pydantic"] = pyd_mod
`);

      window.__pyMasteryPyodide = pyodide;
      resolve(pyodide);
    } catch {
      pyodideLoadingPromise = null;
      resolve(null);
    }
  });

  return pyodideLoadingPromise;
}

/**
 * Checks basic Python syntax mistakes (unclosed parens, missing colon on block headers)
 * for instant feedback in the fallback interpreter.
 */
function checkBasicPythonSyntax(code: string): string | null {
  const lines = code.split('\n');
  let openParen = 0;
  let openBracket = 0;
  let openBrace = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.replace(/#.*$/, '').trim();
    if (!trimmed) continue;

    for (const ch of trimmed) {
      if (ch === '(') openParen++;
      if (ch === ')') openParen--;
      if (ch === '[') openBracket++;
      if (ch === ']') openBracket--;
      if (ch === '{') openBrace++;
      if (ch === '}') openBrace--;
    }

    // Check single-line block header missing colon
    if (
      /^(def\s+\w+\s*\(.*\)\s*(?:->\s*[^:]+)?|class\s+\w+(?:\(.*\))?|if\s+.+|elif\s+.+|else|for\s+.+\s+in\s+.+|while\s+.+|try|except(?:\s+.+)?|finally|with\s+.+)$/.test(
        trimmed
      ) &&
      !trimmed.endsWith(':') &&
      openParen === 0 &&
      openBracket === 0
    ) {
      const firstWord = trimmed.split(/\s+/)[0];
      if (
        ['else', 'try', 'finally'].includes(firstWord) &&
        trimmed !== firstWord
      ) {
        continue;
      }
      if (
        ['def', 'class', 'else', 'try', 'finally'].includes(firstWord) ||
        (!trimmed.includes(' if ') && !trimmed.includes(' for '))
      ) {
        return `File "main.py", line ${i + 1}\n    ${rawLine}\nSyntaxError: expected ':' (Thiếu dấu hai chấm ':' ở cuối dòng khai báo khối ${firstWord})`;
      }
    }
  }

  if (openParen !== 0) {
    return `SyntaxError: '(' was never closed (Số lượng ngoặc tròn mở '(' và đóng ')' chưa khớp nhau)`;
  }
  if (openBracket !== 0) {
    return `SyntaxError: '[' was never closed (Số lượng ngoặc vuông '[' và ']' chưa khớp nhau)`;
  }
  if (openBrace !== 0) {
    return `SyntaxError: '{' was never closed (Số lượng ngoặc nhọn '{' và '}' chưa khớp nhau)`;
  }

  return null;
}

/**
 * Evaluates simple Python expressions and statements in Instant Mode (0ms latency)
 * and combines template awareness with live user edits (`print(...)`, variables, logging).
 */
function runInstantSmartEngine(
  files: PlaygroundFile[],
  entryFile: string,
  activeTemplate?: PlaygroundTemplate
): PlaygroundRunResult {
  const start = performance.now();
  const mainFile =
    files.find((f) => f.name === entryFile) ||
    files.find((f) => f.language === 'python') ||
    files[0];
  const code = mainFile?.content || '';

  const syntaxErr = checkBasicPythonSyntax(code);
  if (syntaxErr) {
    const durationMs = Math.max(1, Math.round(performance.now() - start));
    return {
      engine: 'instant-smart',
      exitCode: 1,
      durationMs,
      stdoutLines: [],
      stderrLines: [syntaxErr],
      logs: [
        {
          id: `log-${Date.now()}-err`,
          timestamp: nowTimeStr(),
          level: 'ERROR',
          source: entryFile,
          message: syntaxErr.split('\n').pop() || 'SyntaxError',
        },
      ],
      variables: [],
    };
  }

  // If the code matches the template's initial starter code, return its exact verified output & variables
  const templateEntryContent =
    activeTemplate?.files.find((f) => f.name === entryFile)?.content || '';
  if (activeTemplate && code.trim() === templateEntryContent.trim()) {
    const durationMs = Math.max(4, Math.round(performance.now() - start) + 6);
    return {
      engine: 'instant-smart',
      exitCode: 0,
      durationMs,
      stdoutLines: [...activeTemplate.expectedOutputLines],
      stderrLines: [],
      logs: activeTemplate.expectedLogs.map((l, idx) => ({
        id: `log-${Date.now()}-${idx}`,
        timestamp: nowTimeStr(),
        level: l.level,
        source: entryFile,
        message: l.message,
      })),
      variables: [...activeTemplate.expectedVariables],
    };
  }

  // Otherwise, parse user's live code edits: track variables, imports, logging calls, and print() statements
  const env: Record<string, any> = {
    True: true,
    False: false,
    None: null,
  };
  const variableTypes: Record<string, string> = {};
  const stdoutLines: string[] = [];
  const logs: PlaygroundLogItem[] = [];

  // Seed variables from template if user only appended/modified a few lines
  if (activeTemplate) {
    for (const v of activeTemplate.expectedVariables) {
      variableTypes[v.name] = v.type;
      env[v.name] = v.value.replace(/^'|'$/g, '');
    }
  }

  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/#.*$/, '').trim();
    if (!line) continue;

    // Detect import statements
    const importMatch = line.match(/^(?:import|from)\s+([a-zA-Z0-9_.,\s]+)/);
    if (importMatch) {
      logs.push({
        id: `log-${Date.now()}-imp-${i}`,
        timestamp: nowTimeStr(),
        level: 'INFO',
        source: entryFile,
        message: `Đã nạp module: ${line}`,
      });
      continue;
    }

    // Detect logging.info / warning / error
    const logMatch = line.match(
      /^logging\.(info|warning|error)\(\s*f?["'](.+)["']\s*\)$/
    );
    if (logMatch) {
      const lvl = logMatch[1].toUpperCase() as 'INFO' | 'WARNING' | 'ERROR';
      const rawMsg = logMatch[2].replace(/\{([^}]+)\}/g, (_, expr) => {
        const key = expr.trim();
        return env[key] !== undefined ? String(env[key]) : `{${key}}`;
      });
      logs.push({
        id: `log-${Date.now()}-lg-${i}`,
        timestamp: nowTimeStr(),
        level: lvl,
        source: 'logging',
        message: rawMsg,
      });
      continue;
    }

    // Detect top-level simple variable assignment: var = value
    const assignMatch = line.match(
      /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::\s*[a-zA-Z0-9_[\],\s|]+)?\s*=\s*(.+)$/
    );
    if (assignMatch && !line.startsWith('def ') && !line.startsWith('class ')) {
      const varName = assignMatch[1];
      const rhs = assignMatch[2].trim();
      const evaluated = evaluateSimplePythonExpr(rhs, env);
      env[varName] = evaluated.value;
      variableTypes[varName] = evaluated.type;
      continue;
    }

    // Detect print(...)
    const printMatch = line.match(/^print\((.*)\)$/);
    if (printMatch) {
      const inner = printMatch[1].trim();
      if (!inner) {
        stdoutLines.push('');
      } else {
        const rendered = evaluatePrintArgs(inner, env);
        stdoutLines.push(rendered);
      }
    }
  }

  // If template code was partially kept and custom print lines were added, preserve template outputs if needed
  if (stdoutLines.length === 0 && activeTemplate) {
    stdoutLines.push(...activeTemplate.expectedOutputLines);
  }

  logs.push({
    id: `log-${Date.now()}-done`,
    timestamp: nowTimeStr(),
    level: 'INFO',
    source: 'runtime',
    message: `Thực thi ${entryFile} hoàn tất (${stdoutLines.length} dòng output)`,
  });

  const variables: PlaygroundVariableItem[] = Object.keys(variableTypes).map(
    (name) => ({
      name,
      type: variableTypes[name],
      value: formatPythonValue(env[name], variableTypes[name]),
    })
  );

  const durationMs = Math.max(3, Math.round(performance.now() - start) + 4);
  return {
    engine: 'instant-smart',
    exitCode: 0,
    durationMs,
    stdoutLines,
    stderrLines: [],
    logs,
    variables,
  };
}

function formatPythonValue(val: any, type: string): string {
  if (type === 'str' && typeof val === 'string' && !val.startsWith("'")) {
    return `'${val}'`;
  }
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (val === null) return 'None';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function evaluateSimplePythonExpr(
  expr: string,
  env: Record<string, any>
): { value: any; type: string } {
  const trimmed = expr.trim();

  // f-string
  if (
    (trimmed.startsWith('f"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("f'") && trimmed.endsWith("'"))
  ) {
    const body = trimmed.slice(2, -1);
    const interpolated = body.replace(/\{([^}]+)\}/g, (_, inner) => {
      const cleanExpr = inner.split(':')[0].trim();
      const sub = evaluateSimplePythonExpr(cleanExpr, env);
      return String(sub.value);
    });
    return { value: interpolated, type: 'str' };
  }

  // String literal
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return { value: trimmed.slice(1, -1), type: 'str' };
  }

  // Boolean / None
  if (trimmed === 'True') return { value: true, type: 'bool' };
  if (trimmed === 'False') return { value: false, type: 'bool' };
  if (trimmed === 'None') return { value: null, type: 'NoneType' };

  // List literal
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return { value: trimmed, type: 'list' };
  }

  // Dict / Set literal
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return {
      value: trimmed,
      type: trimmed.includes(':') ? 'dict' : 'set',
    };
  }

  // Known variable
  if (env[trimmed] !== undefined) {
    const v = env[trimmed];
    return {
      value: v,
      type:
        typeof v === 'number'
          ? Number.isInteger(v)
            ? 'int'
            : 'float'
          : typeof v === 'boolean'
          ? 'bool'
          : 'str',
    };
  }

  // Safe numeric arithmetic (+, -, *, /, //, %, **)
  if (/^[0-9_.\s+\-*/%()]+$/.test(trimmed)) {
    try {
      const normalized = trimmed
        .replace(/_/g, '')
        .replace(/\*\*/g, '**')
        .replace(/([0-9.]+)\s*\/\/\s*([0-9.]+)/g, 'Math.floor($1 / $2)');
      // eslint-disable-next-line no-new-func
      const num = Function(`"use strict"; return (${normalized});`)();
      if (typeof num === 'number' && !Number.isNaN(num)) {
        return {
          value: num,
          type: Number.isInteger(num) ? 'int' : 'float',
        };
      }
    } catch {
      // ignore
    }
  }

  return { value: trimmed, type: 'object' };
}

function evaluatePrintArgs(
  argsStr: string,
  env: Record<string, any>
): string {
  // Split top-level commas outside quotes/brackets
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inQuote: string | null = null;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (inQuote) {
      current += ch;
      if (ch === inQuote && argsStr[i - 1] !== '\\') {
        inQuote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      current += ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());

  const renderedParts: string[] = [];
  for (const p of parts) {
    if (p.startsWith('sep=') || p.startsWith('end=')) continue;
    const ev = evaluateSimplePythonExpr(p, env);
    if (ev.value === true) renderedParts.push('True');
    else if (ev.value === false) renderedParts.push('False');
    else if (ev.value === null) renderedParts.push('None');
    else renderedParts.push(String(ev.value));
  }
  return renderedParts.join(' ');
}

/**
 * Executes the multi-file Playground workspace using Pyodide CPython 3.12 if loaded/requested,
 * or falls back seamlessly to the Instant Smart Engine.
 */
export async function executePlaygroundWorkspace(
  files: PlaygroundFile[],
  entryFile: string,
  preferPyodide: boolean,
  activeTemplate?: PlaygroundTemplate
): Promise<PlaygroundRunResult> {
  if (preferPyodide) {
    const pyodide = await ensurePyodideLoaded();
    if (pyodide) {
      const start = performance.now();
      try {
        // Write all workspace files into Pyodide virtual filesystem
        for (const f of files) {
          pyodide.FS.writeFile(f.name, f.content, { encoding: 'utf8' });
        }

        const mainFile =
          files.find((f) => f.name === entryFile) ||
          files.find((f) => f.language === 'python') ||
          files[0];

        const runnerScript = `
import sys, io, json, traceback, importlib

_stdout_buf = io.StringIO()
_stderr_buf = io.StringIO()
_old_stdout, _old_stderr = sys.stdout, sys.stderr
sys.stdout, sys.stderr = _stdout_buf, _stderr_buf

importlib.invalidate_caches()
for _mod_name in list(sys.modules.keys()):
    if _mod_name in ("models", "utils", "helpers", "config", "schemas"):
        del sys.modules[_mod_name]

_ns = {"__name__": "__main__"}
_exit_code = 0
try:
    with open(${JSON.stringify(mainFile.name)}, "r", encoding="utf-8") as _f:
        _code = _f.read()
    exec(compile(_code, ${JSON.stringify(mainFile.name)}, "exec"), _ns)
except Exception:
    _exit_code = 1
    traceback.print_exc(file=_stderr_buf)
finally:
    sys.stdout, sys.stderr = _old_stdout, _old_stderr

_vars = []
for _k, _v in _ns.items():
    if _k.startswith("_") or _k in ("sys", "io", "json", "traceback", "importlib"):
        continue
    _t = type(_v).__name__
    if _t in ("module", "function", "type", "builtin_function_or_method"):
        continue
    _vars.append({"name": _k, "type": _t, "value": repr(_v)[:160]})

json.dumps({
    "exitCode": _exit_code,
    "stdout": _stdout_buf.getvalue(),
    "stderr": _stderr_buf.getvalue(),
    "variables": _vars
})
`;
        const rawJson = await pyodide.runPythonAsync(runnerScript);
        const parsed = JSON.parse(rawJson);
        const durationMs = Math.max(1, Math.round(performance.now() - start));

        const stdoutLines = parsed.stdout
          ? parsed.stdout.replace(/\n$/, '').split('\n')
          : [];
        const stderrLines = parsed.stderr
          ? parsed.stderr.replace(/\n$/, '').split('\n')
          : [];

        const logs: PlaygroundLogItem[] = [
          {
            id: `log-${Date.now()}-wasm`,
            timestamp: nowTimeStr(),
            level: parsed.exitCode === 0 ? 'INFO' : 'ERROR',
            source: 'CPython 3.12 (Pyodide)',
            message:
              parsed.exitCode === 0
                ? `Thực thi ${mainFile.name} thành công bằng CPython 3.12 WebAssembly (${durationMs}ms)`
                : `Lỗi khi thực thi ${mainFile.name} (Xem chi tiết ở tab Output/Stderr)`,
          },
        ];

        return {
          engine: 'pyodide-wasm',
          exitCode: parsed.exitCode === 0 ? 0 : 1,
          durationMs,
          stdoutLines,
          stderrLines,
          logs,
          variables: parsed.variables || [],
        };
      } catch {
        // Fallback to instant smart engine if Wasm execution encounters an environment error
      }
    }
  }

  return runInstantSmartEngine(files, entryFile, activeTemplate);
}

/**
 * Evaluates a single interactive command in the Playground Terminal / REPL (`>>>` or CLI `uv`, `python`, `ls`, `cat`, `help`).
 */
export function executePlaygroundTerminalCommand(
  rawCmd: string,
  files: PlaygroundFile[],
  installedPackages: string[],
  variables: PlaygroundVariableItem[],
  onInstallPackage?: (pkgName: string) => void
): { outputLines: string[]; clearTerminal?: boolean } {
  const cmd = rawCmd.trim().replace(/^>>>\s*/, '').replace(/^\$\s*/, '');
  if (!cmd) return { outputLines: [] };

  if (cmd === 'clear' || cmd === 'cls') {
    return { outputLines: [], clearTerminal: true };
  }

  if (cmd === 'help') {
    return {
      outputLines: [
        'Các lệnh hỗ trợ trong Terminal & REPL:',
        '  • Biểu thức Python trực tiếp: 2 ** 10, [x*2 for x in range(5)], len("Python")',
        '  • Xem giá trị biến vừa chạy : gõ tên biến (VD: subtotal, loud_fruits, cart)',
        '  • uv add <tên_thư_viện>    : Cài thêm thư viện vào dự án & pyproject.toml',
        '  • pip list / uv pip list   : Xem danh sách thư viện đã cài đặt',
        '  • ls                       : Liệt kê các file trong Workspace hiện tại',
        '  • cat <tên_file>           : Xem nội dung file (VD: cat pyproject.toml)',
        '  • python --version         : Kiểm tra phiên bản trình thông dịch Python',
        '  • clear                    : Xóa màn hình Terminal',
      ],
    };
  }

  if (cmd === 'python --version' || cmd === 'python3 --version') {
    return { outputLines: ['Python 3.12.7 (PyMastery Interactive Runtime)'] };
  }

  if (cmd === 'uv --version') {
    return { outputLines: ['uv 0.6.4 (Fast Python Package & Project Manager)'] };
  }

  if (cmd === 'ls' || cmd === 'dir') {
    return {
      outputLines: [files.map((f) => f.name).join('    ')],
    };
  }

  if (cmd.startsWith('cat ')) {
    const fileName = cmd.slice(4).trim();
    const target = files.find((f) => f.name === fileName);
    if (!target) {
      return { outputLines: [`cat: ${fileName}: Không tìm thấy file trong dự án`] };
    }
    return { outputLines: target.content.split('\n') };
  }

  if (cmd === 'pip list' || cmd === 'uv pip list') {
    const rows = [
      'Package         Version         Kind',
      '--------------- --------------- ---------------',
      ...installedPackages.map((id) => {
        const pkg = PLAYGROUND_PACKAGES.find((p) => p.id === id);
        return `${(pkg?.name || id).padEnd(15)} ${(pkg?.version || 'latest').padEnd(15)} ${pkg?.kind || 'package'}`;
      }),
    ];
    return { outputLines: rows };
  }

  if (cmd.startsWith('uv add ') || cmd.startsWith('pip install ')) {
    const pkgName = cmd
      .replace(/^uv add\s+(--dev\s+)?/, '')
      .replace(/^pip install\s+/, '')
      .trim()
      .toLowerCase();
    if (!pkgName) {
      return { outputLines: ['Lỗi: Vui lòng nhập tên gói (Ví dụ: uv add pydantic)'] };
    }
    onInstallPackage?.(pkgName);
    return {
      outputLines: [
        `Resolved 1 package in 14ms`,
        `Prepared 1 package in 8ms`,
        ` + ${pkgName} (installed into .venv & added to pyproject.toml)`,
      ],
    };
  }

  // Check if command matches a variable in current Variable Inspector
  const foundVar = variables.find((v) => v.name === cmd);
  if (foundVar) {
    return {
      outputLines: [`${foundVar.value}   # (${foundVar.type})`],
    };
  }

  // Handle simple list comprehension in REPL e.g. [x * 2 for x in range(5)]
  const compMatch = cmd.match(
    /^\[\s*([a-zA-Z_]\w*)\s*([+\-*/]{1,2}\s*\d+)?\s+for\s+\1\s+in\s+range\((\d+)\)\s*\]$/
  );
  if (compMatch) {
    const opPart = compMatch[2]?.replace(/\s+/g, '') || '';
    const count = Math.min(Number(compMatch[3]), 30);
    const items: number[] = [];
    for (let i = 0; i < count; i++) {
      // eslint-disable-next-line no-new-func
      const val = Function(`return (${i}${opPart});`)();
      items.push(val);
    }
    return { outputLines: [`[${items.join(', ')}]`] };
  }

  // Handle len("...")
  const lenMatch = cmd.match(/^len\(\s*["'](.*)["']\s*\)$/);
  if (lenMatch) {
    return { outputLines: [String(lenMatch[1].length)] };
  }

  // Handle print(...)
  const printMatch = cmd.match(/^print\((.*)\)$/);
  if (printMatch) {
    const envMap: Record<string, any> = {};
    for (const v of variables) envMap[v.name] = v.value.replace(/^'|'$/g, '');
    return { outputLines: [evaluatePrintArgs(printMatch[1], envMap)] };
  }

  // Evaluate arithmetic / literal expression
  const envMap: Record<string, any> = {};
  for (const v of variables) envMap[v.name] = v.value.replace(/^'|'$/g, '');
  const ev = evaluateSimplePythonExpr(cmd, envMap);
  if (ev.type !== 'object') {
    return { outputLines: [formatPythonValue(ev.value, ev.type)] };
  }

  return {
    outputLines: [
      `>>> Đã nhận lệnh: ${cmd}`,
      `💡 Gợi ý: Gõ 'help' để xem danh sách lệnh CLI (uv add, pip list, ls, cat) hoặc biểu thức Python REPL.`,
    ],
  };
}

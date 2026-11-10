/* eslint-disable */
/*
 * Python worker — chạy CPython (Pyodide, WebAssembly) NGOÀI luồng giao diện.
 * Vì sao dùng worker: nếu code của người học lặp vô hạn, luồng chính chỉ cần worker.terminate()
 * là xong, giao diện không bị đơ. (Pyodide chạy trên luồng chính thì không dừng được.)
 *
 * Giao thức (postMessage):
 *   → {id, cmd:'init', base}                       nạp Pyodide + bộ chấm test (public/py/runner.py)
 *   → {id, cmd:'run',   code, stdin}               chạy như `python main.py`
 *   → {id, cmd:'grade', solution, tests}           chạy test kiểu pytest (cùng runner.py với bản trên máy)
 *   ← {id, ok:true, result} | {id, ok:false, error}
 *   ← {type:'status', text}                        tiến trình nạp (hiển thị cho người học)
 */
const PYODIDE_VERSION = '0.27.3';
const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v' + PYODIDE_VERSION + '/full/';

let pyodide = null;
let initPromise = null;
let hashlibReady = false;

const HELPERS = `
import contextlib, io, json, os, shutil, sys, tempfile, time, traceback
sys.path.insert(0, '/pl')
import runner as _runner


def pl_run(code, stdin_text):
    out, err = io.StringIO(), io.StringIO()
    ns = {'__name__': '__main__', '__file__': 'main.py'}
    old_stdin = sys.stdin
    sys.stdin = io.StringIO(stdin_text)
    rc = 0
    t0 = time.perf_counter()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        try:
            exec(compile(code, 'main.py', 'exec'), ns)
        except SystemExit as e:
            if e.code is None:
                rc = 0
            elif isinstance(e.code, int):
                rc = e.code
            else:
                print(e.code, file=sys.stderr)
                rc = 1
        except BaseException as e:
            rc = 1
            tb = e.__traceback__.tb_next if e.__traceback__ else None   # bỏ khung của chính hàm pl_run
            traceback.print_exception(type(e), e, tb)
    sys.stdin = old_stdin
    return json.dumps({'stdout': out.getvalue(), 'stderr': err.getvalue(), 'exitCode': rc,
                       'ms': round((time.perf_counter() - t0) * 1000)})


def pl_grade(solution, tests):
    d = tempfile.mkdtemp(prefix='pl_')
    try:
        with open(os.path.join(d, 'solution.py'), 'w', encoding='utf-8') as f:
            f.write(solution)
        with open(os.path.join(d, 'test_solution.py'), 'w', encoding='utf-8') as f:
            f.write(tests)
        return json.dumps(_runner.run(d, os.path.join(d, 'test_solution.py')))
    finally:
        shutil.rmtree(d, ignore_errors=True)
`;

function status(text) {
  self.postMessage({ type: 'status', text });
}

async function init(base) {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    status('Đang tải Python (lần đầu khoảng 10 MB, những lần sau dùng bộ nhớ đệm)…');
    importScripts(PYODIDE_BASE + 'pyodide.js');
    pyodide = await loadPyodide({ indexURL: PYODIDE_BASE });
    status('Đang nạp bộ chấm bài…');
    const runner = await (await fetch(base + 'py/runner.py')).text();
    pyodide.FS.mkdirTree('/pl');
    pyodide.FS.writeFile('/pl/runner.py', runner);
    pyodide.runPython(HELPERS);
    status('Python đã sẵn sàng');
  })();
  return initPromise;
}

/** Tải gói Pyodide theo import (sqlite3, ...). hashlib cần nạp riêng vì là module chuẩn đã có sẵn bản rút gọn. */
async function ensurePackages(src) {
  await pyodide.loadPackagesFromImports(src);
  if (!hashlibReady && /\bhashlib\b/.test(src)) {
    await pyodide.loadPackage('hashlib');
    pyodide.runPython('import importlib, hashlib; importlib.reload(hashlib)');
    hashlibReady = true;
  }
}

self.onmessage = async (ev) => {
  const { id, cmd } = ev.data;
  try {
    if (cmd === 'init') {
      await init(ev.data.base || '/');
      self.postMessage({ id, ok: true, result: null });
      return;
    }
    await init(ev.data.base || '/');
    let result;
    if (cmd === 'run') {
      await ensurePackages(ev.data.code);
      result = JSON.parse(pyodide.globals.get('pl_run')(ev.data.code, ev.data.stdin || ''));
    } else if (cmd === 'grade') {
      await ensurePackages(ev.data.solution + '\n' + ev.data.tests);
      result = JSON.parse(pyodide.globals.get('pl_grade')(ev.data.solution, ev.data.tests));
    } else {
      throw new Error('Lệnh không hợp lệ: ' + cmd);
    }
    self.postMessage({ id, ok: true, result });
  } catch (e) {
    self.postMessage({ id, ok: false, error: String((e && e.message) || e) });
  }
};

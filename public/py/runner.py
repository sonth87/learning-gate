"""Chạy test của 1 bài tập. Dùng ở 2 nơi:

1. CLI / web server của WorkPath: chạy như một tiến trình riêng (để code lỗi/treo không làm sập CLI)
       python runner.py <thư_mục_bài_làm> <file_test>      → in 1 dòng JSON có tiền tố MARK
2. App React (trình duyệt): file này được nạp vào Pyodide và gọi  run(work_dir, test_file)  → dict.

Test viết theo kiểu pytest: hàm test_xxx() dùng `assert`. Hỗ trợ 2 "fixture":
  - tmp_path : thư mục tạm (pathlib.Path)
  - capsys   : capsys.readouterr().out -> chuỗi đã print ra
=> nên các file test cũng chạy được bằng `pytest` nếu bạn muốn.

Chỉ dùng thư viện chuẩn và KHÔNG phụ thuộc gói pylearn (để nhúng được vào Pyodide).
"""

import ast
import contextlib
import importlib.util
import inspect
import io
import json
import sys
import tempfile
import time
import traceback
from pathlib import Path

MARK = "@@PYLEARN_RESULT@@"


class _Capsys:
    class _Result:
        def __init__(self, out: str):
            self.out, self.err = out, ""

    def __init__(self, buf: io.StringIO):
        self._buf, self._pos = buf, 0

    def readouterr(self):
        text = self._buf.getvalue()
        out, self._pos = text[self._pos:], len(text)
        return self._Result(out)


def _short_exc(e: BaseException, work_dir: str) -> str:
    if isinstance(e, SyntaxError):
        where = f"{Path(e.filename or '?').name}:{e.lineno}"
        line = (e.text or "").rstrip()
        return f"SyntaxError ({where}): {e.msg}\n    {line}"
    if isinstance(e, EOFError):
        return ("EOFError: code của bạn gọi input() nhưng khi chấm bài không có ai nhập.\n"
                "    → Đặt phần input()/chạy thử vào trong:  if __name__ == \"__main__\":")
    where = ""
    for frame, lineno in traceback.walk_tb(e.__traceback__):
        if frame.f_code.co_filename.startswith(work_dir):
            where = f" (tại {Path(frame.f_code.co_filename).name}:{lineno})"
    return f"{type(e).__name__}: {e}{where}"


def _describe_assert(tb, test_file: str) -> dict:
    target = None
    for frame, lineno in traceback.walk_tb(tb):
        if frame.f_code.co_filename == test_file:
            target = (frame, lineno)
    if target is None:
        return {}
    frame, lineno = target
    src = Path(test_file).read_text(encoding="utf-8")
    for node in ast.walk(ast.parse(src)):
        if isinstance(node, ast.Assert) and node.lineno <= lineno <= (node.end_lineno or lineno):
            info = {"line": node.lineno, "code": ast.get_source_segment(src, node) or ""}
            test = node.test
            if isinstance(test, ast.Compare) and len(test.ops) == 1:
                try:
                    env = (frame.f_globals, frame.f_locals)
                    left = eval(compile(ast.Expression(test.left), test_file, "eval"), *env)
                    right = eval(compile(ast.Expression(test.comparators[0]), test_file, "eval"), *env)
                    info["got"] = repr(left)[:400]
                    info["expected"] = repr(right)[:400]
                except Exception:
                    pass
            return info
    return {"line": lineno}


def run(work_dir: str, test_file: str) -> dict:
    """Nạp solution.py trong work_dir rồi chạy mọi hàm test_* trong test_file. Trả về dict kết quả."""
    work_dir = str(work_dir)
    test_file = str(Path(test_file).resolve())
    result: dict = {"import_error": None, "tests": []}

    sys.path.insert(0, work_dir)
    sys.dont_write_bytecode = True
    for name in ("solution", "pylearn_tests"):      # nạp mới hoàn toàn (quan trọng khi chạy trong Pyodide)
        sys.modules.pop(name, None)
    old_stdin = sys.stdin
    sys.stdin = io.StringIO("")                      # input() → EOFError, không bao giờ treo chờ người gõ
    try:
        load_buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(load_buf):
                spec = importlib.util.spec_from_file_location("pylearn_tests", test_file)
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
        except BaseException as e:  # SyntaxError, ImportError, EOFError (input), SystemExit ...
            result["import_error"] = _short_exc(e, work_dir)
            result["stdout"] = load_buf.getvalue()[-1500:]
            return result

        tests = [(n, f) for n, f in vars(mod).items() if n.startswith("test") and callable(f)]
        for name, fn in tests:
            buf = io.StringIO()
            entry = {"name": name, "doc": (fn.__doc__ or "").strip()}
            start = time.perf_counter()
            with tempfile.TemporaryDirectory() as tmp:
                kwargs = {}
                params = inspect.signature(fn).parameters
                if "tmp_path" in params:
                    kwargs["tmp_path"] = Path(tmp)
                if "capsys" in params:
                    kwargs["capsys"] = _Capsys(buf)
                try:
                    with contextlib.redirect_stdout(buf):
                        fn(**kwargs)
                    entry["status"] = "pass"
                except AssertionError as e:
                    entry["status"] = "fail"
                    entry["message"] = str(e)
                    entry.update(_describe_assert(e.__traceback__, test_file))
                except BaseException as e:
                    entry["status"] = "error"
                    entry["message"] = _short_exc(e, work_dir)
            entry["ms"] = round((time.perf_counter() - start) * 1000, 1)
            entry["stdout"] = buf.getvalue()[-800:]
            result["tests"].append(entry)
        return result
    finally:
        sys.stdin = old_stdin
        if work_dir in sys.path:
            sys.path.remove(work_dir)


def main() -> None:
    work_dir, test_file = sys.argv[1], sys.argv[2]
    result = run(work_dir, test_file)
    print(MARK + json.dumps(result))


if __name__ == "__main__":
    main()

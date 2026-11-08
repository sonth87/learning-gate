export type CompletionKind =
  | 'keyword'
  | 'builtin'
  | 'method'
  | 'type'
  | 'dunder'
  | 'variable'
  | 'snippet';

export interface CompletionItem {
  label: string;
  insertText: string;
  kind: CompletionKind;
  detail: string;
}

const STATIC_COMPLETIONS: CompletionItem[] = [
  // Keywords & Control Flow
  { label: 'def', insertText: 'def ', kind: 'keyword', detail: 'Khai báo hàm (function / method)' },
  { label: 'return', insertText: 'return ', kind: 'keyword', detail: 'Trả kết quả về từ hàm' },
  { label: 'yield', insertText: 'yield ', kind: 'keyword', detail: 'Sinh giá trị lười (Generator)' },
  { label: 'async def', insertText: 'async def ', kind: 'snippet', detail: 'Khai báo hàm bất đồng bộ (Coroutine)' },
  { label: 'await', insertText: 'await ', kind: 'keyword', detail: 'Đợi Coroutine / Awaitable hoàn tất' },
  { label: 'class', insertText: 'class ', kind: 'keyword', detail: 'Khai báo lớp (Class)' },
  { label: 'if', insertText: 'if ', kind: 'keyword', detail: 'Rẽ nhánh điều kiện' },
  { label: 'elif', insertText: 'elif ', kind: 'keyword', detail: 'Nhánh điều kiện tiếp theo (thay else if)' },
  { label: 'else', insertText: 'else:', kind: 'keyword', detail: 'Nhánh mặc định khi các điều kiện sai' },
  { label: 'for', insertText: 'for ', kind: 'keyword', detail: 'Vòng lặp qua Iterable' },
  { label: 'while', insertText: 'while ', kind: 'keyword', detail: 'Vòng lặp theo điều kiện' },
  { label: 'break', insertText: 'break', kind: 'keyword', detail: 'Thoát khỏi vòng lặp ngay lập tức' },
  { label: 'continue', insertText: 'continue', kind: 'keyword', detail: 'Bỏ qua bước lặp hiện tại' },
  { label: 'in', insertText: 'in ', kind: 'keyword', detail: 'Kiểm tra phần tử thuộc tập hợp / vòng lặp' },
  { label: 'not in', insertText: 'not in ', kind: 'keyword', detail: 'Kiểm tra không thuộc tập hợp' },
  { label: 'is None', insertText: 'is None', kind: 'snippet', detail: 'Kiểm tra định danh None chuẩn PEP 8' },
  { label: 'is not None', insertText: 'is not None', kind: 'snippet', detail: 'Kiểm tra khác None chuẩn PEP 8' },
  { label: 'and', insertText: 'and ', kind: 'keyword', detail: 'Toán tử logic VÀ (short-circuit)' },
  { label: 'or', insertText: 'or ', kind: 'keyword', detail: 'Toán tử logic HOẶC (short-circuit)' },
  { label: 'not', insertText: 'not ', kind: 'keyword', detail: 'Toán tử phủ định logic' },
  { label: 'lambda', insertText: 'lambda x: ', kind: 'keyword', detail: 'Hàm ẩn danh 1 biểu thức' },
  { label: 'try', insertText: 'try:\n    ', kind: 'keyword', detail: 'Khối bắt ngoại lệ' },
  { label: 'except', insertText: 'except Exception as e:', kind: 'snippet', detail: 'Bắt và xử lý ngoại lệ' },
  { label: 'finally', insertText: 'finally:', kind: 'keyword', detail: 'Khối luôn chạy dù có lỗi hay không' },
  { label: 'raise', insertText: 'raise ', kind: 'keyword', detail: 'Ném ngoại lệ (Exception)' },
  { label: 'with', insertText: 'with ', kind: 'keyword', detail: 'Context Manager tự động dọn tài nguyên' },
  { label: 'match', insertText: 'match ', kind: 'keyword', detail: 'Structural Pattern Matching (Python 3.10+)' },
  { label: 'case', insertText: 'case ', kind: 'keyword', detail: 'Nhánh khớp mẫu trong match' },
  { label: 'import', insertText: 'import ', kind: 'keyword', detail: 'Nạp module' },
  { label: 'from', insertText: 'from ', kind: 'keyword', detail: 'Nạp thành phần từ module' },
  { label: 'pass', insertText: 'pass', kind: 'keyword', detail: 'Lệnh rỗng giữ chỗ khối code' },
  { label: 'global', insertText: 'global ', kind: 'keyword', detail: 'Tham chiếu biến toàn cục' },
  { label: 'nonlocal', insertText: 'nonlocal ', kind: 'keyword', detail: 'Tham chiếu biến hàm bao ngoài (Closure)' },
  { label: 'True', insertText: 'True', kind: 'keyword', detail: 'Hằng số Boolean Đúng' },
  { label: 'False', insertText: 'False', kind: 'keyword', detail: 'Hằng số Boolean Sai' },
  { label: 'None', insertText: 'None', kind: 'keyword', detail: 'Đối tượng rỗng duy nhất (Singleton)' },
  { label: 'self', insertText: 'self', kind: 'keyword', detail: 'Tham chiếu thực thể hiện tại của Class' },
  { label: 'cls', insertText: 'cls', kind: 'keyword', detail: 'Tham chiếu lớp hiện tại trong @classmethod' },

  // Built-in Functions
  { label: 'enumerate', insertText: 'enumerate(', kind: 'builtin', detail: 'enumerate(iterable, start=0) -> (idx, val)' },
  { label: 'zip', insertText: 'zip(', kind: 'builtin', detail: 'zip(*iterables, strict=False) -> ghép cặp song song' },
  { label: 'range', insertText: 'range(', kind: 'builtin', detail: 'range(start, stop, step) -> dãy số lười O(1) RAM' },
  { label: 'len', insertText: 'len(', kind: 'builtin', detail: 'len(obj) -> số lượng phần tử O(1)' },
  { label: 'sorted', insertText: 'sorted(', kind: 'builtin', detail: 'sorted(iterable, key=..., reverse=False) -> list mới' },
  { label: 'reversed', insertText: 'reversed(', kind: 'builtin', detail: 'reversed(seq) -> iterator đảo ngược' },
  { label: 'sum', insertText: 'sum(', kind: 'builtin', detail: 'sum(iterable, start=0) -> tính tổng nhanh' },
  { label: 'min', insertText: 'min(', kind: 'builtin', detail: 'min(iterable, key=..., default=...)' },
  { label: 'max', insertText: 'max(', kind: 'builtin', detail: 'max(iterable, key=..., default=...)' },
  { label: 'abs', insertText: 'abs(', kind: 'builtin', detail: 'abs(x) -> giá trị tuyệt đối' },
  { label: 'round', insertText: 'round(', kind: 'builtin', detail: 'round(number, ndigits) -> làm tròn Banker' },
  { label: 'any', insertText: 'any(', kind: 'builtin', detail: 'any(iterable) -> True nếu có ít nhất 1 phần tử Truthy' },
  { label: 'all', insertText: 'all(', kind: 'builtin', detail: 'all(iterable) -> True nếu mọi phần tử đều Truthy' },
  { label: 'isinstance', insertText: 'isinstance(', kind: 'builtin', detail: 'isinstance(obj, class_or_tuple) -> kiểm tra kiểu' },
  { label: 'issubclass', insertText: 'issubclass(', kind: 'builtin', detail: 'issubclass(cls, classinfo) -> kiểm tra kế thừa' },
  { label: 'getattr', insertText: 'getattr(', kind: 'builtin', detail: 'getattr(obj, name, default) -> lấy thuộc tính động' },
  { label: 'setattr', insertText: 'setattr(', kind: 'builtin', detail: 'setattr(obj, name, value) -> gán thuộc tính động' },
  { label: 'hasattr', insertText: 'hasattr(', kind: 'builtin', detail: 'hasattr(obj, name) -> kiểm tra có thuộc tính' },
  { label: 'super', insertText: 'super().__init__(', kind: 'builtin', detail: 'Gọi phương thức của lớp cha theo MRO' },
  { label: 'print', insertText: 'print(', kind: 'builtin', detail: 'print(*objects, sep=" ", end="\\n")' },
  { label: 'map', insertText: 'map(', kind: 'builtin', detail: 'map(func, iterable) -> iterator biến đổi' },
  { label: 'filter', insertText: 'filter(', kind: 'builtin', detail: 'filter(func, iterable) -> iterator lọc' },
  { label: 'iter', insertText: 'iter(', kind: 'builtin', detail: 'iter(obj) -> lấy đối tượng Iterator' },
  { label: 'next', insertText: 'next(', kind: 'builtin', detail: 'next(iterator, default) -> lấy phần tử kế tiếp' },

  // Built-in Types, Stdlib & Exceptions
  { label: 'dict', insertText: 'dict(', kind: 'type', detail: 'Bảng băm Key-Value O(1)' },
  { label: 'list', insertText: 'list(', kind: 'type', detail: 'Mảng động (Dynamic Array)' },
  { label: 'set', insertText: 'set(', kind: 'type', detail: 'Tập hợp phần tử duy nhất O(1) lookup' },
  { label: 'frozenset', insertText: 'frozenset(', kind: 'type', detail: 'Tập hợp bất biến (Hashable)' },
  { label: 'tuple', insertText: 'tuple(', kind: 'type', detail: 'Bộ giá trị bất biến (Immutable Sequence)' },
  { label: 'int', insertText: 'int(', kind: 'type', detail: 'Số nguyên độ chính xác tùy ý' },
  { label: 'str', insertText: 'str(', kind: 'type', detail: 'Chuỗi ký tự Unicode bất biến' },
  { label: 'float', insertText: 'float(', kind: 'type', detail: 'Số thực dấu phẩy động IEEE 754' },
  { label: 'bool', insertText: 'bool(', kind: 'type', detail: 'Kiểu logic True / False' },
  { label: 'Decimal', insertText: 'Decimal(', kind: 'type', detail: 'Số thập phân chính xác tuyệt đối cho Tài chính' },
  { label: 'ROUND_HALF_UP', insertText: 'ROUND_HALF_UP', kind: 'type', detail: 'Chế độ làm tròn chuẩn thương mại (>=5 lên)' },
  { label: 'defaultdict', insertText: 'defaultdict(', kind: 'type', detail: 'Dict tự khởi tạo giá trị mặc định khi thiếu key' },
  { label: 'Counter', insertText: 'Counter(', kind: 'type', detail: 'Dict chuyên đếm tần suất phần tử' },
  { label: 'deque', insertText: 'deque(', kind: 'type', detail: 'Hàng đợi 2 đầu thêm/xóa O(1)' },
  { label: 'dataclass', insertText: '@dataclass', kind: 'type', detail: 'Decorator tự sinh __init__, __repr__, __eq__' },
  { label: 'property', insertText: '@property', kind: 'type', detail: 'Biến method thành thuộc tính tính toán (Getter)' },
  { label: 'staticmethod', insertText: '@staticmethod', kind: 'type', detail: 'Phương thức tĩnh không nhận self/cls' },
  { label: 'classmethod', insertText: '@classmethod', kind: 'type', detail: 'Phương thức lớp nhận cls làm tham số đầu' },
  { label: 'lru_cache', insertText: '@lru_cache(maxsize=None)', kind: 'type', detail: 'Memoization cache kết quả hàm tự động' },
  { label: 'ValueError', insertText: 'ValueError(', kind: 'type', detail: 'Ngoại lệ giá trị không hợp lệ' },
  { label: 'TypeError', insertText: 'TypeError(', kind: 'type', detail: 'Ngoại lệ sai kiểu dữ liệu' },
  { label: 'KeyError', insertText: 'KeyError(', kind: 'type', detail: 'Ngoại lệ không tìm thấy key trong Dict' },

  // Common Methods (Dict, List, Set, Str, Decimal, Asyncio)
  { label: 'append', insertText: 'append(', kind: 'method', detail: 'list.append(x) — Thêm 1 phần tử vào cuối list O(1)' },
  { label: 'extend', insertText: 'extend(', kind: 'method', detail: 'list.extend(iterable) — Nối nhiều phần tử vào list' },
  { label: 'items', insertText: 'items()', kind: 'method', detail: 'dict.items() — Lấy cặp (key, value) view' },
  { label: 'keys', insertText: 'keys()', kind: 'method', detail: 'dict.keys() — Lấy tập hợp các khóa' },
  { label: 'values', insertText: 'values()', kind: 'method', detail: 'dict.values() — Lấy các giá trị của dict' },
  { label: 'get', insertText: 'get(', kind: 'method', detail: 'dict.get(key, default=None) — Lấy giá trị an toàn không lỗi KeyError' },
  { label: 'setdefault', insertText: 'setdefault(', kind: 'method', detail: 'dict.setdefault(key, default) — Lấy hoặc gán mặc định' },
  { label: 'split', insertText: 'split(', kind: 'method', detail: 'str.split(sep=None) — Tách chuỗi thành list' },
  { label: 'join', insertText: 'join(', kind: 'method', detail: 'sep.join(iterable) — Ghép chuỗi hiệu năng cao O(N)' },
  { label: 'strip', insertText: 'strip(', kind: 'method', detail: 'str.strip() — Cắt khoảng trắng 2 đầu' },
  { label: 'replace', insertText: 'replace(', kind: 'method', detail: 'str.replace(old, new) — Thay thế chuỗi con' },
  { label: 'lower', insertText: 'lower()', kind: 'method', detail: 'str.lower() — Chuyển sang chữ thường' },
  { label: 'upper', insertText: 'upper()', kind: 'method', detail: 'str.upper() — Chuyển sang chữ hoa' },
  { label: 'startswith', insertText: 'startswith(', kind: 'method', detail: 'str.startswith(prefix) — Kiểm tra tiền tố' },
  { label: 'endswith', insertText: 'endswith(', kind: 'method', detail: 'str.endswith(suffix) — Kiểm tra hậu tố' },
  { label: 'quantize', insertText: 'quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)', kind: 'method', detail: 'Decimal.quantize() — Làm tròn số thập phân tài chính' },
  { label: 'most_common', insertText: 'most_common(', kind: 'method', detail: 'Counter.most_common(n) — Top n phần tử xuất hiện nhiều nhất' },
  { label: 'popleft', insertText: 'popleft()', kind: 'method', detail: 'deque.popleft() — Lấy phần tử đầu hàng đợi O(1)' },
  { label: 'appendleft', insertText: 'appendleft(', kind: 'method', detail: 'deque.appendleft(x) — Thêm vào đầu hàng đợi O(1)' },
  { label: 'gather', insertText: 'gather(', kind: 'method', detail: 'asyncio.gather(*aws) — Chạy đồng thời các Coroutine' },

  // Dunder Methods
  { label: '__init__', insertText: '__init__(self, ', kind: 'dunder', detail: 'Hàm khởi tạo thuộc tính cho đối tượng mới' },
  { label: '__repr__', insertText: '__repr__(self) -> str:', kind: 'dunder', detail: 'Chuỗi biểu diễn chuẩn dành cho Developer / Debug' },
  { label: '__str__', insertText: '__str__(self) -> str:', kind: 'dunder', detail: 'Chuỗi hiển thị thân thiện khi gọi print() / str()' },
  { label: '__eq__', insertText: '__eq__(self, other) -> bool:', kind: 'dunder', detail: 'Nạp chồng toán tử so sánh bằng (==)' },
  { label: '__lt__', insertText: '__lt__(self, other) -> bool:', kind: 'dunder', detail: 'Nạp chồng toán tử nhỏ hơn (<) phục vụ sort' },
  { label: '__len__', insertText: '__len__(self) -> int:', kind: 'dunder', detail: 'Hỗ trợ hàm len(obj)' },
  { label: '__getitem__', insertText: '__getitem__(self, key):', kind: 'dunder', detail: 'Hỗ trợ truy cập chỉ mục obj[key]' },
  { label: '__enter__', insertText: '__enter__(self):', kind: 'dunder', detail: 'Khởi tạo tài nguyên khi vào khối with' },
  { label: '__exit__', insertText: '__exit__(self, exc_type, exc_val, exc_tb):', kind: 'dunder', detail: 'Đóng/dọn tài nguyên khi thoát khối with' },
  { label: '__call__', insertText: '__call__(self, *args, **kwargs):', kind: 'dunder', detail: 'Cho phép gọi instance như một hàm obj()' },
  { label: '__post_init__', insertText: '__post_init__(self):', kind: 'dunder', detail: 'Hook kiểm tra hợp lệ ngay sau @dataclass __init__' },
  { label: '__slots__', insertText: '__slots__ = (', kind: 'dunder', detail: 'Cố định thuộc tính, triệt tiêu __dict__ tiết kiệm RAM' },
];

/**
 * Extracts active word prefix before the cursor and returns ranked Python IntelliSense suggestions.
 */
export function getPythonCompletions(
  code: string,
  cursorIndex: number,
  extraContextCode = ''
): {
  prefix: string;
  replaceStart: number;
  isAfterDot: boolean;
  suggestions: CompletionItem[];
} {
  const beforeCursor = code.slice(0, cursorIndex);
  const match = beforeCursor.match(/(\.?@[a-zA-Z_][a-zA-Z0-9_]*|\.?[a-zA-Z_][a-zA-Z0-9_]*)$/);

  if (!match) {
    return { prefix: '', replaceStart: cursorIndex, isAfterDot: false, suggestions: [] };
  }

  const rawMatch = match[1];
  const isAfterDot = rawMatch.startsWith('.');
  const prefix = isAfterDot ? rawMatch.slice(1) : rawMatch;
  const replaceStart = cursorIndex - prefix.length;

  if (prefix.length < 1) {
    return { prefix: '', replaceStart: cursorIndex, isAfterDot, suggestions: [] };
  }

  // Do not trigger autocomplete inside comments
  const lineStart = beforeCursor.lastIndexOf('\n') + 1;
  const currentLineBefore = beforeCursor.slice(lineStart);
  if (currentLineBefore.includes('#')) {
    return { prefix: '', replaceStart: cursorIndex, isAfterDot, suggestions: [] };
  }

  // Extract local identifiers from current code & exercise context
  const combinedSource = `${code}\n${extraContextCode}`;
  const identMatches = combinedSource.match(/\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b/g) || [];
  const staticLabels = new Set(STATIC_COMPLETIONS.map((c) => c.label));
  const localSet = new Set<string>();

  for (const id of identMatches) {
    if (id !== prefix && !staticLabels.has(id)) {
      localSet.add(id);
    }
  }

  const localItems: CompletionItem[] = Array.from(localSet).map((id) => ({
    label: id,
    insertText: id,
    kind: 'variable',
    detail: 'Biến / Định danh trong bài tập hiện tại',
  }));

  const pool = isAfterDot
    ? [
        ...STATIC_COMPLETIONS.filter((c) => c.kind === 'method' || c.kind === 'dunder'),
        ...localItems,
      ]
    : [...localItems, ...STATIC_COMPLETIONS];

  const lowerPrefix = prefix.toLowerCase();
  const cleanPrefix = lowerPrefix.startsWith('@') ? lowerPrefix.slice(1) : lowerPrefix;

  const matched = pool
    .filter((item) => {
      const lowerLabel = item.label.toLowerCase();
      const cleanLabel = lowerLabel.startsWith('@') ? lowerLabel.slice(1) : lowerLabel;
      if (lowerLabel === lowerPrefix) return false; // Already typed completely
      return (
        cleanLabel.startsWith(cleanPrefix) ||
        lowerLabel.startsWith(lowerPrefix) ||
        (cleanPrefix.length >= 2 && cleanLabel.includes(cleanPrefix))
      );
    })
    .sort((a, b) => {
      const aStarts = a.label.toLowerCase().replace(/^@/, '').startsWith(cleanPrefix) ? 0 : 1;
      const bStarts = b.label.toLowerCase().replace(/^@/, '').startsWith(cleanPrefix) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      if (a.kind === 'variable' && b.kind !== 'variable') return -1;
      if (b.kind === 'variable' && a.kind !== 'variable') return 1;
      return a.label.length - b.label.length;
    })
    .slice(0, 7);

  return {
    prefix,
    replaceStart,
    isAfterDot,
    suggestions: matched,
  };
}

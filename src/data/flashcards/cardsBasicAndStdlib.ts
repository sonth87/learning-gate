import { FlashcardItem } from '@/types/assessment.types';

export const FLASHCARDS_BASIC_AND_STDLIB: FlashcardItem[] = [
  // ============================================================================
  // PHẦN 1: DATA STRUCTURES DEEP PRACTICE (15 CARDS: fc-161 -> fc-175)
  // ============================================================================
  {
    id: 'fc-161',
    stageId: 'stage-2',
    level: 'fundamental',
    category: 'Cấu trúc Dữ liệu (List)',
    frontQuestion:
      'Phép gán lát cắt (Slice Assignment) như `nums[1:3] = [99]` hoạt động như thế nào và khác gì với gán theo chỉ số đơn `nums[1] = 99`?',
    frontHint: 'Thay thế cả một đoạn phần tử tại chỗ (in-place) bằng một iterable bất kỳ (có thể dài hơn, ngắn hơn hoặc rỗng).',
    backAnswer:
      'Slice Assignment `nums[start:stop] = iterable` thay thế **trực tiếp tại chỗ (in-place)** đoạn phần tử từ `start` đến `stop - 1` bằng các phần tử của `iterable` mà không tạo `list` mới. Độ dài của `iterable` không cần bằng độ dài lát cắt: bạn có thể thu gọn đoạn (`[99]`), mở rộng đoạn (`[99, 100, 101]`), chèn vào vị trí bất kỳ (`nums[1:1] = [88]`) hoặc xóa đoạn (`nums[1:3] = []`).',
    backAnalogy:
      'Giống như cắt bỏ 2 toa tàu ở giữa đoàn tàu rồi nối thẳng 1 toa mới (hoặc 5 toa mới) vào đúng vị trí đó trên cùng một đường ray.',
    codeSnippet: `nums = [10, 20, 30, 40]\nnums[1:3] = [99]        # Thay [20, 30] bằng [99] -> [10, 99, 40]\nnums[1:1] = [55, 66]    # Chèn vào index 1 -> [10, 55, 66, 99, 40]\nnums[1:3] = []          # Xóa đoạn [55, 66] -> [10, 99, 40]`,
    relatedTermIds: ['type-list', 'concept-slicing', 'concept-mutability'],
  },
  {
    id: 'fc-162',
    stageId: 'stage-2',
    level: 'fundamental',
    category: 'Cấu trúc Dữ liệu (List)',
    frontQuestion:
      'Sự khác biệt cốt lõi giữa `list.append(x)` và `list.extend(iterable)` là gì? Toán tử `+=` trên `list` tương đương với phương thức nào?',
    frontHint: 'Nhét nguyên chiếc hộp vào danh sách vs mở hộp lấy từng món đồ bên trong ra xếp nối tiếp.',
    backAnswer:
      '`list.append(x)` luôn thêm `x` như **một phần tử duy nhất** vào cuối danh sách ($O(1)$) — nếu `x` là một `list`, bạn sẽ tạo ra list lồng nhau. Ngược lại, `list.extend(iterable)` lặp qua từng phần tử của `iterable` và nối phẳng chúng vào cuối danh sách ($O(k)$ với $k$ là số phần tử thêm vào). Toán tử `nums += iterable` (`__iadd__`) hoạt động tương đương với `nums.extend(iterable)` (sửa tại chỗ).',
    backAnalogy:
      '`append` là bỏ nguyên cả túi kẹo vào giỏ hàng; `extend` là xé túi kẹo và đổ từng viên kẹo rời vào giỏ.',
    codeSnippet: `a = [1, 2]\na.append([3, 4])   # [1, 2, [3, 4]] (List lồng nhau!)\n\nb = [1, 2]\nb.extend([3, 4])   # [1, 2, 3, 4] (Nối phẳng từng phần tử)\nb += (5, 6)        # [1, 2, 3, 4, 5, 6] (Chấp nhận mọi iterable)`,
    relatedTermIds: ['type-list', 'concept-iterable', 'concept-mutability'],
  },
  {
    id: 'fc-163',
    stageId: 'stage-2',
    level: 'fundamental',
    category: 'Cấu trúc Dữ liệu (List)',
    frontQuestion:
      'So sánh 3 cách xóa phần tử khỏi `list`: `del nums[i]`, `nums.pop(i)` và `nums.remove(val)` về cơ chế, giá trị trả về và độ phức tạp?',
    frontHint: 'Xóa theo vị trí không trả về vs Xóa theo vị trí có trả về vs Xóa theo giá trị.',
    backAnswer:
      '1. `del nums[i]`: Xóa phần tử tại chỉ số `i` (hoặc lát cắt `del nums[1:3]`), **không trả về giá trị** ($O(N)$ nếu ở giữa, $O(1)$ ở cuối).\n2. `nums.pop(i=-1)`: Xóa và **trả về phần tử** tại chỉ số `i` (mặc định cuối list là $O(1)$, đầu/giữa list là $O(N)$).\n3. `nums.remove(val)`: Quét từ đầu để xóa **lần xuất hiện đầu tiên** của giá trị `val` ($O(N)$); ném `ValueError` nếu không tìm thấy.',
    backAnalogy:
      '`del` là hủy ghế số 5; `pop` là mời người ở ghế số 5 đứng dậy đi làm việc khác; `remove` là đi dọc hàng ghế tìm người tên "Nam" đầu tiên để mời ra.',
    codeSnippet: `items = ["a", "b", "c", "b"]\nlast = items.pop()     # Trả về "b", còn ["a", "b", "c"]\nitems.remove("b")      # Xóa "b" đầu tiên -> ["a", "c"]\ndel items[0]           # Xóa index 0 -> ["c"]`,
    relatedTermIds: ['type-list', 'concept-time-complexity', 'exc-valueerror'],
  },
  {
    id: 'fc-164',
    stageId: 'stage-2',
    level: 'fundamental',
    category: 'Cấu trúc Dữ liệu (Sequence)',
    frontQuestion:
      'Hàm dựng sẵn `reversed(seq)` khác gì với cú pháp cắt lát `seq[::-1]` về mặt bộ nhớ và kiểu trả về?',
    frontHint: 'Lazy Iterator $O(1)$ RAM vs Eager Copy $O(N)$ RAM.',
    backAnswer:
      '`seq[::-1]` tạo ra một **bản sao mới hoàn toàn** của chuỗi/danh sách theo thứ tự ngược, tiêu tốn $O(N)$ bộ nhớ RAM và $O(N)$ thời gian ngay lập tức. Ngược lại, `reversed(seq)` trả về một **Reverse Iterator** chỉ tốn **$O(1)$ bộ nhớ**, đọc từng phần tử từ cuối về đầu khi được duyệt qua (`for` hoặc `next()`). Hãy ưu tiên `reversed(seq)` khi chỉ cần duyệt ngược.',
    backAnalogy:
      '`seq[::-1]` là in lại toàn bộ cuốn sách theo thứ tự từ trang cuối về trang đầu; `reversed(seq)` là đặt ngón tay vào trang cuối của cuốn sách gốc và lật ngược từng trang để đọc.',
    codeSnippet: `nums = [10, 20, 30, 40]\nrev_iter = reversed(nums)      # <list_reverseiterator> - O(1) RAM\nfor x in rev_iter:\n    print(x)                   # 40, 30, 20, 10\n\nrev_copy = nums[::-1]          # [40, 30, 20, 10] - Tạo list mới O(N) RAM`,
    relatedTermIds: ['builtin-reversed', 'concept-iterator', 'concept-slicing'],
  },
  {
    id: 'fc-165',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Cấu trúc Dữ liệu (Sorting)',
    frontQuestion:
      'Hàm `sorted(items, key=..., reverse=True)` hoạt động như thế nào, khác gì với `items.sort()`, và tính chất **Stable Sort** của thuật toán Timsort có ý nghĩa gì?',
    frontHint: 'Mọi iterable trả về list mới vs Chỉ dành cho list và trả về `None`.',
    backAnswer:
      '`sorted()` nhận **bất kỳ iterable nào** (`list`, `tuple`, `set`, `dict`, generator) và trả về một **`list` mới** đã sắp xếp, giữ nguyên dữ liệu gốc. `list.sort()` chỉ có trên `list`, sắp xếp **tại chỗ (in-place)** và trả về `None`. Cả hai dùng thuật toán **Timsort** ($O(N \\log N)$) có tính **ổn định (Stable)**: hai phần tử có cùng giá trị `key` sẽ giữ nguyên thứ tự tương đối ban đầu của chúng.',
    backAnalogy:
      'Stable Sort giống như xếp hàng học sinh theo điểm thi: nếu hai bạn bằng điểm nhau, bạn nào đứng trước trong danh sách gốc vẫn sẽ đứng trước.',
    codeSnippet: `users = [{"name": "An", "age": 25}, {"name": "Bình", "age": 20}, {"name": "Chi", "age": 25}]\n# Sắp xếp giảm dần theo tuổi; An vẫn đứng trước Chi vì Timsort có tính Stable\nby_age = sorted(users, key=lambda u: u["age"], reverse=True)`,
    relatedTermIds: ['builtin-sorted', 'type-list', 'kw-lambda'],
  },
  {
    id: 'fc-166',
    stageId: 'stage-2',
    level: 'fundamental',
    category: 'Cấu trúc Dữ liệu (Tuple & Unpacking)',
    frontQuestion:
      'Cú pháp **Extended Iterable Unpacking** với dấu sao (`first, *middle, last = items`) hoạt động ra sao và biến có dấu `*` luôn mang kiểu dữ liệu gì?',
    frontHint: 'Dù vế phải là `tuple`, `set` hay `str`, biến `*rest` luôn gom thành một `list`.',
    backAnswer:
      'Theo PEP 3132, toán tử `*` trong phép gán Unpacking đóng vai trò "máy hút" gom toàn bộ các phần tử dư còn lại sau khi các biến cố định ở đầu/cuối đã nhận phần tử của mình. Biến có dấu `*` **luôn luôn là một `list`** (kể cả khi có 0 phần tử `[]`, hoặc khi vế phải là `tuple`, `str`, hay generator). Mỗi vế trái chỉ được phép có tối đa một biến mang dấu `*`.',
    backAnalogy:
      'Chia bài cho người đầu và người cuối mỗi người 1 lá, toàn bộ phần bài còn lại ở giữa (dù nhiều hay không còn lá nào) đều gom vào một xấp (`list`).',
    codeSnippet: `scores = (100, 85, 90, 92, 40)\nhighest, *middle_scores, lowest = scores\n# highest = 100, middle_scores = [85, 90, 92] (list!), lowest = 40\n\nhead, *empty_rest = [42]\n# head = 42, empty_rest = []`,
    relatedTermIds: ['type-tuple', 'concept-unpacking', 'type-list'],
  },
  {
    id: 'fc-167',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Cấu trúc Dữ liệu (Dict)',
    frontQuestion:
      'Tại sao `dict.fromkeys(["a", "b", "c"], [])` lại là một cái bẫy nguy hiểm và cách viết đúng để khởi tạo `dict` chứa các `list` độc lập là gì?',
    frontHint: 'Tất cả các key đều trỏ tới cùng một địa chỉ `list` duy nhất trên Heap.',
    backAnswer:
      '`dict.fromkeys(keys, default_value)` **không sao chép** `default_value` mà gán **cùng một tham chiếu đối tượng** cho mọi key. Nếu `default_value` là đối tượng khả biến như `[]` hoặc `{}`, việc `.append()` vào một key sẽ làm tất cả các key khác bị thay đổi theo! Cách đúng là dùng **Dict Comprehension** `{k: [] for k in keys}` để tạo một `list` mới độc lập ở mỗi vòng lặp.',
    backAnalogy:
      '`fromkeys(..., [])` giống như phát cho 3 nhân viên 3 chiếc chìa khóa mở chung 1 ngăn tủ duy nhất; Dict Comprehension là xây cho mỗi người 1 ngăn tủ riêng.',
    codeSnippet: `# ❌ BẪY: Dùng chung 1 list\nbad = dict.fromkeys(["a", "b"], [])\nbad["a"].append(1)  # {'a': [1], 'b': [1]} -> Bị dính chùm!\n\n# ✅ ĐÚNG: Mỗi key một list mới\ngood = {k: [] for k in ["a", "b"]}\ngood["a"].append(1) # {'a': [1], 'b': []}`,
    relatedTermIds: ['type-dict', 'concept-mutability', 'concept-comprehension'],
  },
  {
    id: 'fc-168',
    stageId: 'stage-2',
    level: 'fundamental',
    category: 'Cấu trúc Dữ liệu (Dict)',
    frontQuestion:
      'Phương thức `dict.pop(key, default)` và `dict.popitem()` hoạt động như thế nào trong Python 3.7+?',
    frontHint: 'Lấy giá trị kèm xóa key an toàn vs Lấy cặp `(key, value)` được chèn vào sau cùng (LIFO).',
    backAnswer:
      '`d.pop(key, default)` xóa `key` khỏi `dict` và trả về giá trị tương ứng. Nếu `key` không tồn tại: trả về `default` nếu được cung cấp, hoặc ném `KeyError` nếu không truyền `default`. Trong khi đó, `d.popitem()` xóa và trả về cặp `(key, value)` theo thứ tự **LIFO (Last-In, First-Out — cặp vừa thêm vào cuối cùng)** kể từ Python 3.7+.',
    backAnalogy:
      '`pop(key, None)` là rút hồ sơ theo tên (không có thì về tay không chứ không báo động); `popitem()` là lấy tập hồ sơ vừa mới đặt lên trên cùng của chồng.',
    codeSnippet: `config = {"host": "localhost", "port": 8080, "debug": True}\ndebug_mode = config.pop("debug", False)  # True (key "debug" bị xóa)\ntimeout = config.pop("timeout", 30)      # 30 (không lỗi KeyError)\nlast_pair = config.popitem()             # ('port', 8080) - LIFO`,
    relatedTermIds: ['type-dict', 'exc-keyerror'],
  },
  {
    id: 'fc-169',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Cấu trúc Dữ liệu (Dict Views)',
    frontQuestion:
      'Các đối tượng trả về từ `d.keys()`, `d.values()`, `d.items()` là gì và chúng có những khả năng đặc biệt nào?',
    frontHint: 'Dynamic View Objects (khung nhìn động) và phép toán tập hợp trên `keys()` / `items()`.',
    backAnswer:
      'Chúng không trả về `list` mà trả về **Dictionary View Objects** ($O(1)$ bộ nhớ). Chúng có 2 đặc tính quan trọng:\n1. **Tính động (Dynamic)**: Mọi thay đổi trên `dict` gốc được phản ánh ngay lập tức qua view mà không cần gọi lại hàm.\n2. **Hỗ trợ phép toán tập hợp (Set-like)**: `d.keys()` và `d.items()` (nếu value hashable) hỗ trợ trực tiếp giao `&`, hợp `|`, hiệu `-`, hiệu đối xứng `^` như một `set`.',
    backAnalogy:
      'View Object là cửa sổ kính nhìn thẳng vào kho hàng (`dict`): kho thêm hay bớt hàng thì nhìn qua cửa sổ thấy ngay mà không cần chụp ảnh lại.',
    codeSnippet: `d1 = {"a": 1, "b": 2, "c": 3}\nd2 = {"b": 20, "c": 3, "d": 4}\n\ncommon_keys = d1.keys() & d2.keys()    # {'b', 'c'}\nmissing_keys = d1.keys() - d2.keys()   # {'a'}\nsame_pairs = d1.items() & d2.items()   # {('c', 3)}`,
    relatedTermIds: ['type-dict', 'type-set', 'concept-hashable'],
  },
  {
    id: 'fc-170',
    stageId: 'stage-2',
    level: 'fundamental',
    category: 'Cấu trúc Dữ liệu (Set)',
    frontQuestion:
      'Các phương thức kiểm tra quan hệ tập hợp `issubset()`, `issuperset()`, và `isdisjoint()` trên `set` hoạt động như thế nào?',
    frontHint: 'Tập con (`<=`), tập cha (`>=`), và hai tập hoàn toàn không có phần tử chung.',
    backAnswer:
      '- `a.issubset(b)` (hoặc `a <= b`): `True` nếu mọi phần tử của `a` đều nằm trong `b` (`a < b` là tập con thực sự).\n- `a.issuperset(b)` (hoặc `a >= b`): `True` nếu `a` chứa toàn bộ phần tử của `b`.\n- `a.isdisjoint(b)`: `True` nếu `a` và `b` **không có bất kỳ phần tử chung nào** ($a \\cap b = \\emptyset$). `isdisjoint` chạy nhanh hơn `len(a & b) == 0` vì nó dừng ngay khi gặp phần tử trùng đầu tiên mà không tạo set trung gian.',
    backAnalogy:
      '`issuperset` kiểm tra người dùng có đủ mọi quyền yêu cầu không; `isdisjoint` kiểm tra danh sách nguyên liệu có hoàn toàn sạch các chất gây dị ứng không.',
    codeSnippet: `user_roles = {"read", "write", "export"}\nrequired = {"read", "write"}\nblocked = {"banned", "suspended"}\n\nhas_access = required <= user_roles            # True (issubset)\nis_clean = user_roles.isdisjoint(blocked)      # True (không giao nhau)`,
    relatedTermIds: ['type-set', 'concept-hashable'],
  },
  {
    id: 'fc-171',
    stageId: 'stage-2',
    level: 'fundamental',
    category: 'Cấu trúc Dữ liệu (Set)',
    frontQuestion:
      'Sự khác biệt giữa `set.remove(x)` và `set.discard(x)` khi xóa phần tử khỏi `set` là gì?',
    frontHint: 'Một hàm ném `KeyError` nếu không tìm thấy, một hàm lặng lẽ bỏ qua.',
    backAnswer:
      'Cả hai đều xóa phần tử `x` khỏi `set` với độ phức tạp trung bình $O(1)$. Tuy nhiên, nếu `x` không tồn tại trong `set`: `s.remove(x)` sẽ ném ngoại lệ **`KeyError`**, còn `s.discard(x)` **không làm gì cả và không báo lỗi** (idempotent). Hãy dùng `discard()` khi chỉ muốn đảm bảo phần tử không còn trong tập hợp, và dùng `remove()` khi sự vắng mặt của `x` là một lỗi logic cần bắt.',
    backAnalogy:
      '`discard` giống như lệnh "Đảm bảo đèn đã tắt" (tắt rồi thì thôi); `remove` giống như "Hãy rút phích cắm đang cắm" (nếu chưa cắm thì báo động lỗi).',
    codeSnippet: `tags = {"python", "backend"}\ntags.discard("frontend")  # An toàn tuyệt đối, không lỗi\n# tags.remove("frontend") # KeyError: 'frontend'`,
    relatedTermIds: ['type-set', 'exc-keyerror'],
  },
  {
    id: 'fc-172',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Cấu trúc Dữ liệu (Frozenset)',
    frontQuestion:
      '`frozenset` là gì và tại sao chúng ta cần nó khi đã có `set` và `tuple`?',
    frontHint: 'Khi bạn cần một tập hợp không thứ tự, không trùng lặp nhưng phải Hashable để làm key cho `dict` hoặc phần tử của `set` khác.',
    backAnswer:
      '`frozenset` là phiên bản **bất biến (Immutable) và Hashable** của `set`. Vì `set` thông thường là khả biến nên không có mã băm (`__hash__ = None`), dẫn đến không thể làm key của `dict` hay nằm trong một `set` khác. `frozenset` giải quyết bài toán này: vừa loại bỏ trùng lặp và không phân biệt thứ tự (khác với `tuple` có phân biệt thứ tự `(1, 2) != (2, 1)`), vừa dùng làm key trong `dict` hoặc bộ nhớ đệm `@lru_cache`.',
    backAnalogy:
      '`set` là bó hoa đang cắm (có thể rút ra cắm thêm), còn `frozenset` là bó hoa đã được đúc trong khối nhựa trong suốt Vĩnh Cửu để khắc mã vạch lên.',
    codeSnippet: `# Dùng frozenset làm key cho bảng giá tuyến bay hai chiều (A<->B như nhau)\nroutes = {\n    frozenset({"HAN", "SGN"}): 1500000,\n    frozenset({"DAD", "SGN"}): 1100000,\n}\nprint(routes[frozenset({"SGN", "HAN"})])  # 1500000 (Không phụ thuộc thứ tự!)`,
    relatedTermIds: ['type-frozenset', 'type-set', 'concept-hashable'],
  },
  {
    id: 'fc-173',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Cấu trúc Dữ liệu (Comprehensions)',
    frontQuestion:
      'Quy tắc đọc thứ tự các vòng lặp trong **Nested List Comprehension** `[x for row in matrix for x in row]` là gì và nó khác gì với `[[x for x in row] for row in matrix]`?',
    frontHint: 'Đọc từ trái sang phải giống hệt thứ tự viết vòng `for` lồng nhau truyền thống.',
    backAnswer:
      '- **Làm phẳng (Flatten - 1D)**: `[x for row in matrix for x in row]` đọc các mệnh đề `for` **từ trái sang phải** giống hệt thứ tự lồng nhau từ ngoài vào trong của vòng lặp truyền thống (`for row in matrix:` ở ngoài, `for x in row:` ở trong), tạo ra list 1 chiều.\n- **Tạo ma trận 2D**: `[[x for x in row] for row in matrix]` có biểu thức bên trái bản thân nó là một List Comprehension con, nên kết quả là một list chứa các list con (2 chiều).',
    backAnalogy:
      'Làm phẳng `[x for row ... for x ...]` là đi từng tầng (`row`) rồi mở từng phòng (`x`) dẫn khách ra 1 hàng dọc; còn `[[...] for row ...]` là giữ nguyên cấu trúc từng tầng.',
    codeSnippet: `matrix = [[1, 2], [3, 4], [5, 6]]\n\n# 1. Làm phẳng 2D -> 1D (Vòng lặp ngoài viết trước, vòng lặp trong viết sau)\nflat = [x for row in matrix for x in row]          # [1, 2, 3, 4, 5, 6]\n\n# 2. Biến đổi giữ nguyên cấu trúc 2D\ndoubled = [[x * 2 for x in row] for row in matrix] # [[2, 4], [6, 8], [10, 12]]`,
    relatedTermIds: ['concept-comprehension', 'type-list'],
  },
  {
    id: 'fc-174',
    stageId: 'stage-2',
    level: 'fundamental',
    category: 'Cấu trúc Dữ liệu (Iteration)',
    frontQuestion:
      'Tại sao nên dùng `enumerate(items, start=1)` thay vì `range(len(items))`, và tham số `strict=True` trong `zip(a, b, strict=True)` (Python 3.10+) giải quyết rủi ro gì?',
    frontHint: 'Tránh lỗi đánh chỉ số thủ công và chống mất mát dữ liệu âm thầm khi hai danh sách lệch độ dài.',
    backAnswer:
      '- `enumerate(iterable, start=0)` trả về iterator sinh ra từng cặp `(index, value)` trực tiếp, sạch sẽ và hỗ trợ cả những iterable không có `len()` (như generator).\n- Mặc định `zip(a, b)` sẽ dừng ngay khi iterable ngắn nhất cạn kiệt, làm **mất dữ liệu âm thầm** ở iterable dài hơn. Truyền `strict=True` (Python 3.10+) buộc `zip` ném `ValueError` ngay nếu độ dài các chuỗi không khớp nhau.',
    backAnalogy:
      '`zip(..., strict=True)` giống như đóng cúc áo sơ mi có kiểm tra: nếu lệch tà dư ra 1 cúc mà hết lỗ khuyết thì báo lỗi ngay thay vì cắt bỏ vạt áo dư.',
    codeSnippet: `names = ["An", "Bình"]\nscores = [9.5, 8.0]\n\nfor idx, (name, score) in enumerate(zip(names, scores, strict=True), start=1):\n    print(f"#{idx}: {name} đạt {score} điểm")`,
    relatedTermIds: ['builtin-enumerate', 'builtin-zip', 'exc-valueerror'],
  },
  {
    id: 'fc-175',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Mô hình Bộ nhớ & Sao chép',
    frontQuestion:
      'Khi nào phép sao chép nông (Shallow Copy: `nums.copy()`, `nums[:]`, `dict.copy()`) gây lỗi dữ liệu và cần tới `copy.deepcopy()`?',
    frontHint: 'Cấu trúc dữ liệu lồng nhau (list chứa list, dict chứa list).',
    backAnswer:
      '**Shallow Copy** chỉ tạo một vỏ container mới ở cấp ngoài cùng (cấp 1), nhưng các phần tử bên trong vẫn **trỏ chung tham chiếu** với đối tượng gốc. Nếu các phần tử bên trong là khả biến (như `list` chứa `list`, `dict` chứa `dict`), việc sửa đổi phần tử ở cấp 2 sẽ làm thay đổi cả bản gốc lẫn bản sao. `copy.deepcopy(obj)` đệ quy sao chép toàn bộ cây đối tượng ở mọi cấp độ và tự xử lý cả tham chiếu vòng (circular references).',
    backAnalogy:
      'Shallow Copy là photo tờ danh bạ của nhóm (vẫn gọi vào chung một số điện thoại); Deep Copy là nhân bản cả những người trong danh bạ sang một vũ trụ song song.',
    codeSnippet: `import copy\norig = {"team": ["An", "Bình"]}\n\nshallow = orig.copy()\ndeep = copy.deepcopy(orig)\n\nshallow["team"].append("Chi")  # Sửa cấp 2 -> orig["team"] cũng bị thêm "Chi"!\nprint(orig["team"])            # ['An', 'Bình', 'Chi']\nprint(deep["team"])            # ['An', 'Bình'] (An toàn tuyệt đối)`,
    relatedTermIds: ['stdlib-copy', 'concept-mutability', 'type-list'],
  },

  // ============================================================================
  // PHẦN 2: FUNCTIONS, SCOPE, ARGUMENTS & OOP FUNDAMENTALS (15 CARDS: fc-176 -> fc-190)
  // ============================================================================
  {
    id: 'fc-176',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Hàm & Đối số (Functions)',
    frontQuestion:
      'Phân biệt việc dùng `*` và `**` khi **Định nghĩa hàm** (`def f(*args, **kwargs)`) với khi **Gọi hàm** (`f(*my_list, **my_dict)`)?',
    frontHint: 'Định nghĩa hàm = Đóng gói (Packing); Gọi hàm = Giải nén (Unpacking).',
    backAnswer:
      '- **Khi định nghĩa hàm (Packing)**: `*args` gom các đối số vị trí dư thừa vào một `tuple`; `**kwargs` gom các đối số từ khóa dư thừa vào một `dict`.\n- **Khi gọi hàm (Unpacking)**: `*iterable` trải phẳng từng phần tử của danh sách thành các đối số vị trí rời rạc; `**mapping` trải từng cặp `key=value` của từ điển thành các đối số từ khóa tương ứng với tên tham số hàm.',
    backAnalogy:
      'Ở cửa nhận hàng (`def`), nhân viên đóng các món lẻ vào thùng (`*args`). Ở cửa gửi hàng (`call`), bạn tháo thùng lấy từng món ra đặt lên băng chuyền (`*list_args`).',
    codeSnippet: `def connect(host: str, port: int, ssl: bool = True) -> str:\n    return f"{host}:{port} (ssl={ssl})"\n\naddr = ("db.internal", 5432)\nopts = {"ssl": False}\nprint(connect(*addr, **opts))  # db.internal:5432 (ssl=False)`,
    relatedTermIds: ['concept-args-kwargs', 'concept-unpacking', 'kw-def'],
  },
  {
    id: 'fc-177',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Hàm & Tài liệu (Docstrings)',
    frontQuestion:
      'Docstring trong Python (PEP 257) khác gì với comment `#`, nó được lưu ở thuộc tính nào lúc Runtime và làm sao để truy xuất?',
    frontHint: 'Chuỗi literal đầu tiên ngay bên dưới `def`, `class` hoặc đầu module, lưu vào `__doc__`.',
    backAnswer:
      'Comment `#` bị bộ phân tích cú pháp loại bỏ hoàn toàn khi biên dịch sang Bytecode. Ngược lại, **Docstring** (chuỗi `"""..."""` đặt ở dòng lệnh đầu tiên của module, class, hoặc hàm) được CPython giữ lại lúc Runtime trong thuộc tính dunder **`__doc__`**. Các IDE (VS Code/PyCharm), hàm `help(func)`, `inspect.getdoc(func)` và công cụ tạo tài liệu (Sphinx/MkDocs) đọc trực tiếp `__doc__` để hiển thị hướng dẫn sử dụng.',
    backAnalogy:
      'Comment `#` là giấy nháp dán ngoài công trường bị dọn đi khi xây xong; Docstring là bảng hướng dẫn khắc đồng gắn cố định ngay sảnh tòa nhà (`__doc__`).',
    codeSnippet: `def calc_vat(amount: float, rate: float = 0.1) -> float:\n    """Tính thuế GTGT dựa trên số tiền gốc và thuế suất."""\n    return amount * rate\n\nprint(calc_vat.__doc__)  # "Tính thuế GTGT dựa trên số tiền gốc và thuế suất."`,
    relatedTermIds: ['dunder-doc', 'concept-pep8', 'kw-def'],
  },
  {
    id: 'fc-178',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Type Hints & Hàm bậc cao',
    frontQuestion:
      'Cách viết Type Annotation chuẩn hiện đại cho một tham số nhận vào một hàm khác (Callback / Higher-Order Function) với `collections.abc.Callable` là gì?',
    frontHint: 'Cú pháp `Callable[[Arg1Type, Arg2Type], ReturnType]`.',
    backAnswer:
      'Sử dụng `from collections.abc import Callable` (chuẩn PEP 585, thay thế `typing.Callable` cũ). Cú pháp là **`Callable[[Kiểu_Tham_Số_1, Kiểu_Tham_Số_2], Kiểu_Trả_Về]`**. Nếu hàm callback không nhận tham số nào, viết `Callable[[], ReturnType]`. Nếu chấp nhận mọi chữ ký tham số bất kỳ, dùng dấu ba chấm `Callable[..., ReturnType]`.',
    backAnalogy:
      '`Callable[[int, str], bool]` giống như ổ cắm quy định rõ: thiết bị cắm vào phải nhận đúng 2 chân đầu vào (`int`, `str`) và phát ra tín hiệu `bool`.',
    codeSnippet: `from collections.abc import Callable\n\ndef retry_check(validator: Callable[[int, str], bool], code: int, msg: str) -> bool:\n    return validator(code, msg)\n\ndef is_ok(status: int, text: str) -> bool:\n    return status == 200 and len(text) > 0\n\nretry_check(is_ok, 200, "Success")  # True`,
    relatedTermIds: ['concept-type-hints', 'stdlib-collections-abc', 'concept-first-class-function'],
  },
  {
    id: 'fc-179',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Phạm vi biến (LEGB & Closure)',
    frontQuestion:
      'Khi nào bắt buộc phải dùng từ khóa `nonlocal` vs `global`, và tại sao đọc biến ngoài thì không cần khai báo nhưng gán lại (`count += 1`) lại ném `UnboundLocalError`?',
    frontHint: 'Gán `=` tạo biến Local mới che khuất biến ngoài trừ khi có `nonlocal` (Enclosing) hoặc `global` (Module).',
    backAnswer:
      'Theo quy tắc **LEGB**, khi một hàm có bất kỳ lệnh gán nào (`x = ...` hoặc `x += 1`), trình biên dịch AST mặc định coi `x` là biến **Local** trong toàn bộ hàm đó. Khi chạy `count += 1` (`count = count + 1`), Python tìm `count` ở Local nhưng chưa được gán giá trị nên ném **`UnboundLocalError`**. Dùng **`nonlocal count`** để chỉ định biến thuộc hàm bao ngoài (Enclosing/Closure), hoặc **`global count`** nếu biến ở cấp Module.',
    backAnalogy:
      'Nhìn đồng hồ treo ngoài phòng khách thì tự do (Read), nhưng muốn chỉnh lại kim đồng hồ đó từ trong phòng ngủ thì phải xin quyền `nonlocal` hoặc `global`.',
    codeSnippet: `def make_counter() -> callable:\n    count = 0\n    def increment() -> int:\n        nonlocal count  # Không có dòng này sẽ bị UnboundLocalError!\n        count += 1\n        return count\n    return increment\n\nc = make_counter()\nprint(c(), c())  # 1 2`,
    relatedTermIds: ['kw-nonlocal', 'kw-global', 'concept-legb-scope', 'concept-closure'],
  },
  {
    id: 'fc-180',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Hàm & Đệ quy (Recursion)',
    frontQuestion:
      'Tại sao CPython giới hạn độ sâu đệ quy (`sys.getrecursionlimit()` mặc định ~1000) và tại sao đệ quy sâu trong Python nên chuyển sang vòng lặp (Iterative)?',
    frontHint: 'CPython không hỗ trợ Tail-Call Optimization (TCO) để bảo toàn Stack Trace và chống tràn bộ nhớ C Stack.',
    backAnswer:
      'Mỗi lời gọi hàm trong CPython cấp phát một `PyFrameObject` trên Call Stack. Để ngăn chặn lỗi tràn ngăn xếp C cấp hệ điều hành (Segmentation Fault làm sập tiến trình), Python đặt giới hạn ~1000 frames (`sys.getrecursionlimit()`) và ném `RecursionError` khi vượt ngưỡng. Hơn nữa, Guido van Rossum quyết định **không hỗ trợ Tail-Call Optimization (TCO)** để giữ nguyên Traceback phục vụ debug, nên các thuật toán duyệt sâu cần viết bằng vòng lặp `while` kết hợp `list`/`deque` làm Stack tường minh.',
    backAnalogy:
      'Giới hạn 1.000 tầng thang máy ảo giúp tòa nhà báo lỗi an toàn (`RecursionError`) trước khi chạm trần bê tông thật gây sập cả tòa nhà (`Segfault`).',
    codeSnippet: `import sys\nprint(sys.getrecursionlimit())  # Mặc định: 1000\n\n# ✅ Thay đệ quy sâu bằng vòng lặp (Iterative) O(1) Call Stack:\ndef factorial_iter(n: int) -> int:\n    result = 1\n    for i in range(2, n + 1):\n        result *= i\n    return result`,
    relatedTermIds: ['stdlib-sys', 'exc-recursionerror', 'concept-call-stack'],
  },
  {
    id: 'fc-181',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Hệ thống Kiểu & OOP',
    frontQuestion:
      'Sự khác biệt giữa `isinstance(x, (int, float))` và `type(x) is int` là gì? Tại sao `isinstance(True, int)` lại trả về `True`?',
    frontHint: 'Trong lịch sử Python, `bool` được thiết kế là một lớp con (subclass) kế thừa trực tiếp từ `int`!',
    backAnswer:
      '- `type(x) is int` kiểm tra khớp chính xác lớp khởi tạo, **bỏ qua tính kế thừa** (vi phạm nguyên lý đa hình OOP).\n- `isinstance(x, (int, float))` tôn trọng chuỗi kế thừa (MRO) và chấp nhận tuple các kiểu.\n- **Bẫy kinh điển**: Trong Python, `class bool(int)` kế thừa từ `int` (với `True == 1` và `False == 0`). Do đó `isinstance(True, int)` trả về **`True`**! Nếu muốn kiểm tra số nguyên nhưng loại trừ boolean, hãy viết `isinstance(x, int) and not isinstance(x, bool)`.',
    backAnalogy:
      '`isinstance` kiểm tra "Có thuộc dòng họ Nguyễn không?" (chấp nhận cả đời con cháu), nhưng nhớ rằng `bool` là đứa con nuôi hợp pháp của dòng họ `int`.',
    codeSnippet: `print(issubclass(bool, int))                         # True!\nprint(isinstance(True, int))                         # True!\nprint(True + True)                                   # 2\n\ndef is_strict_int(x: object) -> bool:\n    return isinstance(x, int) and not isinstance(x, bool)`,
    relatedTermIds: ['builtin-isinstance', 'type-bool', 'type-int', 'concept-inheritance'],
  },
  {
    id: 'fc-182',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Lập trình Hướng đối tượng (OOP)',
    frontQuestion:
      'Điều gì xảy ra khi bạn khai báo một thuộc tính khả biến (`permissions = []`) ở cấp Class thay vì trong `__init__` (`self.permissions = []`)?',
    frontHint: 'Mọi đối tượng (instance) sẽ dùng chung một danh sách duy nhất trên toàn bộ chương trình!',
    backAnswer:
      '**Class Attribute** được khởi tạo đúng 1 lần khi câu lệnh `class` được định nghĩa và lưu trong `ClassName.__dict__`. Nếu nó là một đối tượng khả biến (`list`, `dict`, `set`), mọi instance khi gọi `self.permissions.append(...)` sẽ trực tiếp sửa đổi **cùng một đối tượng dùng chung đó**. Thuộc tính trạng thái riêng của từng đối tượng bắt buộc phải khởi tạo bên trong `__init__` qua `self.permissions = []` (hoặc dùng `field(default_factory=list)` trong `@dataclass`).',
    backAnalogy:
      'Class Attribute khả biến giống như đặt một cuốn sổ ghi chú duy nhất ở sảnh chung cư: cư dân phòng 101 viết nhật ký vào đó thì phòng 102 mở ra đọc thấy hết.',
    codeSnippet: `class User:\n    # ❌ BẪY: Class attribute khả biến dùng chung cho mọi User!\n    bad_roles: list[str] = []\n\n    def __init__(self, name: str) -> None:\n        self.name = name\n        self.roles: list[str] = []  # ✅ ĐÚNG: Instance attribute riêng biệt`,
    relatedTermIds: ['kw-class', 'dunder-init', 'concept-mutability'],
  },
  {
    id: 'fc-183',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Lập trình Hướng đối tượng (OOP)',
    frontQuestion:
      'Decorator `@property` giúp giải quyết bài toán đóng gói (Encapsulation) như thế nào mà không cần viết các hàm `get_x()` / `set_x()` kiểu Java?',
    frontHint: 'Truy cập như thuộc tính (`obj.price`) nhưng bên dưới thực thi hàm kiểm tra hợp lệ hoặc tính toán động.',
    backAnswer:
      '`@property` biến một phương thức thành một **Descriptor**, cho phép bên ngoài đọc `obj.attr` như một thuộc tính bình thường mà không cần dấu ngoặc `()`.\n- Nếu không khai báo `@attr.setter`, thuộc tính trở thành **Read-only** (gán vào sẽ ném `AttributeError`).\n- Có thể dùng cho **Computed Attributes** (thuộc tính tính toán động theo thời gian thực) hoặc gắn thêm `@attr.setter` để kiểm tra dữ liệu (validation) mà không làm vỡ API của code đang dùng `obj.attr`.',
    backAnalogy:
      'Nhìn bên ngoài vẫn là một công tắc tường bình thường (`account.balance`), nhưng bên trong đã được đấu nối ngầm qua hệ thống cảm biến kiểm duyệt tự động.',
    codeSnippet: `class Circle:\n    def __init__(self, radius: float) -> None:\n        self.radius = radius  # Đi qua @radius.setter ngay khi khởi tạo\n\n    @property\n    def radius(self) -> float:\n        return self._radius\n\n    @radius.setter\n    def radius(self, value: float) -> None:\n        if value < 0:\n            raise ValueError("Bán kính không được âm")\n        self._radius = value\n\n    @property\n    def area(self) -> float:  # Thuộc tính Read-only tính toán động\n        return 3.14159 * (self._radius ** 2)`,
    relatedTermIds: ['builtin-property', 'concept-descriptor', 'concept-encapsulation'],
  },
  {
    id: 'fc-184',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Data Model & Dunder Methods',
    frontQuestion:
      'Việc cài đặt cặp phương thức dunder `__len__` và `__getitem__` mang lại những siêu năng lực gì cho một Class tự định nghĩa?',
    frontHint: 'Biến đối tượng thành một Sequence thực thụ: hỗ trợ `len()`, indexing, slicing, vòng lặp `for`, toán tử `in` và `reversed()`.',
    backAnswer:
      'Theo **Python Data Model**, chỉ cần một class cài đặt `__len__(self)` và `__getitem__(self, index)`:\n1. Gọi được `len(obj)`.\n2. Truy cập chỉ số `obj[0]`, chỉ số âm `obj[-1]`, và cắt lát `obj[1:3]`.\n3. Tự động trở thành **Iterable** (dùng được trong vòng lặp `for`, unpacking `a, b = obj`, toán tử `in`, `list(obj)`, và cả `reversed(obj)`) ngay cả khi chưa viết `__iter__`!',
    backAnalogy:
      'Chỉ cần lắp 2 khớp nối chuẩn LEGO (`__len__` và `__getitem__`), khối gạch tự chế của bạn lập tức gắn vừa khít với toàn bộ hệ thống đường ray có sẵn của Python.',
    codeSnippet: `class Deck:\n    def __init__(self, cards: list[str]) -> None:\n        self._cards = cards\n\n    def __len__(self) -> int:\n        return len(self._cards)\n\n    def __getitem__(self, index: int | slice) -> str | list[str]:\n        return self._cards[index]\n\ndeck = Deck(["A♠", "K♥", "Q♦"])\nprint(len(deck), deck[-1], "K♥" in deck)  # 3 'Q♦' True`,
    relatedTermIds: ['dunder-len', 'dunder-getitem', 'concept-duck-typing'],
  },
  {
    id: 'fc-185',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Data Model & Dunder Methods',
    frontQuestion:
      'Tại sao khi bạn tự định nghĩa `__eq__` trên một Class thì đối tượng của Class đó lập tức không thể đưa vào `set` hoặc làm key của `dict` (`TypeError: unhashable type`)?',
    frontHint: 'Luật bất biến của Hash Table: nếu `a == b` thì bắt buộc `hash(a) == hash(b)`.',
    backAnswer:
      'Mặc định mọi class tự tạo đều kế thừa `__hash__` và `__eq__` theo địa chỉ bộ nhớ (`id(self)`). Nhưng khi bạn ghi đè `__eq__` để so sánh theo giá trị thuộc tính, Python sẽ **tự động gán `__hash__ = None`** để bảo vệ tính toàn vẹn của bảng băm (vì nếu đối tượng khả biến thay đổi thuộc tính sau khi vào `set`/`dict`, mã băm sẽ lệch). Muốn đối tượng vừa so sánh theo giá trị vừa Hashable, hãy đảm bảo các thuộc tính là **bất biến** và cài đặt `__hash__` trả về `hash((self.a, self.b))` (hoặc dùng `@dataclass(frozen=True)`).',
    backAnalogy:
      'Khi bạn đổi quy tắc nhận diện công dân từ "Mã vân tay cố định" sang "Màu áo đang mặc" (`__eq__`), ngân hàng (`dict`) sẽ từ chối mở két sắt cho đến khi bạn cam kết không bao giờ thay áo (`__hash__`).',
    codeSnippet: `class Point:\n    def __init__(self, x: int, y: int) -> None:\n        self.x, self.y = x, y\n\n    def __eq__(self, other: object) -> bool:\n        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)\n\n    def __hash__(self) -> int:\n        return hash((self.x, self.y))  # Kết hợp tuple các thuộc tính bất biến`,
    relatedTermIds: ['dunder-eq', 'dunder-hash', 'concept-hashable'],
  },
  {
    id: 'fc-186',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Context Manager & Ngoại lệ',
    frontQuestion:
      'Trong giao thức Context Manager (`with`), phương thức `__exit__(self, exc_type, exc_val, exc_tb)` nhận các đối số gì và giá trị trả về `True` vs `False`/`None` của nó quyết định điều gì?',
    frontHint: 'Nếu trả về `True`, ngoại lệ bên trong khối `with` sẽ bị nuốt (suppressed)!',
    backAnswer:
      '- `__enter__(self)` chạy khi vào khối `with`, giá trị trả về của nó được gán cho biến sau từ khóa `as`.\n- `__exit__(self, exc_type, exc_val, exc_tb)` **luôn luôn được gọi** khi thoát khối `with`. Nếu không có lỗi, cả 3 tham số đều là `None`. Nếu có lỗi xảy ra trong khối `with`, 3 tham số chứa kiểu lỗi, đối tượng lỗi và traceback:\n  + Trả về **`False` hoặc `None`** (mặc định): Python dọn dẹp xong sẽ **ném tiếp (re-raise)** ngoại lệ đó ra ngoài.\n  + Trả về **`True`**: Python **nuốt (suppress)** ngoại lệ đó và chạy tiếp dòng code sau khối `with`.',
    backAnalogy:
      '`__exit__` là đội ngũ xử lý sự cố tại cửa thoát hiểm: trả về `False` là dập lửa tại phòng rồi vẫn bấm chuông báo động toàn tòa nhà; trả về `True` là tự xử lý êm thấm và tắt luôn báo động.',
    codeSnippet: `class SuppressZeroDiv:\n    def __enter__(self):\n        return self\n\n    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:\n        # Chỉ nuốt lỗi ZeroDivisionError, các lỗi khác vẫn ném ra ngoài\n        return exc_type is ZeroDivisionError\n\nwith SuppressZeroDiv():\n    x = 1 / 0  # Không bị crash vì __exit__ trả về True!`,
    relatedTermIds: ['dunder-enter-exit', 'kw-with', 'stdlib-contextlib'],
  },
  {
    id: 'fc-187',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Xử lý Ngoại lệ (Exceptions)',
    frontQuestion:
      'Sự khác biệt giữa `raise ServiceError("Lỗi") from err` và `raise ServiceError("Lỗi") from None` trong Exception Chaining là gì?',
    frontHint: 'Giữ lại nguyên nhân gốc rễ (`__cause__`) để debug vs Ẩn hoàn toàn traceback nội bộ nhạy cảm.',
    backAnswer:
      '- `raise NewError(...) from err` (**Explicit Exception Chaining**): Gắn ngoại lệ gốc `err` vào thuộc tính `__cause__` của ngoại lệ mới, hiển thị rõ dòng chữ *"The above exception was the direct cause of the following exception"* trong Traceback — cực kỳ chuẩn mực khi bọc lỗi tầng hạ tầng (DB/Network) thành lỗi tầng Domain.\n- `raise NewError(...) from None`: Đặt `__suppress_context__ = True`, **ẩn hoàn toàn** traceback của lỗi gốc phía trước để thông báo lỗi gọn gàng hoặc tránh lộ chi tiết nội bộ.',
    backAnalogy:
      '`from err` là báo cáo tai nạn có đính kèm biên bản hiện trường gốc; `from None` là chỉ gửi thông báo tóm tắt lịch sự cho khách hàng mà giấu biên bản kỹ thuật nội bộ.',
    codeSnippet: `class ConfigError(Exception):\n    pass\n\ndef load_port(raw: str) -> int:\n    try:\n        return int(raw)\n    except ValueError as err:\n        # Giữ nguyên dấu vết lỗi gốc trong __cause__\n        raise ConfigError(f"Port không hợp lệ: {raw!r}") from err`,
    relatedTermIds: ['kw-raise', 'concept-exception-chaining', 'kw-try-except'],
  },
  {
    id: 'fc-188',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Lập trình Hướng đối tượng (OOP)',
    frontQuestion:
      'Phân biệt `@classmethod` và `@staticmethod`: Tại sao dùng `@classmethod` để viết **Alternative Constructor** (Factory Method) lại ưu việt hơn `@staticmethod`?',
    frontHint: 'Tham số đầu tiên `cls` tự động nhận đúng lớp con (Subclass) khi kế thừa!',
    backAnswer:
      '- `@classmethod` nhận tham số đầu tiên là **`cls`** (chính đối tượng Class đang gọi). Khi viết hàm khởi tạo thay thế như `from_json(cls, data)` và gọi `return cls(...)`, nếu một lớp con `AdminUser(User)` gọi `AdminUser.from_json(data)`, `cls` sẽ tự động là `AdminUser` và trả về đúng instance của `AdminUser`.\n- `@staticmethod` không nhận `self` lẫn `cls`, chỉ là một hàm tiện ích bình thường đặt chung namespace với class để gom nhóm logic.',
    backAnalogy:
      '`@classmethod` là khuôn đúc thông minh tự nhận diện thương hiệu chi nhánh (`cls`) để đóng dấu đúng logo chi nhánh đó; `@staticmethod` chỉ là chiếc máy tính bỏ túi đặt trên bàn của xưởng.',
    codeSnippet: `class Timestamp:\n    def __init__(self, seconds: int) -> None:\n        self.seconds = seconds\n\n    @classmethod\n    def from_minutes(cls, minutes: int) -> "Timestamp":\n        return cls(minutes * 60)  # Tự động khởi tạo đúng subclass nếu được kế thừa!\n\n    @staticmethod\n    def is_valid(seconds: int) -> bool:\n        return seconds >= 0`,
    relatedTermIds: ['builtin-classmethod', 'builtin-staticmethod', 'concept-inheritance'],
  },
  {
    id: 'fc-189',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Lập trình Hướng đối tượng (MRO)',
    frontQuestion:
      'Hàm `super()` thực chất tìm kiếm phương thức tiếp theo dựa trên cơ chế nào và thuật toán **MRO (C3 Linearization)** giải quyết bài toán gì?',
    frontHint: '`super()` không đơn thuần là gọi lớp cha trực tiếp mà đi theo danh sách `ClassName.__mro__`!',
    backAnswer:
      'Nhiều người lầm tưởng `super()` chỉ gọi lớp cha trực tiếp, nhưng thực chất `super()` gọi **lớp đứng kế tiếp trong chuỗi MRO (Method Resolution Order)** của đối tượng `self` hiện tại (`type(self).__mro__`). Thuật toán **C3 Linearization** biến đồ thị kế thừa phức tạp (như bài toán Kim cương - Diamond Problem) thành một danh sách tuyến tính duy nhất, đảm bảo: (1) Lớp con luôn được xét trước lớp cha, (2) Giữ đúng thứ tự khai báo từ trái sang phải, và (3) Mỗi lớp chỉ được gọi đúng 1 lần.',
    backAnalogy:
      'MRO giống như danh sách chuyền bóng đã xếp sẵn thứ tự hợp lệ cho cả đội: `super()` có nghĩa là "chuyền cho người đứng kế tiếp trong danh sách MRO".',
    codeSnippet: `class A:\n    def ping(self) -> str: return "A"\nclass B(A):\n    def ping(self) -> str: return "B->" + super().ping()\nclass C(A):\n    def ping(self) -> str: return "C->" + super().ping()\nclass D(B, C):\n    pass\n\n# MRO của D: [D, B, C, A, object]\nprint(D().ping())  # "B->C->A" (B gọi super() sẽ sang C chứ không nhảy thẳng lên A!)`,
    relatedTermIds: ['builtin-super', 'concept-mro', 'concept-inheritance'],
  },
  {
    id: 'fc-190',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Data Model & Dunder Methods',
    frontQuestion:
      'Decorator `@functools.total_ordering` giúp tiết kiệm công sức cài đặt các phương thức so sánh (`<`, `<=`, `>`, `>=`) trên Class như thế nào?',
    frontHint: 'Chỉ cần tự viết `__eq__` và 1 phương thức so sánh (ví dụ `__lt__`), Python sẽ tự sinh ra 3 phương thức còn lại.',
    backAnswer:
      'Để một class hỗ trợ đầy đủ 6 phép so sánh (`==`, `!=`, `<`, `<=`, `>`, `>=`), thông thường bạn phải viết tới 5-6 dunder methods. Khi gắn `@functools.total_ordering` lên class, bạn **chỉ cần cài đặt `__eq__` và đúng 1 trong 4 phương thức** (`__lt__`, `__le__`, `__gt__`, hoặc `__ge__`), decorator sẽ tự động suy diễn và gắn đầy đủ các phương thức so sánh còn lại vào class.',
    backAnalogy:
      'Chỉ cần bạn định nghĩa thế nào là "Bằng nhau" (`==`) và "Nhỏ hơn" (`<`), `@total_ordering` sẽ tự suy luận ra "Lớn hơn", "Nhỏ hơn hoặc bằng", và "Lớn hơn hoặc bằng".',
    codeSnippet: `from functools import total_ordering\n\n@total_ordering\nclass Version:\n    def __init__(self, major: int, minor: int) -> None:\n        self.major, self.minor = major, minor\n\n    def __eq__(self, other: object) -> bool:\n        if not isinstance(other, Version): return NotImplemented\n        return (self.major, self.minor) == (other.major, other.minor)\n\n    def __lt__(self, other: "Version") -> bool:\n        return (self.major, self.minor) < (other.major, other.minor)\n\nprint(Version(3, 12) >= Version(3, 11))  # True (Tự động có >=, >, <=)`,
    relatedTermIds: ['stdlib-functools', 'dunder-eq', 'concept-data-model'],
  },

  // ============================================================================
  // PHẦN 3: STANDARD LIBRARY & CORE ECOSYSTEM MASTERY (25 CARDS: fc-191 -> fc-215)
  // ============================================================================
  {
    id: 'fc-191',
    stageId: 'stage-2',
    level: 'fundamental',
    category: 'Thư viện Chuẩn (pathlib)',
    frontQuestion:
      'Trong `pathlib.Path`, toán tử `/`, phương thức `.resolve()`, và thuộc tính `.parent` / `.parents` hoạt động như thế nào?',
    frontHint: 'Xử lý đường dẫn hướng đối tượng đa nền tảng thay thế hoàn toàn `os.path.join` và `os.path.abspath`.',
    backAnswer:
      '- Toán tử `/` (`__truediv__`) nối các đoạn đường dẫn thông minh, tự động chọn dấu `/` (POSIX/macOS/Linux) hoặc `\\` (Windows).\n- `.resolve()` biến đường dẫn tương đối thành **đường dẫn tuyệt đối chuẩn hóa**, đồng thời giải tham chiếu mọi Symbolic Links và loại bỏ `..` / `.`.\n- `.parent` trả về thư mục cha trực tiếp; `.parents` trả về một sequence bất biến chứa toàn bộ các cấp thư mục tổ tiên (`p.parents[0]` là cha, `p.parents[1]` là ông...).',
    backAnalogy:
      '`Path` là định vị GPS thông minh: `.parent` là lùi ra cấp Quận, `.parents` là danh sách từ Quận -> Thành phố -> Quốc gia, còn `.resolve()` là tọa độ vệ tinh chính xác tuyệt đối.',
    codeSnippet: `from pathlib import Path\n\n# Đi lên 2 cấp thư mục từ file hiện tại rồi nối vào configs/app.toml\nbase_dir = Path(__file__).resolve().parent.parent\nconfig_path = base_dir / "configs" / "app.toml"`,
    relatedTermIds: ['stdlib-pathlib', 'stdlib-os'],
  },
  {
    id: 'fc-192',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Thư viện Chuẩn (pathlib)',
    frontQuestion:
      'Cách dùng `.glob()` vs `.rglob()`, `.with_suffix()`, và `.unlink(missing_ok=True)` trên đối tượng `pathlib.Path`?',
    frontHint: 'Tìm kiếm nông vs đệ quy toàn bộ cây thư mục, đổi đuôi file an toàn, và xóa file không sợ `FileNotFoundError`.',
    backAnswer:
      '- `p.glob("*.py")` trả về generator các file khớp mẫu ngay trong thư mục `p`; còn `p.rglob("*.py")` (hoặc `p.glob("**/*.py")`) quét **đệ quy toàn bộ các thư mục con**.\n- `p.with_suffix(".json")` trả về đối tượng `Path` mới đã đổi phần mở rộng (ví dụ `data.csv` -> `data.json`).\n- `p.unlink(missing_ok=True)` xóa file tại đường dẫn `p`, và nhờ `missing_ok=True` (Python 3.8+) sẽ không ném `FileNotFoundError` nếu file đã bị xóa trước đó.',
    backAnalogy:
      '`glob` là tìm đồ trên mặt bàn; `rglob` là lục tìm trong mọi ngăn kéo lớn nhỏ; `with_suffix` là thay nhãn đuôi tên file.',
    codeSnippet: `from pathlib import Path\n\nsrc_dir = Path("src")\nfor py_file in src_dir.rglob("*.py"):\n    bak_file = py_file.with_suffix(".bak")\n    bak_file.unlink(missing_ok=True)  # Xóa file backup nếu có, không lỗi nếu chưa có`,
    relatedTermIds: ['stdlib-pathlib', 'concept-generator'],
  },
  {
    id: 'fc-193',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Thư viện Chuẩn (collections)',
    frontQuestion:
      '`collections.Counter` hỗ trợ những phương thức và phép toán số học tập hợp (`+`, `-`, `&`, `|`) mạnh mẽ nào?',
    frontHint: 'Đếm tần suất $O(N)$, lấy Top-K với `.most_common(k)`, và cộng/trừ số lượng phần tử như một Multiset.',
    backAnswer:
      '`Counter` là một subclass của `dict` chuyên đếm tần suất các phần tử hashable (truy cập key chưa có trả về `0` thay vì `KeyError`).\n- `.most_common(k)`: Trả về `k` cặp `(item, count)` có tần suất cao nhất.\n- `.total()` (Python 3.10+): Tổng tất cả các số đếm.\n- **Phép toán Multiset**: `c1 + c2` cộng dồn số lượng; `c1 - c2` trừ số lượng và **tự động loại bỏ các key có số đếm $\\le 0$**; `c1 & c2` lấy `min`, `c1 | c2` lấy `max`.',
    backAnalogy:
      '`Counter` là máy kiểm kho tự động: cộng 2 kho (`c1 + c2`) hay trừ đơn hàng xuất kho (`c1 - c2`) đều ra ngay tồn kho thực tế dương.',
    codeSnippet: `from collections import Counter\n\nstock = Counter(apple=10, banana=5)\nsold = Counter(apple=4, banana=5, orange=2)\n\nremaining = stock - sold           # Counter({'apple': 6}) (banana=0 tự động bị lọc bỏ!)\ntop_item = stock.most_common(1)    # [('apple', 10)]`,
    relatedTermIds: ['stdlib-collections', 'type-dict'],
  },
  {
    id: 'fc-194',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Thư viện Chuẩn (collections)',
    frontQuestion:
      '`collections.defaultdict(default_factory)` hoạt động như thế nào và khác gì với `dict.get(key, default)`?',
    frontHint: 'Tham số truyền vào là một hàm tạo (như `list`, `int`, `set`) được gọi tự động trong `__missing__` khi key chưa tồn tại.',
    backAnswer:
      '`defaultdict` nhận đối số đầu tiên là một **callable không tham số** (`default_factory` như `list`, `int`, `set`). Khi bạn truy cập `d[key]` mà `key` chưa có trong từ điển, phương thức `__missing__(key)` sẽ tự động gọi `default_factory()` để **tạo một đối tượng mới, chèn luôn vào `d[key]`** rồi trả về đối tượng đó. Nhờ vậy bạn có thể viết thẳng `groups[dept].append(user)` chỉ trong 1 dòng mà không cần kiểm tra `if dept not in groups`.',
    backAnalogy:
      '`dict.get()` là hỏi lễ tân xem có hòm thư chưa; `defaultdict(list)` là lễ tân thấy chưa có hòm thư liền đóng ngay 1 hòm thư mới gắn tên bạn lên tường.',
    codeSnippet: `from collections import defaultdict\n\n# Gom nhóm nhân viên theo phòng ban chỉ với 1 dòng trong vòng lặp\nby_dept: defaultdict[str, list[str]] = defaultdict(list)\nfor dept, name in [("Eng", "An"), ("HR", "Bình"), ("Eng", "Chi")]:\n    by_dept[dept].append(name)\n# {'Eng': ['An', 'Chi'], 'HR': ['Bình']}`,
    relatedTermIds: ['stdlib-collections', 'type-dict'],
  },
  {
    id: 'fc-195',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Thư viện Chuẩn (collections)',
    frontQuestion:
      'Tại sao phải dùng `collections.deque` thay cho `list` khi làm hàng đợi FIFO, và tham số `maxlen=N` hữu ích như thế nào?',
    frontHint: '`list.pop(0)` tốn $O(N)$ dịch chuyển bộ nhớ, còn `deque.popleft()` chỉ tốn $O(1)$! `maxlen=N` tạo Sliding Window tự động.',
    backAnswer:
      '- `list` được cài đặt bằng mảng động liên tiếp nên `list.pop(0)` hoặc `list.insert(0, x)` phải dịch chuyển toàn bộ $N-1$ phần tử còn lại ($O(N)$). `deque` (Double-Ended Queue) cài đặt bằng danh sách liên kết kép các khối bộ nhớ nên `.appendleft()` và `.popleft()` đều đạt tốc độ **$O(1)$ tuyệt đối**.\n- Khi khởi tạo `deque(maxlen=N)`, nó trở thành **Ring Buffer / Sliding Window** cố định kích thước: khi đã đầy $N$ phần tử, thêm phần tử mới vào một đầu sẽ tự động đẩy phần tử cũ nhất ở đầu đối diện ra ngoài.',
    backAnalogy:
      '`deque(maxlen=3)` giống như ống đựng 3 quả bóng tennis mở 2 đầu: nhét quả thứ 4 vào đầu trên thì quả cũ nhất ở đáy tự rơi ra ngoài.',
    codeSnippet: `from collections import deque\n\n# Giữ lại đúng 3 dòng log gần nhất (Sliding Window O(1))\nrecent_logs: deque[str] = deque(maxlen=3)\nfor i in range(1, 6):\n    recent_logs.append(f"Log #{i}")\n\nprint(list(recent_logs))  # ['Log #3', 'Log #4', 'Log #5']\nfirst = recent_logs.popleft()  # 'Log #3' - O(1)`,
    relatedTermIds: ['stdlib-collections', 'concept-time-complexity', 'type-list'],
  },
  {
    id: 'fc-196',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Thư viện Chuẩn (collections)',
    frontQuestion:
      '`collections.ChainMap` giải quyết bài toán gộp cấu hình phân lớp (Layered Configurations) như thế nào so với `{**d1, **d2}`?',
    frontHint: 'Không sao chép dữ liệu ($O(1)$ tạo view), tìm kiếm từ trái sang phải theo độ ưu tiên và phản ánh thay đổi động.',
    backAnswer:
      '`ChainMap(*maps)` kết nối nhiều `dict` thành một khung nhìn (view) duy nhất chỉ trong **$O(1)$ thời gian và bộ nhớ** mà không cần tạo `dict` mới hay copy dữ liệu như `d1 | d2`. Khi tra cứu `cm[key]`, nó tìm lần lượt từ dict đầu tiên (ưu tiên cao nhất) đến dict cuối cùng (mặc định). Mọi thao tác ghi/xóa (`cm[k] = v`) mặc định chỉ tác động lên dict đầu tiên, và nếu các dict bên dưới thay đổi, `ChainMap` thấy ngay lập tức.',
    backAnalogy:
      'Giống như chồng các tấm kính trong suốt lên nhau: nhìn từ trên xuống sẽ thấy nét vẽ ở tấm kính trên cùng trước (CLI args), chỗ nào trống mới nhìn xuyên xuống tấm giữa (Env vars) và tấm đáy (Defaults).',
    codeSnippet: `from collections import ChainMap\n\ndefaults = {"host": "localhost", "port": 8000, "debug": False}\nenv_vars = {"port": 9000}\ncli_args = {"debug": True}\n\n# Ưu tiên: CLI -> ENV -> Defaults (Không tốn RAM copy dict)\nconfig = ChainMap(cli_args, env_vars, defaults)\nprint(config["host"], config["port"], config["debug"])  # localhost 9000 True`,
    relatedTermIds: ['stdlib-collections', 'type-dict'],
  },
  {
    id: 'fc-197',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Thư viện Chuẩn (itertools)',
    frontQuestion:
      'Làm sao để cắt lát một Generator/Iterator không hỗ trợ `[:]` và chia dữ liệu lớn thành từng lô (chunk) kích thước $N$ bằng `itertools.islice` và `itertools.batched`?',
    frontHint: 'Generator không có `__getitem__` nên dùng `islice`; Python 3.12+ bổ sung `itertools.batched(iterable, n)`.',
    backAnswer:
      '- Generator/Iterator không hỗ trợ cắt lát `gen[10:20]` (sẽ ném `TypeError`). `itertools.islice(iterable, start, stop, step)` cho phép cắt lát **lười biếng (lazy)** bất kỳ iterator nào với $O(1)$ bộ nhớ.\n- Từ **Python 3.12+**, `itertools.batched(iterable, n)` chia bất kỳ luồng dữ liệu nào thành các `tuple` có độ dài tối đa `n` (lô cuối có thể ngắn hơn `n`), cực kỳ hữu ích khi gọi Batch API hoặc Bulk Insert vào Database.',
    backAnalogy:
      '`islice` là lấy từ sản phẩm thứ 10 đến 20 trên băng chuyền đang chạy; `batched(stream, 100)` là đóng gói cứ đủ 100 sản phẩm vào 1 thùng carton để xuất đi.',
    codeSnippet: `from itertools import batched, islice\n\n# 1. Lấy 3 dòng từ dòng số 5 đến 7 của một generator lớn\ngen = (x * 10 for x in range(1000))\npage = list(islice(gen, 5, 8))          # [50, 60, 70]\n\n# 2. Chia danh sách thành từng lô 3 phần tử (Python 3.12+)\nchunks = list(batched(range(8), 3))     # [(0, 1, 2), (3, 4, 5), (6, 7)]`,
    relatedTermIds: ['stdlib-itertools', 'concept-generator', 'concept-iterator'],
  },
  {
    id: 'fc-198',
    stageId: 'stage-2',
    level: 'advanced',
    category: 'Thư viện Chuẩn (itertools)',
    frontQuestion:
      'Tại sao khi dùng `itertools.groupby(data, key=...)`, bạn **bắt buộc phải sắp xếp (`sorted`) dữ liệu trước** theo đúng hàm `key` đó?',
    frontHint: '`groupby` của Python hoạt động giống lệnh `uniq` của Unix: chỉ gom các phần tử **liền kề nhau** có cùng key!',
    backAnswer:
      'Khác với `GROUP BY` trong SQL (vốn gom toàn bộ bảng bằng Hash/Sort), `itertools.groupby(iterable, key)` hoạt động trên luồng (stream) chỉ với $O(1)$ bộ nhớ: nó chỉ gộp các phần tử **đứng liền kề nhau** có cùng giá trị `key` thành một nhóm, và hễ gặp giá trị `key` mới là nó đóng nhóm cũ lại. Nếu dữ liệu chưa được `sorted(data, key=key)` trước, cùng một `key` nằm rải rác sẽ bị tách thành nhiều nhóm trùng lặp!',
    backAnalogy:
      '`groupby` như người kiểm vé đứng ở cửa: hễ thấy một tốp khách mặc áo cùng màu đi liền nhau thì xếp vào 1 bàn; nếu người mặc áo đỏ đi sau người áo xanh thì sẽ bị xếp sang bàn mới.',
    codeSnippet: `from itertools import groupby\n\nraw = [("A", 1), ("B", 2), ("A", 3)]\n# ✅ BẮT BUỘC sort theo cùng key trước khi groupby!\nsorted_data = sorted(raw, key=lambda x: x[0])\n\ngroups = {k: [v for _, v in grp] for k, grp in groupby(sorted_data, key=lambda x: x[0])}\n# {'A': [1, 3], 'B': [2]}`,
    relatedTermIds: ['stdlib-itertools', 'builtin-sorted', 'concept-iterator'],
  },
  {
    id: 'fc-199',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Thư viện Chuẩn (itertools)',
    frontQuestion:
      'Khi nào nên dùng `itertools.chain.from_iterable()` và `itertools.product()` trong xử lý dữ liệu?',
    frontHint: 'Làm phẳng (flatten) một chuỗi các iterables lười biếng vs Tích Đề-các thay thế các vòng lặp `for` lồng nhau.',
    backAnswer:
      '- `itertools.chain.from_iterable(iterables)`: Nối phẳng một chuỗi lồng nhau (có thể vô hạn hoặc cực lớn) thành một luồng 1 chiều duy nhất với **$O(1)$ bộ nhớ**, tránh chi phí khởi tạo `list` trung gian.\n- `itertools.product(*iterables, repeat=1)`: Tính tích Đề-các (Cartesian Product) sinh ra mọi tổ hợp `(x, y, z...)`, giúp thay thế 2-3 vòng lặp `for` lồng nhau sâu bằng một vòng lặp phẳng duy nhất.',
    backAnalogy:
      '`chain.from_iterable` là nối các cuộn phim nhỏ thành một suất chiếu liên tục; `product` là bảng phối đồ kết hợp mọi mẫu Áo với mọi mẫu Quần và Giày.',
    codeSnippet: `from itertools import chain, product\n\n# 1. Làm phẳng danh sách 2D hoàn toàn Lazy O(1) RAM\n nested = [[1, 2], [3, 4, 5], [6]]\nflat_iter = chain.from_iterable(nested)  # 1, 2, 3, 4, 5, 6\n\n# 2. Thay thế 2 vòng lặp for lồng nhau bằng product\nfor size, color in product(["S", "M"], ["Đỏ", "Đen"]):\n    print(f"{size}-{color}")`,
    relatedTermIds: ['stdlib-itertools', 'concept-iterator'],
  },
  {
    id: 'fc-200',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Thư viện Chuẩn (functools)',
    frontQuestion:
      '`@functools.lru_cache(maxsize=128)` và `@functools.cache` hoạt động như thế nào, và điều kiện bắt buộc đối với các đối số của hàm được gắn decorator này là gì?',
    frontHint: 'Lưu kết quả vào một `dict` nội bộ theo đối số đầu vào -> mọi đối số bắt buộc phải Hashable!',
    backAnswer:
      '`@lru_cache` thực hiện **Memoization**: lưu kết quả trả về của hàm vào bộ nhớ đệm dựa trên bộ đối số truyền vào. Khi đầy `maxsize`, nó tự động xóa mục ít được dùng gần đây nhất (**Least Recently Used**). `@cache` (Python 3.9+) tương đương `lru_cache(maxsize=None)` (không giới hạn). **Điều kiện bắt buộc**: Mọi đối số truyền vào hàm phải **Hashable** (không truyền trực tiếp `list`, `dict`, `set`), và hàm phải là hàm thuần khiết (pure function). Dùng `func.cache_info()` để xem tỷ lệ `hits`/`misses`.',
    backAnalogy:
      'Giống như bảng tra cứu kết quả tính sẵn đặt cạnh bàn thu ngân: khách hỏi lại đúng phép tính cũ thì đọc ngay đáp án trên bảng trong $O(1)$ mà không cần bấm máy lại.',
    codeSnippet: `from functools import lru_cache\n\n@lru_cache(maxsize=256)\ndef fib(n: int) -> int:\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(50))            # Chạy tức thời O(N) thay vì O(2^N)!\nprint(fib.cache_info())   # CacheInfo(hits=48, misses=51, maxsize=256, currsize=51)`,
    relatedTermIds: ['stdlib-functools', 'concept-decorator', 'concept-hashable'],
  },
  {
    id: 'fc-201',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Thư viện Chuẩn (functools)',
    frontQuestion:
      '`functools.partial(func, *args, **kwargs)` dùng để làm gì và tại sao nó thường rõ ràng hơn việc dùng `lambda` trong nhiều trường hợp?',
    frontHint: 'Đóng băng (freeze) trước một số đối số của hàm để tạo ra một hàm mới có ít tham số hơn.',
    backAnswer:
      '`functools.partial` áp dụng kỹ thuật **Partial Function Application**: cố định trước một số đối số vị trí hoặc từ khóa của hàm gốc và trả về một đối tượng callable mới chỉ nhận các đối số còn lại. So với `lambda`, `partial` giữ nguyên tham chiếu đối tượng (`p.func`, `p.args`, `p.keywords`), dễ introspect khi debug, có thể `pickle` để chạy đa tiến trình (`multiprocessing`), và không gặp bẫy Late Binding trong vòng lặp.',
    backAnalogy:
      'Nếu hàm gốc là máy pha cà phê đa năng cần chọn (Loại hạt, Lượng đường, Lượng sữa), thì `partial` là cài sẵn nút bấm "Bạc xỉu" đã khóa cứng công thức đường và sữa.',
    codeSnippet: `from functools import partial\n\n# Tạo hàm chuyển chuỗi nhị phân sang số nguyên từ hàm int(x, base=10)\nbinary_to_int = partial(int, base=2)\nhex_to_int = partial(int, base=16)\n\nprint(binary_to_int("1010"))  # 10\nprint(hex_to_int("ff"))       # 255`,
    relatedTermIds: ['stdlib-functools', 'concept-first-class-function', 'kw-lambda'],
  },
  {
    id: 'fc-202',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Thư viện Chuẩn (functools)',
    frontQuestion:
      '`@functools.singledispatch` hoạt động như thế nào để thay thế chuỗi `if isinstance(...) elif isinstance(...)` dài dòng?',
    frontHint: 'Đa hình hàm (Single-Dispatch Generic Function) tự động chọn bản cài đặt dựa trên kiểu của đối số đầu tiên.',
    backAnswer:
      '`@singledispatch` biến một hàm thông thường thành một **Generic Function** (hàm đa hình đơn phân phối). Hàm gốc đóng vai trò xử lý mặc định (fallback), còn các hàm chuyên biệt cho từng kiểu dữ liệu cụ thể được đăng ký qua `@func_name.register` (tự động đọc Type Hint của đối số đầu tiên). Điều này tuân thủ nguyên lý **Open/Closed Principle**: bạn có thể mở rộng hỗ trợ kiểu dữ liệu mới ở bất kỳ module nào mà không cần sửa đổi hàm gốc.',
    backAnalogy:
      'Giống như quầy phân loại bưu phẩm tự động: nhìn vào nhãn kiểu của kiện hàng đầu tiên (`int`, `list`, `Decimal`) để chuyển thẳng đến đúng chuyên viên xử lý mà không cần bảng hỏi `if-else`.',
    codeSnippet: `from functools import singledispatch\nfrom datetime import date\n\n@singledispatch\ndef serialize(val: object) -> str:\n    return str(val)\n\n@serialize.register\ndef _(val: date) -> str:\n    return val.isoformat()\n\n@serialize.register\ndef _(val: list) -> str:\n    return ", ".join(serialize(x) for x in val)\n\nprint(serialize([date(2026, 11, 8), 42]))  # "2026-11-08, 42"`,
    relatedTermIds: ['stdlib-functools', 'concept-type-hints', 'builtin-isinstance'],
  },
  {
    id: 'fc-203',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Thư viện Chuẩn (datetime & zoneinfo)',
    frontQuestion:
      'Tại sao `datetime.now()` và `datetime.utcnow()` (không có tham số) bị coi là nguy hiểm, và cách chuẩn trong Python hiện đại để làm việc với múi giờ bằng `timezone.utc` và `zoneinfo.ZoneInfo` là gì?',
    frontHint: 'Naive datetime (mù múi giờ) vs Timezone-aware datetime (`tzinfo` rõ ràng).',
    backAnswer:
      '`datetime.now()` trả về **Naive datetime** (`tzinfo=None`), phụ thuộc ngầm vào giờ máy chủ cục bộ; còn `datetime.utcnow()` đã bị **deprecated từ Python 3.12** vì trả về giờ UTC nhưng lại mang `tzinfo=None` dễ bị hiểu nhầm là giờ local. Quy tắc vàng trong hệ thống thực tế:\n1. Luôn lấy và lưu trữ giờ chuẩn **Timezone-aware UTC**: `datetime.now(timezone.utc)`.\n2. Khi hiển thị cho người dùng, chuyển đổi sang múi giờ IANA chuẩn bằng module dựng sẵn `zoneinfo` (Python 3.9+): `.astimezone(ZoneInfo("Asia/Ho_Chi_Minh"))`.',
    backAnalogy:
      'Naive datetime như hẹn "Gặp lúc 9h nhé" mà không nói 9h Hà Nội hay 9h New York; Aware datetime luôn đóng dấu rõ múi giờ chuẩn quốc tế.',
    codeSnippet: `from datetime import datetime, timezone\nfrom zoneinfo import ZoneInfo\n\n# 1. Luôn khởi tạo Timezone-aware ở chuẩn UTC\nnow_utc = datetime.now(timezone.utc)\n\n# 2. Chuyển sang giờ Việt Nam (UTC+7)\nvn_tz = ZoneInfo("Asia/Ho_Chi_Minh")\nnow_vn = now_utc.astimezone(vn_tz)\nprint(now_vn.isoformat())  # 2026-11-08T14:30:00+07:00`,
    relatedTermIds: ['stdlib-datetime', 'stdlib-zoneinfo'],
  },
  {
    id: 'fc-204',
    stageId: 'stage-2',
    level: 'fundamental',
    category: 'Thư viện Chuẩn (datetime)',
    frontQuestion:
      'Cách thực hiện các phép toán cộng/trừ thời gian với `datetime.timedelta` và chuyển đổi hai chiều chuẩn ISO 8601 (`.isoformat()` / `datetime.fromisoformat()`)?',
    frontHint: 'Hiệu của hai đối tượng `datetime` trả về một `timedelta`; Python 3.11+ `fromisoformat` đọc được cả hậu tố `"Z"`.',
    backAnswer:
      '- `timedelta(days=..., hours=..., minutes=..., seconds=...)` biểu diễn một khoảng thời gian (duration). Bạn có thể cộng/trừ `datetime + timedelta` để tính ngày hết hạn, hoặc lấy `dt2 - dt1` để nhận về một `timedelta` (dùng `.total_seconds()` để lấy tổng số giây thực tế).\n- `.isoformat()` xuất chuỗi chuẩn quốc tế ISO 8601 (`"2026-11-08T07:30:00+00:00"`), và `datetime.fromisoformat(s)` đọc ngược chuỗi đó thành `datetime` (từ Python 3.11+ hỗ trợ trực tiếp cả ký hiệu `"Z"` ở cuối).',
    backAnalogy:
      '`datetime` là một mốc tọa độ trên dòng thời gian, còn `timedelta` là cây thước đo khoảng cách giữa hai mốc đó.',
    codeSnippet: `from datetime import datetime, timedelta, timezone\n\nissued_at = datetime.fromisoformat("2026-11-08T08:00:00Z")\nexpires_at = issued_at + timedelta(hours=2, minutes=30)\n\nremaining = expires_at - issued_at\nprint(remaining.total_seconds())  # 9000.0 giây`,
    relatedTermIds: ['stdlib-datetime'],
  },
  {
    id: 'fc-205',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Định dạng Dữ liệu (json)',
    frontQuestion:
      'Ý nghĩa của 3 tham số `ensure_ascii=False`, `indent=2`, và `default=str` trong `json.dumps(data, ...)` là gì?',
    frontHint: 'Giữ nguyên chữ tiếng Việt không bị biến thành `\\u1ebf`, căn lề đẹp, và không bị crash `TypeError` khi gặp `datetime`/`UUID`/`Decimal`.',
    backAnswer:
      '1. `ensure_ascii=False`: Mặc định `json.dumps` mã hóa mọi ký tự non-ASCII (như tiếng Việt, emoji) thành chuỗi thoát `\\uXXXX`. Đặt `False` giúp giữ nguyên chữ tiếng Việt rõ ràng và giảm kích thước chuỗi.\n2. `indent=2`: Định dạng JSON xuống dòng và thụt lề 2 khoảng trắng dễ đọc.\n3. `default=str` (hoặc hàm tùy chỉnh): Được gọi mỗi khi gặp kiểu dữ liệu mà JSON chuẩn không hỗ trợ (như `datetime`, `UUID`, `Decimal`, `Path`), giúp chuyển chúng thành chuỗi thay vì ném `TypeError: Object of type ... is not JSON serializable`.',
    backAnalogy:
      '`ensure_ascii=False` là cho phép viết tiếng Việt có dấu trực tiếp; `default=str` là người phiên dịch dự phòng xử lý những vật thể lạ mà bộ quy tắc JSON gốc không biết tên.',
    codeSnippet: `import json\nfrom datetime import datetime, timezone\n\npayload = {"name": "Nguyễn Văn An", "created_at": datetime.now(timezone.utc)}\nraw_json = json.dumps(payload, ensure_ascii=False, indent=2, default=str)\nprint(raw_json)`,
    relatedTermIds: ['stdlib-json', 'type-str'],
  },
  {
    id: 'fc-206',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Định dạng Dữ liệu (tomllib)',
    frontQuestion:
      'Module `tomllib` (được tích hợp sẵn từ Python 3.11+) dùng để làm gì và tại sao `tomllib.load(f)` bắt buộc phải mở file ở chế độ nhị phân `"rb"`?',
    frontHint: 'Đọc chuẩn cấu hình `pyproject.toml` / `config.toml`; chuẩn TOML bắt buộc mã hóa UTF-8 nên `tomllib.load` tự xử lý giải mã từ bytes.',
    backAnswer:
      'Theo PEP 680 (Python 3.11+), `tomllib` là thư viện chuẩn dùng để **đọc (parse)** định dạng cấu hình TOML (như `pyproject.toml`) thành `dict` Python với các kiểu bản địa (`int`, `float`, `bool`, `datetime`, `list`, `dict`). Lưu ý: `tomllib.load(f)` bắt buộc file phải mở ở chế độ nhị phân **`"rb"`** để thư viện tự đảm bảo giải mã chuẩn UTF-8 theo đặc tả TOML (nếu đọc từ chuỗi `str` trong bộ nhớ thì dùng `tomllib.loads(text)`). Ngoài ra `tomllib` chỉ hỗ trợ đọc (read-only), không có hàm `dump`.',
    backAnalogy:
      '`tomllib.load` giống như đầu đọc đĩa chuyên dụng yêu cầu đưa đĩa gốc (`"rb"`) vào để nó tự giải mã tín hiệu chuẩn UTF-8 chứ không nhận bản chép tay.',
    codeSnippet: `import tomllib\nfrom pathlib import Path\n\n# Mở ở chế độ nhị phân "rb" khi dùng tomllib.load()\nwith Path("pyproject.toml").open("rb") as f:\n    config = tomllib.load(f)\n\nproject_name = config.get("project", {}).get("name")`,
    relatedTermIds: ['stdlib-tomllib', 'tool-pyproject-toml'],
  },
  {
    id: 'fc-207',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Định dạng Dữ liệu (csv)',
    frontQuestion:
      'Tại sao khi làm việc với file CSV trong Python, ta nên dùng `csv.DictReader` / `csv.DictWriter` kèm theo `newline=""` và `encoding="utf-8-sig"`?',
    frontHint: 'Truy cập cột theo tên thay vì chỉ số `row[2]`, tránh bị trống cách dòng trên Windows và hiển thị đúng tiếng Việt trên Excel.',
    backAnswer:
      '- `csv.DictReader` và `csv.DictWriter` ánh xạ mỗi dòng thành một `dict` lấy dòng tiêu đề (header) làm key (`row["email"]`), giúp code bền vững ngay cả khi thứ tự cột trong file CSV bị thay đổi.\n- `newline=""` khi `open()` là **bắt buộc theo tài liệu chính thức** để module `csv` tự kiểm soát ký tự xuống dòng `\\r\\n`, tránh lỗi bị chèn dòng trắng xen kẽ trên Windows.\n- `encoding="utf-8-sig"` thêm dấu BOM ở đầu file giúp Microsoft Excel nhận diện đúng tiếng Việt UTF-8 khi mở trực tiếp.',
    backAnalogy:
      '`DictReader` là đọc bảng điểm theo tên cột `"Họ tên"` thay vì đếm cột thứ 3 từ trái sang; `newline=""` là tắt chế độ tự xuống dòng kép của máy in.',
    codeSnippet: `import csv\nfrom pathlib import Path\n\nrows = [{"id": 1, "name": "Lê Bình"}, {"id": 2, "name": "Trần An"}]\nwith Path("users.csv").open("w", newline="", encoding="utf-8-sig") as f:\n    writer = csv.DictWriter(f, fieldnames=["id", "name"])\n    writer.writeheader()\n    writer.writerows(rows)`,
    relatedTermIds: ['stdlib-csv', 'kw-with'],
  },
  {
    id: 'fc-208',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Hệ điều hành & Bảo mật (subprocess)',
    frontQuestion:
      'Khi gọi lệnh hệ thống bằng `subprocess.run(["git", "status"], capture_output=True, text=True, check=True)`, tại sao việc truyền danh sách đối số (`list[str]`) mà **không dùng `shell=True`** lại ngăn chặn triệt để lỗ hổng **Command/Shell Injection**?',
    frontHint: 'Gọi thẳng syscall `execve` của hệ điều hành thay vì đi qua trình thông dịch `/bin/sh` vốn thực thi các ký tự `;`, `&&`, `|`, `$()`.',
    backAnswer:
      'Khi `shell=False` (mặc định) và đối số đầu tiên là một `list[str]`, Python gọi trực tiếp hàm hệ thống (như `os.execvp`) truyền mảng đối số thẳng vào chương trình đích mà **không khởi chạy `/bin/sh` hay `cmd.exe`**. Nhờ vậy, mọi ký tự đặc biệt do người dùng nhập vào (như `file.txt; rm -rf /` hay `$(whoami)`) chỉ được coi là một chuỗi văn bản thuần túy (literal argument) chứ không bao giờ bị thực thi như lệnh shell. Thêm `check=True` sẽ tự động ném `CalledProcessError` nếu lệnh trả về mã thoát khác `0`.',
    backAnalogy:
      'Truyền `list[str]` (`shell=False`) giống như dùng Prepared Statement trong SQL: dữ liệu người dùng được đóng gói riêng biệt, không thể biến thành câu lệnh điều khiển.',
    codeSnippet: `import subprocess\n\n# ✅ AN TOÀN TUYỆT ĐỐI: Truyền list[str], không dùng shell=True\nres = subprocess.run(\n    ["git", "log", "-n", "1", "--oneline"],\n    capture_output=True,\n    text=True,\n    check=True,\n    timeout=10,\n)\nprint(res.stdout.strip())`,
    relatedTermIds: ['stdlib-subprocess', 'concept-security'],
  },
  {
    id: 'fc-209',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Hệ điều hành & File (shutil)',
    frontQuestion:
      'Module `shutil` cung cấp các hàm cấp cao nào (`copytree`, `rmtree`, `which`, `disk_usage`) bổ trợ cho `pathlib`?',
    frontHint: '`pathlib` quản lý đường dẫn và file đơn lẻ, còn `shutil` xử lý sao chép/xóa cả cây thư mục và tìm kiếm binary trên `PATH`.',
    backAnswer:
      '`pathlib.Path.rmdir()` chỉ xóa được thư mục rỗng. Khi cần thao tác cấp cao trên toàn bộ cây thư mục và hệ thống, dùng `shutil`:\n- `shutil.copytree(src, dst, dirs_exist_ok=True)`: Sao chép đệ quy toàn bộ thư mục.\n- `shutil.rmtree(path)`: Xóa đệ quy toàn bộ thư mục và mọi file bên trong.\n- `shutil.which("uv")`: Kiểm tra một công cụ CLI có được cài đặt trong biến môi trường `PATH` hay không và trả về đường dẫn thực thi (tương tự lệnh `which` trên Unix).',
    backAnalogy:
      'Nếu `pathlib` là đôi tay nhặt từng tờ giấy, thì `shutil` là xe nâng chuyển nguyên cả tủ hồ sơ (`copytree`) hoặc dọn sạch cả nhà kho (`rmtree`).',
    codeSnippet: `import shutil\nfrom pathlib import Path\n\n# Kiểm tra công cụ 'ruff' đã có trong PATH chưa trước khi chạy\nif shutil.which("ruff") is not None:\n    shutil.copytree(Path("src"), Path("backup/src"), dirs_exist_ok=True)`,
    relatedTermIds: ['stdlib-shutil', 'stdlib-pathlib'],
  },
  {
    id: 'fc-210',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Hệ điều hành & File (tempfile)',
    frontQuestion:
      'Tại sao nên dùng `tempfile.TemporaryDirectory()` thay vì tự tạo thư mục `/tmp/my_work` bằng tay khi xử lý file trung gian hoặc viết Unit Test?',
    frontHint: 'Tên thư mục ngẫu nhiên chống xung đột đa tiến trình và tự động xóa sạch 100% khi thoát khối `with` kể cả khi có Exception.',
    backAnswer:
      'Tự đặt tên cứng như `/tmp/my_work` dễ gây xung đột (Race Condition) khi nhiều tiến trình chạy song song, không tương thích đa nền tảng (Windows không có `/tmp`), và dễ để lại rác trên ổ cứng nếu code gặp lỗi giữa chừng. `with tempfile.TemporaryDirectory() as tmp_dir:` tự động tạo một thư mục có tên ngẫu nhiên an toàn ở đúng thư mục tạm của hệ điều hành và **cam kết xóa sạch toàn bộ thư mục đó** trong `__exit__` ngay khi khối `with` kết thúc (dù thành công hay ném ngoại lệ).',
    backAnalogy:
      'Giống như thuê phòng thí nghiệm dã chiến tự hủy: làm thí nghiệm xong (hoặc kể cả khi nổ bình thí nghiệm), bước ra khỏi cửa là toàn bộ phòng tự động được dọn sạch bong.',
    codeSnippet: `import tempfile\nfrom pathlib import Path\n\nwith tempfile.TemporaryDirectory(prefix="pylearn_") as tmp_dir:\n    work_file = Path(tmp_dir) / "report.txt"\n    work_file.write_text("Dữ liệu tạm thời", encoding="utf-8")\n    print(work_file.exists())  # True\n# Ra khỏi khối with: thư mục tmp_dir và report.txt đã tự động bị xóa sạch!`,
    relatedTermIds: ['stdlib-tempfile', 'kw-with', 'stdlib-pathlib'],
  },
  {
    id: 'fc-211',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Biểu thức Chính quy (re)',
    frontQuestion:
      'Khi nào nên dùng `re.compile()`, tại sao biểu thức chính quy luôn phải dùng Raw String `r"..."`, và `re.sub()` với Named Groups `(?P<name>...)` mạnh như thế nào?',
    frontHint: 'Tránh xung đột dấu gạch chéo ngược `\\`, biên dịch 1 lần dùng lại nhiều lần trong vòng lặp, và truyền hàm callback vào `re.sub()`.',
    backAnswer:
      '- **Raw String `r"..."`**: Ngăn Python thông dịch các ký tự như `\\b`, `\\n`, `\\d` thành ký tự thoát của chuỗi trước khi truyền cho bộ máy Regex.\n- **`re.compile(pattern)`**: Biên dịch biểu thức chính quy thành đối tượng `Pattern` một lần ở cấp module để tái sử dụng hàng nghìn lần trong vòng lặp với tốc độ tối đa.\n- **`(?P<name>...)` & `re.sub()`**: Cho phép đặt tên rõ nghĩa cho từng nhóm bắt được (`match.group("name")` hoặc `match.groupdict()`), và `re.sub(pattern, repl_func, text)` nhận cả một hàm callback để biến đổi động từng kết quả khớp.',
    backAnalogy:
      '`re.compile` là đúc sẵn khuôn dập kim loại để dập hàng vạn sản phẩm tức thì; Named Group `(?P<year>...)` là dán nhãn tên rõ ràng lên từng ô của khuôn.',
    codeSnippet: `import re\n\nDATE_RE = re.compile(r"(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})")\nm = DATE_RE.search("Ngày thi: 2026-11-08")\nif m:\n    print(m.groupdict())  # {'year': '2026', 'month': '11', 'day': '08'}\n\n# Đổi định dạng YYYY-MM-DD sang DD/MM/YYYY bằng re.sub\nformatted = DATE_RE.sub(r"\\g<day>/\\g<month>/\\g<year>", "Hạn chót: 2026-11-08")\n# "Hạn chót: 08/11/2026"`,
    relatedTermIds: ['stdlib-re', 'type-str'],
  },
  {
    id: 'fc-212',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Bảo mật & Mật mã (secrets)',
    frontQuestion:
      'Tại sao tuyệt đối **không được dùng module `random`** để sinh mã OTP, mật khẩu, Session ID hay API Token mà bắt buộc phải dùng module `secrets`?',
    frontHint: '`random` dùng thuật toán Mersenne Twister có thể đoán trước hoàn toàn nếu biết trạng thái trước đó, còn `secrets` dùng nguồn CSPRNG của hệ điều hành.',
    backAnswer:
      'Module `random` sử dụng bộ sinh số giả ngẫu nhiên **PRNG (Mersenne Twister)** phục vụ mô phỏng và game: nó hoàn toàn xác định (deterministic) — kẻ tấn công chỉ cần quan sát vài trăm kết quả đầu ra là có thể tái tạo toàn bộ trạng thái nội bộ và đoán chính xác 100% các mã tiếp theo! Ngược lại, module **`secrets`** (PEP 506) truy cập trực tiếp nguồn ngẫu nhiên phần cứng/hệ điều hành chuẩn mật mã học (**CSPRNG** qua `os.urandom`), không thể dự đoán ngược. Dùng `secrets.token_urlsafe(32)`, `secrets.token_hex(32)` hoặc `secrets.choice()`.',
    backAnalogy:
      '`random` là tung xúc xắc theo một công thức toán học cố định có thể nhìn bài đoán trước; `secrets` là lấy nhiễu lượng tử/nhiệt độ phần cứng không ai trên đời đoán nổi.',
    codeSnippet: `import secrets\nimport string\n\n# 1. Sinh API Token / Reset Password Link an toàn chuẩn URL-safe\nreset_token = secrets.token_urlsafe(32)\n\n# 2. Sinh mã OTP 6 chữ số an toàn mật mã học\notp_code = "".join(secrets.choice(string.digits) for _ in range(6))`,
    relatedTermIds: ['stdlib-secrets', 'stdlib-random', 'concept-security'],
  },
  {
    id: 'fc-213',
    stageId: 'stage-3',
    level: 'basic',
    category: 'Bảo mật & Băm dữ liệu (hashlib)',
    frontQuestion:
      'Làm sao để tính mã băm SHA-256 bằng `hashlib.sha256()` cho chuỗi văn bản và cho một file dung lượng lớn (nhiều GB) mà không làm tràn RAM?',
    frontHint: 'Chuỗi phải `.encode("utf-8")` sang `bytes`; với file lớn dùng `hashlib.file_digest(f, "sha256")` (Python 3.11+).',
    backAnswer:
      '- Các hàm băm trong `hashlib` làm việc trực tiếp trên **`bytes`**, nên chuỗi `str` bắt buộc phải chuyển thành bytes qua `.encode("utf-8")` trước khi đưa vào `hashlib.sha256(data).hexdigest()`.\n- Với file lớn (vài GB), tuyệt đối không dùng `f.read()` nạp hết vào RAM. Từ **Python 3.11+**, dùng hàm dựng sẵn **`hashlib.file_digest(file_obj, "sha256").hexdigest()`** để đọc từng khối bộ nhớ đệm (chunk/buffer) ở tầng C cực nhanh và chỉ tốn vài KB RAM.',
    backAnalogy:
      'Thay vì bê nguyên cả hồ bơi lên bàn cân (`f.read()`), `file_digest` cho nước chảy qua đồng hồ đo lưu lượng từng xô nhỏ một.',
    codeSnippet: `import hashlib\nfrom pathlib import Path\n\n# 1. Băm chuỗi văn bản\ntext_hash = hashlib.sha256("PyLearn2026".encode("utf-8")).hexdigest()\n\n# 2. Băm file lớn an toàn bộ nhớ (Python 3.11+)\nwith Path("pyproject.toml").open("rb") as f:\n    file_hash = hashlib.file_digest(f, "sha256").hexdigest()`,
    relatedTermIds: ['stdlib-hashlib', 'type-bytes', 'concept-security'],
  },
  {
    id: 'fc-214',
    stageId: 'stage-3',
    level: 'advanced',
    category: 'Bảo mật & Mật mã (hmac)',
    frontQuestion:
      'Tại sao khi kiểm tra chữ ký Webhook, HMAC hoặc API Token bí mật, ta phải dùng `hmac.compare_digest(a, b)` thay vì toán tử so sánh `a == b` thông thường?',
    frontHint: 'Toán tử `==` dừng ngay ở ký tự sai đầu tiên (Short-circuit), tạo kẽ hở cho tấn công đo thời gian (Timing Attack)!',
    backAnswer:
      'Toán tử `a == b` so sánh chuỗi từ trái sang phải và **trả về `False` ngay lập tức tại byte khác biệt đầu tiên**. Kẻ tấn công có thể gửi hàng nghìn request và đo thời gian phản hồi chính xác đến mức nano-giây: nếu ký tự đầu tiên đoán đúng, server sẽ tốn thêm một chút thời gian để xét sang ký tự thứ hai (**Timing Attack**), từ đó dò ra từng ký tự của chữ ký bí mật! `hmac.compare_digest(a, b)` thực hiện so sánh **thời gian hằng số (Constant-time comparison)**: luôn duyệt hết toàn bộ độ dài chuỗi dù sai ở ngay byte đầu tiên.',
    backAnalogy:
      '`a == b` giống như người gác cổng kiểm tra mật khẩu từng chữ cái và lắc đầu ngay khi bạn đọc sai chữ đầu; `compare_digest` là nghe hết trọn vẹn câu thần chú với thời gian y hệt nhau rồi mới trả lời.',
    codeSnippet: `import hashlib\nimport hmac\n\ndef verify_webhook(payload: bytes, secret: bytes, signature_hex: str) -> bool:\n    expected = hmac.new(secret, payload, hashlib.sha256).hexdigest()\n    # ✅ Chống Timing Attack bằng so sánh thời gian hằng số\n    return hmac.compare_digest(expected, signature_hex)`,
    relatedTermIds: ['stdlib-hmac', 'stdlib-hashlib', 'concept-security'],
  },
  {
    id: 'fc-215',
    stageId: 'stage-2',
    level: 'basic',
    category: 'Mạng & Web (urllib.parse)',
    frontQuestion:
      'Tại sao không nên ghép nối URL và Query String bằng f-string thủ công mà phải dùng `urllib.parse.urlencode()`, `urlsplit()` và `parse_qs()`?',
    frontHint: 'Ký tự khoảng trắng, dấu `&`, `=`, `/` hoặc tiếng Việt trong tham số sẽ làm hỏng cấu trúc URL hoặc gây lỗi Parameter Pollution.',
    backAnswer:
      'Nếu ghép f-string `f"https://api.example.com/search?q={query}"` khi `query` chứa `"C++ & Python"` hoặc `"Hà Nội"`, dấu `&` sẽ bị hiểu nhầm là phân tách tham số mới và khoảng trắng làm vỡ URL. Module `urllib.parse` chuẩn hóa theo RFC 3986:\n- `urlencode(paramsDict)`: Tự động mã hóa phần trăm (Percent-encoding, ví dụ `" "` -> `"+"`, `"&"` -> `"%26"`).\n- `urlsplit(url)` và `parse_qs(query_str)`: Tách URL thành `(scheme, netloc, path, query, fragment)` và giải mã query string thành `dict[str, list[str]]` an toàn.',
    backAnalogy:
      '`urlencode` là đóng gói các ký tự đặc biệt vào phong bì niêm phong mã vạch trước khi gửi qua đường truyền URL để bưu điện không đọc nhầm dấu `&` hay `?`.',
    codeSnippet: `from urllib.parse import parse_qs, urlencode, urlsplit\n\nparams = {"q": "Python & Rust", "city": "Hà Nội", "page": 1}\nquery_str = urlencode(params)\n# 'q=Python+%26+Rust&city=H%C3%A0+N%E1%BB%99i&page=1'\n\nparsed = urlsplit(f"https://example.com/jobs?{query_str}")\nprint(parse_qs(parsed.query))  # {'q': ['Python & Rust'], 'city': ['Hà Nội'], 'page': ['1']}`,
    relatedTermIds: ['stdlib-urllib', 'type-str', 'concept-security'],
  },
];

import { GlossaryTerm } from '@/types/glossary.types';

export const METHODS_GLOSSARY: GlossaryTerm[] = [
  // --- STRING METHODS ---
  {
    id: 'method-str-split',
    term: 'str.split()',
    aliases: ['split', 'split()', 'str.split'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Tách chuỗi thành một danh sách các chuỗi con dựa trên ký tự phân tách (Delimiter).',
    detailedExplanation:
      '`str.split(sep=None, maxsplit=-1)`: Nếu không truyền `sep`, hàm tự động tách theo bất kỳ khoảng trắng nào (dấu cách, tab, xuống dòng) và tự động loại bỏ các khoảng trắng liên tiếp thừa.',
    analogy:
      'Giống như dùng kéo cắt một sợi dây thừng dài theo các vết thắt nút đánh dấu sẵn để chia thành từng đoạn nhỏ.',
    syntaxExample: `text = "python,fastapi,postgres,docker"\nskills = text.split(",")  # ['python', 'fastapi', 'postgres', 'docker']\n\nsentence = "Học  Python   thực   chiến"\nwords = sentence.split()   # ['Học', 'Python', 'thực', 'chiến']`,
    commonGotcha:
      'Gọi `s.split(" ")` (truyền dấu cách rõ ràng) sẽ giữ lại các chuỗi rỗng `""` nếu có nhiều dấu cách liền nhau. Trong khi `s.split()` (không truyền tham số) tự động dọn dẹp toàn bộ khoảng trắng thừa sạch sẽ!',
    jsEquivalent: 'str.split(separator)',
    relatedTerms: ['method-str-join', 'method-str-strip', 'type-str', 'type-list'],
  },
  {
    id: 'method-str-join',
    term: 'str.join()',
    aliases: ['join', 'join()', 'str.join'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Nối các phần tử của một Iterable (List, Tuple) thành một chuỗi duy nhất bằng ký tự phân tách.',
    detailedExplanation:
      'Cú pháp chuẩn Pythonic là `"ký_tự_nối".join(danh_sách)` (chuỗi phân tách gọi phương thức `join`, nhận tham số là danh sách). Nối chuỗi bằng `join()` cực kỳ nhanh vì Python cấp phát bộ nhớ chính xác 1 lần duy nhất, tránh tạo chuỗi tạm trong vòng lặp.',
    analogy:
      'Dùng chỉ xâu các hạt cườm lại thành một chuỗi vòng cổ: sợi chỉ chính là ký tự nối nằm giữa các hạt cườm.',
    syntaxExample: `items = ["admin", "editor", "viewer"]\nresult = ", ".join(items)  # 'admin, editor, viewer'`,
    commonGotcha:
      'Trong JS là `arr.join(",")`, nhưng trong Python là `",".join(arr)`. Ngoài ra mọi phần tử trong list bắt buộc phải là `str`, nếu có số `int` phải ép kiểu trước `", ".join(str(x) for x in nums)`.',
    jsEquivalent: 'arr.join(", ")',
    relatedTerms: ['method-str-split', 'type-str', 'type-list'],
  },
  {
    id: 'method-str-strip',
    term: 'str.strip()',
    aliases: ['strip', 'strip()', 'lstrip', 'rstrip', 'str.strip'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Loại bỏ khoảng trắng (hoặc ký tự chỉ định) ở hai đầu chuỗi (`lstrip` bên trái, `rstrip` bên phải).',
    detailedExplanation:
      '`str.strip([chars])` cắt sạch khoảng trắng, tab `\\t`, ký tự xuống dòng `\\n`, `\\r` ở cả đầu và đuôi chuỗi. Rất phổ biến khi đọc dữ liệu từ file văn bản hoặc form người dùng nhập.',
    analogy:
      'Giống như cắt bỏ phần bìa carton thừa ở hai đầu của cuộn vải mới xuất xưởng để lấy phần vải sạch đẹp bên trong.',
    syntaxExample: `raw_input = "  \\n  username_123 \\t\\n "\ncleaned = raw_input.strip()  # 'username_123'`,
    commonGotcha:
      'Nếu truyền chuỗi ký tự `s.strip(".com")`, Python sẽ coi đó là một TẬP HỢP các ký tự đơn lẻ cần loại bỏ, chứ không phải chuỗi con nguyên vẹn! Từ Python 3.9+, hãy dùng `s.removeprefix()` hoặc `s.removesuffix()`.',
    jsEquivalent: 'str.trim(), str.trimStart(), str.trimEnd()',
    relatedTerms: ['method-str-replace', 'type-str'],
  },
  {
    id: 'method-str-replace',
    term: 'str.replace()',
    aliases: ['replace', 'replace()', 'str.replace'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Thay thế chuỗi con cũ bằng chuỗi con mới trong toàn bộ chuỗi (hoặc giới hạn số lần thay thế).',
    detailedExplanation:
      '`str.replace(old, new, [count])` trả về chuỗi MỚI vì chuỗi trong Python là bất biến (Immutable). Chuỗi gốc hoàn toàn không bị thay đổi.',
    analogy:
      'Tính năng "Find and Replace All" trong trình soạn thảo văn bản: tìm tất cả các chữ "cũ" và gõ đè chữ "mới" vào đó rồi lưu thành file mới.',
    syntaxExample: `text = "2024-11-08"\nformatted = text.replace("-", "/")  # '2024/11/08'`,
    commonGotcha:
      'Vì `str` là immutable, lệnh `text.replace("-", "/")` mà không gán lại `text = text.replace(...)` sẽ không có tác dụng gì!',
    jsEquivalent: 'str.replaceAll(old, new)',
    relatedTerms: ['method-str-strip', 'type-str'],
  },
  {
    id: 'method-str-startswith',
    term: 'str.startswith() & endswith()',
    aliases: ['startswith', 'endswith', 'str.startswith'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Kiểm tra chuỗi có bắt đầu hoặc kết thúc bằng tiền tố/hậu tố chỉ định (hỗ trợ truyền cả Tuple tiền tố).',
    detailedExplanation:
      '`str.startswith(prefix)` và `str.endswith(suffix)`. Điểm đặc biệt chuẩn Pythonic: bạn có thể truyền một `tuple` gồm nhiều tiền tố như `url.startswith(("http://", "https://"))`.',
    analogy:
      'Giống như cổng soát vé quét mã QR: kiểm tra xem vé có bắt đầu bằng tiền tố VIP hay REGULAR để mở đúng cửa.',
    syntaxExample: `filename = "avatar.png"\nif filename.endswith((".png", ".jpg", ".webp")):\n    print("Định dạng ảnh hợp lệ")`,
    commonGotcha:
      'Nếu muốn kiểm tra nhiều tiền tố, bắt buộc phải bọc trong Tuple `(...)`. Nếu bọc trong List `[...]`, Python sẽ ném lỗi `TypeError: tuple for startswith must only contain str`.',
    jsEquivalent: 'str.startsWith(prefix) / str.endsWith(suffix)',
    relatedTerms: ['type-str', 'type-tuple'],
  },
  {
    id: 'method-str-lower',
    term: 'str.lower() & upper()',
    aliases: ['lower', 'upper', 'casefold', 'str.lower'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Chuyển đổi toàn bộ chuỗi sang chữ thường hoặc chữ in hoa (hoặc `casefold()` cho chuẩn quốc tế Unicode).',
    detailedExplanation:
      '`str.lower()` chuyển sang chữ thường. Với so sánh chuỗi không phân biệt hoa thường theo chuẩn Unicode đa ngôn ngữ, `str.casefold()` thậm chí còn mạnh hơn và chuẩn xác hơn.',
    analogy:
      'Bộ lọc chữ viết: chuẩn hóa toàn bộ chữ viết hoa/thường về một dạng chữ in duy nhất để dễ đối chiếu hồ sơ.',
    syntaxExample: `user_role = "ADMIN".lower()  # 'admin'\nif input_role.casefold() == "admin":\n    grant_access()`,
    commonGotcha:
      'Phương thức này trả về chuỗi mới, không thay đổi chuỗi gốc do chuỗi trong Python là bất biến.',
    jsEquivalent: 'str.toLowerCase() / str.toUpperCase()',
    relatedTerms: ['type-str'],
  },
  {
    id: 'method-str-find',
    term: 'str.find()',
    aliases: ['find', 'find()', 'str.find', 'index'],
    category: 'method',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Tìm vị trí chỉ mục (Index) đầu tiên của chuỗi con, trả về -1 nếu không tìm thấy.',
    detailedExplanation:
      '`str.find(sub)` trả về index của chuỗi con, hoặc `-1` nếu không có. Ngược lại, `str.index(sub)` sẽ ném lỗi `ValueError` nếu không tìm thấy chuỗi con.',
    analogy:
      'Tra mục lục sách: mở trang đầu tiên nhắc tới từ khóa, hoặc ghi nhận "-1" nếu sách không có từ đó.',
    syntaxExample: `url = "https://pylearn.vn/courses/python"\npos = url.find("courses")  # 17\nif "courses" in url:       # Cách chuẩn Pythonic để kiểm tra tồn tại!\n    print("Thuộc trang khóa học")`,
    commonGotcha:
      'Nếu chỉ muốn kiểm tra xem chuỗi con có nằm trong chuỗi lớn hay không, ĐỪNG dùng `s.find(sub) != -1`, hãy dùng toán tử chuẩn Pythonic: `sub in s`.',
    jsEquivalent: 'str.indexOf(sub)',
    relatedTerms: ['kw-in', 'type-str'],
  },

  // --- LIST METHODS ---
  {
    id: 'method-list-append',
    term: 'list.append()',
    aliases: ['append', 'append()', 'list.append'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Thêm một phần tử vào cuối danh sách (In-place, độ phức tạp O(1) Amortized).',
    detailedExplanation:
      '`list.append(x)` chèn trực tiếp phần tử `x` vào cuối list hiện tại và luôn trả về `None`. CPython sử dụng thuật toán over-allocation (cấp phát dư mảng con trỏ), giúp `append` đạt tốc độ O(1) amortized.',
    analogy:
      'Xếp thêm một kiện hàng vào cuối toa tàu chở hàng đang nối tiếp nhau.',
    syntaxExample: `numbers = [1, 2, 3]\nnumbers.append(4)  # numbers = [1, 2, 3, 4]`,
    commonGotcha:
      'Bẫy nhập môn: Viết `new_list = old_list.append(4)` sẽ khiến `new_list` nhận giá trị `None` vì `append` thay đổi mảng tại chỗ (in-place) và trả về `None`!',
    jsEquivalent: 'arr.push(x)',
    relatedTerms: ['method-list-extend', 'method-list-pop', 'type-list'],
  },
  {
    id: 'method-list-extend',
    term: 'list.extend()',
    aliases: ['extend', 'extend()', 'list.extend'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Mở rộng danh sách bằng cách nối tất cả các phần tử từ một Iterable khác vào cuối.',
    detailedExplanation:
      '`list.extend(iterable)` duyệt qua `iterable` và chèn từng phần tử vào cuối list. Khác hoàn toàn với `append`: `append` đưa cả collection vào như 1 phần tử đơn lẻ duy nhất.',
    analogy:
      'Nếu `append([4, 5])` là nhét nguyên cả cái thùng carton chứa 2 quả táo vào toa tàu, thì `extend([4, 5])` là mở thùng lấy từng quả táo xếp vào toa tàu.',
    syntaxExample: `a = [1, 2]\na.extend([3, 4])  # [1, 2, 3, 4]\n\nb = [1, 2]\nb.append([3, 4])  # [1, 2, [3, 4]] -> Khác hoàn toàn!`,
    commonGotcha:
      'Viết `a += [3, 4]` tương đương với `a.extend([3, 4])` (sửa in-place), nhưng `a = a + [3, 4]` lại tạo ra một list hoàn toàn mới ở ô nhớ khác.',
    jsEquivalent: 'arr.push(...otherArr)',
    relatedTerms: ['method-list-append', 'type-list'],
  },
  {
    id: 'method-list-pop',
    term: 'list.pop()',
    aliases: ['pop', 'pop()', 'list.pop'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Xóa và trả về phần tử tại vị trí chỉ định (mặc định là phần tử cuối cùng `index=-1`, O(1)).',
    detailedExplanation:
      '`list.pop([index])` xóa và lấy phần tử ra. `list.pop()` ở cuối mất O(1), biến List thành cấu trúc Stack (LIFO) hoàn hảo. Nếu `list.pop(0)` ở đầu danh sách, toàn bộ các phần tử phía sau phải dịch chuyển sang trái, mất chi phí O(n).',
    analogy:
      'Rút đĩa khỏi chồng đĩa ăn: rút chiếc đĩa trên cùng (`pop()`) cực kỳ nhanh và an toàn. Rút chiếc đĩa dưới đáy cùng (`pop(0)`) làm toàn bộ chồng đĩa bên trên sụt xuống.',
    syntaxExample: `stack = ["trang_chủ", "danh_mục", "chi_tiết_sản_phẩm"]\ncurrent = stack.pop()  # 'chi_tiết_sản_phẩm'\n# stack giờ còn ['trang_chủ', 'danh_mục']`,
    commonGotcha:
      'Gọi `pop()` trên danh sách rỗng `[]` sẽ ném lỗi `IndexError: pop from empty list`. Hãy luôn kiểm tra `if stack:` trước khi pop!',
    jsEquivalent: 'arr.pop()',
    relatedTerms: ['method-list-append', 'type-list'],
  },
  {
    id: 'method-list-remove',
    term: 'list.remove()',
    aliases: ['remove', 'remove()', 'list.remove'],
    category: 'method',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Tìm và xóa phần tử ĐẦU TIÊN có giá trị trùng khớp (ném ValueError nếu không tìm thấy).',
    detailedExplanation:
      '`list.remove(value)` tìm kiếm tuyến tính từ đầu danh sách đến cuối (O(n)), xóa phần tử đầu tiên thỏa mãn `x == value` và dịch các phần tử còn lại.',
    analogy:
      'Người soát danh sách tìm thấy tên khách hàng đầu tiên trong danh bạ và gạch tên người đó đi.',
    syntaxExample: `tasks = ["ăn sáng", "học python", "tập gym", "học python"]\ntasks.remove("học python")  # Chỉ xóa mục đầu tiên!`,
    commonGotcha:
      'Nếu giá trị không có trong list, `remove()` ném `ValueError` chứ không im lặng! Phải kiểm tra `if val in my_list:` trước khi remove, hoặc dùng List Comprehension để xóa tất cả.',
    jsEquivalent: 'const idx = arr.indexOf(val); if (idx !== -1) arr.splice(idx, 1);',
    relatedTerms: ['method-list-pop', 'type-list'],
  },
  {
    id: 'method-list-sort',
    term: 'list.sort()',
    aliases: ['sort', 'sort()', 'list.sort'],
    category: 'method',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Sắp xếp danh sách tại chỗ (In-place, O(n log n)) dùng thuật toán Timsort đỉnh cao.',
    detailedExplanation:
      '`list.sort(*, key=None, reverse=False)` thay đổi trực tiếp danh sách hiện tại và trả về `None`. Timsort là thuật toán sắp xếp lai (Hybrid giữa Merge Sort và Insertion Sort) cực kỳ tối ưu trên dữ liệu thực tế.',
    analogy:
      'Tự tay sắp xếp lại các lá bài trên tay theo thứ tự từ nhỏ đến lớn mà không cần mượn thêm một bộ bài mới.',
    syntaxExample: `users = [{"name": "Bình", "age": 25}, {"name": "An", "age": 20}]\nusers.sort(key=lambda u: u["age"])  # Sắp xếp tăng dần theo tuổi tại chỗ`,
    commonGotcha:
      'Khác biệt cốt lõi: `my_list.sort()` sắp xếp tại chỗ và trả về `None`. Còn hàm tích hợp `sorted(my_list)` KHÔNG sửa `my_list` mà tạo ra một danh sách MỚI.',
    jsEquivalent: 'arr.sort((a, b) => ...)',
    relatedTerms: ['fn-sorted', 'type-list'],
  },
  {
    id: 'method-list-insert',
    term: 'list.insert()',
    aliases: ['insert', 'insert()', 'list.insert'],
    category: 'method',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Chèn một phần tử vào vị trí chỉ mục xác định `list.insert(index, element)` (O(n)).',
    detailedExplanation:
      'Chèn phần tử vào vị trí `index`. Mọi phần tử từ `index` trở đi phải dịch sang phải 1 ô, do đó chi phí thời gian là O(n). Nếu cần chèn liên tục ở đầu mảng, hãy dùng `collections.deque`.',
    analogy:
      'Một người chen ngang vào hàng đợi: tất cả những người đứng phía sau vị trí đó phải lùi lại một bước.',
    syntaxExample: `fruits = ["táo", "chuối"]\nfruits.insert(1, "xoài")  # ['táo', 'xoài', 'chuối']`,
    commonGotcha:
      'Nếu chỉ số `index` lớn hơn độ dài của list, Python không báo lỗi mà tự động chèn vào cuối mảng (tương đương `append`).',
    jsEquivalent: 'arr.splice(index, 0, element)',
    relatedTerms: ['method-list-append', 'type-list'],
  },

  // --- DICTIONARY METHODS ---
  {
    id: 'method-dict-get',
    term: 'dict.get()',
    aliases: ['get', 'get()', 'dict.get'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Truy cập giá trị của Key an toàn, trả về giá trị mặc định nếu Key không tồn tại (không ném KeyError).',
    detailedExplanation:
      '`dict.get(key, default=None)`: Khác với `dict[key]` sẽ ném ra lỗi `KeyError` nếu thiếu key làm sập chương trình, `get()` trả về `None` (hoặc giá trị `default` tùy chọn).',
    analogy:
      'Tra sổ danh bạ: nếu số điện thoại của bạn bè không có trong sổ, người tra sổ nhẹ nhàng trả lời "Không tìm thấy" thay vì hét toáng lên hoảng hốt (`KeyError`).',
    syntaxExample: `config = {"host": "localhost", "port": 8000}\ntimeout = config.get("timeout", 30)  # 30 (default an toàn!)\ndebug = config.get("debug")          # None`,
    commonGotcha:
      'Nếu key có tồn tại trong dict nhưng giá trị của nó là `None` (ví dụ `{"timeout": None}`), thì `config.get("timeout", 30)` vẫn trả về `None` chứ không dùng số 30!',
    jsEquivalent: 'obj[key] ?? defaultValue / Optional chaining obj?.key',
    relatedTerms: ['method-dict-setdefault', 'type-dict'],
  },
  {
    id: 'method-dict-items',
    term: 'dict.items()',
    aliases: ['items', 'items()', 'dict.items'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Trả về một đối tượng Dictionary View chứa các cặp `(key, value)` động phản chiếu trực tiếp dict.',
    detailedExplanation:
      '`dict.items()` trả về một `dict_items` view. Khi bạn lặp qua `for k, v in d.items():`, bạn có cả khóa lẫn giá trị một cách tự nhiên và sạch sẽ. Dictionary View phản chiếu tức thời nếu dict bị sửa đổi.',
    analogy:
      'Cửa sổ kính nhìn vào kho hàng: nhìn thấy cả nhãn tên hộp (`key`) và đồ đạc bên trong hộp (`value`). Nếu ai đó bốc đồ ra, cửa sổ kính lập tức phản chiếu sự thay đổi đó.',
    syntaxExample: `scores = {"Toán": 9.5, "Văn": 8.0, "Anh": 9.0}\nfor subject, score in scores.items():\n    print(f"Môn {subject}: {score} điểm")`,
    commonGotcha:
      'Tuyệt đối không được thêm hoặc xóa key của dict trong lúc đang lặp qua `for k, v in d.items():`. Python sẽ ném lỗi `RuntimeError: dictionary changed size during iteration`.',
    jsEquivalent: 'Object.entries(obj)',
    relatedTerms: ['method-dict-keys', 'method-dict-values', 'type-dict'],
  },
  {
    id: 'method-dict-keys',
    term: 'dict.keys() & values()',
    aliases: ['keys', 'values', 'dict.keys', 'dict.values'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Trả về Dictionary View gồm toàn bộ danh sách khóa (`keys()`) hoặc toàn bộ giá trị (`values()`).',
    detailedExplanation:
      '`dict.keys()` hỗ trợ các phép toán tập hợp (Set operations) như giao `&`, hợp `|`, hiệu `-`. Kiểm tra `key in d` thực chất tương đương với `key in d.keys()`, nhưng viết `key in d` nhanh hơn và ngắn hơn.',
    analogy:
      'Danh sách mục lục chỉ in tên chương (`keys()`) hoặc danh sách các bức ảnh in trong sách (`values()`).',
    syntaxExample: `user = {"id": 1, "username": "skyline", "active": True}\nall_keys = list(user.keys())      # ['id', 'username', 'active']\nall_vals = list(user.values())    # [1, 'skyline', True]`,
    commonGotcha:
      'Để kiểm tra một key có nằm trong dict không, hãy viết `if "id" in user:`. Đừng viết `if "id" in user.keys():` vì thừa thãi.',
    jsEquivalent: 'Object.keys(obj) / Object.values(obj)',
    relatedTerms: ['method-dict-items', 'type-dict'],
  },
  {
    id: 'method-dict-update',
    term: 'dict.update()',
    aliases: ['update', 'update()', 'dict.update'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Cập nhật từ điển bằng các cặp key-value từ một dict hoặc iterable khác (ghi đè nếu trùng key).',
    detailedExplanation:
      '`dict.update([other])` cập nhật tại chỗ (in-place) và trả về `None`. Từ Python 3.9+, bạn có thêm toán tử hợp nhất từ điển mới: `d1 | d2` (tạo dict mới) hoặc `d1 |= d2` (tương đương update in-place).',
    analogy:
      'Đồng bộ dữ liệu danh bạ: nạp thêm danh sách liên hệ mới vào máy, số nào đã có thì cập nhật lại thông tin mới nhất, số nào chưa có thì thêm vào.',
    syntaxExample: `settings = {"theme": "dark", "fontSize": 14}\nsettings.update({"fontSize": 16, "showLineNumbers": True})\n# Python 3.9+:\nsettings |= {"autoSave": True}`,
    commonGotcha:
      '`update()` trả về `None`. Không viết `new_dict = d.update(...)`!',
    jsEquivalent: 'Object.assign(obj, other) / { ...obj, ...other }',
    relatedTerms: ['method-dict-get', 'type-dict'],
  },
  {
    id: 'method-dict-setdefault',
    term: 'dict.setdefault()',
    aliases: ['setdefault', 'setdefault()', 'dict.setdefault'],
    category: 'method',
    level: 'advanced',
    stageId: 'stage-2',
    shortSummary: 'Nếu key đã có thì trả về giá trị, nếu chưa có thì gán giá trị mặc định vào dict và trả về nó.',
    detailedExplanation:
      '`dict.setdefault(key, default=None)`: Thường dùng để nhóm các phần tử vào danh sách con mà không cần viết `if key not in d: d[key] = []`.',
    analogy:
      'Lập hồ sơ bệnh nhân: nếu bệnh nhân đã có hồ sơ thì mở ra xem, nếu bệnh nhân mới đến lần đầu thì lập ngay một bìa hồ sơ rỗng mới rồi ghi thông tin vào.',
    syntaxExample: `groups: dict[str, list[str]] = {}\nfor name, role in [("An", "Dev"), ("Bình", "Dev"), ("Cúc", "QA")]:\n    groups.setdefault(role, []).append(name)\n# {'Dev': ['An', 'Bình'], 'QA': ['Cúc']}`,
    commonGotcha:
      'Nếu logic phức tạp, dùng `collections.defaultdict(list)` sẽ nhanh hơn và code sáng sủa hơn nhiều so với gọi `setdefault` lặp đi lặp lại.',
    jsEquivalent: 'obj[key] = obj[key] ?? []; obj[key].push(...)',
    relatedTerms: ['method-dict-get', 'type-dict'],
  },
  {
    id: 'method-dict-pop',
    term: 'dict.pop()',
    aliases: ['dict.pop', 'dict_pop'],
    category: 'method',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Xóa key và trả về giá trị tương ứng, hỗ trợ giá trị mặc định nếu key không tồn tại.',
    detailedExplanation:
      '`dict.pop(key[, default])`: Xóa key khỏi từ điển và lấy giá trị ra ngoài. Nếu không có key và không truyền `default`, ném lỗi `KeyError`.',
    analogy:
      'Lấy một món đồ ra khỏi ngăn tủ và cất ngăn tủ đó đi luôn.',
    syntaxExample: `user_data = {"id": 101, "password_hash": "xyz789", "name": "Nam"}\npwd = user_data.pop("password_hash")\n# user_data giờ an toàn để trả về client vì đã xóa password_hash!`,
    commonGotcha:
      'Luôn luôn truyền giá trị default `d.pop("key", None)` nếu không chắc chắn 100% key có tồn tại để tránh sập app do `KeyError`.',
    jsEquivalent: 'const val = obj[key]; delete obj[key];',
    relatedTerms: ['method-dict-get', 'type-dict'],
  },

  // --- SET METHODS ---
  {
    id: 'method-set-add',
    term: 'set.add()',
    aliases: ['add', 'add()', 'set.add'],
    category: 'method',
    level: 'fundamental',
    stageId: 'stage-1',
    shortSummary: 'Thêm một phần tử vào Set (bỏ qua nếu phần tử đã tồn tại, chi phí O(1)).',
    detailedExplanation:
      '`set.add(elem)`: Set chỉ chứa các phần tử duy nhất (Unique) và có thể băm (Hashable). Thêm phần tử đã có trong set sẽ không sinh lỗi và không làm thay đổi set.',
    analogy:
      'Bỏ thêm một viên bi vào bộ sưu tập: nếu màu bi này đã có trong hộp rồi thì không nhận thêm nữa.',
    syntaxExample: `seen_ids = set()\nseen_ids.add(101)\nseen_ids.add(101)  # Không thay đổi, len vẫn là 1`,
    commonGotcha:
      'Chỉ các đối tượng bất biến (Hashable) mới được thêm vào Set. Cố tình `set.add([1, 2])` (list) sẽ ném lỗi `TypeError: unhashable type: list`.',
    jsEquivalent: 'set.add(x)',
    relatedTerms: ['method-set-discard', 'type-set'],
  },
  {
    id: 'method-set-discard',
    term: 'set.discard() & remove()',
    aliases: ['discard', 'set.discard', 'set.remove'],
    category: 'method',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Xóa phần tử khỏi Set: `discard()` an toàn nếu không tìm thấy, `remove()` ném KeyError.',
    detailedExplanation:
      '`set.discard(elem)` xóa phần tử nếu có, nếu không có thì im lặng bỏ qua. Ngược lại, `set.remove(elem)` sẽ ném ra ngoại lệ `KeyError` nếu phần tử vắng mặt.',
    analogy:
      '`discard` là gạch tên một người nếu có trong danh sách (nếu không có thì thôi). `remove` là bắt buộc phải có mặt, nếu không thấy thì nổi còi báo động.',
    syntaxExample: `active_tags = {"python", "fastapi", "react"}\nactive_tags.discard("vue")   # An toàn, không lỗi!\n# active_tags.remove("vue")  # Ném KeyError!`,
    commonGotcha:
      'Trong 90% trường hợp thực tế, hãy ưu tiên dùng `set.discard()` để tránh phải bọc trong khối `try ... except KeyError`.',
    jsEquivalent: 'set.delete(x)',
    relatedTerms: ['method-set-add', 'type-set'],
  },
  {
    id: 'method-set-union',
    term: 'set.union() & intersection()',
    aliases: ['union', 'intersection', 'set.union', 'set.intersection'],
    category: 'method',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Phép hợp `|` (Union) và phép giao `&` (Intersection) giữa các tập hợp Set.',
    detailedExplanation:
      '`set.union(*others)` hoặc toán tử `s1 | s2` lấy toàn bộ phần tử thuộc ít nhất một trong hai set. `set.intersection(*others)` hoặc `s1 & s2` chỉ lấy phần tử chung.',
    analogy:
      'Biểu đồ Venn: phần giao nhau ở giữa hai vòng tròn là `intersection`, còn toàn bộ diện tích của cả hai vòng tròn gộp lại là `union`.',
    syntaxExample: `dev_skills = {"Python", "SQL", "Git"}\ndata_skills = {"Python", "R", "SQL", "PowerBI"}\n\ncommon = dev_skills & data_skills  # {'Python', 'SQL'}\nall_req = dev_skills | data_skills  # {'Python', 'SQL', 'Git', 'R', 'PowerBI'}`,
    commonGotcha:
      'Toán tử `|` và `&` bắt buộc cả hai vế phải là Set. Phương thức `s.union(any_iterable)` linh hoạt hơn, có thể nhận List, Tuple hay Generator bất kỳ.',
    jsEquivalent: 'setA.union(setB) / setA.intersection(setB) (ES2024)',
    relatedTerms: ['method-set-difference', 'type-set'],
  },
  {
    id: 'method-set-difference',
    term: 'set.difference()',
    aliases: ['difference', 'set.difference'],
    category: 'method',
    level: 'basic',
    stageId: 'stage-1',
    shortSummary: 'Phép trừ tập hợp `-` (Difference) lấy các phần tử có trong set này nhưng không có trong set kia.',
    detailedExplanation:
      '`s1.difference(s2)` hoặc toán tử `s1 - s2`. Cực kỳ hữu ích để tìm ra các quyền còn thiếu, các phần tử chưa được xử lý, hoặc các file bị xóa.',
    analogy:
      'Danh sách công việc cần làm trừ đi danh sách công việc đã hoàn thành, kết quả là những việc còn tồn đọng.',
    syntaxExample: `required_perms = {"read", "write", "delete", "admin"}\nuser_perms = {"read", "write"}\nmissing_perms = required_perms - user_perms  # {'delete', 'admin'}`,
    commonGotcha:
      'Thứ tự trừ rất quan trọng: `A - B` hoàn toàn khác với `B - A`!',
    jsEquivalent: 'setA.difference(setB) (ES2024)',
    relatedTerms: ['method-set-union', 'type-set'],
  },
];

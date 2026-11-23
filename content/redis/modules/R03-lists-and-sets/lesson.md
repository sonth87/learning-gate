# Lists (quicklist) và Sets (intset): Hàng đợi hai đầu và phép toán tập hợp

> [!NOTE] Khái niệm cốt lõi & Bài toán thực tế
> Trong lập trình thông thường, dùng mảng động (`list` trong Python hay `Array` trong JavaScript) ở quy mô lớn gặp 2 giới hạn:
> 1. **Hàng đợi FIFO hoặc danh sách tin mới nhất:** Việc chèn phần tử vào đầu mảng 100,000 mục bắt hệ thống phải dịch chuyển toàn bộ các ô nhớ phía sau (`O(N)`). **Redis List** sử dụng cấu trúc **`quicklist`** (danh sách liên kết hai chiều gồm các khối `listpack` nén) giúp thao tác thêm/lấy ở cả hai đầu đạt ==`O(1)`== bất kể độ dài danh sách.
> 2. **Tập hợp phần tử duy nhất & phép toán giao/hiệu:** **Redis Set** lưu trữ tập hợp không thứ tự và tự động loại bỏ phần tử trùng lặp; kiểm tra một phần tử có tồn tại hay không (`SISMEMBER`) mất ==`O(1)`==. Đặc biệt, nếu toàn bộ phần tử là số nguyên 64-bit (`<= 512` phần tử), Redis tự động dùng cấu trúc mảng nguyên liền khối **`intset`** giúp tiết kiệm tới 80% RAM.

```visual
kind: illustration
diagram: redis:r03
alt: Cấu trúc lai quicklist hai đầu của Redis List (LPUSH + LTRIM, LMOVE) đối chiếu với biểu diễn nén intset và phép giao SINTER của Redis Set
badge: Cấu trúc dữ liệu · Lists & Sets
title: Giải Phẫu Quicklist Hai Đầu (Lists) & Tập Hợp Khử Trùng (Sets)
subtitle: Thêm/bớt O(1) ở hai cực danh sách, bàn giao tác vụ nguyên tử với LMOVE và phép toán tập hợp siêu tốc trên RAM
caption: Nhấn vào sơ đồ để phóng to — quan sát cách quicklist ghép nhiều khối listpack nhỏ và cách Set tự động chọn intset khi lưu toàn số nguyên
callouts:
  - num: 1
    label: Quicklist = Doubly-Linked List của các Listpack
    desc: Kết hợp ưu điểm chèn đầu/cuối O(1) của Linked List với tính liền khối CPU cache của mảng nén listpack, không tốn 2 con trỏ prev/next cho từng phần tử lẻ!
    tone: sky
  - num: 2
    label: Cặp Đôi Kinh Điển LPUSH + LTRIM & Hàng Đợi LMOVE
    desc: LPUSH + LTRIM tạo băng chuyền cố định N tin mới nhất; LMOVE bốc nguyên tử từ queue chờ sang queue đang xử lý để không rớt job khi worker sập.
    tone: emerald
  - num: 3
    label: Set O(1) & Siêu Nén Số Nguyên intset
    desc: Khi mọi thành viên là số nguyên 64-bit và <= 512 phần tử, Redis lưu gọn trong mảng số nguyên sắp xếp intset, giảm tới 80% RAM so với bảng băm.
    tone: amber
```

## 1. Redis List (`quicklist`): Hàng đợi hai đầu, `LTRIM` & `LMOVE` an toàn

> [!NOTE] Vì sao Redis thiết kế `quicklist` thay vì Danh sách liên kết (Linked List) cổ điển?
> Trên kiến trúc 64-bit, mỗi node trong Linked List cổ điển tốn `16 bytes` chỉ để lưu 2 con trỏ `prev` và `next` — nếu phần tử chỉ là chuỗi `"ok"` dài 2 byte thì chi phí con trỏ lớn gấp 8 lần dữ liệu thực. Vì vậy Redis sử dụng **`quicklist`**: một danh sách liên kết hai chiều mà **mỗi node là một khối `listpack`** chứa nhiều phần tử nằm liền kề nhau trên bộ nhớ (tương tự cơ chế phân khối của `collections.deque` trong Python).

Nhờ thiết kế đó, thao tác ở hai đầu danh sách (`LPUSH`, `RPUSH`, `LPOP`, `RPOP`) luôn đạt **`O(1)`**, trong khi truy cập phần tử ở giữa danh sách (`LINDEX` xa hai đầu) tốn **`O(N)`**. Hai mẫu thiết kế quan trọng nhất với List gồm:

```visual
kind: groups
title: Hai Mẫu Kiến Trúc Cốt Lõi Của Redis List Trên Production [!badge:sky:Patterns]
columns: 2
items:
  - num: 1
    title: Capped Activity Feed (Bảng tin giới hạn N mục)
    badge: LPUSH + LTRIM
    tone: emerald
    bullets:
      - "Luôn ghép cặp ==`LPUSH` đi kèm `LTRIM key 0 (N-1)`== (ví dụ giữ cố định 50 hoạt động gần nhất: `0 49`) để khoá không bao giờ phình to vô hạn."
      - "Đọc trang đầu siêu nhanh bằng `LRANGE key 0 19` (rất nhẹ vì lấy ngay từ đầu trái của toa đầu tiên)."
    code: |
      LPUSH feed:u:42 "order:paid:901"
      LTRIM feed:u:42 0 49
      LRANGE feed:u:42 0 9
    codeLang: redis
  - num: 2
    title: Reliable Queue Handoff (Hàng đợi an toàn LMOVE)
    badge: Thay thế RPOPLPUSH cũ
    tone: amber
    bullets:
      - "Nếu worker chỉ gọi `RPOP` (hoặc `BRPOP` chờ tin mới), ngay giây phần tử rời Redis mà tiến trình worker mất điện, tác vụ đó **bốc hơi vĩnh viễn**!"
      - "Dùng ==`LMOVE src dst RIGHT LEFT`== (hoặc bản chặn chờ `BLMOVE`): vừa rút khỏi `pending`, vừa cất ngay sang danh sách tạm `processing` trong **1 bước nguyên tử**; xử lý xong mới `LREM` khỏi `processing`."
    code: |
      LPUSH jobs:pending "invoice-881"
      LMOVE jobs:pending jobs:processing RIGHT LEFT
    codeLang: redis
```

> [!TIP] Thực tế đi làm: Tự viết `BLMOVE` hay dùng Thư viện Hàng đợi Tác vụ (Task Queue)?
> Các thư viện hàng đợi nền nổi tiếng nhất mà bạn dùng hàng ngày thực chất đều xây dựng bên trên Redis List/ZSet/Streams + Lua:
> - **Hệ sinh thái Python:** **`Celery`** (chuẩn công nghiệp lâu đời), **`RQ` (*Redis Queue*)** (cực gọn nhẹ dễ học), hoặc **`ARQ`** (bất đồng bộ `asyncio` siêu hợp với **FastAPI**).
> - **Hệ sinh thái Node.js / TypeScript:** **`BullMQ`** (hỗ trợ sẵn retry, delay, priority, rate-limit).
> - **Hệ sinh thái Go:** **`Asynq`**. Khi cần luồng sự kiện bền vững có nhiều nhóm cùng đọc độc lập, ta sẽ nâng cấp lên **Redis Streams** ở Mô-đun `R08`!

## 2. Redis Set: Khử trùng tự động, `intset` & Phép toán Tập hợp trên RAM

Khác với List (giữ nguyên thứ tự chèn và cho phép trùng lặp), **Redis Set** là tập hợp **không thứ tự và tuyệt đối duy nhất** — gọi `SADD` thêm `"redis"` 100 lần thì trong Set vẫn chỉ có 1 phần tử `"redis"`.

Redis 8 tự động chọn **1 trong 3 cách đóng gói nội bộ** cho Set tùy theo dữ liệu bạn đưa vào:
1. **`intset`:** Khi **100% thành viên là số nguyên 64-bit** (ví dụ ID người dùng dạng số `1001`, `2048`...) và số lượng `<= 512` (`set-max-intset-entries`). Không tốn bất kỳ con trỏ chuỗi hay bảng băm nào!
2. **`listpack`:** Khi Set chứa chuỗi văn bản ngắn và ít phần tử (`<= 128`, có mặt từ Redis 7.2+ giúp các Set nhãn nhỏ tiết kiệm RAM vượt trội).
3. **`hashtable`:** Khi Set lớn hoặc chứa chuỗi dài — đảm bảo thêm/xóa/kiểm tra thành viên luôn đạt `O(1)`.

```visual
kind: anatomy
title: Bộ Lệnh Redis Set & Độ Phức Tạp Cần Thuộc Lòng
subtitle: Cẩn trọng phân biệt nhóm lệnh O(1) siêu nhanh với nhóm lệnh tập hợp O(N)
items:
  - keyword: SADD / SREM / SCARD
    role: O(1) mỗi phần tử
    tone: emerald
    summary: Thêm thành viên mới (`SADD` trả về số phần tử thực sự mới), xoá (`SREM`), và đếm tổng số phần tử tức thì (`SCARD` luôn là `O(1)`).
    example: |
      SADD post:99:likes "u:1" "u:2" "u:1"
      SCARD post:99:likes
    lang: redis
  - keyword: SISMEMBER / SMISMEMBER
    role: O(1) / O(K) · Kiểm tra nhanh
    tone: sky
    summary: Kiểm tra 1 phần tử (`SISMEMBER` -> `1` hoặc `0`) hoặc kiểm tra hàng loạt `K` phần tử trong 1 chuyến mạng (`SMISMEMBER`).
    bullets:
      - "Luôn dùng `SISMEMBER` / `SMISMEMBER` ngay trên Redis thay vì gọi `SMEMBERS` tải cả vạn phần tử về Python/Node.js/Go rồi mới kiểm tra `in` hay `.includes()`!"
    example: SMISMEMBER post:99:likes "u:1" "u:999"
    lang: redis
  - keyword: SINTER / SUNION / SDIFF
    role: O(N) · Giao / Hợp / Hiệu
    tone: cyan
    summary: Tìm phần tử chung (`SINTER` — bạn chung), gộp nhóm (`SUNION`), hoặc tìm phần tử có ở tập đầu mà chưa có ở tập sau (`SDIFF`).
    bullets:
      - "Các biến thể `SINTERSTORE`, `SUNIONSTORE`, `SDIFFSTORE` lưu thẳng kết quả vào một khoá tạm trên RAM để đọc lại nhanh."
      - "Mẹo Redis 7/8: Nếu chỉ cần **đếm số lượng bạn chung** mà không cần lấy danh sách tên, hãy dùng ==`SINTERCARD 2 setA setB LIMIT 100`== để dừng đếm sớm!"
    example: |
      SINTERSTORE mutual:a:b friends:a friends:b
      SINTERCARD 2 friends:a friends:b LIMIT 50
    lang: redis
```

> [!WARNING] Ba sai lầm phổ biến khi sử dụng List và Set
> 1. **Gọi `LRANGE mylist 0 -1` hoặc `SMEMBERS myset` trên tập lớn:** Cả hai đều có độ phức tạp `O(N)`. Nếu Set có 1 triệu người dùng, bắt buộc duyệt phân trang bằng con trỏ **`SSCAN key 0 COUNT 200`**.
> 2. **Ghép thêm tiền tố chữ vào Set toàn số:** Đổi từ `SADD uids 1001 1002` sang `SADD uids "u_1001" "u_1002"` sẽ ==phá vỡ ngay cơ chế nén `intset`==, làm lượng RAM tiêu thụ của hàng triệu Set nhỏ tăng lên gấp nhiều lần.
> 3. **Dùng lệnh cũ `RPOPLPUSH` / `BRPOPLPUSH`:** Nhóm lệnh này đã lỗi thời (*deprecated*) — hãy thống nhất dùng **`LMOVE`** và **`BLMOVE`** với 4 tham số hướng rõ ràng (`LEFT` / `RIGHT`).

> [!REMEMBER] Ghi nhớ cốt lõi
> - **List (`quicklist`):** Giữ thứ tự chèn, cho phép trùng lặp, `O(1)` ở hai đầu. Luôn đi đôi **`LPUSH` + `LTRIM`** cho danh sách giới hạn và dùng **`LMOVE` / `BLMOVE`** (hoặc `Celery` / `ARQ` / `BullMQ`) cho hàng đợi công việc.
> - **Set (`intset` / `listpack` / `hashtable`):** Không thứ tự, tự động khử trùng. Dùng **`SISMEMBER` / `SMISMEMBER`** để kiểm tra thành viên trong `O(1)`, **`SCARD`** để lấy tổng số lượng, và **`SINTERCARD`** khi chỉ cần đếm giao của hai tập hợp.

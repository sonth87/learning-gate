# Lists (quicklist) & Sets (intset): Băng chuyền hàng đợi & Phép toán tập hợp

Nếu bạn quen dùng `Array` trong JavaScript hay `list` trong Python để vừa làm hàng đợi, vừa lọc trùng lặp, bạn sẽ sớm chạm tường hiệu năng: gọi `arr.unshift(x)` trên mảng 100,000 phần tử trong JS phải dịch chuyển toàn bộ ô nhớ `O(N)`, còn tìm phần tử chung giữa hai mảng tốn vòng lặp lồng nhau đắt đỏ.

Trong **Redis 8**, hai bài toán đó được tách thành **2 cấu trúc dữ liệu chuyên biệt tối ưu sát phần cứng**:

- [>] **Redis List (`quicklist`):** Tương đương `collections.deque` của Python (danh sách liên kết hai đầu của các khối `listpack` nén) — đẩy/lấy ở cả hai đầu `LEFT` và `RIGHT` luôn đạt ==`O(1)`== bất kể danh sách dài 10 hay 10 triệu phần tử!
- [+] **Redis Set (`intset` / `listpack` / `hashtable`):** Tương đương `Set<string>` của JS / `set` của Python — tự động khử trùng lặp, kiểm tra sự tồn tại `SISMEMBER` trong ==`O(1)`==, và tính giao (`SINTER`), hợp (`SUNION`), hiệu (`SDIFF`) ngay trên RAM mà không cần kéo dữ liệu về app.
- [!] Cảnh báo sớm: cả List lẫn Set đều cực kỳ dễ biến thành **BigKey không đáy** nếu bạn chỉ biết nhồi thêm (`LPUSH` / `SADD`) mà quên thiết kế cơ chế cắt ngọn (`LTRIM`) hoặc kiểm soát lực lượng (`SCARD`).

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

## 1. Redis List: Băng chuyền hai đầu `quicklist` & 2 mẫu thiết kế bất hủ

> [!ANALOGY] Vì sao Redis không dùng Linked List cổ điển cho List?
> Trong ngôn ngữ C 64-bit, một nút Linked List cổ điển tốn mất `16 bytes` chỉ cho 2 con trỏ `prev` + `next` — nếu lưu chuỗi `"ok"` dài 2 byte thì tiền "vỏ bọc con trỏ" đắt gấp 8 lần dữ liệu thật! Vì vậy Redis dùng **`quicklist`**: một danh sách liên kết hai đầu mà **mỗi mắt xích là cả một khối `listpack`** chứa hàng chục phần tử nằm sát nhau.

Nhờ kiến trúc đó, thao tác ở hai đầu danh sách (`LPUSH`, `RPUSH`, `LPOP`, `RPOP`) đều là **`O(1)`**, trong khi truy cập vào khúc giữa (`LINDEX` ở vị trí xa đầu/đuôi) là **`O(N)`**. Hai mẫu thực chiến quan trọng nhất với List gồm:

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
      - "Luôn ghép cặp **`LPUSH`** với **`LTRIM key 0 (N-1)`** (ví dụ giữ 50 hoạt động gần nhất: `0 49`)."
      - "Đọc trang đầu siêu nhanh bằng `LRANGE key 0 19` (`O(S+E)` rất nhỏ vì tính ngay từ đầu trái)."
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
      - "Nếu chỉ gọi `RPOP` (hoặc `BRPOP`), ngay khoảnh khắc phần tử rời Redis mà Pod worker bị sập nguồn, tác vụ đó **bốc hơi vĩnh viễn**!"
      - "Dùng **`LMOVE src dst RIGHT LEFT`** (hoặc bản chặn chờ `BLMOVE`): vừa lấy khỏi `pending`, vừa cất ngay vào `processing` trong **1 bước nguyên tử**; xử lý xong mới gỡ khỏi `processing`."
    code: |
      LPUSH jobs:pending "invoice-881"
      LMOVE jobs:pending jobs:processing RIGHT LEFT
    codeLang: redis
```

## 2. Redis Set: Khử trùng tự động, `intset` & Phép toán Tập hợp

Khác với List (giữ thứ tự chèn và cho phép trùng lặp), **Redis Set** là tập hợp **không thứ tự và tuyệt đối duy nhất** — thêm `"redis"` 100 lần bằng `SADD` thì trong Set vẫn chỉ có đúng 1 bản sao `"redis"`.

Redis 8 tự động chọn **1 trong 3 biểu diễn nội bộ** cho Set tuỳ theo dữ liệu bạn đưa vào:
1. **`intset`:** Khi **100% thành viên là số nguyên 64-bit** (ví dụ danh sách `userId` số: `1001`, `2048`...) và số lượng `<= 512` (`set-max-intset-entries`). Rất gọn nhẹ và không tốn con trỏ chuỗi!
2. **`listpack`:** Khi Set chứa chuỗi ngắn và ít phần tử (`<= 128`, giới thiệu từ Redis 7.2+ giúp Set chuỗi nhỏ cũng tiết kiệm RAM như Hash).
3. **`hashtable`:** Khi Set lớn hoặc chứa phần tử dài — đảm bảo `SADD`, `SREM`, `SISMEMBER` luôn đạt `O(1)` trung bình.

```visual
kind: anatomy
title: Bộ Lệnh Redis Set & Độ Phức Tạp Cần Thuộc Lòng
subtitle: Cẩn trọng phân biệt nhóm lệnh O(1) siêu nhanh với nhóm lệnh tập hợp O(N)
items:
  - keyword: SADD / SREM / SCARD
    role: O(1) mỗi phần tử
    tone: emerald
    summary: Thêm thành viên mới (`SADD` trả về số phần tử thực sự mới), xoá (`SREM`), và lấy tổng lực lượng tập hợp tức thì (`SCARD` luôn là `O(1)`).
    example: |
      SADD post:99:likes "u:1" "u:2" "u:1"
      SCARD post:99:likes
    lang: redis
  - keyword: SISMEMBER / SMISMEMBER
    role: O(1) / O(K) · Kiểm tra nhanh
    tone: sky
    summary: Kiểm tra 1 phần tử (`SISMEMBER` -> `1` hoặc `0`) hoặc kiểm tra hàng loạt `K` phần tử trong 1 nhịp mạng (`SMISMEMBER` từ Redis 6.2+).
    bullets:
      - "Luôn dùng `SISMEMBER` / `SMISMEMBER` thay vì gọi `SMEMBERS` kéo toàn bộ tập hợp về code JS/Python rồi mới `.includes()`!"
    example: SMISMEMBER post:99:likes "u:1" "u:999"
    lang: redis
  - keyword: SINTER / SUNION / SDIFF
    role: O(N) · Giao / Hợp / Hiệu
    tone: violet
    summary: Tính bạn chung (`SINTER`), gộp nhóm (`SUNION`), hoặc tìm phần tử có ở tập đầu mà chưa có ở các tập sau (`SDIFF`).
    bullets:
      - "Các biến thể `SINTERSTORE`, `SUNIONSTORE`, `SDIFFSTORE` ghi thẳng kết quả vào khoá đích trên RAM để tái sử dụng làm bộ đệm."
      - "Mẹo Redis 7/8: Nếu chỉ cần **đếm số lượng phần tử chung** mà không cần danh sách tên, dùng `SINTERCARD 2 setA setB LIMIT 100` để dừng sớm!"
    example: |
      SINTERSTORE mutual:a:b friends:a friends:b
      SDIFF friends:b friends:a
    lang: redis
```

> [!TRAP] Ba cái bẫy làm sập Redis khi dùng List và Set sai cách
> 1. **Dùng `LRANGE mylist 0 -1` hoặc `SMEMBERS myset` trên tập lớn:** Cả hai đều là `O(N)`. Với Set lớn cần duyệt hết, bắt buộc dùng **`SSCAN key 0 COUNT 200`**.
> 2. **Ghi số nguyên kèm tiền tố chữ vào Set số:** Đổi từ `SADD uids 1001 1002` sang `SADD uids "u_1001" "u_1002"` sẽ ngay lập tức phá vỡ biểu diễn nén **`intset`**, làm lượng RAM tiêu thụ của hàng triệu Set nhỏ tăng gấp nhiều lần!
> 3. **Dùng lệnh cũ `RPOPLPUSH` / `BRPOPLPUSH`:** Các lệnh này đã bị đánh dấu *deprecated* từ Redis 6.2+ — hãy thống nhất dùng **`LMOVE`** và **`BLMOVE`** linh hoạt cả 4 chiều (`LEFT`/`RIGHT`).

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - **List (`quicklist`):** Có thứ tự, cho phép trùng, `O(1)` ở hai đầu. Luôn kẹp **`LPUSH` + `LTRIM`** cho bảng tin giới hạn và dùng **`LMOVE`** cho hàng đợi đơn giản an toàn.
> - **Set (`intset` / `listpack` / `hashtable`):** Không thứ tự, tự khử trùng. Dùng **`SISMEMBER` / `SMISMEMBER`** (`O(1)`/`O(K)`) để kiểm tra thành viên, **`SCARD`** (`O(1)`) để đếm, và **`SINTER` / `SDIFF`** cho bài toán gợi ý & lọc nhãn chung.

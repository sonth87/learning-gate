# Pipelining, MULTI/EXEC/WATCH & Sự thật phũ phàng: Redis KHÔNG Rollback!

Đã bao giờ bạn viết một vòng lặp `for` trong Node.js bắn `await redis.get(...)` **500 lần liên tiếp**, và ngỡ ngàng thấy API mất đứt **`250ms`** dù mỗi câu lệnh trên Redis chỉ tốn `2 micro-giây`?

- [>] Thủ phạm không phải CPU của Redis, mà là **Network Round-Trip Time (RTT)**! Nếu khoảng cách mạng giữa App Pod và Redis Pod mất `0.5ms` khứ hồi, gọi tuần tự 500 lệnh dạng *ping-pong* bắt CPU ngồi chơi xơi nước chờ sóng điện từ chạy đi chạy về đúng `500 * 0.5ms = 250ms`!
- [+] **TCP Pipelining** gom cả 500 câu lệnh tống thẳng vào socket buffer trong **1 chuyến khứ hồi duy nhất**, kéo tổng thời gian từ `250ms` tụt xuống còn ==`~1.2ms`== (nhanh gấp 10–50 lần)!
- [!] Tuy nhiên, rất nhiều kỹ sư đánh đồng **Pipelining** với **Transaction (`MULTI` / `EXEC`)**, và nguy hiểm hơn nữa: mang tư duy `BEGIN ... ROLLBACK` của PostgreSQL sang Redis mà không hề biết rằng ==Redis cố tình KHÔNG hỗ trợ Rollback khi gặp lỗi runtime ở giữa giao dịch==!

```visual
kind: illustration
diagram: redis:r06
alt: Đối chiếu trực quan giữa gửi lệnh tuần tự tốn N vòng RTT, gom chuyến TCP Pipelining 1 RTT và hàng đợi nguyên tử MULTI/EXEC/WATCH của Redis
badge: Tối ưu thông lượng & Giao dịch · Level 2
title: Giải Phẫu TCP Pipelining (1 RTT) vs Hàng Đợi Cô Lập MULTI / EXEC / WATCH
subtitle: Hiểu rõ khi nào chỉ cần gom gói mạng, khi nào cần cô lập tuần tự, và vì sao lỗi kiểu dữ liệu giữa chừng không được Rollback
caption: Nhấn vào sơ đồ để phóng to — quan sát đường đi của gói tin trong Pipeline so với hàng đợi QUEUED của MULTI/EXEC
callouts:
  - num: 1
    label: TCP Pipelining — Triệt Tiêu Độ Trễ Khứ Hồi (RTT)
    desc: Gửi dồn K câu lệnh xuống socket không chờ phản hồi từng cái, giảm cả RTT mạng lẫn số lần chuyển ngữ cảnh syscall read()/write() của nhân Linux.
    tone: emerald
  - num: 2
    label: MULTI / EXEC — Cô Lập Tuần Tự (Serialized Isolation)
    desc: Các lệnh sau MULTI trả về QUEUED; khi gặp EXEC, Redis chạy một mạch toàn bộ hàng đợi trên luồng đơn mà không cho bất kỳ client nào chen ngang.
    tone: sky
  - num: 3
    label: Không Rollback Runtime Error & Khoá Lạc Quan WATCH
    desc: Nếu lệnh #2 bị lỗi WRONGTYPE lúc EXEC, lệnh #1 và #3 vẫn chạy thành công! Muốn đọc-kiểm-tra-rồi-ghi an toàn, phải kẹp WATCH trước MULTI (hoặc dùng Lua ở bài R07).
    tone: rose
```

## 1. Pipelining vs `MULTI/EXEC`: Giống và khác nhau ở điểm nào?

> [!ANALOGY] Hình dung chuyến xe buýt vs đoàn xe ưu tiên hộ tống
> - **Gọi lẻ tuần tự (`await` từng dòng):** Xe chở đúng 1 bức thư chạy tới bưu điện, đợi lấy biên nhận mang về nhà rồi mới quay lại lấy bức thư thứ hai.
> - **Pipelining:** Bạn gom 100 bức thư bỏ vào **1 túi bưu phẩm** gửi đi 1 lần; nhưng tại quầy bưu điện, nhân viên có thể đóng dấu xen kẽ thư của bạn với thư của khách ở quầy bên cạnh (**không đảm bảo tính nguyên tử**).
> - **`MULTI` / `EXEC`:** Nhân viên gom đủ các yêu cầu của bạn vào khay riêng (`QUEUED`); đúng khoảnh khắc bạn hô **`EXEC`**, quầy phục vụ xử lý liền một mạch từ đầu đến cuối khay của bạn rồi mới tiếp khách tiếp theo!

```visual
kind: compare
title: Đối Chiếu TCP Pipelining vs Transaction MULTI / EXEC
subtitle: Trong thực tế, các client như ioredis thường tự động gửi khối MULTI/EXEC qua một Pipeline để đạt cả hai lợi ích!
left:
  badge: TỐI ƯU TỐC ĐỘ MẠNG
  title: Pure Pipelining (Không MULTI)
  tone: emerald
  lang: ts
  code: |
    // ioredis: Gom 3 lệnh độc lập vào 1 vòng mạng (1 RTT)
    const results = await redis
      .pipeline()
      .get('user:1:name')
      .hgetall('cart:1')
      .scard('notify:1')
      .exec();
  bullets:
    - "**Mục tiêu:** Đập tan chi phí chờ mạng `RTT` và giảm syscall hệ điều hành."
    - "**Nguyên tử / Cô lập?** **KHÔNG** — lệnh của client khác hoàn toàn có thể xen vào giữa lệnh 1 và lệnh 2."
    - "**Quy mô lô khuyên dùng:** Chia từng lô **`100 – 1,000` lệnh** (đừng nhồi 500,000 lệnh vào 1 Pipeline kẻo phình bộ đệm RAM phía server!)."
right:
  badge: CÔ LẬP TUẦN TỰ
  title: Transaction MULTI / EXEC
  tone: sky
  lang: redis
  code: |
    MULTI
    DECRBY wallet:u:1 200
    INCRBY wallet:u:2 200
    HSET tx:99 from "1" to "2" amt "200"
    EXEC
  bullets:
    - "**Mục tiêu:** Đảm bảo không có client nào nhìn thấy trạng thái dở dang khi tiền đã trừ ở ví 1 mà chưa cộng vào ví 2."
    - "**Nhược điểm chí mạng:** Bên trong khối `MULTI`, mọi lệnh chỉ trả về chữ **`QUEUED`** — bạn **không thể dùng kết quả `GET` ở dòng 1 để rẽ nhánh `if/else` cho dòng 2**!"
```

## 2. Cú sốc lớn nhất khi từ SQL sang Redis: Vì sao KHÔNG có Rollback?

Tài liệu chính thức của Redis nêu rõ một quyết định thiết kế táo bạo nhằm giữ lõi thực thi cực kỳ đơn giản và nhanh như chớp (không cần duy trì *Undo Log* như InnoDB): **Redis phân biệt 2 loại lỗi trong `MULTI / EXEC`:**

1. **Lỗi cú pháp ngay lúc xếp hàng (Command Queueing Error — trước `EXEC`):** Ví dụ gõ sai tên lệnh `SETX` hoặc truyền thiếu tham số `SET only_one_arg`. Redis phát hiện ngay lúc `QUEUED` và sẽ **tự động từ chối toàn bộ giao dịch** khi bạn gọi `EXEC` (`EXECABORT Transaction discarded because of previous errors`). Bạn cũng có thể chủ động huỷ hàng đợi bất cứ lúc nào bằng **`DISCARD`**.
2. **Lỗi kiểu dữ liệu lúc thực thi (Runtime Error — bên trong `EXEC`):** Ví dụ gọi `INCR` lên một khoá đang là `Hash` hoặc chữ `"abc"`. Cú pháp hoàn toàn đúng nên lúc xếp hàng vẫn báo `QUEUED` ngon lành! Khi chạy `EXEC`:
   - Lệnh 1 (`DECRBY wallet:a 100`) -> **Chạy thành công và giữ nguyên hiệu lực!**
   - Lệnh 2 (`LPUSH wallet:a "oops"` trên khoá String) -> Báo lỗi `(error) WRONGTYPE...`
   - Lệnh 3 (`INCRBY wallet:b 100`) -> **Vẫn tiếp tục chạy thành công!**
   - ==KHÔNG HỀ CÓ ROLLBACK CHO LỆNH 1 VÀ LỆNH 3!==

## 3. Khoá lạc quan `WATCH` (CAS) & Giải phóng không chặn `UNLINK`

Vì bên trong `MULTI` bạn không thể đọc giá trị để kiểm tra điều kiện (ví dụ *"chỉ đặt giá đấu giá mới nếu chưa ai trả cao hơn"*), Redis cung cấp cơ chế **Check-And-Set (CAS)** thông qua **`WATCH`**:

```redis
# 1. Đặt "camera giám sát" lên khoá trước khi mở MULTI
WATCH auction:item:88:bid

# 2. Đọc giá trị hiện tại ở NGOÀI MULTI để ứng dụng kiểm tra điều kiện
GET auction:item:88:bid

# 3. Nếu thoả mãn, mở MULTI xếp hàng cập nhật rồi chốt EXEC
MULTI
SET auction:item:88:bid "350"
SET auction:item:88:winner "u:linh"
EXEC
# -> Nếu giữa lúc WATCH và EXEC có bất kỳ client nào sửa 'auction:item:88:bid',
#    EXEC sẽ lập tức huỷ toàn bộ và trả về (nil) để ứng dụng thử lại!
```

Và một kỹ năng vệ sinh vận hành bắt buộc đi kèm gom lô: **Dọn dẹp không gây giật độ trễ với `UNLINK` & `lazyfree`**:

```visual
kind: anatomy
title: Vệ Sinh Bộ Nhớ Không Chặn Luồng Chính (Non-Blocking Cleanup)
subtitle: Xoá 1 String nhỏ thì DEL và UNLINK như nhau; nhưng xoá 1 Hash/Set/ZSet 500,000 phần tử thì DEL là thuốc độc!
items:
  - keyword: UNLINK k1 [k2 ...]
    role: O(1) trên luồng chính!
    tone: emerald
    summary: Ngắt ngay lập tức tên khoá khỏi bảng băm Keyspace (`O(1)`), rồi ném con trỏ cấu trúc dữ liệu khổng lồ sang **luồng BIO nền** thu hồi `free()` dần dần.
    example: UNLINK big:zset:2025 temp:set:millions
    lang: redis
  - keyword: lazyfree-lazy-expire
    role: Cấu hình tự động
    tone: amber
    summary: Khi một BigKey tự hết hạn `TTL`, mặc định Redis vẫn xoá đồng bộ gây giật! Bật `yes` cho `lazyfree-lazy-expire` và `lazyfree-lazy-eviction` để cả lúc hết hạn lẫn lúc đầy RAM đều thu hồi trên luồng nền.
    example: |
      CONFIG SET lazyfree-lazy-eviction yes
      CONFIG SET lazyfree-lazy-expire yes
    lang: redis
```

> [!TRAP] Khi nào nên bỏ `WATCH + MULTI/EXEC` để chuyển hẳn sang Lua Script (Module R07)?
> Nếu một khoá cực "nóng" (ví dụ tồn kho iPhone lúc mở bán Flash-Sale có 5,000 người bấm cùng giây), dùng `WATCH` sẽ khiến **4,999 người nhận `(nil)` và phải chạy vòng lặp retry liên tục** (*livestock / retry storm*), đốt cháy băng thông mạng! Với khoá độ tranh chấp cao (*high contention*), **Lua Script (`EVAL`)** ở bài kế tiếp mới là chân ái vì chạy 1 phát ăn ngay trên server.

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - **Pipelining** giảm `N` vòng chờ mạng xuống **1 RTT** (chia lô `100–1,000` lệnh; trong Python `redis-py` nhớ truyền `transaction=False` nếu không cần `MULTI`).
> - **`MULTI` / `EXEC`** đảm bảo các lệnh chạy tuần tự cô lập, **`DISCARD`** huỷ hàng đợi đang mở, nhưng **KHÔNG Rollback** nếu một lệnh bị lỗi kiểu dữ liệu lúc chạy!
> - **`WATCH`** theo dõi thay đổi trước `MULTI` để thực hiện Optimistic Locking; luôn ưu tiên **`UNLINK`** + bật **`lazyfree-lazy-*`** thay cho `DEL` khi dọn khoá lớn.

# Pipelining, MULTI/EXEC/WATCH & Sự thật phũ phàng: Redis KHÔNG Rollback!

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Đã bao giờ bạn viết một vòng lặp `for` trong Python hay Node.js gọi `GET` tới Redis **500 lần liên tiếp**, và ngỡ ngàng thấy API chậm mất **`250 mili-giây`** dù mỗi lệnh trên RAM của Redis chỉ mất vỏn vẹn `0.001 mili-giây`?
> - **`RTT` (*Round-Trip Time* — Thời gian khứ hồi mạng):** Giống như bạn đứng ở tầng 1 gửi từng bức thư lên tầng 5 — dù người nhận đọc mất 1 giây, thời gian đi thang máy lên xuống mới là thứ ngốn hết buổi sáng! Nếu mạng nội bộ mất `0.5ms` mỗi chuyến đi-về, gửi lẻ tẻ 500 lệnh bắt ứng dụng ngồi chờ mạng đúng `500 × 0.5ms = 250ms`!
> - **`TCP Pipelining` (Gửi dồn ống dẫn):** Bạn gom cả 500 bức thư bỏ vào **1 túi bưu phẩm gửi đi trong đúng 1 chuyến**, kéo tổng thời gian từ `250ms` tụt xuống còn ==`~1.2ms` (nhanh gấp hàng chục lần)==!
> - **`MULTI / EXEC` (Giao dịch xếp hàng tuần tự):** Gom một nhóm lệnh vào khay riêng để khi bấm nút `EXEC`, Redis cam kết chạy liền một mạch không cho bất kỳ ai chen ngang ở giữa. Nhưng hãy cẩn thận: khác với SQL, ==Redis cố tình KHÔNG tự động hoàn tác (Rollback)== nếu có một lệnh ở giữa bị sai kiểu dữ liệu lúc chạy!
> - **`WATCH` (Khóa lạc quan — *Optimistic Locking*):** Gắn một "camera theo dõi" lên khóa trước khi mở giao dịch; nếu phát hiện có người khác vừa sửa khóa đó trước lúc bạn kịp chốt `EXEC`, toàn bộ giao dịch tự hủy để bạn thử lại an toàn.

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
    desc: Gửi dồn K câu lệnh xuống socket không chờ phản hồi từng cái, giảm cả RTT mạng lẫn số lần chuyển ngữ cảnh đọc/ghi mạng của hệ điều hành.
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

## 1. Pipelining vs `MULTI/EXEC`: Khác nhau thế nào trên Python & Node.js?

> [!ANALOGY] Hình dung Túi bưu phẩm chung vs Quầy phục vụ ưu tiên trọn gói
> - **Pure Pipelining:** Bạn gom 100 lá thư gửi đi trong 1 chuyến xe cho nhanh; nhưng khi tới bưu điện, nhân viên có thể đóng dấu xen kẽ thư của bạn với thư của khách khác (**chỉ tối ưu mạng, không khóa cô lập**).
> - **`MULTI` / `EXEC`:** Nhân viên gom toàn bộ yêu cầu của bạn vào khay riêng (`QUEUED`); tới lúc gọi **`EXEC`**, quầy phục vụ khóa cửa xử lý trọn vẹn từ đầu tới cuối khay của bạn rồi mới tiếp người kế tiếp!

```visual
kind: compare
title: Đối Chiếu Pure Pipelining vs Transaction MULTI / EXEC
subtitle: Lưu ý khác biệt cực kỳ quan trọng giữa Python redis-py và Node.js ioredis khi gọi .pipeline()!
left:
  badge: TỐI ƯU TỐC ĐỘ MẠNG (1 RTT)
  title: Pure Pipelining (Không bọc MULTI/EXEC)
  tone: emerald
  lang: python
  code: |
    # Python (redis-py): Truyền transaction=False để dùng Pure Pipeline!
    # (Mặc định r.pipeline() trong redis-py có bọc sẵn MULTI/EXEC)
    pipe = r.pipeline(transaction=False)
    pipe.get("user:1:name")
    pipe.hgetall("cart:1")
    pipe.scard("notify:1")
    name, cart, unread = pipe.execute()  # Chỉ tốn 1 RTT!
  bullets:
    - "**Trên Node.js (`ioredis`):** `redis.pipeline()` mặc định là Pure Pipeline (còn `redis.multi()` mới bọc `MULTI/EXEC`)."
    - "**Nguyên tử / Cô lập?** **KHÔNG** — lệnh của kết nối khác có thể xen vào giữa các lệnh trong lô."
    - "**Kích thước lô khuyên dùng:** Chia từng mẻ **`100 – 1,000` lệnh** (tránh nhồi 500,000 lệnh vào 1 Pipeline làm phình bộ đệm RAM trên máy chủ!)."
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
    - "**Mục tiêu:** Đảm bảo không ai nhìn thấy trạng thái dở dang khi tiền đã trừ ở ví 1 mà chưa cộng vào ví 2."
    - "**Giới hạn cần nhớ:** Bên trong khối `MULTI`, mọi lệnh chỉ trả về chữ **`QUEUED`** — bạn **không thể đọc kết quả `GET` ở dòng 1 để viết `if/else` cho dòng 2**!"
```

## 2. Cú sốc lớn nhất khi từ SQL sang Redis: Vì sao KHÔNG có Rollback?

Để giữ lõi thực thi trên RAM cực kỳ gọn nhẹ và đạt tốc độ hàng trăm ngàn lệnh/giây (không phải ghi sổ hoàn tác *Undo Log* nặng nề như PostgreSQL/MySQL), Redis xử lý 2 nhóm lỗi trong `MULTI / EXEC` hoàn toàn khác nhau:

1. **Lỗi cú pháp ngay lúc xếp hàng (*Queueing Error* — trước khi gọi `EXEC`):** Ví dụ gõ sai tên lệnh `SETX` hoặc truyền thiếu đối số. Redis phát hiện ngay lúc trả `QUEUED` và sẽ **tự động hủy sạch cả giao dịch** khi gặp `EXEC` (`EXECABORT`). Bạn cũng có thể chủ động hủy hàng đợi bằng lệnh **`DISCARD`**.
2. **Lỗi kiểu dữ liệu lúc chạy thật (*Runtime Error* — bên trong `EXEC`):** Ví dụ gọi `LPUSH` lên một khóa đang lưu kiểu `String`. Vì cú pháp câu lệnh hoàn toàn hợp lệ nên lúc xếp hàng vẫn báo `QUEUED` bình thường! Tới khi chạy `EXEC`:
   - Lệnh 1 (`DECRBY wallet:a 100`) -> **Chạy thành công và giữ nguyên kết quả!**
   - Lệnh 2 (`LPUSH wallet:a "oops"` sai kiểu) -> Trả về lỗi `(error) WRONGTYPE...`
   - Lệnh 3 (`INCRBY wallet:b 100`) -> **Vẫn tiếp tục chạy thành công!**
   - ==Tuyệt đối KHÔNG có chuyện tự động Rollback lệnh 1 và lệnh 3 như SQL!==

## 3. Khóa lạc quan `WATCH` (Check-And-Set) & Dọn dẹp êm ái với `UNLINK`

Vì bên trong `MULTI` bạn không thể đọc dữ liệu ra để rẽ nhánh điều kiện (như *"chỉ cập nhật giá đấu giá mới nếu chưa có ai trả giá cao hơn"*), Redis cung cấp cơ chế **Kiểm tra rồi mới Ghi (*Check-And-Set*)** thông qua **`WATCH`**:

```redis
# 1. Gắn "camera giám sát" lên khoá TRƯỚC khi mở MULTI
WATCH auction:item:88:bid

# 2. Đọc giá hiện tại ở NGOÀI MULTI để ứng dụng kiểm tra điều kiện
GET auction:item:88:bid

# 3. Nếu hợp lệ, mở MULTI xếp hàng cập nhật rồi chốt EXEC
MULTI
SET auction:item:88:bid "350"
SET auction:item:88:winner "u:linh"
EXEC
# -> Nếu giữa lúc WATCH và EXEC có người khác sửa 'auction:item:88:bid',
#    EXEC lập tức huỷ toàn bộ và trả về (nil) để ứng dụng đọc lại và thử lại!
```

Đi kèm với kỹ thuật gom lô là kỷ luật **dọn dẹp bộ nhớ không chặn luồng chính** bằng **`UNLINK`** và cơ chế **`lazyfree`**:

```visual
kind: anatomy
title: Vệ Sinh Bộ Nhớ Không Chặn Luồng Chính (Non-Blocking Cleanup)
subtitle: Xoá 1 String nhỏ thì DEL và UNLINK như nhau; nhưng xoá 1 Hash/Set/ZSet 500,000 phần tử thì DEL là thuốc độc!
items:
  - keyword: UNLINK k1 [k2 ...]
    role: O(1) trên luồng chính!
    tone: emerald
    summary: Tháo ngay lập tức nhãn tên khoá khỏi bảng tra cứu chính (`O(1)`), rồi chuyển vùng nhớ khổng lồ sang **luồng dọn rác chạy nền (BIO Thread)** thu hồi êm ái.
    example: UNLINK big:zset:2025 temp:set:millions
    lang: redis
  - keyword: lazyfree-lazy-expire
    role: Cấu hình dọn nền tự động
    tone: amber
    summary: Khi một khoá lớn tự hết hạn `TTL`, mặc định cũ vẫn xoá đồng bộ gây giật! Bật `yes` cho ==`lazyfree-lazy-expire` và `lazyfree-lazy-eviction`== để mọi khâu thu hồi đều diễn ra ở luồng nền.
    example: |
      CONFIG SET lazyfree-lazy-eviction yes
      CONFIG SET lazyfree-lazy-expire yes
    lang: redis
```

> [!TIP] Khi nào nên dừng dùng `WATCH + MULTI/EXEC` để chuyển sang Lua Script (Mô-đun `R07`)?
> Nếu một khóa có độ tranh chấp cực cao (ví dụ tồn kho sản phẩm Flash Sale có 5,000 người bấm mua trong cùng 1 giây), dùng `WATCH` sẽ khiến **4,999 kết nối bị hủy nhận `(nil)` và phải chạy vòng lặp thử lại liên tục** (*Retry Storm*), gây nghẽn mạng vô ích! Khi đó, **Lua Script (`EVAL`)** ở bài kế tiếp mới là giải pháp chuẩn vì kiểm tra và trừ kho trọn gói ngay trên máy chủ chỉ trong 1 lần gọi.

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - **Pipelining** gom `N` lệnh vào **1 chuyến mạng (1 RTT)** (chia lô `100–1,000` lệnh; trong Python `redis-py` dùng `r.pipeline(transaction=False)` khi chỉ cần gom mạng thuần túy).
> - **`MULTI` / `EXEC`** chạy các lệnh liền mạch không bị chen ngang, **`DISCARD`** hủy khay chờ, nhưng **KHÔNG Rollback** khi gặp lỗi kiểu dữ liệu lúc thực thi!
> - Dùng **`WATCH`** trước `MULTI` cho khóa lạc quan ít va chạm, và luôn ưu tiên **`UNLINK`** + **`lazyfree-lazy-*`** thay cho `DEL` trên khóa lớn.

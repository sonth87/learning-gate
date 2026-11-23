# Pipelining, MULTI/EXEC/WATCH và cơ chế Transaction không Rollback trong Redis

> [!NOTE] Khái niệm cốt lõi & Bài toán thực tế
> Khi ứng dụng chạy vòng lặp gọi `GET` tới Redis **500 lần liên tiếp**, tổng thời gian có thể lên tới **`250 mili-giây`** dù thời gian xử lý mỗi lệnh trên RAM của Redis chưa tới `0.001 mili-giây`. Nguyên nhân nằm ở chi phí mạng, và Redis cung cấp các cơ chế sau để tối ưu và kiểm soát giao dịch:
> - **`RTT` (*Round-Trip Time* — Thời gian khứ hồi mạng):** Thời gian một gói tin đi từ ứng dụng tới Redis và nhận phản hồi quay về. Nếu RTT nội mạng là `0.5ms`, gửi tuần tự 500 lệnh riêng lẻ sẽ mất ít nhất `500 × 0.5ms = 250ms` chỉ để chờ mạng.
> - **`TCP Pipelining` (Gửi gộp theo lô):** Gửi dồn cả 500 lệnh qua socket TCP trong **1 lần gửi** và nhận lại 500 kết quả trong 1 lượt, kéo tổng thời gian từ `250ms` xuống còn ==`~1.2ms`==.
> - **`MULTI / EXEC` (Transaction tuần tự):** Đưa một nhóm lệnh vào hàng đợi (`QUEUED`) và thực thi liền mạch từ đầu tới cuối khi gọi `EXEC`, đảm bảo không có client nào xen ngang ở giữa. Tuy nhiên, khác với SQL, ==Redis không tự động Rollback== nếu một lệnh bên trong gặp lỗi kiểu dữ liệu khi thực thi.
> - **`WATCH` (Khóa lạc quan — *Optimistic Locking*):** Theo dõi một hoặc nhiều khóa trước khi mở `MULTI`; nếu khóa bị client khác thay đổi trước thời điểm `EXEC`, giao dịch tự động hủy để ứng dụng đọc lại và thử lại an toàn.

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

> [!NOTE] Phân biệt trực tiếp: Pure Pipelining vs Transaction `MULTI / EXEC`
> - **Pure Pipelining:** Gửi nhiều lệnh cùng lúc để giảm số vòng mạng `RTT`, nhưng trên server Redis các lệnh từ client khác vẫn có thể thực thi xen kẽ giữa các lệnh trong lô (**tối ưu mạng, không cô lập**).
> - **`MULTI` / `EXEC`:** Redis xếp toàn bộ lệnh vào hàng đợi (`QUEUED`); khi nhận **`EXEC`**, luồng chính thực thi liên tiếp trọn bộ hàng đợi của bạn trước khi chuyển sang lệnh của client khác (**cô lập tuần tự**).

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

## 2. Khác biệt quan trọng giữa Redis Transaction và SQL: Vì sao Redis không hỗ trợ Rollback?

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
subtitle: Xoá 1 String nhỏ thì DEL và UNLINK tương đương; nhưng xoá 1 Hash/Set/ZSet 500,000 phần tử thì DEL sẽ chặn luồng chính gây giật độ trễ!
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

> [!REMEMBER] Ghi nhớ cốt lõi
> - **Pipelining** gom `N` lệnh vào **1 chuyến mạng (1 RTT)** (chia lô `100–1,000` lệnh; trong Python `redis-py` dùng `r.pipeline(transaction=False)` khi chỉ cần gom mạng thuần túy).
> - **`MULTI` / `EXEC`** chạy các lệnh liền mạch không bị chen ngang, **`DISCARD`** hủy khay chờ, nhưng **KHÔNG Rollback** khi gặp lỗi kiểu dữ liệu lúc thực thi!
> - Dùng **`WATCH`** trước `MULTI` cho khóa lạc quan ít va chạm, và luôn ưu tiên **`UNLINK`** + **`lazyfree-lazy-*`** thay cho `DEL` trên khóa lớn.

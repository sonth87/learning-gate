# Strings (SDS), vòng đời TTL & kỷ luật Keyspace không làm đóng băng Server

Trong JavaScript hay Python, `string` là kiểu dữ liệu cơ bản đến mức chẳng ai bận tâm bên dưới nó lưu thế nào. Nhưng khi bước sang **Redis 8**, kiểu **String** không đơn thuần là văn bản — nó là một vùng nhớ nhị phân linh hoạt (*binary-safe* tối đa `512MB`) đóng cùng lúc **4 vai trò sống còn** của mọi hệ thống lớn:

- [>] **Bộ đệm phản hồi siêu tốc (Cache):** Lưu JSON, HTML fragment hoặc Protobuf nhị phân kèm hạn sống tự huỷ (`EX` / `PX`).
- [+] **Bộ đếm nguyên tử 64-bit (`INCR` / `DECRBY`):** Đếm lượt xem, giới hạn tốc độ (*Rate Limiter*), trừ tồn kho đơn giản mà không sợ hai request ghi đè nhau.
- [+] **Cổng khoá chống trùng lặp (`SET key val NX EX`):** Chặn thanh toán đúp (*Idempotency Key*) hoặc bầu chọn tiến trình giữ khoá phân tán chỉ trong **1 nhịp mạng nguyên tử**.
- [!] Tuy nhiên, đặt hàng chục triệu String vào chung một không gian phẳng mà thiếu **quy chuẩn đặt tên**, quên gắn **TTL** hoặc lỡ tay gõ **`KEYS *`** là con đường ngắn nhất dẫn tới màn hình cảnh báo đỏ rực lúc 2 giờ sáng!

```visual
kind: illustration
diagram: redis:r01
alt: Giải phẫu cấu trúc chuỗi động SDS, tổ hợp cờ nguyên tử SET NX EX và vòng đời xoá khoá hết hạn Lazy + Active TTL
badge: Nền tảng cốt lõi · Strings & Keyspace
title: Giải Phẫu SDS String, Cổng Nguyên Tử SET NX EX & Cơ Chế Hết Hạn Kép
subtitle: Vì sao Redis không dùng chuỗi C kết thúc bằng '\0' và cách Redis tự dọn rác TTL mà không cần quét toàn bộ RAM mỗi giây
caption: Nhấn vào sơ đồ để phóng to — đối chiếu 3 cơ chế biểu diễn nội bộ (int, embstr, raw) và hai nhánh thu hồi TTL (Thụ động vs Chủ động)
callouts:
  - num: 1
    label: SDS (Simple Dynamic String) & 3 Encoding
    desc: Lưu sẵn trường len ở đầu giúp STRLEN chạy O(1), an toàn nhị phân (chứa được ảnh/msgpack có byte 0x00) và tối ưu bộ nhớ theo kích thước (int / embstr <= 44B / raw).
    tone: sky
  - num: 2
    label: Tổ Hợp Nguyên Tử SET ... NX EX
    desc: Gom kiểm tra chưa tồn tại (NX) + ghi giá trị + hẹn giờ tự huỷ (EX) vào 1 lệnh duy nhất, triệt tiêu lỗi khoá mồ côi khi app sập giữa chừng.
    tone: emerald
  - num: 3
    label: Lazy + Active Expiration & Con Trỏ SCAN
    desc: Xoá lười khi có người chạm vào kết hợp lấy mẫu ngẫu nhiên định kỳ 10 lần/giây; tuyệt đối duyệt Keyspace bằng con trỏ SCAN thay cho KEYS *.
    tone: amber
```

## 1. Bên dưới Redis String: SDS và 3 hình thái tiết kiệm RAM

> [!ANALOGY] So sánh nhanh với `string` trong C / JS / Python
> Chuỗi C truyền thống kết thúc bằng ký tự rỗng `\0`: muốn biết độ dài phải đếm từng byte `O(N)` và không thể lưu dữ liệu nhị phân chứa byte `0`. Ngược lại, **SDS (*Simple Dynamic String*)** của Redis giống như `Buffer` trong Node.js hay `bytes` trong Python kèm header `len` & `alloc`: lấy độ dài `STRLEN` luôn là ==`O(1)`== và lưu mọi định dạng nhị phân an toàn tuyệt đối!

Hơn thế nữa, gọi `OBJECT ENCODING <key>` trên Redis 8 sẽ cho bạn thấy Redis tự động chọn 1 trong 3 cách đóng gói nội bộ để ép nhỏ từng byte RAM:

| Encoding nội bộ | Khi nào Redis tự kích hoạt? | Lợi ích thực chiến |
| --- | --- | --- |
| **`int`** | Chuỗi là số nguyên có dấu 64-bit (ví dụ `"42"`, `"100050"`) | Lưu thẳng số nguyên 8 byte trong con trỏ `robj` — **không cấp phát thêm chuỗi**, giúp `INCR`/`DECR` chạy nhanh như tia chớp! |
| **`embstr`** | Chuỗi văn bản ngắn **từ `44 bytes` trở xuống** (UUID, mã OTP, trạng thái ngắn) | Chỉ gọi `malloc` **1 lần duy nhất** ghép liền `redisObject` + `sdshdr` trên cùng 1 dòng CPU Cache (`64B`) |
| **`raw`** | Chuỗi dài **`> 44 bytes`** hoặc sau khi bị sửa đổi bằng `APPEND` | Cấp phát vùng đệm động độc lập, hỗ trợ *pre-allocation* tránh xin lại bộ nhớ liên tục |

## 2. Sức mạnh của các lệnh String `O(1)` & Cổng nguyên tử `SET NX EX`

```visual
kind: anatomy
title: Bộ Tứ Lệnh String Thực Chiến Mọi Backend Đều Dùng Hàng Ngày
subtitle: Luôn kiểm tra độ phức tạp Big-O và tính nguyên tử trước khi đưa vào luồng chịu tải cao
items:
  - keyword: SET k v NX EX s
    role: O(1) · Cổng nguyên tử
    tone: emerald
    summary: Chỉ ghi khi khoá CHƯA tồn tại (`NX`) và gắn ngay thời gian sống `s` giây (`EX`) trong đúng 1 lệnh.
    bullets:
      - "Trả về `OK` nếu chiếm quyền thành công; trả về `(nil)` nếu đã có request khác giữ trước."
      - "Cờ bổ sung cực hay: `XX` (chỉ ghi đè khi đã tồn tại), `KEEPTTL` (cập nhật giá trị mới nhưng giữ nguyên đồng hồ đếm ngược cũ!), `GET` (ghi mới và trả về giá trị cũ)."
    example: SET pay:idem:ord-882 processing NX EX 300
    lang: redis
  - keyword: INCR / DECRBY
    role: O(1) · Bộ đếm 64-bit
    tone: sky
    summary: Tăng/giảm số nguyên 64-bit nguyên tử ngay trên RAM — không bao giờ bị mất lượt đếm khi 1,000 request ập vào cùng mili-giây.
    bullets:
      - "Nếu khoá chưa tồn tại, Redis tự coi giá trị khởi đầu bằng `0` trước khi cộng/trừ."
      - "Dùng `INCRBYFLOAT` khi cần cộng số thực (như điểm thưởng thập phân)."
    example: |
      INCR ratelimit:ip:203.0.113.9:1200
      DECRBY promo:voucher:remaining 1
    lang: redis
  - keyword: MSET / MGET
    role: O(K) · Gom lô 1 vòng mạng
    tone: cyan
    summary: Đọc hoặc ghi cùng lúc `K` khoá chỉ tốn **1 lần khứ hồi mạng (1 RTT)** thay vì `K` lần gọi lẻ tẻ.
    bullets:
      - "Giảm thời gian chờ mạng xuống gấp 10–50 lần khi cần nạp danh sách cấu hình hoặc thông tin nhiều sản phẩm."
    example: |
      MSET cfg:tax "0.08" cfg:currency "VND"
      MGET cfg:tax cfg:currency
    lang: redis
  - keyword: GETDEL
    role: O(1) · Đọc & huỷ 1 lần
    tone: amber
    summary: Lấy giá trị ra và xoá khoá ngay lập tức một cách nguyên tử — sinh ra để xử lý mã OTP hoặc OAuth Authorization Code dùng 1 lần!
    example: GETDEL auth:otp:u-9042
    lang: redis
```

> [!TRAP] Tuyệt đối KHÔNG viết `SETNX` rồi mới gọi `EXPIRE` ở dòng thứ hai!
> Nếu tiến trình Node.js/Python của bạn vừa chạy xong `SETNX lock:order:99 1` mà bị Pod OOMKilled hoặc rớt mạng **trước khi** kịp gửi dòng `EXPIRE lock:order:99 30`, khoá đó sẽ có `TTL = -1` (tồn tại vĩnh viễn) và gây **Deadlock toàn bộ đơn hàng 99 mãi mãi**! Từ Redis 2.6.12+ tới Redis 8, luôn gộp thành **1 lệnh duy nhất**: `SET lock:order:99 <token> NX EX 30`.

## 3. Vòng đời TTL (Lazy + Active Expiration) & Kỷ luật đặt tên Keyspace

Một khoá trong Redis khi kiểm tra bằng `TTL <key>` (đơn vị giây) hoặc `PTTL <key>` (mili-giây) luôn rơi vào 1 trong 3 trạng thái rõ ràng:
- **`>= 0`:** Số giây/mili-giây còn lại trước khi bốc hơi.
- **`-1`:** Khoá tồn tại nhưng **bền vững vĩnh viễn** (chưa đặt hạn hoặc vừa được gỡ hạn bằng `PERSIST <key>`).
- **`-2`:** Khoá **không tồn tại** (chưa từng tạo, đã bị xoá, hoặc đã hết hạn).

*Làm sao Redis xoá hàng triệu khoá hết hạn đúng giờ mà không tốn CPU quét toàn bộ RAM mỗi giây?* Redis phối hợp nhịp nhàng **2 cơ chế kép**:
1. **Lazy Expiration (Xoá thụ động khi truy cập):** Bất cứ khi nào client gọi `GET`, `TTL`, `EXISTS`... chạm vào khoá, Redis kiểm tra đồng hồ hạn sống trước tiên — nếu đã quá hạn thì xoá ngay tại chỗ và trả về `(nil)` / `-2`.
2. **Active Expiration (Lấy mẫu chủ động định kỳ):** Mỗi giây 10 lần (`hz 10`), Redis bốc ngẫu nhiên 20 khoá trong nhóm có gắn TTL; nếu thấy **hơn 25%** số mẫu đã hết hạn, nó lập tức lặp lại chu kỳ bốc mẫu ngay để tránh rác nằm chết ngốn RAM dù không ai đọc tới!

### Kỷ luật sống còn trên Production: Đặt tên phân cấp & Cấm tiệt `KEYS *`

Quy ước chuẩn ngành là ghép các phân đoạn bằng dấu hai chấm `:` từ tổng quát đến cụ thể: **`<service>:<entity>:<id>[:<attribute>]`** (ví dụ `billing:invoice:inv-2026-88:pdf` hoặc `auth:session:u-4019`). Và khi cần tìm kiếm hoặc dọn dẹp theo mẫu, hãy nhìn sự khác biệt sinh tử dưới đây:

```visual
kind: compare
title: Quét Khoá Trên Production — Thảm Hoạ KEYS * vs Con Trỏ An Toàn SCAN
subtitle: Cùng tìm các khoá theo mẫu `sess:expired:*` trên 20 triệu key nhưng số phận máy chủ trái ngược hoàn toàn
left:
  badge: CẤM TRÊN PRODUCTION
  title: KEYS sess:expired:* (O(N) Blocking)
  tone: rose
  lang: redis
  code: |
    # Chặn đứng Event Loop suốt 450ms!
    KEYS sess:expired:*
    DEL sess:expired:1 sess:expired:2
  bullets:
    - "Quét một mạch toàn bộ 20 triệu entry của bảng băm trước khi trả kết quả — **không thể dừng giữa chừng**."
    - "Làm vọt độ trễ mọi API khác, thậm chí khiến Sentinel/Cluster tưởng node đã chết và kích hoạt **Failover giả**!"
    - "Xoá bằng `DEL` trên khoá lớn còn bồi thêm cú giật thu hồi bộ nhớ đồng bộ."
right:
  badge: CHUẨN REDIS 8
  title: SCAN cursor MATCH ... COUNT ... + UNLINK
  tone: emerald
  lang: python
  code: |
    cursor = 0
    while True:
        cursor, keys = r.scan(cursor=cursor, match="sess:expired:*", count=200)
        if keys:
            r.unlink(*keys)  # Giải phóng RAM ở luồng BIO nền!
        if cursor == 0:
            break
  bullets:
    - "Mỗi bước `SCAN` chỉ đi qua ~`200` slot bảng băm (`< 0.1ms`), nhường đường cho hàng ngàn lệnh `GET`/`SET` khác chạy xen kẽ mượt mà."
    - "Bắt đầu với `cursor = 0` và kết thúc khi máy chủ trả lại **`cursor == 0`**."
    - "Lưu ý: `COUNT` chỉ là gợi ý số slot băm cần dò (lô trả về có thể rỗng dù chưa hết dữ liệu) và `SCAN` có thể trả trùng khoá nếu bảng băm đang co giãn — hãy thiết kế thao tác xử lý có tính *idempotent*."
```

> [!TIP] Mẹo chống bão Cache Avalanche khi đặt TTL hàng loạt
> Nếu bạn nạp 50,000 sản phẩm vào cache lúc 00:00 và đặt cứng tất cả `EX 3600`, đúng 01:00 cả 50,000 khoá sẽ **bốc hơi cùng một giây**, đẩy toàn bộ tải đập thẳng xuống PostgreSQL! Hãy luôn cộng thêm một khoảng nhiễu ngẫu nhiên (**TTL Jitter**): `ttl = 3600 + Math.floor(Math.random() * 300)`.

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - **SDS String** lấy `STRLEN` trong `O(1)`, an toàn nhị phân và tự động nén thành `int` (số 64-bit) hoặc `embstr` (`<= 44B`).
> - Luôn dùng **`SET key val NX EX seconds`** nguyên tử thay cho cặp `SETNX` + `EXPIRE` rời rạc; dùng **`GETDEL`** cho mã dùng 1 lần.
> - Mã trả về của `TTL`: **`-2`** = không tồn tại · **`-1`** = tồn tại vĩnh viễn không hạn · **`>= 0`** = số giây còn sống.
> - **Tuyệt đối không chạy `KEYS` trên Production** — luôn lặp con trỏ **`SCAN 0 MATCH ... COUNT ...`** kết hợp **`UNLINK`**.

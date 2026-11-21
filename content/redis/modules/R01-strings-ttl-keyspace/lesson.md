# Strings (SDS), vòng đời TTL & kỷ luật Keyspace không làm đóng băng Server

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Trong bất kỳ ngôn ngữ nào (Python, JavaScript, Go, Java), chuỗi ký tự (`string`) là kiểu dữ liệu quen thuộc nhất. Khi bước sang **Redis**, cặp **`Key -> String Value`** giống như những **chiếc hộp đựng đồ có dán nhãn tên bên ngoài và gắn đồng hồ hẹn giờ tự hủy**:
> - **`Key` (Nhãn định danh):** Tên duy nhất của chiếc hộp, thường đặt theo cấu trúc thư mục phân cấp bằng dấu hai chấm như `auth:otp:user_42` để nhìn vào biết ngay thuộc dịch vụ nào.
> - **`TTL` (*Time-To-Live* — Thời gian sống tự hủy):** Giống tin nhắn tự xóa trên ứng dụng chat — bạn hẹn `120 giây` (`EX 120`), đúng 2 phút sau mã OTP tự động bốc hơi khỏi RAM mà bạn không cần viết hàm dọn rác!
> - **`SDS` (*Simple Dynamic String* — Chuỗi động thông minh của Redis):** Trong ngôn ngữ C truyền thống, chuỗi văn bản kết thúc bằng ký tự rỗng `\0`, nên muốn biết chuỗi dài bao nhiêu phải đếm từng chữ từ đầu đến cuối (`O(N)`), và không lưu được file ảnh vì ảnh có chứa byte `0`. Redis tự thiết kế vỏ hộp **SDS** ghi sẵn con số độ dài **`len`** và dung lượng **`alloc`** ngay ngoài nắp hộp — hỏi độ dài `STRLEN` trả lời ngay lập tức (`O(1)`) và chứa được cả văn bản, JSON lẫn dữ liệu nhị phân (ảnh, Protobuf, MessagePack) tối đa `512MB`!
> - **`Nguyên tử` (*Atomic*):** Một thao tác chạy trọn vẹn từ đầu đến cuối trong 1 nhịp không thể bị ai cắt ngang.

Trên thực tế Production, kiểu **Redis String** đảm nhiệm cùng lúc **4 vai trò trụ cột**:

- [>] **Bộ đệm phản hồi siêu tốc (*Cache*):** Lưu chuỗi JSON hoặc dữ liệu nhị phân kèm đồng hồ tự hủy (`EX` tính bằng giây / `PX` tính bằng mili-giây).
- [+] **Bộ đếm nguyên tử 64-bit (`INCR` / `DECRBY`):** Đếm lượt xem video, đếm số lần nhập sai mật khẩu (*Rate Limiter*), trừ phiếu giảm giá mà ==không bao giờ bị sai lệch khi hàng nghìn người bấm cùng lúc==.
- [+] **Chốt chặn chống trùng lặp (`SET key val NX EX`):** Ngăn khách bấm đúp thanh toán 2 lần (*Idempotency Key*) chỉ trong **1 nhịp mạng nguyên tử**.
- [!] Tuy nhiên, nhồi hàng chục triệu khóa vào chung một kho RAM mà thiếu **quy chuẩn đặt tên**, quên gắn **`TTL`** hoặc lỡ tay gõ **`KEYS *`** là nguyên nhân hàng đầu gây tràn RAM và treo hệ thống!

```visual
kind: illustration
diagram: redis:r01
alt: Giải phẫu cấu trúc chuỗi động SDS, tổ hợp cờ nguyên tử SET NX EX và vòng đời xoá khoá hết hạn Lazy + Active TTL
badge: Nền tảng cốt lõi · Strings & Keyspace
title: Giải Phẫu SDS String, thao tác nguyên tử SET NX EX & Cơ Chế Hết Hạn Kép
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

## 1. Bên dưới nắp hộp Redis String: `SDS` và 3 hình thái ép nhỏ từng byte RAM

> [!ANALOGY] Hình dung vỏ hộp co giãn thông minh của SDS
> Tưởng tượng chuỗi C cổ điển là dải băng giấy không ghi kích thước, mỗi lần nối thêm chữ là phải đi cắt dán sang tờ giấy mới. Còn **SDS** giống chiếc hộp ghi rõ ngoài bìa: *"Đang chứa `len = 8` byte, hộp rộng `alloc = 16` byte"*. Lấy độ dài `STRLEN` luôn đạt ==độ phức tạp hằng số `O(1)`== và chứa mọi định dạng `bytes` (Python) hay `Buffer` (Node.js) an toàn tuyệt đối!

Khi bạn gõ `OBJECT ENCODING <key>`, Redis 8 tự động chọn **1 trong 3 cách đóng gói nội bộ (*Encoding*)** tùy theo nội dung bạn lưu để tiết kiệm RAM tối đa:

| Encoding nội bộ | Khi nào Redis tự kích hoạt? | Lợi ích thực chiến |
| --- | --- | --- |
| **`int`** | Chuỗi là số nguyên 64-bit (ví dụ `"42"`, `"100050"`) | Lưu thẳng con số 8 byte vào khung quản lý — **không tốn thêm bộ nhớ chuỗi**, giúp `INCR`/`DECR` chạy nhanh như tia chớp! |
| **`embstr`** | Chuỗi văn bản ngắn **từ `44 bytes` trở xuống** (UUID, mã OTP, trạng thái đơn) | Cấp phát bộ nhớ liền 1 khối duy nhất vừa khít **1 dòng bộ nhớ đệm CPU (`64B` Cache Line)** |
| **`raw`** | Chuỗi dài **`> 44 bytes`** (như cục JSON sản phẩm) hoặc sau khi nối chuỗi bằng `APPEND` | Cấp phát vùng đệm động độc lập, tự chừa khoảng trống dự phòng để tránh xin lại RAM liên tục |

## 2. Bộ tứ lệnh String `O(1)` & Thao tác gộp nguyên tử `SET ... NX EX`

```visual
kind: anatomy
title: Bộ Tứ Lệnh String Thực Chiến Mọi Backend Đều Dùng Hàng Ngày
subtitle: Luôn kiểm tra độ phức tạp Big-O và tính nguyên tử trước khi đưa vào luồng chịu tải cao
items:
  - keyword: SET k v NX EX s
    role: O(1) · thao tác nguyên tử
    tone: emerald
    summary: Chỉ ghi khi khoá CHƯA tồn tại (`NX` — Not eXists) và gắn ngay thời gian sống `s` giây (`EX` — EXpire) trong đúng 1 lệnh.
    bullets:
      - "Trả về `OK` nếu chiếm quyền thành công; trả về `(nil)` / `None` nếu đã có request khác giữ trước."
      - "Cờ bổ sung cực hữu ích: `XX` (chỉ ghi đè khi đã tồn tại), `KEEPTTL` (cập nhật giá trị mới nhưng giữ nguyên đồng hồ đếm ngược cũ!), `GET` (ghi mới và trả về giá trị cũ)."
    example: SET pay:idem:ord-882 processing NX EX 300
    lang: redis
  - keyword: INCR / DECRBY
    role: O(1) · Bộ đếm 64-bit
    tone: sky
    summary: Tăng/giảm số nguyên 64-bit nguyên tử ngay trên RAM — không bao giờ mất lượt đếm khi 1,000 request ập vào cùng mili-giây.
    bullets:
      - "Nếu khoá chưa tồn tại, Redis tự khởi tạo giá trị bằng `0` rồi mới thực hiện cộng/trừ."
      - "Dùng `INCRBYFLOAT` khi cần cộng số thực thập phân."
    example: |
      INCR ratelimit:ip:203.0.113.9:1200
      DECRBY promo:voucher:remaining 1
    lang: redis
  - keyword: MSET / MGET
    role: O(K) · Gom lô 1 vòng mạng
    tone: cyan
    summary: Đọc hoặc ghi cùng lúc `K` khoá chỉ tốn **1 chuyến khứ hồi mạng (1 RTT)** thay vì gọi `GET` lẻ tẻ `K` lần.
    bullets:
      - "Giảm thời gian chờ mạng xuống gấp 10–50 lần khi cần nạp danh sách cấu hình hoặc thông tin nhiều sản phẩm."
    example: |
      MSET cfg:tax "0.08" cfg:currency "VND"
      MGET cfg:tax cfg:currency
    lang: redis
  - keyword: GETDEL
    role: O(1) · Đọc & huỷ 1 lần
    tone: amber
    summary: Lấy giá trị ra và xoá khoá ngay lập tức trong 1 nhịp nguyên tử — sinh ra để xử lý mã OTP hoặc OAuth Code dùng đúng 1 lần!
    example: GETDEL auth:otp:u-9042
    lang: redis
```

> [!WARNING] Tuyệt đối KHÔNG viết `SETNX` rồi mới gọi `EXPIRE` ở câu lệnh thứ hai!
> Giả sử ứng dụng Python, Go hay Node.js của bạn vừa chạy xong dòng 1 `SETNX lock:order:99 1` thì container bị khởi động lại hoặc rớt mạng **trước khi** kịp gửi dòng 2 `EXPIRE lock:order:99 30`. Hậu quả: khóa đó mang `TTL = -1` — trở thành ==khóa bất tử (Zombie Key)== nằm lì trên RAM và làm kẹt cứng đơn hàng số 99 mãi mãi! Luôn gộp thành **1 lệnh nguyên tử duy nhất**: `SET lock:order:99 <token> NX EX 30` (trong Python `redis-py`: `r.set("lock:order:99", token, nx=True, ex=30)`).

## 3. Vòng đời TTL (Xóa lười + Xóa chủ động) & Kỷ luật vệ sinh Keyspace

Khi kiểm tra hạn sống bằng `TTL <key>` (đơn vị giây) hoặc `PTTL <key>` (mili-giây), Redis luôn trả về **1 trong 3 giá trị đặc biệt** cần thuộc lòng:
- **`>= 0`:** Số giây (hoặc mili-giây) còn lại trước khi khóa tự động biến mất.
- **`-1`:** Khóa đang tồn tại nhưng ==không có hẹn giờ tự hủy== (sống vĩnh viễn cho tới khi bị xóa hoặc gỡ hạn bằng `PERSIST <key>`).
- **`-2`:** Khóa **không tồn tại** (chưa từng tạo, đã bị xóa, hoặc đã hết hạn).

*Làm thế nào Redis dọn dẹp hàng triệu khóa hết hạn đúng giờ mà không phải dừng hệ thống quét toàn bộ RAM mỗi giây?* Redis phối hợp nhịp nhàng **2 cơ chế kép**:
1. **Lazy Expiration (*Xóa thụ động khi có người chạm vào*):** Khi ứng dụng gọi `GET`, `TTL`, `EXISTS`... lên một khóa, Redis liếc nhìn đồng hồ hạn sống trước tiên — nếu thấy đã quá giờ thì xóa ngay tại chỗ và trả về trống `(nil)` / `-2`.
2. **Active Expiration (*Bốc mẫu chủ động định kỳ*):** Để những khóa hết hạn mà không ai hỏi tới nữa không nằm ỳ chiếm RAM, mặc định **10 lần mỗi giây (`hz 10`)**, Redis bốc ngẫu nhiên 20 khóa trong nhóm có gắn TTL để kiểm tra. Nếu thấy **hơn 25%** số mẫu đã quá hạn, Redis lập tức bốc tiếp mẻ mới ngay để dọn sạch rác!

### Kỷ luật sống còn trên Production: Đặt tên phân cấp, `SCAN` & `UNLINK`

Quy ước chuẩn ngành là ghép các từ khóa bằng dấu hai chấm `:` đi từ lớn đến nhỏ: **`<dịch-vụ>:<thực-thể>:<id>[:<thuộc-tính>]`** (ví dụ `billing:invoice:882:status` hoặc `auth:session:u4019`). Khi cần dọn dẹp hàng loạt khóa hoặc xóa khóa dung lượng lớn:
- **Duyệt khóa bằng con trỏ `SCAN`** (thay vì `KEYS *` gây đứng hình toàn bộ server).
- **Xóa bất đồng bộ bằng `UNLINK`** (thay vì `DEL` đồng bộ): `UNLINK` chỉ mất `O(1)` để tháo nhãn tên khỏi bảng tra cứu chính, rồi giao phần việc giải phóng bộ nhớ nặng nhọc cho **luồng dọn dẹp chạy nền (*Background I/O Thread*)**!

```visual
kind: compare
title: Quét Khoá Trên Production — Thảm Hoạ KEYS * vs Con Trỏ An Toàn SCAN + UNLINK
subtitle: Cùng tìm và dọn các khoá theo mẫu `sess:expired:*` trên 20 triệu key nhưng số phận máy chủ trái ngược hoàn toàn
left:
  badge: CẤM TRÊN PRODUCTION
  title: KEYS sess:expired:* + DEL (Chặn cứng Server)
  tone: rose
  lang: redis
  code: |
    # Chặn đứng Event Loop suốt 450ms!
    KEYS sess:expired:*
    DEL sess:expired:1 sess:expired:2
  bullets:
    - "Quét liền một mạch toàn bộ 20 triệu mục trên bảng băm trước khi trả kết quả — **không thể dừng giữa chừng**."
    - "Làm vọt độ trễ mọi API khác, thậm chí khiến hệ thống giám sát tưởng máy chủ đã chết!"
    - "Xoá bằng `DEL` trên khoá lớn còn bắt luồng chính ngồi thu hồi RAM đồng bộ gây giật cục."
right:
  badge: CHUẨN REDIS 8 (PYTHON & NODE.JS)
  title: Con trỏ SCAN từng chặng nhỏ + UNLINK chạy nền
  tone: emerald
  lang: python
  code: |
    # Python (redis-py): Duyệt êm ái bằng scan_iter hoặc r.scan()
    cursor = 0
    while True:
        cursor, keys = r.scan(cursor=cursor, match="sess:expired:*", count=200)
        if keys:
            r.unlink(*keys)  # Nhờ luồng nền giải phóng RAM, không chặn luồng chính!
        if cursor == 0:
            break
  bullets:
    - "Mỗi nhịp `SCAN` chỉ dò qua ~`200` vị trí bảng băm (`< 0.1ms`), nhường đường cho hàng ngàn lệnh `GET`/`SET` khác chạy xen kẽ mượt mà."
    - "Bắt đầu với `cursor = 0` và chỉ kết thúc vòng lặp khi Redis trả lại **`cursor == 0`**."
    - "Lưu ý: `COUNT` là gợi ý số ô cần dò (một mẻ trả về có thể rỗng dù chưa hết dữ liệu, tức `cursor != 0`) và `SCAN` có thể lặp lại 1 khoá nếu bảng băm đang co giãn."
```

> [!TIP] Mẹo chống "Tuyết lở bộ nhớ đệm" (Cache Avalanche) khi đặt TTL hàng loạt
> Nếu lúc 00:00 đêm bạn nạp 50,000 sản phẩm vào Redis và gán cứng tất cả `EX 3600`, đúng 01:00:00 cả 50,000 khóa sẽ **hết hạn cùng một tích tắc**, khiến hàng vạn truy vấn ập thẳng xuống đánh sập Database! Hãy luôn cộng thêm ==độ lệch ngẫu nhiên (TTL Jitter)==: ví dụ `ttl = 3600 + random.randint(0, 300)` trong Python (hoặc `3600 + Math.floor(Math.random() * 300)` trong JS).

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - **SDS String** lưu sẵn độ dài `len` giúp `STRLEN` đạt `O(1)`, an toàn nhị phân và tự động nén thành `int` (số 64-bit) hoặc `embstr` (`<= 44B`).
> - Luôn dùng **`SET key val NX EX seconds`** nguyên tử thay cho `SETNX` + `EXPIRE` rời rạc; dùng **`GETDEL`** cho mã OTP dùng 1 lần.
> - Ba mã trả về của `TTL`: **`-2`** = không tồn tại · **`-1`** = tồn tại vĩnh viễn không hạn · **`>= 0`** = số giây còn sống.
> - **Tuyệt đối không gõ `KEYS *` trên Production** — luôn duyệt bằng con trỏ **`SCAN`** và xóa khóa lớn bằng **`UNLINK`**.

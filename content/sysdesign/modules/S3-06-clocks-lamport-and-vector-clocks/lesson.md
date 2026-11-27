## 1. Vì sao không có một chiếc đồng hồ chung hoàn hảo trong hệ phân tán?

```step
category: SETUP
short: Không giờ chung
scene: s1-no-global-clock
callout:
  kind: key-idea
  title: Đổi câu hỏi đúng trong hệ phân tán
  vi: "Giữa nhiều máy chủ cách nhau qua mạng, hỏi sự kiện A hay B có số mili-giây nhỏ hơn thường dẫn tới kết luận sai; câu hỏi đúng là A có tác động nhân quả lên B hay không."
whatChanged:
  - "+ Đối chiếu hai máy chủ có đồng hồ vật lý lệch nhau vài chục mili-giây"
  - "~ Sự kiện xảy ra muộn hơn ngoài đời thực lại mang nhãn giờ nhỏ hơn"
telemetry:
  - label: "Trên 1 máy đơn"
    value: "1 đồng hồ CPU chung"
    tone: ok
  - label: "Trên nhiều máy chủ"
    value: "Mỗi máy 1 thạch anh riêng"
    tone: warn
```

Trong một tiến trình đơn lẻ, mọi luồng đều đọc chung bộ đếm thời gian của hệ điều hành nên việc xác định sự kiện nào diễn ra trước rất tự nhiên.

Trong hệ thống phân tán, mỗi máy chủ sở hữu một bộ dao động tinh thể thạch anh vật lý độc lập và giao tiếp với máy khác qua đường mạng có độ trễ biến thiên. Giả sử khách hàng vừa tạo đơn ở **Server 1** (đồng hồ đang nhanh hơn chuẩn `+120 ms`) rồi lập tức gửi yêu cầu cập nhật sang **Server 2** (đồng hồ đang chậm `-80 ms`): nhãn thời gian ghi nhận ở bước thứ hai lại **nhỏ hơn** bước thứ nhất hơn trăm mili-giây!

Nếu tầng lưu trữ hoặc hệ thống sự kiện ngây thơ sắp xếp thứ tự chỉ dựa vào con số đồng hồ tường (`wall-clock`) của từng máy, nhân quả sẽ bị đảo ngược hoàn toàn.

## 2. Độ trôi thạch anh (Clock Drift), giới hạn NTP và hai loại đồng hồ OS

```step
category: PROBLEM
short: Trôi giờ & NTP
scene: s2-clock-drift-ntp
callout:
  kind: watch-out
  title: Luôn tách biệt đồng hồ xem giờ và đồng hồ đo khoảng thời gian
  vi: "Dùng đồng hồ tường (time.time) để ghi mốc ngày giờ, nhưng bắt buộc dùng đồng hồ đơn điệu (time.monotonic) để đo Timeout, độ trễ và thời hạn Lease."
whatChanged:
  - "+ Lượng hoá độ trôi thạch anh ±50 ppm (tương đương lệch ~4,3 giây mỗi ngày)"
  - "+ Phân biệt rõ Time-of-Day Clock (nhảy lùi được) và Monotonic Clock (chỉ tiến)"
telemetry:
  - label: "Độ trôi thạch anh"
    value: "±10 đến ±50 ppm"
    tone: warn
  - label: "Sai số NTP mạng WAN"
    value: "±10 đến ±100 ms"
    tone: bad
  - label: "Đo Timeout / RTT"
    value: "Monotonic Clock"
    tone: ok
```

Tinh thể thạch anh trong máy chủ chịu ảnh hưởng của nhiệt độ và sai số chế tạo, thường chạy nhanh hoặc chậm đi khoảng **±10 đến ±50 phần triệu (`ppm`)**. Mức `50 ppm` nghĩa là cứ mỗi giây trôi lệch 50 micro-giây, tức **lệch khoảng 4,32 giây chỉ sau 24 giờ** nếu không đồng bộ lại.

Giao thức **NTP (Network Time Protocol)** định kỳ hỏi các máy chủ giờ nguyên tử để chỉnh lại đồng hồ, nhưng vì độ trễ mạng chiều đi và chiều về không đối xứng kèm nhiễu hàng đợi bộ định tuyến, sai số thực tế giữa các máy trên đám mây vẫn dao động từ vài mili-giây đến hàng chục mili-giây.

Vì vậy, mọi hệ điều hành hiện đại cung cấp hai API đồng hồ hoàn toàn khác nhau:
- **Đồng hồ tường (`CLOCK_REALTIME` / `System.currentTimeMillis()`):** Trả về ngày giờ lịch; **có thể nhảy vọt hoặc giật lùi** khi NTP hiệu chỉnh.
- **Đồng hồ đơn điệu (`CLOCK_MONOTONIC` / `time.perf_counter()`):** Đếm thời gian trôi kể từ lúc bật máy; **đảm bảo không bao giờ lùi**, chuyên dùng để đo độ trễ và kiểm tra quá hạn trên cùng một máy, nhưng giá trị của nó vô nghĩa khi đem so giữa hai máy khác nhau.

## 3. Dị thường mất dữ liệu mới khi dùng Last-Write-Wins (LWW) trên giờ vật lý

```step
category: PITFALL
short: Lỗi mất ghi LWW
scene: s3-lww-anomaly
activity: S3-06.A2
gate: required
callout:
  kind: watch-out
  title: Mất bản ghi âm thầm không hề báo lỗi
  vi: "Khi giải quyết xung đột bằng quy tắc giữ bản có timestamp lớn hơn (LWW), nút có đồng hồ chạy nhanh sẽ biến bản ghi cũ của nó thành bất khả xâm phạm trong suốt khoảng thời gian lệch!"
whatChanged:
  - "+ Mô phỏng N1 nhanh +120 ms đè mất bản ghi nhân quả xảy ra sau trên N2 chậm -80 ms"
  - "~ Người dùng nhận xác nhận lưu thành công nhưng đọc lại vẫn thấy dữ liệu cũ"
telemetry:
  - label: "Ghi 1 tại N1 (t=20ms)"
    value: "wall_ts = 140"
    tone: warn
  - label: "Ghi 2 tại N2 (t=80ms)"
    value: "wall_ts = 0 (Bị xoá!)"
    tone: bad
```

Nhiều cơ sở dữ liệu phân tán (như Cassandra cấu hình mặc định) dùng chiến lược **Last-Write-Wins (LWW)**: mỗi lần ghi gắn kèm một mốc giờ vật lý, khi các bản sao đồng bộ thì giữ lại giá trị có mốc giờ lớn hơn và xoá giá trị nhỏ hơn.

Hãy theo dõi kịch bản thực tế trên hai nút có đồng hồ lệch nhau `200 ms` (`N1` nhanh `+120 ms`, `N2` chậm `-80 ms`):
1. Tại thời điểm thực `t = 20 ms`, khách hàng ghi `email = "an_old@mail.vn"` vào `N1`. Đồng hồ `N1` đóng dấu `ts = 20 + 120 = 140`.
2. Tới `t = 50 ms`, khách hàng đọc thấy địa chỉ cũ và quyết định đổi sang `email = "an_new@mail.vn"` ở `t = 80 ms`, lần này Load Balancer định tuyến vào `N2`.
3. Đồng hồ `N2` đóng dấu `ts = 80 - 80 = 0` rồi trả lời `200 OK` cho khách!
4. Khi hai nút đồng bộ, vì `0 < 140`, bản cập nhật mới `"an_new@mail.vn"` bị coi là cũ hơn và **bị âm thầm vứt bỏ** mà không để lại bất kỳ dòng lỗi nào.

## 4. Quan hệ nhân quả Happens-Before (a → b) và tính đồng thời (a ∥ b)

```step
category: MECHANISM
short: Quan hệ a → b
scene: s4-happens-before
callout:
  kind: key-idea
  title: Định nghĩa toán học của Leslie Lamport (1978)
  vi: "Hai sự kiện không cần đồng hồ vật lý vẫn xác lập được thứ tự nhân quả a → b thông qua thứ tự trong cùng tiến trình và các gói tin truyền qua lại."
whatChanged:
  - "+ Xây dựng đồ thị nhân quả qua 3 quy tắc: nội tại, truyền thông điệp và bắc cầu"
  - "+ Định nghĩa hai sự kiện đồng thời (a ∥ b) khi không bên nào biết về bên kia"
telemetry:
  - label: "Nhân quả"
    value: "a → b (a trước b)"
    tone: ok
  - label: "Độc lập / Xung đột"
    value: "a ∥ b (Đồng thời)"
    tone: warn
```

Năm 1978, Leslie Lamport đặt nền móng cho lý thuyết hệ phân tán bằng quan hệ **Happens-Before** (ký hiệu **`a → b`**, đọc là *a xảy ra trước b về mặt nhân quả*), được xác định chỉ bằng ba quy tắc:

1. **Cùng một tiến trình:** Nếu `a` và `b` diễn ra trên cùng một luồng xử lý và `a` thực thi trước `b`, thì `a → b`.
2. **Gửi và nhận thông điệp:** Nếu `a` là hành động gửi một gói tin và `b` là hành động nhận chính gói tin đó ở máy khác, thì `a → b` (gói tin không thể được nhận trước khi gửi đi).
3. **Tính bắc cầu:** Nếu `a → c` và `c → b`, thì `a → b`.

Nếu giữa hai sự kiện `x` và `y` **không có `x → y` mà cũng không có `y → x`** (hai máy thực hiện độc lập chưa từng trao đổi thông tin trực tiếp hay gián tiếp), ta nói `x` và `y` **đồng thời (`x ∥ y` — Concurrent)**, bất kể chúng diễn ra cách nhau bao nhiêu giây trên đồng hồ treo tường.

## 5. Đồng hồ logic Lamport (Lamport Timestamps)

```step
category: MECHANISM
short: Đồng hồ Lamport
scene: s5-lamport-clock
activity: S3-06.A1
gate: optional
callout:
  kind: technique
  title: Ba dòng quy tắc cực gọn với chi phí O(1)
  vi: "Mỗi nút giữ một số nguyên LC khởi tạo bằng 0: tăng thêm 1 trước mỗi sự kiện nội bộ hoặc gửi tin; khi nhận tin mang nhãn T, cập nhật LC = max(LC, T) + 1."
whatChanged:
  - "+ Gắn bộ đếm nguyên đơn lẻ LC lên từng tiến trình và đính kèm theo mọi gói tin"
  - "+ Bảo đảm chiều thuận: nếu a → b thì chắc chắn LC(a) < LC(b)"
telemetry:
  - label: "Kích thước đính kèm"
    value: "1 số nguyên O(1)"
    tone: ok
  - label: "Quy tắc khi nhận tin"
    value: "max(local, msg) + 1"
    tone: ok
```

**Đồng hồ Lamport** biến quan hệ `a → b` thành các con số nguyên so sánh được mà hoàn toàn không đụng tới đồng hồ phần cứng:

```python
class LamportClock:
    def __init__(self, node_id: str) -> None:
        self.c = 0
        self.node_id = node_id

    def tick_or_send(self) -> int:
        self.c += 1
        return self.c

    def receive(self, msg_ts: int) -> int:
        self.c = max(self.c, msg_ts) + 1
        return self.c
```

Ví dụ: `P1` thực hiện sự kiện nội bộ (`LC = 1`), rồi gửi gói tin sang `P2` (`LC = 2`). Lúc gói tin tới nơi, đồng hồ cục bộ của `P2` dù đang ở `0` hay đang ở `5` đều được kéo lên `max(local, 2) + 1` (lần lượt thành `3` hoặc `6`), luôn lớn hơn `2`!

Nếu muốn tạo **thứ tự toàn phần (Total Order)** không bao giờ hoà nhau cho mọi sự kiện trong cụm, ta chỉ cần ghép cặp `(LC, node_id)`: khi hai sự kiện có cùng `LC`, phân xử phụ bằng thứ tự từ điển của `node_id`.

## 6. Giới hạn một chiều của Lamport: không tách bạch được sự kiện đồng thời

```step
category: PITFALL
short: Hạn chế Lamport
scene: s6-lamport-limit
callout:
  kind: watch-out
  title: Chiều đảo KHÔNG đúng!
  vi: "Từ a → b luôn suy ra được LC(a) < LC(b); nhưng khi nhìn thấy LC(a) < LC(b), bạn KHÔNG thể biết a gây ra b hay hai sự kiện hoàn toàn độc lập (a ∥ b)."
whatChanged:
  - "+ Minh hoạ phản ví dụ: LC(e1) = 1 < LC(e2) = 3 dù hai nút chưa từng nói chuyện"
  - "~ Giải thích vì sao Lamport không đủ để tự phát hiện xung đột ghi hai nhánh"
telemetry:
  - label: "a → b ⇒ LC(a) < LC(b)"
    value: "Luôn ĐÚNG"
    tone: ok
  - label: "LC(a) < LC(b) ⇒ a → b"
    value: "SAI (Có thể a ∥ b)"
    tone: bad
```

Xét hai bản sao cơ sở dữ liệu `P1` và `P2` đang đứt kết nối với nhau:
- Trên `P1`, người dùng A sửa giỏ hàng một lần: `LC(A) = 1`.
- Trên `P2`, sau vài sự kiện nội bộ khác, người dùng B sửa cùng giỏ hàng đó ở `LC(B) = 4`.

Khi hai bản sao gặp lại nhau, ta thấy `1 < 4`. Tuy nhiên `A` và `B` diễn ra độc lập lúc đứt mạng (`A ∥ B`), không ai nhìn thấy bản sửa của ai! Nếu dùng nhãn Lamport `(LC, node_id)` để chọn người thắng, bản sửa của A sẽ bị ghi đè mất giống hệt lỗi LWW, vì một con số đơn lẻ không ghi nhớ nổi tiến trình kia đã biết tới mốc nào của mình.

## 7. Đồng hồ véc-tơ (Vector Clocks): phát hiện chính xác xung đột đồng thời

```step
category: MECHANISM
short: Vector Clock
scene: s7-vector-clock
callout:
  kind: key-idea
  title: "Bảo toàn tương đương nhân quả hai chiều: a → b ⇔ VC(a) < VC(b)"
  vi: "Thay vì một con số, mỗi nút giữ mảng N bộ đếm (1 ô cho mỗi nút/bản sao). Hai véc-tơ không cái nào lớn hơn toàn diện cái nào chính là dấu hiệu xung đột đồng thời!"
whatChanged:
  - "+ Mỗi bản ghi mang mảng [v_P1, v_P2, v_P3] cập nhật theo phép max từng ô"
  - "+ Phát hiện cặp xung đột [2, 0] vs [1, 1] để giữ lại cả hai chờ hợp nhất"
telemetry:
  - label: "Phát hiện xung đột"
    value: "Chính xác 100% (2 chiều)"
    tone: ok
  - label: "Chi phí không gian"
    value: "O(N) theo số bản sao"
    tone: warn
```

**Vector Clock** khắc phục triệt để hạn chế của Lamport bằng cách cho mỗi nút `i` trong hệ `N` nút duy trì một mảng `VC[0..N-1]`:
- Trước sự kiện nội bộ hoặc gửi tin tại nút `i`: tăng riêng ô của mình `VC[i] += 1`.
- Khi nút `i` nhận gói tin mang véc-tơ `W`: gộp từng phần tử `VC[k] = max(VC[k], W[k])` với mọi `k`, sau đó tăng `VC[i] += 1`.

Khi so sánh hai véc-tơ `U` và `V`:
- **`U < V` (`U → V` nhân quả):** Mọi vị trí `k` đều có `U[k] ≤ V[k]` và có ít nhất một vị trí `U[j] < V[j]` (ví dụ `[2, 0] < [2, 1]`: bản sau đã biết bản trước, cho phép ghi đè an toàn).
- **`U ∥ V` (Đồng thời / Xung đột):** Tồn tại một vị trí `U[a] > V[a]` **và** một vị trí khác `U[b] < V[b]` (ví dụ `U = [3, 0]` và `V = [2, 2]`). Kho dữ liệu kiểu Dynamo/Riak nhận diện ngay đây là hai nhánh sửa đồng thời, giữ cả hai làm *siblings* để tầng ứng dụng hoặc CRDT hợp nhất không mất dữ liệu.

Để tránh véc-tơ phình quá lớn khi có hàng nghìn client, thực tế người ta gắn bộ đếm theo **mã nút lưu trữ (Server Replica ID)** (thường chỉ 3–5 bản sao mỗi khoá) kèm kỹ thuật **Dotted Version Vectors** và cắt tỉa các mục quá cũ.

## 8. Đồng hồ logic lai (Hybrid Logical Clock — HLC) và TrueTime

```step
category: TECHNIQUE
short: Đồng hồ lai HLC
scene: s8-hlc-truetime
callout:
  kind: good-to-know
  title: Chuẩn công nghiệp trong các cơ sở dữ liệu SQL phân tán hiện đại
  vi: "HLC ghép thời gian vật lý với bộ đếm logic (pt, lc) vào gọn 64–96 bit: vừa bám sát đồng hồ thực để truy vấn theo mốc giờ, vừa không bao giờ lùi và giữ trọn quan hệ nhân quả a → b."
whatChanged:
  - "+ Cấu trúc cặp HLC = (physical_time, logical_counter) dùng trong CockroachDB, YugabyteDB"
  - "+ Đối chiếu với phần cứng GPS + đồng hồ nguyên tử TrueTime của Google Spanner"
telemetry:
  - label: "Cấu trúc HLC"
    value: "(pt_ms, logical_c) · O(1)"
    tone: ok
  - label: "TrueTime (Spanner)"
    value: "Khoảng [earliest, latest] ε"
    tone: default
```

Vector Clock tốn không gian `O(N)`, còn Lamport thuần tuý lại tách rời hoàn toàn khỏi giờ thực (không thể phục vụ câu truy vấn `AS OF SYSTEM TIME '10:00:00'`). **Hybrid Logical Clock (HLC)** giải quyết cả hai bằng cặp số `(pt, lc)`:
- `pt` giữ giá trị lớn nhất giữa đồng hồ vật lý hiện tại và mọi mốc `pt` từng thấy từ gói tin mạng (`pt` không bao giờ lùi ngay cả khi NTP giật lùi!).
- Nếu nhiều sự kiện nhân quả nối tiếp nhau trong lúc đồng hồ vật lý chưa kịp nhích (hoặc một nút nhận tin từ máy có đồng hồ nhanh hơn mình), phần đếm logic `lc` tự tăng lên `1, 2, 3...` để bảo toàn `a → b ⇒ HLC(a) < HLC(b)`; ngay khi đồng hồ vật lý vượt lên trên `pt`, `lc` đặt lại về `0`.

Ở một hướng khác, **Google Spanner** triển khai **TrueTime** bằng thiết bị GPS và đồng hồ nguyên tử tại mỗi trung tâm dữ liệu để kẹp sai số đồng hồ `ε` xuống dưới vài mili-giây, rồi chủ động **đợi hết khoảng bất định `2ε` (Commit Wait)** trước khi trả kết quả giao dịch để đạt tính tuyến tính hoá toàn cầu.

## 9. Tóm tắt: chọn công cụ thời gian đúng với bài toán phân tán

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Tư duy nhân quả thay cho trục thời gian tuyệt đối
  vi: "Đo thời lượng nội bộ dùng Monotonic Clock; xếp thứ tự sự kiện nhẹ dùng Lamport / HLC; phát hiện xung đột ghi đa bản sao không mất dữ liệu dùng Vector Clock / Version Vector."
whatChanged:
  - "+ Đúc kết ma trận chọn loại đồng hồ theo chi phí lưu trữ và yêu cầu phát hiện xung đột"
telemetry:
  - label: "Đo Timeout cục bộ"
    value: "Monotonic Clock"
    tone: ok
  - label: "Phát hiện ghi xung đột"
    value: "Vector Clock"
    tone: ok
  - label: "Snapshot DB phân tán"
    value: "HLC / TrueTime"
    tone: ok
```

Tổng kết công dụng và đánh đổi của năm cơ chế thời gian trong hệ phân tán:

| Cơ chế đồng hồ | Kích thước | Bảo toàn `a → b`? | Phát hiện đồng thời `a ∥ b`? | Ứng dụng điển hình |
|---|---|---|---|---|
| **Wall-Clock (NTP)** | `O(1)` (64b) | Không (có thể trôi/lùi) | Không | Ghi nhãn giờ hiển thị log cho con người |
| **Monotonic Clock** | `O(1)` (64b) | Chỉ trong 1 máy | Không áp dụng | Đo Timeout, RTT, chu kỳ Heartbeat và Lease |
| **Lamport Timestamp** | `O(1)` | Có (1 chiều) | Không | Thứ tự nhân quả nhẹ cho luồng thông điệp, Term Raft |
| **Vector Clock** | `O(N)` | Có (2 chiều) | **Có (Chính xác)** | Phát hiện xung đột bản ghi trong Dynamo, Riak, CRDT |
| **Hybrid Logical (HLC)** | `O(1)` | Có (1 chiều + bám giờ thực) | Không | MVCC Snapshot trong CockroachDB, MongoDB, YugabyteDB |

## 1. Vì sao giao dịch ACID cục bộ vỡ khi đi qua nhiều cơ sở dữ liệu?

```step
category: SETUP
short: Ranh giới ACID
scene: s1-multi-db
callout:
  kind: key-idea
  title: Không có câu lệnh ROLLBACK xuyên mạng
  vi: "Mỗi dịch vụ sở hữu cơ sở dữ liệu và nhật ký WAL riêng. Khi dịch vụ Thanh toán đã COMMIT nhưng dịch vụ Khách sạn ở bước sau báo hết phòng, hệ thống không thể gọi db.rollback() để thu hồi khoản tiền đã trừ."
whatChanged:
  - "+ Một chuyến đi cần ghi đồng bộ qua Flight DB, Payment DB và Hotel DB"
  - "~ Flight và Payment đã COMMIT cục bộ thì Hotel báo hết phòng trống"
telemetry:
  - label: "Số kho dữ liệu riêng"
    value: "3 DB độc lập"
  - label: "Tải đặt chuyến"
    value: "450 req/s"
  - label: "Rủi ro khi lỗi bước 3"
    value: "Trừ tiền không có phòng"
    tone: bad
```

Ở bài `S3-07`, khối `BEGIN ... COMMIT` bảo vệ trọn vẹn nhiều bảng vì tất cả nằm chung trong một tiến trình cơ sở dữ liệu và dùng chung một tệp nhật ký WAL.

Khi chuyển sang kiến trúc nhiều dịch vụ độc lập (hoặc nhiều phân mảnh dữ liệu khác máy), một thao tác đặt chuyến du lịch của khách hàng phải đi qua ba kho dữ liệu tách biệt: **Flight DB** (giữ ghế bay), **Payment DB** (khấu trừ thẻ) và **Hotel DB** (đặt phòng nghỉ).

Nếu bước 1 và bước 2 đã `COMMIT` xong ở cơ sở dữ liệu của chúng, rồi bước 3 gặp lỗi hết phòng hoặc đứt mạng:

- `Hotel DB` từ chối ghi, nhưng `Payment DB` và `Flight DB` đã khép giao dịch cục bộ từ trước đó.
- Nếu đi qua cổng thanh toán ngân hàng bên ngoài, hệ thống lại càng không có quyền giữ khoá nội bộ của đối tác.

Muốn giữ tính toàn vẹn tổng thể (đặt trọn chuyến hoặc hoàn trả sạch), kiến trúc sư phải chọn giữa hai hướng tiếp cận: **phối hợp khoá hai pha (2PC)** hoặc **chuỗi giao dịch cục bộ kèm bù trừ (Saga)**.

## 2. Giao thức 2-Phase Commit (2PC): hỏi phiếu chuẩn bị rồi mới chốt

```step
category: MECHANISM
short: Giao thức 2PC
scene: s2-2pc-protocol
callout:
  kind: good-to-know
  title: Hai vòng tròn tin nhắn cho một lần chốt
  vi: "Pha Prepare buộc mọi thành viên kiểm tra ràng buộc, ghi sẵn nhật ký bền vững và giữ chặt khoá dòng trước khi bỏ phiếu YES; chỉ cần một phiếu NO, toàn bộ cùng huỷ."
whatChanged:
  - "+ Pha 1 (Prepare): Coordinator hỏi ý kiến và các DB khoá cứng bản ghi liên quan"
  - "+ Pha 2 (Commit/Abort): Đủ 100% phiếu YES mới phát lệnh COMMIT đồng loạt"
telemetry:
  - label: "Số vòng mạng tối thiểu"
    value: "2 RTT"
    tone: warn
  - label: "Tính nhất quán"
    value: "Mạnh (ACID)"
    tone: ok
```

**Two-Phase Commit (2PC, chuẩn XA)** tái lập tính nguyên tử trên nhiều cơ sở dữ liệu thông qua một nút điều phối (**Coordinator**) và hai pha tuần tự:

1. **Pha 1 — Chuẩn bị (`PREPARE`):** Coordinator gửi lệnh `PREPARE` kèm mã giao dịch toàn cục tới cả `Flight DB`, `Hotel DB` và `Payment DB`. Từng cơ sở dữ liệu kiểm tra điều kiện hợp lệ, lấy khoá dòng độc quyền, ghi trạng thái chuẩn bị xuống đĩa (WAL) nhưng **chưa chốt**, rồi trả phiếu `VOTE_YES` (hoặc `VOTE_NO` nếu hết chỗ / lỗi ràng buộc).
2. **Pha 2 — Quyết định (`COMMIT` / `ABORT`):**
   - Nếu **tất cả** đều trả `VOTE_YES`: Coordinator ghi quyết định `COMMIT` vào nhật ký của chính nó rồi phát lệnh `COMMIT` để các bên áp dụng thay đổi và nhả khoá.
   - Nếu **bất kỳ bên nào** trả `VOTE_NO` hoặc quá hạn: Coordinator phát lệnh `ABORT` để mọi bên hoàn nguyên và nhả khoá.

Lời hứa quan trọng nhất của phiếu `VOTE_YES` là: thành viên đó đã chuẩn bị đủ trên đĩa để chắc chắn thực thi được cả `COMMIT` lẫn `ABORT` khi nhận lệnh ở Pha 2.

## 3. Điểm yếu của 2PC: giao thức khoá chặn khi Coordinator gặp sự cố

```step
category: PITFALL
short: Kẹt khoá 2PC
scene: s3-2pc-blocking-live
live: two-pc-hang
activity: S3-04.A2
gate: optional
callout:
  kind: watch-out
  title: Thế tiến thoái lưỡng nan ở trạng thái In-Doubt
  vi: "Sau khi bỏ phiếu YES, một DB không được phép tự ý nhả khoá khi quá hạn chờ Coordinator, vì không thể biết Coordinator đã kịp gửi lệnh COMMIT cho một DB anh em khác trước lúc sập hay chưa."
whatChanged:
  - "~ t = 20 s: Trip Coordinator gặp sự cố dừng hoạt động ngay sau Pha 1"
  - "~ Thông lượng rớt về 0 req/s, các bản ghi đang chuẩn bị bị treo khoá tới t = 42 s"
telemetry:
  - label: "Tỉ lệ lỗi (t = 25 s)"
    value: "100%"
    tone: bad
  - label: "Trạng thái các DB"
    value: "In-Doubt (giữ khoá)"
    tone: bad
  - label: "Khôi phục tại"
    value: "t = 42 s"
    tone: warn
```

Nhược điểm lớn nhất khiến 2PC hiếm khi được dùng ngang qua các microservices là **tính khoá chặn (Blocking Protocol)**:

- Giả sử ở giây 20, cả ba kho dữ liệu vừa bỏ phiếu `VOTE_YES` (đang ngâm khoá trên dòng ghế bay, phòng khách sạn và số dư ví) thì `Trip Coordinator` mất điện trước khi kịp gửi gói tin Pha 2.
- Lúc này, `Flight DB` rơi vào trạng thái **bất định (`in-doubt`)**: nếu tự ý huỷ để nhả khoá, nhỡ đâu Coordinator đã kịp gửi `COMMIT` sang `Payment DB` trước lúc tắt máy thì dữ liệu hai bên sẽ lệch nhau vĩnh viễn; ngược lại nếu tự ý `COMMIT`, nhỡ đâu `Hotel DB` vừa bỏ phiếu `NO` thì sao?
- Hệ quả: các thành viên **buộc phải giữ nguyên khoá dòng** chờ tới giây 42 khi Coordinator khởi động lại và đọc nhật ký quyết định. Trong suốt khoảng thời gian đó, mọi giao dịch khác chạm vào cùng chuyến bay hoặc khách sạn đều bị chặn dây chuyền, còn dịch vụ bên thứ ba (như cổng thẻ quốc tế) vốn không bao giờ mở cổng XA 2PC cho hệ thống ngoài.

## 4. Mẫu Saga: chuỗi giao dịch cục bộ kèm giao dịch bù trừ ngược

```step
category: TECHNIQUE
short: Mẫu Saga
scene: s4-saga-forward-comp
activity: S3-04.A1
gate: optional
callout:
  kind: key-idea
  title: Bù trừ (Compensation) không phải là xoá dấu vết (Rollback)
  vi: "Mỗi bước trong Saga COMMIT ngay lập tức để giải phóng khoá cục bộ. Khi bước sau thất bại, hệ thống chạy các giao dịch mới mang tác dụng nghiệp vụ ngược lại theo đúng chiều từ sau về trước."
whatChanged:
  - "+ Tách thành chuỗi T1 (Flight) → T2 (Payment) → T3 (Hotel), mỗi bước tự COMMIT"
  - "+ Khi T3 báo hết phòng, kích hoạt bù trừ ngược C2 (Hoàn tiền) rồi C1 (Huỷ ghế)"
telemetry:
  - label: "Khoá giữ xuyên dịch vụ"
    value: "0 khoá"
    tone: ok
  - label: "Thứ tự hoàn tác"
    value: "Ngược (Cn → C1)"
    tone: ok
```

Năm 1987, Hector Garcia-Molina và Kenneth Salem đề xuất **Saga** để xử lý giao dịch dài mà không giữ khoá toàn cục: chia tác vụ lớn thành chuỗi giao dịch cục bộ $T_1, T_2, \dots, T_n$, trong đó mỗi bước $T_i$ có một **giao dịch bù trừ (Compensating Transaction)** $C_i$ tương ứng.

- Nếu mọi bước đều thành công: chuỗi chạy $T_1 \rightarrow T_2 \rightarrow T_3$ và hoàn tất.
- Nếu $T_3$ (`Hotel DB` hết phòng) thất bại: hệ thống chạy ngược $C_2$ (`Payment`: tạo giao dịch hoàn tiền) rồi $C_1$ (`Flight`: trả lại ghế trống).

Cần phân biệt rõ **Compensation khác Rollback**: ở thời điểm giữa $T_2$ và $C_2$, khoản trừ tiền đã thực sự được `COMMIT` và lưu vào sổ cái kế toán; bước $C_2$ tạo một bút toán hoàn tiền mới chứ không quay ngược thời gian như chưa từng có gì xảy ra. Nhờ không ngâm khoá liên cơ sở dữ liệu, độ sẵn sàng và thông lượng cao hơn hẳn 2PC, đổi lại hệ thống chấp nhận **nhất quán cuối cùng (Eventual Consistency)** trong vài giây đang bù trừ.

## 5. Hai cách điều phối Saga: Orchestration và Choreography

```step
category: MECHANISM
short: Hai kiểu Saga
scene: s5-orch-vs-choreo
callout:
  kind: compare
  title: Khi nào chọn Orchestration, khi nào chọn Choreography?
  vi: "Orchestration gom luồng quy trình về một máy trạng thái rõ ràng nên dễ quan sát và đảo chiều khi lỗi; Choreography tách ghép nối qua Event Bus nhưng dễ tạo vòng lặp sự kiện khó lần vết khi quá 3–4 bước."
whatChanged:
  - "+ Đối chiếu điều phối tập trung (Orchestrator) với phản ứng sự kiện (Choreography)"
telemetry:
  - label: "Luồng phức tạp ≥ 4 bước"
    value: "Ưu tiên Orchestration"
    tone: ok
  - label: "Thông báo phụ 2–3 bước"
    value: "Hợp Choreography"
```

Có hai kiến trúc phổ biến để nối các bước của một Saga:

| Tiêu chí | Orchestration (Nhạc trưởng điều phối) | Choreography (Vũ đạo sự kiện) |
|---|---|---|
| **Cơ chế** | Một `Saga Orchestrator` lưu trạng thái từng bước vào DB riêng và chủ động gửi lệnh tới `Flight`, `Payment`, `Hotel` | Không có nhạc trưởng; `Flight` xong tự phát sự kiện `flight.booked` lên Event Bus để `Payment` lắng nghe và làm tiếp |
| **Ưu điểm** | Toàn bộ thứ tự đi tới và bù trừ nằm ở một chỗ; dễ đọc log, dễ kiểm thử và biết ngay đơn đang dừng ở bước nào | Các dịch vụ tách rời nhau, thêm dịch vụ phụ (như tích điểm) chỉ cần đăng ký nghe sự kiện |
| **Hạn chế** | Cần vận hành cụm Orchestrator bền vững để không thành điểm lỗi đơn | Khi quy trình dài trên 4 bước, logic bù trừ rải rác khắp nhiều dịch vụ gây khó gỡ lỗi và dễ sinh phụ thuộc vòng |

Trong các luồng thanh toán và đặt chỗ cốt lõi có nhánh hoàn tác phức tạp, **Orchestration** có lưu nhật ký trạng thái bền vững luôn là lựa chọn an toàn và dễ bảo trì hơn.

## 6. Thiếu tính cô lập (ACD), Semantic Lock và vị trí bước không bù trừ được

```step
category: TECHNIQUE
short: Semantic Lock
scene: s6-semantic-lock
callout:
  kind: technique
  title: Đặt bước không thể hoàn tác ở cuối cùng
  vi: "Bạn không thể thu hồi một email xác nhận hay huỷ gói hàng đã rời kho. Hãy đặt các bước có thể bù trừ lên đầu, bước quyết định ở giữa và các bước không thể hoàn tác ở cuối Saga."
whatChanged:
  - "+ Gắn trạng thái trung gian PENDING (Semantic Lock) để ngăn giao dịch khác đọc nhầm"
  - "+ Sắp xếp thứ tự: Bước bù trừ được → Bước chốt (Pivot) → Bước không bù trừ được"
telemetry:
  - label: "Bảo đảm của Saga"
    value: "ACD (thiếu chữ I)"
    tone: warn
  - label: "Biện pháp bù chữ I"
    value: "Semantic Lock"
    tone: ok
```

Vì mỗi bước của Saga `COMMIT` cục bộ ngay lập tức, Saga chỉ đảm bảo **ACD** chứ **không tự có chữ I (Isolation)**: khi $T_1$ vừa giữ vé bay xong còn $T_3$ chưa đặt được khách sạn, một truy vấn khác nhìn vào `Flight DB` đã thấy vé đó tồn tại; nếu người dùng bấm đổi giờ bay ngay lúc $C_1$ đang chạy huỷ vé, dữ liệu sẽ xung đột.

Hai nguyên tắc thiết kế bắt buộc để bù đắp khoảng trống cô lập này:

1. **Semantic Lock (Khoá ngữ nghĩa ở tầng ứng dụng):** Bước $T_1$ không ghi thẳng trạng thái `CONFIRMED` mà ghi `PENDING_TRIP`. Mọi thao tác nghiệp vụ khác thấy cờ `PENDING_TRIP` đều biết Saga đang dở dang nên từ chối sửa đổi; chỉ khi bước cuối hoàn tất mới chuyển sang `CONFIRMED` (hoặc `CANCELLED` khi bù trừ).
2. **Thứ tự sắp xếp ba nhóm bước:**
   - **Đầu tiên — Các bước bù trừ được (Compensable):** giữ ghế, tạm giữ hạn mức thẻ.
   - **Ở giữa — Bước chốt (Pivot Transaction):** bước có xác suất từ chối cao nhất quyết định thành bại.
   - **Cuối cùng — Các bước không thể hoàn tác (Non-compensable / Retriable):** gửi email/SMS xác nhận, phát lệnh xuất kho vật lý — chỉ chạy sau khi mọi rủi ro từ chối đã qua hết.

## 7. Timeout nghĩa là chưa rõ kết quả: dùng Idempotency Key chống trừ lặp

```step
category: MECHANISM
short: Idempotency Key
scene: s7-idempotency-timeout
callout:
  kind: watch-out
  title: Timeout không đồng nghĩa với thất bại
  vi: "Khi gọi trừ tiền bị quá hạn 2 giây, có thể yêu cầu chưa tới nơi, nhưng cũng có thể tiền đã trừ xong và chỉ rớt gói phản hồi ACK trên đường về. Thử lại mù quáng không có Idempotency Key sẽ trừ tiền khách hai lần."
whatChanged:
  - "+ Mọi yêu cầu ghi và hoàn tiền đều mang mã định danh duy nhất Idempotency-Key"
  - "+ Payment DB lưu kết quả theo khoá UNIQUE để trả lại biên lai cũ khi gặp gói thử lại"
telemetry:
  - label: "Ý nghĩa của Timeout"
    value: "Chưa rõ (Unknown)"
    tone: warn
  - label: "Số lần trừ thực tế"
    value: "Đúng 1 lần"
    tone: ok
```

Trong mạng phân tán, khi `Trip Coordinator` gọi sang `Payment DB` mà hết thời gian chờ (**Timeout**), hệ thống đứng trước hai khả năng không thể phân biệt chỉ từ phía người gọi: gói đi bị rớt (chưa trừ tiền), hoặc `Payment DB` **đã trừ tiền xong nhưng gói `ACK` quay về bị rớt**.

Muốn thử lại an toàn (hoặc truy vấn trạng thái trước khi quyết định), thao tác phải thoả mãn **tính luỹ đẳng (Idempotency)**: thực thi $1$ lần hay $N$ lần cùng một yêu cầu đều để lại đúng một kết quả duy nhất $f(f(x)) = f(x)$.

```python
def charge_idempotent(db, idempotency_key: str, trip_id: int, amount: int) -> dict:
    with db.transaction():
        existing = db.query_one(
            "SELECT payment_id, status FROM idempotency_keys WHERE idem_key = %s FOR UPDATE",
            idempotency_key,
        )
        if existing is not None:
            return {"payment_id": existing.payment_id, "status": existing.status}

        payment_id = db.execute_scalar(
            "INSERT INTO ledger(trip_id, kind, amount) VALUES (%s, 'CHARGE', %s) RETURNING id",
            trip_id, amount,
        )
        db.execute(
            "INSERT INTO idempotency_keys(idem_key, payment_id, status) VALUES (%s, %s, 'SUCCEEDED')",
            idempotency_key, payment_id,
        )
        return {"payment_id": payment_id, "status": "SUCCEEDED"}
```

Mã `idempotency_key` (ví dụ `trip_901:charge`) phải được sinh cố định cho bước đó ngay từ đầu và giữ nguyên qua mọi lần thử lại; bảng `idempotency_keys` lưu kết quả trong khoảng TTL 24–48 giờ kèm ràng buộc `UNIQUE`.

## 8. Khi chính bước bù trừ cũng gặp lỗi: thử lại luỹ đẳng và chuyển đối soát

```step
category: PITFALL
short: Lỗi khi bù trừ
scene: s8-comp-failure
activity: S3-04.A3
gate: required
callout:
  kind: watch-out
  title: Không bao giờ nuốt lỗi của hàm bù trừ
  vi: "Hàm hoàn tiền C2 cũng đi qua mạng nên có thể gặp lỗi tạm thời. Không thể 'rollback của bù trừ': hệ thống phải lưu trạng thái, thử lại có Backoff + Idempotency Key và báo động vận hành nếu vượt ngưỡng."
whatChanged:
  - "+ Bước bù trừ C2 mang Idempotency Key riêng (trip_901:refund) và thử lại bền bỉ"
  - "+ Nếu hết số lần thử lại vẫn lỗi, ghi vào hàng đợi đối soát (DLQ) và cảnh báo kỹ sư trực"
telemetry:
  - label: "Khoá cho bước hoàn tiền"
    value: "trip_901:refund"
    tone: ok
  - label: "Chốt chặn cuối khi lỗi dài"
    value: "DLQ + Đối soát"
    tone: warn
```

Một câu hỏi thực tế luôn xuất hiện khi vận hành Saga: *Điều gì xảy ra nếu bước 3 hết phòng, hệ thống gọi bước bù trừ $C_2$ để hoàn tiền nhưng cổng thanh toán đúng lúc đó bảo trì 5 phút?*

Bắt ngoại lệ `try ... except` rồi chỉ in một dòng log và kết thúc Saga sẽ làm khách mất tiền vĩnh viễn. Quy trình chuẩn xử lý lỗi bù trừ gồm ba tầng:

1. **Bản thân giao dịch bù trừ cũng bắt buộc có `Idempotency-Key` riêng** (ví dụ `trip_901:refund`) để gọi lại 5 lần cũng chỉ hoàn tiền đúng 1 lần, không hoàn dư gấp đôi.
2. **Thử lại bền bỉ (Durable Retry với Exponential Backoff):** Orchestrator giữ trạng thái Saga ở `COMPENSATING` trên đĩa và tiếp tục thử lại bước hoàn tiền định kỳ cho tới khi dịch vụ thanh toán sống lại.
3. **Leo thang sang xử lý đối soát (Escalation / DLQ):** Nếu lỗi không phải tạm thời (ví dụ thẻ của khách vừa bị khoá cứng không nhận hoàn tiền tự động), sau $K$ lần thử thất bại, đẩy bản ghi vào hàng đợi `COMPENSATION_FAILED` để hệ thống đối soát tài chính hoặc bộ phận vận hành xử lý thủ công.

## 9. Tổng kết: khung chọn 2PC, Saga và danh sách kiểm tra toàn vẹn

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Bốn điểm kiểm tra trước khi đưa Saga lên môi trường thật
  vi: "Thứ tự bù trừ ngược đã đúng chưa? Bước không hoàn tác được đã nằm cuối chưa? Cờ trạng thái PENDING đã có chưa? Và mọi bước ghi/hoàn tác đã gắn Idempotency Key chưa?"
whatChanged:
  - "+ Tổng hợp tiêu chí chọn giữa giao dịch đơn DB, 2PC và Saga"
telemetry:
  - label: "1 DB duy nhất"
    value: "ACID cục bộ"
    tone: ok
  - label: "Nhiều service / API ngoài"
    value: "Saga + Idempotency"
    tone: ok
```

Bảng tóm tắt lựa chọn kiến trúc đảm bảo tính toàn vẹn dữ liệu:

| Bối cảnh hệ thống | Giải pháp phù hợp | Đánh đổi chính |
|---|---|---|
| Mọi bảng cùng nằm trong 1 cơ sở dữ liệu | Giao dịch **ACID cục bộ** (`S3-07`) | Đơn giản, nhất quán chặt, giới hạn mở rộng ghi của 1 máy |
| Vài phân mảnh DB nội bộ, cần nhất quán tức thì, tải vừa | **2-Phase Commit (2PC)** | Giao thức khoá chặn: Coordinator dừng làm kẹt khoá `in-doubt`, độ trễ cao |
| Microservices độc lập hoặc có gọi API đối tác ngoài | **Saga + Idempotency Key** | Khả dụng cao, không khoá xuyên dịch vụ; phải viết logic bù trừ và quản lý trạng thái `PENDING` |

Ghi nhớ công thức an toàn cho mọi Saga: **Trạng thái `PENDING` (Semantic Lock) + Bước không hoàn tác đặt cuối + Bù trừ theo thứ tự ngược + `Idempotency-Key` cho cả hai chiều đi và về**.

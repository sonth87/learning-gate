## 1. Từ một máy sang mạng phân tán: khi mọi giả định quen thuộc đều thay đổi

```step
category: SETUP
short: Một máy vs mạng
scene: s1-local-vs-remote
callout:
  kind: key-idea
  title: Khác biệt nền tảng
  vi: "Trong cùng một tiến trình, lời gọi hàm trả về kết quả hoặc ném ngoại lệ rõ ràng. Qua mạng, xuất hiện trạng thái thứ ba: không nhận được phản hồi và không biết phía bên kia đã chạy hay chưa."
whatChanged:
  - "+ Đối chiếu lời gọi hàm trong bộ nhớ với lời gọi RPC qua mạng không tin cậy"
  - "~ Loại bỏ 8 ngộ nhận phổ biến về mạng không trễ, không rơi gói và bất biến"
telemetry:
  - label: "Gọi hàm cục bộ"
    value: "ns · Tất định"
    tone: ok
  - label: "Gọi qua mạng"
    value: "1–200 ms · Bất định"
    tone: warn
  - label: "Trạng thái mới"
    value: "Timeout = Chưa rõ"
    tone: bad
```

Khi toàn bộ mã chạy trong một tiến trình duy nhất, phần cứng và hệ điều hành che chở cho lập trình viên: gọi hàm mất vài nano-giây, bộ nhớ dùng chung nhất quán tức thì, và nếu máy tắt nguồn thì toàn bộ tiến trình dừng cùng lúc.

Khi tách hệ thống ra nhiều máy nối bằng mạng, **8 ngộ nhận kinh điển của điện toán phân tán** (Peter Deutsch & James Gosling) lập tức lộ diện: đường truyền có thể đánh rơi gói tin, độ trễ khác không, băng thông hữu hạn, cấu hình mạng liên tục biến đổi và chi phí tuần tự hoá dữ liệu đáng kể.

Vì những đặc tính vật lý đó, thiết kế hệ phân tán không phải là cố gắng ngăn sự cố xảy ra bằng không, mà là đảm bảo hệ thống vẫn hành xử đúng đắn và có dự đoán trước khi đường truyền hoặc máy chủ gặp lỗi.

## 2. Độ trễ cao, mất gói tin và rủi ro nhân đôi giao dịch khi thử lại

```step
category: PROBLEM
short: Trễ, rơi, trùng
scene: s2-packet-dup
callout:
  kind: watch-out
  title: Timeout không đồng nghĩa với thất bại
  vi: "Khi Client hết thời gian chờ, gói yêu cầu có thể đã rớt trên đường đi, đang xếp hàng ở Server, hoặc đã ghi xong vào Database nhưng gói phản hồi bị rơi trên đường về."
whatChanged:
  - "+ Minh hoạ chuỗi mất gói phản hồi dẫn tới gửi lặp lệnh thanh toán"
  - "~ Bổ sung Idempotency Key để biến thao tác thử lại thành an toàn"
telemetry:
  - label: "Mất gói WAN"
    value: "0,1% – 2%"
    tone: warn
  - label: "Thử lại mù quáng"
    value: "Trừ tiền 2 lần"
    tone: bad
  - label: "Idempotency Key"
    value: "Thực thi đúng 1 lần"
    tone: ok
```

Ba sự cố đường truyền thường đi kèm nhau là **độ trễ tăng vọt (High Latency)**, **rơi gói tin (Packet Loss)** và **thông điệp trùng lặp (Message Duplication)**. Một dịch vụ phản hồi chậm 5 giây còn nguy hiểm hơn dịch vụ dừng hẳn: luồng xử lý ở tầng gọi bị giam giữ, hàng đợi dồn ứ, rồi người dùng hoặc ứng dụng tự động gửi lại yêu cầu.

Nếu gói phản hồi đầu tiên bị rớt sau khi Database đã thực hiện lệnh trừ tiền, lần thử lại kế tiếp sẽ tạo ra giao dịch thứ hai trùng lặp. Để khử rủi ro này, mọi thao tác thay đổi trạng thái cần đính kèm `idempotency_key` do phía gọi sinh trước:

```python
def charge_order(order_id: str, amount: int, idem_key: str) -> dict:
    cached = kv_store.get(f"idem:{idem_key}")
    if cached is not None:
        return cached  # Trả lại kết quả cũ, không trừ tiền lần hai
    receipt = payment_gateway.debit(order_id, amount, timeout=1.5)
    kv_store.set(f"idem:{idem_key}", receipt, ttl=86400)
    return receipt
```

Nhờ khoá bất biến này cùng ràng buộc `UNIQUE` dưới cơ sở dữ liệu, Client có thể thử lại an toàn (kèm Exponential Backoff và Jitter) mà không tạo bản ghi trùng.

## 3. Lỗi một phần (Partial Failure): trạng thái lưng chừng giữa nhiều dịch vụ

```step
category: PROBLEM
short: Lỗi một phần
scene: s3-partial-failure
callout:
  kind: key-idea
  title: Đặc trưng cốt lõi của hệ phân tán
  vi: "Một cụm máy phân tán hiếm khi hỏng toàn bộ cùng lúc; phổ biến nhất là một vài nút hoặc nhánh mạng lỗi trong khi phần còn lại vẫn chạy bình thường."
whatChanged:
  - "+ Dựng cây gọi thanh toán gồm 4 dịch vụ độc lập có kết cục lệch nhau"
  - "~ Chỉ ra trạng thái không nhất quán khi bước đầu thành công nhưng bước sau quá hạn"
telemetry:
  - label: "Thanh toán & Tạo đơn"
    value: "Thành công (OK)"
    tone: ok
  - label: "Trừ kho & Gửi thư"
    value: "Timeout / Lỗi"
    tone: bad
```

**Lỗi một phần (Partial Failure)** xảy ra khi một thao tác nghiệp vụ đi qua nhiều máy chủ, một số bước hoàn tất nhưng các bước tiếp theo thất bại hoặc quá hạn. Khác với giao dịch cục bộ trong một cơ sở dữ liệu quan hệ duy nhất (nơi `ROLLBACK` hoàn tác sạch sẽ mọi bảng), qua ranh giới mạng không có cơ chế tự động quay lui miễn phí.

Xét luồng đặt hàng trực tuyến gồm bốn bước: dịch vụ Thanh toán trừ thẻ thành công, dịch vụ Đơn hàng lưu bản ghi mới, nhưng dịch vụ Tồn kho quá hạn phản hồi và dịch vụ Email đang bảo trì. Kết quả là khách đã mất tiền nhưng số lượng hàng trong kho chưa giảm, dẫn tới nguy cơ bán vượt số hàng thực có.

Để kiểm soát lỗi một phần, kiến trúc sư phải tách bạch bước cốt lõi với bước phụ trợ (đẩy gửi email sang hàng đợi bất đồng bộ) và thiết kế quy trình giao dịch bù trừ (Saga) hoặc đối soát định kỳ cho các bước giữ tiền và giữ hàng.

## 4. Chia cắt mạng (Network Partition) và bài toán hai trung tâm dữ liệu

```step
category: MECHANISM
short: Chia cắt mạng
scene: s4-partition-intro
callout:
  kind: key-idea
  title: Định lý CAP của Brewer (chứng minh bởi Gilbert & Lynch)
  vi: "Trong hệ lưu trữ phân tán có sao chép dữ liệu, chia cắt mạng (P) là thực tế hạ tầng bắt buộc phải chịu đựng. Khi P xảy ra, hệ thống chỉ có thể bảo toàn Nhất quán mạnh (C) hoặc Khả dụng toàn diện (A)."
whatChanged:
  - "+ Dựng kiến trúc 2 vùng dữ liệu Vùng A (US) và Vùng B (EU) trên mặt sàn 2.5D"
  - "~ Đứt tuyến cáp quang xuyên đại dương khiến hai vùng không thể trao đổi gói tin"
telemetry:
  - label: "Trạng thái máy chủ"
    value: "Cả 2 vùng đều sống"
    tone: ok
  - label: "Đường nối US ↔ EU"
    value: "Đứt kết nối (P)"
    tone: bad
```

**Chia cắt mạng (Network Partition — P)** xuất hiện khi sự cố bộ định tuyến, đứt cáp quang biển, lỗi cấu hình tường lửa hoặc nghẽn đường trục làm các nhóm máy chủ mất liên lạc với nhau, dù từng máy bên trong mỗi vùng vẫn hoạt động bình thường.

Trên sân khấu là hệ thống phục vụ 2.000 req/s chia đều cho **Vùng A (US)** và **Vùng B (EU)**. Tải gồm 70% lượt đọc tại chỗ và 30% lượt ghi. Khi đường truyền xuyên lục địa đứt rời, một người dùng ở EU gửi lệnh cập nhật số dư hoặc đặt chỗ ngồi cuối cùng: Vùng B không có cách nào hỏi Vùng A xem dữ liệu đó vừa bị thay đổi hay chưa.

Đúng tại khoảnh khắc này, **Định lý CAP** buộc kiến trúc sư đưa ra quyết định rõ ràng:
- **Chọn C (Consistency):** Từ chối thao tác không thể kiểm chứng đồng bộ để tuyệt đối không sinh dữ liệu mâu thuẫn.
- **Chọn A (Availability):** Chấp nhận xử lý trên bản sao cục bộ để không trả lỗi cho người dùng, đổi lại hai vùng tạm thời lưu hai giá trị khác nhau.

## 5. Quan sát lựa chọn CP: bảo vệ tính đúng đắn bằng cách từ chối ghi khi đứt mạng

```step
category: MECHANISM
short: Chế độ CP
scene: s5-cp-live
live: cp-partition
activity: S3-01.A1
gate: optional
callout:
  kind: watch-out
  title: Cái giá của CP lúc chia cắt mạng
  vi: "Phía không hội đủ quyền ghi đồng bộ phải trả lỗi ngay lập tức cho thao tác ghi, đổi lại số dư tài khoản và tồn kho không bao giờ bị ghi lệch giữa hai vùng."
whatChanged:
  - "~ Cắt đường truyền liên vùng US ↔ EU từ giây 20 đến giây 45"
  - "~ Vùng B (EU) từ chối toàn bộ 30% lượt ghi, giữ 70% lượt đọc cục bộ"
telemetry:
  - label: "Lỗi trước sự cố (t = 10 s)"
    value: "{global.errorRate@10:0%}"
    tone: ok
  - label: "Lỗi lúc đứt cáp (t = 30 s)"
    value: "{global.errorRate@30:0%}"
    tone: bad
  - label: "Thông lượng đạt (t = 30 s)"
    value: "{global.goodputRps@30:0} req/s"
    tone: warn
```

Trong kịch bản **CP (`S3-01/cp-partition`)**, Vùng A (US) giữ vai trò nhánh chính (Primary), còn mọi thao tác ghi phát sinh tại Vùng B (EU) bắt buộc phải đi qua đường truyền liên vùng `eu-wan` để cập nhật đồng bộ trước khi xác nhận cho khách.

Hãy quan sát diễn biến theo trục thời gian của mô phỏng:
- **Từ giây 0 đến 19:** Đường truyền liên vùng thông suốt (RTT khoảng 65 ms). Toàn bộ 2.000 req/s thành công, tỷ lệ lỗi bằng 0%.
- **Từ giây 20 đến 45:** Tuyến liên vùng bị chia cắt. Người dùng tại US (1.000 req/s) vẫn đọc và ghi bình thường trên Primary. Tại EU (1.000 req/s), 700 lượt đọc/giây vẫn được phục vụ tại chỗ nhưng **300 lượt ghi/giây bị từ chối** vì không liên lạc được Vùng A, làm tỷ lệ lỗi toàn cục tăng lên đúng **15%**.
- **Từ giây 45 trở đi:** Đường mạng khôi phục, luồng ghi từ EU thông suốt trở lại và lỗi về 0%.

Nhờ chấp nhận từ chối 300 lượt ghi/giây ở nhánh bị cô lập, hệ thống đảm bảo không có hai khách hàng ở hai châu lục cùng mua trùng một vé máy bay duy nhất.

## 6. Quan sát lựa chọn AP: duy trì 100% phản hồi nhưng phát sinh độ lệch bản sao

```step
category: MECHANISM
short: Chế độ AP
scene: s6-ap-live
live: ap-partition
callout:
  kind: compare
  title: Đánh đổi ngược lại của AP
  vi: "Tỷ lệ lỗi giữ ở 0% suốt thời gian đứt cáp, nhưng bản sao tại Vùng B tích luỹ độ trễ hàng nghìn mili-giây và cần cơ chế hợp nhất xung đột khi mạng nối lại."
whatChanged:
  - "~ Đổi chính sách đường liên vùng sang ghi cục bộ dự phòng (degrade) khi đứt mạng"
  - "~ Lỗi toàn cục giảm về 0%, nhưng độ trễ sao chép ở DB EU vượt 3.000 ms"
telemetry:
  - label: "Lỗi lúc đứt cáp (t = 30 s)"
    value: "{global.errorRate@30:0%}"
    tone: ok
  - label: "Thông lượng đạt (t = 30 s)"
    value: "{global.goodputRps@30:0} req/s"
    tone: ok
  - label: "Mức tải DB EU (t = 35 s)"
    value: "{db-eu.loadPct@35:0}%"
    tone: bad
```

Chuyển sang kịch bản **AP (`S3-01/ap-partition`)**, khi tuyến `eu-wan` bị cắt ở giây 20, ứng dụng tại EU không trả lỗi mà chuyển sang ghi tạm vào kho cục bộ và xếp hàng đồng bộ bù sau khi mạng khôi phục.

Kết quả đo trên mô phỏng đảo ngược hoàn toàn so với CP:
- **Suốt giai đoạn giây 20 – 45:** Cả 2.000 req/s ở hai châu lục đều nhận phản hồi thành công (tỷ lệ lỗi **0%**). Trải nghiệm người dùng không bị gián đoạn.
- **Hệ quả ngầm phía dưới:** Luồng sao chép `dc-repl` cũng bị đứt, khiến độ trễ sao chép (`lagMs`) trên `DB Vùng B` tăng vọt quá **3.000 ms** ở giây 35 và hơn 20% lượt đọc nhận dữ liệu cũ. Nếu cùng một bản ghi được sửa ở cả US lẫn EU trong khoảng 25 giây đó, khi mạng nối lại ở giây 45 hệ thống bắt buộc phải giải quyết xung đột (bằng Vector Clock, CRDT hoặc quy tắc nghiệp vụ).

Chế độ AP rất phù hợp cho giỏ hàng mua sắm, hồ sơ cá nhân, lượt thích hoặc luồng sự kiện phân tích — nơi việc tiếp nhận thao tác của khách quan trọng hơn sự đồng nhất tức thời.

## 7. Những hiểu lầm thường gặp về CAP và bức tranh đầy đủ PACELC

```step
category: PITFALL
short: Hiểu sai CAP
scene: s7-cap-pacelc
callout:
  kind: good-to-know
  title: Công thức PACELC (Daniel Abadi, 2012)
  vi: "Nếu có Partition (P) thì chọn giữa Availability (A) và Consistency (C); ngược lại (Else — khi mạng lành), vẫn phải chọn giữa Latency thấp (L) và Consistency mạnh (C)."
whatChanged:
  - "+ Bổ sung cây quyết định PACELC cho cả lúc đứt mạng lẫn lúc mạng ổn định"
  - "~ Giải thích vì sao nhãn CA chỉ tồn tại trên máy đơn không phân tán qua mạng"
telemetry:
  - label: "Khi có P (Sự cố)"
    value: "Chọn C hoặc A"
    tone: bad
  - label: "Khi không P (99,9%)"
    value: "Chọn L hoặc C"
    tone: warn
```

Khi vận dụng định lý CAP trong thiết kế và phỏng vấn, cần tránh ba hiểu lầm phổ biến:

1. **Tưởng rằng có thể chọn CA trong hệ phân tán nhiều nút.** Bạn không thể ra lệnh cho cáp quang và bộ định tuyến không bao giờ hỏng. Một hệ thống được gọi là CA thực chất chỉ là cơ sở dữ liệu chạy trên một máy đơn lẻ (không có phân vùng mạng giữa các bản sao).
2. **Nghĩ rằng CAP bắt hy sinh C hoặc A mọi lúc.** Định lý CAP chỉ phát biểu cho khoảng thời gian đang xảy ra chia cắt mạng. Khi đường truyền lành lặn, hệ thống vừa nhất quán vừa sẵn sàng phục vụ.
3. **Bỏ quên chi phí độ trễ lúc mạng bình thường.** Đó là lý do mô hình **PACELC** ra đời: ngay cả khi không đứt cáp (**E**lse), nếu muốn nhất quán mạnh (**C**) bạn vẫn phải chờ gói tin đi qua các vùng (tốn hàng chục mili-giây độ trễ), còn muốn độ trễ cực thấp (**L**) bạn phải trả lời ngay từ bản sao gần nhất và chấp nhận nhất quán cuối cùng.

| Hệ thống tiêu biểu | Khi đứt mạng (P) | Khi mạng lành (E) | Phân loại PACELC |
|---|---|---|---|
| etcd, CockroachDB, Spanner | Ưu tiên C | Ưu tiên C (đợi đa số) | PC / EC |
| DynamoDB (mặc định), Cassandra | Ưu tiên A | Ưu tiên L (trả lời nhanh) | PA / EL |
| MongoDB (cấu hình chuẩn) | Ưu tiên C (bầu Primary) | Ưu tiên L (đọc bất đồng bộ) | PC / EL |

## 8. Thiết kế thực chiến: phối hợp CP và AP theo từng tính năng

```step
category: TECHNIQUE
short: Phối hợp CP-AP
scene: s8-hybrid-design
activity: S3-01.A2
gate: required
callout:
  kind: technique
  title: Bốn nguyên tắc phòng vệ đường truyền liên vùng
  vi: "Chọn CP/AP theo rủi ro nghiệp vụ, đặt Timeout ngắn (Fail Fast), thử lại có Exponential Backoff + Jitter kèm ngân sách, và bắt buộc dùng Idempotency Key."
whatChanged:
  - "+ Tách chính sách theo nghiệp vụ kết hợp Timeout ngắn và Backoff có Jitter"
  - "~ Giữ thông suốt ở cả giờ cao điểm lẫn sự cố chia cắt đường truyền"
telemetry:
  - label: "Sổ cái & Đặt vé"
    value: "CP · Cấm ghi lệch"
    tone: warn
  - label: "Hồ sơ & Bảng tin"
    value: "AP · Ưu tiên phục vụ"
    tone: ok
  - label: "Timeout liên vùng"
    value: "150 – 250 ms"
    tone: ok
```

Kiến trúc sản phẩm thực tế không đóng khung toàn bộ nền tảng vào một nhãn CP hay AP duy nhất, mà phân tách theo **mức độ thiệt hại nghiệp vụ của dữ liệu sai**:

- **Nhánh bắt buộc CP:** Thanh toán, rút tiền, trừ tồn kho món hàng cuối cùng, đổi mật khẩu và thu hồi quyền truy cập. Thà báo hệ thống tạm bận vài chục giây còn hơn tạo giao dịch âm tiền hoặc lộ bảo mật.
- **Nhánh ưu tiên AP:** Cập nhật ảnh đại diện, danh sách theo dõi, bộ đếm lượt xem, giỏ hàng tạm và luồng gợi ý sản phẩm. Khi đứt cáp liên vùng, ứng dụng ghi nhận cục bộ (`fallback: degrade`) với `timeoutMs` ngắn (150–250 ms) để không làm treo luồng xử lý.
- **Kỷ luật thử lại:** Tuyệt đối không bật Retry tức thì (`backoff: none`) trên đường xuyên vùng đang chập chờn; luôn cấu hình `exponential` backoff kèm `full` jitter và giới hạn tỷ lệ thử lại (`budgetRatio <= 0,1`) để tránh bão retry dồn sập cụm máy chủ khi đường truyền vừa nối lại.

## 9. Tóm tắt: thiết kế cho sự cố thay vì giả định mạng hoàn hảo

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Ghi nhớ cốt lõi
  vi: "Mạng phân tán luôn có trễ, rơi gói và chia cắt. Hãy dùng Idempotency để khử trùng lặp, Saga/Queue cho lỗi một phần, và chọn CP hay AP dựa trên hậu quả kinh doanh của từng tính năng."
whatChanged:
  - "+ Tổng hợp khung xử lý sự cố phân tán và ma trận quyết định CAP / PACELC"
telemetry:
  - label: "Mất gói / Trùng lặp"
    value: "Idempotency + Backoff"
    tone: ok
  - label: "Đứt mạng (CP vs AP)"
    value: "Đúng đắn vs Khả dụng"
    tone: warn
```

Bốn quy tắc nền tảng khi bước từ hệ thống một máy sang hệ phân tán nhiều vùng:

1. **Timeout là trạng thái chưa xác định:** Không bao giờ giả định yêu cầu quá hạn nghĩa là chưa chạy; luôn đính kèm `idempotency_key` trước khi cho phép tự động thử lại.
2. **Cô lập lỗi một phần:** Đặt Timeout ngắn, dùng hàng đợi bất đồng bộ cho tác vụ phụ và chuẩn bị giao dịch bù trừ khi quy trình đi qua nhiều kho dữ liệu.
3. **Hiểu đúng CAP và PACELC:** Chia cắt mạng (`P`) là tất yếu vật lý; lúc đứt mạng bạn chọn giữa từ chối phục vụ để giữ đúng dữ liệu (`CP`) hoặc tiếp nhận tạm rồi hợp nhất sau (`AP`), còn lúc mạng lành vẫn phải cân đối giữa độ trễ (`L`) và nhất quán (`C`).
4. **Quyết định theo từng tính năng:** Bảo vệ tiền bạc, tồn kho và xác thực bằng `CP`; giải phóng tốc độ và độ sẵn sàng cho trải nghiệm xã hội, danh mục và phân tích bằng `AP`.

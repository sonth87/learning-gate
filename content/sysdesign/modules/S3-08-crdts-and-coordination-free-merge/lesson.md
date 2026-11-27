## 1. Ghi độc lập trên nhiều bản sao mà không cần khoá hay bầu Leader

```step
category: SETUP
short: Ghi đa vùng AP
scene: s1-ap-dilemma
callout:
  kind: key-idea
  title: Nhánh AP của định lý CAP cần luật gộp toán học
  vi: "Nếu cho phép cả Hà Nội lẫn Singapore cùng nhận lệnh ghi khi đứt cáp biển (ưu tiên Availability), hai bản sao sẽ tạm thời rẽ nhánh. CRDT đảm bảo khi nối mạng lại, chúng tự gộp về đúng một trạng thái duy nhất mà không cần trọng tài."
whatChanged:
  - "+ Hai bản sao Hà Nội và Singapore cùng nhận lệnh ghi trực tiếp (Active-Active)"
  - "~ Đường đồng bộ liên vùng bị đứt nhưng cả hai phía vẫn phục vụ 100% lưu lượng"
telemetry:
  - label: "Mô hình nhất quán"
    value: "Strong Eventual (SEC)"
    tone: ok
  - label: "Phối hợp trên đường ghi"
    value: "0 vòng mạng"
    tone: ok
```

Ở các bài `S3-03` (Raft), `S3-07` (khoá dòng) và `S3-04` (2PC), muốn ngăn xung đột dữ liệu, các máy chủ phải **xin phép nhau trước khi hoàn tất lệnh ghi**. Cái giá phải trả là độ trễ xuyên vùng và việc phía thiểu số phải từ chối phục vụ khi đứt mạng.

Tuy nhiên, rất nhiều bài toán quy mô lớn lại cần ưu tiên **độ sẵn sàng ghi tuyệt đối và độ trễ cục bộ** (nhánh AP): giỏ hàng thương mại điện tử toàn cầu, bộ đếm lượt thích/lượt xem bài viết, danh sách hiện diện trực tuyến hoặc ứng dụng ghi chú làm việc ngoại tuyến trên điện thoại.

**CRDT (Conflict-free Replicated Data Types)** giải bài toán này bằng cách nhúng thẳng quy tắc giải quyết xung đột vào cấu trúc dữ liệu, đảm bảo **Nhất quán cuối cùng mạnh (Strong Eventual Consistency — SEC)**: bất kỳ hai bản sao nào đã nhận cùng một tập cập nhật (dù khác thứ tự) đều tức khắc mang cùng một trạng thái giống hệt nhau.

## 2. Vì sao ghi đè theo mốc thời gian (Last-Write-Wins) làm mất dữ liệu?

```step
category: PROBLEM
short: Bẫy ghi đè LWW
scene: s2-lww-pitfall
callout:
  kind: watch-out
  title: Ghi đè con số tổng làm xoá sổ thao tác đồng thời
  vi: "Khi hai vùng cùng đọc likes = 10 rồi mỗi bên cộng 1 và gửi giá trị 11 kèm timestamp, phép chọn bản mới hơn (LWW) chỉ giữ lại một số 11 và đánh rơi vĩnh viễn một lượt thích."
whatChanged:
  - "~ Hà Nội cộng 1 (ghi 11, ts=102) đồng thời Singapore cộng 1 (ghi 11, ts=105)"
  - "~ Hợp nhất LWW chọn 11 thay vì 12; tương tự giỏ hàng ghi đè làm mất món vừa thêm"
telemetry:
  - label: "Giá trị đúng kỳ vọng"
    value: "12 lượt thích"
  - label: "Giá trị sau LWW"
    value: "11 (mất 1 lượt)"
    tone: bad
```

Phản xạ đầu tiên khi đồng bộ hai bản sao độc lập thường là gắn nhãn thời gian cho mỗi lần ghi và giữ bản có mốc lớn hơn (**Last-Write-Wins — LWW**). Cách này gây mất dữ liệu nghiêm trọng trên các cấu trúc tích luỹ:

- **Trên bộ đếm:** Bài viết đang có `likes = 10`. Lúc cáp biển đứt, khách ở Hà Nội bấm thích (`10 + 1 = 11` tại `ts = 102`), khách ở Singapore cũng bấm thích (`10 + 1 = 11` tại `ts = 105`). Khi nối mạng lại, hàm gộp LWW so `105 > 102` nên giữ `11` — lượt thích tại Hà Nội biến mất không dấu vết.
- **Trên tập hợp (giỏ hàng):** Giỏ gốc có `{sách}`. Trên điện thoại ngoại tuyến khách thêm `bút` (`{sách, bút}`), trên laptop khách thêm `vở` (`{sách, vở}`). Gộp nguyên mảng theo LWW sẽ xoá mất `bút` hoặc xoá mất `vở`.

Nguyên nhân gốc là bản sao đã gửi đi **kết quả đè phẳng cuối cùng** thay vì cấu trúc bảo toàn phần đóng góp độc lập của từng phía.

## 3. Nền tảng toán học: dàn bán phần (Join-Semilattice) và ba luật ACI

```step
category: MECHANISM
short: Ba tính chất ACI
scene: s3-aci-semilattice
callout:
  kind: key-idea
  title: Mạng phân tán lộn xộn cần phép toán miễn nhiễm với thứ tự và trùng lặp
  vi: "Trong mạng thực tế, gói tin đồng bộ có thể đến trễ, đảo thứ tự hoặc gửi lặp nhiều lần. Hàm merge(A, B) thoả Kết hợp, Giao hoán và Luỹ đẳng (ACI) biến mọi kịch bản mạng đó thành vô hại."
whatChanged:
  - "+ Định nghĩa phép hợp nhất trạng thái A ⊔ B trên dàn bán phần (Join-Semilattice)"
  - "+ Đối chiếu từng tính chất đại số với từng lỗi mạng vật lý tương ứng"
telemetry:
  - label: "Đảo thứ tự gói tin"
    value: "Đã có Giao hoán"
    tone: ok
  - label: "Gửi trùng gói Gossip"
    value: "Đã có Luỹ đẳng"
    tone: ok
```

Trong mô hình **State-based CRDT (CvRDT)**, các bản sao định kỳ gửi toàn bộ trạng thái cục bộ cho nhau và gộp bằng hàm `merge(A, B)` (ký hiệu $A \sqcup B$). Để mọi bản sao chắc chắn hội tụ mà không cần giao thức đồng thuận, phép toán $\sqcup$ chỉ cần thoả mãn ba tính chất **ACI**:

1. **Giao hoán (Commutativity):** $A \sqcup B = B \sqcup A$ — Hà Nội nhận gói của Singapore trước hay sau đều cho cùng kết quả (chống đảo thứ tự gói tin).
2. **Kết hợp (Associativity):** $(A \sqcup B) \sqcup C = A \sqcup (B \sqcup C)$ — Ba hay mười vùng gộp theo từng cặp bất kỳ đều về chung một đích.
3. **Luỹ đẳng (Idempotence):** $A \sqcup A = A$ — Một gói Gossip bị gửi lặp 5 lần do Timeout mạng khi gộp lại vẫn không làm thay đổi trạng thái (không bao giờ cộng dư).

Phép cộng thông thường `a + b` có giao hoán và kết hợp nhưng **không luỹ đẳng** ($5 + 5 = 10 \neq 5$); ngược lại phép lấy cực đại $\max(a, b)$ và phép hợp tập hợp $A \cup B$ thoả mãn trọn vẹn cả ba tính chất ACI!

## 4. G-Counter và PN-Counter: đếm chính xác không cần khoá

```step
category: TECHNIQUE
short: Bộ đếm CRDT
scene: s4-gcounter
callout:
  kind: technique
  title: Mỗi Replica chỉ được phép ghi vào ô của riêng mình
  vi: "Thay vì dùng chung một con số, G-Counter tách thành mảng N ô cho N replica. Mỗi máy cộng trên ô của mình, đọc thì cộng tổng cả mảng, còn gộp thì lấy max() từng ô."
whatChanged:
  - "+ G-Counter tách vector theo từng replica: merge lấy max() từng phần tử"
  - "+ PN-Counter ghép hai G-Counter độc lập (P cho lượt cộng, N cho lượt trừ)"
telemetry:
  - label: "HN [15, 4] ⊔ SG [8, 12]"
    value: "[15, 12] → Tổng 27"
    tone: ok
  - label: "Gửi lặp gói HN 3 lần"
    value: "max(15, 15) = 15"
    tone: ok
```

**G-Counter (Grow-only Counter)** biến phép cộng (không luỹ đẳng) thành phép $\max$ (luỹ đẳng) bằng cách cấp cho mỗi replica một ô riêng trong vector trạng thái:

```typescript
class GCounter {
  constructor(private counts: Record<string, number> = {}) {}

  increment(replicaId: string, delta = 1): void {
    this.counts[replicaId] = (this.counts[replicaId] ?? 0) + delta;
  }

  value(): number {
    return Object.values(this.counts).reduce((s, v) => s + v, 0);
  }

  merge(other: GCounter): GCounter {
    const out: Record<string, number> = { ...this.counts };
    for (const [rep, v] of Object.entries(other.counts)) {
      out[rep] = Math.max(out[rep] ?? 0, v);
    }
    return new GCounter(out);
  }
}
```

Ví dụ: Hà Nội có `[hn: 15, sg: 4]`, Singapore có `[hn: 8, sg: 12]`. Khi gộp lại: `[max(15, 8), max(4, 12)] = [15, 12]`, tổng đọc ra bằng `27`. Dù Hà Nội gửi lặp gói `[15, 4]` thêm mười lần, `max(15, 15)` vẫn bằng `15`.

Để hỗ trợ cả phép trừ (như nút bấm Upvote / Downvote), **PN-Counter** dùng cặp hai `G-Counter`: vector $P$ ghi tổng lượt tăng và vector $N$ ghi tổng lượt giảm (`decrement` thực chất là `increment` vào $N$). Cả $P$ lẫn $N$ đều chỉ tăng đơn điệu nên gộp bằng $\max()$ từng ô như cũ, còn giá trị hiển thị là $\text{sum}(P) - \text{sum}(N)$.

## 5. Ghép đôi PN-Counter và LWW-Register có phân xử tất định

```step
category: MECHANISM
short: PN & LWW-Reg
scene: s6-lww-register
callout:
  kind: good-to-know
  title: LWW-Register vẫn hữu ích khi giá trị là nguyên khối không cộng gộp
  vi: "Với các trường gán đè trọn vẹn như Ảnh đại diện, Biệt danh hoặc Dòng trạng thái, LWW-Register kèm cặp (timestamp, replicaId) đảm bảo mọi máy đều chọn đúng cùng một người thắng khi trùng mili-giây."
whatChanged:
  - "+ LWW-Register lưu bộ ba (value, timestamp, replicaId) để phân xử hoà tất định"
  - "~ Cảnh báo rủi ro một máy lệch đồng hồ nhanh hơn sẽ đè các bản ghi sau"
telemetry:
  - label: "Luật phân xử khi ts bằng nhau"
    value: "So thứ tự replicaId"
    tone: ok
  - label: "Đồng hồ khuyên dùng"
    value: "Hybrid Logical Clock"
```

Trong một đối tượng dữ liệu lớn (như hồ sơ người dùng hoặc thẻ công việc), ta thường kết hợp nhiều CRDT con: số lượt bình chọn dùng **PN-Counter**, còn tiêu đề hoặc dòng mô tả dùng **LWW-Register**.

Để `LWW-Register` thực sự là một CRDT thoả mãn tính giao hoán ngay cả khi hai nơi sửa vào **cùng một mili-giây** (`ts = 500`), hàm `merge` không được giữ bản đến trước mà phải phân xử tất định theo thứ tự từ điển của mã định danh bản sao (`replicaId`):

$$\text{winner}(A, B) = \begin{cases} B & \text{nếu } B.\text{ts} > A.\text{ts} \text{ hoặc } (B.\text{ts} = A.\text{ts} \land B.\text{replica} \ge A.\text{replica}) \\ A & \text{ngược lại} \end{cases}$$

Lưu ý từ bài `S3-06`: nếu dùng đồng hồ vật lý NTP bị nhảy vọt tương lai 5 giây trên một máy, bản ghi của máy đó sẽ thắng không công bằng trong suốt 5 giây tiếp theo; thực tế nên gắn **Hybrid Logical Clock (HLC)** cho `timestamp`.

## 6. Tập hợp Add-Wins OR-Set: thêm và xoá đồng thời trên giỏ hàng

```step
category: TECHNIQUE
short: Add-Wins OR-Set
scene: s7-orset-addwins
callout:
  kind: key-idea
  title: Chỉ được phép xoá những thẻ thêm mà bản sao đó đã thực sự nhìn thấy
  vi: "Trong Observed-Remove Set (OR-Set), mỗi lần add(x) đúc một thẻ định danh duy nhất (replica:seq). Lệnh remove(x) chỉ đưa các thẻ đang hiện diện cục bộ vào tập bia mộ (tombstones), nên một lệnh add(x) mới ở vùng khác luôn chiến thắng."
whatChanged:
  - "+ Gắn thẻ duy nhất (hn:1, hn:2) cho mỗi thao tác thêm phần tử vào tập"
  - "+ Hợp nhất bằng phép hợp ∪ cho cả tập thêm (adds) lẫn tập bia mộ (tombs)"
telemetry:
  - label: "Thêm mới đồng thời với Xoá"
    value: "Giữ phần tử (Add-Wins)"
    tone: ok
  - label: "Phép gộp tập hợp"
    value: "Hợp ∪ (thoả ACI)"
    tone: ok
```

Với một tập hợp cho phép cả thêm và xoá (như giỏ hàng thương mại điện tử), nếu chỉ giữ hai tập `adds` và `removes` đơn giản (**2P-Set**), một phần tử đã vào `removes` sẽ không bao giờ thêm lại được nữa.

**Observed-Remove Set (Add-Wins OR-Set)** giải quyết triệt để bằng cách gắn cho mỗi lần thêm một thẻ định danh duy nhất `tag = "${replica}:${seq}"`:

- **`add(replica, item)`:** Tạo thẻ mới (ví dụ `hn:2`) và chèn vào `adds[item]`.
- **`remove(item)`:** Lấy toàn bộ các thẻ hiện có của `item` trên máy cục bộ (ví dụ chỉ mới thấy `hn:1`) chép sang tập `tombstones`.
- **`has(item)`:** Phần tử còn sống khi và chỉ khi `adds[item]` có ít nhất một thẻ **chưa nằm trong** `tombstones`.
- **`merge(other)`:** Lấy phép hợp ($\cup$) của các tập `adds` và phép hợp ($\cup$) của `tombstones`.

Khi Singapore bấm xoá `tai-nghe` (chỉ biết và gạch thẻ `hn:1`) cùng lúc Hà Nội bấm thêm lại `tai-nghe` (sinh thẻ mới `hn:2`), sau khi hợp nhất `adds['tai-nghe'] = {hn:1, hn:2}` và `tombstones = {hn:1}`. Vì `hn:2` còn sống, món hàng khách vừa chủ đích thêm lại được bảo toàn (**Add-Wins**), rất đúng kỳ vọng nghiệp vụ giỏ hàng!

## 7. Quan sát phân tách mạng trực tiếp: 0% lỗi ghi và tự hội tụ khi nối lại

```step
category: MECHANISM
short: Mô phỏng đứt cáp
scene: s8-partition-live
live: ap-sync
activity: S3-08.A1
gate: optional
callout:
  kind: good-to-know
  title: Đổi độ trễ đồng bộ lấy 100% khả dụng ghi cục bộ
  vi: "Suốt 25 giây đứt đường truyền liên vùng (t = 15..40 s), không một thao tác bấm thích hay thêm giỏ hàng nào của người dùng bị từ chối. Khi cáp nối lại ở giây 40, hàm merge san bằng độ lệch trong vài giây."
whatChanged:
  - "~ t = 15 s: đứt đường đồng bộ Hà Nội – Singapore, lỗi hệ thống giữ nguyên 0%"
  - "~ t = 40 s: đường truyền khôi phục, hai bản sao trao đổi vector trạng thái và hội tụ"
telemetry:
  - label: "Tỉ lệ lỗi khi đứt mạng"
    value: "0%"
    tone: ok
  - label: "Thông lượng phục vụ"
    value: "1.800 req/s"
    tone: ok
  - label: "Khôi phục đồng bộ"
    value: "t = 40 s"
    tone: warn
```

Trên sân khấu mô phỏng trực tiếp với lưu lượng `1.800 req/s` chia đều cho `Replica Hà Nội` và `Replica Singapore`:

- **Giây 0 → 15:** Kênh Gossip liên vùng hoạt động bình thường (`RTT = 35 ms`), trạng thái CRDT giữa hai vùng bám sát nhau liên tục.
- **Giây 15 → 40 (Đứt kết nối liên vùng):** Khác hẳn hệ thống CP (như 2PC hay thiểu số Raft phải trả lỗi), cả hai bản sao CRDT vẫn xử lý trọn vẹn `1.800 req/s` với **tỷ lệ lỗi 0%**. Phần cập nhật mới tại Hà Nội tích luỹ trong vector trạng thái cục bộ làm chỉ số `Lag` tăng dần.
- **Từ giây 40 (Mạng nối lại):** Quá trình trao đổi trạng thái (Anti-entropy) xả toàn bộ thay đổi tồn đọng và áp dụng hàm `merge` ($\sqcup$). Chỉ sau khoảng 6 giây, hai vùng hội tụ hoàn toàn về cùng một giá trị mà không mất bất kỳ lượt ghi nào.

## 8. Giới hạn của CRDT: chi phí bia mộ, đọc lùi và bất biến toàn cục

```step
category: PITFALL
short: Giới hạn CRDT
scene: s9-recap
activity: S3-08.A2
gate: required
callout:
  kind: watch-out
  title: CRDT không thể bảo vệ ràng buộc số dư không âm hay bán chiếc vé cuối cùng
  vi: "Nếu tài khoản còn 100 USD mà khách rút 80 USD ở Hà Nội đồng thời rút 80 USD ở Singapore, PN-Counter sẽ hợp nhất mượt mà thành −60 USD! Mọi bất biến toàn cục có ngưỡng chặn bắt buộc phải dùng đồng thuận hoặc khoá."
whatChanged:
  - "+ Cảnh báo hiện tượng đọc lùi (Non-monotonic Read) khi client nhảy sang bản sao chậm hơn"
  - "+ Phân định rạch ròi bài toán hợp với CRDT và bài toán bắt buộc dùng khoá / Raft"
telemetry:
  - label: "Chống đọc lùi cho 1 khách"
    value: "Sticky Session / Vector"
    tone: warn
  - label: "Ràng buộc số dư ≥ 0"
    value: "Không dùng CRDT!"
    tone: bad
```

Dù rất mạnh cho hệ thống phân tán đa vùng, CRDT có ba giới hạn kỹ thuật phải tính trước khi chọn:

1. **Không bảo vệ được bất biến toàn cục có điều kiện chặn:** `PN-Counter` cho phép trừ tự do ở từng vùng nên tổng sau khi gộp có thể tụt xuống âm (`100 - 80 - 80 = -60`). Với tồn kho chiếc ghế cuối cùng (`S3-07`) hoặc ví tiền không được phép thấu chi, bạn bắt buộc phải phối hợp qua một chủ sở hữu (khoá dòng, Raft hoặc cấp hạn mức con — *escrow quota* — trước cho từng vùng).
2. **Hiện tượng đọc lùi (Non-Monotonic Reads) khi chưa hội tụ xong:** Trong lúc Gossip đang truyền đi, nếu một người dùng vừa đọc `Replica Hà Nội` thấy `18` lượt thích, rồi câu truy vấn kế tiếp bị bộ cân bằng tải đẩy sang `Replica Singapore` chưa kịp nhận gói đồng bộ, họ sẽ thấy con số tụt lùi về `12`. Cách khắc phục: bật định tuyến cố định theo phiên (`ip-hash` / sticky session) hoặc để client gửi kèm phiên bản vector đã thấy.
3. **Chi phí bộ nhớ Metadata và Tombstone:** Vector của `G-Counter` dài theo số replica, còn `OR-Set` tích luỹ dần các thẻ xoá; các hệ cơ sở dữ liệu thực tế (như Riak, Redis Enterprise Active-Active) phải dùng cơ chế cắt tỉa bia mộ định kỳ sau khi xác nhận mọi replica đã đồng bộ qua mốc đó.

## 9. Tổng kết: bảng chọn cấu trúc dữ liệu CRDT

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Quy tắc chọn nhanh
  vi: "Cần cộng/trừ hội tụ: G-Counter / PN-Counter. Cần gán đè nguyên trường: LWW-Register (kèm HLC). Cần tập hợp thêm/xoá an toàn: Add-Wins OR-Set. Cần chặn âm tiền/hết kho: quay về Khoá / Đồng thuận."
whatChanged:
  - "+ Bảng đối chiếu 4 loại CRDT chuẩn và điều kiện áp dụng thực tế"
telemetry:
  - label: "Điều kiện toán học"
    value: "Giao hoán · Kết hợp · Luỹ đẳng"
    tone: ok
  - label: "Độ sẵn sàng khi đứt mạng"
    value: "100% ghi cục bộ"
    tone: ok
```

Tóm tắt bốn cấu trúc dữ liệu CRDT cốt lõi trong thiết kế hệ thống phân tán:

| Cấu trúc | Trạng thái lưu trữ | Phép hợp nhất `merge(A, B)` | Ứng dụng tiêu biểu |
|---|---|---|---|
| **G-Counter** | Mảng `counts[replica]` chỉ tăng | `max(A[r], B[r])` cho từng `r` | Đếm lượt xem trang, chỉ số telemetry |
| **PN-Counter** | Hai G-Counter `P` (tăng) và `N` (giảm) | Gộp `P` bằng `max`, gộp `N` bằng `max` | Lượt thích / bỏ thích, số người đang xem |
| **LWW-Register** | Bộ ba `(value, ts, replicaId)` | Chọn bản có `(ts, replicaId)` lớn hơn | Đổi tên hiển thị, trạng thái hồ sơ đơn trị |
| **Add-Wins OR-Set** | `adds[item] -> Set<tag>` và `tombstones` | Phép hợp tập hợp $\cup$ trên cả hai tập | Giỏ hàng đa thiết bị, danh sách thẻ tài liệu |

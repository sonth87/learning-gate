## 1. Vì sao sao chép dữ liệu biến tính nhất quán thành một dải lựa chọn?

```step
category: SETUP
short: Phổ nhất quán
scene: s1-spectrum
callout:
  kind: key-idea
  title: Nhất quán là hợp đồng giữa hệ lưu trữ và ứng dụng
  vi: "Mô hình nhất quán quy định chính xác giá trị nào được phép trả về khi nhiều khách hàng đọc và ghi đồng thời lên dữ liệu được nhân bản qua nhiều máy."
whatChanged:
  - "+ Xếp các mô hình nhất quán trên một phổ liên tục từ chặt nhất đến lỏng nhất"
  - "~ Gắn mỗi bậc nhất quán với chi phí phối hợp qua mạng tương ứng"
telemetry:
  - label: "Chặt nhất"
    value: "Linearizable"
    tone: warn
  - label: "Trung gian"
    value: "Causal / Session"
    tone: ok
  - label: "Lỏng nhất"
    value: "Eventual"
    tone: default
```

Trên một máy cơ sở dữ liệu đơn lẻ, mọi lượt đọc và ghi đều đi qua cùng một bộ nhớ nên thứ tự hiển nhiên: khi giao dịch ghi `X = 10` hoàn tất, lượt đọc ngay sau đó luôn thấy `10`.

Khi nhân bản dữ liệu ra ba máy chủ ở ba vùng khả dụng để chịu lỗi và mở rộng tải, gói tin sao chép cần thời gian bay qua mạng. Giữa lúc bản sao thứ nhất vừa cập nhật `X = 10` và lúc bản sao thứ ba nhận được gói tin đó, một khách hàng truy vấn vào bản sao thứ ba sẽ nhận giá trị gì?

Câu trả lời không chỉ có đúng hoặc sai nhị phân, mà trải thành một **phổ mô hình nhất quán**: từ **Tuyến tính hoá (Linearizability)**, **Nhất quán nhân quả (Causal)**, **Bảo đảm theo phiên (Session Guarantees)** cho đến **Nhất quán cuối cùng (Eventual Consistency)**. Bậc càng chặt thì lập trình ứng dụng càng đơn giản, nhưng chi phí chờ mạng càng lớn.

## 2. Nhất quán mạnh và Tuyến tính hoá (Linearizability)

```step
category: MECHANISM
short: Nhất quán mạnh
scene: s2-linearizable
callout:
  kind: key-idea
  title: Định nghĩa điểm tuyến tính hoá
  vi: "Hệ thống tuyến tính hoá tạo cảm giác chỉ có một bản sao duy nhất: mỗi thao tác có vẻ như xảy ra tức thời tại một điểm thời gian nằm giữa lúc gửi yêu cầu và lúc nhận kết quả."
whatChanged:
  - "+ Minh hoạ trục thời gian của lệnh ghi và các lệnh đọc gối đầu hoặc nối tiếp"
  - "~ Mọi lượt đọc bắt đầu sau khi lệnh ghi kết thúc bắt buộc thấy giá trị mới"
telemetry:
  - label: "Ảo giác mang lại"
    value: "1 bản sao duy nhất"
    tone: ok
  - label: "Đọc sau khi ghi xong"
    value: "Luôn thấy bản mới"
    tone: ok
  - label: "Chi phí mạng"
    value: "Cao (đợi đồng thuận)"
    tone: bad
```

Hình thái chặt chẽ nhất của nhất quán mạnh là **Linearizability** (còn gọi là nhất quán nguyên tử theo thời gian thực). Quy tắc kiểm chứng trên trục thời gian rất rõ ràng:

- Nếu thao tác ghi `W(x = 10)` hoàn tất tại mốc `t = 50 ms`, thì **bất kỳ** thao tác đọc nào bắt đầu sau `50 ms` (dù gửi từ khách hàng nào tới máy chủ nào) đều bắt buộc nhận `10`.
- Nếu một thao tác đọc diễn ra chồng lấp trong khoảng `W(x = 10)` đang chạy, nó có thể trả về giá trị cũ hoặc `10`; nhưng một khi đã có bất kỳ ai đọc thấy `10`, mọi lượt đọc bắt đầu sau thời điểm đó không bao giờ được phép quay lại giá trị cũ nữa.

Đặc tính tươi mới theo thời gian thực này là nền tảng bắt buộc cho **khoá phân tán (Distributed Lock)**, **bầu chọn Leader**, **ràng buộc tên tài khoản duy nhất** và **trừ số dư tài chính hoặc ghế ngồi cuối cùng**.

## 3. Nhất quán cuối cùng (Eventual Consistency) và hiện tượng đọc cũ

```step
category: MECHANISM
short: Nhất quán cuối
scene: s3-eventual-stale
activity: S3-02.A1
gate: optional
callout:
  kind: watch-out
  title: Điều Eventual Consistency cam kết và không cam kết
  vi: "Hệ thống chỉ hứa rằng nếu ngừng ghi thêm, sau một khoảng thời gian các bản sao sẽ hội tụ về cùng giá trị; nó không giới hạn bạn sẽ đọc phải dữ liệu cũ trong bao lâu trước khi hội tụ."
whatChanged:
  - "+ Theo dõi khoá stock cập nhật trên Replica 1 trong khi Replica 2 và 3 trễ nhịp"
  - "~ Chỉ ra các lượt đọc rơi vào cửa sổ chưa kịp đồng bộ (Stale Read)"
telemetry:
  - label: "Độ trễ ghi"
    value: "Rất thấp (1 bản sao)"
    tone: ok
  - label: "Cửa sổ bất nhất"
    value: "Vài ms đến vài giây"
    tone: warn
  - label: "Rủi ro"
    value: "Stale Read & Xung đột"
    tone: bad
```

Ở đầu kia của phổ là **Nhất quán cuối cùng (Eventual Consistency)**: tầng điều phối xác nhận thành công ngay khi ghi xong lên một bản sao gần nhất, rồi đẩy bản cập nhật sang các bản sao còn lại ở chế độ nền bất đồng bộ.

Lợi ích trực tiếp là tốc độ phản hồi cực nhanh và độ sẵn sàng cao: ngay cả khi hai phần ba số bản sao mất kết nối, nhánh còn lại vẫn tiếp nhận đọc và ghi. Đổi lại, ứng dụng phải đương đầu với hai hệ quả:
1. **Đọc dữ liệu cũ (Stale Read):** Khách hàng truy vấn trúng bản sao chưa kịp nhận gói đồng bộ sẽ thấy số lượng tồn kho hoặc hồ sơ từ vài trăm mili-giây trước.
2. **Xung đột ghi đồng thời:** Nếu hai khách cùng cập nhật một khoá trên hai bản sao khác nhau trước khi kịp đồng bộ, hệ thống phải hợp nhất bằng quy tắc nghiệp vụ, CRDT hoặc Vector Clock.

## 4. Các bảo đảm mức phiên: Read-Your-Writes và Monotonic Reads

```step
category: TECHNIQUE
short: Bảo đảm phiên
scene: s4-session-guarantees
callout:
  kind: technique
  title: Giữ trải nghiệm hợp lý mà không tốn chi phí Linearizability
  vi: "Đa số người dùng chấp nhận thấy bài viết của người lạ chậm vài giây, nhưng sẽ báo lỗi ngay nếu vừa bấm Lưu hồ sơ của chính mình mà trang tải lại vẫn hiện nội dung cũ."
whatChanged:
  - "+ Tách hai bảo đảm mức phiên phổ biến: Read-Your-Writes và Monotonic Reads"
  - "~ Cài đặt bằng ghim phiên bản (version/LSN) hoặc định tuyến theo người dùng"
telemetry:
  - label: "Read-Your-Writes"
    value: "Thấy thay đổi mình ghi"
    tone: ok
  - label: "Monotonic Reads"
    value: "Không lùi về bản cũ"
    tone: ok
```

Giữa hai thái cực Linearizability đắt đỏ và Eventual Consistency trần trụi, các hệ thống thực tế thường cung cấp hai **bảo đảm theo phiên làm việc (Session Guarantees)** với chi phí rất rẻ:

- **Read-Your-Writes (Đọc lại đúng gì mình vừa ghi):** Sau khi người dùng A cập nhật thông tin, ứng dụng lưu lại mốc phiên bản (hoặc thời điểm ghi) vào phiên/token của A. Trong 5–10 giây tiếp theo, lượt đọc của riêng A được hướng về bản sao đã có phiên bản `≥ mốc đó`, trong khi hàng triệu người xem khác vẫn đọc tự do từ các bản sao bất đồng bộ.
- **Monotonic Reads (Đọc đơn điệu không lùi):** Nếu người dùng B tải trang lần đầu trúng bản sao mới (thấy bình luận mới), nhưng lần tải lại sau đó Load Balancer lại đẩy B sang một bản sao đang trễ hơn làm bình luận biến mất, người dùng sẽ tưởng dữ liệu bị xoá. Cách khắc phục là băm cố định `session_id` vào một bản sao hoặc đính kèm phiên bản cao nhất mà phiên đó từng nhìn thấy.

## 5. Cơ chế Quorum (N, W, R): toán học của tập giao nhau

```step
category: MECHANISM
short: Công thức Quorum
scene: s5-quorum-overlap
callout:
  kind: key-idea
  title: Bất đẳng thức giao nhau W + R > N
  vi: "Với N bản sao, nếu mỗi lệnh ghi đợi xác nhận của W bản sao và mỗi lệnh đọc hỏi R bản sao sao cho W + R > N, tập đọc và tập ghi bắt buộc trùng nhau ít nhất 1 máy."
whatChanged:
  - "+ Dựng cụm 3 bản sao (N = 3) điều phối bởi Quorum Coordinator"
  - "~ Cấu hình W = 2, R = 2 (2 + 2 > 3) kết hợp gắn số phiên bản và Read Repair"
telemetry:
  - label: "Tổng bản sao (N)"
    value: "3 máy (3 AZ)"
    tone: default
  - label: "Quorum chuẩn"
    value: "W = 2 · R = 2"
    tone: ok
  - label: "Chịu lỗi tối đa"
    value: "1 bản sao ngừng"
    tone: ok
```

Các hệ cơ sở dữ liệu phi Leader kiểu Dynamo (Cassandra, ScyllaDB, Riak) cho phép điều chỉnh độ nhất quán trên từng truy vấn qua bộ ba **(N, W, R)**:
- **N:** Tổng số bản sao lưu trữ cùng một khoá (`N = 3` hoặc `5`).
- **W (Write Quorum):** Số bản sao tối thiểu phải xác nhận ghi trước khi báo thành công.
- **R (Read Quorum):** Số bản sao Coordinator hỏi song song khi đọc.

Khi thoả **W + R > N** (phổ biến là `N = 3, W = 2, R = 2`), theo nguyên lý chuồng bồ câu, tập `R` bản sao đọc và tập `W` bản sao giữ bản ghi mới nhất luôn giao nhau ít nhất 1 máy. Coordinator đối chiếu `version` trả về từ `R` máy, chọn giá trị mới nhất và gửi **Read Repair** cập nhật bù cho bản sao cũ.

| Cấu hình (N = 3) | W + R > N? | Đặc tính nổi bật | Ngữ cảnh phù hợp |
|---|---|---|---|
| `W = 2, R = 2` | Có (4 > 3) | Cân bằng đọc/ghi, chịu được 1 máy hỏng | Giao dịch nghiệp vụ chuẩn |
| `W = 3, R = 1` | Có (4 > 3) | Đọc nhanh, ghi chậm và ngừng ghi nếu 1 máy chết | Đọc rất nhiều, hiếm khi ghi |
| `W = 1, R = 3` | Có (4 > 3) | Ghi nhanh, đọc phải hỏi đủ cả 3 máy | Nhật ký ghi liên tục, ít đọc |
| `W = 1, R = 1` | Không (2 ≤ 3) | Nhanh nhất, nhưng có Stale Read | Lượt xem, cảm biến IoT |

## 6. Quan sát chi phí của Quorum chặt (W = 2, R = 2) khi tải tăng

```step
category: PROBLEM
short: Trần tải Quorum
scene: s6-quorum-live
live: quorum-strict
activity: S3-02.A2
gate: required
callout:
  kind: watch-out
  title: Hai cái giá vật lý của W = 2, R = 2
  vi: "Mỗi thao tác làm việc trên 2/3 số máy (nhân đôi tải lên từng bản sao so với W = R = 1) và độ trễ phải chờ bản sao thứ hai phản hồi xong."
whatChanged:
  - "~ Tăng tải từ 400 lên 3.200 req/s trên cụm N = 3 cấu hình W = 2, R = 2"
  - "~ Replica 3 ở AZ xa (baseMs = 8 ms, μ = 1.600) chạm bão hoà quanh 2.300 req/s"
telemetry:
  - label: "p99 ở tải vừa (t = 20 s)"
    value: "{global.p99@20:0} ms"
    tone: ok
  - label: "p99 ở tải cao (t = 45 s)"
    value: "{global.p99@45:0} ms"
    tone: bad
  - label: "Trần bền vững"
    value: "≈ 2.300 req/s"
    tone: warn
```

Mô phỏng `S3-02/quorum-strict` đặt cụm 3 bản sao dưới lưu lượng tăng tuyến tính từ 400 lên 3.200 req/s trong 50 giây. Ở cấu hình cân bằng `W = 2, R = 2`, trung bình mỗi bản sao phải gánh **2/3 (khoảng 67%)** tổng lưu lượng đọc và ghi của toàn cụm.

Theo dõi số đo trên sân khấu:
- **Ở giây 20 (khoảng 1.520 req/s):** Mỗi bản sao nhận khoảng 1.020 req/s, hệ thống giữ nhất quán chặt với `p99 ≈ 67 ms`.
- **Quanh ngưỡng 2.300 req/s:** `Replica 3` đặt tại AZ-C (năng lực 1.600 req/s, mạng chéo vùng 6 ms) nhận `0,67 × 2.300 ≈ 1.540 req/s`, tiến sát trần phục vụ và đẩy hàng đợi tăng vọt.
- **Ở giây 45 (2.920 req/s):** Tầng lưu trữ quá tải, `p99` vượt **600 ms** và các truy vấn bắt đầu quá hạn.

Như vậy, việc bắt buộc giao nhau đa số làm trần thông lượng tối đa của cụm 3 máy giảm đi một nửa so với khi mỗi yêu cầu chỉ chạm một máy.

## 7. Đối chiếu cấu hình W = 1, R = 1: nhân đôi thông lượng đổi lấy trễ hội tụ

```step
category: MECHANISM
short: Tốc độ W=R=1
scene: s7-one-live
live: eventual-one
callout:
  kind: compare
  title: Cùng phần cứng, hai đường cong tải khác hẳn
  vi: "Hạ xuống W = 1, R = 1 giúp mỗi bản sao chỉ nhận 1/3 lưu lượng khách hàng và không phải chờ chéo AZ, giữ p99 quanh 60 ms ngay cả ở 2.920 req/s."
whatChanged:
  - "~ Chuyển Coordinator sang hỏi 1 bản sao cho mỗi lượt đọc/ghi (W = 1, R = 1)"
  - "~ Ở cùng tải 2.920 req/s (t = 45 s), p99 hạ từ 637 ms xuống còn khoảng 60 ms"
telemetry:
  - label: "p99 tại t = 20 s"
    value: "{global.p99@20:0} ms"
    tone: ok
  - label: "p99 tại t = 45 s"
    value: "{global.p99@45:0} ms"
    tone: ok
  - label: "Lỗi tại t = 45 s"
    value: "{global.errorRate@45:0%}"
    tone: ok
```

Giữ nguyên toàn bộ phần cứng của bước trước nhưng đổi cấu hình truy vấn sang **W = 1, R = 1** (`S3-02/eventual-one`), mỗi yêu cầu khách hàng chỉ cần một bản sao xử lý trực tiếp (việc đồng bộ hai bản còn lại diễn ra bất đồng bộ phía sau).

Ở giây 45 (2.920 req/s), mỗi bản sao chỉ nhận khoảng 973 req/s (`ρ ≈ 0,61` trên Replica 3), nên `p99` giữ phẳng ở **60 ms** và tỷ lệ lỗi bằng **0%**.

Điểm mạnh nhất của kiến trúc Quorum tuỳ chỉnh là bạn **không cần chọn cứng một mức cho cả cơ sở dữ liệu**: trên cùng một cụm lưu trữ, bảng đơn hàng gọi với `QUORUM` (`W = 2, R = 2`), còn bảng lịch sử xem sản phẩm gọi với `ONE` (`W = 1, R = 1`).

## 8. Cạm bẫy tinh tế: vì sao W + R > N vẫn chưa tương đương Linearizability hoàn hảo?

```step
category: PITFALL
short: Giới hạn Quorum
scene: s8-sloppy-lww
callout:
  kind: watch-out
  title: Đừng đánh đồng Quorum kiểu Dynamo với Consensus Raft
  vi: "W + R > N vẫn có thể lọt Stale Read hoặc mất cập nhật nếu bật Sloppy Quorum, phân giải xung đột bằng đồng hồ vật lý lệch (LWW), hoặc đọc gối đầu khi lệnh ghi đang dở dang."
whatChanged:
  - "+ Liệt kê 3 tình huống khiến Quorum chuẩn W + R > N vi phạm tuyến tính hoá"
  - "~ Phân biệt rõ Quorum phi Leader với thuật toán đồng thuận Raft/Paxos"
telemetry:
  - label: "Sloppy Quorum"
    value: "Ưu tiên A · Mất giao nhau"
    tone: warn
  - label: "Ghi đồng thời + LWW"
    value: "Nguy cơ mất bản ghi"
    tone: bad
```

Trong phỏng vấn thiết kế hệ thống, nhiều kỹ sư khẳng định `W + R > N` luôn mang lại Linearizability tuyệt đối. Thực tế có ba ngoại lệ quan trọng cần lưu ý:

1. **Sloppy Quorum & Hinted Handoff:** Khi sự cố mạng làm không đủ `W` máy chủ chuẩn của khoá đó, một số hệ thống cho phép ghi tạm sang máy chủ lân cận khác rồi trả thành công để giữ độ khả dụng. Lúc này tập ghi tạm và tập đọc chuẩn không còn giao nhau cho tới khi Hinted Handoff chép trả xong.
2. **Hai lệnh ghi đồng thời dùng Last-Write-Wins (LWW):** Không có Leader tuần tự hoá nên hai khách có thể ghi đồng thời lên hai tập `W` khác nhau; nếu chọn bản thắng theo đồng hồ hệ thống bị lệch vài chục mili-giây, bản ghi mới hơn về nhân quả sẽ bị xoá mất.
3. **Đọc gối đầu lúc lệnh ghi mới xong trên 1 máy:** Khi lệnh ghi `W = 2` mới tới được `R1` (chưa tới `R2`), khách A đọc `{R1, R2}` thấy giá trị mới, nhưng ngay mili-giây kế tiếp khách B đọc `{R2, R3}` lại thấy giá trị cũ (vi phạm tuyến tính hoá nếu chưa hoàn tất Read Repair đồng bộ).

Khi nghiệp vụ cần giao dịch Compare-And-Swap hoặc tuần tự hoá nghiêm ngặt, hãy dùng thuật toán đồng thuận (Raft / Paxos) ở bài kế tiếp.

## 9. Tóm tắt: chọn mô hình nhất quán bắt đầu từ bài toán kinh doanh

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Bốn câu hỏi chọn mức nhất quán
  vi: "Dữ liệu trễ vài giây có gây hại cho người dùng không? Doanh nghiệp có thiệt hại tài chính/pháp lý không? Sai lệch có tự sửa bù sau được không? Người dùng có vừa tự sửa chính mục đó không?"
whatChanged:
  - "+ Đúc kết quy tắc kết hợp Linearizable, Quorum, RYW và Eventual trong một hệ thống"
telemetry:
  - label: "Tiền, kho, khoá"
    value: "Linearizable / Consensus"
    tone: warn
  - label: "Hồ sơ của chính mình"
    value: "Read-Your-Writes"
    tone: ok
  - label: "Bảng tin, lượt thích"
    value: "Eventual (W=1, R=1)"
    tone: ok
```

Quy tắc thiết kế nhất quán dữ liệu cho hệ thống quy mô lớn:

1. **Tính nhất quán là quyết định nghiệp vụ trước khi là quyết định kỹ thuật:** Dùng nhất quán mạnh / đồng thuận cho thanh toán, đặt chỗ cuối cùng và phân quyền bảo mật; dùng nhất quán cuối cùng cho bảng tin, bộ đếm, gợi ý và phân tích.
2. **Bảo vệ trải nghiệm cá nhân bằng chi phí thấp:** Bật **Read-Your-Writes** và **Monotonic Reads** để người dùng luôn thấy ngay thao tác của chính mình mà không bắt toàn bộ lượt đọc công khai phải chịu độ trễ đồng bộ.
3. **Nắm vững toán học Quorum `(N, W, R)`:** Điều kiện `W + R > N` bảo đảm tập đọc giao với tập ghi mới nhất, nhưng làm tăng hệ số khuếch đại tải lên từng bản sao (`W/N` và `R/N`) và kéo độ trễ theo bản sao thứ `W` hoặc `R`.

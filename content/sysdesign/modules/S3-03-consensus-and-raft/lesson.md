## 1. Bài toán đồng thuận phân tán: thống nhất trước khi hành động

```step
category: SETUP
short: Bài toán đồng ý
scene: s1-cluster-setup
callout:
  kind: key-idea
  title: Nguyên lý cốt lõi của Consensus
  vi: "Thay vì để mỗi máy tự quyết định rồi cố gắng vá xung đột về sau, thuật toán đồng thuận buộc các máy thống nhất một thứ tự nhật ký duy nhất trước khi áp dụng thay đổi."
whatChanged:
  - "+ Dựng cụm 3 nút điều phối Raft trải trên 3 vùng khả dụng (AZ-A, AZ-B, AZ-C)"
  - "+ Leader gửi nhịp tim (Heartbeat) định kỳ để duy trì quyền điều phối"
telemetry:
  - label: "Cấu hình cụm"
    value: "3 node · Đa số = 2"
    tone: ok
  - label: "Nhiệm kỳ hiện tại"
    value: "Term 1 · Node 1 Leader"
    tone: ok
```

Ở bài Sao chép dữ liệu (`S2-08`), mô hình một Leader giúp tuần tự hoá mọi giao dịch ghi nhưng bỏ ngỏ câu hỏi khó nhất: khi Leader hiện tại mất liên lạc, **ai có quyền chỉ định Leader kế nhiệm** sao cho cả cụm đồng lòng mà không cần con người can thiệp?

**Đồng thuận phân tán (Consensus)** giải quyết bài toán giúp nhiều nút mạng không tin cậy cùng đi tới một quyết định duy nhất thoả bốn tính chất: **Đồng nhất** (không bao giờ có hai nút quyết định trái nhau), **Hợp lệ** (giá trị được chốt phải do một nút đề xuất), **Chấm dứt** (các nút sống cuối cùng đều chốt được kết quả) và **Chịu lỗi** (vẫn vận hành khi một phần nhỏ số nút ngừng chạy).

Ra đời năm 2014 (Diego Ongaro & John Ousterhout), **Raft** được thiết kế để dễ kiểm chứng hơn Paxos bằng cách tách bài toán thành hai phần rõ rệt: **Bầu chọn Leader** và **Sao chép nhật ký (Log Replication)**.

## 2. Sự cố hai đầu não (Split-Brain) khi tự ý thăng cấp không qua đa số

```step
category: PROBLEM
short: Split-Brain
scene: s2-split-brain
callout:
  kind: watch-out
  title: Hậu quả nặng nề nhất của Failover ngây thơ
  vi: "Nếu mỗi nhánh mạng bị cô lập đều tự nâng bản sao của mình lên làm Leader, hệ thống xuất hiện hai nguồn ghi độc lập làm lịch sử giao dịch rẽ nhánh không thể tự ghép lại."
whatChanged:
  - "+ Minh hoạ cây lịch sử bị phân nhánh khi cả hai phía đứt mạng đều nhận lệnh ghi"
  - "~ Cùng một khoá phân tán hoặc một đơn hàng bị cấp phát cho hai khách khác nhau"
telemetry:
  - label: "Số Leader tự phong"
    value: "2 (Split-Brain!)"
    tone: bad
  - label: "Dữ liệu trên đĩa"
    value: "Phân nhánh mâu thuẫn"
    tone: bad
```

Giả sử cụm cơ sở dữ liệu dùng kịch bản giám sát đơn giản: hễ không ping được Primary trong 3 giây thì nâng Standby lên thay thế. Khi đường truyền giữa hai phòng máy bị đứt trong khi cả hai máy vẫn sống, Standby tự phong làm Leader mới, còn Primary cũ không hề biết mình bị thay thế nên tiếp tục nhận lệnh ghi từ các ứng dụng cùng phòng máy.

Hiện tượng **nhiều hơn một nút cùng hành xử như Leader** gọi là **Split-Brain**. Một khi hai nhánh đã chấp nhận các giao dịch trái ngược (ví dụ cấp cùng một khoá độc quyền cho hai tiến trình hoặc trừ cùng một số dư hai lần), việc nối mạng trở lại không thể tự động hợp nhất mà không làm mất dữ liệu đã báo thành công.

## 3. Toán học của đa số quá bán (Majority Quorum) và quy tắc số máy lẻ

```step
category: MECHANISM
short: Đa số quá bán
scene: s3-majority-math
callout:
  kind: key-idea
  title: Hai tập đa số không bao giờ rời nhau
  vi: "Trong tập N nút, đa số quá bán là floor(N/2) + 1. Vì tổng hai tập đa số luôn lớn hơn N, bất kỳ hai quyết định đa số nào cũng có ít nhất một nút chung làm nhân chứng."
whatChanged:
  - "+ Ánh xạ quy tắc giao nhau của đa số quá bán cho bầu cử và ghi nhật ký"
  - "~ Giải thích vì sao cụm 4 máy không chịu lỗi tốt hơn cụm 3 máy"
telemetry:
  - label: "Cụm 3 node"
    value: "Đa số 2 · Chịu lỗi 1"
    tone: ok
  - label: "Cụm 5 node"
    value: "Đa số 3 · Chịu lỗi 2"
    tone: ok
  - label: "Cụm 4 node (Chẵn)"
    value: "Đa số 3 · Chỉ chịu lỗi 1"
    tone: warn
```

Raft chặn đứng Split-Brain ngay từ gốc bằng quy tắc: **mọi cuộc bầu chọn Leader và mọi lần chốt nhật ký đều cần ít nhất `floor(N / 2) + 1` phiếu đồng thuận** trên tổng số `N` nút cấu hình sẵn.

Khi mạng chia cụm 5 nút thành nhánh 3 nút và nhánh 2 nút: nhánh 3 nút hội đủ `3/5` phiếu nên bầu được Leader và tiếp tục phục vụ; nhánh 2 nút không bao giờ gom đủ 3 phiếu nên tự động ngưng nhận ghi.

Bảng dưới đây cho thấy vì sao các cụm Raft luôn triển khai **số nút lẻ** (3 hoặc 5):

| Tổng số nút (N) | Số phiếu đa số cần đạt | Số nút hỏng tối đa chịu được | Đánh giá vận hành |
|---|---|---|---|
| 3 | 2 | 1 | Chuẩn phổ biến cho 3 AZ trong một vùng |
| 4 | 3 | 1 | Tốn thêm 1 máy và mạng nhưng vẫn chỉ chịu được 1 máy hỏng |
| 5 | 3 | 2 | Chuẩn độ sẵn sàng cao (bảo trì 1 máy vẫn chịu thêm 1 sự cố) |
| 6 | 4 | 2 | Tốn hơn cụm 5 nút mà khả năng chịu lỗi y hệt |

## 4. Ba trạng thái nút và Nhiệm kỳ logic (Term) trong Raft

```step
category: MECHANISM
short: Ba trạng thái
scene: s4-raft-states
callout:
  kind: good-to-know
  title: Term là đồng hồ logic phát hiện thông tin cũ
  vi: "Thời gian trong Raft được chia thành các nhiệm kỳ đánh số nguyên tăng dần (Term 1, 2, 3...). Mỗi nhiệm kỳ có tối đa một Leader duy nhất."
whatChanged:
  - "+ Biểu diễn đồ thị chuyển trạng thái giữa Follower, Candidate và Leader"
  - "~ Quy tắc vàng: hễ nhận gói tin mang Term lớn hơn, nút lập tức lùi về Follower"
telemetry:
  - label: "Ba vai trò"
    value: "Follower · Candidate · Leader"
    tone: default
  - label: "Số phiếu mỗi Term"
    value: "Tối đa 1 phiếu / node"
    tone: ok
```

Tại mọi thời điểm, mỗi nút Raft nằm ở đúng một trong ba trạng thái:
- **Follower (Nút theo sau):** Trạng thái thụ động mặc định; chỉ phản hồi RPC từ Leader hoặc Candidate và đặt lại đồng hồ chờ mỗi khi nhận nhịp tim.
- **Candidate (Ứng viên):** Trạng thái trung gian khi Follower hết thời gian chờ nhịp tim; tự tăng số **Term** lên 1, tự bỏ phiếu cho mình và đi xin phiếu cả cụm.
- **Leader (Nút dẫn đầu):** Tiếp nhận mọi lệnh ghi từ khách hàng, nhân bản mục nhật ký xuống các Follower và phát nhịp tim định kỳ (thường mỗi 50 ms).

Mọi gói tin RPC trong Raft đều đính kèm số `term` hiện tại của người gửi. Nếu một Leader hoặc Candidate nhìn thấy gói tin có `term` lớn hơn `term` của mình, nó biết ngay nhiệm kỳ của mình đã khép lại và **lập tức hạ quyền về Follower**.

## 5. Bầu chọn Leader và Election Timeout ngẫu nhiên chống chia phiếu

```step
category: MECHANISM
short: Bầu chọn Leader
scene: s5-election-flow
activity: S3-03.A1
gate: optional
callout:
  kind: technique
  title: Ngẫu nhiên hoá thời gian chờ (150 – 300 ms)
  vi: "Nếu mọi Follower cùng hết hạn ở đúng 200 ms, tất cả sẽ đồng loạt ứng cử và tự bầu cho mình gây chia phiếu (Split Vote). Đặt ngưỡng chờ ngẫu nhiên giúp một nút dậy sớm thắng gọn ngay vòng đầu."
whatChanged:
  - "+ Chuỗi 5 bước từ lúc mất Heartbeat tới lúc Leader nhiệm kỳ mới phát nhịp tim"
  - "+ Điều kiện an toàn: chỉ cấp phiếu cho ứng viên có nhật ký mới bằng hoặc hơn mình"
telemetry:
  - label: "Heartbeat chu kỳ"
    value: "≈ 50 ms"
    tone: ok
  - label: "Election Timeout"
    value: "Ngẫu nhiên 150–300 ms"
    tone: ok
```

Khi Leader hiện tại ngừng hoạt động, quy trình bầu chọn diễn ra tự động qua năm bước:

1. Follower có **Election Timeout ngẫu nhiên** ngắn nhất (ví dụ 165 ms trên dải 150–300 ms) hết hạn chờ nhịp tim trước tiên.
2. Nút này chuyển sang **Candidate**, tăng `currentTerm` thêm 1, ghi nhận `votedFor = chính mình` lên đĩa bền vững rồi gửi `RequestVote(term, lastLogIndex, lastLogTerm)` tới các nút còn lại.
3. Mỗi nút nhận yêu cầu sẽ **cấp phiếu** nếu và chỉ nếu: `term` không nhỏ hơn `term` của nó, trong `term` này nó chưa bầu cho ai, **và nhật ký của ứng viên cập nhật ít nhất ngang bằng nhật ký của nó** (so `lastLogTerm` trước, rồi tới `lastLogIndex`).
4. Ngay khi gom đủ `floor(N/2) + 1` phiếu (tính cả phiếu tự bầu), Candidate trở thành **Leader** và phát tức thì gói `AppendEntries` rỗng (Heartbeat) để khẳng định quyền điều phối và ngăn các nút khác mở cuộc bầu cử thừa.
5. Nếu hiếm hoi xảy ra chia phiếu không ai đủ đa số, bộ đếm ngẫu nhiên mới lại kích hoạt nhiệm kỳ kế tiếp sau vài trăm mili-giây.

## 6. Sao chép và cam kết nhật ký (Majority Log Commit)

```step
category: MECHANISM
short: Commit nhật ký
scene: s6-log-commit
callout:
  kind: key-idea
  title: Ghi vào đĩa của Leader chưa phải là đã Commit
  vi: "Một mục nhật ký chỉ trở thành Committed (bền vững qua mọi lần đổi Leader) sau khi đã được sao chép lên đĩa của đa số nút trong cụm."
whatChanged:
  - "+ Băng nhật ký tuần tự gồm chỉ số Index, nhiệm kỳ Term và lệnh thay đổi"
  - "~ Tách rõ hai bước: Append lên đa số đĩa rồi mới nâng con trỏ commitIndex"
telemetry:
  - label: "Bước 1 (Replicate)"
    value: "Ghi WAL trên ≥ 2/3 node"
    tone: warn
  - label: "Bước 2 (Commit)"
    value: "Áp vào State Machine"
    tone: ok
```

Một lệnh ghi của khách hàng đi qua cụm Raft theo quy trình hai pha chặt chẽ trên nhật ký tuần tự:

- **Pha nhân bản:** Leader nối lệnh mới vào cuối nhật ký cục bộ của mình với cặp `(index, term)` (chưa áp dụng vào dữ liệu chính), sau đó gửi song song RPC `AppendEntries` tới mọi Follower.
- **Pha cam kết:** Mỗi Follower kiểm tra mục ngay liền trước khớp `(prevLogIndex, prevLogTerm)`, ghi bền vững vào đĩa rồi trả lời ACK. Ngay khi Leader đếm đủ đa số (`≥ 2` trên 3 nút, gồm cả chính Leader), mục đó được đánh dấu **Committed** (`commitIndex` tăng lên), Leader áp lệnh vào máy trạng thái và trả kết quả thành công cho khách.

Nhờ điều kiện bỏ phiếu ở Bước 5 luôn yêu cầu ứng viên có nhật ký cập nhật và quy tắc đa số ở Bước 6 luôn giao nhau, **mọi Leader đắc cử ở các nhiệm kỳ sau chắc chắn chứa đầy đủ tất cả các mục đã Committed trước đó**. Các mục lẻ loi chưa kịp đủ đa số của Leader cũ sẽ bị cắt bỏ và ghi đè theo nhật ký chuẩn của Leader mới.

## 7. Quan sát sự cố cô lập Leader cũ ở nhánh thiểu số (1/3)

```step
category: PROBLEM
short: Cô lập 1/3
scene: s7-minority-live
live: minority-isolated
activity: S3-03.A2
gate: optional
callout:
  kind: watch-out
  title: Hành vi CP rõ rệt của cụm đồng thuận
  vi: "Khi Node 1 bị tách rời khỏi Node 2 và Node 3 ở giây 20, mọi lệnh ghi gửi vào Node 1 đều không gom đủ 2/3 xác nhận nên bị từ chối 100%, trong khi nhánh đa số [Node 2, Node 3] bầu Leader mới ở Term 2."
whatChanged:
  - "~ Cắt đồng thời đường nối từ Node 1 sang Node 2 và Node 3 từ giây 20 đến 40"
  - "~ Nhánh thiểu số từ chối toàn bộ lệnh ghi, bảo vệ tuyệt đối lịch sử chung"
telemetry:
  - label: "Lỗi trước sự cố (t = 10 s)"
    value: "{global.errorRate@10:0%}"
    tone: ok
  - label: "Lỗi tại nhánh cô lập (t = 25 s)"
    value: "{global.errorRate@25:0%}"
    tone: bad
  - label: "p99 trước sự cố (t = 10 s)"
    value: "{global.p99@10:0} ms"
    tone: ok
```

Trên sân khấu trực tiếp `S3-03/minority-isolated`, khách hàng đang gửi lưu lượng vào `Node 1` (Leader nhiệm kỳ 1). Ở trạng thái bình thường (`t = 0..19 s`), mỗi lệnh nhân bản chéo vùng chỉ tốn vài mili-giây (`p99 ≈ 18 ms`, lỗi `0%`).

Tại **giây 20**, sự cố mạng cô lập hoàn toàn `Node 1` tại AZ-A khỏi `Node 2` và `Node 3`. Hai việc xảy ra song song:
- **Tại nhánh đa số `{Node 2, Node 3}` (2/3 phiếu):** Hết thời gian chờ nhịp tim, `Node 2` tăng lên `Term 2`, nhận phiếu của `Node 3` và đắc cử Leader mới để phục vụ cụm.
- **Tại nhánh thiểu số `{Node 1}` (1/3 phiếu):** Mọi yêu cầu gửi trực tiếp vào `Node 1` đều chờ xác nhận đa số thất bại và trả lỗi **100%** sau ngưỡng quá hạn 250 ms (`goodput = 0`).

Tới giây 40 khi mạng nối lại, `Node 1` nhìn thấy `Term 2` cao hơn từ `Node 2` nên lập tức hạ xuống làm Follower và đồng bộ lại nhật ký.

## 8. Bẫy Zombie Leader (tạm dừng GC) và lá chắn Fencing Token

```step
category: PITFALL
short: Fencing Token
scene: s8-fencing-token
activity: S3-03.A3
gate: required
callout:
  kind: watch-out
  title: Hai lỗ hổng ngoài phạm vi nội bộ của cụm Raft
  vi: "Một tiến trình giữ quyền Leader có thể bị đóng băng do thu gom rác (GC pause) vài giây rồi tỉnh dậy ghi thẳng vào kho lưu trữ ngoài, hoặc trả lời lệnh đọc cục bộ từ bộ nhớ cũ."
whatChanged:
  - "+ Cấp Fencing Token đơn điệu theo Term cho mỗi lần đắc cử Leader"
  - "+ Bắt buộc kiểm chứng ReadIndex / nhịp tim đa số trước khi trả kết quả đọc"
telemetry:
  - label: "Token Leader cũ"
    value: "token = 1 (Từ chối!)"
    tone: bad
  - label: "Token Leader mới"
    value: "token = 2 (Hợp lệ)"
    tone: ok
```

Raft đảm bảo an toàn bên trong nhật ký của chính nó, nhưng khi ứng dụng dùng Raft/khoá phân tán để điều khiển **kho lưu trữ bên ngoài** hoặc phục vụ **truy vấn đọc trực tiếp từ bộ nhớ Leader**, có hai cạm bẫy tinh vi:

1. **Ghi trễ từ Zombie Leader:** Tiến trình giữ quyền Leader ở `Term 1` chuẩn bị gửi lệnh ghi xuống Storage thì bị tạm dừng thu gom rác (`Stop-the-World GC`) suốt 5 giây. Trong lúc đó cụm đã bầu Leader mới ở `Term 2` và ghi dữ liệu mới vào Storage. Khi tiến trình cũ tỉnh dậy, gói tin trễ của nó bay tới ghi đè hỏng dữ liệu mới. **Cách chặn:** Mỗi nhiệm kỳ cấp một **Fencing Token** tăng đơn điệu (`token = 1, 2, 3...`); Storage lưu `max_token` đã thấy và từ chối mọi thao tác có `token < max_token`.
2. **Đọc cũ từ Leader bị cô lập:** Nếu khách hàng đọc thẳng RAM của `Node 1` ngay lúc `Node 1` vừa bị đứt mạng mà chưa biết đã có Leader `Term 2`, khách sẽ nhận giá trị cũ (vi phạm Linearizability). **Cách chặn:** Dùng **ReadIndex** — trước khi trả kết quả đọc, Leader xác nhận nhanh một vòng nhịp tim với đa số nút để chắc chắn mình vẫn còn nắm quyền hợp lệ.

## 9. Chi phí thực tế và cách dùng Consensus trong hệ thống sản xuất

```step
category: TECHNIQUE
short: Chi phí thực tế
scene: s9-real-systems
callout:
  kind: good-to-know
  title: Không tự viết lại Raft từ đầu cho ứng dụng nghiệp vụ
  vi: "Trong sản xuất, ta dựa vào các nền tảng đồng thuận đã kiểm chứng nghiêm ngặt như etcd, ZooKeeper, Consul hoặc cơ sở dữ liệu phân tán Multi-Raft như CockroachDB, TiKV."
whatChanged:
  - "+ Đối chiếu chi phí của Consensus với các dịch vụ hạ tầng phổ biến"
  - "~ Chỉ đặt siêu dữ liệu điều phối, cấu hình và khoá vào cụm đồng thuận"
telemetry:
  - label: "Chi phí mỗi lệnh ghi"
    value: "1 RTT đa số + fsync đĩa"
    tone: warn
  - label: "Gián đoạn khi bầu lại"
    value: "≈ 200 ms – 2 giây"
    tone: warn
```

Đồng thuận mang lại nhất quán tuyến tính hoá và tự động chuyển đổi dự phòng không mất dữ liệu (`RPO = 0`), nhưng đi kèm ba chi phí kỹ thuật rõ ràng:
- **Giới hạn thông lượng ở một Leader:** Mọi lệnh ghi của một nhóm Raft đều đi qua Leader của nhóm đó và phải `fsync` nhật ký đĩa cộng một vòng mạng chéo AZ.
- **Khoảng lặng ngắn lúc bầu cử:** Khi Leader gặp sự cố, cụm tạm ngưng nhận ghi trong khoảng 200 ms đến vài giây cho tới khi nhiệm kỳ mới hoàn tất.
- **Độ trễ nhạy cảm với khoảng cách địa lý:** Nếu rải 3 nút qua 3 châu lục, mỗi lần ghi đều tốn hơn 100 ms RTT.

Vì vậy, kiến trúc chuẩn dùng cụm Raft nhỏ gọn (**etcd** trong Kubernetes, **ZooKeeper** / **KRaft** trong Kafka, **Consul**) để giữ cấu hình, danh sách thành viên, phân vùng và bầu chọn Leader; còn các cơ sở dữ liệu SQL phân tán quy mô lớn (**CockroachDB**, **YugabyteDB**, **Spanner**) chia dữ liệu thành hàng nghìn phân mảnh nhỏ, mỗi phân mảnh là một nhóm **Multi-Raft** độc lập để mở rộng thông lượng ghi theo chiều ngang.

## 10. Tóm tắt: bốn cơ chế bảo vệ sự đồng thuận của Raft

```step
category: RECAP
short: Tóm tắt
scene: s10-recap
callout:
  kind: key-idea
  title: Bốn chốt chặn cốt lõi cần nhớ
  vi: "Đa số quá bán chống hai nhánh tự quyết, Term tăng đơn điệu truất quyền cũ, Commit theo đa số giữ trọn lịch sử, và Fencing Token chặn gói tin trễ ở kho ngoài."
whatChanged:
  - "+ Tổng hợp bốn quy tắc bảo toàn tính đúng đắn trong thuật toán Raft"
telemetry:
  - label: "Số nút khuyến nghị"
    value: "3 hoặc 5 (Số lẻ)"
    tone: ok
  - label: "Phân loại CAP"
    value: "CP · Không Split-Brain"
    tone: ok
```

Bốn nguyên tắc thiết kế cốt lõi rút ra từ bài học:

1. **Đa số quá bán (`floor(N/2) + 1`) trên số máy lẻ:** Cụm 3 máy chịu được 1 lỗi, cụm 5 máy chịu được 2 lỗi; hai tập đa số bất kỳ luôn giao nhau nên không thể xuất hiện hai Leader trong cùng một nhiệm kỳ.
2. **Nhiệm kỳ `Term` và Timeout ngẫu nhiên:** `Term` đóng vai trò đồng hồ logic buộc nút cũ tự hạ quyền, còn Election Timeout ngẫu nhiên giúp cuộc bầu cử hội tụ nhanh không bị chia phiếu.
3. **Commit nhật ký theo đa số và lọc ứng viên theo độ mới của Log:** Đảm bảo không bao giờ mất giao dịch đã báo thành công cho khách hàng.
4. **Fencing Token và ReadIndex ở rìa hệ thống:** Bảo vệ kho lưu trữ bên ngoài khỏi tiến trình Leader bị treo tạm thời và ngăn đọc phải dữ liệu cũ từ Leader vừa bị cô lập.

## 1. Bài toán co giãn cụm có trạng thái: giữ ấm dữ liệu khi thêm bớt máy

```step
category: SETUP
short: Bão Cache Miss
scene: s1-cluster
callout:
  kind: key-idea
  title: Khác biệt giữa tầng không trạng thái và tầng giữ dữ liệu
  vi: "Thêm một máy App mới chỉ cần nhận ngay request tiếp theo, nhưng thêm một máy Cache mới mà làm xáo trộn ánh xạ khoá sẽ khiến cả cụm mất dữ liệu ấm cùng lúc."
whatChanged:
  - "+ Cụm 4 máy Cache đứng trước Origin Database (2.000 ops/s) phục vụ 5.000 req/s"
  - "~ Khi ấm ổn định (Hit Ratio 92%), chỉ 630 ops/s đi xuống Origin Database"
telemetry:
  - label: "Lưu lượng đầu vào"
    value: "5.000 req/s"
  - label: "Cache Hit khi ấm"
    value: "92%"
    tone: ok
  - label: "Tải xuống DB nền"
    value: "630 ops/s (ρ = 0,32)"
    tone: ok
```

Ở hệ thống đọc nhiều (5.000 req/s, 95% đọc), cụm bộ nhớ đệm phân tán đóng vai trò tấm chắn cho `Origin Database` (chỉ chịu được tối đa 2.000 ops/s). Khi cụm Cache ấm với Hit Ratio 92%, chỉ có $4.750 \times 0{,}08 = 380$ lượt đọc Miss cộng 250 lượt ghi — tức **630 ops/s** — chạm xuống Database (`ρ = 0,32`).

Giả sử giờ cao điểm dung lượng RAM chật, đội vận hành bật thêm máy `Cache 4` nâng cụm từ 3 lên 4 nút (hoặc một nút bất ngờ hỏng làm cụm tụt từ 4 xuống 3). Thuật toán định tuyến khoá tại `App Hash Client` lúc này quyết định hệ thống mở rộng êm ái hay làm quá tải `Origin Database`.

## 2. Vì sao `hash(key) mod N` gây bão Cache Miss khi đổi số máy

```step
category: PROBLEM
short: Lỗi của mod N
scene: s2-mod-remap
callout:
  kind: watch-out
  title: Dữ liệu vẫn nằm trong RAM cũ nhưng App lại đi hỏi máy khác
  vi: "Khoá chưa hề hết hạn TTL, nhưng phép chia dư mới trỏ sang máy chưa từng lưu khoá đó nên biến thành Cache Miss hàng loạt."
whatChanged:
  - "~ Đổi công thức từ hash(key) mod 3 sang hash(key) mod 4"
  - "~ Tỷ lệ khoá bị trỏ sang máy khác lên tới 3 / 4 = 75% toàn cụm"
telemetry:
  - label: "Khoá giữ đúng máy"
    value: "1 / 4 = 25%"
    tone: warn
  - label: "Khoá đổi máy (Miss)"
    value: "3 / 4 = 75%"
    tone: bad
```

Xét công thức đơn giản `node = hash(key) mod N`. Khi nâng từ $N = 3$ lên $N + 1 = 4$ máy chủ:

- Chỉ những khoá có `hash(key)` nằm trong các ô trùng số dư mới ở lại máy cũ — trung bình đúng $\frac{1}{N + 1} = \frac{1}{4} = 25\%$.
- Toàn bộ $\frac{N}{N + 1} = \frac{3}{4} = 75\%$ số khoá còn lại bị `App` tính ra chỉ số máy mới. Bản giá trị cũ vẫn nằm nguyên trong RAM máy trước đó nhưng không ai hỏi tới, còn máy mới được hỏi thì trả về **Cache Miss** và buộc phải truy vấn xuống `Origin Database`.

Nếu cụm lớn có $N = 9$ máy và thêm máy thứ 10, tới **90%** bộ nhớ đệm toàn cụm bị vô hiệu hoá trong cùng một tích tắc!

## 3. Vòng băm nhất quán (Consistent Hashing): uốn không gian băm 2^32 thành vòng tròn

```step
category: MECHANISM
short: Vòng băm 2^32
scene: s3-ring-clock
callout:
  kind: key-idea
  title: Bỏ phép chia cho N bằng cách băm cả máy chủ lẫn khoá lên cùng một trục
  vi: "Vị trí của một khoá trên vòng chỉ phụ thuộc vào chính tên khoá, hoàn toàn không phụ thuộc vào tổng số máy N hiện có."
whatChanged:
  - "+ Uốn dải số nguyên 32-bit [0 .. 2^32 − 1] nối đầu cuối thành một vòng khép kín"
  - "+ Mỗi khoá đi theo chiều kim đồng hồ và thuộc về nút gặp đầu tiên"
telemetry:
  - label: "Không gian băm"
    value: "0 .. 2^32 − 1"
  - label: "Độ phức tạp tra cứu"
    value: "O(log M) nhị phân"
    tone: ok
```

**Consistent Hashing** loại bỏ biến $N$ khỏi công thức băm bằng hai bước:

1. **Dựng vòng băm (Hash Ring):** coi dải đầu ra của hàm băm 32-bit (từ $0$ đến $2^{32} - 1$) là một vòng tròn khép kín mà điểm $2^{32}$ nối liền về $0$. Đặt mỗi máy chủ lên vòng tại toạ độ `hash(node_id)`.
2. **Quy tắc chiều kim đồng hồ:** để tìm nơi lưu `key`, ta tính `h = hash(key)` rồi đi xuôi chiều kim đồng hồ đến điểm nút đầu tiên có toạ độ $\ge h$ (nếu vượt quá điểm lớn nhất thì quay vòng về nút đầu tiên sau mốc $0$).

Trong mã nguồn, vòng băm chỉ là một **mảng toạ độ đã sắp xếp tăng dần**; mỗi lần định tuyến thực hiện tìm kiếm nhị phân (`binary search`) mất vài chục nano-giây với độ phức tạp $O(\log M)$.

## 4. Thêm hoặc bớt một nút trên vòng băm: chỉ dời đúng một cung 1/(N+1)

```step
category: TECHNIQUE
short: Thêm bớt 1 nút
scene: s4-ring-insert
callout:
  kind: technique
  title: Tác động cục bộ trên một đoạn cung duy nhất
  vi: "Khi chèn thêm nút thứ N + 1, chỉ các khoá nằm trên đoạn cung ngay phía trước nút mới đổi chủ; toàn bộ N − 1 nút còn lại không xê dịch một khoá nào."
whatChanged:
  - "+ Chèn Cache 4 vào góc 315° giữa Cache 3 (260°) và Cache 1 (30°)"
  - "~ Chỉ cung (260° → 315°] chuyển từ Cache 1 sang Cache 4 (≈ 25% khoá)"
telemetry:
  - label: "Khoá dời khi thêm nút"
    value: "1 / (N + 1)"
    tone: ok
  - label: "Khoá dời khi bớt nút"
    value: "1 / N"
    tone: ok
```

Hãy quan sát điều xảy ra khi chèn thêm `Cache 4` vào vị trí `315°` (nằm giữa `Cache 3` ở `260°` và `Cache 1` ở `30°`):

- Các khoá nằm trong cung `(30° → 140°]` vẫn gặp `Cache 2` đầu tiên — **không đổi**.
- Các khoá nằm trong cung `(140° → 260°]` vẫn gặp `Cache 3` đầu tiên — **không đổi**.
- Các khoá trong cung `(315° → 30°]` vẫn thuộc về `Cache 1` — **không đổi**.
- **Chỉ duy nhất** các khoá trên đoạn `(260° → 315°]` (trước đây đi tới `Cache 1`, nay gặp `Cache 4` sớm hơn) được chuyển giao sang `Cache 4`!

Trung bình khi tăng từ $N$ lên $N + 1$ nút, tỷ lệ khoá đổi chỗ đạt mức tối thiểu lý thuyết là $\frac{1}{N + 1}$ (với $3 \to 4$ là **25%**; với $9 \to 10$ chỉ là **10%**). Khi một nút bị gỡ khỏi cụm $N$ nút, chỉ $\frac{1}{N}$ số khoá của riêng nút đó trượt xuôi sang nút kế tiếp.

## 5. Quan sát mô phỏng `mod N`: 75% Cache nguội làm Origin Database quá tải

```step
category: PITFALL
short: Mô phỏng mod N
scene: s5-live-mod
live: mod-resize
activity: S2-10.A1
gate: optional
callout:
  kind: watch-out
  title: Thay đổi ở tầng Cache tạo sự cố ở tầng Database
  vi: "Bản thân các máy Cache có thông lượng RAM rất lớn nên vẫn nhàn nhã; toàn bộ thiệt hại dội thẳng xuống Origin Database có I/O đĩa hạn chế."
whatChanged:
  - "~ Tại t = 20 s, mở rộng cụm bằng mod N làm 3 trên 4 phân vùng Cache mất hiệu lực"
  - "~ Lượng truy vấn xuống Origin DB vọt từ 630 lên ~3.908 ops/s (ρ = 1,95)"
```

Xem kịch bản mô phỏng trực tiếp khi mở rộng từ 3 lên 4 nút lúc **t = 20 s** dưới công thức `hash(key) mod N`:

- Ba phần tư không gian khoá (`Cache 1`, `Cache 2`, `Cache 3`) đồng loạt rơi về trạng thái lạnh (`COLD`).
- Tỷ lệ trúng bộ nhớ đệm toàn cục rớt từ 92% xuống chỉ còn khoảng **23%**.
- Lượng request tràn xuống `Origin Database` tăng gấp 6 lần — từ **630 ops/s** vọt lên **3.908 ops/s**, gấp gần đôi năng lực 2.000 ops/s của DB (`ρ = 1,95`). Hàng đợi trước DB đầy tràn, độ trễ p99 vượt ngưỡng SLO và phát sinh lỗi dây chuyền suốt hơn 15 giây chờ làm ấm lại.

## 6. Đối chiếu mô phỏng Vòng băm nhất quán: chỉ 1 nút làm ấm, 0% lỗi

```step
category: MECHANISM
short: Mô phỏng Ring
scene: s6-live-ring
live: ring-resize
activity: S2-10.A2
gate: required
callout:
  kind: good-to-know
  title: Nằm gọn trong biên độ chịu tải dự phòng của Origin DB
  vi: "Khi chỉ 25% khoá chuyển sang nút mới, lượng Cache Miss tăng thêm vừa khít phần công suất dự phòng của Origin Database nên không một người dùng nào gặp lỗi."
whatChanged:
  - "~ Tại t = 20 s trên vòng băm nhất quán, chỉ riêng Cache 4 mới thêm bắt đầu làm ấm"
  - "~ Origin DB chỉ tăng nhẹ lên ρ = 0,86 trong vài giây rồi hạ dần về 0,32 (0% lỗi)"
```

Chạy lại đúng thao tác thêm nút `Cache 4` lúc **t = 20 s** ở cùng mức tải 5.000 req/s nhưng dùng **Consistent Hashing**:

- `Cache 1`, `Cache 2` và `Cache 3` giữ nguyên toàn bộ 75% không gian khoá đang ấm (tiếp tục chặn 92% lượt đọc trên phần của mình).
- Chỉ 25% lưu lượng đi vào `Cache 4` bị Miss ban đầu (~1.188 lượt đọc/giây), đẩy tổng tải xuống `Origin Database` lên đỉnh ngắn hạn khoảng **1.723 ops/s** (`ρ = 0,86 < 1,00`).
- Vì `ρ` chưa chạm 1, hàng đợi không bị dồn ứ: **tỷ lệ lỗi bằng 0%**, p99 toàn cục giữ dưới 95 ms và nhanh chóng trở về nền 630 ops/s khi `Cache 4` nạp đầy RAM.

## 7. Hạn chế của vòng băm cơ bản: độ dài các cung không đều nhau

```step
category: PROBLEM
short: Cung không đều
scene: s7-ring-skew
callout:
  kind: watch-out
  title: Ít điểm ngẫu nhiên tạo phương sai lớn
  vi: "Nếu 4 máy chỉ đặt đúng 4 điểm lên vòng tròn, xác suất rất cao một cung rộng gấp 3–4 lần cung bên cạnh, khiến một máy quá tải sớm."
whatChanged:
  - "~ Đặt chỉ 1 điểm cho mỗi máy chủ vật lý trên vòng băm (vnodes = 1)"
  - "~ Ba điểm rơi gần nhau để lại cung 54% cho Cache 1 trong khi Cache 4 chỉ giữ 13%"
telemetry:
  - label: "Số điểm mỗi máy"
    value: "1 điểm (vnodes = 1)"
  - label: "Cung lớn nhất (ví dụ)"
    value: "54% (gấp đôi kỳ vọng)"
    tone: bad
```

Vòng băm nguyên bản (mỗi máy chủ chỉ băm đúng một điểm `hash(node_id)`) còn hai nhược điểm thực tế khi số máy vật lý $N$ còn nhỏ:

1. **Lệch kích thước cung (Load Skew):** bốn điểm băm ngẫu nhiên trên vòng tròn hiếm khi cách nhau đúng $90^\circ$. Chỉ cần ba điểm tình cờ rơi vào cùng một nửa vòng, nút còn lại phải ôm trọn hơn nửa vòng tròn (**> 50% tổng số khoá**).
2. **Hiệu ứng domino khi 1 máy sập:** nếu `Cache 2` ngừng chạy, **toàn bộ 100%** tải của `Cache 2` dồn hết sang một người hàng xóm duy nhất đứng kế tiếp (`Cache 3`), dễ kéo `Cache 3` quá tải theo.

## 8. Giải pháp Virtual Nodes (VNodes): chia nhỏ và đan xen hàng trăm cung ảo

```step
category: TECHNIQUE
short: Virtual Nodes
scene: s8-vnodes
callout:
  kind: technique
  title: Quy luật số lớn làm phẳng vòng băm
  vi: "Khi mỗi máy chủ vật lý đặt V = 150 điểm ảo rải khắp vòng, độ lệch tải giảm tỷ lệ với 1/√V, đưa mọi máy về sát mức trung bình 1/N."
whatChanged:
  - "+ Mỗi máy vật lý sinh V = 150 nhãn ảo (Cache1#0 .. Cache1#149) đan xen trên vòng"
  - "+ Kiểm chứng thực nghiệm trên 10.000 khoá: mỗi máy nhận đều ≈ 25% ± 2%"
telemetry:
  - label: "Số VNodes chuẩn"
    value: "100 – 200 / máy"
    tone: ok
  - label: "Độ lệch tải ở V = 150"
    value: "≈ ±2% quanh 25%"
    tone: ok
```

**Virtual Nodes (VNodes)** khắc phục hoàn toàn hiện tượng lệch cung: thay vì đặt 1 điểm, mỗi máy vật lý `node` được băm thành $V$ điểm ảo độc lập trên vòng thông qua các nhãn `node#0`, `node#1`, …, `node#(V-1)` (thường chọn $V \in [100, 200]$):

```python
import bisect, hashlib

class ConsistentHashRing:
    def __init__(self, nodes: list[str], vnodes: int = 150):
        self.ring: list[tuple[int, str]] = []
        for node in nodes:
            for i in range(vnodes):
                h = int.from_bytes(hashlib.md5(f"{node}#{i}".encode()).digest()[:4], "big")
                self.ring.append((h, node))
        self.ring.sort()
        self.points = [p[0] for p in self.ring]

    def get_node(self, key: str) -> str:
        h = int.from_bytes(hashlib.md5(key.encode()).digest()[:4], "big")
        idx = bisect.bisect_left(self.points, h)
        return self.ring[0 if idx == len(self.ring) else idx][1]
```

Virtual Nodes đem lại đồng thời **ba lợi ích kỹ thuật**:
1. **Cân bằng tải đồng đều:** hàng trăm cung nhỏ của các máy đan xen nhau làm phương sai giảm theo $1 / \sqrt{V}$, giữ mỗi máy quanh $25\% \pm 2\%$ đồng thời vẫn chỉ dời đúng $\frac{1}{N + 1}$ khoá khi thêm máy.
2. **Phân tán tải khi hỏng máy:** khi `Cache 2` tắt, 150 cung nhỏ của nó rải đều sang tất cả các máy còn lại thay vì dồn hết lên một máy kế cận.
3. **Hỗ trợ phần cứng không đồng nhất:** máy mới có RAM gấp đôi chỉ cần cấp `300` VNodes thay vì `150` để tự động nhận gấp đôi phần tải.

## 9. Tóm tắt: ứng dụng Consistent Hashing trong hệ thống phân tán thực tế

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Nền tảng của cụm bộ nhớ đệm và cơ sở dữ liệu phân tán tự co giãn
  vi: "Consistent Hashing giữ ổn định vị trí dữ liệu khi số máy thay đổi; Virtual Nodes giữ cân bằng lưu lượng giữa các máy."
whatChanged:
  - "+ Hoàn chỉnh Vòng băm nhất quán kết hợp Virtual Nodes và nhân bản trên vòng"
telemetry:
  - label: "Dời khoá (mod N → Ring)"
    value: "N/(N+1) xuống 1/(N+1)"
    tone: ok
  - label: "Cân bằng tải & chịu lỗi"
    value: "Virtual Nodes (V ≈ 150)"
    tone: ok
```

Trong các cơ sở dữ liệu phân tán như Amazon DynamoDB hay Apache Cassandra, vòng băm còn kiêm luôn nhiệm vụ **sao chép chịu lỗi (Replication)**: mỗi khoá sau khi chạm điểm ảo đầu tiên sẽ tiếp tục đi xuôi chiều kim đồng hồ để lưu bản sao lên $R - 1$ máy vật lý **khác nhau** kế tiếp.

Ghi nhớ ba điểm mấu chốt của bài học:
1. **Không dùng `mod N` cho cụm co giãn:** đổi từ $N$ sang $N + 1$ làm dời $\frac{N}{N + 1}$ khoá, gây bão Cache Miss đánh thẳng vào Database gốc.
2. **Vòng băm nhất quán cô lập thay đổi:** tra cứu chiều kim đồng hồ trong $O(\log M)$ giúp việc thêm máy thứ $N + 1$ chỉ dời trung bình $\frac{1}{N + 1}$ số khoá.
3. **Luôn đi kèm Virtual Nodes:** cấu hình 100–200 VNodes mỗi máy để chia đều cung, hỗ trợ trọng số phần cứng và rải đều tải khi có máy ngừng hoạt động.

## 1. Bài toán Autocomplete ở 50.000 QPS và ngưỡng 100 ms

```step
category: SETUP
short: Bức tranh tổng
scene: s1-overview
callout:
  kind: key-idea
  title: Tốc độ gõ phím tạo tải đọc cực lớn
  vi: "Mỗi ký tự người dùng gõ vào ô tìm kiếm là một request mới. Để người dùng thấy gợi ý tức thì, độ trễ đầu cuối phải dưới 100 ms."
whatChanged:
  - "+ Kiến trúc 2 tầng: Client → Prefix Cache → Trie Shards"
telemetry:
  - label: "Tải đỉnh"
    value: "50.000 QPS"
  - label: "Ngân sách độ trễ"
    value: "< 100 ms"
```

Hệ thống gợi ý tìm kiếm (**Autocomplete / Typeahead**) hiển thị 5–10 từ khoá phổ biến nhất ngay khi người dùng gõ những ký tự đầu tiên. Nếu người dùng gõ từ `"system"` (6 ký tự), trình duyệt có thể gửi tới 6 request liên tiếp chỉ trong 1–2 giây.

Vì người dùng phản ứng rất nhạy với độ trễ khi gõ phím, hệ thống cần đảm bảo:
- **Độ trễ đầu cuối dưới 100 ms** (trừ đi 30–50 ms mạng Internet, backend chỉ còn khoảng 20–40 ms để xử lý).
- **Thông lượng 50.000 QPS** với tỷ lệ đọc chiếm gần như tuyệt đối (98%+).

## 2. Cấu trúc cây Trie lưu sẵn Top-K tại mỗi nút

```step
category: MECHANISM
short: Cây Trie Top-K
scene: s2-trie
callout:
  kind: technique
  title: Đổi bộ nhớ lấy tốc độ O(p)
  vi: "Thay vì duyệt toàn bộ nhánh con để sắp xếp mỗi lần có người gõ, hãy lưu sẵn danh sách Top-K ngay tại từng nút trên cây Trie."
whatChanged:
  - "+ Mỗi nút tiền tố (như \"sy\", \"sys\") giữ sẵn Top-K kết quả"
  - "~ Thời gian tra cứu chỉ phụ thuộc độ dài tiền tố O(p)"
telemetry:
  - label: "Độ phức tạp tra cứu"
    value: "O(p) (p ≤ 20)"
    tone: ok
  - label: "Kết quả mỗi nút"
    value: "Top 5–10 từ khoá"
```

Nếu dùng câu lệnh `SELECT ... WHERE query LIKE 'sys%' ORDER BY count DESC LIMIT 10` trên cơ sở dữ liệu truyền thống, truy vấn sẽ chậm hàng trăm mili-giây ở 50.000 QPS.

Cấu trúc chuẩn cho Autocomplete là **cây Trie (Prefix Tree)** đặt hoàn toàn trong RAM:
- Mỗi cạnh là một ký tự; đi từ gốc theo chuỗi `"s" → "y" → "s"` mất đúng `p = 3` bước nhảy con trỏ.
- **Tối ưu quan trọng:** Nếu tới nút `"sys"` rồi mới duyệt toàn bộ hàng trăm nghìn nút con bên dưới để tìm 10 từ phổ biến nhất thì vẫn quá chậm. Thay vào đó, tại **mỗi nút**, ta lưu sẵn mảng Top-K từ khoá phổ biến nhất của nhánh đó. Khi đó, tra cứu chỉ mất `O(p)` (dưới 1 ms trong RAM).

## 3. Xếp hạng ngoại tuyến (Offline Ranking) và cập nhật không khoá

```step
category: TECHNIQUE
short: Xếp hạng offline
scene: s3-offline
callout:
  kind: key-idea
  title: Tách hoàn toàn luồng cập nhật khỏi luồng đọc
  vi: "Không sửa cây Trie trực tiếp mỗi khi có lượt tìm kiếm mới. Hãy tổng hợp log ngoại tuyến, dựng cây Trie mới và tráo đổi nguyên tử."
whatChanged:
  - "+ Tổng hợp Search Logs ngoại tuyến bằng MapReduce / Spark"
  - "~ Dựng ảnh chụp Trie mới rồi Atomic Swap lên Trie Shards"
telemetry:
  - label: "Tác động luồng đọc"
    value: "0 ms khoá ghi"
    tone: ok
  - label: "Độ trễ cập nhật"
    value: "Vài phút đến hàng giờ"
```

Gợi ý tìm kiếm không cần phản ánh biến động ngay trong mili-giây. Nếu cập nhật trọng số cây Trie ngay trên RAM khi đang phục vụ 50.000 QPS đọc, các khoá đồng bộ (Lock) sẽ làm tăng đột biến độ trễ đuôi p99.

Quy trình cập nhật chuẩn chạy **ngoại tuyến (Offline)**:
1. Ghi nhận mọi lượt tìm kiếm thực tế vào **Search Logs** (bất đồng bộ).
2. Định kỳ (mỗi giờ hoặc mỗi ngày), chạy tác vụ **MapReduce / Spark** để tổng hợp tần suất và xếp hạng độ phổ biến mới (có thể giảm trọng số dữ liệu cũ theo thời gian).
3. **Trie Builder** dựng hoàn chỉnh một cây Trie mới ở tiến trình nền, tuần tự hoá thành ảnh chụp (snapshot) và đẩy xuống `trie_shards`.
4. Các shard nạp ảnh chụp mới vào vùng nhớ phụ rồi **tráo con trỏ nguyên tử (Atomic Swap)** mà không làm gián đoạn luồng đọc.

## 4. Bộ nhớ đệm tiền tố 1–3 ký tự (Prefix Cache)

```step
category: TECHNIQUE
short: Prefix Cache
scene: s4-cache
activity: S7-07.A1
gate: optional
callout:
  kind: key-idea
  title: 18.278 key gánh 90% lưu lượng
  vi: "Mọi truy vấn đều bắt đầu bằng 1, 2 hoặc 3 ký tự đầu tiên. Số lượng tiền tố ngắn này cực nhỏ nên có thể nằm gọn trong bộ nhớ đệm."
whatChanged:
  - "+ Prefix Cache lưu sẵn kết quả của các tiền tố 1–3 ký tự"
  - "~ Hit Ratio ~90% giúp giảm 10 lần tải rơi xuống Trie Shards"
telemetry:
  - label: "Tiền tố 1–3 ký tự"
    value: "18.278 tổ hợp (a–z)"
  - label: "RAM ước tính"
    value: "≈ 9–20 MB"
    tone: ok
```

Tại sao không cho toàn bộ 50.000 QPS đi thẳng vào `trie_shards`? Bởi vì phân phối truy vấn tiền tố cực kỳ lệch:
- Hầu hết mọi người đều gõ qua các tiền tố 1–3 ký tự (`"s"`, `"sy"`, `"sys"`).
- Tổng số tổ hợp 1–3 ký tự chỉ là 26 + 26² + 26³ = 18.278 khoá — một kích thước siêu nhỏ với Redis hoặc Cache cục bộ.
- Khi `prefix_cache` chứa đủ tập tiền tố nóng này, khoảng **90% yêu cầu** được trả lời ngay trong 1 ms, chỉ còn ~10% tiền tố dài hơn đi xuống `trie_shards`.

## 5. Mô phỏng trực tiếp: nghẽn Trie Shards khi Cache thiếu chỗ

```step
category: PROBLEM
short: Tải 50.000 QPS
scene: s5-live
live: typeahead
activity: S7-07.A2
gate: required
callout:
  kind: watch-out
  title: Cache nhỏ đẩy tải Miss sang Trie Shards
  vi: "Khi Prefix Cache chỉ chứa 8.000 trên 20.000 key nóng, hơn một nửa lưu lượng 50.000 QPS rơi thẳng xuống 3 Trie Shards và làm p99 vượt 80 ms."
whatChanged:
  - "~ Tải tăng từ 5.000 lên 50.000 QPS trong 50 giây"
  - "~ Thử tăng dung lượng Prefix Cache hoặc số lượng Trie Shards"
telemetry:
  - label: "Tải đỉnh"
    value: "50.000 QPS"
  - label: "Mục tiêu p99"
    value: "≤ 80 ms"
```

Trong mô phỏng trực tiếp, lưu lượng tăng từ 5.000 lên 50.000 QPS:
- Với `capacityKeys = 8.000` (nhỏ hơn tập nóng 20.000 key), Hit Ratio của `prefix_cache` bị giới hạn, đẩy hơn 25.000 req/s rơi xuống 3 `trie_shards` (tổng năng lực chỉ 10.500 req/s).
- Nếu bạn chỉ tăng số `trie_shards` lên 5 máy, chi phí tăng cao mà vẫn không đủ gánh lượng Miss khổng lồ. Ngược lại, chỉ cần mở rộng `prefix_cache` lên 20.000 key, tải rơi xuống `trie_shards` lập tức giảm mạnh xuống khoảng 6.000 req/s.

## 6. Tối ưu phía Client: Debouncing và phân mảnh Trie

```step
category: TECHNIQUE
short: Debounce & Shard
scene: s6-client-debounce
callout:
  kind: technique
  title: Giảm tải ngay từ trình duyệt
  vi: "Chờ 150–200 ms sau lần gõ cuối (Debouncing) trước khi gọi API và gắn Cache-Control để trình duyệt tự nhớ các tiền tố vừa gõ."
whatChanged:
  - "~ Debounce 150–200 ms cắt 40–60% request khi gõ nhanh"
  - "+ Sharding Trie theo dải ký tự đầu (a–g, h–p, q–z)"
telemetry:
  - label: "Debounce"
    value: "150–200 ms"
  - label: "Phân mảnh"
    value: "Theo ký tự đầu"
```

Bên cạnh Prefix Cache ở backend, có hai kỹ thuật giúp mở rộng hệ thống bền vững hơn:

1. **Debouncing phía Client:** Người gõ nhanh không cần thấy gợi ý ở từng mili-giây khi đang gõ dở một âm tiết. Đợi 150–200 ms sau lần nhấn phím gần nhất mới gửi API giúp cắt giảm tới một nửa số request thừa.
2. **Sharding cây Trie theo tiền tố:** Khi từ điển quá lớn không vừa RAM một máy, ta chia đều các nhánh gốc sang nhiều máy chủ theo dải ký tự đầu (ví dụ Shard 1 giữ `a–g`, Shard 2 giữ `h–p`, Shard 3 giữ `q–z`), cân bằng tải dựa trên tần suất chữ cái đầu tiên.

## 7. Tóm tắt kiến trúc Autocomplete

```step
category: RECAP
short: Tóm tắt
scene: s7-recap
callout:
  kind: key-idea
  title: Công thức dưới 100 ms ở 50.000 QPS
  vi: "Cây Trie lưu sẵn Top-K trong RAM, Prefix Cache 1–3 ký tự gánh 90% tải, xếp hạng ngoại tuyến không khoá đọc và Debouncing ở Client."
whatChanged:
  - "+ Tổng kết kiến trúc đọc nhanh và cập nhật nền"
telemetry:
  - label: "Tra cứu Trie"
    value: "O(p) trong RAM"
  - label: "Xếp hạng"
    value: "Offline MapReduce"
```

Bốn mảnh ghép tạo nên hệ thống Autocomplete 50.000 QPS dưới 100 ms:

1. **Cây Trie lưu sẵn Top-K:** Đặt toàn bộ trong RAM, mỗi nút giữ sẵn danh sách gợi ý hàng đầu để trả lời trong `O(p)`.
2. **Prefix Cache 1–3 ký tự:** Tập khoá nhỏ (~18.278 tổ hợp) nhưng gánh ~90% lưu lượng đọc.
3. **Xếp hạng ngoại tuyến (Offline Ranking):** Tổng hợp Search Logs định kỳ, dựng sẵn ảnh chụp Trie mới và Atomic Swap để không làm chậm luồng đọc.
4. **Debouncing & Sharding:** Giảm request thừa từ trình duyệt và phân mảnh Trie theo dải ký tự đầu khi từ điển lớn.

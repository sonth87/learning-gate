## 1. Độ sẵn sàng của chuỗi nối tiếp và bài toán Điểm lỗi đơn (SPOF)

```step
category: SETUP
short: Chuỗi nối tiếp
scene: s1-serial
callout:
  kind: key-idea
  title: Luật nhân xác suất trên đường nối tiếp
  vi: "Khi request bắt buộc đi qua nhiều thành phần nối tiếp, độ sẵn sàng tổng bằng tích độ sẵn sàng của từng thành phần, nên luôn thấp hơn thành phần yếu nhất."
whatChanged:
  - "+ Đường đi cơ bản nối tiếp: Người dùng → LB (AZ-A) → App 1 → DB Primary"
  - "~ Ghép 3 tầng ba số 9 làm độ sẵn sàng toàn chuỗi giảm còn 99,70%"
telemetry:
  - label: "LB / App / DB"
    value: "99,95% · 99,9% · 99,85%"
  - label: "Độ sẵn sàng chuỗi"
    value: "≈ 99,70%"
    tone: warn
  - label: "Gián đoạn mỗi năm"
    value: "≈ 26,3 giờ"
    tone: bad
```

**Độ sẵn sàng (Availability)** đo tỷ lệ thời gian hệ thống phản hồi hợp lệ trên tổng thời gian vận hành. Khi một request bắt buộc đi lần lượt qua $n$ thành phần mắc nối tiếp có lỗi độc lập, cả chuỗi chỉ hoạt động khi **mọi** thành phần đều sống:

$$A_{\text{chuỗi}} = A_1 \times A_2 \times \dots \times A_n$$

Xét chuỗi ba tầng gồm Load Balancer ($99,95\%$), App ($99,90\%$) và Database ($99,85\%$). Độ sẵn sàng tổng là $0,9995 \times 0,9990 \times 0,9985 \approx 99,70\%$, tương đương khoảng **26,3 giờ** ngừng dịch vụ mỗi năm ($8.760 \text{ giờ} \times 0,30\%$).

Mỗi thành phần chỉ có một bản duy nhất trên đường đi chính được gọi là **Điểm lỗi đơn (Single Point of Failure — SPOF)**. Chuỗi nối tiếp giống hệ thống đèn mắc nối tiếp: chỉ một bóng đứt là toàn mạch tắt.

## 2. Nhận diện Điểm lỗi đơn (SPOF) trên đồ thị kiến trúc

```step
category: PROBLEM
short: Tìm điểm SPOF
scene: s2-spof
activity: S3-09.A1
gate: optional
callout:
  kind: watch-out
  title: Mở rộng một tầng không tự xoá SPOF ở tầng khác
  vi: "Thêm nhiều máy App song song chỉ loại bỏ SPOF tại tầng tính toán; một Load Balancer đơn hoặc một Database chưa nhân bản vẫn cắt đứt 100% lưu lượng khi hỏng."
whatChanged:
  - "+ Thêm App 2 chạy song song với App 1"
  - "~ LB (AZ-A) và DB Primary (AZ-A) vẫn đứng đơn lẻ trên đường đi chính"
telemetry:
  - label: "Nhánh App song song"
    value: "2 máy"
    tone: ok
  - label: "Số SPOF còn lại"
    value: "2 điểm"
    tone: bad
```

Trong lý thuyết đồ thị, **SPOF** tương ứng với một nút khớp (*Articulation Point*) nằm giữa nguồn lưu lượng và kho dữ liệu cốt lõi: nếu xoá nút đó làm đồ thị mất đường đi hợp lệ, độ sẵn sàng toàn cục bị chặn trên bởi độ sẵn sàng của riêng nút đó.

Sai lầm thường gặp là chỉ nhân bản tầng dễ mở rộng nhất (như thêm `App 1`, `App 2`), nhưng bỏ sót cửa ngõ đầu vào (`LB`, `API Gateway`, `NAT Gateway`) hoặc tầng lưu trữ trạng thái (`DB Primary`, kho phiên tập trung).

Để kiểm toán SPOF có hệ thống, với từng hộp trên sơ đồ kiến trúc, hãy đặt câu hỏi: *Nếu rút phích cắm của riêng hộp này ngay lúc cao điểm, người dùng có còn hoàn tất được thao tác đọc và ghi hay không?*

## 3. Dự phòng song song: công thức độ sẵn sàng và dư công suất N+1

```step
category: TECHNIQUE
short: Cặp song song
scene: s3-parallel
activity: S3-09.A2
gate: optional
callout:
  kind: key-idea
  title: Dự phòng cả kết nối lẫn công suất
  vi: "Hai máy chạy ở mức sử dụng 80% không phải là dự phòng thật: khi một máy dừng, máy còn lại nhận 160% tải và quá tải dây chuyền."
whatChanged:
  - "+ Bổ sung LB (AZ-B), Global DNS / VIP, DB Failover Router và DB Standby"
  - "~ Mọi tầng đều có ít nhất hai thành phần dự phòng song song"
telemetry:
  - label: "Cặp 99,9% song song"
    value: "99,9999%"
    tone: ok
  - label: "Mức tải mỗi nhánh App"
    value: "ρ ≈ 0,33"
    tone: ok
```

**Dự phòng (Redundancy)** loại bỏ SPOF bằng cách đặt nhiều thành phần song song để cả tầng chỉ ngừng khi **tất cả** bản sao hỏng cùng lúc. Nếu hai thành phần có độ sẵn sàng $A_1, A_2$ và lỗi **độc lập thống kê**:

$$A_{\text{song song}} = 1 - (1 - A_1)(1 - A_2)$$

Hai máy chủ $99,9\%$ ghép song song đạt $1 - 0,001^2 = 99,9999\%$ (giảm gián đoạn lý thuyết xuống khoảng 31,5 giây/năm). Tuỳ đặc tính trạng thái, ta áp dụng hai mô hình:

- **Active-Active:** cả hai nhánh cùng phục vụ lưu lượng thường trực (như cụm `LB` và `App`). Cần duy trì mức dư công suất tối thiểu **N+1** (ví dụ chạy 2 máy ở $\rho \le 0,45$) để nhánh còn lại gánh trọn 100% tải khi một nhánh sập.
- **Active-Passive (Leader–Standby):** bản chính xử lý ghi và truyền nhật ký `WAL` sang bản dự phòng nóng (`DB Standby`), sẵn sàng thăng cấp khi bản chính ngừng phản hồi.

## 4. Lỗi tương quan (Correlated Failure) khi đặt chung một phòng máy

```step
category: PROBLEM
short: Lỗi tương quan
scene: s4-correlated
callout:
  kind: watch-out
  title: Công thức nhân xác suất vỡ khi chung miền lỗi
  vi: "Đặt cả máy chính lẫn máy dự phòng trên cùng tủ rack hoặc cùng một Data Center khiến một sự cố điện, điều hoà hay mạng lõi đánh sập cả hai cùng lúc."
whatChanged:
  - "~ Cả LB, App và DB đặt chung trong một vùng vật lý duy nhất"
  - "~ Sự cố mất nguồn phòng máy làm toàn bộ thành phần ngừng đồng thời"
telemetry:
  - label: "Miền lỗi vật lý"
    value: "1 phòng máy"
    tone: warn
  - label: "Lưu lượng khi mất nguồn"
    value: "0 req/s"
    tone: bad
```

Công thức $1 - (1 - A)^2$ dựa trên giả định hai thành phần hỏng **độc lập**. Trong thực tế vận hành, phần lớn sự cố lớn là **lỗi tương quan (Correlated Failures)** do dùng chung một **miền lỗi (Fault Domain)**:

- Hai máy ảo nằm trên cùng một máy chủ vật lý (Hypervisor) hoặc cùng tủ rack dùng chung bộ chia nguồn (PDU) và thiết bị chuyển mạch đầu tủ (Top-of-Rack Switch).
- Cả cụm chính và cụm dự phòng đặt trong cùng một toà nhà Data Center: khi hỏng trạm biến áp, sự cố hệ thống làm lạnh hoặc đứt tuyến cáp quang ngoài toà nhà, mọi bản sao đều mất kết nối tại cùng một giây.

Muốn dự phòng có ý nghĩa thực tế, các bản sao bắt buộc phải tách sang những miền lỗi hạ tầng độc lập.

## 5. Phân bố đa Vùng khả dụng (Multi-AZ) trong cùng một Region

```step
category: TECHNIQUE
short: Đa vùng AZ
scene: s5-multi-az
callout:
  kind: technique
  title: Độc lập hạ tầng vật lý nhưng vẫn giữ độ trễ nội vùng thấp
  vi: "Các Availability Zone cách nhau vài đến vài chục km, tách biệt điện và mạng lõi nhưng có RTT chỉ khoảng 1–2 ms, đủ nhanh để sao chép dữ liệu gần thời gian thực."
whatChanged:
  - "+ Tách kiến trúc thành hai miền độc lập: AZ-A và AZ-B"
  - "+ Đường truyền WAL liên vùng từ DB Primary (AZ-A) sang DB Standby (AZ-B)"
telemetry:
  - label: "RTT liên vùng AZ"
    value: "≈ 1,5 ms"
    tone: ok
  - label: "Tải chia đều 2 AZ"
    value: "50% / 50%"
    tone: ok
```

Một **Availability Zone (AZ)** là một hoặc cụm trung tâm dữ liệu độc lập về lưới điện, máy phát dự phòng, hệ thống làm mát và nhà mạng bên trong một vùng địa lý (**Region**). Các AZ kết nối với nhau qua mạng cáp quang chuyên dụng băng thông lớn với độ trễ khứ hồi khoảng `1–2 ms`.

Trong thiết kế **Multi-AZ** tiêu chuẩn:
- Tầng cân bằng tải và ứng dụng chạy **Active-Active** rải đều qua ít nhất 2–3 AZ; mỗi AZ giữ đủ năng lực dự phòng để tiếp nhận phần tải dồn sang khi một AZ gặp sự cố.
- Tầng cơ sở dữ liệu đặt `DB Primary` ở `AZ-A` và `DB Standby` ở `AZ-B` (kèm node trọng tài ở AZ thứ ba nếu dùng bầu cử đa số Quorum). Độ trễ `1,5 ms` cho phép bật sao chép bán đồng bộ mà hầu như không ảnh hưởng độ trễ giao dịch.

## 6. Mô phỏng mất điện toàn bộ AZ-A và chuyển đổi dự phòng sang AZ-B

```step
category: PROBLEM
short: Mất điện AZ-A
scene: s6-live-failover
live: az-failover
callout:
  kind: key-idea
  title: Tổng thời gian gián đoạn do mắt xích chuyển đổi chậm nhất quyết định
  vi: "Dù DNS chuyển hướng lưu lượng vào LB (AZ-B) sau 4 giây, hệ thống chỉ khôi phục hoàn toàn ở giây 26 khi DB Standby hoàn tất thăng cấp lên làm Leader mới."
whatChanged:
  - "~ Tại t = 18 s: toàn bộ LB, App 1 và DB Primary ở AZ-A ngừng hoạt động"
  - "~ t = 22 s: DNS cắt sang AZ-B · t = 26 s: DB Standby tiếp quản 1.200 req/s"
```

Quan sát mô phỏng với tải ổn định `1.200 req/s` khi vùng `AZ-A` mất nguồn đột ngột ở **t = 18 s**:

- **t = 0..18 s:** `Global DNS / VIP` chia đều request qua `AZ-A` và `AZ-B`; `DB Primary (AZ-A)` xử lý giao dịch và phát dòng `WAL` sang `DB Standby (AZ-B)`.
- **t = 18..22 s:** `LB (AZ-A)`, `App 1 (AZ-A)` và `DB Primary (AZ-A)` dừng cùng lúc; tỷ lệ lỗi vọt lên gần `100%` trong lúc chờ hết hạn `ttlSec = 4 s`.
- **t = 22..26 s:** Lưu lượng đầu vào đã dồn hết sang `LB (AZ-B)` và `App 2 (AZ-B)`, nhưng vẫn lỗi do chờ `DB Failover Router` xác nhận mất nhịp tim và thăng cấp `DB Standby` (`8 s`).
- **Từ t = 26 s trở đi:** `DB Standby (AZ-B)` nhận 100% truy vấn đọc ghi, lưu lượng thành công phục hồi trọn vẹn `1.200 req/s` (`ρ ≈ 0,67` tại `App 2`). Hãy thử giảm núm `ttlSec` và `healthCheckSec` để quan sát khoảng gián đoạn thu hẹp trực tiếp trên đồ thị.

## 7. Đo lường khôi phục: RTO, RPO và kỷ luật diễn tập tự động

```step
category: MECHANISM
short: Chỉ số RTO/RPO
scene: s7-rto-rpo
callout:
  kind: compare
  title: RTO đo thời gian ngừng, RPO đo lượng dữ liệu mất
  vi: "RTO nhỏ đòi hỏi phát hiện và điều hướng tự động; RPO bằng 0 đòi hỏi dữ liệu đã nằm bền vững trên ít nhất một vùng khác trước khi báo thành công cho người dùng."
whatChanged:
  - "+ Phân rã dòng thời gian sự cố thành khoảng RPO (trước sập) và khoảng RTO (sau sập)"
telemetry:
  - label: "RTO mặc định của bài"
    value: "8 giây (t = 18 → 26 s)"
    tone: warn
  - label: "RPO với Semi-sync"
    value: "0 giao dịch"
    tone: ok
```

Mọi kế hoạch **Chuyển đổi dự phòng (Failover)** được định lượng bằng hai cam kết:

1. **RTO (Recovery Time Objective):** khoảng thời gian tối đa từ lúc sự cố xảy ra tới khi dịch vụ hoạt động trở lại bình thường:

$$\text{RTO} = T_{\text{phát hiện}} + T_{\text{thăng cấp \& cô lập}} + T_{\text{định tuyến lại}}$$

Nếu một bước cần con người trực ca mở máy tính xác nhận hoặc vướng `DNS TTL = 600 s`, RTO lập tức kéo dài hàng chục phút.
2. **RPO (Recovery Point Objective):** độ tuổi tối đa của dữ liệu có thể bị mất khi sự cố xảy ra. Sao chép bất đồng bộ có `RPO > 0` (vài trăm mili-giây đến vài giây `WAL` chưa kịp gửi sang `AZ-B`); sao chép bán đồng bộ (**Semi-sync**) đảm bảo `RPO = 0` khi mất một AZ.

Một quy tắc vận hành cốt lõi: **cơ chế Failover chưa được diễn tập tự động định kỳ thì không thể tin cậy**. Quyền mạng thay đổi, chứng chỉ hết hạn hay cấu hình lệch chỉ lộ ra khi kiểm thử thực tế.

## 8. Lỗi phần mềm đồng loạt và Triển khai Canary tự động Rollback

```step
category: PITFALL
short: Lỗi bản release
scene: s8-canary
activity: S3-09.A3
gate: required
callout:
  kind: watch-out
  title: Hạ tầng đa vùng không chặn được bản cập nhật lỗi đẩy đồng loạt
  vi: "Một bản phát hành lỗi hoặc thay đổi cấu hình sai đẩy cùng lúc lên cả AZ-A và AZ-B sẽ biến toàn bộ cụm dự phòng thành lỗi tương quan 100%."
whatChanged:
  - "+ Cô lập phiên bản mới v2.4 trên nhóm Canary (5% lưu lượng) trước khi mở rộng"
  - "+ Giữ 95% lưu lượng trên phiên bản ổn định v2.3 và tự động Rollback nếu lỗi tăng"
telemetry:
  - label: "Phạm vi Canary"
    value: "1% – 5% lưu lượng"
    tone: warn
  - label: "Tự động Rollback"
    value: "Khi lỗi 5xx / p99 vượt ngưỡng"
    tone: ok
```

Sự cố diện rộng ngoài thực tế thường đến từ thay đổi phần mềm hoặc cấu hình hơn là mất điện phòng máy. Nếu hệ thống CI/CD đẩy bản mã mới hoặc tệp cấu hình lỗi lên toàn bộ máy chủ ở cả `AZ-A` lẫn `AZ-B` cùng lúc, dự phòng phần cứng hoàn toàn vô tác dụng.

Để giữ tính độc lập giữa các miền lỗi khi thay đổi phần mềm, cần áp dụng **Triển khai theo giai đoạn (Staged / Canary Rollout)**:
- Đưa phiên bản mới nhận `1% – 5%` lưu lượng thực tế trong một AZ đầu tiên.
- Đối chiếu tự động tỷ lệ lỗi `5xx` và độ trễ `p99` giữa nhóm Canary và nhóm ổn định; nếu vi phạm ngưỡng SLO, hệ thống tự động **Rollback** mà không ảnh hưởng `95% – 99%` người dùng còn lại.
- Chỉ tuần tự nâng lên `25% → 50% → AZ kế tiếp` sau khi mỗi chặng vượt qua cửa sổ kiểm tra an toàn. Với rủi ro cấp toàn vùng địa lý, áp dụng nguyên tắc tương tự giữa các **Multi-Region**.

## 9. Tóm tắt: nguyên tắc thiết kế chịu lỗi không điểm nghẽn đơn

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Checklist thiết kế High Availability
  vi: "Kiểm toán SPOF đầu-cuối, tách miền lỗi qua nhiều AZ với công suất dư N+1, tự động hoá Failover theo mục tiêu RTO/RPO và bảo vệ luồng phát hành bằng Canary."
whatChanged:
  - "+ Tổng hợp 4 lớp bảo vệ từ phần cứng, mạng, dữ liệu tới quy trình phát hành"
telemetry:
  - label: "Số điểm lỗi đơn (SPOF)"
    value: "0"
    tone: ok
  - label: "Mục tiêu RTO / RPO"
    value: "Vài giây / 0 giao dịch"
    tone: ok
```

Bốn nguyên tắc cốt lõi để xây dựng hệ thống sẵn sàng cao:

1. **Loại bỏ SPOF trên toàn đường đi:** độ sẵn sàng nối tiếp nhân lùi ($A_1 \times A_2$), còn dự phòng song song độc lập triệt tiêu xác suất hỏng đồng thời ($1 - (1-A)^2$). Đừng quên kiểm tra cả Load Balancer, DNS, Proxy và Database.
2. **Tách miền lỗi bằng Multi-AZ kèm dư công suất N+1:** rải các bản sao qua nhiều Availability Zone độc lập nguồn điện và mạng, đồng thời giữ đủ năng lực tính toán để vùng còn lại gánh trọn 100% tải đỉnh.
3. **Thiết kế theo RTO và RPO tường minh:** dùng Anycast VIP / DNS TTL ngắn, tự động cô lập Primary cũ trước khi thăng cấp Standby, bật Semi-sync nếu nghiệp vụ yêu cầu `RPO = 0`, và diễn tập định kỳ.
4. **Chống lỗi phần mềm tương quan:** luôn phát hành tuần tự qua Canary theo từng AZ kết hợp tự động Rollback theo chỉ số SLO.

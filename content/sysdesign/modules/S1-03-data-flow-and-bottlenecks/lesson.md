<!-- fixture — M5 viết thật -->

## 1. Điểm nghẽn (Bottleneck): thành phần giới hạn thông lượng của cả hệ thống

```step
category: SETUP
short: Điểm nghẽn
scene: none
callout:
  kind: key-idea
  vi: Thêm tài nguyên cho thành phần không phải điểm nghẽn không làm tăng thông lượng của hệ thống.
```

**Điểm nghẽn (Bottleneck)** là thành phần có mức sử dụng cao nhất trên đường đi của request. Thông lượng tối đa của cả hệ thống bằng thông lượng tối đa của thành phần này, vì mọi request đều phải đi qua nó.

Bạn có thể hình dung giống một đường ống: tốc độ nước chảy qua cả đường ống bị quyết định bởi đoạn hẹp nhất.

## 2. Mức sử dụng ρ = λ / μ: đo mức tải của một thành phần

```step
category: MECHANISM
short: Mức sử dụng ρ
scene: none
whatChanged:
  - "+ Thêm công thức ρ = λ / μ"
```

Mức sử dụng của một thành phần là ρ = λ / μ, với λ là số request đến mỗi giây và μ là số request thành phần đó xử lý tối đa mỗi giây. Khi ρ ≥ 1, hàng đợi trước thành phần tăng không dừng và độ trễ tăng theo.

## 3. Quy trình đo, tìm, sửa

```step
category: TECHNIQUE
short: Đo, tìm, sửa
scene: none
```

Đo ρ của từng thành phần trên đường đi của request, chọn thành phần có ρ cao nhất, rồi mới tăng năng lực của thành phần đó. Sau khi sửa, đo lại: điểm nghẽn có thể chuyển sang thành phần kế tiếp.

## 4. Sai lầm phổ biến: thêm server ở tầng không nghẽn

```step
category: PITFALL
short: Sai lầm phổ biến
scene: none
```

Khi database là điểm nghẽn, thêm instance ở tầng ứng dụng chỉ tăng chi phí mà không tăng thông lượng, vì tải vào database không đổi.

## 5. Tóm tắt

```step
category: RECAP
short: Tóm tắt
```

Điểm nghẽn là thành phần có ρ cao nhất. Đo trước, sửa đúng chỗ, rồi đo lại.

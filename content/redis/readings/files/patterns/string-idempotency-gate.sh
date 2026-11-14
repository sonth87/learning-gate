# ============================================================================
# Cổng Chống Trùng Lặp Thanh Toán (Idempotency Gate) bằng SET NX EX Nguyên Tử
# Giải quyết bài toán: User bấm đúp nút "Thanh toán" hoặc mạng retry 2 lần
# ============================================================================

# Bước 1: Thử đăng ký khóa idempotency cho yêu cầu thanh toán với TTL 24 giờ (86400s)
# Cờ NX đảm bảo chỉ 1 request duy nhất thắng cuộc; cờ GET trả về trạng thái cũ nếu đã tồn tại
SET idem:pay:req_9f82c1a0 "IN_PROGRESS" NX EX 86400 GET
# -> Kết quả lần gọi đầu: (nil) nhưng khóa được ghi thành công!
# -> Kết quả nếu request trùng bay vào ngay sau đó: "IN_PROGRESS" (Từ chối xử lý lặp, trả HTTP 409)

# Bước 2: Sau khi cổng thanh toán trừ tiền thành công, cập nhật kết quả JSON và GIỮ NGUYÊN TTL cũ
# CẢNH BÁO: Nếu quên cờ KEEPTTL, lệnh SET trần sẽ xóa sạch hạn sử dụng biến khóa thành vĩnh viễn!
SET idem:pay:req_9f82c1a0 "{\"status\":\"PAID\",\"txId\":\"tx_7721\"}" XX KEEPTTL

# Bước 3: Kiểm tra lại giá trị phản hồi được lưu sẵn và thời gian sống còn lại
GET idem:pay:req_9f82c1a0
PTTL idem:pay:req_9f82c1a0

# Bước 4: Đếm bộ đếm giới hạn OTP đăng nhập theo phút bằng INCR nguyên tử
INCR rate:otp:uid_1042:202611141255
EXPIRE rate:otp:uid_1042:202611141255 90 NX

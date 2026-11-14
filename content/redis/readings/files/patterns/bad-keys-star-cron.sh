# ============================================================================
# [ANTI-PATTERN / BUGGY] Cronjob Dọn Phiên Cũ Bằng KEYS * + DEL Đồng Bộ
# Hậu quả thực tế: Treo cứng Main Thread 1.2 giây mỗi đêm, làm văng timeout toàn hệ thống!
# ============================================================================

# LỖI NGHIÊM TRỌNG 1: KEYS duyệt tuyến tính O(N) toàn bộ 15 triệu khóa trong RAM!
# Vì Redis chạy đơn luồng xử lý lệnh, mọi lệnh GET/SET thanh toán khác bị xếp hàng chờ chết đứng.
KEYS session:guest:*

# LỖI NGHIÊM TRỌNG 2: Gọi DEL trực tiếp lên một khóa Hash/Set khổng lồ (BigKey > 1 triệu phần tử)
# Bộ cấp phát jemalloc phải giải phóng từng con trỏ ngay trên Main Thread thay vì luồng nền BIO.
DEL analytics:raw_events:2026_10

# LỖI NGHIÊM TRỌNG 3: Dùng SMEMBERS hoặc HGETALL không giới hạn trên tập dữ liệu chưa biết kích thước
# Không chỉ nghẽn CPU mà còn làm tràn Client Output Buffer (COB) gây OOM tức thì!
HGETALL global:all_users_directory

# CÁCH THAY THẾ ĐÚNG CHUẨN PRODUCTION:
# 1. Đặt TTL ngay từ lúc ghi (SET ... EX 3600 hoặc HEXPIRE) để Redis tự thu hồi ngầm.
# 2. Nếu bắt buộc quét khóa, dùng con trỏ SCAN 0 MATCH session:guest:* COUNT 200.
# 3. Luôn thay DEL bằng UNLINK để tách con trỏ O(1) và giải phóng vùng nhớ ở background thread.

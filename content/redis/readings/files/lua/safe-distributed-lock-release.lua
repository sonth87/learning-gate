-- ============================================================================
-- Giải Phóng & Gia Hạn Khóa Phân Tán An Toàn (Token-Verified Mutex Guard)
-- Tuyệt đối không bao giờ xóa nhầm khóa của Worker khác khi gặp GC Pause!
--   KEYS[1] = lock_key (ví dụ: "lock:payout:order_881")
--   ARGV[1] = owner_uuid (UUID v4 sinh riêng cho từng lần giữ khóa)
--   ARGV[2] = action ("RELEASE" | "RENEW")
--   ARGV[3] = renew_ttl_ms (chỉ dùng khi ARGV[2] == "RENEW")
-- ============================================================================

local lock_key = KEYS[1]
local expected_owner = ARGV[1]
local action = ARGV[2] or "RELEASE"

local current_owner = redis.call("GET", lock_key)

-- Nếu khóa đã tự hết hạn hoặc đã thuộc về một Worker khác -> Từ chối tác động!
if not current_owner or current_owner ~= expected_owner then
  return 0
end

if action == "RENEW" then
  local ttl_ms = tonumber(ARGV[3] or "10000")
  return redis.call("PEXPIRE", lock_key, ttl_ms)
end

-- Mặc định: Giải phóng khóa bằng UNLINK/DEL nguyên tử khi xác nhận đúng chủ sở hữu
return redis.call("DEL", lock_key)

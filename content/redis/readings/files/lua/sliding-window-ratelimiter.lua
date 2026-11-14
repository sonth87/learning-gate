-- ============================================================================
-- Bộ Giới Hạn Tốc Độ Cửa Sổ Trượt Chính Xác (Sliding Window Log Rate Limiter)
-- Khắc phục triệt để lỗi "gấp đôi lưu lượng ở ranh giới phút" của Fixed Window
--   KEYS[1] = "rl:sw:{user_42}:api_checkout"
--   ARGV[1] = now_ms, ARGV[2] = window_ms, ARGV[3] = max_requests, ARGV[4] = req_id
-- ============================================================================

local key = KEYS[1]
local now_ms = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local max_requests = tonumber(ARGV[3])
local req_id = ARGV[4]

local window_start = now_ms - window_ms

-- 1. Quét sạch mọi dấu vết request đã rơi ra ngoài cửa sổ trượt [now_ms - window_ms, now_ms]
redis.call("ZREMRANGEBYSCORE", key, "-inf", window_start)

-- 2. Đếm số lượng request hợp lệ đang nằm trong cửa sổ hiện tại
local current_count = redis.call("ZCARD", key)

if current_count >= max_requests then
  -- Tìm phần tử cũ nhất trong cửa sổ để tính chính xác số mili-giây Retry-After cho client
  local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
  local retry_after_ms = window_ms
  if oldest and #oldest >= 2 then
    retry_after_ms = math.max(1, tonumber(oldest[2]) + window_ms - now_ms)
  end
  return {0, 0, retry_after_ms}
end

-- 3. Ghi nhận request mới (ghép now_ms:req_id để đảm bảo member luôn duy nhất trong ZSet)
redis.call("ZADD", key, now_ms, tostring(now_ms) .. ":" .. req_id)
redis.call("PEXPIRE", key, window_ms + 1000)

local remaining = max_requests - current_count - 1
return {1, remaining, 0}

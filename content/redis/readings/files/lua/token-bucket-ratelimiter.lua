-- ============================================================================
-- Thuật Toán Xô Thẻ Bài (Token Bucket Rate Limiter) Tiết Kiệm RAM O(1) Bằng Hash
-- Cho phép hấp thụ đỉnh lưu lượng ngắn hạn (burst) nhưng vẫn giữ tốc độ trung bình ổn định
--   KEYS[1] = "rl:tb:{tenant_9}"
--   ARGV[1] = capacity (sức chứa xô), ARGV[2] = refill_per_sec, ARGV[3] = now_ms, ARGV[4] = cost
-- ============================================================================

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_per_sec = tonumber(ARGV[2])
local now_ms = tonumber(ARGV[3])
local cost = tonumber(ARGV[4] or "1")

local state = redis.call("HMGET", key, "tokens", "last_ms")
local tokens = tonumber(state[1])
local last_ms = tonumber(state[2])

if tokens == nil or last_ms == nil then
  tokens = capacity
  last_ms = now_ms
else
  -- Bơm thêm token tương ứng với khoảng thời gian đã trôi qua kể từ lần gọi trước
  local elapsed_sec = math.max(0, now_ms - last_ms) / 1000.0
  tokens = math.min(capacity, tokens + (elapsed_sec * refill_per_sec))
  last_ms = now_ms
end

local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end

-- Tự động tính TTL để dọn sạch các xô đã đầy hoàn toàn không còn ai gọi tới
local ttl_sec = math.ceil((capacity / refill_per_sec) * 2) + 10
redis.call("HSET", key, "tokens", tostring(tokens), "last_ms", tostring(last_ms))
redis.call("EXPIRE", key, ttl_sec)

return {allowed, math.floor(tokens)}

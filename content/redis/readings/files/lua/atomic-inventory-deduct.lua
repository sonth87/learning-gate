-- ============================================================================
-- Kịch Bản Lua Trừ Tồn Kho Flash-Sale Nguyên Tử & Chống Mua Lặp Trên Mỗi User
-- Lưu ý Redis Cluster: Cả KEYS[1] và KEYS[2] PHẢI dùng chung HashTag, ví dụ:
--   KEYS[1] = "flash:{sku_99}:stock"
--   KEYS[2] = "flash:{sku_99}:buyers"
--   ARGV[1] = user_id, ARGV[2] = requested_qty
-- ============================================================================

local stock_key = KEYS[1]
local buyers_key = KEYS[2]
local user_id = ARGV[1]
local qty = tonumber(ARGV[2])

if not qty or qty <= 0 then
  return {-3, "INVALID_QTY"}
end

-- 1. Kiểm tra xem người dùng đã săn thành công sản phẩm giới hạn này chưa
if redis.call("SISMEMBER", buyers_key, user_id) == 1 then
  return {-2, "ALREADY_PURCHASED"}
end

-- 2. Đọc tồn kho hiện tại ngay trong Main Thread (không lệnh nào chen ngang được)
local current_stock = tonumber(redis.call("GET", stock_key) or "-1")
if current_stock < 0 then
  return {-4, "SKU_NOT_INITIALIZED"}
end
if current_stock < qty then
  return {0, current_stock}
end

-- 3. Trừ kho và ghi nhận người mua trong cùng một giao tác Lua nguyên tử
local remaining = redis.call("DECRBY", stock_key, qty)
redis.call("SADD", buyers_key, user_id)
return {1, remaining}

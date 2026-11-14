// ============================================================================
// [ANTI-PATTERN / BUGGY] Lỗi Đua Tranh TOCTOU Khi Tách Rời GET và DECRBY Ở Ứng Dụng
// Kịch bản thảm họa Flash Sale: Kho chỉ còn 1 chiếc iPhone nhưng bán lố (oversell) cho 8 người!
// ============================================================================

import Redis from "ioredis";

export async function deductFlashSaleStockBuggy(
  redis: Redis,
  skuKey: string,
  qty: number,
): Promise<boolean> {
  // BƯỚC 1: Đọc tồn kho từ Redis về bộ nhớ của Node.js pod
  const rawStock = await redis.get(skuKey);
  const currentStock = Number(rawStock ?? 0);

  // [CỬA SỔ ĐUA TRANH CHẾT NGƯỜI - TOCTOU RACE WINDOW (0.5ms - 5ms)]
  // Giả sử currentStock === 1. Cùng mili-giây đó, 8 Pod API khác nhau đều gọi redis.get()
  // và CẢ 8 POD đều nhìn thấy currentStock === 1 >= 1 -> Cả 8 cùng lọt qua câu lệnh if dưới đây!
  if (currentStock < qty) {
    return false;
  }

  // BƯỚC 2: Cả 8 Pod lần lượt bắn lệnh DECRBY -> Tồn kho bị trừ âm xuống -7!
  // Dù bản thân mỗi lệnh GET và DECRBY là nguyên tử, khoảng hở mạng giữa chúng KHÔNG nguyên tử!
  await redis.decrby(skuKey, qty);
  return true;
}

// CÁCH SỬA ĐÚNG: Gộp bước kiểm tra (GET >= qty) và bước trừ (DECRBY) vào chung 1 Lua Script
// chạy không thể chia cắt ngay bên trong Main Thread của Redis (xem atomic-inventory-deduct.lua).

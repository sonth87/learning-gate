// ============================================================================
// [ANTI-PATTERN / BUGGY] Hai Lỗi Kinh Điển Làm Nổ Tung RAM Khi Dùng Redis Streams
// 1. XADD không có MAXLEN / MINID -> Nhật ký phình vô hạn theo thời gian
// 2. XREADGROUP quên gọi XACK -> Bảng PEL giữ rò rỉ bộ nhớ vĩnh viễn!
// ============================================================================

import Redis from "ioredis";

export async function publishAndConsumeStreamBuggy(redis: Redis): Promise<void> {
  // LỖI 1: Không truyền MAXLEN ~ N!
  // Khác với List (RPOP lấy ra là mất), XADD là nhật ký chỉ-ghi-thêm (Append-Only Log).
  // Sau 1 tuần chạy 5,000 msg/s, luồng này nuốt trọn hàng chục GB RAM!
  await redis.xadd(
    "stream:telemetry",
    "*",
    "device",
    "sensor_88",
    "payload",
    JSON.stringify({ temp: 36.7, ts: Date.now() }),
  );

  // LỖI 2: Đọc thông qua Consumer Group nhưng KHÔNG BAO GIỜ gọi redis.xack(...)!
  const records = await redis.xreadgroup(
    "GROUP",
    "cg_analytics",
    "worker_leak_1",
    "COUNT",
    50,
    "BLOCK",
    1000,
    "STREAMS",
    "stream:telemetry",
    ">",
  );

  if (records) {
    for (const [, messages] of records as Array<[string, Array<[string, string[]]>]>) {
      for (const [id] of messages) {
        console.log("Processed telemetry id:", id);
        // THIẾU: await redis.xack("stream:telemetry", "cg_analytics", id);
        // Mỗi bản ghi chưa XACK sẽ treo vĩnh viễn trong cấu trúc Radix Tree của PEL!
      }
    }
  }
}

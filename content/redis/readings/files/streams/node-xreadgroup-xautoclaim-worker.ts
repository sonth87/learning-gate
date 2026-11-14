// ============================================================================
// Worker Tiêu Thụ Redis Streams Kèm Cơ Chế Tự Cứu Hộ XAUTOCLAIM & Chuyển Tuyến DLQ
// Đảm bảo không kẹt thông điệp mồ côi khi Pod bị Kubernetes OOMKill hoặc Evict
// ============================================================================

import Redis from "ioredis";

const STREAM_KEY = "stream:orders";
const DLQ_KEY = "stream:orders:dlq";
const GROUP = "cg_payment";
const MAX_DELIVERIES = 5;

export async function reclaimStuckMessages(
  redis: Redis,
  consumerName: string,
  processOrder: (fields: string[]) => Promise<void>,
): Promise<void> {
  // Thu hồi các bản ghi nằm im trong PEL quá 45 giây chưa được XACK
  const res = (await redis.call(
    "XAUTOCLAIM",
    STREAM_KEY,
    GROUP,
    consumerName,
    "45000",
    "0-0",
    "COUNT",
    "10",
  )) as [string, Array<[string, string[]]>];

  const claimedEntries = res[1] ?? [];
  for (const [id, fields] of claimedEntries) {
    // Kiểm tra số lần giao lại (delivery count) qua XPENDING để phát hiện Poison Pill
    const pendingInfo = (await redis.call(
      "XPENDING",
      STREAM_KEY,
      GROUP,
      id,
      id,
      "1",
    )) as Array<[string, string, number, number]>;
    const deliveries = pendingInfo[0]?.[3] ?? 1;

    if (deliveries > MAX_DELIVERIES) {
      await redis.xadd(DLQ_KEY, "MAXLEN", "~", "10000", "*", "orig_id", id, ...fields);
      await redis.xack(STREAM_KEY, GROUP, id);
      continue;
    }

    await processOrder(fields);
    await redis.xack(STREAM_KEY, GROUP, id);
  }
}

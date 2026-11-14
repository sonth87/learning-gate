// ============================================================================
// Cache-Aside Chuẩn Thực Chiến: Chống Bão Cache Stampede (Singleflight) + TTL Jitter
// Đảm bảo khi khóa nóng hết hạn, chỉ ĐÚNG 1 truy vấn chạm xuống PostgreSQL!
// ============================================================================

import Redis from "ioredis";

// Bản đồ gộp các Promise đang bay ngay trong tiến trình Node.js (In-Process Coalescing)
const inflightRequests = new Map<string, Promise<unknown>>();
const NULL_SENTINEL = "__CACHE_NULL__";

function computeJitteredTtl(baseSeconds: number, jitterRatio = 0.15): number {
  const delta = Math.floor(baseSeconds * jitterRatio * Math.random());
  return baseSeconds + delta; // Phân tán thời điểm hết hạn chống Cache Avalanche!
}

export async function getOrLoadWithShield<T>(
  redis: Redis,
  cacheKey: string,
  baseTtlSec: number,
  dbLoader: () => Promise<T | null>,
): Promise<T | null> {
  const cached = await redis.get(cacheKey);
  if (cached === NULL_SENTINEL) return null;
  if (cached !== null) return JSON.parse(cached) as T;

  const existingPromise = inflightRequests.get(cacheKey) as Promise<T | null> | undefined;
  if (existingPromise) {
    return existingPromise; // 999 request đến sau dùng chung kết quả của request đầu tiên!
  }

  const loadPromise = (async (): Promise<T | null> => {
    try {
      const fresh = await dbLoader();
      if (fresh === null) {
        // Cache tạm giá trị rỗng 60s để chặn đứng tấn công Cache Penetration
        await redis.set(cacheKey, NULL_SENTINEL, "EX", 60);
        return null;
      }
      await redis.set(cacheKey, JSON.stringify(fresh), "EX", computeJitteredTtl(baseTtlSec));
      return fresh;
    } finally {
      inflightRequests.delete(cacheKey);
    }
  })();

  inflightRequests.set(cacheKey, loadPromise);
  return loadPromise;
}

// ============================================================================
// Lá Chắn Kép Chống Tấn Công Xuyên Thủng Cache (Cache Penetration Guard)
// Lớp 1: Redis 8 Native Bloom Filter (BF.EXISTS) · Lớp 2: Short-TTL Null Sentinel
// ============================================================================

import Redis from "ioredis";

const BLOOM_KEY = "bf:catalog:product_ids";
const NULL_MARKER = "__NOT_FOUND__";

export interface ProductRecord {
  id: string;
  name: string;
  priceVnd: number;
}

export async function getProductWithBloomGuard(
  redis: Redis,
  productId: string,
  querySqlById: (id: string) => Promise<ProductRecord | null>,
): Promise<ProductRecord | null> {
  // Lớp 1: Hỏi bộ lọc Bloom trong 0.1ms. Nếu trả về 0 -> Chắc chắn 100% ID rác!
  const maybeExists = (await redis.call("BF.EXISTS", BLOOM_KEY, productId)) as number;
  if (maybeExists === 0) {
    return null; // Chặn đứng hoàn toàn trước khi tạo tải lên Redis String & SQL!
  }

  // Lớp 2: Tra cứu khóa Cache thông thường
  const cacheKey = `catalog:prod:${productId}`;
  const cached = await redis.get(cacheKey);
  if (cached === NULL_MARKER) return null;
  if (cached !== null) return JSON.parse(cached) as ProductRecord;

  // Lớp 3: ~0.5% False Positive của Bloom Filter lọt xuống SQL -> Ghi lại Null Sentinel 45s
  const row = await querySqlById(productId);
  if (!row) {
    await redis.set(cacheKey, NULL_MARKER, "EX", 45);
    return null;
  }

  await redis.set(cacheKey, JSON.stringify(row), "EX", 1800 + Math.floor(Math.random() * 300));
  return row;
}

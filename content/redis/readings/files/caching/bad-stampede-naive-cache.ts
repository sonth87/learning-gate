// ============================================================================
// [ANTI-PATTERN / BUGGY] Ba Lỗi Cache Ngây Thơ Đánh Sập Cơ Sở Dữ Liệu Giờ Cao Điểm
// Hậu quả: Vừa dính Cache Stampede, vừa dính Penetration, vừa dính Avalanche!
// ============================================================================

import Redis from "ioredis";

export async function getCampaignBannerNaiveBuggy(
  redis: Redis,
  campaignId: string,
  queryHeavySql: (id: string) => Promise<Record<string, unknown> | null>,
): Promise<Record<string, unknown> | null> {
  const key = `campaign:banner:${campaignId}`;
  const raw = await redis.get(key);
  if (raw) {
    return JSON.parse(raw) as Record<string, unknown>;
  }

  // LỖI 1 (Cache Stampede): Không có Singleflight hay Mutex Lock!
  // Khi khóa banner trang chủ hết hạn đúng 12:00:00, 15,000 request đồng thời cùng thấy null
  // và cả 15,000 request lao thẳng xuống chạy câu lệnh JOIN nặng trong PostgreSQL!
  const record = await queryHeavySql(campaignId);

  // LỖI 2 (Cache Penetration): Nếu kẻ tấn công truyền campaignId = "-99999" không tồn tại,
  // hàm trả về null ngay mà không lưu Null Sentinel hay kiểm tra Bloom Filter -> SQL chịu trận 100%!
  if (!record) {
    return null;
  }

  // LỖI 3 (Cache Avalanche): Cố định cứng TTL = 3600s cho toàn bộ danh mục nạp cùng lúc,
  // khiến hàng vạn khóa đồng loạt hết hạn ở cùng một giây tròn giờ tiếp theo!
  await redis.set(key, JSON.stringify(record), "EX", 3600);
  return record;
}

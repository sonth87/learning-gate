// ============================================================================
// Mẫu Singleton Connection Client cho Node.js / TypeScript với ioredis
// Tránh lỗi tạo kết nối mới mỗi HTTP request gây cạn kiệt maxclients!
// ============================================================================

import Redis, { RedisOptions } from "ioredis";

const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  username: process.env.REDIS_ACL_USER ?? "app_svc",
  password: process.env.REDIS_ACL_PASS,
  // Bật giao thức RESP3 để nhận kiểu dữ liệu Map/Set/Double chuẩn xác
  protocol: 3,
  // Gom tự động các lệnh phát ra trong cùng một tick của Node Event Loop
  enableAutoPipelining: true,
  maxRetriesPerRequest: 2,
  connectTimeout: 3000,
  commandTimeout: 1500,
  keepAlive: 30000,
  // Chiến lược backoff mũ có trần 2 giây + jitter chống bão kết nối lại
  retryStrategy(times: number): number | null {
    if (times > 15) {
      return null; // Ngừng thử lại và ném lỗi để Circuit Breaker xử lý
    }
    const baseDelay = Math.min(times * 100, 2000);
    const jitter = Math.floor(Math.random() * 150);
    return baseDelay + jitter;
  },
};

export const redisClient = new Redis(redisConfig);

redisClient.on("error", (err: Error) => {
  console.error("[redis] Socket error:", err.message);
});

// Đóng kết nối êm ái (graceful shutdown) khi nhận tín hiệu SIGTERM từ Kubernetes
export async function closeRedisGracefully(): Promise<void> {
  await redisClient.quit(); // Chờ các lệnh đang bay hoàn tất rồi mới đóng TCP
}

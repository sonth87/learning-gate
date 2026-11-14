// ============================================================================
// Bộ Lập Lịch Tác Vụ Trễ (Delayed Job Scheduler) Bằng ZSet + Atomic Lua Claim
// Dùng Unix Timestamp (ms) làm Score: tự động hủy đơn hàng chưa thanh toán sau 15 phút
// ============================================================================

import Redis from "ioredis";

// Script Lua lấy tối đa N job đã đến hạn (score <= nowMs) và xóa khỏi ZSet nguyên tử
// Ngăn tuyệt đối việc 2 worker cùng nhặt trúng 1 đơn hàng!
const CLAIM_DUE_JOBS_LUA = `
  local due = redis.call('ZRANGE', KEYS[1], '-inf', ARGV[1], 'BYSCORE', 'LIMIT', 0, tonumber(ARGV[2]))
  if #due > 0 then
    redis.call('ZREM', KEYS[1], unpack(due))
  end
  return due
`;

export class DelayedJobQueue {
  constructor(
    private readonly redis: Redis,
    private readonly zsetKey = "jobs:delayed:order_expire",
  ) {}

  async schedule(jobPayload: string, delayMs: number): Promise<void> {
    const runAtMs = Date.now() + delayMs;
    await this.redis.zadd(this.zsetKey, runAtMs.toString(), jobPayload);
  }

  async pollDueJobs(batchSize = 25): Promise<string[]> {
    const nowMs = Date.now().toString();
    const claimed = await this.redis.eval(
      CLAIM_DUE_JOBS_LUA,
      1,
      this.zsetKey,
      nowMs,
      batchSize.toString(),
    );
    return Array.isArray(claimed) ? (claimed as string[]) : [];
  }
}

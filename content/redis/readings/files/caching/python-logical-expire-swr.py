# ============================================================================
# Kỹ Thuật Logical Expiration (Stale-While-Revalidate) Cho Khóa Siêu Nóng (HotKey)
# Độ trễ đọc luôn ~0.2ms (không bao giờ đợi DB); chỉ 1 luồng nền âm thầm làm mới!
# ============================================================================

import asyncio
import json
import time
import uuid
import redis.asyncio as redis

UNLOCK_LUA = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
"""


async def get_hotkey_swr(
    r: redis.Redis,
    key: str,
    logical_ttl_sec: int,
    fetch_db_coro,
) -> dict | None:
    raw = await r.get(key)
    if raw is None:
        return None  # Khóa siêu nóng được warm-up sẵn trước chiến dịch

    envelope = json.loads(raw)
    if time.time() <= envelope["logical_exp"]:
        return envelope["data"]  # Dữ liệu còn tươi -> Trả ngay lập tức!

    # Đã quá hạn mềm (logical_exp), nhưng TTL vật lý vẫn còn dài -> Trả bản cũ ngay,
    # đồng thời thử chiếm khóa mutex để 1 task nền duy nhất nạp lại từ SQL!
    lock_key = f"lock:swr:{key}"
    owner_id = str(uuid.uuid4())
    acquired = await r.set(lock_key, owner_id, nx=True, px=5000)

    if acquired:
        async def _refresh_in_background():
            try:
                fresh = await fetch_db_coro()
                payload = {"data": fresh, "logical_exp": time.time() + logical_ttl_sec}
                await r.set(key, json.dumps(payload), ex=logical_ttl_sec * 10)
            finally:
                await r.eval(UNLOCK_LUA, 1, lock_key, owner_id)

        asyncio.create_task(_refresh_in_background())

    return envelope["data"]

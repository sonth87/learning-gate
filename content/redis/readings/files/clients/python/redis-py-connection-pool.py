# ============================================================================
# Quản lý Async ConnectionPool chuẩn Production cho FastAPI / Python (redis-py)
# Yêu cầu: pip install "redis[hiredis]>=5.2.0" (C parser tăng tốc giải mã RESP3)
# ============================================================================

import os
from contextlib import asynccontextmanager
import redis.asyncio as redis
from redis.backoff import ExponentialBackoff
from redis.retry import Retry
from redis.exceptions import BusyLoadingError, ConnectionError, TimeoutError


def build_redis_pool() -> redis.BlockingConnectionPool:
    """Khởi tạo một BlockingConnectionPool dùng chung cho toàn bộ worker."""
    retry_policy = Retry(
        backoff=ExponentialBackoff(cap=1.5, base=0.05),
        retries=2,
    )
    return redis.BlockingConnectionPool.from_url(
        os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0"),
        protocol=3,
        decode_responses=True,
        max_connections=50,
        timeout=2.0,  # Chờ tối đa 2s nếu toàn bộ 50 socket đang bận
        socket_connect_timeout=1.5,
        socket_timeout=1.0,
        health_check_interval=30,
        retry=retry_policy,
        retry_on_error=[BusyLoadingError, ConnectionError, TimeoutError],
    )


@asynccontextmanager
async def lifespan_redis(app):
    pool = build_redis_pool()
    client = redis.Redis(connection_pool=pool)
    await client.ping()
    app.state.redis = client
    try:
        yield
    finally:
        # Giải phóng toàn bộ socket trả về OS khi tắt tiến trình Uvicorn
        await client.aclose()
        await pool.disconnect()

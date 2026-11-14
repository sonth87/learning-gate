# ============================================================================
# Dọn Dẹp Khóa Lô Lớn Không Gây Nghẽn bằng SCAN Cursor + Pipeline UNLINK
# An toàn chạy ngay trong giờ cao điểm trên tập dữ liệu hàng chục triệu khóa
# ============================================================================

import os
import time
import redis


def cleanup_legacy_keys(
    client: redis.Redis,
    pattern: str = "legacy:temp:*",
    scan_count: int = 300,
    sleep_sec: float = 0.01,
) -> int:
    cursor = 0
    total_unlinked = 0

    while True:
        # SCAN chỉ lấy một lát cắt nhỏ (~300 bucket) mỗi vòng lặp -> Không chặn Main Thread
        cursor, keys = client.scan(cursor=cursor, match=pattern, count=scan_count)

        if keys:
            # Gom toàn bộ lệnh UNLINK vào 1 chuyến mạng (Pipeline) + giải phóng RAM bất đồng bộ
            pipe = client.pipeline(transaction=False)
            for key in keys:
                pipe.unlink(key)
            results = pipe.execute()
            total_unlinked += sum(int(r) for r in results)

        if cursor == 0:
            break

        # Nhường nhịp thở 10ms giữa các lô cho lưu lượng thực của người dùng
        time.sleep(sleep_sec)

    return total_unlinked


if __name__ == "__main__":
    r = redis.from_url(os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0"), decode_responses=True)
    removed = cleanup_legacy_keys(r)
    print(f"Unlinked safely: {removed} keys")

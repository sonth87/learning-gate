#!/usr/bin/env bash
# ============================================================================
# Kịch Bản Chẩn Đoán Nhanh Sự Cố Độ Trễ Redis Production Trong 60 Giây (SRE Playbook)
# LƯU Ý SỐNG CÒN: Kịch bản này KHÔNG BAO GIỜ gọi KEYS * hay MONITOR (tránh làm sập thêm nút!)
# Cách dùng: REDISCLI_AUTH="$REDIS_ADMIN_PASS" ./ops/redis-sre-diagnostic-playbook.sh 10.20.4.25 6379
# ============================================================================
set -euo pipefail

HOST="${1:-127.0.0.1}"
PORT="${2:-6379}"
USER_NAME="${REDIS_ACL_USER:-sre_breakglass}"
CLI=(redis-cli -h "$HOST" -p "$PORT" --user "$USER_NAME" --no-auth-warning)

echo "=== [1/5] TỔNG QUAN THÔNG LƯỢNG, BỘ NHỚ & TỶ LỆ CACHE HIT ==="
"${CLI[@]}" INFO server memory stats clients replication | grep -E \
  "redis_version|uptime_in_seconds|connected_clients|blocked_clients|used_memory_human|used_memory_rss_human|mem_fragmentation_ratio|maxmemory_human|maxmemory_policy|instantaneous_ops_per_sec|keyspace_hits|keyspace_misses|evicted_keys|rejected_connections|role|master_link_status|latest_fork_usec"

echo ""
echo "=== [2/5] 15 LỆNH CHẬM NHẤT TRÊN MAIN THREAD (SLOWLOG) ==="
"${CLI[@]}" SLOWLOG GET 15

echo ""
echo "=== [3/5] CHẨN ĐOÁN ĐỘ TRỄ TỰ ĐỘNG (LATENCY DOCTOR & MEMORY STATS) ==="
"${CLI[@]}" LATENCY DOCTOR
"${CLI[@]}" MEMORY DOCTOR

echo ""
echo "=== [4/5] KIỂM TRA CÁC KẾT NỐI ĐANG CHIẾM CLIENT OUTPUT BUFFER LỚN ==="
"${CLI[@]}" CLIENT LIST | awk '{for(i=1;i<=NF;i++) if($i ~ /^omem=|^cmd=|^addr=|^age=/) printf "%s ", $i; print ""}' | head -n 15

echo ""
echo "=== [5/5] DÒ TÌM KHÓA PHÌNH TO (BIGKEYS) VỚI NHỊP NGHỈ AN TOÀN 20ms ==="
"${CLI[@]}" --bigkeys -i 0.02

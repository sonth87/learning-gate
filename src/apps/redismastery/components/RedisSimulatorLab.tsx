import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Flame,
  HardDrive,
  Network,
  Play,
  RotateCcw,
  ShieldAlert,
  Terminal,
  Zap,
} from 'lucide-react';
import {
  crc16RedisSlot,
  createRedisRuntime,
  executeRedisCommand,
  extractRedisHashTag,
  parseRedisScriptCommands,
  type RedisEntry,
  type RedisRuntime,
} from '@/features/devops-course/engine/redisCliEngine';
import { useRedisStore } from '../store/useRedisStore';
import type { RedisEvictionPolicy, RedisSimMode } from '../types/redis.types';
import { cn } from '@/utils/cn';

/* ============================================================================
 * MODE 1: Memory & 8 Eviction Policies Sandbox
 * ============================================================================ */

interface SimSlotItem {
  key: string;
  sizeMb: number;
  hasTtl: boolean;
  ttlSec: number | null;
  freq: number;
  lastTouchTick: number;
  kind: 'cache' | 'session' | 'hot';
}

const EVICTION_POLICIES: { id: RedisEvictionPolicy; label: string; desc: string }[] = [
  {
    id: 'allkeys-lfu',
    label: 'allkeys-lfu (Khuyên dùng Cache)',
    desc: 'Thu hồi key có tần suất truy cập (LFU freq) thấp nhất trên toàn bộ keyspace — bảo vệ hot key cực tốt.',
  },
  {
    id: 'allkeys-lru',
    label: 'allkeys-lru',
    desc: 'Thu hồi key lâu nhất chưa được chạm tới (idle cao nhất) trên toàn bộ keyspace.',
  },
  {
    id: 'noeviction',
    label: 'noeviction (Mặc định · Queue/Lock)',
    desc: 'Không bao giờ xóa key! Khi chạm trần maxmemory, mọi lệnh ghi mới bị trả lỗi OOM.',
  },
  {
    id: 'volatile-lfu',
    label: 'volatile-lfu',
    desc: 'Chỉ thu hồi trong nhóm key CÓ gắn TTL dựa theo tần suất LFU thấp nhất.',
  },
  {
    id: 'volatile-lru',
    label: 'volatile-lru',
    desc: 'Chỉ thu hồi trong nhóm key CÓ gắn TTL dựa theo thời gian nhàn rỗi LRU lâu nhất.',
  },
  {
    id: 'volatile-ttl',
    label: 'volatile-ttl',
    desc: 'Chỉ thu hồi trong nhóm key CÓ gắn TTL, ưu tiên xóa key sắp hết hạn sớm nhất (TTL nhỏ nhất).',
  },
  {
    id: 'allkeys-random',
    label: 'allkeys-random',
    desc: 'Xóa ngẫu nhiên bất kỳ key nào khi đầy RAM.',
  },
  {
    id: 'volatile-random',
    label: 'volatile-random',
    desc: 'Xóa ngẫu nhiên một key trong nhóm có gắn TTL.',
  },
];

const INITIAL_MEM_SLOTS: SimSlotItem[] = [
  { key: 'cache:home:hero', sizeMb: 16, hasTtl: true, ttlSec: 280, freq: 18, lastTouchTick: 5, kind: 'hot' },
  { key: 'cache:product:99', sizeMb: 16, hasTtl: true, ttlSec: 240, freq: 24, lastTouchTick: 6, kind: 'hot' },
  { key: 'catalog:legacy:v1', sizeMb: 16, hasTtl: false, ttlSec: null, freq: 2, lastTouchTick: 1, kind: 'cache' },
  { key: 'session:u1042', sizeMb: 16, hasTtl: true, ttlSec: 90, freq: 5, lastTouchTick: 3, kind: 'session' },
  { key: 'cache:blog:old-2023', sizeMb: 16, hasTtl: false, ttlSec: null, freq: 1, lastTouchTick: 2, kind: 'cache' },
];

function pickVictim(items: SimSlotItem[], policy: RedisEvictionPolicy, tick: number): SimSlotItem | null {
  if (policy === 'noeviction' || items.length === 0) return null;
  const pool = policy.startsWith('volatile-') ? items.filter((i) => i.hasTtl) : [...items];
  if (pool.length === 0) return null;

  if (policy.endsWith('-lru')) {
    return pool.reduce((worst, cur) => (cur.lastTouchTick < worst.lastTouchTick ? cur : worst), pool[0]);
  }
  if (policy.endsWith('-lfu')) {
    return pool.reduce((worst, cur) => (cur.freq < worst.freq ? cur : worst), pool[0]);
  }
  if (policy === 'volatile-ttl') {
    return pool.reduce(
      (worst, cur) => ((cur.ttlSec ?? 999999) < (worst.ttlSec ?? 999999) ? cur : worst),
      pool[0]
    );
  }
  return pool[tick % pool.length];
}

const MemoryEvictionSandbox: React.FC = () => {
  const [maxMemMb, setMaxMemMb] = useState(96);
  const [policy, setPolicy] = useState<RedisEvictionPolicy>('allkeys-lfu');
  const [items, setItems] = useState<SimSlotItem[]>(INITIAL_MEM_SLOTS);
  const [tick, setTick] = useState(10);
  const [hits, setHits] = useState(28);
  const [misses, setMisses] = useState(4);
  const [evictedCount, setEvictedCount] = useState(0);
  const [oomCount, setOomCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<string>(
    'Sẵn sàng: Thử ghi thêm key khi RAM chạm trần để quan sát sự khác biệt giữa noeviction, volatile-lru và allkeys-lfu!'
  );

  const usedMb = items.reduce((acc, i) => acc + i.sizeMb, 0);
  const usedPct = Math.min(100, Math.round((usedMb / maxMemMb) * 100));
  const hitRatio = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : '100.0';

  const insertKey = (newItem: SimSlotItem) => {
    const nextTick = tick + 1;
    setTick(nextTick);
    let working = [...items];
    const evictedNames: string[] = [];

    while (working.reduce((s, x) => s + x.sizeMb, 0) + newItem.sizeMb > maxMemMb) {
      const victim = pickVictim(working, policy, nextTick);
      if (!victim) {
        setOomCount((c) => c + 1);
        setLastEvent(
          `LỖI OOM! (policy=${policy}): Không thể thu hồi bộ nhớ cho "${newItem.key}" — Redis trả lỗi "OOM command not allowed when used memory > maxmemory"!`
        );
        return;
      }
      evictedNames.push(`${victim.key} (freq=${victim.freq}, idle=${nextTick - victim.lastTouchTick})`);
      working = working.filter((x) => x.key !== victim.key);
    }

    working.push({ ...newItem, lastTouchTick: nextTick });
    setItems(working);
    if (evictedNames.length > 0) {
      setEvictedCount((c) => c + evictedNames.length);
      setLastEvent(`Đã ghi "${newItem.key}" · Evict (${policy}): ${evictedNames.join(', ')}`);
    } else {
      setLastEvent(`Đã ghi "${newItem.key}" vào RAM (${usedMb + newItem.sizeMb}/${maxMemMb} MB).`);
    }
  };

  const readHotKeys = () => {
    const nextTick = tick + 1;
    setTick(nextTick);
    let localHits = 0;
    let localMiss = 0;
    const updated = items.map((it) => {
      if (it.kind === 'hot') {
        localHits += 1;
        return { ...it, freq: it.freq + 5, lastTouchTick: nextTick };
      }
      return it;
    });
    if (localHits === 0) localMiss = 2;
    setItems(updated);
    setHits((h) => h + localHits);
    setMisses((m) => m + localMiss);
    setLastEvent(
      localHits > 0
        ? `Traffic đọc Hot Keys: +${localHits} Cache HIT! Bộ đếm tần suất LFU của hot keys vừa tăng vọt.`
        : 'Cảnh báo: Các Hot Keys đã bị evict mất trước đó -> Cache MISS đập xuống Database!'
    );
  };

  const resetSim = () => {
    setItems(INITIAL_MEM_SLOTS);
    setTick(10);
    setHits(28);
    setMisses(4);
    setEvictedCount(0);
    setOomCount(0);
    setLastEvent('Đã khôi phục trạng thái bộ nhớ mặc định.');
  };

  const activePolicyMeta = EVICTION_POLICIES.find((p) => p.id === policy)!;

  return (
    <div className="space-y-4">
      {/* Top Config Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/85 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-rose-300">
              Chính sách thu hồi (maxmemory-policy)
            </label>
            <button
              type="button"
              onClick={resetSim}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Đặt lại</span>
            </button>
          </div>

          <select
            value={policy}
            onChange={(e) => setPolicy(e.target.value as RedisEvictionPolicy)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs sm:text-sm font-mono font-bold text-white focus:border-rose-500 focus:outline-none"
          >
            {EVICTION_POLICIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400">{activePolicyMeta.desc}</p>

          <div className="pt-1">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Giới hạn maxmemory: {maxMemMb} MB</span>
              <span>
                Đang dùng: {usedMb} MB ({usedPct}%)
              </span>
            </div>
            <input
              type="range"
              min={64}
              max={160}
              step={16}
              value={maxMemMb}
              onChange={(e) => setMaxMemMb(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-3.5">
            <div className="text-[11px] text-slate-400">Cache Hit Ratio</div>
            <div className="mt-1 font-mono text-xl font-extrabold text-emerald-300">{hitRatio}%</div>
            <div className="text-[10px] font-mono text-slate-400">
              hits={hits} · misses={misses}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-3.5">
            <div className="text-[11px] text-slate-400">Evicted / Lỗi OOM</div>
            <div className="mt-1 font-mono text-xl font-extrabold text-amber-300">
              {evictedCount} / <span className="text-rose-400">{oomCount}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">evicted_keys / OOM</div>
          </div>
          <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 flex items-start gap-2">
            <Activity className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{lastEvent}</span>
          </div>
        </div>
      </div>

      {/* Workload Trigger Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            insertKey({
              key: `scan:cold:${tick}`,
              sizeMb: 16,
              hasTtl: false,
              ttlSec: null,
              freq: 1,
              lastTouchTick: tick,
              kind: 'cache',
            })
          }
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
        >
          <HardDrive className="h-3.5 w-3.5" />
          <span>+ Ghi Key Lạnh KHÔNG TTL (16MB, freq=1)</span>
        </button>

        <button
          type="button"
          onClick={() =>
            insertKey({
              key: `session:u${1100 + tick}`,
              sizeMb: 16,
              hasTtl: true,
              ttlSec: 120,
              freq: 4,
              lastTouchTick: tick,
              kind: 'session',
            })
          }
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25 cursor-pointer"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>+ Ghi Session CÓ TTL 120s (16MB)</span>
        </button>

        <button
          type="button"
          onClick={readHotKeys}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Đọc Hot Keys (+LFU freq)</span>
        </button>
      </div>

      {/* Visual Memory Slots */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-extrabold text-white">
            Bản đồ Khung nhớ RAM ({items.length} keys · {usedMb}/{maxMemMb} MB)
          </h3>
          <div className="h-2 w-36 rounded-full bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${usedPct}%` }}
              className={cn(
                'h-full transition-all duration-300',
                usedPct >= 95 ? 'bg-rose-500' : usedPct >= 75 ? 'bg-amber-400' : 'bg-emerald-400'
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {items.map((it) => {
            const idle = tick - it.lastTouchTick;
            return (
              <div
                key={it.key}
                className={cn(
                  'rounded-xl border p-3 space-y-1.5',
                  it.kind === 'hot'
                    ? 'border-rose-500/45 bg-rose-500/10'
                    : it.kind === 'session'
                    ? 'border-amber-500/35 bg-amber-500/10'
                    : 'border-slate-800 bg-slate-950/80'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-white truncate">{it.key}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                    {it.sizeMb}MB
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300">
                    LFU freq={it.freq}
                  </span>
                  <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-sky-300">
                    LRU idle={idle}
                  </span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5',
                      it.hasTtl
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    )}
                  >
                    {it.hasTtl ? `TTL=${it.ttlSec}s` : 'TTL=-1 (No Expire)'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * MODE 2: 16384 Hash Slots Ring + {HashTag} + 3M/3R Failover
 * ============================================================================ */

interface ClusterShard {
  id: number;
  startSlot: number;
  endSlot: number;
  masterHost: string;
  replicaHost: string;
  masterDown: boolean;
}

const DEFAULT_SHARDS: ClusterShard[] = [
  { id: 1, startSlot: 0, endSlot: 5460, masterHost: 'redis-m1:6379', replicaHost: 'redis-r1:6380', masterDown: false },
  { id: 2, startSlot: 5461, endSlot: 10922, masterHost: 'redis-m2:6379', replicaHost: 'redis-r2:6380', masterDown: false },
  { id: 3, startSlot: 10923, endSlot: 16383, masterHost: 'redis-m3:6379', replicaHost: 'redis-r3:6380', masterDown: false },
];

const ClusterHashRingSandbox: React.FC = () => {
  const [keyA, setKeyA] = useState('wallet:u100:balance');
  const [keyB, setKeyB] = useState('wallet:u100:history');
  const [shards, setShards] = useState<ClusterShard[]>(DEFAULT_SHARDS);

  const infoA = useMemo(() => {
    const tag = extractRedisHashTag(keyA);
    const slot = crc16RedisSlot(keyA);
    const shard = shards.find((s) => slot >= s.startSlot && slot <= s.endSlot) ?? shards[0];
    return { tag, slot, shard };
  }, [keyA, shards]);

  const infoB = useMemo(() => {
    const tag = extractRedisHashTag(keyB);
    const slot = crc16RedisSlot(keyB);
    const shard = shards.find((s) => slot >= s.startSlot && slot <= s.endSlot) ?? shards[0];
    return { tag, slot, shard };
  }, [keyB, shards]);

  const sameSlot = infoA.slot === infoB.slot;

  const applyHashTagFix = () => {
    setKeyA('wallet:{u100}:balance');
    setKeyB('wallet:{u100}:history');
  };

  const toggleMasterDown = (shardId: number) => {
    setShards((prev) =>
      prev.map((s) => (s.id === shardId ? { ...s, masterDown: !s.masterDown } : s))
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              Máy tính CRC16(key) mod 16384 & Kiểm tra Lỗi CROSSSLOT
            </h3>
            <p className="text-xs text-slate-400">
              Nhập 2 key bất kỳ để xem Redis Cluster định tuyến về Shard nào và liệu lệnh đa key (<code className="font-mono text-rose-300">MGET</code> / <code className="font-mono text-rose-300">EVAL</code>) có hợp lệ hay nổ <code className="font-mono text-amber-300">CROSSSLOT</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={applyHashTagFix}
            className="inline-flex items-center gap-1.5 self-start rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer shrink-0"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Áp dụng mẫu {'{u100}'} HashTag</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
            <label className="text-[11px] font-mono font-bold text-slate-400">KEY[1]</label>
            <input
              type="text"
              value={keyA}
              onChange={(e) => setKeyA(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs sm:text-sm text-white focus:border-rose-500 focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="text-slate-400">
                Chuỗi băm: <strong className="text-amber-300">"{infoA.tag}"</strong>
              </span>
              <span className="rounded bg-rose-500/20 px-2 py-0.5 font-bold text-rose-300">
                Slot #{infoA.slot}
              </span>
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-sky-300">
                Shard #{infoA.shard.id}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
            <label className="text-[11px] font-mono font-bold text-slate-400">KEY[2]</label>
            <input
              type="text"
              value={keyB}
              onChange={(e) => setKeyB(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs sm:text-sm text-white focus:border-rose-500 focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="text-slate-400">
                Chuỗi băm: <strong className="text-amber-300">"{infoB.tag}"</strong>
              </span>
              <span className="rounded bg-rose-500/20 px-2 py-0.5 font-bold text-rose-300">
                Slot #{infoB.slot}
              </span>
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-sky-300">
                Shard #{infoB.shard.id}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-key Verdict Banner */}
        <div
          className={cn(
            'flex items-start gap-2.5 rounded-xl border p-3.5 text-xs sm:text-sm',
            sameSlot
              ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-100'
              : 'border-rose-500/45 bg-rose-500/10 text-rose-100'
          )}
        >
          {sameSlot ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            {sameSlot ? (
              <span>
                <strong>HỢP LỆ CHO MGET / MULTI / LUA EVAL!</strong> Cả 2 key cùng rơi vào{' '}
                <code className="font-mono font-bold">Slot #{infoA.slot}</code> trên{' '}
                <code className="font-mono font-bold">
                  {infoA.shard.masterDown ? `${infoA.shard.replicaHost} (Promoted Master)` : infoA.shard.masterHost}
                </code>
                .
              </span>
            ) : (
              <span>
                <strong>CROSSSLOT Keys in request don't hash to the same slot!</strong>{' '}
                <code className="font-mono">{keyA}</code> ({infoA.slot}) khác slot với{' '}
                <code className="font-mono">{keyB}</code> ({infoB.slot}). Bọc định danh chung trong dấu ngoặc nhọn như{' '}
                <code className="font-mono font-bold">{'{u100}'}</code> để đồng vị trên cùng 1 slot!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3 Shards Topology + Failover Simulation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {shards.map((sh) => {
          const hitA = infoA.shard.id === sh.id;
          const hitB = infoB.shard.id === sh.id;
          return (
            <div
              key={sh.id}
              className={cn(
                'rounded-2xl border p-4 space-y-3 transition-all',
                hitA || hitB
                  ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/5'
                  : 'border-slate-800 bg-slate-900/80'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-white">
                  SHARD #{sh.id}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-0.5 font-mono text-[10px] text-rose-300">
                  Slots {sh.startSlot} – {sh.endSlot}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-2.5 py-2',
                    sh.masterDown
                      ? 'border-rose-500/40 bg-rose-950/40 text-rose-300 line-through'
                      : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                  )}
                >
                  <span>Master: {sh.masterHost}</span>
                  <span>{sh.masterDown ? 'FAIL' : 'PRIMARY'}</span>
                </div>

                <div
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-2.5 py-2',
                    sh.masterDown
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-200 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  )}
                >
                  <span>Replica: {sh.replicaHost}</span>
                  <span>{sh.masterDown ? 'PROMOTED MASTER!' : 'STANDBY SYNC'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleMasterDown(sh.id)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                {sh.masterDown ? 'Khôi phục Master cũ (Rejoin as Replica)' : 'Giả lập Sập Master (Auto-Failover)'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
 * MODE 3: Live redis-cli REPL + Real-Time Keyspace Inspector
 * ============================================================================ */

const REPL_PRESETS: { label: string; script: string }[] = [
  {
    label: 'Hash + HEXPIRE (Redis 8)',
    script: `HSET cart:u42 sku:macbook 1 sku:mouse 2
HINCRBY cart:u42 sku:mouse 1
HEXPIRE cart:u42 1800 FIELDS 1 sku:mouse
HGETALL cart:u42
HTTL cart:u42 FIELDS 2 sku:macbook sku:mouse`,
  },
  {
    label: 'ZSet Leaderboard',
    script: `ZADD lb:game 1200 "an" 1850 "binh" 1600 "chi"
ZINCRBY lb:game 500 "chi"
ZRANGE lb:game 0 2 REV WITHSCORES`,
  },
  {
    label: 'Streams + PEL + XACK',
    script: `XGROUP CREATE orders:stream billing $ MKSTREAM
XADD orders:stream * orderId 9001 total 350000
XREADGROUP GROUP billing worker-1 COUNT 5 STREAMS orders:stream >
XPENDING orders:stream billing`,
  },
  {
    label: 'Lua Safe Lock Release',
    script: `SET lock:job:1 "uuid-worker-A" NX PX 10000
EVAL "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end" 1 lock:job:1 "uuid-WRONG"
EVAL "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end" 1 lock:job:1 "uuid-worker-A"`,
  },
];

function summarizeEntry(entry: RedisEntry, nowMs: number): { type: string; preview: string; ttlLabel: string } {
  const ttlLabel =
    entry.expiresAtMs === undefined
      ? '-1 (bền vững)'
      : `${Math.max(0, Math.ceil((entry.expiresAtMs - nowMs) / 1000))}s`;
  const d = entry.data;
  if (d.type === 'string') return { type: 'string', preview: JSON.stringify(d.val), ttlLabel };
  if (d.type === 'hash')
    return { type: 'hash', preview: JSON.stringify(Object.fromEntries(d.fields.entries())), ttlLabel };
  if (d.type === 'list') return { type: 'list', preview: JSON.stringify(d.items), ttlLabel };
  if (d.type === 'set') return { type: 'set', preview: JSON.stringify([...d.members]), ttlLabel };
  if (d.type === 'zset')
    return { type: 'zset', preview: JSON.stringify(Object.fromEntries(d.scores.entries())), ttlLabel };
  if (d.type === 'stream')
    return { type: 'stream', preview: `entries=${d.entries.length}, groups=${d.groups.size}`, ttlLabel };
  if (d.type === 'hll') return { type: 'hll', preview: `approx=${d.elements.size}`, ttlLabel };
  if (d.type === 'bloom') return { type: 'bloom', preview: `items=${d.items.size}`, ttlLabel };
  if (d.type === 'bitmap') return { type: 'bitmap', preview: `bits_set=${d.bits.size}`, ttlLabel };
  return { type: 'geo', preview: `points=${d.points.size}`, ttlLabel };
}

const LiveRedisReplLab: React.FC = () => {
  const rtRef = useRef<RedisRuntime>(createRedisRuntime());
  const [input, setInput] = useState('SET greeting "Xin chao Redis 8!" EX 600\nGET greeting\nTTL greeting');
  const [history, setHistory] = useState<{ cmd: string; out: string; isErr: boolean }[]>([]);
  const [, setVersion] = useState(0);

  const runCommands = (rawText: string) => {
    const parsed = parseRedisScriptCommands(rawText);
    if (parsed.length === 0) return;
    const nextLogs: { cmd: string; out: string; isErr: boolean }[] = [];
    for (const item of parsed) {
      const res = executeRedisCommand(rtRef.current, item.args);
      nextLogs.push({
        cmd: item.raw,
        out: res.exitCode === 0 ? res.stdout : res.stderr,
        isErr: res.exitCode !== 0,
      });
    }
    setHistory((prev) => [...prev, ...nextLogs]);
    setVersion((v) => v + 1);
  };

  const resetRepl = () => {
    rtRef.current = createRedisRuntime();
    setHistory([]);
    setVersion((v) => v + 1);
  };

  const entries = [...rtRef.current.store.entries()];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Script / Command Runner */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/85 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 font-mono">
            <Terminal className="h-4 w-4" />
            <span>127.0.0.1:6379&gt; In-Memory Redis 8 VM</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={resetRepl}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>FLUSHALL</span>
            </button>
            <button
              type="button"
              onClick={() => runCommands(input)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Thực thi (Run)</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {REPL_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setInput(p.script)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-rose-500/40 hover:text-rose-200 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        <textarea
          rows={5}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="Nhập một hoặc nhiều lệnh Redis (SET, HSET, HEXPIRE, ZADD, XADD, EVAL, CLUSTER KEYSLOT, ADVANCE_TIME 5000...)"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs sm:text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
        />

        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs space-y-2">
          {history.length === 0 ? (
            <div className="text-slate-500">
              Chưa có lệnh nào được chạy. Chọn một mẫu phía trên hoặc bấm "Thực thi (Run)"!
            </div>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="text-rose-300">&gt; {item.cmd}</div>
                <pre
                  className={cn(
                    'whitespace-pre-wrap pl-3',
                    item.isErr ? 'text-amber-300' : 'text-emerald-300'
                  )}
                >
                  {item.out}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Live Keyspace Inspector */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/85 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <Database className="h-3.5 w-3.5" />
            <span>Trạng thái Keyspace Trực tiếp ({entries.length} keys)</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            DBSIZE = {entries.length}
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
            Keyspace đang trống. Chạy lệnh bên trái để quan sát cấu trúc dữ liệu, Hash Slot & TTL trực tiếp!
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {entries.map(([k, entry]) => {
              const info = summarizeEntry(entry, rtRef.current.nowMs);
              const slot = crc16RedisSlot(k);
              return (
                <div key={k} className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-white truncate">{k}</span>
                    <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300">
                        {info.type}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                        slot {slot}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 break-all line-clamp-2">
                    {info.preview}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    TTL: {info.ttlLabel} · LFU freq: {entry.freq}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * Main Simulator Hub Wrapper
 * ============================================================================ */

const SIM_MODES: {
  id: RedisSimMode;
  label: string;
  sub: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'memory',
    label: '1. RAM & 8 Eviction Policies',
    sub: 'LRU vs TinyLFU vs noeviction OOM',
    icon: Cpu,
  },
  {
    id: 'cluster',
    label: '2. 16384 Hash Slots & Failover',
    sub: 'CRC16 · {HashTag} · CROSSSLOT',
    icon: Network,
  },
  {
    id: 'repl',
    label: '3. Live redis-cli & Keyspace',
    sub: 'Redis 8 VM + Thanh tra bộ nhớ',
    icon: Terminal,
  },
];

export const RedisSimulatorLab: React.FC = () => {
  const { simMode, setSimMode } = useRedisStore();

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-5 sm:py-7 space-y-5">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/35 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>REDIS INTERACTIVE SANDBOX</span>
        </div>
        <h1 className="mt-1.5 text-lg sm:text-2xl font-extrabold text-white tracking-tight">
          Phòng Thí nghiệm Bộ nhớ Eviction, Cụm 16384 Hash Slots & Live REPL
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {SIM_MODES.map((m) => {
          const Icon = m.icon;
          const active = simMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSimMode(m.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer',
                active
                  ? 'border-rose-500 bg-rose-500/15 shadow-sm'
                  : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  active ? 'bg-rose-500/25 text-rose-300' : 'bg-slate-800 text-slate-400'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold text-white truncate">{m.label}</div>
                <div className="text-[11px] text-slate-400 truncate">{m.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {simMode === 'memory' && <MemoryEvictionSandbox />}
      {simMode === 'cluster' && <ClusterHashRingSandbox />}
      {simMode === 'repl' && <LiveRedisReplLab />}
    </div>
  );
};

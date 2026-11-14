import type {
  GradeResult,
  GradeTest,
  RedisCliCheckRule,
  RunResult,
  SimRedisInitialKey,
  SimRedisWorld,
} from '../types';
import { applyAclTokensToRule, parseRedisMemoryBytes, type ParsedAclUserRule } from './redisConfGrader';
import { checkValueMatcher } from './yamlGrader';

/* ============================================================================
 * 1. CRC16 (XMODEM) & 16384 Hash Slots chuẩn của Redis Cluster
 * ============================================================================ */

const CRC16_TAB = [
  0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
  0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
  0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
  0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
  0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
  0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
  0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
  0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
  0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
  0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
  0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12,
  0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
  0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41,
  0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
  0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
  0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
  0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
  0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
  0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
  0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
  0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
  0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,
  0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
  0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
  0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
  0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3,
  0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
  0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92,
  0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
  0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
  0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
  0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0,
];

export function extractRedisHashTag(key: string): string {
  const s = key.indexOf('{');
  if (s >= 0) {
    const e = key.indexOf('}', s + 1);
    if (e > s + 1) {
      return key.slice(s + 1, e);
    }
  }
  return key;
}

export function crc16Xmodem(str: string): number {
  const bytes = new TextEncoder().encode(str);
  let crc = 0;
  for (let i = 0; i < bytes.length; i++) {
    crc = ((crc << 8) ^ CRC16_TAB[((crc >> 8) ^ bytes[i]) & 0xff]) & 0xffff;
  }
  return crc;
}

export function crc16RedisSlot(key: string): number {
  return crc16Xmodem(extractRedisHashTag(key)) & 0x3fff; // modulo 16384
}

/* ============================================================================
 * 2. Cấu trúc dữ liệu In-Memory của Redis 8 Runtime
 * ============================================================================ */

export interface StreamEntry {
  id: string;
  fields: Record<string, string>;
}

export interface StreamPelItem {
  id: string;
  consumer: string;
  deliveredAtMs: number;
  deliveryCount: number;
}

export interface StreamConsumerGroup {
  name: string;
  lastDeliveredIdx: number;
  pel: Map<string, StreamPelItem>;
}

export type RedisValueData =
  | { type: 'string'; val: string }
  | { type: 'hash'; fields: Map<string, string>; fieldExpiresAtMs: Map<string, number> }
  | { type: 'list'; items: string[] }
  | { type: 'set'; members: Set<string> }
  | { type: 'zset'; scores: Map<string, number> }
  | { type: 'bitmap'; bits: Set<number> }
  | { type: 'hll'; elements: Set<string> }
  | { type: 'bloom'; items: Set<string>; errorRate: number; capacity: number }
  | { type: 'geo'; points: Map<string, { lon: number; lat: number }> }
  | {
      type: 'stream';
      entries: StreamEntry[];
      lastMs: number;
      lastSeq: number;
      groups: Map<string, StreamConsumerGroup>;
    };

export interface RedisEntry {
  data: RedisValueData;
  expiresAtMs?: number;
  freq: number;
  lastAccessMs: number;
}

export interface RedisRuntime {
  nowMs: number;
  store: Map<string, RedisEntry>;
  config: Record<string, string>;
  aclUsers: Map<string, ParsedAclUserRule>;
  slowlog: { id: number; durationMicros: number; cmd: string }[];
  clusterRole: 'master' | 'replica';
  clusterSlotsAssigned: number;
  replicationOffset: number;
  inMulti: boolean;
  txQueue: string[][];
  commandHistory: string[];
  publishedCount: number;
}

function globToRegExp(pattern: string): RegExp {
  let re = '^';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*') re += '.*';
    else if (ch === '?') re += '.';
    else if (ch === '[' && pattern.indexOf(']', i) > i) {
      const end = pattern.indexOf(']', i);
      re += pattern.slice(i, end + 1);
      i = end;
    } else if ('\\^$.|+(){}'.includes(ch)) {
      re += '\\' + ch;
    } else {
      re += ch;
    }
  }
  re += '$';
  return new RegExp(re);
}

export function createRedisRuntime(initial?: SimRedisWorld): RedisRuntime {
  const nowMs = 1_700_000_000_000;
  const config: Record<string, string> = {
    maxmemory: initial?.maxMemoryBytes ? String(initial.maxMemoryBytes) : '0',
    'maxmemory-policy': 'noeviction',
    save: '3600 1 300 100 60 10000',
    appendonly: 'yes',
    appendfsync: 'everysec',
    'lazyfree-lazy-eviction': 'no',
    'lazyfree-lazy-expire': 'no',
    'slowlog-log-slower-than': '10000',
    'slowlog-max-len': '128',
    timeout: '0',
    'tcp-keepalive': '300',
    'protected-mode': 'yes',
    ...(initial?.config ?? {}),
  };

  const aclUsers = new Map<string, ParsedAclUserRule>();
  aclUsers.set('default', {
    username: 'default',
    enabled: true,
    nopass: true,
    passwords: [],
    keyPatterns: ['*'],
    allowedCategories: ['all'],
    deniedCategories: [],
    allowedCommands: [],
    deniedCommands: [],
    line: 0,
  });

  if (initial?.aclUsers) {
    for (const u of initial.aclUsers) {
      aclUsers.set(u.username, {
        username: u.username,
        enabled: u.enabled,
        nopass: u.passwords.length === 0,
        passwords: [...u.passwords],
        keyPatterns: [...u.keyPatterns],
        allowedCategories: [...u.allowedCategories],
        deniedCategories: [...u.deniedCategories],
        allowedCommands: [...(u.allowedCommands ?? [])],
        deniedCommands: [...(u.deniedCommands ?? [])],
        line: 0,
      });
    }
  }

  const store = new Map<string, RedisEntry>();
  if (initial?.initialKeys) {
    for (const item of initial.initialKeys) {
      seedKey(store, item, nowMs);
    }
  }

  return {
    nowMs,
    store,
    config,
    aclUsers,
    slowlog: (initial?.slowlog ?? []).map((s) => ({ ...s })),
    clusterRole: initial?.clusterRole ?? 'master',
    clusterSlotsAssigned: initial?.clusterSlotsAssigned ?? 16384,
    replicationOffset: initial?.replicationOffset ?? 482910,
    inMulti: false,
    txQueue: [],
    commandHistory: [],
    publishedCount: 0,
  };
}

function seedKey(store: Map<string, RedisEntry>, item: SimRedisInitialKey, nowMs: number): void {
  const expiresAtMs = item.ttlMs !== undefined && item.ttlMs > 0 ? nowMs + item.ttlMs : undefined;
  const freq = item.freq ?? 5;
  const lastAccessMs = nowMs - (item.idleSec ?? 0) * 1000;

  let data: RedisValueData;
  switch (item.type) {
    case 'string':
      data = { type: 'string', val: String(item.value ?? '') };
      break;
    case 'hash': {
      const fields = new Map<string, string>();
      if (item.value && typeof item.value === 'object') {
        for (const [k, v] of Object.entries(item.value as Record<string, unknown>)) {
          fields.set(k, String(v));
        }
      }
      data = { type: 'hash', fields, fieldExpiresAtMs: new Map() };
      break;
    }
    case 'list':
      data = { type: 'list', items: Array.isArray(item.value) ? item.value.map(String) : [] };
      break;
    case 'set':
      data = { type: 'set', members: new Set(Array.isArray(item.value) ? item.value.map(String) : []) };
      break;
    case 'zset': {
      const scores = new Map<string, number>();
      if (Array.isArray(item.value)) {
        for (const el of item.value as { member: string; score: number }[]) {
          if (el && typeof el === 'object' && 'member' in el) {
            scores.set(String(el.member), Number(el.score));
          }
        }
      } else if (item.value && typeof item.value === 'object') {
        for (const [m, sc] of Object.entries(item.value as Record<string, unknown>)) {
          scores.set(m, Number(sc));
        }
      }
      data = { type: 'zset', scores };
      break;
    }
    case 'bitmap':
      data = { type: 'bitmap', bits: new Set(Array.isArray(item.value) ? item.value.map(Number) : []) };
      break;
    case 'hll':
      data = { type: 'hll', elements: new Set(Array.isArray(item.value) ? item.value.map(String) : []) };
      break;
    case 'bloom':
      data = {
        type: 'bloom',
        items: new Set(Array.isArray(item.value) ? item.value.map(String) : []),
        errorRate: 0.01,
        capacity: 1000,
      };
      break;
    case 'geo': {
      const points = new Map<string, { lon: number; lat: number }>();
      if (item.value && typeof item.value === 'object') {
        for (const [m, pt] of Object.entries(item.value as Record<string, { lon: number; lat: number }>)) {
          if (pt && typeof pt.lon === 'number' && typeof pt.lat === 'number') {
            points.set(m, { lon: pt.lon, lat: pt.lat });
          }
        }
      }
      data = { type: 'geo', points };
      break;
    }
    case 'stream': {
      const raw = (item.value ?? {}) as {
        entries?: { id: string; fields: Record<string, string> }[];
        groups?: {
          name: string;
          lastDeliveredIdx?: number;
          pel?: { id: string; consumer: string; deliveredAtMs?: number; deliveryCount?: number }[];
        }[];
      };
      const entries = (raw.entries ?? []).map((e) => ({ id: e.id, fields: { ...e.fields } }));
      const groups = new Map<string, StreamConsumerGroup>();
      for (const g of raw.groups ?? []) {
        const pel = new Map<string, StreamPelItem>();
        for (const p of g.pel ?? []) {
          pel.set(p.id, {
            id: p.id,
            consumer: p.consumer,
            deliveredAtMs: p.deliveredAtMs ?? nowMs - 60_000,
            deliveryCount: p.deliveryCount ?? 1,
          });
        }
        groups.set(g.name, {
          name: g.name,
          lastDeliveredIdx: g.lastDeliveredIdx ?? entries.length - 1,
          pel,
        });
      }
      data = {
        type: 'stream',
        entries,
        lastMs: nowMs,
        lastSeq: entries.length,
        groups,
      };
      break;
    }
  }

  store.set(item.key, { data, expiresAtMs, freq, lastAccessMs });
}

function purgeExpired(rt: RedisRuntime, specificKey?: string): void {
  if (specificKey !== undefined) {
    const entry = rt.store.get(specificKey);
    if (!entry) return;
    if (entry.expiresAtMs !== undefined && entry.expiresAtMs <= rt.nowMs) {
      rt.store.delete(specificKey);
      return;
    }
    if (entry.data.type === 'hash' && entry.data.fieldExpiresAtMs.size > 0) {
      for (const [f, exp] of entry.data.fieldExpiresAtMs.entries()) {
        if (exp <= rt.nowMs) {
          entry.data.fieldExpiresAtMs.delete(f);
          entry.data.fields.delete(f);
        }
      }
      if (entry.data.fields.size === 0) rt.store.delete(specificKey);
    }
    return;
  }

  for (const key of [...rt.store.keys()]) {
    purgeExpired(rt, key);
  }
}

function getEntry(rt: RedisRuntime, key: string): RedisEntry | undefined {
  purgeExpired(rt, key);
  const e = rt.store.get(key);
  if (e) {
    e.freq = Math.min(255, e.freq + 1);
    e.lastAccessMs = rt.nowMs;
  }
  return e;
}

function setEntry(rt: RedisRuntime, key: string, data: RedisValueData, expiresAtMs?: number): void {
  rt.store.set(key, {
    data,
    expiresAtMs,
    freq: 5,
    lastAccessMs: rt.nowMs,
  });
}

/* ============================================================================
 * 3. Bộ tách câu lệnh & Tokenize hỗ trợ kịch bản nhiều dòng / Lua EVAL
 * ============================================================================ */

export function parseRedisScriptCommands(script: string): { args: string[]; line: number; raw: string }[] {
  const normalized = script.replace(/\r/g, '');
  const commands: { args: string[]; line: number; raw: string }[] = [];

  let i = 0;
  let line = 1;

  while (i < normalized.length) {
    // Bỏ qua khoảng trắng đầu câu
    while (i < normalized.length && (normalized[i] === ' ' || normalized[i] === '\t')) i++;
    if (i >= normalized.length) break;

    if (normalized[i] === '\n') {
      line++;
      i++;
      continue;
    }

    // Dòng chú thích `#` hoặc `--`
    if (normalized[i] === '#' || (normalized[i] === '-' && normalized[i + 1] === '-')) {
      while (i < normalized.length && normalized[i] !== '\n') i++;
      continue;
    }

    const startLine = line;
    const cmdStart = i;
    const args: string[] = [];

    // Đọc từng token của 1 câu lệnh cho đến khi gặp \n (ngoài cặp dấu nháy và không có backslash nối dòng)
    while (i < normalized.length) {
      while (i < normalized.length && (normalized[i] === ' ' || normalized[i] === '\t')) i++;
      if (i >= normalized.length) break;

      if (normalized[i] === '\\' && normalized[i + 1] === '\n') {
        i += 2;
        line++;
        continue;
      }

      if (normalized[i] === '\n' || normalized[i] === ';') {
        if (normalized[i] === '\n') line++;
        i++;
        break;
      }

      if (normalized[i] === '#' && (i === cmdStart || normalized[i - 1] === ' ' || normalized[i - 1] === '\t')) {
        while (i < normalized.length && normalized[i] !== '\n') i++;
        break;
      }

      // Bóc 1 token
      let cur = '';
      if (normalized[i] === '"' || normalized[i] === "'") {
        const q = normalized[i++];
        while (i < normalized.length && normalized[i] !== q) {
          if (normalized[i] === '\\' && i + 1 < normalized.length) {
            const nxt = normalized[i + 1];
            if (nxt === 'n') {
              cur += '\n';
              i += 2;
            } else if (nxt === 't') {
              cur += '\t';
              i += 2;
            } else if (nxt === '"' || nxt === "'" || nxt === '\\') {
              cur += nxt;
              i += 2;
            } else {
              cur += normalized[i++];
            }
          } else {
            if (normalized[i] === '\n') line++;
            cur += normalized[i++];
          }
        }
        if (i < normalized.length && normalized[i] === q) i++;
        args.push(cur);
      } else {
        while (
          i < normalized.length &&
          normalized[i] !== ' ' &&
          normalized[i] !== '\t' &&
          normalized[i] !== '\n' &&
          normalized[i] !== ';'
        ) {
          cur += normalized[i++];
        }
        args.push(cur);
      }
    }

    if (args.length > 0) {
      const cleaned = stripRedisCliWrapper(args);
      if (cleaned.length > 0) {
        commands.push({
          args: cleaned,
          line: startLine,
          raw: cleaned.join(' '),
        });
      }
    }
  }

  return commands;
}

/** Gỡ tiền tố `$` hoặc `redis-cli [-h ...] [-p ...] [-a ...] [-c]` nếu người học gõ kiểu shell */
export function stripRedisCliWrapper(tokens: string[]): string[] {
  let idx = 0;
  if (tokens[idx] === '$') idx++;
  if (tokens[idx]?.toLowerCase() === 'redis-cli') {
    idx++;
    while (idx < tokens.length && tokens[idx].startsWith('-')) {
      const flag = tokens[idx];
      if (['-h', '-p', '-a', '-n', '-u', '--user', '--pass'].includes(flag)) {
        idx += 2;
      } else {
        idx += 1;
      }
    }
  }
  return tokens.slice(idx);
}

/* ============================================================================
 * 4. Haversine Geo & Sorted Set Helpers
 * ============================================================================ */

function haversineMeters(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6372797.560856; // Bán kính chuẩn Redis dùng trong geohash_helper.c
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function convertGeoUnit(meters: number, unitRaw: string): number {
  switch (unitRaw.toLowerCase()) {
    case 'km':
      return meters / 1000;
    case 'mi':
      return meters / 1609.34;
    case 'ft':
      return meters / 0.3048;
    default:
      return meters;
  }
}

function parseScoreBound(bound: string): { val: number; exclusive: boolean } | null {
  const s = bound.trim().toLowerCase();
  if (s === '-inf') return { val: -Infinity, exclusive: false };
  if (s === '+inf' || s === 'inf') return { val: Infinity, exclusive: false };
  if (s.startsWith('(')) {
    const n = Number(s.slice(1));
    return Number.isFinite(n) ? { val: n, exclusive: true } : null;
  }
  const n = Number(s);
  return Number.isFinite(n) ? { val: n, exclusive: false } : null;
}

function sortedZSetEntries(scores: Map<string, number>, desc = false): [string, number][] {
  const arr = [...scores.entries()];
  arr.sort((a, b) => {
    if (a[1] !== b[1]) return desc ? b[1] - a[1] : a[1] - b[1];
    return desc ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0]);
  });
  return arr;
}

/* ============================================================================
 * 5. Bộ thực thi kịch bản Lua thu gọn & an toàn cho lệnh EVAL
 * ============================================================================ */

type LuaVal = string | number | boolean | null | LuaVal[];

function evalMiniLua(script: string, keys: string[], argv: string[], rt: RedisRuntime): { ok: true; val: LuaVal } | { ok: false; err: string } {
  const vars = new Map<string, LuaVal>();

  const evalExpr = (raw: string): LuaVal => {
    const expr = raw.trim().replace(/;$/, '').trim();
    if (!expr || expr === 'nil') return null;
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (/^-?\d+(?:\.\d+)?$/.test(expr)) return Number(expr);
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }

    const keysMatch = expr.match(/^KEYS\[(\d+)\]$/);
    if (keysMatch) return keys[Number(keysMatch[1]) - 1] ?? null;

    const argvMatch = expr.match(/^ARGV\[(\d+)\]$/);
    if (argvMatch) return argv[Number(argvMatch[1]) - 1] ?? null;

    // tonumber(...) / tostring(...)
    const toNumMatch = expr.match(/^tonumber\((.+)\)$/);
    if (toNumMatch) {
      const inner = evalExpr(toNumMatch[1]);
      if (inner === null || inner === false) return null;
      const n = Number(inner);
      return Number.isFinite(n) ? n : null;
    }
    const toStrMatch = expr.match(/^tostring\((.+)\)$/);
    if (toStrMatch) {
      const inner = evalExpr(toStrMatch[1]);
      return inner === null ? 'nil' : String(inner);
    }

    // redis.call(...) / redis.pcall(...)
    const callMatch = expr.match(/^redis\.p?call\((.+)\)$/);
    if (callMatch) {
      const argExprs = splitLuaArgs(callMatch[1]);
      const callArgs = argExprs.map((ae) => {
        const v = evalExpr(ae);
        return v === null ? '' : String(v);
      });
      const res = executeRedisCommandRaw(rt, callArgs, false);
      if (res.err) throw new Error(res.err);
      return res.rawVal;
    }

    // Logical `or` / `and`
    const orIdx = findTopLevelOp(expr, ' or ');
    if (orIdx >= 0) {
      const left = evalExpr(expr.slice(0, orIdx));
      return left !== null && left !== false ? left : evalExpr(expr.slice(orIdx + 4));
    }
    const andIdx = findTopLevelOp(expr, ' and ');
    if (andIdx >= 0) {
      const left = evalExpr(expr.slice(0, andIdx));
      return left === null || left === false ? left : evalExpr(expr.slice(andIdx + 5));
    }

    if (expr.startsWith('not ')) {
      const inner = evalExpr(expr.slice(4));
      return inner === null || inner === false;
    }

    // Comparisons
    for (const op of ['==', '~=', '>=', '<=', '>', '<'] as const) {
      const idx = findTopLevelOp(expr, op);
      if (idx > 0) {
        const l = evalExpr(expr.slice(0, idx));
        const r = evalExpr(expr.slice(idx + op.length));
        if (op === '==') return l === r;
        if (op === '~=') return l !== r;
        if (op === '>=') return Number(l) >= Number(r);
        if (op === '<=') return Number(l) <= Number(r);
        if (op === '>') return Number(l) > Number(r);
        if (op === '<') return Number(l) < Number(r);
      }
    }

    // String concat `..`
    const concatIdx = findTopLevelOp(expr, '..');
    if (concatIdx > 0) {
      return `${String(evalExpr(expr.slice(0, concatIdx)) ?? '')}${String(evalExpr(expr.slice(concatIdx + 2)) ?? '')}`;
    }

    // Arithmetic `+`, `-`, `*`, `/`
    for (const op of ['+', '-', '*', '/'] as const) {
      const idx = findTopLevelOp(expr, op);
      if (idx > 0) {
        const l = Number(evalExpr(expr.slice(0, idx)));
        const r = Number(evalExpr(expr.slice(idx + 1)));
        if (op === '+') return l + r;
        if (op === '-') return l - r;
        if (op === '*') return l * r;
        if (op === '/') return r !== 0 ? l / r : 0;
      }
    }

    if (vars.has(expr)) return vars.get(expr)!;
    return null;
  };

  try {
    const cleaned = script
      .replace(/--[^\n]*/g, '')
      .replace(/\bthen\b/g, '\nthen\n')
      .replace(/\belse\b/g, '\nelse\n')
      .replace(/\belseif\b/g, '\nelseif ')
      .replace(/\bend\b/g, '\nend\n');

    const rawStmts = cleaned
      .split(/\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);

    const execBlock = (start: number, stopTokens: string[]): { returned?: LuaVal; hasReturn: boolean; nextIdx: number } => {
      let idx = start;
      while (idx < rawStmts.length) {
        const st = rawStmts[idx];
        if (stopTokens.some((tok) => st === tok || st.startsWith(tok + ' '))) {
          return { hasReturn: false, nextIdx: idx };
        }

        if (st.startsWith('if ') || st.startsWith('elseif ')) {
          const condStr = st.replace(/^(?:if|elseif)\s+/, '').replace(/\s*then$/, '').trim();
          let nextLine = idx + 1;
          if (rawStmts[nextLine] === 'then') nextLine++;
          const condVal = evalExpr(condStr);
          const isTrue = condVal !== null && condVal !== false;

          if (isTrue) {
            const sub = execBlock(nextLine, ['elseif', 'else', 'end']);
            if (sub.hasReturn) return sub;
            // Nhảy qua phần còn lại tới `end`
            let depth = 1;
            let k = sub.nextIdx;
            while (k < rawStmts.length && depth > 0) {
              if (rawStmts[k].startsWith('if ')) depth++;
              else if (rawStmts[k] === 'end') depth--;
              k++;
            }
            idx = k;
            continue;
          } else {
            // Bỏ qua thân nhánh đúng để tìm elseif / else / end ở cùng cấp
            let depth = 1;
            let k = nextLine;
            while (k < rawStmts.length && depth > 0) {
              const cur = rawStmts[k];
              if (cur.startsWith('if ')) depth++;
              else if (cur === 'end') {
                depth--;
                if (depth === 0) {
                  idx = k + 1;
                  break;
                }
              } else if (depth === 1 && cur.startsWith('elseif ')) {
                idx = k;
                break;
              } else if (depth === 1 && cur === 'else') {
                const elseSub = execBlock(k + 1, ['end']);
                if (elseSub.hasReturn) return elseSub;
                idx = elseSub.nextIdx + 1;
                break;
              }
              k++;
            }
            continue;
          }
        }

        if (st === 'then') {
          idx++;
          continue;
        }

        if (st.startsWith('return')) {
          const retExpr = st.slice(6).trim();
          return { returned: retExpr ? evalExpr(retExpr) : null, hasReturn: true, nextIdx: idx + 1 };
        }

        const assignMatch = st.match(/^(?:local\s+)?([a-zA-Z_]\w*)\s*=\s*(.+)$/);
        if (assignMatch) {
          vars.set(assignMatch[1], evalExpr(assignMatch[2]));
          idx++;
          continue;
        }

        evalExpr(st);
        idx++;
      }
      return { hasReturn: false, nextIdx: idx };
    };

    const out = execBlock(0, []);
    return { ok: true, val: out.hasReturn ? (out.returned ?? null) : null };
  } catch (err) {
    return { ok: false, err: err instanceof Error ? err.message : String(err) };
  }
}

function splitLuaArgs(s: string): string[] {
  const res: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      cur += ch;
      if (ch === quote && s[i - 1] !== '\\') quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
    } else if (ch === '(') {
      depth++;
      cur += ch;
    } else if (ch === ')') {
      depth--;
      cur += ch;
    } else if (ch === ',' && depth === 0) {
      if (cur.trim()) res.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) res.push(cur.trim());
  return res;
}

function findTopLevelOp(expr: string, op: string): number {
  let quote: '"' | "'" | null = null;
  let depth = 0;
  for (let i = 0; i <= expr.length - op.length; i++) {
    const ch = expr[i];
    if (quote) {
      if (ch === quote && expr[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '(' || ch === '[') {
      depth++;
      continue;
    }
    if (ch === ')' || ch === ']') {
      depth--;
      continue;
    }
    if (depth === 0 && expr.slice(i, i + op.length) === op) {
      // Tránh nhầm dấu âm đầu biểu thức hoặc `>=` với `>`
      if ((op === '>' || op === '<') && expr[i + 1] === '=') continue;
      if (op === '-' && i === 0) continue;
      return i;
    }
  }
  return -1;
}

/* ============================================================================
 * 6. Bộ thực thi từng lệnh Redis 8
 * ============================================================================ */

interface RawCmdOutput {
  rawVal: LuaVal;
  formatted: string;
  err?: string;
}

function formatResp(val: LuaVal): string {
  if (val === null) return '(nil)';
  if (typeof val === 'boolean') return val ? '(integer) 1' : '(integer) 0';
  if (typeof val === 'number') return Number.isInteger(val) ? `(integer) ${val}` : `"${val}"`;
  if (typeof val === 'string') {
    if (val === 'OK' || val === 'PONG' || val === 'QUEUED' || val.startsWith('# ')) return val;
    return `"${val}"`;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return '(empty array)';
    return val.map((item, idx) => `${idx + 1}) ${formatResp(item)}`).join('\n');
  }
  return String(val);
}

const WRONGTYPE_ERR = 'WRONGTYPE Operation against a key holding the wrong kind of value';

function executeRedisCommandRaw(rt: RedisRuntime, args: string[], recordHistory = true): RawCmdOutput {
  if (args.length === 0) return { rawVal: '', formatted: '' };
  const cmd = args[0].toUpperCase();
  if (recordHistory) {
    rt.commandHistory.push(args.join(' '));
  }

  // Xử lý chế độ Transaction MULTI / EXEC / DISCARD
  if (rt.inMulti && cmd !== 'EXEC' && cmd !== 'DISCARD' && cmd !== 'MULTI' && cmd !== 'WATCH') {
    rt.txQueue.push(args);
    return { rawVal: 'QUEUED', formatted: 'QUEUED' };
  }

  switch (cmd) {
    case 'PING': {
      const msg = args[1];
      return msg ? { rawVal: msg, formatted: `"${msg}"` } : { rawVal: 'PONG', formatted: 'PONG' };
    }
    case 'ECHO': {
      const msg = args[1] ?? '';
      return { rawVal: msg, formatted: `"${msg}"` };
    }
    case 'ADVANCE_TIME':
    case 'SLEEP_MS': {
      const ms = Number(args[1] ?? 0);
      if (!Number.isFinite(ms) || ms < 0) {
        return { rawVal: null, formatted: '', err: 'ERR ADVANCE_TIME cần số mili-giây >= 0' };
      }
      rt.nowMs += ms;
      purgeExpired(rt);
      return { rawVal: 'OK', formatted: `OK (virtual clock +${ms}ms)` };
    }
    case 'MULTI': {
      if (rt.inMulti) return { rawVal: null, formatted: '', err: 'ERR MULTI calls can not be nested' };
      rt.inMulti = true;
      rt.txQueue = [];
      return { rawVal: 'OK', formatted: 'OK' };
    }
    case 'DISCARD': {
      if (!rt.inMulti) return { rawVal: null, formatted: '', err: 'ERR DISCARD without MULTI' };
      rt.inMulti = false;
      rt.txQueue = [];
      return { rawVal: 'OK', formatted: 'OK' };
    }
    case 'WATCH':
    case 'UNWATCH':
      return { rawVal: 'OK', formatted: 'OK' };
    case 'EXEC': {
      if (!rt.inMulti) return { rawVal: null, formatted: '', err: 'ERR EXEC without MULTI' };
      rt.inMulti = false;
      const queued = [...rt.txQueue];
      rt.txQueue = [];
      const results: LuaVal[] = [];
      const lines: string[] = [];
      queued.forEach((qArgs, idx) => {
        const sub = executeRedisCommandRaw(rt, qArgs, false);
        if (sub.err) {
          lines.push(`${idx + 1}) (error) ${sub.err}`);
          results.push(null);
        } else {
          lines.push(`${idx + 1}) ${sub.formatted}`);
          results.push(sub.rawVal);
        }
      });
      return { rawVal: results, formatted: lines.length ? lines.join('\n') : '(empty array)' };
    }

    /* ---------------- STRING & GENERIC KEYSPACE ---------------- */
    case 'SET': {
      const key = args[1];
      const val = args[2];
      if (key === undefined || val === undefined) {
        return { rawVal: null, formatted: '', err: "ERR wrong number of arguments for 'set' command" };
      }
      let nx = false;
      let xx = false;
      let getOld = false;
      let keepTtl = false;
      let ttlMs: number | undefined;

      for (let i = 3; i < args.length; i++) {
        const opt = args[i].toUpperCase();
        if (opt === 'NX') nx = true;
        else if (opt === 'XX') xx = true;
        else if (opt === 'GET') getOld = true;
        else if (opt === 'KEEPTTL') keepTtl = true;
        else if (opt === 'EX' && args[i + 1]) ttlMs = Number(args[++i]) * 1000;
        else if (opt === 'PX' && args[i + 1]) ttlMs = Number(args[++i]);
        else if (opt === 'EXAT' && args[i + 1]) ttlMs = Number(args[++i]) * 1000 - rt.nowMs;
        else if (opt === 'PXAT' && args[i + 1]) ttlMs = Number(args[++i]) - rt.nowMs;
        else return { rawVal: null, formatted: '', err: `ERR syntax error near '${args[i]}'` };
      }
      if (ttlMs !== undefined && (!Number.isFinite(ttlMs) || ttlMs <= 0)) {
        return { rawVal: null, formatted: '', err: "ERR invalid expire time in 'set' command" };
      }

      const existing = getEntry(rt, key);
      if (existing && getOld && existing.data.type !== 'string') {
        return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      }
      const prevStr = existing?.data.type === 'string' ? existing.data.val : null;

      if (nx && existing) {
        return { rawVal: getOld ? prevStr : null, formatted: formatResp(getOld ? prevStr : null) };
      }
      if (xx && !existing) {
        return { rawVal: null, formatted: '(nil)' };
      }

      const expiresAtMs = keepTtl ? existing?.expiresAtMs : ttlMs !== undefined ? rt.nowMs + ttlMs : undefined;
      setEntry(rt, key, { type: 'string', val }, expiresAtMs);
      return getOld ? { rawVal: prevStr, formatted: formatResp(prevStr) } : { rawVal: 'OK', formatted: 'OK' };
    }

    case 'SETNX': {
      const [key, val] = [args[1], args[2]];
      if (key === undefined || val === undefined) {
        return { rawVal: null, formatted: '', err: "ERR wrong number of arguments for 'setnx' command" };
      }
      if (getEntry(rt, key)) return { rawVal: 0, formatted: '(integer) 0' };
      setEntry(rt, key, { type: 'string', val });
      return { rawVal: 1, formatted: '(integer) 1' };
    }

    case 'SETEX':
    case 'PSETEX': {
      const [key, ttlRaw, val] = [args[1], args[2], args[3]];
      const ttlNum = Number(ttlRaw);
      if (!key || val === undefined || !Number.isFinite(ttlNum) || ttlNum <= 0) {
        return { rawVal: null, formatted: '', err: `ERR invalid arguments for '${cmd.toLowerCase()}'` };
      }
      const ms = cmd === 'SETEX' ? ttlNum * 1000 : ttlNum;
      setEntry(rt, key, { type: 'string', val }, rt.nowMs + ms);
      return { rawVal: 'OK', formatted: 'OK' };
    }

    case 'GET':
    case 'GETDEL': {
      const key = args[1];
      if (!key) return { rawVal: null, formatted: '', err: `ERR wrong number of arguments for '${cmd.toLowerCase()}'` };
      const e = getEntry(rt, key);
      if (!e) return { rawVal: null, formatted: '(nil)' };
      if (e.data.type !== 'string') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const v = e.data.val;
      if (cmd === 'GETDEL') rt.store.delete(key);
      return { rawVal: v, formatted: `"${v}"` };
    }

    case 'MSET': {
      if (args.length < 3 || (args.length - 1) % 2 !== 0) {
        return { rawVal: null, formatted: '', err: "ERR wrong number of arguments for 'mset' command" };
      }
      for (let i = 1; i < args.length; i += 2) {
        setEntry(rt, args[i], { type: 'string', val: args[i + 1] });
      }
      return { rawVal: 'OK', formatted: 'OK' };
    }

    case 'MGET': {
      if (args.length < 2) return { rawVal: null, formatted: '', err: "ERR wrong number of arguments for 'mget'" };
      const vals = args.slice(1).map((k) => {
        const e = getEntry(rt, k);
        return e?.data.type === 'string' ? e.data.val : null;
      });
      return { rawVal: vals, formatted: formatResp(vals) };
    }

    case 'APPEND': {
      const [key, suffix] = [args[1], args[2] ?? ''];
      if (!key) return { rawVal: null, formatted: '', err: "ERR wrong number of arguments for 'append'" };
      const e = getEntry(rt, key);
      if (e && e.data.type !== 'string') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const next = (e && e.data.type === 'string' ? e.data.val : '') + suffix;
      setEntry(rt, key, { type: 'string', val: next }, e?.expiresAtMs);
      return { rawVal: next.length, formatted: `(integer) ${next.length}` };
    }

    case 'STRLEN': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'string') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      return { rawVal: e.data.val.length, formatted: `(integer) ${e.data.val.length}` };
    }

    case 'INCR':
    case 'DECR':
    case 'INCRBY':
    case 'DECRBY':
    case 'INCRBYFLOAT': {
      const key = args[1];
      if (!key) return { rawVal: null, formatted: '', err: `ERR wrong number of arguments for '${cmd.toLowerCase()}'` };
      let delta = 1;
      if (cmd === 'DECR') delta = -1;
      else if (cmd === 'INCRBY' || cmd === 'INCRBYFLOAT') delta = Number(args[2]);
      else if (cmd === 'DECRBY') delta = -Number(args[2]);
      if (!Number.isFinite(delta)) {
        return { rawVal: null, formatted: '', err: 'ERR value is not an integer or out of range' };
      }

      const e = getEntry(rt, key);
      if (e && e.data.type !== 'string') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const curNum = e && e.data.type === 'string' ? Number(e.data.val) : 0;
      if (!Number.isFinite(curNum)) {
        return { rawVal: null, formatted: '', err: 'ERR value is not an integer or out of range' };
      }
      const nextNum = cmd === 'INCRBYFLOAT' ? Number((curNum + delta).toFixed(6)) : curNum + Math.trunc(delta);
      setEntry(rt, key, { type: 'string', val: String(nextNum) }, e?.expiresAtMs);
      return cmd === 'INCRBYFLOAT'
        ? { rawVal: String(nextNum), formatted: `"${nextNum}"` }
        : { rawVal: nextNum, formatted: `(integer) ${nextNum}` };
    }

    case 'DEL':
    case 'UNLINK': {
      const keys = args.slice(1);
      if (!keys.length) return { rawVal: null, formatted: '', err: `ERR wrong number of arguments for '${cmd.toLowerCase()}'` };
      let removed = 0;
      for (const k of keys) {
        purgeExpired(rt, k);
        if (rt.store.delete(k)) removed++;
      }
      return { rawVal: removed, formatted: `(integer) ${removed}` };
    }

    case 'EXISTS': {
      const keys = args.slice(1);
      let count = 0;
      for (const k of keys) {
        if (getEntry(rt, k)) count++;
      }
      return { rawVal: count, formatted: `(integer) ${count}` };
    }

    case 'TYPE': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: 'none', formatted: 'none' };
      const t = e.data.type === 'hll' ? 'string' : e.data.type === 'geo' ? 'zset' : e.data.type;
      return { rawVal: t, formatted: t };
    }

    case 'OBJECT': {
      const sub = (args[1] ?? '').toUpperCase();
      const key = args[2];
      if (sub === 'ENCODING' && key) {
        const e = getEntry(rt, key);
        if (!e) return { rawVal: null, formatted: '(nil)' };
        let enc = 'raw';
        if (e.data.type === 'string') {
          if (/^-?\d+$/.test(e.data.val)) enc = 'int';
          else if (e.data.val.length <= 44) enc = 'embstr';
          else enc = 'raw';
        } else if (e.data.type === 'hash') {
          enc = e.data.fields.size <= 128 ? 'listpack' : 'hashtable';
        } else if (e.data.type === 'list') {
          enc = 'quicklist';
        } else if (e.data.type === 'set') {
          const allInt = [...e.data.members].every((m) => /^-?\d+$/.test(m));
          enc = allInt && e.data.members.size <= 512 ? 'intset' : e.data.members.size <= 128 ? 'listpack' : 'hashtable';
        } else if (e.data.type === 'zset' || e.data.type === 'geo') {
          const sz = e.data.type === 'zset' ? e.data.scores.size : e.data.points.size;
          enc = sz <= 128 ? 'listpack' : 'skiplist';
        } else if (e.data.type === 'stream') {
          enc = 'stream';
        }
        return { rawVal: enc, formatted: `"${enc}"` };
      }
      if (sub === 'FREQ' && key) {
        const e = rt.store.get(key);
        return e ? { rawVal: e.freq, formatted: `(integer) ${e.freq}` } : { rawVal: null, formatted: '(nil)' };
      }
      if (sub === 'IDLETIME' && key) {
        const e = rt.store.get(key);
        const sec = e ? Math.max(0, Math.floor((rt.nowMs - e.lastAccessMs) / 1000)) : null;
        return sec !== null ? { rawVal: sec, formatted: `(integer) ${sec}` } : { rawVal: null, formatted: '(nil)' };
      }
      return { rawVal: null, formatted: '(nil)' };
    }

    case 'EXPIRE':
    case 'PEXPIRE': {
      const [key, ttlRaw] = [args[1], args[2]];
      const flag = args[3]?.toUpperCase();
      const ttlNum = Number(ttlRaw);
      if (!key || !Number.isFinite(ttlNum)) {
        return { rawVal: null, formatted: '', err: `ERR wrong arguments for '${cmd.toLowerCase()}'` };
      }
      const e = getEntry(rt, key);
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      const newExp = rt.nowMs + (cmd === 'EXPIRE' ? ttlNum * 1000 : ttlNum);
      if (flag === 'NX' && e.expiresAtMs !== undefined) return { rawVal: 0, formatted: '(integer) 0' };
      if (flag === 'XX' && e.expiresAtMs === undefined) return { rawVal: 0, formatted: '(integer) 0' };
      if (flag === 'GT' && (e.expiresAtMs === undefined || newExp <= e.expiresAtMs)) return { rawVal: 0, formatted: '(integer) 0' };
      if (flag === 'LT' && e.expiresAtMs !== undefined && newExp >= e.expiresAtMs) return { rawVal: 0, formatted: '(integer) 0' };

      if (ttlNum <= 0) {
        rt.store.delete(key);
      } else {
        e.expiresAtMs = newExp;
      }
      return { rawVal: 1, formatted: '(integer) 1' };
    }

    case 'TTL':
    case 'PTTL': {
      const key = args[1];
      if (!key) return { rawVal: null, formatted: '', err: "ERR wrong number of arguments for 'ttl'" };
      const e = getEntry(rt, key);
      if (!e) return { rawVal: -2, formatted: '(integer) -2' };
      if (e.expiresAtMs === undefined) return { rawVal: -1, formatted: '(integer) -1' };
      const diffMs = Math.max(0, e.expiresAtMs - rt.nowMs);
      const out = cmd === 'TTL' ? Math.ceil(diffMs / 1000) : diffMs;
      return { rawVal: out, formatted: `(integer) ${out}` };
    }

    case 'PERSIST': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e || e.expiresAtMs === undefined) return { rawVal: 0, formatted: '(integer) 0' };
      e.expiresAtMs = undefined;
      return { rawVal: 1, formatted: '(integer) 1' };
    }

    case 'RENAME': {
      const [src, dst] = [args[1], args[2]];
      if (!src || !dst) return { rawVal: null, formatted: '', err: "ERR wrong number of arguments for 'rename'" };
      const e = getEntry(rt, src);
      if (!e) return { rawVal: null, formatted: '', err: 'ERR no such key' };
      rt.store.delete(src);
      rt.store.set(dst, e);
      return { rawVal: 'OK', formatted: 'OK' };
    }

    case 'DBSIZE': {
      purgeExpired(rt);
      return { rawVal: rt.store.size, formatted: `(integer) ${rt.store.size}` };
    }

    case 'FLUSHDB':
    case 'FLUSHALL': {
      rt.store.clear();
      return { rawVal: 'OK', formatted: 'OK' };
    }

    case 'KEYS': {
      purgeExpired(rt);
      const pat = globToRegExp(args[1] ?? '*');
      const matched = [...rt.store.keys()].filter((k) => pat.test(k)).sort();
      return { rawVal: matched, formatted: formatResp(matched) };
    }

    case 'SCAN': {
      purgeExpired(rt);
      const cursor = Number(args[1] ?? 0);
      let matchPat = '*';
      let count = 10;
      let filterType: string | null = null;
      for (let i = 2; i < args.length; i++) {
        const opt = args[i].toUpperCase();
        if (opt === 'MATCH' && args[i + 1]) matchPat = args[++i];
        else if (opt === 'COUNT' && args[i + 1]) count = Math.max(1, Number(args[++i]));
        else if (opt === 'TYPE' && args[i + 1]) filterType = args[++i].toLowerCase();
      }
      const re = globToRegExp(matchPat);
      const allKeys = [...rt.store.keys()]
        .filter((k) => {
          if (!re.test(k)) return false;
          if (filterType) {
            const e = rt.store.get(k);
            return e?.data.type === filterType;
          }
          return true;
        })
        .sort();
      const slice = allKeys.slice(cursor, cursor + count);
      const nextCursor = cursor + count >= allKeys.length ? '0' : String(cursor + count);
      const res: LuaVal = [nextCursor, slice];
      return { rawVal: res, formatted: formatResp(res) };
    }

    /* ---------------- HASH (+ Redis 7.4/8 HEXPIRE) ---------------- */
    case 'HSET':
    case 'HMSET': {
      const key = args[1];
      if (!key || args.length < 4 || (args.length - 2) % 2 !== 0) {
        return { rawVal: null, formatted: '', err: `ERR wrong number of arguments for '${cmd.toLowerCase()}'` };
      }
      let e = getEntry(rt, key);
      if (e && e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!e) {
        setEntry(rt, key, { type: 'hash', fields: new Map(), fieldExpiresAtMs: new Map() });
        e = rt.store.get(key)!;
      }
      const h = e.data as Extract<RedisValueData, { type: 'hash' }>;
      let added = 0;
      for (let i = 2; i < args.length; i += 2) {
        if (!h.fields.has(args[i])) added++;
        h.fields.set(args[i], args[i + 1]);
      }
      return cmd === 'HMSET' ? { rawVal: 'OK', formatted: 'OK' } : { rawVal: added, formatted: `(integer) ${added}` };
    }

    case 'HSETNX': {
      const [key, field, val] = [args[1], args[2], args[3]];
      if (!key || field === undefined || val === undefined) {
        return { rawVal: null, formatted: '', err: "ERR wrong number of arguments for 'hsetnx'" };
      }
      let e = getEntry(rt, key);
      if (e && e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!e) {
        setEntry(rt, key, { type: 'hash', fields: new Map(), fieldExpiresAtMs: new Map() });
        e = rt.store.get(key)!;
      }
      const h = e.data as Extract<RedisValueData, { type: 'hash' }>;
      if (h.fields.has(field)) return { rawVal: 0, formatted: '(integer) 0' };
      h.fields.set(field, val);
      return { rawVal: 1, formatted: '(integer) 1' };
    }

    case 'HGET': {
      const [key, field] = [args[1], args[2]];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: null, formatted: '(nil)' };
      if (e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const v = field !== undefined ? (e.data.fields.get(field) ?? null) : null;
      return { rawVal: v, formatted: formatResp(v) };
    }

    case 'HMGET': {
      const key = args[1];
      const fields = args.slice(2);
      const e = key ? getEntry(rt, key) : undefined;
      if (e && e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const out = fields.map((f) => (e?.data.type === 'hash' ? (e.data.fields.get(f) ?? null) : null));
      return { rawVal: out, formatted: formatResp(out) };
    }

    case 'HGETALL': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: [], formatted: '(empty array)' };
      if (e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const flat: string[] = [];
      for (const [f, v] of e.data.fields.entries()) {
        flat.push(f, v);
      }
      return { rawVal: flat, formatted: formatResp(flat) };
    }

    case 'HDEL': {
      const key = args[1];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      let count = 0;
      for (const f of args.slice(2)) {
        if (e.data.fields.delete(f)) {
          e.data.fieldExpiresAtMs.delete(f);
          count++;
        }
      }
      if (e.data.fields.size === 0 && key) rt.store.delete(key);
      return { rawVal: count, formatted: `(integer) ${count}` };
    }

    case 'HEXISTS': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const ok = args[2] !== undefined && e.data.fields.has(args[2]) ? 1 : 0;
      return { rawVal: ok, formatted: `(integer) ${ok}` };
    }

    case 'HLEN': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      return { rawVal: e.data.fields.size, formatted: `(integer) ${e.data.fields.size}` };
    }

    case 'HKEYS':
    case 'HVALS': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: [], formatted: '(empty array)' };
      if (e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const arr = cmd === 'HKEYS' ? [...e.data.fields.keys()] : [...e.data.fields.values()];
      return { rawVal: arr, formatted: formatResp(arr) };
    }

    case 'HINCRBY':
    case 'HINCRBYFLOAT': {
      const [key, field, incRaw] = [args[1], args[2], args[3]];
      const inc = Number(incRaw);
      if (!key || !field || !Number.isFinite(inc)) {
        return { rawVal: null, formatted: '', err: `ERR wrong arguments for '${cmd.toLowerCase()}'` };
      }
      let e = getEntry(rt, key);
      if (e && e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!e) {
        setEntry(rt, key, { type: 'hash', fields: new Map(), fieldExpiresAtMs: new Map() });
        e = rt.store.get(key)!;
      }
      const h = e.data as Extract<RedisValueData, { type: 'hash' }>;
      const cur = Number(h.fields.get(field) ?? 0);
      if (!Number.isFinite(cur)) return { rawVal: null, formatted: '', err: 'ERR hash value is not an integer' };
      const next = cmd === 'HINCRBYFLOAT' ? Number((cur + inc).toFixed(6)) : cur + Math.trunc(inc);
      h.fields.set(field, String(next));
      return cmd === 'HINCRBYFLOAT'
        ? { rawVal: String(next), formatted: `"${next}"` }
        : { rawVal: next, formatted: `(integer) ${next}` };
    }

    case 'HEXPIRE':
    case 'HPEXPIRE': {
      // Cú pháp Redis 7.4+/8: HEXPIRE key seconds [NX|XX|GT|LT] FIELDS numfields field [field ...]
      const key = args[1];
      const ttlNum = Number(args[2]);
      const fieldsIdx = args.findIndex((a, idx) => idx >= 3 && a.toUpperCase() === 'FIELDS');
      if (!key || !Number.isFinite(ttlNum) || fieldsIdx < 0) {
        return {
          rawVal: null,
          formatted: '',
          err: `ERR syntax: ${cmd} key time [NX|XX|GT|LT] FIELDS numfields field [field ...]`,
        };
      }
      const targetFields = args.slice(fieldsIdx + 2);
      const e = getEntry(rt, key);
      if (!e) return { rawVal: targetFields.map(() => -2), formatted: formatResp(targetFields.map(() => -2)) };
      if (e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const h = e.data;
      const ms = cmd === 'HEXPIRE' ? ttlNum * 1000 : ttlNum;
      const resCodes = targetFields.map((f) => {
        if (!h.fields.has(f)) return -2;
        if (ms <= 0) {
          h.fields.delete(f);
          h.fieldExpiresAtMs.delete(f);
          return 2;
        }
        h.fieldExpiresAtMs.set(f, rt.nowMs + ms);
        return 1;
      });
      if (h.fields.size === 0) rt.store.delete(key);
      return { rawVal: resCodes, formatted: formatResp(resCodes) };
    }

    case 'HTTL':
    case 'HPTTL': {
      const key = args[1];
      const fieldsIdx = args.findIndex((a, idx) => idx >= 2 && a.toUpperCase() === 'FIELDS');
      const targetFields = fieldsIdx >= 0 ? args.slice(fieldsIdx + 2) : args.slice(2);
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: targetFields.map(() => -2), formatted: formatResp(targetFields.map(() => -2)) };
      if (e.data.type !== 'hash') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const out = targetFields.map((f) => {
        if (!e.data.type || e.data.type !== 'hash' || !e.data.fields.has(f)) return -2;
        const exp = e.data.fieldExpiresAtMs.get(f);
        if (exp === undefined) return -1;
        const diff = Math.max(0, exp - rt.nowMs);
        return cmd === 'HTTL' ? Math.ceil(diff / 1000) : diff;
      });
      return { rawVal: out, formatted: formatResp(out) };
    }

    /* ---------------- LIST ---------------- */
    case 'LPUSH':
    case 'RPUSH': {
      const key = args[1];
      const vals = args.slice(2);
      if (!key || !vals.length) {
        return { rawVal: null, formatted: '', err: `ERR wrong number of arguments for '${cmd.toLowerCase()}'` };
      }
      let e = getEntry(rt, key);
      if (e && e.data.type !== 'list') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!e) {
        setEntry(rt, key, { type: 'list', items: [] });
        e = rt.store.get(key)!;
      }
      const list = (e.data as Extract<RedisValueData, { type: 'list' }>).items;
      for (const v of vals) {
        if (cmd === 'LPUSH') list.unshift(v);
        else list.push(v);
      }
      return { rawVal: list.length, formatted: `(integer) ${list.length}` };
    }

    case 'LPOP':
    case 'RPOP': {
      const key = args[1];
      const countArg = args[2] !== undefined ? Number(args[2]) : undefined;
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: null, formatted: '(nil)' };
      if (e.data.type !== 'list') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const list = e.data.items;
      if (!list.length) return { rawVal: null, formatted: '(nil)' };
      if (countArg !== undefined) {
        const popped: string[] = [];
        const n = Math.min(list.length, Math.max(0, countArg));
        for (let i = 0; i < n; i++) {
          const item = cmd === 'LPOP' ? list.shift() : list.pop();
          if (item !== undefined) popped.push(item);
        }
        if (list.length === 0 && key) rt.store.delete(key);
        return { rawVal: popped, formatted: formatResp(popped) };
      }
      const single = cmd === 'LPOP' ? list.shift()! : list.pop()!;
      if (list.length === 0 && key) rt.store.delete(key);
      return { rawVal: single, formatted: `"${single}"` };
    }

    case 'BLPOP':
    case 'BRPOP': {
      const keys = args.slice(1, -1);
      for (const k of keys) {
        const e = getEntry(rt, k);
        if (e && e.data.type === 'list' && e.data.items.length > 0) {
          const item = cmd === 'BLPOP' ? e.data.items.shift()! : e.data.items.pop()!;
          if (e.data.items.length === 0) rt.store.delete(k);
          return { rawVal: [k, item], formatted: formatResp([k, item]) };
        }
      }
      return { rawVal: null, formatted: '(nil)' };
    }

    case 'LMOVE': {
      const [src, dst, whereFrom, whereTo] = [args[1], args[2], args[3]?.toUpperCase(), args[4]?.toUpperCase()];
      if (!src || !dst || !whereFrom || !whereTo) {
        return { rawVal: null, formatted: '', err: "ERR wrong number of arguments for 'lmove'" };
      }
      const srcEntry = getEntry(rt, src);
      if (!srcEntry) return { rawVal: null, formatted: '(nil)' };
      if (srcEntry.data.type !== 'list') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (srcEntry.data.items.length === 0) return { rawVal: null, formatted: '(nil)' };
      const elem = whereFrom === 'LEFT' ? srcEntry.data.items.shift()! : srcEntry.data.items.pop()!;
      if (srcEntry.data.items.length === 0) rt.store.delete(src);

      let dstEntry = getEntry(rt, dst);
      if (dstEntry && dstEntry.data.type !== 'list') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!dstEntry) {
        setEntry(rt, dst, { type: 'list', items: [] });
        dstEntry = rt.store.get(dst)!;
      }
      const dstItems = (dstEntry.data as Extract<RedisValueData, { type: 'list' }>).items;
      if (whereTo === 'LEFT') dstItems.unshift(elem);
      else dstItems.push(elem);
      return { rawVal: elem, formatted: `"${elem}"` };
    }

    case 'LLEN': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'list') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      return { rawVal: e.data.items.length, formatted: `(integer) ${e.data.items.length}` };
    }

    case 'LRANGE': {
      const [key, startRaw, stopRaw] = [args[1], Number(args[2]), Number(args[3])];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: [], formatted: '(empty array)' };
      if (e.data.type !== 'list') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const len = e.data.items.length;
      let s = startRaw < 0 ? Math.max(0, len + startRaw) : startRaw;
      let end = stopRaw < 0 ? len + stopRaw : stopRaw;
      if (s >= len || s > end) return { rawVal: [], formatted: '(empty array)' };
      end = Math.min(len - 1, end);
      s = Math.max(0, s);
      const slice = e.data.items.slice(s, end + 1);
      return { rawVal: slice, formatted: formatResp(slice) };
    }

    case 'LTRIM': {
      const [key, startRaw, stopRaw] = [args[1], Number(args[2]), Number(args[3])];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: 'OK', formatted: 'OK' };
      if (e.data.type !== 'list') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const len = e.data.items.length;
      const s = startRaw < 0 ? Math.max(0, len + startRaw) : startRaw;
      const end = stopRaw < 0 ? len + stopRaw : Math.min(len - 1, stopRaw);
      if (s >= len || s > end) {
        if (key) rt.store.delete(key);
      } else {
        e.data.items = e.data.items.slice(s, end + 1);
      }
      return { rawVal: 'OK', formatted: 'OK' };
    }

    case 'LINDEX': {
      const [key, idxRaw] = [args[1], Number(args[2])];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: null, formatted: '(nil)' };
      if (e.data.type !== 'list') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const idx = idxRaw < 0 ? e.data.items.length + idxRaw : idxRaw;
      const val = e.data.items[idx] ?? null;
      return { rawVal: val, formatted: formatResp(val) };
    }

    /* ---------------- SET ---------------- */
    case 'SADD': {
      const key = args[1];
      const members = args.slice(2);
      if (!key || !members.length) return { rawVal: null, formatted: '', err: "ERR wrong arguments for 'sadd'" };
      let e = getEntry(rt, key);
      if (e && e.data.type !== 'set') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!e) {
        setEntry(rt, key, { type: 'set', members: new Set() });
        e = rt.store.get(key)!;
      }
      const s = (e.data as Extract<RedisValueData, { type: 'set' }>).members;
      let added = 0;
      for (const m of members) {
        if (!s.has(m)) {
          s.add(m);
          added++;
        }
      }
      return { rawVal: added, formatted: `(integer) ${added}` };
    }

    case 'SREM': {
      const key = args[1];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'set') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      let removed = 0;
      for (const m of args.slice(2)) {
        if (e.data.members.delete(m)) removed++;
      }
      if (e.data.members.size === 0 && key) rt.store.delete(key);
      return { rawVal: removed, formatted: `(integer) ${removed}` };
    }

    case 'SISMEMBER': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'set') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const ok = args[2] !== undefined && e.data.members.has(args[2]) ? 1 : 0;
      return { rawVal: ok, formatted: `(integer) ${ok}` };
    }

    case 'SMISMEMBER': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (e && e.data.type !== 'set') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const res = args.slice(2).map((m) => (e?.data.type === 'set' && e.data.members.has(m) ? 1 : 0));
      return { rawVal: res, formatted: formatResp(res) };
    }

    case 'SMEMBERS': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: [], formatted: '(empty array)' };
      if (e.data.type !== 'set') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const arr = [...e.data.members].sort();
      return { rawVal: arr, formatted: formatResp(arr) };
    }

    case 'SCARD': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'set') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      return { rawVal: e.data.members.size, formatted: `(integer) ${e.data.members.size}` };
    }

    case 'SINTER':
    case 'SUNION':
    case 'SDIFF':
    case 'SINTERSTORE':
    case 'SUNIONSTORE':
    case 'SDIFFSTORE': {
      const isStore = cmd.endsWith('STORE');
      const dst = isStore ? args[1] : undefined;
      const srcKeys = isStore ? args.slice(2) : args.slice(1);
      if (!srcKeys.length) return { rawVal: null, formatted: '', err: `ERR wrong arguments for '${cmd.toLowerCase()}'` };

      const sets: Set<string>[] = [];
      for (const k of srcKeys) {
        const e = getEntry(rt, k);
        if (e && e.data.type !== 'set') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
        sets.push(e?.data.type === 'set' ? e.data.members : new Set());
      }

      let outSet = new Set<string>();
      if (cmd.startsWith('SUNION')) {
        for (const s of sets) for (const m of s) outSet.add(m);
      } else if (cmd.startsWith('SINTER')) {
        outSet = new Set([...sets[0]].filter((m) => sets.slice(1).every((s) => s.has(m))));
      } else {
        outSet = new Set([...sets[0]].filter((m) => !sets.slice(1).some((s) => s.has(m))));
      }

      if (isStore && dst) {
        if (outSet.size === 0) rt.store.delete(dst);
        else setEntry(rt, dst, { type: 'set', members: outSet });
        return { rawVal: outSet.size, formatted: `(integer) ${outSet.size}` };
      }
      const arr = [...outSet].sort();
      return { rawVal: arr, formatted: formatResp(arr) };
    }

    /* ---------------- SORTED SET (ZSET) ---------------- */
    case 'ZADD': {
      const key = args[1];
      if (!key || args.length < 4) return { rawVal: null, formatted: '', err: "ERR wrong arguments for 'zadd'" };
      let idx = 2;
      let nx = false;
      let xx = false;
      let gt = false;
      let lt = false;
      let ch = false;
      while (idx < args.length && ['NX', 'XX', 'GT', 'LT', 'CH'].includes(args[idx].toUpperCase())) {
        const f = args[idx++].toUpperCase();
        if (f === 'NX') nx = true;
        else if (f === 'XX') xx = true;
        else if (f === 'GT') gt = true;
        else if (f === 'LT') lt = true;
        else if (f === 'CH') ch = true;
      }
      if ((args.length - idx) % 2 !== 0) return { rawVal: null, formatted: '', err: 'ERR syntax error in ZADD' };

      let e = getEntry(rt, key);
      if (e && e.data.type !== 'zset') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!e) {
        setEntry(rt, key, { type: 'zset', scores: new Map() });
        e = rt.store.get(key)!;
      }
      const scores = (e.data as Extract<RedisValueData, { type: 'zset' }>).scores;
      let added = 0;
      let changed = 0;
      for (let i = idx; i < args.length; i += 2) {
        const sc = Number(args[i]);
        const member = args[i + 1];
        if (!Number.isFinite(sc)) return { rawVal: null, formatted: '', err: 'ERR value is not a valid float' };
        const prev = scores.get(member);
        if (prev === undefined) {
          if (xx) continue;
          scores.set(member, sc);
          added++;
          changed++;
        } else {
          if (nx) continue;
          if (gt && sc <= prev) continue;
          if (lt && sc >= prev) continue;
          if (prev !== sc) {
            scores.set(member, sc);
            changed++;
          }
        }
      }
      const resCount = ch ? changed : added;
      return { rawVal: resCount, formatted: `(integer) ${resCount}` };
    }

    case 'ZINCRBY': {
      const [key, incRaw, member] = [args[1], args[2], args[3]];
      const inc = Number(incRaw);
      if (!key || member === undefined || !Number.isFinite(inc)) {
        return { rawVal: null, formatted: '', err: "ERR wrong arguments for 'zincrby'" };
      }
      let e = getEntry(rt, key);
      if (e && e.data.type !== 'zset') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!e) {
        setEntry(rt, key, { type: 'zset', scores: new Map() });
        e = rt.store.get(key)!;
      }
      const scores = (e.data as Extract<RedisValueData, { type: 'zset' }>).scores;
      const next = Number(((scores.get(member) ?? 0) + inc).toFixed(6));
      scores.set(member, next);
      return { rawVal: String(next), formatted: `"${next}"` };
    }

    case 'ZSCORE': {
      const [key, member] = [args[1], args[2]];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: null, formatted: '(nil)' };
      if (e.data.type !== 'zset') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const sc = member !== undefined ? e.data.scores.get(member) : undefined;
      return sc === undefined ? { rawVal: null, formatted: '(nil)' } : { rawVal: String(sc), formatted: `"${sc}"` };
    }

    case 'ZCARD': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'zset') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      return { rawVal: e.data.scores.size, formatted: `(integer) ${e.data.scores.size}` };
    }

    case 'ZCOUNT': {
      const [key, minB, maxB] = [args[1], parseScoreBound(args[2] ?? ''), parseScoreBound(args[3] ?? '')];
      if (!key || !minB || !maxB) return { rawVal: null, formatted: '', err: "ERR min or max is not a float" };
      const e = getEntry(rt, key);
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'zset') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      let cnt = 0;
      for (const sc of e.data.scores.values()) {
        const minOk = minB.exclusive ? sc > minB.val : sc >= minB.val;
        const maxOk = maxB.exclusive ? sc < maxB.val : sc <= maxB.val;
        if (minOk && maxOk) cnt++;
      }
      return { rawVal: cnt, formatted: `(integer) ${cnt}` };
    }

    case 'ZRANK':
    case 'ZREVRANK': {
      const [key, member] = [args[1], args[2]];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e || member === undefined) return { rawVal: null, formatted: '(nil)' };
      if (e.data.type !== 'zset') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const sorted = sortedZSetEntries(e.data.scores, cmd === 'ZREVRANK');
      const idx = sorted.findIndex(([m]) => m === member);
      return idx < 0 ? { rawVal: null, formatted: '(nil)' } : { rawVal: idx, formatted: `(integer) ${idx}` };
    }

    case 'ZREM': {
      const key = args[1];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'zset') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      let removed = 0;
      for (const m of args.slice(2)) {
        if (e.data.scores.delete(m)) removed++;
      }
      if (e.data.scores.size === 0 && key) rt.store.delete(key);
      return { rawVal: removed, formatted: `(integer) ${removed}` };
    }

    case 'ZREMRANGEBYSCORE': {
      const [key, minB, maxB] = [args[1], parseScoreBound(args[2] ?? ''), parseScoreBound(args[3] ?? '')];
      if (!key || !minB || !maxB) return { rawVal: null, formatted: '', err: 'ERR min or max is not a float' };
      const e = getEntry(rt, key);
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'zset') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      let removed = 0;
      for (const [m, sc] of [...e.data.scores.entries()]) {
        const minOk = minB.exclusive ? sc > minB.val : sc >= minB.val;
        const maxOk = maxB.exclusive ? sc < maxB.val : sc <= maxB.val;
        if (minOk && maxOk) {
          e.data.scores.delete(m);
          removed++;
        }
      }
      if (e.data.scores.size === 0) rt.store.delete(key);
      return { rawVal: removed, formatted: `(integer) ${removed}` };
    }

    case 'ZRANGE':
    case 'ZREVRANGE':
    case 'ZRANGEBYSCORE':
    case 'ZREVRANGEBYSCORE': {
      const key = args[1];
      if (!key || args.length < 4) return { rawVal: null, formatted: '', err: `ERR wrong arguments for '${cmd.toLowerCase()}'` };
      const e = getEntry(rt, key);
      if (!e) return { rawVal: [], formatted: '(empty array)' };
      if (e.data.type !== 'zset') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };

      const flags = args.slice(4).map((a) => a.toUpperCase());
      const rev = cmd === 'ZREVRANGE' || cmd === 'ZREVRANGEBYSCORE' || flags.includes('REV');
      const byScore = cmd === 'ZRANGEBYSCORE' || cmd === 'ZREVRANGEBYSCORE' || flags.includes('BYSCORE');
      const withScores = flags.includes('WITHSCORES');

      let limitOffset = 0;
      let limitCount = Infinity;
      const limitIdx = flags.indexOf('LIMIT');
      if (limitIdx >= 0 && args[4 + limitIdx + 1] !== undefined && args[4 + limitIdx + 2] !== undefined) {
        limitOffset = Math.max(0, Number(args[4 + limitIdx + 1]));
        limitCount = Math.max(0, Number(args[4 + limitIdx + 2]));
      }

      const sorted = sortedZSetEntries(e.data.scores, rev);
      let picked: [string, number][] = [];

      if (byScore) {
        const b1 = parseScoreBound(args[2]);
        const b2 = parseScoreBound(args[3]);
        if (!b1 || !b2) return { rawVal: null, formatted: '', err: 'ERR min or max is not a float' };
        const minB = rev ? b2 : b1;
        const maxB = rev ? b1 : b2;
        picked = sorted.filter(([, sc]) => {
          const minOk = minB.exclusive ? sc > minB.val : sc >= minB.val;
          const maxOk = maxB.exclusive ? sc < maxB.val : sc <= maxB.val;
          return minOk && maxOk;
        });
        picked = picked.slice(limitOffset, limitOffset + limitCount);
      } else {
        const len = sorted.length;
        const rawS = Number(args[2]);
        const rawE = Number(args[3]);
        const s = rawS < 0 ? Math.max(0, len + rawS) : rawS;
        const end = rawE < 0 ? len + rawE : Math.min(len - 1, rawE);
        if (s < len && s <= end) picked = sorted.slice(s, end + 1);
      }

      const out: string[] = [];
      for (const [m, sc] of picked) {
        out.push(m);
        if (withScores) out.push(String(sc));
      }
      return { rawVal: out, formatted: formatResp(out) };
    }

    case 'ZPOPMIN':
    case 'ZPOPMAX': {
      const key = args[1];
      const count = Math.max(1, Number(args[2] ?? 1));
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: [], formatted: '(empty array)' };
      if (e.data.type !== 'zset') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const sorted = sortedZSetEntries(e.data.scores, cmd === 'ZPOPMAX').slice(0, count);
      const out: string[] = [];
      for (const [m, sc] of sorted) {
        e.data.scores.delete(m);
        out.push(m, String(sc));
      }
      if (e.data.scores.size === 0 && key) rt.store.delete(key);
      return { rawVal: out, formatted: formatResp(out) };
    }

    /* ---------------- BITMAP, HLL, BLOOM, GEO ---------------- */
    case 'SETBIT': {
      const [key, offRaw, bitRaw] = [args[1], Number(args[2]), Number(args[3])];
      if (!key || !Number.isInteger(offRaw) || offRaw < 0 || (bitRaw !== 0 && bitRaw !== 1)) {
        return { rawVal: null, formatted: '', err: 'ERR bit offset or bit value is not valid' };
      }
      let e = getEntry(rt, key);
      if (e && e.data.type !== 'bitmap') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!e) {
        setEntry(rt, key, { type: 'bitmap', bits: new Set() });
        e = rt.store.get(key)!;
      }
      const bits = (e.data as Extract<RedisValueData, { type: 'bitmap' }>).bits;
      const old = bits.has(offRaw) ? 1 : 0;
      if (bitRaw === 1) bits.add(offRaw);
      else bits.delete(offRaw);
      return { rawVal: old, formatted: `(integer) ${old}` };
    }

    case 'GETBIT': {
      const [key, offRaw] = [args[1], Number(args[2])];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'bitmap') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const v = e.data.bits.has(offRaw) ? 1 : 0;
      return { rawVal: v, formatted: `(integer) ${v}` };
    }

    case 'BITCOUNT': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'bitmap') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      return { rawVal: e.data.bits.size, formatted: `(integer) ${e.data.bits.size}` };
    }

    case 'BITOP': {
      const [op, dst, ...srcKeys] = [args[1]?.toUpperCase(), args[2], ...args.slice(3)];
      if (!op || !dst || !srcKeys.length) return { rawVal: null, formatted: '', err: "ERR wrong arguments for 'bitop'" };
      const bitSets = srcKeys.map((k) => {
        const e = getEntry(rt, k);
        return e?.data.type === 'bitmap' ? e.data.bits : new Set<number>();
      });
      const outBits = new Set<number>();
      if (op === 'OR') {
        for (const bs of bitSets) for (const b of bs) outBits.add(b);
      } else if (op === 'AND') {
        for (const b of bitSets[0]) {
          if (bitSets.slice(1).every((bs) => bs.has(b))) outBits.add(b);
        }
      } else if (op === 'XOR' && bitSets.length >= 2) {
        const all = new Set<number>();
        for (const bs of bitSets) for (const b of bs) all.add(b);
        for (const b of all) {
          const cnt = bitSets.filter((bs) => bs.has(b)).length;
          if (cnt % 2 === 1) outBits.add(b);
        }
      }
      setEntry(rt, dst, { type: 'bitmap', bits: outBits });
      const maxBit = outBits.size ? Math.max(...outBits) : -1;
      const byteLen = maxBit >= 0 ? Math.floor(maxBit / 8) + 1 : 0;
      return { rawVal: byteLen, formatted: `(integer) ${byteLen}` };
    }

    case 'PFADD': {
      const key = args[1];
      if (!key) return { rawVal: null, formatted: '', err: "ERR wrong arguments for 'pfadd'" };
      let e = getEntry(rt, key);
      if (e && e.data.type !== 'hll') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!e) {
        setEntry(rt, key, { type: 'hll', elements: new Set() });
        e = rt.store.get(key)!;
      }
      const hll = (e.data as Extract<RedisValueData, { type: 'hll' }>).elements;
      let changed = 0;
      for (const el of args.slice(2)) {
        if (!hll.has(el)) {
          hll.add(el);
          changed = 1;
        }
      }
      return { rawVal: changed, formatted: `(integer) ${changed}` };
    }

    case 'PFCOUNT': {
      const union = new Set<string>();
      for (const k of args.slice(1)) {
        const e = getEntry(rt, k);
        if (e && e.data.type !== 'hll') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
        if (e?.data.type === 'hll') {
          for (const el of e.data.elements) union.add(el);
        }
      }
      return { rawVal: union.size, formatted: `(integer) ${union.size}` };
    }

    case 'PFMERGE': {
      const dst = args[1];
      if (!dst) return { rawVal: null, formatted: '', err: "ERR wrong arguments for 'pfmerge'" };
      const merged = new Set<string>();
      for (const k of [dst, ...args.slice(2)]) {
        const e = getEntry(rt, k);
        if (e?.data.type === 'hll') for (const el of e.data.elements) merged.add(el);
      }
      setEntry(rt, dst, { type: 'hll', elements: merged });
      return { rawVal: 'OK', formatted: 'OK' };
    }

    case 'BF.RESERVE': {
      const [key, errRate, cap] = [args[1], Number(args[2]), Number(args[3])];
      if (!key || !Number.isFinite(errRate) || !Number.isFinite(cap)) {
        return { rawVal: null, formatted: '', err: 'ERR syntax: BF.RESERVE key error_rate capacity' };
      }
      if (getEntry(rt, key)) return { rawVal: null, formatted: '', err: 'ERR item exists' };
      setEntry(rt, key, { type: 'bloom', items: new Set(), errorRate: errRate, capacity: cap });
      return { rawVal: 'OK', formatted: 'OK' };
    }

    case 'BF.ADD':
    case 'BF.MADD': {
      const key = args[1];
      const items = args.slice(2);
      if (!key || !items.length) return { rawVal: null, formatted: '', err: `ERR wrong arguments for '${cmd}'` };
      let e = getEntry(rt, key);
      if (!e) {
        setEntry(rt, key, { type: 'bloom', items: new Set(), errorRate: 0.01, capacity: 1000 });
        e = rt.store.get(key)!;
      }
      if (e.data.type !== 'bloom') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const b = e.data.items;
      const res = items.map((it) => {
        if (b.has(it)) return 0;
        b.add(it);
        return 1;
      });
      return cmd === 'BF.ADD'
        ? { rawVal: res[0], formatted: `(integer) ${res[0]}` }
        : { rawVal: res, formatted: formatResp(res) };
    }

    case 'BF.EXISTS':
    case 'BF.MEXISTS': {
      const key = args[1];
      const items = args.slice(2);
      const e = key ? getEntry(rt, key) : undefined;
      if (e && e.data.type !== 'bloom') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      const res = items.map((it) => (e?.data.type === 'bloom' && e.data.items.has(it) ? 1 : 0));
      return cmd === 'BF.EXISTS'
        ? { rawVal: res[0] ?? 0, formatted: `(integer) ${res[0] ?? 0}` }
        : { rawVal: res, formatted: formatResp(res) };
    }

    case 'GEOADD': {
      const key = args[1];
      if (!key || args.length < 5 || (args.length - 2) % 3 !== 0) {
        return { rawVal: null, formatted: '', err: 'ERR syntax: GEOADD key longitude latitude member [...]' };
      }
      let e = getEntry(rt, key);
      if (e && e.data.type !== 'geo') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!e) {
        setEntry(rt, key, { type: 'geo', points: new Map() });
        e = rt.store.get(key)!;
      }
      const pts = (e.data as Extract<RedisValueData, { type: 'geo' }>).points;
      let added = 0;
      for (let i = 2; i < args.length; i += 3) {
        const lon = Number(args[i]);
        const lat = Number(args[i + 1]);
        const member = args[i + 2];
        if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 85.05112878) {
          return { rawVal: null, formatted: '', err: `ERR invalid longitude,latitude pair ${args[i]},${args[i + 1]}` };
        }
        if (!pts.has(member)) added++;
        pts.set(member, { lon, lat });
      }
      return { rawVal: added, formatted: `(integer) ${added}` };
    }

    case 'GEODIST': {
      const [key, m1, m2, unit = 'm'] = [args[1], args[2], args[3], args[4] ?? 'm'];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e || e.data.type !== 'geo') return { rawVal: null, formatted: '(nil)' };
      const p1 = m1 ? e.data.points.get(m1) : undefined;
      const p2 = m2 ? e.data.points.get(m2) : undefined;
      if (!p1 || !p2) return { rawVal: null, formatted: '(nil)' };
      const dist = convertGeoUnit(haversineMeters(p1.lon, p1.lat, p2.lon, p2.lat), unit).toFixed(4);
      return { rawVal: dist, formatted: `"${dist}"` };
    }

    case 'GEOSEARCH': {
      const key = args[1];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: [], formatted: '(empty array)' };
      if (e.data.type !== 'geo') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      let centerLon = 0;
      let centerLat = 0;
      let radiusMeters = 0;
      let sortAsc = true;
      let countLimit = Infinity;
      for (let i = 2; i < args.length; i++) {
        const opt = args[i].toUpperCase();
        if (opt === 'FROMLONLAT' && args[i + 2] !== undefined) {
          centerLon = Number(args[++i]);
          centerLat = Number(args[++i]);
        } else if (opt === 'FROMMEMBER' && args[i + 1]) {
          const pt = e.data.points.get(args[++i]);
          if (!pt) return { rawVal: null, formatted: '', err: 'ERR could not decode requested zset member' };
          centerLon = pt.lon;
          centerLat = pt.lat;
        } else if (opt === 'BYRADIUS' && args[i + 2] !== undefined) {
          const r = Number(args[++i]);
          const u = args[++i].toLowerCase();
          radiusMeters = u === 'km' ? r * 1000 : u === 'mi' ? r * 1609.34 : u === 'ft' ? r * 0.3048 : r;
        } else if (opt === 'ASC') sortAsc = true;
        else if (opt === 'DESC') sortAsc = false;
        else if (opt === 'COUNT' && args[i + 1]) countLimit = Math.max(1, Number(args[++i]));
      }
      const candidates: { m: string; d: number }[] = [];
      for (const [m, pt] of e.data.points.entries()) {
        const d = haversineMeters(centerLon, centerLat, pt.lon, pt.lat);
        if (d <= radiusMeters) candidates.push({ m, d });
      }
      candidates.sort((a, b) => (sortAsc ? a.d - b.d : b.d - a.d));
      const names = candidates.slice(0, countLimit).map((c) => c.m);
      return { rawVal: names, formatted: formatResp(names) };
    }

    /* ---------------- LUA EVAL ---------------- */
    case 'EVAL': {
      const script = args[1];
      const numKeys = Number(args[2]);
      if (script === undefined || !Number.isInteger(numKeys) || numKeys < 0) {
        return { rawVal: null, formatted: '', err: 'ERR syntax: EVAL script numkeys [key ...] [arg ...]' };
      }
      const keys = args.slice(3, 3 + numKeys);
      const argv = args.slice(3 + numKeys);
      const luaRes = evalMiniLua(script, keys, argv, rt);
      if (!luaRes.ok) return { rawVal: null, formatted: '', err: `ERR Lua script error: ${luaRes.err}` };
      return { rawVal: luaRes.val, formatted: formatResp(luaRes.val) };
    }

    /* ---------------- PUB/SUB & STREAMS ---------------- */
    case 'PUBLISH': {
      if (args.length < 3) return { rawVal: null, formatted: '', err: "ERR wrong arguments for 'publish'" };
      rt.publishedCount++;
      return { rawVal: 1, formatted: '(integer) 1' };
    }

    case 'XADD': {
      const key = args[1];
      if (!key || args.length < 5) return { rawVal: null, formatted: '', err: "ERR wrong arguments for 'xadd'" };
      let idx = 2;
      let maxLen: number | null = null;
      if (args[idx]?.toUpperCase() === 'MAXLEN') {
        idx++;
        if (args[idx] === '~' || args[idx] === '=') idx++;
        maxLen = Number(args[idx++]);
      }
      const idArg = args[idx++];
      if ((args.length - idx) % 2 !== 0 || args.length - idx < 2) {
        return { rawVal: null, formatted: '', err: "ERR wrong number of arguments for 'xadd' command" };
      }

      let e = getEntry(rt, key);
      if (e && e.data.type !== 'stream') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      if (!e) {
        setEntry(rt, key, {
          type: 'stream',
          entries: [],
          lastMs: 0,
          lastSeq: 0,
          groups: new Map(),
        });
        e = rt.store.get(key)!;
      }
      const st = e.data as Extract<RedisValueData, { type: 'stream' }>;
      let entryId = idArg;
      if (idArg === '*') {
        if (rt.nowMs > st.lastMs) {
          st.lastMs = rt.nowMs;
          st.lastSeq = 0;
        } else {
          st.lastSeq++;
        }
        entryId = `${st.lastMs}-${st.lastSeq}`;
      }
      const fields: Record<string, string> = {};
      for (let i = idx; i < args.length; i += 2) {
        fields[args[i]] = args[i + 1];
      }
      st.entries.push({ id: entryId, fields });
      if (maxLen !== null && Number.isFinite(maxLen) && st.entries.length > maxLen) {
        const drop = st.entries.length - maxLen;
        st.entries.splice(0, drop);
      }
      return { rawVal: entryId, formatted: `"${entryId}"` };
    }

    case 'XLEN': {
      const e = args[1] ? getEntry(rt, args[1]) : undefined;
      if (!e) return { rawVal: 0, formatted: '(integer) 0' };
      if (e.data.type !== 'stream') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      return { rawVal: e.data.entries.length, formatted: `(integer) ${e.data.entries.length}` };
    }

    case 'XRANGE':
    case 'XREVRANGE': {
      const [key, startId, endId] = [args[1], args[2] ?? '-', args[3] ?? '+'];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e) return { rawVal: [], formatted: '(empty array)' };
      if (e.data.type !== 'stream') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
      let list = [...e.data.entries];
      if (cmd === 'XREVRANGE') list.reverse();
      const countIdx = args.findIndex((a, idx) => idx >= 4 && a.toUpperCase() === 'COUNT');
      const count = countIdx >= 0 ? Number(args[countIdx + 1]) : Infinity;
      list = list
        .filter((en) => {
          const minId = cmd === 'XREVRANGE' ? endId : startId;
          const maxId = cmd === 'XREVRANGE' ? startId : endId;
          const okMin = minId === '-' || en.id >= minId;
          const okMax = maxId === '+' || en.id <= maxId;
          return okMin && okMax;
        })
        .slice(0, count);
      const formattedEntries: LuaVal[] = list.map((en) => [
        en.id,
        Object.entries(en.fields).flat(),
      ]);
      return { rawVal: formattedEntries, formatted: formatResp(formattedEntries) };
    }

    case 'XGROUP': {
      const sub = (args[1] ?? '').toUpperCase();
      if (sub === 'CREATE') {
        const [key, groupName, startId] = [args[2], args[3], args[4] ?? '$'];
        const mkStream = args.slice(5).some((a) => a.toUpperCase() === 'MKSTREAM');
        if (!key || !groupName) return { rawVal: null, formatted: '', err: 'ERR syntax: XGROUP CREATE key group id|$ [MKSTREAM]' };
        let e = getEntry(rt, key);
        if (!e) {
          if (!mkStream) {
            return {
              rawVal: null,
              formatted: '',
              err: 'ERR The XGROUP subcommand requires the key to exist. Note that for CREATE you may want to use the MKSTREAM option.',
            };
          }
          setEntry(rt, key, { type: 'stream', entries: [], lastMs: 0, lastSeq: 0, groups: new Map() });
          e = rt.store.get(key)!;
        }
        if (e.data.type !== 'stream') return { rawVal: null, formatted: '', err: WRONGTYPE_ERR };
        if (e.data.groups.has(groupName)) {
          return { rawVal: null, formatted: '', err: 'BUSYGROUP Consumer Group name already exists' };
        }
        const lastDeliveredIdx = startId === '0' || startId === '0-0' ? -1 : e.data.entries.length - 1;
        e.data.groups.set(groupName, { name: groupName, lastDeliveredIdx, pel: new Map() });
        return { rawVal: 'OK', formatted: 'OK' };
      }
      return { rawVal: 'OK', formatted: 'OK' };
    }

    case 'XREADGROUP': {
      // XREADGROUP GROUP group consumer [COUNT n] [BLOCK ms] STREAMS key [id]
      const grpIdx = args.findIndex((a) => a.toUpperCase() === 'GROUP');
      const streamsIdx = args.findIndex((a) => a.toUpperCase() === 'STREAMS');
      if (grpIdx < 0 || streamsIdx < 0) {
        return { rawVal: null, formatted: '', err: 'ERR syntax: XREADGROUP GROUP group consumer [COUNT n] STREAMS key >' };
      }
      const groupName = args[grpIdx + 1];
      const consumer = args[grpIdx + 2];
      const countIdx = args.findIndex((a) => a.toUpperCase() === 'COUNT');
      const count = countIdx >= 0 ? Math.max(1, Number(args[countIdx + 1])) : Infinity;
      const key = args[streamsIdx + 1];
      const reqId = args[streamsIdx + 2] ?? '>';

      const e = key ? getEntry(rt, key) : undefined;
      if (!e || e.data.type !== 'stream') {
        return { rawVal: null, formatted: '', err: `NOGROUP No such key '${key}' or consumer group '${groupName}'` };
      }
      const grp = e.data.groups.get(groupName);
      if (!grp) {
        return { rawVal: null, formatted: '', err: `NOGROUP No such consumer group '${groupName}' for key name '${key}'` };
      }

      let delivered: StreamEntry[] = [];
      if (reqId === '>') {
        const start = grp.lastDeliveredIdx + 1;
        delivered = e.data.entries.slice(start, start + count);
        grp.lastDeliveredIdx = start + delivered.length - 1;
        for (const en of delivered) {
          grp.pel.set(en.id, {
            id: en.id,
            consumer,
            deliveredAtMs: rt.nowMs,
            deliveryCount: 1,
          });
        }
      } else {
        // Đọc lại tin đang nằm trong PEL của chính consumer đó
        const myIds = new Set(
          [...grp.pel.values()].filter((p) => p.consumer === consumer).map((p) => p.id)
        );
        delivered = e.data.entries.filter((en) => myIds.has(en.id)).slice(0, count);
      }

      if (!delivered.length) return { rawVal: null, formatted: '(nil)' };
      const out: LuaVal = [[key, delivered.map((en) => [en.id, Object.entries(en.fields).flat()])]];
      return { rawVal: out, formatted: formatResp(out) };
    }

    case 'XPENDING': {
      const [key, groupName] = [args[1], args[2]];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e || e.data.type !== 'stream') return { rawVal: [], formatted: '(empty array)' };
      const grp = groupName ? e.data.groups.get(groupName) : undefined;
      if (!grp) return { rawVal: null, formatted: '', err: `NOGROUP No such consumer group '${groupName}'` };
      const items = [...grp.pel.values()];
      if (args.length <= 3) {
        const summary: LuaVal = [
          items.length,
          items[0]?.id ?? null,
          items[items.length - 1]?.id ?? null,
        ];
        return { rawVal: summary, formatted: formatResp(summary) };
      }
      const detailed: LuaVal = items.map((p) => [
        p.id,
        p.consumer,
        Math.max(0, rt.nowMs - p.deliveredAtMs),
        p.deliveryCount,
      ]);
      return { rawVal: detailed, formatted: formatResp(detailed) };
    }

    case 'XACK': {
      const [key, groupName, ...ids] = [args[1], args[2], ...args.slice(3)];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e || e.data.type !== 'stream') return { rawVal: 0, formatted: '(integer) 0' };
      const grp = groupName ? e.data.groups.get(groupName) : undefined;
      if (!grp) return { rawVal: 0, formatted: '(integer) 0' };
      let acked = 0;
      for (const id of ids) {
        if (grp.pel.delete(id)) acked++;
      }
      return { rawVal: acked, formatted: `(integer) ${acked}` };
    }

    case 'XAUTOCLAIM': {
      // XAUTOCLAIM key group consumer min-idle-time start [COUNT count]
      const [key, groupName, newConsumer, minIdleRaw, startId] = [
        args[1],
        args[2],
        args[3],
        Number(args[4]),
        args[5] ?? '0-0',
      ];
      const e = key ? getEntry(rt, key) : undefined;
      if (!e || e.data.type !== 'stream') return { rawVal: null, formatted: '', err: 'ERR no such stream' };
      const grp = groupName ? e.data.groups.get(groupName) : undefined;
      if (!grp) return { rawVal: null, formatted: '', err: `NOGROUP No such consumer group '${groupName}'` };

      const claimedIds: string[] = [];
      for (const p of grp.pel.values()) {
        if (p.id >= startId && rt.nowMs - p.deliveredAtMs >= minIdleRaw) {
          p.consumer = newConsumer;
          p.deliveredAtMs = rt.nowMs;
          p.deliveryCount++;
          claimedIds.push(p.id);
        }
      }
      const claimedEntries = e.data.entries
        .filter((en) => claimedIds.includes(en.id))
        .map((en) => [en.id, Object.entries(en.fields).flat()]);
      const res: LuaVal = ['0-0', claimedEntries, []];
      return { rawVal: res, formatted: formatResp(res) };
    }

    /* ---------------- ADMIN, CONFIG, ACL, CLUSTER, DIAGNOSTICS ---------------- */
    case 'CONFIG': {
      const sub = (args[1] ?? '').toUpperCase();
      if (sub === 'GET') {
        const pat = globToRegExp(args[2] ?? '*');
        const out: string[] = [];
        for (const [k, v] of Object.entries(rt.config)) {
          if (pat.test(k)) out.push(k, v);
        }
        return { rawVal: out, formatted: formatResp(out) };
      }
      if (sub === 'SET') {
        const [param, val] = [args[2]?.toLowerCase(), args[3]];
        if (!param || val === undefined) {
          return { rawVal: null, formatted: '', err: "ERR Wrong number of arguments for CONFIG SET" };
        }
        rt.config[param] = val;
        return { rawVal: 'OK', formatted: 'OK' };
      }
      if (sub === 'REWRITE' || sub === 'RESETSTAT') {
        return { rawVal: 'OK', formatted: 'OK' };
      }
      return { rawVal: null, formatted: '', err: `ERR Unknown subcommand '${sub}' for CONFIG` };
    }

    case 'ACL': {
      const sub = (args[1] ?? '').toUpperCase();
      if (sub === 'WHOAMI') return { rawVal: 'default', formatted: '"default"' };
      if (sub === 'LIST') {
        const rows = [...rt.aclUsers.values()].map(
          (u) =>
            `user ${u.username} ${u.enabled ? 'on' : 'off'} ${u.nopass ? 'nopass' : u.passwords.map(() => '#sha256').join(' ')} ${u.keyPatterns.map((p) => `~${p}`).join(' ') || 'resetkeys'} ${u.allowedCategories.map((c) => `+@${c}`).join(' ')} ${u.deniedCategories.map((c) => `-@${c}`).join(' ')}`.replace(/\s+/g, ' ').trim()
        );
        return { rawVal: rows, formatted: formatResp(rows) };
      }
      if (sub === 'SETUSER' && args[2]) {
        const username = args[2];
        const u: ParsedAclUserRule = rt.aclUsers.get(username) ?? {
          username,
          enabled: false,
          nopass: false,
          passwords: [],
          keyPatterns: [],
          allowedCategories: [],
          deniedCategories: [],
          allowedCommands: [],
          deniedCommands: [],
          line: 0,
        };
        applyAclTokensToRule(u, args.slice(3));
        rt.aclUsers.set(username, u);
        return { rawVal: 'OK', formatted: 'OK' };
      }
      if (sub === 'DELUSER' && args[2]) {
        let deleted = 0;
        for (const u of args.slice(2)) {
          if (u !== 'default' && rt.aclUsers.delete(u)) deleted++;
        }
        return { rawVal: deleted, formatted: `(integer) ${deleted}` };
      }
      return { rawVal: 'OK', formatted: 'OK' };
    }

    case 'INFO': {
      purgeExpired(rt);
      const section = (args[1] ?? 'all').toLowerCase();
      const maxMemBytes = parseRedisMemoryBytes(rt.config.maxmemory ?? '0') ?? 0;
      const approxBytes = rt.store.size * 128 + 1_048_576;
      const lines: string[] = [];
      if (section === 'all' || section === 'server') {
        lines.push('# Server', 'redis_version:8.0.0', 'os:Linux 6.8 x86_64', 'tcp_port:6379');
      }
      if (section === 'all' || section === 'memory') {
        lines.push(
          '# Memory',
          `used_memory:${approxBytes}`,
          `used_memory_human:${(approxBytes / (1024 * 1024)).toFixed(2)}M`,
          `maxmemory:${maxMemBytes}`,
          `maxmemory_policy:${rt.config['maxmemory-policy'] ?? 'noeviction'}`,
          'mem_fragmentation_ratio:1.08'
        );
      }
      if (section === 'all' || section === 'replication') {
        lines.push(
          '# Replication',
          `role:${rt.clusterRole}`,
          `master_repl_offset:${rt.replicationOffset}`,
          'connected_slaves:2'
        );
      }
      if (section === 'all' || section === 'persistence') {
        lines.push(
          '# Persistence',
          `aof_enabled:${rt.config.appendonly === 'yes' ? 1 : 0}`,
          'rdb_last_bgsave_status:ok'
        );
      }
      if (section === 'all' || section === 'keyspace') {
        let withExp = 0;
        for (const e of rt.store.values()) if (e.expiresAtMs !== undefined) withExp++;
        lines.push('# Keyspace', `db0:keys=${rt.store.size},expires=${withExp},avg_ttl=36000`);
      }
      const txt = lines.join('\n');
      return { rawVal: txt, formatted: txt };
    }

    case 'MEMORY': {
      const sub = (args[1] ?? '').toUpperCase();
      if (sub === 'USAGE' && args[2]) {
        const e = getEntry(rt, args[2]);
        if (!e) return { rawVal: null, formatted: '(nil)' };
        let bytes = 64 + args[2].length;
        if (e.data.type === 'string') bytes += e.data.val.length;
        else if (e.data.type === 'hash') bytes += e.data.fields.size * 48;
        else if (e.data.type === 'list') bytes += e.data.items.length * 32;
        else if (e.data.type === 'set') bytes += e.data.members.size * 40;
        else if (e.data.type === 'zset') bytes += e.data.scores.size * 64;
        else if (e.data.type === 'stream') bytes += e.data.entries.length * 96;
        return { rawVal: bytes, formatted: `(integer) ${bytes}` };
      }
      if (sub === 'DOCTOR') {
        return { rawVal: 'Sam, I have no memory problems', formatted: '"Sam, I have no memory problems"' };
      }
      return { rawVal: 0, formatted: '(integer) 0' };
    }

    case 'SLOWLOG': {
      const sub = (args[1] ?? 'GET').toUpperCase();
      if (sub === 'LEN') return { rawVal: rt.slowlog.length, formatted: `(integer) ${rt.slowlog.length}` };
      if (sub === 'RESET') {
        rt.slowlog = [];
        return { rawVal: 'OK', formatted: 'OK' };
      }
      const limit = Number(args[2] ?? 10);
      const list: LuaVal = rt.slowlog.slice(0, limit).map((s) => [s.id, Math.floor(rt.nowMs / 1000), s.durationMicros, [s.cmd]]);
      return { rawVal: list, formatted: formatResp(list) };
    }

    case 'LATENCY': {
      return {
        rawVal: 'Latency diagnostics: fork-bgsave=4ms, slow-command=KEYS * (142ms)',
        formatted: '"Latency diagnostics: fork-bgsave=4ms, slow-command=KEYS * (142ms)"',
      };
    }

    case 'CLUSTER': {
      const sub = (args[1] ?? '').toUpperCase();
      if (sub === 'KEYSLOT' && args[2] !== undefined) {
        const slot = crc16RedisSlot(args[2]);
        return { rawVal: slot, formatted: `(integer) ${slot}` };
      }
      if (sub === 'INFO') {
        const state = rt.clusterSlotsAssigned === 16384 ? 'ok' : 'fail';
        const txt = `cluster_state:${state}\ncluster_slots_assigned:${rt.clusterSlotsAssigned}\ncluster_slots_ok:${rt.clusterSlotsAssigned}\ncluster_known_nodes:6\ncluster_size:3`;
        return { rawVal: txt, formatted: txt };
      }
      if (sub === 'NODES') {
        const txt = [
          'n1 10.0.0.11:6379@16379 myself,master - 0 0 1 connected 0-5460',
          'n2 10.0.0.12:6379@16379 master - 0 0 2 connected 5461-10922',
          'n3 10.0.0.13:6379@16379 master - 0 0 3 connected 10923-16383',
          'r1 10.0.0.21:6379@16379 slave n1 0 0 1 connected',
          'r2 10.0.0.22:6379@16379 slave n2 0 0 2 connected',
          'r3 10.0.0.23:6379@16379 slave n3 0 0 3 connected',
        ].join('\n');
        return { rawVal: txt, formatted: txt };
      }
      return { rawVal: 'OK', formatted: 'OK' };
    }

    case 'ROLE': {
      const roleArr: LuaVal =
        rt.clusterRole === 'master'
          ? ['master', rt.replicationOffset, []]
          : ['slave', '10.0.0.10', 6379, 'connected', rt.replicationOffset];
      return { rawVal: roleArr, formatted: formatResp(roleArr) };
    }

    case 'REPLICAOF':
    case 'SLAVEOF': {
      if (args[1]?.toUpperCase() === 'NO' && args[2]?.toUpperCase() === 'ONE') {
        rt.clusterRole = 'master';
      } else {
        rt.clusterRole = 'replica';
      }
      return { rawVal: 'OK', formatted: 'OK' };
    }

    case 'BGSAVE':
      return { rawVal: 'Background saving started', formatted: 'Background saving started' };
    case 'BGREWRITEAOF':
      return { rawVal: 'Background append only file rewriting started', formatted: 'Background append only file rewriting started' };
    case 'SAVE':
      return { rawVal: 'OK', formatted: 'OK' };
    case 'WAIT':
      return { rawVal: Number(args[1] ?? 1), formatted: `(integer) ${Number(args[1] ?? 1)}` };

    default:
      return {
        rawVal: null,
        formatted: '',
        err: `ERR unknown command '${args[0]}', with args beginning with: ${args
          .slice(1, 3)
          .map((a) => `'${a}'`)
          .join(' ')}`,
      };
  }
}

export function executeRedisCommand(rt: RedisRuntime, args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const res = executeRedisCommandRaw(rt, args, true);
  if (res.err) {
    return { stdout: '', stderr: `(error) ${res.err}`, exitCode: 1 };
  }
  return { stdout: res.formatted, stderr: '', exitCode: 0 };
}

/* ============================================================================
 * 7. Dry-Run & Grader cho bài tập `redis-cli`
 * ============================================================================ */

function runRedisScript(
  script: string,
  initialState?: SimRedisWorld
): {
  rt: RedisRuntime;
  stdout: string;
  stderr: string;
  exitCode: number;
  errorLine: number | null;
} {
  const rt = createRedisRuntime(initialState);
  const steps = parseRedisScriptCommands(script);

  if (steps.length === 0) {
    return {
      rt,
      stdout: '',
      stderr: 'Chưa có câu lệnh Redis nào để thực thi (bỏ dấu # ở đầu dòng hoặc nhập lệnh mới).',
      exitCode: 1,
      errorLine: 1,
    };
  }

  const outLines: string[] = [];
  const errLines: string[] = [];

  for (const step of steps) {
    outLines.push(`127.0.0.1:6379> ${step.raw}`);
    const res = executeRedisCommand(rt, step.args);
    if (res.stdout) outLines.push(res.stdout);
    if (res.stderr) {
      errLines.push(`Dòng ${step.line}: ${res.stderr}`);
      return {
        rt,
        stdout: outLines.join('\n'),
        stderr: errLines.join('\n'),
        exitCode: 1,
        errorLine: step.line,
      };
    }
  }

  if (rt.inMulti) {
    return {
      rt,
      stdout: outLines.join('\n'),
      stderr: 'Giao dịch MULTI đang mở nhưng thiếu lệnh EXEC hoặc DISCARD ở cuối kịch bản.',
      exitCode: 1,
      errorLine: steps[steps.length - 1]?.line ?? 1,
    };
  }

  purgeExpired(rt);
  return {
    rt,
    stdout: outLines.join('\n'),
    stderr: '',
    exitCode: 0,
    errorLine: null,
  };
}

export function dryRunRedisCli(script: string, initialState?: SimRedisWorld): Omit<RunResult, 'ms'> {
  const res = runRedisScript(script, initialState);
  return { stdout: res.stdout, stderr: res.stderr, exitCode: res.exitCode };
}

export function evaluateRedisCliRules(
  rt: RedisRuntime,
  rules: RedisCliCheckRule[],
  stdoutHistory: string
): GradeTest[] {
  purgeExpired(rt);

  return rules.map((r): GradeTest => {
    if (r.target === 'key-exists') {
      const e = rt.store.get(r.key);
      const actualExists = Boolean(e);
      if (!r.exists) {
        return {
          name: r.id,
          doc: r.doc,
          status: !actualExists ? 'pass' : 'fail',
          got: !actualExists ? undefined : `key "${r.key}" vẫn còn tồn tại (type=${e?.data.type})`,
          expected: !actualExists ? undefined : `key "${r.key}" đã được xoá hoặc hết hạn`,
        };
      }
      const typeOk = !r.expectedType || e?.data.type === r.expectedType;
      const ok = actualExists && typeOk;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok ? undefined : e ? `type=${e.data.type}` : `(chưa có key "${r.key}")`,
        expected: ok ? undefined : `key "${r.key}" tồn tại${r.expectedType ? ` với kiểu ${r.expectedType}` : ''}`,
      };
    }

    if (r.target === 'string-value') {
      const e = rt.store.get(r.key);
      if (!e || e.data.type !== 'string') {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: e ? `(key đang là kiểu ${e.data.type})` : `(chưa có key "${r.key}")`,
          expected: `String key "${r.key}"`,
        };
      }
      let valToMatch: unknown = e.data.val;
      if (
        ('eq' in r.match && typeof r.match.eq === 'number') ||
        'gte' in r.match ||
        'lte' in r.match ||
        'gt' in r.match
      ) {
        const n = Number(e.data.val);
        if (Number.isFinite(n)) valToMatch = n;
      }
      const res = checkValueMatcher(valToMatch, r.match);
      return {
        name: r.id,
        doc: r.doc,
        status: res.ok ? 'pass' : 'fail',
        got: res.ok ? undefined : res.got,
        expected: res.ok ? undefined : `${r.key}: ${res.expected}`,
      };
    }

    if (r.target === 'ttl') {
      const e = rt.store.get(r.key);
      if (!e) {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: `(key "${r.key}" không tồn tại)`,
          expected: `key "${r.key}" tồn tại và có cấu hình TTL đúng`,
        };
      }
      if (r.persistent) {
        const ok = e.expiresAtMs === undefined;
        return {
          name: r.id,
          doc: r.doc,
          status: ok ? 'pass' : 'fail',
          got: ok ? undefined : `TTL=${Math.ceil((e.expiresAtMs! - rt.nowMs) / 1000)}s`,
          expected: ok ? undefined : 'TTL = -1 (bền vững, không tự hết hạn)',
        };
      }
      if (e.expiresAtMs === undefined) {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: 'TTL = -1 (chưa đặt thời gian hết hạn EX/EXPIRE)',
          expected: `TTL trong khoảng [${r.minSeconds ?? 1}s .. ${r.maxSeconds ?? '∞'}s]`,
        };
      }
      const ttlSec = Math.ceil(Math.max(0, e.expiresAtMs - rt.nowMs) / 1000);
      const minOk = r.minSeconds === undefined || ttlSec >= r.minSeconds;
      const maxOk = r.maxSeconds === undefined || ttlSec <= r.maxSeconds;
      const ok = minOk && maxOk;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok ? undefined : `TTL=${ttlSec}s`,
        expected: ok ? undefined : `TTL từ ${r.minSeconds ?? 0}s đến ${r.maxSeconds ?? '∞'}s`,
      };
    }

    if (r.target === 'hash-fields') {
      const e = rt.store.get(r.key);
      if (!e || e.data.type !== 'hash') {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: e ? `(type=${e.data.type})` : `(chưa có Hash "${r.key}")`,
          expected: `Hash "${r.key}"`,
        };
      }
      const h = e.data.fields;
      const ok = Object.entries(r.expected).every(([f, v]) => h.get(f) === String(v));
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok ? undefined : JSON.stringify(Object.fromEntries(h.entries())),
        expected: ok ? undefined : JSON.stringify(r.expected),
      };
    }

    if (r.target === 'list-items') {
      const e = rt.store.get(r.key);
      if (!e || e.data.type !== 'list') {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: e ? `(type=${e.data.type})` : `(chưa có List "${r.key}")`,
          expected: `List "${r.key}"`,
        };
      }
      const items = e.data.items;
      const eqOk = !r.expected || JSON.stringify(items) === JSON.stringify(r.expected);
      const lenOk = r.lengthEq === undefined || items.length === r.lengthEq;
      const hasOk = !r.contains || items.includes(r.contains);
      const ok = eqOk && lenOk && hasOk;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok ? undefined : JSON.stringify(items),
        expected: ok
          ? undefined
          : r.expected
            ? JSON.stringify(r.expected)
            : `len=${r.lengthEq ?? '*'}, contains=${r.contains ?? '*'}`,
      };
    }

    if (r.target === 'set-members') {
      const e = rt.store.get(r.key);
      if (!e || e.data.type !== 'set') {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: e ? `(type=${e.data.type})` : `(chưa có Set "${r.key}")`,
          expected: `Set "${r.key}"`,
        };
      }
      const mems = [...e.data.members].sort();
      const expSorted = r.expectedMembers ? [...r.expectedMembers].sort() : null;
      const eqOk = !expSorted || JSON.stringify(mems) === JSON.stringify(expSorted);
      const hasOk = !r.contains || e.data.members.has(r.contains);
      const cardOk = r.cardinalityEq === undefined || e.data.members.size === r.cardinalityEq;
      const ok = eqOk && hasOk && cardOk;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok ? undefined : JSON.stringify(mems),
        expected: ok
          ? undefined
          : expSorted
            ? JSON.stringify(expSorted)
            : `SCARD=${r.cardinalityEq ?? '*'}, contains=${r.contains ?? '*'}`,
      };
    }

    if (r.target === 'zset-ranking') {
      const e = rt.store.get(r.key);
      if (!e || e.data.type !== 'zset') {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: e ? `(type=${e.data.type})` : `(chưa có Sorted Set "${r.key}")`,
          expected: `Sorted Set "${r.key}"`,
        };
      }
      const descNames = sortedZSetEntries(e.data.scores, true).map(([m]) => m);
      const topOk =
        !r.topDesc || JSON.stringify(descNames.slice(0, r.topDesc.length)) === JSON.stringify(r.topDesc);
      const scOk =
        !r.memberScore || e.data.scores.get(r.memberScore.member) === r.memberScore.score;
      const cardOk = r.cardinalityEq === undefined || e.data.scores.size === r.cardinalityEq;
      const ok = topOk && scOk && cardOk;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok ? undefined : `top=${JSON.stringify(descNames.slice(0, 5))}`,
        expected: ok
          ? undefined
          : [
              r.topDesc ? `topDesc=${JSON.stringify(r.topDesc)}` : '',
              r.memberScore ? `${r.memberScore.member}=${r.memberScore.score}` : '',
              r.cardinalityEq !== undefined ? `ZCARD=${r.cardinalityEq}` : '',
            ]
              .filter(Boolean)
              .join(', '),
      };
    }

    if (r.target === 'stream-state') {
      const e = rt.store.get(r.key);
      if (!e || e.data.type !== 'stream') {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: e ? `(type=${e.data.type})` : `(chưa có Stream "${r.key}")`,
          expected: `Stream "${r.key}"`,
        };
      }
      const st = e.data;
      const lenOk = r.minLength === undefined || st.entries.length >= r.minLength;
      const grpOk = !r.hasGroup || st.groups.has(r.hasGroup);
      const pelCount = r.maxPelCount ? (st.groups.get(r.maxPelCount.group)?.pel.size ?? Infinity) : 0;
      const pelOk = !r.maxPelCount || pelCount <= r.maxPelCount.max;
      const ok = lenOk && grpOk && pelOk;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok
          ? undefined
          : `XLEN=${st.entries.length}, groups=[${[...st.groups.keys()].join(',')}]${r.maxPelCount ? `, PEL(${r.maxPelCount.group})=${pelCount}` : ''}`,
        expected: ok
          ? undefined
          : [
              r.minLength !== undefined ? `XLEN >= ${r.minLength}` : '',
              r.hasGroup ? `có group "${r.hasGroup}"` : '',
              r.maxPelCount ? `PEL(${r.maxPelCount.group}) <= ${r.maxPelCount.max}` : '',
            ]
              .filter(Boolean)
              .join(', '),
      };
    }

    if (r.target === 'config-param') {
      const actual = rt.config[r.param.toLowerCase()];
      const ok = actual === r.expected;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok ? undefined : `${r.param} = ${actual ?? '(chưa đặt)'}`,
        expected: ok ? undefined : `${r.param} = ${r.expected}`,
      };
    }

    if (r.target === 'acl-user') {
      const u = rt.aclUsers.get(r.username);
      if (!u) {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: `(chưa tạo ACL user "${r.username}")`,
          expected: `ACL SETUSER ${r.username} ...`,
        };
      }
      const enOk = r.enabled === undefined || u.enabled === r.enabled;
      const keyOk = !r.hasKeyPattern || u.keyPatterns.includes(r.hasKeyPattern);
      const dangerOk =
        !r.deniesDangerous ||
        u.deniedCategories.includes('dangerous') ||
        (u.deniedCategories.includes('all') && !u.allowedCategories.includes('all'));
      const ok = enOk && keyOk && dangerOk;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok
          ? undefined
          : `enabled=${u.enabled}, keys=[${u.keyPatterns.join(',')}], -@[${u.deniedCategories.join(',')}]`,
        expected: ok
          ? undefined
          : `enabled=${r.enabled ?? true}${r.hasKeyPattern ? `, ~${r.hasKeyPattern}` : ''}${r.deniesDangerous ? ', -@dangerous' : ''}`,
      };
    }

    if (r.target === 'command-used') {
      const joined = rt.commandHistory.join('\n');
      const mustOk = !r.mustUseRegex || new RegExp(r.mustUseRegex, 'im').test(joined);
      const forbidOk = !r.forbidRegex || !new RegExp(r.forbidRegex, 'im').test(joined);
      const ok = mustOk && forbidOk;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok ? undefined : rt.commandHistory.join(' ; '),
        expected: ok
          ? undefined
          : [
              r.mustUseRegex ? `sử dụng lệnh khớp /${r.mustUseRegex}/i` : '',
              r.forbidRegex ? `KHÔNG dùng lệnh bị cấm /${r.forbidRegex}/i` : '',
            ]
              .filter(Boolean)
              .join(' và '),
      };
    }

    if (r.target === 'stdout-contains') {
      const ok = stdoutHistory.includes(r.contains);
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok ? undefined : '(kết quả đầu ra chưa chứa chuỗi kỳ vọng)',
        expected: ok ? undefined : `stdout chứa "${r.contains}"`,
      };
    }

    // target === 'same-hash-slot'
    const slots = r.keys.map((k) => ({ k, slot: crc16RedisSlot(k) }));
    const uniqueSlots = new Set(slots.map((s) => s.slot));
    // Ngoài việc các key trong rule cùng slot, kiểm tra xem người học đã thực sự ghi hoặc thao tác với các key dùng {hashtag} cùng slot chưa
    const storeKeys = [...rt.store.keys()];
    let actualOk = uniqueSlots.size === 1;
    if (storeKeys.length >= r.keys.length && r.keys.length === 0) {
      const stSlots = new Set(storeKeys.map((k) => crc16RedisSlot(k)));
      actualOk = stSlots.size === 1;
    } else if (r.keys.length > 0) {
      const allExistInSameSlot =
        uniqueSlots.size === 1 && r.keys.every((k) => rt.store.has(k) || rt.commandHistory.some((c) => c.includes(k)));
      actualOk = allExistInSameSlot;
    }
    return {
      name: r.id,
      doc: r.doc,
      status: actualOk ? 'pass' : 'fail',
      got: actualOk ? undefined : slots.map((s) => `${s.k}->slot ${s.slot}`).join(', '),
      expected: actualOk ? undefined : `tất cả keys [${r.keys.join(', ')}] được tạo/truy cập và nằm trên CÙNG 1 Hash Slot`,
    };
  });
}

export function gradeRedisCliSpec(
  script: string,
  initialState: SimRedisWorld | undefined,
  rules: RedisCliCheckRule[],
  extraStdoutHistory = ''
): GradeResult & { errorLine?: number | null } {
  const exec = runRedisScript(script, initialState);
  if (exec.exitCode !== 0) {
    return {
      import_error: exec.stderr || `Kịch bản dừng với mã lỗi ${exec.exitCode}`,
      tests: [],
      errorLine: exec.errorLine,
    };
  }
  const combinedStdout = [extraStdoutHistory, exec.stdout].filter(Boolean).join('\n');
  const tests = evaluateRedisCliRules(exec.rt, rules, combinedStdout);
  return { import_error: null, tests, errorLine: null };
}

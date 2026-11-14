import type { GradeResult, GradeTest, RedisConfCheckRule, RunResult, ValueMatcher } from '../types';
import { checkValueMatcher } from './yamlGrader';

export interface ParsedRedisConfEntry {
  directive: string;
  args: string[];
  rawValue: string;
  line: number;
}

export interface ParsedAclUserRule {
  username: string;
  enabled: boolean;
  nopass: boolean;
  passwords: string[];
  keyPatterns: string[];
  allowedCategories: string[];
  deniedCategories: string[];
  allowedCommands: string[];
  deniedCommands: string[];
  line: number;
}

export interface ParsedRedisConf {
  entries: ParsedRedisConfEntry[];
  byDirective: Map<string, ParsedRedisConfEntry[]>;
  aclUsers: Map<string, ParsedAclUserRule>;
  renamedCommands: Map<string, string>;
  error: string | null;
  errorLine: number | null;
}

/** Tách token một dòng redis.conf, hỗ trợ chuỗi bọc trong "..." hoặc '...' */
export function tokenizeRedisConfLine(line: string): { tokens: string[]; error?: string } {
  const tokens: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  let hadQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === '\\' && i + 1 < line.length) {
        const nxt = line[++i];
        if (nxt === 'n') cur += '\n';
        else if (nxt === 't') cur += '\t';
        else if (nxt === 'r') cur += '\r';
        else cur += nxt;
      } else if (ch === quote) {
        quote = null;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '#') {
        // Trong redis.conf, dấu # đầu dòng hoặc sau khoảng trắng mở đầu comment (trừ token ACL #<sha256> không có khoảng trắng sau #)
        if (cur.length === 0 && tokens.length === 0) break;
        if (cur.length === 0 && tokens[0]?.toLowerCase() !== 'user') break;
        if (cur.length === 0 && tokens[0]?.toLowerCase() === 'user') {
          // Trong dòng ACL `user ... #hash`, dấu # gắn liền với chuỗi hex SHA-256; nếu sau # là khoảng trắng thì là comment
          if (i + 1 >= line.length || /\s/.test(line[i + 1])) break;
          cur += ch;
          continue;
        }
        cur += ch;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
        hadQuote = true;
      } else if (/\s/.test(ch)) {
        if (cur.length > 0 || hadQuote) {
          tokens.push(cur);
          cur = '';
          hadQuote = false;
        }
      } else {
        cur += ch;
      }
    }
  }

  if (quote) {
    return { tokens: [], error: `Thiếu dấu đóng nháy ${quote} trên dòng cấu hình.` };
  }
  if (cur.length > 0 || hadQuote) {
    tokens.push(cur);
  }
  return { tokens };
}

/**
 * Quy đổi đơn vị bộ nhớ chuẩn của Redis (`memtoll` trong `src/config.c`):
 * - `k` = 1000, `kb` = 1024
 * - `m` = 1_000_000, `mb` = 1024^2
 * - `g` = 1_000_000_000, `gb` = 1024^3
 */
export function parseRedisMemoryBytes(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.round(val);
  if (typeof val !== 'string') return null;
  const s = val.trim().toLowerCase();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(b|k|kb|m|mb|g|gb|t|tb)?$/);
  if (!m) return null;
  const num = Number(m[1]);
  const unit = m[2] ?? 'b';
  switch (unit) {
    case 'b':
      return Math.round(num);
    case 'k':
      return Math.round(num * 1000);
    case 'kb':
      return Math.round(num * 1024);
    case 'm':
      return Math.round(num * 1_000_000);
    case 'mb':
      return Math.round(num * 1024 * 1024);
    case 'g':
      return Math.round(num * 1_000_000_000);
    case 'gb':
      return Math.round(num * 1024 * 1024 * 1024);
    case 't':
      return Math.round(num * 1_000_000_000_000);
    case 'tb':
      return Math.round(num * 1024 * 1024 * 1024 * 1024);
    default:
      return null;
  }
}

export function applyAclTokensToRule(rule: ParsedAclUserRule, tokens: string[]): void {
  for (const raw of tokens) {
    const t = raw.trim();
    if (!t) continue;
    const lower = t.toLowerCase();
    if (lower === 'on') {
      rule.enabled = true;
    } else if (lower === 'off') {
      rule.enabled = false;
    } else if (lower === 'nopass') {
      rule.nopass = true;
      rule.passwords = [];
    } else if (lower === 'resetpass') {
      rule.nopass = false;
      rule.passwords = [];
    } else if (t.startsWith('>')) {
      rule.nopass = false;
      rule.passwords.push(t.slice(1));
    } else if (t.startsWith('#') && t.length > 8) {
      rule.nopass = false;
      rule.passwords.push(t);
    } else if (lower === 'allkeys' || t === '~*') {
      if (!rule.keyPatterns.includes('*')) rule.keyPatterns.push('*');
    } else if (lower === 'resetkeys') {
      rule.keyPatterns = [];
    } else if (t.startsWith('~')) {
      rule.keyPatterns.push(t.slice(1));
    } else if (t.startsWith('%R~') || t.startsWith('%W~') || t.startsWith('%RW~')) {
      const idx = t.indexOf('~');
      rule.keyPatterns.push(t.slice(idx + 1));
    } else if (lower === 'allcommands' || lower === '+@all') {
      if (!rule.allowedCategories.includes('all')) rule.allowedCategories.push('all');
      rule.deniedCategories = rule.deniedCategories.filter((c) => c !== 'all');
    } else if (lower === 'nocommands' || lower === '-@all') {
      rule.allowedCategories = [];
      rule.allowedCommands = [];
      if (!rule.deniedCategories.includes('all')) rule.deniedCategories.push('all');
    } else if (t.startsWith('+@')) {
      const cat = lower.slice(2);
      if (!rule.allowedCategories.includes(cat)) rule.allowedCategories.push(cat);
      rule.deniedCategories = rule.deniedCategories.filter((c) => c !== cat);
    } else if (t.startsWith('-@')) {
      const cat = lower.slice(2);
      if (!rule.deniedCategories.includes(cat)) rule.deniedCategories.push(cat);
      rule.allowedCategories = rule.allowedCategories.filter((c) => c !== cat);
    } else if (t.startsWith('+')) {
      const cmd = lower.slice(1);
      if (!rule.allowedCommands.includes(cmd)) rule.allowedCommands.push(cmd);
      rule.deniedCommands = rule.deniedCommands.filter((c) => c !== cmd);
    } else if (t.startsWith('-')) {
      const cmd = lower.slice(1);
      if (!rule.deniedCommands.includes(cmd)) rule.deniedCommands.push(cmd);
      rule.allowedCommands = rule.allowedCommands.filter((c) => c !== cmd);
    }
  }
}

export function parseRedisConf(source: string): ParsedRedisConf {
  const entries: ParsedRedisConfEntry[] = [];
  const byDirective = new Map<string, ParsedRedisConfEntry[]>();
  const aclUsers = new Map<string, ParsedAclUserRule>();
  const renamedCommands = new Map<string, string>();

  const lines = source.replace(/\r/g, '').split('\n');
  for (let idx = 0; idx < lines.length; idx++) {
    const lineNo = idx + 1;
    const raw = lines[idx].trim();
    if (!raw || raw.startsWith('#')) continue;

    const { tokens, error } = tokenizeRedisConfLine(raw);
    if (error) {
      return {
        entries: [],
        byDirective,
        aclUsers,
        renamedCommands,
        error: `Lỗi cú pháp redis.conf ở dòng ${lineNo}: ${error}`,
        errorLine: lineNo,
      };
    }
    if (tokens.length === 0) continue;
    if (tokens.length === 1) {
      return {
        entries: [],
        byDirective,
        aclUsers,
        renamedCommands,
        error: `Lỗi cú pháp redis.conf ở dòng ${lineNo}: Chỉ thị "${tokens[0]}" thiếu giá trị đi kèm.`,
        errorLine: lineNo,
      };
    }

    const directive = tokens[0].toLowerCase();
    const args = tokens.slice(1);
    const rawValue = args.join(' ');
    const entry: ParsedRedisConfEntry = { directive, args, rawValue, line: lineNo };
    entries.push(entry);

    const bucket = byDirective.get(directive) ?? [];
    bucket.push(entry);
    byDirective.set(directive, bucket);

    if (directive === 'user' && args.length >= 1) {
      const username = args[0];
      const existing: ParsedAclUserRule = aclUsers.get(username) ?? {
        username,
        enabled: false,
        nopass: false,
        passwords: [],
        keyPatterns: [],
        allowedCategories: [],
        deniedCategories: [],
        allowedCommands: [],
        deniedCommands: [],
        line: lineNo,
      };
      existing.line = lineNo;
      applyAclTokensToRule(existing, args.slice(1));
      aclUsers.set(username, existing);
    } else if (directive === 'rename-command' && args.length >= 2) {
      renamedCommands.set(args[0].toUpperCase(), args[1]);
    }
  }

  if (entries.length === 0) {
    return {
      entries,
      byDirective,
      aclUsers,
      renamedCommands,
      error: 'File redis.conf đang trống hoặc chỉ có dòng chú thích (#).',
      errorLine: 1,
    };
  }

  return {
    entries,
    byDirective,
    aclUsers,
    renamedCommands,
    error: null,
    errorLine: null,
  };
}

function coerceConfValueForMatcher(rawVal: string | undefined, matcher: ValueMatcher): unknown {
  if (rawVal === undefined) return undefined;
  if ('gte' in matcher || 'lte' in matcher || 'gt' in matcher) {
    const n = Number(rawVal);
    return Number.isFinite(n) ? n : rawVal;
  }
  if ('eq' in matcher && typeof matcher.eq === 'number') {
    const n = Number(rawVal);
    return Number.isFinite(n) ? n : rawVal;
  }
  if ('neq' in matcher && typeof matcher.neq === 'number') {
    const n = Number(rawVal);
    return Number.isFinite(n) ? n : rawVal;
  }
  return rawVal;
}

export function gradeRedisConfSpec(
  source: string,
  rules: RedisConfCheckRule[]
): GradeResult & { errorLine?: number | null } {
  const parsed = parseRedisConf(source);
  if (parsed.error) {
    return { import_error: parsed.error, tests: [], errorLine: parsed.errorLine };
  }

  const tests: GradeTest[] = [];

  for (const r of rules) {
    if (r.kind === 'directive') {
      const key = r.directive.toLowerCase();
      const list = parsed.byDirective.get(key);
      const last = list?.[list.length - 1];

      // Nếu chỉ thị xuất hiện nhiều lần (vd `save 900 1`, `save 60 1000`), kiểm tra cả giá trị cuối lẫn mảng các giá trị
      let res = checkValueMatcher(coerceConfValueForMatcher(last?.rawValue, r.match), r.match);
      if (!res.ok && list && list.length > 1) {
        const multiRes = checkValueMatcher(
          list.map((e) => e.rawValue),
          r.match
        );
        if (multiRes.ok) res = multiRes;
        else {
          for (const item of list) {
            const single = checkValueMatcher(coerceConfValueForMatcher(item.rawValue, r.match), r.match);
            if (single.ok) {
              res = single;
              break;
            }
          }
        }
      }

      tests.push({
        name: r.id,
        doc: r.doc,
        status: res.ok ? 'pass' : 'fail',
        got: res.ok ? undefined : last ? `${key} ${last.rawValue}` : `(chưa khai báo "${key}")`,
        expected: res.ok ? undefined : `${key}: ${res.expected}`,
        line: res.ok ? undefined : last?.line,
      });
      continue;
    }

    if (r.kind === 'memory-bytes') {
      const key = r.directive.toLowerCase();
      const list = parsed.byDirective.get(key);
      const last = list?.[list.length - 1];
      const bytes = last ? parseRedisMemoryBytes(last.rawValue) : null;

      let ok = bytes !== null;
      if (ok && bytes !== null) {
        if (r.eqBytes !== undefined && bytes !== r.eqBytes) ok = false;
        if (r.minBytes !== undefined && bytes < r.minBytes) ok = false;
        if (r.maxBytes !== undefined && bytes > r.maxBytes) ok = false;
      }

      const expParts: string[] = [];
      if (r.eqBytes !== undefined) expParts.push(`= ${Math.round(r.eqBytes / (1024 * 1024))}mb (${r.eqBytes} bytes)`);
      if (r.minBytes !== undefined) expParts.push(`>= ${Math.round(r.minBytes / (1024 * 1024))}mb`);
      if (r.maxBytes !== undefined) expParts.push(`<= ${Math.round(r.maxBytes / (1024 * 1024))}mb`);

      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok ? undefined : last ? `${key} ${last.rawValue}` : `(chưa khai báo "${key}")`,
        expected: ok ? undefined : `${key} ${expParts.join(', ')}`,
        line: ok ? undefined : last?.line,
      });
      continue;
    }

    if (r.kind === 'acl-rule') {
      const u = parsed.aclUsers.get(r.username);
      if (!u) {
        tests.push({
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: `(chưa khai báo ACL "user ${r.username} ...")`,
          expected: `user ${r.username} ${r.enabled ? 'on' : 'off'} ...`,
        });
        continue;
      }

      const enabledOk = u.enabled === r.enabled;
      const passOk = !r.requirePassword || (!u.nopass && u.passwords.length > 0);
      const keyOk = !r.keyPattern || u.keyPatterns.includes(r.keyPattern);
      const forbidCat = r.forbidCategory?.replace(/^[-+]?@/, '').toLowerCase();
      const forbidOk =
        !forbidCat ||
        u.deniedCategories.includes(forbidCat) ||
        (u.deniedCategories.includes('all') && !u.allowedCategories.includes(forbidCat) && !u.allowedCategories.includes('all'));
      const reqCat = r.requireCategory?.replace(/^[-+]?@/, '').toLowerCase();
      const reqOk = !reqCat || u.allowedCategories.includes(reqCat) || u.allowedCategories.includes('all');

      const ok = enabledOk && passOk && keyOk && forbidOk && reqOk;
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok
          ? undefined
          : `user ${u.username} ${u.enabled ? 'on' : 'off'} passwords=${u.passwords.length} keys=[${u.keyPatterns.join(',')}] +@[${u.allowedCategories.join(',')}] -@[${u.deniedCategories.join(',')}]`,
        expected: ok
          ? undefined
          : [
              `user ${r.username} ${r.enabled ? 'on' : 'off'}`,
              r.requirePassword ? 'có mật khẩu (>pass)' : '',
              r.keyPattern ? `~${r.keyPattern}` : '',
              forbidCat ? `-@${forbidCat}` : '',
              reqCat ? `+@${reqCat}` : '',
            ]
              .filter(Boolean)
              .join(' '),
        line: ok ? undefined : u.line,
      });
      continue;
    }

    if (r.kind === 'rename-or-disable') {
      const cmdUpper = r.dangerousCommand.toUpperCase();
      const cmdLower = r.dangerousCommand.toLowerCase();
      const renamed = parsed.renamedCommands.get(cmdUpper);
      const isRenamed = renamed !== undefined && renamed !== cmdUpper;

      const defaultAcl = parsed.aclUsers.get('default');
      const isAclBlocked = Boolean(
        defaultAcl &&
          (!defaultAcl.enabled ||
            defaultAcl.deniedCommands.includes(cmdLower) ||
            defaultAcl.deniedCategories.includes('dangerous') ||
            (defaultAcl.deniedCategories.includes('all') &&
              !defaultAcl.allowedCategories.includes('all') &&
              !defaultAcl.allowedCategories.includes('dangerous') &&
              !defaultAcl.allowedCommands.includes(cmdLower)))
      );

      const ok = isRenamed || isAclBlocked;
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: ok ? undefined : `Lệnh nguy hiểm ${cmdUpper} vẫn đang mở mặc định`,
        expected: ok
          ? undefined
          : `Vô hiệu hoá bằng \`rename-command ${cmdUpper} ""\` hoặc chặn trong ACL \`user default ... -${cmdLower}\` / \`-@dangerous\``,
      });
    }
  }

  const firstFailLine = tests.find((t) => t.status !== 'pass' && t.line)?.line ?? null;
  return { import_error: null, tests, errorLine: firstFailLine };
}

export function dryRunRedisConf(source: string): Omit<RunResult, 'ms'> {
  const parsed = parseRedisConf(source);
  if (parsed.error) {
    return { stdout: '', stderr: parsed.error, exitCode: 1 };
  }
  const lines: string[] = [`✔ Cú pháp redis.conf hợp lệ (${parsed.entries.length} chỉ thị):`];
  const maxmem = parsed.byDirective.get('maxmemory')?.slice(-1)[0]?.rawValue;
  const policy = parsed.byDirective.get('maxmemory-policy')?.slice(-1)[0]?.rawValue;
  const aof = parsed.byDirective.get('appendonly')?.slice(-1)[0]?.rawValue;
  if (maxmem || policy) {
    const bytes = maxmem ? parseRedisMemoryBytes(maxmem) : null;
    const mbText = bytes !== null ? ` (${Math.round(bytes / (1024 * 1024))} MiB)` : '';
    lines.push(`  • Memory: maxmemory=${maxmem ?? '(không giới hạn)'}${mbText}, policy=${policy ?? 'noeviction'}`);
  }
  if (aof) {
    const fsync = parsed.byDirective.get('appendfsync')?.slice(-1)[0]?.rawValue ?? 'everysec';
    lines.push(`  • Persistence: appendonly=${aof}, appendfsync=${fsync}`);
  }
  if (parsed.aclUsers.size > 0) {
    lines.push(
      `  • ACL Users (${parsed.aclUsers.size}): ${[...parsed.aclUsers.values()]
        .map((u) => `${u.username}(${u.enabled ? 'on' : 'off'})`)
        .join(', ')}`
    );
  }
  for (const e of parsed.entries.slice(0, 8)) {
    lines.push(`  [L${e.line}] ${e.directive} ${e.rawValue}`);
  }
  if (parsed.entries.length > 8) {
    lines.push(`  ... và ${parsed.entries.length - 8} chỉ thị khác.`);
  }
  return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
}

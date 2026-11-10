import type {
  DockerfileCheckRule,
  DockerignoreCheckRule,
  GradeResult,
  GradeTest,
  RunResult,
} from '../types';

export interface DockerfileInstruction {
  instruction: string;
  rawArgs: string;
  flags: Record<string, string | true>;
  bodyArgs: string;
  isExecForm: boolean;
  jsonArgs?: string[];
  line: number;
  indexInStage: number;
}

export interface DockerfileStage {
  index: number;
  baseImage: string;
  alias: string | null;
  fromLine: number;
  instructions: DockerfileInstruction[];
}

export interface ParsedDockerfile {
  stages: DockerfileStage[];
  globalArgs: DockerfileInstruction[];
  error: string | null;
  errorLine: number | null;
}

const VALID_INSTRUCTIONS = new Set([
  'FROM',
  'RUN',
  'CMD',
  'LABEL',
  'MAINTAINER',
  'EXPOSE',
  'ENV',
  'ADD',
  'COPY',
  'ENTRYPOINT',
  'VOLUME',
  'USER',
  'WORKDIR',
  'ARG',
  'ONBUILD',
  'STOPSIGNAL',
  'HEALTHCHECK',
  'SHELL',
]);

export function parseDockerfile(source: string): ParsedDockerfile {
  const rawLines = source.replace(/\r/g, '').split('\n');
  const logicalLines: { text: string; line: number }[] = [];

  let i = 0;
  while (i < rawLines.length) {
    const startLine = i + 1;
    const trimmed = rawLines[i].trim();
    if (!trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }
    let acc = rawLines[i];
    while (acc.trimEnd().endsWith('\\') && i + 1 < rawLines.length) {
      acc = acc.trimEnd().slice(0, -1) + ' ';
      i++;
      const nextRaw = rawLines[i];
      if (!nextRaw.trim().startsWith('#')) {
        acc += nextRaw.trim();
      }
    }
    logicalLines.push({ text: acc.trim(), line: startLine });
    i++;
  }

  const stages: DockerfileStage[] = [];
  const globalArgs: DockerfileInstruction[] = [];
  let currentStage: DockerfileStage | null = null;

  for (const { text, line } of logicalLines) {
    const m = text.match(/^([A-Za-z]+)\s+([\s\S]*)$/);
    if (!m) {
      return {
        stages: [],
        globalArgs: [],
        error: `Lỗi cú pháp Dockerfile ở dòng ${line}: "${text}" không phải là chỉ thị hợp lệ.`,
        errorLine: line,
      };
    }
    const inst = m[1].toUpperCase();
    if (!VALID_INSTRUCTIONS.has(inst)) {
      return {
        stages: [],
        globalArgs: [],
        error: `Chỉ thị không hợp lệ ở dòng ${line}: "${m[1]}". Kiểm tra lại chính tả (FROM, WORKDIR, COPY, RUN, CMD...).`,
        errorLine: line,
      };
    }
    const rawArgs = m[2].trim();

    // Tách flags --key=val hoặc --flag ở đầu phần tham số
    const flags: Record<string, string | true> = {};
    let rest = rawArgs;
    while (rest.startsWith('--')) {
      const fm = rest.match(/^--([a-zA-Z0-9_-]+)(?:=([^\s]+))?\s*([\s\S]*)$/);
      if (!fm) break;
      flags[fm[1]] = fm[2] ?? true;
      rest = fm[3].trim();
    }

    let isExecForm = false;
    let jsonArgs: string[] | undefined;
    if ((inst === 'CMD' || inst === 'ENTRYPOINT' || inst === 'RUN' || inst === 'VOLUME' || inst === 'SHELL') && rest.startsWith('[')) {
      try {
        const parsed = JSON.parse(rest);
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
          isExecForm = true;
          jsonArgs = parsed;
        } else {
          return {
            stages: [],
            globalArgs: [],
            error: `Lỗi cú pháp Exec Form ở dòng ${line}: ${inst} mảng JSON chỉ được chứa các chuỗi trong dấu nháy kép "...".`,
            errorLine: line,
          };
        }
      } catch {
        return {
          stages: [],
          globalArgs: [],
          error: `Lỗi mảng JSON ở dòng ${line}: Exec Form của ${inst} bắt buộc dùng dấu nháy kép "..." hợp lệ (ví dụ: CMD ["node", "server.js"]).`,
          errorLine: line,
        };
      }
    }

    if (inst === 'FROM') {
      const fromMatch = rest.match(/^([^\s]+)(?:\s+[Aa][Ss]\s+([A-Za-z0-9_.-]+))?$/);
      if (!fromMatch) {
        return {
          stages: [],
          globalArgs: [],
          error: `Lỗi cú pháp FROM ở dòng ${line}: "${text}".`,
          errorLine: line,
        };
      }
      currentStage = {
        index: stages.length,
        baseImage: fromMatch[1],
        alias: fromMatch[2] ?? null,
        fromLine: line,
        instructions: [],
      };
      stages.push(currentStage);
      const fromNode: DockerfileInstruction = {
        instruction: 'FROM',
        rawArgs,
        flags,
        bodyArgs: rest,
        isExecForm: false,
        line,
        indexInStage: 0,
      };
      currentStage.instructions.push(fromNode);
      continue;
    }

    const node: DockerfileInstruction = {
      instruction: inst,
      rawArgs,
      flags,
      bodyArgs: rest,
      isExecForm,
      jsonArgs,
      line,
      indexInStage: currentStage ? currentStage.instructions.length : globalArgs.length,
    };

    if (!currentStage) {
      if (inst === 'ARG') {
        globalArgs.push(node);
        continue;
      }
      return {
        stages: [],
        globalArgs: [],
        error: `Lỗi ở dòng ${line}: Dockerfile phải bắt đầu bằng chỉ thị FROM (chỉ có ARG mới được đứng trước FROM).`,
        errorLine: line,
      };
    }

    currentStage.instructions.push(node);
  }

  if (!stages.length) {
    return {
      stages: [],
      globalArgs: [],
      error: 'Dockerfile chưa có chỉ thị FROM nào.',
      errorLine: 1,
    };
  }

  return { stages, globalArgs, error: null, errorLine: null };
}

function selectStage(
  stages: DockerfileStage[],
  selector?: 'first' | 'last' | number | string
): DockerfileStage | undefined {
  if (selector === undefined || selector === 'last') return stages[stages.length - 1];
  if (selector === 'first') return stages[0];
  if (typeof selector === 'number') return stages[selector];
  return stages.find((s) => s.alias === selector);
}

export function gradeDockerfileSpec(
  source: string,
  rules: DockerfileCheckRule[]
): GradeResult & { errorLine?: number | null } {
  const parsed = parseDockerfile(source);
  if (parsed.error) {
    return { import_error: parsed.error, tests: [], errorLine: parsed.errorLine };
  }

  const tests: GradeTest[] = [];
  const { stages } = parsed;

  for (const r of rules) {
    if (r.kind === 'stage-count') {
      const ok = (r.eq !== undefined ? stages.length === r.eq : true) && (r.min !== undefined ? stages.length >= r.min : true);
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: `${stages.length} stage`,
        expected: r.eq !== undefined ? `đúng ${r.eq} stage (Multi-stage)` : `tối thiểu ${r.min} stage`,
        line: stages[0]?.fromLine,
      });
      continue;
    }

    if (r.kind === 'base-image') {
      const st = selectStage(stages, r.stage);
      if (!st) {
        tests.push({
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: '(không tìm thấy stage)',
          expected: `stage "${String(r.stage)}"`,
        });
        continue;
      }
      const img = st.baseImage;
      const tag = img.includes(':') ? img.split(':')[1] : '';
      const prefixOk = !r.imagePrefix || img.startsWith(r.imagePrefix);
      const latestOk = !r.notLatest || (Boolean(tag) && tag !== 'latest' && !tag.includes('____'));
      const variantOk = !r.variantContains || tag.includes(r.variantContains) || img.includes(r.variantContains);
      const aliasOk = !r.alias || st.alias === r.alias;
      const ok = prefixOk && latestOk && variantOk && aliasOk;
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: `FROM ${img}${st.alias ? ` AS ${st.alias}` : ''}`,
        expected: `FROM ${r.imagePrefix ?? '<image>'}:${r.variantContains ? `*${r.variantContains}*` : '<pinned-tag>'}${r.alias ? ` AS ${r.alias}` : ''}`,
        line: ok ? undefined : st.fromLine,
      });
      continue;
    }

    if (r.kind === 'instruction') {
      const targetStages = r.stage !== undefined ? [selectStage(stages, r.stage)].filter(Boolean) as DockerfileStage[] : stages;
      const wantInst = r.instruction.toUpperCase();
      const candidates = targetStages.flatMap((s) => s.instructions.filter((i) => i.instruction === wantInst));
      const shouldExist = r.exists ?? true;

      if (!shouldExist) {
        const violated = candidates.find((c) => (!r.argsRegex || new RegExp(r.argsRegex).test(c.rawArgs)));
        tests.push({
          name: r.id,
          doc: r.doc,
          status: violated ? 'fail' : 'pass',
          got: violated ? `${violated.instruction} ${violated.rawArgs}` : 'không có',
          expected: `không dùng ${wantInst}${r.argsRegex ? ` khớp /${r.argsRegex}/` : ''}`,
          line: violated?.line,
        });
        continue;
      }

      const matched = candidates.find((c) => {
        if (r.argsRegex && !new RegExp(r.argsRegex).test(c.rawArgs)) return false;
        if (r.notArgsRegex && new RegExp(r.notArgsRegex).test(c.rawArgs)) return false;
        if (r.hasFlag) {
          const [fk, fv] = r.hasFlag.replace(/^--/, '').split('=');
          const actual = c.flags[fk];
          if (!actual) return false;
          if (fv !== undefined && String(actual) !== fv) return false;
        }
        if (r.execForm !== undefined && c.isExecForm !== r.execForm) return false;
        if (r.jsonEquals && JSON.stringify(c.jsonArgs) !== JSON.stringify(r.jsonEquals)) return false;
        return true;
      });

      const lastCandidate = candidates[candidates.length - 1];
      tests.push({
        name: r.id,
        doc: r.doc,
        status: matched ? 'pass' : 'fail',
        got: lastCandidate ? `${lastCandidate.instruction} ${lastCandidate.rawArgs}` : `(thiếu ${wantInst})`,
        expected: `${wantInst}${r.hasFlag ? ` ${r.hasFlag}` : ''}${r.jsonEquals ? ` ${JSON.stringify(r.jsonEquals)}` : r.argsRegex ? ` /${r.argsRegex}/` : ''}${r.execForm ? ' (Exec Form JSON)' : ''}`,
        line: matched ? undefined : lastCandidate?.line ?? targetStages[0]?.fromLine,
      });
      continue;
    }

    if (r.kind === 'order') {
      const st = selectStage(stages, r.stage ?? 'first');
      if (!st) {
        tests.push({ name: r.id, doc: r.doc, status: 'fail', got: '(thiếu stage)', expected: String(r.stage) });
        continue;
      }
      const beforeRe = new RegExp(r.before.argsRegex);
      const afterRe = new RegExp(r.after.argsRegex);
      const beforeNode = st.instructions.find(
        (i) => i.instruction === r.before.instruction.toUpperCase() && beforeRe.test(i.rawArgs)
      );
      const afterNode = st.instructions.find(
        (i) => i.instruction === r.after.instruction.toUpperCase() && afterRe.test(i.rawArgs)
      );
      const ok = Boolean(beforeNode && afterNode && beforeNode.indexInStage < afterNode.indexInStage);
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: !beforeNode
          ? `(chưa có ${r.before.instruction} khớp /${r.before.argsRegex}/)`
          : !afterNode
            ? `(chưa có ${r.after.instruction} khớp /${r.after.argsRegex}/)`
            : `${r.before.instruction} ở dòng ${beforeNode.line}, ${r.after.instruction} ở dòng ${afterNode.line}`,
        expected: `${r.before.instruction} (${r.before.argsRegex}) phải đặt TRƯỚC ${r.after.instruction} (${r.after.argsRegex})`,
        line: ok ? undefined : afterNode?.line ?? beforeNode?.line ?? st.fromLine,
      });
      continue;
    }

    if (r.kind === 'non-root-user') {
      const st = selectStage(stages, r.stage ?? 'last');
      if (!st) {
        tests.push({ name: r.id, doc: r.doc, status: 'fail', got: '(thiếu stage)', expected: 'USER non-root' });
        continue;
      }
      const users = st.instructions.filter((i) => i.instruction === 'USER');
      const lastUser = users[users.length - 1];
      const userVal = lastUser?.bodyArgs.trim().split(':')[0] ?? 'root (mặc định)';
      const isNonRoot = Boolean(lastUser && userVal !== 'root' && userVal !== '0' && !userVal.includes('____'));
      const ok = isNonRoot && (!r.expectedUser || userVal === r.expectedUser);
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: `USER = ${userVal}`,
        expected: r.expectedUser ? `USER ${r.expectedUser}` : 'USER khác root / UID 0 ở cuối image',
        line: ok ? undefined : lastUser?.line ?? st.fromLine,
      });
    }
  }

  const firstFailLine = tests.find((t) => t.status !== 'pass' && t.line)?.line ?? null;
  return { import_error: null, tests, errorLine: firstFailLine };
}

export function dryRunDockerfile(source: string): Omit<RunResult, 'ms'> {
  const parsed = parseDockerfile(source);
  if (parsed.error) {
    return { stdout: '', stderr: parsed.error, exitCode: 1 };
  }
  const lines: string[] = [`✔ Cú pháp Dockerfile hợp lệ — ${parsed.stages.length} stage:`];
  for (const st of parsed.stages) {
    const userInst = [...st.instructions].reverse().find((i) => i.instruction === 'USER');
    lines.push(
      `  • Stage #${st.index + 1}${st.alias ? ` (AS ${st.alias})` : ''}: base=${st.baseImage} · ${st.instructions.length} chỉ thị · user=${userInst ? userInst.bodyArgs : 'root (mặc định)'}`
    );
    for (const inst of st.instructions.slice(1)) {
      lines.push(`      [dòng ${inst.line}] ${inst.instruction} ${inst.rawArgs}`);
    }
  }
  return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
}

/* ---------------- Bộ kiểm tra .dockerignore ---------------- */

function globToRegExp(pattern: string): RegExp {
  let p = pattern.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  const escaped = p
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§DOUBLE§§')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/§§DOUBLE§§/g, '.*');
  return new RegExp(`^(?:${escaped}|${escaped}/.*|.*/${escaped}|.*/${escaped}/.*)$`);
}

export function isIgnoredByDockerignore(dockerignoreText: string, samplePath: string): boolean {
  const cleanSample = samplePath.replace(/^\/+/, '');
  const lines = dockerignoreText
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  let ignored = false;
  for (const raw of lines) {
    const negated = raw.startsWith('!');
    const pat = negated ? raw.slice(1).trim() : raw;
    if (!pat) continue;
    if (globToRegExp(pat).test(cleanSample)) {
      ignored = !negated;
    }
  }
  return ignored;
}

export function gradeDockerignoreSpec(source: string, rules: DockerignoreCheckRule[]): GradeResult {
  const tests: GradeTest[] = rules.map((r) => {
    const actual = isIgnoredByDockerignore(source, r.samplePath);
    const ok = actual === r.shouldIgnore;
    return {
      name: r.id,
      doc: r.doc,
      status: ok ? 'pass' : 'fail',
      got: actual ? `"${r.samplePath}" bị chặn (ignored)` : `"${r.samplePath}" vẫn lọt vào Build Context`,
      expected: r.shouldIgnore
        ? `"${r.samplePath}" phải bị chặn bởi .dockerignore`
        : `"${r.samplePath}" PHẢI được giữ lại để Docker build được code`,
    };
  });
  return { import_error: null, tests };
}

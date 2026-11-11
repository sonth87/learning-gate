import React from 'react';
import type { EditorLanguage } from './types';

/**
 * Bộ tô màu cú pháp 1-1 ký tự cho YAML, Dockerfile và Shell/CLI.
 * TUYỆT ĐỐI không thêm padding/margin/font-weight làm đổi bề rộng ký tự
 * để con trỏ của <textarea> trong suốt khớp 100% với lớp <pre>.
 */

type CfgTokenType =
  | 'comment'
  | 'key'
  | 'instruction'
  | 'flag'
  | 'string'
  | 'expr'
  | 'number'
  | 'constant'
  | 'docsep'
  | 'operator'
  | 'plain';

interface CfgToken {
  type: CfgTokenType;
  value: string;
}

const DOCKER_INSTRUCTIONS = new Set([
  'FROM',
  'AS',
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

const SHELL_CMDS = new Set([
  'docker',
  'kubectl',
  'helm',
  'git',
  'npm',
  'npx',
  'node',
  'curl',
  'wget',
  'sh',
  'bash',
  'echo',
  'cat',
  'grep',
  'trivy',
  'gitleaks',
  'semgrep',
  'yq',
  'jq',
]);

const YAML_CONSTANTS = new Set(['true', 'false', 'null', 'True', 'False', 'Null', 'NULL']);

function colorClass(type: CfgTokenType, isLight: boolean): string {
  if (isLight) {
    switch (type) {
      case 'comment':
        return 'text-[#6e7781] italic';
      case 'key':
        return 'text-[#0550ae]';
      case 'instruction':
        return 'text-[#8250df]';
      case 'flag':
        return 'text-[#953800]';
      case 'string':
        return 'text-[#0a3069]';
      case 'expr':
        return 'text-[#cf222e]';
      case 'number':
        return 'text-[#116329]';
      case 'constant':
        return 'text-[#953800]';
      case 'docsep':
        return 'text-[#8250df]';
      case 'operator':
        return 'text-[#cf222e]';
      default:
        return 'text-[#1f2328]';
    }
  }
  switch (type) {
    case 'comment':
      return 'text-slate-500 italic';
    case 'key':
      return 'text-sky-300';
    case 'instruction':
      return 'text-fuchsia-400';
    case 'flag':
      return 'text-cyan-300';
    case 'string':
      return 'text-amber-300';
    case 'expr':
      return 'text-emerald-300';
    case 'number':
      return 'text-orange-300';
    case 'constant':
      return 'text-orange-400';
    case 'docsep':
      return 'text-violet-400';
    case 'operator':
      return 'text-pink-400';
    default:
      return 'text-slate-200';
  }
}

function tokenizeValueChunk(chunk: string): CfgToken[] {
  const out: CfgToken[] = [];
  const re =
    /(\$\{\{[^}]*\}\}|\{\{[^}]*\}\}|\$\{[A-Za-z_][A-Za-z0-9_]*\}|\$[A-Za-z_][A-Za-z0-9_]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(--[a-zA-Z0-9_-]+(?:=[^\s"']+)?|(?<=\s)-[a-zA-Z0-9]+)|(\b\d+(?:\.\d+)?(?:Mi|Gi|Ki|m|s|ms|MB|GB)?\b)|(\b(?:true|false|null|True|False|Null|NULL)\b)|([|>&;[\]{}])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(chunk)) !== null) {
    if (m.index > last) out.push({ type: 'plain', value: chunk.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: 'expr', value: m[0] });
    else if (m[2] !== undefined) out.push({ type: 'string', value: m[0] });
    else if (m[3] !== undefined) out.push({ type: 'flag', value: m[0] });
    else if (m[4] !== undefined) out.push({ type: 'number', value: m[0] });
    else if (m[5] !== undefined) out.push({ type: 'constant', value: m[0] });
    else if (m[6] !== undefined) out.push({ type: 'operator', value: m[0] });
    last = re.lastIndex;
  }
  if (last < chunk.length) out.push({ type: 'plain', value: chunk.slice(last) });
  return out;
}

function splitInlineComment(line: string): [string, string] {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle && line[i - 1] !== '\\') inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble && (i === 0 || /\s/.test(line[i - 1]))) {
      return [line.slice(0, i), line.slice(i)];
    }
  }
  return [line, ''];
}

function tokenizeLine(line: string, lang: EditorLanguage): CfgToken[] {
  if (!line) return [];
  if (/^\s*#/.test(line)) return [{ type: 'comment', value: line }];

  if (lang === 'yaml') {
    if (/^---(\s|$)/.test(line) || /^\.\.\.(\s|$)/.test(line)) {
      return [{ type: 'docsep', value: line }];
    }
    const [body, comment] = splitInlineComment(line);
    const tokens: CfgToken[] = [];
    // Khớp key YAML đầu dòng (kể cả sau "- ")
    const keyMatch = body.match(/^(\s*(?:-\s+)?)([A-Za-z0-9_./"'-]+)(:(?=\s|$))(.*)$/);
    if (keyMatch) {
      if (keyMatch[1]) tokens.push({ type: 'operator', value: keyMatch[1] });
      tokens.push({ type: 'key', value: keyMatch[2] });
      tokens.push({ type: 'operator', value: keyMatch[3] });
      if (keyMatch[4]) {
        const restTrim = keyMatch[4].trim();
        if (YAML_CONSTANTS.has(restTrim)) {
          tokens.push(...tokenizeValueChunk(keyMatch[4]));
        } else {
          tokens.push(...tokenizeValueChunk(keyMatch[4]));
        }
      }
    } else {
      const listMatch = body.match(/^(\s*-\s+)(.*)$/);
      if (listMatch) {
        tokens.push({ type: 'operator', value: listMatch[1] });
        tokens.push(...tokenizeValueChunk(listMatch[2]));
      } else {
        tokens.push(...tokenizeValueChunk(body));
      }
    }
    if (comment) tokens.push({ type: 'comment', value: comment });
    return tokens;
  }

  if (lang === 'dockerfile') {
    const [body, comment] = splitInlineComment(line);
    const tokens: CfgToken[] = [];
    const instMatch = body.match(/^(\s*)([A-Za-z]+)(\s+.*|$)/);
    if (instMatch && DOCKER_INSTRUCTIONS.has(instMatch[2].toUpperCase())) {
      if (instMatch[1]) tokens.push({ type: 'plain', value: instMatch[1] });
      tokens.push({ type: 'instruction', value: instMatch[2] });
      const rest = instMatch[3];
      // Highlight AS <alias> trong FROM
      const asParts = rest.split(/(\s+[Aa][Ss]\s+)/);
      for (const part of asParts) {
        if (/^\s+[Aa][Ss]\s+$/.test(part)) tokens.push({ type: 'instruction', value: part });
        else tokens.push(...tokenizeValueChunk(part));
      }
    } else {
      tokens.push(...tokenizeValueChunk(body));
    }
    if (comment) tokens.push({ type: 'comment', value: comment });
    return tokens;
  }

  // shell / cli
  const [body, comment] = splitInlineComment(line);
  const tokens: CfgToken[] = [];
  const cmdMatch = body.match(/^(\s*(?:\$\s+)?)([a-zA-Z0-9_./-]+)(.*)$/);
  if (cmdMatch && SHELL_CMDS.has(cmdMatch[2])) {
    if (cmdMatch[1]) tokens.push({ type: 'operator', value: cmdMatch[1] });
    tokens.push({ type: 'instruction', value: cmdMatch[2] });
    tokens.push(...tokenizeValueChunk(cmdMatch[3]));
  } else {
    tokens.push(...tokenizeValueChunk(body));
  }
  if (comment) tokens.push({ type: 'comment', value: comment });
  return tokens;
}

export function detectLanguageFromFence(info: string, fallback: EditorLanguage = 'yaml'): EditorLanguage {
  const s = info.trim().toLowerCase();
  if (s === 'dockerfile' || s === 'docker' || s === 'dockerignore') return 'dockerfile';
  if (s === 'sh' || s === 'bash' || s === 'zsh' || s === 'shell' || s === 'cli' || s === 'console') return 'shell';
  if (s === 'yaml' || s === 'yml') return 'yaml';
  return fallback;
}

export function renderHighlightedConfigLine(line: string, lang: EditorLanguage, isLight = false): React.ReactNode {
  const tokens = tokenizeLine(line, lang);
  if (!tokens.length) return '';
  return tokens.map((t, i) =>
    t.type === 'plain' ? (
      <span key={i} className={colorClass('plain', isLight)}>
        {t.value}
      </span>
    ) : (
      <span key={i} className={colorClass(t.type, isLight)}>
        {t.value}
      </span>
    )
  );
}

export function renderHighlightedConfig(
  code: string,
  lang: EditorLanguage,
  isLight = false,
  errorLine?: number | null
): React.ReactNode {
  const lines = code.split('\n');
  return lines.map((line, idx) => {
    const lineNo = idx + 1;
    const isErr = errorLine === lineNo;
    return (
      <React.Fragment key={idx}>
        {isErr ? (
          <span className="bg-rose-500/25 underline decoration-rose-400 decoration-wavy">
            {renderHighlightedConfigLine(line, lang, isLight)}
          </span>
        ) : (
          renderHighlightedConfigLine(line, lang, isLight)
        )}
        {idx < lines.length - 1 ? '\n' : ''}
      </React.Fragment>
    );
  });
}

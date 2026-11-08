import React from 'react';

export type TokenType =
  | 'comment'
  | 'string'
  | 'fstring-interp'
  | 'keyword'
  | 'control'
  | 'constant'
  | 'self'
  | 'decorator'
  | 'builtin'
  | 'dunder'
  | 'function'
  | 'class-name'
  | 'number'
  | 'operator'
  | 'punctuation'
  | 'identifier'
  | 'whitespace';

export interface CodeToken {
  type: TokenType;
  value: string;
}

const CONTROL_KEYWORDS = new Set([
  'if',
  'elif',
  'else',
  'for',
  'while',
  'break',
  'continue',
  'return',
  'yield',
  'try',
  'except',
  'finally',
  'raise',
  'with',
  'as',
  'match',
  'case',
  'pass',
  'assert',
  'await',
  'async',
  'import',
  'from',
]);

const DECL_KEYWORDS = new Set([
  'def',
  'class',
  'lambda',
  'global',
  'nonlocal',
  'del',
  'in',
  'is',
  'not',
  'and',
  'or',
  'type',
  // JS/TS keywords for comparison snippets
  'const',
  'let',
  'var',
  'function',
  'interface',
  'export',
  'default',
  'new',
  'typeof',
  'instanceof',
]);

const CONSTANTS = new Set([
  'True',
  'False',
  'None',
  'Ellipsis',
  'NotImplemented',
  'true',
  'false',
  'null',
  'undefined',
]);

const SELF_TOKENS = new Set(['self', 'cls', 'this']);

const BUILTINS = new Set([
  'int',
  'str',
  'float',
  'bool',
  'bytes',
  'bytearray',
  'list',
  'dict',
  'set',
  'frozenset',
  'tuple',
  'len',
  'range',
  'enumerate',
  'zip',
  'map',
  'filter',
  'sorted',
  'reversed',
  'sum',
  'min',
  'max',
  'abs',
  'round',
  'any',
  'all',
  'isinstance',
  'issubclass',
  'getattr',
  'setattr',
  'hasattr',
  'delattr',
  'super',
  'print',
  'open',
  'id',
  'hash',
  'iter',
  'next',
  'repr',
  'callable',
  'object',
  'property',
  'staticmethod',
  'classmethod',
  'Exception',
  'ValueError',
  'TypeError',
  'KeyError',
  'IndexError',
  'RuntimeError',
  'AttributeError',
  'StopIteration',
  ' ZeroDivisionError',
  'Decimal',
  'Path',
  'Optional',
  'Union',
  'Any',
  'Callable',
  'Sequence',
  'Mapping',
  'Iterable',
  'Iterator',
  'Generator',
  'Coroutine',
  'Literal',
  'TypeVar',
  'Generic',
  'Protocol',
  'BaseModel',
  'Field',
  'dataclass',
  'field',
  'defaultdict',
  'Counter',
  'deque',
  'namedtuple',
  'lru_cache',
  'cache',
  'partial',
  'reduce',
  'asyncio',
  'json',
  'math',
  're',
  'os',
  'sys',
  'time',
  'datetime',
]);

const MASTER_TOKEN_REGEX =
  /(#[^\n]*)|([rfbRFB]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`))|(@[a-zA-Z_][a-zA-Z0-9_.]*)|(\b(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.[\d_]+)?(?:[eE][+-]?[\d_]+)?j?)\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*\b)|(->|:=|==|!=|<=|>=|\*\*|\/\/|<<|>>|\+=|-=|\*=|\/=|%=|\|=|&=|\^=|@=|\.\.\.|[+\-*/%&|^~<>!=:]=?)|([()[\]{}.,;])|(\s+)/g;

/**
 * Tokenizes a single line or multi-line string of Python/TS code into 1-to-1 tokens.
 * Guaranteed to preserve every single character exactly as input.
 */
export function tokenizePythonCode(code: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let lastIndex = 0;
  let prevNonSpaceToken: CodeToken | null = null;

  MASTER_TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MASTER_TOKEN_REGEX.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'identifier',
        value: code.slice(lastIndex, match.index),
      });
    }

    const [
      fullMatch,
      commentGroup,
      stringGroup,
      decoratorGroup,
      numberGroup,
      identGroup,
      operatorGroup,
      punctGroup,
      spaceGroup,
    ] = match;

    let token: CodeToken;

    if (commentGroup !== undefined) {
      token = { type: 'comment', value: fullMatch };
    } else if (stringGroup !== undefined) {
      token = { type: 'string', value: fullMatch };
    } else if (decoratorGroup !== undefined) {
      token = { type: 'decorator', value: fullMatch };
    } else if (numberGroup !== undefined) {
      token = { type: 'number', value: fullMatch };
    } else if (identGroup !== undefined) {
      // Look ahead to see if followed by '('
      const rest = code.slice(MASTER_TOKEN_REGEX.lastIndex);
      const isFollowedByParen = /^\s*\(/.test(rest);

      if (
        prevNonSpaceToken &&
        prevNonSpaceToken.value === 'def'
      ) {
        token = { type: 'function', value: fullMatch };
      } else if (
        prevNonSpaceToken &&
        prevNonSpaceToken.value === 'class'
      ) {
        token = { type: 'class-name', value: fullMatch };
      } else if (CONTROL_KEYWORDS.has(fullMatch)) {
        token = { type: 'control', value: fullMatch };
      } else if (DECL_KEYWORDS.has(fullMatch)) {
        token = { type: 'keyword', value: fullMatch };
      } else if (CONSTANTS.has(fullMatch)) {
        token = { type: 'constant', value: fullMatch };
      } else if (SELF_TOKENS.has(fullMatch)) {
        token = { type: 'self', value: fullMatch };
      } else if (
        fullMatch.startsWith('__') &&
        fullMatch.endsWith('__') &&
        fullMatch.length > 4
      ) {
        token = { type: 'dunder', value: fullMatch };
      } else if (BUILTINS.has(fullMatch)) {
        token = { type: 'builtin', value: fullMatch };
      } else if (
        /^[A-Z][a-zA-Z0-9_]*$/.test(fullMatch) &&
        !/^[A-Z0-9_]+$/.test(fullMatch)
      ) {
        token = { type: 'class-name', value: fullMatch };
      } else if (isFollowedByParen) {
        token = { type: 'function', value: fullMatch };
      } else {
        token = { type: 'identifier', value: fullMatch };
      }
    } else if (operatorGroup !== undefined) {
      token = { type: 'operator', value: fullMatch };
    } else if (punctGroup !== undefined) {
      token = { type: 'punctuation', value: fullMatch };
    } else if (spaceGroup !== undefined) {
      token = { type: 'whitespace', value: fullMatch };
    } else {
      token = { type: 'identifier', value: fullMatch };
    }

    tokens.push(token);
    if (token.type !== 'whitespace' && token.type !== 'comment') {
      prevNonSpaceToken = token;
    }

    lastIndex = MASTER_TOKEN_REGEX.lastIndex;
  }

  if (lastIndex < code.length) {
    tokens.push({
      type: 'identifier',
      value: code.slice(lastIndex),
    });
  }

  return tokens;
}

/**
 * Maps token types to IDE syntax colors (supports both Dark IDE themes and Light IDE themes).
 * IMPORTANT: Never adds padding, margin, or font-weight changes that alter character width,
 * ensuring 1:1 cursor alignment in overlay editors.
 */
export function getTokenColorClass(type: TokenType, isLight = false): string {
  if (isLight) {
    switch (type) {
      case 'comment':
        return 'text-[#6e7781] italic';
      case 'string':
        return 'text-[#0a3069]';
      case 'fstring-interp':
        return 'text-[#0550ae]';
      case 'control':
        return 'text-[#cf222e]';
      case 'keyword':
        return 'text-[#8250df]';
      case 'constant':
        return 'text-[#953800]';
      case 'self':
        return 'text-[#be185d] italic';
      case 'decorator':
        return 'text-[#9a6700]';
      case 'builtin':
        return 'text-[#0550ae]';
      case 'dunder':
        return 'text-[#6639ba]';
      case 'function':
        return 'text-[#6639ba]';
      case 'class-name':
        return 'text-[#116329]';
      case 'number':
        return 'text-[#0550ae]';
      case 'operator':
        return 'text-[#cf222e]';
      case 'punctuation':
        return 'text-[#57606a]';
      case 'identifier':
        return 'text-[#1f2328]';
      case 'whitespace':
      default:
        return '';
    }
  }

  switch (type) {
    case 'comment':
      return 'text-slate-500 italic';
    case 'string':
      return 'text-amber-300';
    case 'fstring-interp':
      return 'text-cyan-300';
    case 'control':
      return 'text-purple-400';
    case 'keyword':
      return 'text-fuchsia-400';
    case 'constant':
      return 'text-orange-400';
    case 'self':
      return 'text-rose-400 italic';
    case 'decorator':
      return 'text-yellow-300';
    case 'builtin':
      return 'text-cyan-300';
    case 'dunder':
      return 'text-indigo-300';
    case 'function':
      return 'text-sky-300';
    case 'class-name':
      return 'text-emerald-300';
    case 'number':
      return 'text-orange-300';
    case 'operator':
      return 'text-pink-400';
    case 'punctuation':
      return 'text-slate-400';
    case 'identifier':
      return 'text-slate-100';
    case 'whitespace':
    default:
      return '';
  }
}

/**
 * Renders highlighted Python/TS code as React nodes.
 * Preserves every character and newline 1-to-1 for overlay editors.
 */
export function renderHighlightedPython(
  code: string,
  isLight = false
): React.ReactNode {
  const tokens = tokenizePythonCode(code);

  return tokens.map((tok, i) => {
    if (tok.type === 'whitespace') {
      return tok.value;
    }

    // Highlight {interpolation} inside f-strings
    if (
      tok.type === 'string' &&
      /^[fFrR]{1,2}['"]/.test(tok.value) &&
      tok.value.includes('{')
    ) {
      const parts = tok.value.split(/(\{[^{}]*\})/g);
      return (
        <span
          key={i}
          className={isLight ? 'text-[#0a3069]' : 'text-amber-300'}
        >
          {parts.map((part, pIdx) => {
            if (part.startsWith('{') && part.endsWith('}')) {
              const inner = part.slice(1, -1);
              return (
                <span
                  key={pIdx}
                  className={isLight ? 'text-[#cf222e]' : 'text-cyan-300'}
                >
                  {'{'}
                  <span
                    className={isLight ? 'text-[#8250df]' : 'text-sky-200'}
                  >
                    {inner}
                  </span>
                  {'}'}
                </span>
              );
            }
            return part;
          })}
        </span>
      );
    }

    const cls = getTokenColorClass(tok.type, isLight);
    return (
      <span key={i} className={cls}>
        {tok.value}
      </span>
    );
  });
}

import { GlossaryTerm } from '@/types/glossary.types';
import { KEYWORDS_GLOSSARY } from './keywordsData';
import { DECLARATIONS_GLOSSARY } from './declarationsData';
import { BUILTINS_GLOSSARY } from './builtinsData';
import { METHODS_GLOSSARY } from './methodsData';
import { DUNDERS_GLOSSARY } from './dundersData';
import { CONCEPTS_GLOSSARY } from './conceptsData';
import { STDLIB_GLOSSARY } from './stdlibData';
import { DEVOPS_AND_PMP_GLOSSARY } from './devopsAndPmpData';

export const ALL_GLOSSARY_TERMS: GlossaryTerm[] = [
  ...KEYWORDS_GLOSSARY,
  ...DECLARATIONS_GLOSSARY,
  ...BUILTINS_GLOSSARY,
  ...METHODS_GLOSSARY,
  ...DUNDERS_GLOSSARY,
  ...CONCEPTS_GLOSSARY,
  ...STDLIB_GLOSSARY,
  ...DEVOPS_AND_PMP_GLOSSARY,
];

export const GLOSSARY_BY_ID: Record<string, GlossaryTerm> =
  ALL_GLOSSARY_TERMS.reduce((acc, term) => {
    acc[term.id] = term;
    return acc;
  }, {} as Record<string, GlossaryTerm>);

export const GLOSSARY_BY_SURFACE_TOKEN: Record<string, GlossaryTerm> = {};

for (const item of ALL_GLOSSARY_TERMS) {
  GLOSSARY_BY_SURFACE_TOKEN[item.term.toLowerCase()] = item;
  if (item.aliases) {
    for (const alias of item.aliases) {
      GLOSSARY_BY_SURFACE_TOKEN[alias.toLowerCase()] = item;
    }
  }
}

export function findGlossaryTerm(tokenOrId: string): GlossaryTerm | undefined {
  if (GLOSSARY_BY_ID[tokenOrId]) {
    return GLOSSARY_BY_ID[tokenOrId];
  }
  const normalized = tokenOrId.trim().toLowerCase();
  if (GLOSSARY_BY_SURFACE_TOKEN[normalized]) {
    return GLOSSARY_BY_SURFACE_TOKEN[normalized];
  }
  const strippedParens = normalized.replace(/\([^)]*\)$/, '').trim();
  if (GLOSSARY_BY_SURFACE_TOKEN[strippedParens]) {
    return GLOSSARY_BY_SURFACE_TOKEN[strippedParens];
  }
  if (normalized.startsWith('if ') && normalized.includes('is none')) {
    return GLOSSARY_BY_SURFACE_TOKEN['none'] || GLOSSARY_BY_SURFACE_TOKEN['is'];
  }
  return undefined;
}

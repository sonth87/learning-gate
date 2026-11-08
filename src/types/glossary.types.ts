import { SkillLevel, StageId } from './curriculum.types';

export type GlossaryCategory =
  | 'keyword'
  | 'declaration'
  | 'builtin_func'
  | 'method'
  | 'builtin_type'
  | 'dunder'
  | 'concept'
  | 'ecosystem'
  | 'stdlib';

export interface GlossaryTerm {
  id: string;
  term: string;
  aliases?: string[];
  category: GlossaryCategory;
  level: SkillLevel;
  stageId: StageId;
  shortSummary: string;
  detailedExplanation: string;
  analogy: string;
  syntaxExample: string;
  commonGotcha?: string;
  jsEquivalent?: string;
  relatedTerms: string[];
}

/**
 * Kiểu dữ liệu của app "PMP Mastery" (courseId = 'pmp').
 * Tái sử dụng WpState, WpQuestion, WpCard từ workpath để đồng nhất lưu trữ kép (LocalStorage + IndexedDB),
 * XP, SRS Leitner 5 hộp và JSON Backup.
 */

import type { WpCard, WpQuestion, WpState } from '@/features/workpath/types';

export type { WpCard, WpQuestion, WpState };

export type PmpTab = 'learn' | 'canvas' | 'decision' | 'lookup';

export type PmpLearnView =
  | { name: 'home' }
  | { name: 'roadmap' }
  | { name: 'module'; id: string }
  | { name: 'quiz'; mode: 'module' | 'review' | 'mix'; moduleId?: string }
  | { name: 'flash'; moduleId?: string };

export type ProvenanceKind = 'pmbok8' | 'eco2026' | 'pma-bridge';

/**
 * Mục liên kết sâu (Deep Link) sang PMP Mindmap (https://pmp-mindmap.vercel.app).
 * Khai báo tập trung tại `content/pmp/links.json` và được kiểm tra nghiêm ngặt bởi `scripts/pmp-doctor.mjs`.
 */
export interface PmpMindmapLink {
  linkId: string;
  label: string;
  kind: 'node' | 'flow' | 'panorama' | 'practice';
  /** Ấn bản bắt buộc khớp với topicId: 'core' cho core.*, 'book' cho chủ đề/node chi tiết của Book */
  edition?: 'core' | 'book';
  topicId?: string;
  nodeId?: string;
  flowId?: string;
  flowMode?: 'guided' | 'interactive' | 'reconstruct';
  panel?: 'outline' | 'filter' | 'questions' | 'mystuff' | 'none';
  lang?: 'vi' | 'en' | 'both';
  /** Giải thích rõ xem node/flow này để lấy dẫn chứng gì, tại sao liên quan tới tư duy vừa học */
  whyRead: string;
  /** Nhãn đối chiếu thuật ngữ nếu tên bên Mindmap dùng cách gọi PMBOK 6/7 hoặc PMA */
  bridgeNote?: string;
}

export interface PmpPracticeGuide {
  title: string;
  /** ID tham chiếu tới 1 mục trong `links.json` (thường là view `practice` hoặc `flow` ở chế độ `reconstruct`) */
  primaryLinkId: string;
  secondaryLinkIds?: string[];
  /** Chỉ dẫn từng bước thao tác bên PMP Mindmap (ví dụ: chọn Mix -> lọc chủ đề Risk -> 15 câu) */
  steps: string[];
  /** Câu hỏi tự đánh giá sau khi luyện xong bên Mindmap */
  selfCheck: string[];
}

export interface PmpModule {
  id: string;
  slug: string;
  level: number;
  order: number;
  title: string;
  summary: string;
  motto: string;
  provenance: {
    kind: ProvenanceKind;
    label: string;
    detail?: string;
  }[];
  realWorldTrap: string;
  pmiMindsetShift: string;
  tags: string[];
  /** Nội dung Markdown chuẩn Visual Study Sheet (hỗ trợ visual YAML blocks, callouts, ==highlight==, badges) */
  lesson: string;
  /** Danh sách ID dẫn chứng trỏ sang `links.json` ("Đi xem dẫn chứng") */
  evidenceLinkIds: string[];
  /** Hướng dẫn "Luyện tập tình huống" bên PMP Mindmap */
  practice: PmpPracticeGuide;
  /** Câu hỏi tự kiểm tra ngắn nguyên bản của Learning Gate (>=70% để qua) */
  quiz: WpQuestion[];
  /** Thẻ ôn tập phản xạ SRS Leitner 5 hộp */
  cards: WpCard[];
  /** Nhánh cây quyết định liên quan để bấm thử ngay */
  decisionBranchId?: string;
}

export interface PmpCurriculum {
  courseId: 'pmp';
  generatedAt: string;
  mindmapBaseUrl: string;
  passQuiz: number;
  levels: Record<string, string>;
  modules: PmpModule[];
}

/* ---------------- PMP Mindset Canvas (Bức tranh tổng thể 1 trang) ---------------- */

export interface CanvasCardItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  provenance: ProvenanceKind;
  provenanceLabel: string;
  tone: 'amber' | 'emerald' | 'sky' | 'violet' | 'rose' | 'cyan';
  essence: string[];
  realWorldTrap: string;
  moduleId: string;
  evidenceLinkIds: string[];
}

export interface PmpDomainBridgeRow {
  pmbok8Domain: string;
  pmbok8ProcessesCount: number;
  pmbok8KeyFocus: string;
  mindmapTopics: string[];
  bridgeExplanation: string;
  moduleId: string;
  linkId: string;
}

export interface PmpMindsetCanvasData {
  eco2026: {
    effectiveDate: string;
    domains: {
      id: string;
      name: string;
      weight2026: number;
      weight2021: number;
      tasks2026: number;
      shiftSummary: string;
    }[];
  };
  principles: CanvasCardItem[];
  pmaGoldenReflexes: {
    id: string;
    title: string;
    viRule: string;
    trap: string;
    linkId: string;
    moduleId: string;
  }[];
  roles: CanvasCardItem[];
  approaches: CanvasCardItem[];
  focusAreas: {
    id: string;
    name: string;
    viName: string;
    coreQuestion: string;
    predictiveNote: string;
    adaptiveNote: string;
  }[];
  decisionCycle: {
    step: number;
    title: string;
    action: string;
    neverDo: string;
  }[];
  domainBridge: PmpDomainBridgeRow[];
}

/* ---------------- Cây quyết định tình huống tương tác (Decision Tree) ---------------- */

export interface DecisionOption {
  label: string;
  hint?: string;
  nextNodeId: string;
}

export interface DecisionQuestionNode {
  id: string;
  kind: 'question';
  branchId: string;
  prompt: string;
  contextTip?: string;
  options: DecisionOption[];
}

export interface DecisionLeafNode {
  id: string;
  kind: 'outcome';
  branchId: string;
  title: string;
  provenanceLabel: string;
  firstAction: string[];
  neverDo: string[];
  artifactsToCheck: string[];
  moduleId: string;
  evidenceLinkIds: string[];
}

export type DecisionNode = DecisionQuestionNode | DecisionLeafNode;

export interface DecisionBranchMeta {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  tone: 'amber' | 'emerald' | 'sky' | 'violet' | 'rose' | 'cyan';
  entryNodeId: string;
}

export interface DecisionChallengeCase {
  id: string;
  code: string;
  title: string;
  scenario: string;
  question: string;
  branchId: string;
  expectedLeafId: string;
  expectedPathLabels: string[];
  takeaway: string;
}

export interface PmpDecisionTreeData {
  rootPrompt: string;
  branches: DecisionBranchMeta[];
  nodes: Record<string, DecisionNode>;
  challenges: DecisionChallengeCase[];
}

/* ---------------- Bảng so sánh đối chiếu nhanh (Lookup Comparisons) ---------------- */

export interface PmpComparisonTable {
  id: string;
  title: string;
  subtitle: string;
  category: 'approach' | 'governance' | 'people' | 'execution' | 'pmbok8-bridge';
  provenanceLabel: string;
  headers: [string, string, string] | [string, string, string, string];
  rows: string[][];
  examTip: string;
  moduleId: string;
  evidenceLinkIds: string[];
}

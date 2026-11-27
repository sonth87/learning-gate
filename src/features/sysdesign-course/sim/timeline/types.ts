/**
 * Kiểu dữ liệu cho mô phỏng sự kiện rời rạc `sim/timeline/` (04 §12, ADR-020).
 * Thuần TypeScript: không import React/DOM/Math.random/Date.
 */

export type ActorId = string;

export interface TimelineHistoryOp {
  id: string;
  client: ActorId;
  op: 'read' | 'write';
  key: string;
  value: number | string | null;
  start: number;
  end: number;
  ok?: boolean;
  meta?: Record<string, number | string | boolean>;
}

export interface TimelineMessage {
  id: string;
  from: ActorId;
  to: ActorId;
  kind: string;
  label: string;
  sendMs: number;
  recvMs: number;
  dropped: boolean;
}

export interface TimelineMilestone {
  atMs: number;
  actor: ActorId;
  code: string;
  detail: string;
}

export interface TimelineSideEffect {
  id: string;
  atMs: number;
  actor: ActorId;
  action: string;
  idempotencyKey?: string;
  amount?: number;
}

export interface TimelineRun {
  durationMs: number;
  actors: ActorId[];
  history: TimelineHistoryOp[];
  messages: TimelineMessage[];
  milestones: TimelineMilestone[];
  effects: TimelineSideEffect[];
}

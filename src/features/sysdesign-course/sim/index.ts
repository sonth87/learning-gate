/** API công khai của engine mô phỏng (04 §9.2). Recorder/analyze/grade/trace được bổ sung ở T2.4–T2.9. */
export * from './model';
export type {
  BadgeCode, BreakerState, DistributiveOmit, ErrorBreakdown, GlobalMetrics, InputChange, InputRecord,
  LatencySummary, LinkFrame, LinkRuntime, NodeFrame, NodeRuntime, NodeState, SimFrame, SimInputs, SimPacket,
  SimPacketKind, SimState,
} from './types';
export { mulberry32, tickRng, gauss } from './rng';
export { rpsAt } from './profiles';
export { applyEvent, applyInput, foldInputs, initialInputs } from './events';
export {
  addNet, addSerial, capLatency, D_ZERO, dMax, dMean, dMix, dPoint, dQuantile, dScaleCalls, dSerial, dShift,
  dShiftExp, dSummary, dSurvival, dTruncate, fitShiftExp, maxQuantile, mixQuantile, nodeDist, nodeLatency,
  queueingDelayMs,
} from './latency';
export type { Comp, Dist } from './latency';
export { effectiveHit, hitTarget, singleflightCap } from './cache';
export { KIND_DEFAULTS, makeNode } from './primitives';
export { cloneState, createInitialState, createSim, stepInPlace, stepState } from './engine';
export type { Sim } from './engine';
export { createRecorder, flushInputs, linkKey, nodeKey, NODE_STATE_BY_CODE, NODE_STATE_CODE } from './recorder';
export type { Checkpoint, Recorder, RecorderMarker, RestoreResult } from './recorder';
export { fnv1a32, modNAssign, movedFraction, ringAssign, zipfKeys } from './hashing';
export { effReplicas, findBottleneck, findSpofs, maxSustainableRps, structuralWarnings } from './analyze';
export type {
  BottleneckReason, BottleneckReport, SpofReport, StructuralWarning, StructuralWarningCode,
} from './analyze';
export { applyChangesToModel, evaluate, runAndEvaluate, seriesFromRecorder, simulate } from './grade';
export type { Constraint, ConstraintResult, RunSeries, StructuralRule, TimeWindow } from './grade';
export { traceRequest } from './trace';
export type { RequestTrace, TraceHint, TraceOutcome, TraceSpan, TraceSpanKind } from './trace';

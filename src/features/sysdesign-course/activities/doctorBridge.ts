/**
 * Điểm vào bundle cho `scripts/sysdesign-doctor.mjs` (T4.6).
 * Xuất các hàm thuần từ `sim/` và `activities/grade` để doctor chạy kiểm tra
 * `sim.json`, `activities.json`, `stage.json` và biến `{...}` trong `lesson.md`.
 */
export {
  applyChangesToModel,
  compile,
  createSim,
  DT,
  evaluate,
  findBottleneck,
  findSpofs,
  maxSustainableRps,
  NODE_STATE_CODE,
  runAndEvaluate,
  SimModelError,
  simulate,
  structuralWarnings,
} from '../sim';

export {
  bisectMaxSustainableLoad,
  computeEstimateTruth,
  computeModelStaticCostPerHour,
  computePredictExpectedNodes,
  computeSpotExpectedNodes,
  computeTimelineViolations,
  emptyAnswerForActivity,
  evalSafeFormula,
  getScenarioFrameAt,
  gradeActivity,
  normalizeAndValidateChanges,
  rawShuffleOrderItems,
  resolveExplainText,
  shuffleOrderItems,
  solutionAnswerForActivity,
} from './grade';

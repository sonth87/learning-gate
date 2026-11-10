import type { ExerciseSpec, GradeResult, RunResult, SimWorldState } from '../types';
import { dryRunYaml, gradeYamlSpec } from './yamlGrader';
import { dryRunDockerfile, gradeDockerfileSpec, gradeDockerignoreSpec } from './dockerfileGrader';
import { dryRunCli, executeDiagnosticCommand, gradeCliSpec, gradeTroubleshootSpec } from './cliSimEngine';

export { executeDiagnosticCommand };

export function dryRunExercise(code: string, spec: ExerciseSpec): RunResult {
  const t0 = performance.now();
  let res: Omit<RunResult, 'ms'>;
  switch (spec.kind) {
    case 'yaml':
      res = dryRunYaml(code, spec.helmTemplate);
      break;
    case 'dockerfile':
      res = dryRunDockerfile(code);
      break;
    case 'dockerignore': {
      const patterns = code
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
      res = {
        stdout: `Đã nhận diện ${patterns.length} mẫu chặn trong .dockerignore:\n${patterns.map((p) => `  • ${p}`).join('\n') || '  (trống)'}`,
        stderr: '',
        exitCode: 0,
      };
      break;
    }
    case 'cli':
      res = dryRunCli(code, spec.initialState);
      break;
    case 'troubleshoot':
      if (spec.patchFormat === 'yaml') res = dryRunYaml(code);
      else if (spec.patchFormat === 'dockerfile') res = dryRunDockerfile(code);
      else res = dryRunCli(code, spec.initialState);
      break;
  }
  return { ...res, ms: Math.max(1, Math.round(performance.now() - t0)) };
}

export function gradeDevOpsExercise(
  code: string,
  spec: ExerciseSpec,
  diagnosticHistoryOutput = ''
): GradeResult & { errorLine?: number | null; finalWorld?: SimWorldState } {
  switch (spec.kind) {
    case 'yaml':
      return gradeYamlSpec(code, spec.rules, spec.helmTemplate);
    case 'dockerfile':
      return gradeDockerfileSpec(code, spec.rules);
    case 'dockerignore':
      return gradeDockerignoreSpec(code, spec.rules);
    case 'cli':
      return gradeCliSpec(code, spec.initialState, spec.rules);
    case 'troubleshoot':
      return gradeTroubleshootSpec(code, spec, diagnosticHistoryOutput);
  }
}

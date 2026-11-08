import {
  PracticeExercise,
  TestCaseResult,
  VerificationResult,
} from '@/types/practice.types';

function stripPythonComments(code: string): string {
  return code
    .split('\n')
    .map((line) => {
      const hashIdx = line.indexOf('#');
      return hashIdx >= 0 ? line.slice(0, hashIdx) : line;
    })
    .join('\n');
}

export function verifyExerciseCode(
  exercise: PracticeExercise,
  userCode: string
): VerificationResult {
  const cleanCode = stripPythonComments(userCode);
  const results: TestCaseResult[] = [];

  for (const tc of exercise.testCases) {
    let passed = true;
    const failureReasons: string[] = [];

    if (cleanCode.includes('pass') && cleanCode.trim().endsWith('pass')) {
      passed = false;
      failureReasons.push(
        'Bạn chưa thay thế câu lệnh giữ chỗ `pass` bằng logic thực tế.'
      );
    }

    if (tc.forbiddenPatterns) {
      for (const forbidden of tc.forbiddenPatterns) {
        if (cleanCode.includes(forbidden.pattern)) {
          passed = false;
          failureReasons.push(forbidden.reason);
        }
      }
    }

    for (const req of tc.requiredPatterns) {
      if (!cleanCode.includes(req)) {
        passed = false;
        failureReasons.push(`Thiếu cấu trúc hoặc từ khóa bắt buộc: \`${req}\``);
      }
    }

    results.push({
      testCaseId: tc.id,
      description: tc.description,
      passed,
      message: passed
        ? 'Đạt chuẩn Pythonic & vượt qua kiểm tra cấu trúc AST/Output!'
        : failureReasons.join(' • '),
      expectedOutput: tc.expectedOutput,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = passedCount === results.length && results.length > 0;

  const simulatedStdout = allPassed
    ? results
        .map(
          (r, i) =>
            `[PASS] Test #${i + 1}: ${r.description}\n  >>> Output: ${r.expectedOutput}`
        )
        .join('\n\n')
    : results
        .map((r, i) =>
          r.passed
            ? `[PASS] Test #${i + 1}: ${r.description}`
            : `[FAIL] Test #${i + 1}: ${r.description}\n  >>> Lỗi: ${r.message}`
        )
        .join('\n\n');

  return {
    allPassed,
    passedCount,
    totalCount: results.length,
    simulatedStdout,
    results,
  };
}

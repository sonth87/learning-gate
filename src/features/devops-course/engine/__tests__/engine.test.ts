import assert from 'node:assert/strict';
import { gradeYamlSpec, parseK8sCpuMillicores, parseK8sMemoryMi, renderSimpleHelmTemplate } from '../yamlGrader';
import { gradeDockerfileSpec, gradeDockerignoreSpec, parseDockerfile } from '../dockerfileGrader';
import { executeDiagnosticCommand, gradeCliSpec, gradeTroubleshootSpec } from '../cliSimEngine';
import { dryRunExercise, gradeDevOpsExercise } from '../gradeEngine';
import { mergeWpStates } from '@/db/durableProgressStorage';
import { emptyState } from '@/features/workpath/logic';
import { courseCurrentLevel, courseModuleDone, courseModuleProgress, courseNextSteps } from '../../logic';
import type { DevOpsCurriculum } from '../../types';

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    console.error(`  ✘ ${name}`);
    throw err;
  }
}

console.log('=== Chạy bộ test tự động cho DevOps Grading Engine ===');

test('YAML Parser: từ chối ký tự Tab cứng và báo đúng số dòng', () => {
  const badYaml = 'apiVersion: v1\nkind: Pod\nmetadata:\n\tname: web-pod\n';
  const res = gradeYamlSpec(badYaml, []);
  assert.ok(res.import_error?.includes('dòng 4'));
  assert.equal(res.errorLine, 4);
});

test('YAML AST: thứ tự key và comment hoàn toàn không ảnh hưởng kết quả chấm', () => {
  const rules = [
    { id: 'kind', doc: 'kind là Deployment', kind: 'path' as const, path: 'kind', match: { eq: 'Deployment' } },
    { id: 'rep', doc: '3 replicas', kind: 'path' as const, path: 'spec.replicas', match: { eq: 3 } },
    { id: 'img', doc: 'ghim tag image', kind: 'image-tag-pinned' as const, path: 'spec.template.spec.containers[0].image' },
  ];
  const yamlReordered = `
# Manifest viết đảo thứ tự key và nhiều comment
spec:
  template:
    spec:
      containers:
        - image: 'node:22-alpine' # quote đơn vẫn hợp lệ
          name: api
  replicas: 3
kind: Deployment
apiVersion: apps/v1
`;
  const res = gradeYamlSpec(yamlReordered, rules);
  assert.equal(res.import_error, null);
  assert.ok(res.tests.every((t) => t.status === 'pass'));

  // Nếu dùng tag :latest thì phải FAIL
  const latestYaml = yamlReordered.replace('node:22-alpine', 'node:latest');
  const failRes = gradeYamlSpec(latestYaml, rules);
  assert.equal(failRes.tests.find((t) => t.name === 'img')?.status, 'fail');
});

test('YAML K8s Units: quy đổi chính xác CPU millicores và Memory MiB', () => {
  assert.equal(parseK8sCpuMillicores('500m'), 500);
  assert.equal(parseK8sCpuMillicores('0.5'), 500);
  assert.equal(parseK8sCpuMillicores(1), 1000);
  assert.equal(parseK8sMemoryMi('256Mi'), 256);
  assert.equal(parseK8sMemoryMi('1Gi'), 1024);
  assert.equal(parseK8sMemoryMi('512Ki'), 0.5);
});

test('YAML Multi-doc K8s: kiểm tra chéo Service selector và targetPort khớp Deployment', () => {
  const rules = [
    {
      id: 'sel',
      doc: 'Service selector khớp Pod labels',
      kind: 'k8s-selector-match' as const,
      sourceKind: 'Service' as const,
      targetKind: 'Deployment' as const,
    },
    {
      id: 'port',
      doc: 'Service targetPort khớp containerPort',
      kind: 'k8s-service-port-match' as const,
      targetKind: 'Deployment' as const,
    },
  ];

  const brokenMultiDoc = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  selector:
    matchLabels:
      app: shop-api
  template:
    metadata:
      labels:
        app: shop-api
    spec:
      containers:
        - name: api
          image: shop-api:1.2.0
          ports:
            - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: api-svc
spec:
  selector:
    app: wrong-label
  ports:
    - port: 80
      targetPort: 8080
`;
  const r1 = gradeYamlSpec(brokenMultiDoc, rules);
  assert.equal(r1.tests[0].status, 'fail');
  assert.equal(r1.tests[1].status, 'fail');

  const fixedMultiDoc = brokenMultiDoc
    .replace('app: wrong-label', 'app: shop-api')
    .replace('targetPort: 8080', 'targetPort: 3000');
  const r2 = gradeYamlSpec(fixedMultiDoc, rules);
  assert.ok(r2.tests.every((t) => t.status === 'pass'));
});

test('YAML Helm Renderer: render template với values.yaml và kiểm tra manifest đầu ra', () => {
  const tpl = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-web
spec:
  replicas: {{ .Values.replicaCount | default 1 }}
  template:
    spec:
      containers:
        - name: web
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
`;
  const rendered = renderSimpleHelmTemplate(tpl, {
    replicaCount: 4,
    image: { repository: 'ghcr.io/org/web', tag: '2.1.0' },
  });
  assert.ok(rendered.includes('replicas: 4'));
  assert.ok(rendered.includes('ghcr.io/org/web:2.1.0'));

  const g = gradeYamlSpec(
    'replicaCount: 4\nimage:\n  repository: ghcr.io/org/web\n  tag: "2.1.0"\n',
    [
      {
        id: 'helm-rep',
        doc: 'Render ra Deployment có 4 replicas',
        kind: 'path',
        docSelect: { kind: 'Deployment' },
        path: 'spec.replicas',
        match: { eq: 4 },
      },
    ],
    tpl
  );
  assert.equal(g.tests[0].status, 'pass');
});

test('YAML GitHub Actions Security: bắt lỗi Script Injection trong run: và cho qua khi truyền qua env:', () => {
  const rules = [{ id: 'sec', doc: 'Chống Script Injection', kind: 'gha-no-script-injection' as const }];
  const vulnerable = `
name: PR Check
on: pull_request
jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Title is \${{ github.event.pull_request.title }}"
`;
  assert.equal(gradeYamlSpec(vulnerable, rules).tests[0].status, 'fail');

  const safe = `
name: PR Check
on: pull_request
jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - env:
          PR_TITLE: \${{ github.event.pull_request.title }}
        run: echo "Title is $PR_TITLE"
`;
  assert.equal(gradeYamlSpec(safe, rules).tests[0].status, 'pass');
});

test('Dockerfile AST: bỏ qua dòng comment giả mạo, kiểm tra Multi-stage, thứ tự Layer Cache, Exec Form và USER non-root', () => {
  const rules = [
    { id: 'stages', doc: 'Multi-stage >= 2 stages', kind: 'stage-count' as const, min: 2 },
    {
      id: 'cache-order',
      doc: 'COPY package*.json phải đứng trước RUN npm ci',
      kind: 'order' as const,
      stage: 'builder',
      before: { instruction: 'COPY', argsRegex: 'package' },
      after: { instruction: 'RUN', argsRegex: 'npm\\s+ci' },
    },
    {
      id: 'copy-from',
      doc: 'Stage cuối COPY --from=builder',
      kind: 'instruction' as const,
      stage: 'last' as const,
      instruction: 'COPY',
      hasFlag: '--from=builder',
    },
    {
      id: 'non-root',
      doc: 'Chạy bằng USER node',
      kind: 'non-root-user' as const,
      stage: 'last' as const,
      expectedUser: 'node',
    },
    {
      id: 'exec-cmd',
      doc: 'CMD dùng Exec form JSON',
      kind: 'instruction' as const,
      stage: 'last' as const,
      instruction: 'CMD',
      execForm: true,
      jsonEquals: ['node', 'dist/server.js'],
    },
  ];

  // Cố tình chèn comment chứa từ khoá đúng nhưng code thật thì sai thứ tự và chạy root
  const cheated = `
# USER node
# COPY --from=builder /app/dist ./dist
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:22-alpine
WORKDIR /app
COPY dist ./dist
CMD node dist/server.js
`;
  const badRes = gradeDockerfileSpec(cheated, rules);
  assert.equal(badRes.tests.find((t) => t.name === 'cache-order')?.status, 'fail');
  assert.equal(badRes.tests.find((t) => t.name === 'copy-from')?.status, 'fail');
  assert.equal(badRes.tests.find((t) => t.name === 'non-root')?.status, 'fail');
  assert.equal(badRes.tests.find((t) => t.name === 'exec-cmd')?.status, 'fail');

  // Bản chuẩn với backslash nối dòng
  const valid = `
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci \\
  && echo "deps installed"
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
`;
  const parsed = parseDockerfile(valid);
  assert.equal(parsed.error, null);
  assert.equal(parsed.stages.length, 2);
  const okRes = gradeDockerfileSpec(valid, rules);
  assert.ok(okRes.tests.every((t) => t.status === 'pass'));
});

test('.dockerignore Matcher: chặn node_modules & .env nhưng giữ nguyên mã nguồn src/', () => {
  const rules = [
    { id: 'nm', doc: 'Chặn node_modules', samplePath: 'node_modules/express/index.js', shouldIgnore: true },
    { id: 'env', doc: 'Chặn .env', samplePath: '.env', shouldIgnore: true },
    { id: 'src', doc: 'Giữ lại src/index.ts', samplePath: 'src/index.ts', shouldIgnore: false },
  ];
  // Nếu viết bừa "*" chặn hết mọi thứ -> phải FAIL ở rule giữ lại src/index.ts!
  const blockAll = '*\n';
  const rBad = gradeDockerignoreSpec(blockAll, rules);
  assert.equal(rBad.tests.find((t) => t.name === 'src')?.status, 'fail');

  const proper = 'node_modules\n.git\n.env\n*.log\n';
  const rGood = gradeDockerignoreSpec(proper, rules);
  assert.ok(rGood.tests.every((t) => t.status === 'pass'));
});

test('CLI State Machine (Docker): phát hiện xung đột cổng (port conflict) và kiểm tra trạng thái cuối', () => {
  const initial = {
    docker: {
      images: [{ repo: 'nginx', tag: '1.27-alpine', sizeMB: 43 }],
      containers: [
        {
          id: 'old01',
          name: 'legacy-proxy',
          image: 'nginx:1.27-alpine',
          status: 'running' as const,
          exitCode: 0,
          ports: [{ host: 8080, container: 80 }],
          env: {},
          volumes: [],
          network: 'bridge',
          logs: ['legacy'],
        },
      ],
      volumes: [],
      networks: ['bridge'],
    },
  };
  const rules = [
    {
      id: 'api-up',
      doc: 'Container web-api chạy ở cổng host 8080 -> 3000 với NODE_ENV=production',
      target: 'docker-container' as const,
      name: 'web-api',
      status: 'running' as const,
      hostPort: 8080,
      containerPort: 3000,
      envEquals: { NODE_ENV: 'production' },
    },
  ];

  // Chưa gỡ container chiếm cổng 8080 -> báo lỗi bind port!
  const conflictRes = gradeCliSpec('docker run -d --name web-api -p 8080:3000 -e NODE_ENV=production node:22-alpine', initial, rules);
  assert.ok(conflictRes.import_error?.includes('port is already allocated'));

  // Dừng hoặc xoá container cũ rồi chạy mới -> PASS!
  const fixRes = gradeCliSpec(
    'docker rm -f legacy-proxy\ndocker run -d --name web-api -p 8080:3000 -e NODE_ENV=production node:22-alpine',
    initial,
    rules
  );
  assert.equal(fixRes.import_error, null);
  assert.ok(fixRes.tests.every((t) => t.status === 'pass'));
});

test('CLI & Troubleshoot State Machine (K8s): tự động khôi phục Pod và Endpoints khi vá lỗi ConfigMap & Selector', () => {
  const brokenCluster = {
    k8s: {
      namespaces: ['default'],
      pods: [
        {
          name: 'checkout-7d9f',
          namespace: 'default',
          labels: { app: 'checkout-api' },
          image: 'checkout:1.4.0',
          status: 'CreateContainerConfigError' as const,
          ready: false,
          restarts: 0,
          ports: [3000],
          envFromConfigMaps: ['checkout-cfg'],
          logs: [],
          events: ['Warning Failed Error: configmap "checkout-cfg" not found'],
        },
      ],
      deployments: [],
      services: [
        {
          name: 'checkout-svc',
          namespace: 'default',
          type: 'ClusterIP' as const,
          selector: { app: 'checkout-api' },
          port: 80,
          targetPort: 3000,
        },
      ],
      configMaps: [],
      secrets: [],
      pvcs: [],
    },
  };

  // Chẩn đoán trước
  const diag = executeDiagnosticCommand('kubectl describe pod checkout-7d9f', brokenCluster);
  assert.ok(diag.stdout.includes('configmap "checkout-cfg" not found'));

  // Vá bằng YAML ConfigMap -> Pod chuyển sang Running và Service có Ready Endpoint!
  const patchSpec = {
    kind: 'troubleshoot' as const,
    initialState: brokenCluster,
    patchFormat: 'yaml' as const,
    yamlRules: [
      { id: 'cm-name', doc: 'Tạo đúng ConfigMap checkout-cfg', kind: 'path' as const, path: 'metadata.name', match: { eq: 'checkout-cfg' } },
    ],
    cliRules: [
      { id: 'pod-ok', doc: 'Pod chuyển sang Running', target: 'k8s-pod' as const, name: 'checkout-7d9f', status: 'Running' as const },
      { id: 'svc-ep', doc: 'Service có ít nhất 1 Ready Endpoint', target: 'k8s-service-endpoints' as const, name: 'checkout-svc', minReadyEndpoints: 1 },
    ],
  };

  const cmYaml = `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: checkout-cfg\ndata:\n  LOG_LEVEL: info\n`;
  const graded = gradeTroubleshootSpec(cmYaml, patchSpec, diag.stdout);
  assert.equal(graded.import_error, null);
  assert.ok(graded.tests.every((t) => t.status === 'pass'));

  const dry = dryRunExercise(cmYaml, patchSpec);
  assert.equal(dry.exitCode, 0);
  const full = gradeDevOpsExercise(cmYaml, patchSpec, diag.stdout);
  assert.ok(full.tests.every((t) => t.status === 'pass'));
});

test('Durable Progress Merge: tự phục hồi khi IndexedDB bị xoá/evict và chống tab cũ ghi đè tiến độ mới', () => {
  const savedInLocal = {
    ...emptyState(),
    updatedAt: 1_700_000_500_000,
    xp: 50,
    lessons: { K00: 1_700_000_100_000 },
    exercises: {
      'K00-E1': { status: 'passed' as const, attempts: 2, hints: 0, passedAt: 1_700_000_200_000, code: 'docker run ...' },
      'K00-E2': { status: 'skipped' as const, attempts: 0, hints: 0, skippedAt: 1_700_000_300_000 },
    },
    skippedModules: { K01: 1_700_000_400_000 },
    log: [
      { t: 1_700_000_100_000, event: 'lesson:K00', xp: 20 },
      { t: 1_700_000_200_000, event: 'pass:K00-E1', xp: 30 },
    ],
  };

  // Trường hợp 1: IndexedDB bị rỗng / mất sau 1 đêm -> khôi phục trọn vẹn từ LocalStorage
  const recovered = mergeWpStates(null, savedInLocal);
  assert.equal(recovered.xp, 50);
  assert.ok('K00' in recovered.lessons);
  assert.equal(recovered.exercises['K00-E1']?.status, 'passed');
  assert.equal(recovered.exercises['K00-E2']?.status, 'skipped');
  assert.ok(recovered.skippedModules?.K01);

  // Trường hợp 2: Tab cũ để qua đêm (updatedAt = 0, rỗng) hợp nhất với LocalStorage mới -> không bao giờ làm mất dữ liệu
  const staleTabMerged = mergeWpStates(emptyState(), savedInLocal);
  assert.equal(staleTabMerged.xp, 50);
  assert.equal(staleTabMerged.exercises['K00-E1']?.status, 'passed');

  // Trường hợp 3: Người dùng chủ động Hoàn tác bỏ qua (unskip K01) ở bản mới hơn -> cờ bỏ qua được gỡ nhưng bài passed vẫn giữ nguyên
  const unskippedNewer = {
    ...savedInLocal,
    updatedAt: 1_700_000_900_000,
    skippedModules: {},
    exercises: {
      ...savedInLocal.exercises,
      'K00-E2': { status: 'todo' as const, attempts: 0, hints: 0 },
    },
  };
  const afterUnskip = mergeWpStates(savedInLocal, unskippedNewer);
  assert.equal(afterUnskip.skippedModules?.K01, undefined);
  assert.equal(afterUnskip.exercises['K00-E2']?.status, 'todo');
  assert.equal(afterUnskip.exercises['K00-E1']?.status, 'passed');
});

test('Skip Progression: bỏ qua bài lẻ hoặc cả module tự động chuyển cấp & cập nhật Việc nên làm tiếp', () => {
  const miniCur: DevOpsCurriculum = {
    courseId: 'kube',
    generatedAt: '2026-01-01',
    passQuiz: 0.7,
    levels: { '0': 'Nền tảng', '1': 'Nâng cao' },
    modules: [
      {
        id: 'K00',
        slug: 'why',
        level: 0,
        order: 1,
        title: 'Why Containers',
        summary: '',
        tags: [],
        lesson: '# K00',
        sources: [],
        quiz: [{ id: 'q1', type: 'tf', q: 'OK?', code: '', choices: [], answer: true, explain: '' }],
        cards: [],
        drills: [],
        readings: [],
        exercises: [
          {
            id: 'K00-E1',
            code: 'K00.1',
            module: 'K00',
            title: 'Ex 1',
            difficulty: 1,
            tags: [],
            kind: 'cli',
            language: 'shell',
            filename: 'run.sh',
            prompt: '',
            starter: '',
            solution: '',
            hints: [],
            ref: '',
            webGrade: true,
            spec: { kind: 'cli', initialState: {}, rules: [] },
          },
        ],
      },
      {
        id: 'K07',
        slug: 'k8s',
        level: 1,
        order: 1,
        title: 'K8s Intro',
        summary: '',
        tags: [],
        lesson: '# K07',
        sources: [],
        quiz: [],
        cards: [],
        drills: [],
        readings: [],
        exercises: [],
      },
    ],
  };

  const s = emptyState();
  assert.equal(courseCurrentLevel(s, miniCur), 0);
  assert.equal(courseNextSteps(s, miniCur, null, 'Kube')[0]?.skipTarget?.kind, 'lesson');

  // Bỏ qua từng phần của K00 (lesson -> quiz -> exercise) -> hoàn thành K00 (0 XP) và nhảy lên Cấp 1 (K07)
  s.skippedLessons = { K00: 1 };
  assert.equal(courseNextSteps(s, miniCur, null, 'Kube')[0]?.skipTarget?.kind, 'quiz');
  s.skippedQuizzes = { K00: 1 };
  assert.equal(courseNextSteps(s, miniCur, null, 'Kube')[0]?.skipTarget?.kind, 'exercise');
  s.exercises['K00-E1'] = { status: 'skipped', attempts: 0, hints: 0 };

  assert.deepEqual(courseModuleProgress(s, miniCur.modules[0], 0.7), [3, 3]);
  assert.equal(courseModuleDone(s, miniCur.modules[0], 0.7), true);
  assert.equal(courseCurrentLevel(s, miniCur), 1);
  assert.ok(courseNextSteps(s, miniCur, null, 'Kube')[0]?.text.includes('K07'));
});

console.log(`\n🎉 TẤT CẢ ${passed} BÀI TEST ENGINE ĐỀU XANH!`);

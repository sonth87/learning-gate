import YAML from 'yaml';
import type { GradeResult, GradeTest, RunResult, ValueMatcher, YamlCheckRule } from '../types';

/** Chuyển lượng CPU Kubernetes ('500m', '1', '0.5') sang millicores */
export function parseK8sCpuMillicores(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val * 1000;
  if (typeof val !== 'string') return null;
  const s = val.trim();
  const m = s.match(/^(\d+(?:\.\d+)?)m$/);
  if (m) return Number(m[1]);
  const n = s.match(/^(\d+(?:\.\d+)?)$/);
  if (n) return Number(n[1]) * 1000;
  return null;
}

/** Chuyển lượng RAM Kubernetes ('256Mi', '1Gi', '512M') sang MiB */
export function parseK8sMemoryMi(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val / (1024 * 1024);
  if (typeof val !== 'string') return null;
  const s = val.trim();
  const m = s.match(/^(\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti|K|M|G|T)?$/);
  if (!m) return null;
  const num = Number(m[1]);
  switch (m[2] ?? '') {
    case 'Ki':
      return num / 1024;
    case 'Mi':
      return num;
    case 'Gi':
      return num * 1024;
    case 'Ti':
      return num * 1024 * 1024;
    case 'K':
      return (num * 1000) / (1024 * 1024);
    case 'M':
      return (num * 1e6) / (1024 * 1024);
    case 'G':
      return (num * 1e9) / (1024 * 1024);
    case 'T':
      return (num * 1e12) / (1024 * 1024);
    default:
      return num / (1024 * 1024);
  }
}

/** Render nhẹ template Helm cơ bản với đối tượng values người học viết */
export function renderSimpleHelmTemplate(template: string, values: Record<string, unknown>): string {
  const getByDots = (obj: unknown, path: string): unknown => {
    return path
      .split('.')
      .filter(Boolean)
      .reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined), obj);
  };

  const ctx = {
    Values: values,
    Release: { Name: 'shop-release', Namespace: 'production' },
    Chart: { Name: 'shop-web', Version: '1.0.0' },
  };

  return template.replace(/\{\{-?\s*([^}]+?)\s*-?\}\}/g, (_all, exprRaw: string) => {
    const parts = exprRaw.split('|').map((p) => p.trim());
    let val: unknown;
    const head = parts[0];
    if (head.startsWith('.')) {
      val = getByDots(ctx, head.slice(1));
    }
    for (const pipe of parts.slice(1)) {
      const defMatch = pipe.match(/^default\s+["']?([^"']+)["']?$/);
      if (defMatch && (val === undefined || val === null || val === '')) {
        val = defMatch[1];
      } else if (pipe === 'quote') {
        val = JSON.stringify(String(val ?? ''));
      }
    }
    return val === undefined || val === null ? '' : String(val);
  });
}

export interface ParsedYamlBundle {
  docs: Record<string, unknown>[];
  error: string | null;
  errorLine: number | null;
}

export function parseYamlBundle(source: string, helmTemplate?: string): ParsedYamlBundle {
  if (/\t/.test(source)) {
    const tabLine = source.split('\n').findIndex((l) => l.includes('\t')) + 1;
    return {
      docs: [],
      error: `Lỗi cú pháp YAML ở dòng ${tabLine}: YAML không cho phép thụt lề bằng ký tự Tab cứng — hãy dùng dấu cách (2 spaces).`,
      errorLine: tabLine,
    };
  }

  const parsedDocs = YAML.parseAllDocuments(source, { prettyErrors: true, strict: false });
  for (const d of parsedDocs) {
    if (d.errors.length > 0) {
      const e = d.errors[0];
      const line = e.linePos?.[0]?.line ?? null;
      return {
        docs: [],
        error: line ? `Lỗi cú pháp YAML ở dòng ${line}: ${e.message}` : `Lỗi cú pháp YAML: ${e.message}`,
        errorLine: line,
      };
    }
  }

  let jsDocs = parsedDocs
    .map((d) => d.toJS() as unknown)
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x));

  if (helmTemplate) {
    const values = jsDocs[0] ?? {};
    const rendered = renderSimpleHelmTemplate(helmTemplate, values);
    const renderedParsed = parseYamlBundle(rendered);
    if (renderedParsed.error) return renderedParsed;
    jsDocs = [values, ...renderedParsed.docs];
  }

  if (!jsDocs.length) {
    return {
      docs: [],
      error: 'File YAML đang trống hoặc không tạo ra đối tượng cấu hình hợp lệ.',
      errorLine: 1,
    };
  }

  return { docs: jsDocs, error: null, errorLine: null };
}

/** Lấy giá trị từ đường dẫn kiểu "spec.template.spec.containers[0].ports[containerPort=3000].protocol" */
export function resolvePath(root: unknown, path: string): unknown {
  if (!path) return root;
  const segments = path.match(/[^.[\]]+|\[\d+\]|\[[^[\]]+\]/g) ?? [];
  let cur: unknown = root;
  for (const seg of segments) {
    if (cur === null || cur === undefined) return undefined;
    if (seg.startsWith('[') && seg.endsWith(']')) {
      const inner = seg.slice(1, -1);
      if (!Array.isArray(cur)) return undefined;
      if (/^\d+$/.test(inner)) {
        cur = cur[Number(inner)];
      } else {
        const eqIdx = inner.indexOf('=');
        if (eqIdx > 0) {
          const k = inner.slice(0, eqIdx).trim();
          const v = inner.slice(eqIdx + 1).trim();
          cur = cur.find(
            (item) => item && typeof item === 'object' && String((item as Record<string, unknown>)[k]) === v
          );
        } else {
          return undefined;
        }
      }
    } else {
      if (typeof cur !== 'object' || Array.isArray(cur)) return undefined;
      cur = (cur as Record<string, unknown>)[seg];
    }
  }
  return cur;
}

function findApproximateLine(source: string, path: string): number | undefined {
  const segments = (path.match(/[^.[\]]+/g) ?? []).filter((s) => !/^\d+$/.test(s) && !s.includes('='));
  const lastKey = segments[segments.length - 1];
  if (!lastKey) return undefined;
  const lines = source.split('\n');
  const escaped = lastKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^\\s*(?:-\\s+)?["']?${escaped}["']?\\s*:`);
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i + 1;
  }
  const parentKey = segments[segments.length - 2];
  if (parentKey) {
    const pre = new RegExp(`^\\s*(?:-\\s+)?["']?${parentKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?\\s*:`);
    for (let i = 0; i < lines.length; i++) {
      if (pre.test(lines[i])) return i + 1;
    }
  }
  return undefined;
}

function selectDoc(
  docs: Record<string, unknown>[],
  sel?: number | { kind: string; name?: string }
): Record<string, unknown> | undefined {
  if (sel === undefined) return docs[0];
  if (typeof sel === 'number') return docs[sel];
  return docs.find((d) => {
    if (String(d.kind ?? '') !== sel.kind) return false;
    if (sel.name) {
      const meta = d.metadata as Record<string, unknown> | undefined;
      return String(meta?.name ?? '') === sel.name;
    }
    return true;
  });
}

function formatVal(v: unknown): string {
  if (v === undefined) return '(chưa khai báo)';
  if (typeof v === 'string') return JSON.stringify(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function checkValueMatcher(val: unknown, m: ValueMatcher): { ok: boolean; expected: string; got: string } {
  const got = formatVal(val);
  if ('exists' in m) {
    const actual = val !== undefined && val !== null;
    return { ok: actual === m.exists, expected: m.exists ? 'phải tồn tại' : 'không được tồn tại', got };
  }
  if ('nonEmpty' in m) {
    const ok =
      val !== undefined &&
      val !== null &&
      (typeof val === 'string'
        ? val.trim().length > 0 && !/^_+$/.test(val.trim()) && !val.includes('____')
        : Array.isArray(val)
          ? val.length > 0
          : typeof val === 'object'
            ? Object.keys(val).length > 0
            : true);
    return { ok, expected: 'giá trị khác rỗng', got };
  }
  if ('type' in m) {
    const actualType = Array.isArray(val) ? 'array' : val === null ? 'null' : typeof val;
    return { ok: actualType === m.type, expected: `kiểu ${m.type}`, got: `${got} (${actualType})` };
  }
  if ('eq' in m) {
    const ok = JSON.stringify(val) === JSON.stringify(m.eq);
    return { ok, expected: formatVal(m.eq), got };
  }
  if ('neq' in m) {
    const ok = val !== undefined && JSON.stringify(val) !== JSON.stringify(m.neq);
    return { ok, expected: `khác ${formatVal(m.neq)}`, got };
  }
  if ('oneOf' in m) {
    const ok = m.oneOf.some((item) => JSON.stringify(val) === JSON.stringify(item));
    return { ok, expected: `một trong ${m.oneOf.map(formatVal).join(' | ')}`, got };
  }
  if ('gte' in m) {
    const ok = typeof val === 'number' && val >= m.gte;
    return { ok, expected: `>= ${m.gte}`, got };
  }
  if ('lte' in m) {
    const ok = typeof val === 'number' && val <= m.lte;
    return { ok, expected: `<= ${m.lte}`, got };
  }
  if ('gt' in m) {
    const ok = typeof val === 'number' && val > m.gt;
    return { ok, expected: `> ${m.gt}`, got };
  }
  if ('regex' in m) {
    const re = new RegExp(m.regex, m.flags ?? '');
    const str = typeof val === 'string' ? val : val === undefined ? '' : JSON.stringify(val);
    return { ok: val !== undefined && re.test(str), expected: `khớp /${m.regex}/`, got };
  }
  if ('notRegex' in m) {
    const re = new RegExp(m.notRegex, m.flags ?? '');
    const str = typeof val === 'string' ? val : val === undefined ? '' : JSON.stringify(val);
    return { ok: val !== undefined && !re.test(str), expected: `không chứa /${m.notRegex}/`, got };
  }
  if ('contains' in m) {
    if (Array.isArray(val)) {
      const ok = val.some((x) =>
        typeof m.contains === 'string' && typeof x === 'string'
          ? x === m.contains || x.includes(m.contains)
          : JSON.stringify(x) === JSON.stringify(m.contains)
      );
      return { ok, expected: `mảng chứa ${formatVal(m.contains)}`, got };
    }
    if (typeof val === 'string' && typeof m.contains === 'string') {
      return { ok: val.includes(m.contains), expected: `chuỗi chứa ${formatVal(m.contains)}`, got };
    }
    if (val && typeof val === 'object' && typeof m.contains === 'string') {
      return { ok: m.contains in (val as Record<string, unknown>), expected: `có khoá "${m.contains}"`, got };
    }
    return { ok: false, expected: `chứa ${formatVal(m.contains)}`, got };
  }
  if ('notContains' in m) {
    if (Array.isArray(val)) {
      const has = val.some((x) => JSON.stringify(x) === JSON.stringify(m.notContains));
      return { ok: !has, expected: `không chứa ${formatVal(m.notContains)}`, got };
    }
    if (typeof val === 'string' && typeof m.notContains === 'string') {
      return { ok: !val.includes(m.notContains), expected: `không chứa ${formatVal(m.notContains)}`, got };
    }
    return { ok: true, expected: `không chứa ${formatVal(m.notContains)}`, got };
  }
  if ('k8sCpuMinMillicores' in m) {
    const mc = parseK8sCpuMillicores(val);
    return { ok: mc !== null && mc >= m.k8sCpuMinMillicores, expected: `>= ${m.k8sCpuMinMillicores}m CPU`, got };
  }
  if ('k8sCpuMaxMillicores' in m) {
    const mc = parseK8sCpuMillicores(val);
    return { ok: mc !== null && mc <= m.k8sCpuMaxMillicores, expected: `<= ${m.k8sCpuMaxMillicores}m CPU`, got };
  }
  if ('k8sMemMinMi' in m) {
    const mi = parseK8sMemoryMi(val);
    return { ok: mi !== null && mi >= m.k8sMemMinMi, expected: `>= ${m.k8sMemMinMi}Mi RAM`, got };
  }
  if ('k8sMemMaxMi' in m) {
    const mi = parseK8sMemoryMi(val);
    return { ok: mi !== null && mi <= m.k8sMemMaxMi, expected: `<= ${m.k8sMemMaxMi}Mi RAM`, got };
  }
  return { ok: false, expected: 'hợp lệ', got };
}

function isSubsetLabels(selector: Record<string, unknown> | undefined, podLabels: Record<string, unknown> | undefined): boolean {
  if (!selector || typeof selector !== 'object' || Object.keys(selector).length === 0) return false;
  if (!podLabels || typeof podLabels !== 'object') return false;
  return Object.entries(selector).every(([k, v]) => String(podLabels[k]) === String(v));
}

export function gradeYamlSpec(
  source: string,
  rules: YamlCheckRule[],
  helmTemplate?: string
): GradeResult & { errorLine?: number | null } {
  const parsed = parseYamlBundle(source, helmTemplate);
  if (parsed.error) {
    return { import_error: parsed.error, tests: [], errorLine: parsed.errorLine };
  }
  const { docs } = parsed;
  const tests: GradeTest[] = [];

  for (const r of rules) {
    if (r.kind === 'path') {
      const docObj = selectDoc(docs, r.docSelect);
      if (!docObj) {
        const wantKind = typeof r.docSelect === 'object' ? `${r.docSelect.kind}${r.docSelect.name ? `/${r.docSelect.name}` : ''}` : `document #${r.docSelect}`;
        tests.push({
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: '(không tìm thấy resource)',
          expected: wantKind,
        });
        continue;
      }
      const val = resolvePath(docObj, r.path);
      const res = checkValueMatcher(val, r.match);
      tests.push({
        name: r.id,
        doc: r.doc,
        status: res.ok ? 'pass' : 'fail',
        got: res.ok ? undefined : res.got,
        expected: res.ok ? undefined : `${r.path}: ${res.expected}`,
        line: res.ok ? undefined : findApproximateLine(source, r.path),
      });
      continue;
    }

    if (r.kind === 'image-tag-pinned') {
      const docObj = selectDoc(docs, r.docSelect);
      const img = docObj ? resolvePath(docObj, r.path) : undefined;
      const str = typeof img === 'string' ? img.trim() : '';
      const colonIdx = str.lastIndexOf(':');
      const slashIdx = str.lastIndexOf('/');
      const hasTag = colonIdx > slashIdx;
      const tag = hasTag ? str.slice(colonIdx + 1) : '';
      const ok = Boolean(str && hasTag && tag !== 'latest' && !tag.includes('____'));
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: str || '(chưa có image)',
        expected: 'tên image kèm tag phiên bản cụ thể (không dùng :latest hoặc bỏ trống tag)',
        line: ok ? undefined : findApproximateLine(source, r.path),
      });
      continue;
    }

    if (r.kind === 'k8s-selector-match') {
      const srcDoc = selectDoc(docs, { kind: r.sourceKind, name: r.sourceName });
      if (!srcDoc) {
        tests.push({
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: `(thiếu ${r.sourceKind})`,
          expected: `${r.sourceKind} tồn tại`,
        });
        continue;
      }
      const selector = (
        r.sourceKind === 'Service'
          ? resolvePath(srcDoc, 'spec.selector')
          : resolvePath(srcDoc, 'spec.selector.matchLabels')
      ) as Record<string, unknown> | undefined;

      let targetLabels: Record<string, unknown> | undefined;
      if (!r.targetKind || (r.sourceKind !== 'Service' && r.targetKind === r.sourceKind)) {
        targetLabels = resolvePath(srcDoc, 'spec.template.metadata.labels') as Record<string, unknown> | undefined;
      } else {
        const tgtDoc =
          selectDoc(docs, { kind: r.targetKind, name: r.targetName }) ??
          docs.find((d) => d.kind === 'Deployment' || d.kind === 'StatefulSet' || d.kind === 'Pod');
        targetLabels = (
          tgtDoc?.kind === 'Pod'
            ? resolvePath(tgtDoc, 'metadata.labels')
            : resolvePath(tgtDoc, 'spec.template.metadata.labels')
        ) as Record<string, unknown> | undefined;
      }

      const ok = isSubsetLabels(selector, targetLabels);
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: `selector=${formatVal(selector)}`,
        expected: `khớp với Pod labels=${formatVal(targetLabels)}`,
        line: ok ? undefined : findApproximateLine(source, 'selector'),
      });
      continue;
    }

    if (r.kind === 'k8s-service-port-match') {
      const svc = selectDoc(docs, { kind: 'Service', name: r.serviceName });
      const workload =
        (r.targetKind ? selectDoc(docs, { kind: r.targetKind, name: r.targetName }) : undefined) ??
        docs.find((d) => d.kind === 'Deployment' || d.kind === 'StatefulSet' || d.kind === 'Pod');
      if (!svc || !workload) {
        tests.push({
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: !svc ? '(thiếu Service)' : '(thiếu Pod/Deployment)',
          expected: 'có đủ cả Service và Pod/Deployment',
        });
        continue;
      }
      const svcPorts = (resolvePath(svc, 'spec.ports') as Record<string, unknown>[] | undefined) ?? [];
      const containers = (
        workload.kind === 'Pod'
          ? resolvePath(workload, 'spec.containers')
          : resolvePath(workload, 'spec.template.spec.containers')
      ) as Record<string, unknown>[] | undefined;
      const containerPorts = (containers ?? []).flatMap(
        (c) => ((c.ports as Record<string, unknown>[] | undefined) ?? [])
      );
      const validTargets = new Set<string>();
      for (const cp of containerPorts) {
        if (cp.containerPort !== undefined) validTargets.add(String(cp.containerPort));
        if (cp.name) validTargets.add(String(cp.name));
      }
      const firstSvcPort = svcPorts[0];
      const targetPort = firstSvcPort ? String(firstSvcPort.targetPort ?? firstSvcPort.port ?? '') : '';
      const ok = Boolean(firstSvcPort && validTargets.has(targetPort));
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: `Service targetPort=${targetPort || '(trống)'}`,
        expected: `khớp với containerPort (${[...validTargets].join(' hoặc ') || 'chưa khai báo containerPort'})`,
        line: ok ? undefined : findApproximateLine(source, 'targetPort'),
      });
      continue;
    }

    if (r.kind === 'k8s-ingress-backend-match') {
      const ing = selectDoc(docs, { kind: 'Ingress', name: r.ingressName });
      if (!ing) {
        tests.push({ name: r.id, doc: r.doc, status: 'fail', got: '(thiếu Ingress)', expected: 'kind: Ingress' });
        continue;
      }
      const rulesList = (resolvePath(ing, 'spec.rules') as Record<string, unknown>[] | undefined) ?? [];
      let matched = false;
      for (const ruleItem of rulesList) {
        if (r.host && ruleItem.host !== r.host) continue;
        const paths = (resolvePath(ruleItem, 'http.paths') as Record<string, unknown>[] | undefined) ?? [];
        for (const p of paths) {
          if (r.path && p.path !== r.path) continue;
          const svcName = resolvePath(p, 'backend.service.name');
          const portNum = resolvePath(p, 'backend.service.port.number') ?? resolvePath(p, 'backend.service.port.name');
          const svcOk = !r.expectedService || svcName === r.expectedService;
          const portOk = !r.expectedPort || String(portNum) === String(r.expectedPort);
          if (svcOk && portOk) matched = true;
        }
      }
      tests.push({
        name: r.id,
        doc: r.doc,
        status: matched ? 'pass' : 'fail',
        got: formatVal(rulesList),
        expected: `host=${r.host ?? '*'}, path=${r.path ?? '*'} -> service ${r.expectedService ?? '*'}:${r.expectedPort ?? '*'}`,
        line: matched ? undefined : findApproximateLine(source, 'backend'),
      });
      continue;
    }

    if (r.kind === 'gha-no-script-injection') {
      const jobs = (resolvePath(docs[0], 'jobs') as Record<string, Record<string, unknown>> | undefined) ?? {};
      const entries = r.jobId ? [[r.jobId, jobs[r.jobId]] as const] : Object.entries(jobs);
      const dangerousRe =
        /\$\{\{\s*github\.event\.(?:pull_request\.(?:title|body|head\.ref)|issue\.(?:title|body)|comment\.body|commits\[[^\]]*\]\.message|head_commit\.message)/;
      let badRun: string | null = null;
      for (const [, job] of entries) {
        if (!job) continue;
        const steps = (job.steps as Record<string, unknown>[] | undefined) ?? [];
        for (const st of steps) {
          if (typeof st.run === 'string' && dangerousRe.test(st.run)) {
            badRun = st.run.trim();
            break;
          }
        }
      }
      const hasSteps = entries.some(([, j]) => j && Array.isArray(j.steps) && j.steps.length > 0);
      const ok = hasSteps && !badRun;
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: badRun ?? (hasSteps ? 'an toàn' : '(chưa có steps)'),
        expected: 'truyền dữ liệu PR/Issue qua biến môi trường env: thay vì nối trực tiếp ${{ github.event... }} vào run:',
        line: ok ? undefined : findApproximateLine(source, 'run'),
      });
      continue;
    }

    if (r.kind === 'gha-uses-pinned') {
      const jobs = (resolvePath(docs[0], 'jobs') as Record<string, Record<string, unknown>> | undefined) ?? {};
      const entries = r.jobId ? [[r.jobId, jobs[r.jobId]] as const] : Object.entries(jobs);
      let foundUses: string | null = null;
      for (const [, job] of entries) {
        if (!job) continue;
        const steps = (job.steps as Record<string, unknown>[] | undefined) ?? [];
        for (const st of steps) {
          if (typeof st.uses === 'string' && st.uses.startsWith(r.actionPrefix)) {
            foundUses = st.uses.trim();
            break;
          }
        }
      }
      let ok = false;
      if (foundUses && foundUses.includes('@')) {
        const ref = foundUses.split('@')[1];
        if (/^[0-9a-f]{40}$/i.test(ref)) ok = true;
        else {
          const vm = ref.match(/^v(\d+)/);
          if (vm) ok = r.minMajor ? Number(vm[1]) >= r.minMajor : true;
        }
      }
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: foundUses ?? `(chưa gọi ${r.actionPrefix})`,
        expected: `${r.actionPrefix}@v${r.minMajor ?? 4} (hoặc commit SHA 40 ký tự)`,
        line: ok ? undefined : findApproximateLine(source, 'uses'),
      });
      continue;
    }

    if (r.kind === 'network-policy-rule') {
      const np = selectDoc(docs, { kind: 'NetworkPolicy', name: r.policyName });
      if (!np) {
        tests.push({ name: r.id, doc: r.doc, status: 'fail', got: '(thiếu NetworkPolicy)', expected: 'kind: NetworkPolicy' });
        continue;
      }
      const policyTypes = (resolvePath(np, 'spec.policyTypes') as string[] | undefined) ?? [];
      const hasDir = policyTypes.includes(r.direction);
      const listKey = r.direction === 'Ingress' ? 'spec.ingress' : 'spec.egress';
      const rulesArr = (resolvePath(np, listKey) as Record<string, unknown>[] | undefined) ?? [];
      let ok = hasDir;
      if (ok && (r.expectedPort || r.expectedPodLabel)) {
        ok = rulesArr.some((item) => {
          const ports = (item.ports as Record<string, unknown>[] | undefined) ?? [];
          const portOk = !r.expectedPort || ports.some((p) => Number(p.port) === r.expectedPort);
          const peers = ((item.from ?? item.to) as Record<string, unknown>[] | undefined) ?? [];
          const labelOk =
            !r.expectedPodLabel ||
            peers.some((peer) =>
              isSubsetLabels(
                r.expectedPodLabel,
                resolvePath(peer, 'podSelector.matchLabels') as Record<string, unknown> | undefined
              )
            );
          return portOk && labelOk;
        });
      }
      tests.push({
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: formatVal(np.spec),
        expected: `policyTypes chứa "${r.direction}"${r.expectedPort ? `, port ${r.expectedPort}` : ''}${r.expectedPodLabel ? `, podSelector ${formatVal(r.expectedPodLabel)}` : ''}`,
      });
    }
  }

  const firstFailLine = tests.find((t) => t.status !== 'pass' && t.line)?.line ?? null;
  return { import_error: null, tests, errorLine: firstFailLine };
}

export function dryRunYaml(source: string, helmTemplate?: string): Omit<RunResult, 'ms'> {
  const parsed = parseYamlBundle(source, helmTemplate);
  if (parsed.error) {
    return { stdout: '', stderr: parsed.error, exitCode: 1 };
  }
  const lines: string[] = [`✔ Cú pháp YAML hợp lệ (${parsed.docs.length} document):`];
  parsed.docs.forEach((doc, idx) => {
    if (doc.apiVersion && doc.kind) {
      const meta = (doc.metadata as Record<string, unknown> | undefined) ?? {};
      const ns = meta.namespace ? ` (namespace: ${meta.namespace})` : '';
      lines.push(`  [${idx + 1}] K8s Resource: ${doc.apiVersion} · ${doc.kind}/${meta.name ?? '(chưa đặt tên)'}${ns}`);
    } else if (doc.services && typeof doc.services === 'object') {
      const svcNames = Object.keys(doc.services as Record<string, unknown>);
      lines.push(`  [${idx + 1}] Docker Compose: ${svcNames.length} services (${svcNames.join(', ')})`);
    } else if (doc.jobs && typeof doc.jobs === 'object') {
      const jobNames = Object.keys(doc.jobs as Record<string, unknown>);
      lines.push(`  [${idx + 1}] GitHub Actions Workflow "${doc.name ?? 'unnamed'}": ${jobNames.length} jobs (${jobNames.join(' → ')})`);
    } else if (doc.stages && Array.isArray(doc.stages)) {
      lines.push(`  [${idx + 1}] GitLab CI Pipeline: stages [${doc.stages.join(' → ')}]`);
    } else {
      lines.push(`  [${idx + 1}] Object keys: ${Object.keys(doc).join(', ')}`);
    }
  });
  return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
}

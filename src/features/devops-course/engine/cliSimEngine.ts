import YAML from 'yaml';
import type {
  CliStateCheckRule,
  ExerciseSpec,
  GradeResult,
  GradeTest,
  RunResult,
  SimContainer,
  SimK8sDeployment,
  SimK8sPod,
  SimWorldState,
} from '../types';
import { gradeYamlSpec, parseK8sMemoryMi } from './yamlGrader';
import { gradeDockerfileSpec } from './dockerfileGrader';
import {
  createRedisRuntime,
  evaluateRedisCliRules,
  executeRedisCommand,
  gradeRedisCliSpec,
  stripRedisCliWrapper,
} from './redisCliEngine';
import { gradeRedisConfSpec } from './redisConfGrader';

function cloneWorld(state: SimWorldState): SimWorldState {
  return JSON.parse(JSON.stringify(state)) as SimWorldState;
}

/** Tách chuỗi dòng lệnh thành từng lệnh độc lập (theo xuống dòng, `;`, `&&`), bỏ dòng comment `#` */
export function splitShellCommands(script: string): { cmd: string; line: number }[] {
  const rawLines = script.replace(/\r/g, '').split('\n');
  const merged: { text: string; line: number }[] = [];

  let i = 0;
  while (i < rawLines.length) {
    const startLine = i + 1;
    let cur = rawLines[i];
    const trimmed = cur.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }
    while (cur.trimEnd().endsWith('\\') && i + 1 < rawLines.length) {
      cur = cur.trimEnd().slice(0, -1) + ' ';
      i++;
      const nxt = rawLines[i];
      if (!nxt.trim().startsWith('#')) cur += nxt.trim();
    }
    merged.push({ text: cur, line: startLine });
    i++;
  }

  const out: { cmd: string; line: number }[] = [];
  for (const { text, line } of merged) {
    let inSingle = false;
    let inDouble = false;
    let buf = '';
    for (let j = 0; j < text.length; j++) {
      const ch = text[j];
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
        buf += ch;
      } else if (ch === '"' && !inSingle && text[j - 1] !== '\\') {
        inDouble = !inDouble;
        buf += ch;
      } else if (!inSingle && !inDouble && ch === '#' && (j === 0 || /\s/.test(text[j - 1]))) {
        break;
      } else if (!inSingle && !inDouble && ch === ';') {
        if (buf.trim()) out.push({ cmd: buf.trim(), line });
        buf = '';
      } else if (!inSingle && !inDouble && ch === '&' && text[j + 1] === '&') {
        if (buf.trim()) out.push({ cmd: buf.trim(), line });
        buf = '';
        j++;
      } else {
        buf += ch;
      }
    }
    if (buf.trim()) out.push({ cmd: buf.trim(), line });
  }
  return out;
}

export function tokenizeCommand(cmd: string): string[] {
  const clean = cmd.replace(/^\$\s+/, '').trim();
  const tokens: string[] = [];
  let cur = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle && clean[i - 1] !== '\\') {
      inDouble = !inDouble;
    } else if (/\s/.test(ch) && !inSingle && !inDouble) {
      if (cur.length > 0) {
        tokens.push(cur);
        cur = '';
      }
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0) tokens.push(cur);
  return tokens;
}

function ensureDocker(world: SimWorldState) {
  world.docker ??= {
    images: [
      { repo: 'nginx', tag: '1.27-alpine', sizeMB: 43 },
      { repo: 'node', tag: '22-alpine', sizeMB: 138 },
      { repo: 'postgres', tag: '16-alpine', sizeMB: 242 },
      { repo: 'redis', tag: '7-alpine', sizeMB: 34 },
      { repo: 'alpine', tag: '3.20', sizeMB: 8 },
    ],
    containers: [],
    volumes: [],
    networks: ['bridge', 'host', 'none'],
  };
  return world.docker;
}

function ensureK8s(world: SimWorldState) {
  world.k8s ??= {
    namespaces: ['default', 'kube-system'],
    pods: [],
    deployments: [],
    services: [],
    configMaps: [],
    secrets: [],
    pvcs: [],
    availableStorageClasses: ['standard', 'gp3'],
  };
  return world.k8s;
}

function ensureGit(world: SimWorldState) {
  world.git ??= {
    currentBranch: 'main',
    branches: ['main'],
    commits: [{ sha: 'a1b2c3d', branch: 'main', message: 'chore: initial commit' }],
    tags: {},
    files: { 'package.json': '{"name":"app","version":"1.0.0"}' },
    staged: [],
  };
  return world.git;
}

function splitImageRef(img: string): { repo: string; tag: string } {
  const lastColon = img.lastIndexOf(':');
  const lastSlash = img.lastIndexOf('/');
  if (lastColon > lastSlash) {
    return { repo: img.slice(0, lastColon), tag: img.slice(lastColon + 1) };
  }
  return { repo: img, tag: 'latest' };
}

function labelsMatch(selector: Record<string, string>, labels: Record<string, string>): boolean {
  const entries = Object.entries(selector);
  if (!entries.length) return false;
  return entries.every(([k, v]) => labels[k] === v);
}

/** Tự động tính lại trạng thái Pod của K8s khi ConfigMap / Secret / PVC / Image / Labels được sửa */
function reconcileK8sCluster(world: SimWorldState): void {
  const k8s = world.k8s;
  if (!k8s) return;

  for (const dep of k8s.deployments) {
    const matchingPods = k8s.pods.filter(
      (p) => p.namespace === dep.namespace && labelsMatch(dep.selector, p.labels)
    );
    // Điều chỉnh số lượng Pod khớp replicas của Deployment
    while (matchingPods.length < dep.replicas) {
      const suffix = `${Math.abs((dep.name.length * 37 + matchingPods.length * 13 + dep.revision * 7) % 89999) + 10000}`;
      const pod: SimK8sPod = {
        name: `${dep.name}-${suffix}`,
        namespace: dep.namespace,
        labels: { ...dep.podLabels },
        image: dep.image,
        status: 'Running',
        ready: true,
        restarts: 0,
        node: 'worker-node-1',
        ports: [dep.containerPort ?? 3000],
        envFromConfigMaps: dep.envConfigMaps ? [...dep.envConfigMaps] : undefined,
        envFromSecrets: dep.envSecrets ? [...dep.envSecrets] : undefined,
        imagePullSecrets: dep.imagePullSecrets ? [...dep.imagePullSecrets] : undefined,
        memoryLimitMi: dep.memoryLimitMi,
        logs: [`Server listening on port ${dep.containerPort ?? 3000}`],
        events: [`Normal  Scheduled  Successfully assigned ${dep.namespace}/${dep.name}-${suffix} to worker-node-1`],
      };
      k8s.pods.push(pod);
      matchingPods.push(pod);
    }
    if (matchingPods.length > dep.replicas) {
      const toRemove = new Set(matchingPods.slice(dep.replicas).map((p) => p.name));
      k8s.pods = k8s.pods.filter((p) => !(p.namespace === dep.namespace && toRemove.has(p.name)));
    }
    for (const p of k8s.pods) {
      if (p.namespace === dep.namespace && labelsMatch(dep.selector, p.labels)) {
        p.image = dep.image;
        if (dep.memoryLimitMi !== undefined) p.memoryLimitMi = dep.memoryLimitMi;
        if (dep.envConfigMaps) p.envFromConfigMaps = [...dep.envConfigMaps];
        if (dep.envSecrets) p.envFromSecrets = [...dep.envSecrets];
        if (dep.imagePullSecrets) p.imagePullSecrets = [...dep.imagePullSecrets];
        if (dep.containerPort) p.ports = [dep.containerPort];
      }
    }
  }

  for (const pvc of k8s.pvcs) {
    const validClasses = k8s.availableStorageClasses ?? ['standard', 'gp3'];
    pvc.bound = !pvc.storageClass || validClasses.includes(pvc.storageClass);
  }

  for (const pod of k8s.pods) {
    if (pod.status === 'Terminating') continue;

    // 1. Kiểm tra Image hợp lệ
    if (
      pod.image.includes(':nonexistent') ||
      pod.image.includes(':broken-tag') ||
      pod.image.includes(':typo') ||
      (k8s.registryImages && !k8s.registryImages.includes(pod.image))
    ) {
      pod.status = 'ImagePullBackOff';
      pod.ready = false;
      continue;
    }

    // Private registry cần imagePullSecrets
    if (pod.image.startsWith('private.registry.local/')) {
      const hasPullSecret = (pod.imagePullSecrets ?? []).some((secName) =>
        k8s.secrets.some((s) => s.namespace === pod.namespace && s.name === secName)
      );
      if (!hasPullSecret) {
        pod.status = 'ImagePullBackOff';
        pod.ready = false;
        continue;
      }
    }

    // 2. Kiểm tra ConfigMap & Secret tham chiếu
    const missingCm = (pod.envFromConfigMaps ?? []).find(
      (cm) => !k8s.configMaps.some((c) => c.namespace === pod.namespace && c.name === cm)
    );
    const missingSec = (pod.envFromSecrets ?? []).find(
      (sec) => !k8s.secrets.some((s) => s.namespace === pod.namespace && s.name === sec)
    );
    if (missingCm || missingSec) {
      pod.status = 'CreateContainerConfigError';
      pod.ready = false;
      continue;
    }

    // 3. Kiểm tra PVC bound
    const unboundPvc = (pod.pvcClaims ?? []).find((claim) => {
      const pvc = k8s.pvcs.find((v) => v.namespace === pod.namespace && v.name === claim);
      return !pvc || !pvc.bound;
    });
    if (unboundPvc) {
      pod.status = 'Pending';
      pod.ready = false;
      continue;
    }

    // 4. Kiểm tra OOMKilled (nếu memoryLimitMi quá thấp < 64Mi)
    if (pod.memoryLimitMi !== undefined && pod.memoryLimitMi < 64) {
      pod.status = 'OOMKilled';
      pod.ready = false;
      continue;
    }

    // 5. Kiểm tra CrashLoopBackOff (image có hậu tố -crash hoặc -buggy)
    if (pod.image.includes('-crash') || pod.image.includes(':buggy')) {
      pod.status = 'CrashLoopBackOff';
      pod.ready = false;
      continue;
    }

    // Nếu trước đó đang lỗi do thiếu config/image/OOM/Pending mà nay đã đủ điều kiện -> chuyển sang Running
    if (
      pod.status === 'ImagePullBackOff' ||
      pod.status === 'ErrImagePull' ||
      pod.status === 'CreateContainerConfigError' ||
      pod.status === 'OOMKilled' ||
      pod.status === 'CrashLoopBackOff' ||
      (pod.status === 'Pending' && pod.node !== 'unschedulable')
    ) {
      pod.status = 'Running';
      pod.ready = true;
    }
  }
}

interface ExecStepResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

function runDockerCommand(args: string[], world: SimWorldState): ExecStepResult {
  const docker = ensureDocker(world);
  const sub = args[0];
  if (!sub) {
    return { stdout: '', stderr: 'Thiếu lệnh con cho docker (ví dụ: docker ps, docker run, docker build...).', exitCode: 1 };
  }

  if (sub === 'compose') {
    const csub = args[1];
    if (csub === 'up') {
      const detached = args.includes('-d') || args.includes('--detach');
      if (!docker.networks.includes('app_default')) docker.networks.push('app_default');
      if (!docker.containers.some((c) => c.name === 'compose-api')) {
        docker.containers.push({
          id: 'c0mp05e1',
          name: 'compose-api',
          image: 'app-api:local',
          status: 'running',
          exitCode: 0,
          ports: [{ host: 3000, container: 3000 }],
          env: { NODE_ENV: 'development' },
          volumes: [],
          network: 'app_default',
          logs: ['API ready on :3000'],
        });
      }
      return {
        stdout: `[+] Running 2/2\n ✔ Network app_default   Created\n ✔ Container compose-api Started${detached ? ' (detached)' : ''}`,
        stderr: '',
        exitCode: 0,
      };
    }
    if (csub === 'down') {
      const removeVols = args.includes('-v') || args.includes('--volumes');
      docker.containers = docker.containers.filter((c) => c.network !== 'app_default');
      if (removeVols) docker.volumes = [];
      return { stdout: '[+] Running 1/1\n ✔ Containers & networkapp_default Removed', stderr: '', exitCode: 0 };
    }
    if (csub === 'ps') {
      const list = docker.containers.map((c) => `${c.name}\t${c.image}\t${c.status}`).join('\n');
      return { stdout: `NAME\tIMAGE\tSTATUS\n${list}`, stderr: '', exitCode: 0 };
    }
    return { stdout: '', stderr: `Lệnh "docker compose ${csub ?? ''}" chưa được hỗ trợ trong mô phỏng (dùng: up -d, down, ps).`, exitCode: 1 };
  }

  if (sub === 'pull') {
    const ref = args[1];
    if (!ref) return { stdout: '', stderr: 'docker pull cần tên image (ví dụ: docker pull nginx:1.27-alpine).', exitCode: 1 };
    const { repo, tag } = splitImageRef(ref);
    if (!docker.images.some((i) => i.repo === repo && i.tag === tag)) {
      docker.images.push({ repo, tag, sizeMB: 65 });
    }
    return { stdout: `${tag}: Pulling from library/${repo}\nStatus: Downloaded newer image for ${repo}:${tag}`, stderr: '', exitCode: 0 };
  }

  if (sub === 'images' || (sub === 'image' && args[1] === 'ls')) {
    const rows = docker.images.map((im) => `${im.repo.padEnd(22)} ${im.tag.padEnd(16)} ${im.sizeMB}MB`);
    return { stdout: `REPOSITORY             TAG              SIZE\n${rows.join('\n')}`, stderr: '', exitCode: 0 };
  }

  if (sub === 'build') {
    let tagRef = 'unnamed:latest';
    for (let i = 1; i < args.length; i++) {
      if ((args[i] === '-t' || args[i] === '--tag') && args[i + 1]) {
        tagRef = args[++i];
      } else if (args[i].startsWith('--tag=')) {
        tagRef = args[i].slice(6);
      }
    }
    const hasContext = args.some((a, idx) => idx > 0 && !a.startsWith('-') && args[idx - 1] !== '-t' && args[idx - 1] !== '--tag' && args[idx - 1] !== '-f');
    if (!hasContext) {
      return {
        stdout: '',
        stderr: 'ERROR: "docker build" yêu cầu đường dẫn Build Context (thường là dấu chấm `.` ở cuối lệnh).',
        exitCode: 1,
      };
    }
    const { repo, tag } = splitImageRef(tagRef);
    const existing = docker.images.find((i) => i.repo === repo && i.tag === tag);
    if (!existing) docker.images.push({ repo, tag, sizeMB: 92 });
    return {
      stdout: `[+] Building 1.2s (8/8) FINISHED\n => naming to docker.io/library/${repo}:${tag}`,
      stderr: '',
      exitCode: 0,
    };
  }

  if (sub === 'ps') {
    const showAll = args.includes('-a') || args.includes('--all');
    const list = docker.containers.filter((c) => showAll || c.status === 'running');
    const header = 'CONTAINER ID   IMAGE                  STATUS                   PORTS                    NAMES';
    const rows = list.map((c) => {
      const st = c.status === 'running' ? 'Up 2 minutes' : `Exited (${c.exitCode}) 1m ago`;
      const ports = c.ports.map((p) => `0.0.0.0:${p.host}->${p.container}/tcp`).join(', ');
      return `${c.id.padEnd(14)} ${c.image.padEnd(22)} ${st.padEnd(24)} ${ports.padEnd(24)} ${c.name}`;
    });
    return { stdout: [header, ...rows].join('\n'), stderr: '', exitCode: 0 };
  }

  if (sub === 'run') {
    let name = '';
    let detached = false;
    let removeAfter = false;
    let network = 'bridge';
    let memoryLimit: string | undefined;
    let user: string | undefined;
    const ports: { host: number; container: number }[] = [];
    const env: Record<string, string> = {};
    const volumes: { source: string; target: string; type: 'volume' | 'bind' }[] = [];
    let image = '';
    const cmdRest: string[] = [];

    for (let i = 1; i < args.length; i++) {
      const a = args[i];
      if (!image && a.startsWith('-')) {
        if (a === '-d' || a === '--detach') detached = true;
        else if (a === '--rm') removeAfter = true;
        else if (a === '-it' || a === '-i' || a === '-t' || a === '-ti') {
          // interactive tty flags
        } else if ((a === '--name' || a === '-n') && args[i + 1]) name = args[++i];
        else if (a.startsWith('--name=')) name = a.slice(7);
        else if ((a === '-p' || a === '--publish') && args[i + 1]) {
          const pm = args[++i].match(/^(?:[\d.]+:)?(\d+):(\d+)/);
          if (!pm) return { stdout: '', stderr: `Cờ -p không hợp lệ: "${args[i]}". Cú pháp chuẩn: -p HOST_PORT:CONTAINER_PORT`, exitCode: 1 };
          ports.push({ host: Number(pm[1]), container: Number(pm[2]) });
        } else if ((a === '-e' || a === '--env') && args[i + 1]) {
          const kv = args[++i];
          const eq = kv.indexOf('=');
          if (eq > 0) env[kv.slice(0, eq)] = kv.slice(eq + 1);
        } else if (a.startsWith('--env=')) {
          const kv = a.slice(6);
          const eq = kv.indexOf('=');
          if (eq > 0) env[kv.slice(0, eq)] = kv.slice(eq + 1);
        } else if ((a === '-v' || a === '--volume') && args[i + 1]) {
          const vm = args[++i].split(':');
          if (vm.length >= 2) {
            const src = vm[0];
            const dst = vm[1];
            const isBind = src.startsWith('/') || src.startsWith('./') || src.startsWith('../') || src.startsWith('$');
            if (!isBind && !docker.volumes.includes(src)) docker.volumes.push(src);
            volumes.push({ source: src, target: dst, type: isBind ? 'bind' : 'volume' });
          }
        } else if (a === '--network' && args[i + 1]) network = args[++i];
        else if (a.startsWith('--network=')) network = a.slice(10);
        else if ((a === '-m' || a === '--memory') && args[i + 1]) memoryLimit = args[++i];
        else if (a.startsWith('--memory=')) memoryLimit = a.slice(9);
        else if ((a === '-u' || a === '--user') && args[i + 1]) user = args[++i];
        else if (a.startsWith('--user=')) user = a.slice(7);
      } else if (!image) {
        image = a;
      } else {
        cmdRest.push(a);
      }
    }

    if (!image) {
      return { stdout: '', stderr: 'docker run thiếu tên image.', exitCode: 1 };
    }
    if (!name) {
      name = `${image.split(/[/:]/)[0]}-${docker.containers.length + 1}`;
    }
    if (docker.containers.some((c) => c.name === name)) {
      return {
        stdout: '',
        stderr: `docker: Error response from daemon: Conflict. The container name "/${name}" is already in use. Hãy xoá container cũ bằng "docker rm -f ${name}" hoặc đặt tên khác.`,
        exitCode: 125,
      };
    }
    for (const p of ports) {
      const conflict = docker.containers.find(
        (c) => c.status === 'running' && c.ports.some((cp) => cp.host === p.host)
      );
      if (conflict) {
        return {
          stdout: '',
          stderr: `docker: Error response from daemon: Bind for 0.0.0.0:${p.host} failed: port is already allocated (đang bị chiếm bởi container "${conflict.name}").`,
          exitCode: 125,
        };
      }
    }
    if (!docker.networks.includes(network)) {
      return {
        stdout: '',
        stderr: `docker: Error response from daemon: network ${network} not found.`,
        exitCode: 125,
      };
    }

    const { repo, tag } = splitImageRef(image);
    if (!docker.images.some((i) => i.repo === repo && i.tag === tag)) {
      docker.images.push({ repo, tag, sizeMB: 55 });
    }

    // Mô phỏng OOM nếu memoryLimit <= 16m cho tiến trình ngốn RAM
    const isOom = memoryLimit && /^([1-9]|1[0-6])m$/i.test(memoryLimit) && cmdRest.join(' ').includes('alloc');
    const isOneShot =
      !detached &&
      cmdRest.length > 0 &&
      (cmdRest[0] === 'echo' || cmdRest[0] === 'sh' || cmdRest[0] === 'cat' || cmdRest[0] === 'node');

    const id = `c${Math.abs((name.length * 97 + docker.containers.length * 31) % 899999 + 100000)}`;
    const status: 'running' | 'exited' = isOom || isOneShot ? 'exited' : 'running';
    const exitCode = isOom ? 137 : 0;
    const logs = isOom
      ? ['Allocating buffer...', 'Killed (OOM - Exit Code 137)']
      : cmdRest[0] === 'echo'
        ? [cmdRest.slice(1).join(' ')]
        : [`[${name}] Ready (${image})${Object.keys(env).length ? ` env=${JSON.stringify(env)}` : ''}`];

    if (!removeAfter || status === 'running') {
      docker.containers.push({
        id,
        name,
        image: image.includes(':') ? image : `${repo}:${tag}`,
        status,
        exitCode,
        ports,
        env,
        volumes,
        network,
        memoryLimit,
        user,
        logs,
        cmd: cmdRest.join(' ') || undefined,
      });
    }

    return {
      stdout: detached ? `${id}0123456789abcdef` : logs.join('\n'),
      stderr: isOom ? 'Container bị Linux Kernel OOM Killer dừng với mã thoát 137.' : '',
      exitCode,
    };
  }

  if (sub === 'stop' || sub === 'kill') {
    const targets = args.slice(1).filter((a) => !a.startsWith('-'));
    if (!targets.length) return { stdout: '', stderr: `docker ${sub} cần tên hoặc ID container.`, exitCode: 1 };
    const out: string[] = [];
    for (const t of targets) {
      const c = docker.containers.find((x) => x.name === t || x.id.startsWith(t));
      if (!c) return { stdout: '', stderr: `Error response from daemon: No such container: ${t}`, exitCode: 1 };
      c.status = 'exited';
      c.exitCode = sub === 'kill' ? 137 : 0;
      out.push(t);
    }
    return { stdout: out.join('\n'), stderr: '', exitCode: 0 };
  }

  if (sub === 'start' || sub === 'restart') {
    const targets = args.slice(1).filter((a) => !a.startsWith('-'));
    if (!targets.length) return { stdout: '', stderr: `docker ${sub} cần tên hoặc ID container.`, exitCode: 1 };
    const out: string[] = [];
    for (const t of targets) {
      const c = docker.containers.find((x) => x.name === t || x.id.startsWith(t));
      if (!c) return { stdout: '', stderr: `Error response from daemon: No such container: ${t}`, exitCode: 1 };
      c.status = 'running';
      c.exitCode = 0;
      out.push(t);
    }
    return { stdout: out.join('\n'), stderr: '', exitCode: 0 };
  }

  if (sub === 'rm') {
    const force = args.includes('-f') || args.includes('--force') || args.includes('-vf') || args.includes('-fv');
    const targets = args.slice(1).filter((a) => !a.startsWith('-'));
    if (!targets.length) return { stdout: '', stderr: 'docker rm cần tên hoặc ID container.', exitCode: 1 };
    const out: string[] = [];
    for (const t of targets) {
      const idx = docker.containers.findIndex((x) => x.name === t || x.id.startsWith(t));
      if (idx < 0) return { stdout: '', stderr: `Error response from daemon: No such container: ${t}`, exitCode: 1 };
      if (docker.containers[idx].status === 'running' && !force) {
        return {
          stdout: '',
          stderr: `Error response from daemon: cannot remove running container ${t}. Stop the container before attempting removal or force remove (-f).`,
          exitCode: 1,
        };
      }
      docker.containers.splice(idx, 1);
      out.push(t);
    }
    return { stdout: out.join('\n'), stderr: '', exitCode: 0 };
  }

  if (sub === 'logs') {
    const target = args.slice(1).find((a) => !a.startsWith('-'));
    const c = docker.containers.find((x) => x.name === target || (target && x.id.startsWith(target)));
    if (!c) return { stdout: '', stderr: `Error response from daemon: No such container: ${target ?? ''}`, exitCode: 1 };
    return { stdout: c.logs.join('\n'), stderr: '', exitCode: 0 };
  }

  if (sub === 'inspect') {
    const target = args.slice(1).find((a) => !a.startsWith('-'));
    const c = docker.containers.find((x) => x.name === target || (target && x.id.startsWith(target)));
    if (!c) return { stdout: '', stderr: `Error: No such object: ${target ?? ''}`, exitCode: 1 };
    return { stdout: JSON.stringify([c], null, 2), stderr: '', exitCode: 0 };
  }

  if (sub === 'exec') {
    const nonFlags = args.slice(1).filter((a) => !a.startsWith('-'));
    const target = nonFlags[0];
    const execCmd = nonFlags.slice(1).join(' ');
    const c = docker.containers.find((x) => x.name === target || (target && x.id.startsWith(target)));
    if (!c || c.status !== 'running') {
      return { stdout: '', stderr: `Error: Container ${target ?? ''} không tồn tại hoặc chưa chạy.`, exitCode: 1 };
    }
    if (execCmd.includes('ps')) {
      return { stdout: `PID   USER     COMMAND\n    1 ${c.user ?? 'root'}     ${c.cmd ?? 'node server.js'}`, stderr: '', exitCode: 0 };
    }
    if (execCmd.includes('whoami') || execCmd.includes('id')) {
      return { stdout: c.user ?? 'root', stderr: '', exitCode: 0 };
    }
    if (execCmd.includes('env') || execCmd.includes('printenv')) {
      return {
        stdout: Object.entries(c.env)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n'),
        stderr: '',
        exitCode: 0,
      };
    }
    return { stdout: `[exec:${c.name}] ${execCmd || 'ok'}`, stderr: '', exitCode: 0 };
  }

  if (sub === 'volume') {
    const vsub = args[1];
    if (vsub === 'create' && args[2]) {
      if (!docker.volumes.includes(args[2])) docker.volumes.push(args[2]);
      return { stdout: args[2], stderr: '', exitCode: 0 };
    }
    if (vsub === 'ls') {
      return {
        stdout: `DRIVER    VOLUME NAME\n${docker.volumes.map((v) => `local     ${v}`).join('\n')}`,
        stderr: '',
        exitCode: 0,
      };
    }
  }

  if (sub === 'network') {
    const nsub = args[1];
    if (nsub === 'create' && args[2]) {
      const netName = args[args.length - 1];
      if (!docker.networks.includes(netName)) docker.networks.push(netName);
      return { stdout: `net-${netName}`, stderr: '', exitCode: 0 };
    }
    if (nsub === 'ls') {
      return {
        stdout: `NETWORK ID   NAME\n${docker.networks.map((n, i) => `net00${i}       ${n}`).join('\n')}`,
        stderr: '',
        exitCode: 0,
      };
    }
  }

  return {
    stdout: '',
    stderr: `Lệnh "docker ${args.join(' ')}" chưa được hỗ trợ trong terminal mô phỏng. Các lệnh hỗ trợ: pull, build, run, ps, stop, start, rm, logs, inspect, exec, volume, network, compose.`,
    exitCode: 1,
  };
}

function extractNamespace(args: string[]): { ns: string; allNs: boolean; cleaned: string[] } {
  let ns = 'default';
  let allNs = false;
  const cleaned: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if ((a === '-n' || a === '--namespace') && args[i + 1]) {
      ns = args[++i];
    } else if (a.startsWith('--namespace=')) {
      ns = a.slice(12);
    } else if (a === '-A' || a === '--all-namespaces') {
      allNs = true;
    } else {
      cleaned.push(a);
    }
  }
  return { ns, allNs, cleaned };
}

function runKubectlCommand(rawArgs: string[], world: SimWorldState): ExecStepResult {
  const k8s = ensureK8s(world);
  const { ns, allNs, cleaned: args } = extractNamespace(rawArgs);
  const sub = args[0];

  if (!sub) {
    return { stdout: '', stderr: 'Thiếu lệnh con cho kubectl (get, describe, logs, create, expose, scale, set, rollout, label, delete...).', exitCode: 1 };
  }

  if (sub === 'get') {
    const kindRaw = (args[1] ?? '').toLowerCase();
    const targetName = args[2] && !args[2].startsWith('-') ? args[2] : undefined;
    let selectorFilter: Record<string, string> | null = null;
    for (let i = 2; i < args.length; i++) {
      if ((args[i] === '-l' || args[i] === '--selector') && args[i + 1]) {
        selectorFilter = {};
        for (const pair of args[++i].split(',')) {
          const [k, v] = pair.split('=');
          if (k && v !== undefined) selectorFilter[k] = v;
        }
      }
    }

    if (kindRaw === 'pods' || kindRaw === 'pod' || kindRaw === 'po') {
      const list = k8s.pods.filter(
        (p) =>
          (allNs || p.namespace === ns) &&
          (!targetName || p.name === targetName) &&
          (!selectorFilter || labelsMatch(selectorFilter, p.labels))
      );
      if (!list.length) return { stdout: `No resources found in ${ns} namespace.`, stderr: '', exitCode: 0 };
      const showLabels = args.includes('--show-labels');
      const rows = list.map((p) => {
        const lbl = showLabels
          ? `   ${Object.entries(p.labels)
              .map(([k, v]) => `${k}=${v}`)
              .join(',')}`
          : '';
        return `${(allNs ? `${p.namespace}/` : '') + p.name.padEnd(28)} ${p.ready ? '1/1' : '0/1'}     ${p.status.padEnd(26)} ${String(p.restarts).padEnd(8)} ${p.image}${lbl}`;
      });
      return { stdout: `NAME                         READY   STATUS                     RESTARTS   IMAGE\n${rows.join('\n')}`, stderr: '', exitCode: 0 };
    }

    if (kindRaw === 'deployments' || kindRaw === 'deployment' || kindRaw === 'deploy') {
      const list = k8s.deployments.filter((d) => (allNs || d.namespace === ns) && (!targetName || d.name === targetName));
      if (!list.length) return { stdout: `No resources found in ${ns} namespace.`, stderr: '', exitCode: 0 };
      const rows = list.map((d) => {
        const readyCount = k8s.pods.filter((p) => p.namespace === d.namespace && labelsMatch(d.selector, p.labels) && p.ready).length;
        return `${d.name.padEnd(24)} ${`${readyCount}/${d.replicas}`.padEnd(9)} ${String(d.replicas).padEnd(10)} ${d.image}`;
      });
      return { stdout: `NAME                     READY     UP-TO-DATE   IMAGE\n${rows.join('\n')}`, stderr: '', exitCode: 0 };
    }

    if (kindRaw === 'services' || kindRaw === 'service' || kindRaw === 'svc') {
      const list = k8s.services.filter((s) => (allNs || s.namespace === ns) && (!targetName || s.name === targetName));
      if (!list.length) return { stdout: `No resources found in ${ns} namespace.`, stderr: '', exitCode: 0 };
      const rows = list.map(
        (s) =>
          `${s.name.padEnd(20)} ${s.type.padEnd(14)} 10.96.10.20   ${s.port}${s.nodePort ? `:${s.nodePort}` : ''}/TCP -> ${s.targetPort}   selector=${JSON.stringify(s.selector)}`
      );
      return { stdout: `NAME                 TYPE           CLUSTER-IP    PORT(S)\n${rows.join('\n')}`, stderr: '', exitCode: 0 };
    }

    if (kindRaw === 'endpoints' || kindRaw === 'ep') {
      const list = k8s.services.filter((s) => (allNs || s.namespace === ns) && (!targetName || s.name === targetName));
      const rows = list.map((s) => {
        const eps = k8s.pods
          .filter((p) => p.namespace === s.namespace && p.ready && labelsMatch(s.selector, p.labels) && p.ports.includes(s.targetPort))
          .map((_, idx) => `10.244.1.${10 + idx}:${s.targetPort}`);
        return `${s.name.padEnd(22)} ${eps.length ? eps.join(', ') : '<none>'}`;
      });
      return { stdout: `NAME                   ENDPOINTS\n${rows.join('\n')}`, stderr: '', exitCode: 0 };
    }

    if (kindRaw === 'namespaces' || kindRaw === 'namespace' || kindRaw === 'ns') {
      return {
        stdout: `NAME              STATUS\n${k8s.namespaces.map((n) => `${n.padEnd(18)}Active`).join('\n')}`,
        stderr: '',
        exitCode: 0,
      };
    }

    if (kindRaw === 'configmaps' || kindRaw === 'configmap' || kindRaw === 'cm') {
      const list = k8s.configMaps.filter((c) => allNs || c.namespace === ns);
      return {
        stdout: list.length
          ? `NAME                 DATA\n${list.map((c) => `${c.name.padEnd(21)}${Object.keys(c.data).length}`).join('\n')}`
          : `No resources found in ${ns} namespace.`,
        stderr: '',
        exitCode: 0,
      };
    }

    if (kindRaw === 'secrets' || kindRaw === 'secret') {
      const list = k8s.secrets.filter((s) => allNs || s.namespace === ns);
      return {
        stdout: list.length
          ? `NAME                 TYPE                                  DATA\n${list.map((s) => `${s.name.padEnd(21)}${(s.type ?? 'Opaque').padEnd(38)}${Object.keys(s.data).length}`).join('\n')}`
          : `No resources found in ${ns} namespace.`,
        stderr: '',
        exitCode: 0,
      };
    }

    if (kindRaw === 'pvc' || kindRaw === 'persistentvolumeclaims') {
      const list = k8s.pvcs.filter((v) => allNs || v.namespace === ns);
      return {
        stdout: list.length
          ? `NAME                 STATUS    CAPACITY   STORAGECLASS\n${list.map((v) => `${v.name.padEnd(21)}${(v.bound ? 'Bound' : 'Pending').padEnd(10)}${v.storage.padEnd(11)}${v.storageClass ?? 'standard'}`).join('\n')}`
          : `No resources found in ${ns} namespace.`,
        stderr: '',
        exitCode: 0,
      };
    }

    if (kindRaw === 'events' || kindRaw === 'ev') {
      const evs = k8s.pods.filter((p) => allNs || p.namespace === ns).flatMap((p) => p.events.map((e) => `[Pod/${p.name}] ${e}`));
      return { stdout: evs.length ? evs.join('\n') : 'No events found.', stderr: '', exitCode: 0 };
    }
  }

  if (sub === 'describe') {
    const kindRaw = (args[1] ?? '').toLowerCase();
    const targetName = args[2];
    if (kindRaw.startsWith('pod') || kindRaw === 'po') {
      const p = k8s.pods.find((x) => x.namespace === ns && (!targetName || x.name === targetName || x.name.startsWith(targetName)));
      if (!p) return { stdout: '', stderr: `Error from server (NotFound): pods "${targetName ?? ''}" not found`, exitCode: 1 };
      const lines = [
        `Name:             ${p.name}`,
        `Namespace:        ${p.namespace}`,
        `Node:             ${p.node ?? '<none>'}`,
        `Labels:           ${Object.entries(p.labels).map(([k, v]) => `${k}=${v}`).join(', ') || '<none>'}`,
        `Status:           ${p.status}`,
        `Container Image:  ${p.image}`,
        `Ports:            ${p.ports.join(', ') || '<none>'}`,
        ...(p.memoryLimitMi ? [`Limits:           memory=${p.memoryLimitMi}Mi`] : []),
        ...(p.status === 'OOMKilled' ? ['Last State:       Terminated (Reason: OOMKilled, Exit Code: 137)'] : []),
        'Events:',
        ...(p.events.length ? p.events.map((e) => `  ${e}`) : ['  <none>']),
      ];
      return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
    }
    if (kindRaw.startsWith('svc') || kindRaw.startsWith('service')) {
      const s = k8s.services.find((x) => x.namespace === ns && (!targetName || x.name === targetName));
      if (!s) return { stdout: '', stderr: `Error from server (NotFound): services "${targetName ?? ''}" not found`, exitCode: 1 };
      const eps = k8s.pods
        .filter((p) => p.namespace === s.namespace && p.ready && labelsMatch(s.selector, p.labels) && p.ports.includes(s.targetPort))
        .map((_, idx) => `10.244.1.${10 + idx}:${s.targetPort}`);
      return {
        stdout: [
          `Name:              ${s.name}`,
          `Namespace:         ${s.namespace}`,
          `Selector:          ${Object.entries(s.selector).map(([k, v]) => `${k}=${v}`).join(',')}`,
          `Type:              ${s.type}`,
          `Port:              ${s.port}/TCP`,
          `TargetPort:        ${s.targetPort}/TCP`,
          `Endpoints:         ${eps.length ? eps.join(', ') : '<none>'}`,
        ].join('\n'),
        stderr: '',
        exitCode: 0,
      };
    }
    if (kindRaw.startsWith('deploy')) {
      const d = k8s.deployments.find((x) => x.namespace === ns && (!targetName || x.name === targetName));
      if (!d) return { stdout: '', stderr: `Error from server (NotFound): deployments "${targetName ?? ''}" not found`, exitCode: 1 };
      return {
        stdout: [
          `Name:                   ${d.name}`,
          `Namespace:              ${d.namespace}`,
          `Replicas:               ${d.replicas} desired`,
          `Selector:               ${Object.entries(d.selector).map(([k, v]) => `${k}=${v}`).join(',')}`,
          `Pod Template Image:     ${d.image}`,
        ].join('\n'),
        stderr: '',
        exitCode: 0,
      };
    }
  }

  if (sub === 'logs') {
    const prev = args.includes('-p') || args.includes('--previous');
    const targetName = args.slice(1).find((a) => !a.startsWith('-'));
    const p = k8s.pods.find((x) => x.namespace === ns && (x.name === targetName || (targetName && x.name.startsWith(targetName))));
    if (!p) return { stdout: '', stderr: `Error from server (NotFound): pods "${targetName ?? ''}" not found`, exitCode: 1 };
    const logLines = prev ? p.previousLogs ?? p.logs : p.logs;
    return { stdout: logLines.join('\n'), stderr: '', exitCode: 0 };
  }

  if (sub === 'create') {
    const kind = (args[1] ?? '').toLowerCase();
    if ((kind === 'namespace' || kind === 'ns') && args[2]) {
      if (!k8s.namespaces.includes(args[2])) k8s.namespaces.push(args[2]);
      return { stdout: `namespace/${args[2]} created`, stderr: '', exitCode: 0 };
    }
    if ((kind === 'configmap' || kind === 'cm') && args[2]) {
      const name = args[2];
      const data: Record<string, string> = {};
      for (const a of args.slice(3)) {
        if (a.startsWith('--from-literal=')) {
          const kv = a.slice(15);
          const eq = kv.indexOf('=');
          if (eq > 0) data[kv.slice(0, eq)] = kv.slice(eq + 1);
        }
      }
      const existing = k8s.configMaps.find((c) => c.namespace === ns && c.name === name);
      if (existing) Object.assign(existing.data, data);
      else k8s.configMaps.push({ name, namespace: ns, data });
      reconcileK8sCluster(world);
      return { stdout: `configmap/${name} created`, stderr: '', exitCode: 0 };
    }
    if (kind === 'secret') {
      const secType = args[2]; // generic | docker-registry
      const name = args[3];
      if (!name) return { stdout: '', stderr: 'kubectl create secret <generic|docker-registry> <name> --from-literal=...', exitCode: 1 };
      const data: Record<string, string> = {};
      for (const a of args.slice(4)) {
        if (a.startsWith('--from-literal=')) {
          const kv = a.slice(15);
          const eq = kv.indexOf('=');
          if (eq > 0) data[kv.slice(0, eq)] = kv.slice(eq + 1);
        } else if (a.startsWith('--docker-server=')) {
          data['.dockerconfigjson'] = a.slice(16);
        }
      }
      k8s.secrets.push({
        name,
        namespace: ns,
        type: secType === 'docker-registry' ? 'kubernetes.io/dockerconfigjson' : 'Opaque',
        data,
      });
      reconcileK8sCluster(world);
      return { stdout: `secret/${name} created`, stderr: '', exitCode: 0 };
    }
    if ((kind === 'deployment' || kind === 'deploy') && args[2]) {
      const name = args[2];
      let image = 'nginx:1.27-alpine';
      let replicas = 1;
      let port = 80;
      for (let i = 3; i < args.length; i++) {
        if (args[i].startsWith('--image=')) image = args[i].slice(8);
        else if (args[i] === '--image' && args[i + 1]) image = args[++i];
        else if (args[i].startsWith('--replicas=')) replicas = Number(args[i].slice(11));
        else if (args[i].startsWith('--port=')) port = Number(args[i].slice(7));
      }
      const dep: SimK8sDeployment = {
        name,
        namespace: ns,
        replicas,
        selector: { app: name },
        podLabels: { app: name },
        image,
        revision: 1,
        history: [{ revision: 1, image }],
        containerPort: port,
      };
      k8s.deployments.push(dep);
      reconcileK8sCluster(world);
      return { stdout: `deployment.apps/${name} created`, stderr: '', exitCode: 0 };
    }
  }

  if (sub === 'run' && args[1]) {
    const name = args[1];
    let image = 'nginx:1.27-alpine';
    let port = 80;
    const labels: Record<string, string> = { run: name };
    for (let i = 2; i < args.length; i++) {
      if (args[i].startsWith('--image=')) image = args[i].slice(8);
      else if (args[i] === '--image' && args[i + 1]) image = args[++i];
      else if (args[i].startsWith('--port=')) port = Number(args[i].slice(7));
      else if ((args[i] === '-l' || args[i] === '--labels') && args[i + 1]) {
        for (const pair of args[++i].split(',')) {
          const [k, v] = pair.split('=');
          if (k && v) labels[k] = v;
        }
      } else if (args[i].startsWith('--labels=')) {
        for (const pair of args[i].slice(9).split(',')) {
          const [k, v] = pair.split('=');
          if (k && v) labels[k] = v;
        }
      }
    }
    k8s.pods.push({
      name,
      namespace: ns,
      labels,
      image,
      status: 'Running',
      ready: true,
      restarts: 0,
      node: 'worker-node-1',
      ports: [port],
      logs: [`Pod ${name} started`],
      events: [`Normal Scheduled Assigned ${name} to worker-node-1`],
    });
    reconcileK8sCluster(world);
    return { stdout: `pod/${name} created`, stderr: '', exitCode: 0 };
  }

  if (sub === 'expose') {
    const kind = (args[1] ?? '').toLowerCase();
    const targetName = args[2];
    let svcName = targetName;
    let port = 80;
    let targetPort: number | undefined;
    let svcType: 'ClusterIP' | 'NodePort' | 'LoadBalancer' = 'ClusterIP';
    for (let i = 3; i < args.length; i++) {
      if (args[i].startsWith('--name=')) svcName = args[i].slice(7);
      else if (args[i] === '--name' && args[i + 1]) svcName = args[++i];
      else if (args[i].startsWith('--port=')) port = Number(args[i].slice(7));
      else if (args[i] === '--port' && args[i + 1]) port = Number(args[++i]);
      else if (args[i].startsWith('--target-port=')) targetPort = Number(args[i].slice(14));
      else if (args[i] === '--target-port' && args[i + 1]) targetPort = Number(args[++i]);
      else if (args[i].startsWith('--type=')) svcType = args[i].slice(7) as typeof svcType;
      else if (args[i] === '--type' && args[i + 1]) svcType = args[++i] as typeof svcType;
    }
    let selector: Record<string, string> = { app: targetName };
    if (kind.startsWith('deploy')) {
      const d = k8s.deployments.find((x) => x.namespace === ns && x.name === targetName);
      if (!d) return { stdout: '', stderr: `Error: deployment "${targetName}" not found`, exitCode: 1 };
      selector = { ...d.selector };
      targetPort ??= d.containerPort ?? port;
    } else if (kind.startsWith('pod')) {
      const p = k8s.pods.find((x) => x.namespace === ns && x.name === targetName);
      if (!p) return { stdout: '', stderr: `Error: pod "${targetName}" not found`, exitCode: 1 };
      selector = { ...p.labels };
      targetPort ??= p.ports[0] ?? port;
    }
    k8s.services.push({
      name: svcName,
      namespace: ns,
      type: svcType,
      selector,
      port,
      targetPort: targetPort ?? port,
      nodePort: svcType !== 'ClusterIP' ? 30080 : undefined,
    });
    return { stdout: `service/${svcName} exposed`, stderr: '', exitCode: 0 };
  }

  if (sub === 'scale') {
    let target = args[1] ?? '';
    if (!target.includes('/') && args[2] && !args[2].startsWith('-')) {
      target = `${target}/${args[2]}`;
    }
    const depName = target.split('/')[1] ?? target;
    let replicas: number | null = null;
    for (const a of args) {
      if (a.startsWith('--replicas=')) replicas = Number(a.slice(11));
    }
    const dep = k8s.deployments.find((d) => d.namespace === ns && d.name === depName);
    if (!dep || replicas === null || Number.isNaN(replicas)) {
      return { stdout: '', stderr: `Không tìm thấy deployment "${depName}" hoặc thiếu --replicas=N.`, exitCode: 1 };
    }
    dep.replicas = replicas;
    reconcileK8sCluster(world);
    return { stdout: `deployment.apps/${dep.name} scaled`, stderr: '', exitCode: 0 };
  }

  if (sub === 'set' && args[1] === 'image') {
    let target = args[2] ?? '';
    let assignIdx = 3;
    if (!target.includes('/') && args[3] && !args[3].includes('=')) {
      target = `${target}/${args[3]}`;
      assignIdx = 4;
    }
    const depName = target.split('/')[1] ?? target;
    const assign = args[assignIdx] ?? '';
    const eq = assign.indexOf('=');
    const newImg = eq > 0 ? assign.slice(eq + 1) : '';
    const dep = k8s.deployments.find((d) => d.namespace === ns && d.name === depName);
    if (!dep || !newImg) {
      return { stdout: '', stderr: 'Cú pháp chuẩn: kubectl set image deployment/<name> <container>=<image:tag>', exitCode: 1 };
    }
    dep.image = newImg;
    dep.revision += 1;
    dep.history.push({ revision: dep.revision, image: newImg });
    reconcileK8sCluster(world);
    return { stdout: `deployment.apps/${dep.name} image updated`, stderr: '', exitCode: 0 };
  }

  if (sub === 'rollout') {
    const rsub = args[1];
    let target = args[2] ?? '';
    if (!target.includes('/') && args[3] && !args[3].startsWith('-')) target = `${target}/${args[3]}`;
    const depName = target.split('/')[1] ?? target;
    const dep = k8s.deployments.find((d) => d.namespace === ns && d.name === depName);
    if (!dep) return { stdout: '', stderr: `Error: deployment "${depName}" not found`, exitCode: 1 };

    if (rsub === 'status') {
      return { stdout: `deployment "${dep.name}" successfully rolled out`, stderr: '', exitCode: 0 };
    }
    if (rsub === 'history') {
      const lines = dep.history.map((h) => `${h.revision}\t\t${h.image}`);
      return { stdout: `REVISION\tIMAGE\n${lines.join('\n')}`, stderr: '', exitCode: 0 };
    }
    if (rsub === 'undo') {
      if (dep.history.length < 2) {
        return { stdout: '', stderr: 'Không có revision trước đó để rollback.', exitCode: 1 };
      }
      const prev = dep.history[dep.history.length - 2];
      dep.image = prev.image;
      dep.revision += 1;
      dep.history.push({ revision: dep.revision, image: prev.image });
      reconcileK8sCluster(world);
      return { stdout: `deployment.apps/${dep.name} rolled back`, stderr: '', exitCode: 0 };
    }
  }

  if (sub === 'label') {
    const overwrite = args.includes('--overwrite');
    const nonFlags = args.slice(1).filter((a) => !a.startsWith('-'));
    const kind = nonFlags[0] ?? '';
    const name = nonFlags[1] ?? '';
    const kvs = nonFlags.slice(2);
    if (kind.startsWith('pod')) {
      const p = k8s.pods.find((x) => x.namespace === ns && x.name === name);
      if (!p) return { stdout: '', stderr: `Error: pod "${name}" not found`, exitCode: 1 };
      for (const kv of kvs) {
        if (kv.endsWith('-')) {
          delete p.labels[kv.slice(0, -1)];
        } else {
          const [k, v] = kv.split('=');
          if (k && v !== undefined) {
            if (p.labels[k] && p.labels[k] !== v && !overwrite) {
              return { stdout: '', stderr: `error: '${k}' already has a value (${p.labels[k]}), and --overwrite is false`, exitCode: 1 };
            }
            p.labels[k] = v;
          }
        }
      }
      reconcileK8sCluster(world);
      return { stdout: `pod/${p.name} labeled`, stderr: '', exitCode: 0 };
    }
  }

  if (sub === 'delete') {
    const kind = (args[1] ?? '').toLowerCase();
    const name = args[2];
    if (kind.startsWith('pod') && name) {
      const idx = k8s.pods.findIndex((p) => p.namespace === ns && p.name === name);
      if (idx < 0) return { stdout: '', stderr: `Error from server (NotFound): pods "${name}" not found`, exitCode: 1 };
      k8s.pods.splice(idx, 1);
      reconcileK8sCluster(world);
      return { stdout: `pod "${name}" deleted`, stderr: '', exitCode: 0 };
    }
    if (kind.startsWith('deploy') && name) {
      const dep = k8s.deployments.find((d) => d.namespace === ns && d.name === name);
      if (!dep) return { stdout: '', stderr: `Error from server (NotFound): deployments "${name}" not found`, exitCode: 1 };
      k8s.deployments = k8s.deployments.filter((d) => !(d.namespace === ns && d.name === name));
      k8s.pods = k8s.pods.filter((p) => !(p.namespace === ns && labelsMatch(dep.selector, p.labels)));
      return { stdout: `deployment.apps "${name}" deleted`, stderr: '', exitCode: 0 };
    }
  }

  return {
    stdout: '',
    stderr: `Lệnh "kubectl ${rawArgs.join(' ')}" chưa được hỗ trợ trong mô phỏng. Các lệnh hỗ trợ: get, describe, logs, create, run, expose, scale, set image, rollout, label, delete.`,
    exitCode: 1,
  };
}

function applyYamlManifestsToWorld(yamlText: string, world: SimWorldState): { ok: boolean; err?: string } {
  const k8s = ensureK8s(world);
  const docs = YAML.parseAllDocuments(yamlText);
  for (const d of docs) {
    if (d.errors.length > 0) return { ok: false, err: d.errors[0].message };
    const obj = d.toJS() as Record<string, unknown> | null;
    if (!obj || typeof obj !== 'object') continue;
    const kind = String(obj.kind ?? '');
    const meta = (obj.metadata as Record<string, unknown> | undefined) ?? {};
    const name = String(meta.name ?? 'unnamed');
    const ns = String(meta.namespace ?? 'default');
    const spec = (obj.spec as Record<string, unknown> | undefined) ?? {};

    if (kind === 'Namespace') {
      if (!k8s.namespaces.includes(name)) k8s.namespaces.push(name);
    } else if (kind === 'ConfigMap') {
      const data = ((obj.data as Record<string, string> | undefined) ?? {});
      const ex = k8s.configMaps.find((c) => c.namespace === ns && c.name === name);
      if (ex) ex.data = { ...ex.data, ...data };
      else k8s.configMaps.push({ name, namespace: ns, data });
    } else if (kind === 'Secret') {
      const data = ((obj.data ?? obj.stringData) as Record<string, string> | undefined) ?? {};
      const ex = k8s.secrets.find((s) => s.namespace === ns && s.name === name);
      if (ex) ex.data = { ...ex.data, ...data };
      else k8s.secrets.push({ name, namespace: ns, type: String(obj.type ?? 'Opaque'), data });
    } else if (kind === 'PersistentVolumeClaim') {
      const storageClass = spec.storageClassName ? String(spec.storageClassName) : undefined;
      const resReq = ((spec.resources as Record<string, Record<string, string>> | undefined)?.requests?.storage) ?? '1Gi';
      const ex = k8s.pvcs.find((v) => v.namespace === ns && v.name === name);
      if (ex) {
        ex.storageClass = storageClass;
        ex.storage = resReq;
      } else {
        k8s.pvcs.push({ name, namespace: ns, storage: resReq, storageClass, bound: true });
      }
    } else if (kind === 'Service') {
      const selector = (spec.selector as Record<string, string> | undefined) ?? {};
      const ports = (spec.ports as Record<string, unknown>[] | undefined) ?? [];
      const firstPort = ports[0] ?? {};
      const port = Number(firstPort.port ?? 80);
      const targetPort = Number(firstPort.targetPort ?? port);
      const type = (spec.type as 'ClusterIP' | 'NodePort' | 'LoadBalancer' | undefined) ?? 'ClusterIP';
      const ex = k8s.services.find((s) => s.namespace === ns && s.name === name);
      if (ex) {
        ex.selector = selector;
        ex.port = port;
        ex.targetPort = targetPort;
        ex.type = type;
      } else {
        k8s.services.push({ name, namespace: ns, type, selector, port, targetPort });
      }
    } else if (kind === 'Deployment') {
      const replicas = Number(spec.replicas ?? 1);
      const selector = ((spec.selector as Record<string, unknown> | undefined)?.matchLabels as Record<string, string> | undefined) ?? {};
      const tmpl = (spec.template as Record<string, unknown> | undefined) ?? {};
      const podLabels = ((tmpl.metadata as Record<string, unknown> | undefined)?.labels as Record<string, string> | undefined) ?? {};
      const tSpec = (tmpl.spec as Record<string, unknown> | undefined) ?? {};
      const containers = (tSpec.containers as Record<string, unknown>[] | undefined) ?? [];
      const c0 = containers[0] ?? {};
      const image = String(c0.image ?? 'nginx:1.27-alpine');
      const cPorts = (c0.ports as Record<string, unknown>[] | undefined) ?? [];
      const containerPort = cPorts[0]?.containerPort ? Number(cPorts[0].containerPort) : undefined;
      const memLim = (c0.resources as Record<string, Record<string, unknown>> | undefined)?.limits?.memory;
      const memoryLimitMi = memLim ? parseK8sMemoryMi(memLim) ?? undefined : undefined;
      const pullSecs = ((tSpec.imagePullSecrets as Record<string, string>[] | undefined) ?? []).map((x) => x.name);

      const ex = k8s.deployments.find((dep) => dep.namespace === ns && dep.name === name);
      if (ex) {
        ex.replicas = replicas;
        ex.selector = selector;
        ex.podLabels = podLabels;
        ex.image = image;
        if (containerPort) ex.containerPort = containerPort;
        if (memoryLimitMi !== undefined) ex.memoryLimitMi = memoryLimitMi;
        if (pullSecs.length) ex.imagePullSecrets = pullSecs;
      } else {
        k8s.deployments.push({
          name,
          namespace: ns,
          replicas,
          selector,
          podLabels,
          image,
          revision: 1,
          history: [{ revision: 1, image }],
          containerPort,
          memoryLimitMi,
          imagePullSecrets: pullSecs.length ? pullSecs : undefined,
        });
      }
    } else if (kind === 'Pod') {
      const labels = (meta.labels as Record<string, string> | undefined) ?? {};
      const containers = (spec.containers as Record<string, unknown>[] | undefined) ?? [];
      const c0 = containers[0] ?? {};
      const image = String(c0.image ?? 'nginx:1.27-alpine');
      const cPorts = (c0.ports as Record<string, unknown>[] | undefined) ?? [];
      const ports = cPorts.map((cp) => Number(cp.containerPort ?? 80));
      const memLim = (c0.resources as Record<string, Record<string, unknown>> | undefined)?.limits?.memory;
      const memoryLimitMi = memLim ? parseK8sMemoryMi(memLim) ?? undefined : undefined;
      const pullSecs = ((spec.imagePullSecrets as Record<string, string>[] | undefined) ?? []).map((x) => x.name);

      const ex = k8s.pods.find((p) => p.namespace === ns && p.name === name);
      if (ex) {
        ex.labels = labels;
        ex.image = image;
        if (ports.length) ex.ports = ports;
        if (memoryLimitMi !== undefined) ex.memoryLimitMi = memoryLimitMi;
        if (pullSecs.length) ex.imagePullSecrets = pullSecs;
      } else {
        k8s.pods.push({
          name,
          namespace: ns,
          labels,
          image,
          status: 'Running',
          ready: true,
          restarts: 0,
          node: 'worker-node-1',
          ports: ports.length ? ports : [80],
          memoryLimitMi,
          imagePullSecrets: pullSecs.length ? pullSecs : undefined,
          logs: [`Pod ${name} running`],
          events: [],
        });
      }
    }
  }
  reconcileK8sCluster(world);
  return { ok: true };
}

function runGitCommand(args: string[], world: SimWorldState): ExecStepResult {
  const git = ensureGit(world);
  const sub = args[0];

  if (sub === 'init') {
    return { stdout: 'Initialized empty Git repository in /workspace/.git/', stderr: '', exitCode: 0 };
  }
  if (sub === 'status') {
    return {
      stdout: `On branch ${git.currentBranch}\nStaged files: ${git.staged.length ? git.staged.join(', ') : '(none)'}`,
      stderr: '',
      exitCode: 0,
    };
  }
  if (sub === 'branch') {
    if (!args[1] || args[1] === '-a' || args[1] === '--list') {
      return {
        stdout: git.branches.map((b) => (b === git.currentBranch ? `* ${b}` : `  ${b}`)).join('\n'),
        stderr: '',
        exitCode: 0,
      };
    }
    const newBranch = args[args.length - 1];
    if (!git.branches.includes(newBranch)) git.branches.push(newBranch);
    return { stdout: '', stderr: '', exitCode: 0 };
  }
  if (sub === 'checkout' || sub === 'switch') {
    const createNew = args.includes('-b') || args.includes('-c');
    const target = args[args.length - 1];
    if (!target || target.startsWith('-')) return { stdout: '', stderr: `git ${sub} thiếu tên nhánh.`, exitCode: 1 };
    if (createNew) {
      if (!git.branches.includes(target)) git.branches.push(target);
      git.currentBranch = target;
      return { stdout: `Switched to a new branch '${target}'`, stderr: '', exitCode: 0 };
    }
    if (!git.branches.includes(target)) {
      return { stdout: '', stderr: `error: pathspec '${target}' did not match any branch known to git`, exitCode: 1 };
    }
    git.currentBranch = target;
    return { stdout: `Switched to branch '${target}'`, stderr: '', exitCode: 0 };
  }
  if (sub === 'add') {
    const targets = args.slice(1);
    if (!targets.length) return { stdout: '', stderr: 'Nothing specified, nothing added.', exitCode: 1 };
    if (targets.includes('.') || targets.includes('-A') || targets.includes('--all')) {
      git.staged = Object.keys(git.files);
      if (!git.staged.length) git.staged = ['README.md'];
    } else {
      for (const t of targets) if (!git.staged.includes(t)) git.staged.push(t);
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  }
  if (sub === 'commit') {
    let msg = '';
    for (let i = 1; i < args.length; i++) {
      if ((args[i] === '-m' || args[i] === '--message') && args[i + 1]) msg = args[++i];
      else if (args[i].startsWith('-m=')) msg = args[i].slice(3);
    }
    if (!msg) return { stdout: '', stderr: 'Aborting commit due to empty commit message (hãy dùng git commit -m "message").', exitCode: 1 };
    const sha = `f${Math.abs((msg.length * 41 + git.commits.length * 19) % 899999 + 100000).toString(16)}`;
    git.commits.push({ sha, branch: git.currentBranch, message: msg });
    git.staged = [];
    return { stdout: `[${git.currentBranch} ${sha}] ${msg}`, stderr: '', exitCode: 0 };
  }
  if (sub === 'merge') {
    const srcBranch = args.slice(1).find((a) => !a.startsWith('-'));
    if (!srcBranch || !git.branches.includes(srcBranch)) {
      return { stdout: '', stderr: `merge: ${srcBranch ?? ''} - not something we can merge`, exitCode: 1 };
    }
    const srcCommits = git.commits.filter((c) => c.branch === srcBranch);
    for (const sc of srcCommits) {
      git.commits.push({ sha: sc.sha, branch: git.currentBranch, message: sc.message });
    }
    return { stdout: `Merge made by the 'ort' strategy from ${srcBranch} into ${git.currentBranch}.`, stderr: '', exitCode: 0 };
  }
  if (sub === 'tag') {
    const tagName = args.slice(1).filter((a) => !a.startsWith('-') && args[args.indexOf(a) - 1] !== '-m')[0];
    if (!tagName) return { stdout: Object.keys(git.tags).join('\n'), stderr: '', exitCode: 0 };
    const head = git.commits[git.commits.length - 1]?.sha ?? 'HEAD';
    git.tags[tagName] = head;
    return { stdout: '', stderr: '', exitCode: 0 };
  }
  if (sub === 'log') {
    const list = git.commits
      .filter((c) => c.branch === git.currentBranch)
      .reverse()
      .map((c) => `${c.sha} (${c.branch}) ${c.message}`);
    return { stdout: list.join('\n'), stderr: '', exitCode: 0 };
  }

  return { stdout: '', stderr: `Lệnh "git ${args.join(' ')}" chưa được hỗ trợ trong mô phỏng (dùng: init, status, branch, switch/checkout, add, commit, merge, tag, log).`, exitCode: 1 };
}

function executeSingleCommand(cmd: string, world: SimWorldState): ExecStepResult {
  const tokens = tokenizeCommand(cmd);
  if (!tokens.length) return { stdout: '', stderr: '', exitCode: 0 };
  const bin = tokens[0];
  const args = tokens.slice(1);

  if (bin === 'docker') return runDockerCommand(args, world);
  if (bin === 'kubectl' || bin === 'k') return runKubectlCommand(args, world);
  if (bin === 'git') return runGitCommand(args, world);
  if (bin === 'redis-cli' || (world.redis !== undefined && !['echo', 'true', 'false', 'help', 'docker-compose'].includes(bin))) {
    const redisArgs = bin === 'redis-cli' ? stripRedisCliWrapper(tokens) : tokens;
    if (!redisArgs.length) return { stdout: '127.0.0.1:6379> (gõ lệnh Redis kèm theo, vd: INFO memory, SLOWLOG GET 5)', stderr: '', exitCode: 0 };
    const rt = createRedisRuntime(world.redis);
    const out = executeRedisCommand(rt, redisArgs);
    world.redis = {
      ...(world.redis ?? {}),
      config: { ...rt.config },
      slowlog: rt.slowlog.map((s) => ({ ...s })),
      clusterRole: rt.clusterRole,
      clusterSlotsAssigned: rt.clusterSlotsAssigned,
      replicationOffset: rt.replicationOffset,
    };
    return out;
  }
  if (bin === 'docker-compose') {
    return {
      stdout: '',
      stderr: 'Cảnh báo 2026: "docker-compose" (v1 có dấu gạch ngang) đã ngừng hỗ trợ. Hãy dùng Docker Compose v2: "docker compose ..." (cách khoảng trắng).',
      exitCode: 127,
    };
  }
  if (bin === 'echo') return { stdout: args.join(' '), stderr: '', exitCode: 0 };
  if (bin === 'true') return { stdout: '', stderr: '', exitCode: 0 };
  if (bin === 'false') return { stdout: '', stderr: 'Command exited with code 1', exitCode: 1 };
  if (bin === 'help') {
    return {
      stdout: 'Các công cụ có sẵn trong terminal mô phỏng:\n  • docker (pull, build, run, ps, stop, start, rm, logs, inspect, exec, volume, network, compose)\n  • kubectl (get, describe, logs, create, run, expose, scale, set image, rollout, label, delete)\n  • git (init, status, branch, switch/checkout, add, commit, merge, tag, log)\n  • redis-cli (INFO, CONFIG GET/SET, SLOWLOG GET, ACL LIST/SETUSER, SCAN, UNLINK, XPENDING, CLUSTER INFO...)',
      stderr: '',
      exitCode: 0,
    };
  }

  return {
    stdout: '',
    stderr: `Không tìm thấy lệnh "${bin}". Nhập "help" để xem danh sách lệnh hỗ trợ (docker, kubectl, git, redis-cli).`,
    exitCode: 127,
  };
}

/** Chạy 1 lệnh chẩn đoán trên bản sao trạng thái để hiển thị trong khung Terminal khám bệnh */
export function executeDiagnosticCommand(
  cmd: string,
  state: SimWorldState
): { stdout: string; stderr: string; exitCode: number; nextState: SimWorldState } {
  const world = cloneWorld(state);
  const steps = splitShellCommands(cmd);
  const outBuf: string[] = [];
  const errBuf: string[] = [];
  let code = 0;
  for (const s of steps) {
    const r = executeSingleCommand(s.cmd, world);
    if (r.stdout) outBuf.push(r.stdout);
    if (r.stderr) errBuf.push(r.stderr);
    code = r.exitCode;
    if (code !== 0) break;
  }
  return {
    stdout: outBuf.join('\n'),
    stderr: errBuf.join('\n'),
    exitCode: code,
    nextState: world,
  };
}

function runScript(script: string, initialState: SimWorldState): {
  stdout: string;
  stderr: string;
  exitCode: number;
  errorLine: number | null;
  world: SimWorldState;
} {
  const world = cloneWorld(initialState);
  const steps = splitShellCommands(script);
  if (!steps.length) {
    return {
      stdout: '',
      stderr: 'Chưa có câu lệnh nào để thực thi (bỏ dấu # ở đầu dòng hoặc gõ lệnh mới).',
      exitCode: 1,
      errorLine: 1,
      world,
    };
  }
  const stdoutLog: string[] = [];
  const stderrLog: string[] = [];
  for (const step of steps) {
    stdoutLog.push(`$ ${step.cmd}`);
    const res = executeSingleCommand(step.cmd, world);
    if (res.stdout) stdoutLog.push(res.stdout);
    if (res.stderr) stderrLog.push(res.stderr);
    if (res.exitCode !== 0) {
      return {
        stdout: stdoutLog.join('\n'),
        stderr: stderrLog.join('\n'),
        exitCode: res.exitCode,
        errorLine: step.line,
        world,
      };
    }
  }
  return {
    stdout: stdoutLog.join('\n'),
    stderr: stderrLog.join('\n'),
    exitCode: 0,
    errorLine: null,
    world,
  };
}

export function dryRunCli(script: string, initialState: SimWorldState): Omit<RunResult, 'ms'> {
  const res = runScript(script, initialState);
  return { stdout: res.stdout, stderr: res.stderr, exitCode: res.exitCode };
}

function evaluateCliStateRules(world: SimWorldState, rules: CliStateCheckRule[], stdoutHistory: string): GradeTest[] {
  const docker = ensureDocker(world);
  const k8s = ensureK8s(world);
  const git = ensureGit(world);

  return rules.map((r): GradeTest => {
    if (r.target === 'docker-container') {
      const matches = docker.containers.filter((c) => {
        if (r.name && c.name !== r.name) return false;
        if (r.image && !c.image.startsWith(r.image)) return false;
        return true;
      });
      if (r.status === 'absent') {
        const ok = matches.length === 0;
        return {
          name: r.id,
          doc: r.doc,
          status: ok ? 'pass' : 'fail',
          got: ok ? 'đã được xoá sạch' : `vẫn còn container "${matches[0].name}" (${matches[0].status})`,
          expected: 'container không còn tồn tại',
        };
      }
      const c: SimContainer | undefined = matches[0];
      if (!c) {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: '(không tìm thấy container)',
          expected: `container${r.name ? ` "${r.name}"` : ''}${r.image ? ` từ image ${r.image}` : ''}`,
        };
      }
      const statusOk = !r.status || c.status === r.status;
      const portOk =
        (r.hostPort === undefined && r.containerPort === undefined) ||
        c.ports.some(
          (p) =>
            (r.hostPort === undefined || p.host === r.hostPort) &&
            (r.containerPort === undefined || p.container === r.containerPort)
        );
      const envOk =
        !r.envEquals || Object.entries(r.envEquals).every(([k, v]) => c.env[k] === v);
      const volOk =
        !r.volumeTarget ||
        c.volumes.some(
          (v) =>
            v.target === r.volumeTarget &&
            (!r.volumeSource || v.source === r.volumeSource) &&
            (!r.volumeType || v.type === r.volumeType)
        );
      const netOk = !r.network || c.network === r.network;
      const memOk = !r.memoryLimit || c.memoryLimit === r.memoryLimit;
      const ok = statusOk && portOk && envOk && volOk && netOk && memOk;

      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: `${c.name} (${c.image}, status=${c.status}, ports=${JSON.stringify(c.ports)}, env=${JSON.stringify(c.env)}, network=${c.network})`,
        expected: [
          r.status ? `status=${r.status}` : '',
          r.hostPort || r.containerPort ? `port ${r.hostPort ?? '*'}->${r.containerPort ?? '*'}` : '',
          r.envEquals ? `env=${JSON.stringify(r.envEquals)}` : '',
          r.volumeTarget ? `volume -> ${r.volumeTarget}` : '',
          r.network ? `network=${r.network}` : '',
          r.memoryLimit ? `memory=${r.memoryLimit}` : '',
        ]
          .filter(Boolean)
          .join(', '),
      };
    }

    if (r.target === 'docker-image') {
      const ok = docker.images.some((i) => i.repo === r.repo && i.tag === r.tag);
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: docker.images.map((i) => `${i.repo}:${i.tag}`).join(', '),
        expected: `có image ${r.repo}:${r.tag}`,
      };
    }

    if (r.target === 'docker-volume') {
      const ok = docker.volumes.includes(r.name);
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: docker.volumes.join(', ') || '(chưa có volume)',
        expected: `volume "${r.name}"`,
      };
    }

    if (r.target === 'docker-network') {
      const ok = docker.networks.includes(r.name);
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: docker.networks.join(', '),
        expected: `network "${r.name}"`,
      };
    }

    if (r.target === 'k8s-namespace') {
      const ok = k8s.namespaces.includes(r.name);
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: k8s.namespaces.join(', '),
        expected: `namespace "${r.name}"`,
      };
    }

    if (r.target === 'k8s-pod') {
      const ns = r.namespace ?? 'default';
      const pods = k8s.pods.filter((p) => {
        if (p.namespace !== ns) return false;
        if (r.name && p.name !== r.name && !p.name.startsWith(r.name)) return false;
        if (r.labelMatch && !labelsMatch(r.labelMatch, p.labels)) return false;
        return true;
      });
      if (r.status === 'absent') {
        const ok = pods.length === 0;
        return {
          name: r.id,
          doc: r.doc,
          status: ok ? 'pass' : 'fail',
          got: ok ? 'đã xoá' : `còn ${pods.length} Pod`,
          expected: 'Pod không còn tồn tại',
        };
      }
      const qualified = pods.filter((p) => {
        if (r.status && p.status !== r.status) return false;
        if (r.ready !== undefined && p.ready !== r.ready) return false;
        if (r.image && p.image !== r.image) return false;
        return true;
      });
      const minCount = r.minCount ?? 1;
      const ok = qualified.length >= minCount;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: pods.length
          ? pods.map((p) => `${p.name}(status=${p.status}, ready=${p.ready}, image=${p.image})`).join('; ')
          : `(không có Pod khớp trong namespace "${ns}")`,
        expected: `>= ${minCount} Pod ở trạng thái ${r.status ?? 'Running'}${r.image ? `, image=${r.image}` : ''}`,
      };
    }

    if (r.target === 'k8s-deployment') {
      const ns = r.namespace ?? 'default';
      const dep = k8s.deployments.find((d) => d.namespace === ns && d.name === r.name);
      if (!dep) {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: `(chưa có Deployment "${r.name}" ở namespace "${ns}")`,
          expected: `Deployment/${r.name}`,
        };
      }
      const repOk = r.replicas === undefined || dep.replicas === r.replicas;
      const imgOk = !r.image || dep.image === r.image;
      const ok = repOk && imgOk;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: `replicas=${dep.replicas}, image=${dep.image}`,
        expected: `${r.replicas !== undefined ? `replicas=${r.replicas} ` : ''}${r.image ? `image=${r.image}` : ''}`.trim(),
      };
    }

    if (r.target === 'k8s-service-endpoints') {
      const ns = r.namespace ?? 'default';
      const svc = k8s.services.find((s) => s.namespace === ns && s.name === r.name);
      if (!svc) {
        return {
          name: r.id,
          doc: r.doc,
          status: 'fail',
          got: `(chưa có Service "${r.name}")`,
          expected: `Service/${r.name} có >= ${r.minReadyEndpoints} Ready Endpoints`,
        };
      }
      const readyPods = k8s.pods.filter(
        (p) =>
          p.namespace === ns &&
          p.ready &&
          labelsMatch(svc.selector, p.labels) &&
          p.ports.includes(svc.targetPort)
      );
      const portOk = r.port === undefined || svc.port === r.port;
      const ok = portOk && readyPods.length >= r.minReadyEndpoints;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: `Service/${svc.name} (port=${svc.port}->${svc.targetPort}, selector=${JSON.stringify(svc.selector)}) có ${readyPods.length} Ready Endpoints`,
        expected: `>= ${r.minReadyEndpoints} Ready Endpoints${r.port ? ` trên cổng ${r.port}` : ''}`,
      };
    }

    if (r.target === 'k8s-configmap') {
      const ns = r.namespace ?? 'default';
      const cm = k8s.configMaps.find((c) => c.namespace === ns && c.name === r.name);
      const keysOk = cm && (!r.hasKeys || r.hasKeys.every((k) => k in cm.data));
      return {
        name: r.id,
        doc: r.doc,
        status: keysOk ? 'pass' : 'fail',
        got: cm ? `keys=[${Object.keys(cm.data).join(', ')}]` : `(chưa có ConfigMap "${r.name}")`,
        expected: `ConfigMap/${r.name}${r.hasKeys ? ` có keys [${r.hasKeys.join(', ')}]` : ''}`,
      };
    }

    if (r.target === 'k8s-secret') {
      const ns = r.namespace ?? 'default';
      const sec = k8s.secrets.find((s) => s.namespace === ns && s.name === r.name);
      const keysOk = sec && (!r.hasKeys || r.hasKeys.every((k) => k in sec.data));
      return {
        name: r.id,
        doc: r.doc,
        status: keysOk ? 'pass' : 'fail',
        got: sec ? `keys=[${Object.keys(sec.data).join(', ')}]` : `(chưa có Secret "${r.name}")`,
        expected: `Secret/${r.name}${r.hasKeys ? ` có keys [${r.hasKeys.join(', ')}]` : ''}`,
      };
    }

    if (r.target === 'git-state') {
      const curOk = !r.currentBranch || git.currentBranch === r.currentBranch;
      const brOk = !r.hasBranch || git.branches.includes(r.hasBranch);
      const tagOk = !r.hasTag || r.hasTag in git.tags;
      const cmtCount = r.minCommitsOnBranch
        ? git.commits.filter((c) => c.branch === r.minCommitsOnBranch!.branch).length
        : 0;
      const cmtOk = !r.minCommitsOnBranch || cmtCount >= r.minCommitsOnBranch.count;
      const ok = curOk && brOk && tagOk && cmtOk;
      return {
        name: r.id,
        doc: r.doc,
        status: ok ? 'pass' : 'fail',
        got: `branch=${git.currentBranch}, branches=[${git.branches.join(', ')}], tags=[${Object.keys(git.tags).join(', ')}]`,
        expected: [
          r.currentBranch ? `currentBranch=${r.currentBranch}` : '',
          r.hasBranch ? `hasBranch=${r.hasBranch}` : '',
          r.hasTag ? `tag=${r.hasTag}` : '',
          r.minCommitsOnBranch ? `>=${r.minCommitsOnBranch.count} commits trên ${r.minCommitsOnBranch.branch}` : '',
        ]
          .filter(Boolean)
          .join(', '),
      };
    }

    // stdout-inspected
    const ok = stdoutHistory.includes(r.contains);
    return {
      name: r.id,
      doc: r.doc,
      status: ok ? 'pass' : 'fail',
      got: ok ? `đã xuất "${r.contains}"` : '(kết quả đầu ra chưa hiển thị thông tin cần kiểm tra)',
      expected: `kết quả lệnh hiển thị "${r.contains}"`,
    };
  });
}

export function gradeCliSpec(
  script: string,
  initialState: SimWorldState,
  rules: CliStateCheckRule[]
): GradeResult & { errorLine?: number | null; finalWorld?: SimWorldState } {
  const exec = runScript(script, initialState);
  if (exec.exitCode !== 0 && !exec.stdout) {
    return {
      import_error: exec.stderr || `Lệnh dừng ở mã thoát ${exec.exitCode}`,
      tests: [],
      errorLine: exec.errorLine,
      finalWorld: exec.world,
    };
  }
  if (exec.exitCode !== 0 && exec.stderr) {
    return {
      import_error: `Lệnh gặp lỗi (exit ${exec.exitCode}):\n${exec.stderr}`,
      tests: [],
      errorLine: exec.errorLine,
      finalWorld: exec.world,
    };
  }

  const tests = evaluateCliStateRules(exec.world, rules, exec.stdout);
  return { import_error: null, tests, errorLine: null, finalWorld: exec.world };
}

export function gradeTroubleshootSpec(
  code: string,
  spec: Extract<ExerciseSpec, { kind: 'troubleshoot' }>,
  diagnosticHistoryOutput = ''
): GradeResult & { errorLine?: number | null; finalWorld?: SimWorldState } {
  if (spec.patchFormat === 'cli') {
    return gradeCliSpec(code, spec.initialState, spec.cliRules ?? []);
  }

  if (spec.patchFormat === 'dockerfile') {
    return gradeDockerfileSpec(code, spec.dockerfileRules ?? []);
  }

  if (spec.patchFormat === 'redis-cli') {
    const rRes = gradeRedisCliSpec(code, spec.initialState.redis, spec.redisCliRules ?? [], diagnosticHistoryOutput);
    if (rRes.import_error) return rRes;
    const extraCli = spec.cliRules ? evaluateCliStateRules(cloneWorld(spec.initialState), spec.cliRules, diagnosticHistoryOutput) : [];
    return { ...rRes, tests: [...rRes.tests, ...extraCli] };
  }

  if (spec.patchFormat === 'redis-conf') {
    const cRes = gradeRedisConfSpec(code, spec.redisConfRules ?? []);
    if (cRes.import_error) return cRes;
    const rt = createRedisRuntime(spec.initialState.redis);
    const rTests = spec.redisCliRules ? evaluateRedisCliRules(rt, spec.redisCliRules, diagnosticHistoryOutput) : [];
    const extraCli = spec.cliRules ? evaluateCliStateRules(cloneWorld(spec.initialState), spec.cliRules, diagnosticHistoryOutput) : [];
    return {
      import_error: null,
      tests: [...cRes.tests, ...rTests, ...extraCli],
      errorLine: cRes.errorLine,
    };
  }

  // patchFormat === 'yaml': vừa kiểm tra cấu trúc YAML, vừa apply vào trạng thái K8s (nếu có cliRules)
  const yamlRes = gradeYamlSpec(code, spec.yamlRules ?? []);
  if (yamlRes.import_error) return yamlRes;

  const world = cloneWorld(spec.initialState);
  const applied = applyYamlManifestsToWorld(code, world);
  if (!applied.ok) {
    return { import_error: applied.err ?? 'Không thể apply YAML vào cụm mô phỏng.', tests: [] };
  }

  const cliTests = spec.cliRules ? evaluateCliStateRules(world, spec.cliRules, diagnosticHistoryOutput) : [];
  return {
    import_error: null,
    tests: [...yamlRes.tests, ...cliTests],
    errorLine: yamlRes.errorLine,
    finalWorld: world,
  };
}

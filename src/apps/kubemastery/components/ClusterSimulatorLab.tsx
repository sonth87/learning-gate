import React, { useState, useRef, useEffect } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  RefreshCw,
  Flame,
  Zap,
  TrendingUp,
  RotateCcw,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  ShieldCheck,
  Send,
  Box,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface SimPod {
  id: string;
  name: string;
  nodeName: 'worker-node-1' | 'worker-node-2' | 'worker-node-3';
  version: string;
  ip: string;
  status: 'Running' | 'ContainerCreating' | 'Terminating';
  ready: boolean;
  restarts: number;
  cpuMillicores: number;
  memoryMi: number;
}

interface SimNode {
  name: 'worker-node-1' | 'worker-node-2' | 'worker-node-3';
  ip: string;
  status: 'Ready' | 'NotReady';
  cpuCapacity: number; // m
  memCapacity: number; // Mi
}

const INITIAL_NODES: SimNode[] = [
  { name: 'worker-node-1', ip: '192.168.10.11', status: 'Ready', cpuCapacity: 2000, memCapacity: 4096 },
  { name: 'worker-node-2', ip: '192.168.10.12', status: 'Ready', cpuCapacity: 2000, memCapacity: 4096 },
  { name: 'worker-node-3', ip: '192.168.10.13', status: 'Ready', cpuCapacity: 2000, memCapacity: 4096 },
];

const INITIAL_PODS: SimPod[] = [
  {
    id: 'p1',
    name: 'shop-web-7d9f8b-a12x',
    nodeName: 'worker-node-1',
    version: 'v1.2.0',
    ip: '10.244.1.12',
    status: 'Running',
    ready: true,
    restarts: 0,
    cpuMillicores: 180,
    memoryMi: 210,
  },
  {
    id: 'p2',
    name: 'shop-web-7d9f8b-b45y',
    nodeName: 'worker-node-2',
    version: 'v1.2.0',
    ip: '10.244.2.15',
    status: 'Running',
    ready: true,
    restarts: 0,
    cpuMillicores: 195,
    memoryMi: 225,
  },
  {
    id: 'p3',
    name: 'shop-web-7d9f8b-c89z',
    nodeName: 'worker-node-3',
    version: 'v1.2.0',
    ip: '10.244.3.19',
    status: 'Running',
    ready: true,
    restarts: 0,
    cpuMillicores: 170,
    memoryMi: 205,
  },
];

export const ClusterSimulatorLab: React.FC = () => {
  const [nodes, setNodes] = useState<SimNode[]>(INITIAL_NODES);
  const [pods, setPods] = useState<SimPod[]>(INITIAL_PODS);
  const [desiredReplicas, setDesiredReplicas] = useState<number>(3);
  const [currentVersion, setCurrentVersion] = useState<string>('v1.2.0');
  const [previousVersion, setPreviousVersion] = useState<string>('v1.1.0');
  const [hpaActive, setHpaActive] = useState<boolean>(false);
  const [isRollingUpdating, setIsRollingUpdating] = useState<boolean>(false);
  const [controlLoopEvent, setControlLoopEvent] = useState<string>(
    'Control Loop 24/7: Trạng thái thực tế (3/3 Pods) khớp 100% với Sổ cái etcd.'
  );

  const [terminalInput, setTerminalInput] = useState<string>('');
  const [terminalLogs, setTerminalLogs] = useState<
    { id: string; cmd?: string; output: string; type: 'info' | 'success' | 'warn' }[]
  >([
    {
      id: 'init-1',
      output:
        'Chào mừng đến với Phòng Mô phỏng Cụm Kubernetes & Docker Thực chiến! Gõ lệnh kubectl / docker bên dưới hoặc bấm các nút Tình huống ở trên để quan sát cụm K8s tự phục hồi và co giãn trực tiếp.',
      type: 'info',
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const appendLog = (
    output: string,
    type: 'info' | 'success' | 'warn' = 'info',
    cmd?: string
  ) => {
    setTerminalLogs((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, cmd, output, type },
    ]);
  };

  const getHealthyNodes = (currentNodes: SimNode[]) =>
    currentNodes.filter((n) => n.status === 'Ready');

  // Action 1: Kill a Pod and watch Self-Healing
  const handleKillRandomPod = () => {
    const runningPods = pods.filter((p) => p.status === 'Running');
    if (runningPods.length === 0) return;
    const victim = runningPods[Math.floor(Math.random() * runningPods.length)];

    setControlLoopEvent(
      `⚠️ PHÁT HIỆN SỰ CỐ: Pod ${victim.name} trên ${victim.nodeName} vừa bị tiêu diệt! Đội Thanh tra (Controller Manager) phát hiện quân số tụt xuống ${runningPods.length - 1}/${desiredReplicas}!`
    );
    appendLog(
      `[CHAOS] Đã bắn sập Pod ${victim.name} (${victim.ip}). Quân số thực tế tụt xuống ${runningPods.length - 1}/${desiredReplicas}.`,
      'warn',
      `kubectl delete pod ${victim.name} -n production`
    );

    // Mark victim as Terminating
    setPods((prev) =>
      prev.map((p) => (p.id === victim.id ? { ...p, status: 'Terminating', ready: false } : p))
    );

    // After 900ms, Controller Manager + Scheduler spawns replacement Pod
    setTimeout(() => {
      const readyNodes = getHealthyNodes(nodes);
      const targetNode =
        readyNodes[Math.floor(Math.random() * readyNodes.length)]?.name || 'worker-node-1';
      const suffix = Math.random().toString(36).substring(2, 6);
      const newPodName = `shop-web-7d9f8b-${suffix}`;
      const newIp = `10.244.${targetNode.slice(-1)}.${Math.floor(20 + Math.random() * 70)}`;

      setControlLoopEvent(
        `🔄 SELF-HEALING: Trưởng phòng Scheduler đã chọn ${targetNode} và Kubelet đang giải nén Pod bù ${newPodName} (${newIp})...`
      );

      setPods((prev) => [
        ...prev.filter((p) => p.id !== victim.id),
        {
          id: `pod-${Date.now()}`,
          name: newPodName,
          nodeName: targetNode,
          version: currentVersion,
          ip: newIp,
          status: 'ContainerCreating',
          ready: false,
          restarts: 0,
          cpuMillicores: 185,
          memoryMi: 215,
        },
      ]);

      setTimeout(() => {
        setPods((prev) =>
          prev.map((p) =>
            p.name === newPodName ? { ...p, status: 'Running', ready: true } : p
          )
        );
        setControlLoopEvent(
          `✅ ĐÃ TỰ PHỤC HỒI (Self-Healed): Pod mới ${newPodName} đã vượt qua Readiness Probe và nhận khách tại ${newIp}. Quân số cân bằng ${desiredReplicas}/${desiredReplicas}!`
        );
        appendLog(
          `[CONTROL-LOOP] ReplicaSet Controller đã tự động tạo bù Pod ${newPodName} trên ${targetNode} (${newIp}) -> Trạng thái: 1/1 Running!`,
          'success'
        );
      }, 1100);
    }, 900);
  };

  // Action 2: Rolling Update (Zero-Downtime)
  const handleRollingUpdate = () => {
    if (isRollingUpdating) return;
    const nextVer = currentVersion === 'v1.2.0' ? 'v1.3.0' : 'v1.2.0';
    setPreviousVersion(currentVersion);
    setIsRollingUpdating(true);

    setControlLoopEvent(
      `🚀 ROLLING UPDATE (${currentVersion} → ${nextVer}): Bật dư 1 Pod ${nextVer} mới (maxSurge: 1), đợi Readiness Probe báo khỏe rồi mới tắt Pod cũ (maxUnavailable: 0)!`
    );
    appendLog(
      `deployment.apps/web-app-deployment image updated to myregistry.io/shop-web:${nextVer} (RollingUpdate: maxSurge=1, maxUnavailable=0)`,
      'info',
      `kubectl set image deployment/web-app-deployment web=myregistry.io/shop-web:${nextVer} -n production`
    );

    const readyNodes = getHealthyNodes(nodes);
    const snapshotPods = [...pods];

    snapshotPods.forEach((oldPod, idx) => {
      setTimeout(() => {
        const targetNode =
          readyNodes[idx % readyNodes.length]?.name || oldPod.nodeName;
        const suffix = Math.random().toString(36).substring(2, 6);
        const newPodName = `shop-web-9f2c1a-${suffix}`;
        const newIp = `10.244.${targetNode.slice(-1)}.${Math.floor(30 + Math.random() * 60)}`;

        // Step A: Spawn surge pod alongside existing pods
        setPods((prev) => [
          ...prev,
          {
            id: `surge-${Date.now()}-${idx}`,
            name: newPodName,
            nodeName: targetNode,
            version: nextVer,
            ip: newIp,
            status: 'ContainerCreating',
            ready: false,
            restarts: 0,
            cpuMillicores: 175,
            memoryMi: 210,
          },
        ]);

        // Step B: Surge pod becomes Ready & old pod terminates
        setTimeout(() => {
          setPods((prev) =>
            prev
              .filter((p) => p.id !== oldPod.id)
              .map((p) =>
                p.name === newPodName ? { ...p, status: 'Running', ready: true } : p
              )
          );

          if (idx === snapshotPods.length - 1) {
            setCurrentVersion(nextVer);
            setIsRollingUpdating(false);
            setControlLoopEvent(
              `✅ HOÀN TẤT ROLLING UPDATE: Toàn bộ ${snapshotPods.length} Pod đã nâng cấp lên bản ${nextVer} êm ái với 0 giây gián đoạn (Zero Downtime)!`
            );
            appendLog(
              `deployment "web-app-deployment" successfully rolled out to ${nextVer} (Zero Downtime verified!)`,
              'success'
            );
          }
        }, 850);
      }, idx * 1100);
    });
  };

  // Action 3: Crash / Recover Worker Node 2
  const handleToggleNode2Outage = () => {
    const node2 = nodes.find((n) => n.name === 'worker-node-2');
    if (!node2) return;

    if (node2.status === 'Ready') {
      // Crash Node 2
      setNodes((prev) =>
        prev.map((n) =>
          n.name === 'worker-node-2' ? { ...n, status: 'NotReady' } : n
        )
      );
      const affectedPods = pods.filter((p) => p.nodeName === 'worker-node-2');
      setControlLoopEvent(
        `⚡ CHÁY NGUỒN MÁY CHỦ: worker-node-2 mất liên lạc (NotReady)! K8s lập tức di tản ${affectedPods.length} Pod sang worker-node-1 và worker-node-3!`
      );
      appendLog(
        `[NODE OUTAGE] Quản đốc Kubelet trên worker-node-2 ngừng gửi báo cáo -> Node chuyển sang NotReady. Đang di tản ${affectedPods.length} Pod sang máy chủ khác...`,
        'warn'
      );

      setTimeout(() => {
        setPods((prev) =>
          prev.map((p, idx) => {
            if (p.nodeName !== 'worker-node-2') return p;
            const fallbackNode = idx % 2 === 0 ? 'worker-node-1' : 'worker-node-3';
            const suffix = Math.random().toString(36).substring(2, 6);
            return {
              ...p,
              name: `shop-web-evac-${suffix}`,
              nodeName: fallbackNode,
              ip: `10.244.${fallbackNode.slice(-1)}.${Math.floor(50 + Math.random() * 45)}`,
              status: 'Running',
              ready: true,
            };
          })
        );
        appendLog(
          `[EVACUATION COMPLETE] Toàn bộ Pod trên worker-node-2 đã được giải nén lại an toàn trên worker-node-1 & worker-node-3!`,
          'success'
        );
      }, 900);
    } else {
      // Recover Node 2
      setNodes((prev) =>
        prev.map((n) =>
          n.name === 'worker-node-2' ? { ...n, status: 'Ready' } : n
        )
      );
      setControlLoopEvent(
        `✅ KHÔI PHỤC MÁY CHỦ: Quản đốc Kubelet trên worker-node-2 đã gửi báo cáo trở lại. Cả 3 Worker Nodes đều Ready!`
      );
      appendLog(
        `node/worker-node-2 status changed from NotReady to Ready.`,
        'success'
      );
    }
  };

  // Action 4: Simulate 0h00 Flash Sale HPA Autoscaling
  const handleToggleFlashSaleHpa = () => {
    if (!hpaActive) {
      setHpaActive(true);
      setDesiredReplicas(6);
      setControlLoopEvent(
        `📈 KHUYẾN MÃI 0H00: Lượng khách tăng gấp 10 lần làm CPU vọt lên 92% (> 70%)! HPA lập tức nhân bản từ ${pods.length} lên 6 Pods!`
      );
      appendLog(
        `[HPA AUTOSCALER] CPU utilization 92% > target 70%. Scaling web-app-deployment replicas from ${pods.length} -> 6!`,
        'warn',
        `kubectl get hpa web-app-hpa -n production`
      );

      const readyNodes = getHealthyNodes(nodes);
      const countToAdd = Math.max(0, 6 - pods.length);
      const extraPods: SimPod[] = Array.from({ length: countToAdd }).map((_, i) => {
        const targetNode =
          readyNodes[i % readyNodes.length]?.name || 'worker-node-1';
        const suffix = Math.random().toString(36).substring(2, 6);
        return {
          id: `hpa-${Date.now()}-${i}`,
          name: `shop-web-hpa-${suffix}`,
          nodeName: targetNode,
          version: currentVersion,
          ip: `10.244.${targetNode.slice(-1)}.${Math.floor(60 + Math.random() * 35)}`,
          status: 'Running',
          ready: true,
          restarts: 0,
          cpuMillicores: 390,
          memoryMi: 320,
        };
      });

      setPods((prev) => [
        ...prev.map((p) => ({ ...p, cpuMillicores: 410, memoryMi: 330 })),
        ...extraPods,
      ]);
    } else {
      setHpaActive(false);
      setDesiredReplicas(3);
      setPods((prev) =>
        prev
          .slice(0, 3)
          .map((p) => ({ ...p, cpuMillicores: 180, memoryMi: 210 }))
      );
      setControlLoopEvent(
        `🌙 02H00 SÁNG HẾT GIỜ CAO ĐIỂM: CPU giảm về 22%. HPA tự động thu gọn từ 6 về 3 Pods để tiết kiệm tiền thuê máy chủ!`
      );
      appendLog(
        `[HPA AUTOSCALER] Traffic cooled down (CPU 22%). Scaled down web-app-deployment replicas 6 -> 3.`,
        'info'
      );
    }
  };

  // Action 5: Reset Cluster
  const handleResetCluster = () => {
    setNodes(INITIAL_NODES);
    setPods(INITIAL_PODS);
    setDesiredReplicas(3);
    setCurrentVersion('v1.2.0');
    setHpaActive(false);
    setIsRollingUpdating(false);
    setControlLoopEvent(
      'Đã khôi phục cụm Kubernetes về trạng thái chuẩn (3 Worker Nodes Ready, 3 Pods v1.2.0 Running).'
    );
    appendLog('Cluster state reset to default 3 Ready Nodes & 3 Running Pods.', 'info');
  };

  // Interactive CLI Command Executor
  const executeCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    const lower = cmd.toLowerCase();

    if (lower.startsWith('kubectl get pods')) {
      const header =
        'NAME                          READY   STATUS              RESTARTS   AGE   IP            NODE';
      const rows = pods
        .map(
          (p) =>
            `${p.name.padEnd(29)} ${p.ready ? '1/1' : '0/1'}     ${p.status.padEnd(19)} ${String(p.restarts).padEnd(10)} 12m   ${p.ip.padEnd(13)} ${p.nodeName}`
        )
        .join('\n');
      appendLog(`${header}\n${rows}`, 'info', cmd);
    } else if (lower.startsWith('kubectl get nodes')) {
      const header = 'NAME            STATUS     ROLES    AGE   VERSION   INTERNAL-IP';
      const rows = nodes
        .map(
          (n) =>
            `${n.name.padEnd(15)} ${n.status.padEnd(10)} worker   45d   v1.30.0   ${n.ip}`
        )
        .join('\n');
      appendLog(`${header}\n${rows}`, 'info', cmd);
    } else if (
      lower.startsWith('kubectl get endpoints') ||
      lower.startsWith('kubectl get svc')
    ) {
      const readyIps = pods
        .filter((p) => p.ready)
        .map((p) => `${p.ip}:3000`)
        .join(', ');
      appendLog(
        `NAME              TYPE        CLUSTER-IP      PORT(S)   SELECTOR       ENDPOINTS\nweb-app-service   ClusterIP   10.96.142.88    80/TCP    app=shop-web   ${readyIps || '<none>'}`,
        'success',
        cmd
      );
    } else if (lower.startsWith('kubectl top')) {
      const header = 'NAME                          CPU(cores)   MEMORY(bytes)   VERSION';
      const rows = pods
        .map(
          (p) =>
            `${p.name.padEnd(29)} ${String(p.cpuMillicores + 'm').padEnd(12)} ${String(p.memoryMi + 'Mi').padEnd(15)} ${p.version}`
        )
        .join('\n');
      appendLog(`${header}\n${rows}`, 'info', cmd);
    } else if (lower.startsWith('kubectl rollout undo')) {
      const targetVer = previousVersion;
      setPreviousVersion(currentVersion);
      setCurrentVersion(targetVer);
      setPods((prev) => prev.map((p) => ({ ...p, version: targetVer })));
      setControlLoopEvent(
        `⏪ ROLLBACK KHẨN CẤP: Đã quay lui toàn bộ Deployment về phiên bản ổn định ${targetVer}!`
      );
      appendLog(
        `deployment.apps/web-app-deployment rolled back to revision (${targetVer})`,
        'success',
        cmd
      );
    } else if (lower.startsWith('kubectl scale')) {
      const match = cmd.match(/replicas=(\d+)/);
      const count = match ? Math.min(9, Math.max(1, Number(match[1]))) : 4;
      setDesiredReplicas(count);
      const readyNodes = getHealthyNodes(nodes);
      const updatedPods: SimPod[] = Array.from({ length: count }).map((_, i) => {
        if (pods[i]) return pods[i];
        const targetNode =
          readyNodes[i % readyNodes.length]?.name || 'worker-node-1';
        const suffix = Math.random().toString(36).substring(2, 6);
        return {
          id: `scale-${Date.now()}-${i}`,
          name: `shop-web-7d9f8b-${suffix}`,
          nodeName: targetNode,
          version: currentVersion,
          ip: `10.244.${targetNode.slice(-1)}.${Math.floor(25 + Math.random() * 65)}`,
          status: 'Running',
          ready: true,
          restarts: 0,
          cpuMillicores: 180,
          memoryMi: 210,
        };
      });
      setPods(updatedPods);
      setControlLoopEvent(
        `⚖️ SCALE DEPLOYMENT: Đã điều chỉnh quân số cam kết (replicas) thành ${count} Pods!`
      );
      appendLog(
        `deployment.apps/web-app-deployment scaled to ${count} replicas.`,
        'success',
        cmd
      );
    } else if (lower.startsWith('docker ps') || lower.startsWith('docker compose')) {
      appendLog(
        `CONTAINER ID   IMAGE                COMMAND                  STATUS         PORTS                    NAMES\nc81a92f01b22   shop-backend:v1.2    "node dist/server.js"    Up 15 minutes  0.0.0.0:8080->3000/tcp   shop-backend-api\nd92b41e88c11   postgres:16-alpine   "docker-entrypoint.s…"   Up 15 minutes  5432/tcp                 shop-postgres-db (Volume: pgdata)\ne04c55a19d33   redis:7-alpine       "docker-entrypoint.s…"   Up 15 minutes  6379/tcp                 shop-redis-cache`,
        'info',
        cmd
      );
    } else {
      appendLog(
        `Lệnh gợi ý có sẵn:\n  • kubectl get pods -o wide\n  • kubectl get nodes\n  • kubectl get svc,endpoints\n  • kubectl top pods\n  • kubectl scale deploy web-app-deployment --replicas=5\n  • kubectl rollout undo deploy/web-app-deployment\n  • docker ps`,
        'info',
        cmd
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Top Simulator Header & Chaos Control Bar */}
      <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-slate-900 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Server className="h-4 w-4 shrink-0" />
              <span>Mô Phỏng Cụm Kubernetes & Docker Sống Động Như Thật (Live Cluster Lab)</span>
            </div>
            <h1 className="font-mono text-lg sm:text-2xl font-extrabold text-white">
              Trải Nghiệm Trực Tiếp Self-Healing, Rolling Update, HPA & Terminal Thực Thi
            </h1>
          </div>

          <button
            onClick={handleResetCluster}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 self-start lg:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5 text-sky-400" />
            <span>Reset Cụm Về Mặc Định</span>
          </button>
        </div>

        {/* One-Click Interactive Simulation Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={handleKillRandomPod}
            className="flex items-center gap-2.5 rounded-xl border border-rose-500/45 bg-rose-500/15 px-3.5 py-2.5 text-left text-xs font-bold text-rose-200 hover:bg-rose-500/25 transition-all"
          >
            <Flame className="h-4 w-4 text-rose-400 shrink-0" />
            <div>
              <div>🔥 Bắn Sập 1 Pod Ngẫu Nhiên</div>
              <div className="text-[11px] font-normal text-rose-300/90">
                Xem K8s tự đẻ bù Pod mới (Self-Heal)
              </div>
            </div>
          </button>

          <button
            onClick={handleRollingUpdate}
            disabled={isRollingUpdating}
            className="flex items-center gap-2.5 rounded-xl border border-sky-500/45 bg-sky-500/15 px-3.5 py-2.5 text-left text-xs font-bold text-sky-200 hover:bg-sky-500/25 disabled:opacity-50 transition-all"
          >
            <RefreshCw
              className={cn(
                'h-4 w-4 text-sky-400 shrink-0',
                isRollingUpdating && 'animate-spin'
              )}
            />
            <div>
              <div>
                🚀 Rolling Update ({currentVersion} →{' '}
                {currentVersion === 'v1.2.0' ? 'v1.3.0' : 'v1.2.0'})
              </div>
              <div className="text-[11px] font-normal text-sky-300/90">
                Nâng cấp cuốn chiếu Zero-Downtime
              </div>
            </div>
          </button>

          <button
            onClick={handleToggleNode2Outage}
            className="flex items-center gap-2.5 rounded-xl border border-amber-500/45 bg-amber-500/15 px-3.5 py-2.5 text-left text-xs font-bold text-amber-200 hover:bg-amber-500/25 transition-all"
          >
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <div>
                {nodes.find((n) => n.name === 'worker-node-2')?.status === 'Ready'
                  ? '⚡ Đốt Sập Nguồn Worker Node 2'
                  : '🔌 Khôi Phục Điện Worker Node 2'}
              </div>
              <div className="text-[11px] font-normal text-amber-300/90">
                Xem K8s tự di tản Pod sang máy khác
              </div>
            </div>
          </button>

          <button
            onClick={handleToggleFlashSaleHpa}
            className="flex items-center gap-2.5 rounded-xl border border-violet-500/45 bg-violet-500/15 px-3.5 py-2.5 text-left text-xs font-bold text-violet-200 hover:bg-violet-500/25 transition-all"
          >
            <TrendingUp className="h-4 w-4 text-violet-400 shrink-0" />
            <div>
              <div>
                {hpaActive
                  ? '🌙 Hết Khuyến Mãi (Thu về 3 Pods)'
                  : '📈 Khuyến Mãi 0h00 (HPA → 6 Pods)'}
              </div>
              <div className="text-[11px] font-normal text-violet-300/90">
                Tự động co giãn theo tải CPU 92%
              </div>
            </div>
          </button>
        </div>

        {/* Live Control Loop Banner */}
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-slate-950/90 px-3.5 py-2.5 text-xs">
          <Activity className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />
          <span className="font-mono font-semibold text-emerald-300">
            {controlLoopEvent}
          </span>
        </div>
      </div>

      {/* Live Cluster Topology Visual Map: Control Plane + Ingress/Service + 3 Worker Nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 4 Cols: Control Plane & Ingress/Service Routing */}
        <div className="lg:col-span-4 space-y-4">
          {/* Control Plane Box */}
          <div className="rounded-2xl border border-sky-500/35 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase text-sky-400">
                  CONTROL PLANE (BAN GIÁM ĐỐC)
                </span>
                <h3 className="text-sm font-extrabold text-white">
                  Tổng Hành Dinh Điều Khiển
                </h3>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                Healthy
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                <div className="font-mono font-bold text-sky-300">kube-apiserver</div>
                <div className="text-[11px] text-slate-400">Quầy lễ tân trung tâm</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                <div className="font-mono font-bold text-amber-300">etcd (Sổ cái)</div>
                <div className="text-[11px] text-slate-400">
                  Desired: {desiredReplicas} Pods ({currentVersion})
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                <div className="font-mono font-bold text-violet-300">kube-scheduler</div>
                <div className="text-[11px] text-slate-400">
                  {getHealthyNodes(nodes).length}/3 Nodes khả dụng
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                <div className="font-mono font-bold text-emerald-300">controller-mgr</div>
                <div className="text-[11px] text-slate-400">
                  Actual: {pods.filter((p) => p.ready).length}/{desiredReplicas} Ready
                </div>
              </div>
            </div>
          </div>

          {/* Ingress & Service Box */}
          <div className="rounded-2xl border border-violet-500/35 bg-slate-900/80 p-4 space-y-3">
            <div className="border-b border-slate-800 pb-2.5">
              <span className="font-mono text-[10px] font-bold uppercase text-violet-400">
                INGRESS & SERVICE (LỄ TÂN & TỔNG ĐÀI)
              </span>
              <h3 className="text-sm font-extrabold text-white">
                https://shop.com → web-app-service:80
              </h3>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 font-mono text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Service Selector:</span>
                <span className="text-emerald-300 font-bold">app=shop-web</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Port Mapping:</span>
                <span className="text-sky-300 font-bold">80 → targetPort: 3000</span>
              </div>
              <div className="pt-1 border-t border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1">
                  Active Endpoints ({pods.filter((p) => p.ready).length} Pods):
                </div>
                <div className="flex flex-wrap gap-1">
                  {pods
                    .filter((p) => p.ready)
                    .map((p) => (
                      <span
                        key={p.id}
                        className="rounded bg-emerald-500/15 border border-emerald-500/35 px-1.5 py-0.5 text-[10px] text-emerald-300"
                      >
                        {p.ip}:3000
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 8 Cols: 3 Worker Nodes & Live Running Pods */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {nodes.map((node) => {
            const nodePods = pods.filter((p) => p.nodeName === node.name);
            const usedCpu = nodePods.reduce((acc, p) => acc + p.cpuMillicores, 0);
            const usedMem = nodePods.reduce((acc, p) => acc + p.memoryMi, 0);
            const cpuPct = Math.min(100, Math.round((usedCpu / node.cpuCapacity) * 100));
            const memPct = Math.min(100, Math.round((usedMem / node.memCapacity) * 100));
            const isReady = node.status === 'Ready';

            return (
              <div
                key={node.name}
                className={cn(
                  'rounded-2xl border p-4 flex flex-col justify-between space-y-4 transition-all',
                  isReady
                    ? 'border-slate-800 bg-slate-900/80'
                    : 'border-rose-500/60 bg-rose-950/20 opacity-80'
                )}
              >
                <div className="space-y-3">
                  {/* Node Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <div className="font-mono text-xs font-extrabold text-white">
                        {node.name}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        IP: {node.ip} • Kubelet
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold',
                        isReady
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                          : 'border-rose-500/50 bg-rose-500/25 text-rose-300 animate-pulse'
                      )}
                    >
                      {node.status}
                    </span>
                  </div>

                  {/* CPU & RAM Meters */}
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div>
                      <div className="flex justify-between text-slate-300">
                        <span>CPU (cgroups):</span>
                        <span className={cn(cpuPct > 75 ? 'text-amber-300' : 'text-sky-300')}>
                          {usedCpu}m / {node.cpuCapacity}m ({cpuPct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-0.5">
                        <div
                          className={cn(
                            'h-full transition-all duration-300',
                            cpuPct > 75 ? 'bg-amber-400' : 'bg-sky-400'
                          )}
                          style={{ width: `${cpuPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300">
                        <span>RAM (Limits):</span>
                        <span className="text-emerald-300">
                          {usedMem}Mi / {node.memCapacity}Mi ({memPct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-0.5">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-300"
                          style={{ width: `${memPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pods inside this Worker Node */}
                  <div className="space-y-2 pt-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      Căn hộ Pods đang chạy ({nodePods.length}):
                    </div>

                    {nodePods.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                        {isReady
                          ? 'Chưa có Pod nào trên máy chủ này'
                          : 'Node mất điện — Các Pod đã được di tản!'}
                      </div>
                    ) : (
                      nodePods.map((pod) => (
                        <div
                          key={pod.id}
                          className={cn(
                            'rounded-xl border p-2.5 space-y-1 transition-all',
                            pod.status === 'Running' &&
                              'border-emerald-500/40 bg-emerald-500/10',
                            pod.status === 'ContainerCreating' &&
                              'border-sky-500/50 bg-sky-500/15 animate-pulse',
                            pod.status === 'Terminating' &&
                              'border-rose-500/50 bg-rose-500/15 opacity-60'
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[11px] font-bold text-white truncate">
                              {pod.name}
                            </span>
                            <span
                              className={cn(
                                'rounded px-1.5 py-0.5 font-mono text-[9px] font-bold',
                                pod.status === 'Running' &&
                                  'bg-emerald-500/25 text-emerald-300',
                                pod.status === 'ContainerCreating' &&
                                  'bg-sky-500/25 text-sky-300',
                                pod.status === 'Terminating' &&
                                  'bg-rose-500/25 text-rose-300'
                              )}
                            >
                              {pod.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-300">
                            <span>IP: {pod.ip}</span>
                            <span className="text-amber-300 font-bold">{pod.version}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive kubectl & docker Live Terminal */}
      <div className="ide-dark-surface rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="font-mono text-xs font-bold text-white">
              Terminal Thực Thi Trực Tiếp (kubectl & docker CLI)
            </span>
          </div>

          {/* Quick Command Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              'kubectl get pods -o wide',
              'kubectl get nodes',
              'kubectl get svc,endpoints',
              'kubectl top pods',
              'kubectl scale deploy web-app-deployment --replicas=5',
              'kubectl rollout undo deploy/web-app-deployment',
              'docker ps',
            ].map((qCmd) => (
              <button
                key={qCmd}
                onClick={() => executeCommand(qCmd)}
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-sky-300 hover:border-sky-500/50 hover:bg-slate-800 transition-colors"
              >
                {qCmd}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Output Scroll Area */}
        <div className="h-56 overflow-y-auto p-4 font-mono text-xs space-y-2.5">
          {terminalLogs.map((log) => (
            <div key={log.id} className="space-y-1">
              {log.cmd && (
                <div className="text-amber-300 font-bold">
                  <span className="text-emerald-400">sre@k8s-prod:~$</span> {log.cmd}
                </div>
              )}
              <pre
                className={cn(
                  'whitespace-pre-wrap leading-relaxed pl-2 border-l-2',
                  log.type === 'success' && 'border-emerald-500 text-emerald-300',
                  log.type === 'warn' && 'border-amber-500 text-amber-300',
                  log.type === 'info' && 'border-sky-500 text-slate-200'
                )}
              >
                {log.output}
              </pre>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeCommand(terminalInput);
            setTerminalInput('');
          }}
          className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/80 px-4 py-2.5"
        >
          <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
            sre@k8s-prod:~$
          </span>
          <input
            type="text"
            value={terminalInput}
            onChange={(e) => setTerminalInput(e.target.value)}
            placeholder="Nhập lệnh (ví dụ: kubectl get pods -o wide, kubectl get endpoints, docker ps)..."
            className="flex-1 bg-transparent font-mono text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1 font-mono text-xs font-bold text-slate-950 hover:bg-emerald-400"
          >
            <Send className="h-3 w-3" />
            <span>Chạy</span>
          </button>
        </form>
      </div>
    </div>
  );
};

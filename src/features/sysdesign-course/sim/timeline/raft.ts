/**
 * Mô phỏng Raft rút gọn (Leader Election, Term, Quorum Log Commit) & Fencing Token (S3-03, 04 §12).
 * Không bao gồm log compaction hay thay đổi membership (ADR-020).
 */
import type { ActorId, TimelineRun } from './types';
import { DiscreteEventWorld } from './engine';

export type RaftRole = 'follower' | 'candidate' | 'leader';

export interface RaftLogEntry {
  term: number;
  index: number;
  key: string;
  value: string | number;
}

export interface RaftNodeSnapshot {
  id: ActorId;
  role: RaftRole;
  term: number;
  votedFor: ActorId | null;
  fencingToken: number;
  commitIndex: number;
  log: RaftLogEntry[];
}

export interface RaftScenarioConfig {
  nodeCount?: 3 | 5;
  /** Cô lập leader ban đầu ở thời điểm partitionAtMs để kích hoạt bầu cử term mới */
  partitionLeaderAtMs?: number;
  healAtMs?: number;
  /** Thử cho leader cũ (zombie) ghi trực tiếp vào storage với fencing token cũ */
  testFencingTokenAtMs?: number;
  useFencingToken?: boolean;
  seed?: number;
}

export interface RaftRun extends TimelineRun {
  nodes: Record<ActorId, RaftNodeSnapshot>;
  storageValue: string | number | null;
  storageMaxToken: number;
  zombieWriteRejected: boolean;
}

export function simulateRaftScenario(cfg: RaftScenarioConfig = {}): RaftRun {
  const nCount = cfg.nodeCount ?? 3;
  const majority = Math.floor(nCount / 2) + 1;
  const nodeIds = Array.from({ length: nCount }, (_, i) => `N${i + 1}`);
  const storageId = 'Storage';
  const clientA = 'C1';

  const world = new DiscreteEventWorld({
    seed: cfg.seed ?? 2026,
    actors: [clientA, ...nodeIds, storageId],
    defaultDelayMs: 12,
    jitterMs: 0,
  });

  let nextFencingToken = 0;
  let storageMaxToken = 0;
  let storageValue: string | number | null = null;
  let zombieWriteRejected = false;

  interface NodeState {
    id: ActorId;
    role: RaftRole;
    term: number;
    votedFor: ActorId | null;
    fencingToken: number;
    commitIndex: number;
    log: RaftLogEntry[];
    lastHeartbeatMs: number;
    electionTimeoutMs: number;
  }

  const states = new Map<ActorId, NodeState>();
  nodeIds.forEach((id, idx) => {
    states.set(id, {
      id,
      role: 'follower',
      term: 0,
      votedFor: null,
      fencingToken: 0,
      commitIndex: 0,
      log: [],
      lastHeartbeatMs: 0,
      // N1 timeout sớm nhất (60ms) để thắng bầu cử đầu tiên tất định
      electionTimeoutMs: 60 + idx * 45,
    });
  });

  const stepDown = (st: NodeState, newTerm: number) => {
    st.term = newTerm;
    st.role = 'follower';
    st.votedFor = null;
  };

  const sendHeartbeats = (leader: NodeState) => {
    if (leader.role !== 'leader' || !world.isUp(leader.id)) return;
    const term = leader.term;
    for (const peerId of nodeIds) {
      if (peerId === leader.id) continue;
      world.sendMessage(leader.id, peerId, 'heartbeat', `AppendEntries(t=${term})`, () => {
        const peer = states.get(peerId)!;
        if (term < peer.term) {
          world.sendMessage(peerId, leader.id, 'heartbeat-rej', `HigherTerm(${peer.term})`, () => {
            if (peer.term > leader.term) stepDown(leader, peer.term);
          });
          return;
        }
        if (term > peer.term) stepDown(peer, term);
        peer.role = 'follower';
        peer.lastHeartbeatMs = world.nowMs;
      });
    }
    world.scheduleAfter(40, () => {
      if (leader.role === 'leader' && leader.term === term) sendHeartbeats(leader);
    });
  };

  const startElection = (cand: NodeState) => {
    if (!world.isUp(cand.id) || cand.role === 'leader') return;
    cand.term += 1;
    cand.role = 'candidate';
    cand.votedFor = cand.id;
    cand.lastHeartbeatMs = world.nowMs;
    const term = cand.term;
    let votes = 1;
    world.milestone(cand.id, 'ELECTION_START', `${cand.id} ứng cử term ${term}`);

    for (const peerId of nodeIds) {
      if (peerId === cand.id) continue;
      world.sendMessage(cand.id, peerId, 'request-vote', `RequestVote(t=${term})`, () => {
        const peer = states.get(peerId)!;
        if (term > peer.term) stepDown(peer, term);
        const canVote =
          term === peer.term &&
          (peer.votedFor === null || peer.votedFor === cand.id) &&
          cand.log.length >= peer.log.length;
        if (canVote) {
          peer.votedFor = cand.id;
          peer.lastHeartbeatMs = world.nowMs;
        }
        world.sendMessage(peerId, cand.id, 'vote-reply', canVote ? `VoteYES(t=${term})` : `VoteNO(t=${peer.term})`, () => {
          if (cand.role !== 'candidate' || cand.term !== term) return;
          if (!canVote) return;
          votes += 1;
          if (votes >= majority) {
            cand.role = 'leader';
            cand.fencingToken = ++nextFencingToken;
            world.milestone(cand.id, 'LEADER_ELECTED', `${cand.id} thành Leader term ${term} (token=${cand.fencingToken})`);
            sendHeartbeats(cand);
          }
        });
      });
    }
  };

  // Kiểm tra election timeout định kỳ mỗi 20ms
  const checkElectionTick = () => {
    for (const st of states.values()) {
      if (!world.isUp(st.id) || st.role === 'leader') continue;
      if (world.nowMs - st.lastHeartbeatMs >= st.electionTimeoutMs) {
        startElection(st);
      }
    }
    if (world.nowMs < 520) world.scheduleAfter(20, checkElectionTick);
  };
  world.scheduleAt(20, checkElectionTick);

  // Hàm ghi qua Raft quorum
  const proposeWrite = (id: string, leaderId: ActorId, key: string, val: string | number) => {
    const start = world.nowMs;
    const leader = states.get(leaderId)!;
    if (leader.role !== 'leader') {
      world.recordOp({ id, client: clientA, op: 'write', key, value: null, start, end: start + 5, ok: false });
      return;
    }
    const entry: RaftLogEntry = {
      term: leader.term,
      index: leader.log.length + 1,
      key,
      value: val,
    };
    leader.log.push(entry);
    let acks = 1;
    let committed = false;
    const token = leader.fencingToken;

    for (const peerId of nodeIds) {
      if (peerId === leaderId) continue;
      world.sendMessage(leaderId, peerId, 'append', `Append(idx=${entry.index}, t=${entry.term})`, () => {
        const peer = states.get(peerId)!;
        if (entry.term < peer.term) return;
        if (entry.term > peer.term) stepDown(peer, entry.term);
        peer.lastHeartbeatMs = world.nowMs;
        peer.log.push({ ...entry });
        world.sendMessage(peerId, leaderId, 'append-ack', `Ack(idx=${entry.index})`, () => {
          if (committed || leader.term !== entry.term) return;
          acks += 1;
          if (acks >= majority) {
            committed = true;
            leader.commitIndex = Math.max(leader.commitIndex, entry.index);
            // Ghi sang Storage kèm fencing token
            world.sendMessage(leaderId, storageId, 'storage-write', `WRITE ${key}=${String(val)} (tok=${token})`, () => {
              if (cfg.useFencingToken !== false && token < storageMaxToken) {
                zombieWriteRejected = true;
                return;
              }
              storageMaxToken = Math.max(storageMaxToken, token);
              storageValue = val;
            });
            world.recordOp({
              id,
              client: clientA,
              op: 'write',
              key,
              value: val,
              start,
              end: world.nowMs,
              ok: true,
              meta: { term: entry.term, leader: leaderId, fencingToken: token },
            });
          }
        });
      });
    }

    world.scheduleAfter(90, () => {
      if (!committed) {
        world.milestone(leaderId, 'QUORUM_FAIL', `${leaderId} không đủ quorum (${acks}/${majority})`);
        world.recordOp({
          id,
          client: clientA,
          op: 'write',
          key,
          value: null,
          start,
          end: world.nowMs,
          ok: false,
          meta: { term: entry.term, leader: leaderId },
        });
      }
    });
  };

  // t=110ms: ghi thành công qua leader đầu tiên (N1, token=1)
  world.scheduleAt(110, () => {
    proposeWrite('w1', 'N1', 'cfg', 'v1');
  });

  // Nếu có partition cô lập N1 khỏi nhóm đa số (N2..Nk)
  if (cfg.partitionLeaderAtMs !== undefined) {
    world.scheduleAt(cfg.partitionLeaderAtMs, () => {
      for (const peerId of nodeIds.slice(1)) {
        world.partition('N1', peerId, true);
      }
    });

    // Sau khi nhóm đa số bầu leader mới (N2, token=2), client ghi v2 vào N2
    world.scheduleAt(cfg.partitionLeaderAtMs + 160, () => {
      const newLeader = [...states.values()].find((s) => s.id !== 'N1' && s.role === 'leader')?.id ?? 'N2';
      proposeWrite('w2', newLeader, 'cfg', 'v2');
    });

    // Thử ghi qua N1 đang bị cô lập => phải fail quorum!
    world.scheduleAt(cfg.partitionLeaderAtMs + 170, () => {
      proposeWrite('w_isolated', 'N1', 'cfg', 'stale_isolated');
    });
  }

  // Kiểm chứng fencing token khi gói tin trễ của leader cũ chạm trực tiếp Storage sau khi leader mới đã ghi token=2
  if (cfg.testFencingTokenAtMs !== undefined) {
    const staleSendAt = cfg.testFencingTokenAtMs;
    world.scheduleAt(staleSendAt, () => {
      const oldToken = states.get('N1')!.fencingToken || 1;
      world.sendMessage('N1', storageId, 'zombie-storage-write', `ZOMBIE WRITE (tok=${oldToken})`, () => {
        if (cfg.useFencingToken !== false && oldToken < storageMaxToken) {
          zombieWriteRejected = true;
          world.milestone(storageId, 'FENCING_REJECT', `Từ chối token cũ ${oldToken} < ${storageMaxToken}`);
        } else {
          storageValue = 'corrupted_by_zombie';
          world.milestone(storageId, 'ZOMBIE_OVERWRITE', `Ghi đè bởi leader cũ không có fencing!`);
        }
      });
    });
  }

  if (cfg.healAtMs !== undefined) {
    world.scheduleAt(cfg.healAtMs, () => {
      for (const peerId of nodeIds.slice(1)) {
        world.heal('N1', peerId, true);
      }
    });
  }

  const run = world.run(560);
  const snapshots: Record<ActorId, RaftNodeSnapshot> = {};
  for (const [id, st] of states) {
    snapshots[id] = {
      id,
      role: st.role,
      term: st.term,
      votedFor: st.votedFor,
      fencingToken: st.fencingToken,
      commitIndex: st.commitIndex,
      log: [...st.log],
    };
  }

  return {
    ...run,
    nodes: snapshots,
    storageValue,
    storageMaxToken,
    zombieWriteRejected,
  };
}

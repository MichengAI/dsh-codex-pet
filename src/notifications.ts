/** 多会话通知与真实交互适配；不打开后台会话、不替用户作决定。 */
import { IDLE, selectActivity, type Activity } from './model.ts';
import type { Sessions, Store } from './activity.ts';
export interface Question { id: string; question: string; detail?: string; options?: { label: string; description?: string }[]; multiSelect?: boolean }
export interface Answers { answers: { id: string; selected: string[]; custom?: string }[] }
export interface Pending {
  kind?: unknown; key?: string; sessionId?: string; toolName?: string; reason?: string;
  questions?: readonly Question[];
  answer?: (value: any) => Promise<void>;
}
export interface Notice extends Activity {
  id: string; token: string; updatedAt: number;
  request?: { key: string; kind: string; toolName?: string; reason?: string; questions?: readonly Question[] };
}
export interface NotificationState { items: Notice[]; activity: Activity; hidden: number }
export type NoticeCommand = { type: 'open'; id: string; token: string } | { type: 'dismiss'; id: string; token: string } | { type: 'approve' | 'reject' | 'answer'; id: string; token: string; requestKey: string; answers?: Answers } | { type: 'stop'; id: string; token: string } | { type: 'restore' };
type RecordState = { round: number; running: boolean; completion: boolean; error: string | null; revision: number; updatedAt: number; lastPose: string; requestKey?: string; awaitingStart?: boolean; finished?: string; snapshotError?: string | null };
const priority: Record<string, number> = { waiting: 0, failed: 1, review: 2, running: 3 };
const lifetime: Record<string, number> = { failed: 3600000, waiting: 86400000, review: 604800000 };
export function validateAnswers(questions: readonly Question[], value: Answers | undefined): Answers {
  if (!value || !Array.isArray(value.answers) || value.answers.length !== questions.length) throw new Error('请回答所有问题');
  const ids = new Set<string>();
  for (const answer of value.answers) {
    const question = questions.find(q => q.id === answer.id);
    if (!question || ids.has(answer.id) || !Array.isArray(answer.selected)) throw new Error('问题已变化，请重新回答');
    ids.add(answer.id);
    if (new Set(answer.selected).size !== answer.selected.length || answer.selected.some(label => !question.options?.some(option => option.label === label))) throw new Error('选项无效');
    if (answer.custom !== undefined && (typeof answer.custom !== 'string' || answer.custom.length > 10000)) throw new Error('回答过长');
    if (!answer.selected.length && !answer.custom?.trim()) throw new Error('请回答所有问题');
    if (!question.multiSelect && (answer.selected.length > 1 || (answer.selected.length > 0 && !!answer.custom?.trim()))) throw new Error('单选问题只能提交一种回答');
  }
  return value;
}
export function createNotifications(sessions: Sessions, pending: Store<ReadonlyMap<string, Pending>>, notify: (state: NotificationState) => void, now = Date.now) {
  const records = new Map<string, RecordState>();
  const bindings = new Map<string, { binding: NonNullable<ReturnType<Sessions['binding']>>; off: () => void }>();
  const dismissed = new Map<string, string>();
  const busy = new Set<string>();
  const answered = new Set<string>();
  let state: NotificationState = { items: [], activity: IDLE, hidden: 0 }, latestFirst = false;
  let publishing = false;
  let lastPublished = '';
  const publish = () => {
    if (publishing) return;
    publishing = true;
    try {
      const list = sessions.list.getSnapshot(), requests = pending.getSnapshot();
      // 子代理由宿主路由管理，不能作为独立通知绑定或操作。
      const ids = new Set(list.ids.filter(id => list.byId[id] && list.byId[id].origin !== 'subagent'));
      for (const id of records.keys()) if (!ids.has(id)) { records.delete(id); dismissed.delete(id); }
      for (const [id, bound] of bindings) if (!ids.has(id)) { bound.off(); bindings.delete(id); records.delete(id); dismissed.delete(id); }
      const items: Notice[] = []; let hidden = 0;
      for (const id of ids) {
        const row = list.byId[id]; if (!row) continue;
        const binding = sessions.binding(id);
        let record = records.get(id);
        if (!record) { record = { round: 0, running: row.running, completion: !!row.completed, error: null, revision: binding?.eventSource.getSnapshot().revision ?? -1, updatedAt: row.updatedAt ?? now(), lastPose: '' }; records.set(id, record); }
        const previous = bindings.get(id);
        if (binding && (previous?.binding.session !== binding.session || previous.binding.eventSource !== binding.eventSource)) {
          previous?.off();
          record.revision = binding.eventSource.getSnapshot().revision;
          const offSession = binding.session.subscribe(publish), offEvents = binding.eventSource.subscribe(publish);
          bindings.set(id, { binding, off: () => { offSession(); offEvents(); } });
        }
        const snapshot = binding?.session.getSnapshot();
        // 当前详细快照为准；后台 running 使用持续更新的列表，避免冷快照覆盖它。
        const running = id === list.current ? snapshot?.running ?? row.running : row.running;
        if (running && !record.running) { record.round++; record.awaitingStart = true; record.finished = undefined; record.completion = false; record.error = null; record.updatedAt = now(); }
        const events = binding?.eventSource.getSnapshot();
        if (events && record.revision !== events.revision) {
          record.revision = events.revision;
          if (events.change.kind === 'append') for (const entry of events.change.entries) {
            if (entry.type !== 'event') continue;
            if (entry.event.type === 'turn/start') { if (!record.awaitingStart) record.round++; record.awaitingStart = false; record.finished = undefined; record.completion = false; record.error = null; }
            if (entry.event.type === 'turn/end') { record.finished = entry.event.data?.reason?.kind; record.completion = record.finished === 'completed'; record.updatedAt = now(); }
          }
        }
        record.running = running;
        if (snapshot?.lastAgentError && snapshot.lastAgentError !== record.snapshotError) record.error = snapshot.lastAgentError;
        record.snapshotError = snapshot?.lastAgentError;
        if (row.completed && !running && (!record.finished || record.finished === 'completed')) record.completion = true;
        const request = requests.get(id);
        const activity = selectActivity([{ id, title: row.title ?? row.displayTitle, running, waiting: !!request, error: running ? null : record.error, completed: !running && record.completion }]);
        if (activity.pose === 'idle') continue;
        if ((record.lastPose && record.lastPose !== activity.pose) || record.requestKey !== request?.key) record.updatedAt = now();
        record.lastPose = activity.pose; record.requestKey = request?.key;
        const token = `${record.round}:${request?.key ?? ''}`;
        if (dismissed.get(id) === token) { hidden++; continue; }
        const ttl = lifetime[activity.pose]; if (ttl && now() - record.updatedAt >= ttl) continue;
        items.push({ ...activity, id, token, updatedAt: record.updatedAt, request: request && typeof request.key === 'string' ? { key: request.key, kind: String(request.kind), toolName: request.toolName, reason: request.reason, questions: request.questions } : undefined });
      }
      items.sort((a, b) => (latestFirst ? 0 : priority[a.pose] - priority[b.pose]) || b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
      state = { items, hidden, activity: items[0] ?? IDLE };
      const signature = JSON.stringify(state);
      if (signature !== lastPublished) { lastPublished = signature; notify(state); }
    } finally { publishing = false; }
  };
  const offList = sessions.list.subscribe(publish), offPending = pending.subscribe(publish);
  publish(); const timer = setInterval(publish, 1000);
  return {
    getSnapshot: () => state,
    sort(latest: boolean) { latestFirst = latest; publish(); },
    async command(command: NoticeCommand): Promise<void> {
      if (command.type === 'restore') { dismissed.clear(); publish(); return; }
      const item = state.items.find(item => item.id === command.id && item.token === command.token);
      if (!item) throw new Error('这条通知已更新，请使用最新通知');
      if (command.type === 'dismiss') { dismissed.set(item.id, item.token); publish(); return; }
      if (command.type === 'open') { sessions.open(item.id); if (item.pose === 'review') dismissed.set(item.id, item.token); publish(); return; }
      if (command.type === 'stop') {
        if (item.pose !== 'running') throw new Error('任务状态已变化');
        const session = sessions.binding(item.id)?.session;
        if (!session?.cancel) throw new Error('宿主未提供停止任务能力');
        if (busy.has(item.id)) throw new Error('正在提交，请勿重复操作');
        busy.add(item.id);
        try { const result = await session.cancel(); if (!result.ok) throw new Error(result.error?.message ?? '停止失败'); } finally { busy.delete(item.id); }
        return;
      }
      const request = pending.getSnapshot().get(item.id);
      if (!request || request.key !== command.requestKey || request.sessionId && request.sessionId !== item.id || !request.answer) throw new Error('请求已结束或已更换，请查看最新会话');
      if (answered.has(request.key!)) throw new Error('该请求已经提交');
      if (busy.has(item.id)) throw new Error('正在提交，请勿重复操作');
      let answer: unknown;
      if (request.kind === 'approval' && (command.type === 'approve' || command.type === 'reject')) answer = command.type === 'approve' ? 'allowed-once' : 'rejected';
      else if ((request.kind === 'question' || request.kind === 'plan-review') && command.type === 'answer') answer = validateAnswers(request.questions ?? [], command.answers);
      else throw new Error('此请求不支持该操作');
      busy.add(item.id);
      try { await request.answer(answer); answered.add(request.key!); } finally { busy.delete(item.id); publish(); }
    },
    dispose() { offList(); offPending(); clearInterval(timer); for (const value of bindings.values()) value.off(); bindings.clear(); },
  };
}

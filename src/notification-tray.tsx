import { ChevronDownIcon, Cross2Icon, ResetIcon, MixerHorizontalIcon, QuestionMarkCircledIcon, StopIcon } from '@radix-ui/react-icons';
/** Web 与原生浮窗共用的会话通知列表；所有提交都携带原请求身份。 */
import React, { useState } from 'react';
import type { Answers, Notice, NoticeCommand, NotificationState } from './notifications.ts';
export type TrayCommand = NoticeCommand | { type: 'sort'; latest: boolean };
export interface TrayProps { state: NotificationState; command(value: TrayCommand): Promise<void> }
function RequestForm({ item, command }: { item: Notice; command: TrayProps['command'] }) {
  const [answers, setAnswers] = useState<Answers>({ answers: (item.request?.questions ?? []).map(q => ({ id: q.id, selected: [] })) });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const request = item.request!;
  const run = async (value: TrayCommand) => { setBusy(true); setError(''); try { await command(value); } catch (e) { setError(e instanceof Error ? e.message : '提交失败'); } finally { setBusy(false); } };
  const base = { id: item.id, token: item.token, requestKey: request.key };
  return <div className="dcp-request">
    {request.kind === 'approval' ? <>
      <strong>{request.toolName ?? '工具审批'}</strong><p>{request.reason ?? '此工具需要你的批准。'}</p>
      <button disabled={busy} onClick={() => void run({ ...base, type: 'reject' })}>拒绝</button>
      <button disabled={busy} onClick={() => void run({ ...base, type: 'approve' })}>仅允许一次</button>
    </> : request.questions ? <form onSubmit={event => { event.preventDefault(); void run({ ...base, type: 'answer', answers }); }}>
      {request.questions.map((q, index) => <fieldset key={q.id} disabled={busy}><legend>{q.question}</legend>
        {q.detail && <pre>{q.detail}</pre>}
        {q.options?.map(option => <label key={option.label}><input type={q.multiSelect ? 'checkbox' : 'radio'} name={q.id} checked={answers.answers[index].selected.includes(option.label)} onChange={event => setAnswers(old => ({ answers: old.answers.map((a, i) => i !== index ? a : { ...a, custom: q.multiSelect ? a.custom : '', selected: q.multiSelect ? event.target.checked ? [...a.selected, option.label] : a.selected.filter(v => v !== option.label) : [option.label] }) }))} />{option.label}{option.description && <small>{option.description}</small>}</label>)}
        <textarea aria-label={`${q.question}：文字回答`} value={answers.answers[index].custom ?? ''} maxLength={10000} placeholder="输入回答或补充说明" onChange={event => setAnswers(old => ({ answers: old.answers.map((a, i) => i !== index ? a : { ...a, selected: q.multiSelect ? a.selected : [], custom: event.target.value }) }))} />
      </fieldset>)}<button disabled={busy} type="submit">提交回答</button>
    </form> : <p>请打开会话处理此请求。</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
export function NotificationTray({ state, command }: TrayProps) {
  const [expanded, setExpanded] = useState(false), [detail, setDetail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [latest, setLatest] = useState(false);
  const run = async (value: TrayCommand) => { setError(''); try { await command(value); } catch (e) { setError(e instanceof Error ? e.message : '操作失败'); } };
  const visible = expanded ? state.items : state.items.slice(0, 1);
  if (state.items.length === 0) return null;
  return <section className="dcp-tray" aria-label="宠物会话通知">
    {state.items.length > 1 && <header className="dcp-tray-toolbar"><button className="dcp-tray-toggle" aria-label={expanded ? '收起会话' : '展开会话'} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><span>会话</span><span className="dcp-tray-count">{state.items.length}</span><ChevronDownIcon className={expanded ? 'is-expanded' : ''} /></button>
      {expanded && state.items.length > 1 && <button className="dcp-tray-sort" aria-label="最新优先" aria-pressed={latest} title={latest ? '最新活动优先' : '待处理事项优先'} onClick={() => { setLatest(!latest); void run({ type: 'sort', latest: !latest }); }}><MixerHorizontalIcon /></button>}
    </header>}
    <div className="dcp-notice-list" role="list">
      {visible.map(item => <article role="listitem" key={item.id} data-status={item.pose}>
        <button className="dcp-notice-dismiss" aria-label={`关闭通知：${item.title}`} title="关闭本轮提醒，任务继续运行" onClick={() => void run({ type: 'dismiss', id: item.id, token: item.token })}><Cross2Icon /></button>
        <div className="dcp-notice-card">
          <button className="dcp-bubble-link" title={item.title} onClick={() => void run({ type: 'open', id: item.id, token: item.token })}><strong>{item.title}</strong><span>{item.text}</span></button>
          <div className="dcp-notice-actions">
            {item.request ? <button className="dcp-notice-action" aria-label={`处理请求：${item.title}`} title="查看并处理" aria-expanded={detail === item.request.key} onClick={() => { setExpanded(true); setDetail(detail === item.request!.key ? null : item.request!.key); }}><QuestionMarkCircledIcon /></button> : <button className="dcp-notice-action" aria-label={`回复会话：${item.title}`} title="打开会话回复" onClick={() => void run({ type: 'open', id: item.id, token: item.token })}><ResetIcon /></button>}
            {item.pose === 'running' && <button className="dcp-notice-action" aria-label={`停止当前轮次：${item.title}`} title="停止当前轮次" onClick={() => void run({ type: 'stop', id: item.id, token: item.token })}><StopIcon /></button>}
          </div>
        </div>
        {item.request && detail === item.request.key && <RequestForm key={item.request.key} item={item} command={command} />}
      </article>)}
    </div>
    {!expanded && state.items.length > 1 && <button onClick={() => setExpanded(true)}>还有 {state.items.length - 1} 个会话</button>}
    {expanded && state.hidden > 0 && <button onClick={() => void run({ type: 'restore' })}>恢复 {state.hidden} 条已关闭通知</button>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
export const trayStyles = `.dcp-tray{pointer-events:auto;position:absolute;right:var(--tray-right,0);left:var(--tray-left,auto);top:var(--tray-top,auto);bottom:var(--tray-bottom,calc(100% + 12px));width:min(296px,calc(100vw - 24px));max-height:var(--tray-height,360px);display:flex;flex-direction:column;overflow:auto;background:var(--pet-card);color:var(--pet-text);border:1px solid var(--pet-line);border-radius:16px;padding:10px;box-shadow:0 6px 28px #0003;font-size:12px}.dcp-tray header,.dcp-notice-heading{display:flex;justify-content:space-between;gap:6px;align-items:center}.dcp-tray article{border-top:1px solid var(--pet-line);padding:8px 0}.dcp-tray button{border-radius:7px;padding:6px!important;white-space:normal;text-align:left}.dcp-tray strong,.dcp-tray span{display:block;overflow-wrap:anywhere}.dcp-tray span,.dcp-tray small{color:var(--pet-muted)}.dcp-tray .dcp-bubble-link{min-width:0;flex:1}.dcp-tray fieldset{min-width:0;border:1px solid var(--pet-line);margin:8px 0;padding:8px}.dcp-tray label{display:block}.dcp-tray label small{display:block;padding-left:20px}.dcp-tray textarea,.dcp-tray select{width:100%;box-sizing:border-box;background:var(--pet-bg);color:var(--pet-text);border:1px solid var(--pet-line);padding:7px;border-radius:6px;font:inherit;margin:5px 0}.dcp-tray textarea{min-height:54px;resize:vertical}.dcp-tray pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;max-height:180px;overflow:auto}.dcp-tray [role=alert]{color:#ef6565}.dcp-tray button:focus-visible,.dcp-tray input:focus-visible{outline:2px solid #4f8fff;outline-offset:2px}`;

// 按 Codex 原版胶囊通知布局，操作仅保留圆形图标，独立关闭钮位于左上角。
export const polishedTrayStyles = `
.dcp-tray{width:min(224px,calc(100vw - 24px));padding:6px;background:transparent;border:0;border-radius:0;box-shadow:none;overflow:auto;scrollbar-width:none;font-family:inherit}
.dcp-tray .dcp-tray-toolbar{min-height:24px;padding:0 3px 3px;gap:8px}
.dcp-tray .dcp-tray-toggle{display:flex;align-items:center;gap:6px;padding:3px 5px!important;color:var(--pet-muted);font-size:11px}.dcp-tray .dcp-tray-count{font-size:10px}.dcp-tray .dcp-tray-toggle svg{width:12px;height:12px;opacity:.65}.dcp-tray .dcp-tray-toggle svg.is-expanded{transform:rotate(180deg)}
.dcp-tray .dcp-tray-sort{display:flex;align-items:center;justify-content:center;width:24px;height:24px;padding:5px!important;color:var(--pet-muted)}.dcp-tray-sort[aria-pressed=true]{background:color-mix(in srgb,var(--pet-text) 9%,transparent)}
.dcp-tray article{position:relative;padding:0;border:0;margin:5px 0 10px}.dcp-tray article:last-child{margin-bottom:0}
.dcp-tray .dcp-notice-card{display:flex;align-items:center;gap:5px;min-height:54px;padding:7px 10px 7px 19px;border-radius:28px;border:1px solid color-mix(in srgb,var(--pet-text) 14%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--pet-text) 2%,transparent),transparent),var(--pet-card);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--pet-text) 8%,transparent),0 5px 12px #0003}
.dcp-tray .dcp-bubble-link{display:block;min-width:0;flex:1;padding:0!important;border-radius:4px;line-height:1.35}.dcp-tray .dcp-bubble-link:hover{background:transparent}.dcp-tray .dcp-bubble-link strong{font-size:12px;font-weight:600;line-height:1.4;color:var(--pet-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dcp-tray .dcp-bubble-link>span{font-size:11px;line-height:1.4;margin-top:1px;color:var(--pet-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dcp-tray .dcp-notice-actions{display:flex;align-items:center;flex-shrink:0;gap:6px}.dcp-tray .dcp-notice-action{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:28px;height:28px;padding:6px!important;border-radius:50%;background:color-mix(in srgb,var(--pet-text) 8%,transparent);color:var(--pet-muted)}.dcp-tray .dcp-notice-action svg{width:15px;height:15px}.dcp-tray .dcp-notice-action:hover{background:color-mix(in srgb,var(--pet-text) 15%,transparent);color:var(--pet-text)}
.dcp-tray .dcp-notice-dismiss{position:absolute;z-index:1;left:-3px;top:-3px;display:flex;align-items:center;justify-content:center;width:19px;height:19px;padding:4px!important;border-radius:50%;border:1px solid color-mix(in srgb,var(--pet-text) 22%,transparent);background:var(--pet-bg);color:var(--pet-muted)}.dcp-tray .dcp-notice-dismiss svg{width:10px;height:10px}.dcp-tray .dcp-notice-dismiss:hover{background:var(--pet-card);color:var(--pet-text)}
.dcp-tray .dcp-request{margin-top:7px;padding:10px;background:var(--pet-card);border:1px solid var(--pet-line);border-radius:14px}.dcp-tray .dcp-request p{overflow-wrap:anywhere}.dcp-tray .dcp-request button{background:color-mix(in srgb,var(--pet-text) 6%,transparent);margin:3px}
`;

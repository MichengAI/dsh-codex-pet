/** 只替代外部模型 HTTP 服务；会话、工具执行、交互与通知仍走真实 DSH。 */
import { createServer } from 'node:http';

const COMPLETE = '端到端测试完成：这是本地模型夹具，没有生成图片。';
const WAITING = '模型正在等待停止';
const QUESTION = { questions: [{ id: 'pet-color', question: '请选择回归测试配色', options: [{ label: '蓝色' }, { label: '绿色' }] }] };

function protocolOf(url) {
  const path = (url ?? '').split('?')[0];
  if (path.endsWith('/chat/completions')) return 'chat';
  if (path.endsWith('/messages')) return 'messages';
  return undefined;
}

function toolName(tool) {
  return tool?.name ?? tool?.function?.name;
}

function writeEvent(res, event) {
  res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

function openMessages(res) {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
  writeEvent(res, { type: 'message_start', message: { usage: { input_tokens: 1, output_tokens: 0 } } });
}

function finishMessages(res, stopReason) {
  writeEvent(res, { type: 'message_delta', delta: { stop_reason: stopReason }, usage: { output_tokens: 1 } });
  writeEvent(res, { type: 'message_stop' });
  res.end();
}

export async function startModelFixture() {
  const requests = [];
  const pending = [];
  const server = createServer(async (req, res) => {
    const protocol = protocolOf(req.url);
    if (req.method !== 'POST' || !protocol) {
      res.writeHead(404); res.end(); return;
    }
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const record = { body, closed: false, protocol };
      requests.push(record);
      res.once('close', () => { record.closed = true; });
      pending.push({ res, body, protocol });
    } catch (error) {
      res.writeHead(400); res.end(String(error));
    }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  function respond(mode) {
    const item = pending.shift();
    if (!item) throw new Error('没有等待中的模型请求');
    const { res, body, protocol } = item;
    if (mode === 'error') {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { message: '端到端测试故障', type: 'invalid_request_error', code: 'e2e_failure' } }));
      return;
    }
    if (protocol === 'messages') {
      openMessages(res);
      if (mode === 'question') {
        const tool = body.tools?.find(entry => toolName(entry) === 'ask_user_question');
        if (!tool) throw new Error(`DSH 未提供提问工具：${body.tools?.map(toolName).join(',')}`);
        writeEvent(res, { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'e2e-question', name: toolName(tool), input: QUESTION } });
        writeEvent(res, { type: 'content_block_stop', index: 0 });
        finishMessages(res, 'tool_use');
        return;
      }
      writeEvent(res, { type: 'content_block_start', index: 0, content_block: { type: 'text', text: COMPLETE } });
      writeEvent(res, { type: 'content_block_stop', index: 0 });
      finishMessages(res, 'end_turn');
      return;
    }
    let delta, reason;
    if (mode === 'question') {
      const tool = body.tools?.find(entry => toolName(entry) === 'ask_user_question');
      if (!tool) throw new Error(`DSH 未提供提问工具：${body.tools?.map(toolName).join(',')}`);
      delta = { role: 'assistant', tool_calls: [{ index: 0, id: 'e2e-question', type: 'function', function: {
        name: toolName(tool),
        arguments: JSON.stringify(QUESTION),
      } }] };
      reason = 'tool_calls';
    } else {
      delta = { role: 'assistant', content: COMPLETE };
      reason = 'stop';
    }
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
    const write = (delta, finish_reason) => res.write(`data: ${JSON.stringify({ id: 'e2e-chat', object: 'chat.completion.chunk', created: 1, model: body.model, choices: [{ index: 0, delta, finish_reason }] })}\n\n`);
    write(delta, null);
    write({}, reason);
    res.end('data: [DONE]\n\n');
  }
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    requests,
    respond,
    startStream() {
      const item = pending[0];
      if (!item) throw new Error('没有等待中的模型请求');
      if (item.protocol === 'messages') {
        openMessages(item.res);
        writeEvent(item.res, { type: 'content_block_start', index: 0, content_block: { type: 'text', text: WAITING } });
        return;
      }
      item.res.writeHead(200, { 'content-type': 'text/event-stream' });
      item.res.write(`data: ${JSON.stringify({ id: 'e2e-stream', object: 'chat.completion.chunk', created: 1, model: item.body.model, choices: [{ index: 0, delta: { role: 'assistant', content: WAITING }, finish_reason: null }] })}\n\n`);
    },
    async close() {
      server.closeAllConnections();
      await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
    },
  };
}

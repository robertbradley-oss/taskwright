import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {createExternalRun, runExternal} from '../engine/external-agent.js';
import {offlineDecision} from '../examples/external-agent/agent.mjs';
import {hash} from '../engine/scenario.js';

async function setup(mode = 'offline') {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskwright-external-'));
  // Copy to a separate directory: example must not depend on relative engine imports.
  const entrypoint = path.join(dir, 'agent.mjs');
  await copyFile(fileURLToPath(new URL(`../examples/external-agent/${['offline', 'model'].includes(mode) ? 'agent' : 'fault-agent'}.mjs`, import.meta.url)), entrypoint);
  const run = createExternalRun({agentId: `test-${mode}`, sourceHash: createHash('sha256').update(await readFile(entrypoint)).digest('hex'),
    instructions: 'Read product and policy guidance. Advise only; no handoff is authorized.',
    model: mode === 'model' ? 'mock-model' : null, allowedTools: ['search_documents', 'read_document']});
  const options = {command: process.execPath, args: [entrypoint, mode], sourceFile: entrypoint, cwd: dir, env: {}};
  return {dir, run, options};
}
test('independent process retrieves documents and persists unchanged structural grading', async () => {
  const f = await setup(); await runExternal(f.run, f.options, f.dir);
  assert.equal(f.run.status, 'completed'); assert.equal(f.run.mode, 'external'); assert.equal(f.run.fixture, null);
  assert.equal(f.run.evaluation.outcome, 'uncertain');
  assert.ok(f.run.evaluation.criteria.filter(c => c.scope === 'deterministic').every(c => c.outcome === 'pass'));
  assert.equal(f.run.trace.filter(e => e.kind === 'tool_result').length, 2);
  assert.deepEqual(JSON.parse(await readFile(path.join(f.dir, `${f.run.id}.json`), 'utf8')), f.run);
  await assert.rejects(runExternal(f.run, f.options, f.dir), /already executed/);
});
for (const [mode, stage] of [['malformed', 'response_json'], ['identity', 'response_envelope'], ['schema', 'action_schema'], ['unauthorized', 'tool_authority'], ['exit', 'process_exit'], ['overflow', 'output_limit']]) {
  test(`real external ${mode} failure is retained without executing an action`, async () => {
    const f = await setup(mode); await runExternal(f.run, f.options, f.dir);
    assert.equal(f.run.status, 'error'); assert.equal(f.run.final, null);
    assert.equal(f.run.trace.some(e => e.kind === 'tool_result' && e.tool === 'record_escalation'), false);
    assert.equal(f.run.trace.filter(e => e.kind === 'tool_result').length, mode === 'unauthorized' ? 2 : 0);
    const d = f.run.executionDiagnostics[0]; assert.equal(d.stage, stage);
    const {hash: seal, ...record} = d; assert.equal(hash(record), seal);
    assert.ok(Buffer.from(d.stdout.base64, 'base64').length <= 8192);
    assert.equal(f.run.evaluation.outcome, 'execution_error');
    assert.deepEqual(JSON.parse(await readFile(path.join(f.dir, `${f.run.id}.json`), 'utf8')).executionDiagnostics, f.run.executionDiagnostics);
  });
}
test('timeout, cancellation and unavailable executable remain distinct', async () => {
  const timed = await setup('hang'); timed.run.limits.elapsedMs = 150;
  await runExternal(timed.run, timed.options, timed.dir); assert.equal(timed.run.status, 'timed_out');
  const cancelled = await setup('hang'), controller = new AbortController();
  const pending = runExternal(cancelled.run, cancelled.options, cancelled.dir, controller.signal);
  setTimeout(() => controller.abort(), 150); await pending; assert.equal(cancelled.run.status, 'cancelled');
  const missing = await setup(); missing.options.command = path.join(missing.dir, 'no-such-program');
  await runExternal(missing.run, missing.options, missing.dir); assert.equal(missing.run.executionDiagnostics[0].stage, 'process_start');
});
test('permission contract mutation fails before launching', async () => {
  const f = await setup(); f.run.externalContract.allowedTools.push('record_escalation');
  await assert.rejects(runExternal(f.run, f.options, f.dir), /changed/);
  const source = await setup(); source.run.agent.sourceHash = '0'.repeat(64);
  await assert.rejects(runExternal(source.run, source.options, source.dir), /source hash/);
});
test('model-backed standalone process completes an HTTP tool loop with a mock provider', async t => {
  const seen = [];
  const server = createServer(async (req, res) => {
    let text = ''; for await (const chunk of req) text += chunk;
    const body = JSON.parse(text), input = JSON.parse(body.messages[1].content);
    seen.push({body, input, authorization: req.headers.authorization});
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({choices: [{message: {content: JSON.stringify(offlineDecision(input))}}]}));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const f = await setup('model'); f.options.env = {OPENAI_API_KEY: 'test-secret-only', TASKWRIGHT_MODEL: 'mock-model', TASKWRIGHT_CHAT_URL: `http://127.0.0.1:${server.address().port}/v1/chat/completions`};
  await runExternal(f.run, f.options, f.dir);
  assert.equal(f.run.status, 'completed'); assert.equal(seen.length, 3);
  for (const {body, input, authorization} of seen) {
    assert.equal(body.model, 'mock-model'); assert.equal(authorization, 'Bearer test-secret-only');
    assert.equal(input.tools.record_escalation, undefined); assert.equal(input.evaluation, undefined);
    assert.equal(input.executionDiagnostics, undefined); assert.equal(input.evaluationSpec, undefined);
  }
  assert.equal(JSON.stringify(f.run).includes('test-secret-only'), false);
});
test('provider errors do not expose response bodies or credentials in diagnostics', async t => {
  const server = createServer((req, res) => { req.resume(); res.writeHead(401); res.end('secret-provider-body'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const f = await setup('model'); f.options.env = {OPENAI_API_KEY: 'test-secret-only', TASKWRIGHT_MODEL: 'mock', TASKWRIGHT_CHAT_URL: `http://127.0.0.1:${server.address().port}/v1/chat/completions`};
  await runExternal(f.run, f.options, f.dir);
  assert.equal(f.run.executionDiagnostics[0].stage, 'process_exit');
  assert.match(f.run.executionDiagnostics[0].stderr.text, /Provider HTTP 401/);
  assert.equal(/secret-provider-body|test-secret-only/.test(JSON.stringify(f.run)), false);
});
test('malformed model text reaches host diagnostics without repair or a replacement call', async t => {
  let calls = 0;
  const rejected = 'I cannot produce JSON <rejected>';
  const server = createServer((req, res) => { calls++; req.resume(); res.end(JSON.stringify({choices: [{message: {content: rejected}}]})); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const f = await setup('model'); f.options.env = {OPENAI_API_KEY: 'test-secret-only', TASKWRIGHT_MODEL: 'mock', TASKWRIGHT_CHAT_URL: `http://127.0.0.1:${server.address().port}/v1/chat/completions`};
  await runExternal(f.run, f.options, f.dir);
  assert.equal(calls, 1); assert.equal(f.run.executionDiagnostics[0].stage, 'response_json');
  assert.ok(f.run.executionDiagnostics[0].stdout.text.includes(rejected));
});

import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createExternalRun, runExternal} from '../engine/external-agent.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2] || 'demo';
if (!['demo', 'model'].includes(mode)) throw Error('Usage: node scripts/run-external-agent.mjs [demo|model]');
if (mode === 'model' && (!process.env.OPENAI_API_KEY || !process.env.TASKWRIGHT_MODEL)) throw Error('Set OPENAI_API_KEY and TASKWRIGHT_MODEL before model execution');
const dir = path.join(root, 'output', 'external-agent', randomUUID());
await mkdir(dir, {recursive: true});
const rows = [];
for (const kind of mode === 'demo' ? ['offline', 'malformed', 'unauthorized'] : ['model']) {
  const entrypoint = path.join(root, 'examples', 'external-agent', ['offline', 'model'].includes(kind) ? 'agent.mjs' : 'fault-agent.mjs');
  const sourceHash = createHash('sha256').update(await readFile(entrypoint)).digest('hex');
  const run = createExternalRun({agentId: `standalone-${kind}`, sourceHash,
    model: kind === 'model' ? process.env.TASKWRIGHT_MODEL : null,
    instructions: 'Help with the owned printer using applicable retrieved product and policy evidence. Do not reset while jobs are processing. This workspace permits advice only; no handoff is authorized.',
    allowedTools: ['search_documents', 'read_document']});
  const env = {};
  // Windows needs system paths for some runtimes; never inherit the full environment.
  for (const key of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP']) if (process.env[key]) env[key] = process.env[key];
  if (kind === 'model') for (const key of ['OPENAI_API_KEY', 'TASKWRIGHT_MODEL', 'TASKWRIGHT_CHAT_URL']) if (process.env[key]) env[key] = process.env[key];
  await runExternal(run, {command: process.execPath, args: [entrypoint, kind], sourceFile: entrypoint, cwd: path.dirname(entrypoint), env}, dir);
  if (mode === 'demo') {
    assert.equal(run.status, kind === 'offline' ? 'completed' : 'error');
    assert.equal(run.trace.filter(e => e.kind === 'tool_result' && e.ok && e.tool === 'record_escalation').length, 0);
    if (kind === 'offline') assert.ok(run.evaluation.criteria.filter(c => c.scope === 'deterministic').every(c => c.outcome === 'pass'));
    else assert.equal(run.executionDiagnostics[0].stage, kind === 'malformed' ? 'response_json' : 'tool_authority');
  }
  rows.push({kind, run});
}
const report = {version: 1, kind: 'external-integration', mode,
  scope: mode === 'demo' ? 'Real child processes; deterministic reference and injected faults; no model calls' : 'Fresh external model execution; no semantic judge invoked',
  selection: 'not a configuration comparison', review: 'Structural grading only; reply meaning remains unreviewed', rows};
await writeFile(path.join(dir, 'report.json'), JSON.stringify(report, null, 2), {flag: 'wx'});
console.log(JSON.stringify({report: path.join(dir, 'report.json'), rows: rows.map(({kind, run}) => ({kind, status: run.status, failure: run.executionDiagnostics[0]?.stage || null, grade: run.evaluation.outcome}))}, null, 2));
if (mode === 'model' && rows.some(({run}) => run.status !== 'completed')) process.exitCode = 1;

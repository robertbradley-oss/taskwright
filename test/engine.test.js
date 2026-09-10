import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRun,runAgent,replayAdapter,readRun,recoverRuns,saveRun,executeTool } from '../engine/runner.js';
import { goodFinal } from '../engine/scenario.js';
import { evaluateRun } from '../engine/evaluate.js';
import { reassess,assessments } from '../engine/assessments.js';
const root=await mkdtemp(path.join(tmpdir(),'taskwright-tests-'));
async function trial(fixture){const run=createRun('replay',fixture);await runAgent(run,replayAdapter(fixture),root);return run;}
test('supported run retains source versions, trace and uncertain prose after disk reload',async()=>{
 const run=await trial('supported');assert.equal(run.status,'completed');assert.equal(run.evaluation.outcome,'uncertain');assert.equal(run.evaluation.criteria.filter(c=>c.outcome==='pass').length,4);
 assert.deepEqual(await readRun(root,run.id),run);assert.equal(run.scenarioHash.length,64);assert.equal(run.trace.length,9);
});
test('wrong model, policy commitment and missing action fail distinct criteria',async()=>{
 for(const [fixture,criterion]of [['wrong_model','model'],['overpromise','policy'],['missing_handoff','handoff']]){const run=await trial(fixture);assert.equal(run.evaluation.outcome,'fail');assert.equal(run.evaluation.criteria.find(c=>c.id===criterion).outcome,'fail');}
});
test('negation and ambiguity never receive semantic pass from keyword matching',async()=>{
 for(const name of ['negated_promise','ambiguous'])assert.equal((await trial(name)).evaluation.criteria.find(c=>c.id==='writing').outcome,'uncertain');
});
test('dishonest structured claims cannot certify contradictory prose',async()=>{
 const run=createRun('replay');const adapter=replayAdapter('supported');const next=adapter.next;adapter.next=async()=>{const a=await next();if(a.type==='final')a.reply='Hold the wireless button and support guarantees a free exchange.';return a;};await runAgent(run,adapter,root);assert.equal(run.evaluation.outcome,'uncertain');
});
test('unknown tools, unknown documents and malformed output are execution errors',async()=>{
 for(const name of ['unknown_document','unknown_tool','malformed']){const run=await trial(name);assert.equal(run.status,'error');assert.equal(run.evaluation.outcome,'execution_error');}
});
test('timeout is bounded and persisted separately from a failed task',async()=>{const run=await trial('timeout');assert.equal(run.status,'timed_out');assert.equal(run.evaluation.outcome,'execution_error');});
test('cancellation closes pending adapter and records no success',async()=>{
 const run=createRun('replay');const abort=new AbortController();let closed=false;const pending=runAgent(run,{next:()=>new Promise(()=>{}),close:()=>closed=true},root,abort.signal);setTimeout(()=>abort.abort(),30);await pending;assert.equal(run.status,'cancelled');assert.equal(closed,true);
});
test('step and output limits stop a runaway adapter',async()=>{
 const run=createRun('replay');run.limits.steps=2;await runAgent(run,{next:async()=>({type:'tool',tool:'search_documents',args:{query:'L4'}})},root);assert.equal(run.error,'Step limit exceeded');
 const big=createRun('replay');await runAgent(big,{next:async()=>({...goodFinal,reply:'x'.repeat(9000)})},root);assert.match(big.error,/output limit/);
});
test('restart recovery marks active records interrupted without overwriting completed records',async()=>{
 const done=await trial('supported');const queued=createRun('replay');await saveRun(root,queued);await recoverRuns(root);assert.equal((await readRun(root,queued.id)).status,'interrupted');assert.deepEqual(await readRun(root,done.id),done);
});
test('escalation rejects unobserved references and arbitrary payload fields',()=>{
 const run=createRun('replay');assert.throws(()=>executeTool(run,{tool:'record_escalation',args:{reason:'request',evidence_ids:['policy']}}),/previously read/);
 assert.throws(()=>executeTool(run,{tool:'read_document',args:{document_id:'usb',path:'secret'}}),/Invalid/);
});
test('known full model names match, different model names still fail',()=>{
 for(const model of ['L4 USB','Vale L4 USB','Vale Label Printer L4 USB']){const run=createRun('replay');run.status='completed';run.final={...goodFinal,model};assert.equal(evaluateRun(run).criteria[0].outcome,'pass');}
 const run=createRun('replay');run.status='completed';run.final={...goodFinal,model:'Vale L4 Air'};assert.equal(evaluateRun(run).criteria[0].outcome,'fail');
});
test('reassessment preserves the original record and is idempotent per evaluator version',async()=>{
 const run=await trial('supported');const before=await readRun(root,run.id);const first=await reassess(root,run);assert.deepEqual(await reassess(root,run),first);assert.deepEqual(await readRun(root,run.id),before);assert.equal((await assessments(root,run.id)).length,1);
});

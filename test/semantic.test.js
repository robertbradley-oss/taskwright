import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {reviewInput,validateReview,reviewRun,saveReview,listReviews,dimensions,judgeHash} from '../engine/semantic.js';
import {referenceSet,referenceHash,calibrationSummary} from '../engine/reference-set.js';
import {createRun,runAgent,replayAdapter,readRun} from '../engine/runner.js';
import {scenarios} from '../engine/scenarios.js';
import {baseline,candidate} from '../engine/configurations.js';
import {createExperiment,compareRuns} from '../engine/experiments.js';
import {evaluateRun} from '../engine/evaluate.js';
const dir=await mkdtemp(path.join(tmpdir(),'taskwright-semantic-'));
const input=reviewInput(referenceSet[0].run);
function output(){return {criteria:Object.keys(dimensions).map(id=>({id,outcome:'pass',claim:input.reply.slice(0,20),reason:'Test adapter output; not a semantic judgment.',evidence:[{source_id:'doc:usb',quote:'It has no Wi-Fi radio or wireless setup button.'}]}))};}
test('judge input omits reference labels, authoring reasons, configuration and original score',()=>{
 assert.deepEqual(Object.keys(input),['reply','evidence']);assert.ok(!JSON.stringify(input).includes('reference'));assert.ok(!JSON.stringify(input).includes('instructionHash'));
});
test('fabricated quotations, invented sources and unquoted claims cannot yield a valid review',()=>{
 for(const mutate of [o=>o.criteria[0].evidence[0].quote='Imaginary guarantee',o=>o.criteria[0].evidence[0].source_id='secret',o=>o.criteria[0].claim='Not in the reply']){const o=output();mutate(o);assert.throws(()=>validateReview(o,input));}
});
test('duplicate, missing, invalid or extra verdict dimensions are rejected',()=>{
 for(const mutate of [o=>o.criteria.pop(),o=>o.criteria[0].id='grounding',o=>o.criteria[0].outcome='probably',o=>o.criteria[0].score=100,o=>o.overall='pass']){const o=output();mutate(o);assert.throws(()=>validateReview(o,input));}
});
test('overall review is derived from all dimensions, retaining fail and uncertainty',()=>{
 const o=output();o.criteria[3].outcome='uncertain';assert.equal(validateReview(o,input).outcome,'uncertain');o.criteria[1].outcome='fail';assert.equal(validateReview(o,input).outcome,'fail');
});
test('invalid model output becomes an uncertain error, preserving raw output and original run',async()=>{
 const run=structuredClone(referenceSet[0].run),before=structuredClone(run);const review=await reviewRun(run,{adapterFactory:async()=>({next:async()=>({criteria:[]})})});
 assert.equal(review.status,'error');assert.equal(review.evaluation.outcome,'uncertain');assert.deepEqual(review.raw,{criteria:[]});assert.deepEqual(run,before);
 await saveReview(dir,review);assert.deepEqual((await listReviews(dir,run.id))[0],review);await assert.rejects(()=>saveReview(dir,review),{code:'EEXIST'});
});
test('frozen calibration dataset and prompt still match their recorded manifest',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../evidence/semantic-calibration/manifest.json',import.meta.url),'utf8'));assert.equal(manifest.referenceHash,referenceHash);assert.equal(manifest.judgeHash,judgeHash);
});
test('review cancellation and time limits retain uncertain outcomes and close adapters',async()=>{
 let started=0,closed=0;const controller=new AbortController();controller.abort();
 const factory=async()=>{started++;return {next:()=>new Promise(()=>{}),close:()=>closed++};};
 const cancelled=await reviewRun(referenceSet[0].run,{signal:controller.signal,adapterFactory:factory});assert.equal(cancelled.status,'cancelled');assert.equal(started,0);
 const timed=await reviewRun(referenceSet[0].run,{timeoutMs:15,adapterFactory:factory});assert.equal(timed.status,'error');assert.equal(timed.evaluation.outcome,'uncertain');assert.equal(closed,1);assert.equal(timed.usage,null);
});
test('recorded calibration verdicts all pass quote validation and reproduce the published counts',async()=>{
 const report=JSON.parse(await readFile(new URL('../evidence/semantic-calibration/report.json',import.meta.url),'utf8'));
 for(const record of report.records){const c=referenceSet.find(c=>c.id===record.caseId);assert.deepEqual(validateReview(record.review.raw,reviewInput(c.run)),record.review.evaluation);}
 assert.deepEqual(calibrationSummary(report.records).bySplit,report.bySplit);
});
test('missing reviews and false passes prevent the predeclared calibration gate',()=>{
 assert.equal(calibrationSummary([]).pilotGate,false);
 const records=referenceSet.map(c=>({caseId:c.id,review:{status:'completed',evaluation:{outcome:'pass',criteria:[]}}}));assert.equal(calibrationSummary(records).pilotGate,false);assert.ok(calibrationSummary(records).bySplit.validation.falsePasses>0);
});
test('all expanded scenarios execute supported replays with their own evidence and action contract',async()=>{
 for(const scenario of scenarios.slice(1)){const run=createRun('replay','supported',baseline,scenario.id);await runAgent(run,replayAdapter('supported',run.scenario),dir);assert.equal(run.status,'completed');assert.equal(run.evaluation.criteria.filter(c=>c.outcome==='pass').length,4);assert.deepEqual(await readRun(dir,run.id),run);}
});
test('a new scenario can expose contradictory prose while structural checks still pass',async()=>{
 const run=createRun('replay','contradiction',baseline,'vale-reset');await runAgent(run,replayAdapter('contradiction',run.scenario),dir);assert.equal(run.evaluation.outcome,'uncertain');assert.match(run.final.reply,/Reset immediately while/);
});
test('scenario selection is frozen in comparisons and cannot be swapped after enrollment',()=>{
 const batch=createExperiment(baseline,candidate,1,'test-cli','vale-revision');assert.equal(batch.experiment.controls.scenario,'vale-revision@1');assert.equal(compareRuns(batch.experiment,batch.runs).compatible,true);batch.runs[0].scenario=scenarios[1];assert.equal(compareRuns(batch.experiment,batch.runs).compatible,false);
 assert.throws(()=>createRun('replay','wrong_model',baseline,'vale-reset'));assert.throws(()=>createRun('codex','supported',baseline,'unknown'));
});
test('the documented revision-B full name is accepted without accepting revision A',()=>{
 const run=createRun('replay','supported',baseline,'vale-revision');run.status='completed';run.final={model:'Vale L4 Air revision B',connection:'wifi',policy_commitment:'none',evidence_ids:[],reply:'test'};
 assert.equal(evaluateRun(run).criteria[0].outcome,'pass');run.final.model='Vale L4 Air revision A';assert.equal(evaluateRun(run).criteria[0].outcome,'fail');
});
test('retained coverage preserves original task failures and every review validates against its actual run',async()=>{
 const report=JSON.parse(await readFile(new URL('../evidence/semantic-coverage/report.json',import.meta.url),'utf8'));assert.equal(report.records.length,10);
 for(const {run,review}of report.records)assert.deepEqual(validateReview(review.raw,reviewInput(run)),review.evaluation);
 const reset=report.records.find(r=>r.id==='vale-reset-fresh');assert.equal(reset.run.evaluation.outcome,'fail');assert.equal(reset.review.evaluation.outcome,'pass');
 const revision=report.records.find(r=>r.id==='vale-revision-fresh');assert.equal(revision.run.evaluation.version,'structural-4');assert.equal(evaluateRun(revision.run).criteria.find(c=>c.id==='model').outcome,'pass');assert.equal(evaluateRun(revision.run).outcome,'fail');
});
test('review evidence restoration is idempotent and retains separate structural corrections',async()=>{
 const dest=await mkdtemp(path.join(tmpdir(),'taskwright-review-restore-'));
 const restore=()=>execFileSync(process.execPath,['scripts/restore-review-evidence.mjs'],{env:{...process.env,TASKWRIGHT_RUN_DIR:dest},encoding:'utf8',windowsHide:true});
 assert.match(restore(),/21 files added/);assert.match(restore(),/0 files added/);
 const run=await readRun(dest,'0968da6d-f771-4722-ab4a-7fd5c01c2d1e');assert.equal(run.evaluation.version,'structural-4');
 const correction=JSON.parse(await readFile(`${dest}/assessments/${run.id}-structural-5.json`,'utf8'));assert.equal(correction.evaluation.outcome,'fail');
});

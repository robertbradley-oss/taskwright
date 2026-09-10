import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createSuitePlan,verifySuitePlan,judgeAttempt,summarizeSuite} from '../engine/suites.js';
import {baseline,candidate} from '../engine/configurations.js';
import {hash} from '../engine/scenario.js';
import {scenarios,getScenario} from '../engine/scenarios.js';
import {createExperiment} from '../engine/experiments.js';
import {runAgent,replayAdapter} from '../engine/runner.js';
import {reviewInput,validateReview,dimensions} from '../engine/semantic.js';
const reservation=JSON.parse(await readFile(new URL('../evidence/conditional-handoff/reservation.json',import.meta.url),'utf8'));
const {hash:ignored,...candidateValue}=candidate;
const versioned={...candidateValue,createdAt:new Date(Date.parse(reservation.reservedAt)+1000).toISOString()};versioned.hash=hash(versioned);
const plan=createSuitePlan(baseline,versioned,'test-cli',reservation);
const dir=await mkdtemp(path.join(tmpdir(),'taskwright-suites-'));
function review(run,outcome='pass'){
 const input=reviewInput(run),raw={criteria:Object.keys(dimensions).map(id=>({id,outcome:id==='grounding'?outcome:'pass',claim:input.reply.slice(0,10),reason:'Synthetic test output, not a real semantic judgment.',evidence:[{source_id:'ticket',quote:input.evidence.ticket.slice(0,20)}]}))};
 return {runId:run.id,originalHash:hash(run),inputHash:hash(input),version:plan.controls.semanticVersion,judgeHash:plan.controls.judgeHash,status:'completed',execution:{cliVersion:'test-cli',requestedModel:plan.controls.model,reasoningEffort:plan.controls.reasoningEffort,protocolVersion:plan.controls.semanticVersion},raw,evaluation:validateReview(raw,input),usage:null};
}
const experiments=[],records=[];
for(const s of scenarios){const batch=createExperiment(baseline,versioned,2,'test-cli',s.id);experiments.push(batch.experiment);for(const run of batch.runs){const adapter=replayAdapter('supported',run.scenario);adapter.metadata={cliVersion:'test-cli',requestedModel:plan.controls.model,reasoningEffort:plan.controls.reasoningEffort,protocolVersion:plan.controls.protocolVersion};await runAgent(run,adapter,dir);records.push({run,review:review(run)});}}

test('reservation precedes candidate and remains outside every development selection',()=>{
 assert.equal(reservation.cases.length,4);assert.equal(hash(reservation.cases),reservation.casesHash);
 for(const c of reservation.cases){assert.throws(()=>getScenario(c.id));assert.ok(!plan.scenarios.some(s=>s.id===c.id));}
 const early={...versioned,createdAt:reservation.reservedAt};delete early.hash;early.hash=hash(early);
 assert.throws(()=>createSuitePlan(baseline,early,'test-cli',reservation),/Reserve/);
 const changed=structuredClone(plan);changed.repetitions=3;assert.throws(()=>verifySuitePlan(changed));
});
test('suite retains all 16 denominators and selects no candidate on an all-pass tie',()=>{
 const r=summarizeSuite(plan,experiments,records);assert.equal(r.compatible,true);assert.equal(r.complete,true);assert.equal(r.rows.length,16);assert.equal(r.arms.baseline.counts.checks_pass,8);assert.equal(r.arms.candidate.counts.checks_pass,8);assert.equal(r.decision.status,'not_selected');
});
test('task failure cannot be overridden by a passing prose review',()=>{
 const record=structuredClone(records[0]);record.run.evaluation.criteria.find(c=>c.id==='handoff').outcome='fail';record.review=review(record.run);
 const verdict=judgeAttempt(record.run,record.review,plan.controls);assert.equal(verdict.outcome,'task_fail');assert.equal(verdict.reply,'pass');
});
test('selection requires the full candidate slate and retains failures, errors and missing reviews',()=>{
 const changed=structuredClone(records);changed[0].review=review(changed[0].run,'fail');
 assert.equal(summarizeSuite(plan,experiments,changed).decision.status,'candidate_selected');
 for(const mutate of [r=>r.review=null,r=>r.review=review(r.run,'uncertain'),r=>r.review=review(r.run,'fail'),r=>{r.run.status='error';r.review=null;}]){
  const variant=structuredClone(changed);mutate(variant[1]);const report=summarizeSuite(plan,experiments,variant);assert.notEqual(report.decision.status,'candidate_selected');assert.equal(report.arms.candidate.scheduled,8);assert.equal(Object.values(report.arms.candidate.counts).reduce((a,b)=>a+b),8);
 }
 const empty=summarizeSuite(plan,[],[]);assert.equal(empty.rows.length,16);assert.equal(empty.decision.status,'pending');
});
test('source drift, judge drift, changed quotes, mismatched runs and schedule changes block selection',()=>{
 for(const mutate of [r=>r.review.judgeHash='changed',r=>r.review.execution.cliVersion='changed',r=>r.review.originalHash='changed',r=>r.review.raw.criteria[0].evidence[0].quote='fabricated',r=>r.run.scenario.documents[0].text='changed']){
  const changed=structuredClone(records);mutate(changed[0]);assert.equal(summarizeSuite(plan,experiments,changed).decision.status,'blocked');
 }
 const changed=structuredClone(experiments);changed[0].schedule.reverse();assert.equal(summarizeSuite(plan,changed,records).decision.status,'blocked');
});

test('retained suite reproduces every layer and its predeclared decision without inference',async()=>{
 const read=async name=>JSON.parse(await readFile(new URL(`../evidence/conditional-handoff/${name}.json`,import.meta.url),'utf8'));
 const frozen=await read('plan'),retained=await read('report'),archive=await read('archive'),decision=await read('decision');
 assert.equal(hash(retained),decision.reportHash);assert.equal(frozen.hash,decision.planHash);
 const reproduced=summarizeSuite(frozen,archive.experiments,archive.records);
 assert.deepEqual({...reproduced,updatedAt:retained.updatedAt},retained);
 assert.equal(retained.rows.length,16);assert.equal(retained.terminal,true);assert.equal(retained.compatible,true);
 assert.equal(archive.reservationCheck.executedReserved,0);assert.equal(archive.reservationCheck.casesHash,reservation.casesHash);
 assert.ok(retained.rows.every(r=>r.run.scenario.split==='development'));
});

test('suite restore is idempotent, refuses changed records, and cannot start inference',async()=>{
 const dest=await mkdtemp(path.join(tmpdir(),'taskwright-suite-restore-'));
 const restore=()=>execFileSync(process.execPath,['scripts/restore-suite.mjs'],{env:{...process.env,PATH:'',TASKWRIGHT_RUN_DIR:dest},encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
 assert.match(restore(),/37 files added/);assert.match(restore(),/0 files added/);
 const retained=JSON.parse(await readFile(new URL('../evidence/conditional-handoff/report.json',import.meta.url),'utf8'));
 const record=structuredClone(retained.rows[0].run);record.final.reply='Existing different output';const file=`${dest}/${record.id}.json`;
 await writeFile(file,JSON.stringify(record));assert.throws(restore);assert.deepEqual(JSON.parse(await readFile(file,'utf8')),record);
});

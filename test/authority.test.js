import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {hash} from '../engine/scenario.js';
import {baseline} from '../engine/configurations.js';
import {createAuthorityContract,authorityDefaults,evaluateAuthority,saveAuthorityContract,readAuthorityContract,verifyAuthorityContract} from '../engine/authority.js';
import {createAuthorityRun,createAuthorityExperiment,summarizeAuthority,executeAuthority,saveAuthorityPlan,loadAuthority} from '../engine/authority-experiment.js';
import {authorityFixture} from '../engine/authority-fixtures.js';
import {authorityReviewInput,authorityReviewVersion} from '../engine/authority-review.js';
import {validateAuthorityCalibration} from '../engine/authority-calibration.js';
import {dimensions,validateReview} from '../engine/semantic.js';
import {runAgent} from '../engine/runner.js';
const dir=await mkdtemp(path.join(tmpdir(),'taskwright-authority-tests-'));
const execute=createAuthorityContract({...authorityDefaults,handoffAuthority:'execute'}),prepare=createAuthorityContract(authorityDefaults);
const batch=()=>createAuthorityExperiment(execute,prepare,baseline,'test-cli','a'.repeat(64));
const adapter=(run,kind='supported')=>{const actions=authorityFixture(run.authorityContract,kind);let i=0;return {metadata:{cliVersion:'test-cli',requestedModel:run.agent.model,reasoningEffort:run.agent.reasoningEffort,protocolVersion:run.agent.protocolVersion},next:async()=>structuredClone(actions[i++])};};
async function completed(contract,kind='supported'){const run=createAuthorityRun(contract,baseline);await runAgent(run,adapter(run,kind),dir);return run;}
const criterion=(run,id)=>evaluateAuthority(run).criteria.find(c=>c.id===id).outcome;
function fakeReview(run,controls,changes={}){const input=authorityReviewInput(run),raw={criteria:Object.keys(dimensions).map(id=>({id,outcome:changes[id]||'pass',claim:input.reply.slice(0,10),reason:'Synthetic test verdict; not a semantic judgment.',evidence:[{source_id:'ticket',quote:input.evidence.ticket.slice(0,20)}]}))};return {id:randomUUID(),createdAt:new Date().toISOString(),runId:run.id,status:'completed',originalHash:hash(run),inputHash:hash(input),version:authorityReviewVersion,judgeHash:controls.judgeHash,execution:{cliVersion:controls.cliVersion,requestedModel:controls.model,reasoningEffort:controls.reasoningEffort,protocolVersion:authorityReviewVersion},raw,evaluation:validateReview(raw,input)};}
test('authority briefs are immutable and only supported requirements can be frozen',async()=>{
 const saved=await saveAuthorityContract(dir,authorityDefaults);assert.deepEqual(await readAuthorityContract(dir,saved.id),saved);
 assert.throws(()=>createAuthorityContract({...authorityDefaults,handoffAuthority:'unlimited'}));assert.throws(()=>createAuthorityContract({...authorityDefaults,tools:[]}));
 const changed=structuredClone(saved);changed.fields.handoffAuthority='execute';assert.throws(()=>verifyAuthorityContract(changed));
});
test('identical tool actions can pass execute authority and fail prepare-only authority',async()=>{
 const run=await completed(execute);assert.equal(criterion(run,'handoff'),'pass');run.authorityContract=prepare;assert.equal(criterion(run,'handoff'),'fail');
 const prepared=await completed(prepare);assert.equal(criterion(prepared,'handoff'),'pass');prepared.authorityContract=execute;assert.equal(criterion(prepared,'handoff'),'fail');
});
test('handoff count and evidence order use successful trace events, not reply claims',async()=>{
 const run=await completed(prepare,'false_claim');assert.equal(criterion(run,'handoff'),'pass');assert.match(run.final.reply,/I opened/);
 const opened=await completed(execute),policy=opened.trace.find(t=>t.kind==='tool_result'&&t.tool==='read_document'&&t.result.id==='policy'),action=opened.trace.find(t=>t.kind==='tool_result'&&t.tool==='record_escalation');policy.seq=action.seq+1;assert.equal(criterion(opened,'sources'),'fail');
 opened.trace.push({...action,seq:99});assert.equal(criterion(opened,'handoff'),'fail');
});
test('paired briefs reject purpose changes and freeze six fresh IDs before any call',async()=>{
 assert.throws(()=>createAuthorityExperiment(execute,createAuthorityContract({...authorityDefaults,purpose:'A different purpose that changes the task.'}),baseline,'test-cli','a'.repeat(64)));
 const {plan,runs}=batch();assert.deepEqual(plan.schedule.map(s=>s.mode),['execute','prepare','prepare','execute','execute','prepare']);assert.equal(new Set(runs.map(r=>r.id)).size,6);
 let input;const runner=adapter(runs[0]),next=runner.next;runner.next=async value=>{input=value;return next();};await runAgent(runs[0],runner,dir);
 assert.match(input.instructions,/Operator workspace brief/);assert.ok(!JSON.stringify(input).includes('evaluationSpec'));assert.ok(!JSON.stringify(input).includes('reserved-'));
 const projected=authorityReviewInput(runs[0]);assert.ok(JSON.stringify(projected).includes('workspace-brief'));assert.ok(!JSON.stringify(projected).includes('expectedOutcome'));
});
test('authority comparison separates observed action changes from full-contract responsiveness',async()=>{
 const {plan,runs}=batch(),records=[];for(const run of runs){await runAgent(run,adapter(run),dir);records.push({run,review:fakeReview(run,plan.controls)});}
 assert.equal(summarizeAuthority(plan,records).decision,'requirement_followed');
 const failed=structuredClone(records);failed[1].review=fakeReview(failed[1].run,plan.controls,{grounding:'fail'});const result=summarizeAuthority(plan,failed);assert.equal(result.decision,'action_changed_with_failures');assert.equal(result.behavioralContrast,true);assert.equal(result.rows[1].actions,'pass');assert.equal(result.rows[1].advice,'fail');
 const missing=structuredClone(records);missing[0].review=null;assert.equal(summarizeAuthority(plan,missing).decision,'incomplete');
 const drift=structuredClone(records);drift[0].run.agent.execution.cliVersion='changed';assert.equal(summarizeAuthority(plan,drift).decision,'blocked');
 const quotes=structuredClone(records);quotes[0].review.raw.criteria[0].claim='invented quote';assert.equal(summarizeAuthority(plan,quotes).decision,'blocked');
});
test('cancellation retains all scheduled authority attempts and starts no adapters',async()=>{
 const {plan,runs}=batch(),active=new Map(runs.map(r=>[r.id,new AbortController()]));for(const controller of active.values())controller.abort();let calls=0;
 await saveAuthorityPlan(dir,plan,runs);await executeAuthority(runs,active,dir,{makeAdapter:()=>{calls++;throw Error('Must not call');}});
 assert.equal(calls,0);assert.equal(active.size,0);assert.ok(runs.every(r=>r.status==='cancelled'));assert.equal((await loadAuthority(dir,plan.id)).decision,'incomplete');
});
test('a lost first authority review stays missing while later attempts remain recorded',async()=>{
 const {plan,runs}=batch(),active=new Map(runs.map(r=>[r.id,new AbortController()]));await saveAuthorityPlan(dir,plan,runs);let reviews=0;
 await executeAuthority(runs,active,dir,{makeAdapter:run=>adapter(run),makeReview:async run=>{reviews++;if(reviews===1)throw Error('Synthetic review loss');return fakeReview(run,plan.controls);}});
 const result=await loadAuthority(dir,plan.id);assert.equal(reviews,6);assert.equal(result.decision,'incomplete');assert.equal(result.rows.filter(r=>r.review).length,5);assert.equal(result.rows[0].review,null);assert.ok(result.rows.every(r=>r.run.status==='completed'));
 assert.equal(JSON.parse(await readFile(`${dir}/review-errors/${runs[0].id}.json`,'utf8')).error,'Synthetic review loss');
});
test('eight authority calibration records reproduce their first verdicts and gate against drift',async()=>{
 const report=JSON.parse(await readFile(new URL('../evidence/authority/calibration.json',import.meta.url),'utf8'));assert.equal(validateAuthorityCalibration(report,report.plan.cliVersion).passed,true);
 assert.equal(validateAuthorityCalibration(report,'changed CLI').passed,false);const edited=structuredClone(report);edited.results[0].review.raw.criteria[0].claim='fabricated';assert.equal(validateAuthorityCalibration(edited,report.plan.cliVersion).passed,false);
});

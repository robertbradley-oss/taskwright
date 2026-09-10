import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {briefDefaults,saveBrief,freezeBrief,readContract,listBriefs,verifyContract,taskInstructions} from '../engine/briefs.js';
import {createRun,runAgent,replayAdapter,saveRun} from '../engine/runner.js';
import {baseline,candidate} from '../engine/configurations.js';
import {evaluateTask,modelInstructions} from '../engine/contract-evaluate.js';
import {createContractSuite,summarizeContractSuite,executeContractSuite,saveContractSuite,loadContractSuite} from '../engine/contract-suites.js';
import {reviewInput,validateReview,dimensions} from '../engine/semantic.js';
import {hash} from '../engine/scenario.js';
const dir=await mkdtemp(path.join(tmpdir(),'taskwright-briefs-'));
const draft=await saveBrief(dir,{fields:briefDefaults}),contract=await freezeBrief(dir,draft.id);
test('briefs freeze immutably, retain ancestry and reject unsupported fields',async()=>{
 assert.deepEqual(await freezeBrief(dir,draft.id),contract);
 const [a,b]=await Promise.all([saveBrief(dir,{fields:{...briefDefaults,name:'A'},parentHash:draft.hash}),saveBrief(dir,{fields:{...briefDefaults,name:'B'},parentHash:draft.hash})]);assert.notEqual(a.version,b.version);assert.equal(a.parentHash,draft.hash);
 assert.deepEqual(await readContract(dir,draft.id),contract);assert.equal((await listBriefs(dir)).length,3);
 await assert.rejects(()=>saveBrief(dir,{fields:{...briefDefaults,policyMode:'whatever'}}));
 await assert.rejects(()=>saveBrief(dir,{fields:{...briefDefaults,tools:['outside_tool']}}));
 const changed=structuredClone(contract);changed.brief.fields.purpose='Changed';assert.throws(()=>verifyContract(changed));
});
test('the same reply can meet advice-only process or fail an explicitly mandatory policy lookup',async()=>{
 const original=JSON.parse(await readFile(new URL('../evidence/conditional-handoff/a36191dc-96df-43fd-ab28-9b022dde8314.json',import.meta.url),'utf8'));
 const run=structuredClone(original.run);run.contract=contract;assert.equal(evaluateTask(run).criteria.find(c=>c.id==='sources').outcome,'fail');
 const optionalDraft=await saveBrief(dir,{fields:{...briefDefaults,policyMode:'before-handoff',policyReason:'Require policy lookup for actions; advice-only replies may rely on the applicable product guidance.'}}),optional=await freezeBrief(dir,optionalDraft.id);run.contract=optional;
 assert.equal(evaluateTask(run).criteria.find(c=>c.id==='sources').outcome,'pass');assert.equal(original.run.evaluation.outcome,'fail');
 assert.notEqual(optional.hash,contract.hash);
});
test('reading policy after a handoff does not satisfy the before-action requirement',async()=>{
 const run=createRun('replay','supported',baseline,'vale-wireless',contract);await runAgent(run,replayAdapter('supported'),dir);
 const policy=run.trace.find(t=>t.kind==='tool_result'&&t.tool==='read_document'&&t.result.id==='policy');const action=run.trace.find(t=>t.kind==='tool_result'&&t.tool==='record_escalation');
 policy.seq=action.seq+1;assert.equal(evaluateTask(run).criteria.find(c=>c.id==='sources').outcome,'fail');
});
test('both configurations receive the frozen requirements without evaluator labels or reserved case contents',async()=>{
 const batch=createContractSuite(contract,baseline,candidate,'test-cli');assert.equal(batch.runs.length,16);assert.equal(new Set(batch.runs.map(r=>r.id)).size,16);
 for(const run of batch.runs){assert.equal(run.contractHash,contract.hash);assert.ok(modelInstructions(run).startsWith(taskInstructions(briefDefaults)));assert.ok(!modelInstructions(run).includes('evaluationSpec'));assert.ok(!modelInstructions(run).includes('reserved-wireless'));}
 let seen;const run=batch.runs[0];const adapter=replayAdapter('supported');const next=adapter.next;adapter.next=async input=>{seen=input;return next(input);};await runAgent(run,adapter,dir);assert.equal(seen.instructions,modelInstructions(run));assert.ok(!Object.hasOwn(seen,'contract'));
});
function fakeReview(run,controls){const input=reviewInput(run),raw={criteria:Object.keys(dimensions).map(id=>({id,outcome:'pass',claim:input.reply.slice(0,10),reason:'Synthetic test verdict, not a semantic judgment.',evidence:[{source_id:'ticket',quote:input.evidence.ticket.slice(0,20)}]}))};return {runId:run.id,status:'completed',originalHash:hash(run),inputHash:hash(input),version:controls.semanticVersion,judgeHash:controls.judgeHash,execution:{cliVersion:controls.cliVersion,requestedModel:controls.model,reasoningEffort:controls.reasoningEffort,protocolVersion:controls.semanticVersion},raw,evaluation:validateReview(raw,input)};}
test('comparison keeps advice, actions and process separate and reports a full-pass tie',async()=>{
 const {plan,runs}=createContractSuite(contract,baseline,candidate,'test-cli'),records=[];
 for(const run of runs){const adapter=replayAdapter('supported',run.scenario);adapter.metadata={cliVersion:'test-cli',requestedModel:run.agent.model,reasoningEffort:run.agent.reasoningEffort,protocolVersion:run.agent.protocolVersion};await runAgent(run,adapter,dir);records.push({run,review:fakeReview(run,plan.reviewControls)});}
 const result=summarizeContractSuite(plan,records);assert.equal(result.decision,'tie');assert.equal(result.arms.baseline.overall.pass,8);assert.equal(result.arms.candidate.process.pass,8);
 const changed=structuredClone(records);changed[1].run.evaluation.criteria.find(c=>c.id==='sources').outcome='fail';changed[1].review=fakeReview(changed[1].run,plan.reviewControls);
 const regression=summarizeContractSuite(plan,changed);assert.equal(regression.rows[1].advice,'pass');assert.equal(regression.rows[1].actions,'pass');assert.equal(regression.rows[1].process,'fail');assert.equal(regression.decision,'baseline_qualifies');
 const missing=structuredClone(records);missing[0].review=null;assert.equal(summarizeContractSuite(plan,missing).decision,'incomplete');
 const drift=structuredClone(records);drift[0].run.contractHash='changed';assert.equal(summarizeContractSuite(plan,drift).decision,'blocked');
});
test('cancelling a contract suite retains every scheduled attempt without calling an adapter',async()=>{
 const {runs}=createContractSuite(contract,baseline,candidate,'test-cli'),active=new Map(runs.map(r=>[r.id,new AbortController()]));for(const c of active.values())c.abort();let calls=0;
 for(const run of runs)await saveRun(dir,run);
 await executeContractSuite(runs,active,dir,{makeAdapter:()=>{calls++;throw Error('Must not run');}});assert.equal(calls,0);assert.equal(active.size,0);assert.ok(runs.every(r=>r.status==='cancelled'&&r.evaluation.version==='brief-1'));
});

test('a lost first review is retained as incomplete, with later trials executed and no retry',async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),'taskwright-review-loss-'));
 const {plan,runs}=createContractSuite(contract,baseline,candidate,'test-cli'),active=new Map(runs.map(r=>[r.id,new AbortController()]));
 await saveContractSuite(folder,plan,runs);let reviews=0;
 await executeContractSuite(runs,active,folder,{
  makeAdapter:run=>({...replayAdapter('supported',run.scenario),metadata:{cliVersion:'test-cli',requestedModel:run.agent.model,reasoningEffort:run.agent.reasoningEffort,protocolVersion:run.agent.protocolVersion}}),
  makeReview:async run=>{reviews++;if(reviews===1)throw Error('Synthetic lost review');return {...fakeReview(run,plan.reviewControls),id:randomUUID(),createdAt:new Date().toISOString()};}
 });
 const report=await loadContractSuite(folder,plan.id);
 assert.equal(reviews,16);assert.equal(report.decision,'incomplete');assert.equal(report.rows.filter(r=>r.review).length,15);
 assert.ok(report.rows.every(r=>r.run.status==='completed'));assert.equal(report.rows[0].review,null);
 assert.equal(JSON.parse(await readFile(`${folder}/review-errors/${runs[0].id}.json`,'utf8')).error,'Synthetic lost review');
 assert.equal(JSON.parse(await readFile(`${folder}/review-claims/${runs[0].id}.json`,'utf8')).originalHash,hash(report.rows[0].run));
});

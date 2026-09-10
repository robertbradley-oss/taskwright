import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,readFile,writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { baseline,candidate,saveCandidate,listConfigurations,configKey } from '../engine/configurations.js';
import { createExperiment,saveExperiment,readExperiment,compareRuns,loadComparison } from '../engine/experiments.js';
import { replayAdapter,runAgent,saveRun,recoverRuns } from '../engine/runner.js';
import { reassess } from '../engine/assessments.js';
import { executionArgs } from '../engine/codex-adapter.js';
import { executeQueue } from '../engine/queue.js';
const dir=await mkdtemp(path.join(tmpdir(),'taskwright-experiments-'));
async function completed(fixtures=['supported','wrong_model','malformed','supported']){
 const batch=createExperiment(baseline,candidate,2,'test-cli');
 await saveExperiment(dir,batch.experiment);
 for(const [i,run]of batch.runs.entries()){
  const adapter=replayAdapter(fixtures[i]);adapter.metadata={cliVersion:'test-cli',protocolVersion:run.agent.protocolVersion,requestedModel:run.agent.model,reasoningEffort:run.agent.reasoningEffort};
  await runAgent(run,adapter,dir);
 }
 return batch;
}
test('new configurations are immutable, preserve ancestry and survive concurrent saves',async()=>{
 const [a,b]=await Promise.all([saveCandidate(dir,{name:'A',instructions:'Read applicable evidence.',parent:configKey(candidate)}),saveCandidate(dir,{name:'B',instructions:'Confirm supported actions.',parent:configKey(candidate)})]);
 assert.notEqual(a.version,b.version);assert.equal(a.parentHash,candidate.hash);
 assert.equal((await listConfigurations(dir)).length,4);
 assert.deepEqual(JSON.parse(await readFile(`${dir}/configurations/support-candidate-${a.version}.json`)),a);
 assert.equal(baseline.version,1);assert.equal(candidate.version,1);
 await assert.rejects(()=>saveCandidate(dir,{name:'',instructions:'x',parent:configKey(candidate)}));
});
test('experiment freezes controls, balances order and rejects invalid or identical arms',()=>{
 const {experiment,runs}=createExperiment(baseline,candidate,2,'test-cli');
 assert.deepEqual(experiment.schedule.map(e=>e.arm),['baseline','candidate','candidate','baseline']);
 assert.equal(experiment.controls.model,'gpt-6-astra');assert.equal(runs.length,4);
 assert.notEqual(runs[0].agent.instructionHash,runs[1].agent.instructionHash);
 runs[0].agent.instructions='changed';assert.equal(experiment.arms.baseline.instructions,baseline.instructions);
 for(const n of [0,5,1.5,'2'])assert.throws(()=>createExperiment(baseline,candidate,n,'test-cli'));
 assert.throws(()=>createExperiment(baseline,baseline,2,'test-cli'),/different/);
});
test('explicit model and reasoning are passed as CLI arguments without consulting the user default',()=>{
 const args=executionArgs('scratch',candidate);assert.equal(args[args.indexOf('--model')+1],candidate.model);
 assert.ok(args.includes('model_reasoning_effort="low"'));assert.ok(args.includes('--ignore-user-config'));
});
test('comparison retains failures and errors in all denominators and never infers a winner',async()=>{
 const {experiment,runs}=await completed(),result=compareRuns(experiment,runs);
 assert.equal(result.compatible,true);assert.equal(result.pending,false);
 assert.deepEqual(result.arms.candidate.outcomes,{uncertain:0,fail:1,execution_error:1,awaiting:0,unavailable:0});
 assert.equal(result.arms.candidate.scheduled,2);assert.equal(result.arms.candidate.completed,1);
 assert.equal(result.arms.candidate.criteria[0].fail,1);assert.equal(result.arms.candidate.criteria[0].uncertain,1);
 assert.equal(result.arms.baseline.criteria[4].uncertain,2);
 assert.match(result.conclusion,/No winner/);assert.equal(result.arms.baseline.tokens.known,0);assert.equal(result.arms.baseline.cost,null);
 assert.deepEqual(await loadComparison(dir,experiment.id),result);
});
test('changed sources, limits, configuration, runtime and original evaluator block comparisons',async()=>{
 const {experiment,runs}=await completed();
 const mutations=[r=>r.scenario.documents[0].text='changed',r=>r.limits.steps++,r=>r.agent.instructions='changed',r=>r.agent.model='different',r=>r.agent.execution.cliVersion='different',r=>r.evaluation.version='different',r=>r.evaluation.sourceHash='different',r=>delete r.agent.execution];
 for(const mutate of mutations){const copies=structuredClone(runs);mutate(copies[0]);const result=compareRuns(experiment,copies);assert.equal(result.compatible,false);assert.ok(result.rows[0].issues.length);assert.equal(result.rows.length,4);}
 const missing=compareRuns(experiment,runs.slice(1));assert.equal(missing.compatible,false);assert.equal(missing.rows[0].status,'missing');assert.equal(missing.arms,null);
});
test('reassessment cannot silently change an experiment result',async()=>{
 const {experiment,runs}=await completed();const before=await loadComparison(dir,experiment.id);await reassess(dir,runs[0]);assert.deepEqual(await loadComparison(dir,experiment.id),before);
 await assert.rejects(()=>saveExperiment(dir,experiment),{code:'EEXIST'});assert.deepEqual(await readExperiment(dir,experiment.id),experiment);
});
test('restart retains scheduled interrupted attempts and unknown usage instead of selecting completed runs',async()=>{
 const {experiment,runs}=createExperiment(baseline,candidate,2,'test-cli');await saveExperiment(dir,experiment);
 for(const run of runs)await saveRun(dir,run);await recoverRuns(dir);const result=await loadComparison(dir,experiment.id);
 assert.equal(result.compatible,true);assert.equal(result.pending,false);assert.equal(result.rows.length,4);
 for(const arm of Object.values(result.arms)){assert.equal(arm.outcomes.execution_error,2);assert.equal(arm.elapsedMs.known,0);assert.equal(arm.tokens.known,0);}
});
test('cancelling a batch stops the active adapter and never starts queued adapters',async()=>{
 const {experiment,runs}=createExperiment(baseline,candidate,2,'test-cli');
 const active=new Map(runs.map(r=>[r.id,new AbortController()]));let starts=0,closed=false;
 const pending=executeQueue(runs,active,dir,async()=>{starts++;return {next:async()=>{for(const c of active.values())c.abort();return new Promise(()=>{});},close:()=>{closed=true;}};});
 await pending;assert.equal(starts,1);assert.equal(closed,true);assert.equal(active.size,0);
 assert.ok(runs.every(r=>r.status==='cancelled'));assert.equal(runs[1].usage.elapsedMs,null);
 const result=compareRuns(experiment,runs);assert.equal(result.compatible,true);assert.equal(result.arms.candidate.outcomes.execution_error,2);
});
test('adapter setup failure is retained and later trials still execute serially',async()=>{
 const {experiment,runs}=createExperiment(baseline,candidate,1,'test-cli');const active=new Map(runs.map(r=>[r.id,new AbortController()]));let starts=0;
 await executeQueue(runs,active,dir,async run=>{if(++starts===1)throw Error('Fixture setup failure');assert.equal(runs[0].status,'error');const adapter=replayAdapter('supported');adapter.metadata={cliVersion:'test-cli',protocolVersion:run.agent.protocolVersion,requestedModel:run.agent.model,reasoningEffort:run.agent.reasoningEffort};return adapter;});
 assert.equal(runs[0].status,'error');assert.equal(runs[1].status,'completed');assert.equal(active.size,0);assert.equal(compareRuns(experiment,runs).arms.baseline.outcomes.execution_error,1);
});
test('retained real experiment reproduces its comparison without executing an adapter',async()=>{
 const retained=JSON.parse(await readFile(new URL('../evidence/prompt-comparison/experiment.json',import.meta.url),'utf8'));
 assert.deepEqual(compareRuns(retained.experiment,retained.rows.map(r=>r.run)),retained);
});
test('demo restoration is idempotent and rejects changed existing records without overwriting',async()=>{
 const dest=await mkdtemp(path.join(tmpdir(),'taskwright-restore-'));
 const restore=()=>execFileSync(process.execPath,['scripts/restore-experiment.mjs'],{env:{...process.env,TASKWRIGHT_RUN_DIR:dest},encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
 assert.match(restore(),/5 files added/);assert.match(restore(),/0 files added/);
 const file=`${dest}/95cd19ca-865e-43af-b031-0f33bf7ca24d.json`,run=JSON.parse(await readFile(file,'utf8'));run.final.reply='Existing local edit';await writeFile(file,JSON.stringify(run));
 assert.throws(restore);assert.deepEqual(JSON.parse(await readFile(file,'utf8')),run);
});

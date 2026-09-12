import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {briefDefaults,saveBrief,freezeBrief} from '../engine/briefs.js';
import {baseline,candidate} from '../engine/configurations.js';
import {saveContractSuite,loadContractSuite} from '../engine/contract-suites.js';
import {actionsForScenario} from '../engine/scenarios.js';
import {saveRun} from '../engine/runner.js';
import {dimensions} from '../engine/semantic.js';
import {hash} from '../engine/scenario.js';
import {createDiagnosticComparison,executeDiagnosticComparison,loadDiagnosticComparison} from '../engine/comparison-execution.js';
import {runEvidence} from '../workflow-view.js';

const event=response=>JSON.stringify({type:'item.completed',item:{type:'agent_message',text:response}})+'\n';
function processHarness(scripts) {
  const inputs=[];
  return {inputs,dependencies:{executable:'fixture',cliVersion:'test-cli',createScratch:async()=>'.',launch(){
    const script=scripts.shift();assert.ok(script,'No extra process calls allowed');
    const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.stdin=new EventEmitter();child.kill=()=>{};
    child.stdin.end=input=>{inputs.push(input);queueMicrotask(()=>{
      child.stdout.emit('data',script.stdout??event(script.response));
      if(script.stderr)child.stderr.emit('data',script.stderr);
      child.emit('close',script.exitCode??0);
    });};return child;
  }}};
}
async function fixture() {
  const dir=await mkdtemp(path.join(tmpdir(),'taskwright-comparison-'));
  const brief=await saveBrief(dir,{fields:briefDefaults}),contract=await freezeBrief(dir,brief.id);
  const suite=createDiagnosticComparison(contract,baseline,candidate,'test-cli');
  const active=new Map(suite.runs.map(run=>[run.id,new AbortController()]));
  await saveContractSuite(dir,suite.plan,suite.runs);
  return {dir,active,...suite};
}

test('all 16 rejected attempts persist once, retain exact output, and cannot qualify either arm',async()=>{
  const f=await fixture(),response='<script>alert("rejected")</script>',h=processHarness(f.runs.map(()=>({response})));
  await executeDiagnosticComparison(f.plan,f.runs,f.active,f.dir,{dependencies:h.dependencies});
  const report=await loadDiagnosticComparison(f.dir,f.plan.id);
  assert.equal(report.rows.length,16);assert.equal(h.inputs.length,16);assert.equal(f.active.size,0);
  assert.equal(report.decision,'incomplete');assert.deepEqual(report.qualified,{baseline:false,candidate:false});
  for(const row of report.rows) {
    assert.equal(row.outcome,'execution_error');assert.equal(row.review,null);assert.equal(row.run.final,null);
    assert.equal(row.run.executionDiagnostics.length,1);
    const d=row.run.executionDiagnostics[0];assert.equal(d.stage,'response_json');assert.equal(d.response.text,response);
    assert.equal(Buffer.from(d.response.base64,'base64').toString(),response);
    assert.ok(!JSON.stringify(row.run.trace).includes(response));
  }
  assert.ok(h.inputs.every(input=>!input.includes('executionDiagnostics')));
  const html=runEvidence(report.rows[0]);assert.ok(!html.includes(response));assert.match(html,/&lt;script&gt;/);
  assert.match(html,/Failure diagnostics/);
  const exported=JSON.parse(JSON.stringify(report));assert.equal(exported.rows[15].run.executionDiagnostics[0].response.text,response);
  const changed=report.rows[0].run;changed.executionDiagnostics[0].response.text='altered';await saveRun(f.dir,changed);
  assert.equal((await loadDiagnosticComparison(f.dir,f.plan.id)).decision,'blocked');
});

test('support succeeds but invalid first reviews retain rejected bytes and match the final saved run hash',async()=>{
  const f=await fixture(),scripts=[];
  for(const run of f.runs) {
    scripts.push(...actionsForScenario('supported',run.scenario).map(action=>({response:JSON.stringify(action)})));
    scripts.push({response:'{"criteria":[]}'});
  }
  const expected=scripts.length,h=processHarness(scripts);
  await executeDiagnosticComparison(f.plan,f.runs,f.active,f.dir,{dependencies:h.dependencies});
  const report=await loadDiagnosticComparison(f.dir,f.plan.id);
  assert.equal(h.inputs.length,expected);assert.equal(report.decision,'incomplete');
  for(const row of report.rows) {
    assert.equal(row.run.status,'completed');assert.deepEqual(row.run.executionDiagnostics,[]);
    assert.equal(row.review.status,'error');assert.equal(row.review.originalHash,hash(row.run));
    assert.equal(row.review.executionDiagnostics[0].stage,'review_schema');
    assert.equal(row.review.executionDiagnostics[0].response.text,'{"criteria":[]}');
    assert.match(runEvidence(row),/review_schema/);
  }
});

test('valid responses use unchanged grading and support tampering blocks selection',async()=>{
  const f=await fixture(),scripts=[];
  for(const run of f.runs) {
    const actions=actionsForScenario('supported',run.scenario),reply=actions.at(-1).reply;
    scripts.push(...actions.map(action=>({response:JSON.stringify(action)})));
    scripts.push({response:JSON.stringify({criteria:Object.keys(dimensions).map(id=>({id,outcome:'pass',claim:reply.slice(0,10),reason:'Scripted validation fixture, not a model judgment.',evidence:[{source_id:'ticket',quote:run.scenario.ticket.slice(0,10)}]}))})});
  }
  const h=processHarness(scripts);await executeDiagnosticComparison(f.plan,f.runs,f.active,f.dir,{dependencies:h.dependencies});
  const report=await loadDiagnosticComparison(f.dir,f.plan.id);
  assert.equal(report.complete,true);assert.equal(report.compatible,true);
  assert.deepEqual(report,await loadContractSuite(f.dir,f.plan.id));
  for(const row of report.rows)assert.equal(row.review.originalHash,hash(row.run));
  const run=report.rows[0].run;delete run.comparisonExecution;await saveRun(f.dir,run);
  assert.equal((await loadDiagnosticComparison(f.dir,f.plan.id)).decision,'blocked');
});

test('setup failures and pre-start cancellation remain distinct without process calls or replacement',async()=>{
  const f=await fixture();f.active.get(f.runs[0].id).abort();
  await executeDiagnosticComparison(f.plan,f.runs,f.active,f.dir,{dependencies:{executable:null}});
  const report=await loadDiagnosticComparison(f.dir,f.plan.id);
  assert.equal(report.rows[0].run.status,'cancelled');
  for(const row of report.rows.slice(1))assert.equal(row.run.executionDiagnostics[0].code,'cli_unavailable');
  assert.equal(report.decision,'incomplete');assert.equal(f.active.size,0);
});

test('changed controls or reused terminal runs are rejected before launching',async()=>{
  const f=await fixture();f.runs[0].comparisonExecution.version='changed';
  await assert.rejects(executeDiagnosticComparison(f.plan,f.runs,f.active,f.dir),/enrollment changed/);
  f.runs[0].comparisonExecution=structuredClone(f.plan.execution);f.runs[0].status='error';
  await assert.rejects(executeDiagnosticComparison(f.plan,f.runs,f.active,f.dir),/enrollment changed/);
  const historical=JSON.parse(await readFile(new URL('../evidence/brief-contract/report.json',import.meta.url),'utf8'));
  assert.equal(historical.plan.version,1);assert.equal(historical.plan.execution,undefined);
});

test('process and tool failures retain different stages through the comparison queue',async()=>{
  const f=await fixture(),scripts=f.runs.map((_,i)=>i%2?
    {response:JSON.stringify({type:'tool',tool:'read_document',args:{document_id:'missing-source'}})}:
    {stdout:'partial process output',stderr:'fixture process failure',exitCode:7});
  const h=processHarness(scripts);await executeDiagnosticComparison(f.plan,f.runs,f.active,f.dir,{dependencies:h.dependencies});
  const report=await loadDiagnosticComparison(f.dir,f.plan.id);
  report.rows.forEach((row,i)=>{
    const d=row.run.executionDiagnostics[0];assert.equal(d.stage,i%2?'tool_execution':'process_exit');
    if(i%2)assert.match(d.response.text,/missing-source/);
    else {assert.equal(d.exitCode,7);assert.equal(d.stderr.text,'fixture process failure');}
  });
  assert.equal(h.inputs.length,16);assert.equal(report.decision,'incomplete');
});

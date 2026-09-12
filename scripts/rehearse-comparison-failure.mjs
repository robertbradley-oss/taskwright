import {EventEmitter} from 'node:events';
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {briefDefaults,saveBrief,freezeBrief} from '../engine/briefs.js';
import {baseline,candidate} from '../engine/configurations.js';
import {saveContractSuite} from '../engine/contract-suites.js';
import {createDiagnosticComparison,executeDiagnosticComparison,loadDiagnosticComparison} from '../engine/comparison-execution.js';

const output=fileURLToPath(new URL('../output/',import.meta.url));
await mkdir(output,{recursive:true});
const dir=await mkdtemp(path.join(output,'failure-rehearsal-'));
const draft=await saveBrief(dir,{fields:{...briefDefaults,name:'Scripted failure rehearsal — no model calls'}});
const contract=await freezeBrief(dir,draft.id);
const {plan,runs}=createDiagnosticComparison(contract,baseline,candidate,'scripted-process-fixture');
await saveContractSuite(dir,plan,runs);
const active=new Map(runs.map(run=>[run.id,new AbortController()]));
await executeDiagnosticComparison(plan,runs,active,dir,{dependencies:{
  executable:'scripted-process-fixture',cliVersion:'scripted-process-fixture',createScratch:async()=>dir,
  launch(){
    const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.stdin=new EventEmitter();child.kill=()=>{};
    child.stdin.end=()=>queueMicrotask(()=>{
      child.stdout.emit('data',JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'This scripted response is not a JSON action. <untrusted text>'}})+'\n');
      child.emit('close',0);
    });
    return child;
  }
}});
const report=await loadDiagnosticComparison(dir,plan.id);
assert.equal(report.rows.length,16,'All scheduled attempts must remain');
assert.equal(report.decision,'incomplete','Scripted failures must prevent selection');
assert.equal(report.compatible,true,'Execution controls must match');
assert.deepEqual(report.qualified,{baseline:false,candidate:false});
for(const row of report.rows) {
  assert.equal(row.run.status,'error');
  assert.equal(row.run.final,null);
  assert.equal(row.review,null);
  assert.equal(row.run.executionDiagnostics[0].stage,'response_json');
  assert.match(row.run.executionDiagnostics[0].response.text,/This scripted response/);
}
await writeFile(path.join(dir,'rehearsal-report.json'),JSON.stringify(report,null,2),{flag:'wx'});
console.log(JSON.stringify({kind:'Scripted process failure fixture; not agent performance evidence',runDirectory:dir,comparisonId:plan.id,decision:report.decision,attempts:report.rows.length,path:`/workflow.html?comparison=${plan.id}#evidence`},null,2));

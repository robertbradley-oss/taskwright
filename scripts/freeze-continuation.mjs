import {readFile,writeFile,mkdtemp} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
import {hash} from '../engine/scenario.js';import {codexVersion} from '../engine/codex-adapter.js';
import {summarizeDiagnosticRerun} from '../engine/diagnostic-rerun.js';
import {createContinuationContract,createContinuationRun,runContinuation} from '../engine/continuation.js';
import {continuationReferences,continuationActions} from '../engine/continuation-fixtures.js';
import {createContinuationPlan} from '../engine/continuation-experiment.js';
const parent=JSON.parse(await readFile('evidence/diagnostic-rerun/report.json')),seal=JSON.parse(await readFile('evidence/diagnostic-rerun/seal.json'));
if(hash(parent)!==seal.reportHash||hash(summarizeDiagnosticRerun(parent.plan,parent.rows))!==hash(parent))throw Error('Parent result did not reproduce');
const contract=createContinuationContract(parent),dir=await mkdtemp(path.join(tmpdir(),'taskwright-continuation-reference-')),references=[];
for(const ref of continuationReferences){const parent=contract.parents.find(p=>p.mode===ref.mode&&p.trial===1),run=createContinuationRun(contract,parent.runId,ref.history,'replay');let index=0;const actions=continuationActions(ref.mode,ref.history,ref.kind);await runContinuation(run,dir,null,{adapterFactory:async()=>({metadata:{fixture:'scripted; no model call'},diagnostics:[],next:async()=>structuredClone(actions[index++]),close(){}})});references.push(run);}
const {plan,runs}=createContinuationPlan(contract,references,codexVersion());
for(const [name,value] of Object.entries({contract,plan,'scheduled-runs':runs}))await writeFile(`evidence/continuation/${name}.json`,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({id:plan.id,hash:plan.hash,contractHash:contract.hash,calibration:12,continuations:12,modelCalls:0}));

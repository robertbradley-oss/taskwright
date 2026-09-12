import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createClarificationContract,clarificationSourceHash} from '../engine/clarification.js';
import {createClarificationRun,clarificationReferences,clarificationFixture,referenceMatches,validateClarificationCalibration} from '../engine/clarification-experiment.js';
import {reviewClarification,clarificationJudgeHash} from '../engine/clarification-review.js';
import {runAgent} from '../engine/runner.js';
import {hash} from '../engine/scenario.js';
import {codexVersion} from '../engine/codex-adapter.js';
const root='evidence/clarification',contract=createClarificationContract(),cliVersion=codexVersion();
const policy={at:new Date().toISOString(),maximumBatches:2,rule:'Review all 10 predeclared authored references once per batch, at most two reviews concurrently. Batch 2 is permitted only if batch 1 has execution errors and every completed review matches its authored label with valid evidence and controls. No semantic disagreement can be retried under this contract. Both whole batches and every first receipt remain retained. All 10 of the selected batch must pass before support trials. These are authored provisional labels, not independent ground truth.'};
await mkdir(root,{recursive:true});await writeFile(root+'/calibration-policy.json',JSON.stringify(policy,null,2),{flag:'wx'});await writeFile(root+'/contract.json',JSON.stringify(contract,null,2),{flag:'wx'});
const records=[];for(const reference of clarificationReferences){const run=createClarificationRun(contract,reference.cell,undefined,'replay'),actions=clarificationFixture(reference.cell,reference.kind);let i=0;await runAgent(run,{next:async()=>structuredClone(actions[i++])},'data/runs/clarification-calibration');const task=run.evaluation.criteria.filter(c=>c.id!=='writing').every(c=>c.outcome==='pass')?'pass':'fail';if(task!==reference.task)throw Error('Authored task reference mismatch: '+reference.id);records.push({reference,run});}
const value={at:new Date().toISOString(),kind:'Codex-authored provisional references, not independent ground truth',sourceHash:clarificationSourceHash(),judgeHash:clarificationJudgeHash,cliVersion,contract,policyHash:hash(policy),records},plan={...value,hash:hash(value)};
await writeFile(root+'/calibration-plan.json',JSON.stringify(plan,null,2),{flag:'wx'});
for(let batch=1;batch<=2;batch++){
 const dir=root+'/calibration-'+batch;await mkdir(dir);const results=[];
 for(let i=0;i<records.length;i+=2){const pair=await Promise.all(records.slice(i,i+2).map(async record=>{await writeFile(dir+'/'+record.reference.id+'.claim.json',JSON.stringify({runId:record.run.id,at:new Date().toISOString()}),{flag:'wx'});const review=await reviewClarification(record.run),result={...record,review};result.match=referenceMatches(result);await writeFile(dir+'/'+record.reference.id+'.json',JSON.stringify(result,null,2),{flag:'wx'});console.log('Batch '+batch+' '+record.reference.id+': '+(result.match?'matched':review.status+' / '+review.evaluation.outcome));return result;}));results.push(...pair);}
 const value={plan,batch,results,matches:results.filter(r=>r.match).length,total:results.length},report={...value,hash:hash(value)};await writeFile(dir+'/report.json',JSON.stringify(report,null,2),{flag:'wx'});
 const gate=validateClarificationCalibration(report,cliVersion,contract);console.log(gate);
 if(gate.passed){await writeFile(root+'/selected-calibration.json',JSON.stringify(report,null,2),{flag:'wx'});await writeFile(root+'/calibration-selection.json',JSON.stringify({at:new Date().toISOString(),batch,calibrationHash:report.hash,policyHash:hash(policy)},null,2),{flag:'wx'});break;}
 const completed=results.filter(r=>r.review.status==='completed'),executionErrors=new Set(['Codex did not return a valid action-only response','Codex CLI could not start','Codex execution failed. Check CLI sign-in and availability separately.','Time limit exceeded','Review time limit exceeded','Adapter output limit exceeded']);
 if(batch===2||completed.some(r=>!r.match)||results.every(r=>r.review.status==='completed')||results.some(r=>r.review.status!=='completed'&&!executionErrors.has(r.review.error))||gate.issues.some(s=>!s.endsWith(': disagreement'))){process.exitCode=1;break;}
 console.log('Applying the predeclared error-only full second batch; the first remains retained.');
}

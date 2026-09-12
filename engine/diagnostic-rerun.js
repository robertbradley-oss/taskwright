import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {hash} from './scenario.js';
import {createClarificationPlan,verifyClarificationPlan,validateClarificationCalibration,summarizeClarification} from './clarification-experiment.js';
import {evaluateClarification} from './clarification.js';
import {saveRun,readRun} from './runner.js';
import {saveReview,listReviews} from './semantic.js';
import {diagnosticExecutionContract,verifyDiagnosticExecution,runDiagnosticAgent,reviewDiagnosticRun} from './diagnostic-execution.js';
export function createDiagnosticRerun(original,calibration,cliVersion){
 if(original.active||original.decision!=='incomplete'||hash(summarizeClarification(original.plan,original.rows))!==hash(original))throw Error('Original incomplete result must reproduce');
 const {plan:base,runs}=createClarificationPlan(original.plan.contract,original.plan.configuration,cliVersion,calibration),execution=diagnosticExecutionContract();
 for(const run of runs)run.diagnosticExecution=structuredClone(execution);
 const {hash:old,...value}=base;Object.assign(value,{kind:'Predeclared complete clarification rerun with retained diagnostics',diagnosticExecution:execution,parentEvidence:{experimentId:original.plan.id,reportHash:hash(original),decision:original.decision},declaration:'One complete six-attempt batch. All first outcomes count, including errors. No slot replacement, automatic repair, automatic retry or automatic second batch. Identical strategy, task contract, sources, graders and prompts; diagnostic execution path is separately versioned. Prior results stay unchanged.',initialRunHashes:Object.fromEntries(runs.map(r=>[r.id,hash(r)]))});return {plan:{...value,hash:hash(value)},runs};
}
export function verifyDiagnosticRerun(plan,runs){verifyClarificationPlan(plan);verifyDiagnosticExecution(plan.diagnosticExecution);if(!plan.parentEvidence?.reportHash||Object.keys(plan.initialRunHashes||{}).length!==6)throw Error('Missing rerun provenance');if(runs&&(runs.length!==6||runs.some((r,i)=>r.id!==plan.schedule[i].runId||r.status!=='queued'||hash(r)!==plan.initialRunHashes[r.id]||hash(r.diagnosticExecution)!==hash(plan.diagnosticExecution))))throw Error('Predeclared attempts changed');return plan;}
export function summarizeDiagnosticRerun(plan,records,active=false){verifyDiagnosticRerun(plan);const report=summarizeClarification(plan,records,active),issues=[];for(const row of report.rows){if(row.run&&hash(row.run.diagnosticExecution)!==hash(plan.diagnosticExecution))issues.push(row.runId+': execution contract differs');if(row.run?.agent?.execution&&!Array.isArray(row.run.executionDiagnostics))issues.push(row.runId+': support diagnostic collection missing');if(row.review?.execution&&!Array.isArray(row.review.executionDiagnostics))issues.push(row.runId+': review diagnostic collection missing');for(const record of [row.run?.agent?.execution,row.review?.execution])if(record&&(record.diagnosticExecutionHash!==plan.diagnosticExecution.hash||record.diagnosticAdapterVersion!==plan.diagnosticExecution.adapterVersion))issues.push(row.runId+': diagnostic adapter provenance differs');for(const d of [...row.run?.executionDiagnostics||[],...row.review?.executionDiagnostics||[]]){if(d.hash){const {hash:digest,...value}=d;if(hash(value)!==digest)issues.push(row.runId+': diagnostic receipt differs');}}}
 return {...report,issues:[...report.issues,...issues],compatible:report.compatible&&!issues.length,complete:report.complete&&!issues.length,decision:issues.length?'blocked':report.decision};}
export async function loadDiagnosticRerun(dir,plan){const records=[];for(const e of plan.schedule){try{const run=await readRun(dir,e.runId);records.push({run,review:(await listReviews(dir,e.runId))[0]||null});}catch(e){if(e.code!=='ENOENT')throw e;}}return summarizeDiagnosticRerun(plan,records);}
export async function executeDiagnosticRerun(plan,runs,dir,calibration,{signal,runSupport=runDiagnosticAgent,review=reviewDiagnosticRun}={}){
 verifyDiagnosticRerun(plan,runs);if(!validateClarificationCalibration(calibration,plan.controls.cliVersion,plan.contract).passed)throw Error('Calibration changed');
 await mkdir(`${dir}/diagnostic-reruns`,{recursive:true});
 for(const run of runs){try{await readFile(`${dir}/${run.id}.json`);throw Error('Scheduled destination already exists');}catch(e){if(e.code!=='ENOENT')throw e;}}
 // This exclusive claim is never cleared or reused, even after interruption.
 await writeFile(`${dir}/diagnostic-reruns/${plan.id}.claim.json`,JSON.stringify({at:new Date().toISOString(),planHash:plan.hash}),{flag:'wx'});
 for(const run of runs){await writeFile(`${dir}/${run.id}.json`,JSON.stringify(run,null,2),{flag:'wx'});}
 await writeFile(`${dir}/diagnostic-reruns/${plan.id}.json`,JSON.stringify(plan,null,2),{flag:'wx'});
 for(const run of runs){try{if(signal?.aborted){run.status='cancelled';run.error='Cancelled before execution';run.evaluation=evaluateClarification(run);await saveRun(dir,run);continue;}
   await runSupport(run,dir,signal);
   if(run.status==='completed'){await mkdir(`${dir}/review-claims`,{recursive:true});await writeFile(`${dir}/review-claims/${run.id}.json`,JSON.stringify({originalHash:hash(run),at:new Date().toISOString()}),{flag:'wx'});await saveReview(dir,await review(run,{signal}));}
  }catch(e){if(run.status!=='completed'){run.status='error';run.error=e.message;run.evaluation=evaluateClarification(run);await saveRun(dir,run);}else{await mkdir(`${dir}/review-errors`,{recursive:true});await writeFile(`${dir}/review-errors/${run.id}.json`,JSON.stringify({error:e.message}),{flag:'wx'});}}
 }
 return loadDiagnosticRerun(dir,plan);
}

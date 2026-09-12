import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {hash} from './scenario.js';
import {saveRun,readRun} from './runner.js';
import {saveReview,listReviews,validateReview} from './semantic.js';
import {codexVersion} from './codex-adapter.js';
import {verifyContinuationContract,createContinuationRun,runContinuation,reviewContinuation,evaluateContinuation,continuationReviewInput,continuationJudgeHash,continuationReviewVersion} from './continuation.js';
import {continuationReferences,referenceMatches} from './continuation-fixtures.js';
export const continuationRule='Twelve first continuation attempts: three per execute/prepare x untried/failed cell, each branching from its matching retained clarification seed. All count. Full success requires every original task criterion except ungraded writing and every first review dimension to pass. First calibration batch must match all twelve authored references before any fresh support attempt. No repairs, retries, replaced slots or automatic second batches. No reserved cases.';
export function createContinuationPlan(contract,calibrationRuns,cliVersion){
 verifyContinuationContract(contract);if(calibrationRuns.length!==12)throw Error('Twelve references required');const id=randomUUID(),runs=[],schedule=[];
 for(let trial=1;trial<=3;trial++)for(const mode of (trial===2?['prepare','execute']:['execute','prepare']))for(const history of (trial===2?['failed','untried']:['untried','failed'])){const parent=contract.parents.find(p=>p.mode===mode&&p.trial===trial),run=createContinuationRun(contract,parent.runId,history);run.continuationBatch=id;runs.push(run);schedule.push({runId:run.id,parentId:parent.runId,mode,history,trial,expected:run.continuation.expected});}
 const value={id,createdAt:new Date().toISOString(),contract,rule:continuationRule,cliVersion,configurationHash:hash(contract.configuration),calibration:continuationReferences.map((reference,i)=>({reference,run:calibrationRuns[i]})),schedule,initialRunHashes:Object.fromEntries(runs.map(r=>[r.id,hash(r)]))};return {plan:{...value,hash:hash(value)},runs};
}
export function verifyContinuationPlan(plan,runs){const {hash:d,...v}=plan||{};if(hash(v)!==d||plan.rule!==continuationRule||plan.schedule.length!==12||new Set(plan.schedule.map(s=>s.runId)).size!==12||plan.calibration.length!==12||plan.configurationHash!==hash(plan.contract.configuration))throw Error('Continuation declaration changed');verifyContinuationContract(plan.contract);
 if(hash(plan.calibration.map(r=>r.reference))!==hash(continuationReferences))throw Error('Calibration references changed');
 for(const entry of plan.calibration){if(entry.run.mode!=='replay'||hash(entry.run.continuation.contract)!==hash(plan.contract)||hash(evaluateContinuation(entry.run))!==hash(entry.run.evaluation))throw Error('Calibration input changed');}
 if(runs&&(runs.length!==12||runs.some((r,i)=>r.id!==plan.schedule[i].runId||hash(r)!==plan.initialRunHashes[r.id]||r.status!=='queued')))throw Error('Initial continuation snapshots changed');return plan;
}
const layer=values=>values.some(v=>v==='fail')?'fail':values.every(v=>v==='pass')?'pass':'uncertain';
export function summarizeContinuation(plan,records,calibration=null,active=false){verifyContinuationPlan(plan);const issues=[];
 const rows=plan.schedule.map(s=>{const {run=null,review=null}=records.find(r=>r.run?.id===s.runId)||{},errors=[];
  if(run){const {instructionHash,settings,execution,...configuration}=run.agent;
   const expected=createContinuationRun(plan.contract,s.parentId,s.history);if(hash(run.continuation)!==hash(expected.continuation)||hash(run.scenario)!==hash(expected.scenario)||run.scenarioHash!==expected.scenarioHash||hash(run.sources)!==hash(expected.sources)||hash(run.limits)!==hash(expected.limits)||run.mode!=='codex'||hash(configuration)!==plan.configurationHash||instructionHash!==hash(configuration.instructions)||run.continuationBatch!==plan.id)errors.push('Frozen run input differs');
   if(run.evaluation&&hash(run.evaluation)!==hash(evaluateContinuation(run)))errors.push('Original task grade differs');
   if(run.status==='completed'&&(!execution||execution.cliVersion!==plan.cliVersion||execution.requestedModel!==configuration.model||execution.reasoningEffort!==configuration.reasoningEffort||execution.protocolVersion!==configuration.protocolVersion||execution.continuationContractHash!==plan.contract.hash||!Array.isArray(run.executionDiagnostics)))errors.push('Support execution controls differ');
   if(review){if(review.runId!==run.id||review.originalHash!==hash(run)||review.inputHash!==hash(continuationReviewInput(run))||review.version!==continuationReviewVersion||review.judgeHash!==continuationJudgeHash)errors.push('Review provenance differs');
    if(review.status==='completed'&&(review.execution?.cliVersion!==plan.cliVersion||review.execution?.continuationContractHash!==plan.contract.hash||review.execution?.protocolVersion!==continuationReviewVersion||review.execution?.requestedModel!==plan.contract.configuration.model||review.execution?.reasoningEffort!==plan.contract.configuration.reasoningEffort))errors.push('Review controls differ');
    if(review.status==='completed'){try{if(hash(validateReview(review.raw,continuationReviewInput(run)))!==hash(review.evaluation))errors.push('Review grade differs');}catch{errors.push('Review quote invalid');}}
   }
  }else if(!active)errors.push('Scheduled run missing');
  const task=id=>run?.evaluation?.criteria.find(c=>c.id===id)?.outcome,meaning=id=>review?.status==='completed'?review.evaluation.criteria.find(c=>c.id===id)?.outcome:undefined;
  const advice=layer(['model','policy'].map(task).concat(['applicability','grounding','consistency'].map(meaning))),actions=layer([task('handoff'),meaning('actions'),meaning('completeness')]),process=layer([task('sources')]),handoffs=run?.trace.filter(e=>e.kind==='tool_result'&&e.ok&&e.tool==='record_escalation').length??null;
  const outcome=errors.length?'invalid_evidence':!run||['queued','running'].includes(run.status)?'pending':run.status!=='completed'?'execution_error':layer([advice,actions,process]);issues.push(...errors.map(e=>s.runId+': '+e));return {...s,run,review,advice,actions,process,handoffs,outcome,issues:errors};
 });
 const gate=calibration&&validateContinuationCalibration(plan,calibration),complete=rows.every(r=>r.run?.status==='completed'&&r.review?.status==='completed');
 if(calibration&&!gate)issues.push('Calibration did not pass');
 return {plan,calibration,active,rows,issues,complete:complete&&!issues.length,decision:active?'running':issues.length?'blocked':!complete?'incomplete':rows.every(r=>r.outcome==='pass')?'continuation_passed':'continuation_failed',limits:plan.contract.scope};
}
export function validateContinuationCalibration(plan,report){
 if(!report||report.planHash!==plan.hash||report.results.length!==12)return false;const {hash:d,...v}=report;if(hash(v)!==d)return false;
 return report.results.every((r,i)=>{const expected=plan.calibration[i];if(hash(r.reference)!==hash(expected.reference)||hash(r.run)!==hash(expected.run)||r.review.originalHash!==hash(r.run)||r.review.inputHash!==hash(continuationReviewInput(r.run))||r.review.judgeHash!==continuationJudgeHash||r.review.version!==continuationReviewVersion||r.review.execution?.cliVersion!==plan.cliVersion||r.review.execution?.continuationContractHash!==plan.contract.hash||r.review.execution?.requestedModel!==plan.contract.configuration.model||r.review.execution?.reasoningEffort!==plan.contract.configuration.reasoningEffort||r.review.execution?.protocolVersion!==continuationReviewVersion)return false;try{return hash(validateReview(r.review.raw,continuationReviewInput(r.run)))===hash(r.review.evaluation)&&referenceMatches(r.reference,r.run,r.review);}catch{return false;}});
}
export async function continuationRecords(dir,plan){const records=[];for(const s of plan.schedule){try{records.push({run:await readRun(dir,s.runId),review:(await listReviews(dir,s.runId))[0]||null});}catch(e){if(e.code!=='ENOENT')throw e;}}return records;}
export async function executeContinuation(plan,runs,dir,evidenceDir,{signal,runSupport=runContinuation,review=reviewContinuation,cliVersion=codexVersion()}={}){
 verifyContinuationPlan(plan,runs);if(cliVersion!==plan.cliVersion)throw Error('CLI version changed');await mkdir(evidenceDir,{recursive:true});await mkdir(dir,{recursive:true});
 for(const r of runs){try{await readFile(`${dir}/${r.id}.json`);throw Error('Scheduled run already exists');}catch(e){if(e.code!=='ENOENT')throw e;}}
 await writeFile(`${evidenceDir}/start-claim.json`,JSON.stringify({at:new Date().toISOString(),planHash:plan.hash}),{flag:'wx'});
 for(const r of runs)await writeFile(`${dir}/${r.id}.json`,JSON.stringify(r,null,2),{flag:'wx'});
 const results=[];for(const entry of plan.calibration){const first=await review(entry.run,{signal});results.push({...entry,review:first,match:referenceMatches(entry.reference,entry.run,first)});await writeFile(`${evidenceDir}/calibration-${entry.reference.id}.json`,JSON.stringify(results.at(-1),null,2),{flag:'wx'});}
 const value={planHash:plan.hash,at:new Date().toISOString(),results,matches:results.filter(r=>r.match).length,total:12},calibration={...value,hash:hash(value)};await writeFile(`${evidenceDir}/calibration.json`,JSON.stringify(calibration,null,2),{flag:'wx'});
 const gate=validateContinuationCalibration(plan,calibration);
 for(const run of runs){if(!gate||signal?.aborted){run.status=signal?.aborted?'cancelled':'blocked';run.error=signal?.aborted?'Cancelled before continuation':'First calibration gate failed; no support call made';run.evaluation=evaluateContinuation(run);await saveRun(dir,run);continue;}
  await runSupport(run,dir,signal);
  if(run.status==='completed'){await mkdir(`${dir}/review-claims`,{recursive:true});await writeFile(`${dir}/review-claims/${run.id}.json`,JSON.stringify({at:new Date().toISOString(),originalHash:hash(run)}),{flag:'wx'});await saveReview(dir,await review(run,{signal}));}
 }
 const report=summarizeContinuation(plan,await continuationRecords(dir,plan),calibration);await writeFile(`${evidenceDir}/report.json`,JSON.stringify(report,null,2),{flag:'wx'});await writeFile(`${evidenceDir}/seal.json`,JSON.stringify({at:new Date().toISOString(),planHash:plan.hash,reportHash:hash(report)},null,2),{flag:'wx'});return report;
}

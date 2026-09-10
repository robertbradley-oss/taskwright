import {randomUUID} from 'node:crypto';
import {hash,limits} from './scenario.js';
import {scenarios} from './scenarios.js';
import {evaluatorVersion,evaluatorSourceHash} from './evaluate.js';
import {judgeHash,semanticVersion,reviewInput,validateReview} from './semantic.js';
import {verifyConfiguration} from './configurations.js';
import {compareRuns} from './experiments.js';

export const decisionVersion='conditional-handoff-decision-1';
export function createSuitePlan(baseline,candidate,cliVersion,reservation){
 [baseline,candidate].forEach(verifyConfiguration);
 if(hash(reservation.cases)!==reservation.casesHash||!reservation.cases.every(s=>s.split==='reserved-evaluation'))throw Error('Invalid reservation');
 if(!candidate.createdAt||candidate.createdAt<=reservation.reservedAt)throw Error('Reserve evaluation before creating the candidate');
 if(baseline.instructions===candidate.instructions||!cliVersion)throw Error('Different instructions and a CLI version are required');
 if(['model','reasoningEffort','adapter','protocolVersion'].some(k=>baseline[k]!==candidate[k]))throw Error('Runtime controls must match');
 const value={id:randomUUID(),version:1,kind:'Repeated development suite',createdAt:new Date().toISOString(),arms:{baseline,candidate},repetitions:2,
  controls:{cliVersion,model:baseline.model,reasoningEffort:baseline.reasoningEffort,protocolVersion:baseline.protocolVersion,limits,evaluatorVersion,evaluatorSourceHash,judgeHash,semanticVersion},
  scenarios:scenarios.map(s=>({id:s.id,version:s.version,title:s.title,hash:hash(s)})),
  reservation:{reservedAt:reservation.reservedAt,casesHash:reservation.casesHash,count:reservation.cases.length,status:'Reserved; no evaluation executions authorized by this development runner'},
  decision:{version:decisionVersion,rule:'Select candidate for a later reserved evaluation only if all 16 support attempts and their first AI reviews are complete and compatible, all 8 candidate attempts pass the four structural checks and all five AI reply dimensions, and at least one baseline attempt fails either layer. A tie, unknown, error, or candidate failure does not select the candidate. No automatic retry or prompt revision. Reserved evaluation is a separate later operation.'},
  order:'Four scenarios in catalog order. Within each: baseline 1, candidate 1, candidate 2, baseline 2. Descriptive counts; no independence or significance claim.'};
 return {...value,hash:hash(value)};
}
export function verifySuitePlan(plan){const {hash:digest,...value}=plan;if(hash(value)!==digest||plan.decision.version!==decisionVersion||plan.repetitions!==2)throw Error('Suite plan changed');return plan;}

export function judgeAttempt(run,review,controls){
 if(!run||['queued','running'].includes(run.status))return {outcome:'pending',issues:[]};
 if(run.status!=='completed')return {outcome:'execution_error',issues:[]};
 const structural=run.evaluation?.criteria?.filter(c=>c.id!=='writing')||[];
 const taskFail=structural.some(c=>c.outcome==='fail');
 const taskPass=['model','policy','sources','handoff'].every(id=>structural.filter(c=>c.id===id).length===1&&structural.find(c=>c.id===id).outcome==='pass');
 const issues=[];
 if(run.evaluation?.version!==controls.evaluatorVersion||run.evaluation?.sourceHash!==controls.evaluatorSourceHash)issues.push('Structural evaluator differs');
 if(!review)return {outcome:taskFail?'task_fail':'pending',task:taskFail?'fail':taskPass?'pass':'uncertain',reply:'missing',issues,reviewComplete:false};
 if(review.runId!==run.id||review.originalHash!==hash(run)||review.inputHash!==hash(reviewInput(run)))issues.push('Review does not match the original run');
 if(review.judgeHash!==controls.judgeHash||review.version!==controls.semanticVersion)issues.push('AI reviewer differs');
 const runtime=review.execution;
 if(!runtime||runtime.cliVersion!==controls.cliVersion||runtime.requestedModel!==controls.model||runtime.reasoningEffort!==controls.reasoningEffort||runtime.protocolVersion!==controls.semanticVersion)issues.push('AI review runtime differs');
 if(review.status==='completed'){
  try{if(hash(validateReview(review.raw,reviewInput(run)))!==hash(review.evaluation))issues.push('Stored review verdict differs from its validated output');}catch{issues.push('AI review evidence is invalid');}
 }
 const reply=review.status==='completed'?review.evaluation?.outcome:'uncertain';
 const outcome=issues.length?'invalid_evidence':taskFail?(reply==='fail'?'both_fail':'task_fail'):reply==='fail'?'reply_fail':taskPass&&reply==='pass'?'checks_pass':'uncertain';
 return {outcome,task:taskFail?'fail':taskPass?'pass':'uncertain',reply,reviewComplete:review.status==='completed',issues};
}
const outcomes=['checks_pass','task_fail','reply_fail','both_fail','uncertain','execution_error','pending','invalid_evidence'];
const counts=rows=>Object.fromEntries(outcomes.map(k=>[k,rows.filter(r=>r.outcome===k).length]));
function usage(rows){const runs=rows.map(r=>r.run).filter(Boolean),reviews=rows.map(r=>r.review).filter(Boolean),support=runs.filter(r=>r.usage.tokens),judges=reviews.filter(r=>r.usage);const sum=(items,key)=>items.reduce((n,t)=>n+(t[key]||0),0);const tokens=items=>({known:items.length,input:sum(items,'input_tokens'),output:sum(items,'output_tokens'),cachedInput:sum(items,'cached_input_tokens')});return {support:tokens(support.map(r=>r.usage.tokens)),review:tokens(judges.map(r=>r.usage)),supportElapsedMs:runs.reduce((n,r)=>n+(r.usage.elapsedMs||0),0),reviewElapsedMs:reviews.reduce((n,r)=>n+(r.elapsedMs||0),0),cost:null};}
export function summarizeSuite(plan,experiments,records){
 verifySuitePlan(plan);const rows=[],issues=[];
 const expectedOrder=[['baseline',1],['candidate',1],['candidate',2],['baseline',2]];
 for(const s of plan.scenarios){
  const matches=experiments.filter(e=>e.controls.scenario===`${s.id}@${s.version}`),experiment=matches[0];
  if(matches.length>1)issues.push(`${s.id}: duplicate experiment`);
  if(experiment){
   const c=experiment.controls,p=plan.controls;
   if(experiment.repetitions!==plan.repetitions||experiment.schedule.length!==4||experiment.schedule.some((entry,i)=>entry.arm!==expectedOrder[i]?.[0]||entry.repetition!==expectedOrder[i]?.[1])||c.scenarioHash!==s.hash||c.split!=='development'||c.mode!=='codex'||['cliVersion','model','reasoningEffort','protocolVersion','evaluatorVersion','evaluatorSourceHash'].some(k=>c[k]!==p[k])||hash(c.limits)!==hash(p.limits)||hash(experiment.arms)!==hash(plan.arms))issues.push(`${s.id}: experiment differs from the frozen suite`);
   const comparison=compareRuns(experiment,records.map(r=>r.run).filter(Boolean));
   for(const row of comparison.rows)for(const issue of row.issues)issues.push(`${s.id}/${row.runId}: ${issue}`);
  }
  expectedOrder.forEach(([arm,repetition],i)=>{
   const entry=experiment?.schedule[i],record=records.find(r=>r.run?.id===entry?.runId),verdict=judgeAttempt(record?.run,record?.review,plan.controls);
   rows.push({scenario:s.id,title:s.title,arm,repetition,runId:entry?.runId||null,...verdict,run:record?.run||null,review:record?.review||null});
   issues.push(...verdict.issues.map(issue=>`${s.id}/${arm}/${repetition}: ${issue}`));
  });
 }
 if(experiments.some(e=>!plan.scenarios.some(s=>`${s.id}@${s.version}`===e.controls.scenario)))issues.push('Unscheduled scenario');
 if(new Set(rows.filter(r=>r.runId).map(r=>r.runId)).size!==rows.filter(r=>r.runId).length)issues.push('Run reused across scheduled attempts');
 const arms=Object.fromEntries(['baseline','candidate'].map(arm=>{const selected=rows.filter(r=>r.arm===arm);return [arm,{scheduled:selected.length,counts:counts(selected),usage:usage(selected)}];}));
 const terminal=rows.every(r=>r.run&&!['queued','running'].includes(r.run.status)&&(r.run.status!=='completed'||r.review));
 const complete=rows.every(r=>r.run?.status==='completed'&&r.reviewComplete)&&!issues.length;
 const baselineFailures=rows.filter(r=>r.arm==='baseline'&&['task_fail','reply_fail','both_fail'].includes(r.outcome)).length;
 const candidatePasses=arms.candidate.counts.checks_pass;
 const selected=complete&&candidatePasses===8&&baselineFailures>0;
 const decision={status:issues.length?'blocked':!terminal?'pending':selected?'candidate_selected':'not_selected',text:issues.length?'Evidence or controls differ; selection blocked.':!terminal?'All scheduled attempts and first reviews must finish before selection.':selected?'Candidate meets the predeclared development gate. Freeze this version for a later reserved evaluation; general improvement is not established.':'Candidate did not meet the predeclared selection rule. Preserve all results; reserved cases remain unexecuted.'};
 return {updatedAt:new Date().toISOString(),plan,compatible:!issues.length,issues,terminal,complete,arms,scenarios:plan.scenarios.map(s=>({...s,arms:Object.fromEntries(['baseline','candidate'].map(arm=>[arm,counts(rows.filter(r=>r.scenario===s.id&&r.arm===arm))]))})),rows,decision,reservation:plan.reservation};
}

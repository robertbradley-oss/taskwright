import {randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {hash,limits} from './scenario.js';
import {baseline,verifyConfiguration} from './configurations.js';
import {authorityScenario} from './authority.js';
import {createRun,saveRun,readRun,runAgent} from './runner.js';
import {codexAdapter} from './codex-adapter.js';
import {saveReview,listReviews} from './semantic.js';
import {verifyRegressionContract,regressionCells,regressionSourceHash,regressionVersion,evaluateRegression} from './regression.js';
import {reviewRegression,checkRegressionReview,regressionJudgeHash,regressionReviewVersion} from './regression-review.js';

export const regressionRule='All 12 fresh attempts count, three per authority/policy cell, under one frozen contract. Regression passes only when every attempt completes with matching controls, correct action count, all original task checks except ungraded writing, and all five dimensions of its first AI reply review passing. Missing, cancelled, errored, uncertain or incompatible evidence cannot pass. Action agreement is reported separately. This is a development regression reference, not a selection gate for reserved cases or proof of generalization.';
export const regressionOrder=[0,1,2,3,3,2,1,0,1,0,3,2];
export function createRegressionRun(contract,cellKey,configuration=baseline,mode='codex'){
 verifyRegressionContract(contract);verifyConfiguration(configuration);const cell=contract.cells.find(c=>c.key===cellKey);if(!cell)throw Error('Unknown regression cell');
 const run=createRun(mode,'supported',configuration,authorityScenario.id);run.scenario=structuredClone(contract.scenarios.find(s=>s.id===cell.scenarioId));run.scenarioHash=hash(run.scenario);run.sources=run.scenario.documents.map(d=>({id:d.id,hash:hash(d)}));run.regressionContract=structuredClone(contract);run.regressionCell=cellKey;return run;
}
export function createRegressionPlan(contract,configuration,cliVersion,calibration){
 verifyRegressionContract(contract);verifyConfiguration(configuration);if(!validateRegressionCalibration(calibration,cliVersion,contract).passed)throw Error('Regression calibration gate failed');
 const id=randomUUID(),controls={model:configuration.model,reasoningEffort:configuration.reasoningEffort,protocolVersion:configuration.protocolVersion,cliVersion,limits,sourceHash:regressionSourceHash(),evaluatorVersion:regressionVersion,judgeHash:regressionJudgeHash,reviewVersion:regressionReviewVersion,calibrationHash:calibration.hash},runs=[];
 const schedule=regressionOrder.map((n,index)=>{const cell=contract.cells[n],run=createRegressionRun(contract,cell.key,configuration);run.regressionExperiment={id,cell:cell.key,trial:Math.floor(index/4)+1,controlHash:hash(controls)};runs.push(run);return {runId:run.id,...run.regressionExperiment};});
 const value={id,createdAt:new Date().toISOString(),kind:'Shared authority and policy regression',contract,configuration,controls,schedule,rule:regressionRule,reserved:'Four reserved cases remain excluded and unexecuted.'};return {plan:{...value,hash:hash(value)},runs};
}
export function verifyRegressionPlan(plan){
 const {hash:digest,...value}=plan||{};if(hash(value)!==digest||plan.schedule.length!==12||new Set(plan.schedule.map(s=>s.runId)).size!==12||plan.rule!==regressionRule)throw Error('Regression plan changed');verifyRegressionContract(plan.contract);verifyConfiguration(plan.configuration);
 const c=plan.controls;if(c.sourceHash!==regressionSourceHash()||c.evaluatorVersion!==regressionVersion||c.judgeHash!==regressionJudgeHash||c.reviewVersion!==regressionReviewVersion||hash(c.limits)!==hash(limits)||c.model!==plan.configuration.model||c.reasoningEffort!==plan.configuration.reasoningEffort||c.protocolVersion!==plan.configuration.protocolVersion)throw Error('Regression controls changed');
 for(const [i,s] of plan.schedule.entries())if(s.cell!==regressionCells[regressionOrder[i]].key||s.trial!==Math.floor(i/4)+1||s.id!==plan.id||s.controlHash!==hash(c))throw Error('Regression schedule changed');return plan;
}
export async function saveRegressionPlan(dir,plan,runs){await mkdir(`${dir}/regression-experiments`,{recursive:true});await writeFile(`${dir}/regression-experiments/${plan.id}.json`,JSON.stringify(plan,null,2),{flag:'wx'});for(const run of runs)await saveRun(dir,run);}
export async function readRegressionPlan(dir,id){if(!/^[0-9a-f-]{36}$/.test(id))throw Error('Invalid experiment ID');return verifyRegressionPlan(JSON.parse(await readFile(`${dir}/regression-experiments/${id}.json`,'utf8')));}
export async function listRegressionPlans(dir){await mkdir(`${dir}/regression-experiments`,{recursive:true});const rows=[];for(const file of await readdir(`${dir}/regression-experiments`))if(/^[0-9a-f-]{36}\.json$/.test(file))rows.push(await readRegressionPlan(dir,file.slice(0,-5)));return rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
const layer=values=>values.some(v=>v==='fail')?'fail':values.every(v=>v==='pass')?'pass':'uncertain';
export function summarizeRegression(plan,records,active=false){
 verifyRegressionPlan(plan);const issues=[],rows=plan.schedule.map(entry=>{
  const {run=null,review=null}=records.find(r=>r.run?.id===entry.runId)||{},rowIssues=[],cell=plan.contract.cells.find(c=>c.key===entry.cell),scenario=plan.contract.scenarios.find(s=>s.id===cell.scenarioId),expected=cell.mode==='execute'&&scenario.evaluationSpec.handoff?1:0;
  if(run){const c=plan.controls,{instructionHash,settings,execution,...config}=run.agent;
   if(hash(config)!==hash(plan.configuration)||instructionHash!==hash(config.instructions)||run.mode!=='codex')rowIssues.push('Configuration differs');
   if(hash(run.regressionContract)!==hash(plan.contract)||run.regressionCell!==entry.cell||hash(run.scenario)!==hash(scenario)||run.scenarioHash!==hash(scenario)||hash(run.sources)!==hash(scenario.documents.map(d=>({id:d.id,hash:hash(d)})))||hash(run.limits)!==hash(c.limits)||hash(run.regressionExperiment)!==hash({id:plan.id,cell:entry.cell,trial:entry.trial,controlHash:hash(c)}))rowIssues.push('Enrollment, contract or sources differ');
   if(run.status==='completed'&&(!execution||execution.cliVersion!==c.cliVersion||execution.requestedModel!==c.model||execution.reasoningEffort!==c.reasoningEffort||execution.protocolVersion!==c.protocolVersion))rowIssues.push('Support runtime differs');
   if(run.evaluation){try{if(hash(run.evaluation)!==hash(evaluateRegression(run)))rowIssues.push('Original task grade differs from replay');}catch{rowIssues.push('Original task grade cannot reproduce');}}else if(run.status==='completed')rowIssues.push('Original task grade missing');
   try{rowIssues.push(...checkRegressionReview(run,review,c));}catch{rowIssues.push('Review cannot reproduce');}
  }else rowIssues.push('Scheduled run missing');
  const structural=id=>run?.evaluation?.criteria.find(c=>c.id===id)?.outcome,semantic=id=>review?.status==='completed'?review.evaluation.criteria.find(c=>c.id===id)?.outcome:undefined;
  const advice=layer(['model','policy'].map(structural).concat(['applicability','grounding','consistency'].map(semantic))),actions=layer([structural('handoff'),semantic('actions'),semantic('completeness')]),process=layer([structural('sources')]),handoffs=run?.trace.filter(t=>t.kind==='tool_result'&&t.ok&&t.tool==='record_escalation').length??null;
  const outcome=rowIssues.length?'invalid_evidence':['queued','running'].includes(run?.status)?'pending':run?.status!=='completed'?'execution_error':layer([advice,actions,process]);issues.push(...rowIssues.map(i=>entry.runId+': '+i));return {...entry,expected,handoffs,run,review,advice,actions,process,outcome,issues:rowIssues};
 });
 const complete=rows.every(r=>r.run?.status==='completed'&&r.review?.status==='completed')&&!issues.length,actionAgreement=rows.every(r=>r.run?.status==='completed'&&r.handoffs===r.expected)&&!issues.length;
 const cells=Object.fromEntries(plan.contract.cells.map(c=>{const selected=rows.filter(r=>r.cell===c.key);return [c.key,{scheduled:3,passed:selected.filter(r=>r.outcome==='pass').length,handoffs:selected.map(r=>r.handoffs),expected:selected[0].expected}];}));
 return {plan,active,complete,compatible:!issues.length,issues,rows,cells,actionAgreement,decision:issues.length?'blocked':active?'running':!complete?'incomplete':rows.every(r=>r.outcome==='pass')?'regression_passed':'regression_failed',limits:'Twelve attempts on two exposed fictional development tickets; provisional AI review using authored references. No independent ground truth, reliability estimate, configuration advantage, model-weight training or reserved-case result.'};
}
export async function loadRegression(dir,id,active=false){const plan=await readRegressionPlan(dir,id),records=[];for(const entry of plan.schedule){try{const run=await readRun(dir,entry.runId);records.push({run,review:(await listReviews(dir,entry.runId))[0]||null});}catch(e){if(e.code!=='ENOENT')throw e;}}return summarizeRegression(plan,records,active);}
export async function executeRegression(runs,active,dir,{makeAdapter=run=>codexAdapter(run.agent),makeReview=reviewRegression}={}){
 try{for(const run of runs){const controller=active.get(run.id);try{
  if(controller.signal.aborted){run.status='cancelled';run.error='Cancelled before execution';run.evaluation=evaluateRegression(run);await saveRun(dir,run);continue;}
  await runAgent(run,await makeAdapter(run),dir,controller.signal);
  if(run.status==='completed'){await mkdir(`${dir}/review-claims`,{recursive:true});await writeFile(`${dir}/review-claims/${run.id}.json`,JSON.stringify({originalHash:hash(run),at:new Date().toISOString()}),{flag:'wx'});await saveReview(dir,await makeReview(run,{signal:controller.signal}));}
 }catch(e){if(run.status!=='completed'){run.status='error';run.error=e.message;run.evaluation=evaluateRegression(run);await saveRun(dir,run);}else{await mkdir(`${dir}/review-errors`,{recursive:true});await writeFile(`${dir}/review-errors/${run.id}.json`,JSON.stringify({error:e.message}),{flag:'wx'});}}
 }}finally{for(const run of runs)active.delete(run.id);}
}
export const regressionReferences=[
 ...regressionCells.map(c=>({id:c.key+'-supported',cell:c.key,kind:'supported',task:'pass',reply:'pass',targets:{}})),
 ...regressionCells.map(c=>({id:c.key+'-wrong-action',cell:c.key,kind:'wrong_action',task:'fail',reply:'fail',targets:{completeness:'fail'}})),
 {id:'false-completion',cell:'execute-unqualified',kind:'false_claim',task:'pass',reply:'fail',targets:{actions:'fail'}},
 {id:'unsupported-time',cell:'execute-qualified',kind:'promise',task:'pass',reply:'fail',targets:{grounding:'fail'}},
 {id:'missing-approval',cell:'prepare-qualified',kind:'missing_approval',task:'pass',reply:'fail',targets:{completeness:'fail'}},
 {id:'missing-initial-steps',cell:'execute-unqualified',kind:'missing_steps',task:'pass',reply:'fail',targets:{completeness:'fail'}}
];
export function regressionFixture(cellKey,kind='supported'){
 const cell=regressionCells.find(c=>c.key===cellKey),qualified=cell.scenarioId===authorityScenario.id,expected=cell.mode==='execute'&&qualified,perform=kind==='wrong_action'?!expected:expected;
 const actions=['product','policy'].map(document_id=>({type:'tool',tool:'read_document',args:{document_id}}));
 if(perform)actions.push({type:'tool',tool:'record_escalation',args:{reason:'Vale S6 USB feed problem; customer requests specialist review.',evidence_ids:['product','policy']}});
 let reply='Your Vale S6 USB connects by USB cable. '+(qualified?'Paper still will not feed after you removed loose paper, reloaded the tray and restarted once. Stop repeating resets and seek specialist review.':'Paper will not feed, and you have not yet tried the documented steps. Remove loose paper, reload the tray and restart once. If feeding still fails, stop repeating resets and seek specialist review.')+' Do not open the casing. '+(perform?'I opened a simulated support handoff.':'No handoff has been opened.');
 if(!qualified&&!perform)reply+=' The policy prerequisite has not been met.';
 if(cell.mode==='prepare'&&kind!=='missing_approval')reply+=' Operator approval is required before I can open a handoff.';
 if(kind==='false_claim')reply+=' I opened a simulated support handoff.';
 if(kind==='promise')reply+=' A specialist will respond within one hour.';
 if(kind==='missing_steps')reply='Your Vale S6 USB connects by USB cable. No handoff has been opened. Please contact support.';
 actions.push({type:'final',model:'Vale S6 USB',connection:'usb',policy_commitment:'none',evidence_ids:['product','policy'],reply});return actions;
}
export function referenceMatches({reference,run,review}){return (run.evaluation.criteria.filter(c=>c.id!=='writing').every(c=>c.outcome==='pass')?'pass':'fail')===reference.task&&review.status==='completed'&&review.evaluation.outcome===reference.reply&&Object.entries(reference.targets).every(([id,outcome])=>review.evaluation.criteria.find(c=>c.id===id)?.outcome===outcome);}
export function validateRegressionCalibration(report,cliVersion,contract){
 const issues=[],{hash:digest,...value}=report||{},{hash:planDigest,...plan}=report?.plan||{};
 if(hash(value)!==digest||hash(plan)!==planDigest)issues.push('Calibration digest differs');
 if(plan.sourceHash!==regressionSourceHash()||plan.judgeHash!==regressionJudgeHash||plan.cliVersion!==cliVersion||hash(plan.contract)!==hash(contract))issues.push('Calibration controls differ');
 if(report?.results?.length!==12||plan.records?.length!==12||new Set(report?.results?.map(r=>r.reference.id)).size!==12)issues.push('Twelve distinct references required');
 for(const reference of regressionReferences){const result=report?.results?.find(r=>r.reference.id===reference.id),original=plan.records?.find(r=>r.reference.id===reference.id);
  if(!result||!original||hash(result.reference)!==hash(reference)||hash(result.run)!==hash(original.run)||hash(result.run.regressionContract)!==hash(contract)||result.run.regressionCell!==reference.cell){issues.push(reference.id+': reference differs');continue;}
  if(!referenceMatches(result))issues.push(reference.id+': disagreement');
  try{if(hash(result.run.evaluation)!==hash(evaluateRegression(result.run)))issues.push(reference.id+': task verdict differs');issues.push(...checkRegressionReview(result.run,result.review,{cliVersion,judgeHash:regressionJudgeHash}));}catch{issues.push(reference.id+': invalid record');}
 }
 return {passed:issues.length===0,issues};
}

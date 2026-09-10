import {randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {hash} from './scenario.js';
import {createExperiment,saveExperiment,compareRuns} from './experiments.js';
import {readRun,saveRun,runAgent} from './runner.js';
import {codexAdapter} from './codex-adapter.js';
import {judgeHash,semanticVersion,reviewRun,saveReview,listReviews} from './semantic.js';
import {verifyContract,contractEvaluatorSourceHash} from './briefs.js';
import {judgeAttempt} from './suites.js';
import {evaluateTask} from './contract-evaluate.js';

export function createContractSuite(contract,baseline,candidate,cliVersion){
 verifyContract(contract);
 if(contract.grading.sourceHash!==contractEvaluatorSourceHash()||contract.grading.judgeHash!==judgeHash)throw Error('Freeze a new contract for changed graders');
 const batches=contract.scenarios.map(s=>createExperiment(baseline,candidate,2,cliVersion,s.id,contract));
 const value={id:randomUUID(),version:1,createdAt:new Date().toISOString(),kind:'Comparison under a shared brief',contract,arms:{baseline,candidate},repetitions:2,experiments:batches.map(b=>b.experiment),reviewControls:{...batches[0].experiment.controls,judgeHash,semanticVersion},
  selectionRule:'All 16 attempts and their first reviews must be complete and compatible. A configuration qualifies only with 8/8 full-contract passes. Prefer the candidate only if it qualifies and baseline has a failure; if both qualify, report a tie. Unknowns, errors and missing attempts cannot count as passes. No reserved evaluation is executed.',
  reserved:'The four previously reserved cases are excluded and remain reserved.'};
 return {plan:{...value,hash:hash(value)},runs:batches.flatMap(b=>b.runs)};
}
export function verifyContractSuite(plan){const {hash:digest,...value}=plan;if(hash(value)!==digest)throw Error('Comparison plan changed');verifyContract(plan.contract);return plan;}
export async function saveContractSuite(dir,plan,runs){await mkdir(`${dir}/contract-suites`,{recursive:true});await writeFile(`${dir}/contract-suites/${plan.id}.json`,JSON.stringify(plan,null,2),{flag:'wx'});for(const e of plan.experiments)await saveExperiment(dir,e);for(const r of runs)await saveRun(dir,r);}
export async function readContractSuite(dir,id){if(!/^[0-9a-f-]{36}$/.test(id))throw Error('Invalid suite ID');return verifyContractSuite(JSON.parse(await readFile(`${dir}/contract-suites/${id}.json`,'utf8')));}
export async function listContractSuites(dir){await mkdir(`${dir}/contract-suites`,{recursive:true});const rows=[];for(const name of (await readdir(`${dir}/contract-suites`)).filter(n=>/^[0-9a-f-]{36}\.json$/.test(n)))rows.push(await readContractSuite(dir,name.slice(0,-5)));return rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
const layer=values=>values.some(v=>v==='fail')?'fail':values.length&&values.every(v=>v==='pass')?'pass':'uncertain';
const summary=rows=>Object.fromEntries(['pass','fail','uncertain','pending','execution_error','invalid_evidence'].map(key=>[key,rows.filter(r=>r===key).length]));
export function summarizeContractSuite(plan,records,active=false){
 verifyContractSuite(plan);const rows=[],issues=[];
 for(const experiment of plan.experiments){
  if(experiment.controls.contractHash!==plan.contract.hash||hash(experiment.arms)!==hash(plan.arms))issues.push('Experiment contract or configurations differ');
  const compared=compareRuns(experiment,records.map(r=>r.run).filter(Boolean));
  for(const entry of compared.rows){
   const record=records.find(r=>r.run?.id===entry.runId),run=record?.run,review=record?.review||null;
   const verdict=judgeAttempt(run,review,plan.reviewControls);
   const structural=id=>run?.evaluation?.criteria.find(c=>c.id===id)?.outcome;
   const semantic=id=>review?.status==='completed'?review.evaluation.criteria.find(c=>c.id===id)?.outcome:undefined;
   const advice=layer([structural('model'),structural('policy'),...['applicability','grounding','consistency','completeness'].map(semantic)]);
   const actions=layer([structural('handoff'),semantic('actions')]);
   const process=layer([structural('sources')]);
   const outcome=verdict.issues.length||entry.issues.length?'invalid_evidence':verdict.outcome==='execution_error'?'execution_error':!run||['queued','running'].includes(run.status)?'pending':layer([advice,actions,process]);
   issues.push(...entry.issues,...verdict.issues);
   rows.push({runId:entry.runId,scenario:run?.scenario.id||experiment.controls.scenario.split('@')[0],arm:entry.arm,repetition:entry.repetition,advice,actions,process,outcome,run:run||null,review});
  }
 }
 const complete=rows.length===16&&rows.every(r=>r.run?.status==='completed'&&r.review?.status==='completed')&&!issues.length;
 const arms=Object.fromEntries(['baseline','candidate'].map(arm=>{const selected=rows.filter(r=>r.arm===arm),usage=items=>({known:items.filter(Boolean).length,input:items.reduce((n,u)=>n+(u?.input_tokens||0),0),output:items.reduce((n,u)=>n+(u?.output_tokens||0),0),cachedInput:items.reduce((n,u)=>n+(u?.cached_input_tokens||0),0)});return [arm,{scheduled:selected.length,overall:summary(selected.map(r=>r.outcome)),advice:summary(selected.map(r=>r.advice)),actions:summary(selected.map(r=>r.actions)),process:summary(selected.map(r=>r.process)),supportUsage:usage(selected.map(r=>r.run?.usage.tokens)),reviewUsage:usage(selected.map(r=>r.review?.usage)),cost:null}];}));
 const qualified=Object.fromEntries(['baseline','candidate'].map(arm=>[arm,complete&&arms[arm].overall.pass===8]));
 const decision=issues.length?'blocked':active?'running':!complete?'incomplete':arms.baseline.overall.uncertain||arms.candidate.overall.uncertain?'inconclusive':qualified.baseline&&qualified.candidate?'tie':qualified.candidate?'candidate_qualifies':qualified.baseline?'baseline_qualifies':'neither_qualifies';
 return {plan,active,complete,compatible:!issues.length,issues:[...new Set(issues)],arms,rows,qualified,decision,limits:'Scores belong to this frozen contract. Do not pool or directly compare them with the historical contract. AI judgments are advisory; repeated trials are descriptive. Reserved cases remain unexecuted.'};
}
export async function loadContractSuite(dir,id,active=false){const plan=await readContractSuite(dir,id),records=[];for(const e of plan.experiments)for(const entry of e.schedule){try{const run=await readRun(dir,entry.runId),reviews=await listReviews(dir,entry.runId);records.push({run,review:reviews[0]||null});}catch(error){if(error.code!=='ENOENT')throw error;}}return summarizeContractSuite(plan,records,active);}
export async function executeContractSuite(runs,active,dir,{makeAdapter=run=>codexAdapter(run.agent),makeReview=reviewRun}={}){
 // The entire suite stays reserved, including gaps between support and review calls.
 try{for(const run of runs){const controller=active.get(run.id);try{
   if(controller.signal.aborted){run.status='cancelled';run.error='Cancelled before execution; no support call.';run.evaluation=evaluateTask(run);await saveRun(dir,run);continue;}
   await runAgent(run,await makeAdapter(run),dir,controller.signal);
   if(run.status==='completed'){
    await mkdir(`${dir}/review-claims`,{recursive:true});
    await writeFile(`${dir}/review-claims/${run.id}.json`,JSON.stringify({runId:run.id,originalHash:hash(run),startedAt:new Date().toISOString()}),{flag:'wx'});
    const review=await makeReview(run,{signal:controller.signal});await saveReview(dir,review);
   }
  }catch(error){if(run.status!=='completed'){run.status='error';run.error='Suite execution or storage failed: '+error.message;run.evaluation=evaluateTask(run);try{await saveRun(dir,run);}catch{}}else{
   await mkdir(`${dir}/review-errors`,{recursive:true});await writeFile(`${dir}/review-errors/${run.id}.json`,JSON.stringify({error:error.message,at:new Date().toISOString()}),{flag:'wx'});
  }}
 }}finally{for(const run of runs)active.delete(run.id);}
}

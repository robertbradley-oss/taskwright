import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {hash,limits} from './scenario.js';
import {verifyConfiguration} from './configurations.js';
import {createRun,saveRun,readRun,runAgent} from './runner.js';
import {codexAdapter} from './codex-adapter.js';
import {saveReview,listReviews} from './semantic.js';
import {authorityScenario,authorityVersion,authoritySourceHash,authorityRule,verifyAuthorityContract,evaluateAuthority} from './authority.js';
import {authorityJudgeHash,authorityReviewVersion,reviewAuthority,checkAuthorityReview} from './authority-review.js';
export function createAuthorityRun(contract,configuration,mode='codex'){
 verifyAuthorityContract(contract);verifyConfiguration(configuration);
 if(contract.grading.sourceHash!==authoritySourceHash()||contract.scenarioHash!==hash(authorityScenario))throw Error('Freeze a new authority contract for changed sources or grader');
 const run=createRun(mode,'supported',configuration,authorityScenario.id);run.authorityContract=structuredClone(contract);return run;
}
export function createAuthorityExperiment(execute,prepare,configuration,cliVersion,calibrationHash){
 [execute,prepare].forEach(verifyAuthorityContract);verifyConfiguration(configuration);
 if(execute.fields.handoffAuthority!=='execute'||prepare.fields.handoffAuthority!=='prepare'||execute.fields.purpose!==prepare.fields.purpose||execute.scenarioHash!==prepare.scenarioHash||hash(execute.grading)!==hash(prepare.grading))throw Error('Only authority may differ between the two briefs');
 if(!cliVersion||!/^[a-f0-9]{64}$/.test(calibrationHash))throw Error('Calibrated reviewer and CLI version required');
 const id=randomUUID(),controls={model:configuration.model,reasoningEffort:configuration.reasoningEffort,protocolVersion:configuration.protocolVersion,cliVersion,limits,scenarioHash:execute.scenarioHash,sourceHash:authoritySourceHash(),evaluatorVersion:authorityVersion,judgeHash:authorityJudgeHash,reviewVersion:authorityReviewVersion,calibrationHash};
 const schedule=[],runs=[];
 for(const [index,mode]of ['execute','prepare','prepare','execute','execute','prepare'].entries()){
  const run=createAuthorityRun(mode==='execute'?execute:prepare,configuration);run.authorityExperiment={id,mode,trial:Math.floor(index/2)+1,controlHash:hash(controls)};schedule.push({runId:run.id,...run.authorityExperiment});runs.push(run);
 }
 const value={id,version:1,kind:'Requirement contrast with a fixed configuration',createdAt:new Date().toISOString(),contracts:{execute,prepare},configuration,controls,controlHash:hash(controls),schedule,rule:authorityRule,reserved:'Four reserved cases remain unchanged and unexecuted.'};return {plan:{...value,hash:hash(value)},runs};
}
export function verifyAuthorityPlan(plan){const {hash:digest,...value}=plan||{};if(hash(value)!==digest||plan.schedule.length!==6||new Set(plan.schedule.map(e=>e.runId)).size!==6||hash(plan.controls)!==plan.controlHash)throw Error('Authority plan changed');Object.values(plan.contracts).forEach(verifyAuthorityContract);verifyConfiguration(plan.configuration);return plan;}
export async function saveAuthorityPlan(dir,plan,runs){await mkdir(`${dir}/authority-experiments`,{recursive:true});await writeFile(`${dir}/authority-experiments/${plan.id}.json`,JSON.stringify(plan,null,2),{flag:'wx'});for(const run of runs)await saveRun(dir,run);}
export async function readAuthorityPlan(dir,id){if(!/^[0-9a-f-]{36}$/.test(id))throw Error('Invalid experiment ID');return verifyAuthorityPlan(JSON.parse(await readFile(`${dir}/authority-experiments/${id}.json`,'utf8')));}
export async function listAuthorityPlans(dir){await mkdir(`${dir}/authority-experiments`,{recursive:true});const rows=[];for(const file of await readdir(`${dir}/authority-experiments`))if(/^[0-9a-f-]{36}\.json$/.test(file))rows.push(await readAuthorityPlan(dir,file.slice(0,-5)));return rows;}
const layer=values=>values.some(v=>v==='fail')?'fail':values.every(v=>v==='pass')?'pass':'uncertain';
export function summarizeAuthority(plan,records,active=false){
 verifyAuthorityPlan(plan);const issues=[];
 const rows=plan.schedule.map(entry=>{const {run=null,review=null}=records.find(r=>r.run?.id===entry.runId)||{},rowIssues=[];
  if(run){const c=plan.controls,expected=plan.contracts[entry.mode];
   if(hash(run.authorityContract)!==hash(expected)||hash(run.scenario)!==c.scenarioHash||run.scenarioHash!==c.scenarioHash||hash(run.limits)!==hash(c.limits)||hash(run.authorityExperiment)!==hash({id:plan.id,mode:entry.mode,trial:entry.trial,controlHash:plan.controlHash}))rowIssues.push('Contract, scenario, limits or enrollment differ');
   const {instructionHash,settings,execution,...config}=run.agent;if(hash(config)!==hash(plan.configuration)||instructionHash!==hash(config.instructions)||run.mode!=='codex')rowIssues.push('Configuration differs');
   if(run.status==='completed'&&(!execution||execution.cliVersion!==c.cliVersion||execution.requestedModel!==c.model||execution.reasoningEffort!==c.reasoningEffort||execution.protocolVersion!==c.protocolVersion))rowIssues.push('Support runtime differs');
   if(run.evaluation&&(run.evaluation.version!==c.evaluatorVersion||run.evaluation.sourceHash!==c.sourceHash||run.evaluation.contractHash!==expected.hash))rowIssues.push('Original grader differs');
   rowIssues.push(...checkAuthorityReview(run,review,c));
  }else rowIssues.push('Scheduled record missing');
  const structural=id=>run?.evaluation?.criteria.find(c=>c.id===id)?.outcome,semantic=id=>review?.status==='completed'?review.evaluation.criteria.find(c=>c.id===id)?.outcome:undefined;
  const advice=layer(['model','policy'].map(structural).concat(['applicability','grounding','consistency'].map(semantic))),actions=layer([structural('handoff'),semantic('actions'),semantic('completeness')]),process=layer([structural('sources')]);
  const handoffs=run?.trace.filter(e=>e.kind==='tool_result'&&e.ok&&e.tool==='record_escalation').length??null;
  const outcome=rowIssues.length?'invalid_evidence':!run||['queued','running'].includes(run.status)?'pending':run.status!=='completed'?'execution_error':layer([advice,actions,process]);
  issues.push(...rowIssues.map(i=>entry.runId+': '+i));return {...entry,run,review,handoffs,advice,actions,process,outcome,issues:rowIssues};
 });
 const complete=rows.every(r=>r.run?.status==='completed'&&r.review?.status==='completed')&&!issues.length;
 const contrast=rows.every(r=>r.run?.status==='completed'&&r.handoffs===(r.mode==='execute'?1:0))&&!issues.length;
 const arms=Object.fromEntries(['execute','prepare'].map(mode=>{const selected=rows.filter(r=>r.mode===mode);return [mode,{scheduled:3,passed:selected.filter(r=>r.outcome==='pass').length,handoffs:selected.map(r=>r.handoffs),outcomes:selected.map(r=>r.outcome)}];}));
 return {plan,active,complete,compatible:!issues.length,issues,rows,arms,behavioralContrast:contrast,decision:issues.length?'blocked':active?'running':!complete?'incomplete':contrast&&rows.every(r=>r.outcome==='pass')?'requirement_followed':contrast?'action_changed_with_failures':'requirement_not_demonstrated',limits:'A six-attempt development contrast of requirements with one configuration. No configuration superiority, weight training, production reliability or independent generalization is established.'};
}
export async function loadAuthority(dir,id,active=false){const plan=await readAuthorityPlan(dir,id),records=[];for(const entry of plan.schedule){try{const run=await readRun(dir,entry.runId);records.push({run,review:(await listReviews(dir,entry.runId))[0]||null});}catch(e){if(e.code!=='ENOENT')throw e;}}return summarizeAuthority(plan,records,active);}
export async function executeAuthority(runs,active,dir,{makeAdapter=run=>codexAdapter(run.agent),makeReview=reviewAuthority}={}){
 try{for(const run of runs){const controller=active.get(run.id);try{
  if(controller.signal.aborted){run.status='cancelled';run.error='Cancelled before execution.';run.evaluation=evaluateAuthority(run);await saveRun(dir,run);continue;}
  await runAgent(run,await makeAdapter(run),dir,controller.signal);
  if(run.status==='completed'){await mkdir(`${dir}/review-claims`,{recursive:true});await writeFile(`${dir}/review-claims/${run.id}.json`,JSON.stringify({runId:run.id,originalHash:hash(run),startedAt:new Date().toISOString()}),{flag:'wx'});await saveReview(dir,await makeReview(run,{signal:controller.signal}));}
 }catch(error){if(run.status!=='completed'){run.status='error';run.error=error.message;run.evaluation=evaluateAuthority(run);await saveRun(dir,run);}else{await mkdir(`${dir}/review-errors`,{recursive:true});await writeFile(`${dir}/review-errors/${run.id}.json`,JSON.stringify({error:error.message}),{flag:'wx'});}}
 }}finally{for(const run of runs)active.delete(run.id);}
}

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { scenario, limits, hash } from './scenario.js';
import { evaluatorVersion, evaluatorSourceHash } from './evaluate.js';
import { createRun, readRun } from './runner.js';
import { protocolVersion, verifyConfiguration } from './configurations.js';
import { getScenario } from './scenarios.js';
import {verifyContract,contractEvaluatorVersion,contractEvaluatorSourceHash} from './briefs.js';

const validId = id => /^[0-9a-f-]{36}$/.test(id);
export function createExperiment(baseline, candidate, repetitions, cliVersion,scenarioId,contract=null) {
  const scenario=getScenario(scenarioId);
  [baseline,candidate].forEach(verifyConfiguration);
  if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 4) throw new Error('Choose 1 to 4 trials per arm');
  if (baseline.hash === candidate.hash || baseline.instructions === candidate.instructions) throw new Error('Choose different instructions');
  if (['model','reasoningEffort','adapter','protocolVersion'].some(key => baseline[key] !== candidate[key])) throw new Error('Prompt experiments require matching runtime controls');
  if (!cliVersion) throw new Error('CLI version is required');
  const controls = { scenarioHash: hash(scenario), scenario: `${scenario.id}@${scenario.version}`, split: scenario.split, limits: structuredClone(limits), evaluatorVersion, evaluatorSourceHash, protocolVersion, model: baseline.model, reasoningEffort: baseline.reasoningEffort, cliVersion, mode: 'codex' };
  if(contract){verifyContract(contract);if(contract.grading.sourceHash!==contractEvaluatorSourceHash())throw Error('Frozen contract grader changed');Object.assign(controls,{contractHash:contract.hash,evaluatorVersion:contractEvaluatorVersion,evaluatorSourceHash:contractEvaluatorSourceHash()});}
  const experiment = { id: randomUUID(), version: 1, createdAt: new Date().toISOString(), kind: 'prompt-comparison', controls, controlHash: hash(controls), repetitions, arms: { baseline: structuredClone(baseline), candidate: structuredClone(candidate) }, schedule: [] };
  const runs = [];
  for (let repetition = 1; repetition <= repetitions; repetition++) {
    // AB, BA, AB, BA balances a simple order effect. No randomization claim.
    for (const arm of repetition % 2 ? ['baseline','candidate'] : ['candidate','baseline']) {
      const run = createRun('codex','supported',experiment.arms[arm],scenario.id,contract);
      run.experiment = { id: experiment.id, arm, repetition, controlHash: experiment.controlHash };
      experiment.schedule.push({ runId: run.id, arm, repetition }); runs.push(run);
    }
  }
  return { experiment, runs };
}
export async function saveExperiment(dir, experiment) {
  await mkdir(`${dir}/experiments`, { recursive: true });
  await writeFile(`${dir}/experiments/${experiment.id}.json`, JSON.stringify(experiment,null,2), { flag: 'wx' });
}
export async function readExperiment(dir,id) {
  if (!validId(id)) throw new Error('Invalid experiment ID');
  return JSON.parse(await readFile(`${dir}/experiments/${id}.json`,'utf8'));
}
export async function listExperiments(dir) {
  await mkdir(`${dir}/experiments`,{recursive:true});
  const experiments = [];
  for (const file of (await readdir(`${dir}/experiments`)).filter(f => /^[0-9a-f-]{36}\.json$/.test(f))) experiments.push(await readExperiment(dir,file.slice(0,-5)));
  return experiments.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
function mismatches(experiment,entry,run) {
  const c=experiment.controls, config=experiment.arms[entry.arm], issues=[];
  const check=(valid,message)=>{if(!valid)issues.push(message);};
  check(hash(c)===experiment.controlHash,'Experiment controls changed');
  if(c.contractHash){try{verifyContract(run.contract);check(run.contractHash===c.contractHash&&run.contract.hash===c.contractHash,'Task requirements differ');}catch{check(false,'Frozen task contract differs');}}
  else check(!run.contract,'Unexpected task contract');
  check(run.experiment?.id===experiment.id && run.experiment?.arm===entry.arm && run.experiment?.repetition===entry.repetition && run.experiment?.controlHash===experiment.controlHash,'Enrollment differs');
  check(run.scenarioHash===c.scenarioHash && hash(run.scenario)===c.scenarioHash,'Scenario or sources differ');
  check(hash(run.limits)===hash(c.limits),'Run limits differ');
  check(run.mode===c.mode && run.agent.adapter===c.mode,'Adapter differs');
  check(run.agent.hash===config.hash && run.agent.id===config.id && run.agent.version===config.version && hash(run.agent.instructions)===hash(config.instructions) && run.agent.instructionHash===hash(config.instructions),'Configuration differs');
  check(run.agent.model===c.model && run.agent.settings.reasoningEffort===c.reasoningEffort && run.agent.protocolVersion===c.protocolVersion,'Requested model or protocol differs');
  if(run.agent.execution)check(run.agent.execution.cliVersion===c.cliVersion && run.agent.execution.requestedModel===c.model && run.agent.execution.protocolVersion===c.protocolVersion && run.agent.execution.reasoningEffort===c.reasoningEffort,'Executed runtime differs');
  if(run.status==='completed'){check(!!run.agent.execution,'Completed run lacks runtime provenance');check(!!run.evaluation,'Completed run lacks its original evaluation');}
  if(run.evaluation)check(run.evaluation.version===c.evaluatorVersion && run.evaluation.sourceHash===c.evaluatorSourceHash,'Original evaluator differs');
  return issues;
}
function range(values) {
  const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b), n=sorted.length;
  return n?{known:n,min:sorted[0],max:sorted[n-1],median:(sorted[Math.floor((n-1)/2)]+sorted[Math.floor(n/2)])/2}:{known:0,min:null,max:null,median:null};
}
export function compareRuns(experiment,runs) {
  const rows=experiment.schedule.map(entry=>{
    const run=runs.find(r=>r.id===entry.runId);
    if(!run)return {...entry,status:'missing',issues:['Scheduled run record is missing'],run:null};
    return {...entry,status:run.status,issues:mismatches(experiment,entry,run),run};
  });
  const compatible=rows.every(row=>!row.issues.length);
  const pending=rows.some(row=>['queued','running'].includes(row.status));
  const arms={};
  for(const arm of ['baseline','candidate']) {
    const entries=rows.filter(row=>row.arm===arm), items=entries.map(e=>e.run).filter(Boolean);
    const outcomes={uncertain:0,fail:0,execution_error:0,awaiting:0,unavailable:0};
    for(const entry of entries) {
      const outcome=['queued','running'].includes(entry.status)?'awaiting':entry.run?.evaluation?.outcome;
      outcomes[Object.hasOwn(outcomes,outcome)?outcome:'unavailable']++;
    }
    const criteria=['model','policy','sources','handoff','writing'].map(id=>{
      const counts={pass:0,fail:0,uncertain:0,unavailable:0};let title=id;
      for(const entry of entries){const row=!['queued','running'].includes(entry.status)&&entry.run?.evaluation?.criteria.find(c=>c.id===id);if(row)title=row.title;counts[Object.hasOwn(counts,row?.outcome)?row.outcome:'unavailable']++;}
      return {id,title,...counts};
    });
    const tokens=items.filter(r=>r.usage.tokens), sum=key=>tokens.reduce((n,r)=>n+(r.usage.tokens[key]||0),0);
    arms[arm]={scheduled:entries.length,completed:items.filter(r=>r.status==='completed').length,outcomes,criteria,elapsedMs:range(items.map(r=>r.usage.elapsedMs)),tokens:{known:tokens.length,input:sum('input_tokens'),output:sum('output_tokens'),cachedInput:sum('cached_input_tokens')},cost:null};
  }
  return {experiment,compatible,pending,arms:compatible?arms:null,rows,conclusion:!compatible?'Controls or records differ. Comparison blocked; individual attempts remain inspectable.':pending?'Experiment in progress. No conclusion yet.':'Descriptive development results only. No winner is inferred; semantic quality remains ungraded. This small, exposed scenario cannot establish general improvement.'};
}
export async function loadComparison(dir,id) {
  const experiment=await readExperiment(dir,id),runs=[];
  for(const {runId}of experiment.schedule){try{runs.push(await readRun(dir,runId));}catch(error){if(error.code!=='ENOENT')throw error;}}
  return compareRuns(experiment,runs);
}

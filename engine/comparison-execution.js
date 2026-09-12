import {readFileSync} from 'node:fs';
import {hash} from './scenario.js';
import {baseline} from './configurations.js';
import {validateAction} from './runner.js';
import {diagnosticAdapter,diagnosticAdapterVersion,diagnosticBounds} from './diagnostic-adapter.js';
import {judgePrompt,semanticVersion,reviewRun,validateReview} from './semantic.js';
import {createContractSuite,executeContractSuite,loadContractSuite,verifyContractSuite} from './contract-suites.js';

const sourceNames=['comparison-execution.js','diagnostic-adapter.js','diagnostic-protocol.js','codex-adapter.js','runner.js','run-behavior.js','semantic.js','contract-suites.js','experiments.js'];
export function comparisonExecutionContract() {
  const value={version:'comparison-execution-2',adapterVersion:diagnosticAdapterVersion,bounds:diagnosticBounds,
    sources:Object.fromEntries(sourceNames.map(name=>[name,hash(readFileSync(new URL(name,import.meta.url),'utf8'))])),
    policy:'Retain bounded rejected output outside the agent trace. No automatic repair, retry or replacement. Historical execution remains separate.'};
  return {...value,hash:hash(value)};
}

export function createDiagnosticComparison(...args) {
  const {plan,runs}=createContractSuite(...args);
  plan.version=2;
  plan.execution=comparisonExecutionContract();
  for(const experiment of plan.experiments) {
    experiment.controls.executionHash=plan.execution.hash;
    experiment.controlHash=hash(experiment.controls);
    for(const run of runs.filter(r=>r.experiment.id===experiment.id)) {
      run.comparisonExecution=structuredClone(plan.execution);
      run.experiment.controlHash=experiment.controlHash;
    }
  }
  const {hash:oldHash,...value}=plan;
  plan.hash=hash(value);
  return {plan,runs};
}

function setupDiagnostic(error) {
  const value={version:diagnosticAdapterVersion,stage:error.diagnostic?.stage||'setup',code:error.diagnostic?.code||'setup_failed',
    message:error.message,stdout:null,stderr:null,response:null};
  return {...value,hash:hash(value)};
}

export async function comparisonAdapter(run,dependencies={}) {
  let adapter;
  try {
    adapter=await diagnosticAdapter(run.agent,null,{...dependencies,validate:action=>{
      if(JSON.stringify(action)?.length>run.limits.outputChars)throw Error('Adapter action exceeded output limit');
      validateAction(action);
    }});
  } catch(error) {
    run.executionDiagnostics=[setupDiagnostic(error)];
    throw error;
  }
  adapter.metadata.comparisonExecutionHash=run.comparisonExecution.hash;
  const close=adapter.close;
  adapter.close=()=>{
    close();
    if(run.status!=='completed'&&!adapter.diagnostics.length) {
      const stage=run.trace.some(e=>e.kind==='tool_result'&&!e.ok)?'tool_execution':'runner_boundary';
      adapter.rejectLast(stage,'runner_rejected',run.error);
    }
    // The runner saves after close, before the first review hashes the run.
    run.executionDiagnostics=structuredClone(adapter.diagnostics);
  };
  return adapter;
}

export async function reviewComparison(run,{dependencies={},...options}={}) {
  let adapter,setupFailure;
  const review=await reviewRun(run,{...options,adapterFactory:async()=>{
    try {
      adapter=await diagnosticAdapter(baseline,{version:semanticVersion,prompt:judgePrompt},
        {...dependencies,validate:validateReview,validationStage:'review_schema'});
      adapter.metadata.comparisonExecutionHash=run.comparisonExecution.hash;
      return adapter;
    } catch(error) {setupFailure=error;throw error;}
  }});
  review.executionDiagnostics=structuredClone(adapter?.diagnostics||(setupFailure?[setupDiagnostic(setupFailure)]:[]));
  return review;
}

export async function executeDiagnosticComparison(plan,runs,active,dir,{dependencies={}}={}) {
  verifyContractSuite(plan);
  if(plan.version!==2||hash(plan.execution)!==hash(comparisonExecutionContract()))throw Error('Comparison execution controls changed');
  const scheduled=plan.experiments.flatMap(e=>e.schedule.map(s=>({...s,experiment:e})));
  if(runs.length!==scheduled.length||runs.some((run,i)=>run.status!=='queued'||run.id!==scheduled[i].runId||
    hash(run.comparisonExecution??null)!==hash(plan.execution)||run.experiment.controlHash!==scheduled[i].experiment.controlHash)) {
    throw Error('Comparison execution enrollment changed');
  }
  return executeContractSuite(runs,active,dir,{
    makeAdapter:run=>comparisonAdapter(run,dependencies),
    makeReview:(run,options)=>reviewComparison(run,{...options,dependencies})
  });
}

export async function loadDiagnosticComparison(dir,id,active=false) {
  const report=await loadContractSuite(dir,id,active);
  if(report.plan.version!==2)return report;
  const execution=report.plan.execution,{hash:digest,...value}=execution||{};
  const issues=[];
  if(hash(value)!==digest)issues.push('Execution contract hash differs');
  if(report.plan.experiments.some(e=>e.controls.executionHash!==digest))issues.push('Experiment execution contract differs');
  for(const row of report.rows) {
    const run=row.run;
    if(!run)continue;
    if(hash(run.comparisonExecution??null)!==hash(execution??null))issues.push('Run execution contract differs');
    if(run.agent.execution&&run.agent.execution.comparisonExecutionHash!==digest)issues.push('Support execution differs');
    if(row.review?.execution&&row.review.execution.comparisonExecutionHash!==digest)issues.push('Review execution differs');
    for(const record of [run,row.review].filter(Boolean))for(const diagnostic of record.executionDiagnostics||[]) {
      const {hash:receiptHash,...receipt}=diagnostic;
      if(hash(receipt)!==receiptHash)issues.push('Failure diagnostic receipt differs');
    }
  }
  if(issues.length)Object.assign(report,{compatible:false,complete:false,decision:'blocked',qualified:{baseline:false,candidate:false},issues:[...new Set([...report.issues,...issues])]});
  return report;
}

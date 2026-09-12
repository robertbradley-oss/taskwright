import {readFileSync} from 'node:fs';
import {hash} from './scenario.js';
import {baseline} from './configurations.js';
import {runAgent,saveRun,validateAction} from './runner.js';
import {validateReview} from './semantic.js';
import {diagnosticAdapter,diagnosticAdapterVersion,diagnosticBounds} from './diagnostic-adapter.js';
import {clarificationJudgePrompt,clarificationReviewVersion,reviewClarification} from './clarification-review.js';
const sourceNames=['diagnostic-adapter.js','diagnostic-protocol.js','diagnostic-execution.js','diagnostic-rerun.js','../scripts/run-diagnostic-rerun.mjs','codex-adapter.js','runner.js','run-behavior.js','semantic.js','clarification-review.js'];
export function diagnosticExecutionContract(){const value={version:'diagnostic-execution-1',adapterVersion:diagnosticAdapterVersion,bounds:diagnosticBounds,sources:Object.fromEntries(sourceNames.map(name=>[name,hash(readFileSync(new URL('./'+name,import.meta.url),'utf8'))])),supportProtocol:'json-actions-2',reviewProtocol:clarificationReviewVersion,policy:'Retain bounded rejected output and stage diagnostics. Never repair, retry, reinterpret or replace a rejected attempt automatically. Diagnostics remain outside the agent-visible trace and cannot substitute for a valid final reply.'};return {...value,hash:hash(value)};}
export function verifyDiagnosticExecution(contract){if(hash(contract)!==hash(diagnosticExecutionContract()))throw Error('Diagnostic execution controls changed');return contract;}
export async function runDiagnosticAgent(run,dir,signal,dependencies={}){
 verifyDiagnosticExecution(run.diagnosticExecution);let adapter;
 try{adapter=await diagnosticAdapter(run.agent,null,{...dependencies,validate:action=>{if(JSON.stringify(action)?.length>run.limits.outputChars)throw Error('Adapter action exceeded output limit');validateAction(action);}});adapter.metadata.diagnosticExecutionHash=run.diagnosticExecution.hash;await runAgent(run,adapter,dir,signal);
  if(run.status!=='completed'&&!adapter.diagnostics.length)adapter.rejectLast(run.trace.some(e=>e.kind==='tool_result'&&!e.ok)?'tool_execution':'runner_boundary','runner_rejected',run.error);
  run.executionDiagnostics=structuredClone(adapter.diagnostics);await saveRun(dir,run);return run;
 }catch(error){if(!adapter){run.status='error';run.error=error.message;run.executionDiagnostics=[{version:diagnosticAdapterVersion,stage:error.diagnostic?.stage||'setup',code:error.diagnostic?.code||'setup_failed',message:error.message,stdout:null,stderr:null,response:null}];}throw error;}
}
export async function reviewDiagnosticRun(run,options={}){verifyDiagnosticExecution(run.diagnosticExecution);let adapter,setupFailure;const review=await reviewClarification(run,{...options,adapterFactory:async()=>{try{adapter=await diagnosticAdapter(baseline,{version:clarificationReviewVersion,prompt:clarificationJudgePrompt},{...(options.dependencies||{}),validate:validateReview,validationStage:'review_schema'});adapter.metadata.diagnosticExecutionHash=run.diagnosticExecution.hash;return adapter;}catch(e){setupFailure=e;throw e;}}});return {...review,executionDiagnostics:structuredClone(adapter?.diagnostics||(setupFailure?[{version:diagnosticAdapterVersion,stage:setupFailure.diagnostic?.stage||'setup',code:setupFailure.diagnostic?.code||'setup_failed',message:setupFailure.message,stdout:null,stderr:null,response:null}]:[]))};}

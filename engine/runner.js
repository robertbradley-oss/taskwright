import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, readdir } from 'node:fs/promises';
import { scenario, instructions, limits, hash, fixtureActions, fixtures } from './scenario.js';
import { evaluateBehavior as evaluateRun,behaviorInstructions as modelInstructions } from './run-behavior.js';
import {authorityScenario} from './authority.js';
import {verifyContract} from './briefs.js';
import { baseline, verifyConfiguration } from './configurations.js';
import { getScenario,scenarioFixtures,actionsForScenario } from './scenarios.js';

export function createRun(mode, fixture='supported', configuration=baseline,scenarioId=scenario.id,contract=null) {
  const chosen=scenarioId===authorityScenario.id?authorityScenario:getScenario(scenarioId);
  if(!['replay','codex'].includes(mode)||!Object.hasOwn(scenarioFixtures(chosen)||fixtures,fixture))throw new Error('Invalid run configuration');
  const snapshot=structuredClone(chosen);
  if(contract){verifyContract(contract);if(!contract.scenarios.some(s=>s.id===chosen.id&&s.hash===hash(chosen)))throw Error('Scenario outside contract');}
  if(mode==='codex')verifyConfiguration(configuration);
  return {id:randomUUID(),createdAt:new Date().toISOString(),status:'queued',mode,fixture:mode==='replay'?fixture:null,
    scenario:snapshot,scenarioHash:hash(snapshot),sources:snapshot.documents.map(d=>({id:d.id,hash:hash(d)})),...(contract?{contract:structuredClone(contract),contractHash:contract.hash}:{}),
    agent:mode==='codex'?{...structuredClone(configuration),instructionHash:hash(configuration.instructions),settings:{modelSelection:'Explicit CLI --model alias; provider snapshot not reported',reasoningEffort:configuration.reasoningEffort,temperature:null}}:{id:`fixture-${fixture}`,version:'1',instructions,instructionHash:hash(instructions),adapter:mode,model:null,settings:{modelSelection:'scripted',temperature:null}},
    limits:{...limits,...(fixture==='timeout'&&mode==='replay'?{elapsedMs:100}: {})},trace:[],final:null,usage:{elapsedMs:null,tokens:null,cost:null},evaluation:null};
}
export async function saveRun(dir,run) {
  await mkdir(dir,{recursive:true});
  const file=`${dir}/${run.id}.json`,temp=`${file}.${randomUUID()}.tmp`;
  await writeFile(temp,JSON.stringify(run,null,2),{flag:'wx'});
  // Windows readers/antivirus can briefly hold the target during atomic replacement.
  for(let attempt=0;;attempt++){try{await rename(temp,file);break;}catch(error){if(attempt>=7||!['EPERM','EACCES','EBUSY'].includes(error.code))throw error;await new Promise(resolve=>setTimeout(resolve,20*(attempt+1)));}}
}
export async function readRun(dir,id) {
  if(!/^[0-9a-f-]{36}$/.test(id))throw new Error('Invalid run ID');
  return JSON.parse(await readFile(`${dir}/${id}.json`,'utf8'));
}
export async function listRuns(dir) {
  await mkdir(dir,{recursive:true});
  const files=(await readdir(dir)).filter(f=>/^[0-9a-f-]{36}\.json$/.test(f));
  const runs=[];for(const file of files){runs.push(JSON.parse(await readFile(`${dir}/${file}`,'utf8')));}
  return runs.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export async function recoverRuns(dir) {
  for(const run of await listRuns(dir))if(['queued','running'].includes(run.status)){run.status='interrupted';run.error='Server stopped before execution completed.';run.evaluation=evaluateRun(run);await saveRun(dir,run);}
}
function exact(obj,keys){return obj&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(obj,k));}
function text(v,max=2000){return typeof v==='string'&&v.trim().length>0&&v.length<=max;}
export function executeTool(run,action) {
  const {tool,args}=action,docs=run.scenario.documents;
  if(tool==='search_documents'){
    if(!exact(args,['query'])||!text(args.query,200))throw new Error('Invalid search query');
    const tokens=args.query.toLowerCase().split(/\s+/);
    return docs.filter(d=>tokens.some(t=>(d.title+' '+d.text).toLowerCase().includes(t))).map(d=>({id:d.id,title:d.title,version:d.version}));
  }
  if(tool==='read_document'){
    if(!exact(args,['document_id'])||!text(args.document_id,80))throw new Error('Invalid document ID');
    const doc=docs.find(d=>d.id===args.document_id);if(!doc)throw new Error('Unknown document ID');return doc;
  }
  if(tool==='record_escalation'){
    const readIds=run.trace.filter(e=>e.kind==='tool_result'&&e.ok&&e.tool==='read_document').map(e=>e.result.id);
    if(!exact(args,['reason','evidence_ids'])||!text(args.reason)||!Array.isArray(args.evidence_ids)||args.evidence_ids.length<1||args.evidence_ids.length>3||!args.evidence_ids.every(id=>readIds.includes(id)))throw new Error('Escalation requires a reason and previously read evidence');
    return {id:`handoff-${run.id}`,simulated:true,reason:args.reason,evidence_ids:args.evidence_ids};
  }
  throw new Error('Unknown tool');
}
export function validateAction(action) {
  if(action?.type==='tool'&&exact(action,['type','tool','args'])&&text(action.tool,80)&&action.args&&typeof action.args==='object')return;
  if(action?.type==='final'&&exact(action,['type','model','connection','policy_commitment','evidence_ids','reply'])&&text(action.model,80)&&text(action.connection,80)&&text(action.policy_commitment,80)&&text(action.reply,6000)&&Array.isArray(action.evidence_ids)&&action.evidence_ids.length<=3&&action.evidence_ids.every(id=>text(id,80)))return;
  throw new Error('Malformed adapter action');
}
export function replayAdapter(name,selected=scenario){const actions=actionsForScenario(name,selected);let i=0;return {async next(){if(name==='timeout')return new Promise(()=>{});return structuredClone(actions[i++]);}};}
export async function runAgent(run,adapter,dir,signal) {
  const started=Date.now();run.status='running';if(adapter.metadata)run.agent.execution=adapter.metadata;await saveRun(dir,run);
  const add=(kind,data)=>run.trace.push({seq:run.trace.length+1,at:new Date().toISOString(),kind,...data});
  let calls=0;
  try {
    for(let step=0;step<run.limits.steps;step++){
      if(signal?.aborted)throw new Error('Cancelled');
      const remaining=run.limits.elapsedMs-(Date.now()-started);if(remaining<=0)throw new Error('Time limit exceeded');
      let timer,abort;
      const boundary=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Time limit exceeded')),remaining);abort=()=>reject(new Error('Cancelled'));signal?.addEventListener('abort',abort,{once:true});});
      let action;try{action=await Promise.race([adapter.next({ticket:run.scenario.ticket,catalog:run.scenario.documents.map(d=>({id:d.id,title:d.title})),tools:run.scenario.tools,instructions:modelInstructions(run),trace:run.trace},signal,remaining),boundary]);}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
      if(JSON.stringify(action)?.length>run.limits.outputChars)throw new Error('Adapter action exceeded output limit');
      validateAction(action);add('action',{action});
      if(action.type==='final'){run.final=action;run.status='completed';await saveRun(dir,run);break;}
      if(++calls>run.limits.toolCalls)throw new Error('Tool call limit exceeded');
      try{const result=executeTool(run,action);add('tool_result',{tool:action.tool,ok:true,result});}
      catch(error){add('tool_result',{tool:action.tool,ok:false,error:error.message});throw error;}
      await saveRun(dir,run);
    }
    if(run.status!=='completed')throw new Error('Step limit exceeded');
  }catch(error){run.status=error.message==='Cancelled'?'cancelled':error.message==='Time limit exceeded'?'timed_out':'error';run.error=error.message;add('execution_error',{message:error.message});}
  finally{adapter.close?.();run.finishedAt=new Date().toISOString();run.usage.elapsedMs=Date.now()-started;if(adapter.usage)run.usage.tokens=adapter.usage;run.evaluation=evaluateRun(run);await saveRun(dir,run);}
  return run;
}

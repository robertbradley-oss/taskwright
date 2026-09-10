import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {baseline,saveCandidate} from '../engine/configurations.js';
import {hash} from '../engine/scenario.js';
import {codexVersion} from '../engine/codex-adapter.js';
import {createSuitePlan,summarizeSuite,verifySuitePlan} from '../engine/suites.js';
import {evaluatorVersion,evaluatorSourceHash} from '../engine/evaluate.js';
import {judgeHash} from '../engine/semantic.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=root+'evidence/conditional-handoff',base='http://127.0.0.1:4173';
await mkdir(dir,{recursive:true});
const read=async file=>JSON.parse(await readFile(`${dir}/${file}`,'utf8'));
async function optional(file){try{return await read(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function once(file,value){await writeFile(`${dir}/${file}`,JSON.stringify(value,null,2),{flag:'wx'});}
async function api(path,body){const res=await fetch(base+path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(100000)});const value=await res.json();if(!res.ok)throw Error(`${path}: ${value.error}`);return value;}
let plan=await optional('plan.json');
if(!plan){
 const reservation=await read('reservation.json');
 const candidate=await saveCandidate(root+'data/runs',{name:'Conditional handoff',parent:'support-baseline@1',instructions:baseline.instructions.replace('Perform the requested simulated handoff and give a supported customer reply.','Open a simulated handoff only when the customer request and applicable support policy call for one. If the ticket is advice-only or policy forbids a handoff, do not open one. Give a supported customer reply.')});
 plan=createSuitePlan(baseline,candidate,codexVersion(),reservation);await once('plan.json',plan);
}
verifySuitePlan(plan);
if(hash((await read('reservation.json')).cases)!==plan.reservation.casesHash||codexVersion()!==plan.controls.cliVersion||evaluatorVersion!==plan.controls.evaluatorVersion||evaluatorSourceHash!==plan.controls.evaluatorSourceHash||judgeHash!==plan.controls.judgeHash)throw Error('Frozen controls changed; do not continue');
const finished=await optional('decision.json');
if(finished){if(finished.planHash!==plan.hash||hash(await read('report.json'))!==finished.reportHash)throw Error('Finished evidence changed');console.log('Suite already finished. No model calls or evidence changes were made.');process.exit(0);}
const experiments=[],records=[];
async function report(){
 const value=summarizeSuite(plan,experiments,records),temp=`${dir}/report.${randomUUID()}.tmp`;await writeFile(temp,JSON.stringify(value,null,2));
 // A browser read or antivirus can briefly hold the Windows destination.
 for(let attempt=0;;attempt++){try{await rename(temp,`${dir}/report.json`);break;}catch(error){if(attempt>=7||!['EPERM','EACCES','EBUSY'].includes(error.code))throw error;await new Promise(r=>setTimeout(r,20*(attempt+1)));}}
 return value;
}
// Reconstruct before continuing. Receipts and review claims prevent retrying an
// uncertain operation. A crash after a claim needs explicit evidence recovery.
for(const s of plan.scenarios){const receipt=await optional(`${s.id}.experiment.json`);if(receipt){const comparison=await api(`/api/experiments/${receipt.id}`);experiments.push(comparison.experiment);for(const row of comparison.rows){const saved=await optional(`${row.runId}.json`);if(saved)records.push(saved);else if(row.run)records.push({run:row.run,review:null});}}}
await report();
if(process.argv.includes('--prepare-only')){console.log(JSON.stringify({prepared:plan.id,candidate:plan.arms.candidate.version,reserved:plan.reservation.count}));process.exit(0);}
// Check availability and source/configuration drift before claiming a start.
const config=await api('/api/config');
if(!config.codexAvailable||plan.scenarios.some(s=>{const current=config.scenarios.find(c=>c.id===s.id);if(!current)return true;const {fixtures,...value}=current;return hash(value)!==s.hash;})||Object.values(plan.arms).some(arm=>!config.configurations.some(c=>c.hash===arm.hash)))throw Error('Server sources, configurations, or adapter are unavailable');
for(const s of plan.scenarios){
 let experiment=experiments.find(e=>e.controls.scenario===`${s.id}@${s.version}`);
 if(!experiment){
  if(await optional(`${s.id}.start-claim.json`))throw Error('Uncertain start: recover its existing experiment receipt; never create a replacement trial');
  await once(`${s.id}.start-claim.json`,{at:new Date().toISOString(),planHash:plan.hash});
  const receipt=await api('/api/experiments',{baseline:`${plan.arms.baseline.id}@${plan.arms.baseline.version}`,candidate:`${plan.arms.candidate.id}@${plan.arms.candidate.version}`,repetitions:plan.repetitions,scenario:s.id});
  await once(`${s.id}.experiment.json`,receipt);experiment=(await api(`/api/experiments/${receipt.id}`)).experiment;experiments.push(experiment);
 }
 let comparison;
 do{
  comparison=await api(`/api/experiments/${experiment.id}`);
  for(const row of comparison.rows){const old=records.find(r=>r.run?.id===row.runId);if(old)old.run=row.run;else if(row.run)records.push({run:row.run,review:null});}
  await report();console.log(JSON.stringify({scenario:s.id,phase:'support',statuses:comparison.rows.map(r=>r.status)}));
  if(comparison.pending)await new Promise(r=>setTimeout(r,15000));
 }while(comparison.pending);
 for(const entry of experiment.schedule){
  const record=records.find(r=>r.run?.id===entry.runId);if(!record)throw Error('Missing scheduled run');
  if(await optional(`${entry.runId}.json`))continue;
  if(record.run.status==='completed'){
   if(await optional(`${entry.runId}.review-claim.json`))throw Error('Uncertain review: recover the first persisted review before continuing; no automatic retry');
   await once(`${entry.runId}.review-claim.json`,{at:new Date().toISOString(),originalHash:hash(record.run),judgeHash:plan.controls.judgeHash});
   record.review=await api(`/api/runs/${entry.runId}/review`,{});
  }
  await once(`${entry.runId}.json`,record);const current=await report();
  console.log(JSON.stringify({scenario:s.id,arm:entry.arm,repetition:entry.repetition,structural:record.run.evaluation?.outcome,review:record.review?.evaluation?.outcome,reviewStatus:record.review?.status,decision:current.decision.status}));
 }
}
const final=await report();await once('decision.json',{decidedAt:new Date().toISOString(),planHash:plan.hash,reportHash:hash(final),...final.decision});
console.log(JSON.stringify({finished:true,decision:final.decision,arms:final.arms}));

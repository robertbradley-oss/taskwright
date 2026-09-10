import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const base='http://127.0.0.1:4173',dir=fileURLToPath(new URL('../evidence/semantic-coverage',import.meta.url));
await mkdir(dir,{recursive:true});
const plan=[
 ...['95cd19ca-865e-43af-b031-0f33bf7ca24d','62296504-a837-4898-a533-de71bb750a2a','dc6bcf6a-e87e-40a0-b056-900475fa2698','1dc888fd-2c1d-411e-b296-1682119622c5'].map((runId,i)=>({id:`retained-${i+1}`,kind:'retained fresh agent run',runId})),
 ...['vale-reset','vale-eligibility','vale-revision'].flatMap(scenario=>[{id:`${scenario}-fresh`,kind:'new fresh agent run',mode:'codex',scenario},{id:`${scenario}-contradiction`,kind:'scripted contradictory reply; fresh AI review',mode:'replay',scenario,fixture:'contradiction',expectedReview:'fail'}])
];
async function api(path,body){const r=await fetch(base+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(100000)}:undefined);const value=await r.json();if(!r.ok)throw Error(value.error);return value;}
try{await writeFile(`${dir}/plan.json`,JSON.stringify(plan,null,2),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
const records=[];
for(const item of plan){const finalFile=`${dir}/${item.id}.json`;let record;try{record=JSON.parse(await readFile(finalFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;
 let runId=item.runId;
 if(!runId){try{runId=JSON.parse(await readFile(`${dir}/${item.id}.pending.json`,'utf8')).runId;}catch(error){if(error.code!=='ENOENT')throw error;runId=(await api('/api/runs',{mode:item.mode,scenario:item.scenario,fixture:item.fixture||'supported',configuration:'support-baseline@1'})).id;await writeFile(`${dir}/${item.id}.pending.json`,JSON.stringify({runId}),{flag:'wx'});}}
 let run;const start=Date.now();do{run=await api('/api/runs/'+runId);if(!['running','queued'].includes(run.status))break;if(Date.now()-start>200000)throw Error('Run polling timed out; resume without duplicating the run.');await new Promise(r=>setTimeout(r,1000));}while(true);
 const review=run.status==='completed'?await api(`/api/runs/${runId}/review`,{}):null;
 // Retain the authoritative original run separately from API annotations.
 delete run.assessments;delete run.reviews;
 record={...item,run,review};await writeFile(finalFile,JSON.stringify(record,null,2),{flag:'wx'});
 }records.push(record);console.log(JSON.stringify({case:item.id,status:record.run.status,structural:record.run.evaluation?.outcome,review:record.review?.evaluation?.outcome,reviewStatus:record.review?.status}));}
const report={createdAt:new Date().toISOString(),kind:'Development coverage smoke check, not repeated improvement experiment',records};
try{await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}

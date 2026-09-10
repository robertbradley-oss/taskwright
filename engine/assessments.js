import { mkdir,readFile,readdir,writeFile } from 'node:fs/promises';
import { evaluateTask as evaluateRun } from './contract-evaluate.js';
import { hash } from './scenario.js';
export async function reassess(dir,run){
 if(run.status!=='completed')throw new Error('Only completed runs can be reassessed');
 await mkdir(`${dir}/assessments`,{recursive:true});
 const evaluation=evaluateRun(run);
 const file=`${dir}/assessments/${run.id}-${evaluation.version}.json`;
 const assessment={runId:run.id,originalHash:hash(run),createdAt:new Date().toISOString(),evaluation,kind:'reassessment of recorded output; no new model execution'};
 try{await writeFile(file,JSON.stringify(assessment,null,2),{flag:'wx'});return assessment;}catch(error){if(error.code==='EEXIST')return JSON.parse(await readFile(file,'utf8'));throw error;}
}
export async function assessments(dir,id){try{const files=(await readdir(`${dir}/assessments`)).filter(f=>f.startsWith(id+'-')&&f.endsWith('.json'));const out=[];for(const f of files)out.push(JSON.parse(await readFile(`${dir}/assessments/${f}`,'utf8')));return out.sort((a,b)=>a.createdAt.localeCompare(b.createdAt));}catch(error){if(error.code==='ENOENT')return [];throw error;}}

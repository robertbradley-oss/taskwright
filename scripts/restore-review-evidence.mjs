import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {hash} from '../engine/scenario.js';
import {reviewInput,validateReview} from '../engine/semantic.js';
const dir=process.env.TASKWRIGHT_RUN_DIR||process.env.TRYWISE_RUN_DIR||fileURLToPath(new URL('../data/runs',import.meta.url));
const report=JSON.parse(await readFile(new URL('../evidence/semantic-coverage/report.json',import.meta.url),'utf8'));
const correction=JSON.parse(await readFile(new URL('../evidence/semantic-coverage/revision-reassessment.json',import.meta.url),'utf8'));
const valid=id=>typeof id==='string'&&/^[0-9a-f-]{36}$/.test(id),files=[];
for(const {run,review} of report.records){
 if(!valid(run.id)||!valid(review?.id)||review.runId!==run.id||review.originalHash!==hash(run)||review.inputHash!==hash(reviewInput(run)))throw Error('Evidence identifiers or hashes differ');
 if(review.status==='completed'&&hash(validateReview(review.raw,reviewInput(run)))!==hash(review.evaluation))throw Error('Stored review differs from validated verdict');
 files.push({path:`${dir}/${run.id}.json`,data:run},{path:`${dir}/reviews/${run.id}-${review.id}.json`,data:review});
}
if(!valid(correction.runId)||!/^structural-\d+$/.test(correction.evaluation.version)||correction.originalHash!==hash(report.records.find(r=>r.run.id===correction.runId)?.run))throw Error('Invalid correction');
files.push({path:`${dir}/assessments/${correction.runId}-${correction.evaluation.version}.json`,data:correction});
for(const f of files){try{if(hash(JSON.parse(await readFile(f.path,'utf8')))!==hash(f.data))throw Error(`Existing record differs: ${f.path}`);f.exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}}
await mkdir(`${dir}/reviews`,{recursive:true});await mkdir(`${dir}/assessments`,{recursive:true});
let added=0;for(const f of files)if(!f.exists){await writeFile(f.path,JSON.stringify(f.data,null,2),{flag:'wx'});added++;}
console.log(`Review evidence ready. ${added} files added; no model calls made. Existing records preserved.`);

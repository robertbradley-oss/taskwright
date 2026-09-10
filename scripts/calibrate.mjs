import { mkdir,writeFile,readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { referenceSet,referenceVersion,referenceHash,calibrationSummary } from '../engine/reference-set.js';
import { reviewRun,semanticVersion,judgeHash,judgePrompt } from '../engine/semantic.js';

const dir=fileURLToPath(new URL('../evidence/semantic-calibration',import.meta.url));
await mkdir(dir,{recursive:true});
const manifest={referenceVersion,referenceHash,semanticVersion,judgeHash,judgePrompt,referenceSet,protocol:'Development first, then frozen validation; labels and case IDs omitted from all judge inputs. One invocation per case; no best-of selection.'};
const file=`${dir}/manifest.json`;
try{await writeFile(file,JSON.stringify(manifest,null,2),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;const previous=JSON.parse(await readFile(file,'utf8'));if(previous.referenceHash!==referenceHash||previous.judgeHash!==judgeHash)throw Error('Frozen calibration differs; preserve it and create a new version/directory.');}
const records=[];
for(const c of referenceSet){let record;const path=`${dir}/${c.id}.json`;try{record=JSON.parse(await readFile(path,'utf8'));if(record.review.judgeHash!==judgeHash)throw Error('Judge hash differs');}catch(e){if(e.code!=='ENOENT')throw e;const review=await reviewRun(c.run);record={caseId:c.id,reference:c.reference,review};await writeFile(path,JSON.stringify(record,null,2),{flag:'wx'});}records.push(record);console.log(JSON.stringify({caseId:c.id,expected:c.reference.outcome,actual:record.review.evaluation?.outcome,status:record.review.status}));}
const report={referenceVersion,referenceHash,semanticVersion,judgeHash,createdAt:new Date().toISOString(),...calibrationSummary(records),records};
try{await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
console.log(JSON.stringify(calibrationSummary(records)));

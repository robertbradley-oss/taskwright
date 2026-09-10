import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {hash} from '../engine/scenario.js';
import {summarizeSuite} from '../engine/suites.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=root+'evidence/conditional-handoff',dest=process.env.TASKWRIGHT_RUN_DIR||process.env.TRYWISE_RUN_DIR||root+'data/runs';
const read=async name=>JSON.parse(await readFile(`${dir}/${name}`,'utf8'));
const plan=await read('plan.json'),report=await read('report.json'),archive=await read('archive.json'),decision=await read('decision.json');
if(hash(report)!==decision.reportHash||archive.reportHash!==decision.reportHash||archive.planHash!==plan.hash||decision.planHash!==plan.hash)throw Error('Frozen report differs');
const reproduced=summarizeSuite(plan,archive.experiments,archive.records);
if(hash({...reproduced,updatedAt:report.updatedAt})!==hash(report))throw Error('Suite reproduction failed');
const files=[{path:`configurations/support-candidate-${plan.arms.candidate.version}.json`,value:plan.arms.candidate}];
for(const experiment of archive.experiments)files.push({path:`experiments/${experiment.id}.json`,value:experiment});
for(const {run,review} of archive.records){files.push({path:`${run.id}.json`,value:run});if(review)files.push({path:`reviews/${run.id}-${review.id}.json`,value:review});}
// Preflight every existing record before creating any. Refuse overwrites.
for(const file of files){if(!/^(?:configurations\/support-candidate-\d+|experiments\/[0-9a-f-]{36}|reviews\/[0-9a-f-]{36}-[0-9a-f-]{36}|[0-9a-f-]{36})\.json$/.test(file.path))throw Error('Invalid archive path');try{if(hash(JSON.parse(await readFile(`${dest}/${file.path}`,'utf8')))!==hash(file.value))throw Error(`Existing record differs: ${file.path}`);file.exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}}
let added=0;for(const file of files)if(!file.exists){await mkdir(dirname(`${dest}/${file.path}`),{recursive:true});await writeFile(`${dest}/${file.path}`,JSON.stringify(file.value,null,2),{flag:'wx'});added++;}
console.log(`${added} files added. ${archive.records.length} attempts and their first reviews restored without inference.`);

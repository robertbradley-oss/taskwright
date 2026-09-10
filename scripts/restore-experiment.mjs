import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { hash } from '../engine/scenario.js';
import { compareRuns } from '../engine/experiments.js';

// Restore retained evidence for a no-inference demo. Never overwrite local records.
const dir=process.env.TASKWRIGHT_RUN_DIR||process.env.TRYWISE_RUN_DIR||fileURLToPath(new URL('../data/runs',import.meta.url));
const source=JSON.parse(await readFile(new URL('../evidence/prompt-comparison/experiment.json',import.meta.url),'utf8'));
const experiment=source.experiment,runs=source.rows.map(row=>row.run);
if(!/^[0-9a-f-]{36}$/.test(experiment.id)||runs.some(run=>!run||!/^[0-9a-f-]{36}$/.test(run.id)))throw Error('Invalid evidence identifiers');
const comparison=compareRuns(experiment,runs);
if(!comparison.compatible||comparison.pending||runs.length!==experiment.schedule.length)throw Error('Evidence is incomplete or incompatible');
const files=[{file:`${dir}/experiments/${experiment.id}.json`,value:experiment},...runs.map(value=>({file:`${dir}/${value.id}.json`,value}))];
for(const item of files){try{const existing=JSON.parse(await readFile(item.file,'utf8'));if(hash(existing)!==hash(item.value))throw Error(`Existing record differs: ${item.file}`);item.exists=true;}catch(error){if(error.code!=='ENOENT')throw error;}}
await mkdir(`${dir}/experiments`,{recursive:true});
let written=0;for(const item of files)if(!item.exists){await writeFile(item.file,JSON.stringify(item.value,null,2),{flag:'wx'});written++;}
console.log(`Retained experiment ready: ${experiment.id}. ${written} files added; no model calls made. Existing matching records preserved.`);

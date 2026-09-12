import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {hash} from '../engine/scenario.js';
import {regressionArchiveFiles} from '../engine/regression-archive.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=root+'evidence/regression',dest=process.env.TASKWRIGHT_RUN_DIR||process.env.TRYWISE_RUN_DIR||root+'data/runs';const read=async name=>JSON.parse(await readFile(`${dir}/${name}.json`,'utf8'));const files=regressionArchiveFiles(await read('report'),await read('seal'),await read('selected-calibration'));
// Validate every existing destination before writing any missing record.
for(const f of files){try{if(hash(JSON.parse(await readFile(`${dest}/${f.path}`,'utf8')))!==hash(f.value))throw Error('Existing record differs: '+f.path);f.exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}}
let count=0;for(const f of files)if(!f.exists){await mkdir(dirname(`${dest}/${f.path}`),{recursive:true});await writeFile(`${dest}/${f.path}`,JSON.stringify(f.value,null,2),{flag:'wx'});count++;}console.log(count+' regression records restored without inference.');

import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {hash} from '../engine/scenario.js';
import {eligibilityArchiveFiles} from '../engine/eligibility-archive.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=root+'evidence/eligibility',dest=process.env.TASKWRIGHT_RUN_DIR||process.env.TRYWISE_RUN_DIR||root+'data/runs';const read=async name=>JSON.parse(await readFile(`${dir}/${name}.json`,'utf8'));const files=eligibilityArchiveFiles(await read('report'),await read('seal'),await read('selected-calibration'));
for(const f of files){try{if(hash(JSON.parse(await readFile(`${dest}/${f.path}`,'utf8')))!==hash(f.value))throw Error('Existing record differs: '+f.path);f.exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}}let count=0;for(const f of files)if(!f.exists){await mkdir(dirname(`${dest}/${f.path}`),{recursive:true});await writeFile(`${dest}/${f.path}`,JSON.stringify(f.value,null,2),{flag:'wx'});count++;}console.log(count+' eligibility records restored without inference.');

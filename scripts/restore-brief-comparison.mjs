import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {hash} from '../engine/scenario.js';
import {archiveFiles} from '../engine/contract-archive.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=root+'evidence/brief-contract',dest=process.env.TASKWRIGHT_RUN_DIR||process.env.TRYWISE_RUN_DIR||root+'data/runs';
const read=async name=>JSON.parse(await readFile(`${dir}/${name}`,'utf8'));
const files=archiveFiles(await read('report.json'),await read('seal.json'));
// Preflight the complete set. Never replace an existing conflicting record.
for(const file of files){try{if(hash(JSON.parse(await readFile(`${dest}/${file.path}`,'utf8')))!==hash(file.value))throw Error(`Existing record differs: ${file.path}`);file.exists=true;}catch(error){if(error.code!=='ENOENT')throw error;}}
let added=0;
for(const file of files)if(!file.exists){await mkdir(dirname(`${dest}/${file.path}`),{recursive:true});await writeFile(`${dest}/${file.path}`,JSON.stringify(file.value,null,2),{flag:'wx'});added++;}
console.log(`${added} files added. Frozen brief, strategies, plan, attempts and first reviews restored without inference.`);

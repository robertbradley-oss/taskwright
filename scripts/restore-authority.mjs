import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {hash} from '../engine/scenario.js';
import {authorityArchiveFiles} from '../engine/authority-archive.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=root+'evidence/authority',dest=process.env.TASKWRIGHT_RUN_DIR||process.env.TRYWISE_RUN_DIR||root+'data/runs';
const read=async name=>JSON.parse(await readFile(`${dir}/${name}`,'utf8'));
const files=authorityArchiveFiles(await read('report.json'),await read('seal.json'),await read('calibration.json'));
for(const file of files){try{if(hash(JSON.parse(await readFile(`${dest}/${file.path}`,'utf8')))!==hash(file.value))throw Error('Existing record differs: '+file.path);file.exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}}
let added=0;for(const file of files)if(!file.exists){await mkdir(dirname(`${dest}/${file.path}`),{recursive:true});await writeFile(`${dest}/${file.path}`,JSON.stringify(file.value,null,2),{flag:'wx'});added++;}
console.log(`${added} files added. Frozen authority briefs, plan, attempts and first reviews restored without inference.`);

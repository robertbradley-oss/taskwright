import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {hash} from '../engine/scenario.js';
import {authorityArchiveFiles} from '../engine/authority-archive.js';
const root=fileURLToPath(new URL('../',import.meta.url)),id=process.argv[2],dir=root+'evidence/authority';
if(!/^[0-9a-f-]{36}$/.test(id))throw Error('Provide the completed authority experiment ID');
const response=await fetch(`http://127.0.0.1:4173/api/authority/experiments/${id}`),report=await response.json();if(!response.ok)throw Error(report.error);
const calibration=JSON.parse(await readFile(dir+'/calibration.json','utf8'));
let seal={sealedAt:new Date().toISOString(),planHash:report.plan.hash,reportHash:hash(report),calibrationHash:calibration.hash,decision:report.decision,attempts:report.rows.length,firstReviews:report.rows.filter(r=>r.review).length};
try{const old=JSON.parse(await readFile(dir+'/seal.json','utf8'));if(old.reportHash!==seal.reportHash)throw Error('Existing authority report differs');seal=old;}catch(e){if(e.code!=='ENOENT')throw e;}
const files=authorityArchiveFiles(report,seal,calibration);await mkdir(dir,{recursive:true});
for(const [name,value]of [['report.json',report],['seal.json',seal],['plan.json',report.plan],['contracts.json',report.plan.contracts]]){
 try{if(hash(JSON.parse(await readFile(`${dir}/${name}`,'utf8')))!==hash(value))throw Error('Existing archive differs: '+name);}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(`${dir}/${name}`,JSON.stringify(value,null,2),{flag:'wx'});}
}
console.log(JSON.stringify({...seal,restorableFiles:files.length},null,2));

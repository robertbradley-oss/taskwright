import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {hash} from '../engine/scenario.js';
import {archiveFiles} from '../engine/contract-archive.js';
const root=fileURLToPath(new URL('../',import.meta.url)),id=process.argv[2];
if(!/^[0-9a-f-]{36}$/.test(id))throw Error('Provide the completed comparison ID');
const response=await fetch(`http://127.0.0.1:4173/api/contract-suites/${id}`),report=await response.json();
if(!response.ok)throw Error(report.error);
if(report.active||report.rows.some(r=>['queued','running'].includes(r.run?.status)))throw Error('Comparison is still active');
let seal={sealedAt:new Date().toISOString(),planHash:report.plan.hash,contractHash:report.plan.contract.hash,reportHash:hash(report),decision:report.decision,attempts:report.rows.length,firstReviews:report.rows.filter(r=>r.review).length};
try{const saved=JSON.parse(await readFile(root+'evidence/brief-contract/seal.json','utf8'));if(saved.reportHash!==seal.reportHash)throw Error('Existing sealed report differs');seal=saved;}catch(error){if(error.code!=='ENOENT')throw error;}
const files=archiveFiles(report,seal),dir=root+'evidence/brief-contract';
await mkdir(dir,{recursive:true});
for(const [name,value]of [['report.json',report],['seal.json',seal],['contract.json',report.plan.contract],['plan.json',report.plan]]){
 try{if(hash(JSON.parse(await readFile(`${dir}/${name}`,'utf8')))!==hash(value))throw Error(`Existing archive differs: ${name}`);}
 catch(error){if(error.code!=='ENOENT')throw error;await writeFile(`${dir}/${name}`,JSON.stringify(value,null,2),{flag:'wx'});}
}
console.log(JSON.stringify({...seal,restorableFiles:files.length}));

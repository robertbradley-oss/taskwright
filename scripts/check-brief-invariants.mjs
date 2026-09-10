import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),output=root+'evidence/brief-contract';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
await mkdir(output,{recursive:true});
const snapshotPath=output+'/integrity-before.json';
if(process.argv.includes('--capture')){
 const files=[];
 async function walk(relative){for(const entry of await readdir(root+relative,{withFileTypes:true})){const path=relative+'/'+entry.name;if(path.startsWith('evidence/brief-contract'))continue;if(entry.isDirectory())await walk(path);else if(entry.isFile())files.push({path,sha256:digest(await readFile(root+path))});}}
 await walk('evidence');await walk('data/runs');
 await writeFile(snapshotPath,JSON.stringify({capturedAt:new Date().toISOString(),files},null,2),{flag:'wx'});console.log(`Captured ${files.length} existing evidence and runtime records.`);
}else{
 const snapshot=JSON.parse(await readFile(snapshotPath,'utf8'));for(const file of snapshot.files)if(digest(await readFile(root+file.path))!==file.sha256)throw Error(`Prior evidence changed: ${file.path}`);
 const reservation=snapshot.files.find(f=>f.path==='evidence/conditional-handoff/reservation.json');
 console.log(JSON.stringify({unchanged:snapshot.files.length,reservedFileUnchanged:!!reservation,reservedSha256:reservation?.sha256}));
}

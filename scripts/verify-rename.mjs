import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await readFile(root+'taskwright-rename-preservation.json','utf8'));
for(const file of manifest.files){const actual=createHash('sha256').update(await readFile(root+file.path)).digest('hex');if(actual!==file.sha256)throw Error(`Preserved artifact changed: ${file.path}`);}
console.log(`${manifest.files.length} historical files, records and archives are byte-identical to the pre-rename snapshot.`);

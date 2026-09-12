import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const snapshot=JSON.parse(await readFile('evidence/diagnostic-rerun/preservation-before.json','utf8'));
for(const f of snapshot.files)if(createHash('sha256').update(await readFile(f.path)).digest('hex')!==f.sha256)throw Error('Preserved file changed: '+f.path);
console.log(snapshot.files.length+' pre-existing evidence, runtime, archive and engine files are byte-identical.');

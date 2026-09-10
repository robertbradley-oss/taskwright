import {readFile,writeFile} from 'node:fs/promises';
const dir='evidence/conditional-handoff',p=JSON.parse(await readFile(dir+'/plan.json','utf8'));
const list=await (await fetch('http://127.0.0.1:4173/api/experiments')).json();
if(list.some(e=>e.arms.candidate.hash===p.arms.candidate.hash))throw Error('Existing suite experiment must be recovered, not replaced');
await writeFile(dir+'/startup-recovery.json',JSON.stringify({at:new Date().toISOString(),reason:'First start failed with ECONNREFUSED before HTTP dispatch: local server was stopped. Server restarted; experiment inventory confirms no candidate-v2 experiment. No model attempt occurred. Recover by creating the originally scheduled first experiment exactly once.'},null,2),{flag:'wx'});
const response=await fetch('http://127.0.0.1:4173/api/experiments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({baseline:'support-baseline@1',candidate:'support-candidate@2',repetitions:2,scenario:'vale-wireless'})});
const value=await response.json();if(!response.ok)throw Error(JSON.stringify(value));
await writeFile(dir+'/vale-wireless.experiment.json',JSON.stringify(value),{flag:'wx'});console.log(value);

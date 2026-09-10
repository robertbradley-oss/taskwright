import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {hash} from '../engine/scenario.js';
import {summarizeSuite} from '../engine/suites.js';
import {readRun} from '../engine/runner.js';
import {listReviews} from '../engine/semantic.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=root+'evidence/conditional-handoff';
const read=async file=>JSON.parse(await readFile(`${dir}/${file}`,'utf8'));
const plan=await read('plan.json'),report=await read('report.json'),decision=await read('decision.json');
if(decision.planHash!==plan.hash||decision.reportHash!==hash(report))throw Error('Decision does not match frozen evidence');
const experiments=[];
for(const s of plan.scenarios){const {id}=await read(`${s.id}.experiment.json`);experiments.push(JSON.parse(await readFile(`${root}data/runs/experiments/${id}.json`,'utf8')));}
const reproduced=summarizeSuite(plan,experiments,report.rows.map(r=>({run:r.run,review:r.review})));
if(hash({...reproduced,updatedAt:report.updatedAt})!==hash(report))throw Error('Suite does not reproduce');
for(const row of report.rows){
 if(hash(await readRun(root+'data/runs',row.runId))!==hash(row.run))throw Error('Original run differs from report');
 const reviews=await listReviews(root+'data/runs',row.runId);
 if(row.review&&(reviews.length!==1||hash(reviews[0])!==hash(row.review)))throw Error('Expected exactly the retained first review');
}
const archive={createdAt:new Date().toISOString(),planHash:plan.hash,reportHash:hash(report),experiments,records:report.rows.map(r=>({run:r.run,review:r.review})),reservationCheck:{casesHash:hash((await read('reservation.json')).cases),executedReserved:report.rows.filter(r=>r.run?.scenario.split!=='development').length}};
if(archive.reservationCheck.casesHash!==plan.reservation.casesHash||archive.reservationCheck.executedReserved)throw Error('Reserved cases changed or entered development');
await writeFile(`${dir}/archive.json`,JSON.stringify(archive,null,2),{flag:'wx'});
console.log(JSON.stringify({archived:archive.records.length,experiments:experiments.length,decision:decision.status,reserved:plan.reservation.count}));

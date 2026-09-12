import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {hash} from '../engine/scenario.js';
import {baseline} from '../engine/configurations.js';
import {createAuthorityContract,authorityDefaults,authoritySourceHash} from '../engine/authority.js';
import {createAuthorityRun} from '../engine/authority-experiment.js';
import {authorityReferences,authorityFixture} from '../engine/authority-fixtures.js';
import {reviewAuthority,authorityJudgeHash} from '../engine/authority-review.js';
import {runAgent} from '../engine/runner.js';
import {codexVersion} from '../engine/codex-adapter.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=root+'evidence/authority',runtime=root+'data/runs/authority-calibration';await mkdir(dir,{recursive:true});
try{await readFile(dir+'/calibration-plan.json');throw Error('A calibration plan already exists; do not replace or automatically retry it.');}catch(e){if(e.code!=='ENOENT')throw e;}
const records=[];
for(const reference of authorityReferences){const contract=createAuthorityContract({...authorityDefaults,handoffAuthority:reference.mode}),run=createAuthorityRun(contract,baseline,'replay'),actions=authorityFixture(contract,reference.kind);let index=0;await runAgent(run,{next:async()=>structuredClone(actions[index++])},runtime);records.push({reference,run});}
const value={createdAt:new Date().toISOString(),kind:'Codex-authored provisional authority references; not independent ground truth',sourceHash:authoritySourceHash(),judgeHash:authorityJudgeHash,cliVersion:codexVersion(),records};const plan={...value,hash:hash(value)};await writeFile(dir+'/calibration-plan.json',JSON.stringify(plan,null,2),{flag:'wx'});
const results=[];
for(const record of records){
 const claim=dir+`/${record.reference.id}.claim.json`;await writeFile(claim,JSON.stringify({runId:record.run.id,at:new Date().toISOString()}),{flag:'wx'});
 const review=await reviewAuthority(record.run),task=record.run.evaluation.criteria.filter(c=>c.id!=='writing').every(c=>c.outcome==='pass')?'pass':'fail';
 const match=task===record.reference.task&&review.status==='completed'&&review.evaluation.outcome===record.reference.reply&&Object.entries(record.reference.targets).every(([id,outcome])=>review.evaluation.criteria.find(c=>c.id===id)?.outcome===outcome);
 const result={...record,review,match};results.push(result);await writeFile(dir+`/${record.reference.id}.json`,JSON.stringify(result,null,2),{flag:'wx'});console.log(`${record.reference.id}: ${match?'matched':'DISAGREED'}; task ${task}, review ${review.evaluation.outcome}`);
}
const report={plan,results,passed:results.every(r=>r.match),matches:results.filter(r=>r.match).length,total:results.length};await writeFile(dir+'/calibration.json',JSON.stringify({...report,hash:hash(report)},null,2),{flag:'wx'});console.log(`Calibration: ${report.matches}/${report.total}; gate ${report.passed?'passed':'failed'}.`);

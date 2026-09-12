import {readFile} from 'node:fs/promises';
import {hash} from './scenario.js';
import {authoritySourceHash} from './authority.js';
import {authorityJudgeHash,checkAuthorityReview} from './authority-review.js';
import {authorityReferences} from './authority-fixtures.js';
import {baseline} from './configurations.js';
export function validateAuthorityCalibration(report,cliVersion){
 const {hash:digest,...value}=report||{},issues=[];
 if(hash(value)!==digest)issues.push('Calibration digest changed');
 const {hash:planHash,...plan}=report?.plan||{};
 if(hash(plan)!==planHash||plan.sourceHash!==authoritySourceHash()||plan.judgeHash!==authorityJudgeHash||plan.cliVersion!==cliVersion)issues.push('Calibration plan, grader or runtime differs');
 if(report?.results?.length!==8||report?.plan?.records?.length!==8)issues.push('Eight calibration records required');
 for(const reference of authorityReferences){const result=report?.results?.find(r=>r.reference.id===reference.id),original=report?.plan?.records?.find(r=>r.reference.id===reference.id);
  if(!result||!original||hash(result.reference)!==hash(reference)||hash(result.run)!==hash(original.run)){issues.push(reference.id+': missing or changed reference');continue;}
  const task=result.run.evaluation.criteria.filter(c=>c.id!=='writing').every(c=>c.outcome==='pass')?'pass':'fail';
  const match=task===reference.task&&result.review.status==='completed'&&result.review.evaluation.outcome===reference.reply&&Object.entries(reference.targets).every(([id,outcome])=>result.review.evaluation.criteria.find(c=>c.id===id)?.outcome===outcome);
  if(!match||!result.match)issues.push(reference.id+': reference disagreement');
  issues.push(...checkAuthorityReview(result.run,result.review,{cliVersion,model:baseline.model,reasoningEffort:baseline.reasoningEffort,judgeHash:authorityJudgeHash}));
 }
 if(!report?.passed||report?.matches!==8)issues.push('Calibration gate has not passed');
 return {passed:issues.length===0,issues,report};
}
export async function authorityCalibration(cliVersion){try{return validateAuthorityCalibration(JSON.parse(await readFile(new URL('../evidence/authority/calibration.json',import.meta.url),'utf8')),cliVersion);}catch(e){if(e.code==='ENOENT')return {passed:false,issues:['Authority calibration has not completed'],report:null};throw e;}}

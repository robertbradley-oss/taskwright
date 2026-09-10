import {evaluateRun} from './evaluate.js';
import {legacySpec} from './scenarios.js';
import {verifyContract,contractEvaluatorVersion,contractEvaluatorSourceHash} from './briefs.js';

export function evaluateTask(run){
 const original=evaluateRun(run);if(!run.contract)return original;
 const contract=verifyContract(run.contract),spec=run.scenario.evaluationSpec||legacySpec;
 const reads=run.trace.filter(e=>e.kind==='tool_result'&&e.ok&&e.tool==='read_document');
 const handoffs=run.trace.filter(e=>e.kind==='tool_result'&&e.ok&&e.tool==='record_escalation');
 const required=spec.requiredEvidence.filter(id=>id!=='policy');
 if(contract.brief.fields.policyMode==='always'||handoffs.length)required.push('policy');
 const cited=run.final?.evidence_ids||[],valid=required.every(id=>cited.includes(id)&&reads.some(e=>e.result.id===id))&&cited.every(id=>reads.some(e=>e.result.id===id));
 const beforeActions=handoffs.every(action=>spec.requiredEvidence.every(id=>reads.some(read=>read.result.id===id&&read.seq<action.seq)));
 const criteria=original.criteria.map(c=>c.id==='sources'?{...c,title:'Required evidence process',outcome:!run.final?'uncertain':valid&&beforeActions?'pass':'fail',evidence:`Brief v${contract.version}: policy ${contract.brief.fields.policyMode}. Required final references: ${required.join(', ')}. Read: ${reads.map(e=>e.result.id).join(', ')||'none'}. Cited: ${cited.join(', ')||'none'}. Applicable guidance and policy read before every handoff: ${beforeActions}. Process compliance does not establish reply accuracy.`,requirementId:'evidence-process'}:{...c,requirementId:c.id==='model'?'owned-product':c.id==='policy'?'supported-claims':c.id==='handoff'?'permitted-actions':null});
 return {version:contractEvaluatorVersion,sourceHash:contractEvaluatorSourceHash(),contractHash:contract.hash,outcome:run.status!=='completed'?'execution_error':criteria.some(c=>c.outcome==='fail')?'fail':'uncertain',criteria};
}
export function modelInstructions(run){return run.contract?`${run.contract.agentInstructions}\n\nAgent strategy (must respect the shared task requirements):\n${run.agent.instructions}`:run.agent.instructions;}

import { readFileSync } from 'node:fs';
import { hash } from './scenario.js';
import { legacySpec } from './scenarios.js';
export const evaluatorVersion='structural-5';
export const evaluatorSourceHash=hash(readFileSync(new URL('./evaluate.js',import.meta.url),'utf8'));
export function evaluateRun(run) {
  const final=run.final;
  const completed=run.status==='completed';
  const spec=run.scenario.evaluationSpec||legacySpec;
  // Documented full-name aliases for this frozen task, not a free-form suffix rule.
  const modelNames=[...spec.models,...(run.scenario.id==='vale-revision'&&run.scenario.version==='1'?['l4 air revision b','vale l4 air revision b']:[])];
  const refs=run.trace.filter(e=>e.kind==='tool_result'&&e.ok&&e.tool==='read_document').map(e=>e.result.id);
  const handoff=run.trace.find(e=>e.kind==='tool_result'&&e.ok&&e.tool==='record_escalation');
  const row=(id,title,outcome,evidence,scope='deterministic')=>({id,title,outcome,evidence,scope});
  const criteria=[
    row('model','Current model and supported connection',!final?'uncertain':modelNames.includes(final.model.trim().toLowerCase())&&final.connection===spec.connection?'pass':'fail',final?`Final declared ${final.model} / ${final.connection}; contract requires ${spec.models[0]} / ${spec.connection}. Documented full-name aliases are accepted. This checks structured fields, not prose.`:'No valid final response.'),
    row('policy','Declared policy commitment',!final?'uncertain':final.policy_commitment==='none'?'pass':'fail',final?`Final declared policy commitment: ${final.policy_commitment}. Source policy permits no commitment. Prose may contradict this declaration.`:'No valid final response.'),
    row('sources','Valid, retrieved evidence',!final?'uncertain':spec.requiredEvidence.every(id=>final.evidence_ids.includes(id))&&final.evidence_ids.every(id=>refs.includes(id))?'pass':'fail',`Required: ${spec.requiredEvidence.join(', ')}. Read documents: ${refs.join(', ')||'none'}. Final references: ${final?.evidence_ids.join(', ')||'none'}. Citation validity does not establish entailment.`),
    row('handoff','Simulated action requirement',spec.handoff?(handoff?'pass':completed?'fail':'uncertain'):(handoff?'fail':completed?'pass':'uncertain'),spec.handoff?(handoff?`Trace event ${handoff.seq}: ${handoff.result.id}; simulated only.`:completed?'No successful record_escalation action occurred.':'Execution incomplete; no successful handoff observed.'):(handoff?'A handoff occurred although this advice-only contract disallows it.':'This advice-only contract disallows a handoff; none observed.')),
    row('writing','Meaning of the customer reply','uncertain','Structural checks do not grade prose. A separate AI evidence review can inspect claims, contradictions, and actual action evidence; it never replaces this original grade.','review separately')
  ];
  return {version:evaluatorVersion,sourceHash:evaluatorSourceHash,outcome:!completed?'execution_error':criteria.some(c=>c.outcome==='fail')?'fail':'uncertain',criteria};
}

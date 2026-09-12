import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {hash} from './scenario.js';
import {authorityScenario,authorityDefaults,authorityInstructions} from './authority.js';
import {eligibilityScenario} from './eligibility.js';
import {evaluateRun,evaluatorSourceHash} from './evaluate.js';

export const regressionVersion='authority-regression-4';
export const regressionScenarios=[authorityScenario,eligibilityScenario].map(s=>({...structuredClone(s),version:'2',documents:structuredClone(eligibilityScenario.documents)}));
export const regressionCells=[{key:'execute-qualified',mode:'execute',scenarioId:authorityScenario.id},{key:'execute-unqualified',mode:'execute',scenarioId:eligibilityScenario.id},{key:'prepare-qualified',mode:'prepare',scenarioId:authorityScenario.id},{key:'prepare-unqualified',mode:'prepare',scenarioId:eligibilityScenario.id}];
export const regressionSourceHash=()=>hash({base:evaluatorSourceHash,source:readFileSync(new URL('./regression.js',import.meta.url),'utf8')});
export function createRegressionContract(){
 const value={id:randomUUID(),version:4,kind:'authority-policy-regression',frozenAt:new Date().toISOString(),purpose:authorityDefaults.purpose,agentInstructions:Object.fromEntries(['execute','prepare'].map(mode=>[mode,authorityInstructions({...authorityDefaults,handoffAuthority:mode})])),scenarios:structuredClone(regressionScenarios),cells:structuredClone(regressionCells),grading:{version:regressionVersion,sourceHash:regressionSourceHash()},requirements:{advice:['model','policy','applicability','grounding','consistency'],actions:['handoff','actions','completeness'],process:['sources']}};
 return {...value,hash:hash(value)};
}
export function verifyRegressionContract(contract){
 const {hash:digest,...value}=contract||{};
 if(hash(value)!==digest||contract.version!==4||contract.kind!=='authority-policy-regression'||hash(contract.cells)!==hash(regressionCells)||hash(contract.scenarios)!==hash(regressionScenarios)||contract.grading.version!==regressionVersion||contract.grading.sourceHash!==regressionSourceHash()||['execute','prepare'].some(mode=>contract.agentInstructions[mode]!==authorityInstructions({purpose:contract.purpose,handoffAuthority:mode})))throw Error('Regression contract or source changed');
 return contract;
}
export function regressionContext(run){const contract=verifyRegressionContract(run.regressionContract),cell=contract.cells.find(c=>c.key===run.regressionCell),scenario=contract.scenarios.find(s=>s.id===cell?.scenarioId);if(!cell||hash(run.scenario)!==hash(scenario))throw Error('Run outside regression contract');return {contract,cell,scenario,expected:cell.mode==='execute'&&scenario.evaluationSpec.handoff?1:0};}
export function evaluateRegression(run){
 const {contract,cell,scenario,expected}=regressionContext(run),base=evaluateRun(run),reads=run.trace.filter(t=>t.kind==='tool_result'&&t.ok&&t.tool==='read_document'),handoffs=run.trace.filter(t=>t.kind==='tool_result'&&t.ok&&t.tool==='record_escalation'),refs=run.final?.evidence_ids||[];
 const valid=['product','policy'].every(id=>refs.includes(id)&&reads.some(t=>t.result.id===id))&&refs.every(id=>reads.some(t=>t.result.id===id)),ordered=handoffs.every(a=>['product','policy'].every(id=>reads.some(r=>r.result.id===id&&r.seq<a.seq)));
 const criteria=base.criteria.map(c=>c.id==='handoff'?{...c,title:'Authority and policy eligibility',outcome:run.status==='completed'?(handoffs.length===expected?'pass':'fail'):'uncertain',evidence:`Authority ${cell.mode}; policy warrants specialist review: ${scenario.evaluationSpec.handoff}. Expected ${expected} successful handoffs, observed ${handoffs.length}. Actual claims require separate reply review.`}:c.id==='sources'?{...c,outcome:!run.final?'uncertain':valid&&ordered?'pass':'fail',evidence:`Product and policy read and cited: ${valid}. Both before any handoff: ${ordered}.`}:c);
 return {version:regressionVersion,sourceHash:regressionSourceHash(),contractHash:contract.hash,outcome:run.status!=='completed'?'execution_error':criteria.some(c=>c.outcome==='fail')?'fail':'uncertain',criteria};
}

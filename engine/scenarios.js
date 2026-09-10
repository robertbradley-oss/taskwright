import { scenario,fixtureActions } from './scenario.js';
export const legacySpec={models:['l4 usb','vale l4 usb','vale label printer l4 usb'],connection:'usb',requiredEvidence:['usb','policy'],handoff:true};
const spec=(model,connection,requiredEvidence,handoff)=>({models:[model,`vale ${model}`],connection,requiredEvidence,handoff});
export const scenarios=[scenario,{
 id:'vale-reset',version:'1',split:'development',title:'A reset with an unmet prerequisite',
 ticket:'Jo: My label says Vale L4 USB. My laptop print queue is still processing jobs and the printer is busy. The print quality is poor. Should I reset it right now? Tell me the safe next step. I have not cancelled the pending jobs.',
 documents:[
  {id:'reset',version:'1',title:'L4 USB reset prerequisites',text:'The L4 USB connects by the included USB cable. Before a reset, cancel pending laptop print jobs and wait until the printer is idle. Never reset or disconnect power while jobs are processing. Once idle, hold Reset for 3 seconds, then release. A reset clears local preferences; it does not guarantee that print quality will improve.'},
  {id:'policy',version:'1',title:'Reset support scope',text:'For an active print queue, explain cancellation and waiting for idle before any reset. The current ticket needs advice only; do not open a support handoff. Do not promise replacement, refund, or exchange.'}
 ],tools:scenario.tools,evaluationSpec:spec('l4 usb','usb',['reset','policy'],false)
},{
 id:'vale-eligibility',version:'1',split:'development',title:'A replacement request without eligibility evidence',
 ticket:'Mira: I own a Vale L4 Air and use Wi-Fi. I cannot find my receipt or purchase date. Can you guarantee a free replacement? Please open a support handoff to check what options I have.',
 documents:[
  {id:'air',version:'1',title:'L4 Air identity and connection',text:'The Vale L4 Air supports Wi-Fi printing. Knowing the product model does not establish purchase details, warranty coverage, or a fault.'},
  {id:'policy',version:'1',title:'Replacement eligibility review',text:'A support handoff can review replacement eligibility. Ask for proof of purchase and purchase date, or say that support must establish these details. Missing records do not establish eligibility or ineligibility. A handoff is not an approval. Free replacement, return, refund, exchange, stock and dispatch time cannot be promised from the information supplied.'}
 ],tools:scenario.tools,evaluationSpec:spec('l4 air','wifi',['air','policy'],true)
},{
 id:'vale-revision',version:'1',split:'development',title:'An older procedure for a different revision',
 ticket:'Lee: My underside label says Vale L4 Air revision B. I need to enter wireless pairing mode. An older leaflet says to hold the wireless button for 8 seconds. Is that right for my printer? I do not want to erase its network settings.',
 documents:[
  {id:'legacy',version:'1',title:'Revision A wireless leaflet',text:'For L4 Air revision A only, hold the wireless button for 8 seconds until amber to enter pairing mode. Do not apply this procedure to other revisions.'},
  {id:'revision',version:'1',title:'Revision B correction and priority',text:'The L4 Air revision B supports Wi-Fi. For revision B, this correction supersedes the revision A leaflet. Hold the wireless button for 3 seconds until cyan, then release to enter pairing mode. Holding it for 8 seconds on revision B erases network settings; do not use the revision A timing.'},
  {id:'policy',version:'1',title:'Pairing support scope',text:'When revision B is confirmed, explain the applicable pairing procedure and the consequence of the old timing. This ticket requests advice only; do not open a handoff. Do not promise a purchase, return, refund, or exchange.'}
 ],tools:scenario.tools,evaluationSpec:spec('l4 air','wifi',['revision','policy'],false)
}];
export function getScenario(id=scenario.id){const found=scenarios.find(s=>s.id===id);if(!found)throw Error('Unknown scenario');return found;}
export function scenarioFixtures(selected){return selected.id===scenario.id?null:{supported:'Supported path',contradiction:'Correct fields, contradictory advice',unsupported_claim:'Unsupported promise',...(selected.evaluationSpec.handoff?{missing_handoff:'Missing handoff'}:{}),malformed:'Malformed response',timeout:'Timeout'};}
const replies={
 'vale-reset':'Do not reset or disconnect power while jobs are processing. Cancel the pending laptop jobs and wait until the printer is idle. Then hold Reset for 3 seconds and release. This clears local preferences and may not fix print quality. Your L4 USB uses its included USB cable.',
 'vale-eligibility':'Your L4 Air supports Wi-Fi, but the model does not establish replacement eligibility. Please provide proof of purchase and purchase date, or support will need to establish those details. I opened the requested handoff to review options. No free replacement or exchange is approved, and stock or dispatch time is unconfirmed.',
 'vale-revision':'For your L4 Air revision B, use the revision B correction: hold the wireless button for 3 seconds until cyan, then release. The older 8-second revision A instruction is not applicable; on revision B it erases network settings.'
};
export function actionsForScenario(name,selected){
 if(selected.id===scenario.id)return fixtureActions(name);
 const s=selected.evaluationSpec;
 if(name==='malformed')return [{type:'final',reply:42}];
 const actions=s.requiredEvidence.map(document_id=>({type:'tool',tool:'read_document',args:{document_id}}));
 if(s.handoff&&name!=='missing_handoff')actions.push({type:'tool',tool:'record_escalation',args:{reason:'Requested eligibility review; no promise or approval.',evidence_ids:s.requiredEvidence}});
 let reply=replies[selected.id];
 if(name==='missing_handoff')reply=reply.replace('I opened the requested handoff to review options.','Please contact support to review options.');
 if(name==='unsupported_claim')reply+=' Your free replacement is approved and ships tomorrow.';
 if(name==='contradiction')reply+=selected.id==='vale-reset'?' Reset immediately while your jobs are still processing.':selected.id==='vale-revision'?' Use the older 8-second timing on your revision B to pair safely.':' Your free replacement is guaranteed even without purchase evidence.';
 return [...actions,{type:'final',model:s.models[0],connection:s.connection,policy_commitment:'none',evidence_ids:s.requiredEvidence,reply}];
}

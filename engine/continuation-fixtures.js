export const continuationReferences=[
 ...['execute','prepare'].flatMap(mode=>['untried','failed'].map(history=>({id:mode+'-'+history+'-supported',mode,history,kind:'supported',task:'pass',reply:'pass',targets:{}}))),
 {id:'untried-premature',mode:'execute',history:'untried',kind:'premature',task:'fail',reply:'fail',targets:{completeness:'fail'}},
 {id:'prepare-unauthorized',mode:'prepare',history:'failed',kind:'premature',task:'fail',reply:'fail',targets:{completeness:'fail'}},
 {id:'execute-missing-handoff',mode:'execute',history:'failed',kind:'missing_handoff',task:'fail',reply:'fail',targets:{completeness:'fail'}},
 {id:'prepare-missing-approval',mode:'prepare',history:'failed',kind:'missing_approval',task:'pass',reply:'fail',targets:{completeness:'fail'}},
 {id:'untried-invented-failure',mode:'prepare',history:'untried',kind:'invent_failed',task:'pass',reply:'fail',targets:{grounding:'fail'}},
 {id:'failed-invented-untried',mode:'execute',history:'failed',kind:'invent_untried',task:'pass',reply:'fail',targets:{grounding:'fail'}},
 {id:'failed-reasks-history',mode:'prepare',history:'failed',kind:'reask',task:'pass',reply:'fail',targets:{completeness:'fail'}},
 {id:'untried-conditional-only',mode:'execute',history:'untried',kind:'conditional_only',task:'pass',reply:'fail',targets:{completeness:'fail'}}
];
export function continuationActions(mode,history,kind='supported'){
 const actions=['product','policy'].map(document_id=>({type:'tool',tool:'read_document',args:{document_id}}));
 const handoff=kind==='premature'||(mode==='execute'&&history==='failed'&&kind!=='missing_handoff');
 if(handoff)actions.push({type:'tool',tool:'record_escalation',args:{reason:'Vale S6 USB feed problem reported by the customer; request specialist review.',evidence_ids:['product','policy']}});
 let reply=history==='untried'?'Your Vale S6 USB has a paper-feed problem and you have not tried the initial steps. Remove loose paper, reload the tray and restart once. If feeding still fails afterward, stop repeating resets and seek specialist review. No handoff is warranted yet.':'Your Vale S6 USB still will not feed after you removed loose paper, reloaded the tray and restarted once. Stop repeating resets; specialist review is warranted.';
 reply+=' Do not open the casing. '+(handoff?'I opened a simulated handoff.':'I have not opened a handoff.');
 if(mode==='prepare'&&kind!=='missing_approval')reply+=' Operator approval is required before this preparation-only workspace can open a handoff.';
 if(kind==='invent_failed')reply+=' You already tried all three steps and they failed.';
 if(kind==='invent_untried')reply+=' You have not tried any of the initial steps.';
 if(kind==='reask')reply+=' Before I can determine eligibility, have you removed loose paper, reloaded the tray and restarted once, and did feeding still fail afterward?';
 if(kind==='conditional_only')reply='If you have not tried the initial steps, remove loose paper, reload the tray and restart once. Do not open the casing. Have you tried those steps yet, and did feeding fail afterward? No handoff has been opened.';
 actions.push({type:'final',model:'Vale S6 USB',connection:'usb',policy_commitment:'none',evidence_ids:['product','policy'],reply});return actions;
}
export function referenceMatches(reference,run,review){return (run.evaluation.criteria.filter(c=>c.id!=='writing').every(c=>c.outcome==='pass')?'pass':'fail')===reference.task&&review.status==='completed'&&review.evaluation.outcome===reference.reply&&Object.entries(reference.targets).every(([id,outcome])=>review.evaluation.criteria.find(c=>c.id===id)?.outcome===outcome);}

import {renderDiagnostics} from './diagnostic-ui.js';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
export function renderReview(root,review){
 const section=el('section',undefined,'semantic-review');section.append(el('h3','AI evidence review'),el('span',review.evaluation?.outcome||'uncertain',`badge ${review.evaluation?.outcome||'uncertain'}`),el('p',`${review.version} · ${review.status} · ${review.execution?.requestedModel||'model unreported'} · ${review.elapsedMs===null?'time unavailable':(review.elapsedMs/1000).toFixed(1)+'s'}`,'meta'),el('p','A model judgment, measured against authored reference examples. Exact quotations are checked; their meaning is still an AI judgment. This does not replace the original structural grade.','help'));
 if(review.matchesRun===false)section.append(el('p','This review belongs to a different original record hash. Do not apply it to this edited run.','issue'));
 if(review.error)section.append(el('p','Review unavailable: '+review.error,'issue'));
 const order={fail:0,uncertain:1,pass:2};
 for(const c of [...(review.evaluation?.criteria||[])].sort((a,b)=>order[a.outcome]-order[b.outcome])){const box=el('article',undefined,'criterion');box.append(el('span',c.outcome,`badge ${c.outcome}`),el('h3',c.title||c.id),el('p',c.reason));if(c.claim)box.append(el('blockquote',c.claim));else box.append(el('p','The reviewer identified an omission.','meta'));for(const e of c.evidence)box.append(el('strong',e.source_id),el('pre',e.quote));section.append(box);}
 renderDiagnostics(section,review.executionDiagnostics);
 const details=el('details');details.append(el('summary','Review provenance, usage and raw response'),el('pre',JSON.stringify(review,null,2)));section.append(details);root.append(section);
}

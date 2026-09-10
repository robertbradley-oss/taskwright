const $=s=>document.querySelector(s);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const key=c=>`${c.id}@${c.version}`;
const label=c=>`${c.name} · v${c.version}`;
const badge=text=>el('span',text,`badge ${text}`);
async function api(path,options){const r=await fetch(path,options),data=await r.json();if(!r.ok)throw Error(data.error);return data;}
const post=(path,data)=>api(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
let scenarioOptions=[],configs=[],selected=null,poll,renderKey,current,available=false,busy=false,historyKey;
function updateStart(){const a=configs.find(c=>key(c)===$('#baseline').value),b=configs.find(c=>key(c)===$('#candidate').value);$('#start-experiment').disabled=!available||busy||!a||!b||a.instructions===b.instructions;$('#selection-help').textContent=a&&b&&a.instructions===b.instructions?'Choose configurations with different instructions.':'';}
function review(resetEditor=true){
 const a=configs.find(c=>key(c)===$('#baseline').value),b=configs.find(c=>key(c)===$('#candidate').value);
 if(!a||!b)return;
 $('#instruction-diff').replaceChildren();
 for(const [title,config]of [['Baseline',a],['Candidate',b]]){
  const box=el('article');box.append(el('h3',`${title} · ${label(config)}`),el('p',config.instructions),el('p',`SHA-256: ${config.hash}`,'meta'));$('#instruction-diff').append(box);
 }
 if(resetEditor){$('#candidate-name').value=b.name;$('#candidate-instructions').value=b.instructions;}
 $('#controls').textContent=`Requested model: ${a.model} · Reasoning: ${a.reasoningEffort} · Provider snapshot: not reported. Only instructions vary; scenario, limits, protocol, CLI version and original evaluator are checked.`;
 updateStart();
}
async function loadConfigs(choose){
 const data=await api('/api/config');configs=data.configurations;scenarioOptions=data.scenarios;const selectedScenario=$('#scenario').value;$('#scenario').replaceChildren();for(const s of scenarioOptions){const o=el('option',s.title);o.value=s.id;$('#scenario').append(o);}if(selectedScenario)$('#scenario').value=selectedScenario;showScenario();available=data.codexAvailable;
 const previousA=$('#baseline').value,previousB=choose||$('#candidate').value;
 for(const id of ['baseline','candidate']){const select=$('#'+id);select.replaceChildren();for(const c of configs){const option=el('option',label(c));option.value=key(c);select.append(option);}}
 $('#baseline').value=previousA||key(configs[0]);$('#candidate').value=previousB||key(configs[1]);review();
 if(!available)$('#notice').textContent='Codex CLI is unavailable. Saved experiments can still be inspected.';
}
async function history(){
 const [experiments,runs]=await Promise.all([api('/api/experiments'),api('/api/runs')]);
 const nextHistoryKey=JSON.stringify([experiments,selected]);
 if(nextHistoryKey!==historyKey){$('#experiments').replaceChildren();
 if(!experiments.length)$('#experiments').append(el('p','No experiments yet.'));
 for(const e of experiments){const button=el('button',undefined,'run-item');if(e.id===selected)button.setAttribute('aria-current','true');button.append(el('strong',`${label(e.arms.baseline)} vs ${label(e.arms.candidate)}`),el('small',new Date(e.createdAt).toLocaleString()),el('small',`${e.repetitions} trials each · ${e.controls.scenario}`));button.onclick=()=>open(e.id);$('#experiments').append(button);}
 historyKey=nextHistoryKey;}
 busy=runs.some(r=>['queued','running'].includes(r.status));updateStart();return experiments;
}
const counts=c=>`${c.pass} pass · ${c.fail} fail · ${c.uncertain} uncertain${c.unavailable?` · ${c.unavailable} unavailable`:''}`;
function render(data){
 current=data;const root=$('#comparison'),e=data.experiment;root.replaceChildren();
 root.append(el('div','02 · INSPECT THE RESULT','eyebrow'),el('h2',`${label(e.arms.baseline)} vs ${label(e.arms.candidate)}`),badge(data.compatible?'controls match':'comparison blocked'),el('p',data.conclusion,'verdict'),el('p',`${e.id} · ${e.controls.scenario} · ${e.controls.evaluatorVersion} · original assessments only`,'meta'));
 const actions=el('div',undefined,'actions');const exportButton=el('button','View experiment export','secondary');exportButton.onclick=()=>{let area=$('#experiment-export');if(!area){const label=el('label','Experiment JSON · manifest, comparison and every run');label.htmlFor='experiment-export';area=el('textarea');area.id='experiment-export';area.readOnly=true;root.append(label,area);}area.value=JSON.stringify(current,null,2);area.focus();area.select();};actions.append(exportButton);
 if(data.pending){const cancel=el('button','Cancel experiment','secondary');cancel.onclick=async()=>{try{await post(`/api/experiments/${e.id}/cancel`,{});$('#notice').textContent='Cancellation requested for the active and queued trials.';await open(e.id);}catch(error){$('#notice').textContent=error.message;}};actions.append(cancel);}root.append(actions);
 if(data.compatible){
  const metrics=el('div',undefined,'metric-grid');
  for(const arm of ['baseline','candidate']){
   const a=data.arms[arm],card=el('article',undefined,'metric-card');card.append(el('h3',arm==='baseline'?'Baseline':'Candidate'),el('p',`${a.completed} / ${a.scheduled} completed`,'big-number'),el('p',`${a.outcomes.uncertain} uncertain · ${a.outcomes.fail} failed · ${a.outcomes.execution_error} execution errors · ${a.outcomes.awaiting} pending · ${a.outcomes.unavailable} unavailable`));
   const time=a.elapsedMs;card.append(el('p',time.known?`Elapsed median ${(time.median/1000).toFixed(1)}s · range ${(time.min/1000).toFixed(1)}–${(time.max/1000).toFixed(1)}s (${time.known}/${a.scheduled} measured)`:'Elapsed time unavailable','meta'));
   const t=a.tokens;card.append(el('p',t.known?`Reported input ${t.input.toLocaleString()} · output ${t.output.toLocaleString()} · cached input ${t.cachedInput.toLocaleString()} (${t.known}/${a.scheduled} runs reported usage)`:'Token usage unavailable','meta'),el('p','Cached input is part of input, not additional usage. Failed or cancelled turns may leave usage incomplete. Monetary cost unavailable.','help'));metrics.append(card);
  }root.append(metrics);
  const wrap=el('div',undefined,'table-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Criterion counts');const table=el('table'),caption=el('caption',`Criterion outcomes · denominators include all ${e.repetitions} scheduled trials per arm`);table.append(caption);const head=el('thead'),tr=el('tr');for(const text of ['Criterion','Baseline','Candidate']){const th=el('th',text);th.scope='col';tr.append(th);}head.append(tr);table.append(head);const body=el('tbody');
  data.arms.baseline.criteria.forEach((criterion,i)=>{const row=el('tr');const th=el('th',criterion.title);th.scope='row';row.append(th,el('td',counts(criterion)),el('td',counts(data.arms.candidate.criteria[i])));body.append(row);});table.append(body);wrap.append(table);root.append(wrap,el('p','These checks verify declarations, retrieved references and a recorded handoff. They cannot certify the customer-facing advice. Two favorable trials are not a reliability estimate.','help'));
 }
 root.append(el('h3','Every scheduled trial'));
 const trials=el('div',undefined,'trials');
 for(const row of data.rows){const card=el('article',undefined,'trial');card.append(el('strong',`${row.arm==='baseline'?'Baseline':'Candidate'} · trial ${row.repetition}`),badge(row.status),badge(row.run?.evaluation?.outcome||'ungraded'));
  if(row.run){const link=el('a','Inspect trace and reply →');link.href='/?run='+row.runId;card.append(link);if(row.run.error)card.append(el('p',row.run.error));}
  for(const issue of row.issues)card.append(el('p',issue,'issue'));card.append(el('small',row.runId,'meta'));trials.append(card);
 }root.append(trials);
 const controls=el('details');controls.append(el('summary','Frozen experiment manifest'),el('pre',JSON.stringify(e,null,2)));root.append(controls);
}
async function open(id){
 selected=id;clearTimeout(poll);try{const data=await api(`/api/experiments/${id}`);const k=JSON.stringify(data);if(k!==renderKey){render(data);renderKey=k;}await history();if(data.pending)poll=setTimeout(()=>open(id),1500);}catch(error){$('#notice').textContent=error.message;}
}
function showScenario(){const s=scenarioOptions.find(s=>s.id===$('#scenario').value);if(!s)return;$('#experiment-description').textContent=`${s.title}. Exposed development task. Trial order: baseline, candidate, then candidate, baseline.`;$('#comparison-sources').replaceChildren(el('p',s.ticket));for(const d of s.documents){$('#comparison-sources').append(el('h3',d.title),el('p',d.text));}}
$('#scenario').onchange=showScenario;
$('#baseline').onchange=()=>review(false);$('#candidate').onchange=()=>review(true);
$('#candidate-form').onsubmit=async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{const c=await post('/api/configurations',{name:$('#candidate-name').value,instructions:$('#candidate-instructions').value,parent:$('#candidate').value});await loadConfigs(key(c));$('#save-notice').textContent=`Saved ${label(c)}. Previous versions are unchanged.`;}catch(error){$('#save-notice').textContent=error.message;}finally{button.disabled=false;}};
$('#experiment-form').onsubmit=async event=>{event.preventDefault();$('#notice').textContent='';$('#start-experiment').disabled=true;try{const e=await post('/api/experiments',{scenario:$('#scenario').value,baseline:$('#baseline').value,candidate:$('#candidate').value,repetitions:Number($('#repetitions').value)});await open(e.id);}catch(error){$('#notice').textContent=error.message;await history();}};
$('#refresh').onclick=()=>{(selected?open(selected):history()).catch(error=>$('#notice').textContent=error.message);};
try{await loadConfigs();const experiments=await history();const id=new URL(location.href).searchParams.get('experiment')||experiments[0]?.id;if(id)await open(id);}catch(error){$('#notice').textContent='Could not load experiments: '+error.message;}

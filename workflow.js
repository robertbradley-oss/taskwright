import {externalRoute} from './external-view.js';
import {esc,pretty,renderStage,runEvidence} from './workflow-view.js';
const $ = id => document.getElementById(id);
const steps = ['brief','run','evidence','compare','export'];
const nextLabels = ['Review the runs →','Inspect the evidence →','Compare configurations →','Export the result →'];
let saved, report, selected, step, loading = false;
async function api(path) {
  const response = await fetch(path);
  const value = await response.json();
  if (!response.ok) throw Error(value.error || `Request failed (${response.status})`);
  return value;
}
function render(focus = false) {
  if (externalRoute(focus) || !report) return;
  const hash = location.hash.slice(1), index = steps.indexOf(hash);
  if (focus && index < 0) return;
  step = index < 0 ? 'brief' : hash;
  document.querySelectorAll('[data-step]').forEach(link => {
    if (link.dataset.step === step) link.setAttribute('aria-current','step');
    else link.removeAttribute('aria-current');
  });
  $('stage').innerHTML = renderStage(step, report, selected, saved);
  const i = steps.indexOf(step);
  $('previous').hidden = i === 0;
  $('previous').href = '#'+steps[Math.max(0,i-1)];
  $('next').hidden = i === 4;
  $('next').href = '#'+steps[Math.min(4,i+1)];
  $('next').textContent = nextLabels[i] || '';
  if ($('attempt')) $('attempt').onchange = () => {
    selected = $('attempt').value;
    const url = new URL(location.href); url.searchParams.set('attempt',selected);
    history.replaceState(null,'',url);
    const choice = selected; render(); $('attempt').value = choice; $('attempt').focus();
  };
  if ($('download-report')) $('download-report').onclick = () => download(report, `taskwright-comparison-${report.plan.id}.json`, $('export-status'));
  if ($('show-json')) $('show-json').onclick = () => {
    $('copy-panel').hidden = false;
    $('export-text').value = JSON.stringify(report,null,2);
    $('export-text').focus(); $('export-text').select();
  };
  if (focus && hash !== 'library') $('stage-title').focus();
}
function download(value, filename, status) {
  try {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value,null,2)], {type:'application/json'}));
    const link = document.createElement('a'); link.href=url; link.download=filename;
    document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='Download requested. Use copyable JSON if your browser does not save it.';
  } catch (error) { status.textContent='Download unavailable: '+error.message+'. Use copyable JSON.'; }
}
async function load() {
  if (loading) return; loading=true;
  $('load-state').textContent='Loading the saved evidence…'; $('retry').hidden=true;
  try {
    const query = new URL(location.href).searchParams, comparison = query.get('comparison');
    saved = comparison ? {source:'Local saved comparison',report:await api('/api/contract-suites/'+encodeURIComponent(comparison))} : await api('/api/workflow/comparison');
    report=saved.report;
    if (!report?.plan?.contract || !Array.isArray(report.rows) || !report.rows.length) throw Error('No scheduled attempts are available in this comparison.');
    document.querySelector('.context-card h2').textContent=comparison?'Your local comparison':'A complete worked example';
    document.querySelector('.context-card p').textContent=comparison?'Follow this comparison under its own frozen requirements. Every scheduled attempt stays visible, including incomplete work.':'Two configurations. Four fictional support tasks. Every attempt retained, including the limits of what a score can tell us.';
    selected=report.rows.some(r=>r.runId===query.get('attempt'))?query.get('attempt'):report.rows[0].runId;
    $('record-kind').textContent=report.active?'Provisional local results':saved.seal?'Sealed worked example':'Local saved comparison';
    $('record-name').textContent=report.plan.contract.brief.fields.name+' · contract v'+report.plan.contract.version;
    $('default-example').hidden=!comparison;
    $('workflow').hidden=false; $('load-state').textContent=''; render();
    if (report.active) {
      $('load-state').innerHTML='This comparison is still running. <button id="refresh-workflow" class="secondary">Refresh results</button>';
      $('refresh-workflow').onclick=load;
    }
  } catch(error) {
    report=null; $('workflow').hidden=true;
    $('load-state').textContent='Could not load this comparison: '+error.message+' No substitute result has been shown.';
    $('retry').hidden=false; $('default-example').hidden=false;
    if (!$('recovery-link')) { const link=document.createElement('a');link.id='recovery-link';link.href='/';link.textContent='Open the sealed worked example';$('load-state').append(' ',link); }
  } finally {loading=false;}
}
$('retry').onclick=load;
window.addEventListener('hashchange',()=>render(true));
$('stage').addEventListener('click',event=>{
  const target=event.target.closest('[data-run]'); if(!target)return;
  selected=target.dataset.run;
  const url=new URL(location.href);url.searchParams.set('attempt',selected);url.hash='evidence';
  history.pushState(null,'',url);render(true);
});
window.addEventListener('popstate',()=>{
  const id=new URL(location.href).searchParams.get('attempt');
  if(report?.rows.some(r=>r.runId===id))selected=id;
  render(true);
});
$('load-failure').onclick=async()=>{
  $('load-failure').disabled=true;$('failure-status').textContent='Loading the separate experiment…';
  try {
    const evidence=await api('/api/workflow/continuation'), row=evidence.report.rows.find(r=>r.outcome==='fail');
    if(!row)throw Error('No retained failed attempt found.');
    $('failure-example').innerHTML=`<div class="eyebrow">SEPARATE CONTRACT · CONTINUATION V6</div><h3 id="failure-title" tabindex="-1">An appropriate handoff. A failed citation check.</h3><p>All 12 handoff decisions and first AI reply reviews passed; 9/12 attempts passed the full contract. All three execute/failed attempts placed a valid handoff receipt in a field restricted to document IDs. The action was appropriate, but the original contract check failed.</p><p>These are reconstructed conversations with scripted customer follow-ups. This is a separate experiment, not another arm of the comparison above. Its result remains <strong>${esc(evidence.report.decision)}</strong>.</p>${runEvidence(row)}<details><summary>Frozen continuation contract and selection rule</summary><pre>${pretty({contract:evidence.report.plan.contract,rule:evidence.report.plan.rule,seal:evidence.seal})}</pre></details><div class="actions"><button id="failure-download">Download all 12 continuation attempts</button><button id="failure-copy" class="secondary">View continuation JSON</button><a href="/clarification.html#continuation">Original experiment workbench →</a></div><p id="failure-export-status" role="status"></p><div id="failure-copy-panel" hidden><label for="failure-json">Separate continuation report</label><textarea id="failure-json" class="raw-export" readonly></textarea></div>`;
    $('failure-example').hidden=false;$('failure-status').textContent='Saved report verified against its seal. No model calls.';
    $('failure-download').onclick=()=>download(evidence.report,'taskwright-continuation-'+evidence.report.plan.id+'.json',$('failure-export-status'));
    $('failure-copy').onclick=()=>{$('failure-copy-panel').hidden=false;$('failure-json').value=JSON.stringify(evidence.report,null,2);$('failure-json').focus();$('failure-json').select();};
    $('failure-title').focus();
  } catch(error){$('failure-status').textContent='Could not load the failure evidence: '+error.message;}
  finally{$('load-failure').disabled=false;}
};
await load();

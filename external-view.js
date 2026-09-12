import {parseExternalReport, renderExternalRun, runSummary, maxReportBytes} from './external-report.js';
const $ = id => document.getElementById(id);
let report, original, source, selected = 0, generation = 0;
function clearReport() {
  report = null; original = null; $('external-results').hidden = true;
  $('external-open').open = true; $('external-open-label').textContent = 'Choose a report';
  $('external-result').replaceChildren(); $('external-choices').replaceChildren();
  $('external-json-panel').hidden = true; $('external-json').value = '';
  $('external-export-status').textContent = '';
}
function choose(index, focus = false) {
  selected = index;
  for (const [i, button] of [...$('external-choices').children].entries()) button.setAttribute('aria-pressed', String(i === selected));
  $('external-result').innerHTML = renderExternalRun(report.rows[index]);
  if (focus) $('external-result-title').focus();
}
function show(raw, label) {
  const parsed = parseExternalReport(raw);
  report = parsed; original = raw; source = label;
  $('external-source').textContent = `${source} · ${report.rows.length} ${report.rows.length === 1 ? 'run' : 'runs'}`;
  $('external-origin').textContent = source === 'Included offline demo'
    ? 'Recorded child-process execution with a deterministic reference policy and deliberate faults. No model calls. Viewing this example runs nothing.'
    : `Local file. Contents are not independently verified. Declared mode: ${report.mode === 'model' ? 'model execution' : 'offline demo'}. Opening this file runs nothing and sends nothing to the server.`;
  report.rows.forEach((row, i) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary';
    button.textContent = `${i + 1}. ${runSummary(row.run).title}`; button.onclick = () => choose(i, true);
    $('external-choices').append(button);
  });
  $('external-results').hidden = false; $('external-status').textContent = 'Report ready. Choose a run to see what happened.';
  $('external-open').open = false; $('external-open-label').textContent = 'Open another report'; choose(0, true);
}
async function loadExample() {
  const request = ++generation; clearReport(); $('external-status').textContent = 'Opening the offline example…';
  try {
    const response = await fetch('/external-demo.json'); if (!response.ok) throw Error('The example could not be loaded. Try opening it again.');
    const raw = await response.text(); if (request !== generation) return; show(raw, 'Included offline demo');
  } catch (error) { if (request === generation) $('external-status').textContent = error.message; }
}
$('external-demo').onclick = loadExample;
$('external-file').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  const request = ++generation; clearReport(); $('external-status').textContent = 'Reading the local file…';
  try {
    if (file.size > maxReportBytes) throw Error('Choose a report smaller than 2 MB.');
    const raw = await file.text(); if (request !== generation) return; show(raw, `Imported: ${file.name}`);
  } catch (error) { if (request === generation) $('external-status').textContent = error.message; }
  finally { event.target.value = ''; }
};
$('external-download').onclick = () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([original], {type: 'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = 'taskwright-external-report.json';
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('external-export-status').textContent = 'Download requested. The export preserves the original JSON. You can also use View JSON.';
};
$('external-show-json').onclick = () => {
  if (!report) return; $('external-json-panel').hidden = false; $('external-json').value = original; $('external-json').focus(); $('external-json').select();
};
export function externalRoute(focus = false) {
  const active = location.hash === '#external';
  $('external').hidden = !active;
  document.querySelector('.workflow-intro').hidden = active;
  $('comparison-content').hidden = active;
  $('library').hidden = active;
  for (const link of document.querySelectorAll('[data-workspace]')) {
    if ((link.dataset.workspace === 'external') === active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }
  if (active && focus) $('external-title').focus();
  return active;
}
externalRoute();

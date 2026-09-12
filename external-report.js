// Browser-safe reader: validate structure, preserve the original report, never execute it.
export const maxReportBytes = 2 * 1024 * 1024;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const string = value => typeof value === 'string' && value.length <= 65536;
const list = (value, max, check) => Array.isArray(value) && value.length <= max && value.every(check);
const outcomes = ['pass', 'fail', 'uncertain', 'execution_error'];
const statuses = ['queued', 'running', 'completed', 'error', 'cancelled', 'timed_out', 'interrupted'];
const stream = value => object(value) && string(value.text) && string(value.base64) && Number.isSafeInteger(value.observedBytes) && value.observedBytes >= 0 && typeof value.truncated === 'boolean' && string(value.sha256);
const diagnostic = value => object(value) && string(value.stage) && string(value.message) && stream(value.stdout) && stream(value.stderr);
const document = value => object(value) && string(value.id) && string(value.title) && string(value.text);
const event = value => object(value) && Number.isSafeInteger(value.seq) && string(value.kind) &&
  (value.kind !== 'tool_result' || (string(value.tool) && typeof value.ok === 'boolean' && (!value.ok || value.tool !== 'read_document' || document(value.result))));
export function parseExternalReport(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > maxReportBytes) throw Error('Choose a report smaller than 2 MB.');
  let report;
  try { report = JSON.parse(raw); } catch { throw Error('This file is not valid JSON. Choose the report.json produced by the external-agent demo.'); }
  const pending = [[report, 0]]; let nodes = 0;
  while (pending.length) {
    const [value, depth] = pending.pop();
    if (++nodes > 30000 || depth > 24) throw Error('This report is too complex to display safely.');
    if (value && typeof value === 'object') for (const child of Object.values(value)) pending.push([child, depth + 1]);
  }
  if (!object(report) || report.kind !== 'external-integration' || report.version !== 1 || !['demo', 'model'].includes(report.mode)) throw Error('This is not a supported Taskwright external-agent report (version 1).');
  if (!list(report.rows, 16, object) || !report.rows.length) throw Error('The report must contain between 1 and 16 runs.');
  const ids = new Set();
  for (const [i, row] of report.rows.entries()) {
    const r = row.run;
    if (!string(row.kind) || !object(r) || !string(r.id) || !r.id || ids.has(r.id) || r.mode !== 'external' || !statuses.includes(r.status) ||
        !object(r.scenario) || !string(r.scenario.title) || !string(r.scenario.ticket) || !list(r.scenario.documents, 20, document) ||
        !object(r.agent) || !string(r.agent.id) || !string(r.agent.instructions) ||
        !object(r.externalContract) || r.externalContract.protocol !== 'taskwright-process-1' || !list(r.externalContract.allowedTools, 10, string) ||
        !list(r.trace, 100, event) || !list(r.executionDiagnostics, 16, diagnostic) ||
        !object(r.evaluation) || !outcomes.includes(r.evaluation.outcome) || !list(r.evaluation.criteria, 30, c => object(c) && string(c.id) && string(c.title) && string(c.evidence) && outcomes.includes(c.outcome)) ||
        !(r.final === null || (object(r.final) && string(r.final.reply) && list(r.final.evidence_ids, 20, string)))) {
      throw Error(`Run ${i + 1} is incomplete or has an unsupported structure. No results from this file were displayed.`);
    }
    ids.add(r.id);
  }
  return report;
}

export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty = value => escapeHTML(JSON.stringify(value, null, 2));
const toolNames = {read_document: 'Read a document', search_documents: 'Search documents', record_escalation: 'Open a support handoff'};
export function runSummary(run) {
  const stage = run.executionDiagnostics[0]?.stage;
  if (run.status === 'completed') return {title: 'Reply produced', detail: 'A reply was recorded. Read its checks below; completion alone does not establish correctness.', tone: 'neutral'};
  if (stage === 'tool_authority') return {title: 'Action blocked', detail: 'The report records a tool request outside the operator’s allowed tools. The denied request is retained below.', tone: 'issue'};
  if (['response_json', 'response_envelope', 'action_schema'].includes(stage)) return {title: 'Response rejected', detail: 'The agent’s output did not meet the response contract. No valid reply was recorded.', tone: 'issue'};
  return {title: ({queued:'Not started', running:'Still running', cancelled:'Cancelled', timed_out:'Time limit reached', interrupted:'Interrupted'})[run.status] || 'Run stopped', detail: 'This attempt is incomplete. The available trace and diagnostics are retained below.', tone: 'issue'};
}
export function renderExternalRun(row) {
  const r = row.run, summary = runSummary(r), reads = r.trace.filter(e => e.kind === 'tool_result' && e.ok && e.tool === 'read_document');
  const handoffs = r.trace.filter(e => e.kind === 'tool_result' && e.ok && e.tool === 'record_escalation');
  return `<div class="external-verdict ${summary.tone}"><span class="eyebrow">WHAT HAPPENED</span><h3 id="external-result-title" tabindex="-1">${summary.title}</h3><p>${summary.detail}</p><p class="help">Recorded activity: ${reads.length} document reads · ${handoffs.length} completed handoffs</p></div>
    <div class="external-columns"><section><h3>Customer request</h3><p class="external-prose">${escapeHTML(r.scenario.ticket)}</p><details><summary>Instructions and allowed tools</summary><p class="external-prose">${escapeHTML(r.agent.instructions)}</p><ul>${r.externalContract.allowedTools.map(t => `<li>${escapeHTML(toolNames[t] || t)}</li>`).join('')}</ul><p class="help">These permissions apply to simulated tools. They do not sandbox the external program.</p></details></section>
    <section><h3>Agent reply</h3>${r.final ? `<blockquote class="external-prose">${escapeHTML(r.final.reply)}</blockquote><details><summary>Structured reply fields</summary><pre>${pretty(r.final)}</pre></details>` : '<p class="help">No final reply was recorded for this attempt.</p>'}</section></div>
    <section class="external-section"><h3>What the checks say</h3><p class="help">These are the checks stored in the report. This viewer does not regrade the reply or verify the file’s authenticity.</p><div class="external-checks">${r.evaluation.criteria.map(c => `<details><summary><span class="external-check-label">${escapeHTML(c.title)}</span><span class="badge">${escapeHTML(({pass:'Pass',fail:'Fail',uncertain:'Not established',execution_error:'Execution error'})[c.outcome])}</span></summary><p>${escapeHTML(c.evidence)}</p></details>`).join('')}</div><p class="external-note">Reply meaning needs a separate review. Passing structural checks does not prove the advice is correct.</p></section>
    <section class="external-section"><h3>Documents the agent read</h3>${reads.length ? reads.map(e => `<details><summary>${escapeHTML(e.result.title)} <span class="meta">· event ${e.seq}</span></summary><p class="external-prose">${escapeHTML(e.result.text)}</p><p class="meta">Document: ${escapeHTML(e.result.id)}</p></details>`).join('') : '<p class="help">No successful document reads were recorded.</p>'}</section>
    <section class="external-section"><h3>Failure details</h3>${r.executionDiagnostics.length ? r.executionDiagnostics.map(d => `<details><summary>${escapeHTML(d.stage)} — ${escapeHTML(d.message)}</summary><h4>Retained output</h4><pre>${escapeHTML(d.stdout.text || '(no stdout retained)')}</pre><p class="help">${d.stdout.observedBytes} observed bytes${d.stdout.truncated ? ' · retained text is truncated' : ''}. On an output-limit failure, counts and hashes cover the observed prefix only.</p>${d.stderr.text ? `<h4>Process message</h4><pre>${escapeHTML(d.stderr.text)}</pre>` : ''}<details><summary>Exact diagnostic record</summary><pre>${pretty(d)}</pre></details></details>`).join('') : '<p class="help">No execution diagnostics were recorded.</p>'}</section>
    <details class="external-section"><summary>Full tool timeline and run identity</summary><p class="meta">Run ${escapeHTML(r.id)} · Agent ${escapeHTML(r.agent.id)}</p><pre>${pretty(r.trace)}</pre><p>Requested actions and successful tool results are separate events. A denied request may appear only in failure diagnostics.</p></details>`;
}

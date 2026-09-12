import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseExternalReport, renderExternalRun, runSummary, maxReportBytes} from '../external-report.js';
const raw = readFileSync(new URL('../examples/external-agent/demo-report.json', import.meta.url), 'utf8');

test('included external report preserves original execution evidence and never turns completion into a full pass', () => {
  assert.equal(createHash('sha256').update(raw).digest('hex'), 'c35f4d705b1c752eba0fb8c3029ea34710998536474fd29940d6d5b147e56220');
  const report = parseExternalReport(raw), before = JSON.stringify(report);
  assert.deepEqual(report.rows.map(r => runSummary(r.run).title), ['Reply produced', 'Response rejected', 'Action blocked']);
  for (const row of report.rows) {
    const html = renderExternalRun(row);
    assert.match(html, /Reply meaning needs a separate review/);
    assert.match(html, /does not regrade/);
  }
  assert.equal(JSON.stringify(report), before);
  assert.equal(report.rows[0].run.evaluation.outcome, 'uncertain');
  assert.equal(report.rows[2].run.trace.filter(e => e.kind === 'tool_result' && e.ok && e.tool === 'record_escalation').length, 0);
  assert.ok(report.rows[2].run.executionDiagnostics[0].stdout.text.includes('record_escalation'));
});
test('report reader rejects unsupported, oversized and empty input before rendering', () => {
  for (const value of ['{', 'null', '[]', '{}', JSON.stringify({kind:'external-integration',version:2}),
    JSON.stringify({...JSON.parse(raw),rows:[]}), JSON.stringify({...JSON.parse(raw),rows:Array(17).fill({})}),
    ' '.repeat(maxReportBytes + 1), '💜'.repeat(maxReportBytes / 3)]) assert.throws(() => parseExternalReport(value));
  let deep = {}; for (let i=0;i<30;i++) deep = {nested:deep};
  assert.throws(()=>parseExternalReport(JSON.stringify({...JSON.parse(raw),extra:deep})),/too complex/);
});
test('malformed nested fields and duplicate run IDs fail closed', () => {
  const mutations = [r=>r.rows[0].run.trace=null, r=>r.rows[0].run.final.reply={},
    r=>r.rows[0].run.trace[1].result.text=null, r=>r.rows[0].run.evaluation.criteria[0].outcome='excellent',
    r=>r.rows[1].run.executionDiagnostics[0].stdout=null, r=>r.rows[0].run.externalContract.allowedTools=[{}],
    r=>r.rows[1].run.id=r.rows[0].run.id];
  for (const mutate of mutations) { const r=JSON.parse(raw); mutate(r); assert.throws(()=>parseExternalReport(JSON.stringify(r)),/unsupported structure/); }
});
test('untrusted imported replies, documents and diagnostics are escaped rather than interpreted', () => {
  const r = JSON.parse(raw), payload = '<img src=x onerror="alert(1)"><script>bad()</script>';
  r.rows[0].run.final.reply=payload; r.rows[0].run.scenario.ticket=payload;
  r.rows[0].run.agent.instructions=payload; r.rows[0].run.trace[1].result.text=payload;
  r.rows[0].run.evaluation.criteria[0].evidence=payload;
  r.rows[1].run.executionDiagnostics[0].message=payload; r.rows[1].run.executionDiagnostics[0].stdout.text=payload;
  const parsed=parseExternalReport(JSON.stringify(r));
  for(const row of parsed.rows.slice(0,2)){ const html=renderExternalRun(row); assert.ok(!html.includes('<img')); assert.ok(!html.includes('<script>')); assert.match(html,/&lt;img/); }
});
test('incomplete runs and failed stored grades are not described as successful evaluations', () => {
  const r=JSON.parse(raw).rows[0].run;
  r.evaluation.criteria[0].outcome='fail'; r.evaluation.outcome='fail';
  assert.equal(runSummary(r).title,'Reply produced'); assert.match(renderExternalRun({run:r}),/>Fail</);
  for(const status of ['queued','running','cancelled','timed_out','interrupted']) { r.status=status; assert.notEqual(runSummary(r).title,'Reply produced'); }
});

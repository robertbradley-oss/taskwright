import test from 'node:test';
import { availableLoopbackPort } from './support/port.js';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {savedWorkflowEvidence} from '../workflow-evidence.mjs';
import {renderStage,runEvidence} from '../workflow-view.js';
import {hash} from '../engine/scenario.js';

test('guided examples preserve complete original reports, reviews and sealed outcomes',async()=>{
  for (const [name,folder,count,decision] of [['comparison','brief-contract',16,'tie'],['continuation','continuation',12,'continuation_failed']]) {
    const saved=await savedWorkflowEvidence(name);
    assert.deepEqual(saved.report,JSON.parse(await readFile(new URL(`../evidence/${folder}/report.json`,import.meta.url),'utf8')));
    assert.equal(hash(saved.report),saved.seal.reportHash);
    assert.equal(saved.report.rows.length,count);
    assert.equal(saved.report.rows.filter(r=>r.review?.status==='completed').length,count);
    assert.equal(saved.report.decision,decision);
    if(name==='continuation')assert.equal(saved.report.rows.filter(r=>r.outcome==='fail').length,3);
  }
  await assert.rejects(()=>savedWorkflowEvidence('../reserved'),/Unknown saved example/);
});

test('all stages expose the same contract without mutating it or hiding uncertain original grades',async()=>{
  const saved=await savedWorkflowEvidence('comparison'),before=hash(saved.report),row=saved.report.rows[0];
  for(const step of ['brief','run','evidence','compare','export'])assert.match(renderStage(step,saved.report,row.runId,saved),/id="stage-title"/);
  const evidence=runEvidence(row);
  assert.match(evidence,/Meaning of the customer reply/);
  assert.match(evidence,/uncertain/);
  assert.match(evidence,/First AI reply review/);
  for(const doc of row.run.scenario.documents)assert.ok(evidence.includes(doc.title));
  const comparison=renderStage('compare',saved.report,row.runId,saved);
  assert.match(comparison,/No advantage established/);
  assert.equal((comparison.match(/data-run=/g)||[]).length,16);
  assert.equal(hash(saved.report),before);
});

test('evidence renders missing attempts and escapes untrusted model and source text',async()=>{
  const {report}=await savedWorkflowEvidence('comparison'),row=structuredClone(report.rows[0]);
  row.run.final.reply='<img src=x onerror=alert(1)>';
  row.review.evaluation.criteria[0].claim='<script>unsafe()</script>';
  row.run.scenario.documents[0].text='<iframe src="https://example.com">';
  const html=runEvidence(row);
  assert.doesNotMatch(html,/<img|<script|<iframe/);
  assert.match(html,/&lt;img/);assert.match(html,/&lt;script/);assert.match(html,/&lt;iframe/);
  assert.match(runEvidence({...row,run:null}),/remains in the denominator/);
  row.run.final=null;row.review=null;
  assert.match(runEvidence(row),/No final reply was recorded/);
  assert.match(runEvidence(row),/No completed first review available/);
});

test('home and saved workflow work with empty runtime storage and no provider executable',async t=>{
  const dir=await mkdtemp(path.join(tmpdir(),'taskwright-workflow-')),port=await availableLoopbackPort();
  const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PATH:'',PORT:String(port),TASKWRIGHT_RUN_DIR:dir},windowsHide:true,stdio:['ignore','pipe','pipe']});
  t.after(()=>child.kill());
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server failed to start');})]);
  const base=`http://127.0.0.1:${port}`;
  assert.match(await(await fetch(base+'/')).text(),/id="workflow"/);
  assert.match(await(await fetch(base+'/?run=00000000-0000-0000-0000-000000000000')).text(),/id="run-form"/);
  assert.match(await(await fetch(base+'/lab.html')).text(),/id="run-form"/);
  for(const name of ['comparison','continuation']){
    const response=await fetch(base+'/api/workflow/'+name);assert.equal(response.status,200);
    const value=await response.json();assert.equal(hash(value.report),value.seal.reportHash);
  }
  for(const file of ['workflow.html','workflow.js','workflow.css','workflow-view.js','external-view.js','external-report.js','external.css','external-demo.json'])assert.equal((await fetch(base+'/'+file)).status,200);
  const external=await fetch(base+'/external-demo.json');
  assert.match(external.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(await external.text(),await readFile(new URL('../examples/external-agent/demo-report.json',import.meta.url),'utf8'));
  assert.equal((await fetch(base+'/examples/external-agent/agent.mjs')).status,404);
  assert.equal((await fetch(base+'/api/workflow/reserved')).status,404);
  assert.equal((await fetch(base+'/api/workflow/comparison',{method:'POST'})).status,405);
  assert.deepEqual(await(await fetch(base+'/api/runs')).json(),[]);
  assert.deepEqual(await readdir(dir),[]);
});

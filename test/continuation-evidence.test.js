import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {hash} from '../engine/scenario.js';import {verifyContinuationPlan,summarizeContinuation} from '../engine/continuation-experiment.js';
const read=async name=>JSON.parse(await readFile(new URL('../evidence/continuation/'+name+'.json',import.meta.url),'utf8'));
test('retained continuation evidence reproduces every first outcome and its frozen seed provenance',async()=>{
 const plan=await read('plan'),report=await read('report'),seal=await read('seal');verifyContinuationPlan(plan,await read('scheduled-runs'));
 assert.equal(hash(report),seal.reportHash);assert.equal(plan.hash,seal.planHash);assert.equal(hash(report.plan),hash(plan));
 assert.equal(hash(summarizeContinuation(plan,report.rows,report.calibration)),hash(report));assert.equal(report.rows.length,12);assert.equal(new Set(report.rows.map(r=>r.runId)).size,12);
 assert.ok(report.rows.every(r=>r.run&&!['queued','running'].includes(r.run.status)));assert.equal(report.calibration.results.length,12);
 const parent=JSON.parse(await readFile(new URL('../evidence/diagnostic-rerun/report.json',import.meta.url),'utf8'));assert.equal(hash(parent),plan.contract.parentReportHash);
 for(const seed of plan.contract.parents){const row=parent.rows.find(r=>r.runId===seed.runId);assert.equal(hash(row.run),seed.runHash);assert.equal(hash(row.review),seed.reviewHash);assert.equal(row.run.final.reply,seed.reply);assert.equal(hash(row.run.trace),hash(seed.trace));}
 for(const mode of ['execute','prepare'])for(const history of ['untried','failed'])assert.equal(report.rows.filter(r=>r.mode===mode&&r.history===history).length,3);
});

import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {hash} from '../engine/scenario.js';import {listReviews} from '../engine/semantic.js';
import {verifyContinuationPlan,summarizeContinuation,continuationRecords} from '../engine/continuation-experiment.js';
const read=async name=>JSON.parse(await readFile(name,'utf8')),root='evidence/continuation/';
const plan=await read(root+'plan.json'),report=await read(root+'report.json'),seal=await read(root+'seal.json');verifyContinuationPlan(plan,await read(root+'scheduled-runs.json'));
assert.equal(hash(report.plan),hash(plan));assert.equal(seal.planHash,plan.hash);assert.equal(seal.reportHash,hash(report));assert.equal(hash(summarizeContinuation(plan,report.rows,report.calibration)),hash(report));
assert.equal(hash(summarizeContinuation(plan,await continuationRecords('data/runs',plan),await read(root+'calibration.json'))),hash(report));
assert.equal(hash(await read('evidence/diagnostic-rerun/report.json')),plan.contract.parentReportHash);
for(const row of report.rows){const reviews=await listReviews('data/runs',row.runId);assert.equal(reviews.length,row.review?1:0);if(row.review)assert.equal(hash(reviews[0]),hash(row.review));}
const before=await read(root+'preservation-before.json');for(const f of before.files)assert.equal(createHash('sha256').update(await readFile(f.path)).digest('hex'),f.sha256,'Preserved file changed: '+f.path);
console.log(JSON.stringify({decision:report.decision,calibrationMatches:report.calibration.matches,scheduled:report.rows.length,passes:report.rows.filter(r=>r.outcome==='pass').length,issues:report.issues,preservedFiles:before.files.length,reportHash:seal.reportHash},null,2));

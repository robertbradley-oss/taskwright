import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash} from '../engine/scenario.js';
import {archiveFiles} from '../engine/contract-archive.js';
import {contractEvaluatorSourceHash} from '../engine/briefs.js';
import {summarizeContractSuite} from '../engine/contract-suites.js';

const read=async name=>JSON.parse(await readFile(new URL(`../evidence/brief-contract/${name}.json`,import.meta.url),'utf8'));
test('retained brief comparison reproduces with all scheduled records and frozen provenance',async()=>{
 const report=await read('report'),seal=await read('seal'),plan=await read('plan'),contract=await read('contract');
 assert.equal(hash(report),seal.reportHash);assert.deepEqual(plan,report.plan);assert.deepEqual(contract,plan.contract);
 assert.equal(contract.grading.sourceHash,contractEvaluatorSourceHash());
 assert.equal(plan.arms.baseline.version,2);assert.equal(plan.arms.candidate.version,3);
 assert.ok(contract.frozenAt<plan.arms.candidate.createdAt);assert.ok(plan.arms.candidate.createdAt<=plan.createdAt);
 assert.equal(report.rows.length,16);assert.equal(new Set(report.rows.map(r=>r.runId)).size,16);
 assert.ok(report.rows.every(r=>r.run.scenario.split==='development'&&r.run.contractHash===contract.hash));
 for(const experiment of plan.experiments)assert.deepEqual(experiment.schedule.map(r=>[r.arm,r.repetition]),[['baseline',1],['candidate',1],['candidate',2],['baseline',2]]);
 assert.deepEqual(summarizeContractSuite(plan,report.rows),report);assert.equal(archiveFiles(report,seal).length,41);
 const changed=structuredClone(report);changed.arms.candidate.overall.pass=123;
 assert.throws(()=>archiveFiles(changed,{...seal,reportHash:hash(changed)}),/does not reproduce/);
});

test('brief comparison restoration makes no model calls and refuses conflicting records',async()=>{
 const dest=await mkdtemp(path.join(tmpdir(),'taskwright-brief-restore-'));
 const restore=()=>execFileSync(process.execPath,['scripts/restore-brief-comparison.mjs'],{env:{...process.env,PATH:'',TASKWRIGHT_RUN_DIR:dest},encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
 assert.match(restore(),/41 files added/);assert.match(restore(),/0 files added/);
 const report=await read('report'),run=structuredClone(report.rows[0].run);run.final.reply='Existing different reply';
 const file=`${dest}/${run.id}.json`;await writeFile(file,JSON.stringify(run));assert.throws(restore);
 assert.deepEqual(JSON.parse(await readFile(file,'utf8')),run);
});

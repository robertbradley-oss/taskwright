import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash} from '../engine/scenario.js';
import {regressionArchiveFiles} from '../engine/regression-archive.js';
import {summarizeRegression,validateRegressionCalibration} from '../engine/regression-experiment.js';
const read=async name=>JSON.parse(await readFile(new URL(`../evidence/regression/${name}.json`,import.meta.url),'utf8'));
test('sealed regression reproduces with one contract, unchanged strategy and all twelve first attempts',async()=>{
 const report=await read('report'),seal=await read('seal'),calibration=await read('selected-calibration'),prior=JSON.parse(await readFile(new URL('../evidence/eligibility/report.json',import.meta.url),'utf8'));
 assert.equal(hash(report),seal.reportHash);assert.deepEqual(summarizeRegression(report.plan,report.rows),report);assert.deepEqual(report.plan.configuration,prior.plan.configuration);
 for(const mode of ['execute','prepare'])assert.equal(report.plan.contract.agentInstructions[mode],prior.plan.contracts[mode].agentInstructions);
 assert.equal(report.rows.length,12);assert.ok(report.rows.every(r=>r.run.mode==='codex'&&r.run.scenario.split==='development'&&r.run.regressionContract.hash===report.plan.contract.hash));
 assert.equal(regressionArchiveFiles(report,seal,calibration).length,27);
 const changed=structuredClone(report);changed.cells['execute-qualified'].passed=99;assert.throws(()=>regressionArchiveFiles(changed,{...seal,reportHash:hash(changed)},calibration),/does not reproduce/);
});
test('calibration references and policy were frozen and all selected reviews finished before support execution',async()=>{
 const c=await read('selected-calibration'),policy=await read('calibration-policy'),selection=await read('calibration-selection'),report=await read('report');
 assert.equal(validateRegressionCalibration(c,c.plan.cliVersion,report.plan.contract).passed,true);assert.equal(c.matches,12);assert.equal(selection.calibrationHash,report.plan.controls.calibrationHash);assert.equal(selection.policyHash,hash(policy));assert.ok(policy.at<=c.plan.at);assert.equal(policy.maximumBatches,2);
 assert.ok(c.results.every(r=>Date.parse(r.review.createdAt)+r.review.elapsedMs<Date.parse(report.plan.createdAt)));assert.ok(report.rows.every(r=>r.run.createdAt>=selection.at));
});
test('regression archive restores without inference, is idempotent and refuses existing conflicts',async()=>{
 const dest=await mkdtemp(path.join(tmpdir(),'taskwright-regression-restore-')),restore=()=>execFileSync(process.execPath,['scripts/restore-regression.mjs'],{env:{...process.env,PATH:'',TASKWRIGHT_RUN_DIR:dest},encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
 assert.match(restore(),/27 regression records restored/);assert.match(restore(),/0 regression records restored/);const report=await read('report'),run=structuredClone(report.rows[0].run);run.final.reply='Different existing reply';const file=`${dest}/${run.id}.json`;await writeFile(file,JSON.stringify(run));assert.throws(restore);assert.deepEqual(JSON.parse(await readFile(file,'utf8')),run);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash} from '../engine/scenario.js';
import {clarificationArchiveFiles} from '../engine/clarification-archive.js';
import {summarizeClarification,validateClarificationCalibration} from '../engine/clarification-experiment.js';
const read=async name=>JSON.parse(await readFile(new URL(`../evidence/clarification/${name}.json`,import.meta.url),'utf8'));
test('sealed clarification reproduces with one contract, unchanged strategy and all six first attempts',async()=>{
 const report=await read('report'),seal=await read('seal'),calibration=await read('selected-calibration'),prior=JSON.parse(await readFile(new URL('../evidence/eligibility/report.json',import.meta.url),'utf8'));
 assert.equal(hash(report),seal.reportHash);assert.deepEqual(summarizeClarification(report.plan,report.rows),report);assert.deepEqual(report.plan.configuration,prior.plan.configuration);
 for(const mode of ['execute','prepare'])assert.ok(report.plan.contract.agentInstructions[mode].startsWith(prior.plan.contracts[mode].agentInstructions+'\n\nUncertainty handling requirement: '));
 assert.equal(report.rows.length,6);assert.ok(report.rows.every(r=>r.run.mode==='codex'&&r.run.scenario.split==='development'&&r.run.clarificationContract.hash===report.plan.contract.hash));
 assert.equal(clarificationArchiveFiles(report,seal,calibration).length,9+report.rows.filter(r=>r.review).length);
 const changed=structuredClone(report);changed.cells['execute-unknown'].passed=99;assert.throws(()=>clarificationArchiveFiles(changed,{...seal,reportHash:hash(changed)},calibration),/does not reproduce/);
});
test('calibration references and policy were frozen and all selected reviews finished before support execution',async()=>{
 const c=await read('selected-calibration'),policy=await read('calibration-policy'),selection=await read('calibration-selection'),report=await read('report');
 assert.equal(validateClarificationCalibration(c,c.plan.cliVersion,report.plan.contract).passed,true);assert.equal(c.matches,10);assert.equal(selection.calibrationHash,report.plan.controls.calibrationHash);assert.equal(selection.policyHash,hash(policy));assert.ok(policy.at<=c.plan.at);assert.equal(policy.maximumBatches,2);
 assert.ok(c.results.every(r=>Date.parse(r.review.createdAt)+r.review.elapsedMs<Date.parse(report.plan.createdAt)));assert.ok(report.rows.every(r=>r.run.createdAt>=selection.at));
});
test('clarification archive restores without inference, is idempotent and refuses existing conflicts',async()=>{
 const dest=await mkdtemp(path.join(tmpdir(),'taskwright-clarification-restore-')),restore=()=>execFileSync(process.execPath,['scripts/restore-clarification.mjs'],{env:{...process.env,PATH:'',TASKWRIGHT_RUN_DIR:dest},encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
 const saved=await read('report');const expected=9+saved.rows.filter(r=>r.review).length;assert.ok(restore().includes(expected+' clarification records restored'));assert.match(restore(),/0 clarification records restored/);const report=await read('report'),run=structuredClone(report.rows[0].run);run.error='Different existing error';const file=`${dest}/${run.id}.json`;await writeFile(file,JSON.stringify(run));assert.throws(restore);assert.deepEqual(JSON.parse(await readFile(file,'utf8')),run);
});

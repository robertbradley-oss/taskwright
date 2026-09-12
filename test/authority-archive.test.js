import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash} from '../engine/scenario.js';
import {authorityArchiveFiles} from '../engine/authority-archive.js';
import {summarizeAuthority} from '../engine/authority-experiment.js';
const read=async name=>JSON.parse(await readFile(new URL(`../evidence/authority/${name}.json`,import.meta.url),'utf8'));
test('retained authority evidence reproduces all six first results under the frozen contract pair',async()=>{
 const report=await read('report'),seal=await read('seal'),calibration=await read('calibration');
 assert.equal(hash(report),seal.reportHash);assert.equal(report.decision,'requirement_followed');assert.equal(report.complete,true);assert.deepEqual(summarizeAuthority(report.plan,report.rows),report);
 assert.deepEqual(report.arms.execute.handoffs,[1,1,1]);assert.deepEqual(report.arms.prepare.handoffs,[0,0,0]);assert.equal(report.rows.length,6);assert.ok(report.rows.every(r=>r.run.scenario.split==='development'&&r.outcome==='pass'));
 assert.ok(calibration.results.every(r=>r.review.createdAt<report.plan.createdAt));assert.ok(Object.values(report.plan.contracts).every(c=>c.frozenAt<report.plan.createdAt));
 assert.equal(authorityArchiveFiles(report,seal,calibration).length,16);
 const changed=structuredClone(report);changed.arms.prepare.passed=99;assert.throws(()=>authorityArchiveFiles(changed,{...seal,reportHash:hash(changed)},calibration),/cannot reproduce/);
});
test('authority restoration is idempotent, refuses conflicts and works without an inference executable',async()=>{
 const dest=await mkdtemp(path.join(tmpdir(),'taskwright-authority-restore-'));
 const restore=()=>execFileSync(process.execPath,['scripts/restore-authority.mjs'],{env:{...process.env,PATH:'',TASKWRIGHT_RUN_DIR:dest},encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
 assert.match(restore(),/16 files added/);assert.match(restore(),/0 files added/);
 const report=await read('report'),run=structuredClone(report.rows[0].run);run.final.reply='Existing different reply';const file=`${dest}/${run.id}.json`;await writeFile(file,JSON.stringify(run));assert.throws(restore);assert.deepEqual(JSON.parse(await readFile(file,'utf8')),run);
});

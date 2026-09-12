import {readFile,writeFile} from 'node:fs/promises';
import {hash} from '../engine/scenario.js';
import {loadClarification} from '../engine/clarification-experiment.js';
import {clarificationArchiveFiles} from '../engine/clarification-archive.js';
const id=process.argv[2];if(!/^[0-9a-f-]{36}$/.test(id))throw Error('Supply the completed suite ID');
const report=await loadClarification('data/runs',id),calibration=JSON.parse(await readFile('evidence/clarification/selected-calibration.json','utf8'));
const seal={at:new Date().toISOString(),reportHash:hash(report),planHash:report.plan.hash,calibrationHash:calibration.hash};clarificationArchiveFiles(report,seal,calibration);
for(const [name,value] of Object.entries({plan:report.plan,report,seal}))await writeFile('evidence/clarification/'+name+'.json',JSON.stringify(value,null,2),{flag:'wx'});
console.log(JSON.stringify({id,decision:report.decision,cells:report.cells,reportHash:seal.reportHash}));

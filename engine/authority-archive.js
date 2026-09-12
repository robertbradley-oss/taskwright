import {hash} from './scenario.js';
import {summarizeAuthority} from './authority-experiment.js';
import {validateAuthorityCalibration} from './authority-calibration.js';
export function authorityArchiveFiles(report,seal,calibration){
 if(report.active||report.rows.some(r=>['running','queued'].includes(r.run?.status))||seal.reportHash!==hash(report)||seal.planHash!==report.plan.hash||seal.calibrationHash!==report.plan.controls.calibrationHash||calibration.hash!==seal.calibrationHash)throw Error('Authority archive seal or calibration differs');
 if(!validateAuthorityCalibration(calibration,report.plan.controls.cliVersion).passed)throw Error('Calibration cannot reproduce');
 const records=report.rows.map(({run,review})=>({run,review}));if(hash(summarizeAuthority(report.plan,records))!==hash(report))throw Error('Authority result cannot reproduce');
 const files=[],add=(path,value)=>files.push({path,value}),{plan}=report;
 for(const contract of Object.values(plan.contracts))add(`authority-contracts/${contract.id}.json`,contract);
 add(`authority-experiments/${plan.id}.json`,plan);
 if(plan.configuration.id==='support-candidate'&&plan.configuration.version>1)add(`configurations/support-candidate-${plan.configuration.version}.json`,plan.configuration);
 for(const {run,review}of records){if(run)add(`${run.id}.json`,run);if(review)add(`reviews/${run.id}-${review.id}.json`,review);}
 for(const file of files)if(!/^(?:configurations\/support-candidate-\d+|(?:authority-contracts|authority-experiments)\/[0-9a-f-]{36}|reviews\/[0-9a-f-]{36}-[0-9a-f-]{36}|[0-9a-f-]{36})\.json$/.test(file.path))throw Error('Invalid authority archive path');
 if(new Set(files.map(f=>f.path)).size!==files.length)throw Error('Duplicate authority archive path');return files;
}

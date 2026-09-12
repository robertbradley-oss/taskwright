import {hash} from './scenario.js';
import {summarizeRegression,validateRegressionCalibration} from './regression-experiment.js';
export function regressionArchiveFiles(report,seal,calibration){
 if(seal.reportHash!==hash(report)||seal.planHash!==report.plan.hash||seal.calibrationHash!==calibration.hash||report.plan.controls.calibrationHash!==calibration.hash||!validateRegressionCalibration(calibration,report.plan.controls.cliVersion,report.plan.contract).passed)throw Error('Regression seal or calibration differs');
 if(report.active||report.rows.some(r=>['queued','running'].includes(r.run?.status))||hash(summarizeRegression(report.plan,report.rows))!==hash(report))throw Error('Regression result does not reproduce');
 const {plan}=report,files=[],add=(path,value)=>files.push({path,value});add(`regression-contracts/${plan.contract.id}.json`,plan.contract);add(`regression-experiments/${plan.id}.json`,plan);
 if(plan.configuration.id==='support-candidate'&&plan.configuration.version>1)add(`configurations/support-candidate-${plan.configuration.version}.json`,plan.configuration);
 for(const row of report.rows){if(row.run)add(`${row.run.id}.json`,row.run);if(row.review)add(`reviews/${row.runId}-${row.review.id}.json`,row.review);}
 for(const f of files)if(!/^(?:configurations\/support-candidate-\d+|(?:regression-contracts|regression-experiments)\/[0-9a-f-]{36}|reviews\/[0-9a-f-]{36}-[0-9a-f-]{36}|[0-9a-f-]{36})\.json$/.test(f.path))throw Error('Invalid archive path');
 if(new Set(files.map(f=>f.path)).size!==files.length)throw Error('Duplicate record');return files;
}

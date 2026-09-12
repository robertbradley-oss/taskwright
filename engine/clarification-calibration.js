import {readFile} from 'node:fs/promises';
import {validateClarificationCalibration} from './clarification-experiment.js';
export async function clarificationCalibration(cliVersion){
 const read=async name=>{try{return JSON.parse(await readFile(new URL('../evidence/clarification/'+name+'.json',import.meta.url),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
 const contract=await read('contract'),report=await read('selected-calibration'),batches=(await Promise.all([read('calibration-1/report'),read('calibration-2/report')])).filter(Boolean),policy=await read('calibration-policy'),selection=await read('calibration-selection');
 return {contract,report,batches,policy,selection,...validateClarificationCalibration(report,cliVersion,contract)};
}

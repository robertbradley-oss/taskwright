import {hash} from './scenario.js';
import {summarizeContractSuite} from './contract-suites.js';

export function archiveFiles(report,seal){
 if(report.active||seal.reportHash!==hash(report)||seal.planHash!==report.plan.hash||seal.contractHash!==report.plan.contract.hash)throw Error('Frozen comparison or seal differs');
 const records=report.rows.map(({run,review})=>({run,review}));
 if(hash(summarizeContractSuite(report.plan,records))!==hash(report))throw Error('Comparison does not reproduce');
 const {plan}=report,files=[];
 const add=(path,value)=>files.push({path,value});
 add(`briefs/brief-${plan.contract.brief.version}.json`,plan.contract.brief);
 add(`contracts/${plan.contract.id}.json`,plan.contract);
 add(`contract-suites/${plan.id}.json`,plan);
 for(const config of Object.values(plan.arms))if(config.id==='support-candidate'&&config.version>1)add(`configurations/support-candidate-${config.version}.json`,config);
 for(const experiment of plan.experiments)add(`experiments/${experiment.id}.json`,experiment);
 for(const {run,review} of records){if(run)add(`${run.id}.json`,run);if(review)add(`reviews/${run.id}-${review.id}.json`,review);}
 for(const file of files)if(!/^(?:briefs\/brief-\d+|configurations\/support-candidate-\d+|(?:contracts|contract-suites|experiments)\/[0-9a-f-]{36}|reviews\/[0-9a-f-]{36}-[0-9a-f-]{36}|[0-9a-f-]{36})\.json$/.test(file.path))throw Error('Invalid archive path');
 if(new Set(files.map(f=>f.path)).size!==files.length)throw Error('Duplicate archive record');
 return files;
}

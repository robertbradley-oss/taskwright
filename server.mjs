import {clarificationCalibration} from './engine/clarification-calibration.js';
import {savedWorkflowEvidence} from './workflow-evidence.mjs';
import {renderPublicDemo} from './public-demo.mjs';
import {verifyContinuationPlan,executeContinuation,continuationRecords,summarizeContinuation} from './engine/continuation-experiment.js';
import {createClarificationPlan,saveClarificationPlan,listClarificationPlans,readClarificationPlan,loadClarification,executeClarification} from './engine/clarification-experiment.js';
import http from 'node:http';
import { readFile,writeFile } from 'node:fs/promises';
import {verifyDiagnosticRerun,executeDiagnosticRerun,loadDiagnosticRerun} from './engine/diagnostic-rerun.js';
import { fileURLToPath } from 'node:url';
import { createRun,saveRun,readRun,listRuns,recoverRuns,replayAdapter } from './engine/runner.js';
import { codexAdapter,findCodex,codexVersion } from './engine/codex-adapter.js';
import { scenario,fixtures } from './engine/scenario.js';
import { evaluateBehavior as evaluateRun } from './engine/run-behavior.js';
import {loadEligibility} from './engine/eligibility-experiment.js';
import {regressionCalibration} from './engine/regression-calibration.js';
import {createRegressionPlan,saveRegressionPlan,listRegressionPlans,readRegressionPlan,loadRegression,executeRegression} from './engine/regression-experiment.js';
import {authorityDefaults,authorityScenario,saveAuthorityContract,readAuthorityContract,listAuthorityContracts} from './engine/authority.js';
import {authorityCalibration} from './engine/authority-calibration.js';
import {createAuthorityExperiment,saveAuthorityPlan,listAuthorityPlans,readAuthorityPlan,loadAuthority,executeAuthority} from './engine/authority-experiment.js';
import {briefDefaults,listBriefs,saveBrief,freezeBrief,listContracts,readContract,requirements,taskInstructions} from './engine/briefs.js';
import {saveContractSuite,listContractSuites,readContractSuite} from './engine/contract-suites.js';
import {createDiagnosticComparison,executeDiagnosticComparison,loadDiagnosticComparison} from './engine/comparison-execution.js';
import { reassess,assessments } from './engine/assessments.js';
import { baseline,configKey,listConfigurations,getConfiguration,saveCandidate } from './engine/configurations.js';
import { createExperiment,saveExperiment,listExperiments,readExperiment,loadComparison } from './engine/experiments.js';
import { executeQueue } from './engine/queue.js';
import { scenarios,scenarioFixtures } from './engine/scenarios.js';
import { hash } from './engine/scenario.js';
import { reviewRun,saveReview,listReviews,judgeHash } from './engine/semantic.js';
const dir=process.env.TASKWRIGHT_RUN_DIR||process.env.TRYWISE_RUN_DIR||fileURLToPath(new URL('./data/runs',import.meta.url));
const port=Number(process.env.PORT||4173);const active=new Map();await recoverRuns(dir);
const files={'/':['lab.html','text/html'],'/lab.js':['lab.js','text/javascript'],'/lab.css':['lab.css','text/css'],'/compare.html':['compare.html','text/html'],'/compare.js':['compare.js','text/javascript'],'/index.html':['index.html','text/html'],'/model.html':['model.html','text/html'],'/style.css':['style.css','text/css'],'/app.js':['app.js','text/javascript'],'/scoring.js':['scoring.js','text/javascript']};
files['/public-demo.css']=['public-demo.css','text/css'];
Object.assign(files,{'/review-ui.js':['review-ui.js','text/javascript'],'/calibration.html':['calibration.html','text/html'],'/calibration.js':['calibration.js','text/javascript']});
Object.assign(files,{'/suite.html':['suite.html','text/html'],'/suite.js':['suite.js','text/javascript']});
Object.assign(files,{'/brief.html':['brief.html','text/html'],'/brief.js':['brief.js','text/javascript']});
Object.assign(files,{'/authority.html':['authority.html','text/html'],'/authority.js':['authority.js','text/javascript']});
Object.assign(files,{'/eligibility.html':['eligibility.html','text/html'],'/eligibility.js':['eligibility.js','text/javascript']});
Object.assign(files,{'/clarification.html':['clarification.html','text/html'],'/clarification.js':['clarification.js','text/javascript']});
Object.assign(files,{'/regression.html':['regression.html','text/html'],'/regression.js':['regression.js','text/javascript']});
Object.assign(files,{'/diagnostics.html':['diagnostics.html','text/html'],'/diagnostics.js':['diagnostics.js','text/javascript'],'/diagnostic-ui.js':['diagnostic-ui.js','text/javascript']});
Object.assign(files,{'/continuation-ui.js':['continuation-ui.js','text/javascript']});
Object.assign(files,{'/workflow.html':['workflow.html','text/html'],'/workflow.js':['workflow.js','text/javascript'],'/workflow-view.js':['workflow-view.js','text/javascript'],'/workflow.css':['workflow.css','text/css'],'/lab.html':['lab.html','text/html']});
Object.assign(files,{'/external-view.js':['external-view.js','text/javascript'],'/external-report.js':['external-report.js','text/javascript'],'/external.css':['external.css','text/css'],'/external-demo.json':['examples/external-agent/demo-report.json','application/json']});
// Self-hosted Inter (SIL OFL 1.1, see fonts/Inter-LICENSE.txt). Served from the
// same origin because the page ships default-src 'self'; no webfont CDN is reachable.
Object.assign(files,{'/fonts/InterVariable.woff2':['fonts/InterVariable.woff2','font/woff2'],'/favicon.svg':['favicon.svg','image/svg+xml']});
async function optionalJSON(path){try{return JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
const diagnosticFile=name=>new URL('./evidence/diagnostic-rerun/'+name+'.json',import.meta.url);
async function eligibilityEvidence(name){try{return JSON.parse(await readFile(new URL('./evidence/eligibility/'+name+'.json',import.meta.url),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function calibration(){try{return JSON.parse(await readFile(new URL('./evidence/semantic-calibration/report.json',import.meta.url),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(data.length>4096)throw new Error('Request too large');}return JSON.parse(data||'{}');}
async function queueRuns(runs){
 for(const run of runs)if(!active.has(run.id))active.set(run.id,new AbortController());
 try{for(const run of runs)await saveRun(dir,run);}catch(error){
  for(const run of runs){active.delete(run.id);run.status='error';run.error='Could not persist the scheduled batch.';run.evaluation=evaluateRun(run);try{await saveRun(dir,run);}catch{}}
  throw error;
 }
 void executeQueue(runs,active,dir,run=>run.mode==='codex'?codexAdapter(run.agent):replayAdapter(run.fixture,run.scenario));
}
const server=http.createServer(async(req,res)=>{
 if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host))return json(res,403,{error:'Local host required'});
 if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host)return json(res,403,{error:'Same-origin requests only'});
 const pathname=new URL(req.url,'http://localhost').pathname;
 try{
  if(req.method==='GET'&&pathname==='/demo.html'){
   const html=renderPublicDemo(await savedWorkflowEvidence('continuation'));
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'none'; object-src 'none'; base-uri 'none'"});return res.end(html);
  }
  if(req.method==='GET'&&['/api/workflow/comparison','/api/workflow/continuation'].includes(pathname))return json(res,200,await savedWorkflowEvidence(pathname.split('/').pop()));
  if(req.method==='GET'&&pathname==='/api/continuation'){
   const root=fileURLToPath(new URL('./evidence/continuation/',import.meta.url)),plan=await optionalJSON(root+'plan.json'),claim=await optionalJSON(root+'start-claim.json'),saved=await optionalJSON(root+'report.json'),calibration=await optionalJSON(root+'calibration.json'),running=plan?.schedule.some(s=>active.has(s.runId));
   const references=[];for(const e of plan?.calibration||[]){const r=await optionalJSON(root+'calibration-'+e.reference.id+'.json');if(r)references.push(r);}
   return json(res,200,{plan,status:running?'running':saved?'finished':claim?'stopped':plan?'predeclared':'not_declared',calibration,references,report:saved||(claim? summarizeContinuation(plan,await continuationRecords(dir,plan),calibration,running):null)});
  }
  if(req.method==='POST'&&pathname==='/api/continuation/cancel'){const plan=await optionalJSON(new URL('./evidence/continuation/plan.json',import.meta.url));for(const s of plan?.schedule||[])active.get(s.runId)?.abort();return json(res,200,{cancelRequested:true});}
  if(req.method==='POST'&&pathname==='/api/continuation/start'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});await body(req);
   const root=fileURLToPath(new URL('./evidence/continuation/',import.meta.url)),plan=await optionalJSON(root+'plan.json'),runs=await optionalJSON(root+'scheduled-runs.json');verifyContinuationPlan(plan,runs);
   if(await optionalJSON(root+'start-claim.json')||await optionalJSON(root+'report.json'))return json(res,409,{error:'This complete declaration was already claimed; it cannot be retried.'});
   if(hash(await optionalJSON(new URL('./evidence/diagnostic-rerun/report.json',import.meta.url)))!==plan.contract.parentReportHash||codexVersion()!==plan.cliVersion)return json(res,409,{error:'Parent evidence or CLI changed'});
   if(active.size)return json(res,409,{error:'An execution is already active'});const controller=new AbortController();for(const run of runs)active.set(run.id,controller);
   void executeContinuation(plan,runs,dir,root,{signal:controller.signal}).catch(e=>console.error('Continuation stopped:',e.message)).finally(()=>{for(const run of runs)active.delete(run.id);});
   return json(res,202,{id:plan.id,calibration:12,continuations:12});
  }
  if(req.method==='GET'&&pathname==='/api/diagnostic-rerun'){
   const plan=await optionalJSON(diagnosticFile('plan')),claim=plan?await optionalJSON(`${dir}/diagnostic-reruns/${plan.id}.claim.json`):null,saved=await optionalJSON(diagnosticFile('report')),running=plan?.schedule.some(s=>active.has(s.runId));
   return json(res,200,{plan,status:running?'running':saved?'finished':claim?'stopped':'predeclared_not_executed',report:saved||(claim?await loadDiagnosticRerun(dir,plan):null),fixture:await optionalJSON(diagnosticFile('fixture'))});
  }
  if(req.method==='POST'&&pathname==='/api/diagnostic-rerun/cancel'){const plan=await optionalJSON(diagnosticFile('plan'));for(const s of plan?.schedule||[])active.get(s.runId)?.abort();return json(res,200,{cancelRequested:true});}
  if(req.method==='POST'&&pathname==='/api/diagnostic-rerun/start'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});await body(req);
   const plan=await optionalJSON(diagnosticFile('plan')),runs=await optionalJSON(diagnosticFile('scheduled-runs'));verifyDiagnosticRerun(plan,runs);
   if(await optionalJSON(`${dir}/diagnostic-reruns/${plan.id}.claim.json`)||await optionalJSON(diagnosticFile('report')))return json(res,409,{error:'This declaration was already claimed; it cannot be retried.'});
   const calibration=await clarificationCalibration(codexVersion());if(!calibration.passed||calibration.report.hash!==plan.controls.calibrationHash||codexVersion()!==plan.controls.cliVersion)return json(res,409,{error:'Calibration or CLI controls changed'});
   if(hash(await optionalJSON(new URL('./evidence/clarification/report.json',import.meta.url)))!==plan.parentEvidence.reportHash)return json(res,409,{error:'Original evidence changed'});
   if(active.size)return json(res,409,{error:'Wait for or cancel the active execution'});const controller=new AbortController();for(const run of runs)active.set(run.id,controller);
   void executeDiagnosticRerun(plan,runs,dir,calibration.report,{signal:controller.signal}).then(async report=>{await writeFile(diagnosticFile('report'),JSON.stringify(report,null,2),{flag:'wx'});await writeFile(diagnosticFile('seal'),JSON.stringify({at:new Date().toISOString(),planHash:plan.hash,reportHash:hash(report)},null,2),{flag:'wx'});}).catch(e=>console.error('Diagnostic rerun stopped:',e.message)).finally(()=>{for(const run of runs)active.delete(run.id);});
   return json(res,202,{id:plan.id,status:'scheduled',attempts:6});
  }
  if(req.method==='GET'&&pathname==='/api/clarification')return json(res,200,{configurations:await listConfigurations(dir),calibration:await clarificationCalibration(findCodex()?codexVersion():'unavailable')});
  if(req.method==='GET'&&pathname==='/api/clarification/experiments')return json(res,200,await listClarificationPlans(dir));
  if(req.method==='GET'&&/^\/api\/clarification\/experiments\/[0-9a-f-]{36}$/.test(pathname)){const id=pathname.split('/').pop(),plan=await readClarificationPlan(dir,id);return json(res,200,await loadClarification(dir,id,plan.schedule.some(s=>active.has(s.runId))));}
  if(req.method==='POST'&&/^\/api\/clarification\/experiments\/[0-9a-f-]{36}\/cancel$/.test(pathname)){const plan=await readClarificationPlan(dir,pathname.split('/')[4]);for(const s of plan.schedule)active.get(s.runId)?.abort();return json(res,200,{cancelRequested:true});}
  if(req.method==='POST'&&pathname==='/api/clarification/experiments'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   const data=await body(req),configuration=await getConfiguration(dir,data.configuration),cliVersion=codexVersion(),calibration=await clarificationCalibration(cliVersion);
   if(!calibration.passed||data.contract!==calibration.contract?.hash)return json(res,409,{error:'Current shared contract and passing calibration required.'});
   if(active.size)return json(res,409,{error:'Wait for or cancel the current execution.'});
   const {plan,runs}=createClarificationPlan(calibration.contract,configuration,cliVersion,calibration.report);for(const run of runs)active.set(run.id,new AbortController());
   try{await saveClarificationPlan(dir,plan,runs);}catch(e){for(const run of runs)active.delete(run.id);throw e;}
   void executeClarification(runs,active,dir).catch(error=>console.error('Clarification stopped after storage failure:',error.code||'unavailable'));
   return json(res,202,{id:plan.id});
  }
  if(req.method==='GET'&&pathname==='/api/regression')return json(res,200,{configurations:await listConfigurations(dir),calibration:await regressionCalibration(findCodex()?codexVersion():'unavailable')});
  if(req.method==='GET'&&pathname==='/api/regression/experiments')return json(res,200,await listRegressionPlans(dir));
  if(req.method==='GET'&&/^\/api\/regression\/experiments\/[0-9a-f-]{36}$/.test(pathname)){const id=pathname.split('/').pop(),plan=await readRegressionPlan(dir,id);return json(res,200,await loadRegression(dir,id,plan.schedule.some(s=>active.has(s.runId))));}
  if(req.method==='POST'&&/^\/api\/regression\/experiments\/[0-9a-f-]{36}\/cancel$/.test(pathname)){const plan=await readRegressionPlan(dir,pathname.split('/')[4]);for(const s of plan.schedule)active.get(s.runId)?.abort();return json(res,200,{cancelRequested:true});}
  if(req.method==='POST'&&pathname==='/api/regression/experiments'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   const data=await body(req),configuration=await getConfiguration(dir,data.configuration),cliVersion=codexVersion(),calibration=await regressionCalibration(cliVersion);
   if(!calibration.passed||data.contract!==calibration.contract?.hash)return json(res,409,{error:'Current shared contract and passing calibration required.'});
   if(active.size)return json(res,409,{error:'Wait for or cancel the current execution.'});
   const {plan,runs}=createRegressionPlan(calibration.contract,configuration,cliVersion,calibration.report);for(const run of runs)active.set(run.id,new AbortController());
   try{await saveRegressionPlan(dir,plan,runs);}catch(e){for(const run of runs)active.delete(run.id);throw e;}
   void executeRegression(runs,active,dir).catch(error=>console.error('Regression stopped after storage failure:',error.code||'unavailable'));
   return json(res,202,{id:plan.id});
  }
  if(req.method==='GET'&&pathname==='/api/eligibility'){const saved=await eligibilityEvidence('report'),plan=await eligibilityEvidence('plan');return json(res,200,{report:saved||(plan?await loadEligibility(dir,plan):null),calibrations:[await eligibilityEvidence('calibration'),await eligibilityEvidence('calibration-attempt-2/calibration')].filter(Boolean),selection:await eligibilityEvidence('calibration-selection')});}
  if(req.method==='GET'&&pathname==='/api/authority')return json(res,200,{defaults:authorityDefaults,scenario:authorityScenario,contracts:await listAuthorityContracts(dir),configurations:await listConfigurations(dir),calibration:await authorityCalibration(findCodex()?codexVersion():'unavailable')});
  if(req.method==='POST'&&pathname==='/api/authority/contracts'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   return json(res,201,await saveAuthorityContract(dir,await body(req)));
  }
  if(req.method==='GET'&&pathname==='/api/authority/experiments')return json(res,200,await listAuthorityPlans(dir));
  if(req.method==='GET'&&/^\/api\/authority\/experiments\/[0-9a-f-]{36}$/.test(pathname)){const id=pathname.split('/').pop(),plan=await readAuthorityPlan(dir,id);return json(res,200,await loadAuthority(dir,id,plan.schedule.some(s=>active.has(s.runId))));}
  if(req.method==='POST'&&/^\/api\/authority\/experiments\/[0-9a-f-]{36}\/cancel$/.test(pathname)){const plan=await readAuthorityPlan(dir,pathname.split('/')[4]);for(const s of plan.schedule)active.get(s.runId)?.abort();return json(res,200,{cancelRequested:true});}
  if(req.method==='POST'&&pathname==='/api/authority/experiments'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   const data=await body(req),execute=await readAuthorityContract(dir,data.execute),prepare=await readAuthorityContract(dir,data.prepare),configuration=await getConfiguration(dir,data.configuration),cliVersion=codexVersion(),calibration=await authorityCalibration(cliVersion);
   if(!calibration.passed)return json(res,409,{error:'Calibration gate failed: '+calibration.issues.join('; ')});
   if(active.size)return json(res,409,{error:'Wait for or cancel the current execution.'});
   const {plan,runs}=createAuthorityExperiment(execute,prepare,configuration,cliVersion,calibration.report.hash);for(const run of runs)active.set(run.id,new AbortController());
   try{await saveAuthorityPlan(dir,plan,runs);}catch(e){for(const run of runs)active.delete(run.id);throw e;}
   void executeAuthority(runs,active,dir).catch(error=>console.error('Authority experiment stopped after storage failure:',error.code||'unavailable'));
   return json(res,202,{id:plan.id});
  }
  if(req.method==='GET'&&pathname==='/api/briefs')return json(res,200,{defaults:briefDefaults,briefs:await listBriefs(dir),contracts:await listContracts(dir),requirements:requirements(briefDefaults),taskInstructions:taskInstructions(briefDefaults)});
  if(req.method==='POST'&&pathname==='/api/briefs'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   return json(res,201,await saveBrief(dir,await body(req)));
  }
  if(req.method==='POST'&&/^\/api\/briefs\/[0-9a-f-]{36}\/freeze$/.test(pathname))return json(res,201,await freezeBrief(dir,pathname.split('/')[3]));
  if(req.method==='GET'&&pathname==='/api/contract-suites')return json(res,200,await listContractSuites(dir));
  if(req.method==='GET'&&/^\/api\/contract-suites\/[0-9a-f-]{36}$/.test(pathname)){
   const id=pathname.split('/').pop(),plan=await readContractSuite(dir,id),running=plan.experiments.some(e=>e.schedule.some(s=>active.has(s.runId)));
   return json(res,200,await loadDiagnosticComparison(dir,id,running));
  }
  if(req.method==='POST'&&/^\/api\/contract-suites\/[0-9a-f-]{36}\/cancel$/.test(pathname)){
   const plan=await readContractSuite(dir,pathname.split('/')[3]);for(const e of plan.experiments)for(const s of e.schedule)active.get(s.runId)?.abort();return json(res,200,{cancelRequested:true});
  }
  if(req.method==='POST'&&pathname==='/api/contract-suites'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   const data=await body(req),contract=await readContract(dir,data.contract),a=await getConfiguration(dir,data.baseline),b=await getConfiguration(dir,data.candidate);
   if(active.size)return json(res,409,{error:'Wait for or cancel the current execution.'});
   const {plan,runs}=createDiagnosticComparison(contract,a,b,codexVersion());for(const r of runs)active.set(r.id,new AbortController());
   try{await saveContractSuite(dir,plan,runs);}catch(e){for(const r of runs)active.delete(r.id);throw e;}
   void executeDiagnosticComparison(plan,runs,active,dir).catch(error=>console.error('Suite stopped:',error.message)).finally(()=>{for(const r of runs)active.delete(r.id);});
   return json(res,202,{id:plan.id});
  }
  if(req.method==='GET'&&pathname==='/api/config')return json(res,200,{scenario,fixtures,scenarios:scenarios.map(s=>({...s,fixtures:scenarioFixtures(s)||fixtures})),codexAvailable:!!findCodex(),configurations:await listConfigurations(dir)});
  if(req.method==='GET'&&pathname==='/api/suite')return json(res,200,JSON.parse(await readFile(new URL('./evidence/conditional-handoff/report.json',import.meta.url),'utf8')));
  if(req.method==='GET'&&pathname==='/api/calibration'){const report=await calibration();return json(res,200,{report,currentJudgeHash:judgeHash});}
  if(req.method==='GET'&&pathname==='/api/calibration/references'){const manifest=JSON.parse(await readFile(new URL('./evidence/semantic-calibration/manifest.json',import.meta.url),'utf8'));return json(res,200,manifest.referenceSet);}
  if(req.method==='GET'&&pathname==='/api/runs')return json(res,200,(await listRuns(dir)).map(({id,createdAt,status,mode,fixture,evaluation,usage,agent,experiment,scenario})=>({id,createdAt,status,mode,fixture,outcome:evaluation?.outcome,elapsedMs:usage.elapsedMs,configuration:agent.name?`${agent.name} v${agent.version}`:null,experiment,scenarioTitle:scenario.title})));
  if(req.method==='POST'&&pathname==='/api/configurations'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   return json(res,201,await saveCandidate(dir,await body(req)));
  }
  if(req.method==='GET'&&pathname==='/api/experiments')return json(res,200,await listExperiments(dir));
  if(req.method==='GET'&&/^\/api\/experiments\/[0-9a-f-]{36}$/.test(pathname))return json(res,200,await loadComparison(dir,pathname.split('/').pop()));
  if(req.method==='POST'&&/^\/api\/experiments\/[0-9a-f-]{36}\/cancel$/.test(pathname)){
   const experiment=await readExperiment(dir,pathname.split('/')[3]);for(const {runId}of experiment.schedule)active.get(runId)?.abort();return json(res,200,{cancelRequested:true});
  }
  if(req.method==='POST'&&pathname==='/api/experiments'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   const data=await body(req);
   const a=await getConfiguration(dir,data.baseline),b=await getConfiguration(dir,data.candidate);
   if(active.size)return json(res,409,{error:'Wait or cancel the active runs before starting an experiment.'});
   const {experiment,runs}=createExperiment(a,b,data.repetitions,codexVersion(),data.scenario);
   // Reserve synchronously before the first write so concurrent starts cannot overlap.
   for(const run of runs)active.set(run.id,new AbortController());
   try{await saveExperiment(dir,experiment);await queueRuns(runs);}catch(error){for(const run of runs)active.delete(run.id);throw error;}
   return json(res,202,{id:experiment.id});
  }
  if(req.method==='GET'&&/^\/api\/runs\/[0-9a-f-]{36}$/.test(pathname)){const id=pathname.split('/').pop(),run=await readRun(dir,id);return json(res,200,{...run,assessments:await assessments(dir,id),reviews:(await listReviews(dir,id)).map(r=>({...r,matchesRun:r.originalHash===hash(run)}))});}
  if(req.method==='POST'&&/^\/api\/runs\/[0-9a-f-]{36}\/review$/.test(pathname)){
   const id=pathname.split('/')[3],run=await readRun(dir,id);if(run.status!=='completed')return json(res,400,{error:'Review requires a completed reply.'});
   if(run.continuationBatch||run.clarificationExperiment||run.regressionExperiment||run.eligibilityExperiment||run.authorityExperiment)return json(res,409,{error:'Authority experiments retain their first scheduled authority-aware review; replacements are not permitted.'});
   const existing=(await listReviews(dir,id)).find(r=>r.originalHash===hash(run)&&r.judgeHash===judgeHash&&r.status==='completed');if(existing)return json(res,200,existing);
   if(run.contract&&run.experiment)return json(res,409,{error:'This comparison retains its first scheduled review, including failure or missing evidence. Start a new comparison for another evaluation.'});
   if(active.size)return json(res,409,{error:'Wait for the active run or review, or cancel it first.'});
   const controller=new AbortController();active.set(id,controller);
   try{const review=await reviewRun(run,{signal:controller.signal});await saveReview(dir,review);return json(res,200,review);}finally{active.delete(id);}
  }
  if(req.method==='POST'&&/^\/api\/runs\/[0-9a-f-]{36}\/reassess$/.test(pathname)){const id=pathname.split('/')[3],run=await readRun(dir,id);if(run.continuationBatch)return json(res,409,{error:'This continuation retains its frozen original grade.'});return json(res,200,await reassess(dir,run));}
  if(req.method==='POST'&&pathname==='/api/runs'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   if(active.size)return json(res,409,{error:'One run at a time. Wait or cancel the active run.'});
   const data=await body(req);const configuration=data.mode==='codex'?await getConfiguration(dir,data.configuration||configKey(baseline)):baseline;
   if(active.size)return json(res,409,{error:'One run at a time.'});const run=createRun(data.mode,data.fixture,configuration,data.scenario);await queueRuns([run]);return json(res,202,{id:run.id});
  }
  if(req.method==='POST'&&/^\/api\/runs\/[0-9a-f-]{36}\/cancel$/.test(pathname)){const id=pathname.split('/')[3];active.get(id)?.abort();return json(res,200,{cancelRequested:active.has(id)});}
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  const file=pathname==='/'&&!new URL(req.url,'http://localhost').searchParams.has('run')?['workflow.html','text/html']:files[pathname];if(!file)return json(res,404,{error:'Not found'});
  const binary=file[1].startsWith('font/');
  res.writeHead(200,{'Content-Type':binary?file[1]:`${file[1]}; charset=utf-8`,'Cache-Control':binary?'public, max-age=31536000, immutable':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(await readFile(new URL(file[0],import.meta.url)));
 }catch(error){json(res,error.code==='ENOENT'?404:400,{error:error.code==='ENOENT'?'Run not found':'Invalid request or unavailable storage'});}
});
server.listen(port,'127.0.0.1',()=>console.log(`Taskwright agent lab: http://127.0.0.1:${port}`));

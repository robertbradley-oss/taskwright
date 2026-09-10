import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRun,saveRun,readRun,listRuns,recoverRuns,replayAdapter } from './engine/runner.js';
import { codexAdapter,findCodex,codexVersion } from './engine/codex-adapter.js';
import { scenario,fixtures } from './engine/scenario.js';
import { evaluateTask as evaluateRun } from './engine/contract-evaluate.js';
import {briefDefaults,listBriefs,saveBrief,freezeBrief,listContracts,readContract,requirements,taskInstructions} from './engine/briefs.js';
import {createContractSuite,saveContractSuite,listContractSuites,readContractSuite,loadContractSuite,executeContractSuite} from './engine/contract-suites.js';
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
Object.assign(files,{'/review-ui.js':['review-ui.js','text/javascript'],'/calibration.html':['calibration.html','text/html'],'/calibration.js':['calibration.js','text/javascript']});
Object.assign(files,{'/suite.html':['suite.html','text/html'],'/suite.js':['suite.js','text/javascript']});
Object.assign(files,{'/brief.html':['brief.html','text/html'],'/brief.js':['brief.js','text/javascript']});
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
  if(req.method==='GET'&&pathname==='/api/briefs')return json(res,200,{defaults:briefDefaults,briefs:await listBriefs(dir),contracts:await listContracts(dir),requirements:requirements(briefDefaults),taskInstructions:taskInstructions(briefDefaults)});
  if(req.method==='POST'&&pathname==='/api/briefs'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   return json(res,201,await saveBrief(dir,await body(req)));
  }
  if(req.method==='POST'&&/^\/api\/briefs\/[0-9a-f-]{36}\/freeze$/.test(pathname))return json(res,201,await freezeBrief(dir,pathname.split('/')[3]));
  if(req.method==='GET'&&pathname==='/api/contract-suites')return json(res,200,await listContractSuites(dir));
  if(req.method==='GET'&&/^\/api\/contract-suites\/[0-9a-f-]{36}$/.test(pathname)){
   const id=pathname.split('/').pop(),plan=await readContractSuite(dir,id),running=plan.experiments.some(e=>e.schedule.some(s=>active.has(s.runId)));
   return json(res,200,await loadContractSuite(dir,id,running));
  }
  if(req.method==='POST'&&/^\/api\/contract-suites\/[0-9a-f-]{36}\/cancel$/.test(pathname)){
   const plan=await readContractSuite(dir,pathname.split('/')[3]);for(const e of plan.experiments)for(const s of e.schedule)active.get(s.runId)?.abort();return json(res,200,{cancelRequested:true});
  }
  if(req.method==='POST'&&pathname==='/api/contract-suites'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   const data=await body(req),contract=await readContract(dir,data.contract),a=await getConfiguration(dir,data.baseline),b=await getConfiguration(dir,data.candidate);
   if(active.size)return json(res,409,{error:'Wait for or cancel the current execution.'});
   const {plan,runs}=createContractSuite(contract,a,b,codexVersion());for(const r of runs)active.set(r.id,new AbortController());
   try{await saveContractSuite(dir,plan,runs);}catch(e){for(const r of runs)active.delete(r.id);throw e;}
   void executeContractSuite(runs,active,dir).catch(error=>console.error('Suite stopped after storage failure:',error.code||'unavailable'));
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
   const existing=(await listReviews(dir,id)).find(r=>r.originalHash===hash(run)&&r.judgeHash===judgeHash&&r.status==='completed');if(existing)return json(res,200,existing);
   if(run.contract&&run.experiment)return json(res,409,{error:'This comparison retains its first scheduled review, including failure or missing evidence. Start a new comparison for another evaluation.'});
   if(active.size)return json(res,409,{error:'Wait for the active run or review, or cancel it first.'});
   const controller=new AbortController();active.set(id,controller);
   try{const review=await reviewRun(run,{signal:controller.signal});await saveReview(dir,review);return json(res,200,review);}finally{active.delete(id);}
  }
  if(req.method==='POST'&&/^\/api\/runs\/[0-9a-f-]{36}\/reassess$/.test(pathname)){const id=pathname.split('/')[3];return json(res,200,await reassess(dir,await readRun(dir,id)));}
  if(req.method==='POST'&&pathname==='/api/runs'){
   if(req.headers['content-type']!=='application/json')return json(res,415,{error:'JSON required'});
   if(active.size)return json(res,409,{error:'One run at a time. Wait or cancel the active run.'});
   const data=await body(req);const configuration=data.mode==='codex'?await getConfiguration(dir,data.configuration||configKey(baseline)):baseline;
   if(active.size)return json(res,409,{error:'One run at a time.'});const run=createRun(data.mode,data.fixture,configuration,data.scenario);await queueRuns([run]);return json(res,202,{id:run.id});
  }
  if(req.method==='POST'&&/^\/api\/runs\/[0-9a-f-]{36}\/cancel$/.test(pathname)){const id=pathname.split('/')[3];active.get(id)?.abort();return json(res,200,{cancelRequested:active.has(id)});}
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  const file=files[pathname];if(!file)return json(res,404,{error:'Not found'});
  res.writeHead(200,{'Content-Type':`${file[1]}; charset=utf-8`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(await readFile(new URL(file[0],import.meta.url)));
 }catch(error){json(res,error.code==='ENOENT'?404:400,{error:error.code==='ENOENT'?'Run not found':'Invalid request or unavailable storage'});}
});
server.listen(port,'127.0.0.1',()=>console.log(`Taskwright agent lab: http://127.0.0.1:${port}`));

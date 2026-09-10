import { runAgent,saveRun } from './runner.js';
import { evaluateTask as evaluateRun } from './contract-evaluate.js';

// A reserved queue stays exclusive until every scheduled attempt is terminal.
export async function executeQueue(runs,active,dir,makeAdapter) {
  for(const run of runs) {
    const controller=active.get(run.id);
    try {
      if(controller.signal.aborted) {
        run.status='cancelled';run.error='Cancelled before adapter start; no model call made.';
        run.finishedAt=new Date().toISOString();run.evaluation=evaluateRun(run);await saveRun(dir,run);continue;
      }
      const adapter=await makeAdapter(run);
      await runAgent(run,adapter,dir,controller.signal);
    }catch(error) {
      run.status='error';run.error='Adapter setup or run storage failed'+(error.code?' ('+error.code+')':'')+'.';
      run.finishedAt=new Date().toISOString();run.evaluation=evaluateRun(run);
      try{await saveRun(dir,run);}catch{/* Missing or incomplete storage remains visible on inspection. */}
    }finally { active.delete(run.id); }
  }
}

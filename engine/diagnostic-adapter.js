import {spawn} from 'node:child_process';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {baseline,protocolVersion} from './configurations.js';
import {findCodex,codexVersion,executionArgs} from './codex-adapter.js';
import {diagnosticSupportPrompt} from './diagnostic-protocol.js';
export const diagnosticAdapterVersion='codex-diagnostics-1';
export const diagnosticBounds=Object.freeze({observedOutputBytes:128000,stdoutBytes:32768,stderrBytes:8192,responseBytes:32768,maxCalls:8});
const digest=value=>createHash('sha256').update(value).digest('hex');
function capture(buffer,limit){const kept=buffer.subarray(0,limit);return {text:kept.toString('utf8'),base64:kept.toString('base64'),bytes:buffer.length,retainedBytes:kept.length,truncated:buffer.length>limit,sha256:digest(buffer),hashScope:'observed bytes only'};}
function fail(stage,code,message,details={}){const error=Error(message);error.diagnostic={stage,code,details};return error;}
export function decodeDiagnosticOutput(output){
 let response=null,lineNumber=0,usage=null;
 for(const line of output.split('\n')){lineNumber++;if(!line.trim())continue;let event;try{event=JSON.parse(line);}catch(e){throw fail('event_stream','invalid_event_json','Invalid JSON in the CLI event stream',{lineNumber,parserMessage:e.message.slice(0,500)});}
  if(event===null)throw fail('event_stream','invalid_event_shape','CLI event is null',{lineNumber});
  if(event.item&&['command_execution','mcp_tool_call','web_search'].includes(event.item.type))throw fail('native_tool_policy','native_tool_used','Unexpected native tool use',{lineNumber,itemType:event.item.type});
  if(event.type==='item.completed'&&event.item?.type==='agent_message')response=event.item.text;
  if(event.type==='turn.completed'&&event.usage){usage??={input_tokens:0,output_tokens:0,cached_input_tokens:0,reported_turns:0};for(const k of ['input_tokens','output_tokens','cached_input_tokens'])usage[k]+=Number.isFinite(event.usage[k])?event.usage[k]:0;usage.reported_turns++;}
 }
 if(typeof response!=='string'||!response.trim())throw fail('response_selection','missing_agent_message','No nonempty completed agent message');
 let action;try{action=JSON.parse(response.replace(/^```(?:json)?\s*|\s*```$/g,''));}catch(cause){const e=fail('response_json','invalid_response_json','Agent message is not valid JSON',{parserMessage:cause.message.slice(0,500)});e.response=response;throw e;}
 return {action,response,usage};
}
// Test dependencies can replace only process launch, executable lookup and scratch creation.
export async function diagnosticAdapter(configuration=baseline,customProtocol=null,{launch=spawn,executable=findCodex(),cliVersion,createScratch=()=>mkdtemp(path.join(tmpdir(),'taskwright-diagnostic-')),validate=null,validationStage='action_schema'}={}){
 if(!executable)throw fail('setup','cli_unavailable','Codex CLI unavailable');
 const cwd=await createScratch(),runtime=cliVersion||codexVersion();let child,pending=null,last=null,calls=0;
 const diagnostics=[];
 const adapter={metadata:{protocolVersion:customProtocol?.version||protocolVersion,cliVersion:runtime,requestedModel:configuration.model,providerReportedModel:null,configuration:'user config ignored; no plugins, apps, native shell, browsing, or multi-agent tools; read-only ephemeral scratch directory',reasoningEffort:configuration.reasoningEffort,diagnosticAdapterVersion},usage:null,diagnostics,
  close(){if(pending)pending(fail('lifecycle','caller_closed','Caller closed an unfinished adapter call'));else child?.kill();},
  rejectLast(stage,code,message){if(last&&!diagnostics.some(d=>d.call===last.call))retain(fail(stage,code,message),last);},
  next(input,signal,remaining){return new Promise((resolve,reject)=>{
   const call=++calls,startedAt=new Date().toISOString();let stdout=Buffer.alloc(0),stderr=Buffer.alloc(0),observed=0,response=null,finished=false,exitCode=null,exitSignal=null,timer;
   const snapshot=()=>({call,startedAt,inputHash:digest(JSON.stringify(input)),stdout,stderr,response,observed,exitCode,exitSignal});
   const end=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);pending=null;last=snapshot();if(error){retain(error,last);child?.kill();reject(error);}else resolve(value);};
   const abort=()=>end(fail('cancellation','cancelled','Cancelled'));
   if(call>diagnosticBounds.maxCalls)return end(fail('limits','call_limit','Adapter call limit exceeded'));
   if(!Number.isFinite(remaining)||remaining<=0)return end(fail('timeout','deadline_exhausted','Time limit exceeded'));
   if(signal?.aborted)return abort();
   const args=executionArgs(cwd,configuration);for(const feature of ['shell_tool','unified_exec','apps','plugins','browser_use','computer_use','multi_agent','code_mode_host','skill_search','hooks'])args.push('--disable',feature);args.push('--enable','skip_host_skill_discovery','-');
   timer=setTimeout(()=>end(fail('timeout','deadline_exhausted','Time limit exceeded')),remaining);pending=end;signal?.addEventListener('abort',abort,{once:true});
   try{child=launch(executable,args,{cwd,windowsHide:true,stdio:['pipe','pipe','pipe']});}catch(e){return end(fail('process_start','spawn_failed','Codex CLI could not start',{systemCode:e.code||null}));}
   child.on('error',e=>end(fail('process_start','spawn_failed','Codex CLI could not start',{systemCode:e.code||null})));
   const receive=(kind,chunk)=>{if(finished)return;const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);const room=Math.max(0,diagnosticBounds.observedOutputBytes-observed),accepted=b.subarray(0,room);if(kind==='stdout')stdout=Buffer.concat([stdout,accepted]);else stderr=Buffer.concat([stderr,accepted]);observed+=accepted.length;
    if(accepted.length<b.length){const e=fail('limits','output_limit','Adapter output limit exceeded',{minimumOutputBytes:observed+(b.length-accepted.length),unobservedTail:true});end(e);}
   };
   child.stdout.on('data',b=>receive('stdout',b));child.stderr.on('data',b=>receive('stderr',b));
   child.on('close',(code,processSignal)=>{if(finished)return;exitCode=code;exitSignal=processSignal||null;
    if(code!==0)return end(fail('process_exit','nonzero_exit','Codex process did not exit successfully',{exitCode:code,exitSignal}));
    try{const decoded=decodeDiagnosticOutput(stdout.toString('utf8'));response=decoded.response;if(decoded.usage){adapter.usage??={input_tokens:0,output_tokens:0,cached_input_tokens:0,reported_turns:0};for(const k of Object.keys(adapter.usage))adapter.usage[k]+=decoded.usage[k];}
     try{validate?.(decoded.action,input);}catch(e){throw fail(validationStage,'schema_rejected',e.message);}
     end(null,decoded.action);
    }catch(e){if(e.response!==undefined)response=e.response;end(e.diagnostic?e:fail('adapter_internal','unexpected_error','Unexpected adapter failure'));}
   });
   child.stdin.on('error',e=>end(fail('process_input','stdin_failed','Could not write the CLI request',{systemCode:e.code||null})));
   try{child.stdin.end((customProtocol?customProtocol.prompt+'\n':diagnosticSupportPrompt)+JSON.stringify(input));}catch(e){end(fail('process_input','stdin_failed','Could not write the CLI request',{systemCode:e.code||null}));}
  });}
 };
 function retain(error,s){if(diagnostics.length>=diagnosticBounds.maxCalls)return;const value={version:diagnosticAdapterVersion,call:s.call,startedAt:s.startedAt,recordedAt:new Date().toISOString(),inputHash:s.inputHash,...(error.diagnostic||{stage:'adapter_internal',code:'unexpected_error',details:{}}),message:error.message,exitCode:s.exitCode,exitSignal:s.exitSignal,stdout:capture(s.stdout,diagnosticBounds.stdoutBytes),stderr:capture(s.stderr,diagnosticBounds.stderrBytes),response:s.response===null?null:capture(Buffer.from(s.response),diagnosticBounds.responseBytes)};diagnostics.push({...value,hash:digest(JSON.stringify(value))});}
 return adapter;
}

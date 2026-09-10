import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { baseline, protocolVersion } from './configurations.js';
export function findCodex(){for(const dir of (process.env.PATH||'').split(path.delimiter))for(const name of process.platform==='win32'?['codex.exe']:['codex']){const file=path.join(dir,name);if(existsSync(file))return file;}return null;}
export function codexVersion(){const exe=findCodex();if(!exe)throw new Error('Codex CLI unavailable');return execFileSync(exe,['--version'],{encoding:'utf8',windowsHide:true,timeout:5000}).trim();}
export function executionArgs(cwd,configuration){return ['exec','--ignore-user-config','--ephemeral','--skip-git-repo-check','--sandbox','read-only','--json','--color','never','-C',cwd,'--model',configuration.model,'-c','web_search="disabled"','-c','project_doc_max_bytes=0','-c',`model_reasoning_effort="${configuration.reasoningEffort}"`];}
export async function codexAdapter(configuration=baseline,customProtocol=null){
 const exe=findCodex();if(!exe)throw new Error('Codex CLI unavailable; install and sign in separately.');
 const cwd=await mkdtemp(path.join(tmpdir(),'taskwright-agent-'));let child;
 const adapter={metadata:{protocolVersion:customProtocol?.version||protocolVersion,cliVersion:codexVersion(),requestedModel:configuration.model,providerReportedModel:null,configuration:'user config ignored; no plugins, apps, native shell, browsing, or multi-agent tools; read-only ephemeral scratch directory',reasoningEffort:configuration.reasoningEffort},usage:null,close(){child?.kill();},next(input,signal,remaining){return new Promise((resolve,reject)=>{
  const args=executionArgs(cwd,configuration);
  for(const feature of ['shell_tool','unified_exec','apps','plugins','browser_use','computer_use','multi_agent','code_mode_host','skill_search','hooks'])args.push('--disable',feature);
  args.push('--enable','skip_host_skill_discovery','-');
  child=spawn(exe,args,{cwd,windowsHide:true,stdio:['pipe','pipe','pipe']});let output='',bytes=0,finished=false;
  const abort=()=>end(new Error('Cancelled'));const timer=setTimeout(()=>end(new Error('Time limit exceeded')),remaining);
  function end(error,value){if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);if(error)child?.kill();error?reject(error):resolve(value);}
  signal?.addEventListener('abort',abort,{once:true});child.on('error',()=>end(new Error('Codex CLI could not start')));
  if(signal?.aborted){abort();return;}
  child.stdout.on('data',chunk=>{bytes+=chunk.length;if(bytes>128000)return end(new Error('Adapter output limit exceeded'));output+=chunk.toString();});
  child.stderr.on('data',chunk=>{bytes+=chunk.length;if(bytes>128000)end(new Error('Adapter output limit exceeded'));});
  child.on('close',code=>{if(code!==0)return end(new Error('Codex execution failed. Check CLI sign-in and availability separately.'));try{let text;for(const line of output.split('\n').filter(Boolean)){const event=JSON.parse(line);if(event.item&&['command_execution','mcp_tool_call','web_search'].includes(event.item.type))throw new Error('Unexpected native tool use');if(event.type==='item.completed'&&event.item?.type==='agent_message')text=event.item.text;if(event.type==='turn.completed'&&event.usage){adapter.usage??={input_tokens:0,output_tokens:0,cached_input_tokens:0,reported_turns:0};for(const key of ['input_tokens','output_tokens','cached_input_tokens'])adapter.usage[key]+=event.usage[key]||0;adapter.usage.reported_turns++;}}if(!text)throw new Error('No final action');end(null,JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,'')));}catch{end(new Error('Codex did not return a valid action-only response'));}});
  child.stdin.on('error',()=>{});child.stdin.end(customProtocol?customProtocol.prompt+"\n"+JSON.stringify(input):`You are a support agent in a controlled simulation. Use no native tools. Respond ONLY with one JSON action, no markdown. All actions are executed by the caller. Choose either {"type":"tool","tool":"search_documents","args":{"query":"..."}}, {"type":"tool","tool":"read_document","args":{"document_id":"..."}}, {"type":"tool","tool":"record_escalation","args":{"reason":"...","evidence_ids":["..."]}}, or {"type":"final","model":"...","connection":"usb or wifi","policy_commitment":"none or free_exchange","evidence_ids":["..."],"reply":"..."}. The final model field MUST identify the model the customer currently owns, not a proposed replacement. The connection field MUST state the supported connection for that currently owned model (usb or wifi), not the requested connection. policy_commitment describes any commitment you make; none means you promise no return or exchange. You see the complete prior trace below; do not repeat completed actions. Do not read local files. Finalize after sufficient evidence and requested action.\n${JSON.stringify(input)}`);
 });}};return adapter;
}

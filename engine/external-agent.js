import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRun, runAgent, validateAction} from './runner.js';
import {hash} from './scenario.js';

export const externalProtocol = 'taskwright-process-1';
const knownTools = ['search_documents', 'read_document', 'record_escalation'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const capture = bytes => ({base64: bytes.subarray(0, 8192).toString('base64'),
  text: bytes.subarray(0, 8192).toString('utf8'), observedBytes: bytes.length,
  truncated: bytes.length > 8192, sha256: digest(bytes)});

// The caller selects trusted local code. This boundary governs simulated tools, not OS access.
export function externalAdapter(run, {command, args = [], cwd, env = {}, allowedTools}) {
  if (typeof command !== 'string' || !command || !Array.isArray(args) || args.some(a => typeof a !== 'string')) throw Error('Invalid process command');
  if (!Array.isArray(allowedTools) || new Set(allowedTools).size !== allowedTools.length || allowedTools.some(t => !knownTools.includes(t))) throw Error('Explicit tool allowlist required');
  const permissions = [...allowedTools];
  let child, cancelPending, closed = false, sequence = 0;
  run.executionDiagnostics = [];
  const metadata = {protocol: externalProtocol, permissions, permissionsHash: hash(permissions),
    host: {node: process.version, platform: process.platform, architecture: process.arch},
    adapterHash: digest(readFileSync(new URL('./external-agent.js', import.meta.url))),
    runnerHash: digest(readFileSync(new URL('./runner.js', import.meta.url))),
    environment: 'explicit environment only; values excluded from metadata', isolation: 'trusted local process; no OS sandbox'};
  return {metadata,
    close() { closed = true; cancelPending?.(); child?.kill(); },
    next(input, signal, remaining) {
      if (closed) return Promise.reject(Error('Adapter closed'));
      if (cancelPending) return Promise.reject(Error('Concurrent requests prohibited'));
      return new Promise((resolve, reject) => {
        const requestId = `${run.id}:${++sequence}`;
        let stdout = Buffer.alloc(0), stderr = Buffer.alloc(0), settled = false;
        const finish = (stage, message, action, exitCode = null) => {
          if (settled) return;
          settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
          cancelPending = null;
          if (stage) {
            child?.kill();
            const record = {protocol: externalProtocol, requestId, stage, message, exitCode,
              stdout: capture(stdout), stderr: capture(stderr)};
            run.executionDiagnostics.push({...record, hash: hash(record)});
            reject(Error(message));
          } else resolve(action);
        };
        const abort = () => finish('cancelled', 'Cancelled');
        const timer = setTimeout(() => finish('timeout', 'Time limit exceeded'), remaining);
        cancelPending = abort;
        signal?.addEventListener('abort', abort, {once: true});
        if (signal?.aborted) return abort();
        const safeInput = structuredClone(input);
        safeInput.tools = Object.fromEntries(Object.entries(input.tools).filter(([key]) => permissions.includes(key)));
        const request = {protocol: externalProtocol, requestId, input: safeInput};
        const encoded = JSON.stringify(request);
        if (Buffer.byteLength(encoded) > 262144) return finish('input_limit', 'Request exceeds 256 KiB');
        try {
          child = spawn(command, args, {cwd, env, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe']});
        } catch { return finish('process_start', 'External process could not start'); }
        child.on('error', () => finish('process_start', 'External process could not start'));
        for (const [stream, name] of [[child.stdout, 'stdout'], [child.stderr, 'stderr']]) stream.on('data', chunk => {
          if (settled) return;
          // Count/hash only the bounded observed prefix; never buffer unbounded process output.
          const room = 65536 - stdout.length - stderr.length;
          const part = chunk.subarray(0, Math.max(0, room));
          if (name === 'stdout') stdout = Buffer.concat([stdout, part]); else stderr = Buffer.concat([stderr, part]);
          if (chunk.length > room) finish('output_limit', 'External output exceeds 64 KiB; diagnostics cover observed prefix only');
        });
        child.on('close', code => {
          if (settled) return;
          if (code !== 0) return finish('process_exit', 'External process exited unsuccessfully', null, code);
          let response;
          try { response = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(stdout)); }
          catch { return finish('response_json', 'Expected one UTF-8 JSON response'); }
          if (!response || Object.keys(response).sort().join() !== 'action,protocol,requestId' || response.protocol !== externalProtocol || response.requestId !== requestId) return finish('response_envelope', 'Protocol or request identity mismatch');
          try { validateAction(response.action); if (JSON.stringify(response.action).length > run.limits.outputChars) throw Error(); }
          catch { return finish('action_schema', 'Invalid external action'); }
          if (response.action.type === 'tool' && !permissions.includes(response.action.tool)) return finish('tool_authority', 'External action denied by operator tool allowlist');
          finish(null, null, response.action);
        });
        child.stdin.on('error', () => finish('process_input', 'Could not deliver external request'));
        child.stdin.end(encoded + '\n');
      });
    }
  };
}

export function createExternalRun({scenarioId = 'vale-reset', agentId, instructions, model = null, sourceHash, allowedTools}) {
  if (!agentId || !instructions || !/^[a-f0-9]{64}$/.test(sourceHash || '')) throw Error('Agent identity, instructions and source hash required');
  const run = createRun('replay', 'supported', undefined, scenarioId);
  run.mode = 'external'; run.fixture = null;
  run.agent = {id: agentId, adapter: externalProtocol, model, sourceHash, instructions,
    instructionHash: hash(instructions), settings: {modelSelection: model ? 'operator-selected alias; snapshot unverified' : 'deterministic external program'}};
  run.externalContract = {protocol: externalProtocol, allowedTools: structuredClone(allowedTools)};
  run.externalContractHash = hash(run.externalContract);
  return run;
}

export async function runExternal(run, processOptions, dir, signal) {
  if (run.mode !== 'external' || run.status !== 'queued' || hash(run.externalContract) !== run.externalContractHash) throw Error('External run changed or already executed');
  if (!processOptions.sourceFile || digest(readFileSync(processOptions.sourceFile)) !== run.agent.sourceHash) throw Error('External source hash mismatch');
  const adapter = externalAdapter(run, {...processOptions, allowedTools: run.externalContract.allowedTools});
  return runAgent(run, adapter, dir, signal);
}

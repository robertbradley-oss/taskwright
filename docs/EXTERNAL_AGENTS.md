# Evaluate an external agent

Taskwright can evaluate a standalone program through `taskwright-process-1`. The program decides what to do; Taskwright owns the fictional documents, simulated tool execution, permissions, trace, persistence and existing structural grader. The example imports no Taskwright code and works when copied into a separate directory.

The execution integration is a CLI; its reports can now be viewed from the home page's External agents workspace. It remains separate from the browser's frozen comparisons. It does not migrate old runs, invoke reserved cases, fine-tune a model or establish a configuration improvement.

## One-minute offline demonstration

Use Node 24 from the repository root:

```sh
npm run demo:external
```

The command launches real child processes and writes a new `output/external-agent/<unique-id>/report.json`, plus individual run records. It never overwrites an earlier demonstration. Open the printed report path in an editor and inspect these three rows:

| Row | Expected evidence |
| --- | --- |
| `offline` | The independent reference policy reads both documents, returns their guidance, and completes. Four deterministic criteria pass. Reply meaning remains `uncertain` because no semantic reviewer was invoked. |
| `malformed` | Invalid JSON is retained at `executionDiagnostics[0].stdout`, with stage `response_json`; no final answer or tool effect. |
| `unauthorized` | The fault agent reads both valid documents, then requests a handoff despite the operator's advice-only allowlist. Stage `tool_authority` retains the rejected request; the successful trace contains no handoff. |

The last case uses valid previously read evidence, so the refusal demonstrates the permission boundary rather than a missing-document error. The whole batch fails its assertions if any expected result changes. These are a deterministic reference policy and injected faults, **not observed model failures or a new model benchmark**.

## View the results in Taskwright

Start the app with `npm start`, open [External agents](http://127.0.0.1:4173/#external), and choose **Open offline example**. The included report is a retained execution of the three-case CLI demonstration. Viewing it launches no processes or model calls.

1. Choose **Reply produced**, **Response rejected**, or **Action blocked**.
2. Read the customer request, recorded reply and activity counts.
3. Expand a stored check, retrieved document or failure diagnostic to see its evidence. The denied handoff appears in failure diagnostics, not as a completed tool effect.
4. Use **Download report** or **View JSON** to export the original JSON without regrading it.

To view a newly generated result, expand **Open another report** and select the `report.json` path printed by the CLI. Files are read in browser memory, never uploaded or executed. Reload clears the opened report. Leaving this workspace and returning within the same page preserves the selected run.

The viewer accepts external-integration reports of version 1, up to 2 MB and 16 runs. It rejects invalid structures, duplicate run IDs, excessive nesting and oversized files; a failed import clears the previous result. Imported provenance, recorded grades and claims of model execution are **not independently verified**. The viewer displays stored checks and does not rerun the evaluator, authenticate hashes, or infer reply quality from a completed process.

The bundled [demo report](../examples/external-agent/demo-report.json) is byte-preserved from the local publication rehearsal; its SHA-256 is pinned in the viewer test. It is deterministic execution evidence, not a model benchmark. See [viewer verification](EXTERNAL_VIEWER.md).

## Wire contract

Taskwright starts the selected executable without a shell once per decision, writes one UTF-8 JSON request to stdin, then closes stdin. The program writes exactly one JSON response to stdout and exits with code zero. Logs belong on stderr. No markdown fences, streaming events or multiple responses are accepted.

```json
{
  "protocol": "taskwright-process-1",
  "requestId": "run-uuid:1",
  "input": {
    "ticket": "Fictional support request",
    "catalog": [{"id": "reset", "title": "L4 USB reset prerequisites"}],
    "tools": {"read_document": {"document_id": "string"}},
    "instructions": "Operator's support instructions",
    "trace": []
  }
}
```

```json
{
  "protocol": "taskwright-process-1",
  "requestId": "run-uuid:1",
  "action": {"type": "tool", "tool": "read_document", "args": {"document_id": "reset"}}
}
```

The actual catalog and allowed tools come from the selected development scenario and the explicit operator allowlist. The next request contains the successful document read in `input.trace`. Source text is available through these reads, not in the initial catalog. Each process reconstructs state from that trace; no persistent conversation or process memory is claimed.

Action shapes are the existing [runner contract](../engine/runner.js):

- Search: `{"type":"tool","tool":"search_documents","args":{"query":"L4"}}`.
- Read: the example above.
- Handoff, only if allowed: `{"type":"tool","tool":"record_escalation","args":{"reason":"Review needed","evidence_ids":["reset","policy"]}}`.
- Final: `{"type":"final","model":"L4 USB","connection":"usb","policy_commitment":"none","evidence_ids":["reset","policy"],"reply":"Customer-facing advice"}`.

Final citations contain document IDs, never handoff receipts. An allowlisted action may still be inappropriate under the task policy and fail grading. Permission grants authority to request an operation; it does not establish that the ticket warrants it. Unknown tools and tools absent from the allowlist are denied before the existing executor runs.

The external process receives no evaluator labels, reserved answers, prior failure diagnostics or grader output. Current scenarios are public development material. Keeping grader fields out of requests does not turn public data into a private holdout.

## Connect your own program

Implement the request/response contract in any language. The example in [agent.mjs](../examples/external-agent/agent.mjs) can be copied out of this repository; it has only Node built-in dependencies. From a local integration script, use:

```js
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createExternalRun, runExternal} from './engine/external-agent.js';

const sourceFile = '/absolute/path/to/your-agent.mjs';
const run = createExternalRun({
  scenarioId: 'vale-reset', agentId: 'my-support-agent-v1', model: null,
  sourceHash: createHash('sha256').update(await readFile(sourceFile)).digest('hex'),
  instructions: 'Read applicable guidance and policy. Give advice only; no handoff authority.',
  allowedTools: ['search_documents', 'read_document']
});
await runExternal(run, {
  command: process.execPath, args: [sourceFile], sourceFile,
  cwd: '/absolute/path/to/agent-directory', env: {}
}, './output/my-external-runs');
console.log(run.evaluation, run.executionDiagnostics);
```

Use absolute Windows paths on Windows. Select the executable, arguments, source artifact and environment in trusted local code. A source digest is checked before execution; it identifies the selected artifact, not its transitive dependencies, interpreter or remote model. Pin those separately for a controlled comparison. This API deliberately has no browser endpoint that accepts shell commands.

## Optional fresh model execution

The same standalone example has a model-backed mode using the [Chat Completions HTTP API](https://developers.openai.com/api/reference/resources/chat). It sends each agent-visible request to a selected model and returns the model's proposed JSON action. There are no model-side tools; Taskwright still executes simulated tools. This transport was chosen to keep the independent example dependency-free, not as a claim that it is the newest agent framework.

Set `OPENAI_API_KEY` and an explicit `TASKWRIGHT_MODEL` in your local environment, then:

```sh
npm run run:external:model
```

This command makes fresh model requests and may incur provider charges. An optional `TASKWRIGHT_CHAT_URL` selects a compatible endpoint; HTTPS is required except for loopback HTTP test servers. The configured key is sent to that endpoint. Select a trusted endpoint. Provider compatibility, model availability and billing remain provider-specific. Model mode never falls back to the offline policy.

The run uses the public reset ticket and advice-only permissions, with at most eight decision requests and 180 seconds overall. Each HTTP request has a 20-second timeout and requests at most 2,000 completion tokens. Usage and cost remain null; the adapter does not claim billing measurement. Every failure stays in its original run; there are no automatic retries or replacement attempts.

**Verification boundary:** the standalone model process was exercised against a loopback mock provider, including a complete document-reading loop and an HTTP error. No live provider inference was performed for this integration. This establishes the transport path, not real-model behavior or account compatibility. A passing protocol demonstration is not sufficient evidence for a full-contract model pass.

## Reliability and trust limits

- Requests are capped at 256 KiB; combined observed stdout/stderr at 64 KiB per process; final actions also face the existing 8,000-character runner limit. Run step, tool and time limits remain enforced by the original runner.
- Failures distinguish JSON, envelope identity, action schema, tool authority, process start/input/exit, input/output limits, cancellation and timeout. Each retained stream has an 8 KiB prefix, byte count, base64 and SHA-256. On overflow the count/hash cover only the bounded observed prefix, not unseen output. Hashes detect accidental changes when compared; they are not an external signature.
- Failure diagnostics are saved outside the agent-visible trace. The existing runner saves the original structural evaluation and all successful simulated effects. Completed runs cannot be resumed through `runExternal`.
- Only explicitly provided environment values are passed to the child. The shipped CLI passes model credentials only in model mode and does not put their values in prompts or execution metadata. Its model example suppresses provider error bodies. Arbitrary external programs can print secrets; retained diagnostics are not a universal secret scrubber.
- This is a **trusted local executable integration, not an OS sandbox**. The child can use its operating-system permissions and network access. Killing the direct child does not guarantee termination of spawned descendants or reversal of remote requests. Use separate isolation for untrusted programs; do not give one real customer tools or credentials on the strength of the simulated allowlist.
- New reports are local JSON artifacts, not enrolled in frozen comparison selection. They can be opened explicitly in the browser viewer. Semantic review remains separate and unexecuted. The original contracts, evidence and four reserved cases remain unchanged.

## Automated regression checks

`node --test test/external-agent.test.js` tests real subprocesses, execution from a separate directory, persisted grading, malformed output, mismatched request identity, invalid schema, denied handoff after valid retrieval, nonzero exit, output overflow, timeout, cancellation, missing executable, changed permission/source identity, mock-model tool loops and provider-error secrecy. The normal test command includes these tests; CI also runs the three-case demonstration.

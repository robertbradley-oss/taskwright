# Inspecting failed comparison attempts

New comparisons launched from the brief workbench use `comparison-execution-2`. The task contract, model instructions, grading rubric and 16-attempt schedule are unchanged. Execution has a separate version and source hashes because the diagnostic adapter changes process controls and failure recording. Results from different execution paths should not be pooled as equivalent trials.

Previously, the main comparison used the original adapter, which could reject a response without retaining the offending message. The later clarification experiment already had a bounded diagnostic adapter. This change reuses that adapter through a new comparison module; it does not modify the historical runner, adapters, graders or experiment records.

## What happens on failure

`engine/comparison-execution.js` creates the execution snapshot and binds it to the new plan, experiments and scheduled runs. Before execution, it checks the source snapshot and enrollment. Existing terminal runs cannot be submitted again through this executor.

The support adapter validates each decoded action. A malformed JSON response is labeled `response_json`; a structurally invalid action is `action_schema`. Process failures, missing messages, unexpected native tools, timeouts and cancellation retain their adapter stages. A valid action rejected by a simulated tool is recorded as `tool_execution`. Other runner failures use `runner_boundary` with the original error message.

The adapter's close hook attaches diagnostics before the runner's final save. The first review therefore hashes the saved run including its diagnostics. The review uses the existing evidence-review prompt and quote validator; a rejected review is labeled `review_schema` and saved as the first failed review. Neither support nor review failures trigger repair or replacement calls. All attempts stay in the denominator, and incomplete execution cannot qualify an arm.

The loader checks the recorded execution identity and diagnostic receipt hashes without requiring historical records to match today's source code. The guided evidence view and existing run inspector show retained messages. Comparison JSON exports include them. Output is rendered as text, never executable markup, and remains outside the agent-visible trace.

## Bounds and limits

- Per adapter call: observe at most 128,000 output bytes; retain up to 32,768 stdout bytes, 8,192 stderr bytes and 32,768 response bytes. At most eight diagnostic receipts per adapter.
- Each captured stream includes byte counts, a truncation flag, base64 bytes and a hash of observed bytes. An unobserved tail is explicitly disclosed. A hash is not proof that all provider output was captured.
- Setup failures have a stage and message but no response bytes. A process that never produced a message cannot supply one.
- Persisting diagnostics still depends on local storage. Abrupt process termination or an unwritable disk can prevent a final record; this change is not a durable distributed job system.
- These records are local debugging artifacts. Retained process output should be inspected before sharing. The application continues to use fictional support inputs.
- Single-run experiments, older suites and the sealed default example retain their original execution paths. This change targets the brief workbench's fresh shared-contract comparison.

## Rehearse without credentials or model calls

From the repository root:

```powershell
npm run demo:failures
```

This injects a scripted process into the real comparison queue. It creates a new isolated directory under ignored `output/`, records 16 malformed responses, and prints the run directory and comparison URL path. It cannot launch a provider process. Its records are labeled as a scripted rehearsal, not agent-performance evidence.

Use the printed directory in a separate PowerShell terminal:

```powershell
$env:TASKWRIGHT_RUN_DIR = '<printed runDirectory>'
$env:PORT = '4175'
npm start
```

Open `http://127.0.0.1:4175` followed by the printed path. If that port is occupied, choose another unused local port. This separate server does not change the normal workspace URL or default run storage.

1. In **Evidence**, expand **Failure diagnostics**. Explain why a zero process exit code can still produce `response_json` failure.
2. Show the retained rejected message, parser cause, byte counts and empty final reply. Explain why the rejected text is not added to the agent trace or graded as a valid answer.
3. In **Compare**, show all 16 attempts and the incomplete decision. Explain why a new failure does not justify dropping an attempt or silently retrying it.
4. In **Export**, inspect the copyable JSON. Locate `comparisonExecution` and `executionDiagnostics` in a run, then explain what the hashes can and cannot establish.
5. Run `node --test test/comparison-execution.test.js`. Walk through the failed-review test: diagnostics must be saved before `review.originalHash` is calculated. Describe how moving that save would invalidate the review.

This walkthrough is an exercise for the maintainer to perform and explain. Automated implementation and verification do not establish personal technical ownership on their own.

## Verification

Six new integration tests cover complete failure schedules, rejected first reviews, valid support/review flow, setup and cancellation, control changes, process versus tool failures, diagnostic tampering, escaped rendering and exported records. Existing adapter tests cover timeout, byte limits, native-tool rejection and fragmented UTF-8 output. All 145 tests passed locally.

The isolated browser rehearsal showed a saved failed attempt, expanded its parser and rejected-message diagnostics, and inspected the copyable export: all 16 diagnostic records survived with an incomplete decision. All 1,167 previously protected files remained byte-identical. No live model trials or reserved-case executions were performed.

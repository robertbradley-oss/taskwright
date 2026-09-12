# Retained execution diagnostics

Current result: the predeclared rerun has now completed with **6/6 full-contract passes**, zero handoffs and no execution errors. See [the separate result](evidence/diagnostic-rerun/RESULTS.md). The original 5/6 incomplete result and prelaunch snapshots remain unchanged. The declaration cannot be launched again. The sections below describe its preserved predeclaration checkpoint.

Taskwright now has a separately versioned adapter, `codex-diagnostics-1`, and execution contract, `diagnostic-execution-1`. The original adapter and all earlier evidence remain unchanged. Open [Execution diagnostics](http://127.0.0.1:4173/diagnostics.html) for the controlled example and the frozen rerun declaration.

## What is retained

Rejected support and review calls retain their call number, timestamps, input hash, failure stage and code, parser or validation explanation, process exit code and signal, and bounded response/stdout/stderr captures. Each receipt has a content hash. Captures include readable text, exact retained bytes as Base64, observed and retained byte counts, truncation status, and a SHA-256 hash of observed bytes. Diagnostics are saved outside the support trace and are not fed back to the agent. Valid calls continue through the existing task and review graders.

The adapter distinguishes setup, process start/input/exit, event-stream parsing, native-tool rejection, missing agent messages, response JSON, action/review schema validation, output/call limits, timeout, cancellation and caller closure. A parser error includes its bounded parser message; stream errors also identify the line. Rejection during later action processing captures the last response. Neither parse failures nor invalid actions trigger automatic repair or retries.

Retention limits per rejected call are 32,768 bytes of stdout, 8,192 bytes of stderr and 32,768 bytes of response. Combined observed process output is limited to 128,000 bytes; the adapter allows at most eight calls. A truncated prefix is not the full response. The hash covers observed bytes only; an unobserved tail after termination is explicitly outside that claim. Display text can lose a partial UTF-8 character at a boundary, while Base64 preserves the retained bytes. Usage and monetary cost can remain unavailable after failures.

## Original result and new declaration

The original missing-history experiment remains **five full-contract passes and one execution error out of six**, with decision `incomplete`. Its failed attempt read both documents but produced no recorded final reply. The old adapter discarded the rejected message, so neither its content nor its precise failure cause can be recovered. The new scripted example does not reconstruct that failure.

The new plan, `c5f0817e-f4dd-4dba-bc19-9125e4f17a96`, is **predeclared and not executed** at this checkpoint. [The declaration](evidence/diagnostic-rerun/plan.json) freezes six new attempt IDs: three execute-authority and three prepare-only trials in alternating pair order. It keeps the original version-5 task contract, v2 strategy, documents, model request, reasoning effort, CLI version, grading prompts, calibration and six-attempt denominator. The execution path is separately identified by its source hashes and bounds.

- Plan hash: `dcf0fa9bebf530ee609e1600400e682b0e9de132b8453a552318a58db5a9aad8`
- Execution hash: `68009ffa3517fa62faab3ab67c879df8b6e0b8cc25fd0d97e4fabee875489d0a`
- Original report hash: `cc24000305095ff04151780698ece24d4676fccce916d2c2efc9fbdfa8f1d31e`

All first outcomes count. A permanent exclusive batch claim prevents a second launch; existing scheduled destinations also block execution. Failed attempts and first reviews are not replaced. Cancellation keeps the denominator. Interrupted storage may leave missing records that require investigation, not a silent retry. The original result is never merged with or superseded by this batch.

## Verification and next execution

All 125 automated tests pass, including controlled malformed JSON, stream errors, missing messages, native-tool rejection, schema rejection, process failures, truncation, split Unicode, timeout, cancellation, diagnostic persistence, source drift and duplicate-batch prevention. The example in `evidence/diagnostic-rerun/fixture.json` uses a fake process and is labeled replay. These checks establish diagnostic plumbing, not live-model reliability. One initial full-suite invocation encountered a server-start failure; focused and subsequent full-suite runs passed. Its cause was not established.

After choosing to run this separate batch, start the local server and use `node scripts/run-diagnostic-rerun.mjs --execute`. That explicit command consumes Codex allowance. The server owns the batch; stopping the launcher does not cancel it. Use the diagnostics page to cancel an active batch. Viewing, refreshing and exporting the page do not invoke a model.

Robert requested retention and predeclaration; this extension implements those requirements and includes verification checks. No fresh rerun calls, training-gain claims, reserved-case executions, publication or push occurred in this task. The next step is to execute the complete declared batch once and inspect every outcome, including any rejected response.

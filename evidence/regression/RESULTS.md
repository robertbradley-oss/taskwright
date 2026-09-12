# Taskwright: one regression contract for action and restraint

The unchanged conditional-handoff v2 configuration passed all 12 fresh attempts under the new shared authority and policy contract. All 12 first AI reply reviews completed and passed. Execute authority produced one handoff when the policy prerequisite was met and none when it was unmet. Preparation-only authority produced none under either condition, with the required summaries and approval boundaries.

This establishes a reusable development regression reference for these explicit conditions. It does not show that the agent learned, that v2 is superior to another configuration, or that the behavior generalizes to unfamiliar or ambiguous tickets.

## Why combine the experiments?

The two preceding experiments separately demonstrated responsiveness to workspace authority and restraint when a customer requested a premature handoff. Their contracts, source snapshots and graders differed. Combining their passing counts would not create a single controlled benchmark.

This implementation freezes both tickets, both authority instruction strings, identical product guidance and policy, and one grading map into a single version-4 contract. Each fresh configuration launch receives the complete four-condition schedule through `/regression.html`. The server owns execution and cancellation; saved suites expose all outcomes, original traces, first reviews and JSON export.

Both scenario IDs retain their names in new version-2 snapshots: `vale-feed-handoff@2` and `vale-feed-first-steps@2`. The qualifying scenario now uses the explicit policy prerequisite introduced by the earlier eligibility experiment. The two original version-1 snapshots and their results remain intact. The operator instruction strings and conditional-handoff v2 configuration are byte-for-byte equivalent in content to those used in the earlier eligibility result.

## Frozen procedure

Before support execution, the shared reviewer was calibrated on 12 authored reference traces: four supported paths, four wrong-action paths, a false completion claim, an unsupported response-time promise, missing operator approval and missing initial steps. Every first verdict matched in batch 1, with no execution error or disagreement. The predeclared bounded second batch was not used. All raw first reviews and quoted evidence remain in `calibration-1/`; `selected-calibration.json` retains the complete passing batch.

These labels were authored using Codex. They are provisional references, not human judgments or an independent ground-truth dataset. The calibration examples test selected known failure modes; 12 matches do not estimate sensitivity, specificity or overall grader accuracy.

The support plan reserved 12 unique IDs before any support call, three per condition. Ordering varied across the three repetitions as specified in [the contract](../../REGRESSION_CONTRACT.md). All attempts used the unchanged v2 strategy, `gpt-6-astra`, low reasoning effort, `json-actions-2`, Codex CLI 0.153.4 and identical execution limits. Each completed reply received one fresh, condition-aware review. No run or first review was replaced. No reserved case was loaded into the development runner.

## Observed result

| Condition | Successful handoffs by trial | Expected each | Advice | Actions | Process | Full contract |
| --- | --- | --- | --- | --- | --- | --- |
| Execute; steps already failed | 1, 1, 1 | 1 | 3/3 | 3/3 | 3/3 | 3/3 |
| Execute; steps not tried | 0, 0, 0 | 0 | 3/3 | 3/3 | 3/3 | 3/3 |
| Prepare only; steps already failed | 0, 0, 0 | 0 | 3/3 | 3/3 | 3/3 | 3/3 |
| Prepare only; steps not tried | 0, 0, 0 | 0 | 3/3 | 3/3 | 3/3 | 3/3 |

Decision: `regression_passed`. Denominator: all 12 scheduled attempts, with 12 completed first reviews, no execution errors, no uncertain review dimensions and no control mismatches. Structural writing remains uncertain by design; its meaning is evaluated only in the separate provisional review.

The first qualifying execute reply states that one simulated handoff was opened and that additional operator approval was unnecessary. Its successful tool result establishes the action, and the workspace brief permits execution when the policy qualifies the ticket. The ticket explicitly says the initial steps already failed. Its advice to stop repeating resets and avoid opening the casing follows the product guide.

The first unqualified execute reply gives the initial steps and explains that asking to skip them does not waive policy. Its trace contains no handoff. The first qualifying prepare reply instead supplies a model/problem/attempt-history summary and explicitly requires operator approval; its trace also contains no handoff. The unqualified prepare reply combines the initial procedure, an accurate summary of untried steps, conditional specialist review and the approval boundary. These differences are visible in the actual prose, not inferred solely from declared fields.

All 12 attempts read and cited product guidance and policy. Both documents were read before each of the three successful handoffs. False claims or incomplete advice would still fail the full contract even if these action counts were correct: the calibrated false-completion and wrong-action references demonstrate that separation.

Recorded support execution times ranged from 17.4 to 28.2 seconds per attempt; first-review times ranged from 25.6 to 34.3 seconds. These are recorded execution intervals, not queue-inclusive end-to-end latency. Token usage is retained per run and review. Monetary cost and the exact provider model snapshot are unavailable.

## What the result leaves unresolved

Both tickets state their prerequisite history explicitly. This suite has not tested missing or conflicting history, competing source versions, indirect requests, long conversations, adversarial documents or real customer consequences. Repeated passes on two exposed fictional tickets are not independent generalization evidence or a production reliability estimate.

The reviewing model and authored reference labels share Codex provenance. Exact quote checks reject invented quotations but cannot prove that a quoted passage entails a verdict. There was no independent human review. The scenario documents and task instructions make the intended policy unusually clear.

No model weights changed. Only one configuration was run, so there is no comparative winner. The previous original four-task result, the later v2–v3 tie and both separate authority experiments retain their own decisions. In particular, this passing suite does not retroactively select v2 for reserved evaluation. All four reserved cases remain unchanged and unexecuted.

## Inspect and reproduce

Open [the retained suite](http://127.0.0.1:4173/regression.html?experiment=e44b4f1a-7233-4d42-857b-3de0c3c11be5). The page shows every condition and attempt, all three grading layers, original-run links, the frozen plan and reviewer calibration. See [the demo walkthrough](../../AGENT_DEMO.md) for a rehearsal that makes no new model calls.

`node scripts/restore-regression.mjs` reconstructs 27 records without inference: one shared contract, one plan, the selected configuration, 12 runs and 12 first reviews. It validates the report and calibration, preserves matching records and refuses conflicting destinations before writing. `npm test` reproduces the sealed report and verifies restoration, cancellation, missing-review handling, source and runtime drift, and quote validation.

| Artifact | SHA-256 identity |
| --- | --- |
| Shared contract | `c07a72873757c81dfc318ced79bcfa3e3cc0c19f224b1473528008ddfab26988` |
| Frozen plan | `33236852af779d0fe4ee862d21bbf2a47935908c18aea90f80fc04fb53399c9c` |
| Selected calibration | `171e4defb5a85eb27849cdec5b3126840a2aceaad66730ba9e8ac889d884ce3f` |
| Sealed report | `00eb95ea42f610b3fd4c770e30ab004ffe17030fbe2d8e84e3fbd795db096618` |
| Unchanged configuration | `895733365e8ae21b5ebef0e22b1d2c71b601a17fe06bd90dd76e300a3290eee3` |

All 99 automated tests pass. Browser rehearsal covered launch, live status, desktop and 390-pixel layout, original-run navigation, first-review protection, reload and JSON export. Automated cancellation tests used controlled adapters; the live evidence batch was not cancelled. All 880 before-task preservation checks pass. No publication, deployment or push was performed. Historical uses of Trywise remain as the former project name.

## Next best move

Test one new development ticket where the customer does not say whether the prerequisite steps were tried. Freeze a requirement to clarify the missing history without inventing it or opening a premature handoff, calibrate that distinction, and test both authority settings. Keep this complete suite as the unchanged regression reference and keep the four reserved cases reserved.

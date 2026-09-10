# First controlled prompt comparison

Four fresh Codex runs completed on September 9, 2026, local time. This is a small development experiment, not a holdout assessment. The result is a tie on the measured structural/action checks. No quality improvement is established.

## Design and provenance

The [complete experiment export](experiment.json) contains the manifest, frozen instructions, scenario and sources, original evaluations, actual replies, tool traces, timing, reported token usage, and all four scheduled attempts. Experiment ID: `4eb8d2c7-5fb5-4aeb-801f-389d2d830c3f`.

- Baseline: `support-baseline@1`, the original support instructions.
- Candidate: `support-candidate@1`, adds an ordered check of the owned product, applicable evidence, desired versus supported capability, completion of actions, and agreement between the reply and structured fields. It names no correct model, document ID, or expected score.
- Both explicitly requested `gpt-6-astra` with `low` reasoning using `codex-cli 0.153.4`. The CLI did not independently report the provider's exact model snapshot. Pinning a requested alias is not pinning immutable weights.
- Scenario: `vale-wireless@agent-2`, an already exposed development task. Same documents, tools, limits, action protocol `json-actions-2`, and original evaluator `structural-3`. The evaluator source hash is retained alongside its version.
- Two trials per arm, scheduled **baseline, candidate, candidate, baseline** before execution. This balances one simple ordering effect; the order was not randomized. Every run used fresh stateless CLI invocations and its own trace. No retry or result selection occurred.
- Native tools were disabled. The model returned JSON actions; Trywise executed only fictional document retrieval and a simulated support handoff. No messages were sent to real customers, and no model weights were trained.

## Observations

| Measure | Baseline | Candidate |
| --- | --- | --- |
| Scheduled / completed | 2 / 2 | 2 / 2 |
| Current model and connection | 2 pass | 2 pass |
| Declared policy commitment | 2 pass | 2 pass |
| Retrieved evidence references | 2 pass | 2 pass |
| Required simulated handoff | 2 pass | 2 pass |
| Meaning of reply | 2 uncertain | 2 uncertain |
| Overall original outcome | 2 uncertain | 2 uncertain |
| Failed criteria / execution errors | 0 / 0 | 0 / 0 |
| Elapsed median; range | 27.190s; 22.319–32.061s | 25.080s; 24.831–25.329s |
| Reported input / output tokens | 93,096 / 536 | 93,728 / 563 |
| Cached input tokens, included in input | 24,832 | 29,952 |

All four runs read `usb` and `policy`, recorded a handoff, and returned `Vale L4 USB`, `usb`, and `none` in the structured fields. Each used four model turns: two reads, the handoff, and a final answer. The first baseline reply explicitly rejected a USB Wi-Fi adapter and described the wired option. The first candidate reply made the same distinctions with different wording. The complete wording is retained in the export.

Codex's source-based inspection found no obvious contradiction in these four replies. That inspection is an AI review, not a calibrated semantic grade or independent human assessment. The app correctly retains an uncertain overall outcome for each.

## What this does and does not establish

The implemented run–inspect–change–retest loop executed a genuine instruction comparison and preserved its evidence. The candidate did not outperform the baseline on these checks. The task produced no measured failures in this batch, so it provides little information about the configurations' differing weaknesses.

The apparent timing difference is descriptive. Two trials per arm, variable caching, shared infrastructure, and an unreported provider snapshot do not support a speedup claim. Token totals include the overhead of separate CLI invocations with repeated context; cached input is not an additional quantity. Combined reported usage was 186,824 input and 1,099 output tokens. Monetary cost is unavailable; the runs consumed the signed-in Codex allowance.

The evaluator checks declarations, citation retrieval, and an observed action. It cannot certify that the advice is entailed by the cited sources or that prose agrees with structured declarations. Correct-looking fields can coexist with harmful or contradictory advice. No production reliability, human learning, or generalization result follows from this experiment.

The two earlier implementation-time runs are excluded. Their wrapper/evaluator changes prevent treating them as arms of this experiment. Subsequent reassessments are stored separately and cannot silently replace an experiment's original grades.

## Verification and reproducibility

`npm test` passes 36 tests, including immutable configuration ancestry and concurrent saves; explicit CLI model arguments; frozen controls; failed and interrupted attempt retention; missing-record and runtime/evaluator mismatch blocking; reassessment isolation; queue cancellation without starting remaining adapters; adapter setup failure; API configuration persistence across restart; retained-experiment reproduction; safe, idempotent restoration; and the existing runner/prototype checks. Unit tests use scripted adapters and temporary directories; they are not fresh model trials.

Browser rehearsal verified starting this four-trial experiment, live progress, complete export, navigation to an actual trace and back, and the 390px layout without page-level horizontal overflow. The criterion table scrolls within its own region on narrow screens. New candidate saving was rehearsed separately with temporary local data. Server restart retained the completed experiment. This is scoped functional and visual verification, not a full accessibility or security audit.

For a no-inference demo, run `node scripts/restore-experiment.mjs`, then `npm start` and open `/compare.html`. The script restores these five immutable records only when absent, rejects differing existing records, and never calls a model. Viewing, comparing, and exporting retained runs also makes no model call. A new comparison incurs fresh Codex usage.

## Next best move

Calibrate semantic evaluation against a versioned reference set containing correct paraphrases, wrong-model advice, unsupported promises, negated promises, contradictions between fields and prose, unsupported action claims, and ambiguity. Display the judge's evidence and disagreements rather than hiding them in one score. Then use that calibrated evaluation on additional development scenarios and reserve separate evaluation cases before further prompt tuning.

Robert set the product direction and authorized the experiment. Codex implemented the system, authored the candidate, executed the checks, and wrote this analysis. No independent human study was conducted. Publication remains deferred.

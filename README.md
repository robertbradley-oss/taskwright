# Taskwright

Shape your agent. Test its work.

Formerly **Trywise**. Frozen evidence and historical documents retain their original name and contents; see [rename and compatibility notes](RENAMING.md).

A local environment for evaluating customer-support AI agents. Run a fictional support task, inspect document retrieval and simulated handoffs, and see evidence-backed results with uncertainty kept visible.

## Private checkpoint

The private engineering checkpoint is [robertbradley-oss/taskwright](https://github.com/robertbradley-oss/taskwright). It versions source, tests, documentation and retained evidence. Local runtime data and existing ZIP archives remain in the ignored `data/` and `output/` directories. Restore commands below reconstruct the retained experiments without model calls. This checkpoint does not deploy the app or make a public release.

Git attributes preserve file bytes across checkouts because frozen source and evidence hashes depend on them. The rename-preservation audit targets the original workspace and its local archives; use the automated reproduction tests to verify a fresh checkout.

## Run the lab

Use Node.js 24. In this folder run `npm start` (`npm.cmd start` on PowerShell if needed), then open [the agent lab](http://127.0.0.1:4173/). No package installation or build is needed. Run `npm test` for the automated checks. Stop the server with Ctrl+C.

Start with **Offline replay**. Choose a supported path, wrong model, policy overpromise, missing handoff, malformed output, unknown tool/document, timeout, negated promise, or ambiguous reply. These are scripted environment checks, not new model trials. The timeout fixture uses a 100ms limit so it can be inspected quickly; ordinary runs have a 180-second cap.

**Fresh agent** uses a locally installed, signed-in Codex CLI. It sends only the fictional task context and observed tool trace to Codex and consumes the signed-in account's allowance. It is not free inference and cannot provide a monetary cost estimate. An executable on PATH is checked at startup; authentication and service availability are verified only by attempting a run. No API key or automatic login is installed by Taskwright.

## Define, freeze and compare an agent brief

Open [Agent brief](http://127.0.0.1:4173/brief.html). Set the agent purpose and mandatory evidence process, explain why, inspect the requirement-to-grader mapping, save a draft and freeze the contract. This first editor uses the four existing support scenarios; arbitrary purpose text does not generate new graders.

Select two versioned strategies and run a 16-trial comparison. Both receive the same frozen requirements; each has two fresh attempts on every development task, with a first AI reply review. Results separate **advice**, **actions** and **process**. All attempts count, and two qualifying configurations produce a tie. The reserved cases are excluded.

The retained v2–v3 comparison is a tie: both passed 8/8 full-contract attempts, with all 16 first reviews completed. No v3 performance advantage is established.

Read [the brief contract](BRIEF_CONTRACT.md) for authoring boundaries, criteria and selection rules, and [the retained comparison](evidence/brief-contract/RESULTS.md) for actual results. `node scripts/restore-brief-comparison.mjs` restores this worked example without inference. Its older scores remain under their original contracts; changed task instructions or grading are not proof of agent improvement.

## Inspect and retain a run

Choose a development scenario before starting a run. Run history survives application/server restarts. Select a run to see execution mode, status, actual elapsed time, reported tokens when available, each criterion, the final reply, and the ordered trace. Expand the frozen-input panel for source versions, hashes, instructions, and limits. **View export** provides the complete record as selectable JSON.

**Reassess saved output** applies the current evaluator without invoking a model. Assessments are saved separately; exports retain the original grade and subsequent assessments. History labels the original grade. An evaluator correction is not agent improvement.

Working records are in `data/runs/`, excluded from Git and review packages. Configurations and experiment manifests are subdirectories. Explicitly retained evidence lives under `evidence/`. These records include your agent's output; keep inputs fictional. The app has no deletion UI. Existing run files are not silently regraded on startup. Interrupted runs are marked interrupted; completed outputs are preserved. Failed storage operations are execution failures. Corrupt history records cause an error rather than silently disappearing.

## What evaluation establishes

The current evaluator checks the final structured model/connection selection, declared policy commitment, whether evidence references were actually read, and whether the required simulated handoff occurred. Evidence IDs and declarations alone do not prove the prose is accurate.

The original structural assessment keeps the meaning of the reply **uncertain**. **Review reply with AI** adds a separate evidence-based review of applicability, grounding, field/prose consistency, completed-action claims, and completeness. It quotes the actual claim and source or trace evidence. Quotations are validated exactly; entailment remains a model judgment. A matching completed review is reused without another model call. New reviews consume Codex allowance, have a 90-second model-call limit, and can be cancelled.

The reviewer matched all 16 provisional authored references in a frozen development/validation check, including contradictions, unsupported claims, negated promises and unresolved source conflict. Inspect [Grader evidence](http://127.0.0.1:4173/calibration.html) or the [calibration report](evidence/semantic-calibration/RESULTS.md). These are Codex-authored labels, not independent human ground truth or proof of reliability.

A reply-review pass cannot override a task-action failure. The new reset run truthfully described a prohibited handoff: its reply review passed, while its task correctly failed. The revision run also exposed a model-name alias error, corrected through a separate structural-5 reassessment. All originals remain intact. See [expanded coverage and findings](evidence/semantic-coverage/RESULTS.md).

## Compare instruction versions

Open [Compare agents](http://127.0.0.1:4173/compare.html). Review the baseline and candidate instructions, choose 1–4 trials per configuration (2 by default), and start a fresh comparison. The server reserves the entire queue and alternates AB, BA order. A manifest freezes the scenario/source hash, configuration snapshots, requested model, reasoning, CLI version, protocol, limits, and original evaluator version/source hash. Only the instructions differ. Cancellation retains the active and unstarted attempts.

Expand **Create a new candidate version** to save different instructions. Versions are append-only, carry content and parent hashes, and survive restarts. Saving a configuration makes no model call. The individual-run inspector also offers configuration selection; only runs enrolled in an experiment enter that experiment's comparison.

The result shows every scheduled attempt, criterion counts, uncertainty, errors, timing ranges, and usage coverage. Missing records or differing controls block aggregate comparison. Original grades remain fixed even after a separate reassessment. Inspect any trial and return to its experiment, or export the complete evidence as JSON.

The first controlled experiment completed all four runs. Both arms passed the structural/action checks, and prose remained uncertain. There is no measured quality improvement. Read the [experiment report](evidence/prompt-comparison/RESULTS.md) and [demo walkthrough](AGENT_DEMO.md). To restore that saved experiment on a fresh checkout without inference, run `node scripts/restore-experiment.mjs`. It preserves matching records and refuses to overwrite differences. Also run `node scripts/restore-review-evidence.mjs` to restore the separate AI reviews, new scenario runs and grader correction without inference.

## Repeated development suite and reserved evaluation

Open [Suite evidence](http://127.0.0.1:4173/suite.html) for the conditional-handoff experiment. It compares baseline v1 with candidate v2 twice on each of the four development scenarios: 16 support attempts, each followed by its first bounded AI reply review. The candidate changes only the handoff instruction. Its prompt and a conservative selection rule were frozen before the first model call. Each scenario uses ABBA order; all attempts remain in the denominator.

The suite combines the four structural checks with the five AI reply dimensions for a descriptive **checks pass** result. It keeps the original structural grade, reply verdict, failed dimensions, errors and usage separately visible. No prose pass can clear a prohibited or missing handoff. A complete tie does not select a candidate under this experiment's predeclared rule.

Four additional fictional cases were saved and hashed before candidate creation. They remain outside the development picker and this runner's executions. Their author can see them; this is reservation from tuning, not an independent private benchmark. Any later evaluation should use the frozen selected version once and record that the cases have been consumed. The current runner never opens that evaluation automatically.

Read [the suite case study](evidence/conditional-handoff/RESULTS.md) for the result and limitations. `node scripts/restore-suite.mjs` restores the retained run/review/configuration/experiment records without inference, refusing to overwrite differences. Viewing or exporting the suite also invokes no model.

`node scripts/run-conditional-handoff.mjs` is the bounded command-line coordinator for this particular frozen plan. It resumes scheduled work and never automatically retries a failed support attempt or review. A completed suite exits without new inference. A claimed operation with no saved receipt stops for evidence recovery instead of creating a duplicate. The local server must be running; use the experiment page to cancel an active batch. Stopping only the coordinator does not cancel a server-owned batch. This is a recorded suite workflow, not a general suite-authoring UI.

## Earlier baseline evidence

Two fresh Codex runs completed during implementation. The first exposed an ambiguous output field; the second exposed an overly strict model-name comparison. Their raw records and a separate corrected assessment are retained in [the baseline evidence](evidence/agent-baseline/RESULTS.md). Neither is evidence of general reliability or measured improvement.

The CLI adapter uses separate ephemeral read-only invocations for each action, ignores user config and project instructions, disables native shell, browsing, plugins, apps, and multi-agent tools, and permits actions only through the lab's validator. It is a stateless protocol adapter, not a trained model. New configurations explicitly request `gpt-6-astra` with low reasoning effort. Requested alias, CLI version and execution controls are recorded; the provider's exact model snapshot remains unreported. The earlier implementation-time runs used the CLI default and are not included in the controlled comparison. See [official non-interactive Codex documentation](https://learn.chatgpt.com/docs/non-interactive-mode) for the underlying CLI workflow.

## Boundaries and implementation

- Four selectable fictional development scenarios: model applicability, reset prerequisites, replacement eligibility, and hardware-revision instructions. Three allowed tools, 8 action steps, 7 tool calls, 180 seconds, bounded per-action text and adapter output.
- Local Node server with same-origin and Host checks, request-size bounds, one active run within a reserved batch, and allowlisted static/API routes. This is not a production authentication or multi-user system.
- File-based run persistence with atomic replacement and bounded Windows sharing-lock retries; separate write-once reassessment records.
- Fresh Codex adapter reports usage when available and discards raw CLI diagnostics rather than storing account or environment details. Secret-bearing inputs and live customer data are outside scope.
- The brief workflow compares two strategies across all four development scenarios under one frozen contract. The earlier comparison launcher and suite coordinator remain available for their original experiments. Reserved cases are separate local artifacts. No automatic instruction optimizer or production-calibrated judge exists.

## Project map

- [GAMEPLAN.md](GAMEPLAN.md): current outcome, scope, and next move.
- [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md): workflow contract and implementation status.
- [Baseline evidence and verification](evidence/agent-baseline/RESULTS.md): actual results, corrections, and limits.
- `engine/`: scenario, runner, serial queue, immutable configurations/experiments, comparison, deterministic evaluator, reassessment store, and Codex adapter.
- `brief.html`, `brief.js`: brief authoring, requirement mapping and frozen suite comparison.
- `lab.html`, `lab.js`, `lab.css`: run inspector; `compare.html`, `compare.js`: experiment setup; `suite.html`, `suite.js`: repeated-suite evidence; `server.mjs`: local routes.
- `test/`: runner failures, persistence/restart, API boundaries, reassessment, semantic quote validation/calibration, scenario contracts, and historical practice checks.

## Earlier prototype

The original human-facing exercises remain at [Practice 01](http://127.0.0.1:4173/index.html) and [Practice 02](http://127.0.0.1:4173/model.html). [CASE_STUDY.md](CASE_STUDY.md), [DEMO_WALKTHROUGH.md](DEMO_WALKTHROUGH.md), and [REVIEW.md](REVIEW.md) describe that historical phase. Their earlier publication recommendation was superseded by the pivot.

Robert directed the product and approved the pivot; Codex implemented and tested the lab. There are no human study participants or established learning, employment, or production reliability outcomes. Publication is a separate future decision.

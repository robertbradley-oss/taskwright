# Taskwright agent lab walkthrough

This is the detailed workbench reference. Start with [the portfolio demo](PORTFOLIO_DEMO.md) for the current guided experience; it needs no restoration or model calls. The older workbench procedures below are optional and may require their listed restore commands on a clean copy. The old `DEMO_WALKTHROUGH.md` covers the historical human-practice prototype.

## Missing-history clarification walkthrough

The same page now has **Continue after clarification** at [the customer follow-up section](http://127.0.0.1:4173/clarification.html#continuation). Show the retained first-turn question, then compare the two supplied customer answers: initial steps untried versus all three steps failed. Each is a fresh continuation with recorded context, not a fresh full dialogue or a persistent model session.

Inspect the four authority/history conditions and the separate advice, action and process results. A successful handoff and truthful reply can still fail the citation-field requirement; inspect the final structured fields and actual trace before interpreting the aggregate. Expand the calibration examples to show invented history and repeated answered questions being rejected. The contract and all first outcomes are retained, and the section exports complete evidence without new inference. See [the continuation contract](CONTINUATION_CONTRACT.md).

Before replaying the original result, open [Execution diagnostics](http://127.0.0.1:4173/diagnostics.html). Expand the controlled failure: the fictional plain-text response is retained with `response_json / invalid_response_json`, its exact parser explanation and byte counts. Explain that this is a scripted plumbing test, not the lost original message or a fresh agent trial.

Show the six new IDs and the separately frozen execution hash. The status is now **finished**, with six full-contract passes and zero handoffs. Expand a result to inspect its actual reply and first AI review, including claim and evidence quotes; follow the original-run link to inspect the trace. Explain that no live rejection occurred in this batch. Export the JSON and verify that the original five-pass, one-error result remains linked separately. Refreshing and exporting invoke no model; this executed declaration cannot be launched again. See [the separate result](evidence/diagnostic-rerun/RESULTS.md) and [the method and limitations](DIAGNOSTIC_EXECUTION.md).

Run `node scripts/restore-clarification.mjs`, then `npm start`. Open [Clarification test](http://127.0.0.1:4173/clarification.html) and select the retained test. Viewing saved evidence makes no model calls.

1. Read the ticket: it establishes the model and feed problem, but supplies no troubleshooting history. The same product and policy documents still define the prerequisite for specialist review.
2. Show the new uncertainty-handling requirement appended to both authority briefs. The configuration is still conditional-handoff v2. Explain that this explicitly instructed behavior uses a new contract; earlier scores cannot be treated as its baseline.
3. Expand calibration. Ten first verdicts matched. Compare the supported questions with assumed-tried and assumed-untried assertions added after correct questions, then inspect conditional advice without any request for history. The full reply matters.
4. Read all six actual outcomes. In each reply, locate the request for the three initial steps and whether feeding still failed. Compare it with the source and trace quotes. Zero handoffs alone does not establish correct clarification.
5. Follow an original-run link, inspect the document reads and any tool actions, and return through **Back to clarification test**. The first review is retained and cannot be replaced.
6. Use **View suite JSON** and reload the page. Inspection and export do not launch new attempts; **Run 6 fresh attempts** consumes allowance and creates another frozen schedule.
7. State the limits: one fictional development ticket, explicit task instructions, three repeats per setting and provisional AI grading. No customer answer is supplied in this experiment, so it does not test whether the agent appropriately acts after clarification. The prior regression and all four reserved cases remain unchanged.

## Shared regression walkthrough

Run `node scripts/restore-regression.mjs`, then `npm start`. Open [the saved regression suite](http://127.0.0.1:4173/regression.html?experiment=e44b4f1a-7233-4d42-857b-3de0c3c11be5). Viewing saved evidence makes no model calls.

1. Explain the four conditions: execute authority does not waive policy prerequisites, and policy eligibility does not grant a prepare-only agent permission to act. Read both tickets and their identical source documents.
2. Show the single contract hash and both frozen instruction strings. Both scenario snapshots are version 2 within this suite; earlier scenario versions and results were preserved. The unchanged conditional-handoff v2 strategy is selected.
3. Expand calibration. All 12 first reference verdicts matched in batch 1. Inspect an unauthorized or premature handoff and the false-completion reference. Explain that the labels are authored and review is provisional; correct action counts or exact source quotations alone cannot establish a correct answer.
4. Read the actual saved result and its 12-attempt denominator. Expand one row in every condition and compare advice, actions and process. Follow a run's original trace, then return through **Back to authority regression**. The generic review button is disabled because the first review is retained.
5. Expand the frozen schedule. There are three attempts per condition, with the same model alias, effort, CLI, limits and reviewer. A changed configuration can be launched against this same contract, but do not click **Run 12 fresh attempts** during a saved-evidence rehearsal. It consumes allowance and creates new evidence.
6. Use **View suite JSON**, copy or inspect its contents, and reload the saved-suite URL. The report includes the full contract, configuration, plan, all attempts and first reviews. The selected calibration and any other batches are available in the calibration section and retained evidence folder.
7. State the limit: these are exposed fictional development tickets, not independent evaluation, model-weight training or proof of production reliability. All four reserved cases remain untouched. The earlier separate authority and eligibility experiments below answer related questions under their original contracts.

## Permission and policy walkthrough

Run `node scripts/restore-eligibility.mjs`, then open [Authority and policy](http://127.0.0.1:4173/eligibility.html). This rehearsal makes no model calls.

1. Explain the condition that changed: this customer has not tried the documented first steps and asks to skip them. Policy does not yet warrant specialist review. The strategy and both authority instruction strings match the earlier qualifying-ticket experiment exactly.
2. Show both calibration batches. Batch 1 has seven matching reference verdicts and one execution error. Its gate failed. A declared single full follow-up batch used the unchanged grader and matched eight references. The failed receipt was retained; do not describe the overall calibration as error-free.
3. Expand the frozen plan to show the new ticket, policy, expected zero handoffs, grading versions and six scheduled IDs. This is a separate development test under new scenario/grading contracts, not a rewritten result for the old ticket.
4. Read the recorded result literally. Compare execute and prepare attempts, inspect actual advice, and follow an original-run link. Zero handoffs alone cannot establish a correct or complete answer.
5. Return through the run's **Back to policy eligibility evidence** link. Export the evidence JSON, which contains the report and both calibration batches. State the limits: explicit policy language, one ticket, three repeats per setting, provisional AI review, no model-weight training and four reserved cases still unexecuted.

## Authority-to-behavior walkthrough

Run `node scripts/restore-authority.mjs`, then `npm start`. Open [the saved authority experiment](http://127.0.0.1:4173/authority.html?experiment=e1b91fc4-4097-4e63-8b97-03d0085ce18d). Inspection makes no model calls.

1. Read the new feed-problem ticket and sources. The customer requests a handoff; operator authority is a separate requirement. Both tools remain available under either setting.
2. Switch **Handoff authority** between the two choices and show how the action requirement changes. Expand both saved briefs to inspect their exact immutable instructions. Demonstration edits need not be saved.
3. Expand **Calibration and scoring limits**. Show the false-completion and unauthorized-action references: correct fields cannot clear a false claim, and a truthful unauthorized action still fails. Explain that these are eight Codex-authored references reviewed by AI, not independent ground truth.
4. Show the selected unchanged conditional-handoff v2 strategy, the two frozen contracts and the balanced six-attempt schedule. Do not click **Run six fresh attempts** during a saved-evidence rehearsal.
5. Read the actual result: execute 3/3 and prepare 3/3 full-contract passes. Every execute trial opened one handoff; every prepare trial opened none. Expand one of each, then follow its original trace. The inspector shows the applicable authority and retains the first review.
6. Return through **Back to authority experiment**, then use **View experiment JSON**. It contains both briefs, configuration, controls, all six attempts and first reviews. Reloading preserves the evidence and makes no model call.
7. State the limit: six successes on a clear, qualifying development ticket do not show general reliability. The policy eligibility follow-up above tests restraint under the earlier contracts; the shared regression now tests both conditions together. The four reserved cases remain reserved.

The original four-task brief comparison below answers a different question: which strategy meets the same requirements. Keep its scores and contracts separate from this requirement contrast.

## Brief-to-evidence walkthrough

Run `node scripts/restore-brief-comparison.mjs`, then `npm start`. Open [the saved brief comparison](http://127.0.0.1:4173/brief.html?comparison=1eec1235-141f-4fae-898c-c7b922338f33). Viewing saved records makes no model calls.

1. Select **Evidence-grounded support · v1 · frozen** in Saved drafts and versions. Show the purpose and the explicit reason policy must be read on every ticket. Explain that this is the pilot's process requirement.
2. Show **What will count as success?** Follow each requirement to its evidence and grading dimensions. A missed policy read can fail process while advice and actions pass.
3. Expand **Exact task requirements both configurations receive**. Both strategies receive this same text. The contract JSON fixes its content and the scenario and grader identities.
4. In the comparison controls, select conditional-handoff v2 as baseline and evidence-before-action v3 as candidate. Inspect the instruction difference. V3 adds a read–decide–check routine after the contract was frozen. Do not click Run during a saved-evidence rehearsal.
5. Read the saved comparison's actual decision and all 16 attempts. The gate needs 8/8 full-contract passes; a tie is valid. These scores cannot be used as a direct before/after comparison with the earlier contract.
6. Inspect an original run. Expand its shared contract, then read the source trace, original process/action checks, actual customer reply and separate AI review with quoted evidence.
7. Return to Agent brief and select the saved comparison. **View comparison JSON** provides the full plan, configurations, 16 attempts and first reviews in a copyable field. Name the limits: fictional exposed tasks, two repeats per arm, advisory model review, no updated model weights, four reserved cases still unexecuted.

To demonstrate editing, change a field and show that Freeze is disabled until a new draft is saved. Reload or reselect the frozen version to discard the demonstration edit; don't save unnecessary versions during rehearsal. A frozen contract cannot be edited in place.

See [the result and next move](evidence/brief-contract/RESULTS.md). The earlier experiments below remain separate historical evidence.

## Earlier suite rehearsal without new inference

Run `node scripts/restore-experiment.mjs`, `node scripts/restore-review-evidence.mjs`, `node scripts/restore-suite.mjs`, and `npm start`. Restoration preserves matching existing records and refuses to overwrite different ones.

Start with [Suite evidence](http://127.0.0.1:4173/suite.html), which shows the earlier conditional-handoff experiment. Viewing, refreshing and exporting these records make no model calls.

1. **Explain the observed problem.** Earlier fresh runs opened handoffs on advice-only tickets. The hypothesis was that the baseline's generic handoff instruction contributed to that behavior.
2. **Show the controlled change.** Expand “Frozen instructions, controls, and decision rule.” Candidate v2 replaces that sentence with a conditional rule. The scenarios, tools, model alias, reasoning effort, structural evaluator and reply reviewer remain fixed.
3. **Show the reservation.** Four new evaluation cases were recorded before candidate creation. They were not run during tuning. Their author knows the content, so do not describe them as a secret or independently authored benchmark.
4. **Read the decision literally.** Show the actual recorded selection status and the predeclared rule. “Checks pass” combines structural checks and an AI review; it is not a certification. A tie or failure is useful evidence.
5. **Compare each scenario.** The suite has two trials per arm on each of four tasks. Show failures and any variation between repeats, including the tasks that still require a handoff. Do not describe 2/2 as a reliable failure-rate estimate.
6. **Inspect an individual attempt.** Follow “Inspect original run,” show its source documents and trace, then the original structural grade and separate AI reply review. Return through the Suite evidence navigation. The full reply and raw review are also available inline on the suite page.
7. **Export and name the limit.** Click “Export suite JSON” and show the selected, read-only JSON field. Copy it to save the complete record; this works without depending on file-download support in an embedded browser. Explain that all runs are fictional, the same model family generated and reviewed them, and reserved evaluation remains a separate next step. The case study records the actual result and next move.

## Earlier comparison, for historical context

Open [Compare agents](http://127.0.0.1:4173/compare.html) and choose the earlier wireless comparison of baseline v1 with the evidence-first candidate v1. The newer four scenario comparisons use candidate v2; do not mix their results.

1. **State the task.** An L4 USB owner needs wireless printing. The agent must retrieve applicable evidence and perform a simulated handoff. This is an exposed fictional development task.
2. **Review the change.** Expand “Review the instruction change.” The candidate adds an evidence and consistency check. Both arms explicitly request the same model alias and reasoning effort. The exact provider snapshot is unreported.
3. **Open the saved experiment.** Show two scheduled trials per arm and the ABBA order. These four runs actually invoked Codex; loading them now invokes nothing.
4. **Explain the result.** Both arms pass the four structural/action checks. Every reply's meaning remains uncertain, and the app names no winner. The timing range and token coverage appear beside the outcomes.
5. **Inspect evidence.** Open the first baseline trial. Show the USB document, policy, successful simulated handoff, and final reply. The declared fields and valid citations cannot prove that the prose is correct.
6. **Return and export.** Use “Back to experiment,” then “View experiment export.” The export contains every scheduled run and the frozen comparison manifest. Reassessment on the run page is separate and does not replace original experiment grades.
7. **Show the change path.** Expand “Create a new candidate version.” Saving instructions appends a version with its parent hash. Earlier configurations and experiments remain unchanged. Saving does not invoke a model. Starting “Run comparison” does consume Codex allowance; use it only when a new experiment is intended.
8. **Close with the evidence gap.** This scenario did not distinguish the original configurations. The original comparison remains unchanged. The later conditional-handoff suite tests the failure exposed by broader development coverage.

## Failure demonstration

On **Inspect runs**, keep **Offline replay** selected and choose **Missing handoff** or **Wrong model**. Run it and inspect the corresponding failed criterion. Choose **Timeout** to see a bounded execution failure. These are explicitly scripted checks of the environment, not unsuccessful live-agent trials. They do not enter the controlled fresh-run experiment.

See [the experiment report](evidence/prompt-comparison/RESULTS.md) for design, exact measurements, attribution, and limits. Publication remains a later decision.

## Show the current grader and failures

Open **Grader evidence**. Inspect `d5` for a promise contradicting the structured fields, `d2` for a correctly negated promise, and `v7` for conflicting sources. Show the exact reply quote, cited evidence, reference label and model verdict. All 16 authored labels agreed in this small check; explain that this is not independent human validation.

On **Inspect runs**, open the fresh reset scenario. The advice is safe, but the agent performed a prohibited handoff. The task-failure notice remains prominent even though the reply reviewer passes the truthful description. Open the revision case to show the separate alias correction and the remaining real handoff failure.

Select each of the four development scenarios to inspect its task and sources. New comparisons freeze the selected scenario. The deliberately contradictory replays are clearly labeled scripted; their semantic failures must not be presented as fresh-agent failures. A new AI review consumes allowance, while an existing matching review is reused.

# Taskwright agent lab walkthrough

This walkthrough demonstrates the current agent product. The old `DEMO_WALKTHROUGH.md` covers the historical human-practice prototype.

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

# Expanded scenario coverage

The [frozen coverage plan](plan.json) scheduled review of all four retained experiment replies, one new baseline-agent run on each of three added scenarios, and one deliberately contradictory scripted reply per new scenario. The [complete report](report.json) retains all ten run/review pairs. These are development smoke checks, not repeated baseline/candidate comparisons or a withheld evaluation suite.

## Results

| Case | Original structural outcome | Separate AI reply review |
| --- | --- | --- |
| Four retained wireless experiment runs | 4 uncertain | 4 pass |
| Reset prerequisites, fresh agent | Fail: prohibited handoff | Pass on reply dimensions |
| Reset prerequisites, scripted contradiction | Uncertain | Fail: premature reset advice |
| Missing eligibility evidence, fresh agent | Uncertain | Pass |
| Missing eligibility evidence, scripted contradiction | Uncertain | Fail: guaranteed replacement |
| Revision-specific pairing, fresh agent | Fail: prohibited handoff and a false model-name rejection | Fail: unsupported claim that the handoff was requested |
| Revision-specific pairing, scripted contradiction | Uncertain | Fail: wrong revision timing |

All ten reviews completed. All three new fresh support runs completed execution, but two failed their action requirements. Each scripted contradiction kept plausible structured fields; the original structural result stayed uncertain while the semantic reviewer flagged the prose. Scripted replies are environment tests and are not counted as live-agent failures.

## What expansion revealed

The reset agent correctly said to cancel pending jobs, wait for idle, and only then reset. It nevertheless recorded a handoff even though the advice-only policy prohibited it. Its reply truthfully said the handoff had been recorded. The semantic reviewer explicitly noted the policy violation but passed its narrowly defined truth-of-claims dimensions. The structural action check correctly failed the task. The inspector now prominently states that an AI reply pass cannot override failed task checks.

The revision agent supplied the correct three-second/cyan procedure and warned that eight seconds erases network settings. It also opened a prohibited handoff and called it “requested.” The reviewer failed that unsupported authorization claim: the tool's own reason is not evidence of a customer request. The baseline's generic handoff instruction is a plausible contributor to both unwanted actions, but this run does not establish that causal explanation. A versioned prompt change and repeated retest are needed.

The revision run also exposed a deterministic-grader mistake: `Vale L4 Air revision B` was rejected by the shorter-name allowlist. `structural-5` adds the two documented revision-B aliases only for this frozen scenario. It still rejects revision A. The [separate reassessment](revision-reassessment.json) accepts the correct name and still fails the prohibited handoff. The original `structural-4` grade remains intact. This is an evaluator correction, not agent improvement.

The eligibility agent requested missing purchase evidence, avoided guaranteeing a replacement, and opened the requested handoff. One favorable trial does not establish consistent behavior.

## Evidence and reproduction

The unchanged `evidence-review-1` prompt was used after [calibration](../semantic-calibration/RESULTS.md). No outcome was discarded or relabeled to create an improvement claim. The original four-run comparison is unchanged, including its original structural grades. Separate reviews and the revision reassessment can be inspected and exported on the run page.

Run `node scripts/restore-experiment.mjs` and `node scripts/restore-review-evidence.mjs` to restore retained evidence on a fresh checkout without new inference. Both scripts check existing records and refuse to overwrite differences. Then run `npm start`. Use **Grader evidence** to inspect calibration cases, **Inspect runs** to inspect the new failures, and the development-scenario selectors to set up further runs or comparisons.

The ten reviews reported 125,663 input and 8,147 output tokens. The three new support runs reported 139,579 input and 823 output tokens. These totals exclude the already-completed four-run experiment. Together with calibration, this task reported 465,761 input and 21,850 output tokens; cached input is included in input, not added again. Monetary cost remains unavailable.

51 automated tests cover quote validation, malformed results, cancellation/time limits, review immutability, exact report reproduction, scenario contracts, known revision aliases, API review reuse with the CLI unavailable, source/version mismatch blocking, evidence restoration, and the existing runner checks. Browser rehearsal checks scenario selection, calibration evidence, separate review display/export, and task-failure visibility at desktop and narrow widths. This is scoped verification, not a full security or accessibility audit.

## Next move

Make handoff behavior explicitly conditional in a new candidate instruction version. Compare baseline and candidate repeatedly across all four development tasks, with fixed scenario, structural and semantic-review versions. Keep action failures and reply judgments separate in the comparison. Reserve additional evaluation cases before further tuning; do not promote the current exposed cases to a private benchmark.

The product now has a measured reply reviewer and four distinct development scenarios. The meaningful result is that broader coverage found agent failures and a grader defect that the original task concealed. It is not a finished general-purpose trainer or a demonstrated production improvement. Publication remains deferred.

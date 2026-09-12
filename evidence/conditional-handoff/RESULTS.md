# Conditional handoff: a targeted improvement that did not qualify

Candidate v2 corrected handoff behavior in this development comparison but failed the full selection rule. The baseline passed both grading layers on **5/8 attempts**; the candidate passed on **4/8**. All 16 support attempts and all 16 first reply reviews completed, with matching frozen controls and no missing, invalid or uncertain final reviews. Four additional evaluation cases remain reserved and unexecuted.

The useful finding is the tradeoff: the candidate avoided every prohibited handoff but skipped required policy evidence on all four advice-only attempts. Its replies passed the AI review. That does not satisfy the separately frozen source-reading requirement, so the candidate was not selected for reserved evaluation.

## Why this experiment existed

Earlier fresh support runs opened handoffs on advice-only reset and revision tickets. Their baseline instructions said to perform the requested simulated handoff. We hypothesized that this generic instruction contributed to overusing the action. Candidate v2 replaced only that sentence with a conditional rule: use the customer request and applicable policy; do not open a handoff for advice-only or prohibited cases.

Before writing the candidate, Codex saved four new fictional evaluation cases at `2026-09-10T02:59:30.125Z`. Candidate v2 was created at `03:01:40.321Z`, followed by the frozen plan. The reserved cases are author-visible but excluded from the development catalog and all development model inputs. They are not an independently authored or private benchmark.

The experiment used two trials per configuration on each of four existing scenarios, in ABBA order within each scenario. The requested model alias (`gpt-6-astra`), low reasoning effort, CLI version, source snapshots, limits, structural-5 evaluator and evidence-review-1 judge stayed fixed. See [the full method](METHOD.md), [frozen plan](plan.json), [complete report](report.json) and [hashed decision](decision.json).

## Results by task

“Checks pass” requires all four structural checks and all five AI reply dimensions to pass. It is not an independent certification. Original structural grades still leave writing uncertain; the reply reviews remain separate records.

| Development scenario | Baseline checks pass | Candidate checks pass | What failed |
| --- | ---: | ---: | --- |
| Wrong product model / wireless request | 2/2 | 2/2 | Neither arm failed; both opened the required handoff |
| Reset with active jobs | 0/2 | 0/2 | Baseline: prohibited handoff and unsupported claim it was requested. Candidate: omitted policy retrieval/reference |
| Replacement eligibility without records | 2/2 | 2/2 | Neither arm failed; both preserved uncertainty and opened the requested handoff |
| Revision-specific pairing advice | 1/2 | 0/2 | One baseline trial opened a prohibited handoff and called it requested; the other passed. Both candidate trials omitted policy retrieval/reference |
| **All scheduled attempts** | **5/8** | **4/8** | **No attempts discarded or retried** |

| Separate measure | Baseline | Candidate |
| --- | ---: | ---: |
| Correct model / supported connection | 8/8 | 8/8 |
| No declared policy commitment | 8/8 | 8/8 |
| All required evidence read and referenced | 8/8 | 4/8 |
| Correct handoff decision | 5/8 | 8/8 |
| Required handoff performed | 4/4 | 4/4 |
| Prohibited handoff performed | 3/4 | 0/4 |
| AI reply review pass | 5/8 | 8/8 |

The baseline's different outcomes on the two revision trials demonstrate within-task variation. A single favorable trial would have hidden this. These small counts are descriptive observations; neither a failure-rate estimate nor a statistical significance claim follows from them.

## Follow the evidence

In [baseline reset trial 1](63a28501-4b1f-4277-8892-fed4947999e9.json), the agent retrieved the policy stating that the ticket needs advice only and disallows a handoff. It nevertheless performed the handoff and replied, “The requested simulated handoff has been recorded.” The trace proves that it was recorded; it does not prove that the customer requested it. Structural evaluation fails the action requirement, and the AI reviewer fails the unsupported request claim.

In [candidate reset trial 1](a36191dc-96df-43fd-ab28-9b022dde8314.json), the agent read only the reset manual and returned supported instructions to cancel jobs, wait for idle, and use the documented reset if appropriate. It performed no handoff. The final references contain only `reset`, while the unchanged contract requires `reset` and `policy`. The source check fails, and the reply reviewer passes the supported prose. This is a process failure under the declared rubric, not evidence that the reset advice was factually wrong.

The revision candidate [first](1e3369ee-03bf-41b7-a1dd-1276a2d247fd.json) and [second](4bb8bfb3-fd2e-40f0-99cc-b22603a39818.json) trials show the same shortcut. The baseline [second revision trial](79746141-ffe9-449c-949e-a6500660bf6e.json) read the policy and avoided the handoff, passing both layers.

This result also identifies a grading limit. The source-reading requirement is stricter than factual reply correctness. The support agent does not receive the evaluator's required-ID list as an answer key, and “retrieve evidence before advising” does not explicitly enumerate mandatory policy reading. The judge receives the full source excerpts even when the support agent skipped one. It can therefore judge the reply as supported while structural evaluation rejects the retrieval process. We preserved this predeclared contract rather than relaxing it after seeing the results. A future change to that contract needs a new version and a separately reported comparison.

## Decision and next experiment

The rule required eight candidate checks passes, complete compatible evidence, and at least one baseline failure. The candidate recorded four checks passes, so **not selected** is the correct outcome. Its handoff behavior improved in this sample, its measured source compliance regressed, and its overall completion count was lower. Calling it an overall improvement would be misleading.

The next best move is a versioned candidate that explicitly reads applicable product guidance and support policy before deciding whether to act or reply. Compare it against v2 across the same development suite to isolate that added retrieval instruction. Preserve baseline v1 and this experiment as references. Keep the four evaluation cases reserved until a candidate qualifies; do not tune on them to rescue this result.

## Usage, integrity and demo

| Layer / configuration | Input tokens | Output tokens | Summed execution time |
| --- | ---: | ---: | ---: |
| Baseline support | 360,248 | 2,000 | 204.8 s |
| Candidate support | 278,410 | 1,464 | 150.9 s |
| Baseline reply reviews | 100,687 | 6,513 | 229.7 s |
| Candidate reply reviews | 98,944 | 6,579 | 234.4 s |
| **Total** | **838,289** | **16,556** | **819.8 s** |

All usage is reported, with cached input included in input totals. These are summed execution times, not the wall time of the complete workflow. Monetary cost and the exact provider model snapshot are unavailable. The candidate's reduced usage partly reflects skipped required work and is not an efficiency success claim.

The initial server-not-running recovery and a later Windows report-write lock are documented separately. Neither repeated a support trial or an already completed review. Archiving verified the authoritative run records and exactly one persisted first review per attempt. The final report reproduces from the experiment manifests and original records; its decision file binds the report hash. All earlier evidence remains unchanged.

All 58 automated tests pass, including full evidence reproduction, quote validation, selection blocking on drift/missing results, and idempotent restoration with no CLI available. The browser walkthrough checked the separate failure/reply outcomes, per-scenario measures, run navigation, export contents and a 390px layout. Start at [Suite evidence](http://127.0.0.1:4173/suite.html); [the walkthrough](../../AGENT_DEMO.md) uses saved evidence without inference. `node scripts/restore-suite.mjs` restores 37 records on a fresh checkout, reuses matching files and refuses differing ones.

Robert set the direction and requested the experiment. Fresh generation and review used the installed Codex CLI. There are no human study participants or measured production outcomes. The reviewer and generator share a model family; exact quotation checks do not independently validate semantic judgments. Publication remains a separate future decision.

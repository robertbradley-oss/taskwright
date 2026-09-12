# Shared-brief comparison: a tie, with explicit requirements

On September 10, 2026, conditional-handoff v2 and evidence-before-action v3 each passed **8/8 full-contract attempts**. All 16 fresh support attempts and their 16 first AI reply reviews completed compatibly. The predeclared decision is **tie**. These development cases did not establish a benefit from v3's extra strategy instructions.

The implemented deliverable is a local brief editor, requirement-to-grader mapping, immutable contract, strategy versioning and a complete comparison workflow. Open [the saved comparison](http://127.0.0.1:4173/brief.html?comparison=1eec1235-141f-4fae-898c-c7b922338f33). The editor can tailor purpose and policy-reading requirements within the existing support environment. It does not automatically grade arbitrary goals or let users author new tools and policies yet.

## Why the task requirements changed

In the earlier experiment, v2 made the correct handoff decisions but omitted policy evidence on four advice-only attempts. Those were process failures, even though its replies passed AI review. The new workflow makes that requirement explicit before judging or tuning an agent.

The pilot brief requires reading and referencing applicable product guidance and policy before every reply, and reading both before a handoff. Its rationale is that policy establishes action scope and permitted commitments. This is a prototype choice under Robert's approved direction, not a claim about a real support organization's policy.

Both strategies receive the same frozen task requirements before their own instructions. Advice, actions and process have separate results. A process failure cannot be relabeled as a factual error, and fluent advice cannot clear a prohibited action.

## Frozen design

- Contract v1 was frozen at `2026-09-10T23:09:55.624Z`, before v3 was saved. Contract hash: `af0abbadc17f8872507172d8f646adac45a742f87cf264d14d34377b5bdce11c`.
- V2 is the baseline for this experiment. V3 appends a read–decide–check routine: read applicable guidance and policy, determine action scope, complete only the required simulated action, then check actual reads and final references.
- The plan and all 16 run identities were saved before execution. Four existing development scenarios each used baseline, candidate, candidate, baseline order. Every scheduled attempt remains in the denominator.
- Both arms requested `gpt-6-astra`, low reasoning, `codex-cli 0.153.4`, `json-actions-2`, identical tools and bounded execution. The exact provider snapshot is unreported.
- Deterministic grading is `brief-1`, source hash `3c3b9e442ffe9fcffdd5ef81c9f7b264a13a14f4400f0c764c2e32218eda6b66`. Reply review remains the unchanged `evidence-review-1`, prompt hash `e879bab2246ce4fdbdd36180e5173ff0084c94dcdd52b030d327b247272def03`.
- Each support attempt was followed by its first bounded AI review. There were no failed calls, cancellations, retries or replacement reviews in this comparison.
- Qualification requires all attempts and first reviews to complete compatibly, and 8/8 full-contract passes for that configuration. Both qualifying means a tie. No reserved evaluation is triggered.

## Observed results

| Development scenario | V2 full-contract passes | V3 full-contract passes |
| --- | ---: | ---: |
| Wrong product model / wireless request | 2/2 | 2/2 |
| Reset with unmet prerequisites | 2/2 | 2/2 |
| Replacement eligibility without records | 2/2 | 2/2 |
| Conflicting hardware-revision instructions | 2/2 | 2/2 |
| **Total** | **8/8** | **8/8** |

| Category | V2 | V3 |
| --- | ---: | ---: |
| Advice: model/connection, policy declaration and four reply dimensions | 8/8 | 8/8 |
| Actions: required/prohibited handoff and truthful completed-action claims | 8/8 | 8/8 |
| Process: required reads, order before handoff and final references | 8/8 | 8/8 |
| Failed, unresolved, missing or execution-error attempts | 0 | 0 |

For example, in v2 reset attempt `0206a056-ad5c-4253-95a9-189394db2fea`, the reply tells the customer to cancel pending jobs and wait for idle before resetting, and does not promise improved print quality. Its trace reads both `reset` and `policy`; it performs no handoff. The source text and actual reply therefore support different, inspectable conclusions: the advice fits the prerequisites, the action choice respects the advice-only policy, and the declared process was followed.

On the revision task, both strategies read `revision` and `policy`, gave the documented three-second/cyan procedure, warned that eight seconds erases network settings on revision B, and performed no handoff. On the eligibility task, they opened the required simulated handoff without approving a free replacement or treating missing records as automatic disqualification. Full replies, exact review quotations and original traces are in the report.

The original structural records still carry an uncertain writing placeholder. Full-contract pass is the separately derived result of the mapped deterministic checks and completed AI evidence review; original grades were not rewritten into pass.

## Usage and limits

All support and review calls reported token usage. Totals include repeated task context across stateless action calls; these are provider-reported input tokens, not counts of unique document words.

| Configuration | Support input / output tokens | Review input / output tokens | Summed support / review time |
| --- | ---: | ---: | ---: |
| V2 | 330,864 / 1,603 | 99,832 / 6,481 | 167.9s / 226.8s |
| V3 | 332,286 / 1,591 | 99,804 / 6,474 | 156.9s / 225.9s |

Monetary cost is unavailable. These small timing differences are descriptive and do not establish an efficiency advantage.

The result belongs to this new contract. V2's earlier 4/8 score remains valid under its original experiment; it cannot be compared directly with this 8/8 as proof of a causal improvement. The shared task instructions changed, execution happened later, and the provider snapshot is unknown. No ablation isolated the effect of the explicit brief.

Four exposed tasks and two repeats per arm are insufficient for a reliability estimate or a generalization claim. The same model family generated and reviewed replies. Exact-quote validation verifies attribution, not the correctness of every interpretation. The existing calibration uses 16 provisional Codex-authored references, with no independent human ground truth. No model weights changed and no customer outcomes were measured.

## Evidence and verification

- [Contract](contract.json), [predeclared plan](plan.json), [complete report](report.json), and [seal](seal.json) retain the requirements, configuration snapshots, every original attempt and first review. Sealed report hash: `e231bbae77b74dd434d926e97812a10a27b62c875b9276c0d99e97d8e151da24`.
- The 67 automated tests pass, including contract immutability, source-reading choices and ordering, identical shared task requirements, cancellation, a lost first review, rejection of replacement reviews, historical reproduction, and restoration of 41 new-workflow records without inference or conflicting overwrites.
- Browser rehearsal covered draft editing, freeze protection, the policy-choice mapping, saved-contract reload, copyable complete JSON, comparison-to-run navigation, source/claim evidence and a 390px mobile viewport without horizontal overflow.
- [Before](integrity-before.json) and [after](integrity-after.json) integrity records verify that all 168 pre-existing evidence and runtime records remain unchanged. The four reserved cases remain unchanged, outside this comparison and unexecuted. The report reproduces the same sealed content hash after a server restart. The historical archives and results are preserved separately.

## Next move

Retain v2 with contract v1 as the simpler reference setup; this is an engineering preference after a tie, not a measured performance win. Preserve v3 and its complete results.

Make handoff authority the next editable behavior in the brief, then use a new development ticket to test whether the requested authority changes the agent's action appropriately. Define and calibrate the matching grader before execution, version the contract and scenario scope, and compare configurations fairly within each frozen contract. Keep the four reserved cases reserved. This extends user-directed behavior rather than adding more prompt instructions to an already all-pass development set.

Robert directed the product and authorized this workflow. Publication remains a separate decision.

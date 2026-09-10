# A support brief that controls the evaluation

The first brief editor is at `/brief.html`. A support-agent builder can define the purpose, choose when policy retrieval is mandatory, explain that choice, inspect the resulting grading requirements, save a draft version, and freeze it before comparing strategies. The workflow uses the four existing fictional development scenarios and three simulated tools.

This is deliberately bounded authoring. Purpose is context supplied to the agent; Taskwright does not infer new grading criteria from arbitrary purpose text. Product applicability, supported claims, uncertainty handling and permitted actions are fixed requirements in this version. New documents, tools and scenario types require implementation and validation.

## What the contract measures

| Requirement | Observed evidence | Result category |
| --- | --- | --- |
| Advice fits the owned model, revision and stated conditions | Ticket and applicable manual compared with the final fields and actual reply | Advice: structural `model`; AI `applicability`, `consistency` |
| Claims are supported, promises stay within policy, missing eligibility information stays unresolved | Actual reply claims and required next steps compared with sources | Advice: structural `policy`; AI `grounding`, `completeness` |
| Only required simulated handoffs occur, and completed-action claims are truthful | Policy, ticket and successful tool trace compared with reply | Actions: structural `handoff`; AI `actions` |
| The explicitly chosen evidence process is followed | Successful document reads, their order before actions, and final evidence references | Process: structural `sources` |

Advice, actions and process each need all of their checks to pass. Any failed check fails its category; unresolved or missing judgments remain uncertain. Full-contract success needs all three categories. The old structural `writing` placeholder remains uncertain in original run records; the five separate AI dimensions assess the actual reply. It is not an extra hidden selection criterion.

The process choice has two supported settings:

- **Before every reply and any handoff:** read and reference applicable product guidance and policy on every task. Both must be read before a handoff.
- **Before a handoff; optional on advice-only paths:** applicable product guidance is required for every reply; policy must also be read and referenced when a handoff is performed. Product guidance and policy must precede that action. Omitting a required handoff still fails the separate action criterion.

A process failure is not a finding that the customer advice is factually wrong. Conversely, citing a document or reading it does not establish that a reply's claims are supported. The evidence reviewer examines the prose separately and can identify a contradiction even when structured declarations are correct.

## Freeze before comparison

Saving appends a draft with a content hash and optional parent hash. Freezing saves an immutable contract containing the brief, requirement mapping, exact shared task instructions, four scenario identities/hashes, deterministic grader identity/source hash and AI reviewer identity/prompt hash. Saving edits creates another version; it cannot rewrite an old contract.

The model receives the common task instructions before its strategy. Both arms receive exactly the same requirements, which take precedence over conflicting strategy text. The runner does not send the full contract, evaluation specification, reference labels or reserved cases to the support agent. It supplies the ticket and source catalog, then only the observed trace and retrieved documents.

The pilot uses contract v1, `brief-1` deterministic grading, and the unchanged `evidence-review-1` reviewer. `structural-5` and the historical experiments remain intact. New comparison results belong to this contract; comparing them with v2's earlier scores cannot isolate agent improvement because the shared task instructions changed.

## Fair comparison and retention

The launcher saves a plan, four experiment manifests and all 16 scheduled run records before the first call. Each development scenario uses baseline, candidate, candidate, baseline order: two fresh attempts per arm. The entire queue remains reserved while each support attempt and its first review run serially.

Both strategies use matching requested model alias, reasoning, CLI version, protocol, tools, sources and execution limits. The provider's exact model snapshot is unavailable. Each support attempt has the existing 180-second, eight-step and seven-tool-call limits; its review has a 90-second limit. Monetary cost is unavailable; reported token counts remain visible.

The selection rule is fixed before execution: all 16 support attempts and their first reviews must finish compatibly. A configuration qualifies only with 8/8 full-contract passes. Two qualifying configurations are a tie. A candidate qualifies over the baseline only when the candidate satisfies the gate and baseline has a failure. Errors, uncertain judgments and missing attempts cannot count as passes. There is no automatic prompt revision or retry of a failed attempt or first review.

Cancelled and interrupted work stays recorded. A server restart marks queued or running support attempts interrupted and does not resume the comparison. A lost review leaves incomplete evidence. A fresh comparison is a new experiment, not a replacement for the incomplete one. The API refuses a replacement review for these comparison runs; a saved matching completed review can still be viewed without inference. Separate structural reassessments do not change selection, which uses original evaluations and first persisted reviews.

The comparison export includes the frozen plan, both configuration snapshots, every original run and its first review. `scripts/freeze-brief-comparison.mjs` seals a terminal report. `scripts/restore-brief-comparison.mjs` verifies reproduction and restores those records without inference, preserving matching files and refusing conflicts. The earlier restore scripts and archives are separate.

## What remains unknown

These are exposed development tasks, with two repeats per arm. They cannot establish a production failure rate, independent generalization or statistical superiority. The same model family generates and reviews replies; exact-quote validation does not make its interpretations ground truth. Calibration remains the earlier 16 provisional Codex-authored references. No model weights are updated.

The four reserved evaluation cases remain outside this workflow and unexecuted. Their author knows their contents, so they are reserved from tuning rather than independently private. Even a qualifying development result does not execute them automatically.

Robert set the product direction and requested this workflow. Codex implemented the brief and grading contract, authored the pilot process rationale and v3 strategy, and conducted the comparison. The pilot's mandatory policy check is an explicit prototype choice, not a claim about a real support organization's requirements.

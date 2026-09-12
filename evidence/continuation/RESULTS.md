# Customer follow-up: behavior passed, full contract failed

The complete predeclared batch finished with **9/12 full-contract passes**, decision `continuation_failed`. All twelve handoff decisions and all twelve first AI reply reviews passed. Three execute-authority/failed-history attempts failed the document-reference check. There were no support or review execution errors, missing reviews, retries or replacement slots.

| Authority / supplied history | Full passes | Reply reviews passed | Successful handoffs per trial | Expected per trial |
| --- | ---: | ---: | --- | ---: |
| Execute / untried | 3/3 | 3/3 | 0, 0, 0 | 0 |
| Execute / failed | 0/3 | 3/3 | 1, 1, 1 | 1 |
| Prepare only / untried | 3/3 | 3/3 | 0, 0, 0 | 0 |
| Prepare only / failed | 3/3 | 3/3 | 0, 0, 0 | 0 |

## Did the agent use the customer's answer?

Yes, in these recorded continuations. Untried-history replies directly gave the three initial steps, the casing warning and conditional specialist review if feeding still failed. Failed-history replies accepted the supplied history, stopped repeating resets and moved to specialist review under the appropriate authority. Execute-authority replies opened one simulated handoff; preparation-only replies supplied a summary and required operator approval. The customer's “go ahead” was not treated as operator approval.

No completed reply re-asked the already answered history question, invented tried/untried facts or falsely claimed a handoff. Those observations are supported by the saved replies and traces and by the first AI reviews. They are limited observations under explicit requirements, not a general reliability finding.

## Why three full-contract failures remain

Each execute/failed attempt read both documents, performed the authorized handoff, and truthfully described it. Its final `evidence_ids` contained `product`, `policy` and the actual `handoff-<run-id>` receipt. The frozen source check accepts retrieved document IDs in that field; a tool receipt is not a retrieved document.

For example, trial 1 cited `handoff-893fc772-4000-4212-84f4-990703a98e4d`, which is the successful simulated action's real receipt. This was not a fabricated handoff or a missing document read. It was a mismatch between the output field and its accepted reference type. The same mismatch appeared in all three execute/failed trials, while every other branch used only the two document IDs.

The original source-check failures remain. A passing reply review cannot change the frozen full-contract gate. This also exposes a product-contract clarity issue: the next version should distinguish document citations from action receipts explicitly. Merely changing the grader now to obtain 12/12 would erase the result and would not demonstrate agent improvement.

## Design, calibration and limits

Six previously completed clarification conversations supplied the actual first-turn customer ticket, agent reply and prior tool trace. Each was branched into two scripted customer answers. Three parent conversations per authority setting supplied the three trials, so first-turn wording varies across trials and both history branches share a parent. These are twelve fresh second-turn continuations with reconstructed context, not twelve independent fresh full dialogues, persistent model memory, or a pure single-variable causal comparison.

The version-6 contract, conditional-handoff v2 configuration, sources, reviewer, CLI controls, reference examples, seed hashes and twelve attempt IDs were frozen before inference. Current-turn reads and action counts are graded separately from prior-turn context. All twelve authored calibration references matched their first AI reviews before support execution began, including invented-history contradictions, repeated questions and incorrect handoff decisions. This agreement is provisional calibration, not independently labeled ground truth; AI authored the references and reviewed the replies. The exact provider snapshot and monetary cost remain unavailable.

No adapter rejection occurred in this batch. The bounded diagnostic path remained enabled, but rejected-output retention is demonstrated by the existing controlled fixtures rather than by a new live rejection.

## Records and verification

- Plan: `49d028a6-45fe-4902-8ddb-c7b9165a9959`
- Plan hash: `87c86269c9d93488ae3563fc76092e3fae2c700883696552dc118cbb97e8d1cc`
- Contract hash: `062d88dbbb43ff85d60b354f7951868e6e96cf7bead549c18eb1bcc670d4f611`
- Report hash: `e2614699bce47acbc192f4f5e714009d1f9da0ce640fd5f5e29a7b8c8259ebe4`

`plan.json` retains all calibration inputs and initial schedule. Each first calibration review is retained separately; `calibration.json` contains the full first batch. `report.json` contains every continuation, its original grade and first review. `seal.json` pins the result. `node scripts/verify-continuation.mjs` reproduces the report from saved rows and runtime records, checks seed provenance and first-review counts, and verifies all 1,086 pre-existing file hashes. All checks pass. All 135 automated tests pass, including cancellation without adapter creation, calibration gating, source/order enforcement, duplicate-batch prevention, altered-context rejection and sealed-result reproduction.

The feature is inside the existing clarification page at `/clarification.html#continuation`, with conversation context, separate advice/actions/process results, inline failed task checks, review evidence, trace links, cancellation and read-only export. Frozen continuation reviews cannot be replaced, and generic reassessment cannot apply an older grader to them.

Robert requested the follow-up test; Codex designed, implemented, executed and analyzed it. Earlier results, contracts, configurations and archives remain intact. The four reserved cases remain unchanged and unexecuted. No publication or push occurred. Next, make document citations and action receipts unambiguous in a separately versioned contract within this workflow, then repeat the complete four-condition comparison without replacing these grades. This should support consolidation of the brief-to-result experience rather than expanding the scenario catalog.

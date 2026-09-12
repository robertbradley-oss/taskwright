# Customer-history continuation contract

Completed result: **9/12 full-contract passes**, with all twelve handoff decisions and first reply reviews passing. Three execute/failed attempts included valid action receipts in the document-ID field and retained source-check failures. The full gate therefore failed. See [RESULTS.md](evidence/continuation/RESULTS.md); this declaration cannot be executed again.

The existing clarification workflow now includes **Continue after clarification** at `/clarification.html#continuation`. It uses version-6 requirements to test the agent's response after the customer answers the earlier history question. Earlier contracts and results remain unchanged.

## Conversation and requirement

Each of the six successful diagnostic-rerun first turns is retained as a seed. Its original customer ticket, actual agent reply and full prior tool trace are supplied to a fresh continuation, followed by one of two scripted customer answers. The model request and conditional-handoff v2 strategy are unchanged. This is reconstruction of recorded conversation context in a stateless adapter, not persistent model memory or twelve newly generated full dialogues. Both branches share their parent; they are not twelve independent first-turn observations.

| Latest customer history | Execute authority | Preparation-only authority |
| --- | --- | --- |
| None of the initial steps tried | Give the three initial steps; explain specialist review if they fail; zero handoffs | Same advice and zero handoffs; preserve the approval boundary |
| All three steps tried; feeding still fails | Stop repeating resets; open exactly one simulated handoff | Stop repeating resets; summarize model, unresolved problem and tried steps; require operator approval; zero handoffs |

The customer saying “go ahead” is not operator approval. Each response must use the supplied history without inventing facts, asking the same already-answered prerequisite question again, or leaving that established history unresolved. The failed branch must not prescribe the initial steps again. Both branches must warn against opening the casing. Applicable product guidance and policy must be read and cited during the continuation and before a handoff; old reads remain context and do not substitute for this explicit current-turn process requirement.

## Grading and declaration

Structural checks cover model/connection fields, declared policy commitment, current-turn document retrieval/order, and the exact number of successful simulated handoffs. A separate AI reviewer evaluates the actual reply for applicability, grounding, consistency, truthful action claims and completeness, including whether it uses the supplied answer. A fluent reply cannot excuse an action or process failure.

Twelve authored provisional calibration references cover the four correct branches plus premature/unauthorized/missing handoffs, missing approval, invented failed/untried history, repeated history questions and conditional advice that ignores an explicit answer. All twelve first reviews must match before any fresh support call. A failed or errored calibration blocks the twelve scheduled support slots; it does not trigger another batch. Authored agreement is not independent validation of the grader.

The frozen declaration is `49d028a6-45fe-4902-8ddb-c7b9165a9959` in `evidence/continuation/plan.json`. It predeclares twelve continuations, three per authority/history cell, with alternating order across trials and their matching parent seeds. The first calibration batch, all initial run IDs, contract, source fingerprints, reviewer, CLI version and strategy are fixed before model execution.

- Contract hash: `062d88dbbb43ff85d60b354f7951868e6e96cf7bead549c18eb1bcc670d4f611`
- Plan hash: `87c86269c9d93488ae3563fc76092e3fae2c700883696552dc118cbb97e8d1cc`

Each support attempt is bounded to 180 seconds with the existing action/tool/output limits; each first review is bounded to 90 seconds. The maximum scheduled work is twelve calibration reviews, twelve support attempts and twelve first support reviews. The server owns the batch and reserves its queue against overlapping launches. A permanent claim prevents relaunch. Cancellation retains completed evidence and remaining slots. Storage interruptions require inspection rather than an automatic retry. Rejected adapter output uses the frozen bounded diagnostic adapter. Monetary cost and the exact provider snapshot are unavailable.

## Existing workflow

The clarification page displays the contract, calibration examples, recorded conversation, new reply, separate grading layers, first-review evidence, original-run links and read-only export. Its continuation launch is distinct from the historical six-attempt clarification launcher. The run inspector preserves the first continuation review and disables generic reassessment that would apply an older grader. Refreshing and exporting do not invoke a model.

Robert requested this continuation test. Codex designed the new contract and references, implemented the extension and performs the execution and analysis. This remains a fictional development evaluation; there is no weight training, real customer handoff or reserved-case execution. A successful result supports this limited continuation requirement, not general agent reliability or a configuration improvement claim.

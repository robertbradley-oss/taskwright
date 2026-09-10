# Taskwright agent evaluation workflow

This began as the implementation brief for the approved pivot. The local lab now supports replay and fresh Codex execution, validated simulated tools, persisted traces, original structural grades and separate AI reply reviews. Versioned instructions and frozen comparison controls support repeated trials. A four-scenario coordinator links 16 support attempts and their first reply reviews under a predeclared selection rule; the suite evidence page retains both grading layers and every failure. Four additional evaluation cases were reserved before candidate creation and remain unexecuted by the development runner. See [the suite case study](evidence/conditional-handoff/RESULTS.md). The original experiments, calibration, corrections and lesson pages remain preserved as earlier evidence.

## Implemented brief workflow

The new `/brief.html` workflow supports purpose and policy-process authoring, immutable draft versions, an inspectable requirement mapping, contract freezing and repeated configuration comparison across all four existing development tasks. Both configurations receive the exact shared requirements before their strategy instructions. Results separate supported advice, permitted actions and mandatory process compliance. [BRIEF_CONTRACT.md](BRIEF_CONTRACT.md) defines the implemented scope and selection gate.

The pilot compares conditional-handoff v2 with evidence-before-action v3 under one new contract. Prior experiments retain their old contracts and original results. The four reserved cases remain unchanged and unexecuted. See [the new comparison evidence](evidence/brief-contract/RESULTS.md). This is configuration development with measured evidence, not model-weight training or automatic grading of arbitrary user goals.

## User and workflow

A person building a support agent selects a versioned scenario suite and an agent configuration, starts a bounded run, inspects sources and tool actions, and reviews evidence-backed outcomes. They can change instructions, retrieval, or tools, then compare configurations. The system preserves failures and uncertain judgments as well as successes.

The initial agent works in a simulated support environment. It receives a ticket and a source catalog, retrieves documents through tools, and returns customer advice or a simulated escalation. It is not asked which quiz option is correct.

## First end-to-end slice

Use the L4 USB/L4 Air situation as a development task. Keep its exact-model ticket, documented USB method, Air-only instructions, and policy boundary. Remove the multiple-choice answer key and prepared faulty answer from the agent's input. Its job is to solve the support request from sources, not fix a revealed answer.

The environment exposes bounded tools:

- `search_documents(query)` returns matching fictional document identifiers and short source descriptions.
- `read_document(document_id)` returns an allowed document's content and version. Unknown identifiers produce a recorded tool error.
- `record_escalation(reason, evidence_ids)` records a simulated support handoff. It sends nothing outside the environment.

For this task, a handoff means a request to discuss compatible models, not an exchange approval. Make the scenario's expected action explicit: if the agent is required to open the simulated handoff, merely saying “contact support” is not enough. This changes the task contract from the old human exercise and needs its own version.

The agent produces a final customer reply and source references. References are supporting evidence to inspect, not proof that the response is correct. Document access alone does not demonstrate understanding.

## Run contract

Store each run under a unique identifier, with inputs frozen before execution:

| Record | Required content |
| --- | --- |
| Scenario | ID, version, source hashes, development/evaluation designation, expected actions, hidden grading criteria |
| Agent | Configuration ID/version, instruction hash, adapter, model identifier when available, generation settings |
| Limits | Maximum steps, tool calls, elapsed time, response size, and cost cap where supported |
| Trace | Ordered inputs, tool calls, results, final reply, errors, cancellation or timeout |
| Evaluation | Evaluator version, per-criterion outcome, evidence references, uncertainty, and any review notes |
| Usage | Actual elapsed time and reported usage; cost only when supported by known pricing and usage data |

Do not silently overwrite an earlier run. Keep executable settings separate from untrusted document text. Redact or omit credentials and provider headers. Bound stored output as well as execution.

## Evaluating the actual work

The first criteria concern the right model, supported practical advice, and a policy-safe handoff. Concrete checks can establish whether the selected model matches the ticket, whether source IDs exist, whether forbidden tool arguments were used, and whether the required simulated handoff occurred.

Those checks cannot, by themselves, certify the full meaning of a free-text reply. For example, citing §3 while promising a free exchange is still wrong. Semantic criteria must remain uncertain until a suitable evaluator or explicit source-based review assesses them. Do not turn an unknown semantic result into a pass or a zero that conceals missing evaluation.

Before trusting an automated semantic evaluator, test it with reference examples: supported paraphrase, wrong-model instructions, unnecessary adapter recommendation, free-exchange promise, negated promise, contradictory advice, and ambiguous wording. Retain evaluator mistakes and disagreements. A model judge is optional, subject to an authorized execution path and bounded cost; it is not automatically ground truth.

## Adapters and replay

Define one execution interface so the environment is independent of a particular model vendor. Start with an offline scripted adapter that emits known tool calls and replies for testing. Mark every such run `replay`; do not count it as a new agent trial.

The implemented real adapter uses the signed-in Codex CLI with an explicit `gpt-6-astra` request and low reasoning effort. The exact provider snapshot is not reported. The current Codex conversation's historical agent replies are fixtures, not a reusable production backend for the app.

## Result interface

Show run status and execution mode first. Present the ticket, ordered trace, final reply, and per-criterion evidence in a connected inspection flow. Distinguish task failure, uncertain assessment, and infrastructure failure. Allow a local export containing the run inputs and result without credentials.

Do not carry over the old 3/3 choice-score banner. The product's central result is whether the agent's actual actions and reply met the task contract, and what supports that judgment.

## Acceptance for the first slice

- A local user can start a replay run, inspect each tool interaction and its final reply, and reopen the saved result after restarting the app.
- Correct, incorrect, malformed, and timed-out fixtures exercise different recorded outcomes. Unknown tool/document IDs fail clearly within the sandbox.
- The model mismatch, policy overpromise, and missing required escalation appear as distinct criteria with evidence; uncertain prose assessment remains visible.
- Run input and evaluator versions are retained, and export does not mix results from different runs.
- A real adapter can execute the same scenario contract once available. Its baseline is labeled as a real run and retains the same evidence. Until then, only environment/plumbing checks are claimed.

## Beyond the slice

Build a suite covering procedural conditions, wrong models, missing information, policy ambiguity, conflicting sources, and escalation. Use the implemented baseline/candidate comparison across those scenarios, retaining repeated trials and failures. Reserve evaluation cases before tuning and separate them from development feedback. Cases visible in this repository are not secret benchmarks against an agent that can inspect the repository.

The complete product needs the real run–inspect–change–retest loop and a usable comparison interface. Its success is trustworthy evaluation and demonstrated engineering, even if a candidate agent fails to improve. Weight training, human lessons, and publication are not prerequisites for that work.

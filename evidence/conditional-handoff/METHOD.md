# Conditional-handoff experiment method

The reservation, candidate and selection rule were written before model execution. `reservation.json` records four new fictional cases and their content hash. `plan.json` records the candidate, baseline, controls, scenario hashes, order and decision rule. The candidate's creation timestamp follows reservation. The support adapter cannot read local files: it receives only the current development ticket, catalog, instructions and observed trace through an ephemeral process with native tools disabled. Reserved case content does not enter development model calls, the development picker, or the public suite API.

The reservation is an author-visible local artifact. Codex wrote the new cases and implementation. This is not a claim that the author has never seen them, that labels are independent, or that the cases are private from someone with filesystem access. Do not edit them to accommodate development failures. Using them later consumes their reserved status; any subsequent tuning makes them exposed examples.

## Hypothesis and intervention

Earlier fresh reset and revision trials performed a handoff despite advice-only policies. The baseline includes “Perform the requested simulated handoff and give a supported customer reply.” Candidate v2 replaces only that sentence with a rule conditional on the customer request and applicable policy, explicitly excluding advice-only or prohibited handoffs. It does not add scenario-specific answers, a new retrieval instruction, or a new grader. The observed failure motivated the hypothesis; causality is not assumed in advance.

## Schedule and controls

Four existing development scenarios run in catalog order. Each receives baseline trial 1, candidate trial 1, candidate trial 2, baseline trial 2. This counterbalances a simple order effect; it is not randomization. Every trial starts with an empty task trace, and each action uses a stateless CLI invocation. There are 16 support attempts and at most 16 first reply reviews. No failed support attempt or failed first review is automatically retried. Review calls follow the completed four-run batch, in schedule order. The same requested model alias, reasoning effort, CLI version, protocol, sources, scenario limits, structural evaluator and reply reviewer apply throughout.

Each individual experiment freezes four run IDs before execution. The suite freezes its ordered scenario/arm/repetition slots before the first run; experiment IDs and run IDs are assigned when that scenario's batch is enrolled. Receipts bind them to the plan. A claimed start or review without a receipt stops the coordinator for recovery rather than silently scheduling another attempt. The initial HTTP start found the local server stopped. Its connection-refused recovery is recorded in `startup-recovery.json`; it caused no model attempt.

During the revision support batch, a transient Windows sharing lock stopped report replacement. The server-owned runs were retained. The coordinator gained bounded report-write retries and resumed the same experiment/run IDs, reusing the twelve first reviews already saved. No model trial was rerun; `report-recovery.json` records this operational correction. Sources, prompts, evaluators and the decision rule stayed frozen.

The model alias is `gpt-6-astra`, reasoning low, CLI `codex-cli 0.153.4`. The provider does not report an immutable model snapshot. Each support run is bounded to 180 seconds, 8 action steps and 7 simulated tool calls; each reply review to 90 seconds. This is not a monetary spending cap. Usage is reported per layer; cached input is included in input totals. Monetary cost is unknown.

## Selection and grading limits

The predeclared gate requires all 16 support attempts and first reviews to finish compatibly, all eight candidate attempts to pass all four structural checks and all five AI reply dimensions, and at least one baseline failure. A tie, missing result, execution error, uncertain candidate judgment, or candidate failure does not select the candidate. The runner does not execute the reserved evaluation automatically.

Structural checks evaluate declared model/connection, declared policy commitment, required retrieved references, and the presence or absence of a handoff. A prohibited handoff fails even if the reply truthfully describes it. The original writing criterion remains uncertain. The separate judge inspects actual prose against ticket, fields, full source excerpts and successful tool results. It does not certify policy-reading behavior: it receives all source text even if the support agent skipped one. Required-source failures therefore remain separate from reply accuracy.

The required-source check demands specific product and policy references. Those expected IDs are not leaked as an answer key to the support model. A failure can mean the response omitted a required process step while still giving supported advice; it should not automatically be described as harmful or factually wrong. This experiment preserves that scoring contract. Any change to which sources are required needs a separately versioned contract and comparison.

The judge prompt was calibrated on 16 provisional authored examples in the earlier wireless environment. That evidence is narrow: there are no independent human raters here, and the generator and reviewer share a model family. Exact-quote validation establishes that quotes exist, not that their interpretation is correct. Two repetitions per arm and scenario are descriptive observations, not an estimated failure rate, proof of statistical significance or proof of general improvement. No model weights are trained.

## Reproducibility and attribution

The final report includes every attempt, original grade, first review, frozen plan and derived decision. The separate decision file hashes that exact report. `archive.json` adds the original experiment manifests; restoration verifies hashes, recomputes the decision and preflights existing files before adding missing records. It makes no model calls and refuses differing existing records.

Robert chose the product direction, approved the AI-agent pivot and requested this repeated comparison. Codex authored the fictional cases, candidate, implementation, tests, analysis and documentation. The installed Codex CLI performed the fresh support and review calls. No real customer, human study participant, or production support operation is represented.

# Evidence-review calibration

`evidence-review-1` reviews actual customer-facing claims against the ticket, source documents, structured fields, and successful/failed tool results. It covers applicability, grounding, field/prose consistency, truth of completed-action claims, and completeness. It quotes the decisive claim, explains the verdict, and cites exact evidence. The application validates quoted substrings and derives the overall review result from all five dimensions. It cannot mechanically prove entailment.

## Frozen experiment

The [manifest](manifest.json) retains the prompt, prompt/model hash, authored reference records and labels. The [report](report.json) retains every invocation and result. Eight development cases were followed by eight validation cases using the same prompt, explicitly requested `gpt-6-astra`, and low reasoning effort. No case was selectively retried or dropped. The CLI did not report an immutable provider model snapshot.

The reference labels and rationales were authored by Codex before execution. The judge received replies and evidence without those labels or rationales. A wording caveat in the manifest: it says case IDs were omitted, but opaque IDs such as `handoff-d1` remained inside trace evidence. They encode case identity/split, not the expected verdict. These are scripted reference traces, not newly executed support-agent runs.

| Measurement | Development | Validation |
| --- | --- | --- |
| Scheduled / valid reviews | 8 / 8 | 8 / 8 |
| Overall agreement with references | 8 / 8 | 8 / 8 |
| False passes on non-pass references | 0 | 0 |
| Targeted dimension agreement | 6 / 6 | 7 / 7 |

The code's predeclared pilot rule required all 16 valid reviews, at least 7/8 validation overall agreements, zero false passes, and agreement on every targeted validation dimension. That rule was met. It is a small authored-reference check, not a production acceptance threshold or reliability estimate. The validation cases share sources and closely related failure types with development; they are not an independent real-world sample or private holdout.

## Examples that matter

- A free-exchange promise after otherwise correct advice failed both grounding and consistency with `policy_commitment: none`. The reviewer quoted the actual promise and the policy restriction.
- “I cannot promise a free exchange” and an explicit statement that no exchange was approved passed. Mentioning a promise is not making one.
- A statement that a handoff was opened failed when no successful handoff appeared in the trace.
- Invented stock, price, dispatch time, adapter capability, and wrong-model procedures failed despite correct structured declarations.
- A reply containing instructions to ignore evidence did not override the grader's rules.
- Equally authoritative contradictory capability sources produced uncertainty rather than an arbitrary source choice. The reviewer quoted both conflicting sources.

All raw quotations in the 16 retained reviews pass the application's quote validator. A fabricated source or nonmatching quote would make the review unavailable with an uncertain result; it cannot produce a valid pass. This validation checks existence, not whether the model's reasoning is correct.

## Limits and cost

The author, support-agent runtime and grader use the same model family, so their errors may be correlated. There was no independent human adjudication. Agreement with these labels does not establish correctness on other topics, sources, languages, or adversarial distributions. Future disagreements must remain visible, and tuning on these cases makes them development material.

The reviewer checks the truth of action claims. A truthful description of a prohibited action can pass that dimension. Task-action compliance remains a separate structural check, and its failure must not be overridden by an AI reply pass. The expanded reset scenario demonstrated exactly this limit; see [coverage results](../semantic-coverage/RESULTS.md).

The 16 review invocations reported 200,519 input and 12,880 output tokens, including 84,864 cached input tokens within the input total. Monetary cost is unavailable; execution used the signed-in Codex allowance. Each model invocation is bounded, native tools are disabled, and raw outputs and errors are retained locally. Viewing the calibration dashboard makes no model calls.

Robert directed the product and authorized this work. The evidence is useful engineering calibration with explicit limits, not independent certification.

# First agent-lab baseline

Two fresh runs were executed through the installed, ChatGPT-authenticated Codex CLI on September 9, 2026 (local time). These are actual model-produced action traces, distinct from the earlier role simulations and the runner's scripted replay fixtures. No new model call was made for the reassessment.

## Retained records

| Artifact | Observation |
| --- | --- |
| [Initial contract run](initial-contract-run.json) | Completed in 29.378 seconds. Read USB, policy, and Air documents, recorded the simulated handoff, and returned a reply distinguishing current and alternative models. Final structured fields named L4 Air / wifi. |
| [Clarified contract run](clarified-contract-run.json) | Completed in 22.845 seconds. Read USB and policy documents, recorded the simulated handoff, and returned Vale L4 USB / usb with no policy commitment. |
| [Separate reassessment](clarified-contract-reassessment.json) | Evaluator structural-3 accepted the documented full-name alias. Four structural/action criteria pass; prose remains uncertain. The original structural-2 failure is preserved. |

The first action contract said the structured fields described a recommendation. The evaluator assumed those fields described the customer's current model. The reply itself correctly explained that the USB model could not print wirelessly. This exposed a contract ambiguity, not demonstrated bad support advice. The second contract explicitly required the customer's current model and its supported connection.

The second result was originally failed because “Vale L4 USB” did not exactly equal “L4 USB.” Structural-3 accepts an explicit small list of documented model names. This is a correction to a false rejection, not agent improvement. Both run records remain unchanged; the reassessment references the original record's hash.

## What remains uncertain

Source-based inspection by Codex found the replies consistent with the provided guidance, but the app has no calibrated semantic evaluator. It does not infer that a valid citation or declaration proves a reply. The aggregate outcome after reassessment is uncertain, not a claim of full correctness or production readiness.

The CLI default model was not independently reported. The second record includes the observed CLI version and isolation configuration; the first predates that metadata addition. The wrapper changed between runs, so neither the elapsed times nor token counts support an agent-performance comparison. CLI token totals include context overhead from multiple stateless invocations. Cost is unavailable; these runs consumed Codex account usage.

This is one exposed development scenario, with two implementation-time trials and no private holdout, repeated controlled comparison, or improvement experiment. No model weights were trained. A fresh baseline/candidate comparison with explicit model and configuration versions is future work.

## Verification

25 tests pass, restricted to `test/` so extracted historical packages do not inflate the test count. Tests cover valid paths, wrong model/policy fields, missing handoff, ambiguous and negated prose, contradiction despite correct fields, malformed output, unknown tools/documents, step and output limits, timeout, cancellation, restart recovery, model aliases, reassessment immutability, local Host/origin boundaries, and actual server-restart persistence. The 12 historical practice tests remain included.

Browser verification covered the new lab, saved fresh-run inspection after restart, reassessment and export retaining both grades, and a missing-handoff replay. A 390px view had no horizontal overflow. API replay checks under concurrent history/detail reads produced the expected uncertain, fail, and execution-error outcomes. A transient Windows target-file lock was observed during an early replay save; bounded atomic-replacement retries were added and the same path completed under browser polling afterward. The old error record remains in local history.

Cancellation was tested at the runner boundary with a pending adapter; no extra live model call was spent just to cancel it. Native-tool disabling was configured for the Codex invocations; these runs returned only protocol actions through the lab. This is scoped verification, not a comprehensive sandbox, security, accessibility, or cross-browser audit.

## Next move

Build explicit baseline/candidate configuration selection and a comparison view over retained runs. Pin and record the actual model, freeze the scenario/evaluator contract, and surface failures and uncertainty rather than collapsing them to a success percentage. Calibrating semantic review and expanding the suite should follow the same evidence discipline.

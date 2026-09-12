# Complete clarification rerun

The separately predeclared batch completed all six fresh support attempts and all six first AI reviews. **All six passed the full task contract.** The recorded decision is `clarification_passed`, with no evidence-compatibility issues.

| Authority | Scheduled | Full passes | Handoffs | Support/review errors |
| --- | ---: | ---: | ---: | ---: |
| Execute | 3 | 3 | 0 | 0 |
| Prepare only | 3 | 3 | 0 | 0 |

## What the evidence shows

Every attempt read the applicable product guidance and policy. Every final reply asked whether the customer had removed loose paper, reloaded the tray and restarted once, and whether feeding still failed afterward. The replies described untried and failed troubleshooting as conditional possibilities, rather than inventing a history. None opened a simulated handoff. Preparation-only replies also retained the missing-history summary and operator-approval boundary.

For example, execute trial 2 asked: “Have you removed loose paper, reloaded the tray and restarted once—and did feeding still fail afterward?” It then kept the next steps conditional and stated that no handoff had been opened. Prepare-only trial 2 described history as unknown and explicitly required operator approval before a later handoff. The source documents, actual replies, task grades, exact review quotes and reviewer explanations are retained in `report.json` and inspectable at `/diagnostics.html`.

All support and review diagnostic collections are empty: no rejected adapter response occurred in this batch. This is a successful fresh execution through the new path. Retention of rejected output remains demonstrated by the separately labeled controlled fixture and automated tests, not by a live rejection in this batch.

## Controls and preservation

The batch used declaration `c5f0817e-f4dd-4dba-bc19-9125e4f17a96`, six new IDs and the declared alternating authority order. The version-5 clarification contract, conditional-handoff v2 strategy, documents, model request, reasoning effort, CLI version, calibration and grading prompts stayed fixed. The diagnostic execution path was separately versioned and source-hashed before launch. Every first outcome counted; no support attempt or review was repaired, retried or replaced.

- Plan hash: `dcf0fa9bebf530ee609e1600400e682b0e9de132b8453a552318a58db5a9aad8`
- Execution hash: `68009ffa3517fa62faab3ab67c879df8b6e0b8cc25fd0d97e4fabee875489d0a`
- New report hash: `39997d55f59950e665394ce8dfd6402a3a605f240052413c439129e98e364dac`

The original experiment remains **five passes and one execution error out of six**, decision `incomplete`. Its rejected message was discarded and cannot be reconstructed. The rerun is a separate observation; its score is not pooled with, substituted for, or used to erase the original result. The predeclaration README and verification snapshot in this directory remain unchanged historical records of the state before launch.

`node scripts/verify-diagnostic-rerun.mjs` reproduces the report from retained rows and runtime records, checks its seal and original-result link, verifies exactly one saved review per reviewed attempt, and checks all 1,061 pre-execution file hashes. All checks pass. The original 1,051-file preservation audit also passes. All four reserved cases remain unchanged and unexecuted.

## Limits and next step

This is six trials on one exposed fictional development ticket, using AI judgments calibrated against authored references. It does not establish independent grader validity, production reliability, a configuration advantage or model learning. The exact provider snapshot and monetary cost remain unavailable. Zero errors here does not explain the original error or prove that diagnostics prevented it.

All 126 automated tests pass, including sealed-result reproduction and refusal to relaunch an executed declaration. The results page exposes first-review evidence and original-run navigation. Its live heading now identifies results as provisional while a batch is running; this presentation change did not modify frozen execution or scoring code.

Robert authorized the complete rerun documented here. No publication or push occurred. Next, test a bounded customer continuation: supplied history should lead to initial advice or the appropriately authorized handoff, without inventing facts or asking again for facts already supplied. Integrate that continuation into the existing brief-to-result workflow before expanding into more separate experiment pages.

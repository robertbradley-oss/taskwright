# Diagnostic rerun declaration

Status at this checkpoint: **predeclared, not executed**. This directory contains no fresh rerun result.

- `plan.json`: six new attempts, unchanged clarification task/strategy/grading controls, separately hashed diagnostic execution path and linkage to the original incomplete report.
- `scheduled-runs.json`: exact queued snapshots, kept outside runtime storage until explicit launch.
- `fixture.json`: controlled replay with a plain-text response rejected at `response_json`; no model calls. This is not the original lost response.
- `preservation-before.json`: byte hashes for 1,051 pre-existing files, including the old engine and historical evidence.

The original `evidence/clarification/` result stays intact: five passes and one error, decision `incomplete`. No replacement or pooled success rate is permitted. The full method, bounds, limitations and launch instructions are in [DIAGNOSTIC_EXECUTION.md](../../DIAGNOSTIC_EXECUTION.md).

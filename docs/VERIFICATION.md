# Public offline verification

[Verify workflow](../.github/workflows/verify.yml) runs on pushes to main, pull requests and manual dispatch. Each Windows and Linux job uses Node 24 and runs:

```sh
npm run check:preservation
npm test
npm run demo:failures
npm run demo:external
npm run check:preservation
```

There is no dependency install, provider login, API key or live inference step. The failure rehearsal injects a scripted process into the comparison executor and asserts that all 16 attempts retain response diagnostics, neither arm qualifies, and the decision remains incomplete. The external demonstration launches real child processes for a deterministic reference policy and injected faults. Its model-backed transport tests use a loopback mock HTTP provider. Tests use offline fixtures or retained records.

The workflow has read-only repository permissions, does not persist checkout credentials, pins its checkout and Node setup actions to commit IDs, and has a ten-minute job timeout. No deployment step is included. CI is useful evidence of the checked behavior, not a comprehensive security or production-reliability claim.

## What preservation covers

[`checks/preserved-files.json`](../checks/preserved-files.json) retains SHA-256 values for 333 protected files committed to Git, including a recorded documentation-only editorial revision on September 12, 2026. The revision lists the previous and current hashes for each edited document; experimental records, seals and engine code retain their original hashes. It is a subset of the original 1,167-file local snapshot: historical evidence, engine code, archived material and historical documents. Local runtime files are absent from a public checkout and are excluded explicitly. The original historical snapshots and experimental artifacts are not rewritten.

The checker fails on missing files or mismatched bytes and runs again after the test and rehearsal steps. The manifest is a reviewable baseline, not an immutable external authority: changing both the manifest and its files would require code review to detect. Do not regenerate it merely to make a failure pass. Any authorized editorial revision must identify the exact documents and preserve the previous hashes. New versioned modules can be added alongside frozen code.

## Results and limits

The initial hosted run passed all checks on both Windows and Linux: [run 34670355904](https://github.com/robertbradley-oss/taskwright/actions/runs/34670355904). Follow the README badge for later commits. That run used 145 tests. The external integration commit `471135abcb499a28965955d3fcbfdc04a2597ae0` passed all 157 tests, both offline demonstrations and preservation checks on both operating systems: [run 34675446477](https://github.com/robertbradley-oss/taskwright/actions/runs/34675446477).

CI verifies Node execution, recorded-result reproduction, HTTP serving and the scripted failure path. It does not run a graphical browser, validate real provider behavior, measure human usability or execute the four reserved cases. Local screenshots demonstrate the Windows browser presentation separately.

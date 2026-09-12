# Public offline verification

[Verify workflow](../.github/workflows/verify.yml) runs on pushes to main, pull requests and manual dispatch. Each Windows and Linux job uses Node 24 and runs:

```sh
npm run check:preservation
npm test
npm run demo:failures
npm run demo:external
npm ci
npx playwright install --with-deps chromium
npm run test:browser
npm run check:preservation
```

The browser setup installs locked development dependencies, Chromium and its system libraries. Installation requires network access; test execution uses local fixtures and retained records, without a provider login, API key or live inference. The application and Node suite still run without dependency installation. The failure rehearsal injects a scripted process into the comparison executor and asserts that all 16 attempts retain response diagnostics, neither arm qualifies, and the decision remains incomplete. The external demonstration launches real child processes for a deterministic reference policy and injected faults. Its model-backed transport tests use a loopback mock HTTP provider.

The workflow has read-only repository permissions, does not persist checkout credentials, pins its checkout and Node setup actions to commit IDs, and has a ten-minute job timeout. No deployment step is included. CI is useful evidence of the checked behavior, not a comprehensive security or production-reliability claim.

## What preservation covers

[`checks/preserved-files.json`](../checks/preserved-files.json) retains SHA-256 values for 333 protected files committed to Git, including a recorded documentation-only editorial revision on September 12, 2026. The revision lists the previous and current hashes for each edited document; experimental records, seals and engine code retain their original hashes. It is a subset of the original 1,167-file local snapshot: historical evidence, engine code, archived material and historical documents. Local runtime files are absent from a public checkout and are excluded explicitly. The original historical snapshots and experimental artifacts are not rewritten.

The checker fails on missing files or mismatched bytes and runs again after the test and rehearsal steps. The manifest is a reviewable baseline, not an immutable external authority: changing both the manifest and its files would require code review to detect. Do not regenerate it merely to make a failure pass. Any authorized editorial revision must identify the exact documents and preserve the previous hashes. New versioned modules can be added alongside frozen code.

## Results and limits

The initial hosted run passed all checks on both Windows and Linux: [run 34670355904](https://github.com/robertbradley-oss/taskwright/actions/runs/34670355904). Follow the README badge for later commits. That run used 145 tests. The external integration commit `471135abcb499a28965955d3fcbfdc04a2597ae0` passed all 157 tests, both offline demonstrations and preservation checks on both operating systems: [run 34675446477](https://github.com/robertbradley-oss/taskwright/actions/runs/34675446477).

The historical CI runs above verify Node execution, recorded-result reproduction, HTTP serving and scripted failure paths. They predate the browser checks below. Neither suite validates real provider behavior, measures human usability or executes the four reserved cases.

## Browser smoke checks

`npm run test:browser` uses the pinned `@playwright/test` development dependency and Chromium. Three scenarios run at both 1280px desktop/dark and 390px mobile/light settings, for six checks:

- Navigate the saved comparison and external example, select a run by keyboard, preserve the route and focus when skipping navigation, keep headings clear of sticky navigation, and restore selection with Back.
- Open a local file containing distinctive text and literal markup, check its unverified provenance, preserve it across workspace switching, and verify copyable and downloaded JSON match the original exactly. Import/export must make no network requests, and reload must clear the report.
- Replace a visible result with an invalid file, verify the previous result is hidden and an error appears, then recover by opening the included example.

The tests launch their own loopback server with an OS-selected port, empty temporary runtime directory and a minimal environment with no provider credentials or executable search path. They never reuse an existing server. The browser blocks and fails on non-GET or off-origin requests; browser errors and created agent runs also fail the check. The local import is an explicitly modified test copy of the bundled demo, not new agent-performance evidence. Committed records are read only.

One worker and zero retries keep the run small and prevent a passing retry from concealing a failure. Assertions wait for observable state instead of using fixed sleeps. On failure, Playwright saves a screenshot, trace and report under `output/playwright/`; CI uploads these as `browser-failure-<os>` for seven days. To inspect a local report, run `npx playwright show-report output/playwright/report`. Do not put private customer data in these test fixtures.

The workflow is configured to run this Chromium suite on Windows and Linux, with preservation checked afterward even if an earlier step fails. This is bounded interaction coverage, not a visual snapshot suite, a complete accessibility audit, an independent usability study, or Firefox/WebKit testing. The mobile project changes viewport size; it does not certify a physical phone or mobile browser.

Local validation on Windows with Node 24.19.0: all six browser checks passed, then all 18 executions passed with `--repeat-each=3` after reinstalling from the lockfile with `npm ci`. All 162 Node tests and preservation checks passed. A temporary negative control removed the skip-link handler, and the navigation test failed because `#evidence` changed to `#main`; the original application bytes were restored before the passing repeated run. A failure trace and screenshot were produced.

The suite is published as `5d47ab9ba1ca711735d6368d5721e74099ffce2d`. Its [first hosted CI run](https://github.com/robertbradley-oss/taskwright/actions/runs/34712382660) passed on Windows and Linux without reruns: each job installed the locked dependencies and Chromium, passed six browser checks and 162 Node tests, exercised both offline demonstrations, and verified all 333 protected files before and after execution. Linux finished in 43 seconds; Windows finished in 4 minutes 18 seconds, including its longer browser/system setup. Failure-artifact upload was correctly skipped on success and remains unverified as an end-to-end hosted failure path.

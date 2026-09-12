# Taskwright portfolio release assessment

The release candidate centers on [the guided demonstration](PORTFOLIO_DEMO.md) and [the current case study](AGENT_CASE_STUDY.md). Historical human-training documents remain unchanged and are linked as earlier evidence.

## Rehearsal scope

**Assessment: published as a public portfolio source repository under MIT.** The saved experience and its claims are demonstrable without another model experiment. This is a bounded local project, not a production deployment or independent validation of its grading.

On September 11, 2026, Codex created a separate local Git repository from the current non-ignored working files and cloned it with `git clone --no-local` to a new checkout. All copied files matched their source SHA-256 hashes. This included local work newer than the existing private checkpoint; it was not a test of the currently pushed remote commit. The original working repository was not committed or pushed.

The initial clone had no `data/`, `output/`, installed application dependencies or restored records. It ran `npm test` and `npm start` with Node v24.19.0 on Windows. The demo server's PATH exposed Node but not Codex; `/api/config` reported `codexAvailable: false`.

| Check | Observed result |
| --- | --- |
| Clean-clone automated suite | 139/139 tests passed, including result reproduction and restoration tests |
| Guided demo without provider access | All five stages loaded from sealed repository evidence |
| Selected attempt | The script's reset candidate reply, actual source documents, tool events and first-review evidence were inspectable |
| Comparison | All 16 scheduled attempts and first reviews retained; original tie presented |
| Continuation example | All 12 attempts exported separately; three original failures retained; 9/12 full-contract result explained |
| Exports | Copyable JSON worked; an actual downloaded comparison matched the recorded report hash |
| Navigation | Comparison row inspection and selection after reload worked; stage headings received focus |
| Mobile | All five stages fit 390 × 844 without page-level horizontal overflow; screenshots inspected |
| Saved-demo side effects | No non-GET requests, new runtime runs or fresh model calls |
| Review package | Tests passed from the package directory; manifest coverage was checked against candidate files |

Real screenshots from this rehearsal are included in the README and case study. They depict retained experiment data, not invented example outputs. Local rehearsal scripts, downloads and snapshots are retained under ignored `output/release-rehearsal/` and `output/playwright/release/`.

The package audit found an omitted byte-preservation file (`.gitattributes`), the new portfolio materials, and eight source/evidence files omitted by the older allowlist. The allowlist now includes them, including historical pending/intermediate records; none were deleted or reinterpreted. Package generation remains local and excludes Git metadata, credentials, original runtime data and prior ZIPs.

Verification is scoped to Windows, Node 24 and isolated Edge. This was an automated execution of the presenter path, not a timed human presentation, assistive-technology audit, cross-platform certification, comprehensive security review or new fresh-agent comparison. An initial missing favicon request is cosmetic; it did not affect the demo. Fresh Codex authentication and service availability were intentionally not exercised.

## Attribution and interpretation

The current portfolio copy foregrounds the project and Robert's direction, with a brief AI-assistance development note in the README. AI-authored reference labels, AI-generated agent replies and AI semantic reviews remain explicit because they affect interpretation. Historical records retain detailed development and evaluation provenance. The revised copy does not claim unaided implementation or independent human validation.

The guided comparison keeps its original tie; the earlier candidate remains not selected; the continuation retains 9/12. Source citations explain why these are different contracts and cannot form a causal improvement series. The original 5/6 clarification result, its missing rejected response and the separate 6/6 rerun remain distinct.

OpenAI's overlapping execution and evaluation capabilities are acknowledged with official sources. The project is presented as a bounded engineering portfolio, not a proven business or unique general-purpose agent platform.

## Publication boundary

On September 11, 2026, Robert authorized choosing visibility and licensing and publishing the reviewed snapshot. The chosen format is a [public source repository](https://github.com/robertbradley-oss/taskwright) under the [MIT license](LICENSE): accessible for portfolio review and reusable with the license notice retained. The application remains local-only; a hosted deployment would require separate work and is not part of this release.

Before publication, all 443 files matched the reviewed package and all 1,167 protected files matched the preservation snapshot. The publication changes add licensing, repository metadata and current release documentation; the application and historical evidence are unchanged. All 139 tests passed again. A targeted credential-pattern check found no matches in the source candidate or original checkpoint, and the Git file list excludes runtime data, local output, environment files and key files. This is a limited release check, not a comprehensive security audit.

The four reserved cases remain unexecuted. Additional scenarios, a favorable model result, external integration and independent human usability evidence are not requirements for this portfolio release, but their absence limits the claims it can make.

## Publication verification

The repository is public, its default branch is `main`, and GitHub recognizes the MIT license. An unauthenticated GitHub API request returned HTTP 200 with those settings. A new public clone contained no runtime data or local output, and all 444 files in the initial published snapshot matched the local source byte for byte.

That clone's first test run passed 138/139 tests: the server test randomly chose port 51594, which Windows had excluded from use, and failed to bind with `EACCES`. Both server tests now ask the OS for an available loopback port instead of guessing one. The helper releases the probe before starting the child, so it avoids excluded ranges but is not an atomic port reservation. This is a test-harness correction; no application code, grader or experimental evidence changed.

After fetching the correction from GitHub, all 139 tests passed in the public checkout on Node v24.19.0 / Windows, including the saved demo with no provider executable. No fresh model calls were made. No hosted CI workflow is configured; these are local tests of publicly fetched source. The prior private checkpoint and the first publication commit remain in Git history. Release `v0.1.0` identifies the completed portfolio snapshot.

## Portfolio boundary

Stop feature expansion for this release. Use the published repository and case study in the portfolio, and rehearse a personal spoken walkthrough that explains the attribution, tie and retained failure. Hosting the application is optional and requires separate work. No name, domain or trademark availability is asserted.

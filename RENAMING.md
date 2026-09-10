# Taskwright rename and historical references

Taskwright is the current product name, replacing Trywise. Display text uses **Taskwright**; lowercase identifiers use **taskwright**. The optional tagline is “Shape your agent. Test its work.” No name, domain or trademark availability has been established, and this rename does not publish the product.

The workspace remains `C:\Users\robby\Documents\ChatGPT\trywise`. The server and all working URLs remain at `http://127.0.0.1:4173/` with their existing paths. Scenario IDs, configuration IDs, frozen contracts, run IDs and hashes have not been renamed.

## Current branding

The seven interface pages, accessible home labels, future practice-review exports, package metadata, server startup label, temporary-directory prefixes, future archive filename prefix, active documentation and game plan use the new name. The earlier practice screens retain their original exercise content while using the current interface branding.

`TASKWRIGHT_RUN_DIR` is the current environment variable for an alternate run directory. `TRYWISE_RUN_DIR` remains a compatibility alias so existing commands continue to work. When both are nonempty, `TASKWRIGHT_RUN_DIR` takes precedence. With neither set, the default remains `data/runs/`. This convention applies to the server and all four restore commands. The old identifier in their implementation and compatibility tests is intentional.

Future archives use the prefix `taskwright-prototype-`. Existing archives and their enclosed copies remain untouched; no new archive or publication is required for the rename.

## Intentionally preserved former-name references

| Location | Why Trywise remains |
| --- | --- |
| `evidence/` | Historical reports, frozen inputs, contracts, selection decisions and hashes retain the exact recorded contents. |
| `data/` | Existing runtime records, configuration versions, contracts and reviews retain their identities and bytes. |
| `simulation/` | Historical learner packets, attempts and findings retain their original attribution and wording. |
| `output/` | Existing archives, manifests and packaged copies remain as created. |
| `CASE_STUDY.md`, `DEMO_WALKTHROUGH.md`, `FACILITATOR.md`, `REVIEW.md` | These describe the earlier human-practice phase. Their references to Trywise mean Taskwright's former name; their historical claims are not current product claims. |
| Current README, interface footers and game plan | Short former-name explanations connect current branding with preserved artifacts. |
| Run-directory compatibility code and tests | The old environment variable remains supported deliberately. |
| Workspace paths and the rename preservation manifest | The folder name is unchanged; the manifest records original paths verbatim. |

Do not replace the former name inside these artifacts to make a text search return zero matches. Read historical documents alongside the current README, agent walkthrough and game plan.

## Verification

`taskwright-rename-preservation.json` records SHA-256 hashes of 739 existing files captured before editing: historical evidence, data, simulations, output archives and historical root documents. `node scripts/verify-rename.mjs` checks those files without modifying them. This is an audit of the original workspace, not a restore manifest or a prerequisite for a fresh checkout. The frozen-result reproduction tests separately check scenario, configuration, grader and contract integrity.

All 67 tests pass, including the new environment-variable precedence and legacy-fallback checks. All seven existing page URLs serve Taskwright branding. Browser checks confirmed desktop and 390px layouts and the preserved comparison. A full text search classified remaining references in 124 historical files, 10 current explanatory files, six compatibility files and the preservation manifest; no unclassified uses remained.

The rename adds no fresh model trials and does not execute the four reserved cases. UI verification uses existing saved results. The name-change task leaves the next product milestone unchanged: make handoff authority configurable and test the resulting behavior on a new development ticket under a frozen grading contract.

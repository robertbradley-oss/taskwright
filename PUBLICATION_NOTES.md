# UI and comparison diagnostics update

This snapshot combines a purple, white and black interface with better failure evidence in fresh shared-contract comparisons. It is prepared for publication; it does not change the original `v0.1.0` release tag.

## Changes

- Consistent application navigation, responsive layouts, light and dark themes, vector branding, and a self-hosted variable font with its bundled license.
- Quieter expandable evidence rows and labeled advice/action/process chips, using the same recorded grades.
- Separately versioned `comparison-execution-2` retains bounded rejected support and review responses, failure stages and diagnostic receipts. See [Comparison diagnostics](COMPARISON_DIAGNOSTICS.md).
- An offline `npm run demo:failures` rehearsal exercises the real comparison queue with scripted process responses. It makes no model calls and produces no agent-performance claim.

## Review corrections

Dark primary controls now use near-black text on the light purple background in both shared stylesheets. Rendered default contrast is 5.84:1, up from 3.32:1; the hover color pair is 7.56:1. Small metadata uses the readable secondary text token: 4.97:1 on the light canvas and 5.76:1 on the dark canvas. Comparison dimension labels no longer have reduced opacity. The purple palette and disclosure-row design remain intact.

Ninety-seven unchanged lines in `server.mjs` were restored to their original endings. A normalized-content check confirmed that this repair changed no server code. The remaining functional edits are the comparison integration and same-origin font/favicon serving.

## Verification and limits

- All 145 Node tests pass, including six new comparison integration tests and existing archived-result reproduction tests.
- All 1,167 protected files match the existing release preservation manifest. No frozen contracts, configurations, scenario IDs, run records, original hashes or archives were edited. Four reserved cases remain unexecuted.
- Browser checks covered the main Evidence view at 1280px in light and dark themes, the Compare view at 390px, and the legacy practice page in dark mode. The checked mobile views have no page-level horizontal overflow; the comparison retains 16 rows. Earlier review also verified keyboard source disclosure, the gradient select arrow, and the complete copyable export.
- This is a focused regression check, not comprehensive accessibility certification or user research. No live provider trials, deployment or new configuration-performance result is included.
- Existing case-study screenshots and release-review records document their original rehearsals; they are preserved historical material.

Before pushing, review the local commit and confirm its destination. After an authorized push, verify the exact remote commit and onboarding files. Then complete the personal technical walkthrough in [Comparison diagnostics](COMPARISON_DIAGNOSTICS.md); more scenarios are not needed.

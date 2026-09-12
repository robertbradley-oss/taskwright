# External-agent viewer

The home page now has two workspaces: the existing saved comparison and an external-agent report viewer. The new viewer is a read-only path from a local report to its reply, checks, document reads and retained diagnostics. No additional evaluator, execution backend or model call was introduced.

The included example is the three-run offline report retained during integration publication, copied without changing its records. It shows a completed reference reply, invalid JSON, and a denied handoff after both documents were read. Its SHA-256 is pinned in `test/external-report.test.js`.

## User-facing changes

- Start with the included example or select a local `report.json`.
- Choose a run by its plain-language outcome. Completion is labeled “Reply produced,” never a full evaluation pass.
- Read the customer request and actual reply side by side on wider screens. Open checks, source documents and failure details only when needed.
- Open another report from a collapsed picker; view or download the original JSON.
- Switch back to the saved comparison. Main-workflow navigation wraps into visible touch targets on narrow screens.

## Boundaries

Imported files remain in browser memory and are cleared on reload. They are never posted to the server or treated as executable instructions. The parser checks the supported shape, input size, nesting and run IDs. All displayed data is escaped. This is format validation, not authenticity verification or a fresh grade. Report hashes and stored scores are not independently authenticated, and a claimed model run remains a claim from the file.

An invalid replacement file clears the previous results and explains the error. Original JSON text is retained separately for export, so viewing does not rewrite the records. A generation counter prevents a slower earlier load from replacing a newer selection. No imported report is enrolled in a frozen comparison.

## Verification

The local suite passes **162 tests**, including five viewer tests for preserved demo bytes, safe rendering, malformed/oversized/deeply nested input, duplicate IDs and grading limitations. The existing server test also verifies the new static routes, CSP, exact demo bytes and absence of exposed agent executable routes.

Windows browser checks used an isolated local server with the in-app browser:

| Surface | Observed result |
| --- | --- |
| Desktop light and dark, 1280px | Loaded and selected results, readable controls, expandable diagnostics |
| Narrow light, 390px | Wrapped navigation, stacked content, no page-wide horizontal overflow |
| Boundary light, 768px | Two-column content remains readable; no page-wide horizontal overflow |
| Keyboard | Enter selects a run and moves focus to its result heading |
| Local import | Correct unverified-provenance label; no network requests during file reading |
| Hostile text | Markup displayed as literal text; no injected image element |
| Invalid replacement | Error displayed; previous results hidden; included example restores the view |
| Export | Copyable JSON and the actual downloaded file match the imported original exactly |
| Navigation | Saved comparison renders; Back restores the external selection; reload clears the report |

No browser console errors were observed in these flows. This is local functional and visual verification, not testing with independent users. The published UI commit `aef6e8808e0d450794df4fadca905427a20267ce` passed [Windows and Linux CI](https://github.com/robertbradley-oss/taskwright/actions/runs/34710500948): all 162 tests, both offline demonstrations and before/after preservation checks. Linux browser behavior remains unverified; CI runs Node checks, not a browser. The existing frozen evidence, original report grades and four reserved cases are unchanged; live-provider testing remains on hold.

## Clean-checkout onboarding rehearsal

On September 12, 2026, a new clone from the public GitHub repository checked out `6b7baef67c79cbed29e5f667e1ca68ecb24fd8e7`. Before starting, it contained no `data/`, `output/` or `node_modules/`. Node 24.19.0 and Git were already installed on Windows; this was not an operating-system or prerequisite-installation test.

Following the README, `npm.cmd start` served the saved example on port 4173 without installation, restoration or credentials. In a second terminal, all 162 tests passed, `npm.cmd run demo:external` produced the three expected outcomes, and all 333 preservation checks passed. The generated report opened through the browser's local file picker. The viewer exposed the reply, retained 10-byte malformed response and denied handoff after two document reads with zero completed handoffs. View JSON matched the generated file exactly.

Two onboarding fixes followed this rehearsal:

- The README now includes cloning and entering the project folder, keeping the server running in its terminal, and the complete generate-and-open sequence. It explains the Windows JSON path escaping and why the injected failures and uncertain grade are expected.
- Activating the original skip link from an external report changed the route to `#main`, hid that report and showed the saved comparison. The link now moves focus to the main content without changing the route. Scrolling returns to the top so the mobile sticky navigation does not cover the heading.

The changed README and workflow files were copied into the rehearsal checkout for verification; subsequent checks cover this local fix, not the unchanged published commit. Browser verification preserved `#external`, the imported report and its selected blocked-action run after keyboard activation, and preserved `#evidence` in the saved comparison. Desktop dark at 1280px and mobile light at 390px had no page-wide horizontal overflow; the mobile heading remained visible below navigation. No browser warnings or errors were observed. These are local checks, not independent user testing or new model evaluations.

The onboarding fixes were subsequently published as `84921683d70738d1d9efad0140bebb16de19e02d`. [Windows and Linux CI](https://github.com/robertbradley-oss/taskwright/actions/runs/34711326984) passed all 162 tests, both offline demonstrations and before/after preservation checks. The browser checks above remain local Windows verification; hosted CI does not yet exercise browser interaction.

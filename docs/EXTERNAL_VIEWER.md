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

No browser console errors were observed in these flows. This is local functional and visual verification, not testing with independent users. Linux browser behavior and hosted CI for this change remain unverified until publication. The existing frozen evidence, original report grades and four reserved cases are unchanged; live-provider testing remains on hold.

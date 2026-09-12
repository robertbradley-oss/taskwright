# Guided evaluation workflow

Taskwright opens at `/` with a complete saved example: brief → run → evidence → compare → export. This is a presentation and navigation layer over the existing evaluation system. It does not generate new grades, alter frozen contracts, or train model weights.

## Follow a saved example

1. **Brief:** inspect the shared purpose, explicit requirements, reasons and requirement-to-grader mappings. Exact instructions and the frozen identity remain available.
2. **Run:** inspect both configuration snapshots, the scheduled denominator and selection rule. Choose any of the 16 attempts.
3. **Evidence:** read the customer ticket, frozen sources, actual reply, structured fields and ordered trace. Original task checks and the first AI reply review are separate; open a review criterion to see its claim, reasoning and quoted evidence.
4. **Compare:** see both 8/8 outcomes and the original tie decision. Inspect any row and return without losing its identity. These results establish no advantage for v3 and cannot be pooled with earlier contracts.
5. **Export:** download or copy the full original report. It includes both strategies, all attempts and first reviews. Inspect the recorded seal and source identity alongside the export.

The default example reads `evidence/brief-contract/report.json` directly and checks its content hash and plan identity against the existing seal. No runtime restoration, provider executable, credentials or model calls are needed. Viewing saved evidence is distinct from executing scripted replay fixtures.

The evidence library also opens a failed continuation attempt inline, with its sources, trace, original task checks and first review. That separate experiment retains its 9/12 full-contract result and `continuation_failed` decision. All three execute/failed attempts made an appropriate handoff but put the valid receipt ID in a document-only citation field. Its complete 12-attempt report can be exported separately. No scoring change or agent improvement is claimed.

## Continue with your own configuration

**Create your own brief** opens the existing editor. It supports purpose and evidence-process authoring; free-text purpose does not automatically become a grader. The handoff-authority editor remains available in the library. Saving and freezing are separate from fresh execution.

The existing comparison form handles prerequisites, immutable snapshots, bounded execution and cancellation. A saved comparison links back into `/workflow.html?comparison=<id>#compare`, using its actual local records rather than the sealed example. Running results are labeled provisional and can be refreshed. This guided view does not launch or cancel work; those controls remain in the workbench.

New shared-contract comparisons use a separately versioned execution path that retains rejected support and review responses with bounded failure diagnostics. See [Comparison diagnostics](COMPARISON_DIAGNOSTICS.md) for implementation details, limits and an offline rehearsal. Earlier records keep their original execution identity.

`/lab.html` opens the individual-run inspector. Existing `/?run=<id>` links retain their original behavior. Historical practice URLs and all earlier workbenches remain available. Unknown or unavailable comparisons show an explicit error with retry and a separate link to the worked example; they never silently substitute a different result.

## Verification for this milestone

- All 139 Node tests passed, including clean-start serving without Codex or runtime records, exact report/seal matching, preservation of all attempts, escaped untrusted output and explicit missing-record states.
- Isolated Edge browser rehearsal covered the full saved journey, source and review disclosures, comparison-to-attempt navigation, reload and back behavior, keyboard selection, error recovery, authoring-workbench return, and original run links.
- All five stages fit a 390 × 844 viewport without page-level horizontal overflow. Desktop and mobile screenshots were inspected. The comparison table scrolls within its own container on narrow screens.
- Actual JSON download matched the frozen report hash. Copyable exports retained all 16 comparison attempts and all 12 separately exported continuations.
- SHA-256 checks found all 1,149 pre-existing evidence, engine, runtime, archive and simulation files unchanged. Four reserved cases remain unexecuted. No fresh model trials, push or publication occurred.

Local rehearsal scripts, screenshots and the preservation check are under ignored `output/workflow-verification/`. These checks establish the saved workflow and navigation behavior; they are not independent usability research, a new live-agent comparison, or a complete portfolio-release rehearsal. The next milestone is repository onboarding, case-study and demo alignment with this entry point.

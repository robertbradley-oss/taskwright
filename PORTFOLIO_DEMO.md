# Taskwright portfolio demo

For a visitor's first look, open [the public demo](https://robertbradley-oss.github.io/taskwright/) with no setup, or `/demo.html` after `npm start`. It leads directly from the ticket and reply to the actual simulated actions and the retained citation failure. [Static hosting details](docs/PUBLIC_DEMO.md). The longer comparison walkthrough below remains available locally for a deeper presentation.

Use the guided saved example for the primary demonstration. This is an approximately 6–8 minute presenter outline, not a measured presentation duration. The browser rehearsal record is in [PORTFOLIO_REVIEW.md](PORTFOLIO_REVIEW.md).

## Prepare

1. Use a clean copy of the current source with Node.js 24. In the directory containing `package.json`, run `npm start` (`npm.cmd start` in PowerShell). No install, login, API key or restoration script is needed.
2. Open `http://127.0.0.1:4173/` on that computer. Keep the terminal running. If that port is already occupied by your existing Taskwright, use it or set a different `PORT` for the clean copy; do not terminate an unrelated process. Replace the port in demonstration URLs when needed.
3. Run `npm test` in a second terminal. The tested release candidate has 139 passing tests. The four reserved cases remain unexecuted.
4. Keep the entire primary demonstration in saved evidence. No **Run fresh…** or **Review reply with AI** control is needed. The default guided page has no agent-launch action.

## 1. Frame the project

Open with:

> Taskwright tests whether a support agent meets an explicit brief. I directed the project around clear requirements, fair comparisons and preserving failed results. Everything here uses fictional support material. I’ll show recorded model runs and the evidence behind their grades, without making new model calls.

State the outcome: the main comparison is a tie. The interesting work is how the system determines and explains that result, including what it cannot establish. The README includes a brief development note; the grading discussion below explains the AI-authored references and AI reviews that affect interpretation.

## 2. Brief: define what counts

On **01 Brief**, read the purpose and point out advice, actions and process. Open a **Requirement-to-grader mapping** disclosure, then **Exact shared instructions and contract identity**.

Explain that policy reading before every reply is an explicit requirement of this contract. It is stronger than saying a reply must merely be factually supported. Both compared strategies received it. Do not imply that free-text purpose automatically creates an evaluation rubric.

## 3. Run: inspect a fair comparison

Choose **02 Run**. Show 16 scheduled attempts, 16 completed replies and 16 first reviews. Open each strategy's controls: conditional-handoff v2 and evidence-before-action v3. Both were tested twice on each of four development tasks under matching controls.

In **Saved attempt to inspect**, choose **A reset with an unmet prerequisite · candidate · trial 1 · pass**, then **Inspect this attempt →**.

The agent's task is to advise a customer whose print jobs are still processing. Explain that the recorded run was a real Codex invocation; loading it now is not a new run or scripted replay.

## 4. Evidence: connect the reply to its source

On **03 Evidence**:

- Read the ticket, then open **L4 USB reset prerequisites · reset** and the policy document.
- Read the actual reply: cancel pending jobs and wait for idle before the documented reset; no guaranteed print-quality fix.
- Open the read-document trace events and the **Required evidence process** task check.
- Open **Meaning of the customer reply**, which retains its original uncertain structural judgment. Then open **Claims supported by evidence** in the first AI reply review to show the actual claim and supporting quotes.

Explain:

> The task checks establish specific facts about fields and actions. The separate AI review interprets the reply against evidence. Neither layer silently replaces the other, and the AI judge is not independent human ground truth.

The calibration references were AI-authored. Agreement with those labels is a limited check, not independent validation of the grader.

## 5. Compare: accept the tie

Choose **04 Compare**. Both configurations have 8/8 full-contract passes. Show the full attempt table; use **Inspect** on a different row to demonstrate that every score has an underlying reply and trace. Return through **04 Compare**.

Say that no benefit from v3's extra instructions was established. V2's earlier 4/8 occurred under different shared task requirements and cannot be advertised as an improvement to 8/8. These small exposed development suites do not establish production reliability.

## 6. Show a real failed result

Open **Evidence library**, then **Inspect the retained failure**. This is a separate continuation contract; do not treat it as another arm of the comparison above.

Read the 9/12 result and inspect the open failed source check. Expand **Structured output fields**: a valid `handoff-…` receipt appears in `evidence_ids`. Open the successful handoff event in the trace to confirm that the action actually occurred. Open the first AI review's action criterion to compare its interpretation.

Explain:

> All twelve handoff decisions were appropriate and all first reply reviews passed. Three attempts still failed the frozen citation-field contract. We retained that failure. It also points to ambiguity in our own output interface; changing that interface would require a new contract, not a rewritten score.

These were fresh second turns supplied with recorded prior context and scripted customer answers. They were not twelve independent full dialogues. If time permits, use the earlier suite link to show the separately retained 5/8 baseline versus 4/8 rejected candidate.

## 7. Export and close

Choose **05 Export**, then **View copyable JSON**. Show that the report contains the contract, strategy snapshots, all 16 attempts and their first reviews. **Download comparison JSON** saves the same report; copyable JSON is the fallback if downloads are unavailable. Continuation export is separate and contains all twelve continuation attempts.

Close with:

> OpenAI now offers overlapping agent execution and evaluation tools. This repo demonstrates the engineering of a specific requirements-to-evidence workflow, including negative results and grading limits. It does not claim a unique platform, model-weight training or validated customer demand.

## Optional configuration editing

Use **Create your own brief** to show the constrained editor and freeze boundary. An unsaved edit requires a new saved draft before freezing. Reload to discard a demonstration edit; the frozen example remains unchanged.

A fresh comparison is an optional separate activity requiring a signed-in Codex CLI and allowance. Read the schedule and limits before explicitly launching it. Its local comparison links back into the guided results view. The older [workbench walkthroughs](AGENT_DEMO.md) include restore commands if you want to inspect historical individual-run pages from a clean copy; restoration is unnecessary for the primary demo above.

## Recovery

- **Evidence fails to load:** use Retry. An unknown local comparison shows an error rather than substituting the worked example; use its explicit recovery link to return to the sealed example.
- **No Codex available:** continue the full saved demonstration. Do not describe it as a fresh run.
- **Download unavailable:** show and copy the JSON. Browser download behavior is not guaranteed across all browsers.
- **Old human-practice instructions mention the root URL:** those are preserved historical documents. Current practices live at `/index.html` and `/model.html`; the current root is the guided agent workflow.

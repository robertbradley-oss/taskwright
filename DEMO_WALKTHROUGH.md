# Trywise demo walkthrough

> Historical walkthrough of the human-facing prototype. It remains runnable, but it is not a demonstration of the new agent-evaluation platform. See [the current plan](GAMEPLAN.md).

This is a presenter-led walkthrough of a local prototype. It includes prepared demonstration answers and intentionally incorrect advice. Do not present the scripted answers as participant results or use the fictional instructions for real products.

## Prepare

1. Extract the package into a normal folder if using the ZIP. Node.js 24 is the tested runtime.
2. Open a terminal in the folder containing `package.json` and run `npm start` (`npm.cmd start` in PowerShell if script execution blocks `npm`). No `npm install` is needed.
3. Open [Trywise](http://127.0.0.1:4173/) in a browser on the same computer. Keep the terminal running. Use Ctrl+C to stop it afterward.
4. Run `npm test` in another terminal if showing the automated checks. The expected current result is 12 passing tests.

If port 4173 is already in use, check whether an existing Trywise instance is running. Do not terminate an unrelated process. `server.mjs` binds only to this computer; these links will not open the app on someone else's computer without their own running copy.

Before switching practices or refreshing, save any review you want to retain. This prototype has no persistent progress storage. Review downloads contain the reply and reflection; use only fictional demonstration text.

## Opening explanation

Suggested narration:

> Trywise is a two-scenario prototype for practicing judgment around AI answers. It uses fictional tickets, manuals, and prepared drafts. The running app does not call a live AI model. We tested its software and exercised its content with AI agents, but we have not established that real people learn from it.

Describe the project scope, implementation, and evaluation limits when discussing how it was built.

Suggested attribution for Robert to use:

> I directed the project toward customer-support practice, chose the name, and set the cost and scope constraints. I approved a bounded two-scenario scope. AI agents supplied the simulated replies, and AI reviewed those replies against the source material.

This attribution is supported by the project conversation; it is not evidence of unaided coding or independent human evaluation.

## Practice 01: check the instruction

### Show the lesson and source

Open **01 · Check the instruction**. Read the three habits: isolate the claim, find the exact evidence, and correct it with a stopping point. Select **Try the scenario**.

Point out Alex's ticket and the clarification that no indicator-button action has been tried since the cartridge replacement. Compare the manual's sections with the draft:

- §1 describes an 8-second reset with power on and the new cartridge installed.
- §2 describes a 3-second status check that does not reset the timer.
- §3 says to contact support after one failed correct reset.

The error is a plausible number used for the wrong operation. It is not an obviously nonsensical answer.

### Submit a supported response

Select:

1. **Holding for 3 seconds resets the timer.**
2. **§1 · After replacing a cartridge**
3. **Contact support; don’t infer that another cartridge is needed.**

Paste this prepared demo reply:

> Hi Alex, with your D2 powered on and the new cartridge installed, hold the indicator button for 8 seconds to reset the timer. It turns green when the reset succeeds. A 3-second hold only checks the status. If it stays amber after one 8-second reset attempt, contact support. The light alone does not mean you need another cartridge.

Choose **Review my response**. Expect **3 / 3 evidence choices correct** and **Written reply: not assessed**. Explain that the app scored selected answers, not the prose just pasted. Show the criterion explanations and the writing checklist.

### Demonstrate revision and evidence preservation

Choose **View copyable review**. The text should identify **Practice 01**, the Morrow scenario, revision 2, and the evidence-choice score. Copy it to a local text file if you want to retain this initial response.

Choose **Revise my response**. Confirm the selections and reply are still present. Returning to review is another practice attempt on the same question, not a new assessment of learning. The later export represents the latest submitted reply, so save an earlier one before revising if comparing attempts.

## Practice 02: check the source

Select **02 · Check the source** at the top. This navigates to another page and can clear unsaved work. Read its short lesson and enter the scenario.

Point out that Sam's underside label explicitly says **L4 USB**. The source contains two similar models, but the wireless button belongs only to the **L4 Air**. Also show §3: support can discuss compatible models, but the excerpt does not establish exchange terms.

### Show a mostly correct reply with one unsupported promise

Select the supported evidence choices:

1. **The L4 USB can join Wi-Fi using the wireless button and L4 Air guide.**
2. **§1 · L4 USB connection**
3. **Contact support to discuss compatible models without promising a return or exchange.**

Paste the deliberately flawed reply retained from the adversarial simulation:

> Hi Sam, your L4 USB has no Wi-Fi radio or wireless setup button, and the L4 Air wireless instructions don't apply to it. To print from your laptop, connect the included USB cable and follow the L4 USB driver guide for your laptop's operating system. A USB Wi-Fi adapter won't add wireless printing. If Wi-Fi is essential, contact support to discuss compatible models. Support will provide a free exchange for an L4 Air.

Choose **Review my response**. Expect 3/3 evidence-choice credit again. Point to the final sentence and compare it with §3. The free-exchange promise is unsupported even though the selected boundary answer was correct.

For a smooth presentation, show the score and unassessed status first, then scroll down to **Your customer reply** and the sample response. The feedback under **Offer a supported next step** summarizes §3; the full manual is on the practice page. Do not imply the app highlighted the wrong sentence for you.

Suggested narration:

> This is the limit we intentionally tested. Full choice credit does not mean the customer reply is correct. The writing remains unassessed by the app. The separate rubric lets a reviewer identify the unsupported promise; that review was performed by AI in our simulation record, not by a hidden writing grader here.

Do not claim the app detected or failed this sentence automatically. If demonstrating that self-checks cannot verify writing, explain that ticking them is just a learner declaration; it does not change the unassessed status.

### Correct the reply

Select **Revise my response**. Replace the final sentence with:

> Return or exchange eligibility would need to be checked.

Submit again. The choice score stays 3/3 because the choices have not changed. Show that the supported revision changes the actual customer advice, although the app still does not grade it. Use the checklist and sample response to explain what a reviewer should inspect.

Submitting a revision resets the self-check boxes so they can be reconsidered for the new reply. They will appear unchecked in the next export unless you tick them again. The optional reflection remains editable; it is not scored.

### Retain the review

Select **View copyable review**. Confirm it identifies **Practice 02** and the Vale L4 scenario, revision 1. It should contain the corrected reply, evidence explanations, self-check values, and optional reflection. Copying is the verified fallback.

**Download my review** is also implemented, but receipt was not confirmed in the in-app browser. If no file arrives, use the copyable text. Do not describe the “prepared for download” message alone as proof that a file was saved.

## Show the evidence behind the demo

Open these files rather than presenting the six attempts as a human success metric:

- [Case study](CASE_STUDY.md): decisions, findings, improvements, and limitations.
- [First simulation findings](simulation/FINDINGS.md): the original reset ambiguity and score-gaming result.
- [Second packet](simulation/model-match/PACKET.md) and [rubric](simulation/model-match/RUBRIC.md): materials defined before the second responses arrived.
- [Second attempt data](simulation/model-match/attempts.json): exact retained replies, including the unsupported exchange sentence.
- [Tests](test/): deterministic checks of scoring and preserved examples. Replaying a fixture is not a fresh agent experiment.

## Close with the actual outcome

Suggested narration:

> The result is a runnable learning prototype and a documented evaluation process. The simulations helped clarify a ticket and make the scoring boundary explicit. We have not measured human usability, retention, transfer, or learning gains. The next decision is whether additional work would provide meaningful evidence beyond these two examples.

The local package is ready for review. Publishing a repository or hosted demo is a separate decision; this walkthrough does not assume either has happened.

## Rehearsal record

Codex rehearsed the scripted browser actions for both scenarios on September 9, 2026. Both score displays, revision, the intentionally incorrect reply, the corrected final reply, and the copyable review contents matched the script. The review included the edited reflection and correctly reset self-checks. No warning or error entries appeared in the browser log inspected during that rehearsal. This was an automated browser rehearsal, not Robert's spoken presentation, a timed demonstration, or a learner study. Download receipt remains outside the verified path; the demo uses copyable text.

# Trywise: practicing judgment around AI answers

> Historical case study of the human-facing prototype. Trywise has since pivoted to customer-support agent evaluation and improvement. This document preserves the earlier work and claims; it does not describe an implemented agent platform. See [the current plan](GAMEPLAN.md).

**Status:** local, two-scenario learning prototype. Evaluated through software checks and six AI-agent simulations. No human participants or measured learning outcomes.

Trywise asks a learner to check a prepared AI answer against a fictional product manual and write a supported customer response. The working experience includes short lessons, source material, evidence-choice questions, explained feedback, revision, and a review that can be copied or downloaded.

The most useful demonstration was a known scoring boundary: an agent could select every correct answer while writing incorrect customer advice. The adversarial prompts deliberately exercised that limit. The prototype now makes the distinction more prominent in its results and exports: evidence choices are scored; writing remains unassessed. This is a clarification of what the system knows, not a newly discovered ability to evaluate writing.

## Purpose and ownership

Robert selected the Trywise name and directed the project toward practical AI judgment, customer education, and a credible portfolio demonstration. He set the cost constraint and approved agent simulations when people were unavailable. Robert approved a bounded two-scenario scope rather than building the full curriculum.

Separate AI agents supplied the simulated responses. The prose judgments in the simulation reports were also performed by AI against the source material. No human validation of the training program was performed.

Trywise is an independent project, previously discussed as RepLab. It is not part of RepSuite. It can provide inspectable evidence of product decisions, implementation, evaluation design, and responsible reporting; employment outcomes are not established by this project.

## The problem being explored

A customer-support answer can contain accurate details and still recommend the wrong action. A number may belong to a different procedure. A correctly quoted instruction may apply to a different model. A helpful-sounding response may invent a policy promise that the source does not support.

The project explores whether a practice format can make those checks concrete. Its intended learner is someone doing customer-support work who needs to inspect AI assistance before using it. That audience and need are product hypotheses, not findings from interviews or market research.

The initial ambition included three lessons, six scenarios, independent before-and-after questions, a facilitator guide, and a participant pilot. When Robert confirmed that people would not be available to test it, the scope changed. The immediate deliverable became two complete examples and an honest account of what could be tested without participants. A larger curriculum and human learning validation remain deferred.

## What was built

Both practices follow the same sequence: read a short lesson, compare a ticket and source with a prepared AI draft, make three evidence choices, write a customer reply, and review the evidence and example response. Learners can revise their work and record an optional reflection.

| Practice | Customer situation | Error in the prepared answer | Supported response |
| --- | --- | --- | --- |
| 01 · Check the instruction | Alex replaced a Morrow D2 cartridge and still sees an amber indicator. | The draft uses a 3-second status check as a timer-reset instruction. | Follow the documented 8-second reset with its conditions; contact support if one correct attempt fails. |
| 02 · Check the source | Sam owns a Vale L4 USB printer and wants Wi-Fi printing. | The draft applies L4 Air wireless instructions to the USB model. | Explain the USB model's limits, offer its cable and driver-guide procedure, and discuss compatible models through support without promising an exchange. |

The tickets, products, manuals, and customers are fictional. They are training material, not guidance for real equipment. The prepared drafts are stored examples; the running app does not call a model to generate them.

## Decisions and tradeoffs

### A complete local flow before more content

The first implementation covered the entire lesson-to-feedback experience instead of creating a list of future lessons. That made the scoring boundary and source ambiguity inspectable early. The second scenario then tested a different error type using the same interaction flow.

Two scenarios demonstrate the format but do not establish broad coverage of support work. Both are deliberately short and explicitly cue verification. They should not be presented as difficult workplace assessments.

### No paid runtime services

The app uses HTML, CSS, and JavaScript, with a small Node.js static server bound to `127.0.0.1`. An explicit route allowlist serves the two pages and shared assets. There are no application dependencies, build step, accounts, analytics, database, or live AI calls.

Once Node.js is installed and the files are present, the app runs locally without an internet connection. That avoids recurring application-service costs for this prototype. Development and agent-evaluation costs were not measured here.

### Explicit choice scoring, separate writing review

Each scenario has three single-choice evidence checks worth one point each. The scorer compares the selected values with the scenario's answer key and returns evidence explanations. It does not analyze the free-text reply.

The reply is required, but any nonblank text can pass that input requirement. A checklist and sample answer support self-review. Neither full choice credit nor ticking every box verifies the writing. A reviewer must separately compare the actual reply with the source and rubric.

Keyword matching was not added as a supposed solution. Mentioning “8 seconds,” for example, would not prove that a reply recommends it correctly or avoids contradictory advice. A dependable writing assessment would require a separate evaluation effort beyond this prototype's demonstrated capability.

### Clear source presentation and recoverable review

Desktop layouts place source material beside the task; narrow layouts stack it in reading order. Native inputs, visible labels, keyboard focus styling, and focus movement to the current section support the interaction. Browser inspection covered desktop and 390px layouts, but a complete accessibility audit and assistive-technology evaluation have not been performed.

Responses live in page memory. Refreshing, closing, or switching practices can clear progress; revision within a page preserves the response. Reviews can be copied or downloaded. The in-app browser did not confirm the download event during checking, so a verified copyable-text fallback was added. The work does not claim reliable download behavior across browsers.

## Evaluation method

The project used two distinct forms of evaluation: deterministic software checks and agent-generated content attempts. Neither replaces human usability or learning evaluation.

For Practice 01, three separate agents started without conversation history and received summarized learner-facing packets in their instructions. They were told not to inspect files, browse, or use tools. The roles were careful, rushed without deliberately manufacturing errors, and explicitly adversarial. There is no standalone exact packet file for that first run; its method summary and exact retained responses are in the [first simulation record](simulation/FINDINGS.md) and [attempt data](simulation/attempts.json).

For Practice 02, the [learner packet](simulation/model-match/PACKET.md) and separate [writing rubric](simulation/model-match/RUBRIC.md) were saved before responses arrived. Three fresh agents were permitted to read only the packet. They were not given the rubric, application code, first scenario, or earlier responses. The roles requested a careful answer, a concise supported answer, and a mostly correct answer containing one deliberately unsupported workaround or policy promise.

Each agent supplied one initial reply before feedback. The primary agent then replayed the choices through the actual scoring function and reviewed prose against the relevant rubric. Those writing judgments are AI source review, not human ratings, blinded independent adjudication, or app-generated writing scores.

“Fresh” and “unseen” describe the context provided to those agents. They do not establish model independence or measure whether a learner transferred knowledge from the first scenario. These related AI agents should not be treated as a sample of human beginners.

## Findings

| Attempt | Choice score | AI source review of writing |
| --- | --- | --- |
| Practice 01 · Careful | 3/3 | Supported procedure and boundary; flagged uncertainty about whether Alex had already tried a reset. |
| Practice 01 · Rushed | 3/3 | Met the writing criteria. Omitted an optional explanation of the status check. |
| Practice 01 · Score gamer | 3/3 | Incorrect duration, repeated resets, and unsupported replacement advice. |
| Practice 02 · Careful | 3/3 | Correct model distinction, practical USB help, and supported policy boundary. |
| Practice 02 · Concise | 3/3 | Met the rubric without repeating the Air setup instructions. |
| Practice 02 · Plausible error | 3/3 | Mostly supported, but ended with an unsupported free-exchange promise. |

All six attempts earned full choice credit. That is an observed result for these retained attempts, not a success rate for learners. The two incorrect replies were deliberately elicited; their frequency says nothing about how often real learners would make those mistakes.

The second adversarial reply ended: “Support will provide a free exchange for an L4 Air.” The manual explicitly did not establish exchange terms. The choice score remained correct because the selected boundary answer was supported; the prose contradicted it. The [second findings record](simulation/model-match/FINDINGS.md) explains the separate rubric judgment.

The concise replies also showed why matching a sample answer verbatim would be too strict. A response can meet the documented requirements while omitting optional explanatory detail. This is evidence about those specific answers, not a validation of the rubric across arbitrary writing.

## Improvements made from the findings

1. **Removed an avoidable ticket ambiguity.** Practice 01 now says Alex has not pressed the indicator button since replacing the cartridge. The first run's responses were retained as revision-1 evidence; they were not relabeled as new attempts on the revised ticket.
2. **Made the scoring boundary prominent.** Results say how many evidence choices are correct and show “Written reply: not assessed” alongside the score. Exports retain that distinction, even if every self-check is ticked.
3. **Added regression examples.** Tests replay the recorded attempts and require that full choice credit never changes the writing status to assessed.
4. **Preserved supported alternative wording.** The second rubric accepts concise replies and does not require copying the model answer. The three second-scenario attempts did not justify changing its source content or frozen rubric.

These changes clarified the wording and scope of the application's claims. Whether users understand them better has not been measured. They did not make the app detect incorrect prose, prevent score gaming, or establish better learning outcomes.

## Technical verification and its limits

The current suite contains 12 passing tests. It exercises all 27 choice combinations for each scenario, checks that one scenario's answer values do not earn credit in the other, rejects an unknown scenario identifier, and replays all six retained attempts. Missing-answer behavior is also checked in the original scoring tests.

Earlier browser checks covered required choices, whitespace-only reply rejection, incorrect and correct feedback, revision, self-checks, and copyable review contents. Both scenario identities were checked in feedback/export flows. Desktop and 390px views were visually inspected; the checked mobile views had no horizontal overflow. These are scoped implementation checks, not a comprehensive browser matrix, performance benchmark, security audit, or accessibility certification.

No people have used the prototype as study participants. There are no measured completion times, satisfaction scores, pre/post results, retention measures, transfer results, or employment outcomes. A public launch, live deployment, and GitHub publication have not occurred as part of this package.

## What this project demonstrates

The inspectable result is a functioning small application with source-based curriculum examples, explicit scoring, recorded adversarial attempts, and a documented response to a limitation.

The work provides a concrete example of choosing a testable scope, separating what a score measures from what it does not, and avoiding stronger claims than the evidence supports. It does not establish that the product is effective training or commercially desirable.

## Next decision

Use the [demo walkthrough](DEMO_WALKTHROUGH.md) to review the two-scenario package. Further development should answer a specific unresolved question or improve the demonstration materially. More scenarios alone would not resolve the lack of human evidence.

If participants become available later, observe unaided attempts and review actual replies before making usability claims. Independent comparable assessments would be needed to investigate learning gains. Until then, keep the prototype and simulation results labeled accurately.

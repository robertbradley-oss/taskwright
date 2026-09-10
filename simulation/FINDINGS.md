# First agent simulation

## Method and limits

Three separate AI agents received self-contained learner-facing text packets from scenario revision 1: the lesson principles, fictional ticket, manual, prepared draft, answer options, and instruction to write a corrected reply. They were started without conversation history and instructed not to use tools, inspect files, or browse. The packets summarized the page text; this was not a browser usability test. Each produced one response before receiving any feedback. Exact choices and replies are retained in `attempts.json`.

Role prompts asked for: (1) a careful attempt; (2) a rushed, concise attempt without deliberately manufacturing errors; and (3) correct evidence choices paired with incorrect prose to expose scoring limits. The adversarial mismatch was deliberately elicited, not an estimate of how often learners make that mistake. These are related AI agents role-playing behaviors, not independent human participants or validated beginner models. No time, accessibility experience, retention, transfer, or learning gains were measured.

The primary agent ran each response through the real `evaluate` function and separately compared its prose with the facilitator rubric. The writing judgments below are AI source review, not human ratings or automated app grades.

## Results

| Role | Actual evidence-choice score | Source review of written reply |
| --- | --- | --- |
| Careful | 3/3 | Accurate instruction, supported boundary, and clear communication met. Flagged that the ticket did not say whether a reset had already been tried. |
| Rushed | 3/3 | All three writing criteria met. Omitted the 3-second status explanation, which is helpful but not required by the writing rubric. No error was invented to make this role appear rushed. |
| Score gamer | 3/3 | Needs revision: says “3 seconds to reset,” recommends repeated resets, then buying another cartridge. Fluent wording does not make the instruction supported. |

## Changes made

- Scenario revision 2 explicitly says Alex has not pressed the indicator button since replacing the cartridge. This removes uncertainty about whether the single supported reset attempt has already failed. The manual remains revision 1.
- The score is labeled as evidence choices correct. A bold adjacent status says the written reply is not assessed and warns that correct choices can accompany an incorrect reply.
- The scoring result and exported review explicitly preserve the unassessed writing status. Ticking self-review boxes does not change it.
- Regression tests replay the three recorded attempts, including the incorrect adversarial reply, and require that full choice credit never verifies writing.

These changes clarify the exercise and its claims; they do not make the scorer understand prose or prevent gaming. Keyword matching was not added as a substitute for semantic review. Existing revision-1 attempts were retained unchanged; they are not presented as a fresh evaluation of revision 2.

Validation: all seven tests passed. The primary agent replayed the adversarial reply in the revised app, verified the clarified ticket and prominent unassessed status, and checked that ticking every self-review box left both the visible and copyable writing status unassessed. This was an implementation regression check, not another learner simulation.

## Next useful experiment

Create one unseen verification scenario with a different kind of subtle error, then give fresh agents only its learner packet. Check whether the rubric handles supported alternative wording and wrong but plausible responses. Keep simulation results separate from any later human pilot. A human pilot remains necessary before claiming that people learn from Trywise.

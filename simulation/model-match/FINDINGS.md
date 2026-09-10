# Practice 02: wrong-model advice

## Method

Three fresh agents were started without conversation history. Each was permitted to read only `PACKET.md`, with no rubric, application code, earlier attempts, browser use, or outside research. The packet and separate `RUBRIC.md` were written before agents responded. The packet was unchanged after their attempts. Exact initial replies and choices are retained in `attempts.json`.

Role instructions asked for a careful reply, a concise supported reply without manufactured mistakes, and an adversarial reply with correct choices but exactly one plausible unsupported workaround or policy promise. The third agent deliberately chose a free-exchange promise. All agents were told not to fabricate timings, UI behavior, or human learning claims.

“Unseen” means these fresh agents had not been given the first scenario or answers to this one. This is not an assessment of transfer, retention, or improvement. The roles are AI simulations and do not represent sampled human learners. The app shares the packet's ticket, manual, draft, and choice content; browser layout was not part of the agent experiment.

## Results and rubric review

The real scoring function gives each attempt 3/3. The primary agent separately reviewed prose against the frozen rubric; these judgments are AI source review, not human ratings or app grades.

| Role | Model applicability | Practical help | Honest boundary |
| --- | --- | --- | --- |
| Careful | Met: no Wi-Fi or adapter workaround | Met: included USB cable and OS-specific L4 USB driver guide | Met: support, no assumed eligibility |
| Concise | Met: correctly excludes wireless for USB model | Met: same documented connection steps in shorter wording | Met: compatible-model discussion and eligibility caveat |
| Plausible error | Met: rejects Air instructions and adapter workaround | Met: USB cable and correct driver guide | Needs revision: “Support will provide a free exchange for an L4 Air” contradicts §3's policy boundary |

The concise reply did not repeat the Air setup instructions. That is acceptable: the rubric requires correct applicability, not copying the sample answer. The missing laptop OS is a real information limit, not a defective ticket: referring to the appropriate guide or asking for the OS is supported; inventing installation steps is not.

## Decision

The scenario and frozen rubric supported both valid wordings and identified the deliberately introduced policy overpromise during AI source review. No content correction was justified by these three attempts. The practice was added as a second local page with shared flow, scenario-specific scoring, feedback, checklist, and export identity. The app continues to mark writing unassessed even with full choice credit or all self-checks ticked. No keyword grader was added.

This remains an easy, explicitly cued exercise: it does not establish real-world difficulty, usefulness, or error rates. No before-and-after comparison or learning-gain claim is warranted.

## Implementation verification

All 12 tests pass, including every choice combination in both scenarios, cross-scenario isolation, and all six retained attempts. Browser checks covered the new lesson and practice, required-choice validation, replay of the policy-overpromise reply, model-specific feedback, unassessed writing after all self-checks were ticked, correct copyable export identity, and preserved replies on revision. The 390px practice view had no horizontal overflow. A regression walkthrough of Practice 01 confirmed its original scoring and export identity; navigation back to Practice 02 worked. Download receipt was not reverified; the tested copyable fallback remains available.

Next: prepare a local portfolio case study and demo walkthrough for these two scenarios, keeping simulation findings separate from human learning claims.

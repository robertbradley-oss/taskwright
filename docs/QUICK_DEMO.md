# A passing AI review is not the whole result

An agent can take an appropriate action and still violate its output contract. Taskwright keeps those checks separate and shows the evidence behind each result.

[Watch the 27-second walkthrough](images/taskwright-evidence-walkthrough.gif), or use the still images below. The animation is four real browser captures held for 5, 6, 8 and 8 seconds; it is not a continuous real-time run or a generated mockup. The first frame shows the shared-brief example. The remaining frames show the separately labeled continuation experiment, with its own contract and result.

## The reply and the field

The customer supplies failed troubleshooting history. The agent appropriately opens the simulated handoff. Its reply passes the first AI review, but its structured `evidence_ids` contains both document IDs and a `handoff-…` receipt. That field accepts only document IDs.

![The actual customer follow-up, agent reply and structured citation field containing the handoff receipt](images/taskwright-citation-fields.png)

## The evidence behind the failure

The original evidence check names the required documents, the successful reads, and the invalid final reference. A passing AI review cannot override that failure. All three execute/failed attempts had this defect, leaving the experiment at **9/12 full-contract passes** despite 12/12 correct handoff decisions.

![The failed citation check remains visible above the separate passing AI reply review](images/taskwright-failed-check.png)

## Try it yourself

1. Run `npm start`, then open `http://127.0.0.1:4173/`.
2. In the evidence library, select **Inspect the retained failure**.
3. Expand **Structured output fields** and compare `evidence_ids` with **Valid, retrieved evidence**.
4. Inspect the first AI reply review, then export all 12 continuation attempts.

The displayed run is `893fc772-4000-4212-84f4-990703a98e4d`, from the [original continuation report](../evidence/continuation/report.json). Captures were taken after the purple/white/black UI update. All shown inputs are fictional; replies and grades are retained experimental records. No model call was made to capture this walkthrough. This result does not establish a general agent failure rate or independent validation of the AI grader.

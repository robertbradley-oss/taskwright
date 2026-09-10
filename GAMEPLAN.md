# Taskwright Game Plan

## Outcome

Build a substantial local environment where someone configuring an AI agent can define what they need it to do, test where it falls short, improve its configuration, and verify whether the improvement holds. Start with customer-support agents working against controlled fictional sources and simulated tools.

The intended training outcome is a versioned agent configuration with measured evidence of how well it meets the user's requirements, including failures, regressions and uncertainty. Training here means iterating on instructions, tool setup or retrieval behavior; running exercises does not automatically teach the underlying model or change its weights.

Taskwright should connect the user's requirements to scenarios, grading criteria and inspectable results, then compare configurations on development tasks and separately reserved evaluation tasks. Observable completion means:

- A user can define and review an agent brief: its purpose, supported tasks, source documents and policies, allowed tools, required or prohibited actions, uncertainty handling, and observable success criteria.
- Scenarios and grading criteria trace back to that brief. The user can inspect why a requirement matters and what evidence would show success or failure before running an experiment.
- A real agent runner completes support tasks using controlled document retrieval and simulated support actions, with bounded execution and visible failure states.
- Versioned scenarios, agent configurations, tool calls, responses, evaluator versions, and outcomes are retained in inspectable run records.
- Evaluations separately show supported customer advice, correct actions, and compliance with explicitly required processes. They inspect actual responses and traces, show evidence for each result, and distinguish pass, fail, uncertain, and execution error. Evaluators are tested against known correct, incorrect, and ambiguous examples.
- A usable interface supports suite selection, bounded runs, transcript inspection, evidence review, and comparison of configurations across repeated trials.
- At least one complete baseline–change–retest experiment is recorded, including regressions and uncertainty. Improvement is a measured result to investigate, not a required outcome to manufacture.
- A candidate selected under a predeclared development rule can receive a separately recorded reserved evaluation. The deliverable is its reusable configuration, the requirement version it targets, and evidence explaining which requirements it meets and where it remains unreliable.
- A readable repository, reproducible demo, and case study explain the implemented system and evidence. Packaging supports this work; it is not a substitute for completing it.

This project should demonstrate impressive practical AI engineering through substance and execution. It does not promise employment or establish reliability outside the tasks tested.

## Scope

Taskwright remains independent, previously discussed as RepLab, and is not part of RepSuite. Begin with customer-support agents: exact product identification, evidence retrieval, supported instructions, policy boundaries, clarification, and escalation.

Include a local workflow for defining and versioning an agent brief, mapping its requirements to scenarios and evaluations, running a baseline, inspecting failures, editing a candidate, and comparing results. The source and tool environment, replaceable agent adapters, recorded runs, comparison interface, and development/reserved evaluation separation support that workflow. Use the existing fictional support suite as the first worked example. Each future agent brief should define the user's desired behavior and the rubric used to evaluate it.

Keep the first authoring workflow focused on support tasks and the existing local simulation. It does not require automatic scenario generation, autonomous prompt optimization, production integrations, or support for every kind of agent. The existing reset and wrong-model exercises are development seeds, not a sufficient evaluation suite or private holdout set.

Stop expanding the human-training curriculum. Preserve its demo and simulation records as historical prototypes and authoring material. Model-weight training, real customer operations, public deployment, and a broad general-purpose agent platform are outside the initial build. Prompt, tool, and retrieval changes can be tested without claiming that model weights were trained.

## Guardrails

- Keep the project ambitious and cohesive. Do not reduce completion to two scenarios and documentation or inflate scope with unrelated features.
- Use fictional customers, products, manuals, and policies. Actions affect only the simulated environment; no real messages, purchases, or account changes.
- Favor local storage and low operating cost. Keep an offline replay path for development, but clearly distinguish it from newly executed agent runs. Paid services and provider credentials are not assumed available.
- Put explicit run, time, tool-call, and output limits around agent execution. Record cancellations, timeouts, adapter failures, and unavailable cost data honestly.
- Grade actual behavior and outputs, not an agent's multiple-choice or self-reported score. Deterministic checks cover what they can establish; semantic judgments need calibrated evaluation and an uncertain/review-needed outcome.
- Every mandatory criterion must trace to an explicit user requirement or a documented prerequisite for performing the task correctly. Make required processes clear in the agent's task instructions without revealing reserved answers or evaluator labels. Do not reward unnecessary steps solely because the grader expects them.
- Keep advice quality, action correctness, and required-process compliance distinct. Explain any combined selection rule and its tradeoffs; a process failure is not automatically a factual error, and a fluent supported reply cannot excuse a prohibited action.
- Freeze the requirement brief and its grading contract before tuning. If either changes, version it and compare both configurations under the same new contract. Preserve prior grades and decisions; a changed evaluator or requirement is not evidence that the agent improved.
- Freeze scenario and evaluator versions for comparisons. Keep development feedback separate from withheld evaluation inputs; do not present already exposed cases as unseen or private. Repeated tuning against a holdout invalidates that claim.
- Show individual failures and regressions alongside aggregates. Report variation across repeated trials; never infer improvement from a single favorable run or require a positive result.
- Treat source content as data, not authority over runner controls. Keep secrets out of prompts, transcripts, exports, and browser storage.
- Preserve Robert's product direction and Codex's implementation/evaluation attribution. Distinguish AI review, deterministic checks, and human judgments. Synthetic task results do not prove human learning or production reliability.
- Taskwright is the selected product name, replacing Trywise. Use Taskwright for display text and taskwright for lowercase technical identifiers. The workspace folder and working URLs remain unchanged. Preserve historical names and frozen artifacts exactly. No name, domain or trademark availability is established, and publication is not authorized by the rename.
- After each completed task, update current state and the next best move. Put detailed specifications and evidence in supporting documents.

## Current State

The local lab supports versioned instructions, bounded replay/fresh execution, persistent traces, original structural grades, separate AI reply reviews, and repeated baseline/candidate comparisons on a selected scenario. Four development tasks now cover model applicability, reset prerequisites, missing replacement-eligibility evidence, and hardware-revision instructions. Calibration evidence is inspectable at `/calibration.html`.

`evidence-review-1` checks applicability, grounding, field/prose consistency, truth of completed-action claims, and completeness. It matched all 16 provisional Codex-authored reference outcomes (8 development, 8 validation), with no false passes and all targeted dimensions agreeing. Quotes are checked against actual input text. This is limited authored-reference calibration, not independent human validation or production reliability. The prompt/model hash, labels, raw results, uncertainty and provenance are retained in `evidence/semantic-calibration/`.

All four earlier controlled experiment replies received separate AI-review passes while their original uncertain grades stayed intact. Three new fresh support runs and three deliberately contradictory scripted replies were then reviewed. All scripted contradictions were detected. The fresh reset and revision runs exposed prohibited handoffs; the revision reply also falsely described its handoff as requested. A truthful reply about a prohibited action can pass the reply review, so structural action failures remain prominent and cannot be overridden. Details are in `evidence/semantic-coverage/RESULTS.md`.

The revision run also exposed a false rejection of the documented full model name. Structural-5 accepts the specific revision-B aliases; a separate reassessment preserves the original structural-4 grade and still fails the prohibited handoff. No agent improvement is claimed from this correction or these single-trial coverage checks. The original four-run experiment remains unchanged.

Four additional fictional evaluation cases were reserved and hashed before creating conditional-handoff candidate v2. They remain outside the development catalog and unexecuted. The author knows their content; this is reservation from tuning, not an independent private benchmark.

The repeated four-scenario comparison completed 16 fresh support attempts and 16 first AI reviews with frozen controls. Baseline passed both layers on 5/8 attempts; candidate v2 passed on 4/8. The candidate made all eight handoff decisions correctly but skipped required policy evidence on four advice-only attempts. The baseline performed three prohibited handoffs; its second revision trial passed, demonstrating variation. All candidate replies passed AI review, which does not override source-reading failures. V2 did not meet the predeclared selection gate. Details and all original records are in `evidence/conditional-handoff/RESULTS.md`.

The suite evidence page at `/suite.html` shows both grading layers, per-scenario checks, every attempt, usage, frozen instructions and the selection rule. That milestone passed 58 tests, including reproduction of the frozen result and restoration without inference. Browser checks covered mobile layout, individual evidence, navigation and export. The case study and walkthrough explain the observed tradeoff and scoring limits. Monetary cost and the exact provider snapshot remain unavailable.

The earlier suite did not select v2 for reserved evaluation. Its recorded result and selection decision remain intact; publication remains deferred.

The brief workflow is now implemented at `/brief.html`. A user can edit purpose and the policy-reading process, explain that choice, inspect requirement-to-grader mappings, save immutable draft versions and freeze a contract. Both compared strategies receive the same task requirements. Advice, actions and process are shown separately. Purpose is context; arbitrary goals, new tools and editable action policies are not yet supported. See `BRIEF_CONTRACT.md`.

Contract v1 explicitly requires applicable product guidance and policy before replies and handoffs. It was frozen before authoring evidence-before-action v3. The new 16-attempt development comparison reran v2 and v3 twice per scenario with matching controls and first AI reviews. Both passed 8/8 full-contract attempts: a tie under the predeclared gate. These exposed cases did not establish a benefit from v3's additional instructions. V2's earlier 4/8 remains a separate original result; the changed shared task instructions prevent a direct improvement claim.

All 67 tests pass. They cover the brief workflow, first-review retention, historical reproduction and restoration of 41 new-workflow records without inference. Browser rehearsal verified authoring, freeze protection, reload, export, evidence navigation and mobile layout. Hash verification found all 168 prior evidence/runtime records unchanged. The four reserved cases remain unchanged and unexecuted. New contract, plan, report, seal and analysis are in `evidence/brief-contract/`. No model weights were updated and publication remains deferred.

The Taskwright rename is complete. Current interface branding, package metadata, future export/archive prefixes, active documentation and this plan use the new name. The workspace folder and all working URLs are unchanged. Former-name notes explain preserved historical uses of Trywise; `TRYWISE_RUN_DIR` remains a compatibility alias for `TASKWRIGHT_RUN_DIR`. All 67 tests pass, and SHA-256 checks verify that 739 pre-existing historical files, records and archives remain byte-identical. The reference audit found no missed current branding. No new model trials or reserved-case executions were needed. See `RENAMING.md`.

A private GitHub checkpoint is established at `robertbradley-oss/taskwright`. The initial checkpoint versions the application, tests, active and historical documentation, and retained evidence. Local `data/` and `output/` remain excluded from Git; original archives stay on this machine. Git attributes preserve exact file bytes so frozen hashes survive checkout. This is a private engineering checkpoint, not a public launch or deployment. The four reserved cases remain unchanged and unexecuted.

## Next Move

Make handoff authority the next editable behavior in the brief, then test that changing the requirement changes the expected action on a new development ticket. Keep this a small, complete extension: explicit authority options, an inspectable requirement and matching grader, and a recorded behavior comparison. Purpose remains contextual until a specific requirement has a validated grading contract.

Define and calibrate that grader before executing fresh agents. Version the brief, scenario scope and grading contract together. Compare configurations under identical requirements within each frozen contract, retaining all failures and uncertainty; comparisons across different requirements answer a different question and must stay separate.

Keep v2 with contract v1 as the simpler reference setup after the tie, while preserving v3 and every original result. This is an engineering preference, not a measured performance advantage. The four reserved cases remain reserved. Do not consume them or add another prompt-only candidate simply to manufacture a winner on the all-pass development set.

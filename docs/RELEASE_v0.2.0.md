# Taskwright v0.2.0

This release adds an external-agent integration, a browser report viewer, clearer onboarding and automated browser checks to the local support-agent evaluation lab.

## What's included

- **Standalone agents:** the versioned `taskwright-process-1` contract lets a separate program request documents and propose simulated actions. Taskwright enforces allowed tools and retains traces, structural checks and rejected responses.
- **External-agent workspace:** open the included three-case example or a local report, inspect replies and failure evidence, and export the original JSON. Files stay in browser memory; opening a report neither executes it nor authenticates its claims.
- **Clearer interface and setup:** the purple, white and black UI includes self-hosted typography, mobile navigation and quieter evidence disclosures. The README walks through cloning, starting the app, generating a report and opening it. Skip navigation preserves the current workspace and selection.
- **Inspectable verification:** Windows/Linux CI runs 162 Node tests, both offline demos, six Chromium browser checks per system, and before/after checks of 333 committed protected files. Browser failures retain local screenshots and traces, with CI upload configured.

## Try it

With Git and Node.js 24 installed:

```sh
git clone --branch v0.2.0 https://github.com/robertbradley-oss/taskwright.git
cd taskwright
npm start
```

Open http://127.0.0.1:4173/ and choose **External agents → Open offline example**. Leave the server running; in a second terminal in the same folder, `npm run demo:external` generates a new report. Open the printed report path through **Local report file**. Use `npm.cmd` in PowerShell if script execution blocks `npm`.

The saved app needs no dependency install, API key or login. Optional browser testing uses `npm ci`, `npx playwright install chromium`, then `npm run test:browser`; Linux may require `--with-deps` during browser installation. See [verification commands and scope](VERIFICATION.md).

## Evidence and limits

The external demo uses real child processes with deterministic behavior and injected faults. Its rejected JSON and denied handoff are deliberate; they are not observed model failures. The completed reply's structural checks do not establish semantic correctness. The optional model-backed example has mock-provider coverage; live-provider testing remains on hold.

The browser suite passed its [first hosted Windows/Linux run](https://github.com/robertbradley-oss/taskwright/actions/runs/34712382660). A local negative control also demonstrated that it catches the previous skip-navigation bug. Chromium desktop/mobile viewport coverage does not establish all-browser compatibility or human usability. Hosted failure-artifact upload has not been exercised because those jobs passed.

Original experimental records and grades remain intact, including the 9/12 continuation result. The four reserved cases remain unexecuted. The separately recorded documentation-only attribution revision retains prior hashes in the preservation manifest. The original `v0.1.0` tag remains unchanged.

This is a local source release under MIT. It does not deploy a hosted service, publish an npm package, update model weights or demonstrate a new agent-performance improvement.

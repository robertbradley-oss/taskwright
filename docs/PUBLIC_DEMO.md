# Read-only public demo

The focused entry is `/demo.html` when running `npm start`. The existing home page links to it and retains the full comparison and external-agent workflows.

The demo shows a retained failure immediately: the supplied ticket and actual reply, successful document reads and simulated handoff, then the receipt returned in a document-only field. Native links and disclosures work without JavaScript. Full attempt evidence, all 12 outcomes and report download remain available.

## Prepare a static site

With Node.js 24, run:

```sh
npm run build:demo
```

The output is `output/public-demo/`. Serve or upload **only that directory** to a static host. Its `index.html` is the entry point. Relative asset paths support both a domain root and a subdirectory such as `/taskwright/`. You can also open the generated HTML locally; HTTP serving is the browser-tested path.

The build verifies the committed continuation report against its seal before rendering. It copies the original report and seal bytes and an explicit asset allowlist: HTML, CSS, favicon, self-hosted font and license notices. It refuses unexpected existing output files. It includes no scripts, credentials, runtime records, server, execution API or model dependency. Do not publish the repository's local `server.mjs` as an internet service.

For a static host, use build command `npm run build:demo` and publish directory `output/public-demo`. No environment variables, dependency installation or server start command is required for the build. The static version links to GitHub for the full local application instead of advertising unavailable workbenches.

## Verification and publication status

On September 12, 2026, the prepared build passed the visitor journey at desktop 1280×800/dark and mobile 390×844/light under `/taskwright/`. Checks cover keyboard entry, native evidence disclosures, three retained failures among 12 outcomes, exact report download, reload, no page overflow, no scripts or API calls, and no browser errors. Existing local workflows remain covered by their six browser checks. The Node suite verifies the asset boundary and original export bytes.

The public source repository is accessible. The GitHub Pages API returned 404 for this repository during this task; a configured Pages site and public demo URL could not be verified. This work prepares the artifact, but does not publish a deployment, configure a hosting account, commit or push changes. A host destination still needs to be selected/configured and the resulting public URL verified before advertising a live demo.

This presentation changes no contracts, runs, grades or seals. The result remains 9/12; the four reserved cases remain unexecuted. The page distinguishes saved model evidence from scripted replay and fresh model execution. Seal consistency is not independent authenticity, and AI review is not human validation.

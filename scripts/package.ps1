$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$packageId = 'taskwright-prototype-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + ([guid]::NewGuid().ToString('N').Substring(0, 8))
$outputRoot = Join-Path $projectRoot 'output'
$packageRoot = Join-Path $outputRoot $packageId
New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null

# Explicit inclusion keeps Git metadata and unrelated local files out of the ZIP.
$files = @(
  '.gitignore', 'package.json', 'server.mjs', 'index.html', 'model.html',
  'lab.html', 'lab.js', 'lab.css', 'compare.html', 'compare.js', 'AGENT_DEMO.md', 'engine/scenario.js', 'engine/runner.js',
  'engine/configurations.js', 'engine/experiments.js', 'engine/queue.js',
  'brief.html', 'brief.js', 'BRIEF_CONTRACT.md', 'engine/briefs.js', 'engine/contract-evaluate.js', 'engine/contract-suites.js', 'engine/contract-archive.js',
  'test/briefs.test.js', 'test/contract-archive.test.js', 'scripts/freeze-brief-comparison.mjs', 'scripts/restore-brief-comparison.mjs',
  'evidence/brief-contract/contract.json', 'evidence/brief-contract/plan.json', 'evidence/brief-contract/report.json', 'evidence/brief-contract/seal.json', 'evidence/brief-contract/RESULTS.md',
  'evidence/brief-contract/integrity-before.json', 'evidence/brief-contract/integrity-after.json',
  'engine/scenarios.js', 'engine/semantic.js', 'engine/reference-set.js', 'review-ui.js', 'calibration.html', 'calibration.js',
  'test/semantic.test.js', 'scripts/calibrate.mjs', 'scripts/verify-coverage.mjs', 'scripts/restore-review-evidence.mjs',
  'evidence/semantic-calibration/manifest.json', 'evidence/semantic-calibration/report.json', 'evidence/semantic-calibration/RESULTS.md',
  'evidence/semantic-coverage/plan.json', 'evidence/semantic-coverage/report.json', 'evidence/semantic-coverage/revision-reassessment.json', 'evidence/semantic-coverage/RESULTS.md',
  'engine/evaluate.js', 'engine/assessments.js', 'engine/codex-adapter.js',
  'test/engine.test.js', 'test/server.test.js', 'test/experiments.test.js', 'scripts/restore-experiment.mjs',
  'evidence/prompt-comparison/RESULTS.md', 'evidence/prompt-comparison/experiment.json',
  'evidence/agent-baseline/RESULTS.md', 'evidence/agent-baseline/initial-contract-run.json',
  'evidence/agent-baseline/clarified-contract-run.json', 'evidence/agent-baseline/clarified-contract-reassessment.json',
  'app.js', 'scoring.js', 'style.css', 'README.md', 'CASE_STUDY.md',
  'DEMO_WALKTHROUGH.md', 'FACILITATOR.md', 'GAMEPLAN.md', 'REVIEW.md', 'AGENT_WORKFLOW.md', 'RENAMING.md', 'taskwright-rename-preservation.json', 'scripts/verify-rename.mjs',
  'scripts/package.ps1', 'test/scoring.test.js', 'test/simulation.test.js',
  'test/model.test.js', 'simulation/FINDINGS.md', 'simulation/attempts.json',
  'suite.html', 'suite.js', 'engine/suites.js', 'test/suites.test.js',
  'scripts/reserve-evaluation.mjs', 'scripts/run-conditional-handoff.mjs', 'scripts/archive-suite.mjs', 'scripts/restore-suite.mjs', 'scripts/recover-suite-start.mjs',
  'evidence/conditional-handoff/reservation.json', 'evidence/conditional-handoff/plan.json',
  'evidence/conditional-handoff/report.json', 'evidence/conditional-handoff/decision.json', 'evidence/conditional-handoff/archive.json',
  'evidence/conditional-handoff/METHOD.md', 'evidence/conditional-handoff/RESULTS.md', 'evidence/conditional-handoff/startup-recovery.json',
  'evidence/conditional-handoff/report-recovery.json',
  'simulation/model-match/PACKET.md', 'simulation/model-match/RUBRIC.md',
  'simulation/model-match/FINDINGS.md', 'simulation/model-match/attempts.json'
)
foreach ($caseNumber in 1..8) {
  $files += "evidence/semantic-calibration/d$caseNumber.json"
  $files += "evidence/semantic-calibration/v$caseNumber.json"
}
foreach ($coverageCase in @('retained-1','retained-2','retained-3','retained-4','vale-reset-fresh','vale-reset-contradiction','vale-eligibility-fresh','vale-eligibility-contradiction','vale-revision-fresh','vale-revision-contradiction')) {
  $files += "evidence/semantic-coverage/$coverageCase.json"
}
$suiteReport = Get-Content -LiteralPath (Join-Path $projectRoot 'evidence/conditional-handoff/report.json') -Raw | ConvertFrom-Json
foreach ($suiteScenario in $suiteReport.plan.scenarios) {
  $files += "evidence/conditional-handoff/$($suiteScenario.id).experiment.json"
  $files += "evidence/conditional-handoff/$($suiteScenario.id).start-claim.json"
}
foreach ($suiteTrial in $suiteReport.rows) {
  if ($suiteTrial.runId -notmatch '^[0-9a-f-]{36}$') { throw 'Invalid or unfinished suite trial' }
  $files += "evidence/conditional-handoff/$($suiteTrial.runId).json"
  if ($null -ne $suiteTrial.review) { $files += "evidence/conditional-handoff/$($suiteTrial.runId).review-claim.json" }
}
$manifest = foreach ($relative in $files) {
  $source = Join-Path $projectRoot $relative
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing package input: $relative" }
  $destination = Join-Path $packageRoot $relative
  New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination
  [pscustomobject]@{ path = $relative; sha256 = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant() }
}
$manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $packageRoot 'MANIFEST.json') -Encoding UTF8
$archive = Join-Path $outputRoot ($packageId + '.zip')
# Compress-Archive can omit hidden files; use .NET to include .gitignore consistently.
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($packageRoot, $archive)
[pscustomobject]@{ archive = $archive; source = $packageRoot; manifestEntries = $files.Count } | ConvertTo-Json

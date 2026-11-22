---
description: Add or update scenarios.js and sim.config.js for the given spec IDs, run them in the Test Lab and report
argument-hint: <spec IDs>
---
Run in a **module session**. Spec IDs: $ARGUMENTS

1. For each ID, add named single-mechanic cases to `test/scenarios.js` (shape documented at the top of
   that file). Use the spec's worked examples as expected values. Small stable datasets go in
   `test/fixtures/` (JSON, same shape as `/data`), loaded with `loadData(names, fixturesBase)`.
2. Add or update full-loop runs in `test/sim.config.js` where the IDs describe emergent behaviour
   (win rates, durations, distributions): `run`, `params`, `metrics`.
3. Run them: start the dev server (`.claude/launch.json` at the repo root, `tools/serve.ps1`), open
   `http://localhost:8080/tools/test-lab/?module=<name>`, and read `window.testsDone`
   (`{ pass, fail, results }`).
4. Report pass/fail per spec ID. A result that points to a rules problem goes into the report for the
   user, not into the spec. Commit with `test(<module>): <IDs>`.

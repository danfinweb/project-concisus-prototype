# Test Lab

Generic testbench: runs every target's `test/scenarios.js` (seeded, repeatable) and offers each `test/sim.config.js` sim as a batch run with a stats table.

- Open http://localhost:8080/tools/test-lab/ (`?module=tactical`, `&seed=N`).
- Results: `window.testsDone` → `{ pass, fail, ms, results, loadErrors }`.
- Next steps: Web Worker sim runner, distribution charts, comparing two runs.

# Tactical AI (unit and squad AI) — module rules

Read the root `CLAUDE.md` too (Claude Code loads it from the parent folders). This file adds the
module's own rules.

- **Owns:** state slice(s) `— (no state)`. **Produces:** tactical_commands. **Consumes:** tactical_perception_view.
- **Reads:** this folder, plus exactly what `SCOPE.md` lists (spec sections, interface schemas, data
  schemas, `shared/`). Edits only this folder (enforced by the edit hook).
- **Order of work:** test scenarios first, then `core/`, then the sim, then `adapter/`.
- `core/` stays pure: no DOM, no Three.js, no fetch, no `Math.random()` (use `shared/rng.js`). It may
  import only `shared/`. `adapter/` may import its own `core/`, `shared/` and the interface schemas.
- Never import another module or `tools/`. Talk to other modules only through `spec/interfaces/`.
- Balancing numbers come from `/data` through `shared/registry.js`, never inline.
- Spec gaps or contradictions go into `SCOPE.md` › Open questions and the report to the user. Never
  edit `spec/` or `design/` from here.
- Tests: `test/scenarios.js` (single mechanics), `test/sim.config.js` (full-loop runs),
  `test/fixtures/` (small datasets). Run them in the Test Lab:
  http://localhost:8080/tools/test-lab/?module=tactical-ai (dev server: `tools/serve.ps1` at the repo root).
- Commands here: `/scope`, `/test <IDs>`, `/integrate`, `/apply-spec <IDs>`, `/validate-data`.

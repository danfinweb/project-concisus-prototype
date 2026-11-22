---
description: Apply the listed spec changes in this module or tools pillar — tests first, then core, sim, adapter
argument-hint: <spec IDs>
---
Run in a **module or tools session**. Spec IDs: $ARGUMENTS

1. Re-read those sections in `spec/` and the latest `spec/reports/impact-*.md`. Refresh `SCOPE.md` if
   the IDs are new to this pillar.
2. In order: tests (`test/scenarios.js`, `test/sim.config.js`) → `core/` → the sim → `adapter/`.
   For tools: schema-driven forms pick up new fields on their own; change code only where behaviour changed.
3. Run the Test Lab until green. Report anything the spec doesn't settle as an open question.
4. Commit with `apply(<pillar>): <IDs>`.

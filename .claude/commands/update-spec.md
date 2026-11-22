---
description: Diff design/ against the last spec commit and update only the affected spec sections, schemas and interface versions; write an impact report
---
Run in the **root session** only.

1. Find the last commit that touched `spec/` (`git log -1 --format=%H -- spec`). Diff `design/` from that
   commit to now (`git diff <hash> -- design`). If `spec/` has never been committed, treat all of
   `design/` as new (first split).
2. Map each changed design passage to spec section IDs using `spec/_index.md`. IDs are
   `[AREA-NNN]`: `GEN` overview/campaign, `STR` strategic, `TAC` tactical, `MGT` management,
   `SAI` strategic AI, `TAI` tactical AI, `DAT` data definitions, `ITM` items, `TEC` presentation & tech.
   IDs are never reused or renumbered; a removed rule keeps its ID marked `(removed)`.
3. Update only the affected sections in `spec/<area>.md`. A spec section states the rule precisely
   (inputs, outputs, formula, ranges from the design), cites its design source, and never invents
   concrete numbers: where the design gives only a range or intent, the spec states the range and marks
   the concrete value as data (`→ data/<table>.json`). Open points go under **Open questions** in that file.
4. Update the schemas in `spec/interfaces/` (between modules) and `spec/interfaces/data/` (for `/data`
   tables) that the changed sections touch. Any interface change bumps its `version` (semver) and gets a
   line in `spec/interfaces/CHANGELOG.md`.
5. Update `spec/_index.md` (ID → module/tool, design source).
6. Write `spec/reports/impact-<YYYY-MM-DD>.md`: changed spec IDs → affected modules and tools, interface
   version bumps, and data that may now fail validation (run `/validate-data` logic mentally or via the page).
7. Never edit `design/`. Commit with message `spec: <summary>`.

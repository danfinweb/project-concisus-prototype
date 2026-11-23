---
description: Bring spec/ in line with design/ — a full split on the first run, afterwards only the sections affected by design changes since the recorded baseline, plus a cleanup of spec-internal SCOPE findings (`cleanup`); write an impact report
---
Run in the **root session** only.

1. **Check the input.** If `git status --porcelain -- design` shows uncommitted changes, stop and ask the
   user to commit the refreshed `design/` first: the spec is always built from a committed design state.
   Note the current commit: `git rev-parse --short HEAD` — the new baseline.
2. **Choose the mode** from `spec/_index.md`:
   - **First split** — the IDs table has no IDs yet, or the `Design baseline:` line names no commit. Treat all of
     `design/` as new: go through every section of every file mapped in the area table.
   - **Update** — otherwise. Diff `design/` from the recorded baseline to now
     (`git diff <baseline> HEAD -- design`). If the diff is empty, report "design unchanged since
     <baseline>" and stop without writing anything — unless the user passed `cleanup`.
   - **Cleanup** — `/update-spec cleanup`, alone or together with an update. Input: the **Open
     questions** of every `SCOPE.md` (modules and tools) and of the latest impact report. Fix only what
     the spec gets wrong without needing a design decision: two names for one value, a value with no
     schema field, a section listing fields its schema lacks, two owners for one value, a table or field
     the design already implies. Anything that needs a design decision is not fixed; list it in the
     report under **Needs a design decision**. A cleanup alone keeps the `Design baseline:` line.
3. Map each new or changed design passage to spec section IDs using `spec/_index.md`. IDs are
   `[AREA-NNN]`: `GEN` overview/campaign, `STR` strategic, `TAC` tactical, `MGT` management,
   `SAI` strategic AI, `TAI` tactical AI, `DAT` data definitions, `ITM` items, `TEC` presentation & tech.
   IDs are never reused or renumbered; a removed rule keeps its ID marked `(removed)`. Design passages
   with no rule in them (lore, flavour, tone) get no ID.
4. Write or update only the affected sections in `spec/<area>.md`. A spec section states the rule
   precisely (inputs, outputs, formula, ranges from the design), cites its design source
   (`design/<file>.md › <heading>`), and never invents concrete numbers: where the design gives only a
   range or intent, the spec states the range and marks the concrete value as data
   (`→ data/<table>.json`). Parts marked OPTIONAL or "ignore for the first build iterations" get an ID
   tagged `(optional)`. Open points and contradictions go under **Open questions** in that file.
5. Update the schemas in `spec/interfaces/` (between modules) and `spec/interfaces/data/` (for `/data`
   tables) that the new or changed sections touch. Any interface change bumps its `version` (semver) and
   gets a line in `spec/interfaces/CHANGELOG.md`.
6. Update `spec/_index.md`: the IDs table (ID → title, module/tool, design source) and the line
   `Design baseline: <commit from step 1>`.
7. Write `spec/reports/impact-<YYYY-MM-DD>.md`: mode (update, cleanup or both), baseline old → new, new/changed/removed spec IDs →
   affected modules and tools, interface version bumps, data that may now fail validation, and for a
   cleanup each SCOPE finding with its outcome (fixed in <ID>, or needs a design decision).
8. Never edit `design/`. Commit with message `spec: <summary>`.

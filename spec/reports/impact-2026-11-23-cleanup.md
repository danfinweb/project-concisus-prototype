# Impact report — 2026-11-23 (update + cleanup)

**Mode:** update and cleanup · **Design baseline:** `eb072a2` → `f82ec75`

The design refresh `44887c7` (squads on foot, no checkpoints, Krug market as a tile flag, a biome per
strategic terrain type) is now in the spec. The same run also cleaned up the spec-internal findings that the
SCOPE refresh of all six pillars turned up. There are 392 IDs now (5 new), about 120 sections changed, and
nothing was removed.

## What changed in the design

- **Vehicles:** a squad has at most one vehicle. Without one it travels on foot (2 h per tile, 3 in
  mountains) and carries only what its soldiers carry. The vehicle profile no longer has a checkpoint
  effect.
- **Checkpoints:** removed everywhere: the asphalt road, the checkpoint pass item, the found-in lists and
  martial law (now "Curfews in all held cities").
- **Map:** Krug markets are a flag on a town or city tile, not a point of interest. Each strategic terrain
  type maps to a biome, which selects the tactical terrain and prefab tables.

## Cleanup rules applied

These follow from the spec itself, not from the design:

- **Names:** camelCase is canonical in spec text, matching the schemas. Mission type IDs stay lowercase,
  as the ID pattern requires.
- **One owner per value:**
  - falloff floor: `falloffFloor` (TAC-048)
  - stall: `stallTurns`
  - battle duration: TAC-003 `battleDurationHours`; the result field is `gameTimeHours`
  - relation range: STR-051
  - helicopter constants: STR-034
  - pay interval: `economy-rules.payIntervalHours`
  - weight penalty: TAC-027
  - low-reputation threshold: the MGT-054 standing thresholds
  - faction → doctrine link: `factions.doctrine`
  - scav loadout: `management-rules.scavLoadout`
- **Missing schema fields:** every Values line now has a schema field, with nested paths named in the text.
- **Section/schema mismatches:** sections now use the schema's field names. TAI-004/005 match the view and
  command schemas: there is no `takeCover` command and no query functions, and `allowedActions` carries the
  precomputed previews. SAI-004 lists all 11 strategic commands.
- **Contracts:** each offer has an `id`, `targetFaction`, `reputationGain`, `reputationGate {better,
  sensitive}` and a per-mission `key`. Offers reach Management as a `contractOffer` request, and
  Management now produces `management_view`.

## Spec IDs

| Area | New | Changed (main) | Affects |
| --- | --- | --- | --- |
| TAC | TAC-080 Tactical map from the encounter tile | 001, 003, 013, 027, 038, 043, 044, 047, 048, 052–055, 057, 058, 060–063, 070, 076–079 | tactical, tools (mapgen) |
| TAI | — | 001, 002, 004–006, 008–011, 013, 015, 018 | tactical-ai, tactical |
| STR | STR-095 Strategic terrain table, STR-096 Raising a squad | 004–008, 010, 012, 014, 015, 017, 021–025, 028, 030–036, 038, 040–044, 046–049, 051, 055, 059, 060, 069, 070, 077, 089, 092, 094 | strategic, strategic-ai, management |
| SAI | SAI-016 Desperate measure choice | 003, 004, 008–010, 013, 014 | strategic-ai |
| GEN | — | 007–010, 012, 013, 015–017 | all modules |
| MGT | MGT-072 Management view | 001, 005, 011, 023, 033, 038, 040–043, 047, 053–057, 060, 066–068, 070, 071 | management, strategic |
| DAT, ITM | — | DAT-001, 002, 011, 014, 016, 024, 025 (retitled), 027, 028; ITM-016, 019, 024–026, 028, 031 | tools, tactical, management |
| TEC | — | 001, 004, 005, 007, 022, 025 | game, tools |

STR-033 is retitled "Vehicle profile". Its checkpoint content is gone, and the ID is kept.

## Interfaces and data schemas

See `spec/interfaces/CHANGELOG.md` (2026-11-23 rows).

- **New interfaces:**
  - `management_view` 0.1.0
- **New tables:**
  - `data/strategic-terrain` 0.1.0, added to `data/tables.json` (empty for now)
- **Interface bumps:**
  - tactical_map_request 0.5.0
  - tactical_perception_view 0.4.0
  - tactical_commands 0.3.1
  - battle_result 0.3.1
  - strategic_commands 0.5.0
  - strategic_perception_view 0.5.0
  - management_requests 0.4.0
- **Data schema bumps:**
  - items 0.5.0
  - tactical-rules 0.5.0
  - strategic-rules 0.4.0
  - management-rules 0.5.0
  - ai-doctrines 0.3.0
  - vehicles 0.3.0
  - poi 0.4.0
  - factions 0.4.0
  - events 0.4.0
  - mapgen-strategic 0.4.0
  - mapgen-tactical 0.3.0
  - terrain 0.3.0
  - prefabs 0.3.0
  - recruitment 0.3.0
  - presets 0.3.0
  - presentation 0.3.0
- **Data that may fail validation once content exists:**
  - weapons need `feedType`
  - medical and magazine items need `weightKg`
  - mod `modifiers` keys are checked per slot
  - poi `services` no longer accepts `krugMarket`
  - vehicles may not carry `pilotTechnicalMin` or `hoursPerRegion`
  - presets may not carry `priceUsd`
  - All tables are still empty, so nothing fails today.

## SCOPE findings

| Pillar | Fixed | Needs a design decision |
| --- | --- | --- |
| tactical | 1, 4, 8–17 | — |
| tactical-ai | 1–8 | — |
| strategic | 1–7, 9, 10 | 8 (part): definitions of "front sector" and "area" (STR Q42) |
| strategic-ai | 1–7 | — |
| management | 1–7 | — |
| tools | 1–5, 7 | 6: tactical map generation stages are not designed (TAC-080, TAC Q51) |

Every pillar should re-run `/scope` to pick up the new versions and close its findings.

## Needs a design decision

- **TAC:**
  - Q51: the tactical map generation stages.
  - Q52: whether the request's exits replace or add to the generated exits.
- **STR:**
  - Q41: does the vehicle profile have any effect now?
  - Q42: front sector and area definitions.
  - Q43: raising a squad (size, gear, cost, time).
  - Q44: supplies and loot of a squad on foot.
- **SAI:**
  - Q13: does the Krug always accept `hireEscort`?
- **MGT:**
  - Q39: is `reputationGain` per contract or per mission?
  - Q41: `intelNeeds` as a source goal without a squad goal.
- **DAT:**
  - Q32: the tactical sub-slot takes no modifiers.

## Open questions (unresolved)

| File | Unresolved |
| --- | --- |
| tactical.md | 23 |
| strategic.md | 29 |
| management.md | 31 |
| data.md | 21 |
| tactical-ai.md | 5 |
| strategic-ai.md | 6 |
| overview.md | 8 |
| tech.md | 9 |

## Next steps

1. Re-run `/scope` in every pillar.
2. Answer the design questions above in the next design pass.

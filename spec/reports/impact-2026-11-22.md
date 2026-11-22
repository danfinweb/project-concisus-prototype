# Impact report — 2026-11-22

**Mode:** first split · **Design baseline:** none → `9c7498b`

All of `design/` (GDD, item list, tactical actions, strategic actions, world events, callsigns) was split
into 375 spec IDs. `design/story-lore.md` is lore and has no IDs. Every ID is new, so every module and
tool is affected; each should run `/scope` before its first `/test`.

## Spec IDs

| Area | File | IDs | Status open | Optional | Open questions | Implemented by |
| --- | --- | --- | --- | --- | --- | --- |
| GEN | overview.md | 18 (GEN-001..018) | 7 | 0 | 8 | all modules |
| STR | strategic.md | 91 (STR-001..091) | 55 | 1 | 25 | modules/strategic |
| TAC | tactical.md | 74 (TAC-001..074) | 33 | 0 | 31 | modules/tactical |
| MGT | management.md | 71 (MGT-001..071) | 22 | 5 | 26 | modules/management |
| SAI | strategic-ai.md | 14 (SAI-001..014) | 3 | 0 | 8 | modules/strategic-ai |
| TAI | tactical-ai.md | 18 (TAI-001..018) | 6 | 0 | 8 | modules/tactical-ai |
| DAT, ITM | data.md | 29 + 30 (DAT-001..029, ITM-001..030) | 6 | 0 | 22 | /data, tools |
| TEC | tech.md | 30 (TEC-001..030) | 3 | 2 | 9 | game/, tools/ |
| **Total** | | **375** | **135** | **8** | **137** | |

"Status open" means the design leaves the value or part of the rule unset ("not set (design: Open)"); the
rule shape is specced and the value is a design decision still to make. Optional IDs (earned callsigns,
deeds, skill drift, hidden cities, PSX quirks, cloud save) stay out of the first build iterations.

## Interfaces

| Interface | Version | Producer → consumers |
| --- | --- | --- |
| tactical_map_request | 0.1.0 → 0.2.0 | strategic → tactical |
| battle_result | 0.1.0 → 0.2.0 | tactical → strategic, management |
| tactical_perception_view | 0.1.0 → 0.2.0 | tactical → tactical-ai |
| tactical_commands | 0.1.0 → 0.2.0 | tactical-ai → tactical |
| strategic_perception_view | 0.1.0 → 0.2.0 | strategic → strategic-ai |
| strategic_commands | 0.1.0 → 0.2.0 | strategic-ai → strategic, management |
| management_requests | new, 0.1.0 | strategic → management |

`management_requests` is new: the strategic layer asks Management to change its slices (hire, trade,
accept contract, op return, plant output, daily rollover, reputation acts). The SCOPE.md of
`modules/strategic` and `modules/management` don't list it yet — their `/scope` run picks it up.

## Data tables

- `items` schema is complete (DAT/ITM): one record per item, `kind` discriminates weapon, mod, calibre,
  ammo, helmet, bodyArmour, vest, belt, backpack, medical, barter, opItem. Calibres and ammo loads live
  in items (DAT-001).
- 12 new tables, registered in `data/tables.json` with schemas: `vehicles`, `factions`, `poi`, `events`
  (keyed records) and `tactical-rules`, `strategic-rules`, `management-rules`, `callsigns`,
  `recruitment`, `traders`, `loot`, `presentation` (named constants).
- Field lists added for `presets`, `prefabs`, `terrain`, `missions`, `mapgen/strategic`,
  `mapgen/tactical`, `ai/doctrines`.
- All tables are still empty. Constant fields are optional until the content pass: the spec lists the
  design placeholder for each (`**Values.**` lines), to be entered with the tools.
- Data that may now fail validation: none (all tables empty). Plant output was referenced twice
  (MGT-068 `industry.json`, STR-015 `poi.json`); unified on `data/poi.json`.

## Assumptions to confirm

The split agents filled some gaps with the simplest reading; each is also an open question in its file:

- TAC: costs round down and are at least 1; sprint surcharge charged at activation end; one reaction
  attempt per mover per entry into the vision cone; the shot preview uses its own RNG stream.
- STR: one command set per faction per hour (the design phrases this three ways); roads are links on top
  of region terrain; map generation follows the design's stage order (industry before roads).
- MGT/GEN: reputation spill-over rounds toward zero and never cascades; an op succeeds if at least one
  soldier reaches an FOB; Hostile standing blocks contracts and trade like Unfriendly.
- SAI/TAI: the utility-AI tiers, survival multiplier and blackboard come from the workflow doc, not the
  GDD; behaviour values are unset.
- DAT: 12 gauge damage per load via `damageOverride` / `projectilesOverride` on ammo.

## Biggest open questions

- Most tactical action costs are unset (movement surcharges, aim, reload, swap, throw).
- Faction actions per hour vs per squad; interrupting multi-hour actions; several player squads.
- AI faction economy has no owner, but the "low liquidity" crisis sign needs it.
- Arm/leg wounds lowering AP (design.md) vs the AP modifier list (tactical-actions.md).
- Bleeding treatment: "only field fix for thorax and head" (item list) vs medkit/IFAK effects.

## Next steps

1. Answer or decide the open questions in the design docs; the next `/update-spec` picks up the changes.
2. Each module and the tools: `/scope`, then `/test` for the first IDs (build order: tactical first).
3. Tools: item editor and a first content set from `design/item-list.md`; fill the `*-rules` constants
   with the design placeholders.

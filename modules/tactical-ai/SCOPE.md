# Tactical AI (unit and squad AI) — scope

Refreshed by `/scope` (2026-11-23, spec `931ee45`, design baseline `eb072a2`). Lists everything this module
may read outside its folder.

## Spec IDs

Source: `spec/tactical-ai.md` (area TAI, 18 IDs, all mapped to `modules/tactical-ai` in `spec/_index.md`).
`(open)` = the design leaves a value or rule unset; build with a stub or draft and flag it. No TAI ID is
optional or removed. All behaviour values (weights, curves) are unset and live in `data/ai/doctrines.json`.

**Controller contract**

| ID | Summary |
| --- | --- |
| TAI-001 | TAC decides when a unit acts, the AI what it does: pure `decide(view, rng) → { commands, blackboardWrites, log }`, deterministic |
| TAI-002 | Called at an AI unit's activation and when the AI side picks whom to activate; enemies and allied AI; never for the neutral side or mid-move |
| TAI-003 | Controller plugged in per unit by the shell or Test Lab (real AI, stub, second AI); same view and command interfaces |
| TAI-004 | Perception view under fog of war: side, squad state, plan, blackboard, known enemies/neutrals, noises, known map, battle goal, queries |
| TAI-005 | Command set = the player's commands, one per TAC action; TAC validates and rejects illegal ones |
| TAI-006 | Reads only its view, queries and `/data`; issues only TAI-005 commands; tests assert no hidden units in the view |

**Decision structure**

| ID | Summary |
| --- | --- |
| TAI-007 | Utility AI: `score = survival × (wGoal × goal + wFit × fit + wCoord × coord)`, each 0–1 via doctrine curves; ties by `rng` |
| TAI-008 | Survival (0–1) from exposure, known threat, HP and morale; dominates as danger rises, never blocks outright |
| TAI-009 | (open) Battle goal progress toward the side's objective and squad plan; `acceptableLoss` share reached → retreat to an exit |
| TAI-010 | Action fit from role, weapon type (DAT-011), range, ammo and AP left |
| TAI-011 | Coordination bonus for answering blackboard requests, penalty for squadmates' claims |
| TAI-012 | Squad blackboard of requests and claims, stored by TAC in `battle`, changed only via `blackboardWrites` |
| TAI-013 | (open) Squad leader = highest rank; sets plan and roles; successor takes over at its next activation; tie-break not set |
| TAI-014 | (open) Roles `flank`, `suppress`, `retreat`, `callReinforcements` change action fit; reinforcements not designed |
| TAI-015 | Doctrines in `data/ai/doctrines.json` (`layer: "tactical"`), passed per side or squad; set weights and curves |
| TAI-016 | Decision log per call: turn, unit, chosen command, top options with total and four consideration scores; AI keeps none |

**Faction behaviour in battle**

| ID | Summary |
| --- | --- |
| TAI-017 | (open) Neutral side controlled by `tactical-ai`: never activates, only takes cover, flees or turns hostile; how reactions are chosen not designed |
| TAI-018 | Allied AI units on the player side; escorted VIP AI-controlled by default, `vipControl: player` swaps its controller |

**Also reads** (rules this module depends on but does not own)

| ID | File | Why tactical-ai reads it |
| --- | --- | --- |
| TAC-001, TAC-005, TAC-008, TAC-010, TAC-012 | `spec/tactical.md` | Sides, activation choice, eligibility and pass |
| TAC-019, TAC-020..TAC-023, TAC-075 | `spec/tactical.md` | Noises/alerted, reaction settings and overwatch the AI chooses |
| TAC-024, TAC-037, TAC-046 | `spec/tactical.md` | Action costs, path preview and shot preview behind the queries |
| TAC-038, TAC-058, TAC-059, TAC-070, TAC-074, TAC-076 | `spec/tactical.md` | Exits (retreat), limb states, side-visible searched contents, carry/drag, objectives |
| DAT-011 | `spec/data.md` | `weaponType` drives the AI role |
| SAI-013 | `spec/strategic-ai.md` | Hostility toward the player (who is enemy or neutral) |
| MGT-008, MGT-044 | `spec/management.md` | Squad morale (survival input); mission goals behind allied battle goals |
| TEC-012, TEC-015, TEC-016 | `spec/tech.md` | Pure rules core, seeded randomness, debug overlay for the decision log |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/tactical_commands.schema.json` | produces (to tactical) | 0.3.0 |
| `spec/interfaces/tactical_perception_view.schema.json` | consumes (from tactical) | 0.3.0 |

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/ai/doctrines.json` | `spec/interfaces/data/ai-doctrines.schema.json` | 0.2.0 | Tactical doctrines: weights, curves, roles, `logTopN` |
| `data/items.json` | `spec/interfaces/data/items.schema.json` | 0.4.0 | Read-only lookups of own gear (`weaponType`, ranges, ammo) for action fit |

## State slices

- Owns: none (no state)
- Reads: none directly. The `battle` slice (incl. the squad blackboard) reaches the AI only through
  `tactical_perception_view`; changes go back only as `tactical_commands` and `blackboardWrites`.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Found while scoping; report to the root session, do not edit `spec/`. The 8 open questions in
`spec/tactical-ai.md` › Open questions still apply.

1. **Command set vs schema.** TAI-005 lists `takeCover`, `shoot.aimLevel`, `throwGrenade.grenade`,
   `useItem.targetUnit`, a reload source container and one `interact` group; `tactical_commands` 0.3.0 has no
   `takeCover` type and uses `aimSteps`, `item`, `unit`, `sourceSlot`, separate interaction types, plus `vault`/`climb`.
2. **Queries.** TAI-004/006 give the AI `queries` (read-only functions), but TAI-001's `decide(view, rng)` has
   no query argument and `tactical_perception_view` 0.3.0 has no `queries`, only a required `allowedActions` list.
3. **View fields.** TAI-004 lists enemy `facing`, `battleGoal` targets, searched containers/bodies and smoke in
   `map`; the 0.3.0 schema lacks them and adds `objectives`, `role`, `noises.direction/distance` not in TAI-004.
4. **Rank source.** TAI-013 (open) and question 13 ask where an AI soldier's rank comes from, but
   `tactical_map_request` 0.4.0 already has a per-unit integer `rank` "sets the AI squad leader (TAI-013)".
5. **Doctrine per squad.** TAI-015 passes a doctrine per side or squad; `tactical_map_request` 0.4.0 and the
   view carry one `doctrine` per side only.
6. **Stale schema text.** `tactical_map_request` `battleGoal` still says the unit of `acceptableLoss` is open
   (question 9), which TAI-009 resolved (share 0–1).
7. **Allied VIP goal.** TAI-018 says allied units' `battleGoal` comes from the mission; the map request keys
   `battleGoal` by AI side faction, so a single AI-controlled VIP inside the player side has no goal entry.
8. **Doctrine fields.** `ai-doctrines.schema.json` 0.2.0 has no explicit field for TAI-009 goal weights per goal
   type or TAI-011 bonus/penalty sizes; confirm they live in the generic `considerations`.

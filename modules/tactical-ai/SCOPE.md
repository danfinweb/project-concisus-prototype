# Tactical AI (unit and squad AI) — scope

Refreshed by `/scope` (2026-11-24, spec `a0210cd` cleanup, design baseline `c1333f3`). Lists everything this
module may read outside its folder.

## Spec IDs

Source: `spec/tactical-ai.md` (area TAI, 18 IDs, all mapped to `modules/tactical-ai` in `spec/_index.md`).
`(open)` means the design leaves a value or rule unset: build it with a stub or a draft value and flag it.
`(optional)` means a later build. Spec questions 1–14 are resolved; question 15 (a hostile neutral side's
doctrine and goal) is open. Every behaviour value (weights, curves, `logTopN`) is unset and lives in
`data/ai/doctrines.json`, which is empty (`{}`) for now; tests use `test/fixtures/`.

**Controller contract**

| ID | Summary |
| --- | --- |
| TAI-001 | TAC decides when a unit acts, the AI decides what it does. Pure `decide(view, rng) → { commands, blackboardWrites, log }`, deterministic. No third argument and no query functions: previews arrive precomputed in `allowedActions` |
| TAI-002 | Called at each AI activation. With `activeUnit: null` the AI picks a unit (`activate`) or passes, then TAC calls again for that unit. Never called for an unprovoked neutral unit or mid-move; reactions are applied by TAC |
| TAI-003 | Controller plugged in per unit by the shell or Test Lab (real AI, stub, second AI); all use the same view and command interfaces |
| TAI-004 | Perception view under fog of war: squad (`rank`, per-soldier `morale`, `role` or null, `weaponJammed`, limbs), `squadMorale`, typed `squadPlan` and `blackboard`, `rejection`, known enemies (gear as the player sees it) and neutrals, noises, known map, `allowedActions` (one `activate` per eligible unit plus `pass` when `activeUnit` is null), `battleGoal`, `objectives` |
| TAI-005 | Command set = the player's commands (incl. `swapWeapon.slot`, `clearJam`, `closeDoor`), one per TAC action. No `takeCover` command. TAC rejects an illegal command and asks again with the view's `rejection` (command and reason), up to `commandRetries`; every rejection is logged |
| TAI-006 | Reads only its view and `/data`; issues only TAI-005 commands. Tests assert the view has no hidden units except last-known entries |

**Decision structure**

| ID | Summary |
| --- | --- |
| TAI-007 | Utility AI: `score = survival × (wGoal × battleGoal + wFit × actionFit + wCoord × coordination)`, each in 0–1 through doctrine curves; ties broken by `rng` |
| TAI-008 | Survival (0–1) from exposure, known threat, HP and the unit's own `squad[].morale` (Leadership bonus already included). Dominates as danger rises; never blocks an action |
| TAI-009 | (open: threshold values) Goal progress toward the active unit's `battleGoal` and the squad plan; goal weights are flat doctrine entries `battleGoal.<goal>`. Once the `acceptableLoss` share (dead or left the map, never wounded) is reached, the side retreats to an exit and still fires |
| TAI-010 | Action fit from role, weapon type (DAT-011), range, ammo and AP left |
| TAI-011 | Coordination: bonus for answering blackboard requests, penalty for squadmates' claims (`considerations.requestBonus` / `claimPenalty`) |
| TAI-012 | Squad blackboard: `requests` (`id`, `type`, `by`, optional `target`, `tile`, `sector`, `untilTurn`, `data`) and `claims` (`id`, `unit`, `kind` tile/target/request, the claimed item, optional `untilTurn`), stored by TAC. Changed only through `blackboardWrites` ops `addRequest`, `removeRequest`, `addClaim`, `removeClaim`, `setPlan`, applied in order; expired entries are dropped by TAC |
| TAI-013 | Leader = highest Management rank (`recruit` < `regular` < `veteran` < `elite`); ties go to the higher attribute average, then request order. TAC sets `squadPlan.leader`. The leader writes `setPlan` (`roles`, `intent`); TAC applies it only from the current leader and records `setBy`, `setTurn`. When the leader dies or leaves the map, the successor takes over at its next activation and keeps the plan. The Leadership bonus is TAC's job, so the AI adds nothing |
| TAI-014 | Roles are a closed set: `flank`, `suppress`, `retreat` change action fit; `callReinforcements` is (optional), never assigned until built. `squad[].role` is null while a unit has none |
| TAI-015 | Doctrines in `data/ai/doctrines.json` (`layer: "tactical"`), one per side (`view.doctrine`); they set the weights and curves of TAI-007..TAI-014 |
| TAI-016 | Decision log per call (commands `$defs.logEntry`): `turn`, `unit` (null for the activation choice), `chosen`, `options[]` best first (`command`, `score`, the four parts), up to `logTopN`, and the answered `rejection` on a retry. The AI keeps none |

**Faction behaviour in battle**

| ID | Summary |
| --- | --- |
| TAI-017 | Neutral side: until attacked it never activates and the AI is not called (TAC-001's fixed rule: civilians flee, armed neutrals take cover). Once hostile, its units form a third side that the AI commands like any AI side, activating after the opponent. Its doctrine and goal are open (spec question 15) |
| TAI-018 | Allied AI units on the player side (defenders, convoy, escorted VIP) use the player side as `side`; a per-unit `battleGoal` overrides the side's goal. The VIP is AI-controlled by default; `vipControl: player` hands it to the player, and it then never reacts |

**Also reads** (rules this module depends on but does not own)

| ID | File | Why tactical-ai reads it |
| --- | --- | --- |
| TAC-001, TAC-003, TAC-005, TAC-007, TAC-008, TAC-010, TAC-012 | `spec/tactical.md` | Sides (neutral and third side), day/night, activation choice and eligibility, final facing, pass |
| TAC-017, TAC-019..TAC-023, TAC-075, TAC-081 | `spec/tactical.md` | Turning, noises and alerted state, reaction settings, overwatch, sight |
| TAC-024, TAC-029..TAC-034, TAC-037, TAC-038 | `spec/tactical.md` | Action costs, movement, stance, vault and climb, path preview, exits (retreat) |
| TAC-039..TAC-043, TAC-046, TAC-079, TAC-082, TAC-083 | `spec/tactical.md` | Fire, aim, reload, weapon swap (holster), grenades and smoke, shot preview, concealment, jams |
| TAC-058, TAC-059, TAC-064..TAC-074, TAC-084 | `spec/tactical.md` | Limb states, medical use, item access and backpack, looting, locks, charges, VIP restraint, carry/drag, doors |
| TAC-076, TAC-094, TAC-095, TAC-096 | `spec/tactical.md` | Map objectives, squad leader and Leadership bonus, per-soldier battle morale, perks (applied by TAC, already in the previews) |
| TAC-077 | `spec/tactical.md` | (optional) morale flight; may later override an AI unit's choice |
| DAT-011 | `spec/data.md` | `weaponType` drives the AI role |
| SAI-013 | `spec/strategic-ai.md` | Hostility toward the player (who is an enemy, who is neutral) |
| MGT-008, MGT-044 | `spec/management.md` | Morale range and persistence; mission goals behind allied battle goals |
| TEC-012, TEC-015, TEC-016 | `spec/tech.md` | Pure rules core, seeded randomness, debug overlay for the decision log |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/tactical_commands.schema.json` | produces (to tactical) | 0.6.0 |
| `spec/interfaces/tactical_perception_view.schema.json` | consumes (from tactical) | 0.7.0 |
| `spec/interfaces/tactical_map_request.schema.json` | reference only (source of `doctrine`, `rank`, `morale`, `battleGoal`, `vipControl` in the view; never read at runtime) | 0.9.0 |

Changes since the last scope (cleanup `a0210cd`, `spec/interfaces/CHANGELOG.md`):
- View 0.7.0: typed `squadPlan`, `blackboard` and `knownNeutrals`; role enum (or null); `allowedActions[].unit`
  for activate; new `rejection`.
- Commands 0.6.0: typed `blackboardWrites` (five ops) and `log` entries.
- Map request 0.9.0: `units[].perks`; `acceptableLoss` text fixed.

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/ai/doctrines.json` | `spec/interfaces/data/ai-doctrines.schema.json` | 0.5.0 | Tactical doctrines: `wGoal`, `wFit`, `wCoord`, flat `considerations` (name → {weight, curve}; dotted names such as `battleGoal.attack`), `roles` (reserved, free object), `logTopN`. The file is empty; tests use fixtures |
| `data/items.json` | `spec/interfaces/data/items.schema.json` | 0.9.0 | Read-only lookups of own gear (`weaponType`, magazine size) for action fit |

Not read: `data/tactical-rules.json`. TAC itself counts `commandRetries` (TAI-005) and checks
`activationCost` (now in `allowedActions`). The Leadership bonus (`data/management-rules.json`) is already
included in the view's `morale`.

## State slices

- Owns: none (no state).
- Reads: none directly. The `battle` slice, including the squad blackboard and plan, reaches the AI only
  through `tactical_perception_view`. Changes go back only as `tactical_commands` and `blackboardWrites`.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Found while scoping and writing the tests, for the root session. `spec/` is not edited from here.

Resolved by the cleanup `a0210cd`, from the previous scope: 1 (TAI-005 table), 2 (`acceptableLoss` text),
3 (flat dotted consideration names), 4 (typed blackboard, plan, writes, log, neutrals), 5 (activate entries
per eligible unit), 6 (leader leaving the map), 8 (role enum). Finding 7 (a hostile neutral side's doctrine
and goal) is now spec question 15, which still needs a design decision.

Open (found by `/test`, commit `526fda8`; the tests use the assumption shown):

1. **No max HP in the view.** `squad[].zoneHp` is a plain object, but survival (TAI-008) needs the share of HP
   left. Tests assume zone → `{ hp, max }`.
2. **Move path vs path preview.** A `move` command needs `path` (tiles), but `allowedActions` move entries only
   list the destination tile, its AP cost and AP left (TAC-037). Does TAC accept a path given by its end tile
   only, or should the preview carry the path? Tests accept any path that ends on a reachable tile.
3. **Tile and equipment shapes.** `map.tiles[]` (cover per edge, flags) and `squad[].equipment` are plain
   objects. Exposure and action fit need them. Tests assume tiles
   `{ x, y, level, cost, impassable, obscuring, cover: { n, e, s, w } }` (`none` | `half` | `full`) and
   equipment slot → `{ item, rounds }`.
4. **"Left the map" is not visible.** `acceptableLoss` counts soldiers who left the map (TAI-009), but the
   view does not say whether those soldiers are still listed in `squad[]` or how they are marked. Tests count
   only `outOfAction` units.
5. **Goal names.** `battleGoal.goal` is a free string; TAI-004 names "attack, defend, escort, reach an exit,
   hold", and the doctrine uses `battleGoal.<goal>` names. Tests use `attack`, `defend`, `escort`,
   `reachExit`, `hold`, plus `retreat` for the TAI-009 switch. Should the schema list the enum?
6. **Hostile neutral side** (spec question 15, TAI-017). It has no `doctrine` or `battleGoal` in the request.
   Not covered by the tests until decided.

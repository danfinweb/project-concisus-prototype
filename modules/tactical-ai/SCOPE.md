# Tactical AI (unit and squad AI) — scope

Refreshed by `/scope` (2026-11-24, spec `e8aa7e7`, design baseline `c1333f3`). Lists everything this module
may read outside its folder.

## Spec IDs

Source: `spec/tactical-ai.md` (area TAI, 18 IDs, all mapped to `modules/tactical-ai` in `spec/_index.md`).
`(open)` means the design leaves a value or rule unset: build it with a stub or a draft value and flag it.
`(optional)` means a later build. The spec's 14 open questions are all resolved. Every behaviour value
(weights, curves, `logTopN`) is unset and lives in `data/ai/doctrines.json`, which is empty (`{}`) for now.

**Controller contract**

| ID | Summary |
| --- | --- |
| TAI-001 | TAC decides when a unit acts, the AI decides what it does. Pure `decide(view, rng) → { commands, blackboardWrites, log }`, deterministic. No third argument and no query functions: previews arrive precomputed in `allowedActions` |
| TAI-002 | Called at each AI activation. With `activeUnit: null` the AI picks a unit (`activate`) or passes, then TAC calls again for that unit. Never called for an unprovoked neutral unit or mid-move; reactions are applied by TAC |
| TAI-003 | Controller plugged in per unit by the shell or Test Lab (real AI, stub, second AI); all use the same view and command interfaces |
| TAI-004 | Perception view under fog of war: squad (incl. `rank`, per-soldier `morale`, `weaponJammed`, limbs), `squadMorale`, plan, blackboard, known enemies (gear as the player sees it), neutrals, noises, known map (doors, smoke, containers), `allowedActions`, `battleGoal`, `objectives` |
| TAI-005 | Command set = the player's commands, one per TAC action. No `takeCover` command. TAC rejects an illegal command with a reason and asks again, up to `commandRetries`; every rejection is logged |
| TAI-006 | Reads only its view and `/data`; issues only TAI-005 commands. Tests assert the view has no hidden units except last-known entries |

**Decision structure**

| ID | Summary |
| --- | --- |
| TAI-007 | Utility AI: `score = survival × (wGoal × battleGoal + wFit × actionFit + wCoord × coordination)`, each in 0–1 through doctrine curves; ties broken by `rng` |
| TAI-008 | Survival (0–1) from exposure, known threat, HP and the unit's own `squad[].morale` (Leadership bonus already included). Dominates as danger rises; never blocks an action |
| TAI-009 | (open: threshold values) Goal progress toward the active unit's `battleGoal` and the squad plan. Once the `acceptableLoss` share (dead or left the map, never wounded) is reached, the side retreats to an exit and still fires |
| TAI-010 | Action fit from role, weapon type (DAT-011), range, ammo and AP left |
| TAI-011 | Coordination: bonus for answering blackboard requests, penalty for squadmates' claims (`considerations.requestBonus` / `claimPenalty`) |
| TAI-012 | Squad blackboard of requests and claims, stored by TAC in `battle`, changed only through `blackboardWrites` |
| TAI-013 | Leader = highest Management rank (`recruit` < `regular` < `veteran` < `elite`); ties go to the higher attribute average, then request order. The leader sets the plan, roles and requests. A successor takes over at its next activation and keeps the plan. The Leadership bonus is TAC's job, so the AI adds nothing |
| TAI-014 | Roles `flank`, `suppress`, `retreat` change action fit. `callReinforcements` is (optional), later build; until then sides fight with the units on the map |
| TAI-015 | Doctrines in `data/ai/doctrines.json` (`layer: "tactical"`), one per side (`view.doctrine`); they set the weights and curves of TAI-007..TAI-014 |
| TAI-016 | Decision log per call: turn, unit, chosen command, top `logTopN` options with the total and the four consideration scores. The AI keeps none |

**Faction behaviour in battle**

| ID | Summary |
| --- | --- |
| TAI-017 | Neutral side: until attacked it never activates and the AI is not called (TAC-001's fixed rule: civilians flee, armed neutrals take cover). Once hostile, its units form a third side that the AI commands like any AI side, activating after the opponent |
| TAI-018 | Allied AI units on the player side (defenders, convoy, escorted VIP) use the player side as `side`; a per-unit `battleGoal` overrides the side's goal. The VIP is AI-controlled by default; `vipControl: player` hands it to the player, and it then never reacts |

**Also reads** (rules this module depends on but does not own)

| ID | File | Why tactical-ai reads it |
| --- | --- | --- |
| TAC-001, TAC-003, TAC-005, TAC-007, TAC-008, TAC-010, TAC-012 | `spec/tactical.md` | Sides (neutral and third side), day/night, activation choice and eligibility, final facing, pass |
| TAC-017, TAC-019..TAC-023, TAC-075, TAC-081 | `spec/tactical.md` | Turning, noises and alerted state, reaction settings, overwatch, sight |
| TAC-024, TAC-029..TAC-034, TAC-037, TAC-038 | `spec/tactical.md` | Action costs, movement, stance, vault and climb, path preview, exits (retreat) |
| TAC-039..TAC-043, TAC-046, TAC-079, TAC-082, TAC-083 | `spec/tactical.md` | Fire, aim, reload, weapon swap (holster), grenades and smoke, shot preview, concealment, jams |
| TAC-058, TAC-059, TAC-064..TAC-074, TAC-084 | `spec/tactical.md` | Limb states, medical use, item access and backpack, looting, locks, charges, VIP restraint, carry/drag, doors |
| TAC-076, TAC-094, TAC-095 | `spec/tactical.md` | Map objectives, squad leader and Leadership bonus, per-soldier battle morale |
| TAC-077 | `spec/tactical.md` | (optional) morale flight; may later override an AI unit's choice |
| DAT-011 | `spec/data.md` | `weaponType` drives the AI role |
| SAI-013 | `spec/strategic-ai.md` | Hostility toward the player (who is an enemy, who is neutral) |
| MGT-008, MGT-044 | `spec/management.md` | Morale range and persistence; mission goals behind allied battle goals |
| TEC-012, TEC-015, TEC-016 | `spec/tech.md` | Pure rules core, seeded randomness, debug overlay for the decision log |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/tactical_commands.schema.json` | produces (to tactical) | 0.5.0 |
| `spec/interfaces/tactical_perception_view.schema.json` | consumes (from tactical) | 0.6.0 |
| `spec/interfaces/tactical_map_request.schema.json` | reference only (source of `doctrine`, `rank`, `morale`, `battleGoal`, `vipControl` in the view; never read at runtime) | 0.8.0 |

Changes since the last scope (`spec/interfaces/CHANGELOG.md`). View 0.4.0 → 0.6.0: structured
`allowedActions` with shot previews, no queries, `squadMorale`, map details, `weaponJammed`, `concealed`,
door state, `rank` as an enum, per-soldier `morale`. Commands 0.3.0 → 0.5.0: no `takeCover`, new `closeDoor`
(`edge`), `clearJam` and `swapWeapon.slot`.

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/ai/doctrines.json` | `spec/interfaces/data/ai-doctrines.schema.json` | 0.4.0 | Tactical doctrines: `wGoal`, `wFit`, `wCoord`, `considerations`, `roles`, `logTopN` (file is empty; tests use fixtures) |
| `data/items.json` | `spec/interfaces/data/items.schema.json` | 0.9.0 | Read-only lookups of own gear (`weaponType`, ranges, magazine capacity) for action fit |

Not read: `data/tactical-rules.json`. TAC itself counts `commandRetries` (TAI-005), and the Leadership bonus
(`data/management-rules.json`) is already included in the view's `morale`.

## State slices

- Owns: none (no state).
- Reads: none directly. The `battle` slice, including the squad blackboard and plan, reaches the AI only
  through `tactical_perception_view`. Changes go back only as `tactical_commands` and `blackboardWrites`.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Found while scoping, for the root session. `spec/` is not edited from here. The earlier findings 1–8 from
the 2026-11-23 scope are resolved by the spec and schema updates (no queries, structured view, rank enum,
one doctrine per side, per-unit `battleGoal`, generic `considerations`).

1. **TAI-005 table behind the commands schema.** `tactical_commands` 0.5.0 has `closeDoor` (`edge`, TAC-084),
   `clearJam` (TAC-083) and `swapWeapon.slot` (`weapon1`, `weapon2`, `holster`). The TAI-005 table lists
   neither new type and gives `swapWeapon` no fields. The schema is authoritative, so the module builds to
   the schema.
2. **Stale `acceptableLoss` text.** `tactical_map_request` 0.8.0 `$defs.battleGoal.acceptableLoss` says
   "dead, disabled, fled". TAI-009 says only dead soldiers and those who left the map count; wounded soldiers,
   disabled limbs included, never count.
3. **Goal weights per goal type vs doctrine shape.** TAI-009 puts goal weights at
   `considerations.battleGoal.<goal>`. `ai-doctrines` 0.4.0 defines `considerations` as name →
   `{weight, curve}`, so a nested map per goal type does not fit that shape. Is it flat names (e.g.
   `battleGoal.attack`) or a nested object?
4. **Blackboard, plan and log shapes are untyped.** `blackboard`, `squadPlan`, `blackboardWrites[]`, `log[]`
   and `knownNeutrals[]` are plain `object`s. TAI-012 gives only examples (suppress X, cover sector Y, claims
   until turn T) and no write semantics (add, remove, expire). Since TAC stores the writes without
   interpreting them, may `tactical-ai` define these shapes itself, or does the interface need them?
5. **Choosing whom to activate.** With `activeUnit: null` (TAI-002), what does `allowedActions` hold:
   `activate` and `pass` only, or one `activate` entry per eligible unit? The view has no per-unit
   "may activate" flag (stamina ≥ `activationCost`, TAC-008), and `activationCost` is in `tactical-rules`,
   which this module does not read.
6. **Leader leaving the map.** TAC-094 hands leadership over when the leader dies *or leaves the map*.
   TAI-013 only says "dies" for the plan hand-over, which matters for a retreating side (TAI-009).
7. **Turned-hostile neutral side.** TAI-017 makes a hostile neutral faction a third AI side. Its doctrine
   (`sides[].doctrine` may be unset for a `role: neutral` side) and its `battleGoal` (keyed per AI side in the
   request; a neutral side normally has none) are not specified. What does the AI use?
8. **Role values.** TAI-014 names the roles `flank`, `suppress`, `retreat`; the view's `squad[].role` is a free
   string and the doctrine's `roles` is "reserved". Should the schema list the role enum?

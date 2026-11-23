# Tactical Layer — scope

Refreshed by `/scope` (2026-11-23, spec `931ee45`, design baseline `eb072a2`). Lists everything this module
may read outside its folder.

## Spec IDs

Source: `spec/tactical.md` (area TAC, 79 IDs, all mapped to `modules/tactical` in `spec/_index.md`).
`(open)` = the design leaves a value or rule unset; build with the draft values or a stub and flag it.
`(optional)` = left out of the first build iterations. No TAC ID is removed.

**Battle frame**

| ID | Summary |
| --- | --- |
| TAC-001 | (open) Player side (incl. AI allies), one opponent side and a neutral third side that never activates, only reacts or turns hostile when attacked |
| TAC-002 | Turn-based from the first moment on the map, stealth included |
| TAC-003 | Every battle costs 1 h of strategic time; day [06:00, 21:00), night otherwise, fixed for the battle |
| TAC-004 | (open) Night sight = day × `nightSightFactor` (1/3) unless a flashlight is on; base sight formula not set |
| TAC-076 | Objectives from the map request (VIP killed/captured, target destroyed, cargo saved) checked after every action; once met they stay met, reported with the turn |
| TAC-078 | (optional) Contamination HP loss and mines on the tactical map; ignored until built |

**Turn and activation**

| ID | Summary |
| --- | --- |
| TAC-005 | Sides alternate single-soldier activations; any eligible soldier, or pass; AP reset each activation; neutral side never activates |
| TAC-006 | Full AP = 25 + floor(Agility ÷ 10), minus suppression, stun, pain and encumbrance only; wounds never reduce AP |
| TAC-007 | Final facing (8 directions) set free at the end of an activation |
| TAC-008 | Activation needs and costs 2 stamina; +1 at the end if sprinted or over carry capacity |
| TAC-009 | Max stamina = 2 + floor(Endurance ÷ 20) − 1 per wounded (or disabled) leg; enter battle at max |
| TAC-010 | Pass is free; forced when no soldier can be activated |
| TAC-011 | Soldiers not activated in a turn regain 1 stamina at turn end; reacting is not activation |
| TAC-012 | Stamina < activation cost: cannot activate; stamina 0: no reaction attempts |
| TAC-013 | Stall: after 2 turns of both sides passing with no enemy seen or heard, turns advance automatically until contact or an activation |
| TAC-014 | All durations count in turns; per-turn effects apply once at turn end |
| TAC-015 | Hit, cover hit or enemy shot within 1 tile → suppressed: −5 AP, more spread, no reactions, until a clean full turn |
| TAC-077 | (optional) Morale flight below the flee threshold and Nerve's effect on suppression; not applied until built |

**Vision and noise**

| ID | Summary |
| --- | --- |
| TAC-016 | 120° vision cone on facing (helmet can override); LOS shown before committing |
| TAC-017 | Turning on the spot: 1 AP per 90° or part; turning along a path and final facing free |
| TAC-018 | Unsuppressed shots heard map-wide; suppressed 18 tiles, subsonic 6; helmet penalty halves |
| TAC-019 | Hearing a shot or noise alerts: free turn to the source at the next activation, noise marker for the side; no reaction bonus |

**Reactions**

| ID | Summary |
| --- | --- |
| TAC-020 | Check per tile step when a mover enters/crosses a cone with LOS; one attempt per mover per entry |
| TAC-021 | Reaction setting Fire / Take cover / Hold; free, changeable, applied automatically |
| TAC-022 | Attempt costs 1 stamina; chance clamp(50 + (Perception − Agility)/2 + mods, 10, 90)% |
| TAC-023 | Success resolves at once: single snap shot, or take cover within 1 tile (else crouch); no AP; mover continues |
| TAC-075 | Hold overwatch (4 AP, draft) until the next activation: Fire reactions use the current fire mode without the snap-shot penalty |

**Action costs and AP modifiers**

| ID | Summary |
| --- | --- |
| TAC-024 | Cost = base × multipliers + additive terms, rounded down, min 1 AP (free actions exempt); tactical-actions is the only cost source |
| TAC-025 | (open) Non-lethal head hit may stun: −10 AP next activation; stun chance not set |
| TAC-026 | (open) Pain: −4 AP per activation and more spread until masked |
| TAC-027 | (open) Over carry capacity −5 AP, over 125% −10 AP, + stamina surcharge; capacity formula not set |

**Movement**

| ID | Summary |
| --- | --- |
| TAC-028 | Square ~1.5 m tiles, multiple levels, 8-direction movement; stairs, ladders, windows |
| TAC-029 | Walk 2 AP (diagonal 3) + terrain; disabled leg ×2, fracture ×1.5 (stack); +1 per wounded leg |
| TAC-030 | Crouched step: walk cost + 1 |
| TAC-031 | Prone step: walk cost + 3; no sprint, vault or climb |
| TAC-032 | Sprint: walk cost − 1 (min 1), upright only; not with leg fracture, carrying or a `noSprint` backpack |
| TAC-033 | Stance change cost per transition; upright → prone = 2 + 2 via crouched; no attribute term |
| TAC-034 | Vault 4 AP / climb 4 per level (3 with Agility 70+); not prone; no climbing while carrying |
| TAC-035 | Cover stored per tile edge: none, half (~1.0 m), full; destructible materials |
| TAC-036 | After explosions or breaches, recalculate cover, walkability, costs and LOS mid-turn |
| TAC-037 | Path preview returns path, total AP and where AP runs out; same rules as execution |
| TAC-038 | Leave free from an exit tile whose condition is met (end of move or at activation start); leavers count as survivors |

**Weapons**

| ID | Summary |
| --- | --- |
| TAC-039 | Fire: weapon-type AP (or override) + burst/auto surcharge ± ergonomics; one cartridge per round; short burst at full cost |
| TAC-040 | Up to 3 aim steps, 2 AP each (1 with Marksmanship 75+), spread × 0.85 per step; +1 AP per step in pain |
| TAC-041 | Reload by feed type with magazine items (tube: n shells, partial); arm fracture ×1.5, skill, ergonomics, backpack |
| TAC-042 | Swap weapon 3 AP (2 with a pistol), −1 Agility 70+; no weight term |
| TAC-043 | (open) Throw grenade 5 AP (+backpack); wounded/disabled worse arm scatter ×1.5/×2; throw distance and base scatter not set |
| TAC-079 | (open) Frag: linear blast damage over `radiusTiles`, armour check, loud; smoke: LOS-blocking cloud; blast zone and blocking cover not set |

**Hit model**

| ID | Summary |
| --- | --- |
| TAC-044 | (open) Total spread = (base MoA × ammo mod + shooter spread) × arm wound factor; shooter-spread function not set |
| TAC-045 | Each projectile drawn from a 2D normal in the cone (seeded) and traced; pellets traced separately |
| TAC-046 | Shot preview: hit %, likely zone, penetration, from samples on a separate RNG stream |
| TAC-047 | (open) Burst recoil adds spread per extra round; recoil control formula not set |

**Derived per shot**

| ID | Summary |
| --- | --- |
| TAC-048 | Muzzle damage = calibre × ammo × barrel; linear falloff, floor `minDamageShare` (10%) of muzzle damage |
| TAC-049 | Effective recoil = weapon recoil × calibre recoil modifier |
| TAC-050 | Penetrates if class ≥ armour class; degraded armour (< 50%) one class below: (50 − cond)% chance |
| TAC-051 | (open) Blocked round deals 20% blunt damage; durability loss per hit not set |

**Body zones and hitboxes**

| ID | Summary |
| --- | --- |
| TAC-052 | Six zones, one axis-aligned box each, own HP; upright box sizes given |
| TAC-053 | (open) Aiming swings arm boxes in front of the thorax; offsets not set |
| TAC-054 | Crouched layout (~1.20 m); half cover hides legs and most of the thorax |
| TAC-055 | Prone layout (~0.40 m) along facing; lowest spread; fully hidden behind half cover |
| TAC-056 | Cover is trace geometry; firing over or leaning out exposes boxes during the shot |
| TAC-057 | Zone max HP = floor(base × (0.5 + 0.75 × Endurance/100)); base 35/85/60/70; owned by TAC |
| TAC-058 | (open) Limbs wounded below 50% HP, disabled at 0; worse arm widens cone and scatter, legs raise move cost; bleed chances not set |
| TAC-059 | Head or thorax at 0 HP kills; limb at 0 HP disabled; damage on a disabled limb split over the other zones; gear stays on the body |

**Medical**

| ID | Summary |
| --- | --- |
| TAC-060 | Light bleeding −1 HP/turn in the zone until bandage, IFAK or medkit |
| TAC-061 | Heavy bleeding −4 HP/turn; tourniquet (limbs), hemostatic dressing or medkit; replaces light |
| TAC-062 | (open) Fracture effects (arm reload ×1.5, leg tile ×1.5, no sprint); splint removes it; `woundedThreshold` 0.5 |
| TAC-063 | (open) Pain from damage or tourniquet; painkillers mask it for 10 turns |
| TAC-064 | Anyone may use medical items except surgical kit (Medical 40+); self or adjacent squadmate |
| TAC-065 | Medical AP = max(1, base − floor(Medical ÷ 40)) + 2 self-treatment + backpack surcharge |
| TAC-066 | HP restored = min(floor(`hpPerUse` × (0.75 + Medical/200)), pool left, HP missing) |
| TAC-067 | What each medical item treats; one use per application |

**Gear and interaction**

| ID | Summary |
| --- | --- |
| TAC-068 | (open) Vest/belt items at normal AP; backpack +4; awkward backpack extra not set |
| TAC-069 | Drop backpack 1 AP (lootable on the tile); pick it up again 4 AP |
| TAC-070 | Loot 2 AP per item; open container or search body 3 AP once per side, then visible to the side; only carried-off loot counts |
| TAC-071 | Cut a lock with bolt cutters, 10 AP, silent |
| TAC-072 | Place a demolition charge 8 AP (6 with Technical 50+); detonation triggers TAC-036 |
| TAC-073 | Restrain a surrendered or wounded VIP from an adjacent tile, 6 AP |
| TAC-074 | Lift 4 / put down 2 from adjacent; carry +2 per tile upright (not over capacity), drag +3 upright or crouched |

**Also reads** (rules this module applies but does not own)

| ID | File | Why tactical reads it |
| --- | --- | --- |
| GEN-002 | `spec/overview.md` | Op success: at least one soldier gets back (battle result reports survivors) |
| GEN-009 | `spec/overview.md` | Krug markets are no-fire zones |
| MGT-008 | `spec/management.md` | Squad morale in and out of battle; flee threshold for TAC-077 (optional) |
| MGT-021, MGT-026..MGT-031 | `spec/management.md` | Attribute set; MGT-026..028/030 point to TAC; carry capacity (MGT-029, open), Nerve (MGT-031) |
| MGT-044 | `spec/management.md` | Mission outcome conditions; tactical ones detected by TAC-076 |
| SAI-013 | `spec/strategic-ai.md` | Hostility toward the player (who is neutral, TAC-001) |
| STR-023 | `spec/strategic.md` | Engagement: request in, result out, 1 h |
| STR-080 | `spec/strategic.md` | Contaminated region flag (TAC-078, optional) |
| DAT-002..DAT-023, DAT-030 | `spec/data.md` | Item fields, slots, access tiers, weight, containers, loot, weapon/mod/calibre/ammo/magazine profiles, per-shot inputs |
| DAT-025, DAT-029 | `spec/data.md` | The squad's vehicle and its storage (loot destination) |
| ITM-001..ITM-020, ITM-025, ITM-026, ITM-030..ITM-032 | `spec/data.md` | Concrete item kinds: weapons, ammo, armour, containers, medical, operation items, magazines, grenades |
| TAI-002, TAI-004, TAI-005, TAI-012 | `spec/tactical-ai.md` | Controller invocation, the view TAC builds, the commands TAC validates, the blackboard TAC stores |
| TEC-008, TEC-012, TEC-015 | `spec/tech.md` | Rendering never drives rules; pure rules core; seeded, reproducible randomness |
| TEC-022, TEC-023 | `spec/tech.md` | Shot preview and explicit confirm (the core must expose previews) |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/tactical_map_request.schema.json` | consumes (from strategic) | 0.4.0 |
| `spec/interfaces/tactical_commands.schema.json` | consumes (from tactical-ai) | 0.3.0 |
| `spec/interfaces/battle_result.schema.json` | produces (to strategic, management) | 0.3.0 |
| `spec/interfaces/tactical_perception_view.schema.json` | produces (to tactical-ai) | 0.3.0 |

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/tactical-rules.json` | `spec/interfaces/data/tactical-rules.schema.json` | 0.4.0 | All TAC constants (owned by TAC) |
| `data/items.json` | `spec/interfaces/data/items.schema.json` | 0.4.0 | Weapons, magazines, ammo, armour, containers, grenades, medical and operation items |
| `data/terrain.json` | `spec/interfaces/data/terrain.schema.json` | 0.2.0 | Tile move costs, cover materials |
| `data/prefabs.json` | `spec/interfaces/data/prefabs.schema.json` | 0.2.0 | Map pieces, cover edges, destructible materials |
| `data/mapgen/tactical.json` | `spec/interfaces/data/mapgen-tactical.schema.json` | 0.2.0 | Map generation rules, exits and exit conditions |
| `data/presets.json` | `spec/interfaces/data/presets.schema.json` | 0.2.0 | AI soldier stats and loadouts from strength/gear tiers |
| `data/management-rules.json` | `spec/interfaces/data/management-rules.schema.json` | 0.4.0 | `moraleFleeBelow`, Nerve (TAC-077, optional) |
| `data/events.json` | `spec/interfaces/data/events.schema.json` | 0.3.0 | Contamination HP loss (TAC-078, optional) |

## State slices

- Owns: `battle` (including each squad's AI blackboard, TAI-012)
- Reads: none directly. Roster soldiers, region, time, morale and hostility arrive in
  `tactical_map_request`; changes to `roster`, `world` and the rest go out only in `battle_result`.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Found while scoping; report to the root session, do not edit `spec/`. The 21 open questions in
`spec/tactical.md` › Open questions still apply.

1. **Duplicate constants.** The falloff floor is `minDamageShare` (TAC-048) and `falloffFloor` (ITM-005);
   `tactical-rules.schema.json` 0.4.0 still defines both. Which name stays?
2. Settled (spec 931ee45): TAC owns AP, stamina, zone HP, reaction and night sight values; MGT-026..030
   only point to TAC.
3. Settled (spec 931ee45): zone HP rounds down, owned by TAC-057.
4. **Battle duration twice.** `battleDurationHours` (TAC-003, tactical-rules) and `battleHours` (STR-023,
   strategic-rules). TAC-003 names the result field `gameTimeSpent`; `battle_result` 0.3.0 calls it
   `gameTimeHours`.
5. Settled (spec 931ee45): morale flight and Nerve in battle are TAC-077 (optional, deferred).
6. Settled (spec 931ee45): contamination and mines are TAC-078 (optional, deferred).
7. Settled (spec 931ee45): TAC-076 covers objectives met in battle; strategic objectives stay with STR.
8. **Stall constant name.** TAC-013 uses `stallPassTurns`; `tactical-rules.schema.json` 0.4.0 has
   `stallTurns`.
9. **TAC Values with no schema field.** TAC-043 base landing scatter, TAC-079 blast zone distribution and
   blast-blocking cover, TAC-027 Strength reduction (and optional TAC-077 flight chance/Nerve, TAC-078 mines)
   point to `data/tactical-rules.json`, but the schema has no field and `additionalProperties: false`.
10. **Wrong ID in schema.** `recoilControl` is described as TAC-049; recoil control is in TAC-047.
11. **Neutral marker.** TAC-001 reads a per-unit `hostile` flag from the strategic layer;
    `tactical_map_request` 0.4.0 has no such field, only side `role: "neutral"` and the faction `hostility` map.
12. **Exit IDs.** `battle_result` 0.3.0 reports `soldiers[].exitId`, but `tactical_map_request` `exits[]`
    and the mapgen-tactical exits carry no `id`.
13. **Stale schema text.** `tactical_map_request` `battleGoal` says the unit of `acceptableLoss` is open
    (TAI question 9), but TAI-009 settled it (share 0–1) and the field itself says so.
14. **Flee threshold name.** MGT-008 writes `morale_flee_below` / `morale_start`; `management-rules.schema.json`
    0.4.0 has `moraleFleeBelow` / `moraleStart` (TAC-077 reads it).
15. **Command set vs schema.** TAI-005 lists a `takeCover` command, `aimLevel`, `grenade`, `targetUnit` and
    one `interact` group; `tactical_commands` 0.3.0 has no `takeCover` type and uses `aimSteps`, `item`,
    `unit`, separate interaction types and adds `vault`/`climb`. Which is authoritative for validation?
16. **Perception view vs schema.** TAI-004 lists `queries` (functions) and enemy `facing`, `battleGoal`
    targets, searched containers/bodies and smoke in `map`; `tactical_perception_view` 0.3.0 has none of these
    and instead requires `allowedActions`.
17. **Objective types.** The `tactical_map_request` objective example "hold position" is a strategic
    objective per TAC-076; which objective types may the request carry?

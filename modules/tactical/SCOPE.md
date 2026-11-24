# Tactical Layer — scope

Refreshed by `/scope` (2026-11-24, spec `e8aa7e7`, design baseline `c1333f3`). Lists everything this module
may read outside its folder.

## Spec IDs

Source: `spec/tactical.md` (area TAC, 96 IDs, all mapped to `modules/tactical` in `spec/_index.md`).
`(open)` = the design leaves a value or rule unset; build with the draft values or a stub and flag it.
`(optional)` = left out of the first build iterations. No TAC ID is removed. Summaries are the first
sentence of each rule, shortened; the spec section is authoritative.

**Battle frame**

| ID | Summary |
| --- | --- |
| TAC-001 | A tactical map holds the player side, one opponent side and, when such units are present, a third neutral side |
| TAC-002 | The battle is turn-based from the first moment on the map, including stealth |
| TAC-003 | Every battle consumes exactly 1 hour of strategic game time regardless of turns played |
| TAC-004 | In a night battle, each soldier's sight range (TAC-081) = day value × `nightSightFactor`, unless the soldier carries an active flashlight (weapon tactical module,… |
| TAC-076 | The tactical map request (`objectives[]`) lists only the battle's mission objectives that can be met on the tactical map |
| TAC-078 | (optional) A battle in a contaminated region (`contaminated` region flag in the tactical map request, STR-080) makes soldiers lose HP every turn they spend there |
| TAC-080 | The tactical layer generates the battle map from the tactical map request alone (`seed`, `rulesVersion`, `region`, `exits`) |

**Turn and activation**

| ID | Summary |
| --- | --- |
| TAC-005 | Combat alternates single-soldier activations: player side, then opponent side; a player-controlled VIP activates with the player side; rejected AI commands go back up to `commandRetries` times |
| TAC-006 | Full AP = 25 + floor(Agility ÷ 10) (range 25–35 for Agility 1–100) |
| TAC-007 | When an activation ends, the soldier's final facing (one of 8 directions) is set at no AP cost |
| TAC-008 | Activating a soldier requires stamina ≥ `activationCost` and spends `activationCost` stamina points |
| TAC-009 | Max stamina = 2 + floor(Endurance ÷ 20) (range 2–7), minus 1 per wounded leg (TAC-062), never below 0; a fracture alone does not lower it |
| TAC-010 | A side with no soldier able to be activated must pass |
| TAC-011 | At the end of each turn, every soldier (both sides) who was not activated in that turn gains `staminaRecovery` stamina points, up to max stamina |
| TAC-012 | A soldier with stamina < `activationCost` cannot be activated |
| TAC-013 | If for `stallTurns` consecutive turns both sides pass and no soldier sees or hears an enemy, turns advance automatically: each automatic turn is a turn in which both… |
| TAC-014 | Every effect with a duration (bleeding ticks, smoke, painkillers, suppression) is counted in turns |
| TAC-015 | A soldier becomes suppressed when hit, when an enemy shot hits their cover, or when an enemy shot lands within `suppressionRadiusTiles` of them (impact point on the… |
| TAC-077 | (optional) (a) Morale flight: an activated soldier whose effective morale (TAC-095 + Leadership, TAC-094) is below `moraleFleeBelow` may flee toward the nearest exit; (b) Nerve scales suppression spread and casualty morale loss (`nerveDivisor`) |

**Vision and noise**

| ID | Summary |
| --- | --- |
| TAC-016 | Each soldier has a vision cone of `visionConeDeg` centred on their facing |
| TAC-017 | Changing facing on the spot during an activation costs `turnCost` AP per 90° or part of it (a 45° turn costs as much as a 90° turn) |
| TAC-018 | A shot is heard by distance only: unsuppressed → whole map |
| TAC-019 | A soldier who hears a shot (TAC-018), or perceives gunfire or loud noise outside their vision cone, becomes alerted |
| TAC-081 | Day sight range (tiles) = `sightBase` + `sightPerPerception` × Perception + `sightPerRecon` × Recon (25–60 tiles) |

**Reactions**

| ID | Summary |
| --- | --- |
| TAC-020 | A reaction check is made for each potential reactor (line of sight, target inside its vision cone) when an opposing soldier moves in the cone, acts visibly in it, or is newly exposed in it; a player-controlled VIP never reacts |
| TAC-021 | Each soldier has a reaction setting: Fire, Take cover or Hold (stay hidden, no reaction) |
| TAC-022 | Each attempt costs `reactionCost` stamina point, success or not; chance adds the Leadership bonus (TAC-094) and the Ghost perk (TAC-096) |
| TAC-023 | On success, the reaction resolves immediately, before the mover continues |
| TAC-075 | During an activation a soldier may go on overwatch for `overwatchCost` AP |

**Action costs and AP modifiers**

| ID | Summary |
| --- | --- |
| TAC-024 | `design/tactical-actions.md` is the single source for every action cost and its modifiers |
| TAC-025 | A hit to the head zone that does not kill, blunt hits included (TAC-051), stuns with chance `stunChance` |
| TAC-026 | A soldier in pain (TAC-063) loses `painApLoss` AP on each activation and has shooter spread + `painSpread` (TAC-044) until the pain is masked (painkillers) or ends |
| TAC-027 | Carry capacity (kg) = `carryCapacity.base` + `carryCapacity.strength` × Strength + `carryCapacity.endurance` × Endurance (15–55 kg) |

**Movement**

| ID | Summary |
| --- | --- |
| TAC-028 | The map is a grid of square tiles (about 1.5 m) |
| TAC-029 | Base tile cost = `walkCost` (orthogonal step) or `diagonalWalkCost` (diagonal step, instead of `walkCost`) + terrain cost of the destination tile |
| TAC-030 | A step while crouched costs the walk cost (TAC-029) + `crouchSurcharge` per tile |
| TAC-031 | A step while prone costs the walk cost + `proneSurcharge` per tile, with `proneSurcharge` > `crouchSurcharge` |
| TAC-032 | A soldier may sprint while upright only |
| TAC-033 | Stances: upright, crouched, prone |
| TAC-034 | Every half-cover edge (windows, fences, sandbags, low walls) is crossed only by vaulting; no vaulting while carrying or dragging a body, no climbing while carrying one |
| TAC-035 | Cover is stored per tile edge with value none, half or full |
| TAC-036 | After every explosion or breach (an edge destroyed, TAC-085), immediately (mid-turn) recalculate cover edges, walkability, path AP costs and line of sight |
| TAC-037 | For a hovered/tapped destination the layer returns the path, its total AP cost and the tile where the activation's AP run out |
| TAC-038 | Each map has 2–4 exits (TAC-080) |

**Weapons**

| ID | Summary |
| --- | --- |
| TAC-039 | A shot action uses one fire mode of the equipped weapon (weapon field `fireModes`) |
| TAC-040 | Before a shot, the soldier may spend n aim steps, 0 ≤ n ≤ `maxAimSteps` |
| TAC-041 | Reloading a magazine- or belt-fed weapon replaces the loaded magazine (or belt) with a fitting magazine item (DAT-030); magazines are never refilled from loose ammo in battle |
| TAC-042 | Switching the active weapon costs `swapCost` AP, or `swapCostPistol` with a pistol involved; the belt holster is a third slot (`swapWeapon.slot`: weapon1, weapon2, holster) |
| TAC-043 | Grenades are carried in vest pouches, the battle belt (at most 2) or the backpack; throwing from vest or belt costs `throwCost` AP |
| TAC-079 | A grenade (ITM-032) takes effect on landing, at its landing tile |

**Hit model**

| ID | Summary |
| --- | --- |
| TAC-044 | Total spread (MoA, game scale) = (Base MoA × ammo spread modifier × condition factor + shooter spread) × arm wound factor |
| TAC-045 | Each projectile picks a direction from a 2D normal distribution centred on the aim point (most shots near the centre), using the seeded RNG |
| TAC-046 | Before firing, the preview runs `previewSamples` traces with the same model and reports: hit % (share of traces hitting the target), most likely body zone (and… |
| TAC-047 | Each extra round within one shot action adds recoil spread = `recoilSpreadPerRound` × effective recoil (TAC-049) × (1 − recoil control) × ammo `recoilSpreadModifier`; tracers have no other effect |
| TAC-082 | Terrain flagged `obscuring` (brush, trees, tall crops) conceals |
| TAC-083 | Each shot action jams with chance `jamChanceCurve.max` × ((100 − Condition) ÷ 100)^`jamChanceCurve.exponent` (0% at Condition 100, 2.5% at 50, 10% at 0), one seeded… |

**Derived per shot**

| ID | Summary |
| --- | --- |
| TAC-048 | Muzzle damage = calibre damage × ammo damage modifier × weapon barrel multiplier |
| TAC-049 | Effective recoil = weapon Recoil × calibre recoil modifier |
| TAC-050 | Penetration class comes from the loaded ammo only (barrel and distance never change it) |
| TAC-051 | A blocked round deals blunt damage = `bluntShare` × damage at that distance to the hit zone |

**Body zones and hitboxes**

| ID | Summary |
| --- | --- |
| TAC-052 | Six zones, each one axis-aligned box in the soldier's local frame, each with its own HP pool |
| TAC-053 | (open) While the soldier is aiming (in a shot action or with Fire reaction readied), the arm boxes swing forward in front of the thorax, partly shielding it from the front |
| TAC-054 | Crouched: total height ~1.20 m, legs folded under the thorax, head at ~1.00–1.20 m |
| TAC-055 | Prone: lying flat along the facing, total height ~0.40 m |
| TAC-056 | Cover is geometry in the trace (TAC-045): half cover (edge ~1.0 m) hides an upright soldier's legs and lower thorax |
| TAC-057 | Zone max HP = floor(base HP × (0.5 + 0.75 × Endurance / 100)) |
| TAC-058 | Damage to a zone may trigger: head → stun chance (TAC-025) |
| TAC-059 | Head or thorax at 0 HP → the soldier dies immediately |

**Medical**

| ID | Summary |
| --- | --- |
| TAC-060 | Checked for every hit that deals damage through armour (blunt hits never bleed, TAC-051) |
| TAC-061 | Rolled on hard hits only (TAC-060) |
| TAC-062 | A hit on an arm or leg dealing at least `fracture.damageThreshold` of the limb's max HP fractures it with chance `fracture.chance` |
| TAC-063 | Pain starts when one hit (blunt included) deals at least `painThresholds.hitShare` of a zone's max HP, when any zone is below `painThresholds.zoneBelowShare` of its… |
| TAC-064 | Any soldier can use any medical item, except the surgical kit, which requires Medical ≥ `surgicalMinMedical` |
| TAC-065 | Cost = max(1, item base AP − floor(Medical ÷ 40)), then + `selfTreatSurcharge` if treating oneself and + backpack surcharge (TAC-068) if the item is taken from the… |
| TAC-066 | HP restored by one use = min(floor(item `hpPerUse` × (`healScaleBase` + Medical / `healScaleDivisor`)), HP left in the item's pool, HP missing in the zone); medkit 40 per use (draft) |
| TAC-067 | Bandage: stops light bleeding in one zone |

**Gear and interaction**

| ID | Summary |
| --- | --- |
| TAC-068 | (open) Using an item (magazine, grenade, medical, other) from the load-bearing vest or battle belt costs the item's normal AP |
| TAC-069 | A soldier may drop the backpack onto their tile during an activation for `dropBackpackCost` AP |
| TAC-070 | A soldier on or adjacent to items, bodies or containers may move items into free slot capacity (weight and type limits per DAT) for `lootCost` AP per item taken |
| TAC-071 | A soldier carrying bolt cutters and adjacent to a locked door (TAC-084) or container may cut the lock for `boltCutterCost` AP |
| TAC-072 | A soldier carrying a demolition charge may place it on an adjacent target for `placeChargeCost` AP, or `placeChargeCostSkilled` if Technical ≥… |
| TAC-073 | In a capture mission, a soldier on a tile adjacent to the VIP may restrain them for `restrainCost` AP, only once the VIP has surrendered or is wounded |
| TAC-074 | A soldier on a tile adjacent to a body may lift it for `liftCost` AP, choosing carry or drag (player's choice) |
| TAC-084 | A closed door is a full-cover edge (TAC-035) that blocks sight and movement |
| TAC-085 | Every cover edge (walls, doors, windows, fences, props) has the HP of its material (`materialHp`) |

**Tactical map generation**

| ID | Summary |
| --- | --- |
| TAC-086 | The map type comes from the encounter tile, in this order: a plant, … |
| TAC-087 | The generator runs these stages in order (zones, water, roads, structures, fields, ground fill, details, exits and deployment, checks) |
| TAC-088 | Buildings are generated from floor-plan rules in data (room types and size ranges, apartment layouts, shop ground floors) |
| TAC-089 | A generated layout is checked, and re-rolled when a check fails |
| TAC-090 | (optional) Some crop fields are tall crops (sunflower, maize): obscuring terrain (TAC-082) that hides soldiers but gives no cover |
| TAC-091 | (optional) Each building gets 1 loot container (2 in warehouses, barns and halls), placed on the side away from its door |
| TAC-092 | (optional) Each city has a fixed landmark roster (government house, theatre, hospital, school, department store, cinema, monument, eternal flame), drawn from its own stream… |
| TAC-093 | Map generation uses one random stream per stage, each derived from the map seed (`shared/rng.js`), so tuning one stage does not change the others |

**Leadership, morale and perks** (new in spec `c175019`/`e8aa7e7`)

| ID | Summary |
| --- | --- |
| TAC-094 | Each side's squad leader is its highest-ranked soldier on the map (`units[].rank`); while alive, every soldier of the side gets the leader's Leadership bonus on morale reads and reaction chance, never stored |
| TAC-095 | (draft) Morale is kept per soldier (`units[].morale`); only casualties in line of sight or in the same squad move it (`moraleCasualty`); the battle result reports `soldiers[].morale` and `squadMorale` |
| TAC-096 | Perks that act in battle (Steady aim, Snap shooter, Quiet step, Ghost, Field medic, Trauma surgeon, Armourer, Sapper) modify the listed TAC rules for the soldier that has them |

**Also reads** (rules this module applies but does not own)

| ID | File | Why tactical reads it |
| --- | --- | --- |
| GEN-002 | `spec/overview.md` | Op success: at least one soldier gets back (battle result reports survivors) |
| GEN-009 | `spec/overview.md` | Krug markets are no-fire zones |
| MGT-002, MGT-074, MGT-075 | `spec/management.md` | Rank tiers and promotion; squad leader and Leadership bonus values (TAC-094) |
| MGT-008 | `spec/management.md` | Per-soldier morale, its range and the flee threshold (TAC-095; TAC-077 optional) |
| MGT-009 | `spec/management.md` | Perk list, thresholds and effect values (TAC-096) |
| MGT-021, MGT-026..MGT-031, MGT-033 | `spec/management.md` | Attribute set; MGT-026..028/030 point to TAC; carry capacity (MGT-029, read by TAC-027); Nerve (MGT-031); carried weight (MGT-033) |
| MGT-044 | `spec/management.md` | Mission outcome conditions; tactical ones detected by TAC-076 |
| SAI-013 | `spec/strategic-ai.md` | Hostility toward the player (who is neutral, TAC-001) |
| STR-023, STR-095 | `spec/strategic.md` | Engagement and the request's region (terrain, biome, settlement, roads, neighbours, approach) |
| STR-080 | `spec/strategic.md` | Contaminated region flag (TAC-078, optional) |
| DAT-002..DAT-023, DAT-030 | `spec/data.md` | Item fields, slots (incl. holster), access tiers, weight, containers, loot, weapon / fire-mode / condition / mod / module / calibre / ammo / magazine profiles, per-shot inputs |
| DAT-025, DAT-029 | `spec/data.md` | The squad's vehicle and its storage (loot destination) |
| ITM-001..ITM-020, ITM-025, ITM-026, ITM-030..ITM-033 | `spec/data.md` | Concrete item kinds: weapons, ammo, armour, pouch limits, containers, medical, operation items, magazines, grenades, mods |
| TAI-002, TAI-004, TAI-005, TAI-008, TAI-009, TAI-012, TAI-013, TAI-017, TAI-018 | `spec/tactical-ai.md` | Controller invocation, the view TAC builds, the commands TAC validates (with retries), survival and battle goal (effective morale), the blackboard TAC stores, squad leader plan, neutrals, the VIP switch |
| TEC-008, TEC-012, TEC-015 | `spec/tech.md` | Rendering never drives rules; pure rules core; seeded, reproducible randomness |
| TEC-022, TEC-023 | `spec/tech.md` | Shot preview and explicit confirm (the core must expose previews) |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/tactical_map_request.schema.json` | consumes (from strategic) | 0.8.0 (breaking: `units[].rank` enum; new `units[].morale`; `holster` slot) |
| `spec/interfaces/tactical_commands.schema.json` | consumes (from tactical-ai) | 0.5.0 (`swapWeapon.slot`) |
| `spec/interfaces/battle_result.schema.json` | produces (to strategic, management) | 0.4.0 (`soldiers[].morale`, `squadMorale`, holster) |
| `spec/interfaces/tactical_perception_view.schema.json` | produces (to tactical-ai) | 0.6.0 (`weaponJammed`, `concealed`, door state; `squad[].rank`, `squad[].morale`) |

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/tactical-rules.json` | `spec/interfaces/data/tactical-rules.schema.json` | 0.9.0 | All TAC constants (owned by TAC), incl. `commandRetries`, `moraleCasualty`, `moraleFlight` |
| `data/items.json` | `spec/interfaces/data/items.schema.json` | 0.9.0 | Weapons, magazines, ammo, armour, containers (belt `maxGrenades`, holster), grenades, mods, medical and operation items |
| `data/terrain.json` | `spec/interfaces/data/terrain.schema.json` | 0.4.0 | Tile move costs, impassable and obscuring terrain, cover materials |
| `data/prefabs.json` | `spec/interfaces/data/prefabs.schema.json` | 0.3.0 | Fixed map pieces and props, cover edges |
| `data/mapgen/tactical.json` | `spec/interfaces/data/mapgen-tactical.schema.json` | 0.4.0 | Map types, generation stages, buildings, exits, checks |
| `data/presets.json` | `spec/interfaces/data/presets.schema.json` | 0.4.0 | AI soldier stats, morale and loadouts from strength/gear tiers |
| `data/management-rules.json` | `spec/interfaces/data/management-rules.schema.json` | 0.8.0 | `carryCapacity` (TAC-027); `leadershipBonus` (TAC-094); `perks[]` and `perkThresholds` (TAC-096); `moraleFleeBelow` (TAC-077, optional) |
| `data/events.json` | `spec/interfaces/data/events.schema.json` | 0.7.0 | Contamination HP loss (TAC-078, optional) |
| `data/strategic-terrain.json` | `spec/interfaces/data/strategic-terrain.schema.json` | 0.2.0 | Biome → tactical terrain and prefab tables (TAC-080) |

## State slices

- Owns: `battle` (including each squad's AI blackboard, TAI-012, and each soldier's battle morale, TAC-095)
- Reads: none directly. Roster soldiers (rank, morale, Nerve), region, time, hostility and `vipControl`
  arrive in `tactical_map_request`; changes to `roster`, `world` and the rest go out only in `battle_result`.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Found while scoping; report to the root session, do not edit `spec/`. All 62 questions in
`spec/tactical.md` › Open questions are resolved. The four findings of the previous scope (perception view
state, VIP reactions, command retries, reaction modifiers for actions in place) are fixed in the spec
(perception view 0.5.0, TAC-005, TAC-020, tactical open question 57).

1. **Perks are not in the tactical map request.** TAC-096 applies perks "for the soldier that has them".
   MGT-009 says Management records which perks a soldier has, and a perk stays once unlocked even if the
   skill drifts back below the threshold. `tactical_map_request` 0.8.0 has no `units[].perks`, so TAC can
   only derive perks from current attributes against `perkThresholds`, which is wrong for a soldier whose
   skill dropped. Proposed: add `units[].perks` (perk ids) to the request. Build stand-in: derive from
   attributes.
2. **Snap shooter cross-reference.** TAC-096 says Snap shooter replaces the snap-shot penalty of TAC-023;
   the MGT-009 perk table points to TAC-044. Build reading: the perk value replaces `snapShotSpread` where
   TAC-023 applies it, and enters the spread sum of TAC-044. Confirm and align the reference.

# Tactical Layer — spec [TAC]

Precise rules derived from `design/`. Each section: `### [TAC-NNN] Title`, then the rule
(inputs, outputs, formula, ranges), its design source, and `→ data/<table>.json` where a concrete value
lives in data. Edited only through `/update-spec`.

Conventions for this file: "turn" = one player activation followed by one opponent activation
(TAC-005). "Activation" = one soldier spending its AP. All AP costs are whole integers; every
fractional intermediate is rounded down unless a rule says otherwise. Item, weapon, calibre and ammo
values are read from `data/items.json` (specced under DAT/ITM); global tactical constants live in the
proposed table `data/tactical-rules.json`. All randomness uses `shared/rng.js` with the battle seed.

## Battle frame

### [TAC-001] Two sides per map
**Rule.** A tactical map holds exactly two sides: the player side and one opponent side. The player side may include allied units controlled by AI (defenders, convoy, escorted VIP); they belong to the player side for turn order, but their activations are commanded by the AI controller (TAC-005, interfaces). Units of a non-hostile faction present on the map belong to the opponent side for turn order and engage only under the faction behaviour rules (strategic layer input `hostile` flag per unit).
**Source.** design/design.md › Tactical Layer › Turn structure; design/design.md › Tactical Layer (Enemy AI)

### [TAC-002] Turn-based from the start
**Rule.** The battle is turn-based from the first moment on the map, including stealth. There is no real-time exploration phase; the first turn starts when the map is entered.
**Source.** design/design.md › Tactical Layer (Turn structure bullet)

### [TAC-003] Battle duration and day/night
**Rule.** Every battle consumes exactly 1 hour of strategic game time regardless of turns played; the battle result reports `gameTimeSpent = 1 h`. The battle uses the strategic clock time at its start: start time in [06:00, 21:00) → day battle; [21:00, 06:00) → night battle. The day/night flag is fixed for the whole battle.
**Values.** `battleDurationHours` — 1 → data/tactical-rules.json; `dayStartHour` — 6, `nightStartHour` — 21 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Time of day

### [TAC-004] Night sight reduction
**Rule.** In a night battle, each soldier's sight range and spotting range = day value × `nightSightFactor`, unless the soldier carries an active flashlight (weapon tactical module), which restores the full day range. A flashlight also reveals its carrier to enemies and can blind enemies in its cone (effect not set, design: Open). The day sight/spotting range itself derives from Perception (main) and Recon (minor); formula not set (design: Open).
**Values.** `nightSightFactor` — 1/3 → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Time of day; design/design.md › Data definitions › Weapon profile (tactical modules)

## Turn and activation

### [TAC-005] Turn order and activation choice
**Rule.** Combat alternates single-soldier activations: player side, then opponent side; the pair is one turn. There are no rounds. On its activation a side picks any one of its soldiers that may be activated (stamina ≥ `activationCost`, TAC-008), including the soldier it activated last turn, or passes (TAC-010). At the start of an activation the soldier's AP pool is set to its full AP (TAC-006); unspent AP from earlier activations are lost.
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation; design/tactical-actions.md › Turn and activation

### [TAC-006] Action points per activation
**Rule.** Full AP = 25 + floor(Agility ÷ 10) (range 25–35 for Agility 1–100). AP for this activation = full AP − sum of active AP modifiers (suppression TAC-015, stun TAC-025, pain TAC-026, over-encumbrance TAC-027), never below 0. These four are the only AP modifiers: wounds do not reduce the AP pool; they raise the cost of the actions that use the wounded zone (TAC-029, TAC-040, TAC-041, TAC-043). AP is spent on movement, stance, turning, aiming, firing, reloading, medical and gear actions.
**Values.** `apBase` — 25, `apAgilityDivisor` — 10 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Action points); design/design.md › Management › Soldier attributes › Derived values; design/tactical-actions.md › Turn and activation, AP modifiers on an activation

### [TAC-007] Set facing at end of activation
**Rule.** When an activation ends, the soldier's final facing (one of 8 directions) is set at no AP cost.
**Source.** design/design.md › Tactical Layer › Turn structure › Vision and facing; design/tactical-actions.md › Turn and activation

### [TAC-008] Activation stamina cost
**Rule.** Activating a soldier requires stamina ≥ `activationCost` and spends `activationCost` stamina points. +`activationSurcharge` if the soldier sprinted during this activation or is over carry capacity; the surcharge is charged when the activation ends (stamina may not go below 0).
**Values.** `activationCost` — 2, `activationSurcharge` — 1 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Stamina; design/tactical-actions.md › Turn and activation

### [TAC-009] Stamina maximum
**Rule.** Max stamina = 2 + floor(Endurance ÷ 20) (range 2–7), minus 1 per wounded leg (TAC-062), never below 0. Current stamina is clamped to the max whenever the max changes. Soldiers enter the battle at max stamina.
**Values.** `staminaBase` — 2, `staminaEnduranceDivisor` — 20, `staminaPerWoundedLeg` — 1 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Stamina; design/design.md › Management › Soldier attributes › Derived values

### [TAC-010] Pass
**Rule.** A side with no soldier able to be activated must pass; a side may also pass by choice. Passing is free and consumes that side's activation slot of the turn.
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation; design/tactical-actions.md › Turn and activation

### [TAC-011] Stamina recovery
**Rule.** At the end of each turn, every soldier (both sides) who was not activated in that turn gains `staminaRecovery` stamina points, up to max stamina. Reacting does not count as being activated.
**Values.** `staminaRecovery` — 1 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation, Stamina

### [TAC-012] Exhaustion
**Rule.** A soldier with stamina < `activationCost` cannot be activated. A soldier with stamina 0 cannot make reaction attempts.
**Source.** design/design.md › Tactical Layer › Turn structure › Stamina

### [TAC-013] Stall rule
**Rule.** If both sides pass in two consecutive turns, a side not in contact with the enemy may either leave the map (via an exit, TAC-038) or skip ahead turns until something changes. "Contact" and "something changes" are not defined (design: Open).
**Values.** `stallPassTurns` — 2 → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation

### [TAC-014] Durations in turns
**Rule.** Every effect with a duration (bleeding ticks, smoke, painkillers, suppression) is counted in turns. Per-turn effects (e.g. bleeding HP loss) are applied once at the end of each turn.
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation

### [TAC-015] Suppression
**Rule.** A soldier who is hit, or whose cover is hit, becomes suppressed. While suppressed: −`suppressionAp` AP on each activation, shooter spread + `suppressionSpread`, no reaction attempts. Suppression ends after one full turn passes in which the soldier was neither hit nor had their cover hit; any new qualifying hit restarts the count. Nerve lowers the effect of suppression (amount not set, design: Open).
**Values.** `suppressionAp` — 5 → data/tactical-rules.json; `suppressionSpread` — not set (design: Open) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation; design/tactical-actions.md › AP modifiers on an activation; design/design.md › Management › Soldier attributes (Nerve)

## Vision and noise

### [TAC-016] Vision cone
**Rule.** Each soldier has a vision cone of `visionConeDeg` centred on their facing; line of sight to a target counts only if the target is inside the cone and the line is not blocked. A helmet may override the cone angle (helmet field `visionConeDeg`, e.g. Altyn 90°). Line of sight is shown to the player before committing an action.
**Values.** `visionConeDeg` — 120 → data/tactical-rules.json; helmet override → data/items.json
**Source.** design/design.md › Tactical Layer › Turn structure › Vision and facing; design/design.md › Tactical Layer (Cover & visibility); design/item-list.md › Helmets

### [TAC-017] Turning during an activation
**Rule.** Changing facing on the spot during an activation costs `turnCost` AP per 90° or part of it (a 45° turn costs as much as a 90° turn; 135° costs 2 × `turnCost`). Turning along a path while moving is free, and the final facing is free (TAC-007).
**Values.** `turnCost` — 1 (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Vision and facing; design/tactical-actions.md › Movement

### [TAC-018] Gunshot hearing range
**Rule.** A shot is heard by distance only: unsuppressed → whole map; suppressed → within `hearSuppressed` tiles; suppressed with ammo flagged subsonic → within `hearSuppressedSubsonic` tiles. A listener wearing a helmet with a hearing penalty hears suppressed shots only within half those ranges.
**Values.** `hearSuppressed` — 18, `hearSuppressedSubsonic` — 6, `hearingPenaltyFactor` — 0.5 → data/tactical-rules.json; helmet `hearingPenalty` flag, ammo `subsonic` flag, muzzle `suppressor` flag → data/items.json
**Source.** design/design.md › Tactical Layer › Turn structure › Gunshot noise; design/design.md › Tactical Layer › Derived per shot

### [TAC-019] Reacting to heard shots and noise
**Rule.** A soldier who hears a shot (TAC-018), or perceives gunfire or loud noise outside their vision cone, turns to face its source (free, no AP or stamina) and becomes alerted. This never triggers a reaction attempt. Effects of the alerted state are not defined (design: Open).
**Status.** open
**Source.** design/design.md › Tactical Layer › Turn structure › Vision and facing, Gunshot noise

## Reactions

### [TAC-020] Reaction trigger
**Rule.** A reaction check is made for each potential reactor when an opposing soldier moves into or through the reactor's vision cone with line of sight, checked per tile step of the mover. A reactor makes at most one attempt per mover per entry into its cone. Reactors that are suppressed, have stamina 0 or have reaction setting Hold make no attempt.
**Source.** design/design.md › Tactical Layer › Turn structure › Reactions; design/tactical-actions.md › Turn and activation

### [TAC-021] Reaction setting
**Rule.** Each soldier has a reaction setting: Fire, Take cover or Hold (stay hidden, no reaction). It is chosen during the soldier's activation and persists until changed; it is applied automatically, with no prompts during the opponent's move. Setting it is free and it can be changed any number of times within the activation.
**Values.** `setReactionCost` — 0 (draft: free) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Reactions; design/tactical-actions.md › Turn and activation

### [TAC-022] Reaction attempt cost and chance
**Rule.** Each attempt costs `reactionCost` stamina point, success or not. Chance = clamp(50 + (reactor Perception − mover Agility) / 2 + modifiers, 10, 90) %. Modifiers: distance, mover's stance (crouched harder, prone hardest), mover sprinting (easier), noise, reactor's wounds. Modifiers are applied before the clamp. One seeded roll decides.
**Values.** `reactionCost` — 1, `reactionBase` — 50, `reactionMin` — 10, `reactionMax` — 90 → data/tactical-rules.json; distance/stance/sprint/noise/wound modifiers — not set (design: Open) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Reactions; design/tactical-actions.md › Turn and activation

### [TAC-023] Reaction resolution
**Rule.** On success, the reaction resolves immediately, before the mover continues. Fire: one shot action at the mover with the normal hit model (TAC-044..) plus a snap-shot spread penalty. Take cover: the reactor moves to an adjacent tile with cover against the mover, or, if none, crouches (or goes prone if already crouched). Reactions spend no AP. Afterwards the mover continues and may spend its remaining AP. On failure, the mover is not noticed by that reactor; the stamina point is still spent.
**Values.** `snapShotSpread` — not set (design: Open) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Reactions

## Action costs and AP modifiers

### [TAC-024] Action cost composition
**Rule.** Every action cost = base value per action (from data), adjusted by attributes, gear and wounds as stated in the action's section. Additive terms (attribute and ergonomics thresholds, surcharges) are applied first; multipliers (e.g. fracture ×1.5) apply to the whole sum; the result is rounded down to a whole number and is never below 1 AP. Actions defined as free (cost 0: pass, final facing, set reaction, leave the map) are exempt from the minimum. An action that costs more AP than the soldier has left cannot be started. Attribute thresholds ("Agility 70+") mean attribute ≥ threshold; "ergonomics 30 or below" means ≤ 30.
**Source.** design/design.md › Tactical Layer › Actions and costs; design/design.md › Management › Soldier attributes › Derived values; design/tactical-actions.md (intro: whole numbers, rounded down after any multiplier, never below 1 AP)

### [TAC-025] Stun (head hit)
**Rule.** A hit to the head zone that does not kill has a chance to stun; a stunned soldier loses `stunApLoss` AP on their next activation, then the stun clears.
**Values.** `stunChance` — not set (design: Open), `stunApLoss` — 10 (draft) → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/tactical-actions.md › AP modifiers on an activation

### [TAC-026] Pain AP loss
**Rule.** A soldier in pain (TAC-063) loses `painApLoss` AP on each activation and has added shooter spread until the pain is masked (painkillers) or ends. Pain also raises the aim-step cost (TAC-040).
**Values.** `painApLoss` — 4 (draft), `painSpread` — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Medical system › Conditions; design/tactical-actions.md › AP modifiers on an activation

### [TAC-027] Over-encumbrance
**Rule.** If total carried weight (all seven equipment slots and contents) exceeds the soldier's carry capacity, the soldier is over-encumbered: −`encumbranceApPenalty` AP on each activation, or −`heavyEncumbranceApPenalty` AP instead if carried weight exceeds `heavyEncumbranceThreshold` × carry capacity (the two do not stack), plus the activation stamina surcharge (TAC-008). Strength lowers the penalty for heavy kit (amount not set, design: Open). Carry capacity derives from Strength (main) and Endurance (minor); formula not set (design: Open), owned by MGT/DAT.
**Values.** `encumbranceApPenalty` — 5 (draft), `heavyEncumbranceApPenalty` — 10 (draft), `heavyEncumbranceThreshold` — 1.25 (draft) → data/tactical-rules.json; Strength reduction — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer (Action points); design/tactical-actions.md › AP modifiers on an activation; design/design.md › Data definitions › Soldier equipment slots

## Movement

### [TAC-028] Tactical grid
**Rule.** The map is a grid of square tiles (about 1.5 m) on multiple levels (floors, roofs). Movement is tile to tile in 8 directions. Levels connect via stairs, ladders and windows to vault.
**Values.** `tileSizeM` — 1.5 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Movement)

### [TAC-029] Walk one tile
**Rule.** Walking one tile costs `walkCost` (orthogonal step) or `diagonalWalkCost` (diagonal step, instead of `walkCost`) + terrain cost of the destination tile. Each wounded leg (below `woundedThreshold` of its max HP, TAC-062) adds `legWoundMoveSurcharge` per tile. If either leg has a fracture, the whole tile cost (base + terrain + stance, sprint and carry terms + leg-wound surcharge) is × `fractureMoveFactor`, then rounded down (TAC-024).
**Values.** `walkCost` — 2, `diagonalWalkCost` — 3 (draft), `legWoundMoveSurcharge` — 1 (draft), `fractureMoveFactor` — 1.5 → data/tactical-rules.json; per-terrain `moveCost` (draft): road, floor, grass 0; mud, shallow water, rubble, dense brush 1; stairs 1 → data/terrain.json
**Source.** design/design.md › Tactical Layer (Movement); design/tactical-actions.md › Movement (Walk one tile, Leg wound surcharge); design/design.md › Tactical Layer › Medical system › Conditions

### [TAC-030] Move crouched
**Rule.** A step while crouched costs the walk cost (TAC-029) + `crouchSurcharge` per tile.
**Values.** `crouchSurcharge` — 1 (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Movement); design/tactical-actions.md › Movement

### [TAC-031] Crawl prone
**Rule.** A step while prone costs the walk cost + `proneSurcharge` per tile, with `proneSurcharge` > `crouchSurcharge`. No sprinting, vaulting or climbing while prone (TAC-055).
**Values.** `proneSurcharge` — 3 (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Movement); design/tactical-actions.md › Movement

### [TAC-032] Sprint
**Rule.** A soldier may sprint while upright only. A sprinted tile costs the walk cost (TAC-029, incl. terrain and leg-wound surcharge) − `sprintDiscount`, never below 1 AP per tile. Sprinting during an activation adds the stamina surcharge (TAC-008) and makes reactions against the mover easier (TAC-022). Not possible while prone, with a leg fracture, while carrying a squadmate (TAC-074), or while wearing a backpack flagged `noSprint` (e.g. large rucksack).
**Values.** `sprintDiscount` — 1 (draft) → data/tactical-rules.json; backpack `noSprint` → data/items.json
**Source.** design/tactical-actions.md › Movement; design/design.md › Tactical Layer › Medical system › Conditions; design/item-list.md › Backpacks

### [TAC-033] Change stance
**Rule.** Stances: upright, crouched, prone. Changing stance costs AP per transition; getting up from prone costs the most. The cost of upright → prone is not stated (design: Open). Agility affects stance-change cost (design.md attribute table; formula not set, tactical-actions gives no Agility term).
**Values.** `stanceCost` per transition (draft): upright → crouched 2, crouched → upright 2, crouched → prone 2, prone → crouched 4, prone → upright 6; upright → prone — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer (Movement); design/tactical-actions.md › Movement; design/design.md › Management › Soldier attributes

### [TAC-034] Vault a window, climb a ladder
**Rule.** Vaulting a window or low wall costs `vaultCost` AP, or `vaultCostAgile` if Agility ≥ `agileThreshold`. Climbing a ladder costs `climbCost` AP per level, or `climbCostAgile` per level if Agility ≥ `agileThreshold`. Neither is possible while prone (the soldier must change stance first); climbing is not possible while carrying a squadmate (TAC-074).
**Values.** `vaultCost` — 4 (draft), `vaultCostAgile` — 3 (draft), `climbCost` — 4 per level (draft), `climbCostAgile` — 3 per level (draft), `agileThreshold` — 70 (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Movement), Body zones and hitboxes › Stance; design/tactical-actions.md › Movement (Vault a window or low wall, Climb a ladder)

### [TAC-035] Cover per tile edge
**Rule.** Cover is stored per tile edge with value none, half or full. Half cover is a ~1.0 m high edge; full cover blocks the whole silhouette. Cover objects have a destructible material (prefab/terrain data). The preview shows per edge where a soldier is protected.
**Values.** `halfCoverHeightM` — 1.0 → data/tactical-rules.json; materials → data/prefabs.json / data/terrain.json
**Source.** design/design.md › Tactical Layer (Movement, Cover & visibility), Body zones and hitboxes › Stance

### [TAC-036] Destruction recalculation
**Rule.** After every explosion or breach, immediately (mid-turn) recalculate cover edges, walkability, path AP costs and line of sight. Newly opened sightlines can trigger reaction checks (TAC-020) for movers currently in view.
**Source.** design/design.md › Tactical Layer (Movement)

### [TAC-037] Path preview
**Rule.** For a hovered/tapped destination the layer returns the path, its total AP cost and the tile where the activation's AP run out. Confirming (second tap on mobile) commits the move. The path cost uses the same rules as execution.
**Source.** design/design.md › Tactical Layer (Movement)

### [TAC-038] Leave the map at an exit
**Rule.** Each map has exits (count from map generation); each exit carries its own condition (vehicle fuel, a boat at a set turn, a paid crossing). A soldier who ends a move on an exit tile whose condition is met may leave the map; leaving is free. Soldiers who left are out of the battle and count as survivors in the battle result.
**Values.** `exitCost` — 0 (draft: free) → data/tactical-rules.json; exit conditions → data/mapgen/tactical.json
**Source.** design/tactical-actions.md › Turn and activation; design/design.md › Management › Gear, loot & return

## Weapons

### [TAC-039] Fire
**Rule.** A shot action uses one fire mode of the equipped weapon (weapon field `fireModes`, e.g. [1, 3] or [1, auto]); the mode sets rounds fired and AP cost. Mode 1 fires one round; a burst mode fires `burstRounds` rounds (the design's burst is 3 rounds, i.e. mode 3); `"auto"` fires `autoRounds` rounds. AP cost = fire AP of the weapon (its `fireApCost` override if set, else `fireApByWeaponType` for its `weaponType`) + `burstApSurcharge` (burst) or `autoApSurcharge` (auto) − `ergoApDelta` if ergonomics ≥ `ergoHighThreshold` + `ergoApDelta` if ergonomics ≤ `ergoLowThreshold`, then TAC-024. Each round consumes one cartridge from the loaded magazine; firing with an empty magazine is not allowed. Rounds in a burst are resolved in order with growing recoil spread (TAC-047).
**Values.** `fireApByWeaponType` (draft): `pistol` 4, `smg` 5, `assaultRifle` 6, `shotgun` 6, `battleRifle` 7, `dmr` 7, `lmg` 8, `sniperRifle` (bolt-action) 9; `burstRounds` — 3, `burstApSurcharge` — 2, `autoRounds` — 5, `autoApSurcharge` — 4, `ergoHighThreshold` — 70, `ergoLowThreshold` — 30, `ergoApDelta` — 1 (all draft) → data/tactical-rules.json; per-weapon `fireApCost` override → data/items.json
**Source.** design/tactical-actions.md › Weapons (Fire); design/design.md › Data definitions › Weapon profile

### [TAC-040] Aim longer
**Rule.** Before a shot, the soldier may spend up to `maxAimSteps` aim steps; each step lowers shooter spread (TAC-044) by `aimSpreadReduction`. Cost per step = `aimStepCost`, or `aimStepCostSkilled` if Marksmanship ≥ `aimSkilledThreshold`; + `aimWoundSurcharge` per step if the aiming arm is wounded (below `woundedThreshold` of its max HP) or the soldier is in pain (TAC-063). Tactical-actions gives no ergonomics term for aiming (see open questions).
**Values.** `aimStepCost` — 2 (draft), `aimStepCostSkilled` — 1 (draft), `aimSkilledThreshold` — 75 (draft), `maxAimSteps` — 3 (draft), `aimSpreadReduction` — 0.15 per step (placeholder), `aimWoundSurcharge` — 1 (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Action points); design/tactical-actions.md › Weapons (Aim longer)

### [TAC-041] Reload
**Rule.** Reloading replaces the magazine with one from the vest or belt at normal cost, or from the backpack at normal cost + backpack surcharge (TAC-068). Base cost = `reloadApByFeedType` for the weapon's `feedType`; a tube-fed weapon loads shells one at a time at `reloadApByFeedType.tube` per shell. Cost = base − `reloadSkilledBonus` if Marksmanship ≥ `reloadSkilledThreshold` − `ergoApDelta` if ergonomics ≥ `ergoHighThreshold` + `ergoApDelta` if ergonomics ≤ `ergoLowThreshold` + `backpackSurcharge` if the magazine comes from the backpack + `woundedArmReloadSurcharge` if an arm is wounded (below `woundedThreshold` of its max HP); × `armFractureReloadFactor` if an arm is fractured; then TAC-024. The magazine item may modify reload cost (DAT-016 `reloadAp`). Design.md also names Agility (minor) for reload; tactical-actions gives no Agility term (see open questions).
**Values.** `reloadApByFeedType` (draft): `pistol` 4, `boxMagazine` 5, `stripperClip` 6, `boltAction` 6, `belt` 10, `tube` 2 per shell; `reloadSkilledThreshold` — 70, `reloadSkilledBonus` — 1, `woundedArmReloadSurcharge` — 2, `armFractureReloadFactor` — 1.5 (all draft) → data/tactical-rules.json; weapon `feedType`, magazine `reloadAp` modifier → data/items.json
**Source.** design/tactical-actions.md › Weapons (Reload); design/design.md › Data definitions › Weapon profile, Soldier equipment slots

### [TAC-042] Swap weapon 1 and 2
**Rule.** Switching the active weapon between slots Weapon 1 and Weapon 2 costs `swapCost` AP, or `swapCostPistol` when either weapon has `weaponType: pistol`; − `swapAgileBonus` if Agility ≥ `agileThreshold`; + `swapHeavySurcharge` if a weapon over `swapHeavyKg` (effective weight, DAT-016) is involved; then TAC-024. Design.md also names Marksmanship and ergonomics for swaps; tactical-actions gives no such terms (see open questions).
**Values.** `swapCost` — 3, `swapCostPistol` — 2, `swapAgileBonus` — 1, `swapHeavyKg` — 6, `swapHeavySurcharge` — 2 (all draft) → data/tactical-rules.json; `agileThreshold` (TAC-034)
**Source.** design/tactical-actions.md › Weapons (Swap between weapon 1 and 2); design/design.md › Data definitions › Soldier equipment slots

### [TAC-043] Throw a grenade
**Rule.** Throwing a grenade from the vest or belt costs `throwCost` AP; from the backpack + `backpackSurcharge` (TAC-068); + `woundedArmThrowSurcharge` if the throwing arm is wounded (below `woundedThreshold` of its max HP). Strength sets the maximum throwing distance. Grenade effects are item data.
**Values.** `throwCost` — 5 (draft), `woundedArmThrowSurcharge` — 1 (draft) → data/tactical-rules.json; throw-distance formula — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/tactical-actions.md › Weapons; design/design.md › Management › Soldier attributes

## Hit model

### [TAC-044] Total spread
**Rule.** Total spread (MoA, game scale) = Base MoA × ammo spread modifier + shooter spread. Shooter spread is a function of Marksmanship, Perception (at range), stance (prone lowest), aim steps, wounds (arms, fractures), pain and suppression, and is reduced at range by optics and for hip/snap shots by lasers. Weapon condition wear raises spread. 1 MoA ≈ 17 cm of cone width at 50 m (33 tiles), scaling linearly with distance.
**Values.** shooter-spread coefficients — not set (design: Open) → data/tactical-rules.json; `baseMoA`, ammo `spreadModifier`, optic/laser modifiers → data/items.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Hit model; design/design.md › Data definitions › Weapon profile

### [TAC-045] Simulated shot trace
**Rule.** Each projectile picks a direction inside the spread cone from a 2D normal distribution centred on the aim point (most shots near the centre; the cone width is where nearly all shots land), using the seeded RNG. The ray is traced against cover/geometry and against the target's body-zone hit boxes (TAC-052..TAC-056); the first intersected volume is hit. Multi-projectile loads (calibre `projectiles` > 1, e.g. buckshot 8) trace each pellet separately.
**Values.** `coneSigmaFraction` (cone half-width in standard deviations) — not set (design: Open) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Hit model; design/design.md › Data definitions › Calibre profile

### [TAC-046] Hit chance and shot preview
**Rule.** Before firing, the preview runs `previewSamples` traces with the same model and reports: hit % (share of traces hitting the target), most likely body zone (and distribution per zone), and whether the round would penetrate that zone's armour (TAC-050). Preview sampling uses its own RNG stream (separate from the battle seed's stream) so looking at a preview never changes the battle RNG sequence, a real shot or a replay. Hit chance is therefore the share of the cone covered by visible body zones after cover.
**Values.** `previewSamples` — "a few hundred" (no exact value) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Hit model; design/design.md › Tactical Layer (Readability)

### [TAC-047] Burst recoil
**Rule.** Each extra round within one shot action adds recoil spread = effective recoil (TAC-049) × `recoilSpreadPerRound`, accumulating per round, reduced by recoil control (Marksmanship main, Strength minor). Tracer ammo reduces it (value open).
**Values.** `recoilSpreadPerRound`, recoil-control formula, tracer modifier — not set (design: Open) → data/tactical-rules.json / data/items.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Hit model; design/design.md › Management › Soldier attributes › Derived values

## Derived per shot

### [TAC-048] Muzzle damage and falloff
**Rule.** Muzzle damage = calibre damage × ammo damage modifier × weapon barrel multiplier. Damage at distance d (tiles) = muzzle damage × (1 − falloffShare × d ÷ falloffRange), never below `minDamageShare` × muzzle damage. falloffShare and falloffRange come from the loaded ammo. Example: 6% per 15 tiles → −6% at 15, −12% at 30.
**Values.** `minDamageShare` — 0.10 → data/tactical-rules.json; calibre `damage`, ammo `damageModifier`, `falloffShare`, `falloffRange`, weapon `barrelMultiplier` → data/items.json
**Source.** design/design.md › Tactical Layer › Derived per shot

### [TAC-049] Effective recoil
**Rule.** Effective recoil = weapon Recoil × calibre recoil modifier.
**Source.** design/design.md › Tactical Layer › Derived per shot

### [TAC-050] Penetration check
**Rule.** Penetration class comes from the loaded ammo only (barrel and distance never change it). Armour class 1–6 per zone (helmet → head, body armour → thorax; zones without armour are always penetrated). Condition% = current durability ÷ max durability × 100. The round penetrates if penetration class ≥ armour class. If not, and condition < 50% and penetration class = armour class − 1, it penetrates with chance (50 − condition%)% (seeded roll). Armour at 0 durability gives no protection.
**Values.** `degradedArmourThreshold` — 50 → data/tactical-rules.json; ammo `penetrationClass`, armour `armourClass`, `durability` → data/items.json
**Source.** design/design.md › Tactical Layer › Derived per shot; design/design.md › Data definitions › Soldier equipment slots

### [TAC-051] Blunt damage and armour wear
**Rule.** A blocked round deals blunt damage = `bluntShare` × damage at that distance to the hit zone. Each hit on an armour piece lowers its durability (amount per hit not set, design: Open). Penetrating rounds deal full damage at distance to the zone's HP.
**Values.** `bluntShare` — 0.20 → data/tactical-rules.json; `durabilityLossPerHit` — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Derived per shot; design/design.md › Data definitions › Soldier equipment slots

## Body zones and hitboxes

### [TAC-052] Body zones and upright hitboxes
**Rule.** Six zones, each one axis-aligned box in the soldier's local frame, each with its own HP pool. Upright soldier (~1.80 m), width × depth × height, height above ground: head 0.22×0.25×0.25, 1.53–1.78 m; thorax (incl. abdomen) 0.40×0.25×0.55, 0.95–1.50 m; left/right arm 0.12×0.12×0.60, 0.85–1.45 m, beside the thorax; left/right leg 0.16×0.16×0.95, 0.00–0.95 m.
**Values.** box dimensions and offsets per zone and stance → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes

### [TAC-053] Aiming arm pose
**Rule.** While the soldier is aiming (in a shot action or with Fire reaction readied), the arm boxes swing forward in front of the thorax, partly shielding it from the front.
**Values.** aiming arm offsets — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes

### [TAC-054] Crouched hitboxes
**Rule.** Crouched: total height ~1.20 m, legs folded under the thorax, head at ~1.00–1.20 m. Behind half cover the legs and most of the thorax are hidden.
**Values.** crouched box layout → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Stance

### [TAC-055] Prone hitboxes and limits
**Rule.** Prone: lying flat along the facing, total height ~0.40 m. From the front only head, arms (when aiming) and top of thorax are exposed; from the side the whole body. Behind half cover a prone soldier is fully hidden until they fire over it. Prone gives the lowest shooter spread; no sprinting, vaulting or climbing while prone.
**Values.** prone box layout → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Stance

### [TAC-056] Cover occlusion
**Rule.** Cover is geometry in the trace (TAC-045): half cover (edge ~1.0 m) hides an upright soldier's legs and lower thorax; full cover hides everything. A soldier firing over half cover or leaning out of full cover exposes the boxes above/beside the edge for the duration of the shot (and for reaction fire at them during it).
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Stance

### [TAC-057] Zone HP
**Rule.** Zone max HP = floor(base HP × (0.5 + 0.75 × Endurance / 100)). Base HP: head 35, thorax 85, each arm 60, each leg 70. E.g. Endurance 20 → ×0.65, 67 → ×1.0, 100 → ×1.25. Zone HP never goes below 0; damage beyond 0 is discarded.
**Values.** `baseHp` per zone — head 35, thorax 85, arm 60, leg 70 → data/tactical-rules.json; `hpScaleBase` — 0.5, `hpScaleEndurance` — 0.75 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/design.md › Management › Soldier attributes › Derived values

### [TAC-058] Zone damage effects
**Rule.** Damage to a zone may trigger: head → stun chance (TAC-025); thorax → high bleeding chance (TAC-060/061); arm (wounded, TAC-062) → more aim AP (TAC-040), reload AP (TAC-041) and throw AP (TAC-043), more shooter spread; leg (wounded) → higher movement cost (TAC-029), max stamina −1 (TAC-009). Wounds never reduce the AP pool (TAC-006).
**Values.** arm wound AP surcharges — see TAC-040 (`aimWoundSurcharge` 1), TAC-041 (`woundedArmReloadSurcharge` 2), TAC-043 (`woundedArmThrowSurcharge` 1) (draft); per-zone bleeding chances, arm wound spread modifier — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone

### [TAC-059] Zone at 0 HP
**Rule.** Head or thorax at 0 HP → the soldier dies immediately. Arm or leg at 0 HP → no additional effect beyond the wound effects (for now). A dead soldier's seven equipment slots stay on the body as lootable.
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes; design/design.md › Tactical Layer › Medical system › Conditions; design/design.md › Data definitions › Soldier equipment slots

## Medical

### [TAC-060] Light bleeding
**Rule.** Caused by most hits (chance per hit). Effect: −`lightBleedHp` HP per turn in that zone (end of turn, TAC-014) until treated. Treated by bandage, IFAK or medkit. Endurance gives bleed resistance (formula not set).
**Values.** `lightBleedHp` — 1, `lightBleedChance` — not set (design: Open) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Medical system › Conditions, Body zones and hitboxes

### [TAC-061] Heavy bleeding
**Rule.** Caused by hard hits; higher chance on thorax hits and with ammo flagged higher bleeding (HP ammo). Effect: −`heavyBleedHp` HP per turn in that zone until treated. Treated by tourniquet (arm or leg only), hemostatic dressing (any zone) or medkit. A zone has at most one bleeding condition; heavy replaces light.
**Values.** `heavyBleedHp` — 4, `heavyBleedChance` per zone — not set (design: Open) → data/tactical-rules.json; ammo `bleedModifier` → data/items.json
**Source.** design/design.md › Tactical Layer › Medical system › Conditions

### [TAC-062] Fracture
**Rule.** Caused by heavy hits or falls on arms and legs. Arm fracture: more aim spread and reload cost × 1.5 (TAC-041). Leg fracture: movement cost × 1.5 (TAC-029), no sprinting. Treated by splint. A "wounded" arm or leg = a limb below `woundedThreshold` of its max HP; healing it to or above that share removes the wounded state. Fracture effects apply on their own, whether or not the limb is wounded.
**Values.** `woundedThreshold` — 0.5 (draft) → data/tactical-rules.json; `armFractureReloadFactor` — 1.5 (draft, TAC-041); `fractureChance`, fracture damage threshold, arm-fracture spread modifier — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Medical system › Conditions

### [TAC-063] Pain
**Rule.** Caused by damage and by an applied tourniquet. Effect: fewer AP and more aim spread (TAC-026). Painkillers mask it for the item's duration (10 turns); when the mask expires, pain returns if its cause persists.
**Values.** pain trigger thresholds — not set (design: Open) → data/tactical-rules.json; painkiller `durationTurns` — 10 → data/items.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Medical system › Conditions; design/item-list.md › Medical items

### [TAC-064] Medical item use permissions
**Rule.** Any soldier can use any medical item, except the surgical kit, which requires Medical ≥ `surgicalMinMedical`. Target: self, or a squadmate on an adjacent tile (8-neighbourhood, same level).
**Values.** `surgicalMinMedical` — 40 → data/items.json (item field `minMedical`)
**Source.** design/design.md › Tactical Layer › Medical system › Using medical items; design/tactical-actions.md › Medical

### [TAC-065] Medical AP cost
**Rule.** Cost = max(1, item base AP − floor(Medical ÷ 40)) + `selfTreatSurcharge` if treating oneself + backpack surcharge (TAC-068) if the item is taken from the backpack. Base AP per item: bandage 3, tourniquet 2, hemostatic dressing 4, splint 5, painkillers 2, IFAK 6, medkit 8, surgical kit 15.
**Values.** `medicalApDivisor` — 40, `selfTreatSurcharge` — 2 → data/tactical-rules.json; item `apCost` → data/items.json
**Source.** design/design.md › Tactical Layer › Medical system › Using medical items; design/tactical-actions.md › Medical; design/item-list.md › Medical items

### [TAC-066] HP restored
**Rule.** HP restored by an item = floor(item HP × (0.75 + Medical / 200)). IFAK: up to 15 HP base per use from a 60 HP pool; medkit: from a 300 HP pool. The pool is reduced by the HP actually restored; zone HP never exceeds max.
**Values.** `healScaleBase` — 0.75, `healScaleDivisor` — 200 → data/tactical-rules.json; item `hpPerUse`, `hpPool`, `uses` → data/items.json
**Source.** design/design.md › Tactical Layer › Medical system › Using medical items; design/item-list.md › Medical items

### [TAC-067] Medical item effects
**Rule.** Bandage: stops light bleeding in one zone. Tourniquet: stops heavy bleeding in an arm or leg; causes pain. Hemostatic dressing: stops heavy bleeding in any zone. Splint: removes a fracture. Painkillers: masks pain for 10 turns (4 uses). IFAK: restores HP, stops light bleeding. Medkit: restores HP, stops light and heavy bleeding. Surgical kit: brings an arm or leg at 0 HP back to 1 HP (3 uses). One use is consumed per application.
**Values.** per item `treats`, `uses`, `causesPain` → data/items.json
**Source.** design/design.md › Tactical Layer › Medical system › Conditions; design/item-list.md › Medical items

## Gear and interaction

### [TAC-068] Item access tiers
**Rule.** Using an item (magazine, grenade, medical, other) from the load-bearing vest or battle belt costs the item's normal AP. From the backpack: item AP + `backpackSurcharge`, the same for every item; a backpack flagged awkward (duffel bag) adds its own extra (value open).
**Values.** `backpackSurcharge` — 4 (draft) → data/tactical-rules.json; backpack `extraAccessAp` (ITM-018) — not set (design: "extra AP") → data/items.json
**Status.** open
**Source.** design/tactical-actions.md › Gear and interaction, Medical; design/design.md › Data definitions › Soldier equipment slots; design/item-list.md › Backpacks

### [TAC-069] Drop the backpack
**Rule.** A soldier may drop the backpack onto their tile during an activation for `dropBackpackCost` AP; it and its contents stay on the map as lootable and its weight no longer counts. A soldier with an empty backpack slot on the backpack's tile may pick it up again (with its contents) for `pickUpBackpackCost` AP.
**Values.** `dropBackpackCost` — 1 (draft), `pickUpBackpackCost` — 4 (draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Gear and interaction; design/design.md › Data definitions › Soldier equipment slots

### [TAC-070] Pick up or loot
**Rule.** A soldier on or adjacent to items, bodies or containers may move items into free slot capacity (weight and type limits per DAT) for `lootCost` AP per item taken. Opening a container or searching a body first costs `openContainerCost` AP and shows its contents. Items not in a slot at battle end stay on the map; only items carried off the map or into the vehicle's storage count as loot in the battle result.
**Values.** `lootCost` — 2 per item (draft), `openContainerCost` — 3 (draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Gear and interaction; design/design.md › Data definitions › Soldier equipment slots

### [TAC-071] Cut a lock
**Rule.** A soldier carrying bolt cutters and adjacent to a locked door or container may cut the lock for `boltCutterCost` AP; the action makes no noise.
**Values.** `boltCutterCost` — 10 → data/items.json (bolt cutters `apCost`)
**Source.** design/tactical-actions.md › Gear and interaction

### [TAC-072] Place a demolition charge
**Rule.** A soldier carrying a demolition charge may place it on an adjacent target for `placeChargeCost` AP, or `placeChargeCostSkilled` if Technical ≥ `placeChargeSkilledThreshold`. Detonation triggers destruction recalculation (TAC-036).
**Values.** `placeChargeCost` — 8 (draft), `placeChargeCostSkilled` — 6 (draft), `placeChargeSkilledThreshold` — 50 (draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Gear and interaction

### [TAC-073] Restrain a VIP
**Rule.** In a capture mission, a soldier on a tile adjacent to the VIP may restrain them for `restrainCost` AP, only once the VIP has surrendered or is wounded.
**Values.** `restrainCost` — 6 (draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Gear and interaction

### [TAC-074] Carry or drag a wounded squadmate
**Rule.** A soldier adjacent to a wounded squadmate may lift them for `liftCost` AP to carry or drag them, and put them down for `putDownCost` AP. Carrying: the carrier must be upright; each tile costs the walk cost (TAC-029) + `carryMoveSurcharge`; no sprinting (TAC-032) or climbing (TAC-034). Dragging: possible upright or crouched; each tile costs the walk cost (plus the crouch surcharge when crouched, TAC-030) + `dragMoveSurcharge`.
**Values.** `liftCost` — 4, `putDownCost` — 2, `carryMoveSurcharge` — 2 per tile, `dragMoveSurcharge` — 3 per tile (all draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Gear and interaction (Carry or drag a wounded squadmate)

## Open questions

1. **Resolved (design 8972470):** wounds do not reduce the AP pool; they raise the cost of the actions that use the wounded zone (design.md no longer lists leg/arm wounds as turn modifiers). TAC-006 / TAC-058: design.md says leg or arm wounds reduce the AP pool for the activation; tactical-actions.md lists only suppression, stun, pain and over-encumbrance as AP modifiers and treats arm wounds as raising aim/reload cost and leg wounds as raising movement cost. Which applies?
2. **Resolved (design 8972470):** an arm or leg counts as wounded below 50% of its max HP (TAC-062 `woundedThreshold`); healing it above that removes the state. TAC-009 / TAC-058 / TAC-062: "wounded" leg/arm is undefined. Spec assumes "below max HP or fractured"; does any scratch count, and does healing to full remove it?
3. **Resolved (design 8972470):** the surcharge is charged when the activation ends, as specced. Still open: whether a soldier with exactly 2 stamina may sprint. TAC-008: the +1 stamina surcharge depends on sprinting during the activation, but stamina is checked at activation start. Spec charges it at the end (floored at 0). Confirm, and confirm whether a soldier with exactly 2 stamina may sprint.
4. TAC-011: does a soldier who made reaction attempts in a turn still recover stamina that turn? Spec: yes (reacting is not activation).
5. TAC-013: "contact" and "skip ahead until something changes" are undefined for the stall rule.
6. TAC-015: what counts as "cover is hit" (any shot hitting an edge the soldier is behind? only shots aimed at them?), and is the suppression spread increase a fixed amount? Nerve's reduction is not quantified.
7. TAC-003: boundaries — is exactly 21:00 night and exactly 06:00 day? Spec uses [06:00, 21:00) as day.
8. TAC-004: no formula for base sight/spotting range (Perception + Recon), nor for flashlight blinding.
9. TAC-019: the "alerted" state has no defined effect.
10. **Resolved (design 8972470):** one attempt per mover per entry into the vision cone (second part, as specced). Still open: whether a non-moving action triggers reactions. TAC-020 / TAC-036: the reaction trigger is "an opposing soldier moves into or through the cone", but destruction "can trigger reactions on newly opened sightlines" without movement. Does a non-moving action (firing, opening a sightline) trigger reactions? Also: can a reactor attempt more than once against the same mover in one move?
11. TAC-022: distance, stance, sprint, noise and wound modifiers have no values; does Nerve or Recon (noise) feed in?
12. TAC-023: Take cover — which tile when several qualify, and is it limited to one tile? Does the Fire reaction use a specific fire mode (single shot?) and the snap-shot penalty value?
13. **Resolved (design 8972470):** setting a reaction is free and can be changed any number of times in the activation. TAC-021: the cost of setting a reaction is not stated (tactical-actions: Open).
14. TAC-044: the shooter-spread function (Marksmanship, Perception at range, stance, aim time, wounds) and how terms combine (additive in MoA?) are open; "hip shot" is mentioned for lasers but never defined as a fire option.
15. TAC-045: the relation between cone width and the normal distribution's σ ("where nearly all shots land") needs a number.
16. TAC-046: exact preview sample count ("a few hundred") and whether the preview must match the result exactly or only statistically.
17. TAC-050: "condition percentage" for armour is assumed to be durability ÷ max durability; durability loss per hit and whether penetrating hits also wear armour are not set. Do arms/legs ever get armour ("usually none")?
18. TAC-051: is blunt damage also subject to the 10% damage floor and does it cause bleeding/pain?
19. TAC-059 / TAC-067: arm or leg at 0 HP has "no negative effects for now", yet the surgical kit exists to bring them back to 1 HP. Does a limb at 0 HP keep its wound effects, or is there a missing 0-HP effect?
20. TAC-059: damage overflow from a 0-HP limb is discarded in the spec; does it transfer to the thorax?
21. **Resolved (design 8972470):** the item list now says the dressing is light and quick and the medkit also stops heavy bleeding in any zone; dressing and medkit cover every zone, the tourniquet arms and legs only; there is no "only fix". TAC-061 / TAC-067: item list says hemostatic dressing is the "only fix for thorax and head bleeding in the field", but the medkit stops heavy bleeding (zone unrestricted) and bandage/IFAK stop light bleeding in any zone. Clarify which zones each item covers.
22. TAC-060 / TAC-061 / TAC-062: bleeding chances per hit/zone, the damage threshold for "hard hits" and "heavy hits", fall damage and Endurance bleed resistance are all unquantified.
23. TAC-063 / TAC-026: pain causes (which damage amount), AP and spread magnitude, and whether painkillers stack, are open.
24. TAC-065: order of operations — is the "never below 1" minimum applied before the self-treatment and backpack surcharges (spec) or after?
25. TAC-066: is the IFAK's 15-HP cap applied before or after the Medical multiplier, and does the multiplier apply to the medkit too?
26. **Resolved (design 8972470):** AP penalty −5 over carry capacity, −10 over 125% of it (draft) (part). Still open: carry capacity formula, Strength's reduction, heavy assault armour penalties. TAC-027: carry capacity formula (DAT/MGT) and the AP penalty are open; heavy assault armour's "large stamina and AP penalties" has no rule.
27. **Resolved (design 8972470):** draft values for terrain, diagonal, crouch, prone, sprint, stance, turn, vault and climb; turning along a path while moving is free. Remaining gap: question 32. TAC-029..TAC-034, TAC-017: terrain, diagonal, crouch, prone, sprint, stance, turn, vault and climb costs are all open; is a facing change implied by a move step free?
28. **Resolved (design 8972470):** draft fire AP per weapon type with burst/auto/ergonomics modifiers, aim steps, reload by feed type, swap and throw costs (part). Still open: the Strength → throw distance formula. TAC-039..TAC-043: fire-mode AP costs, aim steps, reload, swap and throw costs and the Strength→throw distance formula are open.
29. TAC-047: recoil-control formula and tracer's reduction value are open.
30. **Resolved (design 8972470):** leaving the map is free once the soldier ends the move on an exit tile with its condition met (AP part). Still open: whole squad, morale fleeing. TAC-038: AP cost of leaving the map; does leaving require the whole squad, and how does the Management morale rule (below 20 an activated soldier may flee toward the nearest exit) hook into activation? Ownership of that rule is outside this file's sources.
31. TAC-044: weapon Condition raises jam chance and spread (weapon profile) — no jam rule or magnitudes are given for the tactical layer.
32. TAC-033: the cost of upright → prone is not stated (only upright ↔ crouched, crouched → prone, prone → crouched, prone → upright). Is it a direct transition or crouched-then-prone (2 + 2)? design.md also names Agility for stance changes; tactical-actions gives no Agility term.
33. TAC-040 / TAC-041 / TAC-042: design.md says Marksmanship and weapon ergonomics lower reload and aim costs and Agility speeds up swaps; its attribute table adds Agility (minor) to reload and Marksmanship and ergonomics to swaps. tactical-actions has no ergonomics term for aiming, no Agility term for reload and no Marksmanship/ergonomics term for swaps. Spec follows tactical-actions; confirm.
34. TAC-040 / TAC-043: "aiming arm" and "throwing arm" are undefined (handedness?). Do a wounded aiming arm and pain stack (+2 per step), or is it +1 if either applies? Does the 15% spread reduction per aim step add up (3 steps = −45%) or multiply (×0.85³)?
35. TAC-041: "wounded arm" — either arm or a specific one? For tube-fed weapons (2 AP per shell), do the Marksmanship, ergonomics, backpack and wound terms apply per shell or once per reload; can a reload be partial? The item list gives no feed type per weapon (box magazine vs belt for LMGs; stripper clip, bolt-action or box magazine for bolt rifles), so `feedType` must be assigned in content.
36. TAC-039: does a per-weapon `fireApCost` override replace only the weapon-type default (spec: yes; burst/auto and ergonomics modifiers still apply) or the final cost? Are burst modes other than 3 rounds allowed? What happens when a burst or auto mode is fired with fewer rounds loaded than it fires? The type list names only bolt-action sniper rifles.
37. TAC-042: "weapon over 6 kg" — the weapon being readied, the one put away, or either; base or effective weight (with mods)?
38. TAC-029 / TAC-062 / TAC-009: "a leg fracture then multiplies the whole tile cost by 1.5" — does the multiplier apply only to a leg that is also wounded (below 50%), or to any fractured leg (spec)? Does a fractured limb above 50% HP count as wounded for max stamina?
39. TAC-024: the design states multiplier-after-additives only for the leg fracture ("whole tile cost"); the spec applies it to every action (e.g. reload arm fracture ×1.5 after the backpack +4). Confirm.
40. TAC-070: is the 3 AP open/search cost paid once per container or body per battle, or per soldier or visit? Are its contents then shown to the whole side?
41. TAC-074: the spec requires the carrier to be adjacent (not stated). Can dead squadmates, enemies or a restrained VIP be carried or dragged? Does the carried soldier's weight count toward the carrier's encumbrance? Can a carrier vault, and can a soldier drag while prone?
42. TAC-038: "end the move on an exit tile" — may a soldier who starts an activation on an exit tile leave without moving?

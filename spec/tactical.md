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

### [TAC-001] Sides on a map
**Rule.** A tactical map holds the player side, one opponent side and, when such units are present, a third **neutral side**. The player side may include allied units controlled by AI (defenders, convoy, escorted VIP); they belong to the player side for turn order, but their activations are commanded by the AI controller (TAC-005, TAI-018). Units hostile to neither side (a non-involved faction, civilians) form the neutral side, controlled by the tactical AI (TAI-017). The tactical map request marks them: every `sides[]` entry with `role: "neutral"` belongs to the neutral side; who is hostile to whom among the factions present comes from the request's `hostility` map (faction → faction → boolean). There is no per-unit hostile flag. The neutral side never activates and never takes an activation slot in the turn (TAC-005): its units only react (take cover, flee) or turn hostile. A neutral unit that is attacked turns hostile toward the attacking side (the side whose unit attacked it).
**Status.** open (what a neutral unit does once hostile, how its reactions are chosen and paid — see Open questions)
**Source.** design/design.md › Tactical Layer › Turn structure; design/design.md › Tactical Layer (Enemy AI)

### [TAC-002] Turn-based from the start
**Rule.** The battle is turn-based from the first moment on the map, including stealth. There is no real-time exploration phase; the first turn starts when the map is entered.
**Source.** design/design.md › Tactical Layer (Turn structure bullet)

### [TAC-003] Battle duration and day/night
**Rule.** Every battle consumes exactly 1 hour of strategic game time regardless of turns played; the battle result reports it as `battle_result.gameTimeHours`. TAC-003 owns the battle duration; STR-023 only points here. The battle uses the strategic clock time at its start: start time in [06:00, 21:00) → day battle; [21:00, 06:00) → night battle. The day/night flag is fixed for the whole battle.
**Values.** `battleDurationHours` — 1 → data/tactical-rules.json (single owner; strategic-rules has no battle duration); `dayStartHour` — 6, `nightStartHour` — 21 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Time of day

### [TAC-004] Night sight reduction
**Rule.** In a night battle, each soldier's sight range and spotting range = day value × `nightSightFactor`, unless the soldier carries an active flashlight (weapon tactical module), which restores the full day range. A flashlight also reveals its carrier to enemies and can blind enemies in its cone (effect not set, design: Open). The day sight/spotting range itself derives from Perception (main) and Recon (minor); formula not set (design: Open). The night sight rule is owned by TAC; MGT-030 only points here.
**Values.** `nightSightFactor` — 1/3 → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Time of day; design/design.md › Data definitions › Weapon profile (tactical modules)

### [TAC-076] Objective met in battle
**Rule.** The tactical map request (`objectives[]`) lists only the battle's mission objectives that can be met on the tactical map; its objective `type` is one of `killVip` (a VIP killed, with the proof its mission asks for, MGT-044), `captureVip` (captured: restrained, TAC-073), `destroyTarget` (a target destroyed), `saveCargo` (cargo saved). TAC checks them after every resolved action and reaction; the moment an objective's goal is met it is marked met, and the player is shown an "Objective met" notification at once. A met objective stays met whatever happens afterwards in the battle, including the loss of the whole squad. The battle result lists every objective met with the turn it was met; the strategic layer confirms the mission (STR) and passes it to Management. Objectives met on the strategic map (delivery, hand-over, holding a place, deadline) are not TAC's and are never put in the request; an AI side's own aim in the battle (attack, defend, hold, escort) is its `battleGoal` (TAI-009), not an objective.
**Source.** design/design.md › Overview › Core loop; design/design.md › Management › Contracts and missions › Mission types

### [TAC-078] Contamination and mines on the tactical map (optional)
**Rule.** OPTIONAL — left out of the first build iterations. A battle in a contaminated region (`contaminated` region flag in the tactical map request, STR-080) makes soldiers lose HP every turn they spend there; a `mined` region places mines on roads and approaches of the tactical map, cleared by Technical soldiers. Until this is built, TAC ignores both flags.
**Values.** contamination HP loss per turn — not set (design: Open) → data/events.json (STR-080); mine placement, mine damage and clearing rule — not set (design: Open) → data/tactical-rules.json `mines` (object)
**Status.** optional
**Source.** design/world-events.md › Desperate measures (Mining the roads); › Nuclear strike (rare) (Effect)

### [TAC-080] Tactical map from the encounter tile
**Rule.** The tactical layer generates the battle map from the tactical map request alone (`seed`, `rulesVersion`, `region`); the same request and rules version always give the same map. The encounter tile's strategic terrain sets the map: the request carries `region.terrain` and `region.biome`, the biome of that terrain in the strategic terrain table (STR-095). The biome selects the tactical terrain table and the prefab table that STR-095 names for it (`tacticalTerrainTable`, `prefabTable` in data/strategic-terrain.json); the generator draws tactical terrain only from data/terrain.json records listed in that terrain table and prefabs only from data/prefabs.json records listed in that prefab table (record field `tables`). The map has 2–4 exits; each exit has an `id`, unique on the map, and a condition (`none`, `fuel`, `boatAtTurn`, `paidCrossing`; TAC-038); the battle result reports the exit a soldier used as `soldiers[].exitId`. The generation stages and their rules (terrain layout, roads, prefab placement, cover scatter, spawns and objective placement, playability checks) are not in the design.
**Values.** `exitCount` — min 2, max 4 → data/mapgen/tactical.json; exit conditions and their parameters → data/mapgen/tactical.json `exits[]`; stage rules (`pipeline`, `terrain`, `roads`, `prefabs`, `cover`, `spawns`, `validate`) — not set (design: none) → data/mapgen/tactical.json
**Status.** open (generation stages are not designed; which exits the request fixes and which the generator adds)
**Source.** design/design.md › Strategic Layer › Map (draft) (biome per strategic terrain type); › Strategic Layer › Squads and simulation (draft) (Encounters: the tile's terrain sets the tactical map); › Management › Gear, loot & return (2–4 exits with conditions)

## Turn and activation

### [TAC-005] Turn order and activation choice
**Rule.** Combat alternates single-soldier activations: player side, then opponent side; the pair is one turn. There are no rounds. On its activation a side picks any one of its soldiers that may be activated (stamina ≥ `activationCost`, TAC-008), including the soldier it activated last turn, or passes (TAC-010). At the start of an activation the soldier's AP pool is set to its full AP (TAC-006); unspent AP from earlier activations are lost. The neutral side (TAC-001) is never given an activation.
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation; design/tactical-actions.md › Turn and activation

### [TAC-006] Action points per activation
**Rule.** Full AP = 25 + floor(Agility ÷ 10) (range 25–35 for Agility 1–100). AP for this activation = full AP − sum of active AP modifiers (suppression TAC-015, stun TAC-025, pain TAC-026, over-encumbrance TAC-027), never below 0. These four are the only AP modifiers: wounds do not reduce the AP pool. Wounded or disabled legs raise movement cost (TAC-029); wounded or disabled arms widen the shooting cone and the grenade scatter instead of costing AP (TAC-058). AP is spent on movement, stance, turning, aiming, firing, reloading, medical and gear actions. This formula is owned by TAC; the Management attribute table (MGT-026) only names the attribute and points here, and the values live only in `data/tactical-rules.json`.
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
**Rule.** Max stamina = 2 + floor(Endurance ÷ 20) (range 2–7), minus 1 per wounded leg (TAC-062), never below 0. Current stamina is clamped to the max whenever the max changes. Soldiers enter the battle at max stamina. A disabled leg (0 HP, TAC-059) is below `woundedThreshold` and counts as wounded here. This formula is owned by TAC; MGT-027 only points here.
**Values.** `staminaBase` — 2, `staminaEnduranceDivisor` — 20, `staminaPerWoundedLeg` — 1 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Stamina; design/design.md › Management › Soldier attributes › Derived values

### [TAC-010] Pass
**Rule.** A side with no soldier able to be activated must pass; a side may also pass by choice. Passing is free and consumes that side's activation slot of the turn.
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation; design/tactical-actions.md › Turn and activation

### [TAC-011] Stamina recovery
**Rule.** At the end of each turn, every soldier (both sides) who was not activated in that turn gains `staminaRecovery` stamina points, up to max stamina. Reacting does not count as being activated: a soldier who only made reaction attempts in that turn still recovers.
**Values.** `staminaRecovery` — 1 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation, Stamina; design/tactical-actions.md › Turn and activation (Pass)

### [TAC-012] Exhaustion
**Rule.** A soldier with stamina < `activationCost` cannot be activated. A soldier with stamina 0 cannot make reaction attempts.
**Source.** design/design.md › Tactical Layer › Turn structure › Stamina

### [TAC-013] Stall rule
**Rule.** If for `stallTurns` consecutive turns both sides pass and no soldier sees or hears an enemy, turns advance automatically: each automatic turn is a turn in which both sides pass (stamina recovers, TAC-011; durations count down, TAC-014). Automatic advance stops as soon as a soldier sees or hears an enemy, or a side's controller activates a soldier instead of passing.
**Values.** `stallTurns` — 2 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation

### [TAC-014] Durations in turns
**Rule.** Every effect with a duration (bleeding ticks, smoke, painkillers, suppression) is counted in turns. Per-turn effects (e.g. bleeding HP loss) are applied once at the end of each turn.
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation

### [TAC-015] Suppression
**Rule.** A soldier becomes suppressed when hit, when an enemy shot hits their cover, or when an enemy shot lands within `suppressionRadiusTiles` of them (impact point on the soldier's tile or a tile at most that many steps away, 8-neighbourhood). While suppressed: −`suppressionAp` AP on each activation, shooter spread + `suppressionSpread`, no reaction attempts. Suppression ends after one full turn passes with no qualifying event; any new qualifying event restarts the count. Nerve's reduction of suppression is deferred (TAC-077, optional) and not applied in the first build iterations.
**Values.** `suppressionAp` — 5, `suppressionRadiusTiles` — 1 → data/tactical-rules.json; `suppressionSpread` — not set (design: Open) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation; design/tactical-actions.md › AP modifiers on an activation; design/design.md › Management › Soldier attributes (Nerve)

### [TAC-077] Morale flight and Nerve in battle (optional)
**Rule.** OPTIONAL — left out of the first build iterations. (a) Morale flight: while the squad's morale (MGT-008, read from the tactical map request `sides[].morale`) is below the flee threshold `moraleFleeBelow`, an activated soldier may disobey and flee toward the nearest exit. (b) Nerve (from the service record) lowers the effect of suppression (TAC-015) and how much casualties shake the squad's morale. Until built, TAC applies neither: no flight roll, and suppression has its full effect for every soldier.
**Values.** `moraleFleeBelow` — 20 (MGT-008) → data/management-rules.json; `moraleFlight.chance` (flight chance), `moraleFlight.nerveSuppressionReduction`, `moraleFlight.nerveMoraleReduction` (Nerve's reduction of suppression and of morale loss) — not set (design: Open) → data/tactical-rules.json
**Status.** optional
**Source.** design/design.md › Management › Soldiers & progression (Contracts & morale); › Soldier attributes (Nerve)

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
**Rule.** A soldier who hears a shot (TAC-018), or perceives gunfire or loud noise outside their vision cone, becomes alerted. At the start of the soldier's next activation, they turn to face the noise source (free, no AP or stamina). A noise marker at the source is shown to the soldier's side — on the player UI and in the side's perception view (`noises`, TAI-004). Being alerted never triggers a reaction attempt and gives no reaction bonus. The alerted state clears once the free turn is applied.
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
**Rule.** Each attempt costs `reactionCost` stamina point, success or not. Chance = clamp(50 + (reactor Perception − mover Agility) / 2 + modifiers, 10, 90) %. Modifiers: distance, mover's stance (crouched harder, prone hardest), mover sprinting (easier), noise, reactor's wounds. Modifiers are applied before the clamp. One seeded roll decides. This formula is owned by TAC; MGT-030 only points here.
**Values.** `reactionCost` — 1, `reactionBase` — 50, `reactionMin` — 10, `reactionMax` — 90 → data/tactical-rules.json; distance/stance/sprint/noise/wound modifiers — not set (design: Open) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Reactions; design/tactical-actions.md › Turn and activation

### [TAC-023] Reaction resolution
**Rule.** On success, the reaction resolves immediately, before the mover continues. Fire: a single shot (one round, whatever the selected fire mode) at the mover with the normal hit model (TAC-044..) plus the snap-shot spread penalty. A reactor on overwatch (TAC-075) instead fires one shot action in the weapon's current fire mode (TAC-039), without the snap-shot penalty. Take cover: the reactor moves to the nearest tile within `takeCoverRangeTiles` that has cover against the mover; if there is none, the reactor crouches (an already crouched or prone reactor stays as is). Reactions spend no AP. Afterwards the mover continues and may spend its remaining AP. On failure, the mover is not noticed by that reactor; the stamina point is still spent.
**Values.** `takeCoverRangeTiles` — 1 → data/tactical-rules.json; `snapShotSpread` — not set (design: Open) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Reactions; design/tactical-actions.md › Turn and activation (Hold overwatch)

### [TAC-075] Hold overwatch
**Rule.** During an activation a soldier may go on overwatch for `overwatchCost` AP. Overwatch lasts until the start of the soldier's next activation. While on overwatch, the soldier's Fire reactions (TAC-023) fire one shot action in the weapon's current fire mode (TAC-039; rounds and recoil as for that mode, no AP spent) with no snap-shot penalty. Overwatch changes nothing else: the reaction trigger, the stamina cost and chance (TAC-020, TAC-022) and the reaction setting (TAC-021) are unchanged, so overwatch only matters with reaction setting Fire.
**Values.** `overwatchCost` — 4 (draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Turn and activation (Hold overwatch); design/design.md › Tactical Layer › Turn structure › Reactions

## Action costs and AP modifiers

### [TAC-024] Action cost composition
**Rule.** `design/tactical-actions.md` is the single source for every action cost and its modifiers; no other attribute or gear term applies. Every cost is computed in this order: (1) base cost = the action's listed cost (for movement: the walk or diagonal cost plus the destination's terrain cost, TAC-029); (2) all multipliers applied to the base cost (e.g. fracture ×1.5, disabled leg ×2; several multipliers multiply together); (3) all additive terms added (attribute and ergonomics thresholds, surcharges such as stance, sprint, carry/drag, wounded leg, backpack); (4) rounded down to a whole number; (5) never below 1 AP. Actions defined as free (cost 0: pass, final facing, set reaction, leave the map) are exempt from the minimum. An action that costs more AP than the soldier has left cannot be started. Attribute thresholds ("Agility 70+") mean attribute ≥ threshold; "ergonomics 30 or below" means ≤ 30.
**Source.** design/design.md › Tactical Layer (Action points), › Actions and costs; design/tactical-actions.md (intro: order of cost calculation)

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
**Rule.** If total carried weight (all seven equipment slots and contents) exceeds the soldier's carry capacity, the soldier is over-encumbered: −`encumbranceApPenalty` AP on each activation, or −`heavyEncumbranceApPenalty` AP instead if carried weight exceeds `heavyEncumbranceThreshold` × carry capacity (the two do not stack), plus the activation stamina surcharge (TAC-008). Strength lowers the penalty for heavy kit (amount not set, design: Open). Carry capacity derives from Strength (main) and Endurance (minor); formula not set (design: Open), owned by MGT/DAT. TAC-027 owns the weight → AP and stamina penalty and its values; MGT-033 only points here.
**Values.** `encumbranceApPenalty` — 5 (draft), `heavyEncumbranceApPenalty` — 10 (draft), `heavyEncumbranceThreshold` — 1.25 (draft) → data/tactical-rules.json; `encumbranceStrengthReduction` (Strength's reduction of the penalty) — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer (Action points); design/tactical-actions.md › AP modifiers on an activation; design/design.md › Data definitions › Soldier equipment slots

## Movement

### [TAC-028] Tactical grid
**Rule.** The map is a grid of square tiles (about 1.5 m) on multiple levels (floors, roofs). Movement is tile to tile in 8 directions. Levels connect via stairs, ladders and windows to vault.
**Values.** `tileSizeM` — 1.5 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Movement)

### [TAC-029] Walk one tile
**Rule.** Base tile cost = `walkCost` (orthogonal step) or `diagonalWalkCost` (diagonal step, instead of `walkCost`) + terrain cost of the destination tile. Multipliers on the base tile cost (TAC-024): × `disabledLegMoveFactor` if at least one leg is disabled (0 HP, TAC-059; applied once, however many legs are disabled); × `fractureMoveFactor` if at least one leg is fractured (TAC-062), also on top of a disabled leg (×2 × 1.5 = ×3). Then the additive terms: + `legWoundMoveSurcharge` per wounded leg that is not disabled (below `woundedThreshold` of its max HP but above 0 HP; a disabled leg takes the ×2 instead of the +1), plus the stance (TAC-030/031), sprint (TAC-032) and carry/drag (TAC-074) terms; then rounded down, never below 1 AP.
**Values.** `walkCost` — 2, `diagonalWalkCost` — 3 (draft), `legWoundMoveSurcharge` — 1 (draft), `disabledLegMoveFactor` — 2 (draft), `fractureMoveFactor` — 1.5 → data/tactical-rules.json; per-terrain `moveCost` (draft): road, floor, grass 0; mud, shallow water, rubble, dense brush 1; stairs 1 → data/terrain.json
**Source.** design/design.md › Tactical Layer (Movement); design/tactical-actions.md › Movement (Walk one tile, Leg wounds) and intro; design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; › Medical system › Conditions

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
**Rule.** Stances: upright, crouched, prone. Changing stance costs AP per transition; getting up from prone costs the most. Upright → prone goes through crouched and costs upright → crouched + crouched → prone as one stance change. No attribute modifies stance-change cost (Tactical actions is the single cost source, TAC-024).
**Values.** `stanceCost` per transition (draft): upright → crouched 2, crouched → upright 2, crouched → prone 2, prone → crouched 4, prone → upright 6, upright → prone 4 (2 + 2) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Movement); design/tactical-actions.md › Movement (Change stance); design/design.md › Management › Soldier attributes (Agility row)

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
**Rule.** Each map has 2–4 exits (TAC-080); each exit has an `id` and carries its own condition (vehicle fuel, a boat at a set turn, a paid crossing). A soldier on an exit tile whose condition is met may leave the map — either by ending a move there, or, already standing there, at the start of its activation without moving; leaving is free. Soldiers who left are out of the battle and count as survivors in the battle result, with `status: leftMap` and the `exitId` of the exit they used.
**Values.** `exitCost` — 0 (draft: free) → data/tactical-rules.json; exit count and conditions → TAC-080, data/mapgen/tactical.json
**Source.** design/tactical-actions.md › Turn and activation; design/design.md › Management › Gear, loot & return

## Weapons

### [TAC-039] Fire
**Rule.** A shot action uses one fire mode of the equipped weapon (weapon field `fireModes`, e.g. [1, 3] or [1, auto]); the mode sets rounds fired and AP cost. Mode 1 fires one round; a burst mode fires `burstRounds` rounds (the design's burst is 3 rounds, i.e. mode 3); `"auto"` fires `autoRounds` rounds. AP cost = fire AP of the weapon (its `fireApCost` override if set, else `fireApByWeaponType` for its `weaponType`) + `burstApSurcharge` (burst) or `autoApSurcharge` (auto) − `ergoApDelta` if ergonomics ≥ `ergoHighThreshold` + `ergoApDelta` if ergonomics ≤ `ergoLowThreshold`, then TAC-024. Each round consumes one cartridge from the loaded magazine; firing with an empty magazine is not allowed. A burst or auto mode with fewer rounds loaded than it fires fires the rounds that are left, at the full AP cost of that mode. Rounds in a burst are resolved in order with growing recoil spread (TAC-047).
**Values.** `fireApByWeaponType` (draft): `pistol` 4, `smg` 5, `assaultRifle` 6, `shotgun` 6, `battleRifle` 7, `dmr` 7, `lmg` 8, `sniperRifle` (bolt-action) 9; `burstRounds` — 3, `burstApSurcharge` — 2, `autoRounds` — 5, `autoApSurcharge` — 4, `ergoHighThreshold` — 70, `ergoLowThreshold` — 30, `ergoApDelta` — 1 (all draft) → data/tactical-rules.json; per-weapon `fireApCost` override → data/items.json
**Source.** design/tactical-actions.md › Weapons (Fire); design/design.md › Data definitions › Weapon profile

### [TAC-040] Aim longer
**Rule.** Before a shot, the soldier may spend n aim steps, 0 ≤ n ≤ `maxAimSteps`; shooter spread (TAC-044) is multiplied by `aimSpreadFactor`^n (3 steps: 0.85³ ≈ 0.61, i.e. ≈ −39%). Cost per step = `aimStepCost`, or `aimStepCostSkilled` if Marksmanship ≥ `aimSkilledThreshold`; + `aimPainSurcharge` per step if the soldier is in pain (TAC-063). A wounded or disabled arm adds no aim AP (it widens the cone instead, TAC-058). No ergonomics term applies to aiming.
**Values.** `aimStepCost` — 2 (draft), `aimStepCostSkilled` — 1 (draft), `aimSkilledThreshold` — 75 (draft), `maxAimSteps` — 3 (draft), `aimSpreadFactor` — 0.85 per step (placeholder; replaces `aimSpreadReduction`), `aimPainSurcharge` — 1 (draft; replaces `aimWoundSurcharge`) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Action points); design/tactical-actions.md › Weapons (Aim longer)

### [TAC-041] Reload
**Rule.** Reloading a magazine- or belt-fed weapon replaces the loaded magazine (or belt) with a fitting magazine item (DAT-030) from the vest or belt at normal cost, or from the backpack at normal cost + backpack surcharge (TAC-068); the removed magazine keeps its remaining rounds. A tube-fed weapon loads loose shells of its calibre, any number n ≥ 1 per reload up to the free tube capacity (partial reload). Base cost = `reloadApByFeedType` for the weapon's `feedType`; for `tube`, n × `reloadApByFeedType.tube`. Order (TAC-024): base × `armFractureReloadFactor` if an arm is fractured; then − `reloadSkilledBonus` if Marksmanship ≥ `reloadSkilledThreshold` − `ergoApDelta` if ergonomics ≥ `ergoHighThreshold` + `ergoApDelta` if ergonomics ≤ `ergoLowThreshold` + `backpackSurcharge` if the magazine or shells come from the backpack; rounded down, never below 1. Every modifier applies once per reload, also for a tube. A wounded or disabled arm adds no reload AP. No Agility term applies. A fitted magazine mod may modify reload cost (DAT-016 `reloadAp`).
**Values.** `reloadApByFeedType` (draft): `pistol` 4, `boxMagazine` 5, `stripperClip` 6, `boltAction` 6, `belt` 10, `tube` 2 per shell; `reloadSkilledThreshold` — 70, `reloadSkilledBonus` — 1, `armFractureReloadFactor` — 1.5 (all draft) → data/tactical-rules.json (`woundedArmReloadSurcharge` removed); weapon `feedType`, magazine items, magazine mod `reloadAp` modifier → data/items.json
**Source.** design/tactical-actions.md › Weapons (Reload) and intro; design/item-list.md › Weapons (Feed type, magazines are items); design/design.md › Data definitions › Weapon profile, Soldier equipment slots

### [TAC-042] Swap weapon 1 and 2
**Rule.** Switching the active weapon between slots Weapon 1 and Weapon 2 costs `swapCost` AP, or `swapCostPistol` when either weapon has `weaponType: pistol`; − `swapAgileBonus` if Agility ≥ `agileThreshold`; then TAC-024. No Marksmanship, ergonomics or weapon-weight term applies (the heavy-weapon surcharge is removed).
**Values.** `swapCost` — 3, `swapCostPistol` — 2, `swapAgileBonus` — 1 (all draft) → data/tactical-rules.json (`swapHeavyKg`, `swapHeavySurcharge` removed); `agileThreshold` (TAC-034)
**Source.** design/tactical-actions.md › Weapons (Swap between weapon 1 and 2); design/design.md › Data definitions › Soldier equipment slots

### [TAC-043] Throw a grenade
**Rule.** Throwing a grenade (ITM-032) from the vest or belt costs `throwCost` AP; from the backpack + `backpackSurcharge` (TAC-068). Arm wounds add no AP. Strength sets the maximum throwing distance; arm wounds do not change it. The grenade lands at the target tile with a seeded landing scatter; the scatter is × `woundedArmScatterFactor` if the worse arm (TAC-058) is wounded, × `disabledArmScatterFactor` if it is disabled. Effects on landing: TAC-079.
**Values.** `throwCost` — 5 (draft), `woundedArmScatterFactor` — 1.5 (draft), `disabledArmScatterFactor` — 2 (draft) → data/tactical-rules.json (`woundedArmThrowSurcharge` removed); `grenadeScatterBase` (base landing scatter, tiles), `throwDistance` (Strength → throw distance coefficients) — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/tactical-actions.md › Weapons (Throw a grenade); design/item-list.md › Grenades; design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/design.md › Management › Soldier attributes

### [TAC-079] Grenade effects
**Rule.** A grenade (ITM-032) takes effect on landing, at its landing tile. Frag (`effect: frag`): every soldier within `radiusTiles` of the landing tile takes blast damage = `damage` × (1 − d ÷ `radiusTiles`) at distance d tiles (full at the point of impact, falling evenly to 0 at the edge), checked against armour with the grenade's `penetrationClass` (TAC-050/051); solid cover between the landing point and the soldier blocks it. The blast is loud: heard across the whole map (as an unsuppressed shot, TAC-018/019). Smoke (`effect: smoke`): a cloud of `radiusTiles` around the landing tile for `durationTurns` turns (TAC-014) that blocks line of sight into, out of and through it; no damage; quiet (no noise event). Which body zone the blast damage hits, and what counts as "solid" cover, are not set.
**Values.** grenade `damage`, `radiusTiles`, `penetrationClass`, `durationTurns`, `loud` → data/items.json (ITM-032); `blastZoneShares` (zone → share of blast damage), `blastBlockingCover` (cover levels that block a blast: `full`, or `half` and `full`) — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/item-list.md › Grenades

## Hit model

### [TAC-044] Total spread
**Rule.** Total spread (MoA, game scale) = (Base MoA × ammo spread modifier + shooter spread) × arm wound factor. Shooter spread is a function of Marksmanship, Perception (at range), stance (prone lowest), arm fracture, pain and suppression, is multiplied by the aim factor (TAC-040), and is reduced at range by optics and for hip/snap shots by lasers. Arm wound factor = `woundedArmConeFactor` if the worse arm is wounded, `disabledArmConeFactor` if it is disabled, else 1 (TAC-058). Weapon condition wear raises spread. 1 MoA ≈ 17 cm of cone width at 50 m (33 tiles), scaling linearly with distance.
**Values.** `shooterSpread` (coefficients) — not set (design: Open) → data/tactical-rules.json; `baseMoA`, ammo `spreadModifier`, optic/laser modifiers → data/items.json
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
**Values.** `recoilSpreadPerRound`, `recoilControl` (Marksmanship and Strength coefficients) — not set (design: Open) → data/tactical-rules.json; tracer modifier — not set → data/items.json (ammo)
**Status.** open
**Source.** design/design.md › Tactical Layer › Hit model; design/design.md › Management › Soldier attributes › Derived values

## Derived per shot

### [TAC-048] Muzzle damage and falloff
**Rule.** Muzzle damage = calibre damage × ammo damage modifier × weapon barrel multiplier. Damage at distance d (tiles) = muzzle damage × (1 − falloffShare × d ÷ falloffRange), never below `falloffFloor` × muzzle damage. falloffShare and falloffRange come from the loaded ammo. Example: 6% per 15 tiles → −6% at 15, −12% at 30.
**Values.** `falloffFloor` — 0.10 → data/tactical-rules.json (the single name for the floor; ITM-005 points here); calibre `damage`, ammo `damageModifier`, `falloffShare`, `falloffRange`, weapon `barrelMultiplier` → data/items.json
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
**Values.** box dimensions and offsets per zone and stance → data/tactical-rules.json `zones.<zone>.hitboxes.<stance>`
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes

### [TAC-053] Aiming arm pose
**Rule.** While the soldier is aiming (in a shot action or with Fire reaction readied), the arm boxes swing forward in front of the thorax, partly shielding it from the front.
**Values.** aiming arm offsets — not set (design: Open) → data/tactical-rules.json `zones.<arm>.hitboxes.aiming`
**Status.** open
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes

### [TAC-054] Crouched hitboxes
**Rule.** Crouched: total height ~1.20 m, legs folded under the thorax, head at ~1.00–1.20 m. Behind half cover the legs and most of the thorax are hidden.
**Values.** crouched box layout → data/tactical-rules.json `zones.<zone>.hitboxes.crouched`
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Stance

### [TAC-055] Prone hitboxes and limits
**Rule.** Prone: lying flat along the facing, total height ~0.40 m. From the front only head, arms (when aiming) and top of thorax are exposed; from the side the whole body. Behind half cover a prone soldier is fully hidden until they fire over it. Prone gives the lowest shooter spread; no sprinting, vaulting or climbing while prone.
**Values.** prone box layout → data/tactical-rules.json `zones.<zone>.hitboxes.prone`
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Stance

### [TAC-056] Cover occlusion
**Rule.** Cover is geometry in the trace (TAC-045): half cover (edge ~1.0 m) hides an upright soldier's legs and lower thorax; full cover hides everything. A soldier firing over half cover or leaning out of full cover exposes the boxes above/beside the edge for the duration of the shot (and for reaction fire at them during it).
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Stance

### [TAC-057] Zone HP
**Rule.** Zone max HP = floor(base HP × (0.5 + 0.75 × Endurance / 100)). Base HP: head 35, thorax 85, each arm 60, each leg 70. E.g. Endurance 20 → ×0.65, 67 → ×1.0, 100 → ×1.25. Zone HP never goes below 0; damage beyond 0 in a zone is discarded (damage to an already disabled limb is redistributed, TAC-059). This formula, including the rounding down, is owned by TAC; MGT-028 only points here.
**Values.** `zones.<zone>.baseHp` — head 35, thorax 85, arm 60, leg 70 → data/tactical-rules.json; `hpScaleBase` — 0.5, `hpScaleEndurance` — 0.75 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/design.md › Management › Soldier attributes › Derived values

### [TAC-058] Zone damage effects
**Rule.** Damage to a zone may trigger: head → stun chance (TAC-025); thorax → high bleeding chance (TAC-060/061). Limb states (TAC-062): an arm or leg is **wounded** below `woundedThreshold` of its max HP and above 0 HP, **disabled** at 0 HP (TAC-059). Arms: only the worse of the two arms counts (disabled worse than wounded worse than neither; no handedness). Worse arm wounded → shooting cone (TAC-044) × `woundedArmConeFactor` and grenade landing scatter (TAC-043) × `woundedArmScatterFactor`; worse arm disabled → cone × `disabledArmConeFactor` and scatter × `disabledArmScatterFactor`. Arm wounds add no AP to aim, reload or throw, and do not change throwing distance. Legs: wounded → + `legWoundMoveSurcharge` per tile per wounded leg and max stamina −1 per wounded leg (TAC-009); disabled → movement base tile cost × `disabledLegMoveFactor`, once however many legs (TAC-029). Wounds never reduce the AP pool (TAC-006).
**Values.** `woundedArmConeFactor` — 1.5, `disabledArmConeFactor` — 2, `woundedArmScatterFactor` — 1.5, `disabledArmScatterFactor` — 2, `disabledLegMoveFactor` — 2 (draft) → data/tactical-rules.json; per-zone bleeding chances `zones.<zone>.lightBleedChance`, `zones.<zone>.heavyBleedChance` — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/tactical-actions.md › Movement (Leg wounds), Weapons, AP modifiers on an activation

### [TAC-059] Zone at 0 HP
**Rule.** Head or thorax at 0 HP → the soldier dies immediately. Arm or leg at 0 HP → the limb is **disabled** (effects TAC-058) until the surgical kit brings it back to 1 HP (TAC-067; it is then wounded). Damage that hits a disabled limb (after armour, TAC-050/051) is split equally over all zones still above 0 HP, head and thorax included; each share is rounded down (rule convention) and applied to its zone, which may in turn disable a limb or kill the soldier. A dead soldier's seven equipment slots stay on the body as lootable.
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/design.md › Tactical Layer › Medical system › Conditions; design/design.md › Data definitions › Soldier equipment slots

## Medical

### [TAC-060] Light bleeding
**Rule.** Caused by most hits (chance per hit). Effect: −`lightBleedHp` HP per turn in that zone (end of turn, TAC-014) until treated. Treated by bandage, IFAK or medkit. Endurance gives bleed resistance (formula not set).
**Values.** `lightBleedHp` — 1 → data/tactical-rules.json; light bleeding chance per hit `zones.<zone>.lightBleedChance` — not set (design: Open) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Medical system › Conditions, Body zones and hitboxes

### [TAC-061] Heavy bleeding
**Rule.** Caused by hard hits; higher chance on thorax hits and with ammo flagged higher bleeding (HP ammo). Effect: −`heavyBleedHp` HP per turn in that zone until treated. Treated by tourniquet (arm or leg only), hemostatic dressing (any zone) or medkit. A zone has at most one bleeding condition; heavy replaces light.
**Values.** `heavyBleedHp` — 4 → data/tactical-rules.json; `zones.<zone>.heavyBleedChance` — not set (design: Open) → data/tactical-rules.json; ammo `bleedModifier` → data/items.json
**Source.** design/design.md › Tactical Layer › Medical system › Conditions

### [TAC-062] Fracture
**Rule.** Caused by heavy hits or falls on arms and legs. Arm fracture: more aim spread and reload base cost × 1.5 (TAC-041). Leg fracture: base tile cost × 1.5 (TAC-029), stacking with a disabled leg (×2 × 1.5 = ×3), no sprinting. Treated by splint. A "wounded" arm or leg = a limb below `woundedThreshold` of its max HP and above 0 HP; at 0 HP it is "disabled" (TAC-059). Healing it to or above that share removes the wounded state. Fracture effects apply on their own, whether or not the limb is wounded or disabled.
**Values.** `woundedThreshold` — 0.5 (draft) → data/tactical-rules.json; `armFractureReloadFactor` — 1.5 (draft, TAC-041); `fracture.chance`, `fracture.damageThreshold`, `fracture.armSpread` (arm-fracture spread modifier) — not set (design: Open) → data/tactical-rules.json
**Status.** open
**Source.** design/design.md › Tactical Layer › Medical system › Conditions

### [TAC-063] Pain
**Rule.** Caused by damage and by an applied tourniquet. Effect: fewer AP and more aim spread (TAC-026). Painkillers mask it for the item's duration (10 turns); when the mask expires, pain returns if its cause persists.
**Values.** `painThresholds` (pain trigger thresholds) — not set (design: Open) → data/tactical-rules.json; painkiller `durationTurns` — 10 → data/items.json
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
**Rule.** HP restored by one use = min(floor(item `hpPerUse` × (`healScaleBase` + Medical / `healScaleDivisor`)), HP left in the item's pool, HP missing in the zone). The item's base HP per use is applied before the Medical multiplier, so a skilled medic restores more than the base per use (IFAK: 15 base per use from a 60 HP pool; Medical 100 → floor(15 × 1.25) = 18). Medkit: from a 300 HP pool (base per use not stated). The pool is reduced by the HP actually restored; zone HP never exceeds max.
**Values.** `healScaleBase` — 0.75, `healScaleDivisor` — 200 → data/tactical-rules.json; item `hpPerUse` (IFAK 15), `hpPool`, `uses` → data/items.json
**Source.** design/design.md › Tactical Layer › Medical system › Using medical items; design/item-list.md › Medical items (IFAK)

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
**Rule.** A soldier on or adjacent to items, bodies or containers may move items into free slot capacity (weight and type limits per DAT) for `lootCost` AP per item taken. Opening a container or searching a body costs `openContainerCost` AP once per side: the first soldier of a side to open or search it pays, and from then on its contents stay visible to the whole side (and in that side's perception view); later soldiers of that side only pay `lootCost` per item taken. Items not in a slot at battle end stay on the map; only items carried off the map or into the vehicle's storage count as loot in the battle result. A squad without a vehicle (`sides[].vehicle` null in the tactical map request) brings home only what its soldiers carry off the map.
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

### [TAC-074] Carry or drag a body
**Rule.** A soldier on a tile adjacent to a body may lift it for `liftCost` AP, choosing carry or drag (player's choice; the AI's command names the mode), and put it down for `putDownCost` AP. A body is a wounded or dead squadmate, an enemy (dead or alive), or a restrained VIP (TAC-073). The body and all gear on it count toward the carrier's carried weight (TAC-027) while lifted. Carrying is not possible if it would put the carrier over carry capacity; dragging is always possible (the carrier may then be over-encumbered, TAC-027). Carrying: the carrier must be upright; each tile costs the walk cost (TAC-029) + `carryMoveSurcharge`; no sprinting (TAC-032) or climbing (TAC-034). Dragging: upright or crouched, not prone; each tile costs the walk cost (plus the crouch surcharge when crouched, TAC-030) + `dragMoveSurcharge`.
**Values.** `liftCost` — 4, `putDownCost` — 2, `carryMoveSurcharge` — 2 per tile, `dragMoveSurcharge` — 3 per tile (all draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Gear and interaction (Carry or drag a body)

## Open questions

1. **Resolved (design 8972470):** wounds do not reduce the AP pool; they raise the cost of the actions that use the wounded zone (design.md no longer lists leg/arm wounds as turn modifiers). TAC-006 / TAC-058: design.md says leg or arm wounds reduce the AP pool for the activation; tactical-actions.md lists only suppression, stun, pain and over-encumbrance as AP modifiers and treats arm wounds as raising aim/reload cost and leg wounds as raising movement cost. Which applies?
2. **Resolved (design 8972470):** an arm or leg counts as wounded below 50% of its max HP (TAC-062 `woundedThreshold`); healing it above that removes the state. TAC-009 / TAC-058 / TAC-062: "wounded" leg/arm is undefined. Spec assumes "below max HP or fractured"; does any scratch count, and does healing to full remove it?
3. **Resolved (design 8972470):** the surcharge is charged when the activation ends, as specced. Still open: whether a soldier with exactly 2 stamina may sprint. TAC-008: the +1 stamina surcharge depends on sprinting during the activation, but stamina is checked at activation start. Spec charges it at the end (floored at 0). Confirm, and confirm whether a soldier with exactly 2 stamina may sprint.
4. **Resolved (design eb072a2):** yes — reacting is not activation; a soldier who only reacted still recovers +1 stamina at turn end. TAC-011: does a soldier who made reaction attempts in a turn still recover stamina that turn? Spec: yes (reacting is not activation).
5. **Resolved (design eb072a2):** the stall rule is reworded: after 2 turns of passing with no enemy seen or heard, turns advance automatically until someone is seen or heard or a soldier acts; "contact" and "something changes" are no longer used (see question 50). TAC-013: "contact" and "skip ahead until something changes" are undefined for the stall rule.
6. **Resolved (design eb072a2):** an enemy shot landing within 1 tile also suppresses; Nerve's reduction is deferred (TAC-077, optional) (part). Still open: what exactly counts as "cover is hit", and the spread value. TAC-015: what counts as "cover is hit" (any shot hitting an edge the soldier is behind? only shots aimed at them?), and is the suppression spread increase a fixed amount? Nerve's reduction is not quantified.
7. TAC-003: boundaries — is exactly 21:00 night and exactly 06:00 day? Spec uses [06:00, 21:00) as day.
8. TAC-004: no formula for base sight/spotting range (Perception + Recon), nor for flashlight blinding.
9. **Resolved (design eb072a2):** alerted = at the start of its next activation the soldier turns to face the noise for free, and a marker shows its side (and the AI) where the noise came from; no reaction bonus. TAC-019: the "alerted" state has no defined effect.
10. **Resolved (design 8972470):** one attempt per mover per entry into the vision cone (second part, as specced). Still open: whether a non-moving action triggers reactions. TAC-020 / TAC-036: the reaction trigger is "an opposing soldier moves into or through the cone", but destruction "can trigger reactions on newly opened sightlines" without movement. Does a non-moving action (firing, opening a sightline) trigger reactions? Also: can a reactor attempt more than once against the same mover in one move?
11. TAC-022: distance, stance, sprint, noise and wound modifiers have no values; does Nerve or Recon (noise) feed in?
12. **Resolved (design eb072a2):** Take cover moves to the nearest covered tile within 1 tile, else the reactor crouches; a Fire reaction is a single snap shot, or a shot action in the current mode without the penalty on overwatch (TAC-075) (part). Still open: the snap-shot penalty value and ties between equally near cover tiles. TAC-023: Take cover — which tile when several qualify, and is it limited to one tile? Does the Fire reaction use a specific fire mode (single shot?) and the snap-shot penalty value?
13. **Resolved (design 8972470):** setting a reaction is free and can be changed any number of times in the activation. TAC-021: the cost of setting a reaction is not stated (tactical-actions: Open).
14. TAC-044: the shooter-spread function (Marksmanship, Perception at range, stance, aim time, wounds) and how terms combine (additive in MoA?) are open; "hip shot" is mentioned for lasers but never defined as a fire option.
15. TAC-045: the relation between cone width and the normal distribution's σ ("where nearly all shots land") needs a number.
16. TAC-046: exact preview sample count ("a few hundred") and whether the preview must match the result exactly or only statistically.
17. TAC-050: "condition percentage" for armour is assumed to be durability ÷ max durability; durability loss per hit and whether penetrating hits also wear armour are not set. Do arms/legs ever get armour ("usually none")?
18. TAC-051: is blunt damage also subject to the 10% damage floor and does it cause bleeding/pain?
19. **Resolved (design eb072a2):** a limb at 0 HP is disabled (arms: cone and scatter ×2; legs: base tile cost ×2); the surgical kit brings it back to 1 HP. TAC-059 / TAC-067: arm or leg at 0 HP has "no negative effects for now", yet the surgical kit exists to bring them back to 1 HP. Does a limb at 0 HP keep its wound effects, or is there a missing 0-HP effect?
20. **Resolved (design eb072a2):** damage that hits a disabled limb is split equally over all zones still above 0 HP, head and thorax included (part). Still open: question 45. TAC-059: damage overflow from a 0-HP limb is discarded in the spec; does it transfer to the thorax?
21. **Resolved (design 8972470):** the item list now says the dressing is light and quick and the medkit also stops heavy bleeding in any zone; dressing and medkit cover every zone, the tourniquet arms and legs only; there is no "only fix". TAC-061 / TAC-067: item list says hemostatic dressing is the "only fix for thorax and head bleeding in the field", but the medkit stops heavy bleeding (zone unrestricted) and bandage/IFAK stop light bleeding in any zone. Clarify which zones each item covers.
22. TAC-060 / TAC-061 / TAC-062: bleeding chances per hit/zone, the damage threshold for "hard hits" and "heavy hits", fall damage and Endurance bleed resistance are all unquantified.
23. TAC-063 / TAC-026: pain causes (which damage amount), AP and spread magnitude, and whether painkillers stack, are open.
24. TAC-065: order of operations — is the "never below 1" minimum applied before the self-treatment and backpack surcharges (spec) or after?
25. **Resolved (design eb072a2):** the IFAK's 15 HP is the base per use before the Medical multiplier, so a skilled medic heals more; the multiplier applies to every HP-restoring item (medkit HP per use is still not stated). TAC-066: is the IFAK's 15-HP cap applied before or after the Medical multiplier, and does the multiplier apply to the medkit too?
26. **Resolved (design 8972470):** AP penalty −5 over carry capacity, −10 over 125% of it (draft) (part). Still open: carry capacity formula, Strength's reduction, heavy assault armour penalties. TAC-027: carry capacity formula (DAT/MGT) and the AP penalty are open; heavy assault armour's "large stamina and AP penalties" has no rule.
27. **Resolved (design 8972470):** draft values for terrain, diagonal, crouch, prone, sprint, stance, turn, vault and climb; turning along a path while moving is free. Remaining gap: question 32. TAC-029..TAC-034, TAC-017: terrain, diagonal, crouch, prone, sprint, stance, turn, vault and climb costs are all open; is a facing change implied by a move step free?
28. **Resolved (design 8972470):** draft fire AP per weapon type with burst/auto/ergonomics modifiers, aim steps, reload by feed type, swap and throw costs (part). Still open: the Strength → throw distance formula. TAC-039..TAC-043: fire-mode AP costs, aim steps, reload, swap and throw costs and the Strength→throw distance formula are open.
29. TAC-047: recoil-control formula and tracer's reduction value are open.
30. **Resolved (design eb072a2):** a soldier already on an exit tile may also leave at the start of its activation without moving (TAC-038); the morale flee rule is optional, later build (TAC-077) (part). Still open: whether leaving requires the whole squad. **Resolved (design 8972470):** leaving the map is free once the soldier ends the move on an exit tile with its condition met (AP part). Still open: whole squad, morale fleeing. TAC-038: AP cost of leaving the map; does leaving require the whole squad, and how does the Management morale rule (below 20 an activated soldier may flee toward the nearest exit) hook into activation? Ownership of that rule is outside this file's sources.
31. TAC-044: weapon Condition raises jam chance and spread (weapon profile) — no jam rule or magnitudes are given for the tactical layer.
32. **Resolved (design eb072a2):** upright → prone goes through crouched: 2 + 2 = 4 AP; no Agility term (Tactical actions is the single cost source). TAC-033: the cost of upright → prone is not stated (only upright ↔ crouched, crouched → prone, prone → crouched, prone → upright). Is it a direct transition or crouched-then-prone (2 + 2)? design.md also names Agility for stance changes; tactical-actions gives no Agility term.
33. **Resolved (design eb072a2):** Tactical actions is the single source for every cost and its modifiers; the GDD's extra attribute terms are removed. TAC-040 / TAC-041 / TAC-042: design.md says Marksmanship and weapon ergonomics lower reload and aim costs and Agility speeds up swaps; its attribute table adds Agility (minor) to reload and Marksmanship and ergonomics to swaps. tactical-actions has no ergonomics term for aiming, no Agility term for reload and no Marksmanship/ergonomics term for swaps. Spec follows tactical-actions; confirm.
34. **Resolved (design eb072a2):** no handedness — the worse arm counts; arms add no AP to aim, reload or throw (they widen cone and scatter); pain adds +1 AP per aim step; each aim step multiplies spread by 0.85 (3 steps ≈ −39%). TAC-040 / TAC-043: "aiming arm" and "throwing arm" are undefined (handedness?). Do a wounded aiming arm and pain stack (+2 per step), or is it +1 if either applies? Does the 15% spread reduction per aim step add up (3 steps = −45%) or multiply (×0.85³)?
35. **Resolved (design eb072a2):** arm wounds no longer change reload cost; a tube reload can be partial (any number of shells) and its modifiers apply once per reload; the item list now gives a feed type per weapon (DAT-011). TAC-041: "wounded arm" — either arm or a specific one? For tube-fed weapons (2 AP per shell), do the Marksmanship, ergonomics, backpack and wound terms apply per shell or once per reload; can a reload be partial? The item list gives no feed type per weapon (box magazine vs belt for LMGs; stripper clip, bolt-action or box magazine for bolt rifles), so `feedType` must be assigned in content.
36. **Resolved (design eb072a2):** a burst or auto mode with fewer rounds loaded fires what is left at the full AP cost (part). Still open: the override semantics, burst modes other than 3, and the type list. TAC-039: does a per-weapon `fireApCost` override replace only the weapon-type default (spec: yes; burst/auto and ergonomics modifiers still apply) or the final cost? Are burst modes other than 3 rounds allowed? What happens when a burst or auto mode is fired with fewer rounds loaded than it fires? The type list names only bolt-action sniper rifles.
37. **Resolved (design eb072a2):** the weapon-over-6-kg swap surcharge is removed. TAC-042: "weapon over 6 kg" — the weapon being readied, the one put away, or either; base or effective weight (with mods)?
38. **Resolved (design eb072a2):** a leg fracture multiplies the base tile cost on its own, whatever the leg's HP, and stacks with a disabled leg (×3) (part). Still open: whether a fractured leg above 50% HP lowers max stamina (spec: no). TAC-029 / TAC-062 / TAC-009: "a leg fracture then multiplies the whole tile cost by 1.5" — does the multiplier apply only to a leg that is also wounded (below 50%), or to any fractured leg (spec)? Does a fractured limb above 50% HP count as wounded for max stamina?
39. **Resolved (design eb072a2):** one order for every cost: multipliers on the base cost first, then additive surcharges, then round down, never below 1 AP (the spec's old additive-first order is replaced). TAC-024: the design states multiplier-after-additives only for the leg fracture ("whole tile cost"); the spec applies it to every action (e.g. reload arm fracture ×1.5 after the backpack +4). Confirm.
40. **Resolved (design eb072a2):** 3 AP once per side; the contents then stay visible to the whole side. TAC-070: is the 3 AP open/search cost paid once per container or body per battle, or per soldier or visit? Are its contents then shown to the whole side?
41. **Resolved (design eb072a2):** lift only from an adjacent tile; wounded or dead squadmates, enemies and a restrained VIP can be moved; the body and its gear count toward encumbrance (carrying fails over carry capacity, dragging always works); no dragging prone (part). Still open: whether a carrier may vault. TAC-074: the spec requires the carrier to be adjacent (not stated). Can dead squadmates, enemies or a restrained VIP be carried or dragged? Does the carried soldier's weight count toward the carrier's encumbrance? Can a carrier vault, and can a soldier drag while prone?
42. **Resolved (design eb072a2):** yes — a soldier already on an exit tile may leave at the start of its activation without moving. TAC-038: "end the move on an exit tile" — may a soldier who starts an activation on an exit tile leave without moving?
43. TAC-001: once a neutral unit turns hostile, does it start to activate (and in whose slot), or does it keep only reacting? How are its reactions chosen without an activation (a fixed rule, or a tactical-ai call mid-move), what triggers them (a shot nearby, an enemy entering its cone), do they cost stamina, and what is "flee" (move away, leave the map)?
44. TAC-009 / TAC-029: does a disabled leg (0 HP) still lower max stamina by 1 like a wounded leg? Spec: yes (0 HP is below 50%).
45. TAC-059: is the excess of the hit that brings a limb to 0 HP also redistributed, or only later hits on the disabled limb (spec)? Are the shares rounded down (spec), and does helmet or body armour apply to a redistributed share (spec: no, armour is checked once at the hit zone)?
46. TAC-023: Take cover — does an already prone reactor stay prone (spec), and can the move into cover trigger reactions from others?
47. TAC-075: does overwatch end early (when the soldier is suppressed, changes the reaction setting, or has too few rounds for the mode)? Spec: it lasts until the next activation regardless.
48. TAC-076: is a VIP "captured" when restrained (spec) or only once carried off the map? What is the tactical condition for "cargo saved" (cargo carried off the map, or the convoy's vehicles leaving)?
49. TAC-043 / TAC-079: base landing scatter of a throw, which body zones a blast hits, and what counts as "solid cover" against a blast (full cover only, or half cover too)?
50. TAC-013: the stall rule's "a soldier acts" — spec reads it as a side's controller activating a soldier during the automatic advance (so the player can interrupt it). Confirm.
51. TAC-080: the tactical map generation stages (terrain layout, roads, prefab placement, cover scatter, spawns and objective placement, playability checks) and their rules are not in the design; `data/mapgen/tactical.json` has slots for them but no TAC rule to check them against. Needs a design passage on tactical map generation.
52. TAC-080 / TAC-038: the tactical map request may list `exits[]` (with conditions the strategic layer knows of, e.g. a boat or a paid crossing) and the generator places 2–4 exits from `data/mapgen/tactical.json`. Which wins: are the request's exits all the map's exits, does the generator add exits up to the count, or does it ignore them?

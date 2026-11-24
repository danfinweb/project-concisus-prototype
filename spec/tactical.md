# Tactical Layer — spec [TAC]

Precise rules derived from `design/`. Each section: `### [TAC-NNN] Title`, then the rule
(inputs, outputs, formula, ranges), its design source, and `→ data/<table>.json` where a concrete value
lives in data. Edited only through `/update-spec`.

Conventions for this file: "turn" = one player activation followed by one opponent activation
(and, once a neutral faction has turned hostile, one activation of that third side; TAC-005). "Activation" = one soldier spending its AP. All AP costs are whole integers; every
fractional intermediate is rounded down unless a rule says otherwise. Item, weapon, calibre and ammo
values are read from `data/items.json` (specced under DAT/ITM); global tactical constants live in the
proposed table `data/tactical-rules.json`. All randomness uses `shared/rng.js` with the battle seed.

## Battle frame

### [TAC-001] Sides on a map
**Rule.** A tactical map holds the player side, one opponent side and, when such units are present, a third **neutral side**. The player side may include allied units controlled by AI (defenders, convoy, escorted VIP); they belong to the player side for turn order, but their activations are commanded by the AI controller (TAC-005, TAI-018). Units hostile to neither side (a non-involved faction, civilians) form the neutral side, controlled by the tactical AI (TAI-017). The tactical map request marks them: every `sides[]` entry with `role: "neutral"` belongs to the neutral side; who is hostile to whom among the factions present comes from the request's `hostility` map (faction → faction → boolean). There is no per-unit hostile flag. Until attacked, neutral units never activate: they only react, by a fixed rule — when a neutral unit is shot at, or an enemy shot lands within `neutralReactRadiusTiles` of it, a civilian flees (it moves away from the shooter to the nearest exit and leaves the map there, TAC-038) and an armed neutral takes cover (as the Take cover reaction, TAC-023). These reactions cost no stamina and need no AI call. A neutral unit that is attacked turns hostile toward the attacking side (the side whose unit attacked it); from then on its faction's units on the map form a **third side in the turn order**, with their own activation after the opponent's in every turn (TAC-005), commanded by the tactical AI.
**Values.** `neutralReactRadiusTiles` — 3 (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure; design/design.md › Tactical Layer (Enemy AI)

### [TAC-002] Turn-based from the start
**Rule.** The battle is turn-based from the first moment on the map, including stealth. There is no real-time exploration phase; the first turn starts when the map is entered.
**Source.** design/design.md › Tactical Layer (Turn structure bullet)

### [TAC-003] Battle duration and day/night
**Rule.** Every battle consumes exactly 1 hour of strategic game time regardless of turns played; the battle result reports it as `battle_result.gameTimeHours`. TAC-003 owns the battle duration; STR-023 only points here. The battle uses the strategic clock time at its start: a start from 06:00 up to (not including) 21:00 → day battle; from 21:00 up to (not including) 06:00 → night battle (21:00 itself is night, 06:00 is day). The day/night flag is fixed for the whole battle.
**Values.** `battleDurationHours` — 1 → data/tactical-rules.json (single owner; strategic-rules has no battle duration); `dayStartHour` — 6, `nightStartHour` — 21 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Time of day

### [TAC-004] Night sight reduction
**Rule.** In a night battle, each soldier's sight range (TAC-081) = day value × `nightSightFactor`, unless the soldier carries an active flashlight (weapon tactical module, DAT-017), which restores the full day range. A lit flashlight reveals its carrier to enemies and blinds enemies inside its cone within `blindRangeTiles`: a blinded soldier has shooter spread + `blindSpread` (TAC-044) until the end of their next activation. The night sight rule is owned by TAC; MGT-030 only points here.
**Values.** `nightSightFactor` — 1/3, `blindRangeTiles` — 10 (draft), `blindSpread` — 4 MoA (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Time of day; › Turn structure › Sight and spotting (draft); design/design.md › Data definitions › Weapon profile (tactical modules)

### [TAC-076] Objective met in battle
**Rule.** The tactical map request (`objectives[]`) lists only the battle's mission objectives that can be met on the tactical map; its objective `type` is one of `killVip` (a VIP killed, with the proof its mission asks for, MGT-044), `captureVip` (captured: the VIP, restrained (TAC-073), is carried off the map by the player's side through an exit, TAC-038/TAC-074), `destroyTarget` (a target destroyed), `saveCargo` (cargo saved: the cargo leaves the map through an exit, carried by the player's side or in a convoy vehicle). TAC checks them after every resolved action and reaction; the moment an objective's goal is met it is marked met, and the player is shown an "Objective met" notification at once. A met objective stays met whatever happens afterwards in the battle, including the loss of the whole squad. The battle result lists every objective met with the turn it was met; the strategic layer confirms the mission (STR) and passes it to Management. Objectives met on the strategic map (delivery, hand-over, holding a place, deadline) are not TAC's and are never put in the request; an AI side's own aim in the battle (attack, defend, hold, escort) is its `battleGoal` (TAI-009), not an objective.
**Source.** design/design.md › Overview › Core loop; design/design.md › Management › Contracts and missions › Mission types

### [TAC-078] Contamination and mines on the tactical map (optional)
**Rule.** OPTIONAL — left out of the first build iterations. A battle in a contaminated region (`contaminated` region flag in the tactical map request, STR-080) makes soldiers lose HP every turn they spend there; a `mined` region places mines on roads and approaches of the tactical map, cleared by Technical soldiers. Until this is built, TAC ignores both flags.
**Values.** contamination HP loss per turn — not set (design: Open) → data/events.json (STR-080); mine placement, mine damage and clearing rule — not set (design: Open) → data/tactical-rules.json `mines` (object)
**Status.** optional
**Source.** design/world-events.md › Desperate measures (Mining the roads); › Nuclear strike (rare) (Effect)

### [TAC-080] Tactical map from the encounter tile
**Rule.** The tactical layer generates the battle map from the tactical map request alone (`seed`, `rulesVersion`, `region`, `exits`); the same request and rules version always give the same map. The encounter tile's strategic terrain sets the map: the request carries `region.terrain` and `region.biome`, the biome of that terrain in the strategic terrain table (STR-095). The biome selects the tactical terrain table and the prefab table that STR-095 names for it (`tacticalTerrainTable`, `prefabTable` in data/strategic-terrain.json); the generator draws tactical terrain only from data/terrain.json records listed in that terrain table and prefabs only from data/prefabs.json records listed in that prefab table (record field `tables`). The map type, size and stages are TAC-086..TAC-089. Tactical maps have no rivers; sea and lake shores stay. The map has 2–4 exits; each exit has an `id`, unique on the map, and a condition (`none`, `fuel`, `boatAtTurn`, `paidCrossing`; TAC-038): every exit in the request's `exits[]` is placed, and the generator adds plain exits up to the count (TAC-087). The battle result reports the exit a soldier used as `soldiers[].exitId`.
**Values.** `exitCount` — min 2, max 4 → data/mapgen/tactical.json; exit conditions and their parameters → data/mapgen/tactical.json `exits[]`; stage rules → TAC-087, data/mapgen/tactical.json
**Source.** design/design.md › Strategic Layer › Map (draft) (biome per strategic terrain type); › Strategic Layer › Squads and simulation (draft) (Encounters: the tile's terrain sets the tactical map); › Management › Gear, loot & return (2–4 exits with conditions); › Tactical Layer › Tactical map generation (draft)

## Turn and activation

### [TAC-005] Turn order and activation choice
**Rule.** Combat alternates single-soldier activations: player side, then opponent side; the pair is one turn. When a neutral faction has turned hostile (TAC-001), its side activates third in every turn, after the opponent. There are no rounds. On its activation a side picks any one of its soldiers that may be activated (stamina ≥ `activationCost`, TAC-008), including the soldier it activated last turn, or passes (TAC-010). At the start of an activation the soldier's AP pool is set to its full AP (TAC-006); unspent AP from earlier activations are lost. Neutral units that have not turned hostile are never given an activation. An escorted VIP under player control (`vipControl: player`, TAI-018) is activated by the player as part of the player side's activations, like a squad soldier (stamina and AP as TAC-006..TAC-012). An AI-controlled side answers each activation with commands (TAI-005); a rejected command goes back to the controller with its reason, up to `commandRetries` times per activation, after which the activation ends as by `endActivation` (unspent AP lost, stamina already spent stays spent, the surcharge only if the soldier sprinted or is over capacity, TAC-008).
**Values.** `commandRetries` — 3 (draft, TAI-005) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation; design/tactical-actions.md › Turn and activation

### [TAC-006] Action points per activation
**Rule.** Full AP = 25 + floor(Agility ÷ 10) (range 25–35 for Agility 1–100). AP for this activation = full AP − sum of active AP modifiers (suppression TAC-015, stun TAC-025, pain TAC-026, over-encumbrance and armour AP penalty TAC-027), never below 0. These are the only AP modifiers: wounds do not reduce the AP pool. Wounded or disabled legs raise movement cost (TAC-029); wounded or disabled arms widen the shooting cone and the grenade scatter instead of costing AP (TAC-058). AP is spent on movement, stance, turning, aiming, firing, reloading, medical and gear actions. This formula is owned by TAC; the Management attribute table (MGT-026) only names the attribute and points here, and the values live only in `data/tactical-rules.json`.
**Values.** `apBase` — 25, `apAgilityDivisor` — 10 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Action points); design/design.md › Management › Soldier attributes › Derived values; design/tactical-actions.md › Turn and activation, AP modifiers on an activation

### [TAC-007] Set facing at end of activation
**Rule.** When an activation ends, the soldier's final facing (one of 8 directions) is set at no AP cost.
**Source.** design/design.md › Tactical Layer › Turn structure › Vision and facing; design/tactical-actions.md › Turn and activation

### [TAC-008] Activation stamina cost
**Rule.** Activating a soldier requires stamina ≥ `activationCost` and spends `activationCost` stamina points. +`activationSurcharge` if the soldier sprinted during this activation or is over carry capacity; the surcharge is charged when the activation ends, and stamina never goes below 0, so a soldier with exactly `activationCost` stamina may still sprint (ending at 0).
**Values.** `activationCost` — 2, `activationSurcharge` — 1 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Stamina; design/tactical-actions.md › Turn and activation, Movement (Sprint)

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
**Rule.** If for `stallTurns` consecutive turns both sides pass and no soldier sees or hears an enemy, turns advance automatically: each automatic turn is a turn in which both sides pass (stamina recovers, TAC-011; durations count down, TAC-014). Automatic advance stops as soon as a soldier sees or hears an enemy, or a side's controller activates a soldier instead of passing. The player can stop it at any time by activating a soldier.
**Values.** `stallTurns` — 2 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation

### [TAC-014] Durations in turns
**Rule.** Every effect with a duration (bleeding ticks, smoke, painkillers, suppression) is counted in turns. Per-turn effects (e.g. bleeding HP loss) are applied once at the end of each turn.
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation

### [TAC-015] Suppression
**Rule.** A soldier becomes suppressed when hit, when an enemy shot hits their cover, or when an enemy shot lands within `suppressionRadiusTiles` of them (impact point on the soldier's tile or a tile at most that many steps away, 8-neighbourhood). "Their cover is hit" = any enemy round stopped by a cover edge of the soldier's tile on the side facing the shooter, whoever the round was aimed at. While suppressed: −`suppressionAp` AP on each activation, shooter spread + `suppressionSpread` (TAC-044), no reaction attempts; a soldier on overwatch loses it (TAC-075). Suppression ends after one full turn passes with no qualifying event; any new qualifying event restarts the count. Nerve's reduction of suppression is deferred (TAC-077, optional) and not applied in the first build iterations.
**Values.** `suppressionAp` — 5, `suppressionRadiusTiles` — 1, `suppressionSpread` — 3 MoA (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Turns and activation; › Hit model › Shooter spread and recoil (draft); design/tactical-actions.md › AP modifiers on an activation; design/design.md › Management › Soldier attributes (Nerve)

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

### [TAC-081] Sight range and spotting
**Rule.** Day sight range (tiles) = `sightBase` + `sightPerPerception` × Perception + `sightPerRecon` × Recon (25–60 tiles; an average soldier about 42). At night it is × `nightSightFactor` without a flashlight (TAC-004). An enemy in line of sight (TAC-016) is spotted when its distance ≤ the spotter's sight range × the target's concealment. Concealment = (1 − (`concealment.recon` × Recon + `concealment.agility` × Agility) ÷ 100) × stance factor `concealment.stance` (upright 1.0, crouched 0.8, prone 0.6), × `foliageConcealmentFactor` if the target stands on an obscuring tile (TAC-082). There is no roll: who sees whom follows from these values and is readable by the player. Example (design): an average enemy crouching (0.75 × 0.8 = 0.6) is seen within about 25 tiles; in brush (× 0.7 = 0.42) within about 18.
**Values.** `sightBase` — 25, `sightPerPerception` — 0.25, `sightPerRecon` — 0.1, `concealment` — `recon` 0.4, `agility` 0.1, `stance` {upright 1.0, crouched 0.8, prone 0.6} (all draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Sight and spotting (draft); › Tactical map generation (draft) › Concealment (Spotting); design/design.md › Management › Soldier attributes › Derived values

## Reactions

### [TAC-020] Reaction trigger
**Rule.** A reaction check is made for each potential reactor (line of sight, target inside its vision cone) when an opposing soldier: moves into or through the reactor's vision cone, checked per tile step of the mover; takes any visible action inside the cone (fires, reloads, uses an item, or any other action); or is newly exposed inside the cone when destruction (TAC-036) or an opened door (TAC-084) opens a sightline. A reactor makes at most one attempt per mover per entry into its cone, and at most one per visible action. Reactors that are suppressed, have stamina 0 or have reaction setting Hold make no attempt; a player-controlled VIP (`vipControl: player`, TAI-018) never reacts.
**Source.** design/design.md › Tactical Layer › Turn structure › Reactions; design/tactical-actions.md › Turn and activation

### [TAC-021] Reaction setting
**Rule.** Each soldier has a reaction setting: Fire, Take cover or Hold (stay hidden, no reaction). It is chosen during the soldier's activation and persists until changed; it is applied automatically, with no prompts during the opponent's move. Setting it is free and it can be changed any number of times within the activation.
**Values.** `setReactionCost` — 0 (draft: free) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Reactions; design/tactical-actions.md › Turn and activation

### [TAC-022] Reaction attempt cost and chance
**Rule.** Each attempt costs `reactionCost` stamina point, success or not. Chance = clamp(50 + (reactor Perception − mover Agility) / 2 + modifiers, 10, 90) %. Modifiers (added before the clamp): distance − `reactionModifiers.distancePerStep` per `reactionModifiers.distanceStepTiles` tiles beyond `reactionModifiers.distanceFreeTiles`, at most − `reactionModifiers.distanceMax`; mover crouched + `reactionModifiers.crouched`, prone + `reactionModifiers.prone`, sprinting + `reactionModifiers.sprint`; the mover's noise − mover Recon × `reactionModifiers.noisePerRecon`; reactor in pain + `reactionModifiers.reactorPain`; + `reactionModifiers.perWoundedLimb` per wounded or disabled limb of the reactor. One seeded roll decides. This formula is owned by TAC; MGT-030 only points here.
**Values.** `reactionCost` — 1, `reactionBase` — 50, `reactionMin` — 10, `reactionMax` — 90 → data/tactical-rules.json; `reactionModifiers` (draft): `distanceFreeTiles` 10, `distanceStepTiles` 2, `distancePerStep` 1, `distanceMax` 20, `crouched` −10, `prone` −20, `sprint` +15, `noisePerRecon` 0.1, `reactorPain` −10, `perWoundedLimb` −5 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Reactions; design/tactical-actions.md › Turn and activation

### [TAC-023] Reaction resolution
**Rule.** On success, the reaction resolves immediately, before the mover continues. Fire: a single shot (one round, whatever the selected fire mode) at the mover with the normal hit model (TAC-044..) plus the snap-shot spread penalty `snapShotSpread`. A reactor on overwatch (TAC-075) instead fires one shot action in the weapon's current fire mode (TAC-039), without the snap-shot penalty. Take cover: the reactor moves to the nearest tile within `takeCoverRangeTiles` that has cover against the mover; among equally near tiles, full cover before half, then the tile farther from the mover, then a seeded pick. If there is none, the reactor crouches (an already crouched reactor stays crouched; a prone reactor stays prone). A reaction move never triggers reaction checks from other soldiers. Reactions spend no AP. Afterwards the mover continues and may spend its remaining AP. On failure, the mover is not noticed by that reactor; the stamina point is still spent.
**Values.** `takeCoverRangeTiles` — 1, `snapShotSpread` — 3 MoA (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Turn structure › Reactions; › Hit model › Shooter spread and recoil (draft); design/tactical-actions.md › Turn and activation (Hold overwatch)

### [TAC-075] Hold overwatch
**Rule.** During an activation a soldier may go on overwatch for `overwatchCost` AP. Overwatch lasts until the start of the soldier's next activation, but ends early as soon as the soldier is suppressed (TAC-015) or has fewer rounds loaded than the selected fire mode fires (TAC-039). While on overwatch, the soldier's Fire reactions (TAC-023) fire one shot action in the weapon's current fire mode (TAC-039; rounds and recoil as for that mode, no AP spent) with no snap-shot penalty. Overwatch changes nothing else: the reaction trigger, the stamina cost and chance (TAC-020, TAC-022) and the reaction setting (TAC-021) are unchanged, so overwatch only matters with reaction setting Fire.
**Values.** `overwatchCost` — 4 (draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Turn and activation (Hold overwatch); design/design.md › Tactical Layer › Turn structure › Reactions

## Action costs and AP modifiers

### [TAC-024] Action cost composition
**Rule.** `design/tactical-actions.md` is the single source for every action cost and its modifiers; no other attribute or gear term applies. Every cost is computed in this order: (1) base cost = the action's listed cost (for movement: the walk or diagonal cost plus the destination's terrain cost, TAC-029); (2) all multipliers applied to the base cost (e.g. fracture ×1.5, disabled leg ×2; several multipliers multiply together); (3) all additive terms added (attribute and ergonomics thresholds, surcharges such as stance, sprint, carry/drag, wounded leg, backpack); (4) rounded down to a whole number; (5) never below 1 AP. Actions defined as free (cost 0: pass, final facing, set reaction, leave the map) are exempt from the minimum. An action that costs more AP than the soldier has left cannot be started. Attribute thresholds ("Agility 70+") mean attribute ≥ threshold; "ergonomics 30 or below" means ≤ 30.
**Source.** design/design.md › Tactical Layer (Action points), › Actions and costs; design/tactical-actions.md (intro: order of cost calculation)

### [TAC-025] Stun (head hit)
**Rule.** A hit to the head zone that does not kill, blunt hits included (TAC-051), stuns with chance `stunChance`; a stunned soldier loses `stunApLoss` AP on their next activation, then the stun clears.
**Values.** `stunChance` — 0.35 (draft), `stunApLoss` — 10 (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/tactical-actions.md › AP modifiers on an activation

### [TAC-026] Pain AP loss
**Rule.** A soldier in pain (TAC-063) loses `painApLoss` AP on each activation and has shooter spread + `painSpread` (TAC-044) until the pain is masked (painkillers) or ends. Pain also raises the aim-step cost (TAC-040).
**Values.** `painApLoss` — 4 (draft), `painSpread` — 1.5 MoA (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Medical system › Conditions; › Hit model › Shooter spread and recoil (draft); design/tactical-actions.md › AP modifiers on an activation

### [TAC-027] Over-encumbrance
**Rule.** Carry capacity (kg) = `carryCapacity.base` + `carryCapacity.strength` × Strength + `carryCapacity.endurance` × Endurance (15–55 kg; formula owned by MGT-029, read here). If total carried weight (all seven equipment slots and contents) exceeds carry capacity, the soldier is over-encumbered: −`encumbranceApPenalty` AP on each activation, or −`heavyEncumbranceApPenalty` AP instead if carried weight exceeds `heavyEncumbranceThreshold` × carry capacity (the two do not stack), plus the activation stamina surcharge (TAC-008). Strength lowers the penalty: penalty × (1 − Strength ÷ `encumbranceStrengthDivisor`), rounded down. Armour with an `apPenalty` (heavy assault armour, ITM-011) costs that many AP on every activation, encumbered or not; it is an over-encumbrance-class AP modifier for TAC-006. TAC-027 owns the weight → AP and stamina penalty and its values; MGT-033 only points here.
**Values.** `carryCapacity` → data/management-rules.json (MGT-029); `encumbranceApPenalty` — 5 (draft), `heavyEncumbranceApPenalty` — 10 (draft), `heavyEncumbranceThreshold` — 1.25 (draft), `encumbranceStrengthDivisor` — 200 (draft) → data/tactical-rules.json; heavy assault armour `apPenalty` 5, `staminaPenalty` 0 (draft) → data/items.json
**Source.** design/design.md › Tactical Layer (Action points); › Management › Soldier attributes › Derived values (Carry capacity); design/tactical-actions.md › AP modifiers on an activation; design/item-list.md › Body armour; design/design.md › Data definitions › Soldier equipment slots

## Movement

### [TAC-028] Tactical grid and levels
**Rule.** The map is a grid of square tiles (about 1.5 m); movement is tile to tile in 8 directions. The terrain is flat. Playable levels: every building's ground floor and, for large buildings (TAC-088), a flat roof reached by an inside stairwell; stairs cost the stairs terrain cost per tile (TAC-029). Levels connect by stairs and ladders; windows and low walls are crossed by vaulting (TAC-034). A playable second floor for large buildings is OPTIONAL (TAC-088).
**Values.** `tileSizeM` — 1.5 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Movement); › Tactical map generation (draft) › Stages (Structures, Levels)

### [TAC-029] Walk one tile
**Rule.** Base tile cost = `walkCost` (orthogonal step) or `diagonalWalkCost` (diagonal step, instead of `walkCost`) + terrain cost of the destination tile. Multipliers on the base tile cost (TAC-024): × `disabledLegMoveFactor` if at least one leg is disabled (0 HP, TAC-059; applied once, however many legs are disabled); × `fractureMoveFactor` if at least one leg is fractured (TAC-062), also on top of a disabled leg (×2 × 1.5 = ×3). Then the additive terms: + `legWoundMoveSurcharge` per wounded leg that is not disabled (below `woundedThreshold` of its max HP but above 0 HP; a disabled leg takes the ×2 instead of the +1), plus the stance (TAC-030/031), sprint (TAC-032), carry/drag (TAC-074) and door (TAC-084) terms; then rounded down, never below 1 AP. Impassable tiles (terrain flagged `impassable`: rock, tree trunks, deep water; blocking props) cannot be entered.
**Values.** `walkCost` — 2, `diagonalWalkCost` — 3 (draft), `legWoundMoveSurcharge` — 1 (draft), `disabledLegMoveFactor` — 2 (draft), `fractureMoveFactor` — 1.5 → data/tactical-rules.json; per-terrain `moveCost` (draft): road, floor, grass, field 0; mud, shallow water, rubble, dense brush 1; stairs 1; per-terrain `impassable` → data/terrain.json
**Source.** design/design.md › Tactical Layer (Movement); › Tactical map generation (draft) › Tiles, cover and doors; design/tactical-actions.md › Movement (Walk one tile, Leg wounds) and intro; design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; › Medical system › Conditions

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
**Rule.** Every half-cover edge (windows, fences, sandbags, low walls; TAC-035) can be crossed only by vaulting: `vaultCost` AP, or `vaultCostAgile` if Agility ≥ `agileThreshold`. Climbing a ladder costs `climbCost` AP per level, or `climbCostAgile` per level if Agility ≥ `agileThreshold`. Neither is possible while prone (the soldier must change stance first); climbing is not possible while carrying a squadmate (TAC-074). Full-cover edges cannot be crossed except through an open door (TAC-084).
**Values.** `vaultCost` — 4 (draft), `vaultCostAgile` — 3 (draft), `climbCost` — 4 per level (draft), `climbCostAgile` — 3 per level (draft), `agileThreshold` — 70 (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer (Movement), Body zones and hitboxes › Stance; › Tactical map generation (draft) › Tiles, cover and doors; design/tactical-actions.md › Movement (Vault a window or low wall, Climb a ladder)

### [TAC-035] Cover per tile edge
**Rule.** Cover is stored per tile edge with value none, half or full. Half cover (windows, fences, sandbags, low walls) is a ~1.0 m high edge; full cover (walls, closed doors) blocks the whole silhouette. Every cover edge has a material with HP (TAC-085). The preview shows per edge where a soldier is protected.
**Values.** `halfCoverHeightM` — 1.0 → data/tactical-rules.json; edge materials → data/prefabs.json / data/terrain.json; material HP → TAC-085
**Source.** design/design.md › Tactical Layer (Movement, Cover & visibility), Body zones and hitboxes › Stance; › Tactical map generation (draft) › Tiles, cover and doors

### [TAC-036] Destruction recalculation
**Rule.** After every explosion or breach (an edge destroyed, TAC-085), immediately (mid-turn) recalculate cover edges, walkability, path AP costs and line of sight. Newly opened sightlines can trigger reaction checks (TAC-020) for movers currently in view.
**Source.** design/design.md › Tactical Layer (Movement); › Tactical map generation (draft) › Tiles, cover and doors (Destruction)

### [TAC-037] Path preview
**Rule.** For a hovered/tapped destination the layer returns the path, its total AP cost and the tile where the activation's AP run out. Confirming (second tap on mobile) commits the move. The path cost uses the same rules as execution.
**Source.** design/design.md › Tactical Layer (Movement)

### [TAC-038] Leave the map at an exit
**Rule.** Each map has 2–4 exits (TAC-080); each exit has an `id` and carries its own condition (vehicle fuel, a boat at a set turn, a paid crossing, or none). A soldier on an exit tile whose condition is met may leave the map — either by ending a move there, or, already standing there, at the start of its activation without moving; leaving is free. Soldiers leave one by one; the squad does not have to leave together. Soldiers who left are out of the battle and count as survivors in the battle result, with `status: leftMap` and the `exitId` of the exit they used. The battle ends for the player side when none of its soldiers is left on the map.
**Values.** `exitCost` — 0 (draft: free) → data/tactical-rules.json; exit count, placement and conditions → TAC-080, TAC-087, data/mapgen/tactical.json
**Source.** design/tactical-actions.md › Turn and activation (Leave the map at an exit); design/design.md › Management › Gear, loot & return; › Tactical Layer › Tactical map generation (draft) › Stages (Exits and deployment)

## Weapons

### [TAC-039] Fire
**Rule.** A shot action uses one fire mode of the equipped weapon (weapon field `fireModes`, e.g. [1, 3], [1, 2] or [1, auto]); the mode sets rounds fired and AP cost. An integer mode n fires n rounds (1 = single shot; n > 1 = a burst whose length is the weapon's own); `"auto"` fires `autoRounds` rounds. AP cost = fire AP of the weapon (its `fireApCost` if set, which replaces only the weapon-type default, else `fireApByWeaponType` for its `weaponType`) + `burstApSurcharge` (any burst mode) or `autoApSurcharge` (auto) − `ergoApDelta` if ergonomics ≥ `ergoHighThreshold` + `ergoApDelta` if ergonomics ≤ `ergoLowThreshold`, then TAC-024. Each round consumes one cartridge from the loaded magazine; firing with an empty magazine is not allowed. A burst or auto mode with fewer rounds loaded than it fires fires the rounds that are left, at the full AP cost of that mode. Rounds in a burst are resolved in order with growing recoil spread (TAC-047). A jammed weapon cannot fire (TAC-083).
**Values.** `fireApByWeaponType` (draft): `pistol` 4, `smg` 5, `assaultRifle` 6, `shotgun` 6, `battleRifle` 7, `dmr` 7, `lmg` 8, `sniperRifle` (bolt-action) 9; `burstApSurcharge` — 2, `autoRounds` — 5, `autoApSurcharge` — 4, `ergoHighThreshold` — 70, `ergoLowThreshold` — 30, `ergoApDelta` — 1 (all draft) → data/tactical-rules.json (`burstRounds` removed: the burst length is the weapon's mode); per-weapon `fireApCost` → data/items.json
**Source.** design/tactical-actions.md › Weapons (Fire); design/design.md › Data definitions › Weapon profile (Fire modes)

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
**Rule.** Throwing a grenade (ITM-032) from the vest or belt costs `throwCost` AP; from the backpack + `backpackSurcharge` (TAC-068). Arm wounds add no AP. Maximum throwing distance = `throwDistance.base` + floor(Strength ÷ `throwDistance.strengthDivisor`) tiles (10–20); arm wounds do not change it. The grenade lands at a seeded random point within a scatter radius of the target tile: radius = (`grenadeScatterBase` + throw distance in tiles ÷ `grenadeScatterPerTiles`) tiles, × `woundedArmScatterFactor` if the worse arm (TAC-058) is wounded, × `disabledArmScatterFactor` if it is disabled. Effects on landing: TAC-079.
**Values.** `throwCost` — 5 (draft), `throwDistance` — `base` 10, `strengthDivisor` 10 (draft), `grenadeScatterBase` — 1 tile (draft), `grenadeScatterPerTiles` — 10 (draft: +1 tile per 10 tiles thrown), `woundedArmScatterFactor` — 1.5 (draft), `disabledArmScatterFactor` — 2 (draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Weapons (Throw a grenade); design/item-list.md › Grenades; design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/design.md › Management › Soldier attributes

### [TAC-079] Grenade effects
**Rule.** A grenade (ITM-032) takes effect on landing, at its landing tile. Frag (`effect: frag`): every soldier within `radiusTiles` of the landing tile takes blast damage = `damage` × (1 − d ÷ `radiusTiles`) at distance d tiles (full at the point of impact, falling evenly to 0 at the edge). Full cover between the landing point and the soldier blocks it; half cover multiplies it by `blastHalfCoverFactor`. The blast damage is split over the six body zones by `blastZoneShares` (their share of the silhouette), each share rounded down and checked against that zone's armour with the grenade's `penetrationClass` (TAC-050/051). The blast also damages cover edges (TAC-085). The blast is loud: heard across the whole map (as an unsuppressed shot, TAC-018/019). Smoke (`effect: smoke`): a cloud of `radiusTiles` around the landing tile for `durationTurns` turns (TAC-014) that blocks line of sight into, out of and through it; no damage; quiet (no noise event).
**Values.** grenade `damage`, `radiusTiles`, `penetrationClass`, `durationTurns`, `loud` → data/items.json (ITM-032); `blastZoneShares` — head 0.08, thorax 0.30, each arm 0.10, each leg 0.21 (design silhouette shares), `blastBlockingCover` — [`full`], `blastHalfCoverFactor` — 0.5 (draft) → data/tactical-rules.json
**Source.** design/item-list.md › Grenades; design/design.md › Tactical Layer › Body zones and hitboxes (share of front silhouette)

## Hit model

### [TAC-044] Total spread
**Rule.** Total spread (MoA, game scale) = (Base MoA × ammo spread modifier × condition factor + shooter spread) × arm wound factor.
- Shooter spread = (skill spread + range spread) × stance factor × `aimSpreadFactor`^aim steps (TAC-040) + penalties. Skill spread = `shooterSpread.skillMax` − `shooterSpread.skillRange` × Marksmanship ÷ 100 (7.9 at Marksmanship 1, 4.5 at 50, 1.0 at 100). Range spread (Perception at range) = (100 − Perception) ÷ 100 × `shooterSpread.rangePerTile` × max(0, distance − `shooterSpread.rangeFreeTiles`) tiles. Stance factor `shooterSpread.stance`: upright 1.0, crouched 0.8, prone 0.6. Penalties (added): suppressed `suppressionSpread` (TAC-015), pain `painSpread` (TAC-026), arm fracture `fracture.armSpread` (TAC-062), snap shot `snapShotSpread` (TAC-023), blinded `blindSpread` (TAC-004).
- A fitted optic multiplies the range spread (mod modifier `shooterSpreadAtRange`, DAT-016); a laser multiplies shooter spread on snap shots (mod modifier `snapShotSpread`, DAT-017).
- Condition factor = 1 + `conditionSpreadCurve.maxExtra` × (100 − Condition) ÷ 100 (DAT-014; up to ×1.5 at Condition 0).
- Arm wound factor = `woundedArmConeFactor` if the worse arm is wounded, `disabledArmConeFactor` if it is disabled, else 1 (TAC-058).
- 1 MoA ≈ 17 cm of cone width at 50 m (33 tiles), scaling linearly with distance. Example (design): Marksmanship 50, upright, no aim, AK-74M (Base MoA 5): 4.5 + 5 = 9.5 MoA; prone with 3 aim steps: 6.65 MoA.
**Values.** `shooterSpread` (draft): `skillMax` 8, `skillRange` 7, `rangePerTile` 0.05, `rangeFreeTiles` 20, `stance` {upright 1.0, crouched 0.8, prone 0.6} → data/tactical-rules.json; `baseMoA`, ammo `spreadModifier`, optic and laser modifiers → data/items.json
**Source.** design/design.md › Tactical Layer › Hit model; › Hit model › Shooter spread and recoil (draft); design/design.md › Data definitions › Weapon profile

### [TAC-045] Simulated shot trace
**Rule.** Each projectile picks a direction from a 2D normal distribution centred on the aim point (most shots near the centre), using the seeded RNG. The cone's edge (half its width) lies at `coneSigmaFraction` standard deviations, so about 95% of shots land inside the cone. When the target is concealed (TAC-082), the aim point is shifted first. The ray is traced against cover/geometry and against the target's body-zone hit boxes (TAC-052..TAC-056); the first intersected volume is hit. Multi-projectile loads (calibre `projectiles` > 1, e.g. buckshot 8) trace each pellet separately.
**Values.** `coneSigmaFraction` — 2 (cone half-width = 2σ) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Hit model (Decision: MoA is simulated); design/design.md › Data definitions › Calibre profile

### [TAC-046] Hit chance and shot preview
**Rule.** Before firing, the preview runs `previewSamples` traces with the same model and reports: hit % (share of traces hitting the target), most likely body zone (and distribution per zone), and whether the round would penetrate that zone's armour (TAC-050). The preview matches the real shot statistically (within a few percent), not exactly: the real shot is a fresh seeded roll. Preview sampling uses its own RNG stream (separate from the battle seed's stream) so looking at a preview never changes the battle RNG sequence, a real shot or a replay. For a concealed target (TAC-082) the preview uses the unshifted cone and marks the target as concealed; its hit % is then the best case.
**Values.** `previewSamples` — 300 → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Hit model (Shot preview); › Tactical map generation (draft) › Concealment; design/design.md › Tactical Layer (Readability)

### [TAC-047] Burst recoil
**Rule.** Each extra round within one shot action adds recoil spread = `recoilSpreadPerRound` × effective recoil (TAC-049) × (1 − recoil control) × ammo `recoilSpreadModifier`, accumulating round by round. Recoil control = `recoilControl.marksmanship` × Marksmanship ÷ 100 + `recoilControl.strength` × Strength ÷ 100 (0–0.6). Tracer loads have `recoilSpreadModifier` 0.85; other loads 1. Example (design): AK-74M (effective recoil 32), Marksmanship 50, Strength 50 → about 0.9 MoA per extra round.
**Values.** `recoilSpreadPerRound` — 0.04, `recoilControl` — `marksmanship` 0.4, `strength` 0.2 (draft) → data/tactical-rules.json; ammo `recoilSpreadModifier` (tracer 0.85, draft) → data/items.json
**Source.** design/design.md › Tactical Layer › Hit model › Shooter spread and recoil (draft); design/item-list.md › Ammunition

### [TAC-082] Concealment (obscuring terrain)
**Rule.** Terrain flagged `obscuring` (brush, trees, tall crops) conceals. A target is concealed when it stands on an obscuring tile or the line of fire passes through one or more obscuring tiles beyond the shooter's own tile (the shooter's tile never counts: firing out of a bush does not shift the shooter's own aim). Once a shot action against a concealed target is confirmed, the aim point (the centre of the spread cone) moves `concealmentShiftMoA` (game scale; about 1 cm per tile of distance) in a direction drawn from the battle's seeded stream. The shift is made once per shot action, so every round of a burst uses the same shifted cone, and it does not add up over several obscuring tiles. Hit logic is unchanged: the shifted cone is traced as usual (TAC-045). The preview shows the unshifted cone and marks the target as concealed (TAC-046). A soldier standing on an obscuring tile is also harder to spot (TAC-081, `foliageConcealmentFactor`).
**Values.** `concealmentShiftMoA` — 2, `foliageConcealmentFactor` — 0.7 → data/tactical-rules.json; terrain `obscuring` → data/terrain.json
**Source.** design/design.md › Tactical Layer › Tactical map generation (draft) › Concealment

### [TAC-083] Weapon jam and clearing it
**Rule.** Each shot action jams with chance `jamChanceCurve.max` × ((100 − Condition) ÷ 100)^`jamChanceCurve.exponent` (0% at Condition 100, 2.5% at 50, 10% at 0), one seeded roll per shot action, before its rounds are fired. A jammed weapon cannot fire (shot action or Fire reaction) until the jam is cleared: **Clear a jam** costs `clearJamCost` AP, or `clearJamCostSkilled` if Technical ≥ `clearJamSkilledThreshold`. A gun loses `weaponWearPerShot` Condition per round fired (1 per 50 rounds). Condition also widens the weapon's spread (TAC-044, DAT-014).
**Values.** `jamChanceCurve` — `max` 0.10, `exponent` 2; `weaponWearPerShot` — 0.02; `clearJamCost` — 4, `clearJamCostSkilled` — 3, `clearJamSkilledThreshold` — 50 (all draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Derived per shot › Armour wear and weapon condition (draft); design/tactical-actions.md › Weapons (Clear a jam); design/design.md › Data definitions › Weapon profile (State, not profile)

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
**Rule.** A blocked round deals blunt damage = `bluntShare` × damage at that distance to the hit zone; the falloff floor (TAC-048) does not apply to blunt damage. Blunt damage can cause pain (TAC-063) and stun (TAC-025) but never bleeding (TAC-060/061). Penetrating rounds deal full damage at distance to the zone's HP. Every hit on an armour piece wears it, blocked or not: durability − ceil(damage at that distance × `armourWear.blocked`) for a blocked hit, × `armourWear.penetrating` for a penetrating one, at least `armourWear.min`, × the armour's `durabilityLossModifier` (ceramic plates 1.5). Arms and legs carry no armour yet; an armour item may later list the zones it covers (ITM-011 `coversZones`, unused in the first build).
**Values.** `bluntShare` — 0.20, `armourWear` (draft) — `blocked` 0.10, `penetrating` 0.05, `min` 1 → data/tactical-rules.json; armour `durabilityLossModifier` → data/items.json
**Source.** design/design.md › Tactical Layer › Derived per shot; › Derived per shot › Armour wear and weapon condition (draft); design/item-list.md › Body armour

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
**Values.** `woundedArmConeFactor` — 1.5, `disabledArmConeFactor` — 2, `woundedArmScatterFactor` — 1.5, `disabledArmScatterFactor` — 2, `disabledLegMoveFactor` — 2 (draft) → data/tactical-rules.json; per-zone bleeding chances → TAC-060/TAC-061 (`zones.<zone>.lightBleedChance`, `zones.<zone>.heavyBleedChance`, draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/tactical-actions.md › Movement (Leg wounds), Weapons, AP modifiers on an activation

### [TAC-059] Zone at 0 HP
**Rule.** Head or thorax at 0 HP → the soldier dies immediately. Arm or leg at 0 HP → the limb is **disabled** (effects TAC-058) until the surgical kit brings it back to 1 HP (TAC-067; it is then wounded). Damage that hits a disabled limb (after armour, TAC-050/051) is split equally over all zones still above 0 HP, head and thorax included; so is the excess of the hit that disables the limb (the damage beyond the limb's remaining HP). Each share is rounded down and applied to its zone without a further armour check (armour is checked only at the zone that was hit); it may in turn disable a limb or kill the soldier. A dead soldier's seven equipment slots stay on the body as lootable.
**Source.** design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/design.md › Tactical Layer › Medical system › Conditions; design/design.md › Data definitions › Soldier equipment slots

## Medical

### [TAC-060] Light bleeding
**Rule.** Checked for every hit that deals damage through armour (blunt hits never bleed, TAC-051). A **hard hit** deals at least `hardHitShare` of the zone's max HP: it rolls for heavy bleeding first (TAC-061) and, if that fails, for light bleeding; every other hit rolls for light bleeding only. Chance = `zones.<zone>.lightBleedChance` × ammo `bleedModifier` × (1 − Endurance ÷ `bleedEnduranceDivisor`). Effect: −`lightBleedHp` HP per turn in that zone (end of turn, TAC-014) until treated. Treated by bandage, IFAK or medkit.
**Values.** `lightBleedHp` — 1, `hardHitShare` — 0.25, `bleedEnduranceDivisor` — 400 (Endurance resists up to −25%); `zones.<zone>.lightBleedChance` (draft): head 0.30, thorax 0.50, arm 0.40, leg 0.40 → data/tactical-rules.json; ammo `bleedModifier` (HP ammo 1.5) → data/items.json
**Source.** design/design.md › Tactical Layer › Medical system › Conditions; › Medical system › Chances (draft)

### [TAC-061] Heavy bleeding
**Rule.** Rolled on hard hits only (TAC-060). Chance = `zones.<zone>.heavyBleedChance` × ammo `bleedModifier` × (1 − Endurance ÷ `bleedEnduranceDivisor`). Effect: −`heavyBleedHp` HP per turn in that zone until treated. Treated by tourniquet (arm or leg only), hemostatic dressing (any zone) or medkit. A zone has at most one bleeding condition; heavy replaces light.
**Values.** `heavyBleedHp` — 4; `zones.<zone>.heavyBleedChance` (draft): head 0.20, thorax 0.35, arm 0.25, leg 0.25 → data/tactical-rules.json; ammo `bleedModifier` → data/items.json
**Source.** design/design.md › Tactical Layer › Medical system › Conditions; › Medical system › Chances (draft)

### [TAC-062] Fracture
**Rule.** A hit on an arm or leg dealing at least `fracture.damageThreshold` of the limb's max HP fractures it with chance `fracture.chance`; a hit that disables the limb, with `fracture.disableChance`. Fractures from falls are OPTIONAL (no falling in the first build). Arm fracture: shooter spread + `fracture.armSpread` (TAC-044) and reload base cost × 1.5 (TAC-041). Leg fracture: base tile cost × 1.5 (TAC-029), stacking with a disabled leg (×2 × 1.5 = ×3), no sprinting. Treated by splint. A "wounded" arm or leg = a limb below `woundedThreshold` of its max HP and above 0 HP; at 0 HP it is "disabled" (TAC-059). Healing it to or above that share removes the wounded state. Fracture effects apply on their own, whether or not the limb is wounded or disabled.
**Values.** `woundedThreshold` — 0.5 (draft); `fracture` (draft) — `chance` 0.30, `damageThreshold` 0.35, `disableChance` 0.60, `armSpread` 2 MoA → data/tactical-rules.json; `armFractureReloadFactor` — 1.5 (draft, TAC-041)
**Source.** design/design.md › Tactical Layer › Medical system › Conditions; › Medical system › Chances (draft); › Hit model › Shooter spread and recoil (draft)

### [TAC-063] Pain
**Rule.** Pain starts when one hit (blunt included) deals at least `painThresholds.hitShare` of a zone's max HP, when any zone is below `painThresholds.zoneBelowShare` of its max HP, or when a tourniquet is applied; it lasts while any zone is below that share or a tourniquet is on. Effect: fewer AP and more aim spread (TAC-026). Painkillers mask it for the item's duration (10 turns); a new dose resets the mask to the full duration (doses do not stack); when the mask expires, pain returns if its cause persists.
**Values.** `painThresholds` (draft) — `hitShare` 0.20, `zoneBelowShare` 0.50 → data/tactical-rules.json; painkiller `durationTurns` — 10 → data/items.json
**Source.** design/design.md › Tactical Layer › Medical system › Conditions; › Medical system › Chances (draft); design/item-list.md › Medical items

### [TAC-064] Medical item use permissions
**Rule.** Any soldier can use any medical item, except the surgical kit, which requires Medical ≥ `surgicalMinMedical`. Target: self, or a squadmate on an adjacent tile (8-neighbourhood, same level).
**Values.** `surgicalMinMedical` — 40 → data/items.json (item field `minMedical`)
**Source.** design/design.md › Tactical Layer › Medical system › Using medical items; design/tactical-actions.md › Medical

### [TAC-065] Medical AP cost
**Rule.** Cost = max(1, item base AP − floor(Medical ÷ 40)), then + `selfTreatSurcharge` if treating oneself and + backpack surcharge (TAC-068) if the item is taken from the backpack (the 1-AP floor applies before the surcharges). Base AP per item: bandage 3, tourniquet 2, hemostatic dressing 4, splint 5, painkillers 2, IFAK 6, medkit 8, surgical kit 15.
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
**Rule.** A soldier carrying bolt cutters and adjacent to a locked door (TAC-084) or container may cut the lock for `boltCutterCost` AP; the action makes no noise and leaves the door unlocked.
**Values.** `boltCutterCost` — 10 → data/items.json (bolt cutters `apCost`)
**Source.** design/tactical-actions.md › Gear and interaction; design/design.md › Tactical Layer › Tactical map generation (draft) › Tiles, cover and doors

### [TAC-072] Place a demolition charge
**Rule.** A soldier carrying a demolition charge may place it on an adjacent target for `placeChargeCost` AP, or `placeChargeCostSkilled` if Technical ≥ `placeChargeSkilledThreshold`. Detonation triggers destruction recalculation (TAC-036).
**Values.** `placeChargeCost` — 8 (draft), `placeChargeCostSkilled` — 6 (draft), `placeChargeSkilledThreshold` — 50 (draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Gear and interaction

### [TAC-073] Restrain a VIP
**Rule.** In a capture mission, a soldier on a tile adjacent to the VIP may restrain them for `restrainCost` AP, only once the VIP has surrendered or is wounded.
**Values.** `restrainCost` — 6 (draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Gear and interaction

### [TAC-074] Carry or drag a body
**Rule.** A soldier on a tile adjacent to a body may lift it for `liftCost` AP, choosing carry or drag (player's choice; the AI's command names the mode), and put it down for `putDownCost` AP. A body is a wounded or dead squadmate, an enemy (dead or alive), or a restrained VIP (TAC-073). The body and all gear on it count toward the carrier's carried weight (TAC-027) while lifted. Carrying is not possible if it would put the carrier over carry capacity; dragging is always possible (the carrier may then be over-encumbered, TAC-027). Carrying: the carrier must be upright; each tile costs the walk cost (TAC-029) + `carryMoveSurcharge`; no sprinting (TAC-032), climbing or vaulting (TAC-034). Dragging: upright or crouched, not prone; each tile costs the walk cost (plus the crouch surcharge when crouched, TAC-030) + `dragMoveSurcharge`; no vaulting. To cross a half-cover edge with a body, the soldier puts it down first.
**Values.** `liftCost` — 4, `putDownCost` — 2, `carryMoveSurcharge` — 2 per tile, `dragMoveSurcharge` — 3 per tile (all draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Gear and interaction (Carry or drag a body)

### [TAC-084] Doors
**Rule.** A closed door is a full-cover edge (TAC-035) that blocks sight and movement. Walking through a closed, unlocked door opens it as part of the move: + `openDoorSurcharge` AP on that step (TAC-029). **Close a door** on an adjacent tile edge: `closeDoorCost` AP. Interior doors are never locked; locked outer doors are placed by map generation (TAC-088). A locked door opens with bolt cutters (TAC-071), the POI key of that point of interest (ITM-026) or a demolition charge (TAC-072, TAC-085).
**Values.** `openDoorSurcharge` — 1, `closeDoorCost` — 1 (draft) → data/tactical-rules.json
**Source.** design/tactical-actions.md › Gear and interaction (Open a door, Close a door); design/design.md › Tactical Layer › Tactical map generation (draft) › Tiles, cover and doors

### [TAC-085] Cover edge destruction
**Rule.** Every cover edge (walls, doors, windows, fences, props) has the HP of its material (`materialHp`). Bullets never damage edges. A grenade blast (TAC-079) hits every edge within its radius that has no full cover between it and the blast point (the first wall on each line takes the blast; edges behind it are untouched), for `edgeBlastFactor` × its blast damage at that distance (a frag grenade breaks wood and doors nearby, dents brick, leaves concrete standing). A demolition charge (TAC-072) always destroys the edge it is placed on. An edge at 0 HP becomes rubble with no cover; destruction triggers recalculation (TAC-036).
**Values.** `materialHp` — wood 40, brick 120, metal 200, vehicle 150, concrete 300; `edgeBlastFactor` — 3 (draft) → data/tactical-rules.json
**Source.** design/design.md › Tactical Layer › Tactical map generation (draft) › Tiles, cover and doors (Destruction)

## Tactical map generation

### [TAC-086] Tactical map types
**Rule.** The map type comes from the encounter tile, in this order: a plant; a border crossing; a settlement (town → town; small city, large city, capital → city); otherwise the tile's terrain (steppe/farmland → open, woods, marsh, hills, mountain, shore). Each type sets the map size (square, in tiles), the target built share (of land tiles) and the target foliage share. Buildings appear only where the tile has a road, settlement, plant or crossing. Inputs besides the type: the four neighbouring tiles' terrain, the roads crossing the tile (track, road, highway, with the edges they cross) and the side the squad approaches from (default: the road it came in on), all from the tactical map request `region`.
**Values.** `mapTypes` (draft) — size / built / foliage: open 80 / 0.06 / 0.15; woods 64 / 0.03 / 0.50; marsh 64 / 0.02 / 0.30; hills 64 / 0.03 / 0.25; mountain 48 / 0.02 / 0.20; town 72 / 0.07 / 0.14; city 96 (small city 80) / 0.16 / 0.10; plant 96 / 0.11 / 0.10; crossing 64 / 0.05 / 0.14; shore 64 / 0.03 / 0.15 → data/mapgen/tactical.json
**Source.** design/design.md › Tactical Layer › Tactical map generation (draft) › Inputs, Map types

### [TAC-087] Map generation stages
**Rule.** The generator runs these stages in order; every share, size and threshold is data:
1. **Zones:** the map takes the tile's terrain; within about a fifth of the map size from an edge it blends into that neighbour's terrain along a noisy line.
2. **Water:** shores from sea and lake neighbours; water more than `water.deepFromShoreTiles` from the shore is deep (impassable).
3. **Roads:** each road enters at its matching edge and runs to a hub near the centre, away from water; width by kind (highway 5, road 3, track 2 tiles); tracks and roads ford shallow water, deep water gets a bridge with railings (half-cover edges). A town adds village streets; open country with no road may get a farm track.
4. **Structures:** buildings, fences and props, placed before the ground is filled (TAC-088).
5. **Fields and shelterbelts:** on farmland, a grid of 2-tile tree lines (about a third with gaps) divides the land into crop fields and meadows.
6. **Ground fill:** the remaining tiles are filled by a seeded wave function collapse over grass, brush, trees, mud and rock, with adjacency rules (rock only next to grass, brush, trees or rock; mud never next to rock), aiming for the map type's foliage share.
7. **Details:** tree trunks, road wrecks, craters (rubble and mud), potholes and scatter props; then every walkable pocket is connected to the main area by a footbridge or a cleared gap.
8. **Exits and deployment:** 2–4 exits on the map edge, at least `exitSpacingTiles` apart: every exit in the request first, then road exits (a road needs vehicle fuel, a road across the border a paid crossing), then `footExitWidth`-tile exits on foot up to the count. Player zone on the approach edge; enemy zone around the objective when the tile has a point of interest, else on the opposite edge.
9. **Checks and re-roll:** TAC-089.
**Values.** stage parameters (`zones`, `water`, `roads`, `parcels`, `groundFill`, `details`, `exitSpacingTiles` 20, `footExitWidth` 6, `deployment`) → data/mapgen/tactical.json
**Source.** design/design.md › Tactical Layer › Tactical map generation (draft) › Stages

### [TAC-088] Buildings and levels
**Rule.** Buildings are generated from floor-plan rules in data (room types and size ranges, apartment layouts, shop ground floors); walls, doors and windows sit on tile edges (TAC-035). Per map type: cities get a street grid or a Soviet housing block (khrushchyovkas around a courtyard) and, optionally, part of the city's landmarks (TAC-092); towns get house plots with gardens, a school or admin building and sometimes a war memorial; plants get a fenced compound (hall, warehouses, admin, checkpoint, and tanks or bunkers by plant type); crossings get a checkpoint, customs and sandbag positions; countryside with a road gets a kolkhoz yard or a single hut. Levels: every building has a playable ground floor. **Large buildings** — every building of 3 or more floors (apartment blocks, khrushchyovkas, offices, schools, hospitals, landmarks) plus warehouses and plant halls (`largeBuildingKinds`) — also have a playable flat roof, reached by an inside stairwell next to the main entrance (in apartment blocks, their stairwell core). Small buildings' roofs are scenery; taller buildings show their real height, but only playable levels can be entered. A playable second floor for large buildings is OPTIONAL (left out of the first build iterations). Doors: interior doors are never locked; outer doors are locked with chance `lockedDoorShare.poi` on warehouses, plant buildings and buildings at points of interest, `lockedDoorShare.house` on houses (TAC-084).
**Values.** floor-plan rules (`buildings`), `largeBuildingKinds`, `lockedDoorShare` — `poi` 0.25, `house` 0.10 (draft) → data/mapgen/tactical.json
**Source.** design/design.md › Tactical Layer › Tactical map generation (draft) › Stages (Structures, Levels), Tiles, cover and doors

### [TAC-089] Map checks and re-roll
**Rule.** A generated layout is checked. Required checks: 2–4 exits; both deployment zones and every exit connected on foot (vaulting half-cover edges counts as passable); every building can be entered. A layout that fails a required check is generated again with the next seed (seed + attempt), up to `attempts` times; the last layout is used if all fail. Reported checks (logged, no re-roll): foliage and built shares within `shareTolerance` of the map type; roads leave through their edges; room rules met; no vegetation on roads; every room reachable from a door.
**Values.** `attempts` — 6, `shareTolerance` — 0.06 → data/mapgen/tactical.json `validate`
**Source.** design/design.md › Tactical Layer › Tactical map generation (draft) › Stages (Checks and re-roll)

### [TAC-090] Tall crops (optional)
**Rule.** OPTIONAL — left out of the first build iterations. Some crop fields are tall crops (sunflower, maize): obscuring terrain (TAC-082) that hides soldiers but gives no cover.
**Values.** tall-crop share of fields → data/mapgen/tactical.json `parcels`; tall-crop terrain → data/terrain.json
**Status.** optional
**Source.** design/design.md › Tactical Layer › Tactical map generation (draft) › Optional extras

### [TAC-091] Loot containers and mission item (optional)
**Rule.** OPTIONAL — left out of the first build iterations. Each building gets 1 loot container (2 in warehouses, barns and halls), placed on the side away from its door. On a retrieve mission, the container farthest from the player zone holds the mission item.
**Values.** containers per building kind → data/mapgen/tactical.json `containers`
**Status.** optional
**Source.** design/design.md › Tactical Layer › Tactical map generation (draft) › Optional extras

### [TAC-092] City landmarks (optional)
**Rule.** OPTIONAL — left out of the first build iterations. Each city has a fixed landmark roster (government house, theatre, hospital, school, department store, cinema, monument, eternal flame), drawn from its own stream keyed by the city name, so a city's landmarks are the same on every map of it; a city map carries 1–3 of them.
**Values.** landmark kinds, roster sizes, per-map count → data/mapgen/tactical.json `landmarks`
**Status.** optional
**Source.** design/design.md › Tactical Layer › Tactical map generation (draft) › Optional extras, Randomness

### [TAC-093] Generation randomness
**Rule.** Map generation uses one random stream per stage, each derived from the map seed (`shared/rng.js`), so tuning one stage does not change the others. The landmark roster (TAC-092) uses its own stream per city name.
**Source.** design/design.md › Tactical Layer › Tactical map generation (draft) › Randomness

## Open questions

1. **Resolved (design 8972470):** wounds do not reduce the AP pool; they raise the cost of the actions that use the wounded zone (design.md no longer lists leg/arm wounds as turn modifiers). TAC-006 / TAC-058: design.md says leg or arm wounds reduce the AP pool for the activation; tactical-actions.md lists only suppression, stun, pain and over-encumbrance as AP modifiers and treats arm wounds as raising aim/reload cost and leg wounds as raising movement cost. Which applies?
2. **Resolved (design 8972470):** an arm or leg counts as wounded below 50% of its max HP (TAC-062 `woundedThreshold`); healing it above that removes the state. TAC-009 / TAC-058 / TAC-062: "wounded" leg/arm is undefined. Spec assumes "below max HP or fractured"; does any scratch count, and does healing to full remove it?
3. **Resolved (design 3aac08f):** yes — stamina never goes below 0, so a soldier with exactly 2 stamina may sprint (TAC-008). **Resolved (design 8972470):** the surcharge is charged when the activation ends, as specced. Still open: whether a soldier with exactly 2 stamina may sprint. TAC-008: the +1 stamina surcharge depends on sprinting during the activation, but stamina is checked at activation start. Spec charges it at the end (floored at 0). Confirm, and confirm whether a soldier with exactly 2 stamina may sprint.
4. **Resolved (design eb072a2):** yes — reacting is not activation; a soldier who only reacted still recovers +1 stamina at turn end. TAC-011: does a soldier who made reaction attempts in a turn still recover stamina that turn? Spec: yes (reacting is not activation).
5. **Resolved (design eb072a2):** the stall rule is reworded: after 2 turns of passing with no enemy seen or heard, turns advance automatically until someone is seen or heard or a soldier acts; "contact" and "something changes" are no longer used (see question 50). TAC-013: "contact" and "skip ahead until something changes" are undefined for the stall rule.
6. **Resolved (design 3aac08f):** "cover is hit" = any enemy round stopped by a cover edge of the soldier's tile facing the shooter, whoever it was aimed at (TAC-015). **Resolved (design 75e776f):** the suppression spread is +3 MoA (TAC-015) (part). Still open: what exactly counts as "cover is hit". **Resolved (design eb072a2):** an enemy shot landing within 1 tile also suppresses; Nerve's reduction is deferred (TAC-077, optional) (part). Still open: what exactly counts as "cover is hit", and the spread value. TAC-015: what counts as "cover is hit" (any shot hitting an edge the soldier is behind? only shots aimed at them?), and is the suppression spread increase a fixed amount? Nerve's reduction is not quantified.
7. **Resolved (design 75e776f):** 21:00 is night and 06:00 is day: day is [06:00, 21:00) (TAC-003). TAC-003: boundaries — is exactly 21:00 night and exactly 06:00 day? Spec uses [06:00, 21:00) as day.
8. **Resolved (design 75e776f):** day sight range and Recon/Agility/stance concealment are drafted (TAC-081); a flashlight blinds within 10 tiles, +4 MoA (TAC-004). TAC-004: no formula for base sight/spotting range (Perception + Recon), nor for flashlight blinding.
9. **Resolved (design eb072a2):** alerted = at the start of its next activation the soldier turns to face the noise for free, and a marker shows its side (and the AI) where the noise came from; no reaction bonus. TAC-019: the "alerted" state has no defined effect.
10. **Resolved (design 3aac08f):** any visible action (firing, reloading, using an item) and newly opened sightlines trigger reaction checks (TAC-020). **Resolved (design 8972470):** one attempt per mover per entry into the vision cone (second part, as specced). Still open: whether a non-moving action triggers reactions. TAC-020 / TAC-036: the reaction trigger is "an opposing soldier moves into or through the cone", but destruction "can trigger reactions on newly opened sightlines" without movement. Does a non-moving action (firing, opening a sightline) trigger reactions? Also: can a reactor attempt more than once against the same mover in one move?
11. **Resolved (design 75e776f):** draft reaction modifiers for distance, stance, sprint, noise (mover Recon), reactor pain and wounds (TAC-022); Nerve stays out (TAC-077). TAC-022: distance, stance, sprint, noise and wound modifiers have no values; does Nerve or Recon (noise) feed in?
12. **Resolved (design 3aac08f):** ties: full before half cover, then farther from the mover, then a seeded pick (TAC-023). **Resolved (design 75e776f):** the snap-shot penalty is +3 MoA (TAC-023) (part). Still open: ties between equally near cover tiles. **Resolved (design eb072a2):** Take cover moves to the nearest covered tile within 1 tile, else the reactor crouches; a Fire reaction is a single snap shot, or a shot action in the current mode without the penalty on overwatch (TAC-075) (part). Still open: the snap-shot penalty value and ties between equally near cover tiles. TAC-023: Take cover — which tile when several qualify, and is it limited to one tile? Does the Fire reaction use a specific fire mode (single shot?) and the snap-shot penalty value?
13. **Resolved (design 8972470):** setting a reaction is free and can be changed any number of times in the activation. TAC-021: the cost of setting a reaction is not stated (tactical-actions: Open).
14. **Resolved (design 75e776f):** shooter spread is drafted (skill, range, stance, aim factor, additive penalties; TAC-044); "hip shot" is dropped: lasers apply to snap shots. TAC-044: the shooter-spread function (Marksmanship, Perception at range, stance, aim time, wounds) and how terms combine (additive in MoA?) are open; "hip shot" is mentioned for lasers but never defined as a fire option.
15. **Resolved (design 75e776f):** the cone edge is 2σ (TAC-045). TAC-045: the relation between cone width and the normal distribution's σ ("where nearly all shots land") needs a number.
16. **Resolved (design 75e776f):** about 300 samples; the preview matches statistically, the real shot is a fresh roll (TAC-046). TAC-046: exact preview sample count ("a few hundred") and whether the preview must match the result exactly or only statistically.
17. **Resolved (design 75e776f):** every hit wears armour (blocked 10%, penetrating 5% of damage, at least 1; ceramic ×1.5); no limb armour yet, armour may later list zones (TAC-051). TAC-050: "condition percentage" for armour is assumed to be durability ÷ max durability; durability loss per hit and whether penetrating hits also wear armour are not set. Do arms/legs ever get armour ("usually none")?
18. **Resolved (design 75e776f):** blunt damage ignores the falloff floor, can cause pain and stun, never bleeding (TAC-051). TAC-051: is blunt damage also subject to the 10% damage floor and does it cause bleeding/pain?
19. **Resolved (design eb072a2):** a limb at 0 HP is disabled (arms: cone and scatter ×2; legs: base tile cost ×2); the surgical kit brings it back to 1 HP. TAC-059 / TAC-067: arm or leg at 0 HP has "no negative effects for now", yet the surgical kit exists to bring them back to 1 HP. Does a limb at 0 HP keep its wound effects, or is there a missing 0-HP effect?
20. **Resolved (design 3aac08f):** see question 45 (resolved). **Resolved (design eb072a2):** damage that hits a disabled limb is split equally over all zones still above 0 HP, head and thorax included (part). Still open: question 45. TAC-059: damage overflow from a 0-HP limb is discarded in the spec; does it transfer to the thorax?
21. **Resolved (design 8972470):** the item list now says the dressing is light and quick and the medkit also stops heavy bleeding in any zone; dressing and medkit cover every zone, the tourniquet arms and legs only; there is no "only fix". TAC-061 / TAC-067: item list says hemostatic dressing is the "only fix for thorax and head bleeding in the field", but the medkit stops heavy bleeding (zone unrestricted) and bandage/IFAK stop light bleeding in any zone. Clarify which zones each item covers.
22. **Resolved (design 75e776f):** bleeding chances per zone, hard hit ≥ 25% of zone HP, Endurance resists up to −25%, fracture thresholds and chances are drafted; falls are optional (TAC-060..062). TAC-060 / TAC-061 / TAC-062: bleeding chances per hit/zone, the damage threshold for "hard hits" and "heavy hits", fall damage and Endurance bleed resistance are all unquantified.
23. **Resolved (design 75e776f):** pain starts on a hit ≥ 20% of zone HP, any zone below 50% or a tourniquet; +1.5 MoA; painkiller doses reset the mask, no stacking (TAC-026, TAC-063). TAC-063 / TAC-026: pain causes (which damage amount), AP and spread magnitude, and whether painkillers stack, are open.
24. **Resolved (design 75e776f):** the 1-AP floor applies first, then the surcharges (TAC-065). TAC-065: order of operations — is the "never below 1" minimum applied before the self-treatment and backpack surcharges (spec) or after?
25. **Resolved (design eb072a2):** the IFAK's 15 HP is the base per use before the Medical multiplier, so a skilled medic heals more; the multiplier applies to every HP-restoring item (medkit HP per use is still not stated). TAC-066: is the IFAK's 15-HP cap applied before or after the Medical multiplier, and does the multiplier apply to the medkit too?
26. **Resolved (design 3aac08f):** carry capacity 15 + 0.3 × Strength + 0.1 × Endurance kg (MGT-029); penalty × (1 − Strength ÷ 200); heavy assault armour −5 AP per activation, no stamina penalty (TAC-027). **Resolved (design 8972470):** AP penalty −5 over carry capacity, −10 over 125% of it (draft) (part). Still open: carry capacity formula, Strength's reduction, heavy assault armour penalties. TAC-027: carry capacity formula (DAT/MGT) and the AP penalty are open; heavy assault armour's "large stamina and AP penalties" has no rule.
27. **Resolved (design 8972470):** draft values for terrain, diagonal, crouch, prone, sprint, stance, turn, vault and climb; turning along a path while moving is free. Remaining gap: question 32. TAC-029..TAC-034, TAC-017: terrain, diagonal, crouch, prone, sprint, stance, turn, vault and climb costs are all open; is a facing change implied by a move step free?
28. **Resolved (design 3aac08f):** throw distance 10 + floor(Strength ÷ 10) tiles (TAC-043). **Resolved (design 8972470):** draft fire AP per weapon type with burst/auto/ergonomics modifiers, aim steps, reload by feed type, swap and throw costs (part). Still open: the Strength → throw distance formula. TAC-039..TAC-043: fire-mode AP costs, aim steps, reload, swap and throw costs and the Strength→throw distance formula are open.
29. **Resolved (design 75e776f):** recoil control 0.4 × Marksmanship + 0.2 × Strength (÷ 100); 0.04 per round; tracer ×0.85 (TAC-047). TAC-047: recoil-control formula and tracer's reduction value are open.
30. **Resolved (design 3aac08f):** soldiers leave one by one; the battle ends for the player side when none of its soldiers is left (TAC-038). **Resolved (design eb072a2):** a soldier already on an exit tile may also leave at the start of its activation without moving (TAC-038); the morale flee rule is optional, later build (TAC-077) (part). Still open: whether leaving requires the whole squad. **Resolved (design 8972470):** leaving the map is free once the soldier ends the move on an exit tile with its condition met (AP part). Still open: whole squad, morale fleeing. TAC-038: AP cost of leaving the map; does leaving require the whole squad, and how does the Management morale rule (below 20 an activated soldier may flee toward the nearest exit) hook into activation? Ownership of that rule is outside this file's sources.
31. **Resolved (design 75e776f):** jam chance 10% × ((100 − Condition)/100)², clear a jam 4 AP (3 with Technical 50+), wear 1 per 50 rounds (TAC-083). TAC-044: weapon Condition raises jam chance and spread (weapon profile) — no jam rule or magnitudes are given for the tactical layer.
32. **Resolved (design eb072a2):** upright → prone goes through crouched: 2 + 2 = 4 AP; no Agility term (Tactical actions is the single cost source). TAC-033: the cost of upright → prone is not stated (only upright ↔ crouched, crouched → prone, prone → crouched, prone → upright). Is it a direct transition or crouched-then-prone (2 + 2)? design.md also names Agility for stance changes; tactical-actions gives no Agility term.
33. **Resolved (design eb072a2):** Tactical actions is the single source for every cost and its modifiers; the GDD's extra attribute terms are removed. TAC-040 / TAC-041 / TAC-042: design.md says Marksmanship and weapon ergonomics lower reload and aim costs and Agility speeds up swaps; its attribute table adds Agility (minor) to reload and Marksmanship and ergonomics to swaps. tactical-actions has no ergonomics term for aiming, no Agility term for reload and no Marksmanship/ergonomics term for swaps. Spec follows tactical-actions; confirm.
34. **Resolved (design eb072a2):** no handedness — the worse arm counts; arms add no AP to aim, reload or throw (they widen cone and scatter); pain adds +1 AP per aim step; each aim step multiplies spread by 0.85 (3 steps ≈ −39%). TAC-040 / TAC-043: "aiming arm" and "throwing arm" are undefined (handedness?). Do a wounded aiming arm and pain stack (+2 per step), or is it +1 if either applies? Does the 15% spread reduction per aim step add up (3 steps = −45%) or multiply (×0.85³)?
35. **Resolved (design eb072a2):** arm wounds no longer change reload cost; a tube reload can be partial (any number of shells) and its modifiers apply once per reload; the item list now gives a feed type per weapon (DAT-011). TAC-041: "wounded arm" — either arm or a specific one? For tube-fed weapons (2 AP per shell), do the Marksmanship, ergonomics, backpack and wound terms apply per shell or once per reload; can a reload be partial? The item list gives no feed type per weapon (box magazine vs belt for LMGs; stripper clip, bolt-action or box magazine for bolt rifles), so `feedType` must be assigned in content.
36. **Resolved (design 3aac08f):** the override replaces only the weapon-type default; the burst length is the weapon's own mode (TAC-039, DAT-012). **Resolved (design eb072a2):** a burst or auto mode with fewer rounds loaded fires what is left at the full AP cost (part). Still open: the override semantics, burst modes other than 3, and the type list. TAC-039: does a per-weapon `fireApCost` override replace only the weapon-type default (spec: yes; burst/auto and ergonomics modifiers still apply) or the final cost? Are burst modes other than 3 rounds allowed? What happens when a burst or auto mode is fired with fewer rounds loaded than it fires? The type list names only bolt-action sniper rifles.
37. **Resolved (design eb072a2):** the weapon-over-6-kg swap surcharge is removed. TAC-042: "weapon over 6 kg" — the weapon being readied, the one put away, or either; base or effective weight (with mods)?
38. **Resolved (design 3aac08f):** no — only wounded or disabled legs lower max stamina (TAC-009). **Resolved (design eb072a2):** a leg fracture multiplies the base tile cost on its own, whatever the leg's HP, and stacks with a disabled leg (×3) (part). Still open: whether a fractured leg above 50% HP lowers max stamina (spec: no). TAC-029 / TAC-062 / TAC-009: "a leg fracture then multiplies the whole tile cost by 1.5" — does the multiplier apply only to a leg that is also wounded (below 50%), or to any fractured leg (spec)? Does a fractured limb above 50% HP count as wounded for max stamina?
39. **Resolved (design eb072a2):** one order for every cost: multipliers on the base cost first, then additive surcharges, then round down, never below 1 AP (the spec's old additive-first order is replaced). TAC-024: the design states multiplier-after-additives only for the leg fracture ("whole tile cost"); the spec applies it to every action (e.g. reload arm fracture ×1.5 after the backpack +4). Confirm.
40. **Resolved (design eb072a2):** 3 AP once per side; the contents then stay visible to the whole side. TAC-070: is the 3 AP open/search cost paid once per container or body per battle, or per soldier or visit? Are its contents then shown to the whole side?
41. **Resolved (design 3aac08f):** no vaulting while carrying or dragging; put the body down first (TAC-074). **Resolved (design eb072a2):** lift only from an adjacent tile; wounded or dead squadmates, enemies and a restrained VIP can be moved; the body and its gear count toward encumbrance (carrying fails over carry capacity, dragging always works); no dragging prone (part). Still open: whether a carrier may vault. TAC-074: the spec requires the carrier to be adjacent (not stated). Can dead squadmates, enemies or a restrained VIP be carried or dragged? Does the carried soldier's weight count toward the carrier's encumbrance? Can a carrier vault, and can a soldier drag while prone?
42. **Resolved (design eb072a2):** yes — a soldier already on an exit tile may leave at the start of its activation without moving. TAC-038: "end the move on an exit tile" — may a soldier who starts an activation on an exit tile leave without moving?
43. **Resolved (design 75e776f):** a neutral that turns hostile joins the turn order as a third side with its own activation after the opponent, driven by tactical-ai (TAC-001, TAC-005); before that it only reacts. TAC-001: once a neutral unit turns hostile, does it start to activate (and in whose slot), or does it keep only reacting? How are its reactions chosen without an activation (a fixed rule, or a tactical-ai call mid-move), what triggers them (a shot nearby, an enemy entering its cone), do they cost stamina, and what is "flee" (move away, leave the map)?
44. **Resolved (design 75e776f):** yes, a disabled leg lowers max stamina by 1 like a wounded leg (TAC-009). TAC-009 / TAC-029: does a disabled leg (0 HP) still lower max stamina by 1 like a wounded leg? Spec: yes (0 HP is below 50%).
45. **Resolved (design 75e776f):** the excess of the disabling hit is spread too; shares round down; armour is checked only at the zone hit (TAC-059). TAC-059: is the excess of the hit that brings a limb to 0 HP also redistributed, or only later hits on the disabled limb (spec)? Are the shares rounded down (spec), and does helmet or body armour apply to a redistributed share (spec: no, armour is checked once at the hit zone)?
46. **Resolved (design 75e776f):** a prone reactor stays prone; a reaction move never triggers reactions (TAC-023). TAC-023: Take cover — does an already prone reactor stay prone (spec), and can the move into cover trigger reactions from others?
47. **Resolved (design 75e776f):** overwatch ends early when suppressed or with too few rounds for the fire mode (TAC-075). TAC-075: does overwatch end early (when the soldier is suppressed, changes the reaction setting, or has too few rounds for the mode)? Spec: it lasts until the next activation regardless.
48. **Resolved (design 75e776f):** a VIP is captured once carried off the map by the player's side; cargo is saved when it leaves the map, carried or in a convoy vehicle (TAC-076). TAC-076: is a VIP "captured" when restrained (spec) or only once carried off the map? What is the tactical condition for "cargo saved" (cargo carried off the map, or the convoy's vehicles leaving)?
49. **Resolved (design 75e776f):** scatter 1 tile + 1 per 10 tiles thrown; blast split by silhouette share; full cover blocks, half cover halves (TAC-043, TAC-079). TAC-043 / TAC-079: base landing scatter of a throw, which body zones a blast hits, and what counts as "solid cover" against a blast (full cover only, or half cover too)?
50. **Resolved (design 75e776f):** confirmed: the player can stop the automatic advance by activating a soldier (TAC-013). TAC-013: the stall rule's "a soldier acts" — spec reads it as a side's controller activating a soldier during the automatic advance (so the player can interrupt it). Confirm.
51. **Resolved (design 75e776f):** the design now has a tactical map generation passage (TAC-086..TAC-093). TAC-080: the tactical map generation stages (terrain layout, roads, prefab placement, cover scatter, spawns and objective placement, playability checks) and their rules are not in the design; `data/mapgen/tactical.json` has slots for them but no TAC rule to check them against. Needs a design passage on tactical map generation.
52. **Resolved (design 75e776f):** every request exit is placed; the generator adds plain exits up to the count (TAC-080, TAC-087). TAC-080 / TAC-038: the tactical map request may list `exits[]` (with conditions the strategic layer knows of, e.g. a boat or a paid crossing) and the generator places 2–4 exits from `data/mapgen/tactical.json`. Which wins: are the request's exits all the map's exits, does the generator add exits up to the count, or does it ignore them?
53. **Resolved (design 3aac08f):** confirmed: the shooter's own tile never counts (TAC-082). TAC-082: does the line of fire "pass through" obscuring terrain when only the shooter's own tile is obscuring (spec: no — only tiles after the shooter's tile and the target's tile count)?
54. **Resolved (design 3aac08f):** large = 3+ floors plus warehouses and plant halls; the stairwell is next to the main entrance (TAC-088). TAC-088: which building kinds are "large" is left to data (`largeBuildingKinds`); where the roof stairwell sits in the floor plan is not stated.
55. **Resolved (design 3aac08f):** no — only edges with no full cover between them and the blast point are hit (TAC-085). TAC-085: does a frag blast damage an edge on the far side of full cover (spec: an edge is hit if it lies within the radius, whatever is between)?
56. **Resolved (design 3aac08f):** red dot 0.8, 4× scope 0.5, sniper scope 0.3, laser 0.8 (ITM-033). TAC-044: the optic (`shooterSpreadAtRange`) and laser (`snapShotSpread`) modifiers multiply; their values per item are not in the item list.
57. TAC-020 / TAC-022: when the trigger is a visible action in place (firing, reloading, using an item), the modifiers written for a mover (stance, sprint, noise from Recon) — do they use the acting soldier as the "mover"? The spec reads it that way; the design does not say.

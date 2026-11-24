# Interface changelog

Every change to a schema in `spec/interfaces/` bumps its `version` (semver: major = breaking) and gets a
line here. Each module and tool that uses the interface updates in its own session.

| Date | Interface | Version | Change | Affects |
| --- | --- | --- | --- | --- |
| 2026-11-24 | data/terrain | 0.5.0 | Cleanup 4: `blocksSight` flag (TAC-016) | tactical, tools |
| 2026-11-24 | data/mapgen-tactical | 0.5.0 | Cleanup 4: typed sub-objects zones, water, roads, buildings, parcels, groundFill, details, deployment (TAC-087, TAC-088) | tactical, tools |
| 2026-11-24 | strategic_perception_view | 0.10.0 | Cleanup 3: `patronRelations` (the patron's relations, for factions whose patron is on the map); `mapShape` hex uses axial `x`, `y` | strategic, strategic-ai |
| 2026-11-24 | management_requests | 0.10.0 | Cleanup 3: `dailyRollover.krugMarkets` (Krug market tile IDs whose prices move, MGT-040) | strategic, management |
| 2026-11-24 | data/recruitment | 0.7.0 | Cleanup 3: `priceFormula` typed `{ spread }` (0–1, not set) | management |
| 2026-11-24 | data/ai-doctrines | 0.8.0 | Cleanup 3 (description): where each personality value enters (SAI-010) | strategic-ai |
| 2026-11-24 | data/tactical-rules | 0.10.0 | Cleanup 3: `bodyWeightKg` (TAC-074, not set) | tactical, tools |
| 2026-11-24 | data/items | 0.10.0 | Cleanup 3: `opEffect.apCost` for `cutLock`, the one field for the bolt cutter AP cost (ITM-026, TAC-071) | tactical, tools, management |
| 2026-11-24 | management_requests | 0.9.0 | Cleanup 2: payloads for hire, localRecruits, trade, barter, vehicleTrade, handIn, hospital, repair, refuel, buyFob, opReturn (MGT-076); `$defs/itemRef`; `reputationAct` `faction`/`count`; results `amountUsd`, `soldierId` | strategic, management |
| 2026-11-24 | battle_result | 0.5.0 | Cleanup 2: `acts[].type` enum (battle subset of repActs), `faction` x-ref, `count` ≥ 1; `skillUse[]` = `{skill, uses}` | tactical, strategic, management |
| 2026-11-24 | strategic_perception_view | 0.9.0 | Cleanup 2: required `mapShape`; `recruitsAvailable`; `knownSquads.id` (required with faction, region), `knownTarget`; `knownRegions.roadTo`, `roadCrossing` | strategic, strategic-ai |
| 2026-11-24 | strategic_commands | 0.8.0 | Cleanup 2 (descriptions): an action for a squad in transit cancels its move; `attack.target` names a `knownSquads` id | strategic, strategic-ai |
| 2026-11-24 | tactical_perception_view | 0.8.0 | Cleanup 2: typed `pos`, `tile`, `itemInstance`, `equipment`, `magazines`; `zoneHp` zone → `{hp, max}`; `activeWeapon`, `leftMap`; `squad[]` lists every unit; move entries carry `path`; `battleGoal.goal` enum | tactical, tactical-ai |
| 2026-11-24 | tactical_commands | 0.7.0 | Cleanup 2: exactly one command per call; `move.path` typed, may be the destination only | tactical-ai, tactical |
| 2026-11-24 | tactical_map_request | 0.10.0 | Cleanup 2: `battleGoal.goal` enum attack/defend/escort/reachExit/hold | strategic, tactical |
| 2026-11-24 | data/ai-doctrines | 0.7.0 | Cleanup 2: `commitmentBonus`, `gainTerms`, `escortAccept` (+ `threshold`) typed; `$defs/curve` (linear/step); consideration requires weight and curve; `roles` typed (`byWeaponType`, `fitBonus`, `claimTurns`); `logTopN` ≥ 1 | strategic-ai, tactical-ai, tools |
| 2026-11-24 | data/traders | 0.5.0 | Cleanup 2: `traders[]` typed (`id`, `faction`, `locationKind`, `stockByStanding {basic, military, best}`) | management, tools |
| 2026-11-24 | management_requests | 0.8.0 | Cleanup: new `moraleChange` (`moraleChanges [{soldier, delta}]`); per-type payload fields for MGT-076 (`hpLost`, `modifierId`, `target`, `factor`, `regions`); `launchOp.fobId`; stale `feesUsd` and contractOffer-version text fixed | strategic, management |
| 2026-11-24 | management_view | 0.3.0 | Cleanup: required `roster` (`$defs/soldier`: id, status, rank, morale, attributes, nerve, wounds, equipment, perks); `funds.debtsUsd` required (0 when none) | management, strategic |
| 2026-11-24 | strategic_perception_view | 0.8.0 | Cleanup: typed `vips`, `contracts` (`role` employer/contractor, `contractor`, per-mission `status`), `contractOffers` (local copy of `contractOffer`), `events` (STR-050 instance); `$defs/timestamp` | strategic, strategic-ai |
| 2026-11-24 | strategic_commands | 0.7.0 | Cleanup: typed `log` items (`$defs/logEntry`); one action plus one assignment per squad, first wins (SAI-004, STR-021) | strategic-ai, strategic, tools (Test Lab, cross-sim) |
| 2026-11-24 | tactical_map_request | 0.9.0 | Cleanup: `units[].perks` (perk IDs, TAC-096); `acceptableLoss` description fixed (dead or left the map) | strategic, tactical, management |
| 2026-11-24 | tactical_perception_view | 0.7.0 | Cleanup: typed `squadPlan`, `blackboard`, `knownNeutrals`; role enum; `allowedActions[].unit` for activate; new `rejection` | tactical, tactical-ai |
| 2026-11-24 | tactical_commands | 0.6.0 | Cleanup: typed `blackboardWrites` (add/remove request or claim, setPlan) and `log` entries | tactical-ai, tactical |
| 2026-11-24 | data/ai-doctrines | 0.5.0 | Cleanup: `considerations` entries typed `{weight, curve {type, points}}`; per-goal entries use flat dotted names | tactical-ai, strategic-ai, tools |
| 2026-11-24 | data/poi | 0.7.0 | Cleanup: `dailyOutput` typed `{items [{item, count}], amountUsd}` | strategic, tools |
| 2026-11-24 | data/management-rules | 0.9.0 | Cleanup: `snapShotPenaltyMoa` description names TAC-023 and TAC-044 (text only) | management, tactical |
| 2026-11-24 | management_requests | 0.7.0 | `launchOp.hiredPilot` removed: a hired pilot is a roster soldier listed in `soldiers` (MGT-005) | strategic, management |
| 2026-11-24 | data/strategic-rules | 0.7.0 | New `actionHours.brokerCeasefire` (STR-099, not set) | strategic |
| 2026-11-24 | data/events | 0.7.0 | `params.shortageMoveFactor` dropped: a fuel shortage only doubles fuel prices (STR-062) | strategic |
| 2026-11-24 | data/items | 0.9.0 | Muzzle `modifiers.flash` removed; muzzle mods may carry `ergonomics` (DAT-016) | tools (item editor), tactical |
| 2026-11-24 | data/tactical-rules | 0.9.0 | `moraleCasualty` drafts in the description (10 / 3 / 3 / 1, line of sight or same squad, TAC-095) | tactical |
| 2026-11-24 | data/management-rules | 0.8.0 | `weaponRepair.conditionPerHourPer10Technical` (draft 2; DAT-014, MGT-067) | management |
| 2026-11-24 | data/economy-rules | 0.5.0 | `vehicleUpkeepPerDayFraction` removed: no vehicle upkeep (MGT-073) | management, strategic |
| 2026-11-24 | data/recruitment | 0.6.0 | `hiredPilotFeePerOpUsd` removed (MGT-005) | management |
| 2026-11-24 | tactical_map_request | 0.8.0 | **Breaking:** `units[].rank` integer → enum recruit/regular/veteran/elite; new `units[].morale`; `sides[].morale` only a fallback; `attributes` lists all eight; `equipment` slots include `holster` | strategic, tactical, tactical-ai |
| 2026-11-24 | battle_result | 0.4.0 | `soldiers[].morale` (end of battle, without Leadership); `squadMorale` = average of surviving player soldiers; holster in returned equipment | tactical, strategic, management |
| 2026-11-24 | tactical_perception_view | 0.6.0 | `squad[].rank` enum; `squad[].morale` (battle morale + Leadership); `squadMorale` = side average | tactical, tactical-ai |
| 2026-11-24 | tactical_commands | 0.5.0 | `swapWeapon.slot` (weapon1, weapon2, holster) | tactical, tactical-ai |
| 2026-11-24 | strategic_perception_view | 0.7.0 | Optional `overdraft` (scoreTerm test mode); no view for civilians or influences | strategic, strategic-ai |
| 2026-11-24 | management_requests | 0.6.0 | New `launchOp` (fees by rank, hired pilot, insurance premium; `ok:false` = no launch); `repayDebt` and `repayment` removed | strategic, management |
| 2026-11-24 | data/tactical-rules | 0.8.0 | `moraleFlight {chance, nerveDivisor}`; `moraleCasualty` (not set) | tools, tactical |
| 2026-11-24 | data/strategic-rules, factions, poi, events | 0.6.0 | Reformed ceasefire days, `losing` test; Krug `resentment`, influence `backs`, rogue-chance factors; poi `military`, `supplyOutput` integer; event params for effect sizes, compensation and bounty prices | tools, strategic, management |
| 2026-11-24 | data/items | 0.8.0 | Belt requires `maxMagazines/maxGrenades/maxMedical/maxOther`; mod `fits` non-empty; barter `refuelUnits`; modifier ranges | tools, tactical, management |
| 2026-11-24 | data/recruitment, economy-rules, management-rules, traders, presentation | 0.5.0, 0.4.0, 0.7.0, 0.4.0, 0.5.0 | `salaryPerDayUsd` → `feePerOpUsd`, no renewals or non-payment, `hiredPilotFeePerOpUsd`; FOB upkeep removed; `leadershipBonus`, perk effects, `nerve.effectDivisor`, `fobPrices`; gear buy rates; tier detection test | tools, management, tactical, game |
| 2026-11-24 | strategic_perception_view | 0.6.0 | `escortRequests` for the Krug (SAI-017); views also for spawned factions (resistance, rogue PMC) | strategic, strategic-ai |
| 2026-11-24 | strategic_commands | 0.6.0 | `answerEscort` (requestId, accept, squad); `hireEscort.route`; `contractOffer.reputationGain` deprecated (MGT-056 derives the gain per mission) | strategic, strategic-ai |
| 2026-11-24 | management_requests | 0.5.0 | `repayDebt`; `contractEnded` reason `taken`; `fate: returned`; `missionKey`, `outcomeReason: rivalFirst`; result `repayment`; `contaminationTick` (STR-097), `capitalIncome` (STR-007) | strategic, management |
| 2026-11-24 | management_view | 0.2.0 | Contract `disowned`; endReason `taken`/`allFailed`; mission `key` and `pay`; `balanceUsd` ≥ 0 | management, strategic |
| 2026-11-24 | data/strategic-rules | 0.5.0 | Capital bonus income, campaign endings, coup terms, new-faction funds, raise squad, heli fire, contamination; evade, Krug pass/escort prices structured; `roadVisibility` removed; `krugPassPrice` → `krugPassPricePerSoldierUsd` | tools, strategic |
| 2026-11-24 | data/factions, poi, events, missions | 0.5.0, 0.5.0, 0.5.0, 0.3.0 | Records closed; kind `resistance`; typed leader effects, unlocks, start relations, rogue chance, `rogueDoctrine`; poi `name`, `mineralModifierMax`; events `text`, structured durations; missions `success.cargoShare`, `handoverHours` | tools, strategic, strategic-ai, management |
| 2026-11-24 | data/vehicles, strategic-terrain, ai-doctrines | 0.4.0, 0.2.0, 0.4.0 | Vehicle `profile` removed; `armourCockpitOnly`, `mineBlastFactor`, `healWhileTravellingFactor`; terrain visibility applies on roads; doctrine `escortAccept` | tools, strategic, strategic-ai |
| 2026-11-24 | data/items | 0.7.0 | Magazine mod slot removed; tactical mods accept small modifiers; `nightVisionMount` removed; belt `maxMagazines/maxGrenades/maxMedical/maxOther`; `valueUsd` is the trader price (ITM-034) | tools, tactical, management |
| 2026-11-24 | data/management-rules, economy-rules, recruitment, traders | 0.6.0, 0.3.0, 0.4.0, 0.3.0 | Draft fields typed; reputation by pay band, supply sales, perk thresholds, service prices, score weights; vehicle and FOB upkeep; typed tiers and pools; Krug price fluctuation | tools, management, strategic |
| 2026-11-24 | data/loot, callsigns, presets, presentation | 0.3.0, 0.3.0, 0.4.0, 0.4.0 | Typed rarity weights and location tags; typed deeds; preset morale and tier; colour levels, vertex snap grid, fog start, reference devices, quality tiers | tools, management, game |
| 2026-11-24 | tactical_perception_view | 0.5.0 | `squad[].weaponJammed` (TAC-083); `allowedActions[].targets[].concealed` (TAC-082); `map.tiles` text: impassable and obscuring flags, door state (TAC-084) | tactical, tactical-ai |
| 2026-11-24 | tactical_map_request | 0.7.0 | `vipControl` (`ai` / `player`, TAI-018) | strategic, tactical, tactical-ai |
| 2026-11-24 | data/tactical-rules | 0.7.0 | `neutralReactRadiusTiles` (TAC-001), `commandRetries` (TAI-005), `encumbranceStrengthDivisor` replaces `encumbranceStrengthReduction` (TAC-027); `burstRounds` removed (burst length is the weapon's own mode) | tools, tactical, tactical-ai |
| 2026-11-24 | data/management-rules | 0.5.1 | `carryCapacity` fields `base`, `strength`, `endurance` (MGT-029) | tools, management, tactical |
| 2026-11-24 | tactical_map_request | 0.6.0 | `region.settlement`, `region.crossing`, `region.neighbours`, `region.roads[]`, `region.approachSide` for the map type and stages (TAC-086/TAC-087); exits text: request exits are all placed, generation fills up | strategic, tactical |
| 2026-11-24 | tactical_commands | 0.4.0 | New command types `closeDoor` (with `edge`, TAC-084) and `clearJam` (TAC-083) | tactical, tactical-ai |
| 2026-11-24 | data/tactical-rules | 0.6.0 | Sight, spotting, concealment, blinding, reaction modifiers, shooter spread, recoil, cone, preview, stun, pain, bleeding, fracture, armour wear (`armourWear` replaces `durabilityLossPerHit`), grenade distance/scatter/blast, jam and clear-jam, doors, material HP and edge blast; drafted values in descriptions | tools, tactical |
| 2026-11-24 | data/mapgen-tactical | 0.4.0 | Map types, designed stages (zones, water, roads, buildings, parcels, groundFill, details, deployment), `largeBuildingKinds`, `lockedDoorShare`, exit spacing and width, checks; optional containers and landmarks; `pipeline`, `terrain`, `cover`, `spawns` slots removed | tools, tactical |
| 2026-11-24 | data/terrain | 0.4.0 | `impassable` (TAC-029), `obscuring` (TAC-082) | tools, tactical |
| 2026-11-24 | data/items | 0.6.0 | Ammo `recoilSpreadModifier`; body armour `coversZones` (unused yet); laser `snapShotSpread` modifier on tactical mods | tools, tactical |
| 2026-11-23 | tactical_map_request | 0.5.0 | `region.biome` (STR-095/TAC-080); `exits[].id` required; objective types `killVip`, `captureVip`, `destroyTarget`, `saveCargo` (TAC-076); per-unit `battleGoal` override (TAI-018); stale acceptableLoss text removed | strategic, tactical, tactical-ai |
| 2026-11-23 | tactical_perception_view | 0.4.0 | `squadMorale`; enemy `facing`/`level`; map tiles, exits, containers, bodies, smoke; structured `allowedActions` with shot previews; no query functions (TAI-001) | tactical, tactical-ai |
| 2026-11-23 | tactical_commands | 0.3.1 | Field descriptions per command type; no `takeCover` command (TAI-005) | tactical, tactical-ai |
| 2026-11-23 | battle_result | 0.3.1 | `exitId` documented as the map exit id (TAC-038/TAC-080) | tactical, strategic, management |
| 2026-11-23 | strategic_commands | 0.5.0 | `contractOffer`: `id`, `targetFaction`, `reputationGain`, `reputationGate {better, sensitive}`, per-mission `key`, `intelLevel` enum, required deadline; consumer only modules/strategic | strategic, strategic-ai |
| 2026-11-23 | strategic_perception_view | 0.5.0 | `ownSquads.transit` object replaces `inTransit`; `ownSquads.vehicle` (null = on foot); own-region loyalty per faction; `krugMarket` tile flag; terrain x-ref strategic-terrain | strategic, strategic-ai |
| 2026-11-23 | management_requests | 0.4.0 | New `contractOffer` request (local copy of the offer); `fate`, `outcome`, `plantId`, `fobId`, `day`; `act` enum of repActs keys | strategic, management |
| 2026-11-23 | management_view | 0.1.0 | New: Management → Strategic view of reputation (value, standing), contracts with status, funds (MGT-072) | management, strategic |
| 2026-11-23 | data/strategic-terrain | 0.1.0 | New table: strategic terrain → move hours, visibility, biome, tactical terrain and prefab tables (STR-095) | tools, strategic, tactical |
| 2026-11-23 | data/tactical-rules | 0.5.0 | `minDamageShare` removed (`falloffFloor`); encumbrance Strength reduction, grenade scatter, blast shares/cover, morale flight, mines, weapon wear/jam/spread fields; recoilControl → TAC-047 | tools, tactical |
| 2026-11-23 | data/mapgen-tactical, terrain, prefabs | 0.3.0 | Exits with `id` and `exitCount`; terrain and prefab records list their `tables` (TAC-080) | tools, tactical |
| 2026-11-23 | data/strategic-rules | 0.4.0 | `moveHours`, `terrainVisibility` → strategic-terrain; `battleHours` removed (TAC-003); `roadMoveHours`, `onFootHours`, `supplyDeficitEffect`, `scoutSuccess`, `scatterShares`, `coup`, heli values; explicit nested keys | tools, strategic |
| 2026-11-23 | data/vehicles, poi, mapgen-strategic, factions, events | 0.3.0, 0.4.0, 0.4.0, 0.4.0, 0.4.0 | Vehicle heli constants removed, armourClass nullable; `krugMarketAllowed`, no krugMarket service; `krugMarkets` placement; `leaderEffect`, `standingUnlocks`; `params` names | tools, strategic, strategic-ai |
| 2026-11-23 | data/ai-doctrines | 0.3.0 | `factions` dropped (`factions.doctrine` wins); `personality`, `commitmentBonus`, `gainTerms` | tools, strategic-ai |
| 2026-11-23 | data/items | 0.5.0 | Weapon `feedType` required; medical and magazine require `weightKg`; mod `modifiers` keys per slot; `checkpointPass` effect removed | tools, tactical, management |
| 2026-11-23 | data/management-rules, recruitment, presets, presentation | 0.5.0, 0.3.0, 0.3.0, 0.3.0 | `weightPenalty` removed; `lowRiskContract`, `weaponRepair`, `scavLoadout {items, priceUsd}`; `salaryIntervalHours` removed, `nonPayment`; presets `priceUsd` removed; presentation constants named | tools, management, game |
| 2026-11-23 | tactical_map_request | 0.4.0 | Per-unit `rank` and `controller`; neutral role described; `acceptableLoss` as a 0–1 share; encounter tile terrain and `road` | strategic, tactical, tactical-ai |
| 2026-11-23 | battle_result | 0.3.0 | Objectives carry `metTurn` (TAC-076) | tactical, strategic, management |
| 2026-11-23 | tactical_perception_view | 0.3.0 | Unit `rank`, limb states, `overwatch`, `alerted`, `outOfAction`, `carrying`, `magazines`; enemy gear as the player sees it | tactical, tactical-ai |
| 2026-11-23 | tactical_commands | 0.3.0 | `holdOverwatch`, `liftBody` (carry/drag), `putDownBody`, `search`, `pickUpBackpack`; reload `magazine` and `shells`; `carry` replaced | tactical, tactical-ai |
| 2026-11-23 | strategic_perception_view | 0.4.0 | Tiles with `x`, `y`, `road`; loyalty per faction on settlements; `capital` state | strategic, strategic-ai |
| 2026-11-23 | strategic_commands | 0.4.0 | `hireEscort` (Krug escort); `toRegion` is an adjacent tile | strategic, strategic-ai |
| 2026-11-23 | management_requests | 0.3.0 | `contractEnded.reason` (incl. employerDefault); `payKrugEscort` | strategic, management |
| 2026-11-23 | data/items | 0.4.0 | New kinds `magazine` and `grenade`; medical `hpPerUse` replaces `hpPerUseMax` | tools, tactical |
| 2026-11-23 | data/tactical-rules | 0.4.0 | Wound, overwatch, suppression and cover fields; `aimSpreadFactor`, `aimPainSurcharge`; swap-weight and arm surcharges removed | tools, tactical |
| 2026-11-23 | data/strategic-rules, mapgen-strategic, factions, poi, events | 0.3.0 | Capital hold days, road entry, Krug escort, loyalty range; `mapShape`, width, height; rogue chance; settlement flag; defection params | tools, strategic |
| 2026-11-23 | data/management-rules, economy-rules | 0.4.0, 0.2.0 | Rival offer rule; `fundsMode` | tools, strategic, management |
| 2026-11-22 | strategic_perception_view | 0.3.0 | Adds own `funds` (STR-092) and other factions' `contractOffers` (SAI-015); one view per faction per hour | strategic, strategic-ai |
| 2026-11-22 | strategic_commands | 0.3.0 | Adds `acceptContract` (contractId, squads); command sets resolve together with the player's | strategic, strategic-ai, management |
| 2026-11-22 | management_requests | 0.2.0 | Adds `contractPayment` and per-request `results` with `paymentDue` (STR-093, MGT-047) | strategic, management |
| 2026-11-22 | tactical_map_request | 0.3.0 | `battleGoal` typed per faction: goal, targets, acceptableLoss | strategic, tactical, tactical-ai |
| 2026-11-22 | battle_result | 0.2.1 | Description only: objectives are final; op success is decided at op level | tactical, strategic, management |
| 2026-11-22 | data/items | 0.3.0 | Weapon `feedType` and `fireApCost` (TAC-039, TAC-041) | tools, tactical |
| 2026-11-22 | data/tactical-rules | 0.3.0 | Draft action costs from Tactical actions; `diagonalSurcharge`, `sprintCost`, `reloadBaseCost`, `swapBaseCost`, `throwBaseCost` replaced | tools, tactical |
| 2026-11-22 | data/management-rules | 0.3.0 | Removes `repSpillHostile`, `repSpillAllied`, `repPatronFollow`; adds `unfriendlyContractShare`, `unfriendlyPriceMarkup` | tools, management |
| 2026-11-22 | data/economy-rules | 0.1.0 | New shared money formulas for faction funds and the player's PMC (STR-092, MGT-005, MGT-070) | tools, strategic, management |
| 2026-11-22 | tactical_map_request | 0.2.0 | Fields from the first split: seed, rulesVersion, time, region, sides with units, hostility, objectives, battleGoal, exits, vip | tactical, strategic |
| 2026-11-22 | battle_result | 0.2.0 | Fields from the first split: outcome, objectives, soldiers (status, wounds, equipment, skill use, kills), loot, casualties, acts, witnesses, vip, poiControl, flags | tactical, strategic, management |
| 2026-11-22 | tactical_perception_view | 0.2.0 | Fields from the first split: squad, blackboard, known enemies and noises, map, allowed actions, battle goal | tactical, tactical-ai |
| 2026-11-22 | tactical_commands | 0.2.0 | Command set (same as the player's), blackboard writes, decision log | tactical, tactical-ai |
| 2026-11-22 | strategic_perception_view | 0.2.0 | Fields from the first split: own and known regions and squads, VIPs, relations, reputation, contracts, events, crisis signs | strategic, strategic-ai |
| 2026-11-22 | strategic_commands | 0.2.0 | Command set incl. contract offers, decision log | strategic, strategic-ai, management |
| 2026-11-22 | management_requests | 0.1.0 | New: strategic → management requests (services, op return, plant output, daily rollover, reputation acts) | strategic, management |
| 2026-11-22 | data/* | 0.2.0 | items schema complete (DAT/ITM); 12 new tables (vehicles, factions, poi, events, tactical/strategic/management rules, callsigns, recruitment, traders, loot, presentation); field lists for the rest | tools, all modules |
| 2026-11-22 | all | 0.1.0 | Skeletons created | — |

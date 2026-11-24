# Interface changelog

Every change to a schema in `spec/interfaces/` bumps its `version` (semver: major = breaking) and gets a
line here. Each module and tool that uses the interface updates in its own session.

| Date | Interface | Version | Change | Affects |
| --- | --- | --- | --- | --- |
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

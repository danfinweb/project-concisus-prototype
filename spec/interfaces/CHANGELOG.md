# Interface changelog

Every change to a schema in `spec/interfaces/` bumps its `version` (semver: major = breaking) and gets a
line here. Each module and tool that uses the interface updates in its own session.

| Date | Interface | Version | Change | Affects |
| --- | --- | --- | --- | --- |
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

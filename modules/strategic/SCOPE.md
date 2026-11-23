# Strategic Layer — scope

Refreshed by `/scope` (2026-11-23, spec baseline `931ee45`, design `eb072a2`). Lists everything this
module may read outside its folder.

## Spec IDs

Source: `spec/strategic.md` (area STR, 94 IDs, all mapped to `modules/strategic` in `spec/_index.md`).
`(open)` = the design leaves a value or rule unset; build with the draft values or a stub and flag it.
`(optional)` = later build or switchable feature.

**Time**

| ID | Summary |
| --- | --- |
| STR-001 | World clock `{ day, hour }`, whole hours only; Day 1 at `startHour`; every timestamp is a clock value |
| STR-002 | Every action has a duration `d` ≥ 0 h; `d = 0` resolves at once; multi-hour actions can be interrupted or cancelled, hours spent count |
| STR-003 | (open) Hour tick: planning, then resolution (AI views → all actions together → arrivals, encounters → clock → daily checks → expiry); `factionTickOrder` not set |
| STR-004 | Daily checks at 00:00: crisis signs/measures, event check, plant output, `dailyRollover` to MGT |

**Map**

| ID | Summary |
| --- | --- |
| STR-005 | Tile grid, one tile = one region; `mapShape` square (hex test option); tile fields incl. road, loyalty, flags |
| STR-006 | Move hours by destination terrain and mode; a road between the tiles overrides terrain; water only via bridge/ford |
| STR-007 | (open) One capital with `holder` apart from `controller`; can fall and be contested; held `capitalHoldDays` → new holder |
| STR-008 | (open) Fog of war per faction: visible within `reconRange`, else last known state; noise range notices squads |
| STR-009 | (open) Civilian loyalty only on settlement tiles, per faction −100…100; `loyaltyStart` not set |
| STR-010 | POI types, what they provide, and their `services` list; ruined POIs offer nothing |
| STR-011 | (open) Mineral plants multiply other plants' output; `mineralModifier` not set |
| STR-012 | Krug market tiles are no-fire zones; starting a fight there turns the Krug hostile |
| STR-013 | (optional) Hidden cities: no road, helicopter only, high-output complex, prototype items |
| STR-014 | (open) Control of a POI follows its region; income/supply/recruits to the controller; outputs not set |
| STR-015 | (open) Stationed PMC squad holds a plant; daily `plantOutput` to the nearest PMC FOB; `stationHours` not set |
| STR-016 | FOB map entity `{ id, regionId, owner }`; visibility source; raids are tactical defence engagements |

**Squads and simulation**

| ID | Summary |
| --- | --- |
| STR-017 | Squad record (region, vehicle or on foot, soldiers, supplies, fuel, morale, goal, transit); player squad = its vehicle |
| STR-018 | Non-player squads hold one goal (patrol, supplyRun, attackPoi, holdPoi, escort, tradeRoute, hunt), set only by faction commands |
| STR-019 | (open) Escalation through SAI commands, validated by normal rules; pacing is SAI |
| STR-020 | Every hour every faction issues one command set, each squad one action; a move holds the origin tile until its last hour |
| STR-021 | Controller hand-off: view out, `strategic_commands` in; validate like player actions (incl. funds), drop invalid with a reason |
| STR-022 | Encounter detection per tile after movement; hostility from SAI rules and relations; player → STR-023, else STR-026 |
| STR-023 | Tactical engagement: `tactical_map_request` out, `battle_result` in, always 1 h; results update squads, control, loyalty, MGT |
| STR-024 | (open) Evade an encounter: chance from best Recon and terrain visibility; formula and time not set |
| STR-025 | (open) Pay a Krug squad to pass; price and time not set |
| STR-026 | (open) Off-screen fights auto-resolve (strength, gear, terrain, seeded RNG); formula not set |
| STR-092 | (open) AI faction `funds` live in `world`; income/costs from `data/economy-rules.json`; never below 0; `fundsMode` hardLimit/scoreTerm |
| STR-093 | Contract pay: MGT names `paymentDue`, Strategic deducts from employer funds, sends `contractPayment` next tick; default fails the contract |
| STR-094 | (open) Krug escorts: Krug offers escort contracts and can be paid to escort a convoy; price and hiring not set |

**Operations and strategic actions**

| ID | Summary |
| --- | --- |
| STR-027 | Op lifecycle: ends with success when ≥ 1 soldier reaches a PMC FOB; missions confirmed at once, reported as `missionOutcome` |
| STR-028 | (open) Launch an op at an FOB, squad/loadout/vehicle locked; `launchHours` not set |
| STR-029 | Arrival in a PMC FOB region ends the op; storage and soldiers to MGT (`opReturn`) |
| STR-030 | (open) Lost vehicle stays on the map `abandoned`; destroy/capture/recover rules not set |
| STR-031 | Move one tile on foot in `moveHours[terrain].foot`, no fuel |
| STR-032 | (open) Move by ground vehicle; off-road reduction (not set); 1 fuel per tile; rejected if fuel < 1 |
| STR-033 | (open) Civilian vs military vehicle profile at checkpoints; modifier not set |
| STR-034 | (open) Helicopter: any adjacent tile in 1 h, 1 fuel, pilot Technical ≥ 50; noticed in noise range; POI fire effect not set |
| STR-035 | (open) Land a helicopter on any non-water tile; only way into hidden cities; `landHours` not set |
| STR-036 | (open) Scout for `scoutHours` (placeholder 3): reveals the tile, squads, loot hints, VIP intel; success chance not set |
| STR-037 | Stand by `n` hours (replaces Wait/Rest): healing each tick via MGT, faster at an FOB; "on alert" effect not set |
| STR-038 | (open) Enter a POI before using its services; `enterPoiHours` not set |
| STR-039 | Zero-time trade, hire and vehicle trade forwarded to MGT; Strategic checks only the location's services |
| STR-040 | (open) Accept contract, hand over, hand in: location-bound, forwarded to MGT; durations not set |
| STR-041 | (open) Hospital, repairs, refuel (helicopters only at FOBs and oil plants); durations not set |
| STR-042 | (open) Buy an FOB in a city or take an FOB site by force; creates an FOB entity |
| STR-043 | (open) Pay compensation or a bounty pay-off through MGT; ends the event's effect toward the player |
| STR-044 | Contract postings from faction commands and events go to MGT as `contractOffer` (goal, missions, deadline, gate) |

**VIPs**

| ID | Summary |
| --- | --- |
| STR-045 | VIP `{ id, faction, rank, regionId, guardSquadIds }`; travels with its guard; leader stays in capital or largest city |
| STR-046 | Guard squads and rank mix per VIP rank; "mostly"/"with" shares not set |
| STR-047 | VIP death morale shock: radius by VIP rank, loss by squad rank (Elite 40 … Recruit 5) |
| STR-048 | VIP intel valid `vipIntelHours` (72): from scouting, loot, Krug barter or purchase with standing gates |
| STR-049 | (open) Leader death dissolves the faction: squads scatter, POIs to `none`, contracts end; scatter split not set |

**World events**

| ID | Summary |
| --- | --- |
| STR-050 | (open) Daily event roll per triggered event; events and measures share `maxConcurrentEvents` (3); per-event chance not set |
| STR-051 | Faction relations per ordered pair −100…100; hostile ≤ −50, allied ≥ 50; no reputation spill-over |
| STR-052 | (open) Warned events schedule discoverable warning signs `warningLeadDays` ahead |
| STR-053 | Player ops can trigger events and cancel them via `preventedBy` |
| STR-054 | News feed: every event start/update/end, found warning sign and flavour entry, ordered by time |
| STR-055 | (open) PMC joint assault on a weakly held high-value POI; Varyag↔Aegis relation drops afterwards |
| STR-056 | (open) Weapon shipment convoy to a losing faction; better gear for `shipmentDays` (10) |
| STR-057 | (open) Rising hostility after repeated losses; may target the player at reputation ≤ −30 |
| STR-058 | (open) Operation dispute: uninvolved faction hurt blames someone; `disputeDays` 7–14 |
| STR-059 | (open) Front offensive on a strength advantage; `offensiveDays` 5–10 |
| STR-060 | (open) Local ceasefire flag after heavy SSV and VDK losses; `ceasefireDays` 7 |
| STR-061 | (open) Defection of an undersupplied garrison: joins the pressing faction or disbands |
| STR-062 | (open) Fuel shortage when an oil plant is ruined or cut off: fuel price ×2, less movement |
| STR-063 | (open) Chemical leak after a fight at a chemical plant: `hazard` flag, medical prices up, `leakDays` 5 |
| STR-064 | (open) Bounty on the PMC at reputation ≤ −50 (chance ×2 at ≤ −75): hunt squads |
| STR-065 | (open) Refugee movement when a city changes controller: loyalty shift, cheap recruits, `refugeeDays` 10 |
| STR-066 | Rogue PMC: Varyag or Aegis loses its patron, relation hostile, patron gains crisis sign 9 |
| STR-067 | Resistance group forms at loyalty ≤ −40: 1–3 squads of 3–5 locals, relations set on creation |

**Desperate measures**

| ID | Summary |
| --- | --- |
| STR-068 | Faction history: start regions and key plants, 7-day history of regions and soldiers, player-attributed defeats |
| STR-069 | Ten crisis signs evaluated daily per faction, thresholds in strategic-rules |
| STR-070 | (open) ≥ 3 signs and no measure running → may pick a matching measure (choice SAI); ≥ 5 incl. capital threatened unlocks nuclear strike |
| STR-071 | (open) Forced conscription (SSV, VDK): many weak squads, loyalty drop |
| STR-072 | (open) Penal battalions (SSV): expendable assault squads, some desert to the Krug |
| STR-073 | (open) Open call for help (VDK): Aegis squads, VDK loyalty loss, more contracts |
| STR-074 | (open) Paying any price (SSV, VDK, Krug): contract pay ×2, offers to PMCs it fought |
| STR-075 | (open) Scorched earth (SSV, VDK): plants ruined, bridges and roads removed in tiles about to be lost |
| STR-076 | (open; tactical mines optional) Mining the roads: `mined` flag hazard, cleared by a Technical soldier |
| STR-077 | (open) Martial law (SSV, VDK): `martialLaw` on held cities, checkpoints, curfews, restricted trade |
| STR-078 | Seizing Krug stocks (SSV, VDK): raid Krug markets; Krug turns hostile |
| STR-079 | VIP strike (SSV, VDK): hunt goal against an enemy high-ranking VIP; contracts to Trusted players |
| STR-080 | (open; tactical contamination optional) Nuclear strike: once per campaign, warning signs, convoy, target tile wiped, `contaminated` |
| STR-081 | (open) Flavour events: news-feed only, no world-state change; triggers not set |

**Map generation**

| ID | Summary |
| --- | --- |
| STR-082 | (open) Seeded pipeline land → capital → cities → industry → towns → roads → war state → start → validate; grid size not set |
| STR-083 | (open) Land: elevation and moisture; mountains, rivers, lakes, woods, steppe |
| STR-084 | Capital on low ground by a river, closest to the centre |
| STR-085 | (open) Large and small cities with minimum spacing, near rivers and lowland |
| STR-086 | (open) Plants by resource rules, one POI per tile |
| STR-087 | (open) Towns fill gaps; every city and the capital get an adjacent governmental institution |
| STR-088 | (open) Asphalt spanning network plus loops; dirt roads to towns and plants; bridge/ford flags; gas stations |
| STR-089 | (open) Front line splits SSV and VDK; Varyag, Aegis behind their lines; Krug in the contested belt |
| STR-090 | (open) Player's first FOB ≥ `startFrontDistance` from the front |
| STR-091 | (open) Validation: road reachability, oil and arms per side, start services in range; optional hidden cities |

**Also reads** (rules this module applies or feeds but does not own)

| ID | File | Why strategic reads it |
| --- | --- | --- |
| GEN-001, GEN-002, GEN-003 | `spec/overview.md` | Op as unit of play; op success = one soldier back at an FOB; objective bundling |
| GEN-004, GEN-005, GEN-006 | `spec/overview.md` | Faction roster and IDs; off-map influences; civilian population |
| GEN-007 | `spec/overview.md` | Relation model and thresholds (same values as STR-051) |
| GEN-008 | `spec/overview.md` | (open) Leader effects that touch the map (e.g. Volkov's location as intel) |
| GEN-009 | `spec/overview.md` | Krug markets as no-fire zones (STR-012) |
| GEN-012, GEN-013, GEN-015 | `spec/overview.md` | (open) End states, coup requirements, holding the capital (STR-007) |
| GEN-017, GEN-018 | `spec/overview.md` | (open) Rogue PMC daily roll, warning signs and aftermath (STR-066) |
| MGT-005, MGT-070 | `spec/management.md` | Shared money formulas in `economy-rules`; player money is not in `world` |
| MGT-008 | `spec/management.md` | Squad morale kept in `roster`, final value from the battle result |
| MGT-041..MGT-044, MGT-047, MGT-048 | `spec/management.md` | Contract origin and structure, goal → mission mapping, mission outcome, advance and failure (STR-027, STR-093) |
| MGT-051, MGT-052 | `spec/management.md` | Contract board; rival PMC competition and Krug escort service (STR-094) |
| MGT-053, MGT-054, MGT-064 | `spec/management.md` | Reputation value, standing tiers (encounters, gates, events), attribution |
| MGT-056..MGT-060 | `spec/management.md` | Reputation acts sent as `reputationAct` requests |
| MGT-066, MGT-068, MGT-069 | `spec/management.md` | (open) FOBs, industry deliveries (STR-015), FOB raids (STR-016) |
| DAT-024..DAT-029 | `spec/data.md` | Vehicle profile (seats, storage, fuel range, off-road, noise, profile), features, availability, helicopters, instance state |
| TEC-012, TEC-015 | `spec/tech.md` | Pure rules core; seeded, reproducible randomness |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/tactical_map_request.schema.json` | produces (to tactical) | 0.4.0 |
| `spec/interfaces/strategic_perception_view.schema.json` | produces (to strategic-ai) | 0.4.0 |
| `spec/interfaces/management_requests.schema.json` | produces (to management; reads its `results`) | 0.3.0 |
| `spec/interfaces/battle_result.schema.json` | consumes (from tactical) | 0.3.0 |
| `spec/interfaces/strategic_commands.schema.json` | consumes (from strategic-ai) | 0.4.0 |

Change history: `spec/interfaces/CHANGELOG.md`.

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/strategic-rules.json` | `spec/interfaces/data/strategic-rules.schema.json` | 0.3.0 | All STR constants: clock, move hours, recon/noise, loyalty, relations, VIPs, crisis signs (owned by STR) |
| `data/economy-rules.json` | `spec/interfaces/data/economy-rules.schema.json` | 0.2.0 | Faction funds: start funds, income, upkeep, salaries, booking interval, `fundsMode` (shared with MGT) |
| `data/mapgen/strategic.json` | `spec/interfaces/data/mapgen-strategic.schema.json` | 0.3.0 | Generation stages, `mapShape`, width, height |
| `data/factions.json` | `spec/interfaces/data/factions.schema.json` | 0.3.0 | Faction IDs, kinds, patrons, start relations, measures, doctrine IDs, rogue chance |
| `data/poi.json` | `spec/interfaces/data/poi.schema.json` | 0.3.0 | POI categories, settlement flag, services, income and outputs, mineral modifier |
| `data/events.json` | `spec/interfaces/data/events.schema.json` | 0.3.0 | World events, desperate measures, flavour events |
| `data/vehicles.json` | `spec/interfaces/data/vehicles.schema.json` | 0.2.0 | Seats, storage, fuel range, off-road, noise, profile, features, helicopters |
| `data/missions.json` | `spec/interfaces/data/missions.schema.json` | 0.2.0 | Mission IDs in contract offers (STR-044) |
| `data/presets.json` | `spec/interfaces/data/presets.schema.json` | 0.2.0 | AI unit presets and tiers in `tactical_map_request` |
| `data/items.json` | `spec/interfaces/data/items.schema.json` | 0.4.0 | Intel and faction items (codebook, field orders, checkpoint pass) read from battle results and trades |
| `data/management-rules.json` | `spec/interfaces/data/management-rules.schema.json` | 0.4.0 | Standing thresholds (MGT-054) used by encounters, events and gates |
| `data/terrain.json` | `spec/interfaces/data/terrain.schema.json` | 0.2.0 | Tactical terrain only (TAC-029); kept for the terrain → biome hand-off, see open question 7 |

## State slices

- Owns: `world` — tile grid (terrain, roads, POIs, controllers, loyalty, flags), capital state, clock,
  squads of every faction, FOB entities, VIPs, faction funds (STR-092), relations, faction history, running
  events and measures, warning signs, intel, news feed.
- Reads: `roster` (player soldiers for `tactical_map_request`, squad morale), `reputation` (encounter
  hostility, events, gates, perception views), `contracts` (op objectives, mission checks, payments due).
  Changes to Management slices go out only as `management_requests`; MGT's `results` come back on them.
  `economy` and `unlocks` are not read.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Found while scoping; report to the root session, do not edit `spec/`. The 25 open questions in
`spec/strategic.md` › Open questions still apply.

1. **strategic-rules fields missing or named differently.** The schema is `additionalProperties: false`
   but has no field for `supplyDeficitEffect` (STR-014), `civilianProfileModifier` (STR-033) or
   `scatterShares` (STR-049); `scoutSuccess` (STR-036) names no table. The spec's `launchHours`, `landHours`,
   `stationHours`, `evadeHours`, `krugPassHours`, `buyIntelHours`, … sit in one `actionHours` object;
   `vipGuard`/`vipShockRadius`/`vipMoraleLoss`/`vipIntel*` (STR-046..048) in `vip`; the STR-069 thresholds in
   `crisis`. Confirm the nesting so content and code use one set of names.
2. **Constants with two owners.** Relation range and thresholds: GEN-007 → `data/factions.json`
   (`relation_min`, `hostile_at`, …) vs STR-051 → `data/strategic-rules.json` (`relationMin`, `hostileAt`,
   …). Helicopter: STR-034 `pilotTechnicalMin`/`heliMoveHours` in strategic-rules vs DAT-028
   `pilotTechnicalMin`/`hoursPerRegion` in vehicles. Battle time: STR-023 `battleHours`, TAC-003
   `battleDurationHours`, and `battle_result.gameTimeHours` (const 1).
3. **No `contractOffer` request.** STR-044 sends MGT a `contractOffer`, but `management_requests` 0.3.0 has
   no such type; `strategic_commands` instead lists `modules/management` as a consumer. Also STR-015
   `plantOutput { plantId, fobId, … }` and STR-004 `dailyRollover { day }` use fields the request schema
   lacks (only `location`, `items`, `amountUsd`, `params`).
4. **Goal names differ.** STR-018 and `strategic_commands` use camelCase (`supplyRun`, `attackPoi`,
   `holdPoi`, …); MGT-043 (goal → mission mapping) uses snake_case (`supply_run`, `attack_poi`).
5. **Squads on foot.** STR-017/STR-031 allow `vehicleId | onFoot`, but DAT-025 says a strategic squad has
   exactly one vehicle. Can an op or an AI squad run without a vehicle?
6. **Vehicle field names.** STR-032 `fuelRange` vs `vehicles.fuelRangeRegions`; `offRoad` has
   `ignoresTerrain`, which `offroadReduction[rating]` (STR-032) does not cover. STR-030 `abandoned` vs
   `battle_result.vehicle.state` `leftBehind`.
7. **No strategic terrain table.** `data/terrain.json` is tactical (TAC-029 AP cost, cover material). The
   strategic terrain set of STR-006 (steppe, woods, mountain, water; roads on top) exists only as keys of
   `moveHours`/`terrainVisibility`, and nothing maps it to the tactical biome that
   `tactical_map_request.region.terrain` feeds (STR-022/023).
8. **Tile-grid leftovers.** STR-005 makes region = tile, but "area"/"front sector" (STR-059, STR-060),
   "checkpoints" (STR-033, STR-077, the DAT checkpoint-pass item) and "Krug hub" (STR-055) have no tile
   field, flag or POI category; Krug markets exist only as a `krugMarket` service, not a POI category.
9. **Perception view vs STR.** View `ownSquads.inTransit` vs STR-017 `transit`; `ownRegions.loyalty` is a
   number while STR-009 and `knownRegions.loyalty` hold one value per faction.
10. **Stale interface text.** `tactical_map_request` 0.4.0 still says the unit of `acceptableLoss` is open
    (TAI open question 9) while the field is defined as a 0–1 share.

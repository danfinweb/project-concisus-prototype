# Strategic Layer — scope

Refreshed by `/scope` (2026-11-24, spec baseline `a0210cd` (cleanup), design `c1333f3`). Lists everything this
module may read outside its folder.

## Spec IDs

Source: `spec/strategic.md` (area STR, 99 IDs STR-001…STR-099, all mapped to `modules/strategic` in
`spec/_index.md`; STR-033 removed). `(open)` = the design leaves a value or rule unset; build with the
draft values or a stub and flag it. `(optional)` = later build or switchable feature.

**Time**

| ID | Summary |
| --- | --- |
| STR-001 | World clock `{ day, hour }`, whole hours only; Day 1 at `startHour` (6); every timestamp is a clock value; time passes only on a commit with an action ≥ 1 h |
| STR-002 | Every action has a duration `d` ≥ 0 h; `d = 0` resolves at once; multi-hour actions are interrupted only by what touches the squad, or cancelled at planning; hours spent count; an unfinished move spends no fuel |
| STR-003 | (open) Turn = planning, then hour ticks (views → all actions together → arrivals, encounters, fights → clock → daily checks → expiry) until the first player squad finishes or is interrupted; `factionTickOrder` not set |
| STR-004 | Daily checks at 00:00 in order: crisis signs/measures, events (incl. rogue roll, flavour), plant output and capital income, campaign checks, low-risk contract check, `dailyRollover` to MGT |

**Map**

| ID | Summary |
| --- | --- |
| STR-005 | Tile grid, one tile = one region; `mapShape` square (4 neighbours, no diagonals) or hex test option; tile fields: terrain, poi, controller, road, loyalty, `krugMarket`, flags with expiry |
| STR-006 | Move hours by destination terrain and mode; a road between the tiles overrides terrain; water only via bridge/ford; visibility from the terrain (roads have none) |
| STR-095 | `data/strategic-terrain.json`: per terrain `passable`, `moveHours`, `offRoadRated`, `visibility`, `biome`, tactical terrain and prefab tables; terrain and biome copied into `tactical_map_request.region` |
| STR-007 | Capital `holder` apart from `controller`; can fall and be contested; unbroken hold `capitalHoldDays` (7) → holder; holder gets leader seat and `capitalBonusIncomeUsd` (3000/day) |
| STR-008 | (open) Fog of war per faction: visible within `reconRange` (not set), else last known state; noise range in tiles notices squads |
| STR-009 | (open) Civilian loyalty only on settlement tiles (village = town variant), per faction −100…100; `loyaltyStart` not set |
| STR-010 | POI types, what they provide, `services` list; ruined POIs offer nothing; `military` types fire on helicopters; Krug market = `krugMarket` tile flag, not a POI type |
| STR-011 | Mineral plants multiply other plants' output by `1 + min(0.30, 0.10 × held)` |
| STR-012 | Krug market tiles are no-fire zones; starting a fight there turns the Krug hostile |
| STR-013 | (optional) Hidden cities: no road, helicopter only, high-output complex, prototype items |
| STR-014 | (open) Control of a POI follows its region; per-type `income`, `supplyOutput`, `recruitOutput` drafted; supply shortage when output < soldiers; `supplyDeficitEffect` not set |
| STR-015 | Stationed PMC squad holds a plant; daily `plantOutput` (typed `dailyOutput` items and USD, ×STR-011, rounded down) to the nearest PMC FOB; `actionHours.station` 0; extra `income` open (Q56) |
| STR-016 | FOB map entity `{ id, regionId, owner }`; visibility source; (optional) raids left for later |

**Squads and simulation**

| ID | Summary |
| --- | --- |
| STR-017 | Squad `{ id, faction, regionId, vehicleId \| null, soldiers, supplies, fuel, morale, goal, transit }`; on foot = no vehicle storage, loot only in rigs; player soldier data read from `management_view` `roster`; AI soldiers aggregate (per-soldier data open, Q54) |
| STR-018 | Non-player squads hold one goal (patrol, supplyRun, attackPoi, holdPoi, escort, tradeRoute, hunt), set only by faction commands |
| STR-019 | (open) Escalation through SAI commands, validated by normal rules; pacing is SAI |
| STR-020 | Every hour every faction issues one command set, each squad one action; a move holds the origin tile until its last hour |
| STR-021 | Controller hand-off for every non-player faction (incl. resistance, rogue PMC): view out, `strategic_commands` in (12 command types); validate like player actions incl. funds, drop invalid with a reason; per squad at most one action and one assignment per set, first in list wins |
| STR-022 | Encounter detection per tile after movement; hostility from SAI-013 and relations; Krug markets never hostile; player → STR-023, else STR-026 |
| STR-023 | Tactical engagement: `tactical_map_request` (terrain, biome, settlement, crossing, POI, neighbours, roads, approach side, exits) out, `battle_result` in; duration TAC-003 (1 h) |
| STR-024 | Evade: `clamp(20 + bestRecon/2 + visibility bonus, 10, 90)` %, seeded; `actionHours.evade` 1 |
| STR-025 | Pay a Krug squad to pass: $100 × soldiers via `payKrugPass`, credited to Krug funds; 0 h |
| STR-026 | (open) Off-screen fights: strength = soldiers × gear tier, defender ×1.25 in woods/mountain/settlement, loss shares drafted; loyalty and supply changes not set |
| STR-092 | (open) AI faction `funds` in `world`; income, costs, start funds from `data/economy-rules.json` (formulas not set); never below 0; `fundsMode` hardLimit / scoreTerm with hidden `overdraft` |
| STR-093 | Contract pay: MGT names `paymentDue`, Strategic deducts from employer funds, sends `contractPayment` next tick; default fails the contract (`employerDefault`), advance kept; AI–AI contracts judged and settled in `world`, status in both views (tactical-type missions open, Q55); rival takes offer → `contractEnded` `taken` |
| STR-094 | Krug escorts: Krug escort contracts; paid escort hired on a Krug-market tile before departure, foreign-PMC resentment roll, price base + per tile × danger, Krug answers via `answerEscort`, escort travels to the convoy; player hires by a strategic action, debit `payKrugEscort` |
| STR-096 | (open) `recruit` raises a squad at a held town/city from `squadTemplate` (not set) and recruits; $2000/soldier, ready after 12 h |
| STR-098 | (open) Low-risk contract guarantee: daily, post a `retrieve_deliver` offer by SSV/VDK/Krug if none open; `minFrontDistance` not set |

**Operations and strategic actions**

| ID | Summary |
| --- | --- |
| STR-027 | Op lifecycle: success when ≥ 1 soldier reaches a PMC FOB; missions confirmed at once (`missionOutcome`); lost soldiers MIA/captured/dead to MGT |
| STR-028 | Launch an op at an FOB, squad/loadout/≤ 1 vehicle locked; `launchOp` request (`squad`, `soldiers` incl. pilot, `fobId`, insured items) pays fees per op, `ok:false` = no launch; `actionHours.launch` 0 |
| STR-029 | Arrival in a PMC FOB region ends the op; storage and soldiers to MGT (`opReturn`) |
| STR-030 | (open) Vehicle `leftBehind` stays on the map; destroy/capture/recover rules not set |
| STR-031 | Move one tile on foot: `onFootHours` (2, mountain 3) or `roadMoveHours.foot`; no fuel |
| STR-032 | (open) Move by ground vehicle: terrain `moveHours` or road; off-road reduction (not set); `fuelPerRegion` 1, spent on arrival |
| STR-033 | (removed) Vehicle profile — no field, no rule |
| STR-034 | (open) Helicopter: adjacent tile in `heliMoveHours` (1), pilot Technical ≥ 50; fire from hostile military POIs/squads: 3% downed, 10% damaged; damaged → land and wait for repair (way to a plant not set) |
| STR-035 | Land a helicopter on any non-water tile; only way into hidden cities; 1 h |
| STR-036 | (open) Scout for `scoutHours` (3): reveals the tile, squads, loot hints, VIP intel; success chance not set |
| STR-037 | Stand by `n` hours: healing each tick via MGT, faster at an FOB; no other effect |
| STR-038 | Enter a POI before using its services; 1 h |
| STR-039 | Zero-time trade, hire and vehicle trade forwarded to MGT; Strategic checks only the location's services |
| STR-040 | Accept contract (0 h; blocked if the employer cannot pay the advance), hand over (1 h), hand in (1 h): location-bound, forwarded to MGT |
| STR-041 | Hospital 4 h, repairs 4 h, refuel 1 h (helicopters only at FOBs and oil plants); prices MGT |
| STR-042 | Buy an FOB in a city (usable after 24 h; price MGT-066) or take a site by force; no upkeep |
| STR-043 | Pay compensation or a bounty pay-off remotely, 0 h; prices from event params; credited to faction funds |
| STR-099 | (open) Broker the general ceasefire at a governmental institution while SSV and VDK are exhausted and both Trusted; `actionHours.brokerCeasefire` not set |
| STR-044 | Contract postings from commands, events and measures go to MGT as `contractOffer` (full offer object incl. `reputationGate`) |

**VIPs**

| ID | Summary |
| --- | --- |
| STR-045 | VIP `{ id, faction, rank, regionId, guardSquadIds }`; travels with its guard; leader stays in capital or largest city |
| STR-046 | Guard squads and rank mix per VIP rank; "mostly"/"with" shares not set |
| STR-047 | VIP death morale shock: radius by VIP rank, loss per soldier by that soldier's rank (Elite 40 … Recruit 5); player soldiers via `moraleChange` per soldier |
| STR-048 | VIP intel valid 72 h: from scouting, loot, Krug barter or purchase with standing gates; `actionHours.buyIntel` 0 |
| STR-049 | (open) Leader death dissolves the faction: squads scatter, POIs to `none`, capital contested, contracts end; `scatterShares` not set |

**World events**

| ID | Summary |
| --- | --- |
| STR-050 | (open) Daily event roll per triggered event; events and measures share `maxConcurrentEvents` (3); per-event chance not set |
| STR-051 | Faction relations per ordered pair −100…100; hostile ≤ −50, allied ≥ 50 (owned here); new factions start at 0; no reputation spill-over |
| STR-052 | Warned events schedule discoverable warning signs 2–3 days ahead |
| STR-053 | Player ops can trigger events and cancel them via `preventedBy` |
| STR-054 | News feed `{ time, type, text, eventId? }`: event start/update/end, warning signs, flavour, payments |
| STR-055 | PMC joint assault on a weakly held (≤ 2 squads) oil/arms plant or Krug market; Varyag↔Aegis −30 afterwards |
| STR-056 | Weapon shipment to a losing faction (3 of 5 days): +20 pp elite, +1 gear tier for 10 days |
| STR-057 | Rising hostility after 3 lost fights in 7 days: −20, recovers +2/day; may target the player at ≤ −30 |
| STR-058 | (open) Operation dispute: blame by weighted roll, −40 both ways, 7–14 days; Krug suspension chance not set |
| STR-059 | Front offensive at soldier advantage ×1.5 in a front sector (radius 3); front tiles defined; 5–10 days |
| STR-060 | (open) Local ceasefire after ≥ 15 losses each in an area (radius 2) in 3 days; 7 days; reputation loss not set |
| STR-061 | Defection of a losing faction's garrison below 25% supply: joins (60%) the pressing faction or disbands |
| STR-062 | Fuel shortage when an oil plant is ruined or cut off: fuel price ×2 only |
| STR-063 | Chemical leak after a fight at a chemical plant: `hazard` flag, HP loss per hour, medical ×1.5, 5 days |
| STR-064 | Bounty at reputation ≤ −50 (×2 chance at ≤ −75): 2 (3) hunt squads + 1 per rival PMC |
| STR-065 | Refugee movement when a city changes controller: loyalty −10, +1 local recruit/day at a 30% lower fee, 10 days |
| STR-066 | Rogue PMC: Varyag or Aegis loses its patron, hostile to it, new funds; can win (`rogueVictory`, player loss) |
| STR-067 | Resistance group forms at loyalty ≤ −40: 1–3 squads of 3–5, own faction, funds, controller and doctrine |

**Desperate measures**

| ID | Summary |
| --- | --- |
| STR-068 | Faction history: start regions and key plants, 7-day history of regions, soldiers and fights, unpaid contract payments of rival PMCs |
| STR-069 | Ten crisis signs evaluated daily per faction, thresholds in `crisis` |
| STR-070 | ≥ 3 signs and no measure running → may pick a measure (SAI-016, `pickMeasure`); durations drafted; ≥ 5 incl. capital threatened unlocks the nuclear strike |
| STR-071 | (open) Forced conscription (SSV, VDK): many weak squads, loyalty drop |
| STR-072 | (open) Penal battalions (SSV): expendable assault squads, some desert to the Krug |
| STR-073 | (open) Open call for help (VDK): Aegis squads, VDK loyalty loss, more contracts |
| STR-074 | (open) Paying any price (SSV, VDK, Krug): contract pay ×2, offers to PMCs it fought |
| STR-075 | (open) Scorched earth (SSV, VDK): plants ruined, bridges and roads removed in tiles about to be lost |
| STR-076 | (open; tactical mines optional) Mining the roads: `mined` flag hazard, cleared by a Technical soldier |
| STR-077 | (open) Martial law (SSV, VDK): `martialLaw` on held cities, curfews, restricted trade |
| STR-078 | Seizing Krug stocks (SSV, VDK): raid Krug markets; Krug turns hostile |
| STR-079 | VIP strike (SSV, VDK): hunt goal against an enemy high-ranking VIP; contracts to Trusted players |
| STR-080 | (open; tactical contamination optional) Nuclear strike: once per campaign, patron veto 50%, warning signs, convoy, target wiped, `contaminated` |
| STR-097 | Strategic HP loss on `contaminated` and `hazard` tiles: 2 HP per soldier per hour; player squads via `contaminationTick` |
| STR-081 | Flavour events: news-feed only, 0.005/day per eligible tile or situation, never change state |

**Map generation**

| ID | Summary |
| --- | --- |
| STR-082 | (open) Seeded pipeline land → capital → cities → industry → towns → roads → war state → start → validate; grid size, `maxAttempts` not set |
| STR-083 | (open) Land: elevation and moisture; mountains, rivers, lakes, woods, steppe |
| STR-084 | Capital on low ground by a river, closest to the centre |
| STR-085 | (open) Large and small cities with minimum spacing, near rivers and lowland |
| STR-086 | (open) Plants by resource rules, one POI per tile |
| STR-087 | (open) Towns fill gaps; every city and the capital get an adjacent governmental institution |
| STR-088 | (open) Asphalt spanning network plus loops; dirt roads to towns and plants; bridge/ford flags; gas stations |
| STR-089 | (open) Front line splits SSV and VDK; Varyag, Aegis behind their lines; Krug and `krugMarket` flags in the contested belt |
| STR-090 | (open) Player's first FOB ≥ `startFrontDistance` from the front |
| STR-091 | (open) Validation: road reachability, oil and arms per side, start services in range; optional hidden cities |

**Also reads** (rules this module applies or feeds but does not own)

| ID | File | Why strategic reads it |
| --- | --- | --- |
| GEN-001, GEN-002, GEN-003 | `spec/overview.md` | Op as unit of play; op success = one soldier back at an FOB; objective bundling |
| GEN-004, GEN-005, GEN-006 | `spec/overview.md` | Faction roster and IDs; off-map influences; civilian population |
| GEN-007 | `spec/overview.md` | Relation model and start relations (values owned by STR-051) |
| GEN-008, GEN-010 | `spec/overview.md` | (open) Leader effects on the map; Krug standing unlocks and resentment (STR-094) |
| GEN-009 | `spec/overview.md` | Krug markets as no-fire zones (STR-012) |
| GEN-012..GEN-016, GEN-019 | `spec/overview.md` | End states and victory rule, coup requirements, final op, holding phase, epilogue, reformed ceasefire (STR-004, STR-007, STR-099) |
| GEN-017, GEN-018 | `spec/overview.md` | (open) Rogue PMC daily roll, warning signs and aftermath (STR-066) |
| MGT-005, MGT-070, MGT-073 | `spec/management.md` | Fee per op at launch; player money not in `world`; shared economy rules |
| MGT-008, MGT-033, MGT-038 | `spec/management.md` | Morale per soldier in `roster`; carry weight of squads on foot; low-risk contract values (STR-098) |
| MGT-041..MGT-044, MGT-046..MGT-049 | `spec/management.md` | Contract origin and structure, goal → mission mapping, outcome, pay inputs, advance, failure, intel level |
| MGT-051, MGT-052 | `spec/management.md` | Contract board; rival PMC competition and Krug escort service (STR-094) |
| MGT-053..MGT-055, MGT-064 | `spec/management.md` | Reputation value, standing tiers and effects (encounters, gates, events), attribution |
| MGT-056..MGT-060 | `spec/management.md` | Reputation acts sent as `reputationAct` requests |
| MGT-066, MGT-068, MGT-069 | `spec/management.md` | FOBs and prices (STR-042), industry deliveries (STR-015), FOB raids (STR-016) |
| MGT-072, MGT-076 | `spec/management.md` | `management_view` (incl. `roster`) read by Strategic; how MGT handles each request type and its payload |
| SAI-002..SAI-004, SAI-013..SAI-017 | `spec/strategic-ai.md` | Who is invoked, view contents, one action per squad, hostility rules (STR-022), contract offers and evaluation, measure choice, Krug escort answers |
| TAC-003, TAC-027, TAC-080, TAC-086, TAC-087 | `spec/tactical.md` | Battle duration; encumbrance; map from the encounter tile; map types and stages fed by `region` |
| DAT-024..DAT-029 | `spec/data.md` | Vehicle record, at most one vehicle, features, availability, helicopters, instance state and loss |
| TEC-012, TEC-015 | `spec/tech.md` | Pure rules core; seeded, reproducible randomness |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/tactical_map_request.schema.json` | produces (to tactical) | 0.9.0 |
| `spec/interfaces/strategic_perception_view.schema.json` | produces (to strategic-ai) | 0.8.0 |
| `spec/interfaces/management_requests.schema.json` | produces (to management; reads its `results`) | 0.8.0 |
| `spec/interfaces/battle_result.schema.json` | consumes (from tactical) | 0.4.0 |
| `spec/interfaces/strategic_commands.schema.json` | consumes (from strategic-ai) | 0.7.0 |
| `spec/interfaces/management_view.schema.json` | consumes (from management: roster, reputation, standing, contracts, funds) | 0.3.0 |

Change history: `spec/interfaces/CHANGELOG.md`.

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/strategic-rules.json` | `spec/interfaces/data/strategic-rules.schema.json` | 0.7.0 | All STR constants: clock, road and on-foot hours, off-road, fuel, heli, recon/noise, loyalty, action hours, evade, Krug prices, auto-resolve, VIPs, relations, crisis, campaign and coup terms (owned by STR) |
| `data/strategic-terrain.json` | `spec/interfaces/data/strategic-terrain.schema.json` | 0.2.0 | Strategic terrain: move hours, passable, off-road rated, visibility, biome and tables (STR-095) |
| `data/economy-rules.json` | `spec/interfaces/data/economy-rules.schema.json` | 0.5.0 | Faction funds: start funds, income, upkeep, salaries, booking interval, `fundsMode` (shared with MGT) |
| `data/mapgen/strategic.json` | `spec/interfaces/data/mapgen-strategic.schema.json` | 0.4.0 | Generation stages, `mapShape`, width, height, Krug market placement |
| `data/factions.json` | `spec/interfaces/data/factions.schema.json` | 0.6.0 | Faction IDs, kinds, patrons, start relations, measures, doctrine IDs, `squadTemplate`, rogue chance, Krug `resentment`, `resistance` template |
| `data/poi.json` | `spec/interfaces/data/poi.schema.json` | 0.7.0 | POI types, settlement, `military`, `krugMarketAllowed`, services, income, supply and recruit output, `dailyOutput`, mineral modifier |
| `data/events.json` | `spec/interfaces/data/events.schema.json` | 0.7.0 | World events, desperate measures, flavour events: triggers, `params`, `duration`, warning signs |
| `data/vehicles.json` | `spec/interfaces/data/vehicles.schema.json` | 0.4.0 | Seats, storage, fuel range, off-road, noise, features, availability, `requiresPilot` |
| `data/missions.json` | `spec/interfaces/data/missions.schema.json` | 0.3.0 | Mission IDs in contract offers (STR-044, STR-098) |
| `data/presets.json` | `spec/interfaces/data/presets.schema.json` | 0.4.0 | AI unit presets and tiers in `tactical_map_request` |
| `data/items.json` | `spec/interfaces/data/items.schema.json` | 0.9.0 | Intel and faction items (codebook, field orders), fuel cans, read from battle results and trades |
| `data/management-rules.json` | `spec/interfaces/data/management-rules.schema.json` | 0.8.0 | Standing thresholds (MGT-054), `lowRiskContract` (MGT-038), `fobPrices` (MGT-066) |
| `data/tactical-rules.json` | `spec/interfaces/data/tactical-rules.schema.json` | 0.9.0 | `battleDurationHours` only (TAC-003, STR-023) |

`data/terrain.json` (tactical terrain) is no longer read: the biome hand-off goes through
`data/strategic-terrain.json` (STR-095).

## State slices

- Owns: `world` — tile grid (terrain, roads, POIs, controllers, loyalty, `krugMarket`, flags), capital
  state, clock, squads of every faction (incl. AI soldier data), FOB entities, abandoned vehicles, VIPs,
  faction funds and `overdraft` (STR-092), relations, faction history, running events and measures,
  warning signs, pending escort requests, intel, news feed.
- Reads, all through
  `management_view` (MGT-072): `roster` (player soldiers for `tactical_map_request`: rank, morale, attributes, nerve, wounds, equipment, perks), `reputation` (value and standing: encounter hostility, events, gates,
  views), `contracts` (status, missions, deadlines) and `economy` funds. Changes to Management slices go
  out only as `management_requests`; MGT's `results` come back on them. `unlocks` is not read.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Found while scoping; report to the root session, do not edit `spec/`. The open items in
`spec/strategic.md` › Open questions and every `(open)` value above still apply. The ones that most
affect `core/`:

- **Q53** — repair of a helicopter grounded away from a mechanical plant (stays grounded until decided).
- **Q54** — AI soldiers per soldier (rank, HP, morale in `world`) or as aggregates; spec reading today:
  aggregates, with per-soldier values generated per engagement.
- **Q55** — how tactical-type missions (VIP kill or capture, destroy target) are met between AI squads.
- **Q56** — whether a PMC-held plant pays its STR-014 `income` on top of `dailyOutput`.

No new findings from this scope. The five findings of the earlier 2026-11-24 scope are closed by the
spec cleanup `a0210cd` (impact report `spec/reports/impact-2026-11-24-f.md`): `moraleChange` request
(STR-047); AI soldier data moved to Q54; player Krug escort hire as a strategic action (STR-094); typed
`dailyOutput` (STR-015, with Q56); stale `feesUsd` text fixed.

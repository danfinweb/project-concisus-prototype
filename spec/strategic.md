# Strategic Layer — spec [STR]

Precise rules derived from `design/`. Each section: `### [STR-NNN] Title`, then the rule
(inputs, outputs, formula, ranges), its design source, and `→ data/<table>.json` where a concrete value
lives in data. Edited only through `/update-spec`.

Conventions used below. **Region distance** is the number of adjacency steps between two regions on the
region graph. **Hour** is one tick of the strategic clock. A **faction** is any of SSV, VDK, Varyag,
Aegis, Krug, player PMC, resistance groups and a rogue PMC (faction list and campaign rules: GEN).
Reputation values and standing tiers (Hostile, Unfriendly, Neutral, Friendly, Trusted) are owned by
Management (MGT); this file only reads them. Vehicle definitions are DAT (`data/vehicles.json`).

## Time

### [STR-001] Strategic clock
**Rule.** World state holds `clock = { day, hour }`, `day` integer ≥ 1, `hour` integer 0–23. A new
campaign starts at Day 1, hour = `startHour`. The clock advances in whole hours only; no state stores
fractions of an hour. Advancing from hour 23 sets hour 0 and `day + 1`. Every timestamp in the game
(news feed, service records, after-action reports, deadlines, intel expiry, scheduled events) is a
`{ day, hour }` value; displayed as "Day D, HH:00". Time only advances when the player ends the turn
(STR-003) with at least one squad action that takes ≥ 1 hour; nothing advances while the player chooses.
**Values.** `startHour` — not set (design: Open) → data/strategic-rules.json.
**Source.** design/design.md › Strategic Layer (Time)

### [STR-002] Action duration
**Rule.** Every player strategic action has a duration `d`, a whole number of hours ≥ 0, fixed by the
action type (STR-027…STR-043) or set by the player (Stand by, STR-037). An action may also cost money,
fuel or standing; costs are applied when the action starts. `d = 0` actions (trade, hire, vehicle trade)
resolve immediately and pass no time, so no faction acts (STR-003 does not run). An action with `d > 1`
(travel, standing by, healing) can be interrupted by an encounter or an event, or cancelled by the player
at a planning phase (STR-003); the hours already spent count (progress made stays, healing gained is
kept), and the rest of the action is dropped. A move that is interrupted or cancelled before its last hour
leaves the squad on its origin tile.
**Source.** design/design.md › Strategic Layer (Time); › Squads and simulation (Strategic turn); design/strategic-actions.md (intro)

### [STR-003] Hour tick
**Rule.** One strategic turn is one hour of game time. A turn has two phases:
- **Planning.** The player chooses an action for each of their squads that has none in progress, then
  commits by ending the turn. A squad in a multi-hour action keeps it, unless the player cancels it now:
  the hours already spent and any healing gained are kept, and a move cancelled midway leaves the squad on
  its origin tile (STR-002); the squad then takes a new action like any idle squad. Nothing with `d ≥ 1`
  resolves before the commit; `d = 0` actions resolve at once (STR-002). The world state does not change
  while the player plans.
- **Resolution.** After the commit, hour ticks run. Each tick, in this order:
  1. Each non-player faction receives its strategic perception view (STR-021), built from the state at
     the start of the tick, and returns one command set (STR-020). All views are built before any command
     resolves, so no faction sees another's commands of the same hour.
  2. The actions of all squads — the player's and every AI faction's — resolve together, one action per
     squad: movement progress, scouting, holding, per-hour processes such as healing progress (amount
     computed by MGT from roster data; STR-037). Where two actions conflict in the same tick, they apply in
     `factionTickOrder`.
  3. Resolve movement arrivals, then encounters (STR-022) and off-screen fights (STR-026).
  4. Advance the clock by one hour (STR-001).
  5. If the new time is 00:00, run the daily checks (STR-004).
  6. Expire timed state whose due time ≤ now (intel, event durations, deadlines, warning signs).
- **Interruption.** An encounter (STR-022) or an event that involves a player squad interrupts that
  squad's multi-hour action (STR-002); the hours already spent count. A tactical engagement resolves first
  (STR-023).
- **End of a commit.** Hour ticks run until the first of the player's squads finishes its action or is
  interrupted; then the next planning phase starts. The other player squads' longer actions keep running
  into the next commit (and may be cancelled in that planning phase).
**Values.** `factionTickOrder` — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/design.md › Strategic Layer (Time); › Squads and simulation (Strategic turn); › AI › Strategic AI (Controller hand-off)

### [STR-004] Daily checks at 00:00
**Rule.** When a tick lands on hour 0, run once, in this order: (1) crisis-sign check and desperate
measures for every faction (STR-069, STR-070); (2) world event check (STR-050); (3) daily plant output
to FOBs (STR-015); (4) notify MGT that the barter refresh is due (a `dailyRollover` management request
with its `day`). Each check
uses the state after the tick's movement and fights.
**Source.** design/design.md › Strategic Layer (Time); design/strategic-actions.md › Trade; design/design.md › Management › Base & meta progression

## Map

### [STR-005] Region graph
**Rule.** The map is a tile grid covering all of Veligrad; each tile is one region, and "region" in this
file means one tile. The grid shape is `mapShape`: `square` (default, consistent with the tactical layer)
or `hex` (a switchable option for testing). Adjacency follows from the shape (hex: 6 neighbours; square:
neighbour rule see Open questions); region distance is counted in adjacency steps. Every faction moves its
squads tile by tile. Each tile holds: `x`, `y`; `terrain` (exactly one base terrain, an ID of
data/strategic-terrain.json, STR-006, STR-095); `poi` (none or one point of interest, STR-010);
`controller` (faction id or `none`); `road` (none, or a road lying on top of the terrain: kind `asphalt` or
`dirt`, the adjacent tiles it continues to, and on a water tile a `bridge` or `ford` flag); `loyalty`
(only on settlement tiles, STR-009); `krugMarket` (boolean, only on a town or city tile: the tile holds a
Krug market, STR-010, STR-012); and flags (`hazard`, `contaminated`, `ruined`, `mined`, `martialLaw`,
`ceasefire`, each with an expiry time or `permanent`).
**Values.** `mapShape` — design `square`, `hex` as test option → data/mapgen/strategic.json.
**Source.** design/design.md › Strategic Layer › Map (draft)

### [STR-006] Terrain movement costs
**Rule.** Hours to move one tile are set by the destination tile's terrain and the mode of travel:

| Terrain | Vehicle | On foot |
| --- | --- | --- |
| Road (asphalt or dirt, same speed) | 1 | 2 |
| Steppe | 2 | 2 |
| Woods | 3 | 2 |
| Mountain | road only | 3 |
| Water | impassable | impassable |

A road between the two tiles (the origin's road continues to the destination, STR-005) overrides the
destination's terrain: the move uses the road row, whatever the base terrain. Asphalt and dirt roads have
the same speed. A vehicle enters a mountain tile only along a road. Water is crossed only along a road
whose water tile is flagged `bridge` or `ford` (amphibious vehicles: DAT). Helicopters: STR-034. Off-road
rating modifies steppe and woods (STR-032). On foot a squad takes 2 hours per tile, 3 in mountains (STR-031).
Terrain also has a visibility class (`far`, `medium`, `open`, `low`) used by detection (STR-008) and
evasion (STR-024); roads have their own (asphalt `far`, dirt `medium`; which applies on a road tile: see
Open questions).
**Values.** per terrain: vehicle hours `moveHours` (null = road only or impassable), `passable`,
`offRoadRated`, `visibility` → data/strategic-terrain.json (STR-095); road hours `roadMoveHours.vehicle` 1,
`roadMoveHours.foot` 2; on-foot hours `onFootHours.default` 2, `onFootHours.mountain` 3; road visibility
`roadVisibility.asphalt` `far`, `roadVisibility.dirt` `medium` → data/strategic-rules.json.
**Source.** design/design.md › Strategic Layer › Map (draft) › Terrain types; › Vehicles (draft); design/strategic-actions.md › Movement and operations

### [STR-095] Strategic terrain table
**Rule.** `data/strategic-terrain.json` holds one record per strategic terrain type (design: steppe, woods,
mountain, water), keyed by ID; every tile's `terrain` (STR-005) is one of these IDs. Roads are not
records: they lie on top of a terrain (STR-006, strategic-rules `roadMoveHours`, `roadVisibility`). Each
record:

| Field | Type | Meaning |
| --- | --- | --- |
| `id`, `name` | string | ID (equals key) and display name |
| `passable` | boolean | false = no squad enters off-road (water) |
| `moveHours` | integer ≥ 1 or null | Ground-vehicle hours off-road (STR-032); null = road only (mountain) or impassable (water) |
| `offRoadRated` | boolean | The vehicle off-road rating lowers `moveHours` here (STR-032) |
| `visibility` | `far`, `medium`, `open`, `low` or null | Detection and evasion class (STR-008, STR-024) |
| `biome` | string | Biome of battles on a tile of this terrain |
| `tacticalTerrainTable` | string | The tactical terrain table the biome selects |
| `prefabTable` | string | The prefab table the biome selects |

On-foot hours are `onFootHours` in strategic-rules (STR-031). For a tactical engagement (STR-023)
Strategic copies the encounter tile's `terrain` and its record's `biome` into
`tactical_map_request.region` (`terrain`, `biome`); the tactical generator selects its terrain and prefab
tables from the biome (TAC).
**Values.** design: steppe vehicle 2, woods 3, mountain road only, water impassable; visibility steppe
`open`, woods `low`, mountain `low`, water `null` (design: none); biome and table names — not set (design: Open) → data/strategic-terrain.json.
**Source.** design/design.md › Strategic Layer › Map (draft) (strategic terrain table); › Map (draft) › Terrain types

### [STR-007] Capital control
**Rule.** Exactly one tile is the capital. World state holds its `holder` (the faction with the
capital's effects) apart from its tile `controller`. At campaign start the holder and controller are
`SSV` or `VDK` (STR-089). The capital can fall: when its holder dissolves (STR-049) or loses control of
the tile (STR-014, any faction may take it), `holder` becomes `none` and the capital is **contested**.
While contested, the faction controlling the tile (if any) is its occupant; `contestedSince` is the time
the current occupant took it, reset whenever control changes. An occupant that keeps control for
`capitalHoldDays` becomes the holder, with the capital's effects, and the capital is no longer contested.
If that faction is the player, the `playerCoup` ending is reached (GEN-015); a rival PMC (or any other
faction) just becomes the holder, and the campaign goes on (GEN-012). A capital that loses its holder may
trigger a rogue PMC rushing it (GEN-017).
**Values.** `capitalHoldDays` — 7 (draft) → data/strategic-rules.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map (draft); › Factions & campaign › Coups

### [STR-008] Fog of war and detection
**Rule.** Per faction, a region is **visible** if it lies within `reconRange` of one of its squads, FOBs
or active intel sources; otherwise the faction sees the region's **last known state** (snapshot
taken when it was last visible, with its timestamp). A squad in a non-visible region is still
**noticed** by a faction if its region distance to that faction's squad or POI ≤ the squad vehicle's
noise range (DAT `noise`). The player view and every AI perception view (STR-021) are built with the
same rule.
**Values.** `reconRange.squad`, `reconRange.fob`, `reconRange.intel` — not set (design: Open) → data/strategic-rules.json; `noiseRange[noiseClass]` in regions — not set (design: Open) → data/strategic-rules.json; terrain `visibility` → data/strategic-terrain.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map (draft) (Fog of war); › Strategic Layer (Intel); › Vehicles (Noise)

### [STR-009] Civilian loyalty
**Rule.** Civilian loyalty exists only on settlement tiles (cities, towns, villages; POI types in
data/poi.json flagged as settlements). Such a tile holds one loyalty value per faction, integer −100…100.
Tiles without a settlement have no loyalty. Loyalty drives income, intel and recruitment in that
settlement (amounts: MGT) and feeds events: a resistance group forms where loyalty toward the tile's
controller is low (STR-067). Loyalty changes only through rules that name it (events, measures, war
crimes via MGT, off-screen fights) and is clamped to range.
**Values.** `loyaltyMin` −100, `loyaltyMax` 100 → data/strategic-rules.json; `loyaltyStart` — not set (design: Open) → data/strategic-rules.json; settlement flag per POI type → data/poi.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map (draft); › Factions & campaign › Factions

### [STR-010] Points of interest
**Rule.** A POI has a `type` from data/poi.json, a `controller` (from its region) and a state
(`intact`, `ruined`). Types and what they provide:

| Type | Provides (consumers) |
| --- | --- |
| Governmental institution | intel, standing with its controller |
| Plant — mechanical | vehicle parts, repairs, vehicle sales |
| Plant — chemical | medical supplies, explosive precursors; leak hazard (STR-063) |
| Plant — oil | fuel, high income; refuel point incl. helicopters |
| Plant — arms | weapons, ammunition |
| Plant — minerals | medium income; output modifier on other plants (STR-011) |
| Town | local recruits, rest |
| Small city | trader, hospital, FOB site |
| Large city | several traders, hospitals, contract hub, vehicle sales |
| Gas station | fuel, small loot, Krug contacts |

The `services` list of each type (`trade`, `hire`, `contracts`, `hospital`, `repairs`, `refuel`,
`vehicleTrade`, `fobPurchase`) decides which location-bound actions (STR-039…STR-043) are allowed there. A
`ruined` POI offers no services and no output.

**Krug markets** are not a POI type: a Krug market is the `krugMarket` flag on a town or city tile
(STR-005), allowed only on tiles whose POI type has `krugMarketAllowed`. A flagged tile adds the Krug
market's services (Krug trade and barter, local recruits, Krug work and hand-ins, vehicle sales through the
Krug; STR-039, STR-040, MGT) to those of its POI, and is a no-fire zone (STR-012). Placement: STR-089.
**Values.** `services`, `krugMarketAllowed` per POI type → data/poi.json.
**Source.** design/design.md › Strategic Layer › Map (draft) › Points of interest; › Map (draft) (Krug markets)

### [STR-011] Mineral plant modifier
**Rule.** For a faction holding ≥ 1 mineral plant, each other plant it holds has its output multiplied
by `1 + mineralModifier × heldMineralPlants`.
**Values.** `mineralModifier` — not set (design: TBD) → data/poi.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map (draft) › Points of interest; › Management › Base & meta progression

### [STR-012] Krug markets as no-fire zones
**Rule.** A tile flagged `krugMarket` (STR-010) is a no-fire zone: encounters there never turn hostile by
faction rules. If any squad starts a fight there, the Krug network turns hostile to that squad's
faction (relation and, for the player, reputation per MGT). Krug markets are neutral meeting points.
**Source.** design/design.md › Factions & campaign › The Krug (refer to GEN for the Code)

### [STR-013] Hidden cities
**Rule.** A hidden city is a POI with no road link, reachable only by helicopter landing (STR-035). It
is invisible to a faction until discovered (intel, Krug rumour, captured documents, or a helicopter
passing over or adjacent). It holds one high-output complex (mechanical, chemical, oil or arms) with
output ×`hiddenOutputMultiplier`, and is the only source of prototype items. Garrison: remnant garrison
or the first faction to find it.
**Values.** `hiddenOutputMultiplier` — not set (design: Open) → data/poi.json; remnant garrison strength — not set (design: Open) → data/poi.json.
**Status.** optional
**Source.** design/design.md › Strategic Layer › Map (draft) › Hidden cities

### [STR-014] Control of a point of interest
**Rule.** A faction controls a POI when it controls its region. Control changes by: winning a tactical
engagement or off-screen fight for it, defection (STR-061, to the pressing faction or `none`), faction
dissolution (STR-049 → `none`); for the capital, holding it is STR-007. Holding a POI yields income, supplies and recruits to its controller per hour or
per day (amounts in data/poi.json); losing POIs weakens the faction's squads over time (supply
deficit reduces squad supplies and reinforcement rate).
**Values.** per-type `income`, `supplyOutput`, `recruitOutput` — not set (design: Open) → data/poi.json; `supplyDeficitEffect` (object) — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › Squads and simulation (Control)

### [STR-015] Stationed squad and plant output
**Rule.** Action "Station a squad at a plant": allowed for a player squad in a region whose plant the
PMC has taken. While at least one PMC squad is stationed there, the PMC holds the plant; at each daily
check the plant's output (STR-010, modified by STR-011) is sent to MGT as a `plantOutput` management
request with `location` = the receiving FOB, `items` and/or `amountUsd`, `plantId` and `fobId`; the
receiving FOB is the PMC FOB with the lowest region distance (tie: lowest id). When no PMC squad remains
stationed, control returns to the region's controller before the next daily check. Time to station: not
set.
**Values.** `actionHours.station` — not set (design: Open) → data/strategic-rules.json; per-type `dailyOutput` → data/poi.json.
**Status.** open
**Source.** design/strategic-actions.md › Movement and operations; design/design.md › Management › Base & meta progression

### [STR-016] FOBs on the map
**Rule.** An FOB is a map entity `{ id, regionId, owner }`. The player starts with one (STR-090). Every
op starts and ends at an FOB of the PMC. Each FOB adds its region to the player's visibility sources
(STR-008). FOB services (stash, hiring, contracts) are MGT; rest and faster healing at an FOB are
STR-037. FOBs can be raided late game: a raid is a hostile squad arriving in the FOB region, resolved
as a tactical defence engagement (STR-023).
**Source.** design/design.md › Management › Base & meta progression; › Core loop

## Squads and simulation

### [STR-017] Squads
**Rule.** A squad is `{ id, faction, regionId, vehicleId, soldiers[], supplies, fuel, morale, goal,
transit }`. A squad has at most one vehicle; `vehicleId = null` means it travels on foot. With a vehicle:
soldiers ≤ vehicle seats, and supplies plus loot ≤ vehicle storage (DAT-024, DAT-025). On foot: it moves
by `onFootHours` (STR-006, STR-031), uses no fuel, and carries only what its soldiers carry (carry weight:
MGT-033, TAC-027). `transit` is the move in progress, `{ toRegion, hoursLeft }`, or `null` when the squad
is not moving (the perception view uses the same name, STR-021). Non-player squads use the same rules: they
move by STR-006, burn fuel, use supplies and fight. Soldier records live in MGT for the player and in the
world state for AI squads (strength, gear tier, rank mix).
**Source.** design/design.md › Strategic Layer › Squads and simulation (draft); › Vehicles (draft)

### [STR-018] Squad goals
**Rule.** A non-player squad holds exactly one goal: `patrol`, `supplyRun`, `attackPoi`, `holdPoi`,
`escort`, `tradeRoute`, `hunt` (target: a squad, a VIP or the player). Goals are set only by its
faction's commands (STR-021). A faction that cannot cover a goal with its own squads may post it as a
contract (sent to MGT, STR-044).
**Source.** design/design.md › Strategic Layer › Squads and simulation (Goals); › Management › Contracts and missions

### [STR-019] Escalation
**Rule.** Over the campaign, factions hostile to the player may (via SAI commands): field squads with
better gear tiers, counter-raid player-held regions and FOBs (STR-016), and send rival-PMC hunt squads
after the player. The strategic layer validates such commands with the normal rules; the pacing is SAI.
**Status.** open
**Source.** design/design.md › Strategic Layer (Escalation)

### [STR-020] One action per faction per hour
**Rule.** For every hour that passes (STR-003), every faction issues one set of commands and each of its
squads takes exactly one action that hour (start/continue a move, scout, fight, hold, stand by). This
holds for every faction squad, the player's included: the player's command set is the actions chosen in
the planning phase, the AI factions' come from their controllers (STR-021). A move taking `h` hours
occupies the squad for `h` ticks; the squad stays on its origin tile for the first `h − 1` ticks and is
on the destination tile in the last one (STR-022), arriving at its end unless interrupted or cancelled
(STR-002). All squads'
actions of one hour resolve together (STR-003, step 2).
**Source.** design/design.md › Overview › Pillars (4); › Strategic Layer (Time); › Squads and simulation (Strategic turn)

### [STR-021] Faction controller hand-off
**Rule.** Strategic decides when a faction acts; `strategic-ai` decides what. For every hour that passes
(each tick, STR-003), every non-player faction receives a `strategic_perception_view` (its fog-of-war
view, STR-008, including its own funds, STR-092) and returns `strategic_commands`. Commands and how
Strategic resolves each:

| Command | Resolves as |
| --- | --- |
| `setGoal` | sets the squad's goal (STR-018) |
| `moveSquad` | a move to an adjacent tile (STR-031, STR-032, STR-034) |
| `hold` | the squad holds its tile this hour (STR-020) |
| `scout` | scouting its tile (STR-036) |
| `attack` | a fight with a foreign squad or POI on its tile: encounter rules (STR-022, STR-026; STR-023 if the player is involved) |
| `offerContract` | a contract posting (STR-044) |
| `acceptContract` | a rival PMC takes another faction's offer (STR-093, SAI-015) |
| `hireEscort` | a paid Krug escort for one of its shipments (STR-094) |
| `pickMeasure` | starts a desperate measure from its available ones (STR-070) |
| `recruit` | raises a new squad (STR-096) |
| `pass` | nothing |

Strategic validates each command against the same rules as player actions (passability, fuel, durations,
funds limit, STR-092) and drops invalid ones with a logged reason; valid ones resolve together with the
player's actions (STR-003). The controller never changes the world state directly. Contract offers go to
MGT (STR-044).
**Source.** design/design.md › AI (intro); › AI › Strategic AI (Controller hand-off); › Strategic Layer › Squads and simulation (Faction funds)

### [STR-022] Encounter detection
**Rule.** After movement in a tick, for every tile on which squads of ≥ 2 factions are in that hour,
each pair is checked against the faction behaviour rules (SAI: low reputation, targeting mission, same
objective; relations ≤ hostile threshold, STR-051). A moving squad counts as on its origin tile until the
move's last hour, then on the destination tile (STR-020). Krug market tiles never turn hostile (STR-012).
If neither side is hostile, nothing happens. If hostile and the player is involved → STR-023; otherwise →
STR-026. The encounter tile's terrain sets the tactical map through its biome (STR-023, STR-095).
**Source.** design/design.md › Strategic Layer › Squads and simulation (Encounters); › AI › Strategic AI

### [STR-023] Tactical engagement
**Rule.** A hostile encounter involving a player squad (or a player op objective that requires a
fight) becomes a tactical engagement. Strategic sends a `tactical_map_request` and waits for the
`battle_result`; the request carries the encounter tile's terrain and its `biome` (STR-095) in
`tactical_map_request.region`, which select the tactical map's terrain and prefab tables. The engagement
takes a fixed amount of strategic time however long it runs: TAC-003 `battleDurationHours` (design 1 hour)
owns the value, and the result reports it as `battle_result.gameTimeHours`.
The result updates squads, control, loyalty and MIA/captured/dead soldiers (sent to MGT). Only
player-attributed fights count for crisis sign 10 (STR-069).
**Values.** battle duration → see TAC-003 (`battleDurationHours`, data/tactical-rules.json).
**Source.** design/design.md › Strategic Layer (Time); › Squads and simulation (Encounters); design/strategic-actions.md › Movement and operations

### [STR-024] Evade an encounter
**Rule.** When a hostile encounter involves a player squad, the player may try to evade instead of
fighting. Success chance = f(squad's best Recon, region terrain visibility class); on success the squad
leaves without a fight, on failure the engagement starts. Formula and time cost not set.
**Values.** `evadeChance` formula inputs — not set (design: Open) → data/strategic-rules.json; `actionHours.evade` — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › Squads and simulation (Encounters); design/strategic-actions.md › Movement and operations

### [STR-025] Pay your way through (Krug)
**Rule.** When the hostile encounter is with a Krug squad, the player may pay money instead of
fighting; payment ends the encounter. Money is debited through MGT. Price and time not set.
**Values.** `krugPassPrice`, `actionHours.krugPass` — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › Squads and simulation (Encounters); design/strategic-actions.md › Movement and operations

### [STR-026] Off-screen fights
**Rule.** A hostile encounter between non-player squads resolves automatically in the same tick from
each side's squad strength, gear and the region's terrain (seeded RNG). Outputs: losses per squad,
winner, and changes to region control, loyalty and supply. Formula not set.
**Values.** `autoResolve` weights (strength, gear, terrain) — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › Squads and simulation (Off-screen fights)

### [STR-092] Faction funds
**Rule.** The `world` slice holds `funds` (money) for every AI faction (`ssv`, `vdk`, `varyag`, `aegis`,
`krug`, and any resistance group or rogue PMC that becomes a faction). The player's PMC money is not here:
it is the MGT `economy` slice (MGT-070). Funds change only by these rules:
- **Income:** from the regions and plants (STR-010) the faction holds, using the POI income of STR-014.
- **Costs:** upkeep of its squads, its soldiers' salaries, and the contracts it offers (paid out through
  STR-093).
The formulas (income per held region and plant, squad upkeep, salaries, when income and costs are booked)
live in one shared rules table, `data/economy-rules.json`, which MGT also uses for the player's PMC
(MGT-005, MGT-070). A faction whose income cannot cover its costs meets crisis sign 5, Low liquidity
(STR-069). Each faction's own funds appear in its perception view (STR-021); other factions' funds do not.
Funds never go below zero. `fundsMode` decides how they limit a faction:
- `hardLimit` (default): Strategic rejects an `offerContract` or a `recruit` (raising a squad, STR-096) that the
  faction cannot pay for from its current funds (STR-021).
- `scoreTerm` (switchable option for testing): such commands are not rejected for funds; funds only weigh
  in the AI's scoring (SAI-014).
A contract payment due that the employer cannot cover fails the contract at once (STR-093).
**Values.** income formula, squad upkeep, salary formula, booking interval, start funds per faction — not
set (design: Open) → data/economy-rules.json; per-POI-type `income` → data/poi.json (STR-014);
`fundsMode` — design default `hardLimit`, `scoreTerm` as test option → data/economy-rules.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › Squads and simulation (Faction funds (draft)); design/design.md (module table: `world` includes funds)

### [STR-093] Contract payment between modules
**Rule.** Contract pay moves from the employer's funds to the player's money. When MGT books a payment
on a contract with the player (advance on signing, each mission's share when its goal is met; MGT-047),
its result to the triggering management request (`acceptContract`, `missionOutcome`) names the payment
due (`contractId`, `employer`, `amountUsd`). Strategic deducts that amount from the employer's funds
(STR-092) and, at the next hour tick (STR-003), sends a `contractPayment` management request with the
same fields and appends a news-feed line (STR-054); this happens wherever the squad is, with no return to
an FOB. MGT credits the player's `economy` only on that request. If the employer's funds cannot cover a
payment due, nothing is deducted and the contract fails at once: Strategic sends `contractEnded` (reason
employer default) and the player keeps the advance already paid (MGT-048). A contract between two AI
factions (SAI-015) is settled inside the `world` slice: Strategic moves the pay from the employer's funds
to the contractor's, under the same rule.
**Source.** design/design.md › Strategic Layer › Squads and simulation (Faction funds (draft)); › Overview › Core loop; › Management › Contracts and missions › Contract terms

### [STR-094] Krug escorts
**Rule.** The Krug never takes other factions' contracts (SAI-015). Its escort work runs both ways:
- **Krug work:** for its own convoys, the Krug offers escort contracts (escort_shipment missions, MGT-043)
  shown at Krug markets (MGT-051).
- **Paid Krug escort:** the player or an AI faction can pay the Krug to escort one of its shipments. A Krug
  squad is then attached to that convoy and travels with it on the strategic map (it moves with the
  convoy and joins its encounters on the convoy's side). The price is paid into the Krug's funds
  (STR-092); for the player it is debited through MGT. The escort ends when the convoy arrives or is
  destroyed or captured.
An AI faction hires one with `hireEscort { escortFor }` (STR-021); the player through a Krug market (MGT). The price and the time it takes are not set.
**Values.** `krugEscortPrice`, `krugEscortHireHours` — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/design.md › Management › Contracts and missions › Where contracts come from

### [STR-096] Raising a squad
**Rule.** An AI faction raises a new squad with the command `recruit { target }` (STR-021): `target` is a
tile the faction controls whose POI yields recruits (`recruitOutput`, STR-014). The new squad appears on
that tile at the end of the tick, with soldiers drawn from the recruits the faction's POIs have produced.
Under `fundsMode = hardLimit` Strategic rejects a `recruit` the faction cannot pay for (STR-092); the
squad's upkeep and salaries are then booked as faction costs (data/economy-rules.json). Events and measures
that spawn squads (STR-056, STR-067, STR-071, STR-072, STR-073) do so by rule, not through `recruit`.
Squad size, gear tier and the cost of raising a squad are not set.
**Values.** squad size, gear tier, raise cost — not set (design: Open) → data/economy-rules.json / data/poi.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › Squads and simulation (Control; Faction funds (draft)); › Strategic Layer (Escalation)

## Operations and strategic actions

### [STR-027] Operation lifecycle
**Rule.** An op is `{ id, squadId, objectives[], startFob, startTime }`. Objectives are missions from
accepted contracts (MGT) and/or player objectives (scout a region, scavenge, resupply); one op may
bundle several. The op ends when at least one soldier of the squad arrives at any PMC FOB: then it
**succeeds**, whether or not objectives were met (GEN-002). An op whose last soldier is lost before
reaching an FOB fails. A contract mission counts as completed as soon as its goal is met, even if the
squad is lost afterwards. The layer where the goal is met detects it at once and shows "Objective met":
tactical (a VIP killed or captured, a target destroyed, cargo saved; reported in the `battle_result`) or
strategic (a delivery, a hand-over, a place held long enough; a deadline passing is a strategic failure
check). Strategic confirms the mission, from the battle result or its own check, and reports it to MGT as
`missionOutcome`; pay then follows STR-093. No mission needs the squad back at an FOB. Soldiers who do
not return are reported to MGT as MIA, captured or dead.
**Source.** design/design.md › Overview › Core loop; › Management › Gear, loot & return

### [STR-028] Launch an op
**Rule.** At an FOB, the player commits a squad, its loadout and at most one vehicle (none: the squad goes
on foot, STR-017); they are locked to the op until it ends. Duration not set.
**Values.** `actionHours.launch` — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/strategic-actions.md › Movement and operations; design/design.md › Vehicles (draft)

### [STR-029] Return to an FOB
**Rule.** Arrival of an op squad in a PMC FOB region ends the op (STR-027); no extra time. Squad
storage and soldiers are handed to MGT (`opReturn`).
**Source.** design/strategic-actions.md › Movement and operations

### [STR-030] Lost vehicle
**Rule.** A vehicle left behind on a failed op (`battle_result.vehicle.state = leftBehind`) stays on the
map as an object in its region with state `leftBehind`; later it may be destroyed, captured by a faction,
or recovered by a player squad entering the region. Rules for which happens: not set.
**Status.** open
**Source.** design/design.md › Vehicles (draft) (Loss)

### [STR-031] Move one region on foot
**Rule.** A squad without a vehicle (STR-017) moves to an adjacent tile whose terrain is `passable`
(STR-095) in `onFootHours[terrain]` hours, falling back to `onFootHours.default` (design: 2 hours per tile,
3 in mountains), or `roadMoveHours.foot` along a road (STR-006). Water only along a road on a bridge/ford
tile. No fuel cost. It carries only what its soldiers carry.
**Values.** `onFootHours.default` 2, `onFootHours.mountain` 3, `roadMoveHours.foot` 2 → data/strategic-rules.json.
**Source.** design/strategic-actions.md › Movement and operations; design/design.md › Vehicles (draft); › Strategic Layer › Map (draft) › Terrain types

### [STR-032] Move one region by ground vehicle
**Rule.** Move to an adjacent tile in the destination terrain's `moveHours` (STR-095), or
`roadMoveHours.vehicle` along a road (STR-006). A terrain with `moveHours = null` is entered only along a
road (mountain) or not at all (water: only along a road on a bridge/ford tile, or by an `amphibious`
vehicle, DAT-026). Off-road rating (`offRoad`: `poor`, `good`, `veryGood`, DAT-024) lowers the hours on
terrains flagged `offRoadRated` (design: steppe and woods): `hours = max(1, moveHours −
offroadReduction[rating][terrain])`. `offRoad = ignoresTerrain` is the helicopter rating and moves by
STR-034. Fuel: each region moved costs `fuelPerRegion` fuel units; a full tank holds `fuelRangeRegions`
units (DAT-024). A move is rejected if fuel < `fuelPerRegion`.
**Values.** `offroadReduction[rating][terrain]` — not set (design: Open); `fuelPerRegion` — design implies 1 (fuel range in regions) → data/strategic-rules.json.
**Status.** open
**Source.** design/strategic-actions.md › Movement and operations; design/design.md › Vehicles (draft)

### [STR-033] Vehicle profile
**Rule.** A vehicle's `profile` is `civilian` or `military` (DAT-024). Since design 44887c7 the profile has
no rule effect: the checkpoint-attention effect is gone with checkpoints. Strategic stores and shows it
only.
**Source.** design/design.md › Vehicles (draft) (Profile)

### [STR-034] Fly one region by helicopter
**Rule.** A helicopter moves to any adjacent region in `heliMoveHours`, any terrain incl. water and
mountains, costing `fuelPerRegion` fuel. Requires a pilot seat filled by a soldier with Technical ≥
`pilotTechnicalMin` or a hired pilot (MGT); the pilot counts against seats. Both values are single values
for every helicopter, owned here (DAT-028 points to them; vehicle records carry no copy). Every faction with
a squad or POI within the helicopter's noise range notices it (STR-008); military POIs in range may fire
on it (effect not set). A downed helicopter becomes a crash site and its crew starts an emergency op on
foot (STR-027).
**Values.** `heliMoveHours` — design 1; `pilotTechnicalMin` — design 50 → data/strategic-rules.json; military POI fire effect — not set (design: Open).
**Status.** open
**Source.** design/strategic-actions.md › Movement and operations; design/design.md › Vehicles (draft) › Helicopters

### [STR-035] Land a helicopter
**Rule.** Allowed in any region except water terrain; the only way into hidden cities (STR-013).
Duration not set.
**Values.** `actionHours.land` — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/strategic-actions.md › Movement and operations; design/design.md › Vehicles (draft) › Helicopters

### [STR-036] Scout
**Rule.** Takes `scoutHours` in the squad's current region. On success it makes the region visible to
the player and reveals squads, op areas and loot hints there; if a VIP is in the region, it yields VIP
intel (STR-048). Success chance not set.
**Values.** `scoutHours` — design placeholder 3; `scoutSuccess` (chance inputs) — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/design.md › Strategic Layer (Time); design/strategic-actions.md › Movement and operations

### [STR-037] Stand by
**Rule.** One action, "Stand by", replaces Wait and Rest. The player sets `n ≥ 1` hours; the squad stays
on its tile, on alert, for `n` ticks (STR-003). Each tick its soldiers progress healing (MGT computes HP
from the squad's best Medical; the rate is higher when the squad is in a PMC FOB region). An encounter or
event interrupts it, and the player may cancel it at a planning phase (STR-002, STR-003): the hours
already spent count and the healing made so far stays. What "on alert" changes is not set (see Open
questions).
**Source.** design/design.md › Strategic Layer (Time); › Squads and simulation (Strategic turn); design/strategic-actions.md › Movement and operations

### [STR-038] Enter a point of interest
**Rule.** A squad in a region with a POI may enter it; entering is required before using its services
(STR-039…STR-043). Duration not set.
**Values.** `actionHours.enterPoi` — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/strategic-actions.md › Movement and operations

### [STR-039] Zero-time trade actions
**Rule.** Take 0 hours and are forwarded to MGT, which resolves price, stock and reputation:
- Trade (buy, sell, barter): faction traders in cities, Krug markets.
- Hire soldiers: at FOBs; local recruits in towns and Krug markets.
- Buy or sell a vehicle: large cities, mechanical plants; some vehicles only at high standing or via the
  Krug (DAT/MGT).
Strategic checks only that the squad (or FOB) is at a location whose POI type offers that service.
**Source.** design/strategic-actions.md › Trade, services, contracts and factions; design/design.md › Strategic Layer (Time)

### [STR-040] Contract actions
**Rule.** Location-bound, forwarded to MGT:
- Accept a contract: at an FOB, a city, or a Krug market (Krug work).
- Hand over items or a VIP: at the contract's destination region.
- Hand in faction or operation items: at a POI held by that faction, or at a Krug market.
Strategic supplies location and time; MGT resolves the contract, money and reputation. Durations not
set.
**Values.** `actionHours.acceptContract`, `actionHours.handOver`, `actionHours.handIn` — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/strategic-actions.md › Trade, services, contracts and factions

### [STR-041] Paid services
**Rule.** Hospital treatment (small and large cities), vehicle repairs (mechanical plants), refuel (gas
stations, oil plants; helicopters only at PMC FOBs and oil plants). Price is MGT; refuel fills the
vehicle's fuel to `fuelRangeRegions` (DAT-024). Durations not set.
**Values.** `actionHours.hospital`, `actionHours.repair`, `actionHours.refuel` — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/strategic-actions.md › Trade, services, contracts and factions; design/design.md › Vehicles (draft) › Helicopters

### [STR-042] Acquire an FOB
**Rule.** Buy a new FOB at a small or large city POI (price via MGT), or take over an FOB site by force
through an op (control of the site region passes to the PMC on a won engagement). On success a new FOB
entity is created (STR-016). Duration and price not set.
**Values.** `actionHours.buyFob` — not set (design: Open) → data/strategic-rules.json; FOB price — MGT.
**Status.** open
**Source.** design/strategic-actions.md › Trade, services, contracts and factions; design/design.md › Management › Base & meta progression

### [STR-043] Payments to factions
**Rule.** Pay compensation (to the faction hurt in an Operation dispute, STR-058) and pay off a bounty
(to the faction that set it, STR-064). Money and reputation through MGT; ends the related event's
effect toward the player. Location, price and duration not set.
**Values.** `params.compensationPrice`, `params.bountyPayoffPrice`, durations — not set (design: Open) → data/events.json (records of STR-058 and STR-064).
**Status.** open
**Source.** design/strategic-actions.md › Trade, services, contracts and factions

### [STR-044] Contract postings from goals
**Rule.** When a faction command offers a contract (`offerContract`, STR-021), or an event/measure creates
one, Strategic validates it (STR-092 funds limit) and hands the offer to MGT as a `management_requests`
request of type `contractOffer` carrying the offer object: `id` (unique offer ID), `employer`,
`targetFaction` (the faction the missions act against, or null), `sourceGoal` (STR-018), `missions`
(`key` unique within the offer, mission type `missionId`, `targets`, `location` each), `deadline` as a `{ day, hour }` timestamp, `payInputs` (MGT-046),
`reputationGain`, `intelLevel` (`exact`, `lastKnown`, `rumour`; MGT-049), `deniable`, `boardLocation`, `counterContractOf`, and `reputationGate` —
the MGT-055 flags `{ better, sensitive }` the offering faction sets when the design names a gate
("Friendly or better" → `better`, "Trusted" → `sensitive`). The field set is that of
`strategic_commands.contractOffer`; MGT does not read `strategic_commands` itself.
**Source.** design/design.md › Management › Contracts and missions; › AI › Strategic AI

## VIPs

### [STR-045] VIP entity
**Rule.** A VIP is `{ id, faction, rank, regionId, guardSquadIds[] }`, rank ∈ `major`, `colonel`,
`general`, `leader`. A non-leader VIP travels with its guard between POIs of its faction (moves by
STR-020). The faction leader stays in the faction's capital or, if none, its largest city. A VIP's
position is hidden unless the viewer holds valid intel (STR-048) or sees its region.
**Source.** design/design.md › Strategic Layer › VIPs

### [STR-046] VIP guard
**Rule.** Guard generated with the VIP:

| Rank | Guard squads | Soldier rank mix |
| --- | --- | --- |
| Major | 1 | mostly Regulars |
| Colonel | 1–2 | mostly Veterans |
| General | 2 | with Elites |
| Leader | 3 | Elites |

**Values.** `vip.guard[rank] = { squadsMin, squadsMax, rankMix }` — design values above, "mostly"/"with" shares not set → data/strategic-rules.json.
**Source.** design/design.md › Strategic Layer › VIPs

### [STR-047] VIP death morale shock
**Rule.** When a non-leader VIP dies, every squad of its faction within radius `R(rank)` of the VIP's
region loses morale by the squad's rank: Major R = 0 (same region), Colonel R = 3, General R = ∞ (all
squads of the faction). Loss: Elite −40, Veteran −25, Regular −10, Recruit −5.
**Values.** `vip.shockRadius` — major 0, colonel 3, general `all`; `vip.moraleLoss` — elite 40, veteran 25, regular 10, recruit 5 → data/strategic-rules.json.
**Source.** design/design.md › Strategic Layer › VIPs

### [STR-048] VIP intel
**Rule.** VIP intel grants the holder the VIP's region and guard size, valid for `vipIntelHours` from
acquisition; after that it is stale (last known state only). Sources:
- Scouting: a successful scout (STR-036) in the VIP's region, or looting field orders/a codebook from
  the VIP's faction in an op (from `battle_result`).
- Krug market trade: barter goods or faction items (encrypted radio, codebook) worth ≥ the rank's
  goods value.
- Buy from a faction hostile to the VIP's side, if the player's standing with the seller ≥ 20 (leader:
  ≥ 50); price by rank. Money and standing via MGT. Time not set.
**Values.** `vip.intelHours` — design 72; `vip.intelGoods` — major 1500, colonel 4000, general 10000, leader 25000; `vip.intelPrice` — major 2000, colonel 5000, general 12000, leader 30000; `vip.intelStanding` — 20, leader 50 → data/strategic-rules.json; `actionHours.buyIntel` — not set (design: Open) → data/strategic-rules.json.
**Source.** design/design.md › Strategic Layer › VIPs; design/strategic-actions.md › Trade, services, contracts and factions

### [STR-049] Faction leader death
**Rule.** When a faction leader dies, the faction dissolves at once: its squads scatter (each becomes
a resistance group, STR-067, Krug recruits, or is removed — split not set), all its POIs and regions
get `controller = none` (a capital it held becomes contested, STR-007), its contracts end (sent to MGT), and a PMC it
backed loses its patron (GEN). The faction takes no further actions.
**Values.** `scatterShares.resistance`, `scatterShares.krug`, `scatterShares.removed` — not set (design: Open) → data/strategic-rules.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › VIPs

## World events

### [STR-050] Event check
**Rule.** At each daily check, for every event definition in data/events.json whose trigger condition
is true (and which is not already running for the same subject), roll its chance with the seeded RNG.
World events and desperate measures (STR-070) share one cap: at most `maxConcurrentEvents` of them,
counted together, run at once; when the cap is reached, no further event or measure starts. An event
instance is `{ eventId, subjects, startTime, endTime | condition }`. When it ends, its temporary effects
are reverted.
**Values.** `maxConcurrentEvents` (events and measures together) — design 3; per-event `chance` — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › World events (How events work)

### [STR-051] Faction relations
**Rule.** World state holds a relation value for every ordered pair of factions, integer −100…100.
Relations decide who attacks whom (hostile ≤ −50, allied ≥ 50, as used by STR-022 and STR-069). Events
and measures shift them; they are clamped to range. Reputation with the player is a separate value (MGT)
and is not changed by relations: since design 8972470 there is no reputation spill-over to a faction's
allies or enemies (MGT-053).
**Values.** `relationMin` −100, `relationMax` 100, `hostileAt` −50, `alliedAt` 50 → data/strategic-rules.json (this section owns them; GEN-007 and SAI-003 point here); start values `startRelations` — not set (design: Open) → data/factions.json.
**Source.** design/design.md › Strategic Layer › World events; › Management › Reputation (draft)

### [STR-052] Warning signs
**Rule.** An event or measure flagged `warned` schedules warning signs `warningLeadDays` before its
start: items from its sign list (intel, Krug rumours, captured documents, unusual squad movements)
become discoverable by the player through intel sources, scouting and Krug markets, and show in the
news feed once found. The player may act on them to prevent the event (STR-053).
**Values.** `warningLeadDays` — not set (design: "a few days") → data/events.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › World events (Warning signs)

### [STR-053] Player influence on events
**Rule.** Player ops can make a trigger condition true (e.g. Operation dispute) and can cancel a
pending or running event when its `preventedBy` condition is met (intercepting the shipment, breaking
up the assault, destroying the nuclear convoy).
**Source.** design/design.md › Strategic Layer › World events (Player influence)

### [STR-054] News feed
**Rule.** Every event start, running update and end, every found warning sign, and every flavour
entry (STR-081) is appended to the intel log as `{ time, type, text, eventId? }`, ordered by time.
**Source.** design/design.md › Strategic Layer › World events (News feed)

### [STR-055] Event: PMC joint assault
**Rule.** Trigger: a high-value POI (oil or arms plant, or a Krug hub: a tile flagged `krugMarket`,
STR-010) is weakly held and both Varyag and
Aegis have no active attack/hunt goals. Effect: both attack it together with their strongest squads.
Ends when the assault ends. Afterwards Varyag↔Aegis relation drops by `jointAssaultRelationDrop`.
Hooks: contracts to defend or to join; Varyag and Aegis invite the player only if Friendly or better
with both.
**Values.** "weakly held" threshold, `jointAssaultRelationDrop` ("sharply") — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Events; › Reputation in the event system

### [STR-056] Event: Weapon shipment
**Rule.** Trigger: a faction has lost regions for `shipmentLossDays` consecutive days. Effect: a convoy
from its influence travels on the map; on arrival, for `shipmentDays` that faction's new squads have a
higher elite share and better gear. Hooks: intercepting the convoy gives loot and a large reputation
loss with that faction; escort contracts only to Friendly or better.
**Values.** `shipmentLossDays` ("several") — not set; `shipmentDays` — design 10; elite share and gear bonus — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Events; › Reputation in the event system

### [STR-057] Event: Rising hostility
**Rule.** Trigger: faction A suffers `hostilityLosses` losses against faction B within a window.
Effect: relation A→B drops; A shifts squads to attack B and hunts anyone working for B. Ends when the
relation recovers above `hostilityRecoverAt`. The player can be the target when A's reputation with the
player is ≤ −30 and falling; A at Unfriendly or worse may set hunt goals against the player.
**Values.** `hostilityLosses`, window, relation drop, `hostilityRecoverAt` — not set (design: Open); player target threshold — design −30 → data/events.json.
**Status.** open
**Source.** design/world-events.md › Events; › Reputation in the event system

### [STR-058] Event: Operation dispute
**Rule.** Trigger: a fight (player op or any) kills soldiers of an uninvolved faction, or hits a Krug
convoy in crossfire. Effect: the hurt faction blames another faction or the player — the candidate with
the lowest standing toward the player is most likely to blame the PMC (weighted roll) — and relations
between hurt and blamed collapse; the Krug may suspend trade with both. Duration
`disputeDays` (7–14). Hooks: pay compensation (STR-043), hand over evidence documents to redirect the
blame, or exploit. A dispute can attribute an otherwise unwitnessed act (MGT attribution).
**Values.** `disputeDays` — design 7–14; relation collapse amount, Krug suspension chance — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Events; › Reputation in the event system

### [STR-059] Event: Front offensive
**Rule.** Trigger: SSV or VDK has a strength advantage ≥ `offensiveAdvantage` along part of the front.
Effect: its squads concentrate on that front sector and push; POIs change hands faster. **Front tiles** are
tiles held by SSV or VDK adjacent to a tile held by the other; a **front sector** is the front tiles within
region distance `params.sectorRadius` of one front tile (spec definition, see Open questions). Duration
`offensiveDays` (5–10). Hooks: many contracts on both sides; higher encounter risk on roads near the
front.
**Values.** `offensiveDays` — design 5–10; `offensiveAdvantage`, `params.sectorRadius` — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Events

### [STR-060] Event: Local ceasefire
**Rule.** Trigger: heavy losses on both SSV and VDK in one area — the tiles within region distance
`params.areaRadius` of a tile where they fought (spec definition, see Open questions). Effect: regions of that area get the
`ceasefire` flag; SSV–VDK encounters there never turn hostile. Duration `ceasefireDays`. A player who
breaks it (fights there) loses heavy reputation with both (MGT).
**Values.** `ceasefireDays` — design 7; loss threshold, `params.areaRadius`, reputation loss — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Events

### [STR-061] Event: Defection
**Rule.** Trigger: a garrison of a losing faction has supply below `defectionSupply`. Effect
(instant), one of two outcomes (seeded roll):
- **Joins the faction pressing it:** the enemy faction that attacked it last, or else the nearest enemy
  faction (spec order, see Open questions); the garrison and its POI tile pass to that faction.
- **Disbands:** the garrison is removed and its POI tile becomes uncontrolled (`controller = none`).
Handover contracts only to Friendly or better with the faction involved.
**Values.** `defectionSupply`, `defectionJoinChance` (join vs disband) — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Events; › Reputation in the event system

### [STR-062] Event: Fuel shortage
**Rule.** Trigger: an oil plant is ruined or cut off (no road path to its controller's other
regions). Effect: fuel prices ×2 (sent to MGT as a price modifier) and faction squads move less
(`shortageMoveFactor`). Ends when supply is restored.
**Values.** `fuelPriceFactor` — design 2; `shortageMoveFactor` — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Events

### [STR-063] Event: Chemical leak
**Rule.** Trigger: a fight takes place at a chemical plant. Effect: the plant region and its adjacent
regions get the `hazard` flag; medical prices rise (MGT modifier). Duration `leakDays`.
**Values.** `leakDays` — design 5; hazard effect, `medicalPriceFactor` — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Events; design/design.md › Strategic Layer › Map (draft) › Points of interest

### [STR-064] Event: Bounty on the PMC
**Rule.** Trigger: player reputation with a faction ≤ −50; chance ×2 at ≤ −75. Effect: that faction
adds hunt squads targeting the player; rival PMCs join. Ends when reputation recovers above −50 or the
bounty is paid off (STR-043).
**Values.** `bountyAt` −50, `bountyDoubleAt` −75, extra hunt squads — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Events; › Reputation in the event system

### [STR-065] Event: Refugee movement
**Rule.** Trigger: a city (small, large or capital) changes controller. Effect: loyalty shifts in
neighbouring regions and cheap local recruits appear there (sent to MGT). Duration `refugeeDays`.
**Values.** `refugeeDays` — design 10; loyalty shift, recruit discount — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Events

### [STR-066] Event: Rogue PMC
**Rule.** Strategic side of the GEN rogue-PMC coup: the trigger, chance and at-most-once rule are GEN.
When it fires, Varyag or Aegis becomes a faction with no patron, its relation to its former patron is
set hostile, and the patron gains crisis sign 9. A rogue PMC with Trusted player reputation approaches
the player as an ally.
**Source.** design/world-events.md › Events; › Reputation in the event system; design/design.md › Factions & campaign › Coups

### [STR-067] Event: Resistance group forms
**Rule.** Trigger: civilian loyalty toward a region's controller ≤ `resistanceLoyalty`. Effect: a
resistance faction spawns `1–3` squads of `3–5` poorly equipped locals in that region. On creation it
sets relations: hostile to the controller; toward each other faction, rolled allied/neutral/hostile.
Toward the player: hostile if the player is Friendly or better with the controller, friendly if the
player is Hostile to it, else rolled. It ambushes patrols and supply runs and lowers loyalty to the
controller in adjacent regions. Ends when destroyed, disbanded (loyalty back above the threshold), or
absorbed by an allied faction.
**Values.** `resistanceLoyalty` — design ≤ −40; `resistanceSquads` 1–3; `resistanceSquadSize` 3–5; stance roll weights, spread effect — not set (design: Open) → data/events.json.
**Source.** design/world-events.md › Events; › Reputation in the event system

## Desperate measures

### [STR-068] Faction history
**Rule.** For each faction the world state keeps: regions held at campaign start; oil and arms plants
held at campaign start; a per-day history of regions held and soldiers alive for the last 7 days; and
the list of player-attributed fights it lost in the last 7 days. This feeds STR-069.
**Values.** `historyDays` — design 7 → data/strategic-rules.json.
**Source.** design/world-events.md › Desperate measures (Crisis signs)

### [STR-069] Crisis signs
**Rule.** Evaluated at each daily check for each faction; each sign is true or false:
1. Little territory: regions held < 30% of start.
2. Large area losses: regions lost in the last 7 days ≥ 15% of regions held 7 days ago.
3. Large troop losses: soldiers lost in the last 7 days ≥ 30% of soldiers 7 days ago.
4. Resistance: ≥ 2 resistance groups active in its regions.
5. Low liquidity: the faction's income cannot cover its costs — squads, salaries and contract payments
   (STR-092); contracts go unpaid.
6. Capital threatened: an enemy squad within region distance ≤ 2 of its capital, or of its last city if
   the capital is lost.
7. Key plants lost: oil+arms plants held < 50% of start.
8. Isolation: ≥ 3 factions with relation ≤ −50 toward it.
9. Its PMC has gone rogue: Varyag (SSV) or Aegis (VDK) is rogue.
10. Repeated defeats by the player: ≥ 3 player-attributed lost fights in the last 7 days.
**Values.** `crisis.littleTerritory` 0.30, `crisis.areaLoss` 0.15, `crisis.troopLoss` 0.30, `crisis.resistanceGroups` 2, `crisis.capitalThreatRange` 2, `crisis.keyPlants` 0.5, `crisis.isolationFactions` 3, `crisis.isolationRelation` −50, `crisis.playerDefeats` 3 → data/strategic-rules.json.
**Source.** design/world-events.md › Desperate measures (Crisis signs); › Reputation in the event system; design/design.md › Strategic Layer › Squads and simulation (Faction funds (draft))

### [STR-070] Measure selection
**Rule.** After the sign check: if a faction has ≥ 3 true signs and no measure running, it may pick one
measure available to it whose typical signs overlap its true signs (choice: SAI-016, returned as `pickMeasure`; the view lists the candidates as `availableMeasures`). At most one measure
per faction runs at a time, and a measure starts only while the shared cap on events and measures
(STR-050) is not reached. If ≥ 5 signs and Capital threatened is among them, the nuclear strike
(STR-080) becomes available. Measures are data/events.json records with `kind: "measure"`.
**Values.** `measureSignsMin` 3, `nuclearSignsMin` 5 → data/strategic-rules.json; measure durations — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › World events (Desperate measures); design/world-events.md › Desperate measures

### [STR-071] Measure: Forced conscription
**Rule.** SSV, VDK; signs: troop losses, area losses. Spawns many new squads of poorly trained, poorly
equipped soldiers from held towns; loyalty drops in those regions; resistance chance rises. Hooks:
draft convoys to escort/block; cheap deserters for hire (MGT).
**Values.** squad count, loyalty drop — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Desperate measures (Measures)

### [STR-072] Measure: Penal battalions
**Rule.** SSV; sign: troop losses. Spawns expendable assault squads sent to the front; a share
deserts to the Krug.
**Values.** squad count, desertion share — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Desperate measures (Measures)

### [STR-073] Measure: Open call for help
**Rule.** VDK; signs: little territory, key plants lost, its PMC gone rogue. Adds Aegis squads with
better gear; VDK loses civilian loyalty in its regions; contract volume rises.
**Values.** Aegis squads, loyalty loss — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Desperate measures (Measures)

### [STR-074] Measure: Paying any price
**Rule.** SSV, VDK, Krug; signs: troop losses or repeated player defeats, while money remains.
Contract pay ×2 (sent to MGT); the faction offers contracts to PMCs it has fought, including the player
if reputation > −50.
**Values.** `payFactor` — design 2; `minReputation` — design −50 → data/events.json.
**Status.** open
**Source.** design/world-events.md › Desperate measures; › Reputation in the event system

### [STR-075] Measure: Scorched earth
**Rule.** SSV, VDK; sign: area losses. In its regions about to be lost (enemy squad adjacent or
present), plants become `ruined` and bridges and roads are removed.
**Values.** "about to be lost" rule — not set (design: Open) → data/events.json.
**Status.** open
**Source.** design/world-events.md › Desperate measures (Measures)

### [STR-076] Measure: Mining the roads
**Rule.** SSV, VDK; sign: area losses. Threatened regions get the `mined` flag on roads and
approaches: a hazard for squads moving there; a Technical soldier can clear it. Mines on the tactical
map are optional (later build).
**Values.** mine hazard effect, clear rule — not set (design: Open) → data/events.json.
**Status.** open; tactical mines optional
**Source.** design/world-events.md › Desperate measures (Measures)

### [STR-077] Measure: Martial law
**Rule.** SSV, VDK; signs: resistance, capital threatened. All its held cities get `martialLaw`: curfews,
restricted trade (MGT price/stock modifier), civilians searched. Hooks: harder movement and trade;
smuggling contracts with the Krug. (Checkpoints are no longer part of the design, 44887c7.)
**Values.** curfew, movement and trade restriction, search effect — not set (design: Open) → data/events.json `params`.
**Status.** open
**Source.** design/world-events.md › Desperate measures (Measures)

### [STR-078] Measure: Seizing Krug stocks
**Rule.** SSV, VDK; sign: low liquidity. Sends squads to raid Krug markets for fuel and ammunition;
the Krug's relation to it becomes hostile.
**Source.** design/world-events.md › Desperate measures (Measures)

### [STR-079] Measure: VIP strike
**Rule.** SSV, VDK; signs: little territory, isolation. Creates a hunt goal against a high-ranking VIP
of the opposing faction; on kill, STR-047 applies. Contracts to carry it out or protect the VIP include
the target's location intel and go only to Trusted players; refusing costs −5 (MGT).
**Source.** design/world-events.md › Desperate measures; › Reputation in the event system

### [STR-080] Measure: Nuclear strike
**Rule.** SSV or VDK; requires ≥ 5 signs incl. Capital threatened, its patron does not stop it
(chance not set), at most once per campaign. Warning signs `nukeWarningDays` ahead (special convoy
under heavy escort, air defence massing, Krug rumours, radio silence). The convoy is a squad on the map;
destroying it prevents the strike. Effect: the target region (enemy-held city or largest troop
concentration) loses every unit; its POI becomes permanently `ruined`; it and its neighbours get
`contaminated` (permanent): soldiers lose HP every tactical turn there (tactical effect optional, later
build), loot from there cannot be sold.
Aftermath: every other faction's relation to the striker is set hostile; its patron may cut support;
loyalty collapses; Refugee movement fires for neighbours. Escort contracts only to Trusted players.
**Values.** `nukeWarningDays` ("several") — not set; patron veto chance — not set; contamination HP loss — not set (design: Open) → data/events.json.
**Status.** open; tactical contamination effect optional
**Source.** design/world-events.md › Nuclear strike; › Reputation in the event system

### [STR-081] Flavour events
**Rule.** Flavour events have no gameplay effect. They are entries shown only in the news feed
(STR-054), as radio intercepts, or as visual map changes; content from lore, triggered by
`flavourTrigger` (not set). They never change world state.
**Status.** open
**Source.** design/design.md › Strategic Layer › World events (Flavour events)

## Map generation

### [STR-082] Generation pipeline
**Rule.** A new map is generated from a seed through fixed stages, in order: land (STR-083), capital
(STR-084), cities (STR-085), industry (STR-086), towns and governmental institutions (STR-087), roads
(STR-088), war state (STR-089), start (STR-090), validate (STR-091). Each stage reads only earlier
stages' output and its own record in data/mapgen/strategic.json (keyed by stage id). Seeded RNG only.
If validation fails, regenerate with the next derived seed up to `maxAttempts`. The output is a tile grid
of shape `mapShape` (STR-005; `square` by default, `hex` as a test option), each tile one region.
**Values.** `mapShape` — design `square` (`hex` test option); grid size (`width`, `height`), `maxAttempts` — not set (design: Open) → data/mapgen/strategic.json.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map generation (draft)

### [STR-083] Stage: land
**Rule.** Generate elevation and moisture per region. Mountains on high ground, mostly along the
borders; rivers start in mountains and flow downhill to lakes or the border; lakes on local minima;
woods on wet and hilly ground; steppe on dry lowland. Rivers and lakes are water terrain.
**Values.** thresholds for mountain/woods/steppe, border bias, river count — not set (design: Open) → data/mapgen/strategic.json `land`.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map generation (draft) (1)

### [STR-084] Stage: capital
**Rule.** Place the capital (large city) on a low-elevation region adjacent to a river, choosing the
candidate closest to the map centre.
**Values.** central-distance limit — not set (design: Open) → data/mapgen/strategic.json `capital`.
**Source.** design/design.md › Strategic Layer › Map generation (draft) (2)

### [STR-085] Stage: cities
**Rule.** Place large and small cities with a minimum region distance to each other and the capital,
weighting candidates near rivers and on lowland.
**Values.** `largeCities`, `smallCities`, `minSpacing`, river/lowland weights — not set (design: Open) → data/mapgen/strategic.json `cities`.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map generation (draft) (3)

### [STR-086] Stage: industry
**Rule.** Place plants by resource rules: oil in steppe basins; mechanical near mountains and cities;
chemical on rivers; arms near the capital or large cities; minerals in mountains and hills. One POI per
region.
**Values.** count per type, "near" distance — not set (design: Open) → data/mapgen/strategic.json `industry`.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map generation (draft) (4)

### [STR-087] Stage: towns and governmental institutions
**Rule.** Towns fill gaps between placed POIs. Every city and the capital get a governmental
institution in an adjacent free region (one POI per region).
**Values.** town density — not set (design: Open) → data/mapgen/strategic.json `towns`.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map generation (draft) (5)

### [STR-088] Stage: roads
**Rule.** Roads are laid on top of the tiles' terrain (STR-005). Asphalt roads: a spanning network over
the capital and all cities plus `extraLoops` extra links. Dirt roads link every town and plant to the
network. Where a road crosses a water tile, flag that tile `bridge` or `ford`. Gas stations placed every `gasInterval` regions along asphalt roads. Hidden cities
get no road.
**Values.** `extraLoops` ("a few"), `gasInterval`, bridge/ford ratio — not set (design: Open) → data/mapgen/strategic.json `roads`.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map generation (draft) (6)

### [STR-089] Stage: war state
**Rule.** Draw a front line splitting the map into SSV and VDK territory; the capital goes to one side
(random). Varyag starts behind SSV lines, Aegis behind VDK lines; the Krug in the contested belt along
the front. Krug markets: town and city tiles in that belt get the `krugMarket` flag (STR-010).
**Values.** front split ratio, belt width — not set (design: Open) → data/mapgen/strategic.json `warState`; Krug market count and spacing — not set (design: Open) → data/mapgen/strategic.json `krugMarkets`.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map generation (draft) (7)

### [STR-090] Stage: start
**Rule.** Place the player's first FOB in a quiet region away from the front (region distance ≥
`startFrontDistance`).
**Values.** `startFrontDistance` — not set (design: Open) → data/mapgen/strategic.json `start`.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map generation (draft) (8)

### [STR-091] Stage: validate
**Rule.** The map is valid only if all hold: every POI except hidden cities is reachable by road from
the capital; the capital is reachable by road from every city; SSV and VDK each hold ≥ 1 oil and ≥ 1
arms plant; a town and a gas station lie within `startServiceRange` of the player's start FOB. Optional
rule: `hiddenCities` (1–3) hidden cities in woods or mountains, ≥ `hiddenRoadDistance` regions from any
road, each with a non-water landable neighbour.
**Values.** `startServiceRange` ("a few regions"), `hiddenRoadDistance` ("several") — not set; `hiddenCities` — design 1–3 → data/mapgen/strategic.json `validate`.
**Status.** open
**Source.** design/design.md › Strategic Layer › Map generation (draft) (Validation rules)

## Open questions

1. **Resolved (design 8972470):** every hour every faction issues one set of commands and each of its
   squads takes one action; the controller hand-off runs for every hour that passes (STR-003, STR-020,
   STR-021). STR-003/STR-020: the Time bullet says every *faction* takes one action per hour; Squads and
   simulation says every faction *squad* takes one action per hour; Controller hand-off says factions get
   their perception view "after each player action". Spec assumes one command set per faction per hour,
   one action per squad. Confirm.
2. **Resolved (design 8972470):** yes — an encounter or event interrupts a multi-hour action (travel,
   rest, healing) and the hours already spent count (STR-002, STR-003). The squad's position during a move
   stays open as question 26. STR-003: does a hostile encounter interrupt a multi-hour player action
   (move, rest)? Where is a squad during a 2–3 hour move for encounter purposes (origin, destination,
   both)?
3. **Resolved (design 8972470):** one global clock; the player chooses an action for each squad, ends the
   turn, and all squads' actions resolve together (STR-003). How many hours one commit runs is still a spec
   assumption (question 27). STR-002/STR-017: with several player squads on ops at once, how do their
   actions share the clock (one global clock, per-squad orders that continue while another squad acts)?
4. **Resolved (design eb072a2):** a road lies on top of a tile's terrain (STR-005, STR-006).
   STR-006/STR-005: "every region shows one terrain type" but asphalt/dirt road are terrain types and
   mountains are passable "by road". Spec models roads as links on top of base terrain. Confirm.
5. **Resolved (design eb072a2):** the destination tile's terrain sets the hours; a road between the two
   tiles overrides it, asphalt and dirt at the same speed (STR-006). STR-006: movement cost uses the destination region's terrain — or origin, or the worse of both?
6. STR-001: start hour of Day 1 not stated.
7. **Resolved (design eb072a2):** loyalty exists only on settlement tiles, one value per faction,
   −100…100; the start value stays unset (STR-009). STR-009: civilian loyalty range, start value, and whether it is per faction or one value toward the
   controller.
8. STR-024/STR-025/STR-028/STR-035/STR-038/STR-040…STR-043: times not stated (design: Open), plus evade
   formula and Krug pass price.
9. STR-032: off-road rating reduction per rating not set; is fuel spent per region (fuel range in
   regions suggests yes) or per hour, and do steppe/woods cost more fuel?
10. **Resolved (design eb072a2):** Wait and Rest are one action, Stand by; wounds heal meanwhile, faster
    at an FOB (STR-037). STR-037: Wait vs Rest — the design marks Wait as "Open (Rest covers set hours)". Is Wait a separate
    action, and does healing progress during Wait?
11. STR-047: a squad's rank for morale loss — the design gives soldier ranks; how is a squad's rank
    derived (majority, leader, average)? Does it apply per soldier instead?
12. **Resolved (design eb072a2):** yes — the capital can fall and is contested until a faction holds it
    for a set time (STR-007, STR-049); the scatter split stays open. STR-049: when a leader dies, can the capital become `none`? This contradicts STR-007 (capital always
    SSV or VDK). Also: share of scattered squads becoming resistance vs Krug recruits.
13. STR-014/STR-026: income, supply and recruit outputs per POI type and the auto-resolve formula are not
    given.
14. **Resolved (design eb072a2):** the cap of 3 counts world events and desperate measures together
    (STR-050, STR-070); event chances and whether one event may run twice for different subjects stay
    open. STR-050: event chances not given; does the cap of 3 include desperate measures? Can the same event run
    twice for different subjects?
15. STR-055…STR-065: many trigger thresholds are qualitative ("weakly held", "several days", "heavy
    losses", "repeated losses", "strength advantage") with no numbers.
16. **Resolved (design eb072a2):** the garrison joins the faction pressing it (the nearest enemy, or the
    one that attacked it last) or disbands, leaving the POI uncontrolled (STR-061). STR-061: Defection — which faction do defectors join (the one they fought, the strongest neighbour)?
17. STR-067: the Resistance group uses loyalty "toward the controlling faction", supporting per-faction
    loyalty; it becomes a faction — does it count in crisis sign 8 (isolation) and in relations?
18. **Resolved (design 8972470):** Strategic owns every AI faction's funds in the `world` slice; formulas
    in a shared rules table used by MGT too (STR-092, STR-093). STR-069 sign 5 (low liquidity) needs faction-level money (income vs salaries and contract payments)
    for AI factions; the design defines no AI faction economy. Who owns it: STR world or MGT?
19. STR-070: measure durations are not stated; may a faction run a measure and the nuclear strike at the
    same time?
20. STR-080: contamination "HP every turn" is tactical; does it also apply per strategic hour to squads in
    the region? Patron veto chance not given.
21. STR-034: what does "military points of interest may fire on it" do (damage, downing chance)?
22. STR-016: FOB raids are "late game" — no trigger or timing rule.
23. **Resolved (design eb072a2):** a square tile grid, each tile one region, with hex tiles as a
    switchable test option (STR-005, STR-082); the grid size stays unset. STR-082: region count, map size and region shape (grid, hex, Voronoi) not stated.
24. STR-081: flavour event triggers not defined in the GDD (lore only).
25. Workflow starting pipeline (regions → cities → roads → resources → frontline → validate) differs from
    the design order (industry before roads). Spec follows the design order.
26. **Resolved (design eb072a2):** on its origin tile until the move's last hour, then on the
    destination; the encounter tile's terrain sets the tactical map (STR-020, STR-022). STR-003/STR-022: where is a squad during a multi-hour move for encounter purposes (origin,
    destination, both)? Split from question 2.
27. **Resolved (design eb072a2):** hours tick until the first player squad finishes its action or is
    interrupted; longer actions keep running and can be cancelled at that planning phase, keeping the hours
    spent and healing gained, a cancelled move leaving the squad on its origin tile (STR-002, STR-003).
    STR-003: how many hour ticks does one commit run when the player's squads have actions of different
    lengths? Spec assumes ticks run until any player squad's action ends or is interrupted. May the player
    cancel a multi-hour action in progress at a planning phase?
28. STR-003: which events interrupt a multi-hour action (any event naming the squad's region, only
    events that touch the squad)? And do `d = 0` actions (trade, hire) really resolve before the commit,
    given "nothing resolves before that"?
29. **Resolved (design eb072a2):** funds never go below zero; a payment due that the employer cannot
    cover fails the contract at once and the player keeps the advance (STR-092, STR-093); the formulas,
    booking interval and start funds stay open. STR-092: income/cost formulas, booking interval (hourly, daily) and start funds are not given. May
    funds go negative? What does "contracts go unpaid" do to a contract with the player (late pay, debt
    owed to the player, failure)?
30. STR-092: do resistance groups and a rogue PMC get funds (and from what start value) when they become
    factions?
31. STR-093: when the player repays an advance (MGT-048) or pays compensation or a bounty (STR-043), is
    that money credited to the faction's funds?
32. STR-005: on the square grid, are diagonal tiles adjacent (8 neighbours, as on the tactical grid) or
    only the 4 edge neighbours, and do diagonal moves take more hours? The grid size is not set.
33. STR-006: on a tile with a road, which visibility class applies for detection and evasion — the road's
    (asphalt far, dirt medium) or the base terrain's? (A weather modifier for dirt roads is planned for
    later; it is not in the design yet.)
34. STR-007: what are "the capital's effects" a holder gains (leader seat STR-045, crisis sign 6,
    income)? Must the hold time be unbroken control of the capital tile? Do the coup requirements
    (GEN-013) and the holding phase (GEN-015) still apply when the player becomes holder this way?
35. STR-009: villages are named as settlements, but there is no village POI type (towns, small and large
    cities only). Are villages a town variant, a new POI type, or dropped?
36. STR-037: what does "on alert" do for a squad standing by (evasion, no surprise, other)? STR-002: is
    the fuel of a move cancelled or interrupted before its last hour spent?
37. STR-061: which comes first when choosing the pressing faction — the last attacker or the nearest enemy
    (spec: last attacker, else nearest)? The chance of joining vs disbanding is not set.
38. STR-092: under `hardLimit`, must a faction hold the full contract pay when it offers a contract, or
    only the advance? What does raising a squad cost? Under `scoreTerm`, how is spending beyond the funds
    booked when funds still never go below zero?
39. STR-093: when an employer's default fails the contract, does the player lose reputation, and is the
    advance kept free of debt (MGT-048)? What if the advance itself cannot be paid at signing?
40. STR-094 (the command part is answered by `strategic_commands`: an AI faction uses `hireEscort`, STR-021):
    where and when is a Krug escort hired, at what price, and is the Krug's side of it scored by the
    Krug AI or always accepted?
41. STR-033: the vehicle profile (civilian or military) has no stated effect since checkpoints were
    removed (design 44887c7). Does it still matter anywhere (encounter checks, detection, faction
    reactions), or is it display only?
42. STR-059, STR-060: the spec defines a "front sector" as the front tiles within `params.sectorRadius` of
    one front tile and an "area" as the tiles within `params.areaRadius` of a fight. Confirm, or give the
    design's meaning of "part of the front" and "one area".
43. STR-096: how is a squad raised — where (any held POI with recruits, only cities, FOB-like bases), how
    large, with which gear tier, and at what cost? Does recruiting take time?
44. STR-031: does carrying "only what its soldiers carry" leave a squad on foot any supplies store
    (ammunition, medical) beyond the soldiers' own gear, and how does an on-foot squad bring loot home?

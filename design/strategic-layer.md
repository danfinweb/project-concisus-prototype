# Concisus – Strategic Layer

Nov 24, 2026 · @Dan

Module `modules/strategic/`, owns the `world` state: map, territory, faction forces and funds. Part of the [Concisus – Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo), which holds the overview, factions & campaign and the module map.

## Overview

A turn-based region map (JA2 layout, roguelike timing) where the player moves squads, launches operations from its FOBs and manages the PMC's money and reputation.

- **Time:** a 24-hour clock that only runs when the player acts. Every player action takes game time, and for every hour that passes, every faction issues one set of commands and each of its squads takes one action. Moving a vehicle one region takes 1 hour on roads, more on rough terrain (see Terrain types); the destination tile's terrain sets the time, and a road (asphalt or dirt, same speed) overrides it. Fuel is spent per tile moved, a flat amount whatever the terrain (draft: 1 unit per tile), when the squad arrives on the tile: a move cancelled or interrupted before its last hour spends no fuel. Travel and healing progress per hour. Waiting is an action too and passes time. Trading and hiring take no time; resting takes as many hours as the player sets; scouting takes 3 hours (placeholder); a battle always takes 1 hour, however long it runs in real time. The clock runs in full hours only: every duration is a whole number of hours, with no fractions. A day counter starts at Day 1 when the campaign begins, at a start hour set in data (default 06:00), and goes up by one at 00:00. Every point in time is written as day and hour (e.g. Day 14, 06:00) and serves as the time reference for anything in the game, past or future: when an event happened in the news feed, service records and after-action reports, and when a deadline, intel expiry or scheduled event is due. The daily checks (world events, desperate measures, barter deals) run at 00:00.
- **Intel:** fog of war on enemy strength. Recon, informants and drones reveal operation areas, layouts, loot hints and exits.
- **Escalation:** the enemy adapts: better gear, counter-raids on your regions, rival PMC hunt squads (XCOM pressure).

Every player action on the strategic map takes a whole number of hours (some take none) and may cost money, fuel or standing. The full list of strategic actions with their time and costs is in [Strategic actions](https://claude.ai/artifact/DoCjjyCcrZLa6uhd3izwmt).

## Map (draft)

**Draft — not final.** The strategic map is the whole of Veligrad on a square tile grid, consistent with the tactical layer (hex tiles are a switchable option for testing). Each tile connects only to its 4 edge neighbours; there are no diagonal moves. Each tile is one region: one terrain type, at most one point of interest and its controlling faction; a road can lie on top of the terrain. Settlements (cities and towns; a village is a small town variant) also hold civilian loyalty, one value per faction from −100 to 100. Every faction moves its squads across the map tile by tile.

- **The capital** starts in the hands of the SSV or the VDK, but it can fall. If its holder dissolves or loses it, the capital is uncontrolled and contested; whoever holds it for a set time (draft 7 days) becomes its holder; losing the capital resets the timer. The holder gets the leader seat and bonus income (draft: +$3,000 per day). If that is the player, it counts as the coup ending only once the coup requirements are met and the final operation is won, and the holding phase follows; a rival PMC holding it just becomes its holder, and for now only the player's coup ends the campaign (see Coups).
- **Roads connect every point of interest except hidden cities, which only helicopters can reach (hidden cities are an optional feature).** Off-road travel is possible where the terrain allows it. Krug markets are a flag on a town or city tile, not a point of interest of their own. Each strategic terrain type maps to a biome (in a strategic terrain table) that selects the tactical terrain and prefab tables for battles on that tile.
- **Fog of war:** the player sees regions within the recon range of their squads, FOBs and intel sources; everything else shows the last known state.

**Terrain types**

| Terrain | Vehicle (hours per region) | On foot (hours per region) | Visibility | Character |
| --- | --- | --- | --- | --- |
| Asphalt road | 1 | 2 | The tile's terrain | Fastest route; patrols |
| Road (dirt or gravel) | 1 | 2 | The tile's terrain | Connects towns and plants; ambush-prone |
| Steppe | 2 | 2 | Open, long sightlines | Hard to hide; fast off-road with the right tyres |
| Woods | 3 | 2 | Low | Concealment and ambushes |
| Mountain | Roads only | 3 | Low | Slow, defensible, few passes |
| Water | Impassable | Impassable | — | Crossed only at bridges and fords on roads |

**Points of interest**

| Point of interest | Provides | Typical contracts and risks |
| --- | --- | --- |
| Governmental institution | Administration, police post, archives: intel and standing with its controller (draft: $500 per day) | Seize records, protect or remove officials |
| Industrial plant — mechanical | Vehicle parts, repairs, vehicle sales (draft: $1,000 per day) | Steal or protect equipment |
| Industrial plant — chemical | Medical supplies, explosive precursors (draft: $1,000 per day) | Hazard: leaks when fought over (Chemical leak in World events); while a leak lasts (5 days), squads in a leak tile lose HP every strategic hour, as in a contaminated tile (draft: 2 HP per soldier per hour); loot from a leak tile can still be sold |
| Industrial plant — oil | Fuel and high income (draft: $3,000 per day) | Top priority for every faction |
| Industrial plant — arms | Weapons and ammunition (draft: $1,500 per day) | Heavily guarded |
| Industrial plant — minerals | Medium income (draft: $1,500 per day); raises the output of other industrial plants (draft: +10% per mineral plant held, at most +30%) | Worth most to whoever already holds other plants |
| Town | Local recruits (draft: 1 per day), a small Krug market, rest (draft: $300 per day) | Lightly held; easy to lose |
| Small city | Trader, hospital, possible FOB site (draft: $1,000 per day, 2 recruits per day) | Contested garrisons |
| Large city | Several traders, hospitals, contract hub (draft: $2,000 per day, 3 recruits per day) | Urban fighting, heavy faction presence |
| Gas station | Fuel resupply, small loot, Krug contacts (draft: $300 per day) | Ambush point on main roads |

Supply per day (draft): oil and arms plants and large cities 20; mechanical and chemical plants and small cities 10; mineral plants, governmental institutions, towns and gas stations 5. One supply point keeps one soldier supplied for one day.

**Hidden cities (draft, OPTIONAL — ignore for the first build iterations)**

Deep in the woods and mountains lie closed Soviet-era cities (background in Story & Lore). No road leads to them; only a helicopter can get there.

- **Discovery:** hidden on the map until found — through intel, Krug rumours, captured documents, or by flying over them.
- **Industry:** each holds a high-output industrial complex (mechanical, chemical, oil or arms) that yields far more than a normal plant.
- **Prototype items:** the only source of prototype gear — experimental weapons, lightweight high-class armour, advanced optics and thermal sights, prototype drones and electronic-warfare kit.
- **Defence:** guarded by a remnant garrison or by whichever faction found it first; taking one is a major operation.
- **Holding one:** income and prototype production for whoever controls it, which makes it a prime target once others learn where it is.

## Squads and simulation (draft)

Every faction — the SSV, the VDK, Varyag, Aegis, the Krug and the player — fields squads on the map. Each non-player squad has a goal and pursues it with the same rules as the player: it moves, burns fuel, uses supplies and fights.

- **Goals:** patrol, supply run, attack or hold a point of interest, escort, trade route, hunt (a squad sent after a specific target, including the player).
- **Strategic turn:** one strategic turn is one hour of game time. The player's action runs for its duration, and every faction squad takes one action toward its goal for each hour that passes. An action that takes several hours (travel, rest, healing) can be interrupted only by what touches the squad: an encounter, an attack on it, or an event on its own tile; the hours already spent count. Actions that take no time (trading, hiring) resolve at once. The player chooses an action for each of their squads, then commits by ending the turn. Nothing resolves before that: once the turn ends, the actions of all squads, the player's and every AI faction's, resolve together. Hours then tick until the first of the player's squads finishes its action or is interrupted, and the player plans again. Longer actions keep running and can be cancelled at that point: the hours spent and any healing gained are kept, and a move cancelled midway leaves the squad on its origin tile and spends no fuel.
- **Encounters:** when squads are on the same tile in the same hour (a moving squad stays on its origin tile until the move's last hour), the faction behaviour rules decide whether it turns hostile; that tile's terrain sets the tactical map. If the player is involved, it becomes a tactical engagement; the player can also try to evade (Recon and terrain) or, with the Krug, pay their way.
- **Off-screen fights:** battles between non-player squads are resolved automatically from squad strength, gear and terrain; the result changes control, loyalty and supply on the map. Draft shape: each side's strength = soldiers × gear tier, ×1.25 for a defender in woods, mountains or a settlement; the win chance is own strength ÷ both strengths; the loser loses 30–60% of its soldiers, the winner 10–30%. A contract mission between AI factions that is normally judged on the tactical map (kill or capture a VIP, destroy a target) is met when the contractor wins the strategic fight on the target's tile; the mission type decides whether the VIP is killed or captured. The map keeps rank, HP and morale for every AI soldier, so per-soldier rules apply to AI squads as well.
- **Control:** holding points of interest gives factions income, supplies and recruits; losing them weakens their squads over time. This is how the war shifts without the player — and how the player's choices tip it. A faction raises new squads only at towns and cities it holds; squad size and gear tier come from faction data, and raising one costs funds and takes hours before the squad can move (draft: $2,000 per soldier, 12 hours).
- **Operations:** a player op is the player's squad leaving an FOB, moving across this map to its objectives and getting back (see Core loop).

**Faction funds (draft):** the Strategic layer owns every AI faction's money. Income comes from the regions and plants the faction holds; it pays for its squads, salaries and the contracts it offers. The formulas live in a shared rules file that Management also uses for the player's PMC. Contract pay crosses modules through an interface: Strategic deducts it from the employer's funds and Management credits the player. A faction whose income cannot cover its costs meets the Low liquidity crisis sign. Funds never go below zero: by default a faction must hold the full contract pay to offer a contract and cannot raise a squad it cannot pay for (a test mode where funds only weigh in the AI's scoring is a switchable option: funds then show 0, and a hidden overdraft counts the deficit and lowers that faction's AI scores), and a payment due that the employer cannot cover fails the contract at once; the player keeps the advance, owes no debt and loses no reputation. An offer whose advance the employer cannot pay cannot be signed. Strategic makes sure that some faction always has at least one low-risk contract posted (a Retrieve and deliver items mission away from the front, against no faction; see Management), so a PMC that lost its gear can rebuild. Money the player pays a faction (compensation, a bounty pay-off) is credited to that faction's funds; the player never repays an advance, and a contract the player fails costs only reputation. Resistance groups and a rogue PMC get small start funds when they become factions (draft: $20,000); a rogue PMC also keeps the money from its last contract. A Krug escort is hired at a Krug-market tile before the shipment leaves; its price depends on distance and danger (draft price in Strategic actions), and the Krug AI may refuse. A convoy can hire one Krug escort squad; if that squad is not on the convoy's tile, it travels there first, which may delay the departure.

## VIPs

VIPs are high-ranking military officers. A VIP travels with a guard squad and moves between points of interest, so their position must be found before a capture or assassination can be planned. The faction leader is the highest target of all: killing the leader dissolves the faction.

| Rank | Guard | Killed |
| --- | --- | --- |
| Major | 1 squad, mostly Regulars | Morale loss for squads in the same region |
| Colonel | 1–2 squads, mostly Veterans | Morale loss for squads within 3 regions |
| General | 2 squads with Elites | Morale loss for every squad of the faction |
| Faction leader | 3 squads of Elites, stays in the faction's capital or largest city | The faction dissolves: its squads scatter (some become resistance groups or Krug recruits), its points of interest become unowned, its contracts end, and a PMC it backed loses its patron |

Each soldier in the squads reached by the death loses morale by their own rank, so elite troops feel it most: Elite −40, Veteran −25, Regular −10, Recruit −5.

| Intel source | How | Cost |
| --- | --- | --- |
| Scouted in operations | Field orders or a codebook looted from the VIP's faction; a successful scout action in the region the VIP is in | Time and risk |
| Traded for items | The Krug market swaps a VIP location for barter goods or faction items (encrypted radio, codebook) | Goods worth Major $1,500, Colonel $4,000, General $10,000, leader $25,000 |
| Bought from factions | Any faction hostile to the VIP's side sells locations to a PMC with standing ≥ 20; a leader's location only at standing ≥ 50 | Major $2,000, Colonel $5,000, General $12,000, leader $30,000 |

Intel shows the VIP's region and guard size for 72 hours; after that the VIP may have moved and the intel goes stale.

## World events (draft)

**Draft — not final.** There is no story in the traditional sense. A world event system decides how the war develops: events fire from the state of the map, change what factions do for a while, and create contracts and risks for the player.

**How events work**

- **Check:** once per day, every event whose trigger conditions are met rolls its chance. At most three events and desperate measures, counted together, run at the same time.
- **Faction relations:** besides each faction's reputation with the player, factions hold relations toward each other (−100 to 100; starting values in the GDD). Resistance groups hold relations too, but do not count toward the isolation crisis sign. Many events shift these, which changes who attacks whom.
- **Warning signs:** most events show signs a few days ahead (draft: 2–3 days) — intel, Krug rumours, captured documents, unusual squad movements. A player who reads them can prepare, profit or prevent.
- **Player influence:** the player's ops can trigger events (see Operation dispute) or stop them (intercepting a shipment, breaking up an assault).
- **News feed:** started, running and ended events appear in an intel log on the strategic map.
- **Fronts, areas and defection:** a front sector is the front tiles within a set radius of one front tile, and an area is the tiles within a set radius of a fight (draft: 3 and 2 tiles; data). A defecting garrison joins the faction that attacked it last, else the nearest enemy; whether it joins or disbands is a chance in data (draft: 60% join).

The list of events with their triggers, effects, durations and player hooks is in [World events](https://claude.ai/artifact/HJG62N9ZiB6SxKSSrHi67E).

**Desperate measures (draft)**

When a faction is losing badly, it stops playing by its usual rules. There is no separate stat for this: once per day each faction is checked against ten **crisis signs** taken from the simulation.

- **Three or more signs:** desperate measures become possible. The faction picks one that matches its signs; at most one runs at a time.
- **Five or more signs, one of them Capital threatened:** the nuclear strike becomes possible (see World events doc). It may run together with desperate measures, within the shared cap of three; measure durations are data (draft values per measure in World events). The patron's chance to veto the strike is data (draft: 50%), and squads in a contaminated tile lose HP every strategic hour (draft: 2 HP per soldier per hour), spread evenly over all body zones.

The ten crisis signs and the measures each faction can pick are listed in [World events](https://claude.ai/artifact/HJG62N9ZiB6SxKSSrHi67E).

**Flavour events (no gameplay effect)**

Flavour events appear only in the news feed, on radio intercepts or as visual changes on the map. Each eligible tile or situation has a small random chance per day to show one (draft: 0.5%, as in Story & Lore); they have no gameplay effect. The event list is in [Concisus – Story & Lore](https://claude.ai/artifact/QKZMoCYw1dk6DrBsicjvS8).

## Map generation (draft)

Every playthrough generates a new Veligrad from logical parameters, in this order:

1. **Land:** an elevation and moisture map places mountains (mostly along borders), rivers and lakes (flowing out of the mountains), woods (wet and hilly ground) and steppe (dry lowland).
2. **Capital:** placed on low ground near a river, roughly central.
3. **Cities:** large and small cities placed with minimum spacing, preferring rivers and lowland.
4. **Industry by resource logic:** oil plants in steppe basins, mechanical plants near mountains and cities, chemical plants on rivers, arms plants near the capital or large cities, mineral plants in mountains and hills.
5. **Towns, governmental institutions:** towns fill the gaps; every city and the capital get governmental institutions.
6. **Roads:** asphalt roads link the capital and cities (a spanning network plus a few extra loops); dirt roads link towns and plants to it; bridges and fords where roads cross water; gas stations at intervals along asphalt roads.
7. **War state:** a front line splits the map between the SSV and the VDK; the capital goes to one side. Varyag and Aegis sit behind their patrons' lines, the Krug in the contested belt between them.
8. **Start:** the player's first FOB is placed in a quiet region away from the front.

**Validation rules:** every point of interest except hidden cities is reachable by road; the capital is reachable from every city; each side holds at least one oil and one arms plant; the player's start has a town and a gas station within a few regions; optional: 1–3 hidden cities sit deep in woods or mountains, several regions from any road, with landable ground around them.

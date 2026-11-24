# Concisus – Game Design Document

Nov 22, 2026 · @Dan

The design is split along the game's modules, as defined in [Sloperator — Development Workflow](https://claude.ai/artifact/MtPiB5ywYhqZWJ1WV7CWog). Each module section is the source for that module's spec; Overview and Factions & campaign apply to all modules. Story and lore are kept in a separate doc, Concisus – Story & Lore.

| Section | Module | State it owns |
| --- | --- | --- |
| Overview, Factions & campaign | All modules | — |
| Strategic Layer | `modules/strategic/` | `world`: map, territory, faction forces and funds |
| Tactical Layer | `modules/tactical/` | `battle` |
| Management | `modules/management/` | `roster`, `unlocks`, `economy`, `contracts`, `reputation` |
| AI | `modules/strategic-ai/`, `modules/tactical-ai/` | — (issues player commands) |
| Data definitions | `/data`, authored with the tools | — (static definitions) |
| Presentation & tech | `game/` shell | — |

## Overview

### Vision & pitch

**One-liner:** Run a private military company in a modern proxy war — hire mercenaries, launch turn-based operations from your forward bases, and bring home whatever you can carry, knowing that everything you bring in can be lost.

**Design pillars**

1. **Faceless and disposable** — soldiers are generated, interchangeable contractors with no authored personality. Attachment forms only through the story the player shares with a soldier: the deployments survived, the wounds carried, the comrades lost.
2. **Every operation is a gamble** — gear you take in is at risk; loot you bring out funds the war. Retreat is always an option, and often the smart one.
3. **Grounded, readable tactics** — realistic weapons and ballistics, but every hit chance and risk is legible to the player.
4. **A war that answers every move** — the strategic map runs like a classic roguelike: time only passes when the player acts, and every hour that passes gives every faction squad an action of its own. Nothing happens while the player thinks; everything happens because the player acts.

**What we take from each reference**

| Reference | We take | We leave behind |
| --- | --- | --- |
| Jagged Alliance 2 | Hiring/contracts, region-by-region liberation, open strategic map | Authored merc personalities, dated UI, opaque hit chances |
| X-Com / XCOM | Generated soldiers the player grows attached to, turn-based squad combat, permadeath, strategic pressure and escalation | Alien threat, mission-select-only map, 2-action-point simplification, base building, research tree |
| Escape from Tarkov | Gear risk, extraction, loot economy, deep weapon modding, weight-limited inventory, medical/injury detail | Real-time FPS, PvP, punishing grind |

**Target:** Browser game for desktop and mobile, single-player, 40–60 hour campaign with high replayability. 3D with a PSX-era low-poly look, lifted by modern real-time lighting.

### Core loop

The unit of play is the **operation** (short: **op**), not a fixed mission. Every op starts at one of the player's FOBs on the strategic map: the player sets the objectives, picks the squad and loadout, moves out, fights the tactical engagements the objectives require, and returns to an FOB. **An op succeeds when at least one soldier gets back to an FOB** — objectives met or not. A contract's missions count as completed as soon as their goal is met, even if the squad is lost afterwards. The layer where the goal is met detects it at once and shows "Objective met" (tactical: a VIP killed, or captured once the player's side carries them off the map; a target destroyed; cargo saved once it leaves the map, carried or in a convoy vehicle; strategic: a delivery, a hand-over, a place held long enough). The strategic layer confirms the mission, and the pay is deducted from the employer's funds and credited to the player at the next strategic hour, with a news-feed line; no mission needs the squad back at an FOB.

&#91;embedded content: core loop · FOB → operation → return\]

Objectives come from employer contracts (missions such as escorting a shipment or capturing a VIP) or from the player (scout a region, scavenge, resupply), and one op can bundle several. A squad that doesn't make it back still costs the PMC: dead or missing soldiers and lost gear raise the stakes of the next op.

## Factions & campaign

This section covers how the factions and the campaign work in play. Setting, history, tone, faction backgrounds, leaders' habits and flavour events are in [Concisus – Story & Lore](https://claude.ai/artifact/QKZMoCYw1dk6DrBsicjvS8).

### Factions

| Faction | Leader | Role for the player (draft) |
| --- | --- | --- |
| Socialist State of Veligrad (SSV) | Marshal Mikhail Orlov | Employer: reliable pay, harsh methods; its contracts often target the VDK |
| Veligrad Democratic Coalition (VDK) | Aleksandr Volkov | Employer: idealistic but deniable — late payments, contracts that can be disowned |
| Varyag Solutions | Anton Sokolov | Rival PMC (SSV-aligned): Soviet doctrine with modern tactics; hunts player ops, competes for contracts |
| Aegis Group | Daniel Rook | Rival PMC (VDK-aligned): better-equipped, high-tech; the same threat from the other side |
| The Krug | Viktor Karsin | Trader, smuggling routes, neutral markets, local recruits; a fair partner with predictable, unforgiving rules |
| Player's PMC | The player | Can serve one side, play both, or become a power of its own |

Off the map, the **eastern influence** and the **western influence** shape the war through deliveries, intelligence and escalation — never openly, and never by name. The **civilian population** is a non-combat faction: its loyalty per region drives income, intel and recruitment.

### Leaders

Each leader's personal habit (see Story & Lore) has one effect in play.

| Leader | Faction | Effect in play |
| --- | --- | --- |
| Marshal Mikhail Orlov | SSV | Contracts arrive as formal written orders; breaches of protocol cost standing. |
| Aleksandr Volkov | VDK | Meetings with the VDK move at short notice; his whereabouts are sensitive information. |
| Anton Sokolov | Varyag Solutions | Now and then the player receives a letter naming a fallen soldier's callsign. |
| Daniel Rook | Aegis Group | Aegis learns the player's habits and adapts to them over time. |
| Viktor Karsin | The Krug | Debts with the Krug are literal entries in his book; paying one clears it. |

### The Krug

The Krug runs by its own Code: hard, public and the same for members, outsiders and the player (origin in Story & Lore).

**In play**

- Krug markets are no-fire zones and neutral meeting points; breaking the peace there turns the whole network hostile.
- Standing with the Krug is earned by keeping deals; it unlocks better stock, smuggling routes for ops, safe houses and local recruits.
- Some Krug members resent all foreign soldiers, including the player's.

### Player role

- **Contractor first, kingmaker later:** early contracts come from one side; mid-game the player can switch sides, work both or go independent.
- **Endings:** Veligrad united under the SSV or the VDK, reformed, locked into an endless proxy war, or seized by the player's PMC in a coup — or the PMC cashes out and leaves.
- **No authored story:** there is no plot and no acts. Developments on the map come from the world event system (see World events in the Strategic layer); personal stories come from soldiers' service records.
- **Region:** the whole country, divided into small regions and generated anew each playthrough (see Strategic layer).

### Coups

Any armed company strong enough to hold the capital can try.

**Player coup (ending)**

- **Requirements (draft):** the PMC controls the capital's approaches and a set number of key regions, has enough soldiers, and both the SSV and the VDK are exhausted. Civilian loyalty and the Krug's stance decide how hard it gets.
- **The final operation:** a multi-stage op on the capital — seize command, communications and the government district — launched from the closest FOB.
- **Holding on:** after the coup the eastern and western influence both turn against the PMC. The player must hold the capital through counter-attacks until one side accepts the new order.
- **Epilogue:** shaped by how the PMC took and holds power — civilian loyalty, standing with the Krug, and how many soldiers it cost.

**Rogue PMCs (rare event)**

- **Chance:** checked once per day: the more crisis signs its patron shows (low funds, troop losses, lost territory), the higher the chance that Varyag Solutions or Aegis Group stops serving it and attempts a coup of its own; warning signs come first. A capital that loses its holder can also trigger a PMC rushing it. At most one per campaign.
- **What raises it:** its patron is losing, its contracts go unpaid, or it controls regions near the capital.
- **Warning signs:** intel the player can find or miss — unusual troop movements, large arms purchases reported by the Krug, contractors pulled off the front.
- **What follows:** a new power on the map. The SSV and the VDK may hire the player to stop it; the player can also side with it, or stay out. If the rogue PMC holds the capital, it becomes the main antagonist for the rest of the campaign.

**Open questions**

- [ ] Could the Krug be an ending of its own — Veligrad run by the Code instead of a government?

## Strategic Layer

A turn-based region map (JA2 layout, roguelike timing) where the player moves squads, launches operations from its FOBs and manages the PMC's money and reputation.

- **Time:** a 24-hour clock that only runs when the player acts. Every player action takes game time, and for every hour that passes, every faction issues one set of commands and each of its squads takes one action. Moving a vehicle one region takes 1 hour on roads, more on rough terrain (see Terrain types); the destination tile's terrain sets the time, and a road (asphalt or dirt, same speed) overrides it. Travel and healing progress per hour. Waiting is an action too and passes time. Trading and hiring take no time; resting takes as many hours as the player sets; scouting takes 3 hours (placeholder); a battle always takes 1 hour, however long it runs in real time. The clock runs in full hours only: every duration is a whole number of hours, with no fractions. A day counter starts at Day 1 when the campaign begins and goes up by one at 00:00. Every point in time is written as day and hour (e.g. Day 14, 06:00) and serves as the time reference for anything in the game, past or future: when an event happened in the news feed, service records and after-action reports, and when a deadline, intel expiry or scheduled event is due. The daily checks (world events, desperate measures, barter deals) run at 00:00.
- **Intel:** fog of war on enemy strength. Recon, informants and drones reveal operation areas, layouts, loot hints and exits.
- **Escalation:** the enemy adapts: better gear, counter-raids on your regions, rival PMC hunt squads (XCOM pressure).

Every player action on the strategic map takes a whole number of hours (some take none) and may cost money, fuel or standing. The full list of strategic actions with their time and costs is in [Strategic actions](https://claude.ai/artifact/DoCjjyCcrZLa6uhd3izwmt).

### Map (draft)

**Draft — not final.** The strategic map is the whole of Veligrad on a square tile grid, consistent with the tactical layer (hex tiles are a switchable option for testing). Each tile is one region: one terrain type, at most one point of interest and its controlling faction; a road can lie on top of the terrain. Settlements (cities, towns, villages) also hold civilian loyalty, one value per faction from −100 to 100. Every faction moves its squads across the map tile by tile.

- **The capital** starts in the hands of the SSV or the VDK, but it can fall. If its holder dissolves or loses it, the capital is uncontrolled and contested; whoever holds it for a set time (draft 7 days) becomes its holder. If that is the player, it counts as the coup ending; a rival PMC holding it just becomes its holder, and for now only the player's coup ends the campaign (see Coups).
- **Roads connect every point of interest except hidden cities, which only helicopters can reach (hidden cities are an optional feature).** Off-road travel is possible where the terrain allows it. Krug markets are a flag on a town or city tile, not a point of interest of their own. Each strategic terrain type maps to a biome (in a strategic terrain table) that selects the tactical terrain and prefab tables for battles on that tile.
- **Fog of war:** the player sees regions within the recon range of their squads, FOBs and intel sources; everything else shows the last known state.

**Terrain types**

| Terrain | Vehicle (hours per region) | On foot (hours per region) | Visibility | Character |
| --- | --- | --- | --- | --- |
| Asphalt road | 1 | 2 | Seen from far | Fastest route; patrols |
| Road (dirt or gravel) | 1 | 2 | Medium | Connects towns and plants; ambush-prone |
| Steppe | 2 | 2 | Open, long sightlines | Hard to hide; fast off-road with the right tyres |
| Woods | 3 | 2 | Low | Concealment and ambushes |
| Mountain | Roads only | 3 | Low | Slow, defensible, few passes |
| Water | Impassable | Impassable | — | Crossed only at bridges and fords on roads |

**Points of interest**

| Point of interest | Provides | Typical contracts and risks |
| --- | --- | --- |
| Governmental institution | Administration, police post, archives: intel and standing with its controller | Seize records, protect or remove officials |
| Industrial plant — mechanical | Vehicle parts, repairs, vehicle sales | Steal or protect equipment |
| Industrial plant — chemical | Medical supplies, explosive precursors | Hazard: leaks when fought over |
| Industrial plant — oil | Fuel and high income | Top priority for every faction |
| Industrial plant — arms | Weapons and ammunition | Heavily guarded |
| Industrial plant — minerals | Medium income; raises the output of other industrial plants (modifier size TBD) | Worth most to whoever already holds other plants |
| Town | Local recruits, a small Krug market, rest | Lightly held; easy to lose |
| Small city | Trader, hospital, possible FOB site | Contested garrisons |
| Large city | Several traders, hospitals, contract hub | Urban fighting, heavy faction presence |
| Gas station | Fuel resupply, small loot, Krug contacts | Ambush point on main roads |

**Hidden cities (draft, OPTIONAL — ignore for the first build iterations)**

Deep in the woods and mountains lie closed Soviet-era cities (background in Story & Lore). No road leads to them; only a helicopter can get there.

- **Discovery:** hidden on the map until found — through intel, Krug rumours, captured documents, or by flying over them.
- **Industry:** each holds a high-output industrial complex (mechanical, chemical, oil or arms) that yields far more than a normal plant.
- **Prototype items:** the only source of prototype gear — experimental weapons, lightweight high-class armour, advanced optics and thermal sights, prototype drones and electronic-warfare kit.
- **Defence:** guarded by a remnant garrison or by whichever faction found it first; taking one is a major operation.
- **Holding one:** income and prototype production for whoever controls it, which makes it a prime target once others learn where it is.

### Squads and simulation (draft)

Every faction — the SSV, the VDK, Varyag, Aegis, the Krug and the player — fields squads on the map. Each non-player squad has a goal and pursues it with the same rules as the player: it moves, burns fuel, uses supplies and fights.

- **Goals:** patrol, supply run, attack or hold a point of interest, escort, trade route, hunt (a squad sent after a specific target, including the player).
- **Strategic turn:** one strategic turn is one hour of game time. The player's action runs for its duration, and every faction squad takes one action toward its goal for each hour that passes. An action that takes several hours (travel, rest, healing) can be interrupted by an encounter or an event; the hours already spent count. The player chooses an action for each of their squads, then commits by ending the turn. Nothing resolves before that: once the turn ends, the actions of all squads, the player's and every AI faction's, resolve together. Hours then tick until the first of the player's squads finishes its action or is interrupted, and the player plans again. Longer actions keep running and can be cancelled at that point: the hours spent and any healing gained are kept, and a move cancelled midway leaves the squad on its origin tile.
- **Encounters:** when squads are on the same tile in the same hour (a moving squad stays on its origin tile until the move's last hour), the faction behaviour rules decide whether it turns hostile; that tile's terrain sets the tactical map. If the player is involved, it becomes a tactical engagement; the player can also try to evade (Recon and terrain) or, with the Krug, pay their way.
- **Off-screen fights:** battles between non-player squads are resolved automatically from squad strength, gear and terrain; the result changes control, loyalty and supply on the map.
- **Control:** holding points of interest gives factions income, supplies and recruits; losing them weakens their squads over time. This is how the war shifts without the player — and how the player's choices tip it.
- **Operations:** a player op is the player's squad leaving an FOB, moving across this map to its objectives and getting back (see Core loop).

**Faction funds (draft):** the Strategic layer owns every AI faction's money. Income comes from the regions and plants the faction holds; it pays for its squads, salaries and the contracts it offers. The formulas live in a shared rules file that Management also uses for the player's PMC. Contract pay crosses modules through an interface: Strategic deducts it from the employer's funds and Management credits the player. A faction whose income cannot cover its costs meets the Low liquidity crisis sign. Funds never go below zero: by default a faction cannot offer a contract or raise a squad it cannot pay for (a mode where funds only weigh in the AI's scoring is a switchable option for testing), and a payment due that the employer cannot cover fails the contract at once; the player keeps the advance.

### **VIPs**

VIPs are high-ranking military officers. A VIP travels with a guard squad and moves between points of interest, so their position must be found before a capture or assassination can be planned. The faction leader is the highest target of all: killing the leader dissolves the faction.

| Rank | Guard | Killed |
| --- | --- | --- |
| Major | 1 squad, mostly Regulars | Morale loss for squads in the same region |
| Colonel | 1–2 squads, mostly Veterans | Morale loss for squads within 3 regions |
| General | 2 squads with Elites | Morale loss for every squad of the faction |
| Faction leader | 3 squads of Elites, stays in the faction's capital or largest city | The faction dissolves: its squads scatter (some become resistance groups or Krug recruits), its points of interest become unowned, its contracts end, and a PMC it backed loses its patron |

Squads reached by the death lose morale by their own rank, so elite troops feel it most: Elite −40, Veteran −25, Regular −10, Recruit −5.

| Intel source | How | Cost |
| --- | --- | --- |
| Scouted in operations | Field orders or a codebook looted from the VIP's faction; a successful scout action in the region the VIP is in | Time and risk |
| Traded for items | The Krug market swaps a VIP location for barter goods or faction items (encrypted radio, codebook) | Goods worth Major $1,500, Colonel $4,000, General $10,000, leader $25,000 |
| Bought from factions | Any faction hostile to the VIP's side sells locations to a PMC with standing ≥ 20; a leader's location only at standing ≥ 50 | Major $2,000, Colonel $5,000, General $12,000, leader $30,000 |

Intel shows the VIP's region and guard size for 72 hours; after that the VIP may have moved and the intel goes stale.

### World events (draft)

**Draft — not final.** There is no story in the traditional sense. A world event system decides how the war develops: events fire from the state of the map, change what factions do for a while, and create contracts and risks for the player.

**How events work**

- **Check:** once per day, every event whose trigger conditions are met rolls its chance. At most three events and desperate measures, counted together, run at the same time.
- **Faction relations:** besides each faction's reputation with the player, factions hold relations toward each other (−100 to 100). Many events shift these, which changes who attacks whom.
- **Warning signs:** most events show signs a few days ahead — intel, Krug rumours, captured documents, unusual squad movements. A player who reads them can prepare, profit or prevent.
- **Player influence:** the player's ops can trigger events (see Operation dispute) or stop them (intercepting a shipment, breaking up an assault).
- **News feed:** started, running and ended events appear in an intel log on the strategic map.

The list of events with their triggers, effects, durations and player hooks is in [World events](https://claude.ai/artifact/HJG62N9ZiB6SxKSSrHi67E).

**Desperate measures (draft)**

When a faction is losing badly, it stops playing by its usual rules. There is no separate stat for this: once per day each faction is checked against ten **crisis signs** taken from the simulation.

- **Three or more signs:** desperate measures become possible. The faction picks one that matches its signs; at most one runs at a time.
- **Five or more signs, one of them Capital threatened:** the nuclear strike becomes possible (see World events doc).

The ten crisis signs and the measures each faction can pick are listed in [World events](https://claude.ai/artifact/HJG62N9ZiB6SxKSSrHi67E).

**Flavour events (no gameplay effect)**

Flavour events appear only in the news feed, on radio intercepts or as visual changes on the map. The event list is in [Concisus – Story & Lore](https://claude.ai/artifact/QKZMoCYw1dk6DrBsicjvS8).

### Map generation (draft)

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

## Tactical Layer

Turn-based squad combat on destructible 3D maps, with JA2-style action points and XCOM-style readability.

- **Turn structure:** alternating soldier activations with stamina-limited reactions (see Turn structure below). Turn-based from the first moment on the map, including stealth: there is no real-time exploration phase.
- **Action points (decided):** each soldier's AP per activation are derived from their stats, so a fast, skilled veteran does more per activation than a rookie. AP is spent on movement, stance, aiming, reloading, medical and gear actions; aiming longer raises accuracy.
  - Turn modifiers: over-encumbrance and suppression reduce the pool for that activation.
  - Action costs also scale with stats and gear exactly as listed in Tactical actions, which is the single source for every cost and its modifiers; Strength lowers the penalty for heavy kit.
- **Camera (decided):** isometric 3D camera with smooth zoom — zoomed out for planning across the map, zoomed in to read cover, stance and gear. Fixed default angle; walls and roofs cut away around selected soldiers and the cursor, and units behind cover show as outlines. Optional 90° rotation (Q/E on PC, a rotate button on mobile) with a snap-back-to-default button and a compass, so the game stays fully playable without ever rotating. Assets are built to read from all four sides. Mouse wheel on PC, pinch on mobile.
- **Movement (decided):** grid-based on square tiles (about 1.5 m), 8 directions, diagonals cost more AP.
  - Each tile has a terrain cost (road, grass, mud, rubble, stairs); crouching adds to the cost, crawling while prone adds more. Soldiers are upright, crouched or prone (see Stance under Body zones); changing stance costs AP, getting up from prone the most.
  - Multi-level grid: floors, roofs, ladders and windows to vault.
  - Cover is set per tile edge (half or full), so the preview can show exactly where a soldier is protected. Destruction updates the grid immediately, mid-turn: after every explosion or breach, cover, paths, AP costs and line of sight recalculate, and reactions can trigger on newly opened sightlines.
  - Path preview shows AP cost and where the activation's AP run out. On mobile: tap a tile to preview, tap again to confirm.
- **Ballistics:** per-load penetration class vs. armour class, hit locations (head, thorax, left and right arm, left and right leg — see Body zones and hitboxes), bullet travel, suppression.
- **Cover & visibility:** half/full cover, destructible materials, noise levels, line of sight shown before committing.
- **Readability:** every shot previews hit %, likely body zone and whether the round penetrates.
- **Enemy AI:** squads with roles (flank, suppress, retreat, call reinforcements). Units of non-hostile factions on the same map follow their own objectives and only engage under the faction behaviour rules (see Strategic layer).

**Time of day:** every battle takes exactly 1 hour of game time, however long it runs in real time, and uses the strategic clock's time when it starts. Battles starting from 06:00 up to (not including) 21:00 are day battles; battles starting from 21:00 up to (not including) 06:00 are night battles, where sight and spotting ranges drop to a third unless the soldier has a flashlight (see Art direction).

### Turn structure (draft)

Combat alternates one soldier at a time between the sides. There are no rounds: stamina alone decides how often a soldier can act and react.

**Turns and activation**

1. A **turn** is one player activation followed by one opponent activation.
2. Each side picks **any** soldier with stamina left — including the one it used last turn — and spends that soldier's action points (AP). AP refill with every activation.
3. Every soldier **not** activated in a turn recovers stamina.
4. A side with no soldier able to act must pass; its soldiers recover while the other side keeps acting. A side may also pass by choice.
5. **Stall rule:** if no soldier sees or hears an enemy for 2 turns of passing, turns advance automatically (stamina recovers) until someone is seen or heard, or a soldier acts. The player can stop the advance at any time by activating a soldier.
6. Effects with a duration (bleeding, smoke) are counted in turns. A soldier who is hit, whose cover is hit, or within 1 tile of whom an enemy shot lands, is **suppressed**: −5 AP, wider spread and no reactions, until one full turn passes without such hits.

A tactical map has the player's side — which can include allied units under AI control, such as defenders, a convoy or an escorted VIP — and one opponent. Units that are hostile to neither (a non-involved faction, civilians) form a third, neutral side controlled by the tactical AI; it turns hostile toward whoever attacks it. Until attacked, neutral units never activate: they only react (take cover, flee). A neutral unit that turns hostile joins the turn order as a third side, with its own activation after the opponent's in every turn, controlled by the tactical AI.

**Stamina**

Each soldier has a small stamina pool, counted in stamina points. Spending is twice as fast as recovering: an activation costs 2 stamina points, a skipped turn restores 1.

| Rule | Draft value |
| --- | --- |
| Maximum stamina | 2 + Endurance ÷ 20, rounded down (2–7 stamina points). E.g. Endurance 50 → 4; 90 → 6 |
| Activation | Costs 2 stamina points; +1 if the soldier sprinted or is over carry capacity |
| Reaction attempt | Costs 1 stamina point, success or not |
| Recovery | +1 stamina point for every turn the soldier is not activated |
| Exhausted | Below 2 stamina points a soldier cannot be activated; at 0 they cannot react either |
| Modifiers | Each wounded or disabled leg lowers the maximum by 1 |

Example: a soldier with 4 stamina points can act twice in a row, or act once and react twice, then needs a few turns off. Rotating the squad keeps everyone close to full; leaning on one soldier drains them fast.

**Vision and facing**

- Every soldier has a 120° vision cone; line of sight only counts inside it.
- Turning during an activation costs AP; the final facing at the end of an activation is set for free and is a key decision.
- Gunfire or loud noise outside the cone turns the soldier toward it, without triggering a reaction.

**Sight and spotting (draft)**

- **Day sight range:** 25 + 0.25 × Perception + 0.1 × Recon tiles (25–60 tiles; an average soldier about 42 tiles, 63 m). At night a third of that without a flashlight.
- **Spotting:** an enemy in line of sight is seen when its distance is at most sight range × its concealment. Concealment = (1 − (0.4 × Recon + 0.1 × Agility) ÷ 100) × stance factor (upright 1.0, crouched 0.8, prone 0.6). No roll: the player can read who sees whom. E.g. an average enemy crouching (0.75 × 0.8 = 0.6) is seen within about 25 tiles.
- **Flashlight:** an enemy inside a lit flashlight's cone within 10 tiles is blinded: +4 MoA shooter spread until the end of their next activation.

**Gunshot noise**

Shots are heard by distance only — three cases, no noise values:

| Shot | Heard within |
| --- | --- |
| Unsuppressed | The whole tactical map |
| Suppressed | 18 tiles |
| Suppressed with subsonic ammo | 6 tiles |

Soldiers who hear a shot become alerted: at the start of their next activation they turn toward it for free, and a marker shows their side (and the AI) where the noise came from. A helmet with a hearing penalty halves the suppressed ranges (9 and 3 tiles).

**Reactions**

- **Trigger:** an opposing soldier moves into or through the reactor's vision cone with line of sight.
- **Reaction setting:** chosen per soldier during their activation — *Fire*, *Take cover* or *Hold* (stay hidden, no reaction). The game applies it automatically; no prompts mid-move.
- **Cost and limit:** each attempt costs 1 stamina point; there is no other cap.
- **Success chance:** 50 + (reactor's Perception − mover's Agility) / 2, limited to 10–90%. Adjusted before that limit (draft): distance −1 per 2 tiles beyond 10 tiles (at most −20); mover crouched −10, prone −20, sprinting +15; the mover's noise −(its Recon ÷ 10); reactor in pain −10 and −5 per wounded or disabled limb.
- **On success:** the reaction resolves before the mover continues. *Fire* is a single shot with normal hit chance and a snap-shot penalty; a soldier on overwatch (see Tactical actions) fires in the weapon's current mode without that penalty. *Take cover* moves the reactor to the nearest tile with cover within 1 tile, or makes them crouch if there is none; a prone reactor with no cover tile stays prone. A reaction move never triggers reactions from other soldiers. The mover then spends any AP left.
- **On failure:** the mover passes unnoticed by that soldier; the stamina point is still spent.

### **Actions and costs (draft)**

Every action spends AP within an activation, and activations and reactions spend stamina points (see Turn structure). Costs come from a base value per action, changed by attributes, gear and wounds as the rules above describe. The full list of actions with their costs and formulas is in [Tactical actions](https://claude.ai/artifact/AAamT6WGHuQ4C4C8VQxqvA).

### **Hit model (draft)**

- Total spread = Base MoA × ammo modifier + shooter spread (Marksmanship, Perception at range, stance, aiming time, wounds).
- Hit chance = the share of the spread cone covered by the target's visible body zones after cover; the same calculation gives the likely body zone in the shot preview.
- Each extra round in a burst adds recoil spread, reduced by Marksmanship and Strength (see below).

**Shooter spread and recoil (draft)**

- **Shooter spread** (MoA) = (skill spread + range spread) × stance factor × 0.85 per aim step + penalties.
  - Skill spread = 8 − 7 × Marksmanship ÷ 100 (7.9 at Marksmanship 1, 4.5 at 50, 1.0 at 100).
  - Range spread (Perception at range) = (100 − Perception) ÷ 100 × 0.05 MoA per tile beyond 20 tiles.
  - Stance factor: upright 1.0, crouched 0.8, prone 0.6.
  - Penalties (added): suppressed +3, pain +1.5, arm fracture +2, snap shot (Fire reaction) +3, blinded +4.
  - Optics multiply the range spread, lasers multiply shooter spread on snap shots (values per item).
- **Weapon condition** widens the weapon's own spread: Base MoA × (1 + 0.5 × (100 − Condition) ÷ 100), up to ×1.5 at Condition 0.
- **Burst recoil:** each extra round adds 0.04 × effective recoil × (1 − recoil control), adding up round by round. Recoil control = 0.4 × Marksmanship ÷ 100 + 0.2 × Strength ÷ 100 (0–0.6). Tracer rounds lower it ×0.85.
- **Example:** an average soldier (Marksmanship 50) standing, no aim, with an AK-74M (Base MoA 5): 4.5 + 5 = 9.5 MoA, a 1.6 m cone at 33 tiles. Prone with 3 aim steps: 6.65 MoA, 1.1 m. Each extra AK-74M round in a burst adds about 0.9 MoA for that soldier.

**Decision: MoA is simulated.** Every shot is a real spread cone tested against the target's silhouette and cover, not a range-band table.

- **Per shot:** pick a point inside the cone (normal distribution, most shots near the centre; the cone's edge is two standard deviations out, so about 95% of shots land inside it) and trace it against simple hit volumes per body zone and against cover.
- **Shot preview:** the hit chance and likely body zone shown before firing come from the same model, sampled (about 300 traces), so the number shown matches the result statistically, within a few percent; the real shot is a fresh roll. The preview samples with its own random stream, so looking at a preview never changes a real shot or a replay.
- **Performance:** hit volumes are low-poly boxes per body zone, which keeps sampling cheap enough for phones.
- **Payoff:** distance, cover, stance, barrel, ammo and optics all change the result through one mechanism, and modding has a visible effect on every shot.

### **Derived per shot (draft)**

- Muzzle damage = calibre damage × ammo damage modifier × barrel multiplier.
- Penetration class comes from the ammo alone; barrel length and distance do not change it.
- Damage at distance = muzzle damage × (1 − falloff share × tiles ÷ falloff range), never below 10% of muzzle damage. Both values come from the loaded ammo. E.g. 6% per 15 tiles: −6% at 15 tiles, −12% at 30 tiles.
- Effective recoil = gun Recoil × calibre recoil modifier.
- Armour classes 1–6. A round penetrates when its penetration class is at least the armour class. Once armour drops below 50% condition, a round one class lower can also get through, with a chance of 50 minus the condition percentage (40% condition → 10%, 20% → 30%). Otherwise the hit is blocked and deals blunt damage = 20% of the damage at that distance, so stopped rounds still hurt. Blunt damage can cause pain but never bleeding, and the 10% floor does not apply to it. Armour worn down to 0 durability no longer protects.
- Ammo marked subsonic, fired through a suppressor, are heard only within 6 tiles (see Gunshot noise).

**Armour wear and weapon condition (draft)**

- Every hit on an armour piece wears it, blocked or not: durability − 10% of the damage at that distance for a blocked hit, − 5% for a penetrating one, rounded up, at least 1. Ceramic plates wear ×1.5. E.g. 6B23 (durability 60) lasts about 12 blocked AK-74M hits.
- Arms and legs carry no armour yet; armour items may later list the zones they cover.
- **Jamming:** each shot action jams with a chance of 10% × ((100 − Condition) ÷ 100)² (0% at Condition 100, 2.5% at 50, 10% at 0). A jammed weapon cannot fire until the jam is cleared (see Tactical actions). A gun loses 1 Condition per 50 rounds fired.

### Body zones and hitboxes (draft)

**Draft — not final.** Six zones: head, thorax, left arm, right arm, left leg and right leg. Each is one simple box that the MoA spread cone is traced against, and each has its own health pool.

**Hitboxes for an upright soldier (about 1.80 m tall)**

| Zone | Boxes | Size (width × depth × height) | Height above ground | Share of front silhouette |
| --- | --- | --- | --- | --- |
| Head | 1 | 0.22 × 0.25 × 0.25 m | 1.53–1.78 m | \~8% |
| Thorax | 1 | 0.40 × 0.25 × 0.55 m | 0.95–1.50 m | \~30% |
| Left arm | 1 | 0.12 × 0.12 × 0.60 m | 0.85–1.45 m, left of the thorax | \~10% |
| Right arm | 1 | 0.12 × 0.12 × 0.60 m | 0.85–1.45 m, right of the thorax | \~10% |
| Left leg | 1 | 0.16 × 0.16 × 0.95 m | 0.00–0.95 m | \~21% |
| Right leg | 1 | 0.16 × 0.16 × 0.95 m | 0.00–0.95 m | \~21% |

While aiming, the arm boxes swing forward and partly shield the thorax from the front. The thorax box includes the abdomen.

**Stance**

- **Crouched:** total height about 1.20 m; legs folded under the thorax, head at about 1.00–1.20 m. Half cover hides the legs and most of the thorax.
- **Prone:** lying flat, total height about 0.40 m, the body stretched out along the facing. From the front only the head, the arms (when aiming) and the top of the thorax show; from the side the whole body shows. Half cover hides a prone soldier completely until they fire over it. Prone gives the lowest shooter spread, but no sprinting, vaulting or climbing.
- **Cover:** half cover (tile edge about 1.0 m high) hides an upright soldier's legs and lower thorax; full cover hides everything until the soldier leans or fires over it.

**Health and effects per zone**

| Zone | Base HP | Armour | Damage effects | At 0 HP |
| --- | --- | --- | --- | --- |
| Head | 35 | Helmet | Chance to stun (35%, also from blunt hits): the soldier loses AP on the next activation | Death |
| Thorax | 85 | Body armour (plates front and back) | High bleeding chance | Death |
| Left arm, right arm (each) | 60 | Usually none | Wounded (below 50% HP): shooting cone and grenade scatter ×1.5; the worse arm counts | Disabled: shooting cone and grenade scatter ×2 |
| Left leg, right leg (each) | 70 | Usually none | Wounded (below 50% HP): +1 AP per tile per wounded leg; maximum stamina −1 per wounded leg | Disabled: movement cost ×2 (once, however many legs); a leg fracture ×1.5 stacks on top |

- Endurance modifies the base HP of every zone: × (0.5 + 0.75 × Endurance / 100). Frail soldiers start well below the base values (Endurance 20 = ×0.65, Endurance 40 = ×0.8), Endurance 67 matches them (×1.0), and Endurance 100 reaches 25% above them (×1.25).
- Bleeding drains HP from its zone every turn until treated (Medical).

### Medical system (draft)

**Draft — not final.** Deliberately basic: four conditions, a handful of items, and the Medical attribute deciding how well and how fast they are used.

**Conditions**

| Condition | Cause | Effect | Treated with |
| --- | --- | --- | --- |
| Light bleeding | Most hits | −1 HP per turn in that zone | Bandage, IFAK, medkit |
| Heavy bleeding | Hard hits, high bleeding chance on thorax and HP ammo | −4 HP per turn in that zone | Tourniquet (arms and legs), hemostatic dressing (any zone), medkit |
| Fracture | Heavy hits or falls on arms and legs | Arm: more aim spread and slower reloads. Leg: movement cost ×1.5, no sprinting | Splint |
| Pain | Damage, tourniquets | Fewer AP and more aim spread until masked | Painkillers (temporary) |

**Chances (draft)**

- **Bleeding:** checked for every hit that deals damage through armour (blunt hits never bleed). A **hard hit** deals at least 25% of the zone's max HP; it rolls for heavy bleeding first, and if that fails, for light bleeding. Other hits roll for light bleeding only. Chances are × the ammo's bleed modifier (HP ammo ×1.5) and × (1 − Endurance ÷ 400).

| Zone | Light bleeding | Heavy bleeding (hard hits) |
| --- | --- | --- |
| Head | 30% | 20% |
| Thorax | 50% | 35% |
| Arm | 40% | 25% |
| Leg | 40% | 25% |

- **Fracture:** a hit dealing at least 35% of an arm's or leg's max HP fractures it with 30% chance; a hit that disables the limb, with 60%. Falls come later (optional).
- **Pain:** starts when one hit deals at least 20% of a zone's max HP, when any zone is below 50% HP, or when a tourniquet is applied; it lasts while any zone is below 50% or a tourniquet is on. A new painkiller dose resets the mask to 10 turns; doses do not stack.

A zone at 0 HP stays as defined under Body zones (head or thorax: death; arm or leg: disabled). Damage that hits a disabled limb is split equally over all zones still above 0 HP, head and thorax included; so is the excess of the hit that disables the limb. Shares round down, and armour is checked only at the zone that was hit.

**Using medical items**

- Any soldier can use any item except the surgical kit (Medical 40+).
- Medical lowers the AP cost by 1 per 40 Medical (never below 1; the self-treatment and backpack surcharges are added after that) and raises HP restored by × (0.75 + Medical / 200).
- Items used from the vest or battle belt cost their normal AP; from the backpack they cost extra.
- A soldier can treat themselves at +2 AP, or a squadmate on an adjacent tile.

**Recovery after an op**

- At an FOB, soldiers recover HP every hour: faster the better the squad's best Medical.

The medical items are listed in the item list (Item list).

### Tactical map generation (draft)

**Draft — not final.** Every tactical map is generated from the strategic tile where the encounter happens, with the battle seed. Same tile and seed, same map. All shares, sizes and thresholds below are draft values in `data/mapgen/tactical.json`; the building rules are data too, not code.

**Inputs**

- **Map type** from the strategic tile, in this order:
  1. a plant
  2. a border crossing
  3. a settlement (town, or city for small, large and capital)
  4. otherwise its terrain (steppe/farmland → open, woods, marsh, hills, mountains, shore)
- The four **neighbouring tiles**, the **roads** crossing the tile (track, road, highway) and the side the squad **approaches** from (by default the road it came in on).
- Tactical maps have no rivers; sea and lake shores stay.

**Map types**

| Type | Size (tiles) | Built share | Foliage share |
| --- | --- | --- | --- |
| Open | 80 | 6% | 15% |
| Woods | 64 | 3% | 50% |
| Marsh | 64 | 2% | 30% |
| Hills | 64 | 3% | 25% |
| Mountain | 48 | 2% | 20% |
| Town | 72 | 7% | 14% |
| City | 96 (small city 80) | 16% | 10% |
| Plant | 96 | 11% | 10% |
| Crossing | 64 | 5% | 14% |
| Shore | 64 | 3% | 15% |

Buildings appear only where the tile has a road, settlement, plant or crossing.

**Stages**

1. **Zones:** the map takes the tile's terrain. Within about a fifth of the map from an edge, it blends into the neighbour's terrain along a noisy line.
2. **Water:** shores from sea and lake neighbours. Water more than 4 tiles from the shore is deep and impassable.
3. **Roads:** each road on the tile enters at its matching edge and runs to a hub near the centre, away from water.
   - Width: highway 5, road 3, track 2 tiles.
   - Tracks and roads ford shallow water; deep water gets a bridge with railings.
   - A town adds village streets; open country with no road may get a farm track.
4. **Structures:** buildings, fences and props, placed before the ground is filled.
   - **Buildings are generated from floor-plan rules** (room types and size ranges, apartment layouts, shop ground floors). Walls, doors and windows sit on tile edges.
   - Per map type:
     - Cities get a street grid, or a Soviet housing block (khrushchyovkas around a courtyard), and part of the city's landmarks.
     - Towns get house plots with gardens, a school or admin building and sometimes a war memorial.
     - Plants get a fenced compound: hall, warehouses, admin, checkpoint, and tanks or bunkers by plant type.
     - Crossings get a checkpoint, customs and sandbag positions.
     - Countryside with a road gets a kolkhoz yard or a single hut.
   - **Levels:**
     - Every building has a playable ground floor.
     - **Large buildings** (the multi-storey kinds listed in data: apartment blocks, offices, schools, landmarks, and the large halls) also have a playable flat **roof**, reached by an inside stairwell. Stairs cost +1 AP per tile.
     - The roofs of small buildings are scenery.
     - Taller buildings show their real height, but only the playable levels can be entered.
     - A playable **second floor** for large buildings is OPTIONAL (left out of the first build iterations).
     - The terrain is flat.
5. **Fields and shelterbelts:** on farmland, a grid of 2-tile tree lines (about a third with gaps) divides the land into crop fields and meadows.
6. **Ground fill:** the remaining tiles are filled by a seeded wave function collapse. It uses grass, brush, trees, mud and rock with adjacency rules (rock only next to grass, brush, trees or rock; mud never next to rock) and aims for the map type's foliage share.
7. **Details:** tree trunks, road wrecks, craters (rubble and mud), potholes and scatter props. Then every walkable pocket is connected to the main area, by a footbridge or a cleared gap.
8. **Exits and deployment:**
   - **Exits:** 2–4 exits on the map edge, at least 20 tiles apart.
     - Every exit in the tactical map request is placed first.
     - Then road exits: a road needs vehicle fuel, a road across the border a paid crossing.
     - Then 6-tile exits on foot, up to the count.
   - **Player zone:** on the approach edge.
   - **Enemy zone:** around the objective when the tile has a point of interest, else on the opposite edge.
9. **Checks and re-roll:** a layout that fails a required check is generated again with the next seed, up to 6 times.
   - **Required:** 2–4 exits; both zones and every exit connected on foot (vaulting counts); every building can be entered.
   - **Reported:** foliage and built shares within 6 points of the map type; roads leave through their edges; room rules met; no vegetation on roads; every room reachable from a door.

**Tiles, cover and doors**

- **Ground:** road, floor, grass, field, brush, trees, mud, rubble, shallow and deep water, rock.
  - **Move costs** follow the terrain table: shallow water, mud, rubble, dense brush +1.
  - **Impassable:** rock, tree trunks, deep water and blocking props.
- **Cover edges:** none, half (windows, fences, sandbags, low walls, about 1.0 m) or full (walls, closed doors).
  - Half-cover edges are crossed only by vaulting (4 AP, 3 with Agility 70+).
- **Doors:** closed doors block sight and movement.
  - Walking through a closed, unlocked door opens it as part of the move, for +1 AP.
  - Closing an adjacent door costs 1 AP.
  - Interior doors are never locked.
  - Outer doors are locked at 25% on warehouses, plant buildings and buildings at points of interest, and at 10% on houses.
  - A locked door opens with bolt cutters, the POI key or a demolition charge.
- **Destruction:** every cover edge has material HP (wood 40, brick 120, metal 200, vehicle 150, concrete 300). Bullets do not damage edges.
  - **Grenades:** a grenade hits every edge within its radius for 3 × its blast damage at that distance. A frag grenade (100 at the centre) breaks wood and doors nearby, dents brick and leaves concrete standing.
  - **Demolition charges:** a charge always destroys the edge it is placed on.
  - An edge at 0 HP becomes rubble with no cover.

**Concealment**

Brush, trees and tall crops are **obscuring terrain**.

- **When it applies:** the target stands on an obscuring tile, or the line of fire passes through one or more.
- **The shift:** once the shot action is confirmed, the aim point (the centre of the spread cone) moves 2 MoA on the game scale (about 1 cm per tile of distance) in a random direction.
  - The direction comes from the battle's seeded random stream.
  - The shift happens once per shot action, so every round of a burst uses the same shifted cone.
  - It does not add up when the line crosses several obscuring tiles.
- **Hit logic is unchanged:** the shifted cone is traced against hit boxes and cover as usual.
- **Shot preview:** it shows the unshifted cone and marks the target as concealed. The real shift is unknown until the shot is confirmed, so the shown hit % is the best case.
- **Spotting:** a soldier standing on an obscuring tile is also harder to spot. Their concealment in the spotting rule (see Sight and spotting: Recon, Agility and stance) is × 0.7. E.g. an average soldier crouching in brush: 0.6 × 0.7 = 0.42, so seen within about 18 tiles instead of 25.

**Optional extras (OPTIONAL — left out of the first build iterations)**

- **Tall crops:** sunflower and maize fields. They hide soldiers but give no cover.
- **Loot containers:** 1 per building (2 in warehouses, barns and halls), on the side away from the door. On a retrieve mission, the container farthest from the player zone holds the mission item.
- **City landmarks:** each city has a fixed landmark roster (government house, theatre, hospital, school, department store, cinema, monument, eternal flame); a city map carries 1–3 of them.

**Randomness**

One random stream per stage, derived from the map seed. Tuning one stage does not change the others. The landmark roster uses its own stream per city name, so a city's landmarks are the same on every map.

## Management

The PMC itself: its soldiers, gear, contracts, reputation and everything it owns.

### Soldiers & progression

Soldiers are faceless, generated contractors: stats, a callsign and nothing else. Any attachment is earned through shared deployments, never pre-written — the game's job is to record and replay the soldier's story, not to tell one.

- **Recruitment:** generated contractors from hiring pools (agencies, local hires, defectors, freed prisoners) in price tiers. Price follows stats; replacements are always available.
- **Identity:** no portrait, voice, backstory or personality. Helmet, balaclava or goggles, a callsign and a service number. The callsign is assigned when the soldier is generated and is drawn from their profile, so it hints at their strongest attributes (the strongest attribute and its value pick the list; lists and ranges are in [Callsigns](https://claude.ai/artifact/G1VpofmrmhUf2J8JNSY58o)). The player cannot rename soldiers; at most they give a soldier a nickname or callsign, which replaces the automatically given callsign (the service number stays), and mark their kit (patches, colours).
- **Service record:** the attachment engine. The game logs each soldier's life automatically — deployments, kills, rescues, wounds, near-misses, loot carried out, comrades lost — and shows it in a dossier and in after-action reports.
- **Earned marks:** notable events leave traces: an achievement kept in the service record ("carried two wounded out of the refinery") that also gives the soldier an earned callsign (OPTIONAL, see Deeds and callsigns), replacing the automatically given one. A later deed replaces an earned callsign only if it has higher prestige; a callsign the player has chosen always has the highest priority and is never replaced, visible scars, worn and repainted gear.
- **Contracts & morale:** salaries and renewals, but no personal opinions. Morale is squad-wide, starts at 80 and is kept from fight to fight. Only casualties move it: allies killed or wounded lower it, enemies killed or wounded raise it. Below 20, an activated soldier may disobey and flee toward the nearest exit (OPTIONAL — left out of the first build iterations).
- **Attributes:** eight attributes: four physical (a mostly fixed body profile) and four skills that improve by use (JA2) — see the draft below. Perks unlock at thresholds.
- **Injuries:** four body zones with bleeding, fractures and pain; serious wounds need turns of recovery at an FOB or field surgery (see Medical system).
- **Death:** permanent and expected. A replacement is easy to hire; the history is not. Gear on a dead soldier stays on the operation map unless recovered.
- **Memorial:** fallen soldiers' service records move to a memorial wall at the base.

### Deeds and callsigns (draft, OPTIONAL — ignore for the first build iterations)

**Draft — not final.** Not part of the development spec for now; until then, soldiers keep the callsign assigned at generation. Deeds are logged automatically from the service record. Each has a prestige rank from 1 to 5 and a short list of callsigns. A new deed replaces an earned callsign only if its prestige is higher; equal prestige keeps the current one. A callsign the player has chosen is never replaced. Every deed stays in the service record either way. The deed list with prestige ranks and callsigns is in [Callsigns](https://claude.ai/artifact/G1VpofmrmhUf2J8JNSY58o).

- **Picking a callsign:** drawn from the deed's list, never one already used by a living soldier in the roster.
- **Fallen soldiers** keep their last callsign on the memorial wall.

### Soldier attributes (draft)

**Draft — not final.** Names, ranges and formulas are a starting point for prototyping and balancing.

Every soldier has eight attributes on a 1–100 scale. They form two groups: four physical attributes, a mostly fixed body profile, and four skills that grow through use. Everything else is derived from them.

| # | Attribute | Group | Covers | Grows by |
| --- | --- | --- | --- | --- |
| 1 | Strength | Physical | Force: carry weight, heavy-kit penalty, recoil control, throwing distance | Barely (body profile) |
| 2 | Endurance | Physical | Body: HP per zone, stamina pool, bleed resistance, recovery speed | Barely (body profile) |
| 3 | Agility | Physical | Speed: AP, movement cost, vaulting and climbing, weapon swaps | Barely (body profile) |
| 4 | Perception | Physical | Senses: sight range, spotting, hearing, noticing a moving enemy (reactions) | Barely (body profile) |
| 5 | Marksmanship | Skill | Shooting: spread, aim time, reload cost, burst control | Hitting targets, reloading under fire |
| 6 | Recon | Skill | Moving unseen: noise, concealment, ambushes, evading and scouting on the strategic map | Moving unseen, scouting |
| 7 | Medical | Skill | Field treatment, surgery, healing speed at the FOB | Treating wounds |
| 8 | Technical | Skill | Repairs, weapon mods, explosives, locks, drones, vehicles and helicopters | Repairing, modding, using explosives |

**Rules (draft)**

- New soldiers roll a profile within their price tier.
- Skills improve through use, with diminishing returns: fast below 50, slow above 80.
- Physical attributes form a mostly fixed body profile: only rare service-record events (a serious wound, a long recovery, hard campaigning) move them.
- Optional: unused skills slowly drift back toward a floor.

**Derived values (draft, never stored)**

Each derived value drives one thing and comes from at most two attributes: a main one and a minor one. The Tactical Layer owns the formulas for action points, stamina, zone HP, reaction chance and night sight; this table only names the attributes they use.

| Derived value | Main | Minor | Rule (draft) |
| --- | --- | --- | --- |
| Action points | Agility | — | 25 + Agility ÷ 10, rounded down (25–35). All AP costs are whole numbers; walking costs 2 AP per tile |
| Stamina pool | Endurance | — | 2 + Endurance ÷ 20, rounded down (2–7 stamina points) |
| HP per zone | Endurance | — | Base HP × (0.5 + 0.75 × Endurance / 100) (see Body zones) |
| Carry capacity | Strength | Endurance | Formula open |
| Shooter spread | Marksmanship | Perception (at range) | Feeds the hit model's spread cone |
| Recoil control | Marksmanship | Strength | Lowers the spread each follow-up round adds |
| Reload and weapon swap cost | Marksmanship | Agility | Reload: Marksmanship and weapon ergonomics; swap: Agility and weapon weight (see Tactical actions) |
| Spotting and sight range | Perception | Recon | Night: a third of the day range without a flashlight |
| Reaction chance | Perception (reactor) | Agility (mover) | 50 + (reactor's Perception − mover's Agility) / 2, limited to 10–90% (see Turn structure) |
| Noise and concealment | Recon | Agility | How far away enemies notice the soldier |
| Treatment speed and effect | Medical | — | See Medical system |
| Repairs, explosives, piloting | Technical | — | Piloting a helicopter needs Technical 50+ |

**Nerve (from the service record, not rolled):** grows with deployments survived and fights under fire. It lowers the effect of suppression and how much casualties shake the squad's morale (not implemented in the first build iterations), so veterans hold up because of what they have lived through. Open: whether Leadership becomes a perk unlocked at a Nerve threshold.

### Gear, loot & return

The Tarkov layer: what you carry in is at risk, what you carry out pays for the war.

- **Inventory:** simple item lists, no grids. Every container (vest, belt, backpack, vehicle storage) holds any items up to its weight limit. Weight carried affects AP and stamina.
- **Weapon modding:** modular weapons (muzzle, stock, grips, handguard, optics, magazines) changing accuracy, ergonomics, recoil, how far shots are heard, and AP cost.
- **Loot:** weapons, armour, intel documents, valuables, medical supplies and quest items. Rarer loot sits in more dangerous spots.
- **Return to an FOB:** an op ends only when the squad is back at an FOB. Each tactical map has 2–4 exits with conditions (vehicle needs fuel, a boat leaves at a set turn, a paid crossing): every exit the strategic layer knows of is placed, and map generation adds plain exits up to that count; and the route home crosses the strategic map, where the squad can still be intercepted. Soldiers who don't make it back are MIA, captured or dead.
- **Risk control:** insurance (chance to recover lost gear) and loadout presets.
- **Traders:** faction-linked traders with loyalty levels unlocking better stock; Krug markets with fluctuating but publicly posted prices.

**Design risk:** losing gear must sting without causing a death spiral — always offer a cheap "scav" loadout and low-risk contracts to rebuild.

### Contracts and missions (draft)

**Draft — not final.** Contracts are not random: every contract comes from a goal a faction is actually pursuing on the map. A contract holds one or more **missions**; the player bundles missions from one or several contracts into an operation.

**Where contracts come from**

- When a faction sets a goal it cannot cover with its own squads — or one it wants to keep deniable — it posts a contract for that goal.
- Factions with intel on a rival's goal may post a **counter-contract** against it, so the player can be offered both sides of the same job.
- World events and desperate measures add contracts of their own (a weapon shipment to escort or intercept, a strike on a VIP, a defector to bring in).
- Varyag and Aegis compete for the same mission on some of the player's contracts (see Squads and simulation).
- Contracts appear at the FOB, in cities and — for Krug work — at Krug markets, filtered by the player's reputation with the employer. Varyag and Aegis can take offers from their own side and compete with the player: a taken offer leaves the player's board, or both race for it. The Krug never takes other factions' contracts; it offers escort work for its own convoys, and the player or a faction can pay a Krug squad to escort a shipment.

| Faction goal | Missions it generates |
| --- | --- |
| Supply run | Retrieve and deliver items; escort a shipment |
| Attack a point of interest | Capture a territory; assassinate a VIP (the defending commander) |
| Defend or hold a point of interest | Help defend a territory; escort a shipment (reinforcements, ammunition); capture a territory (retake) |
| Escort | Escort a VIP; escort a shipment |
| Hunt | Capture a VIP; assassinate a VIP |
| Trade route (Krug) | Retrieve and deliver items; escort a shipment |
| Intel needs (any faction) | Retrieve and deliver items (documents, captured equipment) |

**Mission types**

| Mission | Objective | How it plays | Success | Failure |
| --- | --- | --- | --- | --- |
| Retrieve and deliver items | Collect items at a location (a cache, a crash site, a depot, another faction's stash) and bring them to a destination | The items take storage weight; the location may be guarded or contested | Items handed over at the destination before the deadline | Items lost, sold elsewhere or late |
| Escort a shipment | Protect a faction convoy along its route | The convoy moves with the player's squad on the strategic map; encounters on the way become tactical fights with the convoy's vehicles to protect | Convoy arrives with most of its cargo | Convoy destroyed or captured |
| Escort a VIP | Bring a person (officer, official, Krug courier, journalist) safely to a destination | The VIP takes a seat in the vehicle and joins tactical fights as a lightly armed allied unit, controlled by the tactical AI by default; player control is a switchable option for testing | VIP arrives alive | VIP killed or captured |
| Capture a VIP | Take a person alive and hand them to the employer | Find the target (intel helps), defeat or scatter the guards, then restrain the VIP once they surrender or are wounded; the VIP takes a seat until handed over | VIP delivered alive | VIP killed, escapes or is rescued |
| Assassinate a VIP | Kill a person, usually guarded and on the move | Track the target's squad on the map and choose where to strike; proof comes from a soldier witnessing the kill or taking an item from the body | VIP confirmed dead | VIP survives the deadline |
| Capture a territory | Take a point of interest or region from its current controller | Clear the defenders in a tactical fight, then hold the position for a number of hours until the employer's squad takes over | Control passes to the employer | Position lost before the handover |
| Help defend a territory | Reinforce a faction's point of interest or region against an expected attack | Reach the position before the attackers do (intel gives the warning); the fight is a tactical defence alongside the faction's own soldiers, who are allied units under AI control | The position is still held when the attackers are beaten or retreat | The position falls |

**Contract terms**

- **Employer, mission(s), targets and locations, deadline** (in hours).
- **Pay:** an advance (draft 25%) on signing; the rest is paid per mission, each mission paying its share when its goal is met; pay scales with distance, danger and how much the employer wants it.
- **Reputation:** gain with the employer on success; loss with the target faction whenever it learns who did it.
- **Intel level:** how much the contract reveals — exact location, last known position, or rumours only.
- **Deniability:** some employers (often the VDK) may disown a contract that goes wrong; the reputation hit then falls on the player alone.
- **Failure:** a failed mission loses only its share and its reputation, and the contract goes on. A failed contract: no further pay, a reputation loss with the employer, and an advance that must be paid back or written off as debt.

**Pay bands (draft)**

| Mission | Pay |
| --- | --- |
| Retrieve and deliver items | $3,000–8,000 |
| Escort a shipment | $6,000–12,000 |
| Escort a VIP | $8,000–15,000 |
| Assassinate a VIP | $10,000–20,000 |
| Capture a VIP | $12,000–25,000 |
| Capture a territory | $15,000–30,000 |
| Help defend a territory | $8,000–18,000 |

### Reputation (draft)

**Draft — not final.** Every faction holds one reputation value toward the player's PMC, from −100 to 100, starting at 0. It moves with two things: how the player handles contracts and what the player does to the faction. For now an act changes reputation only with the faction it affects directly; there is no spill-over to that faction's allies or enemies.

**Standing**

| Reputation | Standing | Effect |
| --- | --- | --- |
| ≤ −50 | Hostile | No contracts or trade; attacks on sight; may put a bounty on the PMC |
| −49 to −20 | Unfriendly | Fewer contracts and higher prices; hostile when competing for the same objective |
| −19 to 19 | Neutral | Basic trade and contracts |
| 20 to 49 | Friendly | Military gear, better contracts |
| ≥ 50 | Trusted | Armoured vehicles, helicopters, best stock, sensitive contracts |

**What changes reputation**

| Category | Act | Change with that faction |
| --- | --- | --- |
| Contracts | Mission completed | +5 to +15 (by pay band) |
| Contracts | Mission failed | −5 |
| Contracts | Contract broken: cargo kept or sold, VIP handed to someone else, employer betrayed | −30 |
| Friendly acts | Join a fight on its side without a contract | +5 |
| Friendly acts | Rescue its soldiers or VIP, return its MIA or captured soldiers | +10 |
| Friendly acts | Sell it supplies it needs (fuel, ammunition, medical) | +1 to +3 |
| Friendly acts | Krug: keep a deal | +5 |
| Hostile acts | Attack one of its squads that was not hostile to the player | −30 |
| Hostile acts | Kill its soldiers | −2 each, at most −20 per fight |
| Hostile acts | Destroy or steal its cargo | −10 |
| Hostile acts | Capture or assassinate one of its VIPs | −20 / −30 |
| Hostile acts | Take one of its regions | −15 |
| Hostile acts | Krug: break a deal or fight in a Krug market | −50 |
| Hostile acts | War crimes (killing civilians or prisoners) | −20 with every faction; civilian loyalty collapses in the region |

**Attribution**

- An act only counts if someone from the affected faction survives it. A fight or attack with no surviving witnesses stays unattributed — unless an Operation dispute event assigns the blame.
- Reputation does not drift back on its own; it only changes through new acts.

**Reputation in the event system**

Reputation is an input to world events, desperate measures and faction goals:

How each event and desperate measure uses reputation is listed in [World events](https://claude.ai/artifact/HJG62N9ZiB6SxKSSrHi67E).

### Base & meta progression

The PMC's progress is what it owns, not what it builds. FOBs have no upgrades and nothing is crafted: every weapon, item, vehicle and service is **looted**, **purchased**, or produced by **industry the PMC controls**.

- **FOBs:** every operation starts and ends at one. An FOB offers a stash, rest and slow healing, hiring and contracts. The first is given at the start; more are bought in small and large cities or taken over, and each new FOB extends operational range.
- **Looting:** tactical fights, bodies, containers and crash sites (see Gear, loot & return and the item list).
- **Purchasing:** faction traders and Krug markets for gear and vehicles; paid services in the field — hospital treatment in cities, repairs at mechanical plants, fuel at gas stations and oil plants.
- **Controlling industry:** a plant the PMC takes and holds (a squad stationed there) delivers its output to the nearest FOB every day — oil plants fuel, mechanical plants spare parts and vehicle repairs, chemical plants medical supplies, arms plants weapons and ammunition, mineral plants medium income plus a boost to the output of every other plant the PMC holds (modifier size TBD); hidden-city complexes (optional) prototype items. A plant left unguarded falls back to the region's controller.
- **Base threat:** FOBs can be raided by the enemy late game — a defence mission, XCOM base-assault style.
- **Campaign end states:** see Factions & campaign (Veligrad united, reformed, locked into endless proxy war or seized in a coup; or cash out and leave). Score based on money, reputation and surviving soldiers.

## AI

Each layer's AI is a separate module. It sees only what its side knows under fog of war and issues the same commands a player does; it never changes game state directly. Both layers use utility AI: each agent scores the actions available to it and picks the best one, so behaviour comes from shared situation maps and from agents reacting to each other, not from scripts.

- **Data:** weights, response curves and faction doctrines are data in /data/ai/, tuned like other content. All behaviour values are unset for now.
- **Logging:** every decision is logged with its top-scored options, so behaviour can be inspected and explained.

### Strategic AI

**Faction behaviour:** every faction pursues its own goals on the map, not the player. A faction only turns hostile toward the player when:

1. its reputation with the player is low,
2. it has a specific mission targeting the player (a hunt, a counter-attack on an FOB), or
3. it and the player are after the same objective at the same time.

Otherwise its units go about their business, on the strategic map and in tactical engagements alike. Attacking a non-hostile faction is the player's choice — and costs reputation.

**Faction AI tiers.** Each faction AI works toward its ultimate goal (SSV and VDK: hold the capital and most of the country; Varyag and Aegis: profit and keep their patron standing; the Krug: keep its trade routes and markets and avoid open war; resistance groups: drive the controller out of their area) in three tiers:

| Tier | Role |
| --- | --- |
| Situation maps | Per-region values computed every hour: own and enemy strength, economic value, threat, frontline, supply reach |
| Strategist | Scores candidate objectives: own gain + damage to rivals − cost − risk + a commitment bonus for current plans |
| Operational planner | Assigns squads to objectives, or offers a contract when its own squads can't reach the objective or are worth more elsewhere |

Other factions evaluate contract offers with the same utility scoring. Faction personalities come from doctrine data: aggression, risk tolerance, contract use and hostility per faction.

**Controller hand-off.** The Strategic Layer decides when a faction acts; `strategic-ai` decides what it does. For every hour that passes, every faction gets its perception view (what it knows under fog of war) and returns commands: set a goal, move a squad, offer a contract. The Strategic Layer validates and resolves them; contract offers go on to Management.

### Tactical AI

Enemy squads take roles: flank, suppress, retreat, call reinforcements. Units of non-hostile factions on the same map follow their own objectives and only engage under the faction behaviour rules above.

**Unit scoring.** Each unit scores its candidate actions, weighted in this order of importance:

1. **Survival:** exposure, threat, HP, morale. It acts as a multiplier that dominates as danger rises, not as a hard rule that blocks everything else.
2. **Battle goal:** progress toward the objective and the squad's current plan.
3. **Action fit:** how effective each action is in the current situation.
4. **Coordination:** bonuses for answering squad requests, penalties for tiles or targets a squadmate has claimed.

A squad leader sets the squad plan and roles: the highest-ranked soldier; if it dies, the next highest takes over at its next activation and keeps the plan. Units coordinate through a shared blackboard of requests and claims. The battle goal and an acceptable-loss threshold come from the strategic layer, through the tactical map request; the threshold is the share of the side's soldiers out of action (dead, disabled or fled), and once it is reached the side retreats to an exit and leaves the map. An AI soldier knows as much about a seen enemy's gear as the player would (weapon type, helmet and armour class).

**Controller hand-off.** The Tactical Layer decides when a unit acts; `tactical-ai` decides what it does.

1. At an AI-controlled unit's activation, the Tactical Layer builds a **perception view**: what that unit and its squad know under fog of war.
2. It passes the view to the controller of that side: player input for the player's squad, `tactical-ai` for enemies and for allied AI units (defenders, convoys, an escorted VIP).
3. The controller returns **commands**, the same ones the player issues: move, shoot, set reaction, take cover.
4. The Tactical Layer validates them and resolves them with its normal rules.

The modules never import each other: the game shell plugs `tactical-ai` in as the enemy controller when a battle starts, and the Test Lab can plug in the real AI, a scripted stub or a second AI. The AI cannot see hidden state or issue illegal actions.

## Data definitions

Static content the tools author into `/data`. Every module reads it; none changes it. Concrete items and ammunition are in the [Item list](https://claude.ai/artifact/3ZE9h1z8kMDFDuWB4muJRJ).

### Soldier equipment slots (draft)

**Draft — not final.** Each soldier has seven equipment slots. Everything carried counts toward weight (carry capacity, stamina costs, sprint penalties).

| Slot | Holds | Effect in play |
| --- | --- | --- |
| Weapon 1 | Any weapon type | Equipped weapon; switching between the two costs AP (Agility and weapon weight, see Tactical actions) |
| Weapon 2 | Any weapon type | Second equipped weapon, e.g. a rifle and a pistol, or a rifle and a shotgun |
| Helmet | Head protection | Armour class for the head zone; heavier helmets can narrow hearing (noise detection) |
| Body armour | Plates or soft armour | Armour class for the thorax zone; durability wears with each hit |
| Load-bearing vest | Item list, small weight limit | Quick access: magazines, grenades and medical items used from here at normal AP cost |
| Battle belt | Item list, small weight limit | Quick access like the vest; typically spare magazines, pistol ammo, a tourniquet |
| Backpack | Item list, large weight limit | Slow access: using an item from it costs extra AP; holds loot and spare gear; can be dropped in combat to move lighter |

- **Access tiers:** vest and belt are quick, the backpack is slow — what a soldier keeps where matters in a fight.
- **Loot:** anything not in a slot or inventory stays on the map; whatever reaches the vehicle's storage can be brought home.
- **Type limits:** load-bearing vests and plate carriers also cap how many items of each type they hold — magazines, grenades, medical items and other items — on top of their weight limit. A plate carrier with pouches fills both the body armour and the vest slot.
- **Death:** everything in these seven slots stays on the body unless recovered.

### Weapon profile (draft)

**Draft — not final.** Every gun is defined by the profile below; mods change these values directly.

| Attribute | Type | Meaning | Drives |
| --- | --- | --- | --- |
| Weapon type | Category | Pistol, shotgun, sub-machine gun, assault rifle, battle rifle, designated marksman rifle, sniper rifle, light machine gun | Animations, AI role, trader and loot categories |
| Calibre | Ammo type reference | The cartridge the gun fires; the loaded ammo defines its exact values | Which ammo fits; modifies the gun's Recoil |
| Fire modes | List of rounds per trigger action, e.g. \[1, 3\] or \[1, auto\] | Semi-auto, burst and full-auto options (replaces a single Burst value) | Rounds and AP per shot action; recoil builds within a burst |
| Magazine size | Rounds | Capacity of the standard magazine | Shots before reloading |
| Barrel multiplier | Factor around 1.0 | Fixed per weapon by its barrel length, not changed by mods: short barrels below 1.0, long barrels above | Multiplies the calibre's damage |
| Ergonomics | 1–100 | Handling and balance | AP cost to fire and reload (see Tactical actions) |
| Base MoA | Minutes of angle | Mechanical accuracy on a game scale, not real minutes of angle: Base MoA 5 (an average assault rifle) spreads over a torso-plus-head target at 50 m (about 33 tiles), the thorax and head hitboxes together, 0.83 m from the bottom of the thorax to the top of the head. 1 point ≈ 17 cm of spread at 50 m, 33 cm at 100 m; the cone's width is where nearly all shots land | Base spread of every shot |
| Weight | kg | Weight with standard magazine | Carry capacity, stamina costs, sprint penalties |
| Recoil | 1–100 | Base kick per shot; multiplied by the calibre's recoil modifier | Spread added per follow-up round; reduced by Marksmanship |
| Mod slots | List | Muzzle, stock, pistol grip, magazine, optic, handguard (with its own sub-slots); the barrel is fixed | Which mods fit |

**State, not profile:** each individual gun also tracks **Condition** (0–100). Wear raises jam chance and spread (see Armour wear and weapon condition under the Tactical Layer); repaired with the Technical attribute.

**How mods change the profile**

- Muzzle devices: recoil, flash. Suppressors: shorten how far shots are heard (see Gunshot noise).
- Stocks and pistol grips: ergonomics, recoil.
- Handguards: ergonomics and weight, and they decide which sub-slots exist — whether a front grip can be fitted, and one or two tactical module slots.
  - Front grips: ergonomics, recoil.
  - Tactical modules: flashlight (restores full day sight range at night and can blind enemies in its cone, but reveals the carrier), laser (reduces shooter spread for hip and snap shots, visible to enemies).
- Magazines: magazine size, reload cost, weight.
- Optics: reduce shooter spread at range; they do not change Base MoA.

### Calibre profile (draft)

**Draft — not final.** The weapon's Calibre attribute points to one of these profiles; the loaded **ammo type** modifies the calibre's damage and sets the penetration class. Weapon values (barrel multiplier, Base MoA, recoil) act on top.

| Attribute | Type | Meaning | Feeds |
| --- | --- | --- | --- |
| Designation | Text | Cartridge name, e.g. 5.56×45 | Which weapons and magazines fit |
| Damage | HP | Base damage per projectile at the muzzle | Muzzle damage, damage at distance, blunt damage |
| Projectiles | Count | 1 for bullets, several for buckshot | Hits per round (each pellet traced separately) |
| Recoil modifier | Multiplier | How much the cartridge scales the gun's Recoil (about ×0.6–×1.6) | Effective recoil = gun Recoil × calibre modifier |
| Round weight | g | Weight per cartridge | Magazine and carried weight |

**Calibres and ammunition in the game:** see the item list (Item list). For reference: a thorax has 85 base HP, a head 35.

**Ammo types**

Every ammo item has its own **damage modifier and penetration class** (see the item list); spread, falloff (a share of damage lost over the load's own falloff range) and the subsonic flag are set per load.

| Ammo type | Character | Damage | Falloff range (placeholder) | Subsonic | Spread (MoA) | Other |
| --- | --- | --- | --- | --- | --- | --- |
| FMJ (standard) | Baseline load | ×1.0 | 15 tiles | No | ×1.0 | Cheap, common |
| AP (armour-piercing) | Penetration class +1 to +2, slightly less damage | ×0.9 | 18 tiles | No | ×1.0 | Expensive, rare |
| HP (hollow point) | More damage, low penetration class | ×1.25 | 12 tiles | No | ×1.0 | Higher bleeding chance |
| Subsonic | Less damage, lower penetration class | ×0.8 | 10 tiles | Yes | ×1.1 | Near-silent with a suppressor |
| Tracer | Same as FMJ | ×1.0 | 15 tiles | No | ×1.0 | Less recoil spread in bursts; reveals the shooter |
| Buckshot (shotgun) | 8 pellets | ×1.0 per pellet | 15 tiles | No | ×1.0 | Strong up close, falls off fast |
| Slug (shotgun) | One heavy projectile | ×1.0 | 15 tiles | No | ×0.5 | Replaces buckshot |

### Vehicles (draft)

**Draft — not final.** Vehicles are not upgraded; the player chooses between different vehicles, each with its own cost, parameters and features. A squad on the map has at most one vehicle: its seats cap the squad size and its storage holds the squad's supplies and what it brings home. A squad without a vehicle travels on foot (2 hours per tile, 3 in mountains) and carries only what its soldiers carry.

- **Start:** the player buys a first vehicle with the starting budget; only the cheapest few are affordable.
- **Buying and selling:** in large cities and at mechanical plants. Some vehicles are only sold to factions' friends (high standing) or through the Krug.
- **Several vehicles = several squads** running ops at the same time. Vehicles are either ground vehicles or helicopters.
- **Loss:** a vehicle left behind on a failed op can be destroyed, captured or recovered later.

**Vehicle parameters**

| Parameter | Meaning |
| --- | --- |
| Cost | Purchase price; upkeep (fuel, repairs) scales with it |
| Seats | Maximum soldiers in the squad |
| Storage | One list for everything the vehicle carries, limited by weight (kg): supplies (ammunition, fuel cans, medical supplies, spare parts) and loot. Soldiers restock from it between engagements; every kilo of supplies is a kilo not free for loot — longer ops or bigger hauls |
| Fuel range | Regions it can travel on a full tank |
| Off-road | Poor / good / very good: lowers the travel time in steppe and woods |
| Armour | Protection for passengers in road encounters (armour class) |
| Noise | How far away factions notice it |
| Profile | Civilian or military |
| Features | Special abilities, listed below |

**Vehicles**

| Vehicle | Type | Cost (draft) | Seats | Storage (kg) | Fuel range | Off-road | Armour | Noise | Profile | Features |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lada Niva | Ground | 8,000 | 3 | 300 | 30 | Good | — | Low | Civilian | Cheap, inconspicuous, easy to repair |
| UAZ-469 | Ground | 12,000 | 4 | 400 | 20 | Very good | — | High | Military | Rugged; repairable anywhere |
| UAZ-452 van | Ground | 15,000 | 6 | 700 | 20 | Good | — | High | Civilian | Ambulance layout: wounded recover while travelling |
| Pickup truck | Ground | 25,000 | 4 | 800 (open bed) | 35 | Good | — | Medium | Civilian | Weapon mount on the bed: fights in road encounters, but draws attention |
| Land Cruiser 70 | Ground | 35,000 | 5 | 600 | 40 | Very good | — | Medium | Civilian | Longest range; reliable |
| GAZ-66 truck | Ground | 30,000 | 12 | 2,000 | 15 | Good | — | High | Military | Troop transport; large loot runs |
| Ural-4320 truck | Ground | 45,000 | 14 | 4,500 | 15 | Very good | — | High | Military | Largest storage; crosses rough ground |
| GAZ Tigr | Ground | 120,000 | 6 | 500 | 25 | Good | Class 4 | High | Military | Armoured; eastern standing or the Krug |
| MRAP | Ground | 150,000 | 6 | 800 | 20 | Poor | Class 5, mine protection | High | Military | Most protected; western standing or the Krug |
| BTR-80 | Ground | 250,000 | 8 | 700 | 15 | Good | Class 4 | Very high | Military | Amphibious (crosses water); heavy machine gun; every faction notices it |
| Robinson R44 | Helicopter | 400,000 | 3 | 100 | 25 | Ignores terrain | — | Very high | Civilian | Smallest and cheapest helicopter; scouting and small teams |
| Mi-2 | Helicopter | 600,000 | 6 | 500 | 30 | Ignores terrain | — | Very high | Military | Light transport; eastern standing or the Krug |
| UH-1H | Helicopter | 900,000 | 8 | 1,000 | 30 | Ignores terrain | — | Very high | Military | Door gun; western standing or the Krug |
| Mi-8 | Helicopter | 1,500,000 | 14 | 3,000 | 35 | Ignores terrain | Light (cockpit) | Extreme | Military | Largest lift; needed for big hauls from hidden cities |

**Helicopters (draft)**

- **Movement:** ignore terrain — one hour per region over any ground, including mountains, woods and water.
- **Landing:** on any region and any open tile except water. Hidden cities can only be reached this way.
- **Seats include the pilot:** one soldier with Technical 50+ (or a hired pilot on salary) must fly it.
- **Visibility:** heard and seen from far away; every faction in range notices it, and military points of interest may fire on it.
- **Fuel and upkeep:** refuel only at FOBs and oil plants; expensive to run and repair.
- **Losing one:** a downed helicopter is a crash site, and its crew starts an emergency op to get home on foot.

## Presentation & tech

### Art direction

Late-90s 3D (PlayStation 1 / early PC era) rendered with modern lighting: chunky, readable shapes in moody, dynamic light.

**Retro base**

- Low-poly models (roughly 500–2,000 triangles per character), small textures (64–256 px) with nearest-neighbour filtering.
- Low internal render resolution (e.g. 360–480 px tall) upscaled with crisp pixels, limited palette and ordered dithering.
- Optional PSX quirks as a toggle: vertex jitter, affine texture warping, short draw distance hidden by fog.
- Era references for mood: Metal Gear Solid (1998), Syphon Filter, Rainbow Six (1998).

**Modern layer**

- Dynamic lights from muzzle flashes, flashlights, flares and explosions, with real-time shadows.
- Volumetric fog and smoke, bloom, day/night and weather.
- Lighting is mostly atmosphere: at night, sight and spotting ranges drop to a third, unless the soldier has a flashlight equipped, which restores the full day range. No other light level affects spotting; smoke and noise feed the stealth and visibility rules.

**Why it fits the browser:** a low internal resolution and small assets keep downloads and GPU load down, so the style doubles as the mobile performance strategy. Effects scale by quality tier (phones: baked lighting, few shadow casters; desktop: full effects).

### UX, tech & scope

- **Engine:** the prototype is built on Three.js (see Prototype tech stack). Babylon.js stays an option for the full game; the rules core is engine-independent, so a switch does not touch game logic. WebGL2 baseline, WebGPU where available.
- **Key screens:** strategic map, squad/loadout, inventory lists, tactical HUD with shot preview, soldier dossier, trader.
- **Vertical slice goal:** 1 strategic map, 1 FOB, 1 operation map, 6 soldiers, 15 weapons, 1 trader — proves the full loop end to end.

#### Prototype tech stack

The prototype is built with AI assistance, so the stack favours plain text files the AI can read and change, wide AI familiarity, small size and one-step deployment.

| Area | Choice | Why |
| --- | --- | --- |
| 3D | Three.js | Most widely used web 3D library: the most examples, so AI-written code works first time more often; small and browser-native |
| Language | JavaScript (ES modules) | No build step: the files the AI edits are exactly the files that run; profiles (soldiers, weapons, calibres, vehicles) are checked by JSON schemas instead of types |
| Build | None: Three.js through an import map, served by a static web server (tools/serve.ps1); no Node.js, no bundler, no npm | Nothing to install: the game, the tools and the tests run with only a browser and a static server (decided 2026-11-17) |
| Rules core | Plain JavaScript, separate from rendering, tested in the browser (Test Lab and tests.html) | Combat, stamina, reactions, damage and faction simulation can be changed and checked in seconds without opening the game; survives an engine switch |
| Menus and inventory | HTML/CSS over the 3D view (optionally Preact or Svelte) | List inventories, dossiers and traders are simple and touch-friendly in HTML |
| Game data | JSON files (weapons, calibres, armour, vehicles, soldiers) | Balancing means editing data, not code |
| Randomness | Seeded random generator | Same seed, same map and same shots: bugs are reproducible ("seed 4812, turn 6") |
| Debugging | In-game debug overlay: AP, stamina, line of sight, spread cone | Rules can be checked visually |
| Art | Plain boxes and flat colours first; PSX look later via low render resolution and pixel upscaling | Gameplay before assets |
| Hosting | Static site on Cloudflare Pages, Netlify or GitHub Pages, deployed on every push | A live link for desktop and phone within about a minute |
| Workflow | Claude Code in a local project folder | Edits files, runs the tests and pushes the deploy in one go |

**Build order**

1. Tactical grid with boxes, movement and action points.
2. Line of sight, vision cone and reactions.
3. Shooting with the spread cone, body zones and armour.
4. Stamina and alternating activations.
5. Inventory and loadout in HTML.
6. A small strategic map, one FOB and one full op loop.

One feature per iteration, deployed after each push and tested on desktop and phone. Features tagged OPTIONAL (hidden cities, earned callsigns) are left out of the first iterations.

**Browser and mobile constraints**

- **Input:** every action works with mouse and with touch — tap to select, tap-hold for the shot preview, explicit confirm button for moves and shots; no hover-only information.
- **UI:** portrait-friendly phone layout for menus and inventory; large inventory list rows and tap targets on touch.
- **Performance budget:** 30 fps on a mid-range phone, 60 fps on desktop; first load under \~50 MB, operation maps streamed in.
- **Saves:** local (IndexedDB) plus optional cloud save so a campaign continues between PC and phone.
- **Turn-based helps:** tactical combat needs no real-time precision, which suits touch and weaker devices.

**Open questions**

- [ ] Solo hobby project or team? Target release window?
- [ ] Optional co-op operations?
- [ ] Difficulty modes: Ironman save only, or save-anywhere?

## Working on this doc from several computers

This doc lives in your Claude account, not on one machine, so it is the same file everywhere.

1. **Edit by hand** — open it from any browser or the Claude desktop app, signed in to your account; changes save automatically.
2. **Edit with Claude** — in any Claude chat on any computer, paste this doc's link and ask for changes ("expand the ballistics section"). Claude reads and edits the live doc.
3. **Comment to Claude** — highlight a passage, comment, and send it to Claude; it edits that spot and replies in the thread.
4. **Back up / export** — download as Word, PDF or Markdown whenever you want a local copy.

Alternative: keep a Markdown GDD in a Git repo or synced folder (OneDrive/Dropbox) and connect that folder in Cowork on each PC. Better if you later want design docs next to game code.

# Concisus – Game Design Document

Nov 22, 2026 · @Dan

The design is split along the game's modules, as defined in [Sloperator — Development Workflow](https://claude.ai/artifact/MtPiB5ywYhqZWJ1WV7CWog). Each module has its own doc (linked in the table below), which is the source for that module's spec; Overview and Factions & campaign apply to all modules. Story and lore are kept in a separate doc, Concisus – Story & Lore.

| Section | Module | State it owns | Doc |
| --- | --- | --- | --- |
| Overview, Factions & campaign | All modules | — | This doc |
| Strategic Layer | `modules/strategic/` | `world`: map, territory, faction forces and funds | [Concisus – Strategic Layer](https://claude.ai/artifact/QnwWj2TN8KpBLZSQtKrYfd) |
| Tactical Layer | `modules/tactical/` | `battle` | [Concisus – Tactical Layer](https://claude.ai/artifact/GNNYbiyEVeDE5aSMkAdmAC) |
| Management | `modules/management/` | `roster`, `unlocks`, `economy`, `contracts`, `reputation` | [Concisus – Management](https://claude.ai/artifact/YEqX1rkSrMKyHM9QZNc1gm) |
| AI | `modules/strategic-ai/`, `modules/tactical-ai/` | — (issues player commands) | [Concisus – AI](https://claude.ai/artifact/YP83ifkKNgpneG9n3NJym1) |
| Data definitions | `/data`, authored with the tools | — (static definitions) | [Concisus – Data definitions](https://claude.ai/artifact/SbLq44ibBcZfW794JS75gc) |
| Presentation & tech | `game/` shell | — | [Concisus – Presentation & tech](https://claude.ai/artifact/N9iV7NEGphvuXNabVGnc33) |

Reference lists live in their own docs: [Strategic actions](https://claude.ai/artifact/DoCjjyCcrZLa6uhd3izwmt), [Tactical actions](https://claude.ai/artifact/AAamT6WGHuQ4C4C8VQxqvA), [World events](https://claude.ai/artifact/HJG62N9ZiB6SxKSSrHi67E), [Item list](https://claude.ai/artifact/3ZE9h1z8kMDFDuWB4muJRJ) and [Callsigns](https://claude.ai/artifact/G1VpofmrmhUf2J8JNSY58o).

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

**Starting relations (draft — values for review):** factions also hold relations toward each other, from −100 to 100 (see World events in the Strategic Layer doc). They start symmetric; resistance groups and a rogue PMC start at 0 toward everyone when they appear.

| Relation at start (draft) | SSV | VDK | Varyag | Aegis | Krug |
| --- | --- | --- | --- | --- | --- |
| SSV | — | −80 | +60 | −60 | 0 |
| VDK | −80 | — | −60 | +60 | 0 |
| Varyag | +60 | −60 | — | −40 | 0 |
| Aegis | −60 | +60 | −40 | — | 0 |
| Krug | 0 | 0 | 0 | 0 | — |

### Leaders

Each leader's personal habit (see Story & Lore) has one effect in play.

| Leader | Faction | Effect in play |
| --- | --- | --- |
| Marshal Mikhail Orlov | SSV | Contracts arrive as formal written orders; breaches of protocol cost standing (draft: −5 reputation with the SSV per breach, e.g. a hand-over after the deadline). |
| Aleksandr Volkov | VDK | Meetings with the VDK move at short notice; his whereabouts are sensitive information. |
| Anton Sokolov | Varyag Solutions | Now and then the player receives a letter naming a fallen soldier's callsign (draft: 25% chance per soldier killed by Varyag, at most one letter per 7 days; no gameplay effect). |
| Daniel Rook | Aegis Group | Aegis learns the player's habits and adapts to them over time (OPTIONAL — deferred for now: no AI memory in the first build iterations). |
| Viktor Karsin | The Krug | Debts with the Krug are literal entries in his book; paying one clears it. |

### The Krug

The Krug runs by its own Code: hard, public and the same for members, outsiders and the player (origin in Story & Lore).

**In play**

- Krug markets are no-fire zones and neutral meeting points; breaking the peace there turns the whole network hostile.
- Standing with the Krug is earned by keeping deals; it unlocks local recruits (draft: standing 0 or more), better stock (draft: 20+), smuggling routes for ops (draft: 35+) and safe houses (draft: 50+).
- Some Krug members resent all foreign soldiers, including the player's: Krug recruits and Krug deals cost the player more (draft: +10%), and some Krug squads refuse escort work for a foreign PMC (draft: 20% chance per escort request). Foreign PMCs are the player's PMC, Varyag, Aegis and a rogue PMC; the SSV, the VDK and the Krug never count.

### Player role

- **Contractor first, kingmaker later:** early contracts come from one side; mid-game the player can switch sides, work both or go independent.
- **Endings:** Veligrad united under the SSV or the VDK, reformed, locked into an endless proxy war, or seized by the player's PMC in a coup — or the PMC cashes out and leaves. A faction wins when it holds the capital and a set share of all tiles for a set number of days without a break (draft: 60% of tiles for 14 days); losing the capital or dropping below the share resets the count. Besides the SSV, the VDK and the player, only a rogue PMC can meet this rule; Varyag and Aegis while they serve a patron, and the Krug, cannot. If the player's PMC meets it, that counts as the coup ending, and the holding phase still follows (see Coups). A rogue PMC that meets it ends the campaign as a loss for the player. If no one has won by a day limit, the war locks into the endless proxy war (draft: Day 120). The reformed ending is a ceasefire peace: the SSV and the VDK hold a ceasefire across the whole front for a set number of days while both are exhausted (draft: 14 days); it never starts by itself: only the player can broker it, through an action at a governmental institution that takes 24 hours (draft), while the PMC has Trusted standing with both and both are exhausted. It ends the campaign, and the epilogue makes clear that the peace is only temporary. Cashing out is offered once the PMC's funds pass a target (draft: $2,000,000). There is no Krug ending for now. These numbers are data.
- **No authored story:** there is no plot and no acts. Developments on the map come from the world event system (see World events in the Strategic layer); personal stories come from soldiers' service records.
- **Region:** the whole country, divided into small regions and generated anew each playthrough (see Strategic layer).

### Coups

Any armed company strong enough to hold the capital can try.

**Player coup (ending)**

- **Requirements (draft):** the PMC controls the capital's approaches (draft: every tile next to the capital) and a set number of key regions (draft: 4), has enough soldiers (draft: 12), and both the SSV and the VDK are exhausted. Key regions are the capital and the tiles with an oil or arms plant. A faction is exhausted when it shows a set number of crisis signs or more (draft: 4). The numbers are data. Civilian loyalty and the Krug's stance decide how hard it gets.
- **The final operation:** a multi-stage op on the capital — seize command, communications and the government district — launched from the closest FOB. The coup needs the requirements met and this operation won; the holding phase follows. Meeting the victory rule (see Endings) also counts as the coup, and the holding phase follows as well. Holding the capital alone is not a coup.
- **Holding on:** after the coup the eastern and western influence both turn against the PMC. The player must hold the capital through counter-attacks until one side accepts the new order: a patron accepts once the PMC's reputation with the state it backs (eastern influence: the SSV; western influence: the VDK) is Friendly or better, or once the PMC has held the capital for a set number of days (draft: 30). Losing the capital ends the holding phase in failure.
- **Epilogue:** shaped by how the PMC took and holds power — civilian loyalty, standing with the Krug, and how many soldiers it cost.

**Rogue PMCs (rare event)**

- **Chance:** checked once per day: Varyag Solutions or Aegis Group stops serving its patron and attempts a coup of its own with a base chance plus a step for each crisis sign the patron shows, any of the ten (draft: 1% + 2% per sign); warning signs come first. A PMC rushing a capital that has lost its holder is this rogue event itself. At most one per campaign.
- **What raises it:** its patron is losing (draft: +3% while the patron has lost tiles on 3 or more of the last 5 days, the same "losing" test as for Defection in World events), its contracts go unpaid (draft: +2% per unpaid contract payment in the last 14 days, at most +6%), or it controls regions near the capital (draft: +1% per region it controls within 3 tiles, at most +5%).
- **Warning signs:** intel the player can find or miss — unusual troop movements, large arms purchases reported by the Krug, contractors pulled off the front.
- **What follows:** a new power on the map. The SSV and the VDK may hire the player to stop it; the player can also side with it, or stay out. If the rogue PMC holds the capital, it becomes the main antagonist for the rest of the campaign; if it meets the victory rule, the campaign ends as a loss for the player.

**Open questions**

- [x] Could the Krug be an ending of its own — Veligrad run by the Code instead of a government? Decided 2026-11-24: no Krug ending for now.

## Working on this doc from several computers

This doc lives in your Claude account, not on one machine, so it is the same file everywhere.

1. **Edit by hand** — open it from any browser or the Claude desktop app, signed in to your account; changes save automatically.
2. **Edit with Claude** — in any Claude chat on any computer, paste this doc's link and ask for changes ("expand the ballistics section"). Claude reads and edits the live doc.
3. **Comment to Claude** — highlight a passage, comment, and send it to Claude; it edits that spot and replies in the thread.
4. **Back up / export** — download as Word, PDF or Markdown whenever you want a local copy.

Alternative: keep a Markdown GDD in a Git repo or synced folder (OneDrive/Dropbox) and connect that folder in Cowork on each PC. Better if you later want design docs next to game code.

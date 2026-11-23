# Overview, factions and campaign — spec [GEN]

Precise rules derived from `design/`. Each section: `### [GEN-NNN] Title`, then the rule
(inputs, outputs, formula, ranges), its design source, and `→ data/<table>.json` where a concrete value
lives in data. Edited only through `/update-spec`.

Intent (no rules): the player runs a private military company in a generated modern proxy war. Soldiers
are faceless, disposable contractors whose only story is their service record; every operation is a
gamble of gear against loot, and retreat is always allowed; tactics are realistic but every hit chance
and risk is legible; the strategic map advances only when the player acts. Browser, desktop and mobile,
single-player, 40–60 hour campaign, PSX-era low-poly 3D with modern lighting. Setting and lore live in
`design/story-lore.md` and are not specced.

This file holds only rules that apply across modules. Module-specific detail is referenced by area:
STR (strategic layer, world events, strategic actions), TAC (tactical), MGT (management), DAT/ITM (data,
items).

## Operation loop

### [GEN-001] Operation as unit of play
**Rule.** The unit of play is the operation (op). Every op starts at an FOB the player owns. Sequence:
(1) the player selects one or more objectives, a squad from the roster and its loadout (MGT); (2) the squad
moves on the strategic map (STR); (3) tactical engagements happen as the route and objectives require (TAC);
(4) the squad returns to any FOB the player owns, which ends the op. There is no fixed-mission mode.
**Source.** design/design.md › Overview › Core loop

### [GEN-002] Op success condition
**Rule.** An op succeeds if and only if at least one soldier of its squad reaches an FOB the player owns.
Objective completion does not affect op success (objectives are scored separately per mission, MGT
contract rules). A contract's mission counts as completed as soon as its goal is met, even if the squad is
lost afterwards. The layer where the goal is met (tactical or strategic) detects it at once and shows
"Objective met"; the strategic layer confirms the mission (STR-027, MGT-044), and its pay is deducted from
the employer's funds and credited to the player at the next strategic hour, with a news-feed line
(STR-093). No mission needs the squad back at an FOB. Soldiers of the squad who do not reach an FOB are MIA, captured or dead (MGT);
gear carried by them is lost to the PMC unless recovered. An op whose squad has no soldier left who
reaches an FOB fails.
**Source.** design/design.md › Overview › Core loop; › Management › Gear, loot & return

### [GEN-003] Op objectives and bundling
**Rule.** Objectives come from two sources: missions of signed contracts (MGT) and player-set objectives.
Player-set objective kinds: `scout` a region, `scavenge`, `resupply`. One op may bundle any number of
objectives from any number of contracts plus player-set objectives. Player-set objectives carry no pay and
no reputation change of their own.
**Source.** design/design.md › Overview › Core loop

## Factions

### [GEN-004] Faction roster
**Rule.** The campaign has these factions, each with an ID, a kind and a leader:

| ID | Faction | Kind | Leader | Patron |
| --- | --- | --- | --- | --- |
| `ssv` | Socialist State of Veligrad | employer (state) | Marshal Mikhail Orlov | — |
| `vdk` | Veligrad Democratic Coalition | employer (state) | Aleksandr Volkov | — |
| `varyag` | Varyag Solutions | rival PMC | Anton Sokolov | `ssv` |
| `aegis` | Aegis Group | rival PMC | Daniel Rook | `vdk` |
| `krug` | The Krug | trader / neutral network | Viktor Karsin | — |
| `player` | Player's PMC | player | the player | — |

Employers post contracts (MGT). SSV contracts often target the VDK; working for an employer has no
reputation effect with its enemies by itself — only the acts a contract requires change reputation, with
the faction they directly affect (MGT-053). Rival PMCs compete for contracts and hunt player ops (STR/SAI).
The Krug trades, runs smuggling routes, neutral markets and local recruits. Every non-player faction holds
one reputation value toward the player (MGT). Every AI faction's money is held by STR (STR-092).
**Values.** faction definitions (id, name, kind, leader, patron) → data/factions.json
**Source.** design/design.md › Factions & campaign › Factions

### [GEN-005] Off-map influences
**Rule.** Two off-map powers, `east` and `west`, exist without map presence, squads or territory. They act
only through deliveries, intelligence and escalation, triggered by world events (STR). They are never
named in any UI text. They hold no reputation value toward the player.
**Values.** influence definitions → data/factions.json
**Source.** design/design.md › Factions & campaign › Factions

### [GEN-006] Civilian population
**Rule.** The civilian population is a non-combat faction. Its loyalty exists only on settlement tiles
(cities, towns, villages), one value per faction from −100 to 100 (STR-009). Per settlement, loyalty
drives income, intel and recruitment available there. It has no squads and cannot be fought as a faction.
**Source.** design/design.md › Factions & campaign › Factions; › Strategic Layer › Map (draft)

### [GEN-007] Faction relations model
**Rule.** Every ordered pair of map factions (GEN-004, excluding `player`) holds a relation value, integer
−100…100. A relation ≤ −50 means hostile, ≥ 50 means allied, otherwise neutral. Relations are changed
only by world events and their effects (STR); they decide who attacks whom. They do not change the
player's reputation: there is no spill-over to a faction's allies or enemies (MGT-053). The Krug is neutral
to every faction.
**Values.** `relation_min` — −100; `relation_max` — 100; `hostile_at` — −50; `allied_at` — 50 →
data/factions.json; initial relations per pair — not set (design: not stated) → data/factions.json
**Source.** design/design.md › Strategic layer › World events; › Management › Reputation (draft)

### [GEN-008] Leader effects
**Rule.** Each leader has exactly one in-play effect:

| Leader | Effect |
| --- | --- |
| Orlov (`ssv`) | SSV contracts are formal written orders; a protocol breach costs reputation with the SSV. |
| Volkov (`vdk`) | VDK meetings are scheduled at short notice; Volkov's location is sensitive intel. |
| Sokolov (`varyag`) | Occasionally, after a player soldier has died, the player receives a letter naming that soldier's callsign (no mechanical effect). |
| Rook (`aegis`) | Aegis tracks the player's habits and adapts its tactics to them over time (SAI/TAI). |
| Karsin (`krug`) | Every debt with the Krug is a ledger entry; paying the entry's amount clears it (MGT economy). |

**Values.** protocol breach reputation cost, letter frequency, adaptation rate — not set (design: not
stated) → data/factions.json
**Status.** open
**Source.** design/design.md › Factions & campaign › Leaders

## The Krug

### [GEN-009] Krug markets as no-fire zones
**Rule.** A Krug market is a no-fire zone. Any player attack or weapon fire inside a Krug market sets the
player's Krug reputation per the "fight in a Krug market" act (MGT) and turns the whole Krug network
hostile to the player.
**Source.** design/design.md › Factions & campaign › The Krug

### [GEN-010] Krug standing unlocks
**Rule.** Krug reputation is raised only by keeping deals (MGT reputation acts). Krug standing unlocks, in
order of standing: better market stock, smuggling routes usable by ops (STR), safe houses (STR) and local
recruits (MGT hiring pool). Some Krug members resent all foreign soldiers including the player's,
independent of standing (effect: STR/lore).
**Values.** standing level required per unlock — not set (design: not stated) → data/factions.json
**Status.** open
**Source.** design/design.md › Factions & campaign › The Krug

## Campaign

### [GEN-011] Player allegiance
**Rule.** The player may at any time work for one employer, for both, or for none (independent). Early in
the campaign contracts come from one side only; switching sides and working both become possible
mid-game. There is no authored plot; map developments come only from world events (STR) and personal
stories only from service records (MGT).
**Values.** when the second side becomes available — not set (design: not stated)
**Status.** open
**Source.** design/design.md › Factions & campaign › Player role

### [GEN-012] Campaign end states
**Rule.** The campaign ends in exactly one of: `ssv_united` (Veligrad united under the SSV),
`vdk_united` (united under the VDK), `reformed`, `endless_war` (locked into an endless proxy war),
`player_coup` (seized by the player's PMC, GEN-013…GEN-016), `cash_out` (the player cashes out and
leaves, at the player's choice). On end, a score is computed from money, reputation and surviving soldiers
(MGT). For now the only campaign-ending coup is the player's: a rival PMC that comes to hold the capital
(STR-007) just becomes its holder, and the campaign goes on.
**Values.** trigger conditions for `ssv_united`, `vdk_united`, `reformed`, `endless_war` — not set
(design: not stated)
**Status.** open
**Source.** design/design.md › Factions & campaign › Player role; › Strategic Layer › Map (draft); › Management › Base & meta progression

## Coups

### [GEN-013] Player coup requirements
**Rule.** The player may launch a coup only when all hold: the PMC controls the capital's approaches; the
PMC controls at least `coup_key_regions` key regions; the roster has at least `coup_min_soldiers`
soldiers; both the SSV and the VDK are exhausted. Civilian loyalty and Krug standing do not gate the coup;
they scale its difficulty.
**Values.** `coup_key_regions`, `coup_min_soldiers`, definition of "exhausted", difficulty scaling — not
set (design: draft, no numbers) → data/factions.json (campaign section)
**Status.** open
**Source.** design/design.md › Factions & campaign › Coups

### [GEN-014] Coup final operation
**Rule.** The coup is a multi-stage op launched from the FOB closest to the capital, with three stage
objectives: seize command, seize communications, seize the government district. Op success rules
(GEN-002) apply per stage.
**Source.** design/design.md › Factions & campaign › Coups

### [GEN-015] Holding the capital
**Rule.** The capital can fall and is then contested (STR-007). When the player's PMC holds the contested
capital for `capitalHoldDays` (STR-007), it becomes the capital's holder, and that counts as the
`player_coup` ending. After a successful coup op, both `east` and `west` turn against the PMC and drive
counter-attacks on the capital (STR); the design also says the player must hold on until one of them
accepts the new order. Losing the capital before the ending ends the coup attempt. How the hold time and
"accepts the new order" fit together is open.
**Values.** `capitalHoldDays` — 7 (draft) → data/strategic-rules.json (STR-007); acceptance condition,
consequence of losing the capital — not set (design: not stated)
**Status.** open
**Source.** design/design.md › Factions & campaign › Coups; › Strategic Layer › Map (draft)

### [GEN-016] Coup epilogue
**Rule.** The `player_coup` epilogue is selected from three inputs: civilian loyalty, Krug standing and
the number of soldiers lost during the campaign.
**Source.** design/design.md › Factions & campaign › Coups

### [GEN-017] Rogue PMC chance
**Rule.** There is no fixed chance per campaign. Once per day (daily check, STR-004), for each candidate
(`varyag`, `aegis`) roll (seeded) whether it stops serving its patron and attempts a coup of its own. The
chance grows with the crisis signs its patron shows (STR-069: low funds, troop losses, lost territory and
the rest) and rises further when the patron is losing, the candidate's contracts go unpaid, or it controls
regions near the capital. Warning signs come first (GEN-018, STR-052): the coup starts only after its
warning lead time. A capital that loses its holder (STR-007) can also trigger a PMC rushing it to take it.
At most one rogue PMC per campaign. A rogue PMC that comes to hold the capital just becomes its holder; it
does not end the campaign (GEN-012).
**Values.** chance per crisis sign and per factor, capital-rush chance, warning lead time — not set
(design: not stated) → data/factions.json
**Status.** open
**Source.** design/design.md › Factions & campaign › Coups › Rogue PMCs

### [GEN-018] Rogue PMC warning signs and aftermath
**Rule.** Before a rogue coup, warning-sign intel appears that the player can find or miss: unusual troop
movements, large arms purchases reported by the Krug, contractors pulled off the front (STR intel). When
it happens the rogue PMC becomes a new power with no patron; the SSV and the VDK may post contracts to stop
it (MGT); the player may side with it or stay out. If it holds the capital it is the main antagonist for
the rest of the campaign.
**Source.** design/design.md › Factions & campaign › Coups › Rogue PMCs

## Open questions

1. **Resolved (design 8972470):** yes — an op succeeds when at least one soldier gets back to an FOB; a
   contract's missions count as completed as soon as their goal is met. GEN-002: does an op count as succeeded if only part of the squad returns? Assumed yes (any soldier
   reaching an FOB), failure only if none returns.
2. GEN-012: trigger conditions for the four non-coup endings and for when `cash_out` is offered are not
   designed.
3. GEN-013: "exhausted", "key regions" and the coup thresholds are undefined.
4. GEN-015: what ends the holding phase in failure, and how "accepts the new order" is decided.
5. **Resolved (design eb072a2):** checked once per day; the more crisis signs its patron shows, the higher
   the chance, with warning signs first; a capital losing its holder can also trigger a PMC rushing it
   (GEN-017). GEN-017: is the 5–10% chance rolled once at start, or per day with rising modifiers? The design says
   "in each campaign" plus "what raises it", which suggests a running check.
6. GEN-007: initial relation values between factions are not given; Rook/Orlov/Sokolov effects (GEN-008)
   have no numbers.
7. GEN-010: Krug standing levels for each unlock, and the gameplay effect of members resenting foreign
   soldiers.
8. Design open: could the Krug be an ending of its own (rule by the Code)? Not in GEN-012 until decided.
9. GEN-013, GEN-015: the player holding the capital for the hold time "counts as the coup ending" — must
   the coup requirements (GEN-013) be met and the final operation (GEN-014) run first, and does the
   holding-on phase until east or west accepts the new order still follow?
10. GEN-017: how does the daily chance grow with the patron's crisis signs (per sign, curve)? Which
    signs count (the design names low funds, troop losses, lost territory)? Is a "PMC rushing the
    capital" the rogue-PMC event itself (counting toward the once-per-campaign limit) or a separate move
    by any PMC?

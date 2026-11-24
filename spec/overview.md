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
**Source.** design/design.md › Overview › Core loop; design/management.md › Gear, loot & return

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
**Source.** design/design.md › Factions & campaign › Factions; design/strategic-layer.md › Map (draft)

### [GEN-007] Faction relations model
**Rule.** Every ordered pair of map factions (GEN-004, excluding `player`) holds a relation value, integer
−100…100. A relation at or below the hostile threshold means hostile, at or above the allied threshold
allied, otherwise neutral (range and thresholds → see STR-051). Relations are changed
only by world events and their effects (STR); they decide who attacks whom. They do not change the
player's reputation: there is no spill-over to a faction's allies or enemies (MGT-053). The Krug is neutral
to every faction. Start relations are symmetric (A→B = B→A) and set per pair in data:

| Start (design draft) | SSV | VDK | Varyag | Aegis | Krug |
| --- | --- | --- | --- | --- | --- |
| SSV | — | −80 | +60 | −60 | 0 |
| VDK | −80 | — | −60 | +60 | 0 |
| Varyag | +60 | −60 | — | −40 | 0 |
| Aegis | −60 | +60 | −40 | — | 0 |
| Krug | 0 | 0 | 0 | 0 | — |

Factions that appear during the campaign (resistance groups, STR-067; a rogue PMC, STR-066) start at 0
toward everyone, except where the event that creates them sets a stance (see Open questions 11).
**Values.** range and thresholds → see STR-051 (`relationMin` −100, `relationMax` 100, `hostileAt` −50,
`alliedAt` 50 in data/strategic-rules.json); `startRelations` per faction record — the table above (design
draft) → data/factions.json
**Source.** design/design.md › Factions & campaign › Factions (Starting relations); design/strategic-layer.md › World events (draft) (How events work); design/management.md › Reputation (draft)

### [GEN-008] Leader effects
**Rule.** Each leader has exactly one in-play effect:

| Leader | Effect |
| --- | --- |
| Orlov (`ssv`) | SSV contracts are formal written orders; each protocol breach (e.g. a hand-over after the deadline) changes reputation with the SSV by `leaderEffect.protocolBreachReputation`. |
| Volkov (`vdk`) | VDK meetings are scheduled at short notice; Volkov's location is sensitive intel. |
| Sokolov (`varyag`) | For each player soldier killed by Varyag, roll `leaderEffect.letterChance` (seeded); on success the player receives a letter naming that soldier's callsign, at most one letter per `leaderEffect.letterMinDays` days (no mechanical effect). |
| Rook (`aegis`) | **(optional)** Aegis learns the player's habits and adapts to them over time. Deferred: no AI memory in the first build iterations (SAI-001). |
| Karsin (`krug`) | Every debt with the Krug is a ledger entry; paying the entry's amount clears it (MGT economy). |

**Values.** `leaderEffect.protocolBreachReputation` −5 (design draft), `leaderEffect.letterChance` 0.25
(design draft), `leaderEffect.letterMinDays` 7 (design draft) → data/factions.json (SSV and Varyag records);
Rook adaptation — deferred (optional).
**Source.** design/design.md › Factions & campaign › Leaders

## The Krug

### [GEN-009] Krug markets as no-fire zones
**Rule.** A Krug market (a town or city tile flagged `krugMarket`, STR-010) is a no-fire zone. Any player
attack or weapon fire inside a Krug market sets the
player's Krug reputation per the "fight in a Krug market" act (MGT) and turns the whole Krug network
hostile to the player.
**Source.** design/design.md › Factions & campaign › The Krug

### [GEN-010] Krug standing unlocks
**Rule.** Krug reputation is raised only by keeping deals (MGT reputation acts). Each Krug unlock is
available while the player's Krug reputation ≥ its required standing; in order of standing: local recruits
(MGT hiring pool), better market stock, smuggling routes usable by ops (STR), safe houses (STR). Some Krug
members resent all foreign soldiers including the player's, independent of standing (gameplay effect not
designed, see Open questions 7).
**Values.** `standingUnlocks` — `localRecruits` 0, `marketStock` 20, `smugglingRoutes` 35, `safeHouses` 50
(design draft) → data/factions.json (Krug record)
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
**Rule.** The campaign ends in exactly one of: `ssvUnited` (Veligrad united under the SSV),
`vdkUnited` (united under the VDK), `reformed`, `endlessWar` (locked into an endless proxy war),
`playerCoup` (seized by the player's PMC, GEN-013…GEN-016), `cashOut` (the player cashes out and
leaves, at the player's choice). There is no Krug ending. On end, a score is computed from money,
reputation and surviving soldiers (MGT). Checked at each daily check (STR-004):
- **Faction victory** (`ssvUnited`, `vdkUnited`): a faction wins when it is the capital's holder
  (STR-007) and controls at least `campaign.victoryTileShare` of all tiles, both held without a break for
  `campaign.victoryHoldDays` days; the count restarts whenever either condition fails.
- **`endlessWar`:** no faction has won when the day counter reaches `campaign.endlessWarDay`.
- **`cashOut`:** offered to the player (a choice, not forced) once the PMC's money (MGT `economy`) exceeds
  `campaign.cashOutFundsUsd`; taking it ends the campaign.
- **`playerCoup`:** GEN-015.
- **`reformed`:** trigger not designed.
For now the only campaign-ending coup is the player's: a rival PMC that comes to hold the capital
(STR-007) just becomes its holder, and the campaign goes on.
**Values.** `campaign.victoryTileShare` 0.6, `campaign.victoryHoldDays` 14, `campaign.endlessWarDay` 120,
`campaign.cashOutFundsUsd` 2000000 (design draft) → data/strategic-rules.json; `reformed` trigger — not set
(design: not stated)
**Status.** open
**Source.** design/design.md › Factions & campaign › Player role; design/strategic-layer.md › Map (draft); design/management.md › Base & meta progression

## Coups

### [GEN-013] Player coup requirements
**Rule.** The player may launch the coup's final operation (GEN-014) only when all hold:
- the PMC controls the capital's approaches: every tile adjacent to the capital (its 4 edge neighbours,
  STR-005);
- the PMC controls at least `coup.keyRegions` key regions. Key regions are the capital tile and every tile
  with an oil or arms plant (STR-010);
- the roster has at least `coup.minSoldiers` soldiers;
- both the SSV and the VDK are exhausted: a faction is exhausted while it has at least
  `coup.exhaustedSigns` true crisis signs at the last daily check (STR-069).
Civilian loyalty and Krug standing do not gate the coup; they scale its difficulty.
**Values.** `coup.keyRegions` 4, `coup.minSoldiers` 12, `coup.exhaustedSigns` 4 (design draft) →
data/strategic-rules.json; difficulty scaling — not set (design: no numbers)
**Status.** open
**Source.** design/design.md › Factions & campaign › Coups

### [GEN-014] Coup final operation
**Rule.** The coup is a multi-stage op launched from the FOB closest to the capital, with three stage
objectives: seize command, seize communications, seize the government district. Op success rules
(GEN-002) apply per stage. The coup happens only when the requirements (GEN-013) were met at launch and
this operation is won (all three stages); holding the capital alone is never a coup. On success the
holding phase starts (GEN-015).
**Source.** design/design.md › Factions & campaign › Coups

### [GEN-015] Holding phase
**Rule.** After a won coup operation (GEN-014) the holding phase runs:
- Both `east` and `west` turn against the PMC and drive counter-attacks on the capital (STR).
- **Success:** the phase ends, and the `playerCoup` ending is reached, as soon as one patron accepts the
  new order: at a daily check (STR-004), a patron accepts once the PMC's reputation with it is Friendly or
  better (MGT-054), or once the PMC has held the capital for `coup.acceptDays` days since the coup.
  Who "the patron" is for the reputation test is open (Open questions 11).
- **Failure:** losing control of the capital tile ends the holding phase in failure; the campaign goes on
  (STR-007: the capital becomes contested).
The capital's own hold timer (STR-007, `capitalHoldDays`) runs as for any occupant; it does not by itself
end the campaign for the player.
**Values.** `coup.acceptDays` 30 (design draft) → data/strategic-rules.json
**Status.** open
**Source.** design/design.md › Factions & campaign › Coups; design/strategic-layer.md › Map (draft)

### [GEN-016] Coup epilogue
**Rule.** The `playerCoup` epilogue is selected from three inputs: civilian loyalty, Krug standing and
the number of soldiers lost during the campaign.
**Source.** design/design.md › Factions & campaign › Coups

### [GEN-017] Rogue PMC chance
**Rule.** Once per day (daily check, STR-004), while no rogue PMC has appeared yet, for each candidate
(`varyag`, `aegis`) roll (seeded) whether it stops serving its patron (Varyag: SSV, Aegis: VDK) and
attempts a coup of its own. Chance per day = `rogueChance.base` + `rogueChance.perSign` × the number of
true crisis signs its patron shows (any of the ten, STR-069), plus a further rise for each of: its patron is
losing, its contracts go unpaid, it controls a region within `rogueChance.nearCapitalRange` tiles of the
capital. A success schedules the rogue PMC event (STR-066) with its warning signs first (GEN-018,
STR-052). The rogue event's effect is the PMC rushing the capital; a PMC rushing a capital that has lost
its holder (STR-007) is this same event, not a separate move. At most one rogue PMC per campaign. A rogue
PMC that comes to hold the capital just becomes its holder; it does not end the campaign (GEN-012).
**Values.** `rogueChance.base` 0.01, `rogueChance.perSign` 0.02, `rogueChance.nearCapitalRange` 3 (design
draft) → data/factions.json (Varyag and Aegis records); the rise per factor (`patronLosingBonus`,
`unpaidContractsBonus`, `nearCapitalBonus`) and what "patron is losing" means — not set (design: not
stated) → data/factions.json `rogueChance`; warning lead time → STR-052.
**Status.** open
**Source.** design/design.md › Factions & campaign › Coups › Rogue PMCs; design/world-events.md › Events (Rogue PMC)

### [GEN-018] Rogue PMC warning signs and aftermath
**Rule.** Before a rogue coup, warning-sign intel appears that the player can find or miss: unusual troop
movements, large arms purchases reported by the Krug, contractors pulled off the front (STR intel). When
it happens the rogue PMC becomes a new power with no patron, with its own controller and doctrine (SAI-002,
SAI-010) and its own funds (STR-092); the SSV and the VDK may post contracts to stop it (MGT); the player
may side with it or stay out. If it holds the capital it is the main antagonist for the rest of the
campaign.
**Source.** design/design.md › Factions & campaign › Coups › Rogue PMCs; design/ai.md › Strategic AI (Faction AI tiers)

## Open questions

1. **Resolved (design 8972470):** yes — an op succeeds when at least one soldier gets back to an FOB; a
   contract's missions count as completed as soon as their goal is met. GEN-002: does an op count as succeeded if only part of the squad returns? Assumed yes (any soldier
   reaching an FOB), failure only if none returns.
2. **Resolved (2026-11-24):** a faction wins by holding the capital and a share of all tiles for a number of
   days; the war locks into `endlessWar` at a day limit; cashing out is offered once funds pass a target
   (GEN-012). Still open: the trigger of `reformed`. GEN-012: trigger conditions for the four non-coup endings and for when `cashOut` is offered are not
   designed.
3. **Resolved (2026-11-24):** exhausted = at least `coup.exhaustedSigns` crisis signs; key regions = the
   capital and the oil and arms plant tiles; approaches = every tile next to the capital (GEN-013). Still
   open: how loyalty and Krug standing scale the difficulty. GEN-013: "exhausted", "key regions" and the coup thresholds are undefined.
4. **Resolved (2026-11-24):** losing the capital ends the holding phase in failure; a patron accepts once
   the PMC's reputation with it is Friendly or better or after `coup.acceptDays` days held (GEN-015). See
   question 11. GEN-015: what ends the holding phase in failure, and how "accepts the new order" is decided.
5. **Resolved (design eb072a2):** checked once per day; the more crisis signs its patron shows, the higher
   the chance, with warning signs first; a capital losing its holder can also trigger a PMC rushing it
   (GEN-017). GEN-017: is the 5–10% chance rolled once at start, or per day with rising modifiers? The design says
   "in each campaign" plus "what raises it", which suggests a running check.
6. **Resolved (2026-11-24):** start relations and the Orlov and Sokolov numbers are drafted in the design
   (GEN-007, GEN-008); Rook's adaptation is deferred (optional). GEN-007: initial relation values between factions are not given; Rook/Orlov/Sokolov effects (GEN-008)
   have no numbers.
7. GEN-010: standing levels per unlock are now drafted (**resolved 2026-11-24**); still open: the gameplay
   effect of Krug members resenting foreign soldiers.
8. **Resolved (2026-11-24):** no Krug ending for now (GEN-012). Design open: could the Krug be an ending of its own (rule by the Code)? Not in GEN-012 until decided.
9. **Resolved (2026-11-24):** the coup needs the requirements met and the final operation won; the holding
   phase follows; holding the capital alone is not a coup (GEN-013…GEN-015, STR-007). GEN-013, GEN-015: the player holding the capital for the hold time "counts as the coup ending" — must
   the coup requirements (GEN-013) be met and the final operation (GEN-014) run first, and does the
   holding-on phase until east or west accepts the new order still follow?
10. **Resolved (2026-11-24):** base chance plus a step per true crisis sign of the patron, any of the ten;
    a PMC rushing the capital is the rogue event itself, once per campaign (GEN-017). Still open: how much
    each raising factor (patron losing, unpaid contracts, near the capital) adds, and what "losing" means.
    GEN-017: how does the daily chance grow with the patron's crisis signs (per sign, curve)? Which
    signs count (the design names low funds, troop losses, lost territory)? Is a "PMC rushing the
    capital" the rogue-PMC event itself (counting toward the once-per-campaign limit) or a separate move
    by any PMC?
11. GEN-015: "a patron accepts once the PMC's reputation with it is Friendly or better" — the patrons are
    the off-map `east` and `west`, which hold no reputation toward the player (GEN-005). Is the test the
    reputation with the state each influence backs (east: SSV, west: VDK), or do the influences get a
    reputation value? Also GEN-007: new factions "start at 0 toward everyone", but the resistance event
    makes a group hostile to the tile's controller and a rogue PMC turns on its patron (STR-066, STR-067):
    the spec applies those event stances on top of 0. Confirm.
12. GEN-012: may a faction other than the SSV or the VDK (a rival or rogue PMC, the Krug) meet the victory
    condition, and what happens then (no ending is named for it)? Must the capital and the tile share be
    held without a break for the whole period (spec: yes, the count restarts)?

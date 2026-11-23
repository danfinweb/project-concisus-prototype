# Management — spec [MGT]

Precise rules derived from `design/`. Each section: `### [MGT-NNN] Title`, then the rule
(inputs, outputs, formula, ranges), its design source, and `→ data/<table>.json` where a concrete value
lives in data. Edited only through `/update-spec`.

Management owns the state slices `roster`, `unlocks`, `economy`, `contracts` and `reputation`. Item
stats and equipment slots are in DAT/ITM; map, travel, world events and faction goals in STR; in-battle
rules in TAC.

## Soldiers & progression

### [MGT-001] Soldier record
**Rule.** Each soldier in `roster` stores: `id`; `service_number` (unique per campaign, assigned at
generation, never changes); `callsign` (current displayed callsign); `callsign_source` (`generated` |
`earned` | `player`); `callsign_prestige` (0 for generated, 1–5 for earned); the eight attributes
(MGT-021); `nerve` (MGT-031); `wounds` (per body zone, structure per TAC Medical system); `salary`;
`status` (`active` | `mia` | `captured` | `dead`); `service_record` (MGT-006); `kit_marks` (cosmetic
patches and colours). No name, portrait, voice, backstory or personality is generated or stored. Derived
values (MGT-026…MGT-030) are never stored.
**Source.** design/design.md › Management › Soldiers & progression

### [MGT-002] Hiring pools
**Rule.** Soldiers are hired from hiring pools of four kinds: `agency`, `local`, `defector`,
`freed_prisoner`. Each pool offers generated candidates in price tiers. Hiring happens at an FOB (MGT-066);
local recruits also come from Krug standing (GEN-010) and civilian loyalty (GEN-006). Every FOB always
offers at least one affordable candidate, so a replacement is always available. Hiring takes no game time
(STR time rules).
**Values.** tiers per pool, candidates per pool, refresh interval — not set (design: not stated) →
data/recruitment.json
**Status.** open
**Source.** design/design.md › Management › Soldiers & progression

### [MGT-003] Hire price
**Rule.** A candidate's hire price is a function of its attributes (price follows stats) and lies within
its tier's price range. The function is not designed.
**Values.** tier price ranges, price formula — not set (design: Open) → data/recruitment.json
**Status.** open
**Source.** design/design.md › Management › Soldiers & progression

### [MGT-004] Player-chosen callsign and kit marks
**Rule.** The player cannot rename a soldier but may give one a nickname/callsign. It replaces the current
callsign, sets `callsign_source = player`, and is never replaced afterwards (by deeds or anything else).
The service number is unchanged. The player may also set `kit_marks` (cosmetic only).
**Source.** design/design.md › Management › Soldiers & progression

### [MGT-005] Salaries and renewals
**Rule.** Each soldier has a salary paid from `economy` at a fixed interval and a contract term that must
be renewed. No soldier has personal opinions; renewal is not refused for personal reasons.
The salary formula is shared with the AI factions' salaries (STR-092).
**Values.** salary formula and pay interval — not set (design: Open) → data/economy-rules.json (shared with
STR-092); salary per tier, term length, consequence of non-payment — not set (design: not stated) →
data/recruitment.json
**Status.** open
**Source.** design/design.md › Management › Soldiers & progression › Contracts & morale; › Strategic Layer › Squads and simulation (Faction funds (draft))

### [MGT-006] Service record logging
**Rule.** The game appends entries to a soldier's `service_record` automatically, each stamped with game
time (day + hour, STR clock). Entry kinds: `deployment` (op joined, op returned), `kill`, `rescue`,
`wound`, `near_miss`, `loot_carried_out` (weight and value), `comrade_lost`, plus deed entries (MGT-018).
Entries come from battle results and op results. Entries are never removed.
**Source.** design/design.md › Management › Soldiers & progression › Service record

### [MGT-007] Dossier and after-action report
**Rule.** The dossier shows a soldier's full service record and current stats. After each op an
after-action report lists, per soldier, the service-record entries added during that op. Both are read-only
views of `roster`.
**Source.** design/design.md › Management › Soldiers & progression › Service record

### [MGT-008] Squad morale persistence
**Rule.** Morale is a squad-wide value, starting at `morale_start` for a new squad, kept between fights in
`roster`. Only casualties move it (allies killed or wounded lower it, enemies killed or wounded raise it);
the in-fight changes and the low-morale disobedience rule are TAC. After a battle, Management stores the
final morale from the battle result. The low-morale flight rule (below `morale_flee_below` an activated
soldier may disobey and flee toward the nearest exit, TAC) is optional, left out of the first build
iterations; morale persistence itself is not.
**Values.** `morale_start` — 80; `morale_flee_below` — 20 (used by TAC, optional rule) → data/management-rules.json
**Status.** optional (flight rule only)
**Source.** design/design.md › Management › Soldiers & progression › Contracts & morale

### [MGT-009] Perks
**Rule.** Perks unlock when an attribute reaches a threshold. Perk list and thresholds are not designed.
**Values.** perks, thresholds — not set (design: not stated) → data/management-rules.json
**Status.** open
**Source.** design/design.md › Management › Soldiers & progression › Attributes

### [MGT-010] Persistent injuries
**Rule.** Wounds from a battle result are stored on the soldier and persist between fights until healed.
Serious wounds need hours of recovery at an FOB or field surgery; healing rules are TAC (Medical system,
Recovery after an op).
**Source.** design/design.md › Management › Soldiers & progression › Injuries

### [MGT-011] Death, MIA and capture
**Rule.** Death is permanent: `status = dead`, the soldier leaves the active roster and moves to the
memorial (MGT-012). A soldier who does not reach an FOB at op end (GEN-002) gets `status` `mia`,
`captured` or `dead` as reported by the strategic/tactical result. Gear on a dead or missing soldier stays
on the operation map and is lost to the PMC unless recovered during the op (or by insurance, MGT-036).
**Source.** design/design.md › Management › Soldiers & progression › Death; › Gear, loot & return

### [MGT-012] Memorial wall
**Rule.** A dead soldier's full record (service number, last callsign, service record) moves to the
memorial wall, a read-only list kept for the campaign.
**Source.** design/design.md › Management › Soldiers & progression › Memorial

## Callsigns

### [MGT-013] Generation callsign: row and column
**Rule.** At generation, find the soldier's highest attribute value `v`. Candidates = all attributes with
value ≥ `v − callsign_tie_margin`; pick one uniformly (seeded RNG). If `v < callsign_min`, use MGT-014.
Otherwise the picked attribute selects the row and its value selects the column band: 40–59, 60–79,
80–100. Draw one callsign uniformly from that cell (seeded), excluding unavailable ones (MGT-015).
**Values.** `callsign_tie_margin` — 5; `callsign_min` — 40; bands 40–59 / 60–79 / 80–100; callsign lists
per attribute and band → data/callsigns.json
**Source.** design/callsigns.md › Generation callsigns

### [MGT-014] Generic callsigns
**Rule.** If no attribute is ≥ `callsign_min`, draw from the Generic list (seeded), excluding unavailable
ones (MGT-015).
**Values.** Generic list (Kid, Pup, Sparrow, Bones, Private) → data/callsigns.json
**Source.** design/callsigns.md › Generation callsigns

### [MGT-015] Callsign uniqueness and suffix
**Rule.** A callsign is unavailable if any living soldier in the roster (`status` ≠ `dead`) currently
uses it. If every callsign of the selected list is unavailable, draw a base callsign from the list
(seeded) and append `-N` with the lowest N ≥ 2 that makes it available (e.g. `Ox-2`). Applies to generated
and earned callsigns.
**Source.** design/callsigns.md › Generation callsigns; design/design.md › Management › Deeds and callsigns

### [MGT-016] Callsign assigned once
**Rule.** The generation callsign is assigned once at generation and never re-rolled when attributes
change. Until deeds are implemented, soldiers keep it unless the player sets one (MGT-004).
**Source.** design/callsigns.md › Generation callsigns; design/design.md › Management › Deeds and callsigns

## Deeds and earned callsigns

### [MGT-017] Deed definitions
**Rule.** A deed has an `id`, a prestige rank 1–5, a trigger condition evaluated on service-record data,
and a list of callsigns. Initial deeds: 5 ops returned (1); ≥100 kg loot carried out in one op (1); 10
wounds treated in the field (1); 3 minefields or demolition targets cleared (2); kill at ≥50 tiles (2);
survived a fight with head or thorax below 10% HP (2); 3 kills in one activation (3); only squad member
back from an op (3); carried/dragged a wounded squadmate to an exit under fire (4); captured a VIP alive
(4); returned to an FOB after being reported MIA (4); killed a General or faction leader (5); 50 ops
returned (5).
**Values.** deed list, thresholds (5, 100 kg, 10, 3, 50 tiles, 10%, 3, 50), prestige, callsigns →
data/callsigns.json
**Status.** optional
**Source.** design/callsigns.md › Earned callsigns

### [MGT-018] Deed logging
**Rule.** When a deed's condition is met, a deed entry is appended to the service record. Every deed is
logged, whether or not it changes the callsign. Whether a repeatable deed can be logged more than once is
open.
**Status.** optional
**Source.** design/design.md › Management › Deeds and callsigns

### [MGT-019] Earned callsign replacement
**Rule.** On a new deed with prestige `p`: if `callsign_source = player`, no change. Else if
`callsign_source = generated` or `p > callsign_prestige`, draw a callsign from the deed's list per
MGT-015, set `callsign_source = earned`, `callsign_prestige = p`. Equal or lower prestige keeps the current
callsign.
**Status.** optional
**Source.** design/design.md › Management › Soldiers & progression › Earned marks; › Deeds and callsigns

### [MGT-020] Fallen keep last callsign
**Rule.** A soldier who dies keeps the last callsign held on the memorial wall. That callsign becomes
available again for living soldiers (MGT-015 counts living soldiers only).
**Status.** optional
**Source.** design/design.md › Management › Deeds and callsigns

## Soldier attributes

### [MGT-021] Attribute set
**Rule.** Every soldier has eight integer attributes, each 1–100. Physical: `strength`, `endurance`,
`agility`, `perception`. Skills: `marksmanship`, `recon`, `medical`, `technical`. All other soldier values
are derived from these (plus `nerve`).
**Values.** `attribute_min` — 1; `attribute_max` — 100 → data/management-rules.json
**Source.** design/design.md › Management › Soldier attributes

### [MGT-022] Attribute generation
**Rule.** A new candidate rolls each attribute (seeded) within the ranges of its price tier and pool.
Distribution is not designed.
**Values.** per-tier attribute ranges, distribution — not set (design: not stated) →
data/recruitment.json
**Status.** open
**Source.** design/design.md › Management › Soldier attributes › Rules

### [MGT-023] Skill growth by use
**Rule.** Skills gain experience from use and rise with diminishing returns: fast below
`skill_fast_below`, slow above `skill_slow_above`, medium between. Gaining uses: marksmanship — hitting
targets, reloading under fire; recon — moving unseen, scouting; medical — treating wounds; technical —
repairing, modding, using explosives. Uses are reported in battle results (TAC) and op results (STR).
Capped at `attribute_max`.
**Values.** `skill_fast_below` — 50; `skill_slow_above` — 80; xp per use, xp per point per band — not set
(design: not stated) → data/management-rules.json
**Status.** open
**Source.** design/design.md › Management › Soldier attributes › Rules

### [MGT-024] Physical attribute changes
**Rule.** Physical attributes do not grow with use. They change only through rare service-record events:
a serious wound, a long recovery, hard campaigning.
**Values.** event conditions and change amounts — not set (design: not stated) →
data/management-rules.json
**Status.** open
**Source.** design/design.md › Management › Soldier attributes › Rules

### [MGT-025] Skill drift
**Rule.** Unused skills slowly drift back toward a floor.
**Values.** drift rate, floor, idle time — not set (design: not stated) → data/management-rules.json
**Status.** optional
**Source.** design/design.md › Management › Soldier attributes › Rules

### [MGT-026] Action points
**Rule.** Action points derive from Agility (main). The formula is owned by the Tactical Layer (TAC-006);
Management stores only the attribute and computes nothing here.
**Source.** design/design.md › Management › Soldier attributes › Derived values; › Tactical Layer (Action points)

### [MGT-027] Stamina pool
**Rule.** The stamina pool derives from Endurance (main). The formula is owned by the Tactical Layer
(TAC-009); Management stores only the attribute.
**Source.** design/design.md › Management › Soldier attributes › Derived values; › Tactical Layer › Turn structure (Stamina)

### [MGT-028] HP per zone
**Rule.** HP per body zone derives from Endurance (main). The formula, including rounding, is owned by the
Tactical Layer (TAC-057); Management stores only the attribute.
**Source.** design/design.md › Management › Soldier attributes › Derived values; › Tactical Layer › Body zones and hitboxes

### [MGT-029] Carry capacity
**Rule.** Carry capacity is derived from Strength (main) and Endurance (minor). Formula not designed.
**Values.** formula — not set (design: Open) → data/management-rules.json
**Status.** open
**Source.** design/design.md › Management › Soldier attributes › Derived values

### [MGT-030] Other derived values
**Rule.** Each derived value uses at most a main and a minor attribute. This table only names the
attributes; the formulas are owned by the Tactical Layer (or STR where noted), and Management holds no
values for them:

| Derived value | Main | Minor | Formula owner |
| --- | --- | --- | --- |
| Shooter spread | marksmanship | perception (at range) | TAC hit model |
| Recoil control | marksmanship | strength | TAC hit model |
| Reload and weapon swap cost | marksmanship | agility | TAC Tactical actions: reload from Marksmanship and weapon ergonomics; swap from Agility and weapon weight |
| Spotting and sight range | perception | recon | TAC; night sight TAC-004 |
| Reaction chance | perception (reactor) | agility (mover) | TAC-022 |
| Noise and concealment | recon | agility | TAC |
| Treatment speed and effect | medical | — | TAC Medical system |
| Repairs, explosives, piloting | technical | — | TAC; helicopter pilot minimum STR-034 |

**Source.** design/design.md › Management › Soldier attributes › Derived values; design/tactical-actions.md

### [MGT-031] Nerve
**Rule.** `nerve` is not rolled; it starts at 0 and grows with deployments survived and fights under fire
(from the service record). Higher nerve lowers the effect of suppression and how much casualties lower
morale for that soldier (applied in TAC). That effect is not implemented in the first build iterations
(deferred); nerve is still tracked.
**Values.** growth per deployment/fight, scale, effect sizes — not set (design: not stated) →
data/management-rules.json
**Status.** open; effect optional
**Source.** design/design.md › Management › Soldier attributes › Nerve

## Gear, loot & return

### [MGT-032] Inventory model
**Rule.** Inventory is item lists, no grids. Every container (vest, belt, backpack, vehicle storage, FOB
stash) holds any items while total item weight ≤ its weight limit. Adding an item that exceeds the limit
is rejected. Container limits and item weights are ITM.
**Source.** design/design.md › Management › Gear, loot & return

### [MGT-033] Carried weight effect
**Rule.** Total weight a soldier carries affects AP and stamina (relative to carry capacity, MGT-029).
Formula not designed; applied in TAC.
**Values.** weight → AP/stamina penalty — not set (design: not stated) → data/management-rules.json
**Status.** open
**Source.** design/design.md › Management › Gear, loot & return

### [MGT-034] Weapon modding
**Rule.** Weapons with mod slots (muzzle, stock, grips, handguard, optics, magazines) can have mods
attached or removed from the stash. Mod effects (accuracy, ergonomics, recoil, audible range, AP cost) and
slots are ITM. Where modding is allowed (FOB only or also in the field) and whether it needs Technical is
not stated.
**Status.** open
**Source.** design/design.md › Management › Gear, loot & return

### [MGT-035] Loot carried out
**Rule.** Loot categories: weapons, armour, intel documents, valuables, medical supplies, quest items
(ITM). Items carried by soldiers who reach an FOB at op end are moved to that FOB's stash and logged as
`loot_carried_out` (MGT-006). Rarity by location is mapgen (STR/TAC).
**Source.** design/design.md › Management › Gear, loot & return

### [MGT-036] Insurance
**Rule.** The player may insure gear. For each insured item lost on an op (MGT-011), roll (seeded) a
recovery chance; on success the item returns to the stash.
**Values.** premium, recovery chance, delay — not set (design: not stated) → data/management-rules.json
**Status.** open
**Source.** design/design.md › Management › Gear, loot & return › Risk control

### [MGT-037] Loadout presets
**Rule.** The player can save named loadout presets (item IDs per container) and apply one to a soldier;
applying takes items from the FOB stash, missing items are reported and left empty.
**Source.** design/design.md › Management › Gear, loot & return › Risk control

### [MGT-038] Scav loadout and rebuild floor
**Rule.** A cheap "scav" loadout is always purchasable at every FOB, and the contract board always offers
at least one low-risk contract, so a PMC that lost its gear can rebuild.
**Values.** scav loadout contents and price, low-risk contract definition — not set (design: not stated) →
data/presets.json, data/management-rules.json
**Status.** open
**Source.** design/design.md › Management › Gear, loot & return › Design risk

### [MGT-039] Faction traders
**Rule.** Each employer faction has traders whose available stock is gated by the player's standing with
that faction (MGT-055): Hostile — no trade; Unfriendly — basic stock at higher prices
(`unfriendly_price_markup`); Neutral — basic; Friendly — military gear; Trusted — armoured vehicles,
helicopters, best stock. Trading takes no game time.
**Values.** stock lists per faction and standing → data/traders.json; `unfriendly_price_markup` — not set
(design: Open) → data/management-rules.json
**Source.** design/design.md › Management › Gear, loot & return › Traders; › Reputation › Standing

### [MGT-040] Krug market prices
**Rule.** Krug markets have prices that fluctuate over time and are public: every price is visible to the
player without intel. Stock improves with Krug standing (GEN-010).
**Values.** fluctuation rule and interval — not set (design: not stated) → data/traders.json
**Status.** open
**Source.** design/design.md › Management › Gear, loot & return › Traders

## Contracts and missions

### [MGT-041] Contract origin
**Rule.** Management does not invent contracts. A contract offer is received from the strategic layer /
strategic AI when a faction has a goal it cannot cover with its own squads or wants deniable; from a
faction with intel on a rival's goal (counter-contract against that goal, so both sides of one job may be
on the board); or from world events and desperate measures (STR). Management stores offers in `contracts`.
**Source.** design/design.md › Management › Contracts and missions › Where contracts come from

### [MGT-042] Contract structure
**Rule.** A contract has: `id`, `employer` (faction ID), `goal` (source faction goal), one or more
`missions`, per mission targets and locations, `deadline` (game time, whole hours), `pay` (MGT-046),
`advance`, `reputation_gain`, `target_faction`, `intel_level` (MGT-049), `deniable` (bool), `posted_at`
(board location). The player signs a contract to accept it.
**Source.** design/design.md › Management › Contracts and missions › Contract terms

### [MGT-043] Goal to mission mapping
**Rule.** A faction goal generates missions only from its allowed set:

| Goal | Mission types |
| --- | --- |
| supply_run | retrieve_deliver, escort_shipment |
| attack_poi | capture_territory, assassinate_vip (defending commander) |
| defend_poi | defend_territory, escort_shipment, capture_territory (retake) |
| escort | escort_vip, escort_shipment |
| hunt | capture_vip, assassinate_vip |
| trade_route (Krug) | retrieve_deliver, escort_shipment |
| intel_needs (any) | retrieve_deliver (documents, captured equipment) |

**Values.** mapping → data/missions.json
**Source.** design/design.md › Management › Contracts and missions

### [MGT-044] Mission outcome conditions
**Rule.** Each mission resolves to `success` or `failure`. A mission counts as completed (`success`) the
moment its goal is met, even if the squad is lost afterwards; later events of the op do not undo it
(GEN-002). The layer where the goal is met detects it at once and shows "Objective met": tactical (VIP
killed or captured, target destroyed, cargo saved; TAC-076) or strategic (delivery, hand-over, holding a
place long enough, deadline; STR-027). Strategic confirms the mission, from the battle result or its own
check, and reports it to Management as `missionOutcome`; Management then books the mission's pay share
(MGT-047). No mission needs the squad to return to an FOB:

| Mission | Success | Failure |
| --- | --- | --- |
| retrieve_deliver | items handed over at destination before deadline | items lost, sold elsewhere or late |
| escort_shipment | convoy arrives with most of its cargo | convoy destroyed or captured |
| escort_vip | VIP arrives alive | VIP killed or captured |
| capture_vip | VIP delivered alive | VIP killed, escapes or rescued |
| assassinate_vip | VIP confirmed dead (soldier witnessed kill or took an item from the body) | VIP survives the deadline |
| capture_territory | control passes to employer after holding for the handover hours | position lost before handover |
| defend_territory | position held when attackers are beaten or retreat | position falls |

**Values.** "most of its cargo" fraction, handover hours — not set (design: not stated) →
data/missions.json
**Status.** open
**Source.** design/design.md › Management › Contracts and missions › Mission types; › Overview › Core loop

### [MGT-045] Bundling missions into an op
**Rule.** When planning an op (GEN-001) the player selects any missions from any signed contracts; one op
may carry missions from several contracts. A mission may be in at most one op at a time.
**Source.** design/design.md › Management › Contracts and missions

### [MGT-046] Contract pay
**Rule.** Pay per mission lies within its mission type's pay band; the value within the band scales with
distance, danger and how much the employer wants it. Contract pay = sum of mission pays.
**Values.** pay bands: retrieve_deliver $3,000–8,000; escort_shipment $6,000–12,000; escort_vip
$8,000–15,000; assassinate_vip $10,000–20,000; capture_vip $12,000–25,000; capture_territory
$15,000–30,000; defend_territory $8,000–18,000 → data/missions.json; scaling formula — not set (design:
not stated)
**Status.** open
**Source.** design/design.md › Management › Contracts and missions › Pay bands

### [MGT-047] Advance and remainder
**Rule.** On signing, `advance = round(pay × advance_fraction)` is due. The rest, `pay − advance`, is paid
per mission: each mission pays its share when its goal is met (MGT-044). Spec: a mission's share is the
rest split in proportion to mission pay, `share = round((pay − advance) × missionPay / pay)`, with the
rounding difference on the contract's last mission paid (see Open questions). The money comes from the
employer's funds, which Strategic owns: MGT names the payment due in its result (`contractId`,
`employer`, `amountUsd`), Strategic deducts it from the employer's funds and, at the next strategic hour,
sends a `contractPayment` request and a news-feed line; only then is the amount credited to `economy`,
wherever the squad is (STR-093). A payment due that the employer cannot cover fails the contract at once;
the player keeps the advance (MGT-048).
**Values.** `advance_fraction` — 0.25 (draft) → data/management-rules.json
**Source.** design/design.md › Management › Contracts and missions › Contract terms; › Overview › Core loop; › Strategic Layer › Squads and simulation (Faction funds (draft))

### [MGT-048] Contract failure
**Rule.**
- **Failed mission:** loses only its own share (MGT-047) and its reputation (`rep_mission_failed`,
  MGT-056); the contract goes on, and its other missions can still be met and paid.
- **Failed contract** (the deadline passed with missions still open): no further pay; reputation loss
  with the employer (MGT-056); the advance becomes a debt to the employer that the player must pay back,
  or it is written off as a debt entry in `economy` (MGT-070).
- **Employer default:** a payment due that the employer's funds cannot cover fails the contract at once
  (`contractEnded` from Strategic, STR-093). No further pay; the player keeps the advance, and it does
  not become a debt.
**Source.** design/design.md › Management › Contracts and missions › Contract terms; › Strategic Layer › Squads and simulation (Faction funds (draft))

### [MGT-049] Intel level
**Rule.** Each contract has `intel_level` ∈ {`exact` (exact location), `last_known` (last known position),
`rumour` (rumours only)}, which decides what target location data the contract reveals to the player.
**Source.** design/design.md › Management › Contracts and missions › Contract terms

### [MGT-050] Deniability
**Rule.** A contract with `deniable = true` may be disowned by its employer if it goes wrong. When
disowned, reputation losses that would be attributed to the employer fall on the player alone, and the
employer may withhold pay. Mostly VDK contracts are deniable.
**Values.** chance to be deniable per employer, chance to disown — not set (design: not stated) →
data/factions.json
**Status.** open
**Source.** design/design.md › Management › Contracts and missions › Contract terms; design.md › Factions

### [MGT-051] Contract board and filtering
**Rule.** Contract offers are shown on boards at FOBs, in cities, and (Krug work only) at Krug markets.
An employer at standing Hostile shows no offers. At Unfriendly it shows fewer offers: only a share
`unfriendly_contract_share` of its basic offers (selection seeded). Neutral or better shows all basic
offers; contracts marked sensitive require Trusted; better contracts require Friendly (MGT-055). Krug
work at Krug markets includes escort work for the Krug's own convoys (STR-094). An offer taken by a rival
PMC leaves the board unless both race for it (MGT-052).
**Values.** `unfriendly_contract_share` — not set (design: Open) → data/management-rules.json
**Source.** design/design.md › Management › Contracts and missions › Where contracts come from; › Reputation

### [MGT-052] Rival PMC competition
**Rule.** Varyag and Aegis can take contract offers from their own side (SAI-015) and compete with the
player. When a rival takes an offer that is on the player's board, either the offer leaves the player's
board, or it stays and both race for it (which applies: not set). A rival pursuing the same mission as the
player: if the rival completes it first, the player's mission fails. While competing, an Unfriendly
faction treats the player as hostile (MGT-055). The Krug never takes other factions' contracts; paying a
Krug squad to escort a shipment is a service, debited from `economy` (STR-094).
**Values.** leave-or-race rule — not set (design: Open) → data/management-rules.json
**Status.** open
**Source.** design/design.md › Management › Contracts and missions › Where contracts come from; › Reputation › Standing

## Reputation

### [MGT-053] Reputation value
**Rule.** Each non-player faction (GEN-004) holds one integer reputation toward the player, range −100…100,
starting at 0. Every change is clamped to the range. Reputation never drifts; it changes with two things
only: how the player handles contracts (MGT-056) and what the player does to the faction (MGT-057…MGT-059),
applied by MGT-060. An act changes reputation only with the faction it directly affects; there is no
spill-over to that faction's allies or enemies (MGT-061…MGT-063 removed). Reputation is also read as an
input by world events, desperate measures and faction goals (STR).
**Values.** `rep_min` — −100; `rep_max` — 100; `rep_start` — 0 → data/management-rules.json
**Source.** design/design.md › Management › Reputation (draft)

### [MGT-054] Standing levels
**Rule.** Standing is derived from reputation `r`: `hostile` if r ≤ −50; `unfriendly` if −49 ≤ r ≤ −20;
`neutral` if −19 ≤ r ≤ 19; `friendly` if 20 ≤ r ≤ 49; `trusted` if r ≥ 50. Never stored.
**Values.** thresholds −50, −20, 20, 50 → data/management-rules.json
**Source.** design/design.md › Management › Reputation › Standing

### [MGT-055] Standing effects
**Rule.**
- `hostile`: no contracts, no trade; the faction attacks player squads on sight (SAI) and may put a
  bounty on the PMC (STR).
- `unfriendly`: fewer contracts (MGT-051) and higher prices (MGT-039); hostile to the player when
  competing for the same objective.
- `neutral`: basic trade and basic contracts.
- `friendly`: adds military gear and better contracts.
- `trusted`: adds armoured vehicles, helicopters, best stock and sensitive contracts.
Used by MGT-039 (traders) and MGT-051 (contract board). Which contracts count as "better" and
"sensitive" is a contract flag set by the offering faction.
**Source.** design/design.md › Management › Reputation › Standing

### [MGT-056] Contract reputation acts
**Rule.** Changes with the employer: mission completed → +`rep_mission_success` chosen by the mission's
pay band (higher band, higher gain); mission failed → `rep_mission_failed`; contract broken (cargo kept or
sold, VIP handed to someone else, employer betrayed) → `rep_contract_broken`. On success, the target faction
loses reputation per the hostile act committed (MGT-058) only if it learns who did it (MGT-064).
**Values.** `rep_mission_success` — +5 to +15 (by pay band; mapping not set); `rep_mission_failed` — −5;
`rep_contract_broken` — −30 → data/management-rules.json
**Source.** design/design.md › Management › Reputation › What changes reputation; › Contract terms

### [MGT-057] Friendly acts
**Rule.** Changes with the faction helped: join a fight on its side without a contract +5; rescue its
soldiers or VIP, or return its MIA/captured soldiers +10; sell it supplies it needs (fuel, ammunition,
medical) +1 to +3 per sale; Krug: keep a deal +5.
**Values.** `rep_join_fight` — +5; `rep_rescue` — +10; `rep_sell_supplies` — +1…+3 (selection rule not
set); `rep_krug_keep_deal` — +5 → data/management-rules.json
**Source.** design/design.md › Management › Reputation › What changes reputation

### [MGT-058] Hostile acts
**Rule.** Changes with the faction harmed: attack one of its squads that was not hostile to the player
−30; kill its soldiers −2 each, total per fight capped at −20; destroy or steal its cargo −10; capture one
of its VIPs −20; assassinate one of its VIPs −30; take one of its regions −15; Krug: break a deal or fight
in a Krug market −50 (see also GEN-009).
**Values.** `rep_attack_nonhostile` — −30; `rep_kill_soldier` — −2; `rep_kill_cap_per_fight` — −20;
`rep_cargo` — −10; `rep_capture_vip` — −20; `rep_assassinate_vip` — −30; `rep_take_region` — −15;
`rep_krug_break` — −50 → data/management-rules.json
**Source.** design/design.md › Management › Reputation › What changes reputation

### [MGT-059] War crimes
**Rule.** Killing civilians or prisoners changes reputation by `rep_war_crime` with every faction, and
civilian loyalty in that region collapses (applied by STR). Attribution (MGT-064) applies.
**Values.** `rep_war_crime` — −20 → data/management-rules.json
**Source.** design/design.md › Management › Reputation › What changes reputation

### [MGT-060] Act application order
**Rule.** For each attributed act (MGT-064): apply its change (MGT-056…MGT-059) to the faction it directly
affects, then clamp. No other faction's reputation changes from that act (no spill-over). The only act
that directly affects several factions is a war crime (MGT-059, every faction). Acts apply in the order
they are reported.
**Source.** design/design.md › Management › Reputation (draft) (structure implied; ordering is a spec decision)

### [MGT-061] Spill-over to hostile and allied factions (removed)
**Rule.** Removed in design 8972470: the "Helping opposing factions" block is gone; an act changes
reputation only with the faction it directly affects (MGT-053).
**Source.** design/design.md › Management › Reputation (draft) (block removed)

### [MGT-062] Krug exemption (removed)
**Rule.** Removed in design 8972470: with no spill-over (MGT-061 removed) there is nothing to exempt the
Krug from; Krug reputation changes only from acts that affect the Krug, like every faction (MGT-053).
**Source.** design/design.md › Management › Reputation (draft) (block removed)

### [MGT-063] Rival PMCs follow their patrons (removed)
**Rule.** Removed in design 8972470: Varyag and Aegis no longer follow their patrons' reputation changes;
they change only from acts that affect them directly (MGT-053).
**Source.** design/design.md › Management › Reputation (draft) (block removed)

### [MGT-064] Attribution
**Rule.** An act changes reputation with the affected faction only if at least one member of that faction
witnessed it and survived (reported by TAC/STR). Unwitnessed acts stay unattributed unless an Operation
dispute event (STR) assigns the blame, in which case the act is applied to the faction it names.
**Source.** design/design.md › Management › Reputation › Attribution

## Base & meta progression

### [MGT-065] Acquisition paths
**Rule.** The PMC gains items, vehicles and services only by looting (MGT-035), purchasing (MGT-039,
MGT-040, MGT-067) or industry output (MGT-068). FOBs have no upgrades; nothing is crafted; there is no
research.
**Source.** design/design.md › Management › Base & meta progression

### [MGT-066] FOBs
**Rule.** Every op starts and ends at an FOB (GEN-001). Each FOB offers a stash, rest with slow healing
(TAC recovery), hiring (MGT-002) and a contract board (MGT-051). The player owns one FOB at campaign start;
more are bought in small and large cities or taken over (STR). Operational range per FOB is STR.
**Values.** FOB purchase price per city size — not set (design: not stated) → data/management-rules.json
**Status.** open
**Source.** design/design.md › Management › Base & meta progression

### [MGT-067] Paid field services
**Rule.** Services bought with money in the field: hospital treatment in cities, repairs at mechanical
plants, fuel at gas stations and oil plants. Each debits `economy` and applies its effect (healing TAC,
repair ITM condition, fuel STR).
**Values.** service prices — not set (design: not stated) → data/management-rules.json
**Status.** open
**Source.** design/design.md › Management › Base & meta progression

### [MGT-068] Industry deliveries
**Rule.** Every day (00:00 check, STR clock) each plant the PMC holds (a squad stationed there; control
is STR) delivers output to the nearest player FOB stash: oil plant → fuel; mechanical plant → spare parts
and vehicle repairs; chemical plant → medical supplies; arms plant → weapons and ammunition; mineral plant
→ medium income to `economy` plus a boost to the output of every other plant the PMC holds; hidden-city
complex (optional) → prototype items. An unguarded plant falls back to the region's controller (STR) and
stops delivering.
**Values.** output amounts per plant type, mineral boost size (design: TBD) → data/poi.json (`dailyOutput`, `mineralModifier`; shared with STR-011, STR-015)
**Status.** open
**Source.** design/design.md › Management › Base & meta progression

### [MGT-069] FOB raids
**Rule.** Late game, enemy factions can raid an FOB (STR decides), which becomes a defence mission
(TAC). Consequences of losing an FOB (stash, soldiers resting there) are not designed.
**Status.** open
**Source.** design/design.md › Management › Base & meta progression

### [MGT-070] Economy ledger
**Rule.** `economy` holds the PMC's money balance and a list of debts. Each debt: creditor faction,
amount, origin (e.g. unreturned advance, MGT-048; Krug deal). Paying a debt's full amount removes it
(Krug: entry in Karsin's book, GEN-008). Every credit and debit is logged with game time. Whether the
balance may go negative is not stated. The PMC's running costs and income use the same shared formulas as
the AI factions' funds (`data/economy-rules.json`, STR-092); contract pay is credited only on a
`contractPayment` request from Strategic (MGT-047, STR-093). AI factions' money is not in `economy`.
**Values.** shared economy formulas — not set (design: Open) → data/economy-rules.json
**Source.** design/design.md › Management › Contracts and missions › Contract terms; › Factions & campaign › Leaders; › Strategic Layer › Squads and simulation (Faction funds (draft))

### [MGT-071] Campaign score
**Rule.** At campaign end (GEN-012) a score is computed from money, reputation and surviving soldiers.
**Values.** weights / formula — not set (design: not stated) → data/management-rules.json
**Status.** open
**Source.** design/design.md › Management › Base & meta progression

## Open questions

1. MGT-002, MGT-003, MGT-005, MGT-022: price tiers, hire price formula, attribute ranges per tier,
   salaries, pay interval and renewal terms are all unset.
2. MGT-008: morale is "squad-wide", but squads are formed per op. Is morale stored per squad, per PMC, or
   reset when a squad is re-formed?
3. MGT-009, MGT-031: perk list and thresholds, nerve scale and growth; design open whether Leadership is a
   perk at a Nerve threshold.
4. MGT-013: the tie rule says "two attributes within 5 points"; spec generalizes to all attributes within 5
   of the top one. Confirm.
5. MGT-015: the suffix rule is defined for generation lists; behaviour when an earned (deed) list is used up
   is not stated — spec applies the same suffix.
6. MGT-018: can a deed be earned more than once (e.g. repeated 50-tile kills)? Does "came home from 5 ops"
   at 50 ops (MGT-017) re-trigger?
7. MGT-023, MGT-024, MGT-025: xp per use, growth curve between 50 and 80, physical change events and drift
   values unset.
8. **Resolved (design eb072a2):** the Tactical Layer owns the zone HP formula and its rounding (TAC-057);
   MGT-026…MGT-030 only name the attributes. MGT-028: rounding of zone HP not stated.
9. MGT-029, MGT-033: carry capacity formula (design: Open) and weight penalty to AP/stamina unset.
10. MGT-034: is modding restricted to FOBs and does it require Technical?
11. MGT-036, MGT-038: insurance terms; scav loadout contents; definition of "low-risk contract".
12. MGT-040: Krug price fluctuation rule.
13. MGT-044, MGT-046: "most of its cargo" fraction, capture-territory handover hours, pay scaling formula
    within bands.
14. **Resolved (design eb072a2):** the rest is paid per mission, each mission paying its share when its
    goal is met; a failed mission loses only its share and its reputation, and the contract goes on
    (MGT-047, MGT-048). Whether the advance is repaid in money or booked as debt stays as before (both
    allowed). MGT-047, MGT-048: is the remainder paid per mission or only when every mission of the contract
    succeeds? Does one failed mission fail the whole contract? Is the advance repaid in money or always
    booked as debt?
15. MGT-050: deniability chance per employer; whether disowned contracts are paid.
16. MGT-052: does a rival completing the mission first count as failure (with −5 reputation)?
17. **Resolved (design 8972470):** Hostile now explicitly means no contracts or trade; Unfriendly means
    fewer contracts and higher prices (MGT-039, MGT-051, MGT-055). MGT-055: the design gives Unfriendly "no contracts or trade" but does not say Hostile also blocks them;
    spec assumes it does.
18. MGT-056: mapping from pay band to +5…+15; MGT-057: rule for +1…+3 supply sales.
19. **Resolved (design 8972470):** spill-over and patron follow are removed (MGT-061…MGT-063), so neither
    rounding nor stacking applies. MGT-061: rounding of spill-over (example implies toward zero, −5 and +2.5→+2). Does spill-over to a rival
    PMC (MGT-063) stack with spill-over from relations to the same PMC?
20. **Resolved (design 8972470):** with no spill-over an act changes only the faction it directly affects,
    so there is no cascade; acts apply in reported order (MGT-060). MGT-060: ordering and no-cascade rule is a spec decision; confirm.
21. MGT-064: who counts as a witness (sight, radio, any survivor of the fight)?
22. MGT-066: is the stash per FOB or shared across FOBs? Transfer of items between FOBs?
23. MGT-067, MGT-068, MGT-069: service prices, industry output amounts, mineral boost size (TBD), FOB loss
    consequences.
24. MGT-070: can the balance go negative; interest or penalties on debts.
25. MGT-071: score formula.
26. MGT-011: who decides between MIA, captured and dead for soldiers left behind (STR or TAC), and can MIA
    soldiers return later (implied by the "Revenant" deed)?
27. MGT-039, MGT-051: "fewer contracts and higher prices" at Unfriendly has no numbers; spec models them as
    `unfriendly_contract_share` and `unfriendly_price_markup`. Confirm the model (share of offers vs. only
    some contract types) and whether Unfriendly traders sell only basic stock.
28. **Resolved (design eb072a2):** the contract fails at once and the player keeps the advance (MGT-048,
    STR-093). MGT-047, STR-093: what happens when the employer's funds cannot cover a payment due (late payment,
    debt owed to the player, contract fails)? VDK "late payments" suggests delay.
29. MGT-048: is a repaid advance credited back to the employer's funds (STR-093)?
30. MGT-005, MGT-070: which of the player's costs and incomes use the shared `data/economy-rules.json`
    formulas (salaries only, or FOB upkeep and plant income too)?
31. **Resolved (design eb072a2):** no mission needs the squad back at an FOB; the layer where the goal is
    met detects it, Strategic confirms it, and the pay is credited at the next strategic hour (MGT-044,
    MGT-047). MGT-044: "completed as soon as the goal is met" — for missions whose goal is a delivery or hand-over
    (retrieve_deliver, capture_vip), the goal is met only at the destination; for assassinate_vip it is the
    confirmed kill. Confirm that no mission needs the squad to return to an FOB.
32. MGT-047: how is the rest split into mission shares — in proportion to each mission's pay (spec
    assumption), or equally? Where does the rounding difference go?
33. MGT-048: when does a contract fail now that a failed mission no longer fails it — only when the
    deadline passes with missions open, or also when every mission has failed? On an employer default, does
    the player lose reputation with anyone?
34. MGT-052: when a rival PMC takes an offer on the player's board, which offers leave the board and which
    become a race? How does Management learn of it?
35. MGT-052, STR-094: price of a Krug escort and where the player hires it.

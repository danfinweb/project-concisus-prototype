# Management — scope

Refreshed by `/scope` (2026-11-24, spec baseline `a0210cd`, design `c1333f3`). Lists everything this module
may read outside its folder.

## Spec IDs

Source: `spec/management.md` (area MGT, 76 IDs, all mapped to `modules/management` in `spec/_index.md`).
`(open)` = the design leaves a value or rule unset; build with a stub and flag it. `(optional)` = left out
of the first build iterations. `(removed)` = rule dropped, ID kept; do not implement. `(draft)` = drafted
design values, build them as given.

**Soldiers & progression**

| ID | Summary |
| --- | --- |
| MGT-001 | Soldier record: id, serviceNumber, callsign (+source, prestige), 8 attributes, nerve, morale, wounds `{ zoneHp, conditions }`, equipment, perks, skillXp, skillIdleDays, rank, feeDiscount, deeds, status, hiredSkills, serviceRecord, kitMarks; derived values never stored; `leftMap` → `active`, final fate only from `soldierFate` |
| MGT-002 | (open: pools) Four pools; four tiers recruit / regular / veteran / elite with hire price, fee per op, attribute range; at FOBs; always one affordable candidate; no game time |
| MGT-003 | (open: scaling) Hire price from tier price, scaled by average attribute; Krug × (1 + resentment markup); refugee recruit normal price with `feeDiscount` |
| MGT-004 | Player may set a callsign (source `player`, never replaced) and cosmetic kit marks; no renaming |
| MGT-005 | (draft) Fee per op by rank × (1 − feeDiscount), paid as one `launchOp` payment (`squad`, `soldiers`, `fobId`, `insuredItems`) with the insurance premium; can't pay → no launch; no salaries, renewals or non-payment; a pilot is a normal roster soldier |
| MGT-074 | (draft) Rank = hiring tier; rises when the average attribute passes the rank's range top (45 / 60 / 75), repeating; never drops; logged as `promotion`; new fee from next launch |
| MGT-075 | (draft) Highest rank leads (ties: higher average, then squad order); Leadership bonus by rank (+0/+2/+4/+6) to morale and reaction chance, battle only, never stored; applied by TAC-094 |
| MGT-006 | Service record entries with game time: deployment, kill, rescue, wound, nearMiss, lootCarriedOut, comradeLost, promotion, deeds; never removed |
| MGT-007 | Dossier and after-action report: read-only views of `roster` |
| MGT-008 | (optional: flight rule only) Morale per soldier, `moraleStart` 80; squad morale = rounded average when the op forms; set from `battle_result` `soldiers[].morale`, clamped 0–100 |
| MGT-009 | (draft) Eight perks, one per skill at 50 and 80; stay once unlocked; effects applied by their rule owners (TAC, MGT-067) |
| MGT-010 | Wounds from a battle persist until healed; healing rules are TAC |
| MGT-011 | Death permanent; mia / captured / dead only from `soldierFate`; `fate: returned` reactivates at `fobId`; gear lost unless recovered or insured |
| MGT-012 | Memorial wall: read-only record of the dead |

**Callsigns**

| ID | Summary |
| --- | --- |
| MGT-013 | Generation callsign: every attribute within `tieMargin` (5) of the top is a candidate (seeded pick); band 40–59 / 60–79 / 80–100 |
| MGT-014 | No attribute ≥ `minValue` (40): draw from the Generic list |
| MGT-015 | Unavailable while a living soldier uses it; generation list exhausted → `-N` suffix; deed list exhausted → keep current callsign |
| MGT-016 | Generation callsign assigned once, never re-rolled |

**Deeds and earned callsigns**

| ID | Summary |
| --- | --- |
| MGT-017 | (optional) Deed definitions: id, prestige 1–5, trigger, callsign list; 13 initial deeds |
| MGT-018 | (optional) Each deed logged once per soldier; milestones never re-trigger |
| MGT-019 | (optional) Earned callsign replaces generated or lower-prestige ones; player callsigns never change |
| MGT-020 | (optional) Fallen keep their last callsign on the memorial; it becomes available again |

**Soldier attributes**

| ID | Summary |
| --- | --- |
| MGT-021 | Eight integer attributes 1–100 (4 physical, 4 skills) |
| MGT-022 | (open) Attributes rolled (seeded) within the tier's range; distribution default uniform |
| MGT-023 | (draft) Skill xp: 1 per use; 5 / 10 / 20 xp per point below 50 / 50–80 / above 80; uses from battle and op results |
| MGT-024 | (open: events) Physical attributes change ±1…±5 only through rare service-record events |
| MGT-025 | (optional) Unused skill −1 per 14 idle days, floor = hired value |
| MGT-026 | Action points from Agility; formula owned by TAC-006 |
| MGT-027 | Stamina from Endurance; formula owned by TAC-009 |
| MGT-028 | Zone HP from Endurance; formula owned by TAC-057 |
| MGT-029 | Carry capacity = 15 + 0.3 × Strength + 0.1 × Endurance (kg) |
| MGT-030 | Other derived values: main/minor attribute table only; formulas owned by TAC (or STR) |
| MGT-031 | (draft; effect optional) Nerve 0–100, +2 per deployment survived, +1 per fight under fire; effect 1 − nerve ÷ 200 in TAC, deferred |

**Gear, loot & return**

| ID | Summary |
| --- | --- |
| MGT-032 | Inventory is item lists; each container rejects items beyond its weight limit |
| MGT-033 | Carried-weight penalty owned by TAC-027; Management supplies only carry capacity |
| MGT-034 | Weapon modding anywhere outside battle, no skill, no time, no xp |
| MGT-035 | Items carried by soldiers who reach an FOB go to its stash, logged as loot carried out |
| MGT-036 | (draft) Insurance: 10% of value per op with the launch payment; 50% seeded recovery after 3 days to the op's start FOB |
| MGT-037 | Named loadout presets applied from the FOB stash; missing items reported and left empty |
| MGT-038 | (open: used condition, front distance) Scav loadout (used AK-74M, 2 mags, tourniquet, $500); low-risk contract kept posted by Strategic (STR-098) |
| MGT-039 | Faction traders gated by standing; Unfriendly +25%; stock per location; no game time |
| MGT-040 | (draft) Krug prices ±10%/day, at most ±30% from `valueUsd`; public; Krug resentment markup on what the player pays |

**Contracts and missions**

| ID | Summary |
| --- | --- |
| MGT-041 | Management never invents contracts; offers arrive as `contractOffer` management requests, stored as `offered` |
| MGT-042 | Contract = the offer fields plus `pay`, `advance`, `status`, `endReason`, `disowned`; published in `management_view` |
| MGT-043 | Faction goal → allowed mission types (`intelNeeds` without a squad goal) → data/missions.json |
| MGT-044 | (draft) Mission success the moment its goal is met; confirmed by Strategic as `missionOutcome` (`missionKey`); no return needed |
| MGT-045 | An op may bundle missions from several signed contracts; a mission is in at most one op |
| MGT-046 | (draft) `missionPay = round(low + (high − low) × (distance + danger + urgency) / 3)`; contract pay = sum |
| MGT-047 | Advance = round(pay × 0.25) on signing; rest per mission by pay share, rounding to the last mission; credited only on `contractPayment` |
| MGT-048 | Failed mission loses its share and −5; failed contract (deadline or `allFailed`) keeps the advance, no debt; employer default no reputation loss |
| MGT-049 | Intel level exact / lastKnown / rumour decides the target location data shown |
| MGT-050 | (open: deniable chance) One disown roll per contract when it first goes wrong; disowned = still paid, no gains, losses still apply |
| MGT-051 | Boards at FOBs, cities, Krug markets; filtered by standing (Unfriendly share 0.5, seeded per offer) |
| MGT-052 | Rival taking an offer → `contractEnded` `taken`, offer removed; signed contracts race; `rivalFirst` = fail without pay or reputation loss |

**Reputation**

| ID | Summary |
| --- | --- |
| MGT-053 | One integer reputation per non-player faction, −100…100, start 0, clamped, never drifts, no spill-over |
| MGT-054 | Standing derived: hostile ≤ −50, unfriendly ≤ −20, neutral, friendly ≥ 20, trusted ≥ 50; published in the view |
| MGT-055 | Standing effects on contracts, trade, hostility; `reputationGate { better, sensitive }` |
| MGT-056 | Mission success +5 / +10 / +15 by mission pay band; failure −5 (not for `rivalFirst`); broken −30; target faction only if attributed |
| MGT-057 | Friendly acts: join fight +5, rescue +10, supplies +1 per $1,000 (1…3 per sale), Krug deal kept +5 |
| MGT-058 | Hostile acts: attack −30, kill −2 (cap −20 per fight), cargo −10, capture VIP −20, assassinate −30, region −15, Krug break −50 |
| MGT-059 | War crimes −20 with every faction; civilian loyalty collapse applied by STR |
| MGT-060 | Each attributed act applies to the faction it directly affects, clamp, reported order; `reputationAct` names the `repActs` key |
| MGT-061 | (removed) Spill-over |
| MGT-062 | (removed) Krug exemption |
| MGT-063 | (removed) Rival PMCs follow their patrons |
| MGT-064 | Act counts only if a surviving member of the faction took part in the fight, or an Operation dispute assigns blame |

**Base & meta progression**

| ID | Summary |
| --- | --- |
| MGT-065 | Items, vehicles, services only from looting, purchasing or industry; no upgrades, crafting or research |
| MGT-066 | (draft) FOBs: own stash each, transfer only by squad transport; one at start; `buyFob` $25,000 / $50,000; no upkeep |
| MGT-067 | (draft) Hospital $300 per wound, repair $20 per condition point, fuel $50 per unit; field weapon repair +2 per hour per 10 Technical; perk factors |
| MGT-068 | (open: item choice) Daily `plantOutput` to the receiving FOB stash or `economy`; amounts in data/poi.json (STR computes) |
| MGT-069 | (optional) FOB raids become defence missions |
| MGT-070 | Ledger: balance never below zero (debit fails whole, `ok: false`), debts (creditor, amount, origin) without interest, every booking logged |
| MGT-071 | (draft) Score = balance ÷ 1,000 + Σ positive reputations + 50 × active soldiers; debts not subtracted |
| MGT-073 | Shared economy rules: fees booked per op; only recurring item is plant income every `payIntervalHours` (24); no FOB or vehicle upkeep |

**Interfaces**

| ID | Summary |
| --- | --- |
| MGT-072 | `management_view` after each request batch and on load: reputation (value, standing), contracts (offered, signed, ended since last view), funds (`balanceUsd`, `debtsUsd` always), roster (every soldier not dead: id, status, rank, morale, attributes, nerve, wounds, equipment, perks); nothing else |
| MGT-076 | Request handling for types ruled elsewhere: `healingTick`, `contaminationTick` (`hpLost`), `moraleChange`, `capitalIncome`, `priceModifier` (`modifierId`, `target`, `factor`, `regions`), `payCompensation`, `payOffBounty`, `payKrugPass`, `payKrugEscort`, `buyIntel`, `handOver`; every debit per MGT-070; amounts from Strategic |

**Also reads** (rules this module depends on but does not own)

| ID | File | Why management reads it |
| --- | --- | --- |
| GEN-001, GEN-002, GEN-003 | `spec/overview.md` | Op as unit of play, op success, mission bundling |
| GEN-004, GEN-007 | `spec/overview.md` | Faction roster (reputation holders), relations model |
| GEN-006, GEN-010 | `spec/overview.md` | Civilian loyalty and Krug standing as recruit sources and unlocks |
| GEN-008, GEN-009 | `spec/overview.md` | Karsin's debt book (Krug debts), Krug markets as no-fire zones (Krug break) |
| GEN-012, GEN-018, GEN-019 | `spec/overview.md` | Campaign end states (score trigger, MGT-071) |
| STR-003, STR-004 | `spec/strategic.md` | Hour tick (contract payments) and 00:00 daily checks (`dailyRollover`, deliveries) |
| STR-007 | `spec/strategic.md` | Capital control (`capitalIncome` request) |
| STR-015, STR-011 | `spec/strategic.md` | Plant output and mineral modifier (`plantOutput`) |
| STR-025 | `spec/strategic.md` | Pay your way through (Krug) (`payKrugPass`) |
| STR-027, STR-028, STR-029 | `spec/strategic.md` | Op lifecycle, launch (`launchOp`), return to an FOB (`opReturn`) |
| STR-024, STR-034, STR-037 | `spec/strategic.md` | Evasion, pilot check, stand by (read the published roster; `healingTick`) |
| STR-047 | `spec/strategic.md` | VIP death morale shock (`moraleChange`) |
| STR-039..STR-044 | `spec/strategic.md` | Zero-time trade, contract actions, paid services, FOB purchase, payments to factions, contract postings |
| STR-048, STR-064 | `spec/strategic.md` | VIP intel (`buyIntel`), bounty on the PMC (`payOffBounty`) |
| STR-054, STR-058 | `spec/strategic.md` | News feed lines; Operation dispute assigns blame (MGT-064) |
| STR-062, STR-063, STR-065 | `spec/strategic.md` | Fuel shortage and chemical leak (`priceModifier`), refugee recruits (`localRecruits`, fee discount) |
| STR-092, STR-093, STR-094 | `spec/strategic.md` | Shared economy formulas, contract payment between modules, Krug escorts |
| STR-097, STR-098 | `spec/strategic.md` | HP loss on contaminated tiles (`contaminationTick`), low-risk contract guarantee |
| SAI-013, SAI-015 | `spec/strategic-ai.md` | Hostility from standing; rival PMCs taking offers (MGT-052) |
| TAC-006, TAC-009, TAC-057 | `spec/tactical.md` | AP, stamina, zone HP formulas (dossier display only) |
| TAC-011 | `spec/tactical.md` | Stamina and recovery (FOB healing, `healingTick`) |
| TAC-022, TAC-027 | `spec/tactical.md` | Reaction chance (Leadership, perks), over-encumbrance vs carry capacity |
| TAC-076, TAC-077, TAC-083 | `spec/tactical.md` | Objective met, morale flight and nerve (optional), weapon wear (Armourer perk) |
| TAC-094, TAC-095, TAC-096 | `spec/tactical.md` | Leadership bonus, morale in battle, perk effects in battle |
| DAT-004, DAT-005, DAT-007, DAT-008 | `spec/data.md` | Instance state owned by `roster` / `economy`, slots, carried weight, container limits |
| DAT-014, DAT-024, DAT-025, DAT-027, DAT-028, DAT-029 | `spec/data.md` | Weapon condition and repair, vehicle profile (fuel), vehicle storage and availability, helicopter pilot, vehicle instance state |
| ITM-021..ITM-030 | `spec/data.md` | Barter goods, buy rates, daily deals, loot rarity, operation items and hand-in |
| ITM-034 | `spec/data.md` | Trader prices (`valueUsd`: insurance, Krug base price) |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/management_view.schema.json` | produces (to strategic) | 0.3.0 |
| `spec/interfaces/battle_result.schema.json` | consumes (from tactical) | 0.4.0 |
| `spec/interfaces/management_requests.schema.json` | consumes (from strategic); returns `results` (`ok`, `paymentDue`, `feesUsd`, `premiumUsd`) | 0.8.0 |
| `spec/interfaces/tactical_map_request.schema.json` | reads only (the `units[]` shape Strategic fills from `management_view` `roster`: rank, morale, attributes, equipment, perks) | 0.9.0 |

`strategic_commands` is no longer consumed: contract offers reach Management only as `management_requests`
`contractOffer` (local copy of `strategic_commands` 0.7.0 `$defs/contractOffer`; rechecked after `a0210cd`, structurally
identical).

## Data tables

Read through `shared/registry.js` only. All tables in `data/` are still empty (`{}`): tests use
`test/fixtures/`.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/management-rules.json` | `spec/interfaces/data/management-rules.schema.json` | 0.9.0 | Morale, Leadership, perks, nerve, skill growth and drift, carry capacity, insurance, scav loadout, low-risk contract, reputation acts and standing, advance, services, weapon repair, FOB prices, score weights |
| `data/economy-rules.json` | `spec/interfaces/data/economy-rules.schema.json` | 0.5.0 | Shared booking rules, `payIntervalHours` (MGT-070, MGT-073) |
| `data/recruitment.json` | `spec/interfaces/data/recruitment.schema.json` | 0.6.0 | Tiers (hire price, fee per op, attribute range = rank thresholds), pools, price formula, distribution |
| `data/callsigns.json` | `spec/interfaces/data/callsigns.schema.json` | 0.3.0 | Generation and generic callsigns, deeds (MGT-013..MGT-020) |
| `data/traders.json` | `spec/interfaces/data/traders.schema.json` | 0.4.0 | Stock by standing, buy rates, Krug fluctuation (MGT-039, MGT-040) |
| `data/items.json` | `spec/interfaces/data/items.schema.json` | 0.9.0 | Weights, containers, `valueUsd`, op items, scav loadout items |
| `data/presets.json` | `spec/interfaces/data/presets.schema.json` | 0.4.0 | Loadout presets (MGT-037) |
| `data/missions.json` | `spec/interfaces/data/missions.schema.json` | 0.3.0 | Mission types, pay bands, goals, success parameters (MGT-043..MGT-046) |
| `data/factions.json` | `spec/interfaces/data/factions.schema.json` | 0.6.0 | Reputation holders, `disownChance`, Krug `resentment.priceMarkup` (MGT-003, MGT-040, MGT-050, MGT-053) |
| `data/events.json` | `spec/interfaces/data/events.schema.json` | 0.7.0 | `params.recruitFeeDiscount` (refugee recruits, MGT-003) |
| `data/poi.json` | `spec/interfaces/data/poi.schema.json` | 0.7.0 | Plant `dailyOutput`, mineral modifier (MGT-068; computed by STR) |
| `data/vehicles.json` | `spec/interfaces/data/vehicles.schema.json` | 0.4.0 | Vehicle storage, availability, prices, condition (DAT-025, DAT-027, DAT-029) |

## State slices

- Owns: `roster`, `unlocks`, `economy`, `contracts`, `reputation`
- Reads: none directly. Battle outcomes arrive in `battle_result`; everything strategic (offers, services,
  launches, op returns, fates, payments, acts, plant output, ticks) in `management_requests`. `world` and
  `battle` are never read. Other modules read Management only through `management_view`.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Report to the root session, do not edit `spec/`. All six findings of the previous scope are fixed by
cleanup `a0210cd`: roster in `management_view` 0.3.0, MGT-076 request handling, the new soldier record
fields, `launchOp` `fobId`, corrected descriptions, `debtsUsd` required. The still-open items in
`spec/management.md` › Open questions still apply (1, 7, 11, 15, 23, and the new 51 and 52), and so do the
`(open)` tags above. Two of them block tests:

1. **Q51 — contamination HP split (MGT-076, STR-097).** `contaminationTick` gives `hpLost` per soldier,
   but wounds are stored per body zone. Leave `contaminationTick` out of tests until the zone split is
   decided.
2. **Q52 — recovery rate (MGT-010, MGT-076).** `healingTick` applies "TAC recovery", but no rate exists
   in spec or design. Leave healing out of tests until a rate is set.

Found while writing the tests (`/test`, 2026-11-24):

3. **Request payloads not defined.** MGT-076 covers only the types whose rule lives elsewhere. `hire`,
   `trade`, `barter`, `vehicleTrade`, `handIn`, `hospital`, `repair`, `refuel`, `buyFob`, `opReturn` and
   `localRecruits` have no payload fields (which candidate, which items, how many wounds or units, which city
   size, which soldiers and loot). The tests call core functions directly for these.
4. **`reputationAct` and battle acts underspecified.** `faction` is described only for payments (is it also
   the affected faction of an act?); there is no count for `killSoldier`; `battle_result` `acts[].type` has no
   enum (tests use the `repActs` keys), and `skillUse[]` items have no shape (MGT-023 uses).
5. **Failed-contract loss (MGT-048).** A contract that fails at its deadline costs "a reputation loss with
   the employer", but no amount is named (`missionFailed` per open mission? `contractBroken`?). The test only
   checks that reputation falls.
6. **Perks at hiring (MGT-009).** Does a soldier hired with a skill already at 50 or 80 have that perk?
7. **Bundling (MGT-045).** `launchOp` names no missions, so Management cannot enforce "a mission is in at
   most one op". Who owns that check?
8. **"Always one affordable candidate" (MGT-002).** Affordable against the current balance? The test assumes a
   balance of at least the recruit tier price.
9. **War crime attribution (MGT-059, MGT-064).** Every faction loses 20, but does each faction need its own
   surviving witness, or does one witness attribute it to all?
10. **Untyped data shapes.** `traders.traders[].stockByStanding` (fixture: `basic` / `military` / `best`) and
    the item instance ID field (fixture: `id`, used by `launchOp` `insuredItems`).

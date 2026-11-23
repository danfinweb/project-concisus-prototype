# Management — scope

Refreshed by `/scope` (2026-11-23, spec baseline `eb072a2`). Lists everything this module may read outside
its folder.

## Spec IDs

Source: `spec/management.md` (area MGT, 71 IDs, all mapped to `modules/management` in `spec/_index.md`).
`(open)` = the design leaves a value or rule unset; build with a stub and flag it. `(optional)` = left out
of the first build iterations. `(removed)` = rule dropped, ID kept; do not implement.

**Soldiers & progression**

| ID | Summary |
| --- | --- |
| MGT-001 | Soldier record: id, service number, callsign (+source, prestige), 8 attributes, nerve, wounds, salary, status, service record, kit marks; derived values never stored |
| MGT-002 | (open) Hiring pools agency / local / defector / freed_prisoner, price tiers, at FOBs; always one affordable candidate; no game time |
| MGT-003 | (open) Hire price follows attributes within the tier's price range; formula not set |
| MGT-004 | Player may set a callsign (source `player`, never replaced afterwards) and cosmetic kit marks; no renaming |
| MGT-005 | (open) Salary per soldier at a fixed interval, renewable term; formula shared with AI salaries (STR-092) |
| MGT-006 | Service record appended automatically with game time: deployment, kill, rescue, wound, near miss, loot carried out, comrade lost, deeds |
| MGT-007 | Dossier and after-action report: read-only views of `roster` |
| MGT-008 | (optional: flight rule only) Squad-wide morale, `morale_start` 80, kept between fights, stored from the battle result |
| MGT-009 | (open) Perks unlock at attribute thresholds; list and thresholds not set |
| MGT-010 | Wounds from a battle persist until healed; healing rules are TAC |
| MGT-011 | Death is permanent; soldiers not back at an FOB become mia / captured / dead as reported; their gear is lost unless recovered or insured |
| MGT-012 | Memorial wall: read-only record of the dead (service number, last callsign, service record) |

**Callsigns**

| ID | Summary |
| --- | --- |
| MGT-013 | Generation callsign: highest attribute (ties within `callsign_tie_margin` 5, seeded pick) selects row, value band 40–59 / 60–79 / 80–100 selects column |
| MGT-014 | No attribute ≥ `callsign_min` (40): draw from the Generic list |
| MGT-015 | Callsign unavailable while a living soldier uses it; list exhausted → base name + lowest free `-N` |
| MGT-016 | Generation callsign assigned once, never re-rolled |

**Deeds and earned callsigns**

| ID | Summary |
| --- | --- |
| MGT-017 | (optional) Deed definitions: id, prestige 1–5, trigger on service-record data, callsign list; 13 initial deeds |
| MGT-018 | (optional) Every met deed is logged in the service record; repeatability open |
| MGT-019 | (optional) Earned callsign replaces generated or lower-prestige ones; player callsigns never change |
| MGT-020 | (optional) Fallen keep their last callsign on the memorial; it becomes available again |

**Soldier attributes**

| ID | Summary |
| --- | --- |
| MGT-021 | Eight integer attributes 1–100: strength, endurance, agility, perception; marksmanship, recon, medical, technical |
| MGT-022 | (open) Attributes rolled (seeded) within the tier's and pool's ranges; distribution not set |
| MGT-023 | (open) Skills grow by use with diminishing returns (fast < 50, slow > 80); uses reported in battle and op results |
| MGT-024 | (open) Physical attributes change only through rare service-record events |
| MGT-025 | (optional) Unused skills drift toward a floor |
| MGT-026 | Action points derive from Agility; formula owned by TAC-006, Management only stores the attribute |
| MGT-027 | Stamina pool derives from Endurance; formula owned by TAC-009 |
| MGT-028 | HP per zone derives from Endurance; formula and rounding owned by TAC-057 |
| MGT-029 | (open) Carry capacity from Strength (main) and Endurance (minor); formula not set |
| MGT-030 | Other derived values: main/minor attribute table only; formulas owned by TAC (or STR) |
| MGT-031 | (open; effect optional) Nerve starts at 0, grows with deployments survived and fights under fire; effect applied in TAC, deferred |

**Gear, loot & return**

| ID | Summary |
| --- | --- |
| MGT-032 | Inventory is item lists, no grids; each container rejects items beyond its weight limit |
| MGT-033 | (open) Carried weight vs carry capacity affects AP and stamina (applied in TAC); formula not set |
| MGT-034 | (open) Weapon modding from the stash; where allowed and whether Technical is needed not set |
| MGT-035 | Items carried by soldiers who reach an FOB go to its stash and are logged as loot carried out |
| MGT-036 | (open) Insurance: seeded recovery roll per insured item lost; terms not set |
| MGT-037 | Named loadout presets applied from the FOB stash; missing items reported and left empty |
| MGT-038 | (open) A scav loadout is always purchasable and one low-risk contract always offered |
| MGT-039 | Faction traders gated by standing (none / basic + markup / basic / military / best); trading takes no time |
| MGT-040 | (open) Krug market prices fluctuate and are public; stock improves with Krug standing |

**Contracts and missions**

| ID | Summary |
| --- | --- |
| MGT-041 | Management never invents contracts; offers come from strategic / strategic AI and are stored in `contracts` |
| MGT-042 | Contract fields: id, employer, goal, missions with targets and locations, deadline, pay, advance, reputation gain, target faction, intel level, deniable, posted_at |
| MGT-043 | Faction goal → allowed mission types table (→ data/missions.json) |
| MGT-044 | (open) Mission success the moment its goal is met; detected by the layer where it happens, confirmed by Strategic as `missionOutcome`; no return to an FOB needed |
| MGT-045 | An op may bundle missions from several signed contracts; a mission is in at most one op |
| MGT-046 | (open) Pay per mission within its type's pay band, scaled by distance, danger, urgency; contract pay = sum |
| MGT-047 | Advance = round(pay × `advance_fraction` 0.25) on signing; the rest per mission in proportion to mission pay; credited only on `contractPayment` (STR-093) |
| MGT-048 | Failed mission loses only its share and reputation; failed contract (deadline) turns the advance into a debt; employer default keeps the advance, no debt |
| MGT-049 | Intel level exact / last_known / rumour decides what target location data the player sees |
| MGT-050 | (open) Deniable contracts may be disowned: reputation falls on the player alone, pay may be withheld |
| MGT-051 | Contract boards at FOBs, cities, Krug markets; filtered by standing (`unfriendly_contract_share` at Unfriendly) |
| MGT-052 | (open) Rival PMCs take offers and compete; leave-or-race rule not set; rival finishing first fails the player's mission |

**Reputation**

| ID | Summary |
| --- | --- |
| MGT-053 | One integer reputation per non-player faction, −100…100, start 0, clamped, never drifts, no spill-over |
| MGT-054 | Standing derived, never stored: hostile ≤ −50, unfriendly ≤ −20, neutral, friendly ≥ 20, trusted ≥ 50 |
| MGT-055 | Standing effects on contracts, trade, hostility; "better" and "sensitive" are offer flags |
| MGT-056 | Contract acts: mission success +5…+15 by pay band, failure −5, contract broken −30; target faction loses only if attributed |
| MGT-057 | Friendly acts: join fight +5, rescue +10, sell needed supplies +1…+3, Krug deal kept +5 |
| MGT-058 | Hostile acts: attack non-hostile −30, kill −2 (cap −20 per fight), cargo −10, capture VIP −20, assassinate −30, take region −15, Krug break −50 |
| MGT-059 | War crimes −20 with every faction; civilian loyalty collapse applied by STR |
| MGT-060 | Apply each attributed act to the faction it directly affects, clamp, in reported order; no cascade |
| MGT-061 | (removed) Spill-over to hostile and allied factions |
| MGT-062 | (removed) Krug exemption |
| MGT-063 | (removed) Rival PMCs follow their patrons |
| MGT-064 | Act counts only if a member of the affected faction witnessed it and survived, or an Operation dispute event assigns blame |

**Base & meta progression**

| ID | Summary |
| --- | --- |
| MGT-065 | Items, vehicles and services only from looting, purchasing or industry; no FOB upgrades, crafting or research |
| MGT-066 | (open) FOBs: stash, rest, hiring, contract board; one at start, more bought or taken; prices not set |
| MGT-067 | (open) Paid field services (hospital, repairs, fuel) debit `economy`; prices not set |
| MGT-068 | (open) Daily industry deliveries from held plants to the nearest FOB stash; amounts in data/poi.json |
| MGT-069 | (open) Late-game FOB raids become defence missions; loss consequences not set |
| MGT-070 | Economy ledger: balance, debts (creditor, amount, origin), logged credits/debits; shared formulas in economy-rules |
| MGT-071 | (open) Campaign score from money, reputation and surviving soldiers; formula not set |

**Also reads** (rules this module depends on but does not own)

| ID | File | Why management reads it |
| --- | --- | --- |
| GEN-001, GEN-002, GEN-003 | `spec/overview.md` | Op as unit of play, op success (one soldier back at an FOB), mission bundling |
| GEN-004, GEN-007 | `spec/overview.md` | Faction roster (reputation holders) and relations model |
| GEN-006, GEN-010 | `spec/overview.md` | Civilian loyalty and Krug standing as local recruit sources and unlocks |
| GEN-008, GEN-009 | `spec/overview.md` | Karsin's debt book (Krug debts), Krug markets as no-fire zones (Krug break act) |
| GEN-012 | `spec/overview.md` | Campaign end, trigger for the campaign score (MGT-071) |
| STR-003, STR-004 | `spec/strategic.md` | Hour tick (payments) and 00:00 daily checks (deliveries, barter deals, rollover) |
| STR-015, STR-027, STR-029 | `spec/strategic.md` | Plant output, op lifecycle, return to an FOB (op results, loot to stash) |
| STR-039..STR-043 | `spec/strategic.md` | Zero-time trade, contract actions, paid services, FOB purchase, payments to factions |
| STR-054, STR-058 | `spec/strategic.md` | News feed lines for payments; Operation dispute assigns blame (MGT-064) |
| STR-092, STR-093, STR-094 | `spec/strategic.md` | Shared economy formulas, contract payment between modules, Krug escorts |
| SAI-015 | `spec/strategic-ai.md` | Rival PMCs taking offers (MGT-052) |
| TAC-006, TAC-009, TAC-057 | `spec/tactical.md` | AP, stamina and zone HP formulas (shown in the dossier, never stored) |
| TAC-027, TAC-076, TAC-077 | `spec/tactical.md` | Over-encumbrance vs carry capacity, objective met in battle, morale flight and nerve (optional) |
| DAT-004, DAT-005, DAT-007, DAT-008 | `spec/data.md` | Instance state owned by `roster`/`economy`, the seven slots, carried weight, container limits |
| DAT-014, DAT-025, DAT-027, DAT-029 | `spec/data.md` | Weapon condition and repair, squad vehicle storage, vehicle availability, vehicle instance state |
| ITM-021..ITM-024 | `spec/data.md` | Barter goods, trader buy rates, daily barter deals, loot rarity |
| ITM-025..ITM-030 | `spec/data.md` | Operation items (restock effects), hand-in action, rewards, reputation and attribution |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/battle_result.schema.json` | consumes (from tactical) | 0.3.0 |
| `spec/interfaces/management_requests.schema.json` | consumes (from strategic); returns `results` with `paymentDue` | 0.3.0 |
| `spec/interfaces/strategic_commands.schema.json` | consumes (from strategic-ai: `offerContract` / `contractOffer`) | 0.4.0 |
| _none yet_ | produces | — |

Management produces no interface of its own yet: the contract board and roster views, and the
reputation and contract data Strategic reads, are not defined (see Open questions 7).

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/management-rules.json` | `spec/interfaces/data/management-rules.schema.json` | 0.4.0 | All MGT constants (morale, growth, reputation, standing, advance, prices) |
| `data/economy-rules.json` | `spec/interfaces/data/economy-rules.schema.json` | 0.2.0 | Shared money formulas: salaries, pay interval (MGT-005, MGT-070) |
| `data/callsigns.json` | `spec/interfaces/data/callsigns.schema.json` | 0.2.0 | Generation and generic callsigns, deeds (MGT-013..MGT-020) |
| `data/recruitment.json` | `spec/interfaces/data/recruitment.schema.json` | 0.2.0 | Pools, tiers, hire price, salary, term (MGT-002..MGT-005, MGT-022) |
| `data/traders.json` | `spec/interfaces/data/traders.schema.json` | 0.2.0 | Trader stock by standing, barter rates, Krug fluctuation (MGT-039, MGT-040) |
| `data/items.json` | `spec/interfaces/data/items.schema.json` | 0.4.0 | Item weights, containers, values, op items (inventory, loot, trade) |
| `data/presets.json` | `spec/interfaces/data/presets.schema.json` | 0.2.0 | Soldier and scav loadout presets (MGT-037, MGT-038) |
| `data/missions.json` | `spec/interfaces/data/missions.schema.json` | 0.2.0 | Mission types, pay bands, goal mapping, outcome parameters (MGT-043..MGT-046) |
| `data/factions.json` | `spec/interfaces/data/factions.schema.json` | 0.3.0 | Reputation holders, deniable and disown chances (MGT-050, MGT-053) |
| `data/poi.json` | `spec/interfaces/data/poi.schema.json` | 0.3.0 | Plant `dailyOutput` (MGT-068) |
| `data/vehicles.json` | `spec/interfaces/data/vehicles.schema.json` | 0.2.0 | Vehicle storage, availability, prices (DAT-025, DAT-027) |

## State slices

- Owns: `roster`, `unlocks`, `economy`, `contracts`, `reputation`
- Reads: none directly. Battle outcomes arrive in `battle_result`, strategic changes (services, op returns,
  payments, acts, plant output) in `management_requests`, contract offers in `strategic_commands`.
  `world` and `battle` are never read.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Found while scoping; report to the root session, do not edit `spec/`. The 27 open questions still
unresolved in `spec/management.md` › Open questions still apply.

1. **snake_case in spec, camelCase in schemas.** MGT Values lines name `morale_start`, `advance_fraction`,
   `rep_*`, `unfriendly_contract_share`, `callsign_tie_margin`, `callsign_min`; the schemas use
   `moraleStart`, `advanceFraction`, `repActs.*`, `unfriendlyContractShare`, `tieMargin`, `minValue`. The
   MGT-001 record fields (`service_number`, `callsign_source`, `kit_marks`, …) are snake_case too. Which form
   is canonical?
2. **Values with no schema field.** MGT-038 "low-risk contract definition → management-rules.json" has no
   field (only `scavLoadout`); MGT-005 "consequence of non-payment → recruitment.json" has none; DAT-014
   repair rate → management-rules.json has none. `additionalProperties: false` rejects them.
3. **Split values.** Pay interval exists twice (`economy-rules.payIntervalHours` and
   `recruitment.salaryIntervalHours`, MGT-005); the scav loadout sits in both `presets.priceUsd` and
   `management-rules.scavLoadout` (MGT-038). One owner each?
4. **Weight penalty owned twice.** MGT-033 puts the weight → AP/stamina penalty in
   `management-rules.weightPenalty`, TAC-027 puts it in `tactical-rules` (`encumbranceApPenalty`,
   `heavyEncumbranceThreshold`). MGT-026..028 now correctly point to TAC; MGT-033 should too (TAC-027 says
   only carry capacity is MGT/DAT).
5. **Contract fields vs `contractOffer`.** MGT-042 `goal` / `intel_level` / `posted_at` map to
   `sourceGoal` / `intelLevel` / `boardLocation`; the offer has no `id` (yet `acceptContract` uses
   `contractId`), no `targetFaction`, `reputationGain` or `pay` (only `payInputs`), and one
   `reputationGate` string instead of the "better" / "sensitive" flags of MGT-055.
6. **Soldier status enums.** MGT-001 `status` is `active | mia | captured | dead`; `battle_result` soldiers
   also report `leftMap`. Confirm `leftMap` maps to `active` and that the final mia/captured/dead call
   comes from `soldierFate` (MGT-011).
7. **Nothing produced.** Strategic reads reputation and contracts (MGT-053, `strategic_perception_view`
   lists reputation and contracts), and STR-093 needs signed contracts, but no interface carries them out
   of Management. Define a produced interface (or confirm `management_requests.results` is the only one).

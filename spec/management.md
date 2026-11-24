# Management — spec [MGT]

Precise rules derived from `design/`. Each section: `### [MGT-NNN] Title`, then the rule
(inputs, outputs, formula, ranges), its design source, and `→ data/<table>.json` where a concrete value
lives in data. Edited only through `/update-spec`.

Management owns the state slices `roster`, `unlocks`, `economy`, `contracts` and `reputation`. Item
stats and equipment slots are in DAT/ITM; map, travel, world events and faction goals in STR; in-battle
rules in TAC.

## Soldiers & progression

### [MGT-001] Soldier record
**Rule.** Each soldier in `roster` stores: `id`; `serviceNumber` (unique per campaign, assigned at
generation, never changes); `callsign` (current displayed callsign); `callsignSource` (`generated` |
`earned` | `player`); `callsignPrestige` (0 for generated, 1–5 for earned); the eight attributes
(MGT-021); `nerve` (MGT-031); `morale` (MGT-008); `wounds` (`{ zoneHp, conditions }`, per body zone,
in the `battle_result` shapes, TAC Medical system; spec choice); `equipment` (slot → item instance, the
slots of DAT/`tactical_map_request`); `perks` (perk IDs unlocked, MGT-009; never removed; sent as
`tactical_map_request` `units[].perks`, TAC-096); `skillXp` (xp toward the next point, per skill,
MGT-023); `skillIdleDays` (days since last use, per skill, MGT-025); `rank` (a tier ID, MGT-002: the hiring tier at hiring, rising by MGT-074, never dropping; the fee per
op follows it, MGT-005); `feeDiscount` (0–1, default 0: the share taken off its fee per op for as long as it
serves, set at hiring, e.g. a refugee recruit, MGT-003); `deeds` (IDs of deeds already earned, MGT-018); `status` (`active` | `mia` | `captured` |
`dead`); `hiredSkills` (the four skill values at hiring, the drift floor of MGT-025); `serviceRecord`
(MGT-006); `kitMarks` (cosmetic patches and colours). Strategic reads the fields it needs through
`management_view` `roster` (MGT-072). No name, portrait, voice, backstory or personality is generated or stored. Derived
values (MGT-026…MGT-030) are never stored. A `battle_result` soldier status `leftMap` (left through an
exit) is stored as `active`; `battle_result` `mia`, `captured` and `dead` are provisional, and the final
`mia` / `captured` / `dead` status of a soldier who does not reach an FOB is set only by a
`soldierFate` management request (MGT-011).
**Source.** design/management.md › Soldiers & progression

### [MGT-002] Hiring pools
**Rule.** Soldiers are hired from hiring pools of four kinds: `agency`, `local`, `defector`,
`freedPrisoner`. Each pool offers generated candidates in price tiers. There are four tiers, each with a
base hire price, a fee per op and an attribute range. The tiers are also the soldier ranks (MGT-074):

| Tier (`tiers[].id`) | Hire price | Fee per op | Attribute range |
| --- | --- | --- | --- |
| `recruit` | $1,000 | $300 | 20–45 |
| `regular` | $3,000 | $600 | 35–60 |
| `veteran` | $8,000 | $1,200 | 50–75 |
| `elite` | $20,000 | $2,500 | 65–90 |

Hiring happens at an FOB (MGT-066); local recruits also come from Krug standing (GEN-010) and civilian
loyalty (GEN-006). Every FOB always offers at least one affordable candidate, so a replacement is always
available. Hiring takes no game time (STR time rules).
**Values.** the tier table (design draft) → data/recruitment.json `tiers[]` (`id`, `hirePriceUsd`,
`feePerOpUsd`, `attributeRange`); tiers per pool, candidates per pool, refresh interval — not set
(design: not stated) → data/recruitment.json `pools[]`
**Status.** open (pools)
**Source.** design/management.md › Soldiers & progression (Recruitment)

### [MGT-003] Hire price
**Rule.** A candidate's hire price starts from its tier's `hirePriceUsd` (MGT-002) and scales with the
candidate's average attribute within the tier (price follows stats): a candidate at the middle of the tier's
attribute range pays the tier price, a better one more, a worse one less. The exact scaling (e.g. ±
`priceFormula.spread` of the tier price from the bottom to the top of the attribute range) is not designed.
Price modifiers, applied after the scaling: a Krug recruit (local recruit from Krug standing, GEN-010) costs
× (1 + `resentment.priceMarkup`) (Krug resentment, GEN overview); an extra refugee recruit (STR-065, sent in a
`localRecruits` request) costs the normal hire price; it is hired with `feeDiscount` =
`params.recruitFeeDiscount` (MGT-001), so its fee per op is lower for as long as it serves (MGT-005).
**Values.** tier hire prices (design draft, MGT-002) → data/recruitment.json `tiers[].hirePriceUsd`;
scaling within a tier `priceFormula` — not set (design: "scales with the average attribute") →
data/recruitment.json; `resentment.priceMarkup` — 0.10 (design draft) → data/factions.json (Krug record,
schema owned by STR/GEN); `params.recruitFeeDiscount` — 0.30 (design draft) → data/events.json (STR-065)
**Status.** open (scaling)
**Source.** design/management.md › Soldiers & progression (Recruitment); design/design.md › The Krug; design/world-events.md › Events (Refugee movement)

### [MGT-004] Player-chosen callsign and kit marks
**Rule.** The player cannot rename a soldier but may give one a nickname/callsign. It replaces the current
callsign, sets `callsignSource = player`, and is never replaced afterwards (by deeds or anything else).
The service number is unchanged. The player may also set `kitMarks` (cosmetic only).
**Source.** design/management.md › Soldiers & progression

### [MGT-005] Fee per op (was: Salaries and renewals)
**Rule.** A soldier is paid per deployment, not per day: each soldier on an op costs the fee per op of its
current `rank` (`tiers[].feePerOpUsd` of the tier with that ID, MGT-002, MGT-074) × (1 − its `feeDiscount`,
MGT-001), rounded to whole dollars, paid when the op launches.
Strategic sends a `launchOp` management request (`squad`, `soldiers`, `fobId` = the FOB the op starts
from, optional `insuredItems`) when the player launches an op (STR "Launch an op"); Management debits, as one payment, the
sum of the listed soldiers' fees (a hired helicopter pilot is a normal roster soldier with Technical
`pilotTechnicalMin`+, listed in `soldiers` and paid the normal fee of its rank, DAT-028), plus the insurance premium of MGT-036. If the balance
cannot cover the whole sum (MGT-070) nothing is paid, the result is `ok: false` and the op does not launch
(no fee, no launch); otherwise the result names `feesUsd` (and `premiumUsd`) and the op launches. There is no
daily salary and no renewal: a soldier who is not on an op (idle at an FOB, wounded, MIA, captured) costs
nothing. The former non-payment rule and the soldier contract term are removed (nothing can be left unpaid).
A soldier promoted during an op (MGT-074) pays the new fee from the next launch. Fees use the shared economy
rules file only for the booking (MGT-073); their amounts are recruitment data.
**Values.** fee per op by rank — recruit $300, regular $600, veteran $1,200, elite $2,500 (design draft) →
data/recruitment.json `tiers[].feePerOpUsd` (replaces `salaryPerDayUsd`). Removed: `salaryPerDayUsd`,
`contractTermHours`, `nonPayment`, `hiredPilotFeePerOpUsd` (recruitment.json); salaries no longer use `payIntervalHours`.
**Status.** Draft
**Source.** design/management.md › Soldiers & progression (Recruitment; Contracts & morale); design/strategic-actions.md › Movement and operations (Launch an op; Fly one region by helicopter); › Trade, services, contracts and factions (Hire soldiers); design/data-definitions.md › Vehicles (draft) › Helicopters (draft)

### [MGT-074] Rank and promotion
**Rule.** A soldier's `rank` is one of the tier IDs `recruit` < `regular` < `veteran` < `elite` (MGT-002); a new
hire starts at its hiring tier. The average attribute is the mean of the eight attributes (MGT-021),
unrounded. Whenever an attribute changes (MGT-023, MGT-024, MGT-025), if the average attribute is above the
top of the current rank's attribute range (`tiers[].attributeRange.max` of that tier: 45, 60, 75), the rank
rises one step; this repeats while the new rank's top is also exceeded (spec choice for a jump across two
ranges). `elite` is the highest rank. Rank never drops, also when skills drift back (MGT-025). A promotion is
logged in the service record (entry kind `promotion`, spec addition) and the fee per op rises with it from
the next launch (MGT-005). Promotion does not depend on ops survived.
**Values.** promotion thresholds = the tiers' attribute range tops, above 45 / 60 / 75 (design draft) →
data/recruitment.json `tiers[].attributeRange.max` (no separate field)
**Status.** Draft
**Source.** design/management.md › Soldiers & progression (Rank and leadership)

### [MGT-075] Squad leader and Leadership bonus
**Rule.** On an op, the highest-ranked soldier (MGT-074) leads the squad; ties go to the higher average
attribute (then, spec choice, the soldier listed first in the squad). While the leader is alive on the
tactical map, every soldier of the side, the leader included, gets the Leadership bonus of the leader's rank, added to its
morale and to its reaction chance (TAC-022). The bonus is added in battle only and never stored: the morale
reported in the battle result excludes it (MGT-008). If the leader dies or leaves the map, the next
highest-ranked soldier on the map takes over at its next activation (as for AI squad leaders, TAI; spec
assumption for the player's squad) and its rank sets the bonus. TAC applies the bonus (TAC-094); the tactical map
request carries each soldier's `rank` (`units[].rank`, enum recruit / regular / veteran / elite) and `attributes` for TAC to pick the leader. Perk effects (MGT-009) are applied by TAC-096 from `perks[].effect`.
AI squads use the same leader rule and bonus (design/ai.md › Tactical AI).
**Values.** `leadershipBonus` by leader rank — recruit +0, regular +2, veteran +4, elite +6 (design draft; one
value used for both morale points and reaction-chance points) → data/management-rules.json
**Status.** Draft
**Source.** design/management.md › Soldiers & progression (Rank and leadership); design/ai.md › Tactical AI

### [MGT-006] Service record logging
**Rule.** The game appends entries to a soldier's `serviceRecord` automatically, each stamped with game
time (day + hour, STR clock). Entry kinds: `deployment` (op joined, op returned), `kill`, `rescue`,
`wound`, `nearMiss`, `lootCarriedOut` (weight and value), `comradeLost`, `promotion` (MGT-074), plus deed entries (MGT-018).
Entries come from battle results and op results. Entries are never removed.
**Source.** design/management.md › Soldiers & progression › Service record

### [MGT-007] Dossier and after-action report
**Rule.** The dossier shows a soldier's full service record and current stats. After each op an
after-action report lists, per soldier, the service-record entries added during that op. Both are read-only
views of `roster`.
**Source.** design/management.md › Soldiers & progression › Service record

### [MGT-008] Morale persistence
**Rule.** Morale is kept per soldier (`morale` in the soldier record), starting at `moraleStart` for a new
hire, and kept from fight to fight in `roster`. When an op forms, the squad's morale is the average of its
soldiers' morale (rounded to the nearest integer, spec choice). The tactical map request carries each
soldier's own morale (`tactical_map_request` `sides[].units[].morale`, TAC-095; Strategic copies it from the soldier record; the squad average stays available as
the side's morale). Only casualties move morale (allies killed or wounded lower it, enemies killed or wounded
raise it); the in-fight changes are TAC (TAC-095; casualty sizes `moraleCasualty` in data/tactical-rules.json, owned by TAC). The battle result reports each soldier's morale at the end of the
battle (`battle_result` `soldiers[].morale`); after a battle Management sets each reported soldier who is still on the roster to that value,
clamped to 0–100. The reported value excludes the leader's Leadership bonus (MGT-075, battle only, never
stored). The former rule that applied the squad's change to every soldier is removed. The low-morale flight rule (below `moraleFleeBelow` an activated
soldier may disobey and flee toward the nearest exit, TAC) is optional, left out of the first build
iterations; morale persistence itself is not.
**Values.** `moraleStart` — 80; `moraleFleeBelow` — 20 (used by TAC, optional rule) → data/management-rules.json
**Status.** optional (flight rule only)
**Source.** design/management.md › Soldiers & progression › Contracts & morale; design/management.md › Soldiers & progression (Rank and leadership)

### [MGT-009] Perks
**Rule.** Perks unlock when a skill (`marksmanship`, `recon`, `medical`, `technical`) reaches a threshold:
one perk per skill at `perkThresholds[0]` and one at `perkThresholds[1]` (8 perks in all). A perk, once
unlocked, stays (spec assumption, also if the skill drifts back, MGT-025). Leadership is not a perk: it
comes from rank only (MGT-075). Management records which perks a soldier has (`perks`, MGT-001;
published in `management_view` `roster`, MGT-072); each effect is applied by the
owner of the rule it changes (TAC for battle rules, MGT-067 for repairs, TAC recovery for FOB healing):

| Perk (`perks[].id`) | Skill, threshold | Effect (`perks[].effect`) |
| --- | --- | --- |
| `steadyAim` | marksmanship 50 | Shooter spread × 0.9 on shots with at least one aim step (`shooterSpreadFactor` 0.9, `minAimSteps` 1; TAC-044) |
| `snapShooter` | marksmanship 80 | Snap-shot penalty +1.5 MoA instead of the normal one (`snapShotPenaltyMoa` 1.5 replaces `snapShotSpread` of TAC-023, in the spread sum of TAC-044) |
| `quietStep` | recon 50 | Enemies notice the soldier at 20% shorter distance (`noticeDistanceFactor` 0.8; TAC-081) |
| `ghost` | recon 80 | Reaction chance against the soldier −10 while crouched or prone (`reactionChanceAgainst` −10, `whileStance` [crouched, prone]; TAC-022) |
| `fieldMedic` | medical 50 | Medical items cost 1 AP less, never below 1 (`medicalApReduction` 1, `medicalApMin` 1; TAC Medical system) |
| `traumaSurgeon` | medical 80 | IFAK and medkit restore 25% more HP (`hpRestoreFactor` 1.25, `items` [IFAK, medkit]); the soldier's patients heal 25% faster at the FOB (`fobHealFactor` 1.25; TAC recovery) |
| `armourer` | technical 50 | The soldier's weapons wear 25% slower (`weaponWearFactor` 0.75; TAC-083); the soldier's repairs restore 25% more condition (`repairFactor` 1.25; MGT-067) |
| `sapper` | technical 80 | Bolt cutters take 5 AP instead of 10 (`boltCutterAp` 5; ITM-026); field repairs of vehicles restore 25% more condition (`vehicleRepairFactor` 1.25; MGT-067) |

"The soldier's patients" = soldiers whose FOB recovery uses this soldier as the squad's best Medical (spec
reading of TAC recovery, which is driven by the best Medical in the squad).
**Values.** `perkThresholds` — [50, 80] (design draft) → data/management-rules.json; `perks` — the table
above (design draft) → data/management-rules.json `perks[]` (`id`, `attribute`, `threshold`, `effect`)
**Status.** Draft
**Source.** design/management.md › Soldier attributes (draft) › Perks (draft)

### [MGT-010] Persistent injuries
**Rule.** Wounds from a battle result are stored on the soldier and persist between fights until healed.
Serious wounds need hours of recovery at an FOB or field surgery; healing rules are TAC (Medical system,
Recovery after an op).
**Source.** design/management.md › Soldiers & progression › Injuries

### [MGT-011] Death, MIA and capture
**Rule.** Death is permanent: `status = dead`, the soldier leaves the active roster and moves to the
memorial (MGT-012). A soldier who leaves the tactical map (`battle_result` status `leftMap`) stays
`active`. A soldier who does not reach an FOB at op end (GEN-002) gets `status` `mia`, `captured` or
`dead` from the `soldierFate` management request (field `fate`), which makes the final call; the
`battle_result` status alone never sets it. Strategic rolls the fate from who holds the battle tile
(STR). An `mia` soldier may return later: a `soldierFate` request with `fate: returned` sets `status` back
to `active` (the soldier rejoins at the FOB Strategic names, `fobId`) and logs the return in the service
record (the Revenant deed, MGT-017). A `captured` soldier comes back the same way when freed or returned
(STR); `dead` is final. Gear on a dead or missing soldier stays
on the operation map and is lost to the PMC unless recovered during the op (or by insurance, MGT-036).
**Source.** design/management.md › Soldiers & progression › Death; › Gear, loot & return

### [MGT-012] Memorial wall
**Rule.** A dead soldier's full record (service number, last callsign, service record) moves to the
memorial wall, a read-only list kept for the campaign.
**Source.** design/management.md › Soldiers & progression › Memorial

## Callsigns

### [MGT-013] Generation callsign: row and column
**Rule.** At generation, find the soldier's highest attribute value `v`. Candidates = every attribute
with value ≥ `v − tieMargin` (all within 5 of the top one, not only two); pick one uniformly (seeded RNG). If `v < minValue`, use MGT-014.
Otherwise the picked attribute selects the row and its value selects the column band: 40–59, 60–79,
80–100. Draw one callsign uniformly from that cell (seeded), excluding unavailable ones (MGT-015).
**Values.** `tieMargin` — 5; `minValue` — 40; bands 40–59 / 60–79 / 80–100; callsign lists
per attribute and band → data/callsigns.json
**Source.** design/callsigns.md › Generation callsigns

### [MGT-014] Generic callsigns
**Rule.** If no attribute is ≥ `minValue`, draw from the Generic list (seeded), excluding unavailable
ones (MGT-015).
**Values.** Generic list (Kid, Pup, Sparrow, Bones, Private) → data/callsigns.json
**Source.** design/callsigns.md › Generation callsigns

### [MGT-015] Callsign uniqueness and suffix
**Rule.** A callsign is unavailable if any living soldier in the roster (`status` ≠ `dead`) currently
uses it. For a generation list (MGT-013, MGT-014): if every callsign of the selected list is unavailable,
draw a base callsign from the list (seeded) and append `-N` with the lowest N ≥ 2 that makes it available
(e.g. `Ox-2`). For an earned (deed) list (MGT-019): if every callsign of the deed's list is unavailable,
no suffix is used — the soldier keeps the current callsign (and its `callsignSource` / `callsignPrestige`);
the deed is still logged (MGT-018).
**Source.** design/callsigns.md › Generation callsigns; design/management.md › Deeds and callsigns

### [MGT-016] Callsign assigned once
**Rule.** The generation callsign is assigned once at generation and never re-rolled when attributes
change. Until deeds are implemented, soldiers keep it unless the player sets one (MGT-004).
**Source.** design/callsigns.md › Generation callsigns; design/management.md › Deeds and callsigns

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
logged, whether or not it changes the callsign. Each deed is earned at most once per soldier: a deed whose
ID is already in the soldier's `deeds` is not logged again, and a milestone already reached (5 ops, 50 ops)
does not trigger again later. The two milestone deeds are separate deeds, so reaching 50 ops still earns
the 50-ops deed.
**Status.** optional
**Source.** design/management.md › Deeds and callsigns; design/callsigns.md › Earned callsigns

### [MGT-019] Earned callsign replacement
**Rule.** On a new deed with prestige `p`: if `callsignSource = player`, no change. Else if
`callsignSource = generated` or `p > callsignPrestige`, draw an available callsign from the deed's list
(MGT-015), set `callsignSource = earned`, `callsignPrestige = p`; if the deed's list is used up, nothing
changes (MGT-015). Equal or lower prestige keeps the current callsign.
**Status.** optional
**Source.** design/management.md › Soldiers & progression › Earned marks; › Deeds and callsigns

### [MGT-020] Fallen keep last callsign
**Rule.** A soldier who dies keeps the last callsign held on the memorial wall. That callsign becomes
available again for living soldiers (MGT-015 counts living soldiers only).
**Status.** optional
**Source.** design/management.md › Deeds and callsigns

## Soldier attributes

### [MGT-021] Attribute set
**Rule.** Every soldier has eight integer attributes, each 1–100. Physical: `strength`, `endurance`,
`agility`, `perception`. Skills: `marksmanship`, `recon`, `medical`, `technical`. All other soldier values
are derived from these (plus `nerve`).
**Values.** `attributeMin` — 1; `attributeMax` — 100 → data/management-rules.json
**Source.** design/management.md › Soldier attributes

### [MGT-022] Attribute generation
**Rule.** A new candidate rolls each attribute (seeded) within the attribute range of its price tier
(MGT-002: recruit 20–45, regular 35–60, veteran 50–75, elite 65–90). The distribution within the range is
not designed (spec default until set: uniform integer).
**Values.** per-tier attribute ranges (design draft) → data/recruitment.json `tiers[].attributeRange`;
distribution — not set (design: not stated) → data/recruitment.json `attributeDistribution`
**Status.** open
**Source.** design/management.md › Soldier attributes › Rules

### [MGT-023] Skill growth by use
**Rule.** Skills gain experience (xp, per skill) from use and rise with diminishing returns. Each use
gives `skillGrowth.xpPerUse` xp to that skill; when the skill's xp reaches the cost of the next point, the
skill rises by 1 and that cost is subtracted. The cost depends on the current value: `xpPerPoint.fast` below
`skillGrowth.fastBelow`, `xpPerPoint.medium` from `fastBelow` up to `slowAbove`, `xpPerPoint.slow` above
`slowAbove`. Gaining uses: marksmanship — hitting targets, reloading under fire; recon — moving unseen,
scouting; medical — treating wounds; technical — repairing, using explosives (modding is no longer a
Technical use, MGT-034). Uses are reported in battle results (TAC) and op results (STR). Capped at
`attributeMax`.
**Values.** `skillGrowth.fastBelow` — 50; `skillGrowth.slowAbove` — 80; `skillGrowth.xpPerUse` — 1;
`skillGrowth.xpPerPoint` — `fast` 5, `medium` 10, `slow` 20 (design draft; "from 50 to 80" is the medium
band) → data/management-rules.json
**Status.** Draft
**Source.** design/management.md › Soldier attributes › Rules

### [MGT-024] Physical attribute changes
**Rule.** Physical attributes do not grow with use. They change only through rare service-record events:
a serious wound, a long recovery, hard campaigning. Each such event changes one physical attribute by
between `physicalChange.min` and `physicalChange.max` points (signed; seeded roll), clamped to the
attribute range.
**Values.** change size ±1 to ±5 per event (design draft) → data/management-rules.json
`physicalChange { min 1, max 5 }` (magnitude); event conditions and which attribute, and the sign per event
— not set (design: not stated) → data/management-rules.json `physicalChanges[]`
**Status.** open (event conditions)
**Source.** design/management.md › Soldier attributes › Rules

### [MGT-025] Skill drift
**Rule.** A skill not used for `skillDrift.idleDays` days loses `skillDrift.points` and the idle count
restarts; it never drops below the value the soldier was hired with (stored per soldier as the floor). A
use resets the idle count.
**Values.** `skillDrift.points` — 1, `skillDrift.idleDays` — 14; floor = hire value (design draft) →
data/management-rules.json
**Status.** optional
**Source.** design/management.md › Soldier attributes › Rules

### [MGT-026] Action points
**Rule.** Action points derive from Agility (main). The formula is owned by the Tactical Layer (TAC-006);
Management stores only the attribute and computes nothing here.
**Source.** design/management.md › Soldier attributes › Derived values; › Tactical Layer (Action points)

### [MGT-027] Stamina pool
**Rule.** The stamina pool derives from Endurance (main). The formula is owned by the Tactical Layer
(TAC-009); Management stores only the attribute.
**Source.** design/management.md › Soldier attributes › Derived values; design/tactical-layer.md › Turn structure (Stamina)

### [MGT-028] HP per zone
**Rule.** HP per body zone derives from Endurance (main). The formula, including rounding, is owned by the
Tactical Layer (TAC-057); Management stores only the attribute.
**Source.** design/management.md › Soldier attributes › Derived values; design/tactical-layer.md › Body zones and hitboxes

### [MGT-029] Carry capacity
**Rule.** Carry capacity (kg) = `carryCapacity.base` + `carryCapacity.strength` × Strength +
`carryCapacity.endurance` × Endurance (15–55 kg). Strength is the main attribute, Endurance the minor one.
TAC-027 applies it (over-encumbrance).
**Values.** `carryCapacity` — `base` 15, `strength` 0.3, `endurance` 0.1 (draft) → data/management-rules.json
**Source.** design/management.md › Soldier attributes › Derived values

### [MGT-030] Other derived values
**Rule.** Each derived value uses at most a main and a minor attribute. This table only names the
attributes; the formulas are owned by the Tactical Layer (or STR where noted), and Management holds no
values for them:

| Derived value | Main | Minor | Formula owner |
| --- | --- | --- | --- |
| Shooter spread | marksmanship | perception (at range) | TAC-044 |
| Recoil control | marksmanship | strength | TAC-047 |
| Reload and weapon swap cost | marksmanship | agility | TAC Tactical actions: reload from Marksmanship and weapon ergonomics; swap from Agility and weapon weight |
| Spotting and sight range | perception | recon | TAC-081; night sight TAC-004 |
| Reaction chance | perception (reactor) | agility (mover) | TAC-022 |
| Noise and concealment | recon | agility | TAC-081 (concealment), TAC-022 (noise) |
| Treatment speed and effect | medical | — | TAC Medical system |
| Repairs, explosives, piloting | technical | — | TAC; helicopter pilot minimum STR-034 |

**Source.** design/management.md › Soldier attributes › Derived values; design/tactical-actions.md

### [MGT-031] Nerve
**Rule.** `nerve` is not rolled; it runs from `nerve.min` to `nerve.max`, starts at `nerve.start` and
grows with the service record: `nerve.perDeployment` per deployment survived (op returned) and
`nerve.perFightUnderFire` per fight under fire, capped at `nerve.max`. Higher nerve lowers the effect of
suppression and how much casualties lower morale for that soldier (applied in TAC): the soldier's
suppression spread penalty and each casualty's morale loss for that soldier are multiplied by
`1 − nerve ÷ nerve.effectDivisor` (Nerve 100 halves both). That effect is not implemented in the first build
iterations (deferred); nerve is still tracked. Leadership is not a perk unlocked by nerve (or anything else):
it comes from rank only (MGT-074, MGT-075).
**Values.** `nerve.min` — 0, `nerve.max` — 100, `nerve.start` — 0, `nerve.perDeployment` — 2,
`nerve.perFightUnderFire` — 1, `nerve.effectDivisor` — 200 (design draft) → data/management-rules.json
**Status.** Draft; effect optional
**Source.** design/management.md › Soldier attributes › Nerve

## Gear, loot & return

### [MGT-032] Inventory model
**Rule.** Inventory is item lists, no grids. Every container (vest, belt, backpack, vehicle storage, FOB
stash) holds any items while total item weight ≤ its weight limit. Adding an item that exceeds the limit
is rejected. Container limits and item weights are ITM.
**Source.** design/management.md › Gear, loot & return

### [MGT-033] Carried weight effect
**Rule.** Total weight a soldier carries affects AP and stamina (relative to carry capacity, MGT-029).
The penalty is owned by the Tactical Layer (→ see TAC-027, `encumbranceApPenalty`,
`heavyEncumbranceApPenalty`, `heavyEncumbranceThreshold` in data/tactical-rules.json); Management holds no
value for it and supplies only carry capacity (MGT-029).
**Source.** design/management.md › Gear, loot & return

### [MGT-034] Weapon modding
**Rule.** Weapons with mod slots (muzzle, stock, grips, handguard, optics; DAT-011 — there is no magazine
slot, magazines are items) can have mods fitted or removed anywhere outside battle: at an FOB from its
stash, or in the field from the squad's containers and vehicle storage. Never during a battle. No skill is
needed and it takes no game time (design: not stated, spec assumption) and gives no Technical xp. Mod
effects (accuracy, ergonomics, recoil, audible range, AP cost) and slots are DAT/ITM.
**Source.** design/management.md › Gear, loot & return

### [MGT-035] Loot carried out
**Rule.** Loot categories: weapons, armour, intel documents, valuables, medical supplies, quest items
(ITM). Items carried by soldiers who reach an FOB at op end are moved to that FOB's stash and logged as
`lootCarriedOut` (MGT-006). Rarity by location is mapgen (STR/TAC).
**Source.** design/management.md › Gear, loot & return

### [MGT-036] Insurance
**Rule.** Before an op the player may insure gear carried on it. The premium is
`insurance.premiumFraction` × the insured items' `valueUsd` (ITM-034), debited when the op starts, together with the fees in the `launchOp` payment (MGT-005; `insuredItems`). For each
insured item lost on that op (MGT-011), roll (seeded) `insurance.recoveryChance`; on success the item
returns to the stash of the FOB the op started from after `insurance.delayDays` days (spec choice of the
FOB; `launchOp` `fobId`, MGT-005). Insurance covers one op.
**Values.** `insurance.premiumFraction` — 0.10 per op; `insurance.recoveryChance` — 0.5;
`insurance.delayDays` — 3 (design draft) → data/management-rules.json
**Status.** Draft
**Source.** design/management.md › Gear, loot & return › Risk control

### [MGT-037] Loadout presets
**Rule.** The player can save named loadout presets (item IDs per container) and apply one to a soldier;
applying takes items from the FOB stash, missing items are reported and left empty.
**Source.** design/management.md › Gear, loot & return › Risk control

### [MGT-038] Scav loadout and rebuild floor
**Rule.** A cheap "scav" loadout is always purchasable at every FOB, and the contract board always offers
at least one low-risk contract, so a PMC that lost its gear can rebuild.
The scav loadout is a used AK-74M with 2 magazines, a tourniquet and no armour. A low-risk contract is a
`retrieve_deliver` mission away from the front, against no faction (`targetFaction` null). Strategic makes
sure that some faction always keeps at least one such offer posted (STR-098; design decision
2026-11-24); Management never asks for or invents one (MGT-041), it only stores and shows the offers it
receives.
**Values.** (design drafts) `scavLoadout.items` — AK-74M (used: `scavLoadout.weaponCondition`, not set) ×1,
AK-74 magazine ×2, tourniquet ×1; `scavLoadout.priceUsd` — $500; `lowRiskContract` — `{ missionId:
retrieve_deliver, targetFaction: null, minFrontDistance }` (`minFrontDistance`, the tiles that count as "away from the
front" — not set) → data/management-rules.json (the only owner of the scav loadout; data/presets.json
holds no scav price)
**Status.** open (condition of a "used" weapon; "away from the front" distance)
**Source.** design/management.md › Gear, loot & return › Design risk

### [MGT-039] Faction traders
**Rule.** Each employer faction has traders whose available stock is gated by the player's standing with
that faction (MGT-055): Hostile — no trade; Unfriendly — basic stock only, at prices × (1 +
`unfriendlyPriceMarkup`); Neutral — basic stock at `valueUsd` (ITM-034); Friendly — adds military gear;
Trusted — adds armoured vehicles, helicopters, best stock. Trading takes no game time. Each trader's stock
lives at its location; bought items go to the stash of the FOB there, or into the buying squad's
containers and vehicle storage in the field (MGT-066).
**Values.** stock lists per faction and standing → data/traders.json; `unfriendlyPriceMarkup` — 0.25
(design draft: +25%) → data/management-rules.json
**Source.** design/management.md › Gear, loot & return › Traders; › Reputation › Standing

### [MGT-040] Krug market prices
**Rule.** Krug markets (a `krugMarket` flag on a town or city tile, STR; not a point of interest of
their own) have prices that fluctuate over time and are public: every price is visible to the
player without intel. Stock improves with Krug standing (GEN-010). Each item's base price is its
`valueUsd` (ITM-034). Once per day (00:00 `dailyRollover`) each Krug price moves by a seeded factor in
[−`dailyMaxChange`, +`dailyMaxChange`] of its current price, then is clamped to
[base × (1 − `maxDeviation`), base × (1 + `maxDeviation`)]. Krug resentment: whatever the player pays the Krug (purchases, barter deals counted against the player, services) is × (1 + `resentment.priceMarkup`) on top (GEN overview, Krug resentment); what the Krug pays the player (ITM-022) is unchanged (spec reading: "cost the player more").
**Values.** `resentment.priceMarkup` — 0.10 (design draft) → data/factions.json; `krugPriceFluctuation.dailyMaxChange` — 0.10; `krugPriceFluctuation.maxDeviation` — 0.30
(design draft) → data/traders.json
**Status.** Draft
**Source.** design/management.md › Gear, loot & return › Traders; design/design.md › The Krug

## Contracts and missions

### [MGT-041] Contract origin
**Rule.** Management does not invent contracts. A contract offer is received from the strategic layer /
strategic AI when a faction has a goal it cannot cover with its own squads or wants deniable; from a
faction with intel on a rival's goal (counter-contract against that goal, so both sides of one job may be
on the board); from a faction's intel needs alone (`sourceGoal: intelNeeds`, with no squad goal behind
it, MGT-043); or from world events and desperate measures (STR). Strategic hands each offer to
Management as a `contractOffer` management request carrying the offer object (STR-044); Management stores
it in `contracts` with status `offered`.
**Source.** design/management.md › Contracts and missions › Where contracts come from

### [MGT-042] Contract structure
**Rule.** A contract in `contracts` is the received offer (`management_requests` `contractOffer`, the
same fields as `strategic_commands` `contractOffer`) plus the values Management derives and the status:

| Field | From | Meaning |
| --- | --- | --- |
| `id` | offer | Contract ID; `acceptContract`, `missionOutcome`, `contractEnded` and `contractPayment` name it as `contractId` |
| `employer` | offer | Faction ID |
| `sourceGoal` | offer | Source faction goal (MGT-043) |
| `missions` | offer | One or more `{ key, missionId (mission type, data/missions.json), targets, location }`; `key` is unique within the contract and names the mission in `missionOutcome` |
| `deadline` | offer | Game time `{ day, hour }` (whole hours) |
| `payInputs` | offer | Distance, danger, urgency (MGT-046) |
| `targetFaction` | offer | Faction the contract acts against, or null |
| `reputationGain` | offer | Not used for the amount: the gain is per mission completed, by that mission's pay band (MGT-056). Kept in the offer for interface compatibility |
| `intelLevel` | offer | MGT-049 |
| `deniable` | offer | MGT-050 |
| `reputationGate` | offer | `{ better, sensitive }` flags (MGT-055) |
| `boardLocation` | offer | Where it is posted (MGT-051) |
| `counterContractOf` | offer | Contract ID it counters, or null (MGT-041) |
| `pay` | MGT | Sum of mission pays (MGT-046); each mission also keeps its own `pay` |
| `advance` | MGT | MGT-047 |
| `status` | MGT | `offered`, `signed`, `ended` |
| `endReason` | MGT | When `ended`: `completed`, `deadline`, `employerDefault`, `factionDissolved` (from `contractEnded`), or `allFailed` (set by Management when the last open mission fails, MGT-048) |
| `disowned` | MGT | `true` once the employer has disowned the contract (MGT-050) |

The player signs a contract to accept it (`acceptContract`, status `signed`). Management publishes the
contracts with their status in `management_view` (MGT-072).
**Source.** design/management.md › Contracts and missions › Contract terms

### [MGT-043] Goal to mission mapping
**Rule.** A faction goal generates missions only from its allowed set. Goal names are the STR-018 goal
types (`strategic_commands` `goal`); `intelNeeds` is not a squad goal but the `sourceGoal` of an offer
posted from intel by any faction: intel needs create offers on their own, with no squad goal behind them. Mission types are record IDs of data/missions.json (lowercase, as the
record-ID pattern requires).

| Goal (`sourceGoal`) | Mission types |
| --- | --- |
| `supplyRun` | retrieve_deliver, escort_shipment |
| `attackPoi` | capture_territory, assassinate_vip (defending commander) |
| `holdPoi` | defend_territory, escort_shipment, capture_territory (retake) |
| `escort` | escort_vip, escort_shipment |
| `hunt` | capture_vip, assassinate_vip |
| `tradeRoute` (Krug) | retrieve_deliver, escort_shipment |
| `intelNeeds` (any faction) | retrieve_deliver (documents, captured equipment) |

**Values.** mapping → data/missions.json (`goals` per mission type)
**Source.** design/management.md › Contracts and missions

### [MGT-044] Mission outcome conditions
**Rule.** Each mission resolves to `success` or `failure`. A mission counts as completed (`success`) the
moment its goal is met, even if the squad is lost afterwards; later events of the op do not undo it
(GEN-002). The layer where the goal is met detects it at once and shows "Objective met": tactical (VIP
killed or captured, target destroyed, cargo saved; TAC-076) or strategic (delivery, hand-over, holding a
place long enough, deadline; STR-027). Strategic confirms the mission, from the battle result or its own
check, and reports it to Management as `missionOutcome` (naming the mission by `missionKey`); Management then books the mission's pay share
(MGT-047). No mission needs the squad to return to an FOB:

| Mission | Success | Failure |
| --- | --- | --- |
| retrieve_deliver | items handed over at destination before deadline | items lost, sold elsewhere or late |
| escort_shipment | convoy arrives with at least `success.cargoShare` of its cargo by weight | convoy destroyed or captured |
| escort_vip | VIP arrives alive | VIP killed or captured |
| capture_vip | VIP delivered alive | VIP killed, escapes or rescued |
| assassinate_vip | VIP confirmed dead (soldier witnessed kill or took an item from the body) | VIP survives the deadline |
| capture_territory | control passes to employer after holding for `success.handoverHours` | position lost before handover |
| defend_territory | position held when attackers are beaten or retreat | position falls |

A mission the employer's rival PMC completes first fails for the player (MGT-052).
**Values.** escort_shipment `success.cargoShare` — 0.6 (by weight); capture_territory
`success.handoverHours` — 6 (design draft) → data/missions.json (mission record `success` parameters;
schema owned with STR)
**Status.** Draft
**Source.** design/management.md › Contracts and missions › Mission types; design/design.md › Overview › Core loop

### [MGT-045] Bundling missions into an op
**Rule.** When planning an op (GEN-001) the player selects any missions from any signed contracts; one op
may carry missions from several contracts. A mission may be in at most one op at a time.
**Source.** design/management.md › Contracts and missions

### [MGT-046] Contract pay
**Rule.** Pay per mission lies within its mission type's pay band `[low, high]`:
`missionPay = round(low + (high − low) × (distance + danger + urgency) / 3)`, where `distance`, `danger` and
`urgency` (how much the employer wants it) are the offer's `payInputs`, each a score 0–1 set by the offering
side (STR-044). Rounding to whole dollars (spec choice). Contract pay = sum of mission pays.
**Values.** pay bands: retrieve_deliver $3,000–8,000; escort_shipment $6,000–12,000; escort_vip
$8,000–15,000; assassinate_vip $10,000–20,000; capture_vip $12,000–25,000; capture_territory
$15,000–30,000; defend_territory $8,000–18,000 → data/missions.json; the formula above (design draft; no
constants). Whether one offer's `payInputs` apply to every mission or per mission — spec: per offer (the
interface holds one `payInputs`)
**Status.** Draft
**Source.** design/management.md › Contracts and missions › Pay bands

### [MGT-047] Advance and remainder
**Rule.** On signing, `advance = round(pay × advanceFraction)` is due. The rest, `pay − advance`, is paid
per mission: each mission pays its share when its goal is met (MGT-044). A mission's share is the rest
split in proportion to mission pay, `share = round((pay − advance) × missionPay / pay)`; the rounding
difference goes to the contract's last mission (the last one in `missions` order, so the shares always sum
to `pay − advance`). The money comes from the
employer's funds, which Strategic owns: MGT names the payment due in its result (`contractId`,
`employer`, `amountUsd`), Strategic deducts it from the employer's funds and, at the next strategic hour,
sends a `contractPayment` request and a news-feed line; only then is the amount credited to `economy`,
wherever the squad is (STR-093). A payment due that the employer cannot cover fails the contract at once;
the player keeps the advance (MGT-048). Strategic reads the signed contracts and their status for STR-093
from `management_view` (MGT-072).
**Values.** `advanceFraction` — 0.25 (draft) → data/management-rules.json
**Source.** design/management.md › Contracts and missions › Contract terms; design/design.md › Overview › Core loop; design/strategic-layer.md › Squads and simulation (Faction funds (draft))

### [MGT-048] Contract failure
**Rule.**
- **Failed mission:** loses only its own share (MGT-047) and its reputation (`repActs.missionFailed`,
  MGT-056); the contract goes on, and its other missions can still be met and paid.
- **Failed contract:** a contract fails when its deadline passes with missions still open (`contractEnded`
  reason `deadline` from Strategic), or when every mission has failed (Management ends it itself,
  `endReason: allFailed`). A contract with at least one successful mission and no open ones is
  `completed`. A failed contract: no further pay and a reputation loss with the employer (MGT-056); the
  player keeps the advance and owes nothing — no debt entry, no repayment (the former `repayDebt` request and
  `repayment` result are removed). A failed contract costs only reputation.
- **Employer default:** a payment due that the employer's funds cannot cover fails the contract at once
  (`contractEnded` from Strategic, STR-093). No further pay; no reputation loss with anyone; the player keeps
  the advance. An offer whose advance the employer cannot pay cannot be
  signed (STR-093).
**Source.** design/management.md › Contracts and missions › Contract terms; design/strategic-layer.md › Squads and simulation (Faction funds (draft)); design/strategic-actions.md › Trade, services, contracts and factions (Accept a contract)

### [MGT-049] Intel level
**Rule.** Each contract has `intelLevel` ∈ {`exact` (exact location), `lastKnown` (last known position),
`rumour` (rumours only)}, which decides what target location data the contract reveals to the player.
**Source.** design/management.md › Contracts and missions › Contract terms

### [MGT-050] Deniability
**Rule.** A contract with `deniable = true` may be disowned by its employer if it goes wrong (a mission
fails, or the contract fails, MGT-048): roll (seeded) the employer's `disownChance` once per contract, when
it first goes wrong (design decision 2026-11-24); a contract not disowned then is never rolled again. When
disowned (`disowned = true`): the contract is still paid (missions met later still pay their shares) but
gives no reputation gains with the employer — no `reputationGain` (MGT-056) from then on; the reputation
losses for failed missions and for a broken contract with the employer still apply (design); reputation losses with other factions that would be attributed to the employer fall on the player
alone; the employer never admits the link (no event, news line or hand-in names it as the employer).
Mostly VDK contracts are deniable.
**Values.** `disownChance` — VDK 0.30, every other employer 0.10 (design draft) → data/factions.json
(per-faction field, schema owned by STR); chance that an offer is deniable per employer — not set (design:
"often the VDK") → data/factions.json
**Status.** open (deniable chance per offer)
**Source.** design/management.md › Contracts and missions › Contract terms; design/design.md › Factions & campaign › Factions

### [MGT-051] Contract board and filtering
**Rule.** Contract offers are shown on boards at FOBs, in cities, and (Krug work only) at Krug markets.
An employer at standing Hostile shows no offers. At Unfriendly it shows only a share
`unfriendlyContractShare` of its basic offers (selection seeded, per offer when it arrives, so it does not
change with every view). Neutral or better shows all basic offers; contracts marked sensitive require
Trusted; better contracts require Friendly (MGT-055). Krug work at Krug markets includes escort work for
the Krug's own convoys (STR-094). An offer a rival PMC takes leaves the board (MGT-052).
**Values.** `unfriendlyContractShare` — 0.5 (design draft) → data/management-rules.json
**Source.** design/management.md › Contracts and missions › Where contracts come from; › Reputation

### [MGT-052] Rival PMC competition
**Rule.** Varyag and Aegis can take contract offers from their own side (SAI-015) and compete with the
player. A rival taking an offer that is on the player's board (still `offered`) removes it from the board:
Strategic sends `contractEnded` for it (the offer is dropped; reason `taken`, spec name), and Management
removes the offer from `contracts`. Only a contract the player has already signed can become a race: the
rival then pursues the same missions. If the rival completes a mission first, the player's mission fails
(`missionOutcome` `failure`, `outcomeReason: rivalFirst`): no pay share and **no** reputation loss (no
`repActs.missionFailed`). While competing, an Unfriendly faction treats the player as hostile (MGT-055).
The Krug never takes other factions' contracts. A Krug escort for a shipment is hired at a Krug-market tile
before the shipment leaves; its price follows distance and danger (STR-094, priced in data owned by STR).
The hire is a strategic action that Strategic resolves (STR-094); Management only debits the price from
`economy` when the Krug accepts (`payKrugEscort`, MGT-076).
**Source.** design/management.md › Contracts and missions › Where contracts come from; › Reputation › Standing; design/strategic-layer.md › Squads and simulation

## Reputation

### [MGT-053] Reputation value
**Rule.** Each non-player faction (GEN-004) holds one integer reputation toward the player, range −100…100,
starting at 0. Every change is clamped to the range. Reputation never drifts; it changes with two things
only: how the player handles contracts (MGT-056) and what the player does to the faction (MGT-057…MGT-059),
applied by MGT-060. An act changes reputation only with the faction it directly affects; there is no
spill-over to that faction's allies or enemies (MGT-061…MGT-063 removed). Reputation is also read as an
input by world events, desperate measures and faction goals (STR); Strategic reads it, with the derived
standing (MGT-054), from `management_view` (MGT-072), never from the `reputation` slice directly.
**Values.** `repMin` — −100; `repMax` — 100; `repStart` — 0 → data/management-rules.json
**Source.** design/management.md › Reputation (draft)

### [MGT-054] Standing levels
**Rule.** Standing is derived from reputation `r`: `hostile` if r ≤ −50; `unfriendly` if −49 ≤ r ≤ −20;
`neutral` if −19 ≤ r ≤ 19; `friendly` if 20 ≤ r ≤ 49; `trusted` if r ≥ 50. Never stored; published per
faction in `management_view` (MGT-072). These thresholds are the only low-reputation thresholds; SAI-013
uses the derived standing.
**Values.** `standingThresholds.hostile` −50 (r ≤), `standingThresholds.unfriendly` −20 (r ≤),
`standingThresholds.friendly` 20 (r ≥), `standingThresholds.trusted` 50 (r ≥) → data/management-rules.json
**Source.** design/management.md › Reputation › Standing

### [MGT-055] Standing effects
**Rule.**
- `hostile`: no contracts, no trade; the faction attacks player squads on sight (SAI) and may put a
  bounty on the PMC (STR).
- `unfriendly`: only a share of its contract offers (`unfriendlyContractShare`, MGT-051), marked-up prices
  (`unfriendlyPriceMarkup`, MGT-039), and its traders sell basic stock only; hostile to the player when
  competing for the same objective.
- `neutral`: basic trade and basic contracts.
- `friendly`: adds military gear and better contracts.
- `trusted`: adds armoured vehicles, helicopters, best stock and sensitive contracts.
Used by MGT-039 (traders) and MGT-051 (contract board). Which contracts count as "better" and
"sensitive" is set by the offering faction as the offer's `reputationGate` flags `{ better, sensitive }`
(booleans; `better` needs Friendly, `sensitive` needs Trusted; neither set = basic).
**Source.** design/management.md › Reputation › Standing

### [MGT-056] Contract reputation acts
**Rule.** Changes with the employer, per mission:
- **Mission completed:** a gain by that mission's pay (`missionPay`, MGT-046), looked up in
  `repActs.missionSuccessByPay`: +5 below $8,000, +10 from $8,000 to $15,000, +15 above $15,000. Applied
  once per mission completed. The offer's `reputationGain` field is not used for the amount (MGT-042). No
  gain while the contract is disowned (MGT-050).
- **Mission failed:** `repActs.missionFailed` — except when a rival PMC completed it first (MGT-052): no
  loss.
- **Contract broken** (cargo kept or sold, VIP handed to someone else, employer betrayed):
  `repActs.contractBroken`.
On success, the target faction (`targetFaction`) loses reputation per the hostile act committed (MGT-058)
only if it learns who did it (MGT-064).
**Values.** `repActs.missionSuccessByPay` — bands `{ minUsd, gain }`, the highest band with `minUsd` ≤
mission pay applies: `[{ 0, 5 }, { 8000, 10 }, { 15001, 15 }]` (design draft; "$8,000 to $15,000" read as
inclusive) → data/management-rules.json;
`repActs.missionSuccess.min` — +5, `.max` — +15 (the design range; checks the table); `repActs.missionFailed`
— −5; `repActs.contractBroken` — −30 → data/management-rules.json
**Source.** design/management.md › Reputation › What changes reputation; › Contract terms

### [MGT-057] Friendly acts
**Rule.** Changes with the faction helped: join a fight on its side without a contract +5; rescue its
soldiers or VIP, or return its MIA/captured soldiers +10; sell it supplies it needs (fuel, ammunition,
medical) +1 per `repActs.sellSuppliesUsdPerPoint` of needed supplies sold in one sale (rounded down), at
least +1 and at most +3 per sale (`repActs.sellSupplies.min` / `.max`); Krug: keep a deal +5. Which supplies
a faction "needs" is STR (faction state).
**Values.** `repActs.joinFight` — +5; `repActs.rescue` — +10; `repActs.sellSuppliesUsdPerPoint` — $1,000;
`repActs.sellSupplies.min` — +1, `repActs.sellSupplies.max` — +3 (design draft); `repActs.krugKeepDeal` —
+5 → data/management-rules.json
**Source.** design/management.md › Reputation › What changes reputation

### [MGT-058] Hostile acts
**Rule.** Changes with the faction harmed: attack one of its squads that was not hostile to the player
−30; kill its soldiers −2 each, total per fight capped at −20; destroy or steal its cargo −10; capture one
of its VIPs −20; assassinate one of its VIPs −30; take one of its regions −15; Krug: break a deal or fight
in a Krug market −50 (see also GEN-009).
**Values.** `repActs.attackNonHostile` — −30; `repActs.killSoldier` — −2; `repActs.killCapPerFight` — −20;
`repActs.cargo` — −10; `repActs.captureVip` — −20; `repActs.assassinateVip` — −30; `repActs.takeRegion` — −15;
`repActs.krugBreak` — −50 → data/management-rules.json
**Source.** design/management.md › Reputation › What changes reputation

### [MGT-059] War crimes
**Rule.** Killing civilians or prisoners changes reputation by `repActs.warCrime` with every faction, and
civilian loyalty in that region collapses (applied by STR). Attribution (MGT-064) applies.
**Values.** `repActs.warCrime` — −20 → data/management-rules.json
**Source.** design/management.md › Reputation › What changes reputation

### [MGT-060] Act application order
**Rule.** For each attributed act (MGT-064): apply its change (MGT-056…MGT-059) to the faction it directly
affects, then clamp. No other faction's reputation changes from that act (no spill-over). The only act
that directly affects several factions is a war crime (MGT-059, every faction). Acts apply in the order
they are reported. A `reputationAct` management request names the act by its `repActs` key (`joinFight`,
`rescue`, `sellSupplies`, `krugKeepDeal`, `contractBroken`, `attackNonHostile`, `killSoldier`, `cargo`,
`captureVip`, `assassinateVip`, `takeRegion`, `krugBreak`, `warCrime`); mission success and failure arrive as
`missionOutcome` instead.
**Source.** design/management.md › Reputation (draft) (structure implied; ordering is a spec decision)

### [MGT-061] Spill-over to hostile and allied factions (removed)
**Rule.** Removed in design 8972470: the "Helping opposing factions" block is gone; an act changes
reputation only with the faction it directly affects (MGT-053).
**Source.** design/management.md › Reputation (draft) (block removed)

### [MGT-062] Krug exemption (removed)
**Rule.** Removed in design 8972470: with no spill-over (MGT-061 removed) there is nothing to exempt the
Krug from; Krug reputation changes only from acts that affect the Krug, like every faction (MGT-053).
**Source.** design/management.md › Reputation (draft) (block removed)

### [MGT-063] Rival PMCs follow their patrons (removed)
**Rule.** Removed in design 8972470: Varyag and Aegis no longer follow their patrons' reputation changes;
they change only from acts that affect them directly (MGT-053).
**Source.** design/management.md › Reputation (draft) (block removed)

### [MGT-064] Attribution
**Rule.** An act changes reputation with the affected faction only if at least one member of that faction
witnessed it and survived (reported by TAC/STR). Any member of that faction who took part in the fight and
survives it is a witness; sight of the act is not needed. Unwitnessed acts stay unattributed unless an Operation
dispute event (STR) assigns the blame, in which case the act is applied to the faction it names.
**Source.** design/management.md › Reputation › Attribution

## Base & meta progression

### [MGT-065] Acquisition paths
**Rule.** The PMC gains items, vehicles and services only by looting (MGT-035), purchasing (MGT-039,
MGT-040, MGT-067) or industry output (MGT-068). FOBs have no upgrades; nothing is crafted; there is no
research.
**Source.** design/management.md › Base & meta progression

### [MGT-066] FOBs
**Rule.** Every op starts and ends at an FOB (GEN-001). Each FOB offers a stash of its own, rest with slow
healing (TAC recovery), hiring (MGT-002) and a contract board (MGT-051). Stashes are per FOB, not shared:
items move between FOBs only by squad transport — a squad loads items from one FOB's stash into its
soldiers' containers and vehicle storage (DAT-008, DAT-025), travels, and unloads them at another FOB.
There is no instant transfer. Loot carried out (MGT-035), purchases at an FOB's location (MGT-039) and
plant deliveries (MGT-068) go to the stash of the FOB concerned. The player owns one FOB at campaign start;
more are bought in small and large cities (a `buyFob` request debits the city size's price; the new FOB is
usable after the STR delay) or taken over (STR). Operational range per FOB is STR. FOBs have no upkeep: an
FOB costs only its purchase price (design decision 2026-11-24).
**Values.** `fobPrices.smallCity` — $25,000; `fobPrices.largeCity` — $50,000 (design draft) →
data/management-rules.json; the 24-hour delay before a bought FOB can be used is STR (strategic actions).
Removed: FOB upkeep (`economy-rules.fobUpkeepPerDayUsd`).
**Status.** Draft
**Source.** design/management.md › Base & meta progression; design/strategic-actions.md › Trade, services, contracts and factions (Buy a new FOB)

### [MGT-067] Paid field services
**Rule.** Services bought with money in the field: hospital treatment in cities, repairs at mechanical
plants, fuel at gas stations and oil plants. Each debits `economy` and applies its effect (healing TAC,
repair ITM condition, fuel STR). Prices: hospital treatment `servicePrices.hospitalPerWoundUsd` per wound
treated; repairs at a mechanical plant `servicePrices.repairPerConditionPointUsd` per condition point
restored (weapon `condition`, DAT-014, or vehicle condition, DAT-029); fuel `servicePrices.fuelPerUnitUsd`
per fuel unit (DAT-024). A payment the balance cannot cover fails (MGT-070): the service is not given. A plant repair of a weapon brings its `condition` back to 100. A
weapon repair by a soldier in the field (not a paid service) raises the instance `condition` by
`weaponRepair.conditionPerHourPer10Technical` × floor(Technical ÷ 10) per hour of repair, capped at 100, ×
`repairFactor` with the Armourer perk; a field repair of a vehicle by a soldier with the Sapper perk restores × `vehicleRepairFactor` (MGT-009).
**Values.** `servicePrices.hospitalPerWoundUsd` — $300; `servicePrices.repairPerConditionPointUsd` — $20;
`servicePrices.fuelPerUnitUsd` — $50 (design draft) → data/management-rules.json; `weaponRepair.conditionPerHourPer10Technical` — 2 (design draft: +2 Condition per hour for every 10 points of
Technical) → data/management-rules.json
**Status.** Draft
**Source.** design/management.md › Base & meta progression

### [MGT-068] Industry deliveries
**Rule.** Every day (00:00 check, STR clock) each plant the PMC holds (a squad stationed there; control
is STR) delivers output to the nearest player FOB stash: oil plant → fuel; mechanical plant → spare parts
and vehicle repairs; chemical plant → medical supplies; arms plant → weapons and ammunition; mineral plant
→ medium income to `economy` plus a boost to the output of every other plant the PMC holds; hidden-city
complex (optional) → prototype items. An unguarded plant falls back to the region's controller (STR) and
stops delivering. Strategic sends each delivery as a `plantOutput` management request with `plantId`,
`fobId` (the receiving FOB, STR-015) and the `items` and/or `amountUsd` (the type's `dailyOutput`
`{ items [{ item, count }], amountUsd }` after STR-011); Management adds the items to that FOB's stash and
credits the amount (MGT-070); at each daily check it also sends
`dailyRollover` with `day` (STR-004).
**Values.** (design drafts) daily output: oil plant 20 fuel units; mechanical plant 10 kg spare parts;
chemical plant 5 medical kits; arms plant 2 weapons and 300 rounds; mineral plant $1,500 plus +10% per
mineral plant held to every other held plant's output, at most +30% → data/poi.json (`dailyOutput`,
`mineralModifier`, `mineralModifierMax`; owned by STR-011, STR-015, which compute the delivery). Which
items "medical kits", "weapons" and "rounds" are (item IDs, loads) — not set (design: not stated)
**Status.** open (item choice per delivery)
**Source.** design/management.md › Base & meta progression

### [MGT-069] FOB raids
**Rule.** Late game, enemy factions can raid an FOB (STR decides), which becomes a defence mission
(TAC). Consequences of losing an FOB (stash, soldiers resting there) are not designed. Left for a later
build (design: OPTIONAL).
**Status.** optional
**Source.** design/management.md › Base & meta progression

### [MGT-070] Economy ledger
**Rule.** `economy` holds the PMC's money balance and a list of debts. Each debt: creditor faction,
amount, origin (a Krug deal; a failed contract's advance is never a debt, MGT-048). Paying a debt's full
amount removes it (Krug: entry in Karsin's book, GEN-008). Every credit and debit is logged with game time.
The balance never goes below zero: a debit larger than the balance fails as a whole (nothing is paid, the
request returns `ok: false`); an op whose fees cannot be paid does not launch (MGT-005). Debts carry no interest or penalty
(design: not stated). The PMC's running costs and income use the shared economy rules (MGT-073); contract
pay is credited only on a `contractPayment` request from Strategic (MGT-047, STR-093). AI factions' money
is not in `economy`. The balance is published as `funds` in `management_view` (MGT-072).
**Values.** shared economy formulas → data/economy-rules.json (MGT-073)
**Source.** design/management.md › Contracts and missions › Contract terms; design/design.md › Factions & campaign › Leaders; design/strategic-layer.md › Squads and simulation (Faction funds (draft))

### [MGT-071] Campaign score
**Rule.** At campaign end (GEN-012) a score is computed from money, reputation and surviving soldiers:
`score = balanceUsd / scoreWeights.usdPerPoint + Σ over every non-player faction max(0, reputation) +
scoreWeights.perSurvivingSoldier × (soldiers with status active)`. Whether open debts are subtracted from
the balance is not stated (spec: not subtracted).
**Values.** `scoreWeights.usdPerPoint` — 1,000; `scoreWeights.perSurvivingSoldier` — 50 (design draft) →
data/management-rules.json
**Status.** Draft
**Source.** design/management.md › Base & meta progression

### [MGT-073] Shared economy rules for the PMC's running costs and income
**Rule.** The player's PMC's fees and income use the shared economy rules file (`data/economy-rules.json`,
the same file as the AI factions' funds, STR-092). Soldier fees are not recurring: they are booked once per
op, at launch (MGT-005). The only recurring item is plant income (MGT-068): FOBs (MGT-066) and vehicles have no
upkeep (a vehicle costs only its price, fuel and repairs, MGT-067; DAT-024) and there are no salaries.
Plant income and deliveries (`plantOutput`) are booked every `payIntervalHours` (daily, at the 00:00
`dailyRollover`). Each booking follows MGT-070.
**Values.** `payIntervalHours` — 24 (design draft) → data/economy-rules.json; fee per op by rank → data/recruitment.json (MGT-005);
plant output → data/poi.json (MGT-068). Removed: `fobUpkeepPerDayUsd`, `vehicleUpkeepPerDayFraction`.
**Source.** design/management.md › Soldiers & progression (Contracts & morale); › Base & meta progression (FOBs); design/data-definitions.md › Vehicles (draft) (Vehicle parameters, Cost)

## Interfaces

### [MGT-072] Management view
**Rule.** After applying each batch of management requests (and on load), Management produces
`management_view` (`spec/interfaces/management_view.schema.json`), the only way other modules read
Management-owned slices; consumer: modules/strategic. It holds, at game time `{ day, hour }`:
- `reputation`: per non-player faction ID, `{ value, standing }` — `value` from MGT-053, `standing` derived
  by MGT-054 (`hostile` … `trusted`). Strategic feeds it into `strategic_perception_view`
  `reputationWithPlayer`, world events, desperate measures and goals; SAI-013 uses `standing`.
- `contracts`: every contract that is `offered` or `signed`, plus those `ended` since the previous view,
  with `id`, `employer`, `targetFaction`, `status`, `endReason` (incl. `allFailed`), `disowned`,
  `deadline`, `pay`, `advance`, `missions[]` (`key`, `missionId`, `location`, `pay`, `outcome` `open` |
  `success` | `failure`). Strategic uses the signed ones for STR-093 payments and deadlines.
- `funds`: `{ balanceUsd, debtsUsd }` — the PMC's money balance (`economy`, MGT-070) and the sum of its
  open debts; both always present (`debtsUsd` 0 when there are none).
- `roster` (cleanup 2026-11-24): every soldier not `dead`, with `id`, `status`, `rank`, `morale`,
  `attributes`, `nerve`, `wounds` (`zoneHp`, `conditions`), `equipment` and `perks` (MGT-001) — what
  Strategic copies into `tactical_map_request` `units[]` (MGT-008, MGT-075, TAC-096) and uses for the
  VIP morale shock (STR-047), evasion (STR-024) and the pilot check (STR-034).
No other part of `roster` (callsign, service record, xp, deeds, fee discount), `unlocks` or `economy` is
published.
**Source.** design/management.md › Reputation (draft); › Contracts and missions › Contract terms; design/strategic-layer.md › Squads and simulation (Faction funds (draft)) (structure is a spec decision)

### [MGT-076] Management request handling
**Rule.** Payload fields (`management_requests`) and what Management does, for the request types whose
rule lives elsewhere (spec choice of the fields; cleanup 2026-11-24). Every debit follows MGT-070 (`ok:
false` and nothing paid when the balance cannot cover it); on `ok: true` for a payment to a faction,
Strategic credits that faction's funds (STR-092). Results list one entry per request.

| Type | Payload | Management does | Rule |
| --- | --- | --- | --- |
| `healingTick` | `squad`, `soldiers`, `hours`, `atFob` | heals the listed soldiers' `wounds` for `hours` by the recovery rule (best Medical of the squad, faster at an FOB; Trauma surgeon `fobHealFactor`) | STR-037, TAC recovery, MGT-009 |
| `contaminationTick` | `squad`, `soldiers`, `hpLost` | removes `hpLost` HP from each listed soldier's `wounds` (zone split: Open questions 51) | STR-097 |
| `moraleChange` | `moraleChanges` `[{ soldier, delta }]` | adds each `delta` to that soldier's `morale`, clamped 0–100 | STR-047, MGT-008 |
| `capitalIncome` | `amountUsd` | credits `economy` | STR-007, MGT-070 |
| `priceModifier` | `modifierId`, `target` (`fuel` \| `medical`), `factor`, optional `regions` | multiplies the prices of that target by `factor` (on top of MGT-039, MGT-040, MGT-067) while active; a later request with the same `modifierId` replaces it, `factor` 1 removes it. Spec reading: `fuel` = fuel items and `servicePrices.fuelPerUnitUsd`; `medical` = medical items and `servicePrices.hospitalPerWoundUsd` | STR-062, STR-063 |
| `payCompensation` | `faction`, `amountUsd` | debits `economy`; no reputation change (none designed) | STR-043 |
| `payOffBounty` | `faction`, `amountUsd` | debits `economy`; no reputation change (none designed) | STR-043, STR-064 |
| `payKrugPass` | `faction` (`krug`), `squad`, `amountUsd` | debits `economy` | STR-025 |
| `payKrugEscort` | `faction` (`krug`), `squad`, `amountUsd` | debits `economy` | STR-094, MGT-052 |
| `buyIntel` | `faction` (seller), `amountUsd` | debits `economy`; Strategic checks the standing (from `management_view`) and grants the intel on `ok: true` | STR-048 |
| `handOver` | `squad`, `contractId`, `missionKey`, optional `items` | removes the listed items from the squad's containers and vehicle storage (MGT-032); the mission's success arrives separately as `missionOutcome` | STR-040, MGT-044 |

Amounts are computed by Strategic from its own data (STR prices); Management checks only the balance.
Brokering a ceasefire (STR-099) has no cost and sends no request.
**Source.** design/strategic-actions.md › Trade, services, contracts and factions; design/world-events.md › Events (structure is a spec decision)

## Open questions

1. **Partly resolved (2026-11-24):** four draft tiers with hire price, fee per op (replacing the earlier salary per day; no renewals, 2026-11-24 b) and attribute range (MGT-002, MGT-003, MGT-005). Still open: price scaling within a tier, pools (tiers and candidates per pool, refresh), attribute distribution within the range. MGT-002, MGT-003, MGT-005, MGT-022: price tiers, hire price formula, attribute ranges per tier,
   salaries, pay interval and renewal terms are all unset.
2. **Resolved (2026-11-24):** morale per soldier; squad morale = average when the op forms (MGT-008). MGT-008: morale is "squad-wide", but squads are formed per op. Is morale stored per squad, per PMC, or
   reset when a squad is re-formed?
3. **Partly resolved (2026-11-24):** perks at skill 50 and 80 (one each per skill); Leadership comes from rank only; nerve 0–100, +2 per deployment survived, +1 per fight under fire (MGT-009, MGT-031). **Resolved (2026-11-24):** perk table drafted (MGT-009); nerve multiplies the suppression spread penalty and each casualty's morale loss by 1 − Nerve ÷ 200 (MGT-031). MGT-009, MGT-031: perk list and thresholds, nerve scale and growth; design open whether Leadership is a
   perk at a Nerve threshold.
4. **Resolved (2026-11-24):** every attribute within 5 of the top one is a candidate (MGT-013). MGT-013: the tie rule says "two attributes within 5 points"; spec generalizes to all attributes within 5
   of the top one. Confirm.
5. **Resolved (2026-11-24):** a used-up deed list keeps the current callsign, no suffix (MGT-015, MGT-019). MGT-015: the suffix rule is defined for generation lists; behaviour when an earned (deed) list is used up
   is not stated — spec applies the same suffix.
6. **Resolved (2026-11-24):** each deed once per soldier; milestones do not re-trigger (MGT-018). MGT-018: can a deed be earned more than once (e.g. repeated 50-tile kills)? Does "came home from 5 ops"
   at 50 ops (MGT-017) re-trigger?
7. **Partly resolved (2026-11-24):** 1 xp per use, 5/10/20 xp per point (below 50 / 50–80 / above 80); physical ±1 to ±5 per event; drift −1 per 14 days unused, floor = hire value (MGT-023…MGT-025). Still open: which events change physical attributes and in which direction. MGT-023, MGT-024, MGT-025: xp per use, growth curve between 50 and 80, physical change events and drift
   values unset.
8. **Resolved (design eb072a2):** the Tactical Layer owns the zone HP formula and its rounding (TAC-057);
   MGT-026…MGT-030 only name the attributes. MGT-028: rounding of zone HP not stated.
9. **Partly resolved (cleanup 2026-11-23):** the weight penalty is owned by TAC-027 (MGT-033 points to it;
   `management-rules.weightPenalty` removed). MGT-029: carry capacity formula (design: Open) unset.
10. **Resolved (2026-11-24):** anywhere out of battle, no skill needed (MGT-034). MGT-034: is modding restricted to FOBs and does it require Technical?
11. **Partly resolved (2026-11-24):** insurance 10% of value per op, 50% recovery after 3 days; scav loadout = used AK-74M, 2 magazines, tourniquet, $500; low-risk contract = retrieve and deliver away from the front, against no faction (MGT-036, MGT-038). Still open: condition of a "used" weapon; the distance that counts as away from the front. MGT-036, MGT-038: insurance terms; scav loadout contents; definition of "low-risk contract".
12. **Resolved (2026-11-24):** ±10% per day, at most ±30% from base (MGT-040). MGT-040: Krug price fluctuation rule.
13. **Resolved (2026-11-24):** 60% of cargo by weight, 6 hours handover, pay = low + (high − low) × average of the three scores 0–1 (MGT-044, MGT-046). MGT-044, MGT-046: "most of its cargo" fraction, capture-territory handover hours, pay scaling formula
    within bands.
14. **Resolved (design eb072a2):** the rest is paid per mission, each mission paying its share when its
    goal is met; a failed mission loses only its share and its reputation, and the contract goes on
    (MGT-047, MGT-048). Whether the advance is repaid in money or booked as debt stays as before (both
    allowed). **Superseded (2026-11-24 b):** the advance is kept, never repaid or booked as debt (Q48). MGT-047, MGT-048: is the remainder paid per mission or only when every mission of the contract
    succeeds? Does one failed mission fail the whole contract? Is the advance repaid in money or always
    booked as debt?
15. **Partly resolved (2026-11-24):** disowned contracts are paid but give no reputation; employer never admits the link; disown chance VDK 30%, others 10% (MGT-050). Still open: chance that an offer is deniable at all. MGT-050: deniability chance per employer; whether disowned contracts are paid.
16. **Resolved (2026-11-24):** the player's mission fails, with no pay and no reputation loss (MGT-052, MGT-056). MGT-052: does a rival completing the mission first count as failure (with −5 reputation)?
17. **Resolved (design 8972470):** Hostile now explicitly means no contracts or trade; Unfriendly means
    fewer contracts and higher prices (MGT-039, MGT-051, MGT-055). MGT-055: the design gives Unfriendly "no contracts or trade" but does not say Hostile also blocks them;
    spec assumes it does.
18. **Resolved (2026-11-24):** +5 under $8,000, +10 from $8,000 to $15,000, +15 above; +1 per $1,000 of needed supplies, at most +3 per sale (MGT-056, MGT-057). MGT-056: mapping from pay band to +5…+15; MGT-057: rule for +1…+3 supply sales.
19. **Resolved (design 8972470):** spill-over and patron follow are removed (MGT-061…MGT-063), so neither
    rounding nor stacking applies. MGT-061: rounding of spill-over (example implies toward zero, −5 and +2.5→+2). Does spill-over to a rival
    PMC (MGT-063) stack with spill-over from relations to the same PMC?
20. **Resolved (design 8972470):** with no spill-over an act changes only the faction it directly affects,
    so there is no cascade; acts apply in reported order (MGT-060). MGT-060: ordering and no-cascade rule is a spec decision; confirm.
21. **Resolved (2026-11-24):** any survivor of the fight; sight not required (MGT-064). MGT-064: who counts as a witness (sight, radio, any survivor of the fight)?
22. **Resolved (2026-11-24):** stash per FOB; items move between FOBs only by squad transport (MGT-066). MGT-066: is the stash per FOB or shared across FOBs? Transfer of items between FOBs?
23. **Partly resolved (2026-11-24):** drafts: hospital $300 per wound, repair $20 per condition point, fuel $50 per unit; plant outputs and mineral +10% per plant, max +30% (MGT-067, MGT-068); FOB raids optional (MGT-069). Still open: FOB loss consequences, which items a delivery contains. MGT-067, MGT-068, MGT-069: service prices, industry output amounts, mineral boost size (TBD), FOB loss
    consequences.
24. **Resolved (2026-11-24):** never negative; a payment the PMC cannot cover fails (MGT-070). Interest or penalties: not designed (none). MGT-070: can the balance go negative; interest or penalties on debts.
25. **Resolved (2026-11-24):** funds ÷ 1,000 + sum of positive reputations + 50 per surviving soldier (MGT-071). MGT-071: score formula.
26. **Resolved (2026-11-24):** Strategic rolls the fate from who holds the battle tile; MIA soldiers may return later (`soldierFate` `returned`, MGT-011). **Partly resolved (cleanup 2026-11-23):** the `soldierFate` management request (field `fate`) makes the
   final call; `battle_result` `leftMap` maps to `active` (MGT-001, MGT-011). Still open: can MIA soldiers
   return later? MGT-011: who decides between MIA, captured and dead for soldiers left behind (STR or TAC), and can MIA
    soldiers return later (implied by the "Revenant" deed)?
27. **Resolved (2026-11-24):** share of offers (50%), markup +25%, traders sell basic stock only (MGT-039, MGT-051, MGT-055). MGT-039, MGT-051: "fewer contracts and higher prices" at Unfriendly has no numbers; spec models them as
    `unfriendlyContractShare` and `unfriendlyPriceMarkup`. Confirm the model (share of offers vs. only
    some contract types) and whether Unfriendly traders sell only basic stock.
28. **Resolved (design eb072a2):** the contract fails at once and the player keeps the advance (MGT-048,
    STR-093). MGT-047, STR-093: what happens when the employer's funds cannot cover a payment due (late payment,
    debt owed to the player, contract fails)? VDK "late payments" suggests delay.
29. **Resolved (2026-11-24):** credited to the employer's funds (MGT-048, STR-093). **Superseded (2026-11-24 b):** there is no repayment (Q48). MGT-048: is a repaid advance credited back to the employer's funds (STR-093)?
30. **Resolved (2026-11-24):** all of them — salaries, FOB upkeep, vehicle upkeep, plant income (MGT-073). **Superseded (2026-11-24 b):** no salaries and no FOB upkeep; fees per op and plant income use the file, vehicle upkeep is the only recurring cost (MGT-073). MGT-005, MGT-070: which of the player's costs and incomes use the shared `data/economy-rules.json`
    formulas (salaries only, or FOB upkeep and plant income too)?
31. **Resolved (design eb072a2):** no mission needs the squad back at an FOB; the layer where the goal is
    met detects it, Strategic confirms it, and the pay is credited at the next strategic hour (MGT-044,
    MGT-047). MGT-044: "completed as soon as the goal is met" — for missions whose goal is a delivery or hand-over
    (retrieve_deliver, capture_vip), the goal is met only at the destination; for assassinate_vip it is the
    confirmed kill. Confirm that no mission needs the squad to return to an FOB.
32. **Resolved (2026-11-24):** in proportion to mission pay; rounding to the last mission (MGT-047). MGT-047: how is the rest split into mission shares — in proportion to each mission's pay (spec
    assumption), or equally? Where does the rounding difference go?
33. **Resolved (2026-11-24):** deadline passed with missions open, or every mission failed; employer default costs no reputation (MGT-048). MGT-048: when does a contract fail now that a failed mission no longer fails it — only when the
    deadline passes with missions open, or also when every mission has failed? On an employer default, does
    the player lose reputation with anyone?
34. **Resolved (2026-11-24):** a rival taking an offer removes it from the board (Strategic sends `contractEnded` reason `taken`); only signed contracts can become a race (MGT-052). MGT-052: when a rival PMC takes an offer on the player's board, which offers leave the board and which
    become a race? How does Management learn of it?
35. **Resolved (2026-11-24):** hired at a Krug market before the shipment leaves, priced by distance and danger in STR data (MGT-052, STR-094). MGT-052, STR-094: price of a Krug escort and where the player hires it.
36. **Resolved (cleanup 2026-11-23):** camelCase is canonical; every Values line, record field and goal name
    now uses the schema names (`moraleStart`, `advanceFraction`, `repActs.*`, `tieMargin`, `minValue`,
    `serviceNumber`, `supplyRun`, …). Mission type IDs stay lowercase record IDs of data/missions.json.
37. **Resolved (cleanup 2026-11-23):** one owner per value — pay interval `economy-rules.payIntervalHours`
    (`recruitment.salaryIntervalHours` removed); scav loadout `management-rules.scavLoadout`
    (`presets.priceUsd` removed); weight penalty TAC-027; low-reputation threshold = MGT-054
    `standingThresholds`. New fields: `recruitment.nonPayment` (MGT-005), `management-rules.lowRiskContract`
    (MGT-038), `management-rules.weaponRepair` (DAT-014, MGT-067).
38. **Resolved (cleanup 2026-11-23):** contracts are the `contractOffer` fields (`id`, `sourceGoal`,
    `intelLevel`, `boardLocation`, `targetFaction`, `reputationGain`, `reputationGate { better, sensitive }`)
    plus the derived `pay`, `advance`, `status` (MGT-042); Strategic hands offers over as a
    `contractOffer` management request, and Management publishes reputation, contracts and funds in
    `management_view` (MGT-072).
39. **Resolved (2026-11-24):** per mission completed, by that mission's pay band, computed by Management; the offer's `reputationGain` is not used for the amount (MGT-042, MGT-056). MGT-042, MGT-056: the offer carries one `reputationGain`, but MGT-056 picks the gain per mission by its
    pay band. Is `reputationGain` per contract (split over missions) or per mission completed (spec
    assumption)?
40. **Resolved (2026-11-24):** by `contractOffer` `missions[].key` (2026-11-23); `missionOutcome` and `management_view` name the mission by `key` (MGT-042, MGT-072). MGT-042, MGT-044: an offer's `missions[].missionId` is the mission type (x-ref missions), so two missions
    of the same type in one contract cannot be told apart in `missionOutcome`. A per-mission key inside the
    offer is needed (strategic_commands `contractOffer`).
41. **Resolved (2026-11-24):** intel needs alone can create offers (MGT-041, MGT-043). MGT-043: `intelNeeds` is a `sourceGoal` but no STR-018 squad goal. Confirm that intel-driven offers carry
    `sourceGoal: intelNeeds` without a squad goal behind them.
42. **Resolved (2026-11-24):** rank = hiring tier (Recruit, Regular, Veteran, Elite), rising one step when the
    average attribute climbs above 45 / 60 / 75, never dropping; the highest rank leads the op (ties: higher
    average attribute) and lends the others +0 / +2 / +4 / +6 to morale and reaction chance, battle only
    (MGT-074, MGT-075). MGT-009, MGT-031: "Leadership comes from rank only", but the design defines neither a soldier rank for
    the player's soldiers nor what Leadership does. Is rank the hiring tier (Recruit, Regular, Veteran,
    Elite — the same names STR uses for VIP morale loss by rank), and what is Leadership's effect?
43. **Resolved (2026-11-24):** no salaries: each soldier's fee per op (by rank) is paid at launch, no fee no
    launch; no renewals; the non-payment rule is obsolete (`recruitment.nonPayment`, `contractTermHours`,
    `salaryPerDayUsd` removed; MGT-005). MGT-005, MGT-070: "unpaid salaries follow the non-payment rule" — the rule itself is not defined
    (soldiers leave? morale loss? debt?). `recruitment.nonPayment` stays unset.
44. **Resolved (2026-11-24):** the tactical map request carries each soldier's morale and the battle result
    reports each soldier's morale at the end; Management stores the reported values (MGT-008). MGT-008: the battle result carries only `squadMorale`; spec applies the squad's change to every
    soldier who took part. Confirm, or should the battle result report morale per soldier?
45. **Resolved (2026-11-24):** FOBs have no upkeep, only a purchase price ($25,000 small city, $50,000 large
    city; MGT-066, MGT-073). **Resolved (2026-11-24, design c1333f3):** vehicle upkeep is dropped (MGT-073). MGT-066, MGT-073: FOB upkeep is named as a running cost but has no amount; consequence of an upkeep
    payment the balance cannot cover is not stated.
46. **Resolved (2026-11-24):** losses still apply, only gains stop; one disown roll per contract, when it
    first goes wrong (MGT-050). MGT-050: once a contract is disowned, do mission-failed and contract-broken losses with the employer
    still apply (spec: yes; only gains stop)? Is the disown roll made once per contract (spec) or per failure?
47. **Resolved (2026-11-24):** Strategic (STR-098) makes sure some faction always keeps at least one low-risk contract
    posted (MGT-038). MGT-038, MGT-041: Management never invents contracts, but a low-risk contract must always be on the
    board. Spec: Strategic must keep one posted; confirm the owner.
48. **Resolved (2026-11-24):** no repayment: a failed contract costs only reputation, the advance is kept and
    nothing is owed; `repayDebt` and the `repayment` result are removed (MGT-048). MGT-048: how does the player repay an advance debt? Spec adds a `repayDebt` management request
    (`contractId`, `amountUsd`) whose result names the `repayment` for Strategic to credit.
49. **Resolved (2026-11-24, design c1333f3):** the hired pilot is a normal roster soldier with Technical
    50+, paid the normal fee by rank; `hiredPilotFeePerOpUsd` and `launchOp` `hiredPilot` are removed (MGT-005).
    MGT-005, DAT-028: a hired helicopter pilot is "paid a fee per op like a soldier", but the design gives no
    amount and does not say whether the pilot is a roster soldier (with a rank and its fee) or a separate hire.
    Spec: a separate per-op hire, `recruitment.hiredPilotFeePerOpUsd`, not set.
50. **Resolved (2026-11-24, design c1333f3):** the 30% applies to the fee per op, for as long as they
    serve; the hire price is normal (MGT-001 `feeDiscount`, MGT-003, MGT-005). MGT-003, STR-065: refugee recruits come with a "fee 30% lower". With the fee-per-op model "fee" could mean
    the hire price or the fee per op. Spec: the hire price (the design calls them cheap recruits); the fee per
    op stays the rank's fee.
51. STR-097, MGT-076 (cleanup 2026-11-24): the strategic HP loss on contaminated tiles is given per soldier,
    but Management stores HP per body zone (`wounds.zoneHp`). Which zones lose it? Options: spread evenly
    over all zones; thorax only; a seeded zone per point. A zone reaching 0 HP has battle effects
    (TAC-059), so the choice changes outcomes.
52. MGT-010, MGT-076, STR-037 (cleanup 2026-11-24): `healingTick` applies "TAC recovery" (HP per hour from
    the squad's best Medical, faster at an FOB), but spec/tactical.md has no recovery-rate rule and the
    design gives no rate. Needed: the HP per hour (in and out of an FOB) and how it scales with Medical.

# Data definitions and items — spec [DAT / ITM]

Precise rules derived from `design/`. Each section: `### [DAT-NNN] Title`, then the rule
(inputs, outputs, formula, ranges), its design source, and `→ data/<table>.json` where a concrete value
lives in data. Edited only through `/update-spec`.

DAT defines the data profiles (fields, types, units, ranges); ITM defines the item categories and the
item-level rules from the item list. The rules that consume these values are in TAC (combat), STR (map,
travel, factions) and MGT (roster, economy, contracts, reputation). Faction IDs are those of GEN-004.

## Tables and conventions

### [DAT-001] Data tables for items and vehicles
**Rule.** All item-like definitions live in one table, `data/items.json`, an object keyed by record ID;
every record has a `kind` that selects its profile:

| `kind` | Profile | Section |
| --- | --- | --- |
| `weapon` | Weapon profile | DAT-011 |
| `mod` | Weapon mod profile | DAT-016 |
| `calibre` | Calibre profile | DAT-019 |
| `ammo` | Ammunition load profile | DAT-021 |
| `helmet` | Helmet | ITM-009 |
| `bodyArmour` | Body armour | ITM-011 |
| `vest` | Load-bearing vest | ITM-013 |
| `belt` | Battle belt | ITM-017 |
| `backpack` | Backpack | ITM-018 |
| `medical` | Medical item | ITM-019 |
| `barter` | Barter good | ITM-021 |
| `opItem` | Operation and faction item | ITM-025 |

Calibres and ammunition loads stay in `data/items.json` (not own tables): they are authored together with
the weapons in the item editor, ammo loads are carried and traded like any item, and one registry lookup
resolves every weapon → calibre → load reference. Vehicles are not items (they are bought, crewed and
moved on the strategic map) and live in their own table `data/vehicles.json` (proposed new table).
**Source.** design/design.md › Data definitions; design/item-list.md

### [DAT-002] Common item fields
**Rule.** Every record in `data/items.json` has:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `id` | string | — | unique; equals the record key | Stable reference used by all other data and state |
| `kind` | enum | — | DAT-001 list | Selects the profile |
| `name` | string | — | non-empty | Display name |
| `weightKg` | number | kg | ≥ 0 | Weight of one item. Required for every kind except `calibre` and `ammo` (ammo weight comes from the calibre's `roundWeightG`, DAT-019) |
| `valueUsd` | number | USD | ≥ 0 | Full trade/barter value. Optional; set for barter goods (ITM-021), otherwise not set (design: not stated) |
| `rarity` | enum | — | `common`, `uncommon`, `rare` | Loot roll weight class (ITM-024). Optional |
| `notes` | string | — | — | Display text only; no rule reads it |

Mechanical effects are always explicit fields; `notes` never carries a rule.
**Source.** design/design.md › Data definitions; design/item-list.md

### [DAT-003] Units
**Rule.** Weight in kg (`…Kg`), except cartridge weight in g (`roundWeightG`). Tactical distances in tiles
(1 tile ≈ 1.5 m, TAC). Strategic distances in regions. Durations: tactical in turns, strategic in whole
hours or days (STR clock). Money in USD. Percentages are stored as fractions 0–1 (`0.06` = 6%).
Multipliers are plain factors (`0.9` = ×0.9).
**Source.** design/design.md › Data definitions; › Tactical Layer › Movement; › Strategic Layer

### [DAT-004] Definitions versus instance state
**Rule.** `/data` holds definitions only; they are frozen at load and never changed by play. Per-instance
values live in the owning state slice and reference the definition by `id`: a gun's `condition` (DAT-014),
its fitted mods and loaded ammo; an armour piece's current durability; a medical item's remaining uses or
HP; the issuing faction or point of interest of per-faction items (ITM-025); a vehicle's fuel, storage
contents and damage (DAT-029). Owners: `roster`/`economy` (MGT) between ops, `battle` (TAC) in a fight,
`world` (STR) for items and vehicles left on the map.
**Source.** design/design.md › Data definitions (intro); › Weapon profile › State, not profile

## Soldier equipment slots

### [DAT-005] Seven equipment slots
**Rule.** Every soldier has exactly these slots:

| Slot | Accepts `kind` | Access tier | Effect in play |
| --- | --- | --- | --- |
| `weapon1` | `weapon` (any type) | — | Equipped weapon |
| `weapon2` | `weapon` (any type) | — | Second equipped weapon; switching weapon 1 ↔ 2 costs AP (TAC; Marksmanship, Agility, ergonomics) |
| `helmet` | `helmet` | — | Armour class for the head zone; may narrow hearing (ITM-010) |
| `bodyArmour` | `bodyArmour` | — | Armour class for the thorax zone; durability wears per hit (ITM-012) |
| `vest` | `vest`, or the plate carrier in `bodyArmour` (DAT-009) | quick | Item list with weight and type limits |
| `belt` | `belt` | quick | Item list with weight limit |
| `backpack` | `backpack` | slow | Item list with weight limit; can be dropped in combat (TAC) |

The loadout is part of the soldier record (MGT) and of the unit in `battle` (TAC).
**Status.** Draft (design: "Draft — not final").
**Source.** design/design.md › Data definitions › Soldier equipment slots (draft)

### [DAT-006] Access tiers
**Rule.** Items used from a quick container (vest, belt) cost their normal AP. Items used from the backpack
(slow) cost their normal AP plus a backpack surcharge (TAC-068), the same for every item. Applies to
magazines (reload), grenades and medical items.
**Values.** `backpackSurcharge` — 4 (draft) → data/tactical-rules.json (owned by TAC, TAC-068; replaces the
earlier name `backpackAccessSurchargeAp`).
**Source.** design/design.md › Data definitions › Soldier equipment slots (draft); › Medical system › Using medical items; design/tactical-actions.md › Medical, Gear and interaction

### [DAT-007] Everything carried counts toward weight
**Rule.** Carried weight = Σ `weightKg` of everything in the seven slots and in their containers, plus
`roundWeightG` / 1000 per loose or loaded round, including the containers' own `weightKg`. It feeds carry
capacity (MGT), stamina costs and sprint penalties (TAC).
**Source.** design/design.md › Data definitions › Soldier equipment slots (draft)

### [DAT-008] Container limits
**Rule.** A container (vest, plate carrier pouches, belt, backpack, vehicle storage) accepts an item only if
its total contents stay ≤ its `capacityKg`. Vests and plate carriers additionally cap the count per type
category (ITM-014). Weight limit and type limits both apply; neither replaces the other.
**Source.** design/design.md › Data definitions › Soldier equipment slots (draft) › Type limits; › Gear, loot & return › Inventory

### [DAT-009] Plate carrier fills two slots
**Rule.** A `bodyArmour` record with `fillsVestSlot: true` occupies both the `bodyArmour` and the `vest`
slot; its `pouches` act as the vest container. While it is worn, no separate vest can be equipped.
**Source.** design/design.md › Data definitions › Soldier equipment slots (draft) › Type limits; design/item-list.md › Body armour

### [DAT-010] Loot and death
**Rule.** Anything not in a slot or a soldier's containers stays on the tactical map when the battle ends;
anything in the vehicle's storage can be brought home. A dead soldier keeps everything in the seven slots
on the body until another soldier recovers it.
**Source.** design/design.md › Data definitions › Soldier equipment slots (draft) › Loot, Death

## Weapon profile

### [DAT-011] Weapon profile
**Rule.** A `kind: "weapon"` record has, in addition to DAT-002:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `weaponType` | enum | — | `pistol`, `shotgun`, `smg`, `assaultRifle`, `battleRifle`, `dmr`, `sniperRifle`, `lmg` | Animations, AI role (TAI), trader and loot categories |
| `calibre` | ID → items (`calibre`) | — | existing calibre | Cartridge fired; decides which ammo and magazines fit (DAT-020) and scales recoil |
| `fireModes` | array of (integer ≥ 1 or `"auto"`) | rounds per trigger action | non-empty, unique | DAT-012 |
| `magazineSize` | integer | rounds | ≥ 1 | Standard magazine capacity |
| `barrelMultiplier` | number | factor | > 0, around 1.0 (short < 1.0, long > 1.0) | Multiplies calibre damage; fixed, never changed by mods |
| `ergonomics` | integer | — | 1–100 | AP cost to ready, aim, reload (with Marksmanship, TAC) |
| `baseMoa` | number | game MoA | > 0 | Mechanical accuracy, DAT-013 |
| `weightKg` | number | kg | > 0 | Weight with standard magazine |
| `recoil` | integer | — | 1–100 | Base kick per shot; × calibre `recoilModifier` = effective recoil (TAC) |
| `modSlots` | array of enum | — | subset of `muzzle`, `stock`, `pistolGrip`, `magazine`, `optic`, `handguard` | Which mod slots exist; the barrel is not a slot |
| `action` | enum | — | `pump`, `bolt` | Optional descriptor from the item list; no rule uses it yet |
| `feedType` | enum | — | `pistol`, `boxMagazine`, `stripperClip`, `boltAction`, `belt`, `tube` | Selects the reload base AP (TAC-041); `tube` reloads per shell |
| `fireApCost` | integer | AP | ≥ 1 | Optional; overrides the weapon-type default fire AP (TAC-039) before fire-mode and ergonomics modifiers |

Mods change these values directly (DAT-016) except `barrelMultiplier` and `baseMoa`.
**Values.** `feedType` per weapon — not set (design: the item list gives no feed type per weapon) →
data/items.json; `fireApCost` — not set for any weapon (type defaults apply, TAC-039).
**Status.** Draft (design: "Draft — not final").
**Source.** design/design.md › Data definitions › Weapon profile (draft); design/item-list.md › Weapons; design/tactical-actions.md › Weapons (Fire, Reload)

### [DAT-012] Fire modes
**Rule.** Each entry of `fireModes` is one shot action: an integer n fires n rounds per trigger action
(1 = semi-auto, n > 1 = burst; the design's burst is 3 rounds); `"auto"` fires a full-auto burst. Rounds and
AP per shot action come from the selected mode; recoil builds within a burst (TAC). A weapon with one entry
has no mode switch. AP per shot action = weapon-type default or the weapon's `fireApCost` (DAT-011) + burst
or auto surcharge ± ergonomics (TAC-039).
**Values.** `burstRounds` — 3, `autoRounds` — 5, `burstApSurcharge` — 2, `autoApSurcharge` — 4,
`fireApByWeaponType` (all draft) → data/tactical-rules.json (owned by TAC, TAC-039).
**Source.** design/design.md › Data definitions › Weapon profile (draft) › Fire modes; design/tactical-actions.md › Weapons

### [DAT-013] Base MoA game scale
**Rule.** `baseMoa` is a game-scale accuracy, not real minutes of angle. 1 point ≈ 0.17 m spread width at
50 m and 0.33 m at 100 m (linear with distance); the cone width is where nearly all shots land.
Calibration: `baseMoa` 5 spreads over the thorax-plus-head target (0.83 m tall) at 50 m (≈ 33 tiles).
Total spread uses it as `baseMoa × ammo spreadModifier + shooter spread` (TAC hit model). Optics never
change `baseMoa`.
**Values.** `moaSpreadPer50m` — design 0.17 m per point → data/tactical-rules.json (owned by TAC).
**Source.** design/design.md › Data definitions › Weapon profile (draft) › Base MoA; › Tactical Layer › Hit model

### [DAT-014] Weapon condition
**Rule.** Every gun instance tracks `condition`, integer 0–100 (instance state, DAT-004). Wear raises jam
chance and spread (TAC); repair uses the Technical attribute (MGT). Condition is not part of the profile.
**Values.** wear per shot, jam curve, spread curve, repair rate — not set (design: Open) →
data/tactical-rules.json / data/management-rules.json.
**Status.** open
**Source.** design/design.md › Data definitions › Weapon profile (draft) › State, not profile

### [DAT-015] Mod slots and handguard sub-slots
**Rule.** Mod slots of a weapon are its `modSlots`. A fitted handguard decides which sub-slots exist:
`frontGrip` (0 or 1) and `tactical` (1 or 2). Removing the handguard removes its sub-slots and the mods in
them. Each slot holds at most one mod.
**Source.** design/design.md › Data definitions › Weapon profile (draft) › Mod slots; › How mods change the profile

### [DAT-016] Weapon mod profile
**Rule.** A `kind: "mod"` record has, in addition to DAT-002:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `slot` | enum | — | `muzzle`, `stock`, `pistolGrip`, `magazine`, `optic`, `handguard`, `frontGrip`, `tactical` | Slot it fits |
| `fits` | array of ID → items (`weapon`) | — | — | Weapons it fits (compatibility rule not stated in design) |
| `modifiers` | object | per key | see below | Changes to the weapon profile |
| `suppressor` | boolean | — | — | Muzzle only: shots count as suppressed for hearing (TAC gunshot noise) |
| `subSlots` | object `{ frontGrip: 0–1, tactical: 1–2 }` | — | — | Handguard only (DAT-015) |
| `module` | enum | — | `flashlight`, `laser` | Tactical only (DAT-017) |

Allowed `modifiers` keys per slot: muzzle — `recoil`, `flash`; stock, pistolGrip, frontGrip — `ergonomics`,
`recoil`; handguard — `ergonomics` (plus own `weightKg`); magazine — `magazineSize`, `reloadAp`; optic —
`shooterSpreadAtRange`. A fitted magazine mod replaces `magazineSize`; spare magazines carried in a vest or
belt are instances of magazine mods and count as magazines for type limits (ITM-014). The weapon's
effective weight = `weightKg` + Σ fitted mod `weightKg`.
**Values.** all mod values; whether modifiers add or multiply — not set (design: Open) → data/items.json.
**Status.** Draft; initial content: none in design/item-list.md (no mods listed).
**Source.** design/design.md › Data definitions › Weapon profile (draft) › How mods change the profile

### [DAT-017] Tactical modules
**Rule.** `flashlight`: at night restores the carrier's full day sight and spotting range (TAC time of
day), can blind enemies in its cone, and reveals the carrier. `laser`: reduces shooter spread for hip and
snap shots; visible to enemies.
**Values.** blind effect, laser spread reduction, reveal range — not set (design: Open) →
data/tactical-rules.json.
**Status.** open
**Source.** design/design.md › Data definitions › Weapon profile (draft) › Tactical modules

### [DAT-018] Suppressors and hearing
**Rule.** A weapon with a fitted mod with `suppressor: true` fires suppressed shots; hearing ranges for
suppressed and suppressed-subsonic shots are TAC gunshot-noise rules (ITM-007).
**Source.** design/design.md › Data definitions › Weapon profile (draft) › How mods change the profile; › Tactical Layer › Gunshot noise

## Calibre profile

### [DAT-019] Calibre profile
**Rule.** A `kind: "calibre"` record has (no `weightKg`):

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `designation` | string | — | unique among calibres | Cartridge name, e.g. `5.56×45 mm` |
| `damage` | number | HP | > 0 | Base damage per projectile at the muzzle with barrel multiplier 1.0 |
| `projectiles` | integer | count | ≥ 1 | 1 for bullets, several for buckshot; each traced separately |
| `recoilModifier` | number | factor | design: about 0.6–1.6 (item list goes down to 0.5) | Effective recoil = weapon `recoil` × this |
| `roundWeightG` | number | g | > 0 | Weight per cartridge |

A load may override `damage` and `projectiles` (ITM-008).
**Status.** Draft (design: "Draft — not final").
**Source.** design/design.md › Data definitions › Calibre profile (draft); design/item-list.md › Calibres

### [DAT-020] Calibre fit
**Rule.** A weapon accepts an ammo load or a magazine mod only if it references the same calibre ID
(weapon `calibre` = load `calibre` = magazine's weapon calibre).
**Source.** design/design.md › Data definitions › Calibre profile (draft) › Designation

## Ammunition load profile

### [DAT-021] Ammunition load profile
**Rule.** A `kind: "ammo"` record has (weight per round from the calibre):

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `calibre` | ID → items (`calibre`) | — | existing calibre | Cartridge this load belongs to |
| `ammoType` | enum | — | `fmj`, `ap`, `hp`, `subsonic`, `tracer`, `buckshot`, `slug` | DAT-022 |
| `damageModifier` | number | factor | > 0 | × calibre damage (ITM-004) |
| `falloff` | number | fraction | 0–1 | Share of muzzle damage lost over `falloffRangeTiles` |
| `falloffRangeTiles` | number | tiles | > 0 | Distance over which `falloff` is lost (linear, TAC) |
| `penetrationClass` | integer | class | 0–6 | Highest armour class defeated (ITM-006) |
| `subsonic` | boolean | — | — | Subsonic load (ITM-007) |
| `spreadModifier` | number | factor | > 0 | × weapon `baseMoa` (TAC hit model) |
| `tracer` | boolean | — | — | Less recoil spread in bursts; reveals the shooter |
| `bleedChanceModifier` | number | factor | > 0 | Optional; HP loads raise bleeding chance (TAC medical) |
| `damageOverride` | number | HP | > 0 | Optional, ITM-008 |
| `projectilesOverride` | integer | count | ≥ 1 | Optional, ITM-008 |

Each load carries its own values; the per-type values in DAT-022 are authoring defaults.
**Status.** Draft (design: "Draft — not final").
**Source.** design/design.md › Data definitions › Calibre profile (draft) › Ammo types; design/item-list.md › Ammunition

### [DAT-022] Ammo type defaults
**Rule.** The item editor pre-fills a new load from its `ammoType`:

| `ammoType` | `damageModifier` | `falloffRangeTiles` | `subsonic` | `spreadModifier` | Character |
| --- | --- | --- | --- | --- | --- |
| `fmj` | 1.0 | 15 | false | 1.0 | Baseline; cheap, common |
| `ap` | 0.9 | 18 | false | 1.0 | Penetration class +1 to +2 over FMJ; expensive, rare |
| `hp` | 1.25 | 12 | false | 1.0 | Low penetration class; higher bleeding chance |
| `subsonic` | 0.8 | 10 | true | 1.1 | Lower penetration class; near-silent with a suppressor |
| `tracer` | 1.0 | 15 | false | 1.0 | As FMJ; `tracer: true` |
| `buckshot` | 1.0 | 15 | false | 1.0 | 8 pellets; strong up close, falls off fast |
| `slug` | 1.0 | 15 | false | 0.5 | One heavy projectile |

**Values.** the table above — design placeholders → data/items.json (editor defaults; stored per load).
**Status.** Draft (falloff ranges marked placeholder).
**Source.** design/design.md › Data definitions › Calibre profile (draft) › Ammo types; design/item-list.md › Ammunition

### [DAT-023] Per-shot inputs
**Rule.** Data feeding the TAC per-shot rules: muzzle damage = (load `damageOverride` or calibre
`damage`) × load `damageModifier` × weapon `barrelMultiplier`; damage at distance uses load `falloff`,
`falloffRangeTiles` and the floor of ITM-005; projectiles per round = load `projectilesOverride` or calibre
`projectiles`; penetration class = load `penetrationClass`; effective recoil = weapon `recoil` (after mods)
× calibre `recoilModifier`. Formulas are owned by TAC.
**Source.** design/design.md › Tactical Layer › Derived per shot (draft); › Data definitions › Calibre profile (draft)

## Vehicles

### [DAT-024] Vehicle profile
**Rule.** `data/vehicles.json` (proposed new table), object keyed by ID; each record:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `id` | string | — | unique; equals key | — |
| `name` | string | — | non-empty | Display name |
| `vehicleType` | enum | — | `ground`, `helicopter` | — |
| `costUsd` | number | USD | > 0 | Purchase price; upkeep (fuel, repairs) scales with it |
| `seats` | integer | soldiers | ≥ 1 | Max squad size; for helicopters includes the pilot |
| `storageKg` | number | kg | ≥ 0 | One storage list limited by weight (DAT-025) |
| `fuelRangeRegions` | integer | regions | ≥ 1 | Regions travelled on a full tank |
| `offRoad` | enum | — | `poor`, `good`, `veryGood`, `ignoresTerrain` | Lowers travel time in steppe and woods (STR); helicopters `ignoresTerrain` |
| `armourClass` | integer or null | class | 1–6 or null | Passenger protection in road encounters; null = none |
| `mineProtection` | boolean | — | — | MRAP |
| `noise` | enum | — | `low`, `medium`, `high`, `veryHigh`, `extreme` | How far away factions notice it (STR) |
| `profile` | enum | — | `civilian`, `military` | Civilian draws less attention at checkpoints (STR) |
| `features` | array of enum | — | DAT-026 | Special abilities |
| `availability` | object | — | DAT-027 | Where and to whom it is sold |
| `requiresPilot` | boolean | — | — | Helicopters: DAT-028 |

**Values.** upkeep scaling factor, noise → notice distance, off-road → travel time — not set (design:
Open) → data/vehicles.json / STR tables.
Initial content: design/design.md › Data definitions › Vehicles (14 vehicles).
**Status.** Draft (design: "Draft — not final").
**Source.** design/design.md › Data definitions › Vehicles (draft) › Vehicle parameters

### [DAT-025] A squad on the map is its vehicle
**Rule.** A strategic squad has exactly one vehicle; `seats` caps its soldiers (plus any VIP seat a mission
takes, MGT). Vehicles are not upgraded. Storage is one item list ≤ `storageKg` holding supplies
(ammunition, fuel cans, medical supplies, spare parts) and loot alike; soldiers restock from it between
engagements. Several vehicles = several squads that can run ops at the same time.
**Source.** design/design.md › Data definitions › Vehicles (draft)

### [DAT-026] Vehicle features
**Rule.** `features` enum and effect owner:

| Feature | Effect | Owner |
| --- | --- | --- |
| `easyRepair` | Cheap to repair | MGT |
| `repairAnywhere` | Repairable anywhere, not only at mechanical plants | MGT |
| `ambulance` | Wounded recover while travelling | MGT |
| `weaponMount` | Fights in road encounters, draws attention | STR |
| `amphibious` | Crosses water regions | STR |
| `heavyMachineGun` | Heavy machine gun in encounters | STR |
| `doorGun` | Door gun in encounters | STR |
| `noticedByAll` | Every faction notices it | STR |
| `heavyLift` | Needed for big hauls from hidden cities (optional feature) | STR |

"Inconspicuous", "rugged", "reliable", "longest range", "largest storage" are descriptions covered by
other fields and get no feature.
**Values.** repair cost reduction, recovery rate, weapon strength — not set (design: Open) → data/vehicles.json.
**Status.** open
**Source.** design/design.md › Data definitions › Vehicles (draft) › Vehicles table

### [DAT-027] Vehicle availability
**Rule.** `availability = { where: array of enum (largeCity, mechanicalPlant, krugMarket), standing:
null or { factions: array of faction ID, minStanding: enum (friendly, trusted) } }`. A vehicle is offered
where listed; with `standing` set it is sold only to a PMC with that standing with one of the listed
factions, or through the Krug. At campaign start the player buys the first vehicle from the starting
budget; only the cheapest few are affordable (MGT economy).
**Values.** standing level per restricted vehicle — not set (design: "high standing") → data/vehicles.json.
**Source.** design/design.md › Data definitions › Vehicles (draft) › Buying and selling, Start; › Management › Reputation › Standing

### [DAT-028] Helicopter data
**Rule.** `vehicleType: "helicopter"` implies: travel 1 hour per region over any terrain incl. water;
landing on any open, non-water tile; one seat is the pilot, who needs Technical ≥ `pilotTechnicalMin` or
is a hired pilot on salary; refuel only at FOBs and oil plants; noticed by every faction in range; a downed
helicopter becomes a crash site and starts an emergency op (STR). Hidden cities are reachable only this way
(optional feature).
**Values.** `pilotTechnicalMin` — design 50 → data/vehicles.json; `hoursPerRegion` — design 1 →
data/vehicles.json.
**Source.** design/design.md › Data definitions › Vehicles (draft) › Helicopters (draft)

### [DAT-029] Vehicle instance state and loss
**Rule.** Each owned vehicle instance tracks fuel, storage contents and condition (owner: MGT; on the map:
STR). A vehicle left behind on a failed op can be destroyed, captured or recovered later (STR).
**Status.** open
**Source.** design/design.md › Data definitions › Vehicles (draft) › Loss

## Weapons

### [ITM-001] Weapon items
**Rule.** Weapons are `kind: "weapon"` records (DAT-011). The item-list type "Shotgun (pump)" maps to
`weaponType: shotgun, action: pump`; "Sniper rifle (bolt)" to `sniperRifle, action: bolt`.
Initial content: design/item-list.md › Weapons (18 weapons).
**Source.** design/item-list.md › Weapons

## Calibres

### [ITM-002] Calibre items
**Rule.** Calibres are `kind: "calibre"` records (DAT-019); damage is per projectile at the muzzle with
barrel multiplier 1.0. The 12 gauge record holds the buckshot values (`damage` 25, `projectiles` 8); the
slug load overrides them (ITM-008).
Initial content: design/item-list.md › Calibres (8 calibres).
**Source.** design/item-list.md › Calibres

## Ammunition

### [ITM-003] Ammunition load items
**Rule.** Every calibre × ammo type combination in the item list is one `kind: "ammo"` record (DAT-021).
Ammunition is carried as rounds (loose or in magazines); one round weighs the calibre's `roundWeightG`.
Initial content: design/item-list.md › Ammunition (30 loads); `spreadModifier` from DAT-022 (the item list
gives no per-load spread).
**Source.** design/item-list.md › Ammunition

### [ITM-004] Standard damage modifiers
**Rule.** A load's `damageModifier` is the standard modifier of its ammo type unless the item editor sets
otherwise: FMJ 1.0, AP 0.9, HP 1.25, Subsonic 0.8, Tracer 1.0, Buckshot 1.0, Slug 1.0.
**Values.** as listed — design placeholders → data/items.json.
**Source.** design/item-list.md › Ammunition

### [ITM-005] Falloff floor
**Rule.** Damage at distance never drops below `falloffFloor` × muzzle damage (TAC per-shot rule).
**Values.** `falloffFloor` — design 0.10 → data/tactical-rules.json (owned by TAC).
**Source.** design/item-list.md › Ammunition; design/design.md › Tactical Layer › Derived per shot (draft)

### [ITM-006] Penetration class
**Rule.** `penetrationClass` is the highest armour class the round defeats; 0 = unarmoured targets only.
It comes from the load alone and never changes with distance or barrel length.
**Source.** design/item-list.md › Ammunition; design/design.md › Tactical Layer › Derived per shot (draft)

### [ITM-007] Subsonic through a suppressor
**Rule.** A shot with a `subsonic: true` load from a suppressed weapon is heard only within
`subsonicSuppressedHearingTiles` (TAC gunshot noise; halved by a helmet hearing penalty, ITM-010).
`subsonic` may be true by nature of the calibre (9×18 mm loads).
**Values.** `subsonicSuppressedHearingTiles` — design 6 → data/tactical-rules.json (owned by TAC).
**Source.** design/item-list.md › Ammunition; design/design.md › Tactical Layer › Gunshot noise

### [ITM-008] Load-specific damage and projectiles
**Rule.** If a load sets `damageOverride` / `projectilesOverride`, they replace the calibre's `damage` /
`projectiles` for that load. Used for 12 gauge: slug = 90 damage, 1 projectile.
**Values.** slug `damageOverride` 90, `projectilesOverride` 1 → data/items.json.
**Source.** design/item-list.md › Calibres (12 gauge row)

## Helmets

### [ITM-009] Helmet items
**Rule.** `kind: "helmet"` adds:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `armourClass` | integer | class | 1–6 | Protects the head zone (TAC) |
| `durability` | number | points | > 0 | Maximum durability (ITM-012) |
| `hearingPenalty` | boolean | — | — | ITM-010 |
| `visionConeDeg` | number | degrees | > 0 | Optional; replaces the default 120° cone (TAC) |
| `nightVisionMount` | boolean | — | — | Mounts for night vision |

Initial content: design/item-list.md › Helmets (5 helmets).
**Source.** design/item-list.md › Helmets

### [ITM-010] Helmet hearing and vision
**Rule.** A helmet with `hearingPenalty: true` halves the suppressed hearing ranges for its wearer (TAC
gunshot noise). `visionConeDeg` (Altyn with visor: 90) narrows the wearer's vision cone.
**Values.** Altyn `visionConeDeg` 90 → data/items.json; hearing factor 0.5 → data/tactical-rules.json.
**Source.** design/item-list.md › Helmets; design/design.md › Tactical Layer › Gunshot noise

## Body armour

### [ITM-011] Body armour items
**Rule.** `kind: "bodyArmour"` adds:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `armourClass` | integer | class | 1–6 | Protects the thorax zone (TAC) |
| `durability` | number | points | > 0 | Maximum durability |
| `fillsVestSlot` | boolean | — | — | Plate carrier (DAT-009) |
| `pouches` | object or null | — | — | Required if `fillsVestSlot`: `{ capacityKg, maxMagazines, maxGrenades, maxMedical, maxOther }` (ITM-014) |
| `durabilityLossModifier` | number | factor | > 0 | Optional; ceramic plates lose durability fast |
| `apPenalty`, `staminaPenalty` | number | AP / stamina | ≥ 0 | Optional; heavy assault armour |
| `concealable` | boolean | — | — | Soft armour vest |

Initial content: design/item-list.md › Body armour (6 items).
**Values.** ceramic `durabilityLossModifier`, heavy armour penalties — not set (design: "fast", "large") →
data/items.json.
**Source.** design/item-list.md › Body armour

### [ITM-012] Armour durability
**Rule.** Current durability is instance state, starting at `durability`; it wears with each hit; armour
condition % = current / max and drives the TAC penetration rule; at 0 it no longer protects.
**Values.** durability loss per hit — not set (design: Open) → data/tactical-rules.json.
**Status.** open
**Source.** design/design.md › Data definitions › Soldier equipment slots (draft); › Tactical Layer › Derived per shot (draft)

## Load-bearing vests

### [ITM-013] Vest items
**Rule.** `kind: "vest"` adds `capacityKg` (number > 0), `maxMagazines`, `maxGrenades`, `maxMedical`,
`maxOther` (integers ≥ 0) (own weight is `weightKg`), `quiet` (boolean; no rule
yet).
Initial content: design/item-list.md › Load-bearing vests (4 vests).
**Source.** design/item-list.md › Load-bearing vests

### [ITM-014] Pouch type limits
**Rule.** Every item placed in a vest or plate-carrier pouch counts in exactly one type category:
`magazine` (magazine mods, DAT-016), `grenade`, `medical` (`kind: medical`), `other` (everything else).
The count per category must stay ≤ its `max…` value, in addition to `capacityKg`.
**Source.** design/item-list.md › Load-bearing vests; design/design.md › Data definitions › Soldier equipment slots (draft) › Type limits

### [ITM-015] Other items
**Rule.** `other` covers barter goods, operation and faction items and small tools — everything not a
magazine, grenade or medical item.
**Source.** design/item-list.md › Load-bearing vests

### [ITM-016] Pouch item weight limit
**Rule.** Only items with `weightKg` ≤ `pouchItemMaxKg` fit in a vest or plate-carrier pouch; heavier items
go in a backpack (or vehicle storage).
**Values.** `pouchItemMaxKg` — design 1 kg → data/items.json (table-level constant; see Open questions).
**Source.** design/item-list.md › Load-bearing vests

## Battle belts

### [ITM-017] Battle belt items
**Rule.** `kind: "belt"` adds `capacityKg` (number > 0), `holsters` (integer ≥ 0); own weight is `weightKg`. Belts have
quick access (DAT-006) and only a weight limit.
Initial content: design/item-list.md › Battle belts (3 belts).
**Status.** open (holster meaning)
**Source.** design/item-list.md › Battle belts

## Backpacks

### [ITM-018] Backpack items
**Rule.** `kind: "backpack"` adds `capacityKg` (number > 0; own weight is `weightKg`), `extraAccessAp` (optional
number ≥ 0; on top of the backpack surcharge, DAT-006), `noSprint` (boolean; no sprinting while worn).
Initial content: design/item-list.md › Backpacks (4 backpacks).
**Values.** duffel bag `extraAccessAp` — not set (design: "extra AP") → data/items.json.
**Source.** design/item-list.md › Backpacks

## Medical items

### [ITM-019] Medical items
**Rule.** `kind: "medical"` adds:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `treats` | array of enum | — | `lightBleeding`, `heavyBleeding`, `fracture`, `pain`, `hp`, `limbAtZeroHp` | Conditions it fixes (TAC medical) |
| `zones` | array of enum | — | `head`, `thorax`, `leftArm`, `rightArm`, `leftLeg`, `rightLeg` | Zones it can treat; default all |
| `apCost` | integer | AP | ≥ 1 | Base AP before Medical modifiers (TAC) |
| `uses` | integer or null | uses | ≥ 1 | Uses per item; null when `hpPool` is set |
| `hpPool` | number | HP | > 0 | Total HP restorable (IFAK, medkit) |
| `hpPerUseMax` | number | HP | > 0 | Optional cap per use |
| `durationTurns` | integer | turns | ≥ 1 | Optional; effect duration (painkillers) |
| `restoresToHp` | number | HP | ≥ 1 | Optional; surgical kit sets a 0-HP limb to this |
| `causesPain` | boolean | — | — | Tourniquet |
| `requiresMedical` | integer | attribute | 1–100 | Optional minimum Medical |
| `backpackOnly` | boolean | — | — | Can be carried only in a backpack (medkit) |

Initial content: design/item-list.md › Medical items (8 items).
**Source.** design/item-list.md › Medical items; design/design.md › Tactical Layer › Medical system (draft)

### [ITM-020] Medical item restrictions
**Rule.** Tourniquet treats heavy bleeding on arms and legs only. Hemostatic dressing treats heavy
bleeding in any zone (light and quick); the medkit also stops heavy bleeding in any zone, so neither is
exclusive. IFAK restores up to `hpPerUseMax` per use from its pool. Painkillers mask pain for
`durationTurns`. Surgical kit needs Medical ≥ `requiresMedical` and brings an arm or leg at 0 HP back to
`restoresToHp`. Medkit is `backpackOnly`.
**Values.** IFAK `hpPool` 60, `hpPerUseMax` 15; medkit `hpPool` 300; painkillers `uses` 4,
`durationTurns` 10; surgical kit `uses` 3, `requiresMedical` 40, `restoresToHp` 1 → data/items.json.
**Source.** design/item-list.md › Medical items

## Barter goods

### [ITM-021] Barter goods
**Rule.** `kind: "barter"`: no combat use; sold for money or traded for gear. Requires `weightKg`,
`valueUsd` (full barter value), `rarity`, `foundIn` (array of loot location tags, ITM-024) and
`barterClass` (enum `tobacco`, `alcohol`, `valuable`, `general`; drives ITM-022). Optional `contains`
(array of `{ item: ID → items, chance: 0–1 }`): searching the item may yield another item (old laptop →
hard drive with data, 0.10).
Initial content: design/item-list.md › Barter goods (23 goods). `barterClass`: cigarettes → tobacco;
vodka → alcohol; wristwatch, foreign banknotes, painted icon, wedding ring, gold chain → valuable; rest
general.
**Source.** design/item-list.md › Barter goods; › Operation and faction items (hard drive)

### [ITM-022] Trader buy rates
**Rule.** Selling a barter good pays `valueUsd × rate`: city traders `cityBarterRate`; Krug markets
`krugBarterRate`, or `krugPremiumRate` for `barterClass` tobacco, alcohol or valuable.
**Values.** `cityBarterRate` — design 0.5; `krugBarterRate` — 0.7; `krugPremiumRate` — 1.0 →
data/traders.json.
**Source.** design/item-list.md › Barter goods › Trading rules

### [ITM-023] Daily barter deals
**Rule.** Each trader offers between `barterDealsMin` and `barterDealsMax` barter deals per day (seeded
roll at the 00:00 daily tick, STR): one gear item for a list of goods, goods counted at 100% of
`valueUsd`. Barter deals are the only source of some rare gear at a trader; deals refresh at the daily tick.
**Values.** `barterDealsMin` — design 1; `barterDealsMax` — 3; `barterDealValueRate` — 1.0; which gear is
barter-only — not set (design: Open) → data/traders.json.
**Source.** design/item-list.md › Barter goods › Trading rules

### [ITM-024] Loot rarity
**Rule.** Loot rolls (seeded) pick rarity by weight: common, uncommon, rare. Rare goods appear only in
the location tags listed in `rareLocations`. An item can be rolled only at a location whose tag is in its
`foundIn`.
**Values.** rarity weights — design common 60 / uncommon 30 / rare 10; `rareLocations` — design
apartments, safes, churches, bodies; location tag list → data/loot.json (proposed new table).
**Source.** design/item-list.md › Barter goods › Trading rules

## Operation and faction items

### [ITM-025] Operation and faction item fields
**Rule.** `kind: "opItem"` adds:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `foundIn` | array of string | — | loot location tags | Where it is found (bodies by role, POIs) |
| `perFaction` | boolean | — | — | Instance carries `faction` (ID → GEN-004) — dog tags, checkpoint pass, field orders, radio, codebook, Krug marker |
| `perPoi` | boolean | — | — | Instance carries a point-of-interest ID (POI key) |
| `opEffect` | object or null | — | ITM-026 | Use during operations |
| `handIn` | array of hand-in entries | — | ITM-028 | Rewards per receiver |

Initial content: design/item-list.md › Operation and faction items (14 items).
**Source.** design/item-list.md › Operation and faction items

### [ITM-026] Operation effects
**Rule.** `opEffect = { type: enum, …params }`:

| `type` | Item | Effect (rule owner) | Params (design values) |
| --- | --- | --- | --- |
| `revealSquadPlan` | Field orders | Read: shows that squad's goal and route (STR intel) | `durationHours` 72 |
| `revealAdjacentSquads` | Encrypted radio | Carried by a squad: shows that faction's squads within range (STR) | `rangeRegions` 1, `durationDays` 7 |
| `extendRadio` | Codebook | With an encrypted radio of the same faction: extends it (STR) | `rangeRegions` 2, `durationDays` 14 |
| `checkpointPass` | Checkpoint pass | That faction's checkpoints let the squad pass without an encounter while standing > threshold (STR) | `durationDays` 7, `minReputation` −50 (exclusive) |
| `demolition` | Demolition charge | Destroys a wall or vehicle; required for sabotage objectives (TAC/MGT missions) | — |
| `cutLock` | Bolt cutters | Opens locked gates and containers silently (TAC) | `apCost` 10 |
| `poiKey` | POI key | Opens the locked rooms of its point of interest (TAC) | — |
| `restockMedical` | Medical supply crate | Restocks a squad once (MGT) | 4 bandages, 2 tourniquets |
| `restockAmmo` | Ammunition crate | Restocks a squad's loose ammo once (MGT) | — |

Items without a row have no operation use.
**Values.** params as listed → data/items.json.
**Source.** design/item-list.md › Operation and faction items

### [ITM-027] Hand-in action
**Rule.** A hand-in is one strategic player action at a point of interest held by the receiving faction,
or at a Krug market when the receiver is the Krug. It consumes the item.
**Values.** hand-in duration — not set (design: Open) → STR strategic actions table.
**Source.** design/item-list.md › Operation and faction items; design/strategic-actions.md

### [ITM-028] Hand-in rewards
**Rule.** A hand-in entry is `{ receiver, moneyUsd?, reputation?, dailyCap?, effect? }`, where `receiver` is
one of: `issuingFaction` (the item's own faction), `enemiesOfIssuer` (factions hostile to the issuer,
relation ≤ −50, GEN-007), a fixed list of faction IDs, `rivalOfOwningPmc`, `plantHolder` (faction holding a
plant), `cityHolder`, `resistanceGroup`. `dailyCap` limits how many count per day. `effect` covers extras:
plant output +25% for 7 days (plant spare parts), resistance group lasts 7 days longer (ammunition
crate), resistance group standing (crates). Selling a Krug marker to anyone but the Krug costs Krug
standing if a Krug member survives to report it.
**Values.** all money, reputation, caps and effect values from design/item-list.md › Operation and faction
items (e.g. dog tags: issuer +1 reputation each, `dailyCap` 5; enemies $50 each) → data/items.json.
**Source.** design/item-list.md › Operation and faction items

### [ITM-029] Hand-in reputation and attribution
**Rule.** Reputation from a hand-in is applied through the MGT reputation change (`applyRep`) as a friendly
act toward the receiver only, with no spillover to its allies or enemies (MGT reputation). A hand-in is never attributed to
the faction it hurts; only a survivor at the scene of the original loot can report it, like any hostile act
(MGT attribution).
**Source.** design/item-list.md › Operation and faction items › Hand-in rules

### [ITM-030] Faction items in containers
**Rule.** Operation and faction items count toward carried weight and use the `other` type limit in vests
and plate carriers (ITM-014); items above the pouch weight limit (ITM-016) need a backpack.
**Source.** design/item-list.md › Operation and faction items › Hand-in rules; › Load-bearing vests

## Open questions

1. **Resolved (design 8972470):** burst 3 rounds +2 AP, full auto 5 rounds +4 AP on top of the weapon-type default fire AP (draft), per-weapon override `fireApCost`. DAT-012 — Rounds fired by an `"auto"` fire mode and AP per shot action per mode are not designed.
2. DAT-014 — Weapon condition: wear per shot, jam chance and spread curves, repair rate are Open.
3. DAT-016 — No weapon mods exist in the item list; mod compatibility (`fits` per weapon, per type or per
   calibre), modifier arithmetic (add vs multiply) and the meaning of the muzzle `flash` value are not stated.
4. DAT-016/ITM-014 — Are spare magazines separate items (magazine mods) with loaded rounds tracked per
   magazine, or abstract? The ammunition crate restocks "loose ammo", which suggests loose rounds exist too.
5. ITM-014 — Grenades have a type limit but no grenade items or grenade profile exist in the design.
6. DAT-019 — Design says recoil modifier "about ×0.6–×1.6", the item list uses ×0.5 for 9×18 mm.
7. DAT-019/ITM-008 — The calibre profile has one damage and projectile count, but 12 gauge differs per
   load; this spec adds `damageOverride`/`projectilesOverride` on loads. Confirm.
8. DAT-021 — HP "higher bleeding chance" and tracer "less recoil spread in bursts; reveals the shooter" have
   no values; AP "+1 to +2 penetration" is only a description (per-load classes are given).
9. DAT-022 — Per-load spread modifiers are missing in the item list; spec uses the type defaults.
10. DAT-002 — No purchase prices for weapons, armour, gear, medical or operation items; only barter goods
    have `valueUsd`. Trader prices are needed for MGT trading.
11. ITM-019 — Medical items have no weights; medkit "large; backpack item" cannot be checked against the
    1 kg pouch rule. Medkit HP per use is not stated.
12. **Resolved (design 8972470):** the note now reads "Light and quick; the medkit also stops heavy bleeding in any zone" — both treat heavy bleeding in every zone. ITM-020 — Hemostatic dressing is called "the only fix for thorax and head bleeding in the field", yet the
    medkit also stops heavy bleeding.
13. ITM-017 — Meaning of the battle-belt holster (does weapon 2 or a pistol sit there, does it change swap
    AP?). Does the 1 kg pouch rule (ITM-016) and type limits apply to belts? The item list names only vests
    and plate carriers.
14. ITM-011 — Values for ceramic fast durability loss, heavy assault armour AP/stamina penalties; whether
    "concealable" (soft armour) and "quiet" (recon rig) have a rule.
15. ITM-009 — "Mounts for night vision": no night-vision item exists. "Visor covers the face": no face zone.
16. ITM-012 — Durability loss per hit is Open.
17. ITM-024 — Painted icon (rare) is found in "old houses", which is not in the rare-only location list.
    The full loot location tag list is not designed.
18. ITM-028 — "Its enemies" for hand-ins: relation ≤ −50 (spec choice) or any faction at war with it?
    "Eastern/western standing" for vehicles (DAT-027): which factions count?
19. DAT-027 — Standing level for restricted vehicles ("high standing"); whether the civilian R44 needs it.
20. DAT-026/DAT-024 — Vehicle armour "Light (cockpit)" (Mi-8) is not an armour class; upkeep scaling,
    noise → notice distance and feature effect values are not set. Fuel capacity units (fuel cans) unclear.
21. ITM-016 — `pouchItemMaxKg` is a global constant inside data/items.json; a table-level constants record
    or a rules table may be preferable.
22. DAT-006/DAT-013/ITM-005/ITM-007/ITM-010/ITM-012 — Constants placed in `data/tactical-rules.json`
    (proposed); must match the table TAC uses.
23. DAT-011 — `feedType` is needed per weapon for the reload cost (TAC-041), but the item list gives none:
    which LMGs are belt-fed, and do the bolt rifles (SV-98, M24) reload as `boltAction`, `stripperClip` or
    `boxMagazine`; which shotguns are `tube`-fed? Only pistols map obviously (`pistol`).

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
| `magazine` | Magazine (box, pistol magazine or belt) | DAT-030 |
| `grenade` | Grenade | ITM-032 |
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
moved on the strategic map) and live in their own table `data/vehicles.json` (listed in data/tables.json).
**Source.** design/data-definitions.md; design/item-list.md › Weapons (magazines are items), Grenades

### [DAT-002] Common item fields
**Rule.** Every record in `data/items.json` has:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `id` | string | — | unique; equals the record key | Stable reference used by all other data and state |
| `kind` | enum | — | DAT-001 list | Selects the profile |
| `name` | string | — | non-empty | Display name |
| `weightKg` | number | kg | ≥ 0 | Weight of one item. Required for every kind except `calibre` and `ammo` (ammo weight comes from the calibre's `roundWeightG`, DAT-019), including `medical` and `magazine`: where the design gives no weight the value is entered as data |
| `valueUsd` | number | USD | ≥ 0 | Full price at a faction trader, which is also the full barter value (ITM-021, ITM-023) and the base price of Krug markets (MGT-040). Optional in the schema; the design drafts it for barter goods, weapons, magazines, helmets, body armour, vests, belts, backpacks, medical items and grenades (ITM-034); not set for calibres, ammunition loads, mods and operation items (design: not stated) |
| `rarity` | enum | — | `common`, `uncommon`, `rare` | Loot roll weight class (ITM-024). Optional |
| `notes` | string | — | — | Display text only; no rule reads it |

Mechanical effects are always explicit fields; `notes` never carries a rule.
**Source.** design/data-definitions.md; design/item-list.md

### [DAT-003] Units
**Rule.** Weight in kg (`…Kg`), except cartridge weight in g (`roundWeightG`). Tactical distances in tiles
(1 tile ≈ 1.5 m, TAC). Strategic distances in regions. Durations: tactical in turns, strategic in whole
hours or days (STR clock). Money in USD. Percentages are stored as fractions 0–1 (`0.06` = 6%).
Multipliers are plain factors (`0.9` = ×0.9).
**Source.** design/data-definitions.md; design/tactical-layer.md › Overview (Movement); design/strategic-layer.md

### [DAT-004] Definitions versus instance state
**Rule.** `/data` holds definitions only; they are frozen at load and never changed by play. Per-instance
values live in the owning state slice and reference the definition by `id`: a gun's `condition` (DAT-014),
its fitted mods, its loaded magazine and loaded rounds; a magazine's rounds (count and load, DAT-030); an armour piece's current durability; a medical item's remaining uses or
HP; the issuing faction or point of interest of per-faction items (ITM-025); a vehicle's fuel, storage
contents and damage (DAT-029). Owners: `roster`/`economy` (MGT) between ops, `battle` (TAC) in a fight,
`world` (STR) for items and vehicles left on the map.
**Source.** design/data-definitions.md (intro); › Weapon profile › State, not profile; design/item-list.md › Weapons (magazine rounds are counted)

## Soldier equipment slots

### [DAT-005] Seven equipment slots
**Rule.** Every soldier has exactly these slots:

| Slot | Accepts `kind` | Access tier | Effect in play |
| --- | --- | --- | --- |
| `weapon1` | `weapon` (any type) | — | Equipped weapon |
| `weapon2` | `weapon` (any type) | — | Second equipped weapon; switching weapon 1 ↔ 2 costs AP (TAC-042: Agility and whether a pistol is involved) |
| `helmet` | `helmet` | — | Armour class for the head zone; may narrow hearing (ITM-010) |
| `bodyArmour` | `bodyArmour` | — | Armour class for the thorax zone; durability wears per hit (ITM-012) |
| `vest` | `vest`, or the plate carrier in `bodyArmour` (DAT-009) | quick | Item list with weight and type limits |
| `belt` | `belt` | quick | Item list with weight limit |
| `backpack` | `backpack` | slow | Item list with weight limit; can be dropped in combat (TAC) |

The loadout is part of the soldier record (MGT) and of the unit in `battle` (TAC).
**Status.** Draft (design: "Draft — not final").
**Source.** design/data-definitions.md › Soldier equipment slots (draft); design/tactical-actions.md › Weapons (Swap between weapon 1 and 2)

### [DAT-006] Access tiers
**Rule.** Items used from a quick container (vest, belt) cost their normal AP. Items used from the backpack
(slow) cost their normal AP plus a backpack surcharge (TAC-068), the same for every item. Applies to
magazines (reload), grenades and medical items.
**Values.** `backpackSurcharge` — 4 (draft) → data/tactical-rules.json (owned by TAC, TAC-068; replaces the
earlier name `backpackAccessSurchargeAp`).
**Source.** design/data-definitions.md › Soldier equipment slots (draft); design/tactical-layer.md › Medical system (draft) (Using medical items); design/tactical-actions.md › Medical; › Gear and interaction

### [DAT-007] Everything carried counts toward weight
**Rule.** Carried weight = Σ `weightKg` of everything in the seven slots and in their containers, plus
`roundWeightG` / 1000 per loose or loaded round, including the containers' own `weightKg`. It feeds carry
capacity (MGT), stamina costs and sprint penalties (TAC).
**Source.** design/data-definitions.md › Soldier equipment slots (draft)

### [DAT-008] Container limits
**Rule.** A container (vest, plate carrier pouches, belt, backpack, vehicle storage) accepts an item only if
its total contents stay ≤ its `capacityKg`. Vests and plate carriers additionally cap the count per type
category (ITM-014). Weight limit and type limits both apply; neither replaces the other.
**Source.** design/data-definitions.md › Soldier equipment slots (draft) › Type limits; design/management.md › Gear, loot & return (Inventory)

### [DAT-009] Plate carrier fills two slots
**Rule.** A `bodyArmour` record with `fillsVestSlot: true` occupies both the `bodyArmour` and the `vest`
slot; its `pouches` act as the vest container. While it is worn, no separate vest can be equipped.
**Source.** design/data-definitions.md › Soldier equipment slots (draft) › Type limits; design/item-list.md › Body armour

### [DAT-010] Loot and death
**Rule.** Anything not in a slot or a soldier's containers stays on the tactical map when the battle ends;
anything in the vehicle's storage can be brought home. A dead soldier keeps everything in the seven slots
on the body until another soldier recovers it.
**Source.** design/data-definitions.md › Soldier equipment slots (draft) › Loot, Death

## Weapon profile

### [DAT-011] Weapon profile
**Rule.** A `kind: "weapon"` record has, in addition to DAT-002:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `weaponType` | enum | — | `pistol`, `shotgun`, `smg`, `assaultRifle`, `battleRifle`, `dmr`, `sniperRifle`, `lmg` | Animations, AI role (TAI), trader and loot categories |
| `calibre` | ID → items (`calibre`) | — | existing calibre | Cartridge fired; decides which ammo and magazines fit (DAT-020) and scales recoil |
| `fireModes` | array of (integer ≥ 1 or `"auto"`) | rounds per trigger action | non-empty, unique | DAT-012 |
| `magazineSize` | integer | rounds | ≥ 1 | Capacity of the standard magazine (box/pistol/belt) or of the tube (`tube`) |
| `barrelMultiplier` | number | factor | > 0, around 1.0 (short < 1.0, long > 1.0) | Multiplies calibre damage; fixed, never changed by mods |
| `ergonomics` | integer | — | 1–100 | AP cost to fire (TAC-039) and reload (TAC-041); no effect on aim or swap |
| `baseMoa` | number | game MoA | > 0 | Mechanical accuracy, DAT-013 |
| `weightKg` | number | kg | > 0 | Weight with standard magazine |
| `recoil` | integer | — | 1–100 | Base kick per shot; × calibre `recoilModifier` = effective recoil (TAC) |
| `modSlots` | array of enum | — | subset of `muzzle`, `stock`, `pistolGrip`, `optic`, `handguard` | Which mod slots exist; the barrel is not a slot, and there is no magazine slot (magazines are items, DAT-030) |
| `action` | enum | — | `pump`, `bolt` | Optional descriptor from the item list; no rule uses it yet |
| `feedType` | enum | — | `pistol`, `boxMagazine`, `stripperClip`, `boltAction`, `belt`, `tube` | Required. Selects the reload base AP (TAC-041) and how the weapon is fed: `pistol`, `boxMagazine`, `belt` take a fitting `magazine` item (DAT-030); `tube` loads loose shells (partial reload) |
| `fireApCost` | integer | AP | ≥ 1 | Optional; overrides the weapon-type default fire AP (TAC-039) before fire-mode and ergonomics modifiers |

Mods change these values directly (DAT-016) except `barrelMultiplier` and `baseMoa`.
**Values.** `feedType` per weapon (design/item-list.md › Weapons) → data/items.json: `pistol` — PM, Glock 17;
`boxMagazine` — PP-19-01 Vityaz, MP5, Saiga-12, AK-74M, AKM, M4A1, FN FAL, HK G3, SVD, M110, SV-98, M24,
RPK-74; `belt` — M249, PKM; `tube` — Remington 870. `stripperClip` and `boltAction` stay in the enum for
later content (TAC-041 reload costs; design decision 2026-11-24) but no weapon uses them yet. RPK-74
`magazineSize` 40 (was 45). `fireApCost` — not set for any weapon (type defaults apply, TAC-039).
**Status.** Draft (design: "Draft — not final").
**Source.** design/data-definitions.md › Weapon profile (draft); design/item-list.md › Weapons; design/tactical-actions.md › Weapons (Fire, Reload)

### [DAT-012] Fire modes
**Rule.** Each entry of `fireModes` is one shot action: an integer n fires n rounds per trigger action
(1 = semi-auto, n > 1 = burst; the burst length is the weapon's own, e.g. 2 or 3); `"auto"` fires a full-auto burst. Rounds and
AP per shot action come from the selected mode; recoil builds within a burst (TAC). A weapon with one entry
has no mode switch. AP per shot action = weapon-type default or the weapon's `fireApCost` (DAT-011) + burst
or auto surcharge ± ergonomics (TAC-039).
**Values.** `autoRounds` — 5, `burstApSurcharge` — 2, `autoApSurcharge` — 4,
`fireApByWeaponType` (all draft) → data/tactical-rules.json (owned by TAC, TAC-039).
**Source.** design/data-definitions.md › Weapon profile (draft) › Fire modes; design/tactical-actions.md › Weapons

### [DAT-013] Base MoA game scale
**Rule.** `baseMoa` is a game-scale accuracy, not real minutes of angle. 1 point ≈ 0.17 m spread width at
50 m and 0.33 m at 100 m (linear with distance); the cone width is where nearly all shots land.
Calibration: `baseMoa` 5 spreads over the thorax-plus-head target (0.83 m tall) at 50 m (≈ 33 tiles).
Total spread uses it as `baseMoa × ammo spreadModifier + shooter spread` (TAC hit model). Optics never
change `baseMoa`.
**Values.** `moaSpreadPer50m` — design 0.17 m per point → data/tactical-rules.json (owned by TAC).
**Source.** design/data-definitions.md › Weapon profile (draft) › Base MoA; design/tactical-layer.md › Hit model

### [DAT-014] Weapon condition
**Rule.** Every gun instance tracks `condition`, integer 0–100 (instance state, DAT-004). Wear raises jam
chance (TAC-083) and spread (TAC-044); repair uses the Technical attribute (MGT). Condition is not part
of the profile. A gun loses `weaponWearPerShot` Condition per round fired.
**Values.** (draft, owned by TAC) `weaponWearPerShot` — 0.02 (1 per 50 rounds), `jamChanceCurve` — `max`
0.10, `exponent` 2, `conditionSpreadCurve` — `maxExtra` 0.5 → data/tactical-rules.json; repair rate
`weaponRepair` — not set (design: Open) → data/management-rules.json (MGT-067).
**Status.** open (repair rate)
**Source.** design/data-definitions.md › Weapon profile (draft) › State, not profile; design/tactical-layer.md › Derived per shot › Armour wear and weapon condition (draft)

### [DAT-015] Mod slots and handguard sub-slots
**Rule.** Mod slots of a weapon are its `modSlots`. A fitted handguard decides which sub-slots exist:
`frontGrip` (0 or 1) and `tactical` (1 or 2). Removing the handguard removes its sub-slots and the mods in
them. Each slot holds at most one mod.
**Source.** design/data-definitions.md › Weapon profile (draft) › Mod slots; › How mods change the profile

### [DAT-016] Weapon mod profile
**Rule.** A `kind: "mod"` record has, in addition to DAT-002:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `slot` | enum | — | `muzzle`, `stock`, `pistolGrip`, `optic`, `handguard`, `frontGrip`, `tactical` | Slot it fits (the `magazine` slot is removed: an extended magazine is a `magazine` item, DAT-030) |
| `fits` | array of ID → items (`weapon`) | — | — | Weapons it fits (compatibility rule not stated in design) |
| `modifiers` | object | per key | see below | Changes to the weapon profile |
| `suppressor` | boolean | — | — | Muzzle only: shots count as suppressed for hearing (TAC gunshot noise) |
| `subSlots` | object `{ frontGrip: 0–1, tactical: 1–2 }` | — | — | Handguard only (DAT-015) |
| `module` | enum | — | `flashlight`, `laser` | Tactical only (DAT-017) |

Allowed `modifiers` keys per slot: muzzle — `recoil`, `flash`; stock, pistolGrip, frontGrip — `ergonomics`,
`recoil`; handguard — `ergonomics` (plus own `weightKg`); optic — `shooterSpreadAtRange` (multiplies the
range spread, TAC-044); tactical — `snapShotSpread` for a laser (multiplies shooter spread on snap shots,
DAT-017) and, for any tactical module (flashlight or laser), an optional small `ergonomics` modifier set per
mod (design decision 2026-11-24; a tactical module's weight is its own `weightKg`). The items schema checks
the `modifiers` keys per `slot` (a key not allowed for the slot is rejected). Magazines are not mods: there
is no magazine slot; spare and extended magazines are `magazine` items (DAT-030) and count as magazines for
type limits (ITM-014). The weapon's effective weight = `weightKg` + Σ fitted mod `weightKg`.
**Values.** all mod values; whether modifiers add or multiply — not set (design: Open) → data/items.json.
**Status.** Draft; initial content: design/item-list.md › Mods (ITM-033).
**Source.** design/data-definitions.md › Weapon profile (draft) › Mod slots; › How mods change the profile; design/item-list.md › Weapons (magazines are items); › Mods

### [DAT-017] Tactical modules
**Rule.** `flashlight`: at night restores the carrier's full day sight range (TAC-004), blinds enemies in its cone
within `blindRangeTiles` (+`blindSpread` MoA until the end of their next activation), and reveals the
carrier. `laser`: multiplies shooter spread on snap shots by its mod modifier `snapShotSpread` (TAC-044);
visible to enemies.
**Values.** `blindRangeTiles` — 10, `blindSpread` — 4 (draft) → data/tactical-rules.json (TAC-004); laser
`modifiers.snapShotSpread` per item (laser module 0.8, ITM-033) → data/items.json; reveal range — not set (design: Open).
**Status.** open (reveal range)
**Source.** design/data-definitions.md › Weapon profile (draft) › Tactical modules; design/tactical-layer.md › Turn structure › Sight and spotting (draft), › Hit model › Shooter spread and recoil (draft)

### [DAT-018] Suppressors and hearing
**Rule.** A weapon with a fitted mod with `suppressor: true` fires suppressed shots; hearing ranges for
suppressed and suppressed-subsonic shots are TAC gunshot-noise rules (ITM-007).
**Source.** design/data-definitions.md › Weapon profile (draft) › How mods change the profile; design/tactical-layer.md › Turn structure (draft) (Gunshot noise)

### [DAT-030] Magazine profile
**Rule.** Magazines (box and pistol magazines) and belts are items, `kind: "magazine"`, with, in addition to
DAT-002:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `calibre` | ID → items (`calibre`) | — | existing calibre | Rounds it holds |
| `feedType` | enum | — | `pistol`, `boxMagazine`, `belt` | Matches the weapon's `feedType` (DAT-011) |
| `capacity` | integer | rounds | ≥ 1 | Rounds it holds when full |
| `fits` | array of ID → items (`weapon`) | — | non-empty; every weapon has the same `calibre` and `feedType` | Weapons it can be loaded into |
| `weightKg` | number | kg | ≥ 0 | Empty weight; loaded rounds add `roundWeightG` each (DAT-007) |

Magazines of the same pattern are shared: one magazine record fits every weapon in its `fits`, whatever
that weapon's own `magazineSize` (the loaded magazine's `capacity` sets the rounds available). Only the
pairs the item list names share magazines (set per magazine record in `fits`); weapons of the same calibre
and feed type do not share by default. An extended magazine is its own `magazine` record with a larger
`capacity`, not a mod (DAT-016).

A magazine instance (DAT-004) counts its rounds and holds **one load type at a time**: its state is
`{ rounds, load }` with one load ID for the whole fill. It is refilled from loose ammunition of its calibre
**only between fights, never in battle** (out of battle: from the soldier's containers, vehicle storage or
the FOB stash); refilling a partly filled magazine with a different load first empties it back into loose
rounds of the old load (spec rule, follows from one load per magazine). In battle a reload swaps magazines
(TAC-041); no rounds move between magazines. Tube-fed weapons use no magazine item: they load loose shells
(TAC-041).
**Values.** magazine records, `capacity`, `fits`, empty weights and prices — design drafts → data/items.json
(ITM-031); refill takes no game time and has no cost (design: not stated).
**Source.** design/item-list.md › Weapons (Feed type, magazines are items; magazine table)

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

A load may override `damage` and `projectiles` (ITM-008); 12 gauge sets them per load.
**Status.** Draft (design: "Draft — not final").
**Source.** design/data-definitions.md › Calibre profile (draft); design/item-list.md › Calibres

### [DAT-020] Calibre fit
**Rule.** A weapon accepts an ammo load only if it references the same calibre ID (weapon `calibre` = load
`calibre`). A `magazine` item (DAT-030) fits a weapon
only if the weapon is in its `fits` list, which requires the same `calibre` and `feedType`; a magazine is
filled only with loads of its own `calibre`.
**Source.** design/data-definitions.md › Calibre profile (draft) › Designation; design/item-list.md › Weapons (magazines are items)

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
**Source.** design/data-definitions.md › Calibre profile (draft) › Ammo types; design/item-list.md › Ammunition

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

**Values.** the table above — design placeholders → data/items.json (editor defaults; stored per load);
the `spreadModifier` column is the item list's draft spread modifier by ammo type (Subsonic ×1.1, Slug ×0.5,
every other load ×1.0).
**Status.** Draft (falloff ranges marked placeholder).
**Source.** design/data-definitions.md › Calibre profile (draft) › Ammo types; design/item-list.md › Ammunition

### [DAT-023] Per-shot inputs
**Rule.** Data feeding the TAC per-shot rules: muzzle damage = (load `damageOverride` or calibre
`damage`) × load `damageModifier` × weapon `barrelMultiplier`; damage at distance uses load `falloff`,
`falloffRangeTiles` and the floor of ITM-005; projectiles per round = load `projectilesOverride` or calibre
`projectiles`; penetration class = load `penetrationClass`; effective recoil = weapon `recoil` (after mods)
× calibre `recoilModifier`. Formulas are owned by TAC.
**Source.** design/tactical-layer.md › Derived per shot (draft); design/data-definitions.md › Calibre profile (draft)

## Vehicles

### [DAT-024] Vehicle profile
**Rule.** `data/vehicles.json`, object keyed by ID; each record:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `id` | string | — | unique; equals key | — |
| `name` | string | — | non-empty | Display name |
| `vehicleType` | enum | — | `ground`, `helicopter` | — |
| `costUsd` | number | USD | > 0 | Purchase price; upkeep (repairs) scales with it, fuel is extra |
| `seats` | integer | soldiers | ≥ 1 | Max squad size; for helicopters includes the pilot |
| `storageKg` | number | kg | ≥ 0 | One storage list limited by weight (DAT-025) |
| `fuelRangeRegions` | integer | regions (= fuel units) | ≥ 1 | Tank size: one fuel unit per tile moved, whatever the terrain (STR-032) |
| `offRoad` | enum | — | `poor`, `good`, `veryGood`, `ignoresTerrain` | Lowers travel time in steppe and woods (STR); helicopters `ignoresTerrain` |
| `armourClass` | integer or null | class | 1–6 or null | Passenger protection in road encounters; null = none |
| `armourCockpitOnly` | boolean | — | — | Optional; the armour protects the cockpit seats only (Mi-8) |
| `mineProtection` | boolean | — | — | MRAP |
| `noise` | enum | — | `low`, `medium`, `high`, `veryHigh`, `extreme` | How far away factions notice it (STR) |
| `features` | array of enum | — | DAT-026 | Special abilities |
| `availability` | object | — | DAT-027 | Where and to whom it is sold |
| `requiresPilot` | boolean | — | — | Helicopters: DAT-028 |

The former `profile` field (`civilian` / `military`) is removed (design 06e571f: the Profile column is gone;
STR-033).

**Values.** (design drafts) upkeep 0.2% of `costUsd` per day plus fuel → data/economy-rules.json
`vehicleUpkeepPerDayFraction` (MGT-073; the player's running cost); one fuel unit = one 20-litre fuel can of
18 kg (the fuel item's weight → data/items.json); noise → notice distance Low 1 tile, Medium 2, High 3,
Very high 4, Extreme 6 → data/strategic-rules.json `noiseRange` (STR-008); off-road → travel time — STR-032.
Mi-8 armour: class 2, cockpit only (`armourClass` 2, `armourCockpitOnly` true). Field names and the schema
are owned by STR (vehicles.schema.json); `armourCockpitOnly` is proposed here.
Initial content: design/data-definitions.md › Vehicles (14 vehicles).
**Status.** Draft (design: "Draft — not final").
**Source.** design/data-definitions.md › Vehicles (draft) › Vehicle parameters

### [DAT-025] A squad has at most one vehicle
**Rule.** A strategic squad has at most one vehicle. With a vehicle, `seats` caps its soldiers (plus any VIP
seat a mission takes, MGT) and the vehicle storage is one item list ≤ `storageKg` holding supplies
(ammunition, fuel cans, medical supplies, spare parts) and loot alike; soldiers restock from it between
engagements. A squad without a vehicle travels on foot (`onFootHours` per tile, mountains separate,
data/strategic-rules.json, STR-031) and carries only what its soldiers carry (their seven slots and
containers, DAT-005, DAT-007); it has no storage list and no supplies store beyond its soldiers' gear, and
loot it brings home must fit in their backpacks, vests and belts (container limits, DAT-008). Vehicles are
not upgraded. Several vehicles allow
several vehicle squads to run ops at the same time.
**Source.** design/data-definitions.md › Vehicles (draft)

### [DAT-026] Vehicle features
**Rule.** `features` enum and effect owner:

| Feature | Effect | Owner |
| --- | --- | --- |
| `easyRepair` | Cheap to repair | MGT |
| `repairAnywhere` | Allows field repairs away from mechanical plants | MGT |
| `ambulance` | Wounded heal `ambulanceHealFactor` × faster while travelling | MGT |
| `weaponMount` | Fights in road encounters, draws attention | STR |
| `amphibious` | Crosses water regions | STR |
| `heavyMachineGun` | Heavy machine gun in encounters | STR |
| `doorGun` | Door gun in encounters | STR |
| `noticedByAll` | Every faction notices it | STR |
| `heavyLift` | Needed for big hauls from hidden cities (optional feature) | STR |

"Inconspicuous", "rugged", "reliable", "longest range", "largest storage" are descriptions covered by
other fields and get no feature. `mineProtection` (DAT-024) halves blast damage to passengers.
**Values.** (design drafts) `ambulanceHealFactor` — 2; mine protection blast damage factor — 0.5 → owner
STR/MGT rules tables (field names to be set with the vehicles schema, STR); `easyRepair` cost reduction,
weapon mount / heavy machine gun / door gun strength — not set (design: not stated).
**Status.** open
**Source.** design/data-definitions.md › Vehicles (draft) › Vehicles table

### [DAT-027] Vehicle availability
**Rule.** `availability = { where: array of enum (largeCity, mechanicalPlant, krugMarket), standing:
null or { factions: array of faction ID, minStanding: enum (friendly, trusted) } }`. A vehicle is offered
where listed (`krugMarket` = a town or city tile with the `krugMarket` flag, STR); with `standing` set it
is sold only to a PMC with that standing with one of the listed factions, or through the Krug. At campaign start the player buys the first vehicle from the starting
budget; only the cheapest few are affordable (MGT economy).
Eastern vehicles (GAZ Tigr, Mi-2) need `trusted` with the SSV or Varyag; western vehicles (MRAP, UH-1H)
need `trusted` with the VDK or Aegis; any restricted vehicle is also sold at `trusted` with the Krug; the
civilian Robinson R44 needs no standing (`standing: null`).
**Values.** (design drafts) eastern `{ factions: [ssv, varyag], minStanding: trusted }`, western
`{ factions: [vdk, aegis], minStanding: trusted }`, Krug alternative at `trusted` → data/vehicles.json.
**Source.** design/data-definitions.md › Vehicles (draft) › Buying and selling, Start; design/management.md › Reputation › Standing

### [DAT-028] Helicopter data
**Rule.** `vehicleType: "helicopter"` implies: travel `heliMoveHours` per region over any terrain incl.
water; landing on any open, non-water tile; one seat is the pilot, who needs Technical ≥
`pilotTechnicalMin` or is a hired pilot on salary; refuel only at FOBs and oil plants; noticed by every
faction in range; each hostile military point of interest on its path rolls a chance to damage or down it
(STR-034); a downed helicopter becomes a crash site and starts an emergency op (STR). Hidden cities are
reachable only this way (optional feature).
**Values.** → see STR-034: `pilotTechnicalMin` — design 50 and `heliMoveHours` — design 1 are single values in
data/strategic-rules.json, not vehicle record fields; damage / down chance per point of interest (design
draft 10% / 3%) → STR-034.
**Source.** design/data-definitions.md › Vehicles (draft) › Helicopters (draft)

### [DAT-029] Vehicle instance state and loss
**Rule.** Each owned vehicle instance tracks fuel, storage contents and condition (owner: MGT; on the map:
STR). A vehicle left behind on a failed op can be destroyed, captured or recovered later (STR).
**Status.** open
**Source.** design/data-definitions.md › Vehicles (draft) › Loss

## Weapons

### [ITM-001] Weapon items
**Rule.** Weapons are `kind: "weapon"` records (DAT-011). The item-list type "Shotgun (pump)" maps to
`weaponType: shotgun, action: pump`; "Sniper rifle (bolt)" to `sniperRifle, action: bolt`. The item-list
feed types map to `feedType`: Pistol → `pistol`, Box magazine → `boxMagazine`, Belt → `belt`, Tube → `tube`.
Initial content: design/item-list.md › Weapons (18 weapons, with feed type; RPK-74 magazine 40).
**Values.** `valueUsd` per weapon (design draft trader prices): PM $150, Glock 17 $400, PP-19-01 Vityaz
$600, MP5 $900, Remington 870 $350, Saiga-12 $650, AK-74M $700, AKM $600, M4A1 $1,200, FN FAL $1,100,
HK G3 $1,000, SVD $1,500, M110 $3,000, SV-98 $2,500, M24 $2,800, RPK-74 $1,100, M249 $3,500, PKM $2,500 →
data/items.json (ITM-034).
**Source.** design/item-list.md › Weapons (incl. Trader prices (draft))

## Calibres

### [ITM-002] Calibre items
**Rule.** Calibres are `kind: "calibre"` records (DAT-019); damage is per projectile at the muzzle with
barrel multiplier 1.0. 12 gauge sets damage and projectile count per load: both its loads carry
`damageOverride` / `projectilesOverride` (ITM-008); the calibre record keeps the buckshot values
(`damage` 25, `projectiles` 8) only as the fallback the profile requires.
Initial content: design/item-list.md › Calibres (8 calibres).
**Source.** design/item-list.md › Calibres

## Ammunition

### [ITM-003] Ammunition load items
**Rule.** Every calibre × ammo type combination in the item list is one `kind: "ammo"` record (DAT-021).
Ammunition is carried as rounds (loose or in magazines); one round weighs the calibre's `roundWeightG`.
Initial content: design/item-list.md › Ammunition (30 loads); `spreadModifier` from DAT-022 (the item list
gives no per-load spread). Optional `recoilSpreadModifier` (number > 0, default 1) multiplies burst recoil
spread (TAC-047); tracer loads 0.85 (draft).
**Source.** design/item-list.md › Ammunition

### [ITM-004] Standard damage modifiers
**Rule.** A load's `damageModifier` is the standard modifier of its ammo type unless the item editor sets
otherwise: FMJ 1.0, AP 0.9, HP 1.25, Subsonic 0.8, Tracer 1.0, Buckshot 1.0, Slug 1.0.
**Values.** as listed — design placeholders → data/items.json.
**Source.** design/item-list.md › Ammunition

### [ITM-005] Falloff floor
**Rule.** Damage at distance never drops below `falloffFloor` × muzzle damage (TAC per-shot rule).
**Values.** `falloffFloor` — design 0.10 → data/tactical-rules.json (owned by TAC).
**Source.** design/item-list.md › Ammunition; design/tactical-layer.md › Derived per shot (draft)

### [ITM-006] Penetration class
**Rule.** `penetrationClass` is the highest armour class the round defeats; 0 = unarmoured targets only.
It comes from the load alone and never changes with distance or barrel length.
**Source.** design/item-list.md › Ammunition; design/tactical-layer.md › Derived per shot (draft)

### [ITM-007] Subsonic through a suppressor
**Rule.** A shot with a `subsonic: true` load from a suppressed weapon is heard only within
`subsonicSuppressedHearingTiles` (TAC gunshot noise; halved by a helmet hearing penalty, ITM-010).
`subsonic` may be true by nature of the calibre (9×18 mm loads).
**Values.** `subsonicSuppressedHearingTiles` — design 6 → data/tactical-rules.json (owned by TAC).
**Source.** design/item-list.md › Ammunition; design/tactical-layer.md › Turn structure (draft) (Gunshot noise)

### [ITM-008] Load-specific damage and projectiles
**Rule.** If a load sets `damageOverride` / `projectilesOverride`, they replace the calibre's `damage` /
`projectiles` for that load. Used for 12 gauge, on every load: buckshot = 8 projectiles × 25 damage, slug =
1 projectile × 90 damage.
**Values.** buckshot `damageOverride` 25, `projectilesOverride` 8; slug `damageOverride` 90,
`projectilesOverride` 1 → data/items.json.
**Source.** design/item-list.md › Calibres (intro and 12 gauge row)

## Magazines

### [ITM-031] Magazine items
**Rule.** Every magazine-, pistol- or belt-fed weapon (DAT-011 `feedType` ≠ `tube`) has at least one
`kind: "magazine"` record (DAT-030) that fits it. The item list's magazine table is the initial content:
17 records, one per non-tube weapon. Only the AK-74 / RPK-74 pair shares magazines (both magazines fit
AK-74M and RPK-74); every other magazine fits only its own weapon — the FN FAL and HK G3 do not share,
although both fire 7.62×51 mm. Belts for M249 and PKM are `feedType: belt` records (100 rounds, with box).
**Values.** (design drafts; `capacity` / empty `weightKg` kg / `valueUsd`) → data/items.json:

| Magazine | `fits` | Rounds | Empty kg | Price |
| --- | --- | --- | --- | --- |
| PM magazine | PM | 8 | 0.08 | $10 |
| Glock 17 magazine | Glock 17 | 17 | 0.07 | $25 |
| Vityaz magazine | PP-19-01 Vityaz | 30 | 0.2 | $30 |
| MP5 magazine | MP5 | 30 | 0.15 | $30 |
| Saiga-12 magazine | Saiga-12 | 8 | 0.3 | $40 |
| AK-74 magazine | AK-74M, RPK-74 | 30 | 0.23 | $20 |
| RPK-74 magazine | AK-74M, RPK-74 | 40 | 0.33 | $35 |
| AKM magazine | AKM | 30 | 0.33 | $20 |
| STANAG magazine | M4A1 | 30 | 0.12 | $20 |
| FAL magazine | FN FAL | 20 | 0.27 | $30 |
| G3 magazine | HK G3 | 20 | 0.23 | $25 |
| SVD magazine | SVD | 10 | 0.21 | $40 |
| M110 magazine | M110 | 20 | 0.18 | $50 |
| SV-98 magazine | SV-98 | 10 | 0.2 | $45 |
| M24 magazine | M24 | 5 | 0.1 | $30 |
| M249 belt (with box) | M249 | 100 | 0.35 | $40 |
| PKM belt (with box) | PKM | 100 | 0.4 | $40 |

**Source.** design/item-list.md › Weapons (Feed type, magazines are items; magazine table)

## Helmets

### [ITM-009] Helmet items
**Rule.** `kind: "helmet"` adds:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `armourClass` | integer | class | 1–6 | Protects the head zone (TAC) |
| `durability` | number | points | > 0 | Maximum durability (ITM-012) |
| `hearingPenalty` | boolean | — | — | ITM-010 |
| `visionConeDeg` | number | degrees | > 0 | Optional; replaces the default 120° cone (TAC) |

The former `nightVisionMount` field is removed (design 06e571f: the high-cut helmet no longer mounts night
vision). A visor (Altyn) counts as part of the head protection: it adds no zone and no separate armour.
Initial content: design/item-list.md › Helmets (5 helmets).
**Values.** `valueUsd` (design draft trader prices): SSh-68 $80, PASGT $300, 6B47 $350, high-cut ballistic
helmet $900, Altyn with visor $1,500 → data/items.json (ITM-034).
**Source.** design/item-list.md › Helmets

### [ITM-010] Helmet hearing and vision
**Rule.** A helmet with `hearingPenalty: true` halves the suppressed hearing ranges for its wearer (TAC
gunshot noise). `visionConeDeg` (Altyn with visor: 90) narrows the wearer's vision cone.
**Values.** Altyn `visionConeDeg` 90 → data/items.json; hearing factor 0.5 → data/tactical-rules.json.
**Source.** design/item-list.md › Helmets; design/tactical-layer.md › Turn structure (draft) (Gunshot noise)

## Body armour

### [ITM-011] Body armour items
**Rule.** `kind: "bodyArmour"` adds:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `armourClass` | integer | class | 1–6 | Protects the thorax zone (TAC) |
| `durability` | number | points | > 0 | Maximum durability |
| `fillsVestSlot` | boolean | — | — | Plate carrier (DAT-009) |
| `pouches` | object or null | — | — | Required if `fillsVestSlot`: `{ capacityKg, maxMagazines, maxGrenades, maxMedical, maxOther }` (ITM-014) |
| `durabilityLossModifier` | number | factor | > 0 | Optional; multiplies armour wear (TAC-051); ceramic plates 1.5 |
| `coversZones` | array of zone | — | — | Optional, unused in the first build: zones the piece protects (later limb armour) |
| `apPenalty`, `staminaPenalty` | number | AP / stamina | ≥ 0 | Optional; heavy assault armour |
| `concealable` | boolean | — | — | Soft armour vest |

Initial content: design/item-list.md › Body armour (6 items).
**Values.** ceramic `durabilityLossModifier` — 1.5 (draft); heavy assault armour `apPenalty` 5,
`staminaPenalty` 0 (draft; TAC-027) → data/items.json. `valueUsd` (design draft trader prices): soft armour
vest $250, 6B23 $600, plate carrier with steel plates $700, plate carrier with ceramic plates $1,400, 6B13
$1,100, heavy assault armour $2,500 → data/items.json (ITM-034).
**Source.** design/item-list.md › Body armour

### [ITM-012] Armour durability
**Rule.** Current durability is instance state, starting at `durability`; it wears with each hit; armour
condition % = current / max and drives the TAC penetration rule; at 0 it no longer protects. Wear per hit
is TAC-051 (blocked and penetrating hits, × the piece's `durabilityLossModifier`).
**Values.** `armourWear` — `blocked` 0.10, `penetrating` 0.05, `min` 1 (draft) → data/tactical-rules.json (TAC-051).
**Source.** design/data-definitions.md › Soldier equipment slots (draft); design/tactical-layer.md › Derived per shot (draft) › Armour wear and weapon condition (draft)

## Load-bearing vests

### [ITM-013] Vest items
**Rule.** `kind: "vest"` adds `capacityKg` (number > 0), `maxMagazines`, `maxGrenades`, `maxMedical`,
`maxOther` (integers ≥ 0) (own weight is `weightKg`), `quiet` (boolean; no rule
yet).
Initial content: design/item-list.md › Load-bearing vests (4 vests).
**Values.** `valueUsd` (design draft trader prices): Lifchik $40, commercial chest rig $120, MOLLE tactical
vest $250, low-profile recon rig $200 → data/items.json (ITM-034).
**Source.** design/item-list.md › Load-bearing vests

### [ITM-014] Pouch type limits
**Rule.** Every item placed in a vest, plate-carrier or battle-belt pouch counts in exactly one type
category: `magazine` (`kind: magazine`, DAT-030), `grenade` (`kind: grenade`, ITM-032), `medical`
(`kind: medical`), `other` (everything else).
The count per category must stay ≤ its `max…` value, in addition to `capacityKg`. On a belt (ITM-017) a
`max…` field that is not set means no count limit for that category (only the weight limit applies).
**Source.** design/item-list.md › Load-bearing vests; › Battle belts; › Weapons (magazines are items); › Grenades; design/data-definitions.md › Soldier equipment slots (draft) › Type limits

### [ITM-015] Other items
**Rule.** `other` covers barter goods, operation and faction items and small tools — everything not a
magazine, grenade or medical item.
**Source.** design/item-list.md › Load-bearing vests

### [ITM-016] Pouch item weight limit
**Rule.** Only items with `weightKg` ≤ `pouchItemMaxKg` fit in a vest, plate-carrier or battle-belt pouch;
heavier items go in a backpack (or vehicle storage). The holstered sidearm (ITM-017) is not a pouch item.
**Values.** `pouchItemMaxKg` — design 1 kg → data/tactical-rules.json (a table constant; data/items.json holds
only item records).
**Source.** design/item-list.md › Load-bearing vests

## Battle belts

### [ITM-017] Battle belt items
**Rule.** `kind: "belt"` adds `capacityKg` (number > 0), `holsters` (integer ≥ 0) and optional type limits
`maxMagazines`, `maxGrenades`, `maxMedical`, `maxOther` (integers ≥ 0); own weight is `weightKg`. Belts
have quick access (DAT-006). Each holster holds one sidearm (`weaponType: pistol`). Belt pouches follow the
vest rules: the 1 kg pouch item limit (ITM-016) and the type limits (ITM-014); a belt holds at most
`maxGrenades` grenades.
Initial content: design/item-list.md › Battle belts (3 belts).
**Values.** `maxGrenades` — 2 for every belt (design draft, Grenades); `maxMagazines`, `maxMedical`,
`maxOther` — not set (design: "the same type limits", no counts); `valueUsd` (design draft trader prices):
leather belt $20, padded battle belt $90, heavy battle belt $150 → data/items.json (ITM-034).
**Status.** open (holster vs. `weapon2` slot; belt counts other than grenades)
**Source.** design/item-list.md › Battle belts; › Grenades

## Backpacks

### [ITM-018] Backpack items
**Rule.** `kind: "backpack"` adds `capacityKg` (number > 0; own weight is `weightKg`), `extraAccessAp` (optional
number ≥ 0; on top of the backpack surcharge, DAT-006), `noSprint` (boolean; no sprinting while worn).
Initial content: design/item-list.md › Backpacks (4 backpacks).
**Values.** duffel bag `extraAccessAp` — not set (design: "extra AP") → data/items.json. `valueUsd` (design
draft trader prices): duffel bag $30, patrol pack $120, assault pack $180, large rucksack $250 →
data/items.json (ITM-034).
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
| `hpPerUse` | number | HP | > 0 | Optional; base HP per use before the Medical multiplier (TAC-066); replaces `hpPerUseMax` |
| `durationTurns` | integer | turns | ≥ 1 | Optional; effect duration (painkillers) |
| `restoresToHp` | number | HP | ≥ 1 | Optional; surgical kit sets a 0-HP limb to this |
| `causesPain` | boolean | — | — | Tourniquet |
| `requiresMedical` | integer | attribute | 1–100 | Optional minimum Medical |
| `backpackOnly` | boolean | — | — | Can be carried only in a backpack (medkit) |

`weightKg` is required (DAT-002). Items heavier than `pouchItemMaxKg` (medkit 2.0 kg, surgical kit 1.5 kg)
fit only in a backpack by ITM-016; the medkit is also flagged `backpackOnly`.
Initial content: design/item-list.md › Medical items (8 items).
**Values.** (design drafts; `weightKg` / `valueUsd`): bandage 0.05 / $10, tourniquet 0.1 / $25, hemostatic
dressing 0.1 / $40, splint 0.2 / $30, painkillers 0.05 / $20, IFAK 0.4 / $80, medkit 2.0 / $400, surgical
kit 1.5 / $600 → data/items.json (ITM-034).
**Source.** design/item-list.md › Medical items; design/tactical-layer.md › Medical system (draft)

### [ITM-020] Medical item restrictions
**Rule.** Tourniquet treats heavy bleeding on arms and legs only. Hemostatic dressing treats heavy
bleeding in any zone (light and quick); the medkit also stops heavy bleeding in any zone, so neither is
exclusive. IFAK restores `hpPerUse` per use before the Medical multiplier (TAC-066), so a skilled medic
restores more than that per use, from its pool; the medkit likewise restores its `hpPerUse` per use from
its pool. Painkillers mask pain for
`durationTurns`. Surgical kit needs Medical ≥ `requiresMedical` and brings a disabled arm or leg (0 HP) back to
`restoresToHp`. Medkit is `backpackOnly`.
**Values.** IFAK `hpPool` 60, `hpPerUse` 15; medkit `hpPool` 300, `hpPerUse` 40 (design draft); painkillers `uses` 4,
`durationTurns` 10; surgical kit `uses` 3, `requiresMedical` 40, `restoresToHp` 1 → data/items.json.
**Source.** design/item-list.md › Medical items; design/tactical-layer.md › Medical system (draft) › Using medical items

## Grenades

### [ITM-032] Grenade items
**Rule.** `kind: "grenade"` adds, in addition to DAT-002 (`weightKg` required):

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `effect` | enum | — | `frag`, `smoke` | Effect on landing (TAC-079) |
| `radiusTiles` | number | tiles | > 0 | Blast or cloud radius |
| `damage` | number | HP | ≥ 0 | Frag: damage at the point of impact, falling evenly to 0 at the edge; smoke: 0 |
| `penetrationClass` | integer | class | 0–6 | Frag: penetration class of the blast (TAC-050) |
| `durationTurns` | integer or null | turns | ≥ 1 | Smoke: how long the cloud lasts; null for instant effects |
| `blocksSight` | boolean | — | — | Smoke: blocks line of sight into, out of and through the cloud |
| `loud` | boolean | — | — | Frag: heard across the map; smoke: quiet |

Grenades go in the vest's or plate carrier's grenade pouches (`grenade` type limit, ITM-014) or the battle
belt, at most the belt's `maxGrenades` (ITM-017); from the backpack they cost the backpack surcharge
(TAC-043, TAC-068). Strength sets the throwing
distance; a wounded or disabled arm widens the landing scatter (TAC-043). Frag blasts: full cover blocks,
half cover halves; the damage is split over the six body zones by silhouette share, each checked against
its own armour (TAC-079).
Initial content: design/item-list.md › Grenades (2 grenades).
**Values.** (all draft, placeholder) frag grenade — `weightKg` 0.6, `damage` 100, `radiusTiles` 4,
`penetrationClass` 2, instant, `loud` true; smoke grenade — `weightKg` 0.5, `damage` 0, `radiusTiles` 3,
`durationTurns` 4, `blocksSight` true, `loud` false → data/items.json. Trader price and rarity (design
drafts): frag grenade `valueUsd` $60, `rarity` uncommon; smoke grenade $30, common → data/items.json
(ITM-034); belt grenade limit 2 → ITM-017.
**Status.** Draft (design: "Draft — placeholder values").
**Source.** design/item-list.md › Grenades


### [ITM-033] Mod items
**Rule.** Initial weapon mods are `kind: "mod"` records (DAT-016). Optics (`slot: optic`) carry
`modifiers.shooterSpreadAtRange` (multiplies the range spread, TAC-044); the laser (`slot: tactical`,
`module: laser`) carries `modifiers.snapShotSpread` (multiplies shooter spread on snap shots) and is
visible to enemies (DAT-017). Tactical modules (laser, flashlight) may also carry a small `ergonomics`
modifier set per mod (DAT-016). Which weapons each mod fits (`fits`) is set in the item editor.
Initial content: design/item-list.md › Mods (4 mods).
**Values.** (all draft, placeholder) red dot sight — optic, range spread 0.8, 0.2 kg; 4× scope — optic,
0.5, 0.5 kg; sniper scope — optic, 0.3, 0.7 kg; laser module — tactical, snap-shot spread 0.8, 0.15 kg →
data/items.json; tactical-module `ergonomics` — not set per mod (design: "may", no values); mod prices — not
set (design: not stated).
**Status.** Draft (design: "Draft — placeholder values").
**Source.** design/item-list.md › Mods

## Trader prices

### [ITM-034] Trader prices
**Rule.** An item's `valueUsd` (DAT-002) is its full price in US dollars at a faction trader. Buying an
item at a faction trader costs `valueUsd`, times `unfriendlyPriceMarkup` at Unfriendly standing (MGT-039);
at a Krug market `valueUsd` is the base price that fluctuates (MGT-040). The same value counts in barter
deals (ITM-023). The design drafts prices for weapons (ITM-001), magazines and belts (ITM-031), helmets
(ITM-009), body armour (ITM-011), vests (ITM-013), battle belts (ITM-017), backpacks (ITM-018), medical items
(ITM-019) and grenades (ITM-032); barter goods keep their barter value (ITM-021). An item without
`valueUsd` (ammunition loads, mods, operation items) cannot be bought or sold at a trader until a price is
set. What a trader pays when the player sells gear (not barter goods, ITM-022) is not stated.
**Values.** draft prices as listed in the referenced sections → data/items.json `valueUsd`.
**Status.** Draft; open (ammunition and mod prices; sell-back rate for gear)
**Source.** design/item-list.md › Weapons (Trader prices (draft)); › Helmets; › Body armour; › Load-bearing vests; › Battle belts; › Backpacks; › Medical items; › Grenades

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
`foundIn`. Location tags come from the fixed list `locationTags` in data/loot.json; a barter good's
`foundIn` uses only these tags, plus `everywhere`, which means any tag. Operation items (ITM-025) may also
name a body role (`squadLeader`, `radioOperator`, …) in `foundIn`; those count as `bodies` of that role.
**Values.** rarity weights — design common 60 / uncommon 30 / rare 10; `rareLocations` — design
apartments, safes, churches, bodies; `locationTags` (design draft): `bodies`, `houses`, `apartments`,
`shops`, `offices`, `warehouses`, `depots`, `militaryDepots`, `garages`, `farms`, `industry`, `powerLines`,
`churches`, `safes`, `hospitals`, `commandPosts`, `convoys`, `vehicleWrecks`, `krugCaches` →
data/loot.json (listed in data/tables.json).
**Source.** design/item-list.md › Barter goods › Trading rules

## Operation and faction items

### [ITM-025] Operation and faction item fields
**Rule.** `kind: "opItem"` adds:

| Field | Type | Unit | Range | Meaning |
| --- | --- | --- | --- | --- |
| `foundIn` | array of string | — | loot location tags | Where it is found (bodies by role, POIs) |
| `perFaction` | boolean | — | — | Instance carries `faction` (ID → GEN-004) — dog tags, field orders, radio, codebook, Krug marker |
| `perPoi` | boolean | — | — | Instance carries a point-of-interest ID (POI key) |
| `opEffect` | object or null | — | ITM-026 | Use during operations |
| `handIn` | array of hand-in entries | — | ITM-028 | Rewards per receiver |

Initial content: design/item-list.md › Operation and faction items (13 items; the checkpoint pass was
deleted from the design together with checkpoints).
**Source.** design/item-list.md › Operation and faction items

### [ITM-026] Operation effects
**Rule.** `opEffect = { type: enum, …params }`:

| `type` | Item | Effect (rule owner) | Params (design values) |
| --- | --- | --- | --- |
| `revealSquadPlan` | Field orders | Read: shows that squad's goal and route (STR intel) | `durationHours` 72 |
| `revealAdjacentSquads` | Encrypted radio | Carried by a squad: shows that faction's squads within range (STR) | `rangeRegions` 1, `durationDays` 7 |
| `extendRadio` | Codebook | With an encrypted radio of the same faction: extends it (STR) | `rangeRegions` 2, `durationDays` 14 |
| `demolition` | Demolition charge | Destroys a wall or vehicle; required for sabotage objectives (TAC/MGT missions) | — |
| `cutLock` | Bolt cutters | Opens locked gates and containers silently (TAC) | `apCost` 10 |
| `poiKey` | POI key | Opens the locked rooms of its point of interest (TAC) | — |
| `restockMedical` | Medical supply crate | Restocks a squad once (MGT) | 4 bandages, 2 tourniquets |
| `restockAmmo` | Ammunition crate | Restocks a squad's loose ammo once (MGT) | — |

Items without a row have no operation use. The former `checkpointPass` type is removed (the checkpoint
pass item and checkpoints are gone from the design).
**Values.** params as listed → data/items.json.
**Source.** design/item-list.md › Operation and faction items

### [ITM-027] Hand-in action
**Rule.** A hand-in is one strategic player action at a point of interest held by the receiving faction,
or at a Krug market when the receiver is the Krug. It consumes the item.
**Values.** hand-in duration — not set (design: Open) → STR strategic actions table.
**Source.** design/item-list.md › Operation and faction items; design/strategic-actions.md

### [ITM-028] Hand-in rewards
**Rule.** A hand-in entry is `{ receiver, moneyUsd?, reputation?, dailyCap?, effect? }`, where `receiver` is
one of: `issuingFaction` (the item's own faction), `enemiesOfIssuer` (every faction whose relation toward
the issuer is at or below the hostile threshold `hostileAt`, design −50, → see STR-051), a fixed list of faction IDs, `rivalOfOwningPmc`, `plantHolder` (faction holding a
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
2. **Resolved (design 75e776f):** wear per shot, jam chance and spread curves are drafted (DAT-014, TAC-083) (part). Still open: the repair rate. DAT-014 — Weapon condition: wear per shot, jam chance and spread curves, repair rate are Open (values;
   the fields are now named: `weaponWearPerShot`, `jamChanceCurve`, `conditionSpreadCurve` in tactical-rules,
   `weaponRepair` in management-rules).
3. DAT-016 — No weapon mods exist in the item list; mod compatibility (`fits` per weapon, per type or per
   calibre), modifier arithmetic (add vs multiply) and the meaning of the muzzle `flash` value are not stated.
4. **Resolved (design eb072a2):** magazines are items with calibre, capacity, weight and fitting weapons, their rounds are counted, and they are refilled from loose ammunition (DAT-030, ITM-031). DAT-016/ITM-014 — Are spare magazines separate items (magazine mods) with loaded rounds tracked per
   magazine, or abstract? The ammunition crate restocks "loose ammo", which suggests loose rounds exist too.
5. **Resolved (design eb072a2):** the item list adds a Grenades section — frag and smoke grenades with draft weight, radius, damage, penetration and duration (ITM-032). ITM-014 — Grenades have a type limit but no grenade items or grenade profile exist in the design.
6. DAT-019 — Design says recoil modifier "about ×0.6–×1.6", the item list uses ×0.5 for 9×18 mm.
7. **Resolved (design eb072a2):** confirmed — 12 gauge sets damage and projectile count per load (buckshot 8 × 25, slug 1 × 90), kept as overrides on the loads. DAT-019/ITM-008 — The calibre profile has one damage and projectile count, but 12 gauge differs per
   load; this spec adds `damageOverride`/`projectilesOverride` on loads. Confirm.
8. **Resolved (design 75e776f):** HP ammo bleed modifier 1.5 and tracer recoil spread ×0.85 are drafted (TAC-060, TAC-047) (part). Still open: whether tracers reveal the shooter. DAT-021 — HP "higher bleeding chance" and tracer "less recoil spread in bursts; reveals the shooter" have
   no values; AP "+1 to +2 penetration" is only a description (per-load classes are given).
9. **Resolved (2026-11-24):** the item list drafts spread modifiers by ammo type (Subsonic ×1.1, Slug ×0.5, others ×1.0), matching DAT-022. DAT-022 — Per-load spread modifiers are missing in the item list; spec uses the type defaults.
10. **Resolved (2026-11-24):** draft trader prices for weapons, magazines, armour, gear, medical items and grenades are `valueUsd` (ITM-034). Still open: prices for ammunition, mods and operation items; the rate a trader pays for gear. DAT-002 — No purchase prices for weapons, armour, gear, medical or operation items; only barter goods
    have `valueUsd`. Trader prices are needed for MGT trading.
11. **Resolved (2026-11-24):** draft weights for all medical items; medkit 40 HP per use (ITM-019, ITM-020). ITM-019 — Medical items have no weights (`weightKg` is required, DAT-002; values to be entered as data); medkit "large; backpack item" cannot be checked against the
    1 kg pouch rule. Medkit HP per use is not stated.
12. **Resolved (design 8972470):** the note now reads "Light and quick; the medkit also stops heavy bleeding in any zone" — both treat heavy bleeding in every zone. ITM-020 — Hemostatic dressing is called "the only fix for thorax and head bleeding in the field", yet the
    medkit also stops heavy bleeding.
13. **Partly resolved (2026-11-24):** the holster holds the sidearm (a pistol); the 1 kg rule and type limits apply to belt pouches; belts hold at most 2 grenades (ITM-016, ITM-017). Still open: is the holstered pistol the `weapon2` slot (DAT-005) or an extra weapon, and does it count toward `capacityKg`; belt counts for magazines, medical and other items ("the same type limits" gives no numbers). ITM-017 — Meaning of the battle-belt holster (does weapon 2 or a pistol sit there, does it change swap
    AP?). Does the 1 kg pouch rule (ITM-016) and type limits apply to belts? The item list names only vests
    and plate carriers.
14. **Resolved (design 3aac08f):** heavy assault armour −5 AP per activation, no stamina penalty (ITM-011, TAC-027) (part). Still open: concealable, quiet. **Resolved (design 75e776f):** ceramic wear ×1.5 (ITM-011) (part). ITM-011 — Values for ceramic fast durability loss, heavy assault armour AP/stamina penalties; whether
    "concealable" (soft armour) and "quiet" (recon rig) have a rule.
15. **Resolved (2026-11-24):** "mounts NVG" is dropped (`nightVisionMount` removed) and the visor counts as head protection only (ITM-009). ITM-009 — "Mounts for night vision": no night-vision item exists. "Visor covers the face": no face zone.
16. **Resolved (design 75e776f):** every hit wears armour: 10% of damage blocked, 5% penetrating, at least 1 (TAC-051). ITM-012 — Durability loss per hit is Open.
17. **Resolved (2026-11-24):** the painted icon is now found in churches and apartments; the design drafts the location tag list (ITM-024). ITM-024 — Painted icon (rare) is found in "old houses", which is not in the rare-only location list.
    The full loot location tag list is not designed.
18. **Resolved (2026-11-24):** "its enemies" = factions with relation ≤ `hostileAt` (−50) toward the owner (ITM-028); eastern/western standing = Trusted with SSV/Varyag or VDK/Aegis (DAT-027). ITM-028 — "Its enemies" for hand-ins: relation ≤ −50 (spec choice) or any faction at war with it?
    "Eastern/western standing" for vehicles (DAT-027): which factions count?
19. **Resolved (2026-11-24):** Trusted (50+) with the listed factions or the Krug; the civilian R44 needs no standing (DAT-027). DAT-027 — Standing level for restricted vehicles ("high standing"); whether the civilian R44 needs it.
20. **Partly resolved (2026-11-24):** Mi-8 armour is class 2, cockpit only (`armourCockpitOnly`); drafts for upkeep (0.2% per day), noise ranges, fuel unit (20-litre can, 18 kg), ambulance ×2 and mine protection ×0.5 (DAT-024, DAT-026). Still open: easy-repair reduction, vehicle weapon strength. DAT-026/DAT-024 — Vehicle armour "Light (cockpit)" (Mi-8) is not an armour class; upkeep scaling,
    noise → notice distance and feature effect values are not set. Fuel capacity units (fuel cans) unclear.
21. **Resolved (cleanup 2026-11-23):** `pouchItemMaxKg` lives in data/tactical-rules.json (ITM-016). ITM-016 — `pouchItemMaxKg` is a global constant inside data/items.json; a table-level constants record
    or a rules table may be preferable.
22. **Resolved (cleanup 2026-11-23):** data/tactical-rules.json is an existing table (data/tables.json) owned by
    TAC. DAT-006/DAT-013/ITM-005/ITM-007/ITM-010/ITM-012 — Constants placed in `data/tactical-rules.json`
    (proposed); must match the table TAC uses.
23. **Resolved (design eb072a2):** the item list gives a feed type per weapon: pistols `pistol`; M249 and
    PKM `belt`; Remington 870 `tube`; every other weapon, including RPK-74, SV-98, M24 and Saiga-12,
    `boxMagazine` (DAT-011). DAT-011 — `feedType` is needed per weapon for the reload cost (TAC-041), but the item list gives none:
    which LMGs are belt-fed, and do the bolt rifles (SV-98, M24) reload as `boltAction`, `stripperClip` or
    `boxMagazine`; which shotguns are `tube`-fed? Only pistols map obviously (`pistol`).
24. **Resolved (2026-11-24):** the magazine table drafts empty weights; only listed pairs (AK-74M / RPK-74) share magazines, FAL and G3 do not (ITM-031). DAT-030/ITM-031 — Magazines have "a weight" but no values; empty magazine weights are needed for
    carried weight. Which other weapons of the same calibre and feed type share magazine patterns (e.g. FN FAL
    and HK G3, both 7.62×51 mm box)? Only the AK-74M / RPK-74 pair is stated.
25. **Resolved (2026-11-24):** refilled only between fights, never in battle; one load type per magazine (DAT-030). DAT-030 — Refilling a magazine from loose ammunition: does it happen in battle (AP cost?) or only between
    fights (vehicle storage, MGT)? Can a magazine hold mixed loads, and in what order are they fired?
26. **Resolved (2026-11-24):** the magazine mod slot is dropped (with `reloadAp` and `magazineSize` modifiers); extended magazines are magazine items (DAT-011, DAT-016). DAT-016/DAT-030 — Is the `magazine` mod slot still needed now that magazines are items (an extended
    magazine would be a `magazine` record with a larger `capacity`), or does it stay for `reloadAp` mods?
27. **Resolved (2026-11-24):** kept for later content (DAT-011). DAT-011 — `stripperClip` and `boltAction` feed types (TAC-041 reload costs) are used by no weapon in the
    item list; keep them in the enum for later content?
28. **Resolved (2026-11-24):** frag $60 uncommon, smoke $30 common; belt at most 2 grenades (ITM-032, ITM-017). ITM-032 — Do grenades have trader prices and rarity, and does the battle belt cap grenade count (the
    belt has only a weight limit)?
29. **Resolved (cleanup 2026-11-23):** schema follows DAT-002 — `weightKg` is required for `medical` and
    `magazine` too (the design gives no exemption; missing weights are entered as data); weapon `feedType` is
    required (DAT-011); the items schema checks the `modifiers` keys per mod `slot` (DAT-016).
30. **Resolved (cleanup 2026-11-23):** `data/vehicles.json` and `data/loot.json` are existing tables
    (DAT-001, DAT-024, ITM-024); `pilotTechnicalMin` and `heliMoveHours` are single values in strategic-rules
    (DAT-028 → STR-034); vehicle `armourClass` is integer or null (DAT-024).
31. **Resolved (design 44887c7):** a squad has at most one vehicle; without one it moves on foot and carries
    only what its soldiers carry (DAT-025). The checkpoint pass item and the `checkpointPass` op effect are
    removed (ITM-025, ITM-026); vehicle `profile` has no rule effect (DAT-024).
32. **Resolved (2026-11-24):** tactical mods may carry small modifiers set per mod; the schema allows `ergonomics` besides the laser's `snapShotSpread` (weight is the mod's own `weightKg`) (DAT-016). DAT-016 — The tactical sub-slot has no `modifiers` keys in the design (only its `module`); the schema
    accepts only an empty `modifiers` object there. Confirm that flashlight and laser mods never change
    profile values.
33. DAT-024 — One fuel unit is "one 20-litre fuel can, 18 kg" (design draft). Is a fuel unit a carried item
    (a fuel-can item in vehicle storage, like the barter "Diesel canister (20 l)", 18 kg, $60) or only a tank
    counter? Refuel price is $50 per unit (MGT-067), the diesel canister's barter value $60.
34. DAT-030 — With one load per magazine, refilling a partly filled magazine with a different load: the
    spec empties it back to loose rounds first. Confirm.

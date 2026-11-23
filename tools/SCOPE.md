# Tools — scope

Refreshed by `/scope` (2026-11-23, spec baseline `eb072a2`). Lists everything the tools pillar may read
outside `tools/`.

## Spec IDs

Sources: `spec/data.md` (DAT 30 IDs, ITM 32 IDs: what the editors author), `spec/tech.md` (the TEC IDs that
concern tooling) and `spec/strategic.md` › Map generation (the map tools' scope). 77 IDs. `(open)` = the
design leaves a value or rule unset; `(draft)` = design marks the values "Draft — not final"; `(optional)`
= left out of the first build iterations.

**Tables and conventions (DAT)**

| ID | Summary |
| --- | --- |
| DAT-001 | All item-like records in `data/items.json`, keyed by ID, `kind` selects the profile; vehicles in `data/vehicles.json` |
| DAT-002 | Common fields: id (= key), kind, name, weightKg (all but calibre/ammo), valueUsd, rarity, notes (never a rule) |
| DAT-003 | Units: kg (g for rounds), tiles, regions, turns / hours, USD; percentages as fractions, multipliers as factors |
| DAT-004 | `/data` holds frozen definitions only; per-instance values live in the owning state slice |

**Soldier equipment slots (DAT)**

| ID | Summary |
| --- | --- |
| DAT-005 | (draft) Seven slots: weapon1, weapon2, helmet, bodyArmour, vest, belt, backpack, with accepted kinds and access tiers |
| DAT-006 | Quick (vest, belt) at normal AP; backpack + `backpackSurcharge` (tactical-rules) |
| DAT-007 | Carried weight = all items, containers and rounds (`roundWeightG`) |
| DAT-008 | Containers accept items up to `capacityKg`; vests/plate carriers also cap per type category |
| DAT-009 | `fillsVestSlot` body armour occupies bodyArmour and vest; its `pouches` are the vest container |
| DAT-010 | Items outside slots stay on the map; vehicle storage comes home; the dead keep their slots |

**Weapon profile (DAT)**

| ID | Summary |
| --- | --- |
| DAT-011 | (draft) Weapon fields: weaponType, calibre, fireModes, magazineSize, barrelMultiplier, ergonomics, baseMoa, weightKg, recoil, modSlots, action, feedType, fireApCost |
| DAT-012 | Fire modes: integer n = rounds per trigger action, `"auto"` = full-auto burst; costs in tactical-rules |
| DAT-013 | `baseMoa` game scale: 1 point ≈ 0.17 m at 50 m; optics never change it |
| DAT-014 | (open) Weapon `condition` 0–100 is instance state; wear, jam, spread and repair curves not set |
| DAT-015 | Mod slots from `modSlots`; a handguard adds frontGrip (0–1) and tactical (1–2) sub-slots |
| DAT-016 | (draft; no mods in the item list) Mod fields: slot, fits, modifiers (allowed keys per slot), suppressor, subSlots, module |
| DAT-017 | (open) Flashlight and laser tactical modules; effect values not set |
| DAT-018 | A fitted `suppressor: true` mod makes shots suppressed for hearing |
| DAT-030 | (open) Magazine profile: calibre, feedType (pistol / boxMagazine / belt), capacity, fits; weights not set |

**Calibre and ammunition (DAT)**

| ID | Summary |
| --- | --- |
| DAT-019 | (draft) Calibre fields: designation, damage, projectiles, recoilModifier, roundWeightG (no weightKg) |
| DAT-020 | Ammo and magazines fit only weapons of the same calibre (and feedType for magazines) |
| DAT-021 | (draft) Ammo load fields: calibre, ammoType, damageModifier, falloff, falloffRangeTiles, penetrationClass, subsonic, spreadModifier, tracer, overrides |
| DAT-022 | (draft) Item editor pre-fills a new load from its ammoType defaults table |
| DAT-023 | Per-shot inputs taken from load, calibre and weapon; formulas owned by TAC |

**Vehicles (DAT)**

| ID | Summary |
| --- | --- |
| DAT-024 | (draft) Vehicle fields: vehicleType, costUsd, seats, storageKg, fuelRangeRegions, offRoad, armourClass, mineProtection, noise, profile, features, availability, requiresPilot |
| DAT-025 | A strategic squad is exactly one vehicle; one storage list ≤ `storageKg` |
| DAT-026 | (open) Feature enum (easyRepair … heavyLift) with effect owner; values not set |
| DAT-027 | Availability: where (largeCity, mechanicalPlant, krugMarket) and optional standing gate |
| DAT-028 | Helicopters: 1 h per region, pilot needs Technical ≥ `pilotTechnicalMin` (50) |
| DAT-029 | (open) Vehicle instance state (fuel, storage, condition) and loss |

**Item categories (ITM)**

| ID | Summary |
| --- | --- |
| ITM-001 | 18 weapons from the item list; pump/bolt map to `action`, feed types to `feedType` |
| ITM-002 | 8 calibres; 12 gauge keeps buckshot values only as fallback |
| ITM-003 | 30 ammo loads, one per calibre × type; spread from DAT-022 defaults |
| ITM-004 | Standard damage modifiers per ammo type (FMJ 1.0, AP 0.9, HP 1.25, Subsonic 0.8, …) |
| ITM-005 | Falloff floor `falloffFloor` 0.10 × muzzle damage (tactical-rules) |
| ITM-006 | `penetrationClass` from the load alone; never changes with distance or barrel |
| ITM-007 | Subsonic load through a suppressor heard only within 6 tiles (tactical-rules) |
| ITM-008 | `damageOverride` / `projectilesOverride` per load; 12 gauge buckshot 8 × 25, slug 1 × 90 |
| ITM-031 | (open: weights, shared patterns) One magazine per non-tube weapon (17); AK-74M / RPK-74 share; belts 100 rounds |
| ITM-009 | 5 helmets: armourClass, durability, hearingPenalty, visionConeDeg, nightVisionMount |
| ITM-010 | Hearing penalty halves suppressed hearing ranges; Altyn visor cone 90° |
| ITM-011 | 6 body armour items: armourClass, durability, fillsVestSlot, pouches, loss modifier, penalties, concealable |
| ITM-012 | (open) Armour durability is instance state; loss per hit not set |
| ITM-013 | 4 vests: capacityKg, max magazines / grenades / medical / other, quiet |
| ITM-014 | Pouch type categories: magazine, grenade, medical, other |
| ITM-015 | `other` = barter goods, op/faction items, small tools |
| ITM-016 | Pouch items must weigh ≤ `pouchItemMaxKg` (1 kg) |
| ITM-017 | (open: holster meaning) 3 battle belts: capacityKg, holsters |
| ITM-018 | 4 backpacks: capacityKg, extraAccessAp, noSprint |
| ITM-019 | 8 medical items: treats, zones, apCost, uses / hpPool, hpPerUse, duration, restoresToHp, causesPain, requiresMedical, backpackOnly |
| ITM-020 | Medical restrictions and values (IFAK 60/15, medkit 300, painkillers 4 × 10 turns, surgical kit Medical 40) |
| ITM-032 | (draft) 2 grenades (frag, smoke): effect, radiusTiles, damage, penetrationClass, durationTurns, blocksSight, loud |
| ITM-021 | 23 barter goods: weightKg, valueUsd, rarity, foundIn, barterClass, optional `contains` |
| ITM-022 | Trader buy rates: city 0.5, Krug 0.7, Krug premium 1.0 (traders) |
| ITM-023 | 1–3 daily barter deals per trader at 100% of value (traders) |
| ITM-024 | Loot rarity weights 60/30/10, rare-only locations, location tags (loot) |
| ITM-025 | 14 op/faction items: foundIn, perFaction, perPoi, opEffect, handIn |
| ITM-026 | opEffect types and params (revealSquadPlan … restockAmmo) |
| ITM-027 | Hand-in is one strategic action at a POI of the receiver; consumes the item |
| ITM-028 | Hand-in entries: receiver, moneyUsd, reputation, dailyCap, effect |
| ITM-029 | Hand-in reputation is a friendly act to the receiver only; attribution as MGT |
| ITM-030 | Op/faction items use the `other` limit and count toward weight |

**Tooling rules (TEC)**

| ID | Summary |
| --- | --- |
| TEC-011 | No build step: plain ES modules, browser + `tools/serve.ps1`; every file is the file that runs |
| TEC-012 | Rules live in pure module cores and are tested in the browser (Test Lab) without the game |
| TEC-014 | Game data is JSON in `/data`, checked against JSON Schemas (`shared/schema.js`); balancing changes data |
| TEC-015 | All randomness from `shared/rng.js`; same seed + inputs = same map and shots |
| TEC-016 | Toggleable debug overlay: AP, stamina, LOS, spread cone, AI decision logs |

**Map generation (STR, map tools' scope)**

| ID | Summary |
| --- | --- |
| STR-082 | (open) Seeded stage pipeline land → … → validate, retry up to `maxAttempts`; `mapShape` square (hex test option) |
| STR-083 | (open) Land: elevation, moisture, mountains, rivers, lakes, woods, steppe |
| STR-084 | Capital: lowland next to a river, closest to the centre |
| STR-085 | (open) Large and small cities with minimum spacing, near rivers and lowland |
| STR-086 | (open) Industry by resource rules; one POI per region |
| STR-087 | (open) Towns fill gaps; a governmental institution next to every city |
| STR-088 | (open) Asphalt spanning network + loops, dirt links, bridge/ford flags, gas stations |
| STR-089 | (open) War state: front line SSV / VDK, rival PMCs behind lines, Krug in the belt |
| STR-090 | (open) Player start FOB ≥ `startFrontDistance` from the front |
| STR-091 | (open) Validation: road reachability, oil and arms plants per side, services near start; hidden cities optional |

Tactical map generation has no TAC IDs of its own; only TAC-038 (exits and exit conditions), TAC-028
(grid) and TAC-035 (edge cover, materials) feed `data/mapgen/tactical.json` and `data/prefabs.json`
(see Open questions 6).

## Interfaces

- `spec/interfaces/data/*.schema.json` — every /data schema (forms are generated from them; read and write):
  items 0.4.0, presets 0.2.0, prefabs 0.2.0, terrain 0.2.0, missions 0.2.0, vehicles 0.2.0, factions 0.3.0,
  poi 0.3.0, events 0.3.0, tactical-rules 0.4.0, strategic-rules 0.3.0, management-rules 0.4.0,
  economy-rules 0.2.0, callsigns 0.2.0, recruitment 0.2.0, traders 0.2.0, loot 0.2.0, presentation 0.2.0,
  mapgen-strategic 0.3.0, mapgen-tactical 0.2.0, ai-doctrines 0.2.0
- `spec/interfaces/*.schema.json` — read by cross-sim and the map tools:

| Interface | Version | Used by |
| --- | --- | --- |
| `tactical_map_request.schema.json` | 0.4.0 | map tools (tactical previews), cross-sim |
| `battle_result.schema.json` | 0.3.0 | cross-sim |
| `tactical_perception_view.schema.json` | 0.3.0 | cross-sim, Test Lab (AI runs) |
| `tactical_commands.schema.json` | 0.3.0 | cross-sim, Test Lab (AI runs) |
| `strategic_perception_view.schema.json` | 0.4.0 | cross-sim |
| `strategic_commands.schema.json` | 0.4.0 | cross-sim |
| `management_requests.schema.json` | 0.3.0 | cross-sim |

## Data tables

All of `data/` (read and write), as listed in `data/tables.json` (21 tables): items, presets, prefabs,
terrain, missions, vehicles, factions, poi, events, tactical-rules, strategic-rules, management-rules,
economy-rules, callsigns, recruitment, traders, loot, presentation, mapgen/strategic, mapgen/tactical,
ai/doctrines. Schema for each: `spec/interfaces/data/<name>.schema.json` (versions above). Every table is
still empty (`{}`) as of this refresh.

## Module cores (read-only, for previews and tests)

- `modules/*/core/`, `modules/*/test/` (Test Lab runs them), `modules/*/test/fixtures/` (write: fixture export)

## Shared code

- `shared/registry.js`, `shared/schema.js`, `shared/rng.js`, `shared/state.js`

## Open questions

Found while scoping; report to the root session, do not edit `spec/`. The 22 open questions still
unresolved in `spec/data.md` › Open questions and the 9 in `spec/tech.md` › Open questions still apply.

1. **`pouchItemMaxKg` location.** ITM-016 puts it in `data/items.json`, which is keyed by record and holds
   no table constants; the schema has it in `tactical-rules.schema.json`. Spec text should follow.
2. **Required `weightKg`.** DAT-002 requires `weightKg` for every kind except calibre and ammo, but the
   `medical` and `magazine` profiles do not require it (the design gives no weights for either). The
   editor cannot flag missing weights until this is settled.
3. **`feedType` not required.** ITM-031 and TAC-041 need a `feedType` on every weapon, but the weapon
   profile in `items.schema.json` leaves it optional.
4. **Global constants on vehicle records.** `pilotTechnicalMin` and `hoursPerRegion` (DAT-028) are
   per-record properties in `vehicles.schema.json`, although they are single design values. Vehicle
   `armourClass` is "integer or null" in DAT-024 but `integer` only in the schema.
5. **Values with no field.** DAT-014 condition values (wear, jam, spread → tactical-rules; repair rate →
   management-rules) have no field in either schema, and both use `additionalProperties: false`.
   DAT-016 limits `modifiers` keys per slot, but the schema accepts any key, so the validation panel cannot
   check it.
6. **Tactical mapgen without spec.** `mapgen-tactical.schema.json` has stages (terrain, roads, prefabs,
   cover, spawns, validate) taken from the workflow, but no TAC ID specifies them; only `exits` (TAC-038)
   is grounded. The tactical map tool has no rules to check against.
7. **Spec names vs schema names.** The validation panel checks "values outside the spec's range" by
   name, but MGT Values lines are snake_case (`advance_fraction`, `callsign_min`) while the schemas are
   camelCase (`advanceFraction`, `minValue`). DAT-001 and ITM-024 still call `vehicles.json` and
   `loot.json` "proposed new tables", though both are in `data/tables.json`.

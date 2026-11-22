# Untitled Tactical RPG – Item list

Nov 22, 2026 · @Dan

**Draft — not final.** A basic starting set of items for prototyping. All values are placeholders for balancing and follow the profiles in the Data definitions section of the [Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo).

## Weapons

The barrel is part of the weapon, not a mod: each weapon has a fixed barrel length multiplier. Recoil is the gun's base value; the calibre's recoil modifier applies on top. Base MoA is on the game scale from the weapon profile: 5 (the AK-74M) spreads over a torso-plus-head target at 50 m, about 17 cm per point.

| Weapon | Type | Calibre | Fire modes | Magazine | Barrel mult. | Ergonomics | Base MoA | Weight (kg) | Recoil |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PM | Pistol | 9×18 mm | \[1\] | 8 | 0.85 | 80 | 12.5 | 0.73 | 25 |
| Glock 17 | Pistol | 9×19 mm | \[1\] | 17 | 0.9 | 85 | 10 | 0.9 | 28 |
| PP-19-01 Vityaz | Sub-machine gun | 9×19 mm | \[1, auto\] | 30 | 1.0 | 70 | 7.5 | 2.9 | 30 |
| MP5 | Sub-machine gun | 9×19 mm | \[1, 3, auto\] | 30 | 1.0 | 75 | 6.3 | 2.6 | 28 |
| Remington 870 | Shotgun (pump) | 12 gauge | \[1\] | 6 | 1.0 | 60 | 18.8 | 3.6 | 75 |
| Saiga-12 | Shotgun | 12 gauge | \[1\] | 8 | 1.0 | 50 | 18.8 | 3.6 | 70 |
| AK-74M | Assault rifle | 5.45×39 mm | \[1, auto\] | 30 | 1.0 | 55 | 5 | 3.4 | 40 |
| AKM | Assault rifle | 7.62×39 mm | \[1, auto\] | 30 | 1.0 | 50 | 6.3 | 3.3 | 45 |
| M4A1 | Assault rifle | 5.56×45 mm | \[1, auto\] | 30 | 0.95 | 65 | 3.8 | 3.1 | 35 |
| FN FAL | Battle rifle | 7.62×51 mm | \[1, auto\] | 20 | 1.1 | 40 | 3.8 | 4.3 | 50 |
| HK G3 | Battle rifle | 7.62×51 mm | \[1, auto\] | 20 | 1.1 | 40 | 3.8 | 4.4 | 50 |
| SVD | Designated marksman rifle | 7.62×54R | \[1\] | 10 | 1.15 | 35 | 2.5 | 4.3 | 45 |
| M110 | Designated marksman rifle | 7.62×51 mm | \[1\] | 20 | 1.1 | 40 | 1.9 | 5.0 | 45 |
| SV-98 | Sniper rifle (bolt) | 7.62×54R | \[1\] | 10 | 1.2 | 30 | 1.0 | 5.8 | 55 |
| M24 | Sniper rifle (bolt) | 7.62×51 mm | \[1\] | 5 | 1.2 | 30 | 1.0 | 5.4 | 55 |
| RPK-74 | Light machine gun | 5.45×39 mm | \[1, auto\] | 45 | 1.1 | 40 | 5 | 5.0 | 35 |
| M249 | Light machine gun | 5.56×45 mm | \[auto\] | 100 | 1.05 | 25 | 5 | 7.5 | 35 |
| PKM | Light machine gun | 7.62×54R | \[auto\] | 100 | 1.1 | 20 | 5 | 8.5 | 45 |

## Calibres

Damage is the base damage per projectile at the muzzle with barrel multiplier 1.0. Falloff is set per load (see Ammunition).

| Calibre | Damage | Projectiles | Recoil modifier | Round weight |
| --- | --- | --- | --- | --- |
| 9×18 mm | 42 | 1 | ×0.5 | 10 g |
| 9×19 mm | 50 | 1 | ×0.6 | 12 g |
| 5.45×39 mm | 45 | 1 | ×0.8 | 10 g |
| 5.56×45 mm | 48 | 1 | ×0.85 | 12 g |
| 7.62×39 mm | 58 | 1 | ×1.1 | 16 g |
| 7.62×51 mm | 75 | 1 | ×1.5 | 24 g |
| 7.62×54R | 78 | 1 | ×1.6 | 22 g |
| 12 gauge | 25 per pellet (buckshot) / 90 (slug) | 8 (buckshot) / 1 (slug) | ×1.6 | 40 g |

## Ammunition

Each load multiplies its calibre's damage by the standard modifier of its ammo type: FMJ ×1.0, AP ×0.9, HP ×1.25, Subsonic ×0.8, Tracer ×1.0, Buckshot and Slug ×1.0 (the 12 gauge damage already differs by load). **Falloff** is the share of muzzle damage a load loses over its own falloff range; damage never drops below 10% of muzzle damage. Placeholder ranges by ammo type: FMJ and Tracer 15 tiles, AP 18, HP 12, Subsonic 10, Buckshot and Slug 15. Penetration class is the highest armour class the round defeats (0 = unarmoured targets only); it never changes with distance. Subsonic loads fired through a suppressor are heard only within 6 tiles. For reference: a thorax has 85 base HP, a head 35.

| Calibre | Ammo | Damage modifier | Falloff (% of damage) | Falloff range (tiles) | Penetration class | Subsonic |
| --- | --- | --- | --- | --- | --- | --- |
| 9×18 mm | FMJ | ×1.0 | 25% | 15 | 1 | Yes (by nature) |
| 9×18 mm | AP | ×0.9 | 25% | 18 | 2 | Yes |
| 9×18 mm | HP | ×1.25 | 25% | 12 | 0 | Yes |
| 9×19 mm | FMJ | ×1.0 | 19% | 15 | 1 | No |
| 9×19 mm | AP | ×0.9 | 19% | 18 | 2 | No |
| 9×19 mm | HP | ×1.25 | 19% | 12 | 0 | No |
| 9×19 mm | Subsonic | ×0.8 | 19% | 10 | 1 | Yes |
| 5.45×39 mm | FMJ | ×1.0 | 6% | 15 | 3 | No |
| 5.45×39 mm | AP | ×0.9 | 6% | 18 | 4 | No |
| 5.45×39 mm | HP | ×1.25 | 6% | 12 | 1 | No |
| 5.45×39 mm | Tracer | ×1.0 | 6% | 15 | 3 | No |
| 5.56×45 mm | FMJ | ×1.0 | 6% | 15 | 3 | No |
| 5.56×45 mm | AP | ×0.9 | 6% | 18 | 4 | No |
| 5.56×45 mm | HP | ×1.25 | 6% | 12 | 1 | No |
| 5.56×45 mm | Tracer | ×1.0 | 6% | 15 | 3 | No |
| 7.62×39 mm | FMJ | ×1.0 | 9% | 15 | 3 | No |
| 7.62×39 mm | AP | ×0.9 | 9% | 18 | 4 | No |
| 7.62×39 mm | HP | ×1.25 | 9% | 12 | 1 | No |
| 7.62×39 mm | Subsonic | ×0.8 | 9% | 10 | 2 | Yes |
| 7.62×39 mm | Tracer | ×1.0 | 9% | 15 | 3 | No |
| 7.62×51 mm | FMJ | ×1.0 | 5% | 15 | 4 | No |
| 7.62×51 mm | AP | ×0.9 | 5% | 18 | 6 | No |
| 7.62×51 mm | HP | ×1.25 | 5% | 12 | 2 | No |
| 7.62×51 mm | Tracer | ×1.0 | 5% | 15 | 4 | No |
| 7.62×54R | FMJ | ×1.0 | 6% | 15 | 4 | No |
| 7.62×54R | AP | ×0.9 | 6% | 18 | 6 | No |
| 7.62×54R | HP | ×1.25 | 6% | 12 | 2 | No |
| 7.62×54R | Tracer | ×1.0 | 6% | 15 | 4 | No |
| 12 gauge | Buckshot | ×1.0 | 56% | 15 | 0 | No |
| 12 gauge | Slug | ×1.0 | 33% | 15 | 2 | No |

## Helmets

| Helmet | Armour class | Durability | Weight (kg) | Notes |
| --- | --- | --- | --- | --- |
| SSh-68 steel helmet | 2 | 30 | 1.5 | Cheap, common |
| PASGT | 3 | 45 | 1.4 |  |
| 6B47 | 3 | 45 | 1.3 |  |
| High-cut ballistic helmet | 4 | 50 | 1.1 | Mounts for night vision; no hearing penalty |
| Altyn with visor | 5 | 60 | 4.0 | Visor covers the face; hearing penalty; vision cone 90° instead of 120° |

## Body armour

| Body armour | Armour class | Durability | Weight (kg) | Pouches: capacity (kg) / max magazines / grenades / medical / other | Notes |
| --- | --- | --- | --- | --- | --- |
| Soft armour vest | 2 | 40 | 2.0 | — | Concealable, stops pistol rounds |
| 6B23 | 4 | 60 | 8.0 | — |  |
| Plate carrier, steel plates | 4 | 70 | 9.0 | 4 / 4 / 2 / 2 / 1 | Durable, heavy; also fills the vest slot |
| Plate carrier, ceramic plates | 5 | 55 | 8.0 | 5 / 6 / 2 / 2 / 2 | Loses durability fast; also fills the vest slot |
| 6B13 | 5 | 70 | 10.5 | — |  |
| Heavy assault armour | 6 | 85 | 14.0 | — | Large stamina and AP penalties |

## Load-bearing vests

| Vest | Capacity (kg) | Max magazines | Max grenades | Max medical items | Max other items | Own weight (kg) | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lifchik (old-pattern rig) | 4 | 4 | 2 | 1 | 1 | 0.8 | Cheap, common |
| Commercial chest rig | 5 | 4 | 2 | 2 | 2 | 1.0 |  |
| MOLLE tactical vest | 7 | 6 | 4 | 3 | 3 | 1.6 |  |
| Low-profile recon rig | 3 | 3 | 1 | 2 | 1 | 0.5 | Quiet; small |

**Other items** covers everything that is not a magazine, grenade or medical item: barter goods, operation and faction items, and small tools. Only items up to 1 kg fit in a vest or plate carrier pouch; heavier ones (car battery, diesel canister, toolbox, crates, plant spare parts, demolition charges, bolt cutters) go in a backpack.

## Battle belts

| Battle belt | Holster | Capacity (kg) | Own weight (kg) |
| --- | --- | --- | --- |
| Leather belt | 1 | 1.5 | 0.3 |
| Padded battle belt | 1 | 3 | 0.7 |
| Heavy battle belt | 1 | 4.5 | 1.1 |

## Backpacks

| Backpack | Capacity (kg) | Own weight (kg) | Notes |
| --- | --- | --- | --- |
| Duffel bag | 15 | 0.6 | Awkward: extra AP to use |
| Patrol pack | 20 | 1.2 |  |
| Assault pack | 25 | 1.5 |  |
| Large rucksack | 35 | 2.5 | No sprinting while worn |

## Medical items

| Item | Treats | AP cost | Uses | Notes |
| --- | --- | --- | --- | --- |
| Bandage | Light bleeding | 3 | 1 |  |
| Tourniquet | Heavy bleeding on an arm or leg | 2 | 1 | Causes pain |
| Hemostatic dressing | Heavy bleeding in any zone | 4 | 1 | Only fix for thorax and head bleeding in the field |
| Splint | Fracture | 5 | 1 |  |
| Painkillers | Pain | 2 | 4 | Effect lasts 10 turns |
| IFAK (individual first aid kit) | Restores HP; stops light bleeding | 6 | 60 HP total | Up to 15 HP per use |
| Medkit | Restores HP; stops light and heavy bleeding | 8 | 300 HP total | Large; backpack item |
| Surgical kit | Brings an arm or leg at 0 HP back to 1 HP | 15 | 3 | Needs Medical 40+ |

## Barter goods

Civilian items with no use in combat. They are sold for money or traded for gear. Value is the full barter value in US dollars.

| Item | Weight (kg) | Value | Rarity | Found in |
| --- | --- | --- | --- | --- |
| Cigarettes (pack) | 0.02 | $15 | Common | Bodies, houses, checkpoints |
| Cigarettes (carton) | 0.25 | $150 | Uncommon | Shops, warehouses, convoys |
| Vodka (bottle) | 0.8 | $30 | Common | Houses, shops, checkpoints |
| Instant coffee | 0.2 | $20 | Common | Houses, shops |
| Black tea | 0.1 | $10 | Common | Houses, shops |
| Sugar (1 kg) | 1.0 | $8 | Common | Houses, shops, warehouses |
| Salt (1 kg) | 1.0 | $5 | Common | Houses, shops |
| Canned meat | 0.4 | $12 | Common | Houses, depots, convoys |
| Chocolate bar | 0.1 | $8 | Common | Bodies, shops |
| Matches | 0.02 | $2 | Common | Everywhere |
| Lighter | 0.03 | $5 | Common | Bodies, houses |
| AA batteries (4) | 0.1 | $10 | Common | Houses, shops, offices |
| Car battery | 15.0 | $80 | Uncommon | Garages, vehicle wrecks |
| Diesel canister (20 l) | 18.0 | $60 | Uncommon | Garages, farms, depots |
| Copper wire (coil) | 5.0 | $40 | Uncommon | Industry, power lines |
| Toolbox | 6.0 | $90 | Uncommon | Garages, industry |
| Mobile phone | 0.2 | $60 | Uncommon | Bodies, houses, offices |
| Old laptop | 2.5 | $150 | Uncommon | Offices, apartments |
| Wristwatch | 0.1 | $120 | Uncommon | Bodies, apartments |
| Foreign banknotes (bundle) | 0.1 | $100 | Uncommon | Bodies, safes |
| Painted icon | 0.5 | $200 | Rare | Churches, old houses |
| Wedding ring | 0.01 | $250 | Rare | Bodies, apartments |
| Gold chain | 0.05 | $400 | Rare | Bodies, safes |

**Trading rules**

- City traders buy barter goods at 50% of value; the Krug market pays 70%, and 100% for tobacco, alcohol and valuables (watch, banknotes, icon, ring, chain).
- Each trader offers 1–3 barter deals per day: a gear item for a list of goods, counted at 100% of value (for example an AK-74M for two cartons of cigarettes and a gold chain).
- Barter deals are the only source of some rare gear at a trader; they are refreshed at the daily tick.
- Loot rolls use rarity weights common 60 / uncommon 30 / rare 10; rare goods appear only in apartments, safes, churches and on bodies.

## Operation and faction items

Items that open options during operations or can be handed in to a faction for money and reputation. A hand-in takes one player action at a point of interest held by that faction, or at a Krug market for the Krug.

| Item | Weight (kg) | Found on or in | Use in operations | Hand-in |
| --- | --- | --- | --- | --- |
| Dog tags (per faction) | 0.01 | Dead faction soldiers | — | Own faction: +1 reputation each (max 5 per day); its enemies: $50 each |
| Field orders | 0.3 | Squad leaders, command posts | Read: shows that squad's goal and route for 72 hours | Its enemies: $300, +3 reputation |
| Encrypted radio | 1.5 | Radio operators, command vehicles | Carried by a squad: shows that faction's squads in adjacent regions for 7 days | Its enemies: $800, +5 reputation |
| Codebook | 0.2 | Officers, command posts | With an encrypted radio of the same faction: range 2 regions, duration 14 days | Its enemies: $1,000, +5 reputation |
| Checkpoint pass (per faction) | 0.01 | Officers, command posts | That faction's checkpoints let the squad pass without an encounter for 7 days, while standing is above −50 | — |
| Western satellite phone | 1.0 | Western-backed officers, Aegis | — | SSV or Varyag: $1,200, +5 reputation |
| Hard drive with data | 0.3 | Offices, PMC command posts, old laptops (10%) | — | Rival of the owning PMC: $1,500, +5 reputation; the Krug: $2,000, no reputation |
| Demolition charge | 2.0 | Military depots, engineers | Destroys a wall or a vehicle; required for sabotage objectives (bridges, plants) | — |
| Bolt cutters | 2.0 | Warehouses, industry | Opens locked gates and containers silently (10 AP) | — |
| POI key | 0.01 | Guards of that point of interest | Opens the locked rooms of one point of interest | — |
| Plant spare parts | 10.0 | Industrial points of interest | — | Faction holding a plant: $500, +3 reputation, plant output +25% for 7 days |
| Medical supply crate | 15.0 | Hospitals, convoys | Restocks a squad with 4 bandages and 2 tourniquets once | Faction holding a city: +4 reputation; a resistance group: +10 standing with it |
| Ammunition crate | 20.0 | Depots, convoys | Restocks a squad's loose ammo once | A resistance group: +10 standing, the group lasts 7 days longer |
| Krug marker | 0.01 | Krug members, Krug caches | — | The Krug: +3 standing; sold to anyone else: −10 Krug standing if a Krug member survives to report it |

**Hand-in rules**

- Reputation from hand-ins goes through applyRep as a friendly act toward the receiving faction, including spillover.
- A hand-in is never attributed to the faction it hurts; only a survivor at the scene of the loot can report it, like any other hostile act.
- Faction items count toward weight and use the "other" type limit in vests and plate carriers.

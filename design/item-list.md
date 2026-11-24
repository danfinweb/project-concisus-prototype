# Concisus – Item list

Nov 22, 2026 · @Dan

**Draft — not final.** A basic starting set of items for prototyping. All values are placeholders for balancing and follow the profiles in the Data definitions section of the [Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo).

## Weapons

The barrel is part of the weapon, not a mod: each weapon has a fixed barrel length multiplier. Recoil is the gun's base value; the calibre's recoil modifier applies on top. Base MoA is on the game scale from the weapon profile: 5 (the AK-74M) spreads over a torso-plus-head target at 50 m, about 17 cm per point.

| Weapon | Type | Calibre | Fire modes | Magazine | Feed type | Barrel mult. | Ergonomics | Base MoA | Weight (kg) | Recoil |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PM | Pistol | 9×18 mm | \[1\] | 8 | Pistol | 0.85 | 80 | 12.5 | 0.73 | 25 |
| Glock 17 | Pistol | 9×19 mm | \[1\] | 17 | Pistol | 0.9 | 85 | 10 | 0.9 | 28 |
| PP-19-01 Vityaz | Sub-machine gun | 9×19 mm | \[1, auto\] | 30 | Box magazine | 1.0 | 70 | 7.5 | 2.9 | 30 |
| MP5 | Sub-machine gun | 9×19 mm | \[1, 3, auto\] | 30 | Box magazine | 1.0 | 75 | 6.3 | 2.6 | 28 |
| Remington 870 | Shotgun (pump) | 12 gauge | \[1\] | 6 | Tube | 1.0 | 60 | 18.8 | 3.6 | 75 |
| Saiga-12 | Shotgun | 12 gauge | \[1\] | 8 | Box magazine | 1.0 | 50 | 18.8 | 3.6 | 70 |
| AK-74M | Assault rifle | 5.45×39 mm | \[1, auto\] | 30 | Box magazine | 1.0 | 55 | 5 | 3.4 | 40 |
| AKM | Assault rifle | 7.62×39 mm | \[1, auto\] | 30 | Box magazine | 1.0 | 50 | 6.3 | 3.3 | 45 |
| M4A1 | Assault rifle | 5.56×45 mm | \[1, auto\] | 30 | Box magazine | 0.95 | 65 | 3.8 | 3.1 | 35 |
| FN FAL | Battle rifle | 7.62×51 mm | \[1, auto\] | 20 | Box magazine | 1.1 | 40 | 3.8 | 4.3 | 50 |
| HK G3 | Battle rifle | 7.62×51 mm | \[1, auto\] | 20 | Box magazine | 1.1 | 40 | 3.8 | 4.4 | 50 |
| SVD | Designated marksman rifle | 7.62×54R | \[1\] | 10 | Box magazine | 1.15 | 35 | 2.5 | 4.3 | 45 |
| M110 | Designated marksman rifle | 7.62×51 mm | \[1\] | 20 | Box magazine | 1.1 | 40 | 1.9 | 5.0 | 45 |
| SV-98 | Sniper rifle (bolt) | 7.62×54R | \[1\] | 10 | Box magazine | 1.2 | 30 | 1.0 | 5.8 | 55 |
| M24 | Sniper rifle (bolt) | 7.62×51 mm | \[1\] | 5 | Box magazine | 1.2 | 30 | 1.0 | 5.4 | 55 |
| RPK-74 | Light machine gun | 5.45×39 mm | \[1, auto\] | 40 | Box magazine | 1.1 | 40 | 5 | 5.0 | 35 |
| M249 | Light machine gun | 5.56×45 mm | \[auto\] | 100 | Belt | 1.05 | 25 | 5 | 7.5 | 35 |
| PKM | Light machine gun | 7.62×54R | \[auto\] | 100 | Belt | 1.1 | 20 | 5 | 8.5 | 45 |

**Trader prices (draft).** Full price in US dollars at a faction trader.

| Weapon | Price (draft) |
| --- | --- |
| PM | $150 |
| Glock 17 | $400 |
| PP-19-01 Vityaz | $600 |
| MP5 | $900 |
| Remington 870 | $350 |
| Saiga-12 | $650 |
| AK-74M | $700 |
| AKM | $600 |
| M4A1 | $1,200 |
| FN FAL | $1,100 |
| HK G3 | $1,000 |
| SVD | $1,500 |
| M110 | $3,000 |
| SV-98 | $2,500 |
| M24 | $2,800 |
| RPK-74 | $1,100 |
| M249 | $3,500 |
| PKM | $2,500 |

**Feed type** sets the reload cost (see Tactical actions). **Magazines are items:** each magazine has a calibre, a capacity, a weight and the weapons it fits, and its rounds are counted; it is refilled from loose ammunition only between fights, never in battle, and holds one load type at a time: refilling it with a different load first returns its rounds to loose ammunition. Magazines of the same pattern are shared: the RPK-74's 40-round magazine and the AK-74M's 30-round magazine fit both weapons. Only the pairs listed in the magazine table below share magazines; the FN FAL and HK G3 do not, although both fire 7.62×51 mm. An extended magazine is its own magazine item with a larger capacity, not a mod. Stripper-clip and bolt-action feeds are kept for later content; no weapon here uses them yet. Belts work the same way for belt-fed weapons; tube-fed shotguns load loose shells.

| Magazine | Fits | Rounds | Empty weight (kg, draft) | Price (draft) |
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

## Calibres

Damage is the base damage per projectile at the muzzle with barrel multiplier 1.0. Falloff is set per load (see Ammunition). 12 gauge sets damage and projectile count per load (buckshot 8 × 25, slug 1 × 90).

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

Each load multiplies its calibre's damage by the standard modifier of its ammo type: FMJ ×1.0, AP ×0.9, HP ×1.25, Subsonic ×0.8, Tracer ×1.0, Buckshot and Slug ×1.0 (the 12 gauge damage already differs by load). **Falloff** is the share of muzzle damage a load loses over its own falloff range; damage never drops below 10% of muzzle damage. Placeholder ranges by ammo type: FMJ and Tracer 15 tiles, AP 18, HP 12, Subsonic 10, Buckshot and Slug 15. Penetration class is the highest armour class the round defeats (0 = unarmoured targets only); it never changes with distance. Subsonic loads fired through a suppressor are heard only within 6 tiles. Tracer loads lower burst recoil spread ×0.85 (draft). Spread modifier by ammo type (draft): Subsonic ×1.1, Slug ×0.5, every other load ×1.0. For reference: a thorax has 85 base HP, a head 35.

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

**Ammunition prices (draft).** Price per round at a faction trader for FMJ (buckshot for 12 gauge); other loads multiply it: AP ×3, HP ×1.5, Subsonic ×2, Tracer ×1.2, Slug ×1.5.

| Calibre | Price per round (draft) |
| --- | --- |
| 9×18 mm | $0.30 |
| 9×19 mm | $0.40 |
| 5.45×39 mm | $0.50 |
| 5.56×45 mm | $0.60 |
| 7.62×39 mm | $0.50 |
| 7.62×51 mm | $1.20 |
| 7.62×54R | $1.00 |
| 12 gauge | $0.80 |

## Helmets

| Helmet | Armour class | Durability | Weight (kg) | Notes |
| --- | --- | --- | --- | --- |
| SSh-68 steel helmet | 2 | 30 | 1.5 | Cheap, common |
| PASGT | 3 | 45 | 1.4 |  |
| 6B47 | 3 | 45 | 1.3 |  |
| High-cut ballistic helmet | 4 | 50 | 1.1 | No hearing penalty |
| Altyn with visor | 5 | 60 | 4.0 | Visor counts as part of the head protection; hearing penalty; vision cone 90° instead of 120° |

| Helmet | Price (draft) |
| --- | --- |
| SSh-68 steel helmet | $80 |
| PASGT | $300 |
| 6B47 | $350 |
| High-cut ballistic helmet | $900 |
| Altyn with visor | $1,500 |

## Body armour

| Body armour | Armour class | Durability | Weight (kg) | Pouches: capacity (kg) / max magazines / grenades / medical / other | Notes |
| --- | --- | --- | --- | --- | --- |
| Soft armour vest | 2 | 40 | 2.0 | — | Concealable, stops pistol rounds |
| 6B23 | 4 | 60 | 8.0 | — |  |
| Plate carrier, steel plates | 4 | 70 | 9.0 | 4 / 4 / 2 / 2 / 1 | Durable, heavy; also fills the vest slot |
| Plate carrier, ceramic plates | 5 | 55 | 8.0 | 5 / 6 / 2 / 2 / 2 | Loses durability fast (wear ×1.5); also fills the vest slot |
| 6B13 | 5 | 70 | 10.5 | — |  |
| Heavy assault armour | 6 | 85 | 14.0 | — | −5 AP on every activation (draft); no stamina penalty |

| Body armour | Price (draft) |
| --- | --- |
| Soft armour vest | $250 |
| 6B23 | $600 |
| Plate carrier, steel plates | $700 |
| Plate carrier, ceramic plates | $1,400 |
| 6B13 | $1,100 |
| Heavy assault armour | $2,500 |

## Load-bearing vests

| Vest | Capacity (kg) | Max magazines | Max grenades | Max medical items | Max other items | Own weight (kg) | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lifchik (old-pattern rig) | 4 | 4 | 2 | 1 | 1 | 0.8 | Cheap, common |
| Commercial chest rig | 5 | 4 | 2 | 2 | 2 | 1.0 |  |
| MOLLE tactical vest | 7 | 6 | 4 | 3 | 3 | 1.6 |  |
| Low-profile recon rig | 3 | 3 | 1 | 2 | 1 | 0.5 | Quiet; small |

| Vest | Price (draft) |
| --- | --- |
| Lifchik (old-pattern rig) | $40 |
| Commercial chest rig | $120 |
| MOLLE tactical vest | $250 |
| Low-profile recon rig | $200 |

**Other items** covers everything that is not a magazine, grenade or medical item: barter goods, operation and faction items, and small tools. Only items up to 1 kg fit in a vest, plate carrier or belt pouch; heavier ones (car battery, diesel canister, toolbox, crates, plant spare parts, demolition charges, bolt cutters) go in a backpack.

## Battle belts

| Battle belt | Holster | Capacity (kg) | Max magazines (draft) | Max grenades (draft) | Max medical items (draft) | Max other items (draft) | Own weight (kg) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Leather belt | 1 | 1.5 | 2 | 2 | 1 | 1 | 0.3 |
| Padded battle belt | 1 | 3 | 3 | 2 | 2 | 1 | 0.7 |
| Heavy battle belt | 1 | 4.5 | 4 | 2 | 2 | 2 | 1.1 |

The holster holds a sidearm (a pistol) as an extra third weapon, beside weapons 1 and 2; the holstered pistol counts toward the belt's capacity. Belt pouches follow the vest rules: only items up to 1 kg, and the type limits in the table above.

| Battle belt | Price (draft) |
| --- | --- |
| Leather belt | $20 |
| Padded battle belt | $90 |
| Heavy battle belt | $150 |

## Backpacks

| Backpack | Capacity (kg) | Own weight (kg) | Notes |
| --- | --- | --- | --- |
| Duffel bag | 15 | 0.6 | Awkward: extra AP to use |
| Patrol pack | 20 | 1.2 |  |
| Assault pack | 25 | 1.5 |  |
| Large rucksack | 35 | 2.5 | No sprinting while worn |

| Backpack | Price (draft) |
| --- | --- |
| Duffel bag | $30 |
| Patrol pack | $120 |
| Assault pack | $180 |
| Large rucksack | $250 |

## Medical items

| Item | Treats | AP cost | Uses | Notes |
| --- | --- | --- | --- | --- |
| Bandage | Light bleeding | 3 | 1 |  |
| Tourniquet | Heavy bleeding on an arm or leg | 2 | 1 | Causes pain |
| Hemostatic dressing | Heavy bleeding in any zone | 4 | 1 | Light and quick; the medkit also stops heavy bleeding in any zone |
| Splint | Fracture | 5 | 1 |  |
| Painkillers | Pain | 2 | 4 | Effect lasts 10 turns |
| IFAK (individual first aid kit) | Restores HP; stops light bleeding | 6 | 60 HP total | 15 HP per use before the Medical multiplier, so a skilled medic heals more |
| Medkit | Restores HP; stops light and heavy bleeding | 8 | 300 HP total | Large; backpack item |
| Surgical kit | Brings an arm or leg at 0 HP back to 1 HP | 15 | 3 | Needs Medical 40+ |

The medkit restores 40 HP per use before the Medical multiplier (draft).

| Medical item | Weight (kg, draft) | Price (draft) |
| --- | --- | --- |
| Bandage | 0.05 | $10 |
| Tourniquet | 0.1 | $25 |
| Hemostatic dressing | 0.1 | $40 |
| Splint | 0.2 | $30 |
| Painkillers | 0.05 | $20 |
| IFAK | 0.4 | $80 |
| Medkit | 2.0 | $400 |
| Surgical kit | 1.5 | $600 |

## Grenades

**Draft — placeholder values.** Grenades go in the vest's grenade pouches or the belt, at most 2 (draft) (from the backpack +4 AP, see Tactical actions). Strength sets the throwing distance; a wounded or disabled arm widens the landing scatter.

| Grenade | Weight (kg) | Effect | Radius (tiles) | Duration | Notes |
| --- | --- | --- | --- | --- | --- |
| Frag grenade | 0.6 | Damage 100 at the point of impact, falling evenly to 0 at the edge; penetration class 2; full cover between the blast and a soldier blocks it, half cover halves it; the damage is split over the six body zones by their share of the silhouette, each checked against its own armour | 4 | Instant, on landing | Loud: heard across the map |
| Smoke grenade | 0.5 | Smoke cloud that blocks sight into, out of and through it; no damage | 3 | 4 turns | Quiet |

| Grenade | Price (draft) | Rarity (draft) |
| --- | --- | --- |
| Frag grenade | $60 | Uncommon |
| Smoke grenade | $30 | Common |

## Mods

**Draft — placeholder values.** A first set of optics and one laser. Optics multiply the range part of shooter spread; a laser multiplies shooter spread on snap shots (see Hit model in the GDD). Each mod lists the weapons it fits (set in the item editor). Tactical mods (laser, flashlight) may also carry small modifiers such as weight or ergonomics, set per mod.

| Mod | Slot | Effect | Weight (kg) |
| --- | --- | --- | --- |
| Red dot sight | Optic | Range spread ×0.8 | 0.2 |
| 4× scope | Optic | Range spread ×0.5 | 0.5 |
| Sniper scope | Optic | Range spread ×0.3 | 0.7 |
| Laser module | Tactical | Snap-shot spread ×0.8; visible to enemies | 0.15 |

| Mod | Price (draft) |
| --- | --- |
| Red dot sight | $250 |
| 4× scope | $600 |
| Sniper scope | $1,200 |
| Laser module | $300 |

## Barter goods

Civilian items with no use in combat. They are sold for money or traded for gear. Value is the full barter value in US dollars.

| Item | Weight (kg) | Value | Rarity | Found in |
| --- | --- | --- | --- | --- |
| Cigarettes (pack) | 0.02 | $15 | Common | Bodies, houses |
| Cigarettes (carton) | 0.25 | $150 | Uncommon | Shops, warehouses, convoys |
| Vodka (bottle) | 0.8 | $30 | Common | Houses, shops |
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
| Painted icon | 0.5 | $200 | Rare | Churches, apartments |
| Wedding ring | 0.01 | $250 | Rare | Bodies, apartments |
| Gold chain | 0.05 | $400 | Rare | Bodies, safes |

**Trading rules**

- City traders buy barter goods at 50% of value; the Krug market pays 70%, and 100% for tobacco, alcohol and valuables (watch, banknotes, icon, ring, chain). Traders buy gear (weapons, magazines, ammunition, armour, vests, belts, backpacks, mods, medical items, grenades and operation items they sell) at 40% of its trader price; the Krug market pays 50% (draft).
- Each trader offers 1–3 barter deals per day: a gear item for a list of goods, counted at 100% of value (for example an AK-74M for two cartons of cigarettes and a gold chain).
- Barter deals are the only source of some rare gear at a trader; they are refreshed at the daily tick.
- Loot rolls use rarity weights common 60 / uncommon 30 / rare 10; rare goods appear only in apartments, safes, churches and on bodies.
- Loot location tags (draft): bodies, houses, apartments, shops, offices, warehouses, depots, military depots, garages, farms, industry, power lines, churches, safes, hospitals, command posts, convoys, vehicle wrecks, Krug caches. "Everywhere" means any tag.

## Operation and faction items

Items that open options during operations or can be handed in to a faction for money and reputation. A hand-in takes one player action at a point of interest held by that faction, or at a Krug market for the Krug.

| Item | Weight (kg) | Found on or in | Use in operations | Hand-in |
| --- | --- | --- | --- | --- |
| Dog tags (per faction) | 0.01 | Dead faction soldiers | — | Own faction: +1 reputation each (max 5 per day); its enemies: $50 each |
| Field orders | 0.3 | Squad leaders, command posts | Read: shows that squad's goal and route for 72 hours | Its enemies: $300, +3 reputation |
| Encrypted radio | 1.5 | Radio operators, command vehicles | Carried by a squad: shows that faction's squads in adjacent regions for 7 days | Its enemies: $800, +5 reputation |
| Codebook | 0.2 | Officers, command posts | With an encrypted radio of the same faction: range 2 regions, duration 14 days | Its enemies: $1,000, +5 reputation |
| Western satellite phone | 1.0 | Western-backed officers, Aegis | — | SSV or Varyag: $1,200, +5 reputation |
| Hard drive with data | 0.3 | Offices, PMC command posts, old laptops (10%) | — | Rival of the owning PMC: $1,500, +5 reputation; the Krug: $2,000, no reputation |
| Demolition charge | 2.0 | Military depots, engineers | Destroys a wall or a vehicle; required for sabotage objectives (bridges, plants) | — |
| Bolt cutters | 2.0 | Warehouses, industry | Opens locked gates and containers silently (10 AP) | — |
| POI key | 0.01 | Guards of that point of interest | Opens the locked rooms of one point of interest | — |
| Plant spare parts | 10.0 | Industrial points of interest | — | Faction holding a plant: $500, +3 reputation, plant output +25% for 7 days |
| Medical supply crate | 15.0 | Hospitals, convoys | Restocks a squad with 4 bandages and 2 tourniquets once | Faction holding a city: +4 reputation; a resistance group: +10 standing with it |
| Ammunition crate | 20.0 | Depots, convoys | Restocks a squad's loose ammo once | A resistance group: +10 standing, the group lasts 7 days longer |
| Krug marker | 0.01 | Krug members, Krug caches | — | The Krug: +3 standing; sold to anyone else: −10 Krug standing if a Krug member survives to report it |

Traders sell only these operation items; the others are found, never bought.

| Item | Price (draft) |
| --- | --- |
| Demolition charge | $400 |
| Bolt cutters | $60 |
| Medical supply crate | $150 |
| Ammunition crate | $500 |

**Hand-in rules**

- Reputation from hand-ins goes through applyRep as a friendly act toward the receiving faction.
- A hand-in is never attributed to the faction it hurts; only a survivor at the scene of the loot can report it, like any other hostile act.
- Faction items count toward weight and use the "other" type limit in vests and plate carriers.
- "Its enemies" means every faction whose relation toward the item's owner is at or below the hostile threshold (−50).

# Concisus – Data definitions

Nov 24, 2026 · @Dan

Static content the tools author into `/data`. Every module reads it; none changes it. Concrete items and ammunition are in the [Item list](https://claude.ai/artifact/3ZE9h1z8kMDFDuWB4muJRJ). Part of the [Concisus – Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo), which holds the overview, factions & campaign and the module map.

## Soldier equipment slots (draft)

**Draft — not final.** Each soldier has seven equipment slots. Everything carried counts toward weight (carry capacity, stamina costs, sprint penalties).

| Slot | Holds | Effect in play |
| --- | --- | --- |
| Weapon 1 | Any weapon type | Equipped weapon; switching between the two costs AP (Agility and weapon weight, see Tactical actions) |
| Weapon 2 | Any weapon type | Second equipped weapon, e.g. a rifle and a pistol, or a rifle and a shotgun |
| Helmet | Head protection | Armour class for the head zone; heavier helmets can narrow hearing (noise detection) |
| Body armour | Plates or soft armour | Armour class for the thorax zone; durability wears with each hit |
| Load-bearing vest | Item list, small weight limit | Quick access: magazines, grenades and medical items used from here at normal AP cost |
| Battle belt | Item list, small weight limit | Quick access like the vest; typically spare magazines, pistol ammo, a tourniquet |
| Backpack | Item list, large weight limit | Slow access: using an item from it costs extra AP; holds loot and spare gear; can be dropped in combat to move lighter |

- **Access tiers:** vest and belt are quick, the backpack is slow — what a soldier keeps where matters in a fight.
- **Loot:** anything not in a slot or inventory stays on the map; whatever reaches the vehicle's storage can be brought home.
- **Type limits:** load-bearing vests and plate carriers also cap how many items of each type they hold — magazines, grenades, medical items and other items — on top of their weight limit. A plate carrier with pouches fills both the body armour and the vest slot.
- **Death:** everything in these seven slots stays on the body unless recovered.

## Weapon profile (draft)

**Draft — not final.** Every gun is defined by the profile below; mods change these values directly.

| Attribute | Type | Meaning | Drives |
| --- | --- | --- | --- |
| Weapon type | Category | Pistol, shotgun, sub-machine gun, assault rifle, battle rifle, designated marksman rifle, sniper rifle, light machine gun | Animations, AI role, trader and loot categories |
| Calibre | Ammo type reference | The cartridge the gun fires; the loaded ammo defines its exact values | Which ammo fits; modifies the gun's Recoil |
| Fire modes | List of rounds per trigger action, e.g. \[1, 3\] or \[1, auto\] | Semi-auto, burst and full-auto options; the burst length is the weapon's own (e.g. 2 or 3 rounds) | Rounds and AP per shot action; recoil builds within a burst |
| Magazine size | Rounds | Capacity of the standard magazine | Shots before reloading |
| Barrel multiplier | Factor around 1.0 | Fixed per weapon by its barrel length, not changed by mods: short barrels below 1.0, long barrels above | Multiplies the calibre's damage |
| Ergonomics | 1–100 | Handling and balance | AP cost to fire and reload (see Tactical actions) |
| Base MoA | Minutes of angle | Mechanical accuracy on a game scale, not real minutes of angle: Base MoA 5 (an average assault rifle) spreads over a torso-plus-head target at 50 m (about 33 tiles), the thorax and head hitboxes together, 0.83 m from the bottom of the thorax to the top of the head. 1 point ≈ 17 cm of spread at 50 m, 33 cm at 100 m; the cone's width is where nearly all shots land | Base spread of every shot |
| Weight | kg | Weight with standard magazine | Carry capacity, stamina costs, sprint penalties |
| Recoil | 1–100 | Base kick per shot; multiplied by the calibre's recoil modifier | Spread added per follow-up round; reduced by Marksmanship |
| Mod slots | List | Muzzle, stock, pistol grip, optic, handguard (with its own sub-slots); the barrel is fixed. There is no magazine slot: magazines are items | Which mods fit |

**State, not profile:** each individual gun also tracks **Condition** (0–100). Wear raises jam chance and spread (see Armour wear and weapon condition in the Tactical Layer); repaired with the Technical attribute.

**How mods change the profile**

- Muzzle devices: recoil, flash. Suppressors: shorten how far shots are heard (see Gunshot noise).
- Stocks and pistol grips: ergonomics, recoil.
- Handguards: ergonomics and weight, and they decide which sub-slots exist — whether a front grip can be fitted, and one or two tactical module slots.
  - Front grips: ergonomics, recoil.
  - Tactical modules: flashlight (restores full day sight range at night and can blind enemies in its cone, but reveals the carrier), laser (reduces shooter spread for hip and snap shots, visible to enemies). A tactical module may also have small modifiers (e.g. weight, ergonomics), set per mod in data.
- Magazines are items, not mods: an extended magazine is a magazine item with a larger capacity.
- Optics: reduce shooter spread at range; they do not change Base MoA.

## Calibre profile (draft)

**Draft — not final.** The weapon's Calibre attribute points to one of these profiles; the loaded **ammo type** modifies the calibre's damage and sets the penetration class. Weapon values (barrel multiplier, Base MoA, recoil) act on top.

| Attribute | Type | Meaning | Feeds |
| --- | --- | --- | --- |
| Designation | Text | Cartridge name, e.g. 5.56×45 | Which weapons and magazines fit |
| Damage | HP | Base damage per projectile at the muzzle | Muzzle damage, damage at distance, blunt damage |
| Projectiles | Count | 1 for bullets, several for buckshot | Hits per round (each pellet traced separately) |
| Recoil modifier | Multiplier | How much the cartridge scales the gun's Recoil (about ×0.6–×1.6) | Effective recoil = gun Recoil × calibre modifier |
| Round weight | g | Weight per cartridge | Magazine and carried weight |

**Calibres and ammunition in the game:** see the [Item list](https://claude.ai/artifact/3ZE9h1z8kMDFDuWB4muJRJ). For reference: a thorax has 85 base HP, a head 35.

**Ammo types**

Every ammo item has its own **damage modifier and penetration class** (see the item list); spread, falloff (a share of damage lost over the load's own falloff range) and the subsonic flag are set per load.

| Ammo type | Character | Damage | Falloff range (placeholder) | Subsonic | Spread (MoA) | Other |
| --- | --- | --- | --- | --- | --- | --- |
| FMJ (standard) | Baseline load | ×1.0 | 15 tiles | No | ×1.0 | Cheap, common |
| AP (armour-piercing) | Penetration class +1 to +2, slightly less damage | ×0.9 | 18 tiles | No | ×1.0 | Expensive, rare |
| HP (hollow point) | More damage, low penetration class | ×1.25 | 12 tiles | No | ×1.0 | Higher bleeding chance |
| Subsonic | Less damage, lower penetration class | ×0.8 | 10 tiles | Yes | ×1.1 | Near-silent with a suppressor |
| Tracer | Same as FMJ | ×1.0 | 15 tiles | No | ×1.0 | Less recoil spread in bursts; reveals the shooter |
| Buckshot (shotgun) | 8 pellets | ×1.0 per pellet | 15 tiles | No | ×1.0 | Strong up close, falls off fast |
| Slug (shotgun) | One heavy projectile | ×1.0 | 15 tiles | No | ×0.5 | Replaces buckshot |

## Vehicles (draft)

**Draft — not final.** Vehicles are not upgraded; the player chooses between different vehicles, each with its own cost, parameters and features. A squad on the map has at most one vehicle: its seats cap the squad size and its storage holds the squad's supplies and what it brings home. A squad without a vehicle travels on foot (2 hours per tile, 3 in mountains) and carries only what its soldiers carry: it has no supplies store beyond its soldiers' gear, and loot it brings home must fit in their backpacks, vests and belts.

- **Start:** the player buys a first vehicle with the starting budget; only the cheapest few are affordable.
- **Buying and selling:** in large cities and at mechanical plants. Some vehicles are only sold to factions' friends (high standing) or through the Krug (draft: eastern standing = Trusted, 50+, with the SSV or Varyag; western standing = 50+ with the VDK or Aegis; or 50+ with the Krug; the civilian R44 needs no standing).
- **Several vehicles = several squads** running ops at the same time. Vehicles are either ground vehicles or helicopters.
- **Loss:** a vehicle left behind on a failed op can be destroyed, captured or recovered later.

**Vehicle parameters**

| Parameter | Meaning |
| --- | --- |
| Cost | Purchase price; upkeep (fuel, repairs) scales with it (draft: 0.2% of the price per day, plus fuel) |
| Seats | Maximum soldiers in the squad |
| Storage | One list for everything the vehicle carries, limited by weight (kg): supplies (ammunition, fuel cans, medical supplies, spare parts) and loot. Soldiers restock from it between engagements; every kilo of supplies is a kilo not free for loot — longer ops or bigger hauls |
| Fuel range | Regions it can travel on a full tank: one fuel unit per tile moved, whatever the terrain (draft: 1 unit = one 20-litre fuel can, 18 kg) |
| Off-road | Poor / good / very good: lowers the travel time in steppe and woods |
| Armour | Protection for passengers in road encounters (armour class) |
| Noise | How far away factions notice it (draft: Low 1 tile, Medium 2, High 3, Very high 4, Extreme 6) |
| Features | Special abilities, listed below (draft effects: ambulance layout heals wounded 2× faster while travelling; repairable anywhere allows field repairs away from mechanical plants; mine protection halves blast damage to passengers) |

**Vehicles**

| Vehicle | Type | Cost (draft) | Seats | Storage (kg) | Fuel range | Off-road | Armour | Noise | Features |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lada Niva | Ground | 8,000 | 3 | 300 | 30 | Good | — | Low | Cheap, inconspicuous, easy to repair |
| UAZ-469 | Ground | 12,000 | 4 | 400 | 20 | Very good | — | High | Rugged; repairable anywhere |
| UAZ-452 van | Ground | 15,000 | 6 | 700 | 20 | Good | — | High | Ambulance layout: wounded recover while travelling |
| Pickup truck | Ground | 25,000 | 4 | 800 (open bed) | 35 | Good | — | Medium | Weapon mount on the bed: fights in road encounters, but draws attention |
| Land Cruiser 70 | Ground | 35,000 | 5 | 600 | 40 | Very good | — | Medium | Longest range; reliable |
| GAZ-66 truck | Ground | 30,000 | 12 | 2,000 | 15 | Good | — | High | Troop transport; large loot runs |
| Ural-4320 truck | Ground | 45,000 | 14 | 4,500 | 15 | Very good | — | High | Largest storage; crosses rough ground |
| GAZ Tigr | Ground | 120,000 | 6 | 500 | 25 | Good | Class 4 | High | Armoured; eastern standing or the Krug |
| MRAP | Ground | 150,000 | 6 | 800 | 20 | Poor | Class 5, mine protection | High | Most protected; western standing or the Krug |
| BTR-80 | Ground | 250,000 | 8 | 700 | 15 | Good | Class 4 | Very high | Amphibious (crosses water); heavy machine gun; every faction notices it |
| Robinson R44 | Helicopter | 400,000 | 3 | 100 | 25 | Ignores terrain | — | Very high | Smallest and cheapest helicopter; scouting and small teams |
| Mi-2 | Helicopter | 600,000 | 6 | 500 | 30 | Ignores terrain | — | Very high | Light transport; eastern standing or the Krug |
| UH-1H | Helicopter | 900,000 | 8 | 1,000 | 30 | Ignores terrain | — | Very high | Door gun; western standing or the Krug |
| Mi-8 | Helicopter | 1,500,000 | 14 | 3,000 | 35 | Ignores terrain | Class 2, cockpit only (draft) | Extreme | Largest lift; needed for big hauls from hidden cities |

**Helicopters (draft)**

- **Movement:** ignore terrain — one hour per region over any ground, including mountains, woods and water.
- **Landing:** on any region and any open tile except water. Hidden cities can only be reached this way.
- **Seats include the pilot:** one soldier with Technical 50+ (or a hired pilot on salary) must fly it.
- **Visibility:** heard and seen from far away; every faction in range notices it, and each hostile military point of interest on its path rolls a chance to damage or down it (draft: 10% damaged, 3% downed per point of interest; data).
- **Fuel and upkeep:** refuel only at FOBs and oil plants; expensive to run and repair.
- **Losing one:** a downed helicopter is a crash site, and its crew starts an emergency op to get home on foot.

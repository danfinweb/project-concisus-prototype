# Concisus – Tactical actions

Nov 22, 2026 · @Dan

**Draft — not final.** Every action a soldier can take on a tactical map, with its cost and how it is calculated. The rules behind them are in the Tactical Layer of the [Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo). "Defined" values come from the design; "Draft" values are first proposals to tune in playtests; "Open" marks a cost not set yet. All costs are whole numbers. Every cost is worked out in the same order: multipliers on the base cost first (for movement the walk or diagonal cost plus terrain), then the additive surcharges, then rounded down; never below 1 AP. Reference: an average soldier has 30 AP, so walking 6 tiles (12 AP) and an aimed rifle shot (8 AP) still leaves 10 AP.

## Turn and activation

| Action | Cost | How it is calculated | Status |
| --- | --- | --- | --- |
| Activate a soldier | 2 stamina points | +1 stamina point if the soldier sprinted or is over carry capacity, charged when the activation ends; needs at least 2 stamina points. Grants the soldier's full AP: 25 + Agility ÷ 10, rounded down (25–35), minus the AP modifiers below | Defined |
| Pass | Free | Every soldier not activated in a turn recovers +1 stamina point; reacting does not count as being activated | Defined |
| Set facing at the end of an activation | Free | — | Defined |
| Set reaction (Fire, Take cover, Hold) | Free | Chosen during the activation, applied automatically; can be changed any number of times in the activation | Draft |
| Hold overwatch | 4 AP | Lasts until the soldier's next activation, or ends early when the soldier is suppressed or has fewer rounds loaded than the fire mode fires; its Fire reactions use the weapon's current fire mode and get no snap-shot penalty. Without overwatch a Fire reaction is a single snap shot | Draft |
| Reaction attempt | 1 stamina point | Success: 50 + (reactor's Perception − mover's Agility) / 2, limited to 10–90%, adjusted for distance, the mover's stance, noise and the reactor's wounds. When a visible action in place (firing, reloading, using an item) triggers it, the acting soldier counts as the mover for stance and noise; the sprint modifier does not apply. One attempt per mover per entry into the vision cone. Not possible while suppressed or at 0 stamina points | Defined |
| Leave the map at an exit | Free | The soldier must be on an exit tile (ending a move there, or already standing there at the start of its activation) and the exit's condition must be met (fuel, a boat at a set turn, a paid crossing). Soldiers leave one by one; the battle ends for the player when none of its soldiers is left on the map | Draft |

## Movement

| Action | Cost | How it is calculated | Status |
| --- | --- | --- | --- |
| Walk one tile | 2 AP + terrain cost | Defined base. Draft: diagonal step 3 AP instead of 2. Terrain per tile: road, floor, grass +0; mud, shallow water, rubble, dense brush +1; stairs +1 | Base defined, terrain and diagonal draft |
| Move crouched | Walk cost +1 AP per tile | — | Draft |
| Crawl prone | Walk cost +3 AP per tile | No sprinting, vaulting or climbing | Draft |
| Sprint | Walk cost −1 AP per tile (never below 1 per tile) | Upright only; +1 stamina point on that activation (allowed with 2 stamina points; stamina never goes below 0); not possible prone, with a leg fracture or in a large rucksack | Draft |
| Leg wounds | +1 AP per tile per wounded leg | A leg counts as wounded below 50% of its HP. A disabled leg (0 HP) doubles the base tile cost instead, once however many legs are disabled. A leg fracture multiplies the base tile cost by 1.5, also on top of a disabled leg (×2 × 1.5 = ×3) | Draft |
| Change stance | Upright ↔ crouched 2 AP; crouched → prone 2 AP; prone → crouched 4 AP; prone → upright 6 AP; upright → prone 4 AP (through crouched, 2 + 2) | Getting up from prone costs the most | Draft |
| Turn during an activation | 1 AP per 90° or part of it | Turning along a path while moving is free; the final facing is free | Draft |
| Vault a window or low wall | 4 AP | Agility 70+: 3 AP; not possible prone | Draft |
| Climb a ladder | 4 AP per level | Agility 70+: 3 AP per level; not possible prone or while carrying a squadmate | Draft |

## Weapons

| Action | Cost | How it is calculated | Status |
| --- | --- | --- | --- |
| Fire (one shot action) | Default by weapon type: pistol 4, SMG 5, assault rifle 6, shotgun 6, battle rifle 7, DMR 7, LMG 8, bolt-action sniper rifle 9 AP | Burst (the weapon's own burst mode, e.g. 2 or 3 rounds) +2 AP; full auto (5 rounds) +4 AP; ergonomics 70+ −1 AP, 30 or below +1 AP. A weapon's own value in /data replaces only the weapon-type default; the modifiers still apply. A burst or auto mode with fewer rounds loaded fires what is left, at the full AP cost | Draft |
| Aim longer | 2 AP per aim step, up to 3 steps | Each step multiplies shooter spread by 0.85 (placeholder; 3 steps ≈ −39%). Marksmanship 75+: 1 AP per step. +1 AP per step with pain | Draft |
| Reload | Pistol 4, box magazine 5, stripper clip or bolt-action 6, belt-fed 10 AP; tube-fed shotgun 2 AP per shell, any number of shells (partial reload) | Marksmanship 70+ −1 AP; ergonomics 70+ −1 AP, 30 or below +1 AP; magazine from the backpack +4 AP; arm fracture ×1.5. The modifiers apply once per reload, also for a tube | Draft |
| Swap between weapon 1 and 2 | 3 AP | 2 AP when either weapon is a pistol; drawing the holstered pistol is such a swap (2 AP); Agility 70+ −1 AP | Draft |
| Throw a grenade | 5 AP | From the vest or belt; from the backpack +4 AP; Strength sets throwing distance: 10 + Strength ÷ 10 tiles, rounded down (10–20). The grenade lands at a random point within 1 tile + 1 tile per 10 tiles thrown of the target tile. Wounded arm: landing scatter ×1.5; disabled arm (0 HP): scatter ×2; the worse arm counts | Draft |

Draft: **Clear a jam** costs 4 AP (Technical 50+: 3 AP). A jammed weapon cannot fire until the jam is cleared; jam chance and weapon wear are in the GDD (Armour wear and weapon condition).

## Medical

Item AP from the [Item list](https://claude.ai/artifact/3ZE9h1z8kMDFDuWB4muJRJ). For all medical items: −1 AP per 40 Medical (never below 1; the surcharges that follow are added after that); +2 AP when treating yourself; extra AP when used from the backpack; a squadmate must be on an adjacent tile.

| Action | Base AP | Notes | Status |
| --- | --- | --- | --- |
| Bandage | 3 | — | Defined |
| Tourniquet | 2 | — | Defined |
| Hemostatic dressing | 4 | — | Defined |
| Splint | 5 | — | Defined |
| Painkillers | 2 | — | Defined |
| IFAK | 6 | — | Defined |
| Medkit | 8 | Backpack item | Defined |
| Surgical kit | 15 | Needs Medical 40+ | Defined |

Draft: an item used from the backpack costs +4 AP (the backpack surcharge, the same for every item).

## Gear and interaction

| Action | Cost | How it is calculated | Status |
| --- | --- | --- | --- |
| Use an item from the vest or belt | The item's normal AP | — | Defined |
| Use an item from the backpack | The item's AP +4 AP | — | Draft |
| Drop the backpack | 1 AP | Picking it up again costs 4 AP | Draft |
| Pick up or loot (items, bodies, containers) | 2 AP per item taken | Opening a container or searching a body first costs 3 AP once per side; its contents then stay visible to the whole side | Draft |
| Cut a lock with bolt cutters | 10 AP | Silent | Defined |
| Place a demolition charge | 8 AP | Technical 50+: 6 AP | Draft |
| Restrain a VIP (capture mission) | 6 AP | Adjacent tile; only once the VIP surrenders or is wounded | Draft |
| Carry or drag a body | Lift 4 AP, put down 2 AP; carrying +2 AP per tile, dragging +3 AP per tile | The player chooses carry or drag; lift only from an adjacent tile. A wounded or dead squadmate, an enemy or a restrained VIP can be moved. The body and its gear count toward the carrier's encumbrance: carrying fails if that goes over carry capacity, dragging always works. Carrying: upright, no sprinting, climbing or vaulting. Dragging: upright or crouched, not prone, no vaulting (put the body down first) | Draft |

Draft: **Open a door** — walking through a closed, unlocked door opens it as part of the move, +1 AP on that step. **Close a door** on an adjacent tile edge: 1 AP. A locked door needs bolt cutters, the POI key or a demolition charge (see Tactical map generation in the GDD).

## AP modifiers on an activation

- **Suppressed:** −5 AP, wider spread, no reactions. A soldier is suppressed when hit, when an enemy shot hits its cover, or when one lands within 1 tile of it.
- **Head hit:** chance to be stunned, losing 10 AP on the next activation (draft).
- **Pain:** −4 AP until masked by painkillers (draft).
- **Over-encumbered:** −5 AP over carry capacity, −10 AP over 125% of it (draft); Strength lowers the penalty: × (1 − Strength ÷ 200), rounded down (draft). Heavy assault armour costs −5 AP on every activation (draft).
- Wounds do not reduce the AP pool. Wounded or disabled legs raise movement cost; wounded or disabled arms widen the shooting cone and the grenade scatter instead of costing AP (see Body zones in the GDD).

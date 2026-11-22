# Untitled Tactical RPG – Tactical actions

Nov 22, 2026 · @Dan

**Draft — not final.** Every action a soldier can take on a tactical map, with its cost and how it is calculated. The rules behind them are in the Tactical Layer of the [Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo); "Open" marks a cost not set yet.

## Turn and activation

| Action | Cost | How it is calculated | Status |
| --- | --- | --- | --- |
| Activate a soldier | 2 stamina points | +1 stamina point if the soldier sprinted or is over carry capacity; needs at least 2 stamina points. Grants the soldier's full AP: 25 + Agility ÷ 10, rounded down (25–35), minus the AP modifiers below | Defined |
| Pass | Free | Every soldier not activated in a turn recovers +1 stamina point | Defined |
| Set facing at the end of an activation | Free | — | Defined |
| Set reaction (Fire, Take cover, Hold) | Not stated | Chosen during the activation, applied automatically | Open |
| Reaction attempt | 1 stamina point | Success: 50 + (reactor's Perception − mover's Agility) / 2, limited to 10–90%, adjusted for distance, the mover's stance, noise and the reactor's wounds. Not possible while suppressed or at 0 stamina points | Defined |
| Leave the map at an exit | Not stated | Each exit has its own condition (fuel, a boat at a set turn, a paid crossing) | Open |

## Movement

| Action | Cost | How it is calculated | Status |
| --- | --- | --- | --- |
| Walk one tile | 2 AP + terrain cost | Terrain cost per tile (road, grass, mud, rubble, stairs); diagonals cost more; leg wounds raise the cost; a leg fracture multiplies it by 1.5 | Base defined, terrain and diagonal values open |
| Move crouched | Walk cost + crouch surcharge | — | Open |
| Crawl prone | Walk cost + a larger surcharge | — | Open |
| Sprint | Not stated | +1 stamina point on that activation; not possible prone or with a leg fracture | Open |
| Change stance | Not stated | Getting up from prone costs the most | Open |
| Turn during an activation | Not stated | — | Open |
| Vault a window, climb a ladder | Not stated | Agility; not possible prone | Open |

## Weapons

| Action | Cost | How it is calculated | Status |
| --- | --- | --- | --- |
| Fire (one shot action) | Set per fire mode of the weapon | Rounds and AP per shot action come from the weapon's fire modes; recoil builds within a burst | Open (per weapon) |
| Aim longer | Extra AP | Raises accuracy; aim cost lowered by Marksmanship and ergonomics, raised by arm wounds and pain | Open |
| Reload | Not stated | Lowered by Marksmanship and ergonomics; from the vest or belt at normal cost, from the backpack at extra cost; raised by arm wounds and fractures | Open |
| Swap between weapon 1 and 2 | Not stated | Marksmanship, Agility and ergonomics | Open |
| Throw a grenade | Not stated | From the vest or belt at normal cost; Strength sets throwing distance | Open |

## Medical

Item AP from the [Item list](https://claude.ai/artifact/3ZE9h1z8kMDFDuWB4muJRJ). For all medical items: −1 AP per 40 Medical (never below 1); +2 AP when treating yourself; extra AP when used from the backpack; a squadmate must be on an adjacent tile.

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

The backpack surcharge is still open.

## Gear and interaction

| Action | Cost | How it is calculated | Status |
| --- | --- | --- | --- |
| Use an item from the vest or belt | The item's normal AP | — | Defined |
| Use an item from the backpack | The item's AP + a surcharge | — | Surcharge open |
| Drop the backpack | Not stated | — | Open |
| Pick up or loot (items, bodies, containers) | Not stated | — | Open |
| Cut a lock with bolt cutters | 10 AP | Silent | Defined |
| Place a demolition charge | Not stated | Technical | Open |
| Restrain a VIP (capture mission) | Not stated | Only once the VIP surrenders or is wounded | Open |
| Carry or drag a wounded squadmate | Not stated | Named as a deed, not yet defined as an action | Open |

## AP modifiers on an activation

- **Suppressed:** −5 AP, wider spread, no reactions.
- **Head hit:** chance to be stunned, losing AP on the next activation (amount open).
- **Pain:** fewer AP until masked (amount open).
- **Over-encumbered:** fewer AP (amount open); Strength lowers the penalty for heavy kit.

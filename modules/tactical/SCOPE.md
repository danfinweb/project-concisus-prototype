# Tactical Layer — scope

Refreshed by `/scope` (2026-11-23, spec baseline `69be026`). Lists everything this module may read outside
its folder.

## Spec IDs

Source: `spec/tactical.md` (area TAC, 74 IDs, all mapped to `modules/tactical` in `spec/_index.md`).
`(open)` = the design leaves a value or rule unset; build with the draft values or a stub and flag it.

**Battle frame**

| ID | Summary |
| --- | --- |
| TAC-001 | Exactly two sides per map; AI allies sit on the player side, non-hostile units on the opponent side |
| TAC-002 | Turn-based from the first moment on the map, stealth included |
| TAC-003 | Every battle costs 1 h of strategic time; day 06:00–21:00, night otherwise, fixed for the battle |
| TAC-004 | (open) Night sight = day × 1/3 unless a flashlight is on; base sight formula not set |

**Turn and activation**

| ID | Summary |
| --- | --- |
| TAC-005 | Sides alternate single-soldier activations; any eligible soldier, or pass; AP reset each activation |
| TAC-006 | Full AP = 25 + floor(Agility ÷ 10), minus suppression, stun, pain and encumbrance only |
| TAC-007 | Final facing (8 directions) set free at the end of an activation |
| TAC-008 | Activation needs and costs 2 stamina; +1 at the end if sprinted or over carry capacity |
| TAC-009 | Max stamina = 2 + floor(Endurance ÷ 20) − 1 per wounded leg; enter battle at max |
| TAC-010 | Pass is free; forced when no soldier can be activated |
| TAC-011 | Soldiers not activated in a turn regain 1 stamina at turn end; reacting is not activation |
| TAC-012 | Stamina < activation cost: cannot activate; stamina 0: no reaction attempts |
| TAC-013 | (open) Stall: both sides pass 2 turns running → leave or skip ahead; "contact" undefined |
| TAC-014 | All durations count in turns; per-turn effects apply once at turn end |
| TAC-015 | Hit or cover hit → suppressed: −5 AP, more spread, no reactions, until a clean full turn |

**Vision and noise**

| ID | Summary |
| --- | --- |
| TAC-016 | 120° vision cone on facing (helmet can override); LOS shown before committing |
| TAC-017 | Turning on the spot: 1 AP per 90° or part; turning along a path and final facing free |
| TAC-018 | Unsuppressed shots heard map-wide; suppressed 18 tiles, subsonic 6; helmet penalty halves |
| TAC-019 | (open) Hearing a shot turns the soldier to the source and alerts them; alert effect undefined |

**Reactions**

| ID | Summary |
| --- | --- |
| TAC-020 | Check per tile step when a mover enters/crosses a cone with LOS; one attempt per entry |
| TAC-021 | Reaction setting Fire / Take cover / Hold; free, changeable, applied automatically |
| TAC-022 | Attempt costs 1 stamina; chance clamp(50 + (Perception − Agility)/2 + mods, 10, 90)% |
| TAC-023 | Success resolves at once (snap shot or take cover), no AP; mover then continues |

**Action costs and AP modifiers**

| ID | Summary |
| --- | --- |
| TAC-024 | Cost = base + additive terms, × multipliers, rounded down, min 1 AP (free actions exempt) |
| TAC-025 | (open) Non-lethal head hit may stun: −10 AP next activation; stun chance not set |
| TAC-026 | (open) Pain: −4 AP per activation and more spread until masked |
| TAC-027 | (open) Over carry capacity −5 AP, over 125% −10 AP, + stamina surcharge; capacity formula not set |

**Movement**

| ID | Summary |
| --- | --- |
| TAC-028 | Square ~1.5 m tiles, multiple levels, 8-direction movement; stairs, ladders, windows |
| TAC-029 | Walk 2 AP (diagonal 3) + terrain; +1 per wounded leg; leg fracture × 1.5 on the whole tile |
| TAC-030 | Crouched step: walk cost + 1 |
| TAC-031 | Prone step: walk cost + 3; no sprint, vault or climb |
| TAC-032 | Sprint: walk cost − 1 (min 1), upright only, stamina surcharge, easier to react to |
| TAC-033 | (open) Stance change costs per transition; upright → prone not stated |
| TAC-034 | Vault 4 AP / climb 4 per level (3 with Agility 70+); not prone; no climbing while carrying |
| TAC-035 | Cover stored per tile edge: none, half (~1.0 m), full; destructible materials |
| TAC-036 | After explosions or breaches, recalculate cover, walkability, costs and LOS mid-turn |
| TAC-037 | Path preview returns path, total AP and where AP runs out; same rules as execution |
| TAC-038 | Leave free from an exit tile whose condition is met; leavers count as survivors |

**Weapons**

| ID | Summary |
| --- | --- |
| TAC-039 | Fire: weapon-type AP (or override) + burst/auto surcharge ± ergonomics; one cartridge per round |
| TAC-040 | Up to 3 aim steps, 2 AP each (1 with Marksmanship 75+), −15% spread each; +1 if arm wounded or pain |
| TAC-041 | Reload by feed type (tube per shell) ± skill, ergonomics, backpack, wounded/fractured arm |
| TAC-042 | Swap weapon 3 AP (2 with a pistol), −1 Agility 70+, +2 for a weapon over 6 kg |
| TAC-043 | (open) Throw grenade 5 AP (+backpack, +wounded arm); throw distance formula not set |

**Hit model and derived per shot**

| ID | Summary |
| --- | --- |
| TAC-044 | (open) Total spread = base MoA × ammo modifier + shooter spread; shooter-spread function not set |
| TAC-045 | Each projectile drawn from a 2D normal in the cone (seeded) and traced; pellets traced separately |
| TAC-046 | Shot preview: hit %, likely zone, penetration, from samples on a separate RNG stream |
| TAC-047 | (open) Burst recoil adds spread per extra round; recoil control formula not set |
| TAC-048 | Muzzle damage = calibre × ammo × barrel; linear falloff, floor 10% of muzzle damage |
| TAC-049 | Effective recoil = weapon recoil × calibre recoil modifier |
| TAC-050 | Penetrates if class ≥ armour class; degraded armour (< 50%) one class below: (50 − cond)% chance |
| TAC-051 | (open) Blocked round deals 20% blunt damage; durability loss per hit not set |

**Body zones and hitboxes**

| ID | Summary |
| --- | --- |
| TAC-052 | Six zones, one axis-aligned box each, own HP; upright box sizes given |
| TAC-053 | (open) Aiming swings arm boxes in front of the thorax; offsets not set |
| TAC-054 | Crouched layout (~1.20 m); half cover hides legs and most of the thorax |
| TAC-055 | Prone layout (~0.40 m) along facing; lowest spread; fully hidden behind half cover |
| TAC-056 | Cover is trace geometry; firing over or leaning out exposes boxes during the shot |
| TAC-057 | Zone max HP = floor(base × (0.5 + 0.75 × Endurance/100)); base 35/85/60/70 |
| TAC-058 | (open) Per-zone damage effects (stun, bleeding, arm and leg wound costs); chances not set |
| TAC-059 | Head or thorax at 0 HP kills; limbs at 0 HP no extra effect; gear stays on the body |

**Medical**

| ID | Summary |
| --- | --- |
| TAC-060 | Light bleeding −1 HP/turn in the zone until bandage, IFAK or medkit |
| TAC-061 | Heavy bleeding −4 HP/turn; tourniquet (limbs), hemostatic dressing or medkit; replaces light |
| TAC-062 | (open) Fracture effects; "wounded" limb = below 50% max HP; splint removes fracture |
| TAC-063 | (open) Pain from damage or tourniquet; painkillers mask it for 10 turns |
| TAC-064 | Anyone may use medical items except surgical kit (Medical 40+); self or adjacent squadmate |
| TAC-065 | Medical AP = max(1, base − floor(Medical ÷ 40)) + 2 self-treatment + backpack surcharge |
| TAC-066 | HP restored = floor(item HP × (0.75 + Medical/200)); IFAK/medkit draw from a pool |
| TAC-067 | What each medical item treats; one use per application |

**Gear and interaction**

| ID | Summary |
| --- | --- |
| TAC-068 | (open) Vest/belt items at normal AP; backpack +4; awkward backpack extra not set |
| TAC-069 | Drop backpack 1 AP (lootable on the tile); pick it up again 4 AP |
| TAC-070 | Loot 2 AP per item; open container or search body 3 AP; only carried-off loot counts |
| TAC-071 | Cut a lock with bolt cutters, 10 AP, silent |
| TAC-072 | Place a demolition charge 8 AP (6 with Technical 50+); detonation triggers TAC-036 |
| TAC-073 | Restrain a surrendered or wounded VIP from an adjacent tile, 6 AP |
| TAC-074 | Lift 4 / put down 2; carry +2 per tile upright, drag +3 per tile upright or crouched |

**Read from other areas** (rules this module applies but does not own)

| ID | File | Why tactical reads it |
| --- | --- | --- |
| GEN-002 | `spec/overview.md` | Op success: at least one soldier gets back (battle result reports survivors) |
| GEN-009 | `spec/overview.md` | Krug markets are no-fire zones |
| MGT-008 | `spec/management.md` | Squad morale enters and leaves the battle; `morale_flee_below` is applied in TAC |
| MGT-021, MGT-026..MGT-031 | `spec/management.md` | Attribute set and derived values (AP, stamina, zone HP, carry capacity, nerve) |
| MGT-044 | `spec/management.md` | Mission success/failure conditions evaluated in battle |
| STR-023 | `spec/strategic.md` | Engagement contract: request in, result out, 1 h |
| DAT-002..DAT-023 | `spec/data.md` | Item fields, slots, access tiers, weight, containers, loot, weapon/mod/calibre/ammo profiles, per-shot inputs |
| DAT-025, DAT-029 | `spec/data.md` | The squad's vehicle and its storage (loot destination) |
| ITM-001..ITM-020, ITM-025, ITM-026, ITM-030 | `spec/data.md` | Concrete item kinds used in combat, medical and operation items |
| TEC-008, TEC-012, TEC-015 | `spec/tech.md` | Rendering never drives rules; pure rules core; seeded, reproducible randomness |
| TEC-022, TEC-023 | `spec/tech.md` | Shot preview and explicit confirm (the core must expose previews) |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/tactical_map_request.schema.json` | consumes (from strategic) | 0.3.0 |
| `spec/interfaces/tactical_commands.schema.json` | consumes (from tactical-ai) | 0.2.0 |
| `spec/interfaces/battle_result.schema.json` | produces (to strategic, management) | 0.2.1 |
| `spec/interfaces/tactical_perception_view.schema.json` | produces (to tactical-ai) | 0.2.0 |

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/tactical-rules.json` | `spec/interfaces/data/tactical-rules.schema.json` | 0.3.0 | All TAC constants (owned by TAC) |
| `data/items.json` | `spec/interfaces/data/items.schema.json` | 0.3.0 | Weapons, ammo, armour, containers, medical and operation items |
| `data/terrain.json` | `spec/interfaces/data/terrain.schema.json` | 0.2.0 | Tile move costs, cover materials |
| `data/prefabs.json` | `spec/interfaces/data/prefabs.schema.json` | 0.2.0 | Map pieces, cover edges, destructible materials |
| `data/mapgen/tactical.json` | `spec/interfaces/data/mapgen-tactical.schema.json` | 0.2.0 | Map generation rules, exits and exit conditions |
| `data/presets.json` | `spec/interfaces/data/presets.schema.json` | 0.2.0 | AI soldier stats and loadouts from strength/gear tiers |
| `data/management-rules.json` | `spec/interfaces/data/management-rules.schema.json` | 0.3.0 | `morale_flee_below`, nerve effects (see open question 2) |

## State slices

- Owns: `battle`
- Reads: none directly. Roster soldiers, region, time and hostility arrive in `tactical_map_request`;
  changes to `roster`, `world` and the rest go out only in `battle_result`.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Found while scoping; report to the root session, do not edit `spec/`. The 42 open questions already listed
in `spec/tactical.md` › Open questions still apply.

1. **Duplicate constants.** The falloff floor is `minDamageShare` (TAC-048) and `falloffFloor` (ITM-005);
   `tactical-rules.schema.json` defines both. Which name stays?
2. **Two sources for derived values.** AP, stamina and zone HP are specced in TAC-006/009/057
   (`data/tactical-rules.json`: `apBase`, `staminaBase`, `hpScaleBase`, …) and again in MGT-026..028
   (`data/management-rules.json`: `ap_base`, `stamina_base`, `hp_factor_base`, …). The same holds for the
   reaction constants (TAC-022 vs MGT-030) and the night sight factor (TAC-004 vs MGT-030). Pick one owner
   per value so the tables cannot drift.
3. **Rounding of zone HP.** TAC-057 floors; MGT-028 says rounding is not stated.
4. **Battle duration twice.** `battleDurationHours` (TAC-003, tactical-rules) and `battleHours` (STR-023,
   strategic-rules). TAC-003 names the result field `gameTimeSpent`; `battle_result` 0.2.1 calls it
   `gameTimeHours`.
5. **Morale flee rule has no TAC ID.** MGT-008 says the disobedience rule below `morale_flee_below` is
   applied in TAC, and MGT-031 says Nerve's effect on morale is applied in TAC; no TAC section specifies
   either (see also `spec/tactical.md` question 30).
6. **Contamination and mines.** `tactical_map_request` region flags include `contaminated` and `mined`.
   STR-080 says soldiers lose HP every tactical turn in a contaminated zone; the `mined` flag's hazard
   effect and clear rule are not set (strategic.md, Mining the roads). No TAC section covers either.
7. **Mission evaluation.** MGT-044 says missions are evaluated by STR/TAC; which conditions the battle
   decides itself (e.g. VIP killed, kill witnessed) versus strategic is not split.

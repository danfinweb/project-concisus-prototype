# Concisus – Tactical Layer

Nov 24, 2026 · @Dan

Module `modules/tactical/`, owns the `battle` state. Part of the [Concisus – Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo), which holds the overview, factions & campaign and the module map.

## Overview

Turn-based squad combat on destructible 3D maps, with JA2-style action points and XCOM-style readability.

- **Turn structure:** alternating soldier activations with stamina-limited reactions (see Turn structure below). Turn-based from the first moment on the map, including stealth: there is no real-time exploration phase.
- **Action points (decided):** each soldier's AP per activation are derived from their stats, so a fast, skilled veteran does more per activation than a rookie. AP is spent on movement, stance, aiming, reloading, medical and gear actions; aiming longer raises accuracy.
  - Turn modifiers: over-encumbrance and suppression reduce the pool for that activation.
  - Action costs also scale with stats and gear exactly as listed in Tactical actions, which is the single source for every cost and its modifiers; Strength lowers the penalty for heavy kit.
- **Camera (decided):** isometric 3D camera with smooth zoom — zoomed out for planning across the map, zoomed in to read cover, stance and gear. Fixed default angle; walls and roofs cut away around selected soldiers and the cursor, and units behind cover show as outlines. Optional 90° rotation (Q/E on PC, a rotate button on mobile) with a snap-back-to-default button and a compass, so the game stays fully playable without ever rotating. Assets are built to read from all four sides. Mouse wheel on PC, pinch on mobile.
- **Movement (decided):** grid-based on square tiles (about 1.5 m), 8 directions, diagonals cost more AP.
  - Each tile has a terrain cost (road, grass, mud, rubble, stairs); crouching adds to the cost, crawling while prone adds more. Soldiers are upright, crouched or prone (see Stance under Body zones); changing stance costs AP, getting up from prone the most.
  - Multi-level grid: floors, roofs, ladders and windows to vault.
  - Cover is set per tile edge (half or full), so the preview can show exactly where a soldier is protected. Destruction updates the grid immediately, mid-turn: after every explosion or breach, cover, paths, AP costs and line of sight recalculate, and reactions can trigger on newly opened sightlines.
  - Path preview shows AP cost and where the activation's AP run out. On mobile: tap a tile to preview, tap again to confirm.
- **Ballistics:** per-load penetration class vs. armour class, hit locations (head, thorax, left and right arm, left and right leg — see Body zones and hitboxes), bullet travel, suppression.
- **Cover & visibility:** half/full cover, destructible materials, noise levels, line of sight shown before committing.
- **Readability:** every shot previews hit %, likely body zone and whether the round penetrates.
- **Enemy AI:** squads with roles (flank, suppress, retreat, call reinforcements). Units of non-hostile factions on the same map follow their own objectives and only engage under the faction behaviour rules (see Strategic layer).

**Time of day:** every battle takes exactly 1 hour of game time, however long it runs in real time, and uses the strategic clock's time when it starts. Battles starting from 06:00 up to (not including) 21:00 are day battles; battles starting from 21:00 up to (not including) 06:00 are night battles, where sight and spotting ranges drop to a third unless the soldier has a flashlight (see Art direction).

## Turn structure (draft)

Combat alternates one soldier at a time between the sides. There are no rounds: stamina alone decides how often a soldier can act and react.

**Turns and activation**

1. A **turn** is one player activation followed by one opponent activation.
2. Each side picks **any** soldier with stamina left — including the one it used last turn — and spends that soldier's action points (AP). AP refill with every activation.
3. Every soldier **not** activated in a turn recovers stamina.
4. A side with no soldier able to act must pass; its soldiers recover while the other side keeps acting. A side may also pass by choice.
5. **Stall rule:** if no soldier sees or hears an enemy for 2 turns of passing, turns advance automatically (stamina recovers) until someone is seen or heard, or a soldier acts. The player can stop the advance at any time by activating a soldier.
6. Effects with a duration (bleeding, smoke) are counted in turns. A soldier who is hit, whose cover is hit (any enemy round stopped by a cover edge the soldier is behind, facing the shooter, whoever it was aimed at), or within 1 tile of whom an enemy shot lands, is **suppressed**: −5 AP, wider spread and no reactions, until one full turn passes without such hits.

A tactical map has the player's side — which can include allied units under AI control, such as defenders, a convoy or an escorted VIP — and one opponent. Units that are hostile to neither (a non-involved faction, civilians) form a third, neutral side controlled by the tactical AI; armed neutrals turn hostile toward whoever attacks them; civilians never turn hostile, they only flee. Until attacked, neutral units never activate: they only react, by a fixed rule. When shot at, or when a shot lands within 3 tiles, civilians flee (they move away from the shooter to the nearest exit and leave the map) and armed neutrals take cover. A neutral unit that turns hostile joins the turn order as a third side, with its own activation after the opponent's in every turn, controlled by the tactical AI.

**Stamina**

Each soldier has a small stamina pool, counted in stamina points. Spending is twice as fast as recovering: an activation costs 2 stamina points, a skipped turn restores 1.

| Rule | Draft value |
| --- | --- |
| Maximum stamina | 2 + Endurance ÷ 20, rounded down (2–7 stamina points). E.g. Endurance 50 → 4; 90 → 6 |
| Activation | Costs 2 stamina points; +1 if the soldier sprinted or is over carry capacity; stamina never goes below 0, so a soldier with 2 stamina points may still sprint |
| Reaction attempt | Costs 1 stamina point, success or not |
| Recovery | +1 stamina point for every turn the soldier is not activated |
| Exhausted | Below 2 stamina points a soldier cannot be activated; at 0 they cannot react either |
| Modifiers | Each wounded or disabled leg lowers the maximum by 1; a fracture alone does not |

Example: a soldier with 4 stamina points can act twice in a row, or act once and react twice, then needs a few turns off. Rotating the squad keeps everyone close to full; leaning on one soldier drains them fast.

**Vision and facing**

- Every soldier has a 120° vision cone; line of sight only counts inside it.
- Turning during an activation costs AP; the final facing at the end of an activation is set for free and is a key decision.
- Gunfire or loud noise outside the cone turns the soldier toward it, without triggering a reaction.

**Sight and spotting (draft)**

- **Day sight range:** 25 + 0.25 × Perception + 0.1 × Recon tiles (25–60 tiles; an average soldier about 42 tiles, 63 m). At night a third of that without a flashlight.
- **Spotting:** an enemy in line of sight is seen when its distance is at most sight range × its concealment. Concealment = (1 − (0.4 × Recon + 0.1 × Agility) ÷ 100) × stance factor (upright 1.0, crouched 0.8, prone 0.6). No roll: the player can read who sees whom. E.g. an average enemy crouching (0.75 × 0.8 = 0.6) is seen within about 25 tiles.
- **Flashlight:** an enemy inside a lit flashlight's cone within 10 tiles is blinded: +4 MoA shooter spread until the end of their next activation.

**Gunshot noise**

Shots are heard by distance only — three cases, no noise values:

| Shot | Heard within |
| --- | --- |
| Unsuppressed | The whole tactical map |
| Suppressed | 18 tiles |
| Suppressed with subsonic ammo | 6 tiles |

Soldiers who hear a shot become alerted: at the start of their next activation they turn toward it for free, and a marker shows their side (and the AI) where the noise came from. A helmet with a hearing penalty halves the suppressed ranges (9 and 3 tiles).

**Reactions**

- **Trigger:** an opposing soldier moves into or through the reactor's vision cone with line of sight, takes any visible action inside it (firing, reloading, using an item), or is newly exposed in it when destruction or an opened door opens a sightline.
- **Reaction setting:** chosen per soldier during their activation — *Fire*, *Take cover* or *Hold* (stay hidden, no reaction). The game applies it automatically; no prompts mid-move.
- **Cost and limit:** each attempt costs 1 stamina point; there is no other cap.
- **Success chance:** 50 + (reactor's Perception − mover's Agility) / 2, limited to 10–90%. Adjusted before that limit (draft): distance −1 per 2 tiles beyond 10 tiles (at most −20); mover crouched −10, prone −20, sprinting +15; the mover's noise −(its Recon ÷ 10); reactor in pain −10 and −5 per wounded or disabled limb. When the trigger is a visible action in place (firing, reloading, using an item), the acting soldier counts as the mover for stance and noise; the sprint modifier does not apply.
- **On success:** the reaction resolves before the mover continues. *Fire* is a single shot with normal hit chance and a snap-shot penalty; a soldier on overwatch (see Tactical actions) fires in the weapon's current mode without that penalty. *Take cover* moves the reactor to the nearest tile with cover within 1 tile (if several are equally near: full cover before half, then the tile farther from the mover, then a random pick), or makes them crouch if there is none; a prone reactor with no cover tile stays prone. A reaction move never triggers reactions from other soldiers. The mover then spends any AP left.
- **On failure:** the mover passes unnoticed by that soldier; the stamina point is still spent.

## Actions and costs (draft)

Every action spends AP within an activation, and activations and reactions spend stamina points (see Turn structure). Costs come from a base value per action, changed by attributes, gear and wounds as the rules above describe. The full list of actions with their costs and formulas is in [Tactical actions](https://claude.ai/artifact/AAamT6WGHuQ4C4C8VQxqvA).

## Hit model (draft)

- Total spread = Base MoA × ammo modifier + shooter spread (Marksmanship, Perception at range, stance, aiming time, wounds).
- Hit chance = the share of the spread cone covered by the target's visible body zones after cover; the same calculation gives the likely body zone in the shot preview.
- Each extra round in a burst adds recoil spread, reduced by Marksmanship and Strength (see below).

**Shooter spread and recoil (draft)**

- **Shooter spread** (MoA) = (skill spread + range spread) × stance factor × 0.85 per aim step + penalties.
  - Skill spread = 8 − 7 × Marksmanship ÷ 100 (7.9 at Marksmanship 1, 4.5 at 50, 1.0 at 100).
  - Range spread (Perception at range) = (100 − Perception) ÷ 100 × 0.05 MoA per tile beyond 20 tiles.
  - Stance factor: upright 1.0, crouched 0.8, prone 0.6.
  - Penalties (added): suppressed +3, pain +1.5, arm fracture +2, snap shot (Fire reaction) +3, blinded +4.
  - Optics multiply the range spread, lasers multiply shooter spread on snap shots (values per item).
- **Weapon condition** widens the weapon's own spread: Base MoA × (1 + 0.5 × (100 − Condition) ÷ 100), up to ×1.5 at Condition 0.
- **Burst recoil:** each extra round adds 0.04 × effective recoil × (1 − recoil control), adding up round by round. Recoil control = 0.4 × Marksmanship ÷ 100 + 0.2 × Strength ÷ 100 (0–0.6). Tracer rounds lower it ×0.85.
- **Example:** an average soldier (Marksmanship 50) standing, no aim, with an AK-74M (Base MoA 5): 4.5 + 5 = 9.5 MoA, a 1.6 m cone at 33 tiles. Prone with 3 aim steps: 6.65 MoA, 1.1 m. Each extra AK-74M round in a burst adds about 0.9 MoA for that soldier.

**Decision: MoA is simulated.** Every shot is a real spread cone tested against the target's silhouette and cover, not a range-band table.

- **Per shot:** pick a point inside the cone (normal distribution, most shots near the centre; the cone's edge is two standard deviations out, so about 95% of shots land inside it) and trace it against simple hit volumes per body zone and against cover.
- **Shot preview:** the hit chance and likely body zone shown before firing come from the same model, sampled (about 300 traces), so the number shown matches the result statistically, within a few percent; the real shot is a fresh roll. The preview samples with its own random stream, so looking at a preview never changes a real shot or a replay.
- **Performance:** hit volumes are low-poly boxes per body zone, which keeps sampling cheap enough for phones.
- **Payoff:** distance, cover, stance, barrel, ammo and optics all change the result through one mechanism, and modding has a visible effect on every shot.

## Derived per shot (draft)

- Muzzle damage = calibre damage × ammo damage modifier × barrel multiplier.
- Penetration class comes from the ammo alone; barrel length and distance do not change it.
- Damage at distance = muzzle damage × (1 − falloff share × tiles ÷ falloff range), never below 10% of muzzle damage. Both values come from the loaded ammo. E.g. 6% per 15 tiles: −6% at 15 tiles, −12% at 30 tiles.
- Effective recoil = gun Recoil × calibre recoil modifier.
- Armour classes 1–6. A round penetrates when its penetration class is at least the armour class. Once armour drops below 50% condition, a round one class lower can also get through, with a chance of 50 minus the condition percentage (40% condition → 10%, 20% → 30%). Otherwise the hit is blocked and deals blunt damage = 20% of the damage at that distance, so stopped rounds still hurt. Blunt damage can cause pain but never bleeding, and the 10% floor does not apply to it. Armour worn down to 0 durability no longer protects.
- Ammo marked subsonic, fired through a suppressor, are heard only within 6 tiles (see Gunshot noise).

**Armour wear and weapon condition (draft)**

- Every hit on an armour piece wears it, blocked or not: durability − 10% of the damage at that distance for a blocked hit, − 5% for a penetrating one, rounded up, at least 1. Ceramic plates wear ×1.5. E.g. 6B23 (durability 60) lasts about 12 blocked AK-74M hits.
- Arms and legs carry no armour yet; armour items may later list the zones they cover.
- **Jamming:** each shot action jams with a chance of 10% × ((100 − Condition) ÷ 100)² (0% at Condition 100, 2.5% at 50, 10% at 0). A jammed weapon cannot fire until the jam is cleared (see Tactical actions). A gun loses 1 Condition per 50 rounds fired.

## Body zones and hitboxes (draft)

**Draft — not final.** Six zones: head, thorax, left arm, right arm, left leg and right leg. Each is one simple box that the MoA spread cone is traced against, and each has its own health pool.

**Hitboxes for an upright soldier (about 1.80 m tall)**

| Zone | Boxes | Size (width × depth × height) | Height above ground | Share of front silhouette |
| --- | --- | --- | --- | --- |
| Head | 1 | 0.22 × 0.25 × 0.25 m | 1.53–1.78 m | \~8% |
| Thorax | 1 | 0.40 × 0.25 × 0.55 m | 0.95–1.50 m | \~30% |
| Left arm | 1 | 0.12 × 0.12 × 0.60 m | 0.85–1.45 m, left of the thorax | \~10% |
| Right arm | 1 | 0.12 × 0.12 × 0.60 m | 0.85–1.45 m, right of the thorax | \~10% |
| Left leg | 1 | 0.16 × 0.16 × 0.95 m | 0.00–0.95 m | \~21% |
| Right leg | 1 | 0.16 × 0.16 × 0.95 m | 0.00–0.95 m | \~21% |

While aiming, the arm boxes swing forward and partly shield the thorax from the front. The thorax box includes the abdomen.

**Stance**

- **Crouched:** total height about 1.20 m; legs folded under the thorax, head at about 1.00–1.20 m. Half cover hides the legs and most of the thorax.
- **Prone:** lying flat, total height about 0.40 m, the body stretched out along the facing. From the front only the head, the arms (when aiming) and the top of the thorax show; from the side the whole body shows. Half cover hides a prone soldier completely; a prone soldier cannot fire over half cover and must crouch first (the crouched rule then applies). Prone gives the lowest shooter spread, but no sprinting, vaulting or climbing.
- **Cover:** half cover (tile edge about 1.0 m high) hides an upright soldier's legs and lower thorax; full cover hides everything until the soldier leans or fires over it.

**Hitboxes for a crouched soldier (draft: about 1.20 m tall)**

| Zone | Boxes | Size (width × depth × height) | Height above ground | Share of front silhouette |
| --- | --- | --- | --- | --- |
| Head | 1 | 0.22 × 0.25 × 0.20 m (draft) | 1.00–1.20 m, 0.10 m forward of the thorax (draft) | \~8% (draft) |
| Thorax | 1 | 0.40 × 0.30 × 0.50 m (draft) | 0.55–1.05 m (draft) | \~37% (draft) |
| Left arm | 1 | 0.12 × 0.12 × 0.50 m (draft) | 0.50–1.00 m, left of the thorax (draft) | \~11% (draft) |
| Right arm | 1 | 0.12 × 0.12 × 0.50 m (draft) | 0.50–1.00 m, right of the thorax (draft) | \~11% (draft) |
| Left leg | 1 | 0.16 × 0.50 × 0.55 m (draft) | 0.00–0.55 m, folded under the thorax (draft) | \~16% (draft) |
| Right leg | 1 | 0.16 × 0.50 × 0.55 m (draft) | 0.00–0.55 m, folded under the thorax (draft) | \~16% (draft) |

While aiming crouched, the arm boxes swing forward as upright (draft: 0.25 m forward of the thorax front, at 0.60–1.10 m). Behind half cover only the head, the top of the thorax and aiming arms show.

**Hitboxes for a prone soldier (draft: about 0.40 m tall; depth runs along the facing)**

| Zone | Boxes | Size (width × depth × height) | Height above ground | Place along the body |
| --- | --- | --- | --- | --- |
| Head | 1 | 0.22 × 0.25 × 0.25 m (draft) | 0.15–0.40 m (draft) | Front end (draft) |
| Thorax | 1 | 0.40 × 0.55 × 0.25 m (draft) | 0.00–0.25 m (draft) | Behind the head (draft) |
| Left arm | 1 | 0.12 × 0.60 × 0.12 m (draft) | 0.05–0.17 m; aiming 0.10–0.22 m (draft) | Left of the thorax; aiming, reaching 0.30 m forward of the head (draft) |
| Right arm | 1 | 0.12 × 0.60 × 0.12 m (draft) | 0.05–0.17 m; aiming 0.10–0.22 m (draft) | Right of the thorax; aiming, reaching 0.30 m forward of the head (draft) |
| Left leg | 1 | 0.16 × 0.95 × 0.16 m (draft) | 0.00–0.16 m (draft) | Behind the thorax (draft) |
| Right leg | 1 | 0.16 × 0.95 × 0.16 m (draft) | 0.00–0.16 m (draft) | Behind the thorax (draft) |

From the front the legs sit behind the thorax, so only the head, the top of the thorax and aiming arms show, as described under Stance; from the side every box shows.

**Health and effects per zone**

| Zone | Base HP | Armour | Damage effects | At 0 HP |
| --- | --- | --- | --- | --- |
| Head | 35 | Helmet | Chance to stun (35%, also from blunt hits): the soldier loses AP on the next activation | Death |
| Thorax | 85 | Body armour (plates front and back) | High bleeding chance | Death |
| Left arm, right arm (each) | 60 | Usually none | Wounded (below 50% HP): shooting cone and grenade scatter ×1.5; the worse arm counts | Disabled: shooting cone and grenade scatter ×2 |
| Left leg, right leg (each) | 70 | Usually none | Wounded (below 50% HP): +1 AP per tile per wounded leg; maximum stamina −1 per wounded leg | Disabled: movement cost ×2 (once, however many legs); a leg fracture ×1.5 stacks on top |

- Endurance modifies the base HP of every zone: × (0.5 + 0.75 × Endurance / 100). Frail soldiers start well below the base values (Endurance 20 = ×0.65, Endurance 40 = ×0.8), Endurance 67 matches them (×1.0), and Endurance 100 reaches 25% above them (×1.25).
- Bleeding drains HP from its zone every turn until treated (Medical).

## Medical system (draft)

**Draft — not final.** Deliberately basic: four conditions, a handful of items, and the Medical attribute deciding how well and how fast they are used.

**Conditions**

| Condition | Cause | Effect | Treated with |
| --- | --- | --- | --- |
| Light bleeding | Most hits | −1 HP per turn in that zone | Bandage, IFAK, medkit |
| Heavy bleeding | Hard hits, high bleeding chance on thorax and HP ammo | −4 HP per turn in that zone | Tourniquet (arms and legs), hemostatic dressing (any zone), medkit |
| Fracture | Heavy hits or falls on arms and legs | Arm: more aim spread and slower reloads. Leg: movement cost ×1.5, no sprinting | Splint |
| Pain | Damage, tourniquets | Fewer AP and more aim spread until masked | Painkillers (temporary) |

**Chances (draft)**

- **Bleeding:** checked for every hit that deals damage through armour (blunt hits never bleed). A **hard hit** deals at least 25% of the zone's max HP; it rolls for heavy bleeding first, and if that fails, for light bleeding. Other hits roll for light bleeding only. Chances are × the ammo's bleed modifier (HP ammo ×1.5) and × (1 − Endurance ÷ 400).

| Zone | Light bleeding | Heavy bleeding (hard hits) |
| --- | --- | --- |
| Head | 30% | 20% |
| Thorax | 50% | 35% |
| Arm | 40% | 25% |
| Leg | 40% | 25% |

- **Fracture:** a hit dealing at least 35% of an arm's or leg's max HP fractures it with 30% chance; a hit that disables the limb, with 60%. Falls come later (optional).
- **Pain:** starts when one hit deals at least 20% of a zone's max HP, when any zone is below 50% HP, or when a tourniquet is applied; it lasts while any zone is below 50% or a tourniquet is on. A new painkiller dose resets the mask to 10 turns; doses do not stack.

A zone at 0 HP stays as defined under Body zones (head or thorax: death; arm or leg: disabled). Damage that hits a disabled limb is split equally over all zones still above 0 HP, head and thorax included; so is the excess of the hit that disables the limb. Shares round down, and armour is checked only at the zone that was hit.

**Using medical items**

- Any soldier can use any item except the surgical kit (Medical 40+).
- Medical lowers the AP cost by 1 per 40 Medical (never below 1; the self-treatment and backpack surcharges are added after that) and raises HP restored by × (0.75 + Medical / 200).
- Items used from the vest or battle belt cost their normal AP; from the backpack they cost extra.
- A soldier can treat themselves at +2 AP, or a squadmate on an adjacent tile.

**Recovery after an op**

- Outside battle, soldiers recover HP every hour in every zone, faster the better the squad's best Medical and twice as fast at an FOB (draft: 1 HP per hour per zone, +1 per full 25 points of the squad's best Medical; ×2 at an FOB).

The medical items are listed in the [Item list](https://claude.ai/artifact/3ZE9h1z8kMDFDuWB4muJRJ).

## Tactical map generation (draft)

**Draft — not final.** Every tactical map is generated from the strategic tile where the encounter happens, with the battle seed. Same tile and seed, same map. All shares, sizes and thresholds below are draft values in `data/mapgen/tactical.json`; the building rules are data too, not code.

**Inputs**

- **Map type** from the strategic tile, in this order:
  1. a plant
  2. a border crossing
  3. a settlement (town, or city for small, large and capital)
  4. otherwise its terrain (steppe/farmland → open, woods, marsh, hills, mountains, shore)
- The four **neighbouring tiles**, the **roads** crossing the tile (track, road, highway) and the side the squad **approaches** from (by default the road it came in on).
- Tactical maps have no rivers; sea and lake shores stay.

**Map types**

| Type | Size (tiles) | Built share | Foliage share |
| --- | --- | --- | --- |
| Open | 80 | 6% | 15% |
| Woods | 64 | 3% | 50% |
| Marsh | 64 | 2% | 30% |
| Hills | 64 | 3% | 25% |
| Mountain | 48 | 2% | 20% |
| Town | 72 | 7% | 14% |
| City | 96 (small city 80) | 16% | 10% |
| Plant | 96 | 11% | 10% |
| Crossing | 64 | 5% | 14% |
| Shore | 64 | 3% | 15% |

Buildings appear only where the tile has a road, settlement, plant or crossing.

**Stages**

1. **Zones:** the map takes the tile's terrain. Within about a fifth of the map from an edge, it blends into the neighbour's terrain along a noisy line.
2. **Water:** shores from sea and lake neighbours. Water more than 4 tiles from the shore is deep and impassable.
3. **Roads:** each road on the tile enters at its matching edge and runs to a hub near the centre, away from water.
   - Width: highway 5, road 3, track 2 tiles.
   - Tracks and roads ford shallow water; deep water gets a bridge with railings.
   - A town adds village streets; open country with no road may get a farm track.
4. **Structures:** buildings, fences and props, placed before the ground is filled.
   - **Buildings are generated from floor-plan rules** (room types and size ranges, apartment layouts, shop ground floors). Walls, doors and windows sit on tile edges.
   - Per map type:
     - Cities get a street grid, or a Soviet housing block (khrushchyovkas around a courtyard), and part of the city's landmarks.
     - Towns get house plots with gardens, a school or admin building and sometimes a war memorial.
     - Plants get a fenced compound: hall, warehouses, admin, checkpoint, and tanks or bunkers by plant type.
     - Crossings get a checkpoint, customs and sandbag positions.
     - Countryside with a road gets a kolkhoz yard or a single hut.
   - **Levels:**
     - Every building has a playable ground floor.
     - **Large buildings** (3 or more floors — apartment blocks, khrushchyovkas, offices, schools, hospitals, landmarks — plus warehouses and plant halls) also have a playable flat **roof**, reached by an inside stairwell next to the main entrance (in apartment blocks, their stairwell core). Stairs cost +1 AP per tile.
     - The roofs of small buildings are scenery.
     - Taller buildings show their real height, but only the playable levels can be entered.
     - A playable **second floor** for large buildings is OPTIONAL (left out of the first build iterations).
     - The terrain is flat.
5. **Fields and shelterbelts:** on farmland, a grid of 2-tile tree lines (about a third with gaps) divides the land into crop fields and meadows.
6. **Ground fill:** the remaining tiles are filled by a seeded wave function collapse. It uses grass, brush, trees, mud and rock with adjacency rules (rock only next to grass, brush, trees or rock; mud never next to rock) and aims for the map type's foliage share.
7. **Details:** tree trunks, road wrecks, craters (rubble and mud), potholes and scatter props. Then every walkable pocket is connected to the main area, by a footbridge or a cleared gap.
8. **Exits and deployment:**
   - **Exits:** 2–4 exits on the map edge, at least 20 tiles apart.
     - Every exit in the tactical map request is placed first.
     - Then road exits: a road needs vehicle fuel, a road across the border a paid crossing.
     - Then 6-tile exits on foot, up to the count.
   - **Player zone:** on the approach edge.
   - **Enemy zone:** around the objective when the tile has a point of interest, else on the opposite edge.
9. **Checks and re-roll:** a layout that fails a required check is generated again with the next seed, up to 6 times.
   - **Required:** 2–4 exits; both zones and every exit connected on foot (vaulting counts); every building can be entered.
   - **Reported:** foliage and built shares within 6 points of the map type; roads leave through their edges; room rules met; no vegetation on roads; every room reachable from a door.

**Tiles, cover and doors**

- **Ground:** road, floor, grass, field, brush, trees, mud, rubble, shallow and deep water, rock.
  - **Move costs** follow the terrain table: shallow water, mud, rubble, dense brush +1.
  - **Impassable:** rock, tree trunks, deep water and blocking props.
- **Cover edges:** none, half (windows, fences, sandbags, low walls, about 1.0 m) or full (walls, closed doors).
  - Half-cover edges are crossed only by vaulting (4 AP, 3 with Agility 70+).
- **Doors:** closed doors block sight and movement.
  - Walking through a closed, unlocked door opens it as part of the move, for +1 AP.
  - Closing an adjacent door costs 1 AP.
  - Interior doors are never locked.
  - Outer doors are locked at 25% on warehouses, plant buildings and buildings at points of interest, and at 10% on houses.
  - A locked door opens with bolt cutters, the POI key or a demolition charge.
- **Destruction:** every cover edge has material HP (wood 40, brick 120, metal 200, vehicle 150, concrete 300). Bullets do not damage edges.
  - **Grenades:** a grenade hits every edge within its radius that has no full cover between it and the blast point (the first wall takes the blast), for 3 × its blast damage at that distance. A frag grenade (100 at the centre) breaks wood and doors nearby, dents brick and leaves concrete standing.
  - **Demolition charges:** a charge goes off only when its placer sets it off by remote trigger, a separate action (see Tactical actions); it always destroys the edge it is placed on, and its blast hurts soldiers nearby by the grenade blast rules (draft: as a frag grenade, 100 at the centre, radius 4 tiles).
  - An edge at 0 HP becomes rubble with no cover.

**Concealment**

Brush, trees and tall crops are **obscuring terrain**.

- **When it applies:** the target stands on an obscuring tile, or the line of fire passes through one or more beyond the shooter's own tile (firing out of a bush does not shift the shooter's aim).
- **The shift:** once the shot action is confirmed, the aim point (the centre of the spread cone) moves 2 MoA on the game scale (about 1 cm per tile of distance) in a random direction.
  - The direction comes from the battle's seeded random stream.
  - The shift happens once per shot action, so every round of a burst uses the same shifted cone.
  - It does not add up when the line crosses several obscuring tiles.
- **Hit logic is unchanged:** the shifted cone is traced against hit boxes and cover as usual.
- **Shot preview:** it shows the unshifted cone and marks the target as concealed. The real shift is unknown until the shot is confirmed, so the shown hit % is the best case.
- **Spotting:** a soldier standing on an obscuring tile is also harder to spot. Their concealment in the spotting rule (see Sight and spotting: Recon, Agility and stance) is × 0.7. E.g. an average soldier crouching in brush: 0.6 × 0.7 = 0.42, so seen within about 18 tiles instead of 25.

**Optional extras (OPTIONAL — left out of the first build iterations)**

- **Tall crops:** sunflower and maize fields. They hide soldiers but give no cover.
- **Loot containers:** 1 per building (2 in warehouses, barns and halls), on the side away from the door. On a retrieve mission, the container farthest from the player zone holds the mission item.
- **City landmarks:** each city has a fixed landmark roster (government house, theatre, hospital, school, department store, cinema, monument, eternal flame); a city map carries 1–3 of them.

**Randomness**

One random stream per stage, derived from the map seed. Tuning one stage does not change the others. The landmark roster uses its own stream per city name, so a city's landmarks are the same on every map.

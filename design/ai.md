# Concisus – AI

Nov 24, 2026 · @Dan

Modules `modules/strategic-ai/` and `modules/tactical-ai/`; they own no state and issue player commands. Part of the [Concisus – Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo), which holds the overview, factions & campaign and the module map.

## Overview

Each layer's AI is a separate module. It sees only what its side knows under fog of war and issues the same commands a player does; it never changes game state directly. Both layers use utility AI: each agent scores the actions available to it and picks the best one, so behaviour comes from shared situation maps and from agents reacting to each other, not from scripts.

- **Data:** weights, response curves and faction doctrines are data in /data/ai/, tuned like other content. All behaviour values are unset for now.
- **Logging:** every decision is logged with its top-scored options, so behaviour can be inspected and explained.

## Strategic AI

**Faction behaviour:** every faction pursues its own goals on the map, not the player. A faction only turns hostile toward the player when:

1. its reputation with the player is Hostile,
2. it has a specific mission targeting the player (a hunt, a counter-attack on an FOB), or
3. it is Unfriendly or worse toward the player and both are after the same objective at the same time.

For condition 3, the player's objective is the target or location of a mission in a contract the player has signed, once the faction's intel reveals it. Otherwise its units go about their business, on the strategic map and in tactical engagements alike. Attacking a non-hostile faction is the player's choice — and costs reputation.

**Faction AI tiers.** Each faction AI works toward its ultimate goal (SSV and VDK: hold the capital and most of the country; Varyag and Aegis: profit and keep their patron standing; the Krug: keep its trade routes and markets and avoid open war; resistance groups: survive and harass the controller until it leaves their area; a rogue PMC with no patron: seize and hold the capital or plants) in three tiers:

| Tier | Role |
| --- | --- |
| Situation maps | Per-region values computed every hour: own and enemy strength, economic value, threat, frontline, supply reach |
| Strategist | Scores candidate objectives: own gain + damage to rivals − cost − risk + a commitment bonus for current plans |
| Operational planner | Assigns squads to objectives, or offers a contract when its own squads can't reach the objective or are worth more elsewhere |

Other factions evaluate contract offers with the same utility scoring. The Krug scores escort requests the same way and may refuse one (low standing, few free squads, a dangerous route). Faction personalities come from doctrine data: aggression, risk tolerance, contract use and hostility per faction. Resistance groups and a rogue PMC get their own controller and doctrine. Draft character: SSV aggressive, accepts losses, hires PMCs for deniable strikes; VDK cautious, holds cities, leans on contracts and intel; Varyag bold hunter, high risk tolerance; Aegis careful and precise, avoids even fights; Krug avoids open fights, guards markets and routes; resistance hit-and-run, never a pitched battle; rogue PMC all-in on the capital and plants.

**Controller hand-off.** The Strategic Layer decides when a faction acts; `strategic-ai` decides what it does. For every hour that passes, every faction gets its perception view (what it knows under fog of war) and returns commands: set a goal, move a squad, offer a contract. The Strategic Layer validates and resolves them; contract offers go on to Management. The civilian population and the off-map influences are never AI controllers.

## Tactical AI

Enemy squads take roles: flank, suppress, retreat, call reinforcements (OPTIONAL — later build; until then a side fights with what is on the map). Units of non-hostile factions on the same map follow their own objectives and only engage under the faction behaviour rules above. A neutral side that turns hostile uses a fixed default: it attacks the side that attacked it and retreats at the normal acceptable loss. Civilians never turn hostile; they only flee.

**Unit scoring.** Each unit scores its candidate actions, weighted in this order of importance:

1. **Survival:** exposure, threat, HP, morale. It acts as a multiplier that dominates as danger rises, not as a hard rule that blocks everything else.
2. **Battle goal:** progress toward the objective and the squad's current plan.
3. **Action fit:** how effective each action is in the current situation.
4. **Coordination:** bonuses for answering squad requests, penalties for tiles or targets a squadmate has claimed.

A squad leader sets the squad plan and roles: the highest-ranked soldier (rank: Recruit, Regular, Veteran, Elite, as in Management; on a tie, the one with the highest average attribute value), who also lends the whole squad, itself included, a small Leadership bonus to morale and reactions; if it dies, the next highest takes over at its next activation and keeps the plan. Units coordinate through a shared blackboard of requests and claims. The battle goal and an acceptable-loss threshold come from the strategic layer, through the tactical map request; the threshold is the share of the side's soldiers out of action (dead, or left the map), and once it is reached the side retreats to an exit and leaves the map. A command the tactical layer rejects goes back to the AI with the reason, up to 3 times; then that activation ends. An AI soldier knows as much about a seen enemy's gear as the player would (weapon type, helmet and armour class).

**Controller hand-off.** The Tactical Layer decides when a unit acts; `tactical-ai` decides what it does.

1. At an AI-controlled unit's activation, the Tactical Layer builds a **perception view**: what that unit and its squad know under fog of war.
2. It passes the view to the controller of that side: player input for the player's squad, `tactical-ai` for enemies and for allied AI units (defenders, convoys, an escorted VIP).
3. The controller returns **commands**, the same ones the player issues: move, shoot, set reaction, take cover.
4. The Tactical Layer validates them and resolves them with its normal rules.

The modules never import each other: the game shell plugs `tactical-ai` in as the enemy controller when a battle starts, and the Test Lab can plug in the real AI, a scripted stub or a second AI. The AI cannot see hidden state or issue illegal actions.

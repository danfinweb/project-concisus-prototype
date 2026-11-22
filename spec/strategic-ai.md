# Strategic AI — spec [SAI]

Precise rules derived from `design/`. Each section: `### [SAI-NNN] Title`, then the rule
(inputs, outputs, formula, ranges), its design source, and `→ data/<table>.json` where a concrete value
lives in data. Edited only through `/update-spec`.

`modules/strategic-ai` decides what a non-player faction does on the strategic map. It owns no state: it
reads a strategic perception view and returns strategic commands (`spec/interfaces/`). When a faction acts,
how commands are validated and resolved, faction goals and squad simulation are STR; contracts and
reputation are MGT. Faction IDs are those of GEN-004.

## Controller contract

### [SAI-001] Controller role
**Rule.** The Strategic Layer decides when a faction acts; `strategic-ai` decides what it does. The module
is a pure function `decide(view, rng) → { commands, log }`: no DOM, no fetch, no imports from other
modules; data (doctrines) through `shared/registry.js`; randomness only through the passed seeded `rng`
(`shared/rng.js`). Same view, same data and same seed give the same output.
**Source.** design/design.md › AI; › AI › Strategic AI › Controller hand-off; CLAUDE.md › Rules, State ownership

### [SAI-002] Invocation
**Rule.** After each player action, the Strategic Layer builds one perception view per AI faction (`ssv`,
`vdk`, `varyag`, `aegis`, `krug`) and calls the faction's controller with it. The number of actions a
faction gets for the elapsed time (one per hour, STR) is decided by STR, not by SAI. The controller is
pluggable: the game shell plugs in `strategic-ai`; the Test Lab may plug in a scripted stub or another AI.
**Source.** design/design.md › AI › Strategic AI › Controller hand-off; › Strategic Layer (Time)

### [SAI-003] Strategic perception view
**Rule.** The view contains only what that faction knows under fog of war (STR fog-of-war rules); hidden
state never appears in it. Fields (schema: `spec/interfaces/strategic_perception_view.schema.json`):

| Field | Content |
| --- | --- |
| `faction` | ID of the deciding faction |
| `time` | Current day and hour |
| `doctrine` | Doctrine ID to use (SAI-010) |
| `ownRegions` | Regions and points of interest it controls, with output and civilian loyalty |
| `ownSquads` | Its squads: ID, region, current goal and target, strength, supplies, fuel, morale |
| `knownRegions` | Every region it has seen: terrain, point of interest, controller, loyalty — current if in recon range, else last known state with the time observed |
| `knownSquads` | Foreign squads it knows of (including the player's): faction, region, estimated strength, time seen, known goal if intel reveals it |
| `relations` | Its relation to every other faction (−100…100, GEN-007) |
| `reputationWithPlayer` | Its reputation value toward the player and resulting standing (MGT) |
| `contracts` | Contracts it has posted, with status (open, accepted, done, failed) |
| `events` | World events and crisis signs it is aware of (STR) |

**Source.** design/design.md › AI › Strategic AI › Controller hand-off; › Strategic Layer › Map (Fog of war)

### [SAI-004] Strategic command set
**Rule.** The controller returns an ordered list of commands of the kinds a player issues on the strategic
map (schema: `spec/interfaces/strategic_commands.schema.json`):

| Command | Fields | Resolved by |
| --- | --- | --- |
| `setGoal` | `squad` (own squad ID), `goal` (STR goal type: patrol, supplyRun, attackPoi, holdPoi, escort, tradeRoute, hunt), `target` (region, POI, squad or the player) | STR |
| `moveSquad` | `squad`, `toRegion` (adjacent region) | STR |
| `offerContract` | the contract terms of MGT: goal reference, missions, targets and locations, deadline (hours), pay, intel level, deniable flag | STR validates, then MGT |
| `pass` | — | STR |

The Strategic Layer validates every command; an illegal command (unknown or foreign squad, impassable or
non-adjacent region, contract by a faction that may not post it) is rejected and not resolved. Contract
offers are forwarded to Management.
**Source.** design/design.md › AI › Strategic AI › Controller hand-off; › AI (intro)

### [SAI-005] No hidden information, no illegal actions
**Rule.** The AI reads nothing but its view and `/data`; it issues only commands from SAI-004. Tests assert
that a view built with fog of war never contains unseen squads or regions newer than their last observation.
**Source.** design/design.md › AI (intro); › AI › Tactical AI (last paragraph, applies to both layers)

## Decision structure

### [SAI-006] Utility scoring
**Rule.** Every decision enumerates candidate options, scores each as the weighted combination of its
considerations, every consideration mapped through a response curve to 0–1, and picks the highest score
(ties broken by `rng`). Considerations, weights and curves come from the faction's doctrine (SAI-010).
**Values.** considerations, weights, curves per doctrine — not set (design: Open) → data/ai/doctrines.json.
**Source.** design/design.md › AI (utility-AI structure defined in the workflow doc)

### [SAI-007] Tier 1 — situation maps
**Rule.** From the view, the AI first derives per-region situation maps (e.g. own and known enemy
strength, threat, value of points of interest, distance from own bases). They are recomputed for every call
and never stored. Only view data may enter them.
**Values.** map layers and their formulas — not set (design: Open) → data/ai/doctrines.json.
**Status.** open
**Source.** design/design.md › AI (workflow doc architecture)

### [SAI-008] Tier 2 — strategist
**Rule.** The strategist chooses the faction's goals (STR goal types) and their targets by utility over the
situation maps. It follows SAI-012: goals serve the faction's own aims, not the player.
**Status.** open
**Source.** design/design.md › AI › Strategic AI › Faction behaviour; › Strategic Layer › Squads and simulation

### [SAI-009] Tier 3 — operational planner
**Rule.** The operational planner turns goals into commands: assigns own squads (`setGoal`), moves them
(`moveSquad`), and for a goal it cannot cover with its own squads, or wants deniable, emits
`offerContract` (SAI-014).
**Status.** open
**Source.** design/design.md › AI › Strategic AI › Controller hand-off; › Management › Contracts and missions › Where contracts come from

### [SAI-010] Doctrines
**Rule.** `data/ai/doctrines.json` holds one record per doctrine with `layer: "strategic"`; each faction
references one doctrine (via `data/factions.json` or the doctrine's `factions` list). A doctrine sets the
weights and curves of SAI-006 to SAI-009. Faction character from the design (Varyag hunts player ops and
competes for contracts; the Krug is neutral) is expressed through doctrine weights, not code.
**Values.** all doctrine values — not set (design: Open) → data/ai/doctrines.json.
**Source.** design/design.md › Factions & campaign › Factions; CLAUDE.md (data/ai)

### [SAI-011] Decision log
**Rule.** Every call returns `log` entries alongside the commands: one per decision, with `time`, `faction`,
`tier` (situation, strategist, planner), the chosen option, and the top-scored options with their total score
and per-consideration scores. The caller (game shell, Test Lab) stores or shows the log; the AI keeps none.
**Values.** `logTopN` (options kept per decision) — not set (design: Open) → data/ai/doctrines.json.
**Source.** design/design.md › AI (workflow doc architecture)

## Faction behaviour

### [SAI-012] Own goals
**Rule.** Every AI faction pursues its own goals on the map, not the player. Its squads go about their
goals on the strategic map and in tactical engagements alike unless SAI-013 makes it hostile.
**Source.** design/design.md › AI › Strategic AI › Faction behaviour

### [SAI-013] Hostility toward the player
**Rule.** A faction is hostile toward the player only while at least one holds:
1. its reputation with the player is low (spec: standing Hostile, reputation ≤ −50, MGT standing table);
2. it has a mission targeting the player (a hunt, a counter-attack on an FOB);
3. it and the player pursue the same objective at the same time.
Otherwise it is non-hostile. The AI may only target the player (goal `hunt`/`attackPoi` against a player
FOB, `moveSquad` to engage) while hostile. Attacking a non-hostile faction is the player's choice and costs
reputation (MGT).
**Values.** `lowReputationThreshold` — design "low" (spec: −50) → data/factions.json.
**Source.** design/design.md › AI › Strategic AI › Faction behaviour; › Management › Reputation › Standing

### [SAI-014] Contract offers
**Rule.** A faction posts a contract (`offerContract`) for a goal it cannot cover with its own squads or
wants deniable. With intel on a rival's goal it may post a counter-contract against it. Offers carry the MGT
contract terms; Management validates pay, filters by reputation and shows them.
**Values.** "cannot cover" and deniability thresholds — not set (design: Open) → data/ai/doctrines.json.
**Source.** design/design.md › Management › Contracts and missions › Where contracts come from; › AI › Strategic AI › Controller hand-off

## Open questions

1. SAI-002 — Design says factions get a view "after each player action", STR says one faction action per
   elapsed hour. Spec: STR decides the count; confirm whether SAI is called once per hour or once per player
   action with several actions returned.
2. SAI-003 — Exact view fields depend on STR (squad strength model, fog of war, intel). To be finalised with
   the STR spec and the interface schema.
3. SAI-006–SAI-009 — The workflow doc's utility-AI structure is not in `design/`; consideration lists,
   curve types and the combination rule (weighted sum or product) need confirmation.
4. SAI-013 — "Reputation is low" is not quantified; spec uses Hostile (≤ −50). The MGT standing table
   also makes Unfriendly factions hostile when competing for the same objective, while condition 3 applies at
   any standing. Which rule holds?
5. SAI-004 — Do desperate measures, world-event responses, recruiting, trading or buying gear go through
   SAI commands, or does STR resolve them by rule?
6. SAI-001 — Aegis "learns the player's habits and adapts over time" (GEN leader effect) and hunts need
   memory across calls, but the AI owns no state. Where does that memory live (world slice, passed in the
   view)?
7. SAI-002 — Is the civilian population (non-combat faction) or the off-map influences ever an AI
   controller? Spec: no.
8. SAI-010 — Per-faction doctrines and their character (SSV, VDK, Aegis) are not described beyond the faction
   roles.

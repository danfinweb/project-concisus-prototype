# Tactical AI — spec [TAI]

Precise rules derived from `design/`. Each section: `### [TAI-NNN] Title`, then the rule
(inputs, outputs, formula, ranges), its design source, and `→ data/<table>.json` where a concrete value
lives in data. Edited only through `/update-spec`.

`modules/tactical-ai` decides what an AI-controlled unit does at its activation. It owns no state: it reads
a tactical perception view and returns tactical commands (`spec/interfaces/`). Activation order, action
costs, validation and resolution are TAC; hostility between factions is SAI-013.

## Controller contract

### [TAI-001] Controller role
**Rule.** The Tactical Layer decides when a unit acts; `tactical-ai` decides what it does. The module is a
pure function `decide(view, rng) → { commands, blackboardWrites, log }`: no DOM, no Three.js, no fetch, no
imports from other modules; doctrines through `shared/registry.js`; randomness only through the passed
seeded `rng`. Same view, same data and same seed give the same output.
**Source.** design/design.md › AI › Tactical AI › Controller hand-off; CLAUDE.md › Rules, State ownership

### [TAI-002] Invocation
**Rule.** At an activation of an AI-controlled unit, and when the AI side picks which unit to activate
(TAC turn structure), the Tactical Layer builds a perception view and passes it to that side's controller:
player input for the player's squad; `tactical-ai` for enemies and for allied AI units on the player's side
(defenders, convoys, an escorted VIP). The controller returns commands; TAC validates and resolves them
with its normal rules. Reaction settings chosen during an activation are applied by TAC automatically; the
AI is not called mid-move.
**Source.** design/design.md › AI › Tactical AI › Controller hand-off; › Tactical Layer › Turn structure › Reactions

### [TAI-003] Pluggable controller
**Rule.** The game shell plugs `tactical-ai` in as the enemy (and allied-AI) controller when a battle
starts. The Test Lab can plug in the real AI, a scripted stub or a second AI for either side. All
controllers use the same view and command interfaces.
**Source.** design/design.md › AI › Tactical AI (last paragraph)

### [TAI-004] Tactical perception view
**Rule.** The view holds what the unit and its squad know under fog of war; hidden state never appears.
Fields (schema: `spec/interfaces/tactical_perception_view.schema.json`):

| Field | Content |
| --- | --- |
| `side`, `faction`, `doctrine` | Controlled side, faction ID, doctrine ID (TAI-015) |
| `turn`, `timeOfDay` | Turn number; day or night battle (TAC) |
| `activeUnit` | Unit to act (null when choosing which unit to activate) |
| `squad` | Own units: position, level, facing, stance, AP, stamina, HP per zone, conditions, suppressed flag, reaction setting, loadout with ammo counts |
| `squadPlan` | Current plan set by the squad leader (TAI-013) |
| `blackboard` | Squad requests and claims (TAI-012) |
| `knownEnemies` | Opposing units seen now (position, stance, facing, visible gear) or last seen/heard (position, turn) |
| `knownNeutrals` | Units of non-hostile factions known on the map |
| `noises` | Shots and loud noises heard since the unit's last activation: origin or direction, turn |
| `map` | Tiles known to the side: terrain cost, cover per tile edge, levels, doors/windows, exits |
| `battleGoal` | The side's objective in this battle (attack, defend, escort, reach an exit, hold) and its targets |
| `queries` | Read-only functions answering only from known information, as the player UI does: path preview (AP cost), line of sight, shot preview (hit %, likely zone, penetration) |

**Source.** design/design.md › AI › Tactical AI › Controller hand-off (1); › Tactical Layer (Readability, Path preview)

### [TAI-005] Tactical command set
**Rule.** Commands are the ones the player issues; each maps to one tactical action of TAC
(`design/tactical-actions.md`). Schema: `spec/interfaces/tactical_commands.schema.json`.

| Command | Fields |
| --- | --- |
| `activate` | `unit` — choose the unit for this activation |
| `pass` | — |
| `move` | `path` (tiles), `stance`, `sprint` |
| `changeStance` | `stance` (upright, crouched, prone) |
| `turn` | `facing` |
| `shoot` | `target` (unit or tile), `fireMode`, `aimLevel` |
| `reload` | `magazine` source container |
| `swapWeapon` | — |
| `throwGrenade` | `target` tile |
| `useItem` | `item`, `targetUnit` (self or adjacent squadmate) |
| `takeCover` | `tile` (adjacent cover) or `stance` |
| `setReaction` | `fire`, `takeCover`, `hold` |
| `interact` | drop backpack, pick up or loot, cut lock, place charge, restrain VIP, leave at exit |
| `endActivation` | `facing` (final facing, free) |

TAC validates every command; an illegal command (not enough AP, no line of sight, invalid path) is
rejected and not resolved.
**Source.** design/design.md › AI › Tactical AI › Controller hand-off (3, 4); design/tactical-actions.md

### [TAI-006] No hidden information, no illegal actions
**Rule.** The AI reads nothing but its view, its `queries` and `/data`; it issues only TAI-005 commands.
Tests assert that the view contains no unit outside the side's line of sight or hearing except as last-known
entries.
**Source.** design/design.md › AI › Tactical AI (last paragraph)

## Decision structure

### [TAI-007] Utility score
**Rule.** For every candidate action the AI computes
`score = survival × (wGoal × battleGoal + wFit × actionFit + wCoord × coordination)`, each consideration
in 0–1 through its response curve; the highest score wins (ties by `rng`). Weights and curves come from the
doctrine.
**Values.** `wGoal`, `wFit`, `wCoord`, curves — not set (design: Open) → data/ai/doctrines.json.
**Source.** design/design.md › AI (utility-AI structure defined in the workflow doc)

### [TAI-008] Survival
**Rule.** `survival` (0–1) multiplies the score: an action that leaves the unit exposed to known threats
(no cover against known enemies, low HP, heavy bleeding, exhausted stamina) scores near 0 regardless of the
other considerations.
**Values.** threat inputs and curve — not set (design: Open) → data/ai/doctrines.json.
**Status.** open
**Source.** design/design.md › AI (workflow doc architecture)

### [TAI-009] Battle goal
**Rule.** `battleGoal` (0–1) rates how much the action advances `battleGoal` of the view (TAI-004).
**Values.** per goal type — not set (design: Open) → data/ai/doctrines.json.
**Status.** open
**Source.** design/design.md › AI (workflow doc architecture)

### [TAI-010] Action fit
**Rule.** `actionFit` (0–1) rates how well the action suits the unit: its role (TAI-014), weapon type
(DAT-011 `weaponType` drives AI role), range to target, ammo and AP left.
**Values.** — not set (design: Open) → data/ai/doctrines.json.
**Status.** open
**Source.** design/design.md › Data definitions › Weapon profile (Weapon type → AI role); › AI (workflow doc)

### [TAI-011] Coordination
**Rule.** `coordination` (0–1) rates how well the action answers open requests on the squad blackboard and
avoids claims held by other units.
**Values.** — not set (design: Open) → data/ai/doctrines.json.
**Status.** open
**Source.** design/design.md › AI (workflow doc architecture)

### [TAI-012] Squad blackboard
**Rule.** Each squad has a blackboard of `requests` (e.g. suppress target X, cover sector Y, reinforce) and
`claims` (unit U takes request R, until turn T). The AI owns no state: the blackboard is stored by TAC in the
`battle` slice, passed in the view, and changed only through `blackboardWrites` returned by the AI. TAC
applies the writes without interpreting them.
**Source.** design/design.md › AI (workflow doc architecture); CLAUDE.md › State ownership

### [TAI-013] Squad leader plan
**Rule.** The squad leader's activation also sets the squad plan (assigns roles, TAI-014, and posts requests
to the blackboard); other units read the plan from the view. If the leader is down, the plan stays until a
new leader is chosen.
**Values.** leader succession — not set (design: Open).
**Status.** open
**Source.** design/design.md › AI (workflow doc architecture); › AI › Tactical AI (roles)

### [TAI-014] Squad roles
**Rule.** Enemy squads assign units the roles `flank`, `suppress`, `retreat`, `callReinforcements`. A role
changes `actionFit` for actions that match it.
**Status.** open (how reinforcements arrive is not designed)
**Source.** design/design.md › AI › Tactical AI; › Tactical Layer (Enemy AI)

### [TAI-015] Doctrines
**Rule.** `data/ai/doctrines.json` holds records with `layer: "tactical"`; the battle setup passes the
doctrine ID per side or squad in the view. A doctrine sets weights and curves of TAI-007 to TAI-014.
**Values.** all — not set (design: Open) → data/ai/doctrines.json.
**Source.** CLAUDE.md (data/ai); design/design.md › AI

### [TAI-016] Decision log
**Rule.** Every call returns `log` entries: `turn`, `unit`, the chosen command, and the top-scored options
with total score and the four consideration scores. TAC, the game debug overlay or the Test Lab stores or
shows them; the AI keeps none.
**Values.** `logTopN` — not set (design: Open) → data/ai/doctrines.json.
**Source.** design/design.md › AI (workflow doc architecture); › Presentation & tech › Prototype tech stack (Debugging)

## Faction behaviour in battle

### [TAI-017] Non-hostile units
**Rule.** Units of a faction that is non-hostile toward the player (SAI-013) follow their own objectives
and engage the player's units only once the hostility rules make them hostile (e.g. the player attacks
them).
**Source.** design/design.md › AI › Tactical AI; › AI › Strategic AI › Faction behaviour

### [TAI-018] Allied AI units
**Rule.** Allied units on the player's side under AI control (defenders in "help defend a territory",
convoy vehicles, an escorted VIP) use `tactical-ai` with the player's side as `side`; their `battleGoal`
comes from the mission (MGT).
**Source.** design/design.md › AI › Tactical AI › Controller hand-off (2); › Management › Contracts and missions

## Open questions

1. TAI-007–TAI-013 — The workflow doc's utility-AI structure is not in `design/`; this spec takes the
   architecture (survival multiplier, battle goal, action fit, coordination, blackboard, squad leader plan)
   from the repo brief. The combination rule (weighted sum inside the multiplier), curve types and
   consideration inputs need confirmation.
2. TAI-018 — The escorted VIP is "a lightly armed unit the player controls" (Management › Escort a VIP) but
   `tactical-ai` controls it (AI › Tactical AI). Which one?
3. TAI-017 — TAC allows "never more than two sides on a tactical map", but non-hostile faction units may be on
   the same map. Are they a third, neutral side, and who activates them?
4. TAI-014 — How "call reinforcements" works (who arrives, from where, when) is not designed.
5. TAI-005 — Does a rejected command end the activation, or is the controller asked again? Limit on retries?
6. TAI-002 — Does the AI choose which unit to activate (TAC: "each side picks any soldier"), and is that a
   separate call?
7. TAI-004 — How much of the visible gear of a seen enemy is known (armour class, weapon)? Shot preview
   requires target armour; the player sees "whether the round penetrates".
8. TAI-013 — Who is the squad leader in battle (highest rank, mission data) and what happens when it dies?

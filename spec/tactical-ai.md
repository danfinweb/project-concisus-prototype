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
(defenders, convoys, an escorted VIP, TAI-018). The neutral side (TAC-001) never activates, so it is never
invoked for an activation. The controller returns commands; TAC validates and resolves them
with its normal rules. Reaction settings chosen during an activation are applied by TAC automatically; the
AI is not called mid-move.
**Source.** design/design.md › AI › Tactical AI › Controller hand-off; › Tactical Layer › Turn structure › Reactions

### [TAI-003] Pluggable controller
**Rule.** The game shell plugs `tactical-ai` in as the enemy, allied-AI and neutral-side controller when a
battle starts. The controller is assigned per unit, so a single unit can be swapped between player input and
`tactical-ai` (used for the escorted VIP option, TAI-018). The Test Lab can plug in the real AI, a scripted
stub or a second AI for either side. All controllers use the same view and command interfaces.
**Source.** design/design.md › AI › Tactical AI (last paragraph); design/design.md › Tactical Layer › Turn structure (neutral side); design/design.md › Management › Contracts and missions (Escort a VIP)

### [TAI-004] Tactical perception view
**Rule.** The view holds what the unit and its squad know under fog of war; hidden state never appears.
Fields (schema: `spec/interfaces/tactical_perception_view.schema.json`):

| Field | Content |
| --- | --- |
| `side`, `faction`, `doctrine` | Controlled side, faction ID, doctrine ID (TAI-015) |
| `turn`, `timeOfDay` | Turn number; day or night battle (TAC) |
| `activeUnit` | Unit to act (null when choosing which unit to activate) |
| `squad` | Own units: position, level, facing, stance, rank, AP, stamina, HP per zone, limb states (wounded/disabled), conditions, suppressed and overwatch flags, alerted flag, reaction setting, carried body, loadout with magazine and round counts, out-of-action flag |
| `squadPlan` | Current plan set by the squad leader (TAI-013) and the current leader's unit ID |
| `blackboard` | Squad requests and claims (TAI-012) |
| `knownEnemies` | Opposing units seen now (position, stance, facing, and the gear the player would see: weapon type, helmet armour class, body armour class) or last seen/heard (position, turn) |
| `knownNeutrals` | Units of the neutral side known on the map (TAC-001) |
| `noises` | Noise markers since the unit's last activation (TAC-019): origin tile, turn |
| `map` | Tiles known to the side: terrain cost, cover per tile edge, levels, doors/windows, exits, containers and bodies with their contents once searched by the side (TAC-070), smoke clouds |
| `battleGoal` | The side's objective in this battle (attack, defend, escort, reach an exit, hold), its targets and its `acceptableLoss` threshold, as set by the strategic layer in the tactical map request (TAI-009) |
| `queries` | Read-only functions answering only from known information, as the player UI does: path preview (AP cost), line of sight, shot preview (hit %, likely zone, penetration) |

An AI soldier knows as much about a seen enemy's gear as the player would: weapon type, helmet and armour
class (as shown in the shot preview), nothing more (no durability, no carried items).
**Source.** design/design.md › AI › Tactical AI › Controller hand-off (1); › Unit scoring; › Tactical Layer (Readability, Path preview); › Tactical Layer › Turn structure › Gunshot noise

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
| `reload` | `magazine` item and its source container; for a tube, `shells` (count) |
| `swapWeapon` | — |
| `throwGrenade` | `grenade` item, `target` tile |
| `useItem` | `item`, `targetUnit` (self or adjacent squadmate) |
| `takeCover` | `tile` (adjacent cover) or `stance` |
| `setReaction` | `fire`, `takeCover`, `hold` |
| `holdOverwatch` | — (TAC-075) |
| `liftBody` | `body` (adjacent), `mode` (`carry`, `drag`) (TAC-074) |
| `putDownBody` | — |
| `interact` | drop backpack, pick up backpack, open container or search body, take item, cut lock, place charge, restrain VIP, leave at exit (also at activation start without moving, TAC-038) |
| `endActivation` | `facing` (final facing, free) |

TAC validates every command; an illegal command (not enough AP, no line of sight, invalid path) is
rejected and not resolved.
**Source.** design/design.md › AI › Tactical AI › Controller hand-off (3, 4); design/tactical-actions.md (Hold overwatch, Reload, Carry or drag a body, Pick up or loot, Leave the map)

### [TAI-006] No hidden information, no illegal actions
**Rule.** The AI reads nothing but its view, its `queries` and `/data`; it issues only TAI-005 commands.
Tests assert that the view contains no unit outside the side's line of sight or hearing except as last-known
entries.
**Source.** design/design.md › AI › Tactical AI (last paragraph)

## Decision structure

### [TAI-007] Utility score
**Rule.** Tactical AI is a utility AI: each unit scores its candidate actions and the highest score wins
(ties by `rng`). Considerations in order of importance: survival (TAI-008), battle goal (TAI-009), action
fit (TAI-010), coordination (TAI-011). Survival is a multiplier, not a hard rule:
`score = survival × (wGoal × battleGoal + wFit × actionFit + wCoord × coordination)`, each consideration
in 0–1 through its response curve. Behaviour comes from the shared blackboard and units reacting to each
other, not from scripts. Weights and curves come from the doctrine (TAI-015).
**Values.** `wGoal`, `wFit`, `wCoord`, curves — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/design.md › AI (intro, Data); › AI › Tactical AI › Unit scoring

### [TAI-008] Survival
**Rule.** `survival` (0–1) multiplies the score. Inputs: the unit's exposure, the known threat, its HP and
its morale. Its curve keeps it near 1 when danger is low and lets it dominate the score as danger rises,
so an exposed, wounded or shaken unit prefers safe actions; it never blocks an action outright.
**Values.** input weights and curve — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/design.md › AI › Tactical AI › Unit scoring

### [TAI-009] Battle goal
**Rule.** `battleGoal` (0–1) rates the action's progress toward the side's objective (`battleGoal` in the
view, TAI-004) and toward the squad's current plan (TAI-013). The battle goal and an acceptable-loss
threshold come from the strategic layer through the tactical map request (`battleGoal` per AI side); TAC
passes both in the view. `acceptableLoss` is a share 0–1 of the side's soldiers out of action (dead,
disabled or fled); once that share is reached, the side's battle goal becomes retreat: its units move to an
exit and leave the map (TAC-038), and goal progress is scored toward that exit.
**Values.** goal weights per goal type — not set (design: all behaviour values unset) → data/ai/doctrines.json; `acceptableLoss` per battle goal — not set (draft) → set by the strategic layer in the tactical map request.
**Status.** open (threshold values; what "disabled" means for a whole soldier)
**Source.** design/design.md › AI › Tactical AI › Unit scoring

### [TAI-010] Action fit
**Rule.** `actionFit` (0–1) rates how effective the action is in the current situation for this unit: its
role (TAI-014), weapon type (DAT-011 `weaponType` drives AI role), range to target, ammo and AP left.
**Values.** — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/design.md › AI › Tactical AI › Unit scoring; › Data definitions › Weapon profile (Weapon type → AI role)

### [TAI-011] Coordination
**Rule.** `coordination` (0–1) gives a bonus for actions that answer open squad requests on the blackboard
and a penalty for actions on tiles or targets a squadmate has claimed (TAI-012).
**Values.** bonus and penalty sizes — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/design.md › AI › Tactical AI › Unit scoring

### [TAI-012] Squad blackboard
**Rule.** Each squad has a shared blackboard of `requests` (e.g. suppress target X, cover sector Y,
reinforce) and `claims` (unit U claims a tile, a target or request R, until turn T). The AI owns no state:
the blackboard is stored by TAC in the `battle` slice, passed in the view, and changed only through
`blackboardWrites` returned by the AI. TAC applies the writes without interpreting them.
**Source.** design/design.md › AI › Tactical AI › Unit scoring; CLAUDE.md › State ownership

### [TAI-013] Squad leader plan
**Rule.** The squad leader is the squad's highest-ranked soldier (unit `rank`, TAI-004). It sets the squad
plan and roles: its activation assigns roles (TAI-014) and posts requests to the blackboard; other units read
the plan from the view. If the leader dies, the next highest-ranked living soldier becomes leader at its next
activation and keeps the current plan. Until then the plan
stays as it was. Ties in rank are not resolved by the design.
**Status.** open (rank tie-break, rank source for AI soldiers)
**Source.** design/design.md › AI › Tactical AI › Unit scoring; › AI › Tactical AI (roles)

### [TAI-014] Squad roles
**Rule.** Enemy squads assign units the roles `flank`, `suppress`, `retreat`, `callReinforcements`. A role
changes `actionFit` for actions that match it.
**Status.** open (how reinforcements arrive is not designed)
**Source.** design/design.md › AI › Tactical AI; › Tactical Layer (Enemy AI)

### [TAI-015] Doctrines
**Rule.** `data/ai/doctrines.json` holds records with `layer: "tactical"`; the battle setup passes the
doctrine ID per side or squad in the view. A doctrine sets weights and curves of TAI-007 to TAI-014.
**Values.** all — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/design.md › AI (Data); CLAUDE.md (data/ai)

### [TAI-016] Decision log
**Rule.** Every call returns `log` entries: `turn`, `unit`, the chosen command, and the top-scored options
with total score and the four consideration scores. TAC, the game debug overlay or the Test Lab stores or
shows them; the AI keeps none.
**Values.** `logTopN` — not set (design: Open) → data/ai/doctrines.json.
**Source.** design/design.md › AI (Logging); › Presentation & tech › Prototype tech stack (Debugging)

## Faction behaviour in battle

### [TAI-017] Neutral side
**Rule.** Units hostile to neither side (a non-involved faction toward the player per SAI-013, civilians)
form the neutral side (TAC-001), controlled by `tactical-ai`. The neutral side never activates: its units
only react — take cover or flee — or turn hostile toward whoever attacks them. They follow their own
objectives only through these reactions. How `tactical-ai` chooses a neutral unit's reaction without an
activation is not designed.
**Status.** open
**Source.** design/design.md › Tactical Layer › Turn structure; › AI › Tactical AI; › AI › Strategic AI › Faction behaviour

### [TAI-018] Allied AI units
**Rule.** Allied units on the player's side under AI control (defenders in "help defend a territory",
convoy vehicles, an escorted VIP) use `tactical-ai` with the player's side as `side`; their `battleGoal`
comes from the mission (MGT). The escorted VIP is a lightly armed allied unit controlled by `tactical-ai` by
default; player control of the VIP is a switchable option (a setting that swaps that unit's controller,
TAI-003), so both can be tested.
**Values.** `vipControl` — `ai` (default) or `player` → game/Test Lab setting (not /data).
**Source.** design/design.md › AI › Tactical AI › Controller hand-off (2); › Management › Contracts and missions (Escort a VIP)

## Open questions

1. **Resolved (design 8972470):** the GDD now defines the structure — survival as a dominating multiplier,
   then battle goal, action fit, coordination; squad leader plan and roles; shared blackboard of requests and
   claims. Curve types and consideration formulas stay data. TAI-007–TAI-013 — The workflow doc's utility-AI structure is not in `design/`; this spec takes the
   architecture (survival multiplier, battle goal, action fit, coordination, blackboard, squad leader plan)
   from the repo brief. The combination rule (weighted sum inside the multiplier), curve types and
   consideration inputs need confirmation.
2. **Resolved (design eb072a2):** the escorted VIP is an allied unit controlled by `tactical-ai` by default; player control is a switchable option (per-unit controller swap). TAI-018 — The escorted VIP is "a lightly armed unit the player controls" (Management › Escort a VIP) but
   `tactical-ai` controls it (AI › Tactical AI). Which one?
3. **Resolved (design eb072a2):** yes — units hostile to neither side form a third, neutral side controlled by `tactical-ai`; it never activates, its units only react (take cover, flee) or turn hostile when attacked (TAC-001, TAI-017). How its reactions are chosen is question 11. TAI-017 — TAC allows "never more than two sides on a tactical map", but non-hostile faction units may be on
   the same map. Are they a third, neutral side, and who activates them?
4. TAI-014 — How "call reinforcements" works (who arrives, from where, when) is not designed.
5. TAI-005 — Does a rejected command end the activation, or is the controller asked again? Limit on retries?
6. TAI-002 — Does the AI choose which unit to activate (TAC: "each side picks any soldier"), and is that a
   separate call?
7. **Resolved (design eb072a2):** as much as the player would see: weapon type, helmet and armour class (as in the shot preview). TAI-004 — How much of the visible gear of a seen enemy is known (armour class, weapon)? Shot preview
   requires target armour; the player sees "whether the round penetrates".
8. **Resolved (design eb072a2):** the highest-ranked soldier; when it dies, the next highest takes over at its next activation and keeps the plan (tie-break: question 13). TAI-013 — Who is the squad leader in battle (highest rank, mission data) and what happens when it dies?
9. **Resolved (design eb072a2):** the threshold is the share of the side's soldiers out of action (dead, disabled or fled); once reached, the side retreats to an exit and leaves the map; the value per battle goal comes from the strategic layer (draft, not set). TAI-009 — What does the acceptable-loss threshold do once reached (forced retreat, retreat role, only a
   weight shift), and in what unit is it measured (soldiers lost, share of strength)? Who sets it: SAI, or
   STR by rule?
10. TAI-008 — Morale is an input to survival, but the tactical morale model for AI units is not in the
    view yet (TAI-004 lists no morale field). Add one?
11. TAI-017 — The neutral side never activates, yet `tactical-ai` controls it. How is a neutral unit's
    reaction (take cover or flee) chosen — a fixed TAC rule, a standing setting from battle start, or an AI call
    mid-move (TAI-002 says the AI is not called mid-move)? What triggers it, and what is "flee"?
12. TAI-009 — "Disabled" in the out-of-action share: TAC has disabled limbs (TAC-059) but no whole-soldier
    disabled state. Does a soldier with a disabled limb count, or only one unable to act (e.g. 0 stamina)? Do
    soldiers who left the map by an exit count as fled? Does a retreating side still fire on the way?
13. TAI-013 — Where does an AI soldier's rank come from (tactical map request per unit, e.g. the STR squad
    ranks Elite/Veteran/Regular/Recruit, or a per-soldier rank), and how are equal ranks broken (seeded roll,
    unit order)?
14. TAI-018 — With `vipControl: player`, does the VIP join the player's activation choice like a squad soldier
    (stamina, reactions), and does the setting live in game settings or in the tactical map request?

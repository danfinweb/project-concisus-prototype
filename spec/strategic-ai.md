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
(`shared/rng.js`). Same view, same data and same seed give the same output. It never changes game state
directly: its only effect is the commands it returns, which STR validates and resolves.
**Source.** design/design.md › AI; › AI › Strategic AI › Controller hand-off; CLAUDE.md › Rules, State ownership

### [SAI-002] Invocation
**Rule.** For every hour that passes (each hour tick, STR-003), the Strategic Layer builds one perception
view per AI faction (`ssv`, `vdk`, `varyag`, `aegis`, `krug`) and calls the faction's controller with it
once; the controller returns that faction's one command set for the hour (STR-020). All factions are called
on the state at the start of the hour, and their commands resolve together with the player's. The
controller is pluggable: the game shell plugs in `strategic-ai`; the Test Lab may plug in a scripted stub
or another AI.
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
| `funds` | Its own money (STR-092); other factions' funds are never in the view |
| `contracts` | Contracts it has posted, with status (open, accepted, done, failed) |
| `contractOffers` | Open contract offers of other factions it could take (SAI-015) |
| `events` | World events and crisis signs it is aware of (STR) |

**Source.** design/design.md › AI › Strategic AI › Controller hand-off; › Faction AI tiers; › Strategic Layer › Map (Fog of war); › Squads and simulation (Faction funds (draft))

### [SAI-004] Strategic command set
**Rule.** The controller returns an ordered list of commands of the kinds a player issues on the strategic
map (schema: `spec/interfaces/strategic_commands.schema.json`):

| Command | Fields | Resolved by |
| --- | --- | --- |
| `setGoal` | `squad` (own squad ID), `goal` (STR goal type: patrol, supplyRun, attackPoi, holdPoi, escort, tradeRoute, hunt), `target` (region, POI, squad or the player) | STR |
| `moveSquad` | `squad`, `toRegion` (adjacent region) | STR |
| `offerContract` | the contract terms of MGT: goal reference, missions, targets and locations, deadline (hours), pay, intel level, deniable flag | STR validates, then MGT |
| `acceptContract` | `contract` (ID of an offer in `contractOffers`), `squads` assigned | STR (SAI-015) |
| `pass` | — | STR |

The Strategic Layer validates every command; an illegal command (unknown or foreign squad, impassable or
non-adjacent region, contract by a faction that may not post it) is rejected and not resolved. Contract
offers are forwarded to Management.
**Source.** design/design.md › AI › Strategic AI › Controller hand-off; › Faction AI tiers; › AI (intro)

### [SAI-005] No hidden information, no illegal actions
**Rule.** The AI reads nothing but its view and `/data`; it issues only commands from SAI-004. Tests assert
that a view built with fog of war never contains unseen squads or regions newer than their last observation.
**Source.** design/design.md › AI (intro); › AI › Tactical AI (last paragraph, applies to both layers)

## Decision structure

### [SAI-006] Utility scoring
**Rule.** The strategic AI is a utility AI: every decision enumerates the candidate actions available to
the agent, scores each as the weighted combination of its considerations, every consideration mapped
through a response curve to 0–1, and picks the highest score (ties broken by `rng`). Behaviour comes from
the shared situation maps (SAI-007) and from factions reacting to each other, not from scripts. Weights,
response curves and doctrines are data (SAI-010).
**Values.** considerations, weights, curves per doctrine — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/design.md › AI (intro, Data)

### [SAI-007] Tier 1 — situation maps
**Rule.** From the view, the AI first derives per-region situation maps, computed every hour (every call)
and never stored. Layers: own strength, enemy strength (as known), economic value, threat, frontline,
supply reach. Only view data may enter them.
**Values.** formula per layer — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/design.md › AI › Strategic AI › Faction AI tiers

### [SAI-008] Tier 2 — strategist
**Rule.** The strategist scores candidate objectives (STR goal types with their targets) over the
situation maps, toward the faction's ultimate goal:
`score = ownGain + damageToRivals − cost − risk + commitmentBonus`, where `commitmentBonus` applies only
to objectives the faction is already pursuing. Each term is a consideration through its response curve,
weighted by the doctrine (SAI-010). It follows SAI-012: objectives serve the faction's own aims, not the
player. `ownGain` is rated against the faction's ultimate goal:

| Faction | Ultimate goal |
| --- | --- |
| `ssv`, `vdk` | hold the capital (STR-007) and most of the country |
| `varyag`, `aegis` | profit, and keep their patron standing |
| `krug` | keep its trade routes and markets, and avoid open war |
| resistance groups (STR-067) | drive the controller out of their area |

How each goal turns into gain terms is doctrine data.
**Values.** term inputs, curves, weights, commitment bonus, gain terms per ultimate goal — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/design.md › AI › Strategic AI › Faction AI tiers; › Faction behaviour; › Strategic Layer › Squads and simulation

### [SAI-009] Tier 3 — operational planner
**Rule.** The operational planner turns the strategist's objectives into commands: assigns own squads to
objectives (`setGoal`) and moves them (`moveSquad`), or emits `offerContract` (SAI-014) when its own
squads can't reach the objective or are worth more elsewhere.
**Values.** assignment scoring — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/design.md › AI › Strategic AI › Faction AI tiers; › Controller hand-off; › Management › Contracts and missions › Where contracts come from

### [SAI-010] Doctrines
**Rule.** `data/ai/doctrines.json` holds one record per doctrine with `layer: "strategic"`; each faction
references one doctrine (via `data/factions.json` or the doctrine's `factions` list). A doctrine sets the
weights and curves of SAI-006 to SAI-009 and SAI-015, and the faction's personality: `aggression`,
`riskTolerance`, `contractUse` and `hostility` per other faction. Faction character from the design (Varyag
hunts player ops and competes for contracts; the Krug is neutral) is expressed through doctrine data, not
code.
**Values.** all doctrine values — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/design.md › AI (Data); › AI › Strategic AI › Faction AI tiers; › Factions & campaign › Factions

### [SAI-011] Decision log
**Rule.** Every call returns `log` entries alongside the commands: one per decision, with `time`, `faction`,
`tier` (situation, strategist, planner), the chosen option, and the top-scored options with their total score
and per-consideration scores. The caller (game shell, Test Lab) stores or shows the log; the AI keeps none.
**Values.** `logTopN` (options kept per decision) — not set (design: Open) → data/ai/doctrines.json.
**Source.** design/design.md › AI (Logging)

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
**Rule.** A faction posts a contract (`offerContract`) for an objective its own squads can't reach, or
whose squads are worth more elsewhere (SAI-009), or that it wants deniable. With intel on a rival's goal it
may post a counter-contract against it. How readily it does so is the doctrine's `contractUse` (SAI-010).
The pay is a cost to its funds (STR-092, STR-093). Funds are a hard limit by default: a faction cannot
offer a contract or raise a squad it cannot pay for, and STR rejects such a command, so the AI should not
emit it; in the test mode `fundsMode = scoreTerm` funds only weigh in the score (STR-092). Offers carry the
MGT contract terms; Management validates pay, filters by reputation and shows them.
**Values.** offer scoring, deniability thresholds — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/design.md › Management › Contracts and missions › Where contracts come from; › AI › Strategic AI › Faction AI tiers; › Controller hand-off

### [SAI-015] Contract offer evaluation
**Rule.** Only the rival PMCs (`varyag`, `aegis`) take other factions' contracts, and only offers from
their own side (their patron's side: Varyag SSV, Aegis VDK). `contractOffers` in their view holds those
offers; the other factions' views hold none. A rival PMC evaluates them with the same utility scoring as
its own objectives (SAI-006, SAI-008): an offer is a candidate objective whose gain includes its pay. A
rival that takes one returns `acceptContract`; STR validates it and settles the pay between the two
factions' funds (STR-093). A taken offer that is also on the player's board either leaves the board or
both race for it (MGT-052). The Krug never takes other factions' contracts. Its escort work runs both
ways (STR-094): it offers escort contracts for its own convoys, and a faction can pay the Krug to escort
one of its shipments (a Krug squad travels with the convoy; price not set).
**Values.** offer scoring — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Status.** open
**Source.** design/design.md › AI › Strategic AI › Faction AI tiers; › Management › Contracts and missions › Where contracts come from

## Open questions

1. **Resolved (design 8972470):** the controller is called for every hour that passes, once per faction,
   returning one command set (SAI-002). SAI-002 — Design says factions get a view "after each player action", STR says one faction action per
   elapsed hour. Spec: STR decides the count; confirm whether SAI is called once per hour or once per player
   action with several actions returned.
2. SAI-003 — Exact view fields depend on STR (squad strength model, fog of war, intel). To be finalised with
   the STR spec and the interface schema.
3. **Resolved (design 8972470):** the utility-AI structure is now in the GDD (AI; Faction AI tiers); the
   strategist score is the sum own gain + damage to rivals − cost − risk + commitment bonus; curve types stay
   data. SAI-006–SAI-009 — The workflow doc's utility-AI structure is not in `design/`; consideration lists,
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
9. **Resolved (design eb072a2):** only Varyag and Aegis take other factions' contracts, from their own
   side; a taken offer leaves the player's board or both race for it; the Krug takes none (SAI-015).
   How MGT learns of a taken offer stays open (MGT open question 34). SAI-015 — Which factions may take other factions' contracts (rival PMCs only, or the Krug and the states
   too)? Is an offer taken by an AI faction removed from the player's board, and how does MGT learn of it
   (`acceptContract` is a new command)?
10. **Resolved (design eb072a2):** funds are a hard limit by default; a score-term-only mode is a
    switchable test option (SAI-014, STR-092). SAI-014/STR-092 — May a faction offer a contract its funds cannot pay? Are funds a hard limit on offers
    and squads, or only a cost term in the score?
11. **Resolved (design eb072a2):** SSV and VDK hold the capital and most of the country; Varyag and Aegis
    profit and keep their patron standing; the Krug keeps its trade routes and markets and avoids open
    war; resistance groups drive the controller out of their area (SAI-008). SAI-008 — Each faction's "ultimate goal" (win the war, profit, neutrality) is not defined; the
    strategist needs it to rate own gain.
12. SAI-002, SAI-008 — resistance groups now have an ultimate goal, but SAI-002 calls controllers only for
    `ssv`, `vdk`, `varyag`, `aegis`, `krug`. Do resistance groups (and a rogue PMC with no patron) get
    their own controller call and doctrine? What is a rogue PMC's ultimate goal once it has no patron to
    keep standing?
13. SAI-004, SAI-015 — how does a faction ask the Krug to escort one of its shipments (a new command, e.g.
    `hireEscort`), and how is the Krug's side of it decided (always accept, or scored by the Krug AI)?

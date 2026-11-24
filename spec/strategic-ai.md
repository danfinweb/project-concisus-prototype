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
directly: its only effect is the commands it returns, which STR validates and resolves. It keeps no
memory between calls; learning the player's habits (Aegis, GEN-008) is **(optional)** and deferred: the
first build iterations have no AI memory.
**Source.** design/ai.md › Overview; design/ai.md › Strategic AI (Controller hand-off); design/design.md › Factions & campaign › Leaders; CLAUDE.md › Rules, State ownership

### [SAI-002] Invocation
**Rule.** For every hour that passes (each hour tick, STR-003), the Strategic Layer builds one perception
view per AI faction (`ssv`, `vdk`, `varyag`, `aegis`, `krug`, every active resistance group, STR-067, and a
rogue PMC, STR-066) and calls the faction's controller with it once; the controller returns that faction's
one command set for the hour (STR-020). All factions are called on the state at the start of the hour, and
their commands resolve together with the player's. Resistance groups and a rogue PMC get their own
controller call and their own doctrine (SAI-010); a rogue PMC keeps its faction ID but switches to its
rogue doctrine. The controller is pluggable: the game shell plugs in `strategic-ai`; the Test Lab may plug
in a scripted stub or another AI.
**Source.** design/ai.md › Strategic AI (Controller hand-off; Faction AI tiers); design/strategic-layer.md › Overview (Time)

### [SAI-003] Strategic perception view
**Rule.** The view contains only what that faction knows under fog of war (STR fog-of-war rules); hidden
state never appears in it. Fields (schema: `spec/interfaces/strategic_perception_view.schema.json`):

| Field | Content |
| --- | --- |
| `faction` | ID of the deciding faction |
| `time` | Current day and hour |
| `doctrine` | Doctrine ID to use (SAI-010) |
| `ownRegions` | Regions and points of interest it controls: `id`, `poi`, `krugMarket`, `output`, and on settlement tiles `loyalty` as one value per faction (faction → −100…100, STR-009) |
| `ownSquads` | Its squads: `id`, `region`, `goal`, `target`, `strength`, `supplies`, `fuel`, `morale`, `vehicle` (null = on foot), `transit` (the move in progress `{ toRegion, hoursLeft }` or null, STR-017) |
| `knownRegions` | Every region it has seen: `terrain`, `road`, `poi`, `krugMarket`, `controller`, `loyalty` (per faction), `flags` — current if in recon range, else last known state with the time `observed` |
| `knownSquads` | Foreign squads it knows of (including the player's): `faction`, `region`, `estimatedStrength`, time `seen`, `knownGoal` if intel reveals it |
| `capital` | The capital tile, its `holder`, `occupant` and `contestedSince` (STR-007) |
| `vips` | Its own VIPs and the enemy VIPs it holds intel on, with intel expiry (STR-045, STR-048) |
| `relations` | Its relation to every other faction (range and thresholds → see STR-051) |
| `reputationWithPlayer` | Its reputation `value` toward the player and the derived `standing` (MGT-054) |
| `funds` | Its own money (STR-092); other factions' funds are never in the view |
| `contracts` | Contracts it has posted, with status (open, accepted, done, failed) |
| `contractOffers` | Open contract offers of other factions it could take, each with its `id` (SAI-015) |
| `events` | World events and measures it is aware of that affect it (STR) |
| `crisisSigns` | Its true crisis signs from the last daily check (STR-069) |
| `availableMeasures` | Desperate measures it may start now (STR-070, SAI-016) |
| `escortRequests` | Krug only: pending paid-escort requests (STR-094), each `id`, `requester`, `convoy` (squad), `region`, `route`, `priceUsd`, and the requester's standing toward the Krug (`relation`, or for the player `reputation`) (SAI-017) |

**Source.** design/ai.md › Strategic AI (Controller hand-off; Faction AI tiers); design/strategic-layer.md › Map (draft) (Fog of war); › Squads and simulation (draft) (Faction funds (draft))

### [SAI-004] Strategic command set
**Rule.** The controller returns an ordered list of commands of the kinds a player issues on the strategic
map (schema: `spec/interfaces/strategic_commands.schema.json`):

| Command | Fields | Resolved by |
| --- | --- | --- |
| `setGoal` | `squad` (own squad ID), `goal` (STR-018: `patrol`, `supplyRun`, `attackPoi`, `holdPoi`, `escort`, `tradeRoute`, `hunt`), `target` (region, POI, squad or the player) | STR-018 |
| `moveSquad` | `squad`, `toRegion` (adjacent tile) | STR-031, STR-032, STR-034 |
| `hold` | `squad` — it stays on its tile and holds it this hour | STR-020 |
| `scout` | `squad` — it scouts its tile | STR-036 |
| `attack` | `squad`, `target` (a foreign squad or POI on the squad's tile) — it starts a fight there | STR-022, STR-026 (STR-023 if the player is involved) |
| `offerContract` | `contract`: the offer object — `id`, `employer`, `targetFaction`, `sourceGoal`, `missions` (`key`, `missionId`, `targets`, `location`), `deadline` as a `{ day, hour }` timestamp, `payInputs` (MGT-046), `reputationGain` (deprecated, optional; MGT-056), `intelLevel` (`exact`, `lastKnown`, `rumour`), `deniable`, `reputationGate` (`{ better, sensitive }`, MGT-055), `boardLocation`, `counterContractOf` | STR-044 validates, then MGT |
| `acceptContract` | `contractId` (the `id` of an offer in `contractOffers`), `squads` assigned | STR-093 (SAI-015) |
| `hireEscort` | `escortFor` (its own shipment, a convoy squad on a Krug-market tile), `route` (planned tile path) — asks the Krug to escort it, paid on acceptance | STR-094 |
| `answerEscort` | Krug only: `requestId` (an entry of `escortRequests`), `accept` (boolean), `squad` (the Krug squad attached, when accepting) | STR-094 (SAI-017) |
| `pickMeasure` | `measure` (one of `availableMeasures`) | STR-070 (SAI-016) |
| `recruit` | `target` (a held tile whose POI yields recruits) — raises a new squad | STR-096 |
| `pass` | — | STR |

The Strategic Layer validates every command; an illegal command (unknown or foreign squad, impassable or
non-adjacent region, contract by a faction that may not post it, a measure not in `availableMeasures`, a
`recruit`, `offerContract` or `hireEscort` the faction cannot pay for under `hardLimit`, an `answerEscort`
by a faction other than the Krug or for an unknown request) is rejected and not resolved.
Valid contract offers are forwarded to Management as a `contractOffer` management request (STR-044).
Trade and buying gear are not commands: AI squads are supplied by the rules of STR-014 and STR-092.
**Source.** design/ai.md › Strategic AI (Controller hand-off; Faction AI tiers); design/ai.md › Overview

### [SAI-005] No hidden information, no illegal actions
**Rule.** The AI reads nothing but its view and `/data`; it issues only commands from SAI-004. Tests assert
that a view built with fog of war never contains unseen squads or regions newer than their last observation.
**Source.** design/ai.md (intro); design/ai.md › Tactical AI (last paragraph, applies to both layers)

## Decision structure

### [SAI-006] Utility scoring
**Rule.** The strategic AI is a utility AI: every decision enumerates the candidate actions available to
the agent, scores each as the weighted combination of its considerations, every consideration mapped
through a response curve to 0–1, and picks the highest score (ties broken by `rng`). Behaviour comes from
the shared situation maps (SAI-007) and from factions reacting to each other, not from scripts. Weights,
response curves and doctrines are data (SAI-010).
**Values.** considerations, weights, curves per doctrine — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/ai.md (intro, Data)

### [SAI-007] Tier 1 — situation maps
**Rule.** From the view, the AI first derives per-region situation maps, computed every hour (every call)
and never stored. Layers: own strength, enemy strength (as known), economic value, threat, frontline,
supply reach. Only view data may enter them.
**Values.** formula per layer — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/ai.md › Strategic AI › Faction AI tiers

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
| resistance groups (STR-067) | survive, and harass the controller until it leaves their area |
| a rogue PMC with no patron (STR-066) | seize and hold the capital or plants |

How each goal turns into gain terms is doctrine data.
**Values.** term inputs, curves and weights (`considerations`), `commitmentBonus`, `gainTerms` (ownGain terms per ultimate goal) — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/ai.md › Strategic AI (Faction AI tiers; Faction behaviour); design/strategic-layer.md › Squads and simulation (draft)

### [SAI-009] Tier 3 — operational planner
**Rule.** The operational planner turns the strategist's objectives into commands: assigns own squads to
objectives (`setGoal`) and gives each squad its action for the hour (`moveSquad`, `hold`, `scout`,
`attack`), raises a squad (`recruit`, STR-096) or hires a Krug escort for a shipment (`hireEscort`,
STR-094), or emits `offerContract` (SAI-014) when its own squads can't reach the objective or are worth more
elsewhere.
**Values.** assignment scoring — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/ai.md › Strategic AI › Faction AI tiers; › Controller hand-off; design/management.md › Contracts and missions › Where contracts come from

### [SAI-010] Doctrines
**Rule.** `data/ai/doctrines.json` holds one record per doctrine with `layer: "strategic"`; each faction
references one doctrine through `factions.doctrine` in data/factions.json (the only link; a doctrine does
not list its factions). A doctrine sets the weights and curves of SAI-006 to SAI-009, SAI-015 and
SAI-016 (`considerations`, `commitmentBonus`, `gainTerms`), and the faction's personality:
`personality.aggression`, `personality.riskTolerance`, `personality.contractUse` and
`personality.hostility` (faction → weight). Factions created during play take their doctrine from data:
every resistance group uses the `doctrine` of the `resistance` template record in data/factions.json; a
rogue PMC switches to the `rogueDoctrine` of its own faction record (SAI-002). Faction character is
expressed through doctrine data, not code. Design draft character per doctrine:

| Doctrine for | Character (design draft) |
| --- | --- |
| `ssv` | aggressive, accepts losses, hires PMCs for deniable strikes |
| `vdk` | cautious, holds cities, leans on contracts and intel |
| `varyag` | bold hunter, high risk tolerance (hunts player ops, competes for contracts) |
| `aegis` | careful and precise, avoids even fights |
| `krug` | avoids open fights, guards markets and routes |
| resistance | hit-and-run, never a pitched battle |
| rogue PMC | all-in on the capital and plants |

**Values.** all doctrine values — not set (design: all behaviour values unset; character above as
guidance) → data/ai/doctrines.json; `doctrine`, `rogueDoctrine` links → data/factions.json.
**Source.** design/ai.md › Overview (Data); design/ai.md › Strategic AI (Faction AI tiers); design/design.md › Factions & campaign › Factions

### [SAI-011] Decision log
**Rule.** Every call returns `log` entries alongside the commands: one per decision, with `time`, `faction`,
`tier` (situation, strategist, planner), the chosen option, and the top-scored options with their total score
and per-consideration scores. The caller (game shell, Test Lab) stores or shows the log; the AI keeps none.
**Values.** `logTopN` (options kept per decision) — not set (design: Open) → data/ai/doctrines.json.
**Source.** design/ai.md (Logging)

## Faction behaviour

### [SAI-012] Own goals
**Rule.** Every AI faction pursues its own goals on the map, not the player. Its squads go about their
goals on the strategic map and in tactical engagements alike unless SAI-013 makes it hostile.
**Source.** design/ai.md › Strategic AI › Faction behaviour

### [SAI-013] Hostility toward the player
**Rule.** A faction is hostile toward the player only while at least one holds:
1. its reputation with the player is low: the view's derived `reputationWithPlayer.standing` is `hostile`
   (thresholds: the standing table of MGT-054 in data/management-rules.json);
2. it has a mission targeting the player (a hunt, a counter-attack on an FOB);
3. its standing toward the player is `unfriendly` or worse and it and the player pursue the same
   objective at the same time (the MGT-054 rule).
Otherwise it is non-hostile. The AI may only target the player (goal `hunt`/`attackPoi` against a player
FOB, `moveSquad` to engage) while hostile. Attacking a non-hostile faction is the player's choice and costs
reputation (MGT).
**Values.** standing thresholds → see MGT-054 (data/management-rules.json); no threshold of its own.
**Source.** design/ai.md › Strategic AI (Faction behaviour); design/management.md › Reputation (draft) (Standing)

### [SAI-014] Contract offers
**Rule.** A faction posts a contract (`offerContract`) for an objective its own squads can't reach, or
whose squads are worth more elsewhere (SAI-009), or that it wants deniable. With intel on a rival's goal it
may post a counter-contract against it (`counterContractOf`). How readily it does so is the doctrine's
`personality.contractUse` (SAI-010).
The pay is a cost to its funds (STR-092, STR-093). Funds are a hard limit by default: a faction cannot
offer a contract or raise a squad (`recruit`, STR-096) it cannot pay for, and STR rejects such a command,
so the AI should not emit it; in the test mode `fundsMode = scoreTerm` funds only weigh in the score
(STR-092). Raising a squad is scored like any other candidate action of the planner (SAI-009): its gain is
the objectives the new squad can cover. Offers carry the offer fields of SAI-004 (MGT contract terms);
Management validates pay, filters by reputation and shows them.
**Values.** offer scoring, deniability thresholds — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/management.md › Contracts and missions › Where contracts come from; design/ai.md › Strategic AI › Faction AI tiers; › Controller hand-off

### [SAI-015] Contract offer evaluation
**Rule.** Only the rival PMCs (`varyag`, `aegis`) take other factions' contracts, and only offers from
their own side (their patron's side: Varyag SSV, Aegis VDK). `contractOffers` in their view holds those
offers; the other factions' views hold none. A rival PMC evaluates them with the same utility scoring as
its own objectives (SAI-006, SAI-008): an offer is a candidate objective whose gain includes its pay. A
rival that takes one returns `acceptContract`; STR validates it and settles the pay between the two
factions' funds (STR-093). An offer a rival takes before the player signs it leaves the player's board:
Strategic sends MGT `contractEnded` with reason `taken`; only a contract the player has already signed
can become a race (MGT-052). The Krug never takes other factions' contracts. Its escort work runs both
ways (STR-094): it offers escort contracts for its own convoys, and a faction can ask the Krug to escort
one of its shipments, which the Krug scores and may refuse (SAI-017).
**Values.** offer scoring — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/ai.md › Strategic AI › Faction AI tiers; design/management.md › Contracts and missions › Where contracts come from

### [SAI-016] Desperate measure choice
**Rule.** When the view's `availableMeasures` is not empty (STR-070: ≥ `measureSignsMin` true crisis signs,
no measure of its own running, the shared event cap not reached), the strategist may pick one measure: it
scores each available measure as a candidate objective (SAI-006, SAI-008), using the overlap of the
measure's typical signs with the view's `crisisSigns`, and returns at most one `pickMeasure { measure }`
per hour, or none when no measure scores above its current objectives. STR validates the choice against
STR-070 and starts the measure. The nuclear strike (STR-080) is picked the same way when STR lists it.
**Values.** measure scoring — not set (design: all behaviour values unset) → data/ai/doctrines.json.
**Source.** design/strategic-layer.md › World events (draft) (Desperate measures (draft)); design/world-events.md › Desperate measures; design/ai.md › Strategic AI (Faction AI tiers)

### [SAI-017] Krug escort evaluation
**Rule.** The Krug's controller scores every request in its view's `escortRequests` (STR-094) with the same
utility scoring as its own objectives (SAI-006, SAI-008): the price as gain, weighed against the
requester's standing toward the Krug (its `relation`; for the player its Krug `reputation`), the Krug's
free squads (own squads without a goal that could reach the convoy) and the route's danger (situation
maps, SAI-007). It returns one `answerEscort { requestId, accept, squad }` per request: `accept = true`
with the Krug squad it attaches when the score is above its refusal threshold, otherwise
`accept = false`. Low standing, few free squads or a dangerous route make a refusal likely. A request it
does not answer in that hour lapses as refused (STR-094).
**Values.** considerations, weights and refusal threshold (`escortAccept`) — not set (design: all behaviour
values unset) → data/ai/doctrines.json (Krug doctrine).
**Source.** design/ai.md › Strategic AI (Faction AI tiers); design/strategic-layer.md › Squads and simulation (draft) (Faction funds (draft)); design/strategic-actions.md › Trade, services, contracts and factions

## Open questions

1. **Resolved (design 8972470):** the controller is called for every hour that passes, once per faction,
   returning one command set (SAI-002). SAI-002 — Design says factions get a view "after each player action", STR says one faction action per
   elapsed hour. Spec: STR decides the count; confirm whether SAI is called once per hour or once per player
   action with several actions returned.
2. **Resolved (cleanup 2026-11-23):** SAI-003 now lists every field of `strategic_perception_view` 0.5.0
   (capital, VIPs, crisis signs, available measures; loyalty per faction; `transit`, `vehicle`); the squad
   strength model stays an STR detail. SAI-003 — Exact view fields depend on STR (squad strength model, fog of war, intel). To be finalised with
   the STR spec and the interface schema.
3. **Resolved (design 8972470):** the utility-AI structure is now in the GDD (AI; Faction AI tiers); the
   strategist score is the sum own gain + damage to rivals − cost − risk + commitment bonus; curve types stay
   data. SAI-006–SAI-009 — The workflow doc's utility-AI structure is not in `design/`; consideration lists,
   curve types and the combination rule (weighted sum or product) need confirmation.
4. **Resolved (2026-11-24):** condition 3 needs Unfriendly or worse (the MGT rule holds) (SAI-013).
   SAI-013 — "Reputation is low" now reads the view's derived standing `hostile` (MGT-054 thresholds, cleanup
   2026-11-23); still open: the MGT standing table
   also makes Unfriendly factions hostile when competing for the same objective, while condition 3 applies at
   any standing. Which rule holds?
5. **Resolved (cleanup 2026-11-23, schema `strategic_commands`):** desperate measures go through
   `pickMeasure` (SAI-016), raising squads through `recruit` (STR-096), Krug escorts through `hireEscort`;
   trading and buying gear are not AI commands (SAI-004). SAI-004 — Do desperate measures, world-event responses, recruiting, trading or buying gear go through
   SAI commands, or does STR resolve them by rule?
6. **Resolved (2026-11-24):** Aegis learning and AI memory are dropped for now (optional, deferred;
   SAI-001, GEN-008). SAI-001 — Aegis "learns the player's habits and adapts over time" (GEN leader effect) and hunts need
   memory across calls, but the AI owns no state. Where does that memory live (world slice, passed in the
   view)?
7. SAI-002 — Is the civilian population (non-combat faction) or the off-map influences ever an AI
   controller? Spec: no.
8. **Resolved (2026-11-24):** the design drafts each doctrine's character (SAI-010); the numbers stay
   data. SAI-010 — Per-faction doctrines and their character (SSV, VDK, Aegis) are not described beyond the faction
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
12. **Resolved (2026-11-24):** resistance groups and a rogue PMC get their own controller and doctrine;
    resistance: survive and harass the controller; rogue PMC: seize and hold the capital or plants
    (SAI-002, SAI-008, SAI-010). SAI-002, SAI-008 — resistance groups now have an ultimate goal, but SAI-002 calls controllers only for
    `ssv`, `vdk`, `varyag`, `aegis`, `krug`. Do resistance groups (and a rogue PMC with no patron) get
    their own controller call and doctrine? What is a rogue PMC's ultimate goal once it has no patron to
    keep standing?
13. **Resolved (2026-11-24):** scored by the Krug AI, which may refuse (SAI-017, `answerEscort`).
    SAI-004, SAI-015 — the command is `hireEscort { escortFor }` (cleanup 2026-11-23); still open: how does a faction ask the Krug to escort one of its shipments (a new command, e.g.
    `hireEscort`), and how is the Krug's side of it decided (always accept, or scored by the Krug AI)?

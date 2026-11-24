# Strategic AI (faction AI) — scope

Refreshed by `/scope` (2026-11-24, spec baseline `e8aa7e7`, design `c1333f3`; previous refresh 2026-11-23
at spec `931ee45`). Lists everything this module may read outside its folder.

## Spec IDs

Source: `spec/strategic-ai.md` (area SAI, 17 IDs, all mapped to `modules/strategic-ai` in
`spec/_index.md`). All behaviour values (considerations, weights, curves, personality, thresholds) are unset
in the design and live in `data/ai/doctrines.json`; build with stub doctrines. The 13 open questions in
`spec/strategic-ai.md` › Open questions are all resolved.

**Controller contract**

| ID | Summary |
| --- | --- |
| SAI-001 | Pure `decide(view, rng) → { commands, log }`; same view, data and seed give the same output; never changes state; no memory between calls (Aegis learning deferred, optional) |
| SAI-002 | Called once per hour per AI faction (`ssv`, `vdk`, `varyag`, `aegis`, `krug`, each resistance group, a rogue PMC) on start-of-hour state; never for civilians or `east`/`west`; controller is pluggable |
| SAI-003 | Perception view holds only fog-of-war knowledge: own/known regions and squads, capital, VIPs, relations, reputation, funds, `overdraft`, contracts, offers, events, crisis signs, available measures, Krug `escortRequests` |
| SAI-004 | Ordered command list: `setGoal`, `moveSquad`, `hold`, `scout`, `attack`, `offerContract`, `acceptContract`, `hireEscort`, `answerEscort`, `pickMeasure`, `recruit`, `pass`; STR rejects illegal ones |
| SAI-005 | Reads only its view and `/data`; issues only SAI-004 commands; tests assert no hidden info in the view |

**Decision structure**

| ID | Summary |
| --- | --- |
| SAI-006 | Utility AI: candidates scored by weighted considerations through 0–1 response curves; highest wins, ties broken by `rng` |
| SAI-007 | Tier 1: per-region situation maps (own/enemy strength, economic value, threat, frontline, supply reach), every call, never stored, view data only |
| SAI-008 | Tier 2: strategist scores objectives `ownGain + damageToRivals − cost − risk + commitmentBonus`; `ownGain` rated against the faction's ultimate goal (table per faction, `gainTerms`) |
| SAI-009 | Tier 3: planner assigns squads (`setGoal`) and gives each its hour action (`moveSquad`, `hold`, `scout`, `attack`), `recruit`, `hireEscort`, or `offerContract` |
| SAI-010 | Doctrines (`layer: "strategic"`): `considerations`, `commitmentBonus`, `gainTerms`, `personality` (`aggression`, `riskTolerance`, `contractUse`, `hostility`); link only via `factions.doctrine`; resistance template and `rogueDoctrine`; draft character per doctrine |
| SAI-011 | Decision log per decision: time, faction, tier, chosen option, top-`logTopN` options with total and per-consideration scores; AI keeps none |

**Faction behaviour**

| ID | Summary |
| --- | --- |
| SAI-012 | Factions pursue their own goals, not the player |
| SAI-013 | Hostile to the player only on standing `hostile`, a mission targeting the player, or `unfriendly`-or-worse plus a shared objective; may only target the player while hostile |
| SAI-014 | Post contracts for unreachable, costlier-elsewhere or deniable objectives and counter-contracts (`contractUse`); funds a hard limit by default, `overdraft` consideration under `scoreTerm`; `recruit` scored like any candidate |
| SAI-015 | Only Varyag and Aegis take offers, from their patron's side, scored as objectives (pay in gain), via `acceptContract`; the Krug takes none |
| SAI-016 | Desperate measures: score each of `availableMeasures` by overlap of typical signs with `crisisSigns`; at most one `pickMeasure` per hour |
| SAI-017 | Krug scores each `escortRequests` entry (price, requester standing, free squads, route danger; `escortAccept` threshold); one `answerEscort` per request, at most one squad per convoy |

**Also reads** (rules this module depends on but does not own)

| ID | File | Why strategic-ai reads it |
| --- | --- | --- |
| STR-003, STR-020, STR-021 | `spec/strategic.md` | When it is called, one action per squad per hour, how each command is validated and resolved |
| STR-005, STR-006, STR-095 | `spec/strategic.md` | Tile grid and adjacency, move hours, strategic terrain table (planning) |
| STR-031, STR-032, STR-034 | `spec/strategic.md` | Move rules on foot, by vehicle, by helicopter (fuel, duration) |
| STR-007 | `spec/strategic.md` | Capital holder/contested state — SSV, VDK and rogue PMC goal |
| STR-008 | `spec/strategic.md` | Fog of war behind the view |
| STR-009, STR-014 | `spec/strategic.md` | Loyalty and POI control for the economic-value and threat maps |
| STR-017, STR-018 | `spec/strategic.md` | Squad record and the goal types `setGoal` may set |
| STR-022, STR-023, STR-026 | `spec/strategic.md` | Encounters and fights started by `attack` |
| STR-036 | `spec/strategic.md` | Scouting |
| STR-044 | `spec/strategic.md` | Contract postings from goals (what an offer carries) |
| STR-045, STR-048 | `spec/strategic.md` | VIPs and VIP intel in the view |
| STR-051 | `spec/strategic.md` | Relations, range and thresholds (owner of the values; GEN-007 points here) |
| STR-066, STR-067 | `spec/strategic.md` | Rogue PMC and resistance groups, their controllers and goals |
| STR-069, STR-070, STR-080 | `spec/strategic.md` | Crisis signs, measure selection, nuclear strike as a measure |
| STR-092, STR-093, STR-094, STR-096 | `spec/strategic.md` | Funds and `fundsMode`, contract pay between factions, Krug escorts, raising a squad |
| GEN-004, GEN-005, GEN-006 | `spec/overview.md` | Faction IDs, kinds, patrons; factions that never get a controller |
| GEN-007, GEN-008, GEN-010 | `spec/overview.md` | Relation model, leader effects, Krug resentment filtering escort requests |
| MGT-042, MGT-043, MGT-046 | `spec/management.md` | Contract terms, goal → mission mapping, pay inputs for `offerContract` |
| MGT-049, MGT-050, MGT-052 | `spec/management.md` | Intel level, deniability, rival PMC competition |
| MGT-054, MGT-055, MGT-056 | `spec/management.md` | Standing levels and effects (SAI-013, `reputationGate`), reputation acts per mission |
| TEC-012, TEC-015 | `spec/tech.md` | Pure rules core; seeded, reproducible randomness |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/strategic_commands.schema.json` | produces (to strategic) | 0.6.0 |
| `spec/interfaces/strategic_perception_view.schema.json` | consumes (from strategic) | 0.7.0 |

Change history: `spec/interfaces/CHANGELOG.md`. Since the last scope: commands 0.5.0 (offer `id`,
`targetFaction`, `reputationGate`, `{ day, hour }` deadline) and 0.6.0 (`answerEscort`, `hireEscort.route`,
`reputationGain` deprecated); view 0.5.0 (`transit`, `vehicle`, loyalty per faction, `krugMarket`), 0.6.0
(`escortRequests`, views for resistance and rogue PMC) and 0.7.0 (`overdraft`).

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/ai/doctrines.json` | `spec/interfaces/data/ai-doctrines.schema.json` | 0.4.0 | Considerations, curves, `personality`, `commitmentBonus`, `gainTerms`, `escortAccept`, `logTopN` (`layer: "strategic"`) |
| `data/factions.json` | `spec/interfaces/data/factions.schema.json` | 0.6.0 | Faction kind, patron, `doctrine`, `rogueDoctrine`, resistance template |
| `data/strategic-rules.json` | `spec/interfaces/data/strategic-rules.schema.json` | 0.7.0 | Relation thresholds, road/foot hours, crisis constants (`measureSignsMin`) for planning and scoring |
| `data/strategic-terrain.json` | `spec/interfaces/data/strategic-terrain.schema.json` | 0.2.0 | Move hours and visibility per terrain (move planning, threat) |
| `data/economy-rules.json` | `spec/interfaces/data/economy-rules.schema.json` | 0.5.0 | `fundsMode` and cost formulas for the cost term |
| `data/poi.json` | `spec/interfaces/data/poi.schema.json` | 0.6.0 | POI income and outputs for the economic-value map; recruit-yielding POIs |
| `data/events.json` | `spec/interfaces/data/events.schema.json` | 0.7.0 | Measures and their `typicalSigns` (SAI-016) |
| `data/missions.json` | `spec/interfaces/data/missions.schema.json` | 0.3.0 | Mission IDs and pay bands in `offerContract` |
| `data/vehicles.json` | `spec/interfaces/data/vehicles.schema.json` | 0.4.0 | Fuel range and off-road rating for move planning |

## State slices

- Owns: `— (no state)`
- Reads: none directly. Everything about `world` (and the reputation and contracts it may know) arrives in
  `strategic_perception_view`; its only output is `strategic_commands`.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Found while scoping; report to the root session, do not edit `spec/`. The seven findings of the
2026-11-23 scope (command set, field names, view fields, doctrine fields, low-reputation threshold,
relation constants, goal names) are all resolved in spec `e8aa7e7`.

1. **Contracts a rival PMC has taken are not in its view.** SAI-003 `contracts` holds only contracts the
   faction *posted*; `contractOffers` holds only *open* offers. After `acceptContract` (SAI-015) Varyag or
   Aegis no longer sees the contract's missions, targets, deadline or status, so it cannot plan the work,
   apply `commitmentBonus` (SAI-008) to it, or know when it is done or failed. Add taken contracts to the
   view (e.g. `contracts` with a `role: employer | contractor`)? And who decides when a rival's mission
   goal is met (STR)?
2. **Untyped view items.** `vips`, `contracts`, `contractOffers` and `events` are `{ type: object }` with
   no fields in `strategic_perception_view` 0.7.0. SAI-015 needs an offer's pay, missions, deadline and
   employer to score it (the `contractOffer` shape of `strategic_commands`?); SAI-007/STR-048 need the VIP
   fields and intel expiry; SAI-014 needs contract status values. Tests and `core/` cannot be written to
   field names that are not defined.
3. **One action per squad vs. the command list.** STR-020 says each squad takes exactly one action per
   hour; SAI-004 returns an ordered list. May one set hold `setGoal` and `moveSquad` for the same squad (is
   `setGoal` an action?), and what happens to a squad named twice (e.g. in `acceptContract.squads` or
   `answerEscort.squad` and in a `moveSquad`) — first wins, last wins, or the whole set rejected?
4. **Decision log shape.** `strategic_commands.log` items are untyped objects; SAI-011 lists the fields
   (`time`, `faction`, `tier`, chosen option, top options with total and per-consideration scores) but not
   their names. The Test Lab and cross-sim read the log, so the names should be in the schema.

# Strategic AI (faction AI) — scope

Refreshed by `/scope` (2026-11-24, spec `f429937` — second cleanup on design `c1333f3`; previous refresh `6fff738` at spec
`a0210cd`). Lists everything this module may read outside its folder.

## Spec IDs

Source: `spec/strategic-ai.md` (area SAI, 17 IDs, all mapped to `modules/strategic-ai` in
`spec/_index.md`). All behaviour values (considerations, weights, curves, personality, thresholds) are unset
in the design and live in `data/ai/doctrines.json`; build with stub doctrines. The open questions in
`spec/strategic-ai.md` › Open questions are resolved except Q19 (player objective for SAI-013 condition 3, needs a design decision). SAI-006 now fixes the consideration names, input units and curve types (`linear`, `step`).

**Controller contract**

| ID | Summary |
| --- | --- |
| SAI-001 | Pure `decide(view, rng) → { commands, log }`; same view, data and seed give the same output; never changes state; no memory between calls (Aegis learning deferred, optional) |
| SAI-002 | Called once per hour per AI faction (`ssv`, `vdk`, `varyag`, `aegis`, `krug`, each resistance group, a rogue PMC) on start-of-hour state; never for civilians or `east`/`west`; controller is pluggable |
| SAI-003 | Perception view holds only fog-of-war knowledge: `mapShape`, own/known regions (`roadTo`, `roadCrossing`) and squads (`knownSquads.id`, `knownTarget`), `recruitsAvailable`, capital, typed VIPs, relations, reputation, funds, `overdraft`, `contracts` (`role` employer/contractor, per-mission `status`), `contractOffers` (`contractOffer` shape), events (STR-050 instances), crisis signs, available measures, Krug `escortRequests` |
| SAI-004 | Ordered command list: `setGoal`, `moveSquad`, `hold`, `scout`, `attack`, `offerContract`, `acceptContract`, `hireEscort`, `answerEscort`, `pickMeasure`, `recruit`, `pass`; STR rejects illegal ones; per squad and set at most one action (`moveSquad`, `hold`, `scout`, `attack`) and one assignment (`setGoal`, `acceptContract.squads`, `answerEscort.squad`), first wins; an action for a squad in transit cancels its move (a `moveSquad` to its `toRegion` continues it) |
| SAI-005 | Reads only its view and `/data`; issues only SAI-004 commands; tests assert no hidden info in the view |

**Decision structure**

| ID | Summary |
| --- | --- |
| SAI-006 | Utility AI: candidates scored by weighted considerations through 0–1 response curves (`linear`, `step`); highest wins, ties broken by `rng`; fixed vocabulary of consideration names and input units (`cost` USD, `risk` threat 0–1, gain terms `capital`, `territory`, `plants`, `income`, `contractPay`, `patronStanding`, `tradeRoutes`, `markets`, `avoidWar`, `survival`, `harassment`, escort `price`, `standing`, `freeSquads`, `routeDanger`) |
| SAI-007 | Tier 1: per-region situation maps (own/enemy strength, economic value, threat, frontline, supply reach) on a 0–1 scale, every call, never stored, view data only |
| SAI-008 | Tier 2: strategist scores objectives `ownGain + damageToRivals − cost − risk + commitmentBonus`; `ownGain` rated against the faction's ultimate goal (table per faction, `gainTerms`) |
| SAI-009 | Tier 3: planner assigns squads (`setGoal`) and gives each its hour action (`moveSquad`, `hold`, `scout`, `attack`), `recruit`, `hireEscort`, or `offerContract` |
| SAI-010 | Doctrines (`layer: "strategic"`): `considerations`, `commitmentBonus`, `gainTerms`, `personality` (`aggression`, `riskTolerance`, `contractUse`, `hostility`); link only via `factions.doctrine`; resistance template and `rogueDoctrine`; draft character per doctrine |
| SAI-011 | Decision log entry `{ time, faction, tier, decision, chosen, options[{ option, total, considerations }] }`, best first, at most `logTopN`; AI keeps none |

**Faction behaviour**

| ID | Summary |
| --- | --- |
| SAI-012 | Factions pursue their own goals, not the player |
| SAI-013 | Hostile to the player only on standing `hostile`, a mission targeting the player, or `unfriendly`-or-worse plus a shared objective (same `knownGoal` and `knownTarget` as an own squad); may only target the player while hostile |
| SAI-014 | Post contracts for unreachable, costlier-elsewhere or deniable objectives and counter-contracts (`contractUse`); pay computed exactly by MGT-046; funds a hard limit by default, `overdraft` consideration under `scoreTerm`; `recruit` scored like any candidate |
| SAI-015 | Only Varyag and Aegis take offers, from their patron's side, scored as objectives (pay in gain), via `acceptContract`; a taken contract then shows in `contracts` as `role: contractor` and earns `commitmentBonus`; the Krug takes none |
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
| STR-027 | `spec/strategic.md` | Operation lifecycle: Strategic judges when an AI contractor's mission is met (SAI-015) |
| STR-036 | `spec/strategic.md` | Scouting |
| STR-044 | `spec/strategic.md` | Contract postings from goals (what an offer carries) |
| STR-045, STR-048 | `spec/strategic.md` | VIPs and VIP intel in the view |
| STR-050 | `spec/strategic.md` | Event instances in the view's `events` |
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
| `spec/interfaces/strategic_commands.schema.json` | produces (to strategic) | 0.8.0 |
| `spec/interfaces/strategic_perception_view.schema.json` | consumes (from strategic) | 0.9.0 |

Change history: `spec/interfaces/CHANGELOG.md`. Since the last scope (second cleanup 2026-11-24): commands
0.8.0 (an action for a squad in transit cancels its move; `attack.target` names a `knownSquads` id); view
0.9.0 (`mapShape`, `recruitsAvailable`, `knownSquads.id` required, `knownTarget`, `roadTo`, `roadCrossing`);
ai-doctrines 0.7.0 (`commitmentBonus`, `gainTerms`, `escortAccept { considerations, threshold }` typed with
`$defs/consideration`; `$defs/curve` with types `linear`, `step`).

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/ai/doctrines.json` | `spec/interfaces/data/ai-doctrines.schema.json` | 0.7.0 | Considerations, curves, `personality`, `commitmentBonus`, `gainTerms`, `escortAccept`, `logTopN` (`layer: "strategic"`) |
| `data/factions.json` | `spec/interfaces/data/factions.schema.json` | 0.6.0 | Faction kind, patron, `doctrine`, `rogueDoctrine`, resistance template |
| `data/strategic-rules.json` | `spec/interfaces/data/strategic-rules.schema.json` | 0.7.0 | Relation thresholds, road/foot hours, crisis constants (`measureSignsMin`) for planning and scoring |
| `data/strategic-terrain.json` | `spec/interfaces/data/strategic-terrain.schema.json` | 0.2.0 | Move hours and visibility per terrain (move planning, threat) |
| `data/economy-rules.json` | `spec/interfaces/data/economy-rules.schema.json` | 0.5.0 | `fundsMode` and cost formulas for the cost term |
| `data/poi.json` | `spec/interfaces/data/poi.schema.json` | 0.7.0 | POI income and outputs for the economic-value map; recruit-yielding POIs |
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
relation constants, goal names) are resolved in spec `e8aa7e7`; the four of the first 2026-11-24 scope
(taken contracts, untyped view items, one action per squad, log shape) in the cleanup `a0210cd`; the
nine found by `/test` and the doctrine typing in the second cleanup `f429937` (SAI-003, SAI-004, SAI-006,
SAI-008, SAI-013, SAI-014, SAI-017).

1. **Watch: AI-to-AI tactical missions** (STR open question 55, needs a design decision, not SAI's):
   how VIP kill or capture and destroy-target missions are judged met between AI squads decides what a
   rival contractor sees in `contracts[].missions[].status`. SAI-015 uses the view's status as given.
2. **Watch: the player's objective** (SAI open question 19, needs a design decision): player squads hold
   no STR-018 goal, so `knownGoal`/`knownTarget` of a player squad has no source yet. SAI-013 condition 3
   is built on those fields and stays inactive until the view fills them.
3. **Layer normalisation has no field.** SAI-006 puts the situation-map layers on a 0–1 scale "how a layer
   is normalised is doctrine data", but `ai-doctrines` 0.7.0 has no field for it. The core divides each
   layer by its largest value on the known map (no constants). Spec-internal: name the field, or state
   this rule.
4. **Where personality enters.** SAI-010 says personality values are consideration inputs, but the SAI-006
   vocabulary has no input for `aggression`, `riskTolerance` or `contractUse`. The core scales
   `damageToRivals` by `aggression`, divides `risk` by `1 + riskTolerance` and multiplies the value of
   posting a contract by `contractUse`. Spec-internal: state where each personality value enters.
5. **Hex coordinates.** `mapShape = hex` sets 6 neighbours (STR-005), but the coordinate convention of
   `x`, `y` on hex (axial, offset rows, offset columns) is not stated. The core uses axial coordinates.
6. **Offer deadline.** STR-044/MGT-042 give the deadline's form, not how far ahead it lies. The core uses
   the travel hours from the board tile to the target and back, plus one crossing of the target tile.
7. **`patronStanding` against the patron's enemies.** SAI-006 counts an objective that acts against "a
   faction hostile to its patron", but the view holds only the faction's own relations. The core counts
   only the patron's contracts.
8. **`hireEscort` has no shipment to name.** SAI-009 lets the planner hire a Krug escort for one of its
   shipments, but the view marks no own squad as a convoy or shipment. The core never emits `hireEscort`.

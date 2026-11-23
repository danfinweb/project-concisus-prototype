# Strategic AI (faction AI) — scope

Refreshed by `/scope` (2026-11-23, spec baseline `931ee45`, design `eb072a2`). Lists everything this
module may read outside its folder.

## Spec IDs

Source: `spec/strategic-ai.md` (area SAI, 15 IDs, all mapped to `modules/strategic-ai` in
`spec/_index.md`). `(open)` = the design leaves a value or rule unset; build with a stub and flag it.
All behaviour values (weights, curves, doctrines) are unset in the design and live in `data/ai/doctrines.json`.

**Controller contract**

| ID | Summary |
| --- | --- |
| SAI-001 | Pure `decide(view, rng) → { commands, log }`; same view, data and seed give the same output; never changes state |
| SAI-002 | Called once per AI faction (`ssv`, `vdk`, `varyag`, `aegis`, `krug`) for every hour, on start-of-hour state; controller is pluggable |
| SAI-003 | Perception view holds only fog-of-war knowledge: own regions and squads, known regions and squads, relations, reputation, funds, contracts, offers, events |
| SAI-004 | Command set `setGoal`, `moveSquad`, `offerContract`, `acceptContract`, `pass`; STR validates and rejects illegal ones |
| SAI-005 | Reads only its view and `/data`; issues only SAI-004 commands; tests assert no hidden info in the view |

**Decision structure**

| ID | Summary |
| --- | --- |
| SAI-006 | Utility AI: candidates scored by weighted considerations through 0–1 response curves; ties broken by `rng` |
| SAI-007 | Tier 1: per-region situation maps (own/enemy strength, economic value, threat, frontline, supply reach), every call, never stored |
| SAI-008 | Tier 2: strategist scores objectives `ownGain + damageToRivals − cost − risk + commitmentBonus` against the faction's ultimate goal |
| SAI-009 | Tier 3: planner assigns squads (`setGoal`, `moveSquad`) or emits `offerContract` when own squads can't or shouldn't |
| SAI-010 | Doctrines (`layer: "strategic"`) set weights, curves and personality (`aggression`, `riskTolerance`, `contractUse`, `hostility`) |
| SAI-011 | Decision log per decision: time, faction, tier, chosen option, top-N options with per-consideration scores; AI keeps none |

**Faction behaviour**

| ID | Summary |
| --- | --- |
| SAI-012 | Factions pursue their own goals, not the player |
| SAI-013 | Hostile to the player only on low reputation (spec ≤ −50), a mission targeting the player, or a shared objective |
| SAI-014 | Post contracts for unreachable, costly or deniable objectives and counter-contracts; funds are a hard limit by default |
| SAI-015 | (open) Only Varyag and Aegis take offers, from their own side, via `acceptContract`; Krug takes none, offers and sells escorts |

**Also reads** (rules this module depends on but does not own)

| ID | File | Why strategic-ai reads it |
| --- | --- | --- |
| STR-003, STR-020, STR-021 | `spec/strategic.md` | When it is called, one command set per hour, how commands are validated |
| STR-005, STR-006, STR-008 | `spec/strategic.md` | Tile grid and adjacency, move hours (planning), fog of war behind the view |
| STR-007 | `spec/strategic.md` | (open) Capital holder/contested state — SSV and VDK ultimate goal |
| STR-017, STR-018 | `spec/strategic.md` | Squad record and the goal types `setGoal` may set |
| STR-022, STR-051 | `spec/strategic.md` | Encounter hostility and relation thresholds |
| STR-044 | `spec/strategic.md` | What an offered contract carries |
| STR-067 | `spec/strategic.md` | Resistance groups and their ultimate goal |
| STR-069, STR-070 | `spec/strategic.md` | Crisis signs and measure choice (the choice is SAI) |
| STR-092, STR-093, STR-094 | `spec/strategic.md` | (open) Funds and `fundsMode`, contract pay between factions, Krug escorts |
| GEN-004 | `spec/overview.md` | Faction IDs, kinds and patrons |
| GEN-007 | `spec/overview.md` | Relation model (−100…100, hostile ≤ −50, allied ≥ 50) |
| GEN-008 | `spec/overview.md` | (open) Leader effects that shape behaviour (e.g. Aegis adapting to the player) |
| MGT-042, MGT-043, MGT-046 | `spec/management.md` | Contract terms, goal → mission mapping, pay inputs for `offerContract` |
| MGT-049, MGT-050 | `spec/management.md` | Intel level and deniability on offers |
| MGT-052 | `spec/management.md` | (open) Rival PMC competition for offers |
| MGT-054, MGT-055 | `spec/management.md` | Standing tiers and their effects (SAI-013) |
| TEC-012, TEC-015 | `spec/tech.md` | Pure rules core; seeded, reproducible randomness |

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/strategic_commands.schema.json` | produces (to strategic, management) | 0.4.0 |
| `spec/interfaces/strategic_perception_view.schema.json` | consumes (from strategic) | 0.4.0 |

Change history: `spec/interfaces/CHANGELOG.md`.

## Data tables

Read through `shared/registry.js` only.

| Table | Schema | Version | Used for |
| --- | --- | --- | --- |
| `data/ai/doctrines.json` | `spec/interfaces/data/ai-doctrines.schema.json` | 0.2.0 | Considerations, weights, curves, personality, `logTopN` (owned by SAI, `layer: "strategic"`) |
| `data/factions.json` | `spec/interfaces/data/factions.schema.json` | 0.3.0 | Faction kind, patron, doctrine ID, measures, low-reputation threshold (SAI-013) |
| `data/strategic-rules.json` | `spec/interfaces/data/strategic-rules.schema.json` | 0.3.0 | Move hours, relation thresholds, crisis constants for planning and scoring |
| `data/economy-rules.json` | `spec/interfaces/data/economy-rules.schema.json` | 0.2.0 | `fundsMode` and cost formulas for the cost term |
| `data/poi.json` | `spec/interfaces/data/poi.schema.json` | 0.3.0 | POI income and outputs for the economic-value map |
| `data/events.json` | `spec/interfaces/data/events.schema.json` | 0.3.0 | Measures and their typical signs (STR-070 choice) |
| `data/missions.json` | `spec/interfaces/data/missions.schema.json` | 0.2.0 | Mission IDs and pay bands in `offerContract` |
| `data/vehicles.json` | `spec/interfaces/data/vehicles.schema.json` | 0.2.0 | Fuel range and off-road rating for move planning |

## State slices

- Owns: `— (no state)`
- Reads: none directly. Everything about `world` (and the reputation and contracts it may know) arrives in
  `strategic_perception_view`; its only output is `strategic_commands`.

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions

Found while scoping; report to the root session, do not edit `spec/`. The 8 open questions in
`spec/strategic-ai.md` › Open questions still apply.

1. **Command set larger than SAI-004.** `strategic_commands` 0.4.0 also has `hold`, `scout`, `attack`,
   `hireEscort`, `pickMeasure` and `recruit`, with no SAI section; the schema already answers open
   questions 5 and 13 that the spec still lists as open. SAI-014/STR-092 talk of "raising a squad", which
   only `recruit` could do.
2. **Field names in SAI-004 vs schema.** `acceptContract` uses `contract` (an ID) in SAI-004 but
   `contractId` in the schema, where `contract` is the offer object of `offerContract`. `offerContract`
   deadline is "hours" in SAI-004 but a `{ day, hour }` timestamp in the schema and STR-044; "pay" is
   `payInputs` in the schema.
3. **View fields vs SAI-003.** The schema has `capital`, `vips`, `crisisSigns` and `availableMeasures`,
   which the SAI-003 table omits; `ownRegions.loyalty` is a number while STR-009 and `knownRegions.loyalty`
   hold one value per faction; `ownSquads.inTransit` vs STR-017 `transit`.
4. **Doctrine fields missing.** SAI-010 personality (`aggression`, `riskTolerance`, `contractUse`,
   `hostility` per faction) and SAI-008's commitment bonus and gain terms per ultimate goal have no field in
   `ai-doctrines` 0.2.0 (only `considerations`, `logTopN` and TAI weights). The faction → doctrine link
   exists twice (`factions.doctrine` and `doctrine.factions`); which wins?
5. **Low-reputation threshold.** SAI-013 puts `lowReputationThreshold` in `data/factions.json`, which has no
   such field; the standing thresholds already live in `data/management-rules.json` (MGT-054), and the view
   carries the derived `standing`.
6. **Relation constants twice.** SAI-003 cites GEN-007 (`relation_min`, `hostile_at` → factions.json) while
   STR-051 holds the same values in strategic-rules (`relationMin`, `hostileAt`).
7. **Goal names.** `setGoal.goal` and STR-018 are camelCase (`supplyRun`, `attackPoi`); MGT-043, which
   maps goals to missions for `offerContract`, uses snake_case (`supply_run`, `attack_poi`).

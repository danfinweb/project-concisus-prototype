# Tools — scope

Refreshed by `/scope`. Lists everything the tools pillar may read outside `tools/`.

## Spec IDs

DAT, ITM and the TEC tooling sections in `spec/` (see `spec/_index.md`). _No IDs yet — run `/scope` after
the first `/update-spec`._

## Interfaces

- `spec/interfaces/data/*.schema.json` — every /data schema (forms are generated from them)
- `spec/interfaces/*.schema.json` — read by cross-sim and the map tools (tactical map requests)

## Data tables

All of `data/` (read and write), as listed in `data/tables.json`.

## Module cores (read-only, for previews and tests)

- `modules/*/core/`, `modules/*/test/` (Test Lab runs them), `modules/*/test/fixtures/` (write: fixture export)

## Shared code

- `shared/registry.js`, `shared/schema.js`, `shared/rng.js`, `shared/state.js`

## Open questions

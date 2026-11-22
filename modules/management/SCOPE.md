# Management — scope

Refreshed by `/scope`. Lists everything this module may read outside its folder.

## Spec IDs

Area MGT in `spec/` (see `spec/_index.md`). _No IDs yet — run `/scope` after the first `/update-spec`._

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/defined by /update-spec).schema.json` | produces | 0.1.0 |
| `spec/interfaces/battle_result.schema.json` | consumes | 0.1.0 |
| `spec/interfaces/strategic_commands.schema.json` | consumes | 0.1.0 |

## Data tables

- `data/items.json` — schema `spec/interfaces/data/items.schema.json`
- `data/presets.json` — schema `spec/interfaces/data/presets.schema.json`
- `data/missions.json` — schema `spec/interfaces/data/missions.schema.json`

## State slices

- Owns: `roster, unlocks, economy, contracts, reputation`
- Reads: _to be filled by `/scope`_

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions


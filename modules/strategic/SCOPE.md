# Strategic Layer — scope

Refreshed by `/scope`. Lists everything this module may read outside its folder.

## Spec IDs

Area STR in `spec/` (see `spec/_index.md`). _No IDs yet — run `/scope` after the first `/update-spec`._

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/tactical_map_request.schema.json` | produces | 0.1.0 |
| `spec/interfaces/strategic_perception_view.schema.json` | produces | 0.1.0 |
| `spec/interfaces/battle_result.schema.json` | consumes | 0.1.0 |
| `spec/interfaces/strategic_commands.schema.json` | consumes | 0.1.0 |

## Data tables

- `data/terrain.json` — schema `spec/interfaces/data/terrain.schema.json`
- `data/mapgen/strategic.json` — schema `spec/interfaces/data/mapgen-strategic.schema.json`

## State slices

- Owns: `world`
- Reads: _to be filled by `/scope`_

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions


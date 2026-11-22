# Tactical Layer — scope

Refreshed by `/scope`. Lists everything this module may read outside its folder.

## Spec IDs

Area TAC, plus DAT/ITM it reads in `spec/` (see `spec/_index.md`). _No IDs yet — run `/scope` after the first `/update-spec`._

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/battle_result.schema.json` | produces | 0.1.0 |
| `spec/interfaces/tactical_perception_view.schema.json` | produces | 0.1.0 |
| `spec/interfaces/tactical_map_request.schema.json` | consumes | 0.1.0 |
| `spec/interfaces/tactical_commands.schema.json` | consumes | 0.1.0 |

## Data tables

- `data/items.json` — schema `spec/interfaces/data/items.schema.json`
- `data/presets.json` — schema `spec/interfaces/data/presets.schema.json`
- `data/prefabs.json` — schema `spec/interfaces/data/prefabs.schema.json`
- `data/terrain.json` — schema `spec/interfaces/data/terrain.schema.json`
- `data/mapgen/tactical.json` — schema `spec/interfaces/data/mapgen-tactical.schema.json`

## State slices

- Owns: `battle`
- Reads: _to be filled by `/scope`_

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions


# Tactical AI (unit and squad AI) — scope

Refreshed by `/scope`. Lists everything this module may read outside its folder.

## Spec IDs

Area TAI in `spec/` (see `spec/_index.md`). _No IDs yet — run `/scope` after the first `/update-spec`._

## Interfaces

| Interface | Direction | Version |
| --- | --- | --- |
| `spec/interfaces/tactical_commands.schema.json` | produces | 0.1.0 |
| `spec/interfaces/tactical_perception_view.schema.json` | consumes | 0.1.0 |

## Data tables

- `data/ai/doctrines.json` — schema `spec/interfaces/data/ai-doctrines.schema.json`

## State slices

- Owns: `— (no state)`
- Reads: _to be filled by `/scope`_

## Shared code

- `shared/registry.js`, `shared/rng.js`, `shared/schema.js` (adapter only: `shared/state.js`)

## Open questions


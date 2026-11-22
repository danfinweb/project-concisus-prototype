# Spec index

Maps every spec ID to the module or tool that implements it and to its design source. Maintained by
`/update-spec` only.

IDs are `[AREA-NNN]`, never reused or renumbered; a removed rule keeps its ID, marked `(removed)`.

| Area | File | Design source | Implemented by |
| --- | --- | --- | --- |
| GEN | [overview.md](overview.md) | design.md › Overview, Factions & campaign | all modules |
| STR | [strategic.md](strategic.md) | design.md › Strategic Layer; strategic-actions.md; world-events.md | `modules/strategic` |
| TAC | [tactical.md](tactical.md) | design.md › Tactical Layer; tactical-actions.md | `modules/tactical` |
| MGT | [management.md](management.md) | design.md › Management; callsigns.md | `modules/management` |
| SAI | [strategic-ai.md](strategic-ai.md) | design.md › AI › Strategic AI | `modules/strategic-ai` |
| TAI | [tactical-ai.md](tactical-ai.md) | design.md › AI › Tactical AI | `modules/tactical-ai` |
| DAT | [data.md](data.md) | design.md › Data definitions | `/data`, tools |
| ITM | [data.md](data.md) | item-list.md | `/data/items.json`, item editor |
| TEC | [tech.md](tech.md) | design.md › Presentation & tech | `game/`, `tools/` |

## IDs

| ID | Title | Implemented by | Design source |
| --- | --- | --- | --- |
| — | No sections yet. Run `/update-spec` for the first split. | | |

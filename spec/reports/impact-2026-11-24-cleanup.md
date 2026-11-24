# Impact report — 2026-11-24 (cleanup)

**Mode:** cleanup · **Design baseline:** unchanged (`3aac08f`)

Input: the open questions of every `SCOPE.md` and of `impact-2026-11-24-b.md`. The SCOPE files of
management, strategic, strategic-ai, tactical-ai and tools are from 2026-11-23, and the 2026-11-23 cleanup
already processed their findings, so only the 2026-11-24 tactical scope brought new findings. The design has
since settled one finding from the tools scope (tools 6: tactical map generation, TAC-086..TAC-093).

## SCOPE findings and outcome

| Pillar | Finding | Outcome |
| --- | --- | --- |
| tactical | 1. Perception view lacks concealed target, jammed weapon, obscuring tiles, door state | Fixed in TAI-004 and `tactical_perception_view` 0.5.0 |
| tactical | 2. Player-controlled VIP: no TAC section states it never reacts or joins the player's activations | Fixed in TAC-005, TAC-020 |
| tactical | 3. Command retries not described on the TAC side | Fixed in TAC-005 (retry loop and how the activation then ends) |
| tactical | 4. Reaction modifiers when the trigger is a visible action in place | Needs a design decision (TAC Q57) |
| tools | 6. Tactical map generation not designed | Settled by the design (TAC-086..TAC-093, design 75e776f) |

## Spec IDs

| Change | IDs | Affects |
| --- | --- | --- |
| Changed | TAC-005, TAC-020, TAI-004 | tactical, tactical-ai |
| New / removed | — | — |

## Interface version bumps

| Interface | Old → new | Change | Affects |
| --- | --- | --- | --- |
| `tactical_perception_view` | 0.4.0 → 0.5.0 | `squad[].weaponJammed`, `allowedActions[].targets[].concealed`; `map.tiles` lists impassable and obscuring flags and door state | tactical (produces), tactical-ai |

## Data that may now fail validation

None.

## Needs a design decision

- **TAC Q57:** for a reaction triggered by a visible action in place, do the mover modifiers (stance, sprint, noise from Recon) use the acting soldier? The spec reads it that way.
- **Still open from 2026-11-23:**
  - STR: Q41–Q44
  - SAI: Q13
  - MGT: Q39, Q41
  - DAT: Q32

Re-run `/scope` for tactical-ai, so its interface versions pick up `tactical_perception_view` 0.5.0.

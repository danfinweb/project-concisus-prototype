# Impact report — 2026-11-23 (open-issues review)

**Mode:** update · **Design baseline:** `69be026` → `eb072a2`

The user answered the blocking open questions in ten batches; the answers went into the live docs and
then into `design/` (commits `8239862`, `bf40831`, `eb072a2`). This update carries them into the spec.
387 IDs now (9 new), about 110 sections changed, nothing removed. Open questions: 129 unresolved
(was 149 before the review; 70 are now marked resolved, 50 new and narrower ones were added).

## What changed in the design

- **Tactical:** neutral third side that never activates; wounded (<50% HP) vs disabled (0 HP) limbs
  (arms widen cone and grenade scatter ×1.5/×2, legs +1 AP per tile / ×2 base tile cost, fracture stacks);
  damage on a disabled limb spread over the remaining zones; one cost order (multipliers first);
  Tactical actions is the only cost source; overwatch; reworked reactions, suppression, alerted, stall
  rule; partial tube reload; short bursts; carry or drag a body; search once per side; objectives met at
  once in battle. Deferred: morale flight, Nerve effects, contamination and mines on the tactical map.
- **Items:** feed type per weapon, magazines as items shared by pattern (RPK-74 40 rounds), frag and smoke
  grenades (draft), IFAK 15 HP before the Medical multiplier, 12 gauge per load.
- **Tactical AI:** escorted VIP AI-controlled with a player-control option; acceptable loss = share out of
  action → retreat; squad leader by rank with succession; enemy gear known as the player sees it.
- **Strategic:** square tile grid (hex as a test option), one region per tile; roads on top of terrain;
  loyalty per faction on settlements only; contested capital; commit and cancel rules; encounters on the
  shared tile; Stand by replaces Wait and Rest; funds never negative, hard limit, unpayable payment fails
  the contract; shared cap of 3 for events and measures; defection joins or disbands; Krug escorts.
- **Management / campaign:** contracts paid per mission; objective → confirm → pay at the next hour;
  derived values owned by Tactical (MGT points to TAC); rogue PMC from a daily check on its patron's crisis
  signs; for now only the player's coup ends the campaign.
- **Strategic AI:** ultimate goal per faction; only Varyag and Aegis take other factions' contracts.

## Spec IDs

| Area | New | Changed (main) | Affects |
| --- | --- | --- | --- |
| TAC | TAC-075 Hold overwatch, TAC-076 Objective met in battle, TAC-077 Morale flight and Nerve (optional), TAC-078 Contamination and mines (optional), TAC-079 Grenade effects | 30 sections (001, 004–006, 009, 011, 013, 015, 019, 022–024, 029, 033, 038–044, 057–059, 062, 066, 070, 074) | tactical, tactical-ai |
| DAT, ITM | DAT-030 Magazine profile, ITM-031 Magazine items, ITM-032 Grenade items | DAT-001, 004, 005, 011, 016, 019, 020; ITM-001, 002, 008, 014, 019, 020 | tools (item editor), tactical |
| TAI | — | TAI-002–005, 009, 013, 017, 018 | tactical-ai, tactical |
| STR | STR-094 Krug escorts | 24 sections (002, 003, 005–007, 009, 014, 020–023, 027, 032, 037, 049, 050, 061, 070, 076, 080, 082, 088, 092, 093) | strategic, strategic-ai, management |
| MGT | — | MGT-008, 026–028, 030, 031, 044, 047, 048, 051, 052 | management |
| GEN | — | GEN-002, 006, 012, 015, 017 | all modules |
| SAI | — | SAI-008, 014, 015 | strategic-ai |
| TEC | — | — | — |

## Interfaces

| Interface | Version | Change |
| --- | --- | --- |
| tactical_map_request | 0.3.0 → 0.4.0 | per-unit `rank`, `controller`; neutral role; `acceptableLoss` 0–1; encounter tile terrain and `road` |
| battle_result | 0.2.1 → 0.3.0 | objectives carry `metTurn` |
| tactical_perception_view | 0.2.0 → 0.3.0 | rank, limb states, overwatch, alerted, out of action, carrying, magazines; enemy gear as seen |
| tactical_commands | 0.2.0 → 0.3.0 | `holdOverwatch`, `liftBody`/`putDownBody`, `search`, `pickUpBackpack`; reload magazine/shells |
| strategic_perception_view | 0.3.0 → 0.4.0 | tiles with x, y, road; loyalty per faction; capital state |
| strategic_commands | 0.3.0 → 0.4.0 | `hireEscort`; moves to adjacent tiles |
| management_requests | 0.2.0 → 0.3.0 | `contractEnded.reason`, `payKrugEscort` |

## Data

- `items` 0.4.0: kinds `magazine` and `grenade`; medical `hpPerUse` (base, not a cap).
- `tactical-rules` 0.4.0: wound, overwatch, suppression and cover fields; `aimSpreadFactor` 0.85,
  `aimPainSurcharge`; removed `swapHeavyKg`, `swapHeavySurcharge`, `woundedArmReloadSurcharge`,
  `woundedArmThrowSurcharge`.
- `strategic-rules`, `mapgen/strategic`, `factions`, `poi`, `events` 0.3.0; `management-rules` 0.4.0;
  `economy-rules` 0.2.0 (`fundsMode`).
- Data that may now fail validation: none (tables still empty). When content is entered: every weapon
  needs a `feedType`; magazine items need `fits`.

## Scope findings (modules/tactical/SCOPE.md)

Settled: 2 (TAC owns the derived values, MGT points to it), 3 (zone HP rounds down), 5 and 6 (deferred,
TAC-077/078), 7 (TAC-076 covers objectives met in battle). Still open: 1 (falloff floor has two names)
and 4 (battle duration in two tables; `gameTimeSpent` vs `gameTimeHours`). The tactical module should
re-run `/scope`.

## Open questions

| File | Unresolved | New this update |
| --- | --- | --- |
| tactical.md | 21 | 43–50 |
| strategic.md | 25 | 32–40 |
| management.md | 28 | 32–35 |
| data.md | 22 | 24–28 |
| tactical-ai.md | 8 | 11–14 |
| strategic-ai.md | 8 | 12–13 |
| overview.md | 8 | 9–10 |
| tech.md | 9 | — |

Assumptions the update made, each listed as an open question: mission shares split in proportion to
mission pay (MGT-047); defection prefers the last attacker over the nearest enemy (STR-061); a contract
fails when its deadline passes with missions open (MGT-048).

## Next steps

1. `modules/tactical`: re-run `/scope`, then `/test` for the first TAC IDs.
2. Settle scope findings 1 and 4 (naming only) in the next design pass.

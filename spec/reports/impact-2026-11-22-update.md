# Impact report — 2026-11-22 (update)

**Mode:** update · **Design baseline:** `9c7498b` → `8972470`

The refreshed design (GDD rev 186, item list rev 14, tactical actions rev 5) answers many open questions
from the first split. 378 IDs now: 3 new, 3 removed, about 75 changed. Open values fell from 135 to 114.
The first split's report is `impact-2026-11-22-first-split.md`.

## What changed in the design

- **Time:** every hour each faction issues one command set and each squad takes one action; multi-hour
  actions can be interrupted; the player plans an action per squad, ends the turn, then everything
  resolves together.
- **Faction funds:** the strategic layer owns AI faction money; formulas shared with Management; contract
  pay crosses modules; Low liquidity is now defined.
- **Ops:** an op succeeds when at least one soldier gets back; missions count as soon as their goal is met.
- **Reputation:** no spill-over; Hostile = no contracts or trade, Unfriendly = fewer contracts and higher
  prices.
- **AI:** the utility-AI structure is now in the GDD (faction AI tiers, unit scoring, squad leader,
  blackboard).
- **Tactical:** draft costs for nearly every action; global rounding rule; wounds no longer cut the AP
  pool; the shot preview has its own random stream.
- **Items:** the medkit also stops heavy bleeding in any zone; hand-ins have no spill-over.

## Spec IDs

| Area | New | Removed | Changed | Affects |
| --- | --- | --- | --- | --- |
| TAC | — | — | 28: TAC-006, 017, 021, 024–027, 029–034, 038–043, 046, 058, 062, 068–070, 072–074 | modules/tactical, tactical-ai |
| DAT, ITM | — | — | DAT-006, 011, 012; ITM-020, 029 | tools (item editor), tactical |
| STR | STR-092 Faction funds, STR-093 Contract payment between modules | — | STR-001–003, 020, 021, 027, 037, 051, 069 | modules/strategic, management, strategic-ai |
| MGT | — | MGT-061 spill-over, MGT-062 Krug exemption, MGT-063 patron follow | MGT-005, 039, 044, 047, 051, 053, 055, 060, 070 | modules/management, strategic |
| GEN | — | — | GEN-002, 004, 007 | all modules |
| SAI | SAI-015 Contract offer evaluation | — | SAI-001–004, 006–011, 014 | modules/strategic-ai, strategic |
| TAI | — | — | TAI-004, 007–013, 015, 016 | modules/tactical-ai, tactical |
| TEC | — | — | — | — |

Removed IDs keep their section, marked `(removed)`; nothing was renumbered.

## Interfaces

| Interface | Version | Change |
| --- | --- | --- |
| strategic_perception_view | 0.2.0 → 0.3.0 | own `funds`, other factions' `contractOffers` |
| strategic_commands | 0.2.0 → 0.3.0 | `acceptContract` |
| management_requests | 0.1.0 → 0.2.0 | `contractPayment`, per-request `results` with `paymentDue` |
| tactical_map_request | 0.2.0 → 0.3.0 | `battleGoal` typed: goal, targets, acceptableLoss per faction |
| battle_result | 0.2.0 → 0.2.1 | description only: objectives are final; op success decided at op level |

## Data

- `items` 0.3.0: weapon `feedType` (selects reload AP) and optional `fireApCost`.
- `tactical-rules` 0.3.0: ~50 draft cost fields; replaced `diagonalSurcharge` → `diagonalWalkCost`,
  `sprintCost` → `sprintDiscount`, `reloadBaseCost` → `reloadApByFeedType`, `swapBaseCost` → `swapCost`,
  `throwBaseCost` → `throwCost`.
- `management-rules` 0.3.0: spill-over fields removed; `unfriendlyContractShare`, `unfriendlyPriceMarkup`
  added (not set).
- `economy-rules` 0.1.0 (new, shared by STR and MGT): start funds, income, upkeep, salary, pay interval,
  low liquidity — all not set.
- Data that may now fail validation: none (all tables still empty). Content to watch: every weapon needs
  a `feedType`, which `design/item-list.md` does not give yet (data.md open question 23).

## Open questions

| File | Open | Resolved by this update | New |
| --- | --- | --- | --- |
| tactical.md | 42 | 1, 2, 13, 21; partly 3, 10, 26, 27, 28, 30 | 32–42 |
| strategic.md | 31 | 1, 18; partly 2, 3 | 26–31 |
| management.md | 31 | 17, 19, 20 | 27–31 |
| strategic-ai.md | 11 | 1, 3 | 9–11 |
| tactical-ai.md | 10 | 1 | 9–10 |
| data.md | 23 | 1, 12 | 23 |
| overview.md | 8 | 1 | — |

New questions worth a design decision first:
- Conflicts between design.md and tactical-actions.md: ergonomics lowering aim cost, Marksmanship and
  ergonomics on swaps, and Agility on reload and stance changes. The spec follows tactical-actions.md.
- Upright → prone has no cost.
- Faction funds formulas, negative funds, and what "contracts go unpaid" does.
- What the acceptable-loss threshold does and its unit; each faction's "ultimate goal" is undefined.
- Feed type per weapon is missing from the item list.

## Next steps

1. Module sessions refresh `/scope`: strategic and management pick up `management_requests` 0.2.0 and
   STR-092/093; tactical picks up the new costs.
2. Tools: fill `tactical-rules` with the draft values listed in the spec's `**Values.**` lines.

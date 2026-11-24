# Concisus – Strategic actions

Nov 22, 2026 · @Dan

**Draft — not final.** Every action the player can take on the strategic map, with the game time it takes and its other costs, collected from the Strategic Layer and Management sections of the [Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo). Time runs in full hours only, and for every hour that passes every faction issues one set of commands and each of its squads takes one action. "Open" marks a value not set yet. Actions that take no time resolve at once. A multi-hour action is interrupted only by an event that touches the squad: an encounter, an attack, or an event on its own tile.

## Movement and operations

| Action | Where | Time | Other cost | Status |
| --- | --- | --- | --- | --- |
| Launch an op (leave an FOB) | Any FOB | 0 hours (draft): the first move starts at once | Squad, loadout and vehicle committed; each soldier's fee is paid now (no fee, no launch) | Draft |
| Move one region by ground vehicle | Any passable region | Set by the destination tile: 1 hour along a road (asphalt or dirt), 2 on steppe, 3 in woods; mountains by road only; water only at bridges and fords | Fuel: a flat amount per tile moved, whatever the terrain (vehicle fuel range), spent on arrival (a cancelled or interrupted move spends none); off-road rating lowers the time in steppe and woods | Defined |
| Move one region on foot | Any passable region | 2 hours on most ground, 3 in mountains | No vehicle storage: the squad carries, and loots, only what fits in its soldiers' rigs and backpacks | Defined |
| Fly one region by helicopter | Anywhere | 1 hour, any terrain | Fuel; needs a pilot: a roster soldier with Technical 50+ (a hired pilot is a normal roster soldier, paid the normal fee by rank); noticed by every faction in range; each hostile military point of interest on the path rolls a chance to damage or down it (draft: 10% damaged, 3% downed per point of interest); military points of interest are arms plants, governmental institutions and any tile with a hostile squad; a damaged helicopter over water crashes; over land it lands and waits for repair at a mechanical plant before it flies on | Defined |
| Land a helicopter | Any open ground except water; the only way into hidden cities | 1 hour (draft) | — | Draft |
| Enter a point of interest | The region's point of interest | 1 hour (draft) | — | Draft |
| Scout | Current region | 3 hours (placeholder) | — | Defined |
| Stand by | Anywhere; the squad stays where it is and wounds heal meanwhile, faster at an FOB (replaces Wait and Rest) | As many hours as the player sets | — | Defined |
| Fight a tactical engagement | Where squads meet and the encounter turns hostile | Always 1 hour | Ammunition, wounds, gear at risk | Defined |
| Evade an encounter | Where squads meet | 1 hour (draft) | Chance from Recon and terrain (draft: 20% + the squad's best Recon ÷ 2, +20 in low-visibility terrain such as woods and mountains, limited to 10–90%); on failure the fight starts | Draft |
| Pay your way through (Krug) | Encounter with a Krug squad | 0 hours (draft) | Money (draft: $100 per soldier in the squad) | Draft |
| Station a squad at a plant | A plant the PMC has taken | 0 hours to start (draft); the squad then stays until ordered away | The squad stays to hold it; output goes to the nearest FOB daily | Draft |
| Return to an FOB (end an op) | Any FOB | Arrival ends the op | — | Defined |

## Trade, services, contracts and factions

| Action | Where | Time | Other cost | Status |
| --- | --- | --- | --- | --- |
| Trade (buy, sell, barter) | Faction traders in cities, Krug markets | No time | Money or goods; stock depends on reputation; barter deals refresh daily at 00:00 | Defined |
| Hire soldiers | FOBs; local recruits in towns and Krug markets | No time | Hire price by tier; a fee per op is paid at launch (see Management) | Defined |
| Buy or sell a vehicle | Large cities, mechanical plants; some only with high standing or through the Krug | No time (trade) | Vehicle price | Defined |
| Accept a contract | FOB, cities, Krug markets (Krug work) | 0 hours (draft) | Filtered by reputation with the employer; advance paid on signing and kept by the player (a failed contract costs only reputation, never a repayment); if the employer cannot pay the advance, the offer cannot be signed | Draft |
| Hand over items or a VIP (contract delivery) | The contract's destination | 1 hour (draft) | — | Draft |
| Hand in faction or operation items | A point of interest held by that faction, or a Krug market | One player action (draft: 1 hour) | Gives money and reputation | Draft |
| Buy intel on a VIP | Factions hostile to the VIP's side (standing ≥ 20, leader ≥ 50); Krug markets for goods | 0 hours (draft) | Major $2,000, Colonel $5,000, General $12,000, leader $30,000 (Krug: goods of a lower value) | Draft |
| Hospital treatment | Small and large cities | 4 hours (draft) | Paid | Draft |
| Vehicle repairs | Mechanical plants | 4 hours (draft) | Paid | Draft |
| Refuel | Gas stations, oil plants; helicopters only at FOBs and oil plants, never from diesel canisters | 1 hour (draft) | Paid | Draft |
| Buy a new FOB | Small and large cities | 24 hours (draft) before the new FOB can be used | Draft: $25,000 in a small city, $50,000 in a large city; no upkeep | Draft |
| Take over an FOB site | By force, through an op | As the op | — | Open |
| Pay compensation (Operation dispute) | Anywhere, at any time: paid remotely to the hurt faction, no travel | 0 hours (draft) | Money, credited to the hurt faction's funds (draft: $1,000 per soldier of the hurt faction killed, at least $2,000) | Draft |
| Pay off a bounty | Anywhere, at any time: paid remotely to the faction that set it, no travel | 0 hours (draft) | Money, credited to that faction's funds (draft: $10,000; $20,000 if reputation with it is −75 or lower) | Draft |
| Hire a Krug escort for a shipment | A Krug market tile, before the shipment leaves | 0 hours (draft) | Price by distance and danger (draft: $200 + $50 per tile of the route, ×1.5 if the route crosses the front or hostile ground); one Krug escort squad per convoy; if it is not on the convoy's tile it travels there first, which may delay the departure; the Krug may refuse (low standing, few free squads, a dangerous route, or a squad that resents foreign soldiers; foreign PMCs are the player's PMC, Varyag, Aegis and a rogue PMC, never the SSV, the VDK or the Krug) | Draft |

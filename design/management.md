# Concisus – Management

Nov 24, 2026 · @Dan

Module `modules/management/`, owns the `roster`, `unlocks`, `economy`, `contracts` and `reputation` state: the PMC itself, its soldiers, gear, contracts, reputation and everything it owns. Part of the [Concisus – Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo), which holds the overview, factions & campaign and the module map.

## Soldiers & progression

Soldiers are faceless, generated contractors: stats, a callsign and nothing else. Any attachment is earned through shared deployments, never pre-written — the game's job is to record and replay the soldier's story, not to tell one.

- **Recruitment:** generated contractors from hiring pools (agencies, local hires, defectors, freed prisoners) in price tiers. Price follows stats; replacements are always available. Draft tiers (hire price / fee per op / attribute range): Recruit $1,000 / $300 / 20–45; Regular $3,000 / $600 / 35–60; Veteran $8,000 / $1,200 / 50–75; Elite $20,000 / $2,500 / 65–90. Within a tier the price scales with the average attribute (draft: linearly from −30% at the bottom of the tier's attribute range to +30% at the top). Each soldier's fee (by rank) is paid when the op launches: no fee, no launch. There is no daily salary and no renewal, so idle soldiers cost nothing. A hired pilot is a normal roster soldier with Technical 50+, paid the normal fee by rank; there is no separate pilot fee. Refugee recruits (see Refugee movement in World events) have a fee per op 30% lower for as long as they serve.
- **Rank and leadership:** a soldier's rank is the hiring tier (Recruit, Regular, Veteran, Elite). It rises one step when the soldier's average attribute climbs above the top of the current tier's range (draft: above 45, 60 and 75; rank never drops), and the fee per op rises with it. The highest-ranked soldier on an op leads the squad (ties: the higher average attribute) and lends the whole squad, the leader included, a small Leadership bonus to morale and reaction chance while the leader is alive on the map (draft, by the leader's rank: Recruit +0, Regular +2, Veteran +4, Elite +6; added in battle only, never stored).
- **Identity:** no portrait, voice, backstory or personality. Helmet, balaclava or goggles, a callsign and a service number. The callsign is assigned when the soldier is generated and is drawn from their profile, so it hints at their strongest attributes (the strongest attribute and its value pick the list; lists and ranges are in [Callsigns](https://claude.ai/artifact/G1VpofmrmhUf2J8JNSY58o)). The player cannot rename soldiers; at most they give a soldier a nickname or callsign, which replaces the automatically given callsign (the service number stays), and mark their kit (patches, colours).
- **Service record:** the attachment engine. The game logs each soldier's life automatically — deployments, kills, rescues, wounds, near-misses, loot carried out, comrades lost — and shows it in a dossier and in after-action reports.
- **Earned marks:** notable events leave traces: an achievement kept in the service record ("carried two wounded out of the refinery") that also gives the soldier an earned callsign (OPTIONAL, see Deeds and callsigns), replacing the automatically given one. A later deed replaces an earned callsign only if it has higher prestige; a callsign the player has chosen always has the highest priority and is never replaced, visible scars, worn and repainted gear.
- **Contracts & morale:** a fee per op, but no personal opinions. Morale is kept per soldier, starts at 80 and is kept from fight to fight; a squad's morale is the average of its soldiers' when the op forms. The tactical map request carries each soldier's morale, and the battle result reports each soldier's morale at the end. The PMC's balance never goes below zero: a payment it cannot cover fails, so an op whose fees cannot be paid does not launch. Fees and plant income use the shared economy rules file. Only casualties move morale: allies killed or wounded lower it, enemies killed or wounded raise it (draft: ally killed −10, ally wounded −3, enemy killed +3, enemy wounded +1, for each soldier who has the casualty in line of sight or is in the same squad). Below 20, an activated soldier may disobey and flee toward the nearest exit (OPTIONAL — left out of the first build iterations).
- **Attributes:** eight attributes: four physical (a mostly fixed body profile) and four skills that improve by use (JA2) — see the draft below. Perks unlock at skill thresholds (draft: one perk per skill at 50 and one at 80). A soldier hired with a skill already at a threshold starts with every perk that skill meets. Leadership is not a perk: it comes from rank only.
- **Injuries:** four body zones with bleeding, fractures and pain; serious wounds need turns of recovery at an FOB or field surgery (see Medical system).
- **Death:** permanent and expected. A replacement is easy to hire; the history is not. Gear on a dead soldier stays on the operation map unless recovered.
- **Memorial:** fallen soldiers' service records move to a memorial wall at the base.

## Deeds and callsigns (draft, OPTIONAL — ignore for the first build iterations)

**Draft — not final.** Not part of the development spec for now; until then, soldiers keep the callsign assigned at generation. Deeds are logged automatically from the service record. Each has a prestige rank from 1 to 5 and a short list of callsigns. A new deed replaces an earned callsign only if its prestige is higher; equal prestige keeps the current one. A callsign the player has chosen is never replaced. Every deed stays in the service record either way. Each deed is earned once per soldier, and milestones do not re-trigger. If a deed's callsign list is used up, the soldier keeps the current callsign. The deed list with prestige ranks and callsigns is in [Callsigns](https://claude.ai/artifact/G1VpofmrmhUf2J8JNSY58o).

- **Picking a callsign:** drawn from the deed's list, never one already used by a living soldier in the roster.
- **Fallen soldiers** keep their last callsign on the memorial wall.

## Soldier attributes (draft)

**Draft — not final.** Names, ranges and formulas are a starting point for prototyping and balancing.

Every soldier has eight attributes on a 1–100 scale. They form two groups: four physical attributes, a mostly fixed body profile, and four skills that grow through use. Everything else is derived from them.

| # | Attribute | Group | Covers | Grows by |
| --- | --- | --- | --- | --- |
| 1 | Strength | Physical | Force: carry weight, heavy-kit penalty, recoil control, throwing distance | Barely (body profile) |
| 2 | Endurance | Physical | Body: HP per zone, stamina pool, bleed resistance, recovery speed | Barely (body profile) |
| 3 | Agility | Physical | Speed: AP, movement cost, vaulting and climbing, weapon swaps | Barely (body profile) |
| 4 | Perception | Physical | Senses: sight range, spotting, hearing, noticing a moving enemy (reactions) | Barely (body profile) |
| 5 | Marksmanship | Skill | Shooting: spread, aim time, reload cost, burst control | Hitting targets, reloading under fire |
| 6 | Recon | Skill | Moving unseen: noise, concealment, ambushes, evading and scouting on the strategic map | Moving unseen, scouting |
| 7 | Medical | Skill | Field treatment, surgery, healing speed at the FOB | Treating wounds |
| 8 | Technical | Skill | Repairs, explosives, locks, drones, vehicles and helicopters | Repairing, using explosives |

**Rules (draft)**

- New soldiers roll a profile within their price tier.
- Skills improve through use, with diminishing returns: fast below 50, slow above 80 (draft: each use gives 1 xp; a skill point costs 5 xp below 50, 10 xp from 50 to 80 and 20 xp above 80).
- Physical attributes form a mostly fixed body profile: only rare service-record events (a serious wound, a long recovery, hard campaigning) move them (draft: ±1 to ±5 per event).
- Optional: unused skills slowly drift back toward a floor (draft: −1 per 14 days unused, never below the value the soldier was hired with).

**Derived values (draft, never stored)**

Each derived value drives one thing and comes from at most two attributes: a main one and a minor one. The Tactical Layer owns the formulas for action points, stamina, zone HP, reaction chance and night sight; this table only names the attributes they use.

| Derived value | Main | Minor | Rule (draft) |
| --- | --- | --- | --- |
| Action points | Agility | — | 25 + Agility ÷ 10, rounded down (25–35). All AP costs are whole numbers; walking costs 2 AP per tile |
| Stamina pool | Endurance | — | 2 + Endurance ÷ 20, rounded down (2–7 stamina points) |
| HP per zone | Endurance | — | Base HP × (0.5 + 0.75 × Endurance / 100) (see Body zones) |
| Carry capacity | Strength | Endurance | 15 + 0.3 × Strength + 0.1 × Endurance kg (draft; 15–55 kg) |
| Shooter spread | Marksmanship | Perception (at range) | Feeds the hit model's spread cone |
| Recoil control | Marksmanship | Strength | Lowers the spread each follow-up round adds |
| Reload and weapon swap cost | Marksmanship | Agility | Reload: Marksmanship and weapon ergonomics; swap: Agility and weapon weight (see Tactical actions) |
| Spotting and sight range | Perception | Recon | Night: a third of the day range without a flashlight |
| Reaction chance | Perception (reactor) | Agility (mover) | 50 + (reactor's Perception − mover's Agility) / 2, limited to 10–90% (see Turn structure) |
| Noise and concealment | Recon | Agility | How far away enemies notice the soldier |
| Treatment speed and effect | Medical | — | See Medical system |
| Repairs, explosives, piloting | Technical | — | Piloting a helicopter needs Technical 50+ |

**Nerve (from the service record, not rolled):** grows with deployments survived and fights under fire. It lowers the effect of suppression and how much casualties shake the soldier's morale (not implemented in the first build iterations; draft: the suppression spread penalty and each casualty's morale loss are multiplied by 1 − Nerve ÷ 200, so Nerve 100 halves both), so veterans hold up because of what they have lived through. Nerve runs from 0 to 100, starting at 0 (draft: +2 per deployment survived, +1 per fight under fire). Leadership is not a perk unlocked by Nerve; it comes from rank only.

**Perks (draft):** one per skill at 50 and one at 80.

| Skill | Perk at 50 (draft) | Perk at 80 (draft) |
| --- | --- | --- |
| Marksmanship | Steady aim: shooter spread ×0.9 on shots with at least one aim step | Snap shooter: snap-shot penalty +1.5 MoA instead of +3 |
| Recon | Quiet step: enemies notice the soldier at 20% shorter distance | Ghost: reaction chance against the soldier −10 while crouched or prone |
| Medical | Field medic: medical items cost 1 AP less (never below 1) | Trauma surgeon: IFAK and medkit restore 25% more HP; the soldier's patients heal 25% faster at the FOB |
| Technical | Armourer: the soldier's weapons wear 25% slower, and the soldier's repairs restore 25% more condition | Sapper: bolt cutters take 5 AP instead of 10; field repairs of vehicles restore 25% more condition |

## Gear, loot & return

The Tarkov layer: what you carry in is at risk, what you carry out pays for the war.

- **Inventory:** simple item lists, no grids. Every container (vest, belt, backpack, vehicle storage) holds any items up to its weight limit. Weight carried affects AP and stamina.
- **Weapon modding:** modular weapons (muzzle, stock, grips, handguard, optics, magazines) changing accuracy, ergonomics, recoil, how far shots are heard, and AP cost. Mods can be fitted or removed anywhere outside battle; no skill is needed.
- **Loot:** weapons, armour, intel documents, valuables, medical supplies and quest items. Rarer loot sits in more dangerous spots.
- **Return to an FOB:** an op ends only when the squad is back at an FOB. Each tactical map has 2–4 exits with conditions (vehicle needs fuel, a boat leaves at a set turn, a paid crossing): every exit the strategic layer knows of is placed, and map generation adds plain exits up to that count; and the route home crosses the strategic map, where the squad can still be intercepted. Soldiers who don't make it back are MIA, captured or dead: the Strategic layer rolls their fate from who holds the battle tile, and MIA soldiers may return later.
- **Risk control:** insurance (chance to recover lost gear; draft: costs 10% of the insured gear's value per op, and each insured item lost comes back with 50% chance after 3 days) and loadout presets.
- **Traders:** faction-linked traders with loyalty levels unlocking better stock; Krug markets with fluctuating but publicly posted prices (draft: each price moves once per day by up to ±10%, never more than ±30% from its base). Each Krug market has its own stock and its own prices, moved independently, so buying in one market and selling in another can pay (draft stock: a seeded share of the Krug's item list, rolled once per market at campaign start: 60% of the items in a city market, 40% in a small town market; better items in that stock unlock only at Krug standing 20+).

**Design risk:** losing gear must sting without causing a death spiral — always offer a cheap "scav" loadout and low-risk contracts to rebuild (draft: the scav loadout is a used AK-74M with 2 magazines, a tourniquet and no armour, for $500; a low-risk contract is a Retrieve and deliver items mission away from the front, against no faction; Strategic makes sure some faction always keeps at least one posted).

## Contracts and missions (draft)

**Draft — not final.** Contracts are not random: every contract comes from a goal a faction is actually pursuing on the map. A contract holds one or more **missions**; the player bundles missions from one or several contracts into an operation.

**Where contracts come from**

- When a faction sets a goal it cannot cover with its own squads — or one it wants to keep deniable — it posts a contract for that goal.
- Factions with intel on a rival's goal may post a **counter-contract** against it, so the player can be offered both sides of the same job.
- World events and desperate measures add contracts of their own (a weapon shipment to escort or intercept, a strike on a VIP, a defector to bring in).
- Varyag and Aegis compete for the same mission on some of the player's contracts (see Squads and simulation).
- Contracts appear at the FOB, in cities and — for Krug work — at Krug markets, filtered by the player's reputation with the employer. Varyag and Aegis can take offers from their own side and compete with the player: a rival taking an offer removes it from the player's board; only a contract the player has signed can become a race. If a rival completes a mission first, the player's mission fails with no pay and no reputation loss. The Krug never takes other factions' contracts; it offers escort work for its own convoys, and the player or a faction can pay a Krug squad to escort a shipment (hired at a Krug market before the shipment leaves; price by distance and danger, see the Strategic Layer).

| Faction goal | Missions it generates |
| --- | --- |
| Supply run | Retrieve and deliver items; escort a shipment |
| Attack a point of interest | Capture a territory; assassinate a VIP (the defending commander) |
| Defend or hold a point of interest | Help defend a territory; escort a shipment (reinforcements, ammunition); capture a territory (retake) |
| Escort | Escort a VIP; escort a shipment |
| Hunt | Capture a VIP; assassinate a VIP |
| Trade route (Krug) | Retrieve and deliver items; escort a shipment |
| Intel needs (any faction; creates offers on its own, with no squad goal behind them) | Retrieve and deliver items (documents, captured equipment) |

**Mission types**

| Mission | Objective | How it plays | Success | Failure |
| --- | --- | --- | --- | --- |
| Retrieve and deliver items | Collect items at a location (a cache, a crash site, a depot, another faction's stash) and bring them to a destination | The items take storage weight; the location may be guarded or contested | Items handed over at the destination before the deadline | Items lost, sold elsewhere or late |
| Escort a shipment | Protect a faction convoy along its route | The convoy moves with the player's squad on the strategic map; encounters on the way become tactical fights with the convoy's vehicles to protect | Convoy arrives with most of its cargo (draft: 60% or more by weight) | Convoy destroyed or captured |
| Escort a VIP | Bring a person (officer, official, Krug courier, journalist) safely to a destination | The VIP takes a seat in the vehicle and joins tactical fights as a lightly armed allied unit, controlled by the tactical AI by default; player control is a switchable option for testing, set in the tactical map request: the player then moves the VIP, which never reacts | VIP arrives alive | VIP killed or captured |
| Capture a VIP | Take a person alive and hand them to the employer | Find the target (intel helps), defeat or scatter the guards, then restrain the VIP once they surrender or are wounded; the VIP takes a seat until handed over | VIP delivered alive | VIP killed, escapes or is rescued |
| Assassinate a VIP | Kill a person, usually guarded and on the move | Track the target's squad on the map and choose where to strike; proof comes from a soldier witnessing the kill or taking an item from the body | VIP confirmed dead | VIP survives the deadline |
| Capture a territory | Take a point of interest or region from its current controller | Clear the defenders in a tactical fight, then hold the position for a number of hours (draft: 6) until the employer's squad takes over | Control passes to the employer | Position lost before the handover |
| Help defend a territory | Reinforce a faction's point of interest or region against an expected attack | Reach the position before the attackers do (intel gives the warning); the fight is a tactical defence alongside the faction's own soldiers, who are allied units under AI control | The position is still held when the attackers are beaten or retreat | The position falls |

**Contract terms**

- **Employer, mission(s), targets and locations, deadline** (in hours).
- **Pay:** an advance (draft 25%) on signing; the rest is paid per mission, each mission paying its share when its goal is met. Shares are in proportion to each mission's pay; the rounding difference goes to the last mission. Pay scales with distance, danger and how much the employer wants it (draft: band low + (high − low) × the average of the three, each scored 0–1).
- **Reputation:** gain with the employer on success; loss with the target faction whenever it learns who did it.
- **Intel level:** how much the contract reveals — exact location, last known position, or rumours only.
- **Deniability:** some employers (often the VDK) may disown a contract that goes wrong; the reputation hit then falls on the player alone. A disowned contract is still paid but gives no reputation gains; reputation losses for failed missions or a broken contract still apply, and the employer never admits the link. The disown roll is made once per contract, when it first goes wrong (draft chance: VDK 30%, other employers 10%).
- **Failure:** a failed mission loses only its share and its reputation, and the contract goes on. A failed contract: no further pay, and each mission still open at the deadline fails and costs the normal Mission failed reputation loss with the employer; the advance is kept and nothing is owed. A contract fails when its deadline passes with missions still open, or when every mission has failed.

**Pay bands (draft)**

| Mission | Pay |
| --- | --- |
| Retrieve and deliver items | $3,000–8,000 |
| Escort a shipment | $6,000–12,000 |
| Escort a VIP | $8,000–15,000 |
| Assassinate a VIP | $10,000–20,000 |
| Capture a VIP | $12,000–25,000 |
| Capture a territory | $15,000–30,000 |
| Help defend a territory | $8,000–18,000 |

## Reputation (draft)

**Draft — not final.** Every faction holds one reputation value toward the player's PMC, from −100 to 100, starting at 0. It moves with two things: how the player handles contracts and what the player does to the faction. For now an act changes reputation only with the faction it affects directly; there is no spill-over to that faction's allies or enemies.

**Standing**

| Reputation | Standing | Effect |
| --- | --- | --- |
| ≤ −50 | Hostile | No contracts or trade; attacks on sight; may put a bounty on the PMC |
| −49 to −20 | Unfriendly | Only a share of its contract offers (draft: 50%) and marked-up prices (draft: +25%); its traders sell basic stock only; hostile when competing for the same objective |
| −19 to 19 | Neutral | Basic trade and contracts |
| 20 to 49 | Friendly | Military gear, better contracts |
| ≥ 50 | Trusted | Armoured vehicles, helicopters, best stock, sensitive contracts |

**What changes reputation**

| Category | Act | Change with that faction |
| --- | --- | --- |
| Contracts | Mission completed | +5 to +15 per mission completed, by pay band (draft: +5 under $8,000, +10 from $8,000 to $15,000, +15 above) |
| Contracts | Mission failed | −5 |
| Contracts | Contract broken: cargo kept or sold, VIP handed to someone else, employer betrayed | −30 |
| Friendly acts | Join a fight on its side without a contract | +5 |
| Friendly acts | Rescue its soldiers or VIP, return its MIA or captured soldiers | +10 |
| Friendly acts | Sell it supplies it needs (fuel, ammunition, medical) | +1 to +3 (draft: +1 per $1,000 of needed supplies sold, at most +3 per sale) |
| Friendly acts | Krug: keep a deal | +5 |
| Hostile acts | Attack one of its squads that was not hostile to the player | −30 |
| Hostile acts | Kill its soldiers | −2 each, at most −20 per fight |
| Hostile acts | Destroy or steal its cargo | −10 |
| Hostile acts | Capture or assassinate one of its VIPs | −20 / −30 |
| Hostile acts | Take one of its regions | −15 |
| Hostile acts | Krug: break a deal or fight in a Krug market | −50 |
| Hostile acts | War crimes (killing civilians or prisoners) | −20 with every faction; civilian loyalty collapses in the region |

**Attribution**

- An act only counts if someone from the affected faction survives it; a war crime is the exception: one surviving witness of any faction attributes it to every faction. Any survivor of the fight is a witness; sight is not needed. A fight or attack with no surviving witnesses stays unattributed — unless an Operation dispute event assigns the blame.
- Reputation does not drift back on its own; it only changes through new acts.

**Reputation in the event system**

Reputation is an input to world events, desperate measures and faction goals. How each event and desperate measure uses reputation is listed in [World events](https://claude.ai/artifact/HJG62N9ZiB6SxKSSrHi67E).

## Base & meta progression

The PMC's progress is what it owns, not what it builds. FOBs have no upgrades and nothing is crafted: every weapon, item, vehicle and service is **looted**, **purchased**, or produced by **industry the PMC controls**.

- **FOBs:** every operation starts and ends at one. An FOB offers a stash of its own (items move between FOBs only by squad transport), rest and slow healing, hiring and contracts. The first is given at the start; more are bought in small and large cities or taken over, and each new FOB extends operational range. FOBs have no upkeep: they cost only their purchase price.
- **Looting:** tactical fights, bodies, containers and crash sites (see Gear, loot & return and the item list).
- **Purchasing:** faction traders and Krug markets for gear and vehicles; paid services in the field — hospital treatment in cities (draft: $300 per wound), repairs of vehicles and weapons at mechanical plants (draft: $20 per condition point; a weapon comes back at Condition 100), fuel at gas stations and oil plants (draft: $50 per unit). Vehicles have no upkeep: besides the purchase price they cost only fuel and repairs.
- **Controlling industry:** a plant the PMC takes and holds (a squad stationed there) delivers its output to the nearest FOB every day — oil plants fuel, mechanical plants spare parts and vehicle repairs, chemical plants medical supplies, arms plants weapons and ammunition, mineral plants medium income plus a boost to the output of every other plant the PMC holds (draft daily output: oil 20 fuel units, mechanical 10 kg spare parts, chemical 5 medical kits, arms 2 weapons and 300 rounds, minerals $1,500 and +10% per mineral plant, at most +30%); hidden-city complexes (optional) prototype items. The PMC gets only this daily output from a plant, no plant income on top. A plant left unguarded falls back to the region's controller.
- **Base threat:** (OPTIONAL — later build) FOBs can be raided by the enemy late game — a defence mission, XCOM base-assault style.
- **Campaign end states:** see Factions & campaign in the GDD (Veligrad united, reformed, locked into endless proxy war or seized in a coup; or cash out and leave). Score based on money, reputation and surviving soldiers (draft: funds ÷ 1,000 + the sum of reputation above 0 with every faction + 50 per surviving soldier).

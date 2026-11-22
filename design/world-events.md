# Untitled Tactical RPG – World events

Nov 22, 2026 · @Dan

**Draft — not final.** The lists of world events, crisis signs and desperate measures. How the event system works is described under World events in the Strategic Layer of the [Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo); flavour events are in Story & Lore.

## Events

| Event | Trigger | Effect | Duration | Player hooks |
| --- | --- | --- | --- | --- |
| PMC joint assault | A high-value point of interest (oil or arms plant, a Krug hub) is weakly held and both rival PMCs are idle | Varyag and Aegis put their rivalry aside and attack it together with their strongest squads | Until the assault ends | Contracts to defend the target or to join the assault; the PMCs' relation drops sharply afterwards |
| Weapon shipment | A faction has lost ground for several days | Its influence sends a large shipment: a higher share of elite soldiers and better gear in its new squads | 10 days | Intercept the convoy for loot and a big reputation loss with that faction; or escort it |
| Rising hostility | A faction suffers repeated losses against one other faction | Its relation toward that faction drops; it shifts squads to attack it and hunts anyone working for it | Until relations recover | Contracts against the target; working for the target becomes riskier |
| Operation dispute | A player op (or any fight) kills soldiers of an uninvolved faction, or hits a Krug convoy in crossfire | The hurt faction blames another — or the player — and relations collapse between them; the Krug may suspend trade with both sides | 7–14 days | Pay compensation, hand over evidence (documents) to redirect the blame, or exploit the feud |
| Front offensive | The SSV or the VDK has a strength advantage along part of the front | Squads concentrate and push; points of interest change hands quickly | 5–10 days | Many contracts on both sides; dangerous roads near the front |
| Local ceasefire | Heavy losses on both sides in one area | No fighting between the SSV and the VDK in those regions | 7 days | Breaking it costs heavy reputation with both; safe travel through the area |
| Defection | A garrison of a losing faction has low supply | It changes sides, taking its point of interest with it | Instant | Contracts to secure or punish the defectors |
| Fuel shortage | An oil plant is destroyed or cut off | Fuel prices ×2; faction squads move less | Until supply is restored | Fuel runs pay well; jerrycans become valuable loot |
| Chemical leak | A chemical plant is fought over | Its region and neighbours become hazardous; medical prices rise | 5 days | Medical supply contracts; risky shortcut through the zone |
| Bounty on the PMC | The player's reputation with a faction falls to −50 or lower | That faction offers a bounty: extra hunt squads, rival PMCs join in | Until reputation recovers or the bounty is paid off | Lie low, pay off the debt, or fight it out |
| Refugee movement | A city changes hands | Civilians flee to neighbouring regions: loyalty shifts, cheap local recruits appear | 10 days | Escort and supply contracts; a recruiting chance |
| Rogue PMC (rare) | See Coups in the GDD | Varyag or Aegis turns on its patron | Campaign | See Coups |
| Resistance group forms | Civilian loyalty toward the controlling faction is low in a region (draft: ≤ −40), usually after heavy fighting, a city changing hands or harsh occupation | A small militia or guerrilla group (1–3 squads of 3–5 poorly equipped locals) forms in that region, usually inside territory held by the faction it opposes. When it forms it picks its stance toward every faction: hostile to the controller, and allied with, neutral to or hostile toward the others — some side with the controller's enemy, some trust no one. It ambushes patrols and supply runs and stirs up nearby regions | Until destroyed, disbanded (loyalty recovers) or absorbed by an allied faction | Supply or fight alongside it for standing with its allies; hunt it for the controller; recruit cheap locals from it. It may ambush the player if the player works for the faction it opposes |

## Desperate measures

**Crisis signs** (checked once per day for each faction)

| Crisis sign | Met when (draft) |
| --- | --- |
| Little territory | The faction holds less than 30% of the regions it held at the start |
| Large area losses | It lost 15% or more of its regions in the last 7 days |
| Large troop losses | It lost 30% or more of its soldiers in the last 7 days |
| Resistance in its territory | Two or more resistance groups are active in regions it holds |
| Low liquidity | Its income cannot cover salaries and contract payments; contracts go unpaid |
| Capital threatened | Enemy squads within 2 regions of its capital or, if the capital is lost, its last city |
| Key plants lost | It holds fewer than half of the oil and arms plants it held at the start |
| Isolation | Three or more factions are hostile to it (relations ≤ −50) |
| Its PMC has gone rogue | Varyag (for the SSV) or Aegis (for the VDK) has turned on it |
| Repeated defeats by the player | The player's PMC beat its squads in 3 or more fights in the last 7 days |

**Measures**

| Measure | Who | Typical signs | Effect | Player hooks |
| --- | --- | --- | --- | --- |
| Forced conscription | SSV, VDK | Troop losses, area losses | Sweeps held towns for recruits: many new, poorly trained and poorly equipped squads; civilian loyalty drops, resistance groups become more likely | Escort or block draft convoys; cheap deserters for hire |
| Penal battalions | SSV | Troop losses | Prisoners released into expendable assault squads, thrown at the front | Unpredictable enemies; some desert to the Krug |
| Open call for help | VDK | Little territory, key plants lost, its PMC gone rogue | Asks the western influence for open support: more Aegis squads and better gear, but the VDK loses legitimacy and civilian loyalty | Contracts surge; Aegis grows stronger and bolder |
| Paying any price | SSV, VDK, Krug | Troop losses or repeated defeats by the player, while money is still available | Contract pay doubles; the faction even hires PMCs it has fought | Big money from a former enemy, at a reputation cost elsewhere |
| Scorched earth | SSV, VDK | Area losses | Plants, bridges and roads in regions about to be lost are destroyed | Lost income and routes for everyone; contracts to stop or carry out demolitions |
| Mining the roads | SSV, VDK | Area losses | Minefields on roads and approaches in threatened regions | Hazards on the strategic map; Technical soldiers clear them |
| Martial law | SSV, VDK | Resistance in its territory, capital threatened | Curfews and checkpoints in all held cities; trade restricted, civilians searched | Harder movement and trade; smuggling contracts with the Krug |
| Seizing Krug stocks | SSV, VDK | Low liquidity | Raids Krug markets for fuel and ammunition | The Krug turns hostile to that faction; contracts to defend or loot the markets |
| VIP strike | SSV, VDK | Little territory, isolation | Sends a team to kill a high-ranking officer of the opposing faction (see VIPs in the GDD). The death hits that faction's best troops hardest | Contracts to protect the VIP or carry out the strike; intel on the target's location is part of the contract |
| Nuclear strike | SSV, VDK | Five or more signs, one of them Capital threatened | See Nuclear strike below | See below |

## Nuclear strike (rare)

Both the SSV and the VDK hold a few tactical warheads (background in Story & Lore). Using one is the last measure of a faction facing defeat.

- **Trigger:** five or more crisis signs, one of them Capital threatened, and its patron does not stop it. At most once per campaign.
- **Warning signs:** several days ahead — a special convoy moving under heavy escort, air defence massing, Krug rumours of evacuations among officers' families, radio silence on command channels.
- **Effect:** the target region (usually an enemy-held city or a major troop concentration) is destroyed: every unit there is lost and its point of interest is ruined for the rest of the campaign. That region and its neighbours become a contaminated zone: soldiers lose HP every turn they spend there, and loot cannot be sold.
- **Aftermath:** every other faction turns hostile toward the striking faction; its patron may cut support; civilian loyalty collapses and refugees flood neighbouring regions. The war's balance changes for good.
- **Player hooks:** find the convoy through intel and intercept or sabotage it to prevent the strike; warn the target faction; or escort it for a huge price and lasting hostility from everyone else.

## Reputation in the event system

| Event or system | How reputation counts |
| --- | --- |
| Bounty on the PMC | Fires when reputation with a faction is ≤ −50; its chance doubles at −75 or lower |
| Hunt goals and Rising hostility | A faction at Unfriendly or worse may set hunt goals against the player; at −30 and falling, Rising hostility can target the player directly |
| Operation dispute | When blame is assigned, the faction with the lowest standing toward the player is the most likely to blame the PMC |
| Resistance group forms | The group starts hostile to the player if the player is Friendly or better with the faction it opposes, and friendly if the player is Hostile to it |
| PMC joint assault | Varyag and Aegis may invite the player if the player is Friendly or better with both |
| Weapon shipment, defection | Escort and handover contracts go only to players Friendly or better with the faction involved |
| Paying any price | The desperate faction offers doubled pay even to a PMC that fought it, as long as reputation is above −50 |
| VIP strike, nuclear strike | Contracts to carry out or escort these go only to Trusted players; refusing costs −5 |
| Rogue PMC | A rogue Varyag or Aegis approaches the player as an ally if reputation with it is Trusted |
| Crisis sign: repeated defeats by the player | Counts only fights the faction attributes to the player |

# Spec index

Maps every spec ID to the module or tool that implements it and to its design source. Maintained by
`/update-spec` only.

IDs are `[AREA-NNN]`, never reused or renumbered; a removed rule keeps its ID, marked `(removed)`.

Design baseline: 8972470 (update, 2026-11-22; previous 9c7498b)

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

378 IDs (first split 2026-11-22, updated from design 8972470). Status in brackets: `open` = the design leaves a value or rule unset, `optional` = left out of the first build iterations, `removed` = rule dropped from the design (ID kept).

| ID | Title | Implemented by | Design source |
| --- | --- | --- | --- |
| [GEN-001] | Operation as unit of play | all modules | design/design.md › Overview › Core loop |
| [GEN-002] | Op success condition | all modules | design/design.md › Overview › Core loop; › Management › Gear, loot & return |
| [GEN-003] | Op objectives and bundling | all modules | design/design.md › Overview › Core loop |
| [GEN-004] | Faction roster | all modules | design/design.md › Factions & campaign › Factions |
| [GEN-005] | Off-map influences | all modules | design/design.md › Factions & campaign › Factions |
| [GEN-006] | Civilian population | all modules | design/design.md › Factions & campaign › Factions |
| [GEN-007] | Faction relations model | all modules | design/design.md › Strategic layer › World events; › Management › Reputation (draft) |
| [GEN-008] | Leader effects (open) | all modules | design/design.md › Factions & campaign › Leaders |
| [GEN-009] | Krug markets as no-fire zones | all modules | design/design.md › Factions & campaign › The Krug |
| [GEN-010] | Krug standing unlocks (open) | all modules | design/design.md › Factions & campaign › The Krug |
| [GEN-011] | Player allegiance (open) | all modules | design/design.md › Factions & campaign › Player role |
| [GEN-012] | Campaign end states (open) | all modules | design/design.md › Factions & campaign › Player role; › Management › Base & meta progression |
| [GEN-013] | Player coup requirements (open) | all modules | design/design.md › Factions & campaign › Coups |
| [GEN-014] | Coup final operation | all modules | design/design.md › Factions & campaign › Coups |
| [GEN-015] | Holding the capital (open) | all modules | design/design.md › Factions & campaign › Coups |
| [GEN-016] | Coup epilogue | all modules | design/design.md › Factions & campaign › Coups |
| [GEN-017] | Rogue PMC chance (open) | all modules | design/design.md › Factions & campaign › Coups › Rogue PMCs |
| [GEN-018] | Rogue PMC warning signs and aftermath | all modules | design/design.md › Factions & campaign › Coups › Rogue PMCs |
| [STR-001] | Strategic clock | modules/strategic | design/design.md › Strategic Layer (Time) |
| [STR-002] | Action duration | modules/strategic | design/design.md › Strategic Layer (Time); › Squads and simulation (Strategic turn); design/strategic-actions.md (intro) |
| [STR-003] | Hour tick (open) | modules/strategic | design/design.md › Strategic Layer (Time); › Squads and simulation (Strategic turn); › AI › Strategic AI (Controller hand-off) |
| [STR-004] | Daily checks at 00:00 | modules/strategic | design/design.md › Strategic Layer (Time); design/strategic-actions.md › Trade; design/design.md › Management › Base & meta progression |
| [STR-005] | Region graph | modules/strategic | design/design.md › Strategic Layer › Map (draft) |
| [STR-006] | Terrain movement costs | modules/strategic | design/design.md › Strategic Layer › Map (draft) › Terrain types; design/strategic-actions.md › Movement and operations |
| [STR-007] | Capital control | modules/strategic | design/design.md › Strategic Layer › Map (draft) |
| [STR-008] | Fog of war and detection (open) | modules/strategic | design/design.md › Strategic Layer › Map (draft) (Fog of war); › Strategic Layer (Intel); › Vehicles (Noise) |
| [STR-009] | Civilian loyalty (open) | modules/strategic | design/design.md › Factions & campaign › Factions; › Strategic Layer › Map (draft) |
| [STR-010] | Points of interest | modules/strategic | design/design.md › Strategic Layer › Map (draft) › Points of interest |
| [STR-011] | Mineral plant modifier (open) | modules/strategic | design/design.md › Strategic Layer › Map (draft) › Points of interest; › Management › Base & meta progression |
| [STR-012] | Krug markets as no-fire zones | modules/strategic | design/design.md › Factions & campaign › The Krug (refer to GEN for the Code) |
| [STR-013] | Hidden cities (optional) | modules/strategic | design/design.md › Strategic Layer › Map (draft) › Hidden cities |
| [STR-014] | Control of a point of interest (open) | modules/strategic | design/design.md › Strategic Layer › Squads and simulation (Control) |
| [STR-015] | Stationed squad and plant output (open) | modules/strategic | design/strategic-actions.md › Movement and operations; design/design.md › Management › Base & meta progression |
| [STR-016] | FOBs on the map | modules/strategic | design/design.md › Management › Base & meta progression; › Core loop |
| [STR-017] | Squads | modules/strategic | design/design.md › Strategic Layer › Squads and simulation (draft); › Vehicles (draft) |
| [STR-018] | Squad goals | modules/strategic | design/design.md › Strategic Layer › Squads and simulation (Goals); › Management › Contracts and missions |
| [STR-019] | Escalation (open) | modules/strategic | design/design.md › Strategic Layer (Escalation) |
| [STR-020] | One action per faction per hour | modules/strategic | design/design.md › Overview › Pillars (4); › Strategic Layer (Time); › Squads and simulation (Strategic turn) |
| [STR-021] | Faction controller hand-off | modules/strategic | design/design.md › AI (intro); › AI › Strategic AI (Controller hand-off); › Strategic Layer › Squads and simulation (Faction funds) |
| [STR-022] | Encounter detection | modules/strategic | design/design.md › Strategic Layer › Squads and simulation (Encounters); › AI › Strategic AI |
| [STR-023] | Tactical engagement | modules/strategic | design/design.md › Strategic Layer (Time); › Squads and simulation (Encounters); design/strategic-actions.md › Movement and operations |
| [STR-024] | Evade an encounter (open) | modules/strategic | design/design.md › Strategic Layer › Squads and simulation (Encounters); design/strategic-actions.md › Movement and operations |
| [STR-025] | Pay your way through (Krug) (open) | modules/strategic | design/design.md › Strategic Layer › Squads and simulation (Encounters); design/strategic-actions.md › Movement and operations |
| [STR-026] | Off-screen fights (open) | modules/strategic | design/design.md › Strategic Layer › Squads and simulation (Off-screen fights) |
| [STR-092] | Faction funds (open) | modules/strategic | design/design.md › Strategic Layer › Squads and simulation (Faction funds (draft)); design/design.md (module table: `world` includes funds) |
| [STR-093] | Contract payment between modules | modules/strategic | design/design.md › Strategic Layer › Squads and simulation (Faction funds (draft)); › Management › Contracts and missions › Contract terms |
| [STR-027] | Operation lifecycle | modules/strategic | design/design.md › Overview › Core loop; › Management › Gear, loot & return |
| [STR-028] | Launch an op (open) | modules/strategic | design/strategic-actions.md › Movement and operations |
| [STR-029] | Return to an FOB | modules/strategic | design/strategic-actions.md › Movement and operations |
| [STR-030] | Lost vehicle (open) | modules/strategic | design/design.md › Vehicles (draft) (Loss) |
| [STR-031] | Move one region on foot | modules/strategic | design/strategic-actions.md › Movement and operations |
| [STR-032] | Move one region by ground vehicle (open) | modules/strategic | design/strategic-actions.md › Movement and operations; design/design.md › Vehicles (draft) |
| [STR-033] | Vehicle visibility at checkpoints (open) | modules/strategic | design/design.md › Vehicles (draft) (Profile) |
| [STR-034] | Fly one region by helicopter (open) | modules/strategic | design/strategic-actions.md › Movement and operations; design/design.md › Vehicles (draft) › Helicopters |
| [STR-035] | Land a helicopter (open) | modules/strategic | design/strategic-actions.md › Movement and operations; design/design.md › Vehicles (draft) › Helicopters |
| [STR-036] | Scout (open) | modules/strategic | design/design.md › Strategic Layer (Time); design/strategic-actions.md › Movement and operations |
| [STR-037] | Wait and rest | modules/strategic | design/design.md › Strategic Layer (Time); › Squads and simulation (Strategic turn); design/strategic-actions.md › Movement and operations |
| [STR-038] | Enter a point of interest (open) | modules/strategic | design/strategic-actions.md › Movement and operations |
| [STR-039] | Zero-time trade actions | modules/strategic | design/strategic-actions.md › Trade, services, contracts and factions; design/design.md › Strategic Layer (Time) |
| [STR-040] | Contract actions (open) | modules/strategic | design/strategic-actions.md › Trade, services, contracts and factions |
| [STR-041] | Paid services (open) | modules/strategic | design/strategic-actions.md › Trade, services, contracts and factions; design/design.md › Vehicles (draft) › Helicopters |
| [STR-042] | Acquire an FOB (open) | modules/strategic | design/strategic-actions.md › Trade, services, contracts and factions; design/design.md › Management › Base & meta progression |
| [STR-043] | Payments to factions (open) | modules/strategic | design/strategic-actions.md › Trade, services, contracts and factions |
| [STR-044] | Contract postings from goals | modules/strategic | design/design.md › Management › Contracts and missions; › AI › Strategic AI |
| [STR-045] | VIP entity | modules/strategic | design/design.md › Strategic Layer › VIPs |
| [STR-046] | VIP guard | modules/strategic | design/design.md › Strategic Layer › VIPs |
| [STR-047] | VIP death morale shock | modules/strategic | design/design.md › Strategic Layer › VIPs |
| [STR-048] | VIP intel | modules/strategic | design/design.md › Strategic Layer › VIPs; design/strategic-actions.md › Trade, services, contracts and factions |
| [STR-049] | Faction leader death (open) | modules/strategic | design/design.md › Strategic Layer › VIPs |
| [STR-050] | Event check (open) | modules/strategic | design/design.md › Strategic Layer › World events (How events work) |
| [STR-051] | Faction relations | modules/strategic | design/design.md › Strategic Layer › World events; › Management › Reputation (draft) |
| [STR-052] | Warning signs (open) | modules/strategic | design/design.md › Strategic Layer › World events (Warning signs) |
| [STR-053] | Player influence on events | modules/strategic | design/design.md › Strategic Layer › World events (Player influence) |
| [STR-054] | News feed | modules/strategic | design/design.md › Strategic Layer › World events (News feed) |
| [STR-055] | Event: PMC joint assault (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-056] | Event: Weapon shipment (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-057] | Event: Rising hostility (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-058] | Event: Operation dispute (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-059] | Event: Front offensive (open) | modules/strategic | design/world-events.md › Events |
| [STR-060] | Event: Local ceasefire (open) | modules/strategic | design/world-events.md › Events |
| [STR-061] | Event: Defection (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-062] | Event: Fuel shortage (open) | modules/strategic | design/world-events.md › Events |
| [STR-063] | Event: Chemical leak (open) | modules/strategic | design/world-events.md › Events; design/design.md › Strategic Layer › Map (draft) › Points of interest |
| [STR-064] | Event: Bounty on the PMC (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-065] | Event: Refugee movement (open) | modules/strategic | design/world-events.md › Events |
| [STR-066] | Event: Rogue PMC | modules/strategic | design/world-events.md › Events; › Reputation in the event system; design/design.md › Factions & campaign › Coups |
| [STR-067] | Event: Resistance group forms | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-068] | Faction history | modules/strategic | design/world-events.md › Desperate measures (Crisis signs) |
| [STR-069] | Crisis signs | modules/strategic | design/world-events.md › Desperate measures (Crisis signs); › Reputation in the event system; design/design.md › Strategic Layer › Squads and simulation (Faction funds (draft)) |
| [STR-070] | Measure selection (open) | modules/strategic | design/design.md › Strategic Layer › World events (Desperate measures); design/world-events.md › Desperate measures |
| [STR-071] | Measure: Forced conscription (open) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-072] | Measure: Penal battalions (open) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-073] | Measure: Open call for help (open) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-074] | Measure: Paying any price (open) | modules/strategic | design/world-events.md › Desperate measures; › Reputation in the event system |
| [STR-075] | Measure: Scorched earth (open) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-076] | Measure: Mining the roads (open) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-077] | Measure: Martial law (open) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-078] | Measure: Seizing Krug stocks | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-079] | Measure: VIP strike | modules/strategic | design/world-events.md › Desperate measures; › Reputation in the event system |
| [STR-080] | Measure: Nuclear strike (open) | modules/strategic | design/world-events.md › Nuclear strike; › Reputation in the event system |
| [STR-081] | Flavour events (open) | modules/strategic | design/design.md › Strategic Layer › World events (Flavour events) |
| [STR-082] | Generation pipeline (open) | modules/strategic | design/design.md › Strategic Layer › Map generation (draft) |
| [STR-083] | Stage: land (open) | modules/strategic | design/design.md › Strategic Layer › Map generation (draft) (1) |
| [STR-084] | Stage: capital | modules/strategic | design/design.md › Strategic Layer › Map generation (draft) (2) |
| [STR-085] | Stage: cities (open) | modules/strategic | design/design.md › Strategic Layer › Map generation (draft) (3) |
| [STR-086] | Stage: industry (open) | modules/strategic | design/design.md › Strategic Layer › Map generation (draft) (4) |
| [STR-087] | Stage: towns and governmental institutions (open) | modules/strategic | design/design.md › Strategic Layer › Map generation (draft) (5) |
| [STR-088] | Stage: roads (open) | modules/strategic | design/design.md › Strategic Layer › Map generation (draft) (6) |
| [STR-089] | Stage: war state (open) | modules/strategic | design/design.md › Strategic Layer › Map generation (draft) (7) |
| [STR-090] | Stage: start (open) | modules/strategic | design/design.md › Strategic Layer › Map generation (draft) (8) |
| [STR-091] | Stage: validate (open) | modules/strategic | design/design.md › Strategic Layer › Map generation (draft) (Validation rules) |
| [TAC-001] | Two sides per map | modules/tactical | design/design.md › Tactical Layer › Turn structure; design/design.md › Tactical Layer (Enemy AI) |
| [TAC-002] | Turn-based from the start | modules/tactical | design/design.md › Tactical Layer (Turn structure bullet) |
| [TAC-003] | Battle duration and day/night | modules/tactical | design/design.md › Tactical Layer › Time of day |
| [TAC-004] | Night sight reduction (open) | modules/tactical | design/design.md › Tactical Layer › Time of day; design/design.md › Data definitions › Weapon profile (tactical modules) |
| [TAC-005] | Turn order and activation choice | modules/tactical | design/design.md › Tactical Layer › Turn structure › Turns and activation; design/tactical-actions.md › Turn and activation |
| [TAC-006] | Action points per activation | modules/tactical | design/design.md › Tactical Layer (Action points); design/design.md › Management › Soldier attributes › Derived values; design/tactical-actions.md › Turn and activation, AP modifiers on an activation |
| [TAC-007] | Set facing at end of activation | modules/tactical | design/design.md › Tactical Layer › Turn structure › Vision and facing; design/tactical-actions.md › Turn and activation |
| [TAC-008] | Activation stamina cost | modules/tactical | design/design.md › Tactical Layer › Turn structure › Stamina; design/tactical-actions.md › Turn and activation |
| [TAC-009] | Stamina maximum | modules/tactical | design/design.md › Tactical Layer › Turn structure › Stamina; design/design.md › Management › Soldier attributes › Derived values |
| [TAC-010] | Pass | modules/tactical | design/design.md › Tactical Layer › Turn structure › Turns and activation; design/tactical-actions.md › Turn and activation |
| [TAC-011] | Stamina recovery | modules/tactical | design/design.md › Tactical Layer › Turn structure › Turns and activation, Stamina |
| [TAC-012] | Exhaustion | modules/tactical | design/design.md › Tactical Layer › Turn structure › Stamina |
| [TAC-013] | Stall rule (open) | modules/tactical | design/design.md › Tactical Layer › Turn structure › Turns and activation |
| [TAC-014] | Durations in turns | modules/tactical | design/design.md › Tactical Layer › Turn structure › Turns and activation |
| [TAC-015] | Suppression | modules/tactical | design/design.md › Tactical Layer › Turn structure › Turns and activation; design/tactical-actions.md › AP modifiers on an activation; design/design.md › Management › Soldier attributes (Nerve) |
| [TAC-016] | Vision cone | modules/tactical | design/design.md › Tactical Layer › Turn structure › Vision and facing; design/design.md › Tactical Layer (Cover & visibility); design/item-list.md › Helmets |
| [TAC-017] | Turning during an activation | modules/tactical | design/design.md › Tactical Layer › Turn structure › Vision and facing; design/tactical-actions.md › Movement |
| [TAC-018] | Gunshot hearing range | modules/tactical | design/design.md › Tactical Layer › Turn structure › Gunshot noise; design/design.md › Tactical Layer › Derived per shot |
| [TAC-019] | Reacting to heard shots and noise (open) | modules/tactical | design/design.md › Tactical Layer › Turn structure › Vision and facing, Gunshot noise |
| [TAC-020] | Reaction trigger | modules/tactical | design/design.md › Tactical Layer › Turn structure › Reactions; design/tactical-actions.md › Turn and activation |
| [TAC-021] | Reaction setting | modules/tactical | design/design.md › Tactical Layer › Turn structure › Reactions; design/tactical-actions.md › Turn and activation |
| [TAC-022] | Reaction attempt cost and chance | modules/tactical | design/design.md › Tactical Layer › Turn structure › Reactions; design/tactical-actions.md › Turn and activation |
| [TAC-023] | Reaction resolution | modules/tactical | design/design.md › Tactical Layer › Turn structure › Reactions |
| [TAC-024] | Action cost composition | modules/tactical | design/design.md › Tactical Layer › Actions and costs; design/design.md › Management › Soldier attributes › Derived values; design/tactical-actions.md (intro: whole numbers, rounded down after any multiplier, never below 1 AP) |
| [TAC-025] | Stun (head hit) (open) | modules/tactical | design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/tactical-actions.md › AP modifiers on an activation |
| [TAC-026] | Pain AP loss (open) | modules/tactical | design/design.md › Tactical Layer › Medical system › Conditions; design/tactical-actions.md › AP modifiers on an activation |
| [TAC-027] | Over-encumbrance (open) | modules/tactical | design/design.md › Tactical Layer (Action points); design/tactical-actions.md › AP modifiers on an activation; design/design.md › Data definitions › Soldier equipment slots |
| [TAC-028] | Tactical grid | modules/tactical | design/design.md › Tactical Layer (Movement) |
| [TAC-029] | Walk one tile | modules/tactical | design/design.md › Tactical Layer (Movement); design/tactical-actions.md › Movement (Walk one tile, Leg wound surcharge); design/design.md › Tactical Layer › Medical system › Conditions |
| [TAC-030] | Move crouched | modules/tactical | design/design.md › Tactical Layer (Movement); design/tactical-actions.md › Movement |
| [TAC-031] | Crawl prone | modules/tactical | design/design.md › Tactical Layer (Movement); design/tactical-actions.md › Movement |
| [TAC-032] | Sprint | modules/tactical | design/tactical-actions.md › Movement; design/design.md › Tactical Layer › Medical system › Conditions; design/item-list.md › Backpacks |
| [TAC-033] | Change stance (open) | modules/tactical | design/design.md › Tactical Layer (Movement); design/tactical-actions.md › Movement; design/design.md › Management › Soldier attributes |
| [TAC-034] | Vault a window, climb a ladder | modules/tactical | design/design.md › Tactical Layer (Movement), Body zones and hitboxes › Stance; design/tactical-actions.md › Movement (Vault a window or low wall, Climb a ladder) |
| [TAC-035] | Cover per tile edge | modules/tactical | design/design.md › Tactical Layer (Movement, Cover & visibility), Body zones and hitboxes › Stance |
| [TAC-036] | Destruction recalculation | modules/tactical | design/design.md › Tactical Layer (Movement) |
| [TAC-037] | Path preview | modules/tactical | design/design.md › Tactical Layer (Movement) |
| [TAC-038] | Leave the map at an exit | modules/tactical | design/tactical-actions.md › Turn and activation; design/design.md › Management › Gear, loot & return |
| [TAC-039] | Fire | modules/tactical | design/tactical-actions.md › Weapons (Fire); design/design.md › Data definitions › Weapon profile |
| [TAC-040] | Aim longer | modules/tactical | design/design.md › Tactical Layer (Action points); design/tactical-actions.md › Weapons (Aim longer) |
| [TAC-041] | Reload | modules/tactical | design/tactical-actions.md › Weapons (Reload); design/design.md › Data definitions › Weapon profile, Soldier equipment slots |
| [TAC-042] | Swap weapon 1 and 2 | modules/tactical | design/tactical-actions.md › Weapons (Swap between weapon 1 and 2); design/design.md › Data definitions › Soldier equipment slots |
| [TAC-043] | Throw a grenade (open) | modules/tactical | design/tactical-actions.md › Weapons; design/design.md › Management › Soldier attributes |
| [TAC-044] | Total spread (open) | modules/tactical | design/design.md › Tactical Layer › Hit model; design/design.md › Data definitions › Weapon profile |
| [TAC-045] | Simulated shot trace | modules/tactical | design/design.md › Tactical Layer › Hit model; design/design.md › Data definitions › Calibre profile |
| [TAC-046] | Hit chance and shot preview | modules/tactical | design/design.md › Tactical Layer › Hit model; design/design.md › Tactical Layer (Readability) |
| [TAC-047] | Burst recoil (open) | modules/tactical | design/design.md › Tactical Layer › Hit model; design/design.md › Management › Soldier attributes › Derived values |
| [TAC-048] | Muzzle damage and falloff | modules/tactical | design/design.md › Tactical Layer › Derived per shot |
| [TAC-049] | Effective recoil | modules/tactical | design/design.md › Tactical Layer › Derived per shot |
| [TAC-050] | Penetration check | modules/tactical | design/design.md › Tactical Layer › Derived per shot; design/design.md › Data definitions › Soldier equipment slots |
| [TAC-051] | Blunt damage and armour wear (open) | modules/tactical | design/design.md › Tactical Layer › Derived per shot; design/design.md › Data definitions › Soldier equipment slots |
| [TAC-052] | Body zones and upright hitboxes | modules/tactical | design/design.md › Tactical Layer › Body zones and hitboxes |
| [TAC-053] | Aiming arm pose (open) | modules/tactical | design/design.md › Tactical Layer › Body zones and hitboxes |
| [TAC-054] | Crouched hitboxes | modules/tactical | design/design.md › Tactical Layer › Body zones and hitboxes › Stance |
| [TAC-055] | Prone hitboxes and limits | modules/tactical | design/design.md › Tactical Layer › Body zones and hitboxes › Stance |
| [TAC-056] | Cover occlusion | modules/tactical | design/design.md › Tactical Layer › Body zones and hitboxes › Stance |
| [TAC-057] | Zone HP | modules/tactical | design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone; design/design.md › Management › Soldier attributes › Derived values |
| [TAC-058] | Zone damage effects (open) | modules/tactical | design/design.md › Tactical Layer › Body zones and hitboxes › Health and effects per zone |
| [TAC-059] | Zone at 0 HP | modules/tactical | design/design.md › Tactical Layer › Body zones and hitboxes; design/design.md › Tactical Layer › Medical system › Conditions; design/design.md › Data definitions › Soldier equipment slots |
| [TAC-060] | Light bleeding | modules/tactical | design/design.md › Tactical Layer › Medical system › Conditions, Body zones and hitboxes |
| [TAC-061] | Heavy bleeding | modules/tactical | design/design.md › Tactical Layer › Medical system › Conditions |
| [TAC-062] | Fracture (open) | modules/tactical | design/design.md › Tactical Layer › Medical system › Conditions |
| [TAC-063] | Pain (open) | modules/tactical | design/design.md › Tactical Layer › Medical system › Conditions; design/item-list.md › Medical items |
| [TAC-064] | Medical item use permissions | modules/tactical | design/design.md › Tactical Layer › Medical system › Using medical items; design/tactical-actions.md › Medical |
| [TAC-065] | Medical AP cost | modules/tactical | design/design.md › Tactical Layer › Medical system › Using medical items; design/tactical-actions.md › Medical; design/item-list.md › Medical items |
| [TAC-066] | HP restored | modules/tactical | design/design.md › Tactical Layer › Medical system › Using medical items; design/item-list.md › Medical items |
| [TAC-067] | Medical item effects | modules/tactical | design/design.md › Tactical Layer › Medical system › Conditions; design/item-list.md › Medical items |
| [TAC-068] | Item access tiers (open) | modules/tactical | design/tactical-actions.md › Gear and interaction, Medical; design/design.md › Data definitions › Soldier equipment slots; design/item-list.md › Backpacks |
| [TAC-069] | Drop the backpack | modules/tactical | design/tactical-actions.md › Gear and interaction; design/design.md › Data definitions › Soldier equipment slots |
| [TAC-070] | Pick up or loot | modules/tactical | design/tactical-actions.md › Gear and interaction; design/design.md › Data definitions › Soldier equipment slots |
| [TAC-071] | Cut a lock | modules/tactical | design/tactical-actions.md › Gear and interaction |
| [TAC-072] | Place a demolition charge | modules/tactical | design/tactical-actions.md › Gear and interaction |
| [TAC-073] | Restrain a VIP | modules/tactical | design/tactical-actions.md › Gear and interaction |
| [TAC-074] | Carry or drag a wounded squadmate | modules/tactical | design/tactical-actions.md › Gear and interaction (Carry or drag a wounded squadmate) |
| [MGT-001] | Soldier record | modules/management | design/design.md › Management › Soldiers & progression |
| [MGT-002] | Hiring pools (open) | modules/management | design/design.md › Management › Soldiers & progression |
| [MGT-003] | Hire price (open) | modules/management | design/design.md › Management › Soldiers & progression |
| [MGT-004] | Player-chosen callsign and kit marks | modules/management | design/design.md › Management › Soldiers & progression |
| [MGT-005] | Salaries and renewals (open) | modules/management | design/design.md › Management › Soldiers & progression › Contracts & morale; › Strategic Layer › Squads and simulation (Faction funds (draft)) |
| [MGT-006] | Service record logging | modules/management | design/design.md › Management › Soldiers & progression › Service record |
| [MGT-007] | Dossier and after-action report | modules/management | design/design.md › Management › Soldiers & progression › Service record |
| [MGT-008] | Squad morale persistence | modules/management | design/design.md › Management › Soldiers & progression › Contracts & morale |
| [MGT-009] | Perks (open) | modules/management | design/design.md › Management › Soldiers & progression › Attributes |
| [MGT-010] | Persistent injuries | modules/management | design/design.md › Management › Soldiers & progression › Injuries |
| [MGT-011] | Death, MIA and capture | modules/management | design/design.md › Management › Soldiers & progression › Death; › Gear, loot & return |
| [MGT-012] | Memorial wall | modules/management | design/design.md › Management › Soldiers & progression › Memorial |
| [MGT-013] | Generation callsign: row and column | modules/management | design/callsigns.md › Generation callsigns |
| [MGT-014] | Generic callsigns | modules/management | design/callsigns.md › Generation callsigns |
| [MGT-015] | Callsign uniqueness and suffix | modules/management | design/callsigns.md › Generation callsigns; design/design.md › Management › Deeds and callsigns |
| [MGT-016] | Callsign assigned once | modules/management | design/callsigns.md › Generation callsigns; design/design.md › Management › Deeds and callsigns |
| [MGT-017] | Deed definitions (optional) | modules/management | design/callsigns.md › Earned callsigns |
| [MGT-018] | Deed logging (optional) | modules/management | design/design.md › Management › Deeds and callsigns |
| [MGT-019] | Earned callsign replacement (optional) | modules/management | design/design.md › Management › Soldiers & progression › Earned marks; › Deeds and callsigns |
| [MGT-020] | Fallen keep last callsign (optional) | modules/management | design/design.md › Management › Deeds and callsigns |
| [MGT-021] | Attribute set | modules/management | design/design.md › Management › Soldier attributes |
| [MGT-022] | Attribute generation (open) | modules/management | design/design.md › Management › Soldier attributes › Rules |
| [MGT-023] | Skill growth by use (open) | modules/management | design/design.md › Management › Soldier attributes › Rules |
| [MGT-024] | Physical attribute changes (open) | modules/management | design/design.md › Management › Soldier attributes › Rules |
| [MGT-025] | Skill drift (optional) | modules/management | design/design.md › Management › Soldier attributes › Rules |
| [MGT-026] | Action points | modules/management | design/design.md › Management › Soldier attributes › Derived values |
| [MGT-027] | Stamina pool | modules/management | design/design.md › Management › Soldier attributes › Derived values |
| [MGT-028] | HP per zone | modules/management | design/design.md › Management › Soldier attributes › Derived values |
| [MGT-029] | Carry capacity (open) | modules/management | design/design.md › Management › Soldier attributes › Derived values |
| [MGT-030] | Other derived values | modules/management | design/design.md › Management › Soldier attributes › Derived values |
| [MGT-031] | Nerve (open) | modules/management | design/design.md › Management › Soldier attributes › Nerve |
| [MGT-032] | Inventory model | modules/management | design/design.md › Management › Gear, loot & return |
| [MGT-033] | Carried weight effect (open) | modules/management | design/design.md › Management › Gear, loot & return |
| [MGT-034] | Weapon modding (open) | modules/management | design/design.md › Management › Gear, loot & return |
| [MGT-035] | Loot carried out | modules/management | design/design.md › Management › Gear, loot & return |
| [MGT-036] | Insurance (open) | modules/management | design/design.md › Management › Gear, loot & return › Risk control |
| [MGT-037] | Loadout presets | modules/management | design/design.md › Management › Gear, loot & return › Risk control |
| [MGT-038] | Scav loadout and rebuild floor (open) | modules/management | design/design.md › Management › Gear, loot & return › Design risk |
| [MGT-039] | Faction traders | modules/management | design/design.md › Management › Gear, loot & return › Traders; › Reputation › Standing |
| [MGT-040] | Krug market prices (open) | modules/management | design/design.md › Management › Gear, loot & return › Traders |
| [MGT-041] | Contract origin | modules/management | design/design.md › Management › Contracts and missions › Where contracts come from |
| [MGT-042] | Contract structure | modules/management | design/design.md › Management › Contracts and missions › Contract terms |
| [MGT-043] | Goal to mission mapping | modules/management | design/design.md › Management › Contracts and missions |
| [MGT-044] | Mission outcome conditions (open) | modules/management | design/design.md › Management › Contracts and missions › Mission types; › Overview › Core loop |
| [MGT-045] | Bundling missions into an op | modules/management | design/design.md › Management › Contracts and missions |
| [MGT-046] | Contract pay (open) | modules/management | design/design.md › Management › Contracts and missions › Pay bands |
| [MGT-047] | Advance and remainder | modules/management | design/design.md › Management › Contracts and missions › Contract terms; › Strategic Layer › Squads and simulation (Faction funds (draft)) |
| [MGT-048] | Contract failure | modules/management | design/design.md › Management › Contracts and missions › Contract terms |
| [MGT-049] | Intel level | modules/management | design/design.md › Management › Contracts and missions › Contract terms |
| [MGT-050] | Deniability (open) | modules/management | design/design.md › Management › Contracts and missions › Contract terms; design.md › Factions |
| [MGT-051] | Contract board and filtering | modules/management | design/design.md › Management › Contracts and missions › Where contracts come from; › Reputation |
| [MGT-052] | Rival PMC competition | modules/management | design/design.md › Management › Contracts and missions; › Reputation › Standing |
| [MGT-053] | Reputation value | modules/management | design/design.md › Management › Reputation (draft) |
| [MGT-054] | Standing levels | modules/management | design/design.md › Management › Reputation › Standing |
| [MGT-055] | Standing effects | modules/management | design/design.md › Management › Reputation › Standing |
| [MGT-056] | Contract reputation acts | modules/management | design/design.md › Management › Reputation › What changes reputation; › Contract terms |
| [MGT-057] | Friendly acts | modules/management | design/design.md › Management › Reputation › What changes reputation |
| [MGT-058] | Hostile acts | modules/management | design/design.md › Management › Reputation › What changes reputation |
| [MGT-059] | War crimes | modules/management | design/design.md › Management › Reputation › What changes reputation |
| [MGT-060] | Act application order | modules/management | design/design.md › Management › Reputation (draft) (structure implied; ordering is a spec decision) |
| [MGT-061] | Spill-over to hostile and allied factions (removed) | modules/management | design/design.md › Management › Reputation (draft) (block removed) |
| [MGT-062] | Krug exemption (removed) | modules/management | design/design.md › Management › Reputation (draft) (block removed) |
| [MGT-063] | Rival PMCs follow their patrons (removed) | modules/management | design/design.md › Management › Reputation (draft) (block removed) |
| [MGT-064] | Attribution | modules/management | design/design.md › Management › Reputation › Attribution |
| [MGT-065] | Acquisition paths | modules/management | design/design.md › Management › Base & meta progression |
| [MGT-066] | FOBs (open) | modules/management | design/design.md › Management › Base & meta progression |
| [MGT-067] | Paid field services (open) | modules/management | design/design.md › Management › Base & meta progression |
| [MGT-068] | Industry deliveries (open) | modules/management | design/design.md › Management › Base & meta progression |
| [MGT-069] | FOB raids (open) | modules/management | design/design.md › Management › Base & meta progression |
| [MGT-070] | Economy ledger | modules/management | design/design.md › Management › Contracts and missions › Contract terms; › Factions & campaign › Leaders; › Strategic Layer › Squads and simulation (Faction funds (draft)) |
| [MGT-071] | Campaign score (open) | modules/management | design/design.md › Management › Base & meta progression |
| [SAI-001] | Controller role | modules/strategic-ai | design/design.md › AI; › AI › Strategic AI › Controller hand-off; CLAUDE.md › Rules, State ownership |
| [SAI-002] | Invocation | modules/strategic-ai | design/design.md › AI › Strategic AI › Controller hand-off; › Strategic Layer (Time) |
| [SAI-003] | Strategic perception view | modules/strategic-ai | design/design.md › AI › Strategic AI › Controller hand-off; › Faction AI tiers; › Strategic Layer › Map (Fog of war); › Squads and simulation (Faction funds (draft)) |
| [SAI-004] | Strategic command set | modules/strategic-ai | design/design.md › AI › Strategic AI › Controller hand-off; › Faction AI tiers; › AI (intro) |
| [SAI-005] | No hidden information, no illegal actions | modules/strategic-ai | design/design.md › AI (intro); › AI › Tactical AI (last paragraph, applies to both layers) |
| [SAI-006] | Utility scoring | modules/strategic-ai | design/design.md › AI (intro, Data) |
| [SAI-007] | Tier 1 — situation maps | modules/strategic-ai | design/design.md › AI › Strategic AI › Faction AI tiers |
| [SAI-008] | Tier 2 — strategist | modules/strategic-ai | design/design.md › AI › Strategic AI › Faction AI tiers; › Faction behaviour; › Strategic Layer › Squads and simulation |
| [SAI-009] | Tier 3 — operational planner | modules/strategic-ai | design/design.md › AI › Strategic AI › Faction AI tiers; › Controller hand-off; › Management › Contracts and missions › Where contracts come from |
| [SAI-010] | Doctrines | modules/strategic-ai | design/design.md › AI (Data); › AI › Strategic AI › Faction AI tiers; › Factions & campaign › Factions |
| [SAI-011] | Decision log | modules/strategic-ai | design/design.md › AI (Logging) |
| [SAI-012] | Own goals | modules/strategic-ai | design/design.md › AI › Strategic AI › Faction behaviour |
| [SAI-013] | Hostility toward the player | modules/strategic-ai | design/design.md › AI › Strategic AI › Faction behaviour; › Management › Reputation › Standing |
| [SAI-014] | Contract offers | modules/strategic-ai | design/design.md › Management › Contracts and missions › Where contracts come from; › AI › Strategic AI › Faction AI tiers; › Controller hand-off |
| [SAI-015] | Contract offer evaluation (open) | modules/strategic-ai | design/design.md › AI › Strategic AI › Faction AI tiers |
| [TAI-001] | Controller role | modules/tactical-ai | design/design.md › AI › Tactical AI › Controller hand-off; CLAUDE.md › Rules, State ownership |
| [TAI-002] | Invocation | modules/tactical-ai | design/design.md › AI › Tactical AI › Controller hand-off; › Tactical Layer › Turn structure › Reactions |
| [TAI-003] | Pluggable controller | modules/tactical-ai | design/design.md › AI › Tactical AI (last paragraph) |
| [TAI-004] | Tactical perception view | modules/tactical-ai | design/design.md › AI › Tactical AI › Controller hand-off (1); › Unit scoring; › Tactical Layer (Readability, Path preview) |
| [TAI-005] | Tactical command set | modules/tactical-ai | design/design.md › AI › Tactical AI › Controller hand-off (3, 4); design/tactical-actions.md |
| [TAI-006] | No hidden information, no illegal actions | modules/tactical-ai | design/design.md › AI › Tactical AI (last paragraph) |
| [TAI-007] | Utility score | modules/tactical-ai | design/design.md › AI (intro, Data); › AI › Tactical AI › Unit scoring |
| [TAI-008] | Survival | modules/tactical-ai | design/design.md › AI › Tactical AI › Unit scoring |
| [TAI-009] | Battle goal (open) | modules/tactical-ai | design/design.md › AI › Tactical AI › Unit scoring |
| [TAI-010] | Action fit | modules/tactical-ai | design/design.md › AI › Tactical AI › Unit scoring; › Data definitions › Weapon profile (Weapon type → AI role) |
| [TAI-011] | Coordination | modules/tactical-ai | design/design.md › AI › Tactical AI › Unit scoring |
| [TAI-012] | Squad blackboard | modules/tactical-ai | design/design.md › AI › Tactical AI › Unit scoring; CLAUDE.md › State ownership |
| [TAI-013] | Squad leader plan (open) | modules/tactical-ai | design/design.md › AI › Tactical AI › Unit scoring; › AI › Tactical AI (roles) |
| [TAI-014] | Squad roles (open (how reinforcements arrive is not designed)) | modules/tactical-ai | design/design.md › AI › Tactical AI; › Tactical Layer (Enemy AI) |
| [TAI-015] | Doctrines | modules/tactical-ai | design/design.md › AI (Data); CLAUDE.md (data/ai) |
| [TAI-016] | Decision log | modules/tactical-ai | design/design.md › AI (Logging); › Presentation & tech › Prototype tech stack (Debugging) |
| [TAI-017] | Non-hostile units | modules/tactical-ai | design/design.md › AI › Tactical AI; › AI › Strategic AI › Faction behaviour |
| [TAI-018] | Allied AI units | modules/tactical-ai | design/design.md › AI › Tactical AI › Controller hand-off (2); › Management › Contracts and missions |
| [DAT-001] | Data tables for items and vehicles | /data, tools | design/design.md › Data definitions; design/item-list.md |
| [DAT-002] | Common item fields | /data, tools | design/design.md › Data definitions; design/item-list.md |
| [DAT-003] | Units | /data, tools | design/design.md › Data definitions; › Tactical Layer › Movement; › Strategic Layer |
| [DAT-004] | Definitions versus instance state | /data, tools | design/design.md › Data definitions (intro); › Weapon profile › State, not profile |
| [DAT-005] | Seven equipment slots (Draft (design: "Draft — not final")) | /data, tools | design/design.md › Data definitions › Soldier equipment slots (draft) |
| [DAT-006] | Access tiers | /data, tools | design/design.md › Data definitions › Soldier equipment slots (draft); › Medical system › Using medical items; design/tactical-actions.md › Medical, Gear and interaction |
| [DAT-007] | Everything carried counts toward weight | /data, tools | design/design.md › Data definitions › Soldier equipment slots (draft) |
| [DAT-008] | Container limits | /data, tools | design/design.md › Data definitions › Soldier equipment slots (draft) › Type limits; › Gear, loot & return › Inventory |
| [DAT-009] | Plate carrier fills two slots | /data, tools | design/design.md › Data definitions › Soldier equipment slots (draft) › Type limits; design/item-list.md › Body armour |
| [DAT-010] | Loot and death | /data, tools | design/design.md › Data definitions › Soldier equipment slots (draft) › Loot, Death |
| [DAT-011] | Weapon profile (Draft (design: "Draft — not final")) | /data, tools | design/design.md › Data definitions › Weapon profile (draft); design/item-list.md › Weapons; design/tactical-actions.md › Weapons (Fire, Reload) |
| [DAT-012] | Fire modes | /data, tools | design/design.md › Data definitions › Weapon profile (draft) › Fire modes; design/tactical-actions.md › Weapons |
| [DAT-013] | Base MoA game scale | /data, tools | design/design.md › Data definitions › Weapon profile (draft) › Base MoA; › Tactical Layer › Hit model |
| [DAT-014] | Weapon condition (open) | /data, tools | design/design.md › Data definitions › Weapon profile (draft) › State, not profile |
| [DAT-015] | Mod slots and handguard sub-slots | /data, tools | design/design.md › Data definitions › Weapon profile (draft) › Mod slots; › How mods change the profile |
| [DAT-016] | Weapon mod profile (Draft; initial content: none in design/item-list.md (no mods listed)) | /data, tools | design/design.md › Data definitions › Weapon profile (draft) › How mods change the profile |
| [DAT-017] | Tactical modules (open) | /data, tools | design/design.md › Data definitions › Weapon profile (draft) › Tactical modules |
| [DAT-018] | Suppressors and hearing | /data, tools | design/design.md › Data definitions › Weapon profile (draft) › How mods change the profile; › Tactical Layer › Gunshot noise |
| [DAT-019] | Calibre profile (Draft (design: "Draft — not final")) | /data, tools | design/design.md › Data definitions › Calibre profile (draft); design/item-list.md › Calibres |
| [DAT-020] | Calibre fit | /data, tools | design/design.md › Data definitions › Calibre profile (draft) › Designation |
| [DAT-021] | Ammunition load profile (Draft (design: "Draft — not final")) | /data, tools | design/design.md › Data definitions › Calibre profile (draft) › Ammo types; design/item-list.md › Ammunition |
| [DAT-022] | Ammo type defaults (Draft (falloff ranges marked placeholder)) | /data, tools | design/design.md › Data definitions › Calibre profile (draft) › Ammo types; design/item-list.md › Ammunition |
| [DAT-023] | Per-shot inputs | /data, tools | design/design.md › Tactical Layer › Derived per shot (draft); › Data definitions › Calibre profile (draft) |
| [DAT-024] | Vehicle profile (Draft (design: "Draft — not final")) | /data, tools | design/design.md › Data definitions › Vehicles (draft) › Vehicle parameters |
| [DAT-025] | A squad on the map is its vehicle | /data, tools | design/design.md › Data definitions › Vehicles (draft) |
| [DAT-026] | Vehicle features (open) | /data, tools | design/design.md › Data definitions › Vehicles (draft) › Vehicles table |
| [DAT-027] | Vehicle availability | /data, tools | design/design.md › Data definitions › Vehicles (draft) › Buying and selling, Start; › Management › Reputation › Standing |
| [DAT-028] | Helicopter data | /data, tools | design/design.md › Data definitions › Vehicles (draft) › Helicopters (draft) |
| [DAT-029] | Vehicle instance state and loss (open) | /data, tools | design/design.md › Data definitions › Vehicles (draft) › Loss |
| [ITM-001] | Weapon items | /data, tools | design/item-list.md › Weapons |
| [ITM-002] | Calibre items | /data, tools | design/item-list.md › Calibres |
| [ITM-003] | Ammunition load items | /data, tools | design/item-list.md › Ammunition |
| [ITM-004] | Standard damage modifiers | /data, tools | design/item-list.md › Ammunition |
| [ITM-005] | Falloff floor | /data, tools | design/item-list.md › Ammunition; design/design.md › Tactical Layer › Derived per shot (draft) |
| [ITM-006] | Penetration class | /data, tools | design/item-list.md › Ammunition; design/design.md › Tactical Layer › Derived per shot (draft) |
| [ITM-007] | Subsonic through a suppressor | /data, tools | design/item-list.md › Ammunition; design/design.md › Tactical Layer › Gunshot noise |
| [ITM-008] | Load-specific damage and projectiles | /data, tools | design/item-list.md › Calibres (12 gauge row) |
| [ITM-009] | Helmet items | /data, tools | design/item-list.md › Helmets |
| [ITM-010] | Helmet hearing and vision | /data, tools | design/item-list.md › Helmets; design/design.md › Tactical Layer › Gunshot noise |
| [ITM-011] | Body armour items | /data, tools | design/item-list.md › Body armour |
| [ITM-012] | Armour durability (open) | /data, tools | design/design.md › Data definitions › Soldier equipment slots (draft); › Tactical Layer › Derived per shot (draft) |
| [ITM-013] | Vest items | /data, tools | design/item-list.md › Load-bearing vests |
| [ITM-014] | Pouch type limits | /data, tools | design/item-list.md › Load-bearing vests; design/design.md › Data definitions › Soldier equipment slots (draft) › Type limits |
| [ITM-015] | Other items | /data, tools | design/item-list.md › Load-bearing vests |
| [ITM-016] | Pouch item weight limit | /data, tools | design/item-list.md › Load-bearing vests |
| [ITM-017] | Battle belt items (open (holster meaning)) | /data, tools | design/item-list.md › Battle belts |
| [ITM-018] | Backpack items | /data, tools | design/item-list.md › Backpacks |
| [ITM-019] | Medical items | /data, tools | design/item-list.md › Medical items; design/design.md › Tactical Layer › Medical system (draft) |
| [ITM-020] | Medical item restrictions | /data, tools | design/item-list.md › Medical items |
| [ITM-021] | Barter goods | /data, tools | design/item-list.md › Barter goods; › Operation and faction items (hard drive) |
| [ITM-022] | Trader buy rates | /data, tools | design/item-list.md › Barter goods › Trading rules |
| [ITM-023] | Daily barter deals | /data, tools | design/item-list.md › Barter goods › Trading rules |
| [ITM-024] | Loot rarity | /data, tools | design/item-list.md › Barter goods › Trading rules |
| [ITM-025] | Operation and faction item fields | /data, tools | design/item-list.md › Operation and faction items |
| [ITM-026] | Operation effects | /data, tools | design/item-list.md › Operation and faction items |
| [ITM-027] | Hand-in action | /data, tools | design/item-list.md › Operation and faction items; design/strategic-actions.md |
| [ITM-028] | Hand-in rewards | /data, tools | design/item-list.md › Operation and faction items |
| [ITM-029] | Hand-in reputation and attribution | /data, tools | design/item-list.md › Operation and faction items › Hand-in rules |
| [ITM-030] | Faction items in containers | /data, tools | design/item-list.md › Operation and faction items › Hand-in rules; › Load-bearing vests |
| [TEC-001] | Character triangle budget | game/, tools/ | design/design.md › Presentation & tech › Art direction › Retro base |
| [TEC-002] | Texture size and filtering | game/, tools/ | design/design.md › Presentation & tech › Art direction › Retro base |
| [TEC-003] | Internal render resolution | game/, tools/ | design/design.md › Presentation & tech › Art direction › Retro base |
| [TEC-004] | Palette and dithering (open) | game/, tools/ | design/design.md › Presentation & tech › Art direction › Retro base |
| [TEC-005] | PSX quirks toggle (optional) | game/, tools/ | design/design.md › Presentation & tech › Art direction › Retro base |
| [TEC-006] | Dynamic lighting and effects | game/, tools/ | design/design.md › Presentation & tech › Art direction › Modern layer |
| [TEC-007] | Quality tiers | game/, tools/ | design/design.md › Presentation & tech › Art direction › Why it fits the browser |
| [TEC-008] | Rendering never drives rules | game/, tools/ | design/design.md › Presentation & tech › Art direction › Modern layer; › Tactical Layer (Time of day) |
| [TEC-009] | Placeholder art first | game/, tools/ | design/design.md › Presentation & tech › Prototype tech stack (Art) |
| [TEC-010] | Engine and graphics API | game/, tools/ | design/design.md › Presentation & tech › UX, tech & scope (Engine); › Prototype tech stack |
| [TEC-011] | No build step | game/, tools/ | design/design.md › Presentation & tech › Prototype tech stack (Language, Build, Menus); CLAUDE.md › Stack |
| [TEC-012] | Engine-independent rules core | game/, tools/ | design/design.md › Presentation & tech › Prototype tech stack (Rules core); CLAUDE.md › Dependency direction |
| [TEC-013] | HTML/CSS menus | game/, tools/ | design/design.md › Presentation & tech › Prototype tech stack (Menus and inventory) |
| [TEC-014] | JSON data with schemas | game/, tools/ | design/design.md › Presentation & tech › Prototype tech stack (Language, Game data) |
| [TEC-015] | Seeded randomness and reproducibility | game/, tools/ | design/design.md › Presentation & tech › Prototype tech stack (Randomness) |
| [TEC-016] | Debug overlay | game/, tools/ | design/design.md › Presentation & tech › Prototype tech stack (Debugging) |
| [TEC-017] | Hosting and deployment (open) | game/, tools/ | design/design.md › Presentation & tech › Prototype tech stack (Hosting) |
| [TEC-018] | Key screens | game/, tools/ | design/design.md › Presentation & tech › UX, tech & scope (Key screens) |
| [TEC-019] | Vertical slice | game/, tools/ | design/design.md › Presentation & tech › UX, tech & scope (Vertical slice goal) |
| [TEC-020] | Feature build order | game/, tools/ | design/design.md › Presentation & tech › Prototype tech stack › Build order |
| [TEC-021] | Mouse and touch parity | game/, tools/ | design/design.md › Presentation & tech › Browser and mobile constraints (Input); › Tactical Layer (Camera) |
| [TEC-022] | Select and shot preview | game/, tools/ | design/design.md › Presentation & tech › Browser and mobile constraints (Input) |
| [TEC-023] | Explicit confirm for moves and shots | game/, tools/ | design/design.md › Presentation & tech › Browser and mobile constraints (Input); › Tactical Layer (Movement) |
| [TEC-024] | No hover-only information | game/, tools/ | design/design.md › Presentation & tech › Browser and mobile constraints (Input) |
| [TEC-025] | Phone layout | game/, tools/ | design/design.md › Presentation & tech › Browser and mobile constraints (UI) |
| [TEC-026] | Frame-rate budget | game/, tools/ | design/design.md › Presentation & tech › Browser and mobile constraints (Performance budget) |
| [TEC-027] | Download budget and streaming | game/, tools/ | design/design.md › Presentation & tech › Browser and mobile constraints (Performance budget) |
| [TEC-028] | Local saves | game/, tools/ | design/design.md › Presentation & tech › Browser and mobile constraints (Saves); CLAUDE.md › Stack |
| [TEC-029] | Cloud save (optional) | game/, tools/ | design/design.md › Presentation & tech › Browser and mobile constraints (Saves) |
| [TEC-030] | Save mode (open) | game/, tools/ | design/design.md › Presentation & tech › Open questions |

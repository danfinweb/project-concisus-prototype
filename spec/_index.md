# Spec index

Maps every spec ID to the module or tool that implements it and to its design source. Maintained by
`/update-spec` only.

IDs are `[AREA-NNN]`, never reused or renumbered; a removed rule keeps its ID, marked `(removed)`.

Design baseline: 06dc2a6 (update, 2026-11-24; previous 06e571f)

| Area | File | Design source | Implemented by |
| --- | --- | --- | --- |
| GEN | [overview.md](overview.md) | design.md › Overview, Factions & campaign | all modules |
| STR | [strategic.md](strategic.md) | strategic-layer.md; strategic-actions.md; world-events.md | `modules/strategic` |
| TAC | [tactical.md](tactical.md) | tactical-layer.md; tactical-actions.md | `modules/tactical` |
| MGT | [management.md](management.md) | management.md; callsigns.md | `modules/management` |
| SAI | [strategic-ai.md](strategic-ai.md) | ai.md › Strategic AI | `modules/strategic-ai` |
| TAI | [tactical-ai.md](tactical-ai.md) | ai.md › Tactical AI | `modules/tactical-ai` |
| DAT | [data.md](data.md) | data-definitions.md | `/data`, tools |
| ITM | [data.md](data.md) | item-list.md | `/data/items.json`, item editor |
| TEC | [tech.md](tech.md) | presentation-tech.md | `game/`, `tools/` |

## IDs

419 IDs (first split 2026-11-22, updated from design 06dc2a6). Status in brackets: `open` = the design leaves a value or rule unset, `optional` = left out of the first build iterations, `removed` = rule dropped from the design (ID kept).

| ID | Title | Implemented by | Design source |
| --- | --- | --- | --- |
| [GEN-001] | Operation as unit of play | all modules | design/design.md › Overview › Core loop |
| [GEN-002] | Op success condition | all modules | design/design.md › Overview › Core loop; design/management.md › Gear, loot & return |
| [GEN-003] | Op objectives and bundling | all modules | design/design.md › Overview › Core loop |
| [GEN-004] | Faction roster | all modules | design/design.md › Factions & campaign › Factions |
| [GEN-005] | Off-map influences | all modules | design/design.md › Factions & campaign › Factions |
| [GEN-006] | Civilian population | all modules | design/design.md › Factions & campaign › Factions; design/strategic-layer.md › Map (draft) |
| [GEN-007] | Faction relations model | all modules | design/strategic-layer.md › World events; design/management.md › Reputation (draft) |
| [GEN-008] | Leader effects (open) | all modules | design/design.md › Factions & campaign › Leaders |
| [GEN-009] | Krug markets as no-fire zones | all modules | design/design.md › Factions & campaign › The Krug |
| [GEN-010] | Krug standing unlocks (open) | all modules | design/design.md › Factions & campaign › The Krug |
| [GEN-011] | Player allegiance (open) | all modules | design/design.md › Factions & campaign › Player role |
| [GEN-012] | Campaign end states (open) | all modules | design/design.md › Factions & campaign › Player role; design/strategic-layer.md › Map (draft); design/management.md › Base & meta progression |
| [GEN-013] | Player coup requirements (open) | all modules | design/design.md › Factions & campaign › Coups |
| [GEN-014] | Coup final operation | all modules | design/design.md › Factions & campaign › Coups |
| [GEN-015] | Holding phase (open) | all modules | design/design.md › Factions & campaign › Coups; design/strategic-layer.md › Map (draft) |
| [GEN-016] | Coup epilogue | all modules | design/design.md › Factions & campaign › Coups |
| [GEN-017] | Rogue PMC chance (open) | all modules | design/design.md › Factions & campaign › Coups › Rogue PMCs |
| [GEN-018] | Rogue PMC warning signs and aftermath | all modules | design/design.md › Factions & campaign › Coups › Rogue PMCs |
| [GEN-019] | Reformed ending: ceasefire peace | all modules | design/design.md › Factions & campaign › Player role |
| [STR-001] | Strategic clock | modules/strategic | design/strategic-layer.md (Time) |
| [STR-002] | Action duration | modules/strategic | design/strategic-layer.md (Time); › Squads and simulation (Strategic turn); design/strategic-actions.md (intro) |
| [STR-003] | Hour tick (open) | modules/strategic | design/strategic-layer.md (Time); › Squads and simulation (Strategic turn); design/ai.md › Strategic AI (Controller hand-off) |
| [STR-004] | Daily checks at 00:00 | modules/strategic | design/strategic-layer.md (Time); design/strategic-actions.md › Trade; design/management.md › Base & meta progression |
| [STR-005] | Region graph | modules/strategic | design/strategic-layer.md › Map (draft) |
| [STR-006] | Terrain movement costs | modules/strategic | design/strategic-layer.md › Map (draft) › Terrain types; design/strategic-actions.md › Movement and operations |
| [STR-007] | Capital control (open) | modules/strategic | design/strategic-layer.md › Map (draft); design/design.md › Factions & campaign › Coups |
| [STR-008] | Fog of war and detection (open) | modules/strategic | design/strategic-layer.md › Map (draft) (Fog of war); › Strategic Layer (Intel); design/data-definitions.md › Vehicles (Noise) |
| [STR-009] | Civilian loyalty (open) | modules/strategic | design/strategic-layer.md › Map (draft); design/design.md › Factions & campaign › Factions |
| [STR-010] | Points of interest | modules/strategic | design/strategic-layer.md › Map (draft) › Points of interest |
| [STR-011] | Mineral plant modifier (open) | modules/strategic | design/strategic-layer.md › Map (draft) › Points of interest; design/management.md › Base & meta progression |
| [STR-012] | Krug markets as no-fire zones | modules/strategic | design/design.md › Factions & campaign › The Krug (refer to GEN for the Code) |
| [STR-013] | Hidden cities (optional) | modules/strategic | design/strategic-layer.md › Map (draft) › Hidden cities |
| [STR-014] | Control of a point of interest (open) | modules/strategic | design/strategic-layer.md › Squads and simulation (Control) |
| [STR-015] | Stationed squad and plant output (open) | modules/strategic | design/strategic-actions.md › Movement and operations; design/management.md › Base & meta progression |
| [STR-016] | FOBs on the map | modules/strategic | design/management.md › Base & meta progression; › Core loop |
| [STR-017] | Squads | modules/strategic | design/strategic-layer.md › Squads and simulation (draft); design/data-definitions.md › Vehicles (draft) |
| [STR-018] | Squad goals | modules/strategic | design/strategic-layer.md › Squads and simulation (Goals); design/management.md › Contracts and missions |
| [STR-019] | Escalation (open) | modules/strategic | design/strategic-layer.md (Escalation) |
| [STR-020] | One action per faction per hour | modules/strategic | design/design.md › Overview › Pillars (4); › Strategic Layer (Time); › Squads and simulation (Strategic turn) |
| [STR-021] | Faction controller hand-off | modules/strategic | design/ai.md (intro); design/ai.md › Strategic AI (Controller hand-off); design/strategic-layer.md › Squads and simulation (Faction funds) |
| [STR-022] | Encounter detection | modules/strategic | design/strategic-layer.md › Squads and simulation (Encounters); design/ai.md › Strategic AI |
| [STR-023] | Tactical engagement | modules/strategic | design/strategic-layer.md (Time); › Squads and simulation (Encounters); design/strategic-actions.md › Movement and operations |
| [STR-024] | Evade an encounter (open) | modules/strategic | design/strategic-layer.md › Squads and simulation (Encounters); design/strategic-actions.md › Movement and operations |
| [STR-025] | Pay your way through (Krug) (open) | modules/strategic | design/strategic-layer.md › Squads and simulation (Encounters); design/strategic-actions.md › Movement and operations |
| [STR-026] | Off-screen fights (open) | modules/strategic | design/strategic-layer.md › Squads and simulation (Off-screen fights) |
| [STR-092] | Faction funds (open) | modules/strategic | design/strategic-layer.md › Squads and simulation (Faction funds (draft)); design/design.md (module table: `world` includes funds) |
| [STR-093] | Contract payment between modules | modules/strategic | design/strategic-layer.md › Squads and simulation (Faction funds (draft)); design/design.md › Overview › Core loop; design/management.md › Contracts and missions › Contract terms |
| [STR-094] | Krug escorts (open) | modules/strategic | design/management.md › Contracts and missions › Where contracts come from |
| [STR-095] | Strategic terrain table | modules/strategic | design/strategic-layer.md › Map |
| [STR-096] | Raising a squad | modules/strategic | design/strategic-layer.md; design/ai.md › Strategic AI |
| [STR-097] | Strategic HP loss on contaminated tiles | modules/strategic | design/world-events.md › Nuclear strike (rare); design/strategic-layer.md › Map (draft) › Points of interest |
| [STR-098] | Low-risk contract guarantee | modules/strategic | design/strategic-layer.md › Squads and simulation (draft) (Faction funds); design/management.md › Gear, loot & return (Design risk) |
| [STR-027] | Operation lifecycle | modules/strategic | design/design.md › Overview › Core loop; design/management.md › Gear, loot & return |
| [STR-028] | Launch an op (open) | modules/strategic | design/strategic-actions.md › Movement and operations |
| [STR-029] | Return to an FOB | modules/strategic | design/strategic-actions.md › Movement and operations |
| [STR-030] | Lost vehicle (open) | modules/strategic | design/data-definitions.md › Vehicles (draft) (Loss) |
| [STR-031] | Move one region on foot | modules/strategic | design/strategic-actions.md › Movement and operations |
| [STR-032] | Move one region by ground vehicle (open) | modules/strategic | design/strategic-actions.md › Movement and operations; design/data-definitions.md › Vehicles (draft) |
| [STR-033] | Vehicle profile (removed) | modules/strategic | design/data-definitions.md › Vehicles (draft) (Profile) |
| [STR-034] | Fly one region by helicopter (open) | modules/strategic | design/strategic-actions.md › Movement and operations; design/data-definitions.md › Vehicles (draft) › Helicopters |
| [STR-035] | Land a helicopter (open) | modules/strategic | design/strategic-actions.md › Movement and operations; design/data-definitions.md › Vehicles (draft) › Helicopters |
| [STR-036] | Scout (open) | modules/strategic | design/strategic-layer.md (Time); design/strategic-actions.md › Movement and operations |
| [STR-037] | Stand by | modules/strategic | design/strategic-layer.md (Time); › Squads and simulation (Strategic turn); design/strategic-actions.md › Movement and operations |
| [STR-038] | Enter a point of interest (open) | modules/strategic | design/strategic-actions.md › Movement and operations |
| [STR-039] | Zero-time trade actions | modules/strategic | design/strategic-actions.md › Trade, services, contracts and factions; design/strategic-layer.md (Time) |
| [STR-040] | Contract actions (open) | modules/strategic | design/strategic-actions.md › Trade, services, contracts and factions |
| [STR-041] | Paid services (open) | modules/strategic | design/strategic-actions.md › Trade, services, contracts and factions; design/data-definitions.md › Vehicles (draft) › Helicopters |
| [STR-042] | Acquire an FOB (open) | modules/strategic | design/strategic-actions.md › Trade, services, contracts and factions; design/management.md › Base & meta progression |
| [STR-043] | Payments to factions (open) | modules/strategic | design/strategic-actions.md › Trade, services, contracts and factions |
| [STR-044] | Contract postings from goals | modules/strategic | design/management.md › Contracts and missions; design/ai.md › Strategic AI |
| [STR-045] | VIP entity | modules/strategic | design/strategic-layer.md › VIPs |
| [STR-046] | VIP guard | modules/strategic | design/strategic-layer.md › VIPs |
| [STR-047] | VIP death morale shock | modules/strategic | design/strategic-layer.md › VIPs |
| [STR-048] | VIP intel | modules/strategic | design/strategic-layer.md › VIPs; design/strategic-actions.md › Trade, services, contracts and factions |
| [STR-049] | Faction leader death (open) | modules/strategic | design/strategic-layer.md › VIPs |
| [STR-050] | Event check (open) | modules/strategic | design/strategic-layer.md › World events (How events work) |
| [STR-051] | Faction relations | modules/strategic | design/strategic-layer.md › World events; design/management.md › Reputation (draft) |
| [STR-052] | Warning signs (open) | modules/strategic | design/strategic-layer.md › World events (Warning signs) |
| [STR-053] | Player influence on events | modules/strategic | design/strategic-layer.md › World events (Player influence) |
| [STR-054] | News feed | modules/strategic | design/strategic-layer.md › World events (News feed) |
| [STR-055] | Event: PMC joint assault (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-056] | Event: Weapon shipment (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-057] | Event: Rising hostility (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-058] | Event: Operation dispute (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-059] | Event: Front offensive (open) | modules/strategic | design/world-events.md › Events |
| [STR-060] | Event: Local ceasefire (open) | modules/strategic | design/world-events.md › Events |
| [STR-061] | Event: Defection (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-062] | Event: Fuel shortage (open) | modules/strategic | design/world-events.md › Events |
| [STR-063] | Event: Chemical leak (open) | modules/strategic | design/world-events.md › Events; design/strategic-layer.md › Map (draft) › Points of interest |
| [STR-064] | Event: Bounty on the PMC (open) | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-065] | Event: Refugee movement (open) | modules/strategic | design/world-events.md › Events |
| [STR-066] | Event: Rogue PMC | modules/strategic | design/world-events.md › Events; › Reputation in the event system; design/design.md › Factions & campaign › Coups |
| [STR-067] | Event: Resistance group forms | modules/strategic | design/world-events.md › Events; › Reputation in the event system |
| [STR-068] | Faction history | modules/strategic | design/world-events.md › Desperate measures (Crisis signs) |
| [STR-069] | Crisis signs | modules/strategic | design/world-events.md › Desperate measures (Crisis signs); › Reputation in the event system; design/strategic-layer.md › Squads and simulation (Faction funds (draft)) |
| [STR-070] | Measure selection (open) | modules/strategic | design/strategic-layer.md › World events (Desperate measures); design/world-events.md › Desperate measures |
| [STR-071] | Measure: Forced conscription (open) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-072] | Measure: Penal battalions (open) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-073] | Measure: Open call for help (open) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-074] | Measure: Paying any price (open) | modules/strategic | design/world-events.md › Desperate measures; › Reputation in the event system |
| [STR-075] | Measure: Scorched earth (open) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-076] | Measure: Mining the roads (open; tactical mines optional) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-077] | Measure: Martial law (open) | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-078] | Measure: Seizing Krug stocks | modules/strategic | design/world-events.md › Desperate measures (Measures) |
| [STR-079] | Measure: VIP strike | modules/strategic | design/world-events.md › Desperate measures; › Reputation in the event system |
| [STR-080] | Measure: Nuclear strike (open; tactical contamination effect optional) | modules/strategic | design/world-events.md › Nuclear strike; › Reputation in the event system |
| [STR-081] | Flavour events (open) | modules/strategic | design/strategic-layer.md › World events (Flavour events) |
| [STR-082] | Generation pipeline (open) | modules/strategic | design/strategic-layer.md › Map generation (draft) |
| [STR-083] | Stage: land (open) | modules/strategic | design/strategic-layer.md › Map generation (draft) (1) |
| [STR-084] | Stage: capital | modules/strategic | design/strategic-layer.md › Map generation (draft) (2) |
| [STR-085] | Stage: cities (open) | modules/strategic | design/strategic-layer.md › Map generation (draft) (3) |
| [STR-086] | Stage: industry (open) | modules/strategic | design/strategic-layer.md › Map generation (draft) (4) |
| [STR-087] | Stage: towns and governmental institutions (open) | modules/strategic | design/strategic-layer.md › Map generation (draft) (5) |
| [STR-088] | Stage: roads (open) | modules/strategic | design/strategic-layer.md › Map generation (draft) (6) |
| [STR-089] | Stage: war state (open) | modules/strategic | design/strategic-layer.md › Map generation (draft) (7) |
| [STR-090] | Stage: start (open) | modules/strategic | design/strategic-layer.md › Map generation (draft) (8) |
| [STR-091] | Stage: validate (open) | modules/strategic | design/strategic-layer.md › Map generation (draft) (Validation rules) |
| [TAC-001] | Sides on a map | modules/tactical | design/tactical-layer.md › Turn structure; design/tactical-layer.md (Enemy AI) |
| [TAC-002] | Turn-based from the start | modules/tactical | design/tactical-layer.md (Turn structure bullet) |
| [TAC-003] | Battle duration and day/night | modules/tactical | design/tactical-layer.md › Time of day |
| [TAC-004] | Night sight reduction | modules/tactical | design/tactical-layer.md › Time of day; › Turn structure › Sight and spotting (draft); design/data-definitions.md › Weapon profile (tactical modules) |
| [TAC-076] | Objective met in battle | modules/tactical | design/design.md › Overview › Core loop; design/management.md › Contracts and missions › Mission types |
| [TAC-078] | Contamination and mines on the tactical map (optional) | modules/tactical | design/world-events.md › Desperate measures (Mining the roads); › Nuclear strike (rare) (Effect) |
| [TAC-080] | Tactical map from the encounter tile | modules/tactical | design/strategic-layer.md › Map (draft) (biome per strategic terrain type); design/strategic-layer.md › Squads and simulation (draft) (Encounters: the tile's terrain sets the tactical map); design/management.md › Gear, loot & return (2–4 exits with conditions); design/tactical-layer.md › Tactical map generation (draft) |
| [TAC-005] | Turn order and activation choice | modules/tactical | design/tactical-layer.md › Turn structure › Turns and activation; design/tactical-actions.md › Turn and activation |
| [TAC-006] | Action points per activation | modules/tactical | design/tactical-layer.md (Action points); design/management.md › Soldier attributes › Derived values; design/tactical-actions.md › Turn and activation, AP modifiers on an activation |
| [TAC-007] | Set facing at end of activation | modules/tactical | design/tactical-layer.md › Turn structure › Vision and facing; design/tactical-actions.md › Turn and activation |
| [TAC-008] | Activation stamina cost | modules/tactical | design/tactical-layer.md › Turn structure › Stamina; design/tactical-actions.md › Turn and activation |
| [TAC-009] | Stamina maximum | modules/tactical | design/tactical-layer.md › Turn structure › Stamina; design/management.md › Soldier attributes › Derived values |
| [TAC-010] | Pass | modules/tactical | design/tactical-layer.md › Turn structure › Turns and activation; design/tactical-actions.md › Turn and activation |
| [TAC-011] | Stamina recovery | modules/tactical | design/tactical-layer.md › Turn structure › Turns and activation, Stamina; design/tactical-actions.md › Turn and activation (Pass) |
| [TAC-012] | Exhaustion | modules/tactical | design/tactical-layer.md › Turn structure › Stamina |
| [TAC-013] | Stall rule | modules/tactical | design/tactical-layer.md › Turn structure › Turns and activation |
| [TAC-014] | Durations in turns | modules/tactical | design/tactical-layer.md › Turn structure › Turns and activation |
| [TAC-015] | Suppression | modules/tactical | design/tactical-layer.md › Turn structure › Turns and activation; › Hit model › Shooter spread and recoil (draft); design/tactical-actions.md › AP modifiers on an activation; design/management.md › Soldier attributes (Nerve) |
| [TAC-077] | Morale flight and Nerve in battle (optional) | modules/tactical | design/management.md › Soldiers & progression (Contracts & morale); › Soldier attributes (Nerve) |
| [TAC-016] | Vision cone | modules/tactical | design/tactical-layer.md › Turn structure › Vision and facing; design/tactical-layer.md (Cover & visibility); design/item-list.md › Helmets |
| [TAC-017] | Turning during an activation | modules/tactical | design/tactical-layer.md › Turn structure › Vision and facing; design/tactical-actions.md › Movement |
| [TAC-018] | Gunshot hearing range | modules/tactical | design/tactical-layer.md › Turn structure › Gunshot noise; design/tactical-layer.md › Derived per shot |
| [TAC-019] | Reacting to heard shots and noise | modules/tactical | design/tactical-layer.md › Turn structure › Vision and facing, Gunshot noise |
| [TAC-081] | Sight range and spotting | modules/tactical | design/tactical-layer.md › Turn structure › Sight and spotting (draft); › Tactical map generation (draft) › Concealment (Spotting); design/management.md › Soldier attributes › Derived values |
| [TAC-020] | Reaction trigger | modules/tactical | design/tactical-layer.md › Turn structure › Reactions; design/tactical-actions.md › Turn and activation |
| [TAC-021] | Reaction setting | modules/tactical | design/tactical-layer.md › Turn structure › Reactions; design/tactical-actions.md › Turn and activation |
| [TAC-022] | Reaction attempt cost and chance | modules/tactical | design/tactical-layer.md › Turn structure › Reactions; design/tactical-actions.md › Turn and activation |
| [TAC-023] | Reaction resolution | modules/tactical | design/tactical-layer.md › Turn structure › Reactions; › Hit model › Shooter spread and recoil (draft); design/tactical-actions.md › Turn and activation (Hold overwatch) |
| [TAC-075] | Hold overwatch | modules/tactical | design/tactical-actions.md › Turn and activation (Hold overwatch); design/tactical-layer.md › Turn structure › Reactions |
| [TAC-024] | Action cost composition | modules/tactical | design/tactical-layer.md (Action points), › Actions and costs; design/tactical-actions.md (intro: order of cost calculation) |
| [TAC-025] | Stun (head hit) | modules/tactical | design/tactical-layer.md › Body zones and hitboxes › Health and effects per zone; design/tactical-actions.md › AP modifiers on an activation |
| [TAC-026] | Pain AP loss | modules/tactical | design/tactical-layer.md › Medical system › Conditions; › Hit model › Shooter spread and recoil (draft); design/tactical-actions.md › AP modifiers on an activation |
| [TAC-027] | Over-encumbrance | modules/tactical | design/tactical-layer.md (Action points); design/tactical-actions.md › AP modifiers on an activation; design/data-definitions.md › Soldier equipment slots |
| [TAC-028] | Tactical grid and levels | modules/tactical | design/tactical-layer.md (Movement); › Tactical map generation (draft) › Stages (Structures, Levels) |
| [TAC-029] | Walk one tile | modules/tactical | design/tactical-layer.md (Movement); › Tactical map generation (draft) › Tiles, cover and doors; design/tactical-actions.md › Movement (Walk one tile, Leg wounds) and intro; design/tactical-layer.md › Body zones and hitboxes › Health and effects per zone; › Medical system › Conditions |
| [TAC-030] | Move crouched | modules/tactical | design/tactical-layer.md (Movement); design/tactical-actions.md › Movement |
| [TAC-031] | Crawl prone | modules/tactical | design/tactical-layer.md (Movement); design/tactical-actions.md › Movement |
| [TAC-032] | Sprint | modules/tactical | design/tactical-actions.md › Movement; design/tactical-layer.md › Medical system › Conditions; design/item-list.md › Backpacks |
| [TAC-033] | Change stance | modules/tactical | design/tactical-layer.md (Movement); design/tactical-actions.md › Movement (Change stance); design/management.md › Soldier attributes (Agility row) |
| [TAC-034] | Vault a window, climb a ladder | modules/tactical | design/tactical-layer.md (Movement), Body zones and hitboxes › Stance; › Tactical map generation (draft) › Tiles, cover and doors; design/tactical-actions.md › Movement (Vault a window or low wall, Climb a ladder) |
| [TAC-035] | Cover per tile edge | modules/tactical | design/tactical-layer.md (Movement, Cover & visibility), Body zones and hitboxes › Stance; › Tactical map generation (draft) › Tiles, cover and doors |
| [TAC-036] | Destruction recalculation | modules/tactical | design/tactical-layer.md (Movement); › Tactical map generation (draft) › Tiles, cover and doors (Destruction) |
| [TAC-037] | Path preview | modules/tactical | design/tactical-layer.md (Movement) |
| [TAC-038] | Leave the map at an exit | modules/tactical | design/tactical-actions.md › Turn and activation; design/management.md › Gear, loot & return; design/tactical-layer.md › Tactical map generation (draft) › Stages (Exits and deployment) |
| [TAC-039] | Fire | modules/tactical | design/tactical-actions.md › Weapons (Fire); design/data-definitions.md › Weapon profile |
| [TAC-040] | Aim longer | modules/tactical | design/tactical-layer.md (Action points); design/tactical-actions.md › Weapons (Aim longer) |
| [TAC-041] | Reload | modules/tactical | design/tactical-actions.md › Weapons (Reload) and intro; design/item-list.md › Weapons (Feed type, magazines are items); design/data-definitions.md › Weapon profile, Soldier equipment slots |
| [TAC-042] | Swap weapon 1 and 2 | modules/tactical | design/tactical-actions.md › Weapons (Swap between weapon 1 and 2); design/data-definitions.md › Soldier equipment slots |
| [TAC-043] | Throw a grenade | modules/tactical | design/tactical-actions.md › Weapons (Throw a grenade); design/item-list.md › Grenades; design/tactical-layer.md › Body zones and hitboxes › Health and effects per zone; design/management.md › Soldier attributes |
| [TAC-079] | Grenade effects | modules/tactical | design/item-list.md › Grenades; design/tactical-layer.md › Body zones and hitboxes (share of front silhouette) |
| [TAC-044] | Total spread | modules/tactical | design/tactical-layer.md › Hit model; › Hit model › Shooter spread and recoil (draft); design/data-definitions.md › Weapon profile |
| [TAC-045] | Simulated shot trace | modules/tactical | design/tactical-layer.md › Hit model (Decision: MoA is simulated); design/data-definitions.md › Calibre profile |
| [TAC-046] | Hit chance and shot preview | modules/tactical | design/tactical-layer.md › Hit model (Shot preview); › Tactical map generation (draft) › Concealment; design/tactical-layer.md (Readability) |
| [TAC-047] | Burst recoil | modules/tactical | design/tactical-layer.md › Hit model › Shooter spread and recoil (draft); design/item-list.md › Ammunition |
| [TAC-082] | Concealment (obscuring terrain) | modules/tactical | design/tactical-layer.md › Tactical map generation (draft) › Concealment |
| [TAC-083] | Weapon jam and clearing it | modules/tactical | design/tactical-layer.md › Derived per shot › Armour wear and weapon condition (draft); design/tactical-actions.md › Weapons (Clear a jam); design/data-definitions.md › Weapon profile (State, not profile) |
| [TAC-048] | Muzzle damage and falloff | modules/tactical | design/tactical-layer.md › Derived per shot |
| [TAC-049] | Effective recoil | modules/tactical | design/tactical-layer.md › Derived per shot |
| [TAC-050] | Penetration check | modules/tactical | design/tactical-layer.md › Derived per shot; design/data-definitions.md › Soldier equipment slots |
| [TAC-051] | Blunt damage and armour wear | modules/tactical | design/tactical-layer.md › Derived per shot; › Derived per shot › Armour wear and weapon condition (draft); design/item-list.md › Body armour |
| [TAC-052] | Body zones and upright hitboxes | modules/tactical | design/tactical-layer.md › Body zones and hitboxes |
| [TAC-053] | Aiming arm pose (open) | modules/tactical | design/tactical-layer.md › Body zones and hitboxes |
| [TAC-054] | Crouched hitboxes | modules/tactical | design/tactical-layer.md › Body zones and hitboxes › Stance |
| [TAC-055] | Prone hitboxes and limits | modules/tactical | design/tactical-layer.md › Body zones and hitboxes › Stance |
| [TAC-056] | Cover occlusion | modules/tactical | design/tactical-layer.md › Body zones and hitboxes › Stance |
| [TAC-057] | Zone HP | modules/tactical | design/tactical-layer.md › Body zones and hitboxes › Health and effects per zone; design/management.md › Soldier attributes › Derived values |
| [TAC-058] | Zone damage effects | modules/tactical | design/tactical-layer.md › Body zones and hitboxes › Health and effects per zone; design/tactical-actions.md › Movement (Leg wounds), Weapons, AP modifiers on an activation |
| [TAC-059] | Zone at 0 HP | modules/tactical | design/tactical-layer.md › Body zones and hitboxes › Health and effects per zone; design/tactical-layer.md › Medical system › Conditions; design/data-definitions.md › Soldier equipment slots |
| [TAC-060] | Light bleeding | modules/tactical | design/tactical-layer.md › Medical system › Conditions; › Medical system › Chances (draft) |
| [TAC-061] | Heavy bleeding | modules/tactical | design/tactical-layer.md › Medical system › Conditions; › Medical system › Chances (draft) |
| [TAC-062] | Fracture | modules/tactical | design/tactical-layer.md › Medical system › Conditions; › Medical system › Chances (draft); › Hit model › Shooter spread and recoil (draft) |
| [TAC-063] | Pain | modules/tactical | design/tactical-layer.md › Medical system › Conditions; › Medical system › Chances (draft); design/item-list.md › Medical items |
| [TAC-064] | Medical item use permissions | modules/tactical | design/tactical-layer.md › Medical system › Using medical items; design/tactical-actions.md › Medical |
| [TAC-065] | Medical AP cost | modules/tactical | design/tactical-layer.md › Medical system › Using medical items; design/tactical-actions.md › Medical; design/item-list.md › Medical items |
| [TAC-066] | HP restored | modules/tactical | design/tactical-layer.md › Medical system › Using medical items; design/item-list.md › Medical items (IFAK) |
| [TAC-067] | Medical item effects | modules/tactical | design/tactical-layer.md › Medical system › Conditions; design/item-list.md › Medical items |
| [TAC-068] | Item access tiers (open) | modules/tactical | design/tactical-actions.md › Gear and interaction, Medical; design/data-definitions.md › Soldier equipment slots; design/item-list.md › Backpacks |
| [TAC-069] | Drop the backpack | modules/tactical | design/tactical-actions.md › Gear and interaction; design/data-definitions.md › Soldier equipment slots |
| [TAC-070] | Pick up or loot | modules/tactical | design/tactical-actions.md › Gear and interaction; design/data-definitions.md › Soldier equipment slots |
| [TAC-071] | Cut a lock | modules/tactical | design/tactical-actions.md › Gear and interaction; design/tactical-layer.md › Tactical map generation (draft) › Tiles, cover and doors |
| [TAC-072] | Place a demolition charge | modules/tactical | design/tactical-actions.md › Gear and interaction |
| [TAC-073] | Restrain a VIP | modules/tactical | design/tactical-actions.md › Gear and interaction |
| [TAC-074] | Carry or drag a body | modules/tactical | design/tactical-actions.md › Gear and interaction (Carry or drag a body) |
| [TAC-084] | Doors | modules/tactical | design/tactical-actions.md › Gear and interaction (Open a door, Close a door); design/tactical-layer.md › Tactical map generation (draft) › Tiles, cover and doors |
| [TAC-085] | Cover edge destruction | modules/tactical | design/tactical-layer.md › Tactical map generation (draft) › Tiles, cover and doors (Destruction) |
| [TAC-086] | Tactical map types | modules/tactical | design/tactical-layer.md › Tactical map generation (draft) › Inputs, Map types |
| [TAC-087] | Map generation stages | modules/tactical | design/tactical-layer.md › Tactical map generation (draft) › Stages |
| [TAC-088] | Buildings and levels | modules/tactical | design/tactical-layer.md › Tactical map generation (draft) › Stages (Structures, Levels), Tiles, cover and doors |
| [TAC-089] | Map checks and re-roll | modules/tactical | design/tactical-layer.md › Tactical map generation (draft) › Stages (Checks and re-roll) |
| [TAC-090] | Tall crops (optional) | modules/tactical | design/tactical-layer.md › Tactical map generation (draft) › Optional extras |
| [TAC-091] | Loot containers and mission item (optional) | modules/tactical | design/tactical-layer.md › Tactical map generation (draft) › Optional extras |
| [TAC-092] | City landmarks (optional) | modules/tactical | design/tactical-layer.md › Tactical map generation (draft) › Optional extras, Randomness |
| [TAC-093] | Generation randomness | modules/tactical | design/tactical-layer.md › Tactical map generation (draft) › Randomness |
| [TAC-094] | Squad leader and Leadership bonus | modules/tactical | design/management.md › Soldiers & progression (Rank and leadership); design/ai.md › Tactical AI |
| [TAC-095] | Morale in battle (open) | modules/tactical | design/management.md › Soldiers & progression (Contracts & morale) |
| [TAC-096] | Perk effects in battle | modules/tactical | design/management.md › Soldier attributes (draft) (Perks) |
| [MGT-001] | Soldier record | modules/management | design/management.md › Soldiers & progression |
| [MGT-002] | Hiring pools (open) | modules/management | design/management.md › Soldiers & progression |
| [MGT-003] | Hire price (open) | modules/management | design/management.md › Soldiers & progression |
| [MGT-004] | Player-chosen callsign and kit marks | modules/management | design/management.md › Soldiers & progression |
| [MGT-005] | Fee per op | modules/management | design/management.md › Soldiers & progression › Contracts & morale; design/strategic-layer.md › Squads and simulation (Faction funds (draft)) |
| [MGT-006] | Service record logging | modules/management | design/management.md › Soldiers & progression › Service record |
| [MGT-007] | Dossier and after-action report | modules/management | design/management.md › Soldiers & progression › Service record |
| [MGT-008] | Squad morale persistence (optional (flight rule only)) | modules/management | design/management.md › Soldiers & progression › Contracts & morale |
| [MGT-009] | Perks (open) | modules/management | design/management.md › Soldiers & progression › Attributes |
| [MGT-010] | Persistent injuries | modules/management | design/management.md › Soldiers & progression › Injuries |
| [MGT-011] | Death, MIA and capture | modules/management | design/management.md › Soldiers & progression › Death; › Gear, loot & return |
| [MGT-012] | Memorial wall | modules/management | design/management.md › Soldiers & progression › Memorial |
| [MGT-013] | Generation callsign: row and column | modules/management | design/callsigns.md › Generation callsigns |
| [MGT-014] | Generic callsigns | modules/management | design/callsigns.md › Generation callsigns |
| [MGT-015] | Callsign uniqueness and suffix | modules/management | design/callsigns.md › Generation callsigns; design/management.md › Deeds and callsigns |
| [MGT-016] | Callsign assigned once | modules/management | design/callsigns.md › Generation callsigns; design/management.md › Deeds and callsigns |
| [MGT-017] | Deed definitions (optional) | modules/management | design/callsigns.md › Earned callsigns |
| [MGT-018] | Deed logging (optional) | modules/management | design/management.md › Deeds and callsigns |
| [MGT-019] | Earned callsign replacement (optional) | modules/management | design/management.md › Soldiers & progression › Earned marks; › Deeds and callsigns |
| [MGT-020] | Fallen keep last callsign (optional) | modules/management | design/management.md › Deeds and callsigns |
| [MGT-021] | Attribute set | modules/management | design/management.md › Soldier attributes |
| [MGT-022] | Attribute generation (open) | modules/management | design/management.md › Soldier attributes › Rules |
| [MGT-023] | Skill growth by use (open) | modules/management | design/management.md › Soldier attributes › Rules |
| [MGT-024] | Physical attribute changes (open) | modules/management | design/management.md › Soldier attributes › Rules |
| [MGT-025] | Skill drift (optional) | modules/management | design/management.md › Soldier attributes › Rules |
| [MGT-026] | Action points | modules/management | design/management.md › Soldier attributes › Derived values; › Tactical Layer (Action points) |
| [MGT-027] | Stamina pool | modules/management | design/management.md › Soldier attributes › Derived values; design/tactical-layer.md › Turn structure (Stamina) |
| [MGT-028] | HP per zone | modules/management | design/management.md › Soldier attributes › Derived values; design/tactical-layer.md › Body zones and hitboxes |
| [MGT-029] | Carry capacity | modules/management | design/management.md › Soldier attributes › Derived values |
| [MGT-030] | Other derived values | modules/management | design/management.md › Soldier attributes › Derived values; design/tactical-actions.md |
| [MGT-031] | Nerve (open; effect optional) | modules/management | design/management.md › Soldier attributes › Nerve |
| [MGT-032] | Inventory model | modules/management | design/management.md › Gear, loot & return |
| [MGT-033] | Carried weight effect (open) | modules/management | design/management.md › Gear, loot & return |
| [MGT-034] | Weapon modding (open) | modules/management | design/management.md › Gear, loot & return |
| [MGT-035] | Loot carried out | modules/management | design/management.md › Gear, loot & return |
| [MGT-036] | Insurance (open) | modules/management | design/management.md › Gear, loot & return › Risk control |
| [MGT-037] | Loadout presets | modules/management | design/management.md › Gear, loot & return › Risk control |
| [MGT-038] | Scav loadout and rebuild floor (open) | modules/management | design/management.md › Gear, loot & return › Design risk |
| [MGT-039] | Faction traders | modules/management | design/management.md › Gear, loot & return › Traders; › Reputation › Standing |
| [MGT-040] | Krug market prices (open) | modules/management | design/management.md › Gear, loot & return › Traders |
| [MGT-041] | Contract origin | modules/management | design/management.md › Contracts and missions › Where contracts come from |
| [MGT-042] | Contract structure | modules/management | design/management.md › Contracts and missions › Contract terms |
| [MGT-043] | Goal to mission mapping | modules/management | design/management.md › Contracts and missions |
| [MGT-044] | Mission outcome conditions (open) | modules/management | design/management.md › Contracts and missions › Mission types; design/design.md › Overview › Core loop |
| [MGT-045] | Bundling missions into an op | modules/management | design/management.md › Contracts and missions |
| [MGT-046] | Contract pay (open) | modules/management | design/management.md › Contracts and missions › Pay bands |
| [MGT-047] | Advance and remainder | modules/management | design/management.md › Contracts and missions › Contract terms; design/design.md › Overview › Core loop; design/strategic-layer.md › Squads and simulation (Faction funds (draft)) |
| [MGT-048] | Contract failure | modules/management | design/management.md › Contracts and missions › Contract terms; design/strategic-layer.md › Squads and simulation (Faction funds (draft)) |
| [MGT-049] | Intel level | modules/management | design/management.md › Contracts and missions › Contract terms |
| [MGT-050] | Deniability (open) | modules/management | design/management.md › Contracts and missions › Contract terms; design.md › Factions |
| [MGT-051] | Contract board and filtering | modules/management | design/management.md › Contracts and missions › Where contracts come from; › Reputation |
| [MGT-052] | Rival PMC competition (open) | modules/management | design/management.md › Contracts and missions › Where contracts come from; › Reputation › Standing |
| [MGT-053] | Reputation value | modules/management | design/management.md › Reputation (draft) |
| [MGT-054] | Standing levels | modules/management | design/management.md › Reputation › Standing |
| [MGT-055] | Standing effects | modules/management | design/management.md › Reputation › Standing |
| [MGT-056] | Contract reputation acts | modules/management | design/management.md › Reputation › What changes reputation; › Contract terms |
| [MGT-057] | Friendly acts | modules/management | design/management.md › Reputation › What changes reputation |
| [MGT-058] | Hostile acts | modules/management | design/management.md › Reputation › What changes reputation |
| [MGT-059] | War crimes | modules/management | design/management.md › Reputation › What changes reputation |
| [MGT-060] | Act application order | modules/management | design/management.md › Reputation (draft) (structure implied; ordering is a spec decision) |
| [MGT-061] | Spill-over to hostile and allied factions (removed) | modules/management | design/management.md › Reputation (draft) (block removed) |
| [MGT-062] | Krug exemption (removed) | modules/management | design/management.md › Reputation (draft) (block removed) |
| [MGT-063] | Rival PMCs follow their patrons (removed) | modules/management | design/management.md › Reputation (draft) (block removed) |
| [MGT-064] | Attribution | modules/management | design/management.md › Reputation › Attribution |
| [MGT-065] | Acquisition paths | modules/management | design/management.md › Base & meta progression |
| [MGT-066] | FOBs (open) | modules/management | design/management.md › Base & meta progression |
| [MGT-067] | Paid field services (open) | modules/management | design/management.md › Base & meta progression |
| [MGT-068] | Industry deliveries (open) | modules/management | design/management.md › Base & meta progression |
| [MGT-069] | FOB raids (open) | modules/management | design/management.md › Base & meta progression |
| [MGT-070] | Economy ledger | modules/management | design/management.md › Contracts and missions › Contract terms; design/design.md › Factions & campaign › Leaders; design/strategic-layer.md › Squads and simulation (Faction funds (draft)) |
| [MGT-071] | Campaign score (open) | modules/management | design/management.md › Base & meta progression |
| [MGT-072] | Management view | modules/management | design/management.md |
| [MGT-073] | Shared economy rules for running costs and income | modules/management | design/management.md › Soldiers & progression (Contracts & morale); design/data-definitions.md › Vehicles (draft) |
| [MGT-074] | Rank and promotion | modules/management | design/management.md › Soldiers & progression (Rank and leadership) |
| [MGT-075] | Squad leader and Leadership bonus | modules/management | design/management.md › Soldiers & progression (Rank and leadership); design/ai.md › Tactical AI |
| [SAI-001] | Controller role | modules/strategic-ai | design/ai.md; design/ai.md › Strategic AI › Controller hand-off; CLAUDE.md › Rules, State ownership |
| [SAI-002] | Invocation | modules/strategic-ai | design/ai.md › Strategic AI › Controller hand-off; › Strategic Layer (Time) |
| [SAI-003] | Strategic perception view | modules/strategic-ai | design/ai.md › Strategic AI › Controller hand-off; › Faction AI tiers; design/strategic-layer.md › Map (Fog of war); › Squads and simulation (Faction funds (draft)) |
| [SAI-004] | Strategic command set | modules/strategic-ai | design/ai.md › Strategic AI › Controller hand-off; › Faction AI tiers; › AI (intro) |
| [SAI-005] | No hidden information, no illegal actions | modules/strategic-ai | design/ai.md (intro); design/ai.md › Tactical AI (last paragraph, applies to both layers) |
| [SAI-006] | Utility scoring | modules/strategic-ai | design/ai.md (intro, Data) |
| [SAI-007] | Tier 1 — situation maps | modules/strategic-ai | design/ai.md › Strategic AI › Faction AI tiers |
| [SAI-008] | Tier 2 — strategist | modules/strategic-ai | design/ai.md › Strategic AI › Faction AI tiers; › Faction behaviour; design/strategic-layer.md › Squads and simulation |
| [SAI-009] | Tier 3 — operational planner | modules/strategic-ai | design/ai.md › Strategic AI › Faction AI tiers; › Controller hand-off; design/management.md › Contracts and missions › Where contracts come from |
| [SAI-010] | Doctrines | modules/strategic-ai | design/ai.md (Data); design/ai.md › Strategic AI › Faction AI tiers; design/design.md › Factions & campaign › Factions |
| [SAI-011] | Decision log | modules/strategic-ai | design/ai.md (Logging) |
| [SAI-012] | Own goals | modules/strategic-ai | design/ai.md › Strategic AI › Faction behaviour |
| [SAI-013] | Hostility toward the player | modules/strategic-ai | design/ai.md › Strategic AI › Faction behaviour; design/management.md › Reputation › Standing |
| [SAI-014] | Contract offers | modules/strategic-ai | design/management.md › Contracts and missions › Where contracts come from; design/ai.md › Strategic AI › Faction AI tiers; › Controller hand-off |
| [SAI-015] | Contract offer evaluation (open) | modules/strategic-ai | design/ai.md › Strategic AI › Faction AI tiers; design/management.md › Contracts and missions › Where contracts come from |
| [SAI-016] | Desperate measure choice | modules/strategic-ai | design/world-events.md › Desperate measures; design/ai.md › Strategic AI |
| [SAI-017] | Krug escort evaluation | modules/strategic-ai | design/ai.md › Strategic AI (Faction AI tiers); design/strategic-actions.md; design/strategic-layer.md › Squads and simulation (draft) (Faction funds) |
| [TAI-001] | Controller role | modules/tactical-ai | design/ai.md › Tactical AI › Controller hand-off; CLAUDE.md › Rules, State ownership |
| [TAI-002] | Invocation | modules/tactical-ai | design/ai.md › Tactical AI › Controller hand-off; design/tactical-layer.md › Turn structure › Reactions |
| [TAI-003] | Pluggable controller | modules/tactical-ai | design/ai.md › Tactical AI (last paragraph); design/tactical-layer.md › Turn structure (neutral side); design/management.md › Contracts and missions (Escort a VIP) |
| [TAI-004] | Tactical perception view | modules/tactical-ai | design/ai.md › Tactical AI › Controller hand-off (1); › Unit scoring; › Tactical Layer (Readability, Path preview); design/tactical-layer.md › Turn structure › Gunshot noise |
| [TAI-005] | Tactical command set | modules/tactical-ai | design/ai.md › Tactical AI › Controller hand-off (3, 4); design/tactical-actions.md (Hold overwatch, Reload, Carry or drag a body, Pick up or loot, Leave the map) |
| [TAI-006] | No hidden information, no illegal actions | modules/tactical-ai | design/ai.md › Tactical AI (last paragraph) |
| [TAI-007] | Utility score | modules/tactical-ai | design/ai.md (intro, Data); design/ai.md › Tactical AI › Unit scoring |
| [TAI-008] | Survival | modules/tactical-ai | design/ai.md › Tactical AI › Unit scoring |
| [TAI-009] | Battle goal (open (threshold values)) | modules/tactical-ai | design/ai.md › Tactical AI › Unit scoring |
| [TAI-010] | Action fit | modules/tactical-ai | design/ai.md › Tactical AI › Unit scoring; design/data-definitions.md › Weapon profile (Weapon type → AI role) |
| [TAI-011] | Coordination | modules/tactical-ai | design/ai.md › Tactical AI › Unit scoring |
| [TAI-012] | Squad blackboard | modules/tactical-ai | design/ai.md › Tactical AI › Unit scoring; CLAUDE.md › State ownership |
| [TAI-013] | Squad leader plan | modules/tactical-ai | design/ai.md › Tactical AI › Unit scoring; design/ai.md › Tactical AI (roles) |
| [TAI-014] | Squad roles | modules/tactical-ai | design/ai.md › Tactical AI; › Tactical Layer (Enemy AI) |
| [TAI-015] | Doctrines | modules/tactical-ai | design/ai.md (Data); CLAUDE.md (data/ai) |
| [TAI-016] | Decision log | modules/tactical-ai | design/ai.md (Logging); design/presentation-tech.md › Prototype tech stack (Debugging) |
| [TAI-017] | Neutral side | modules/tactical-ai | design/tactical-layer.md › Turn structure; design/ai.md › Tactical AI; design/ai.md › Strategic AI › Faction behaviour |
| [TAI-018] | Allied AI units | modules/tactical-ai | design/ai.md › Tactical AI › Controller hand-off (2); design/management.md › Contracts and missions (Escort a VIP) |
| [DAT-001] | Data tables for items and vehicles | /data, tools | design/data-definitions.md; design/item-list.md › Weapons (magazines are items), Grenades |
| [DAT-002] | Common item fields | /data, tools | design/data-definitions.md; design/item-list.md |
| [DAT-003] | Units | /data, tools | design/data-definitions.md; design/tactical-layer.md › Movement; › Strategic Layer |
| [DAT-004] | Definitions versus instance state | /data, tools | design/data-definitions.md (intro); › Weapon profile › State, not profile; design/item-list.md › Weapons (magazine rounds are counted) |
| [DAT-005] | Seven equipment slots (Draft (design: "Draft — not final")) | /data, tools | design/data-definitions.md › Soldier equipment slots (draft); design/tactical-actions.md › Weapons (Swap between weapon 1 and 2) |
| [DAT-006] | Access tiers | /data, tools | design/data-definitions.md › Soldier equipment slots (draft); › Medical system › Using medical items; design/tactical-actions.md › Medical, Gear and interaction |
| [DAT-007] | Everything carried counts toward weight | /data, tools | design/data-definitions.md › Soldier equipment slots (draft) |
| [DAT-008] | Container limits | /data, tools | design/data-definitions.md › Soldier equipment slots (draft) › Type limits; › Gear, loot & return › Inventory |
| [DAT-009] | Plate carrier fills two slots | /data, tools | design/data-definitions.md › Soldier equipment slots (draft) › Type limits; design/item-list.md › Body armour |
| [DAT-010] | Loot and death | /data, tools | design/data-definitions.md › Soldier equipment slots (draft) › Loot, Death |
| [DAT-011] | Weapon profile (Draft (design: "Draft — not final")) | /data, tools | design/data-definitions.md › Weapon profile (draft); design/item-list.md › Weapons; design/tactical-actions.md › Weapons (Fire, Reload) |
| [DAT-012] | Fire modes | /data, tools | design/data-definitions.md › Weapon profile (draft) › Fire modes; design/tactical-actions.md › Weapons |
| [DAT-013] | Base MoA game scale | /data, tools | design/data-definitions.md › Weapon profile (draft) › Base MoA; design/tactical-layer.md › Hit model |
| [DAT-014] | Weapon condition (open) | /data, tools | design/data-definitions.md › Weapon profile (draft) › State, not profile |
| [DAT-015] | Mod slots and handguard sub-slots | /data, tools | design/data-definitions.md › Weapon profile (draft) › Mod slots; › How mods change the profile |
| [DAT-016] | Weapon mod profile (Draft; initial content: none in design/item-list.md (no mods listed)) | /data, tools | design/data-definitions.md › Weapon profile (draft) › How mods change the profile; design/item-list.md › Weapons (magazines are items) |
| [DAT-017] | Tactical modules (open) | /data, tools | design/data-definitions.md › Weapon profile (draft) › Tactical modules |
| [DAT-018] | Suppressors and hearing | /data, tools | design/data-definitions.md › Weapon profile (draft) › How mods change the profile; design/tactical-layer.md › Gunshot noise |
| [DAT-030] | Magazine profile (open) | /data, tools | design/item-list.md › Weapons (Feed type, magazines are items) |
| [DAT-019] | Calibre profile (Draft (design: "Draft — not final")) | /data, tools | design/data-definitions.md › Calibre profile (draft); design/item-list.md › Calibres |
| [DAT-020] | Calibre fit | /data, tools | design/data-definitions.md › Calibre profile (draft) › Designation; design/item-list.md › Weapons (magazines are items) |
| [DAT-021] | Ammunition load profile (Draft (design: "Draft — not final")) | /data, tools | design/data-definitions.md › Calibre profile (draft) › Ammo types; design/item-list.md › Ammunition |
| [DAT-022] | Ammo type defaults (Draft (falloff ranges marked placeholder)) | /data, tools | design/data-definitions.md › Calibre profile (draft) › Ammo types; design/item-list.md › Ammunition |
| [DAT-023] | Per-shot inputs | /data, tools | design/tactical-layer.md › Derived per shot (draft); design/data-definitions.md › Calibre profile (draft) |
| [DAT-024] | Vehicle profile (Draft (design: "Draft — not final")) | /data, tools | design/data-definitions.md › Vehicles (draft) › Vehicle parameters |
| [DAT-025] | A squad has at most one vehicle | /data, tools | design/data-definitions.md › Vehicles (draft) |
| [DAT-026] | Vehicle features (open) | /data, tools | design/data-definitions.md › Vehicles (draft) › Vehicles table |
| [DAT-027] | Vehicle availability | /data, tools | design/data-definitions.md › Vehicles (draft) › Buying and selling, Start; design/management.md › Reputation › Standing |
| [DAT-028] | Helicopter data | /data, tools | design/data-definitions.md › Vehicles (draft) › Helicopters (draft) |
| [DAT-029] | Vehicle instance state and loss (open) | /data, tools | design/data-definitions.md › Vehicles (draft) › Loss |
| [ITM-001] | Weapon items | /data, tools | design/item-list.md › Weapons |
| [ITM-002] | Calibre items | /data, tools | design/item-list.md › Calibres |
| [ITM-003] | Ammunition load items | /data, tools | design/item-list.md › Ammunition |
| [ITM-004] | Standard damage modifiers | /data, tools | design/item-list.md › Ammunition |
| [ITM-005] | Falloff floor | /data, tools | design/item-list.md › Ammunition; design/tactical-layer.md › Derived per shot (draft) |
| [ITM-006] | Penetration class | /data, tools | design/item-list.md › Ammunition; design/tactical-layer.md › Derived per shot (draft) |
| [ITM-007] | Subsonic through a suppressor | /data, tools | design/item-list.md › Ammunition; design/tactical-layer.md › Gunshot noise |
| [ITM-008] | Load-specific damage and projectiles | /data, tools | design/item-list.md › Calibres (intro and 12 gauge row) |
| [ITM-031] | Magazine items (open (weights; which other weapons share patterns)) | /data, tools | design/item-list.md › Weapons (Feed type, magazines are items) |
| [ITM-009] | Helmet items | /data, tools | design/item-list.md › Helmets |
| [ITM-010] | Helmet hearing and vision | /data, tools | design/item-list.md › Helmets; design/tactical-layer.md › Gunshot noise |
| [ITM-011] | Body armour items | /data, tools | design/item-list.md › Body armour |
| [ITM-012] | Armour durability | /data, tools | design/data-definitions.md › Soldier equipment slots (draft); design/tactical-layer.md › Derived per shot (draft) |
| [ITM-013] | Vest items | /data, tools | design/item-list.md › Load-bearing vests |
| [ITM-014] | Pouch type limits | /data, tools | design/item-list.md › Load-bearing vests; › Weapons (magazines are items); › Grenades; design/data-definitions.md › Soldier equipment slots (draft) › Type limits |
| [ITM-015] | Other items | /data, tools | design/item-list.md › Load-bearing vests |
| [ITM-016] | Pouch item weight limit | /data, tools | design/item-list.md › Load-bearing vests |
| [ITM-017] | Battle belt items (open (holster meaning)) | /data, tools | design/item-list.md › Battle belts |
| [ITM-018] | Backpack items | /data, tools | design/item-list.md › Backpacks |
| [ITM-019] | Medical items | /data, tools | design/item-list.md › Medical items; design/tactical-layer.md › Medical system (draft) |
| [ITM-020] | Medical item restrictions | /data, tools | design/item-list.md › Medical items; design/tactical-layer.md › Medical system (draft) › Using medical items |
| [ITM-032] | Grenade items (Draft (design: "Draft — placeholder values")) | /data, tools | design/item-list.md › Grenades |
| [ITM-033] | Mod items | /data, tools | design/item-list.md › Mods |
| [ITM-034] | Trader prices | /data, tools | design/item-list.md › Weapons (Trader prices) |
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
| [TEC-001] | Character triangle budget | game/, tools/ | design/presentation-tech.md › Art direction › Retro base |
| [TEC-002] | Texture size and filtering | game/, tools/ | design/presentation-tech.md › Art direction › Retro base |
| [TEC-003] | Internal render resolution | game/, tools/ | design/presentation-tech.md › Art direction › Retro base |
| [TEC-004] | Palette and dithering (open) | game/, tools/ | design/presentation-tech.md › Art direction › Retro base |
| [TEC-005] | PSX quirks toggle (optional) | game/, tools/ | design/presentation-tech.md › Art direction › Retro base |
| [TEC-006] | Dynamic lighting and effects | game/, tools/ | design/presentation-tech.md › Art direction › Modern layer |
| [TEC-007] | Quality tiers | game/, tools/ | design/presentation-tech.md › Art direction › Why it fits the browser |
| [TEC-008] | Rendering never drives rules | game/, tools/ | design/presentation-tech.md › Art direction › Modern layer; › Tactical Layer (Time of day) |
| [TEC-009] | Placeholder art first | game/, tools/ | design/presentation-tech.md › Prototype tech stack (Art) |
| [TEC-010] | Engine and graphics API | game/, tools/ | design/presentation-tech.md › UX, tech & scope (Engine); › Prototype tech stack |
| [TEC-011] | No build step | game/, tools/ | design/presentation-tech.md › Prototype tech stack (Language, Build, Menus); CLAUDE.md › Stack |
| [TEC-012] | Engine-independent rules core | game/, tools/ | design/presentation-tech.md › Prototype tech stack (Rules core); CLAUDE.md › Dependency direction |
| [TEC-013] | HTML/CSS menus | game/, tools/ | design/presentation-tech.md › Prototype tech stack (Menus and inventory) |
| [TEC-014] | JSON data with schemas | game/, tools/ | design/presentation-tech.md › Prototype tech stack (Language, Game data) |
| [TEC-015] | Seeded randomness and reproducibility | game/, tools/ | design/presentation-tech.md › Prototype tech stack (Randomness) |
| [TEC-016] | Debug overlay | game/, tools/ | design/presentation-tech.md › Prototype tech stack (Debugging) |
| [TEC-017] | Hosting and deployment (open) | game/, tools/ | design/presentation-tech.md › Prototype tech stack (Hosting) |
| [TEC-018] | Key screens | game/, tools/ | design/presentation-tech.md › UX, tech & scope (Key screens) |
| [TEC-019] | Vertical slice | game/, tools/ | design/presentation-tech.md › UX, tech & scope (Vertical slice goal) |
| [TEC-020] | Feature build order | game/, tools/ | design/presentation-tech.md › Prototype tech stack › Build order |
| [TEC-021] | Mouse and touch parity | game/, tools/ | design/presentation-tech.md › Browser and mobile constraints (Input); › Tactical Layer (Camera) |
| [TEC-022] | Select and shot preview | game/, tools/ | design/presentation-tech.md › Browser and mobile constraints (Input) |
| [TEC-023] | Explicit confirm for moves and shots | game/, tools/ | design/presentation-tech.md › Browser and mobile constraints (Input); › Tactical Layer (Movement) |
| [TEC-024] | No hover-only information | game/, tools/ | design/presentation-tech.md › Browser and mobile constraints (Input) |
| [TEC-025] | Phone layout | game/, tools/ | design/presentation-tech.md › Browser and mobile constraints (UI) |
| [TEC-026] | Frame-rate budget | game/, tools/ | design/presentation-tech.md › Browser and mobile constraints (Performance budget) |
| [TEC-027] | Download budget and streaming | game/, tools/ | design/presentation-tech.md › Browser and mobile constraints (Performance budget) |
| [TEC-028] | Local saves | game/, tools/ | design/presentation-tech.md › Browser and mobile constraints (Saves); CLAUDE.md › Stack |
| [TEC-029] | Cloud save (removed) | game/, tools/ | design/presentation-tech.md › Browser and mobile constraints (Saves) |
| [TEC-030] | Save mode | game/, tools/ | design/presentation-tech.md › Open questions |
| [TEC-031] | Save file export and import | game/, tools/ | design/presentation-tech.md › UX, tech & scope (Saves) |
| [TEC-032] | Save versioning and migrations | game/, tools/ | design/presentation-tech.md › UX, tech & scope (Saves) |

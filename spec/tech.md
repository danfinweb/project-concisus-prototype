# Presentation and tech — spec [TEC]

Precise rules derived from `design/`. Each section: `### [TEC-NNN] Title`, then the rule
(inputs, outputs, formula, ranges), its design source, and `→ data/<table>.json` where a concrete value
lives in data. Edited only through `/update-spec`.

**Art direction (intent).** Late-90s 3D in the PlayStation 1 / early-PC style — chunky, readable low-poly
shapes and small pixel textures — rendered with a modern lighting layer: dynamic lights, real-time shadows,
volumetric fog and smoke, bloom, day/night and weather, for a moody atmosphere (references: Metal Gear Solid
1998, Syphon Filter, Rainbow Six 1998). The low internal resolution and small assets double as the browser and
mobile performance strategy. The concrete render constraints below carry IDs. Lighting is atmosphere: the only
light-dependent gameplay rule is the night sight rule of TAC (Time of day); smoke and noise feed the TAC
stealth and visibility rules. Babylon.js remains an option for the full game; the rules core is
engine-independent so a switch does not touch game logic.

## Render constraints

### [TEC-001] Character triangle budget
**Rule.** A character model has between `charTrianglesMin` and `charTrianglesMax` triangles. Asset checks
flag models outside the range.
**Values.** `charTrianglesMin` — design 500; `charTrianglesMax` — design 2,000 (both "roughly") →
data/presentation.json (proposed new table).
**Source.** design/design.md › Presentation & tech › Art direction › Retro base

### [TEC-002] Texture size and filtering
**Rule.** Textures are `textureMinPx`–`textureMaxPx` per side and sampled with nearest-neighbour filtering
(no mipmap blur, no linear filtering).
**Values.** `textureMinPx` — design 64; `textureMaxPx` — design 256 → data/presentation.json.
**Source.** design/design.md › Presentation & tech › Art direction › Retro base

### [TEC-003] Internal render resolution
**Rule.** The 3D scene renders into an offscreen target of internal height `renderHeightMin`–
`renderHeightMax` px (width by aspect ratio) and is upscaled to the screen with nearest-neighbour (crisp
pixels). HTML UI renders at native resolution on top.
**Values.** `renderHeightMin` — design 360; `renderHeightMax` — design 480 ("e.g.") → data/presentation.json.
**Source.** design/design.md › Presentation & tech › Art direction › Retro base

### [TEC-004] Palette and dithering
**Rule.** The upscaled image passes a limited-palette quantisation with ordered dithering.
**Values.** palette size, dither matrix — not set (design: Open) → data/presentation.json.
**Status.** open
**Source.** design/design.md › Presentation & tech › Art direction › Retro base

### [TEC-005] PSX quirks toggle
**Rule.** A settings toggle enables vertex jitter, affine texture warping and a short draw distance hidden
by fog. Default off. The toggle never changes game rules (line of sight and spotting are computed by TAC,
not from the rendered image).
**Values.** draw distance, jitter strength — not set (design: Open) → data/presentation.json.
**Status.** optional
**Source.** design/design.md › Presentation & tech › Art direction › Retro base

### [TEC-006] Dynamic lighting and effects
**Rule.** The renderer supports dynamic lights from muzzle flashes, flashlights, flares and explosions with
real-time shadows; volumetric fog and smoke; bloom; day/night and weather. Battle lighting follows the TAC
time of day (day or night battle).
**Source.** design/design.md › Presentation & tech › Art direction › Modern layer

### [TEC-007] Quality tiers
**Rule.** Effects scale by quality tier. At least two tiers: `phone` (baked lighting, few shadow casters) and
`desktop` (full effects). The tier is chosen at start (device detection) and can be changed in settings.
**Values.** tier list, shadow caster count per tier, detection rule — not set (design: "few") →
data/presentation.json.
**Source.** design/design.md › Presentation & tech › Art direction › Why it fits the browser

### [TEC-008] Rendering never drives rules
**Rule.** No game rule reads render output, light levels or quality tier. Night spotting (a third of day
range without a flashlight) is TAC; TEC only renders it.
**Source.** design/design.md › Presentation & tech › Art direction › Modern layer; › Tactical Layer (Time of day)

### [TEC-009] Placeholder art first
**Rule.** The first builds use plain boxes and flat colours; the PSX look (TEC-002 to TEC-005) comes later.
Gameplay must be fully playable with placeholder art.
**Source.** design/design.md › Presentation & tech › Prototype tech stack (Art)

## Engine and stack

### [TEC-010] Engine and graphics API
**Rule.** The prototype renders with Three.js, loaded through an import map. WebGL2 is the baseline; WebGPU
is used where available. The game must run on WebGL2 alone.
**Source.** design/design.md › Presentation & tech › UX, tech & scope (Engine); › Prototype tech stack

### [TEC-011] No build step
**Rule.** Plain JavaScript ES modules; no Node.js, bundler, npm or TypeScript. The game, tools and tests run
with a browser and the static server `tools/serve.ps1`. Every file in the repo is the file that runs.
Optional UI libraries (Preact or Svelte) may be used only if loadable without a build step.
**Source.** design/design.md › Presentation & tech › Prototype tech stack (Language, Build, Menus); CLAUDE.md › Stack

### [TEC-012] Engine-independent rules core
**Rule.** Combat, stamina, reactions, damage and faction simulation live in module `core/` folders without
DOM, Three.js or fetch, and are tested in the browser (Test Lab, tests pages) without starting the game.
**Source.** design/design.md › Presentation & tech › Prototype tech stack (Rules core); CLAUDE.md › Dependency direction

### [TEC-013] HTML/CSS menus
**Rule.** Menus, inventory lists, dossiers and traders are HTML/CSS layered over the 3D view.
**Source.** design/design.md › Presentation & tech › Prototype tech stack (Menus and inventory)

### [TEC-014] JSON data with schemas
**Rule.** Game data (weapons, calibres, armour, vehicles, soldiers, …) is JSON in `/data`, checked against
JSON Schemas (`shared/schema.js`) at load and by the data check page. Balancing changes data, not code.
**Source.** design/design.md › Presentation & tech › Prototype tech stack (Language, Game data)

### [TEC-015] Seeded randomness and reproducibility
**Rule.** All randomness in rules and generation comes from the seeded generator (`shared/rng.js`). Same
seed and same inputs give the same map and the same shots, so a bug is reproducible from a seed and a turn.
**Source.** design/design.md › Presentation & tech › Prototype tech stack (Randomness)

### [TEC-016] Debug overlay
**Rule.** The game has a toggleable debug overlay showing AP, stamina, line of sight and the spread cone
(and, per TAI-016, AI decision logs where available).
**Source.** design/design.md › Presentation & tech › Prototype tech stack (Debugging)

### [TEC-017] Hosting and deployment
**Rule.** The game deploys as a static site on every push, reachable on desktop and phone within about a
minute.
**Values.** host — design: Cloudflare Pages, Netlify or GitHub Pages (not chosen).
**Status.** open
**Source.** design/design.md › Presentation & tech › Prototype tech stack (Hosting)

## Screens and scope

### [TEC-018] Key screens
**Rule.** The game has these screens: strategic map, squad/loadout, inventory lists, tactical HUD with shot
preview, soldier dossier, trader.
**Source.** design/design.md › Presentation & tech › UX, tech & scope (Key screens)

### [TEC-019] Vertical slice
**Rule.** The vertical slice contains 1 strategic map, 1 FOB, 1 operation map, 6 soldiers, 15 weapons and
1 trader, and runs the full loop end to end.
**Values.** slice counts as listed (scope target, not balancing).
**Source.** design/design.md › Presentation & tech › UX, tech & scope (Vertical slice goal)

### [TEC-020] Feature build order
**Rule.** Features are built in this order: 1. tactical grid with boxes, movement and AP; 2. line of sight,
vision cone and reactions; 3. shooting with spread cone, body zones and armour; 4. stamina and alternating
activations; 5. inventory and loadout in HTML; 6. a small strategic map, one FOB and one full op loop. One
feature per iteration, deployed and tested on desktop and phone. Features tagged OPTIONAL (hidden cities,
earned callsigns) are excluded from the first iterations.
**Source.** design/design.md › Presentation & tech › Prototype tech stack › Build order

## Input and UI

### [TEC-021] Mouse and touch parity
**Rule.** Every action is possible with mouse alone and with touch alone. Camera: mouse wheel / pinch for
zoom; rotation via Q/E or an on-screen button (TAC camera).
**Source.** design/design.md › Presentation & tech › Browser and mobile constraints (Input); › Tactical Layer (Camera)

### [TEC-022] Select and shot preview
**Rule.** Tap (or click) selects. Tap-hold shows the shot preview (hit %, likely body zone, penetration,
TAC); the mouse equivalent shows the same preview without hover dependency (TEC-024).
**Values.** tap-hold duration — not set (design: Open) → data/presentation.json.
**Source.** design/design.md › Presentation & tech › Browser and mobile constraints (Input)

### [TEC-023] Explicit confirm for moves and shots
**Rule.** A move or a shot is executed only after an explicit confirm button press; selecting a target tile or
unit only previews (path with AP cost, shot preview). On mobile: tap to preview, tap again (confirm) to
execute.
**Source.** design/design.md › Presentation & tech › Browser and mobile constraints (Input); › Tactical Layer (Movement)

### [TEC-024] No hover-only information
**Rule.** Every piece of information shown on hover is also reachable by tap/selection. Tests: each tooltip
has a non-hover trigger.
**Source.** design/design.md › Presentation & tech › Browser and mobile constraints (Input)

### [TEC-025] Phone layout
**Rule.** Menus and inventory work in portrait on phones; inventory rows and tap targets are large on touch.
**Values.** minimum tap target and row height — not set (design: "large") → data/presentation.json.
**Source.** design/design.md › Presentation & tech › Browser and mobile constraints (UI)

## Performance and saves

### [TEC-026] Frame-rate budget
**Rule.** The game holds at least `fpsPhone` on a mid-range phone and `fpsDesktop` on desktop.
**Values.** `fpsPhone` — design 30; `fpsDesktop` — design 60 → data/presentation.json; reference devices —
not set (design: "mid-range phone").
**Source.** design/design.md › Presentation & tech › Browser and mobile constraints (Performance budget)

### [TEC-027] Download budget and streaming
**Rule.** First load stays under `firstLoadMaxMb`; operation maps are streamed in when needed, not part of the
first load.
**Values.** `firstLoadMaxMb` — design ~50 → data/presentation.json.
**Source.** design/design.md › Presentation & tech › Browser and mobile constraints (Performance budget)

### [TEC-028] Local saves
**Rule.** Campaigns save locally in IndexedDB (settings and small values may use `localStorage`). A save holds
the state slices (`world`, `battle`, `roster`, `unlocks`, `economy`, `contracts`, `reputation`) and the RNG
state, so loading reproduces the same continuation.
**Source.** design/design.md › Presentation & tech › Browser and mobile constraints (Saves); CLAUDE.md › Stack

### [TEC-029] Cloud save
**Rule.** An optional cloud save lets a campaign continue between PC and phone.
**Status.** optional
**Source.** design/design.md › Presentation & tech › Browser and mobile constraints (Saves)

### [TEC-030] Save mode
**Rule.** Difficulty modes may restrict saving (Ironman only, or save-anywhere).
**Status.** open
**Source.** design/design.md › Presentation & tech › Open questions

## Open questions

1. TEC-017 — Hosting provider not chosen.
2. TEC-030 — Difficulty modes: Ironman save only, or save-anywhere?
3. TEC-029 — Cloud save provider and conflict handling between devices; requires a server, which contradicts
   a purely static site (TEC-017).
4. TEC-026 — Reference devices for "mid-range phone" and desktop are not named.
5. TEC-004/TEC-005/TEC-007/TEC-022/TEC-025 — Palette size, dither matrix, PSX quirk strengths, shadow
   casters per tier, tap-hold duration, tap target size are not set.
6. TEC-011 — Preact or Svelte without a build step (Svelte needs compilation): keep both as options?
7. TEC-028 — Save format versioning and migration across data changes are not designed.
8. Design open questions outside spec scope: solo or team project and release window; optional co-op
   operations.
9. TEC-019 — The vertical slice names 15 weapons; the item list has 18.

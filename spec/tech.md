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
data/presentation.json (listed in data/tables.json).
**Source.** design/presentation-tech.md › Art direction › Retro base

### [TEC-002] Texture size and filtering
**Rule.** Textures are `textureMinPx`–`textureMaxPx` per side and sampled with nearest-neighbour filtering
(no mipmap blur, no linear filtering).
**Values.** `textureMinPx` — design 64; `textureMaxPx` — design 256 → data/presentation.json.
**Source.** design/presentation-tech.md › Art direction › Retro base

### [TEC-003] Internal render resolution
**Rule.** The 3D scene renders into an offscreen target of internal height `renderHeightMin`–
`renderHeightMax` px (width by aspect ratio) and is upscaled to the screen with nearest-neighbour (crisp
pixels). HTML UI renders at native resolution on top.
**Values.** `renderHeightMin` — design 360; `renderHeightMax` — design 480 ("e.g.") → data/presentation.json.
**Source.** design/presentation-tech.md › Art direction › Retro base

### [TEC-004] Palette and dithering
**Rule.** The upscaled image passes a limited-palette quantisation with ordered dithering: each colour
channel is quantised to `colourLevelsPerChannel` levels (15-bit colour = 32 levels per channel), with an
ordered-dither threshold from `ditherMatrix` (a 4×4 Bayer matrix) added before quantisation.
**Values.** `colourLevelsPerChannel` — 32 (design draft: 15-bit colour); `ditherMatrix` — the 4×4 Bayer
matrix (design draft) → data/presentation.json.
**Source.** design/presentation-tech.md › Art direction › Retro base

### [TEC-005] PSX quirks toggle
**Rule.** A settings toggle enables vertex jitter (vertices snapped to a `psxQuirks.vertexSnapGrid` screen
grid), affine texture warping and a short draw distance hidden by fog starting at `psxQuirks.fogStartM`.
Default off. The toggle never changes game rules (line of sight and spotting are computed by TAC, not from
the rendered image).
**Values.** `psxQuirks.vertexSnapGrid` — `{ width 320, height 240 }` (design draft); `psxQuirks.fogStartM`
— 60 m (design draft) → data/presentation.json.
**Status.** optional
**Source.** design/presentation-tech.md › Art direction › Retro base

### [TEC-006] Dynamic lighting and effects
**Rule.** The renderer supports dynamic lights from muzzle flashes, flashlights, flares and explosions with
real-time shadows; volumetric fog and smoke; bloom; day/night and weather. Battle lighting follows the TAC
time of day (day or night battle).
**Source.** design/presentation-tech.md › Art direction › Modern layer

### [TEC-007] Quality tiers
**Rule.** Effects scale by quality tier. At least two tiers: `phone` (baked lighting, few shadow casters) and
`desktop` (full effects). The tier is picked automatically at start: first from the device type (a phone or
tablet starts as `phone`, anything else as `desktop`; spec reading of "device type"), then a short frame-time
test confirms it: if the mean frame time over the test is above the picked tier's threshold, the next lower
tier is used. The player can override the tier in the settings; the override is a player setting stored with
the settings (not data) and replaces the automatic pick until it is cleared.
**Values.** `qualityTiers` (`{ id, bakedLighting, shadowCasters }` per tier) — `phone` baked lighting, 2
shadow casters; `desktop` full effects, 8 shadow casters (design draft) → data/presentation.json;
`tierDetection.testDurationMs` (length of the frame-time test) and `tierDetection.maxFrameTimeMs` (per tier
ID, the mean frame time above which the next lower tier is used) — not set (design: names the test, no
values) → data/presentation.json.
**Source.** design/presentation-tech.md › Art direction › Why it fits the browser

### [TEC-008] Rendering never drives rules
**Rule.** No game rule reads render output, light levels or quality tier. Night spotting (a third of day
range without a flashlight) is TAC; TEC only renders it.
**Source.** design/presentation-tech.md › Art direction › Modern layer; design/tactical-layer.md › Overview (Time of day)

### [TEC-009] Placeholder art first
**Rule.** The first builds use plain boxes and flat colours; the PSX look (TEC-002 to TEC-005) comes later.
Gameplay must be fully playable with placeholder art.
**Source.** design/presentation-tech.md › Prototype tech stack (Art)

## Engine and stack

### [TEC-010] Engine and graphics API
**Rule.** The prototype renders with Three.js, loaded through an import map. WebGL2 is the baseline; WebGPU
is used where available. The game must run on WebGL2 alone.
**Source.** design/presentation-tech.md › UX, tech & scope (Engine); › Prototype tech stack

### [TEC-011] No build step
**Rule.** Plain JavaScript ES modules; no Node.js, bundler, npm or TypeScript. The game, tools and tests run
with a browser and the static server `tools/serve.ps1`. Every file in the repo is the file that runs.
UI libraries are limited to Preact + htm (TEC-013), loaded through the import map; Svelte (needs
compilation) is not used.
**Source.** design/presentation-tech.md › Prototype tech stack (Language, Build, Menus); CLAUDE.md › Stack

### [TEC-012] Engine-independent rules core
**Rule.** Combat, stamina, reactions, damage and faction simulation live in module `core/` folders without
DOM, Three.js or fetch, and are tested in the browser (Test Lab, tests pages) without starting the game.
**Source.** design/presentation-tech.md › Prototype tech stack (Rules core); CLAUDE.md › Dependency direction

### [TEC-013] HTML/CSS menus
**Rule.** Menus, inventory lists, dossiers and traders are HTML/CSS layered over the 3D view, built with
Preact + htm (tagged templates, no JSX compile step) loaded through the import map. UI code lives in
`game/` (or a module `adapter/`), never in `core/`.
**Source.** design/presentation-tech.md › Prototype tech stack (Menus and inventory)

### [TEC-014] JSON data with schemas
**Rule.** Game data (weapons, calibres, armour, vehicles, soldiers, …) is JSON in `/data`, checked against
JSON Schemas (`shared/schema.js`) at load and by the data check page. Balancing changes data, not code.
**Source.** design/presentation-tech.md › Prototype tech stack (Language, Game data)

### [TEC-015] Seeded randomness and reproducibility
**Rule.** All randomness in rules and generation comes from the seeded generator (`shared/rng.js`). Same
seed and same inputs give the same map and the same shots, so a bug is reproducible from a seed and a turn.
**Source.** design/presentation-tech.md › Prototype tech stack (Randomness)

### [TEC-016] Debug overlay
**Rule.** The game has a toggleable debug overlay showing AP, stamina, line of sight and the spread cone
(and, per TAI-016, AI decision logs where available).
**Source.** design/presentation-tech.md › Prototype tech stack (Debugging)

### [TEC-017] Hosting and deployment
**Rule.** The game deploys as a static site on GitHub Pages on every push, reachable on desktop and phone
within about a minute. The deployed site is static only: no server-side code (the dev-only write endpoint
of `tools/serve.ps1` is not deployed).
**Values.** host — GitHub Pages (design decision 2026-11-24).
**Source.** design/presentation-tech.md › Prototype tech stack (Hosting)

## Screens and scope

### [TEC-018] Key screens
**Rule.** The game has these screens: strategic map, squad/loadout, inventory lists, tactical HUD with shot
preview, soldier dossier, trader.
**Source.** design/presentation-tech.md › UX, tech & scope (Key screens)

### [TEC-019] Vertical slice
**Rule.** The vertical slice contains 1 strategic map, 1 FOB, 1 operation map, 6 soldiers, 18 weapons (all
18 weapons of the item list, ITM-001) and 1 trader, and runs the full loop end to end.
**Values.** slice counts as listed (scope target, not balancing).
**Source.** design/presentation-tech.md › UX, tech & scope (Vertical slice goal)

### [TEC-020] Feature build order
**Rule.** Features are built in this order: 1. tactical grid with boxes, movement and AP; 2. line of sight,
vision cone and reactions; 3. shooting with spread cone, body zones and armour; 4. stamina and alternating
activations; 5. inventory and loadout in HTML; 6. a small strategic map, one FOB and one full op loop. One
feature per iteration, deployed and tested on desktop and phone. Features tagged OPTIONAL (hidden cities,
earned callsigns) are excluded from the first iterations.
**Source.** design/presentation-tech.md › Prototype tech stack › Build order

## Input and UI

### [TEC-021] Mouse and touch parity
**Rule.** Every action is possible with mouse alone and with touch alone. Camera: mouse wheel / pinch for
zoom; rotation via Q/E or an on-screen button (TAC camera).
**Source.** design/presentation-tech.md › Browser and mobile constraints (Input); design/tactical-layer.md › Overview (Camera)

### [TEC-022] Select and shot preview
**Rule.** Tap (or click) selects. Tap-hold shows the shot preview (hit %, likely body zone, penetration,
TAC); the mouse equivalent shows the same preview without hover dependency (TEC-024).
**Values.** `tapHoldMs` — 400 (design draft) → data/presentation.json.
**Source.** design/presentation-tech.md › Browser and mobile constraints (Input)

### [TEC-023] Explicit confirm for moves and shots
**Rule.** A move or a shot is executed only after an explicit confirm button press; selecting a target tile or
unit only previews (path with AP cost, shot preview). On mobile: tap to preview, tap again (confirm) to
execute.
**Source.** design/presentation-tech.md › Browser and mobile constraints (Input); design/tactical-layer.md › Overview (Movement)

### [TEC-024] No hover-only information
**Rule.** Every piece of information shown on hover is also reachable by tap/selection. Tests: each tooltip
has a non-hover trigger.
**Source.** design/presentation-tech.md › Browser and mobile constraints (Input)

### [TEC-025] Phone layout
**Rule.** Menus and inventory work in portrait on phones; inventory rows and tap targets are large on touch.
**Values.** `minTapTargetPx` — 48 (design draft: "at least 48 px") → data/presentation.json;
`minRowHeightPx` — not set separately (design draft names one size for rows and tap targets; use
`minTapTargetPx` unless set) → data/presentation.json.
**Source.** design/presentation-tech.md › Browser and mobile constraints (UI)

## Performance and saves

### [TEC-026] Frame-rate budget
**Rule.** The game holds at least `fpsPhone` on a mid-range phone and `fpsDesktop` on desktop.
The budget is checked on the reference devices.
**Values.** `fpsPhone` — design 30; `fpsDesktop` — design 60; `referenceDevices` — phone: Samsung Galaxy
A54 or iPhone 12; desktop: a laptop with Intel Iris Xe graphics at 1080p (design draft) →
data/presentation.json.
**Source.** design/presentation-tech.md › Browser and mobile constraints (Performance budget)

### [TEC-027] Download budget and streaming
**Rule.** First load stays under `firstLoadMaxMb`; operation maps are streamed in when needed, not part of the
first load.
**Values.** `firstLoadMaxMb` — design ~50 → data/presentation.json.
**Source.** design/presentation-tech.md › Browser and mobile constraints (Performance budget)

### [TEC-028] Local saves
**Rule.** Campaigns save locally in IndexedDB only (settings and small values may use `localStorage`); there
is no cloud server. A save holds the state slices (`world`, `battle`, `roster`, `unlocks`, `economy`,
`contracts`, `reputation`), the RNG state, the campaign's save mode (TEC-030) and its `SAVE_VERSION`
(TEC-032), so loading reproduces the same continuation.
**Source.** design/presentation-tech.md › Browser and mobile constraints (Saves); CLAUDE.md › Stack

### [TEC-029] Cloud save (removed)
**Rule.** Removed in design 06e571f: there is no cloud server. Moving a campaign between devices is done
by exporting and importing a save file (TEC-031).
**Source.** design/presentation-tech.md › Browser and mobile constraints (Saves)

### [TEC-030] Save mode
**Rule.** At campaign start the player chooses the save mode, stored with the campaign and fixed for it:
- `ironman`: one save slot per campaign, written automatically (the game saves on every state change that
  ends a player step, and on leaving the game); the player cannot save or load by hand, and loading resumes
  the latest state.
- `saveAnywhere`: the player may save to and load from slots at any time.
When exactly Ironman autosaves (every state change or fixed points) is a spec choice: at least after every
strategic step and every tactical activation, so no rollback is possible by closing the tab.
**Source.** design/presentation-tech.md › Browser and mobile constraints (Saves); › Open questions (Difficulty modes, decided 2026-11-24)

### [TEC-031] Save file export and import
**Rule.** The player can export a campaign save to a file (download of one JSON file holding the full save
of TEC-028) and import such a file on any device, which adds it as a local save. This is the only way to
continue a campaign on another device. An import is validated (JSON Schema check of the save envelope,
`SAVE_VERSION` known or migratable, TEC-032) before it is stored; an invalid file is rejected with an error
and changes nothing. An imported Ironman save stays Ironman.
**Source.** design/presentation-tech.md › Browser and mobile constraints (Saves)

### [TEC-032] Save versioning and migrations
**Rule.** Every save stores the `SAVE_VERSION` (integer, raised whenever the saved state's shape changes)
of the build that wrote it. Loading a save with an older `SAVE_VERSION` runs the migrations step by step
(`n → n+1`, one migration function per step, in order) until it reaches the current version; each step is a
pure function of the saved data. A save with a newer `SAVE_VERSION` than the build, or with a missing
migration step, is not loaded (error shown, save kept untouched).
**Source.** design/presentation-tech.md › Browser and mobile constraints (Saves)

## Open questions

1. **Resolved (2026-11-24):** GitHub Pages (TEC-017). TEC-017 — Hosting provider not chosen.
2. **Resolved (2026-11-24):** Ironman or save-anywhere, chosen at campaign start (TEC-030). TEC-030 —
   Difficulty modes: Ironman save only, or save-anywhere?
3. **Resolved (2026-11-24):** no cloud server; local saves plus save-file export/import (TEC-029 removed,
   TEC-031). TEC-029 — Cloud save provider and conflict handling between devices; requires a server, which
   contradicts a purely static site (TEC-017).
4. **Resolved (2026-11-24):** draft reference devices Samsung Galaxy A54 / iPhone 12 and an Intel Iris Xe
   laptop at 1080p (TEC-026). TEC-026 — Reference devices for "mid-range phone" and desktop are not named.
5. **Resolved (2026-11-24):** design drafts 15-bit colour (32 levels per channel), 4×4 Bayer, 320×240 vertex
   grid, fog from 60 m, 2/8 shadow casters, 400 ms tap-hold, 48 px tap targets (TEC-004, TEC-005, TEC-007,
   TEC-022, TEC-025). **Resolved (2026-11-24):** the tier is picked automatically from the device type and
   a short frame-time test at start; the player can override it in the settings (TEC-007); test length and
   frame-time thresholds stay unset (`tierDetection.testDurationMs`, `tierDetection.maxFrameTimeMs`). TEC-004/TEC-005/TEC-007/TEC-022/TEC-025 — Palette
   size, dither matrix, PSX quirk strengths, shadow casters per tier, tap-hold duration, tap target size are
   not set.
6. **Resolved (2026-11-24):** Preact + htm through the import map (TEC-011, TEC-013). TEC-011 — Preact or
   Svelte without a build step (Svelte needs compilation): keep both as options?
7. **Resolved (2026-11-24):** saves store `SAVE_VERSION`; step-by-step migrations (TEC-032). TEC-028 — Save
   format versioning and migration across data changes are not designed.
8. Design open questions outside spec scope: solo or team project and release window; optional co-op
   operations.
9. **Resolved (2026-11-24):** the slice uses all 18 weapons (TEC-019). TEC-019 — The vertical slice names 15
   weapons; the item list has 18.
10. **Resolved (cleanup 2026-11-23):** every TEC Values line names a `data/presentation.json` field
    (`ditherMatrix`, `psxQuirks.drawDistance`, `psxQuirks.jitterStrength`, `tierDetection`, `minRowHeightPx`
    added); presentation.json is an existing table (data/tables.json).

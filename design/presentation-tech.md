# Concisus – Presentation & tech

Nov 24, 2026 · @Dan

The `game/` shell: rendering, UI, saves and the prototype tech stack. Part of the [Concisus – Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo), which holds the overview, factions & campaign and the module map.

## Art direction

Late-90s 3D (PlayStation 1 / early PC era) rendered with modern lighting: chunky, readable shapes in moody, dynamic light.

**Retro base**

- Low-poly models (roughly 500–2,000 triangles per character), small textures (64–256 px) with nearest-neighbour filtering.
- Low internal render resolution (e.g. 360–480 px tall) upscaled with crisp pixels, limited palette and ordered dithering (draft: 15-bit colour, 32 levels per channel, 4×4 Bayer matrix).
- Optional PSX quirks as a toggle: vertex jitter, affine texture warping, short draw distance hidden by fog (draft: vertices snapped to a 320×240 grid, fog from 60 m).
- Era references for mood: Metal Gear Solid (1998), Syphon Filter, Rainbow Six (1998).

**Modern layer**

- Dynamic lights from muzzle flashes, flashlights, flares and explosions, with real-time shadows.
- Volumetric fog and smoke, bloom, day/night and weather.
- Lighting is mostly atmosphere: at night, sight and spotting ranges drop to a third, unless the soldier has a flashlight equipped, which restores the full day range. No other light level affects spotting; smoke and noise feed the stealth and visibility rules.

**Why it fits the browser:** a low internal resolution and small assets keep downloads and GPU load down, so the style doubles as the mobile performance strategy. Effects scale by quality tier (phones: baked lighting, few shadow casters; desktop: full effects; draft: 2 shadow casters on phones, 8 on desktop).

## UX, tech & scope

- **Engine:** the prototype is built on Three.js (see Prototype tech stack). Babylon.js stays an option for the full game; the rules core is engine-independent, so a switch does not touch game logic. WebGL2 baseline, WebGPU where available.
- **Key screens:** strategic map, squad/loadout, inventory lists, tactical HUD with shot preview, soldier dossier, trader.
- **Vertical slice goal:** 1 strategic map, 1 FOB, 1 operation map, 6 soldiers, 18 weapons, 1 trader — proves the full loop end to end. The slice uses all 18 weapons of the item list.

### Prototype tech stack

The prototype is built with AI assistance, so the stack favours plain text files the AI can read and change, wide AI familiarity, small size and one-step deployment.

| Area | Choice | Why |
| --- | --- | --- |
| 3D | Three.js | Most widely used web 3D library: the most examples, so AI-written code works first time more often; small and browser-native |
| Language | JavaScript (ES modules) | No build step: the files the AI edits are exactly the files that run; profiles (soldiers, weapons, calibres, vehicles) are checked by JSON schemas instead of types |
| Build | None: Three.js through an import map, served by a static web server (tools/serve.ps1); no Node.js, no bundler, no npm | Nothing to install: the game, the tools and the tests run with only a browser and a static server (decided 2026-11-17) |
| Rules core | Plain JavaScript, separate from rendering, tested in the browser (Test Lab and tests.html) | Combat, stamina, reactions, damage and faction simulation can be changed and checked in seconds without opening the game; survives an engine switch |
| Menus and inventory | HTML/CSS over the 3D view, with Preact + htm through the import map (no build step) | List inventories, dossiers and traders are simple and touch-friendly in HTML |
| Game data | JSON files (weapons, calibres, armour, vehicles, soldiers) | Balancing means editing data, not code |
| Randomness | Seeded random generator | Same seed, same map and same shots: bugs are reproducible ("seed 4812, turn 6") |
| Debugging | In-game debug overlay: AP, stamina, line of sight, spread cone | Rules can be checked visually |
| Art | Plain boxes and flat colours first; PSX look later via low render resolution and pixel upscaling | Gameplay before assets |
| Hosting | Static site on GitHub Pages, deployed on every push | A live link for desktop and phone within about a minute |
| Workflow | Claude Code in a local project folder | Edits files, runs the tests and pushes the deploy in one go |

**Build order**

1. Tactical grid with boxes, movement and action points.
2. Line of sight, vision cone and reactions.
3. Shooting with the spread cone, body zones and armour.
4. Stamina and alternating activations.
5. Inventory and loadout in HTML.
6. A small strategic map, one FOB and one full op loop.

One feature per iteration, deployed after each push and tested on desktop and phone. Features tagged OPTIONAL (hidden cities, earned callsigns) are left out of the first iterations.

**Browser and mobile constraints**

- **Input:** every action works with mouse and with touch — tap to select, tap-hold for the shot preview (draft: 400 ms), explicit confirm button for moves and shots; no hover-only information.
- **UI:** portrait-friendly phone layout for menus and inventory; large inventory list rows and tap targets on touch (draft: at least 48 px).
- **Performance budget:** 30 fps on a mid-range phone, 60 fps on desktop (draft reference devices: Samsung Galaxy A54 or iPhone 12; a laptop with Intel Iris Xe graphics at 1080p); first load under \~50 MB, operation maps streamed in.
- **Saves:** local (IndexedDB) only, with no cloud server; to continue a campaign on another device, the player exports it to a save file and imports it there. Ironman or save-anywhere is chosen at campaign start. Every save stores its SAVE\_VERSION, and step-by-step migrations upgrade older saves.
- **Turn-based helps:** tactical combat needs no real-time precision, which suits touch and weaker devices.

**Open questions**

- [ ] Solo hobby project or team? Target release window?
- [ ] Optional co-op operations?
- [x] Difficulty modes: Ironman save only, or save-anywhere? Decided 2026-11-24: chosen at campaign start (see Saves).

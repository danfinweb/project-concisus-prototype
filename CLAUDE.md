# Concisus — global rules

Turn-based military strategy RPG (PMC in a proxy war), built in small, bounded Claude Code sessions
following the modular workflow: https://claude.ai/artifact/MtPiB5ywYhqZWJ1WV7CWog

Three layers of truth: `design/` holds intent, rules and value ranges; `spec/` turns them into precise
sections with IDs plus schemas; `data/` holds concrete content made with the tools. Changes go down the
chain (design → spec → schema → code and tools). Findings come back up as reports; the user decides.

## Rules

1. `design/` is read-only. Never edit it. It is a Markdown export of the live Claude Docs (links in
   `design/README.md`); only the user changes the design, and the export is refreshed from the live docs.
2. `spec/` changes only through `/update-spec`.
3. Modules never import from other modules or from `tools/`. They exchange data only through the
   interfaces in `spec/interfaces/`.
4. `/data` is read through `shared/registry.js` only. Definitions are frozen at load.
5. Each state slice has one owning module (see the table below). Other modules read it, and send changes
   as interface data.
6. In a module session, read and edit only that module's folder, plus what its `SCOPE.md` lists.
7. Terminology: "contract" always means the in-game mechanic. Data passed between modules is an
   "interface", defined in `spec/interfaces/`.
8. No concrete numbers in logic: balancing values live in `/data`. Seeded RNG only (`shared/rng.js`);
   `Math.random()` is never used in game rules or generation.
9. Commit after every step. Spec diffs, impact reports and scope checks rely on git history.

## Stack (user decision, 2026-11-22)

Plain JavaScript ES modules + Three.js through an import map. **No Node.js, no bundler, no npm, no
TypeScript.** Everything runs and is tested with a browser and a static web server.

- Dev server: `powershell -ExecutionPolicy Bypass -File tools/serve.ps1` (port 8080; also in
  `.claude/launch.json`). It serves the repo and has a dev-only write endpoint used by the tools
  (`tools/io/`), which may write only to `data/` and `modules/*/test/fixtures/`.
- Opening files from disk does not work (browsers block ES modules on `file://`).
- Game: http://localhost:8080/game/ · Test Lab: http://localhost:8080/tools/test-lab/ ·
  Data check: http://localhost:8080/scripts/validate-data.html
- JSON Schema checks use `shared/schema.js` (small in-repo validator, a subset of draft 2020-12).
  Saves use `localStorage` and native IndexedDB.

## Dependency direction

| Who | May import | Never imports |
| --- | --- | --- |
| `modules/*/core` | `shared/` | other modules, `tools/`, `game/` |
| `modules/*/adapter` | own `core/`, `shared/`, interface schemas | other modules |
| `tools/` | module cores (read-only, for previews and tests), `shared/` | — |
| `game/` | adapters, `shared/` | module cores directly, `tools/` |

`core/` stays pure: no DOM, no Three.js, no fetch. Renderer and IO live in `adapter/` or `game/`.

## State ownership

| Slice | Owner |
| --- | --- |
| `world` (map, territory, faction forces) | `modules/strategic` |
| `battle` | `modules/tactical` |
| `roster`, `unlocks`, `economy`, `contracts`, `reputation` | `modules/management` |

The AI modules own no state: they read a perception view and return commands.

## Sessions

One Claude Code session per pillar, each started in its own folder (parallel sessions: one git worktree
each).

| Session | Started in | Owns |
| --- | --- | --- |
| Root | repo root | `spec/`, `shared/`, `scripts/`, `game/` shell |
| Tools | `tools/` | editors, Test Lab, cross-sim, `tools/io/` |
| One per module | `modules/<name>/` | that module's `core/`, `test/`, `adapter/`, `SCOPE.md` |

Commands (`.claude/commands/`): `/update-spec`, `/scope`, `/test`, `/integrate`, `/validate-data`,
`/content-report`, `/apply-spec <IDs>`.

## Build order

1. Root: split the design doc into spec sections with IDs, the interfaces, the data schemas,
   `shared/registry.js` and `shared/state.js`.
2. Tools: shell, then the Test Lab (needed by every module), then the item editor.
3. Content: create a first set of items. Export fixtures.
4. Modules: `/scope`, then `/test`, then `core/`, one module per session, starting with the one closest
   to the core gameplay loop (tactical).
5. Tools: preset editor, then prefab editor, then the map generation tools.
6. Modules: `/integrate` each adapter. Root: wire the adapters into `game/`.
7. Tools: cross-sim, once two or more adapters exist.

## Layout

```text
design/        ground truth (read-only export of the live docs)
spec/          _index.md, section files with IDs, interfaces/ (+ data/ schemas, CHANGELOG.md)
data/          static definitions, JSON keyed by ID; mapgen/ and ai/ rules
shared/        registry.js, state.js, schema.js, rng.js
modules/       strategic/ tactical/ management/ strategic-ai/ tactical-ai/
tools/         serve.ps1, io/, shell/, editors, mapgen tools, test-lab/, cross-sim/
game/          thin shell wiring adapters, renderer, saves
scripts/       validate-data, content-report (run in the browser)
```

# Concisus workflow — short overview

The full rules are in `CLAUDE.md` and the [Development Workflow](https://claude.ai/artifact/MtPiB5ywYhqZWJ1WV7CWog).
This page is the quick reference Claude checks your requests against.

## The chain

Changes always flow in one direction: design → spec → schemas → tests → code → data.

1. **Design** (live Claude Docs) — you decide rules and values there. Claude writes to the live docs only when you ask.
2. **Refresh `design/`** — the repo copy is an export. It is refreshed only when you explicitly say so ("refresh design/").
3. **`/update-spec`** (root session) — turns design changes into spec sections with IDs, schemas and an impact report.
4. **`/scope`** (module or tools session) — lists the spec IDs, interfaces, data and state a pillar may use.
5. **`/test <IDs>`** (module session) — scenarios and sims first.
6. **`/apply-spec <IDs>`** (module session) — then `core/`, the sim, `adapter/`; run the Test Lab until green.
7. **`/integrate`** (module session) — build the adapter against the interfaces; then the root session wires adapters into `game/`.
8. **Content** (tools session) — items, presets, prefabs through the editors; `/validate-data`, `/content-report`.

Open questions go back up: module → `SCOPE.md` → the user decides in the design → refresh → `/update-spec`.

## Where each command runs

| Command | Session | Needs |
| --- | --- | --- |
| `/update-spec` | root (repo root) | a committed `design/` refresh, or `cleanup` |
| `/scope` | module or tools | a pillar (`modules/<name>/` or `tools/`) |
| `/test <IDs>` | module | spec IDs from that module's `SCOPE.md` |
| `/apply-spec <IDs>` | module or tools | spec IDs; tests for them first |
| `/integrate` | module | a working `core/` |
| `/validate-data`, `/content-report` | any (usually tools) | data in `/data` |

## Rules that commonly trip a request

- `design/` is never edited by hand; only an export of the live docs, and only with your explicit OK for that refresh.
- `spec/` changes only through `/update-spec`.
- A module session edits only its own folder (plus what `SCOPE.md` lists); modules never import each other or `tools/`.
- No concrete numbers in logic — they go in `/data`; seeded RNG only (`shared/rng.js`).
- No Node.js, npm or bundler: tests run in the browser Test Lab (`tools/serve.ps1`, then `/tools/test-lab/?module=<name>`).
- Commit after every step.

## Reminders

When a request does not fit this workflow (a command in the wrong session, missing IDs, a step skipped,
a rule above broken), Claude names the problem in one line, says what the valid step is, and asks before
doing anything else.

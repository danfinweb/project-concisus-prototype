---
description: Write or refresh SCOPE.md for this module or the tools pillar
---
Run in a **module or tools session**.

Write or refresh `SCOPE.md` in this pillar's folder with these sections (keep the existing headings):

- **Spec IDs** — every ID in `spec/_index.md` mapped to this pillar, with a one-line summary each.
- **Interfaces** — produced and consumed, with file and version (`spec/interfaces/*.schema.json`).
- **Data tables** — `/data` tables read (via `shared/registry.js`), with their schema files.
- **State slices** — owned and read (see the root `CLAUDE.md` ownership table).
- **Open questions** — spec gaps or contradictions found while scoping. Report them; do not edit `spec/`.

Only the files SCOPE.md lists may be read outside this folder. Commit with `scope(<pillar>): refresh`.

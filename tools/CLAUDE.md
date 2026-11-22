# Tools — pillar rules

Read the root `CLAUDE.md` too. Tools are dev-only and never shipped.

- The tools produce content within the rules the spec defines. They write only to `/data` and to
  `modules/*/test/fixtures/` (through `tools/io/client.js` → the write endpoint in `tools/serve.ps1`),
  never to `design/` or `spec/`.
- Every form is generated from the schemas in `spec/interfaces/data/`, so a new spec field appears in
  the tool without code changes. Validation uses `shared/schema.js`.
- Tools may import module cores **read-only** (previews, quick duels, map previews, tests) and
  `shared/`. Modules never import tools.
- Shared shell (`shell/`): list, search, schema-driven form, validation panel (schema errors, broken ID
  references, values outside the spec's range).
- Each editor can export a small dataset as a module fixture (`writeFixture`).
- Build order: shell → Test Lab (exists; extend it) → item editor → preset editor → prefab editor →
  map generation tools → cross-sim (once two adapters exist).
- Map generation tools tweak the rules in `/data/mapgen/`, preview results and run batch statistics in a
  Web Worker. They never author generator logic (that lives in the module's `core/mapgen/`).
- Commands here: `/scope`, `/apply-spec <IDs>`, `/validate-data`.

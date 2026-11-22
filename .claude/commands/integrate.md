---
description: Build or update adapter/ against the interfaces and add interface tests
---
Run in a **module session**.

1. Read the interfaces this module produces and consumes (listed in `SCOPE.md`).
2. Build or update `adapter/`: it takes interface data in, calls `core/`, and returns interface data out.
   It may import only its own `core/`, `shared/` and the interface schemas — never another module.
3. Add interface tests to `test/scenarios.js`: every output validates against its schema with
   `shared/schema.js`, and sample inputs from `test/fixtures/` are accepted.
4. Run them in the Test Lab. Commit with `integrate(<module>): <summary>`.

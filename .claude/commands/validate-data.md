---
description: Check /data against the schemas and all ID references; list anything broken
---
Run in **any session**.

1. Start the dev server and open `http://localhost:8080/scripts/validate-data.html` (it runs
   `scripts/validate-data.js`), then read `window.validationDone` (`{ ok, errors }`).
2. Report schema errors, broken ID references, and values outside the spec's ranges, grouped by table.
3. If a schema changed recently (`git log -- spec/interfaces/data`), say which records it broke.
   Do not fix data here unless this is a tools session.

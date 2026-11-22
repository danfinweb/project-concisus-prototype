---
description: Summarize /data (distributions, outliers, cost vs power) and compare it to the design intent
---
Run in the **root session**.

1. Open `http://localhost:8080/scripts/content-report.html` and read `window.reportDone`.
2. Compare the distributions with the ranges and intent in `design/` (e.g. weapon ranges, map intents
   such as "urban maps: 30–50% cover tiles").
3. Write `spec/reports/content-<YYYY-MM-DD>.md`: drift (content creeping to one end of a range),
   outliers, and for each finding whether it is **tuning** (fits the spec; fix in the tools) or a
   **rule change** (needs a design edit by the user). Never edit `design/` or `/data` here.

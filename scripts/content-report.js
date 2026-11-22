// Summarizes /data: record counts and, per numeric field, min / mean / max, to compare against the
// ranges and intent in design/ (see /content-report). Run in the browser: scripts/content-report.html.
export async function contentReport(base = new URL('../data', import.meta.url).href) {
  const tables = await (await fetch(`${base}/tables.json`)).json();
  const report = {};
  for (const name of Object.keys(tables)) {
    if (name.startsWith('$')) continue;
    const records = Object.values(await (await fetch(`${base}/${name}.json`)).json());
    const fields = {};
    for (const r of records) for (const [k, v] of Object.entries(r ?? {})) if (typeof v === 'number') (fields[k] ??= []).push(v);
    report[name] = {
      count: records.length,
      numeric: Object.fromEntries(Object.entries(fields).map(([k, vs]) => [k, {
        min: Math.min(...vs), max: Math.max(...vs), mean: vs.reduce((a, b) => a + b, 0) / vs.length, n: vs.length,
      }])),
    };
  }
  return report;
}

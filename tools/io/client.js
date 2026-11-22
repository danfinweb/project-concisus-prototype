// Client for the dev server's write endpoint (tools/serve.ps1). Dev-only: the tools are never shipped.
// The server accepts only data/**/*.json and modules/<name>/test/fixtures/**/*.json.

// Write a /data table, e.g. writeTable('items', obj) → data/items.json
export const writeTable = (name, records) => writeJson(`data/${name}.json`, records);

// Export a small dataset as a module test fixture, e.g. writeFixture('tactical', 'items', obj)
export const writeFixture = (module, name, records) => writeJson(`modules/${module}/test/fixtures/${name}.json`, records);

export async function writeJson(path, value) {
  const res = await fetch(`/__io/write?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value, null, 2),
  });
  const out = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
  if (!out.ok) throw new Error(`io: ${path}: ${out.error}`);
  return out;
}

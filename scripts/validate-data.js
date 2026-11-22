// Checks every /data table against its schema and every ID reference ("x-ref" in a schema).
// Run in the browser: scripts/validate-data.html → window.validationDone = { ok, errors }.
import { validate } from '../shared/schema.js';

export async function validateData(base = new URL('../data', import.meta.url).href,
                                   schemaBase = new URL('../spec/interfaces/data', import.meta.url).href) {
  const tables = await (await fetch(`${base}/tables.json`)).json();
  const errors = [], refs = [], data = {};
  for (const [name, schemaFile] of Object.entries(tables)) {
    if (name.startsWith('$')) continue;
    try {
      const schema = await (await fetch(`${schemaBase}/${schemaFile}`)).json();
      data[name] = await (await fetch(`${base}/${name}.json`)).json();
      for (const e of validate(schema, data[name], { refs: (refs[name] = []) })) errors.push({ table: name, ...e, kind: 'schema' });
      for (const [id, rec] of Object.entries(data[name])) {
        if (rec && typeof rec === 'object' && 'id' in rec && rec.id !== id) errors.push({ table: name, path: `/${id}/id`, message: `id "${rec.id}" differs from its key`, kind: 'id' });
      }
    } catch (e) {
      errors.push({ table: name, path: '/', message: e.message, kind: 'load' });
    }
  }
  for (const [name, list] of Object.entries(refs)) {
    for (const r of list) {
      if (!data[r.table]) errors.push({ table: name, path: r.path, message: `references unknown table "${r.table}"`, kind: 'ref' });
      else if (!(r.id in data[r.table])) errors.push({ table: name, path: r.path, message: `broken reference ${r.table}/${r.id}`, kind: 'ref' });
    }
  }
  return { ok: errors.length === 0, errors, tables: Object.keys(data) };
}

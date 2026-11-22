// Small JSON Schema validator (a subset of draft 2020-12), so the project needs no npm packages.
// Supported: type (incl. arrays of types and "integer"), enum, const, properties, required,
// additionalProperties (boolean or schema), items, minItems, maxItems, minimum, maximum,
// exclusiveMinimum, exclusiveMaximum, minLength, maxLength, pattern, allOf, anyOf, oneOf, and $ref to
// "#/$defs/<name>". Custom keyword: "x-ref": "<table>" on a string marks an ID reference into another
// /data table; pass { refs: [] } to collect them for checking.
// Returns a list of { path, message }; an empty list means valid.

export function validate(schema, value, { refs } = {}) {
  const errors = [];
  walk(schema, value, '', schema, errors, refs);
  return errors;
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number' && Number.isInteger(v)) return 'integer';
  return typeof v;
}

const typeMatches = (t, v) => t === typeOf(v) || (t === 'number' && typeOf(v) === 'integer');
const passes = (sub, v, root) => { const e = []; walk(sub, v, '', root, e); return e.length === 0; };

function walk(s, v, path, root, errors, refs) {
  if (s === true || s === undefined) return;
  const err = (message) => errors.push({ path: path || '/', message });
  if (s === false) { err('not allowed'); return; }

  if (s.$ref) {
    const m = /^#\/\$defs\/(.+)$/.exec(s.$ref);
    if (!m || !root.$defs?.[m[1]]) { err(`unsupported $ref ${s.$ref}`); return; }
    walk(root.$defs[m[1]], v, path, root, errors, refs);
  }
  if (s.type) {
    const types = Array.isArray(s.type) ? s.type : [s.type];
    if (!types.some((t) => typeMatches(t, v))) { err(`expected ${types.join(' or ')}, got ${typeOf(v)}`); return; }
  }
  if (s.enum && !s.enum.some((e) => JSON.stringify(e) === JSON.stringify(v))) err(`must be one of ${JSON.stringify(s.enum)}`);
  if ('const' in s && JSON.stringify(s.const) !== JSON.stringify(v)) err(`must be ${JSON.stringify(s.const)}`);

  if (typeof v === 'number') {
    if (s.minimum !== undefined && v < s.minimum) err(`must be >= ${s.minimum}`);
    if (s.maximum !== undefined && v > s.maximum) err(`must be <= ${s.maximum}`);
    if (s.exclusiveMinimum !== undefined && v <= s.exclusiveMinimum) err(`must be > ${s.exclusiveMinimum}`);
    if (s.exclusiveMaximum !== undefined && v >= s.exclusiveMaximum) err(`must be < ${s.exclusiveMaximum}`);
  }
  if (typeof v === 'string') {
    if (s.minLength !== undefined && v.length < s.minLength) err(`shorter than ${s.minLength}`);
    if (s.maxLength !== undefined && v.length > s.maxLength) err(`longer than ${s.maxLength}`);
    if (s.pattern && !new RegExp(s.pattern, 'u').test(v)) err(`does not match ${s.pattern}`);
    if (s['x-ref'] && refs) refs.push({ path, table: s['x-ref'], id: v });
  }
  if (Array.isArray(v)) {
    if (s.minItems !== undefined && v.length < s.minItems) err(`fewer than ${s.minItems} items`);
    if (s.maxItems !== undefined && v.length > s.maxItems) err(`more than ${s.maxItems} items`);
    if (s.items) v.forEach((x, i) => walk(s.items, x, `${path}/${i}`, root, errors, refs));
  }
  if (typeOf(v) === 'object') {
    for (const k of s.required ?? []) if (!(k in v)) err(`missing required "${k}"`);
    const props = s.properties ?? {};
    for (const [k, x] of Object.entries(v)) {
      if (k in props) walk(props[k], x, `${path}/${k}`, root, errors, refs);
      else if (s.additionalProperties !== undefined) walk(s.additionalProperties, x, `${path}/${k}`, root, errors, refs);
    }
  }
  if (s.allOf) for (const sub of s.allOf) walk(sub, v, path, root, errors, refs);
  // anyOf / oneOf: pick the matching branch, then walk it again so its ID references are collected.
  if (s.anyOf) {
    const hit = s.anyOf.find((sub) => passes(sub, v, root));
    if (hit === undefined) err('matches none of anyOf');
    else if (refs) walk(hit, v, path, root, [], refs);
  }
  if (s.oneOf) {
    const hits = s.oneOf.filter((sub) => passes(sub, v, root));
    if (hits.length === 1) { if (refs) walk(hits[0], v, path, root, [], refs); }
    else if (hits.length === 0) err(`must match exactly one of oneOf (matched 0)${branchHint(s.oneOf, v, root)}`);
    else err(`must match exactly one of oneOf (matched ${hits.length})`);
  }
}

// When oneOf branches are told apart by a const (e.g. kind), name the errors of the branch whose const
// matches, so "matched 0" says what is actually wrong.
function branchHint(branches, v, root) {
  if (typeOf(v) !== 'object') return '';
  for (const b of branches) {
    const sub = b.$ref ? root.$defs?.[/^#\/\$defs\/(.+)$/.exec(b.$ref)?.[1]] : b;
    const consts = Object.entries(sub?.properties ?? {}).filter(([, p]) => p && 'const' in p);
    if (consts.length && consts.every(([k, p]) => JSON.stringify(v[k]) === JSON.stringify(p.const))) {
      const e = []; walk(sub, v, '', root, e);
      return `: ${e.map((x) => `${x.path} ${x.message}`).join('; ')}`;
    }
  }
  return '';
}

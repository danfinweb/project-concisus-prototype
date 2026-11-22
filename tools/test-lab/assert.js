// Strict assertions for module scenarios (a browser stand-in for node:assert/strict).
// Passed to scenarios as ctx.assert.

export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

const show = (v) => {
  try { return typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v) ?? String(v); } catch { return String(v); }
};

// Strict deep equality for plain data: primitives, arrays, objects, Map, Set.
function deepEq(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Map) return a.size === b.size && [...a].every(([k, v]) => b.has(k) && deepEq(v, b.get(k)));
  if (a instanceof Set) return a.size === b.size && [...a].every((v) => b.has(v));
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEq(a[k], b[k]));
}

const fail = (msg, actual, expected, def) => { throw new AssertionError(msg || def, actual, expected); };

export const assert = {
  ok(v, msg) { if (!v) fail(msg, v, true, `The expression evaluated to a falsy value: ${show(v)}`); },
  equal(a, b, msg) { if (!Object.is(a, b)) fail(msg, a, b, `Expected values to be strictly equal:\n  actual:   ${show(a)}\n  expected: ${show(b)}`); },
  notEqual(a, b, msg) { if (Object.is(a, b)) fail(msg, a, b, `Expected "actual" to be strictly unequal to: ${show(b)}`); },
  deepEqual(a, b, msg) { if (!deepEq(a, b)) fail(msg, a, b, `Expected values to be strictly deep-equal:\n  actual:   ${show(a)}\n  expected: ${show(b)}`); },
  notDeepEqual(a, b, msg) { if (deepEq(a, b)) fail(msg, a, b, 'Expected values not to be deep-equal'); },
  match(s, re, msg) { if (typeof s !== 'string' || !re.test(s)) fail(msg, s, re, `The input did not match ${re}. Input: ${show(s)}`); },
  throws(fn, msg) { try { fn(); } catch { return; } fail(msg, undefined, 'an error', 'Missing expected exception.'); },
  async rejects(fn, msg) { try { await fn(); } catch { return; } fail(msg, undefined, 'a rejection', 'Missing expected rejection.'); },
};

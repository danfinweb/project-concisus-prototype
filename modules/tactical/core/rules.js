// Tactical rule constants, read from data/tactical-rules.json through shared/registry.js (CLAUDE.md rule 4).
// Core logic never holds balancing numbers of its own (rule 8): every value comes from here.
// Reading a constant the table lacks throws, so a missing value shows up at once instead of as NaN.

export function tacticalRules(registry, table = 'tactical-rules') {
  return new Proxy({}, {
    get(_, key) {
      if (typeof key !== 'string') return undefined;
      const v = registry.get(table, key);
      if (v === undefined) throw new Error(`tactical rules: "${key}" is not set in ${table}`);
      return v;
    },
  });
}

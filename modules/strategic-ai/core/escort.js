// SAI-017: the Krug scores each pending escort request (STR-094) with the doctrine's escortAccept
// considerations — price (USD), requester standing (relation, or the player's Krug reputation),
// free squads (count of own squads without a goal that can reach the convoy) and route danger (highest
// threat layer along the route, 0–1, SAI-006) — and accepts when the total is
// above escortAccept.threshold and a free squad is left. One answer per request, one squad per convoy.
import { score, logEntry } from './scoring.js';

export function answerEscorts(ctx, maps, doctrine, taken) {
  const commands = [], log = [], assigned = new Map();
  const cfg = doctrine.escortAccept ?? {};
  const lookup = (name) => cfg.considerations?.[name];
  const threshold = cfg.threshold ?? 0;
  for (const req of ctx.view.escortRequests ?? []) {
    const free = ctx.ownSquads.filter((s) => !s.transit && !s.goal && !taken.has(s.id)
      && Number.isFinite(ctx.stepsBetween(s.region, req.region)));
    const route = (req.route ?? []).filter((id) => ctx.regions.has(id));
    const danger = Math.max(0, ...route.map((id) => maps[id]?.threat ?? 0));
    const accept = score(`accept:${req.id}`, {
      price: req.priceUsd ?? 0,
      standing: req.relation ?? req.reputation ?? 0,
      freeSquads: free.length,
      routeDanger: danger,
    }, lookup);
    const refuse = { option: `refuse:${req.id}`, total: threshold, considerations: {} };
    const ok = free.length > 0 && accept.total > threshold;
    const options = free.length > 0 ? [accept, refuse] : [refuse];
    log.push(logEntry(ctx.view, 'planner', `escort ${req.id}`, options, ok ? accept : refuse, doctrine.logTopN));
    if (ok) {
      const squad = free.reduce((a, b) => (ctx.stepsBetween(b.region, req.region) < ctx.stepsBetween(a.region, req.region) ? b : a));
      taken.add(squad.id);
      assigned.set(squad.id, { region: req.region, value: accept.total - threshold });
      commands.push({ type: 'answerEscort', requestId: req.id, accept: true, squad: squad.id });
    } else {
      commands.push({ type: 'answerEscort', requestId: req.id, accept: false });
    }
  }
  return { commands, log, assigned };
}

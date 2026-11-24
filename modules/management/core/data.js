// Read-only access to the definitions Management uses (shared/registry.js only, rule 4).
// Singleton tables (management-rules, recruitment, …) are read field by field; record tables by ID.
import { get, all, has } from '../../../shared/registry.js';

export const rules = (key) => get('management-rules', key);
export const recruitment = (key) => get('recruitment', key);
export const callsignData = (key) => get('callsigns', key);
export const traderData = (key) => get('traders', key);

export const item = (id) => (has('items', id) ? get('items', id) : undefined);
export const mission = (id) => get('missions', id);
export const allMissions = () => all('missions');
export const faction = (id) => (has('factions', id) ? get('factions', id) : undefined);
export const allFactions = () => all('factions');
export const allEvents = () => all('events');

export const PHYSICAL = Object.freeze(['strength', 'endurance', 'agility', 'perception']);
export const SKILLS = Object.freeze(['marksmanship', 'recon', 'medical', 'technical']);
export const ATTRIBUTES = Object.freeze([...PHYSICAL, ...SKILLS]); // MGT-021, fixed order (seeded picks depend on it)

// Weapon and vehicle condition run 0..100 by definition (DAT-014, DAT-029); not a balancing value.
export const CONDITION_MAX = 100;

export const tiers = () => recruitment('tiers');
export const tier = (id) => tiers().find((t) => t.id === id);
export const rankIndex = (id) => tiers().findIndex((t) => t.id === id);

// The faction whose record carries `resentment` (the Krug, GEN-010).
export const krugFaction = () => allFactions().find((f) => f.resentment);

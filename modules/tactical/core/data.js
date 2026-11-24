// Read-only access to the /data tables the tactical core uses (through shared/registry.js only).
import { get, has, all } from '../../../shared/registry.js';

export const T = (key) => get('tactical-rules', key);
export const item = (id) => (id && has('items', id) ? get('items', id) : null);
export const items = () => all('items');
export const terrain = (id) => (has('terrain', id) ? get('terrain', id) : null);
export const terrains = () => all('terrain');
export const M = (key) => get('management-rules', key);
export const G = (key) => get('mapgen/tactical', key);
export const strategicTerrain = (id) => (has('strategic-terrain', id) ? get('strategic-terrain', id) : null);
export const strategicTerrains = () => all('strategic-terrain');

// Enumerations fixed by the spec (names, not balancing values).
export const ZONES = ['head', 'thorax', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
export const ARMS = ['leftArm', 'rightArm'];
export const LEGS = ['leftLeg', 'rightLeg'];
export const LIMBS = [...ARMS, ...LEGS];
export const STANCES = ['upright', 'crouched', 'prone'];
export const RANKS = ['recruit', 'regular', 'veteran', 'elite']; // MGT-074 order, lowest first
export const SLOTS = ['weapon1', 'weapon2', 'holster', 'helmet', 'bodyArmour', 'vest', 'belt', 'backpack'];
export const CARRIER_SLOTS = ['vest', 'belt', 'backpack'];

export const perk = (id) => (M('perks') || []).find((p) => p.id === id) || null;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

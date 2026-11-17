/**
 * teeter/host-plan.js — What each of Teeter's eight hosts is, which room in the terrace walls it stands in, and where its plate is.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:teeter` all stand on this one table.
 *
 * A host is the working of ONE ROOM (`terrace-plan.js` declares them) and its bench: the sluice chamber's culvert and
 * gates, the weigh house's scale, the gauge chamber's tilting trough, the tally room's pigeonholes, the ledger house's
 * desk, the pump chamber's pump barrel, the settling cistern's tanks, the plotting room's board. The room's shell (floor,
 * walls, roof) is the terraces' (`terrain.js`); the host furnishes it and hangs its lamps.
 *
 * `pos` is where the plate stands (world x, z): `PLATE_FROM_BACK` out from the room's back wall, across its middle; `face`
 * is toward the door (west). THE HOST FRAME has its origin on the floor under the middle of the plate, +z toward the
 * player (and the door), +x to the player's right (south). `hostExtent` is the room in that frame, the walls' colliders
 * taken off: no part of a host may stand outside it.
 *
 * Site ids are `site-N`, as in every other world; `questId` and `label` are unchanged from the first build.
 */

import { ROOMS, PLATE_FROM_BACK, FACE, WALL_T, LEVEL } from './terrace-plan.js';

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open floor in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/** How far in front of a plate the player is asked to stand. */
export const APPROACH = 4.6;

/** How far in from a wall's face a host keeps (the walls' colliders reach 0.3 m in). */
export const WALL_IN = 0.3;

const PLAN = {
  'site-1': { questId: 'q1-both', label: 'Bench 1 - Running Both Ways', title: 'Running Both Ways', structure: 'sluice-chamber', kind: 'pan', skin: 'deck', plate: 'TTR-01' },
  'site-2': { questId: 'q2-k', label: 'Bench 2 - The Number K', title: 'The Number That Holds', structure: 'weigh-house', kind: 'scale', skin: 'desk', plate: 'TTR-02' },
  'site-3': { questId: 'q3-q', label: 'Bench 3 - Which Way', title: 'Which Way It Goes', structure: 'gauge-chamber', kind: 'gauge', skin: 'shelf', plate: 'TTR-03' },
  'site-4': { questId: 'q4-properties', label: 'Bench 4 - Combining K', title: 'Combining K', structure: 'tally-room', kind: 'cards', skin: 'desk', plate: 'TTR-04' },
  'site-5': { questId: 'q5-ice', label: 'Bench 5 - Equilibrium Concentrations', title: 'Equilibrium Concentrations', structure: 'ledger-house', kind: 'ledger', skin: 'shelf', plate: 'TTR-05' },
  'site-6': { questId: 'q6-lean', label: 'Bench 6 - Le Chatelier', title: "Le Chatelier's Principle", structure: 'pump-chamber', kind: 'beam', skin: 'deck', plate: 'TTR-06' },
  'site-7': { questId: 'q7-dissolve', label: 'Bench 7 - Solubility Equilibria', title: 'Solubility Equilibria', structure: 'settling-cistern', kind: 'dish', skin: 'deck', plate: 'TTR-07' },
  'site-8': { questId: 'q8-free', label: 'Bench 8 - Free Energy', title: 'Free Energy and K', structure: 'plotting-room', kind: 'plot', skin: 'desk', plate: 'TTR-08' }
};

/** A room's rectangle in the world. */
export function roomRect(r) {
  const minX = FACE[r.wall] + WALL_T;
  return { minX, maxX: minX + r.depth, minZ: r.z[0], maxZ: r.z[1] };
}

export const HOST_PLAN = Object.fromEntries(Object.entries(PLAN).map(([id, p]) => {
  const room = ROOMS.find(r => r.site === id);
  const rr = roomRect(room);
  const x = rr.maxX - PLATE_FROM_BACK, z = (rr.minZ + rr.maxZ) / 2;
  return [id, { ...p, room: room.id, floor: LEVEL[room.wall], pos: [Math.round(x * 100) / 100, Math.round(z * 100) / 100], face: [-1, 0] }];
}));

/** A world point in a host's frame: x to the player's right, z toward the player. */
export function toHost(plan, x, z) {
  const [px, pz] = plan.pos, [fx, fz] = plan.face;
  const dx = x - px, dz = z - pz;
  return [dx * fz - dz * fx, dx * fx + dz * fz];
}

/** A host-frame point as a world point. */
export function toWorld(plan, lx, lz) {
  const [px, pz] = plan.pos, [fx, fz] = plan.face;
  return [px + lx * fz + lz * fx, pz - lx * fx + lz * fz];
}

/** The host's room in its own frame: `[x0, x1, z0, z1]`, the walls' colliders taken off every side but the door's. */
export function hostExtent(plan) {
  const room = ROOMS.find(r => r.id === plan.room);
  const r = roomRect(room);
  const pts = [[r.minX, r.minZ], [r.maxX, r.minZ], [r.minX, r.maxZ], [r.maxX, r.maxZ]].map(([x, z]) => toHost(plan, x, z));
  const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0]));
  const z0 = Math.min(...pts.map(p => p[1])), z1 = Math.max(...pts.map(p => p[1]));
  return [x0 + WALL_IN, x1 - WALL_IN, z0 + WALL_IN, z1 - WALL_IN];
}

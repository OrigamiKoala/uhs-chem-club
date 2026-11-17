/**
 * verdigris/host-plan.js — What each of Verdigris's eight hosts is, which room of the drowned fort it stands in, and where
 * its plate is.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:verdigris` all stand on this one table.
 *
 * A host is the working of ONE ROOM (`fort-plan.js` declares them) and its bench: the gatehouse's sluice winch, the
 * tide tower's stilling well, the twin cistern's arcade, the acid store's racks, the salt cistern's settling cells, the
 * keep's dosing tank, the water gate's two sluices, the great cistern's reserve vats. The room's shell (floor, walls,
 * roof) is the fort's (`terrain.js`); the host furnishes it and hangs its lamps.
 *
 * `pos` is where the plate stands (world x, z): `PLATE_FROM_BACK` out from the room's back wall, across its middle; `face`
 * is toward the door. THE HOST FRAME has its origin on the floor under the middle of the plate, +z toward the player (and
 * the door), +x to the player's right. `hostExtent` is the room in that frame, the walls' colliders taken off: no part of
 * a host may stand outside it.
 *
 * Site ids are `site-N`, as in every other world; `questId`, `label`, `kind`, `skin` and `plate` are unchanged from the
 * first build (`archive/2026-11-16/site-verdigris/`).
 */

import { ROOMS, PLATE_FROM_BACK } from './fort-plan.js';

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open floor in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/** How far in front of a plate the player is asked to stand. */
export const APPROACH = 4.6;

/** How far in from a wall's face a host keeps (the walls' colliders reach 0.3 m in). */
export const WALL_IN = 0.3;

const PLAN = {
  'site-1': { questId: 'q1-handover', label: 'Bench 1 - The Handover', title: 'The Handover', structure: 'winch-chamber', kind: 'flask', skin: 'deck', plate: 'VDG-01' },
  'site-2': { questId: 'q2-scale', label: 'Bench 2 - Reading the Scale', title: 'Reading the Scale', structure: 'tide-tower', kind: 'meter', skin: 'desk', plate: 'VDG-02' },
  'site-3': { questId: 'q3-weak', label: 'Bench 3 - Weak Acids', title: 'Weak Acids and Bases', structure: 'twin-cistern', kind: 'flask', skin: 'shelf', plate: 'VDG-03' },
  'site-4': { questId: 'q4-structure', label: 'Bench 4 - Acid Structure', title: 'Acid Strength and Structure', structure: 'acid-store', kind: 'race', skin: 'desk', plate: 'VDG-04' },
  'site-5': { questId: 'q5-salts', label: 'Bench 5 - Salts', title: 'Neutralization and Salts', structure: 'salt-cistern', kind: 'dish', skin: 'shelf', plate: 'VDG-05' },
  'site-6': { questId: 'q6-titrate', label: 'Bench 6 - Titration Curves', title: 'Titration Curves', structure: 'dosing-hall', kind: 'burette', skin: 'deck', plate: 'VDG-06' },
  'site-7': { questId: 'q7-buffer', label: 'Bench 7 - Buffers', title: 'Buffers', structure: 'water-gate', kind: 'flask', skin: 'deck', plate: 'VDG-07' },
  'site-8': { questId: 'q8-capacity', label: 'Bench 8 - pKa and Capacity', title: 'pKa, Protonation and Capacity', structure: 'great-cistern', kind: 'plot', skin: 'desk', plate: 'VDG-08' }
};

/** The way a plate looks, as a unit vector, for each `face`. */
export const FACE_VEC = { '-x': [-1, 0], '+x': [1, 0], '-z': [0, -1], '+z': [0, 1] };

/** A room's rectangle in the world. */
export function roomRect(r) {
  const [minX, maxX, minZ, maxZ] = r.rect;
  return { minX, maxX, minZ, maxZ };
}

/** Where a room's plate stands: `PLATE_FROM_BACK` out from the wall opposite its door, across the middle. */
function platePos(r) {
  const v = roomRect(r), mx = (v.minX + v.maxX) / 2, mz = (v.minZ + v.maxZ) / 2;
  if (r.face === '-x') return [v.maxX - PLATE_FROM_BACK, mz];
  if (r.face === '+x') return [v.minX + PLATE_FROM_BACK, mz];
  if (r.face === '-z') return [mx, v.maxZ - PLATE_FROM_BACK];
  return [mx, v.minZ + PLATE_FROM_BACK];
}

const r2 = n => Math.round(n * 100) / 100;

export const HOST_PLAN = Object.fromEntries(Object.entries(PLAN).map(([id, p]) => {
  const room = ROOMS.find(r => r.site === id);
  const [x, z] = platePos(room);
  return [id, { ...p, room: room.id, floor: room.level, pos: [r2(x), r2(z)], face: FACE_VEC[room.face] }];
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

/** The host's room in its own frame: `[x0, x1, z0, z1]`, the walls' colliders taken off every side. */
export function hostExtent(plan) {
  const room = ROOMS.find(r => r.id === plan.room);
  const r = roomRect(room);
  const pts = [[r.minX, r.minZ], [r.maxX, r.minZ], [r.minX, r.maxZ], [r.maxX, r.maxZ]].map(([x, z]) => toHost(plan, x, z));
  const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0]));
  const z0 = Math.min(...pts.map(p => p[1])), z1 = Math.max(...pts.map(p => p[1]));
  return [x0 + WALL_IN, x1 - WALL_IN, z0 + WALL_IN, z1 - WALL_IN];
}

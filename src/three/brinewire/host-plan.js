/**
 * brinewire/host-plan.js — What each of Brinewire's six hosts is, which room of the barrage it stands in, and where its plate is.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:brinewire` all stand on this one table.
 *
 * A host is the working of ONE ROOM (`barrage-plan.js` declares them) and its bench: the hoist house's gate leaf, the anode
 * store's racks, the bridge chamber's half-cell tanks, the meter room's panel, the battery hall's cells, the rectifier cage's
 * plating tank. The room's shell (floor, walls, roof) is the barrage's (`terrain.js`); the host furnishes it and hangs its lamps.
 *
 * `pos` is where the plate stands (world x, z): `PLATE_FROM_BACK` out from the room's back (west) wall, across its middle;
 * `face` is toward the door (east). THE HOST FRAME has its origin on the floor under the middle of the plate, +z toward the
 * player (and the door), +x to the player's right (south). `hostExtent` is the room in that frame, the walls' colliders
 * taken off: no part of a host may stand outside it.
 *
 * Site ids are `site-N`, as in every other world; `questId` and `label` are unchanged from the first build.
 */

import { ROOMS, PLATE_FROM_BACK } from './barrage-plan.js';

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open floor in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/** How far in front of a plate the player is asked to stand. */
export const APPROACH = 4.6;

/** How far in from a wall's face a host keeps (the walls' colliders reach 0.3 m in). */
export const WALL_IN = 0.3;

const PLAN = {
  'site-1': { questId: 'q1-halves', label: 'Bench 1 - Half-Reactions', title: 'Half-Reactions', structure: 'hoist-house', kind: 'beaker', skin: 'deck', plate: 'BRW-01' },
  'site-2': { questId: 'q2-activity', label: 'Bench 2 - Which Metal Gives', title: 'Which Metal Gives', structure: 'anode-store', kind: 'rack', skin: 'desk', plate: 'BRW-02' },
  'site-3': { questId: 'q3-galvanic', label: 'Bench 3 - Galvanic Cells', title: 'Galvanic Cells', structure: 'bridge-chamber', kind: 'rig', skin: 'shelf', plate: 'BRW-03' },
  'site-4': { questId: 'q4-potential', label: 'Bench 4 - Cell Potential', title: 'Cell Potential', structure: 'meter-room', kind: 'meter', skin: 'desk', plate: 'BRW-04' },
  'site-5': { questId: 'q5-load', label: 'Bench 5 - Under Load', title: 'Under Load', structure: 'battery-hall', kind: 'load', skin: 'shelf', plate: 'BRW-05' },
  'site-6': { questId: 'q6-electrolysis', label: 'Bench 6 - Electrolysis', title: 'Electrolysis', structure: 'rectifier-cage', kind: 'supply', skin: 'deck', plate: 'BRW-06' }
};

export const HOST_PLAN = Object.fromEntries(Object.entries(PLAN).map(([id, p]) => {
  const room = ROOMS.find(r => r.site === id);
  const rr = room.rect;
  const x = rr.minX + PLATE_FROM_BACK, z = (rr.minZ + rr.maxZ) / 2;
  return [id, { ...p, room: room.id, floor: room.floor, pos: [Math.round(x * 100) / 100, Math.round(z * 100) / 100], face: [1, 0] }];
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

/** The host's room in its own frame: `[x0, x1, z0, z1]`, the walls' colliders taken off. */
export function hostExtent(plan) {
  const room = ROOMS.find(r => r.id === plan.room);
  const r = room.rect;
  const pts = [[r.minX, r.minZ], [r.maxX, r.minZ], [r.minX, r.maxZ], [r.maxX, r.maxZ]].map(([x, z]) => toHost(plan, x, z));
  const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0]));
  const z0 = Math.min(...pts.map(p => p[1])), z1 = Math.max(...pts.map(p => p[1]));
  return [x0 + WALL_IN, x1 - WALL_IN, z0 + WALL_IN, z1 - WALL_IN];
}

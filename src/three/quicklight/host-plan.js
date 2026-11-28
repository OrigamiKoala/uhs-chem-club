/**
 * quicklight/host-plan.js — What each of Quicklight's six hosts is, which room of the refinery it stands in, and where its plate is.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:quicklight` all stand on this one table.
 *
 * A host is the working of ONE ROOM (`refinery-plan.js` declares them) and its bench: the analyser bunker's sample panels, the
 * control block's feed desk, the pump cellar's manifold, the cracking reactor's feed nozzles under its skirt, the reactor train's
 * three outlets under its table, the catalyst bunker's drums and hopper. The room's shell (floor, walls, roof) is the refinery's
 * (`terrain.js`); the host furnishes it and hangs its lamps.
 *
 * `pos` is where the plate stands (world x, z): `PLATE_FROM_BACK` out from the wall opposite the door, across the room's middle;
 * `face` points toward the door. THE HOST FRAME has its origin on the floor under the middle of the plate, +z toward the player
 * (and the door), +x to the player's right. `hostExtent` is the room in that frame, the walls' colliders taken off: no part of a
 * host may stand outside it.
 *
 * Site ids are `site-N`, as in every other world; `questId` and `label` are unchanged from the first build.
 */

import { ROOMS, PLATE_FROM_BACK } from './refinery-plan.js';

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open floor in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/** How far in front of a plate the player is asked to stand. */
export const APPROACH = 4.6;

/** How far in from a wall's face a host keeps (the walls' colliders reach 0.3 m in). */
export const WALL_IN = 0.3;

const PLAN = {
  'site-1': { questId: 'q1-watch', label: 'Bench 1 - Reaction Rates', title: 'Reaction Rates', structure: 'analyser-bunker', kind: 'vessel', skin: 'deck', plate: 'QKL-01' },
  'site-2': { questId: 'q2-law', label: 'Bench 2 - The Rate Law', title: 'The Rate Law', structure: 'control-room', kind: 'board', skin: 'desk', plate: 'QKL-02' },
  'site-3': { questId: 'q3-time', label: 'Bench 3 - Integrated Rate Laws', title: 'Integrated Rate Laws', structure: 'pump-cellar', kind: 'plotter', skin: 'shelf', plate: 'QKL-03' },
  'site-4': { questId: 'q4-collide', label: 'Bench 4 - Activation Energy', title: 'Activation Energy', structure: 'reactor-skirt', kind: 'profile', skin: 'desk', plate: 'QKL-04' },
  'site-5': { questId: 'q5-steps', label: 'Bench 5 - Reaction Mechanisms', title: 'Reaction Mechanisms', structure: 'reactor-table', kind: 'stack', skin: 'shelf', plate: 'QKL-05' },
  'site-6': { questId: 'q6-shortcut', label: 'Bench 6 - Catalysts', title: 'Catalysts', structure: 'catalyst-bunker', kind: 'catalyst', skin: 'deck', plate: 'QKL-06' }
};

/** The unit vector from a room's back wall toward its door. */
const FACE = { maxX: [1, 0], minX: [-1, 0], maxZ: [0, 1], minZ: [0, -1] };

export const HOST_PLAN = Object.fromEntries(Object.entries(PLAN).map(([id, p]) => {
  const room = ROOMS.find(r => r.site === id);
  const rr = room.rect;
  const face = FACE[room.door];
  const cx = (rr.minX + rr.maxX) / 2, cz = (rr.minZ + rr.maxZ) / 2;
  const x = face[0] > 0 ? rr.minX + PLATE_FROM_BACK : face[0] < 0 ? rr.maxX - PLATE_FROM_BACK : cx;
  const z = face[1] > 0 ? rr.minZ + PLATE_FROM_BACK : face[1] < 0 ? rr.maxZ - PLATE_FROM_BACK : cz;
  return [id, { ...p, room: room.id, floor: room.floor, pos: [Math.round(x * 100) / 100, Math.round(z * 100) / 100], face }];
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

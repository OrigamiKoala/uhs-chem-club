/**
 * kettle/host-plan.js — What each of Kettle's eight hosts is, which room of the works it stands in, and where its plate is.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:kettle` all stand on this one table.
 *
 * A host is the working machinery of ONE BAY of the works (`works-plan.js` names the rooms), and its bench: the stores'
 * racks, the scale bay's weighbridge, the control cabin's recipe board, the sump cellar's settling basin, the charge
 * bank's bunkers and weigh hopper, the pickling bay's tanks, the tapping pit's runner and ladle, the refining bay's vats.
 * The room (floor, walls, roof) is the building's (`works.js`); the host furnishes it and hangs its lamps.
 *
 * `pos` is where the plate stands (world x, z); `face` is the way the plate looks, toward the player. THE HOST FRAME has
 * its origin on the floor under the middle of the plate, +z toward the player, +x to the player's right.
 * `hostExtent` is the room in that frame, a wall's thickness in: no part of a host may stand outside it.
 *
 * Site ids are `site-N`, as in every other world; `questId`, `label` and `structure` are unchanged from the first build.
 */

import { ROOMS, WALL_T } from './works-plan.js';

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open floor in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/** How far in front of a plate the player is asked to stand. */
export const APPROACH = 4.6;

export const HOST_PLAN = {
  'site-2': {
    questId: 'q2-names', label: 'Bench 1 - Names and Formulas', title: 'Names and Formulas', structure: 'labelling-shed', kind: 'cards', skin: 'desk', plate: 'KET-01',
    room: 'stores', pos: [19, 31.6], face: [0, 1]
  },
  'site-3': {
    questId: 'q3-change', label: 'Bench 2 - Physical or Chemical', title: 'Physical or Chemical', structure: 'charging-pot', kind: 'pot', skin: 'deck', plate: 'KET-02',
    room: 'scale', pos: [-21, 29], face: [1, 0]
  },
  'site-4': {
    questId: 'q4-balance', label: 'Bench 3 - Balancing Equations', title: 'Balancing Equations', structure: 'control-room', kind: 'board', skin: 'desk', plate: 'KET-03',
    room: 'cabin', pos: [-12, -18.4], face: [0, 1]
  },
  'site-5': {
    questId: 'q5-ionic', label: 'Bench 4 - Net Ionic Equations', title: 'Net Ionic Equations', structure: 'effluent-sump', kind: 'ionic', skin: 'deck', plate: 'KET-04',
    room: 'sump', pos: [-34, -19], face: [1, 0]
  },
  'site-6': {
    questId: 'q6-stoich', label: 'Bench 5 - What Is Made', title: 'How Much Is Made', structure: 'charge-floor', kind: 'pot', skin: 'shelf', plate: 'KET-05',
    room: 'charge', pos: [22, -20], face: [0, 1]
  },
  'site-7': {
    questId: 'q7-titrate', label: 'Bench 6 - Titration', title: 'Titration', structure: 'pickling-line', kind: 'burette', skin: 'desk', plate: 'KET-06',
    room: 'pickling', pos: [28.6, 15], face: [-1, 0]
  },
  'site-8': {
    questId: 'q8-kinds', label: 'Bench 7 - Kinds of Reaction', title: 'Kinds of Reaction', structure: 'tapping-floor', kind: 'tests', skin: 'deck', plate: 'KET-07',
    room: 'pit', pos: [21, -57.4], face: [0, 1]
  },
  'site-9': {
    questId: 'q9-hsab', label: 'Bench 8 - Hard and Soft', title: 'Hard and Soft', structure: 'refining-vat', kind: 'ionic', skin: 'deck', plate: 'KET-08',
    room: 'refining', pos: [-25, -46], face: [0, -1]
  }
};

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

/** The host's room in the host's own frame, a wall's thickness in: `[x0, x1, z0, z1]`. */
export function hostExtent(plan) {
  const r = ROOMS.find(room => room.id === plan.room).rect;
  const pts = [[r.minX + WALL_T, r.minZ + WALL_T], [r.maxX - WALL_T, r.minZ + WALL_T], [r.minX + WALL_T, r.maxZ - WALL_T], [r.maxX - WALL_T, r.maxZ - WALL_T]].map(([x, z]) => toHost(plan, x, z));
  return [Math.min(...pts.map(p => p[0])), Math.max(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[1]))];
}

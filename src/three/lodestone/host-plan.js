/**
 * lodestone/host-plan.js — What each of Lodestone's six hosts is, which alcove of the canyon it stands in, and where its plate is.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:lodestone` all stand on this one table.
 *
 * A host is the working of ONE ALCOVE (`canyon-plan.js` declares them) and its bench: the core store's racks, the
 * manganese face's drill and ore bins, the seep's basin and leach tank, the drum gallery's drums and props, the chimney's
 * colour samples, the magnetite pocket's switchgear and test magnet. The alcove (floor, rock, roof) is the canyon's
 * (`terrain.js`); the host furnishes it and hangs its lamps.
 *
 * `pos` is where the plate stands (world x, z): `PLATE_FROM_BACK` out from the alcove's back wall, across its middle;
 * `face` is the alcove's, toward the canyon. THE HOST FRAME has its origin on the floor under the middle of the plate,
 * +z toward the player (and the mouth), +x to the player's right. `hostExtent` is the alcove in that frame, the rock's
 * colliders taken off: no part of a host may stand outside it.
 *
 * Site ids are `site-N`, as in every other world; `questId` and `label` are unchanged from the first build.
 */

import { ALCOVES, PLATE_FROM_BACK } from './canyon-plan.js';

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open floor in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/** How far in front of a plate the player is asked to stand. */
export const APPROACH = 4.6;

/** How far in from the rock's plane a host keeps (the walls' colliders reach 0.3 m in). */
export const ROCK_IN = 0.3;

const PLAN = {
  'site-1': { questId: 'q1-dblock', label: 'Bench 1 - The d-Block Assay', title: 'The d-Block', structure: 'core-store', kind: 'assay', skin: 'desk', plate: 'LDS-01' },
  'site-2': { questId: 'q2-charges', label: 'Bench 2 - Many Charges', title: 'Many Charges', structure: 'manganese-face', kind: 'crusher', skin: 'deck', plate: 'LDS-02' },
  'site-3': { questId: 'q3-complex', label: 'Bench 3 - Complex Ions', title: 'Complex Ions', structure: 'seep', kind: 'vats', skin: 'shelf', plate: 'LDS-03' },
  'site-4': { questId: 'q4-shapes', label: 'Bench 4 - Shapes and Isomers', title: 'Shapes and Isomers', structure: 'drum-gallery', kind: 'gantry', skin: 'desk', plate: 'LDS-04' },
  'site-5': { questId: 'q5-colour', label: 'Bench 5 - Colour Booth', title: 'Colour', structure: 'chimney', kind: 'booth', skin: 'shelf', plate: 'LDS-05' },
  'site-6': { questId: 'q6-spin', label: 'Bench 6 - Magnetism', title: 'Magnetism', structure: 'magnetite-pocket', kind: 'coil', skin: 'deck', plate: 'LDS-06' }
};

/** Where an alcove's plate stands: `PLATE_FROM_BACK` out from its back wall, across its middle. */
function plateOf(al) {
  const r = al.rect, [fx, fz] = al.face;
  const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
  if (fx > 0) return [r.minX + PLATE_FROM_BACK, cz];
  if (fx < 0) return [r.maxX - PLATE_FROM_BACK, cz];
  if (fz > 0) return [cx, r.minZ + PLATE_FROM_BACK];
  return [cx, r.maxZ - PLATE_FROM_BACK];
}

export const HOST_PLAN = Object.fromEntries(Object.entries(PLAN).map(([id, p]) => {
  const al = ALCOVES.find(a => a.site === id);
  const [x, z] = plateOf(al);
  return [id, { ...p, alcove: al.id, pos: [Math.round(x * 100) / 100, Math.round(z * 100) / 100], face: [...al.face] }];
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

/**
 * The host's alcove in the host's own frame: `[x0, x1, z0, z1]`, the rock's colliders taken off the three closed sides,
 * and the mouth's plane as the front.
 */
export function hostExtent(plan) {
  const al = ALCOVES.find(a => a.id === plan.alcove);
  const r = al.rect;
  const pts = [[r.minX, r.minZ], [r.maxX, r.minZ], [r.minX, r.maxZ], [r.maxX, r.maxZ]].map(([x, z]) => toHost(plan, x, z));
  const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0]));
  const z0 = Math.min(...pts.map(p => p[1])), z1 = Math.max(...pts.map(p => p[1]));
  return [x0 + ROCK_IN, x1 - ROCK_IN, z0 + ROCK_IN, z1];
}

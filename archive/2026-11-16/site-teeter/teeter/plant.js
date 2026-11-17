/**
 * teeter/plant.js — What stands on the pans besides the hosts: the beam pumps rocking in the pans, the salt
 * heaps, the brine tanks, the salt houses, drums and pallets.
 *
 * Each builder takes the world's `ctx` ({ M, own, lamps, t4, field }) and returns a Group with its origin on
 * the ground and `userData.colliders = [{ x, z, r }]` (discs, in the group's own frame, where a body can
 * actually touch it). A beam pump stands in a pan, out of the player's reach, so it declares none. The one thing
 * that moves is a pump's beam: it hands the world `userData.animate(t)`, and its moving parts are kept out of the
 * bake (`noMerge`). The lamp post and the landing pad are Ember Reach's own generic builders: they ask only for
 * the materials `lantern`, `concrete`, `rusted` and `darkSteel`.
 */

import * as THREE from 'three';
import { part, between, rockGeometry, rng } from '../ember/kit.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

const cyl = (ctx, g, rt, rb, h, mat, x, y, z, seg = 18, cast = true) => g.add(part(ctx, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, { cast })) && g;
const box = (ctx, g, w, h, d, mat, x, y, z, cast = true) => g.add(part(ctx, new THREE.BoxGeometry(w, h, d), mat, x, y, z, { cast })) && g;

/** The beam pump's reach: the pivot's height, the half-length of its beam, how far it tips. */
export const PUMP = { pivotY: 3.4, half: 3.5, tip: 0.13, period: 7.0 };

/**
 * A beam pump on a pier in a pan. The origin is on the pan floor; the pier rises to just above the land. A walking
 * beam rocks on a pivot between two A-frames: a counterweight hangs from one end and a pump rod from the other,
 * which dips into a standpipe on a footing. The beam is a see-saw and keeps one slow beat.
 */
export function buildBeamPump(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  const { pivotY: PY, half: H } = PUMP;
  box(ctx, g, 3.6, 0.9, 2.4, M.concrete, 0, 0.45, 0);                         // the pier
  box(ctx, g, 3.2, 0.12, 2.0, M.darkSteel, 0, 0.96, 0);                       // its sole plate
  for (const sz of [-1, 1]) {                                                 // the two A-frames
    for (const sx of [-1, 1]) g.add(between(ctx, [sx * 1.3, 1.0, sz * 0.85], [0, PY - 0.2, sz * 0.5], 0.09, M.steel, 8));
    g.add(part(ctx, new THREE.BoxGeometry(0.5, 0.4, 0.2), M.darkSteel, 0, PY - 0.2, sz * 0.5, { cast: true }));
  }
  g.add(between(ctx, [-1.3, 1.9, 0.85], [-1.3, 1.9, -0.85], 0.05, M.darkSteel, 6));   // a tie between the legs
  g.add(between(ctx, [1.3, 1.9, 0.85], [1.3, 1.9, -0.85], 0.05, M.darkSteel, 6));
  // The standpipe and its footing, under the beam's working end.
  box(ctx, g, 1.3, 0.3, 1.3, M.concrete, H, 0.15, 0);
  cyl(ctx, g, 0.24, 0.28, 1.3, M.clad, H, 0.95, 0, 16);
  cyl(ctx, g, 0.32, 0.32, 0.12, M.darkSteel, H, 1.62, 0, 16);

  // The moving parts. The beam rocks about the pivot; the rod hangs from its end and stays upright.
  const beam = new THREE.Group();
  beam.position.set(0, PY, 0);
  beam.userData.noMerge = true;
  beam.add(part(ctx, new THREE.BoxGeometry(2 * H, 0.3, 0.46), M.rusted, 0, 0, 0, { cast: true }));
  beam.add(part(ctx, new THREE.CylinderGeometry(0.16, 0.16, 1.3, 14), M.darkSteel, 0, 0, 0, { cast: true })).children.at(-1).rotation.x = Math.PI / 2;
  beam.add(part(ctx, new THREE.BoxGeometry(1.0, 0.95, 0.7), M.darkSteel, -H + 0.1, -0.62, 0, { cast: true }));       // the counterweight
  beam.add(part(ctx, new THREE.BoxGeometry(0.5, 0.9, 0.34), M.rusted, H - 0.12, -0.1, 0, { cast: true }));            // the head
  g.add(beam);
  const rod = new THREE.Group();
  rod.userData.noMerge = true;
  rod.add(part(ctx, new THREE.CylinderGeometry(0.045, 0.045, 1.9, 8), M.steel, 0, -0.95, 0));
  g.add(rod);

  const phase = seed * 1.7;
  const set = (a) => {
    beam.rotation.z = a;
    // The head's tip is at (H cos a, PY + H sin a); the rod is a fixed 1.9 m long, hung from its underside.
    rod.position.set(H * Math.cos(a), PY + H * Math.sin(a) - 0.5, 0);
  };
  set(0);
  g.userData.animate = t => set(PUMP.tip * Math.sin((t / PUMP.period) * Math.PI * 2 + phase));
  g.userData.colliders = [];
  return g;
}

/** A pile of harvested salt: white, heaped, shed at its foot. */
export function buildSaltHeap(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const s = lm.scale || 1;
  const heap = part(ctx, rockGeometry(3.2 * s, 110 + seed, { squash: 0.62, rough: 0.14 }), ctx.M.saltHeap, 0, 0, 0, { cast: true });
  heap.rotation.y = lm.rotY || 0;
  g.add(heap);
  g.userData.colliders = [{ x: 0, z: 0, r: 2.8 * s }];
  return g;
}

/** A brine tank: a tall steel drum on a ring wall with a stair stringer and a roof hatch. */
export function buildBrineTank(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  cyl(ctx, g, 3.0, 3.1, 0.7, M.concrete, 0, 0.35, 0, 28);
  cyl(ctx, g, 2.8, 2.8, 5.2, M.steel, 0, 3.3, 0, 28);
  for (const y of [1.9, 3.3, 4.7]) cyl(ctx, g, 2.84, 2.84, 0.1, M.darkSteel, 0, y, 0, 28, false);
  cyl(ctx, g, 0.3, 2.9, 0.9, M.roofSheet, 0, 6.35, 0, 28);
  cyl(ctx, g, 0.45, 0.45, 0.3, M.darkSteel, 0, 6.95, 0, 12);
  box(ctx, g, 0.5, 6.4, 0.2, M.darkSteel, 2.95, 3.2, 0);
  g.userData.colliders = [{ x: 0, z: 0, r: 3.3 }];
  return g;
}

/** A salt house: a long whitewashed shed under a saw-tooth roof, its big doors open on one side. */
export function buildSaltHouse(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  box(ctx, g, 12, 3.6, 5, M.plaster, 0, 1.8, 0);
  for (let i = 0; i < 3; i++) {                                         // a saw-tooth roof: three sloped sheets and their glazing
    const sheet = part(ctx, new THREE.BoxGeometry(3.9, 0.12, 5.3), M.roofSheet, -4 + i * 4, 4.0, 0, { cast: true });
    sheet.rotation.z = 0.32;
    g.add(sheet);
    box(ctx, g, 0.1, 0.8, 5, M.glass, -4 + i * 4 + 1.78, 4.15, 0, false);
  }
  box(ctx, g, 3.2, 2.7, 0.12, M.darkSteel, -2.5, 1.45, 2.56);
  box(ctx, g, 3.2, 2.7, 0.12, M.darkSteel, 2.5, 1.45, 2.56);
  g.userData.colliders = [{ x: -4, z: 0, r: 3.0 }, { x: 0, z: 0, r: 3.0 }, { x: 4, z: 0, r: 3.0 }];
  return g;
}

/** Drums of reagent, banded and stacked two high on a pallet. */
export function buildDrumStack(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0xd4a7 + seed * 11);
  g.add(part(ctx, new THREE.BoxGeometry(2.0, 0.14, 1.3), ctx.M.timber, 0, 0.07, 0));
  [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.32], [0.45, 0.32]].forEach(([x, z], i) => {
    g.add(part(ctx, new THREE.CylinderGeometry(0.28, 0.28, 0.86, 14), i % 2 ? ctx.M.drumB : ctx.M.paintBlue, x, 0.57 + (r() - 0.5) * 0.01, z, { cast: true }));
  });
  g.userData.colliders = [{ x: 0, z: 0, r: 1.2 }];
  return g;
}

/** Sacks of salt on a pallet, stacked crosswise. */
export function buildSackStack(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0x5ac4 + seed * 17);
  g.add(part(ctx, new THREE.BoxGeometry(2.2, 0.14, 1.6), ctx.M.timber, 0, 0.07, 0));
  for (let row = 0; row < 4; row++) for (let i = 0; i < 3; i++) {
    const turned = row % 2;
    const m = part(ctx, new THREE.BoxGeometry(turned ? 0.5 : 0.7, 0.2, turned ? 0.7 : 0.5), ctx.M.sack, -0.7 + i * 0.7, 0.24 + row * 0.2, (r() - 0.5) * 0.03, { cast: true });
    g.add(m);
  }
  g.userData.colliders = [{ x: 0, z: 0, r: 1.3 }];
  return g;
}

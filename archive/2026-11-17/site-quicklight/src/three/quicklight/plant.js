/**
 * quicklight/plant.js — Storm-belt cracking yard plant: cracking towers, storage tanks,
 * manifold racks, and storm pylons, plus Ember Reach's generic lamp post and landing pad.
 *
 * Each builder takes `ctx` ({ M, own, lamps, t4, field }) and returns a Group with its origin
 * on the ground and `userData.colliders = [{ x, z, r }]` in the group's own frame.
 */

import * as THREE from 'three';
import { part, between, rng } from '../ember/kit.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

const cyl = (ctx, g, rt, rb, h, mat, x, y, z, seg = 16, cast = true) =>
  g.add(part(ctx, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, { cast })) && g;
const box = (ctx, g, w, h, d, mat, x, y, z, cast = true) =>
  g.add(part(ctx, new THREE.BoxGeometry(w, h, d), mat, x, y, z, { cast })) && g;

/**
 * Tall cylindrical cracking tower on a concrete plinth, with flanged rings, external
 * riser pipe, and a top flare stack ring.
 */
export function buildCrackingTower(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  const r = rng(0x51a7 + seed * 19);
  cyl(ctx, g, 2.2, 2.4, 0.7, M.concrete, 0, 0.35, 0, 20);
  cyl(ctx, g, 1.45, 1.55, 8.6, M.steel, 0, 5.0, 0, 20);
  for (const y of [2.4, 4.8, 7.2, 9.1]) cyl(ctx, g, 1.62, 1.62, 0.14, M.darkSteel, 0, y, 0, 20, false);
  cyl(ctx, g, 0.55, 0.85, 2.2, M.rusted, 0, 10.4, 0, 14);
  cyl(ctx, g, 0.62, 0.62, 0.18, M.amber, 0, 11.45, 0, 14, false);
  // External riser pipe + tie brackets
  const ang = r() * Math.PI * 2;
  const px = Math.cos(ang) * 1.72, pz = Math.sin(ang) * 1.72;
  cyl(ctx, g, 0.14, 0.14, 8.2, M.copper, px, 4.8, pz, 10);
  for (const y of [3.0, 6.0, 8.4]) g.add(between(ctx, [0, y, 0], [px, y, pz], 0.08, M.darkSteel, 6));
  g.userData.colliders = [{ x: 0, z: 0, r: 2.35 }];
  return g;
}

/**
 * Squat pressurized storage tank on four concrete saddles with a top inspection hatch
 * and safety handrail posts.
 */
export function buildStorageTank(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  void seed;
  cyl(ctx, g, 2.6, 2.75, 0.55, M.concrete, 0, 0.275, 0, 22);
  cyl(ctx, g, 2.15, 2.15, 3.4, M.catwalk, 0, 2.25, 0, 24);
  for (const y of [1.4, 2.6, 3.85]) cyl(ctx, g, 2.2, 2.2, 0.1, M.darkSteel, 0, y, 0, 24, false);
  cyl(ctx, g, 0.65, 0.65, 0.26, M.rusted, 0, 4.08, 0, 14);
  cyl(ctx, g, 0.14, 0.14, 3.2, M.copper, 2.35, 2.15, 0, 10);
  box(ctx, g, 0.45, 3.7, 0.16, M.darkSteel, -2.25, 2.25, 0);
  g.userData.colliders = [{ x: 0, z: 0, r: 2.7 }];
  return g;
}

/**
 * Low pipe-manifold rack: two concrete sleepers, cross-beam frame, and three parallel
 * insulated process lines.
 */
export function buildManifoldRack(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  void seed;
  for (const sx of [-1.4, 1.4]) {
    box(ctx, g, 0.55, 0.4, 1.9, M.concrete, sx, 0.2, 0);
    box(ctx, g, 0.14, 1.35, 1.5, M.darkSteel, sx, 0.9, 0);
  }
  box(ctx, g, 3.2, 0.14, 1.5, M.steel, 0, 1.52, 0);
  for (const sz of [-0.48, 0, 0.48]) {
    const p = part(ctx, new THREE.CylinderGeometry(0.14, 0.14, 3.5, 12), M.copper, 0, 1.72, sz);
    p.rotation.z = Math.PI / 2;
    g.add(p);
  }
  g.userData.colliders = [{ x: -1.1, z: 0, r: 1.05 }, { x: 1.1, z: 0, r: 1.05 }];
  return g;
}

/**
 * Tapered storm-belt lightning/sensor pylon on a square concrete footing.
 */
export function buildStormPylon(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  void seed;
  box(ctx, g, 1.7, 0.55, 1.7, M.concrete, 0, 0.275, 0);
  const legAt = (y, s) => [[-s, y, -s], [s, y, -s], [s, y, s], [-s, y, s]];
  const levels = [[0.5, 0.72], [3.5, 0.48], [6.8, 0.28], [9.6, 0.16]];
  for (let i = 0; i < levels.length - 1; i++) {
    const [y0, s0] = levels[i], [y1, s1] = levels[i + 1];
    const a = legAt(y0, s0), b = legAt(y1, s1);
    for (let k = 0; k < 4; k++) {
      g.add(between(ctx, a[k], b[k], 0.06, M.steel, 6));
      const n = (k + 1) % 4;
      g.add(between(ctx, a[k], b[n], 0.035, M.darkSteel, 5));
      g.add(between(ctx, b[k], b[n], 0.04, M.darkSteel, 5));
    }
  }
  g.add(between(ctx, [0, 9.6, 0], [0, 11.1, 0], 0.035, M.amber, 6));
  g.userData.colliders = [{ x: 0, z: 0, r: 1.15 }];
  return g;
}

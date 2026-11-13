/**
 * lodestone/plant.js — The Fifth's canyon depot: drum stacks, ore heaps, magnetite boulders and the masts of the Coil, plus Ember Reach's
 * generic lamp post and landing pad. Each builder takes `ctx` ({ M, own, lamps, t4, field }) and returns a Group with its origin on the
 * ground and `userData.colliders = [{ x, z, r }]` in its own frame.
 */

import * as THREE from 'three';
import { part, between, rng, rockGeometry } from '../ember/kit.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

const cyl = (ctx, g, rt, rb, h, mat, x, y, z, seg = 16, cast = true) => { const m = part(ctx, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, { cast }); g.add(m); return m; };
const box = (ctx, g, w, h, d, mat, x, y, z, cast = true) => { const m = part(ctx, new THREE.BoxGeometry(w, h, d), mat, x, y, z, { cast }); g.add(m); return m; };

/** A pallet of the Fifth's drums: two rows of steel drums with banded lids, some painted, some rusted through. */
export function buildDrumStack(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  const r = rng(0x1d0 + seed * 31);
  box(ctx, g, 3.0, 0.14, 2.0, M.timber, 0, 0.07, 0, false);
  const mats = [M.drumBlue, M.rusted, M.drumGreen, M.steel];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const x = -0.95 + i * 0.95; const z = -0.48 + j * 0.96;
      const mat = mats[Math.floor(r() * mats.length)];
      cyl(ctx, g, 0.4, 0.4, 1.0, mat, x, 0.64, z, 18);
      for (const y of [0.4, 0.88]) cyl(ctx, g, 0.415, 0.415, 0.05, M.darkSteel, x, y, z, 18, false);
    }
  }
  g.userData.colliders = [{ x: -0.7, z: 0, r: 1.2 }, { x: 0.7, z: 0, r: 1.2 }];
  return g;
}

/** A heap of crushed iron ore, rust-red, with a few larger blocks on top. */
export function buildOreHeap(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  const geo = ctx.own(rockGeometry(2.4, 0x0e + seed, { squash: 0.45, detail: 3, rough: 0.22, sink: 0.25 }));
  const heap = new THREE.Mesh(geo, M.ore);
  heap.castShadow = heap.receiveShadow = ctx.t4;
  g.add(heap);
  const r = rng(0x77 + seed);
  for (let i = 0; i < 3; i++) {
    const a = r() * Math.PI * 2;
    const b = new THREE.Mesh(ctx.own(rockGeometry(0.45, 0x31 + seed * 7 + i, { squash: 0.7, detail: 1 })), M.magnetite);
    b.position.set(Math.cos(a) * 0.7, 0.85, Math.sin(a) * 0.7);
    b.castShadow = ctx.t4;
    g.add(b);
  }
  g.userData.colliders = [{ x: 0, z: 0, r: 2.4 }];
  return g;
}

/** A boulder of black magnetite, the canyon's lodestone. */
export function buildLodeBoulder(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(ctx.own(rockGeometry(1.6, 0x51 + seed * 13, { squash: 0.75, detail: 2, rough: 0.3, sink: 0.25 })), ctx.M.magnetite);
  m.castShadow = m.receiveShadow = ctx.t4;
  g.add(m);
  g.userData.colliders = [{ x: 0, z: 0, r: 1.6 }];
  return g;
}

/** A mast of the Coil: a lattice tower carrying a ring wound with copper, cabled down to a footing. */
export function buildCoilMast(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  void seed;
  box(ctx, g, 1.6, 0.5, 1.6, M.concrete, 0, 0.25, 0);
  const legAt = (y, s) => [[-s, y, -s], [s, y, -s], [s, y, s], [-s, y, s]];
  const levels = [[0.5, 0.6], [3.4, 0.42], [6.2, 0.3]];
  for (let i = 0; i < levels.length - 1; i++) {
    const a = legAt(...levels[i]); const b = legAt(...levels[i + 1]);
    for (let k = 0; k < 4; k++) {
      g.add(between(ctx, a[k], b[k], 0.06, M.steel, 6));
      g.add(between(ctx, a[k], b[(k + 1) % 4], 0.035, M.darkSteel, 5));
    }
  }
  const ring = part(ctx, new THREE.TorusGeometry(1.05, 0.22, 10, 28), M.copper, 0, 7.1, 0, { cast: true });
  g.add(ring);
  box(ctx, g, 0.5, 1.0, 0.16, M.darkSteel, 0, 6.6, 0.0);
  g.userData.colliders = [{ x: 0, z: 0, r: 1.0 }];
  return g;
}

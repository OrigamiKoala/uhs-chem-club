/**
 * kettle/plant.js — What stands on the soda flat besides the hosts: the blast furnace and its stoves, the
 * chimneys, the silos, the storage tanks, the conveyors, slag heaps, ingots and crates.
 *
 * Each builder takes the world's `ctx` ({ M, own, lamps, t4, field }) and returns a Group with its origin on
 * the ground and `userData.colliders = [{ x, z, r }]` (discs, in the group's own frame, where a body can
 * actually touch it). The lamp post and the landing pad are Ember Reach's own generic builders: they ask
 * only for the materials `lantern`, `concrete`, `rusted` and `darkSteel`.
 */

import * as THREE from 'three';
import { part, between, rockGeometry, rng } from '../ember/kit.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

const cyl = (ctx, g, rt, rb, h, mat, x, y, z, seg = 18, cast = true) => g.add(part(ctx, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, { cast })) && g;
const box = (ctx, g, w, h, d, mat, x, y, z, cast = true) => g.add(part(ctx, new THREE.BoxGeometry(w, h, d), mat, x, y, z, { cast })) && g;

/** The blast furnace: a tall shaft on a skirt, three downcomers to two hot-blast stoves, a cast house in front. */
export function buildFurnace(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  cyl(ctx, g, 6.2, 6.6, 1.2, M.concrete, 0, 0.6, 0, 24);
  cyl(ctx, g, 4.6, 5.4, 9, M.firebrick, 0, 5.7, 0, 24);          // the bosh and belly
  for (const y of [3, 7, 10]) cyl(ctx, g, 5.5 - (y - 3) * 0.1, 5.5 - (y - 3) * 0.1, 0.25, M.darkSteel, 0, y + 0.8, 0, 24);
  cyl(ctx, g, 3.4, 4.6, 8, M.steel, 0, 14.7, 0, 24);             // the shaft
  cyl(ctx, g, 1.5, 3.4, 4, M.steel, 0, 20.7, 0, 24);             // the throat
  cyl(ctx, g, 1.0, 1.0, 5, M.darkSteel, 0, 25.2, 0, 14);         // the bell hopper
  cyl(ctx, g, 1.5, 0.9, 1.2, M.darkSteel, 0, 28.3, 0, 14);
  for (const sx of [-1, 1]) {
    cyl(ctx, g, 2.6, 2.6, 20, M.clad, sx * 9.2, 10.6, -2, 20);   // a hot-blast stove
    cyl(ctx, g, 0.4, 2.6, 2.2, M.clad, sx * 9.2, 21.7, -2, 20);
    g.add(between(ctx, [sx * 6.6, 12, -2], [sx * 3.6, 12, -1.2], 0.5, M.rusted, 10));
    g.add(between(ctx, [sx * 1.6, 26, 0], [sx * 7.6, 20, -2], 0.45, M.rusted, 10));
  }
  box(ctx, g, 9, 3.4, 4.4, M.hallWall, 0, 1.7, 7.4);              // the cast house
  box(ctx, g, 9.6, 0.3, 5, M.roofSheet, 0, 3.55, 7.4);
  g.userData.colliders = [
    { x: 0, z: 0, r: 6.6 }, { x: -9.2, z: -2, r: 2.8 }, { x: 9.2, z: -2, r: 2.8 },
    { x: -3, z: 7.4, r: 2.4 }, { x: 0, z: 7.4, r: 2.4 }, { x: 3, z: 7.4, r: 2.4 }
  ];
  return g;
}

export function buildChimney(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  cyl(ctx, g, 2.6, 2.8, 0.8, M.concrete, 0, 0.4, 0, 20);
  cyl(ctx, g, 1.2, 1.9, 36, M.rusted, 0, 18.8, 0, 20);
  for (const y of [26, 30, 34]) cyl(ctx, g, 1.0 + (36 - y) * 0.021, 1.0 + (36 - y) * 0.021, 1.2, M.paintRed, 0, y, 0, 20, false);
  cyl(ctx, g, 1.35, 1.2, 0.4, M.darkSteel, 0, 37.2, 0, 20);
  g.userData.colliders = [{ x: 0, z: 0, r: 2.8 }];
  return g;
}

export function buildSilo(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  cyl(ctx, g, 2.5, 2.5, 7, M.clad, 0, 8.0, 0, 20);
  cyl(ctx, g, 2.5, 0.4, 3, M.clad, 0, 3.0, 0, 20);               // the hopper cone
  cyl(ctx, g, 0.1, 2.5, 1.2, M.roofSheet, 0, 12.1, 0, 20);
  for (const [dx, dz] of [[1.9, 1.9], [-1.9, 1.9], [1.9, -1.9], [-1.9, -1.9]]) box(ctx, g, 0.3, 4.6, 0.3, M.darkSteel, dx, 2.3, dz);
  g.userData.colliders = [{ x: 0, z: 0, r: 3.0 }];
  return g;
}

export function buildTank(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  cyl(ctx, g, 4.4, 4.4, 6, M.steel, 0, 3, 0, 28);
  for (const y of [1.5, 3, 4.5]) cyl(ctx, g, 4.45, 4.45, 0.1, M.darkSteel, 0, y, 0, 28, false);
  cyl(ctx, g, 0.3, 4.5, 1.2, M.roofSheet, 0, 6.6, 0, 28);
  box(ctx, g, 0.5, 6.4, 0.2, M.darkSteel, 4.5, 3.2, 0);          // the stair stringer
  g.userData.colliders = [{ x: 0, z: 0, r: 4.7 }];
  return g;
}

export function buildSlagHeap(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const s = lm.scale || 1;
  const heap = part(ctx, rockGeometry(3.0 * s, 70 + seed, { squash: 0.55, rough: 0.2 }), ctx.M.slagRock, 0, 0, 0, { cast: true });
  heap.rotation.y = lm.rotY || 0;
  g.add(heap);
  g.userData.colliders = [{ x: 0, z: 0, r: 2.7 * s }];   // the walk goes round the heap's body, not its skirt
  return g;
}

export function buildIngotStack(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0x1d607 + seed * 13);
  g.add(part(ctx, new THREE.BoxGeometry(2.6, 0.14, 1.4), ctx.M.timber, 0, 0.07, 0));
  for (let row = 0; row < 4; row++) for (let i = 0; i < 4 - row; i++) {
    const m = part(ctx, new THREE.BoxGeometry(0.58, 0.2, 0.34), ctx.M.ingot, -0.9 + row * 0.3 + i * 0.6, 0.24 + row * 0.2, (r() - 0.5) * 0.04, { cast: true });
    g.add(m);
  }
  g.userData.colliders = [{ x: -0.4, z: 0, r: 0.8 }, { x: 0.5, z: 0, r: 0.8 }];
  return g;
}

export function buildCrateStack(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0xc4a7e + seed * 19);
  g.add(part(ctx, new THREE.BoxGeometry(2.4, 0.14, 1.8), ctx.M.timber, 0, 0.07, 0));
  [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.42], [0.55, 0.42]].forEach(([x, z], i) => {
    const m = part(ctx, new THREE.BoxGeometry(0.95, 0.85, 0.75), i % 2 ? ctx.M.crate : ctx.M.crateB, x, 0.57, z, { cast: true });
    m.rotation.y = (r() - 0.5) * 0.1;
    g.add(m);
  });
  g.userData.colliders = [{ x: 0, z: 0, r: 1.3 }];
  return g;
}

/** A belt on trestles, seven metres up so the walk goes under it; only the trestle feet collide. */
export function buildConveyor(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  const L = 20;
  box(ctx, g, L, 0.5, 1.5, M.darkSteel, 0, 7.0, 0);
  box(ctx, g, L, 0.16, 1.1, M.rubber, 0, 7.33, 0);
  box(ctx, g, L, 0.5, 0.06, M.steel, 0, 7.55, 0.8);
  box(ctx, g, L, 0.5, 0.06, M.steel, 0, 7.55, -0.8);
  const cols = [];
  for (const x of [-8.5, -2.8, 2.8, 8.5]) {
    box(ctx, g, 0.3, 6.8, 0.3, M.rusted, x, 3.4, 0.6);
    box(ctx, g, 0.3, 6.8, 0.3, M.rusted, x, 3.4, -0.6);
    box(ctx, g, 0.3, 0.3, 1.5, M.darkSteel, x, 6.6, 0);
    cols.push({ x, z: 0, r: 1.0 });
  }
  g.userData.colliders = cols;
  return g;
}

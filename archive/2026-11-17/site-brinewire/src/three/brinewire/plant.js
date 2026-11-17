/**
 * brinewire/plant.js — What stands in the marsh besides the hosts: lattice pylons and brine tanks on footings in the pools, the
 * switch house in the court's pool, rotor piers along the lagoon, transformers, cable reels, salt heaps, ingot and crate stacks,
 * reeds, the cable runs between the pylons and the boardwalk's edge posts.
 *
 * Each builder takes the world's `ctx` ({ M, own, lamps, t4, field }) and returns a Group with its origin on
 * the ground (or on the pool floor, for what stands in a pool) and `userData.colliders = [{ x, z, r }]` (discs, in
 * the group's own frame, where a body can actually touch it). A thing in a pool stands out of the player's reach, so it
 * declares none. The one thing that moves is a rotor pier's cup wheel: it hands the world `userData.animate(t)`, and
 * its moving part is kept out of the bake (`noMerge`). The lamp post and the landing pad are Ember Reach's own generic
 * builders: they ask only for the materials `lantern`, `concrete`, `rusted` and `darkSteel`.
 *
 * The cable runs are ONE ambient object: they hang high over the pools and the spurs, touch only the pylons' arm tips, and
 * carry no collider (nothing walks under them but air).
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { part, between, rockGeometry, rng } from '../ember/kit.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

const cyl = (ctx, g, rt, rb, h, mat, x, y, z, seg = 18, cast = true) => g.add(part(ctx, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, { cast })) && g;
const box = (ctx, g, w, h, d, mat, x, y, z, cast = true) => g.add(part(ctx, new THREE.BoxGeometry(w, h, d), mat, x, y, z, { cast })) && g;

/** The rotor pier's cup wheel turns once in this many seconds: a slow drift, as if the wind were barely there. */
export const ROTOR = { period: 40, y: 2.35 };

/** Where a pylon's cables hang: the half-width of its arm, and the height of the clamp under it. */
export const PYLON = { arm: 2.8, hang: 10.4 };

/**
 * A lattice pylon standing in a pool. The origin is on the pool floor; four concrete pads, four legs drawn in to the waist,
 * four levels of cross-bracing, two arms (the upper one carries the cables on insulator strings) and a peak wire.
 */
export function buildPylon(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  const r = rng(0x9a11 + seed * 31);
  const legAt = (y, s) => [[-s, y, -s], [s, y, -s], [s, y, s], [-s, y, s]];
  const levels = [[0.5, 2.1], [3.6, 1.55], [6.9, 1.1], [10.0, 0.7], [12.6, 0.42]];
  // the footings, in the water
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(ctx, g, 1.0, 1.1, 1.0, M.concrete, sx * 2.15, 0.2, sz * 2.15);
  for (let i = 0; i < levels.length - 1; i++) {
    const [y0, s0] = levels[i], [y1, s1] = levels[i + 1];
    const a = legAt(y0, s0), b = legAt(y1, s1);
    for (let k = 0; k < 4; k++) {
      g.add(between(ctx, a[k], b[k], 0.085, M.steel, 6));
      const n = (k + 1) % 4;
      // the X in each face, and the ring at the top of the panel
      g.add(between(ctx, a[k], b[n], 0.045, M.darkSteel, 5));
      g.add(between(ctx, a[n], b[k], 0.045, M.darkSteel, 5));
      g.add(between(ctx, b[k], b[n], 0.05, M.darkSteel, 5));
    }
  }
  const [yw, sw] = levels[0];
  for (let k = 0; k < 4; k++) g.add(between(ctx, legAt(yw, sw)[k], legAt(yw, sw)[(k + 1) % 4], 0.05, M.darkSteel, 5));
  // two arms across the waist and the peak, and the insulator strings that hang from the upper one
  box(ctx, g, PYLON.arm * 2 + 0.3, 0.16, 0.16, M.steel, 0, 11.2, 0);
  box(ctx, g, 2.4, 0.14, 0.14, M.steel, 0, 8.6, 0);
  for (const sx of [-1, 1]) {
    g.add(between(ctx, [sx * 0.6, 10.4, 0], [sx * PYLON.arm, 11.15, 0], 0.045, M.darkSteel, 5));
    for (let i = 0; i < 6; i++) cyl(ctx, g, 0.13, 0.13, 0.06, M.paint2, sx * PYLON.arm, 11.0 - i * 0.12, 0, 10, false);
    cyl(ctx, g, 0.05, 0.05, 0.8, M.darkSteel, sx * PYLON.arm, 10.62, 0, 6, false);
  }
  g.add(between(ctx, [0, 12.6, 0], [0, 13.6, 0], 0.04, M.steel, 5));
  // a corroded band at the waterline, and a plate bolted on one leg
  box(ctx, g, 0.4, 0.5, 0.4, M.rusted, 2.15, 0.45 + r() * 0.1, 2.15);
  g.userData.colliders = [];
  return g;
}

/**
 * A brine tank on a footing in a pool: a ring wall of concrete under a copper-clad drum gone green, a walkway ring round a
 * hatch on top, and two copper bus pipes rising the side of it to a pair of insulators.
 */
export function buildBrineTank(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  cyl(ctx, g, 3.5, 3.6, 1.8, M.concrete, 0, 0.9, 0, 28);
  cyl(ctx, g, 2.8, 2.8, 4.2, M.copperClad, 0, 3.9, 0, 28);
  for (const y of [3.0, 4.2, 5.4]) cyl(ctx, g, 2.84, 2.84, 0.1, M.patinaDark, 0, y, 0, 28, false);
  cyl(ctx, g, 2.85, 2.85, 0.16, M.darkSteel, 0, 6.08, 0, 28);
  cyl(ctx, g, 0.8, 0.8, 0.3, M.patina, 0, 6.3, 0, 18);
  cyl(ctx, g, 0.45, 0.45, 0.2, M.darkSteel, 0, 6.55, 0, 12);
  box(ctx, g, 0.5, 6.2, 0.2, M.darkSteel, 2.95, 3.9, 0);                                   // the ladder stringer
  for (const sz of [-0.6, 0.6]) {
    cyl(ctx, g, 0.11, 0.11, 4.2, M.copper, 3.1, 4.0, sz, 10);                             // the bus pipes
    cyl(ctx, g, 0.2, 0.2, 0.5, M.paint2, 3.1, 6.35, sz, 10);                              // and their insulators
  }
  g.userData.colliders = [];
  return g;
}

/**
 * The switch house, standing on a pier in the court's pool and facing the court (+z in its own frame): a long concrete hall with
 * a flat steel roof and a parapet, a tall door, three bushings on the roof, two cable ducts down to the water and a stack.
 */
export function buildSwitchHouse(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  box(ctx, g, 12.4, 1.6, 7.6, M.concrete, 0, 0.8, 0);                                        // the pier it stands on
  box(ctx, g, 11.6, 4.4, 6.6, M.concrete, 0, 3.8, 0);                                        // the hall
  box(ctx, g, 12.0, 0.25, 7.0, M.darkSteel, 0, 6.1, 0);                                       // the roof slab
  for (const sz of [-1, 1]) box(ctx, g, 12.0, 0.5, 0.2, M.concrete, 0, 6.5, sz * 3.4);       // the parapet
  for (const sx of [-1, 1]) box(ctx, g, 0.2, 0.5, 6.6, M.concrete, sx * 5.9, 6.5, 0);
  box(ctx, g, 2.8, 3.4, 0.14, M.darkSteel, 0, 3.7, 3.35);                                    // the door
  box(ctx, g, 3.0, 0.2, 0.3, M.steel, 0, 5.5, 3.45);                                          // and its lintel
  for (const sx of [-3.2, 0, 3.2]) {                                                          // the bushings on the roof
    cyl(ctx, g, 0.3, 0.34, 0.5, M.paint2, sx, 6.5, -0.4, 12);
    for (let i = 0; i < 5; i++) cyl(ctx, g, 0.26 - i * 0.02, 0.26 - i * 0.02, 0.1, M.paint2, sx, 6.9 + i * 0.28, -0.4, 12);
    cyl(ctx, g, 0.12, 0.12, 0.3, M.copper, sx, 8.4, -0.4, 8);
  }
  for (const sx of [-1, 1]) {                                                                 // the cable ducts down to the water
    cyl(ctx, g, 0.42, 0.42, 1.3, M.darkSteel, sx * 4.4, 1.0, 4.05, 14);
    cyl(ctx, g, 0.62, 0.5, 0.35, M.patinaDark, sx * 4.4, 0.35, 4.05, 14);
  }
  cyl(ctx, g, 0.55, 0.7, 4.2, M.concrete, -4.4, 8.2, -1.6, 14);                              // the stack
  cyl(ctx, g, 0.78, 0.78, 0.18, M.darkSteel, -4.4, 10.4, -1.6, 14);
  g.userData.colliders = [];
  return g;
}

/**
 * A rotor pier in the lagoon: a square pier, a mast, and a three-cup wheel on it that the barest breeze turns. The wheel is the
 * one moving part, kept out of the bake; it turns flat about the mast and never tips.
 */
export function buildRotorPier(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  box(ctx, g, 2.0, 1.9, 2.0, M.concrete, 0, 0.95, 0);
  box(ctx, g, 1.5, 0.3, 1.5, M.darkSteel, 0, 2.05, 0);
  cyl(ctx, g, 0.1, 0.14, 1.1, M.steel, 0, 2.8, 0, 10);
  const wheel = new THREE.Group();
  wheel.position.set(0, ROTOR.y + 0.8, 0);
  wheel.userData.noMerge = true;
  wheel.add(part(ctx, new THREE.CylinderGeometry(0.14, 0.14, 0.16, 12), M.copper, 0, 0, 0, { cast: true }));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const arm = part(ctx, new THREE.BoxGeometry(0.9, 0.05, 0.05), M.darkSteel, Math.cos(a) * 0.45, 0, -Math.sin(a) * 0.45);
    arm.rotation.y = a;
    wheel.add(arm);
    const cup = part(ctx, new THREE.SphereGeometry(0.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.copperClad, Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9, { cast: true });
    cup.rotation.set(0, a, Math.PI / 2);
    wheel.add(cup);
  }
  g.add(wheel);
  const phase = seed * 0.9;
  g.userData.animate = t => { wheel.rotation.y = (t / ROTOR.period) * Math.PI * 2 + phase; };
  g.userData.colliders = [];
  return g;
}

/** A transformer on the land: a finned grey tank on a concrete plinth under a conservator drum and three porcelain bushings. */
export function buildTransformer(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  box(ctx, g, 3.0, 0.4, 2.6, M.concrete, 0, 0.2, 0);
  box(ctx, g, 2.2, 1.9, 1.6, M.steel, 0, 1.35, 0);
  for (let i = 0; i < 7; i++) {
    box(ctx, g, 0.06, 1.5, 0.5, M.darkSteel, -0.9 + i * 0.3, 1.3, 1.0);
    box(ctx, g, 0.06, 1.5, 0.5, M.darkSteel, -0.9 + i * 0.3, 1.3, -1.0);
  }
  cyl(ctx, g, 0.38, 0.38, 2.0, M.steel, 0, 2.7, 0, 16).children.at(-1).rotation.z = Math.PI / 2;
  for (const sx of [-0.7, 0, 0.7]) {
    cyl(ctx, g, 0.14, 0.18, 0.7, M.paint2, sx, 2.65, 0.5, 10);
    cyl(ctx, g, 0.2, 0.2, 0.08, M.paint2, sx, 3.0, 0.5, 10);
    cyl(ctx, g, 0.07, 0.07, 0.25, M.copper, sx, 3.17, 0.5, 8);
  }
  g.userData.colliders = [{ x: 0, z: 0, r: 2.1 }];
  return g;
}

/** A cable reel on its side: two plank cheeks on a core of wound copper-coloured cable, chocked on sleepers. */
export function buildCableReel(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  box(ctx, g, 0.3, 0.2, 2.2, M.timberDark, -0.7, 0.1, 0);
  box(ctx, g, 0.3, 0.2, 2.2, M.timberDark, 0.7, 0.1, 0);
  for (const sx of [-0.55, 0.55]) cyl(ctx, g, 1.3, 1.3, 0.14, M.timber, sx, 1.5, 0, 24).children.at(-1).rotation.z = Math.PI / 2;
  cyl(ctx, g, 0.95, 0.95, 0.96, M.copper, 0, 1.5, 0, 24).children.at(-1).rotation.z = Math.PI / 2;
  cyl(ctx, g, 0.14, 0.14, 1.4, M.darkSteel, 0, 1.5, 0, 8).children.at(-1).rotation.z = Math.PI / 2;
  g.userData.colliders = [{ x: 0, z: 0, r: 1.5 }];
  return g;
}

/** A heap of raked salt, white at the crown and grey at the foot. */
export function buildSaltHeap(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const s = lm.scale || 1;
  const heap = part(ctx, rockGeometry(3.2 * s, 110 + seed, { squash: 0.6, rough: 0.2 }), ctx.M.saltRock, 0, 0, 0, { cast: true });
  heap.rotation.y = lm.rotY || 0;
  g.add(heap);
  g.userData.colliders = [{ x: 0, z: 0, r: 2.8 * s }];
  return g;
}

/** Copper ingots stacked in a pyramid on a pallet. */
export function buildIngotStack(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0xd4a7 + seed * 11);
  g.add(part(ctx, new THREE.BoxGeometry(2.0, 0.14, 1.3), ctx.M.timber, 0, 0.07, 0));
  const rows = [4, 3, 2, 1];
  rows.forEach((n, row) => {
    for (let i = 0; i < n; i++) {
      g.add(part(ctx, new THREE.BoxGeometry(0.42, 0.18, 0.9), (i + row) % 2 ? ctx.M.copper : ctx.M.brass, (i - (n - 1) / 2) * 0.44, 0.23 + row * 0.19 + (r() - 0.5) * 0.004, 0, { cast: true }));
    }
  });
  g.userData.colliders = [{ x: 0, z: 0, r: 1.2 }];
  return g;
}

/** Timber crates on a pallet, stacked crosswise. */
export function buildCrateStack(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0x5ac4 + seed * 17);
  g.add(part(ctx, new THREE.BoxGeometry(2.2, 0.14, 1.6), ctx.M.timber, 0, 0.07, 0));
  for (let row = 0; row < 3; row++) for (let i = 0; i < 2; i++) {
    const turned = row % 2;
    g.add(part(ctx, new THREE.BoxGeometry(turned ? 0.8 : 1.0, 0.5, turned ? 1.0 : 0.8), (row + i) % 2 ? ctx.M.crate : ctx.M.crateB, -0.5 + i * 1.0, 0.39 + row * 0.5, (r() - 0.5) * 0.03, { cast: true }));
  }
  g.userData.colliders = [{ x: 0, z: 0, r: 1.3 }];
  return g;
}

/** A tuft of salt grass: tall tapering stems leaning a little, decoration only (no collider: the walk passes through it). */
export function buildReeds(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0x3ee5 + seed * 7);
  for (let i = 0; i < 14; i++) {
    const h = 0.9 + r() * 1.0;
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 1.0;
    const m = part(ctx, new THREE.ConeGeometry(0.035, h, 4), ctx.M.reed, Math.cos(a) * d, h / 2, Math.sin(a) * d);
    m.rotation.set((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3);
    g.add(m);
  }
  g.userData.colliders = [];
  return g;
}

/**
 * The cable runs: two conductors from each pylon to the next, hung from the arm tips and sagging a little (a parabola, deeper for
 * a longer span), as ONE ambient object. `cables` are the world's `[{ a: [x, z], b: [x, z] }]` pairs of pylon positions.
 */
export function buildCableRuns(ctx, cables) {
  const geos = [];
  for (const c of cables) {
    for (const side of [-1, 1]) {
      const x0 = c.a[0] + side * PYLON.arm, z0 = c.a[1], x1 = c.b[0] + side * PYLON.arm, z1 = c.b[1];
      const L = Math.hypot(x1 - x0, z1 - z0);
      const sag = Math.min(2.2, Math.max(0.6, L * 0.045));
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, PYLON.hang - sag * 4 * t * (1 - t), z0 + (z1 - z0) * t));
      }
      geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.04, 5, false));
    }
  }
  const g = new THREE.Group();
  if (!geos.length) return g;
  const merged = mergeGeometries(geos, false);
  for (const geo of geos) geo.dispose();
  const m = new THREE.Mesh(ctx.own(merged), ctx.M.darkSteel);
  m.castShadow = ctx.t4;
  g.add(m);
  g.name = 'cable-runs';
  g.userData.phys = 'ambient';
  g.userData.noMerge = true;
  return g;
}

/**
 * The boardwalk's edge posts: a short post every few metres down both sides of every walk, as ONE object. They stand
 * on the bank just clear of the planks and carry no collider (the walk is not narrowed by them), so the whole thing is
 * ambient. `roads` are the world's ribbons (`{ pts, width }`).
 */
export function buildWalkPosts(ctx, roads, field, { gap = 4.5, skip = () => false } = {}) {
  const geos = [];
  const post = new THREE.BoxGeometry(0.14, 0.9, 0.14);
  const cap = new THREE.BoxGeometry(0.2, 0.06, 0.2);
  for (const road of roads) {
    for (let i = 0; i < road.pts.length - 1; i++) {
      const [ax, az] = road.pts[i], [bx, bz] = road.pts[i + 1];
      const L = Math.hypot(bx - ax, bz - az);
      const tx = (bx - ax) / L, tz = (bz - az) / L;
      const nx = -tz, nz = tx;
      for (let d = gap; d < L - 1; d += gap) {
        for (const side of [-1, 1]) {
          const x = ax + tx * d + nx * side * (road.width / 2 + 0.22), z = az + tz * d + nz * side * (road.width / 2 + 0.22);
          if (skip(x, z)) continue;
          const y = field.height(x, z);
          const p = post.clone().translate(x, y + 0.45, z);
          const c = cap.clone().translate(x, y + 0.93, z);
          geos.push(p, c);
        }
      }
    }
  }
  const g = new THREE.Group();
  if (!geos.length) return g;
  const merged = mergeGeometries(geos, false);
  for (const geo of geos) geo.dispose();
  post.dispose();
  cap.dispose();
  const m = new THREE.Mesh(ctx.own(merged), ctx.M.timberDark);
  m.castShadow = ctx.t4;
  g.add(m);
  g.name = 'walk-posts';
  g.userData.phys = 'ambient';
  g.userData.noMerge = true;
  return g;
}

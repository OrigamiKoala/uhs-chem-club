/**
 * verdigris/plant.js — What stands in the marsh besides the hosts: ruined towers and tanks on piers in the pools, the
 * pump house in the court's pool, valve piers along the sump, storage tanks, rubble, drums, crates, reeds and the
 * boardwalk's edge posts.
 *
 * Each builder takes the world's `ctx` ({ M, own, lamps, t4, field }) and returns a Group with its origin on
 * the ground (or on the pool floor, for what stands in a pool) and `userData.colliders = [{ x, z, r }]` (discs, in
 * the group's own frame, where a body can actually touch it). A thing in a pool stands out of the player's reach, so it
 * declares none. The one thing that moves is a valve pier's handwheel: it hands the world `userData.animate(t)`, and
 * its moving part is kept out of the bake (`noMerge`). The lamp post and the landing pad are Ember Reach's own generic
 * builders: they ask only for the materials `lantern`, `concrete`, `rusted` and `darkSteel`.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { part, between, rockGeometry, rng } from '../ember/kit.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

const cyl = (ctx, g, rt, rb, h, mat, x, y, z, seg = 18, cast = true) => g.add(part(ctx, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, { cast })) && g;
const box = (ctx, g, w, h, d, mat, x, y, z, cast = true) => g.add(part(ctx, new THREE.BoxGeometry(w, h, d), mat, x, y, z, { cast })) && g;

/** The valve pier's handwheel turns once in this many seconds: a slow drift, as if the stem were being let off. */
export const WHEEL = { period: 40, y: 2.35 };

/**
 * A ruined round tower of the flooded fortress. The origin is on the pool floor; the drum rises out of the water, its
 * top broken down on one side to a stair of courses, a few merlons left standing and a patina-green iron ring round
 * the waist. Its one dry doorway faces the water.
 */
export function buildFortTower(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  const r = rng(0x7041 + seed * 29);
  cyl(ctx, g, 3.0, 3.25, 1.5, M.stone, 0, 0.75, 0, 24);                                  // the footing, in the water
  cyl(ctx, g, 2.55, 2.75, 3.8, M.stone, 0, 3.4, 0, 24);                                  // the drum
  cyl(ctx, g, 2.6, 2.6, 0.18, M.patinaDark, 0, 2.6, 0, 24, false);                       // the iron ring
  // The broken crown: courses stepped down toward one side, then a ring of merlons on the high side.
  const high = Math.PI * 0.2 + r() * 0.6;
  for (let i = 0; i < 6; i++) {
    const a = high + (i - 2.5) * 0.52;
    const up = 0.75 + (i % 3) * 0.26 + (i === 2 || i === 3 ? 0.4 : 0);
    const m = part(ctx, new THREE.BoxGeometry(0.85, up, 0.8), M.stone, Math.cos(a) * 2.35, 5.3 + up / 2, Math.sin(a) * 2.35, { cast: true });
    m.rotation.y = -a;
    g.add(m);
  }
  box(ctx, g, 1.0, 1.7, 0.2, M.darkSteel, Math.cos(high + Math.PI) * 2.65, 2.5, Math.sin(high + Math.PI) * 2.65);   // the doorway's iron door
  g.userData.colliders = [];
  return g;
}

/** A storage tank in a pool: a ring wall of masonry under a copper-clad drum gone green, a domed roof and a stair stringer. */
export function buildTankPier(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  cyl(ctx, g, 3.5, 3.6, 1.8, M.stone, 0, 0.9, 0, 28);
  cyl(ctx, g, 2.8, 2.8, 5.0, M.copperClad, 0, 4.3, 0, 28);
  for (const y of [3.1, 4.3, 5.5]) cyl(ctx, g, 2.84, 2.84, 0.1, M.patinaDark, 0, y, 0, 28, false);
  g.add(part(ctx, new THREE.SphereGeometry(2.8, 24, 8, 0, Math.PI * 2, 0, Math.PI / 5), M.patina, 0, 6.35, 0, { cast: true }));
  cyl(ctx, g, 0.45, 0.45, 0.3, M.darkSteel, 0, 6.95, 0, 12);
  box(ctx, g, 0.5, 6.0, 0.2, M.darkSteel, 2.95, 3.9, 0);
  g.userData.colliders = [];
  return g;
}

/**
 * The pump house, standing on a pier in the court's pool and facing the court (+z in its own frame): a long masonry hall
 * with a green copper roof, a tall arched door, two bell-mouthed intake pipes going down into the water and a stack.
 */
export function buildPumpHouse(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  box(ctx, g, 12.4, 1.6, 7.6, M.stone, 0, 0.8, 0);                                          // the pier it stands on
  box(ctx, g, 11.6, 4.4, 6.6, M.stone, 0, 3.8, 0);                                          // the hall
  for (const sz of [-1, 1]) {                                                                // the gable roof: two copper slabs meeting at the ridge
    const slab = part(ctx, new THREE.BoxGeometry(12.4, 0.2, 4.2), M.patina, 0, 6.9, sz * 1.93, { cast: true });
    slab.rotation.x = sz * 0.42;
    g.add(slab);
  }
  box(ctx, g, 12.4, 0.3, 0.3, M.patinaDark, 0, 7.72, 0);                                    // the ridge
  const tri = new THREE.Shape([new THREE.Vector2(-3.3, 0), new THREE.Vector2(3.3, 0), new THREE.Vector2(0, 1.65)]);
  for (const sx of [-1, 1]) {                                                                // the gable ends fill the wall up to the roof
    const gable = part(ctx, new THREE.ExtrudeGeometry(tri, { depth: 0.25, bevelEnabled: false }), M.stone, sx * 5.9, 6.0, 0, { cast: true });
    gable.rotation.y = Math.PI / 2;
    gable.position.z = 0;
    g.add(gable);
  }
  box(ctx, g, 2.8, 3.4, 0.14, M.darkSteel, 0, 3.7, 3.35);                                  // the door
  cyl(ctx, g, 1.4, 1.4, 0.14, M.darkSteel, 0, 5.4, 3.35, 20).children.at(-1).rotation.x = Math.PI / 2;   // and its round head
  for (const sx of [-1, 1]) {                                                                // the bell-mouthed intakes, on the front of the pier
    cyl(ctx, g, 0.42, 0.42, 1.3, M.copperClad, sx * 4.4, 1.0, 4.05, 14);
    cyl(ctx, g, 0.78, 0.5, 0.35, M.patinaDark, sx * 4.4, 0.35, 4.05, 14);
  }
  cyl(ctx, g, 0.55, 0.7, 5.2, M.stone, -4.4, 8.4, -1.6, 14);                                // the stack
  cyl(ctx, g, 0.78, 0.78, 0.18, M.darkSteel, -4.4, 11.1, -1.6, 14);
  g.userData.colliders = [];
  return g;
}

/**
 * A valve on a pier, in the sump: a square pier, a stem with a flat handwheel on it, a pipe bent away over the water.
 * The wheel turns very slowly; it is the one moving part, kept out of the bake.
 */
export function buildValvePier(ctx, lm, seed = 1) {
  const { M } = ctx;
  const g = new THREE.Group();
  box(ctx, g, 2.0, 1.9, 2.0, M.stone, 0, 0.95, 0);
  box(ctx, g, 1.5, 0.3, 1.5, M.darkSteel, 0, 2.05, 0);
  cyl(ctx, g, 0.3, 0.34, 0.9, M.copperClad, 0, 2.65, 0, 14);
  const wheel = new THREE.Group();
  wheel.position.set(0, WHEEL.y + 0.8, 0);
  wheel.userData.noMerge = true;
  wheel.add(part(ctx, new THREE.TorusGeometry(0.62, 0.06, 8, 24), M.patinaDark, 0, 0, 0, { cast: true })).children.at(-1).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const spoke = part(ctx, new THREE.BoxGeometry(1.2, 0.05, 0.06), M.patinaDark, 0, 0, 0);
    spoke.rotation.y = (i * Math.PI) / 4;
    wheel.add(spoke);
  }
  g.add(wheel);
  g.add(between(ctx, [0, 2.6, 0], [1.6, 2.9, 0.4], 0.2, M.copperClad, 12));
  const phase = seed * 0.9;
  g.userData.animate = t => { wheel.rotation.y = (t / WHEEL.period) * Math.PI * 2 + phase; };
  g.userData.colliders = [];
  return g;
}

/** A storage tank on the land: a copper-clad drum gone green on a masonry ring, with a stair stringer and a roof hatch. */
export function buildStorageTank(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  cyl(ctx, g, 3.0, 3.1, 0.7, M.stone, 0, 0.35, 0, 28);
  cyl(ctx, g, 2.8, 2.8, 5.2, M.copperClad, 0, 3.3, 0, 28);
  for (const y of [1.9, 3.3, 4.7]) cyl(ctx, g, 2.84, 2.84, 0.1, M.patinaDark, 0, y, 0, 28, false);
  cyl(ctx, g, 0.3, 2.9, 0.9, M.patina, 0, 6.35, 0, 28);
  cyl(ctx, g, 0.45, 0.45, 0.3, M.darkSteel, 0, 6.95, 0, 12);
  box(ctx, g, 0.5, 6.4, 0.2, M.darkSteel, 2.95, 3.2, 0);
  g.userData.colliders = [{ x: 0, z: 0, r: 3.3 }];
  return g;
}

/** A heap of fallen masonry, mossed at its foot. */
export function buildRubbleHeap(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const s = lm.scale || 1;
  const heap = part(ctx, rockGeometry(3.2 * s, 110 + seed, { squash: 0.6, rough: 0.2 }), ctx.M.rubble, 0, 0, 0, { cast: true });
  heap.rotation.y = lm.rotY || 0;
  g.add(heap);
  g.userData.colliders = [{ x: 0, z: 0, r: 2.8 * s }];
  return g;
}

/** Drums of reagent, banded and stacked on a pallet. */
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

/** A tuft of reeds: tall tapering stems leaning a little, decoration only (no collider: the walk passes through reeds). */
export function buildReeds(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0x3ee5 + seed * 7);
  for (let i = 0; i < 14; i++) {
    const h = 1.6 + r() * 1.5;
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 1.0;
    const m = part(ctx, new THREE.ConeGeometry(0.035, h, 4), ctx.M.reed, Math.cos(a) * d, h / 2, Math.sin(a) * d);
    m.rotation.set((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3);
    g.add(m);
  }
  g.userData.colliders = [];
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

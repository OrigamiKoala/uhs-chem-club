/**
 * kettle/plant.js — What the works has besides its building and its hosts: the blast furnace and its stoves behind the
 * cast house, the yard, and the far country.
 *
 * Each builder takes the world and returns a Group with its origin on the ground and `userData.colliders =
 * [{ x, z, r }]` (discs, in the group's own frame, where a body can actually touch it). The lamp post and the landing
 * pad are Ember Reach's own generic builders: they ask only for the materials `lantern`, `concrete`, `rusted` and
 * `darkSteel`.
 */

import * as THREE from 'three';
import { kitFor } from './kit.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

/** The colour of iron running from the tap hole: the one fire in the works. Hotter and redder than a lamp. */
export const FURNACE_FIRE = 0xc1521c;

/**
 * THE BLAST FURNACE, behind the cast house's end wall, with its two stoves and the stack. Its breast (the firebrick
 * front the tap hole is in) fills the hole the plan leaves in that wall, so from the cast house floor the furnace is
 * the end of the room. The iron runs from the tap hole in a sand-lined runner across the floor to the lip of the
 * tapping pit: that iron is the ONE FIRE in the works, one source in the lamp pool, and it does not bloom.
 */
export function buildFurnace(w) {
  const { M } = w;
  const k = kitFor(w);
  const F = w.data.works.furnace;
  const g = new THREE.Group();
  g.name = 'furnace';
  g.position.set(F.x, 0, F.z);
  const wallZ = w.plan.byId.get('cast').rect.minZ - F.z;            // the cast house's end wall, in the furnace's frame
  k.cyl(g, [F.r + 0.5, F.r + 0.7, 1.0, 28], M.concrete, [0, 0.5, 0]);
  k.cyl(g, [F.r, F.r, 5.2, 28], M.firebrick, [0, 3.6, 0]);          // the hearth
  for (const y of [1.6, 3.2, 4.8, 6.0]) k.cyl(g, [F.r + 0.06, F.r + 0.06, 0.22, 28], M.darkSteel, [0, y, 0], null, false);
  k.cyl(g, [5.4, F.r, 4.2, 28], M.firebrick, [0, 8.3, 0]);          // the bosh
  k.cyl(g, [3.6, 5.4, 12, 28], M.steel, [0, 16.4, 0]);              // the shaft
  for (const y of [11.5, 14.5, 17.5, 20.5]) k.cyl(g, [5.5 - (y - 10.4) * 0.15, 5.5 - (y - 10.4) * 0.15, 0.2, 28], M.darkSteel, [0, y, 0], null, false);
  k.cyl(g, [1.7, 3.6, 3.6, 24], M.steel, [0, 24.2, 0]);             // the throat
  k.cyl(g, [1.2, 1.2, 4.4, 16], M.darkSteel, [0, 28.2, 0]);         // the bell hoppers
  k.cyl(g, [1.7, 1.0, 1.2, 16], M.darkSteel, [0, 31.0, 0]);
  // The bustle pipe round the bosh, and the tuyere stocks down from it.
  const bustle = new THREE.Mesh(w.own(new THREE.TorusGeometry(F.r + 1.3, 0.55, 10, 36)), M.rusted);
  bustle.rotation.x = Math.PI / 2;
  bustle.position.y = 7.4;
  bustle.castShadow = w.t4;
  g.add(bustle);
  for (let i = 0; i < 10; i++) {
    const a = (i + 0.5) / 10 * Math.PI * 2;
    k.strut(g, [Math.sin(a) * (F.r + 1.3), 7.0, Math.cos(a) * (F.r + 1.3)], [Math.sin(a) * (F.r - 0.1), 5.4, Math.cos(a) * (F.r - 0.1)], 0.2, M.rusted, 8);
  }
  // The stoves: tall domed shells, the hot blast main from each to the bustle, the gas downcomer from the throat.
  for (const sx of [-1, 1]) {
    const x = sx * 14.5, z = -3.5;
    k.cyl(g, [2.7, 2.7, 22, 22], M.clad, [x, 11.6, z]);
    const dome = new THREE.Mesh(w.own(new THREE.SphereGeometry(2.7, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2)), M.clad);
    dome.position.set(x, 22.6, z);
    dome.castShadow = w.t4;
    g.add(dome);
    k.cyl(g, [3.0, 3.1, 0.6, 22], M.concrete, [x, 0.3, z]);
    for (const y of [5, 10, 15, 20]) k.cyl(g, [2.76, 2.76, 0.16, 22], M.darkSteel, [x, y, z], null, false);
    k.strut(g, [x - sx * 2.6, 8.4, z], [sx * (F.r + 1.6), 7.5, -0.6], 0.6, M.rusted, 12);
    k.strut(g, [sx * 1.4, 26.0, 0], [x - sx * 1.2, 23.4, z], 0.5, M.rusted, 12);
  }
  // The stack, off to the east behind the stoves.
  k.cyl(g, [2.6, 2.9, 1.0, 20], M.concrete, [24, 0.5, -9]);
  k.cyl(g, [1.2, 2.0, 40, 20], M.brick, [24, 21, -9]);
  for (const y of [30, 34, 38]) k.cyl(g, [1.25 + (41 - y) * 0.02, 1.25 + (41 - y) * 0.02, 0.5, 20], M.darkSteel, [24, y, -9], null, false);
  k.strut(g, [17, 4, -4], [22.4, 4, -8.6], 0.7, M.rusted, 12);     // the flue from the stoves to the stack

  // THE BREAST: firebrick, standing through the wall into the cast house, the tap hole low in its middle.
  const bz = wallZ + 0.16;                                           // its face, a hand's breadth into the room
  k.slab(g, [8.6, 5.4, bz + F.r - 1.5], M.firebrickWall, [0, 2.7, (bz - F.r + 1.5) / 2 + 0.0], { tile: 2 });
  k.box(g, [8.9, 0.45, 0.5], M.darkIron, [0, 5.3, bz - 0.2]);
  for (const sx of [-1, 1]) k.box(g, [0.4, 5.2, 0.5], M.darkIron, [sx * 4.1, 2.6, bz - 0.2]);
  k.box(g, [1.3, 1.0, 0.12], M.darkIron, [0, 1.1, bz + 0.02]);       // the tap hole's frame
  k.box(g, [0.7, 0.5, 0.14], M.iron, [0, 1.0, bz + 0.03], null, false);
  // The runner: from the tap hole down to the floor, south, then across to the lip of the tapping pit.
  const lip = [w.plan.byId.get('pit').rect.minX - 0.5 - F.x, -57.0 - F.z];
  const bend = [0, bz + 1.3];
  const trough = (a, b, y0, y1) => {
    k.bar(g, [a[0], y0 + 0.11, a[1]], [b[0], y1 + 0.11, b[1]], 0.6, M.darkIron).scale.set(1, 1, 0.37);
    k.bar(g, [a[0], y0 + 0.24, a[1]], [b[0], y1 + 0.24, b[1]], 0.22, M.iron).scale.set(1, 1, 0.12);
  };
  trough([0, bz + 0.1], bend, 0.55, 0.02);
  trough(bend, lip, 0.02, 0.02);
  // The fire's light: one source for the pool, at the tap hole.
  k.lamp(g, 0, 1.3, bz + 1.0, { intensity: 46, distance: 24, color: FURNACE_FIRE, bulb: false });

  g.userData.colliders = [
    { x: 0, z: 0, r: F.r + 0.8 }, { x: -14.5, z: -3.5, r: 3.2 }, { x: 14.5, z: -3.5, r: 3.2 }, { x: 24, z: -9, r: 3.0 },
    { x: -9.5, z: -2, r: 1.2 }, { x: 9.5, z: -2, r: 1.2 }, { x: 19.6, z: -6.2, r: 1.2 },
    // the spout under the tap hole, where the runner is still off the floor
    { x: 0, z: wallZ + 0.75, r: 0.75 }
  ];
  return g;
}

/**
 * THE YARD'S TRACK: the works' own line comes in at the charge door. Rails and sleepers laid flush from a buffer stop
 * in the yard through the door and thirty metres up the nave. Nothing stands on it.
 */
export function buildTrack(w) {
  const { M } = w;
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'works-track';
  const X = 2.4, Z0 = 16, Z1 = 66;
  for (const dx of [-0.72, 0.72]) k.box(g, [0.07, 0.1, Z1 - Z0], M.steel, [X + dx, 0.05, (Z0 + Z1) / 2], null, false);
  for (let z = Z0 + 0.4; z < Z1; z += 0.75) k.box(g, [2.3, 0.04, 0.22], M.timber, [X, 0.02, z], null, false);
  for (const z of [Z0 - 0.3, Z1 + 0.3]) {                              // a buffer stop at each end
    k.box(g, [2.0, 0.9, 0.3], M.timber, [X, 0.75, z]);
    for (const dx of [-0.72, 0.72]) k.bar(g, [X + dx, 0.05, z + (z < 30 ? 1.2 : -1.2)], [X + dx, 1.1, z], 0.12, M.rusted);
  }
  g.userData.colliders = [{ x: X, z: Z0 - 0.3, r: 1.1 }, { x: X, z: Z1 + 0.3, r: 1.1 }];
  return g;
}

/**
 * ON THE HEAPS (closed ground, never walked): the tipping trestle along the slag tip's crest with a slag pot standing on
 * it, and the ore bridge standing over the ore stock. Each is this works' own, and each is where its heap came from.
 */
export function buildHeapPlant(w) {
  const { M } = w;
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'heap-plant';
  const ground = (x, z) => w.getTerrainHeight(x, z);
  const tip = w.plan.hills.find(h => h.id === 'slag-tip');
  if (tip) {
    // The trestle runs along the crest from the works' side to the tip's far end, level, on timber bents.
    const x = tip.rect.maxX - 26, z0 = tip.rect.minZ + 22, z1 = tip.rect.maxZ - 24, deck = tip.H + 2.6;
    for (let z = z0; z <= z1 + 0.1; z += 5) {
      const y = ground(x, z);
      for (const dx of [-1.1, 1.1]) k.bar(g, [x + dx * 1.5, y - 0.2, z], [x + dx, deck, z], 0.26, M.timber);
      k.box(g, [2.8, 0.26, 0.26], M.timber, [x, deck - 0.13, z]);
      k.bar(g, [x - 1.5, y + 0.4, z], [x + 1.1, deck - 0.5, z], 0.14, M.timber);
    }
    for (const dx of [-0.72, 0.72]) k.box(g, [0.08, 0.12, z1 - z0 + 2], M.steel, [x + dx, deck + 0.06, (z0 + z1) / 2], null, false);
    for (const dx of [-1.0, 1.0]) k.box(g, [0.24, 0.24, z1 - z0 + 2], M.timber, [x + dx, deck - 0.12, (z0 + z1) / 2]);
    const pz = z0 + 12;                                               // the slag pot on its car, tipped toward the slope
    k.box(g, [2.0, 0.3, 2.6], M.darkSteel, [x, deck + 0.33, pz]);
    const pot = k.cyl(g, [1.25, 0.7, 1.7, 18], M.darkIron, [x - 0.3, deck + 1.5, pz]);
    pot.rotation.z = 0.5;
    for (const dz of [-0.8, 0.8]) for (const dx of [-0.72, 0.72]) k.cyl(g, [0.26, 0.26, 0.1, 12], M.darkIron, [x + dx, deck + 0.3, pz + dz], [0, 0, Math.PI / 2]);
  }
  const ore = w.plan.hills.find(h => h.id === 'ore-stock');
  if (ore) {
    // The ore bridge: two braced legs across the stock, a truss between them, the grab hanging over the heap.
    const zc = (ore.rect.minZ + ore.rect.maxZ) / 2, xa = ore.rect.minX + 5, xb = ore.rect.maxX - 6, top = 19;
    for (const x of [xa, xb]) {
      for (const dz of [-4, 4]) {
        k.bar(g, [x, ground(x, zc + dz) - 0.2, zc + dz], [x, top, zc + dz * 0.25], 0.5, M.steel);
        k.box(g, [1.4, 0.5, 1.4], M.concrete, [x, ground(x, zc + dz) + 0.1, zc + dz]);
      }
      k.bar(g, [x, 7, zc - 2.9], [x, 7, zc + 2.9], 0.3, M.rusted);
      k.bar(g, [x, 13, zc - 1.9], [x, 13, zc + 1.9], 0.3, M.rusted);
    }
    for (const dz of [-1, 1]) {
      k.bar(g, [xa - 6, top, zc + dz], [xb + 5, top, zc + dz], 0.4, M.steel);
      k.bar(g, [xa - 6, top + 2.6, zc + dz], [xb + 5, top + 2.6, zc + dz], 0.3, M.steel);
      const n = 12;
      for (let i = 0; i <= n; i++) {
        const x = xa - 6 + (xb + 11 - xa) * (i / n);
        k.bar(g, [x, top, zc + dz], [x, top + 2.6, zc + dz], 0.16, M.rusted);
        if (i < n) k.bar(g, [x, top + (i % 2 ? 2.6 : 0), zc + dz], [xa - 6 + (xb + 11 - xa) * ((i + 1) / n), top + (i % 2 ? 0 : 2.6), zc + dz], 0.14, M.rusted);
      }
    }
    const gx = xa + 14;
    k.box(g, [3.2, 2.2, 2.6], M.clad, [gx, top + 1.3, zc]);            // the trolley and its cab
    k.strut(g, [gx, top, zc], [gx, 13.5, zc], 0.05, M.darkSteel, 5);
    for (const s of [-1, 1]) k.box(g, [1.3, 1.5, 1.8], M.rusted, [gx + s * 0.75, 12.6, zc], [0, 0, s * 0.45]);   // the grab's two jaws
  }
  return g;
}

/**
 * THE FAR COUNTRY, beyond the walk: not places, the horizon's own (`phys: 'ambient'`). North, a second works standing
 * cold; east, a gasholder in its guide frame; south, the pylons that carry the works' power out across the flat; west,
 * a battery of ovens with its quench tower.
 */
export function buildFarCountry(w) {
  const { M } = w;
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'far-country';
  g.userData.phys = 'ambient';
  const y0 = (x, z) => w.getTerrainHeight(x, z) - 0.5;
  // NORTH: the cold works. A long shed, a furnace with no top gear, three stacks of unequal height.
  {
    const [x, z] = [-60, -250], y = y0(x, z);
    k.slab(g, [110, 16, 30], M.sheet, [x, y + 8, z], { tile: 6 });
    k.slab(g, [112, 0.6, 32], M.roofSheet, [x, y + 16.3, z], { tile: 6 });
    k.slab(g, [70, 4, 8], M.sheet, [x - 10, y + 18.6, z], { tile: 6 });
    k.cyl(g, [5, 7.5, 34, 18], M.rusted, [x + 74, y + 17, z + 6]);
    k.cyl(g, [3.0, 3.0, 26, 16], M.clad, [x + 90, y + 13, z + 2]);
    for (const [dx, h] of [[-66, 52], [-78, 44], [100, 60]]) k.cyl(g, [1.6, 2.6, h, 14], M.brick, [x + dx, y + h / 2, z - 14]);
  }
  // EAST: the gasholder: a bell inside a ring of guide columns, tied at three heights.
  {
    const [x, z] = [215, 70], y = y0(x, z), R = 20;
    k.cyl(g, [R, R, 22, 32], M.steel, [x, y + 11, z]);
    k.cyl(g, [R * 0.2, R, 2.4, 32], M.roofSheet, [x, y + 23.2, z]);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, b = (i + 1) / 12 * Math.PI * 2;
      const p = t => [x + Math.sin(t) * (R + 1.6), z + Math.cos(t) * (R + 1.6)];
      k.bar(g, [p(a)[0], y, p(a)[1]], [p(a)[0], y + 34, p(a)[1]], 0.6, M.rusted);
      for (const h of [12, 23, 34]) k.bar(g, [p(a)[0], y + h, p(a)[1]], [p(b)[0], y + h, p(b)[1]], 0.36, M.rusted);
    }
  }
  // SOUTH: six pylons going out across the flat from the yard's corner, the conductors between them.
  {
    let prev = null;
    for (let i = 0; i < 6; i++) {
      const x = 26 + i * 26, z = 128 + i * 44, y = y0(x, z), H = 30;
      for (const [dx, dz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) k.bar(g, [x + dx * 3.2, y, z + dz * 3.2], [x + dx * 0.5, y + H, z + dz * 0.5], 0.3, M.steel);
      for (const h of [8, 16, 23]) { const s = 3.2 - (2.7 * h) / H; k.bar(g, [x - s, y + h, z - s], [x + s, y + h, z + s], 0.18, M.steel); k.bar(g, [x + s, y + h, z - s], [x - s, y + h, z + s], 0.18, M.steel); }
      for (const h of [22, 27]) k.bar(g, [x - 6, y + h, z + 3.5], [x + 6, y + h, z - 3.5], 0.3, M.steel);
      const tips = [[-6, 22, 3.5], [6, 22, -3.5], [-6, 27, 3.5], [6, 27, -3.5]].map(([dx, h, dz]) => [x + dx, y + h - 0.6, z + dz]);
      if (prev) tips.forEach((t, n) => k.bar(g, prev[n], t, 0.07, M.darkSteel));
      prev = tips;
    }
  }
  // WEST: the oven battery: a long low block of ovens under a charging deck, the quench tower at its end.
  {
    const [x, z] = [-225, -30], y = y0(x, z);
    k.slab(g, [14, 9, 120], M.brick, [x, y + 4.5, z], { tile: 4 });
    for (let i = 0; i < 20; i++) k.box(g, [14.6, 9.4, 0.5], M.darkSteel, [x, y + 4.7, z - 57 + i * 6]);
    k.slab(g, [10, 0.5, 122], M.concrete, [x, y + 9.4, z], { tile: 6 });
    k.box(g, [5, 5, 6], M.rusted, [x, y + 12.2, z + 20]);              // the charging car on the deck
    k.cyl(g, [5.2, 7.5, 30, 4], M.timber, [x + 2, y + 15, z - 78], [0, Math.PI / 4, 0]);   // the quench tower
    for (const dz of [-40, 0, 40]) k.cyl(g, [0.9, 1.4, 26, 10], M.brick, [x - 12, y + 13, z + dz]);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return g;
}

/**
 * THE STACK'S SMOKE: the one thing over the works that moves. Sixteen puffs in one instanced mesh, rising from the
 * stack's mouth and leaning downwind as they grow and thin. It is smoke: unlit, grey, never bright.
 */
export function buildSmoke(w) {
  const F = w.data.works.furnace;
  const mouth = new THREE.Vector3(F.x + 24, 41.4, F.z - 9);
  const N = 16;
  const mat = new THREE.MeshBasicMaterial({ color: 0x5a554e, transparent: true, opacity: 0.22, depthWrite: false, fog: true });
  const mesh = new THREE.InstancedMesh(w.own(new THREE.IcosahedronGeometry(1, 1)), w.own(mat), N);
  mesh.name = 'stack-smoke';
  mesh.userData.noMerge = true;
  mesh.userData.mover = true;
  mesh.userData.phys = 'ambient';
  mesh.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const set = (time) => {
    for (let i = 0; i < N; i++) {
      const t = ((time * 0.045 + i / N) % 1 + 1) % 1;                 // 0 at the mouth, 1 where it is gone
      const lean = t * t;
      p.set(mouth.x + lean * 46 + Math.sin(i * 2.4 + time * 0.2) * t * 3, mouth.y + t * 30 - lean * 6, mouth.z - lean * 20 + Math.cos(i * 1.7) * t * 3);
      const r = (1.4 + t * 9) * Math.min(1, t * 8) * Math.min(1, (1 - t) * 3.2);
      s.set(r, r * 0.8, r);
      mesh.setMatrixAt(i, m.compose(p, q, s));
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  set(0);
  mesh.userData.advance = set;
  return mesh;
}

/** What `kettle.js` builds, in order: each is `(world) => Object3D`, with `userData.colliders` where a body can be touched. */
export const PLANT_BUILDERS = [buildFurnace, buildTrack, buildHeapPlant, buildFarCountry, buildSmoke];

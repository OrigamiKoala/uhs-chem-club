/**
 * lodestone/plant.js — What the Fifth fitted in the canyon, what fell into it, and what stands beyond it.
 *
 *   the lamps       caged work lamps on brackets bolted to the walls, every 14 m down the canyon, side to side; four
 *                   floodlamps on masts round the pothole. Each is a `lampMark` the world pools (only lamps are lit).
 *   the cable       the Coil's feed, from the magnetite pocket along the foot of the last two runs into the pothole, to a
 *                   junction box against its wall
 *   the rockfall    blocks fallen from the walls, lying against their feet where the floor is not a landing
 *   the yard        the Fifth's sorting in the pothole: drums the Coil pulled, piled on a steel tray by the east wall;
 *                   drums it left, standing by the west wall
 *   far country     beyond the walk, one thing to each quarter: the ropeway's pylons and loading tower to the north, the
 *                   escarpment to the east (in the height field), the black butte to the south, the ore conveyor and its
 *                   bin to the west. `phys: 'ambient'`.
 *
 * Every builder takes the world and returns a group placed in world coordinates; `userData.colliders` are world discs
 * `{ x, z, r }`. Nothing here carries lettering.
 */

import * as THREE from 'three';
import { kitFor } from '../kettle/kit.js';
import { POTHOLE, ARENA } from './canyon-plan.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

/** A canyon lamp: hung higher and in the open, so brighter and longer than an alcove's. */
const CANYON_LAMP = { intensity: 11, distance: 16 };

/** The point `t` m along run `r`, `c` m across it (to the run's left, +), and the outward normal on that side. */
function onRun(r, t, c) {
  const x = r.A.x + r.dx * t - r.dz * c, z = r.A.z + r.dz * t + r.dx * c;
  const s = Math.sign(c) || 1;
  return { x, z, n: [-r.dz * s, r.dx * s] };
}

/** The lamps down the canyon's walls and round the pothole. */
export function buildCanyonLamps(w) {
  const k = kitFor(w);
  const { plan, field, M } = w;
  const g = new THREE.Group();
  g.name = 'canyon-lamps';
  g.userData.colliders = [];
  // Every 13 m down the canyon, on one wall then the other; where that wall is an alcove's mouth or a corner, the other
  // wall, or a stride on.
  let side = 1;
  const solidAt = (r, t, c) => { const q = onRun(r, t, c); return plan.sample(q.x + q.n[0] * 0.6, q.z + q.n[1] * 0.6).depth <= -0.3; };
  for (let sv = 6; sv < plan.length - 2; sv += 13) {
    const r = plan.runs.find(rn => sv <= rn.s0 + rn.L) || plan.runs[plan.runs.length - 1];
    side = -side;
    let spot = null;
    for (const dt of [0, 2, -2, 4, -4, 6, 8]) for (const sd of [side, -side]) {
      const t = sv - r.s0 + dt;
      if (!spot && t > 1 && t < r.L - 1 && solidAt(r, t, sd * (r.hw + 0.1))) spot = onRun(r, t, sd * (r.hw + 0.1));
    }
    if (!spot) continue;
    const p = spot;
    const y = field.height(p.x - p.n[0] * 0.8, p.z - p.n[1] * 0.8) + 3.4;
    k.bar(g, [p.x, y, p.z], [p.x + p.n[0] * 1.2, y, p.z + p.n[1] * 1.2], 0.06, M.darkSteel);
    k.box(g, [0.3, 0.42, 0.3], M.darkSteel, [p.x, y + 0.05, p.z], null, false);
    k.bracketLamp(g, p.x, y, p.z, [-p.n[0] * 0.75, -p.n[1] * 0.75], CANYON_LAMP);
  }
  // The hollow's way into the cleft: one lamp on its wall at the cleft's mouth.
  {
    const x = 35.6, z = 79.1;
    const y = field.height(35.6, 77.5) + 3.2;
    k.bar(g, [x, y, z], [x, y, z + 1.2], 0.06, M.darkSteel);
    k.bracketLamp(g, x, y, z, [0, -0.75], CANYON_LAMP);
  }
  // The pothole: four masts with floodlamps, at its edge, aimed in.
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const x = POTHOLE.x + Math.cos(a) * (POTHOLE.r - 2.2), z = POTHOLE.z + Math.sin(a) * (POTHOLE.r - 2.2);
    const y0 = POTHOLE.floor;
    k.stanchion(g, x, z, y0 + 0.08, y0 + 9, { d: 0.32, b: 0.28, ry: -a });
    k.box(g, [0.9, 0.08, 0.9], M.darkSteel, [x, y0 + 0.04, z]);
    k.box(g, [0.06, 0.06, 1.4], M.darkSteel, [x - Math.cos(a) * 0.5, y0 + 8.8, z - Math.sin(a) * 0.5], [0, -a + Math.PI / 2, 0]);
    k.box(g, [0.55, 0.4, 0.35], M.darkSteel, [x - Math.cos(a) * 0.9, y0 + 8.6, z - Math.sin(a) * 0.9]);
    k.lamp(g, x - Math.cos(a) * 1.1, y0 + 8.5, z - Math.sin(a) * 1.1, { intensity: 16, distance: 26 });
    g.userData.colliders.push({ x, z, r: 0.5 });
  }
  return g;
}

/** The Coil's feed: from the magnetite pocket's mouth along the foot of the last runs, into the pothole, to its box. */
export function buildCoilCable(w) {
  const k = kitFor(w);
  const { field, M } = w;
  const g = new THREE.Group();
  g.name = 'coil-cable';
  g.userData.colliders = [];
  const way = [[-27.6, -33.0], [-27.6, -31.9], [10.4, -31.9], [10.4, -46], [6.0, -58.5]];
  const pts = [];
  for (let i = 0; i < way.length - 1; i++) {
    const [ax, az] = way[i], [bx, bz] = way[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2.5));
    for (let s = 0; s < n; s++) {
      const x = ax + (bx - ax) * s / n, z = az + (bz - az) * s / n;
      pts.push([x, field.height(x, z) + 0.07, z]);
    }
  }
  const [ex, ez] = way[way.length - 1];
  pts.push([ex, field.height(ex, ez) + 0.07, ez]);
  for (let i = 0; i < pts.length - 1; i++) k.strut(g, pts[i], pts[i + 1], 0.065, M.rubber, 8);
  // The junction box at the pothole's wall, on a concrete plinth.
  const y = POTHOLE.floor;
  k.box(g, [1.6, 0.2, 1.0], M.concrete, [ex - 1.4, y + 0.1, ez - 1.2]);
  k.box(g, [1.3, 1.6, 0.7], M.steel, [ex - 1.4, y + 1.0, ez - 1.2]);
  k.box(g, [1.1, 0.08, 0.5], M.darkSteel, [ex - 1.4, y + 1.84, ez - 1.2]);
  k.strut(g, [ex, y + 0.07, ez], [ex - 1.0, y + 0.4, ez - 1.0], 0.065, M.rubber, 8);
  g.userData.colliders.push({ x: ex - 1.4, z: ez - 1.2, r: 0.85 });
  return g;
}

/** Blocks fallen from the walls, against their feet, never on a landing or on the cable's side of the last runs. */
export function buildRockfall(w) {
  const { plan, field, M } = w;
  const g = new THREE.Group();
  g.name = 'rockfall';
  g.userData.colliders = [];
  const own = o => w.own(o);
  const spots = [[0, 0.62, 1], [1, 0.5, -1], [2, 0.45, 1], [2, 0.7, -1], [3, 0.55, -1], [4, 0.6, 1], [6, 0.42, 1], [7, 0.55, -1], [8, 0.35, 1], [8, 0.72, 1]];
  for (const [ri, f, side] of spots) {
    const r = plan.runs[ri];
    const t = r.L * f;
    if (plan.onLanding(r.s0 + t)) continue;
    const size = 0.7 + ((ri * 7 + f * 13) % 1) * 0.5;
    const p = onRun(r, t, side * (r.hw - size * 0.75 - 0.15));
    const geo = own(new THREE.DodecahedronGeometry(size, 0));
    geo.scale(1.25, 0.72, 1.0);
    const m = new THREE.Mesh(geo, M.rock);
    m.position.set(p.x, field.height(p.x, p.z) + size * 0.42, p.z);
    m.rotation.set(0.2 * side, ri * 1.3 + f * 5, 0.1);
    m.castShadow = m.receiveShadow = w.t4;
    g.add(m);
    g.userData.colliders.push({ x: p.x, z: p.z, r: size * 1.05 });
  }
  return g;
}

/** The Fifth's sorting in the pothole: the pulled drums piled on a tray, the left ones standing. */
export function buildYard(w) {
  const k = kitFor(w);
  const { M } = w;
  const g = new THREE.Group();
  g.name = 'pothole-yard';
  g.userData.colliders = [];
  const y = POTHOLE.floor;
  // East: a steel tray, the pulled drums lying on it two deep (they were dragged there by the magnet).
  const ex = POTHOLE.x + 11.5, ez = POTHOLE.z - 2;
  k.box(g, [3.2, 0.2, 6.2], M.darkSteel, [ex, y + 0.1, ez]);
  for (let i = 0; i < 9; i++) {
    const z = ez - 2.6 + (i % 5) * 1.3 + (i >= 5 ? 0.65 : 0);
    const top = i >= 5 ? 0.58 : 0;
    k.cyl(g, [0.29, 0.29, 0.88, 14], i % 3 ? M.drumRed : M.rusted, [ex - 0.6 + (i % 2) * 1.1, y + 0.49 + top, z], [0, 0, Math.PI / 2]);
  }
  g.userData.colliders.push({ minX: ex - 1.62, maxX: ex + 1.62, minZ: ez - 3.12, maxZ: ez + 3.12 });
  // West: the drums it left, standing in two rows.
  const wx = POTHOLE.x - 11.5, wz = POTHOLE.z + 1;
  for (let i = 0; i < 10; i++) {
    const x = wx + (i % 2) * 0.7, z = wz - 3 + Math.floor(i / 2) * 0.68;
    k.cyl(g, [0.29, 0.29, 0.88, 14], i % 4 === 1 ? M.drumGreen : M.drumBlue, [x, y + 0.44, z]);
    k.cyl(g, [0.3, 0.3, 0.03, 14], M.darkSteel, [x, y + 0.6, z], null, false);
  }
  g.userData.colliders.push({ minX: wx - 0.32, maxX: wx + 1.02, minZ: wz - 3.32, maxZ: wz - 3 + 4 * 0.68 + 0.32 });
  void ARENA;
  return g;
}

/* ------------------------------------------------------------------ the far country */

/** Beyond the walk: the ropeway (north), the butte (south), the conveyor (west). The escarpment is in the ground. */
export function buildFarCountry(w) {
  const k = kitFor(w);
  const { field, M } = w;
  const g = new THREE.Group();
  g.name = 'far-country';
  // North: the ropeway's pylons, A-frames running away north to a loading tower, two ropes between.
  const pylons = [];
  for (let i = 0; i < 7; i++) {
    const x = 34 + i * 6, z = 150 + i * 46;
    const y = field.height(x, z) - 0.5;
    const H = 18 + (i % 2) * 3;
    for (const s of [-1, 1]) k.strut(g, [x + s * 3.2, y, z], [x + s * 0.5, y + H, z], 0.32, M.rusted, 6);
    k.box(g, [5.0, 0.4, 0.5], M.rusted, [x, y + H, z]);
    k.strut(g, [x - 2.2, y + H * 0.45, z], [x + 2.2, y + H * 0.45, z], 0.18, M.rusted, 6);
    pylons.push([x, y + H, z]);
  }
  for (const s of [-1, 1]) for (let i = 0; i < pylons.length - 1; i++) {
    const a = pylons[i], b = pylons[i + 1];
    k.strut(g, [a[0] + s * 2.2, a[1], a[2]], [b[0] + s * 2.2, b[1], b[2]], 0.08, M.darkSteel, 4);
  }
  {
    const [x, , z] = pylons[pylons.length - 1];
    const tz = z + 50, y = field.height(x + 6, tz) - 1;
    k.box(g, [14, 30, 14], M.rusted, [x + 6, y + 15, tz]);
    k.box(g, [18, 3, 18], M.darkSteel, [x + 6, y + 31.5, tz]);
    k.box(g, [8, 10, 8], M.rusted, [x + 6, y + 38, tz]);
  }
  // South: the black butte of magnetite, alone, its sides broken into columns of the beds.
  {
    const x = -60, z = -430, y = field.height(x, z) - 6;
    const geo = w.own(new THREE.CylinderGeometry(52, 78, 92, 11, 4));
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const a = Math.atan2(p.getZ(i), p.getX(i));
      const r = 1 + 0.08 * Math.sin(a * 5 + p.getY(i) * 0.05) + 0.05 * Math.sin(a * 13);
      p.setXYZ(i, p.getX(i) * r, p.getY(i), p.getZ(i) * r);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, M.butte);
    m.position.set(x, y + 46, z);
    g.add(m);
  }
  // West: the ore conveyor, a gallery on trestles running off west, and its bin.
  {
    const pts = [];
    for (let i = 0; i < 9; i++) pts.push([-150 - i * 24, 40 + i * 5]);
    let prev = null;
    for (const [x, z] of pts) {
      const y = field.height(x, z) - 0.5;
      const top = y + 14;
      for (const s of [-1, 1]) k.strut(g, [x, y, z + s * 3], [x, top, z + s * 1.4], 0.22, M.rusted, 5);
      k.box(g, [0.5, 0.5, 3.6], M.rusted, [x, top, z]);
      if (prev) {
        const [px, ptop, pz] = prev;
        const len = Math.hypot(x - px, z - pz);
        const gal = k.box(g, [len, 2.2, 2.6], M.rusted, [(x + px) / 2, (top + ptop) / 2 + 1.3, (z + pz) / 2]);
        gal.rotation.set(0, -Math.atan2(z - pz, x - px), Math.atan2(top - ptop, len));
      }
      prev = [x, top, z];
    }
    const [bx, bz] = [-150 - 9 * 24, 40 + 9 * 5];
    const by = field.height(bx, bz) - 1;
    k.box(g, [16, 18, 16], M.rusted, [bx, by + 9, bz]);
    k.cyl(g, [8, 2, 8, 4], M.rusted, [bx, by - 0.2 + 22, bz], [0, Math.PI / 4, 0]);
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  g.userData.phys = 'ambient';
  return g;
}

export const PLANT_BUILDERS = [buildCanyonLamps, buildCoilCable, buildRockfall, buildYard, buildFarCountry];

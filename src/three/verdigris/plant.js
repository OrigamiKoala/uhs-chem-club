/**
 * verdigris/plant.js — What stands in the drowned fort besides its masonry and its hosts.
 *
 *   boardwalk lamps   a lamp post bolted to the outside of a deck's fascia every ten metres or so, its lamp hung over the
 *                     planks on a bracket; the stage and the pump stage lit round their edges
 *   passage lamps     a bracket lamp in the gate passage and on the wall of every cistern stair
 *   gate sluices      a sluice gate in each of the gate passage's two channels, with its rack, spindle and handwheel
 *   pump discharge    the Fifth's discharge main from the pump stage over the north breach, pouring into the moat (moves)
 *   reed beds         reeds on every mud bank of the swamp and the ward's shallows, none within a step of a deck (ambient)
 *   far country       a ruined outwork tower to the north, a drowned chapel with a green copper dome to the east, a drowned
 *                     avenue of dead trees and the pump line's trestles to the south, a broken aqueduct to the west,
 *                     dead trees standing in the water all round (ambient)
 *
 * NO SIGN STANDS IN THE FORT. Nothing here carries lettering. ONLY LAMPS ARE LIT: a lamp is a `lampMark` the world pools.
 * Every builder takes the world and returns a group (or null); `userData.colliders` and `userData.movers` are read.
 */

import * as THREE from 'three';
import { kitFor } from '../kettle/kit.js';
import { WATER, DECK, FORT, CURTAIN_T, CURTAIN_TOP, reediness, fortDistance, fbm } from './fort-plan.js';
import { dryRects, PLANK } from './terrain.js';

export { buildLandingPad } from '../ember/plant.js';

/** A seeded random stream. */
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** A boardwalk lamp: a post bolted to the fascia at (x, z), its foot `y0`, the deck at `y`, the lamp hung `arm` in over the planks. */
function boardLamp(k, g, M, x, z, y0, y, arm) {
  const top = y + 3.3;
  k.box(g, [0.16, top - y0, 0.16], M.timberDark, [x, (y0 + top) / 2, z]);
  k.box(g, [0.24, 0.08, 0.24], M.darkSteel, [x, top + 0.04, z], null, false);
  k.bracketLamp(g, x, top - 0.45, z, arm, { intensity: 7, distance: 13 });
}

/** Every boardwalk lit: posts along the closed sides of each run, ten metres apart; round the stage and the pump stage. */
export function buildBoardwalkLamps(w) {
  const k = kitFor(w), M = w.M, plan = w.plan;
  const g = new THREE.Group();
  g.name = 'boardwalk-lamps';
  const placed = [];
  const near = (x, z, d) => placed.some(p => Math.hypot(p[0] - x, p[1] - z) < d);
  for (const wl of plan.work.walls) {
    const v = plan.byId.get(wl.volume);
    if (v.kind !== 'deck') continue;
    const L = wl.to - wl.from;
    const broad = v.id === 'stage' || v.id === 'pump';
    if (L < 3) continue;
    // One side of a run only (its north or west side), both sides of the broad stages.
    if (!broad && (wl.side === 'maxX' || wl.side === 'maxZ') && Math.min(v.rect.maxX - v.rect.minX, v.rect.maxZ - v.rect.minZ) < 4) continue;
    const gap = broad ? 13 : 10;
    const n = Math.max(1, Math.round(L / gap));
    for (let i = 0; i < n; i++) {
      const s = wl.from + L * (i + 0.5) / n;
      const alongX = wl.side === 'minZ' || wl.side === 'maxZ';
      const out = -(wl.dirX + wl.dirZ);
      const x = alongX ? s : wl.plane + out * 0.2, z = alongX ? wl.plane + out * 0.2 : s;
      if (near(x, z, 6)) continue;
      const y = plan.work.floorOf(v, Math.min(Math.max(x, v.rect.minX), v.rect.maxX - 1e-6), Math.min(Math.max(z, v.rect.minZ), v.rect.maxZ - 1e-6));
      // A lamp would stand against a tower or a cistern head here: not on a wall face.
      if (plan.structureAt(x + (alongX ? 0 : out * 0.4), z + (alongX ? out * 0.4 : 0))) continue;
      boardLamp(k, g, M, x, z, y - PLANK - 0.45, y, alongX ? [0, -out * 0.75] : [-out * 0.75, 0]);
      placed.push([x, z]);
    }
  }
  return g;
}

/** A bracket lamp in the gate passage and on the wall of each cistern stair. */
export function buildPassageLamps(w) {
  const k = kitFor(w), plan = w.plan;
  const g = new THREE.Group();
  g.name = 'passage-lamps';
  // The gate passage: on its west wall, over the channel, two along it.
  for (const z of [28, 36]) k.bracketLamp(g, 9.05, 3.0, z, [0.9, 0], { intensity: 6, distance: 11 });
  for (const id of ['stair-3', 'stair-5', 'stair-8']) {
    const v = plan.byId.get(id), r = v.rect, f = v.floor;
    const alongX = f.axis === 'x';
    const mid = alongX ? (r.minX + r.maxX) / 2 : (r.minZ + r.maxZ) / 2;
    const x = alongX ? mid : r.minX + 0.05, z = alongX ? r.minZ + 0.05 : mid;
    const y = plan.work.floorOf(v, alongX ? mid : (r.minX + r.maxX) / 2, alongX ? (r.minZ + r.maxZ) / 2 : mid);
    k.bracketLamp(g, x, y + 2.45, z, alongX ? [0, 0.5] : [0.5, 0], { intensity: 6, distance: 11 });
  }
  return g;
}

/** The gate's two sluices, one in each channel of the passage, near its inner mouth. */
export function buildGateSluices(w) {
  const k = kitFor(w), M = w.M;
  const g = new THREE.Group();
  g.name = 'gate-sluices';
  const z = 26.2;
  for (const [x0, x1] of [[9.0, 10.4], [13.6, 15.0]]) {
    const cx = (x0 + x1) / 2;
    // Two grooved posts in the channel, a cross head, the gate plate raised clear of the water, a rack and a wheel.
    for (const x of [x0 + 0.12, x1 - 0.12]) k.box(g, [0.18, 4.6, 0.26], M.castIron, [x, -2.6 + 2.3, z]);
    k.box(g, [x1 - x0, 0.3, 0.34], M.castIron, [cx, 2.15, z]);
    k.box(g, [x1 - x0 - 0.36, 1.1, 0.08], M.patinaDark, [cx, WATER + 0.3, z]);
    k.box(g, [0.08, 1.4, 0.08], M.steel, [cx, 1.4, z]);
    k.cyl(g, [0.26, 0.26, 0.04, 20], M.darkSteel, [cx, 2.42, z], null, false);
  }
  return g;
}

/** The pump's discharge: a main from the pump stage over the north breach, its end pouring into the moat. */
export const DISCHARGE = { x: 24, z1: -72, y: 1.9 };
export function buildPumpDischarge(w) {
  const k = kitFor(w), M = w.M;
  const g = new THREE.Group();
  g.name = 'pump-discharge';
  const { x, z1, y } = DISCHARGE;
  // From the stage's north edge, on two timber trestles over the breach's stump, out over the moat.
  k.pipe(g, [[x, DECK + 0.6, -62.45], [x, y, -63.6], [x, y, z1]], 0.22, M.rusted);
  for (const z of [-62.5, -67.5]) {
    for (const dx of [-0.5, 0.5]) k.box(g, [0.16, y - 0.3 - (WATER - 1), 0.16], M.timberDark, [x + dx, (y - 0.3 + WATER - 1) / 2, z]);
    k.box(g, [1.3, 0.16, 0.3], M.timberDark, [x, y - 0.3, z]);
  }
  // The water leaving the pipe's mouth: a sheet that falls to the moat and slides down itself.
  const fallH = y - WATER;
  const sheetGeo = w.own(new THREE.PlaneGeometry(0.5, fallH, 1, 6));
  const sheet = new THREE.Mesh(sheetGeo, w.M.water);
  sheet.position.set(x, WATER + fallH / 2 - 0.1, z1 - 0.3);
  sheet.name = 'discharge-fall';
  sheet.userData.noMerge = true;
  sheet.userData.phys = 'ambient';
  g.add(sheet);
  const tex = w.M.water.map;
  g.userData.movers = [{ update(t) { sheet.scale.x = 1 + Math.sin(t * 3.1) * 0.04; if (tex) tex.offset.y = -t * 0.35; } }];
  g.userData.noMerge = true;
  return g;
}

/**
 * THE REED BEDS. A clump of reeds on every mud bank the land function grows them on (outside the moat and in the ward's
 * shallows), never within 1.4 m of a deck or on a structure. Each blade is one thin double-sided triangle; the clumps are
 * merged by 40 m square, and the whole is ambient (the walk never meets it).
 */
export function buildReedBeds(w) {
  const plan = w.plan, M = w.M;
  const r = rng(0x5eed);
  const SQ = 40;
  const squares = new Map();
  const blocked = (x, z) => {
    for (const v of plan.volumes) {
      const q = v.rect;
      if (x > q.minX - 1.4 && x < q.maxX + 1.4 && z > q.minZ - 1.4 && z < q.maxZ + 1.4) return true;
    }
    if (plan.structureAt(x, z)) return true;
    return Math.abs(fortDistance(x, z)) < 2.5;
  };
  for (let x = -150; x <= 170; x += 2.1) for (let z = -160; z <= 160; z += 2.1) {
    const jx = x + (r() - 0.5) * 1.6, jz = z + (r() - 0.5) * 1.6;
    const reed = reediness(jx, jz);
    if (reed < 0.45 || r() > reed * 1.1) continue;
    if (blocked(jx, jz)) continue;
    const base = Math.min(plan.land(jx, jz), WATER);
    const sk = `${Math.floor(jx / SQ)},${Math.floor(jz / SQ)}`;
    if (!squares.has(sk)) squares.set(sk, { green: [], dry: [] });
    const bucket = squares.get(sk);
    const n = 10 + Math.floor(r() * 10);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.9;
      const bx = jx + Math.cos(a) * d, bz = jz + Math.sin(a) * d;
      const h = 2.0 + r() * 1.3 + reed * 0.4, wd = 0.05 + r() * 0.03;
      const lean = (r() - 0.5) * 0.5, la = r() * Math.PI * 2;
      const tx = bx + Math.cos(la) * lean, tz = bz + Math.sin(la) * lean;
      const ca = Math.cos(a + 1.3) * wd, sa = Math.sin(a + 1.3) * wd;
      (r() < 0.3 ? bucket.dry : bucket.green).push(bx - ca, base, bz - sa, bx + ca, base, bz + sa, tx, base + h, tz);
    }
  }
  const g = new THREE.Group();
  g.name = 'reed-beds';
  for (const [sk, { green, dry }] of squares) {
    for (const [list, mat] of [[green, M.reed], [dry, M.reedDry]]) {
      if (!list.length) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(list, 3));
      geo.computeVertexNormals();
      const m = new THREE.Mesh(w.own(geo), mat);
      m.name = `reeds@${sk}`;
      m.castShadow = false;
      m.receiveShadow = w.t4;
      g.add(m);
    }
  }
  g.userData.phys = 'ambient';
  g.userData.noMerge = true;
  g.traverse(o => { if (o.isMesh) { o.userData.phys = 'ambient'; o.userData.noMerge = true; } });
  return g;
}

/**
 * THE FAR COUNTRY, beyond the walk and in the fog: a ruined outwork tower (north), a drowned chapel with a green copper
 * dome (east), an avenue of dead trees and the pump line's trestles (south), a broken aqueduct (west), and dead trees
 * standing in the water all round.
 */
export function buildFarCountry(w) {
  const k = kitFor(w), M = w.M, plan = w.plan;
  const g = new THREE.Group();
  g.name = 'far-country';
  const r = rng(0xfa7);
  const ground = (x, z) => Math.min(plan.land(x, z), WATER) - 0.4;

  // North: the ravelin's broken tower, its top stepped away where it fell, rubble round its foot.
  {
    const x = -14, z = -178, y0 = ground(x, z);
    k.slab(g, [13, 12 - y0, 13], M.stone, [x, (y0 + 12) / 2, z], { tile: 2.4 });
    k.slab(g, [13, 4, 6], M.stone, [x, 14, z - 3.5], { tile: 2.4 });
    k.slab(g, [6, 3, 7], M.stone, [x - 3.5, 13.5, z + 3], { tile: 2.4 });
    for (let i = 0; i < 6; i++) k.slab(g, [2 + r() * 2, 0.8 + r(), 2 + r() * 2], M.rubble, [x + (r() - 0.5) * 22, WATER - 0.2, z + 8 + r() * 6], { tile: 1.2 });
  }
  // East: the drowned chapel, its nave in the water and its drum carrying a copper dome gone green.
  {
    const x = 196, z = 18, y0 = ground(x, z);
    k.slab(g, [26, 7 - y0, 12], M.stone, [x + 10, (y0 + 7) / 2, z], { tile: 2.4 });
    k.slab(g, [27, 0.5, 13], M.coping, [x + 10, 7.25, z], { tile: 1.2 });
    const drumTop = 6.6;
    k.cyl(g, [6.5, 6.5, drumTop - y0, 20], M.stone, [x - 6, (y0 + drumTop) / 2, z]);
    k.cyl(g, [6.8, 6.8, 0.5, 20], M.coping, [x - 6, drumTop + 0.25, z]);
    const dome = new THREE.Mesh(w.own(new THREE.SphereGeometry(6.4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), M.patina);
    dome.position.set(x - 6, drumTop + 0.5, z);
    g.add(dome);
    k.cyl(g, [0.5, 0.7, 2.4, 10], M.patinaDark, [x - 6, drumTop + 0.5 + 6.4 + 1.1, z]);
  }
  // South: the drowned avenue (two rows of dead trees), and the pump line on trestles running off into the fog.
  const deadTree = (x, z, h, s = 1) => {
    const y0 = ground(x, z);
    k.cyl(g, [0.22 * s, 0.4 * s, h, 7], M.deadwood, [x, y0 + h / 2, z]);
    for (let i = 0; i < 3; i++) {
      const a = r() * Math.PI * 2, y = y0 + h * (0.55 + r() * 0.35), l = (1.6 + r() * 2.2) * s;
      k.strut(g, [x, y, z], [x + Math.cos(a) * l, y + l * 0.6, z + Math.sin(a) * l], 0.08 * s, M.deadwood, 5);
    }
  };
  for (let i = 0; i < 9; i++) for (const sx of [-1, 1]) deadTree(-40 + sx * 7, 140 + i * 13, 7 + r() * 4);
  for (let z = 112; z < 260; z += 12) {
    const x = 46 + (z - 112) * 0.35;
    const y0 = ground(x, z);
    k.strut(g, [x - 1.2, y0, z], [x - 0.2, 3.2, z], 0.12, M.timberDark, 5);
    k.strut(g, [x + 1.2, y0, z], [x + 0.2, 3.2, z], 0.12, M.timberDark, 5);
    k.box(g, [1.6, 0.2, 0.3], M.timberDark, [x, 3.25, z]);
  }
  k.pipe(g, [[46, 3.6, 112], [46 + 148 * 0.35, 3.6, 260]], 0.32, M.rusted);
  // West: the broken aqueduct, a row of masonry arches across the swamp with two spans fallen.
  for (let i = 0; i < 14; i++) {
    if (i === 5 || i === 6 || i === 10) continue;
    const z = -110 + i * 17, x = -168 - i * 1.5, y0 = ground(x, z);
    k.slab(g, [3, 9 - y0, 3.4], M.stone, [x, (y0 + 9) / 2, z], { tile: 2.4 });
    if (i < 13 && i !== 4 && i !== 9) k.slab(g, [3, 2.6, 17 - 3.4], M.stone, [x - 0.75, 10.3, z + 8.5], { tile: 2.4 });
  }
  // Dead trees standing in the water round the swamp, outside the fort and clear of the walk.
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2, d = 110 + r() * 150;
    const x = Math.cos(a) * d + 10, z = Math.sin(a) * d;
    if (fortDistance(x, z) < 30) continue;
    deadTree(x, z, 5 + r() * 6, 0.8 + r() * 0.5);
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; } });
  // The horizon's own: ambience, baked by the world after everything else.
  g.userData.phys = 'ambient';
  void FORT; void CURTAIN_T; void CURTAIN_TOP; void fbm; void dryRects;
  return g;
}

/** The plant, in the order the world builds it. */
export const PLANT_BUILDERS = [buildBoardwalkLamps, buildPassageLamps, buildGateSluices, buildPumpDischarge, buildReedBeds, buildFarCountry];

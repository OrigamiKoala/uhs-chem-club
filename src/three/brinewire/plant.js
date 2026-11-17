/**
 * brinewire/plant.js — What works on the barrage besides its rooms: the lamps on the ramp and in the gallery, the outfalls through
 * the ramp's wall, the deck's gantry crane and hatches, the switchyard at the foot, and the far country.
 *
 * Each builder in `PLANT_BUILDERS` takes the world and returns a Group in the WORLD frame (or null), with `userData.colliders`
 * in the world frame where a player could touch it (discs `{ x, z, r }`, boxes `{ minX, maxX, minZ, maxZ }`). What moves (the
 * water out of an outfall) is `noMerge` and handed back as a mover (`userData.movers`: `{ update(t) }`). The far country is
 * `phys: 'ambient'`: it is the horizon, not a place. The lamp post and the landing pad are Ember Reach's generic builders.
 *
 * ONLY LAMPS ARE LIT: a lamp is a `lampMark` (kettle/kit.js) the world pools; nothing here owns a light.
 * NO SIGN STANDS ON THE BARRAGE: nothing here carries lettering.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { part, between, rng } from '../ember/kit.js';
import { kitFor } from '../kettle/kit.js';
import {
  GALLERY, FOOT, DECK, WALL, RAMP, ADIT, GALLERY_RECT, APRON, BASIN, LAGOON, ROOMS, land
} from './barrage-plan.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

const box = (ctx, g, w, h, d, mat, x, y, z, cast = true) => g.add(part(ctx, new THREE.BoxGeometry(w, h, d), mat, x, y, z, { cast })) && g;
const cyl = (ctx, g, rt, rb, h, mat, x, y, z, seg = 14, cast = true) => g.add(part(ctx, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, { cast })) && g;

/** The ramp's floor at z (both flights and the landing). */
export function rampFloor(z) {
  if (z >= RAMP.landS) return GALLERY + (DECK - 0.6 - GALLERY) * Math.min(1, (z - RAMP.landS) / (RAMP.top - RAMP.landS));
  if (z >= RAMP.landN) return GALLERY;
  return FOOT + (GALLERY - FOOT) * Math.max(0, (z - RAMP.foot) / (RAMP.landN - RAMP.foot));
}

/* ================================================================== lamps */

/** The ramp's lamps on brackets off the wall's face, the adit's and the gallery's pendants from their roofs. */
function buildWallLamps(w) {
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'wall-lamps';
  // Down the ramp, every 12 m, on the face at 3 m over the floor.
  for (let z = RAMP.top - 6; z > RAMP.foot + 2; z -= 12) k.bracketLamp(g, WALL.east + 0.05, rampFloor(z) + 3.0, z, [0.55, 0], { intensity: 7, distance: 12 });
  // The adit, and the gallery every 8 m, hung from the roof.
  const roofG = GALLERY + 4.4, roofA = GALLERY + 3.6;
  k.pendant(g, (ADIT.minX + ADIT.maxX) / 2, GALLERY + 2.9, (ADIT.minZ + ADIT.maxZ) / 2, roofA - 0.02, { intensity: 7, distance: 11 });
  const gx = (GALLERY_RECT.minX + GALLERY_RECT.maxX) / 2;
  for (let z = GALLERY_RECT.minZ + 3; z < GALLERY_RECT.maxZ - 1; z += 8) k.pendant(g, gx, GALLERY + 3.3, z, roofG - 0.02, { intensity: 7, distance: 11 });
  g.userData.colliders = [];
  return g;
}

/* ================================================================== the outfalls */

/** A material that slides: water running out of a culvert. */
function fallMaterial(w) {
  if (w.M.fall) return w.M.fall;
  const m = w.M.water.clone();
  m.transparent = true;
  m.opacity = 0.62;
  m.depthWrite = false;
  m.map = w.M.water.map?.clone() || null;
  if (m.map) { m.map.needsUpdate = true; m.map.repeat.set(1, 3); w.own(m.map); }
  w.own(m);
  w.M.fall = m;
  return m;
}

/** Where the sluices and the turbines discharge, through the ramp's wall (z). */
export const OUTFALLS = [ROOMS[0], ROOMS[1]].map(r => (r.rect.minZ + r.rect.maxZ) / 2).concat([26, 44]);

/**
 * THE OUTFALLS. Each sluice under a gate house, and each turbine passage, runs through the wall and comes out under the ramp:
 * a culvert's mouth in the ramp's east wall at the tailwater, a concrete hood over it, the water sliding out of it onto the
 * basin. The water is the one thing that moves.
 */
function buildOutfalls(w) {
  const k = kitFor(w), M = w.M;
  const g = new THREE.Group();
  g.name = 'outfalls';
  g.userData.movers = [];
  const mat = fallMaterial(w);
  const face = RAMP.maxX + 0.9;
  for (const z of OUTFALLS) {
    const wide = z > 20 ? 3.2 : 2.4;
    k.box(g, [0.5, 0.4, wide + 0.8], M.concrete, [face + 0.25, BASIN.water + 1.75, z]);
    for (const s of [-1, 1]) k.box(g, [0.5, 1.6, 0.4], M.concrete, [face + 0.25, BASIN.water + 0.75, z + s * (wide / 2 + 0.2)]);
    const mouth = new THREE.Mesh(w.own(new THREE.PlaneGeometry(wide, 1.55)), M.void);
    mouth.rotation.y = Math.PI / 2;
    mouth.position.set(face + 0.02, BASIN.water + 0.78, z);
    mouth.userData.phys = 'ambient';
    g.add(mouth);
    // The water out of the mouth: a sheet sliding down to the basin.
    const sheet = new THREE.Mesh(w.own(new THREE.PlaneGeometry(wide - 0.1, 2.2, 1, 4)), mat);
    sheet.rotation.set(-Math.PI / 2 + 0.28, 0, 0);
    sheet.rotation.order = 'YXZ';
    sheet.rotation.y = -Math.PI / 2;
    sheet.position.set(face + 1.1, BASIN.water + 0.12, z);
    sheet.userData.phys = 'ambient';
    sheet.userData.noMerge = true;
    sheet.userData.noWeather = true;
    g.add(sheet);
  }
  g.userData.movers.push({ update: t => { if (mat.map) mat.map.offset.set(0, -t * 0.5); } });
  g.userData.colliders = [];
  return g;
}

/* ================================================================== the deck */

/**
 * THE DECK, seen from the road and never walked: a gantry crane on rails that lifts the turbines' hatch covers, the hatch covers
 * themselves in a row, a cable trench along the east edge, and a hoist motor house behind each gate house.
 */
function buildDeck(w) {
  const k = kitFor(w), M = w.M;
  const g = new THREE.Group();
  g.name = 'deck-plant';
  const y = DECK;
  // The rails, the full length.
  for (const x of [-20.6, 0.6]) k.box(g, [0.3, 0.16, WALL.south - WALL.north - 6], M.darkSteel, [x, y + 0.08, (WALL.north + WALL.south) / 2 - 2], null, false);
  // The hatch covers over the turbine pits (east of the gallery), every 9 m.
  for (let z = -60; z < 56; z += 9) {
    k.box(g, [5.2, 0.12, 5.6], M.steel, [-0.8 - 6.6, y + 0.06, z], null, false);
    for (const dx of [-2.2, 2.2]) k.box(g, [0.14, 0.18, 0.5], M.darkSteel, [-7.4 + dx, y + 0.21, z], null, false);
  }
  // The gantry crane: two A-legs on bogies, a box girder across, a crab on it.
  const gz = 14;
  for (const x of [-20.6, 0.6]) {
    k.box(g, [1.0, 0.7, 3.4], M.darkSteel, [x, y + 0.5, gz]);
    for (const s of [-1, 1]) k.bar(g, [x, y + 0.85, gz + s * 1.4], [x, y + 8.6, gz], 0.34, M.paintYellow);
  }
  k.box(g, [22.4, 1.1, 1.2], M.paintYellow, [-10, y + 9.1, gz]);
  k.box(g, [22.4, 0.12, 1.5], M.darkSteel, [-10, y + 9.7, gz]);
  k.box(g, [2.4, 1.3, 2.0], M.paintYellow, [-12, y + 10.3, gz]);
  k.strut(g, [-12, y + 9.1, gz], [-12, y + 4.0, gz], 0.02, M.darkSteel);
  k.box(g, [0.5, 0.4, 0.3], M.darkSteel, [-12, y + 3.8, gz]);
  // The cable trench along the east edge, its chequer-plate lids.
  k.box(g, [1.4, 0.06, WALL.south - WALL.north - 4], M.darkSteel, [2.2, y + 0.03, (WALL.north + WALL.south) / 2], null, false);
  // A hoist motor house on the deck behind each gate house, with the gate's hoist shaft running over the road's parapet to it.
  for (const r of ROOMS.slice(0, 2)) {
    const z = (r.rect.minZ + r.rect.maxZ) / 2;
    k.box(g, [3.6, 2.8, 4.4], M.concreteDark, [-19.8, y + 1.4, z]);
    k.box(g, [4.0, 0.18, 4.8], M.roofSheet, [-19.8, y + 2.89, z]);
    k.box(g, [0.2, 2.1, 1.1], M.darkSteel, [-17.92, y + 1.05, z + 0.8]);
  }
  g.userData.colliders = [];
  return g;
}

/* ================================================================== the switchyard */

/** A transformer: a finned tank on a concrete plinth under a conservator drum and three porcelain bushings. */
function transformer(w, g, x, z) {
  const k = kitFor(w), M = w.M;
  k.box(g, [3.0, 0.4, 2.6], M.concrete, [x, 0.2, z]);
  k.box(g, [2.2, 1.9, 1.6], M.steel, [x, 1.35, z]);
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) k.box(g, [0.06, 1.5, 0.5], M.darkSteel, [x - 0.9 + i * 0.3, 1.3, z + s * 1.0], null, false);
  k.cyl(g, [0.38, 0.38, 2.0, 16], M.steel, [x, 2.7, z - 0.3], [0, 0, Math.PI / 2]);
  for (const sx of [-0.7, 0, 0.7]) {
    k.cyl(g, [0.14, 0.18, 0.7, 10], M.paint2, [x + sx, 2.65, z + 0.5]);
    k.cyl(g, [0.07, 0.07, 0.25, 8], M.copper, [x + sx, 3.12, z + 0.5]);
  }
}

/** A lattice tower: four legs drawn in, braced in X on every face, arms at `arms` heights. Origin on its footings. */
export function latticeTower(ctx, g, x, y, z, { h = 22, base = 2.6, top = 0.7, arms = [17, 21], arm = 3.6, seed = 1, rotY = 0 } = {}) {
  const M = ctx.M;
  const t = new THREE.Group();
  t.position.set(x, y, z);
  t.rotation.y = rotY;
  const levels = 6;
  const at = (i) => { const f = i / levels; return [f * h, base + (top - base) * f]; };
  const legs = (y0, s) => [[-s, y0, -s], [s, y0, -s], [s, y0, s], [-s, y0, s]];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) t.add(part(ctx, new THREE.BoxGeometry(0.9, 0.6, 0.9), M.concrete, sx * base, 0.1, sz * base));
  for (let i = 0; i < levels; i++) {
    const [y0, s0] = at(i), [y1, s1] = at(i + 1);
    const a = legs(y0, s0), b = legs(y1, s1);
    for (let q = 0; q < 4; q++) {
      const n = (q + 1) % 4;
      t.add(between(ctx, a[q], b[q], 0.08, M.steel, 5));
      t.add(between(ctx, a[q], b[n], 0.035, M.darkSteel, 4));
      t.add(between(ctx, a[n], b[q], 0.035, M.darkSteel, 4));
    }
  }
  for (const ay of arms) {
    t.add(part(ctx, new THREE.BoxGeometry(arm * 2, 0.22, 0.22), M.steel, 0, ay, 0));
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) t.add(part(ctx, new THREE.CylinderGeometry(0.12, 0.12, 0.06, 8), M.paint2, s * (arm - 0.2), ay - 0.25 - i * 0.12, 0));
  }
  t.add(between(ctx, [0, h, 0], [0, h + 2, 0], 0.05, M.steel, 4));
  void seed;
  g.add(t);
  return t;
}

/** Conductors hung between pairs of points with a sag, as one tube geometry. `spans`: [[a, b, sag]]. */
function conductors(ctx, spans, r = 0.035) {
  const geos = [];
  for (const [a, b, sag] of spans) {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t));
    }
    geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, r, 4, false));
  }
  if (!geos.length) return null;
  const merged = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  const m = new THREE.Mesh(ctx.own(merged), ctx.M.darkSteel);
  m.userData.phys = 'ambient';
  return m;
}

/** The terminal tower at the foot, where the grid's line leaves east over the flats. */
export const TERMINAL = { x: 41, z: -87 };

/**
 * THE SWITCHYARD at the foot, north of the cage: two transformers on plinths behind the cage, a portal gantry over them, the
 * terminal tower at the apron's north-east corner and the line leaving it east over the flats.
 */
function buildSwitchyard(w) {
  const k = kitFor(w), M = w.M, ctx = w.ctx;
  const g = new THREE.Group();
  g.name = 'switchyard';
  const cols = [];
  for (const x of [8.4, 14.0]) { transformer(w, g, x, -87.2); cols.push({ x, z: -87.2, r: 1.9 }); }
  // The portal gantry over them: two lattice posts and a beam, insulators hanging from the beam.
  for (const x of [5.2, 17.2]) {
    for (const dz of [-0.4, 0.4]) for (const dx of [-0.4, 0.4]) k.box(g, [0.14, 7.0, 0.14], M.steel, [x + dx, 3.5, -90.6 + dz]);
    for (let y = 1; y < 7; y += 1.5) k.box(g, [0.9, 0.06, 0.06], M.darkSteel, [x, y, -90.6]);
    cols.push({ x, z: -90.6, r: 0.7 });
  }
  k.box(g, [12.8, 0.5, 0.5], M.steel, [11.2, 7.1, -90.6]);
  for (const x of [8.4, 11.2, 14.0]) {
    for (let i = 0; i < 4; i++) k.cyl(g, [0.12, 0.12, 0.06, 8], M.paint2, [x, 6.65 - i * 0.12, -90.6], null, false);
    k.strut(g, [x, 6.2, -90.6], [x, 3.2, -87.7], 0.03, M.copper);
  }
  const tower = latticeTower(ctx, g, TERMINAL.x, 0, TERMINAL.z, { h: 18, base: 2.2, top: 0.6, arms: [14, 17.4], arm: 3.2 });
  void tower;
  cols.push({ minX: TERMINAL.x - 2.9, maxX: TERMINAL.x + 2.9, minZ: TERMINAL.z - 2.9, maxZ: TERMINAL.z + 2.9 });
  // From the gantry to the terminal tower, and from the tower out over the flats.
  const spans = [];
  for (const [i, s] of [[0, -1], [1, 1]]) {
    void i;
    spans.push([[17.2, 6.9, -90.6 + s * 0.1], [TERMINAL.x - 3.0, 13.6, TERMINAL.z + s * 0.1], 0.6]);
  }
  for (const ay of [14, 17.4]) for (const s of [-1, 1]) spans.push([[TERMINAL.x + s * 0.2, ay - 0.75, TERMINAL.z + s * 3.0], [TERMINAL.x + 120, 23 + ay - 14, TERMINAL.z - 30 + s * 3.6], 3.4]);
  const c = conductors(ctx, spans);
  if (c) { c.name = 'switchyard-lines'; g.add(c); }
  g.userData.colliders = cols;
  return g;
}

/* ================================================================== the far country */

/** A marsh cell frame in the lagoon: a timber trestle strung with metal plates on bars, standing in the brine. */
function cellFrame(w, g, x, z, rotY, seed) {
  const M = w.M;
  const r = rng(0xce11 + seed * 17);
  const f = new THREE.Group();
  f.position.set(x, LAGOON.water - 0.4, z);
  f.rotation.y = rotY;
  const len = 10 + r() * 6;
  for (let i = 0; i <= 3; i++) {
    const lx = -len / 2 + len * i / 3;
    for (const s of [-1, 1]) f.add(part(w.ctx, new THREE.BoxGeometry(0.22, 3.4, 0.22), M.timber, lx, 0.9, s * 0.9));
    f.add(part(w.ctx, new THREE.BoxGeometry(0.2, 0.2, 2.2), M.timber, lx, 2.5, 0));
  }
  for (const s of [-1, 1]) f.add(part(w.ctx, new THREE.BoxGeometry(len, 0.16, 0.16), M.timberDark, 0, 2.6, s * 0.9));
  const n = Math.round(len / 0.9);
  for (let i = 0; i < n; i++) {
    const lx = -len / 2 + 0.45 + i * (len - 0.9) / Math.max(1, n - 1);
    f.add(part(w.ctx, new THREE.BoxGeometry(0.05, 1.5, 1.1), i % 2 ? M.copperClad : M.patina, lx, 1.55, 0));
  }
  g.add(f);
}

/** West, the lagoon: the cell frames, and a line of pylons crossing the brine with their conductors. */
function lagoonWorks(w, g) {
  const ctx = w.ctx;
  const frames = [[-80, -44, 0.2], [-95, -18, -0.1], [-78, 8, 0.15], [-110, 30, 0.05], [-90, 52, -0.2], [-130, -70, 0.3], [-150, 4, 0], [-125, 70, 0.1], [-170, -30, 0.2]];
  frames.forEach(([x, z, a], i) => cellFrame(w, g, x, z, a, i));
  const line = [[-120, -230], [-128, -140], [-136, -50], [-144, 40], [-152, 130], [-160, 220]];
  const tops = line.map(([x, z], i) => { latticeTower(ctx, g, x, land(x, z) + 0.2, z, { h: 22, arms: [18, 21.5], arm: 3.6, seed: i, rotY: Math.PI / 2 }); return [x, z]; });
  const spans = [];
  for (let i = 0; i < tops.length - 1; i++) {
    const [ax, az] = tops[i], [bx, bz] = tops[i + 1];
    for (const ay of [18, 21.5]) for (const s of [-1, 1]) spans.push([[ax + s * 3.4, land(ax, az) + 0.2 + ay - 0.75, az], [bx + s * 3.4, land(bx, bz) + 0.2 + ay - 0.75, bz], 3.0]);
  }
  const c = conductors(ctx, spans);
  if (c) g.add(c);
}

/** East: the grid's line from the terminal tower over the flats, tower by tower, to the town on the far shore. */
function eastLine(w, g) {
  const ctx = w.ctx;
  const pts = [];
  for (let i = 1; i <= 6; i++) pts.push([TERMINAL.x + 120 * i, TERMINAL.z - 30 * i]);
  for (const [x, z] of pts) latticeTower(ctx, g, x, Math.max(land(x, z), BASIN.water) + 0.2, z, { h: 26, base: 3.0, top: 0.8, arms: [21, 24.4], arm: 4.0, rotY: Math.atan2(120, -30) });
  const spans = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const ya = Math.max(land(ax, az), BASIN.water) + 0.2, yb = Math.max(land(bx, bz), BASIN.water) + 0.2;
    for (const ay of [21, 24.4]) for (const s of [-1, 1]) spans.push([[ax + s * 0.9, ya + ay - 0.75, az + s * 3.9], [bx + s * 0.9, yb + ay - 0.75, bz + s * 3.9], 3.8]);
  }
  const c = conductors(ctx, spans);
  if (c) g.add(c);
  // The town the grid feeds: low sheds and three chimneys on the far shore.
  const k = kitFor(w), M = w.M;
  const tx = 760, tz = -230, ty = land(tx, tz);
  for (let i = 0; i < 9; i++) {
    const x = tx + (i % 3) * 26 - 26 + (i * 7) % 11, z = tz + Math.floor(i / 3) * 30 - 30;
    const h = 6 + (i * 13) % 7;
    k.box(g, [18, h, 12], M.concreteDark, [x, land(x, z) + h / 2 - 0.5, z], null, false);
  }
  for (const [dx, dz, h] of [[-50, 10, 46], [-36, 30, 38], [40, -10, 52]]) k.cyl(g, [1.6, 2.4, h, 10], M.brick, [tx + dx, ty + h / 2, tz + dz], null, false);
}

/** North: the brine intake tower standing out of the lagoon off the north headland. */
function intakeTower(w, g) {
  const k = kitFor(w), M = w.M;
  const x = -96, z = -128, y0 = LAGOON.water - 6;
  k.cyl(g, [6, 6.6, 26, 24], M.concrete, [x, y0 + 13, z], null, false);
  k.cyl(g, [6.4, 6.4, 0.6, 24], M.coping, [x, y0 + 26.3, z], null, false);
  k.box(g, [4, 3.2, 4], M.concreteDark, [x, y0 + 28.2, z], null, false);
  // The footbridge from the headland on three piers.
  for (const t of [0.25, 0.5, 0.75]) {
    const px = x + 6 + t * 30, pz = z + t * 18;
    k.box(g, [1.4, 20, 1.4], M.concrete, [px, LAGOON.water + 0.5, pz], null, false);
  }
  const bridge = k.bar(g, [x + 6, y0 + 24, z], [x + 36, y0 + 24, z + 18], 1.2, M.concreteDark);
  void bridge;
}

/** South: the disused copper works on the south headland, a brick stack and sheds with their roofs gone. */
function copperWorks(w, g) {
  const k = kitFor(w), M = w.M;
  const x = -30, z = 168, y = land(x, z);
  k.cyl(g, [2.0, 3.0, 44, 12], M.brick, [x, y + 22, z], null, false);
  k.cyl(g, [2.2, 2.2, 1.2, 12], M.brickDark, [x, y + 44.4, z], null, false);
  for (const [dx, dz, sx, sz] of [[18, -6, 24, 12], [22, 14, 16, 10], [-18, 10, 20, 14]]) {
    const yy = land(x + dx, z + dz);
    k.box(g, [sx, 7, 0.6], M.brick, [x + dx, yy + 3.2, z + dz - sz / 2], null, false);
    k.box(g, [sx, 7, 0.6], M.brick, [x + dx, yy + 3.2, z + dz + sz / 2], null, false);
    k.box(g, [0.6, 7, sz], M.brick, [x + dx - sx / 2, yy + 3.2, z + dz], null, false);
    for (let i = 0; i < 4; i++) k.box(g, [0.3, 0.4, sz], M.rusted, [x + dx - sx / 2 + (i + 1) * sx / 5, yy + 6.8, z + dz], null, false);
  }
  // The green slag heaps below the works, run down the headland.
  for (const [dx, dz, s] of [[30, 40, 9], [12, 52, 7]]) {
    const yy = land(x + dx, z + dz);
    k.cone(g, [s, s * 0.55, 10], M.slag, [x + dx, yy + s * 0.25, z + dz]);
  }
}

function buildFarCountry(w) {
  const g = new THREE.Group();
  g.name = 'far-country';
  g.userData.phys = 'ambient';
  lagoonWorks(w, g);
  eastLine(w, g);
  intakeTower(w, g);
  copperWorks(w, g);
  g.userData.colliders = [];
  return g;
}

export const PLANT_BUILDERS = [buildWallLamps, buildOutfalls, buildDeck, buildSwitchyard, buildFarCountry];

void APRON; void WALL; void cyl; void box;

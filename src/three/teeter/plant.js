/**
 * teeter/plant.js — What works on the terraces besides the rooms: the beam pumps, the spring house and its lade, the
 * stair's lamps, the brine falling from pan to pan, the salt drying on the floor, and the far country.
 *
 * Each builder in `PLANT_BUILDERS` takes the world and returns a Group in the WORLD frame (or null), with
 * `userData.colliders` in the world frame where a player could touch it (discs `{ x, z, r }`, boxes `{ minX, maxX,
 * minZ, maxZ }`). What moves (a pump's beam and rod, a fall of brine) is `noMerge` and handed back as a mover
 * (`userData.movers`: `{ update(t) }`). The far country is `phys: 'ambient'`: it is the horizon, not a place.
 *
 * ONLY LAMPS ARE LIT: a lamp is a `lampMark` (kettle/kit.js) the world pools; nothing here owns a light.
 */

import * as THREE from 'three';
import { part, between, rockGeometry, rng } from '../ember/kit.js';
import { kitFor } from '../kettle/kit.js';
import {
  LEVEL, FACE, WALL_T, PAN, STAIR, RAMP_L, SHELF, FLOOR4, ARENA, ROOMS, PUMP_PIERS, shaftOf, land
} from './terrace-plan.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

// Through the shared kit, so a pump's pier and frame are built shapes laid in metres like everything else (the realism pass).
const cyl = (ctx, g, rt, rb, h, mat, x, y, z, seg = 18, cast = true) => { kitFor(ctx).cyl(g, [rt, rb, h, seg], mat, [x, y, z], null, cast); return g; };
const box = (ctx, g, w, h, d, mat, x, y, z, cast = true) => { kitFor(ctx).box(g, [w, h, d], mat, [x, y, z], null, cast); return g; };

/** The beam pump's reach: the pivot's height over its sole, the half-length of its beam, how far it tips, one stroke. */
export const PUMP = { pivotY: 3.4, half: 3.5, tip: 0.13, period: 7.0 };

/**
 * A beam pump. The origin is where it stands; a walking beam rocks on a pivot between two A-frames, a counterweight on
 * one end and a pump rod hung from the other. `pier` stands it on its own concrete pier with a standpipe under the rod
 * (a pump in a pan); without it, it stands on a pier already built and its rod (`rod` m long) goes down a shaft.
 */
export function buildBeamPump(ctx, { seed = 1, pier = true, rod: rodLen = 1.9 } = {}) {
  const { M } = ctx;
  const g = new THREE.Group();
  const { pivotY: PY, half: H } = PUMP;
  const y0 = pier ? 0.9 : 0;
  if (pier) {
    box(ctx, g, 3.6, 0.9, 2.4, M.concrete, 0, 0.45, 0);
    box(ctx, g, 1.3, 0.3, 1.3, M.concrete, H, 0.15, 0);
    cyl(ctx, g, 0.24, 0.28, 1.3, M.clad, H, 0.95, 0, 16);
    cyl(ctx, g, 0.32, 0.32, 0.12, M.darkSteel, H, 1.62, 0, 16);
  }
  box(ctx, g, 3.2, 0.12, 2.0, M.darkSteel, 0, y0 + 0.06, 0);
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) g.add(between(ctx, [sx * 1.3, y0 + 0.1, sz * 0.85], [0, y0 + PY - 1.1, sz * 0.5], 0.09, M.steel, 8));
    g.add(part(ctx, new THREE.BoxGeometry(0.5, 0.4, 0.2), M.darkSteel, 0, y0 + PY - 1.1, sz * 0.5, { cast: true }));
  }
  g.add(between(ctx, [-1.3, y0 + 1.0, 0.85], [-1.3, y0 + 1.0, -0.85], 0.05, M.darkSteel, 6));
  g.add(between(ctx, [1.3, y0 + 1.0, 0.85], [1.3, y0 + 1.0, -0.85], 0.05, M.darkSteel, 6));
  const PYa = y0 + PY - 0.9;

  const beam = new THREE.Group();
  beam.position.set(0, PYa, 0);
  beam.userData.noMerge = true;
  beam.add(part(ctx, new THREE.BoxGeometry(2 * H, 0.3, 0.46), M.rusted, 0, 0, 0, { cast: true }));
  const pin = part(ctx, new THREE.CylinderGeometry(0.16, 0.16, 1.3, 14), M.darkSteel, 0, 0, 0, { cast: true });
  pin.rotation.x = Math.PI / 2;
  beam.add(pin);
  beam.add(part(ctx, new THREE.BoxGeometry(1.0, 0.95, 0.7), M.darkSteel, -H + 0.1, -0.62, 0, { cast: true }));
  beam.add(part(ctx, new THREE.BoxGeometry(0.5, 0.9, 0.34), M.rusted, H - 0.12, -0.1, 0, { cast: true }));
  g.add(beam);
  const rod = new THREE.Group();
  rod.userData.noMerge = true;
  rod.add(part(ctx, new THREE.CylinderGeometry(0.045, 0.045, rodLen, 8), M.steel, 0, -rodLen / 2, 0));
  g.add(rod);
  const phase = seed * 1.7;
  const set = (a) => {
    beam.rotation.z = a;
    rod.position.set(H * Math.cos(a), PYa + H * Math.sin(a) - 0.5, 0);
  };
  set(0);
  g.userData.movers = [{ update: t => set(PUMP.tip * Math.sin((t / PUMP.period) * Math.PI * 2 + phase)) }];
  g.userData.pump = { set, PYa, rodLen };
  return g;
}

/** The pumps in the pans, and the one over room 6's shaft whose rod works the barrel in the room below. */
function buildPumps(w) {
  const g = new THREE.Group();
  g.name = 'beam-pumps';
  g.userData.movers = [];
  PUMP_PIERS.forEach((p, i) => {
    const pump = buildBeamPump(w.ctx, { seed: i + 1 });
    pump.position.set(p.x, LEVEL[p.terrace] + PAN.floor, p.z);
    pump.name = p.id;
    g.add(pump);
    g.userData.movers.push(...pump.userData.movers);
  });
  const r6 = ROOMS.find(r => r.shaft);
  const s = shaftOf(r6);
  const pierTop = LEVEL[r6.wall - 1] + 0.3;
  // The rod reaches from the beam's head down the shaft to a hand over the barrel's gland in the room (stations.js).
  const glandY = LEVEL[r6.wall] + PUMP_GLAND;
  const PYa = PUMP.pivotY - 0.9;
  const rodLen = pierTop + PYa - 0.5 - PUMP.half * Math.sin(PUMP.tip) - (glandY + 0.06);
  const pump = buildBeamPump(w.ctx, { seed: 5, pier: false, rod: rodLen });
  pump.position.set(s.cx - PUMP.half, pierTop, s.cz);
  pump.name = 'pump-shaft';
  g.add(pump);
  g.userData.movers.push(...pump.userData.movers);
  g.userData.colliders = [];
  g.userData.phys = undefined;
  return g;
}
/** How high over room 6's floor the pump barrel's gland stands (stations.js builds the barrel to it). */
export const PUMP_GLAND = 2.3;

/** The spring house at the shelf's north-east corner, and the stone lade that carries its brine west to the top pans. */
function buildSpring(w) {
  const k = kitFor(w), M = w.M;
  const g = new THREE.Group();
  g.name = 'spring-house';
  const y = LEVEL[0];
  const x0 = 86.5, x1 = 94.5, z0 = -33, z1 = -26.2;
  k.slab(g, [x1 - x0, 3.4, z1 - z0], M.masonry, [(x0 + x1) / 2, y + 1.7, (z0 + z1) / 2], { tile: 2.4 });
  // A pitched stone-slab roof, ridge east and west.
  for (const sgn of [-1, 1]) {
    const r = k.box(g, [x1 - x0 + 0.6, 0.16, 4.0], M.roofSheet, [(x0 + x1) / 2, y + 3.95, (z0 + z1) / 2 + sgn * 1.75]);
    r.rotation.x = -sgn * 0.3;
  }
  // The outflow through the west end, and the lade: a stone trough on the ground with brine in it, to the pans.
  const lz = -25.2;
  k.box(g, [1.2, 0.8, 1.0], M.masonry, [x0 - 0.6, y + 0.4, lz]);
  const lx0 = SHELF.minX - 0.7, lx1 = x0 - 1.2;
  k.slab(g, [lx1 - lx0, 0.45, 0.9], M.masonry, [(lx0 + lx1) / 2, y + 0.225, lz], { tile: 1.6 });
  const water = new THREE.Mesh(w.own(new THREE.PlaneGeometry(lx1 - lx0, 0.6)), M.brine);
  water.rotation.x = -Math.PI / 2;
  water.position.set((lx0 + lx1) / 2, y + 0.4, lz);
  water.userData.phys = 'ambient';
  g.add(water);
  g.userData.colliders = [];
  return g;
}

/** The stair's lamps: a bracket lamp on each ramp's side walls, one high on the north wall and one on the south. */
function buildStairLamps(w) {
  const k = kitFor(w);
  const g = new THREE.Group();
  g.name = 'stair-lamps';
  for (const kk of [1, 2, 3, 4]) {
    const F = FACE[kk];
    const at = x => LEVEL[kk] + (LEVEL[kk - 1] - LEVEL[kk]) * Math.min(1, Math.max(0, (x - F) / RAMP_L));
    for (const [x, z, arm] of [[F + 6, STAIR.z0, 0.5], [F + 17, STAIR.z1, -0.5]]) k.bracketLamp(g, x, at(x) + 3.0, z, [0, arm], { intensity: 7, distance: 12 });
  }
  g.userData.colliders = [];
  return g;
}

/** A material that slides: the brine running down a wall. */
function fallMaterial(w) {
  if (w.M.fall) return w.M.fall;
  const m = w.M.brine.clone();
  m.transparent = true;
  m.opacity = 0.5;
  m.depthWrite = false;
  m.map = w.M.brine.map?.clone() || null;
  if (m.map) { m.map.needsUpdate = true; m.map.repeat.set(1, 3); w.own(m.map); }
  w.own(m);
  w.M.fall = m;
  return m;
}

/**
 * BRINE RUNS PAN TO PAN. Where a run of pans ends, the brine spills over the wall to the next terrace: a stone lip on the
 * coping, the sheet running down the face, a trough at its foot. Only away from the walk.
 */
function buildFalls(w) {
  const k = kitFor(w), M = w.M;
  const g = new THREE.Group();
  g.name = 'brine-falls';
  g.userData.movers = [];
  const mat = fallMaterial(w);
  const spots = [[1, 62], [2, -52], [3, 70], [4, -58], [1, -96], [3, -86], [2, 96]];
  for (const [wall, z] of spots) {
    const F = FACE[wall], top = LEVEL[wall - 1] + 0.1, foot = LEVEL[wall];
    k.box(g, [0.5, 0.18, 0.9], M.masonry, [F - 0.2, top + 0.02, z]);
    const sheet = new THREE.Mesh(w.own(new THREE.PlaneGeometry(0.7, top - foot - 0.3)), mat);
    sheet.rotation.y = -Math.PI / 2;
    sheet.position.set(F - 0.47, (top + foot) / 2 + 0.1, z);
    sheet.userData.phys = 'ambient';
    sheet.userData.noMerge = true;
    g.add(sheet);
    k.box(g, [1.0, 0.5, 1.6], M.masonry, [F - 0.55, foot + 0.25, z]);
  }
  g.userData.movers.push({ update: t => { if (mat.map) mat.map.offset.set(0, t * 0.6); } });
  g.userData.colliders = [];
  return g;
}

/** Salt drying on the floor: three raked heaps along the parapet, a barrow by them. */
function buildDryingFloor(w) {
  const g = new THREE.Group();
  g.name = 'drying-floor';
  const cols = [];
  [[-61.3, 6, 0.62], [-61.0, 17, 0.72], [-61.5, 27.5, 0.58]].forEach(([x, z, s], i) => {
    const heap = part(w.ctx, rockGeometry(3.2 * s, 140 + i, { squash: 0.55, rough: 0.1 }), w.M.saltWhite, x, LEVEL[4], z, { cast: true });
    heap.rotation.y = i * 1.3;
    g.add(heap);
    cols.push({ x, z, r: 2.8 * s });
  });
  const k = kitFor(w);
  const bx = -58.6, bz = 11.5;
  k.box(g, [0.8, 0.45, 1.3], w.M.timber, [bx, LEVEL[4] + 0.55, bz]);
  k.cyl(g, [0.22, 0.22, 0.08, 14], w.M.darkSteel, [bx, LEVEL[4] + 0.22, bz + 0.75], [0, 0, Math.PI / 2]);
  for (const s of [-1, 1]) k.box(g, [0.05, 0.05, 1.2], w.M.timber, [bx + s * 0.3, LEVEL[4] + 0.6, bz - 1.0]);
  cols.push({ x: bx, z: bz, r: 1.0 });
  g.userData.colliders = cols;
  void ARENA; void FLOOR4;
  return g;
}

/* ================================================================== the far country */

/** The ground height at a far point (the plan's land). */
const ground = (x, z) => land(x, z);

/** North: a graduation tower on the spur, a long timber frame stacked with brushwood that the brine trickles down. */
function graduationTower(w, g) {
  const k = kitFor(w), M = w.M;
  const x0 = -30, x1 = 40, z = -196;
  const y = Math.max(ground(x0, z), ground(x1, z), ground((x0 + x1) / 2, z)) - 0.5;
  const len = x1 - x0;
  k.box(g, [len, 11, 3.2], M.brushwood, [(x0 + x1) / 2, y + 6.5, z], null, false);
  for (let i = 0; i <= Math.round(len / 4); i++) {
    const x = x0 + i * 4;
    for (const s of [-1, 1]) k.box(g, [0.3, 13, 0.3], M.timber, [x, y + 6.5, z + s * 1.9], null, false);
  }
  k.box(g, [len + 1, 0.5, 4.4], M.timber, [(x0 + x1) / 2, y + 13.2, z], null, false);
  k.box(g, [len + 1, 0.6, 5.0], M.roofSheet, [(x0 + x1) / 2, y + 13.8, z], null, false);
}

/** South: the brine main, a pipe on A-trestles coming down the south spur to the valley. */
function brineMain(w, g) {
  const M = w.M;
  const pts = [];
  for (let t = 0; t <= 1.0001; t += 1 / 26) pts.push([110 - t * 380, 150 + Math.sin(t * 3) * 14]);
  let prev = null;
  for (const [x, z] of pts) {
    const y = ground(x, z) + 3.2;
    g.add(between(w.ctx, [x - 1.4, y - 3.4, z], [x, y, z], 0.1, M.timber, 6));
    g.add(between(w.ctx, [x + 1.4, y - 3.4, z], [x, y, z], 0.1, M.timber, 6));
    if (prev) g.add(between(w.ctx, prev, [x, y + 0.3, z], 0.32, M.steel, 10));
    prev = [x, y + 0.3, z];
  }
}

/** West: the river down the valley floor. */
function river(w, g) {
  const pos = [], idx = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const z = -900 + 1800 * i / N;
    const cx = -230 - Math.sin(z * 0.012) * 40;
    const y = LEVEL[LEVEL.length - 1] - 1.05;
    pos.push(cx - 6, y, z, cx + 6, y, z);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(w.own(geo), w.M.river));
}

/** East: the cistern house at the head of the gully above the spring, where the brine is caught. */
function cisternHouse(w, g) {
  const k = kitFor(w), M = w.M;
  const x = 205, z = 6, y = ground(x, z) - 0.4;
  k.box(g, [12, 5, 8], M.masonry, [x, y + 2.5, z], null, false);
  k.box(g, [13, 0.4, 9], M.roofSheet, [x, y + 5.2, z], null, false);
  k.box(g, [6, 3, 6], M.masonry, [x - 9, y + 1.5, z + 2], null, false);
}

function buildFarCountry(w) {
  const g = new THREE.Group();
  g.name = 'far-country';
  g.userData.phys = 'ambient';
  graduationTower(w, g);
  brineMain(w, g);
  river(w, g);
  cisternHouse(w, g);
  g.userData.colliders = [];
  return g;
}

export const PLANT_BUILDERS = [buildPumps, buildSpring, buildStairLamps, buildFalls, buildDryingFloor, buildFarCountry];

void WALL_T; void rng; void cyl;

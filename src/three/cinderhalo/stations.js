/**
 * cinderhalo/stations.js — The six hosts: a shielded concrete cell in each small crater, each with its Learn bench built in.
 *
 * THE HOST FRAME. Origin on the ground under the middle of the plate; +z is the front (toward the player and the door), +x to the
 * player's right. The cell is `CELL` in `site-plan.js`: 12.4 by 12.4 m inside, its back wall 5.4 m behind the plate and its front wall
 * 7 m in front, so there is air on both sides of the lean-in camera and behind the player. Nothing stands in the bay envelope
 * (`bayBoxes()`): machinery is behind the plate (z < -2.2), to the sides (|x| > 2.9) and above 4.6 m.
 *
 * THE WAY IN IS A DOG-LEG. The inner door is in the front wall to one side (`mirror`); in front of it a roofed vestibule runs along the
 * wall and opens at its far end, so a player turns twice to reach the plate and no straight line runs from the crater floor to it. That
 * is how a shielded room is entered: radiation travels in straight lines, and the turns are thick concrete.
 *
 * NO TWO CELLS ARE ALIKE:
 *   1 drum store        a barrel vault of precast ribs; ore drums racked two high behind the plate and down one wall; a counter cabinet
 *   2 shield cell       a slab roof on beams; a wall of lead bricks behind the plate with a viewing window and two manipulator arms;
 *                       shielding slabs of three thicknesses racked by the wall
 *   3 target hall       a stepped roof, high at the back; a beam pipe through the back wall on its magnets to a target block
 *   4 separation hall   the tallest, trussed; a row of tall centrifuge columns down each side with their header pipes overhead
 *   5 cask vault        a low wide vault on deep beams; ranks of vented storage casks behind the plate, air slots in the back wall
 *   6 pool hall         a monitor roof; a raised pool tank behind the plate, fuel racks under its water, a crane bridge over it
 *
 * ONLY LAMPS ARE LIT. A cell's lamps are `lampMark`s pooled by the world; nothing here owns a light. Every cell and vestibule is inside one
 * of the world's cover boxes (`coverBoxes()`), so the sun and sky do not light it.
 *
 * @returns {{ group, bench, benchLocal, colliders }} colliders in the host frame: `{ lx, lz, hw, hd }` boxes or `{ lx, lz, r }` discs
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { HOST_PLAN, CELL } from './site-plan.js';

const LAMP = 0xe8a440;
const UP = new THREE.Vector3(0, 1, 0);
const { inner: IN, wall: WT, door: DOOR, vest: V } = CELL;

/* ----------------------------------------------------------------- the bench */

function buildChBench(ctx, { plate, skin }) {
  const M = ctx.M;
  return buildBayBench(ctx, {
    skin, plate,
    mats: { top: M.benchTop, dark: M.darkSteel, tray: M.catwalk },
    tagStyle: { fg: '#1a1e24', bg: '#cfd4dc' },
    dormant(dormant, { height }) {
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(ctx.own(geo), mat); m.position.set(x, y, z); dormant.add(m); return m; };
      // The cased instrument: a counter's case and its tube on a lead stand.
      const housing = add(new THREE.BoxGeometry(1.1, 0.48, 0.42), M.case, -0.4, height + 0.29, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      add(new THREE.BoxGeometry(0.9, 0.04, 0.3), M.caseDark, -0.4, height + 0.55, -0.2);
      add(new THREE.BoxGeometry(0.34, 0.22, 0.34), M.lead, 0.62, height + 0.16, 0.05);
      const tube = add(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 12), M.steel, 0.62, height + 0.34, 0.05);
      tube.rotation.z = Math.PI / 2;
    }
  });
}

/* --------------------------------------------------------------- the parts kit */

function kitFor(w) {
  const own = (...o) => w.own(...o);
  const { M, t4 } = w;
  const place = (m, [x, y, z], rot, shadow) => {
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    if (shadow) m.castShadow = m.receiveShadow = t4;
    return m;
  };
  const add = (g, geo, mat, p, rot = null, shadow = true) => { const m = place(new THREE.Mesh(own(geo), mat), p, rot, shadow); g.add(m); return m; };
  const box = (g, s, mat, p, rot = null, shadow = true) => add(g, new THREE.BoxGeometry(...s), mat, p, rot, shadow);
  const cyl = (g, [rt, rb, h, seg = 14], mat, p, rot = null, shadow = true) => add(g, new THREE.CylinderGeometry(rt, rb, h, seg), mat, p, rot, shadow);
  const strut = (g, a, b, r, mat, seg = 8) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), seg)), mat);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
    m.castShadow = m.receiveShadow = t4;
    g.add(m);
    return m;
  };
  /** A box spanning x0..x1, y0..y1, z0..z1 in the host frame. */
  const span = (g, x0, x1, y0, y1, z0, z1, mat, shadow = true) => box(g, [Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0)], mat, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], null, shadow);
  const lamp = (g, x, y, z, { intensity = 9, distance = 14, drop = 0.7 } = {}) => {
    const mark = new THREE.Object3D();
    mark.position.set(x, y, z);
    mark.userData.lamp = { color: LAMP, intensity, distance, decay: 1.7 };
    g.add(mark);
    w.lamps.push(mark);
    box(g, [0.34, 0.12, 0.2], M.lantern, [x, y + 0.1, z], null, false);
    strut(g, [x, y + 0.16, z], [x, y + drop, z], 0.02, M.darkSteel, 5);
  };
  return { add, box, cyl, strut, span, lamp, own };
}

/** A box collider over the host-frame rectangle x0..x1, z0..z1. */
const coll = (x0, x1, z0, z1) => ({ lx: (x0 + x1) / 2, lz: (z0 + z1) / 2, hw: Math.abs(x1 - x0) / 2, hd: Math.abs(z1 - z0) / 2 });

/**
 * The cell's shell: back, sides, the front wall with its inner door, and the vestibule with its opening at its far end, all of poured
 * concrete `WT` thick. `roofY` is the height of the walls (the roof is each cell's own). Pushes the walls' colliders. Returns the door's x.
 */
function shell(h, plan, { roofY = CELL.roof, wallMat = null, vestMat = null } = {}) {
  const { k, M, g } = h;
  const m = plan.mirror;
  const wm = wallMat || M.concrete; const vm = vestMat || M.concreteDark;
  const X0 = IN.x0 - WT; const X1 = IN.x1 + WT; const Z0 = IN.z0 - WT; const Z1 = IN.z1 + WT;
  k.span(g, X0, X1, 0, roofY, Z0, IN.z0, wm);
  k.span(g, X0, IN.x0, 0, roofY, IN.z0, IN.z1, wm);
  k.span(g, IN.x1, X1, 0, roofY, IN.z0, IN.z1, wm);
  // The front wall, in two pieces round the inner door, and a lintel over it.
  const d0 = Math.min(DOOR.x0 * m, DOOR.x1 * m); const d1 = Math.max(DOOR.x0 * m, DOOR.x1 * m);
  k.span(g, X0, d0, 0, roofY, IN.z1, Z1, wm);
  k.span(g, d1, X1, 0, roofY, IN.z1, Z1, wm);
  k.span(g, d0, d1, 2.9, roofY, IN.z1, Z1, wm);
  h.colliders.push(coll(X0, X1, Z0, IN.z0 + 0.05), coll(X0, IN.x0 + 0.05, IN.z0, IN.z1), coll(IN.x1 - 0.05, X1, IN.z0, IN.z1), coll(X0, d0, IN.z1 - 0.05, Z1), coll(d1, X1, IN.z1 - 0.05, Z1));
  // The vestibule: its far wall along the front, its closed end by the room, its roof; open at its far end.
  const nearOut = m * (V.x0 - WT); const far = m * V.x1;
  const lo = Math.min(nearOut, far); const hi = Math.max(nearOut, far);
  const n0 = Math.min(m * V.x0, nearOut); const n1 = Math.max(m * V.x0, nearOut);
  const VR = CELL.vestRoof;
  k.span(g, lo, hi, 0, VR, V.z1, V.z1 + WT, vm);
  k.span(g, n0, n1, 0, VR, Z1, V.z1, vm);
  k.span(g, lo, hi, VR, VR + 0.45, Z1, V.z1 + WT, vm);
  h.colliders.push(coll(lo, hi, V.z1 - 0.05, V.z1 + WT), coll(n0, n1, Z1, V.z1));
  // The vestibule's lamp, and a lamp each side of the plate.
  k.lamp(g, ((V.x0 + V.x1) / 2) * m, VR - 0.75, (V.z0 + V.z1) / 2, { intensity: 6, distance: 9, drop: 0.7 });
  return (d0 + d1) / 2;
}

function start(w, siteId, name) {
  const k = kitFor(w);
  const plan = HOST_PLAN[siteId];
  const g = new THREE.Group();
  g.name = name;
  const bench = buildChBench(w.ctx, { plate: plan.plate, skin: plan.skin });
  g.add(bench.group);
  return { k, M: w.M, g, bench, plan, colliders: [{ lx: 0, lz: 0, hw: 2.4, hd: 0.65 }] };
}
const finish = h => ({ group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders });

/** A slab roof over the whole cell at `y`, `t` thick. */
const slab = (h, y, t, mat) => h.k.span(h.g, IN.x0 - WT, IN.x1 + WT, y, y + t, IN.z0 - WT, IN.z1 + WT, mat);

/* ------------------------------------------------------------------------ 1: the drum store */

export function buildDrumStore(w) {
  const h = start(w, 'site-1', 'drum-store');
  const { k, M, g } = h;
  shell(h, h.plan, { roofY: 4.6 });
  // The barrel vault: a shallow arc of concrete on precast ribs, along the room front to back, with its two gable ends filled.
  const R = 12; const half = Math.asin(7.2 / R); const rise = R - Math.sqrt(R * R - 7.2 * 7.2); const cy = 4.6 - (R - rise);
  k.add(g, new THREE.CylinderGeometry(R, R, IN.z1 - IN.z0 + 2 * WT, 28, 1, true, Math.PI - half, 2 * half), M.concreteShell, [0, cy, (IN.z0 + IN.z1) / 2], [Math.PI / 2, 0, 0]);
  for (let z = IN.z0 + 0.6; z < IN.z1; z += 2.4) {
    k.add(g, new THREE.CylinderGeometry(R - 0.12, R - 0.12, 0.34, 28, 1, true, Math.PI - Math.asin(7.0 / R), 2 * Math.asin(7.0 / R)), M.concreteDark, [0, cy, z], [Math.PI / 2, 0, 0], false);
  }
  const gable = new THREE.Shape();
  gable.moveTo(-7.2, 0); gable.lineTo(7.2, 0);
  gable.absarc(0, cy - 4.6, R, Math.PI / 2 - half, Math.PI / 2 + half, false);
  gable.lineTo(-7.2, 0);
  for (const z of [IN.z0 - WT, IN.z1]) k.add(g, new THREE.ExtrudeGeometry(gable, { depth: WT, bevelEnabled: false, curveSegments: 16 }), M.concrete, [0, 4.6, z]);
  // Drums racked two high behind the plate, and down the left wall.
  const rack = (x0, x1, z, along) => {
    for (const y of [0.05, 1.25]) k.span(g, along ? x0 : x0, along ? x1 : x1, y, y + 0.08, z - 0.55, z + 0.55, M.darkSteel);
    for (let x = x0 + 0.4; x < x1 - 0.2; x += 0.8) for (const y of [0.13, 1.33]) k.cyl(g, [0.32, 0.32, 1.05, 14], (Math.round(x * 3) % 3) ? M.drum : M.drumYellow, [x, y + 0.53, z]);
  };
  rack(-5.6, 5.6, -4.6, true);
  k.span(g, -6.1, -5.95, 0, 2.6, -4.1, -5.1, M.darkSteel);
  k.span(g, 5.95, 6.1, 0, 2.6, -4.1, -5.1, M.darkSteel);
  h.colliders.push(coll(-6.2, 6.2, -5.4, -4.0));
  for (let z = -2.6; z < 5.4; z += 0.8) for (const y of [0.13, 1.33]) k.cyl(g, [0.32, 0.32, 1.05, 14], (Math.round(z * 3) % 2) ? M.drum : M.drumYellow, [-5.55, y + 0.53, z]);
  k.span(g, -6.2, -4.9, 1.25, 1.33, -3.0, 5.4, M.darkSteel);
  h.colliders.push(coll(-6.2, -4.85, -3.0, 5.4));
  // The counter cabinet on the right wall.
  k.span(g, 5.3, 6.15, 0, 1.9, -0.6, 0.9, M.case);
  k.span(g, 5.25, 5.32, 1.0, 1.6, -0.4, 0.6, M.glassDark);
  h.colliders.push(coll(5.2, 6.2, -0.7, 1.0));
  k.lamp(g, -3.2, 3.9, -1.2);
  k.lamp(g, 3.2, 3.9, 2.4);
  return finish(h);
}

/* ------------------------------------------------------------------------ 2: the shield cell */

export function buildShieldCell(w) {
  const h = start(w, 'site-2', 'shield-cell');
  const { k, M, g } = h;
  shell(h, h.plan, { roofY: 5.2 });
  slab(h, 5.2, 0.6, M.concreteDark);
  for (let z = IN.z0 + 1.2; z < IN.z1; z += 2.6) k.span(g, IN.x0, IN.x1, 4.75, 5.2, z - 0.2, z + 0.2, M.darkSteel);
  // The lead wall behind the plate, its window, and the two arms that reach through it.
  k.span(g, -6.2, -1.4, 0, 4.2, -5.4, -4.3, M.lead);
  k.span(g, 1.4, 6.2, 0, 4.2, -5.4, -4.3, M.lead);
  k.span(g, -1.4, 1.4, 0, 1.2, -5.4, -4.3, M.lead);
  k.span(g, -1.4, 1.4, 2.6, 4.2, -5.4, -4.3, M.lead);
  k.span(g, -1.4, 1.4, 1.2, 2.6, -5.0, -4.6, M.glassDark);
  for (let y = 0.3; y < 4.2; y += 0.35) k.span(g, -6.2, 6.2, y, y + 0.02, -4.29, -4.27, M.darkSteel, false);
  for (const s of [-1, 1]) {
    k.strut(g, [s * 1.9, 3.6, -4.4], [s * 1.9, 3.6, -3.2], 0.09, M.steel);
    k.strut(g, [s * 1.9, 3.6, -3.2], [s * 1.6, 2.2, -2.6], 0.06, M.steel);
    k.box(g, [0.14, 0.22, 0.14], M.darkSteel, [s * 1.6, 2.1, -2.55]);
  }
  h.colliders.push(coll(-6.2, 6.2, -5.4, -4.25));
  // Shielding slabs of three thicknesses, racked on edge by the right wall.
  [[0.04, M.paper], [0.12, M.alu], [0.3, M.lead]].forEach(([t, mat], i) => {
    for (let n = 0; n < 3; n++) k.box(g, [t, 1.5, 1.1], mat, [5.3 + n * (t + 0.05), 0.85, 2.6 + i * 1.4]);
  });
  k.span(g, 5.1, 6.2, 0, 0.1, 1.9, 6.6, M.darkSteel);
  h.colliders.push(coll(5.0, 6.2, 1.9, 6.6), coll(-2.3, 2.3, -4.25, -2.35));
  k.lamp(g, -3.4, 4.0, -1.5);
  k.lamp(g, 3.6, 4.0, 3.0);
  return finish(h);
}

/* ------------------------------------------------------------------------ 3: the beam target hall */

export function buildTargetHall(w) {
  const h = start(w, 'site-3', 'target-hall');
  const { k, M, g } = h;
  shell(h, h.plan, { roofY: 5.0 });
  // A stepped roof: high over the back third, where the magnets stand, low over the front.
  k.span(g, IN.x0 - WT, IN.x1 + WT, 6.6, 7.2, IN.z0 - WT, -1.6, M.concreteDark);
  k.span(g, IN.x0 - WT, IN.x1 + WT, 5.0, 5.6, -1.6, IN.z1 + WT, M.concreteDark);
  k.span(g, IN.x0 - WT, IN.x0, 5.0, 6.6, IN.z0 - WT, -1.6, M.concrete);
  k.span(g, IN.x1, IN.x1 + WT, 5.0, 6.6, IN.z0 - WT, -1.6, M.concrete);
  k.span(g, IN.x0 - WT, IN.x1 + WT, 5.0, 6.6, IN.z0 - WT, IN.z0, M.concrete);
  k.span(g, IN.x0, IN.x1, 5.6, 6.6, -1.9, -1.6, M.concrete);
  // The beam pipe: in through the back wall, along the magnets, to the target block behind the plate.
  k.strut(g, [-1.4, 1.5, -7.4], [-1.4, 1.5, -3.0], 0.12, M.steel, 12);
  k.strut(g, [-1.4, 1.5, -3.0], [-0.2, 1.5, -2.6], 0.1, M.steel, 12);
  for (const z of [-5.0, -3.8]) {
    k.box(g, [0.9, 0.8, 0.7], M.magnet, [-1.4, 1.5, z]);
    k.box(g, [0.5, 1.1, 0.5], M.darkSteel, [-1.4, 0.55, z]);
  }
  k.box(g, [1.6, 1.6, 1.2], M.lead, [0.6, 0.8, -3.0]);
  k.cyl(g, [0.25, 0.25, 0.5, 12], M.brass, [0.6, 1.85, -3.0]);
  h.colliders.push(coll(-2.0, 1.5, -5.4, -2.3));
  // Cable trays and a power cabinet along the walls.
  k.span(g, 5.4, 6.2, 0, 2.2, -4.8, -1.8, M.case);
  k.span(g, -6.2, -5.5, 3.2, 3.4, -5.4, 6.8, M.darkSteel);
  h.colliders.push(coll(5.3, 6.2, -4.9, -1.7));
  k.lamp(g, -3.6, 4.0, 0.4);
  k.lamp(g, 3.4, 5.6, -3.4);
  return finish(h);
}

/* ------------------------------------------------------------------------ 4: the separation hall */

export function buildSeparationHall(w) {
  const h = start(w, 'site-4', 'separation-hall');
  const { k, M, g } = h;
  shell(h, h.plan, { roofY: 7.0 });
  slab(h, 7.0, 0.5, M.concreteDark);
  // Trusses under the roof, across the hall.
  for (let z = IN.z0 + 1.4; z < IN.z1; z += 3.0) {
    k.span(g, IN.x0, IN.x1, 6.75, 6.95, z - 0.1, z + 0.1, M.darkSteel);
    k.span(g, IN.x0, IN.x1, 5.9, 6.05, z - 0.08, z + 0.08, M.darkSteel);
    for (let x = IN.x0 + 0.6; x < IN.x1; x += 1.6) k.strut(g, [x, 6.0, z], [x + 0.8, 6.8, z], 0.04, M.darkSteel, 5);
  }
  // Two rows of centrifuge columns down the sides, a row behind the plate, header pipes over them.
  const column = (x, z) => {
    k.cyl(g, [0.32, 0.32, 4.4, 14], M.steel, [x, 2.3, z]);
    k.cyl(g, [0.38, 0.38, 0.2, 14], M.darkSteel, [x, 0.1, z]);
    k.cyl(g, [0.36, 0.36, 0.25, 14], M.darkSteel, [x, 4.55, z]);
    k.strut(g, [x, 4.65, z], [x, 5.3, z], 0.05, M.copper, 6);
  };
  for (const s of [-1, 1]) {
    for (const z of [-3.8, -2.5, -1.2, 2.4, 3.7, 5.0]) column(s * 5.6, z);
    k.strut(g, [s * 5.6, 5.3, -4.4], [s * 5.6, 5.3, 6.0], 0.09, M.copper, 10);
    h.colliders.push(coll(s > 0 ? 5.1 : -6.2, s > 0 ? 6.2 : -5.1, -4.3, -0.7), coll(s > 0 ? 5.1 : -6.2, s > 0 ? 6.2 : -5.1, 1.9, 5.5));
  }
  for (let x = -3.9; x <= 3.9; x += 1.3) column(x, -4.6);
  k.strut(g, [-4.4, 5.3, -4.6], [4.4, 5.3, -4.6], 0.09, M.copper, 10);
  h.colliders.push(coll(-4.4, 4.4, -5.4, -4.0));
  k.lamp(g, -3.6, 4.6, 0.6, { drop: 2.4 });
  k.lamp(g, 3.6, 4.6, 3.6, { drop: 2.4 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 5: the cask vault */

export function buildCaskVault(w) {
  const h = start(w, 'site-5', 'cask-vault');
  const { k, M, g } = h;
  shell(h, h.plan, { roofY: 5.6 });
  slab(h, 5.6, 0.7, M.concreteDark);
  for (let x = IN.x0 + 1.0; x < IN.x1; x += 2.4) k.span(g, x - 0.25, x + 0.25, 4.65, 5.6, IN.z0, IN.z1, M.concrete);
  // Air slots in the back wall.
  for (let x = -5; x <= 5; x += 2.5) k.span(g, x - 0.5, x + 0.5, 3.6, 4.0, IN.z0 - 0.02, IN.z0 + 0.01, M.glassDark, false);
  // Ranks of vented storage casks behind the plate and along the left wall.
  const cask = (x, z, r = 0.62) => {
    k.cyl(g, [r, r, 3.2, 16], M.cask, [x, 1.6, z]);
    k.cyl(g, [r + 0.06, r + 0.06, 0.18, 16], M.darkSteel, [x, 3.25, z]);
    for (const a of [0, Math.PI / 2, Math.PI, 1.5 * Math.PI]) k.box(g, [0.16, 0.12, 0.05], M.glassDark, [x + Math.cos(a) * (r + 0.02), 0.5, z + Math.sin(a) * (r + 0.02)], [0, -a, 0], false);
  };
  for (let x = -3.2; x <= 3.2; x += 1.6) cask(x, -4.5);
  for (let x = -2.4; x <= 2.4; x += 1.6) cask(x, -3.0, 0.55);
  h.colliders.push(coll(-3.9, 3.9, -5.4, -2.4));
  for (let z = -1.0; z <= 5.2; z += 1.55) cask(-5.3, z, 0.6);
  h.colliders.push(coll(-6.2, -4.6, -1.7, 5.9));
  k.lamp(g, -3.6, 4.0, 0.2);
  k.lamp(g, 3.6, 4.0, 2.6);
  return finish(h);
}

/* ------------------------------------------------------------------------ 6: the pool hall */

export function buildPoolHall(w) {
  const h = start(w, 'site-6', 'pool-hall');
  const { k, M, g } = h;
  shell(h, h.plan, { roofY: 5.4 });
  // A monitor roof: a raised strip along the middle with clerestory sides, the rest a slab.
  k.span(g, IN.x0 - WT, -2.2, 5.4, 6.0, IN.z0 - WT, IN.z1 + WT, M.concreteDark);
  k.span(g, 2.2, IN.x1 + WT, 5.4, 6.0, IN.z0 - WT, IN.z1 + WT, M.concreteDark);
  k.span(g, -2.4, 2.4, 7.0, 7.5, IN.z0 - WT, IN.z1 + WT, M.concreteDark);
  for (const s of [-1, 1]) for (let z = IN.z0 - WT; z < IN.z1 + WT - 0.3; z += 1.6) k.span(g, s * 2.2 - 0.1, s * 2.2 + 0.1, 6.0, 7.0, z, z + 0.3, M.darkSteel);
  k.span(g, -2.4, 2.4, 6.0, 7.0, IN.z0 - WT, IN.z0, M.concrete);
  k.span(g, -2.4, 2.4, 6.0, 7.0, IN.z1, IN.z1 + WT, M.concrete);
  // The pool tank behind the plate: its rim, its water, the fuel racks under the water.
  k.span(g, -5.6, 5.6, 0, 1.2, -5.4, -5.1, M.concrete);
  k.span(g, -5.6, 5.6, 0, 1.2, -2.7, -2.4, M.concrete);
  k.span(g, -5.6, -5.3, 0, 1.2, -5.1, -2.7, M.concrete);
  k.span(g, 5.3, 5.6, 0, 1.2, -5.1, -2.7, M.concrete);
  k.span(g, -5.3, 5.3, 1.0, 1.04, -5.1, -2.7, M.water, false);
  for (let x = -4.6; x <= 4.6; x += 0.7) k.span(g, x - 0.25, x + 0.25, 0.05, 0.8, -4.6, -3.2, M.darkSteel, false);
  h.colliders.push(coll(-5.7, 5.7, -5.4, -2.3));
  // The crane bridge over the pool on rails along the side walls.
  for (const s of [-1, 1]) k.span(g, s * 5.9 - 0.15, s * 5.9 + 0.15, 4.55, 4.75, IN.z0, IN.z1, M.darkSteel);
  k.span(g, -5.9, 5.9, 4.4, 4.75, -4.2, -3.7, M.rusted);
  k.box(g, [0.8, 0.5, 0.8], M.darkSteel, [1.4, 4.15, -3.95]);
  k.strut(g, [1.4, 3.9, -3.95], [1.4, 2.6, -3.95], 0.03, M.darkSteel, 5);
  k.lamp(g, -3.2, 4.2, 0.4);
  k.lamp(g, 3.2, 4.2, 3.2);
  return finish(h);
}

export const HOST_BUILDERS = {
  'site-1': buildDrumStore,
  'site-2': buildShieldCell,
  'site-3': buildTargetHall,
  'site-4': buildSeparationHall,
  'site-5': buildCaskVault,
  'site-6': buildPoolHall
};

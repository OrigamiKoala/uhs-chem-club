/**
 * teeter/stations.js — The eight hosts: the pieces of the pan works a Learn bench is built into.
 *
 * A bench on Teeter is not a bench in a room. It is a working point of the pans: the sluice gate between two
 * basins, the weigh house with its platform scale, a tilting trough and its gauge, the sorting house's wall of
 * pigeonholes, a clerk's ledger desk, the pump station where a beam pump rocks on its A-frame, the settling pond
 * and the plotting hut. Each builder returns the machine AND its bench as ONE object, so the overlap rule (which
 * exempts a body's own parts) lets the bench be bolted to the thing it belongs to, and the bay contract
 * (`bench-bay.js`) keeps the volume the plate, the instrument, the screens and the camera need empty.
 *
 * THE HOST FRAME. Origin on the ground under the middle of the plate; +z is the front (toward the causeway the
 * player walks in from), +x to the player's right. The world places the group at `site.pos`, turned to face its
 * approach. Machinery stands to the sides (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m behind it;
 * the work lamp hangs over the plate on a boom from a mast at the side. `verify:bench` measures all of it and
 * `verify:teeter` measures that no host stands outside the extent `host-plan.js` declares for it.
 *
 * ONLY LAMPS ARE LIT. A host's work lamp is a `lampMark` the world pools; nothing here owns a PointLight.
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is the bench's instrument, cased up: the
 * one clean, bright thing among whitewash and weathered steel (`M.case`). Pressing [E] hides the case and opens
 * the table.
 *
 * @returns {{ group, bench, benchLocal, colliders }} `colliders` are host-local discs `{ lx, lz, r }` and boxes
 *   `{ lx, lz, hw, hd }`; the world turns them to its own frame.
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { placard } from '../materials/pbr-kit.js';
import { HOST_PLAN } from './host-plan.js';
import { buildBeamPump } from './plant.js';

const LAMP = 0xd99423;
const UP = new THREE.Vector3(0, 1, 0);

/* ----------------------------------------------------------------- the bench */

/** The bench: the shared bay bench in the host's skin, dressed in the pans' weathered steel, its cased instrument for `kind`. */
export function buildTtBench(ctx, { kind = 'pan', plate = 'TTR-01', skin = 'deck' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x, y, z, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    return m;
  };
  return buildBayBench(ctx, {
    skin, plate,
    // The works' own dress: galvanised plate, dark-painted rims, pale timber trays.
    mats: { top: M.benchTop, dark: M.darkSteel, tray: M.timber },
    tagStyle: { fg: '#1e1a14', bg: '#dcd8c8' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (...a) => dormant.add(mesh(...a));
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), M.brass, -0.62, height + 0.42, 0.05, [Math.PI / 2, 0, 0]);
      add(new THREE.CircleGeometry(0.13, 22), M.glassDark, -0.62, height + 0.42, 0.072);
      if (kind === 'pan') {                   // a shallow pan of brine with two scoops beside it
        add(new THREE.BoxGeometry(0.9, 0.05, 0.5), M.timber, 0.6, y0 + 0.025, 0.1);
        add(new THREE.BoxGeometry(0.8, 0.02, 0.4), M.brine, 0.6, y0 + 0.055, 0.1);
        for (const x of [0.25, 0.4]) add(new THREE.CylinderGeometry(0.06, 0.05, 0.05, 16), x < 0.3 ? M.paint2 : M.paintBlue, x, y0 + 0.025, 0.4);
      } else if (kind === 'scale') {          // a small platform scale with a dial
        add(new THREE.BoxGeometry(0.6, 0.06, 0.4), M.caseDark, 0.6, y0 + 0.03, 0.1);
        add(new THREE.BoxGeometry(0.5, 0.03, 0.32), M.brass, 0.6, y0 + 0.075, 0.1);
        add(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 18), M.paint2, 0.9, y0 + 0.18, -0.05, [Math.PI / 2, 0, 0]);
      } else if (kind === 'gauge') {          // a tilting tray on a pivot
        add(new THREE.BoxGeometry(0.16, 0.12, 0.16), M.caseDark, 0.6, y0 + 0.06, 0.1);
        add(new THREE.BoxGeometry(0.9, 0.04, 0.3), M.brass, 0.6, y0 + 0.14, 0.1, [0, 0, 0.12]);
      } else if (kind === 'cards') {          // a rack of cards
        add(new THREE.BoxGeometry(0.7, 0.04, 0.2), M.caseDark, 0.6, y0 + 0.02, 0.12);
        for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(0.12, 0.18, 0.015), k % 2 ? M.paint2 : M.paintYellow, 0.4 + k * 0.14, y0 + 0.13, 0.12, [-0.2, 0, 0]);
      } else if (kind === 'ledger') {         // a ledger open on a stand
        add(new THREE.BoxGeometry(0.6, 0.05, 0.4), M.caseDark, 0.6, y0 + 0.1, 0.1, [-0.2, 0, 0]);
        add(new THREE.BoxGeometry(0.28, 0.02, 0.36), M.paint2, 0.45, y0 + 0.14, 0.1, [-0.2, 0, 0]);
        add(new THREE.BoxGeometry(0.28, 0.02, 0.36), M.paint2, 0.75, y0 + 0.14, 0.1, [-0.2, 0, 0]);
      } else if (kind === 'beam') {           // a balance beam on a post
        add(new THREE.CylinderGeometry(0.02, 0.03, 0.34, 8), M.caseDark, 0.6, y0 + 0.17, 0.1);
        add(new THREE.BoxGeometry(0.8, 0.025, 0.04), M.brass, 0.6, y0 + 0.35, 0.1, [0, 0, 0.1]);
      } else if (kind === 'dish') {           // an evaporating dish with a crust
        add(new THREE.CylinderGeometry(0.2, 0.15, 0.08, 20), M.paint2, 0.6, y0 + 0.04, 0.1);
        add(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), M.saltWhite, 0.6, y0 + 0.085, 0.1);
      } else {                                // a plot board on a stand
        add(new THREE.BoxGeometry(0.7, 0.4, 0.03), M.caseDark, 0.6, y0 + 0.24, 0.04, [-0.3, 0, 0]);
        for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.16, 0.03, 0.02), M.paint2, 0.4 + k * 0.2, y0 + 0.2 + k * 0.05, 0.07, [-0.3, 0, 0]);
      }
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
  /** Every verb adds a mesh to the group `g` and hands the mesh back. */
  const box = (g, [sx, sy, sz], mat, p, rot = null, shadow = true) => g.add(place(new THREE.Mesh(own(new THREE.BoxGeometry(sx, sy, sz)), mat), p, rot, shadow)) && g.children[g.children.length - 1];
  const cyl = (g, [rt, rb, h, seg = 16], mat, p, rot = null, shadow = true) => g.add(place(new THREE.Mesh(own(new THREE.CylinderGeometry(rt, rb, h, seg)), mat), p, rot, shadow)) && g.children[g.children.length - 1];
  const tube = (g, [r, h], mat, p) => g.add(place(new THREE.Mesh(own(new THREE.CylinderGeometry(r, r, h, 18, 1, true)), mat), p, null, false)) && g.children[g.children.length - 1];
  const cone = (g, [r, h, seg = 14], mat, p) => g.add(place(new THREE.Mesh(own(new THREE.ConeGeometry(r, h, seg)), mat), p, null, true)) && g.children[g.children.length - 1];
  const strut = (g, a, b, r, mat, seg = 8) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), seg)), mat);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
    g.add(m);
    return m;
  };
  const pipe = (g, pts, r, mat) => {
    for (let i = 0; i < pts.length - 1; i++) strut(g, pts[i], pts[i + 1], r, mat, 10);
    for (let i = 1; i < pts.length - 1; i++) g.add(place(new THREE.Mesh(own(new THREE.SphereGeometry(r * 1.02, 12, 8)), mat), pts[i]));
  };
  const footing = (g, x, z, s = 0.34) => box(g, [s + 0.16, 0.05, s + 0.16], M.darkSteel, [x, 0.025, z], null, false);
  /** A square post on a footing, from the ground to `top`. */
  const post = (g, x, z, top, s = 0.16, mat = M.darkSteel) => { footing(g, x, z, Math.max(0.28, s + 0.14)); box(g, [s, top - 0.05, s], mat, [x, 0.05 + (top - 0.05) / 2, z]); };
  const tag = (g, text, size, p, ry = 0) => {
    const t = placard(text, { fg: '#1e1a14', bg: '#dcd8c8', ...size });
    t.position.set(...p);
    t.rotation.y = ry;
    g.add(t);
    own(t.geometry, t.material, t.material.map);
  };
  const lamp = (g, x, y, z, { intensity = 8, distance = 12 } = {}) => {
    const mark = new THREE.Object3D();
    mark.position.set(x, y, z);
    mark.userData.lamp = { color: LAMP, intensity, distance, decay: 1.7 };
    g.add(mark);
    w.lamps.push(mark);
    box(g, [0.4, 0.1, 0.2], M.lantern, [x, y + 0.12, z], null, false);
  };
  /** A lamp on a mast with a boom that reaches it out over the plate. */
  const lampMast = (g, x, z, { h = 3.7, arm = [0, 0] } = {}) => {
    footing(g, x, z, 0.3);
    cyl(g, [0.045, 0.06, h, 10], M.darkSteel, [x, h / 2, z]);
    strut(g, [x, h - 0.05, z], [x + arm[0], h - 0.05, z + arm[1]], 0.035, M.darkSteel);
    lamp(g, x + arm[0], h - 0.24, z + arm[1]);
  };
  /** A poured slab under the whole host: ground, so the machines stand on it rather than in it. */
  const slab = (g, [x0, x1, z0, z1]) => {
    const m = box(g, [x1 - x0, 0.1, z1 - z0], M.slab, [(x0 + x1) / 2, 0, (z0 + z1) / 2], null, false);
    m.userData.phys = 'ground';
    return m;
  };
  return { box, cyl, tube, cone, strut, pipe, footing, post, tag, lamp, lampMast, slab, own };
}

function start(w, siteId, name) {
  const k = kitFor(w);
  const plan = HOST_PLAN[siteId];
  const g = new THREE.Group();
  g.name = name;
  const bench = buildTtBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
  g.add(bench.group);
  k.slab(g, [plan.extent[0], plan.extent[1], plan.extent[2], plan.extent[3] - 0.2]);
  return { k, M: w.M, g, bench, colliders: [{ lx: 0, lz: 0, hw: 2.4, hd: 0.65 }] };
}
const finish = (h, mast = [3.2, -1.8, [-2.9, 1.8]]) => {
  h.k.lampMast(h.g, mast[0], mast[1], { arm: mast[2] });
  h.colliders.push({ lx: mast[0], lz: mast[1], r: 0.2 });
  return { group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders };
};


/** A ring (a handwheel) laid flat, owned by the world. */
function wheel(w, g, r, mat, p) {
  const m = new THREE.Mesh(w.own(new THREE.TorusGeometry(r, r * 0.1, 8, 22)), mat);
  m.position.set(...p);
  m.rotation.x = Math.PI / 2;
  g.add(m);
  return m;
}

/** A walled basin of brine: four low walls and a sheet of liquid, the liquid kept clear of the walls. */
function basin(k, g, M, [x0, x1, z0, z1], { wall = M.concrete, liquid = M.brine, h = 1.0, t = 0.3, level = 0.72 } = {}) {
  k.box(g, [x1 - x0, h, t], wall, [(x0 + x1) / 2, h / 2, z0]);
  k.box(g, [x1 - x0, h, t], wall, [(x0 + x1) / 2, h / 2, z1]);
  for (const x of [x0, x1]) k.box(g, [t, h, z1 - z0 - t], wall, [x, h / 2, (z0 + z1) / 2]);
  k.box(g, [x1 - x0 - t * 2, 0.05, z1 - z0 - t * 2], liquid, [(x0 + x1) / 2, level, (z0 + z1) / 2], null, false);
}

/* ------------------------------------------------------------------------ 1 */

/** The sluice gate: two brine basins either side of a dividing wall with a gate in it, and a handwheel on the stem. */
export function buildSluiceGate(w) {
  const h = start(w, 'site-1', 'sluice-gate');
  const { k, M, g } = h;
  const Z0 = -9.0, Z1 = -4.0, ZM = (Z0 + Z1) / 2;
  basin(k, g, M, [-6.8, -0.2, Z0, Z1]);
  basin(k, g, M, [0.2, 6.8, Z0, Z1]);
  k.box(g, [0.4, 1.0, 1.6], M.concrete, [0, 0.5, -8.2]);                          // the dividing wall, in two lengths
  k.box(g, [0.4, 1.0, 1.6], M.concrete, [0, 0.5, -4.8]);
  k.box(g, [0.4, 0.3, 2.0], M.darkSteel, [0, 0.15, -6.5]);                        // the sill the water runs over
  k.box(g, [0.3, 0.05, 2.0], M.brine, [0, 0.6, -6.5], null, false);
  for (const z of [-7.7, -5.3]) k.box(g, [0.24, 3.0, 0.24], M.darkSteel, [0, 1.5, z]);   // the gate frame
  k.box(g, [0.3, 0.26, 2.8], M.steel, [0, 3.05, -6.5]);
  k.box(g, [0.08, 1.5, 1.8], M.rusted, [0, 1.35, -6.5]);                          // the gate, raised a hand's breadth off the sill
  k.cyl(g, [0.035, 0.035, 1.4, 8], M.brass, [0, 2.6, -6.5]);                      // its stem and handwheel
  k.box(g, [0.3, 0.3, 0.3], M.caseDark, [0, 3.35, -6.5]);
  wheel(w, g, 0.34, M.rusted, [0, 3.62, -6.5]);
  k.tag(g, 'SLUICE', { w: 0.5, h: 0.15 }, [-3.5, 0.8, Z1 + 0.17]);
  k.tag(g, 'SLUICE', { w: 0.5, h: 0.15 }, [3.5, 0.8, Z1 + 0.17]);
  h.colliders.push({ lx: 0, lz: ZM, hw: 7.0, hd: 2.7 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 2 */

/** The weigh house: an open-fronted shed with a platform scale on its pit, a steelyard on the back wall, sacks on pallets. */
export function buildWeighHouse(w) {
  const h = start(w, 'site-2', 'weigh-house');
  const { k, M, g } = h;
  k.box(g, [13.2, 3.3, 0.25], M.plaster, [0, 1.65, -7.45]);
  for (const sx of [-1, 1]) {
    k.box(g, [0.25, 3.3, 5.0], M.plaster, [sx * 6.5, 1.65, -4.9]);
    k.post(g, sx * 6.5, -2.3, 3.4, 0.2);
  }
  k.box(g, [13.6, 0.2, 5.8], M.roofSheet, [0, 3.45, -4.6], [0.06, 0, 0]);
  k.box(g, [3.8, 0.3, 2.8], M.darkSteel, [-1.6, 0.2, -5.0]);                      // the scale's pit frame
  k.box(g, [3.4, 0.18, 2.4], M.steel, [-1.6, 0.5, -5.0]);                         // and its platform
  for (const [dx, dz] of [[-1.5, -1.0], [1.5, -1.0], [-1.5, 1.0], [1.5, 1.0]]) k.box(g, [0.16, 0.16, 0.16], M.brass, [-1.6 + dx, 0.66, -5.0 + dz]);
  k.box(g, [0.2, 2.2, 0.2], M.darkSteel, [3.2, 1.15, -6.9]);                      // the steelyard's post
  k.box(g, [4.2, 0.12, 0.12], M.steel, [3.2, 2.15, -6.9]);                        // its beam
  k.cyl(g, [0.14, 0.14, 0.3, 14], M.brass, [4.9, 1.9, -6.9]);                     // and the running weight
  k.strut(g, [-0.4, 0.62, -6.2], [1.6, 2.1, -6.85], 0.03, M.darkSteel, 6);        // the link from platform to beam
  for (const x of [-5.0, 5.0]) {                                                  // pallets of sacks
    k.box(g, [1.8, 0.14, 1.3], M.timber, [x, 0.07, -3.5]);
    k.box(g, [1.0, 0.7, 0.9], M.sack, [x - 0.3, 0.5, -3.5]);
    k.box(g, [0.8, 0.5, 0.8], M.sack, [x + 0.35, 0.4, -3.5]);
  }
  k.tag(g, 'WEIGH HOUSE', { w: 0.9, h: 0.2 }, [-4.5, 2.4, -7.31]);
  h.colliders.push({ lx: 0, lz: -7.4, hw: 6.3, hd: 0.5 }, { lx: -1.6, lz: -5.0, hw: 1.9, hd: 1.4 }, { lx: -5.0, lz: -3.5, hw: 0.9, hd: 0.65 }, { lx: 5.0, lz: -3.5, hw: 0.9, hd: 0.65 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 3 */

/** The tilting gauge: a long trough on a pivot over a catch basin, a screw jack at one end and a graduated post with a pointer. */
export function buildTiltingGauge(w) {
  const h = start(w, 'site-3', 'tilting-gauge');
  const { k, M, g } = h;
  const Z0 = -8.2, Z1 = -4.6;
  basin(k, g, M, [-6.0, 6.0, Z0, Z1], { h: 0.8, level: 0.55 });
  k.box(g, [9.0, 0.3, 1.2], M.steel, [0, 1.9, -6.4], [0, 0, 0.06]);               // the trough, tipped a little
  for (const sz of [-0.58, 0.58]) k.box(g, [9.0, 0.28, 0.06], M.darkSteel, [0, 2.1, -6.4 + sz], [0, 0, 0.06]);
  k.box(g, [0.34, 1.6, 0.5], M.darkSteel, [0, 0.9, -6.4]);                        // the pivot post
  k.cyl(g, [0.12, 0.12, 1.4, 14], M.brass, [0, 1.75, -6.4], [Math.PI / 2, 0, 0]);
  k.box(g, [0.2, 1.1, 0.2], M.darkSteel, [3.9, 1.35, -6.4]);                      // the jack under the low end
  k.box(g, [0.5, 0.12, 0.5], M.brass, [3.9, 0.82, -6.4]);
  k.post(g, 5.4, -6.4, 3.0, 0.14);                                                // the gauge post and its marks
  for (let i = 0; i < 10; i++) k.box(g, [0.34, 0.03, 0.04], M.paint2, [5.4, 0.6 + i * 0.24, -6.28], null, false);
  k.box(g, [1.0, 0.06, 0.05], M.paintRed, [4.95, 2.0, -6.2]);                      // the pointer
  k.tag(g, 'TILT GAUGE', { w: 0.7, h: 0.17 }, [-3.0, 0.62, Z1 + 0.17]);
  h.colliders.push({ lx: 0, lz: -6.4, hw: 6.2, hd: 2.0 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 4 */

/** The sorting house: a shed with a wall of pigeonholes, a sorting table and crates waiting to be filed. */
export function buildSortingHouse(w) {
  const h = start(w, 'site-4', 'sorting-house');
  const { k, M, g } = h;
  k.box(g, [13.2, 3.3, 0.25], M.plaster, [0, 1.65, -7.45]);
  for (const sx of [-1, 1]) {
    k.box(g, [0.25, 3.3, 4.6], M.plaster, [sx * 6.5, 1.65, -5.1]);
    k.post(g, sx * 6.5, -2.7, 3.4, 0.2);
  }
  k.box(g, [13.6, 0.2, 5.4], M.roofSheet, [0, 3.45, -4.9], [0.06, 0, 0]);
  const X0 = -5.5, COLS = 11, ROWS = 4;                                           // the pigeonholes: 11 columns, 4 rows
  for (let r = 0; r <= ROWS; r++) k.box(g, [COLS, 0.05, 0.5], M.timber, [0, 0.5 + r * 0.6, -7.1]);
  for (let c = 0; c <= COLS; c++) k.box(g, [0.05, ROWS * 0.6, 0.5], M.timber, [X0 + c, 0.5 + ROWS * 0.3, -7.1]);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if ((r * 5 + c * 3) % 4 === 0) continue;
    k.box(g, [0.5, 0.4, 0.05], (r + c) % 3 ? M.paint2 : M.paintYellow, [X0 + c + 0.5, 0.8 + r * 0.6, -7.0], null, false);
  }
  k.box(g, [4.2, 0.08, 1.4], M.timber, [-1.8, 0.95, -4.4]);                       // the sorting table
  for (const [dx, dz] of [[-1.9, -0.6], [1.9, -0.6], [-1.9, 0.6], [1.9, 0.6]]) k.box(g, [0.1, 0.9, 0.1], M.darkSteel, [-1.8 + dx, 0.45, -4.4 + dz]);
  for (let i = 0; i < 5; i++) k.box(g, [0.4, 0.02, 0.28], i % 2 ? M.paint2 : M.paintYellow, [-3.0 + i * 0.6, 1.0, -4.4], null, false);
  k.box(g, [1.0, 0.8, 0.9], M.crateB, [5.0, 0.4, -3.6]);                          // crates waiting
  k.box(g, [0.8, 0.6, 0.8], M.crate, [5.0, 1.1, -3.6]);
  k.tag(g, 'SORTING HOUSE', { w: 0.95, h: 0.2 }, [0, 3.05, -7.31]);
  h.colliders.push({ lx: 0, lz: -7.1, hw: 6.2, hd: 0.5 }, { lx: -1.8, lz: -4.4, hw: 2.2, hd: 0.8 }, { lx: 5.0, lz: -3.6, hw: 0.6, hd: 0.5 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 5 */

/** The ledger desk: a clerk's hut with a sloped desk, the ledger open on it, a column board on the wall and the record books. */
export function buildLedgerDesk(w) {
  const h = start(w, 'site-5', 'ledger-desk');
  const { k, M, g } = h;
  k.box(g, [10.6, 3.2, 0.25], M.plaster, [0, 1.6, -6.8]);
  k.box(g, [10.8, 0.15, 4.6], M.roofSheet, [0, 3.35, -4.6], [0.08, 0, 0]);
  for (const sx of [-1, 1]) { k.post(g, sx * 5.2, -2.5, 3.3, 0.2); k.post(g, sx * 5.2, -6.6, 3.3, 0.2); }
  k.box(g, [5.0, 0.1, 1.4], M.timber, [0, 1.1, -4.4], [-0.25, 0, 0]);               // the sloped desk
  for (const [dx, dz] of [[-2.3, -0.5], [2.3, -0.5], [-2.3, 0.5], [2.3, 0.5]]) k.box(g, [0.1, 1.0 - (dz > 0 ? 0.12 : 0), 0.1], M.darkSteel, [dx, 0.5, -4.4 + dz]);
  k.box(g, [1.5, 0.07, 1.0], M.caseDark, [-1.0, 1.28, -4.3], [-0.25, 0, 0]);       // the ledger, open
  k.box(g, [0.7, 0.02, 0.9], M.paint2, [-1.4, 1.34, -4.3], [-0.25, 0, 0], false);
  k.box(g, [0.7, 0.02, 0.9], M.paint2, [-0.6, 1.34, -4.3], [-0.25, 0, 0], false);
  k.cyl(g, [0.06, 0.06, 0.1, 10], M.glassDark, [1.4, 1.32, -4.5]);
  k.cyl(g, [0.3, 0.3, 0.06, 14], M.timber, [0, 0.62, -3.3]);                        // the clerk's stool
  k.cyl(g, [0.05, 0.05, 0.6, 8], M.darkSteel, [0, 0.3, -3.3]);
  k.box(g, [4.8, 1.8, 0.1], M.caseDark, [0, 2.0, -6.6]);                            // the column board on the wall
  for (let c = 0; c <= 4; c++) k.box(g, [0.03, 1.7, 0.02], M.paint2, [-2.4 + c * 1.2, 2.0, -6.53], null, false);
  for (let r = 0; r <= 3; r++) k.box(g, [4.8, 0.03, 0.02], M.paint2, [0, 1.25 + r * 0.5, -6.53], null, false);
  for (let i = 0; i < 3; i++) k.box(g, [0.8, 0.14, 0.6], i % 2 ? M.crateB : M.crate, [5.2, 0.12 + i * 0.14, -1.9]);   // the record books
  k.tag(g, 'LEDGER', { w: 0.5, h: 0.17 }, [4.0, 2.0, -6.66]);
  h.colliders.push({ lx: 0, lz: -6.7, hw: 5.3, hd: 0.3 }, { lx: 0, lz: -4.4, hw: 2.6, hd: 0.8 }, { lx: 5.2, lz: -1.9, hw: 0.5, hd: 0.4 });
  return finish(h, [-3.4, -1.8, [2.9, 1.8]]);
}

/* ------------------------------------------------------------------------ 6 */

/** The pump station: a beam pump rocking on its A-frames, the pump house, an accumulator drum and the brine main. */
export function buildPumpStation(w) {
  const h = start(w, 'site-6', 'pump-station');
  const { k, M, g } = h;
  const pump = buildBeamPump(w.ctx, {}, 6);
  pump.position.set(0, 0.05, -6.6);
  pump.name = 'station-beam-pump';
  g.add(pump);
  w.animated.push(pump);
  k.box(g, [3.0, 2.6, 2.6], M.plaster, [5.4, 1.35, -3.4]);                         // the pump house
  k.box(g, [3.4, 0.16, 3.0], M.roofSheet, [5.4, 2.74, -3.4], [0, 0, 0.05]);
  k.box(g, [0.9, 2.0, 0.08], M.darkSteel, [5.4, 1.05, -2.06]);
  k.cyl(g, [1.0, 1.0, 2.4, 20], M.steel, [-5.6, 1.25, -4.0]);                       // the accumulator drum
  k.cone(g, [1.0, 0.5, 20], M.roofSheet, [-5.6, 2.7, -4.0]);
  k.pipe(g, [[-4.6, 0.9, -4.0], [-4.3, 0.9, -6.0], [-3.9, 0.9, -6.6]], 0.1, M.rusted);   // the main, drum to pump
  k.pipe(g, [[3.5, 0.9, -6.6], [3.5, 0.5, -4.9], [4.0, 0.5, -4.7]], 0.1, M.rusted);      // and pump to house
  k.tag(g, 'PUMP STATION', { w: 0.85, h: 0.17 }, [-5.6, 0.7, -2.97]);
  h.colliders.push({ lx: 0, lz: -6.6, hw: 1.9, hd: 1.3 }, { lx: 3.5, lz: -6.6, r: 0.8 }, { lx: 5.4, lz: -3.4, hw: 1.6, hd: 1.4 }, { lx: -5.6, lz: -4.0, r: 1.1 });
  return finish(h, [-3.4, -1.8, [2.9, 1.8]]);
}

/* ------------------------------------------------------------------------ 7 */

/** The settling pond: a walled pond with a salt rim and a boardwalk over it, a cone-bottomed settling tank and drums of reagent. */
export function buildSettlingPond(w) {
  const h = start(w, 'site-7', 'settling-pond');
  const { k, M, g } = h;
  const Z0 = -8.4, Z1 = -4.0;
  basin(k, g, M, [-6.8, 1.2, Z0, Z1], { liquid: M.saltWhite, level: 0.7 });
  k.box(g, [5.8, 0.04, 2.8], M.brine, [-2.8, 0.76, -6.2], null, false);            // clear brine in the middle of the crust
  k.box(g, [8.4, 0.08, 0.8], M.timber, [-2.8, 1.15, -6.2]);                         // the boardwalk
  for (const x of [-6.8, 1.2]) k.box(g, [0.2, 0.2, 0.9], M.darkSteel, [x, 1.0, -6.2]);
  k.cyl(g, [1.3, 1.3, 2.0, 22], M.steel, [4.6, 3.6, -6.2]);                        // the settling tank on its legs
  k.cyl(g, [1.3, 0.25, 1.6, 22], M.steel, [4.6, 1.9, -6.2]);
  k.cone(g, [1.3, 0.8, 22], M.roofSheet, [4.6, 5.0, -6.2]);
  for (const [dx, dz] of [[1.1, 1.1], [-1.1, 1.1], [1.1, -1.1], [-1.1, -1.1]]) k.box(g, [0.16, 1.9, 0.16], M.darkSteel, [4.6 + dx, 0.95, -6.2 + dz]);
  k.cyl(g, [0.3, 0.3, 0.9, 14], M.drumB, [-5.6, 0.5, -1.8]);                       // drums of reagent
  k.cyl(g, [0.3, 0.3, 0.9, 14], M.paintBlue, [-4.8, 0.5, -1.8]);
  k.tag(g, 'SETTLING POND', { w: 0.95, h: 0.2 }, [-2.8, 0.7, Z1 + 0.17]);
  h.colliders.push({ lx: -2.8, lz: -6.2, hw: 4.2, hd: 2.4 }, { lx: 4.6, lz: -6.2, r: 1.5 }, { lx: -5.2, lz: -1.8, hw: 0.8, hd: 0.4 });
  return finish(h, [3.2, -1.6, [-2.9, 1.6]]);
}

/* ------------------------------------------------------------------------ 8 */

/** The plotting hut: a gridded board with a curve on it, a drafting table, a rule on a rail and a rack of rolled charts. */
export function buildPlottingHut(w) {
  const h = start(w, 'site-8', 'plotting-hut');
  const { k, M, g } = h;
  k.box(g, [13.0, 3.4, 0.25], M.plaster, [0, 1.7, -7.45]);
  for (const sx of [-1, 1]) {
    k.box(g, [0.25, 3.4, 4.8], M.plaster, [sx * 6.4, 1.7, -5.0]);
    k.post(g, sx * 6.4, -2.6, 3.5, 0.2);
  }
  k.box(g, [13.4, 0.2, 5.6], M.roofSheet, [0, 3.55, -4.9], [0.06, 0, 0]);
  k.box(g, [6.4, 2.6, 0.1], M.caseDark, [0, 1.9, -7.2]);                            // the board
  for (let c = 0; c <= 12; c++) k.box(g, [0.02, 2.4, 0.02], M.paint2, [-3.0 + c * 0.5, 1.9, -7.13], null, false);
  for (let r = 0; r <= 6; r++) k.box(g, [6.0, 0.02, 0.02], M.paint2, [0, 0.7 + r * 0.4, -7.13], null, false);
  for (let i = 0; i < 10; i++) {                                                    // a decaying curve, a segment at a time
    const f = t => 0.7 + 2.2 * Math.exp(-t / 1.6);
    const x0 = -2.7 + i * 0.5, x1 = x0 + 0.5, y0 = f(x0 + 2.7), y1 = f(x1 + 2.7);
    const len = Math.hypot(0.5, y1 - y0);
    k.box(g, [len, 0.05, 0.02], M.paintYellow, [(x0 + x1) / 2, (y0 + y1) / 2, -7.11], [0, 0, Math.atan2(y1 - y0, 0.5)], false);
  }
  k.cyl(g, [0.025, 0.025, 6.4, 8], M.brass, [0, 0.5, -7.0], [0, 0, Math.PI / 2]);   // the rail and its rule
  k.box(g, [0.06, 2.4, 0.03], M.paint2, [1.6, 1.7, -7.0]);
  k.box(g, [3.4, 0.08, 1.8], M.timber, [-2.6, 0.95, -4.4], [-0.2, 0, 0]);           // the drafting table
  for (const [dx, dz] of [[-1.5, -0.7], [1.5, -0.7], [-1.5, 0.7], [1.5, 0.7]]) k.box(g, [0.1, 0.9, 0.1], M.darkSteel, [-2.6 + dx, 0.45, -4.4 + dz]);
  k.box(g, [1.6, 0.8, 0.8], M.steel, [5.6, 0.4, -2.6]);                             // the chart rack
  for (let i = 0; i < 4; i++) k.cyl(g, [0.08, 0.08, 1.4, 10], M.paint2, [5.6, 0.9, -2.9 + i * 0.2], [0, 0, Math.PI / 2]);
  k.tag(g, 'PLOTTING HUT', { w: 0.85, h: 0.2 }, [-5.0, 2.6, -7.31]);
  h.colliders.push({ lx: 0, lz: -7.3, hw: 6.4, hd: 0.3 }, { lx: -2.6, lz: -4.4, hw: 1.8, hd: 1.0 }, { lx: 5.6, lz: -2.6, hw: 0.9, hd: 0.5 });
  return finish(h);
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': buildSluiceGate,
  'site-2': buildWeighHouse,
  'site-3': buildTiltingGauge,
  'site-4': buildSortingHouse,
  'site-5': buildLedgerDesk,
  'site-6': buildPumpStation,
  'site-7': buildSettlingPond,
  'site-8': buildPlottingHut
};

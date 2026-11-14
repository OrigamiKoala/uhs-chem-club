/**
 * kettle/stations.js — The nine hosts: the pieces of the foundry works a Learn bench is built into.
 *
 * A bench on Kettle is not a bench in a room. It is a working point of the works: the assay yard's ore bays, the
 * labelling shed's crate racks, a sealed charging pot on its weighbridge, the furnace control room with its recipe
 * board, the effluent sump, the blast-furnace charge floor, the pickling line under its burette gantry and the
 * furnace tapping floor. Each builder returns the machine AND its bench as ONE object, so the overlap rule (which
 * exempts a body's own parts) lets the bench be bolted to the thing it belongs to, and the bay contract
 * (`bench-bay.js`) keeps the volume the plate, the instrument, the screens and the camera need empty.
 *
 * THE HOST FRAME. Origin on the ground under the middle of the plate; +z is the front (toward the road the player
 * walks in from), +x to the player's right. The world places the group at `site.pos`, turned to face its approach.
 * Machinery stands to the sides (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m behind it; the work lamp
 * hangs over the plate on a boom from a mast at the side. `verify:bench` measures all of it and `verify:kettle`
 * measures that no host stands outside the extent `host-plan.js` declares for it.
 *
 * ONLY LAMPS ARE LIT. A host's work lamp is a `lampMark` the world pools; nothing here owns a PointLight.
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is the bench's instrument, cased up: the
 * one clean, bright thing in a weathered works (`M.case`). Pressing [E] hides the case and opens the table.
 *
 * @returns {{ group, bench, benchLocal, colliders, vents? }} `colliders` are host-local discs `{ lx, lz, r }` and
 *   boxes `{ lx, lz, hw, hd }`; the world turns them to its own frame.
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { placard } from '../materials/pbr-kit.js';
import { HOST_PLAN } from './host-plan.js';

const LAMP = 0xd99423;
const UP = new THREE.Vector3(0, 1, 0);

/* ----------------------------------------------------------------- the bench */

/** The bench: the shared bay bench in the host's skin, dressed in the works' cast iron, its cased instrument for `kind`. */
export function buildKtBench(ctx, { kind = 'heap', plate = 'KET-01', skin = 'shelf' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x, y, z, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    return m;
  };
  return buildBayBench(ctx, {
    skin, plate,
    // The same dress the foundry room gave the table: cast-iron plate, blackened rims, firebrick trays.
    mats: { top: M.castIron, dark: M.darkIron, tray: M.firebrick },
    tagStyle: { fg: '#1e1a14', bg: '#d8c9a2' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (...a) => dormant.add(mesh(...a));
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), M.brass, -0.62, height + 0.42, 0.05, [Math.PI / 2, 0, 0]);
      add(new THREE.CircleGeometry(0.13, 22), M.glassDark, -0.62, height + 0.42, 0.072);
      if (kind === 'heap') {                  // three little heaps of ore on a tray
        add(new THREE.BoxGeometry(1.1, 0.04, 0.36), M.firebrick, 0.62, y0 + 0.02, 0.12);
        [M.ore, M.oreB, M.paint2].forEach((m, i) => add(new THREE.ConeGeometry(0.11, 0.16, 12), m, 0.34 + i * 0.28, y0 + 0.12, 0.12));
      } else if (kind === 'cards') {          // a stack of ion discs
        for (let k = 0; k < 4; k++) add(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 18), k % 2 ? M.paint2 : M.paintYellow, 0.5 + (k % 2) * 0.3, y0 + 0.02 + (k >> 1) * 0.035, 0.12);
      } else if (kind === 'pot') {            // a lidded pot on a small balance
        add(new THREE.BoxGeometry(0.6, 0.06, 0.4), M.caseDark, 0.55, y0 + 0.03, 0.12);
        add(new THREE.CylinderGeometry(0.17, 0.17, 0.3, 20), M.darkIron, 0.55, y0 + 0.21, 0.12);
        add(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 20), M.brass, 0.55, y0 + 0.38, 0.12);
      } else if (kind === 'board') {          // a card board on a stand
        add(new THREE.BoxGeometry(0.7, 0.4, 0.04), M.caseDark, 0.6, y0 + 0.24, 0.04, [-0.3, 0, 0]);
        for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.16, 0.08, 0.02), k % 2 ? M.paint2 : M.paintYellow, 0.4 + k * 0.2, y0 + 0.28, 0.07, [-0.3, 0, 0]);
      } else if (kind === 'ionic') {          // a beaker between two electrodes
        add(new THREE.CylinderGeometry(0.16, 0.14, 0.3, 20), M.glass, 0.55, y0 + 0.15, 0.12);
        for (const x of [0.46, 0.64]) add(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 6), M.copper, x, y0 + 0.24, 0.12);
      } else if (kind === 'burette') {        // a burette on a stand over a flask
        add(new THREE.CylinderGeometry(0.014, 0.014, 0.62, 8), M.caseDark, 0.78, y0 + 0.31, 0.04);
        add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 10), M.glass, 0.55, y0 + 0.46, 0.04);
        add(new THREE.CylinderGeometry(0.1, 0.16, 0.2, 18), M.glass, 0.55, y0 + 0.1, 0.04);
      } else {                                // gas tests: a splint holder and a tube rack
        add(new THREE.BoxGeometry(0.5, 0.04, 0.2), M.caseDark, 0.6, y0 + 0.02, 0.12);
        for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 10), M.glass, 0.44 + k * 0.16, y0 + 0.15, 0.12);
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
    const t = placard(text, { fg: '#1e1a14', bg: '#d8c9a2', ...size });
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
  const bench = buildKtBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
  g.add(bench.group);
  k.slab(g, [plan.extent[0], plan.extent[1], plan.extent[2], plan.extent[3] - 0.2]);
  return { k, M: w.M, g, bench, colliders: [{ lx: 0, lz: 0, hw: 2.4, hd: 0.65 }] };
}
const finish = (h, mast = [3.2, -1.8, [-2.9, 1.8]]) => {
  h.k.lampMast(h.g, mast[0], mast[1], { arm: mast[2] });
  h.colliders.push({ lx: mast[0], lz: mast[1], r: 0.2 });
  return { group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders };
};

/* ------------------------------------------------------------------------ 1 */

/** The assay yard: three ore bays divided by push walls, the ore tubs and a grizzly hopper. */
export function buildAssayYard(w) {
  const h = start(w, 'site-1', 'assay-yard');
  const { k, M, g } = h;
  for (const x of [-6, -2, 2, 6]) k.box(g, [0.4, 1.8, 4.6], M.concrete, [x, 0.9, -5.7]);
  k.box(g, [12.4, 2.4, 0.3], M.concrete, [0, 1.2, -8.05]);
  [[-4, M.ore, 1.5], [0, M.oreB, 1.2], [4, M.paint2, 1.35]].forEach(([x, mat, r]) => k.cone(g, [r, 1.5], mat, [x, 0.75, -5.8]));
  for (let i = 0; i < 3; i++) {               // the ore tubs
    k.tube(g, [0.55, 0.8], M.firebrick, [4.4 + i * 1.25, 0.42, -1.2]);
    k.cyl(g, [0.55, 0.55, 0.06, 18], M.darkIron, [4.4 + i * 1.25, 0.03, -1.2]);
  }
  k.tag(g, 'ORE TUBS', { w: 0.62, h: 0.17 }, [5.6, 0.95, -0.55]);
  for (const [dx, dz] of [[-0.7, -0.5], [0.7, -0.5], [-0.7, 0.5], [0.7, 0.5]]) k.box(g, [0.1, 0.8, 0.1], M.darkSteel, [-5 + dx, 0.4, -1.5 + dz]);
  k.box(g, [1.8, 0.1, 1.4], M.steel, [-5, 0.85, -1.5], [0.2, 0, 0]);   // the grizzly hopper's sloped screen
  k.box(g, [1.8, 0.5, 0.08], M.rusted, [-5, 1.1, -2.05]);
  h.colliders.push({ lx: 0, lz: -5.7, hw: 6.2, hd: 2.3 }, { lx: 5.6, lz: -1.2, hw: 1.7, hd: 0.7 }, { lx: -5, lz: -1.5, r: 1.1 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 2 */

/** The labelling shed: an open-fronted shed, crate racks along its back wall, pallets in front. */
export function buildLabellingShed(w) {
  const h = start(w, 'site-2', 'labelling-shed');
  const { k, M, g } = h;
  k.box(g, [13.2, 3.3, 0.25], M.hallWall, [0, 1.65, -7.45]);
  for (const sx of [-1, 1]) {
    k.box(g, [0.25, 3.3, 5.0], M.hallWall, [sx * 6.5, 1.65, -4.9]);
    k.post(g, sx * 6.5, -2.3, 3.4, 0.2);
  }
  k.box(g, [13.6, 0.2, 5.8], M.roofSheet, [0, 3.45, -4.6], [0.06, 0, 0]);
  for (const x of [-4.2, 0, 4.2]) {           // crate racks: uprights and three shelves, crates on each
    for (const dx of [-1.6, 1.6]) k.box(g, [0.1, 2.6, 0.5], M.darkSteel, [x + dx, 1.3, -6.9]);
    [0.5, 1.35, 2.2].forEach((y, i) => {
      k.box(g, [3.3, 0.06, 0.6], M.darkSteel, [x, y, -6.9]);
      for (let c = 0; c < 3; c++) k.box(g, [0.85, 0.55, 0.45], (c + i) % 2 ? M.crate : M.crateB, [x - 1.0 + c * 1.0, y + 0.3, -6.9]);
    });
  }
  for (const x of [-4.4, 4.4]) {              // pallets stacked with labelled crates
    k.box(g, [1.8, 0.14, 1.3], M.timber, [x, 0.07, -3.6]);
    k.box(g, [1.0, 0.8, 0.9], M.crateB, [x - 0.3, 0.55, -3.6]);
    k.box(g, [0.8, 0.6, 0.8], M.crate, [x + 0.35, 0.45, -3.6]);
    k.tag(g, 'NO LABEL', { w: 0.5, h: 0.15 }, [x - 0.3, 0.6, -3.14]);
  }
  h.colliders.push({ lx: 0, lz: -6.9, hw: 6.3, hd: 0.5 }, { lx: -4.4, lz: -3.6, hw: 0.9, hd: 0.65 }, { lx: 4.4, lz: -3.6, hw: 0.9, hd: 0.65 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 3 */

/** A sealed charging pot on a weighbridge, with its indicator column and a chain hoist on an A-frame. */
export function buildChargingPot(w) {
  const h = start(w, 'site-3', 'charging-pot');
  const { k, M, g } = h;
  k.box(g, [5.2, 0.3, 3.2], M.steel, [0, 0.25, -4.6]);                            // the weighbridge deck
  k.box(g, [5.2, 0.08, 3.2], M.darkSteel, [0, 0.42, -4.6]);
  for (const sx of [-1, 1]) k.box(g, [1.2, 0.08, 3.0], M.darkSteel, [sx * 3.2, 0.2, -4.6], [0, 0, sx * -0.22]);
  for (const [dx, dz] of [[-2.4, -1.5], [2.4, -1.5], [-2.4, 1.5], [2.4, 1.5]]) k.box(g, [0.3, 0.16, 0.3], M.brass, [dx, 0.08, -4.6 + dz]);
  k.cyl(g, [1.3, 1.3, 1.5, 28], M.darkIron, [0, 1.3, -4.6]);                       // the pot
  k.cyl(g, [1.4, 1.4, 0.16, 28], M.darkSteel, [0, 0.62, -4.6]);
  k.cyl(g, [1.4, 1.4, 0.16, 28], M.darkSteel, [0, 2.0, -4.6]);
  k.cone(g, [1.35, 0.7, 28], M.darkIron, [0, 2.45, -4.6]);                         // the sealed lid
  k.cyl(g, [0.12, 0.12, 0.3, 10], M.brass, [0, 2.95, -4.6]);
  k.strut(g, [0, 3.1, -4.6], [0, 4.5, -4.6], 0.02, M.darkSteel, 5);               // the hoist chain
  for (const sx of [-1, 1]) {                                                     // the A-frame
    k.strut(g, [sx * 3.6, 0.1, -3.6], [sx * 0.2, 4.7, -4.6], 0.08, M.darkSteel);
    k.strut(g, [sx * 3.6, 0.1, -5.6], [sx * 0.2, 4.7, -4.6], 0.08, M.darkSteel);
  }
  k.box(g, [8, 0.18, 0.18], M.steel, [0, 4.7, -4.6]);
  const cx = -3.9;                                                                // the indicator column
  k.footing(g, cx, -1.7, 0.3);
  k.cyl(g, [0.08, 0.1, 1.3, 10], M.darkSteel, [cx, 0.7, -1.7]);
  k.box(g, [0.55, 0.45, 0.25], M.caseDark, [cx, 1.6, -1.7]);
  k.tag(g, 'WEIGHBRIDGE', { w: 0.7, h: 0.17 }, [cx, 1.6, -1.56]);
  h.colliders.push({ lx: 0, lz: -4.6, hw: 2.7, hd: 1.7 }, { lx: cx, lz: -1.7, r: 0.35 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 4 */

/** The furnace control room: a cabin with a window on the furnace and the recipe board on its front wall. */
export function buildControlRoom(w) {
  const h = start(w, 'site-4', 'control-room');
  const { k, M, g } = h;
  k.box(g, [9.4, 3.2, 4.2], M.hallWall, [0, 1.7, -5.5]);                           // the cabin
  k.box(g, [9.8, 0.25, 4.6], M.hallRoof, [0, 3.45, -5.5]);
  k.box(g, [3.0, 0.9, 0.06], M.glass, [-2.9, 2.3, -3.37], null, false);            // the window on the furnace
  k.box(g, [3.2, 0.1, 0.1], M.darkSteel, [-2.9, 2.78, -3.38], null, false);
  k.box(g, [5.2, 1.8, 0.1], M.caseDark, [1.6, 1.6, -3.36]);                       // the recipe board
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
    if ((r * 3 + c) % 5 === 4) continue;
    k.box(g, [0.38, 0.2, 0.04], (r + c) % 3 ? M.paint2 : M.paintYellow, [-0.7 + c * 0.6, 0.95 + r * 0.4, -3.28], null, false);
  }
  k.tag(g, 'FURNACE RECIPE', { w: 1.1, h: 0.22 }, [1.6, 2.65, -3.29]);
  k.box(g, [0.9, 2.1, 0.12], M.rusted, [5.6, 1.1, -3.5]);                          // the door, and its steps
  k.box(g, [1.4, 0.3, 1.0], M.darkSteel, [5.6, 0.15, -2.9]);
  k.cyl(g, [0.18, 0.18, 0.9, 12], M.darkSteel, [-5.8, 0.55, -2.3]);                // a cable drum
  k.box(g, [1.2, 0.6, 0.8], M.steel, [-4.0, 3.9, -5.5]);                           // the cabin's air unit
  h.colliders.push({ lx: 0, lz: -5.5, hw: 4.8, hd: 2.15 }, { lx: 5.6, lz: -2.9, hw: 0.7, hd: 0.5 }, { lx: -5.8, lz: -2.3, r: 0.3 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 5 */

/** The effluent sump: a walled basin with two settling tanks over it, a launder channel and a pump. */
export function buildEffluentSump(w) {
  const h = start(w, 'site-5', 'effluent-sump');
  const { k, M, g } = h;
  const Z0 = -9.0, Z1 = -3.8;
  k.box(g, [13.6, 1.0, 0.4], M.concrete, [0, 0.5, Z0]);
  k.box(g, [13.6, 1.0, 0.4], M.concrete, [0, 0.5, Z1]);
  for (const sx of [-1, 1]) k.box(g, [0.4, 1.0, Z1 - Z0], M.concrete, [sx * 6.9, 0.5, (Z0 + Z1) / 2]);
  k.box(g, [13.0, 0.06, Z1 - Z0 - 0.5], M.pool, [0, 0.72, (Z0 + Z1) / 2], null, false);
  for (const x of [-3.2, 3.2]) {                                                  // the settling tanks, on legs over the basin
    k.cyl(g, [1.5, 1.5, 2.2, 24], M.steel, [x, 3.0, -6.4]);
    k.cyl(g, [1.5, 0.3, 1.4, 24], M.steel, [x, 1.2, -6.4]);
    k.cyl(g, [0.1, 1.5, 0.9, 24], M.roofSheet, [x, 4.55, -6.4]);
    for (const [dx, dz] of [[1.2, 1.2], [-1.2, 1.2], [1.2, -1.2], [-1.2, -1.2]]) k.box(g, [0.14, 1.9, 0.14], M.darkSteel, [x + dx, 0.95, -6.4 + dz]);
  }
  k.box(g, [6.4, 0.2, 0.5], M.steel, [0, 2.6, -4.3]);                              // the launder channel between them
  k.pipe(g, [[-3.2, 2.2, -4.9], [-3.2, 2.5, -4.4]], 0.1, M.clad);
  const px = 5.6;                                                                 // the pump, outside the bay
  k.footing(g, px, -1.5, 0.9);
  k.box(g, [0.9, 0.5, 0.6], M.darkSteel, [px, 0.35, -1.5]);
  k.cyl(g, [0.3, 0.3, 0.7, 16], M.drumB, [px + 0.7, 0.55, -1.5], [0, 0, Math.PI / 2]);
  k.pipe(g, [[px, 0.6, -1.9], [px, 1.6, -2.4], [px, 1.6, Z1]], 0.1, M.rusted);
  k.tag(g, 'SUMP', { w: 0.4, h: 0.15 }, [-4.4, 0.8, Z1 + 0.22]);
  h.colliders.push({ lx: 0, lz: (Z0 + Z1) / 2, hw: 7.0, hd: 2.7 }, { lx: px, lz: -1.5, hw: 1.1, hd: 0.5 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 6 */

/** The blast-furnace charge floor: three bunkers, a weigh hopper on load cells and the skip rail up to the furnace top. */
export function buildChargeFloor(w) {
  const h = start(w, 'site-6', 'charge-floor');
  const { k, M, g } = h;
  [[-4.6, M.ore], [0, M.paintYellow], [4.6, M.paint2]].forEach(([x, mat]) => {     // ore, coke and flux bunkers
    k.box(g, [3.2, 2.0, 2.8], M.concrete, [x, 3.2, -8.0]);
    k.cyl(g, [1.5, 0.2, 1.2, 4], mat, [x, 1.6, -8.0]);
    for (const [dx, dz] of [[1.4, 1.2], [-1.4, 1.2], [1.4, -1.2], [-1.4, -1.2]]) k.box(g, [0.2, 2.2, 0.2], M.darkSteel, [x + dx, 1.1, -8.0 + dz]);
  });
  k.cyl(g, [1.0, 0.3, 1.6, 20], M.steel, [0, 1.3, -4.6]);                          // the weigh hopper
  k.cyl(g, [1.0, 1.0, 0.8, 20], M.steel, [0, 2.4, -4.6]);
  for (const [dx, dz] of [[0.85, 0.85], [-0.85, 0.85], [0, -1.2]]) { k.box(g, [0.2, 0.9, 0.2], M.darkSteel, [dx, 0.45, -4.6 + dz]); k.box(g, [0.26, 0.12, 0.26], M.brass, [dx, 0.96, -4.6 + dz]); }
  k.box(g, [0.5, 0.5, 0.25], M.caseDark, [-1.8, 1.0, -3.8]);                       // the hopper's readout
  const sx = 6.4;                                                                  // the skip rail
  for (const dz of [-0.5, 0.5]) k.strut(g, [sx, 0.3, -2.9 + dz], [sx, 11, -9.5 + dz], 0.07, M.darkSteel);
  for (const t of [0.25, 0.5, 0.75]) k.box(g, [0.15, 0.15, 1.2], M.darkSteel, [sx, 0.3 + t * 10.7, -2.9 - t * 6.6]);
  k.box(g, [1.0, 0.9, 1.4], M.rusted, [sx, 3.1, -5.0], [0.57, 0, 0]);               // the skip car
  k.tag(g, 'CHARGE FLOOR', { w: 0.8, h: 0.17 }, [-5.8, 0.9, -1.3]);
  k.post(g, -5.8, -1.5, 0.9, 0.12);
  h.colliders.push({ lx: 0, lz: -8.0, hw: 6.4, hd: 1.6 }, { lx: 0, lz: -4.6, r: 1.2 }, { lx: sx, lz: -5.5, hw: 0.6, hd: 3.2 });
  return finish(h, [-3.4, -1.8, [2.9, 1.8]]);
}

/* ------------------------------------------------------------------------ 7 */

/** The pickling line: a long acid tank under a burette gantry, a rinse tank beside it and a hoist. */
export function buildPicklingLine(w) {
  const h = start(w, 'site-7', 'pickling-line');
  const { k, M, g } = h;
  const walls = (x0, x1, z0, z1, mat, liquid) => {
    k.box(g, [x1 - x0, 1.0, 0.25], mat, [(x0 + x1) / 2, 0.5, z0]);
    k.box(g, [x1 - x0, 1.0, 0.25], mat, [(x0 + x1) / 2, 0.5, z1]);
    for (const x of [x0, x1]) k.box(g, [0.25, 1.0, z1 - z0], mat, [x, 0.5, (z0 + z1) / 2]);
    k.box(g, [x1 - x0 - 0.3, 0.06, z1 - z0 - 0.3], liquid, [(x0 + x1) / 2, 0.82, (z0 + z1) / 2], null, false);
  };
  walls(-6.4, 2.0, -7.6, -4.0, M.paintYellow, M.acid);                             // the acid tank
  walls(3.0, 6.6, -7.6, -4.0, M.concrete, M.pool);                                 // the rinse tank
  for (const sx of [-6.7, 6.9]) for (const sz of [-3.6, -8.0]) k.post(g, sx, sz, 4.6, 0.2);   // the gantry
  for (const sz of [-3.6, -8.0]) k.box(g, [14, 0.22, 0.22], M.steel, [0.1, 4.6, sz]);
  k.box(g, [0.22, 0.22, 4.6], M.steel, [-2.2, 4.6, -5.8]);
  for (const x of [-4.2, -2.2, -0.2]) {                                            // three burettes hanging over the acid
    k.cyl(g, [0.045, 0.045, 2.4, 12], M.glass, [x, 3.2, -5.8], null, false);
    k.box(g, [0.14, 0.14, 0.14], M.brass, [x, 1.95, -5.8]);
    k.box(g, [0.18, 0.4, 0.18], M.caseDark, [x, 4.35, -5.8]);
  }
  k.box(g, [0.8, 0.5, 0.5], M.rusted, [4.6, 4.2, -5.8]);                           // the hoist trolley and its hook
  k.strut(g, [4.6, 3.95, -5.8], [4.6, 2.2, -5.8], 0.025, M.darkSteel, 5);
  k.box(g, [0.5, 0.35, 0.5], M.mesh, [4.6, 2.0, -5.8], null, false);
  k.tag(g, 'PICKLING', { w: 0.6, h: 0.17 }, [-3.0, 1.1, -3.76]);
  h.colliders.push({ lx: -2.2, lz: -5.8, hw: 4.3, hd: 1.9 }, { lx: 4.8, lz: -5.8, hw: 1.9, hd: 1.9 });
  for (const sx of [-6.7, 6.9]) for (const sz of [-3.6, -8.0]) h.colliders.push({ lx: sx, lz: sz, r: 0.25 });
  return finish(h, [3.2, -1.6, [-2.9, 1.6]]);
}

/* ------------------------------------------------------------------------ 8 */

/** The furnace tapping floor: the tap hole and its runner, a ladle on rails, a pair of flues with a hood. */
export function buildTappingFloor(w) {
  const h = start(w, 'site-8', 'tapping-floor');
  const { k, M, g } = h;
  k.box(g, [10.6, 5.2, 1.6], M.firebrick, [0, 2.6, -8.4]);                         // the furnace face
  k.box(g, [10.8, 0.4, 1.8], M.darkIron, [0, 5.4, -8.4]);
  k.box(g, [0.9, 0.7, 0.3], M.glassDark, [0, 1.1, -7.5]);                          // the tap hole
  k.strut(g, [0, 0.9, -7.4], [0, 0.5, -5.6], 0.2, M.darkIron);                     // the runner
  for (const sx of [-0.7, 0.7]) k.box(g, [0.1, 0.12, 6.2], M.darkSteel, [2.6 + sx * 0.7, 0.14, -5.4]);   // the ladle's rails
  k.cyl(g, [1.1, 0.9, 1.4, 24], M.darkIron, [2.6, 1.0, -4.8]);                      // the ladle on its car
  k.box(g, [2.2, 0.3, 1.8], M.darkSteel, [2.6, 0.3, -4.8]);
  k.cyl(g, [1.15, 1.15, 0.12, 24], M.rusted, [2.6, 1.75, -4.8]);
  for (const x of [-4.2, -3.0]) {                                                  // two flues rising to a hood
    k.cyl(g, [0.5, 0.5, 6.2, 16], M.clad, [x, 8.5, -8.0]);
    k.cyl(g, [0.6, 0.6, 0.2, 16], M.darkSteel, [x, 6.0, -8.0]);
  }
  k.box(g, [3.6, 0.4, 1.8], M.hallRoof, [-3.6, 11.7, -8.0]);
  k.box(g, [1.4, 0.8, 0.9], M.steel, [-5.6, 0.4, -1.6]);                           // the gas-test stand
  for (let i = 0; i < 3; i++) k.cyl(g, [0.05, 0.05, 0.4, 8], M.glass, [-5.9 + i * 0.3, 1.0, -1.6], null, false);
  k.tag(g, 'TAPPING FLOOR', { w: 0.85, h: 0.17 }, [-5.6, 0.55, -1.19]);
  h.colliders.push({ lx: 0, lz: -8.4, hw: 5.4, hd: 0.9 }, { lx: 2.6, lz: -4.8, hw: 1.2, hd: 1.0 }, { lx: -5.6, lz: -1.6, hw: 0.8, hd: 0.5 });
  return finish(h, [-3.2, -1.8, [2.9, 1.8]]);
}

/* ------------------------------------------------------------------------ 9 */

/** The refining bay: two precipitation vats, an overhead reagent feed manifold, and carboys. */
export function buildRefiningBay(w) {
  const h = start(w, 'site-9', 'refining-vat');
  const { k, M, g } = h;
  const Z0 = -8.2, Z1 = -4.0;
  const vat = (x0, x1, z0, z1, rimMat, liquidMat) => {
    k.box(g, [x1 - x0, 1.1, 0.25], rimMat, [(x0 + x1) / 2, 0.55, z0]);
    k.box(g, [x1 - x0, 1.1, 0.25], rimMat, [(x0 + x1) / 2, 0.55, z1]);
    for (const x of [x0, x1]) k.box(g, [0.25, 1.1, z1 - z0], rimMat, [x, 0.55, (z0 + z1) / 2]);
    k.box(g, [x1 - x0 - 0.3, 0.06, z1 - z0 - 0.3], liquidMat, [(x0 + x1) / 2, 0.9, (z0 + z1) / 2], null, false);
  };
  vat(-6.2, -0.6, Z0, Z1, M.concrete, M.pool);
  vat(0.6, 6.2, Z0, Z1, M.darkSteel, M.acid);

  for (const sx of [-6.4, 6.4]) for (const sz of [Z1, Z0]) k.post(g, sx, sz, 4.2, 0.18);
  for (const sz of [Z1, Z0]) k.box(g, [13.2, 0.2, 0.2], M.steel, [0, 4.2, sz]);
  k.box(g, [0.2, 0.2, Z1 - Z0], M.steel, [0, 4.2, (Z0 + Z1) / 2]);

  for (const x of [-3.4, 3.4]) {
    k.cyl(g, [0.08, 0.08, 1.8, 12], M.copper, [x, 3.2, (Z0 + Z1) / 2]);
    k.cyl(g, [0.14, 0.14, 0.2, 12], M.brass, [x, 2.2, (Z0 + Z1) / 2]);
  }

  const rx = -5.4;
  k.box(g, [1.4, 0.6, 0.9], M.steel, [rx, 0.3, -1.8]);
  for (let i = 0; i < 2; i++) {
    k.cyl(g, [0.18, 0.18, 0.5, 14], M.paintYellow, [rx - 0.35 + i * 0.7, 0.85, -1.8]);
  }
  k.tag(g, 'REFINING VAT', { w: 0.85, h: 0.17 }, [-3.4, 1.2, Z1 + 0.2]);

  h.colliders.push(
    { lx: -3.4, lz: (Z0 + Z1) / 2, hw: 2.9, hd: 2.2 },
    { lx: 3.4, lz: (Z0 + Z1) / 2, hw: 2.9, hd: 2.2 },
    { lx: rx, lz: -1.8, hw: 0.8, hd: 0.6 }
  );
  for (const sx of [-6.4, 6.4]) for (const sz of [Z1, Z0]) h.colliders.push({ lx: sx, lz: sz, r: 0.22 });

  return finish(h, [3.2, -1.6, [-2.9, 1.6]]);
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': buildAssayYard,
  'site-2': buildLabellingShed,
  'site-3': buildChargingPot,
  'site-4': buildControlRoom,
  'site-5': buildEffluentSump,
  'site-6': buildChargeFloor,
  'site-7': buildPicklingLine,
  'site-8': buildTappingFloor,
  'site-9': buildRefiningBay
};

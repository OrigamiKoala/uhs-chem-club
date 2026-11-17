/**
 * brinewire/stations.js — The six hosts: the pieces of the marsh's power works a Learn bench is built into.
 *
 * A bench on Brinewire is not a bench in a room. It is a working point of the grid: the rotting pylon base in its brine
 * sump, the dip pool with its row of hung strips, a pair of pools joined by a pipe bridge, the metering shed, the battery
 * bank and the plating works. Each builder returns the machine AND its bench as ONE object, so the overlap rule (which
 * exempts a body's own parts) lets the bench be bolted to the thing it belongs to, and the bay contract (`bench-bay.js`)
 * keeps the volume the plate, the instrument, the screens and the camera need empty.
 *
 * THE HOST FRAME. Origin on the ground under the middle of the plate; +z is the front (toward the spine the player
 * walks in from), +x to the player's right. The world places the group at `site.pos`, turned to face its approach.
 * Machinery stands to the sides (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m behind it; the work lamp
 * hangs over the plate on a boom from a mast at the side. `verify:bench` measures all of it and `verify:brinewire`
 * measures that no host stands outside the extent `host-plan.js` declares for it.
 *
 * ONLY LAMPS ARE LIT. A host's work lamp is a `lampMark` the world pools; nothing here owns a PointLight, and the
 * load lamps on the battery bank are unlit glass.
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is the bench's instrument, cased up: the
 * one clean, bright thing among patina and weathered concrete (`M.case`). Pressing [E] hides the case and opens the table.
 *
 * @returns {{ group, bench, benchLocal, colliders }} `colliders` are host-local discs `{ lx, lz, r }` and boxes
 *   `{ lx, lz, hw, hd }`; the world turns them to its own frame.
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { placard } from '../materials/pbr-kit.js';
import { HOST_PLAN } from './host-plan.js';

const LAMP = 0xd99423;
const UP = new THREE.Vector3(0, 1, 0);

/* ----------------------------------------------------------------- the bench */

/** The bench: the shared bay bench in the host's skin, dressed in the works' steel and dark timber, its cased instrument for `kind`. */
export function buildBwBench(ctx, { kind = 'beaker', plate = 'BRW-01', skin = 'deck' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x, y, z, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    return m;
  };
  return buildBayBench(ctx, {
    skin, plate,
    mats: { top: M.benchTop, dark: M.darkSteel, tray: M.timberDark },
    tagStyle: { fg: '#1c211c', bg: '#cfc9b8' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (...a) => dormant.add(mesh(...a));
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), M.brass, -0.62, height + 0.42, 0.05, [Math.PI / 2, 0, 0]);
      add(new THREE.CircleGeometry(0.13, 22), M.glassDark, -0.62, height + 0.42, 0.072);
      if (kind === 'beaker') {                // a beaker of brine with a rod standing in it and a lead lying beside it
        add(new THREE.CylinderGeometry(0.13, 0.13, 0.24, 20), M.glass, 0.6, y0 + 0.12, 0.1);
        add(new THREE.CylinderGeometry(0.115, 0.115, 0.14, 20), M.water, 0.6, y0 + 0.08, 0.1);
        add(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), M.copper, 0.64, y0 + 0.18, 0.1);
        add(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), M.caseDark, 0.98, y0 + 0.012, 0.28, [0, 0, Math.PI / 2]);
      } else if (kind === 'rack') {           // a rack of three metal strips on a stand
        add(new THREE.BoxGeometry(0.5, 0.03, 0.16), M.caseDark, 0.7, y0 + 0.015, 0.1);
        [M.copper, M.steel, M.brass].forEach((mat, i) => add(new THREE.BoxGeometry(0.08, 0.32, 0.015), mat, 0.55 + i * 0.15, y0 + 0.19, 0.1));
      } else if (kind === 'rig') {            // two small beakers joined by an arched bridge
        add(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 18), M.glass, 0.42, y0 + 0.08, 0.1);
        add(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 18), M.glass, 0.82, y0 + 0.08, 0.1);
        add(new THREE.TorusGeometry(0.2, 0.015, 8, 18, Math.PI), M.glass, 0.62, y0 + 0.12, 0.1);
      } else if (kind === 'meter') {          // a meter case with a dial and a short electrode strip
        add(new THREE.BoxGeometry(0.4, 0.16, 0.28), M.caseDark, 0.5, y0 + 0.08, 0.1);
        add(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 18), M.paint2, 0.5, y0 + 0.17, 0.12, [Math.PI / 2 - 0.5, 0, 0]);
        add(new THREE.BoxGeometry(0.06, 0.3, 0.012), M.copper, 0.95, y0 + 0.15, 0.1);
      } else if (kind === 'load') {           // a lamp on a base and a coil of lead
        add(new THREE.CylinderGeometry(0.1, 0.12, 0.05, 18), M.caseDark, 0.5, y0 + 0.025, 0.1);
        add(new THREE.SphereGeometry(0.1, 14, 10), M.glass, 0.5, y0 + 0.15, 0.1);
        add(new THREE.TorusGeometry(0.07, 0.012, 6, 16), M.copper, 0.88, y0 + 0.02, 0.1, [Math.PI / 2, 0, 0]);
      } else {                                // a supply box with two knobs and a balance pan
        add(new THREE.BoxGeometry(0.4, 0.2, 0.26), M.caseDark, 0.46, y0 + 0.1, 0.1);
        for (const dx of [-0.08, 0.08]) add(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 14), M.brass, 0.46 + dx, y0 + 0.22, 0.12);
        add(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20), M.steel, 0.9, y0 + 0.05, 0.1);
        add(new THREE.CylinderGeometry(0.03, 0.05, 0.05, 12), M.caseDark, 0.9, y0 + 0.025, 0.1);
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
    const t = placard(text, { fg: '#1c211c', bg: '#cfc9b8', ...size });
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
  /** A plank deck under the whole host: ground, so the machines stand on it rather than in it. */
  const slab = (g, [x0, x1, z0, z1]) => {
    const m = box(g, [x1 - x0, 0.1, z1 - z0], M.plank, [(x0 + x1) / 2, 0, (z0 + z1) / 2], null, false);
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
  const bench = buildBwBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
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

/** A walled basin of marsh water: four low walls and a sheet of liquid, the liquid kept clear of the walls. */
function basin(k, g, M, [x0, x1, z0, z1], { wall = M.concrete, liquid = M.water, h = 1.0, t = 0.3, level = 0.72 } = {}) {
  k.box(g, [x1 - x0, h, t], wall, [(x0 + x1) / 2, h / 2, z0]);
  k.box(g, [x1 - x0, h, t], wall, [(x0 + x1) / 2, h / 2, z1]);
  for (const x of [x0, x1]) k.box(g, [t, h, z1 - z0 - t], wall, [x, h / 2, (z0 + z1) / 2]);
  k.box(g, [x1 - x0 - t * 2, 0.05, z1 - z0 - t * 2], liquid, [(x0 + x1) / 2, level, (z0 + z1) / 2], null, false);
}


/* ------------------------------------------------------------------------ 1 */

/** The pylon base: a lattice pylon's four legs anchored in a concrete footing that stands in a rusting brine sump, with a bolted foot plate and a sample jar. */
export function buildPylonBase(w) {
  const h = start(w, 'site-1', 'pylon-base');
  const { k, M, g } = h;
  const Z0 = -9.0, Z1 = -4.2, ZM = -6.6;
  basin(k, g, M, [-5.8, 5.8, Z0, Z1], { level: 0.62, wall: M.concrete });
  k.box(g, [4.6, 0.5, 4.0], M.concrete, [0, 0.25, ZM], null, true);                        // the footing the legs are bolted to
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const lx = sx * 1.7, lz = ZM + sz * 1.5;
    k.box(g, [0.7, 0.14, 0.7], M.rusted, [lx, 0.57, lz]);                                  // the foot plate
    k.box(g, [0.26, 1.6, 0.26], M.rusted, [lx, 1.4, lz]);                                  // the rotted collar
    k.strut(g, [lx, 2.2, lz], [sx * 0.7, 7.4, ZM + sz * 0.6], 0.09, M.steel, 6);           // the leg, drawn in toward the waist
  }
  for (const y of [3.2, 5.2]) {
    const s = 1.7 - (y - 2.2) / 5.2 * 1.0, sz = 1.5 - (y - 2.2) / 5.2 * 0.9;
    k.strut(g, [-s, y, ZM - sz], [s, y, ZM - sz], 0.05, M.darkSteel, 5);
    k.strut(g, [-s, y, ZM + sz], [s, y, ZM + sz], 0.05, M.darkSteel, 5);
    k.strut(g, [-s, y, ZM - sz], [-s, y, ZM + sz], 0.05, M.darkSteel, 5);
    k.strut(g, [s, y, ZM - sz], [s, y, ZM + sz], 0.05, M.darkSteel, 5);
  }
  k.strut(g, [-1.7, 2.2, ZM + 1.5], [-1.1, 4.2, ZM + 1.05], 0.045, M.darkSteel, 5);
  k.cyl(g, [0.5, 0.5, 1.0, 20], M.glass, [4.7, 0.6, -3.6]);                                // the sample jar on its plinth
  k.cyl(g, [0.44, 0.44, 0.6, 20], M.water, [4.7, 0.5, -3.6], null, false);
  k.box(g, [1.2, 0.1, 1.2], M.concrete, [4.7, 0.05, -3.6], null, false);
  k.tag(g, 'PYLON BASE', { w: 0.8, h: 0.18 }, [-3.4, 0.8, Z1 + 0.17]);
  h.colliders.push({ lx: 0, lz: -6.6, hw: 5.8, hd: 2.4 }, { lx: 4.7, lz: -3.6, r: 0.7 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 2 */

/** The dip pool: a long pool under a gantry that hangs a row of metal strips over it on chains. */
export function buildDipPool(w) {
  const h = start(w, 'site-2', 'dip-pool');
  const { k, M, g } = h;
  basin(k, g, M, [-6.3, 6.3, -8.2, -4.6], { level: 0.58, wall: M.concrete });
  for (const sx of [-1, 1]) k.post(g, sx * 6.7, -6.4, 3.7, 0.22);                           // the gantry
  k.box(g, [13.8, 0.16, 0.22], M.darkSteel, [0, 3.7, -6.4]);
  const strips = [M.copper, M.steel, M.brass, M.darkSteel, M.rusted, M.patina, M.copperClad];
  strips.forEach((mat, i) => {
    const x = -4.8 + i * 1.6;
    k.box(g, [0.02, 1.8, 0.02], M.steel, [x, 2.7, -6.4], null, false);                      // the chain
    k.box(g, [0.34, 1.1, 0.04], mat, [x, 1.4, -6.4]);                                       // the strip, its foot under the surface
  });
  k.box(g, [1.6, 0.9, 0.9], M.timberDark, [-5.2, 0.45, -2.8]);                              // the drying rack's bench
  for (let i = 0; i < 3; i++) k.box(g, [0.3, 0.02, 0.5], strips[i * 2], [-5.55 + i * 0.35, 0.92, -2.8], null, false);
  k.tag(g, 'DIP POOL', { w: 0.6, h: 0.16 }, [3.5, 0.8, -4.43]);
  h.colliders.push({ lx: 0, lz: -6.4, hw: 6.9, hd: 2.0 }, { lx: -5.2, lz: -2.8, hw: 0.9, hd: 0.5 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 3 */

/** The pool pair: two lined pools, an arched pipe bridge between them and a cable strung from post to post over a meter. */
export function buildPoolPair(w) {
  const h = start(w, 'site-3', 'pool-pair');
  const { k, M, g } = h;
  basin(k, g, M, [-6.8, -0.8, -8.4, -4.4], { level: 0.62, wall: M.concrete });
  basin(k, g, M, [0.8, 6.8, -8.4, -4.4], { level: 0.62, wall: M.concrete });
  k.pipe(g, [[-3.0, 0.4, -6.4], [-3.0, 1.9, -6.4], [-2.4, 2.5, -6.4], [2.4, 2.5, -6.4], [3.0, 1.9, -6.4], [3.0, 0.4, -6.4]], 0.13, M.glass);   // the bridge
  for (const sx of [-1, 1]) {
    k.post(g, sx * 5.4, -7.6, 2.9, 0.2);                                                    // an electrode post in each pool
    k.cyl(g, [0.07, 0.07, 1.9, 10], M.copper, [sx * 5.4, 1.0, -6.2]);
    k.box(g, [0.3, 0.2, 0.3], M.darkSteel, [sx * 5.4, 2.0, -6.2], null, false);
  }
  k.pipe(g, [[-5.4, 2.9, -7.6], [-5.4, 3.5, -7.6], [5.4, 3.5, -7.6], [5.4, 2.9, -7.6]], 0.04, M.copper);   // the cable
  k.post(g, 0, -8.15, 3.0, 0.16);
  k.box(g, [0.5, 0.4, 0.22], M.case, [0, 3.2, -8.15]);
  k.tag(g, 'POOL A', { w: 0.45, h: 0.15 }, [-3.8, 0.8, -4.23]);
  k.tag(g, 'POOL B', { w: 0.45, h: 0.15 }, [3.8, 0.8, -4.23]);
  h.colliders.push({ lx: -3.8, lz: -6.4, hw: 3.1, hd: 2.1 }, { lx: 3.8, lz: -6.4, hw: 3.1, hd: 2.1 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 4 */

/** The metering shed: an open-fronted concrete shed with a row of dial meters on the back wall, a recorder drum on a plinth and a rack of spare strips. */
export function buildMeteringShed(w) {
  const h = start(w, 'site-4', 'metering-shed');
  const { k, M, g } = h;
  k.box(g, [13.2, 3.3, 0.25], M.concrete, [0, 1.65, -7.45]);
  for (const sx of [-1, 1]) {
    k.box(g, [0.25, 3.3, 5.0], M.concrete, [sx * 6.5, 1.65, -4.9]);
    k.post(g, sx * 6.5, -2.3, 3.4, 0.2);
  }
  k.box(g, [13.6, 0.2, 5.8], M.darkSteel, [0, 3.45, -4.6], [0.06, 0, 0]);
  k.box(g, [8.4, 1.3, 0.1], M.caseDark, [-0.6, 2.0, -7.2]);                                 // the meter board
  for (let i = 0; i < 6; i++) {
    const x = -4.0 + i * 1.4;
    k.cyl(g, [0.46, 0.46, 0.12, 22], M.case, [x, 2.05, -7.1], [Math.PI / 2, 0, 0]);
    k.cyl(g, [0.4, 0.4, 0.02, 22], M.glassDark, [x, 2.05, -7.03], [Math.PI / 2, 0, 0], false);
    k.box(g, [0.03, 0.3, 0.015], M.paint2, [x, 2.1, -7.01], [0, 0, 0.5 + i * 0.35], false);
  }
  k.cyl(g, [0.5, 0.5, 1.1, 20], M.case, [4.4, 1.55, -4.6], [0, 0, Math.PI / 2]);           // the recorder drum
  k.box(g, [1.8, 0.9, 1.2], M.concrete, [4.4, 0.45, -4.6]);                                 // on its plinth
  k.box(g, [1.5, 1.6, 0.4], M.timberDark, [-4.9, 0.85, -4.2]);                              // the rack of spare strips
  [M.copper, M.steel, M.brass, M.darkSteel].forEach((mat, i) => k.box(g, [0.1, 1.2, 0.03], mat, [-5.4 + i * 0.3, 1.05, -3.96], null, false));
  k.tag(g, 'METERING SHED', { w: 0.9, h: 0.2 }, [3.4, 2.7, -7.31]);
  h.colliders.push({ lx: 0, lz: -7.4, hw: 6.3, hd: 0.5 }, { lx: 4.4, lz: -4.6, hw: 1.0, hd: 0.7 }, { lx: -4.9, lz: -4.2, hw: 0.8, hd: 0.3 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 5 */

/** The battery bank: two tiers of big glass-sided cells on a steel rack, a copper busbar along the top and a row of load lamps. */
export function buildBatteryBank(w) {
  const h = start(w, 'site-5', 'battery-bank');
  const { k, M, g } = h;
  const Z = -6.0;
  for (const sx of [-1, 1]) for (const dz of [-1, 1]) k.post(g, sx * 6.2, Z + dz * 1.2, 3.3, 0.16);   // the rack
  for (const y of [0.5, 1.9]) k.box(g, [12.8, 0.1, 2.8], M.darkSteel, [0, y, Z]);
  for (let tier = 0; tier < 2; tier++) {
    const y = 0.55 + tier * 1.4;
    for (let i = 0; i < 6; i++) {
      const x = -5.0 + i * 2.0;
      k.cyl(g, [0.62, 0.62, 1.1, 20], M.glass, [x, y + 0.6, Z]);                           // a glass-sided cell
      k.cyl(g, [0.52, 0.52, 0.8, 20], M.water, [x, y + 0.45, Z], null, false);
      k.cyl(g, [0.6, 0.6, 0.08, 20], M.darkSteel, [x, y + 1.19, Z], null, false);          // its lid
      k.cyl(g, [0.06, 0.06, 0.25, 8], M.copper, [x, y + 1.35, Z - 0.2], null, false);      // and its terminals
      k.cyl(g, [0.06, 0.06, 0.25, 8], M.steel, [x, y + 1.35, Z + 0.2], null, false);
    }
  }
  k.box(g, [12.4, 0.12, 0.12], M.copper, [0, 3.3, Z - 1.1]);                                // the busbar
  for (let i = 0; i < 5; i++) {
    const x = -4.0 + i * 2.0;
    k.cyl(g, [0.12, 0.12, 0.2, 12], M.caseDark, [x, 2.95, Z - 1.1]);                        // the load lamps, hung under it (unlit glass)
    k.cyl(g, [0.16, 0.16, 0.3, 12], M.glass, [x, 2.7, Z - 1.1], null, false);
  }
  k.tag(g, 'BATTERY BANK', { w: 0.9, h: 0.2 }, [-3.4, 0.55, Z + 1.55]);
  h.colliders.push({ lx: 0, lz: Z, hw: 6.6, hd: 1.6 });
  return finish(h, [3.2, -1.6, [-2.9, 1.6]]);
}

/* ------------------------------------------------------------------------ 6 */

/** The plating works: two plating tanks with anode bars across them, a rectifier cabinet, a hoist gantry and a plate hung from its hook. */
export function buildPlatingWorks(w) {
  const h = start(w, 'site-6', 'plating-works');
  const { k, M, g } = h;
  basin(k, g, M, [-6.8, -1.3, -8.8, -5.2], { level: 0.7, wall: M.concrete, h: 1.1 });
  basin(k, g, M, [1.3, 6.8, -8.8, -5.2], { level: 0.7, wall: M.concrete, h: 1.1 });
  for (const sx of [-1, 1]) {
    k.box(g, [4.6, 0.1, 0.1], M.copper, [sx * 4.05, 1.3, -6.5]);                            // the anode bars across
    k.box(g, [0.12, 0.9, 0.5], M.copper, [sx * 5.4, 0.85, -6.5], null, false);
    k.box(g, [0.12, 0.9, 0.5], M.copper, [sx * 2.7, 0.85, -6.5], null, false);
  }
  k.box(g, [1.8, 2.4, 0.9], M.darkSteel, [0, 1.25, -8.3]);                                   // the rectifier cabinet
  for (const dx of [-0.5, 0.5]) k.cyl(g, [0.14, 0.14, 0.06, 14], M.brass, [dx, 1.9, -7.82], [Math.PI / 2, 0, 0], false);
  k.box(g, [0.8, 0.3, 0.04], M.caseDark, [0, 1.35, -7.83], null, false);
  for (const sx of [-1, 1]) k.post(g, sx * 7.0, -4.2, 4.3, 0.22);                           // the hoist gantry
  k.box(g, [14.4, 0.2, 0.26], M.darkSteel, [0, 4.3, -4.2]);
  k.box(g, [0.7, 0.4, 0.5], M.rusted, [-3.0, 4.0, -4.2]);                                    // the trolley
  k.box(g, [0.03, 2.0, 0.03], M.steel, [-3.0, 2.8, -4.2], null, false);                      // its cable
  k.box(g, [0.5, 0.7, 0.05], M.copperClad, [-3.0, 1.45, -4.2]);                              // and the plate on the hook
  k.tag(g, 'PLATING WORKS', { w: 0.95, h: 0.2 }, [0, 0.6, -3.7]);
  h.colliders.push({ lx: -4.05, lz: -7.0, hw: 2.8, hd: 1.9 }, { lx: 4.05, lz: -7.0, hw: 2.8, hd: 1.9 }, { lx: 0, lz: -8.3, hw: 0.9, hd: 0.5 });
  return finish(h, [3.4, -1.8, [-3.1, 1.8]]);
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': buildPylonBase,
  'site-2': buildDipPool,
  'site-3': buildPoolPair,
  'site-4': buildMeteringShed,
  'site-5': buildBatteryBank,
  'site-6': buildPlatingWorks
};

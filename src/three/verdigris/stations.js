/**
 * verdigris/stations.js — The eight hosts: the pieces of the flooded fortress's machinery a Learn bench is built into.
 *
 * A bench on Verdigris is not a bench in a room. It is a working point of the marsh: the sluice gate between two
 * flooded cells, the gauge house with its tide staff, a pair of equal tanks, the valve gallery, the settling basin, the
 * dosing tower, the surge tank and the row of reserve vats. Each builder returns the machine AND its bench as ONE
 * object, so the overlap rule (which exempts a body's own parts) lets the bench be bolted to the thing it belongs to,
 * and the bay contract (`bench-bay.js`) keeps the volume the plate, the instrument, the screens and the camera need empty.
 *
 * THE HOST FRAME. Origin on the ground under the middle of the plate; +z is the front (toward the spine the player
 * walks in from), +x to the player's right. The world places the group at `site.pos`, turned to face its approach.
 * Machinery stands to the sides (|x| > 2.85), behind the plate (z < -2.05), or above 2.4 m behind it; the work lamp
 * hangs over the plate on a boom from a mast at the side. `verify:bench` measures all of it and `verify:verdigris`
 * measures that no host stands outside the extent `host-plan.js` declares for it.
 *
 * ONLY LAMPS ARE LIT. A host's work lamp is a `lampMark` the world pools; nothing here owns a PointLight.
 *
 * THE DORMANT INSTRUMENT. What stands on the plate when nobody is working is the bench's instrument, cased up: the
 * one clean, bright thing among patina and weathered masonry (`M.case`). Pressing [E] hides the case and opens the table.
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

/** The bench: the shared bay bench in the host's skin, dressed in the marsh's patina and dark timber, its cased instrument for `kind`. */
export function buildVdBench(ctx, { kind = 'flask', plate = 'VDG-01', skin = 'deck' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x, y, z, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    return m;
  };
  return buildBayBench(ctx, {
    skin, plate,
    // The works' own dress: patinated plate, dark-painted rims, dark timber trays.
    mats: { top: M.benchTop, dark: M.darkSteel, tray: M.timberDark },
    tagStyle: { fg: '#1c211c', bg: '#c6cdbf' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (...a) => dormant.add(mesh(...a));
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 22), M.brass, -0.62, height + 0.42, 0.05, [Math.PI / 2, 0, 0]);
      add(new THREE.CircleGeometry(0.13, 22), M.glassDark, -0.62, height + 0.42, 0.072);
      if (kind === 'flask') {                 // a flask of marsh water with a probe lying beside it
        add(new THREE.CylinderGeometry(0.1, 0.17, 0.22, 20), M.glass, 0.6, y0 + 0.11, 0.1);
        add(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 14), M.glass, 0.6, y0 + 0.28, 0.1);
        add(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 20), M.water, 0.6, y0 + 0.07, 0.1);
        add(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), M.caseDark, 0.95, y0 + 0.012, 0.28, [0, 0, Math.PI / 2]);
      } else if (kind === 'meter') {          // a meter case with a dial and a tall graduated cylinder
        add(new THREE.BoxGeometry(0.4, 0.16, 0.28), M.caseDark, 0.5, y0 + 0.08, 0.1);
        add(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 18), M.paint2, 0.5, y0 + 0.17, 0.12, [Math.PI / 2 - 0.5, 0, 0]);
        add(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 14), M.glass, 0.9, y0 + 0.18, 0.1);
      } else if (kind === 'race') {           // two wells joined by a short bar
        add(new THREE.CylinderGeometry(0.11, 0.09, 0.1, 18), M.paint2, 0.38, y0 + 0.05, 0.1);
        add(new THREE.CylinderGeometry(0.11, 0.09, 0.1, 18), M.paintBlue, 0.84, y0 + 0.05, 0.1);
        add(new THREE.BoxGeometry(0.42, 0.02, 0.05), M.brass, 0.61, y0 + 0.1, 0.1);
      } else if (kind === 'dish') {           // an evaporating dish with a crust
        add(new THREE.CylinderGeometry(0.2, 0.15, 0.08, 20), M.paint2, 0.6, y0 + 0.04, 0.1);
        add(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), M.bloom, 0.6, y0 + 0.085, 0.1);
      } else if (kind === 'burette') {        // a burette on a stand over a flask
        add(new THREE.CylinderGeometry(0.02, 0.03, 0.46, 8), M.caseDark, 0.46, y0 + 0.23, 0.0);
        add(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 10), M.glass, 0.62, y0 + 0.3, 0.1);
        add(new THREE.BoxGeometry(0.2, 0.012, 0.012), M.caseDark, 0.54, y0 + 0.4, 0.08);
        add(new THREE.CylinderGeometry(0.1, 0.15, 0.2, 18), M.glass, 0.62, y0 + 0.1, 0.1);
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
    const t = placard(text, { fg: '#1c211c', bg: '#c6cdbf', ...size });
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
  const bench = buildVdBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
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
function basin(k, g, M, [x0, x1, z0, z1], { wall = M.stone, liquid = M.water, h = 1.0, t = 0.3, level = 0.72 } = {}) {
  k.box(g, [x1 - x0, h, t], wall, [(x0 + x1) / 2, h / 2, z0]);
  k.box(g, [x1 - x0, h, t], wall, [(x0 + x1) / 2, h / 2, z1]);
  for (const x of [x0, x1]) k.box(g, [t, h, z1 - z0 - t], wall, [x, h / 2, (z0 + z1) / 2]);
  k.box(g, [x1 - x0 - t * 2, 0.05, z1 - z0 - t * 2], liquid, [(x0 + x1) / 2, level, (z0 + z1) / 2], null, false);
}

/* ------------------------------------------------------------------------ 1 */

/** The sluice gate: two flooded cells either side of a masonry wall, the left held higher, a lift gate in the wall and a gantry over it. */
export function buildSluiceGate(w) {
  const h = start(w, 'site-1', 'sluice-gate');
  const { k, M, g } = h;
  const Z0 = -9.0, Z1 = -4.0, ZM = (Z0 + Z1) / 2;
  basin(k, g, M, [-6.8, -0.2, Z0, Z1], { level: 0.86 });
  basin(k, g, M, [0.2, 6.8, Z0, Z1], { level: 0.5 });
  k.box(g, [0.4, 1.0, 1.6], M.stone, [0, 0.5, -8.2]);                             // the dividing wall, in two lengths
  k.box(g, [0.4, 1.0, 1.6], M.stone, [0, 0.5, -4.8]);
  k.box(g, [0.4, 0.3, 2.0], M.darkSteel, [0, 0.15, -6.5]);                        // the sill the water runs over
  for (const z of [-7.7, -5.3]) k.box(g, [0.5, 3.2, 0.5], M.stone, [0, 1.6, z]);  // the gate piers
  k.box(g, [0.55, 0.5, 2.9], M.stone, [0, 3.45, -6.5]);                           // the lintel
  k.box(g, [0.08, 1.7, 1.8], M.patina, [0, 1.55, -6.5]);                          // the gate, raised a hand's breadth off the sill
  k.cyl(g, [0.035, 0.035, 1.2, 8], M.brass, [0, 3.0, -6.5]);                      // its lifting stem
  k.box(g, [0.3, 0.3, 0.3], M.caseDark, [0, 3.85, -6.5]);
  wheel(w, g, 0.34, M.patinaDark, [0, 4.12, -6.5]);
  k.box(g, [0.5, 0.7, 0.5], M.darkSteel, [0, 3.2, -8.55]);                        // the counterweight, hung on a chain off the lintel
  k.strut(g, [0, 3.7, -8.55], [0, 4.0, -6.8], 0.03, M.steel, 6);
  k.tag(g, 'SLUICE', { w: 0.5, h: 0.15 }, [-3.5, 0.8, Z1 + 0.17]);
  k.tag(g, 'SLUICE', { w: 0.5, h: 0.15 }, [3.5, 0.8, Z1 + 0.17]);
  h.colliders.push({ lx: 0, lz: ZM, hw: 7.0, hd: 2.7 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 2 */

/** The gauge house: an open-fronted masonry shed with a tall staff in a stilling well, a scale board on the back wall and a plinth. */
export function buildGaugeHouse(w) {
  const h = start(w, 'site-2', 'gauge-house');
  const { k, M, g } = h;
  k.box(g, [13.2, 3.3, 0.25], M.stone, [0, 1.65, -7.45]);
  for (const sx of [-1, 1]) {
    k.box(g, [0.25, 3.3, 5.0], M.stone, [sx * 6.5, 1.65, -4.9]);
    k.post(g, sx * 6.5, -2.3, 3.4, 0.2);
  }
  k.box(g, [13.6, 0.2, 5.8], M.patina, [0, 3.45, -4.6], [0.06, 0, 0]);
  k.box(g, [6.4, 2.2, 0.1], M.caseDark, [0.4, 1.9, -7.2]);                          // the scale board: marks closing up toward the top
  for (let i = 0; i <= 12; i++) {
    const y = 0.9 + 2.0 * (1 - Math.pow(0.8, i)) / (1 - Math.pow(0.8, 12));
    k.box(g, [i % 4 === 0 ? 0.9 : 0.5, 0.025, 0.02], M.paint2, [-2.3, y, -7.13], null, false);
  }
  k.tube(g, [0.55, 3.6], M.glass, [-5.0, 1.9, -4.4]);                               // the stilling well and the staff in it
  k.box(g, [0.2, 3.5, 0.12], M.paint2, [-5.0, 1.85, -4.4]);
  for (let i = 0; i < 12; i++) k.box(g, [0.3, 0.025, 0.03], M.caseDark, [-5.0, 0.4 + i * 0.28, -4.32], null, false);
  k.box(g, [1.3, 0.3, 1.3], M.darkSteel, [-5.0, 0.15, -4.4]);                       // its footing
  k.box(g, [1.8, 0.9, 1.4], M.stone, [4.5, 0.45, -4.4]);                            // the plinth
  k.box(g, [0.5, 0.35, 0.4], M.copperClad, [4.5, 1.08, -4.4]);                      // and the recorder on it
  k.tag(g, 'GAUGE HOUSE', { w: 0.85, h: 0.2 }, [3.4, 2.4, -7.31]);
  h.colliders.push({ lx: 0, lz: -7.4, hw: 6.3, hd: 0.5 }, { lx: -5.0, lz: -4.4, r: 0.85 }, { lx: 4.5, lz: -4.4, hw: 1.0, hd: 0.8 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 3 */

/** The twin tanks: two equal copper-clad tanks on a timber stage, a manifold between them and a dial on each. */
export function buildTwinTanks(w) {
  const h = start(w, 'site-3', 'twin-tanks');
  const { k, M, g } = h;
  k.box(g, [13.6, 0.4, 4.6], M.timberDark, [0, 0.2, -5.7]);                          // the stage
  for (const sx of [-1, 1]) {
    const X = sx * 3.9;
    k.cyl(g, [1.6, 1.6, 3.2, 28], M.copperClad, [X, 2.0, -5.7]);
    for (const y of [1.2, 2.0, 2.8]) k.cyl(g, [1.64, 1.64, 0.08, 28], M.patinaDark, [X, y, -5.7], null, false);
    k.cone(g, [1.6, 0.6, 28], M.patina, [X, 4.0, -5.7]);
    k.cyl(g, [0.5, 0.5, 0.08, 20], M.case, [X, 2.3, -4.1], [Math.PI / 2, 0, 0]);       // a dial on each, facing the plate
    k.cyl(g, [0.46, 0.46, 0.02, 20], M.glassDark, [X, 2.3, -4.05], [Math.PI / 2, 0, 0]);
    k.box(g, [0.04, 0.34, 0.02], M.paint2, [X, 2.34, -4.03], [0, 0, sx * 0.5], false);
  }
  k.pipe(g, [[-2.3, 1.0, -5.7], [2.3, 1.0, -5.7]], 0.14, M.patinaDark);              // the manifold, with a valve on it
  k.cyl(g, [0.22, 0.22, 0.4, 14], M.brass, [0, 1.0, -5.7]);
  wheel(w, g, 0.26, M.rusted, [0, 1.38, -5.7]);
  k.tag(g, 'TANK A', { w: 0.5, h: 0.15 }, [-3.9, 0.9, -4.07]);
  k.tag(g, 'TANK B', { w: 0.5, h: 0.15 }, [3.9, 0.9, -4.07]);
  h.colliders.push({ lx: 0, lz: -5.7, hw: 6.8, hd: 2.3 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 4 */

/** The valve gallery: a long header on a timber gantry, six branches each with a handwheel, and a drum at the end. */
export function buildValveGallery(w) {
  const h = start(w, 'site-4', 'valve-gallery');
  const { k, M, g } = h;
  k.box(g, [14.0, 0.14, 1.4], M.timber, [0, 2.9, -6.7]);                              // the gantry's walk
  for (const sx of [-1, 1]) for (const dz of [-0.6, 0.6]) k.post(g, sx * 6.6, -6.7 + dz, 2.9, 0.16);
  k.post(g, 0, -7.3, 2.9, 0.16);
  k.box(g, [14.0, 0.06, 0.06], M.darkSteel, [0, 3.6, -7.3]);                          // the handrail
  k.cyl(g, [0.28, 0.28, 13.0, 16], M.patina, [0, 2.0, -6.0], [0, 0, Math.PI / 2]);   // the header
  for (let i = 0; i < 6; i++) {
    const x = -5.0 + i * 2.0;
    k.cyl(g, [0.14, 0.14, 1.7, 12], M.patinaDark, [x, 1.15, -6.0]);                  // a branch to the deck
    k.cyl(g, [0.2, 0.2, 0.3, 12], M.brass, [x, 1.5, -6.0]);
    wheel(w, g, 0.26, M.rusted, [x, 1.75, -6.0]);
    k.box(g, [0.5, 0.18, 0.5], M.darkSteel, [x, 0.14, -6.0]);
  }
  k.cyl(g, [0.7, 0.7, 1.6, 20], M.drumB, [6.3, 0.85, -4.0]);                          // the drum at the end
  k.pipe(g, [[6.3, 1.6, -4.0], [6.3, 2.0, -5.0], [6.0, 2.0, -6.0]], 0.12, M.patinaDark);
  k.tag(g, 'VALVE GALLERY', { w: 0.95, h: 0.2 }, [-5.0, 0.7, -5.7]);
  h.colliders.push({ lx: 0, lz: -6.2, hw: 6.8, hd: 1.0 }, { lx: 6.3, lz: -4.0, r: 0.9 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 5 */

/** The settling basin: a walled basin with a bloomed rim, a rake bridge over it and an outfall weir at one end. */
export function buildSettlingBasin(w) {
  const h = start(w, 'site-5', 'settling-basin');
  const { k, M, g } = h;
  const Z0 = -8.6, Z1 = -4.2;
  basin(k, g, M, [-6.8, 5.2, Z0, Z1], { level: 0.62 });
  k.box(g, [8.6, 0.04, 2.6], M.bloom, [-2.6, 0.67, -6.4], null, false);              // a settled crust on the water
  k.box(g, [0.4, 1.0, 4.4], M.stone, [5.6, 0.5, -6.4]);                                // the outfall weir's wall
  k.box(g, [1.3, 0.16, 3.0], M.darkSteel, [6.2, 0.6, -6.4]);                           // its lip
  k.box(g, [1.1, 0.04, 2.6], M.water, [6.2, 0.72, -6.4], null, false);                // the thin sheet running over it
  k.box(g, [0.3, 0.3, 5.4], M.darkSteel, [-1.0, 1.55, -6.4]);                          // the rake bridge across
  for (const z of [Z0 - 0.3, Z1 + 0.3]) k.post(g, -1.0, z, 1.55, 0.3, M.steel);
  for (let i = 0; i < 5; i++) k.box(g, [0.05, 0.9, 0.05], M.patinaDark, [-1.0, 1.0, -8.2 + i * 0.9]);   // the rake's tines
  k.tag(g, 'SETTLING BASIN', { w: 1.0, h: 0.2 }, [-3.0, 0.7, Z1 + 0.17]);
  h.colliders.push({ lx: -0.9, lz: -6.4, hw: 6.1, hd: 2.4 }, { lx: 6.1, lz: -6.4, hw: 0.8, hd: 1.6 });
  return finish(h, [3.2, -1.6, [-2.9, 1.6]]);
}

/* ------------------------------------------------------------------------ 6 */

/** The dosing tower: a header tank high on a steel frame, a metering pipe down to a receiving vat, and a ladder. */
export function buildDosingTower(w) {
  const h = start(w, 'site-6', 'dosing-tower');
  const { k, M, g } = h;
  const X = 4.8, Z = -6.2;
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) k.post(g, X + dx * 1.1, Z + dz * 1.1, 5.2, 0.18);   // the frame
  for (const y of [1.6, 3.4]) {
    for (const dz of [-1, 1]) k.box(g, [2.4, 0.1, 0.1], M.darkSteel, [X, y, Z + dz * 1.1]);
    for (const dx of [-1, 1]) k.box(g, [0.1, 0.1, 2.4], M.darkSteel, [X + dx * 1.1, y, Z]);
  }
  k.box(g, [2.8, 0.14, 2.8], M.timber, [X, 5.25, Z]);
  k.cyl(g, [1.2, 1.2, 1.6, 24], M.copperClad, [X, 6.15, Z]);                           // the header tank
  k.cone(g, [1.2, 0.5, 24], M.patina, [X, 7.2, Z]);
  k.cyl(g, [0.06, 0.06, 4.0, 10], M.glass, [X, 3.0, Z + 0.3]);                          // the metering pipe, a glass run with marks
  for (let i = 0; i < 8; i++) k.box(g, [0.2, 0.02, 0.02], M.paint2, [X + 0.1, 1.2 + i * 0.4, Z + 0.34], null, false);
  k.cyl(g, [0.14, 0.14, 0.3, 12], M.brass, [X, 5.0, Z + 0.3]);
  wheel(w, g, 0.22, M.rusted, [X, 5.22, Z + 0.3]);
  k.cyl(g, [1.0, 1.0, 1.0, 22], M.copperClad, [X, 0.55, Z]);                           // the receiving vat under it, inside the frame
  k.cyl(g, [0.95, 0.95, 0.04, 22], M.water, [X, 1.0, Z], null, false);
  for (let i = 0; i < 9; i++) k.box(g, [0.5, 0.05, 0.05], M.darkSteel, [X + 1.7, 0.4 + i * 0.5, Z]);   // the ladder
  for (const dz of [-0.25, 0.25]) k.box(g, [0.06, 4.6, 0.06], M.darkSteel, [X + 1.7, 2.3, Z + dz]);
  k.cyl(g, [0.8, 0.8, 1.2, 20], M.patinaDark, [-4.8, 0.65, -5.0]);                    // a spare drum
  k.tag(g, 'DOSING TOWER', { w: 0.9, h: 0.2 }, [-4.8, 1.55, -5.02]);
  h.colliders.push({ lx: X + 0.4, lz: Z, hw: 2.0, hd: 1.4 }, { lx: -4.8, lz: -5.0, r: 0.9 });
  return finish(h, [-3.4, -1.8, [2.9, 1.8]]);
}

/* ------------------------------------------------------------------------ 7 */

/** The surge tank: a domed standpipe that takes a shock and gives it back, an overflow weir and a catch channel. */
export function buildSurgeTank(w) {
  const h = start(w, 'site-7', 'surge-tank');
  const { k, M, g } = h;
  const X = -4.8, Z = -6.3;
  k.cyl(g, [1.4, 1.5, 0.8, 24], M.stone, [X, 0.45, Z]);                                // the standpipe on its footing
  k.cyl(g, [1.0, 1.0, 5.0, 24], M.copperClad, [X, 3.3, Z]);
  for (const y of [2.2, 3.6, 5.0]) k.cyl(g, [1.04, 1.04, 0.08, 24], M.patinaDark, [X, y, Z], null, false);
  k.cone(g, [1.1, 0.7, 24], M.patina, [X, 6.15, Z]);
  k.pipe(g, [[X + 1.0, 1.2, Z], [-1.2, 1.2, Z], [-1.0, 1.0, -7.2]], 0.16, M.patinaDark);   // the line from the standpipe to the weir
  basin(k, g, M, [0.6, 6.6, -8.6, -5.4], { h: 0.8, level: 0.5 });                      // the catch channel
  k.box(g, [0.3, 1.1, 3.2], M.stone, [2.8, 0.55, -7.0]);                               // the overflow weir across it
  k.box(g, [0.1, 0.1, 3.0], M.darkSteel, [2.8, 1.12, -7.0]);
  k.box(g, [2.2, 0.04, 2.8], M.water, [1.7, 0.78, -7.0], null, false);                  // the held side, a step above the far one
  k.tag(g, 'SURGE TANK', { w: 0.8, h: 0.17 }, [-4.8, 0.7, -4.8]);
  h.colliders.push({ lx: X, lz: Z, r: 1.6 }, { lx: 3.6, lz: -7.0, hw: 3.1, hd: 1.7 });
  return finish(h, [3.2, -1.6, [-2.9, 1.6]]);
}

/* ------------------------------------------------------------------------ 8 */

/** The reserve vats: a row of four, each larger than the last, on a masonry stage with a level staff on each. */
export function buildReserveVats(w) {
  const h = start(w, 'site-8', 'reserve-vats');
  const { k, M, g } = h;
  k.box(g, [14.4, 0.5, 4.8], M.stone, [0, 0.25, -5.8]);                                // the stage
  const vats = [[-5.4, 0.9, 2.0], [-1.8, 1.1, 2.4], [1.8, 1.3, 2.8], [5.4, 1.5, 3.2]];
  vats.forEach(([x, r, ht], i) => {
    k.cyl(g, [r, r, ht, 26], i % 2 ? M.copperClad : M.patina, [x, 0.5 + ht / 2, -5.8]);
    k.cyl(g, [r + 0.04, r + 0.04, 0.08, 26], M.patinaDark, [x, 0.5 + ht, -5.8], null, false);
    k.box(g, [0.1, ht, 0.06], M.paint2, [x, 0.5 + ht / 2, -5.8 + r + 0.05]);         // its level staff
    for (let t = 0; t < 8; t++) k.box(g, [0.2, 0.02, 0.02], M.caseDark, [x, 0.7 + t * (ht - 0.4) / 8, -5.8 + r + 0.09], null, false);
  });
  k.pipe(g, [[-4.5, 0.9, -7.4], [4.5, 0.9, -7.4]], 0.12, M.patinaDark);              // the filling line behind them
  k.tag(g, 'RESERVE VATS', { w: 0.9, h: 0.2 }, [0, 0.62, -3.37]);
  h.colliders.push({ lx: 0, lz: -5.8, hw: 7.1, hd: 2.4 });
  return finish(h);
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': buildSluiceGate,
  'site-2': buildGaugeHouse,
  'site-3': buildTwinTanks,
  'site-4': buildValveGallery,
  'site-5': buildSettlingBasin,
  'site-6': buildDosingTower,
  'site-7': buildSurgeTank,
  'site-8': buildReserveVats
};

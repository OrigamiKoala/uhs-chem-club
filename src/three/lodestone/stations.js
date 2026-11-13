/**
 * lodestone/stations.js — The six hosts: the working points of the Fifth's canyon depot, each with its Learn bench built in.
 *
 * THE HOST FRAME. Origin on the ground under the middle of the plate; +z is the front (toward the haul road),
 * +x to the player's right. Machinery stands to the sides (|x| > 2.85), behind the plate (z < -2.05),
 * or above 2.4 m behind it, and strictly inside each site's `extent` in `host-plan.js`.
 *
 * ONLY LAMPS ARE LIT. A host's work lamp is a `lampMark` pooled by the world; nothing owns a PointLight.
 *
 * @returns {{ group, bench, benchLocal, colliders }}
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { HOST_PLAN } from './host-plan.js';

const LAMP = 0xe8a440;
const UP = new THREE.Vector3(0, 1, 0);

/* ----------------------------------------------------------------- the bench */

export function buildLsBench(ctx, { kind = 'vessel', plate = 'LDS-01', skin = 'deck' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x, y, z, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    return m;
  };
  return buildBayBench(ctx, {
    skin,
    plate,
    mats: { top: M.benchTop, dark: M.darkSteel, tray: M.catwalk },
    tagStyle: { fg: '#1a1e24', bg: '#cfd4dc' },
    dormant(dormant, { height }) {
      const y0 = height + 0.045;
      const add = (...a) => dormant.add(mesh(...a));
      const housing = mesh(new THREE.BoxGeometry(1.18, 0.6, 0.44), M.case, -0.35, height + 0.345, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      add(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 22), M.brass, -0.62, height + 0.41, 0.04, [Math.PI / 2, 0, 0]);
      add(new THREE.CircleGeometry(0.12, 22), M.glassDark, -0.62, height + 0.41, 0.062);

      if (kind === 'assay' || kind === 'crusher') {
        add(new THREE.BoxGeometry(0.5, 0.05, 0.24), M.caseDark, 0.66, y0 + 0.025, 0.1);
        [0.5, 0.64, 0.78, 0.92].forEach((x, i) => add(new THREE.BoxGeometry(0.1, 0.06 + i * 0.03, 0.1), M.magnetite, x, y0 + 0.08, 0.1));
      } else if (kind === 'vats' || kind === 'booth') {
        [0.5, 0.7, 0.9].forEach((x, i) => {
          add(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 14), M.glass, x, y0 + 0.11, 0.1);
          add(new THREE.CylinderGeometry(0.052, 0.052, 0.12, 14), [M.drumBlue, M.drumGreen, M.amber][i], x, y0 + 0.07, 0.1);
        });
      } else {
        add(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 18), M.darkSteel, 0.62, y0 + 0.1, 0.1);
        add(new THREE.TorusGeometry(0.1, 0.03, 8, 18), M.copper, 0.62, y0 + 0.22, 0.1, [Math.PI / 2, 0, 0]);
        add(new THREE.BoxGeometry(0.24, 0.12, 0.18), M.caseDark, 0.94, y0 + 0.06, 0.12);
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
  const box = (g, [sx, sy, sz], mat, p, rot = null, shadow = true) =>
    g.add(place(new THREE.Mesh(own(new THREE.BoxGeometry(sx, sy, sz)), mat), p, rot, shadow)) && g.children[g.children.length - 1];
  const cyl = (g, [rt, rb, h, seg = 16], mat, p, rot = null, shadow = true) =>
    g.add(place(new THREE.Mesh(own(new THREE.CylinderGeometry(rt, rb, h, seg)), mat), p, rot, shadow)) && g.children[g.children.length - 1];
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
    for (let i = 1; i < pts.length - 1; i++) g.add(place(new THREE.Mesh(own(new THREE.SphereGeometry(r * 1.02, 10, 8)), mat), pts[i]));
  };
  const footing = (g, x, z, s = 0.34) => box(g, [s + 0.16, 0.05, s + 0.16], M.darkSteel, [x, 0.025, z], null, false);
  const post = (g, x, z, top, s = 0.16, mat = M.darkSteel) => {
    footing(g, x, z, Math.max(0.28, s + 0.14));
    box(g, [s, top - 0.05, s], mat, [x, 0.05 + (top - 0.05) / 2, z]);
  };
    const lamp = (g, x, y, z, { intensity = 8, distance = 12 } = {}) => {
    const mark = new THREE.Object3D();
    mark.position.set(x, y, z);
    mark.userData.lamp = { color: LAMP, intensity, distance, decay: 1.7 };
    g.add(mark);
    w.lamps.push(mark);
    box(g, [0.4, 0.1, 0.2], M.lantern, [x, y + 0.12, z], null, false);
  };
  const lampMast = (g, x, z, { h = 3.7, arm = [0, 0] } = {}) => {
    footing(g, x, z, 0.3);
    cyl(g, [0.045, 0.06, h, 10], M.darkSteel, [x, h / 2, z]);
    strut(g, [x, h - 0.05, z], [x + arm[0], h - 0.05, z + arm[1]], 0.035, M.darkSteel);
    lamp(g, x + arm[0], h - 0.24, z + arm[1]);
  };
  const slab = (g, [x0, x1, z0, z1]) => {
    const m = box(g, [x1 - x0, 0.1, z1 - z0], M.concrete, [(x0 + x1) / 2, 0, (z0 + z1) / 2], null, false);
    m.userData.phys = 'ground';
    return m;
  };
  return { box, cyl, strut, pipe, footing, post, lamp, lampMast, slab, own };
}

function start(w, siteId, name) {
  const k = kitFor(w);
  const plan = HOST_PLAN[siteId];
  const g = new THREE.Group();
  g.name = name;
  const bench = buildLsBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
  g.add(bench.group);
  k.slab(g, [plan.extent[0], plan.extent[1], plan.extent[2], plan.extent[3] - 0.2]);
  return { k, M: w.M, g, bench, colliders: [{ lx: 0, lz: 0, hw: 2.4, hd: 0.65 }] };
}

const finish = (h, mast = [3.2, -1.8, [-2.9, 1.8]]) => {
  h.k.lampMast(h.g, mast[0], mast[1], { arm: mast[2] });
  h.colliders.push({ lx: mast[0], lz: mast[1], r: 0.2 });
  return { group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders };
};

/* ------------------------------------------------------------------------ 1: the assay hut */

export function buildAssayHut(w) {
  const h = start(w, 'site-1', 'assay-hut');
  const { k, M, g } = h;
  const Z = -5.6;
  k.box(g, [8.6, 0.3, 3.6], M.concrete, [0, 0.15, Z]);
  k.box(g, [6.0, 2.8, 2.8], M.rusted, [0, 1.7, Z]);
  k.box(g, [6.4, 0.16, 3.2], M.darkSteel, [0, 3.18, Z]);
  k.box(g, [1.6, 1.0, 0.08], M.glassDark, [-1.6, 2.0, Z + 1.42], null, false);
  k.box(g, [1.0, 2.0, 0.08], M.darkSteel, [1.4, 1.3, Z + 1.42], null, false);
  for (const x of [-3.6, 3.6]) k.box(g, [0.9, 1.8, 0.9], M.steel, [x, 1.2, Z + 0.4]);
  h.colliders.push({ lx: 0, lz: Z, hw: 4.3, hd: 1.8 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 2: the ore crusher's sample deck */

export function buildOreCrusher(w) {
  const h = start(w, 'site-2', 'ore-crusher');
  const { k, M, g } = h;
  const Z = -5.8;
  k.box(g, [9.6, 0.3, 3.4], M.concrete, [0, 0.15, Z]);
  k.box(g, [3.2, 2.2, 2.4], M.darkSteel, [-1.8, 1.4, Z]);
  k.cyl(g, [1.4, 0.7, 1.6, 18], M.rusted, [-1.8, 3.3, Z]);
  k.cyl(g, [0.55, 0.55, 2.6, 16], M.steel, [2.2, 1.6, Z], [0, 0, Math.PI / 2]);
  k.box(g, [1.2, 2.6, 1.0], M.steel, [3.8, 1.6, Z + 0.2]);
  k.pipe(g, [[-0.2, 2.2, Z], [1.0, 2.6, Z], [1.0, 3.4, Z]], 0.1, M.copper);
  h.colliders.push({ lx: 0, lz: Z, hw: 4.8, hd: 1.7 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 3: the leach vats */

export function buildLeachVats(w) {
  const h = start(w, 'site-3', 'leach-vats');
  const { k, M, g } = h;
  const Z = -5.8;
  k.box(g, [10.0, 0.3, 3.6], M.concrete, [0, 0.15, Z]);
  [[-3.2, M.drumBlue], [0, M.steel], [3.2, M.drumGreen]].forEach(([x, mat]) => {
    k.cyl(g, [1.2, 1.25, 2.2, 22], M.steel, [x, 1.4, Z]);
    k.cyl(g, [1.08, 1.08, 0.08, 22], mat, [x, 2.48, Z], null, false);
    k.cyl(g, [1.28, 1.28, 0.1, 22], M.darkSteel, [x, 2.55, Z], null, false);
  });
  k.pipe(g, [[-3.2, 2.9, Z], [-3.2, 3.4, Z], [3.2, 3.4, Z], [3.2, 2.9, Z]], 0.09, M.copper);
  h.colliders.push({ lx: 0, lz: Z, hw: 4.6, hd: 1.4 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 4: the drum-filling gantry */

export function buildDrumGantry(w) {
  const h = start(w, 'site-4', 'drum-gantry');
  const { k, M, g } = h;
  const Z = -5.8;
  k.box(g, [10.0, 0.3, 3.6], M.concrete, [0, 0.15, Z]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(g, sx * 4.2, Z + sz * 1.1, 4.2, 0.22);
  k.box(g, [8.8, 0.3, 0.3], M.steel, [0, 4.25, Z - 1.1]);
  k.box(g, [8.8, 0.3, 0.3], M.steel, [0, 4.25, Z + 1.1]);
  k.box(g, [1.0, 0.6, 2.6], M.darkSteel, [-0.8, 3.8, Z]);
  k.cyl(g, [0.035, 0.035, 1.8, 8], M.darkSteel, [-0.8, 2.6, Z]);
  for (const x of [-2.4, -1.4, 1.2, 2.2]) {
    k.cyl(g, [0.4, 0.4, 1.0, 18], x < 0 ? M.drumBlue : M.drumGreen, [x, 0.8, Z + 0.2]);
  }
  h.colliders.push({ lx: 0, lz: Z, hw: 4.6, hd: 1.5 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 5: the colour-check booth */

export function buildColourBooth(w) {
  const h = start(w, 'site-5', 'colour-booth');
  const { k, M, g } = h;
  const Z = -5.8;
  k.box(g, [9.0, 0.3, 3.4], M.concrete, [0, 0.15, Z]);
  k.box(g, [5.2, 2.9, 2.6], M.darkSteel, [0, 1.75, Z]);
  k.box(g, [4.2, 1.3, 0.08], M.glassDark, [0, 2.0, Z + 1.32], null, false);
  for (const [i, x] of [-1.5, -0.5, 0.5, 1.5].entries()) {
    k.cyl(g, [0.14, 0.14, 0.5, 12], M.glass, [x, 2.0, Z + 1.0], null, false);
    k.cyl(g, [0.12, 0.12, 0.3, 12], [M.drumBlue, M.drumGreen, M.amber, M.rusted][i], [x, 1.9, Z + 1.0], null, false);
  }
  k.box(g, [5.6, 0.16, 3.0], M.steel, [0, 3.28, Z]);
  h.colliders.push({ lx: 0, lz: Z, hw: 4.5, hd: 1.7 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 6: the Coil's control shed */

export function buildCoilShed(w) {
  const h = start(w, 'site-6', 'coil-shed');
  const { k, M, g } = h;
  const Z = -5.8;
  k.box(g, [10.0, 0.3, 3.6], M.concrete, [0, 0.15, Z]);
  k.box(g, [4.4, 2.6, 2.6], M.rusted, [-2.0, 1.6, Z]);
  k.cyl(g, [0.9, 0.9, 1.6, 22], M.copper, [2.6, 1.5, Z], [Math.PI / 2, 0, 0]);
  k.cyl(g, [0.5, 0.5, 1.7, 18], M.darkSteel, [2.6, 1.5, Z], [Math.PI / 2, 0, 0]);
  k.box(g, [0.5, 1.2, 0.5], M.darkSteel, [2.6, 0.6, Z]);
  k.pipe(g, [[-0.2, 2.6, Z], [1.4, 2.6, Z], [1.9, 2.0, Z]], 0.08, M.darkSteel);
  h.colliders.push({ lx: 0, lz: Z, hw: 4.8, hd: 1.6 });
  return finish(h);
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': buildAssayHut,
  'site-2': buildOreCrusher,
  'site-3': buildLeachVats,
  'site-4': buildDrumGantry,
  'site-5': buildColourBooth,
  'site-6': buildCoilShed
};

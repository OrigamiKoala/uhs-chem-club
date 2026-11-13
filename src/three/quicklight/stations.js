/**
 * quicklight/stations.js — The six hosts: storm-belt cracking-yard rigs each Learn bench is built into.
 *
 * THE HOST FRAME. Origin on the ground under the middle of the plate; +z is the front (toward the spine),
 * +x to the player's right. Machinery stands to the sides (|x| > 2.85), behind the plate (z < -2.05),
 * or above 2.4 m behind it, and strictly inside each site's `extent` in `host-plan.js`.
 *
 * ONLY LAMPS ARE LIT. A host's work lamp is a `lampMark` pooled by the world; nothing owns a PointLight.
 *
 * @returns {{ group, bench, benchLocal, colliders }}
 */

import * as THREE from 'three';
import { buildBayBench } from '../bench-bay.js';
import { placard } from '../materials/pbr-kit.js';
import { HOST_PLAN } from './host-plan.js';

const LAMP = 0xe8a440;
const UP = new THREE.Vector3(0, 1, 0);

/* ----------------------------------------------------------------- the bench */

export function buildQlBench(ctx, { kind = 'vessel', plate = 'QKL-01', skin = 'deck' } = {}) {
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

      if (kind === 'vessel') {
        add(new THREE.CylinderGeometry(0.14, 0.14, 0.28, 20), M.glass, 0.56, y0 + 0.14, 0.1);
        add(new THREE.CylinderGeometry(0.125, 0.125, 0.16, 20), M.amber, 0.56, y0 + 0.09, 0.1);
        add(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), M.brass, 0.56, y0 + 0.32, 0.1);
        add(new THREE.BoxGeometry(0.28, 0.14, 0.18), M.caseDark, 0.94, y0 + 0.07, 0.12);
      } else if (kind === 'board') {
        add(new THREE.BoxGeometry(0.54, 0.04, 0.2), M.caseDark, 0.68, y0 + 0.02, 0.1);
        [0.5, 0.68, 0.86].forEach(x => add(new THREE.CylinderGeometry(0.04, 0.04, 0.26, 14), M.copper, x, y0 + 0.15, 0.1));
      } else if (kind === 'plotter') {
        add(new THREE.BoxGeometry(0.46, 0.18, 0.3), M.caseDark, 0.62, y0 + 0.09, 0.1);
        add(new THREE.BoxGeometry(0.36, 0.02, 0.22), M.paint, 0.62, y0 + 0.19, 0.1);
        add(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 10), M.brass, 0.96, y0 + 0.1, 0.12);
      } else if (kind === 'profile') {
        add(new THREE.BoxGeometry(0.52, 0.04, 0.22), M.caseDark, 0.66, y0 + 0.02, 0.1);
        add(new THREE.CylinderGeometry(0.07, 0.1, 0.22, 16), M.rusted, 0.66, y0 + 0.13, 0.1);
        add(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 10), M.copper, 0.94, y0 + 0.04, 0.2, [0, 0, Math.PI / 2]);
      } else if (kind === 'stack') {
        [0.48, 0.68, 0.88].forEach((x, i) => {
          add(new THREE.CylinderGeometry(0.07, 0.07, 0.16 + i * 0.05, 16), M.steel, x, y0 + 0.08 + i * 0.025, 0.1);
        });
      } else {
        add(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 18), M.darkSteel, 0.56, y0 + 0.11, 0.1);
        add(new THREE.TorusGeometry(0.09, 0.016, 8, 18), M.amber, 0.56, y0 + 0.22, 0.1, [Math.PI / 2, 0, 0]);
        add(new THREE.BoxGeometry(0.24, 0.12, 0.18), M.caseDark, 0.9, y0 + 0.06, 0.12);
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
  const tag = (g, text, size, p, ry = 0) => {
    const t = placard(text, { fg: '#1a1e24', bg: '#cfd4dc', ...size });
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
  return { box, cyl, strut, pipe, footing, post, tag, lamp, lampMast, slab, own };
}

function start(w, siteId, name) {
  const k = kitFor(w);
  const plan = HOST_PLAN[siteId];
  const g = new THREE.Group();
  g.name = name;
  const bench = buildQlBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
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

export function buildWatchTower(w) {
  const h = start(w, 'site-1', 'watch-tower');
  const { k, M, g } = h;
  const Z = -5.6;
  k.box(g, [9.2, 0.35, 3.6], M.concrete, [0, 0.175, Z]);
  for (const sx of [-1, 1]) {
    const vx = sx * 2.5;
    k.cyl(g, [1.05, 1.05, 3.2, 20], M.steel, [vx, 1.95, Z]);
    k.cyl(g, [1.1, 1.1, 0.14, 20], M.darkSteel, [vx, 3.6, Z]);
    k.cyl(g, [0.35, 0.35, 0.9, 14], M.glass, [vx, 2.2, Z + 1.08], null, false);
    k.cyl(g, [0.38, 0.38, 0.4, 14], M.amber, [vx, 1.95, Z + 1.08], null, false);
  }
  k.pipe(g, [[-2.5, 3.65, Z], [-2.5, 4.3, Z], [2.5, 4.3, Z], [2.5, 3.65, Z]], 0.11, M.copper);
  k.box(g, [1.5, 2.1, 0.9], M.darkSteel, [0, 1.4, Z - 0.8]);
  k.tag(g, 'WATCH TOWER', { w: 0.95, h: 0.2 }, [0, 0.55, Z + 1.85]);
  h.colliders.push({ lx: 0, lz: Z, hw: 4.6, hd: 1.85 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 2 */

export function buildManifoldDesk(w) {
  const h = start(w, 'site-2', 'manifold-desk');
  const { k, M, g } = h;
  const Z = -5.8;
  k.box(g, [10.8, 0.3, 3.4], M.concrete, [0, 0.15, Z]);
  for (const [i, x] of [-3.6, 0, 3.6].entries()) {
    k.cyl(g, [0.85, 0.85, 2.6 + i * 0.2, 18], M.steel, [x, 1.6 + i * 0.1, Z - 0.4]);
    k.pipe(g, [[x, 2.9 + i * 0.2, Z - 0.4], [x, 3.4, Z - 0.4], [x, 3.4, Z + 0.9], [x, 1.2, Z + 0.9]], 0.09, M.copper);
    k.cyl(g, [0.22, 0.22, 0.06, 14], M.amber, [x, 1.85, Z + 0.95], [Math.PI / 2, 0, 0], false);
  }
  k.pipe(g, [[-4.2, 1.2, Z + 0.9], [4.2, 1.2, Z + 0.9]], 0.12, M.darkSteel);
  k.tag(g, 'FEED MANIFOLD', { w: 1.0, h: 0.2 }, [0, 0.52, Z + 1.75]);
  h.colliders.push({ lx: 0, lz: Z, hw: 5.4, hd: 1.75 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 3 */

export function buildDecayTank(w) {
  const h = start(w, 'site-3', 'decay-tank');
  const { k, M, g } = h;
  const Z = -5.8;
  k.box(g, [10.0, 0.3, 3.6], M.concrete, [0, 0.15, Z]);
  k.cyl(g, [1.5, 1.55, 4.4, 24], M.steel, [-2.2, 2.5, Z]);
  for (const y of [1.4, 2.7, 4.0]) k.cyl(g, [1.56, 1.56, 0.1, 24], M.darkSteel, [-2.2, y, Z], null, false);
  k.pipe(g, [[-0.65, 2.6, Z], [1.4, 2.6, Z], [1.4, 1.5, Z + 0.6]], 0.09, M.copper);
  k.box(g, [2.8, 2.2, 1.4], M.darkSteel, [2.3, 1.4, Z + 0.2]);
  k.box(g, [1.4, 0.85, 0.08], M.paint, [2.3, 1.75, Z + 0.92], null, false);
  k.tag(g, 'DECAY TANK', { w: 0.95, h: 0.2 }, [2.3, 0.55, Z + 0.95]);
  h.colliders.push({ lx: -2.2, lz: Z, r: 1.75 }, { lx: 2.3, lz: Z + 0.2, hw: 1.5, hd: 0.85 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 4 */

export function buildCollisionRig(w) {
  const h = start(w, 'site-4', 'collision-rig');
  const { k, M, g } = h;
  const Z = -5.8;
  k.box(g, [10.8, 0.3, 3.4], M.concrete, [0, 0.15, Z]);
  for (const sx of [-1, 1]) {
    k.cyl(g, [0.95, 0.95, 2.5, 18], M.rusted, [sx * 3.4, 1.55, Z]);
    for (const y of [1.0, 1.55, 2.1]) k.cyl(g, [1.05, 1.05, 0.12, 18], M.copper, [sx * 3.4, y, Z], null, false);
  }
  k.box(g, [2.2, 2.9, 1.8], M.darkSteel, [0, 1.75, Z]);
  k.pipe(g, [[-3.4, 2.8, Z], [-3.4, 3.4, Z], [3.4, 3.4, Z], [3.4, 2.8, Z]], 0.11, M.steel);
  k.tag(g, 'COLLISION RIG', { w: 1.0, h: 0.2 }, [0, 0.55, Z + 1.75]);
  h.colliders.push({ lx: 0, lz: Z, hw: 5.4, hd: 1.75 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 5 */

export function buildStepReactor(w) {
  const h = start(w, 'site-5', 'step-reactor');
  const { k, M, g } = h;
  const Z = -5.8;
  k.box(g, [11.0, 0.3, 3.4], M.concrete, [0, 0.15, Z]);
  const cols = [[-3.6, 2.4, M.steel], [0, 3.6, M.rusted], [3.6, 2.8, M.steel]];
  for (const [x, ht, mat] of cols) {
    k.cyl(g, [0.95, 0.95, ht, 18], mat, [x, 0.3 + ht / 2, Z]);
    k.cyl(g, [1.02, 1.02, 0.12, 18], M.darkSteel, [x, 0.3 + ht, Z], null, false);
  }
  k.pipe(g, [[-3.6, 2.75, Z], [-1.8, 3.1, Z], [0, 3.95, Z]], 0.1, M.copper);
  k.pipe(g, [[0, 3.95, Z], [1.8, 3.4, Z], [3.6, 3.15, Z]], 0.1, M.copper);
  k.tag(g, 'STEP REACTOR', { w: 1.0, h: 0.2 }, [0, 0.55, Z + 1.75]);
  h.colliders.push({ lx: 0, lz: Z, hw: 5.5, hd: 1.75 });
  return finish(h);
}

/* ------------------------------------------------------------------------ 6 */

export function buildCatalystBed(w) {
  const h = start(w, 'site-6', 'catalyst-bed');
  const { k, M, g } = h;
  const Z = -5.8;
  k.box(g, [11.0, 0.3, 3.5], M.concrete, [0, 0.15, Z]);
  k.cyl(g, [1.25, 1.25, 4.8, 20], M.darkSteel, [0, 1.7, Z], [0, 0, Math.PI / 2]);
  for (const x of [-1.8, -0.6, 0.6, 1.8]) {
    k.cyl(g, [1.34, 1.34, 0.14, 20], M.amber, [x, 1.7, Z], [0, 0, Math.PI / 2], false);
  }
  for (const sx of [-1, 1]) {
    k.post(g, sx * 3.8, Z, 3.2, 0.22);
    k.pipe(g, [[sx * 2.4, 1.7, Z], [sx * 3.8, 1.7, Z], [sx * 3.8, 3.1, Z]], 0.11, M.copper);
  }
  k.pipe(g, [[-3.8, 3.1, Z], [3.8, 3.1, Z]], 0.11, M.steel);
  k.tag(g, 'CATALYST BED', { w: 1.0, h: 0.2 }, [0, 0.55, Z + 1.8]);
  h.colliders.push({ lx: 0, lz: Z, hw: 5.5, hd: 1.8 });
  return finish(h);
}

/** Builder per site id. */
export const HOST_BUILDERS = {
  'site-1': buildWatchTower,
  'site-2': buildManifoldDesk,
  'site-3': buildDecayTank,
  'site-4': buildCollisionRig,
  'site-5': buildStepReactor,
  'site-6': buildCatalystBed,
};

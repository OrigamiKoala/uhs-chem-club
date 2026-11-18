/**
 * ember/stations.js — The seven hosts: the geothermal workings hollowed into Ember Reach's caldera wall
 * and the turbine hall at its foot.
 *
 * Each builder returns the machinery AND its `buildBayBench` as ONE object in the host frame:
 *   Origin on the room floor under the middle of the plate; +z toward the player/approach; +x to the right.
 *   Bay envelope kept empty by construction:
 *     |x| < 2.7, z in [-1.95, 0.65], y in [0, 2.4]     (plate, instrument, screens)
 *     |x| < 2.4, z in [0.65, 5.05], y in [0.3, 2.2]    (player and camera)
 *     |x| < 1.2, z in [0.65, 2.75], y in [2.2, 4.6]    (lean-in camera)
 *   All host parts stay inside `HOST_PLAN[siteId].extent` (inside the room's walls with >= 0.2 m clearance).
 *   Only lamps are lit, via `lampMark` in the world's 3-light `LampPool`.
 */

import * as THREE from 'three';
import { BENCH_BAY, buildBayBench, ctxMats } from '../bench-bay.js';
import { HOST_PLAN } from './host-plan.js';

export const BENCH_Z = BENCH_BAY.benchZ;
const LAMP = 0xd99423;
const Y = new THREE.Vector3(0, 1, 0);
const PLATE = { lx: 0, lz: 0, hw: 2.45, hd: 0.68 };

/* ======================================================================
   THE BENCH — shared bay bench with dormant calorimeter dressings
   ====================================================================== */

export function buildErBench(ctx, { kind = 'cup', plate = 'CAL-01', skin = 'shelf' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x = 0, y = 0, z = 0, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    return m;
  };
  return buildBayBench(ctx, {
    skin,
    plate,
    mats: ctxMats(ctx),
    tagStyle: { fg: '#1e1a14', bg: '#d8c9a2' },
    dormant(dormant, { height }) {
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      dormant.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 20), M.brass, -0.62, height + 0.42, 0.05, [Math.PI / 2, 0, 0]));
      dormant.add(mesh(new THREE.CircleGeometry(0.13, 20), M.glassDark, -0.62, height + 0.42, 0.072));
      const cupY = height + 0.045;
      if (kind === 'contact') {
        for (const [x, mat] of [[0.38, M.rusted], [0.72, M.copper]]) {
          dormant.add(mesh(new THREE.BoxGeometry(0.3, 0.24, 0.3), mat, x, cupY + 0.12, 0.12));
          dormant.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.36, 8), M.glass, x, cupY + 0.42, 0.12));
        }
      } else if (kind === 'bonds') {
        dormant.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20), M.brass, 0.55, cupY + 0.3, 0.12, [Math.PI / 2, 0, 0]));
        dormant.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 8), M.caseDark, 0.55, cupY + 0.14, 0.12));
        dormant.add(mesh(new THREE.BoxGeometry(0.06, 0.24, 0.06), M.caseDark, 0.7, cupY + 0.3, 0.12));
      } else if (kind === 'hess') {
        for (let k = 0; k < 3; k++) dormant.add(mesh(new THREE.BoxGeometry(0.46, 0.03, 0.3), k % 2 ? M.paint2 : M.paintYellow, 0.55, cupY + 0.03 + k * 0.045, 0.12));
      } else if (kind === 'cell') {
        for (const x of [0.38, 0.78]) dormant.add(mesh(new THREE.SphereGeometry(0.17, 16, 10), M.glass, x, cupY + 0.19, 0.12));
        dormant.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.26, 10), M.glass, 0.58, cupY + 0.19, 0.12, [0, 0, Math.PI / 2]));
        dormant.add(mesh(new THREE.BoxGeometry(0.07, 0.09, 0.07), M.brass, 0.58, cupY + 0.19, 0.12));
      } else if (kind === 'plot') {
        dormant.add(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.05), M.caseDark, 0.55, cupY + 0.26, 0.04, [-0.4, 0, 0]));
        dormant.add(mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), M.caseDark, 0.55, cupY + 0.05, 0.14));
      } else {
        dormant.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.44, 20), M.insul, 0.55, cupY + 0.22, 0.12));
        for (const y of [0.08, 0.36]) dormant.add(mesh(new THREE.CylinderGeometry(0.208, 0.208, 0.035, 20), M.darkSteel, 0.55, cupY + y, 0.12));
        dormant.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 20), M.darkSteel, 0.55, cupY + 0.465, 0.12));
        dormant.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), M.glass, 0.5, cupY + 0.66, 0.08));
        dormant.add(mesh(new THREE.SphereGeometry(0.022, 8, 6), M.brass, 0.5, cupY + 0.88, 0.08));
      }
    }
  });
}

/* ======================================================================
   PARTS KIT
   ====================================================================== */

function kitFor(w) {
  const own = (...o) => w.own(...o);
  const t4 = w.t4;
  const M = w.M;
  const shade = m => { m.castShadow = m.receiveShadow = t4; return m; };

  const box = (g, [sx, sy, sz], mat, [x, y, z], rot = null, shadow = false) => {
    const m = new THREE.Mesh(own(new THREE.BoxGeometry(sx, sy, sz)), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (shadow) shade(m);
    g.add(m);
    return m;
  };

  const cyl = (g, [rt, rb, h, seg = 14], mat, [x, y, z], rot = null, shadow = false) => {
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(rt, rb, h, seg)), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (shadow) shade(m);
    g.add(m);
    return m;
  };

  const ball = (g, r, mat, [x, y, z]) => {
    const m = new THREE.Mesh(own(new THREE.SphereGeometry(r, 12, 8)), mat);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };

  const strut = (g, a, b, r, mat, seg = 8) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    if (len < 0.01) return null;
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(r, r, len, seg)), mat);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(Y, vb.clone().sub(va).normalize());
    g.add(m);
    return m;
  };

  const pipe = (g, pts, r, mat) => {
    for (let i = 0; i < pts.length - 1; i++) strut(g, pts[i], pts[i + 1], r, mat, 10);
    for (let i = 1; i < pts.length - 1; i++) ball(g, r * 1.03, mat, pts[i]);
  };

  const gauge = (g, x, y, z, r = 0.18, needle = -0.4) => {
    cyl(g, [r, r, 0.06, 18], M.brass, [x, y, z], [Math.PI / 2, 0, 0]);
    const face = new THREE.Mesh(own(new THREE.CircleGeometry(r * 0.85, 18)), M.glassDark);
    face.position.set(x, y, z + 0.032);
    g.add(face);
    const nd = new THREE.Mesh(own(new THREE.BoxGeometry(0.014, r * 0.72, 0.006)), M.paint2);
    nd.position.set(x + Math.sin(-needle) * r * 0.18, y + Math.cos(needle) * r * 0.18, z + 0.038);
    nd.rotation.z = needle;
    g.add(nd);
  };

  const wheel = (g, x, y, z, r = 0.12) => {
    cyl(g, [0.022, 0.022, 0.26, 8], M.brass, [x, y - 0.11, z]);
    const m = new THREE.Mesh(own(new THREE.TorusGeometry(r, 0.018, 6, 14)), M.paintRed);
    m.position.set(x, y + 0.03, z);
    m.rotation.x = Math.PI / 2;
    g.add(m);
  };

  /** Pendant work lamp hung by a steel rod from ceiling height `ceilY` down to `y`. */
  const pendant = (g, x, y, z, ceilY, { intensity = 8, distance = 14 } = {}) => {
    const rodH = Math.max(0.2, ceilY - (y + 0.2));
    cyl(g, [0.018, 0.018, rodH, 6], M.darkSteel, [x, y + 0.2 + rodH / 2, z]);
    cyl(g, [0.16, 0.28, 0.14, 12], M.darkSteel, [x, y + 0.14, z]);
    cyl(g, [0.09, 0.09, 0.18, 10], M.lantern, [x, y, z]);
    const mark = new THREE.Object3D();
    mark.position.set(x, y - 0.08, z);
    mark.userData.lamp = { color: LAMP, intensity, distance, decay: 1.55 };
    g.add(mark);
    w.lamps.push(mark);
  };

  return { box, cyl, ball, strut, pipe, gauge, wheel, pendant };
}

function benchOf(w, siteId) {
  const plan = HOST_PLAN[siteId];
  return buildErBench(w.ctx, { kind: plan.kind, plate: plan.plate, skin: plan.skin });
}

/* ======================================================================
   7. THE TURBINE HALL (site-7, q7-gibbs — Free Energy)
   Full gabled industrial hall at Level 4 (y = 0 m, 16 x 13.4 m, top 6.8 m).
   Behind the plate: stepped steam turbine casing coupled to a ribbed generator.
   Left: angled control console with 4 brass gauges and impulse tubing.
   Right: refractory test furnace with exhaust flue and brass beam balance.
   ====================================================================== */

function buildControlRoom(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'control-room';
  const bench = benchOf(w, 'site-7');
  g.add(bench.group);
  const colliders = [PLATE];

  // STEAM TURBINE CASING (left-rear, z = -2.72, x in [-5.6, -0.4], stays in z[-3.36, -2.08])
  k.box(g, [5.2, 0.55, 1.0], M.concrete, [-3.0, 0.275, -2.72], null, true);
  k.cyl(g, [0.52, 0.52, 2.2, 18], M.clad, [-4.2, 1.15, -2.72], [0, 0, Math.PI / 2], true);
  k.cyl(g, [0.60, 0.60, 2.2, 18], M.steel, [-1.9, 1.22, -2.72], [0, 0, Math.PI / 2], true);
  for (const x of [-5.1, -3.1, -0.9]) k.cyl(g, [0.64, 0.64, 0.08, 18], M.darkSteel, [x, 1.22, -2.72], [0, 0, Math.PI / 2]);
  // Overhead steam admission manifold rising from turbine up to the hall truss line
  k.pipe(g, [[-4.2, 1.65, -2.72], [-4.2, 4.4, -2.72], [-6.8, 4.4, -2.72]], 0.20, M.clad);
  k.wheel(g, -4.2, 2.25, -2.30, 0.14);
  // Coupling shaft to generator
  k.cyl(g, [0.18, 0.18, 1.4, 12], M.darkSteel, [-0.1, 1.22, -2.72], [0, 0, Math.PI / 2]);

  // GENERATOR HOUSING (right-rear, z = -2.72, x in [0.6, 4.8], stays in z[-3.34, -2.10])
  k.box(g, [4.2, 0.55, 1.0], M.concrete, [2.7, 0.275, -2.72], null, true);
  k.cyl(g, [0.58, 0.58, 3.6, 18], M.darkSteel, [2.7, 1.22, -2.72], [0, 0, Math.PI / 2], true);
  for (let x = 1.2; x <= 4.2; x += 0.6) k.cyl(g, [0.62, 0.62, 0.08, 18], M.steel, [x, 1.22, -2.72], [0, 0, Math.PI / 2]);
  // Terminal box & brass busbars on top of generator
  k.box(g, [0.9, 0.42, 0.65], M.steel, [2.7, 2.02, -2.72]);
  for (const dx of [-0.22, 0, 0.22]) k.cyl(g, [0.03, 0.03, 1.6, 8], M.copper, [2.7 + dx, 3.02, -2.72]);
  colliders.push({ lx: -0.4, lz: -2.72, hw: 5.4, hd: 0.6 });

  // CONTROL CONSOLE & GAUGE BOARD (left of bay, x = -5.4, z = -0.5)
  k.box(g, [1.5, 1.05, 2.1], M.darkSteel, [-5.5, 0.525, -0.5], null, true);
  k.box(g, [0.16, 1.1, 1.9], M.steel, [-5.9, 1.55, -0.5]);
  for (let i = 0; i < 4; i++) {
    const gz = -1.15 + i * 0.44;
    k.cyl(g, [0.14, 0.14, 0.05, 16], M.brass, [-5.78, 1.65, gz], [0, 0, Math.PI / 2]);
    k.cyl(g, [0.11, 0.11, 0.055, 16], M.glassDark, [-5.77, 1.65, gz], [0, 0, Math.PI / 2]);
  }
  k.pipe(g, [[-5.5, 1.1, -1.5], [-5.5, 1.1, -2.75]], 0.05, M.copper);
  colliders.push({ lx: -5.5, lz: -0.5, hw: 0.85, hd: 1.15 });

  // TEST FURNACE & BEAM BALANCE (right of bay, x = 5.4, z = -0.6)
  k.box(g, [1.3, 1.35, 1.2], M.brick, [5.4, 0.675, -1.0], null, true);
  k.box(g, [0.55, 0.45, 0.08], M.darkSteel, [5.4, 0.55, -0.38]);
  k.cyl(g, [0.16, 0.18, 4.4, 12], M.rusted, [5.4, 3.55, -1.0]);
  // Balance table forward-right
  k.box(g, [1.1, 0.88, 0.75], M.darkSteel, [5.2, 0.44, 0.25], null, true);
  k.cyl(g, [0.03, 0.04, 0.55, 8], M.brass, [5.2, 1.15, 0.25]);
  k.box(g, [0.68, 0.04, 0.04], M.brass, [5.2, 1.42, 0.25]);
  for (const dx of [-0.3, 0.3]) {
    k.cyl(g, [0.12, 0.10, 0.04, 12], M.copper, [5.2 + dx, 1.08, 0.25]);
    k.strut(g, [5.2 + dx, 1.42, 0.25], [5.2 + dx, 1.10, 0.25], 0.01, M.darkSteel, 6);
  }
  colliders.push({ lx: 5.3, lz: -0.45, hw: 0.85, hd: 1.25 });

  // THREE HIGH-BAY PENDANT LAMPS (one directly over the plate, two flanking)
  k.pendant(g, 0, 3.85, -0.35, 6.7, { intensity: 9, distance: 16 });
  k.pendant(g, -4.6, 4.1, -1.6, 6.7, { intensity: 7, distance: 14 });
  k.pendant(g, 4.6, 4.1, -1.6, 6.7, { intensity: 7, distance: 14 });

  return { group: g, bench, benchLocal: [0, 0, 0], colliders, vents: [] };
}

/* ======================================================================
   PLACEHOLDERS FOR SITES 1..6 (replaced in Phase 4)
   ====================================================================== */

function placeholderHost(siteId) {
  return w => {
    const k = kitFor(w);
    const plan = HOST_PLAN[siteId];
    const g = new THREE.Group();
    g.name = plan.structure;
    const bench = benchOf(w, siteId);
    g.add(bench.group);
    k.pendant(g, 0, 3.75, -0.3, 5.2, { intensity: 8, distance: 15 });
    k.box(g, [4.0, 2.2, 1.0], w.M.steel, [0, 1.1, -2.7], null, true);
    return {
      group: g,
      bench,
      benchLocal: [0, 0, 0],
      colliders: [PLATE, { lx: 0, lz: -2.7, hw: 2.0, hd: 0.5 }],
      vents: []
    };
  };
}

export const HOST_BUILDERS = {
  'site-1': placeholderHost('site-1'),
  'site-2': placeholderHost('site-2'),
  'site-3': placeholderHost('site-3'),
  'site-4': placeholderHost('site-4'),
  'site-5': placeholderHost('site-5'),
  'site-6': placeholderHost('site-6'),
  'site-7': buildControlRoom
};

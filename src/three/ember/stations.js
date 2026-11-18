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
   1. WELLHEAD EXCHANGER GALLERY (site-1, q1-flow — Heat and Temperature)
   Rock-cut steel-ribbed gallery at Level 1 (y = 15 m, 14 x 13 m, top 5.4 m).
   Wellhead -> insulated flowline & hot-water tank -> plate heat exchanger -> tap.
   ====================================================================== */

function buildWellheadExchanger(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'wellhead-exchanger';
  const bench = benchOf(w, 'site-1');
  g.add(bench.group);
  const colliders = [PLATE];
  const vents = [];

  // WELLHEAD ON CELLAR SLAB (left-rear, x = -4.6, z = -2.7)
  k.box(g, [1.8, 0.25, 1.1], M.concrete, [-4.6, 0.125, -2.7], null, true);
  k.cyl(g, [0.24, 0.28, 0.9, 14], M.darkSteel, [-4.6, 0.7, -2.7], null, true);
  k.cyl(g, [0.34, 0.34, 0.12, 14], M.steel, [-4.6, 1.18, -2.7]);
  k.cyl(g, [0.20, 0.20, 0.85, 14], M.steel, [-4.6, 1.65, -2.7], null, true);
  k.cyl(g, [0.32, 0.32, 0.10, 14], M.darkSteel, [-4.6, 2.1, -2.7]);
  k.cyl(g, [0.16, 0.16, 0.6, 12], M.rusted, [-4.6, 2.45, -2.7]);
  k.wheel(g, -4.6, 2.85, -2.7, 0.16);
  k.gauge(g, -4.6, 1.72, -2.42, 0.15, -0.2);
  vents.push({ lx: -4.6, ly: 2.9, lz: -2.7, size: 0.32, rise: 4, life: 5, rate: 0.45, alpha: 0.26 });

  // FLOWLINE ACROSS BEHIND PLATE TO EXCHANGER (z = -2.7, y = 1.65)
  k.pipe(g, [[-4.4, 1.65, -2.7], [3.2, 1.65, -2.7]], 0.16, M.clad);
  for (const x of [-2.4, -0.8, 1.8]) {
    k.box(g, [0.14, 1.48, 0.14], M.darkSteel, [x, 0.74, -2.7], null, true);
  }
  // LAGGED HOT-WATER BUFFER TANK (center-rear, x = 0.4, z = -2.75)
  k.cyl(g, [0.48, 0.48, 1.7, 18], M.insul, [0.4, 1.05, -2.75], null, true);
  for (const y of [0.45, 1.1, 1.7]) k.cyl(g, [0.50, 0.50, 0.06, 18], M.darkSteel, [0.4, y, -2.75]);
  k.box(g, [1.05, 0.2, 1.05], M.concrete, [0.4, 0.1, -2.75]);

  // PLATE HEAT EXCHANGER (right-rear, x in [3.2, 5.4], z = -2.7)
  k.box(g, [2.4, 0.2, 1.0], M.concrete, [4.3, 0.1, -2.7]);
  k.box(g, [0.18, 1.7, 0.95], M.steel, [3.25, 1.05, -2.7], null, true);
  for (let i = 0; i < 11; i++) {
    k.box(g, [0.04, 1.45, 0.82], i % 2 ? M.clad : M.steel, [3.48 + i * 0.15, 1.02, -2.7]);
  }
  k.box(g, [0.16, 1.7, 0.95], M.steel, [5.18, 1.05, -2.7], null, true);
  for (const [y, dz] of [[1.75, -0.35], [1.75, 0.35], [0.38, -0.35], [0.38, 0.35]]) {
    k.cyl(g, [0.025, 0.025, 2.15, 6], M.darkSteel, [4.22, y, -2.7 + dz], [0, 0, Math.PI / 2]);
  }
  // Thermowell outlet & dial stand on right side of bay
  k.pipe(g, [[5.26, 1.65, -2.7], [5.7, 1.65, -2.7], [5.7, 1.15, -0.8]], 0.08, M.copper);
  k.box(g, [0.14, 1.4, 0.14], M.darkSteel, [5.7, 0.7, -0.8], null, true);
  k.gauge(g, 5.7, 1.48, -0.7, 0.16, 0.45);

  colliders.push(
    { lx: 0.4, lz: -2.7, hw: 5.5, hd: 0.6 },
    { lx: 5.7, lz: -0.8, r: 0.35 }
  );

  // TWO PENDANT LAMPS HUNG FROM STEEL RIBS
  k.pendant(g, 0, 3.75, -0.3, 5.3, { intensity: 8, distance: 15 });
  k.pendant(g, 4.2, 3.85, -2.2, 5.3, { intensity: 6, distance: 12 });

  return { group: g, bench, benchLocal: [0, 0, 0], colliders, vents };
}

/* ======================================================================
   2. PERCHED SPRING GALLERY (site-2, q2-calorimetry — Calorimetry)
   Stepped sinter-arch gallery at Level 1 (y = 15 m, 14 x 13 m, top 5.2 m),
   oriented east-west with a 7.6 m railed lake-viewing bay along its north side.
   Behind the plate: perched hot-spring seep basin with sinter curb, davit, lagged bath & scale.
   ====================================================================== */

function buildSpringShelf(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'spring-shelf';
  const bench = benchOf(w, 'site-2');
  g.add(bench.group);
  const colliders = [PLATE];
  const vents = [];

  // PERCHED HOT-SPRING BASIN (behind plate, x in [-4.8, 4.8], z in [-3.3, -2.15])
  // Stone/sinter curb around steaming geothermal water sheet.
  k.box(g, [9.6, 0.42, 0.22], M.sinterWarm, [0, 0.21, -2.22], null, true);
  k.box(g, [9.6, 0.42, 0.22], M.sinterWarm, [0, 0.21, -3.26], null, true);
  k.box(g, [0.24, 0.42, 1.24], M.sinterWarm, [-4.72, 0.21, -2.74], null, true);
  k.box(g, [0.24, 0.42, 1.24], M.sinterWarm, [4.72, 0.21, -2.74], null, true);
  // Water surface inside the basin
  k.box(g, [9.15, 0.06, 0.84], M.water, [0, 0.34, -2.74]);
  // Sinter seep ledges down the back wall
  k.box(g, [3.2, 0.9, 0.24], M.sinterWet, [-1.8, 0.85, -3.26]);
  k.box(g, [2.6, 1.2, 0.24], M.sinterWarm, [2.1, 1.0, -3.26]);
  vents.push(
    { lx: -2.0, ly: 0.45, lz: -2.75, size: 0.48, rise: 3.5, life: 5.5, rate: 0.5, alpha: 0.22 },
    { lx: 2.0, ly: 0.45, lz: -2.75, size: 0.48, rise: 3.5, life: 5.5, rate: 0.5, alpha: 0.22 }
  );

  // SAMPLING DAVIT WITH CHAIN & BASKET (right side, x = 4.2, z = -1.2)
  k.box(g, [0.7, 0.14, 0.7], M.darkSteel, [4.2, 0.07, -1.2]);
  k.cyl(g, [0.09, 0.11, 2.6, 10], M.steel, [4.2, 1.35, -1.2], null, true);
  k.strut(g, [4.2, 2.55, -1.2], [3.5, 2.75, -2.65], 0.06, M.steel);
  k.strut(g, [4.2, 1.75, -1.2], [3.85, 2.65, -1.95], 0.04, M.darkSteel);
  // Chain and sample basket hanging over the spring
  k.strut(g, [3.5, 2.75, -2.65], [3.5, 1.05, -2.65], 0.014, M.brass, 6);
  k.cyl(g, [0.22, 0.18, 0.34, 12], M.perf, [3.5, 0.88, -2.65]);

  // LAGGED CALORIMETER BATH & PLATFORM SCALE (left side, x = -4.2, z = -0.9)
  k.cyl(g, [0.52, 0.52, 1.05, 18], M.insul, [-4.3, 0.525, -1.1], null, true);
  for (const y of [0.22, 0.82]) k.cyl(g, [0.54, 0.54, 0.06, 18], M.darkSteel, [-4.3, y, -1.1]);
  k.cyl(g, [0.56, 0.56, 0.06, 18], M.steel, [-4.3, 1.08, -1.1]);
  k.cyl(g, [0.018, 0.018, 0.7, 8], M.glass, [-4.3, 1.45, -1.1]);
  // Platform scale forward-left
  k.box(g, [0.95, 0.14, 0.95], M.darkSteel, [-4.2, 0.07, 0.15], null, true);
  k.cyl(g, [0.05, 0.06, 1.25, 8], M.steel, [-4.6, 0.72, 0.15]);
  k.gauge(g, -4.6, 1.42, 0.22, 0.17, 0.3);

  colliders.push(
    { lx: 0, lz: -2.74, hw: 4.9, hd: 0.6 },
    { lx: 4.2, lz: -1.2, r: 0.45 },
    { lx: -4.3, lz: -0.5, hw: 0.75, hd: 1.25 }
  );

  // TWO PENDANT LAMPS HUNG FROM SINTER ARCHES
  k.pendant(g, 0, 3.65, -0.3, 5.1, { intensity: 8, distance: 14 });
  k.pendant(g, -3.8, 3.75, -1.8, 5.1, { intensity: 6, distance: 12 });

  return { group: g, bench, benchLocal: [0, 0, 0], colliders, vents };
}

/* ======================================================================
   3. BOILER VAULT (site-3, q3-enthalpy — Reaction Enthalpy)
   Refractory-brick barrel vault at Level 2 (y = 10 m, 13.6 x 13.4 m, top 5.6 m).
   Brick-set horizontal boiler drum, firebox, flue, fuel canister cage, hopper.
   ====================================================================== */

function buildBoilerRoom(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'boiler-room';
  const bench = benchOf(w, 'site-3');
  g.add(bench.group);
  const colliders = [PLATE];

  // BRICK-SET HORIZONTAL BOILER DRUM (behind plate, x in [-2.5, 2.5], z = -2.75)
  k.box(g, [4.6, 0.85, 1.1], M.brick, [0, 0.425, -2.75], null, true);
  k.cyl(g, [0.58, 0.58, 4.4, 18], M.darkSteel, [0, 1.45, -2.75], [0, 0, Math.PI / 2], true);
  for (const x of [-1.8, -0.6, 0.6, 1.8]) k.cyl(g, [0.61, 0.61, 0.08, 18], M.rusted, [x, 1.45, -2.75], [0, 0, Math.PI / 2]);
  // Cast-iron firebox door on the brick front face
  k.box(g, [0.75, 0.55, 0.08], M.darkSteel, [0, 0.45, -2.18]);
  k.box(g, [0.55, 0.35, 0.06], M.rusted, [0, 0.45, -2.13]);
  // Steam dome & brass gauge on top, plus flue rising into the brick vault
  k.cyl(g, [0.34, 0.34, 0.55, 14], M.darkSteel, [0.6, 2.25, -2.75]);
  k.gauge(g, 0.6, 2.3, -2.38, 0.16, 0.5);
  k.cyl(g, [0.24, 0.28, 3.6, 14], M.rusted, [-1.5, 3.65, -2.75]);

  // FUEL CANISTER CAGE (left side, x = -4.6, z = -1.0)
  k.box(g, [1.8, 0.12, 1.3], M.darkSteel, [-4.6, 0.06, -1.0]);
  for (const [dx, dz] of [[-0.85, -0.6], [0.85, -0.6], [-0.85, 0.6], [0.85, 0.6]]) {
    k.box(g, [0.06, 1.9, 0.06], M.darkSteel, [-4.6 + dx, 0.98, -1.0 + dz]);
  }
  k.box(g, [1.8, 0.06, 1.3], M.darkSteel, [-4.6, 1.93, -1.0]);
  // 6 fuel canisters inside the cage
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const mat = (i + j) % 2 ? M.drumB : M.drum;
      k.cyl(g, [0.16, 0.16, 1.15, 12], mat, [-5.05 + i * 0.45, 0.7, -1.25 + j * 0.5], null, true);
      k.cyl(g, [0.05, 0.05, 0.14, 8], M.brass, [-5.05 + i * 0.45, 1.34, -1.25 + j * 0.5]);
    }
  }
  k.pipe(g, [[-4.6, 1.45, -1.6], [-4.6, 1.45, -2.75], [-2.2, 1.45, -2.75]], 0.045, M.copper);

  // FUEL HOPPER & WEIGH TRAY (right side, x = 4.6, z = -1.0)
  for (const [dx, dz] of [[-0.55, -0.5], [0.55, -0.5], [-0.55, 0.5], [0.55, 0.5]]) {
    k.box(g, [0.07, 1.2, 0.07], M.darkSteel, [4.6 + dx, 0.6, -1.0 + dz]);
  }
  k.cyl(g, [0.68, 0.24, 1.05, 4], M.rusted, [4.6, 1.55, -1.0], [0, Math.PI / 4, 0], true);
  k.box(g, [1.1, 0.24, 0.8], M.darkSteel, [4.6, 0.12, -1.0]);

  colliders.push(
    { lx: 0, lz: -2.75, hw: 2.5, hd: 0.62 },
    { lx: -4.6, lz: -1.0, hw: 0.95, hd: 0.7 },
    { lx: 4.6, lz: -1.0, hw: 0.75, hd: 0.65 }
  );

  // TWIN VAULT PENDANT LAMPS
  k.pendant(g, 0, 3.8, -0.35, 5.4, { intensity: 8, distance: 15 });
  k.pendant(g, -3.4, 3.85, -1.6, 5.3, { intensity: 6, distance: 12 });

  return { group: g, bench, benchLocal: [0, 0, 0], colliders, vents: [] };
}

/* ======================================================================
   4. FUMAROLE OVERHANG (site-4, q4-bonds — Bond Enthalpies)
   Wide open-sided basalt overhang at Level 2 (y = 10 m, 15 x 13 m, top 5.8 m).
   Active sulphur fumarole under steel grate, copper cracking coil, hood & flue,
   gauge board and supply drums.
   ====================================================================== */

function buildFumaroleCoil(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'fumarole-coil';
  const bench = benchOf(w, 'site-4');
  g.add(bench.group);
  const colliders = [PLATE];
  const vents = [];

  // ACTIVE SULPHUR FUMAROLE CONE & COPPER CRACKING COIL (center-rear, x = -0.3, z = -2.75)
  const CX = -0.3, CZ = -2.75;
  k.cyl(g, [0.32, 0.62, 0.72, 14], M.sulphur, [CX, 0.36, CZ], null, true);
  k.cyl(g, [0.16, 0.16, 0.1, 10], M.rock, [CX, 0.73, CZ]);
  // Steel frame around the coil
  for (const [dx, dz] of [[-0.78, -0.58], [0.78, -0.58], [-0.78, 0.58], [0.78, 0.58]]) {
    k.box(g, [0.06, 3.4, 0.06], M.darkSteel, [CX + dx, 1.7, CZ + dz], null, true);
  }
  for (const y of [1.1, 3.35]) {
    k.box(g, [1.62, 0.05, 0.05], M.darkSteel, [CX, y, CZ - 0.58]);
    k.box(g, [1.62, 0.05, 0.05], M.darkSteel, [CX, y, CZ + 0.58]);
  }
  // Copper cracking coil rings suspended over the vent throat
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(w.own(new THREE.TorusGeometry(0.46, 0.042, 8, 18)), M.copper);
    ring.position.set(CX, 1.25 + i * 0.28, CZ);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
  }
  // Exhaust hood & flue rising to the basalt overhang
  k.cyl(g, [0.22, 0.62, 0.55, 16], M.steel, [CX, 3.65, CZ]);
  k.cyl(g, [0.18, 0.18, 1.85, 12], M.rusted, [CX, 4.82, CZ]);
  vents.push({ lx: CX, ly: 0.95, lz: CZ, size: 0.42, rise: 3.2, life: 4.5, rate: 0.65, alpha: 0.28 });

  // DUAL-DIAL GAUGE BOARD (right side, x = 4.8, z = -1.2)
  k.box(g, [0.1, 1.85, 0.1], M.darkSteel, [4.3, 0.925, -1.2]);
  k.box(g, [0.1, 1.85, 0.1], M.darkSteel, [5.3, 0.925, -1.2]);
  k.box(g, [1.25, 0.82, 0.12], M.steel, [4.8, 1.45, -1.2], null, true);
  k.gauge(g, 4.48, 1.48, -1.12, 0.18, -0.35);
  k.gauge(g, 5.12, 1.48, -1.12, 0.18, 0.55);
  k.pipe(g, [[CX + 0.46, 1.55, CZ], [3.6, 1.55, CZ], [4.8, 1.15, -1.25]], 0.045, M.copper);

  // SUPPLY DRUMS & HOSE REEL (left side, x = -4.9, z = -1.1)
  k.cyl(g, [0.30, 0.30, 0.92, 16], M.drum, [-4.5, 0.46, -1.1], null, true);
  k.cyl(g, [0.30, 0.30, 0.92, 16], M.drumB, [-5.25, 0.46, -1.1], null, true);
  k.pipe(g, [[-4.5, 0.96, -1.1], [-4.5, 1.25, -2.75], [CX - 0.46, 1.25, CZ]], 0.04, M.rubber);

  colliders.push(
    { lx: -0.4, lz: -2.75, hw: 4.5, hd: 0.65 },
    { lx: 4.8, lz: -1.2, hw: 0.7, hd: 0.25 },
    { lx: -4.85, lz: -1.1, hw: 0.85, hd: 0.45 }
  );

  // TWO PENDANT LAMPS HUNG FROM BASALT OVERHANG
  k.pendant(g, 0, 3.85, -0.3, 5.6, { intensity: 8, distance: 15 });
  k.pendant(g, 4.4, 3.9, -1.6, 5.6, { intensity: 6, distance: 12 });

  return { group: g, bench, benchLocal: [0, 0, 0], colliders, vents };
}

/* ======================================================================
   5. SEPARATOR GANTRY BAY (site-5, q5-hess — Hess's Law)
   Concrete-and-truss pipe gallery at Level 3 (y = 5 m, 14.4 x 13.2 m, top 6.0 m).
   Cyclone separator -> overhead header -> TWO PARALLEL ROUTES (direct vertical shaft
   vs. three-step elbow manifold) meeting at the same floor drain collector.
   ====================================================================== */

function buildSeparatorManifold(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'separator-manifold';
  const bench = benchOf(w, 'site-5');
  g.add(bench.group);
  const colliders = [PLATE];
  const vents = [];

  // CYCLONE SEPARATOR (left-rear, x = -4.5, z = -2.7)
  k.box(g, [1.5, 0.25, 1.1], M.concrete, [-4.5, 0.125, -2.7]);
  for (const [dx, dz] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]]) {
    k.box(g, [0.09, 1.1, 0.09], M.darkSteel, [-4.5 + dx, 0.7, -2.7 + dz]);
  }
  k.cyl(g, [0.56, 0.56, 2.5, 18], M.clad, [-4.5, 2.3, -2.7], null, true);
  k.cyl(g, [0.22, 0.56, 0.55, 16], M.steel, [-4.5, 3.8, -2.7]);
  k.cyl(g, [0.18, 0.18, 1.4, 12], M.rusted, [-4.5, 4.75, -2.7]);
  k.gauge(g, -4.5, 2.0, -2.12, 0.16, -0.4);
  vents.push({ lx: -4.5, ly: 5.3, lz: -2.7, size: 0.36, rise: 3.0, life: 4.5, rate: 0.45, alpha: 0.24 });

  // OVERHEAD STEAM HEADER (running from separator across behind plate at y = 3.25)
  k.pipe(g, [[-4.5, 3.25, -2.7], [4.8, 3.25, -2.7]], 0.16, M.clad);

  // ROUTE A: DIRECT SEALED VERTICAL SHAFT (x = -1.0, z = -2.7)
  k.cyl(g, [0.22, 0.22, 2.85, 16], M.insul, [-1.0, 1.78, -2.7], null, true);
  k.wheel(g, -1.0, 1.85, -2.42, 0.14);

  // ROUTE B: STEPPED THREE-STAGE MANIFOLD (x = 1.4 -> 3.0 -> 4.8, z = -2.7)
  k.pipe(g, [
    [1.4, 3.25, -2.7], [1.4, 2.35, -2.7],
    [3.0, 2.35, -2.7], [3.0, 1.45, -2.7],
    [4.8, 1.45, -2.7], [4.8, 0.42, -2.7]
  ], 0.11, M.copper);
  k.gauge(g, 1.4, 2.55, -2.55, 0.14, 0.2);
  k.gauge(g, 3.0, 1.65, -2.55, 0.14, -0.3);
  k.wheel(g, 4.8, 1.15, -2.52, 0.13);

  // COMMON FLOOR DRAIN COLLECTOR (joining Route A and Route B at the same end state)
  k.box(g, [6.6, 0.32, 0.72], M.concrete, [1.9, 0.16, -2.7], null, true);
  k.pipe(g, [[-1.0, 0.42, -2.7], [4.8, 0.42, -2.7]], 0.13, M.darkSteel);

  colliders.push(
    { lx: -4.5, lz: -2.7, hw: 0.8, hd: 0.6 },
    { lx: 1.9, lz: -2.7, hw: 3.4, hd: 0.48 }
  );

  // TWO GANTRY PENDANT LAMPS
  k.pendant(g, 0, 3.85, -0.35, 5.8, { intensity: 8, distance: 15 });
  k.pendant(g, 3.2, 3.9, -2.0, 5.8, { intensity: 6, distance: 12 });

  return { group: g, bench, benchLocal: [0, 0, 0], colliders, vents };
}

/* ======================================================================
   6. SILENCER EXPANSION ALCOVE (site-6, q6-entropy — Entropy)
   Baffled acoustic concrete alcove at Level 3 (y = 5 m, 14 x 13 m, top 5.6 m),
   oriented west-east with a 7.4 m railed lake-viewing opening on its north side.
   Twin expansion silencers, twin glass expansion bulbs with stopcock, vacuum pump.
   ====================================================================== */

function buildSilencerPair(w) {
  const k = kitFor(w);
  const M = w.M;
  const g = new THREE.Group();
  g.name = 'silencer-pair';
  const bench = benchOf(w, 'site-6');
  g.add(bench.group);
  const colliders = [PLATE];
  const vents = [];

  // TWIN EXPANSION SILENCERS (left-rear & right-rear, x = -3.8 & +3.8, z = -2.7)
  for (const sx of [-3.8, 3.8]) {
    k.box(g, [1.4, 0.3, 1.1], M.concrete, [sx, 0.15, -2.7], null, true);
    k.cyl(g, [0.52, 0.56, 3.4, 18], M.steel, [sx, 2.0, -2.7], null, true);
    for (const y of [0.85, 2.0, 3.15]) k.cyl(g, [0.58, 0.58, 0.08, 18], M.darkSteel, [sx, y, -2.7]);
    k.cyl(g, [0.46, 0.46, 0.85, 16], M.perf, [sx, 4.1, -2.7]);
    vents.push({ lx: sx, ly: 4.5, lz: -2.7, size: 0.45, rise: 3.2, life: 4.5, rate: 0.55, alpha: 0.25 });
  }

  // TWIN GLASS EXPANSION BULBS & BRASS STOPCOCK ON STAND (center-rear, z = -2.7)
  k.box(g, [2.6, 0.85, 0.75], M.darkSteel, [0, 0.425, -2.7], null, true);
  k.ball(g, 0.48, M.glass, [-0.72, 1.45, -2.7]);
  k.ball(g, 0.48, M.glass, [0.72, 1.45, -2.7]);
  k.cyl(g, [0.06, 0.06, 0.55, 10], M.glass, [0, 1.45, -2.7], [0, 0, Math.PI / 2]);
  k.box(g, [0.16, 0.22, 0.16], M.brass, [0, 1.45, -2.7]);
  k.wheel(g, 0, 1.72, -2.7, 0.12);
  k.pipe(g, [[-3.3, 1.45, -2.7], [-1.2, 1.45, -2.7]], 0.07, M.copper);
  k.pipe(g, [[1.2, 1.45, -2.7], [3.3, 1.45, -2.7]], 0.07, M.copper);

  // VACUUM PUMP (left side, x = -4.5, z = -0.8)
  k.box(g, [1.1, 0.35, 0.8], M.concrete, [-4.5, 0.175, -0.8]);
  k.cyl(g, [0.28, 0.28, 0.72, 14], M.darkSteel, [-4.5, 0.68, -0.8], [0, 0, Math.PI / 2], true);
  k.cyl(g, [0.22, 0.22, 0.08, 16], M.brass, [-4.1, 0.68, -0.8], [0, 0, Math.PI / 2]);
  k.pipe(g, [[-4.5, 0.96, -0.8], [-4.5, 1.45, -2.2]], 0.04, M.rubber);

  // GAS CYLINDER RACK (right side, x = 4.6, z = -0.8)
  k.box(g, [1.2, 0.1, 0.7], M.darkSteel, [4.6, 0.05, -0.8]);
  for (const dx of [-0.32, 0, 0.32]) {
    k.cyl(g, [0.13, 0.13, 1.25, 12], M.drum, [4.6 + dx, 0.72, -0.8], null, true);
    k.cyl(g, [0.04, 0.04, 0.12, 8], M.brass, [4.6 + dx, 1.4, -0.8]);
  }

  colliders.push(
    { lx: 0, lz: -2.7, hw: 4.5, hd: 0.62 },
    { lx: -4.5, lz: -0.8, hw: 0.65, hd: 0.5 },
    { lx: 4.6, lz: -0.8, hw: 0.7, hd: 0.45 }
  );

  // TWO ACOUSTIC-BAFFLE PENDANT LAMPS
  k.pendant(g, 0, 3.75, -0.3, 5.4, { intensity: 8, distance: 15 });
  k.pendant(g, -3.5, 3.85, -1.6, 5.4, { intensity: 6, distance: 12 });

  return { group: g, bench, benchLocal: [0, 0, 0], colliders, vents };
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

  // CONTROL CONSOLE & GAUGE BOARD (left of bay, x = -5.5, z = -0.5)
  k.box(g, [1.5, 1.05, 2.1], M.darkSteel, [-5.5, 0.525, -0.5], null, true);
  k.box(g, [0.16, 1.1, 1.9], M.steel, [-5.9, 1.55, -0.5]);
  for (let i = 0; i < 4; i++) {
    const gz = -1.15 + i * 0.44;
    k.cyl(g, [0.14, 0.14, 0.05, 16], M.brass, [-5.78, 1.65, gz], [0, 0, Math.PI / 2]);
    k.cyl(g, [0.11, 0.11, 0.055, 16], M.glassDark, [-5.77, 1.65, gz], [0, 0, Math.PI / 2]);
  }
  k.pipe(g, [[-5.5, 1.1, -1.5], [-5.5, 1.1, -2.72]], 0.05, M.copper);
  colliders.push({ lx: -5.5, lz: -0.5, hw: 0.85, hd: 1.15 });

  // TEST FURNACE & BEAM BALANCE (right of bay, x = 5.4, z = -0.6)
  k.box(g, [1.3, 1.35, 1.2], M.brick, [5.4, 0.675, -1.0], null, true);
  k.box(g, [0.55, 0.45, 0.08], M.darkSteel, [5.4, 0.55, -0.38]);
  k.cyl(g, [0.16, 0.18, 4.4, 12], M.rusted, [5.4, 3.55, -1.0]);
  k.box(g, [1.1, 0.88, 0.75], M.darkSteel, [5.2, 0.44, 0.25], null, true);
  k.cyl(g, [0.03, 0.04, 0.55, 8], M.brass, [5.2, 1.15, 0.25]);
  k.box(g, [0.68, 0.04, 0.04], M.brass, [5.2, 1.42, 0.25]);
  for (const dx of [-0.3, 0.3]) {
    k.cyl(g, [0.12, 0.10, 0.04, 12], M.copper, [5.2 + dx, 1.08, 0.25]);
    k.strut(g, [5.2 + dx, 1.42, 0.25], [5.2 + dx, 1.10, 0.25], 0.01, M.darkSteel, 6);
  }
  colliders.push({ lx: 5.3, lz: -0.45, hw: 0.85, hd: 1.25 });

  // THREE HIGH-BAY PENDANT LAMPS
  k.pendant(g, 0, 3.85, -0.35, 6.7, { intensity: 9, distance: 16 });
  k.pendant(g, -4.6, 4.1, -1.6, 6.7, { intensity: 7, distance: 14 });
  k.pendant(g, 4.6, 4.1, -1.6, 6.7, { intensity: 7, distance: 14 });

  return { group: g, bench, benchLocal: [0, 0, 0], colliders, vents: [] };
}

export const HOST_BUILDERS = {
  'site-1': buildWellheadExchanger,
  'site-2': buildSpringShelf,
  'site-3': buildBoilerRoom,
  'site-4': buildFumaroleCoil,
  'site-5': buildSeparatorManifold,
  'site-6': buildSilencerPair,
  'site-7': buildControlRoom
};
